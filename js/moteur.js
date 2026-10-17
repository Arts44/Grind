// ══════════════════════════════════════════════════════════════════════
//  Le moteur de Grind dans le navigateur (D186).
//
//  `ouvrirMoteur()` charge moteur.wasm et Balance.json, et rend un objet
//  avec une seule méthode : `await moteur.appel({ cmd, ...})`. Le calcul
//  est celui de l'app iPhone (RenteCore, en Swift, compilé en WebAssembly).
//
//  Lot F (le chargement) :
//   - le moteur tourne dans un Web Worker (moteur-travailleur.js) : un
//     calcul lourd (une semaine rattrapée, l'immobilier) ne gèle plus
//     l'interface. Même API qu'avant ; si le navigateur refuse le worker
//     (module worker non pris en charge), le moteur tourne ici, comme avant ;
//   - le module est compilé pendant le téléchargement (compileStreaming) ;
//     au second chargement, il vient du cache du service worker (sw.js),
//     et le navigateur peut reprendre son code compilé ;
//   - moteur.json (écrit par le workflow et scripts/web-construire.sh)
//     donne l'empreinte du moteur : moteur.wasm?v=<empreinte> ne change
//     d'adresse que quand le moteur change, pas à chaque version du site ;
//   - les catalogues (`balance`) ne changent qu'avec le moteur : gardés en
//     mémoire après la première lecture (le texte, relu à chaque fois : une
//     page qui trie son catalogue ne touche pas celui des autres).
//
//  En développement (?moteur=dev), le même moteur tourne en natif derrière
//  le serveur web/tests/serveur-dev.mjs : mêmes réponses, sans WebAssembly.
// ══════════════════════════════════════════════════════════════════════
import { Wasi } from "./wasi.js";

export async function ouvrirMoteur({ base = "./", dev = new URLSearchParams(location.search).get("moteur") === "dev", progres = () => {},
  travailleur = new URLSearchParams(location.search).get("travailleur") !== "0" } = {}) {
  if (dev) return avecCatalogues(moteurDev());
  if (typeof WebAssembly !== "object") throw new Error("Ce navigateur ne sait pas faire tourner le moteur (WebAssembly). Essaie Chrome, Arc, Safari ou Firefox à jour.");
  const racine = new URL(base, location.href);
  if (travailleur && typeof Worker === "function") {
    try {
      return avecCatalogues(await moteurTravailleur(racine, progres));
    } catch (e) {
      if (!e.repli) throw e;
      console.info("[moteur] pas de worker, le moteur tourne sur la page :", e.message);
    }
  }
  const { module, balance } = await chargerMoteur(racine, progres);
  return avecCatalogues(await moteurWasm(module, balance));
}

// MARK: Le chargement (partagé par la page et le worker)

/** L'empreinte et la taille du moteur publié (moteur.json) ; rien en local sans le fichier. */
export async function versionMoteur(racine) {
  try {
    const r = await fetch(new URL("moteur.json", racine), { cache: "no-cache" });
    if (!r.ok) return {};
    const v = await r.json();
    return typeof v?.empreinte === "string" ? v : {};
  } catch {
    return {};
  }
}

/** Le module compilé et le texte de Balance.json. `progres` : { phase: "telechargement", recu, total } puis { phase: "compilation" }. */
export async function chargerMoteur(racine, progres = () => {}) {
  const v = await versionMoteur(racine);
  const suffixe = v.empreinte ? `?v=${v.empreinte}` : "";
  const [module, balance] = await Promise.all([
    compiler(new URL(`moteur.wasm${suffixe}`, racine), v.taille ?? 0, progres),
    fetch(new URL(`Balance.json${suffixe}`, racine)).then((r) => {
      if (!r.ok) throw new Error(`Balance.json introuvable (${r.status}).`);
      return r.text();
    }),
  ]);
  return { module, balance };
}

/**
 * Télécharge et compile en même temps. Déjà en cache (sw.js) : la réponse telle quelle, que le
 * navigateur reconnaît (son code compilé peut resservir). Sinon, on compte les octets au passage
 * pour montrer l'avancement. `taille` : la taille décompressée (moteur.json) ; sans elle,
 * Content-Length, qui compte les octets compressés (depart.js plafonne).
 */
async function compiler(url, taille, progres) {
  let enCache = false;
  try { enCache = typeof caches === "object" && !!(await caches.match(url.href)); } catch {}
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Le moteur n'a pas pu être téléchargé (${r.status}). Recharge la page dans une minute.`);
  const streaming = typeof WebAssembly.compileStreaming === "function" && (r.headers.get("Content-Type") ?? "").startsWith("application/wasm");
  if (enCache || !r.body?.getReader) {
    progres({ phase: "compilation" });
    return streaming ? WebAssembly.compileStreaming(r) : WebAssembly.compile(await r.arrayBuffer());
  }
  const total = taille || Number(r.headers.get("Content-Length")) || 0;
  let recu = 0;
  const compte = r.body.pipeThrough(new TransformStream({
    transform(morceau, sortie) {
      recu += morceau.length;
      progres({ phase: "telechargement", recu, total });
      sortie.enqueue(morceau);
    },
    flush() { progres({ phase: "compilation" }); },
  }));
  if (streaming) return WebAssembly.compileStreaming(new Response(compte, { headers: { "Content-Type": "application/wasm" } }));
  return WebAssembly.compile(await new Response(compte).arrayBuffer());
}

// MARK: Le moteur WebAssembly

/** Le moteur WebAssembly, à partir de son module (ou de ses octets) et du texte de Balance.json. */
export async function moteurWasm(moduleOuOctets, balance) {
  const brut = await instancier(moduleOuOctets, balance);
  return {
    genre: "wasm",
    async appel(requete) {
      return JSON.parse(brut(JSON.stringify(requete)));
    },
  };
}

/** Instancie le module, initialise le moteur ; rend `texte de requête → texte de réponse` (synchrone). */
export async function instancier(moduleOuOctets, balance, { console: sortie = console } = {}) {
  const module = moduleOuOctets instanceof WebAssembly.Module ? moduleOuOctets : await WebAssembly.compile(moduleOuOctets);
  const wasi = new Wasi({ console: sortie });
  const instance = await WebAssembly.instantiate(module, wasi.imports(module));
  wasi.lier(instance);
  const x = instance.exports;
  x._initialize?.(); // module « reactor » : prépare le runtime Swift

  const encodeur = new TextEncoder();
  const decodeur = new TextDecoder();

  // Copier la requête dans la mémoire du module, appeler, relire la réponse.
  function passer(fonction, texte) {
    const o = encodeur.encode(texte);
    const p = x.rente_alloc(o.length);
    new Uint8Array(x.memory.buffer, p, o.length).set(o);
    const n = fonction(p, o.length);
    x.rente_free(p);
    const r = x.rente_resultat();
    return decodeur.decode(new Uint8Array(x.memory.buffer, r, n));
  }

  const init = JSON.parse(passer(x.rente_init, balance));
  if (!init.ok) throw new Error(init.erreur);
  return (texte) => passer(x.rente_appel, texte);
}

// MARK: Le moteur dans un worker

/**
 * Le moteur dans moteur-travailleur.js : la même API, par messages. Une erreur avec `repli`
 * (le worker n'a pas pu démarrer) laisse ouvrirMoteur faire tourner le moteur sur la page.
 */
export function moteurTravailleur(racine, progres = () => {}) {
  return new Promise((ok, echec) => {
    let w;
    try {
      w = new Worker(new URL("./moteur-travailleur.js", import.meta.url), { type: "module", name: "moteur" });
    } catch (e) {
      return echec(Object.assign(new Error(e.message), { repli: true }));
    }
    const attente = new Map();
    let suivant = 1;
    let pret = false;
    let mort = null;
    const moteur = {
      genre: "wasm",
      travailleur: w,
      appel(requete) {
        if (mort) return Promise.reject(mort);
        const id = suivant++;
        return new Promise((resoudre, rejeter) => {
          attente.set(id, { resoudre, rejeter });
          w.postMessage({ type: "appel", id, texte: JSON.stringify(requete) });
        });
      },
    };
    const abandonner = (e) => {
      mort = e;
      for (const a of attente.values()) a.rejeter(e);
      attente.clear();
    };
    w.addEventListener("message", ({ data: m }) => {
      if (m.type === "reponse") {
        const a = attente.get(m.id);
        attente.delete(m.id);
        if (!a) return;
        if (m.erreur) a.rejeter(new Error(m.erreur));
        else a.resoudre(JSON.parse(m.texte));
      } else if (m.type === "progres") progres(m.p);
      else if (m.type === "pret") { pret = true; ok(moteur); }
      else if (m.type === "erreur") { w.terminate(); echec(Object.assign(new Error(m.message), { repli: !!m.repli })); }
    });
    w.addEventListener("error", (ev) => {
      ev.preventDefault?.();
      const e = new Error(ev.message || "le worker du moteur s'est arrêté");
      if (!pret) { w.terminate(); return echec(Object.assign(e, { repli: true })); }
      abandonner(e);
    });
    w.postMessage({ type: "ouvrir", base: racine.href });
  });
}

// MARK: Les catalogues gardés

/** Les catalogues (`balance`) ne dépendent que du moteur : une lecture par catalogue et par visite. */
export function avecCatalogues(moteur) {
  const textes = new Map();
  const appel = moteur.appel.bind(moteur);
  return Object.assign(moteur, {
    async appel(requete) {
      if (requete?.cmd !== "balance" || typeof requete.partie !== "string") return appel(requete);
      const t = textes.get(requete.partie);
      if (t) return JSON.parse(t);
      const r = await appel(requete);
      if (r?.ok) textes.set(requete.partie, JSON.stringify(r));
      return r;
    },
    catalogues: textes,
  });
}

function moteurDev() {
  return {
    genre: "dev",
    async appel(requete) {
      const r = await fetch("/__moteur", { method: "POST", body: JSON.stringify(requete) });
      return r.json();
    },
  };
}
