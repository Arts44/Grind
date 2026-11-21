// ══════════════════════════════════════════════════════════════════════
//  icones-jeu.js — D353 (1.18.13) : les vingt icônes du jeu et leur
//  mouvement (vidéo 1), en deux jeux à comparer avant qu'Arthur choisisse :
//
//   - « sf »     : le trait des SF Symbols de l'iPhone, redessiné pour le web
//                  (l'iPhone les anime avec symbolEffect) ;
//   - « reicon » : Reicon (MIT, d'après Solar Icons CC BY 4.0), que nous
//                  animons nous-mêmes (le trait se dessine, puis le geste).
//
//  JEU_ICONES dit lequel l'app montre : « reicon », le choix d'Arthur (14/11
//  20:50) ; « sf » reste un essai (?icones=sf). Le même mouvement sert aux deux jeux :
//  un onglet touché, une action touchée, une tuile de l'accueil à l'ouverture.
//  « Moins d'animations » et le mode économie : l'icône est là, immobile
//  (jetons.css coupe les animations ; rien ici ne dépend d'elles).
//  L'équivalent iPhone : Rente/Design/IconesJeu.swift.
// ══════════════════════════════════════════════════════════════════════
import { icones } from "./ui.js?v=3e8bddd9";
import { REICON } from "./icones-reicon.js?v=3e8bddd9";

/** Le jeu montré dans l'app : « reicon » (par défaut, choix d'Arthur) ou « sf ». Un réglage d'essai (?icones=sf) le change. */
export const JEU_ICONES = (() => {
  try {
    const q = new URLSearchParams(location.search).get("icones");
    if (q === "reicon" || q === "sf") { localStorage.setItem("grind.icones", q); return q; }
    return localStorage.getItem("grind.icones") === "sf" ? "sf" : "reicon";
  } catch { return "reicon"; }
})();

const T = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/** Le corps d'une icône de ui.js (sans sa balise svg), pour la redessiner en trait fin. */
const corps = (nom) => (icones[nom] ?? "").replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");

/**
 * Les vingt : [symbole SF de l'iPhone, dessin web du symbole, mouvement].
 * Mouvements : rebond, balance (cloche), tourne (engrenage, plus), avance (voiture), envol (avion, envoi),
 * bat (cœur), loupe, ouvre (portefeuille, sac), deplie (carte), trace (courbe), vise (cible), bascule (masques).
 */
export const ICONES_JEU = {
  focus: ["timer", corps("focus"), "rebond"],
  banque: ["wallet.bifold", corps("banque"), "ouvre"],
  accueil: ["house", corps("accueil"), "rebond"],
  carte: ["map", corps("carte"), "deplie"],
  actifs: ["car", corps("actifs"), "avance"],
  lancer: ["play.circle", '<circle cx="12" cy="12" r="9"/><path d="M10 8.6v6.8l5.4-3.4z"/>', "rebond"],
  acheter: ["bag", '<path d="M5 8h14l-1 12.5H6z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>', "ouvre"],
  envoyer: ["paperplane", '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m10 13 4.5-4.5"/>', "envol"],
  ajouter: ["plus.circle", '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>', "tourne"],
  chercher: ["magnifyingglass", '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>', "loupe"],
  notifications: ["bell", corps("cloche"), "balance"],
  reglages: ["gearshape", '<circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.6 2.3 2.8-.6.6 2.8 2.3 1.6-1.2 2.6 1.2 2.6-2.3 1.6-.6 2.8-2.8-.6L12 21.2l-1.6-2.3-2.8.6-.6-2.8-2.3-1.6L5.9 12l-1.2-2.6L7 7.8l.6-2.8 2.8.6z"/>', "tourne"],
  profil: ["person", corps("personne"), "rebond"],
  voyager: ["airplane", '<path d="M10.5 3.5c0-1 .7-1.5 1.5-1.5s1.5.5 1.5 1.5V9l7.5 4.5V16L13.5 13.5V18l2.5 2v1.5L12 20.5l-4 1V20l2.5-2v-4.5L3 16v-2.5L10.5 9z"/>', "envol"],
  plaisir: ["heart", corps("coeur"), "bat"],
  objectif: ["scope", corps("cible"), "vise"],
  activite: ["chart.line.uptrend.xyaxis", '<path d="M4 4v16h16"/><path d="m7.5 14.5 3.5-4 3 2.5 5-6"/><path d="M15.5 7H19v3.5"/>', "trace"],
  combines: ["theatermasks", corps("masque"), "bascule"],
  repas: ["fork.knife", '<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6"/><path d="M17 21V3c-2 1.5-3 4-3 7v4h3"/>', "rebond"],
  joueurs: ["person.2", corps("amis"), "rebond"],
  // D373 : la photo et l'appel de la conversation.
  photo: ["camera", '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H7l1.5-2h7L17 6h1.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.5"/>', "rebond"],
  appel: ["phone", '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 7 7L16 14l5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>', "rebond"],
};

/** Le dessin d'une icône dans un jeu : le trait SF (web) ou les chemins Reicon (chacun sait se dessiner). */
export function dessinJeu(id, jeu = JEU_ICONES) {
  const e = ICONES_JEU[id];
  if (!e) return icones[id] ?? "";
  if (jeu === "reicon" && REICON[id]) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${REICON[id].map((d) => (d.startsWith("F:")
      ? `<path class="pl" fill="currentColor" stroke="none" fill-rule="evenodd" d="${d.slice(2)}"/>`
      : `<path pathLength="1" d="${d}"/>`)).join("")}</svg>`;
  }
  return T(e[1]);
}

/**
 * Une icône du jeu qui bouge quand on la touche (son bouton) : `entree` la joue une fois à son apparition
 * (les tuiles de l'accueil). Rend un <span class="icj">, à poser dans un bouton ou une tuile.
 */
export function iconeJeu(id, { jeu = JEU_ICONES, entree = false, classe = "" } = {}) {
  const e = ICONES_JEU[id];
  if (!e) return icones[id] ?? "";
  return `<span class="icj icj-${e[2]} icj-${jeu}${entree ? " icj-entree" : ""}${classe ? ` ${classe}` : ""}" data-icj="${id}" aria-hidden="true">${dessinJeu(id, jeu)}</span>`;
}

/** Rejoue le mouvement d'une icône (on retire la classe, on laisse le navigateur la voir partir, on la remet). */
export function jouerIcone(el) {
  if (!el) return;
  el.classList.remove("icj-joue");
  void el.offsetWidth;
  el.classList.add("icj-joue");
}

/** Branché une fois (app.js) : toucher un bouton qui porte une icône du jeu la fait bouger. */
export function brancherIconesJeu() {
  document.addEventListener("pointerdown", (ev) => {
    const b = ev.target.closest?.("button, [data-action], a");
    if (!b) return;
    for (const i of b.querySelectorAll(".icj, .icj-svg")) jouerIcone(i);
  }, true);
  // Le clavier (Entrée, Espace) aussi.
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    const b = document.activeElement?.closest?.("button, [data-action], a");
    if (b) for (const i of b.querySelectorAll(".icj, .icj-svg")) jouerIcone(i);
  }, true);
}
