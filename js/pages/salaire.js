// ══════════════════════════════════════════════════════════════════════
//  salaire.js — RNT-258 (D261) : le taux du focus et son palier de
//  fortune (Bronze → Absolu), dans le Focus et la Banque. Miroir de
//  Rente/Design/ObjetsSalaire.swift (LigneSalairePalier).
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js";
import { teintes } from "../ui.js";

const icone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21l5-2.5 5 2.5-1.5-7.5"/></svg>';

/** La ligne (s : SalairePalierFocus du moteur) ; vide si le moteur n'en donne pas. */
export function ligneSalaire(s, { carte = false, pad = false } = {}) {
  if (!s) return "";
  const pct = Math.round(Math.min(1, Math.max(0, s.part)) * 100);
  const ligne = `<div class="sp-ligne${pad ? " sp-pad" : ""}">
    <span class="pastille" style="--c:${teintes.argent}">${icone}</span>
    <div class="sp-corps">
      <div class="sp-entre"><span class="libelle">Palier ${esc(s.nom)}</span><span class="sp-taux chiffres">${esc(montant(s.tauxHoraire))} / h</span></div>
      <div class="sp-entre"><span class="sp-mult chiffres ${s.multiplicateur > 1 ? "gain" : "t2"}">salaire ${esc(s.valeur)}${s.plafonne ? ", plafonné" : ""}</span>${s.prochain ? `<span class="aide">prochain : ${esc(s.prochain)}</span>` : ""}</div>
      ${s.prochain ? `<div class="rail sp-rail" role="progressbar" aria-label="Vers ${esc(s.prochain)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="--part:${pct / 100};--c:var(--gain)"><i></i></div>` : ""}
      ${s.mouvement ? `<div class="sp-mouvement">${esc(s.mouvement)}</div>` : ""}
      <div class="aide">${esc(s.detail)}</div>
    </div>
  </div>`;
  return carte ? `<section class="carte sp-carte" id="salaire-palier" aria-label="Palier du salaire">${ligne}</section>` : ligne;
}
