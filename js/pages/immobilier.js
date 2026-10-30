// ══════════════════════════════════════════════════════════════════════
//  Zone « immobilier » (D186, vague 1) — EcransImmobilier.swift et
//  EcranEncheres.swift, écran pour écran :
//    section      ← SectionImmobilier   (onglet Actifs, tableau « immobilier »)
//    marcheImmo   ← EcranMarcheImmo     (pays, recherche, tri, filtres, annonces)
//    achat        ← EcranAchatBien      (visite, négociation, financement, assurance, acte signé)
//    bien         ← EcranBien           (titre de propriété, location, travaux, assurance, vente)
//    (les enchères : la salle des ventes unique, encheres.js, RNT-221)
//
//  Ce fichier porte aussi les briques communes à l'immobilier et aux
//  véhicules (papier, signature, pavé, barre de liste, interrupteur,
//  rareté…) : vehicules.js les importe d'ici.
// ══════════════════════════════════════════════════════════════════════
import * as Z from "../cosmetiques.js"; // RNT-231 : la finition équipée
import { boutonEpingler } from "./objectifs.js";
import { boutonFavori, etoileCarte } from "./favoris.js"; // RNT-250, RNT-275
import { montant, variation, pourcent, esc } from "../format.js";
import { carte, ligne, bouton, segment, entetePousse, vide, icones as ic } from "../ui.js";
import { photo as photoCatalogue, chargerPhotos, balanceGardee, listeEtDetail, estChoisi, videDetail } from "./catalogues.js";
import { choixBanqueCredit } from "../paiement.js"; // RNT-219

// MARK: - Styles locaux (une fois)

const CSS = `
.pz-defile { display:flex; gap:8px; overflow-x:auto; margin:0 -20px; padding:2px 20px; scrollbar-width:none; }
.pz-defile::-webkit-scrollbar { display:none; }
.pz-pile { display:flex; flex-direction:column; gap:16px; }
.pz-carte { padding:16px; display:flex; flex-direction:column; gap:10px; }
.pz-tete { display:flex; align-items:center; gap:10px; }
.pz-tete .libelle { flex:1; }
.pz-ico { width:18px; height:18px; flex:none; display:inline-grid; }
.pz-ico svg { width:100%; height:100%; }
.pz-label { display:inline-flex; align-items:center; gap:7px; }
.pilule { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:38px; padding:0 16px; border-radius:99px;
  font-size:13px; font-weight:600; border:1px solid var(--filet2); background:rgba(255,255,255,.06); color:var(--texte); white-space:nowrap; align-self:flex-start; }
.pilule.plein { background:linear-gradient(rgba(255,255,255,.18),transparent), var(--accent); color:var(--sur-accent); border-color:transparent; }
.pilule.cat { color:#fff; border-color:transparent; background:linear-gradient(135deg, var(--c), color-mix(in srgb, var(--c) 72%, transparent)); }
.pilule:active:not(:disabled) { transform:scale(.97); }
.filtre { display:inline-flex; align-items:center; gap:6px; min-height:34px; padding:0 14px; border-radius:99px; font-size:14px; font-weight:600;
  border:1px solid var(--filet2); white-space:nowrap; flex:none; }
.filtre[aria-pressed="true"] { background:var(--texte); color:var(--fond); border-color:transparent; }
.filtre svg { width:13px; height:13px; }
.pz-recherche { display:flex; gap:8px; }
.pz-recherche .carte { display:flex; align-items:center; gap:10px; padding:0 14px; min-height:44px; flex:1; min-width:0; border-radius:16px; }
.pz-recherche input::-webkit-search-cancel-button { filter:invert(.6); }
.pz-recherche input { flex:1; min-width:0; background:none; border:0; font-size:16px; outline:none; }
.pz-recherche input::placeholder { color:var(--texte2); }
.pz-recherche .pz-ico { color:var(--texte2); width:16px; height:16px; }
.pz-recherche .pz-tri { position:relative; display:flex; align-items:center; gap:5px; padding:0 12px; min-height:44px; border-radius:16px; font-size:13px; font-weight:600; flex:none; }
.pz-tri select, .pz-menu select { position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer; font-size:16px; }
.pz-compte { display:flex; justify-content:space-between; align-items:center; padding:0 4px; font-size:12px; font-weight:500; color:var(--texte2); font-variant-numeric:tabular-nums; }
.pz-compte button { font-size:12px; font-weight:600; color:var(--accent); }
.pz-menu { position:relative; display:flex; align-items:center; gap:10px; padding:0 16px; min-height:54px; border-radius:22px; }
.pz-plus { align-self:center; }
/* Papier */
.papier { position:relative; color:#1D1C1A; background:#F1EEE7; border-radius:10px; padding:18px; box-shadow:0 6px 20px rgba(0,0,0,.35); }
.papier.empilee::before { content:""; position:absolute; inset:0; z-index:-1; border-radius:10px; background:rgba(241,238,231,.55); transform:translateY(4px) rotate(1.4deg); }
.papier-pile { position:relative; z-index:0; }
.papier .titre-papier { font:600 20px/1.2 ui-serif, "New York", Georgia, serif; }
.papier .sous-papier { font-size:12px; color:#6B675F; margin-top:2px; }
.champ-papier { display:flex; justify-content:space-between; align-items:baseline; gap:8px; padding-bottom:7px; border-bottom:1px solid rgba(29,28,26,.12); }
.champ-papier span:first-child { font-size:13px; color:#6B675F; }
.champ-papier span:last-child { font-size:14px; font-weight:600; font-variant-numeric:tabular-nums; text-align:right; }
.champ-papier.fort span:last-child { font-size:17px; font-weight:700; }
.encre { display:inline-flex; align-items:center; gap:4px; font-size:13px; font-weight:600; color:#F1EEE7; background:#1D1C1A; padding:0 14px; min-height:32px; border-radius:99px; white-space:nowrap; }
.encre svg { width:10px; height:10px; }
.pad-signature { position:relative; height:110px; touch-action:none; cursor:crosshair; user-select:none; }
.pad-signature .ligne-sig { position:absolute; left:0; right:0; bottom:18px; height:1px; background:rgba(29,28,26,.25); }
.pad-signature .croix { position:absolute; left:0; bottom:20px; font:18px ui-serif, Georgia, serif; color:#6B675F; }
.pad-signature .invite { position:absolute; inset:0; display:grid; place-items:center; font:italic 14px ui-serif, Georgia, serif; color:rgba(107,103,95,.7); pointer-events:none; }
.pad-signature svg { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
.pad-signature .recommencer { position:absolute; top:0; right:0; font-size:12px; font-weight:600; color:#6B675F; background:rgba(29,28,26,.06); padding:5px 10px; border-radius:99px; }
/* Annonces (cartes d'agence, sur papier) */
.annonce { display:flex; flex-direction:column; gap:10px; padding:12px; width:100%; text-align:left; border-radius:16px; background:#F1EEE7; color:#1D1C1A; box-shadow:0 4px 16px rgba(0,0,0,.3); }
.annonce:disabled { opacity:.6; cursor:default; }
.annonce .nom { font-size:16px; font-weight:600; }
.annonce .sous { font-size:12px; color:#6B675F; }
.annonce .prix { font-size:17px; font-weight:700; font-variant-numeric:tabular-nums; text-align:right; white-space:nowrap; }
.annonce .barre { font-size:12px; color:#6B675F; text-decoration:line-through; text-align:right; }
.annonce .infos { display:flex; gap:14px; font-size:12px; font-weight:500; color:#6B675F; }
.annonce .infos span { display:inline-flex; align-items:center; gap:5px; }
.annonce .infos svg { width:12px; height:12px; }
.encre-gain { color:#1F7A4D; } .encre-perte { color:#B23A2A; }
/* Façade d'un bien, vitrine d'un véhicule */
.facade, .vitrine { position:relative; overflow:hidden; flex:none; width:100%; }
.facade { border-radius:14px; }
.vitrine { border-radius:16px; }
.facade::after, .vitrine::after { content:""; position:absolute; inset:0; border-radius:inherit; border:var(--bord, 1px solid rgba(255,255,255,.12)); pointer-events:none; }
.rarete { position:absolute; top:8px; left:8px; font-size:11px; font-weight:600; padding:3px 8px; border-radius:99px; color:var(--r); background:color-mix(in srgb, var(--r) 16%, rgba(0,0,0,.35)); backdrop-filter:blur(6px); }
.rarete.en-ligne { position:static; display:inline-block; background:color-mix(in srgb, var(--r) 14%, transparent); backdrop-filter:none; }
.badge-vitrine { position:absolute; top:8px; right:8px; font-size:11px; font-weight:700; color:#fff; padding:4px 8px; border-radius:99px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18); backdrop-filter:blur(10px); }
/* Possessions */
.possessions { display:grid; gap:12px; }
.possessions.galerie { grid-template-columns:1fr 1fr; gap:16px 12px; }
.possession { display:flex; flex-direction:column; gap:10px; padding:12px; border-radius:22px; background:rgba(255,255,255,.04); border:1px solid var(--filet); text-align:left; width:100%; min-width:0; }
.galerie .possession { padding:0; gap:6px; background:none; border:0; border-radius:0; }
.possession .nom { font-size:16px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.galerie .possession .nom { font-size:14px; }
.possession .val { font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
.galerie .possession .val { font-size:13px; }
.possession .l { font-size:12px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:4px; }
.possession .l svg { width:12px; height:12px; flex:none; }
.disposition { display:flex; gap:2px; padding:3px; border-radius:99px; background:rgba(255,255,255,.08); border:1px solid var(--filet2); }
.disposition button { width:34px; height:28px; display:grid; place-items:center; border-radius:99px; }
.disposition button svg { width:14px; height:14px; }
.disposition button[aria-pressed="true"] { background:var(--accent); color:var(--sur-accent); }
/* Contrôles */
.radio { width:22px; height:22px; border-radius:50%; flex:none; border:1.5px solid var(--texte3); display:grid; place-items:center; }
.radio.oui { border-color:var(--accent); }
.radio.oui::after { content:""; width:12px; height:12px; border-radius:50%; background:var(--accent); }
.choix-radio { display:flex; align-items:center; gap:12px; width:100%; text-align:left; padding:2px 0; }
.choix-radio .t { font-size:14px; font-weight:600; }
.interrupteur { display:flex; align-items:center; gap:12px; width:100%; text-align:left; }
.interrupteur .piste { width:50px; height:30px; border-radius:99px; background:var(--filet2); flex:none; position:relative; transition:background .3s; }
.interrupteur .piste::after { content:""; position:absolute; top:3px; left:3px; width:24px; height:24px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.25); transition:transform .3s cubic-bezier(.3,1.4,.5,1); }
.interrupteur[aria-checked="true"] .piste { background:var(--accent); }
.interrupteur[aria-checked="true"] .piste::after { transform:translateX(20px); }
.champ-pave { display:flex; align-items:center; justify-content:space-between; min-height:48px; padding:0 16px; border-radius:14px; border:1px solid var(--filet2); width:100%; }
.champ-pave .v { font-size:17px; font-weight:600; font-variant-numeric:tabular-nums; letter-spacing:-.03em; }
.champ-pave .m { font-size:14px; font-weight:500; color:var(--texte2); }
.points { display:flex; gap:3px; }
.points i { width:7px; height:7px; border-radius:50%; background:var(--puce2); }
.points i.oui { background:var(--texte); }
.jauge-etat { position:relative; height:8px; border-radius:99px; background:rgba(255,255,255,.08); overflow:hidden; }
.jauge-etat i { position:absolute; inset:0; border-radius:99px; background:linear-gradient(90deg, var(--alerte), var(--or), var(--gain)); }
.rail-fin { flex:1; height:4px; border-radius:99px; background:var(--puce2); position:relative; }
.rail-fin i { position:absolute; left:0; top:0; bottom:0; border-radius:99px; background:var(--accent); box-shadow:0 0 6px color-mix(in srgb, var(--accent) 60%, transparent); }
.pz-ligne-etat { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--texte2); }
.pz-ligne-etat b { font-weight:600; color:var(--texte); font-variant-numeric:tabular-nums; }
.pz-gros { font-size:24px; font-weight:700; letter-spacing:-.02em; }
.pz-prix { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
.pz-prix .barre { font-size:15px; color:var(--texte2); text-decoration:line-through; }
.pz-note { font-size:13px; font-weight:500; display:flex; gap:7px; align-items:flex-start; }
.pz-note .pz-ico { width:15px; height:15px; margin-top:1px; }
.pz-diag { display:flex; gap:10px; align-items:baseline; }
.pz-diag .pt { width:7px; height:7px; border-radius:50%; flex:none; transform:translateY(-1px); }
.pz-confirm { display:flex; flex-direction:column; gap:10px; }
.pz-confirm .aide { text-align:center; }
/* RNT-221 : la vente aux enchères en cours, sur la fiche d'un bien ou d'une voiture. */
.ec-fiche { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; }
.ec-fiche .v { font-size:22px; font-weight:700; letter-spacing:-.02em; }
.ec-fiche .v.gain { color:var(--gain); }
.ec-fiche .fin { text-align:right; }
.ec-fiche .fin b { font-size:15px; font-weight:600; font-variant-numeric:tabular-nums; }
.ec-reserve { font-size:15px; font-weight:600; }
.ec-raison { font-size:13px; font-weight:500; color:var(--texte2); }
.ec-actions { display:flex; flex-wrap:wrap; gap:8px; }
/* RNT-228 : la fiche technique d'un modèle (CarteFicheTechnique, vehicules.js). */
.fiche-tech { gap:12px; }
.ft-tete { display:flex; flex-direction:column; gap:2px; }
.ft-grille { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:0; }
.ft-grille dt { font-size:12px; color:var(--texte2); }
.ft-grille dd { margin:2px 0 0; font-size:15px; font-weight:600; letter-spacing:-.01em; font-variant-numeric:tabular-nums; }
.ft-source { font-size:11px; color:var(--texte3); }
/* RNT-227 : mon garage par famille ; la page unique des permis (EcranPermis). */
.vh-famille { font-size:13px; font-weight:600; color:var(--texte2); margin:4px 0 -4px; }
.pm-compte, .pm-chiffres { display:flex; }
.pm-compte > div, .pm-chiffres > div { flex:1; min-width:0; }
.pm-l { font-size:12px; color:var(--texte2); }
.pm-v { font-size:16px; font-weight:700; letter-spacing:-.02em; }
.pm-compte .pm-v { font-size:20px; }
.pm-cartes { gap:10px; }
.pm-carte { flex:none; padding:0; border-radius:10px; }
.pm-carte:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }
.pm-groupe { margin:4px 0 -6px; }
.pm-ligne { padding:12px 16px; }
.pm-texte { flex:1; min-width:0; }
.pm-nom { font-size:15px; font-weight:600; }
.pm-etat { font-size:13px; font-weight:600; letter-spacing:-.02em; white-space:nowrap; }
.pm-etat.gain { color:var(--gain); } .pm-etat.alerte { color:var(--alerte); } .pm-etat.t2 { color:var(--texte2); font-weight:500; }
.pm-fiche { gap:14px; }
.pm-haut { align-items:flex-start; }
.pm-revision { display:flex; flex-direction:column; gap:8px; }
.pm-alerte { font-size:13px; font-weight:500; color:var(--alerte); }
`;
if (typeof document !== "undefined" && !document.getElementById("css-immo-vehicules")) {
  const s = document.createElement("style");
  s.id = "css-immo-vehicules";
  s.textContent = CSS;
  document.head.append(s);
}

// MARK: - Icônes en plus (traits, 24 × 24, comme ui.js)

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ico = {
  ...ic,
  marteau: I('<path d="M14.5 4.5l5 5-3 3-5-5zM12.5 8.5 4 17a1.4 1.4 0 0 0 2 2l8.5-8.5"/>'),
  drapeau: I('<path d="M4 20V9l7-5 7 5v11zM10 20v-5h3v5M15 2v6M15 2h4l-1 1.5 1 1.5h-4"/>'),
  permis: I('<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.6 1.6-2.3 3-2.3s2.4.7 3 2.3M14 10h4.5M14 13.5h3"/>'),
  repere: I('<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>'),
  cle: I('<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2"/>'),
  hausse: I('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'),
  cadenas: I('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  cle_molette: I('<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  mallette: I('<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5h6v2M3 12.5h18"/>'),
  main: I('<path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7c-3 0-4.5-1.7-6-4l-1.6-2.8a1.4 1.4 0 0 1 2.3-1.5L8 15"/>'),
  coche: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  sceau: I('<path d="M12 2.5l2.2 1.6 2.7-.2.9 2.6 2.3 1.4-.6 2.6 1 2.5-2 1.8-.4 2.7-2.7.4-1.8 2-2.5-1-2.6.6-1.4-2.3-2.6-.9.2-2.7L2.5 12l1.6-2.2-.2-2.7 2.6-.9 1.4-2.3 2.6.6z"/><path d="M8.5 12l2.4 2.4 4.6-4.8"/>'),
  eclair: I('<path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12z"/>'),
  horloge: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  calendrier: I('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  equipage: I('<circle cx="12" cy="8" r="3"/><circle cx="5.5" cy="10" r="2.2"/><circle cx="18.5" cy="10" r="2.2"/><path d="M7 20c.6-3 2.6-5 5-5s4.4 2 5 5M2 18.5c.4-2 1.6-3.3 3.4-3.3M22 18.5c-.4-2-1.6-3.3-3.4-3.3"/>'),
  oeil: I('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  etincelles: I('<path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6zM17.5 13.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>'),
  pourcentage: I('<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
  texte: I('<path d="M4 7V5h11v2M9.5 5v14M7.5 19h4M14 12v-1.5h6V12M17 10.5V19M15.5 19h3"/>'),
  loupe: I('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/>'),
  tri: I('<path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5"/>'),
  hautBas: I('<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>'),
  cartes1: I('<rect x="4" y="4" width="16" height="7" rx="1.8"/><rect x="4" y="13" width="16" height="7" rx="1.8"/>'),
  cartes4: I('<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>'),
  alerteTri: I('<path d="M12 3.5 2.5 20h19zM12 10v4.5M12 17.5v.3"/>'),
  recommencer: I('<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/>'),
  billet: I('<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>'),
  personneSeule: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  etiquette: I('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.4"/>'),
  euro: ic.euro,
  jauge: I('<path d="M4 17a8 8 0 1 1 16 0M12 17l4-5"/>'),
  voitureCote: I('<path d="M2.5 15.5v-3l3-1.5 3-4h7l3.5 4 2.5.8v3.7h-2M6.5 15.5H15"/><circle cx="8.5" cy="16" r="2"/><circle cx="17" cy="16" r="2"/>'),
  boite: ic.boite,
  canape: I('<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 11a1.5 1.5 0 0 1 3 0v3h12v-3a1.5 1.5 0 0 1 3 0v6H3zM5 17v2M19 17v2"/>'),
  route: I('<path d="M8 3 4 21M16 3l4 18M12 4v3M12 10.5v3M12 17v3"/>'),
  feuille: I('<path d="M5 19C5 10 10 5 20 4c0 9-5 15-13 15M5 19l7-7"/>'),
  couronne: I('<path d="M3.5 8l4 4L12 5l4.5 7 4-4-2 11h-13z"/>'),
};

/** Les glyphes de façade, pleins, à la place des symboles de l'iPhone (le type du bien). */
const V = "rgba(42,62,96,.42)";
const GLYPHES = {
  "house.fill": `<path d="M12 3.2 2.6 11.2h2.6V21h5v-5.6h3.6V21h5v-9.8h2.6z" fill="#fff"/>`,
  "house.lodge.fill": `<path d="M12 2.5 2 13h3v8h14v-8h3z" fill="#fff"/><rect x="10" y="15" width="4" height="6" fill="${V}"/><path d="M12 6.5 8.5 11h7z" fill="${V}"/>`,
  "building.fill": `<rect x="5" y="3" width="11" height="18" rx="1" fill="#fff"/><rect x="16" y="9" width="4" height="12" rx="1" fill="#fff"/>${fenetres(7, 5, 2, 5, 3, 3.2)}`,
  "building.2.fill": `<rect x="3" y="8" width="8" height="13" rx="1" fill="#fff"/><rect x="12" y="3" width="9" height="18" rx="1" fill="#fff"/>${fenetres(4.6, 10, 2, 3, 3, 3.2)}${fenetres(14, 5, 2, 5, 3.2, 3.2)}`,
  "building.2.crop.circle.fill": `<rect x="4" y="9" width="7" height="12" rx="1" fill="#fff"/><rect x="12" y="4" width="8" height="17" rx="1" fill="#fff"/>${fenetres(13.6, 6, 2, 4, 3, 3.4)}`,
  "square.stack.3d.up.fill": `<rect x="4" y="2.5" width="16" height="18.5" rx="1.2" fill="#fff"/>${fenetres(6, 4.5, 4, 5, 3.3, 3.3)}`,
  "building.columns.fill": `<path d="M12 2.5 2.5 8h19z" fill="#fff"/><rect x="3" y="18.5" width="18" height="2.5" fill="#fff"/><path d="M5 9.5h2.4v8H5zM9.2 9.5h2.4v8H9.2zM13.4 9.5h2.4v8h-2.4zM17.6 9.5H20v8h-2.4z" fill="#fff"/>`,
  "bed.double.fill": `<path d="M3 20v-7.5A2.5 2.5 0 0 1 5.5 10h13a2.5 2.5 0 0 1 2.5 2.5V20h-2v-2H5v2z" fill="#fff"/><rect x="5.5" y="6" width="5.5" height="4" rx="1.2" fill="#fff"/><rect x="13" y="6" width="5.5" height="4" rx="1.2" fill="#fff"/>`,
  "door.garage.closed": `<path d="M2.5 9 12 3l9.5 6V21h-19z" fill="#fff"/><rect x="5.5" y="11" width="13" height="10" fill="${V}"/><path d="M5.5 13.5h13M5.5 16h13M5.5 18.5h13" stroke="#fff" stroke-width=".9"/>`,
  "storefront.fill": `<path d="M3 4h18l1 5H2z" fill="#fff"/><rect x="3.5" y="10" width="17" height="11" fill="#fff"/><rect x="6" y="13" width="5" height="8" fill="${V}"/><rect x="13" y="13" width="5" height="4" fill="${V}"/>`,
  "briefcase.fill": `<rect x="3" y="7" width="18" height="14" rx="2.2" fill="#fff"/><path d="M8.5 7V4.5h7V7" stroke="#fff" stroke-width="2" fill="none"/><path d="M3 12.5h18" stroke="${V}" stroke-width="1.4"/>`,
  "shippingbox.fill": `<path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" fill="#fff"/><path d="M3 7l9 4.5L21 7M12 11.5v10" stroke="${V}" stroke-width="1.2" fill="none"/>`,
  "crown.fill": `<path d="M3 8l4.5 4L12 4l4.5 8L21 8l-2 11H5z" fill="#fff"/><rect x="5" y="19.5" width="14" height="1.8" rx=".9" fill="#fff"/>`,
  "mountain.2.fill": `<path d="M1.5 20.5 9 7l4 6.5 2.5-3.5 7 10z" fill="#fff"/><path d="M9 7l1.8 3.2-1.8 1-1.6-1.2z" fill="${V}"/>`,
  "beach.umbrella.fill": `<path d="M12 4a9 9 0 0 1 9 8H3a9 9 0 0 1 9-8z" fill="#fff"/><path d="M12 12v8" stroke="#fff" stroke-width="2"/><path d="M5 20.5h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
};
function fenetres(x0, y0, cols, rangs, dx, dy) {
  let s = "";
  for (let r = 0; r < rangs; r++) for (let c = 0; c < cols; c++) s += `<rect x="${(x0 + c * dx).toFixed(1)}" y="${(y0 + r * dy).toFixed(1)}" width="1.6" height="1.9" rx=".3" fill="${V}"/>`;
  return s;
}

// MARK: - Formats

/** Montant.pourcentage(…, signe: true) : « +20 % », « −20 % ». */
export const pctSigne = (x, d = 0) => (x > 0 ? "+" : x < 0 ? "−" : "") + pourcent(Math.abs(x), d);
/** Variation colorée comme Variation (Montants.swift) : « 0 € » reste neutre. */
export const variationTexte = (c, taille = 15) => {
  const t = variation(c);
  const coul = t.startsWith("+") ? "gain" : t.startsWith("−") ? "perte" : "t2";
  return `<span class="chiffres ${coul}" style="font-size:${taille}px">${t}</span>`;
};
export const lettreCap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const nombreBE = new Intl.NumberFormat("fr-BE");
export const nombre = (n) => nombreBE.format(n ?? 0);
/** Le texte cherché, sans accents ni casse (localizedStandardContains). */
export const plier = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// MARK: - État local d'une page (les @State de l'iPhone)

const etats = new WeakMap();
/** L'état d'une page, attaché à son entrée de pile : il vit tant que la page est ouverte. */
export function etatDe(p, cle, defaut) {
  let m = etats.get(p);
  if (!m) etats.set(p, (m = {}));
  if (!(cle in m)) m[cle] = typeof defaut === "function" ? defaut() : structuredClone(defaut);
  return m[cle];
}
export function oublierEtat(p, cle) { etats.get(p) && delete etats.get(p)[cle]; }

/** Les parties de la balance ne changent pas en cours de partie : une lecture suffit. */
export const balance = (ctx, partie) => balanceGardee(ctx, partie);

// MARK: - Briques

/** Couleur d'une rareté (StyleEntreprise.rarete) : Onyx, Éternel, Absolu. */
export const teinteRarete = (r) => [null, "#9AA6BC", "#B79CFF", "#E3C46B"][Math.min(3, r ?? 0)];
/** PastilleRarete : rien pour un bien courant. */
export function pastilleRarete(r, { enLigne = false } = {}) {
  const c = teinteRarete(r);
  if (!c) return "";
  return `<span class="rarete ${enLigne ? "en-ligne" : ""}" style="--r:${c}">${["", "✦ Onyx", "✦ Éternel", "♛ Absolu"][Math.min(3, r)]}</span>`;
}
const bordRarete = (r) => { const c = teinteRarete(r); return c ? `--bord:2px solid ${c}` : ""; };

/**
 * FacadeBien : un ciel, l'objet de son type, le sol, la rareté en liseré ; la vraie photo du bien
 * (`photo`, RNT-38) par-dessus le dessin, qui reste en repli.
 */
export function facade({ icone, rarete = 0, hauteur = 96, lueur = false, pastille = false, photo = "", largeur = "", prioritaire = false }) {
  const ciel = lueur ? "#2B3A67, #E59A5C" : "#5D86C9, #BFD6F2";
  const g = GLYPHES[icone] ?? GLYPHES["house.fill"];
  const t = hauteur * 0.46;
  return `<div class="facade" style="--h:${hauteur}px;${largeur ? `--l:${largeur}px;` : ""}background:linear-gradient(${ciel});${bordRarete(rarete)}" aria-hidden="true">
    <div style="position:absolute;left:0;right:0;bottom:0;height:${hauteur * 0.16}px;background:#3C4A3A"></div>
    <svg viewBox="0 0 24 24" style="position:absolute;left:50%;bottom:${hauteur * 0.1}px;width:${t}px;height:${t}px;transform:translateX(-50%);filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))">${g}</svg>
    ${photoCatalogue("bien", photo, { prioritaire })}
    ${lueur ? `<span style="position:absolute;top:8px;right:9px;color:#F4E3B0;font-size:13px">☾✦</span>` : ""}
    ${pastille ? pastilleRarete(rarete) : ""}
  </div>`;
}

/** PetitBouton : pilule de verre ; pleine d'accent ; ou à la teinte d'une catégorie. */
export function pilule(texte, action, { plein = false, categorie = "", donnees = {}, desactive = false, page = "", p = null, style = "" } = {}) {
  const classe = categorie ? "pilule cat" : plein ? "pilule plein" : "pilule";
  const st = `${categorie ? `--c:${categorie};` : ""}${style}`;
  const attrs = page ? `data-action="ouvrir" data-page="${esc(page)}" ${p ? `data-p='${esc(JSON.stringify(p))}'` : ""}`
    : `data-action="${esc(action)}" ${Object.entries(donnees).map(([k, v]) => `data-${k}="${esc(typeof v === "string" ? v : JSON.stringify(v))}"`).join(" ")}`;
  return `<button class="${classe}" style="${st}" ${attrs} ${desactive ? "disabled" : ""}>${texte}</button>`;
}

/** PiluleFiltre : pleine si choisie. */
export const filtre = (titre, choisie, action, donnees = {}, icone = "") =>
  `<button class="filtre" aria-pressed="${!!choisie}" data-action="${esc(action)}" ${Object.entries(donnees).map(([k, v]) => `data-${k}="${esc(String(v))}"`).join(" ")}>${icone ? ico[icone] ?? "" : ""}${esc(titre)}</button>`;

/** PastilleRadio + texte : un choix dans une liste. */
export const choixRadio = (oui, titre, aide, action, donnees = {}) =>
  `<button class="choix-radio" role="radio" aria-checked="${!!oui}" data-action="${esc(action)}" ${Object.entries(donnees).map(([k, v]) => `data-${k}="${esc(String(v))}"`).join(" ")}>
    <span class="radio ${oui ? "oui" : ""}"></span><span style="flex:1;min-width:0"><div class="t">${titre}</div>${aide ? `<div class="aide">${aide}</div>` : ""}</span></button>`;

/** Toggle en Interrupteur : le libellé à gauche, la piste à droite. */
export const interrupteur = (on, contenu, action, donnees = {}) =>
  `<button class="interrupteur" role="switch" aria-checked="${!!on}" data-action="${esc(action)}" ${Object.entries(donnees).map(([k, v]) => `data-${k}="${esc(String(v))}"`).join(" ")}>
    <span style="flex:1;min-width:0">${contenu}</span><span class="piste"></span></button>`;

/** Champ : la valeur à gauche, « Modifier » à droite ; ouvre le pavé. */
export const champPave = (valeur, action) => `<button class="champ-pave" data-action="${esc(action)}"><span class="v">${valeur}</span><span class="m">Modifier</span></button>`;

/** PastilleCategorie + libellé, en tête de carte. */
export const tete = (icone, teinte, titre, droite = "") =>
  `<div class="pz-tete">${icone ? `<span class="pastille" style="--c:${teinte}">${ico[icone] ?? icone}</span>` : ""}<span class="libelle">${titre}</span>${droite}</div>`;
export const label = (icone, texte, classe = "libelle", style = "") => `<span class="pz-label ${classe}" style="${style}"><span class="pz-ico">${ico[icone] ?? ""}</span>${texte}</span>`;
export const note = (icone, texte, couleur = "var(--texte2)") => `<div class="pz-note" style="color:${couleur}"><span class="pz-ico">${ico[icone] ?? ""}</span><span>${texte}</span></div>`;

/** RailJauge : rail fin, rempli d'accent. */
export const railFin = (part) => `<span class="rail-fin"><i style="width:${Math.max(3, Math.min(100, (part ?? 0) * 100))}%"></i></span>`;
export const ligneEtat = (titre, part, valeur) => `<div class="pz-ligne-etat"><span>${titre}</span>${railFin(part)}<b>${valeur}</b></div>`;

/** Patience du vendeur, en points. */
export const points = (n, max) => `<span class="points" role="img" aria-label="Patience ${n} sur ${max}">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? "oui" : ""}"></i>`).join("")}</span>`;

/** Le sélecteur cartes / galerie (SelecteurDisposition), gardé comme sur l'iPhone. */
export const lireDisposition = () => { try { return localStorage.getItem("actifs.disposition") || "cartes"; } catch { return "cartes"; } };
export const selecteurDisposition = () => {
  const d = lireDisposition();
  return `<div class="disposition" role="group" aria-label="Disposition">
    <button data-action="dispositionActifs" data-valeur="cartes" aria-pressed="${d === "cartes"}" aria-label="Cartes larges">${ico.cartes1}</button>
    <button data-action="dispositionActifs" data-valeur="galerie" aria-pressed="${d === "galerie"}" aria-label="Galerie">${ico.cartes4}</button></div>`;
};
export function dispositionActifs(ctx, b) { try { localStorage.setItem("actifs.disposition", b.dataset.valeur); } catch {} ctx.rafraichir(); }

/** CartePossession : grande carte (visuel, nom, valeur, détail) ou tuile de galerie. */
export function possession({ nom, lignes, valeur, badge = "", galerie, visuel, page, p }) {
  const ls = lignes.slice(0, galerie ? 1 : 3).map(([t, c, i]) => `<div class="l" style="color:${c}">${i ? ico[i] ?? "" : ""}<span style="overflow:hidden;text-overflow:ellipsis">${esc(t)}</span></div>`).join("");
  return `<button class="possession" data-action="ouvrir" data-page="${page}" data-p='${esc(JSON.stringify(p))}'>
    <div style="position:relative">${visuel(galerie ? 96 : 150)}${badge ? `<span class="badge-vitrine">${badge}</span>` : ""}</div>
    ${galerie ? `<div class="nom">${esc(nom)}</div>` : `<div class="rangee entre" style="gap:8px;align-items:baseline"><span class="nom">${esc(nom)}</span><span class="val">${valeur}</span></div>`}
    ${ls}${galerie ? `<div class="val">${valeur}</div>` : ""}
  </button>`;
}

// MARK: - Papier

export const papier = (contenu, { empilee = true, style = "" } = {}) =>
  `<div class="papier-pile"><div class="papier ${empilee ? "empilee" : ""}" style="${style}">${contenu}</div></div>`;
export const titrePapier = (titre, sous) => `<div><div class="titre-papier">${esc(titre)}</div><div class="sous-papier">${esc(sous)}</div></div>`;
export const champPapier = (lib, val, fort = false) => `<div class="champ-papier ${fort ? "fort" : ""}"><span>${esc(lib)}</span><span>${val}</span></div>`;
export const etiquetteEncre = (t) => `<span class="encre">${esc(t)}${ico.chevron}</span>`;

// MARK: - Signature au doigt (PadSignature)

/** Le pad : `etat.signature` garde les traits (coordonnées entre 0 et 1). */
export function padSignature(traits) {
  const d = (traits ?? []).map((t) => t.map(([x, y], i) => `${i ? "L" : "M"}${(x * 1000).toFixed(1)} ${(y * 300).toFixed(1)}`).join(" ")).join(" ");
  const vide = !traits?.length;
  return `<div class="pad-signature" data-signature>
    <div class="ligne-sig"></div><div class="croix">×</div>
    ${vide ? `<div class="invite">Signe ici, du doigt</div>` : ""}
    <svg viewBox="0 0 1000 300" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="#1F3A8A" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ${vide ? "" : `<button class="recommencer" data-action="effacerSignature" aria-label="Effacer la signature">↺ Recommencer</button>`}
  </div>`;
}

/** Le dessin, par délégation : la page dit où ranger les traits (`signatureCible`) et quoi rallumer. */
let signatureCible = null; // { traits: [], apres: () => void }
export function cibleSignature(traits, apres) { signatureCible = { traits, apres }; }
if (typeof document !== "undefined" && !window.__padSignature) {
  window.__padSignature = true;
  let trait = null, pad = null;
  const point = (e) => {
    const r = pad.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
  };
  const dessiner = () => {
    const t = signatureCible?.traits ?? [];
    pad.querySelector("path")?.setAttribute("d", t.map((s) => s.map(([x, y], i) => `${i ? "L" : "M"}${(x * 1000).toFixed(1)} ${(y * 300).toFixed(1)}`).join(" ")).join(" "));
  };
  document.addEventListener("pointerdown", (e) => {
    const p = e.target.closest("[data-signature]");
    if (!p || e.target.closest("button") || !signatureCible) return;
    pad = p;
    trait = [point(e)];
    signatureCible.traits.push(trait);
    p.querySelector(".invite")?.remove();
    p.setPointerCapture?.(e.pointerId);
    dessiner();
  });
  document.addEventListener("pointermove", (e) => { if (trait && pad) { trait.push(point(e)); dessiner(); } });
  document.addEventListener("pointerup", () => {
    if (!trait) return;
    trait = null;
    if (pad && !pad.querySelector(".recommencer")) pad.insertAdjacentHTML("beforeend", `<button class="recommencer" data-action="effacerSignature" aria-label="Effacer la signature">↺ Recommencer</button>`);
    signatureCible?.apres?.();
  });
}

// MARK: - Feuilles : pavé numérique et confirmation

/** PaveNumerique : un montant en euros, « Valider ». `valider(centimes)` décide. */
export function pave(ctx, { titre, aide = "", proposition = 0, maximum = null, valider }) {
  ctx.feuille({
    titre,
    contenu: `
      <div class="rangee" style="align-items:baseline;gap:6px">
        <input class="champ chiffres" id="pave-montant" inputmode="decimal" autocomplete="off" style="font-size:34px;min-height:66px;text-align:center"
          value="${proposition ? String(Math.round(proposition / 100)) : ""}" placeholder="0" aria-label="Montant en euros">
        <span style="font-size:24px;font-weight:600;color:var(--texte2)">€</span>
      </div>
      ${aide ? `<p class="aide" style="text-align:center">${esc(aide)}${maximum != null ? `. Au plus ${montant(maximum)}` : ""}</p>` : ""}
      ${bouton("Valider", "paveValider")}
      ${bouton("Annuler", "fermerFeuille", { genre: "discret" })}`,
    actions: {
      async paveValider() {
        const t = (document.getElementById("pave-montant")?.value ?? "").replace(/\s|€/g, "").replace(",", ".");
        const v = Math.round(Number(t) * 100);
        if (!t || !Number.isFinite(v) || v <= 0) return ctx.toast("Saisis un montant.", "refus");
        if (maximum != null && v > maximum) return ctx.toast(`Au plus ${montant(maximum)}.`, "refus");
        await valider(v);
      },
    },
  });
}

/** confirmationDialog : un titre, un message, des boutons. Chaque bouton : { texte, faire, genre }. */
export function confirmer(ctx, { titre, message = "", boutons }) {
  const actions = {};
  boutons.forEach((b, i) => { actions[`confirmer${i}`] = async () => { await b.faire(); }; });
  ctx.feuille({
    titre,
    contenu: `<div class="pz-confirm">${message ? `<p class="aide">${esc(message)}</p>` : ""}
      ${boutons.map((b, i) => bouton(esc(b.texte), `confirmer${i}`, { genre: b.genre ?? "primaire" })).join("")}
      ${bouton("Annuler", "fermerFeuille", { genre: "discret" })}</div>`,
    actions,
  });
}

// MARK: - Barre de liste (BarreListe, RNT-136)

/**
 * Recherche, tri, filtres et compte, au-dessus d'une liste. Le champ et le tri ne sont pas
 * redessinés (on garde la saisie) ; les pastilles, le compte et la liste le sont, dans #<id>-corps.
 */
export function teteListe({ id, etat, invite, tris }) {
  const t = tris.find((x) => x.id === etat.tri);
  return `<div class="pz-recherche">
    <label class="carte"><span class="pz-ico">${ico.loupe}</span>
      <input id="${id}-q" type="search" placeholder="${esc(invite)}" value="${esc(etat.recherche)}" data-saisie="${id}Chercher" autocomplete="off" enterkeyhint="search" aria-label="Chercher"></label>
    <label class="carte pz-tri"><span class="pz-ico" style="width:14px;height:14px">${ico.tri}</span><span id="${id}-tri">${esc(t?.nom ?? "Trier")}</span>
      <select data-saisie="${id}Trier" aria-label="Trier par ${esc(t?.nom ?? "")}, ${etat.croissant ? "croissant" : "décroissant"}">
        ${tris.map((x) => `<option value="${esc(x.id)}" ${x.id === etat.tri ? "selected" : ""}>${esc(x.nom)}</option>`).join("")}
        <option disabled>──────</option>
        <option value="__sens">${etat.croissant ? "↓ Passer en ordre décroissant" : "↑ Passer en ordre croissant"}</option>
      </select></label>
  </div>`;
}
export const pastillesListe = (id, etat, filtres) => filtres.length
  ? `<div class="pz-defile" role="group" aria-label="Filtres">${filtres.map((f) => filtre(f.nom, etat.filtres.includes(f.id), `${id}Filtre`, { f: f.id }, f.icone)).join("")}</div>` : "";
export const compteListe = (id, etat, compte, unite) => `<div class="pz-compte"><span>${nombre(compte)} ${unite}</span>
  ${etat.filtres.length || etat.recherche ? `<button data-action="${id}Effacer">Tout effacer</button>` : ""}</div>`;
export const plusListe = (id, total, montres) => total > montres ? `<div class="pz-plus">${pilule(`Voir ${Math.min(40, total - montres)} de plus`, `${id}Plus`)}</div>` : "";

/** L'état d'une liste (EtatListe). */
export const nouvelleListe = (tri, filtres = [], croissant = true) => ({ recherche: "", tri, croissant, filtres: [...filtres], montres: 40 });
export function contient(etat, ...textes) {
  const q = plier(etat.recherche.trim());
  return !q || textes.some((t) => plier(t).includes(q));
}
export const actif = (etat, f) => etat.filtres.includes(f);
export function trier(liste, etat, cles, nom) {
  const k = cles[etat.tri], s = etat.croissant ? 1 : -1;
  if (k) return [...liste].sort((a, b) => (k(a) - k(b)) * s);
  return [...liste].sort((a, b) => nom(a).localeCompare(nom(b), "fr", { numeric: true, sensitivity: "base" }) * s);
}

/** Les actions d'une liste ; `redessiner(ctx, d, p)` repeint #<id>-corps. */
export function actionsListe(id, lireEtat, tris, redessiner) {
  return {
    [`${id}Chercher`](ctx, el, d, p) { const e = lireEtat(p); e.recherche = el.value; e.montres = 40; redessiner(ctx, d, p); },
    [`${id}Trier`](ctx, el, d, p) {
      const e = lireEtat(p);
      if (el.value === "__sens") e.croissant = !e.croissant;
      else if (el.value !== e.tri) { e.tri = el.value; e.croissant = tris.find((t) => t.id === el.value)?.croissant ?? true; }
      document.getElementById(`${id}-tri`).textContent = tris.find((t) => t.id === e.tri)?.nom ?? "Trier";
      const o = el.querySelector('option[value="__sens"]');
      if (o) o.textContent = e.croissant ? "↓ Passer en ordre décroissant" : "↑ Passer en ordre croissant";
      el.value = e.tri;
      redessiner(ctx, d, p);
    },
    [`${id}Filtre`](ctx, el, d, p) {
      const e = lireEtat(p), f = el.dataset.f;
      e.filtres = e.filtres.includes(f) ? e.filtres.filter((x) => x !== f) : [...e.filtres, f];
      e.montres = 40;
      redessiner(ctx, d, p);
    },
    [`${id}Effacer`](ctx, el, d, p) {
      const e = lireEtat(p);
      e.filtres = []; e.recherche = ""; e.montres = 40;
      const q = document.getElementById(`${id}-q`); if (q) q.value = "";
      redessiner(ctx, d, p);
    },
    [`${id}Plus`](ctx, el, d, p) { lireEtat(p).montres += 40; redessiner(ctx, d, p); },
  };
}
/** Repeint le corps d'une liste sans toucher au champ de recherche. */
export function repeindre(id, html) { const c = document.getElementById(`${id}-corps`); if (c) c.innerHTML = html; }

/** L'argent disponible (argentDisponible) : tes cartes et ton liquide, comme TableauBanque.liquidites. */
export async function argentDisponible(ctx) {
  const b = await ctx.tableau("banque");
  return b ? (b.cartes ?? []).reduce((s, c) => s + c.solde, 0) + (b.liquide ?? 0) : 0;
}

// MARK: - La section de l'onglet Actifs (SectionImmobilier)

export const section = {
  async donnees(ctx) { return { t: await ctx.tableau("immobilier") }; },
  rendu(d) {
    const t = d?.t;
    if (!t) return vide("Le marché s'ouvre avec ta première saison.");
    const galerie = lireDisposition() === "galerie";
    return `<div class="pz-pile" style="gap:12px">
      <div class="rangee entre" style="align-items:baseline"><span class="libelle">Immobilier</span>
        ${t.biens.length ? `<span class="aide">${montant(t.valeurTotale)}, +${montant(t.loyersSemaine)}/sem.</span>` : ""}</div>
      ${!t.biens.length ? `<p class="aide">Un bien rapporte un loyer chaque jour, même sans focus : un revenu sûr, mais lent.</p>` : `
        <div class="rangee" style="justify-content:flex-end">${selecteurDisposition()}</div>
        <div class="possessions ${galerie ? "galerie" : ""}">${t.biens.map((b) => possession({
          nom: b.nom, lignes: [[b.statut, "var(--texte2)"]], valeur: montant(b.valeur), galerie, page: "bien", p: { id: b.id },
          visuel: (h) => facade({ icone: b.icone, rarete: b.rarete, hauteur: h, lueur: b.statut === "Ta résidence", photo: b.photo }),
        })).join("")}</div>`}
      ${carte(
        ligne({ titre: "Parcourir le marché", detail: "Annonces de la semaine, dans chaque pays", page: "marcheImmo", icone: ico.drapeau, teinte: "var(--vente)" }))}
    </div>`;
  },
  actions: { dispositionActifs },
};

// MARK: - Le marché (EcranMarcheImmo)

const TRIS_BIENS = [
  { id: "prix", nom: "Prix" }, { id: "rendement", nom: "Rendement", croissant: false }, { id: "loyer", nom: "Loyer", croissant: false },
  { id: "rarete", nom: "Rareté", croissant: false }, { id: "nom", nom: "Nom" },
];
const listeBiens = (p) => etatDe(p, "liste", () => nouvelleListe("prix", ["vente"]));

function annoncesFiltrees(d, p) {
  const e = listeBiens(p);
  const choisi = etatDe(p, "pays", () => ({ code: null })).code ?? d.t.residence;
  const duPays = d.t.annonces.filter((a) => a.codePays === choisi);
  const types = [...new Set(duPays.map((a) => a.type))].sort();
  const choisis = types.filter((x) => actif(e, "type:" + x));
  const base = duPays
    .filter((a) => contient(e, a.nom, a.villeNom, a.type))
    .filter((a) => !actif(e, "vente") || a.enVente)
    .filter((a) => !actif(e, "abordable") || (a.prixNegocie ?? a.prix) <= d.dispo)
    .filter((a) => !actif(e, "rare") || a.rarete >= 2)
    .filter((a) => !actif(e, "particulier") || !a.pro)
    .filter((a) => !choisis.length || choisis.includes(a.type));
  const annonces = trier(base, e, { prix: (a) => a.prixNegocie ?? a.prix, rendement: (a) => a.rendementAnnuel, loyer: (a) => a.loyer, rarete: (a) => a.rarete }, (a) => a.nom);
  return { choisi, types, annonces };
}

function corpsMarche(d, p) {
  const e = listeBiens(p);
  const { types, annonces } = annoncesFiltrees(d, p);
  const filtres = [{ id: "vente", nom: "En vente", icone: "etiquette" }, { id: "abordable", nom: "À ta portée", icone: "billet" },
    { id: "rare", nom: "Rares", icone: "etincelles" }, { id: "particulier", nom: "Particuliers", icone: "personneSeule" },
    ...types.map((x) => ({ id: "type:" + x, nom: lettreCap(x) }))];
  const montres = annonces.slice(0, e.montres);
  return `<div class="pz-pile" style="gap:10px">${pastillesListe("biens", e, filtres)}${compteListe("biens", e, annonces.length, "biens")}</div>
    ${!annonces.length ? `<p class="aide">Rien en vente ici cette semaine. Les biens rares reviennent certaines semaines seulement.</p>` : ""}
    <div class="cat-grille"><div class="cat-cartes">${montres.map((a) => carteAnnonce(a, estChoisi(p, "achat", "id", a.id))).join("")}</div></div>
    ${plusListe("biens", annonces.length, montres.length)}`;
}

/** Une annonce d'agence, sur papier. */
function carteAnnonce(a, choisie = false) {
  return `<div class="fv-cadre">${etoileCarte(null, "bien", a.id, !a.enVente)}<button class="annonce" data-action="ouvrir" data-page="achat" data-p='${esc(JSON.stringify({ id: a.id }))}' ${a.enVente ? "" : "disabled"} ${choisie ? 'aria-current="true"' : ""}>
    ${facade({ icone: a.icone, rarete: a.rarete, hauteur: 110, pastille: true, photo: a.photo })}
    <div class="rangee entre" style="align-items:flex-start;gap:8px">
      <div style="min-width:0"><div class="nom">${esc(a.nom)}</div><div class="sous">${esc(a.drapeau)} ${esc(a.villeNom)}, ${a.pro ? "vendeur pro" : "particulier"}</div></div>
      <div>${a.prixNegocie != null ? `<div class="barre">${montant(a.prix)}</div><div class="prix encre-gain">${montant(a.prixNegocie)}</div>` : `<div class="prix">${montant(a.prix)}</div>`}</div>
    </div>
    <div class="infos"><span>${ico.cle}${montant(a.loyer)}/sem.</span><span>${ico.hausse}${pourcent(a.rendementAnnuel, 1)} par an</span></div>
    ${!a.enVente ? `<div class="encre-perte" style="font-size:12px;font-weight:600">${a.retourDans != null ? `Pas sur le marché, de retour dans ${a.retourDans} semaine${a.retourDans > 1 ? "s" : ""}` : "Pas sur le marché pour l'instant"}</div>`
      : a.seuil != null ? `<div class="encre-perte pz-label" style="font-size:12px;font-weight:600"><span class="pz-ico" style="width:12px;height:12px">${ico.cadenas}</span>S'ouvre à ${montant(a.seuil)} de patrimoine</div>` : ""}
  </button></div>`;
}

// MARK: - L'achat (EcranAchatBien)

const etatAchat = (p) => etatDe(p, "achat", { aCredit: false, apport: 0, semaines: 20, assurance: "basique", franchise: 250000, signature: [], enCours: false });
const paiementImmo = (e) => (e.aCredit ? { credit: { apport: e.apport, semaines: e.semaines, ...(e.banque ? { banque: e.banque } : {}) } } : { comptant: {} });

/** La jauge d'état (JaugeEtat) : un trait (état connu) ou une plage (fourchette). */
const jaugeEtat = (bas, haut) => {
  const g = bas * 100, dr = 100 - Math.max(haut * 100, bas * 100 + 3);
  return `<div class="jauge-etat" aria-hidden="true"><i style="clip-path:inset(0 ${dr.toFixed(1)}% 0 ${g.toFixed(1)}% round 99px)"></i></div>`;
};

function blocVisite(a) {
  const etat = a.etatVisite != null ? `${Math.round(a.etatVisite * 100)} %` : `entre ${Math.round(a.fourchetteBas * 100)} et ${Math.round(a.fourchetteHaut * 100)} %`;
  let bas = "";
  if (a.etatVisite == null) {
    bas = `<p class="aide">${a.pro ? "Annonce d'un pro : la fourchette est assez serrée." : "Annonce d'un particulier : l'état réel peut être n'importe où dans la fourchette."}</p>
      ${a.surPlace ? pilule("Visiter", "visiter", { plein: true })
        : a.rendezVous ? `<p class="aide">Rendez-vous pris : le bien est sur le plan de ${esc(a.villeNom)}. Va à son adresse pour le visiter.</p>${pilule("Annuler la visite", "annulerRendezVous")}`
        : pilule("Prendre rendez-vous", "rendezVous", { plein: true })}`;
  } else {
    const total = a.diagnostic.reduce((s, x) => s + x.cout, 0);
    bas = a.diagnostic.map((x) => `<div class="pz-diag"><span class="pt" style="background:${x.grave ? "var(--alerte)" : "var(--or)"}"></span>
        <span style="flex:1"><div style="font-size:14px;font-weight:600">${esc(x.nom)}</div><div class="aide">${esc(x.detail)}</div></span>
        ${x.cout > 0 ? `<span class="chiffres" style="font-size:13px">${montant(x.cout)}</span>` : ""}</div>`).join("")
      + (a.levier > 0 ? note("main", `Plus abîmé que l'annonce ne le disait : le vendeur peut céder jusqu'à ${pourcent(a.levier)} de plus.`, "var(--gain)") : "")
      + (total > 0 ? `<p class="aide">Tout reprendre poste par poste : environ ${montant(total)}. Une rénovation complète, une fois le bien acheté, remet tout à neuf.</p>` : "");
  }
  return carte(`<div class="rangee entre" style="align-items:baseline">${label("cle_molette", "État")}<span class="chiffres" style="font-size:15px;letter-spacing:-.02em">${etat}</span></div>
    ${jaugeEtat(a.etatVisite ?? a.fourchetteBas, a.etatVisite ?? a.fourchetteHaut)}${bas}`, { classe: "pz-carte" });
}

function rendreAchat(d, ctx, p) {
  const a = d.a;
  if (!a) return `${entetePousse("Achat")}${vide("Ce bien n'existe pas.")}`;
  const e = etatAchat(p);
  const r = d.regles;
  const aPayer = e.aCredit ? e.apport : a.prix;
  const pret = !e.signature.length || e.enCours || a.vendeurParti || a.seuil != null || !a.enVente;
  const o = a.offre;
  return `${entetePousse("Achat")}
  <div class="pz-pile">
    ${facade({ icone: a.icone, rarete: a.rarete, hauteur: 150, pastille: true, photo: a.photo, prioritaire: true })}
    <div><div class="pz-gros">${esc(a.nom)}</div><div class="aide">${esc(a.drapeau)} ${esc(a.villeNom)}, loyer de marché ${montant(a.loyer)}/sem.</div></div>
    <div class="pz-prix"><span class="chiffres ${a.prix < a.base ? "gain" : ""}" style="font-size:36px">${montant(a.prix)}</span>${a.prix < a.base ? `<span class="barre">${montant(a.base)}</span>` : ""}</div>
    <div class="fiche-actions">${boutonEpingler(ctx, { sorte: "bien", cible: p.id })}${boutonFavori(ctx, "bien", p.id)}</div>
    ${blocVisite(a)}
    ${carte(`<div class="rangee entre">${label(a.pro ? "mallette" : "personneSeule", a.pro ? "Vendeur professionnel" : "Particulier")}${a.patience != null ? points(a.patience, a.patienceMax) : ""}</div>
      <div style="font-size:14px;font-weight:500;color:${a.vendeurParti ? "var(--alerte)" : "var(--texte2)"}">${esc(a.negociation)}</div>
      ${a.peutOffrir ? pilule("Faire une offre", "offre", { plein: true }) : ""}`, { classe: "pz-carte" })}
    ${carte(`<span class="libelle">Financement</span>
      ${segment([["comptant", "Comptant"], ["credit", "Crédit hypothécaire"]], e.aCredit ? "credit" : "comptant", "modeAchat")}
      ${e.aCredit ? `${champPave(`Apport ${montant(e.apport)}`, "apport")}
        <div class="pz-defile">${r.dureesCreditSemaines.map((s) => filtre(`${s} sem.`, e.semaines === s, "dureeCredit", { s })).join("")}</div>
        ${choixBanqueCredit(a.banquesCredit, e.banque, "banqueCredit")}
        ${o && e.banque ? `<div style="font-size:13px;font-weight:500;color:${o.accordee ? "var(--texte2)" : "var(--alerte)"}">${o.accordee ? `${montant(o.montant)} à ${pourcent(o.taux, 2)}, ${montant(o.echeance)} chaque dimanche.` : esc(o.refus ?? "Crédit refusé.")}</div>` : ""}
        <div style="font-size:12px;color:var(--texte2)">1 an réel = 1 semaine de jeu.</div>` : ""}`, { classe: "pz-carte" })}
    ${carte(`<span class="libelle">Assurance</span>
      ${r.assurances.map((x) => choixRadio(e.assurance === x.id, esc(x.nom), "", "assuranceAchat", { id: x.id })).join("")}
      <div class="aide">Franchise</div>
      <div class="pz-defile">${r.franchises.map((f) => filtre(montant(f.montantCentimes), e.franchise === f.montantCentimes, "franchiseAchat", { f: f.montantCentimes })).join("")}</div>
      <div class="aide">${montant(a.prime, { centimes: true })} de prime par semaine</div>`, { classe: "pz-carte" })}
    ${a.seuil != null ? note("cadenas", `Cette ville s'ouvre à ${montant(a.seuil)} de patrimoine.`, "var(--alerte)") : ""}
    ${papier(`<div style="display:flex;flex-direction:column;gap:12px">${titrePapier("Acte de vente", a.nom)}
      ${champPapier("Prix", montant(a.prix))}
      ${e.aCredit ? champPapier("Apport", montant(e.apport)) + champPapier("Crédit hypothécaire", montant(Math.max(0, a.prix - e.apport))) : ""}
      ${champPapier("À payer aujourd'hui", montant(aPayer), true)}
      <div style="font-size:12px;color:#6B675F;padding-top:4px">Signature de l'acquéreur</div>
      ${padSignature(e.signature)}</div>`, { empilee: false })}
    <button class="bouton" id="bouton-signer" data-action="acheterBien" ${pret ? "disabled" : ""}>${e.signature.length ? "Signer et acheter" : "Signe l'acte pour acheter"}</button>
  </div>`;
}

// MARK: - La fiche d'un bien (EcranBien)

const NOMS_ASSURANCE = { aucune: "Aucune", rc: "RC", basique: "Basique", complete: "Complète" };

/** LigneChantier (RNT-107) : ce qu'il fait, coûte, rapporte, et son risque. */
function ligneChantier(w) {
  return `<div class="rangee" style="align-items:flex-start;gap:12px">
    <span style="width:36px;height:36px;border-radius:50%;background:var(--puce);display:grid;place-items:center;flex:none;color:${w.fait ? "var(--gain)" : "var(--texte)"}"><span class="pz-ico">${w.fait ? ico.coche : ico.marteau}</span></span>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
      <div style="font-size:15px;font-weight:600">${esc(w.nom)}</div>
      ${w.detail ? `<div class="aide">${esc(w.detail)}</div>` : ""}
      <div style="font-size:12px;font-weight:500;color:var(--texte2)">${montant(w.cout)}, ${w.jours} jours${w.loyerPendant > 0 ? `, ${pourcent(w.loyerPendant)} du loyer` : ", sans loyer"}</div>
      <div style="font-size:12px;font-weight:600;color:var(--gain)">+${montant(w.gainValeur)} de valeur${w.gainLoyer > 0 ? `, loyer +${pourcent(w.gainLoyer)}` : ""}</div>
      ${w.risque > 0 && !w.fait ? `<div style="font-size:12px;color:${w.risque >= 0.3 ? "var(--alerte)" : "var(--texte2)"}">Risque de dérapage : ${pourcent(w.risque)}</div>` : ""}
      ${w.refus ? `<div style="font-size:12px;color:var(--texte2)">${esc(w.refus)}</div>` : ""}
    </div>
    ${w.refus == null ? pilule("Lancer", "travaux", { donnees: { id: w.id } }) : ""}
  </div>`;
}

/** CarteChantier : où il en est, ce que paie le locataire, son dérapage. */
function carteChantier(c, locataire) {
  const total = Math.max(1, c.joursPrevus + (c.retard ?? 0));
  return `${label("marteau", `${esc(c.nom)}, encore ${c.joursRestants} jour${c.joursRestants > 1 ? "s" : ""}`)}
    <div class="rangee">${railFin((total - c.joursRestants) / total)}</div>
    <p class="aide">${locataire != null ? (c.loyerPendant > 0 ? `Le locataire reste : il paie ${pourcent(c.loyerPendant)} du loyer pendant le chantier.` : "Pas de loyer pendant le chantier.") : "Le bien ne rapporte rien pendant le chantier."}</p>
    ${c.retard != null && c.surcout != null ? note("alerteTri", `Le chantier a dérapé : ${c.retard} jour${c.retard > 1 ? "s" : ""} de retard, ${montant(c.surcout)} de surcoût.`, "var(--alerte)")
      : c.cout > 0 ? `<p class="aide">Devis payé : ${montant(c.cout)}. À la fin, la valeur et le loyer montent.</p>` : ""}`;
}

/** RNT-221 : « 2 h 05 », « 4:12 » jusqu'à la fin d'une vente. */
export function resteVente(fin, m) {
  const s = Math.max(0, Math.floor((fin - m) / 1000));
  return s >= 3600 ? `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * RNT-221 (VenteEnCoursFiche) : ma vente en cours, lue dans le moteur (`t.enchere`), plus gardée par la page :
 * elle survit au rechargement. Le prix du moment, la fin, la réserve ; « Retirer la vente » tant que personne
 * n'atteint la réserve ; la vente dans la salle des ventes.
 */
export function venteEnCoursFiche(x, m) {
  return `<div class="ec-fiche"><div><div class="aide">${x.offre ? "Meilleure offre" : "Aucune offre à ta réserve"}</div>
      <div class="v chiffres ${x.offre ? "gain" : ""}">${montant(x.prix)}</div></div>
    <div class="fin"><div class="aide">Fin</div><b>${x.terminee ? "Terminée" : resteVente(x.fin, m)}</b></div></div>
    <p class="aide">En vente jusqu'à ${new Date(x.fin).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}, réserve ${montant(x.reserve)}. ${x.offre ? "Une offre passe ta réserve : la vente ira au bout." : "Sans offre à ta réserve à la fin, rien n'est vendu."}</p>
    <div class="ec-actions">${x.retirable ? pilule("Retirer la vente", "retirerEnchere", { donnees: { vente: x.vente } }) : ""}
      ${pilule("Voir dans la salle des ventes", "", { page: "encheres", p: { vente: x.vente } })}</div>`;
}

/** RNT-221 (BoutonMiseEnVente) : proposé seulement si la vente est possible ; sinon grisé, la raison dessous. */
export const boutonMiseEnVente = (reserve, refus) => `${pilule("Mettre aux enchères", "mettreAuxEncheres", { plein: true, donnees: { reserve }, desactive: !!refus })}
  ${refus ? `<div class="ec-raison">${esc(refus)}</div>` : ""}`;

/** CarteVenteAuxEncheres : le mettre en vente 24 h avec un prix de réserve. */
function carteEncheresBien(t, e, m) {
  const reserve = Math.round((t.valeur * e.part) / 10000) * 10000;
  return carte(`${label("marteau", "Aux enchères")}
    ${t.enchere ? venteEnCoursFiche(t.enchere, m) : `
    <p class="aide">Vingt-quatre heures de vente. Tu fixes un prix de réserve : en dessous, le bien reste à toi.</p>
    <div class="pz-defile">${[0.8, 1, 1.2].map((k) => filtre(k === 1 ? "Valeur" : pctSigne(k - 1), e.part === k, "partReserve", { k })).join("")}</div>
    <div class="ec-reserve">Réserve : ${montant(reserve)}</div>
    ${boutonMiseEnVente(reserve, t.refusEncheres)}`}`, { classe: "pz-carte" });
}

function rendreBien(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Bien")}${vide("Ce bien n'est plus à toi.")}`;
  const e = etatDe(p, "bien", { part: 1 });
  const statut = t.habite ? "Résidence" : t.locataire != null ? "Loué" : t.chantier ? "En travaux" : "Libre";
  const nomAssurance = t.assurances.find((x) => x.id === t.assurance)?.nom ?? t.assurance;

  let occupation;
  if (t.habite) occupation = `${label("maison", "Ta résidence principale")}${pilule("Libérer pour le louer", "quitter")}`;
  else if (t.chantier) occupation = carteChantier(t.chantier, t.locataire);
  else occupation = `${tete("cle", "var(--vente)", "Loyer", `<span class="aide">marché ${montant(t.loyerReference)}/sem.</span>`)}
    ${champPave(`${montant(t.loyer)} par semaine`, "loyer")}
    ${t.locataire != null ? `<div class="rangee" style="gap:8px">${label("cle", `Loué : ${esc(t.locataire.toLowerCase())}`, "", "font-size:15px;font-weight:600")}${pastilleRarete(t.locataireRarete, { enLigne: true })}<span class="espace"></span>${pilule("Fin du bail", "congedier")}</div>`
      : `<div class="aide">Candidats de la semaine</div>
      ${t.candidats.map((c) => `<div class="rangee" style="gap:10px">
        <div style="flex:1;min-width:0"><div class="rangee" style="gap:6px"><span style="font-size:15px;font-weight:600">${esc(c.nom)}</span>${pastilleRarete(c.rarete, { enLigne: true })}</div>
          <div style="font-size:12px;color:var(--texte2)">Jusqu'à ${montant(c.loyerMax)}/sem., impayés ${pourcent(c.impaye)}, dégâts ${pourcent(c.degats)}</div></div>
        ${c.accepte ? pilule("Louer", "louer", { categorie: t.enchere ? "" : "var(--vente)", donnees: { profil: c.id, nom: c.nom }, desactive: !!t.enchere }) : pilule("Trop cher", "louer", { desactive: true })}
      </div>`).join("")}`}
    ${pilule("Y habiter", "habiter", { desactive: !!t.enchere })}
    ${t.enchere ? `<div class="ec-raison">Il est en vente aux enchères : attends la fin de la vente.</div>` : ""}`;

  return `${entetePousse(t.nom)}
  <div class="pz-pile">
    ${facade({ icone: t.icone, rarete: t.rarete, hauteur: 150, lueur: t.habite, pastille: true, photo: t.photo, prioritaire: true })}
    <div style="display:flex;flex-direction:column;gap:4px">
      <div class="aide">${esc(t.drapeau)} ${esc(t.villeNom)}</div>
      <div class="pz-prix"><span class="chiffres" style="font-size:34px">${montant(t.valeur)}</span>${variationTexte(t.plusValue)}</div>
      ${ligneEtat("État", t.etat, pourcent(t.etat))}
    </div>
    ${papier(`<div style="display:flex;flex-direction:column;gap:9px">
      <div class="rangee entre" style="align-items:flex-start">${titrePapier("Titre de propriété", `${t.nom}, ${t.villeNom}`)}${etiquetteEncre(statut)}</div>
      ${champPapier("Nature", esc(lettreCap(t.type)))}
      ${champPapier("Loyer", t.habite ? "Tu y vis" : `${montant(t.loyer)}/sem. (marché ${montant(t.loyerReference)})`)}
      ${t.locataire != null ? champPapier("Locataire", esc(t.locataire)) : ""}
      ${champPapier("Assurance", `${esc(nomAssurance)}, ${montant(t.prime, { centimes: true })}/sem.`)}
      ${champPapier("Vente nette", montant(t.venteNette))}
      ${champPapier("Valeur", montant(t.valeur), true)}</div>`)}
    <div style="height:2px"></div>
    ${carteEncheresBien(t, e, ctx.maintenant())}
    ${carte(occupation, { classe: "pz-carte", attrs: 'style="gap:12px"' })}
    ${!t.chantier ? carte(`${tete("marteau", "var(--grandir)", "Rénover", `<span class="aide">payé au lancement</span>`)}
        ${t.travaux.map((w, i) => `${i ? `<div class="filet"></div>` : ""}${ligneChantier(w)}`).join("")}`, { classe: "pz-carte", attrs: 'style="gap:12px"' })
      : t.habite ? carte(carteChantier(t.chantier, null), { classe: "pz-carte" }) : ""}
    ${carte(`${tete("bouclier", "var(--argent)", "Assurance", `<span class="aide">${montant(t.prime, { centimes: true })}/sem.</span>`)}
      ${segment(t.assurances.map((x) => [x.id, NOMS_ASSURANCE[x.id] ?? x.nom]), t.assurance, "assuranceBien")}
      <div class="aide">Franchise</div>
      <div class="pz-defile">${t.franchises.map((f) => filtre(montant(f), t.franchise === f, "franchiseBien", { f })).join("")}</div>`, { classe: "pz-carte" })}
    ${carte(interrupteur(t.liquide, `<div class="libelle">Loyer en liquide</div><div class="aide">Non déclaré : il part dans ton argent sale. Un contrôle réclame 40 % d'impôt, plus une amende.</div>`, "loyerLiquide"), { pad: true })}
    ${bouton(`Vendre, ${montant(t.venteNette)} après frais d'agence`, "vendreBien", { genre: "secondaire", desactive: !!t.enchere })}
  </div>`;
}

// MARK: - Les pages

export const pages = {
  marcheImmo: {
    titre: "Marché immobilier",
    async donnees(ctx) {
      const [t, monde, dispo] = await Promise.all([ctx.tableau("immobilier"), balance(ctx, "monde"), argentDisponible(ctx)]);
      return { t, pays: monde?.pays ?? [], dispo };
    },
    rendu(d, ctx, p) {
      if (!d.t) return `${entetePousse("Marché immobilier")}${vide("Le marché s'ouvre avec ta première saison.")}`;
      const t = d.t;
      const nomPays = (c) => d.pays.find((x) => x.code === c);
      const codes = [...new Set(t.annonces.map((a) => a.codePays))].sort((a, b) => {
        if (a === t.residence || b === t.residence) return a === t.residence ? -1 : 1;
        return (nomPays(a)?.nom ?? a).localeCompare(nomPays(b)?.nom ?? b, "fr");
      });
      const { choisi } = annoncesFiltrees(d, p);
      const pc = nomPays(choisi);
      return `${entetePousse("Marché immobilier")}
      <div class="pz-pile">
        <label class="carte pz-menu"><span style="font-size:22px">${esc(pc?.drapeau ?? "🌍")}</span>
          <span style="flex:1"><div style="font-size:12px;color:var(--texte2)">Pays</div><div style="font-size:16px;font-weight:600">${esc(pc?.nom ?? choisi)}</div></span>
          <span class="pz-ico" style="color:var(--texte2);width:16px;height:16px">${ico.hautBas}</span>
          <select data-saisie="choisirPays" aria-label="Pays">${codes.map((c) => `<option value="${esc(c)}" ${c === choisi ? "selected" : ""}>${esc(nomPays(c)?.drapeau ?? "")} ${esc(nomPays(c)?.nom ?? c)}${c === t.residence ? ", chez toi" : ""}</option>`).join("")}</select>
        </label>
        <div class="pz-pile" style="gap:10px">
          ${teteListe({ id: "biens", etat: listeBiens(p), invite: "Loft, Lisbonne, maison…", tris: TRIS_BIENS })}
          <div id="biens-corps" class="pz-pile">${corpsMarche(d, p)}</div>
        </div>
      </div>`;
    },
    actions: {
      ...actionsListe("biens", listeBiens, TRIS_BIENS, (ctx, d, p) => repeindre("biens", corpsMarche(d, p))),
      choisirPays(ctx, el, d, p) { etatDe(p, "pays", () => ({ code: null })).code = el.value; listeBiens(p).montres = 40; ctx.rafraichir(); },
    },
  },

  achat: {
    titre: "Achat",
    async donnees(ctx, p) {
      const e = etatAchat(p);
      const [a, regles] = await Promise.all([
        ctx.tableau("apercuAchat", { id: p.id, paiement: paiementImmo(e), assurance: e.assurance, franchise: e.franchise }),
        balance(ctx, "immobilier"),
      ]);
      cibleSignature(e.signature, () => majBoutonSigner(a, e));
      return { a, regles };
    },
    rendu: rendreAchat,
    actions: {
      async visiter(ctx, b, d, p) { await ctx.decider("immobilier", { visiter: { bien: p.id } }); },
      async rendezVous(ctx, b, d, p) { await ctx.decider("immobilier", { rendezVous: { bien: p.id } }, { succes: `Le bien est sur le plan de ${d.a.villeNom} : vas-y pour le visiter` }); },
      async annulerRendezVous(ctx, b, d, p) { await ctx.decider("immobilier", { annulerRendezVous: { bien: p.id } }); },
      offre(ctx, b, d, p) {
        pave(ctx, { titre: "Ton offre", aide: `Prix demandé : ${montant(d.a.prix)}`, proposition: Math.trunc((d.a.prix * 0.92) / 100) * 100,
          valider: (v) => ctx.decider("immobilier", { offrir: { bien: p.id, _1: v } }) });
      },
      async modeAchat(ctx, b, d, p) {
        const e = etatAchat(p);
        e.aCredit = b.dataset.valeur === "credit";
        if (e.aCredit) e.apport = Math.max(e.apport, d.a.apportMinimum);
        await ctx.rafraichir();
      },
      apport(ctx, b, d, p) {
        const e = etatAchat(p);
        pave(ctx, { titre: "Apport", aide: `Au moins ${montant(d.a.apportMinimum)}`, proposition: e.apport, maximum: d.a.prix,
          valider: async (v) => { e.apport = v; ctx.fermerFeuille(); await ctx.rafraichir(); } });
      },
      async dureeCredit(ctx, b, d, p) { etatAchat(p).semaines = Number(b.dataset.s); await ctx.rafraichir(); },
      async banqueCredit(ctx, b, d, p) { etatAchat(p).banque = b.dataset.banque; await ctx.rafraichir(); }, // RNT-219
      async assuranceAchat(ctx, b, d, p) { etatAchat(p).assurance = b.dataset.id; await ctx.rafraichir(); },
      async franchiseAchat(ctx, b, d, p) { etatAchat(p).franchise = Number(b.dataset.f); await ctx.rafraichir(); },
      async effacerSignature(ctx, b, d, p) { etatAchat(p).signature.length = 0; await ctx.rafraichir(); },
      async acheterBien(ctx, b, d, p) {
        const e = etatAchat(p);
        if (e.enCours || !e.signature.length) return;
        e.enCours = true;
        const ok = await ctx.decider("immobilier", { acheter: { bien: p.id, paiement: paiementImmo(e), assurance: e.assurance, franchise: e.franchise } },
          { succes: `${d.a.nom} est à toi` });
        e.enCours = false;
        if (ok) { oublierEtat(p, "achat"); await ctx.retour(); }
      },
    },
  },

  bien: {
    titre: "Bien",
    async donnees(ctx, p) { return { t: await ctx.tableau("bien", { id: p.id }) }; },
    rendu: (d, ctx, p) => Z.avecFinition(rendreBien(d, ctx, p), "facade"), // RNT-231
    actions: {
      loyer(ctx, b, d, p) {
        pave(ctx, { titre: "Loyer par semaine", aide: `Marché : ${montant(d.t.loyerReference)}. Plus cher : moins de candidats`, proposition: d.t.loyer,
          valider: (v) => ctx.decider("immobilier", { loyer: { bien: p.id, _1: v } }, { succes: `Loyer fixé à ${montant(v)}` }) });
      },
      quitter(ctx, b, d, p) {
        // RNT-190 : quitter le bien qu'on habite, sans autre logement, met à la rue : on le dit avant.
        if (!d.t.avertissementRue) return ctx.decider("immobilier", { quitter: { bien: p.id } }, { succes: "Libéré, à louer" });
        confirmer(ctx, {
          titre: "Quitter ton logement ?", message: d.t.avertissementRue,
          boutons: [{ texte: "Libérer et vivre à la rue", genre: "danger", faire: () => ctx.decider("immobilier", { quitter: { bien: p.id } }, { succes: "Libéré : tu es à la rue" }) }],
        });
      },
      congedier: (ctx, b, d, p) => ctx.decider("immobilier", { congedier: { bien: p.id } }, { succes: "Bail terminé" }),
      louer: (ctx, b, d, p) => ctx.decider("immobilier", { louer: { bien: p.id, profil: b.dataset.profil } }, { succes: `${b.dataset.nom} emménage` }),
      habiter: (ctx, b, d, p) => ctx.decider("immobilier", { habiter: { bien: p.id } }, { succes: "Tu emménages" }),
      travaux(ctx, b, d, p) {
        const w = d.t.travaux.find((x) => x.id === b.dataset.id);
        if (!w) return;
        confirmer(ctx, {
          titre: `${w.nom} : ${montant(w.cout)} ?`,
          message: `${w.jours} jours prévus${w.loyerPendant > 0 ? `, ${pourcent(w.loyerPendant)} du loyer pendant le chantier` : ", sans loyer"}${w.risque > 0 ? `. Un chantier sur ${Math.max(2, Math.round(1 / w.risque))} dérape : retard et surcoût.` : "."}`,
          boutons: [{ texte: "Lancer le chantier", faire: () => ctx.decider("immobilier", { travaux: { bien: p.id, _1: w.id } }, { succes: `${w.nom} : chantier lancé` }) }],
        });
      },
      assuranceBien: (ctx, b, d, p) => ctx.decider("immobilier", { assurer: { bien: p.id, assurance: b.dataset.valeur, franchise: d.t.franchise } }),
      franchiseBien: (ctx, b, d, p) => ctx.decider("immobilier", { assurer: { bien: p.id, assurance: d.t.assurance, franchise: Number(b.dataset.f) } }),
      loyerLiquide: (ctx, b, d, p) => ctx.decider("illegal", { loyerLiquide: { bien: p.id, _1: !d.t.liquide } }),
      async partReserve(ctx, b, d, p) { etatDe(p, "bien", {}).part = Number(b.dataset.k); await ctx.rafraichir(); },
      async mettreAuxEncheres(ctx, b, d, p) {
        const reserve = Number(b.dataset.reserve);
        b.disabled = true;
        b.textContent = "Mise en vente…";
        // RNT-221 : la fiche relit la vente dans le moteur (t.enchere) : rien à garder ici.
        const ok = await ctx.commande("encheres.mettreBien", { bien: p.id, reserve }, { succes: "En vente pour 24 h" });
        if (!ok) { b.disabled = false; b.textContent = "Mettre aux enchères"; }
      },
      retirerEnchere: (ctx, b) => ctx.commande("encheres.retirer", { vente: b.dataset.vente }, { succes: "Vente retirée" }),
      vendreBien(ctx, b, d, p) {
        confirmer(ctx, {
          titre: "Vendre ce bien ?", message: "3 % de frais d'agence. Un crédit lié continue d'être remboursé." + (d.t.avertissementRue ? ` ${d.t.avertissementRue}` : ""),
          boutons: [{ texte: `Vendre pour ${montant(d.t.venteNette)}`, faire: async () => { if (await ctx.decider("immobilier", { vendre: { bien: p.id } }, { succes: "Vendu" })) await ctx.retour(); } }],
        });
      },
    },
  },
};

/** Après un trait : le bouton s'allume sans tout redessiner (la page garde son défilement). */
function majBoutonSigner(a, e) {
  const b = document.getElementById("bouton-signer");
  if (!b || !a) return;
  b.textContent = "Signer et acheter";
  b.disabled = e.enCours || a.vendeurParti || a.seuil != null || !a.enVente;
}

// Lot D : les photos des biens, et au grand écran le marché garde ses annonces à gauche, l'achat à droite.
for (const id of ["achat", "bien"]) {
  const def = pages[id];
  pages[id] = { ...def, async donnees(ctx, p) { await chargerPhotos(); return def.donnees(ctx, p); } };
}
const marcheListe = pages.marcheImmo;
pages.marcheImmo = listeEtDetail("marcheImmo", {
  ...marcheListe,
  async donnees(ctx, p) { await chargerPhotos(); return marcheListe.donnees(ctx, p); },
}, { achat: pages.achat }, {
  vide: () => videDetail("Choisis un bien", "Sa visite, l'offre au vendeur et l'acte de vente s'ouvrent ici, sans quitter les annonces."),
});
const sectionDonneesImmo = section.donnees;
section.donnees = async (ctx) => { await chargerPhotos(); return sectionDonneesImmo(ctx); };
