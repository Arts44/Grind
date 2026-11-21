// ══════════════════════════════════════════════════════════════════════
//  Les titres de profil (RNT-270, D267) : TitreProfilVue.swift sur le web.
//
//  Le joueur en choisit un à afficher sous son pseudo (profil, fiche joueur,
//  membres du monde) ; dans un classement, seulement sa petite icône. Le
//  catalogue (id, nom, icône SF, description) est dans Balance.json ›
//  titresProfil ; les titres possédés sont tenus par le serveur (titres_mes,
//  titre_choisir). Les styles sont dans css/pages/enligne.css (.tp-*).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "./format.js?v=3e8bddd9";
import * as serveur from "./serveur.js?v=3e8bddd9";

/** La clé du titre choisi, copie locale de ce que dit le serveur (comme CompteLocal.cleTitreProfil sur l'iPhone). */
export const CLE_TITRE_PROFIL = "grind.titreProfil";

const lire = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const ecrire = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} };

/** Les icônes du catalogue (noms SF Symbols), dessinées au trait. Une inconnue : un petit rond. */
const TRAITS = {
  "hammer.fill": '<path d="m14.5 4.5 5 5-2.2 2.2-5-5zM12.3 8.2 4 16.5 7.5 20l8.3-8.3"/>',
  "testtube.2": '<path d="M9.5 3h5M10.5 3v6.2L5.2 18.6A1.6 1.6 0 0 0 6.6 21h10.8a1.6 1.6 0 0 0 1.4-2.4L13.5 9.2V3M8 15h8"/>',
  "text.bubble.fill": '<path d="M4 5h16v11h-9.5L6 20v-4H4zM8 9.3h8M8 12.3h5"/>',
  "flag.fill": '<path d="M5.5 21V4M5.5 4.5h12l-2.6 3.7 2.6 3.8h-12"/>',
  "ladybug.fill": '<ellipse cx="12" cy="13.5" rx="5.5" ry="6.5"/><path d="M12 7v13M9 5l1.5 2M15 5l-1.5 2M3.5 11l3 1M20.5 11l-3 1M3.5 17l3-1.5M20.5 17l-3-1.5"/>',
  // D387 : les titres de collection (séries de voitures, de montres, thèmes).
  "car.side.fill": '<path d="M3 15.5v-2.8l2.2-4.2h9.3l3.5 3.5 3 .8v2.7H3z"/><circle cx="7.5" cy="16" r="1.8"/><circle cx="16.5" cy="16" r="1.8"/>',
  "car.2.fill": '<path d="M2.5 17v-2.4l1.8-3.3h7.4l2.8 2.8 2.4.6V17H2.5z"/><circle cx="6" cy="17.4" r="1.4"/><circle cx="13" cy="17.4" r="1.4"/><path d="M8 9.5l1.6-3h7.2l2.8 2.8 2.4.6v2.6"/>',
  "watch.analog": '<circle cx="12" cy="12" r="5.5"/><path d="M12 9.3V12l1.8 1.2M9.5 6.8 10 3h4l.5 3.8M9.5 17.2 10 21h4l.5-3.8"/>',
  "bolt.car.fill": '<path d="M3 16v-2.8l2.2-4.2h9.3l3.5 3.5 3 .8V16H3z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/><path d="m11 3-2 4h3l-2 4"/>',
  "car.rear.fill": '<path d="M5 11l1.6-4.5h10.8L19 11M4 11h16v6H4zM6 17v2.5M18 17v2.5M7 14h2M15 14h2"/>',
  "airplane": '<path d="M21 15.5 13.5 11V5a1.5 1.5 0 0 0-3 0v6L3 15.5v2l7.5-2.5v3.5L8.5 20v1.5L12 20.5l3.5 1V20l-2-1.5V15l7.5 2.5z"/>',
  "sailboat.fill": '<path d="M11.5 3v13H5zM13 6.5c3.5 2.5 5 5.5 5.5 9.5H13zM3 18.5h18l-2 2.5H5z"/>',
  "globe.europe.africa.fill": '<circle cx="12" cy="12" r="9"/><path d="M8 4.5c.5 2 2.5 2.5 2.5 4.5S8 11 8.5 13s3 1.5 3.5 4-1 3.5-1 3.5M15 4c-1 1.5-.5 3 1 3.5s2.5 2 2 3.5-2 1.5-2 3.5 1.5 2.5 2.5 2.5"/>',
};

export const iconeTitre = (nom, taille = 13) => `<svg class="tp-ico" width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAITS[nom] ?? '<circle cx="12" cy="12" r="5"/>'}</svg>`;

/** Le titre sous un pseudo : son icône et son nom. `t` : { id, nom, icone } (ou rien). */
export const ligneTitre = (t, taille = 13) => t ? `<span class="tp-ligne" style="--tp:${taille}px" aria-label="Titre : ${esc(t.nom)}">${iconeTitre(t.icone, taille)}<span>${esc(t.nom)}</span></span>` : "";

/** Dans un classement : la seule icône, à côté du pseudo. */
export const pastilleTitre = (t) => t ? `<span class="tp-pastille" title="${esc(t.nom)}" role="img" aria-label="Titre : ${esc(t.nom)}">${iconeTitre(t.icone, 12)}</span>` : "";

/** Le titre d'un identifiant dans le catalogue ({ id, nom, icone, description }), ou null. */
export const titreDe = (catalogue, id) => (id && Array.isArray(catalogue) ? catalogue.find((t) => t.id === id) ?? null : null);

/** Ton titre choisi (copie locale) tel qu'on l'affiche, ou null. */
export const monTitre = (catalogue) => titreDe(catalogue, lire(CLE_TITRE_PROFIL));

/** Le catalogue de cette version du moteur (une lecture, gardée par le moteur). */
export const catalogue = (ctx) => ctx.balance("titresProfil").then((c) => { if (Array.isArray(c)) dernierCatalogue = c; return c; }).catch(() => null);
/** D398 : le dernier catalogue lu (pour montrer un titre de collection en badge sans attendre). */
let dernierCatalogue = [];
export const catalogueConnu = () => dernierCatalogue;

/** Ce que le serveur dit de tes titres : { titres: [id], choisi, tableau }, ou null (hors ligne, pas de compte). Remet la copie locale d'équerre.
 *  D387 (avec `ctx`) : le réglage du moteur (TableauTitresProfil, comme l'iPhone) ; les titres de collection gagnés en jeu
 *  que le serveur n'a pas encore lui sont donnés d'abord (titres_collection_ajouter). */
export async function chargerMesTitres(ctx = null) {
  try {
    let r = await serveur.titresMes();
    let tableau = ctx ? await ctx.tableau("titresProfil", { compte: r }).catch(() => null) : null;
    if (tableau?.aEnvoyer?.length) {
      const maj = await serveur.ajouterTitresCollection(tableau.aEnvoyer).catch(() => null);
      if (maj) { r = maj; tableau = await ctx.tableau("titresProfil", { compte: r }).catch(() => tableau); }
    }
    ecrire(CLE_TITRE_PROFIL, r?.choisi ?? "");
    return { titres: Array.isArray(r?.titres) ? r.titres : [], choisi: r?.choisi ?? null, tableau };
  } catch { return null; }
}

/** Choisit le titre à afficher (null : aucun). Rend vrai si le serveur l'a retenu. */
export async function choisirMonTitre(id) {
  await serveur.choisirTitre(id);
  ecrire(CLE_TITRE_PROFIL, id ?? "");
}

/** D387 : le début des identifiants des titres de collection (ReglesSeriesCollection.prefixeTitre). */
const COLLECTION = "col_";
/** D387 : combien de titres de collection avant « Voir plus » (TableauTitresProfil.collectionVisibles). */
const COLLECTION_VISIBLES = 4;

/** Le réglage (Personnaliser) : les titres attribués, ceux qu'on a d'abord, le choisi coché ; puis (D387) ses titres de
 *  collection, groupés, les premiers puis « Voir plus ». Rien tant qu'on n'en a aucun. */
export function sectionTitres(cat, mes, toutVoir = false) {
  if (!Array.isArray(cat) || !mes?.titres?.length) return "";
  const a = new Set(mes.titres), choisi = a.has(mes.choisi) ? mes.choisi : null;
  const base = cat.filter((t) => !t.id.startsWith(COLLECTION));
  const tous = [...base.filter((t) => a.has(t.id)), ...base.filter((t) => !a.has(t.id))];
  const ligne = (t) => {
    const possede = !t || a.has(t.id), actif = t ? t.id === choisi : choisi === null;
    return `<button class="tp-choix" data-action="choisirTitreProfil" data-id="${esc(t?.id ?? "")}" aria-pressed="${actif}" ${possede ? "" : "disabled"}>
      <span class="tp-choix-ico ${possede ? "" : "ferme"}">${t ? iconeTitre(t.icone, 16) : ""}</span>
      <span class="tp-choix-txt"><b>${esc(t?.nom ?? "Aucun")}</b>${t ? `<span class="aide">${esc(t.description)}</span>` : ""}</span>
      <span class="tp-choix-etat">${actif ? "✓" : possede ? "" : "verrouillé"}</span></button>`;
  };
  return `<section class="rg-bloc"><h2 class="libelle">Titre de profil</h2>
    <p class="aide">Affiché sous ton pseudo, dans ton profil, les mondes et les classements.</p>
    <div class="tp-liste">${ligne(null)}${tous.map(ligne).join("")}</div>${sectionCollection(mes.tableau, ligne, toutVoir)}</section>`;
}

/** D387 : les titres de collection gagnés (le tableau du moteur), groupés, coupés après les premiers. */
function sectionCollection(t, ligne, toutVoir) {
  if (!t?.collectionTotal) return "";
  let reste = toutVoir ? Infinity : COLLECTION_VISIBLES;
  const groupes = [];
  for (const g of t.collection ?? []) {
    if (reste <= 0) break;
    const l = g.lignes.slice(0, reste);
    reste -= l.length;
    groupes.push(`<span class="tp-groupe">${esc(g.titre)}</span>${l.map(ligne).join("")}`);
  }
  const autres = t.collectionGagnes - COLLECTION_VISIBLES;
  const plus = autres > 0 ? `<button class="tp-plus" data-action="voirTitresCollection">${toutVoir ? "Voir moins" : `Voir les ${autres} autres`}</button>` : "";
  return `<h3 class="libelle tp-collection">Titres de collection</h3><p class="aide">${esc(t.collectionTexte)}</p>
    ${groupes.length ? `<div class="tp-liste">${groupes.join("")}</div>` : ""}${plus}`;
}
