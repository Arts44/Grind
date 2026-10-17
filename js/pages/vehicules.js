// ══════════════════════════════════════════════════════════════════════
//  Zone « vehicules » (D186, vague 1) — EcransVehicules.swift et
//  FeuilleAtelier.swift, écran pour écran :
//    section        ← SectionVehicules    (onglet Actifs, tableau « garage »)
//    concession     ← EcranConcession     (neuf et occasion, recherche, tri, filtres)
//    configurateur  ← EcranConfigurateur  (teinte, options, négociation, financement, bon signé)
//    occasion       ← EcranOccasion       (inspection, négociation, financement, bon signé)
//    vehicule       ← EcranVehicule       (+ FeuilleAtelier, la vente pro ou au noir, le leasing)
//    permis         ← EcranPermis         (inscription, révision, formation, examen)
//  Les briques communes viennent de immobilier.js.
// ══════════════════════════════════════════════════════════════════════
import { boutonEpingler } from "./objectifs.js";
import { montant, pourcent, esc } from "../format.js";
import { carte, ligne, ligneValeur, bouton, segment, entetePousse, vide } from "../ui.js";
import {
  ico, pilule, filtre, choixRadio, interrupteur, champPave, tete, label, note, ligneEtat, points, papier, titrePapier, champPapier,
  etiquetteEncre, padSignature, cibleSignature, pave, confirmer, pastilleRarete, teinteRarete, possession, selecteurDisposition,
  lireDisposition, dispositionActifs, etatDe, oublierEtat, balance, argentDisponible, teteListe, pastillesListe, compteListe, plusListe,
  nouvelleListe, contient, actif, trier, actionsListe, repeindre, variationTexte, lettreCap, nombre, pctSigne,
} from "./immobilier.js";
import { photo as photoCatalogue, chargerPhotos, listeEtDetail, estChoisi, videDetail } from "./catalogues.js";

// MARK: - La vitrine (VitrineVehicule) et les silhouettes

/** Une voiture de profil, l'avant à droite : coffre, lunette, toit, pare-brise, capot. */
function auto(c, o) {
  const { x0 = 8, x1 = 112, bas = 42, l = 30, toit = 15, t0 = 40, t1 = 74, lun = 26, pb = 88, r1 = 28, r2 = 92, r = 8.5, ouvert = false, plateau = 0 } = o;
  const corps = `M${x0} ${bas} L${x0} ${l + 3} Q${x0} ${l - 1} ${x0 + 5} ${l - 1} L${lun} ${l - 1} ${ouvert ? `L${t1 + 4} ${l - 1}` : `L${t0} ${toit} Q${(t0 + t1) / 2} ${toit - 1.5} ${t1} ${toit}`} L${pb} ${l - 1} L${x1 - 5} ${l} Q${x1} ${l + 1} ${x1} ${l + 5} L${x1} ${bas} Z`;
  const vitre = ouvert
    ? `<path d="M${t1 + 4} ${l - 1} L${t1 + 9} ${l - 9}" stroke="#9fb4c9" stroke-width="2" stroke-linecap="round"/><path d="M${lun + 8} ${l - 1} q2 -7 7 -7 h3 v7z M${lun + 24} ${l - 1} q2 -7 7 -7 h3 v7z" fill="#1c1d21"/>`
    : `<path d="M${lun + 3} ${l - 2} L${t0 + 1.5} ${toit + 2.5} L${t1 - 1} ${toit + 2.5} L${pb - 3} ${l - 2} Z" fill="url(#vitre)"/><path d="M${(t0 + t1) / 2 + 2} ${toit + 2.5} L${(t0 + t1) / 2 + 2} ${l - 2}" stroke="${c}" stroke-width="2"/>`;
  const caisse = plateau ? `<path d="M${x0 + 2} ${l + 1} H${plateau}" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>` : "";
  return `<path d="${corps}" fill="${c}"/><path d="${corps}" fill="url(#reflet)" stroke="rgba(255,255,255,.22)" stroke-width=".6"/>${vitre}${caisse}
    <path d="M${x0 + 4} ${l + 7} H${x1 - 4}" stroke="rgba(0,0,0,.18)" stroke-width="1"/>
    <rect x="${x1 - 5}" y="${l + 2}" width="4" height="2.4" rx="1" fill="#fff6d0"/><rect x="${x0}" y="${l + 2}" width="3" height="2.4" rx="1" fill="#e2453b"/>
    ${roue(r1, bas, r)}${roue(r2, bas, r)}`;
}
const roue = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#141518"/><circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="#8A9098"/><circle cx="${x}" cy="${y}" r="${r * 0.18}" fill="#2a2c30"/>`;
const roueFine = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#141518" stroke-width="2.6"/><circle cx="${x}" cy="${y}" r="1.4" fill="#8A9098"/>`;
const eau = `<rect x="0" y="44" width="120" height="16" fill="#18324a" opacity=".7"/><path d="M0 44 q5 -2 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0" stroke="#5f8db5" stroke-width="1" fill="none" opacity=".6"/>`;

const FORMES = {
  citadine: (c) => auto(c, { x0: 18, x1: 104, l: 29, toit: 14, t0: 42, t1: 70, lun: 22, pb: 84, r1: 34, r2: 88, r: 8 }),
  berline: (c) => auto(c, { x0: 6, x1: 114, l: 30, toit: 16, t0: 40, t1: 72, lun: 26, pb: 90, r1: 26, r2: 94 }),
  break: (c) => auto(c, { x0: 6, x1: 114, l: 30, toit: 15, t0: 22, t1: 74, lun: 12, pb: 90, r1: 26, r2: 94 }),
  suv: (c) => auto(c, { x0: 8, x1: 112, l: 27, toit: 11, t0: 26, t1: 76, lun: 14, pb: 90, r1: 28, r2: 92, r: 10, bas: 41 }),
  sportive: (c) => auto(c, { x0: 6, x1: 114, l: 33, toit: 20, t0: 42, t1: 68, lun: 24, pb: 92, r1: 26, r2: 94, r: 8.5, bas: 43 }),
  cabriolet: (c) => auto(c, { x0: 6, x1: 114, l: 32, t1: 66, lun: 22, pb: 88, r1: 26, r2: 94, ouvert: true, bas: 43 }),
  hypercar: (c) => auto(c, { x0: 4, x1: 116, l: 34, toit: 23, t0: 46, t1: 66, lun: 22, pb: 98, r1: 24, r2: 96, r: 8.5, bas: 43 }),
  pickup: (c) => auto(c, { x0: 6, x1: 114, l: 28, toit: 12, t0: 52, t1: 78, lun: 48, pb: 92, r1: 26, r2: 94, r: 9.5, plateau: 48 }),
  van: (c) => auto(c, { x0: 8, x1: 112, l: 26, toit: 7, t0: 12, t1: 86, lun: 8, pb: 100, r1: 28, r2: 92, r: 8.5 }),
  velo: (c) => `${roueFine(32, 38, 12)}${roueFine(88, 38, 12)}<path d="M32 38 L50 38 L74 20 L46 20 Z M50 38 L44 14 M40 14 h9 M74 20 L88 38 M74 20 L71 12 h7" stroke="${c}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
  trottinette: (c) => `${roueFine(26, 42, 7)}${roueFine(94, 42, 7)}<path d="M26 42 L36 38 H84 L94 42 M86 38 L80 8 M73 8 h14" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  scooter: (c) => `${roue(28, 41, 8)}${roue(92, 41, 8)}<path d="M14 36 Q16 26 30 26 H52 Q58 26 60 34 H74 L84 12 H90 L88 18 L96 34 Q100 40 92 40 H18 Z" fill="${c}"/><path d="M28 24 Q30 18 40 19 H52 Q54 24 50 26 H30 Z" fill="#1c1d21"/>`,
  moto: (c) => `${roue(28, 40, 10)}${roue(94, 40, 10)}<path d="M28 40 L48 28 H70 L80 20 L94 40" stroke="#3a3c42" stroke-width="3" fill="none"/><path d="M44 26 Q46 18 58 18 H72 Q80 18 82 24 L76 30 H50 Z" fill="${c}"/><path d="M30 26 Q36 22 46 24 L44 28 H32 Z" fill="#1c1d21"/><path d="M80 18 L86 10 H92" stroke="#3a3c42" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  bateau: (c) => `${eau}<path d="M8 32 H108 L100 46 H20 Z" fill="${c}"/><path d="M40 32 V22 H74 L82 32 Z" fill="#e8ecf0"/><path d="M46 25 H72 L76 30 H46 Z" fill="url(#vitre)"/>`,
  voilier: (c) => `${eau}<path d="M14 36 H106 L96 46 H24 Z" fill="${c}"/><path d="M60 34 V4" stroke="#c9ced6" stroke-width="1.6"/><path d="M62 6 L96 32 H62 Z" fill="#f2f3f5"/><path d="M58 9 L34 32 H58 Z" fill="#dfe3e8"/>`,
  yacht: (c) => `${eau}<path d="M4 30 H112 L104 46 H18 Z" fill="${c}"/><path d="M24 30 V22 H82 L94 30 Z" fill="#f2f3f5"/><path d="M38 22 V15 H74 L80 22 Z" fill="#e3e6ea"/><path d="M28 24 H84 L88 28 H28 Z M42 17 H72 L75 20 H42 Z" fill="url(#vitre)"/>`,
  // RNT-188 : les silhouettes des bateaux en plus (semi-rigide, jet-ski, catamaran, mégayacht).
  semirigide: (c) => `${eau}<path d="M10 34 Q8 30 14 30 H98 Q110 30 108 38 Q104 44 96 44 H22 Q12 44 10 34 Z" fill="#2b2f36"/><path d="M14 30 H98 Q106 30 106 35 H12 Q10 30 14 30 Z" fill="${c}"/><path d="M52 30 V20 H66 L70 30 Z" fill="#e8ecf0"/><path d="M56 22 H65 L67 28 H56 Z" fill="url(#vitre)"/><rect x="20" y="26" width="6" height="8" rx="1.5" fill="#1c1d21"/>`,
  jetski: (c) => `${eau}<path d="M28 40 Q24 36 32 34 L64 30 Q86 28 98 36 Q100 42 92 43 H34 Q28 43 28 40 Z" fill="${c}"/><path d="M48 31 Q50 25 58 25 H66 L64 30 Z" fill="#1c1d21"/><path d="M70 28 L78 18 H84" stroke="#3a3c42" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  catamaran: (c) => `${eau}<path d="M12 38 H58 L54 45 H18 Z M64 38 H110 L106 45 H70 Z" fill="${c}"/><path d="M16 32 H106 V38 H16 Z" fill="#e8ecf0"/><path d="M34 32 V26 H86 L92 32 Z" fill="#f2f3f5"/><path d="M38 27 H84 L87 31 H38 Z" fill="url(#vitre)"/><path d="M60 26 V2" stroke="#c9ced6" stroke-width="1.6"/><path d="M62 4 L90 24 H62 Z" fill="#f2f3f5"/>`,
  megayacht: (c) => `${eau}<path d="M2 32 H116 L108 46 H14 Z" fill="${c}"/><path d="M14 32 V25 H96 L106 32 Z" fill="#f2f3f5"/><path d="M26 25 V18 H84 L90 25 Z" fill="#e8ebee"/><path d="M40 18 V12 H72 L76 18 Z" fill="#dfe3e8"/><path d="M18 27 H98 L100 30 H18 Z M30 20 H84 L86 23 H30 Z M44 14 H72 L73 16 H44 Z" fill="url(#vitre)"/><path d="M58 12 V5 M54 6 H62" stroke="#c9ced6" stroke-width="1.4"/>`,
  avion: (c) => `<path d="M10 28 Q14 22 30 22 H96 Q110 22 114 28 Q110 33 96 33 H22 Q12 33 10 28 Z" fill="${c}"/><path d="M14 22 L8 10 H16 L28 22 Z" fill="${c}"/><path d="M56 30 L46 44 H56 L72 30 Z" fill="${c}" opacity=".8"/><path d="M98 24 Q106 24 110 28 H98 Z" fill="url(#vitre)"/><path d="M114 22 V34" stroke="#3a3c42" stroke-width="1.6"/>${roue(60, 46, 3.5)}${roue(100, 44, 3)}`,
  jet: (c) => `<path d="M6 30 Q10 24 26 24 H96 Q114 25 118 30 Q114 35 96 36 H24 Q10 36 6 30 Z" fill="${c}"/><path d="M12 24 L4 8 H14 L30 24 Z" fill="${c}"/><path d="M50 33 L36 48 H48 L70 33 Z" fill="${c}" opacity=".85"/><rect x="20" y="20" width="16" height="6" rx="3" fill="#8A9098"/>${[0, 1, 2, 3, 4, 5].map((k) => `<rect x="${44 + k * 8}" y="27" width="4" height="3" rx="1.5" fill="url(#vitre)"/>`).join("")}<path d="M104 26 Q112 27 115 30 H104 Z" fill="url(#vitre)"/>`,
  helico: (c) => `<path d="M14 6 H106" stroke="#2a2c30" stroke-width="2.2" stroke-linecap="round"/><path d="M60 6 V14" stroke="#2a2c30" stroke-width="3"/><path d="M8 24 H52" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M6 18 V30" stroke="#2a2c30" stroke-width="2"/><path d="M44 16 Q48 14 62 14 H78 Q96 16 100 30 Q98 38 84 38 H56 Q44 38 42 28 Z" fill="${c}"/><path d="M78 17 Q92 19 96 30 H80 Z" fill="url(#vitre)"/><path d="M50 46 H96 M60 38 V46 M86 38 V46" stroke="#2a2c30" stroke-width="2" stroke-linecap="round"/>`,
};
const DEFS = `<defs><linearGradient id="vitre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3442"/><stop offset="1" stop-color="#0f1319"/></linearGradient>
  <linearGradient id="reflet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient></defs>`;

/**
 * VitrineVehicule : fond de showroom, projecteur, reflet au sol, liseré de rareté ; la vraie photo du
 * modèle (`photo`, l'identifiant du modèle) par-dessus la silhouette, qui reste en repli.
 */
export function vitrine({ forme, teinte, rarete = 0, hauteur = 110, eteinte = false, pastille = false, largeur = "", photo = "", prioritaire = false }) {
  const c = teinteRarete(rarete);
  const dessin = (FORMES[forme] ?? FORMES.berline)(teinte || "#3A3D45");
  return `<div class="vitrine" style="--h:${hauteur}px;${largeur ? `--l:${largeur}px;` : ""}background:linear-gradient(#23252B,#0D0E11);${c ? `--bord:2px solid ${c}` : ""}" aria-hidden="true">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0, rgba(255,255,255,${eteinte ? 0.04 : 0.16}), transparent 70%)"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:24%;background:linear-gradient(rgba(255,255,255,.05),transparent)"></div>
    <svg viewBox="0 0 120 56" preserveAspectRatio="xMidYMax meet" style="position:absolute;left:10%;right:10%;bottom:${hauteur * 0.1}px;width:80%;height:74%;${eteinte ? "filter:saturate(.2);opacity:.55" : ""}">${DEFS}
      <ellipse cx="60" cy="52" rx="52" ry="3" fill="#000" opacity=".45"/>${dessin}</svg>
    ${photoCatalogue("vehicule", photo, { eteinte, prioritaire })}
    ${pastille ? pastilleRarete(rarete) : ""}
  </div>`;
}

/** CartePermis : la catégorie en grand, l'état en bas. */
function cartePermis(code, nom, obtenu) {
  return `<div style="width:104px;height:66px;flex:none;padding:10px;border-radius:10px;display:flex;flex-direction:column;justify-content:space-between;
      background:${obtenu ? "linear-gradient(135deg,#F3D9E4,#D9E6F2)" : "linear-gradient(var(--puce2),var(--puce))"};border:1px solid rgba(255,255,255,${obtenu ? 0.5 : 0.1})" role="img" aria-label="${esc(nom)}, ${obtenu ? "obtenu" : "pas encore"}">
    <div class="rangee entre" style="align-items:flex-start"><span style="font-size:20px;font-weight:800;line-height:1;color:${obtenu ? "#1C3B6E" : "var(--texte2)"}">${esc(code)}</span>
      <span class="pz-ico" style="width:14px;height:14px;color:${obtenu ? "#2E6B4F" : "var(--texte3)"}">${obtenu ? ico.sceau : ico.sceau.replace('<path d="M8.5 12l2.4 2.4 4.6-4.8"/>', "")}</span></div>
    <div style="font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${obtenu ? "#33384A" : "var(--texte2)"}">${esc(nom)}</div>
  </div>`;
}

/** Ce que dit une assurance, en une phrase (texteAssurance). */
const texteAssurance = (a) => (a.couvre < 0.01 ? "Les dégâts sur ton véhicule restent pour toi." : a.couvre < 0.99 ? "La moitié des dégâts, au-delà de la franchise." : "Tout, au-delà de la franchise.");

// MARK: - Les options (OptionsVehicule.swift)

const FAMILLES = [
  { id: "confort", nom: "Confort", icone: "canape", teinte: "var(--image)", aide: "Du plaisir à chaque trajet." },
  { id: "route", nom: "Route", icone: "route", teinte: "var(--equipe)", aide: "Des trajets plus courts." },
  { id: "economie", nom: "Économie", icone: "feuille", teinte: "var(--argent)", aide: "Trajets, entretien et assurance moins chers." },
  { id: "prestige", nom: "Prestige", icone: "couronne", teinte: "var(--grandir)", aide: "La cote tient mieux, la reprise est plus chère." },
];
const virgule = (x, d) => x.toFixed(d).replace(".", ",");
/** EffetsOption.textes : « +0,6 de plaisir par trajet »… */
function textesEffets(e) {
  const l = [];
  if (e?.moral > 0) l.push(`+${virgule(e.moral, 1)} de plaisir par trajet`);
  if (e?.trajet > 0) l.push(`−${virgule(e.trajet * 100, 1)} % de temps de trajet`);
  if (e?.couts > 0) l.push(`−${virgule(e.couts * 100, 1)} % de coûts`);
  if (e?.prestige > 0) l.push(`+${virgule(e.prestige * 100, 1)} % de prestige`);
  return l;
}
const effetsVides = (e) => !textesEffets(e).length;

/** ResumeEffets : le total de ce qu'apportent les options, en quatre cases. */
function resumeEffets(e) {
  const caseEffet = (f, v, unite) => `<div class="rangee" style="gap:8px;padding:10px;border-radius:12px;background:color-mix(in srgb, ${f.teinte} ${v == null ? 4 : 10}%, transparent)">
    <span class="pastille" style="--c:${f.teinte};width:24px;height:24px;border-radius:7px"><span class="pz-ico" style="width:13px;height:13px">${ico[f.icone]}</span></span>
    <span style="min-width:0"><div class="chiffres" style="font-size:15px;font-weight:700;letter-spacing:-.02em;color:${v == null ? "var(--texte3)" : f.teinte}">${v ?? "—"}</div>
    <div style="font-size:11px;color:var(--texte2);white-space:nowrap">${unite}</div></span></div>`;
  return carte(`<span class="libelle">Ce que tes options t'apportent</span>
    <div class="grille2" style="gap:8px">
      ${caseEffet(FAMILLES[0], e?.moral != null ? `+${virgule(e.moral, 1)}` : null, "plaisir / trajet")}
      ${caseEffet(FAMILLES[1], e?.trajet != null ? `−${virgule(e.trajet * 100, 1)} %` : null, "de trajet")}
      ${caseEffet(FAMILLES[2], e?.couts != null ? `−${virgule(e.couts * 100, 1)} %` : null, "de coûts")}
      ${caseEffet(FAMILLES[3], e?.prestige != null ? `+${virgule(e.prestige * 100, 1)} %` : null, "de prestige")}
    </div>`, { classe: "pz-carte" });
}

/** ChoixUnique : jantes et intérieur, un seul de chaque. */
function choixUnique(titre, options, choisi, action, poses = []) {
  return carte(`<span class="libelle">${titre}</span>
    <div style="display:flex;gap:8px">${options.map((o) => {
      const oui = choisi === o.id;
      const teinte = FAMILLES.find((f) => f.id === o.famille)?.teinte ?? "var(--texte)";
      const e = textesEffets(o.effets)[0];
      return `<button data-action="${action}" data-id="${esc(o.id)}" aria-pressed="${oui}" style="flex:1;min-width:0;min-height:64px;padding:8px 4px;border-radius:12px;text-align:center;
          border:${oui ? `1.5px solid ${teinte}` : "1px solid var(--filet2)"};background:${oui ? `color-mix(in srgb, ${teinte} 14%, transparent)` : "none"};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px">
        <span style="font-size:14px;font-weight:600">${esc(o.nom)}</span>
        <span style="font-size:12px;color:var(--texte2);font-variant-numeric:tabular-nums">${poses.includes(o.id) ? "Monté" : o.cout === 0 ? "Inclus" : `+${montant(o.cout)}`}</span>
        ${e ? `<span style="font-size:10px;font-weight:600;color:${teinte};line-height:1.2">${esc(e)}</span>` : ""}</button>`;
    }).join("")}</div>`, { classe: "pz-carte" });
}

/** ChoixPacks : les packs, une famille à la fois. */
function choixPacks(packs, choisis, famille, actionFamille, actionPack, poses = []) {
  const f = FAMILLES.find((x) => x.id === famille) ?? FAMILLES[0];
  return carte(`<span class="libelle">Packs</span>
    <div style="display:flex;gap:6px">${FAMILLES.map((x) => {
      const n = packs.filter((p) => p.famille === x.id && choisis.includes(p.id)).length;
      const a = x.id === f.id;
      return `<button data-action="${actionFamille}" data-f="${x.id}" aria-pressed="${a}" style="position:relative;flex:1;min-width:0;min-height:52px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
          color:${a ? "#fff" : "var(--texte2)"};background:${a ? `linear-gradient(135deg, ${x.teinte}, color-mix(in srgb, ${x.teinte} 72%, transparent))` : "rgba(255,255,255,.04)"}">
        <span class="pz-ico" style="width:15px;height:15px">${ico[x.icone]}</span><span style="font-size:11px;font-weight:600">${x.nom}</span>
        ${n ? `<span style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:50%;font-size:10px;font-weight:700;color:#fff;background:${x.teinte};border:1.5px solid var(--fond);display:grid;place-items:center">${n}</span>` : ""}</button>`;
    }).join("")}</div>
    <p class="aide">${f.aide}</p>
    <div style="display:flex;flex-direction:column;gap:4px">${packs.filter((p) => p.famille === f.id).map((p) => {
      const pris = choisis.includes(p.id);
      const e = textesEffets(p.effets).join(", ");
      return `<button data-action="${actionPack}" data-id="${esc(p.id)}" aria-pressed="${pris}" style="display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:12px;text-align:left;background:${pris ? `color-mix(in srgb, ${f.teinte} 10%, transparent)` : "none"}">
        <span style="width:20px;height:20px;border-radius:50%;flex:none;display:grid;place-items:center;${pris ? `background:${f.teinte};color:#fff` : "border:1.5px solid var(--texte3)"}">${pris ? `<span class="pz-ico" style="width:12px;height:12px">${ico.coche}</span>` : ""}</span>
        <span style="flex:1;min-width:0"><span style="font-size:14px;font-weight:600">${esc(p.nom)}</span>${p.visible ? ` <span style="font-size:10px;font-weight:600;color:var(--texte2)">· se voit</span>` : ""}
          ${e ? `<div style="font-size:12px;font-weight:500;color:${f.teinte}">${esc(e)}</div>` : ""}</span>
        <span style="font-size:13px;font-weight:600;color:var(--texte2);font-variant-numeric:tabular-nums">${poses.includes(p.id) ? "Monté" : `+${montant(p.cout)}`}</span></button>`;
    }).join("")}</div>`, { classe: "pz-carte", attrs: 'style="gap:12px"' });
}

// MARK: - Les blocs communs aux achats

const NOMS_MODES = { comptant: "Comptant", credit: "Crédit", leasing: "Leasing", liquide: "Liquide" };

/** BlocFinancementVehicule. */
function blocFinancement(f, leasingPossible, durees, e) {
  const modes = leasingPossible ? ["comptant", "credit", "leasing"] : f.argentSale > 0 ? ["comptant", "credit", "liquide"] : ["comptant", "credit"];
  let corps = "";
  if (e.mode === "comptant") corps = `<p class="aide">Tout de suite, depuis ton compte courant.</p>`;
  else if (e.mode === "liquide") corps = `<p class="aide">En billets, avec ton argent sale : ${montant(f.argentSale)} en poche. Le vendeur ne pose pas de questions.</p>`;
  else if (e.mode === "credit") {
    const o = f.offre;
    corps = `${champPave(`Apport ${montant(e.apport)}`, "apport")}
      <div class="pz-defile">${durees.map((s) => filtre(`${s} sem.`, e.semainesCredit === s, "dureeCredit", { s })).join("")}</div>
      ${o ? `<div style="font-size:13px;font-weight:500;color:${o.accordee ? "var(--texte2)" : "var(--alerte)"}">${o.accordee ? `${montant(o.montant)} à ${pourcent(o.taux, 2)}, ${montant(o.echeance)} chaque dimanche.` : esc(o.refus ?? "Crédit refusé.")}</div>` : ""}`;
  } else {
    corps = `${f.leasings.map((l) => choixRadio(e.semainesLeasing === l.semaines, `${l.semaines} semaines, ${montant(l.loyer)} par semaine`, `Option d'achat à la fin : ${montant(l.residuel)}`, "dureeLeasing", { s: l.semaines })).join("")}
      <p class="aide">Le véhicule reste à la société : il ne compte pas dans ton patrimoine et ne se loue pas. À la fin, il repart, sauf si tu lèves l'option.</p>`;
  }
  return carte(`<span class="libelle">Financement</span>${segment(modes.map((m) => [m, NOMS_MODES[m]]), e.mode, "modePaiement")}${corps}`, { classe: "pz-carte" });
}

/** BlocAssuranceVehicule. */
function blocAssurance(assurances, franchises, e, prime) {
  return carte(`<div class="rangee entre"><span class="libelle">Assurance</span><span class="aide">${montant(prime, { centimes: true })}/sem.</span></div>
    ${assurances.map((a) => choixRadio(e.assurance === a.id, esc(a.nom), texteAssurance(a), "assuranceAchat", { id: a.id })).join("")}
    <div class="aide">Franchise</div>
    <div class="pz-defile">${franchises.map((x) => filtre(montant(x), e.franchise === x, "franchiseAchat", { f: x })).join("")}</div>`, { classe: "pz-carte" });
}

/** BonDeCommande, signé au doigt. */
const bonDeCommande = (titre, lignes, aPayer, signature) => papier(`<div style="display:flex;flex-direction:column;gap:12px">${titrePapier("Bon de commande", titre)}
  ${lignes.map(([l, v]) => champPapier(l, v)).join("")}${champPapier("À payer aujourd'hui", montant(aPayer), true)}
  <div style="font-size:12px;color:#6B675F;padding-top:4px">Signature de l'acheteur</div>${padSignature(signature)}</div>`, { empilee: false });

/** Le montant que l'achat fait sortir aujourd'hui. */
function aPayerAujourdhui(prix, e, f) {
  switch (e.mode) {
    case "liquide": return 0;
    case "credit": return e.apport;
    case "leasing": return f.leasings.find((l) => l.semaines === e.semainesLeasing)?.loyer ?? 0;
    default: return prix;
  }
}
const paiementGarage = (e) => ({
  comptant: { comptant: {} }, liquide: { liquide: {} },
  credit: { credit: { apport: e.apport, semaines: e.semainesCredit } }, leasing: { leasing: { semaines: e.semainesLeasing } },
})[e.mode];

/** Les actions communes du financement, de l'assurance et de la signature. */
function actionsAchat(lireEtat, apercu) {
  return {
    async modePaiement(ctx, b, d, p) { const e = lireEtat(p); e.mode = b.dataset.valeur; if (e.mode === "credit") e.apport = Math.max(e.apport, apercu(d).financement.apportMinimum); await ctx.rafraichir(); },
    apport(ctx, b, d, p) {
      const e = lireEtat(p), a = apercu(d);
      pave(ctx, { titre: "Apport", aide: `Au moins ${montant(a.financement.apportMinimum)}`, proposition: e.apport, maximum: a.prix,
        valider: async (v) => { e.apport = v; ctx.fermerFeuille(); await ctx.rafraichir(); } });
    },
    async dureeCredit(ctx, b, d, p) { lireEtat(p).semainesCredit = Number(b.dataset.s); await ctx.rafraichir(); },
    async dureeLeasing(ctx, b, d, p) { lireEtat(p).semainesLeasing = Number(b.dataset.s); await ctx.rafraichir(); },
    async assuranceAchat(ctx, b, d, p) { lireEtat(p).assurance = b.dataset.id; await ctx.rafraichir(); },
    async franchiseAchat(ctx, b, d, p) { lireEtat(p).franchise = Number(b.dataset.f); await ctx.rafraichir(); },
    async effacerSignature(ctx, b, d, p) { lireEtat(p).signature.length = 0; await ctx.rafraichir(); },
  };
}

/** Après un trait de signature : le bouton s'allume sans tout redessiner. */
function majBouton(texte, bloque) {
  const b = document.getElementById("bouton-signer");
  if (!b) return;
  b.textContent = texte;
  b.disabled = bloque;
}

// MARK: - La section de l'onglet Actifs (SectionVehicules)

export const section = {
  async donnees(ctx) { return { t: await ctx.tableau("garage") }; },
  rendu(d) {
    const t = d?.t;
    if (!t) return vide("La concession ouvre avec ta première saison.");
    const galerie = lireDisposition() === "galerie";
    return `<div class="pz-pile" style="gap:14px">
      ${!t.vehicules.length ? `<div class="pz-pile" style="gap:12px">${vitrine({ forme: "sportive", teinte: "#3A3D45", hauteur: 120, eteinte: true })}
          <p class="aide">Plus de 500 modèles, du vélo au jet. Achète sans permis : il te faudra seulement le bon permis pour conduire toi-même.</p></div>` : `
        <div class="rangee entre"><span class="libelle">${t.vehicules.length} véhicule${t.vehicules.length > 1 ? "s" : ""}</span>${selecteurDisposition()}</div>
        <div class="possessions ${galerie ? "galerie" : ""}">${t.vehicules.map((v) => possession({
          nom: v.nom, valeur: montant(v.valeur), galerie, page: "vehicule", p: { id: v.id },
          badge: v.plusValue !== 0 ? (v.plusValue > 0 ? "+" : "−") + montant(Math.abs(v.plusValue)) : "",
          lignes: [[v.statut, v.conduisible ? "var(--texte2)" : "var(--alerte)"], [v.position, v.position.startsWith("Ici") ? "var(--gain)" : "var(--texte2)", "repere"]],
          visuel: (h) => vitrine({ forme: v.silhouette, teinte: v.teinte, rarete: v.rarete, hauteur: h, photo: v.photo }),
        })).join("")}</div>`}
      ${t.depart.length ? carte(t.depart.map((x) => ligneValeur(lettreCap(x.description), montant(x.valeur))).join("")) : ""}
      <div style="display:flex;gap:8px" role="group" aria-label="Ta collection">${t.raretes.map((r, i) => `<div style="flex:1;padding:10px 0;border-radius:12px;background:var(--puce);text-align:center">
        <div class="chiffres" style="font-size:17px;font-weight:700;letter-spacing:-.02em;color:${teinteRarete(i) ?? "var(--texte)"}">${t.collection[i]}</div>
        <div style="font-size:11px;font-weight:500;color:var(--texte2)">${esc(r.nom)}</div></div>`).join("")}</div>
      ${t.permis.length ? `<div class="pz-defile" style="gap:10px">${t.permis.map((x) => cartePermis(x.code, x.nom, true)).join("")}</div>` : ""}
      ${carte(
        ligne({ titre: "Concession", detail: "Neuf et occasion, plus de 500 modèles", page: "concession", icone: ico.voitureCote, teinte: "var(--vente)" })
        + ligne({ titre: t.permisEnCours > 0 ? `Permis (${t.permisEnCours} en cours)` : "Permis", detail: "S'inscrire, réviser, passer l'examen", page: "permis", icone: ico.permis, teinte: "var(--equipe)" })
        + ligne({ titre: "Enchères", detail: "Voitures ✦ ♛ et anciennes, en direct", page: "encheres", icone: ico.marteau, teinte: "var(--grandir)" }))}
    </div>`;
  },
  actions: { dispositionActifs },
};

// MARK: - La concession (EcranConcession)

const TRIS_NEUFS = [{ id: "prix", nom: "Prix" }, { id: "rarete", nom: "Rareté", croissant: false }, { id: "nom", nom: "Nom" }];
const TRIS_OCCASIONS = [{ id: "prix", nom: "Prix" }, { id: "km", nom: "Kilomètres" }, { id: "etat", nom: "État", croissant: false }, { id: "rarete", nom: "Rareté", croissant: false }, { id: "nom", nom: "Nom" }];
const listeNeufs = (p) => etatDe(p, "neufs", () => nouvelleListe("prix", ["cat:citadines"]));
const listeOccasions = (p) => etatDe(p, "occasions", () => nouvelleListe("prix"));
const rayonConcession = (p) => etatDe(p, "rayon", { neuf: true });

function corpsNeufs(d, p) {
  const e = listeNeufs(p), t = d.t;
  const cats = t.categories.filter((c) => actif(e, "cat:" + c.id)).map((c) => c.id);
  const q = e.recherche.trim();
  const base = t.modeles
    .filter((m) => contient(e, m.nom, m.detail))
    .filter((m) => q || !cats.length || cats.includes(m.categorie))
    .filter((m) => !actif(e, "dispo") || m.disponible)
    .filter((m) => !actif(e, "permis") || m.conduisible)
    .filter((m) => !actif(e, "abordable") || m.prix <= d.dispo)
    .filter((m) => !actif(e, "rare") || m.rarete >= 2);
  const modeles = trier(base, e, { prix: (m) => m.prix, rarete: (m) => m.rarete }, (m) => m.nom);
  const filtres = [...t.categories.map((c) => ({ id: "cat:" + c.id, nom: c.nom })),
    { id: "dispo", nom: "Disponibles", icone: "coche" }, { id: "permis", nom: "Mon permis", icone: "permis" },
    { id: "abordable", nom: "À ta portée", icone: "billet" }, { id: "rare", nom: "Rares", icone: "etincelles" }];
  const montres = modeles.slice(0, e.montres);
  return `<div class="pz-pile" style="gap:10px">${pastillesListe("neufs", e, filtres)}${compteListe("neufs", e, modeles.length, "modèles")}</div>
    ${!modeles.length ? `<p class="aide">Aucun modèle ne correspond.</p>` : ""}
    <div class="cat-grille"><div class="cat-cartes">${montres.map((m) => carteModele(m, "configurateur", m.conduite, estChoisi(p, "configurateur", "id", m.id))).join("")}</div></div>
    ${plusListe("neufs", modeles.length, montres.length)}`;
}

/** Un modèle du catalogue (concession, chantier naval) : une ligne sur téléphone, une carte à photo dans une grille. */
export function carteModele(m, page, conduite, choisi = false, resume = "") {
  return `<button class="carte cat-ligne cat-modele" data-action="ouvrir" data-page="${page}" data-p='${esc(JSON.stringify({ id: m.id }))}' ${choisi ? 'aria-current="true"' : ""}>
      ${vitrine({ forme: m.silhouette, teinte: m.teinte, rarete: m.rarete, hauteur: 66, eteinte: !m.disponible, largeur: 138, photo: m.photo })}
      <span class="cat-texte">
        <span class="cat-nom">${esc(m.nom)}</span>
        <span class="chiffres cat-prix">${montant(m.prix)}</span>
        ${resume ? `<span class="cat-detail">${esc(resume)}</span>` : ""}
        ${!m.disponible ? `<span class="cat-detail alerte fort">${m.retourDans != null ? `De retour dans ${m.retourDans} sem.` : "Indisponible"}</span>`
          : `<span class="cat-detail coupe ${m.conduisible ? "" : "alerte"}">${esc(conduite)}</span>`}
      </span>${pastilleRarete(m.rarete, { enLigne: true })}</button>`;
}

function corpsOccasions(d, p) {
  const e = listeOccasions(p), t = d.t;
  const base = t.occasions
    .filter((o) => contient(e, o.nom, o.teinteNom))
    .filter((o) => !actif(e, "abordable") || (o.prixNegocie ?? o.prix) <= d.dispo)
    .filter((o) => !actif(e, "bonEtat") || o.etat >= 0.8)
    .filter((o) => !actif(e, "inspectee") || o.vice === false)
    .filter((o) => !actif(e, "rare") || o.rarete >= 2)
    .filter((o) => !actif(e, "options") || o.options != null);
  const occasions = trier(base, e, { prix: (o) => o.prixNegocie ?? o.prix, km: (o) => o.kilometres, etat: (o) => o.etat, rarete: (o) => o.rarete }, (o) => o.nom);
  const filtres = [{ id: "abordable", nom: "À ta portée", icone: "billet" }, { id: "bonEtat", nom: "Bon état", icone: "cle_molette" },
    { id: "inspectee", nom: "Inspectées sans vice", icone: "sceau" }, { id: "options", nom: "Équipées", icone: "cle_molette" }, { id: "rare", nom: "Rares", icone: "etincelles" }];
  return `<div class="pz-pile" style="gap:10px">${pastillesListe("occasions", e, filtres)}${compteListe("occasions", e, occasions.length, "annonces")}</div>
    ${!occasions.length ? `<p class="aide">${t.occasions.length ? "Aucune annonce ne correspond." : "Plus d'annonce cette semaine."}</p>` : ""}
    <div class="cat-grille"><div class="cat-cartes">${occasions.map((o) => `<button class="annonce" data-action="ouvrir" data-page="occasion" data-p='${esc(JSON.stringify({ id: o.id }))}' ${estChoisi(p, "occasion", "id", o.id) ? 'aria-current="true"' : ""}>
      ${vitrine({ forme: o.silhouette, teinte: o.teinte, rarete: o.rarete, hauteur: 110, pastille: true, photo: o.photo })}
      <div class="rangee entre" style="align-items:flex-start;gap:8px">
        <div style="min-width:0;display:flex;flex-direction:column;gap:2px"><div class="nom">${esc(o.nom)}</div>
          <div class="sous">${esc(o.teinteNom)}, ${nombre(o.kilometres)} km, état ${pourcent(o.etat)}</div>
          ${o.options ? `<div class="encre-gain" style="font-size:12px;font-weight:600">Équipée : ${esc(o.options)}</div>` : ""}</div>
        <div>${o.prixNegocie != null ? `<div class="barre">${montant(o.prix)}</div><div class="prix encre-gain">${montant(o.prixNegocie)}</div>` : `<div class="prix">${montant(o.prix)}</div>`}</div>
      </div>
      ${o.vice != null ? `<div class="${o.vice ? "encre-perte" : "encre-gain"}" style="font-size:12px;font-weight:600">${o.vice ? "⚠ Inspecté : vice caché" : "✓ Inspecté : rien à signaler"}</div>` : ""}
    </button>`).join("")}</div></div>`;
}

// MARK: - Le configurateur (EcranConfigurateur)

const etatConfig = (p) => etatDe(p, "config", { teinte: 0, jantes: "serie", interieur: "tissu", packs: [], mode: "comptant", apport: 0, semainesCredit: 8, semainesLeasing: 4,
  assurance: "omnium", franchise: 250000, signature: [], famille: "confort", enCours: false });
const configDe = (e) => ({ teinte: e.teinte, jantes: e.jantes, interieur: e.interieur, packs: [...e.packs] });

function rendreConfigurateur(d, ctx, p) {
  const a = d.a;
  if (!a) return `${entetePousse("Configurateur")}${vide("Ce modèle n'existe pas.")}`;
  const e = etatConfig(p);
  const teinte = a.teintes[Math.min(e.teinte, a.teintes.length - 1)];
  const bloque = !e.signature.length || e.enCours || a.vendeurParti || !a.disponible || !!a.refusAchat; // RNT-188 : un bateau, au port seulement
  return `${entetePousse(a.nom)}
  <div class="pz-pile">
    ${vitrine({ forme: a.silhouette, teinte: teinte.hex, rarete: a.rarete, hauteur: 170, pastille: true, photo: a.photo, prioritaire: true })}
    <div style="display:flex;flex-direction:column;gap:4px">
      <p class="aide">${esc(a.detail)}</p>
      <div style="font-size:13px;color:var(--texte2)">Prix de base ${montant(a.base)}</div>
      <div class="pz-prix"><span class="chiffres ${a.prix < a.prixConfigure ? "gain" : ""}" style="font-size:36px">${montant(a.prix)}</span>
        ${a.prix < a.prixConfigure ? `<span class="barre">${montant(a.prixConfigure)}</span>` : ""}<span class="espace"></span><span style="font-size:14px;font-weight:600">${esc(teinte.nom)}</span></div>
      ${note(a.conduisible ? "coche" : "permis", esc(a.conduite), a.conduisible ? "var(--texte2)" : "var(--alerte)")}
      ${a.equipage != null ? note("equipage", `Équipage : ${montant(a.equipage)} chaque dimanche`) : ""}
      ${a.resumeBateau ? note("repere", esc(a.resumeBateau)) : ""}${a.refusAchat ? note("alerteTri", esc(a.refusAchat), "var(--alerte)") : ""}
      <div style="padding-top:4px">${boutonEpingler(ctx, { sorte: "vehicule", cible: p.id })}</div>
      ${!a.disponible ? note("horloge", a.retourDans != null ? `Pas en concession cette semaine, de retour dans ${a.retourDans} sem.` : "Pas en concession pour l'instant", "var(--alerte)") : ""}
    </div>
    ${carte(`<span class="libelle">Teinte</span><div style="display:flex;gap:4px;flex-wrap:wrap">${a.teintes.map((x, i) => `<button data-action="teinte" data-i="${i}" aria-label="${esc(x.nom)}" aria-pressed="${e.teinte === i}"
        style="width:44px;height:44px;border-radius:50%;padding:4px;border:2px solid ${e.teinte === i ? "var(--texte)" : "transparent"}">
        <span style="display:block;width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,rgba(255,255,255,.35),transparent 50%,rgba(0,0,0,.25)),${x.hex};border:1px solid rgba(255,255,255,.15)"></span></button>`).join("")}</div>`, { classe: "pz-carte" })}
    ${a.configurable ? `${resumeEffets(a.effets)}${choixUnique("Jantes", a.jantes, e.jantes, "jantes")}${choixUnique("Intérieur", a.interieurs, e.interieur, "interieur")}
      ${choixPacks(a.packs, e.packs, e.famille, "famillePacks", "pack")}` : ""}
    ${carte(`${label("mallette", "Concession")}
      <div style="font-size:14px;font-weight:500;color:${a.vendeurParti ? "var(--alerte)" : "var(--texte2)"}">${esc(a.negociation)}</div>
      ${a.peutOffrir && a.disponible ? pilule("Faire une offre", "offre", { plein: true }) : ""}`, { classe: "pz-carte" })}
    ${blocFinancement(a.financement, true, d.vehicules.dureesCreditSemaines, e)}
    ${blocAssurance(d.vehicules.assurances, d.franchises, e, a.financement.prime)}
    ${bonDeCommande(`${a.nom}, ${teinte.nom.toLowerCase()}`, [["Prix", montant(a.prix)], ["Financement", NOMS_MODES[e.mode]]], aPayerAujourdhui(a.prix, e, a.financement), e.signature)}
    <button class="bouton" id="bouton-signer" data-action="acheterNeuf" ${bloque ? "disabled" : ""}>${e.signature.length ? "Signer et acheter" : "Signe le bon pour acheter"}</button>
  </div>`;
}

// MARK: - L'occasion (EcranOccasion)

const etatOccasion = (p) => etatDe(p, "occasion", { mode: "comptant", apport: 0, semainesCredit: 8, semainesLeasing: 4, assurance: "mini", franchise: 250000, signature: [], enCours: false });

function rendreOccasion(d, ctx, p) {
  const a = d.a;
  if (!a) return `${entetePousse("Occasion")}${vide("Cette annonce n'est plus en ligne.")}`;
  const e = etatOccasion(p);
  const manque = e.mode === "liquide" && a.financement.argentSale < a.prix;
  const bloque = !e.signature.length || e.enCours || a.vendeurParti || manque || !!a.refusAchat;
  return `${entetePousse("Occasion")}
  <div class="pz-pile">
    ${vitrine({ forme: a.silhouette, teinte: a.teinte, rarete: a.rarete, hauteur: 170, pastille: true, photo: a.photo, prioritaire: true })}
    <div style="display:flex;flex-direction:column;gap:4px">
      <div class="pz-gros">${esc(a.nom)}</div>
      <p class="aide">${esc(a.teinteNom)}, ${a.heures != null ? `${nombre(a.heures)} h moteur` : `${nombre(a.kilometres)} km`}</p>
      ${a.resumeBateau ? note("repere", esc(a.resumeBateau)) : ""}${a.refusAchat ? note("alerteTri", esc(a.refusAchat), "var(--alerte)") : ""}
      <div class="pz-prix"><span class="chiffres ${a.prix < a.base ? "gain" : ""}" style="font-size:36px">${montant(a.prix)}</span>${a.prix < a.base ? `<span class="barre">${montant(a.base)}</span>` : ""}</div>
      ${ligneEtat("État", a.etat, pourcent(a.etat))}
      ${note(a.conduisible ? "coche" : "permis", esc(a.conduite), a.conduisible ? "var(--texte2)" : "var(--alerte)")}
    </div>
    ${carte(`${label("cle_molette", "Inspection")}
      ${a.vice != null ? `<div style="font-size:14px;font-weight:500;color:${a.vice ? "var(--alerte)" : "var(--gain)"}">${a.vice ? "Vice caché : pannes trois fois plus fréquentes, et un pro le reprendrait à 60 % de sa valeur. Une réparation le corrige." : "Rien à signaler : ce véhicule est sain."}</div>`
        : `<p class="aide">Un garagiste vérifie tout avant l'achat. Sans inspection, un vice caché reste caché.</p>${pilule(`Faire inspecter, ${montant(a.inspection)}`, "inspecter", { plein: true })}`}`, { classe: "pz-carte" })}
    ${carte(`<div class="rangee entre">${label("personneSeule", "Particulier")}${points(a.patience, a.patienceMax)}</div>
      <div style="font-size:14px;font-weight:500;color:${a.vendeurParti ? "var(--alerte)" : "var(--texte2)"}">${esc(a.negociation)}</div>
      ${a.peutOffrir ? pilule("Faire une offre", "offre", { plein: true }) : ""}`, { classe: "pz-carte" })}
    ${blocFinancement(a.financement, false, d.vehicules.dureesCreditSemaines, e)}
    ${blocAssurance(d.vehicules.assurances, d.franchises, e, a.financement.prime)}
    ${bonDeCommande(`${a.nom}, occasion`, [["Prix", montant(a.prix)], ["Kilométrage", `${nombre(a.kilometres)} km`]], e.mode === "credit" ? e.apport : e.mode === "liquide" ? 0 : a.prix, e.signature)}
    <button class="bouton" id="bouton-signer" data-action="acheterOccasion" ${bloque ? "disabled" : ""}>${e.signature.length ? "Signer et acheter" : "Signe le bon pour acheter"}</button>
    ${manque ? `<p class="aide">Il te manque ${montant(a.prix - a.financement.argentSale)} en liquide.</p>` : ""}
  </div>`;
}

// MARK: - La fiche d'un véhicule (EcranVehicule)

/** CarteVoitureAuxEncheres : vingt-quatre heures de vente, un prix de réserve. */
function carteEncheresVoiture(t, d, e) {
  const regles = d.encheres;
  if (!regles || t.leasing || !d.modele || !regles.categories.includes(d.modele.categorie)) return "";
  const reserve = Math.max(10000, Math.round((t.valeur * e.part) / 10000) * 10000);
  return carte(`${label("marteau", "Aux enchères")}
    ${e.misEnVente != null ? `<p class="aide">En vente pour vingt-quatre heures, réserve ${montant(e.misEnVente)}. Le résultat arrive dans tes événements.</p>` : `
    <p class="aide">Vingt-quatre heures de vente, à des collectionneurs. Tu fixes un prix de réserve : en dessous, elle reste à toi. La maison prend ${pourcent(regles.frais)} du prix.</p>
    <div class="pz-defile">${[0.8, 1, 1.2].map((k) => filtre(k === 1 ? "Cote" : pctSigne(k - 1), e.part === k, "partReserve", { k })).join("")}</div>
    <div style="font-size:15px;font-weight:600">Réserve : ${montant(reserve)}</div>
    ${pilule("Mettre aux enchères", "mettreAuxEncheres", { plein: true, donnees: { reserve } })}`}`, { classe: "pz-carte" });
}

function rendreVehicule(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Véhicule")}${vide("Ce véhicule n'est plus dans ton garage.")}`;
  const e = etatDe(p, "vehicule", { part: 1, misEnVente: null });
  const nomAssurance = t.assurances.find((x) => x.id === t.assurance)?.nom ?? t.assurance;
  return `${entetePousse(t.nom)}
  <div class="pz-pile">
    ${vitrine({ forme: t.silhouette, teinte: t.teinte, rarete: t.rarete, hauteur: 170, pastille: true, photo: t.photo, prioritaire: true })}
    <div style="display:flex;flex-direction:column;gap:4px">
      <div class="pz-prix"><span class="chiffres" style="font-size:34px">${montant(t.valeur)}</span>${t.leasing ? "" : variationTexte(t.plusValue)}</div>
      <p class="aide">${esc([t.teinteNom, t.options, t.occasion ? "occasion" : null].filter(Boolean).join(", "))}</p>
      <div style="font-size:13px;font-weight:500;color:${t.coteSemaine >= 0 ? "var(--gain)" : "var(--texte2)"}">${t.coteSemaine >= 0 ? `Sa cote monte : +${montant(t.coteSemaine)} par semaine.` : `Sa cote baisse de ${montant(-t.coteSemaine)} par semaine.`}</div>
    </div>
    ${carte(`<div class="rangee" style="gap:6px"><span class="pastille" style="--c:var(--controles);width:26px;height:26px;border-radius:8px"><span class="pz-ico" style="width:14px;height:14px">${ico.jauge}</span></span>
        <span class="libelle">État</span>${ligneEtat("", t.etat, pourcent(t.etat)).replace('class="pz-ligne-etat"', 'class="pz-ligne-etat" style="flex:1;font-size:13px"')}</div>
      ${t.viceConnu ? note("alerteTri", "Vice caché : pannes plus fréquentes. Une réparation le corrige.", "var(--alerte)") : ""}
      ${t.etat < 0.95 || t.viceConnu ? pilule(`Réparer, ${montant(t.reparation)}`, "reparer", { categorie: "var(--controles)" }) : ""}
      <div class="filet"></div>
      <div class="rangee entre">${note(t.conduisible ? "coche" : "permis", esc(t.conduite), t.conduisible ? "var(--texte)" : "var(--alerte)").replace("font-size:13px", "")}
        ${!t.conduisible ? pilule("Permis", "", { page: "permis" }) : ""}</div>
      ${t.equipage != null ? note("equipage", `Équipage : ${montant(t.equipage)} chaque dimanche`) : ""}`, { classe: "pz-carte" })}
    ${t.configurable || !effetsVides(t.effets) ? carte(`${tete("cle_molette", "var(--controles)", "Options")}
      <div style="font-size:14px;font-weight:500">${esc(t.options ?? "De série, sans option.")}</div>
      ${textesEffets(t.effets).map((x) => note("coche", esc(x), "var(--gain)")).join("")}
      ${t.configurable ? pilule("Passer à l'atelier", "atelier", { categorie: "var(--controles)" }) : ""}`, { classe: "pz-carte" }) : ""}
    ${papier(`<div style="display:flex;flex-direction:column;gap:9px">
      <div class="rangee entre" style="align-items:flex-start">${titrePapier("Certificat d'immatriculation", t.nom)}${etiquetteEncre(t.leasing ? "Leasing" : t.occasion ? "Occasion" : "Neuf")}</div>
      ${champPapier("Teinte", esc(t.teinteNom))}
      ${t.options ? champPapier("Options", esc(t.options)) : ""}
      ${champPapier("État", pourcent(t.etat))}
      ${champPapier("Assurance", `${esc(nomAssurance)}, ${montant(t.prime, { centimes: true })}/sem.`)}
      ${champPapier("Reprise par un pro", montant(t.reprise))}
      ${champPapier("Cote", montant(t.valeur), true)}</div>`)}
    <div style="height:2px"></div>
    ${t.leasing ? carte(`${label("document", "Leasing")}
      <p class="aide">${t.leasing.semainesRestantes > 0 ? `Encore ${t.leasing.semainesRestantes} loyer${t.leasing.semainesRestantes > 1 ? "s" : ""} de ${montant(t.leasing.loyer)}, le dimanche. Ensuite, il repart.` : "Dernier loyer payé : il repart dimanche, sauf si tu lèves l'option."}</p>
      ${t.soldeLeasing != null ? pilule(`Lever l'option, ${montant(t.soldeLeasing)}`, "leverOption", { plein: true }) : ""}`, { classe: "pz-carte" }) : ""}
    ${carte(`${tete("bouclier", "var(--argent)", "Assurance", `<span class="aide">${montant(t.prime, { centimes: true })}/sem.</span>`)}
      ${t.assurances.map((a) => choixRadio(t.assurance === a.id, esc(a.nom), texteAssurance(a), "assuranceVehicule", { id: a.id })).join("")}
      <div class="aide">Franchise</div>
      <div class="pz-defile">${t.franchises.map((f) => filtre(montant(f), t.franchise === f, "franchiseVehicule", { f })).join("")}</div>`, { classe: "pz-carte" })}
    ${carte(interrupteur(t.entretien, `<div class="rangee" style="gap:8px"><span class="pastille" style="--c:var(--equipe);width:24px;height:24px;border-radius:7px"><span class="pz-ico" style="width:13px;height:13px">${ico.cle_molette}</span></span><span class="libelle">Contrat d'entretien</span></div>
      <div class="aide" style="margin-top:2px">${montant(t.coutEntretien)} par semaine : moins de pannes, la cote baisse moins vite.</div>`, "entretien"), { pad: true })}
    ${!t.leasing ? carte(`${tete("cle", "var(--vente)", "Location")}
      ${t.locations.map((l) => choixRadio(t.location === l.id, esc(l.nom), l.id === "aucune" ? "Pour toi seul" : `+${montant(l.revenuSemaine)}/sem., dégâts ${pourcent(l.degats)} par semaine`, "louer", { id: l.id })).join("")}`, { classe: "pz-carte" }) : ""}
    ${carteEncheresVoiture(t, d, e)}
    ${bouton(`Vendre à un professionnel, ${montant(t.reprise)}`, "vendre", { genre: "secondaire", desactive: !!t.leasing })}
  </div>`;
}

/** FeuilleAtelier : poser des options sur un véhicule détenu (RNT-141). */
async function ouvrirAtelier(ctx, d, p) {
  const t = d.t, r = d.vehicules;
  const st = { jantes: t.config.jantes, interieur: t.config.interieur, packs: [...t.config.packs], famille: "confort", effets: t.effets, choix: null, enCours: false };
  const poses = [t.config.jantes, t.config.interieur, ...t.config.packs];
  const lire = async () => {
    // Les options au prix de ce modèle (ReglesVehicules.choix) et leurs effets : l'aperçu du configurateur les donne.
    const a = await ctx.tableau("apercuNeuf", { id: t.photo, config: { teinte: t.config.teinte, jantes: st.jantes, interieur: st.interieur, packs: st.packs } });
    if (a) { st.effets = a.effets; st.choix = a; }
  };
  const change = () => st.jantes !== t.config.jantes || st.interieur !== t.config.interieur || st.packs.length !== t.config.packs.length || st.packs.some((x) => !t.config.packs.includes(x));
  const ajoute = () => [st.jantes, st.interieur, ...st.packs].some((x) => !poses.includes(x) && x !== "serie" && x !== "tissu");
  const rendu = () => !st.choix ? `<div class="squelette"></div>` : `
    <p class="aide" style="margin-top:-8px">${esc(t.nom)}</p>
    ${resumeEffets(st.effets)}
    ${choixUnique("Jantes", st.choix.jantes, st.jantes, "atelierJantes", poses)}
    ${choixUnique("Intérieur", st.choix.interieurs, st.interieur, "atelierInterieur", poses)}
    ${choixPacks(st.choix.packs, st.packs, st.famille, "atelierFamille", "atelierPack", poses)}
    <p class="aide">L'atelier facture les options ajoutées, ${Math.round((r.atelierMajoration ?? 0.15) * 100)} % plus cher qu'en concession ; en retirer ne rapporte rien. La cote monte de ${Math.round((r.atelierValeurPart ?? 0.6) * 100)} % de ce que tu paies.</p>
    ${bouton(st.enCours ? "Montage…" : ajoute() ? "Monter les options" : "Enregistrer", "atelierMonter", { teinte: "var(--controles)", genre: "teinte", desactive: st.enCours || !change() })}`;
  const repeint = () => { const c = document.querySelector("#feuille .corps-feuille"); if (c) c.innerHTML = rendu(); };
  const maj = async () => { await lire(); repeint(); };
  ctx.feuille({
    titre: "L'atelier",
    rendu,
    actions: {
      atelierJantes: async (c, b) => { st.jantes = b.dataset.id; await maj(); },
      atelierInterieur: async (c, b) => { st.interieur = b.dataset.id; await maj(); },
      atelierFamille: (c, b) => { st.famille = b.dataset.f; repeint(); },
      atelierPack: async (c, b) => { const id = b.dataset.id; st.packs = st.packs.includes(id) ? st.packs.filter((x) => x !== id) : [...st.packs, id]; await maj(); },
      async atelierMonter() {
        if (st.enCours || !change()) return;
        const a = ajoute();
        st.enCours = true; repeint();
        const ok = await ctx.decider("garage", { equiper: { vehicule: p.id, _1: { teinte: t.config.teinte, jantes: st.jantes, interieur: st.interieur, packs: st.packs } } },
          { succes: a ? "Options montées" : "Configuration enregistrée" });
        st.enCours = false;
        if (!ok) repeint();
      },
    },
  });
  await maj();
}

// MARK: - Les permis (EcranPermis)

function rendrePermis(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Permis")}${vide("Les permis s'ouvrent avec ta première saison.")}`;
  const e = etatDe(p, "permis", { choisi: null });
  const l = t.lignes.find((x) => x.id === e.choisi) ?? t.lignes.find((x) => x.enCours) ?? t.lignes.find((x) => !x.obtenu) ?? t.lignes[0];
  const chiffre = (titre, v) => `<div style="flex:1"><div style="font-size:12px;color:var(--texte2)">${titre}</div><div class="chiffres" style="font-size:16px;font-weight:700;letter-spacing:-.02em">${v}</div></div>`;
  const ec = l.enCours;
  let bas;
  if (l.obtenu) bas = note("sceau", "Tu l'as. Tu peux conduire ce qu'il couvre.", "var(--gain)").replace("font-size:13px", "");
  else if (l.prerequis) bas = note("cadenas", `Il faut d'abord le ${esc(l.prerequis)}.`, "var(--alerte)");
  else if (ec) {
    bas = `<div style="display:flex;flex-direction:column;gap:8px">${ligneEtat("Révision", ec.heures / t.heuresMax, `${virgule(ec.heures, 1)} h`)}
        <p class="aide">Chaque heure révisée ajoute 2 points de réussite, jusqu'à ${pourcent(t.bonusMax)}.</p></div>
      ${interrupteur(l.revise, `<div class="libelle">Réviser ce permis</div><div class="aide">Lance une session Révision dans Focus : salaire à ${pourcent(t.partSalaire)}, et ses heures comptent ici.</div>`, "reviser", { id: l.id })}
      ${ec.formationRequise ? `<div style="font-size:13px;font-weight:500;color:var(--alerte)">Deux échecs : une formation est obligatoire avant le prochain examen.</div>${bouton(`Suivre la formation, ${montant(t.formation)}`, "formation", { donnees: { id: l.id } })}`
        : ec.joursRestants > 0 ? note("calendrier", `Examen possible dans ${ec.joursRestants} jour${ec.joursRestants > 1 ? "s" : ""}`)
        : bouton(ec.echecs > 0 ? `Repasser l'examen, ${montant(t.repassage)}` : "Passer l'examen", "examen", { donnees: { id: l.id } })}`;
  } else bas = bouton(`S'inscrire, ${montant(l.cout)}`, "inscrire", { donnees: { id: l.id } });
  return `${entetePousse("Permis")}
  <div class="pz-pile">
    <p class="aide">Une inscription, des jours de formation, des heures de révision (les sessions Révision de l'onglet Focus, payées à moitié), puis l'examen. On peut acheter sans permis : il sert à conduire soi-même.</p>
    ${carte(t.lignes.map((x, i) => `${i ? `<div class="filet"></div>` : ""}<button class="choix-radio" role="radio" aria-checked="${x.id === l.id}" data-action="choisirPermis" data-id="${esc(x.id)}" style="padding:12px 16px">
      <span class="radio ${x.id === l.id ? "oui" : ""}"></span><span style="flex:1;min-width:0"><div style="font-size:15px;font-weight:600">${esc(x.nom)}</div><div class="aide">${esc(x.detail)}</div></span>
      ${x.obtenu ? `<span style="font-size:13px;font-weight:600;color:var(--gain)">Obtenu</span>`
        : x.enCours ? `<span style="font-size:13px;font-weight:600;color:var(--alerte)">${x.enCours.joursRestants > 0 ? `J−${x.enCours.joursRestants}` : "Examen"}</span>`
        : `<span class="chiffres" style="font-size:13px;color:var(--texte2);letter-spacing:-.02em">${montant(x.cout)}</span>`}</button>`).join(""))}
    ${carte(`<div class="rangee entre" style="align-items:flex-start">${cartePermis(codePermis(l.id), l.nom, l.obtenu)}${ec ? `<span class="aide">${ec.echecs} échec${ec.echecs > 1 ? "s" : ""}</span>` : ""}</div>
      <div style="display:flex">${chiffre("Coût", montant(l.cout))}${chiffre("Formation", `${l.jours} jour${l.jours > 1 ? "s" : ""}`)}${chiffre("Réussite", pourcent(l.chance))}</div>
      ${l.ouvre.length ? `<p class="aide">Ouvre : ${esc(l.ouvre.join(", "))}…</p>` : ""}
      ${bas}`, { classe: "pz-carte", attrs: 'style="gap:14px"' })}
  </div>`;
}

/** TableauGarage.code (statique, non exposé ligne par ligne) : le code imprimé sur la carte. */
function codePermis(id) {
  return { boatGeneral: "Côtier", boatRestricted: "Côtier", boatHauturier: "Large", PPL_A: "PPL A", PPL_H: "PPL H" }[id] ?? id;
}

// MARK: - Les pages

export const pages = {
  concession: {
    titre: "Concession",
    async donnees(ctx) {
      const [t, dispo] = await Promise.all([ctx.tableau("concession"), argentDisponible(ctx)]);
      return { t, dispo };
    },
    rendu(d, ctx, p) {
      if (!d.t) return `${entetePousse("Concession")}${vide("La concession ouvre avec ta première saison.")}`;
      const neuf = rayonConcession(p).neuf;
      return `${entetePousse("Concession")}
      <div class="pz-pile" style="gap:14px">
        ${segment([["neuf", "Neuf"], ["occasion", "Occasion"]], neuf ? "neuf" : "occasion", "rayonConcession")}
        ${neuf ? `${teteListe({ id: "neufs", etat: listeNeufs(p), invite: "Marque ou modèle", tris: TRIS_NEUFS })}
            <div id="neufs-corps" class="pz-pile" style="gap:14px">${corpsNeufs(d, p)}</div>`
          : `<p class="aide">Entre particuliers, renouvelées chaque semaine. Moins cher, mais un vice caché est possible : une inspection le révèle.</p>
            ${teteListe({ id: "occasions", etat: listeOccasions(p), invite: "Marque, modèle ou teinte", tris: TRIS_OCCASIONS })}
            <div id="occasions-corps" class="pz-pile" style="gap:14px">${corpsOccasions(d, p)}</div>`}
      </div>`;
    },
    actions: {
      rayonConcession(ctx, b, d, p) { rayonConcession(p).neuf = b.dataset.valeur === "neuf"; ctx.rafraichir(); },
      ...actionsListe("neufs", listeNeufs, TRIS_NEUFS, (ctx, d, p) => repeindre("neufs", corpsNeufs(d, p))),
      ...actionsListe("occasions", listeOccasions, TRIS_OCCASIONS, (ctx, d, p) => repeindre("occasions", corpsOccasions(d, p))),
    },
  },

  configurateur: {
    titre: "Configurateur",
    async donnees(ctx, p) {
      const e = etatConfig(p);
      const [a, vehicules, immo] = await Promise.all([
        ctx.tableau("apercuNeuf", { id: p.id, config: configDe(e), paiement: paiementGarage(e), assurance: e.assurance, franchise: e.franchise }),
        balance(ctx, "vehicules"), balance(ctx, "immobilier"),
      ]);
      cibleSignature(e.signature, () => a && majBouton("Signer et acheter", e.enCours || a.vendeurParti || !a.disponible || !!a.refusAchat));
      return { a, vehicules, franchises: immo.franchises.map((f) => f.montantCentimes) };
    },
    rendu: rendreConfigurateur,
    actions: {
      ...actionsAchat(etatConfig, (d) => d.a),
      async teinte(ctx, b, d, p) { etatConfig(p).teinte = Number(b.dataset.i); await ctx.rafraichir(); },
      async jantes(ctx, b, d, p) { etatConfig(p).jantes = b.dataset.id; await ctx.rafraichir(); },
      async interieur(ctx, b, d, p) { etatConfig(p).interieur = b.dataset.id; await ctx.rafraichir(); },
      async famillePacks(ctx, b, d, p) { etatConfig(p).famille = b.dataset.f; await ctx.rafraichir(); },
      async pack(ctx, b, d, p) { const e = etatConfig(p), id = b.dataset.id; e.packs = e.packs.includes(id) ? e.packs.filter((x) => x !== id) : [...e.packs, id]; await ctx.rafraichir(); },
      offre(ctx, b, d, p) {
        pave(ctx, { titre: "Ton offre", aide: `Prix catalogue : ${montant(d.a.base)}. La remise vaudra aussi pour les options.`, proposition: Math.trunc((d.a.base * 0.93) / 100) * 100,
          valider: (v) => ctx.decider("garage", { offrir: { cle: `neuf:${p.id}`, _1: v } }) });
      },
      async acheterNeuf(ctx, b, d, p) {
        const e = etatConfig(p);
        if (e.enCours || !e.signature.length) return;
        e.enCours = true;
        const ok = await ctx.decider("garage", { acheterNeuf: { modele: p.id, _1: configDe(e), _2: paiementGarage(e), assurance: e.assurance, franchise: e.franchise } },
          { succes: e.mode === "leasing" ? `${d.a.nom} est à toi en leasing` : `${d.a.nom} est à toi` });
        e.enCours = false;
        if (ok) { oublierEtat(p, "config"); await ctx.retour(); }
      },
    },
  },

  occasion: {
    titre: "Occasion",
    async donnees(ctx, p) {
      const e = etatOccasion(p);
      const [a, vehicules, immo] = await Promise.all([
        ctx.tableau("apercuOccasion", { id: p.id, paiement: paiementGarage(e), assurance: e.assurance, franchise: e.franchise }),
        balance(ctx, "vehicules"), balance(ctx, "immobilier"),
      ]);
      cibleSignature(e.signature, () => a && majBouton("Signer et acheter", e.enCours || a.vendeurParti || !!a.refusAchat || (e.mode === "liquide" && a.financement.argentSale < a.prix)));
      return { a, vehicules, franchises: immo.franchises.map((f) => f.montantCentimes) };
    },
    rendu: rendreOccasion,
    actions: {
      ...actionsAchat(etatOccasion, (d) => d.a),
      inspecter: (ctx, b, d, p) => ctx.decider("garage", { inspecter: { annonce: p.id } }, { succes: "Inspection faite" }),
      offre(ctx, b, d, p) {
        pave(ctx, { titre: "Ton offre", aide: `Prix demandé : ${montant(d.a.prix)}`, proposition: Math.trunc((d.a.prix * 0.88) / 100) * 100,
          valider: (v) => ctx.decider("garage", { offrir: { cle: p.id, _1: v } }) });
      },
      async acheterOccasion(ctx, b, d, p) {
        const e = etatOccasion(p);
        if (e.enCours || !e.signature.length) return;
        e.enCours = true;
        const ok = await ctx.decider("garage", { acheterOccasion: { annonce: p.id, _1: paiementGarage(e), assurance: e.assurance, franchise: e.franchise } }, { succes: `${d.a.nom} est à toi` });
        e.enCours = false;
        if (ok) { oublierEtat(p, "occasion"); await ctx.retour(); }
      },
    },
  },

  vehicule: {
    titre: "Véhicule",
    async donnees(ctx, p) {
      const [t, vehicules, enLigne] = await Promise.all([ctx.tableau("vehicule", { id: p.id }), balance(ctx, "vehicules"), balance(ctx, "enLigne")]);
      // La catégorie du modèle (la photo d'un véhicule est l'identifiant de son modèle) : les enchères la demandent.
      const modele = t ? vehicules.modeles.find((m) => m.id === t.photo) : null;
      return { t, vehicules, modele, encheres: enLigne?.encheresVoitures ?? null };
    },
    rendu: rendreVehicule,
    actions: {
      reparer: (ctx, b, d, p) => ctx.decider("garage", { reparer: { vehicule: p.id } }, { succes: "Comme neuf" }),
      assuranceVehicule: (ctx, b, d, p) => ctx.decider("garage", { assurer: { vehicule: p.id, assurance: b.dataset.id, franchise: d.t.franchise } }),
      franchiseVehicule: (ctx, b, d, p) => ctx.decider("garage", { assurer: { vehicule: p.id, assurance: d.t.assurance, franchise: Number(b.dataset.f) } }),
      entretien: (ctx, b, d, p) => ctx.decider("garage", { entretien: { vehicule: p.id, _1: !d.t.entretien } }, { succes: d.t.entretien ? "" : "Contrat d'entretien signé" }),
      louer: (ctx, b, d, p) => ctx.decider("garage", { louer: { vehicule: p.id, location: b.dataset.id } }, { succes: b.dataset.id === "aucune" ? "Rien que pour toi" : "Mis en location" }),
      atelier: (ctx, b, d, p) => ouvrirAtelier(ctx, d, p),
      async partReserve(ctx, b, d, p) { etatDe(p, "vehicule", {}).part = Number(b.dataset.k); await ctx.rafraichir(); },
      async mettreAuxEncheres(ctx, b, d, p) {
        const reserve = Number(b.dataset.reserve);
        b.disabled = true;
        b.textContent = "Mise en vente…";
        const ok = await ctx.commande("encheres.mettreVehicule", { vehicule: p.id, reserve }, { succes: "En vente pour 24 h" });
        if (ok) { etatDe(p, "vehicule", {}).misEnVente = reserve; await ctx.rafraichir(); } else { b.disabled = false; b.textContent = "Mettre aux enchères"; }
      },
      leverOption(ctx, b, d, p) {
        confirmer(ctx, {
          titre: "Lever l'option ?", message: "La valeur résiduelle et les loyers restants, tout de suite. Ensuite, il compte dans ton patrimoine.",
          boutons: [{ texte: `Payer ${montant(d.t.soldeLeasing ?? 0)}`, faire: () => ctx.decider("garage", { leverOption: { vehicule: p.id } }, { succes: "Il est à toi" }) }],
        });
      },
      vendre(ctx, b, d, p) {
        const t = d.t;
        confirmer(ctx, {
          titre: "Vendre ce véhicule ?",
          message: `${t.viceConnu ? "Avec son vice caché, un pro n'en donne que 60 %." : "Un pro le reprend à 90 % de sa cote. Un crédit lié continue d'être remboursé."} Au marché noir : toute la cote en argent sale, mais il peut être saisi.`,
          boutons: [
            { texte: `Vendre pour ${montant(t.reprise)}`, faire: async () => { if (await ctx.decider("garage", { vendre: { vehicule: p.id } }, { succes: "Vendu" })) await ctx.retour(); } },
            { texte: `Au marché noir : ${montant(t.valeur)} en liquide`, genre: "secondaire",
              faire: async () => { if (await ctx.decider("illegal", { vendreAuNoir: { vehicule: p.id } }, { succes: "Vendu au noir" })) await ctx.retour(); } },
          ],
        });
      },
    },
  },

  permis: {
    titre: "Permis",
    async donnees(ctx) { return { t: await ctx.tableau("permis") }; },
    rendu: rendrePermis,
    actions: {
      async choisirPermis(ctx, b, d, p) { etatDe(p, "permis", {}).choisi = b.dataset.id; await ctx.rafraichir(); },
      inscrire(ctx, b, d) { const l = d.t.lignes.find((x) => x.id === b.dataset.id); return ctx.decider("garage", { inscrire: { permis: l.id } }, { succes: `Inscrit : ${l.nom}` }); },
      reviser(ctx, b, d) {
        const l = d.t.lignes.find((x) => x.id === b.dataset.id);
        return ctx.decider("garage", { reviser: l.revise ? {} : { permis: l.id } }, { succes: l.revise ? "Plus de permis en révision" : "Les sessions Révision avancent ce permis" });
      },
      formation: (ctx, b) => ctx.decider("garage", { formation: { permis: b.dataset.id } }, { succes: "Formation suivie" }),
      async examen(ctx, b, d) {
        const l = d.t.lignes.find((x) => x.id === b.dataset.id);
        if (!(await ctx.decider("garage", { examen: { permis: l.id } }))) return;
        const recu = (await ctx.tableau("permis"))?.lignes.find((x) => x.id === l.id)?.obtenu;
        ctx.toast(recu ? `Reçu ! ${l.nom} en poche` : "Raté. Tu pourras le repasser demain.", recu ? "gain" : "refus");
      },
    },
  },
};

for (const id of ["configurateur", "occasion", "vehicule"]) {
  const def = pages[id];
  pages[id] = { ...def, async donnees(ctx, p) { await chargerPhotos(); return def.donnees(ctx, p); } };
}
// Lot D : au grand écran, la concession garde sa liste à gauche ; le configurateur ou l'occasion s'ouvre à droite.
const concessionListe = pages.concession;
pages.concession = listeEtDetail("concession", {
  ...concessionListe,
  async donnees(ctx, p) { await chargerPhotos(); return concessionListe.donnees(ctx, p); },
}, { configurateur: pages.configurateur, occasion: pages.occasion }, {
  vide: () => videDetail("Choisis un modèle", "Sa photo, sa configuration et le bon de commande s'ouvrent ici, sans quitter la liste."),
});
const sectionDonnees = section.donnees;
section.donnees = async (ctx) => { await chargerPhotos(); return sectionDonnees(ctx); };
