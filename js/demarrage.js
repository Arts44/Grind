// ══════════════════════════════════════════════════════════════════════
//  D356 : l'entrée du site. Sans import fixe : elle se charge toujours,
//  même quand le reste est d'une autre version ou cassé.
//
//  Elle charge app.js. Si un module ne se lie pas (versions mêlées, fichier
//  cassé), le jeu ne tourne pas à moitié : « Mise à jour en cours… », on
//  bloque toute sauvegarde et toute synchro (__grindModulesCasses), on vide
//  le cache de la version du site, puis on recharge UNE fois (garde dans
//  sessionStorage, 10 min). Au second échec : un message et un bouton, pas
//  de boucle. pages/index.js passe ici aussi quand une page ne se charge pas.
// ══════════════════════════════════════════════════════════════════════
export const VERSION_SITE = "3e8bddd9"; // remplacée par le commit publié (scripts/web-versionner.mjs)
globalThis.__grindVersion = VERSION_SITE;

const CLE = "grind.reparation";
const DELAI = 10 * 60_000;

/** Un échec de module qui vient d'une version mêlée ou cassée (pas d'une coupure de réseau). */
export function estModuleCasse(e) {
  if (!e) return false;
  if (e.name === "SyntaxError") return true; // binding absent, déclaration en double, fichier tronqué
  // Le fichier n'a pas pu être lu : avec du réseau, c'est un fichier d'une autre version (renommé, absent).
  return e.name === "TypeError" && /module|import/i.test(e.message ?? "") && navigator.onLine !== false;
}

function lireGarde() {
  try { return Number(sessionStorage.getItem(CLE) ?? 0); } catch { return Date.now(); } // sans stockage : pas de rechargement
}

/** Un voile sur toute la page (pas dans #app : le jeu déjà lancé pourrait le redessiner par-dessus). */
function ecran(texte, bouton = false) {
  let voile = document.getElementById("maj-voile");
  if (!voile) {
    voile = document.createElement("div");
    voile.id = "maj-voile";
    voile.className = "vide maj-en-cours";
    voile.setAttribute("role", "status");
    document.body.append(voile);
  }
  voile.innerHTML = `<p>${texte}</p>${bouton ? '<button class="bouton" id="maj-reessayer">Réessayer</button>' : ""}`;
  document.getElementById("maj-reessayer")?.addEventListener("click", () => {
    try { sessionStorage.removeItem(CLE); } catch {}
    location.reload();
  });
}

/** Le jeu s'arrête net, puis se recharge une fois sur une version entière. */
export async function reparer(e) {
  if (globalThis.__grindModulesCasses) return;
  globalThis.__grindModulesCasses = true; // app.js : plus aucune sauvegarde ni synchro
  console.error("[grind] module cassé, rechargement :", e);
  const derniere = lireGarde();
  if (Date.now() - derniere < DELAI) {
    ecran("Le jeu n'a pas pu se charger en entier. Ta partie n'a pas été touchée. Réessaie dans un instant.", true);
    return;
  }
  try { sessionStorage.setItem(CLE, String(Date.now())); } catch {}
  ecran("Mise à jour en cours…");
  try {
    // Le cache de la version du site (pas celui du moteur ni des photos, qui ont leur empreinte).
    for (const n of await caches.keys()) if (/^grind-v/.test(n) || /^grind-[0-9a-f]{7}$/.test(n)) await caches.delete(n);
    const r = await navigator.serviceWorker?.getRegistration();
    await r?.update().catch(() => {});
  } catch {}
  location.reload();
}
globalThis.__grindReparer = (e) => (estModuleCasse(e) ? (reparer(e), true) : false);

import("./app.js?v=3e8bddd9").catch((e) => (estModuleCasse(e) ? reparer(e) : ecran("Le jeu n'a pas pu se charger. Vérifie ta connexion.", true)));
