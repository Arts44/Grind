// ══════════════════════════════════════════════════════════════════════
//  Les briques des catalogues (lot D, docs/inventaire-web.md § 2.6, 2.7, 4) :
//
//   - les photos de l'iPhone (web/photos, scripts/photos-web.py), comme
//     PhotosVehicules et PhotosMontres : seules celles qui existent sont
//     demandées (web/photos/index.json), à la demande (`loading="lazy"`),
//     la silhouette dessinée dessous en repli ;
//   - (les feuilles de style d'une zone : la déclaration `css:` des pages,
//     lot A ; `listeEtDetail` ajoute « catalogues » à la liste et aux détails) ;
//   - les catalogues de la balance et les tableaux lourds gardés en mémoire
//     au lieu d'être relus à chaque ouverture ;
//   - la liste + le détail du grand écran (palier large, ≥ 1 100 px) : sur
//     le socle du lot A (#panneau, `panneau: true`, `renduLarge`) ; avant le
//     premier choix, la liste et une invitation à choisir côte à côte.
// ══════════════════════════════════════════════════════════════════════
import { esc } from "../format.js";

// MARK: - Les photos

let index = null; // { vehicule: Set, bien: Set, montre: Set }
let lecture = null;
/** La liste des photos publiées (une lecture par session, gardée hors ligne par le service worker). */
export function chargerPhotos() {
  if (index) return Promise.resolve(index);
  if (!lecture) {
    lecture = fetch("photos/index.json")
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}))
      .then((j) => (index = { vehicule: new Set(j.vehicule ?? []), bien: new Set(j.bien ?? []), montre: new Set(j.montre ?? []) }));
  }
  return lecture;
}
if (typeof fetch !== "undefined" && typeof document !== "undefined") chargerPhotos();

const DOSSIERS = { vehicule: "vehicules", bien: "biens", montre: "montres" };
/** Vrai si la photo existe (« vehicule », « bien », « montre » ; les bateaux sont des véhicules). */
export const aPhoto = (sorte, id) => !!(id && index?.[sorte]?.has(id));
export const urlPhoto = (sorte, id) => `photos/${DOSSIERS[sorte]}/${sorte}-${encodeURIComponent(id)}.webp`;

/**
 * La photo, posée par-dessus le dessin : si elle ne se charge pas (hors ligne, pas encore en cache),
 * elle s'efface et le dessin reste. Rien si la photo n'existe pas.
 */
export function photo(sorte, id, { eteinte = false, classe = "", voile = true, prioritaire = false } = {}) {
  if (!aPhoto(sorte, id)) return "";
  return `<img class="cat-photo ${eteinte ? "eteinte" : ""} ${classe}" src="${urlPhoto(sorte, id)}" alt="" ${prioritaire ? 'fetchpriority="high"' : 'loading="lazy"'} draggable="false"
    onerror="this.remove()">${voile ? `<i class="cat-voile" aria-hidden="true"></i>` : ""}`;
}

/** Les crédits des photos (auteur, licence, source), exigés par leurs licences libres. */
let credits = null;
export async function creditsPhotos() {
  if (!credits) credits = await fetch("photos/credits.json").then((r) => (r.ok ? r.json() : [])).catch(() => []);
  return credits;
}

// MARK: - Les catalogues et les tableaux gardés

const balances = new Map();
/** Une partie de la balance : elle ne change qu'avec la version du site, une lecture par session suffit. */
export function balanceGardee(ctx, partie) {
  if (!balances.has(partie)) {
    balances.set(partie, ctx.balance(partie).then((b) => { if (b == null) balances.delete(partie); return b; }));
  }
  return balances.get(partie);
}

/**
 * Un tableau lourd (l'horlogerie, le monde), lu une fois par instantané du jeu : tant que l'état du jeu
 * n'a pas changé (pas de décision, pas de rafraîchissement) et depuis moins de 15 s, les pages qui
 * le demandent (horlogerie, maison, modèle, annonces…) partagent la même lecture.
 */
const instantanes = new Map();
export function tableauGarde(ctx, nom, params = {}) {
  const cle = `${nom}:${JSON.stringify(params)}`;
  const jeu = ctx.etat.jeu;
  const x = instantanes.get(cle);
  if (x && x.jeu === jeu && Date.now() - x.a < 15_000) return x.lecture;
  const lecture = ctx.tableau(nom, params);
  instantanes.set(cle, { jeu, a: Date.now(), lecture });
  lecture.then((t) => { if (t == null) instantanes.delete(cle); }, () => instantanes.delete(cle));
  return lecture;
}

// MARK: - Le grand écran : liste + détail (le socle du lot A, docs/web-design.md § 6)

const ouvertsDOffice = new WeakSet(); // les entrées de liste dont le premier détail s'est déjà ouvert seul
const avecCatalogues = (css) => [...new Set([...[].concat(css ?? []), "catalogues"])];

/**
 * Une page de liste et ses pages de détail : au palier large, chaque détail s'ouvre dans le panneau de droite
 * (`panneau: true`, lot A : un détail ouvert depuis la liste remplace le précédent, ✕ ferme, « retour » vide le
 * panneau). Sans détail ouvert, `renduLarge` montre la liste et `vide(d)` à côté. `premier(d)` : le détail à
 * ouvrir de lui-même la première fois au palier large ({ page, p }), facultatif.
 */
export function listeEtDetail(id, liste, details, { vide = () => "", premier = null } = {}) {
  for (const det of Object.values(details)) {
    det.panneau ??= true;
    det.css = avecCatalogues(det.css);
  }
  return {
    ...liste,
    css: avecCatalogues(liste.css),
    renduLarge(d, ctx, p) {
      const gauche = liste.rendu(d, ctx, p);
      if (ctx.palier !== "large") return gauche;
      return `<div class="ld" data-ld="${esc(id)}"><section class="ld-liste">${gauche}</section>
        <section class="ld-vide" aria-label="Détail">${vide(d)}</section></div>`;
    },
    apres(ctx, d, p) {
      liste.apres?.(ctx, d, p);
      if (!premier || ctx.palier !== "large" || ctx.avecPanneau || ouvertsDOffice.has(p)) return;
      ouvertsDOffice.add(p);
      const x = premier(d);
      if (x && details[x.page]) setTimeout(() => ctx.ouvrir(x.page, x.p ?? {}, { remplacer: true }));
    },
  };
}

/** Le panneau de droite avant le premier choix. */
export const videDetail = (titre, texte) => `<div><div class="cat-vide-titre">${esc(titre)}</div><div>${esc(texte)}</div></div>`;

/** La ligne choisie dans la liste : app.js (lot A) la marque lui-même (aria-current) ; gardé pour les appels. */
export const estChoisi = () => false;
