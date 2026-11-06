// ══════════════════════════════════════════════════════════════════════
//  Mode économie — RNT-261 (D253), le pendant de l'iPhone.
//
//  Automatique : actif quand le navigateur demande moins de mouvement
//  (prefers-reduced-motion) ; réglable (Réglages › Apparence) : Toujours,
//  Jamais. Actif, la classe `economie` sur <html> coupe les flous
//  (backdrop-filter) et les animations (jetons.css), et les pages ne se
//  mettent plus à jour chaque seconde mais toutes les cinq (app.js).
// ══════════════════════════════════════════════════════════════════════

export const CLE_ECONOMIE = "rente.economie";
export const CHOIX_ECONOMIE = [
  { id: "automatique", nom: "Automatique" },
  { id: "toujours", nom: "Toujours" },
  { id: "jamais", nom: "Jamais" },
];

const lire = () => { try { return localStorage.getItem(CLE_ECONOMIE); } catch { return null; } };
const mouvementReduit = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

/** Le choix du joueur : automatique, toujours, jamais. */
export const choixEconomie = () => (CHOIX_ECONOMIE.some((c) => c.id === lire()) ? lire() : "automatique");

/** Les effets coûteux sont coupés. */
export function economieActive() {
  const c = choixEconomie();
  return c === "toujours" || (c === "automatique" && mouvementReduit());
}

/** Pose (ou retire) la classe `economie` sur <html>. */
export function appliquerEconomie() {
  try { document.documentElement.classList.toggle("economie", economieActive()); } catch {}
}

export function choisirEconomie(id) {
  try { localStorage.setItem(CLE_ECONOMIE, id); } catch {}
  appliquerEconomie();
}

/** Le pied du réglage : ce que ça coupe, et si c'est actif. */
export function piedEconomie() {
  const actif = economieActive();
  const pourquoi = choixEconomie() === "automatique" && actif ? "Actif : ton appareil demande moins de mouvement." : actif ? "Actif." : "Inactif.";
  return `Coupe les flous et les animations, et ne rafraîchit les comptes à rebours que toutes les 5 secondes. ${pourquoi}`;
}

try { matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", appliquerEconomie); } catch {}
appliquerEconomie();
