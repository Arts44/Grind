// ══════════════════════════════════════════════════════════════════════
//  La navigation (Rente/Navigation/BarrePerle.swift), lot A.
//
//  Trois formes selon le palier de largeur (docs/web-design.md) :
//   - compact (< 700 px) : la barre perle, pilule de 366 × 58 encochée sous
//     la perle d'accent (rayon 25 ; écart 5, enfoncement 15, congés 10) ;
//   - moyen (700–1 099 px) : un rail de 76 px à gauche, les cinq perles ;
//   - large (≥ 1 100 px) : la colonne de 232 px, onglets et raccourcis.
//
//  Chacune est dessinée UNE fois (monterBarre) puis mise à jour (majBarre) :
//  la perle glisse d'un onglet à l'autre (0,35 s, courbe Graphite), et
//  l'encoche la suit, image par image.
// ══════════════════════════════════════════════════════════════════════
import { icones } from "./ui.js";

export const ONGLETS = [
  { id: "focus", titre: "Focus" },
  { id: "banque", titre: "Banque" },
  { id: "accueil", titre: "Accueil" },
  { id: "marches", titre: "Marchés" },
  { id: "actifs", titre: "Actifs" },
];

/** Ce que l'accueil ouvre souvent, sous les onglets au grand écran. */
const RACCOURCIS = [["profil", "Profil", "personne"], ["mondes", "Mes mondes", "amis"], ["reglages", "Réglages", "reglages"]];

const R = 25, ECART = 5, ENFONCEMENT = 15, CONGE = 10, H = 58;

/** Les mesures pour une largeur donnée (GeometriePerle). */
export function geometrie(largeur) {
  const f = CONGE, n = ONGLETS.length;
  const cy = ENFONCEMENT - R, rn = R + ECART, c = H / 2;
  const sh = Math.sqrt((f + rn) ** 2 - (cy - f) ** 2);
  const marge = Math.max(0, (c + sh - largeur / (2 * n)) / (1 - 1 / n));
  return {
    largeur, n, cy, rn, c, sh, marge, largeurOnglet: (largeur - 2 * marge) / n,
    tx: sh - (f * sh) / (f + rn), ty: f + (f * (cy - f)) / (f + rn),
    x(position) { return this.marge + this.largeurOnglet * (position + 0.5); },
  };
}

/** Le tracé de la pilule encochée sous la perle en `position` (PiluleEncochee) ; `position` peut être fractionnaire. */
export function trace(largeur, position) {
  const g = geometrie(largeur), f = CONGE, cx = g.x(position);
  const p = (x, y) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  // Arcs SVG : rayon, drapeaux (grand arc, sens). Mêmes points de raccord que la version Swift.
  return [
    `M ${p(g.c, 0)}`,
    `L ${p(cx - g.sh, 0)}`,
    `A ${f} ${f} 0 0 1 ${p(cx - g.tx, g.ty)}`,
    `A ${g.rn} ${g.rn} 0 0 0 ${p(cx + g.tx, g.ty)}`,
    `A ${f} ${f} 0 0 1 ${p(cx + g.sh, 0)}`,
    `L ${p(largeur - g.c, 0)}`,
    `A ${g.c} ${g.c} 0 0 1 ${p(largeur - g.c, H)}`,
    `L ${p(g.c, H)}`,
    `A ${g.c} ${g.c} 0 0 1 ${p(g.c, 0)}`,
    "Z",
  ].join(" ");
}

/** La largeur de la barre pour une fenêtre : 366, ou la fenêtre moins 24 (au moins 200). */
export const largeurBarre = (fenetre) => Math.max(200, Math.min(366, fenetre - 24));

/** La courbe Graphite, cubic-bezier(0.2, 0.9, 0.25, 1) : la part du trajet faite au temps t ∈ [0, 1]. */
export function graphite(t) {
  const x1 = 0.2, y1 = 0.9, x2 = 0.25, y2 = 1;
  const bx = (s) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3;
  const by = (s) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
  let a = 0, b = 1;
  for (let k = 0; k < 24; k++) { const m = (a + b) / 2; if (bx(m) < t) a = m; else b = m; }
  return by((a + b) / 2);
}

const moinsDeMouvement = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// MARK: Le dessin (une fois)

function htmlPerle(largeur, i) {
  const g = geometrie(largeur);
  return `
    <svg class="perle-pilule" viewBox="0 0 ${largeur} ${H}" aria-hidden="true">
      <defs>
        <linearGradient id="barre-fond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1d22"/><stop offset="1" stop-color="#131316"/></linearGradient>
        <radialGradient id="barre-lueur" cx="${g.x(i)}" cy="0" r="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="var(--accent)" stop-opacity=".30"/><stop offset=".45" stop-color="var(--accent)" stop-opacity=".09"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="barre-filet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".55" stop-color="#fff" stop-opacity=".04"/></linearGradient>
      </defs>
      <path class="p-fond" d="${trace(largeur, i)}" fill="url(#barre-fond)"/>
      <path class="p-lueur" d="${trace(largeur, i)}" fill="url(#barre-lueur)"/>
      <path class="p-filet" d="${trace(largeur, i)}" fill="none" stroke="url(#barre-filet)" stroke-width="1.25"/>
    </svg>
    <div class="onglets" style="--marge:${g.marge.toFixed(2)}px">
      ${ONGLETS.map((o) => `<button data-action="onglet" data-onglet="${o.id}" aria-label="${o.titre}">${icones[o.id]}<span class="nom">${o.titre}</span></button>`).join("")}
    </div>
    <div class="perle-bouton" aria-hidden="true">${ONGLETS.map((o) => icones[o.id].replace("<svg ", `<svg data-o="${o.id}" `)).join("")}</div>`;
}

const htmlRail = () => `
  <div class="logo-rail" aria-hidden="true">G<span>.</span></div>
  <div class="rail-onglets"><i class="glisseur" aria-hidden="true"></i>${ONGLETS.map((o) => `<button data-action="onglet" data-onglet="${o.id}" aria-label="${o.titre}" title="${o.titre}">${icones[o.id]}</button>`).join("")}</div>
  <div class="rail-raccourcis">${RACCOURCIS.map(([id, t, ic]) => `<button data-action="ouvrir" data-page="${id}" aria-label="${t}" title="${t}">${icones[ic]}</button>`).join("")}</div>`;

const htmlColonne = () => `
  <div class="logo-colonne">Grind<span>.</span></div>
  <div class="colonne-onglets"><i class="glisseur" aria-hidden="true"></i>${ONGLETS.map((o, k) => `<button data-action="onglet" data-onglet="${o.id}">
    <span class="colonne-perle" aria-hidden="true">${icones[o.id]}</span><span>${o.titre}</span><kbd class="touche" aria-hidden="true">${k + 1}</kbd></button>`).join("")}</div>
  <div class="colonne-raccourcis">${RACCOURCIS.map(([id, t, ic]) => `<button data-action="ouvrir" data-page="${id}">
    <span class="colonne-icone" aria-hidden="true">${icones[ic]}</span><span>${t}</span></button>`).join("")}</div>`;

/**
 * Pose la navigation du palier dans `nav` (vide ou d'un autre palier). Ne redessine rien si elle y est déjà
 * pour la même largeur : appeler majBarre ensuite.
 */
export function monterBarre(nav, palier, fenetre = window.innerWidth) {
  const forme = palier === "compact" ? "perle" : palier === "moyen" ? "rail" : "colonne";
  const largeur = forme === "perle" ? largeurBarre(fenetre) : 0;
  if (nav.dataset.forme === forme && Number(nav.dataset.largeur) === largeur) return false;
  const i = Math.max(0, ONGLETS.findIndex((o) => o.id === nav.dataset.onglet));
  nav.className = forme === "rail" ? "rail-lateral" : forme; // « .rail » est déjà la jauge de progression
  nav.dataset.forme = forme;
  nav.dataset.largeur = String(largeur);
  nav.style.setProperty("--l-barre", `${largeur}px`);
  nav.innerHTML = forme === "perle" ? htmlPerle(largeur, i) : forme === "rail" ? htmlRail() : htmlColonne();
  nav.dataset.position = String(i);
  delete nav.dataset.onglet; // majBarre repose tout, sans animation
  return true;
}

/** Met la navigation sur `onglet` (et marque le raccourci de la page `page`) ; la perle glisse si elle change. */
export function majBarre(nav, { onglet, page = "" }) {
  const avant = nav.dataset.onglet;
  const i = Math.max(0, ONGLETS.findIndex((o) => o.id === onglet));
  const anime = !!avant && avant !== onglet && !moinsDeMouvement();
  nav.dataset.onglet = onglet;
  for (const b of nav.querySelectorAll("[data-onglet]")) {
    if (b.dataset.onglet === onglet) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  }
  for (const b of nav.querySelectorAll("[data-page]")) {
    if (b.dataset.page === page) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  }
  if (nav.dataset.forme === "perle") majPerle(nav, i, anime);
  else {
    const g = nav.querySelector(".glisseur");
    const b = nav.querySelector(`[data-onglet="${onglet}"]`);
    if (!g || !b) return;
    const cible = nav.dataset.forme === "colonne" ? b.querySelector(".colonne-perle") ?? b : b;
    const y = cible.getBoundingClientRect().top - g.parentElement.getBoundingClientRect().top;
    if (!anime) { g.style.transition = "none"; g.getBoundingClientRect(); }
    g.style.setProperty("--y", `${y.toFixed(1)}px`);
    if (!anime) requestAnimationFrame(() => { g.style.transition = ""; });
  }
}

function majPerle(nav, i, anime) {
  const largeur = Number(nav.dataset.largeur);
  const g = geometrie(largeur);
  const perle = nav.querySelector(".perle-bouton");
  for (const s of perle.querySelectorAll("svg")) s.classList.toggle("actif", s.dataset.o === ONGLETS[i].id);
  if (!anime) perle.style.transition = "none";
  perle.style.setProperty("--x", `${(g.x(i) - R).toFixed(2)}px`);
  if (!anime) { perle.getBoundingClientRect(); perle.style.transition = ""; }
  // L'encoche suit la perle : le tracé est recalculé à chaque image, de l'ancienne position à la nouvelle.
  const chemins = nav.querySelectorAll("svg.perle-pilule path");
  const lueur = nav.querySelector("#barre-lueur");
  const de = Number(nav.dataset.position ?? i);
  nav.dataset.position = String(i);
  cancelAnimationFrame(Number(nav.dataset.image ?? 0));
  const poser = (pos) => {
    const d = trace(largeur, pos);
    for (const c of chemins) c.setAttribute("d", d);
    lueur?.setAttribute("cx", g.x(pos).toFixed(2));
  };
  if (!anime || de === i) return poser(i);
  const debut = performance.now(), duree = 350;
  const image = (t) => {
    const k = Math.min(1, (t - debut) / duree);
    poser(de + (i - de) * graphite(k));
    if (k < 1) nav.dataset.image = String(requestAnimationFrame(image));
  };
  nav.dataset.image = String(requestAnimationFrame(image));
}
