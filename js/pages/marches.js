// ══════════════════════════════════════════════════════════════════════
//  Onglet Marchés (EcransMarches.swift, EcransBourseVivante.swift,
//  FeuilleOrdre.swift, FeuilleOption.swift, Design/ObjetsMarches.swift).
//
//  Deux pages : « marches » (le bandeau des cours, le compte-titres, le
//  relevé de positions, les options, les ordres, les alertes, les gérants,
//  le fil des dépêches, puis la recherche des titres) et « marches.titre »
//  (le certificat du titre, ta part du capital, tes positions, acheter ou
//  parier à la baisse). Des feuilles : le pavé numérique, l'ordre en
//  quatre temps, l'option, les gérants, le graphique plein écran.
//
//  Comme sur l'iPhone, les cours glissent toutes les 5 secondes : la page
//  relit son tableau et redessine ce qui bouge, sans toucher à la saisie.
//  Tous les chiffres viennent des tableaux du moteur ; seul l'aperçu d'un
//  ordre (mise × levier, cours de liquidation) est refait ici, avec la
//  formule d'ApercuOrdre (TableauMarches.swift), de la simple arithmétique.
// ══════════════════════════════════════════════════════════════════════
import { boutonMontant } from "./objectifs.js?v=3e8bddd9";
import { montant, variation as variationBrute, esc } from "../format.js?v=3e8bddd9";
import { entetePousse, bouton, petit, segment, courbe, boutonAide, etapesNumerotees, confirmer } from "../ui.js?v=3e8bddd9";
import { icone } from "./marches-icones.js?v=3e8bddd9";
import { listeEtDetail, estChoisi, balanceGardee, videDetail } from "./catalogues.js?v=3e8bddd9";
import { demanderPaiement } from "../paiement.js?v=3e8bddd9";
import * as FL from "../filtres-listes.js?v=3e8bddd9"; // D442 (FIL) : la barre et la feuille « Filtres » ; D453 : la règle (une case exclue)

const NB = " ", MOINS = "−";
const PAPIER = { fond: "#F1EEE7", encre: "#1D1C1A", encre2: "#6B675F" };
const ENCRE = { gain: "#1F7A4D", perte: "#B23A2A" };

// MARK: - Formats (Montant.swift)

/** 0,0277 → « +2,77 % » ; le signe suit la valeur affichée. */
function pct(f, dec = 2, signe = true) {
  const v = (f ?? 0) * 100, fac = 10 ** dec;
  const arrondi = Math.round(Math.abs(v) * fac) / fac;
  const corps = arrondi.toFixed(dec).replace(".", ",");
  return (arrondi > 0 ? (v < 0 ? MOINS : signe ? "+" : "") : "") + corps + NB + "%";
}
/** « +1 250 € » ; comme Montant.variation, un montant qui s'arrondit à 0 € ne porte pas de signe. */
const variation = (c) => (Math.round(Math.abs(c ?? 0) / 100) === 0 ? montant(0) : variationBrute(c));
const mc = (c) => montant(c, { centimes: true });
/** Un cours : les centimes en dessous de 100 €, comme CoursVivant. */
const cours = (c) => montant(c, { centimes: c < 10_000 });
const couleur = (x) => (x >= 0 ? "var(--gain)" : "var(--perte)");
const encre = (x) => (x >= 0 ? ENCRE.gain : ENCRE.perte);
const nombre = (x, dec) => x.toFixed(dec).replace(".", ",");
const entierPct = (x) => `${Math.round(x * 100)}${NB}%`;

/** « 14:05 », « hier, 14:05 », « samedi, 14:05 » (LigneDepecheVue.quand). */
function quand(ms, maintenant) {
  const d = new Date(ms), m = new Date(maintenant);
  const heure = d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  const jour = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((jour(m) - jour(d)) / 86_400_000);
  if (ecart === 0) return heure;
  if (ecart === 1) return `hier, ${heure}`;
  return `${d.toLocaleDateString("fr-BE", { weekday: "long" })}, ${heure}`;
}

// MARK: - Styles locaux de la zone

function styles() {
  if (typeof document === "undefined" || document.getElementById("m-styles")) return;
  const s = document.createElement("style");
  s.id = "m-styles";
  s.textContent = `
  .m-pile { display: flex; flex-direction: column; gap: 18px; }
  .m-serif { font-family: "New York", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; }
  .m-rond { font-family: ui-rounded, "SF Pro Rounded", var(--police); }
  .m-num { font-variant-numeric: tabular-nums; }
  .m-encre2 { color: ${PAPIER.encre2}; }

  /* Le papier (FeuillePapier, TicketOrdre) */
  .m-papier-pile { position: relative; }
  .m-papier-pile > .m-dessous { position: absolute; inset: 0; border-radius: 10px; background: rgba(241,238,231,.55); transform: translateY(4px) rotate(1.4deg); }
  .m-papier { position: relative; background: ${PAPIER.fond}; color: ${PAPIER.encre}; border-radius: 10px; padding: 18px; box-shadow: 0 6px 20px rgba(0,0,0,.35); }
  .m-titre-papier { font-size: 20px; font-weight: 600; line-height: 1.2; }
  .m-filet-papier { height: 1px; background: rgba(29,28,26,.12); }
  .m-ticket { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; background: ${PAPIER.fond}; color: ${PAPIER.encre};
    border-radius: 10px; padding: 14px 14px 14px 22px; box-shadow: 0 4px 16px rgba(0,0,0,.3); }
  .m-ticket::before { content: ""; position: absolute; left: 11px; top: 8px; bottom: 8px; border-left: 1px dashed rgba(107,103,95,.5); }
  .m-ticket.colonne { flex-direction: column; align-items: stretch; gap: 10px; }
  .m-encre { display: inline-flex; align-items: center; justify-content: center; min-height: 36px; padding: 0 16px; border-radius: 99px; font-size: 13px; font-weight: 600;
    background: ${PAPIER.encre}; color: ${PAPIER.fond}; white-space: nowrap; flex: none; }
  .m-contour { display: inline-flex; align-items: center; justify-content: center; min-height: 36px; padding: 0 14px; border-radius: 99px; font-size: 13px; font-weight: 600;
    color: ${PAPIER.encre}; border: 1px solid rgba(29,28,26,.35); white-space: nowrap; }
  .m-encre:active, .m-contour:active { opacity: .7; }
  .m-champ-papier { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding-bottom: 7px; border-bottom: 1px solid rgba(29,28,26,.12); }
  .m-champ-papier span:first-child { font-size: 13px; color: ${PAPIER.encre2}; }
  .m-champ-papier b { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
  .m-champ-papier.fort b { font-size: 17px; font-weight: 700; }

  /* Le compte-titres et le certificat, guillochés */
  .m-guilloche { position: relative; overflow: hidden; border-radius: 22px; color: #fff; border: 1px solid rgba(255,255,255,.14); box-shadow: 0 8px 28px rgba(0,0,0,.45); }
  .m-guilloche > svg.m-ondes { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .m-compte { height: 200px; padding: 20px; display: flex; flex-direction: column; background: linear-gradient(135deg, #1F4D45, #0E2421); }
  .m-compte::after { content: ""; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(135deg, rgba(255,255,255,0) 25%, rgba(255,255,255,.1) 45%, rgba(255,255,255,0) 62%); }
  .m-compte > * { position: relative; }
  .m-certificat { display: block; width: 100%; text-align: left; padding: 20px 20px 0; }
  .m-certificat > * { position: relative; }

  /* Le bandeau des cours */
  .m-bandeau { margin: 0 -20px; height: 30px; overflow: hidden;
    -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
  .m-piste { display: flex; align-items: center; gap: 26px; height: 30px; width: max-content; padding-right: 26px; animation: m-defile linear infinite; }
  .m-piste > span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  @keyframes m-defile { to { transform: translateX(-50%); } }
  @media (prefers-reduced-motion: reduce) { .m-bandeau { overflow-x: auto; } .m-piste { animation: none; } }

  /* Chercher, trier, filtrer (BarreListe) */
  .m-barre { display: flex; gap: 8px; }
  .m-champ { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 0 14px; min-height: 44px; color: var(--texte2); }
  .m-champ input { flex: 1; min-width: 0; background: none; border: 0; outline: 0; font-size: 16px; color: var(--texte); }
  .m-champ input::placeholder { color: var(--texte2); }
  .m-tri { display: inline-flex; align-items: center; gap: 5px; padding: 0 12px; min-height: 44px; font-size: 13px; font-weight: 600; white-space: nowrap; }
  .m-defile { display: flex; gap: 8px; overflow-x: auto; margin: 0 -20px; padding: 0 20px; scrollbar-width: none; }
  .m-defile::-webkit-scrollbar { display: none; }
  .m-pilule { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 34px; padding: 0 14px; border-radius: 99px;
    border: 1px solid var(--filet2); font-size: 14px; font-weight: 600; white-space: nowrap; flex: none; transition: background .3s var(--courbe-graphite), color .3s; }
  .m-pilule[aria-pressed="true"] { background: var(--texte); color: var(--fond); border-color: transparent; }
  .m-pilule.haute { min-height: 36px; }
  .m-pilules { display: flex; gap: 8px; }
  .m-pilules > .m-pilule { flex: 1; padding: 0 6px; }
  .m-ligne-titre { display: flex; align-items: center; gap: 12px; padding: 11px 14px; width: 100%; text-align: left; }
  .m-ligne-titre + .m-ligne-titre { border-top: 1px solid var(--filet); }
  .m-ligne-titre:active { background: rgba(255,255,255,.03); }
  .m-coupe { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Les cours qui s'allument (CoursVivant) */
  .m-eclat-gain { animation: m-eclat-g 1.15s ease-out; } .m-eclat-perte { animation: m-eclat-p 1.15s ease-out; }
  @keyframes m-eclat-g { 0%, 25% { color: var(--gain); } } @keyframes m-eclat-p { 0%, 25% { color: var(--perte); } }

  /* Feuilles */
  .m-indicateur { display: flex; justify-content: center; gap: 6px; }
  .m-indicateur i { display: block; height: 8px; width: 8px; border-radius: 99px; background: var(--puce2); transition: width .35s var(--courbe-graphite), background .35s; }
  .m-indicateur i.fait { background: var(--accent); } .m-indicateur i.ici { width: 22px; }
  .m-titre-feuille { font-size: 20px; font-weight: 600; text-align: center; }
  .m-colonne12 { display: flex; flex-direction: column; gap: 12px; }
  /* D404 : la revente d'une option, les options sur devises et sur la Bourse du monde */
  .m-option { display: flex; flex-direction: column; gap: 6px; }
  .m-option-revente { display: flex; justify-content: flex-end; }
  .aide.m-option-note { text-align: right; margin: 0; }
  .m-colonne { display: flex; flex-direction: column; }
  .rangee.m-autre { gap: 12px; width: 100%; padding: 10px 0; text-align: left; border-bottom: 1px solid var(--filet); }
  .m-autre-detail { display: block; font-size: 12px; color: var(--texte2); }
  .m-autre-cours { text-align: right; font-size: 14px; font-weight: 600; }
  .m-encre2.m-t13 { font-size: 13px; } .m-encre2.m-t12 { font-size: 12px; }
  .rangee.m-ligne-resultat { gap: 8px; text-align: left; font-size: 14px; }
  .m-coupe.m-corps { flex: 1; min-width: 0; }
  .m-gras { font-weight: 600; }
  .m-avis { font-size: 12px; font-weight: 700; color: var(--c); }
  .m-num.m-num13 { font-size: 13px; font-weight: 600; } .m-num.m-num15 { font-size: 15px; font-weight: 600; }
  .carte.m-pile12 { display: flex; flex-direction: column; gap: 12px; } .carte.m-pile10 { display: flex; flex-direction: column; gap: 10px; }
  .rangee.entre.m-base { align-items: baseline; }
  .m-appel { font-size: 12px; font-weight: 600; color: ${ENCRE.perte}; }
  .carte.m-cadre-decouvert { padding: 18px; text-align: center; display: flex; flex-direction: column; gap: 6px; }
  .chiffres.m-gros { font-size: 40px; line-height: 1.1; }
  .m-capsule { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 44px; padding: 0 14px; border-radius: 99px; border: 1px solid var(--filet2); max-width: 100%; align-self: center; }
  .m-affichage { text-align: center; }
  .m-affichage .m-somme { display: inline-flex; align-items: baseline; gap: 6px; font-size: 50px; font-weight: 600; letter-spacing: -.05em; font-variant-numeric: tabular-nums; line-height: 1.1; }
  .m-affichage .m-somme small { font-size: 24px; letter-spacing: 0; color: var(--texte2); }
  .m-clavier { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .m-clavier button { min-height: 54px; border-radius: 16px; background: rgba(255,255,255,.05); font-size: 26px; font-weight: 500; text-align: center; font-variant-numeric: tabular-nums; display: grid; place-items: center; transition: transform .12s, background .12s; }
  .m-clavier button:active { transform: scale(.96); background: rgba(255,255,255,.1); }
  .m-raccourcis { display: flex; justify-content: center; gap: 8px; }
  .m-groupe { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
  .m-leviers { display: flex; gap: 10px; }
  .m-leviers button { flex: 1; min-height: 78px; border-radius: 18px; background: rgba(255,255,255,.04); border: 1px solid var(--filet2); display: grid; place-content: center; gap: 4px; text-align: center; transition: background .3s var(--courbe-graphite), color .3s; }
  .m-leviers button[aria-pressed="true"] { background: var(--texte); color: var(--fond); border-color: transparent; }
  .m-erreur { display: flex; gap: 8px; align-items: center; font-size: 14px; font-weight: 600; color: var(--perte); }

  /* Le graphique */
  .m-graphe { position: relative; height: 300px; touch-action: none; user-select: none; -webkit-user-select: none; cursor: crosshair; }
  .m-graphe > svg { position: absolute; left: 0; top: 14px; width: calc(100% - 56px); height: calc(100% - 38px); overflow: visible; }
  .m-graphe .m-axe-y { position: absolute; right: 0; font-size: 10px; color: var(--texte2); transform: translateY(-50%); font-variant-numeric: tabular-nums; }
  .m-graphe .m-axe-x { position: absolute; bottom: 0; font-size: 11px; color: var(--texte2); transform: translateX(-50%); white-space: nowrap; }
  .m-graphe .m-repere { position: absolute; top: 0; transform: translateX(-50%); width: 15px; height: 15px; display: grid; place-items: center; border-radius: 50%; color: var(--fond); }
  `;
  document.head.append(s);
}

// MARK: - Les objets (ObjetsMarches.swift)

/** Couleur claire (luminance > 0,62) : on écrit à l'encre sombre. */
function clair(hexa) {
  const h = parseInt(String(hexa ?? "").slice(1), 16);
  if (!Number.isFinite(h)) return false;
  return (0.299 * ((h >> 16) & 255) + 0.587 * ((h >> 8) & 255) + 0.114 * (h & 255)) / 255 > 0.62;
}

const LINGOTS = { XAU: ["#F6DD8C", "#B98A2E", "Au"], XAG: ["#F1F2F4", "#9EA3AA", "Ag"], CUIVRE: ["#F0A77A", "#A25A32", "Cu"], XPT: ["#E4E7EA", "#8E959C", "Pt"], XPD: ["#D9DCE3", "#7D8494", "Pd"] };
const PIECES = { BTC: ["#F9C35C", "#C27612"], ETH: ["#C9CFF2", "#6A73B5"], SOL: ["#B89CF5", "#3FC5A8"], DOGE: ["#F0D98A", "#B3923C"] };

/** La miniature d'un titre (PastilleTitre) : un lingot, une pièce, ou la marque et l'objet de son métier. */
function pastille(t, taille = 40) {
  const s = t.symbole, grave = esc(s.slice(0, 4)), r = taille * 0.26;
  const boite = (fond, contenu, extra = "") =>
    `<span aria-hidden="true" style="width:${taille}px;height:${taille}px;flex:none;border-radius:${r}px;display:grid;place-items:center;background:${fond};box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);${extra}">${contenu}</span>`;
  const gravure = (c, k = 0.17) => `<span class="m-rond" style="font-size:${taille * (s.length > 3 ? k - 0.02 : k)}px;font-weight:800;line-height:1;color:${c};opacity:.9;letter-spacing:-.02em">${grave}</span>`;
  const sous = (svg, c) => `<span style="display:flex;flex-direction:column;align-items:center;gap:${taille * 0.03}px;color:${c}">${svg}${gravure(c)}</span>`;
  const degrade = (a, b) => `linear-gradient(135deg,${a},${b})`;
  if (LINGOTS[s]) {
    const [h, b, x] = LINGOTS[s];
    const id = `l${s}${taille}`;
    return `<svg width="${taille}" height="${taille}" viewBox="0 0 40 40" aria-hidden="true" class="mk-x1">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${h}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <path d="M11.2 5h17.6L40 35H0z" fill="url(#${id})" transform="translate(0 0) scale(1 .76) translate(0 6.3)"/>
      <path d="M11.2 9.1h17.6l-3.2 8.7H14.4z" fill="rgba(255,255,255,.35)"/>
      <text x="20" y="29.5" text-anchor="middle" font-family="Georgia,serif" font-weight="800" font-size="10.4" fill="rgba(0,0,0,.45)">${x}</text></svg>`;
  }
  if (s === "BRENT") return boite(degrade("#2B2622", "#0F0D0C"), `<span class="mk-x2">${icone("goutte", taille * 0.46)}</span>`);
  if (s === "DIAM") return boite(degrade("#1D2A33", "#0C1217"), `<span class="mk-x3">${icone("ui:diamant", taille * 0.48)}</span>`);
  if (s === "GAZ") return boite(degrade("#1B2638", "#0B111A"), `<span class="mk-x4">${icone("ui:flamme", taille * 0.46)}</span>`);
  if (t.categorie === "Crypto") {
    const [a, b] = PIECES[s] ?? ["#D7DBE0", "#7F868F"];
    const centre = s === "BTC" ? "₿" : s === "ETH" ? "Ξ" : esc(s.slice(0, 3));
    const k = s === "BTC" || s === "ETH" ? 0.44 : 0.24;
    return `<span aria-hidden="true" style="width:${taille}px;height:${taille}px;flex:none;border-radius:50%;display:grid;place-items:center;background:${degrade(a, b)};
      box-shadow:0 1px 2px rgba(0,0,0,.35),inset 0 0 0 ${Math.max(1.5, taille * 0.05)}px rgba(0,0,0,.14),inset 0 0 0 ${taille * 0.12}px transparent;position:relative">
      <i style="position:absolute;inset:${taille * 0.12}px;border-radius:50%;border:1px solid rgba(255,255,255,.45)"></i>
      <b class="m-rond" style="position:relative;font-size:${taille * k}px;font-weight:800;color:rgba(0,0,0,.55);line-height:1">${centre}</b></span>`;
  }
  if (t.secteur) {
    const fond = t.couleur ?? "#4A4D55";
    const c = clair(t.couleur) ? "#1D1C1A" : "#fff";
    return boite(`linear-gradient(135deg,rgba(255,255,255,.22),rgba(0,0,0,.18)),${fond}`, sous(icone(t.secteur, taille * 0.4), c), "box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)");
  }
  if (t.categorie === "Fonds indiciels") return boite(degrade("#2E6B57", "#173A2F"), sous(icone("ui:pie", taille * 0.32), "rgba(255,255,255,.92)"));
  if (t.categorie === "Technologie") return boite(degrade("#3B3F48", "#16181C"), gravure("rgba(255,255,255,.9)", 0.22));
  return boite(degrade("#4A4D55", "#24262B"), gravure("#fff", 0.3));
}

/** Les fines ondes entrelacées des titres imprimés (Guilloche). */
function guilloche(opacite = 0.07) {
  const w = 360, h = 200;
  let d = "";
  for (let k = 0; k < 14; k++) {
    const base = h * (0.15 + 0.06 * k), phase = k * 0.45;
    for (let x = 0; x <= w; x += 6) d += `${x ? "L" : "M"}${x} ${(base + Math.sin((x / w) * Math.PI * 3 + phase) * h * 0.08).toFixed(1)}`;
  }
  return `<svg class="m-ondes" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="rgba(255,255,255,${opacite})" stroke-width=".8" vector-effect="non-scaling-stroke"/></svg>`;
}

const papier = (contenu, style = "") => `<div class="m-papier-pile" style="${style}"><div class="m-dessous"></div><div class="m-papier">${contenu}</div></div>`;
const titrePapier = (titre, sous) => `<div><div class="m-titre-papier m-serif">${esc(titre)}</div><div class="mk-x5 m-encre2">${esc(sous)}</div></div>`;
const champPapier = (libelle, valeur, fort = false) => `<div class="m-champ-papier ${fort ? "fort" : ""}"><span>${esc(libelle)}</span><b>${valeur}</b></div>`;
const libelle = (t) => `<div class="libelle">${esc(t)}</div>`;
const lienTitre = (symbole) => `data-action="ouvrir" data-page="marches.titre" data-p='${esc(JSON.stringify({ id: symbole }))}'`;
const LOUPE = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" class="mk-x6"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>`;
const FLECHES_TRI = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="mk-x6"><path d="M7 20V4M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4"/></svg>`;
const croix = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="var(--fond)" stroke-width="2" stroke-linecap="round"/></svg>`;

/** Mini-courbe d'une ligne de titre (TraceCourbe, marge 3). */
function trace(h, teinte, w = 58, haut = 26) {
  if (!h?.length) return "";
  const n = h.length, m = 3;
  const pts = h.map((v, i) => `${((n > 1 ? i / (n - 1) : 0.5) * w).toFixed(1)},${(m + (1 - v) * (haut - 2 * m)).toFixed(1)}`).join(" ");
  return `<svg width="${w}" height="${haut}" viewBox="0 0 ${w} ${haut}" aria-hidden="true" class="mk-x6"><polyline points="${pts}" fill="none" stroke="${teinte}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// MARK: - Les cours qui vivent (CoursVivant)

/** Le dernier cours vu par symbole : un cours qui change s'allume en vert ou en rouge. */
const coursVus = new Map();
function eclat(cle, valeur) {
  const avant = coursVus.get(cle);
  coursVus.set(cle, valeur);
  if (avant === undefined || avant === valeur) return "";
  return valeur > avant ? "m-eclat-gain" : "m-eclat-perte";
}

// MARK: - La liste des titres (Chercheur, RNT-136)

const PAR_PAGE = 30;
const liste = { recherche: "", tri: "variation", croissant: false, filtres: new Set(), ou: new Set(), montres: PAR_PAGE }; // D462 : ou
// D442 (FIL) : le tri et les filtres gardés d'une visite à l'autre (comme l'iPhone).
try {
  const g = JSON.parse(localStorage.getItem("liste.marches") ?? "null");
  if (g && typeof g.tri === "string") { liste.tri = g.tri; liste.croissant = g.croissant === true; liste.filtres = new Set(Array.isArray(g.filtres) ? g.filtres : []); }
  if (g && Array.isArray(g.ou)) liste.ou = new Set(g.ou.filter((x) => typeof x === "string")); // D462
} catch { /* navigation privée : rien de gardé */ }
function garderListe() {
  const g = { tri: liste.tri, croissant: liste.croissant, filtres: [...liste.filtres].sort() };
  if (liste.ou.size) g.ou = [...liste.ou].sort(); // D462 : les groupes en « Au moins une »
  try { localStorage.setItem("liste.marches", JSON.stringify(g)); } catch { /* rien */ }
}
const TRIS = [
  { id: "variation", nom: "Variation", croissant: false },
  { id: "ampleur", nom: "Plus agités", croissant: false },
  { id: "cours", nom: "Cours", croissant: true },
  { id: "nom", nom: "Nom", croissant: true },
];
const ICONES_RAYONS = { "Technologie": "ui:cpu", "Automobile": "ui:car", "Luxe": "ui:bag", "Fonds indiciels": "ui:pie", "Matières premières": "ui:box",
  "Crypto": "ui:bitcoin", "Santé": "ui:sante", "Énergie": "ui:bolt", "Petites capitalisations": "ui:leaf" };

const sansAccents = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function visibles(t) {
  const choisis = t.rayons.filter((r) => liste.filtres.has(r.nom));
  const exclus = new Set(t.rayons.filter((r) => liste.filtres.has(FL.exclue(r.nom))).flatMap((r) => r.titres.map((x) => x.symbole))); // D453
  const q = sansAccents(liste.recherche.trim());
  const base = (choisis.length ? choisis.flatMap((r) => r.titres) : t.titres)
    .filter((x) => !exclus.has(x.symbole))
    .filter((x) => !q || [x.nom, x.symbole, x.secteur, x.place].some((v) => sansAccents(v).includes(q)))
    // D462 : « En hausse » et « En baisse » ensemble, en « Toutes » ou « Au moins une ».
    .filter((x) => FL.passeTests(liste.filtres, [["hausse", x.variation > 0], ["baisse", x.variation < 0]], liste.ou.has("Aujourd'hui")));
  const cles = { variation: (x) => x.variation, cours: (x) => x.cours, ampleur: (x) => Math.abs(x.variation) };
  const cle = cles[liste.tri];
  const sens = liste.croissant ? 1 : -1;
  return [...base].sort(cle ? (a, b) => sens * (cle(a) - cle(b)) : (a, b) => sens * a.nom.localeCompare(b.nom, "fr", { numeric: true }));
}

function ligneTitre(x, pListe = null) {
  const hausse = x.variation >= 0;
  return `<button class="m-ligne-titre" ${lienTitre(x.symbole)} ${pListe && estChoisi(pListe, "marches.titre", "id", x.symbole) ? 'aria-current="true"' : ""}>
    ${pastille(x, 40)}
    <span class="mk-x7"><div class="libelle m-coupe">${esc(x.nom)}</div><div class="aide m-coupe">${esc(x.place)}</div></span>
    ${trace(x.tendance, hausse ? "var(--gain)" : "var(--perte)")}
    <span class="mk-x8">
      <div class="mk-x9 chiffres ${eclat(`l${x.symbole}`, x.cours)}">${cours(x.cours)}</div>
      <div class="chiffres" style="font-size:13px;color:${couleur(x.variation)}">${pct(x.variation, 1)}</div>
    </span></button>`;
}

/** D442 (FIL) : les cases, par groupe (« Aujourd'hui », « Rayon »). */
const optionsFiltres = (t) => [["hausse", "En hausse", "Aujourd'hui"], ["baisse", "En baisse", "Aujourd'hui"], ...t.rayons.map((r) => [r.nom, r.nom, "Rayon"])];
/** « Filtres · N » ouvre la feuille ; les filtres choisis restent en pastilles retirables. */
function filtres(t) {
  const choisis = optionsFiltres(t).filter(([id]) => FL.etatCase(liste.filtres, id)); // D453 : incluses et exclues
  return `<div class="fl-ligne"><button class="petit${choisis.length ? " plein" : ""}" data-action="ouvrirFiltres">${choisis.length ? `Filtres · ${choisis.length}` : "Filtres"}</button>
    ${choisis.length ? `<div class="fl-pastilles">${choisis.map(([id, nom]) => FL.pastilleHtml({ nom, exclu: FL.etatCase(liste.filtres, id) === "exclue", id,
      attrs: `data-action="filtrer" data-id="${esc(id)}" data-retirer="1"` })).join("")}</div>` : ""}</div>`;
}
function feuilleFiltres(t) {
  const o = optionsFiltres(t);
  const groupes = [...new Set(o.map((x) => x[2]))];
  return `<div class="pile fl-feuille">${FL.aideHtml()}${groupes.map((g) => { const l = o.filter((x) => x[2] === g); // D453 : une longue feuille replie ses grands groupes
    const mode = g === "Aujourd'hui" ? FL.modeHtml(liste.ou.has(g), `data-action="modeFiltres" data-groupe="${esc(g)}"`) : ""; // D462
    return FL.groupeHtml(g, l.map(([id, nom]) => FL.caseHtml({ etat: FL.etatCase(liste.filtres, id), nom, id, attrs: `data-action="filtrer" data-id="${esc(id)}"` })),
      { total: o.length, choisis: l.filter(([id]) => FL.etatCase(liste.filtres, id)).length, mode }); }).join("")}
    <div class="rangee" style="gap:8px"><button class="bouton secondaire" data-action="toutEffacer" ${liste.filtres.size ? "" : "disabled"}>Tout effacer</button>
      <button class="bouton" data-action="fermerFeuille">Voir ${visibles(t).length}</button></div></div>`;
}

function compte(n) {
  const effacer = liste.filtres.size || liste.recherche ? `<button data-action="toutEffacer" class="mk-x10">Tout effacer</button>` : "";
  return `<span class="mk-x11 m-num">${n} titres</span>${effacer}`;
}

let pMarches = null; // l'entrée de pile de la page Marchés (la ligne choisie au grand écran)
function listeTitres(v) {
  if (!v.length) return `<div class="mk-x12 aide">Aucun titre ne correspond.</div>`;
  const montres = v.slice(0, liste.montres);
  const reste = v.length - montres.length;
  return `<div class="carte m-titres">${montres.map((x) => ligneTitre(x, pMarches)).join("")}</div>
    ${reste > 0 ? `<button class="petit m-plus" data-action="plusTitres">Afficher ${Math.min(PAR_PAGE, reste)} de plus <span class="t2">sur ${reste}</span></button>` : ""}`;
}

function recherche(t) {
  const v = visibles(t);
  const tri = TRIS.find((x) => x.id === liste.tri);
  return `
  <div class="mk-x13">
    <div class="m-barre">
      <label class="carte m-champ">${LOUPE}
        <input id="m-recherche" type="search" placeholder="NVIDIA, or, bitcoin…" autocomplete="off" spellcheck="false" value="${esc(liste.recherche)}" data-saisie="chercher" aria-label="Chercher un titre">
        <button data-action="effacerRecherche" aria-label="Effacer la recherche" id="m-effacer" style="color:var(--texte2);display:${liste.recherche ? "grid" : "none"}">${icone("ui:effacer", 18)}</button>
      </label>
      <button class="carte m-tri" data-action="trier" aria-label="Trier par ${esc(tri.nom)}, ${liste.croissant ? "croissant" : "décroissant"}">${FLECHES_TRI}<span id="m-tri">${esc(tri.nom)}</span></button>
    </div>
    <div id="m-filtres">${filtres(t)}</div>
    <div class="mk-x14 rangee entre" id="m-compte">${compte(v.length)}</div>
    <div id="m-liste">${listeTitres(v)}</div>
  </div>
  <p class="aide">Les cours sont simulés et animés, les mêmes pour tous les joueurs : ils vivent toute la journée, week-end compris.</p>`;
}

/** Redessine la liste, ses filtres et son compte, sans toucher au champ de recherche. */
function majRecherche(t) {
  const v = visibles(t);
  const $ = (id) => document.getElementById(id);
  if (!$("m-liste")) return;
  $("m-liste").innerHTML = listeTitres(v);
  $("m-compte").innerHTML = compte(v.length);
  $("m-filtres").innerHTML = filtres(t);
  $("m-tri").textContent = TRIS.find((x) => x.id === liste.tri).nom;
  $("m-effacer").style.display = liste.recherche ? "grid" : "none";
}

// MARK: - Le bandeau des cours (BandeauCours, RNT-100)

/** Ce que tu détiens d'abord, puis les titres qui bougent le plus aujourd'hui. */
function titresDuBandeau(t) {
  const detenus = new Set([...t.positions.map((p) => p.symbole), ...t.alertes.map((a) => a.symbole)]);
  const miens = t.titres.filter((x) => detenus.has(x.symbole));
  const agites = t.titres.filter((x) => !detenus.has(x.symbole)).sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation));
  return [...miens, ...agites].slice(0, 16);
}

function itemBandeau(x) {
  const h = x.variation >= 0;
  return `<span data-bandeau="${esc(x.symbole)}"><b class="mk-x15 m-rond">${esc(x.symbole)}</b>
    <span class="mk-x16 m-num c">${cours(x.cours)}</span>
    <span class="m-num v" style="font-size:12px;font-weight:600;color:${couleur(x.variation)};display:inline-flex;align-items:center;gap:2px"><svg width="7" height="6" viewBox="0 0 7 6" aria-hidden="true"><path d="${h ? "M3.5 0L7 6H0z" : "M3.5 6L7 0H0z"}" fill="currentColor"/></svg>${pct(Math.abs(x.variation), 1, false)}</span></span>`;
}

function bandeauCours(t) {
  const titres = titresDuBandeau(t);
  const resume = titres.slice(0, 5).map((x) => `${x.nom} ${pct(x.variation, 1)}`).join(", ");
  const ligne = titres.map(itemBandeau).join("");
  // ~150 px par titre, à 26 px par seconde, comme l'iPhone.
  return `<div class="m-bandeau" role="img" aria-label="${esc(resume)}"><div class="m-piste" style="animation-duration:${Math.max(20, titres.length * 150 / 26).toFixed(0)}s">${ligne}${ligne}</div></div>`;
}

function majBandeau(t) {
  const parSymbole = new Map(t.titres.map((x) => [x.symbole, x]));
  document.querySelectorAll("[data-bandeau]").forEach((el) => {
    const x = parSymbole.get(el.dataset.bandeau);
    if (!x) return;
    el.querySelector(".c").textContent = cours(x.cours);
    const v = el.querySelector(".v");
    v.style.color = couleur(x.variation);
    v.innerHTML = `<svg width="7" height="6" viewBox="0 0 7 6" aria-hidden="true"><path d="${x.variation >= 0 ? "M3.5 0L7 6H0z" : "M3.5 6L7 0H0z"}" fill="currentColor"/></svg>${pct(Math.abs(x.variation), 1, false)}`;
  });
}

// MARK: - Le portefeuille

function carteCompteTitres(t) {
  const n = t.positions.length, o = t.ordres.length, op = t.options.length;
  const detail = n === 0 && o === 0 && op === 0 ? "Aucune position : choisis un titre dessous"
    : `${n} position${n > 1 ? "s" : ""}${o > 0 ? `, ${o} ordre${o > 1 ? "s" : ""} en attente` : ""}${op > 0 ? `, ${op} option${op > 1 ? "s" : ""}` : ""}`;
  const v = variation(t.plusValue);
  const teinte = v.startsWith("+") ? "var(--gain)" : v.startsWith(MOINS) ? "var(--perte)" : "var(--texte2)";
  return `<div class="m-guilloche m-compte">${guilloche()}
    <div class="rangee entre"><span class="mk-x17 m-serif">Compte-titres</span><span class="mk-x18">${icone("ui:courbe", 16)}</span></div>
    <div class="mk-x19"></div>
    <div class="mk-x20 chiffres ${eclat("portefeuille", t.portefeuille)}">${montant(t.portefeuille)}</div>
    <div class="mk-x21 rangee"><span class="chiffres" style="font-size:15px;color:${teinte}">${v}</span><span class="mk-x22">de plus-value latente</span></div>
    <div class="mk-x19"></div>
    <div class="mk-x23">${esc(detail)}</div>
  </div>`;
}

function relevePositions(t) {
  if (!t.positions.length) return "";
  const lignes = t.positions.map((p) => {
    const pv = p.valeur - p.mise; // LignePosition.plusValue
    return `<button ${lienTitre(p.symbole)} style="display:flex;align-items:center;gap:12px;width:100%;text-align:left;color:${PAPIER.encre}">
      ${pastille(t.titres.find((x) => x.symbole === p.symbole) ?? { symbole: p.symbole }, 34)}
      <span class="mk-x7">
        <span class="mk-x24 rangee"><span class="mk-x17 m-coupe">${esc(p.titre)}</span>${p.appel ? `<span style="color:${ENCRE.perte}" aria-label="Appel de marge">${icone("ui:alerte", 12)}</span>` : ""}</span>
        <span class="mk-x25 m-encre2 m-coupe">${esc(p.detail)}</span>
      </span>
      <span class="mk-x26">
        <span class="mk-x27 m-num">${montant(p.valeur)}</span>
        <span class="m-num" style="display:block;font-size:12px;font-weight:600;color:${encre(pv)}">${variation(pv)}</span>
      </span></button><div class="m-filet-papier"></div>`;
  }).join("");
  return papier(`<div class="m-colonne12">${titrePapier("Relevé de positions", "Valorisé au cours du moment")}${lignes}</div>`);
}

/** Une option en cours, comme un ticket (TicketOption). */
function ticketOption(o, avecPastille = null) {
  const pv = o.valeur - o.prime; // LigneOption.plusValue
  const ech = new Date(o.echeance - 1000).toLocaleDateString("fr-BE", { weekday: "short", day: "numeric", month: "short" }) + " à minuit";
  const corps = `
    ${avecPastille ?? ""}
    <span class="mk-x28">
      <span class="mk-x29 m-encre2">${o.call ? "Option d'achat" : "Option de vente"}</span>
      <span class="mk-x17">${esc(o.libelle)}</span>
      <span class="mk-x30 m-encre2">Échéance ${esc(ech)}, prime ${montant(o.prime)}</span>
      <span class="mk-x30 m-encre2">${o.siMaintenant > 0 ? `Au cours du moment, elle verserait ${montant(o.siMaintenant)}.` : "Au cours du moment, elle ne verserait rien."}</span>
    </span>
    <span class="mk-x26">
      <span class="mk-x27 m-num">${montant(o.valeur)}</span>
      <span class="m-num" style="display:block;font-size:12px;font-weight:600;color:${encre(pv)}">${variation(pv)}</span>
    </span>`;
  // D404 : une option sur devise ou sur la Bourse du monde n'a pas de fiche de titre.
  const ticket = avecPastille && o.sorte === "titre" ? `<button class="m-ticket" ${lienTitre(o.symbole)}>${corps}</button>` : `<div class="m-ticket">${corps}</div>`;
  return `<div class="m-option">${ticket}${boutonRevendre(o)}</div>`;
}

/** D404 : revendre une option avant sa date (la banque la rachète à sa juste valeur, moins sa marge). */
const boutonRevendre = (o) => o.refusRachat
  ? `<p class="aide m-option-note">${esc(o.refusRachat)}</p>`
  : `<div class="m-option-revente">${petit(`Revendre, ${montant(o.rachat)}`, "revendreOption", { donnees: { id: String(o.id) } })}</div>`;

function optionsEnCours(t) {
  const autres = (t.autresOptions ?? []).length
    ? bouton(`${icone("ui:calendrier", 16)}Options sur devises et Bourse du monde`, "autresOptions", { genre: "teinte", teinte: "var(--controles)" }) : "";
  if (!t.options.length) return autres;
  return `<div class="m-colonne12">${libelle("Tes options")}${t.options.map((o) =>
    ticketOption(o, pastille(o.sorte === "titre" ? (t.titres.find((x) => x.symbole === o.symbole) ?? { symbole: o.symbole }) : { symbole: o.pastille, categorie: o.categorie }, 34))).join("")}</div>${autres}`;
}

/** D404 : revendre, après confirmation ; le journal dit le prix. */
async function revendreOption(ctx, b, options) {
  const o = options.find((x) => x.id === Number(b.dataset.id));
  if (!o) return;
  if (!(await confirmer({ titre: `Revendre ${o.call ? "ce call" : "ce put"} ${montant(o.rachat)} ?`, oui: "Revendre",
    texte: `La banque la rachète à sa juste valeur du moment, moins sa marge. Tu avais payé ${montant(o.prime)}.` }))) return;
  await ctx.decider("marches", { revendreOption: { id: o.id } }, { succes: `Option revendue, ${montant(o.rachat)}` });
}

/** D404 : les options sur devises et sur la Bourse du monde (FeuilleAutresOptions) : la liste, puis la feuille d'option. */
let autres = null;
function ouvrirAutresOptions(ctx, lignes) {
  autres = { lignes, sorte: "devise" };
  ouvrirFeuille(ctx, { titre: "Autres options", rendu: renduAutres, actions: {
    autresSorte(c, b) { autres.sorte = b.dataset.valeur; redessiner(c); },
    autreChoisi(c, b) { const l = autres.lignes.find((x) => x.symbole === b.dataset.symbole); if (l) ouvrirOption(c, l); },
  } });
}

function renduAutres() {
  const a = autres, monde = a.lignes.some((l) => l.sorte === "monde");
  const l = a.lignes.filter((x) => x.sorte === a.sorte);
  return `${monde ? segment([["devise", "Devises"], ["monde", "Bourse du monde"]], a.sorte, "autresSorte") : ""}
    <p class="aide">${a.sorte === "devise" ? "Parie sur un taux de change : un lot de la devise, en euros, à une date." : "Parie sur une boîte cotée d'un autre joueur : 1 ‰ de son capital, à une date."}</p>
    <div class="m-colonne">${l.map((x) => `<button class="rangee m-autre" data-action="autreChoisi" data-symbole="${esc(x.symbole)}">
      ${pastille({ symbole: x.pastille, categorie: x.categorie }, 34)}
      <span class="m-coupe m-corps"><b class="m-gras">${esc(x.nom)}</b><span class="m-autre-detail">${esc(x.detail)}</span></span>
      <span class="m-autre-cours m-num">${mc(x.cours)}${x.variation ? `<span class="m-autre-detail">${pct(x.variation)}</span>` : ""}</span></button>`).join("")
      || `<p class="aide">${a.sorte === "devise" ? "Aucune devise cotée." : "Aucune boîte cotée d'un autre joueur pour l'instant."}</p>`}</div>`;
}

/** Un ordre en attente : un ticket détachable (TicketOrdre). */
function ticketsOrdres(t) {
  return t.ordres.map((o) => `<div class="m-ticket">
    ${pastille(t.titres.find((x) => x.symbole === o.symbole) ?? { symbole: o.symbole }, 34)}
    <span class="mk-x31">
      <span class="mk-x29 m-encre2">Ordre à cours limité</span>
      <span class="mk-x17">${esc(o.texte)}</span>
      <span class="mk-x30 m-encre2">${montant(o.mise)} réservés</span>
    </span>
    <button class="m-encre" data-action="annulerOrdre" data-id="${o.id}">Annuler</button></div>`).join("");
}

/** Les alertes posées, chacune retirable (ListeAlertes). */
function listeAlertes(alertes) {
  return `<div class="mk-x32 carte">${alertes.map((a) => `
    <div class="mk-x33 rangee">
      <span style="width:22px;display:grid;place-items:center;color:${a.hausse ? "var(--gain)" : "var(--perte)"}">${icone(a.hausse ? "ui:clocheAlerte" : "ui:cloche", 18)}</span>
      <span class="mk-x34 m-coupe">${esc(a.texte)}</span>
      <button data-action="retirerAlerte" data-id="${a.id}" aria-label="Retirer l'alerte" class="mk-x35">${croix}</button>
    </div>`).join("")}</div>`;
}

const ICONES_GERANTS = { "shield.fill": "ui:bouclier", "scalemass.fill": "ui:balance", "flame.fill": "ui:flamme" };

/** L'argent confié : ce qu'il vaut, la part du gérant, négocier ou reprendre (CarteMandats). */
function carteMandats(t) {
  const mandats = t.mandats.map((m) => {
    const v = m.mise > 0 ? m.net / m.mise - 1 : 0; // LigneMandat.variation
    const apres = m.negocierApres ? new Date(m.negocierApres).toLocaleDateString("fr-BE", { day: "numeric", month: "long" }) : null;
    return `<div class="mk-x36 m-papier">
      <div class="mk-x37 rangee">
        <span class="mk-x38">${icone(ICONES_GERANTS[m.icone] ?? "ui:defaut", 17)}</span>
        <span class="mk-x7"><div class="mk-x39 m-serif">${esc(m.nom)}</div><div class="m-encre2 m-t12">${esc(m.style)}, confié ${montant(m.mise)}</div></span>
        <span class="mk-x40"><div class="mk-x41 chiffres ${eclat(`m${m.id}`, m.net)}">${montant(m.net)}</div><div class="m-num" style="font-size:12px;font-weight:600;color:${encre(v)}">${pct(v, 1)}</div></span>
      </div>
      <div class="m-encre2 m-t12">${m.part > 0
        ? `Sa part : ${entierPct(m.commission)} des bénéfices, soit ${montant(m.part)} si tu reprends maintenant.`
        : `Sa part : ${entierPct(m.commission)} des bénéfices. Il ne touche rien tant qu'il ne te fait pas gagner.`}</div>
      <div class="mk-x42 rangee">
        ${apres ? `<span class="mk-x43 m-encre2">Renégociable le ${esc(apres)}</span>` : `<button class="m-contour" data-action="negocier" data-id="${m.id}">Négocier sa part</button>`}
        <span class="espace"></span><button class="m-encre" data-action="reprendre" data-id="${m.id}">Reprendre</button>
      </div></div>`;
  }).join("");
  return `<div class="m-colonne12">
    <div class="rangee entre">${libelle("Gérants")}${petit(`${icone("ui:plus", 13)}Confier de l'argent`, "confier", { plein: !t.mandats.length })}</div>
    ${t.mandats.length ? "" : `<p class="aide">Un gérant fait travailler ton argent à ta place, et se paie sur ce qu'il te fait gagner.</p>`}
    ${mandats}</div>`;
}

/** Une dépêche (LigneDepecheVue), sur papier ou sur le verre. */
function ligneDepeche(d, maintenant, surPapier = true) {
  const teinte = d.hausse ? (surPapier ? ENCRE.gain : "var(--gain)") : (surPapier ? ENCRE.perte : "var(--perte)");
  const ic = d.general ? (d.hausse ? "ui:flamme" : "ui:alerte") : (d.hausse ? "ui:hausse" : "ui:baisse");
  return `<div class="mk-x44">
    <div class="rangee" style="gap:6px;color:${teinte};font-size:12px">
      ${icone(ic, 12)}<b class="mk-x45">${d.general ? (d.hausse ? "Euphorie" : "Krach") : esc(d.rayon)}</b>
      <span style="color:${surPapier ? PAPIER.encre2 : "var(--texte2)"}">${esc(quand(d.date, maintenant))}</span>
      <span class="espace"></span><b class="mk-x45 m-num">${d.hausse ? "+" : MOINS}${pct(d.ampleur, 0, false)}</b>
    </div>
    <div class="m-serif" style="font-size:${d.general ? 16 : 15}px;font-weight:${d.general ? 700 : 500};line-height:1.3">${esc(d.titre)}</div></div>`;
}

function carteDepeches(t, maintenant) {
  const cinq = t.depeches.slice(0, 5);
  return papier(`<div class="m-colonne12">
    ${titrePapier("Le fil des marchés", "Les nouvelles qui font bouger les cours, les mêmes pour tous")}
    ${cinq.length ? "" : `<div class="m-encre2 m-t13">Pas de nouvelle ces derniers jours. Le marché respire.</div>`}
    ${cinq.map((d, i) => ligneDepeche(d, maintenant) + (i < cinq.length - 1 ? `<div class="m-filet-papier"></div>` : "")).join("")}</div>`);
}

/** RNT-197 : la presse financière, la une de demain (la prochaine nouvelle, un jour plus tôt). */
function carteUne(t) {
  if (!t.aLaUne) return "";
  const heure = (d) => { const x = new Date(d); return `${x.getHours()} h ${String(x.getMinutes()).padStart(2, "0")}`; };
  return papier(`<div id="a-la-une" class="mk-x46">
    ${titrePapier("À la une demain", "Ta presse financière : la prochaine nouvelle, avant tout le monde")}
    ${t.aLaUne.length ? t.aLaUne.map((d, i) => `<div class="mk-x44">
      <div class="rangee" style="gap:6px;color:${d.hausse ? ENCRE.gain : ENCRE.perte};font-size:12px">
        ${icone(d.hausse ? "ui:hausse" : "ui:baisse", 12)}<b class="mk-x45">${d.general ? (d.hausse ? "Euphorie" : "Krach") : esc(d.rayon)}</b>
        <span style="color:${PAPIER.encre2}">vers ${esc(heure(d.date))}</span>
        <span class="espace"></span><b class="mk-x45 m-num">${d.hausse ? "+" : MOINS}${pct(d.ampleur, 0, false)}</b></div>
      <div class="mk-x47 m-serif">${esc(d.titre)}</div></div>${i < t.aLaUne.length - 1 ? `<div class="m-filet-papier"></div>` : ""}`).join("")
      : `<div class="m-encre2 m-t13">Rien à la une d'ici demain : le marché devrait rester calme.</div>`}</div>`);
}

/** RNT-229 : les résultats des sept prochains jours ; avec la presse, l'avis des analystes. */
function carteResultats(t) {
  const l = t.resultats ?? [];
  if (!l.length) return "";
  const jour = (d) => new Date(d).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
  const teinte = (a) => (a === "Plutôt bons" ? ENCRE.gain : a === "Plutôt mauvais" ? ENCRE.perte : PAPIER.encre2);
  return papier(`<div class="m-colonne12">
    ${titrePapier("Résultats à venir", "Annoncés d'avance, ils font sauter le cours à 8 h. Les nouvelles récentes du rayon donnent la tendance.")}
    ${l.slice(0, 6).map((x, i) => `<button class="rangee m-ligne-resultat" ${lienTitre(x.symbole)}>
      <span class="m-coupe m-corps"><b class="m-gras">${esc(x.nom)}</b><span class="m-encre2"> · ${esc(jour(x.date))}</span></span>
      ${x.avis ? `<b class="m-avis" style="--c:${teinte(x.avis)}">${esc(x.avis)}</b>` : ""}</button>${i < Math.min(6, l.length) - 1 ? `<div class="m-filet-papier"></div>` : ""}`).join("")}
    ${l[0].avis == null ? `<div class="m-encre2 m-t12">Avec la presse financière : l'avis des analystes, titre par titre.</div>` : ""}</div>`);
}

function portefeuille(t, maintenant) {
  const s = t.semaine;
  return `${carteCompteTitres(t)}
    ${relevePositions(t)}
    ${optionsEnCours(t)}
    ${ticketsOrdres(t)}
    ${s.coups > 0 ? `<div class="mk-x48 rangee">${icone("ui:barres", 15)}Cette semaine : ${variation(s.realise)} sur ${s.coups} coup${s.coups > 1 ? "s" : ""} clos</div>` : ""}
    ${t.alertes.length ? `<div class="mk-x49">${libelle("Tes alertes")}${listeAlertes(t.alertes)}</div>` : ""}
    ${carteMandats(t)}
    ${carteUne(t)}
    ${carteResultats(t)}
    ${carteDepeches(t, maintenant)}`;
}

// MARK: - Décider depuis une feuille

/**
 * Comme ctx.decider, mais rend le refus au lieu d'en faire un toast : un toast passerait sous
 * la feuille ouverte, invisible (FeuilleGerants l'affiche dans la feuille, on fait de même).
 * Même mécanique que `jouer` dans app.js.
 */
async function deciderEnFeuille(ctx, operation) {
  // RNT-219 : ce qui paie passe par la fenêtre de paiement (rien n'est payé sans moyen choisi).
  const carte = await demanderPaiement(ctx.jouer, "marches", operation);
  if (carte === null) return "Paiement annulé.";
  const r = await ctx.etat.moteur.appel({ cmd: "decider", maintenant: ctx.maintenant(), famille: "marches", operation, ...(carte !== undefined ? { carte } : {}) });
  if (!r.ok) return r.erreur || "Refusé.";
  if ("focus" in r) ctx.etat.jeu = r;
  ctx.etat.modifie = true;
  if (r.aSauvegarder) ctx.sauvegarder();
  return null;
}

/** La feuille ouverte par cette zone : on la redessine en rappelant ctx.feuille (sans la rouvrir). */
let feuille = null;
function ouvrirFeuille(ctx, config) {
  styles();
  feuille = config;
  ctx.feuille({ titre: config.titre, rendu: () => (feuille?.rendu ?? config.rendu)(), actions: { ...actionsFeuille, ...config.actions } });
}
const redessiner = (ctx) => feuille && ctx.feuille({ titre: feuille.titre, rendu: () => feuille.rendu(), actions: { ...actionsFeuille, ...feuille.actions } });
const feuilleOuverte = () => document.getElementById("feuille")?.open === true;

// MARK: - Le pavé numérique (PaveNumerique, SaisieMontant)

/** L'état du pavé : la saisie (« 1250,5 »), proposée ou tapée, la limite, et ce que fait « Valider ». */
let pave = null;
const texteSaisie = (c) => (c % 100 === 0 ? String(c / 100) : `${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")}`);

function nouveauPave({ titre, aide = null, proposition = 0, maximum = null, entete = "", valider, annuler = null }) {
  return { titre, aide, maximum, entete, valider, annuler, saisie: proposition > 0 ? texteSaisie(proposition) : "", proposee: proposition > 0, erreur: null, enCours: false };
}

function centimesPave(p) {
  if (!p.saisie) return null;
  const [e, d = ""] = p.saisie.split(",");
  return Number(e || 0) * 100 + (d.length === 1 ? Number(d) * 10 : d.length === 2 ? Number(d) : 0);
}
const depasse = (p) => p.maximum != null && (centimesPave(p) ?? 0) > p.maximum;
const valide = (p) => (centimesPave(p) ?? 0) > 0 && !depasse(p);

function touche(p, t) {
  if (p.proposee) { p.proposee = false; p.saisie = ""; if (t === "effacer") return; }
  if (t === "effacer") { p.saisie = p.saisie.slice(0, -1); return; }
  if (t === ",") { if (!p.saisie.includes(",")) p.saisie = (p.saisie || "0") + ","; return; }
  const i = p.saisie.indexOf(",");
  if (i >= 0) { if (p.saisie.length - i <= 2) p.saisie += t; return; }
  if (p.saisie === "0") p.saisie = "";
  if (p.saisie.length < 9) p.saisie += t;
}

function affichagePave(p) {
  if (!p.saisie) return "0";
  const [e, d] = p.saisie.split(",");
  const tete = (e || "0").replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  return d !== undefined ? `${tete},${d}` : tete;
}

function renduPave(p, { avecTitre = false } = {}) {
  const aide = p.maximum != null ? (depasse(p) ? `Au-delà de ta limite : ${mc(p.maximum)}` : `Au plus ${mc(p.maximum)}`) : (p.aide ?? NB);
  const touches = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "effacer"];
  return `
    ${avecTitre ? `<div class="m-titre-feuille">${esc(p.titre)}</div>` : ""}
    ${p.entete}
    <div class="m-affichage" aria-live="polite">
      <div class="m-somme"><span id="m-pave-montant" style="color:${p.proposee ? "var(--texte2)" : "var(--texte)"}">${affichagePave(p)}</span><small>€</small></div>
      <div style="font-size:13px;margin-top:6px;${depasse(p) ? "font-weight:600;color:var(--perte)" : "color:var(--texte2)"}">${esc(aide)}</div>
    </div>
    ${p.maximum != null ? `<div class="m-raccourcis">${[[0.25, "25 %"], [0.5, "50 %"], [1, "Tout"]].map(([x, t]) => petit(t, "paveRaccourci", { donnees: { part: x } })).join("")}</div>` : ""}
    <div class="m-clavier">${touches.map((t) => `<button data-action="paveTouche" data-touche="${t}" aria-label="${t === "effacer" ? "effacer" : t === "," ? "virgule" : t}">${t === "effacer"
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M8.5 5H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8.5L3 12z"/><path d="M11.5 9.5l5 5M16.5 9.5l-5 5"/></svg>` : t}</button>`).join("")}</div>
    ${p.erreur ? `<div class="m-erreur">${icone("ui:alerte", 16)}${esc(p.erreur)}</div>` : ""}
    ${bouton("Valider", "paveValider", { desactive: !valide(p) || p.enCours })}
    ${bouton("Annuler", "paveAnnuler", { genre: "discret" })}`;
}

/** Un pavé dans sa propre feuille : `valider(v)` rend un refus (texte) ou null. */
function ouvrirPave(ctx, options) {
  pave = nouveauPave(options);
  ouvrirFeuille(ctx, { titre: options.titre, rendu: () => renduPave(pave), actions: {} });
}

/** Les touches du pavé, communes à toutes les feuilles de la zone. */
const actionsFeuille = {
  paveTouche(ctx, b) { if (!pave) return; touche(pave, b.dataset.touche); pave.erreur = null; redessiner(ctx); },
  paveRaccourci(ctx, b) {
    if (!pave?.maximum) return;
    const c = Math.floor(pave.maximum * Number(b.dataset.part));
    pave.saisie = c > 0 ? texteSaisie(c) : "";
    pave.proposee = false;
    pave.erreur = null;
    redessiner(ctx);
  },
  async paveValider(ctx) {
    if (!pave || !valide(pave) || pave.enCours) return;
    const p = pave;
    p.enCours = true;
    const refus = await p.valider(centimesPave(p));
    p.enCours = false;
    if (refus && pave === p) { p.erreur = refus; redessiner(ctx); }
  },
  paveAnnuler(ctx) { if (pave?.annuler) pave.annuler(); else ctx.fermerFeuille(); },
};

// Au clavier : les chiffres, la virgule, l'effacement et Entrée, quand un pavé est ouvert.
if (typeof document !== "undefined") {
  document.addEventListener("keydown", (e) => {
    if (!pave || !feuilleOuverte() || !document.querySelector("#feuille .m-clavier") || e.metaKey || e.ctrlKey) return;
    const t = /^[0-9]$/.test(e.key) ? e.key : e.key === "," || e.key === "." ? "," : e.key === "Backspace" ? "effacer" : e.key === "Enter" ? "valider" : null;
    if (!t) return;
    e.preventDefault();
    const b = document.querySelector(t === "valider" ? '#feuille [data-action="paveValider"]' : `#feuille [data-touche="${t}"]`);
    b?.click();
  });
}

/** Une décision prise depuis un pavé : succès → toast et fermeture ; refus → affiché dans la feuille. */
const decisionPave = (ctx, operation, succes) => async (v) => {
  const refus = await deciderEnFeuille(ctx, operation(v));
  if (refus) return refus;
  ctx.fermerFeuille();
  ctx.toast(succes(v), "gain");
  await ctx.rafraichir();
  return null;
};

// MARK: - Les règles du marché (balance)

let regles = null;
async function reglesMarches(ctx) {
  if (!regles) {
    const b = await balanceGardee(ctx, "marches");
    regles = { seuilLiquidation: b?.seuilLiquidation ?? 0.1, paliers: (b?.paliers ?? []).map((p) => p.part), montantMin: b?.gerants?.montantMinCentimes ?? null };
  }
  return regles;
}

// MARK: - Les pages

let rafraichiA = 0, enLecture = false;

export const pages = {
  marches: {
    titre: "Marchés",
    async donnees(ctx, p) {
      styles();
      pMarches = p;
      const [t, r] = await Promise.all([ctx.tableau("marches"), reglesMarches(ctx)]);
      rafraichiA = Date.now();
      return { t, r };
    },
    // D352 : plus une racine d'onglet (D341 : les marchés sont une part d'Actifs ; « marches » y mène, app.js) :
    // sans en-tête d'onglet, le même rendu que la part.
    rendu(d, ctx, p) {
      pMarches = p;
      return section.rendu(d, ctx);
    },
    /** Toutes les 5 secondes, comme le TimelineView de l'iPhone : les cours glissent. */
    async tic(ctx, d) {
      if (!d?.t || enLecture || Date.now() - rafraichiA < 5000 || !document.getElementById("m-page-marches")) return;
      enLecture = true;
      rafraichiA = Date.now();
      try {
        const t = await ctx.tableau("marches");
        if (!t || !document.getElementById("m-page-marches")) return;
        d.t = t;
        document.getElementById("m-portefeuille").innerHTML = portefeuille(t, ctx.maintenant());
        majBandeau(t);
        majRecherche(t);
      } finally { enLecture = false; }
    },
    actions: {
      chercher(ctx, el, d) { liste.recherche = el.value; liste.montres = PAR_PAGE; majRecherche(d.t); },
      plusTitres(ctx, b, d) { liste.montres += PAR_PAGE; majRecherche(d.t); },
      effacerRecherche(ctx, el, d) {
        liste.recherche = "";
        const champ = document.getElementById("m-recherche");
        if (champ) { champ.value = ""; champ.focus(); }
        majRecherche(d.t);
      },
      filtrer(ctx, b, d) {
        const id = b.dataset.id; // D453 : la case tourne (vide → incluse → exclue → vide), la pastille retire
        liste.filtres = b.dataset.retirer ? FL.retirerCase(liste.filtres, id) : FL.basculerCase(liste.filtres, id);
        liste.montres = PAR_PAGE;
        garderListe();
        majRecherche(d.t);
        if (ctx.etat?.feuille?.marches) ctx.redessiner(); // la feuille ouverte suit
      },
      // D462 : le mode du groupe « Aujourd'hui » : « Toutes » ou « Au moins une ».
      modeFiltres(ctx, b, d) {
        if (b.dataset.ou === "1") liste.ou.add(b.dataset.groupe); else liste.ou.delete(b.dataset.groupe);
        liste.montres = PAR_PAGE;
        garderListe();
        majRecherche(d.t);
        if (ctx.etat?.feuille?.marches) ctx.redessiner();
      },
      toutEffacer(ctx, b, d) {
        liste.filtres.clear();
        liste.recherche = "";
        const champ = document.getElementById("m-recherche");
        if (champ) champ.value = "";
        garderListe();
        majRecherche(d.t);
        if (ctx.etat?.feuille?.marches) ctx.redessiner();
      },
      ouvrirFiltres(ctx, b, d) {
        ctx.feuille({ titre: "Filtres", rendu: () => feuilleFiltres(d.t) });
        if (ctx.etat?.feuille) ctx.etat.feuille.marches = true;
      },
      trier(ctx, b, d) {
        ouvrirFeuille(ctx, {
          titre: "Trier par",
          rendu: () => `<div class="mk-x50 carte">${TRIS.map((x) => `
            <button class="ligne" data-action="choisirTri" data-id="${x.id}"><span class="mk-x51 titre">${esc(x.nom)}</span>${x.id === liste.tri ? `<span class="mk-x52">✓</span>` : ""}</button>`).join("")}</div>
            <div class="carte"><button class="ligne" data-action="inverserTri"><span class="mk-x51 titre">${liste.croissant ? "Ordre croissant" : "Ordre décroissant"}</span><span class="t2">${liste.croissant ? "↑" : "↓"}</span></button></div>`,
          actions: {
            choisirTri(ctx2, b2) {
              const x = TRIS.find((y) => y.id === b2.dataset.id);
              if (x.id !== liste.tri) liste.croissant = x.croissant; // un nouveau critère part dans son sens naturel
              liste.tri = x.id;
              liste.montres = PAR_PAGE;
              garderListe();
              ctx2.fermerFeuille();
              majRecherche(d.t);
            },
            inverserTri(ctx2) { liste.croissant = !liste.croissant; garderListe(); redessiner(ctx2); majRecherche(d.t); },
          },
        });
      },
      async annulerOrdre(ctx, b, d) {
        const o = d.t.ordres.find((x) => x.id === Number(b.dataset.id));
        if (!o) return;
        await ctx.decider("marches", { annuler: { ordre: o.id } }, { succes: `Ordre annulé, ${montant(o.mise)} rendus` });
      },
      async retirerAlerte(ctx, b) {
        await ctx.decider("marches", { retirerAlerte: { _0: Number(b.dataset.id) } }, { succes: "Alerte retirée" });
      },
      async negocier(ctx, b) {
        // Sans message de succès : le journal dit comment la négociation s'est passée.
        if (!(await ctx.decider("marches", { negocier: { mandat: Number(b.dataset.id) } }))) return;
        const j = await ctx.jouer("journal", { nombre: 1 });
        const e = j?.journal?.[0];
        if (e) ctx.toast(e.detail ? `${e.titre} : ${e.detail}` : e.titre);
      },
      async reprendre(ctx, b, d) {
        const m = d.t.mandats.find((x) => x.id === Number(b.dataset.id));
        if (!m) return;
        await ctx.decider("marches", { reprendre: { mandat: m.id } }, { succes: `${montant(m.net)} repris à ${m.nom}` });
      },
      async confier(ctx, b, d) { await feuilleGerants(ctx, d); },
      revendreOption: (ctx, b, d) => revendreOption(ctx, b, d.t.options), // D404
      autresOptions: (ctx, b, d) => ouvrirAutresOptions(ctx, d.t.autresOptions ?? []),
    },
  },

  "marches.titre": {
    titre: "Titre",
    async donnees(ctx, p) {
      styles();
      const [t, r] = await Promise.all([ctx.tableau("titre", { id: p.id }), reglesMarches(ctx)]);
      rafraichiA = Date.now();
      return { t, r };
    },
    rendu(d, ctx, p) {
      styles();
      const t = d?.t;
      if (!t) return `${entetePousse(p.id ?? "Titre")}<div class="vide">Ce titre n'est pas disponible.</div>`;
      return `${entetePousse(t.nom, boutonAide("titre"))}<div class="mk-x53 m-pile" id="m-page-titre">${ficheTitre(t, d.r, ctx)}<div>${boutonMontant(ctx, t.symbole, t.nom)}</div></div>`;
    },
    async tic(ctx, d, p) {
      if (!d?.t || enLecture || Date.now() - rafraichiA < 5000 || !document.getElementById("m-page-titre")) return;
      rafraichiA = Date.now();
      if (feuilleOuverte()) {
        // Seul le graphique vit dans sa feuille ; l'ordre et l'option gardent leur cours d'ouverture.
        if (graphe?.symbole === p.id && feuille?.graphique) await chargerGraphe(ctx);
        return;
      }
      enLecture = true;
      try { await ctx.rafraichir(); } finally { enLecture = false; }
    },
    actions: {
      graphique: (ctx, b, d, p) => ouvrirGraphique(ctx, p.id, d.t.nom),
      alerte(ctx, b, d) {
        const t = d.t;
        ouvrirPave(ctx, {
          titre: "Alerte de cours", aide: "Une notification quand le cours atteint ce prix, même app fermée", proposition: t.cours,
          valider: decisionPave(ctx, (v) => ({ alerte: { symbole: t.symbole, cours: v } }), (v) => `Alerte posée à ${mc(v)}`),
        });
      },
      async retirerAlerte(ctx, b) {
        await ctx.decider("marches", { retirerAlerte: { _0: Number(b.dataset.id) } }, { succes: "Alerte retirée" });
      },
      stop(ctx, b, d) {
        const id = Number(b.dataset.id);
        ouvrirPave(ctx, {
          titre: "Stop-loss", aide: "Vend automatiquement si le cours passe ce prix", proposition: d.t.cours,
          valider: decisionPave(ctx, (v) => ({ stop: { position: id, cours: v } }), (v) => `Stop-loss posé à ${mc(v)}`),
        });
      },
      objectif(ctx, b, d) {
        const id = Number(b.dataset.id);
        ouvrirPave(ctx, {
          titre: "Prise de bénéfice", aide: "Encaisse automatiquement à ce prix", proposition: d.t.cours,
          valider: decisionPave(ctx, (v) => ({ objectif: { position: id, cours: v } }), (v) => `Encaisse à ${mc(v)}`),
        });
      },
      marge(ctx, b, d) {
        const id = Number(b.dataset.id);
        ouvrirPave(ctx, {
          titre: "Marge à ajouter", maximum: d.t.disponible,
          valider: decisionPave(ctx, (v) => ({ marge: { position: id, montant: v } }), (v) => `${montant(v)} de marge ajoutés`),
        });
      },
      async fermer(ctx, b, d) {
        const p = d.t.positions.find((x) => x.id === Number(b.dataset.id));
        if (!p) return;
        await ctx.decider("marches", { fermer: { position: p.id } }, { succes: `Position fermée, ${montant(p.valeur)} (${variation(p.valeur - p.mise)})` });
      },
      acheter: (ctx, b, d) => ouvrirOrdre(ctx, d.t, d.r, 1),
      baisse: (ctx, b, d) => ouvrirOrdre(ctx, d.t, d.r, -1),
      option: (ctx, b, d) => ouvrirOption(ctx, d.t),
      revendreOption: (ctx, b, d) => revendreOption(ctx, b, d.t.options), // D404
    },
  },
};

// MARK: - La fiche d'un titre (EcranTitre)

function certificat(t) {
  const teinte = t.couleur ?? "#2A3A44";
  return `<button class="m-guilloche m-certificat" data-action="graphique" aria-label="${esc(t.nom)}, ouvre le graphique en grand"
    style="background:linear-gradient(135deg,color-mix(in srgb,${teinte} 55%,#111114),#111114)">${guilloche(0.06)}
    <div class="mk-x37 rangee">
      ${pastille(t, 40)}
      <span class="mk-x7"><div class="mk-x54 m-serif m-coupe">${esc(t.nom)}</div><div class="mk-x55 m-coupe">${esc(t.symbole)}, ${esc(t.place)}</div></span>
      ${t.reel ? "" : `<span class="mk-x56">Simulé</span>`}
    </div>
    <div class="mk-x57 chiffres ${eclat(`t${t.symbole}`, t.cours)}">${mc(t.cours)}</div>
    <div class="rangee" style="gap:6px;font-size:14px;font-weight:600;color:${couleur(t.variation)}">${icone(t.variation >= 0 ? "ui:hausse" : "ui:baisse", 14)}${pct(t.variation)} depuis hier</div>
    <div class="mk-x58">${courbe(t.courbe, null, { hauteur: 96 })}</div>
  </button>`;
}

/** « 0,0000012 % » : assez de décimales pour voir quelque chose, jamais de notation scientifique. */
function textePart(p) {
  if (!(p > 0)) return `0${NB}%`;
  const x = p * 100;
  const dec = x >= 1 ? 1 : Math.min(10, Math.ceil(-Math.log10(x)) + 1);
  return `${x.toFixed(dec).replace(".", ",")}${NB}%`;
}

/** Ta part de l'entreprise (RNT-39) : la jauge, le palier, le suivant. */
function carteCapital(c, nom, r, patrimoine) {
  const ech = (x) => Math.min(1, Math.sqrt(Math.max(0, x)));
  const ligneAide = (g, dr) => `<div class="rangee entre"><span class="aide">${g}</span><span class="m-num m-num13">${dr}</span></div>`;
  return `<div class="carte pad m-pile12">
    <div class="rangee entre m-base"><span class="libelle">Ta part de ${esc(nom)}</span><span class="m-num m-num15">${textePart(c.part)}</span></div>
    <div class="mk-x59" aria-hidden="true">
      <i style="position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:var(--or);width:max(${c.part > 0 ? 3 : 0}px,${(ech(c.part) * 100).toFixed(2)}%)"></i>
      ${r.paliers.map((x) => `<i style="position:absolute;top:0;bottom:0;width:1.5px;background:rgba(255,255,255,.35);left:${(ech(x) * 100).toFixed(2)}%"></i>`).join("")}
    </div>
    ${c.palier ? `<div class="mk-x60 rangee or">${icone("ui:sceau", 15)}${esc(c.palier)}</div>${c.detailPalier ? `<p class="aide">${esc(c.detailPalier)}</p>` : ""}` : ""}
    ${c.prochain ? `<p class="aide">${c.prochain.manque <= Math.max(1, patrimoine ?? 0) * 50
      ? `${esc(c.prochain.nom)} à ${Math.round(c.prochain.part * 100)} % : encore ${montant(c.prochain.manque)} d'actions.`
      : "Les paliers (5, 20 et 50 % du capital) sont hors de portée sur un géant pareil : vise une petite capitalisation."}</p>` : ""}
    ${c.part < 0.5 ? `<p class="aide">Au-delà de 50 %, tu la contrôles : tu votes la distribution, son dividende est doublé.</p>` : ""}
    ${ligneAide("Capitalisation", montant(c.capitalisation))}
  </div>`;
}

/** RNT-229 : ce que le titre verse chaque dimanche, et ses résultats (date annoncée, les derniers tombés). */
function carteRendement(t) {
  const jour = (d) => new Date(d).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
  const ligneAide = (g, dr) => `<div class="rangee entre"><span class="aide">${g}</span><span class="m-num m-num13">${dr}</span></div>`;
  const pr = t.prochainsResultats, dr = t.derniersResultats;
  if (!(t.dividendeSemaine > 0) && !pr) return "";
  return `<div class="carte pad m-pile10">
    <div class="rangee entre m-base"><span class="libelle">Ce qu'il rapporte</span>${t.style ? `<span class="aide">${t.style === "rendement" ? "Valeur de rendement" : "Valeur de croissance"}</span>` : ""}</div>
    ${ligneAide("Dividende", t.dividendeSemaine > 0 ? `${pct(t.dividendeSemaine, 2, false)} par semaine, versé chaque soir` : "Aucun")}
    ${t.dividendeSemaine > 0 ? `<p class="aide">Versé sur les actions que tu as payées : la part empruntée d'un levier n'en touche pas.</p>` : ""}
    ${pr ? ligneAide("Prochains résultats", `${jour(pr.date)}, 8 h`) : ""}
    ${pr?.avis ? ligneAide("Avis des analystes", `${pr.avis} (${Math.round(pr.chanceBons * 100)} %)`) : ""}
    ${dr?.saut != null ? ligneAide("Derniers résultats", `${dr.saut > 0 ? "Bons" : "Décevants"}, ${dr.saut > 0 ? "+" : MOINS}${pct(Math.abs(dr.saut), 0, false)}`) : ""}
  </div>`;
}

/** Chaque position est un ticket, comme un ordre en attente. */
function positionsTitre(t) {
  return `<div class="m-colonne12">${libelle("Tes positions")}${t.positions.map((p) => {
    const pv = p.valeur - p.mise;
    return `<div class="m-ticket colonne">
      <div class="rangee entre m-base">
        <span><div class="mk-x61 m-encre2">${esc(p.libelle)}</div><div class="mk-x62 m-rond m-num">${montant(p.valeur)}</div></span>
        <span class="m-num" style="font-size:15px;font-weight:600;color:${encre(pv)}">${variation(pv)}</span>
      </div>
      <div class="m-encre2 m-t12">${p.liquidation != null ? `${p.libelle.startsWith("Vente à découvert") ? "Rachat forcé" : "Liquidation"} à ${mc(p.liquidation)}` : "Pas de liquidation"}</div>
      ${p.appel ? `<div class="m-appel">Appel de marge : la position vaut moins de 40 % de ta mise. À 10 %, elle est liquidée.</div>
        <button class="mk-x63 m-encre" data-action="marge" data-id="${p.id}">Remettre de la marge</button>` : ""}
      <div class="mk-x64 rangee">
        <button class="m-contour" data-action="stop" data-id="${p.id}">${p.stop != null ? `Stop ${montant(p.stop)}` : "Stop-loss"}</button>
        <button class="m-contour" data-action="objectif" data-id="${p.id}">${p.objectif != null ? `Encaisser à ${montant(p.objectif)}` : "Encaisser à…"}</button>
        <span class="espace"></span><button class="m-encre" data-action="fermer" data-id="${p.id}">Fermer</button>
      </div></div>`;
  }).join("")}</div>`;
}

function ficheTitre(t, r, ctx) {
  const ic = (n) => icone(n, 17);
  return `
    ${certificat(t)}
    ${t.depeche ? `<div class="mk-x65 carte">${ligneDepeche(t.depeche, ctx.maintenant(), false)}</div>` : ""}
    <div class="mk-x66 grille2">
      ${bouton(`${ic("ui:courbe")}Graphique`, "graphique", { genre: "secondaire" })}
      ${bouton(`${ic("ui:clocheAlerte")}Alerte`, "alerte", { genre: "secondaire" })}
    </div>
    ${t.alertes.length ? listeAlertes(t.alertes) : ""}
    ${t.capital ? carteCapital(t.capital, t.nom, r, ctx.etat.jeu?.accueil?.patrimoine) : ""}
    ${carteRendement(t)}
    ${t.positions.length ? positionsTitre(t) : ""}
    <div class="mk-x66 grille2">
      ${bouton(`${ic("ui:hausse")}Acheter`, "acheter", { desactive: t.gele })}
      ${bouton(`${ic("ui:baisse")}${t.decouvert ? "Vendre à découvert" : "Parier à la baisse"}`, "baisse", { genre: "teinte", teinte: "var(--vente)", desactive: t.gele, style: "padding:0 12px;white-space:nowrap" })}
    </div>
    ${t.optionsProposees ? bouton(`${ic("ui:calendrier")}Option`, "option", { genre: "teinte", teinte: "var(--controles)", desactive: t.gele }) : ""}
    ${t.options.length ? `<div class="m-colonne12">${libelle("Tes options")}${t.options.map((o) => ticketOption(o)).join("")}</div>` : ""}
    ${t.gele ? `<p class="aide">Compte courant gelé : aucun achat pour l'instant.</p>` : ""}`;
}

// MARK: - L'ordre de bourse en quatre temps (FeuilleOrdre, RNT-31)

let ordre = null;
const verbe = (o) => (o.sens > 0 ? "Acheter" : o.t.decouvert ? "Vendre à découvert" : "Parier à la baisse");
const execution = (o) => o.t.coursExact * (1 + (o.ecartLimite ?? 0));
const prixStop = (o, x, e) => x * (1 - o.sens * e);
const prixObjectif = (o, x, e) => x * (1 + o.sens * e);

/** ApercuOrdre (TableauMarches.swift) : mise × levier, les parts, le cours de liquidation. */
function apercu(o, coursRef) {
  const lev = Math.max(1, o.levier);
  const mise = Math.max(0, o.mise);
  const exposition = Math.round(mise * lev);
  return {
    mise, exposition,
    parts: coursRef > 0 ? exposition / coursRef : 0,
    liquidation: o.levier > 1 || o.sens < 0 ? Math.round(coursRef * (1 - o.sens * (1 - o.seuil) / lev)) : null,
  };
}

const capsuleTitre = (t, texte) => `<div class="m-capsule">${pastille(t, 28)}<span class="mk-x39 m-coupe">${esc(texte)}</span><span class="mk-x67 m-num">${mc(t.cours)}</span></div>`;
const groupe = (titre, contenu) => `<div class="carte m-groupe">${libelle(titre)}${contenu}</div>`;
const pilules = (options, choisie, action, lib) => `<div class="m-pilules">${options.map((e, i) =>
  `<button class="m-pilule haute" data-action="${action}" data-i="${i}" aria-pressed="${e === choisie}">${esc(lib(e))}</button>`).join("")}</div>`;

function ouvrirOrdre(ctx, t, r, sens) {
  // RNT-229 : à la baisse, une vente à découvert : la mise est la garantie, l'exposition est fixée, rachat forcé quand elle est mangée.
  const dec = sens < 0 && t.decouvert;
  ordre = { t, sens, etape: 0, mise: 0, levier: dec ? t.levierDecouvert : 1, decouvert: !!dec, ecartLimite: null, ecartStop: null, ecartObjectif: null,
    seuil: dec ? 0 : r.seuilLiquidation, erreur: null, enCours: false };
  pave = nouveauPaveOrdre(ctx);
  ouvrirFeuille(ctx, { titre: "", rendu: renduOrdre, actions: actionsOrdre });
}

function nouveauPaveOrdre(ctx) {
  const o = ordre;
  return nouveauPave({
    titre: o.sens > 0 ? "Combien investir ?" : o.decouvert ? "Quelle garantie bloquer ?" : "Combien parier ?",
    proposition: o.mise > 0 ? o.mise : Math.min(200_000, o.t.disponible),
    maximum: o.t.disponible,
    entete: capsuleTitre(o.t, `${verbe(o)}, ${o.t.nom}`),
    valider: async (v) => { o.mise = v; o.etape = 1; redessiner(ctx); return null; },
  });
}

const OPTIONS_LIMITE = [null, -0.02, -0.05, -0.1];
const OPTIONS_STOP = [null, 0.05, 0.1, 0.2];
const OPTIONS_OBJECTIF = [null, 0.1, 0.25, 0.5];

function renduOrdre() {
  const o = ordre, t = o.t;
  // D345 : les étapes numérotées (faites en coches), comme la fondation d'une boîte.
  const indicateur = etapesNumerotees(["Montant", o.decouvert ? "Découvert" : "Levier", "Quand", "Signature"], o.etape);
  const retour = o.etape > 0 ? bouton("Retour", "ordreRetour", { genre: "discret" }) : "";
  let corps = "";
  if (o.etape === 0) corps = renduPave(pave, { avecTitre: true });
  else if (o.etape === 1 && o.decouvert) {
    const d = t.decouvert, hausse = (1 - o.seuil) / o.levier;
    corps = `<div class="m-titre-feuille">Vente à découvert</div>
      <div class="carte m-cadre-decouvert">
        <div class="aide">Tu vends des titres empruntés pour</div>
        <div class="chiffres m-gros">${montant(o.mise * o.levier)}</div>
        <p class="aide">Garantie bloquée : ${montant(o.mise)} (${Math.round(d.garantie * 100)} %). Si le cours monte de +${Math.round(hausse * 100)}${NB}%, elle est mangée : rachat forcé.</p>
        ${regleRisque(hausse, o.sens)}
        <p class="aide">L'emprunt des titres coûte ${pct(d.fraisEmpruntSemaine, 1, false)} de ce qu'ils valent, chaque dimanche.</p>
      </div>
      ${bouton("Continuer", "ordreSuivant")}`;
  } else if (o.etape === 1) {
    const baisse = (1 - o.seuil) / o.levier;
    const sansRisque = o.sens > 0 && o.levier === 1;
    corps = `<div class="m-titre-feuille">Quel levier ?</div>
      <div class="m-leviers">${t.leviers.map((l) => `<button data-action="ordreLevier" data-levier="${l}" aria-pressed="${l === o.levier}" aria-label="Levier ${l}">
        <span class="mk-x68 chiffres">×${l}</span><span class="mk-x69 m-num">${montant(o.mise * l)}</span></button>`).join("")}</div>
      <div class="carte m-cadre-decouvert">
        ${sansRisque ? `<div class="mk-x70 chiffres gain">Aucune liquidation</div><p class="aide">Sans levier, tu ne perds jamais plus que ce que le titre perd.</p>`
          : `<div class="chiffres" style="font-size:44px;line-height:1.1;color:${baisse < 0.25 ? "var(--perte)" : "var(--alerte)"}">${o.sens > 0 ? MOINS : "+"}${Math.round(baisse * 100)}${NB}%</div>
             <p class="aide">${o.sens > 0 ? "Si le cours baisse d'autant, ta mise est perdue." : "Si le cours monte d'autant, ta mise est perdue."}</p>
             ${o.sens > 0 && o.levier > 1 && t.financementLevierSemaine ? `<p class="aide">La part empruntée (${montant(o.mise * (o.levier - 1))}) coûte ${pct(t.financementLevierSemaine, 1, false)} chaque dimanche, et ne touche pas de dividende.</p>` : ""}`}
        ${regleRisque(sansRisque ? null : baisse, o.sens)}
      </div>
      ${bouton("Continuer", "ordreSuivant")}`;
  } else if (o.etape === 2) {
    const x = execution(o);
    const limites = OPTIONS_LIMITE.map((e) => (e == null ? null : o.sens > 0 ? e : -e));
    corps = `<div class="m-titre-feuille">Quand, et jusqu'où ?</div>
      ${groupe(o.sens > 0 ? "Acheter" : "Parier", `${pilules(limites, o.ecartLimite, "ordreLimite", (e) => (e == null ? "Maintenant" : pct(e, 0)))}
        <p class="aide">${o.ecartLimite == null ? `Au cours du moment, ${mc(t.cours)}.` : `Quand le cours atteint ${mc(Math.round(x))} : l'argent est réservé d'ici là.`}</p>`)}
      ${groupe("Couper les pertes", `${pilules(OPTIONS_STOP, o.ecartStop, "ordreStop", (e) => (e == null ? "Aucun" : `${o.sens > 0 ? MOINS : "+"}${Math.round(e * 100)}${NB}%`))}
        <p class="aide">${o.ecartStop == null ? "Pas de stop-loss : la position reste ouverte quoi qu'il arrive." : `Vend tout seul à ${mc(Math.round(prixStop(o, x, o.ecartStop)))}.`}</p>`)}
      ${groupe("Encaisser les gains", `${pilules(OPTIONS_OBJECTIF, o.ecartObjectif, "ordreObjectif", (e) => (e == null ? "Aucun" : `${o.sens > 0 ? "+" : MOINS}${Math.round(e * 100)}${NB}%`))}
        <p class="aide">${o.ecartObjectif == null ? "Pas de prix d'encaissement : c'est toi qui fermeras." : `Encaisse tout seul à ${mc(Math.round(prixObjectif(o, x, o.ecartObjectif)))}.`}</p>`)}
      ${bouton("Voir l'ordre", "ordreSuivant")}`;
  } else {
    const x = execution(o);
    const a = apercu(o, x);
    const parts = `${nombre(a.parts, a.parts < 10 ? 2 : 0)} ${a.parts > 1 ? "parts" : "part"}`;
    // RNT-233 : l'ordre défile s'il est plus haut que la feuille ; « Signer » et « Retour » restent collés en bas.
    corps = `<div class="ticket-defile">${papier(`<div class="m-colonne12">
        <div class="mk-x71 rangee entre">${titrePapier("Ordre de bourse", `${t.nom}, ${t.place}`)}${pastille(t, 34)}</div>
        ${champPapier("Sens", verbe(o))}
        ${champPapier("Exécution", o.ecartLimite == null ? "Au marché" : `À ${mc(Math.round(x))}`)}
        ${champPapier(o.decouvert ? "Garantie bloquée" : "Mise", montant(a.mise))}
        ${o.decouvert ? "" : champPapier("Levier", `×${o.levier}`)}
        ${champPapier(o.decouvert ? "Titres vendus" : "Exposition", montant(a.exposition))}
        ${o.decouvert ? champPapier("Frais d'emprunt", `${pct(t.decouvert.fraisEmpruntSemaine, 1, false)} par semaine`) : ""}
        ${champPapier("Parts, environ", parts)}
        ${champPapier("Stop-loss", o.ecartStop == null ? "Aucun" : mc(Math.round(prixStop(o, x, o.ecartStop))))}
        ${champPapier("Encaisser à", o.ecartObjectif == null ? "Aucun" : mc(Math.round(prixObjectif(o, x, o.ecartObjectif))))}
        ${champPapier(o.decouvert ? "Rachat forcé" : "Liquidation", a.liquidation == null ? "Aucune" : mc(a.liquidation), true)}
      </div>`)}
      ${o.erreur ? `<div class="m-erreur">${icone("ui:alerte", 16)}${esc(o.erreur)}</div>` : ""}</div>
      <div class="ticket-actions">${bouton(o.ecartLimite == null ? `Signer : ${verbe(o).toLowerCase()}, ${montant(o.mise)}` : "Signer l'ordre", "ordreSigner", { desactive: o.enCours || o.mise <= 0 || t.gele })}
      ${t.gele ? `<p class="mk-x72 aide">Compte courant gelé : aucun achat pour l'instant.</p>` : ""}${retour}</div>`;
    return `${indicateur}${corps}`;
  }
  return `${indicateur}${corps}${retour}`;
}

/** La règle du risque : le cours d'aujourd'hui au milieu, la liquidation en rouge (±50 % sur la largeur). */
function regleRisque(baisse, sens) {
  const milieu = 50;
  const x = baisse == null ? null : milieu - sens * (Math.min(0.5, baisse) / 0.5) * milieu;
  const debut = x == null ? 0 : sens > 0 ? 0 : x, fin = x == null ? 0 : sens > 0 ? x : 100;
  return `<div class="mk-x73" aria-hidden="true">
    <i class="mk-x74"></i>
    ${x == null ? "" : `<i style="position:absolute;left:${debut}%;width:${Math.max(0, fin - debut)}%;top:12px;height:6px;border-radius:99px;background:color-mix(in srgb,var(--perte) 55%,transparent)"></i>
      <i style="position:absolute;left:calc(${x}% - 1px);top:4px;width:2px;height:22px;background:var(--perte)"></i>`}
    <i class="mk-x75"></i></div>`;
}

const actionsOrdre = {
  ordreLevier(ctx, b) { ordre.levier = Number(b.dataset.levier); redessiner(ctx); },
  ordreSuivant(ctx) { ordre.etape = Math.min(3, ordre.etape + 1); redessiner(ctx); },
  ordreRetour(ctx) {
    if (ordre.etape === 0) return ctx.fermerFeuille();
    ordre.etape -= 1;
    ordre.erreur = null;
    if (ordre.etape === 0) pave = nouveauPaveOrdre(ctx);
    redessiner(ctx);
  },
  ordreLimite(ctx, b) { const e = OPTIONS_LIMITE[Number(b.dataset.i)]; ordre.ecartLimite = e == null ? null : ordre.sens > 0 ? e : -e; redessiner(ctx); },
  ordreStop(ctx, b) { ordre.ecartStop = OPTIONS_STOP[Number(b.dataset.i)]; redessiner(ctx); },
  ordreObjectif(ctx, b) { ordre.ecartObjectif = OPTIONS_OBJECTIF[Number(b.dataset.i)]; redessiner(ctx); },
  async ordreSigner(ctx) {
    const o = ordre;
    if (!o || o.enCours) return;
    o.enCours = true;
    const x = execution(o);
    const op = { symbole: o.t.symbole, sens: o.sens, mise: o.mise, levier: o.levier };
    if (o.ecartLimite != null) op.limite = x;
    if (o.ecartStop != null) op.stop = prixStop(o, x, o.ecartStop);
    if (o.ecartObjectif != null) op.objectif = prixObjectif(o, x, o.ecartObjectif);
    const refus = await deciderEnFeuille(ctx, { ordre: op });
    o.enCours = false;
    if (refus) { o.erreur = refus; return redessiner(ctx); }
    ctx.fermerFeuille();
    ctx.toast(o.ecartLimite == null
      ? `${o.sens > 0 ? "Acheté" : o.decouvert ? "Vendu à découvert" : "Pari à la baisse"} : ${o.t.nom}, ${montant(o.decouvert ? o.mise * o.levier : o.mise)}${o.levier > 1 && !o.decouvert ? ` ×${o.levier}` : ""}`
      : `Ordre en attente : ${o.t.nom} à ${mc(Math.round(x))}`, "gain");
    await ctx.rafraichir();
  },
};

// MARK: - L'option (FeuilleOption, RNT-109)

let option = null;
const MISES = [5_000, 10_000, 25_000, 50_000];

async function ouvrirOption(ctx, t) {
  const r = await balanceGardee(ctx, "options");
  if (!r) return ctx.toast("Les options ne sont pas proposées sur ce titre.", "refus");
  option = { t, r, call: true, ecart: 0, exercice: null, echeance: r.echeances.some((e) => e.id === "semaine") ? "semaine" : r.echeances[0]?.id, mise: 10_000, erreur: null, enCours: false };
  ouvrirFeuille(ctx, { titre: "Une option", rendu: renduOption, actions: actionsOption });
}

function renduOption() {
  const o = option, r = o.r;
  // D404 : une devise ou une boîte de la Bourse du monde : sa pastille et son unité (un lot, 1 ‰ du capital).
  const t = o.t.pastille ? { ...o.t, symbole: o.t.pastille } : o.t;
  const k = o.exercice ?? t.coursExact;
  const libelleExercice = (e) => {
    const prix = t.coursExact * (1 + e);
    const p = montant(Math.round(prix), { centimes: prix < 10_000 });
    return e === 0 ? `${p}, au cours` : `${p}, ${pct(e, 0)}`;
  };
  const autre = !MISES.includes(o.mise);
  const trop = o.mise > t.disponible;
  // RNT-233 : le contrat défile ; « Signer » reste collé en bas, hors de ce qui défile.
  return `<div class="ticket-defile">
    ${capsuleTitre(t, t.nom)}
    ${groupe("Tu paries que", `${segment([["call", "Ça monte"], ["put", "Ça baisse"]], o.call ? "call" : "put", "optionSens")}
      <p class="aide">${o.call ? "Un call : il paie si le cours finit au-dessus du prix d'exercice." : "Un put : il paie si le cours finit en dessous du prix d'exercice."}</p>`)}
    ${groupe("Prix d'exercice", `<div class="mk-x76 m-defile">${r.ecarts.map((e, i) =>
      `<button class="m-pilule haute" data-action="optionExercice" data-i="${i}" aria-pressed="${Math.abs(o.ecart - e) < 1e-9}">${esc(libelleExercice(e))}</button>`).join("")}</div>
      <p class="aide">Cours du moment : ${mc(t.cours)}${t.sorte && t.sorte !== "titre" ? ` pour ${esc(t.unite)}` : ""}.</p>`)}
    ${groupe("Échéance", segment(r.echeances.map((e) => [e.id, e.nom]), o.echeance, "optionEcheance"))}
    ${groupe("Mise", `<div class="m-pilules">${MISES.map((m) => `<button class="m-pilule haute" data-action="optionMise" data-mise="${m}" aria-pressed="${o.mise === m}">${montant(m)}</button>`).join("")}
      <button class="mk-x6 m-pilule haute" data-action="optionAutre" aria-pressed="${autre}">${autre ? montant(o.mise) : "Autre"}</button></div>
      <p class="aide">La prime : c'est tout ce que tu peux perdre.${r.revente ? " Tu peux revendre l'option avant sa date." : ""}</p>`)}
    ${papier(`<div class="m-colonne12">
      <div class="mk-x71 rangee entre">${titrePapier(o.call ? "Option d'achat" : "Option de vente", `${t.nom}, échéance ${(r.echeances.find((e) => e.id === o.echeance)?.nom ?? "").toLowerCase()}`)}${pastille(t, 34)}</div>
      ${champPapier("Prix d'exercice", mc(Math.round(k)))}
      ${champPapier("Prime", montant(o.mise))}
      ${champPapier("Perte maximum", montant(o.mise), true)}
      <div class="m-encre2 m-t12">Le devis détaillé (prime par action, point mort, gains selon le cours) est calculé par le moteur à la signature.</div></div>`)}
    ${o.erreur ? `<div class="m-erreur">${icone("ui:alerte", 16)}${esc(o.erreur)}</div>` : ""}</div>
    <div class="ticket-actions">${bouton(`Signer : acheter le ${o.call ? "call" : "put"}, ${montant(o.mise)}`, "optionSigner", { desactive: o.enCours || t.gele || trop || o.mise < (r.miseMinimumCentimes ?? 0) })}
    ${t.gele ? `<p class="aide">Compte courant gelé : aucun achat pour l'instant.</p>` : trop ? `<p class="aide">Tes moyens de paiement n'ont que ${montant(t.disponible)}.</p>` : ""}</div>`;
}

const actionsOption = {
  optionSens(ctx, b) { option.call = b.dataset.valeur === "call"; redessiner(ctx); },
  optionExercice(ctx, b) {
    const e = option.r.ecarts[Number(b.dataset.i)];
    option.ecart = e;
    option.exercice = option.t.coursExact * (1 + e); // fixé au choix : il ne glisse pas avec le cours
    redessiner(ctx);
  },
  optionEcheance(ctx, b) { option.echeance = b.dataset.valeur; redessiner(ctx); },
  optionMise(ctx, b) { option.mise = Number(b.dataset.mise); option.erreur = null; redessiner(ctx); },
  optionAutre(ctx) {
    const o = option;
    pave = nouveauPave({
      titre: "Combien miser ?", aide: "C'est tout ce que tu peux perdre", proposition: o.mise, maximum: o.t.disponible,
      valider: async (v) => { o.mise = v; pave = null; feuille.rendu = renduOption; feuille.titre = "Une option"; redessiner(ctx); return null; },
      annuler: () => { pave = null; feuille.rendu = renduOption; feuille.titre = "Une option"; redessiner(ctx); },
    });
    feuille.titre = "Combien miser ?";
    feuille.rendu = () => renduPave(pave);
    redessiner(ctx);
  },
  async optionSigner(ctx) {
    const o = option;
    if (!o || o.enCours) return;
    o.enCours = true;
    const refus = await deciderEnFeuille(ctx, { option: { symbole: o.t.symbole, call: o.call, exercice: o.exercice ?? o.t.coursExact, echeance: o.echeance, mise: o.mise } });
    o.enCours = false;
    if (refus) { o.erreur = refus; return redessiner(ctx); }
    ctx.fermerFeuille();
    ctx.toast(`${o.call ? "Call" : "Put"} ${o.t.nom} acheté, ${montant(o.mise)}`, "gain");
    await ctx.rafraichir();
  },
};

// MARK: - Les gérants (FeuilleGerants, RNT-99)

async function feuilleGerants(ctx, d) {
  // La limite du pavé : le compte courant, comme `modele.economie.etat.tresorerie` sur l'iPhone.
  const disponible = Math.max(0, ctx.etat.jeu?.accueil?.tresorerie ?? 0);
  const etat = { erreur: null };
  const etiquette = (titre, valeur, teinte = "var(--texte)") =>
    `<span><div class="mk-x77">${esc(titre)}</div><div class="m-num" style="font-size:14px;font-weight:600;color:${teinte}">${valeur}</div></span>`;
  const liste = () => `
    <p class="aide">Chacun suit son panier d'actions du marché commun. Plus il prend de risques, plus il prend sur tes bénéfices. Sa part se négocie : mieux vaut lui confier une belle somme.</p>
    ${etat.erreur ? `<div class="m-erreur">${icone("ui:alerte", 16)}${esc(etat.erreur)}</div>` : ""}
    ${d.t.gerants.map((g) => `<button class="mk-x78 carte pad" data-action="choisirGerant" data-id="${esc(g.id)}">
      <span class="mk-x79 rangee">
        <span class="mk-x80">${icone(ICONES_GERANTS[g.icone] ?? "ui:defaut", 19)}</span>
        <span class="mk-x7"><div class="mk-x54 m-serif">${esc(g.nom)}</div><div class="mk-x16">${esc(g.style)}</div></span>
        <span class="mk-x81 t2">${'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>'}</span>
      </span>
      <span class="aide">${esc(g.detail)}</span>
      <span class="mk-x82 rangee entre">
        ${etiquette("Sa part", entierPct(g.commission))}
        ${etiquette("Levier", g.levier === 1 ? "aucun" : `×${String(g.levier).replace(".", ",")}`)}
        ${etiquette("7 derniers jours", pct(g.semaine, 1), couleur(g.semaine))}
      </span></button>`).join("")}
    ${d.r.montantMin != null ? `<p class="aide">À partir de ${montant(d.r.montantMin)}. Tu reprends quand tu veux, au cours du moment.</p>` : ""}`;
  const revenir = () => { pave = null; feuille.titre = "Confier de l'argent"; feuille.rendu = liste; redessiner(ctx); };
  ouvrirFeuille(ctx, {
    titre: "Confier de l'argent",
    rendu: liste,
    actions: {
      choisirGerant(ctx2, b) {
        const g = d.t.gerants.find((x) => x.id === b.dataset.id);
        etat.erreur = null;
        pave = nouveauPave({
          titre: `Confier à ${g.nom}`, aide: `Sa part : ${entierPct(g.commission)} des bénéfices`, maximum: disponible,
          valider: async (v) => {
            const refus = await deciderEnFeuille(ctx2, { confier: { gerant: g.id, montant: v } });
            if (refus) { etat.erreur = refus; revenir(); return null; }
            ctx2.fermerFeuille();
            ctx2.toast(`${montant(v)} confiés à ${g.nom}`, "gain");
            await ctx2.rafraichir();
            return null;
          },
          annuler: revenir,
        });
        feuille.titre = `Confier à ${g.nom}`;
        feuille.rendu = () => renduPave(pave);
        redessiner(ctx2);
      },
    },
  });
}

// MARK: - Le graphique plein écran (GraphiqueTitre, RNT-95)

let graphe = null;
const PERIODES = [["jour", "24 h"], ["semaine", "7 j"], ["mois", "30 j"], ["saison", "Saison"]];

async function ouvrirGraphique(ctx, symbole, nom) {
  graphe = { symbole, periode: "jour", g: null };
  await chargerGraphe(ctx);
  ouvrirFeuille(ctx, { titre: nom, rendu: renduGraphe, actions: actionsGraphe, graphique: true });
}

async function chargerGraphe(ctx) {
  const g = await ctx.tableau("graphique", { id: graphe.symbole, periode: graphe.periode });
  graphe.g = g;
  if (feuilleOuverte() && feuille?.graphique) redessiner(ctx);
}

/** Des graduations rondes entre bas et haut (≈ desiredCount 4). */
function graduations(bas, haut, n = 4) {
  const brut = (haut - bas) / n;
  const p = 10 ** Math.floor(Math.log10(brut || 1));
  const pas = [1, 2, 2.5, 5, 10].map((x) => x * p).find((x) => x >= brut) ?? brut;
  const v = [];
  for (let x = Math.ceil(bas / pas) * pas; x <= haut; x += pas) v.push(x);
  return v;
}

function renduGraphe() {
  const g = graphe.g;
  if (!g?.points?.length) return `<div class="vide">Ce titre n'est pas disponible.</div>`;
  const teinte = g.variation >= 0 ? "var(--gain)" : "var(--perte)";
  const marge = Math.max(1, (g.haut - g.bas) * 0.08);
  const ymin = g.bas - marge, ymax = g.haut + marge;
  const t0 = g.points[0].date, t1 = g.points.at(-1).date;
  const X = (t) => (t1 > t0 ? ((t - t0) / (t1 - t0)) * 100 : 50);
  const Y = (c) => (1 - (c - ymin) / (ymax - ymin)) * 100;
  const pts = g.points.map((p) => `${X(p.date).toFixed(2)},${Y(p.cours).toFixed(2)}`).join(" ");
  const dernier = g.points.at(-1);
  const nomPeriode = PERIODES.find(([v]) => v === g.periode)?.[1] ?? "";
  const axeY = graduations(ymin, ymax).map((v) => `<span class="m-axe-y" style="top:calc(14px + (100% - 38px) * ${(Y(v) / 100).toFixed(4)})">${montant(Math.round(v), { centimes: v < 10_000 })}</span>`).join("");
  const fmtX = (t) => (g.periode === "jour" ? new Date(t).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }) : new Date(t).toLocaleDateString("fr-BE", { day: "numeric", month: "short" }));
  const axeX = [0.1, 0.37, 0.64, 0.91].map((f) => `<span class="m-axe-x" style="left:calc((100% - 56px) * ${f})">${esc(fmtX(t0 + f * (t1 - t0)))}</span>`).join("");
  const reperes = g.depeches.map((d) => `<i style="position:absolute;top:14px;bottom:24px;left:calc((100% - 56px) * ${(X(d.date) / 100).toFixed(4)});border-left:1px dashed color-mix(in srgb,${d.hausse ? "var(--gain)" : "var(--perte)"} 50%,transparent)"></i>
    <span class="m-repere" style="left:calc((100% - 56px) * ${(X(d.date) / 100).toFixed(4)});background:${d.hausse ? "var(--gain)" : "var(--perte)"}"><svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="${d.hausse ? "M5 1.5L8.5 6H6v2.5H4V6H1.5z" : "M5 8.5L8.5 4H6V1.5H4V4H1.5z"}" fill="currentColor"/></svg></span>`).join("");
  return `
    ${segment(PERIODES, g.periode, "periode")}
    <div>
      <div class="mk-x83 chiffres" id="m-g-cours">${mc(Math.round(dernier.cours))}</div>
      <div class="mk-x84 rangee"><span class="m-num" style="color:${teinte}">${pct(g.variation)}</span><span class="t2" id="m-g-quand">sur ${esc(nomPeriode.toLowerCase())}</span></div>
    </div>
    <div class="m-graphe" id="m-graphe" data-t0="${t0}" data-t1="${t1}">
      ${axeY}${reperes}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="m-aire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.variation >= 0 ? "#5be0a2" : "#ff8a65"}" stop-opacity=".28"/><stop offset="1" stop-color="${g.variation >= 0 ? "#5be0a2" : "#ff8a65"}" stop-opacity="0"/></linearGradient></defs>
        ${graduations(ymin, ymax).map((v) => `<line x1="0" x2="100" y1="${Y(v).toFixed(2)}" y2="${Y(v).toFixed(2)}" stroke="rgba(238,238,240,.08)" vector-effect="non-scaling-stroke"/>`).join("")}
        <polygon points="0,100 ${pts} 100,100" fill="url(#m-aire)"/>
        <polyline points="${pts}" fill="none" stroke="${teinte}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        <line id="m-g-regle" x1="0" x2="0" y1="0" y2="100" stroke="rgba(238,238,240,.4)" vector-effect="non-scaling-stroke" class="mk-x85"/>
      </svg>
      <i id="m-g-point" style="display:none;position:absolute;width:10px;height:10px;border-radius:50%;background:${teinte};transform:translate(-50%,-50%);pointer-events:none"></i>
      ${axeX}
    </div>
    ${g.depeches[0] ? `<div class="mk-x65 carte">${ligneDepeche(g.depeches[0], Date.now(), false)}</div>` : ""}
    <div class="rangee entre aide"><span>Plus bas ${mc(Math.round(g.bas))}</span><span>Plus haut ${mc(Math.round(g.haut))}</span></div>`;
}

const actionsGraphe = {
  async periode(ctx, b) { graphe.periode = b.dataset.valeur; await chargerGraphe(ctx); },
};

// Le doigt sur la courbe : le cours et l'heure du point le plus proche (chartOverlay).
if (typeof document !== "undefined") {
  const suivre = (e) => {
    const zone = e.target.closest?.("#m-graphe");
    const g = graphe?.g;
    if (!zone || !g?.points?.length || (e.type === "pointermove" && e.pointerType !== "mouse" && !e.buttons)) return;
    const svg = zone.querySelector(":scope > svg").getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - svg.left) / svg.width));
    const t0 = g.points[0].date, t1 = g.points.at(-1).date, cible = t0 + f * (t1 - t0);
    const p = g.points.reduce((a, b) => (Math.abs(b.date - cible) < Math.abs(a.date - cible) ? b : a));
    const marge = Math.max(1, (g.haut - g.bas) * 0.08), ymin = g.bas - marge, ymax = g.haut + marge;
    const x = t1 > t0 ? (p.date - t0) / (t1 - t0) : 0.5, y = 1 - (p.cours - ymin) / (ymax - ymin);
    document.getElementById("m-g-cours").textContent = mc(Math.round(p.cours));
    document.getElementById("m-g-quand").textContent = new Date(p.date).toLocaleString("fr-BE", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const regle = document.getElementById("m-g-regle");
    regle.setAttribute("x1", x * 100); regle.setAttribute("x2", x * 100); regle.style.display = "";
    const pt = document.getElementById("m-g-point");
    pt.style.display = "block";
    pt.style.left = `${x * svg.width}px`;
    pt.style.top = `${14 + y * svg.height}px`;
  };
  const lacher = (e) => {
    if (e.type === "pointerleave" ? e.target.id !== "m-graphe" : !e.target.closest?.("#m-graphe")) return;
    if (!graphe?.g?.points?.length || !document.getElementById("m-g-cours")) return;
    const g = graphe.g;
    document.getElementById("m-g-cours").textContent = mc(Math.round(g.points.at(-1).cours));
    document.getElementById("m-g-quand").textContent = `sur ${(PERIODES.find(([v]) => v === g.periode)?.[1] ?? "").toLowerCase()}`;
    document.getElementById("m-g-regle").style.display = "none";
    document.getElementById("m-g-point").style.display = "none";
  };
  document.addEventListener("pointerdown", suivre);
  document.addEventListener("pointermove", suivre);
  document.addEventListener("pointerup", lacher);
  document.addEventListener("pointerleave", lacher, true);
  document.addEventListener("pointercancel", lacher);
}

// MARK: - D341 : la part Marchés de l'onglet Actifs (SectionMarches de l'iPhone)

/** Les marchés ne sont plus un onglet : Actifs les montre comme ses autres parts (le bandeau, le compte-titres, la recherche). */
export const section = {
  async donnees(ctx) {
    styles();
    pMarches = null;
    const [t, r] = await Promise.all([ctx.tableau("marches"), reglesMarches(ctx)]);
    rafraichiA = Date.now();
    return { t, r };
  },
  rendu(d, ctx) {
    styles();
    const t = d?.t;
    if (!t) return `<p class="aide">Les marchés s'ouvrent avec ta première saison.</p>`;
    return `<div class="m-pile m-section" id="m-page-marches">
      ${bandeauCours(t)}
      <div class="m-pile" id="m-portefeuille">${portefeuille(t, ctx.maintenant())}</div>
      ${recherche(t)}
    </div>`;
  },
  // Toutes les 5 secondes, les cours glissent (la page Actifs passe son « tic » à la part montrée).
  tic: pages.marches.tic,
  actions: pages.marches.actions,
};

// MARK: - Le grand écran (docs/inventaire-web.md § 4) : la liste des titres à gauche, la fiche à droite

pages.marches = listeEtDetail("marches", { ...pages.marches, css: "marches" }, { "marches.titre": pages["marches.titre"] }, {
  // Au grand écran, le panneau n'est jamais vide : ta première position, sinon le titre qui bouge le plus.
  premier: (d) => {
    const id = d?.t?.positions?.[0]?.symbole ?? (d?.t ? visibles(d.t)[0]?.symbole : null);
    return id ? { page: "marches.titre", p: { id } } : null;
  },
  vide: () => videDetail("Choisis un titre", "Son certificat, sa courbe et tes ordres s'ouvrent ici, sans quitter la liste."),
});
