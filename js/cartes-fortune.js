// ══════════════════════════════════════════════════════════════════════
//  Cartes de fortune (RNT-276 / RNT-279, D263) — MatiereFortune.swift en web.
//
//  Direction D2 « Cadran » : chaque carte est un cadran de montre. Une
//  matière, une lumière (en haut à gauche), de la retenue. Signature
//  centrée, chiffre romain en applique de métal poli, minuterie le long
//  du bord. La finition monte avec le palier :
//    I–III   mat (chocolat, ardoise, sable), minuterie simple ;
//    IV–VIII soleillé : deux secteurs clairs opposés, de plus en plus vifs ;
//    IX–XII  laque, chemin de fer double (acier, puis or), le soleillage
//            tourne lentement sous la laque à partir de Légende ;
//    XIII    émail grand feu ivoire, acier bleui : le seul cadran clair.
//  Même table que MatiereFortune.swift (Cadran.paliers), dans le même ordre.
// ══════════════════════════════════════════════════════════════════════

export const W = 382, H = 241;

/** id, nom, finition (sous-titre). Les seuils viennent du moteur (Balance focus.salaire.paliers). */
export const PALIERS_FORTUNE = [
  ["bronze", "Bronze", "Cadran chocolat mat, applique or rose"],
  ["argent", "Argent", "Cadran ardoise mat, applique argent"],
  ["or", "Or", "Cadran sable mat, applique or jaune"],
  ["platine", "Platine", "Soleillé gris acier, applique or blanc"],
  ["saphir", "Saphir", "Soleillé bleu profond, applique or blanc"],
  ["emeraude", "Émeraude", "Soleillé vert forêt, applique or jaune"],
  ["rubis", "Rubis", "Soleillé rouge profond, applique or blanc"],
  ["diamant", "Diamant", "Soleillé glacier, applique platine"],
  ["titane", "Titane", "Laque anthracite, chemin de fer acier"],
  ["legende", "Légende", "Laque noire, chemin de fer or"],
  ["mythe", "Mythe", "Laque bleu nuit, chemin de fer or"],
  ["titan", "Titan", "Laque tabac, chemin de fer or rose"],
  ["olympe", "Olympe", "Émail grand feu ivoire, acier bleui"],
];
export const ROMAINS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];

// Les appliques (haut, milieu, ombre du biseau).
const OR_ROSE = ["#f6dcc2", "#c99a76", "#7d5238"];
const ARGENT = ["#ffffff", "#c4c9d0", "#5f646c"];
const OR_BLANC = ["#ffffff", "#c9c9cf", "#6d6d75"];
const OR_JAUNE = ["#fff1c9", "#d4ae62", "#7a5b22"];
const ACIER_BLEUI = ["#5f86d6", "#1d3f8f", "#0b1d4a"];

/**
 * Le cadran de chaque palier. fond ; soleil : force du soleillage (0 : mat) ; fume : bords fumés ;
 * vernis : reflet de la lumière en haut à gauche ; enc : encre (lettres, minuterie) ; app : applique ;
 * piste : 1 minuterie simple, 2 chemin de fer double ; tourne : le soleillage tourne sous la laque.
 */
export const CADRANS = {
  bronze: { fond: "#4a3326", soleil: 0, fume: .55, vernis: .04, enc: "#e2c3a6", app: OR_ROSE, piste: 1 },
  argent: { fond: "#3a3d43", soleil: 0, fume: .52, vernis: .05, enc: "#dfe3e8", app: ARGENT, piste: 1 },
  or: { fond: "#5a4530", soleil: 0, fume: .5, vernis: .06, enc: "#ead6a2", app: OR_JAUNE, piste: 1 },
  platine: { fond: "#3e444d", soleil: .2, fume: .5, vernis: .05, enc: "#e4e8ee", app: OR_BLANC, piste: 1 },
  saphir: { fond: "#0f2a66", soleil: .24, fume: .5, vernis: .05, enc: "#d6def4", app: OR_BLANC, piste: 1 },
  emeraude: { fond: "#0b4a32", soleil: .27, fume: .5, vernis: .05, enc: "#d3eee0", app: OR_JAUNE, piste: 1 },
  rubis: { fond: "#5a0f1b", soleil: .32, fume: .5, vernis: .05, enc: "#f1d6d6", app: OR_BLANC, piste: 1 },
  diamant: { fond: "#27323e", soleil: .38, fume: .46, vernis: .07, enc: "#e9f2fa", app: ARGENT, piste: 1 },
  titane: { fond: "#1b1d21", soleil: .16, fume: .38, vernis: .09, enc: "#c9cfd8", app: OR_BLANC, piste: 2 },
  legende: { fond: "#0d0d0e", soleil: .22, fume: .35, vernis: .10, enc: "#d9bd84", app: OR_JAUNE, piste: 2, tourne: true },
  mythe: { fond: "#0a1130", soleil: .22, fume: .35, vernis: .11, enc: "#d9bd84", app: OR_JAUNE, piste: 2, tourne: true },
  titan: { fond: "#1c120c", soleil: .24, fume: .35, vernis: .12, enc: "#e6c3a0", app: OR_ROSE, piste: 2, tourne: true },
  olympe: { fond: "radial-gradient(120% 120% at 40% 20%, #fbf7ee 0%, #efe7d6 55%, #ddd1b8 100%)", soleil: 0, fume: .14, vernis: .6,
    enc: "#1f3a7a", app: ACIER_BLEUI, piste: 2, clair: true },
};

export const estClaire = (id) => !!CADRANS[id]?.clair;
/** Le style de carte bancaire d'un palier (StyleCarte « palier-<id> »). */
export const styleFortune = (i) => `palier-${PALIERS_FORTUNE[i][0]}`;
export const indexStyleFortune = (style) => PALIERS_FORTUNE.findIndex(([id]) => `palier-${id}` === style);
/** Les cartes dont la puce de carte bancaire est argentée (applique blanche). */
export const PUCE_ARGENT = new Set(["argent", "platine", "saphir", "rubis", "diamant", "titane"]);

/** Le palier d'un style de carte bancaire (« palier-or » → 2 ; anciennes finitions de record fondues), ou -1. */
export function palierDuStyle(style) {
  if (!style) return -1;
  if (style.startsWith("palier-")) return PALIERS_FORTUNE.findIndex(([id]) => `palier-${id}` === style);
  return { metal: 3, noire: 4, orMassif: 5, diamant: 7 }[style] ?? -1;
}

// MARK: La géométrie (la même que Cadran dans MatiereFortune.swift)

const f2 = (x) => x.toFixed(2);

/** Le bord arrondi intérieur à `i` du bord de la carte, en segments (départ en haut au milieu, sens horaire). */
function bord(i) {
  const r = 17 - i * .6, g = i, d = W - i, h = i, b = H - i, P = Math.PI;
  return [
    { l: [[W / 2, h], [d - r, h]] },
    { a: [d - r, h + r, r, -P / 2, 0] },
    { l: [[d, h + r], [d, b - r]] },
    { a: [d - r, b - r, r, 0, P / 2] },
    { l: [[d - r, b], [g + r, b]] },
    { a: [g + r, b - r, r, P / 2, P] },
    { l: [[g, b - r], [g, h + r]] },
    { a: [g + r, h + r, r, P, 3 * P / 2] },
    { l: [[g + r, h], [W / 2, h]] },
  ];
}
const longueur = (s) => (s.l ? Math.hypot(s.l[1][0] - s.l[0][0], s.l[1][1] - s.l[0][1]) : s.a[2] * (s.a[4] - s.a[3]));

/** Le chemin SVG d'un bord. */
function cheminBord(i) {
  const r = 17 - i * .6;
  let p = `M${f2(W / 2)},${f2(i)}`;
  for (const s of bord(i)) {
    if (s.l) p += `L${f2(s.l[1][0])},${f2(s.l[1][1])}`;
    else { const [cx, cy, rr, , t1] = s.a; p += `A${f2(r)},${f2(r)} 0 0 1 ${f2(cx + rr * Math.cos(t1))},${f2(cy + rr * Math.sin(t1))}`; }
  }
  return p + "Z";
}

/** n points régulièrement espacés sur un bord, avec la normale vers l'intérieur. */
function points(i, n) {
  const segs = bord(i), L = segs.reduce((t, s) => t + longueur(s), 0), res = [];
  for (let k = 0; k < n; k++) {
    let t = (k / n) * L;
    for (const s of segs) {
      const ls = longueur(s);
      if (t > ls) { t -= ls; continue; }
      if (s.l) {
        const [[x0, y0], [x1, y1]] = s.l, u = t / ls, dx = (x1 - x0) / ls, dy = (y1 - y0) / ls;
        res.push([x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, -dy, dx]);
      } else {
        const [cx, cy, r, t0] = s.a, th = t0 + t / r, c = Math.cos(th), sn = Math.sin(th);
        res.push([cx + r * c, cy + r * sn, -c, -sn]);
      }
      break;
    }
  }
  return res;
}

/** La minuterie : 60 traits (une sur cinq marquée), ou le chemin de fer double à 120 traits. */
export function piste(id) {
  const c = CADRANS[id], ext = 12, int = c.piste >= 2 ? 18 : 16.5, n = c.piste >= 2 ? 120 : 60;
  let fins = "", forts = "";
  points(ext, n).forEach(([x, y, nx, ny], k) => {
    const fort = k % (n / 12) === 0;
    const lg = c.piste >= 2 ? (fort || k % 2 === 0 ? 6 : 2.6) : (fort ? 4.5 : 2.2);
    const s = `M${f2(x)},${f2(y)}L${f2(x + nx * lg)},${f2(y + ny * lg)}`;
    if (fort) forts += s; else fins += s;
  });
  return `<svg class="piste-f" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" fill="none" stroke="${c.enc}">
    <path d="${cheminBord(ext)}" stroke-width=".6" opacity=".75"/>${c.piste >= 2 ? `<path d="${cheminBord(int)}" stroke-width=".6" opacity=".75"/>` : ""}
    <path d="${fins}" stroke-width=".5" opacity=".6"/><path d="${forts}" stroke-width="1.1" opacity=".9"/></svg>`;
}

/** Les traits d'un chiffre romain (hauteur 40, empattements fins) : [pleins, déliés, largeur]. */
function glyphe(ch, x) {
  const P = [], f = [], H0 = 40, se = 5;
  if (ch === "I") { P.push(`M${x + se},0V${H0}`); f.push(`M${x},0H${x + 2 * se}M${x},${H0}H${x + 2 * se}`); return [P, f, 2 * se]; }
  const w = 26;
  if (ch === "V") { P.push(`M${x + 3},0L${x + w / 2},${H0}`); f.push(`M${x + w / 2},${H0}L${x + w - 3},0M${x - 1},0H${x + 8}M${x + w - 8},0H${x + w + 1}`); return [P, f, w]; }
  P.push(`M${x + 3},0L${x + w - 3},${H0}`);
  f.push(`M${x + w - 3},0L${x + 3},${H0}M${x - 1},0H${x + 8}M${x + w - 8},0H${x + w + 1}M${x - 1},${H0}H${x + 8}M${x + w - 8},${H0}H${x + w + 1}`);
  return [P, f, w];
}

let numero = 0;
/** Le chiffre en applique : dégradé poli (la lumière vient d'en haut), ombre portée sur le cadran. */
export function applique(i) {
  const id = PALIERS_FORTUNE[i][0], c = CADRANS[id], [c1, c2, c3] = c.app, k = `f${++numero}`;
  let x = 0; const P = [], f = [];
  for (const ch of ROMAINS[i]) { const [a, b, w] = glyphe(ch, x); P.push(...a); f.push(...b); x += w + 4; }
  const sc = 1.05, tx = W / 2 - ((x - 4) * sc) / 2, ty = H / 2 - 20 * sc;
  return `<svg class="applique-f" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>
    <linearGradient id="g${k}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="40"><stop offset="0" stop-color="${c1}"/><stop offset=".46" stop-color="${c2}"/><stop offset=".54" stop-color="${c3}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <filter id="o${k}" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="1.2" stdDeviation=".9" flood-color="#000" flood-opacity="${c.clair ? .25 : .65}"/></filter></defs>
    <g transform="translate(${f2(tx)} ${f2(ty)}) scale(${sc})" filter="url(#o${k})" fill="none" stroke="url(#g${k})"><path d="${P.join("")}" stroke-width="4.2"/><path d="${f.join("")}" stroke-width="1.3"/></g></svg>`;
}

/** Le soleillage : deux secteurs clairs opposés (AngularGradient dans l'app). */
function soleillage(a) {
  const b = a * .15, s = a * .6, w = (o) => `rgba(255,255,255,${+o.toFixed(3)})`, n = (o) => `rgba(0,0,0,${+o.toFixed(3)})`;
  return `conic-gradient(from 0deg at 50% 50%, ${w(b)} 0deg, ${w(a)} 45deg, ${n(s)} 100deg, ${w(b)} 135deg, ${w(a)} 225deg, ${n(s)} 280deg, ${w(b)} 360deg)`;
}

/**
 * Le fond d'un cadran, à glisser dans une carte (classe m-<id> sur la carte) : matière, soleillage,
 * fumé, vernis, minuterie. LE point de rendu : carte « Grind », carte bancaire, miniature et badge.
 */
export function couchesFortune(id) {
  const c = CADRANS[id];
  return `<div class="matiere-f"></div>${c.soleil ? `<div class="couche soleil-f ${c.tourne ? "tourne" : ""}"></div>` : ""}<div class="couche fume-f"></div><div class="couche vernis-f"></div>${piste(id)}`;
}

const CADENAS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>`;

/**
 * La carte « Grind » d'un palier (collection, profil, déblocage).
 * `verrou` : grisée, cadenas et seuil ; `anime` : l'animation de déblocage (2 s).
 */
export function carteFortune(i, { verrou = null, anime = false, classe = "" } = {}) {
  injecterCSS();
  const [id, nom] = PALIERS_FORTUNE[i];
  return `<div class="cb-f m-${id} ${verrou ? "verrou" : ""} ${anime ? "anim" : ""} ${classe}" role="img" aria-label="Carte ${esc(nom)}${verrou ? `, verrouillée, ${esc(verrou)} de patrimoine net` : ", à vie"}">
    ${couchesFortune(id)}${applique(i)}
    <div class="signe-f"><b>GRIND</b><span>FORTUNE NETTE</span></div>
    <div class="pied-f"><b>${esc(nom.toUpperCase())}</b><span>${i === 0 ? "DÉPART" : "À VIE"}</span></div>
    ${anime ? '<div class="couche eclair"></div>' : ""}
    ${verrou ? `<div class="voile">${CADENAS}<span class="s">${esc(verrou)}</span><small>patrimoine net</small></div>` : ""}
  </div>`;
}

/** Le badge d'une carte, à côté d'un pseudo (classement) : le cadran et son chiffre. */
export function badgeFortune(i) {
  if (!(i > 0)) return "";
  injecterCSS();
  const p = Math.min(i, 12), [id, nom] = PALIERS_FORTUNE[p];
  return `<span class="badge-f m-${id}" role="img" aria-label="Carte ${esc(nom)}"><b>${ROMAINS[p]}</b></span>`;
}

/** Le déblocage : la carte sort de la poche (0 → 1,1 s), se pose, un reflet la traverse (1 → 2 s). */
export function sceneDeblocage(i) {
  injecterCSS();
  return `<div class="deblocage-f" role="dialog" aria-modal="true" aria-label="Nouvelle carte ${esc(PALIERS_FORTUNE[i][1])}">
    <div class="surtitre-f">Nouvelle carte</div>
    <div class="scene-f"><div class="poche-f"></div>${carteFortune(i, { anime: true })}</div>
    <div class="titre-f">Carte ${esc(PALIERS_FORTUNE[i][1])}</div>
    <p class="aide">Débloquée à vie : elle se choisit comme style de tes cartes bancaires.</p>
  </div>`;
}

const CSS = `
${Object.entries(CADRANS).map(([id, c]) => `.m-${id} { --fond-f: ${c.fond}; --encre-f: ${c.enc}; --fume-f: ${c.fume}; --vernis-f: ${c.vernis}; }`).join("\n")}
${Object.entries(CADRANS).filter(([, c]) => c.soleil).map(([id, c]) => `.m-${id} .soleil-f { background: ${soleillage(c.soleil)}; }`).join("\n")}
.cb-f { position: relative; width: 100%; aspect-ratio: ${W} / ${H}; border-radius: 4.45% / 7.05%; container-type: inline-size; color: var(--encre-f); background: #111;
  overflow: hidden; isolation: isolate; box-shadow: 0 18px 40px -18px rgba(0,0,0,.9), 0 2px 6px rgba(0,0,0,.5); text-align: center; }
.cb-f::after, .carte-bancaire.fortune::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.07), inset 0 1px 0 rgba(255,255,255,.16), inset 0 -1px 0 rgba(0,0,0,.4); }
.cb-f .couche, .carte-bancaire.fortune .couche { position: absolute; inset: 0; pointer-events: none; }
.matiere-f { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: var(--fond-f); }
.soleil-f { z-index: 1; inset: -60% !important; mix-blend-mode: soft-light; filter: blur(6px); }
.soleil-f.tourne { animation: tourne-f 14s linear infinite; animation-delay: -2s; }
.fume-f { z-index: 1; background: radial-gradient(75% 95% at 50% 50%, transparent 55%, rgba(0,0,0,var(--fume-f)) 100%); }
.vernis-f { z-index: 1; background: linear-gradient(160deg, rgba(255,255,255,var(--vernis-f)) 0%, transparent 38%); }
.piste-f, .applique-f { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.piste-f { z-index: 2; } .applique-f { z-index: 4; overflow: visible; }
.signe-f, .pied-f { position: absolute; left: 0; right: 0; z-index: 3; line-height: 1; }
.signe-f { top: 14.1%; } .pied-f { bottom: 12.4%; }
.signe-f b, .pied-f b { display: block; font-weight: 700; }
.signe-f b { font-size: 2.88cqw; letter-spacing: .42em; padding-left: .42em; }
.pied-f b { font-size: 2.62cqw; letter-spacing: .36em; padding-left: .36em; }
.signe-f span, .pied-f span { display: block; margin-top: 1.3cqw; font-size: 1.96cqw; font-weight: 600; letter-spacing: .32em; padding-left: .32em; opacity: .62; }
@keyframes tourne-f { to { transform: rotate(360deg); } }
.cb-f.verrou { box-shadow: none; background: #1b1b1e; }
.cb-f.verrou > :not(.voile) { filter: grayscale(1) brightness(.5) contrast(.9); }
.cb-f.verrou * { animation: none !important; }
.cb-f.verrou .applique-f, .cb-f.verrou .signe-f { visibility: hidden; }
.cb-f.verrou::after { box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
.cb-f .voile { position: absolute; inset: 0; z-index: 6; display: grid; place-content: center; justify-items: center; gap: 1cqw; color: #fff; background: rgba(9,9,11,.35); font-size: 4.1cqw; }
.cb-f .voile svg { width: 2em; height: 2em; opacity: .9; } .cb-f .voile .s { font-size: 1.6em; font-weight: 700; } .cb-f .voile small { font-size: .8em; color: rgba(255,255,255,.6); font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }
.carte-bancaire.fortune { border: none; } .carte-bancaire.fortune > .matiere-f, .carte-bancaire.fortune > .couche, .carte-bancaire.fortune > .piste-f { z-index: -1; }
.badge-f { position: relative; display: inline-grid; place-items: center; width: 22px; height: 14px; border-radius: 3px; overflow: hidden; background: var(--fond-f); color: var(--encre-f); flex: none; vertical-align: middle;
  box-shadow: inset 0 0 0 .5px var(--encre-f), inset 0 1px 0 rgba(255,255,255,.12); }
.badge-f b { position: relative; z-index: 1; font: 700 7.5px/1 Georgia, "Times New Roman", serif; letter-spacing: .02em; }
.deblocage-f { position: fixed; inset: 0; z-index: 1000; display: grid; align-content: center; justify-items: center; gap: 14px; padding: 24px; background: rgba(0,0,0,.72); text-align: center; animation: fondu-f .25s ease-out; }
.deblocage-f .surtitre-f { font-size: 13px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.6); }
.deblocage-f .titre-f { font-size: 22px; font-weight: 700; color: #fff; }
.scene-f { position: relative; width: min(320px, 82vw); height: 300px; overflow: hidden; display: grid; align-items: end; }
.scene-f .cb-f { position: absolute; left: 0; right: 0; bottom: 30px; z-index: 3; }
.poche-f { position: absolute; bottom: 0; left: -10px; right: -10px; height: 96px; border-radius: 18px 18px 0 0; background: linear-gradient(180deg, #2a2724, #1a1816); box-shadow: 0 -1px 0 rgba(255,255,255,.08) inset, 0 -10px 30px rgba(0,0,0,.4); z-index: 4; }
.cb-f.anim { animation: sortie-f 2s cubic-bezier(.2,.8,.2,1) both; }
.cb-f.anim .eclair { z-index: 4; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.55) 47%, rgba(255,255,255,.1) 53%, transparent 62%); background-size: 280% 100%; animation: passe-f 2s ease-in-out both; }
@keyframes sortie-f { 0% { transform: translateY(150px) scale(.94); filter: grayscale(1) brightness(.5); } 55% { transform: translateY(-8px) scale(1); filter: grayscale(0) brightness(1); } 70% { transform: translateY(0); } 100% { transform: translateY(0); filter: none; } }
@keyframes passe-f { 0%, 50% { background-position: 140% 0; } 100% { background-position: -40% 0; } }
@keyframes fondu-f { from { opacity: 0; } }
.grille-fortune { gap: 16px 14px; margin-top: -6px; }
.collection-fortune { display: grid; gap: 6px; min-width: 0; }
.collection-fortune .titre-f { font-size: 15px; font-weight: 600; } .collection-fortune .titre-f i { font-style: normal; font-size: 11px; color: var(--texte3); margin-right: 4px; }
.jauge-f { height: 4px; border-radius: 2px; background: rgba(255,255,255,.07); overflow: hidden; }
.jauge-f i { display: block; height: 100%; width: calc(var(--part) * 100%); background: var(--gain, #34c88a); border-radius: 2px; }
.fiche-fortune { display: flex; align-items: center; gap: 14px; margin-top: 16px; } .fiche-fortune .cb-f { width: 120px; flex: none; }
@media (prefers-reduced-motion: reduce) { .cb-f *, .cb-f, .carte-bancaire.fortune * { animation: none !important; } }
`;

let cssPose = false;
export function injecterCSS() {
  if (cssPose || typeof document === "undefined") return;
  cssPose = true;
  const s = document.createElement("style");
  s.id = "css-fortune";
  s.textContent = CSS;
  document.head.appendChild(s);
}

function esc(t) {
  return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
