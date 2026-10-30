// ══════════════════════════════════════════════════════════════════════
//  Les cosmétiques de fin de saison (RNT-231, D230), vus du web :
//  ce qu'on a équipé (gardé dans ce navigateur, comme le titre et le
//  cadre), le dessin de chaque pièce (le même que l'iPhone :
//  Rente/Design/Cosmetiques.swift), et ce qui s'applique à toute l'app
//  (le thème, les sons).
//
//  Le dessin d'une pièce ne dépend que de sa sorte, de ses couleurs et de
//  son motif (Balance.json, saisons.cosmetiques) : du SVG et du CSS, sans
//  image. Les styles sont dans css/pages/cosmetiques.css, posés dès que
//  ce module est chargé.
// ══════════════════════════════════════════════════════════════════════
import { esc } from "./format.js";
import { poserStyles } from "./pages/index.js";

const CLE = "grind.cosmetiques";
const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };

poserStyles(["cosmetiques"]);

// MARK: L'équipement (sorte → pièce)

export function equipement() {
  try { const o = JSON.parse(lire(CLE) ?? "{}"); return o && typeof o === "object" ? o : {}; } catch { return {}; }
}

/** Équipe une pièce (`id` vide : celle de base) ; le thème et les sons suivent tout de suite. */
export function equiper(sorte, id) {
  const e = equipement();
  if (id) e[sorte] = id; else delete e[sorte];
  ecrire(CLE, Object.keys(e).length ? JSON.stringify(e) : null);
  if (sorte === "theme") appliquerTheme();
  return e;
}

// MARK: Le catalogue (gardé après la première lecture)

let catalogue = null;
/** Les règles des cosmétiques (Balance.json), lues une fois. */
export async function chargerCatalogue(ctx) {
  if (catalogue) return catalogue;
  const s = await ctx.balance("saisons").catch(() => null);
  catalogue = s?.cosmetiques ?? null;
  if (catalogue) appliquerTheme();
  return catalogue;
}
export const piece = (id) => catalogue?.pieces?.find((p) => p.id === id) ?? null;

/** Les pièces d'un joueur, par sorte, à partir de son profil publié (`cosmetiques`). */
export const piecesDe = (c) => Object.fromEntries(Object.entries(c ?? {}).map(([s, id]) => [s, piece(id)]).filter(([, p]) => p));

// MARK: Ce qui s'applique à toute l'app

/** Le thème : le fond et les feuilles de toute l'app, et un halo discret en haut (Graphite : rien). */
export function appliquerTheme() {
  if (typeof document === "undefined") return;
  const r = document.documentElement;
  const t = piece(equipement().theme);
  if (!t) {
    r.removeAttribute("data-theme-grind");
    for (const v of ["--fond", "--feuille", "--halo-theme"]) r.style.removeProperty(v);
    return;
  }
  r.dataset.themeGrind = t.id;
  r.style.setProperty("--fond", t.couleurs[0]);
  r.style.setProperty("--feuille", t.couleurs[1]);
  r.style.setProperty("--halo-theme", t.couleurs[2]);
}

/**
 * Les sons choisis : le même fichier, rejoué plus haut et plus clair (Cristal) ou plus bas et feutré (Feutre).
 * Les fichiers de l'iPhone (Rente/Sons/<nom>-cristal.wav) sont rééchantillonnés de la même façon (docs/sons/variantes.py).
 */
export function suffixeSons() {
  const p = piece(equipement().sons);
  return p?.motif ? `-${p.motif}` : "";
}

// Lu au démarrage, avant le catalogue : le thème gardé s'applique dès que celui-ci arrive.

// MARK: Les dessins

/** Les couleurs d'une pièce en variables CSS (--c1 à --c4). */
const couleur = (p, i) => esc(p?.couleurs?.[i] ?? p?.couleurs?.[0] ?? "transparent");

const MARQUEURS = {
  "": '<circle cx="12" cy="12" r="6.5"/>',
  losange: '<path d="M12 3.5 20.5 12 12 20.5 3.5 12z"/>',
  boussole: '<path d="M12 2.5l2.2 7.3L21.5 12l-7.3 2.2L12 21.5l-2.2-7.3L2.5 12l7.3-2.2z"/>',
  couronne: '<path d="M3.5 8.5 8 12l4-6.5 4 6.5 4.5-3.5-1.8 9.5H5.3zM5.4 19h13.2v1.8H5.4z"/>',
};

/** Le marqueur d'un joueur sur la carte : sa forme, sa couleur (ou sa teinte). */
export function svgMarqueur(forme, couleurs, { taille = 24, teinte = "#34C88A", id = "m" } = {}) {
  const c = couleurs?.length ? couleurs : [teinte];
  const grad = c.length > 1
    ? `<defs><linearGradient id="cz-g-${esc(id)}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${esc(c[0])}"/><stop offset="1" stop-color="${esc(c[1])}"/></linearGradient></defs>` : "";
  const fill = c.length > 1 ? `url(#cz-g-${esc(id)})` : esc(c[0]);
  return `<svg class="cz-marqueur" width="${taille}" height="${taille}" viewBox="0 0 24 24" aria-hidden="true">${grad}<g fill="${fill}" stroke="rgba(0,0,0,.45)" stroke-width="1.1" stroke-linejoin="round">${MARQUEURS[forme ?? ""] ?? MARQUEURS[""]}</g></svg>`;
}

/** Une traînée : le trajet laissé derrière soi (miniature, de gauche à droite). */
function svgTrainee(p) {
  const c1 = esc(p.couleurs[0]), c2 = esc(p.couleurs[1] ?? p.couleurs[0]);
  const d = "M4 30 C 24 26, 38 10, 66 8";
  if (p.motif === "pointilles") return `<svg viewBox="0 0 72 36" aria-hidden="true"><path d="${d}" fill="none" stroke="${c1}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="1 6"/><circle cx="66" cy="8" r="3.6" fill="${c1}"/></svg>`;
  if (p.motif === "sillage") return `<svg viewBox="0 0 72 36" aria-hidden="true"><path d="M66 8 C 44 12, 26 20, 4 24" fill="none" stroke="${c1}" stroke-width="1.4" opacity=".9"/><path d="M66 8 C 46 16, 28 28, 8 34" fill="none" stroke="${c2}" stroke-width="1.4" opacity=".7"/><circle cx="66" cy="8" r="3.6" fill="${c1}"/></svg>`;
  return `<svg viewBox="0 0 72 36" aria-hidden="true"><defs><linearGradient id="cz-comete" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${c2}" stop-opacity="0"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs><path d="${d}" fill="none" stroke="url(#cz-comete)" stroke-width="4" stroke-linecap="round"/><circle cx="66" cy="8" r="4" fill="${c1}"/></svg>`;
}

/** Une plaque d'immatriculation, aux couleurs de la pièce (ou européenne). */
export function svgPlaque(p, texte = "GR-231") {
  if (!p) return `<svg class="cz-plaque" viewBox="0 0 104 24" aria-hidden="true"><rect x=".5" y=".5" width="103" height="23" rx="3" fill="#F4F4F2" stroke="#1B1B1F"/><rect x=".5" y=".5" width="12" height="23" rx="3" fill="#2B4AA8"/><text x="58" y="16.5" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="12" fill="#1B1B1F">${esc(texte)}</text></svg>`;
  const fond = esc(p.couleurs[0]), encre = esc(p.couleurs[1] ?? "#fff");
  const marteau = p.motif === "marteau" ? `<path d="M8 8.5l4-4 2.2 2.2-4 4zM10.6 9.2l5.5 5.5-1.2 1.2-5.5-5.5z" fill="${encre}"/>` : `<circle cx="10" cy="12" r="2.4" fill="none" stroke="${encre}" stroke-width="1.2"/>`;
  return `<svg class="cz-plaque" viewBox="0 0 104 24" aria-hidden="true"><defs><linearGradient id="cz-pl-${esc(p.id)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x=".5" y=".5" width="103" height="23" rx="3" fill="${fond}" stroke="${encre}" stroke-opacity=".55"/><rect x=".5" y=".5" width="103" height="23" rx="3" fill="url(#cz-pl-${esc(p.id)})"/>${marteau}<text x="60" y="16.5" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="12" letter-spacing=".5" fill="${encre}">${esc(texte)}</text></svg>`;
}

/** Une façade de bien : un petit immeuble, son parement. */
export function svgFacade(p) {
  const c = p?.couleurs ?? ["#3A3D44", "#22252B", "#C9CDD3"];
  const fen = (x, y) => `<rect x="${x}" y="${y}" width="7" height="9" rx="1" fill="#0A0B0D" opacity=".75"/>`;
  let motif = "";
  if (p?.motif === "brique") {
    for (let y = 8; y < 54; y += 4) motif += `<line x1="6" y1="${y}" x2="58" y2="${y}" stroke="${esc(c[2])}" stroke-width=".5" opacity=".55"/>`;
    for (let y = 8, r = 0; y < 54; y += 4, r++) for (let x = 6 + (r % 2) * 4; x < 58; x += 8) motif += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 4}" stroke="${esc(c[2])}" stroke-width=".5" opacity=".45"/>`;
  } else if (p?.motif === "artdeco") {
    for (const x of [14, 32, 50]) motif += `<path d="M${x - 7} 14 a7 7 0 0 1 14 0" fill="none" stroke="${esc(c[1])}" stroke-width=".8"/><path d="M${x - 4} 14 a4 4 0 0 1 8 0" fill="none" stroke="${esc(c[1])}" stroke-width=".8"/><line x1="${x}" y1="7" x2="${x}" y2="14" stroke="${esc(c[1])}" stroke-width=".8"/>`;
    motif += `<line x1="6" y1="16" x2="58" y2="16" stroke="${esc(c[1])}" stroke-width="1"/>`;
  }
  const fenetres = [[12, 22], [28, 22], [44, 22], [12, 36], [28, 36], [44, 36]].map(([x, y]) => fen(x, y)).join("");
  return `<svg class="cz-facade" viewBox="0 0 64 60" aria-hidden="true"><rect x="6" y="6" width="52" height="50" rx="2" fill="${esc(c[0])}"/>${motif}${fenetres}<rect x="27" y="46" width="10" height="10" rx="1" fill="#0A0B0D" opacity=".8"/><line x1="2" y1="56.5" x2="62" y2="56.5" stroke="rgba(255,255,255,.25)"/></svg>`;
}

/** Un cadran de montre : son fond, ses index, ses aiguilles. */
export function svgCadran(p, { id = "c" } = {}) {
  const c = p?.couleurs ?? ["#F2F1EC", "#D9D7CF", "#1B1B1F"];
  const encre = p ? esc(c[2] ?? c[1]) : "#1B1B1F";
  const k = esc(`${id}-${p?.id ?? "base"}`);
  const index = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const r1 = i % 3 === 0 ? 13 : 14.5, r2 = 17;
    return `<line x1="${(20 + Math.sin(a) * r1).toFixed(2)}" y1="${(20 - Math.cos(a) * r1).toFixed(2)}" x2="${(20 + Math.sin(a) * r2).toFixed(2)}" y2="${(20 - Math.cos(a) * r2).toFixed(2)}" stroke="${encre}" stroke-width="${i % 3 === 0 ? 1.6 : 0.8}" stroke-linecap="round"/>`;
  }).join("");
  let fond = `<circle cx="20" cy="20" r="18.5" fill="${esc(c[0])}"/>`;
  if (p?.motif === "soleille") fond = `<defs><radialGradient id="cz-cd-${k}"><stop offset="0" stop-color="${esc(c[0])}"/><stop offset="1" stop-color="${esc(c[1])}"/></radialGradient></defs><circle cx="20" cy="20" r="18.5" fill="url(#cz-cd-${k})"/>${Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return `<line x1="20" y1="20" x2="${(20 + Math.sin(a) * 18).toFixed(2)}" y2="${(20 - Math.cos(a) * 18).toFixed(2)}" stroke="#fff" stroke-opacity=".05" stroke-width=".6"/>`; }).join("")}`;
  if (p?.motif === "meteorite") fond = `<circle cx="20" cy="20" r="18.5" fill="${esc(c[1])}"/>${[[-25, 0.5], [35, 0.35], [-70, 0.3], [10, 0.25]].map(([r, o]) => `<g transform="rotate(${r} 20 20)" opacity="${o}">${[6, 11, 16, 21, 26, 31].map((x) => `<line x1="${x}" y1="2" x2="${x - 2}" y2="38" stroke="${esc(c[2])}" stroke-width=".7"/>`).join("")}</g>`).join("")}`;
  const secondes = p?.motif === "ticker" ? esc(c[1]) : encre;
  return `<svg class="cz-cadran" viewBox="0 0 40 40" aria-hidden="true"><defs><clipPath id="cz-cl-${k}"><circle cx="20" cy="20" r="18.5"/></clipPath></defs><g clip-path="url(#cz-cl-${k})">${fond}</g><circle cx="20" cy="20" r="18.5" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.2"/>${index}<line x1="20" y1="20" x2="20" y2="9" stroke="${encre}" stroke-width="1.6" stroke-linecap="round"/><line x1="20" y1="20" x2="28" y2="23" stroke="${encre}" stroke-width="1.3" stroke-linecap="round"/><line x1="20" y1="23" x2="20" y2="5.5" stroke="${secondes}" stroke-width=".6"/><circle cx="20" cy="20" r="1.1" fill="${secondes}"/></svg>`;
}

/**
 * La miniature d'une pièce, telle qu'on la voit dans la vitrine et dans Personnaliser.
 * `p` : la pièce (du tableau ou du catalogue). `ferme` : pas encore gagnée (grisée).
 */
export function apercu(p, { ferme = false, grand = false } = {}) {
  if (!p) return "";
  const cls = `cz-apercu cz-s-${esc(p.sorte)}${p.motif ? ` cz-m-${esc(p.motif)}` : ""}${ferme ? " ferme" : ""}${grand ? " grand" : ""}`;
  const style = `style="--c1:${couleur(p, 0)};--c2:${couleur(p, 1)};--c3:${couleur(p, 2)};--c4:${couleur(p, 3)}"`;
  switch (p.sorte) {
    case "fond": return `<span class="${cls}" ${style}><span class="cz-mini-carte"><i></i><b>Pseudo</b></span></span>`;
    case "accent": return `<span class="${cls}" ${style}><span class="cz-rond"></span><b>Aa</b></span>`;
    case "pseudo": return `<span class="${cls}" ${style}><b class="cz-pseudo" data-pseudo="${esc(p.motif ?? "")}">Pseudo</b></span>`;
    case "banniere": return `<span class="${cls}" ${style}><span class="cz-banniere-dessin"></span></span>`;
    case "marqueur": return `<span class="${cls}" ${style}>${svgMarqueur(p.motif, ["#FFFFFF", "#C9CDD3"], { taille: grand ? 44 : 30, id: p.id })}</span>`;
    case "couleurMarqueur": return `<span class="${cls}" ${style}>${svgMarqueur("", p.couleurs, { taille: grand ? 44 : 30, id: p.id })}</span>`;
    case "trainee": return `<span class="${cls}" ${style}>${svgTrainee(p)}</span>`;
    case "plaque": return `<span class="${cls}" ${style}>${svgPlaque(p)}</span>`;
    case "finition": return `<span class="${cls}" ${style}><span class="cz-carrosserie"></span></span>`;
    case "facade": return `<span class="${cls}" ${style}>${svgFacade(p)}</span>`;
    case "cadran": return `<span class="${cls}" ${style}>${svgCadran(p, { id: "a" })}</span>`;
    case "theme": return `<span class="${cls}" ${style}><span class="cz-ecran"><i></i><i></i><i></i></span></span>`;
    case "sons": return `<span class="${cls}" ${style}><span class="cz-onde">${Array.from({ length: 9 }, (_, i) => `<i style="--h:${[30, 55, 80, 100, 70, 45, 85, 50, 25][i]}%"></i>`).join("")}</span></span>`;
    case "ambiance": return `<span class="${cls}" ${style}><span class="cz-ambiance-dessin" data-ambiance="${esc(p.motif ?? "")}">${particules(p.motif, 9)}</span></span>`;
    case "finSession": return `<span class="${cls}" ${style}><span class="cz-ticket"><i></i><i></i><i></i><u></u></span></span>`;
    default: return `<span class="${cls}" ${style}></span>`;
  }
}

/** Les gouttes ou les braises d'une ambiance (placées par une suite fixe : le même dessin à chaque fois). */
export function particules(motif, n = 24) {
  if (!motif) return "";
  return Array.from({ length: n }, (_, i) => {
    const x = (i * 37) % 100, d = 2.4 + ((i * 13) % 17) / 10, r = ((i * 7) % 23) / 10;
    return `<i style="--x:${x}%;--d:${d}s;--r:-${r}s"></i>`;
  }).join("");
}

/**
 * Les classes et variables d'une carte de membre selon les cosmétiques équipés (fond, accent, pseudo, bannière).
 * Rend { classe, style, banniere (le décor à mettre en tête de la carte), pseudo (classes du pseudo) }.
 */
export function habillageMembre(c) {
  const x = piecesDe(c);
  const cls = [];
  if (x.fond) cls.push("cz-fond", `cz-fond-${x.fond.motif ?? "uni"}`);
  if (x.accent) cls.push("cz-accent");
  if (x.banniere) cls.push("cz-avec-banniere");
  const f = x.fond, a = x.accent, b = x.banniere;
  const banniere = (x.banniere ? `<span class="cz-banniere cz-m-${esc(x.banniere.motif ?? "")}" aria-hidden="true"></span>` : "")
    + (x.fond?.motif === "lisere" ? `<span class="cz-lisere" aria-hidden="true"></span>` : "");
  return {
    classe: cls.join(" "),
    style: cls.length ? `style="--f1:${couleur(f, 0)};--f2:${couleur(f, 1)};--f3:${couleur(f, 2)};--a1:${couleur(a, 0)};--a2:${couleur(a, 1)};--b1:${couleur(b, 0)};--b2:${couleur(b, 1)};--b3:${couleur(b, 2)};--b4:${couleur(b, 3)}"` : "",
    banniere,
    pseudo: x.pseudo ? `cz-pseudo" data-pseudo="${esc(x.pseudo.motif ?? "")}` : "",
  };
}

/** Le pseudo d'un autre joueur dans une liste : sa couleur d'accent et son animation, s'il en a. */
export function pseudoHabille(pseudo, c) {
  const x = piecesDe(c);
  if (!x.accent && !x.pseudo) return esc(pseudo);
  const vars = x.accent ? `style="--a1:${x.accent.couleurs[0]};--a2:${x.accent.couleurs[1] ?? x.accent.couleurs[0]}"` : "";
  return `<span class="cz-nom${x.accent ? " cz-accent" : ""}${x.pseudo ? " cz-pseudo" : ""}" ${x.pseudo ? `data-pseudo="${esc(x.pseudo.motif ?? "")}"` : ""} ${vars}>${esc(pseudo)}</span>`;
}

/**
 * RNT-231 : la finition équipée d'un bien que tu possèdes (plaque d'un véhicule, façade d'un bien, cadran
 * d'une montre), en bandeau sous l'en-tête de sa fiche. Rien d'équipé : la page telle quelle.
 */
export function avecFinition(html, sorte) {
  const e = equipement();
  const p = piece(e[sorte]);
  const fin = sorte === "plaque" ? piece(e.finition) : null;
  if (!p && !fin) return html;
  const dessin = sorte === "plaque" ? svgPlaque(p) : sorte === "facade" ? svgFacade(p) : svgCadran(p, { id: "fiche" });
  const noms = [p?.nom, fin?.nom].filter(Boolean).join(" · ");
  const bandeau = `<div class="cz-finition carte" data-cle="cz-finition">
    <span class="cz-finition-dessin">${dessin}</span>${fin ? apercu(fin) : ""}
    <span class="cz-finition-texte"><b>${esc(noms)}</b><span>Ta finition, équipée dans Personnaliser</span></span></div>`;
  const i = html.indexOf("</header>");
  return i < 0 ? bandeau + html : html.slice(0, i + 9) + bandeau + html.slice(i + 9);
}
