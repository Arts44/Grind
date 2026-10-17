// ══════════════════════════════════════════════════════════════════════
//  Zone « entreprises » (D186, vague 1) — portée de l'app iPhone :
//
//   • section       ← EcranActifs, partie Entreprises, et CarteHolding
//                     (EcransEntreprises.swift:54, :963)
//   • fonder        ← AssistantFonder (EcransEntreprises.swift:280)
//   • boite         ← EcranBoite (:1040) et ses cartes : CarteConcurrence,
//                     CarteDirection + FeuilleRecrutement, CarteDifficulte,
//                     CarteGroupe, PersonnalisationBoite
//   • equipe        ← EcranEquipe (:1753)
//   • reprises      ← EcranReprises (EcranReprises.swift:11)
//   • participations← EcranParticipations + FeuilleParts
//   • FeuilleVerser ← « un montant, un bouton » (RNT-173, tableau « verser »)
//
//  Tout ce qui s'affiche vient du moteur (tableaux « entreprises »,
//  « boite », « concurrence », « direction », « difficulte »,
//  « annoncesBoites », « participations », « apercuCreation ») et des
//  catalogues (balance). Les décisions partent telles que Swift les
//  encode : { "cas": { "etiquette": valeur, "_1": valeur } }.
// ══════════════════════════════════════════════════════════════════════
import { boutonEpingler } from "./objectifs.js";
import { montant, variation, esc } from "../format.js";
import { carte, ligne, bouton, petit, segment, rail, entetePousse, icones, champEuros, lireEuros, teintes, vide, attrsDonnees } from "../ui.js";

// MARK: - Formats

const montantC = (c) => montant(c, { centimes: true });
/** 0,12 → « 12 % » ; avec `signe`, « +12 % » / « −12 % ». */
function pct(x, { signe = false, decimales = 0 } = {}) {
  const v = Math.abs(x ?? 0) * 100;
  const t = `${v.toFixed(decimales).replace(".", ",")} %`;
  if (!signe) return `${(x ?? 0) < 0 ? "−" : ""}${t}`;
  return `${(x ?? 0) > 0 ? "+" : (x ?? 0) < 0 ? "−" : ""}${t}`;
}
const virgule = (x, d = 1) => Number(x ?? 0).toFixed(d).replace(".", ",");
const pluriel = (n, mot, s = "s") => `${n} ${mot}${n > 1 ? s : ""}`;
const pourEuros = (c) => (c == null ? "" : String(Math.round(c) / 100).replace(".", ","));

// MARK: - Styles locaux (fiche Graphite, prolongée pour les boîtes)

const CSS = `
.ent-pile { display: flex; flex-direction: column; gap: 14px; }
.ent-pile18 { display: flex; flex-direction: column; gap: 18px; }
.ent-titre { font-size: 30px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
.ent-sec { font-size: 13px; font-weight: 600; color: var(--texte2); margin: 0 4px 8px; }
.ent-pied { font-size: 13px; color: var(--texte2); line-height: 1.45; margin: 8px 4px 0; }
.ent-carte-pad { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.ent-entre { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ent-entre-haut { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.ent-libelle-ic { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; }
.ent-libelle-ic svg { width: 17px; height: 17px; color: var(--accent); flex: none; }
.ent-ic { width: 18px; height: 18px; flex: none; display: inline-grid; }
.ent-ic svg { width: 100%; height: 100%; }
.ent-mono { font-variant-numeric: tabular-nums; }
.ent-filet { height: 1px; background: var(--filet); }
.ent-lignes > * + * { border-top: 1px solid var(--filet); }
.ent-ligne { display: flex; align-items: center; gap: 12px; padding: 13px 16px; width: 100%; text-align: left; }
.ent-ligne .t { font-size: 15px; font-weight: 600; }
.ent-ligne .d { font-size: 13px; color: var(--texte2); margin-top: 1px; line-height: 1.4; }
.ent-ligne .v { margin-left: auto; font-size: 15px; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ent-ligne .ch { color: var(--texte3); width: 14px; height: 14px; flex: none; }
button.ent-ligne:active { background: rgba(255,255,255,.03); }
.ent-pastille { width: 32px; height: 32px; border-radius: 9px; flex: none; display: grid; place-items: center; color: #fff;
  background: linear-gradient(135deg, var(--c, var(--accent)), color-mix(in srgb, var(--c, var(--accent)) 72%, transparent)); }
.ent-pastille svg { width: 17px; height: 17px; }
.ent-pastille.g { width: 38px; height: 38px; border-radius: 11px; }
.ent-pastille.g svg { width: 20px; height: 20px; }
/* Interrupteur */
.ent-inter { flex: none; width: 51px; height: 31px; border-radius: 99px; background: var(--puce2); position: relative; transition: background .25s; }
.ent-inter::after { content: ""; position: absolute; top: 2px; left: 2px; width: 27px; height: 27px; border-radius: 50%; background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.35); transition: transform .3s var(--courbe-graphite); }
.ent-inter[aria-checked="true"] { background: var(--accent); }
.ent-inter[aria-checked="true"]::after { transform: translateX(20px); }
/* Radio, points, pilules */
.ent-radio { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--texte3); flex: none; display: grid; place-items: center; }
.ent-radio.oui { border-color: var(--accent); }
.ent-radio.oui::after { content: ""; width: 10px; height: 10px; border-radius: 50%; background: var(--accent); }
.ent-points { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ent-points span { font-size: 11px; font-weight: 500; color: var(--texte2); white-space: nowrap; }
.ent-points i { display: inline-block; width: 12px; height: 5px; border-radius: 99px; background: var(--puce2); margin-right: 3px; }
.ent-points i.oui { background: var(--accent); }
.ent-pilules { display: flex; gap: 8px; flex-wrap: wrap; }
.ent-defile { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -20px; padding: 0 20px; }
.ent-defile::-webkit-scrollbar { display: none; }
.ent-pilule { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 14px; border-radius: 99px; font-size: 14px; font-weight: 600;
  border: 1px solid var(--filet2); white-space: nowrap; flex: none; }
.ent-pilule svg { width: 15px; height: 15px; }
.ent-pilule[aria-pressed="true"] { background: var(--texte); color: var(--fond); border-color: transparent; }
.ent-pilule.image[aria-pressed="true"] { background: linear-gradient(135deg, var(--image), color-mix(in srgb, var(--image) 72%, transparent)); color: #fff; }
.ent-pilule.ferme { color: var(--texte3); }
.ent-pilule.petite { min-height: 30px; padding: 0 11px; font-size: 13px; }
/* Choix en carte (secteur, gamme, taille…) */
.ent-choix { display: block; width: 100%; text-align: left; padding: 14px; border-radius: 18px; background: rgba(255,255,255,.03); border: 1px solid var(--filet2); }
.ent-choix[aria-pressed="true"] { background: rgba(255,255,255,.08); border: 1.5px solid var(--texte); }
.ent-choix.accent[aria-pressed="true"] { border-color: var(--accent); background: var(--puce2); }
.ent-icone-metier { width: 48px; height: 48px; border-radius: 14px; flex: none; display: grid; place-items: center; color: #fff; }
.ent-icone-metier svg { width: 24px; height: 24px; }
/* Champ de recherche */
.ent-cherche { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px; border-radius: 14px; background: rgba(255,255,255,.04); border: 1px solid var(--filet2); }
.ent-cherche svg { width: 16px; height: 16px; color: var(--texte2); flex: none; }
.ent-cherche input { flex: 1; min-width: 0; background: none; border: 0; outline: none; font-size: 15px; }
.ent-cherche select { background: none; border: 0; color: var(--texte2); font-size: 13px; font-weight: 600; outline: none; max-width: 46%; }
.ent-compte { font-size: 12px; color: var(--texte2); margin: 2px 4px 0; }
/* Papier (FeuillePapier, ChampPapier, TitrePapier) */
.ent-papier { position: relative; color: #1D1C1A; background: #F1EEE7; border-radius: 10px; padding: 18px; box-shadow: 0 6px 20px rgba(0,0,0,.35);
  display: flex; flex-direction: column; gap: 10px; }
.ent-papier.empilee { margin-bottom: 4px; }
.ent-papier.empilee::before { content: ""; position: absolute; inset: 0 8px; border-radius: 10px; background: rgba(241,238,231,.55); transform: rotate(1.4deg) translateY(4px); z-index: -1; }
.ent-papier .tp { font: 600 20px/1.2 ui-serif, Georgia, "Times New Roman", serif; }
.ent-papier .stp { font-size: 12px; color: #6B675F; margin-top: 2px; }
.ent-papier .cp { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding-bottom: 7px; border-bottom: 1px solid rgba(29,28,26,.12); }
.ent-papier .cp span:first-child { font-size: 13px; color: #6B675F; }
.ent-papier .cp span:last-child { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
.ent-papier .cp.fort span:last-child { font-size: 17px; font-weight: 700; }
.ent-papier .encre2 { font-size: 12px; color: #6B675F; }
.ent-encre { display: inline-flex; align-items: center; justify-content: center; min-height: 36px; padding: 0 16px; border-radius: 99px; background: #1D1C1A; color: #F1EEE7; font-size: 13px; font-weight: 600; }
.ent-encre.clair { background: none; color: #6B675F; padding: 0 6px; }
.ent-papier canvas { width: 100%; height: 110px; border-bottom: 1px solid rgba(29,28,26,.25); touch-action: none; cursor: crosshair; }
/* Devanture */
.ent-dev { position: relative; height: 132px; filter: drop-shadow(0 8px 12px rgba(0,0,0,.45)); }
.ent-dev.grande { height: 190px; }
.ent-dev .store { position: absolute; left: 0; right: 0; top: 0; z-index: 2; border-radius: 14px 14px 0 0; overflow: hidden; display: block; }
.ent-dev .facade { position: absolute; left: 0; right: 0; bottom: 0; border-radius: 0 0 14px 14px; overflow: hidden; }
.ent-dev .rangee-vitrine { position: absolute; left: 12px; right: 12px; bottom: 0; display: flex; align-items: flex-end; gap: 10px; }
.ent-dev.grande .rangee-vitrine { left: 16px; right: 16px; gap: 14px; }
.ent-dev .vitrine { flex: 1; border-radius: 6px; border: 2px solid rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; gap: 6px; color: rgba(58,42,20,.8); }
.ent-dev .vitrine svg { width: 22px; height: 22px; stroke-width: 2.2; }
.ent-dev.grande .vitrine svg { width: 30px; height: 30px; }
.ent-dev .porte { width: 24px; border-radius: 4px; background: #0D0E11; position: relative; }
.ent-dev.grande .porte { width: 34px; }
.ent-dev .porte::after { content: ""; position: absolute; right: 4px; top: 50%; width: 4px; height: 4px; border-radius: 50%; background: #C9A15B; }
.ent-dev .enseigne { position: absolute; left: 10px; right: 10px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.ent-dev .plaque { max-width: 100%; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid rgba(201,161,91,.6);
  font: 600 13px/1.2 ui-serif, Georgia, serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ent-dev.grande .plaque { font-size: 17px; }
.ent-dev .plaque .nom { overflow: hidden; text-overflow: ellipsis; }
.ent-dev .plaque svg { width: 11px; height: 11px; flex: none; stroke-width: 2.6; }
.ent-dev .initiales { font-size: 9px; font-weight: 800; padding: 0 4px; border: 1px solid currentColor; border-radius: 3px; opacity: .85; }
.ent-dev .lumieres { display: flex; gap: 8px; }
.ent-dev .lumieres i { width: 3px; height: 3px; border-radius: 50%; background: #FFE7A3; box-shadow: 0 0 4px #FFD45C; }
.ent-dev .jardin { position: absolute; left: 12px; bottom: 2px; display: flex; gap: 5px; padding: 2px 6px; border-radius: 3px; background: #5A3B22; }
.ent-dev .jardin i { width: 7px; height: 7px; border-radius: 50% 0; }
/* Tuiles de boîtes et de rubriques */
.ent-boites { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 14px; }
.ent-tuile-boite { display: flex; flex-direction: column; gap: 6px; text-align: left; width: 100%; min-width: 0; transition: transform .15s; }
.ent-tuile-boite:active, .ent-rub:active { transform: scale(.98); }
.ent-tuile-boite .l { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ent-badge { min-width: 18px; height: 18px; border-radius: 99px; background: var(--c-danger); color: #fff; font-size: 11px; font-weight: 700; display: inline-grid; place-items: center; padding: 0 5px; }
.ent-rubs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.ent-rub { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 18px; text-align: left; min-width: 0;
  background: rgba(255,255,255,.04); border: 1px solid var(--filet); transition: transform .15s; }
.ent-rub[aria-pressed="true"] { background: color-mix(in srgb, var(--c) 14%, transparent); border: 1.5px solid color-mix(in srgb, var(--c) 80%, transparent); }
.ent-rub .n { font-size: 14px; font-weight: 600; }
.ent-rub .e { font-size: 11px; font-weight: 500; color: var(--texte2); line-height: 1.3; min-height: 2.6em; font-variant-numeric: tabular-nums; }
.ent-rub .e.alerte { color: var(--alerte); }
.ent-point { width: 8px; height: 8px; border-radius: 50%; background: var(--c-danger); }
/* Divers */
.ent-anneau { width: 58px; height: 58px; position: relative; flex: none; }
.ent-anneau svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ent-anneau b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ent-machines { display: flex; gap: 5px; }
.ent-machines i { width: 22px; height: 8px; border-radius: 3px; background: var(--puce2); }
.ent-machines i.oui { background: var(--accent); }
.ent-puce-effet { display: inline-block; font-size: 12px; font-weight: 600; color: var(--gain); background: color-mix(in srgb, var(--gain) 12%, transparent); padding: 3px 8px; border-radius: 99px; margin-top: 2px; }
.ent-conseil-ic { width: 30px; height: 30px; border-radius: 8px; flex: none; display: grid; place-items: center; color: #fff; }
.ent-conseil-ic svg { width: 16px; height: 16px; }
.ent-badges { display: flex; gap: 10px; overflow-x: auto; padding: 16px; scrollbar-width: none; }
.ent-badges::-webkit-scrollbar { display: none; }
.ent-badge-emp { flex: none; width: 100px; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 0 8px 10px; border-radius: 14px;
  background: linear-gradient(rgba(255,255,255,.08), rgba(255,255,255,.03)); border: 1px solid var(--c, var(--filet2)); text-align: center; }
.ent-badge-emp .cordon { width: 22px; height: 4px; border-radius: 99px; background: rgba(255,255,255,.15); margin-top: 8px; }
.ent-badge-emp .ini { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 17px; font-weight: 700; background: rgba(255,255,255,.08); }
.ent-badge-emp .n { font-size: 14px; font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ent-initiales { width: 38px; height: 38px; border-radius: 50%; flex: none; display: grid; place-items: center; font-size: 14px; font-weight: 700; background: rgba(255,255,255,.08); }
.ent-initiales.g { box-shadow: inset 0 0 0 2px var(--accent); }
.ent-niveau i { display: inline-block; width: 12px; height: 4px; border-radius: 99px; background: var(--puce2); margin-left: 3px; }
.ent-niveau i.oui { background: var(--accent); }
.ent-essais { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ent-essai { padding: 8px 4px; border-radius: 10px; background: rgba(255,255,255,.05); text-align: center; display: flex; flex-direction: column; gap: 3px; }
.ent-couleurs { display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 3px; }
.ent-couleurs::-webkit-scrollbar { display: none; }
.ent-couleur { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; color: rgba(255,255,255,.85); border: 1px solid rgba(255,255,255,.2); }
.ent-couleur[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--fond), 0 0 0 4px var(--texte); }
.ent-couleur svg { width: 13px; height: 13px; }
.ent-plusmoins { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--filet2); display: grid; place-items: center; flex: none; }
.ent-plusmoins svg { width: 16px; height: 16px; }
.ent-bas { position: sticky; bottom: 112px; z-index: 4; display: flex; gap: 12px; margin: 22px -20px 0; padding: 16px 20px 6px;
  background: linear-gradient(transparent, var(--fond) 34%); }
.ent-bas .bouton { flex: 1; }
.ent-verdict { display: flex; gap: 12px; align-items: flex-start; padding: 16px; }
.ent-verdict svg { width: 22px; height: 22px; flex: none; }
.ent-recherche-vide { font-size: 13px; color: var(--texte2); padding: 4px; }
.ent-range { width: 100%; accent-color: var(--accent); }
.ent-statut { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 99px; background: var(--puce); }
.ent-statut.ctrl { background: var(--accent); color: var(--sur-accent); }
.ent-mini-dev { width: 84px; flex: none; }
.ent-mini-dev .ent-dev { height: 92px; }
@media (min-width: 700px) { .ent-boites { grid-template-columns: repeat(2, 1fr); } }
`;

function styles() {
  if (typeof document !== "undefined" && !document.getElementById("ent-css")) {
    const s = document.createElement("style");
    s.id = "ent-css";
    s.textContent = CSS;
    document.head.append(s);
  }
}

// MARK: - Icônes des métiers (l'équivalent des symboles de l'iPhone)

const S = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const p = (d) => `<path d="${d}"/>`;
const G = {
  couverts: S(p("M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 3.5-3 7h3M17 3v18")),
  tasse: S(p("M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 11h1.5a2.5 2.5 0 0 1 0 5H15M8 3.5v2.5M12 3.5v2.5")),
  verre: S(p("M7 3h10l-1 7a4 4 0 0 1-8 0zM12 14v6M8 21h8")),
  chope: S(p("M6 8h9v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM15 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2M6 8a3 3 0 0 1 4.5-3 3 3 0 0 1 4.5 3")),
  tshirt: S(p("M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z")),
  haltere: S(p("M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12")),
  cle: S(p("M14.5 4.5a4 4 0 0 0-5.3 5.2L3.5 15.4a1.6 1.6 0 0 0 2.3 2.3l5.7-5.7a4 4 0 0 0 5.2-5.3l-2.5 2.5-2.2-.4-.4-2.2z")),
  code: S(p("M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16")),
  manette: S(p("M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6H9A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4zM7 11v3M5.5 12.5h3M16 12h.01M18 14h.01")),
  carton: S(p("M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9")),
  lit: S(p("M3 18V7M3 13h18v5M21 18v-3a3 3 0 0 0-3-3h-8v1") + '<circle cx="6.5" cy="10" r="1.5"/>'),
  note: S(p("M9 18V5l11-2v13") + '<circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  camion: S(p("M2 6h12v10H2zM14 9h4l3 3v4h-7") + '<circle cx="6.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>'),
  ciseaux: S('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>' + p("M8.1 7.9 20 18M8.1 16.1 20 6")),
  croix: S(p("M9 3h6v6h6v6h-6v6H9v-6H3V9h6z")),
  pilule: S(p("M10.5 20.5l-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7zM7 10l7 7")),
  volant: S('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/>' + p("M12 14v7M10 12H3M14 12h7")),
  nuage: S(p("M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18z")),
  mallette: S(p("M3 7h18v12H3zM9 7V5h6v2M3 12h18")),
  video: S(p("M3 6h12v12H3zM15 10l6-3v10l-6-3")),
  telephone: S(p("M7 2h10v20H7zM11 18h2")),
  soleil: S('<circle cx="12" cy="12" r="4"/>' + p("M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4")),
  feuille: S(p("M5 19C5 10 10 5 20 4c-1 10-6 15-15 15zM5 19l8-8")),
  bateau: S(p("M3 17h18l-2 4H5zM12 3v13M12 4l6 9h-6")),
  gateau: S(p("M4 11h16v9H4zM4 15c2 1.5 4 1.5 5.3 0s4 1.5 5.3 0S18 16.5 20 15M12 11V7M12 4.5v.5")),
  voiture: icones.voiture,
  velo: S('<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/>' + p("M6 16l4-7h5l3 7M10 9 8.5 6H7M15 9l-3 7")),
  diplome: S(p("M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6")),
  palette: S(p("M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-2 2-2h2a4 4 0 0 0 4-4c0-4-4-7.5-9-7.5zM7.5 11h.01M10 7.5h.01M15 7.5h.01")),
  etiquette: S(p("M3 12V4h8l10 10-8 8zM7.5 8h.01")),
  avion: S(p("M2 13l8-1.5 4-7.5h2l-1 7.5 6 1v2l-6 1 1 4.5h-2l-4-4.5-8-1z")),
  serveur: S(p("M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01")),
  colonnes: S(p("M3 9l9-5 9 5M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18")),
  pompe: S(p("M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10M14 8l3 2v8a2 2 0 0 0 4 0V8l-3-3")),
  immeuble: S(p("M4 21V4h10v17M14 9h6v12M7 8h4M7 12h4M7 16h4M3 21h18")),
  boutique: icones.boite,
  engrenage: icones.reglages,
  etoile: S(p("M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z")),
  coeur: icones.coeur,
  eclair: S(p("M13 2 4 14h7l-1 8 9-12h-7z")),
  flamme: S(p("M12 21c-4 0-7-3-7-7 0-3 2-5 3-7 1 2 2 3 3 3 0-3 1-5 3-7 1 3 6 6 6 11 0 4-3 7-8 7z")),
  couronne: S(p("M3 8l4 4 5-7 5 7 4-4-2 11H5z")),
  diamant: S(p("M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 16 3-16")),
  lune: S(p("M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z")),
  trophee: S(p("M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M9 17h6v4H9")),
  globe: S('<circle cx="12" cy="12" r="9"/>' + p("M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18")),
  eclats: S(p("M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM18 15l.7 2.3L21 18l-2.3.7L18 21l-.7-2.3L15 18l2.3-.7z")),
  marteau: S(p("M13 7l4 4M4 20l10-10M11 5l4-2 6 6-2 4-3-1-5-5z")),
  patte: S('<circle cx="12" cy="16" r="4"/><circle cx="5.5" cy="10.5" r="1.8"/><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="18.5" cy="10.5" r="1.8"/>'),
  oiseau: S(p("M3 14c4 0 6-2 8-6 2 3 5 4 10 3-2 4-6 7-11 7-3 0-5-1-7-4z")),
  loupe: S('<circle cx="11" cy="11" r="7"/>' + p("M20 20l-4-4")),
  cadenas: icones.verrou,
  ampoule: S(p("M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z")),
  pinceau: S(p("M14 4l6 6-8 8-6-6zM6 12l-3 6 3 3 6-3")),
  equipe: icones.amis,
  argent: icones.euro,
  controles: icones.bouclier,
  grandir: S(p("M7 17L17 7M9 7h8v8")),
  baisse: S(p("M3 7l6 6 4-4 8 8M15 17h6v-6")),
  alerte: S(p("M12 4 2.5 20h19zM12 10v4M12 17h.01")),
  sceau: S(p("M12 2.5l2.2 1.6 2.7-.2.9 2.6 2.3 1.4-.6 2.6 1 2.5-2 1.8-.4 2.7-2.7.4-1.8 2L12 20l-2.6.9-1.8-2-2.7-.4-.4-2.7-2-1.8 1-2.5-.6-2.6L5.2 7.5l.9-2.6 2.7.2zM8.5 12l2.5 2.5 4.5-5")),
  telecharger: S(p("M12 4v11M7 10l5 5 5-5M4 20h16")),
  televerser: S(p("M12 20V9M7 14l5-5 5 5M4 4h16")),
  oeil: S(p("M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM4 4l16 16") + '<circle cx="12" cy="12" r="3"/>'),
  stylo: S(p("M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3")),
  sourire: S('<circle cx="12" cy="12" r="9"/>' + p("M8.5 14c1.8 2 5.2 2 7 0M9 9.5h.01M15 9.5h.01")),
  curseurs: S(p("M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0") + '<circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  megaphone: S(p("M3 10v4h4l8 5V5L7 10zM18 9a4 4 0 0 1 0 6")),
  personnePlus: S('<circle cx="10" cy="8" r="4"/>' + p("M3 21c1.2-4 4-6 7-6s4 .8 5 2M19 14v6M16 17h6")),
  octogone: S(p("M8 3h8l5 5v8l-5 5H8l-5-5V8zM9 9l6 6M15 9l-6 6")),
  minus: S(p("M5 12h14")),
  plus: icones.plus,
  fanion: S(p("M5 21V4h12l-3 4 3 4H5")),
};

const ICONE_SECTEUR = {
  snack: "couverts", restaurant: "couverts", bar: "verre", brasserie: "chope", boutique: "tshirt", sport: "haltere", garage: "cle",
  agence: "code", studio: "manette", atelier: "engrenage", logistique: "carton", cafe: "tasse", hotel: "lit", nuit: "note",
  foodtruck: "camion", coiffure: "ciseaux", dentiste: "croix", pharmacie: "pilule", creche: "coeur", autoecole: "volant", saas: "nuage",
  conseil: "mallette", video: "video", appli: "telephone", solaire: "soleil", vignoble: "feuille", ferme: "feuille", chantier: "bateau",
  transport: "camion", patisserie: "gateau", cafeambulant: "tasse", lavage: "voiture", jardinage: "feuille", livraison: "velo",
  coach: "haltere", cours: "diplome", reparation: "telephone", montage: "video", logos: "palette", revente: "etiquette",
  aerienne: "avion", usine: "voiture", datacenter: "serveur", chainehotels: "immeuble", banqueprivee: "colonnes", studiojeux: "manette",
  spatial: "avion", petrolier: "pompe",
};
const icoMetier = (secteur) => G[ICONE_SECTEUR[secteur] ?? "immeuble"];
const ICONE_FAMILLE = { micro: "eclats", horeca: "couverts", commerce: "boutique", services: "croix", tech: "code", industrie: "carton", groupes: "immeuble" };
/** Les emblèmes d'enseigne du catalogue (symboles de l'iPhone) → nos pictogrammes. */
const ICONE_EMBLEME = {
  "cup.and.saucer.fill": "tasse", scissors: "ciseaux", "hammer.fill": "marteau", "sun.max.fill": "soleil", "star.fill": "etoile",
  "leaf.fill": "feuille", "bolt.fill": "eclair", "heart.fill": "coeur", "pawprint.fill": "patte", "crown.fill": "couronne", "flame.fill": "flamme",
  "bird.fill": "oiseau", "globe.europe.africa.fill": "globe", "diamond.fill": "diamant", "moon.stars.fill": "lune", "trophy.fill": "trophee", sparkles: "eclats",
};

function couleurFamille(f) {
  return { horeca: "#D8504A", commerce: "#3E7BD9", services: "#2FA5A0", tech: "#8A5CF0", industrie: "#E0A33A" }[f] ?? "#7C838B";
}
const PALETTE = ["#D8504A", "#E0A33A", "#2F8F5B", "#3E7BD9", "#8A5CF0", "#1F2A44", "#C2416E", "#2A2B2E"];
const RARETE = { 1: "#9AA6BC", 2: "#B79CFF", 3: "#E3C46B" };

// MARK: - Briques locales

/** La réputation sur cinq étoiles, avec demi-étoiles (Etoiles). */
function etoiles(note, taille = 12) {
  const d = "M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z";
  let h = "";
  for (let i = 0; i < 5; i++) {
    const r = (note ?? 0) - i;
    const plein = r >= 0.75, demi = !plein && r >= 0.25;
    h += `<svg width="${taille}" height="${taille}" viewBox="0 0 24 24" aria-hidden="true">
      <path d="${d}" fill="none" stroke="#F2C94C" stroke-width="2"/>
      ${plein ? `<path d="${d}" fill="#F2C94C"/>` : demi ? `<path d="${d}" fill="#F2C94C" clip-path="inset(0 50% 0 0)" style="clip-path:inset(0 50% 0 0)"/>` : ""}</svg>`;
  }
  return `<span style="display:inline-flex;gap:2px;flex:none" role="img" aria-label="${virgule(note)} étoiles sur 5">${h}</span>`;
}

const FACADES = { brique: ["#8A3B2E", "#4A1E17"], bois: ["#7A5235", "#3B2716"], beton: ["#6E7176", "#3A3C40"], verre: ["#35617A", "#13232E"],
  marbre: ["#DCD8D0", "#9E998F"], pierre: ["#9C9283", "#5E574D"], creme: ["#E8DDC8", "#B5A88E"], laque: ["#1A1A1D", "#050506"], cuivre: ["#C27A45", "#6E3A1C"] };
const VITRINES = { cosy: ["#FFC98A", "#C97B3A"], industriel: ["#C2CBD3", "#6E7A86"], nature: ["#C6E6AE", "#6FA65A"], retro: ["#FFB8C6", "#D9607A"],
  luxe: ["#F6E6BA", "#C9A15B"], minimal: ["#F4F4F2", "#C9CACC"], boheme: ["#F3C9A8", "#B86F52"], tropical: ["#9FE3C9", "#2E9C86"], futuriste: ["#A9C8FF", "#6A4DE0"] };
const STYLE_DEFAUT = { forme: "plaque", embleme: null, fondEnseigne: null, texteEnseigne: null, typo: "classique", facade: "anthracite", motif: "rayures",
  lumieres: false, ambiance: "simple", uniforme: null, plantes: null, fanions: null };

/** Le store festonné, à son motif (Store). */
function store(couleur, motif, hauteur) {
  const n = motif === "larges" ? 5 : motif === "vagues" ? 7 : motif === "fines" ? 15 : 9;
  const w = n * 10, creme = "#F4F1EA", r = 5;
  const id = `st${Math.random().toString(36).slice(2, 7)}`;
  const bande = (i) => (motif === "uni" || motif === "degrade" || i % 2 === 0 ? couleur : creme);
  let corps = "";
  if (motif === "degrade") corps = `<rect x="0" y="0" width="${w}" height="${hauteur - r}" fill="url(#${id}d)"/>`;
  else for (let i = 0; i < n; i++) corps += `<rect x="${i * 10}" y="0" width="10.4" height="${hauteur - r}" fill="${bande(i)}"/>`;
  let festons = "";
  for (let i = 0; i < n; i++) festons += `<ellipse cx="${i * 10 + 5}" cy="${hauteur - r - 0.5}" rx="5" ry="${motif === "vagues" ? 4 : r}" fill="${motif === "degrade" ? couleur : bande(i)}"/>`;
  return `<svg class="store" viewBox="0 0 ${w} ${hauteur}" preserveAspectRatio="none" style="height:${hauteur}px;width:100%" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <linearGradient id="${id}d" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${couleur}"/><stop offset="1" stop-color="${couleur}" stop-opacity=".55"/></linearGradient></defs>
    ${corps}${festons}<rect x="0" y="0" width="${w}" height="${hauteur - r}" fill="url(#${id})"/></svg>`;
}

const FORMES = { capsule: "border-radius:99px", rond: "border-radius:14px", ecusson: "border-radius:3px 3px 14px 14px", arche: "border-radius:16px 16px 3px 3px",
  losange: "clip-path:polygon(0 50%,12px 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,12px 100%);padding-left:16px;padding-right:16px;border:0",
  carre: "border-radius:0", ovale: "border-radius:50%;padding-left:16px;padding-right:16px", plaque: "border-radius:4px" };
const TYPOS = { moderne: "font-family:var(--police)", rond: "font-family:ui-rounded,'SF Pro Rounded',var(--police)", machine: "font-family:ui-monospace,Menlo,monospace",
  italique: "font-style:italic", large: "letter-spacing:.09em", etroit: "letter-spacing:-.03em;font-stretch:condensed", classique: "" };

/** Une boîte est une vitrine : le store, l'enseigne à son nom, l'objet de son métier en vitrine (Devanture). */
function devanture({ nom, secteur = "", famille = "", couleur = null, style = null, grande = false, id = "" }) {
  const c = couleur ?? couleurFamille(famille);
  const s = { ...STYLE_DEFAUT, ...(style ?? {}) };
  const h = grande ? 190 : 132, hs = grande ? 46 : 32;
  const fond = s.fondEnseigne ?? "#0D0E11", encre = s.texteEnseigne ?? "#F4E9D3";
  const [f1, f2] = FACADES[s.facade] ?? ["#2C2F37", "#15171B"];
  const [v1, v2] = VITRINES[s.ambiance] ?? ["#FFE2A6", "#E7A84F"];
  const hautVitrine = grande ? 44 : 34;
  const embleme = !s.embleme || s.embleme === "metier" ? ""
    : s.embleme === "initiales" ? `<span class="initiales">${esc(nom.split(" ").slice(0, 3).map((m) => m[0] ?? "").join("").toUpperCase())}</span>`
      : (G[ICONE_EMBLEME[s.embleme]] ?? G.etoile);
  const fanions = s.fanions ? `<div style="position:absolute;left:0;right:0;top:3px;z-index:3;display:flex;justify-content:space-around">${
    Array.from({ length: 9 }, (_, i) => `<i style="width:0;height:0;border-left:${grande ? 5 : 4}px solid transparent;border-right:${grande ? 5 : 4}px solid transparent;border-top:${grande ? 8 : 6}px solid ${["#E5534B", "#F0C24A", "#3FBF85", "#5B8DEF"][i % 4]}"></i>`).join("")}</div>` : "";
  const uniforme = s.uniforme ? `<span style="color:${s.uniforme};display:inline-grid">${icones.personne}</span>` : "";
  return `<div class="ent-dev ${grande ? "grande" : ""}" ${id ? `id="${id}"` : ""} style="height:${h}px" aria-hidden="true">
    ${store(c, s.motif, hs)}${fanions}
    <div class="facade" style="top:${hs - 4}px;background:linear-gradient(${f1},${f2})">
      ${s.facade === "verre" ? `<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.16),transparent,rgba(255,255,255,.08))"></div>` : ""}
      <div class="rangee-vitrine" style="top:${hautVitrine}px">
        <div class="vitrine" style="height:100%;background:linear-gradient(${v1}d9,${v2}d9)">${icoMetier(secteur)}${uniforme}</div>
        <div class="porte" style="height:100%"></div>
      </div>
      ${s.plantes ? `<div class="jardin">${Array.from({ length: grande ? 6 : 4 }, (_, i) => `<i style="background:${i % 2 ? "#E76FA3" : "#4FA36B"}"></i>`).join("")}</div>` : ""}
      <div class="enseigne" style="top:${grande ? 10 : 7}px">
        <span class="plaque" style="background:${fond};color:${encre};${FORMES[s.forme] ?? FORMES.plaque};${TYPOS[s.typo] ?? ""};${s.lumieres ? `box-shadow:0 0 10px ${encre}8c` : ""}">${embleme}<span class="nom">${esc(nom)}</span></span>
        ${s.lumieres ? `<span class="lumieres">${"<i></i>".repeat(7)}</span>` : ""}
      </div>
    </div>
  </div>`;
}

const act = (nom, donnees = {}) => `data-action="${esc(nom)}" ${attrsDonnees(donnees)}`;

/** Une section à titre au-dessus d'une carte, avec un pied (SectionReglages). */
const sectionReglages = (titre, contenu, pied = "") => `<div>
  ${titre ? `<div class="ent-sec">${esc(titre)}</div>` : ""}
  <div class="carte ent-lignes">${contenu}</div>
  ${pied ? `<div class="ent-pied">${pied}</div>` : ""}</div>`;

/** Une ligne de réglage : pastille teintée, titre, détail, valeur, chevron si elle agit (LigneReglage). */
function ligneReglage({ icone, teinte = "var(--accent)", titre, detail = "", valeur = "", action = "", donnees = {}, page = "", p = null, desactive = false, couleurTitre = "" }) {
  const corps = `<span class="ent-pastille" style="--c:${teinte}">${G[icone] ?? icones[icone] ?? icone}</span>
    <span style="flex:1;min-width:0"><div class="t" ${couleurTitre ? `style="color:${couleurTitre}"` : ""}>${titre}</div>${detail ? `<div class="d">${detail}</div>` : ""}</span>
    ${valeur !== "" ? `<span class="v">${valeur}</span>` : ""}${action || page ? `<span class="ch">${icones.chevron}</span>` : ""}`;
  if (page) return `<button class="ent-ligne" data-action="ouvrir" data-page="${esc(page)}" ${p ? `data-p='${esc(JSON.stringify(p))}'` : ""}>${corps}</button>`;
  if (action) return `<button class="ent-ligne" ${act(action, donnees)} ${desactive ? "disabled" : ""}>${corps}</button>`;
  return `<div class="ent-ligne">${corps}</div>`;
}

const interrupteur = (oui, action, donnees = {}, etiquette = "") =>
  `<button class="ent-inter" role="switch" aria-checked="${!!oui}" aria-label="${esc(etiquette)}" ${act(action, donnees)}></button>`;

/** Une ligne avec un interrupteur à droite (Toggle + Interrupteur). */
const ligneInterrupteur = ({ icone = "", teinte = "var(--accent)", titre, detail = "", oui, action, donnees = {} }) => `<div class="ent-ligne">
  ${icone ? `<span class="ent-pastille" style="--c:${teinte}">${G[icone] ?? icones[icone] ?? icone}</span>` : ""}
  <span style="flex:1;min-width:0"><div class="t">${titre}</div>${detail ? `<div class="d">${detail}</div>` : ""}</span>
  ${interrupteur(oui, action, donnees, titre)}</div>`;

const papier = (contenu, { empilee = true, attrs = "" } = {}) => `<div class="ent-papier ${empilee ? "empilee" : ""}" ${attrs}>${contenu}</div>`;
const titrePapier = (t, s) => `<div><div class="tp">${esc(t)}</div><div class="stp">${s}</div></div>`;
const champPapier = (l, v, fort = false) => `<div class="cp ${fort ? "fort" : ""}"><span>${esc(l)}</span><span>${v}</span></div>`;

const points = (titre, niveau) => `<div class="ent-points" aria-label="${esc(titre)} : ${niveau} sur 3"><span>${esc(titre)}</span>
  <div>${[1, 2, 3].map((i) => `<i class="${i <= niveau ? "oui" : ""}"></i>`).join("")}</div></div>`;

/** Le rang (1 à 3) d'une valeur parmi d'autres (rangCritere). */
function rang(valeur, valeurs) {
  const t = [...new Set(valeurs)].sort((a, b) => a - b);
  const i = t.indexOf(valeur);
  if (t.length <= 1 || i < 0) return 2;
  return 1 + Math.round((i / (t.length - 1)) * 2);
}

const radio = (oui) => `<span class="ent-radio ${oui ? "oui" : ""}" aria-hidden="true"></span>`;
const pilule = (texte, action, oui, donnees = {}, classe = "") =>
  `<button class="ent-pilule ${classe}" aria-pressed="${!!oui}" ${act(action, donnees)}>${texte}</button>`;

/** Le choix d'une gamme : chacune dit ce qu'elle est et montre son caractère (ChoixGamme). */
function choixGamme(gammes, choisie, action, donnees = {}) {
  const r = (g, f) => rang(f(g), gammes.map(f));
  return `<div class="ent-pile" style="gap:10px">${gammes.map((g) => `
    <button class="ent-choix accent" aria-pressed="${g.id === choisie}" ${act(action, { ...donnees, gamme: g.id })}>
      <div class="ent-entre">${radio(g.id === choisie)}<span style="flex:1;font-size:16px;font-weight:600">${esc(g.nom)}</span>
        <span class="legende ent-mono">prix ×${virgule(g.prix, 2)}</span></div>
      ${g.description ? `<div class="aide" style="margin-top:8px">${esc(g.description)}</div>` : ""}
      <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
        ${points("Clients", r(g, (x) => x.clients ?? 1))}${points("Marge", r(g, (x) => x.prix - x.cout * 0.4))}
        ${points("Cadence", r(g, (x) => x.capacite ?? 1))}${points("Régularité", r(g, (x) => -(x.alea ?? 1)))}${points("Moral", r(g, (x) => x.moral ?? 0))}
      </div></button>`).join("")}</div>`;
}

/** Le choix de la couleur du store : celle de la famille, ou une de la palette (ChoixCouleurStore). */
function choixCouleur(famille, couleur, action, donnees = {}) {
  const pastille = (c) => `<button class="ent-couleur" style="background:${c ?? couleurFamille(famille)}" aria-pressed="${(c ?? null) === (couleur ?? null)}"
    aria-label="${c ? `Couleur ${c}` : "Couleur de la famille"}" ${act(action, { ...donnees, couleur: c ?? "" })}>${c ? "" : G.eclats}</button>`;
  return `<div class="ent-couleurs">${pastille(null)}${PALETTE.map(pastille).join("")}</div>`;
}

/** Un montant au clavier, comme le PaveNumerique de l'iPhone. */
function saisir(ctx, { titre, aide = "", proposition = null, maximum = null, zero = false, bouton: texte = "Valider", valider }) {
  ctx.feuille({
    titre,
    contenu: `${aide ? `<p class="aide">${esc(aide)}</p>` : ""}${champEuros("ent-saisie", { valeur: pourEuros(proposition) })}
      ${maximum != null ? `<p class="aide">Au plus ${montant(maximum)}.</p>` : ""}${bouton(texte, "entValiderSaisie")}`,
    actions: {
      async entValiderSaisie(ctx) {
        const v = lireEuros("ent-saisie") ?? (zero ? 0 : null);
        if (v == null || v < 0 || (!zero && v <= 0)) return ctx.toast("Montant illisible", "refus");
        if (maximum != null && v > maximum) return ctx.toast(`Au plus ${montant(maximum)}`, "refus");
        await valider(v);
      },
    },
  });
}

/** Une question à deux réponses ou plus, comme les confirmationDialog de l'iPhone. */
function confirmer(ctx, { titre, message = "", choix }) {
  const actions = {};
  const boutons = choix.map((c, i) => {
    actions[`entChoix${i}`] = async (ctx) => { await c.faire(ctx); };
    return bouton(c.texte, `entChoix${i}`, { genre: c.genre ?? "primaire", teinte: c.teinte ?? "" });
  }).join("");
  ctx.feuille({
    titre,
    contenu: `${message ? `<p class="aide">${message}</p>` : ""}${boutons}${bouton("Annuler", "fermerFeuille", { genre: "discret" })}`,
    actions,
  });
}

const entreprendre = (ctx, op, succes = "", options = {}) => ctx.decider("entreprises", op, { succes, ...options });

/** Les catalogues ne changent pas pendant la partie : lus une fois. */
let catalogues = null;
async function lireCatalogues(ctx) {
  if (catalogues) return catalogues;
  const [e, m, b, pa] = await Promise.all([ctx.balance("entreprises"), ctx.balance("monde"), ctx.balance("banque"), ctx.balance("participations")]);
  catalogues = { e, pays: m?.pays ?? [], banque: b, participations: pa };
  return catalogues;
}
const secteur = (B, id) => B.secteurs.find((s) => s.id === id);
const ville = (B, id) => B.villes.find((v) => v.id === id);
const gamme = (B, id) => B.gammes.find((g) => g.id === id);
const taille = (B, id) => B.tailles.find((t) => t.id === id);
const estMicro = (s) => s?.soloProduction != null;
const niveauPrix = (B, v) => ville(B, v)?.niveauPrix ?? 1;
const prixMarche = (B, s, g, v) => Math.round(s.prixCentimes * g.prix * niveauPrix(B, v));
const loyerHebdo = (B, t, v) => Math.round(t.prixLocalCentimes * v.loyer * B.loyerHebdoParPrix);
const prixLocal = (t, v) => Math.round(t.prixLocalCentimes * v.loyer);
const places = (s, t) => (estMicro(s) || !t?.places ? null : Math.max(1, Math.ceil(Object.values(s.equipe).reduce((a, b) => a + b, 0) * t.places)));
const machinesPossibles = (B, id) => Math.min(B.machinesMax, taille(B, id)?.machines ?? B.machinesMax);
const palierVille = (v) => (v.palier ? Math.min(4, Math.max(1, v.palier)) : (v.seuilCentimes ?? 0) <= 50_000_000 ? 1 : (v.seuilCentimes ?? 0) <= 100_000_000 ? 2 : (v.seuilCentimes ?? 0) <= 200_000_000 ? 3 : 4);
const NOMS_PALIERS = ["Abordable", "Régionale", "Métropole", "Ville-monde"];

/** Le total d'un CoutCreation (propriété calculée côté Swift, absente du JSON). */
const totalCout = (c) => (c ? c.installation + c.local + c.licence + c.roulement : 0);

/** Le coût d'une création (ReglesEntreprises.coutCreation), pour savoir ce qui reste à financer. */
function coutCreation(B, plan, residence) {
  const s = secteur(B, plan.secteur), v = ville(B, plan.ville), t = taille(B, plan.taille);
  if (!s || !v || !t) return null;
  const micro = estMicro(s);
  const installation = micro ? s.installationCentimes : Math.round(s.installationCentimes * t.installation);
  const local = micro ? 0 : plan.achat ? prixLocal(t, v) : loyerHebdo(B, t, v) * B.cautionSemaines;
  const masse = s.postes.reduce((m, poste) => m + Math.round((plan.equipe[poste.id] ?? 0) * poste.salaireCentimes * (plan.niveaux[poste.id] ?? 1) * (v.salaires ?? 1)), 0);
  const licence = v.codePays === residence ? 0 : (v.licenceCentimes ?? 0);
  const roulement = masse * B.roulementSemaines;
  return { installation, local, licence, roulement, masse, total: installation + local + licence + roulement };
}

/** Quatre noms de la liste du métier, différents d'une création à l'autre. */
function nomsProposes(s, tirage) {
  if (!s.noms?.length) return [s.nom];
  const h = (k) => { let x = 2166136261 ^ tirage; for (const ch of `${s.id}:${k}`) x = Math.imul(x ^ ch.charCodeAt(0), 16777619); return (x >>> 0) / 4294967296; };
  return s.noms.map((n, i) => [n, h(i)]).sort((a, b) => a[1] - b[1]).slice(0, 4).map((x) => x[0]);
}

function propose(B, s, villeId, tirage) {
  const g = gamme(B, "std") ?? B.gammes[0];
  return { secteur: s.id, nom: nomsProposes(s, tirage)[0] ?? s.nom, ville: villeId, taille: "petit", achat: false, gamme: g.id,
    prix: prixMarche(B, s, g, villeId), equipe: { ...s.equipe }, niveaux: {}, financement: { comptant: {} } };
}

// MARK: - La section Entreprises de l'onglet Actifs (EcranActifs, CarteHolding)

export const section = {
  async donnees(ctx) {
    styles();
    const t = await ctx.tableau("entreprises");
    return { t };
  },
  rendu(d) {
    styles();
    const t = d?.t;
    if (!t) return `<p class="aide">Les actifs s'ouvrent avec ta première saison.</p>`;
    const rattachees = t.boites.filter((b) => b.dansHolding);
    const enCaisse = rattachees.reduce((s, b) => s + b.tresorerie, 0);
    return `<div class="ent-pile18">
      ${t.reputationMoyenne != null ? `<div class="ent-entre"><span style="display:flex;gap:8px;align-items:baseline;font-size:14px;font-weight:500">
        <span class="chiffres ${t.beneficeTotal > 0 ? "gain" : t.beneficeTotal < 0 ? "perte" : "t2"}" style="font-size:16px">${variation(t.beneficeTotal)}</span>
        <span class="t2">la semaine passée</span></span>${etoiles(t.reputationMoyenne)}</div>` : ""}
      ${t.boites.length ? carteHolding(t, rattachees, enCaisse) : ""}
      ${t.boites.length === 0 ? `<div class="ent-pile"><div style="opacity:.55">${devanture({ nom: "Ta première boîte" })}</div>
        <p class="aide">Une boîte vend un peu toute seule, et beaucoup plus quand tu fais du focus. Fonde la première en huit étapes.</p></div>`
        : `<div class="ent-boites">${t.boites.map(tuileBoite).join("")}</div>`}
      <div class="ent-pile" style="gap:12px">
        ${bouton(`${icones.plus.replace("<svg", '<svg width="18" height="18"')} Fonder une boîte`, "entNouvelleBoite")}
        ${bouton(`${G.cle.replace("<svg", '<svg width="17" height="17"')} Reprendre une boîte en activité`, "", { genre: "secondaire", page: "reprises" })}
      </div>
      <button class="carte" data-action="ouvrir" data-page="participations" style="display:flex;align-items:center;gap:12px;padding:16px;width:100%;text-align:left">
        <span style="width:40px;height:40px;border-radius:50%;background:var(--puce);display:grid;place-items:center;flex:none"><span class="ent-ic">${icones.camembert}</span></span>
        <span style="flex:1;min-width:0"><div class="libelle">Parts d'entreprises</div><div class="aide">Deviens associé de PME, siège au conseil, prends le contrôle.</div></span>
        <span class="t2" style="width:14px;flex:none">${icones.chevron}</span>
      </button>
    </div>`;
  },
  actions: {
    entNouvelleBoite(ctx) { assistant = null; return ctx.ouvrir("fonder"); },
    entVerserHolding(ctx) { return feuilleVerser(ctx, { boite: null, titre: "Ta holding" }); },
  },
};

/** D95, D96, RNT-137 : ta holding, la société de tes sociétés (CarteHolding). */
function carteHolding(t, rattachees, enCaisse) {
  const n = rattachees.length;
  return carte(`<div class="ent-carte-pad" style="gap:14px">
    <div class="ent-entre">
      <span class="ent-pastille g" style="--c:var(--argent)">${G.immeuble}</span>
      <span style="flex:1;min-width:0"><div style="font-size:16px;font-weight:600">Ta holding</div>
        <div class="aide">${pluriel(n, "boîte")} rattachée${n > 1 ? "s" : ""} sur ${t.boites.length}</div></span>
      <span style="text-align:right"><div class="chiffres ${enCaisse < 0 ? "perte" : ""}" style="font-size:18px;font-weight:700">${montant(enCaisse)}</div>
        <div class="legende">en caisse</div></span>
    </div>
    ${bouton(`${G.telecharger.replace("<svg", '<svg width="17" height="17"')} ${enCaisse > 0 ? "Te verser" : "Rien à verser pour l'instant"}`, "entVerserHolding",
      { genre: "teinte", teinte: "var(--argent)", desactive: enCaisse <= 0 })}
    <p class="aide">Chaque boîte garde une semaine de charges. Détache une boîte depuis sa fiche, section Argent.</p>
  </div>`);
}

function tuileBoite(b) {
  const alerte = b.etat ? "alerte" : "";
  return `<button class="ent-tuile-boite" data-action="ouvrir" data-page="boite" data-p='${esc(JSON.stringify({ id: b.id }))}'
      aria-label="${esc(`${b.nom}, ${b.secteur} à ${b.ville}, ${variation(b.beneficeSemaine)} la semaine passée, ${montant(b.tresorerie)} en caisse`)}">
    ${devanture({ nom: b.nom, secteur: b.secteurID, famille: b.famille, couleur: b.couleur, style: b.style })}
    <div class="ent-entre"><span class="chiffres ${b.beneficeSemaine >= 0 ? "gain" : "perte"}" style="font-size:14px;letter-spacing:-.02em">${variation(b.beneficeSemaine)}</span>${etoiles(b.reputation, 9)}</div>
    <div class="ent-entre ${b.tresorerie < 0 ? "perte" : "t2"}" style="gap:6px">
      <span style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600" class="ent-mono"><span class="ent-ic" style="width:13px;height:13px">${icones.banque}</span>${montant(b.tresorerie)}</span>
      <span style="display:flex;gap:6px;align-items:center">${b.dansHolding ? `<span class="ent-ic" style="width:14px;height:14px;color:var(--argent)" title="Rattachée à la holding">${G.immeuble}</span>` : ""}
        ${b.alertes > 0 ? `<span class="ent-badge">${b.alertes}</span>` : ""}</span>
    </div>
    <div class="l ${alerte}" style="${b.etat ? "font-weight:600" : "color:var(--texte2)"}">${esc(b.etat || b.lien || `${b.secteur}, ${b.ville}`)}</div>
  </button>`;
}

// MARK: - L'assistant de création (AssistantFonder)

const TITRES = ["Secteur", "Nom", "Ville", "Local", "Gamme et prix", "Équipe", "Financement", "Statuts"];
/** L'état de l'assistant, comme les @State de l'iPhone. Remis à zéro à chaque ouverture. */
let assistant = null;
let dernierFonder = null;

function nouvelAssistant() {
  return { etape: 0, famille: "micro", plan: null, aCredit: false, semaines: 10, parts: {}, partsProposees: false, signe: false,
    rs: "", triS: "installation", filtresS: [], rv: "", triV: "pays", filtresV: [] };
}

function planComplet(F, B, residence) {
  const c = structuredClone(F.plan);
  c.parts = Object.keys(F.parts).sort().map((k) => ({ source: k, montant: F.parts[k] }));
  const total = coutCreation(B, F.plan, residence)?.total ?? 0;
  const paye = Object.values(F.parts).reduce((a, b) => a + b, 0);
  c.financement = F.aCredit && paye < total ? { credit: { apport: paye, semaines: F.semaines } } : { comptant: {} };
  return c;
}

/** D103 : tout ce qui peut payer la création, dans l'ordre où on y pense. */
function sourcesPaiement(d) {
  const { banque, illegal, t, accueil } = d;
  const principal = banque?.cartes?.find((c) => c.principal);
  const l = [{ id: "principal", nom: "Compte courant", detail: principal?.banqueNom ?? "", disponible: Math.max(0, accueil?.tresorerie ?? 0), icone: "banque" }];
  for (const c of banque?.cartes ?? []) {
    if (c.principal || !c.ref?.compte || c.solde <= 0) continue;
    l.push({ id: `c:${c.ref.compte._0}`, nom: c.nom, detail: c.banqueNom ?? "", disponible: c.solde, icone: c.nature === "epargne" ? "euro" : "banque" });
  }
  if ((banque?.liquide ?? 0) > 0) l.push({ id: "liquide", nom: "Liquide", detail: "Sur toi", disponible: banque.liquide, icone: "euro" });
  if ((illegal?.argentSale ?? 0) > 0) l.push({ id: "sale", nom: "Argent sale", detail: "Payé au noir : le soupçon monte", disponible: illegal.argentSale, icone: "oeil", risque: true });
  // RNT-137 : la holding, un seul bouton (sa caisse n'est pas exposée : on compte les trésoreries rattachées).
  const rattachees = (t?.boites ?? []).filter((b) => b.dansHolding && b.tresorerie > 0);
  const dispoHolding = rattachees.reduce((s, b) => s + b.tresorerie, 0);
  if (dispoHolding > 0) {
    const n = rattachees.length;
    l.push({ id: "holding", nom: "Holding", detail: `${pluriel(n, "boîte")} rattachée${n > 1 ? "s" : ""}, chacune selon sa trésorerie`, disponible: dispoHolding, icone: "immeuble" });
  }
  for (const b of t?.boites ?? []) {
    if (b.tresorerie > 0 && !b.dansHolding) l.push({ id: `b:${b.id}`, nom: b.nom, detail: "Hors holding, trésorerie sans précompte", disponible: b.tresorerie, icone: "boutique" });
  }
  return l;
}

const PAGE_FONDER = {
  titre: "Fonder une boîte",
  async donnees(ctx) {
    styles();
    const cat = await lireCatalogues(ctx);
    const B = cat.e;
    const [t, banque, illegal, monde] = await Promise.all([ctx.tableau("entreprises"), ctx.tableau("banque"), ctx.tableau("illegal"), ctx.tableau("monde")]);
    const accueil = ctx.etat.jeu?.accueil ?? {};
    const residenceVille = B.villes.find((v) => v.nom === monde?.residence) ?? ville(B, "bruxelles");
    const residence = residenceVille?.codePays;
    const tirage = ((t?.boites?.length ?? 0) + 1) * 31 + (accueil.jour ?? 0);
    if (!assistant) assistant = nouvelAssistant();
    const F = assistant;
    if (!F.plan) F.plan = propose(B, B.secteurs.find(estMicro) ?? B.secteurs[0], residenceVille?.id ?? "bruxelles", tirage);
    const d = { B, cat, t, banque, illegal, monde, accueil, residence, residenceVille, tirage };
    // Proposé à l'étape Financement : le compte courant paie ce qu'il peut.
    const cout = coutCreation(B, F.plan, residence);
    if (F.etape >= 6 && !F.partsProposees && cout) {
      F.partsProposees = true;
      if ((accueil.tresorerie ?? 0) > 0 && !Object.keys(F.parts).length) F.parts.principal = Math.min(accueil.tresorerie, cout.total);
    }
    d.cout = cout;
    d.apercu = await ctx.tableau("apercuCreation", { plan: planComplet(F, B, residence) });
    dernierFonder = d;
    return d;
  },
  rendu(d) {
    styles();
    const F = assistant;
    const p = F.plan;
    const etape = [etapeSecteur, etapeNom, etapeVille, etapeLocal, etapeGamme, etapeEquipe, etapeFinancement, etapeStatuts][F.etape];
    const a = d.apercu;
    const dernier = F.etape === TITRES.length - 1;
    const texteFonder = a?.verdict ? "Paiement incomplet" : !F.signe ? "Signe les statuts" : `Fonder ${esc(p.nom)}`;
    return `${entetePousse("Fonder une boîte")}
      <div class="ent-pile18" style="margin-top:4px">
        <div><div class="aide">Étape ${F.etape + 1} sur ${TITRES.length}, ${TITRES[F.etape].toLowerCase()}</div>
          <div class="rail" style="height:4px;margin-top:8px"><i style="width:${((F.etape + 1) / TITRES.length) * 100}%"></i></div></div>
        <div class="ent-pile18 page" style="animation-duration:.3s">${etape(d, F, p, a)}</div>
      </div>
      <div class="ent-bas">
        ${bouton(F.etape === 0 ? "Annuler" : "Précédent", "entPrecedent", { genre: "secondaire" })}
        ${dernier ? `<button class="bouton" id="ent-fonder" data-action="entFonder" ${!F.signe || a?.verdict ? "disabled" : ""}>${texteFonder}</button>`
          : bouton("Suivant", "entSuivant")}
      </div>`;
  },
  actions: {
    async entPrecedent(ctx) {
      if (assistant.etape === 0) { assistant = null; return ctx.retour(); }
      assistant.etape -= 1;
      await ctx.rafraichir(); window.scrollTo(0, 0);
    },
    async entSuivant(ctx, b, d) {
      const F = assistant;
      if (F.etape === 1 && !F.plan.nom.trim()) return ctx.toast("Donne un nom à ta boîte", "refus");
      // D103 : on ne va pas signer un plan qu'on ne sait pas payer.
      if (F.etape === 6 && d.apercu?.verdict) return ctx.toast(d.apercu.verdict, "refus");
      F.etape += 1;
      await ctx.rafraichir(); window.scrollTo(0, 0);
    },
    async entFonder(ctx, b, d) {
      const F = assistant;
      if (!F.signe) return ctx.toast("Signe les statuts", "refus");
      const plan = planComplet(F, d.B, d.residence);
      const nom = plan.nom;
      const ok = await ctx.decider("entreprises", { fonder: { _0: plan } }, { succes: `${nom} est ouverte` });
      if (ok) { assistant = null; await ctx.retour(); }
    },
    // Étape 0 : le métier
    async entFamille(ctx, b) { assistant.famille = b.dataset.famille; assistant.rs = ""; await ctx.rafraichir(); },
    async entSecteur(ctx, b, d) {
      const s = secteur(d.B, b.dataset.secteur);
      assistant.plan = propose(d.B, s, assistant.plan.ville, d.tirage);
      await ctx.rafraichir();
    },
    entChercheSecteur(ctx, el) { assistant.rs = el.value; majListe("ent-liste-secteurs", listeSecteurs(dernierFonder, assistant)); },
    entTriSecteur(ctx, el) { assistant.triS = el.value; majListe("ent-liste-secteurs", listeSecteurs(dernierFonder, assistant)); },
    async entFiltreSecteur(ctx, b) { basculer(assistant.filtresS, b.dataset.filtre); await ctx.rafraichir(); },
    // Étape 1 : le nom et la couleur
    entNom(ctx, el) {
      assistant.plan.nom = el.value.slice(0, 32);
      const n = document.querySelector("#ent-dev-nom .plaque .nom");
      if (n) n.textContent = assistant.plan.nom || "…";
    },
    async entNomPropose(ctx, b) { assistant.plan.nom = b.dataset.nom; await ctx.rafraichir(); },
    async entCouleurPlan(ctx, b) { assistant.plan.couleur = b.dataset.couleur || undefined; if (!b.dataset.couleur) delete assistant.plan.couleur; await ctx.rafraichir(); },
    // Étape 2 : la ville
    async entVille(ctx, b, d) {
      const F = assistant;
      F.plan.ville = b.dataset.ville;
      // Chaque ville a son niveau de prix ; le prix proposé suit.
      const s = secteur(d.B, F.plan.secteur), g = gamme(d.B, F.plan.gamme);
      if (s && g) F.plan.prix = prixMarche(d.B, s, g, F.plan.ville);
      await ctx.rafraichir();
    },
    entChercheVille(ctx, el) { assistant.rv = el.value; majListe("ent-liste-villes", listeVilles(dernierFonder, assistant)); },
    async entTriVille(ctx, el) { assistant.triV = el.value; majListe("ent-liste-villes", listeVilles(dernierFonder, assistant)); },
    async entFiltreVille(ctx, b) { basculer(assistant.filtresV, b.dataset.filtre); await ctx.rafraichir(); },
    // Étape 3 : le local
    async entAchat(ctx, b) { assistant.plan.achat = b.dataset.valeur === "acheter"; await ctx.rafraichir(); },
    async entTaille(ctx, b) { assistant.plan.taille = b.dataset.taille; await ctx.rafraichir(); },
    // Étape 4 : la gamme et le prix
    async entGammePlan(ctx, b, d) {
      const F = assistant;
      F.plan.gamme = b.dataset.gamme;
      const s = secteur(d.B, F.plan.secteur), g = gamme(d.B, F.plan.gamme);
      if (s && g) F.plan.prix = prixMarche(d.B, s, g, F.plan.ville);
      await ctx.rafraichir();
    },
    entPrixPlan(ctx, b, d) {
      const s = secteur(d.B, assistant.plan.secteur);
      saisir(ctx, { titre: `Prix de vente par ${s?.uniteSingulier ?? "unité"}`, aide: "Plus cher : plus de marge, moins de clients", proposition: assistant.plan.prix,
        valider: async (v) => { assistant.plan.prix = v; ctx.fermerFeuille(); await ctx.rafraichir(); } });
    },
    // Étape 5 : l'équipe
    async entEquipe(ctx, b, d) {
      const F = assistant, id = b.dataset.poste, n = F.plan.equipe[id] ?? 0;
      F.plan.equipe[id] = Math.min(40, Math.max(0, n + Number(b.dataset.pas)));
      await ctx.rafraichir();
    },
    async entNiveau(ctx, b) { assistant.plan.niveaux[b.dataset.poste] = Number(b.dataset.niveau); await ctx.rafraichir(); },
    // Étape 6 : le financement
    entPart(ctx, b, d) {
      const F = assistant, id = b.dataset.source;
      const src = sourcesPaiement(d).find((s) => s.id === id);
      const paye = Object.values(F.parts).reduce((a, x) => a + x, 0);
      const deja = F.parts[id] ?? 0;
      const courant = id === "principal" ? 0 : (F.parts.principal ?? 0);
      const total = d.cout?.total ?? 0;
      const reste = Math.max(0, total - paye + deja + courant);
      const maximum = Math.min(src?.disponible ?? 0, reste);
      saisir(ctx, { titre: src?.nom ?? "Montant", aide: `Disponible : ${montant(src?.disponible ?? 0)}. Vide pour ne rien prendre ici.`,
        proposition: deja > 0 ? deja : maximum, maximum, zero: true,
        valider: async (v) => {
          if (v > 0) F.parts[id] = v; else delete F.parts[id];
          // Ce que cette source paie en trop est retiré du compte courant.
          const p2 = Object.values(F.parts).reduce((a, x) => a + x, 0);
          if (id !== "principal" && F.parts.principal && p2 > total) {
            const nouveau = Math.max(0, F.parts.principal - (p2 - total));
            if (nouveau > 0) F.parts.principal = nouveau; else delete F.parts.principal;
          }
          ctx.fermerFeuille(); await ctx.rafraichir();
        } });
    },
    async entHoldingPlan(ctx) { const p = assistant.plan; if (p.horsHolding) delete p.horsHolding; else p.horsHolding = true; await ctx.rafraichir(); },
    async entCredit(ctx) { assistant.aCredit = !assistant.aCredit; await ctx.rafraichir(); },
    async entSemaines(ctx, b) { assistant.semaines = Number(b.dataset.semaines); await ctx.rafraichir(); },
    // Étape 7 : la signature
    entEffacer() { assistant.signe = false; const c = document.getElementById("ent-signature"); c?.getContext("2d").clearRect(0, 0, c.width, c.height); majBoutonFonder(); },
  },
};

function basculer(liste, x) { const i = liste.indexOf(x); if (i >= 0) liste.splice(i, 1); else liste.push(x); }
function majListe(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
const contient = (q, ...textes) => { const s = q.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, ""); return !s || textes.some((t) => (t ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").includes(s)); };

/** Une barre de liste : chercher, trier, filtrer (BarreListe), en plus simple. */
function barreListe({ invite, valeur, saisie, tri, tris, actionTri, filtres, actifs, actionFiltre }) {
  return `<div class="ent-pile" style="gap:10px">
    <label class="ent-cherche">${G.loupe}<input type="search" placeholder="${esc(invite)}" value="${esc(valeur)}" data-saisie="${saisie}" aria-label="${esc(invite)}">
      <select data-saisie="${actionTri}" aria-label="Trier">${tris.map(([id, nom]) => `<option value="${id}" ${id === tri ? "selected" : ""}>${esc(nom)}</option>`).join("")}</select></label>
    ${filtres.length ? `<div class="ent-defile">${filtres.map(([id, nom]) => pilule(esc(nom), actionFiltre, actifs.includes(id), { filtre: id }, "petite")).join("")}</div>` : ""}
  </div>`;
}

function etapeSecteur(d, F, p) {
  const familles = [{ id: "micro", nom: "Pour débuter", icone: "eclats" }, ...d.B.familles.map((f) => ({ ...f, icone: ICONE_FAMILLE[f.id] ?? "immeuble" }))];
  return `<h2 class="ent-titre">Quel métier ?</h2>
    <div class="ent-defile">${familles.map((f) => pilule(`${G[f.icone] ?? ""}${esc(f.nom)}`, "entFamille", F.famille === f.id, { famille: f.id })).join("")}</div>
    ${F.famille === "micro" ? `<p class="aide">Seul, sans local ni salarié, pour quelques centaines d'euros. Elle tourne avec ton focus, et pourra grandir en vraie boîte.</p>` : ""}
    ${barreListe({ invite: "Chercher un métier", valeur: F.rs, saisie: "entChercheSecteur", tri: F.triS, actionTri: "entTriSecteur",
      tris: [["installation", "Installation"], ["marge", "Marge"], ["clients", "Clients"], ["prix", "Prix de vente"], ["controles", "Contrôles"], ["nom", "Nom"]],
      filtres: [["abordable", "À ta portée"], ["calme", "Ventes régulières"]], actifs: F.filtresS, actionFiltre: "entFiltreSecteur" })}
    <div id="ent-liste-secteurs" class="ent-pile" style="gap:12px">${listeSecteurs(d, F)}</div>`;
}

function listeSecteurs(d, F) {
  const B = d.B, p = F.plan;
  const dispo = d.accueil?.tresorerie ?? 0;
  const cles = { installation: (s) => s.installationCentimes, prix: (s) => -s.prixCentimes, marge: (s) => -(s.prixCentimes - s.coutCentimes) / Math.max(1, s.prixCentimes),
    clients: (s) => -s.clients, controles: (s) => s.controles.length };
  let l = B.secteurs
    .filter((s) => (F.rs.trim() ? contient(F.rs, s.nom, s.unite) : F.famille === "micro" ? estMicro(s) : s.famille === F.famille && !estMicro(s)))
    .filter((s) => !F.filtresS.includes("abordable") || s.installationCentimes * (estMicro(s) ? 1 : 0.7) <= dispo)
    .filter((s) => !F.filtresS.includes("calme") || s.volatilite <= 0.1);
  l = F.triS === "nom" ? l.sort((a, b) => a.nom.localeCompare(b.nom, "fr")) : l.sort((a, b) => cles[F.triS](a) - cles[F.triS](b));
  const compte = `<div class="ent-compte">${pluriel(l.length, "métier")}</div>`;
  if (!l.length) return `${compte}<p class="aide">Aucun métier ne correspond.</p>`;
  return compte + l.map((s) => {
    const c = couleurFamille(s.famille);
    const evol = estMicro(s) && s.evolution ? secteur(B, s.evolution) : null;
    return `<button class="ent-choix" aria-pressed="${s.id === p.secteur}" ${act("entSecteur", { secteur: s.id })} data-id="${s.id}">
      <div style="display:flex;gap:14px;align-items:center">
        <span class="ent-icone-metier" style="background:linear-gradient(135deg,${c},${c}99)">${icoMetier(s.id)}</span>
        <span style="flex:1;min-width:0"><div class="libelle">${esc(s.nom)}</div>
          <div class="aide">${estMicro(s) ? `Pour ${montant(s.installationCentimes)} de matériel` : `Installation dès ${montant(Math.round(s.installationCentimes * 0.7))}`}</div>
          <div class="legende" style="font-weight:400">${evol ? `Peut devenir : ${esc(evol.nom.toLowerCase())}` : `Contrôles : ${s.controles.map((x) => (B.controles.find((c) => c.id === x)?.nom ?? x).toLowerCase()).join(", ")}`}</div></span>
        <span class="legende" style="text-align:right;font-weight:600;white-space:nowrap">${montantC(s.prixCentimes)}<br>/ ${esc(s.uniteSingulier)}</span>
      </div></button>`;
  }).join("");
}

function etapeNom(d, F, p) {
  const s = secteur(d.B, p.secteur);
  return `<h2 class="ent-titre">Son nom</h2>
    ${devanture({ nom: p.nom || "…", secteur: p.secteur, famille: s?.famille, couleur: p.couleur, grande: true, id: "ent-dev-nom" })}
    <input class="champ" id="ent-nom" value="${esc(p.nom)}" maxlength="32" placeholder="Le nom sur l'enseigne" data-saisie="entNom" aria-label="Le nom sur l'enseigne" style="font-size:18px">
    <div class="ent-pilules">${(s ? nomsProposes(s, d.tirage) : []).map((n) => pilule(esc(n), "entNomPropose", n === p.nom, { nom: n })).join("")}</div>
    <div class="libelle" style="margin-top:4px">La couleur du store</div>
    ${choixCouleur(s?.famille, p.couleur, "entCouleurPlan")}`;
}

function etapeVille(d, F, p) {
  const regions = [...new Set(d.B.villes.map((v) => v.region))].sort();
  return `<h2 class="ent-titre">Où ?</h2>
    <p class="aide">Dans un même palier, les villes se valent : l'une a des clients qui paient plus, l'autre des impôts plus bas, des équipes moins chères ou un climat plus calme. Un palier plus haut rapporte plus, mais il faut le patrimoine pour y entrer.</p>
    ${barreListe({ invite: "Ville, pays ou région", valeur: F.rv, saisie: "entChercheVille", tri: F.triV, actionTri: "entTriVille",
      tris: [["pays", "Chez toi d'abord"], ["nom", "Nom"], ["clients", "Clients"], ["prix", "Prix payés"], ["salaires", "Salaires"], ["impot", "Impôt"], ["calme", "Calme"], ["talents", "Talents"], ["seuil", "Seuil d'entrée"]],
      filtres: [["ouvertes", "Ouvertes"], ["chezToi", "Mon pays"], ...regions.map((r) => [`region:${r}`, r])], actifs: F.filtresV, actionFiltre: "entFiltreVille" })}
    <div id="ent-liste-villes" class="ent-pile18">${listeVilles(d, F)}</div>`;
}

function listeVilles(d, F) {
  const B = d.B, p = F.plan, residence = d.residence;
  const patrimoine = d.accueil?.patrimoine ?? 0;
  const regionsChoisies = F.filtresV.filter((x) => x.startsWith("region:")).map((x) => x.slice(7));
  const ouverte = (v) => v.codePays === residence || (v.seuilCentimes ?? 0) <= patrimoine;
  const paysNom = (v) => v.pays ?? d.cat.pays.find((x) => x.code === v.codePays)?.nom ?? "";
  let l = B.villes
    .filter((v) => contient(F.rv, v.nom, paysNom(v), v.region))
    .filter((v) => !F.filtresV.includes("ouvertes") || ouverte(v))
    .filter((v) => !F.filtresV.includes("chezToi") || v.codePays === residence)
    .filter((v) => !regionsChoisies.length || regionsChoisies.includes(v.region));
  const cles = { clients: (v) => -v.clientele, prix: (v) => -(v.niveauPrix ?? 1), salaires: (v) => v.salaires ?? 1, impot: (v) => v.isoc,
    calme: (v) => v.social + v.aleas * 0.3, talents: (v) => -(v.talents ?? 1), seuil: (v) => v.seuilCentimes ?? 0 };
  if (F.triV === "pays") l.sort((a, b) => (a.codePays === residence) !== (b.codePays === residence) ? (a.codePays === residence ? -1 : 1) : a.nom.localeCompare(b.nom, "fr"));
  else if (F.triV === "nom") l.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  else l.sort((a, b) => cles[F.triV](a) - cles[F.triV](b));
  if (!l.length) return `<p class="aide">Aucune ville ne correspond.</p>`;
  let h = `<div class="ent-compte">${pluriel(l.length, "ville")}</div>`;
  for (let palier = 1; palier <= 4; palier++) {
    const villes = l.filter((v) => palierVille(v) === palier);
    if (!villes.length) continue;
    const voisines = B.villes.filter((v) => palierVille(v) === palier);
    h += sectionReglages(NOMS_PALIERS[palier - 1], villes.map((v) => {
      const chezToi = v.codePays === residence;
      const fermee = !chezToi && (v.seuilCentimes ?? 0) > patrimoine;
      const drapeau = d.cat.pays.find((x) => x.code === v.codePays)?.drapeau ?? "";
      const r = (f) => rang(f(v), voisines.map(f));
      return `<button class="ent-ligne" style="flex-direction:column;align-items:stretch;gap:10px;${fermee ? "opacity:.55" : ""}" ${act("entVille", { ville: v.id })} ${fermee ? "disabled" : ""} aria-pressed="${v.id === p.ville}">
        <span style="display:flex;align-items:center;gap:10px">${radio(v.id === p.ville)}
          <span style="flex:1;min-width:0"><div class="t">${esc(v.nom)}</div><div class="legende" style="font-weight:400">${drapeau} ${esc(paysNom(v))}${!chezToi && !fermee && v.licenceCentimes ? `, licence ${montant(v.licenceCentimes)}` : ""}</div></span>
          <span style="font-size:12px;font-weight:600;color:var(--accent);text-align:right">${esc(atoutVille(v, voisines))}</span></span>
        <span style="display:flex;gap:12px;flex-wrap:wrap">${points("Clients", r((x) => x.clientele))}${points("Prix", r((x) => x.niveauPrix ?? 1))}
          ${points("Salaires bas", r((x) => -(x.salaires ?? 1)))}${points("Impôt bas", r((x) => -x.isoc))}${points("Calme", r((x) => -x.social - x.aleas * 0.3))}</span>
        ${fermee && v.seuilCentimes ? `<span class="alerte" style="font-size:12px;font-weight:500;display:flex;gap:6px;align-items:center"><span class="ent-ic" style="width:12px;height:12px">${icones.verrou}</span>S'ouvre à ${montant(v.seuilCentimes)} de patrimoine</span>` : ""}
      </button>`;
    }).join(""));
  }
  return h;
}

/** Son point le plus fort face aux villes de son palier (LigneVille.atout). */
function atoutVille(v, voisines) {
  const ecart = (f) => {
    const x = voisines.map(f), m = x.reduce((a, b) => a + b, 0) / Math.max(1, x.length);
    const e = Math.sqrt(x.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, x.length));
    return e > 0 ? (f(v) - m) / e : 0;
  };
  const c = [["Clientèle nombreuse", ecart((x) => x.clientele)], ["Clients qui paient", ecart((x) => x.niveauPrix ?? 1)], ["Équipes bon marché", ecart((x) => -(x.salaires ?? 1))],
    ["Impôt léger", ecart((x) => -x.isoc)], ["Climat serein", ecart((x) => -x.social - x.aleas * 0.3)], ["Vivier de talents", ecart((x) => x.talents ?? 1)], ["Revente chère", ecart((x) => x.revente)]];
  return c.reduce((m, x) => (x[1] > m[1] ? x : m), c[0])[0];
}

function etapeLocal(d, F, p) {
  const B = d.B, s = secteur(B, p.secteur), v = ville(B, p.ville);
  if (estMicro(s)) return `<h2 class="ent-titre">Le local</h2><p class="aide">Pas de local : tu travailles de chez toi ou chez tes clients. Ni loyer, ni caution.</p>`;
  return `<h2 class="ent-titre">Le local</h2>
    ${segment([["louer", "Louer"], ["acheter", "Acheter"]], p.achat ? "acheter" : "louer", "entAchat")}
    <p class="aide">${p.achat ? "Le local devient un actif, revendu avec la boîte ou seul." : "Trois semaines de caution, puis un loyer chaque semaine."}</p>
    <div class="grille3">${B.tailles.map((t) => {
      const n = machinesPossibles(B, t.id);
      const ic = t.id === "petit" ? icones.maison : t.id === "moyen" ? G.immeuble : icones.banque;
      return `<button class="ent-choix" style="padding:12px;display:flex;flex-direction:column;gap:6px" aria-pressed="${t.id === p.taille}" ${act("entTaille", { taille: t.id })}>
        <span class="ent-ic" style="width:${t.id === "petit" ? 20 : t.id === "moyen" ? 24 : 28}px;height:28px;align-items:end">${t.id === "grand" ? G.immeuble : ic}</span>
        <span class="libelle">${esc(t.nom)}</span>
        <span class="legende" style="font-size:11px;font-weight:400">${places(s, t) ?? 0} personnes, ${pluriel(n, "machine")}</span>
        <span class="ent-mono" style="font-size:12px;font-weight:600">${p.achat ? montant(prixLocal(t, v)) : `${montant(loyerHebdo(B, t, v))}/sem.`}</span>
        <span class="legende" style="font-size:11px;font-weight:400">Installation ${montant(Math.round(s.installationCentimes * t.installation))}</span>
      </button>`;
    }).join("")}</div>`;
}

function etapeGamme(d, F, p, a) {
  const s = secteur(d.B, p.secteur);
  return `<h2 class="ent-titre">Gamme et prix</h2>
    ${choixGamme(d.B.gammes, p.gamme, "entGammePlan")}
    <button class="champ" style="text-align:left;display:flex;align-items:center;justify-content:space-between" data-action="entPrixPlan">
      <span>${montantC(p.prix)}</span><span class="t3" style="width:16px">${G.stylo}</span></button>
    ${a ? carte(`${ligneVal("Prix moyen du marché", montantC(a.prixMarche))}${ligneVal(`Marge par ${esc(s?.uniteSingulier ?? "unité")}`, montantC(a.margeUnitaire), a.margeUnitaire > 0 ? "gain" : "perte")}
      ${ligneVal("Clients par jour", `${Math.round(a.demandeJour)}`)}`, { classe: "ent-lignes" }) : ""}`;
}

const ligneVal = (titre, valeur, couleur = "") => `<div class="ent-ligne"><span class="t" style="flex:1;font-weight:500">${titre}</span><span class="v ${couleur}">${valeur}</span></div>`;

function etapeEquipe(d, F, p, a) {
  const B = d.B, s = secteur(B, p.secteur), t = taille(B, p.taille);
  const total = Object.values(p.equipe).reduce((x, y) => x + y, 0);
  const pl = places(s, t);
  const plein = pl != null && total >= pl;
  return `<h2 class="ent-titre">L'équipe</h2>
    ${estMicro(s) ? `<p class="aide">Au début, c'est toi qui fais tout, et ça ne coûte rien. Un aide produit un peu plus, contre un salaire.</p>` : ""}
    ${pl != null ? `<p style="font-size:13px;font-weight:500;color:${total > pl ? "var(--alerte)" : "var(--texte2)"}">${total} sur ${pl} places dans un local ${esc(t?.nom.toLowerCase() ?? "")}${total >= pl ? " : agrandis le local pour embaucher plus." : "."}</p>` : ""}
    ${s.postes.map((poste) => {
      const n = p.equipe[poste.id] ?? 0, niveau = p.niveaux[poste.id] ?? 1;
      return carte(`<div class="ent-carte-pad" style="padding:14px;gap:10px">
        <div class="ent-entre"><span style="flex:1;min-width:0"><div class="libelle">${esc(poste.nom)}</div>
          <div class="aide">${montant(Math.round(poste.salaireCentimes * niveau))}/sem. chacun</div></span>
          <button class="ent-plusmoins" ${act("entEquipe", { poste: poste.id, pas: -1 })} ${n === 0 ? "disabled" : ""} aria-label="Un de moins">${G.minus}</button>
          <span class="chiffres" style="font-size:20px;min-width:28px;text-align:center">${n}</span>
          <button class="ent-plusmoins" ${act("entEquipe", { poste: poste.id, pas: 1 })} ${plein ? "disabled" : ""} aria-label="Un de plus">${G.plus}</button></div>
        <div class="ent-pilules" style="gap:6px">${B.niveauxSalaire.map((f) => pilule(f === 1 ? "Marché" : pct(f - 1, { signe: true }), "entNiveau", niveau === f, { poste: poste.id, niveau: f }, "petite")).join("")}</div>
      </div>`);
    }).join("")}
    ${a ? `<p style="font-size:13px;font-weight:500;color:${a.capaciteJour < a.demandeJour * 0.8 ? "var(--alerte)" : "var(--texte2)"}">Capacité ${Math.round(a.capaciteJour)} pour ${Math.round(a.demandeJour)} clients par jour ; ${montant(a.cout.masse)} de salaires par semaine.</p>` : ""}`;
}

function etapeFinancement(d, F, p, a) {
  if (!a) return `<h2 class="ent-titre">Financement</h2><p class="aide">Ce plan ne peut pas être chiffré.</p>`;
  const paye = Object.values(F.parts).reduce((x, y) => x + y, 0);
  const reste = Math.max(0, totalCout(a.cout) - paye);
  const sources = sourcesPaiement(d);
  return `<h2 class="ent-titre">Financement</h2>
    ${papier(`${titrePapier("Plan de financement", "Ce qu'il faut pour ouvrir")}
      ${champPapier("Installation", montant(a.cout.installation))}${champPapier(p.achat ? "Achat du local" : "Caution du local", montant(a.cout.local))}
      ${a.cout.licence > 0 ? champPapier("Licence étrangère", montant(a.cout.licence)) : ""}${champPapier("Fonds de roulement", montant(a.cout.roulement))}
      ${champPapier("Total", montant(totalCout(a.cout)), true)}`, { empilee: false })}
    <div class="libelle">Comment payer</div>
    <div class="carte ent-lignes">${sources.map((src) => `<button class="ent-ligne" ${act("entPart", { source: src.id })}>
      <span class="ent-ic" style="width:22px;height:22px;color:${src.risque ? "var(--alerte)" : "var(--texte2)"}">${G[src.icone] ?? icones[src.icone] ?? icones.banque}</span>
      <span style="flex:1;min-width:0"><div class="t">${esc(src.nom)}</div><div class="d" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${src.detail ? `${esc(src.detail)}, ` : ""}${montant(src.disponible)} dispo</div></span>
      ${F.parts[src.id] ? `<span class="chiffres" style="font-size:16px">${montant(F.parts[src.id])}</span>` : `<span class="t3 ent-ic" style="width:20px;height:20px">${G.plus}</span>`}
    </button>`).join("")}</div>
    <p class="aide">Payée pour moitié ou plus par une de tes boîtes, elle en devient la succursale (même métier, même marque) ou la filiale.</p>
    ${carte(ligneInterrupteur({ icone: "immeuble", teinte: "var(--argent)", titre: "Rattacher à ma holding", oui: !p.horsHolding, action: "entHoldingPlan",
      detail: p.horsHolding ? "Elle gardera sa trésorerie pour elle : ni achats « Holding », ni versements groupés." : "Elle paiera avec tes autres boîtes les achats « Holding » et les versements groupés, selon ce qu'elle peut." }))}
    <div class="ent-entre"><span class="aide">${reste > 0 ? "Reste à financer" : "Tout est couvert"}</span><span class="chiffres ${reste > 0 ? "" : "gain"}" style="font-size:16px">${montant(reste)}</span></div>
    ${reste > 0 ? `${carte(ligneInterrupteur({ titre: "Compléter par un crédit pro", detail: `Ta banque principale prête le reste. Apport d'au moins ${montant(a.apportMinimum)}.`, oui: F.aCredit, action: "entCredit" }))}
      ${F.aCredit ? `<div class="ent-pilules" style="gap:6px">${(d.cat.banque?.credit?.dureesSemaines ?? [5, 7, 10, 15, 20]).map((n) => pilule(`${n} sem.`, "entSemaines", F.semaines === n, { semaines: n }, "petite")).join("")}</div>
        ${a.offre?.accordee ? `<p style="font-size:14px;font-weight:500" class="t2">${montant(a.offre.montant)} à ${pct(a.offre.taux, { decimales: 2 })}, ${montant(a.offre.echeance)} chaque dimanche.</p>` : ""}` : ""}` : ""}
    ${verdict(a, paye, F)}`;
}

/** D103 : avant de signer, on sait si ça passe, et sinon pourquoi. */
function verdict(a, paye, F) {
  const ok = !a.verdict;
  const credit = Math.max(0, totalCout(a.cout) - paye);
  return carte(`<div class="ent-verdict"><span class="${ok ? "gain" : "alerte"}">${ok ? G.sceau : G.alerte}</span>
    <span><div class="libelle">${ok ? "Tu sais payer" : "Ça ne passe pas encore"}</div>
    <div class="aide">${ok ? (credit > 0 && F.aCredit ? `${montant(paye)} aujourd'hui, ${montant(credit)} à crédit.` : `${montant(paye)} payés aujourd'hui.`) : esc(a.verdict)}</div></span></div>`);
}

function etapeStatuts(d, F, p, a) {
  const B = d.B, s = secteur(B, p.secteur);
  const paye = Object.values(F.parts).reduce((x, y) => x + y, 0);
  const sources = sourcesPaiement(d).filter((x) => F.parts[x.id]);
  return papier(`${titrePapier(`Statuts de ${p.nom}`, "Société à responsabilité limitée")}
    ${champPapier("Activité", `${esc(s?.nom ?? "")}, ${esc(ville(B, p.ville)?.nom ?? "")}`)}
    ${champPapier("Local", `${esc(taille(B, p.taille)?.nom ?? "")}, ${p.achat ? "acheté" : "loué"}`)}
    ${champPapier("Gamme et prix", `${esc(gamme(B, p.gamme)?.nom ?? "")}, ${montantC(p.prix)}`)}
    ${champPapier("Équipe", `${Object.values(p.equipe).reduce((x, y) => x + y, 0)} personnes`)}
    ${a ? `${champPapier("Chiffre d'affaires estimé", `${montant(a.caSemaine)}/sem.`)}${champPapier("Bénéfice estimé", `${variation(a.beneficeSemaine)}/sem.`)}
      ${sources.map((x) => champPapier(x.nom, montant(F.parts[x.id]))).join("")}
      ${F.aCredit && totalCout(a.cout) > paye ? champPapier(`Crédit pro, ${F.semaines} semaines`, montant(totalCout(a.cout) - paye)) : ""}
      ${champPapier("Total", montant(totalCout(a.cout)), true)}
      ${a.verdict ? `<div style="font-size:13px;font-weight:500;color:#B4442A">${esc(a.verdict)}</div>` : ""}` : ""}
    <div class="encre2" style="font-size:11px">Estimations à 4 h de focus par jour ouvrable.</div>
    <div class="ent-entre" style="margin-top:6px"><span class="encre2">Signature du gérant</span><button class="ent-encre clair" data-action="entEffacer">Effacer</button></div>
    <canvas id="ent-signature" width="600" height="220" aria-label="Signe ici, au doigt ou à la souris"></canvas>`)
    // RNT-175 : pas encore les moyens ? Le métier et la ville comme objectif (le coût de création).
    + `<div>${boutonEpingler(null, { sorte: "fonder", cible: `${p.secteur}@${p.ville}` }, { libelle: "Épingler comme objectif" })}</div>`;
}

function majBoutonFonder() {
  const b = document.getElementById("ent-fonder");
  if (!b || !assistant || !dernierFonder) return;
  const verdict = dernierFonder.apercu?.verdict;
  b.disabled = !assistant.signe || !!verdict;
  b.textContent = verdict ? "Paiement incomplet" : !assistant.signe ? "Signe les statuts" : `Fonder ${assistant.plan.nom}`;
}

// La signature au doigt (PadSignature) : un trait d'encre bleue sur le papier.
if (typeof document !== "undefined") {
  let trait = null;
  const point = (c, e) => { const r = c.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height]; };
  document.addEventListener("pointerdown", (e) => {
    const c = e.target.closest?.("#ent-signature");
    if (!c) return;
    e.preventDefault();
    c.setPointerCapture?.(e.pointerId);
    const g = c.getContext("2d");
    g.strokeStyle = "#1F3A8A"; g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round";
    trait = { c, g, dernier: point(c, e), longueur: 0 };
  });
  document.addEventListener("pointermove", (e) => {
    if (!trait) return;
    const [x, y] = point(trait.c, e), [x0, y0] = trait.dernier;
    trait.g.beginPath(); trait.g.moveTo(x0, y0); trait.g.lineTo(x, y); trait.g.stroke();
    trait.longueur += Math.hypot(x - x0, y - y0);
    trait.dernier = [x, y];
    if (trait.longueur > 40 && assistant && !assistant.signe) { assistant.signe = true; majBoutonFonder(); }
  });
  document.addEventListener("pointerup", () => { trait = null; });
}

// MARK: - La fiche d'une boîte (EcranBoite)

const RUBRIQUES = [
  ["vente", "Vente", "etiquette", "var(--vente)"], ["equipe", "Équipe", "equipe", "var(--equipe)"], ["argent", "Argent", "banque", "var(--argent)"],
  ["controles", "Contrôles", "controles", "var(--controles)"], ["image", "Image", "pinceau", "var(--image)"], ["grandir", "Grandir", "grandir", "var(--grandir)"],
];
/** La rubrique ouverte et le brouillon d'image, par boîte. */
const rubriques = {};
const brouillons = {};
const NIVEAUX_ASSURANCE = ["Aucune", "RC", "Mini", "Omnium"];

const PAGE_BOITE = {
  titre: "Boîte",
  async donnees(ctx, p) {
    styles();
    const id = Number(p.id);
    const [t, concurrence, direction, difficulte, liste, cat] = await Promise.all([
      ctx.tableau("boite", { id }), ctx.tableau("concurrence", { id }), ctx.tableau("direction", { id }), ctx.tableau("difficulte", { id }),
      ctx.tableau("entreprises"), lireCatalogues(ctx)]);
    return { t, concurrence, direction, difficulte, liste, B: cat.e, ligne: liste?.boites?.find((b) => b.id === id) ?? null };
  },
  rendu(d, ctx, p) {
    styles();
    const t = d.t;
    if (!t) return `${entetePousse("Boîte")}${vide("Cette boîte n'existe plus.")}`;
    const r = rubriques[t.id] ?? "vente";
    const crayon = `<button class="rond" data-action="entRenommer" aria-label="Renommer la boîte">${G.stylo}</button>`;
    return `${entetePousse(t.nom, crayon)}
    <div class="ent-pile18" style="margin-top:8px">
      ${devanture({ nom: t.nom, secteur: t.secteurID, famille: t.famille, couleur: t.couleur, style: d.ligne?.style, grande: true })}
      <div class="ent-entre"><span class="aide">${esc(t.sousTitre)}</span>${etoiles(t.reputation)}</div>
      ${t.etat ? `<div class="alerte" style="font-size:14px;font-weight:600">${esc(t.etat[0].toUpperCase() + t.etat.slice(1))}</div>` : ""}
      ${releve(t)}
      ${carteDifficulte(d.difficulte)}
      ${t.alertes.map(avis).join("")}
      ${conseils(t)}
      <div class="ent-rubs" role="group" aria-label="Rubriques">${RUBRIQUES.map(([id, nom, ic, c]) => {
        const e = etatRubrique(id, t, d);
        return `<button class="ent-rub" style="--c:${c}" aria-pressed="${id === r}" ${act("entRubrique", { rubrique: id })}>
          <span class="ent-entre"><span class="ent-pastille" style="--c:${c}">${G[ic] ?? icones[ic]}</span>${e.alerte ? `<span class="ent-point"></span>` : ""}</span>
          <span class="n">${nom}</span><span class="e ${e.alerte ? "alerte" : ""}">${e.texte}</span></button>`;
      }).join("")}</div>
      <div class="ent-pile18">${pageRubrique(r, t, d)}</div>
    </div>`;
  },
  actions: {
    async entRubrique(ctx, b, d) { rubriques[d.t.id] = b.dataset.rubrique; await ctx.rafraichir(); },
    entRenommer(ctx, b, d) {
      ctx.feuille({ titre: "Renommer la boîte",
        contenu: `<p class="aide">De 2 à 30 caractères. Les joueurs de ton monde voient le nouveau nom.</p>
          <input class="champ" id="ent-renom" value="${esc(d.t.nom)}" maxlength="30" aria-label="Nom">${bouton("Renommer", "entValiderNom")}`,
        actions: { entValiderNom: (ctx) => entreprendre(ctx, { renommer: { boite: d.t.id, nom: document.getElementById("ent-renom").value.trim() } }, "Renommée") } });
    },
    entVerser(ctx, b, d) { return feuilleVerser(ctx, { boite: d.t.id, titre: d.t.nom }); },
    // Avis : contrôle ou grève
    entRepondre(ctx, b, d) {
      const accepter = b.dataset.accepter === "true";
      return entreprendre(ctx, { repondre: { boite: d.t.id, alerte: Number(b.dataset.alerte), accepter } }, accepter ? "C'est réglé" : "Noté. Ça pourrait revenir plus fort");
    },
    entRenflouer(ctx, b, d) {
      const m = d.difficulte.renflouement;
      confirmer(ctx, { titre: `Renflouer de ${montant(m)} ?`, message: "Depuis ton compte courant. Sa caisse couvrira deux semaines de charges.",
        choix: [{ texte: `Injecter ${montant(m)}`, faire: (ctx) => entreprendre(ctx, { injecter: { boite: d.t.id, _1: m } }, "Renflouée : deux semaines de charges en caisse") }] });
    },
    // Conseils
    entConseil(ctx, b, d) { return suivreConseil(ctx, b.dataset.cible, d); },
    entTousConseils(ctx, b, d) {
      ctx.feuille({ titre: "Conseils",
        contenu: `<p class="aide">Chiffrés sur une journée à 4 h de focus, boîte rodée, réputation installée au nouveau prix. Touche un conseil pour y aller.</p>
          ${sectionReglages(`Pour ${d.t.nom}`, d.t.conseils.map(ligneConseil).join(""))}`,
        actions: { entConseil: (ctx, b2) => suivreConseil(ctx, b2.dataset.cible, d) } });
    },
    // Vente : réglages
    entGamme(ctx, b, d) { if (b.dataset.gamme === d.t.gamme) return; return entreprendre(ctx, { gamme: { boite: d.t.id, _1: b.dataset.gamme } }); },
    entPrix(ctx, b, d) { return saisirPrix(ctx, d.t); },
    entPrixEssai(ctx, b, d) { const v = Number(b.dataset.prix); return entreprendre(ctx, { prix: { boite: d.t.id, _1: v } }, `Prix fixé à ${montantC(v)}`); },
    entDetail(ctx, b, d) { const v = !d.t.detail; return entreprendre(ctx, { detail: { boite: d.t.id, _1: v } }, v ? "Gestion détaillée" : "Pilote automatique"); },
    entMarketing(ctx, b, d) {
      saisir(ctx, { titre: "Budget marketing par semaine", aide: "Les premiers euros comptent le plus", proposition: d.t.marketing, zero: true,
        valider: (v) => entreprendre(ctx, { marketing: { boite: d.t.id, _1: v } }, `Marketing : ${montant(v)} par semaine`) });
    },
    entMachines(ctx, b, d) { return entreprendre(ctx, { machines: { boite: d.t.id } }, "Machines installées"); },
    entFournisseur(ctx, b, d) { return entreprendre(ctx, { fournisseur: { boite: d.t.id, _1: b.dataset.fournisseur } }, "Nouveau fournisseur"); },
    entAssurance(ctx, b, d) { return entreprendre(ctx, { assurance: { boite: d.t.id, _1: Number(b.dataset.valeur) } }, "Assurance changée"); },
    // Équipe : direction
    entRecruter(ctx, b, d) { return feuilleRecrutement(ctx, d.t.id); },
    entCle(ctx, b, d) {
      const c = [d.direction.gerant, ...d.direction.cles].find((x) => x && x.id === Number(b.dataset.cle));
      if (!c) return;
      confirmer(ctx, { titre: c.nom, message: `La boîte lui verse ${d.direction.indemniteSemaines} semaines de salaire, ${montant(c.salaire * d.direction.indemniteSemaines)}.`,
        choix: [{ texte: `Se séparer de ${esc(c.nom)}`, genre: "danger", faire: (ctx) => ctx.decider("entreprises", { congedierCle: { boite: d.t.id, employe: c.id } }, { succes: `${c.nom} quitte la boîte` }) }] });
    },
    // Argent
    entHolding(ctx, b, d) { const v = !d.ligne?.dansHolding; return entreprendre(ctx, { rattacherHolding: { boite: d.t.id, _1: v } }, v ? "Rattachée à la holding" : "Détachée de la holding"); },
    entInjecter(ctx, b, d) {
      saisir(ctx, { titre: "Injecter des fonds", aide: "Depuis ton compte courant", valider: (v) => entreprendre(ctx, { injecter: { boite: d.t.id, _1: v } }, `${montant(v)} injectés`) });
    },
    entLever(ctx, b, d) {
      confirmer(ctx, { titre: "Lever des fonds", message: "Des investisseurs entrent au capital : ils touchent leur part des dividendes et de la revente.",
        choix: d.t.levees.map((l) => ({ texte: `Céder ${pct(l.part)} : +${montant(l.montant)}, tu gardes ${pct(l.gardee)}`, genre: "secondaire",
          faire: (ctx) => ctx.decider("participations", { leverFonds: { boite: d.t.id, part: l.part } }, { succes: `${montant(l.montant)} levés dans la boîte` }) })) });
    },
    entRacheter(ctx, b, d) { return ctx.decider("participations", { racheterInvestisseurs: { boite: d.t.id } }, { succes: "La boîte est de nouveau toute à toi" }); },
    entLocal(ctx, b, d) {
      const choix = d.t.locaux.map((l) => ({ texte: l.possede ? `${esc(l.nom)} : à toi, sans loyer, capacité ×${virgule(l.facteur)}` : `${esc(l.nom)} : ${montant(l.loyer)}/sem., capacité ×${virgule(l.facteur)}`,
        genre: "secondaire", faire: (ctx) => entreprendre(ctx, { installer: { boite: d.t.id, bien: l.id } }, `${d.t.nom} s'installe : ${l.nom}`) }));
      if (d.t.localActuel) choix.push({ texte: "Revenir au local d'origine", genre: "secondaire", faire: (ctx) => entreprendre(ctx, { installer: { boite: d.t.id } }, "Retour au local d'origine") });
      confirmer(ctx, { titre: "Changer de local", message: d.t.surPlace ? "" : "Louer un local se signe sur place : va dans la ville de la boîte (Accueil, Monde). Un bien à toi s'occupe d'ici.", choix });
    },
    entCaisseNoire(ctx, b, d) {
      confirmer(ctx, { titre: "Caisse noire", message: "Chaque dimanche, cette part du bénéfice sort en liquide, sans impôt, dans ton argent sale. Un contrôle fiscal réclame tout, avec une amende.",
        choix: d.t.partsCaisse.map((x) => ({ texte: x === 0 ? "Rien de caché" : `Cacher ${pct(x)} du bénéfice`, genre: x === d.t.caisseNoire ? "primaire" : "secondaire",
          faire: (ctx) => ctx.decider("illegal", { caisseNoire: { boite: d.t.id, _1: x } }, { succes: x === 0 ? "Plus rien de caché" : `${pct(x)} du bénéfice caché` }) })) });
    },
    // Image
    entStyle(ctx, b, d) {
      const s = brouillon(d);
      const { cle, valeur, niveau } = b.dataset;
      if (Number(niveau ?? 0) > niveauImage(d)) { s._verrou = condition(Number(niveau)); return ctx.rafraichir(); }
      s._verrou = null;
      if (cle === "embleme") s.embleme = valeur === "metier" ? null : valeur;
      else if (["lumieres", "plantes", "fanions"].includes(cle)) s[cle] = !s[cle] ? true : (cle === "lumieres" ? false : null);
      else s[cle] = valeur === "" ? null : valeur;
      return ctx.rafraichir();
    },
    entCouleurStore(ctx, b, d) {
      const c = b.dataset.couleur || null;
      return entreprendre(ctx, { couleur: c ? { boite: d.t.id, _1: c } : { boite: d.t.id } }, "Couleur du store changée");
    },
    async entEnregistrerImage(ctx, b, d) {
      const s = { ...brouillon(d) };
      delete s._verrou;
      const propre = Object.fromEntries(Object.entries(s).filter(([, v]) => v != null));
      const ok = await entreprendre(ctx, { styliser: { boite: d.t.id, _1: propre } }, "Nouvelle image");
      if (ok) delete brouillons[d.t.id];
    },
    async entImageOrigine(ctx, b, d) {
      delete brouillons[d.t.id];
      brouillons[d.t.id] = { ...STYLE_DEFAUT };
      await entreprendre(ctx, { styliser: { boite: d.t.id } }, "Image d'origine");
      delete brouillons[d.t.id];
    },
    // Grandir
    entGrandirTaille(ctx, b, d) { (grandirChoix[d.t.id] ??= { taille: "petit", achat: false }).taille = b.dataset.valeur; return ctx.rafraichir(); },
    entGrandirAchat(ctx, b, d) { (grandirChoix[d.t.id] ??= { taille: "petit", achat: false }).achat = b.dataset.valeur === "acheter"; return ctx.rafraichir(); },
    entGrandir(ctx, b, d) {
      const g = grandirChoix[d.t.id] ?? { taille: "petit", achat: false };
      confirmer(ctx, { titre: "Faire grandir ?", message: "Sa trésorerie paie d'abord ; ton compte, le reste.",
        choix: [{ texte: "Faire grandir", faire: (ctx) => entreprendre(ctx, { grandir: { boite: d.t.id, taille: g.taille, achat: g.achat } }, "Elle a grandi") }] });
    },
    entAgrandir(ctx, b, d) { return entreprendre(ctx, { agrandir: { boite: d.t.id } }, "Local agrandi"); },
    entFranchiser(ctx, b, d) { return entreprendre(ctx, { franchiser: { boite: d.t.id } }, "Une franchise de plus"); },
    entRemonter(ctx, b, d) { return entreprendre(ctx, { remonterHolding: { boite: d.t.id, _1: b.dataset.valeur === "oui" } }, b.dataset.valeur === "oui" ? "Son bénéfice remonte à la holding" : "Son bénéfice reste dans le groupe"); },
    entMere(ctx, b, d) {
      const possibles = possiblesMeres(d);
      confirmer(ctx, { titre: d.ligne?.mere != null ? "Changer de mère" : "Rattacher à…",
        message: "Son bénéfice remontera à sa mère, et elles se vendront ensemble.",
        choix: possibles.map((m) => ({ texte: esc(m.nom), genre: "secondaire", faire: (ctx) => entreprendre(ctx, { rattacher: { boite: d.t.id, mere: m.id } }, `Rattachée à ${m.nom}`) })) });
    },
    entDirect(ctx, b, d) { return entreprendre(ctx, { rattacher: { boite: d.t.id } }, "Détenue en direct"); },
    entRevendre(ctx, b, d) {
      confirmer(ctx, { titre: `Revendre ${d.t.nom} pour ${montant(d.t.valeur)} ?`, message: "Quelques jours de bénéfice selon la ville et la réputation, la moitié du matériel, le local et la trésorerie.",
        choix: [{ texte: `Vendre ${montant(d.t.valeur)}`, faire: async (ctx) => { if (await entreprendre(ctx, { revendre: { boite: d.t.id } }, `${d.t.nom} vendue`)) ctx.retour(); } }] });
    },
    entFermer(ctx, b, d) {
      confirmer(ctx, { titre: `Fermer ${d.t.nom} définitivement ?`, message: `Indemnités de licenciement : ${montant(d.t.fermeture.indemnites)}. Tu récupères ${montant(d.t.fermeture.rendu)}.`,
        choix: [{ texte: "Fermer la boîte", genre: "danger", faire: async (ctx) => { if (await entreprendre(ctx, { fermer: { boite: d.t.id } }, `${d.t.nom} fermée`)) ctx.retour(); } }] });
    },
  },
};
const grandirChoix = {};

function saisirPrix(ctx, t) {
  saisir(ctx, { titre: "Prix de vente", aide: "Plus cher : plus de marge, moins de clients", proposition: t.prix,
    valider: (v) => entreprendre(ctx, { prix: { boite: t.id, _1: v } }, `Prix fixé à ${montantC(v)}`) });
}

async function suivreConseil(ctx, cible, d) {
  ctx.fermerFeuille();
  if (cible === "equipe" || cible === "gestion") { rubriques[d.t.id] = "equipe"; return ctx.rafraichir(); }
  if (cible === "prix") return saisirPrix(ctx, d.t);
  if (cible === "marketing") return PAGE_BOITE.actions.entMarketing(ctx, null, d);
  if (["machines", "fournisseur", "gamme"].includes(cible)) { rubriques[d.t.id] = "vente"; return ctx.rafraichir(); }
}

/** RNT-140 : ce que dit chaque tuile, d'un coup d'œil. */
function etatRubrique(id, t, d) {
  const aRegler = t.controles.filter((c) => !c.enRegle).length;
  switch (id) {
    case "vente": return { texte: `${Math.round(t.utilisation * 100)} % de capacité` };
    case "equipe": return { texte: `${t.effectif} pers., moral ${Math.round(t.moral * 100)} %`, alerte: t.moral < 0.4 };
    case "argent": return { texte: montant(t.tresorerie), alerte: t.tresorerie < 0 };
    case "controles": return { texte: !t.controles.length ? "Aucun" : aRegler === 0 ? "En règle" : `${aRegler} à régler`, alerte: aRegler > 0 };
    case "image": return { texte: d.ligne?.style ? "Personnalisée" : "À ton goût" };
    default: return { texte: "Local, franchises, revente" };
  }
}

/** RNT-134 : l'argent de la boîte comme un relevé de la banque (ReleveBoite). */
function releve(t) {
  return papier(`${titrePapier("Relevé", "Le bénéfice tombe en temps réel")}
    ${champPapier("Semaine passée", t.beneficeSemainePassee != null ? variation(t.beneficeSemainePassee) : "—")}
    ${champPapier("Cette semaine", variation(t.semaineEnCours))}${champPapier("Dont aujourd'hui", variation(t.aujourdhui))}
    <div class="ent-entre"><span><div style="font-size:13px;color:#6B675F">${t.tresorerie >= 0 ? "Trésorerie" : "À découvert"}</div>
      <div style="font:700 24px/1.2 ui-serif,Georgia,serif;font-variant-numeric:tabular-nums;color:${t.tresorerie < 0 ? "#B23A2A" : "#1D1C1A"}">${montant(t.tresorerie)}</div></span>
      <button data-action="entVerser" ${t.tresorerie <= 0 ? "disabled" : ""} style="display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 16px;border-radius:99px;background:#1F7A4D;color:#fff;font-size:14px;font-weight:600">
        <span class="ent-ic" style="width:15px;height:15px">${G.telecharger}</span>Verser</button></div>
    <div class="encre2">${t.tresorerie > 0 ? "Verse-toi un salaire ou des dividendes pour toucher cet argent." : "Rien à verser tant que la caisse est vide."}</div>`);
}

/** RNT-114 : en perte, en difficulté, la renflouer (CarteDifficulte). */
function carteDifficulte(f) {
  if (!f) return "";
  return carte(`<div class="ent-carte-pad">
    <div class="ent-libelle-ic" style="color:${f.enDifficulte ? "var(--danger)" : "var(--alerte)"}"><span class="ent-ic" style="color:inherit">${f.enDifficulte ? G.alerte : G.baisse}</span>${esc(f.titre)}</div>
    <p class="aide">${esc(f.texte)}</p>
    <div class="ent-entre"><span><div class="legende" style="font-weight:400">Caisse</div><div class="chiffres ${f.tresorerie < 0 ? "perte" : ""}" style="font-size:15px">${montant(f.tresorerie)}</div></span>
      <span style="text-align:right"><div class="legende" style="font-weight:400">Charges par semaine</div><div class="chiffres" style="font-size:15px">${montant(f.charges)}</div></span></div>
    ${f.renflouement > 0 ? `<div>${petit(`Renflouer de ${montant(f.renflouement)}`, "entRenflouer", { plein: f.enDifficulte })}</div>` : ""}
  </div>`);
}

/** Un contrôle ou une grève : un avis sur papier, deux réponses. */
function avis(a) {
  return papier(`${titrePapier(a.titre, esc(a.texte))}
    ${a.effets.map((e) => `<div style="font-size:13px;font-weight:500">• ${esc(e)}</div>`).join("")}
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <button class="ent-encre" ${act("entRepondre", { alerte: a.id, accepter: "true" })}>${esc(a.accepter)}</button>
      <button class="ent-encre clair" ${act("entRepondre", { alerte: a.id, accepter: "false" })}>${esc(a.refuser)}</button></div>`, { empilee: false });
}

const ICONE_CONSEIL = { "eurosign.circle.fill": "argent", "flame.fill": "flamme", "person.badge.shield.checkmark.fill": "equipe", speedometer: "curseurs",
  "gearshape.2.fill": "engrenage", "person.fill.badge.plus": "personnePlus", "megaphone.fill": "megaphone", "shippingbox.fill": "carton",
  "arrow.up.right.circle.fill": "grandir", "arrow.down.right.circle.fill": "baisse", timer: "focus" };

/** Un conseil : une icône dans sa pastille, ce qu'il faut faire, pourquoi, et ce que ça rapporte (LigneConseil). */
function ligneConseil(c) {
  const teinte = c.sujet === "moral" ? "#F2A65A" : "#6FA8FF";
  const ic = G[ICONE_CONSEIL[c.icone]] ?? icones[ICONE_CONSEIL[c.icone]] ?? G.ampoule;
  const agit = c.cible !== "focus";
  const corps = `<span class="ent-conseil-ic" style="background:linear-gradient(${teinte},${teinte}cc)">${ic}</span>
    <span style="flex:1;min-width:0"><div class="t">${esc(c.titre)}</div><div class="d">${esc(c.detail)}</div><span class="ent-puce-effet">${esc(c.effet)}</span></span>
    ${agit ? `<span class="ch" style="align-self:center">${icones.chevron}</span>` : ""}`;
  return agit ? `<button class="ent-ligne" style="align-items:flex-start" ${act("entConseil", { cible: c.cible })}>${corps}</button>` : `<div class="ent-ligne" style="align-items:flex-start">${corps}</div>`;
}

function conseils(t) {
  if (!t.conseils?.length) return "";
  return sectionReglages("Conseil", ligneConseil(t.conseils[0]) + (t.conseils.length > 1
    ? ligneReglage({ icone: "ampoule", teinte: "var(--grandir)", titre: "Tous les conseils", detail: `${t.conseils.length} pistes, de la plus rentable à la moins`, action: "entTousConseils" }) : ""));
}

function pageRubrique(r, t, d) {
  switch (r) {
    case "vente": return activite(t) + reglages(t, d) + carteConcurrence(d.concurrence);
    case "equipe": return sectionReglages("Équipe", ligneReglage({ icone: "equipe", teinte: "var(--equipe)", titre: "L'équipe",
      detail: `${pluriel(t.effectif, "personne")}, ${montant(t.masse)} par semaine`, page: "equipe", p: { id: t.id } })) + carteDirection(d.direction);
    case "argent": return argent(t, d);
    case "controles":
      if (!t.controles.length) return `<p class="aide">Aucun contrôle ne concerne ce métier.</p>`;
      return sectionReglages("Contrôles", t.controles.map((c) => `<div class="ent-ligne">
        <span class="ent-ic ${c.enRegle ? "gain" : "alerte"}" style="width:20px;height:20px">${c.enRegle ? G.sceau : G.alerte}</span>
        <span class="t" style="flex:1;font-weight:500">${esc(c.nom)}</span><span style="font-size:13px;font-weight:500" class="${c.enRegle ? "t2" : "alerte"}">${esc(c.etat)}</span></div>`).join(""),
      "En règle, tu ne crains rien. Un avertissement ignoré rend les passages plus fréquents.");
    case "image": return personnalisation(t, d);
    default: return grandir(t, d) + carteGroupe(t, d) + revente(t);
  }
}

function activite(t) {
  const c = 2 * Math.PI * 25;
  const ecart = Math.round((t.moralVise - t.moral) * 100);
  return sectionReglages("Activité", `<div class="ent-ligne" style="gap:16px;padding:16px">
      <span class="ent-anneau"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="25" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7"/>
        <circle cx="29" cy="29" r="25" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${((1 - Math.max(0.01, t.utilisation)) * c).toFixed(1)}"/></svg>
        <b>${Math.round(t.utilisation * 100)} %</b></span>
      <span style="flex:1;min-width:0"><div class="aide">de la capacité utilisée hier</div>
        <div class="t" style="margin:2px 0">${Math.round(t.demandeJour)} ${esc(t.unite)} demandés par jour</div><div class="aide">${Math.round(t.servisJour)} servis à 4 h de focus</div></span></div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:8px">
      <div class="ent-entre"><span class="ent-libelle-ic"><span class="ent-ic">${G.sourire}</span>Moral</span>
        <span class="chiffres ${t.moral < 0.4 ? "alerte" : ""}" style="font-size:15px">${Math.round(t.moral * 100)} %</span></div>
      ${rail(t.moral)}
      <div class="aide">${Math.abs(ecart) < 2 ? "Stable, avec ces réglages." : `Tend vers ${Math.round(t.moralVise * 100)} % (${ecart > 0 ? "+" : ""}${ecart} pts), avec ces réglages.`}</div></div>`);
}

function reglages(t, d) {
  const B = d.B;
  const prime = t.primesAssurance[Math.min(t.assurance, t.primesAssurance.length - 1)] ?? 0;
  let h = `<div style="padding:16px;display:flex;flex-direction:column;gap:10px"><div class="legende" style="font-size:13px;font-weight:600">Gamme</div>${choixGamme(B.gammes, t.gamme, "entGamme")}</div>
    ${ligneReglage({ icone: "etiquette", teinte: "var(--vente)", titre: `Prix par ${esc(t.uniteSingulier)}`, detail: `Marché : ${montantC(t.prixMarche)}`, valeur: montantC(t.prix), action: "entPrix" })}
    ${ligneInterrupteur({ icone: "curseurs", titre: "Gérer en détail", detail: `${t.gainDetail >= 0 ? "+" : "−"}${Math.round(Math.abs(t.gainDetail * 100))} % par rapport au pilote, avec ces réglages`, oui: t.detail, action: "entDetail" })}`;
  if (t.detail) {
    h += `${ligneReglage({ icone: "megaphone", teinte: "var(--vente)", titre: "Marketing", detail: "Par semaine, effet décroissant", valeur: montant(t.marketing), action: "entMarketing" })}
      <div class="ent-ligne"><span class="ent-ic" style="width:20px;height:20px;color:var(--accent)">${G.engrenage}</span>
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px"><span class="t">Machines</span>
          <span class="ent-machines">${Array.from({ length: t.machinesMax }, (_, i) => `<i class="${i < t.machines ? "oui" : ""}"></i>`).join("")}</span>
          <span class="legende" style="font-weight:400">+12 % de production par niveau</span></span>
        ${t.coutMachines != null ? petit(montant(t.coutMachines), "entMachines", { plein: true }) : ""}</div>
      <div style="padding:13px 16px;display:flex;flex-direction:column;gap:4px">
        <span class="ent-libelle-ic"><span class="ent-ic">${G.carton}</span>Fournisseur</span>
        ${t.fournisseurs.map((f) => `<button style="display:flex;gap:12px;align-items:center;padding:8px 0;text-align:left" ${act("entFournisseur", { fournisseur: f.id })} aria-pressed="${f.id === t.fournisseur}">
          ${radio(f.id === t.fournisseur)}<span><div style="font-size:15px;font-weight:500">${esc(f.nom)}</div><div class="legende" style="font-weight:400">${esc(f.detail)}</div></span></button>`).join("")}
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <div class="ent-entre"><span class="ent-libelle-ic"><span class="ent-ic">${icones.bouclier}</span>Assurance</span><span class="t2 ent-mono" style="font-size:14px">${montant(prime)} / sem.</span></div>
        ${segment(t.primesAssurance.map((_, i) => [String(i), NIVEAUX_ASSURANCE[Math.min(i, 3)]]), String(t.assurance), "entAssurance")}
      </div>`;
  }
  return sectionReglages("Réglages", h, t.detail ? "" : "En pilote automatique, la boîte tourne seule ; en détail, tu règles marketing, machines, fournisseur et assurance.");
}

/** RNT-113 : les concurrents de la ville et la guerre des prix (CarteConcurrence). */
function carteConcurrence(c) {
  if (!c) return "";
  return carte(`<div class="ent-carte-pad">
    <div class="ent-libelle-ic"><span class="ent-ic">${icones.amis}</span>Concurrence</div>
    <div style="font-size:15px;font-weight:600;color:${c.facteur < 0.95 ? "var(--alerte)" : c.facteur > 1.005 ? "var(--gain)" : "var(--texte)"}">${esc(c.titre)}</div>
    ${c.lignes.length ? `<div class="ent-lignes">${c.lignes.map((l) => `<div class="ent-entre" style="padding:8px 0">
      <span style="min-width:0"><div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.nom)}</div><div class="legende" style="font-weight:400">${esc(l.origine)}</div></span>
      <span style="font-size:13px;font-weight:600;white-space:nowrap" class="${l.moinsCher ? "alerte" : "t2"}">${esc(l.prix)}</span></div>`).join("")}</div>` : ""}
    <p class="aide">${esc(c.tonPrix)}. Moins cher, tu leur prends des clients, mais ta marge fond ; les concurrents suivent en partie.</p>
    ${c.essais.length ? `<div class="ent-essais">${c.essais.map((x) => `<button class="ent-essai" ${act("entPrixEssai", { prix: x.prix })}
        aria-label="Prix ${pct(x.variation, { signe: true })} : ${pct(x.clients, { signe: true })} de clients, bénéfice ${variation(x.benefice)} par jour">
        <span class="chiffres" style="font-size:14px;font-weight:700">${pct(x.variation, { signe: true })}</span>
        <span class="legende ent-mono" style="font-size:11px;font-weight:400">${pct(x.clients, { signe: true })} clients</span>
        <span class="ent-mono ${x.benefice >= 0 ? "gain" : "perte"}" style="font-size:11px;font-weight:600">${variation(x.benefice)}/j</span></button>`).join("")}</div>
      <p class="aide">Essai à blanc, boîte rodée et 4 h de focus. Touche un prix pour l'appliquer.</p>` : ""}
  </div>`);
}

/** RNT-111 : le gérant et les employés clés (CarteDirection). */
function carteDirection(t) {
  if (!t) return "";
  const ligneCle = (c) => `<button class="ent-entre" style="padding:4px 0;text-align:left;width:100%" ${act("entCle", { cle: c.id })}>
    <span class="ent-initiales ${c.gerant ? "g" : ""}">${esc(c.nom.split(" ").slice(0, 2).map((m) => m[0]).join(""))}</span>
    <span style="flex:1;min-width:0"><div style="font-size:15px;font-weight:600;display:flex;gap:6px;align-items:center">${esc(c.nom)}${c.froisse ? `<span class="alerte ent-ic" style="width:12px;height:12px" title="Froissé par un refus">${G.alerte}</span>` : ""}</div>
      <div class="aide">${c.gerant ? "Gérant" : "Employé clé"}, ${esc(c.talent.toLowerCase())} : ${esc(c.effet)}</div></span>
    <span style="text-align:right;display:flex;flex-direction:column;gap:4px;align-items:flex-end"><span class="ent-niveau">${[0, 1, 2].map((i) => `<i class="${i < c.niveau ? "oui" : ""}"></i>`).join("")}</span>
      <span class="legende ent-mono">${montant(c.salaire)}/sem.</span></span></button>`;
  let corps;
  if (!t.possible) corps = `<p class="aide">Une micro-entreprise, c'est toi seul. Fais-la grandir pour lui donner un gérant.</p>`;
  else {
    corps = `${t.gerant ? ligneCle(t.gerant) : `<p class="aide">Pas de gérant. Un bon gérant apporte son talent une fois et demie.</p>`}
      ${t.cles.map((c) => `<div class="ent-filet"></div>${ligneCle(c)}`).join("")}
      ${t.gerant == null || t.clesMax - t.cles.length > 0 ? `<div>${petit(`${icones.amis.replace("<svg", '<svg width="15" height="15"')} ${t.candidats.length ? `Recruter, ${pluriel(t.candidats.length, "candidat")}` : "Plus de candidat cette semaine"}`, "entRecruter", { plein: t.candidats.length > 0, desactive: !t.candidats.length })}</div>` : ""}
      <p class="aide">Ils peuvent demander une augmentation ou être approchés par un concurrent : la question arrive sous la cloche.</p>`;
  }
  return carte(`<div class="ent-carte-pad">
    <div class="ent-entre"><span class="ent-libelle-ic"><span class="ent-ic">${icones.document}</span>Direction</span>
      ${t.masse > 0 ? `<span class="legende ent-mono" style="font-size:13px">${montant(t.masse)}/sem.</span>` : ""}</div>${corps}</div>`);
}

/** Les candidats de la semaine, sur papier : gérant ou employé clé (FeuilleRecrutement). */
async function feuilleRecrutement(ctx, id) {
  const rendu = () => {
    const t = recrutement;
    if (!t) return vide("Plus rien à voir.");
    const placeGerant = t.gerant == null, placesCles = Math.max(0, t.clesMax - t.cles.length);
    return `<p class="aide">Deux ou trois candidats par semaine ; la liste change lundi. La prime d'arrivée sort de la trésorerie de la boîte, puis de ton compte.</p>
      ${!t.candidats.length ? `<p class="aide">Tous engagés. Reviens lundi.</p>` : ""}
      ${t.candidats.map((c) => papier(`${titrePapier(c.nom, `${esc(c.talent)}, niveau ${c.niveau} sur 3`)}
        ${placeGerant ? champPapier(`Gérant : ${c.effetGerant}`, `${montant(c.salaireGerant)}/sem.`) : ""}
        ${placesCles > 0 ? champPapier(`Employé clé : ${c.effet}`, `${montant(c.salaire)}/sem.`) : ""}
        <div style="display:flex;gap:10px;align-items:center">${placeGerant ? `<button class="ent-encre" ${act("entEngagerCle", { candidat: c.id, gerant: "true", nom: c.nom })}>Nommer gérant</button>` : ""}
          ${placesCles > 0 ? `<button class="ent-encre clair" style="color:#1D1C1A" ${act("entEngagerCle", { candidat: c.id, gerant: "false", nom: c.nom })}>Employé clé</button>` : ""}</div>`, { empilee: false })).join("")}
      ${!placeGerant && placesCles === 0 ? `<p class="aide">La direction est au complet : un gérant et ${t.clesMax} employés clés.</p>` : ""}`;
  };
  let recrutement = await ctx.tableau("direction", { id });
  ctx.feuille({ titre: "Recrutement", rendu, actions: {
    async entEngagerCle(ctx, b) {
      const gerant = b.dataset.gerant === "true";
      await ctx.decider("entreprises", { recruterCle: { boite: id, candidat: b.dataset.candidat, gerant } }, { succes: gerant ? `${b.dataset.nom} dirige la boîte` : `${b.dataset.nom} rejoint la boîte` });
    } } });
}

function argent(t, d) {
  const capital = `<div style="padding:16px;display:flex;flex-direction:column;gap:10px">
    <div class="ent-entre"><span class="t2" style="font-size:14px">Ton capital</span><span class="chiffres" style="font-size:15px">${pct(t.partJoueur)}</span></div>
    ${t.partJoueur < 1 ? `<p class="aide">Des investisseurs ont ${pct(1 - t.partJoueur)} : ils touchent leur part des dividendes et de la revente.</p>` : ""}
    ${t.levees.length || t.prixRachat != null ? `<div style="display:flex;gap:10px;flex-wrap:wrap">${t.levees.length ? petit(`${icones.amis.replace("<svg", '<svg width="15" height="15"')} Lever des fonds`, "entLever") : ""}
      ${t.prixRachat != null ? petit(`Racheter, ${montant(t.prixRachat)}`, "entRacheter") : ""}</div>` : ""}</div>`;
  const local = `<div style="padding:16px;display:flex;flex-direction:column;gap:10px">
    <div class="ent-entre"><span class="t2" style="font-size:14px">Local</span><span style="font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.localActuel ?? "Celui d'origine")}</span></div>
    ${!t.locaux.length ? `<p class="aide">Aucun bureau, commerce, entrepôt ou loft dans cette ville pour l'instant.</p>`
      : `<div>${petit(`${G.immeuble.replace("<svg", '<svg width="15" height="15"')} Changer de local`, "entLocal")}</div>
        ${!t.surPlace ? `<p class="aide">Louer un local se signe sur place : va dans la ville de la boîte (Accueil, Monde). Un bien à toi s'occupe d'ici.</p>` : ""}`}</div>`;
  const caisse = `<div style="padding:13px 16px;display:flex;flex-direction:column;gap:8px">
    <div class="ent-entre"><span class="ent-libelle-ic"><span class="ent-ic" style="${t.caisseNoire > 0 ? "color:var(--alerte)" : ""}">${G.oeil}</span>Caisse noire</span>
      <button data-action="entCaisseNoire" style="font-size:14px;font-weight:600" class="${t.caisseNoire > 0 ? "alerte" : "t2"}">${t.caisseNoire === 0 ? "Rien de caché" : `${pct(t.caisseNoire)} caché`} ›</button></div>
    ${t.caisseNoire > 0 ? `<p class="aide">Chaque dimanche, cette part du bénéfice sort en liquide, sans impôt, dans ton argent sale. Un contrôle fiscal réclame tout, avec une amende.</p>` : ""}</div>`;
  return sectionReglages("L'argent de la boîte", `
    ${ligneReglage({ icone: "telecharger", teinte: "var(--argent)", titre: "Te verser un salaire ou des dividendes", detail: "Depuis sa trésorerie", action: t.tresorerie > 0 ? "entVerser" : "" })}
    ${ligneInterrupteur({ icone: "immeuble", teinte: "var(--argent)", titre: "Rattachée à la holding", detail: "Paie avec tes autres boîtes les achats « Holding » et les versements groupés.", oui: d.ligne?.dansHolding, action: "entHolding" })}
    ${ligneReglage({ icone: "televerser", teinte: "var(--argent)", titre: "Injecter de l'argent", detail: "Depuis ton compte", action: "entInjecter" })}
    ${capital}${local}${caisse}`);
}

// RNT-141 : personnaliser l'image d'une boîte (PersonnalisationBoite).
const CATALOGUE = {
  forme: [["plaque", "Plaque", 0], ["capsule", "Capsule", 0], ["rond", "Médaillon", 1], ["ecusson", "Écusson", 1], ["carre", "Carrée", 0], ["arche", "Arche", 2], ["ovale", "Ovale", 2], ["losange", "Pointes", 3]],
  embleme: [["metier", "Le métier", 0], ["initiales", "Initiales", 0], ["cup.and.saucer.fill", "Tasse", 0], ["scissors", "Ciseaux", 0], ["hammer.fill", "Marteau", 0], ["sun.max.fill", "Soleil", 0],
    ["star.fill", "Étoile", 1], ["leaf.fill", "Feuille", 1], ["bolt.fill", "Éclair", 1], ["heart.fill", "Cœur", 1], ["pawprint.fill", "Patte", 1], ["crown.fill", "Couronne", 2],
    ["flame.fill", "Flamme", 2], ["bird.fill", "Oiseau", 2], ["globe.europe.africa.fill", "Globe", 2], ["diamond.fill", "Diamant", 3], ["moon.stars.fill", "Lune", 3], ["trophy.fill", "Trophée", 3], ["sparkles", "Éclats", 3]],
  typo: [["classique", "Classique", 0], ["moderne", "Moderne", 0], ["etroit", "Étroite", 0], ["rond", "Ronde", 1], ["italique", "Italique", 1], ["machine", "Machine", 2], ["large", "Large", 3]],
  facade: [["anthracite", "Anthracite", 0], ["brique", "Brique", 0], ["pierre", "Pierre", 0], ["creme", "Crème", 0], ["bois", "Bois", 1], ["beton", "Béton", 1], ["laque", "Laque noire", 2], ["verre", "Verre", 2], ["cuivre", "Cuivre", 3], ["marbre", "Marbre", 3]],
  motif: [["rayures", "Rayures", 0], ["uni", "Uni", 0], ["fines", "Fines rayures", 0], ["larges", "Larges bandes", 1], ["vagues", "Vagues", 2], ["degrade", "Dégradé", 3]],
  ambiance: [["simple", "Simple", 0], ["cosy", "Cosy", 0], ["minimal", "Minimal", 0], ["industriel", "Industriel", 1], ["nature", "Nature", 1], ["boheme", "Bohème", 1], ["retro", "Rétro", 2], ["tropical", "Tropical", 2], ["futuriste", "Futuriste", 3], ["luxe", "Luxe", 3]],
};
const COULEURS_IMAGE = ["#0D0E11", "#F4E9D3", "#FFFFFF", "#1F2A44", "#3E7BD9", "#6FC3E8", "#2F5D3A", "#4FA36B", "#7A1F2B", "#D8504A", "#F0954A", "#F0C24A", "#C9A15B", "#8A5CF0", "#E76FA3", "#6B6E72"];
const condition = (n) => ({ 1: "Réputation 3 étoiles", 2: "Réputation 4 étoiles ou un local de taille moyenne", 3: "Réputation 4,5 étoiles et une franchise ou un grand local" })[n] ?? "Libre";

/** Le niveau d'image (niveauStyle) : réputation et taille du local ; les franchises ne sont pas exposées. */
function niveauImage(d) {
  const t = d.t, B = d.B;
  const nomTaille = (t.sousTitre.match(/local (\S+)/)?.[1] ?? "").toLowerCase();
  const rangTaille = Math.max(0, B.tailles.findIndex((x) => x.nom.toLowerCase() === nomTaille));
  if (t.reputation >= 4.5 && rangTaille >= 2) return 3;
  if (t.reputation >= 4 || rangTaille >= 1) return 2;
  if (t.reputation >= 3) return 1;
  return 0;
}
const brouillon = (d) => (brouillons[d.t.id] ??= { ...STYLE_DEFAUT, ...(d.ligne?.style ?? {}), _verrou: null });

function personnalisation(t, d) {
  const s = brouillon(d);
  const niveau = niveauImage(d);
  const enregistre = { ...STYLE_DEFAUT, ...(d.ligne?.style ?? {}) };
  const change = Object.keys(STYLE_DEFAUT).some((k) => (s[k] ?? null) !== (enregistre[k] ?? null));
  const rangee = (titre, cle, choisie, icones2 = false) => `<div style="display:flex;flex-direction:column;gap:8px"><div class="legende" style="font-size:13px;font-weight:600">${titre}</div>
    <div class="ent-defile" style="margin:0 -14px;padding:0 14px">${CATALOGUE[cle].map(([id, nom, n]) => {
      const ferme = n > niveau;
      const ic = ferme ? icones.verrou : icones2 && id !== "metier" && id !== "initiales" ? (G[ICONE_EMBLEME[id]] ?? "") : "";
      return `<button class="ent-pilule image ${ferme ? "ferme" : ""}" aria-pressed="${id === choisie}" ${act("entStyle", { cle, valeur: id, niveau: n })}>${ic}${esc(nom)}</button>`;
    }).join("")}</div></div>`;
  const nuancier = (titre, cle, choisie, aucun = "Origine") => `<div style="display:flex;flex-direction:column;gap:8px"><div class="legende" style="font-size:13px;font-weight:600">${titre}</div>
    <div class="ent-couleurs" style="align-items:center">${pilule(aucun, "entStyle", choisie == null, { cle, valeur: "" }, "image petite")}
      ${COULEURS_IMAGE.map((c) => `<button class="ent-couleur" style="background:${c};width:30px;height:30px" aria-label="Couleur ${c}" aria-pressed="${choisie === c}" ${act("entStyle", { cle, valeur: c })}></button>`).join("")}</div></div>`;
  const bascule = (titre, cle, oui, n) => `<div class="ent-entre"><span class="ent-libelle-ic" style="font-weight:500"><span class="ent-ic" style="color:var(--image)">${n > niveau ? icones.verrou : cle === "plantes" ? G.feuille : cle === "fanions" ? G.fanion : G.ampoule}</span>${titre}</span>
    ${interrupteur(oui, "entStyle", { cle, niveau: n }, titre)}</div>`;
  const groupe = (titre, contenu) => `<div><div class="ent-sec">${titre}</div>${carte(`<div class="ent-carte-pad" style="padding:14px;gap:14px">${contenu}</div>`)}</div>`;
  return `${devanture({ nom: t.nom, secteur: t.secteurID, famille: t.famille, couleur: t.couleur, style: s, grande: true })}
    <div style="display:flex;gap:8px;align-items:flex-start"><span class="ent-ic" style="color:var(--image)">${G.eclats}</span>
      <p class="aide">Image niveau ${niveau} sur 3. Purement esthétique, gratuit ; les autres joueurs voient ta devanture.</p></div>
    ${groupe("Enseigne", rangee("Forme", "forme", s.forme) + rangee("Emblème", "embleme", s.embleme ?? "metier", true) + rangee("Typographie", "typo", s.typo)
      + nuancier("Fond", "fondEnseigne", s.fondEnseigne) + nuancier("Lettres", "texteEnseigne", s.texteEnseigne))}
    ${groupe("Façade", rangee("Matière", "facade", s.facade) + rangee("Store", "motif", s.motif)
      + `<div style="display:flex;flex-direction:column;gap:8px"><div class="legende" style="font-size:13px;font-weight:600">Couleur du store</div>${choixCouleur(t.famille, t.couleur, "entCouleurStore")}</div>`
      + bascule("Guirlande lumineuse", "lumieres", s.lumieres, 1))}
    ${groupe("Décor", bascule("Jardinières", "plantes", !!s.plantes, 0) + bascule("Fanions sur le store", "fanions", !!s.fanions, 2))}
    ${groupe("Intérieur", rangee("Ambiance", "ambiance", s.ambiance))}
    ${groupe("Équipe", niveau < 1 ? `<p class="aide">Uniformes : ${condition(1).toLowerCase()}</p>` : nuancier("Uniformes", "uniforme", s.uniforme, "Aucun"))}
    ${s._verrou ? `<div class="alerte" style="font-size:13px;font-weight:500;display:flex;gap:6px;align-items:center"><span class="ent-ic" style="width:13px;height:13px">${icones.verrou}</span>Se débloque avec : ${esc(s._verrou.toLowerCase())}</div>` : ""}
    ${bouton("Enregistrer l'image", "entEnregistrerImage", { genre: "teinte", teinte: "var(--image)", desactive: !change })}
    ${d.ligne?.style || change ? bouton("Revenir à l'image d'origine", "entImageOrigine", { genre: "discret" }) : ""}`;
}

function possiblesMeres(d) {
  const toutes = d.liste?.boites ?? [];
  const id = d.t.id;
  const descend = (x) => { let m = x.mere, n = 0; while (m != null && n < 20) { if (m === id) return true; m = toutes.find((b) => b.id === m)?.mere; n++; } return false; };
  return toutes.filter((b) => b.id !== id && !descend(b));
}

/** Micro : grandir ; vraie boîte : agrandir le local et franchiser (le devis n'est pas exposé par le moteur). */
function grandir(t, d) {
  const s = secteur(d.B, t.secteurID);
  if (estMicro(s)) {
    const g = grandirChoix[t.id] ?? { taille: "petit", achat: false };
    const evol = s.evolution ? secteur(d.B, s.evolution) : null;
    return carte(`<div class="ent-carte-pad">
      <div class="ent-libelle-ic"><span class="ent-ic">${G.grandir}</span>Faire grandir</div>
      <p class="aide">Elle passe d'abord par des paliers (plus de clients, plus de production, toujours sans loyer), puis devient ${esc((evol?.nom ?? "une vraie boîte").toLowerCase())} : un vrai local et une équipe. Elle garde son nom, sa réputation et sa caisse.</p>
      ${segment(d.B.tailles.map((x) => [x.id, x.nom]), g.taille, "entGrandirTaille")}
      ${segment([["louer", "Louer le local"], ["acheter", "Acheter le local"]], g.achat ? "acheter" : "louer", "entGrandirAchat")}
      <p class="aide">La taille et le local comptent quand elle devient une vraie boîte. Sa trésorerie paie d'abord, ton compte le reste.</p>
      <div>${petit("Faire grandir", "entGrandir", { plein: true })}</div></div>`);
  }
  const fr = d.B.franchise;
  return carte(`<div class="ent-carte-pad">
    <div class="ent-libelle-ic"><span class="ent-ic">${icones.marches}</span>Développer</div>
    <div class="ent-entre-haut"><span><div style="font-size:15px;font-weight:600">Un plus grand local</div>
      <div class="aide">Plus de places et de machines. Les clients, eux, viennent de ta gamme.</div></span>${petit("Agrandir", "entAgrandir", { plein: true })}</div>
    <div class="ent-filet"></div>
    <div class="ent-entre-haut"><span><div style="font-size:15px;font-weight:600">Franchises</div>
      <div class="aide">Un franchisé exploite ta marque ailleurs et te reverse ${pct(fr?.redevance ?? 0.06)} de ses ventes, sans faire baisser les tiennes. Dès ${virgule(fr?.reputationMinimum ?? 3.5)} étoiles et ${fr?.ageMinimum ?? 9} jours d'activité.</div></span>
      ${petit("Franchiser", "entFranchiser", { plein: t.reputation >= (fr?.reputationMinimum ?? 3.5) })}</div>
    <p class="aide">Payé par sa trésorerie d'abord, puis ton compte.</p></div>`);
}

/** D129 : sa mère, ses succursales et filiales, et ce qui remonte (CarteGroupe). */
function carteGroupe(t, d) {
  const toutes = d.liste?.boites ?? [];
  const b = d.ligne;
  if (!b) return "";
  const mere = b.mere != null ? toutes.find((x) => x.id === b.mere) : null;
  const filles = toutes.filter((x) => x.mere === b.id);
  const possibles = possiblesMeres(d);
  return carte(`<div class="ent-carte-pad">
    <div class="ent-libelle-ic"><span class="ent-ic">${icones.fleches}</span>Groupe</div>
    ${mere ? `<p class="aide">${b.secteurID === mere.secteurID ? "Succursale" : "Filiale"} de ${esc(mere.nom)} : son bénéfice de chaque semaine remonte dans la caisse de ${esc(mere.nom)}. Revendre ${esc(mere.nom)} l'emporte avec elle.</p>`
      : !filles.length ? `<p class="aide">Détenue en direct. Rattache-la à une de tes boîtes : son bénéfice remontera à sa mère, et elles se vendront ensemble.</p>` : ""}
    ${filles.length ? `<div>${filles.map((f) => `<div style="font-size:14px;font-weight:500">${f.secteurID === b.secteurID ? "Succursale" : "Filiale"} : ${esc(f.nom)}</div>`).join("")}</div>
      <div><div class="libelle">Remonter à la holding</div><p class="aide">Chaque semaine, son bénéfice (et celui de ses filles) part dans la caisse de ta holding.</p></div>
      <div style="display:flex;gap:10px">${petit("Remonter", "entRemonter", { donnees: { valeur: "oui" } })}${petit("Garder dans le groupe", "entRemonter", { donnees: { valeur: "non" } })}</div>` : ""}
    ${possibles.length || mere ? `<div style="display:flex;gap:10px;flex-wrap:wrap">${possibles.length ? petit(mere ? "Changer de mère…" : "Rattacher à…", "entMere") : ""}${mere ? petit("Détenir en direct", "entDirect") : ""}</div>` : ""}
  </div>`);
}

function revente(t) {
  return sectionReglages("Revente", `${ligneReglage({ icone: "colonnes", teinte: "var(--grandir)", titre: t.partJoueur < 1 ? "Revendre ta part" : "Revendre la boîte", valeur: montant(t.valeur), action: "entRevendre" })}
    <button class="ent-ligne" data-action="entFermer"><span class="ent-ic perte" style="width:20px;height:20px">${G.octogone}</span><span class="t perte">Fermer la boîte</span></button>`,
  "Quelques jours de bénéfice selon la ville et la réputation, la moitié du matériel, le local et la trésorerie.");
}

// MARK: - Te verser (FeuilleVerser)

/**
 * RNT-173 : « un montant, un bouton », comme sur l'iPhone. Le montant (saisi, ou 25 %, 50 %, Tout),
 * le meilleur partage entre salaire et dividendes cherché par le moteur, une seule ligne nette
 * « Il te reste » (avec son aide repliable), « Changer le partage » replié (un curseur), un bouton,
 * puis un reçu qui montre qui a payé quoi. Tout vient du tableau « verser » ; le partage entre
 * boîtes (selon la caisse) est automatique. Pendant qu'on glisse ou tape, seuls les chiffres bougent.
 */
const STYLE_VERSER = `<style>
  .v-gros{width:100%;text-align:center;font-size:46px;font-weight:700;letter-spacing:-.5px;background:none;border:0;color:var(--texte);
    font-variant-numeric:tabular-nums;padding:6px 0;border-radius:16px;outline:none}
  .v-gros:focus{background:var(--puce)}
  .v-zone{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
  .v-zone .choix{justify-content:center}
  .v-ligne{display:flex;align-items:center;gap:8px;padding:13px 16px;min-height:48px;width:100%;text-align:left;color:var(--texte)}
  .v-ligne + .v-ligne,.v-ligne + .v-aide,.v-aide + .v-ligne,#v-chiffres + .v-ligne,.v-curseur{border-top:1px solid var(--filet)}
  .v-ligne .v-v{margin-left:auto;font-weight:600;font-variant-numeric:tabular-nums}
  .v-net{margin-left:auto;font-size:18px;font-weight:700;color:var(--argent);font-variant-numeric:tabular-nums}
  .v-info{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--texte2);color:var(--texte2);font-size:11px;font-weight:700;display:inline-grid;place-items:center}
  .v-aide{padding:0 16px 12px;font-size:13px;color:var(--texte2)}
  .v-chev{margin-left:auto;transition:transform .2s;color:var(--texte2)}
  .v-ouvert .v-chev{transform:rotate(180deg)}
  .v-curseur{padding:12px 16px 14px;display:flex;flex-direction:column;gap:8px}
  .v-retour{min-height:44px;border-radius:14px;color:var(--argent);background:color-mix(in srgb,var(--argent) 12%,transparent);font-weight:600;font-size:14px}
  .v-recu{background:#F1EEE7;color:#1D1C1A;border-radius:10px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 6px 20px rgba(0,0,0,.35)}
  .v-recu h3{font:600 20px ui-serif,Georgia,serif}
  .v-recu .s{font-size:12px;color:#6B675F}
  .v-champ{display:flex;justify-content:space-between;gap:8px;align-items:baseline;padding-bottom:7px;border-bottom:1px solid rgba(29,28,26,.12);font-size:13px;color:#6B675F}
  .v-champ b{color:#1D1C1A;font-size:14px;font-variant-numeric:tabular-nums}
  .v-champ.fort b{font-size:17px}
</style>`;

const SANS_VERSEMENT = "Rien à verser pour l'instant : la caisse garde sa semaine de charges.";

function feuilleVerser(ctx, { boite }) {
  const v = { total: null, salaire: null, t: null, jeton: 0, minuterie: null, aide: false, partage: false, recu: null, enCours: false };
  const params = () => ({ ...(boite != null ? { boite } : {}), ...(v.total != null ? { total: v.total } : {}), ...(v.salaire != null ? { salaire: v.salaire } : {}) });
  const d = () => document.getElementById("feuille");
  const q = (s) => d()?.querySelector(s);

  async function charger() {
    const j = ++v.jeton;
    const t = await ctx.tableau("verser", params());
    if (j !== v.jeton) return;
    v.t = t;
    if (!q("#v-dyn")) return ctx.feuille(spec);
    maj();
  }
  const plusTard = (ms = 250) => { clearTimeout(v.minuterie); v.minuterie = setTimeout(charger, ms); };

  /** Salaire, dividendes, « Il te reste » et son aide : redessinés à chaque calcul. */
  function htmlChiffres() {
    const t = v.t, p = t?.partage;
    if (!p) return "";
    return `<div class="v-ligne"><span>Salaire</span><span class="v-v" id="v-sal">${montant(p.salaire)}</span></div>
      <div class="v-ligne"><span>Dividendes</span><span class="v-v" id="v-div">${montant(p.dividendes)}</span></div>
      <button class="v-ligne" data-action="vAide" aria-expanded="${v.aide}"><b style="font-weight:600">Il te reste</b><span class="v-info" aria-hidden="true">i</span>
        <span class="v-net" id="v-net">${montant(p.net)} net</span></button>
      ${v.aide ? `<div class="v-aide" id="v-aide">${esc(t.aideNet)}</div>` : ""}`;
  }

  /** Le curseur du partage : dessiné à l'ouverture seulement (un redessin couperait le glissé). */
  function htmlCurseur() {
    const t = v.t, p = t?.partage;
    if (!v.partage || !p) return "";
    return `<div class="v-curseur">
      <input type="range" class="ent-range" id="v-part" min="0" max="${Math.max(1, t.total)}" step="100" value="${p.salaire}" data-saisie="vPart" aria-label="Part en salaire">
      <div class="rangee entre"><span class="aide">Tout en dividendes</span><span class="aide">Tout en salaire</span></div>
      <div id="v-retour">${htmlRetour()}</div></div>`;
  }
  function htmlRetour() {
    const t = v.t;
    if (!t || t.auMeilleur || !t.meilleur || !t.partage) return "";
    return `<button class="v-retour" data-action="vMeilleur" style="width:100%">Revenir au meilleur partage, +${montant(t.meilleur.net - t.partage.net)}</button>`;
  }

  function htmlPartage() {
    const t = v.t;
    if (!t || t.maximum <= 0 || !t.partage) return "";
    return `<div class="libelle" id="v-titre-partage">${t.auMeilleur ? "Le meilleur partage" : "Ton partage"}</div>
      ${carte(`<div id="v-chiffres">${htmlChiffres()}</div>
        <button class="v-ligne ${v.partage ? "v-ouvert" : ""}" data-action="vChanger" aria-expanded="${v.partage}"><span class="t2">Changer le partage</span>
          <svg class="v-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
        <div id="v-curseur-zone">${htmlCurseur()}</div>`)}`;
  }

  /** Les chiffres qui bougent, sans toucher au champ du montant ni au curseur qu'on tient. */
  function maj() {
    const t = v.t;
    if (!t || !q("#v-dyn")) return;
    const champ = q("#v-montant");
    if (champ && document.activeElement !== champ) champ.value = montant(t.total);
    q("#v-max").textContent = t.maximum > 0 ? t.aideMaximum : SANS_VERSEMENT;
    d().querySelectorAll("[data-action=vPastille]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.m) > 0 && Number(b.dataset.m) === t.total)));
    if (!q("#v-chiffres") || !t.partage) q("#v-dyn").innerHTML = htmlPartage();
    else {
      q("#v-chiffres").innerHTML = htmlChiffres();
      q("#v-titre-partage").textContent = t.auMeilleur ? "Le meilleur partage" : "Ton partage";
      const s = q("#v-part");
      if (s) { s.max = Math.max(1, t.total); if (document.activeElement !== s) s.value = t.partage.salaire; }
      if (q("#v-retour")) q("#v-retour").innerHTML = htmlRetour();
    }
    q("#v-refus").innerHTML = t.refus ? `<p class="perte" style="font-weight:500;font-size:13px">${esc(t.refus)}</p>` : "";
    const ok = q("[data-action=vVerser]");
    ok.textContent = v.enCours ? "Versement…" : `Verser ${montant(t.total)}`;
    ok.disabled = v.enCours || !t.partage || t.total <= 0;
  }

  function htmlRecu() {
    const r = v.recu;
    const detail = (p) => [p.salaire > 0 ? `salaire ${montant(p.salaire)}` : "", p.dividende > 0 ? `dividendes ${montant(p.dividende)}` : "",
      p.partJoueur < 1 && p.dividende > 0 ? `dont ${montant(p.dividende - Math.round(p.dividende * p.partJoueur))} aux investisseurs` : ""].filter(Boolean).join(", ");
    return `${STYLE_VERSER}<div class="v-recu" id="v-recu">
        <div><h3>Versement</h3><div class="s">${esc(r.titre)}</div></div>
        ${r.lignes.map((p) => `<div><div class="v-champ"><span>${esc(p.nom)}</span><b>${montant(p.salaire + p.dividende)}</b></div><div class="s" style="font-size:11px;margin-top:3px">${esc(detail(p))}</div></div>`).join("")}
        <div class="v-champ"><span>Sur ton compte, tout de suite</span><b>${montant(r.enPoche)}</b></div>
        <div class="v-champ fort"><span>Il te reste, net</span><b>${montant(r.net)}</b></div>
      </div>
      ${bouton("Fermer", "fermerFeuille", { genre: "teinte", teinte: "var(--argent)" })}`;
  }

  const spec = {
    titre: "Te verser",
    rendu: () => {
      if (v.recu) return htmlRecu();
      const t = v.t;
      if (!t) return `${STYLE_VERSER}<div class="squelette" style="height:120px"></div>`;
      return `${STYLE_VERSER}
      <p class="aide" style="margin-top:-8px">${esc(t.titre)}</p>
      <div class="v-zone">
        <input class="v-gros" id="v-montant" inputmode="decimal" autocomplete="off" value="${esc(montant(t.total))}" data-saisie="vMontant"
          aria-label="Montant à te verser" ${t.maximum <= 0 ? "disabled" : ""}>
        <div class="aide" id="v-max">${esc(t.maximum > 0 ? t.aideMaximum : SANS_VERSEMENT)}</div>
        ${t.maximum > 0 ? `<div class="choix">${t.pastilles.map((p) => `<button class="petit" data-action="vPastille" data-m="${p.montant}" aria-pressed="${p.montant > 0 && p.montant === t.total}">${esc(p.nom)}</button>`).join("")}</div>` : ""}
      </div>
      <div class="pile" id="v-dyn" style="gap:8px">${htmlPartage()}</div>
      <div id="v-refus">${t.refus ? `<p class="perte" style="font-weight:500;font-size:13px">${esc(t.refus)}</p>` : ""}</div>
      ${bouton(`Verser ${montant(t.total)}`, "vVerser", { genre: "teinte", teinte: "var(--argent)", desactive: !t.partage || t.total <= 0 })}`;
    },
    actions: {
      vMontant(_c, el) {
        const m = lireMontantSaisi(el.value);
        if (m == null) return;
        v.total = Math.min(Math.max(0, m), v.t?.maximum ?? m);
        v.salaire = null;
        plusTard(400);
      },
      vPastille(_c, b) { v.total = Number(b.dataset.m); v.salaire = null; const c = q("#v-montant"); if (c) c.value = montant(v.total); charger(); },
      vPart(_c, el) {
        const t = v.t;
        if (!t) return;
        // Le curseur avance par euro : au bout, c'est tout (même quand le total n'est pas rond).
        const brut = Number(el.value);
        v.salaire = brut >= t.total - 100 ? t.total : Math.min(t.total, brut);
        // Les deux montants suivent tout de suite ; le net, au calcul suivant.
        if (q("#v-sal")) q("#v-sal").textContent = montant(v.salaire);
        if (q("#v-div")) q("#v-div").textContent = montant(Math.max(0, t.total - v.salaire));
        plusTard(150);
      },
      vAide() { v.aide = !v.aide; q("#v-chiffres").innerHTML = htmlChiffres(); },
      vChanger(_c, b) {
        v.partage = !v.partage;
        b.classList.toggle("v-ouvert", v.partage);
        b.setAttribute("aria-expanded", String(v.partage));
        q("#v-curseur-zone").innerHTML = htmlCurseur();
      },
      async vMeilleur() {
        v.salaire = null;
        await charger();
        const s = q("#v-part");
        if (s && v.t?.partage) s.value = v.t.partage.salaire;
      },
      async vVerser(c) {
        const t = v.t, p = t?.partage;
        if (!p || t.total <= 0 || v.enCours) return;
        const recu = { titre: t.titre, lignes: t.repartition, enPoche: p.enPoche, net: p.net };
        v.enCours = true;
        maj();
        const op = { verserHolding: { salaire: p.salaire, dividendes: p.dividendes, mode: "tresorerie", montants: {}, ...(boite != null ? { seule: boite } : {}) } };
        const ok = await entreprendre(c, op, `${montant(p.enPoche)} sur ton compte`, { fermer: false });
        v.enCours = false;
        if (ok) { v.recu = recu; ctx.feuille(spec); } else maj();
      },
    },
  };
  ctx.feuille(spec);
  charger();
}

/** « 2 500 € », « 2500,50 » → centimes ; null si illisible. */
function lireMontantSaisi(texte) {
  const t = String(texte).replace(/[\s  €]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!t) return 0;
  const x = Number(t);
  return Number.isFinite(x) ? Math.round(x * 100) : null;
}

// MARK: - L'équipe (EcranEquipe)

const PAGE_EQUIPE = {
  titre: "L'équipe",
  async donnees(ctx, p) {
    styles();
    const [t, cat] = await Promise.all([ctx.tableau("boite", { id: Number(p.id) }), lireCatalogues(ctx)]);
    return { t, B: cat.e };
  },
  rendu(d) {
    styles();
    const t = d.t;
    if (!t) return `${entetePousse("L'équipe")}${vide("Cette boîte n'existe plus.")}`;
    return `${entetePousse("L'équipe")}
    <div class="ent-pile18" style="gap:20px;margin-top:4px">
      <p class="aide">${t.effectif}${t.places != null ? ` sur ${t.places} places` : ""} personne${t.effectif > 1 ? "s" : ""}, ${montant(t.masse)} de salaires par semaine</p>
      ${t.postes.map((poste) => sectionReglages(poste.nom, `
        ${poste.personnes.length ? `<div class="ent-badges">${poste.personnes.map((x) => {
          const liseret = RARETE[x.rarete];
          return `<button class="ent-badge-emp" style="${liseret ? `--c:${liseret}99` : ""}" ${act("entPersonne", { personne: x.id })} aria-label="${esc(`${x.nom}, ${poste.nom}, ${x.niveau}, ${montant(x.salaire)} par semaine`)}">
            <span class="cordon"></span><span class="ini" style="${liseret ? `box-shadow:inset 0 0 0 2px ${liseret}` : ""}">${esc(x.nom[0] ?? "")}</span>
            <span class="n">${esc(x.nom)}</span><span style="font-size:11px;color:${liseret ?? "var(--texte2)"}">${esc(x.niveau)}${x.noir ? ", au noir" : ""}</span>
            <span class="ent-mono" style="font-size:12px;font-weight:600;color:${x.sousPaye ? "var(--alerte)" : "var(--texte2)"}">${montant(x.salaire)}/sem.</span></button>`;
        }).join("")}</div>` : `<div class="aide" style="padding:16px">Personne à ce poste</div>`}
        ${ligneReglage({ icone: "personnePlus", teinte: "var(--equipe)", titre: "Embaucher", detail: "Au salaire du marché", action: "entEmbaucher", donnees: { poste: poste.id } })}`,
      `${esc(poste.role)}. Marché de la ville : ${montant(poste.salaireMarche)} par semaine.`)).join("")}
      ${t.detail ? `<div class="libelle" style="margin-top:6px">Candidats de la semaine</div>
        ${!t.candidats.length ? `<p class="aide">Tous engagés. La liste se renouvelle lundi.</p>` : ""}
        ${t.candidats.map((c) => papier(`<div class="ent-entre"><span style="min-width:0">
            <div style="display:flex;gap:6px;align-items:center;font:600 16px/1.2 ui-serif,Georgia,serif">${esc(c.nom)}${RARETE[c.rarete] ? `<i style="width:8px;height:8px;border-radius:50%;background:${RARETE[c.rarete]}"></i>` : ""}</div>
            <div class="encre2">${esc(t.postes.find((x) => x.id === c.poste)?.nom ?? c.poste)}, ${esc((d.B.niveaux[Math.min(c.niveau, 3)] ?? "").toLowerCase())}</div>
            <div style="font-size:12px;font-weight:500">Demande ${montant(c.salaire)}/sem., prime d'arrivée ${montant(c.salaire * 2)}</div></span>
          <button class="ent-encre" ${act("entEngager", { candidat: c.cle, nom: c.nom })}>Engager</button></div>`, { empilee: false })).join("")}`
        : `<p class="aide">En gestion détaillée, tu choisis aussi parmi des candidats plus expérimentés, parfois rares.</p>`}
    </div>`;
  },
  actions: {
    entEmbaucher(ctx, b, d) { return entreprendre(ctx, { embaucher: { boite: d.t.id, poste: b.dataset.poste } }, "Embauche au salaire du marché"); },
    entEngager(ctx, b, d) { return entreprendre(ctx, { engager: { boite: d.t.id, candidat: b.dataset.candidat } }, `${b.dataset.nom} rejoint l'équipe`); },
    entPersonne(ctx, b, d) {
      const x = d.t.postes.flatMap((p) => p.personnes).find((y) => y.id === Number(b.dataset.personne));
      if (!x) return;
      confirmer(ctx, { titre: x.nom, message: "Licencier coûte deux semaines de salaire à la boîte et fait baisser le moral.", choix: [
        { texte: "Changer le salaire", genre: "secondaire", faire: (ctx) => saisir(ctx, { titre: `Salaire de ${x.nom}`, aide: "Sous le marché, le moral baisse", proposition: x.salaire,
          valider: (v) => entreprendre(ctx, { salaire: { boite: d.t.id, personne: x.id, _2: v } }, `Salaire de ${x.nom} : ${montant(v)}`) }) },
        { texte: x.noir ? "Le déclarer" : "Le payer au noir (35 % moins cher)", genre: "secondaire",
          faire: (ctx) => ctx.decider("illegal", { travailNoir: { boite: d.t.id, personne: x.id, _2: !x.noir } }, { succes: x.noir ? `${x.nom} est déclaré` : `${x.nom} est payé au noir` }) },
        { texte: `Licencier ${esc(x.nom)}`, genre: "danger", faire: (ctx) => entreprendre(ctx, { licencier: { boite: d.t.id, personne: x.id } }, `${x.nom} quitte l'équipe, deux semaines d'indemnité`) },
      ] });
    },
  },
};

// MARK: - Boîtes à reprendre (EcranReprises)

const etatReprises = { q: "", tri: "prix", filtres: ["ici"] };
let derniereReprise = null;

const PAGE_REPRISES = {
  titre: "Boîtes à reprendre",
  async donnees(ctx) {
    styles();
    const [annonces, monde, cat] = await Promise.all([ctx.tableau("annoncesBoites"), ctx.tableau("monde"), lireCatalogues(ctx)]);
    const B = cat.e;
    const pays = (B.villes.find((v) => v.nom === monde?.residence) ?? ville(B, "bruxelles"))?.codePays;
    derniereReprise = { annonces: annonces ?? [], B, pays, dispo: ctx.etat.jeu?.accueil?.tresorerie ?? 0 };
    return derniereReprise;
  },
  rendu(d) {
    styles();
    const familles = [...new Set(d.annonces.map((a) => secteur(d.B, a.boite.secteur)?.famille).filter(Boolean))].sort();
    return `${entetePousse("Boîtes à reprendre")}
    <div class="ent-pile" style="margin-top:4px">
      <p class="aide">Elles tournent déjà : pas de jours sans clients, une réputation, une équipe en place. Les annonces changent chaque lundi.</p>
      ${barreListe({ invite: "Boîte, métier ou ville", valeur: etatReprises.q, saisie: "entChercheReprise", tri: etatReprises.tri, actionTri: "entTriReprise",
        tris: [["prix", "Prix"], ["benefice", "Bénéfice"], ["rentabilite", "Rentabilité"], ["reputation", "Réputation"], ["equipe", "Équipe"], ["nom", "Nom"]],
        filtres: [["ici", "Mon pays"], ["abordable", "À ta portée"], ["benef", "Bénéficiaires"], ...familles.map((f) => [`famille:${f}`, d.B.familles.find((x) => x.id === f)?.nom ?? f])],
        actifs: etatReprises.filtres, actionFiltre: "entFiltreReprise" })}
      <div id="ent-liste-reprises" class="ent-pile" style="gap:12px">${listeReprises(d)}</div>
    </div>`;
  },
  actions: {
    entChercheReprise(ctx, el) { etatReprises.q = el.value; majListe("ent-liste-reprises", listeReprises(derniereReprise)); },
    entTriReprise(ctx, el) { etatReprises.tri = el.value; majListe("ent-liste-reprises", listeReprises(derniereReprise)); },
    async entFiltreReprise(ctx, b) { basculer(etatReprises.filtres, b.dataset.filtre); await ctx.rafraichir(); },
    entReprendre(ctx, b, d) {
      const a = d.annonces.find((x) => x.id === b.dataset.annonce);
      if (!a) return;
      const apport = Math.round(a.prix * d.B.apportMinimum);
      const racheter = (financement) => (ctx) => ctx.decider("entreprises", { racheter: { annonce: a.id, financement } }, { succes: `${a.boite.nom} est à toi` });
      confirmer(ctx, { titre: `Reprendre ${a.boite.nom} pour ${montant(a.prix)} ?`, choix: [
        { texte: "Comptant", faire: racheter({ comptant: {} }) },
        { texte: `À crédit : apport de ${montant(apport)}, 10 semaines`, genre: "secondaire", faire: racheter({ credit: { apport, semaines: 10 } }) },
      ] });
    },
  },
};

function listeReprises(d) {
  const B = d.B, f = etatReprises.filtres;
  const fams = f.filter((x) => x.startsWith("famille:")).map((x) => x.slice(8));
  const cles = { prix: (a) => a.prix, benefice: (a) => -a.beneficeSemaine, rentabilite: (a) => -a.beneficeSemaine / Math.max(1, a.prix),
    reputation: (a) => -a.boite.reputation, equipe: (a) => -a.boite.equipe.length };
  let l = d.annonces
    .filter((a) => contient(etatReprises.q, a.boite.nom, secteur(B, a.boite.secteur)?.nom, ville(B, a.boite.ville)?.nom))
    .filter((a) => !f.includes("ici") || ville(B, a.boite.ville)?.codePays === d.pays)
    .filter((a) => !f.includes("abordable") || a.prix <= d.dispo)
    .filter((a) => !f.includes("benef") || a.beneficeSemaine > 0)
    .filter((a) => !fams.length || fams.includes(secteur(B, a.boite.secteur)?.famille ?? ""));
  l = etatReprises.tri === "nom" ? l.sort((a, b) => a.boite.nom.localeCompare(b.boite.nom, "fr")) : l.sort((a, b) => cles[etatReprises.tri](a) - cles[etatReprises.tri](b));
  const compte = `<div class="ent-compte">${pluriel(l.length, "boîte")}</div>`;
  if (!l.length) return `${compte}<p class="aide">${d.annonces.length ? "Aucune boîte ne correspond. Retire « Mon pays » pour voir le monde." : "Rien à reprendre cette semaine."}</p>`;
  return compte + l.map((a) => {
    const b = a.boite, s = secteur(B, b.secteur);
    const info = (ic, t) => `<span style="display:inline-flex;gap:4px;align-items:center"><span class="ent-ic" style="width:12px;height:12px">${ic}</span>${esc(t)}</span>`;
    return `<div class="ent-pile" style="gap:6px"><button class="carte ent-tuile-boite" style="padding:16px;gap:8px" ${act("entReprendre", { annonce: a.id })}>
      <div class="ent-entre-haut"><span style="min-width:0"><div class="libelle">${esc(b.nom)}</div><div class="aide">${esc(s?.nom ?? b.secteur)}, ${esc(ville(B, b.ville)?.nom ?? b.ville)}</div></span>
        <span class="chiffres" style="font-size:17px;white-space:nowrap">${montant(a.prix)}</span></div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:12px;font-weight:500;color:var(--texte2)">
        ${info(G.etoile, virgule(b.reputation))}${info(icones.amis, String(b.equipe.length))}${info(G.immeuble, taille(B, b.taille)?.nom ?? b.taille)}${info(G.etiquette, gamme(B, b.gamme)?.nom ?? b.gamme)}
        <span style="margin-left:auto" class="ent-mono ${a.beneficeSemaine >= 0 ? "gain" : "perte"}">${variation(a.beneficeSemaine)}/sem.</span></div>
    </button><div>${boutonEpingler(null, { sorte: "reprise", cible: a.id, montant: a.prix, nom: b.nom })}</div></div>`;
  }).join("");
}

// MARK: - Parts d'entreprises (EcranParticipations, FeuilleParts)

const PAGE_PARTICIPATIONS = {
  titre: "Parts d'entreprises",
  async donnees(ctx) { styles(); return { t: await ctx.tableau("participations") }; },
  rendu(d) {
    styles();
    const t = d.t;
    if (!t) return `${entetePousse("Parts d'entreprises")}${vide("Les parts d'entreprises s'ouvrent avec ta première saison.")}`;
    return `${entetePousse("Parts d'entreprises")}
    <div class="ent-pile18" style="margin-top:4px">
      <p class="aide">Chaque entreprise a 1 000 parts. Tes parts touchent le dividende du dimanche ; ${pct(t.seuilConseil)} donnent un siège au conseil, plus de la moitié le contrôle.</p>
      ${t.detenues.length ? `<div class="ent-entre"><span class="libelle">Tes parts</span><span class="chiffres" style="font-size:15px">${montant(t.valeurTotale)}</span></div>${t.detenues.map(detenue).join("")}` : ""}
      <div class="libelle" style="margin-top:6px">Cherchent des associés cette semaine</div>
      ${!t.annonces.length ? `<p class="aide">Plus aucune offre cette semaine : de nouvelles PME arrivent lundi.</p>` : ""}
      ${t.annonces.map(annoncePME).join("")}
    </div>`;
  },
  actions: {
    entParts(ctx, b, d) {
      const t = d.t, id = b.dataset.id, achat = b.dataset.achat === "true";
      const x = t.detenues.find((y) => y.id === id) ?? t.annonces.find((y) => y.id === id);
      if (!x) return;
      const detenues = t.detenues.find((y) => y.id === id)?.parts ?? 0;
      const maximum = Number(b.dataset.maximum);
      feuilleParts(ctx, t, { id, nom: x.nom, achat, maximum, detenues, total: x.partsTotal, prixPart: x.prixPart });
    },
    entDistribution(ctx, b, d) {
      const v = Math.round(Number(b.value ?? b.dataset.valeur) * 10) / 10;
      return ctx.decider("participations", { distribution: { id: b.dataset.id, _1: v } }, { succes: `${pct(v)} du bénéfice distribué` });
    },
  },
};

function ligneParts(titre, valeur, couleur = "") {
  return `<div class="ent-entre" style="align-items:baseline"><span class="t2" style="font-size:14px;white-space:nowrap">${titre}</span>
    <span class="ent-mono ${couleur}" style="font-size:14px;font-weight:600;text-align:right">${valeur}</span></div>`;
}

function detenue(x) {
  return carte(`<div class="ent-carte-pad">
    <div style="display:flex;gap:12px;align-items:flex-start"><div class="ent-mini-dev">${devanture({ nom: x.nom, secteur: x.secteurID, famille: x.famille })}</div>
      <span style="min-width:0;display:flex;flex-direction:column;gap:4px"><span style="font-size:16px;font-weight:600">${esc(x.nom)}</span><span class="aide">${esc(x.secteur)}</span>
        <span style="display:flex;gap:6px;align-items:center"><span class="ent-statut ${x.controle ? "ctrl" : ""}">${esc(x.statut)}</span><span class="t2 ent-mono" style="font-size:13px;font-weight:600">${pct(x.part)}</span></span></span></div>
    <div class="ent-filet"></div>
    ${ligneParts("Valeur de tes parts", montant(x.valeurParts))}
    ${ligneParts("Dividende attendu par semaine", montant(x.dividendeEstime + x.jetons) + (x.jetons > 0 ? ", conseil compris" : ""))}
    ${ligneParts("Touché depuis l'achat", montant(x.touche), "gain")}
    ${x.dernierBenefice != null ? ligneParts("Bénéfice de la PME, dernière semaine", variation(x.dernierBenefice), x.dernierBenefice >= 0 ? "gain" : "perte") : ""}
    ${x.controle ? `<div style="display:flex;flex-direction:column;gap:6px"><div class="ent-entre"><span style="font-size:14px">Bénéfice distribué</span><span class="ent-mono" style="font-size:14px;font-weight:600">${pct(x.distribution)}</span></div>
      <input type="range" class="ent-range" min="0" max="1" step="0.1" value="${x.distribution}" data-distribution="1" data-id="${esc(x.id)}" aria-label="Bénéfice distribué">
      <p class="aide">Ce qui n'est pas distribué reste dans l'entreprise et la fait grandir.</p></div>` : ""}
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      ${x.prixReste != null ? petit(x.controle ? `Tout racheter, ${montant(x.prixReste)}` : "Acheter des parts", "entParts", { plein: true, donnees: { id: x.id, achat: "true", maximum: x.partsTotal - x.parts } }) : ""}
      ${petit("Vendre", "entParts", { donnees: { id: x.id, achat: "false", maximum: x.parts } })}</div>
  </div>`);
}

function annoncePME(a) {
  return carte(`<div class="ent-carte-pad">
    <div style="display:flex;gap:12px;align-items:flex-start"><div class="ent-mini-dev">${devanture({ nom: a.nom, secteur: a.secteurID, famille: a.famille })}</div>
      <span style="min-width:0;display:flex;flex-direction:column;gap:4px"><span style="font-size:16px;font-weight:600">${esc(a.nom)}</span><span class="aide">${esc(a.secteur)}, ${esc(a.ville)}</span>
        <span class="ent-mono" style="font-size:13px;font-weight:600">Vaut ${montant(a.valeur)}</span></span></div>
    <div class="ent-filet"></div>
    ${ligneParts("Rendement du bénéfice", `${pct(a.rendementAnnuel)} par an`)}
    ${ligneParts("100 parts", `${montant(Math.round(a.prixPart * 100))}, environ ${montant(a.dividendePour100)} par semaine`)}
    ${ligneParts("Parts proposées", `${a.disponibles}, soit ${pct(a.disponibles / a.partsTotal)}`)}
    <div class="rangee" style="gap:8px;flex-wrap:wrap">${petit("Prendre des parts", "entParts", { plein: true, donnees: { id: a.id, achat: "true", maximum: a.disponibles } })}
      ${boutonEpingler(null, { sorte: "pme", cible: a.id, part: a.disponibles / a.partsTotal, montant: Math.round(a.prixPart * a.disponibles), nom: a.nom })}</div>
  </div>`);
}

/** Choisir combien de parts acheter ou vendre ; le prix et le statut suivent (FeuilleParts). */
function feuilleParts(ctx, t, s) {
  const pas = s.maximum >= 10 ? 10 : 1;
  let n = Math.max(pas, s.maximum);
  // Le prix du moteur (ReglesParticipations.prix) : la prime de contrôle s'applique au-delà de la moitié.
  const prix = (k) => {
    if (!s.achat) return Math.round(s.prixPart * k * (1 - t.decoteVente));
    const moitie = Math.floor(s.total * t.seuilControle);
    const audela = Math.max(0, s.detenues + k - Math.max(moitie, s.detenues));
    return Math.round(s.prixPart * (k - audela + audela * (1 + t.primeControle)));
  };
  const note = (k) => {
    const apres = (s.detenues + (s.achat ? k : -k)) / s.total;
    const statut = apres >= 1 ? "propriétaire" : apres > t.seuilControle ? "le contrôle" : apres >= t.seuilConseil ? "un siège au conseil" : apres > 0 ? "associé" : "plus rien";
    let x = `Après : ${pct(apres)} du capital, ${statut}.`;
    if (s.achat && apres > t.seuilControle) x += ` Les parts au-delà de la moitié coûtent ${pct(t.primeControle)} de plus.`;
    return x;
  };
  const texteBouton = (k) => `${s.achat ? "Acheter" : "Vendre"} pour ${montant(prix(k))}`;
  ctx.feuille({
    titre: s.achat ? "Acheter des parts" : "Vendre des parts",
    contenu: `<p class="aide">${esc(s.nom)}</p>
      <div class="ent-entre" style="align-items:baseline"><span class="chiffres" style="font-size:28px" id="ent-n">${n} parts</span>
        <span class="chiffres ${s.achat ? "" : "gain"}" style="font-size:22px" id="ent-prix">${montant(prix(n))}</span></div>
      <input type="range" class="ent-range" id="ent-curseur" min="${pas}" max="${Math.max(s.maximum, pas)}" step="${pas}" value="${n}" data-saisie="entCurseur" aria-label="Nombre de parts">
      <p class="aide" id="ent-note">${note(n)}</p>
      <button class="bouton" data-action="entValiderParts" id="ent-valider-parts">${texteBouton(n)}</button>`,
    actions: {
      entCurseur(ctx, el) {
        n = Number(el.value);
        document.getElementById("ent-n").textContent = `${n} parts`;
        document.getElementById("ent-prix").textContent = montant(prix(n));
        document.getElementById("ent-note").textContent = note(n);
        document.getElementById("ent-valider-parts").textContent = texteBouton(n);
      },
      entValiderParts(ctx) {
        const op = s.achat ? { acheter: { id: s.id, parts: n } } : { vendre: { id: s.id, parts: n } };
        return ctx.decider("participations", op, { succes: s.achat ? `${n} parts achetées` : `${n} parts vendues` });
      },
    },
  });
}

// La distribution se règle au curseur : la décision part quand on le lâche.
if (typeof document !== "undefined") {
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!el?.dataset?.distribution) return;
    window.__grind?.ctx && PAGE_PARTICIPATIONS.actions.entDistribution(window.__grind.ctx, el, null);
  });
}

export const pages = {
  fonder: PAGE_FONDER,
  boite: PAGE_BOITE,
  equipe: PAGE_EQUIPE,
  reprises: PAGE_REPRISES,
  participations: PAGE_PARTICIPATIONS,
};
