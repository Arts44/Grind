// ══════════════════════════════════════════════════════════════════════
//  Onglet Banque (EcransBanque.swift, FeuilleVersements.swift,
//  EcranAssurances.swift, EcranImpots.swift, Design/ObjetsBanque.swift).
//
//  Un portefeuille façon Cartes (Wallet) : les comptes sont des cartes
//  empilées, le liquide un portefeuille en cuir. Toucher une carte la sort
//  de la pile, ses gestes apparaissent dessous. Sous la pile : les contrats
//  de prêt sur papier, la police d'assurance, l'avis d'imposition, les congés.
//
//  Pages : « banque » (racine), « banque.credit », « banque.assurances »
//  (alias « assurances »), « banque.impots ». Feuilles : virement, ouvrir
//  un compte, style de carte, versements, remboursement, aide.
//
//  Le moteur décide de tout (TableauBanque, TableauAssurances,
//  TableauImpots) ; ici on ne fait que dessiner et mettre en forme.
// ══════════════════════════════════════════════════════════════════════
import { montant, variation, esc } from "../format.js";
import { enteteRacine, entetePousse, bouton, petit, icones, segment, colonnes, boutonAide } from "../ui.js";
import { panneauPortefeuille, actionsCoffre } from "./manger.js";
import { carteBilanVie } from "./trainvie.js";

// MARK: Outils de mise en forme

const RAPPORT = 1.586; // format ISO des cartes : 85,6 × 54 mm
const BANDE = 70; // ce qui dépasse d'une carte rangée sous la suivante
const euros = (c) => montant(c);
const eurosC = (c) => montant(c, { centimes: true });
/** Montant.pourcentage(x, decimales, signe: false) : « 6,50 % ». */
const pct = (x, d = 0) => `${((x ?? 0) * 100).toFixed(d).replace(".", ",")} %`;
/** Avec signe : « +0,3 % », « −1,0 % ». */
const pctSigne = (x, d = 1) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${pct(Math.abs(x), d)}`;
/** Les pourcentages de la page Impôts : sans décimale s'ils tombent rond. */
const pctImpot = (x) => pct(x, Math.abs(x * 100 - Math.round(x * 100)) < 1e-9 ? 0 : 1);
const heure = (ms) => new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };

/** RefCompte → clé de carte (« principal », « c3 », « liquide »), comme TableauBanque.Carte.id. */
const idRef = (ref) => ("principal" in ref ? "principal" : "liquide" in ref ? "liquide" : `c${ref.compte._0}`);
const refId = (id, t) => (id === "liquide" ? { liquide: {} } : t.cartes.find((c) => idRef(c.ref) === id)?.ref ?? { principal: {} });
const soldeDe = (id, t) => (id === "liquide" ? Math.max(0, t.liquide) : Math.max(0, t.cartes.find((c) => idRef(c.ref) === id)?.solde ?? 0));
/** « Épargne », « Portefeuille »… ; la banque seulement si deux comptes portent le même nom. */
function nomCourt(id, t) {
  const c = t.cartes.find((x) => idRef(x.ref) === id);
  if (id === "liquide" || !c) return "Portefeuille";
  return t.cartes.filter((x) => x.nom === c.nom).length > 1 ? `${c.nom}, ${c.banqueNom}` : c.nom;
}
const liquidites = (t) => t.cartes.reduce((s, c) => s + c.solde, 0) + t.liquide;

// Icônes locales (traits, 24 × 24), en complément de ui.js.
const I = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ic = {
  crayon: I('<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>'),
  pinceau: I('<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="11" cy="7.5" r="1.1"/><circle cx="15.5" cy="8.5" r="1.1"/>'),
  enHaut: I('<path d="M5 4h14M12 20V9M7 13l5-5 5 5"/>'),
  monter: I('<path d="M12 19V6M6 11l6-6 6 6"/>'),
  descendre: I('<path d="M12 5v13M6 13l6 6 6-6"/>'),
  enBas: I('<path d="M5 20h14M12 4v11M7 11l5 5 5-5"/>'),
  croix: I('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
  aide: I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 17v.3"/>'),
  aiguillage: I('<path d="M6 20V9a5 5 0 0 1 5-5h7M15 1l3 3-3 3M6 13a5 5 0 0 0 5 5h7M15 15l3 3-3 3"/>'),
  plus: icones.plus,
  fleches: I('<path d="M4 8h15l-4-4M20 16H5l4 4"/>'),
  fleche: I('<path d="M4 12h15M14 7l5 5-5 5"/>'),
  flocon: I('<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5"/>'),
  signature: I('<path d="M3 17c3-1 4-6 6-6s-1 7 2 7 3-5 5-5 1 3 3 3M3 21h18"/>'),
  coche: I('<path d="M5 12.5 10 17l9-10"/>', 'stroke-width="2.6"'),
  cadenas: I('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  feuille: I('<path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7"/>'),
  sansContact: I('<path d="M8 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M15 3.5a12 12 0 0 1 0 17"/>'),
  minuteur: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>'),
  camembert: icones.camembert,
  maison: icones.maison,
  etiquette: I('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>'),
  courbe: icones.marches,
  boites: I('<path d="M4 21V9l5-3v15M9 21V4l11 4v13M3 21h18M13 11h3M13 15h3"/>'),
  coeur: icones.coeur,
  engrenages: I('<circle cx="9" cy="9" r="3"/><path d="M9 3v2M9 13v2M3 9h2M13 9h2M4.8 4.8l1.4 1.4M11.8 11.8l1.4 1.4M4.8 13.2l1.4-1.4M11.8 6.2l1.4-1.4"/><circle cx="17" cy="17" r="2.2"/><path d="M17 13.5v1.3M17 19.2v1.3M13.5 17h1.3M19.2 17h1.3"/>'),
  plateau: I('<path d="M3 13h5l1.5 3h5L16 13h5v6H3zM12 3v8M8.5 7.5 12 11l3.5-3.5"/>'),
  horloge: I('<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3 3v4h4M12 8v4l3 2"/>'),
  personne: icones.personne,
  bouclier: icones.bouclier,
  document: icones.document,
  parasol: I('<path d="M3 12a9 9 0 0 1 18 0zM12 12v8a2 2 0 0 0 4 0"/>'),
  carte: I('<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M3 9.5h18"/>'),
  colonnes: I('<path d="M3 9.5 12 4l9 5.5zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>'),
  chevron: icones.chevron,
};

// MARK: Styles de carte (StyleCarte, ObjetsBanque.swift) — cosmétique, côté app

/** id → [nom, couleurs du dégradé, motif, mate, encre claire (texte foncé)]. */
const STYLES = {
  minuit: ["Minuit", ["#1B1D2A", "#05060A"], "points"], argent: ["Argent brossé", ["#E4E6EA", "#9DA2AB"], "diagonales", 0, 1],
  ocean: ["Océan", ["#1B6FA8", "#062338"], "vagues"], aurore: ["Aurore", ["#3BE3B0", "#4F6BFF", "#9B3BE3"], "rayons"],
  holo: ["Holographique", ["#BFD7FF", "#E8C2FF", "#C2FFE8", "#FFE3B8"], "cercles", 0, 1], neon: ["Néon", ["#FF2E93", "#1A0B2E"], "chevrons"],
  foret: ["Forêt", ["#2F6B4F", "#0B2017"], "guilloche"], carbone: ["Carbone", ["#2A2B2E", "#0E0F10"], "damier", 1],
  givre: ["Givre", ["#EAF4F7", "#A9C6D1"], "points", 0, 1], or: ["Or", ["#F1D58A", "#B8893A"], "guilloche", 0, 1],
  onyx: ["Onyx", ["#111111", "#000000"], "aucun", 1], rose: ["Or rose", ["#F3C9B8", "#C4877A"], "cercles", 0, 1],
  patriote: ["Stars & Stripes", ["#1F3A7A", "#B22234"], "chevrons"], acier: ["Acier", ["#6E7681", "#2B3036"], "diagonales"],
  coucher: ["Coucher de soleil", ["#FFB347", "#E2495B", "#5B2A86"], "rayons"], sable: ["Sable", ["#EAD9B5", "#C2A06B"], "points", 0, 1],
  platine: ["Platine", ["#F4F4F2", "#C9CACC"], "guilloche", 0, 1], encre: ["Encre de Chine", ["#14213D", "#050A14"], "chevrons"],
  sakura: ["Sakura", ["#FFD6E0", "#F2A1B8"], "points", 0, 1], washi: ["Washi", ["#F5EFE3", "#DCCFB4"], "cercles", 1, 1],
  sumi: ["Sumi", ["#2B2B2B", "#111111"], "rayons", 1], lagon: ["Lagon", ["#3CD3C7", "#0E6E7A"], "vagues"],
  nacre: ["Nacre", ["#F7F3EE", "#D8E4F0", "#F0DCEB"], "cercles", 0, 1], corail: ["Corail", ["#FF8C6B", "#C2414B"], "points"],
  bordeaux: ["Bordeaux", ["#7A1F33", "#2E0A12"], "diagonales"], champagne: ["Champagne", ["#F5E6C8", "#D2B98A"], "points", 0, 1],
  marine: ["Bleu marine", ["#1F2F5C", "#0A1128"], "chevrons"], emeraude: ["Émeraude", ["#1E8C5A", "#063A22"], "cercles"],
  terracotta: ["Terre cuite", ["#D27450", "#7A3018"], "damier", 1], jade: ["Jade", ["#6FC2A4", "#1F6B53"], "vagues", 0, 1],
  lavande: ["Lavande", ["#C9B8F2", "#7D67C2"], "rayons", 0, 1], cuivre: ["Cuivre", ["#E09A6B", "#8A4A24"], "diagonales"],
  ivoire: ["Ivoire", ["#FAF6EC", "#E2D9C3"], "guilloche", 0, 1], graphite: ["Graphite", ["#4A4F58", "#1C1F24"], "damier", 1],
  saphir: ["Saphir", ["#2E5BBA", "#0D2058"], "cercles"], rubis: ["Rubis", ["#D3213F", "#5E0717"], "rayons"],
  metal: ["Métal", ["#8E9097", "#3D3F45", "#6C6E74"], "diagonales"], noire: ["Noire", ["#1A1A1D", "#050506", "#2B2B30"], "aucun", 1],
  orMassif: ["Or massif", ["#E9CF8A", "#9C7A35", "#D9B866"], "guilloche", 0, 1], diamant: ["Diamant", ["#F1F3F6", "#BFD7FF", "#A9AFB8", "#F0E6FF"], "rayons", 0, 1],
};
/** Les finitions proposées par une banque, dans son esprit. */
const STYLES_BANQUE = {
  meuse: "minuit argent ocean", nebule: "aurore holo neon", sambre: "foret carbone givre", ardenne: "or onyx rose",
  ironvale: "patriote acier carbone", solstice: "coucher sable or", bellwether: "platine onyx encre", koen: "sakura washi sumi",
  sable: "lagon nacre corail", lumiere: "marine champagne bordeaux", alpenrot: "rubis platine graphite", harrow: "marine bordeaux ivoire",
  nordsee: "graphite saphir acier", tulp: "lavande corail ivoire", solera: "terracotta champagne rubis", doge: "bordeaux or jade",
  oasis: "or champagne onyx", merlion: "jade saphir platine", harbour: "rubis or encre", maple: "rubis ivoire carbone",
  ipe: "emeraude champagne coucher", jacaranda: "lavande lagon sable", hanok: "marine washi jade", alzette: "saphir platine graphite",
  ganga: "cuivre or emeraude", nil: "sable or lagon", savanna: "terracotta emeraude or", bosphore: "rubis cuivre ivoire",
  tianshan: "rubis or jade", jaguar: "emeraude terracotta onyx", neva: "saphir ivoire rubis", emir: "ivoire champagne emeraude",
};
const stylesDe = (banque) => (STYLES_BANQUE[banque] ?? "minuit argent").split(" ");
const nomStyle = (id) => (id && STYLES[id] ? STYLES[id][0] : "Couleurs de la banque");

// MARK: Les motifs gravés (FormeMotif)

const motifs = {};
function motif(nom) {
  if (motifs[nom] !== undefined) return motifs[nom];
  const W = 320, H = 202;
  let d = "";
  const r = (x) => x.toFixed(1);
  switch (nom) {
    case "points":
      for (let y = 6; y < H; y += 10) for (let x = Math.floor(y / 10) % 2 === 0 ? 6 : 11; x < W; x += 10) d += `M${r(x)} ${r(y + 0.9)}a.9.9 0 1 0 1.8 0a.9.9 0 1 0-1.8 0`;
      break;
    case "diagonales":
      for (let x = -H; x < W; x += 5) d += `M${x} ${H}L${x + H} 0`;
      break;
    case "vagues": case "guilloche": {
      const n = nom === "vagues" ? 9 : 16;
      for (let k = 0; k < n; k++) {
        const base = H * (0.08 + (0.9 * k) / n);
        const phase = nom === "guilloche" ? k * 0.5 : 0;
        d += `M0 ${r(base)}`;
        for (let x = 0; x <= W; x += 4) d += `L${x} ${r(base + Math.sin((x / W) * Math.PI * (nom === "vagues" ? 4 : 3) + phase) * H * 0.05)}`;
      }
      break;
    }
    case "rayons":
      for (let k = 0; k < 28; k++) { const a = Math.PI + (k / 27) * (Math.PI / 2); d += `M${W} ${H}L${r(W + Math.cos(a) * W * 1.3)} ${r(H + Math.sin(a) * W * 1.3)}`; }
      break;
    case "cercles":
      for (let ray = 12; ray < W * 1.2; ray += 9) d += `M${r(W * 0.85 - ray)} ${r(H * 0.15)}a${ray} ${ray} 0 1 0 ${ray * 2} 0a${ray} ${ray} 0 1 0 ${-ray * 2} 0`;
      break;
    case "chevrons":
      for (let y = 0; y < H + 12; y += 12) { d += `M0 ${y}`; for (let x = 0; x < W; x += 14) d += `L${x + 7} ${y - 6}L${x + 14} ${y}`; }
      break;
    case "damier":
      for (let y = 0, l = 0; y < H; y += 6, l++) for (let x = l % 2 ? 6 : 0; x < W; x += 12) d += `M${x} ${y}h6v6h-6z`;
      break;
    default: d = "";
  }
  motifs[nom] = d;
  return d;
}

// MARK: Logos des banques (LogoBanque, simplifiés)

function logo(banque, taille = 24) {
  const s = (corps, vb = "0 0 24 24") => `<svg class="logo-banque" width="${taille}" height="${taille}" viewBox="${vb}" aria-hidden="true">${corps}</svg>`;
  const sigle = (t) => `<span class="logo-sigle" style="font-size:${Math.round(taille * 0.55)}px">${t}</span>`;
  const cachet = (t, c) => s(`<circle cx="12" cy="12" r="9.6" fill="${c}"/><text x="12" y="16.2" text-anchor="middle" font-size="10.5" font-weight="700" fill="#fff">${t}</text>`);
  switch (banque) {
    case "meuse": return s('<path d="M2.4 14.5a9.6 9.6 0 0 1 19.2 0z" fill="currentColor" transform="translate(0 1)"/><rect x="0" y="16.4" width="24" height="2.2" fill="currentColor"/>');
    case "nebule": return s('<circle cx="11" cy="11" r="7.4" fill="none" stroke="currentColor" stroke-width="3.6"/><path d="M15.5 15.5l5 5" stroke="currentColor" stroke-width="3.8" stroke-linecap="round"/>');
    case "ardenne": return `<span class="logo-sigle cadre" style="font-size:${Math.round(taille * 0.5)}px">V&amp;F</span>`;
    case "bellwether": return sigle("B&amp;C");
    case "harrow": return sigle("H&amp;L");
    case "koen": return cachet("公", "#C8102E");
    case "hanok": return cachet("한", "#1D3A6C");
    case "ganga": return cachet("ग", "#E07B39");
    case "tianshan": return cachet("天", "#C3001A");
    case "solstice": case "solera": case "savanna": return s('<circle cx="12" cy="12" r="4.6" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>');
    case "ironvale": return s('<path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v20c-4.6-2.4-8-6-8-11V5z" fill="currentColor"/>');
    case "sable": case "nordsee": return s('<path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>');
    case "alpenrot": return s('<path d="M1 20 8.5 7l4.5 7.5L16 10l7 10z" fill="currentColor"/>');
    case "doge": case "oasis": return s('<path d="M3 18 2 7l5.5 4L12 4l4.5 7L22 7l-1 11z" fill="currentColor"/>');
    case "maple": case "ipe": return s('<path d="M12 2c4 4 7 8 7 12a7 7 0 0 1-14 0c0-4 3-8 7-12zM12 9v13" fill="currentColor" stroke="currentColor" stroke-width="0.5"/>');
    case "neva": return s('<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>');
    case "nil": return s('<path d="M12 3 22 20H2z" fill="currentColor"/>');
    case "alzette": case "emir": return s('<path d="M12 2 21 12 12 22 3 12z" fill="currentColor"/>');
    case "bosphore": return s('<path d="M15 3a9 9 0 1 0 6 13A7.5 7.5 0 0 1 15 3z" fill="currentColor"/>');
    default: return s('<path d="M2.5 9.5 12 3.5l9.5 6zM4.5 10.5h15v1.5h-15zM5.5 13v5.5M9.8 13v5.5M14.2 13v5.5M18.5 13v5.5M3 20h18v1.5H3z" fill="currentColor" stroke="currentColor" stroke-width="1.2"/>');
  }
}

// MARK: Objets dessinés

const puce = (petite = false) => `<span class="puce-carte ${petite ? "petite" : ""}" aria-hidden="true"><i></i><i></i><b></b></span>`;

/** CarteBancaire : une carte aux couleurs de sa banque (ou de son style), solde dessus. */
function carteBancaire(c, { attrs = "", classe = "" } = {}) {
  const st = c.style && STYLES[c.style];
  const couleurs = st ? st[1] : c.couleurs?.length ? c.couleurs : ["#3A3D45", "#17181C"];
  const clair = !!(st && st[4]);
  const mate = !!(st && st[3]);
  const finition = st ? st[2] : STYLES[stylesDe(c.banque)[0]]?.[2] ?? "aucun";
  const encre = clair ? "#1D1C1A" : "#fff";
  const epargne = c.nature === "epargne";
  return `<div class="carte-bancaire ${classe}" style="--fond:linear-gradient(135deg,${couleurs.join(",")});--encre:${encre}" ${attrs}
      role="${attrs.includes("data-action") ? "button" : "img"}" aria-label="${esc(`${c.nom}, ${c.banqueNom}, ${eurosC(c.solde)}`)}">
    <svg class="motif" viewBox="0 0 320 202" preserveAspectRatio="none" aria-hidden="true"><path d="${motif(finition)}" fill="none" stroke="${encre}" stroke-opacity=".09" stroke-width=".8" vector-effect="non-scaling-stroke"/></svg>
    ${mate ? "" : '<div class="reflet"></div>'}
    <div class="haut">
      ${logo(c.banque, 24)}
      <div class="noms"><div class="b">${esc(c.banqueNom)}</div><div class="n">${esc(c.nom)}</div></div>
      <div class="solde chiffres ${c.solde < 0 ? "negatif" : ""}">${eurosC(c.solde)}</div>
    </div>
    <div class="milieu">${epargne
      ? `<span class="livret">${ic.feuille}<span><b>Livret d'épargne</b><small>${esc(c.detail)}</small></span></span>`
      : `${puce()}<span class="ondes">${ic.sansContact}</span>`}</div>
    <div class="bas"><span class="numero">${esc(c.numero)}</span><span class="genre">${epargne ? "Épargne" : "Débit"}</span></div>
  </div>`;
}

/** Les billets de la liasse (Liasse.billets) : au plus `maximum`, du plus gros au plus petit. */
function billets(m, maximum = 5) {
  let reste = Math.floor(Math.max(0, m) / 100);
  const sortie = [];
  for (const c of [500, 200, 100, 50, 20, 10, 5]) {
    if (sortie.length >= maximum) break;
    const n = Math.min(Math.floor(reste / c), maximum - sortie.length);
    for (let i = 0; i < n; i++) sortie.push(c);
    reste -= n * c;
  }
  return sortie;
}
const TEINTES_BILLET = { 500: ["#B49AC8", "#7E6295"], 200: ["#E4CB7E", "#B1924A"], 100: ["#9CC29A", "#678F67"], 50: ["#EDB27A", "#C27D45"], 20: ["#95B1D8", "#5E7DA8"], 10: ["#E19A90", "#AE665D"], 5: ["#BFC3C5", "#8A9093"] };

/** Portefeuille : du cuir surpiqué, les billets qui dépassent. */
function portefeuille(m, { sorti = false, attrs = "", classe = "" } = {}) {
  const b = billets(m, 5);
  const n = b.length;
  const liasse = b.map((v, rang) => {
    const k = rang - Math.floor(n / 2);
    const [c1, c2] = TEINTES_BILLET[v];
    return `<span class="billet" style="--c1:${c1};--c2:${c2};z-index:${n - rang};transform:translate(${k * (sorti ? 20 : 12)}px,${sorti ? -36 + rang * 4 : -11 + rang * 1.5}px) rotate(${k * (sorti ? 4 : 1.5)}deg)"><i>${v}</i></span>`;
  }).join("");
  return `<div class="portefeuille ${sorti ? "sorti" : ""} ${classe}" ${attrs} role="${attrs.includes("data-action") ? "button" : "img"}" aria-label="Portefeuille, ${esc(eurosC(m))} en liquide">
    <div class="liasse">${liasse}</div>
    <div class="cuir">
      <div class="haut"><div class="noms"><div class="b">Portefeuille</div><div class="n">Liquide, invisible au fisc, exposé au vol</div></div><div class="solde chiffres">${eurosC(m)}</div></div>
      <span class="fermoir"><i></i></span>
    </div>
  </div>`;
}

/** MiniCarte : couleurs et puce, sans texte. */
function miniCarte(c) {
  const st = c.style && STYLES[c.style];
  const couleurs = st ? st[1] : c.couleurs;
  return `<span class="mini-carte" style="background:linear-gradient(135deg,${couleurs.join(",")})"><i></i></span>`;
}

// Le papier : contrats, avis, police.
const champPapier = (libelle, valeur, fort = false) =>
  `<div class="champ-papier ${fort ? "fort" : ""}"><span>${libelle}</span><b>${valeur}</b></div>`;
const titrePapier = (titre, sous) => `<div class="titre-papier"><h3>${titre}</h3><div>${sous}</div></div>`;
const talon = (texte, valeur) => `<div class="talon"><span>${texte}</span><b>${valeur}</b></div>`;
const etiquetteEncre = (t) => `<span class="etiquette-encre">${t}<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></span>`;

function contratPapier(c, rembourser) {
  const prog = c.capital > 0 ? Math.min(1, Math.max(0, 1 - c.restant / c.capital)) : 0;
  const trace = lireSignature(idContrat(c));
  return `<div class="papier empile">
    <div class="rangee" style="align-items:flex-start">
      ${titrePapier(`Contrat de ${esc(c.titre.toLowerCase())}`, `Entre ${esc(c.preteur)} et toi`)}
      <span class="tampon-banque" style="background:linear-gradient(${c.couleurs.join(",")})"></span>
    </div>
    <div class="champs-papier">
      ${champPapier("Capital emprunté", euros(c.capital))}
      ${champPapier("Taux", c.taux === 0 ? "sans intérêts" : pct(c.taux, 2))}
      ${champPapier("Échéance", `${euros(c.echeance)} chaque dimanche`)}
      ${champPapier("Échéances restantes", String(c.echeancesRestantes))}
      ${champPapier("Restant dû", euros(c.restant), true)}
    </div>
    <div><div class="rail-papier"><i style="width:${Math.max(1, prog * 100)}%"></i></div><div class="encre2" style="font-size:12px;margin-top:5px">${pct(prog)} remboursés</div></div>
    <div class="rangee entre" style="align-items:flex-end">
      <div class="lu"><i>Lu et approuvé</i>${trace ? traceSvg(trace, 130, 46) : ""}<span class="ligne-signature"></span></div>
      ${rembourser ? `<button class="bouton-encre" data-action="rembourser" data-contrat='${esc(JSON.stringify(c))}'>Rembourser</button>` : ""}
    </div>
  </div>`;
}

function avisImposition(a, invite) {
  return `<div class="papier">
    ${titrePapier("Avis d'imposition", `Contributions de Grind, semaine ${a.semaine}`)}
    <div class="champs-papier">
      ${champPapier("Salaire et production de la semaine", euros(a.brut))}
      ${champPapier("Part exonérée", `${euros(a.exonereParSemaine)} par semaine`)}
      ${champPapier("Tranche marginale", pct(a.trancheMarginale))}
    </div>
    ${talon("Dû dimanche, si la semaine finissait là", euros(a.impotEstime))}
    <p class="encre2" style="font-size:12px">Revenu de référence : ${euros(a.revenuReference)} par semaine. Il fixe ce que les banques acceptent de te prêter.</p>
    ${invite ? `<div class="rangee entre"><span class="encre2" style="font-size:12px">Salaire, don, machines, provision</span>${etiquetteEncre("Optimiser")}</div>` : ""}
  </div>`;
}

function policeAssurance(t, invite) {
  const actif = t.categories.some((c) => c.nombre > 0 && (c.niveau ?? 1) > 0);
  const niveau = (c) => (c.niveau == null ? "chacun son niveau" : c.options.find((o) => o.id === c.niveau)?.nom.toLowerCase() ?? "non assuré");
  return `<div class="papier empile">
    <div class="rangee" style="align-items:flex-start">
      ${titrePapier("Police d'assurance", "Véhicules, biens et boîtes, chaque semaine")}
      <span class="tampon-assure ${actif ? "" : "non"}" aria-hidden="true">${actif ? ic.bouclier : ic.bouclier}<b>${actif ? "Assuré" : "Non assuré"}</b></span>
    </div>
    <div class="champs-papier">${t.categories.map((c) => `<div>${champPapier(esc(c.nom), c.nombre === 0 ? "rien à assurer" : `${euros(c.primeSemaine)} par semaine`)}
      ${c.nombre > 0 ? `<div class="encre2" style="font-size:11px;margin-top:3px">${esc(c.detail)}, ${esc(niveau(c))}</div>` : ""}</div>`).join("")}</div>
    ${talon("Ce que tu paies vraiment par semaine", euros(t.totalSemaine))}
    <p class="encre2" style="font-size:12px">Véhicules et biens prélevés le dimanche ; chaque boîte paie sa prime dans ses charges.</p>
    ${invite ? `<div class="rangee entre"><span class="encre2" style="font-size:12px">${t.rembourse > 0 ? `${euros(t.rembourse)} pris en charge récemment` : "De la RC à l'omnium total"}</span>${etiquetteEncre("Garanties")}</div>` : ""}
  </div>`;
}

// MARK: Signatures (Signatures.swift : gardées sur l'appareil, par contrat)

const idContrat = (c) => ("credit" in c.nature ? `c${c.nature.credit.id}` : `d${c.nature.dette.rang}`);
function lireSignature(id) {
  try { const t = JSON.parse(lire(`grind.signature.${id}`) ?? "null"); return Array.isArray(t) && t.length ? t : null; } catch { return null; }
}
function traceSvg(traits, w, h) {
  return `<svg class="trace" width="${w}" height="${h}" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">${traits.map((t) =>
    `<polyline points="${t.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(" ")}" fill="none" stroke="#1F3A8A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`).join("")}</svg>`;
}

// MARK: État local des écrans (ce que @State garde sur l'iPhone)

const etat = {
  ouverte: null, // la carte sortie de la pile
  virement: null, // { etape, source, destination }
  compte: null, // l'ouverture d'un compte
  credit: { montant: null, semaines: null, banque: null, traits: [] },
  impots: { source: null, montant: null, don: 50_000 },
};

// MARK: Page Banque

const boutonsBanque = (t) => `
      ${boutonAide("banque", { grand: true })}
      <button class="rond grand" data-action="versements" aria-label="Où arrive ton argent" ${t ? "" : "disabled"}>${ic.aiguillage}</button>
      <button class="rond grand" data-action="ouvrirCompte" aria-label="Ouvrir un compte" ${t ? "" : "disabled"}>${ic.plus}</button>`;

const pageBanque = {
  titre: "Banque",
  css: ["banque", "manger"], // lot A : css/pages/banque.css ; RNT-210 : le coffre et le portefeuille (manger.js)

  async donnees(ctx) {
    const [t, a, imp, pf, vie] = await Promise.all([ctx.tableau("banque"), ctx.tableau("assurances"), ctx.tableau("impots"), ctx.tableau("portefeuille"),
      ctx.tableau("trainDeVie")]);
    // RNT-177 : le portefeuille expliqué (plafond, avantages, coffres) sous la carte du liquide.
    if (t) t.pf = pf;
    return { t, a, imp, pf, vie };
  },
  rendu(d) {
    styles();
    const t = d?.t;
    if (!t) return `${enteteRacine("Banque", { droite: boutonsBanque(t) })}<p class="aide">Les comptes s'ouvrent avec ta première saison.</p>`;
    return `${enteteRacine("Banque", { droite: boutonsBanque(t) })}<div class="banque">${haut(t, d)}${bas(t, d)}</div>`;
  },
  // Lot A, l'exemple du grand écran (docs/web-design.md) : la pile de cartes à gauche, les papiers à droite ;
  // crédit, assurances et impôts s'ouvrent dans le panneau de détail au palier large (`panneau: true`).
  renduLarge(d) {
    styles();
    const t = d?.t;
    if (!t) return pageBanque.rendu(d);
    return `${enteteRacine("Banque", { droite: boutonsBanque(t) })}${colonnes(`<div class="banque">${haut(t, d)}</div>`, `<div class="banque">${bas(t, d)}</div>`, { classe: "large-gauche" })}`;
  },
  actions: {
    ...actionsCoffre,
    basculer(ctx, el, d) {
      const id = el.dataset.id;
      etat.ouverte = etat.ouverte === id ? null : id;
      redessinerPile(d.t);
    },
    virement: (ctx, el, d) => ouvrirVirement(ctx, d.t),
    ouvrirCompte: (ctx, el, d) => ouvrirCompte(ctx, d.t),
    versements: (ctx, el, d) => ouvrirVersements(ctx, d.t),
    style(ctx, el, d) {
      const c = d.t.cartes.find((x) => idRef(x.ref) === el.dataset.id);
      if (c) ouvrirStyle(ctx, c);
    },
    // RNT-184 : l'appui long sur une carte (ou le clic droit) ouvre ce menu.
    menuCarte(ctx, el, d) {
      const rang = d.t.cartes.findIndex((x) => idRef(x.ref) === el.dataset.id);
      if (rang >= 0) ouvrirMenuCarte(ctx, d.t, rang);
    },
    async fermerCompte(ctx, el, d) {
      const c = d.t.cartes.find((x) => idRef(x.ref) === el.dataset.id);
      if (!c) return;
      if (c.principal) return choisirPrincipal(ctx, d.t);
      etat.ouverte = null;
      await ctx.decider("banque", { fermerCompte: { _0: c.ref.compte._0 } }, { succes: `${c.nom} fermé` });
    },
    async degeler(ctx, el) {
      await ctx.decider("banque", { degeler: { carte: Number(el.dataset.carte) } }, { succes: "Carte dégelée" });
    },
    rembourser(ctx, el, d) {
      const c = JSON.parse(el.dataset.contrat);
      const courant = Math.max(0, d.t.cartes.find((x) => x.principal)?.solde ?? 0);
      const operation = (v) => ("credit" in c.nature ? { remboursement: { credit: c.nature.credit.id, montant: v } } : { remboursementDette: { rang: c.nature.dette.rang, montant: v } });
      pave(ctx, {
        titre: `Rembourser : ${c.titre}`,
        maximum: Math.min(c.restant, courant),
        valider: (v) => ctx.decider("banque", operation(v), { succes: `${eurosC(v)} remboursés` }),
      });
    },
    async conge(ctx) { await ctx.commande("conge", {}, { succes: "Congé pris : profite de ta journée" }); },
  },
};

/** RNT-184 : renommer, changer le style, déplacer, fermer : tout ce qu'on fait d'une carte. */
function ouvrirMenuCarte(ctx, t, rang) {
  const c = t.cartes[rang], n = t.cartes.length;
  const ligne = (action, texte, icone, extra = "") => `<button class="ligne" data-action="${action}" ${extra}><span style="width:22px;flex:none">${icone}</span><span class="titre" style="flex:1">${texte}</span></button>`;
  const deplacer = (position, texte) => ctx.decider("banque", { deplacerCarte: { _0: c.ref, position } }, { succes: texte });
  ctx.feuille({
    titre: c.nom,
    contenu: `<div class="carte" style="padding:0">
        ${ligne("mcRenommer", "Renommer", ic.crayon)}
        ${ligne("mcStyle", "Changer le style", ic.pinceau)}
        ${rang > 0 ? ligne("mcPremier", "En premier", ic.enHaut) + ligne("mcMonter", "Monter", ic.monter) : ""}
        ${rang < n - 1 ? ligne("mcDescendre", "Descendre", ic.descendre) + ligne("mcDernier", "En dernier", ic.enBas) : ""}
        ${c.fermable ? ligne("mcFermer", `<span style="color:var(--perte)">Fermer ce compte</span>`, `<span style="color:var(--perte)">${ic.croix}</span>`) : ""}
      </div>
      <button class="bouton discret" data-action="fermerFeuille">Annuler</button>`,
    actions: {
      mcRenommer: () => ouvrirRenommer(ctx, c),
      mcStyle: () => ouvrirStyle(ctx, c),
      mcPremier: () => deplacer(0, `${c.nom} passe en premier`),
      mcMonter: () => deplacer(rang - 1, `${c.nom} déplacée`),
      mcDescendre: () => deplacer(rang + 1, `${c.nom} déplacée`),
      mcDernier: () => deplacer(n - 1, `${c.nom} déplacée`),
      async mcFermer() {
        if (c.principal) return choisirPrincipal(ctx, t);
        etat.ouverte = null;
        await ctx.decider("banque", { fermerCompte: { _0: c.ref.compte._0 } }, { succes: `${c.nom} fermé` });
      },
    },
  });
}

function ouvrirRenommer(ctx, c) {
  ctx.feuille({
    titre: "Renommer la carte",
    contenu: `<p class="aide">24 caractères au plus. Laisse vide pour revenir au nom d'origine.</p>
      <input class="champ" id="mc-nom" maxlength="24" value="${esc(c.nom)}" aria-label="Nom de la carte" autocomplete="off">
      ${bouton("Renommer", "mcValider")}
      <button class="bouton discret" data-action="fermerFeuille">Annuler</button>`,
    actions: {
      mcValider() {
        const n = (document.getElementById("mc-nom")?.value ?? "").trim();
        return ctx.decider("banque", { renommerCarte: { _0: c.ref, _1: n } }, { succes: n ? `Carte renommée : ${n}` : `${c.nom} reprend son nom` });
      },
    },
  });
  setTimeout(() => { const i = document.getElementById("mc-nom"); i?.focus(); i?.select(); }, 50);
}

// L'appui long (500 ms) ou le clic droit sur une carte de la pile : le menu de la carte.
// Le toucher qui suit un appui long ne sort pas la carte.
if (typeof document !== "undefined") {
  let minuteur = null, depart = null, avale = false;
  const carteSous = (e) => e.target.closest?.("#pile [data-action=basculer][data-id]:not([data-id=liquide])");
  const ouvrir = (el) => {
    const b = document.createElement("button");
    b.dataset.action = "menuCarte"; b.dataset.id = el.dataset.id; b.hidden = true;
    el.parentElement.appendChild(b); b.click(); b.remove();
  };
  document.addEventListener("pointerdown", (e) => {
    const el = carteSous(e);
    if (!el || e.button > 0) return;
    depart = [e.clientX, e.clientY];
    minuteur = setTimeout(() => { minuteur = null; avale = true; navigator.vibrate?.(10); ouvrir(el); }, 500);
  });
  const annuler = () => { clearTimeout(minuteur); minuteur = null; };
  document.addEventListener("pointermove", (e) => { if (minuteur && depart && Math.hypot(e.clientX - depart[0], e.clientY - depart[1]) > 8) annuler(); });
  document.addEventListener("pointerup", annuler);
  document.addEventListener("pointercancel", annuler);
  document.addEventListener("click", (e) => { if (avale && carteSous(e)) { e.stopPropagation(); e.preventDefault(); } avale = false; }, true);
  document.addEventListener("contextmenu", (e) => { const el = carteSous(e); if (el) { e.preventDefault(); ouvrir(el); } });
}

function haut(t) {
  // RNT-173 : « Te verser un revenu » n'est plus ici : on se verse depuis la holding (Actifs › Entreprises) ou une boîte.
  return `
  <div class="liquidites"><div class="t2" style="font-size:15px">Liquidités</div><div class="chiffres gros">${euros(liquidites(t))}</div></div>
  ${bouton(`${ic.fleches} Virement, retrait ou dépôt`, "virement", { genre: "secondaire" })}
  ${t.gelJusqua ? `<div class="gel"><span style="width:18px;flex:none">${ic.flocon}</span><span style="flex:1">Compte courant gelé jusqu'à ${heure(t.gelJusqua)} : rien ne peut en sortir.</span>
      ${petit("Lever à l'agence", "degeler", { donnees: { carte: -1 } })}</div>` : ""}
  <div class="pile-cartes" id="pile">${pile(t)}</div>`;
}

/** La pile : les cartes, puis le portefeuille ; la carte sortie passe devant, son panneau dessous. */
function pile(t) {
  const elements = [...t.cartes.map((c) => ({ id: idRef(c.ref), c })), { id: "liquide", c: null }];
  const choisie = elements.find((e) => e.id === etat.ouverte);
  if (!choisie) etat.ouverte = null;
  const dessin = (e, classe) => {
    const attrs = `data-action="basculer" data-id="${e.id}" data-cle="${e.id}" tabindex="0" aria-expanded="${etat.ouverte === e.id}"`;
    return e.c ? carteBancaire(e.c, { attrs, classe }) : portefeuille(t.liquide, { sorti: etat.ouverte === "liquide", attrs, classe });
  };
  if (!choisie) return elements.map((e, i) => dessin(e, i ? "rangee-pile" : "")).join("");
  const autres = elements.filter((e) => e !== choisie);
  return `${dessin(choisie, "sortie")}<div class="panneau" data-cle="panneau">${panneau(choisie, t)}</div>
    ${autres.map((e, i) => dessin(e, i ? "rangee-pile" : "premiere-rangee")).join("")}`;
}

function panneau(e, t) {
  const c = e.c;
  if (!c) return panneauPortefeuille(t.pf);
  const gelee = !c.principal && /^Gelée jusqu'à/.test(c.detail);
  return `
    <p class="aide">${esc(c.detail)}</p>
    ${c.nature === "courant" ? `<div class="palier">
      <div class="rangee entre" style="align-items:baseline"><span style="font-size:13px;font-weight:600;color:var(--texte2)">Palier ${esc(c.palier.toLowerCase())}</span><span style="font-size:12px;color:var(--texte3)">${esc(c.banqueNom)}</span></div>
      ${c.avantages.length ? c.avantages.map((a) => `<div class="avantage">${ic.coche}<span>${esc(a)}</span></div>`).join("") : `<p class="aide">Cette banque n'offre pas d'avantage sur ses cartes.</p>`}
    </div>` : ""}
    <p class="aide">Appui long sur la carte : renommer, changer le style, déplacer, fermer.</p>
    ${gelee ? `<div class="choix">${petit("Dégeler à l'agence", "degeler", { donnees: { carte: c.ref.compte._0 } })}</div>` : ""}`;
}

/** Redessine la pile seule (sortir/ranger une carte), en animant le déplacement de chaque objet (FLIP). */
function redessinerPile(t) {
  const el = document.getElementById("pile");
  if (!el) return;
  const avant = new Map([...el.querySelectorAll("[data-cle]")].map((x) => [x.dataset.cle, x.getBoundingClientRect().top]));
  el.innerHTML = pile(t);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  for (const x of el.querySelectorAll("[data-cle]")) {
    const y0 = avant.get(x.dataset.cle);
    const dy = y0 == null ? 0 : y0 - x.getBoundingClientRect().top;
    x.animate(y0 == null ? [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }]
      : [{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(0.2, 0.9, 0.25, 1)" });
  }
}

function bas(t, d) {
  const gele = !!t.gelJusqua;
  return `
  ${d?.vie ? `<div class="libelle bloc">Train de vie</div>${carteBilanVie(d.vie)}` /* RNT-190 : ce que la vie coûte vraiment */ : ""}
  <div class="libelle bloc">Contrats</div>
  ${t.contrats.map((c) => contratPapier(c, !gele)).join("")}
  <button class="demande-credit" data-action="ouvrir" data-page="banque.credit" ${t.saisonTerminee ? "disabled" : ""}>
    <span style="width:22px;flex:none">${ic.signature}</span>
    <span style="flex:1"><div class="libelle">Demander un crédit</div><div class="aide">Montant, durée, banque : le contrat se prépare devant toi.</div></span>
    <span class="t3" style="width:14px">${ic.chevron}</span>
  </button>
  ${d.a ? `<div class="libelle bloc">Assurances</div>
    <button class="lien-papier" data-action="ouvrir" data-page="banque.assurances" aria-label="Assurances : ouvre les garanties">${policeAssurance(d.a, true)}</button>` : ""}
  <div class="libelle bloc">Impôt</div>
  ${t.saisonTerminee || !d.imp ? avisImposition(t.avis, false)
    : `<button class="lien-papier" data-action="ouvrir" data-page="banque.impots" aria-label="Avis d'imposition : ouvre la page Impôts">${avisImposition(t.avis, true)}</button>`}
  ${conges(t)}`;
}

/** Les congés : un ticket par jour de la saison, détaché quand il est pris. */
function conges(t) {
  const pris = t.congesQuota - t.congesRestants;
  const tickets = Array.from({ length: Math.max(1, t.congesQuota) }, (_, i) => `<i class="${i < pris ? "pris" : ""}"></i>`).join("");
  return `<div class="carte pad conges">
    <div class="rangee entre" style="align-items:baseline"><span class="libelle">Congés</span><span class="chiffres t2" style="font-size:15px;letter-spacing:0">${t.congesRestants} sur ${t.congesQuota}</span></div>
    <div class="tickets" role="img" aria-label="${t.congesRestants} jours de congé restants sur ${t.congesQuota}">${tickets}</div>
    <p class="aide">${t.congeAujourdhui ? "Aujourd'hui est un congé : ton train de vie ne te coûte pas de plaisir." : "Un congé se déclare le jour même ou à l'avance, jamais après coup."}</p>
    ${t.congeAujourdhui ? "" : bouton("Prendre congé aujourd'hui", "conge", { genre: "secondaire", desactive: t.congesRestants <= 0 || t.saisonTerminee })}
  </div>`;
}


// MARK: Pavé numérique (PaveNumerique)

/**
 * Une feuille « montant » : titre, en-tête facultatif, le montant en 50, la limite dessous,
 * 25 % / 50 % / Tout, le pavé 3 × 4 (le clavier marche aussi), Valider, Annuler.
 */
function pave(ctx, { titre, aide = "", maximum = null, proposition = 0, entete = "", valider, actions = {}, retour = null }) {
  const id = "pave-montant";
  const texte = () => document.getElementById(id)?.value ?? "";
  const centimes = () => {
    const t = texte().replace(/\s/g, "").replace(",", ".");
    if (!t) return proposition || null;
    const x = Number(t);
    return Number.isFinite(x) ? Math.round(x * 100) : null;
  };
  const maj = () => {
    const champ = document.getElementById(id);
    // Le montant reste centré : le champ prend la largeur de ce qu'il affiche.
    if (champ) champ.style.width = `${Math.max(1, (champ.value || champ.placeholder).length) * 0.6 + 0.1}em`;
    const c = centimes();
    const depasse = maximum != null && c != null && c > maximum;
    const el = document.getElementById(`${id}-aide`);
    if (el) {
      el.textContent = maximum != null ? (depasse ? `Au-delà de ta limite : ${eurosC(maximum)}` : `Au plus ${eurosC(maximum)}`) : aide || " ";
      el.classList.toggle("perte", depasse);
    }
    const v = document.querySelector("[data-action=paveValider]");
    if (v) v.disabled = !(c > 0) || depasse;
  };
  const poser = (s) => { const el = document.getElementById(id); if (el) { el.value = s; maj(); } };
  const touches = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"];
  ctx.feuille({
    titre,
    contenu: `<div class="pave">
      ${entete}
      <div class="montant-pave"><input id="${id}" inputmode="decimal" autocomplete="off" aria-label="Montant" placeholder="${proposition ? esc(String(proposition / 100).replace(".", ",")) : "0"}" data-saisie="paveSaisie"><span>€</span></div>
      <div id="${id}-aide" class="aide" style="text-align:center"></div>
      ${maximum != null ? `<div class="choix centre">${petit("25 %", "paveRaccourci", { donnees: { part: 0.25 } })}${petit("50 %", "paveRaccourci", { donnees: { part: 0.5 } })}${petit("Tout", "paveRaccourci", { donnees: { part: 1 } })}</div>` : ""}
      <div class="touches">${touches.map((k) => `<button data-action="paveTouche" data-touche="${k}" aria-label="${k === "⌫" ? "effacer" : k === "," ? "virgule" : k}">${k === "⌫" ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M8 5h12v14H8l-6-7zM12 9.5l5 5M17 9.5l-5 5"/></svg>' : k}</button>`).join("")}</div>
      ${bouton("Valider", "paveValider", { desactive: true })}
      <button class="bouton discret" data-action="fermerFeuille">Annuler</button>
    </div>`,
    actions: {
      ...actions,
      paveSaisie: () => maj(),
      paveTouche(_c, el) {
        const k = el.dataset.touche;
        let s = texte();
        if (k === "⌫") s = s.slice(0, -1);
        else if (k === ",") { if (!s.includes(",")) s = (s || "0") + ","; }
        else if (!/,\d\d$/.test(s)) s = s === "0" ? k : s + k;
        poser(s);
      },
      paveRaccourci(_c, el) {
        const v = Math.floor((maximum * Number(el.dataset.part)));
        poser((v / 100).toFixed(2).replace(".", ",").replace(/,00$/, ""));
      },
      async paveValider() {
        const c = centimes();
        if (!(c > 0) || (maximum != null && c > maximum)) return;
        await valider(c);
      },
      paveRetour: () => retour?.(),
    },
  });
  maj();
}

// MARK: Feuille Virement (trois temps : d'où, vers où, combien)

function ouvrirVirement(ctx, t) {
  etat.virement = { etape: 0, source: "principal", destination: null };
  dessinerVirement(ctx, t);
}

function objetsVirement(t, exclu, sansVides) {
  return [...t.cartes.map((c) => idRef(c.ref)), "liquide"].filter((id) => id !== exclu && (!sansVides || soldeDe(id, t) > 0));
}

function dessinerVirement(ctx, t) {
  const v = etat.virement;
  const etapes = `<div class="etapes" role="img" aria-label="Étape ${v.etape + 1} sur 3">${[0, 1, 2].map((i) => `<i class="${i <= v.etape ? "faite" : ""} ${i === v.etape ? "active" : ""}"></i>`).join("")}</div>`;
  if (v.etape === 2) {
    const de = refId(v.source, t), vers = refId(v.destination, t);
    const titre = v.destination === "liquide" ? "Retrait en liquide" : v.source === "liquide" ? "Dépôt de liquide" : "Virement";
    return pave(ctx, {
      titre,
      maximum: soldeDe(v.source, t),
      entete: `${etapes}<button class="trajet" data-action="paveRetour" aria-label="Change le compte d'arrivée"><span>${esc(nomCourt(v.source, t))}</span><span class="t2" style="width:16px;flex:none">${ic.fleche}</span><span>${esc(nomCourt(v.destination, t))}</span></button>`,
      retour: () => { v.etape = 1; dessinerVirement(ctx, t); },
      valider: (m) => ctx.decider("banque", { virement: { de, vers, montant: m } }, { succes: `${eurosC(m)} virés vers ${nomCourt(v.destination, t)}` }),
    });
  }
  const source = v.etape === 0;
  const liste = source ? objetsVirement(t, null, true) : objetsVirement(t, v.source, false);
  const cle = source ? "source" : "destination";
  if (!liste.includes(v[cle])) v[cle] = liste[0] ?? null;
  const choisi = v[cle];
  const objet = (id) => (id === "liquide" ? portefeuille(t.liquide) : carteBancaire(t.cartes.find((c) => idRef(c.ref) === id)));
  const legende = (id) => id ? `<div class="libelle">${esc(id === "liquide" ? "Portefeuille" : (() => { const c = t.cartes.find((x) => idRef(x.ref) === id); return `${c.nom}, ${c.banqueNom}`; })())}</div><div class="aide">${eurosC(soldeDe(id, t))} disponibles</div>` : "";
  ctx.feuille({
    titre: source ? "Virement" : "Virement",
    contenu: `${etapes}
      <h3 class="titre-etape">${source ? "D'où part l'argent ?" : "Où va-t-il ?"}</h3>
      <div class="carrousel" id="carrousel-virement" data-saisie-defile="virement">${liste.map((id) => `<div class="diapo ${id === choisi ? "choisie" : ""}" data-id="${id}" data-action="choisirDiapo">${objet(id)}</div>`).join("")}</div>
      <div class="legende-diapo" id="legende-virement">${legende(choisi)}</div>
      <div class="legende" style="text-align:center">Fais glisser pour changer</div>
      ${bouton("Continuer", "virementSuite", { desactive: source ? soldeDe(choisi, t) <= 0 : !choisi || choisi === v.source })}
      <button class="bouton discret" data-action="virementRecul">${source ? "Annuler" : "Retour"}</button>`,
    actions: {
      choisirDiapo(_c, el) { defiler("carrousel-virement", el.dataset.id); },
      virementSuite() {
        if (v.etape === 0 && (!v.destination || v.destination === v.source)) v.destination = objetsVirement(t, v.source)[0];
        v.etape += 1;
        dessinerVirement(ctx, t);
      },
      virementRecul() { if (v.etape === 0) ctx.fermerFeuille(); else { v.etape -= 1; dessinerVirement(ctx, t); } },
    },
  });
  carrousel("carrousel-virement", choisi, (id) => {
    v[cle] = id;
    document.getElementById("legende-virement").innerHTML = legende(id);
    const b = document.querySelector("#feuille [data-action=virementSuite]");
    if (b) b.disabled = source ? soldeDe(id, t) <= 0 : !id || id === v.source;
  });
}

/** Un carrousel aimanté (scroll-snap) : la diapo au centre est la choisie. */
function carrousel(idEl, choisi, choisir) {
  const el = document.getElementById(idEl);
  if (!el) return;
  const diapo = el.querySelector(`[data-id="${CSS.escape(choisi ?? "")}"]`);
  if (diapo) el.scrollLeft = diapo.offsetLeft - (el.clientWidth - diapo.clientWidth) / 2;
  let minuterie = null;
  el.addEventListener("scroll", () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      const centre = el.scrollLeft + el.clientWidth / 2;
      let meilleur = null, ecart = Infinity;
      for (const x of el.children) { const e = Math.abs(x.offsetLeft + x.clientWidth / 2 - centre); if (e < ecart) { ecart = e; meilleur = x; } }
      if (!meilleur) return;
      for (const x of el.children) x.classList.toggle("choisie", x === meilleur);
      choisir(meilleur.dataset.id);
    }, 90);
  }, { passive: true });
}
function defiler(idEl, id) {
  const el = document.getElementById(idEl);
  const d = el?.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (d) el.scrollTo({ left: d.offsetLeft - (el.clientWidth - d.clientWidth) / 2, behavior: "smooth" });
}

// MARK: Feuille Style de carte (FeuilleStyle, SelecteurStyle)

async function raresDebloquees(ctx) {
  const col = await ctx.tableau("collection");
  return (col?.cartes ?? []).filter((c) => c.debloquee).map((c) => c.id);
}

function selecteurStyle(apercu, style, rares, idEl) {
  const choix = ["banque", ...stylesDe(apercu.banque), ...rares];
  const actuel = style ?? "banque";
  return `<div class="carrousel" id="${idEl}">${choix.map((id) => `<div class="diapo ${id === actuel ? "choisie" : ""}" data-id="${id}" data-action="choisirStyleDiapo">${carteBancaire({ ...apercu, style: id === "banque" ? null : id })}</div>`).join("")}</div>
    <div class="aide" style="text-align:center" id="${idEl}-nom">${esc(nomStyle(style))}</div>`;
}

async function ouvrirStyle(ctx, c) {
  const rares = await raresDebloquees(ctx);
  let style = c.style ?? null;
  ctx.feuille({
    titre: "Style de la carte",
    contenu: `${selecteurStyle(c, style, rares, "carrousel-style")}
      ${bouton("Choisir ce style", "choisirStyle")}
      <button class="bouton discret" data-action="fermerFeuille">Annuler</button>`,
    actions: {
      choisirStyleDiapo(_c, el) { defiler("carrousel-style", el.dataset.id); },
      choisirStyle: () => ctx.decider("banque", { styleCarte: { _0: c.ref, _1: style } }, { succes: `Nouvelle carte : ${style ? nomStyle(style) : "couleurs de la banque"}` }),
    },
  });
  carrousel("carrousel-style", style ?? "banque", (id) => {
    style = id === "banque" ? null : id;
    document.getElementById("carrousel-style-nom").textContent = nomStyle(style);
  });
}

// MARK: Feuille Ouvrir un compte (FeuilleOuvrirCompte)

const PALIERS = ["Courant", "Intermédiaire", "Privée", "Premium"];
const TRIS = [["palier", "Par palier"], ["epargne", "Épargne"], ["frais", "Frais"], ["credit", "Crédit"], ["cashback", "Cashback"], ["assurances", "Remise assurances"], ["gel", "Gel réduit"], ["acces", "Accès"], ["nom", "Nom"]];

async function ouvrirCompte(ctx, t) {
  const [balance, rares] = await Promise.all([ctx.balance("banque"), raresDebloquees(ctx)]);
  const principale = t.cartes.find((c) => c.principal)?.banque ?? t.etablissements[0]?.id;
  etat.compte = { banque: principale, nature: "epargne", nom: "", style: null, recherche: "", tri: "palier", filtres: new Set(), balance, rares };
  dessinerOuvrir(ctx, t);
}

function etablissementsFiltres(t) {
  const s = etat.compte;
  const regles = (e) => s.balance?.etablissements?.find((x) => x.id === e.id) ?? {};
  const paliersChoisis = PALIERS.filter((p) => s.filtres.has(`palier:${p}`));
  const q = s.recherche.trim().toLowerCase();
  const liste = t.etablissements
    .filter((e) => !q || [e.nom, e.description, e.palier].some((x) => x.toLowerCase().includes(q)))
    .filter((e) => !paliersChoisis.length || paliersChoisis.includes(e.palier))
    .filter((e) => !s.filtres.has("ouvertes") || e.accessible)
    .filter((e) => !s.filtres.has("sansFrais") || e.fraisParSemaine === 0)
    .filter((e) => !s.filtres.has("cliente") || e.cliente);
  // Les clés de tri de l'iPhone ; « croissant: false » : du plus grand au plus petit.
  const cles = {
    palier: [(e) => PALIERS.indexOf(e.palier), 1], epargne: [(e) => e.tauxEpargne, -1], frais: [(e) => e.fraisParSemaine, 1],
    credit: [(e) => e.ajustementTauxCredit, 1], cashback: [(e) => regles(e).cashback ?? 0, -1], assurances: [(e) => moyenneAssurances(regles(e)), -1],
    gel: [(e) => regles(e).reductionGel ?? 0, -1], acces: [(e) => e.patrimoineMinimum, 1],
  };
  if (s.tri === "nom") return liste.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  const [f, sens] = cles[s.tri];
  return liste.sort((a, b) => sens * (f(a) - f(b)) || a.nom.localeCompare(b.nom, "fr"));
}

function dessinerOuvrir(ctx, t, { focus = null } = {}) {
  const s = etat.compte;
  const corps = document.querySelector("#feuille .corps-feuille");
  const garde = { corps: corps?.scrollTop ?? 0, banques: document.getElementById("banques-ouvrir")?.scrollLeft ?? null };
  const paliers = PALIERS.filter((p) => t.etablissements.some((e) => e.palier === p));
  const liste = etablissementsFiltres(t);
  const e = t.etablissements.find((x) => x.id === s.banque);
  const filtres = [["ouvertes", "Ouvertes"], ["sansFrais", "Sans frais"], ["cliente", "Mes banques"], ...paliers.map((p) => [`palier:${p}`, p])];
  const apercu = e && {
    ref: { compte: { _0: -1 } }, banque: e.id, banqueNom: e.nom, nature: s.nature, solde: 0, couleurs: e.couleurs, numero: "•••• 0000", detail: "",
    nom: s.nom || (s.nature === "epargne" ? "Épargne" : "Compte courant"), style: s.style,
  };
  ctx.feuille({
    titre: "Ouvrir un compte",
    contenu: `
      <div class="barre-liste">
        <input class="champ recherche" id="recherche-banque" placeholder="Banque" value="${esc(s.recherche)}" data-saisie="chercherBanque" autocomplete="off" aria-label="Chercher une banque">
        <select class="champ tri" data-saisie="trierBanques" aria-label="Trier">${TRIS.map(([v, n]) => `<option value="${v}" ${v === s.tri ? "selected" : ""}>${n}</option>`).join("")}</select>
      </div>
      <div class="defile-x">${filtres.map(([v, n]) => `<button class="petit ${s.filtres.has(v) ? "plein" : ""}" data-action="filtrerBanques" data-valeur="${esc(v)}" aria-pressed="${s.filtres.has(v)}">${esc(n)}</button>`).join("")}</div>
      <div class="legende">${liste.length} banque${liste.length > 1 ? "s" : ""}</div>
      <div class="defile-x banques" id="banques-ouvrir">${liste.map((x) => miniEtablissement(x, x.id === s.banque)).join("") || `<p class="aide">Aucune banque ne correspond.</p>`}</div>
      ${e ? `<p class="aide">${esc(e.description)}</p>
        ${e.raison ? `<p style="font-size:13px;font-weight:600;color:var(--perte)">${esc(e.raison)}</p>` : ""}
        <div class="carte">
          ${ligneCarte("Épargne", `${pct(e.tauxEpargne, 1)} par an`)}
          ${ligneCarte("Frais", e.fraisParSemaine === 0 ? "aucun" : `${eurosC(e.fraisParSemaine)} par semaine`)}
          ${ligneCarte("Crédit", e.ajustementTauxCredit === 0 ? "taux de base" : `${pctSigne(e.ajustementTauxCredit)} sur le taux`)}
          ${e.patrimoineMinimum > 0 ? ligneCarte("Accès", `dès ${euros(e.patrimoineMinimum)} de patrimoine`, e.accessible ? "" : "perte") : ""}
          ${ligneCarte("Palier", esc(e.palier))}
        </div>
        ${e.avantages.length ? `<div class="carte pad"><div class="libelle" style="margin-bottom:8px">Avec un compte chez elle</div>${e.avantages.map((a) => `<div class="avantage">${ic.coche}<span>${esc(a)}</span></div>`).join("")}</div>` : ""}` : ""}
      ${segment([["epargne", "Épargne"], ["courant", "Courant"]], s.nature, "natureCompte")}
      ${apercu ? `<div class="libelle">Style de la carte</div>${selecteurStyle(apercu, s.style, s.rares, "carrousel-ouvrir")}` : ""}
      <input class="champ nom-compte" id="nom-compte" value="${esc(s.nom)}" placeholder="${s.nature === "epargne" ? "Nom : Voiture, Vacances…" : "Nom du compte"}" data-saisie="nommerCompte" autocomplete="off" aria-label="Nom du compte">
      ${t.horsAgence ? `<p class="aide">${esc(t.horsAgence)}</p>` : ""}
      ${bouton("Ouvrir le compte", "ouvrirLeCompte", { desactive: !e?.accessible || !!t.horsAgence })}
      <button class="bouton discret" data-action="fermerFeuille">Annuler</button>`,
    actions: {
      chercherBanque(_c, el) { s.recherche = el.value; dessinerOuvrir(ctx, t, { focus: "recherche-banque" }); },
      trierBanques(_c, el) { s.tri = el.value; dessinerOuvrir(ctx, t); },
      filtrerBanques(_c, el) { const v = el.dataset.valeur; s.filtres.has(v) ? s.filtres.delete(v) : s.filtres.add(v); dessinerOuvrir(ctx, t); },
      choisirBanque(_c, el) { s.banque = el.dataset.id; s.style = null; dessinerOuvrir(ctx, t); },
      natureCompte(_c, el) { s.nature = el.dataset.valeur; dessinerOuvrir(ctx, t); },
      nommerCompte(_c, el) {
        s.nom = el.value;
        // L'aperçu porte le nom saisi : on le met à jour sans tout redessiner (le curseur reste).
        for (const n of document.querySelectorAll("#carrousel-ouvrir .noms .n")) n.textContent = s.nom || (s.nature === "epargne" ? "Épargne" : "Compte courant");
      },
      choisirStyleDiapo(_c, el) { defiler("carrousel-ouvrir", el.dataset.id); },
      async ouvrirLeCompte(_c, el) {
        el.disabled = true;
        const ok = await ctx.decider("banque", { ouvrirCompte: { banque: s.banque, nature: s.nature, nom: s.nom, ...(s.style ? { style: s.style } : {}) } }, { succes: "Compte ouvert" });
        if (!ok) el.disabled = false;
      },
    },
  });
  const nouveau = document.querySelector("#feuille .corps-feuille");
  if (nouveau) nouveau.scrollTop = garde.corps;
  const b = document.getElementById("banques-ouvrir");
  if (b && garde.banques != null) b.scrollLeft = garde.banques;
  if (focus) { const f = document.getElementById(focus); f?.focus({ preventScroll: true }); f?.setSelectionRange?.(f.value.length, f.value.length); }
  if (apercu) carrousel("carrousel-ouvrir", s.style ?? "banque", (id) => {
    s.style = id === "banque" ? null : id;
    document.getElementById("carrousel-ouvrir-nom").textContent = nomStyle(s.style);
  });
}

const ligneCarte = (titre, valeur, couleur = "") => `<div class="ligne"><span class="titre" style="flex:1;font-weight:500;color:var(--texte2)">${titre}</span><span class="valeur ${couleur}">${valeur}</span></div>`;

function miniEtablissement(e, choisie) {
  return `<button class="mini-banque ${choisie ? "choisie" : ""} ${e.accessible ? "" : "fermee"}" style="background:linear-gradient(135deg,${e.couleurs.join(",")})"
      data-action="choisirBanque" data-id="${esc(e.id)}" aria-pressed="${choisie}" aria-label="${esc(e.nom + (e.accessible ? "" : ", inaccessible") + (e.cliente ? ", tu y es client" : ""))}">
    <span class="rangee" style="align-items:flex-start;gap:6px">${logo(e.id, 18)}<span class="nom">${esc(e.nom)}</span><span class="drapeau">${e.drapeau}</span></span>
    <span class="rangee entre" style="align-items:flex-end">${puce(true)}<span class="rangee" style="gap:4px">${e.cliente ? `<span class="marque">${ic.coche}</span>` : ""}${e.accessible ? "" : `<span class="marque">${ic.cadenas}</span>`}</span></span>
  </button>`;
}

// MARK: Feuille Versements (FeuilleVersements)

const SOURCES = [
  ["focus", "Salaire et production", ic.minuteur, false], ["dividendes", "Dividendes", ic.camembert, true],
  ["loyers", "Loyers et locations", ic.maison, false], ["ventes", "Ventes", ic.etiquette, true], ["bourse", "Bourse", ic.courbe, true],
];

async function ouvrirVersements(ctx, t) {
  // TableauBanque ne porte pas encore les règles de versement : on les lit dans la partie exportée.
  const ex = await ctx.jouer("exporter", {}, { silencieux: true });
  const regles = ex?.sauvegarde?.saison?.banque?.versements ?? {};
  const courants = t.cartes.filter((c) => c.nature === "courant");
  const idCompte = (c) => (c.principal ? "principal" : `c:${c.ref.compte._0}`);
  const ligne = ([source, nom, icone, demandable]) => {
    const regle = regles[source] ?? "principal";
    const choisie = regle.startsWith("c:") ? courants.find((c) => idCompte(c) === regle) ?? courants[0] : courants.find((c) => c.principal);
    return `<div class="ligne-versement">
      <span class="rond-icone">${icone}</span>
      <span style="flex:1;min-width:0"><div class="libelle">${nom}</div><div class="aide">${regle === "demander" ? "Demandé à chaque fois" : esc(choisie?.nom ?? "Compte principal")}</div></span>
      <label class="menu-carte">${regle === "demander" ? '<span class="mini-carte demander">?</span>' : choisie ? miniCarte(choisie) : ""}
        <select data-saisie="choisirVersement" data-source="${source}" aria-label="Compte de ${nom.toLowerCase()}">
          ${courants.map((c) => `<option value="${idCompte(c)}" ${idCompte(c) === regle || (c.principal && regle === "principal") ? "selected" : ""}>${esc(c.principal ? `${c.nom} (principal)` : c.nom)}</option>`).join("")}
          ${demandable ? `<option value="demander" ${regle === "demander" ? "selected" : ""}>Demander à chaque fois</option>` : ""}
        </select></label>
    </div>`;
  };
  ctx.feuille({
    titre: "Où arrive ton argent ?",
    contenu: `<p class="aide" style="text-align:center">Chaque rentrée sur le compte courant de ton choix.</p>
      ${courants.length < 2 ? `<div class="pile" style="align-items:center;text-align:center">
          ${courants[0] ? `<span style="width:120px">${miniCarte(courants[0])}</span>` : ""}
          <p class="aide">Tout arrive sur ton compte principal. Ouvre un second compte courant pour séparer tes revenus.</p>
          ${bouton("Ouvrir un compte", "versOuvrir")}</div>`
        : `<div class="pile" style="gap:10px">${SOURCES.map(ligne).join("")}</div>`}`,
    actions: {
      versOuvrir: () => { ctx.fermerFeuille(); ouvrirCompte(ctx, t); },
      async choisirVersement(_c, el) {
        const ok = await ctx.decider("banque", { versement: { _0: el.dataset.source, _1: el.value } }, { fermer: false });
        if (ok) ouvrirVersements(ctx, ctx.etat.donnees?.t ?? t);
      },
    },
  });
}

/** « Quel compte courant devient le principal ? » (confirmationDialog). */
function choisirPrincipal(ctx, t) {
  const courants = t.cartes.filter((c) => !c.principal && c.nature === "courant");
  ctx.feuille({
    titre: "Quel compte courant devient le principal ?",
    contenu: `<p class="aide">Le salaire et les dépenses passeront par ce compte ; son solde y reste.</p>
      ${courants.length ? `<div class="carte">${courants.map((c) => `<button class="ligne" data-action="devenirPrincipal" data-compte="${c.ref.compte._0}" data-nom="${esc(c.nom)}">
        <span style="width:46px;flex:none">${miniCarte(c)}</span><span class="titre" style="flex:1">${esc(c.nom)}, ${esc(c.banqueNom)}</span><span class="chevron">${icones.chevron}</span></button>`).join("")}</div>`
        : `<p class="aide">Ouvre d'abord un autre compte courant : c'est lui qui prendra la place du principal.</p>`}
      <button class="bouton discret" data-action="fermerFeuille">Annuler</button>`,
    actions: {
      devenirPrincipal: (_c, el) => ctx.decider("banque", { fermerPrincipal: { vers: Number(el.dataset.compte) } }, { succes: `${el.dataset.nom} devient ton compte principal` }),
    },
  });
}

// MARK: Page Nouveau crédit (EcranNouveauCredit)

const pageCredit = {
  titre: "Nouveau crédit",
  async donnees(ctx) {
    const [t, b, monde] = await Promise.all([ctx.tableau("banque"), ctx.balance("banque"), ctx.tableau("monde")]);
    return { t, b, monde };
  },
  rendu(d) {
    styles();
    if (!d?.t || !d.b) return `${entetePousse("Nouveau crédit")}<div class="vide">La banque prête pendant une saison.</div>`;
    const r = d.b.credit;
    const s = etat.credit;
    const m = s.montant ?? r.montantProposeCentimes;
    const semaines = s.semaines ?? r.dureesSemaines[Math.min(2, r.dureesSemaines.length - 1)];
    const clientes = d.t.etablissements.filter((e) => e.cliente);
    const principale = d.t.cartes.find((c) => c.principal)?.banque;
    const banque = clientes.some((e) => e.id === s.banque) ? s.banque : principale;
    const etab = d.t.etablissements.find((e) => e.id === banque);
    const agence = d.monde?.endroits?.find((x) => x.id === "u:banque");
    return `${entetePousse("Nouveau crédit")}
    <div class="banque pile" style="gap:16px">
      <div class="centre-credit">
        <div class="t2" style="font-size:15px">Montant emprunté</div>
        <div class="chiffres gros" style="font-size:50px">${euros(m)}</div>
        <button class="pilule-verre" data-action="modifierMontant">Modifier</button>
      </div>
      ${clientes.length > 1 ? `<div class="defile-x">${clientes.map((b) => `<button class="petit ${b.id === banque ? "plein" : ""}" data-action="banqueCredit" data-id="${esc(b.id)}" aria-pressed="${b.id === banque}">${esc(b.nom)}</button>`).join("")}</div>` : ""}
      <div class="carte pad pile" style="gap:12px">
        <div class="libelle">Durée</div>
        ${segment(r.dureesSemaines.map((x) => [String(x), `${x} sem.`]), String(semaines), "dureeCredit")}
        <p class="aide">Durées compressées : 1 an réel = 1 semaine de jeu.</p>
      </div>
      <div class="papier">
        ${titrePapier("Offre de prêt personnel", esc(etab?.nom ?? ""))}
        <div class="champs-papier">
          ${champPapier("Montant", euros(m))}
          ${champPapier("Durée", `${semaines} semaines`)}
          ${champPapier("Taux de base", pct(r.tauxBase, 2))}
          ${champPapier(`Ajustement ${esc(etab?.nom ?? "")}`, !etab || etab.ajustementTauxCredit === 0 ? "aucun" : pctSigne(etab.ajustementTauxCredit))}
          ${champPapier("Taux selon ton profil", `${pct(r.tauxMinimum, 1).replace("\u00a0%", "")} à ${pct(r.tauxMaximum, 1)}`, true)}
        </div>
        <p class="encre2" style="font-size:12px">Le taux exact, l'échéance et le coût se fixent à la signature. La banque accepte tant que tes échéances restent sous un tiers de tes revenus, ou que ton patrimoine couvre le prêt.</p>
        <div><i class="encre2" style="font-family:Georgia,serif;font-size:13px">Lu et approuvé</i>
          <div class="pad-signature"><canvas id="signature" aria-label="Signe ici avec le doigt ou la souris"></canvas>
            <span class="invite-signature" ${s.traits.length ? "hidden" : ""}>Signe ici</span>
            <button class="recommencer" data-action="effacerSignature" ${s.traits.length ? "" : "hidden"}>Recommencer</button></div></div>
      </div>
      ${agence && !agence.ici ? `<div class="bandeau" style="--c:var(--equipe)"><div><b>À l'agence bancaire.</b> Un prêt personnel se signe sur place : rends-toi à l'${esc(agence.nom.toLowerCase())} (${String(agence.km.toFixed(1)).replace(".", ",")} km) depuis la carte du Monde.</div></div>` : ""}
      ${bouton(s.traits.length ? "Signer le crédit" : "Signe le contrat pour emprunter", "signerCredit", { desactive: !s.traits.length })}
    </div>`;
  },
  actions: {
    modifierMontant(ctx, el, d) {
      const r = d.b.credit;
      pave(ctx, {
        titre: "Montant du crédit", aide: "Prêt personnel, taux selon ton profil",
        proposition: etat.credit.montant ?? r.montantProposeCentimes, maximum: r.montantMaxCentimes,
        valider: (v) => { etat.credit.montant = v; ctx.fermerFeuille(); ctx.rafraichir(); },
      });
    },
    banqueCredit(ctx, el) { etat.credit.banque = el.dataset.id; ctx.rafraichir(); },
    dureeCredit(ctx, el) { etat.credit.semaines = Number(el.dataset.valeur); ctx.rafraichir(); },
    effacerSignature() { etat.credit.traits = []; dessinerSignature(); majSignature(); },
    async signerCredit(ctx, el, d) {
      const r = d.b.credit;
      const s = etat.credit;
      const m = s.montant ?? r.montantProposeCentimes;
      const semaines = s.semaines ?? r.dureesSemaines[Math.min(2, r.dureesSemaines.length - 1)];
      const principale = d.t.cartes.find((c) => c.principal)?.banque;
      const banque = d.t.etablissements.some((e) => e.cliente && e.id === s.banque) ? s.banque : principale;
      const avant = new Set(d.t.contrats.map(idContrat));
      el.disabled = true;
      const r2 = await ctx.jouer("decider", { famille: "banque", operation: { emprunt: { montant: m, semaines, banque } } });
      if (!r2) { el.disabled = false; return; }
      // Le crédit signé garde sa signature, comme sur l'iPhone.
      const apres = await ctx.tableau("banque");
      const nouveau = apres?.contrats.find((c) => !avant.has(idContrat(c)));
      if (nouveau) ecrire(`grind.signature.${idContrat(nouveau)}`, JSON.stringify(s.traits));
      etat.credit = { montant: null, semaines: null, banque: null, traits: [] };
      ctx.toast(`Crédit signé : ${euros(m)} sur ton compte courant`, "gain");
      ctx.sauvegarder();
      await ctx.retour();
    },
  },
};

/** Le pad de signature : des traits normalisés (0…1), dessinés à l'encre bleue. */
function brancherSignature() {
  const cv = document.getElementById("signature");
  if (!cv || cv.dataset.branche) return;
  cv.dataset.branche = "1";
  dessinerSignature();
  let trait = null;
  const point = (e) => { const r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
  cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); trait = [point(e)]; etat.credit.traits.push(trait); e.preventDefault(); });
  cv.addEventListener("pointermove", (e) => { if (!trait) return; trait.push(point(e)); dessinerSignature(); });
  const fin = () => { if (!trait) return; if (trait.length < 2) etat.credit.traits.pop(); trait = null; majSignature(); };
  cv.addEventListener("pointerup", fin);
  cv.addEventListener("pointercancel", fin);
}
function dessinerSignature() {
  const cv = document.getElementById("signature");
  if (!cv) return;
  const r = cv.getBoundingClientRect();
  const k = devicePixelRatio || 1;
  if (cv.width !== Math.round(r.width * k)) { cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k); }
  const g = cv.getContext("2d");
  g.clearRect(0, 0, cv.width, cv.height);
  g.strokeStyle = "#1F3A8A"; g.lineWidth = 2.2 * k; g.lineCap = "round"; g.lineJoin = "round";
  for (const t of etat.credit.traits) {
    g.beginPath();
    t.forEach(([x, y], i) => (i ? g.lineTo(x * cv.width, y * cv.height) : g.moveTo(x * cv.width, y * cv.height)));
    g.stroke();
  }
}
function majSignature() {
  const signe = etat.credit.traits.length > 0;
  document.querySelector(".invite-signature")?.toggleAttribute("hidden", signe);
  document.querySelector(".recommencer")?.toggleAttribute("hidden", !signe);
  const b = document.querySelector("[data-action=signerCredit]");
  if (b) { b.disabled = !signe; b.textContent = signe ? "Signer le crédit" : "Signe le contrat pour emprunter"; }
}
// Le canvas arrive avec la page : on le branche dès qu'il apparaît.
new MutationObserver(() => brancherSignature()).observe(document.documentElement, { childList: true, subtree: true });

// MARK: Page Assurances (EcranAssurances, CarteCategorieAssurance, FeuilleAssuranceElement)

const pageAssurances = {
  titre: "Assurances",
  async donnees(ctx) {
    const [a, t, b] = await Promise.all([ctx.tableau("assurances"), ctx.tableau("banque"), ctx.balance("banque")]);
    return { a, t, b };
  },
  rendu(d) {
    styles();
    if (!d?.a) return `${entetePousse("Assurances")}<div class="vide">Les assurances s'ouvrent avec ta première saison.</div>`;
    const a = d.a;
    return `${entetePousse("Assurances")}
    <div class="banque pile" style="gap:18px;padding-top:12px">
      <div style="padding-bottom:6px">${policeAssurance(a, false)}</div>
      ${a.categories.map((c) => categorie(c, d)).join("")}
      ${a.sinistres.length ? sinistres(a) : ""}
    </div>`;
  },
  actions: {
    ouvrirElement(ctx, el, d) { feuilleElement(ctx, el.dataset.categorie, el.dataset.element); },
    aligner(ctx, el, d) {
      const c = d.a.categories.find((x) => x.id === el.dataset.categorie);
      ctx.feuille({
        titre: `Tout aligner : ${c.nom.toLowerCase()}`,
        contenu: `<div class="carte">${c.options.map((o) => `<button class="ligne" data-action="alignerNiveau" data-niveau="${o.id}" data-nom="${esc(o.nom)}">
          <span style="flex:1"><div class="titre">${esc(o.nom)}</div><div class="detail">${esc(o.detail)}</div></span><span class="valeur">${euros(o.primeSemaine)}</span></button>`).join("")}</div>
          <button class="bouton discret" data-action="fermerFeuille">Annuler</button>`,
        actions: {
          alignerNiveau: (_c, b) => ctx.decider("assurances", { choisir: { _0: c.id, niveau: Number(b.dataset.niveau) } }, { succes: `${c.nom} : tout en ${b.dataset.nom.toLowerCase()}` }),
        },
      });
    },
  },
};

function categorie(c, d) {
  const nomNiveau = (e) => e.options.find((o) => o.id === e.assure.niveau)?.nom.toLowerCase() ?? "non assuré";
  const nomBanque = (id) => (id === "" ? "assureur indépendant" : id ? d.b?.etablissements?.find((x) => x.id === id)?.nom ?? "" : "");
  return `<div class="carte pad ${c.nombre > 0 ? "" : "estompee"}">
    <div class="rangee entre" style="align-items:flex-start;padding-bottom:${c.nombre > 0 ? 6 : 0}px">
      <div><div class="libelle">${esc(c.nom)}</div><div class="aide">${esc(c.detail)}</div></div>
      ${c.nombre > 0 ? `<div style="text-align:right"><div class="chiffres" style="font-size:15px">${euros(c.primeSemaine)} par semaine</div>
        ${c.nombre > 1 ? `<button class="lien-discret" data-action="aligner" data-categorie="${c.id}">Tout aligner</button>` : ""}</div>` : ""}
    </div>
    ${c.elements.map((e) => `<button class="ligne-assure" data-action="ouvrirElement" data-categorie="${c.id}" data-element="${esc(e.assure.id)}" aria-label="${esc(e.assure.nom)} : choisir son assurance">
      <span style="flex:1;min-width:0"><div class="nom">${esc(e.assure.nom)}</div>
        <div class="${e.assure.niveau === 0 ? "alerte" : "t2"}" style="font-size:12px">${esc([e.assure.detail, nomNiveau(e), nomBanque(e.assure.banque)].filter(Boolean).join(", "))}</div></span>
      <span class="chiffres" style="font-size:14px">${euros(e.assure.primeSemaine)}</span><span class="t3" style="width:12px;flex:none">${ic.chevron}</span>
    </button>`).join("")}
  </div>`;
}

function sinistres(a) {
  const quand = (ms) => new Date(ms).toLocaleString("fr-BE", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  return `<div class="carte pad">
    <div class="rangee entre" style="align-items:baseline;margin-bottom:4px"><span class="libelle">Derniers sinistres</span>
      ${a.rembourse > 0 ? `<span class="gain" style="font-size:13px;font-weight:500">${euros(a.rembourse)} pris en charge</span>` : ""}</div>
    ${a.sinistres.map((s) => `<div class="sinistre">
      <div class="rangee entre" style="align-items:baseline"><span style="font-size:14px;font-weight:600">${esc(s.titre)}</span><span class="t2" style="font-size:12px">${quand(s.date)}</span></div>
      <div class="rangee" style="gap:10px;flex-wrap:wrap;font-size:13px"><span class="t2">Dégâts ${euros(s.degats)}</span>
        ${s.indemnite > 0 ? `<span class="gain">${esc(s.niveau)} ${euros(s.indemnite)}</span>` : ""}
        ${s.reste > 0 ? `<span class="perte">Pour toi ${euros(s.reste)}</span>` : ""}</div>
      ${s.compensation > 0 ? `<div class="aide">Le fautif a versé ${euros(s.compensation)}</div>` : ""}
    </div>`).join("")}
  </div>`;
}

/** Les niveaux d'un seul véhicule, bien ou boîte, puis la banque qui l'assure. */
function feuilleElement(ctx, idCat, idEl) {
  const d = ctx.etat.donnees;
  const c = d?.a?.categories.find((x) => x.id === idCat);
  const e = c?.elements.find((x) => x.assure.id === idEl);
  if (!e) return ctx.fermerFeuille();
  const clientes = (d.t?.etablissements ?? []).filter((x) => x.cliente);
  // RNT-169 : la remise de la banque sur cette catégorie ; null : elle ne l'assure pas ; négative : une surcharge.
  const remise = (id) => {
    const x = d.b?.etablissements?.find((y) => y.id === id);
    if (!x) return 0;
    if (!x.assurances) return x.remiseAssurances ?? 0;
    return x.assurances[idCat] ?? null;
  };
  const texteRemise = (r) => (r === null ? "n'assure pas" : r > 0 ? `−${pct(r)}` : r < 0 ? `+${pct(-r)}` : "sans remise");
  const classeRemise = (r) => (r === null ? "t3" : r > 0 ? "gain" : r < 0 ? "perte" : "t2");
  const banqueActuelle = e.assure.banque ?? d.t?.cartes.find((x) => x.principal)?.banque;
  const radio = (on) => `<span class="radio ${on ? "on" : ""}" aria-hidden="true"></span>`;
  ctx.feuille({
    titre: e.assure.nom,
    rendu: () => {
      // Redessinée après chaque choix : on relit l'élément à jour.
      const dd = ctx.etat.donnees;
      const cc = dd?.a?.categories.find((x) => x.id === idCat);
      const ee = cc?.elements.find((x) => x.assure.id === idEl) ?? e;
      const actuelle = ee.assure.banque ?? dd?.t?.cartes.find((x) => x.principal)?.banque ?? banqueActuelle;
      return `<p class="aide">${esc(ee.assure.detail ? `${c.nom}, ${ee.assure.detail}` : c.nom)}</p>
      ${ee.options.map((o) => `<button class="option-assurance ${o.id === ee.assure.niveau ? "choisie" : ""}" data-action="reglerNiveau" data-niveau="${o.id}" data-nom="${esc(o.nom)}" aria-pressed="${o.id === ee.assure.niveau}">
        ${radio(o.id === ee.assure.niveau)}
        <span style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${esc(o.nom)}</div><div class="aide">${esc(o.detail)}</div></span>
        <span style="text-align:right;flex:none"><div class="chiffres" style="font-size:14px">${euros(o.primeSemaine)} / sem.</div>${o.franchise > 0 ? `<div class="t2" style="font-size:12px">franchise ${euros(o.franchise)}</div>` : ""}</span>
      </button>`).join("")}
      <div class="libelle" style="margin-top:8px">Assuré par</div>
      <p class="aide">Chaque banque a sa spécialité : une grosse remise sur une sorte de bien, une surcharge ou un refus sur une autre. Seules celles où tu as un compte peuvent t'assurer.</p>
      <div class="carte">${clientes.map((b) => { const r = remise(b.id); return `<button class="ligne" data-action="assureur" data-banque="${esc(b.id)}" data-nom="${esc(b.nom)}" aria-pressed="${b.id === actuelle}" ${r === null ? 'disabled style="opacity:.55"' : ""}>
        ${radio(b.id === actuelle)}<span class="titre" style="flex:1;font-size:14px">${esc(b.nom)}</span>
        <span style="font-size:13px;font-weight:500" class="${classeRemise(r)}">${texteRemise(r)}</span></button>`; }).join("")}
        ${actuelle === "" ? `<div class="ligne" aria-current="true">${radio(true)}<span class="titre" style="flex:1;font-size:14px">Assureur indépendant</span><span class="t2" style="font-size:13px;font-weight:500">sans remise</span></div>` : ""}</div>
      ${bouton("OK", "fermerFeuille", { genre: "secondaire" })}`;
    },
    actions: {
      reglerNiveau(_c, b) {
        if (b.getAttribute("aria-pressed") === "true") return;
        return ctx.decider("assurances", { regler: { _0: idCat, element: idEl, niveau: Number(b.dataset.niveau) } }, { succes: `${e.assure.nom} : ${b.dataset.nom.toLowerCase()}`, fermer: false });
      },
      assureur(_c, b) {
        if (b.getAttribute("aria-pressed") === "true") return;
        return ctx.decider("assurances", { banque: { _0: idCat, element: idEl, banque: b.dataset.banque } }, { succes: `${e.assure.nom} : assuré par ${b.dataset.nom}`, fermer: false });
      },
    },
  });
}

/** RNT-169 : la remise moyenne d'une banque sur les trois catégories (refusée : zéro), pour trier. */
function moyenneAssurances(e) {
  if (!e?.assurances) return e?.remiseAssurances ?? 0;
  return ["vehicules", "biens", "boites"].reduce((s, k) => s + (e.assurances[k] ?? 0), 0) / 3;
}

// MARK: Page Impôts (EcranImpots)

const pageImpots = {
  titre: "Impôts",
  async donnees(ctx) { return { i: await ctx.tableau("impots") }; },
  rendu(d) {
    styles();
    const t = d?.i;
    if (!t) return `${entetePousse("Impôts")}<div class="vide">Les impôts se calculent pendant une saison.</div>`;
    return `${entetePousse("Impôts")}
    <div class="banque pile" style="gap:18px">
      ${herosImpots(t)}
      ${decompte(t)}
      ${t.sources.length ? remuneration(t) : ""}
      ${carteDon(t)}
      ${t.investissements.length ? investir(t) : ""}
      ${t.prevision.boites.some((b) => b.provisionPossible > 0) || t.provisions.length ? provisionner(t) : ""}
      ${t.amortissements.length || t.provisions.length ? courent(t) : ""}
    </div>`;
  },
  actions: {
    // RNT-173 : la page Impôts ne verse plus elle-même ; elle mène à la holding.
    async versHolding(ctx) {
      try { localStorage.setItem("actifs.onglet", "entreprises"); } catch {}
      await ctx.allerOnglet("actifs");
    },
    donMontant(ctx, el) {
      if (el.dataset.valeur === "autre") {
        return pave(ctx, { titre: "Combien donner ?", proposition: etat.impots.don, maximum: ctx.etat.donnees?.i?.disponible ?? null, valider: (v) => { etat.impots.don = v; ctx.fermerFeuille(); ctx.rafraichir(); } });
      }
      etat.impots.don = Number(el.dataset.valeur);
      ctx.rafraichir();
    },
    donner: (ctx) => ctx.decider("fiscalite", { don: { _0: etat.impots.don } }, { succes: `Don de ${euros(etat.impots.don)}, merci` }),
    machines(ctx, el) {
      return ctx.decider("entreprises", { machines: { boite: Number(el.dataset.boite) } }, { succes: `${el.dataset.nom} : machines niveau ${el.dataset.niveau}, amorties sur ${ctx.etat.donnees?.i?.regles?.semainesAmortissement ?? 4} semaines` });
    },
    provision(ctx, el) {
      const m = Number(el.dataset.montant);
      return ctx.decider("fiscalite", { provision: { boite: Number(el.dataset.boite), montant: m } }, { succes: `${euros(m)} provisionnés` });
    },
  },
};

const sourceChoisie = (t) => t.sources.find((s) => s.id === etat.impots.source || idSource(s) === etat.impots.source) ?? t.sources[0];
const idSource = (s) => (s.boite != null ? `b${s.boite}` : "holding");

/** La clôture est minuit : on dit le jour qui se termine. */
const jourCloture = (ms) => `${new Date(ms - 1).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" })} à minuit`;

function herosImpots(t) {
  // PrevisionFiscale.total (calculé côté Swift, pas encore exporté) : impôt des personnes − réduction pour dons + sociétés.
  const total = t.prevision.impotPersonnes - t.prevision.reductionDons + t.prevision.boites.reduce((s, b) => s + b.impot, 0);
  return `<div style="padding-top:8px">
    <div class="libelle">Dû dimanche à minuit, à ce jour</div>
    <div class="chiffres" style="font-size:40px;margin:2px 0 4px">${euros(total)}</div>
    <p class="aide">L'exercice se clôt ${jourCloture(t.cloture)}. Tout ce qui suit est légal ; l'effet de chaque choix s'affiche avant de valider.</p>
  </div>`;
}

function decompte(t) {
  const p = t.prevision;
  const total = p.impotPersonnes - p.reductionDons + p.boites.reduce((s, b) => s + b.impot, 0);
  return `<div class="papier empile">
    ${titrePapier("Décompte de l'exercice", `Semaine ${p.semaine + 1}, ce qui est gagné jusqu'ici`)}
    ${t.regime ? `<p style="font-size:11px;color:var(--encre2,#6b6355);margin:-4px 0 8px">${esc(t.regime.nom)}. ${esc(t.regime.description)}</p>` : ""}
    <div class="champs-papier">
      ${champPapier("Salaire et production", euros(p.revenus))}
      ${p.salaires > 0 ? champPapier("Salaires de dirigeant, nets", euros(p.salaires)) : ""}
      ${champPapier(`Impôt des personnes, tranche à ${pctImpot(p.tauxMarginal)}`, euros(p.impotPersonnes))}
      ${p.tauxMarginalSalaire != null && p.salaires > 0 ? `<div class="encre2" style="font-size:11px">Tes salaires de dirigeant ont leur propre barème : tranche à ${pctImpot(p.tauxMarginalSalaire)}.</div>` : ""}
      ${p.reductionDons > 0 ? champPapier("Réduction pour dons", variation(-p.reductionDons)) : ""}
      ${p.boites.map((b) => `<div>${champPapier(`Sociétés, ${esc(b.nom)}`, euros(b.impot))}<div class="encre2" style="font-size:11px;margin-top:3px">Bénéfice ${euros(b.benefice)}${b.deductions > 0 ? `, déductions ${variation(-b.deductions)}` : ""}${b.reprises > 0 ? `, reprises ${variation(b.reprises)}` : ""}, taux ${pctImpot(b.taux)}</div></div>`).join("")}
      ${champPapier("Total", euros(total), true)}
    </div>
    <p class="encre2" style="font-size:12px">Part exonérée : ${euros(t.exonereParSemaine)} de revenu par semaine.</p>
  </div>`;
}

const groupe = (titre, icone, contenu) => `<div class="carte pad pile" style="gap:12px">
  <div class="rangee" style="gap:8px"><span style="width:20px;flex:none">${icone}</span><span class="libelle">${titre}</span></div>${contenu}</div>`;
const avantage = (t) => `<div class="avantage">${ic.coche}<span>${t}</span></div>`;
const limite = (t) => `<div class="avantage limite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 12h12"/></svg><span>${t}</span></div>`;

function remuneration(t) {
  const s = sourceChoisie(t);
  const r = t.regles;
  return groupe("Te verser de l'argent", ic.personne, `
    <p class="aide">${s.taux == null ? "Depuis ta holding : un salaire ne s'y déduit de rien. Il ne vaut la peine que dans ta part exonérée."
      : "Un salaire modéré pour le taux réduit et les tranches basses, le reste en dividendes : c'est le bon dosage."}</p>
    <div class="pile" style="gap:10px">
      <div class="pile" style="gap:6px"><div class="sous-titre">Le salaire</div>
        ${r.salaireBaremeSepare ? avantage("Son propre barème : il ne s'ajoute pas à ton focus, les premiers euros sont exonérés") : ""}
        ${r.pensionPart != null ? avantage(`${pctImpot(r.pensionPart)} des cotisations (${pctImpot(r.cotisationsSalaire)}) te reviennent en pension, en fin de saison`) : ""}
        ${r.salaireMinimumTauxReduitCentimes != null && r.reductionIsocSalaire != null && s.boite != null ? avantage(s.tauxReduit
          ? `Taux réduit obtenu : ${pctImpot(r.reductionIsocSalaire)} d'impôt des sociétés en moins cette semaine`
          : `Dès ${euros(r.salaireMinimumTauxReduitCentimes)} (ou son bénéfice), la boîte paie ${pctImpot(r.reductionIsocSalaire)} d'impôt des sociétés en moins`) : ""}
        ${avantage("La banque le compte dans ton revenu : plus de crédit")}
        ${r.partDeductibleSalaire != null && r.partDeductibleSalaire < 1 && s.boite != null ? limite(`Déduit à ${pctImpot(r.partDeductibleSalaire)} seulement : la boîte reste imposée sur le reste`) : ""}
      </div>
      <div class="pile" style="gap:6px"><div class="sous-titre">Le dividende</div>
        ${avantage(`${pctImpot(s.precompte)} de précompte, rien d'autre : ni cotisations ni barème, même sur un gros montant`)}
        ${r.precompteReduit != null && r.joursPrecompteReduit != null && s.boite != null ? (s.precompte <= r.precompteReduit
          ? avantage(`Boîte installée : précompte réduit à ${pctImpot(r.precompteReduit)}`)
          : limite(`Précompte réduit à ${pctImpot(r.precompteReduit)} une fois la boîte ouverte depuis ${r.joursPrecompteReduit} jours`)) : ""}
        ${limite("Partagé avec les investisseurs de la boîte")}
      </div>
    </div>
    ${bouton("Te verser depuis ta holding", "versHolding", { genre: "teinte", teinte: "var(--argent)" })}
    <p class="aide">Le versement se fait depuis ta holding (Actifs › Entreprises) ou une boîte : le meilleur partage y est calculé pour toi.</p>`);
}

function carteDon(t) {
  const don = etat.impots.don;
  const choix = [10_000, 50_000, 100_000];
  return groupe("Faire un don", ic.coeur, `
    <p class="aide">${pctImpot(t.regles.reductionDon)} du don reviennent en réduction d'impôt, pour des dons jusqu'à ${pctImpot(t.regles.plafondDonPart)} de ton revenu de la semaine. Tes boîtes y gagnent en réputation.</p>
    <div class="grille-don">${choix.map((m) => `<button class="petit ${don === m ? "plein" : ""}" data-action="donMontant" data-valeur="${m}" aria-pressed="${don === m}">${euros(m)}</button>`).join("")}
      <button class="petit ${choix.includes(don) ? "" : "plein"}" data-action="donMontant" data-valeur="autre">${choix.includes(don) ? "Autre" : euros(don)}</button></div>
    ${bouton(`Donner ${euros(don)}`, "donner", { genre: "secondaire", desactive: don <= 0 || don > t.disponible })}`);
}

function investir(t) {
  return groupe("Investir dans une boîte", ic.engrenages, `
    <p class="aide">Des machines : la boîte produit plus, et leur coût se déduit de son bénéfice, par quarts, ${t.regles.semainesAmortissement} dimanches de suite.</p>
    ${t.investissements.map((i) => `<div class="rangee" style="align-items:flex-start">
      <div style="flex:1;min-width:0"><div class="libelle">${esc(i.nom)}, machines niveau ${i.niveau}</div>
        <div class="t2" style="font-size:12px">${euros(i.cout)}, ${euros(i.deductionSemaine)} déduits chaque dimanche</div>
        ${i.refus ? `<div class="t2" style="font-size:12px">${esc(i.refus)}</div>` : i.economie > 0 ? `<div class="gain" style="font-size:12px;font-weight:600">Impôt de dimanche ${variation(-i.economie)}</div>` : ""}</div>
      ${i.refus ? "" : petit("Investir", "machines", { donnees: { boite: i.id, nom: i.nom, niveau: i.niveau } })}
    </div>`).join("")}`);
}

function provisionner(t) {
  const r = t.regles;
  return groupe("Provisionner", ic.plateau, `
    <p class="aide">${t.derniereSemaine ? "Dernière semaine de la saison : une provision serait reprise dimanche même, elle ne ferait rien gagner."
      : `Mettre de côté jusqu'à ${pctImpot(r.provisionMaxPart)} du bénéfice de la semaine : déduit dimanche, repris dans ${r.semainesProvision} semaines (ou au dernier dimanche de la saison). L'argent reste dans la boîte.`}</p>
    ${t.prevision.boites.filter((b) => b.provisionPossible > 0).map((b) => `<div class="rangee" style="align-items:flex-start">
      <div style="flex:1;min-width:0"><div class="libelle">${esc(b.nom)}</div><div class="t2" style="font-size:12px">Jusqu'à ${euros(b.provisionPossible)}</div></div>
      ${petit("Provisionner", "provision", { donnees: { boite: b.id, montant: b.provisionPossible } })}
    </div>`).join("")}`);
}

function courent(t) {
  return groupe("Ce qui court", ic.horloge, [...t.amortissements, ...t.provisions].map((l) =>
    `<div><div style="font-size:14px;font-weight:600">${esc(l.titre)}</div><div class="t2" style="font-size:12px">${esc(l.detail)}</div></div>`).join(""));
}

// MARK: Les pages de la zone

// Lot A : au palier large, les pages de détail s'ouvrent à droite de la Banque (liste + détail).
export const pages = {
  banque: pageBanque,
  "banque.credit": { ...pageCredit, panneau: true },
  "banque.assurances": { ...pageAssurances, panneau: true },
  assurances: pageAssurances,
  "banque.impots": { ...pageImpots, panneau: true },
};

// MARK: Styles locaux (fiche Graphite, objets de la banque)

function styles() {
  if (document.getElementById("styles-banque")) return;
  const s = document.createElement("style");
  s.id = "styles-banque";
  s.textContent = CSS_BANQUE;
  document.head.append(s);
}

const CSS_BANQUE = `
.rond.grand { width: 40px; height: 40px; }
.rond.grand svg { width: 19px; height: 19px; }
.banque { display: flex; flex-direction: column; gap: 18px; }
.banque .liquidites .gros, .centre-credit .gros { font-size: 48px; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.banque .bouton svg { width: 18px; height: 18px; }
.banque .libelle.bloc { margin-top: 8px; margin-bottom: -6px; }
.ligne-revenu { display: flex; align-items: center; gap: 12px; padding: 12px 16px; width: 100%; text-align: left; }
.gel { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 16px; font-size: 14px; font-weight: 600; color: var(--alerte); background: color-mix(in srgb, var(--alerte) 12%, transparent); }
.gel .petit { color: var(--alerte); border-color: color-mix(in srgb, var(--alerte) 40%, transparent); }

/* La pile de cartes : chaque objet couvre le précédent, sauf une bande de ${BANDE} px. */
.pile-cartes { display: flex; flex-direction: column; }
.pile-cartes > .rangee-pile { margin-top: calc(${BANDE}px - ${(100 / RAPPORT).toFixed(3)}%); }
.pile-cartes > .premiere-rangee { margin-top: 18px; }
.pile-cartes > .carte-bancaire, .pile-cartes > .portefeuille { cursor: pointer; position: relative; }
.pile-cartes > .panneau { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }
.palier { padding: 14px; border-radius: 14px; background: rgba(255,255,255,.04); display: flex; flex-direction: column; gap: 8px; }
.avantage { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; line-height: 1.4; }
.avantage svg { width: 12px; height: 12px; flex: none; margin-top: 3px; color: var(--gain); }
.avantage.limite { color: var(--texte2); } .avantage.limite svg { color: var(--texte3); }

/* CarteBancaire */
.carte-bancaire {
  position: relative; width: 100%; aspect-ratio: ${RAPPORT}; border-radius: 18px; padding: 18px; color: var(--encre);
  background: var(--fond); box-shadow: 0 8px 28px rgba(0,0,0,.45); border: 1px solid rgba(255,255,255,.14);
  display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; isolation: isolate; text-align: left;
}
.carte-bancaire .motif { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
.carte-bancaire .reflet { position: absolute; inset: 0; z-index: -1; background: linear-gradient(135deg, transparent 25%, rgba(255,255,255,.13) 45%, transparent 62%); }
.carte-bancaire .haut, .portefeuille .haut { display: flex; align-items: center; gap: 10px; }
.carte-bancaire .noms, .portefeuille .noms { flex: 1; min-width: 0; }
.carte-bancaire .noms .b, .portefeuille .noms .b { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.carte-bancaire .noms .n, .portefeuille .noms .n { font-size: 12px; font-weight: 500; opacity: .72; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.carte-bancaire .solde, .portefeuille .solde { font-size: 19px; white-space: nowrap; }
.carte-bancaire .solde.negatif { color: var(--perte); }
.carte-bancaire .milieu { display: flex; align-items: center; justify-content: space-between; }
.carte-bancaire .ondes { width: 22px; opacity: .7; }
.carte-bancaire .livret { display: flex; align-items: center; gap: 10px; }
.carte-bancaire .livret > svg { width: 22px; height: 22px; }
.carte-bancaire .livret b { display: block; font: 600 15px/1.2 Georgia, "Times New Roman", serif; }
.carte-bancaire .livret small { display: block; font-size: 11px; font-weight: 500; opacity: .7; }
.carte-bancaire .bas { display: flex; align-items: baseline; justify-content: space-between; }
.carte-bancaire .numero { font: 500 14px ui-monospace, "SF Mono", Menlo, monospace; opacity: .85; }
.carte-bancaire .genre { font-size: 12px; font-weight: 600; opacity: .6; }
.logo-banque { flex: none; display: block; }
.logo-sigle { font: 700 13px Georgia, "Times New Roman", serif; letter-spacing: .06em; flex: none; line-height: 1; }
.logo-sigle.cadre { border: 1px solid currentColor; padding: 2px 4px; font-weight: 600; }
.puce-carte { position: relative; width: 42px; height: 32px; border-radius: 6px; flex: none; background: linear-gradient(135deg, #E9D18A, #B08D3E); }
.puce-carte i { position: absolute; left: 6px; right: 6px; height: 1px; background: rgba(0,0,0,.18); top: 11px; }
.puce-carte i + i { top: 19px; }
.puce-carte b { position: absolute; top: 6px; bottom: 6px; left: 50%; width: 1px; background: rgba(0,0,0,.18); }
.puce-carte.petite { width: 25px; height: 19px; border-radius: 4px; }
.puce-carte.petite i { left: 4px; right: 4px; top: 6px; } .puce-carte.petite i + i { top: 12px; } .puce-carte.petite b { top: 4px; bottom: 4px; }

/* Portefeuille */
.portefeuille { position: relative; width: 100%; aspect-ratio: ${RAPPORT}; padding-top: 16px; text-align: left; }
.portefeuille .liasse { position: absolute; left: 34px; right: 34px; top: 16px; height: 70px; }
.portefeuille .billet { position: absolute; inset: 0; border-radius: 5px; background: linear-gradient(135deg, var(--c1), var(--c2)); border: .5px solid rgba(255,255,255,.25); box-shadow: 0 1px 2px rgba(0,0,0,.2); transition: transform .45s cubic-bezier(.2,.9,.25,1); }
.portefeuille .billet i { position: absolute; right: 9px; top: 6px; font: 800 16px ui-rounded, system-ui, sans-serif; font-style: normal; color: rgba(0,0,0,.3); }
.portefeuille .cuir {
  position: relative; height: 100%; border-radius: 20px; padding: 18px; color: #F3E6D6; display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(#6B4529, #3A2414); box-shadow: 0 8px 28px rgba(0,0,0,.45);
}
.portefeuille .cuir::before { content: ""; position: absolute; inset: 6px; border-radius: 15px; border: 1px dashed rgba(232,201,155,.35); pointer-events: none; }
.portefeuille .noms .n { opacity: .65; }
.portefeuille .fermoir { align-self: flex-end; width: 46px; height: 14px; border-radius: 99px; background: #2A1A0F; display: grid; place-items: center; }
.portefeuille .fermoir i { width: 8px; height: 8px; border-radius: 50%; background: #C9A15B; }

/* Papier */
.papier { position: relative; background: #F1EEE7; color: #1D1C1A; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 6px 20px rgba(0,0,0,.35); text-align: left; width: 100%; }
.papier.empile::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: 10px; background: rgba(241,238,231,.55); transform: translateY(4px) rotate(1.4deg); }
.papier .encre2, .encre2 { color: #6B675F; }
.titre-papier { flex: 1; min-width: 0; }
.titre-papier h3 { font: 600 20px/1.2 Georgia, "Times New Roman", serif; }
.titre-papier div { font: 400 12px/1.35 var(--police); color: #6B675F; margin-top: 2px; }
.champ-papier span { flex: none; }
.champs-papier { display: flex; flex-direction: column; gap: 9px; }
.champ-papier { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding-bottom: 7px; border-bottom: 1px solid rgba(29,28,26,.12); }
.champ-papier span { font-size: 13px; color: #6B675F; }
.champ-papier b { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
.champ-papier.fort b { font-size: 17px; font-weight: 700; }
.talon { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding-top: 10px; border-top: 1px dashed rgba(29,28,26,.3); }
.talon span { font-size: 13px; color: #6B675F; }
.talon b { font: 700 24px Georgia, "Times New Roman", serif; font-variant-numeric: tabular-nums; white-space: nowrap; }
.tampon-banque { width: 26px; height: 26px; border-radius: 50%; flex: none; border: 1px solid rgba(29,28,26,.25); }
.tampon-assure { width: 58px; height: 58px; flex: none; border-radius: 50%; border: 1.5px solid rgba(31,58,138,.6); color: rgba(31,58,138,.75); display: grid; place-content: center; justify-items: center; transform: rotate(-10deg); }
.tampon-assure svg { width: 16px; height: 16px; }
.tampon-assure b { font: 700 9px Georgia, serif; }
.tampon-assure.non { border-color: rgba(155,44,44,.6); color: rgba(155,44,44,.75); }
.rail-papier { height: 3px; border-radius: 99px; background: rgba(29,28,26,.12); overflow: hidden; }
.rail-papier i { display: block; height: 100%; background: #1D1C1A; border-radius: 99px; }
.lu { display: flex; flex-direction: column; gap: 2px; }
.lu i { font: italic 13px Georgia, serif; color: #6B675F; }
.lu .ligne-signature { width: 130px; height: 1px; background: rgba(29,28,26,.4); }
.bouton-encre, .etiquette-encre { display: inline-flex; align-items: center; gap: 4px; padding: 0 16px; min-height: 36px; border-radius: 99px; font-size: 13px; font-weight: 600; color: #F1EEE7; background: #1D1C1A; flex: none; }
.etiquette-encre { min-height: 32px; padding: 0 14px; }
.lien-papier { display: block; width: 100%; padding: 0; }
.lien-papier:active .papier { transform: scale(.99); }
.demande-credit { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 12px; border: 1.2px dashed var(--filet2); width: 100%; text-align: left; }

/* Congés */
.conges { display: flex; flex-direction: column; gap: 14px; }
.tickets { display: flex; gap: 5px; }
.tickets i { flex: 1; height: 26px; border-radius: 5px; background: var(--accent); opacity: .9; }
.tickets i.pris { background: var(--puce); border: 1px dashed var(--filet2); opacity: 1; }

/* Feuilles : rien ne s'écrase dans la colonne (un défilement horizontal y rétrécirait). */
#feuille .corps-feuille > * { flex-shrink: 0; }
.fiche-aide { display: flex; gap: 12px; align-items: flex-start; }
.fiche-aide .exemple { font-size: 13px; color: var(--texte); margin-top: 6px; padding: 10px 12px; border-radius: 12px; background: var(--puce); }
.etapes { display: flex; gap: 6px; justify-content: center; }
.etapes i { width: 8px; height: 8px; border-radius: 99px; background: var(--puce2); transition: width .3s var(--courbe-graphite), background .3s; }
.etapes i.faite { background: var(--accent); } .etapes i.active { width: 22px; }
.titre-etape { font-size: 20px; font-weight: 600; text-align: center; }
.carrousel { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 10px 28px 18px; margin: 0 -20px; scrollbar-width: none; }
.carrousel::-webkit-scrollbar { display: none; }
.carrousel .diapo { flex: 0 0 calc(100% - 56px); scroll-snap-align: center; transition: transform .3s var(--courbe-graphite), opacity .3s; transform: scale(.9); opacity: .6; cursor: pointer; }
.carrousel .diapo.choisie { transform: none; opacity: 1; }
.legende-diapo { text-align: center; min-height: 40px; }
.trajet { display: inline-flex; align-self: center; align-items: center; gap: 10px; min-height: 44px; padding: 0 16px; border-radius: 99px; border: 1px solid var(--filet2); font-size: 15px; font-weight: 600; max-width: 100%; }
.trajet span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pave { display: flex; flex-direction: column; gap: 14px; }
.montant-pave { display: flex; align-items: baseline; justify-content: center; gap: 6px; }
.montant-pave input { min-width: 0; max-width: 78%; text-align: center; padding: 0; background: none; border: 0; outline: none; font-size: 50px; font-weight: 600; letter-spacing: -.05em; font-variant-numeric: tabular-nums; color: var(--texte); caret-color: var(--accent); }
.montant-pave input::placeholder { color: var(--texte2); }
.montant-pave span { font-size: 24px; font-weight: 600; color: var(--texte2); flex: none; }
.choix.centre { justify-content: center; }
.touches { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.touches button { min-height: 54px; border-radius: 16px; background: rgba(255,255,255,.05); font-size: 26px; font-weight: 500; text-align: center; display: grid; place-items: center; font-variant-numeric: tabular-nums; transition: transform .12s, background .12s; }
.touches button:active { transform: scale(.96); background: rgba(255,255,255,.1); }
.barre-liste { display: flex; gap: 8px; }
.barre-liste .recherche { flex: 1; min-height: 44px; font-size: 15px; font-weight: 500; }
.barre-liste .tri { width: auto; min-height: 44px; font-size: 14px; font-weight: 600; background-position: calc(100% - 20px) 19px, calc(100% - 15px) 19px; }
.defile-x { display: flex; gap: 8px; overflow-x: auto; margin: 0 -20px; padding: 2px 20px; scrollbar-width: none; }
.defile-x::-webkit-scrollbar { display: none; }
.defile-x.banques { gap: 12px; padding: 6px 20px; }
.mini-banque { flex: none; width: 150px; aspect-ratio: ${RAPPORT}; border-radius: 12px; padding: 12px; color: #fff; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255,255,255,.12); transform: scale(.94); transition: transform .25s var(--courbe-graphite); text-align: left; }
.mini-banque.choisie { transform: none; border: 2.5px solid var(--accent); }
.mini-banque.fermee { opacity: .6; }
.mini-banque .nom { font-size: 13px; font-weight: 600; flex: 1; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.mini-banque .drapeau { font-size: 15px; line-height: 1; }
.mini-banque .marque { width: 14px; height: 14px; display: grid; }
.mini-banque .marque svg { width: 14px; height: 14px; }
.nom-compte { font-size: 16px; font-weight: 500; min-height: 48px; border-radius: 14px; background: none; }
.mini-carte { position: relative; display: block; width: 100%; aspect-ratio: ${RAPPORT}; border-radius: 7px; border: .6px solid rgba(255,255,255,.18); box-shadow: 0 2px 6px rgba(0,0,0,.35); }
.mini-carte i { position: absolute; left: 11%; top: 14%; width: 17%; height: 19%; border-radius: 2px; background: linear-gradient(#E9D9A6, #B8995A); }
.mini-carte.demander { display: grid; place-items: center; border: 1.2px dashed var(--filet2); box-shadow: none; font-weight: 700; color: var(--texte2); font-size: 13px; }
.ligne-versement { display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 20px; background: rgba(255,255,255,.03); border: 1px solid var(--filet2); }
.rond-icone { width: 42px; height: 42px; flex: none; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.05); color: var(--accent); }
.rond-icone svg { width: 18px; height: 18px; }
.menu-carte { position: relative; width: 64px; flex: none; cursor: pointer; }
.menu-carte select { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
.centre-credit { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 4px; }
.pilule-verre { min-height: 30px; padding: 0 12px; border-radius: 99px; font-size: 13px; font-weight: 600; background: rgba(255,255,255,.07); border: 1px solid var(--filet2); }
.pad-signature { position: relative; margin-top: 4px; height: 96px; border-radius: 8px; border: 1px dashed rgba(29,28,26,.3); background: rgba(255,255,255,.35); }
.pad-signature canvas { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }
.invite-signature { position: absolute; left: 12px; bottom: 10px; font: italic 13px Georgia, serif; color: rgba(29,28,26,.35); pointer-events: none; }
.recommencer { position: absolute; right: 8px; top: 6px; font-size: 12px; font-weight: 600; color: #6B675F; padding: 4px 8px; }
.trace { display: block; }

/* Assurances */
.estompee { opacity: .6; }
.lien-discret { font-size: 12px; font-weight: 500; color: var(--texte2); padding: 2px 0; }
.ligne-assure { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 0; border-top: 1px solid var(--filet); text-align: left; }
.ligne-assure .nom { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sinistre { display: flex; flex-direction: column; gap: 4px; padding: 10px 0; }
.sinistre + .sinistre { border-top: 1px solid var(--filet2); }
.option-assurance { display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 14px; border-radius: 14px; background: var(--puce); text-align: left; }
.option-assurance.choisie { background: var(--puce2); }
.radio { width: 20px; height: 20px; border-radius: 50%; border: 1.6px solid var(--texte3); flex: none; margin-top: 1px; display: grid; place-items: center; }
.radio.on { border-color: var(--accent); }
.radio.on::after { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); }

/* Impôts */
.sous-titre { font-size: 13px; font-weight: 600; color: var(--texte2); }
.champ-bouton { text-align: left; display: flex; align-items: center; }
.grille-don { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.grille-don .petit { padding: 0 6px; }
`;
