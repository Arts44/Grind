// ══════════════════════════════════════════════════════════════════════
//  WASI minimal — ce que le moteur Swift demande au « système » (D186).
//
//  Le moteur compilé en WebAssembly (cible wasip1) croit tourner sur un
//  petit système : il lit l'heure, tire des nombres au hasard, écrit dans
//  la console. On lui donne exactement ça, sans dépendance. Tout ce qu'il
//  pourrait demander d'autre (fichiers, sockets) répond « non pris en
//  charge » : il n'en a pas besoin, la partie passe par les appels JSON.
// ══════════════════════════════════════════════════════════════════════

const ESUCCESS = 0;
const EBADF = 8;
const ENOSYS = 52;

export class Wasi {
  constructor({ console: sortie = console } = {}) {
    this.memoire = null;
    this.sortie = sortie;
    this.tampons = { 1: "", 2: "" };
    this.decodeur = new TextDecoder();
  }

  /** À appeler une fois l'instance créée : le shim lit et écrit dans sa mémoire. */
  lier(instance) {
    this.memoire = instance.exports.memory;
  }

  vue() { return new DataView(this.memoire.buffer); }
  octets() { return new Uint8Array(this.memoire.buffer); }

  /** Les imports « wasi_snapshot_preview1 » que le module réclame, les inconnus compris. */
  imports(module) {
    const connus = this.fonctions();
    const wasi = {};
    for (const imp of WebAssembly.Module.imports(module)) {
      if (imp.module !== "wasi_snapshot_preview1" || imp.kind !== "function") continue;
      wasi[imp.name] = connus[imp.name] ?? (() => ENOSYS);
    }
    return { wasi_snapshot_preview1: wasi };
  }

  fonctions() {
    return {
      // L'heure : en nanosecondes, sur 64 bits. 0 = horloge murale, 1 = monotone.
      clock_time_get: (id, _precision, ptr) => {
        const ns = id === 1 ? BigInt(Math.round(performance.now() * 1e6)) : BigInt(Date.now()) * 1000000n;
        this.vue().setBigUint64(ptr, ns, true);
        return ESUCCESS;
      },
      clock_res_get: (_id, ptr) => {
        this.vue().setBigUint64(ptr, 1000n, true);
        return ESUCCESS;
      },
      random_get: (ptr, n) => {
        // crypto.getRandomValues refuse plus de 65 536 octets d'un coup.
        for (let i = 0; i < n; i += 65536) {
          crypto.getRandomValues(this.octets().subarray(ptr + i, ptr + Math.min(n, i + 65536)));
        }
        return ESUCCESS;
      },
      // Pas d'arguments, pas de variables d'environnement.
      args_sizes_get: (argc, taille) => { this.vue().setUint32(argc, 0, true); this.vue().setUint32(taille, 0, true); return ESUCCESS; },
      args_get: () => ESUCCESS,
      environ_sizes_get: (n, taille) => { this.vue().setUint32(n, 0, true); this.vue().setUint32(taille, 0, true); return ESUCCESS; },
      environ_get: () => ESUCCESS,
      // La sortie : stdout et stderr vont dans la console, ligne par ligne.
      fd_write: (fd, iovs, n, ecrits) => {
        if (fd !== 1 && fd !== 2) return EBADF;
        const v = this.vue();
        let total = 0;
        for (let i = 0; i < n; i++) {
          const ptr = v.getUint32(iovs + i * 8, true);
          const len = v.getUint32(iovs + i * 8 + 4, true);
          this.tampons[fd] += this.decodeur.decode(this.octets().slice(ptr, ptr + len));
          total += len;
        }
        let k;
        while ((k = this.tampons[fd].indexOf("\n")) >= 0) {
          const ligne = this.tampons[fd].slice(0, k);
          this.tampons[fd] = this.tampons[fd].slice(k + 1);
          (fd === 2 ? this.sortie.warn : this.sortie.log).call(this.sortie, "[moteur]", ligne);
        }
        v.setUint32(ecrits, total, true);
        return ESUCCESS;
      },
      fd_fdstat_get: (fd, ptr) => {
        if (fd > 2) return EBADF;
        const v = this.vue();
        v.setUint8(ptr, 2); // caractère (terminal)
        v.setUint16(ptr + 2, 0, true);
        v.setBigUint64(ptr + 8, 0n, true);
        v.setBigUint64(ptr + 16, 0n, true);
        return ESUCCESS;
      },
      fd_close: () => ESUCCESS,
      fd_seek: () => ESUCCESS,
      fd_prestat_get: () => EBADF, // aucun dossier ouvert : le moteur ne lit pas de fichiers
      fd_prestat_dir_name: () => EBADF,
      fd_read: () => EBADF,
      poll_oneoff: () => ENOSYS,
      sched_yield: () => ESUCCESS,
      proc_exit: (code) => { throw new Error(`Le moteur s'est arrêté (code ${code}).`); },
    };
  }
}
