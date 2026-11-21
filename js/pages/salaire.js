// ══════════════════════════════════════════════════════════════════════
//  salaire.js — RNT-258 (D261) : le taux du focus et son palier de
//  fortune (Bronze → Absolu), dans le Focus et la Banque. Miroir de
//  Rente/Design/ObjetsSalaire.swift (LigneSalairePalier).
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js?v=3e8bddd9";
import { anneauEtapes } from "../ui.js?v=3e8bddd9";

/** La ligne (s : SalairePalierFocus du moteur) ; vide si le moteur n'en donne pas. */
export function ligneSalaire(s, { carte = false, pad = false } = {}) {
  if (!s) return "";
  const pct = Math.round(Math.min(1, Math.max(0, s.part)) * 100);
  const ligne = `<div class="sp-ligne${pad ? " sp-pad" : ""}">
    ${/* D345 : l'anneau des paliers (un arc par palier, le courant selon le chemin fait) */""}${anneauEtapes({ total: s.nombrePaliers ?? 1, atteint: s.palier ?? 0, part: s.part, taille: 40, libelle: `Palier ${s.nom}, ${(s.palier ?? 0) + 1} sur ${s.nombrePaliers ?? 1}${s.prochain ? `, ${pct} % vers ${s.prochain}` : ""}` })}
    <div class="sp-corps">
      <div class="sp-entre"><span class="libelle">Palier ${esc(s.nom)}</span><span class="sp-taux chiffres">${esc(montant(s.tauxHoraire))} / h</span></div>
      <div class="sp-entre"><span class="sp-mult chiffres ${s.multiplicateur > 1 ? "gain" : "t2"}">salaire ${esc(s.valeur)}${s.plafonne ? ", plafonné" : ""}</span>${s.prochain ? `<span class="aide">prochain : ${esc(s.prochain)}</span>` : ""}</div>
      ${s.mouvement ? `<div class="sp-mouvement">${esc(s.mouvement)}</div>` : ""}
      <div class="aide">${esc(s.detail)}</div>
    </div>
  </div>
  ${/* D347 (Arthur) : sous l'anneau, une barre fine : le chemin vers le prochain palier, lisible même à huit paliers et plus. */""}
  <div class="sp-barre"><span class="jauge-fine" role="img" aria-label="${s.prochain ? `${pct} % vers ${esc(s.prochain)}` : "Dernier palier"}"><i style="--part:${s.prochain ? (pct / 100).toFixed(3) : 1}"></i></span>
    <span class="sp-entre">${s.prochain ? `${pct} % vers ${esc(s.prochain)}` : "Dernier palier atteint"} · palier ${(s.palier ?? 0) + 1} sur ${s.nombrePaliers ?? 1}</span></div>`;
  return carte ? `<section class="carte sp-carte" id="salaire-palier" aria-label="Palier du salaire">${ligne}</section>` : ligne;
}
