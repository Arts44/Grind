// ══════════════════════════════════════════════════════════════════════
//  Ce qui est à toi sur cet appareil (CompteLocal, Accent de l'iPhone) :
//  l'avatar (symbole et teinte, D393), la couleur d'accent (les sons et les
//  vibrations : sons.js, lot A). Comme les @AppStorage de l'iPhone, tout
//  reste dans ce navigateur ; mêmes clés que l'iPhone pour s'y retrouver.
//
//  L'accent est posé sur :root dès que ce module est chargé (avant le
//  premier dessin) : `--accent` est le jeton du lot A, ce module n'en
//  change que la valeur.
// ══════════════════════════════════════════════════════════════════════
import { esc } from "./format.js?v=3e8bddd9";

const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, String(v)); } catch {} };

export const CLES = {
  symbole: "compte.symbole", teinte: "compte.teinte", depuis: "compte.depuis",
  accent: "graphite.accent",
  // Le titre de saison et le cadre (D123) : D388, plus choisis ni montrés ; les clés restent pour les anciens réglages.
  titre: "grind.titre", cadre: "grind.cadre",
};

// MARK: L'avatar (AvatarJoueur)

// D393 (Arthur 16/11) : l'avatar des joueurs revient (D388 l'avait retiré), sans cadre : un symbole blanc sur sa
// teinte. Il se choisit dans Personnaliser mon profil ; la teinte colore aussi ton point sur la carte et ta courbe.
/** Les douze symboles de l'iPhone (CompteLocal.symboles), dessinés pleins, blancs sur la teinte. */
export const SYMBOLES = {
  "person.fill": '<circle cx="12" cy="7.6" r="4.3"/><path d="M3.8 21c.9-4.7 4.2-7.3 8.2-7.3s7.3 2.6 8.2 7.3z"/>',
  "bolt.fill": '<path d="M13.6 2.5 4.8 13.4h6l-1.5 8.1 8.9-11h-6z"/>',
  "flame.fill": '<path d="M12 22c-4 0-7-2.8-7-6.7 0-3.3 2-5.5 3.8-7.5.4 1.6 1.2 2.7 2.4 3.2-.3-3.6 1.2-6.7 4.3-8.5-.2 3.2 1.4 5 2.9 6.9 1.2 1.6 1.6 3.2 1.6 5 0 4.4-3.2 7.6-8 7.6zm0-1.8c1.9 0 3.2-1.3 3.2-3.1 0-1.6-1-2.7-2.3-4-.2 1.3-.9 2.2-2 2.6.1-1.2-.2-2.3-1-3.2-.8 1.1-1.3 2.2-1.3 3.5 0 2.4 1.5 4.2 3.4 4.2z"/>',
  "crown.fill": '<path d="M3 7.5 7.6 11 12 4.5l4.4 6.5L21 7.5 19.3 17H4.7zM4.9 18.6h14.2v2.2H4.9z"/>',
  "star.fill": '<path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>',
  "moon.stars.fill": '<path d="M13.2 4.1A8.2 8.2 0 1 0 20 15.9 7 7 0 0 1 13.2 4.1z"/><path d="m18 2.6.7 1.6 1.6.7-1.6.7L18 7.2l-.7-1.6-1.6-.7 1.6-.7zM21 8.6l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z"/>',
  "leaf.fill": '<path d="M20.5 3.5C11.4 3.6 4.6 7.4 4.6 14.4c0 1.6.5 3.1 1.4 4.3L3.5 21.2l1.3 1.3 2.6-2.6c1.2.8 2.6 1.2 4.1 1.2 6.4 0 9.1-6.9 9-17.6zM8.6 17.1c2.5-3.6 5.3-6.4 8.7-8.6-3 2.7-5.5 5.6-7.4 9.7z"/>',
  "mountain.2.fill": '<path d="M1.5 20 8.8 7.5l3.4 5.8 2.3-3.5L22.5 20z"/>',
  "figure.strengthtraining.traditional": '<circle cx="12" cy="4.6" r="2.3"/><path d="M2 8.2h2.2V6.5h1.6v1.7h12.4V6.5h1.6v1.7H22v1.6h-2.2v1.7h-1.6V9.8H14v3.4l1.9 7.8h-2.2L12 14.6 10.3 21H8.1L10 13.2V9.8H5.8v1.7H4.2V9.8H2z"/>',
  "gamecontroller.fill": '<path d="M7.4 6.5h9.2c3 0 4.9 2.3 5.4 5.6l.7 4.3c.4 2.3-1 4.1-2.9 4.1-1.4 0-2.3-.9-3-2l-1.1-1.8H8.3l-1.1 1.8c-.7 1.1-1.6 2-3 2-1.9 0-3.3-1.8-2.9-4.1l.7-4.3c.5-3.3 2.4-5.6 5.4-5.6zM6.6 9.6v1.6H5v1.6h1.6v1.6h1.6v-1.6h1.6v-1.6H8.2V9.6zm9.9.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zm-1.9 2.4a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"/>',
  "car.side.fill": '<path d="M2 15.2v-2.6l2.6-1.1 2.7-3.7c.4-.5.9-.8 1.6-.8h5.5c.6 0 1.1.3 1.5.7l3.1 3.3 2.6.7c.8.2 1.4.9 1.4 1.8v1.7h-1.9a2.9 2.9 0 0 0-5.6 0H9.4a2.9 2.9 0 0 0-5.6 0zm4.6-.2a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8zm10.8 0a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8z"/>',
  "sailboat.fill": '<path d="M11.2 2.5v12.8H4.4zM12.8 5.3l6.3 10H12.8zM2.5 16.9h19l-2.4 3.6H4.9z"/>',
};
export const LISTE_SYMBOLES = Object.keys(SYMBOLES);
/** CompteLocal.teintes : la couleur du médaillon, de ton point sur la carte et de ta courbe. */
export const TEINTES = [0x34c88a, 0x4f9be8, 0x9d8cff, 0xe3c46b, 0xe0a33a, 0xff8a9a, 0x8a8f98];
export const hex = (n) => `#${n.toString(16).padStart(6, "0")}`;

export const symboleChoisi = () => (SYMBOLES[lire(CLES.symbole)] ? lire(CLES.symbole) : "person.fill");
export const teinteChoisie = () => Math.min(TEINTES.length - 1, Math.max(0, Number(lire(CLES.teinte) ?? 0) || 0));
export function choisirSymbole(s) { if (SYMBOLES[s]) ecrire(CLES.symbole, s); }
export function choisirTeinte(i) { ecrire(CLES.teinte, Math.min(TEINTES.length - 1, Math.max(0, Number(i) || 0))); appliquerTeinte(); }
/** D393 : ta teinte sur la page (`--ma-teinte`) : ton point sur la carte (.mk-position, .ct-position) la suit, comme PositionVille. */
export function appliquerTeinte() {
  if (typeof document !== "undefined") document.documentElement.style.setProperty("--ma-teinte", hex(TEINTES[teinteChoisie()]));
}

/** Le symbole seul, en SVG plein (pour les grilles de choix). */
export const svgSymbole = (s, taille = 20) =>
  `<svg viewBox="0 0 24 24" width="${taille}" height="${taille}" fill="currentColor" aria-hidden="true">${SYMBOLES[s] ?? SYMBOLES["person.fill"]}</svg>`;

/** Le médaillon d'un joueur (AvatarJoueur, AvatarAutre) : son symbole blanc sur sa teinte (nombre), sans cadre (D388).
 *  Par défaut, le tien. La taille passe en variable CSS. */
export function avatarJoueur(taille = 36, { symbole = symboleChoisi(), teinte = TEINTES[teinteChoisie()] } = {}) {
  const t = (Number(teinte) >>> 0) & 0xffffff;
  return `<span class="cl-avatar" style="--taille:${taille}px;--c:${hex(t)}" aria-hidden="true">${svgSymbole(SYMBOLES[symbole] ? symbole : "person.fill", Math.round(taille * 0.46))}</span>`;
}

/** « Membre depuis » : posé au premier passage, comme l'iPhone. */
export function membreDepuis(maintenant = Date.now()) {
  let t = Number(lire(CLES.depuis) ?? 0);
  if (!t) { t = maintenant; ecrire(CLES.depuis, t); }
  return t;
}

/** Ce que le mode en ligne publie (ProfilPublic) : le symbole et la teinte (D393 : de nouveau montrés comme avatar). */
export const avatarPublie = () => ({ symbole: symboleChoisi(), teinte: TEINTES[teinteChoisie()] });

// MARK: « Toujours là ? » (RNT-217, Réglages › Focus)

/** Le réglage perso du contrôle de présence : posé tant qu'on ne l'a pas coupé (même clé que l'iPhone). */
export const CLE_CONTROLE = "focus.controlePresence";
export const controlePresenceActif = () => lire(CLE_CONTROLE) !== "false";
export function basculerControlePresence() { ecrire(CLE_CONTROLE, controlePresenceActif() ? "false" : null); }

// MARK: La couleur d'accent (Accent)

/** Les six accents libres, puis ceux gagnés en fin de saison (D123). */
export const ACCENTS = [
  ["emeraude", "Émeraude", "#34C88A"], ["bleu", "Bleu", "#4F9BE8"], ["violet", "Violet", "#9D8CFF"],
  ["or", "Or", "#E3C46B"], ["cuivre", "Cuivre", "#E08A55"], ["rose", "Rose", "#F2789F"],
  ["platine", "Platine", "#C9D4E3", true], ["rubis", "Rubis", "#E0475F", true],
].map(([id, nom, couleur, exclusif = false]) => ({ id, nom, couleur, exclusif }));

export const accentChoisi = () => ACCENTS.find((a) => a.id === lire(CLES.accent)) ?? ACCENTS[0];

/** Pose l'accent sur la page : le bouton principal, la perle, les sélections le suivent. */
export function appliquerAccent(a = accentChoisi()) {
  const r = document.documentElement;
  if (a.id === "emeraude") r.style.removeProperty("--accent");
  else r.style.setProperty("--accent", a.couleur);
}

export function choisirAccent(id) {
  const a = ACCENTS.find((x) => x.id === id);
  if (!a) return;
  ecrire(CLES.accent, a.id);
  appliquerAccent(a);
}

/** Les accents qu'on peut choisir : les libres, et les exclusifs gagnés (`gagnes` : leurs identifiants). */
export const accentsDisponibles = (gagnes = []) => ACCENTS.filter((a) => !a.exclusif || gagnes.includes(a.id));

// Sons et vibrations : web/js/sons.js (lot A, mêmes clés reglages.sons / reglages.vibrations).
// Les feuilles de style des pages : la déclaration `css:` de chaque page (lot A) ; compte.css (l'avatar,
// les accents) est déclaré par les pages qui en ont besoin (accueil, réglages, profil, départ).

export { esc };

appliquerAccent();
appliquerTeinte();
