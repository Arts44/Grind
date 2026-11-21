// ══════════════════════════════════════════════════════════════════════
//  D342 (RNT-404) : ce que montre un profil de départ, sur les deux écrans
//  qui le font choisir (le premier lancement, une nouvelle saison) : sa
//  difficulté mesurée en étoiles, l'âge du départ, la ville imposée, et le
//  choix du secteur de sa boîte (LigneProfilDepart sur l'iPhone).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "./format.js?v=3e8bddd9";
/** D342 : la difficulté mesurée (1 à 5 étoiles), l'âge du départ et la ville imposée. */
export function metaProfil(p) {
  const n = p.etoilesEffectives ?? p.palierEffectif ?? 2;
  const etoiles = [1, 2, 3, 4, 5].map((k) => (k <= n ? "★" : '<span class="vide">☆</span>')).join("");
  return `<span class="profil-meta" aria-label="Difficulté ${n} sur 5, ${p.ageEffectif ?? 25} ans"><span class="etoiles">${etoiles}</span><span>${p.ageEffectif ?? 25} ans</span>${p.villeImposee ? `<span>✈ ${esc(p.villeImposee)}</span>` : ""}</span>`;
}

/** D342 : le choix du secteur de la boîte de départ (le fondateur). */
export function secteursProfil(p, choisi, action) {
  const l = p.secteursAuChoix ?? [];
  if (l.length < 2) return "";
  const c = choisi ?? l[0].id;
  return `<div class="profil-secteurs"><span class="titre">Ta boîte de départ</span>${l.map((x) => `<button class="petit ${x.id === c ? "plein" : ""}" data-action="${action}" data-secteur="${esc(x.id)}" aria-pressed="${x.id === c}">${esc(x.nom)}</button>`).join("")}</div>`;
}
