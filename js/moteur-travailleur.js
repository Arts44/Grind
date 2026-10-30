// ══════════════════════════════════════════════════════════════════════
//  Le moteur de Grind dans un Web Worker (lot F).
//
//  La page envoie { type: "ouvrir", base } puis des { type: "appel", id,
//  texte } ; le worker répond { type: "progres" | "pret" | "erreur" } puis
//  un { type: "reponse", id, texte | erreur } par appel, dans l'ordre.
//  Le calcul (synchrone, parfois des centaines de ms) se fait ici : la
//  page continue de défiler et de répondre pendant ce temps.
//  Le chargement et l'instanciation sont ceux de moteur.js (un seul code).
// ══════════════════════════════════════════════════════════════════════
import { chargerMoteur, instancier } from "./moteur.js";

let appeler = null;
const enAttente = []; // des appels arrivés avant que le moteur soit prêt (ne devrait pas arriver)

self.addEventListener("message", async ({ data: m }) => {
  if (m.type === "ouvrir") {
    try {
      const { module, balance } = await chargerMoteur(new URL(m.base), (p) => self.postMessage({ type: "progres", p }));
      appeler = await instancier(module, balance);
      self.postMessage({ type: "pret" });
      for (const a of enAttente.splice(0)) repondre(a);
    } catch (e) {
      // Un échec de compilation ou de mémoire ici échouerait aussi sur la page : pas de repli.
      self.postMessage({ type: "erreur", message: e.message, repli: false });
    }
  } else if (m.type === "appel") {
    if (appeler) repondre(m);
    else enAttente.push(m);
  }
});

function repondre({ id, texte }) {
  try {
    self.postMessage({ type: "reponse", id, texte: appeler(texte) });
  } catch (e) {
    self.postMessage({ type: "reponse", id, erreur: e.message });
  }
}
