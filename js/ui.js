// ══════════════════════════════════════════════════════════════════════
//  Les briques des écrans (D186, lot A) — l'équivalent web de Rente/Design :
//  carte, ligne de carte, boutons, segment, rail, chiffre héros (qui roule),
//  courbe, pastille d'icône, interrupteur, champ fichier, photo avec repli,
//  confirmation, bouton d'aide, colonnes du grand écran. Chaque fonction
//  rend du HTML (sauf `confirmer`, qui ouvre une feuille et rend une
//  promesse) ; les textes venus d'ailleurs passent par `esc`. Les styles
//  sont dans css/composants.css ; la convention dans docs/web-design.md.
//
//  Navigation dans le HTML :
//    data-action="ouvrir" data-page="banque.credit" data-p='{"id":3}'  → pousse une page
//    data-action="retour"                                               → revient
//    data-action="<nom>"                                                → action de la page (ou globale)
// ══════════════════════════════════════════════════════════════════════
import { esc, montant, variation, deviseAffichage, depuisAffichage } from "./format.js?v=3e8bddd9";
export { esc };
export { patcher } from "./patcher.js?v=3e8bddd9";

// MARK: Icônes (traits simples, 24 × 24, couleur du texte)

const I = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icones = {
  focus: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>'),
  banque: I('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>'),
  accueil: I('<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>'),
  marches: I('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'),
  actifs: I('<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="15" width="18" height="4" rx="1.5"/><circle cx="7.5" cy="19.5" r="1.5"/><circle cx="16.5" cy="19.5" r="1.5"/>'),
  retour: I('<path d="M15 5l-7 7 7 7"/>'),
  chevron: I('<path d="M9 5l7 7-7 7"/>'),
  fermer: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  cloche: I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>'),
  personne: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  amis: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>'),
  fleches: I('<path d="M7 7h12l-3-3M17 17H5l3 3"/>'),
  boite: I('<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20.5v-6h6v6"/>'),
  maison: I('<path d="M4 20V9l8-5 8 5v11zM10 20v-5h4v5"/>'),
  voiture: I('<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="15" width="18" height="4" rx="1.5"/>'),
  carte: I('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>'),
  masque: I('<path d="M4 6c3 1 13 1 16 0v5a8 8 0 0 1-16 0zM8.5 11h2M13.5 11h2M9.5 15.5c1.5 1 3.5 1 5 0"/>'),
  coeur: I('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
  cible: I('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>'),
  camembert: I('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
  activite: I('<path d="M4 7h16M4 12h10M4 17h13"/>'),
  reglages: I('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  sablier: I('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>'),
  euro: I('<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4.5 10.5h9M4.5 13.5h9"/>'),
  bouclier: I('<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/>'),
  document: I('<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>'),
  verrou: I('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  image: I('<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 8.5"/>'),
  alerte: I('<path d="M12 4 2.8 19.5h18.4zM12 10v4.5M12 17v.3"/>'),
  question: I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.2-2.5 3.8M12 17v.3"/>'),
  son: I('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
};

// MARK: Mise en page

/** En-tête d'un onglet racine : grand titre (30, 700), sous-titre, et des boutons à droite. */
export const enteteRacine = (titre, { sous = "", droite = "" } = {}) => `
  <header class="entete-racine">
    <div><h1 class="titre-onglet">${esc(titre)}</h1>${sous ? `<div class="sous">${sous}</div>` : ""}</div>
    ${droite ? `<div class="rangee">${droite}</div>` : ""}
  </header>`;

/** En-tête d'une page poussée : retour, titre (20, 600), et des boutons à droite. */
export const entetePousse = (titre, droite = "") => `
  <header class="entete-pousse">
    <button class="rond" data-action="retour" aria-label="Retour">${icones.retour}</button>
    <h1>${esc(titre)}</h1>${droite}
  </header>`;

export const section = (t) => `<div class="section">${esc(t)}</div>`;

/** Carte : `contenu` tel quel ; `pad` ajoute la marge intérieure de 16. */
export const carte = (contenu, { pad = false, classe = "", attrs = "" } = {}) =>
  `<div class="carte ${pad ? "pad" : ""} ${classe}" ${attrs}>${contenu}</div>`;

/**
 * Une ligne de carte : pastille, titre, détail, valeur à droite. Avec `page`, la ligne ouvre cette page ;
 * avec `action`, elle déclenche l'action (et `donnees` part en data-*).
 */
export function ligne({ titre, detail = "", valeur = "", couleurValeur = "", icone = "", teinte = "", page = "", p = null, action = "", donnees = {}, desactive = false }) {
  const pastille = icone ? `<span class="pastille" style="--c:${teinte || "var(--accent)"}">${icones[icone] ?? icone}</span>` : "";
  const v = valeur !== "" ? `<span class="valeur ${couleurValeur}">${valeur}</span>` : "";
  const ch = page || action ? `<span class="chevron">${icones.chevron}</span>` : "";
  const corps = `${pastille}<span class="ligne-corps"><div class="titre">${titre}</div>${detail ? `<div class="detail">${detail}</div>` : ""}</span>${v}${ch}`;
  if (page) return `<button class="ligne" data-action="ouvrir" data-page="${esc(page)}" ${p ? `data-p='${esc(JSON.stringify(p))}'` : ""} ${desactive ? "disabled" : ""}>${corps}</button>`;
  if (action) return `<button class="ligne" data-action="${esc(action)}" ${attrsDonnees(donnees)} ${desactive ? "disabled" : ""}>${corps}</button>`;
  return `<div class="ligne">${corps}</div>`;
}

/** Libellé à gauche, valeur à droite (LigneCarte). */
export const ligneValeur = (titre, valeur, couleur = "") => ligne({ titre: esc(titre), valeur, couleurValeur: couleur });

export const attrsDonnees = (d) => Object.entries(d).map(([k, v]) => `data-${k}="${esc(typeof v === "string" ? v : JSON.stringify(v))}"`).join(" ");

// MARK: Boutons

/** Bouton : `genre` primaire (accent), teinte (catégorie), secondaire (verre), discret, danger. */
export function bouton(texte, action, { genre = "primaire", teinte = "", donnees = {}, desactive = false, page = "", p = null, style = "" } = {}) {
  const classe = genre === "primaire" ? "bouton" : `bouton ${genre}`;
  // `style` : hérité d'anciennes pages ; une page nouvelle passe une classe de sa zone, jamais un style.
  const st = teinte || style ? ` style="${teinte ? `--c:${teinte};` : ""}${style}"` : "";
  if (page) return `<button class="${classe}"${st} data-action="ouvrir" data-page="${esc(page)}" ${p ? `data-p='${esc(JSON.stringify(p))}'` : ""} ${desactive ? "disabled" : ""}>${texte}</button>`;
  return `<button class="${classe}"${st} data-action="${esc(action)}" ${attrsDonnees(donnees)} ${desactive ? "disabled" : ""}>${texte}</button>`;
}

export const petit = (texte, action, { plein = false, teinte = "", donnees = {}, desactive = false } = {}) =>
  `<button class="petit ${plein ? "plein" : ""} ${teinte ? "teinte" : ""}"${teinte ? ` style="--c:${teinte}"` : ""} data-action="${esc(action)}" ${attrsDonnees(donnees)} ${desactive ? "disabled" : ""}>${texte}</button>`;

/**
 * Segment : 2 à 5 choix exclusifs ; chaque bouton déclenche `action` avec data-valeur.
 * Il défile quand il déborde (un libellé n'est jamais coupé) ; `defilant` (d'office au-delà de quatre
 * choix) ajoute le fondu des bords, et app.js garde le choix visible.
 */
export const segment = (options, choisie, action, { defilant = options.length > 4 } = {}) => `
  <div class="segment ${defilant ? "defilant" : ""}" role="group">${options.map(([v, t]) =>
    `<button data-action="${esc(action)}" data-valeur="${esc(v)}" aria-pressed="${v === choisie}">${esc(t)}</button>`).join("")}</div>`;

/** Une rangée de pilules de filtre qui défile (`choisie` enfoncée). */
export const pilules = (options, choisie, action) => `
  <div class="filtres" role="group">${options.map(([v, t]) =>
    `<button class="filtre" data-action="${esc(action)}" data-valeur="${esc(v)}" aria-pressed="${v === choisie}">${esc(t)}</button>`).join("")}</div>`;

// MARK: Valeurs

export const rail = (part, teinte = "var(--accent)", hauteur = 8) =>
  `<div class="rail" style="--c:${teinte};--h:${hauteur}px"><i style="--part:${Math.max(0, Math.min(100, Math.round((part ?? 0) * 100)))}%"></i></div>`;

/** D358 : la jauge fine de 4 px (JaugeFine de l'iPhone), le seul système de barre des écrans refaits. */
export const jaugeFine = (part, teinte = "") =>
  `<span class="jauge-fine" style="--part:${Math.max(0, Math.min(1, part ?? 0)).toFixed(3)}${teinte ? `;--c:${teinte}` : ""}"><i></i></span>`;

/** La variation colorée : « +1 250 € » en vert, « −80 € » en orange. */
export const variationColoree = (c) => `<span class="chiffres ${c > 0 ? "gain" : c < 0 ? "perte" : "t2"}">${variation(c)}</span>`;

/** Le chiffre héros : dégradé, chasse fixe, et ses chiffres roulent quand il change (numericText). */
export const heros = (c, taille = 38) => `<div class="heros-chiffre" style="--taille:${taille}px">${chiffreAnime(c)}</div>`;

/**
 * Un chiffre qui roule : chaque chiffre est une colonne 0–9 qui glisse à sa place quand la valeur change
 * (la page est mise à jour par patcher : le nouveau `--n` déclenche la transition CSS).
 * `texte` : un texte déjà formaté (« 12,4 % », « 3 h 20 ») ; sinon `c`, des centimes, en montant.
 * Le texte reste lisible tel quel (textContent, copier-coller, lecteurs d'écran) : seule sa peinture roule.
 */
export function chiffreAnime(c, { texte = null, centimes = false, classe = "" } = {}) {
  const t = texte ?? montant(c, { centimes });
  const n = t.length;
  const morceaux = [...t].map((x, i) => {
    const cle = `r${n - i}`; // compté depuis la droite : les unités restent les unités quand un chiffre s'ajoute
    return /\d/.test(x) ? `<span class="rc" data-cle="${cle}" style="--n:${x}">${x}</span>` : `<span class="rs" data-cle="${cle}">${esc(x)}</span>`;
  }).join("");
  return `<span class="roule ${classe}" aria-label="${esc(t)}">${morceaux}</span>`;
}

/** D403 (RNT-339) : LA courbe du jeu, la même que CourbeLue (iPhone), pour toute série dans le temps : patrimoine,
 *  saison de l'accueil, fiche d'un joueur, cote d'une montre, bilan, cours. Hauteurs entre 0 et 1 (déjà sur l'échelle
 *  commune), abscisses entre 0 et 1 facultatives ; une seconde ligne en pointillés (`fantome`, null aux trous : la
 *  saison passée, l'autre joueur) ; `lecture` ({ id, lire(k), lacher() }) la rend lisible au doigt ou à la souris,
 *  avec le même trait et le même point partout. */
export function courbe(h, x = null, { hauteur = 70, couleur = "var(--courbe)", marge = 5, aire = true, fantome = null, fantomeX = null,
  couleurFantome = "var(--texte2)", pointFinal = false, classe = "", classeFantome = "", lecture = null, autres = [] } = {}) {
  if (!h?.length) return "";
  const n = h.length;
  const xs = h.map((_, i) => x?.[i] ?? (n > 1 ? i / (n - 1) : 0.5));
  const y = (v) => hauteur - marge - v * (hauteur - 2 * marge);
  const pts = h.map((v, i) => `${(xs[i] * 300).toFixed(1)},${y(v).toFixed(1)}`);
  // Un identifiant stable pour une même forme : patcher ne réécrit pas le dégradé à chaque rafraîchissement.
  const id = `g${hauteur}-${pts.length}-${Math.round(h.reduce((s, v) => s + v, 0) * 1000)}`;
  const fn = fantome?.length ?? 0;
  const fpts = (fantome ?? []).map((v, i) => (v == null ? null : `${(((fantomeX?.[i] ?? (fn > 1 ? i / (fn - 1) : 0.5))) * 300).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean);
  const dernier = pts[n - 1].split(",");
  const svg = `<svg class="courbe-svg" viewBox="0 0 300 ${hauteur}" preserveAspectRatio="none" style="--h:${hauteur}px" aria-hidden="true">
    ${aire ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${couleur === "var(--courbe)" ? "#e4e4ea" : couleur}" stop-opacity=".22"/><stop offset="1" stop-color="${couleur === "var(--courbe)" ? "#e4e4ea" : couleur}" stop-opacity="0"/></linearGradient></defs>
    <polygon points="${(xs[0] * 300).toFixed(1)},${hauteur} ${pts.join(" ")} ${(xs[n - 1] * 300).toFixed(1)},${hauteur}" fill="url(#${id})"/>` : ""}
    ${fpts.length >= 2 ? `<polyline class="courbe-fantome ${classeFantome}" points="${fpts.join(" ")}" fill="none" stroke="${couleurFantome}" stroke-width="1.4" stroke-dasharray="4 4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` : ""}
    <polyline class="${classe}" points="${pts.join(" ")}" fill="none" stroke="${couleur}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    ${autres.filter((s) => s.h?.length > 1).map((s) => `<polyline points="${s.h.map((v, i) => `${((s.x?.[i] ?? i / (s.h.length - 1)) * 300).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}" fill="none" stroke="${s.couleur}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`).join("")}
  </svg>`;
  const fin = pointFinal ? `<i class="courbe-fin" style="--x:${(xs[n - 1] * 100).toFixed(2)}%;--y:${(+dernier[1]).toFixed(1)}px;--c:${couleur}"></i>` : "";
  if (!lecture && !pointFinal) return svg;
  if (lecture) courbesLues.set(lecture.id, { xs, h, hauteur, marge, ...lecture });
  return `<div class="courbe-lue" ${lecture ? `data-courbe="${lecture.id}"` : ""} style="--h:${hauteur}px">${svg}${fin}
    ${lecture ? '<i class="courbe-trait" hidden></i><i class="courbe-point" hidden></i>' : ""}</div>`;
}

/** Les courbes lisibles à l'écran (id → abscisses, hauteurs, lire, lâcher) et celle que le doigt lit. */
const courbesLues = new Map();
let courbeTenue = null;
function lireCourbeAuDoigt(ev) {
  const el = ev.target?.closest?.("[data-courbe]");
  if (!el) return;
  if (ev.type === "pointermove" && ev.pointerType !== "mouse" && !ev.buttons) return;
  const c = courbesLues.get(el.dataset.courbe);
  if (!c) return;
  const r = el.getBoundingClientRect();
  const px = Math.min(1, Math.max(0, (ev.clientX - r.left) / Math.max(1, r.width)));
  let k = 0;
  c.xs.forEach((a, i) => { if (Math.abs(a - px) < Math.abs(c.xs[k] - px)) k = i; });
  const trait = el.querySelector(".courbe-trait"), point = el.querySelector(".courbe-point");
  if (trait) { trait.hidden = false; trait.style.setProperty("--x", `${(c.xs[k] * 100).toFixed(2)}%`); }
  if (point) {
    point.hidden = false;
    point.style.setProperty("--x", `${(c.xs[k] * 100).toFixed(2)}%`);
    point.style.setProperty("--y", `${(c.hauteur - c.marge - c.h[k] * (c.hauteur - 2 * c.marge)).toFixed(1)}px`);
  }
  if (courbeTenue?.k !== k || courbeTenue?.el !== el) { courbeTenue = { el, k }; c.lire?.(k); }
}
function lacherCourbe() {
  if (!courbeTenue) return;
  const { el } = courbeTenue;
  courbeTenue = null;
  el.querySelectorAll(".courbe-trait, .courbe-point").forEach((i) => { i.hidden = true; });
  courbesLues.get(el.dataset.courbe)?.lacher?.();
}
if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", lireCourbeAuDoigt);
  document.addEventListener("pointermove", lireCourbeAuDoigt);
  document.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") lacherCourbe(); });
  document.addEventListener("pointercancel", lacherCourbe);
  document.addEventListener("pointerout", (e) => {
    if (courbeTenue && e.pointerType === "mouse" && !courbeTenue.el.contains(e.relatedTarget)) lacherCourbe();
  });
}

/** Des valeurs brutes et une seconde série (null aux trous) sur une même échelle, entre 0 et 1. */
export function echelleCourbe(valeurs, autre = []) {
  const tout = [...valeurs, ...autre.filter((v) => v != null)];
  const min = Math.min(...tout), max = Math.max(...tout);
  const f = (v) => (max > min ? (v - min) / (max - min) : 0.5);
  return { h: valeurs.map(f), autre: autre.map((v) => (v == null ? null : f(v))) };
}

/** Une courbe à partir de valeurs brutes (cours, patrimoine) : normalise entre min et max. */
export function courbeValeurs(valeurs, options = {}) {
  if (!valeurs?.length) return "";
  const min = Math.min(...valeurs), max = Math.max(...valeurs);
  return courbe(valeurs.map((v) => (max > min ? (v - min) / (max - min) : 0.5)), null, options);
}

export const vide = (texte) => `<div class="vide">${texte}</div>`;
export const bandeau = (texte, teinte = "var(--alerte)") => `<div class="bandeau" style="--c:${teinte}"><div>${texte}</div></div>`;

/** Champ montant en euros (la valeur se lit avec lireEuros). */
/** Un champ de montant. `valeur` : des euros (« 50 », « 12,5 »). D437 : le joueur tape dans sa devise d'affichage
 *  (la valeur proposée y est convertie) ; `brut` : en euros, tel quel (la console d'administration). */
export const champEuros = (id, { valeur = "", placeholder = null, etiquette = "", brut = false } = {}) => {
  const d = brut ? { symbole: "€", taux: 1 } : deviseAffichage();
  let v = String(valeur ?? "");
  const x = Number(v.replace(/\s|€/g, "").replace(",", "."));
  if (v && Number.isFinite(x) && d.taux !== 1) v = String(Math.round(x * d.taux));
  return `
  ${etiquette ? `<label class="etiquette" for="${id}">${esc(etiquette)}</label>` : ""}
  <input class="champ" id="${id}" inputmode="decimal" autocomplete="off" placeholder="${esc(placeholder ?? `0 ${d.symbole}`)}" value="${esc(v)}"${brut ? ' data-brut="1"' : ""}>`;
};

/** « 1 250,50 » → 125050 centimes d'euro ; null si illisible. D437 : la saisie est dans la devise d'affichage
 *  (sauf un champ `brut`), ramenée en euros. */
export function lireEuros(id) {
  const el = document.getElementById(id);
  const t = (el?.value ?? "").replace(/\s|€/g, "").replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!t) return null;
  const x = Number(t);
  if (!Number.isFinite(x)) return null;
  const c = Math.round(x * 100);
  return el?.dataset?.brut ? c : depuisAffichage(c);
}

// MARK: Contrôles

/** Interrupteur (Toggle) : une ligne de carte qui bascule ; `action` reçoit les data-* de `donnees`. */
export const interrupteur = ({ titre, detail = "", actif = false, action, donnees = {}, desactive = false }) => `
  <button class="interrupteur" role="switch" aria-checked="${!!actif}" data-action="${esc(action)}" ${attrsDonnees(donnees)} ${desactive ? "disabled" : ""}>
    <span class="ligne-corps"><div class="titre">${esc(titre)}</div>${detail ? `<div class="detail">${esc(detail)}</div>` : ""}</span>
    <span class="bascule" aria-hidden="true"></span>
  </button>`;

/**
 * Champ fichier en français (jamais « Choose File ») : une zone à toucher ; le nom du fichier choisi
 * s'affiche (app.js écoute le changement). Le fichier se lit par `document.getElementById(id).files[0]` ;
 * `saisie` : l'action de la page appelée au choix (data-saisie, comme un champ de saisie).
 */
export const champFichier = (id, { accept = "image/*", etiquette = "Joindre une capture", aide = "PNG ou JPEG", bouton: texteBouton = "Choisir", saisie = "" } = {}) => `
  <label class="champ-fichier" data-aide="${esc(aide)}">
    <span class="cf-icone" aria-hidden="true">${icones.image}</span>
    <span class="cf-texte"><span class="cf-nom" data-vide="${esc(etiquette)}">${esc(etiquette)}</span><span class="cf-aide">${esc(aide)}</span></span>
    <span class="petit cf-bouton" aria-hidden="true">${esc(texteBouton)}</span>
    <input type="file" id="${esc(id)}" accept="${esc(accept)}" aria-label="${esc(etiquette)}"${saisie ? ` data-saisie="${esc(saisie)}"` : ""}>
  </label>`;

/** Le choix d'un champ fichier : son nom à la place de l'invitation (appelé par app.js à chaque changement). */
export function majChampFichier(input) {
  const zone = input.closest(".champ-fichier");
  if (!zone) return;
  const f = input.files?.[0];
  const nom = zone.querySelector(".cf-nom"), aide = zone.querySelector(".cf-aide");
  zone.classList.toggle("rempli", !!f);
  nom.textContent = f ? f.name : nom.dataset.vide;
  aide.textContent = f ? `${Math.max(1, Math.round(f.size / 1024))} Kio · toucher pour changer` : zone.dataset.aide;
}

/**
 * Une photo chargée à la demande, avec son repli (une illustration, une silhouette, un pictogramme)
 * tant qu'elle n'est pas là, ou si elle manque. `ratio` : « 4 / 3 », « 16 / 9 », « 1 ».
 */
export const photo = ({ src, alt = "", ratio = "4 / 3", repli = icones.image, classe = "", ajuste = "" }) => `
  <span class="photo ${classe}" style="--ratio:${ratio}${ajuste ? `;--ajuste:${ajuste}` : ""}">
    <span class="photo-repli" aria-hidden="true">${repli}</span>
    ${src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" data-photo>` : ""}
  </span>`;

/**
 * Le « ? » d'un écran (BoutonAide) : ouvre les fiches de ce sujet (aideContextuelle, posée par js/aide.js,
 * lot C), sinon le guide. Un seul pour tout le web (le dessin du lot C) ; `grand` : la taille des ronds voisins.
 */
const POINT_AIDE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 17v.3"/></svg>';
export const boutonAide = (sujet, { libelle = "", grand = false } = {}) =>
  `<button class="rond${grand ? " grand" : ""} aide-bouton" data-action="aide" data-sujet="${esc(sujet)}" aria-label="${esc(libelle || `Comment ça marche : ${aideContextuelle.titre?.(sujet) ?? "aide"}`)}" title="Comment ça marche">${POINT_AIDE}</button>`;

/**
 * Qui ouvre l'aide d'un sujet. Le lot C y pose sa fonction (les fiches de Tutoriels) :
 *   aideContextuelle.ouvrir = (ctx, sujet) => ctx.feuille({ … }) ; aideContextuelle.titre = (sujet) => « l'accueil »
 * Sans elle, le « ? » ouvre le guide.
 */
export const aideContextuelle = { ouvrir: null, titre: null };

// MARK: Grand écran

/** Deux colonnes au palier moyen et large (une seule sur téléphone) : pour un `renduLarge`. */
export const colonnes = (gauche, droite, { classe = "" } = {}) =>
  `<div class="colonnes ${classe}"><div class="colonne-pile">${gauche}</div><div class="colonne-pile">${droite}</div></div>`;

// MARK: Confirmation (FeuilleConfirmation)

/**
 * Une question, deux boutons, à la place de `confirm()` ; rend une promesse (vrai si confirmé).
 *   if (!(await confirmer({ titre: "Arrêter la session ?", oui: "Arrêter", danger: true }))) return;
 */
export function confirmer({ titre, texte = "", oui = "Confirmer", non = "Annuler", danger = false, icone = danger ? "alerte" : "question" }) {
  return new Promise((rendre) => {
    const d = document.createElement("dialog");
    d.className = `confirmation ${danger ? "danger" : ""}`;
    d.setAttribute("aria-labelledby", "confirmation-titre");
    d.innerHTML = `<div class="cf-symbole" aria-hidden="true">${icones[icone] ?? icone}</div>
      <h2 id="confirmation-titre">${esc(titre)}</h2>${texte ? `<p>${esc(texte)}</p>` : ""}
      <div class="cf-boutons"><button class="bouton" data-reponse="oui">${esc(oui)}</button><button class="bouton discret" data-reponse="non">${esc(non)}</button></div>`;
    let reponse = false;
    d.addEventListener("click", (e) => {
      e.stopPropagation(); // la feuille de confirmation n'est pas une page : aucune action de page
      const b = e.target.closest("[data-reponse]");
      if (b) { reponse = b.dataset.reponse === "oui"; d.close(); } else if (e.target === d) d.close();
    });
    d.addEventListener("close", () => { d.remove(); rendre(reponse); });
    document.body.append(d);
    d.showModal();
    d.querySelector("[data-reponse=oui]").focus({ preventScroll: true });
  });
}

/** Les catégories d'action de l'iPhone, par nom. */
export const teintes = { argent: "var(--argent)", equipe: "var(--equipe)", vente: "var(--vente)", controles: "var(--controles)", image: "var(--image)", danger: "var(--c-danger)", grandir: "var(--grandir)" };

/**
 * RNT-212 : un nom (ou un avatar) de joueur qui ouvre son profil, où qu'il soit : le fil, le journal, la bourse du
 * monde, Entre joueurs… Sans identifiant (un coup subi : jamais son auteur), le texte reste un texte.
 */
export const lienJoueur = (id, html, { pseudo = "", classe = "" } = {}) => (id
  ? `<button type="button" class="lien-joueur ${classe}" data-action="profilJoueur" data-joueur="${esc(id)}"${pseudo ? ` data-pseudo="${esc(pseudo)}"` : ""} aria-label="${esc(pseudo ? `Profil de ${pseudo}` : "Son profil")}">${html}</button>`
  : html);

// MARK: D345 — les composants animés (Rente/Design/Mouvements.swift ; css/composants.css § D345 ; js/mouvements.js)

const S = (d, vb = "0 0 24 24") => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const DESSINS_IA = {
  chargement: S('<circle cx="12" cy="12" r="8.5" opacity=".14"/><path class="arc" d="M12 3.5a8.5 8.5 0 0 1 8.1 5.9"/>'),
  points: S('<circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none"/>'),
  sablier: S('<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4.5 8 4.5 8 8.5s-8 4-8 8.5M16 3.5c0 4.5-8 4.5-8 8.5s8 4 8 8.5"/><path d="M10 18.5h4" opacity=".7"/>'),
  horsLigne: S('<path class="o3" d="M2.5 9a14 14 0 0 1 19 0"/><path class="o2" d="M5.5 12.2a9.5 9.5 0 0 1 13 0"/><path class="o1" d="M8.6 15.3a5 5 0 0 1 6.8 0"/><circle cx="12" cy="18.6" r="1.1" fill="currentColor" stroke="none"/>'),
  reconnexion: S('<circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><path class="o1" d="M9 9a4.2 4.2 0 0 0 0 6M15 9a4.2 4.2 0 0 1 0 6"/><path class="o2" d="M6.4 6.4a8 8 0 0 0 0 11.2M17.6 6.4a8 8 0 0 1 0 11.2"/><path class="o3" d="M3.8 3.8a11.6 11.6 0 0 0 0 16.4M20.2 3.8a11.6 11.6 0 0 1 0 16.4"/>'),
  // D353 : les autres rangées de la vidéo 1.
  fondu: S('<circle cx="12" cy="12" r="8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="8" fill="currentColor" stroke="none"/>'),
  balle: S('<ellipse class="om" cx="12" cy="20" rx="3.4" ry="0.9" fill="currentColor" stroke="none"/><circle class="bl" cx="12" cy="15.5" r="2.6" fill="currentColor" stroke="none"/>'),
  horloge: S('<circle cx="12" cy="12" r="8.5"/><path class="ah" d="M12 12V8"/><path class="ai" d="M12 12h4.2"/><circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>'),
  pendule: S('<path d="M8.5 3h7"/><g class="pd"><path d="M12 3v12.5"/><circle cx="12" cy="18" r="2.4"/></g>'),
  coucou: S('<path d="M5 10 12 4l7 6v10H5z"/><circle cx="12" cy="11" r="2.2"/><path class="ois" d="M14.4 11h4.2l-1.6 1.4"/><g class="pd"><path d="M12 15v4"/><circle cx="12" cy="20.3" r="0.9" fill="currentColor" stroke="none"/></g>'),
};
const GENRE_IA = { chargement: "ia-tourne", points: "ia-points", sablier: "ia-sablier", horsLigne: "ia-horsligne", reconnexion: "ia-onde",
  fondu: "ia-fondu", balle: "ia-balle", horloge: "ia-horloge", pendule: "ia-pendule", coucou: "ia-coucou" };

/**
 * Une icône animée en trait fin (vidéo 1) : `chargement` (à la place des roues grises), `points`, `fondu`, `balle`,
 * `horloge`, `pendule`, `coucou` (D353), `sablier`
 * (le temps qui passe), `horsLigne` (les ondes s'éteignent), `reconnexion` (elles reviennent). Jamais pour une action.
 */
export const iconeAnimee = (genre = "chargement", { taille = 22, teinte = "", libelle = "" } = {}) =>
  `<span class="ia ${GENRE_IA[genre] ?? "ia-tourne"}" style="--ia:${taille}px${teinte ? `;--c:${teinte}` : ""}"${libelle ? ` role="img" aria-label="${esc(libelle)}"` : ' aria-hidden="true"'}>${DESSINS_IA[genre] ?? DESSINS_IA.chargement}</span>`;

const CHEVRON_BAS = S('<path d="m6 9 6 6 6-6"/>');
const COCHE = S('<path d="m5 12.5 4.5 4.5L19 7.5"/>');
const TRI = S('<path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5"/>');
/** Un identifiant stable d'un dessin à l'autre (patcher reconnaît les éléments par leur id : un menu ouvert le reste). */
const idStable = (prefixe, ...parts) => `${prefixe}-${parts.join("-").normalize("NFD").replace(/[^A-Za-z0-9-]+/g, "").toLowerCase()}`;

/**
 * Un menu déroulant « Anchor Pop » (vidéo 3) : il jaillit du bord du bouton et y rentre au choix.
 * Chaque choix déclenche `action` avec `value` = la valeur (comme un <select> : `el.value`) et `donnees` en data-*.
 *   menuAncre({ libelle: "Trier", options: [["nom", "Nom"], ["prix", "Prix"]], choisie: "nom", action: "trier" })
 */
export function menuAncre({ libelle, options, choisie, action, donnees = {}, etiquette = "", icone = TRI, aligner = "droite" }) {
  const id = idStable("menu", action, libelle, ...Object.values(donnees));
  const nom = options.find(([v]) => String(v) === String(choisie))?.[1] ?? "";
  return `<span class="menu-ancre">
    <button type="button" class="menu-bouton" popovertarget="${id}" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(etiquette || `${libelle} : ${nom}`)}" data-aligner="${aligner}">
      ${icone}<span class="mb-texte">${esc(libelle)}${nom ? ` : ${esc(nom)}` : ""}</span><span class="mb-chevron">${CHEVRON_BAS}</span></button>
    <div class="menu-liste" id="${id}" popover role="menu" aria-label="${esc(libelle)}">${options.map(([v, t]) =>
      `<button type="button" class="menu-choix" role="menuitemradio" aria-checked="${String(v) === String(choisie)}" data-action="${esc(action)}" value="${esc(v)}" ${attrsDonnees(donnees)}><span class="mc-coche">${COCHE}</span>${esc(t)}</button>`).join("")}</div>
  </span>`;
}

/**
 * Un chiffre qui glisse (vidéo 2, « Side Slide ») : quand la page le redessine avec une autre valeur, le nouveau
 * arrive du côté qui l'a fait changer (de la droite s'il monte), l'ancien part de l'autre (js/mouvements.js).
 */
export const valeurGlissee = (n, texte = String(n), { largeur = 0, classe = "" } = {}) =>
  `<span class="vg ${classe}" data-vg="${Number(n)}|${esc(texte)}"${largeur ? ` style="--vgw:${largeur}px"` : ""}><span>${esc(texte)}</span></span>`;

/**
 * − valeur + (CompteurGlisse) : `action` reçoit data-pas = -1 ou 1 (et `donnees`) ; la pilule se pousse d'un
 * pixel vers le côté touché et le chiffre glisse. `min`/`max` grisent le bouton au bout.
 */
export function compteur({ valeur, texte = String(valeur), action, donnees = {}, min = -Infinity, max = Infinity, moins = "Un de moins", plus = "Un de plus", largeur = 0 }) {
  return `<span class="compteur" role="group" aria-label="${esc(texte)}">
    <button type="button" data-action="${esc(action)}" data-pas="-1" ${attrsDonnees(donnees)} aria-label="${esc(moins)}" ${valeur <= min ? "disabled" : ""}>${icones.moins ?? S('<path d="M5 12h14"/>')}</button>
    ${valeurGlissee(valeur, texte, { largeur })}
    <button type="button" data-action="${esc(action)}" data-pas="1" ${attrsDonnees(donnees)} aria-label="${esc(plus)}" ${valeur >= max ? "disabled" : ""}>${icones.plus}</button>
  </span>`;
}

/** Les étapes d'un parcours (vidéo 6, « Numbered Steps ») : faites, elles deviennent des coches ; la courante a son anneau. */
export function etapesNumerotees(titres, courante) {
  const n = titres.length, i0 = Math.min(Math.max(0, courante), n - 1);
  return `<div class="etapes-n" role="img" aria-label="Étape ${i0 + 1} sur ${n}, ${esc(titres[i0])}">
    <ol>${titres.map((_, i) => `<li class="${i < i0 ? "faite" : i === i0 ? "ici" : ""}"><span class="en-pastille"><span>${i + 1}</span>${COCHE}</span>${i < n - 1 ? '<span class="en-lien"></span>' : ""}</li>`).join("")}</ol>
    <div class="aide">Étape ${i0 + 1} sur ${n} · ${esc(titres[i0])}</div>
  </div>`;
}

const ENGINS = {
  camion: S('<path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7"/><circle cx="6.5" cy="17" r="1.7"/><circle cx="17" cy="17" r="1.7"/>'),
  cargo: S('<path d="M3 14.5h18l-2.2 4.5H5.2zM6 14.5V9h8v5.5M9 9V6h3v3"/>'),
  avion: S('<path d="M21 15.5 13.5 12V6a1.5 1.5 0 0 0-3 0v6L3 15.5V17l7.5-2v3.5L8.5 20v1l3.5-1 3.5 1v-1l-2-1.5V15l7.5 2z"/>'),
};

/**
 * Parti → En route → Arrivé (vidéo 6, « Order Tracking ») : le véhicule avance sur la ligne avec le temps.
 * `depart`, `arrivee` : des dates (ou leurs millisecondes) ; `mode` : camion, cargo, avion.
 */
export function friseTrajet({ de = "", vers, mode = "camion", depart = null, arrivee, maintenant = Date.now(), arriveeTexte = "" }) {
  const t0 = depart ? new Date(depart).getTime() : null, t1 = new Date(arrivee).getTime();
  const part = t0 != null && t1 > t0 ? Math.min(1, Math.max(0, (maintenant - t0) / (t1 - t0))) : maintenant >= t1 ? 1 : 0.5;
  const pct = Math.round(part * 100);
  return `<div class="frise" style="--fr:${part.toFixed(3)}" role="img" aria-label="${esc(`De ${de || "ici"} à ${vers}${arriveeTexte ? `, arrivée ${arriveeTexte}` : ""}`)}">
    <div class="fr-piste"><div class="fr-rail"><i></i></div>${[0, 50, 100].map((x) => `<span class="fr-point ${pct >= x ? "passe" : ""}" style="--x:${x}"></span>`).join("")}
      <span class="fr-engin">${ENGINS[{ bateau: "cargo", pilote: "avion" }[mode] ?? mode] ?? ENGINS.camion}</span></div>
    <div class="fr-etiquettes"><div><b>Parti</b><span>${esc(de)}</span></div><div><b>En route</b><span>${pct < 100 ? `${pct} %` : ""}</span></div><div><b>Arrivé</b><span>${esc(vers)}${arriveeTexte ? `, ${esc(arriveeTexte)}` : ""}</span></div></div>
  </div>`;
}

/** Un anneau d'arcs, un par palier (vidéo 6, « Ring Steps ») : passés pleins, le courant selon `part`, le numéro qui roule au centre. */
export function anneauEtapes({ total, atteint, part = 0, taille = 40, libelle = "" }) {
  const n = Math.max(1, total), r = 16, tour = 2 * Math.PI * r, ecart = n > 1 ? 5.2 : 0, arc = tour / n - ecart;
  // D347 (Arthur) : à huit étapes et plus, les arcs font un pointillé : l'anneau devient continu (le chemin fait).
  const continu = n >= 8;
  const fait = continu ? Math.min(1, (atteint + (atteint >= n - 1 ? 1 : Math.min(1, Math.max(0, part)))) / n) : 0;
  const cercles = continu
    ? `<circle class="ae-creux" cx="20" cy="20" r="${r}"/>${fait > 0 ? `<circle class="ae-plein" cx="20" cy="20" r="${r}" stroke-dasharray="${(tour * fait).toFixed(2)} ${(tour * (1 - fait) + 0.01).toFixed(2)}"/>` : ""}`
    : Array.from({ length: n }, (_, i) => {
    const rempli = i < atteint ? 1 : i === atteint ? (atteint === n - 1 ? 1 : Math.min(1, Math.max(0, part))) : 0;
    const dec = -(i * tour) / n - ecart / 2;
    return `<circle class="ae-creux" cx="20" cy="20" r="${r}" stroke-dasharray="${arc.toFixed(2)} ${(tour - arc).toFixed(2)}" stroke-dashoffset="${dec.toFixed(2)}"/>`
      + (rempli > 0 ? `<circle class="ae-plein" cx="20" cy="20" r="${r}" stroke-dasharray="${(arc * rempli).toFixed(2)} ${(tour - arc * rempli).toFixed(2)}" stroke-dashoffset="${dec.toFixed(2)}"/>` : "");
  }).join("");
  return `<span class="anneau-etapes${continu ? " continu" : ""}" style="--ae:${taille}px" role="img" aria-label="${esc(libelle || `Palier ${atteint + 1} sur ${n}`)}">
    <svg viewBox="0 0 40 40" aria-hidden="true">${cercles}</svg><span class="ae-centre">${chiffreAnime(0, { texte: String(atteint + 1) })}</span></span>`;
}

/**
 * Le « + » qui devient panneau (vidéo 5, « Button to Panel ») : le bouton rond grandit en un panneau dont les choix
 * arrivent en fondu, l'un après l'autre. `options` : [{ titre, detail, icone, teinte, page, p, action, donnees }].
 */
export function boutonPanneau({ libelle, titre = libelle, options, icone = icones.plus }) {
  const id = idStable("panneau", libelle);
  return `<button type="button" class="rond" popovertarget="${id}" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(libelle)}" data-panneau-plus>${icone}</button>
    <div class="panneau-plus" id="${id}" popover role="dialog" aria-label="${esc(titre)}">
      <div class="pp-tete"><span class="libelle">${esc(titre)}</span><button type="button" class="rond" popovertarget="${id}" popovertargetaction="hide" aria-label="Fermer">${icones.fermer}</button></div>
      ${options.map((o, i) => ligne({ titre: esc(o.titre), detail: o.detail ? esc(o.detail) : "", icone: o.icone, teinte: o.teinte, page: o.page, p: o.p, action: o.action, donnees: o.donnees })
        .replace(/^<(button|div) class="ligne"/, `<$1 class="ligne" style="--i:${i}"`)).join("")}
    </div>`;
}
