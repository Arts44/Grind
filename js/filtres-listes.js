// ══════════════════════════════════════════════════════════════════════
//  Filtres des listes du joueur (D442, FIL) — BarreFiltresPossessions et
//  FeuilleFiltresPossessions de l'iPhone (Design/ObjetsListes.swift).
//
//  Le moteur donne, pour une liste, ses groupes de cases et les étiquettes
//  de chaque élément (tableau « filtresListe », FiltresPossessions.swift).
//  La règle est la même que sur l'iPhone : dans un groupe, les cases
//  s'additionnent ; entre groupes, elles se combinent. Les cases cochées
//  sont gardées par liste (« actifs.filtres.<liste> »), comme sur l'iPhone.
//
//  D453 (Arthur, 20/11 : « je suis censé pouvoir inverser les conditions,
//  type pas de traceur au lieu de traceur ») : chaque case peut être exclue
//  (« !groupe:option »). La règle, mot pour mot celle du moteur
//  (RegleFiltres, FiltresPossessions.swift) : dans un groupe, les cases
//  incluses s'additionnent et une case exclue retire ce qui la porte ;
//  entre groupes, tout se combine. Un appui : vide → incluse → exclue → vide.
//  Les pièces communes (case, pastille, aide) servent toutes les listes.
// ══════════════════════════════════════════════════════════════════════
import * as L from "./listes.js?v=3e8bddd9";
import { esc } from "./format.js?v=3e8bddd9";

const cle = (liste) => `actifs.filtres.${liste}`;
/** Les filtres connus, par liste : les gestes (pastilles, feuille) les retrouvent. */
const connus = {};

// MARK: - D453 : la règle (RegleFiltres du moteur)

export const AIDE = "Touche deux fois pour exclure.";
export const estExclu = (c) => String(c).startsWith("!");
export const base = (c) => (estExclu(c) ? String(c).slice(1) : String(c));
export const exclue = (id) => "!" + base(id);
export const groupe = (option) => base(option).split(":")[0];
const versSet = (c) => (c instanceof Set ? c : new Set(c ?? []));
/** L'état d'une case parmi les choisies (un tableau ou un Set) : "", "incluse" ou "exclue". */
export function etatCase(choisies, id) {
  const c = versSet(choisies);
  return c.has(exclue(id)) ? "exclue" : c.has(base(id)) ? "incluse" : "";
}
/** Un appui : vide → incluse → exclue → vide. Rend un nouveau Set. */
export function basculerCase(choisies, id) {
  const c = new Set(versSet(choisies)), b = base(id), e = etatCase(c, b);
  if (e === "") c.add(b);
  else if (e === "incluse") { c.delete(b); c.add(exclue(b)); }
  else { c.delete(exclue(b)); c.delete(b); }
  return c;
}
/** La croix d'une pastille : retire la case, incluse ou exclue. */
export function retirerCase(choisies, id) { const c = new Set(versSet(choisies)); c.delete(base(id)); c.delete(exclue(id)); return c; }
/** Pour un tableau modifié sur place (les pages qui gardent leurs filtres en tableau). */
export function basculerTableau(liste, id) { const n = [...basculerCase(liste, id)]; liste.splice(0, liste.length, ...n); }
export function retirerTableau(liste, id) { const n = [...retirerCase(liste, id)]; liste.splice(0, liste.length, ...n); }
/** Une case à la fois incluse et exclue (un texte écrit à la main) : exclue. */
export const normaliser = (s) => new Set([...s].filter((c) => estExclu(c) || !s.has(exclue(c))));
/** Une case qui est un test (« Disponibles ») : incluse, l'élément doit le passer ; exclue, il ne doit pas ; vide, tout passe. */
export function passe(choisies, id, porte) {
  const e = etatCase(choisies, id);
  return e === "" ? true : e === "incluse" ? !!porte : !porte;
}
/**
 * D462 (Arthur, 21/11) : les cases « tests » d'un même groupe (« Disponibles », « Mon permis »…), ensemble (RegleFiltres.passeTests).
 * « Toutes » (`ou` faux, par défaut) : l'élément passe chaque case incluse ; « Au moins une » (`ou` vrai) : l'une suffit.
 * Une case exclue retire toujours ce qui la passe ; sans case incluse, tout passe. `tests` : [[id, porte], …].
 */
export function passeTests(choisies, tests, ou = false) {
  const incluses = [];
  for (const [id, porte] of tests) {
    const e = etatCase(choisies, id);
    if (e === "exclue" && porte) return false;
    if (e === "incluse") incluses.push(!!porte);
  }
  if (!incluses.length) return true;
  return ou ? incluses.includes(true) : !incluses.includes(false);
}
export const MODE_TOUTES = "Toutes";
export const MODE_UNE = "Au moins une";
/** D462 : le mode d'un groupe de tests (ModeGroupeFiltres de l'iPhone) : deux boutons, « Toutes » ou « Au moins une ». */
export function modeHtml(ou, attrs = "") {
  return `<div class="segment fl-mode" role="group" aria-label="Combiner les cases du groupe">
    <button aria-pressed="${!ou}" ${attrs} data-ou="0">${MODE_TOUTES}</button><button aria-pressed="${!!ou}" ${attrs} data-ou="1">${MODE_UNE}</button></div>`;
}

/** Un groupe de valeurs (une marque, un type) : une case exclue retire, les incluses s'additionnent. */
export function gardeGroupe(choisies, prefixe, id) {
  const c = [...versSet(choisies)];
  if (c.includes(exclue(id))) return false;
  const inclus = c.filter((x) => !estExclu(x) && x.startsWith(prefixe));
  return !inclus.length || inclus.includes(id);
}
/** La règle sur des étiquettes. */
export function gardeEtiquettes(siennes, choisies) {
  const c = versSet(choisies);
  if (!c.size) return true;
  const parGroupe = {};
  for (const x of c) {
    if (estExclu(x)) { if (siennes.has(base(x))) return false; }
    else (parGroupe[groupe(x)] ??= []).push(x);
  }
  return Object.values(parGroupe).every((cs) => cs.some((x) => siennes.has(x)));
}

/** Le nom d'une case exclue (RegleFiltres.nomExclu, mot pour mot). */
const NOMS_EXCLUS = {
  "Sans boîte ni papiers": "Avec boîte ou papiers", "Sans personne": "Avec une équipe", "Sans marque": "De marque",
  "Avec des alertes": "Sans alertes", "Bon état": "Pas en bon état", "Tu y habites": "Pas ton domicile", "Ta boîte y est": "Sans ta boîte",
  "Tu mènes": "Tu ne mènes pas", "Tu as misé": "Sans ta mise", "Tes ventes": "Pas tes ventes", "Amis": "Pas tes amis",
  "Mes banques": "Pas mes banques", "Mes biens": "Pas mes biens", "Mes boîtes": "Pas mes boîtes", "Mon pays": "Hors de mon pays",
  "Mon permis": "Pas mon permis", "Même monde": "Pas ton monde", "Autres mondes": "Ton monde seulement",
  "Ouvert maintenant": "Fermé maintenant", "Joueurs": "Sans joueurs", "Sortir, rencontrer": "Pas pour sortir",
  "Manger": "Pas pour manger", "Ventes régulières": "Ventes irrégulières",
};
const MOTS_PAS = new Set(["à", "au", "aux", "en", "dans", "d", "de", "du", "des", "ici", "ailleurs", "plus", "moins", "hors",
  "loué", "louée", "vacant", "usé", "usée", "rentable", "débridé", "certifiée", "certifié", "assuré", "assurée",
  "rares", "rare", "terminées", "terminés", "disponibles", "disponible", "ouvertes", "ouverts", "ouvert", "fermée", "fermé",
  "acheté", "achetée", "commandée", "volé", "cotées", "inspectée", "inspectées", "abordable", "abordables",
  "habité", "neuf", "neufs", "neuve", "occasion", "particulier", "particuliers", "authentiques", "authentique", "même"]);
/** D459 : les groupes de noms propres (marque, maison, ville, pays, monde) gardent la majuscule (RegleFiltres.estPropre). */
const GROUPES_PROPRES = new Set(["marque", "maison", "ville", "v", "pays", "monde", "region", "chantier", "circuit"]);
export function estPropre(id) {
  if (id == null) return false;
  const b = base(String(id));
  const i = b.search(/[:·]/);
  if (i < 0) return false;
  return GROUPES_PROPRES.has(b.slice(0, i).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
}
/** D459 : un sigle ou un nom à deux capitales (« GPS », « McLaren »), ou un chiffre, garde sa majuscule. */
function garderMajuscule(n) {
  const p = n.split(/[ '’,]/)[0] ?? "";
  return [...p].filter((c) => c !== c.toLowerCase() && c === c.toUpperCase()).length >= 2 || /[0-9]/.test(p);
}
export function nomExclu(n, id = null) {
  n = String(n);
  if (NOMS_EXCLUS[n]) return NOMS_EXCLUS[n];
  if (n.startsWith("Sans ")) return "Avec " + n.slice(5);
  if (n.startsWith("Avec ")) return "Sans " + n.slice(5);
  if (n.startsWith("Non ")) { const r = n.slice(4); return r.charAt(0).toUpperCase() + r.slice(1); }
  if (/^[0-9]/.test(n)) return "Hors " + n;
  const premier = (n.split(/[ '’,]/)[0] ?? "").toLowerCase();
  if (MOTS_PAS.has(premier)) return "Pas " + n.charAt(0).toLowerCase() + n.slice(1);
  if (estPropre(id) || garderMajuscule(n)) return "Sans " + n; // D459 : « Sans Porsche », « Sans GPS »
  return "Sans " + n.charAt(0).toLowerCase() + n.slice(1); // D459 : « Sans traceur GPS »
}
export function messageVideNoms(noms) {
  const n = [...noms].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  if (!n.length) return null;
  return n.length === 1 ? `Aucun élément « ${n[0]} » : retire ce filtre.` : `Aucun élément ne réunit « ${n.join(" » et « ")} » : retire un filtre.`;
}

// MARK: - D453 : les pièces communes (aide, case, pastille)

export const aideHtml = () => `<p class="fl-aide aide">${AIDE}</p>`;
/** Une case à trois états ; `attrs` : les attributs de l'action (data-action, data-id…). */
export function caseHtml({ etat = "", nom: n, nombre = null, attrs = "", id = null }) {
  const marque = etat === "incluse" ? "✓" : etat === "exclue" ? "✕" : "";
  const valeur = etat === "incluse" ? "true" : etat === "exclue" ? "mixed" : "false";
  return `<button class="fl-case${etat ? ` ${etat === "incluse" ? "cochee" : "exclue"}` : ""}" ${attrs} aria-pressed="${valeur}" aria-label="${esc(etat === "exclue" ? nomExclu(n, id) : n)}${etat === "" ? "" : etat === "incluse" ? ", incluse" : ", exclue"}">
    <span class="fl-coche" aria-hidden="true">${marque}</span><span class="fl-nom">${esc(n)}</span>${nombre != null ? `<span class="fl-n chiffres">${nombre}</span>` : ""}</button>`;
}
/** Une pastille retirable ; exclue, elle dit « Sans … » (`nomExcl` : le nom déjà fait par le moteur). */
export function pastilleHtml({ nom: n, exclu = false, nomExcl = null, attrs = "", id = null }) {
  const t = exclu ? (nomExcl ?? nomExclu(n, id)) : n;
  return `<button class="fl-pastille${exclu ? " exclue" : ""}" ${attrs} aria-label="Retirer le filtre ${esc(t)}">${exclu ? `<i aria-hidden="true">−</i>` : ""}${esc(t)}<span aria-hidden="true">✕</span></button>`;
}

/**
 * D453 (Arthur, 20/11 : « pas scroller pendant 20 ans ») : une feuille longue (plus de 30 cases, au-delà de deux écrans
 * à 390 px) replie ses groupes de plus de 6 cases ; un groupe replié dit combien de ses cases sont choisies, et s'ouvre
 * de lui-même quand il en a. Les mêmes seuils que l'iPhone (FeuilleFiltresListe, FeuilleFiltresPossessions).
 */
export const REPLI_TOTAL = 30, REPLI_GROUPE = 6;
export const seReplie = (total, n) => total > REPLI_TOTAL && n > REPLI_GROUPE;
/** Les groupes que le joueur a ouverts ou fermés lui-même (le temps de la page). */
const repliChoisi = new Map();
/** Un groupe de la feuille : `cases` (le HTML de chaque case), `choisis` (incluses et exclues), `total` (toutes les cases). */
export function groupeHtml(nom, cases, { total = 0, choisis = 0, titre = true, mode = "" } = {}) {
  const corps = mode + cases.join(""); // D462 : le mode d'un groupe de tests, en tête
  if (seReplie(total, cases.length)) {
    const ouvert = repliChoisi.get(nom) ?? choisis > 0;
    return `<details class="fl-groupe fl-repli" data-fl-groupe="${esc(nom)}"${ouvert ? " open" : ""}>
      <summary><span class="libelle">${esc(nom)}</span><span class="fl-n chiffres">${choisis ? `${choisis} choisi${choisis > 1 ? "s" : ""} · ` : ""}${cases.length}</span></summary>${corps}</details>`;
  }
  return `<div class="fl-groupe">${titre ? `<div class="libelle">${esc(nom)}</div>` : ""}${corps}</div>`;
}
if (typeof document !== "undefined" && !window.__filtresReplis) {
  window.__filtresReplis = true;
  document.addEventListener("toggle", (e) => { const d = e.target; if (d?.matches?.("details[data-fl-groupe]")) repliChoisi.set(d.dataset.flGroupe, d.open); }, true);
}

/** Les cases gardées qui servent encore (une case exclue sert tant que sa case existe). */
export function lireCoches(liste, f = connus[liste]) {
  const s = normaliser(new Set(String(L.lire(cle(liste), "")).split(",").filter((x) => x && x !== "!")));
  if (!f) return s;
  const toutes = new Set(f.groupes.flatMap((g) => g.options.map((o) => o.id)));
  return new Set([...s].filter((x) => toutes.has(base(x))));
}
export function ecrireCoches(liste, s) { L.ecrire(cle(liste), [...s].sort().join(",")); }

/** Cet élément passe-t-il les cases choisies ? */
export function garde(f, id, coches) {
  if (!f || !coches.size) return true;
  return gardeEtiquettes(new Set(f.etiquettes[id] ?? []), coches);
}
export const compter = (f, coches) => Object.keys(f.etiquettes).filter((id) => garde(f, id, coches)).length;
export function option(f, id) {
  for (const g of f.groupes) { const o = g.options.find((x) => x.id === base(id)); if (o) return o; }
  return null;
}
/** Le nom d'une case ; exclue (« !… »), le nom de sa pastille (« Sans traceur GPS »). */
export function nom(f, id) {
  const o = option(f, id);
  if (!o) return base(id);
  return estExclu(id) ? (o.nomExclu ?? nomExclu(o.nom, o.id)) : o.nom;
}
/** Quand rien ne passe : dire pourquoi, et quoi retirer (le même texte que le moteur). */
export function messageVide(f, coches) {
  if (!f || !coches.size || compter(f, coches) > 0) return null;
  return messageVideNoms([...coches].map((c) => nom(f, c)));
}

/** Enregistre les filtres d'une liste, et rend ses cases cochées. */
export function preparer(liste, f) {
  if (!f || !f.groupes?.length) { delete connus[liste]; return new Set(); }
  connus[liste] = f;
  return lireCoches(liste, f);
}

/** « Filtres · N », le compte, « Tout effacer » et les pastilles retirables. */
export function barreFiltres(liste) {
  const f = connus[liste];
  if (!f) return "";
  const c = lireCoches(liste, f);
  const n = c.size;
  return `<div class="fl-barre" data-liste="${esc(liste)}">
    <div class="fl-ligne">
      <button class="petit${n ? " plein" : ""}" data-action="filtresOuvrir" data-liste="${esc(liste)}">${n ? `Filtres · ${n}` : "Filtres"}</button>
      ${n ? `<span class="aide chiffres">${compter(f, c)} sur ${Object.keys(f.etiquettes).length}</span>
        <button class="fl-effacer" data-action="filtresEffacer" data-liste="${esc(liste)}">Tout effacer</button>` : ""}
    </div>
    ${n ? `<div class="fl-pastilles">${[...c].sort((a, b) => (base(a) < base(b) ? -1 : 1)).map((id) => pastilleHtml({ nom: nom(f, base(id)), exclu: estExclu(id), nomExcl: nom(f, id),
      attrs: `data-action="filtresRetirer" data-liste="${esc(liste)}" data-id="${esc(id)}"` })).join("")}</div>` : ""}
  </div>`;
}

function feuille(liste) {
  const f = connus[liste];
  if (!f) return "";
  const c = lireCoches(liste, f);
  const m = messageVide(f, c);
  const total = f.groupes.reduce((n, g) => n + g.options.length, 0);
  return `<div class="pile fl-feuille">${aideHtml()}
    ${f.groupes.map((g) => groupeHtml(g.nom, g.options.map((o) => caseHtml({ etat: etatCase(c, o.id), nom: o.nom, nombre: o.nombre, id: o.id,
        attrs: `data-action="filtresBasculer" data-liste="${esc(liste)}" data-id="${esc(o.id)}"` })),
      { total, choisis: g.options.filter((o) => etatCase(c, o.id)).length })).join("")}
    ${m ? `<p class="aide" style="color:var(--alerte)">${esc(m)}</p>` : ""}
    <div class="rangee" style="gap:8px">
      <button class="bouton secondaire" data-action="filtresEffacer" data-liste="${esc(liste)}" ${c.size ? "" : "disabled"}>Tout effacer</button>
      <button class="bouton" data-action="filtresVoir">Voir ${compter(f, c)}</button>
    </div>
  </div>`;
}

/** Les gestes : à ajouter aux actions des pages qui montrent une barre de filtres. */
export const actionsFiltres = {
  filtresOuvrir(ctx, b) {
    const liste = b.dataset.liste;
    ctx.feuille({ titre: "Filtres", rendu: () => feuille(liste), actions: actionsFiltres });
  },
  filtresBasculer(ctx, b) {
    const liste = b.dataset.liste, id = b.dataset.id;
    ecrireCoches(liste, basculerCase(lireCoches(liste), id)); // D453 : vide → incluse → exclue → vide
    ctx.redessiner();
  },
  filtresRetirer(ctx, b) {
    ecrireCoches(b.dataset.liste, retirerCase(lireCoches(b.dataset.liste), b.dataset.id));
    ctx.redessiner();
  },
  filtresEffacer(ctx, b) { ecrireCoches(b.dataset.liste, new Set()); ctx.redessiner(); },
  filtresVoir(ctx) { ctx.fermerFeuille(); ctx.redessiner(); },
};

/** Le style, posé une fois (les mêmes formes que la console et les pilules du jeu). */
if (typeof document !== "undefined" && document.head && !document.getElementById("css-filtres-listes")) {
  const s = document.createElement("style");
  s.id = "css-filtres-listes";
  s.textContent = `
.fl-barre{display:flex;flex-direction:column;gap:8px;min-width:0}
.fl-ligne{display:flex;align-items:center;gap:8px;min-width:0}
.fl-ligne .aide{white-space:nowrap}
.fl-effacer{margin-left:auto;background:none;border:0;color:var(--accent);font:600 12px/1 inherit;cursor:pointer;white-space:nowrap}
.fl-pastilles{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.fl-pastille{flex:none;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:0;background:var(--puce2,rgba(255,255,255,.1));color:var(--texte);font:500 13px/1.1 inherit;cursor:pointer;white-space:nowrap}
.fl-pastille span{font-size:10px;font-weight:700;opacity:.8}
.fl-feuille{gap:16px}
.fl-groupe{display:flex;flex-direction:column;gap:2px}
.fl-case{display:flex;align-items:center;gap:10px;min-height:38px;background:none;border:0;color:var(--texte);font:400 15px/1.2 inherit;text-align:left;cursor:pointer;padding:0;width:100%}
.fl-coche{display:grid;place-items:center;width:20px;height:20px;border-radius:5px;border:1.5px solid var(--texte2);font-size:13px;font-weight:700;flex:none}
.fl-case.cochee .fl-coche{background:var(--accent);border-color:var(--accent);color:var(--fond)}
.fl-nom{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fl-n{color:var(--texte3,var(--texte2));font-size:13px}
.fl-aide{margin:0;font-size:13px}
.fl-repli summary{display:flex;align-items:center;gap:8px;min-height:38px;cursor:pointer;list-style:none}
.fl-repli summary::-webkit-details-marker{display:none}
.fl-repli summary .libelle{flex:1;margin:0}
.fl-repli summary::after{content:"›";font-size:18px;color:var(--texte2);transform:rotate(90deg);transition:transform var(--d-court,.15s)}
.fl-repli[open] summary::after{transform:rotate(-90deg)}
.fl-case.exclue .fl-coche{background:transparent;border-color:var(--danger,#ff5c5c);color:var(--danger,#ff5c5c)}
.fl-case.exclue .fl-nom{text-decoration:line-through;text-decoration-color:var(--danger,#ff5c5c);color:var(--texte2)}
.fl-pastille.exclue{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--danger,#ff5c5c) 55%,transparent)}
.fl-pastille i{font-style:normal;font-weight:700;color:var(--danger,#ff5c5c)}
.fl-pastille.barree{text-decoration:line-through;text-decoration-color:var(--danger,#ff5c5c);color:var(--texte2)}
.mf-aide{flex-basis:100%;margin:0 0 2px}`;
  document.head.append(s);
}

// MARK: - La feuille des barres de liste simples (D442) : sans action de page à déclarer

/**
 * Pour une barre qui garde ses filtres dans un tableau (`actifs`, modifié sur place par l'action de la page) :
 * `boutonFeuille` rend « Filtres · N » ; le toucher ouvre la feuille, dont chaque case appelle l'action de la page
 * (`action`, avec `data-<cleDonnee>`), puis la feuille et la page se redessinent.
 */
const simples = {};
/**
 * D453 : l'action de la page fait tourner la case (`gesteTableau`) ; la croix d'une pastille porte `data-retirer`
 * (l'action la retire alors, incluse ou exclue).
 */
/** D462 : dans une liste gardée en tableau, ce jeton dit que ses cases « tests » se combinent en « Au moins une ». */
export const MODE_OU = "@ou";
export function boutonFeuille(cle, { filtres, actifs, action, cleDonnee = "filtre", modeOu = false }) {
  simples[cle] = { filtres, actifs, action, cleDonnee, modeOu };
  const choisis = filtres.filter(([id]) => etatCase(actifs, id));
  return `<div class="fl-ligne"><button class="petit${choisis.length ? " plein" : ""}" data-fl-ouvrir="${esc(cle)}">${choisis.length ? `Filtres · ${choisis.length}` : "Filtres"}</button>
    ${choisis.length ? `<div class="fl-pastilles">${choisis.map(([id, n]) => pastilleHtml({ nom: n, exclu: etatCase(actifs, id) === "exclue", id,
      attrs: `data-action="${esc(action)}" data-${cleDonnee}="${esc(id)}" data-retirer="1" data-fl-rafraichir` })).join("")}</div>` : ""}</div>`;
}
function feuilleSimple(cle) {
  const s = simples[cle];
  if (!s) return "";
  // D462 : « Toutes » ou « Au moins une » pour les cases « tests » de la liste.
  const mode = s.modeOu ? modeHtml(versSet(s.actifs).has(MODE_OU), `data-action="${esc(s.action)}" data-fl-mode="1" data-fl-rafraichir`) : "";
  return `<div class="pile fl-feuille">${aideHtml()}<div class="fl-groupe">${mode}
    ${s.filtres.map(([id, n]) => caseHtml({ etat: etatCase(s.actifs, id), nom: n, id, attrs: `data-action="${esc(s.action)}" data-${s.cleDonnee}="${esc(id)}" data-fl-rafraichir` })).join("")}</div>
    <button class="bouton" data-action="fermerFeuille">Voir</button></div>`;
}
/** L'action d'une page à `boutonFeuille` (filtres gardés dans un tableau) : la case tourne, la pastille retire. */
export function gesteTableau(liste, b, cleDonnee = "filtre") {
  if (b.dataset.flMode) { // D462 : le mode des cases « tests »
    const sans = liste.filter((x) => x !== MODE_OU);
    liste.splice(0, liste.length, ...sans, ...(b.dataset.ou === "1" ? [MODE_OU] : []));
    return;
  }
  const id = b.dataset[cleDonnee];
  if (b.dataset.retirer) retirerTableau(liste, id); else basculerTableau(liste, id);
}
if (typeof document !== "undefined" && !window.__filtresSimples) {
  window.__filtresSimples = true;
  document.addEventListener("click", (e) => {
    const ctx = window.__grind?.ctx;
    const o = e.target.closest?.("[data-fl-ouvrir]");
    if (o && ctx) { const cle = o.dataset.flOuvrir; ctx.feuille({ titre: "Filtres", rendu: () => feuilleSimple(cle) }); return; }
    if (e.target.closest?.("[data-fl-rafraichir]") && ctx) setTimeout(() => ctx.redessiner?.(), 40);
  });
}
