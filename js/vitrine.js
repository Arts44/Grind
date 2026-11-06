// ══════════════════════════════════════════════════════════════════════
//  Ce que je montre sur mon profil (RNT-322, RNT-326) : la carte de fortune
//  choisie, les pilules du titre de saison et du cadre. Partagé par le profil,
//  les réglages et « Personnaliser mon profil » (pages/recompenses.js).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "./format.js";
import { icones } from "./ui.js";
import { carteFortune } from "./cartes-fortune.js";

const lire = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };

/** Des pilules : les gagnées se choisissent, les autres disent comment les gagner (ListeRecompenses). */
export function listeRecompenses(sorte, elements, choisi) {
  return `<div style="display:grid;gap:8px">${elements.map((e) => {
    const coche = choisi === e.id;
    const icone = !e.gagne ? `<span style="width:15px;display:grid;color:var(--texte2)">${icones.verrou}</span>`
      : coche ? `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="var(--accent)"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="var(--fond)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="var(--texte2)" stroke-width="1.6"/></svg>`;
    return `<button class="rangee" data-action="choisirRecompense" data-sorte="${sorte}" data-id="${esc(e.id)}" ${e.gagne ? "" : "disabled"} aria-pressed="${coche}"
      style="gap:10px;width:100%;padding:11px 14px;border-radius:12px;background:var(--puce);${e.gagne ? "" : "opacity:1"}">
      ${icone}<span style="font-size:15px;font-weight:500;color:${e.gagne ? "var(--texte)" : "var(--texte2)"}">${esc(e.nom)}</span>
      <span class="espace"></span>${e.gagne ? "" : `<span class="aide">${esc(e.condition)}</span>`}</button>`;
  }).join("")}</div>`;
}

/** La clé de la carte de fortune mise en avant : « » (la plus haute), « -1 » (aucune) ou un palier (CompteLocal.cleCarteVitrine). */
export const CLE_CARTE_VITRINE = "grind.carteVitrine";

/** Ce que le moteur publie : la carte choisie si je l'ai (acquise), sinon ma plus haute ; { palier, nom } ou { palier: 0 }. */
export function vitrineChoisie(c) {
  const acquises = (c?.fortune ?? []).filter((x) => x.acquise);
  const haute = acquises.reduce((m, x) => Math.max(m, x.palier), -1);
  const brut = lire(CLE_CARTE_VITRINE), choix = brut === "" ? null : Number(brut);
  const palier = choix === null || Number.isNaN(choix) || (choix !== -1 && !acquises.some((x) => x.palier === choix)) ? haute : choix;
  const carte = acquises.find((x) => x.palier === palier);
  return carte && palier > 0 ? { palier, nom: carte.nom } : { palier: 0, nom: "" };
}

/** Une carte à choisir : la carte, son nom, coché si c'est celle qu'on montre. */
export function choixCarte({ palier, nom, romain, actif }) {
  return `<button class="tp-choix vt-carte" data-action="choisirCarteVitrine" data-palier="${palier}" aria-pressed="${actif}">
    <span class="vt-mini">${palier !== "" && palier >= 0 ? carteFortune(palier) : ""}</span>
    <span class="tp-choix-txt"><b>${esc(nom)}</b>${romain ? `<span class="aide">Carte ${esc(romain)}</span>` : ""}</span>
    <span class="tp-choix-etat">${actif ? "\u2713" : ""}</span></button>`;
}

