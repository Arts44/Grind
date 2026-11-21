// ══════════════════════════════════════════════════════════════════════
//  Le choix compact d'une cible (D352, Rente/Design/ChoixCompact.swift).
//
//  Arthur, 14/11 19:30 : en fin de saison, la liste des boîtes d'un joueur
//  (ses véhicules, les joueurs du monde) défilait sans fin. Ici : un champ
//  de recherche, des filtres par famille et par ville (menuAncre, D345),
//  un tri (valeur, étoiles, distance, nom), une liste plafonnée et
//  « Voir plus ». La même règle de tri et de filtre que l'iPhone (TriChoix).
//  Aucun style en ligne : css/composants.css § D352.
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "./format.js?v=3e8bddd9";
import { menuAncre } from "./ui.js?v=3e8bddd9";

/** Les cibles montrées d'abord, puis « Voir plus » en ajoute autant (TableauCombinesCible.pageChoix). */
export const PAGE = 8;
/** Au-delà, le choix devient compact (TableauCombinesCible.seuilChoix). */
export const SEUIL = 4;

const etats = new Map();
const etat = (cle) => {
  if (!etats.has(cle)) etats.set(cle, { q: "", famille: "", ville: "", tri: "valeur", n: PAGE, choisi: null, elements: [], unite: "cibles" });
  return etats.get(cle);
};

const norm = (x) => String(x ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Filtrer et trier comme TriChoix.filtrer (iPhone). */
export function filtrer(elements, e) {
  const q = norm(e.q.trim());
  const l = elements.filter((x) => (!q || [x.titre, x.sousTitre, x.famille, x.ville].some((t) => norm(t).includes(q)))
    && (!e.famille || x.famille === e.famille) && (!e.ville || x.ville === e.ville));
  const cle = { valeur: (x) => -(x.valeur ?? 0), etoiles: (x) => -(x.etoiles ?? 0), distance: (x) => x.km ?? 1e6 }[e.tri];
  return [...l].sort((a, b) => (cle ? cle(a) - cle(b) : 0) || String(a.titre).localeCompare(String(b.titre), "fr"));
}

const ligne = (cle, x, e) => `<button type="button" class="chx-ligne${e.choisi === x.id ? " choisie" : ""}${x.refus ? " refusee" : ""}" data-action="choixCompactChoisir" data-cle="${esc(cle)}" data-id="${esc(x.id)}" aria-pressed="${e.choisi === x.id}"${x.refus ? ` title="${esc(x.refus)}"` : ""}>
    <span class="chx-ligne-t"><b>${esc(x.titre)}</b><span class="aide">${[x.famille, x.ville, x.km == null ? "" : x.km === 0 ? "ici" : `${Math.round(x.km)} km`].filter(Boolean).map(esc).join(" · ")}</span></span>
    <span class="chx-ligne-v">${x.valeur != null ? `<b class="chiffres">${montant(x.valeur)}</b>` : ""}${x.etoiles != null ? `<span class="aide">${String(x.etoiles.toFixed(1)).replace(".", ",")} ★</span>` : ""}</span></button>`;

/** La liste seule (redessinée à chaque lettre tapée, sans toucher au champ). */
export function liste(cle) {
  const e = etat(cle);
  const l = filtrer(e.elements, e);
  return `<p class="aide chx-compte">${l.length} ${esc(e.unite)}</p>
    <div class="carte chx-liste">${l.slice(0, e.n).map((x) => ligne(cle, x, e)).join("") || `<p class="aide chx-vide">Rien ne correspond.</p>`}</div>
    ${l.length > e.n ? `<button type="button" class="bouton secondaire chx-plus" data-action="choixCompactPlus" data-cle="${esc(cle)}">Voir plus (${l.length - e.n})</button>` : ""}`;
}

/**
 * Le choix compact : `elements` = [{ id, titre, sousTitre, famille, ville, valeur, etoiles, km, refus }].
 * L'élément choisi se lit avec `choisi(cle)`.
 */
export function choixCompact(cle, titre, elements, { unite = "cibles" } = {}) {
  const e = etat(cle);
  e.elements = elements;
  e.unite = unite;
  const familles = [...new Set(elements.map((x) => x.famille).filter(Boolean))].sort();
  const villes = [...new Set(elements.map((x) => x.ville).filter(Boolean))].sort();
  const menus = [
    familles.length > 1 ? menuAncre({ libelle: "Famille", options: [["", "Toutes"], ...familles.map((f) => [f, f])], choisie: e.famille, action: "choixCompactFamille", donnees: { cle }, aligner: "gauche" }) : "",
    villes.length > 1 ? menuAncre({ libelle: "Ville", options: [["", "Toutes"], ...villes.map((v) => [v, v])], choisie: e.ville, action: "choixCompactVille", donnees: { cle }, aligner: "gauche" }) : "",
    menuAncre({ libelle: "Trier", options: [["valeur", "Valeur"], ["etoiles", "Étoiles"], ["distance", "Distance"], ["nom", "Nom"]], choisie: e.tri, action: "choixCompactTri", donnees: { cle } }),
  ].join("");
  return `<div class="chx-choix" data-cle="${esc(cle)}">
    <div class="libelle">${esc(titre)}</div>
    <label class="chx-recherche"><span class="sr">Chercher</span><input type="search" id="chx-q-${esc(cle)}" value="${esc(e.q)}" placeholder="Chercher" data-saisie="choixCompactChercher" data-cle="${esc(cle)}" autocomplete="off"></label>
    <div class="chx-menus">${menus}</div>
    <div class="chx-corps" id="chx-corps-${esc(cle)}">${liste(cle)}</div></div>`;
}

export const choisi = (cle) => etat(cle).choisi;

/** Les gestes du choix ; `redessiner(ctx)` redessine la feuille ou la page (la recherche ne redessine que la liste). */
export function actionsChoixCompact(redessiner) {
  const maj = (ctx, el, f) => { f(etat(el.dataset.cle)); redessiner(ctx); };
  return {
    choixCompactChercher(ctx, el) {
      const e = etat(el.dataset.cle);
      e.q = el.value ?? "";
      e.n = PAGE;
      const corps = document.getElementById(`chx-corps-${el.dataset.cle}`);
      if (corps) corps.innerHTML = liste(el.dataset.cle);
    },
    choixCompactFamille: (ctx, el) => maj(ctx, el, (e) => { e.famille = el.value ?? ""; e.n = PAGE; }),
    choixCompactVille: (ctx, el) => maj(ctx, el, (e) => { e.ville = el.value ?? ""; e.n = PAGE; }),
    choixCompactTri: (ctx, el) => maj(ctx, el, (e) => { e.tri = el.value ?? "valeur"; }),
    choixCompactPlus: (ctx, el) => maj(ctx, el, (e) => { e.n += PAGE; }),
    choixCompactChoisir: (ctx, el) => maj(ctx, el, (e) => { e.choisi = e.choisi === el.dataset.id ? null : el.dataset.id; }),
  };
}
