// ══════════════════════════════════════════════════════════════════════
//  profil-cartes.js — D454 (Arthur, 20/11) : le profil en cartes.
//
//  Le profil d'un joueur (pages/joueurs.js) et le tien (pages/profil.js)
//  ont la même structure : en haut la carte de profil et la vitrine, puis
//  des cartes (une icône, un titre, un résumé chiffré) qui ouvrent chacune
//  leur page : ses biens, boîtes et activité, palmarès, entre vous (ton
//  profil : réglages). Les résumés viennent du moteur (CartesProfil,
//  RenteCore) ; l'iPhone : Rente/Ecrans/ProfilCartes.swift.
//
//  Ici : la grille des cartes, la ligne de prestige, les trois chiffres du
//  haut, les pilules d'action, et le style commun (préfixe pc-).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "./format.js?v=3e8bddd9";
import { dessinJeu } from "./icones-jeu.js?v=3e8bddd9";

/** Les icônes des cartes : celles du jeu (Reicon : Actifs, Activité, Joueurs, Réglages), un trophée pour le palmarès. */
const TROPHEE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 3.5h9v5.5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 5.5h-3a3 3 0 0 0 3 4.2M16.5 5.5h3a3 3 0 0 1-3 4.2M12 13.5v3.5M8.5 20.5h7M9.5 17h5v3.5h-5z"/></svg>';
const ICONES = { biens: "actifs", activite: "activite", entreVous: "joueurs", reglages: "reglages" };
/** La teinte de chaque carte, la même que l'iPhone (CategorieAction). */
const TEINTES = { biens: "var(--argent, #3FBF85)", activite: "#F0954A", palmares: "#6E73E3", entreVous: "var(--equipe, #5B8DEF)", reglages: "#9D7BEA" };

export const iconeCarte = (id) => (ICONES[id] ? dessinJeu(ICONES[id]) : TROPHEE);

/**
 * La grille des cartes : deux par rangée, une carte seule prend la rangée. `page(c)` : { page, p } à ouvrir
 * (data-action="ouvrir"), ou null.
 */
export function grilleCartes(cartes, page) {
  return `<nav class="pc-grille" aria-label="Les pages du profil">${(cartes ?? []).map((c) => {
    const o = page(c);
    if (!o) return "";
    return `<button class="pc-carte" data-action="ouvrir" data-page="${esc(o.page)}" ${o.p ? `data-p='${esc(JSON.stringify(o.p))}'` : ""} data-carte="${esc(c.id)}"
      aria-label="${esc(`${c.titre}, ${c.resume}`)}">
      <span class="pc-haut"><span class="pc-pastille" style="--c:${TEINTES[c.id] ?? "var(--accent)"}">${iconeCarte(c.id)}</span><span class="pc-chevron" aria-hidden="true">›</span></span>
      <b class="pc-titre">${esc(c.titre)}</b><span class="pc-resume">${esc(c.resume)}</span></button>`;
  }).join("")}</nav>`;
}

const LAURIER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21c-4.5-1.5-7.5-5.5-7.5-10.5M12 21c4.5-1.5 7.5-5.5 7.5-10.5M6 13.5c-1.6.2-2.8-.6-3.3-2 1.6-.3 2.8.4 3.3 2zM5.2 9.6c-1.4-.4-2.1-1.6-2-3 1.4.4 2.1 1.5 2 3zM18 13.5c1.6.2 2.8-.6 3.3-2-1.6-.3-2.8.4-3.3 2zM18.8 9.6c1.4-.4 2.1-1.6 2-3-1.4.4-2.1 1.5-2 3z"/></svg>';

/** D441 : son rang de prestige et ses points, à vie ; sur ton profil, ta place au classement Général. */
export function lignePrestige(rang, points, place = null) {
  return `<div class="pc-prestige"><span class="pc-laurier">${LAURIER}</span><div class="pc-prestige-t"><b>${esc(rang)}</b><div class="aide">${points} points de prestige, à vie</div></div>
    ${place ? `<div class="fiche-place"><b class="chiffres">${place.place === 1 ? "1er" : `${place.place}e`}</b><div class="aide">${place.cache ? "au Général, caché" : "au Général"}</div></div>` : ""}</div>`;
}

/** Trois chiffres côte à côte : [valeur, libellé, classe]. */
export const troisChiffres = (l) => `<div class="pc-chiffres">${l.map(([v, t, c = ""]) => `<div><div class="chiffres ${c}">${esc(v)}</div><div class="aide">${esc(t)}</div></div>`).join("")}</div>`;

/** Les pilules d'action en haut du profil (écrire, ajouter en ami, échanger). */
export const pilules = (l) => (l.length ? `<div class="pc-pilules">${l.join("")}</div>` : "");
export const pilule = ({ titre, icone, action, donnees = {}, detail = "" }) =>
  `<button class="pc-pilule" data-action="${esc(action)}" ${Object.entries(donnees).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")} ${detail ? `title="${esc(detail)}"` : ""}>${icone}<span>${esc(titre)}</span></button>`;

export function stylesCartes() {
  if (document.getElementById("styles-profil-cartes")) return;
  const s = document.createElement("style");
  s.id = "styles-profil-cartes";
  s.textContent = `
.pc-grille { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.pc-grille > .pc-carte:last-child:nth-child(odd) { grid-column: 1 / -1; }
.pc-carte { display: grid; align-content: start; gap: 3px; min-height: 118px; padding: 14px; border-radius: 20px; text-align: left; color: var(--texte);
  background: var(--carte, rgba(255,255,255,.045)); border: 1px solid var(--filet); transition: background var(--d-court, .2s); min-width: 0; }
.pc-carte:hover { background: rgba(255,255,255,.07); }
.pc-carte:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.pc-haut { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 9px; }
.pc-pastille { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; color: #fff;
  background: linear-gradient(135deg, var(--c), color-mix(in srgb, var(--c) 72%, transparent)); }
.pc-pastille svg { width: 19px; height: 19px; }
.pc-chevron { font-size: 19px; line-height: 1; color: var(--texte3); }
.pc-titre { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc-resume { font-size: 12.5px; line-height: 1.35; color: var(--texte2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pc-tete { padding: 16px; display: grid; gap: 14px; }
.pc-prestige { display: flex; align-items: center; gap: 10px; }
.pc-laurier { color: var(--or); display: grid; flex: none; }
.pc-prestige-t { flex: 1; min-width: 0; }
.pc-prestige-t b { font-size: 15px; font-weight: 600; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc-prestige .fiche-place { text-align: right; flex: none; }
.pc-prestige .fiche-place b { font-size: 17px; }
.pc-chiffres { display: grid; grid-template-columns: 1.35fr .8fr 1fr; gap: 10px; }
.pc-chiffres .chiffres { font-size: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc-pilules { display: flex; gap: 10px; }
.pc-pilule { flex: 1 1 0; min-width: 0; min-height: 46px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 14px;
  border-radius: 99px; background: rgba(255,255,255,.05); border: 1px solid var(--filet); color: var(--texte); font-size: 14px; font-weight: 600; }
.pc-pilule:hover { background: rgba(255,255,255,.08); }
.pc-pilule > svg { width: 17px; height: 17px; color: var(--accent); flex: none; }
.pc-pilule > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc-page { display: grid; gap: 20px; }
/* Ton profil (pages/profil.js) */
.pf-lieu { margin: -6px 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pf-carte-simple { padding: 20px; display: grid; gap: 3px; }
.pf-carte-simple > b { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pf-saison { gap: 0; padding: 20px; }
.pf-filet { margin: 16px 0; }
.pf-patrimoine { font-size: 34px; line-height: 1.15; white-space: nowrap; margin-top: 10px; }
.pf-depuis { font-size: 13px; font-weight: 500; margin-top: 4px; }
.pf-avance { margin-top: 18px; }
.pf-jour { font-size: 13px; font-weight: 500; color: var(--texte2); }
.pf-jour .chiffres { font-weight: 500; letter-spacing: 0; }
.pf-rail { margin-top: 8px; }
.pf-section { margin-top: 0; }
.pc-page > .aide:first-child { margin: 0 4px; }
`;
  document.head.append(s);
}
