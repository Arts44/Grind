// ══════════════════════════════════════════════════════════════════════
//  Collection — RNT-374 (D380) — SeriesCollectionVue de l'iPhone.
//  D394 : deux onglets de « Personnaliser mon profil » (recompenses.js),
//  plus de page à part. Actifs › Collection y mène.
//
//  Onglet Collection : les séries de collection (par
//  marque de voiture, par maison de montres, à thème), l'avancement, ce
//  qui manque, le titre et la prime d'une série complète. Onglet Vitrine :
//  le choix de la vitrine-musée publiée avec le profil (6 pièces, 3
//  séries). Deux écrans au plus : les séries pas commencées sont repliées. Tableau « seriesCollection », décisions de la famille
//  « collection ». La vitrine d'un joueur sur sa fiche : `vitrineMusee`.
// ══════════════════════════════════════════════════════════════════════
import { esc } from "../format.js?v=3e8bddd9";
import { carte, segment, bouton } from "../ui.js?v=3e8bddd9";

const ROSETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-2 7 5.5-2.5 5.5 2.5-2-7"/></svg>';
const MUSEE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/></svg>';
const PILE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5"/></svg>';
const ICONES = {
  voitures: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 15.5v-2.5l2.5-1 2.5-3.5h6l3.5 3.5 3 .8v2.7z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/></svg>',
  montres: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="5"/><path d="M9 7l.8-4h4.4l.8 4M9 17l.8 4h4.4l.8-4M12 9.5V12l1.5 1"/></svg>',
  themes: ROSETTE,
};

// L'affichage de la page (comme les @State de l'iPhone) : retenu le temps de la session.
const vue = { famille: "themes", tout: false, toutEnCours: false, toutesPieces: false, choix: null, ouvert: false };

/** L'avancement d'une série : une petite jauge ronde (comme l'iPhone). */
function jauge(part) {
  const p = Math.max(0, Math.min(1, part));
  const c = 2 * Math.PI * 10;
  return `<svg class="sc-jauge ${p >= 1 ? "pleine" : ""}" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="10"/>${p > 0 ? `<circle class="sc-arc" cx="13" cy="13" r="10" stroke-dasharray="${(p * c).toFixed(1)} ${c.toFixed(1)}"/>` : ""}</svg>`;
}

function ligneSerie(s) {
  const titre = s.complete ? `<span class="sc-titre">${ROSETTE}${esc(s.titre)}</span>` : "";
  const avance = `${esc(s.avancement)}${s.complete ? ` · prime ${esc(s.primeTexte)}` : ""}`;
  const manque = s.manque ? `<span class="sc-manque">${esc(s.manque)}${s.suggestions[0] ? ` : ${esc(s.suggestions[0])}` : ""}</span>` : "";
  const teinte = s.complete ? "vente" : s.possedes > 0 ? "grandir" : "controles";
  return `<div class="sc-ligne" data-serie="${esc(s.id)}">
    <span class="sc-pastille ${teinte}">${ICONES[s.famille] ?? ROSETTE}</span>
    <span class="sc-corps"><span class="sc-nom"><b>${esc(s.nom)}</b>${titre}</span>
      <span class="sc-avance ${s.complete ? "gain" : ""}">${avance}</span>${manque}</span>
    ${jauge(s.possedes / Math.max(1, s.requisComplet ?? s.requis))}
  </div>`;
}

function liste(l, limite, action) {
  const vues = limite == null ? l : l.slice(0, limite);
  const plus = limite != null && l.length > limite ? `<div class="filet"></div><button class="sc-plus" data-action="${action}">Voir plus (${l.length - limite})</button>` : "";
  return carte(vues.map(ligneSerie).join(`<div class="filet"></div>`) + plus);
}

function bloc(titre, l, limite = null, action = "") {
  if (!l.length) return "";
  return `<section class="sc-section"><h2 class="sc-titre-section">${esc(titre)}</h2>${liste(l, limite, action)}</section>`;
}

const pastilles = (titres) => titres.length ? `<div class="sc-titres">${titres.map((t) => `<span class="sc-puce">${ROSETTE}${esc(t)}</span>`).join("")}</div>` : "";

function entete(icone, titre, detail, teinte) {
  return `<summary class="sc-repli-t"><span class="sc-pastille ${teinte}">${icone}</span><span class="sc-corps"><b>${esc(titre)}</b><span class="sc-avance">${esc(detail)}</span></span></summary>`;
}

function coche({ choisie, titre, detail, valeur, icone, action, id }) {
  return `<button class="sc-coche ${choisie ? "choisie" : ""}" data-action="${action}" data-id="${esc(id)}" aria-pressed="${choisie}">
    <span class="sc-rond" aria-hidden="true"></span><span class="sc-ico">${icone}</span>
    <span class="sc-corps"><b>${esc(titre)}</b><span class="sc-avance">${esc(detail)}</span></span><span class="sc-valeur">${esc(valeur)}</span></button>`;
}

const choixDe = (t) => vue.choix ?? { pieces: t.pieces.filter((p) => p.enVitrine).map((p) => p.id), series: t.completes.filter((s) => s.enVitrine).map((s) => s.id) };

/** D394 : l'onglet Collection de Personnaliser mon profil (les séries, leurs titres, la prime). */
export function ongletCollection(t) {
  if (!t) return `<p class="aide">La collection s'ouvre avec ta première saison.</p>`;
  const groupe = t.aCommencer.find((g) => g.id === vue.famille) ?? t.aCommencer[0];
  const nA = t.aCommencer.reduce((n, g) => n + g.series.length, 0);
  const resume = carte(`<div class="sc-resume">
      <div class="sc-resume-t"><b>${esc(t.resume)}</b><span class="chiffres ${t.prime > 0 ? "gain" : "t3"}">${esc(t.primeTexte)}</span></div>
      <p class="aide">${esc(t.plaisirTexte ? `Prime de valeur dans ton patrimoine · ${t.plaisirTexte}` : "Complète une série : un titre, +10 % sur ses pièces, du plaisir chaque nuit.")}</p></div>`);
  // D395 (Arthur 16/11) : plus de pastilles de titres ici ; les titres se voient et se choisissent dans l'onglet Profil.
  const commencer = groupe ? `<details class="carte sc-repli" id="sc-toutes"${vue.ouvert ? " open" : ""}>${entete(PILE, "Toutes les séries", `${nA} à commencer`, "equipe")}
      <div class="sc-repli-c">${segment(t.aCommencer.map((g) => [g.id, g.titre]), groupe.id, "famille")}
      ${liste(groupe.series, vue.tout ? null : 8, "toutes")}</div></details>` : "";
  return `<div class="sc-page">
    ${resume}
    ${bloc("Complètes", t.completes)}
    ${bloc("En cours", t.enCours, vue.toutEnCours ? null : 4, "toutEnCours")}
    ${commencer}
    <p class="aide">${esc(t.regle)}</p>
  </div>`;
}

/** D394 : l'onglet Vitrine de Personnaliser mon profil (les 6 pièces et 3 séries montrées aux autres, D380). */
export function ongletVitrine(t) {
  if (!t) return `<p class="aide">La vitrine s'ouvre avec ta première saison.</p>`;
  const c = choixDe(t);
  const vues = vue.toutesPieces ? t.pieces : t.pieces.slice(0, 8);
  const plus = !vue.toutesPieces && t.pieces.length > 8 ? `<div class="filet"></div><button class="sc-plus" data-action="toutesPieces">Voir plus (${t.pieces.length - 8})</button>` : "";
  const pieces = t.pieces.length ? `<h3 class="sc-sous">Pièces (${c.pieces.length} / ${t.maxPieces})</h3><div class="sc-choix">${vues.map((p) => coche({
      choisie: c.pieces.includes(p.id), titre: p.nom, detail: p.detail, valeur: p.valeurTexte, icone: ICONES[p.famille === "m" ? "montres" : "voitures"], action: "piece", id: p.id,
    })).join(`<div class="filet"></div>`)}${plus}</div>` : `<p class="aide">Aucune voiture ni montre à exposer pour l'instant.</p>`;
  const series = t.completes.length ? `<h3 class="sc-sous">Séries complètes (${c.series.length} / ${t.maxSeries})</h3><div class="sc-choix">${t.completes.map((s) => coche({
      choisie: c.series.includes(s.id), titre: s.titre, detail: s.nom, valeur: `${s.possedes} pièces`, icone: ROSETTE, action: "serie", id: s.id,
    })).join(`<div class="filet"></div>`)}</div>` : "";
  return `<div class="sc-page"><div class="carte sc-repli" id="sc-vitrine">
      <div class="sc-repli-t"><span class="sc-pastille image">${MUSEE}</span><span class="sc-corps"><b>Ma vitrine</b><span class="sc-avance">${esc(t.vitrineAuto && !vue.choix ? "Automatique : tes plus belles pièces" : `${c.pieces.length} pièces, ${c.series.length} séries`)}</span></span></div>
      <div class="sc-repli-c"><p class="aide">Ce que les autres voient sur ta fiche, avec la valeur de chaque pièce.</p>${pieces}${series}
      <div class="sc-boutons">${bouton("Automatique", "auto", { genre: "secondaire" })}${bouton("Enregistrer", "enregistrer")}</div></div></div></div>`;
}

/** RNT-374 (D380) : la vitrine-musée d'un joueur, sur sa fiche (TableauFicheJoueur.musee). */
export function vitrineMusee(m, moi) {
  if (!m) return "";
  const pieces = m.pieces.length ? `<div class="sc-grille">${m.pieces.map((p) => `<div class="sc-tuile">
      <span class="sc-ico">${ICONES[p.icone === "watch.analog" ? "montres" : "voitures"]}</span><b>${esc(p.titre)}</b><span class="chiffres gain">${esc(p.valeur)}</span></div>`).join("")}</div>` : "";
  const series = m.series.map((s) => `<div class="sc-serie-f">${ROSETTE}<b>${esc(s.titre)}</b><span class="sc-avance">${esc(s.detail)}</span></div>`).join("");
  return carte(`<div class="sc-musee">
    <div class="sc-resume-t"><b class="sc-musee-t">${MUSEE}${moi ? "Ta vitrine" : "Sa vitrine"}</b><span class="sc-avance">${esc(m.resume)}</span></div>
    ${pastilles(m.titres)}${pieces}${series}</div>`);
}

/** D394 : les actions des onglets Collection et Vitrine ; `d.sc` porte le tableau « seriesCollection ». */
export const actionsSeries = {
  famille(ctx, b) { vue.famille = b.dataset.valeur; vue.tout = false; vue.ouvert = true; ctx.redessiner(); },
  toutes(ctx) { vue.tout = true; vue.ouvert = true; ctx.redessiner(); },
  toutEnCours(ctx) { vue.toutEnCours = true; ctx.redessiner(); },
  toutesPieces(ctx) { vue.toutesPieces = true; ctx.redessiner(); },
  piece(ctx, b, d) { basculer(ctx, d.sc, "pieces", b.dataset.id, d.sc.maxPieces); },
  serie(ctx, b, d) { basculer(ctx, d.sc, "series", b.dataset.id, d.sc.maxSeries); },
  async enregistrer(ctx, b, d) {
    const c = choixDe(d.sc);
    if (await ctx.decider("collection", { vitrine: { pieces: c.pieces, series: c.series } }, { succes: "Vitrine enregistrée : elle part avec ton profil", fermer: false })) vue.choix = null;
  },
  async auto(ctx) {
    if (await ctx.decider("collection", { vitrineAuto: {} }, { succes: "Vitrine automatique : tes plus belles pièces", fermer: false })) vue.choix = null;
  },
};

function basculer(ctx, t, cle, id, max) {
  vue.choix ??= { pieces: t.pieces.filter((p) => p.enVitrine).map((p) => p.id), series: t.completes.filter((s) => s.enVitrine).map((s) => s.id) };
  const l = vue.choix[cle];
  const k = l.indexOf(id);
  if (k >= 0) l.splice(k, 1);
  else if (l.length < max) l.push(id);
  else { ctx.toast(`${max} au plus : retires-en un d'abord.`, "refus"); return; }
  ctx.redessiner();
}
