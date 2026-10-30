// ══════════════════════════════════════════════════════════════════════
//  revenus.js — RNT-272 (D250) : la carte « Épargne et chantiers »,
//  à l'accueil et dans la Banque. Ce que le livret et les chantiers finis
//  versent ce soir, et leur total de la saison. Miroir de
//  Rente/Design/ObjetsRevenus.swift (CarteRevenusPassifs).
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, pourcent, esc } from "../format.js";
import { teintes } from "../ui.js";

const montant = (c, o) => montantBrut(c, o).replace("-", "−");
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONES = {
  jour: I('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h4"/>'),
  livret: I('<path d="M6 18 18 6"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>'),
  chantier: I('<path d="M4 20h16M6 20V10l5-3v13M11 20V5l7 4v11M14 12h1.5M14 15.5h1.5M8 13h.5M8 16.5h.5"/>'),
};

function colonne(titre, icone, jour, detail, total) {
  return `<div class="rv-col">
    <div class="rv-titre">${icone}<span>${esc(titre)}</span></div>
    <div class="rv-jour chiffres ${jour > 0 ? "" : "t2"}">+${montant(jour, { centimes: true })} / jour</div>
    <div class="rv-detail">${esc(detail)}</div>
    ${total > 0 ? `<div class="rv-total">${montant(total)} depuis le début</div>` : ""}
  </div>`;
}

/** La carte (r : ResumeRevenusPassifs du moteur) ; vide si le moteur n'en donne pas. */
export function carteRevenus(r, { id = "revenus" } = {}) {
  if (!r) return "";
  const livret = r.epargneSolde > 0 ? `${montant(r.epargneSolde)} à ${pourcent(r.tauxEpargne, 1)}` : "Vide : vire-y une part";
  const n = r.chantiersFinis;
  const chantiers = n > 0 ? `${n} fini${n > 1 ? "s" : ""}, ${montant(r.chantiersParts)} en parts`
    : r.chantiersParts > 0 ? `${montant(r.chantiersParts)} en travaux`
    : r.chantiersOuverts > 0 ? `${r.chantiersOuverts} à financer dans tes villes` : "Aucun pour l'instant";
  return `<section class="carte carte-revenus" id="${id}" aria-label="Épargne et chantiers : ${esc(montant(r.parJour, { centimes: true }))} ce soir">
    <div class="rv-tete">
      <div><div class="rv-sur">Épargne et chantiers</div>
        <div class="rv-somme"><span class="chiffres ${r.parJour > 0 ? "gain" : "t2"}">+${montant(r.parJour, { centimes: r.parJour < 10_000 })}</span><span class="rv-sous">ce soir</span></div></div>
      <span class="pastille" style="--c:${teintes.argent}">${ICONES.jour}</span>
    </div>
    <div class="filet"></div>
    <div class="rv-cols">
      ${colonne("Livret", ICONES.livret, r.epargneJour, livret, r.totalEpargne)}
      ${colonne("Chantiers", ICONES.chantier, r.chantiersJour, chantiers, r.totalChantiers)}
    </div>
  </section>`;
}
