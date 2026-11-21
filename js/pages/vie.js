// ══════════════════════════════════════════════════════════════════════
//  Zone « vie » (EcransVie.swift) : les écrans qui partent de l'accueil.
//
//  Patrimoine (courbe et lecture au doigt), jauge de plaisir, train de
//  vie, répartition, activité, événements (les objectifs : objectifs.js). Chaque valeur vient
//  d'un tableau du moteur (TableauxVie.swift) ; ce que l'iPhone calcule à
//  partir de ces tableaux (hauteurs de la courbe, libellé du point lu…)
//  est refait ici à l'identique.
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, variation, esc } from "../format.js?v=3e8bddd9";

/** « −13 643 € » avec le vrai signe moins, comme Montant.texte. */
const montant = (c) => montantBrut(c).replace("-", "\u2212");
import { entetePousse, carte, ligne, bouton, petit, heros, vide, icones, courbe } from "../ui.js?v=3e8bddd9";
import * as L from "../enligne.js?v=3e8bddd9";
import { carteDemande, historique, restant } from "./notifications.js?v=3e8bddd9"; // RNT-211
import { sectionAPayer } from "./banque.js?v=3e8bddd9"; // RNT-219 : « À payer » sous la cloche

// MARK: - Petites briques locales

/** « +1,5 », « −3,0 » (Montant.decimal). */
export const decimal = (x, d = 1) => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x).toFixed(d).replace(".", ",");

/** « 61 % » (Montant.pourcentage, sans signe) ; « +2 % » avec signe. */
export const pct = (x, { signe = false, decimales = 0 } = {}) => {
  const v = x * 100;
  const s = signe ? (v > 0 ? "+" : v < 0 ? "−" : "") : v < 0 ? "−" : "";
  return `${s}${Math.abs(v).toFixed(decimales).replace(".", ",")} %`;
};

const majuscule = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : "");
const couleurTon = (v) => (v > 0 ? "gain" : v < 0 ? "perte" : "t2");
const filet = (style = "") => `<div class="filet" style="${style}"></div>`;
const carteGivree = (contenu, style = "") => `<div class="carte" style="${style}">${contenu}</div>`;
const libelle = (t, style = "") => `<div class="libelle" style="${style}">${t}</div>`;

/** Un écran sans contenu : une phrase qui dit quoi faire (Vide). */
const ecranVide = (texte) => `<div class="vi-x1 vide">${texte}</div>`;

/** L'heure « 14:32 » d'une date en ms. */
const heure = (ms) => new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });

// Les symboles SF de l'iPhone, en traits simples (24 × 24). Une famille par forme : le moteur
// en a près de quatre-vingts, la page les range par ce qu'ils montrent.
const T = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SYMBOLES = {
  sac: T('<path d="M5 8h14l-1.2 12H6.2zM9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  enveloppe: T('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>'),
  immeuble: T('<path d="M4 21V5.5L12 3v18M12 8.5h8V21M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2M2.5 21h19"/>'),
  colonnes: T('<path d="M3 9 12 4l9 5M5 10.5v7M9.7 10.5v7M14.3 10.5v7M19 10.5v7M3 20h18"/>'),
  cadeau: T('<rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13M12 7C10 3.5 6.5 4 7 6s3.5 1 5 1c1.5 0 4.5 1 5-1s-3-2.5-5 1"/>'),
  alerte: T('<path d="M12 3.5 2.5 20h19zM12 10v4.5M12 17.2v.3"/>'),
  flamme: T('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.6 2.8-5.4 3.8-9.3 1.9 1.9 2.9 3.4 3.3 5.4.8-1 1.3-2 1.5-3 1.9 2 2.9 4.2 2.9 6.9 0 3.6-1.2 6.2-5 6.2z"/>'),
  nuage: T('<path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 9.2 4.4 4.4 0 0 1 17 18z"/>'),
  goutte: T('<path d="M12 3.5c3 4 6 7.3 6 10.5a6 6 0 0 1-12 0c0-3.2 3-6.5 6-10.5z"/>'),
  note: T('<path d="M9 18V5.5l11-2v12.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
  etoile: T('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>'),
  chapeau: T('<path d="M2 9.5 12 5l10 4.5-10 4.5zM6 11.5v4.5c3.3 2.6 8.7 2.6 12 0v-4.5M22 9.5v5"/>'),
  portefeuille: T('<path d="M4 7.5h15a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5A1.5 1.5 0 0 1 5.5 5H17"/><path d="M15.5 13.5h4.5"/>'),
  outil: T('<path d="M14.7 6.3a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.7-7.7zM4 20l3-3"/>'),
  visage: T('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.3c1.9 2.1 5.1 2.1 7 0M9.2 9.5v.6M14.8 9.5v.6"/>'),
  arbre: T('<path d="M12 3 6.5 10.5h3L5.5 16.5h13l-4-6h3zM12 16.5V21"/>'),
  medaille: T('<circle cx="12" cy="14.5" r="5.5"/><path d="M9 3h6l-1.5 6.3M10.5 9.3 9 3"/>'),
  appareil: T('<path d="M3.5 8h3.3l1.9-2.8h6.6L17.2 8h3.3v11h-17z"/><circle cx="12" cy="13.3" r="3.4"/>'),
  sante: T('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4.5h6V7M12 10.5v6M9 13.5h6"/>'),
  eclair: T('<path d="M13 2.5 4.5 14h7l-1 7.5L19 10h-7z"/>'),
  ampoule: T('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>'),
  haut: T('<circle cx="12" cy="12" r="8.5"/><path d="M12 16V8.5M8.6 11.8 12 8.4l3.4 3.4"/>'),
  bas: T('<circle cx="12" cy="12" r="8.5"/><path d="M12 8v7.5M8.6 12.2l3.4 3.4 3.4-3.4"/>'),
  retour: T('<circle cx="12" cy="12" r="8.5"/><path d="M15.5 15v-2a3 3 0 0 0-3-3H8.5M11 7.5 8.5 10l2.5 2.5"/>'),
  rayures: T('<path d="M4 17c2-3 3-8 5-8s0 7 2 7 2-9 4-9 1 7 3 7 1.5-3 2-4"/>'),
  journal: T('<path d="M5 4h11v16H6.5A1.5 1.5 0 0 1 5 18.5zM16 8h3v10.5a1.5 1.5 0 0 1-3 0M8 8h5M8 11.5h5M8 15h3"/>'),
  ticket: T('<path d="M3.5 7.5h17v3a1.8 1.8 0 0 0 0 3.5v3h-17v-3a1.8 1.8 0 0 0 0-3.5zM14 7.5v10"/>'),
  vitesse: T('<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/>'),
  globe: T('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.4 5.4 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.4-3.4-8.5s1-6.1 3.4-8.5z"/>'),
  piles: T('<path d="m12 3.5 8.5 4.3-8.5 4.3-8.5-4.3zM3.5 12l8.5 4.3 8.5-4.3M3.5 16.2l8.5 4.3 8.5-4.3"/>'),
  rosette: T('<circle cx="12" cy="9.5" r="5.5"/><path d="m8.5 13.8-1.5 7 5-2.5 5 2.5-1.5-7"/>'),
  liste: T('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7.5 9h.5M7.5 12h.5M7.5 15h.5M10.5 9h6M10.5 12h6M10.5 15h6"/>'),
  trophee: T('<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0zM7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20h7l-.8-3h-5.4z"/>'),
  drapeau: T('<path d="M5 21V4M5 4h13l-2.5 4.5L18 13H5"/>'),
  epingle: T('<path d="M9 3.5h6l-1 5 3 3H7l3-3zM12 11.5V21"/>'),
  coche: T('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  verrou: icones.verrou,
};

/** Le dessin le plus proche d'un symbole SF du moteur. */
export function symbole(nom = "") {
  const regles = [
    [/^car|windshield|cone|road|tram|bicycle|sailboat|ferry|figure\.walk/, nom.startsWith("car") || nom.startsWith("windshield") ? icones.voiture : icones.carte],
    [/heart/, icones.coeur],
    [/cart|bag|tag|storefront|shippingbox/, SYMBOLES.sac],
    [/envelope/, SYMBOLES.enveloppe],
    [/doc|scroll/, icones.document],
    [/newspaper/, SYMBOLES.journal],
    [/person\.(2|3)|figure\.2/, icones.amis],
    [/person/, icones.personne],
    [/building\.columns/, SYMBOLES.colonnes],
    [/building/, SYMBOLES.immeuble],
    [/house/, icones.maison],
    [/gift/, SYMBOLES.cadeau],
    [/shield/, icones.bouclier],
    [/lock\.open/, icones.verrou],
    [/exclamationmark|lock|slash|xmark/, SYMBOLES.alerte],
    [/timer|clock|hourglass/, icones.focus],
    [/arrow\.up/, SYMBOLES.haut],
    [/arrow\.down/, SYMBOLES.bas],
    [/arrow\.uturn|arrow/, SYMBOLES.retour],
    [/flame/, SYMBOLES.flamme],
    [/cloud|snow|wind/, SYMBOLES.nuage],
    [/drop|water/, SYMBOLES.goutte],
    [/music|speaker|megaphone/, SYMBOLES.note],
    [/star|sparkles|seal|medal|rosette/, nom.includes("medal") ? SYMBOLES.medaille : SYMBOLES.etoile],
    [/graduationcap|book/, SYMBOLES.chapeau],
    [/wallet|creditcard|eurosign|percent|banknote/, nom.includes("eurosign") ? icones.euro : SYMBOLES.portefeuille],
    [/wrench|hammer|paintbrush|gearshape/, SYMBOLES.outil],
    [/face|mouth|hand|figure/, SYMBOLES.visage],
    [/tree|tent|leaf/, SYMBOLES.arbre],
    [/camera/, SYMBOLES.appareil],
    [/bandage|cross/, SYMBOLES.sante],
    [/bolt/, SYMBOLES.eclair],
    [/lightbulb/, SYMBOLES.ampoule],
    [/scribble|rectangle\.split/, SYMBOLES.rayures],
    [/ticket/, SYMBOLES.ticket],
    [/briefcase/, icones.banque],
    [/chart|trend/, icones.marches],
    [/speedometer/, SYMBOLES.vitesse],
    [/magnifyingglass|eye/, icones.info],
  ];
  for (const [re, svg] of regles) if (re.test(nom)) return svg;
  return SYMBOLES.etoile;
}
export { SYMBOLES };

// MARK: - Patrimoine (EcranPatrimoine)

const PERIODES = [["semaine", "1S", "sur 7 jours"], ["mois", "1M", "sur 30 jours"], ["saison", "Saison", "depuis le début de la saison"]];
let periode = "mois";
/** D403 (RNT-339) : la famille tracée (null : tout le patrimoine) et la saison passée en pointillés. */
let famille = null;
let saisonPassee = false;
/** 17/11 (Arthur : « au choix ») : une famille à la fois, ou plusieurs empilées sur la courbe du total. */
let empiler = false;
const empilees = new Set();
/** La courbe affichée, pour la lecture au doigt (pointeur). */
let lue = null;

/** Ce que CourbePatrimoine calcule à partir de ses valeurs et de ses dates. */
function lireCourbe(c) {
  const v = c.valeurs, n = v.length;
  const dates = c.dates?.length === n ? c.dates : null;
  const actuel = v[n - 1], plusHaut = Math.max(...v), plusBas = Math.min(...v);
  let parJour;
  if (dates) parJour = Math.round((actuel - v[0]) / Math.max(1, (dates[n - 1] - dates[0]) / 86_400_000));
  else parJour = Math.trunc((actuel - v[0]) / (n - 1));
  let abscisses;
  if (dates && dates[n - 1] > dates[0]) abscisses = dates.map((d) => (d - dates[0]) / (dates[n - 1] - dates[0]));
  else abscisses = v.map((_, i) => (n > 1 ? i / (n - 1) : 0));
  // D403 : la saison passée partage l'échelle de la courbe (CourbePatrimoine.hauteursFantome).
  const f = c.fantome ?? [];
  const bas = Math.min(plusBas, ...f), haut = Math.max(plusHaut, ...f);
  const ecart = haut - bas;
  const hauteurs = v.map((x) => (ecart > 0 ? (x - bas) / ecart : 0.5));
  const hauteursFantome = f.map((x) => (ecart > 0 ? (x - bas) / ecart : 0.5));
  return { ...c, dates, actuel, plusHaut, plusBas, parJour, abscisses, hauteurs, hauteursFantome };
}

/** 17/11 : les familles empilées, chacune à sa couleur, sur l'échelle commune avec le total (et posées dans le temps du total). */
function empile(c, series) {
  // 17/11 (Arthur) : pas de courbes en double — ni une famille vide (à plat sur le bas), ni une qui se confond avec le total,
  // ni deux familles identiques.
  const proche = (a, b) => Math.abs(a - b) <= Math.max(Math.abs(b) / 50, 100);
  const vues = new Set();
  const l = series.filter(([, s]) => {
    const v = s?.valeurs;
    if (!(v?.length > 1) || !v.some((x) => x !== 0)) return false;
    if (proche(v[0], c.valeurs[0]) && proche(v[v.length - 1], c.valeurs[c.valeurs.length - 1])) return false;
    const cle = v.join(",");
    if (vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });
  const toutes = [...c.valeurs, ...l.flatMap(([, s]) => s.valeurs)];
  const bas = Math.min(...toutes), haut = Math.max(...toutes);
  if (!(haut > bas)) return;
  const h = (v) => (v - bas) / (haut - bas);
  const t0 = c.dates?.[0], t1 = c.dates?.[c.dates.length - 1];
  c.hauteurs = c.valeurs.map(h);
  c.hauteursFantome = [];
  c.autres = l.map(([k, s]) => ({
    h: s.valeurs.map(h),
    x: t1 > t0 && s.dates?.length === s.valeurs.length ? s.dates.map((d) => Math.min(1, Math.max(0, (d - t0) / (t1 - t0)))) : null,
    couleur: NATURES[k][1],
  }));
}

/** « Aujourd'hui, 14:32 », « Hier, 09:10 », « Il y a 5 jours » (heure de Bruxelles). */
function libellePoint(c, i) {
  if (i == null) return "Patrimoine";
  const n = c.valeurs.length;
  i = Math.min(Math.max(0, i), n - 1);
  if (!c.dates) {
    const recul = n - 1 - i;
    return recul === 0 ? "Aujourd'hui" : recul === 1 ? "Hier" : `Il y a ${recul} jours`;
  }
  const jour = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
  const recul = Math.round((Date.parse(jour(c.dates[n - 1])) - Date.parse(jour(c.dates[i]))) / 86_400_000);
  const h = new Intl.DateTimeFormat("fr-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(c.dates[i]));
  return recul === 0 ? `Aujourd'hui, ${h}` : recul === 1 ? `Hier, ${h}` : `Il y a ${recul} jours`;
}

const H_COURBE = 190, MARGE = 14;
/** D403 : la courbe commune de ui.js (190 pt, marge 14), la saison passée en pointillés, lue au doigt. */
function courbePatrimoine(c) {
  return `<div id="courbe-patrimoine" role="img" aria-label="Courbe ${c.famille ? `de ${esc(NATURES[c.famille]?.[0] ?? "")}` : "du patrimoine"}, de ${montant(c.valeurs[0])} à ${montant(c.actuel)}">
    ${courbe(c.hauteurs, c.abscisses, { hauteur: H_COURBE, marge: MARGE, fantome: c.hauteursFantome, fantomeX: c.fantomeAbscisses, autres: c.autres ?? [],
      lecture: { id: "patrimoine", lire: (k) => lirePoint(k), lacher: () => lirePoint(null) } })}</div>`;
}

/** Le point lu (ou aucun) : le libellé, le chiffre héros et la variation (le trait et le point : ui.js). */
function lirePoint(i) {
  const c = lue;
  if (!c || !document.getElementById("courbe-patrimoine")) return;
  const val = i == null ? c.actuel : c.valeurs[i];
  const vari = val - c.valeurs[0];
  document.getElementById("patrimoine-libelle").textContent = i == null ? (c.famille ? NATURES[c.famille]?.[0] ?? "Patrimoine" : "Patrimoine") : libellePoint(c, i);
  document.getElementById("patrimoine-heros").innerHTML = heros(val, 50);
  const v = document.getElementById("patrimoine-variation");
  v.textContent = variation(vari);
  v.className = `chiffres ${couleurTon(vari)}`;
}

const stat = (titre, valeur) => `<div class="vi-x6"><div class="aide">${titre}</div>
  <div class="vi-x7 chiffres">${valeur}</div></div>`;

// MARK: - Plaisir (EcranPlaisir)

function anneauPlaisir(t) {
  const r = 100, c = 2 * Math.PI * r;
  const arc = (extra) => `<circle cx="115" cy="115" r="${r}" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round"
    stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${((1 - t.part) * c).toFixed(1)}" ${extra}/>`;
  return `<div role="img" aria-label="Jauge de plaisir, ${t.jauge} sur 100, ${t.burnout ? "burnout" : esc(t.etat)}" class="vi-x8">
    <svg viewBox="0 0 230 230" class="vi-x9" aria-hidden="true">
      <defs><filter id="lueur-plaisir" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <circle cx="115" cy="115" r="${r}" fill="none" stroke="var(--puce2)" stroke-width="10"/>
      ${arc('filter="url(#lueur-plaisir)" opacity=".5"')}
      ${arc('class="arc-plaisir"')}
    </svg>
    <div class="vi-x10">
      <div class="vi-x11 chiffres">${t.jauge}</div>
      <div class="vi-x12 ${t.burnout ? "alerte" : "t2"}">${t.burnout ? "Burnout" : esc(t.etat)}</div>
    </div>
  </div>`;
}

const TONS = { or: "or", gain: "gain", perte: "perte", neutre: "t2" };
const ton = (t) => TONS[Object.keys(t ?? {})[0]] ?? "t2";

// MARK: - Répartition (EcranRepartition)

/** Les natures du patrimoine, leurs noms et leurs couleurs fixes (PartRepartition.Nature). */
export const NATURES = {
  liquidites: ["Liquidités", "#6CC7EC"],
  bourse: ["Bourse", "#4F9BE8"],
  immobilier: ["Immobilier", "#9D8CFF"],
  entreprises: ["Entreprises", "#FFB547"],
  vehicules: ["Véhicules", "#FF8A65"],
  montres: ["Montres", "#E8C77A"],
};

/** D358 : la barre détaillée de l'accueil (D347, BarreRepartitionDetaillee) : la barre, puis chaque part en légende. */
function barreRepartition(parts) {
  const l = [...(parts ?? [])].filter((p) => p.montant > 0).sort((x, y) => y.montant - x.montant);
  if (!l.length) return "";
  const pc = (x) => (x < 0.01 ? "< 1 %" : `${Math.round(x * 100)} %`);
  const c = (p) => NATURES[p.nature]?.[1] ?? "var(--texte3)";
  return `<div class="ac-repartition">
    <div class="ac-rep-barre" role="img" aria-label="${esc(l.map((p) => `${NATURES[p.nature]?.[0] ?? p.nature} ${pc(p.part)}`).join(", "))}">
      ${l.map((p) => `<i style="--c:${c(p)};--part:${p.part.toFixed(4)}"></i>`).join("")}</div>
    <div class="ac-rep-legende">${l.map((p) => `<span class="ac-rep-part"><span class="ac-rep-point" style="--c:${c(p)}"></span>
      <span class="ac-rep-nom">${esc(NATURES[p.nature]?.[0] ?? p.nature)}</span><span class="ac-rep-val chiffres">${montant(p.montant)}</span><span class="ac-rep-pct chiffres">${pc(p.part)}</span></span>`).join("")}</div>
  </div>`;
}

// MARK: - Objectif (EcranObjectif)

/** La photo de l'objectif : sur le web, la silhouette sur la teinte de série (PhotoObjectif sans photo). */
export function photoObjectif(o) {
  const teinte = o.teinte || "#3a3d45";
  return `<div style="height:220px;border-radius:24px;border:1px solid var(--filet2);overflow:hidden;position:relative;margin-top:8px;
      background:radial-gradient(120% 90% at 30% 10%, color-mix(in srgb, ${teinte} 70%, #fff 10%), ${teinte} 45%, color-mix(in srgb, ${teinte} 40%, #000) 100%)">
    <svg viewBox="0 0 240 110" class="vi-x14" aria-hidden="true">
      ${silhouette(o.silhouette)}
    </svg>
    <div class="vi-x15"></div>
  </div>`;
}

/** Une silhouette par famille de véhicules : deux-roues, bateau, aéronef, ou voiture. */
export function silhouette(forme = "") {
  const trait = 'fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linejoin="round"';
  const roue = (x, r = 15) => `<circle cx="${x}" cy="${100 - r}" r="${r}" fill="#111" stroke="rgba(255,255,255,.6)" stroke-width="3"/><circle cx="${x}" cy="${100 - r}" r="${r / 3}" fill="rgba(255,255,255,.5)"/>`;
  if (/moto|scooter|velo|trottinette/.test(forme)) return `
    <path d="M62 82 96 50h34l14-14h22l-8 12 24 34M96 50l18 32h30M130 50l-8-16h-20" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M100 48c10-10 28-12 44-6l-6 10H104z" ${trait}/>${roue(62, 20)}${roue(182, 20)}`;
  if (/bateau|voilier|yacht/.test(forme)) return `
    <path d="M20 70h200l-26 28H44z" ${trait}/><path d="M70 70V48h70l24 22" ${trait}/><path d="M86 56h16M112 56h16" stroke="rgba(255,255,255,.5)" stroke-width="3" stroke-linecap="round"/>
    <path d="M10 104c20-6 40 6 60 0s40 6 60 0 40 6 60 0 30 4 40 0" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>`;
  if (/jet|avion|helico/.test(forme)) return `
    <path d="M20 62c0-8 10-12 24-12h130c18 0 36 6 46 12-10 6-28 12-46 12H44c-14 0-24-4-24-12z" ${trait}/>
    <path d="M110 58 84 24h18l38 34zM110 66 84 100h18l38-34zM28 56l-8-24h12l18 22" ${trait}/>
    <path d="M176 56h8M160 56h8M144 56h8" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-linecap="round"/>`;
  return `
    <path d="M14 78c0-10 6-16 18-18l34-6 26-22c6-5 13-7 21-7h46c9 0 16 3 22 9l20 20 20 3c10 2 15 8 15 17v6c0 4-3 6-6 6H20c-4 0-6-3-6-6z" ${trait}/>
    <path d="M86 52 104 34c4-4 8-5 13-5h20v23zM145 29h16c6 0 10 2 14 6l16 17h-46z" fill="rgba(255,255,255,.22)"/>${roue(62)}${roue(184)}`;
}

// MARK: - Activité (EcranActivite)

const NATURE_MOUVEMENT = {
  gagne: { nom: "Gagné", couleur: "var(--gain)", symbole: '<path d="M17 7 7 17M7 9v8h8"/>' },
  depense: { nom: "Dépensé", couleur: "var(--perte)", symbole: '<path d="M7 17 17 7M9 7h8v8"/>' },
  investi: { nom: "Investi", couleur: "var(--courbe)", symbole: '<path d="M4 9h15l-3.5-3.5M20 15H5l3.5 3.5"/>' },
};
const mini = (d, taille, epaisseur = 3) => `<svg viewBox="0 0 24 24" width="${taille}" height="${taille}" fill="none" stroke="currentColor" stroke-width="${epaisseur}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

function resumeNatures(j) {
  const el = (cle, m) => {
    if (!(m > 0)) return "";
    const n = NATURE_MOUVEMENT[cle];
    return `<span class="vi-x16 rangee"><span style="color:${n.couleur};display:grid">${mini(n.symbole, 10)}</span>
      <span class="vi-x17 chiffres">${n.nom} ${montant(m)}</span></span>`;
  };
  const contenu = el("gagne", j.gagne) + el("depense", j.depense) + el("investi", j.investi);
  return contenu ? `<div class="vi-x18 rangee">${contenu}</div>` : `<div class="vi-x19"></div>`;
}

function ligneMouvement(l) {
  const n = NATURE_MOUVEMENT[l.nature];
  const couleur = n?.couleur ?? "var(--texte2)";
  const badge = n ? `<span style="position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;border-radius:50%;background:${n.couleur};color:var(--fond);display:grid;place-items:center;box-shadow:0 0 0 1.5px var(--fond)">${mini(n.symbole, 9, 3.4)}</span>` : "";
  return `${filet()}
    <div class="vi-x20 rangee">
      <span style="position:relative;flex:none;width:34px;height:34px;border-radius:50%;background:var(--puce2);color:${couleur};display:grid;place-items:center">
        <span class="vi-x21">${symbole(l.icone)}</span>${badge}</span>
      <div class="vi-x6">
        <div class="vi-x22">${esc(l.titre)}</div>
        <div class="vi-x23 aide">${esc(l.detail ? `${l.detail}, ${l.heure}` : l.heure)}</div>
      </div>
      ${l.montant != null ? `<span class="chiffres" style="font-size:15px;letter-spacing:-0.02em;white-space:nowrap;color:${n ? n.couleur : "var(--texte)"}">${variation(l.montant)}</span>` : ""}
    </div>`;
}

// MARK: - Événements (EcranEvenements, CarteEvenement)

const COULEUR_TON = { positif: "var(--gain)", negatif: "var(--perte)", neutre: "var(--or)" };
const aDecider = (e) => !e.resolu && (e.choix.length > 0 || e.modele === "controle");
/** RNT-174 : le choix appliqué sans réponse, le prudent (EvenementJeu.indiceSansReponse). */
const sansReponse = (e) => (e.choix.length ? e.choix[Math.min(Math.max(0, e.prudent ?? e.choix.length - 1), e.choix.length - 1)] : null);

/** « 1:05:09 » jusqu'à une échéance (Text(timerInterval:countsDown:)). */
function rebours(fin, maintenant) {
  const s = Math.max(0, Math.round((fin - maintenant) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`;
}

function carteEvenement(e, maintenant) {
  const couleur = COULEUR_TON[e.ton] ?? "var(--or)";
  let bas = "";
  if (e.modele === "controle" && !e.resolu && e.echeance) {
    bas = `<div class="vi-x24 rangee">
      <span class="aide">Passage dans</span>
      <span class="vi-x25 chiffres alerte" data-rebours="${e.echeance}">${rebours(e.echeance, maintenant)}</span>
      <span class="espace"></span>
      ${e.corruption === false ? `<span class="vi-x26 alerte">Pris : amende lourde, le contrôle passe quand même</span>`
        : e.protection != null
        ? `<span class="vi-x27 rangee gain"><span class="vi-x28">${icones.bouclier}</span>En règle à ${Math.round(e.protection * 100)} %</span>`
        : e.corruption === true ? `<span class="vi-x27 rangee gain">Inspecteur arrangé</span>`
        : `${petit(`Se mettre en règle, ${montant(e.coutRegle ?? 0)}`, "seMettreEnRegle", { plein: true, donnees: { id: e.id } })}${e.potDeVin != null ? petit(`Arranger l'inspecteur, ${montant(e.potDeVin)}`, "soudoyer", { donnees: { id: e.id } }) : ""}`}
    </div>`;
  } else if (!e.resolu && e.choix.length) {
    bas = `<div class="vi-x29">
      ${e.choix.map((c, k) => `<button class="vi-x30 petit ${k === 0 ? "plein" : ""}" data-action="choisirEvenement" data-id="${e.id}" data-choix="${k}">
        <span>${esc(c.libelle)}</span>${c.cout > 0 ? `<span class="vi-x31 chiffres">${montant(c.cout)}</span>` : ""}</button>`).join("")}
      ${sansReponse(e) ? `<div class="aide">Sans réponse ce soir : « ${esc(sansReponse(e).libelle)} », le choix prudent.</div>` : ""}
    </div>`;
  } else if (e.resultat) {
    bas = `<div style="font-size:13px;font-weight:500;color:${couleur}">${esc(e.resultat)}</div>`;
  }
  return carte(`
    <div class="vi-x32 rangee">
      <span style="flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;color:${couleur};background:color-mix(in srgb, ${couleur} 14%, transparent)">
        <span class="vi-x33">${symbole(e.icone)}</span></span>
      <div class="vi-x6">
        <div class="vi-x34 rangee entre"><span class="vi-x12">${esc(e.titre)}</span>
          <span class="vi-x35">${heure(e.date)}</span></div>
        <div class="vi-x36 aide">${esc(e.texte)}</div>
        ${e.annonce && !e.resolu ? `<div class="vi-x37 rangee alerte"><span class="vi-x38">${SYMBOLES.alerte}</span>Pour demain</div>` : ""}
      </div>
    </div>
    ${bas ? `<div class="vi-x39">${bas}</div>` : ""}`, { pad: true, attrs: `style="opacity:${e.resolu && e.lu ? 0.85 : 1}" data-evenement="${e.id}"` });
}

// MARK: - Les pages

export const pages = {
  patrimoine: {
    css: ["vie", "accueil"], // D358 : la barre détaillée de l'accueil ; : css/pages/vie.css, pour toutes les pages de ce fichier
    titre: "Patrimoine",
    async donnees(ctx) {
      const f = empiler ? null : famille;
      const c = await ctx.tableau("courbe", { periode, ...(f ? { famille: f } : {}), saisonPassee: saisonPassee && !f && !empiler });
      if (!c) return { c: null };
      if (c.empilable === false && empiler) { empiler = false; empilees.clear(); return pages.patrimoine.donnees(ctx); } // D414
      const lu = lireCourbe(c);
      if (empiler && empilees.size) empile(lu, await Promise.all(Object.keys(NATURES).filter((k) => empilees.has(k))
        .map(async (k) => [k, await ctx.tableau("courbe", { periode, famille: k, saisonPassee: false })])));
      return { c: lu };
    },
    rendu(d) {
      if (!d.c) { lue = null; return `${entetePousse("Patrimoine")}${ecranVide("Le patrimoine apparaît avec ta première saison.")}`; }
      const c = d.c;
      lue = c;
      const suffixe = PERIODES.find((p) => p[0] === c.periode)?.[2] ?? "";
      const vari = c.actuel - c.valeurs[0];
      return `
      ${entetePousse("Patrimoine")}
      <div class="vi-x40">
        <div id="patrimoine-libelle" class="vi-x41">${esc(c.famille ? NATURES[c.famille]?.[0] ?? "Patrimoine" : "Patrimoine")}</div>
        <div id="patrimoine-heros" class="vi-x42">${heros(c.actuel, 50)}</div>
        <div class="vi-x43 rangee">
          <span id="patrimoine-variation" class="chiffres ${couleurTon(vari)}">${variation(vari)}</span><span class="t2">${suffixe}</span>
        </div>
      </div>
      <div class="vi-x44">
        ${c.suffisante ? courbePatrimoine(c)
          : `<div style="height:${H_COURBE}px;display:grid;place-items:center;text-align:center;padding:0 26px" class="aide">${c.famille ? "La courbe de cette famille se dessine jour après jour : chaque jour clos en ajoute un point." : "Pas encore assez de points sur cette période. Chaque salaire, achat ou revenu en ajoute un."}</div>`}
      </div>
      <div class="vi-x45 choix" role="group" aria-label="Période">
        ${PERIODES.map(([v, t]) => `<button class="petit ${v === c.periode ? "plein" : ""}" data-action="periode" data-valeur="${v}" aria-pressed="${v === c.periode}">${t}</button>`).join("")}
      </div>
      <div class="choix vi-familles" role="group" aria-label="Famille">
        ${[...(empiler ? [] : [[null, "Tout"]]), ...Object.entries(NATURES).map(([k, [nom]]) => [k, nom])].map(([k, t]) => {
          const choisie = empiler ? empilees.has(k) : k === (c.famille ?? null);
          return `<button class="petit ${choisie ? "plein" : ""}" data-action="famille" data-valeur="${k ?? ""}" aria-pressed="${choisie}">${esc(t)}</button>`;
        }).join("")}
      </div>
      ${c.empilable === false ? "" /* D414 : coupé par l'admin */ : `<button class="vi-passee ${empiler ? "actif" : ""}" data-action="empiler" aria-pressed="${empiler}">
        <span>Empiler les familles sur le total</span><span class="vi-interrupteur" aria-hidden="true"></span></button>`}
      ${!c.famille && !empiler && c.saisonPasseeConnue ? `<button class="vi-passee ${saisonPassee ? "actif" : ""}" data-action="saisonPassee" aria-pressed="${saisonPassee}">
        <i class="vi-tirets" aria-hidden="true"></i><span>${esc(c.fantomeNom ? `${c.fantomeNom}, au même jour` : "La saison passée, au même jour")}</span>
        <span class="vi-interrupteur" aria-hidden="true"></span></button>` : ""}
      ${carte(`<div class="vi-x46 rangee">
        ${stat("Plus haut", montant(c.plusHaut))}${stat("Plus bas", montant(c.plusBas))}${stat("Par jour", variation(c.parJour))}</div>`, { pad: true })}`;
    },
    actions: {
      async periode(ctx, b) { periode = b.dataset.valeur; await ctx.rafraichir(); },
      async famille(ctx, b) {
        const k = b.dataset.valeur || null;
        if (empiler) { if (empilees.has(k)) empilees.delete(k); else empilees.add(k); } else famille = k;
        await ctx.rafraichir();
      },
      async empiler(ctx) {
        empiler = !empiler;
        if (empiler) { empilees.clear(); if (famille) empilees.add(famille); famille = null; saisonPassee = false; }
        await ctx.rafraichir();
      },
      async saisonPassee(ctx) { saisonPassee = !saisonPassee; await ctx.rafraichir(); },
    },
  },

  plaisir: {
    titre: "Jauge de plaisir",
    async donnees(ctx) { return { t: await ctx.tableau("plaisir") }; },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Jauge de plaisir")}${ecranVide("La jauge apparaît avec ta première saison.")}`;
      const humeurs = [...t.humeurs].reverse();
      return `
      ${entetePousse("Jauge de plaisir")}
      <div class="vi-x47 pile">
        ${anneauPlaisir(t)}
        <p class="vi-x48">Les sessions tenues te gardent en forme ; un échec coûte 3 points, puis 5, puis 8 dans la semaine. Ton niveau de vie réel compte le dimanche, sauf les jours de congé ; à la rue, chaque nuit coûte.</p>
        ${carte(t.effets.map((e) => ligne({ titre: esc(e.libelle), valeur: esc(e.valeur), couleurValeur: ton(e.ton) })).join(""))}
        ${carteGivree(`
          ${libelle("Ce que ton humeur fait à tes gains", "padding:14px 16px 6px")}
          ${humeurs.map((h) => `<div class="rangee" style="gap:12px;padding:10px 16px;${h.actuelle ? "background:rgba(255,255,255,.04)" : ""}" ${h.actuelle ? 'aria-current="true"' : ""}>
            <i style="width:8px;height:8px;border-radius:50%;flex:none;background:${h.actuelle ? "var(--accent)" : "var(--puce2)"}"></i>
            <span style="font-size:15px;font-weight:${h.actuelle ? 600 : 400};color:${h.actuelle ? "var(--texte)" : "var(--texte2)"}">${esc(h.nom)}</span>
            <span class="vi-x49">dès ${h.depuis}</span>
            <span class="espace"></span>
            <span class="chiffres ${h.multiplicateur > 1 ? "gain" : h.multiplicateur < 1 ? "perte" : "t2"}" class="vi-x50">×${h.multiplicateur.toFixed(2).replace(".", ",")}</span>
          </div>`).join("")}
          <div class="vi-x51 aide">Salaire du focus, production et ventes de tes boîtes. Au burnout, tout est en plus divisé par deux.</div>`)}
        ${bouton("Voir mon train de vie", "", { page: "trainDeVie" })}
      </div>`;
    },
  },

  // RNT-190 : la page Train de vie (le bilan de la semaine) et les abonnements sont dans trainvie.js.

  repartition: {
    titre: "Où est ton argent",
    async donnees(ctx) { return { r: await ctx.tableau("repartition") }; },
    rendu(d) {
      const r = d.r;
      if (!r) return `${entetePousse("Où est ton argent")}${ecranVide("La répartition apparaît avec ta première saison.")}`;
      return `
      ${entetePousse("Où est ton argent")}
      <div class="vi-x52 pile">
        <div class="vi-x53 chiffres" aria-label="Patrimoine, ${montant(r.patrimoine)}">${montant(r.patrimoine)}</div>
        ${carteGivree(`<div class="vi-rep">${barreRepartition(r.parts)}</div>`)}
        ${carteGivree(`
          <div class="vi-x54 rangee">
            <i class="vi-x57"></i>
            <div class="vi-x55 libelle">Dettes</div>
            <span class="vi-x56 chiffres ${r.dettes > 0 ? "perte" : "t2"}">${montant(-r.dettes)}</span>
          </div>`)}
      </div>`;
    },
  },

  // RNT-175 : la page Objectifs (trois buts) est dans objectifs.js.

  activite: {
    titre: "Activité",
    async donnees(ctx) { return { a: await ctx.tableau("activite") }; },
    rendu(d) {
      const jours = d.a?.jours ?? [];
      if (!jours.length) return `${entetePousse("Activité")}${ecranVide("Rien encore. Les salaires, la production et les sanctions s'inscrivent ici.")}`;
      return `
      ${entetePousse("Activité")}
      ${carte(jours.map((j) => `
        <div class="vi-x58 rangee entre" role="heading" aria-level="2">
          <span class="vi-x59">${esc(j.titre)}</span>
          <span class="vi-x60 chiffres ${couleurTon(j.variation)}" aria-label="Patrimoine ${variation(j.variation)}">${variation(j.variation)}</span>
        </div>
        ${resumeNatures(j)}
        ${j.lignes.map(ligneMouvement).join("")}`).join(""), { attrs: 'style="padding:0 16px 8px"' })}`;
    },
  },

  // RNT-211 : la cloche de l'accueil ouvre les notifications de Grind : ce qui attend ta réponse en tête (Accepter,
  // Refuser, ou Voir), puis les événements du jour, puis l'historique (répondu, expiré, les avis).
  evenements: {
    titre: "Notifications",
    css: "notifications",
    async donnees(ctx) {
      const [t, n, b] = await Promise.all([ctx.tableau("evenements"), L.etatDemandes(ctx), ctx.tableau("banque")]);
      // Ouvrir l'écran, c'est les avoir vus (comme le .task de l'iPhone, après l'affichage) : les avis gardent
      // leur point cette fois-ci, la pastille de la cloche tombe.
      if (t?.enAttente > 0) await ctx.jouer("decider", { famille: "evenements", operation: { toutLu: {} } }, { silencieux: true });
      if (n?.historique?.some((x) => x.nonLu)) await ctx.jouer("notifications.lues", {}, { silencieux: true });
      return { t, n, aPayer: b?.aPayer ?? [] };
    },
    rendu(d, ctx) {
      const liste = d.t?.arrives ?? [];
      const demandes = d.n?.enAttente ?? [], passe = d.n?.historique ?? [];
      const t = ctx.maintenant();
      const aPayer = d.aPayer ?? [];
      if (!liste.length && !demandes.length && !passe.length && !aPayer.length) {
        return `${entetePousse("Notifications")}${ecranVide("Rien pour l'instant. Les invitations, les demandes d'ami et les propositions des joueurs arrivent ici, avec un à trois événements par jour.")}`;
      }
      const decider = liste.filter(aDecider), reste = liste.filter((e) => !aDecider(e));
      return `
      ${entetePousse("Notifications")}
      <div class="vi-x61 pile">
        ${sectionAPayer(aPayer)}
        ${demandes.length ? `${libelle(`À répondre · ${demandes.length}`)}<div class="nt-attente">${demandes.map((x) => carteDemande(x, t)).join("")}</div>` : ""}
        ${liste.length ? carte(ligne({ titre: "Assurances", detail: "Qui paie quand un sinistre arrive", page: "assurances" })) : ""}
        ${decider.length ? `${libelle("À décider", demandes.length ? "margin-top:8px" : "")}${decider.map((e) => carteEvenement(e, t)).join("")}` : ""}
        ${reste.length ? `${libelle("Au fil des jours", decider.length || demandes.length ? "margin-top:8px" : "")}${reste.map((e) => carteEvenement(e, t)).join("")}` : ""}
        ${historique(passe, t)}
      </div>`;
    },
    tic(ctx) {
      document.querySelectorAll("[data-rebours]").forEach((el) => { el.textContent = rebours(Number(el.dataset.rebours), ctx.maintenant()); });
      document.querySelectorAll(".nt-expire[data-expire]").forEach((el) => { el.textContent = restant(Number(el.dataset.expire), ctx.maintenant()); });
    },
    actions: {
      async choisirEvenement(ctx, b) {
        await ctx.decider("evenements", { choisir: { evenement: Number(b.dataset.id), choix: Number(b.dataset.choix) } });
      },
      // RNT-219 : une facture se paie d'ici aussi, par la fenêtre de paiement.
      payerFacture: (ctx, el) => ctx.decider("banque", { payerFacture: { _0: Number(el.dataset.facture) } }, { succes: `${el.dataset.libelle} : payé`, fermer: false }),
      async seMettreEnRegle(ctx, b) {
        await ctx.decider("evenements", { seMettreEnRegle: { evenement: Number(b.dataset.id) } }, { succes: "En règle avant le contrôle" });
      },
      // RNT-294 : arranger l'inspecteur, une combine risquée.
      async soudoyer(ctx, b) {
        await ctx.decider("evenements", { soudoyer: { evenement: Number(b.dataset.id) } }, { succes: "Enveloppe glissée" });
      },
      // RNT-211 : répondre d'ici ; la demande passe dans l'historique, la pastille baisse.
      async repondreDemande(ctx, b, d) {
        const x = (d.n?.enAttente ?? []).find((y) => y.id === b.dataset.id);
        if (!x) return;
        const oui = b.dataset.oui === "1";
        b.disabled = true;
        const r = await L.repondreDemande(ctx, x, oui);
        if (r === "voir") return L.ouvrirCible(ctx, x.cible);
        if (r && r !== "annule") ctx.toast(r, "refus");
        else if (!r && x.genre !== "repas" && x.genre !== "soiree") ctx.toast(oui ? "Accepté" : "Refusé", oui ? "gain" : "");
        await ctx.rafraichir();
      },
      voirDemande(ctx, b, d) {
        const x = (d.n?.enAttente ?? []).find((y) => y.id === b.dataset.id);
        if (x) L.ouvrirCible(ctx, x.cible);
      },
      voirHistorique(ctx, b, d) {
        const x = (d.n?.historique ?? []).find((y) => y.id === b.dataset.id);
        if (x?.cible) L.ouvrirCible(ctx, x.cible);
      },
    },
  },
};
