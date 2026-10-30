// ══════════════════════════════════════════════════════════════════════
//  La vraie météo des ports (D206, RNT-188), comme MeteoMarine.swift sur
//  l'iPhone : au plus une fois par heure, le vent et les rafales
//  (api.open-meteo.com) et la hauteur des vagues (marine-api.open-meteo.com),
//  pour tous les ports d'un coup, gratuits et sans clé. Le moteur les garde
//  (« meteo.recevoir ») et en tire calme, agitée ou tempête ; sans réseau,
//  il retombe sur sa météo estimée et l'écran du port le dit.
// ══════════════════════════════════════════════════════════════════════

const HEURE = 3_600_000;
let derniere = 0;
let enCours = null;

/** Les adresses Open-Meteo pour ces ports (plusieurs coordonnées : une réponse par port, dans l'ordre). */
export function adresses(ports) {
  const lat = ports.map((p) => p.lat.toFixed(4)).join(",");
  const lon = ports.map((p) => p.lon.toFixed(4)).join(",");
  return {
    vent: `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_gusts_10m&wind_speed_unit=kmh`,
    mer: `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height`,
  };
}

/** Les réponses d'Open-Meteo, en mesures pour le moteur (`date` : l'heure de la réception, en ms). */
export function mesures(ports, vent, mer, date) {
  const lv = Array.isArray(vent) ? vent : vent ? [vent] : [];
  const lm = Array.isArray(mer) ? mer : mer ? [mer] : [];
  return ports.map((p, i) => {
    const c = lv[i]?.current;
    if (!c || typeof c.wind_speed_10m !== "number") return null;
    const vagues = lm[i]?.current?.wave_height;
    return { ville: p.ville, ventKmh: c.wind_speed_10m, rafalesKmh: c.wind_gusts_10m ?? c.wind_speed_10m,
      ...(typeof vagues === "number" ? { vaguesM: vagues } : {}), date };
  }).filter(Boolean);
}

/**
 * Va chercher la météo si la dernière a plus d'une heure (ou `forcer`). `jouer` : la commande au moteur ;
 * `maintenant` : l'heure du jeu. Rend vrai si des mesures sont arrivées. Hors ligne : rien, sans erreur.
 */
export function actualiserMeteo(jouer, maintenant, { forcer = false } = {}) {
  if (enCours) return enCours;
  if (!forcer && Date.now() - derniere < HEURE) return Promise.resolve(false);
  derniere = Date.now();
  enCours = (async () => {
    try {
      const ports = (await jouer("meteo.ports", {}, { silencieux: true }))?.ports ?? [];
      if (!ports.length) return false;
      const a = adresses(ports);
      const lire = (url) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const [vent, mer] = await Promise.all([lire(a.vent), lire(a.mer)]);
      const l = mesures(ports, vent, mer, maintenant());
      if (!l.length) return false;
      return !!(await jouer("meteo.recevoir", { mesures: l }, { silencieux: true }));
    } catch {
      return false;
    } finally {
      enCours = null;
    }
  })();
  return enCours;
}
