// ══════════════════════════════════════════════════════════════════════
//  Zone « montres » (RNT-176 D196, RNT-182 D201) — EcransMontres.swift, écran pour écran :
//    section          ← SectionMontres        (Actifs › Montres : l'écrin, le poignet, les commandes)
//    horlogerie       ← EcranHorlogerie       (Vitrine de la ville | Maisons | Catalogue filtrable)
//    maisonMontres    ← EcranMaisonMontres    (une maison : ses collections, ses modèles)
//    modeleMontre     ← EcranModeleMontre     (le configurateur : la montre dessinée aux couleurs choisies)
//    pieceMontre      ← EcranPieceMontre      (une pièce de la vitrine : discuter, l'emporter)
//    annoncesMontres  ← EcranAnnoncesMontres  (l'occasion, l'expertise, les copies, les offres)
//    encheresMontres  ← EcranEncheresMontres  (le dimanche, quelques pièces rares)
//    montre           ← EcranMontre           (porter, réviser, sertir, assurer, vendre, enchères)
//  Le cadran se dessine en SVG (CadranMontre), à l'heure du jeu ; la photo, si le modèle en a une.
//  Tout achat passe par ctx.decider, donc par la fenêtre de paiement (paiement.js).
// ══════════════════════════════════════════════════════════════════════
import { montant, pourcent, esc } from "../format.js";
import { boutonEpingler } from "./objectifs.js";
import { carte, ligne, ligneValeur, segment, entetePousse, vide, courbeValeurs } from "../ui.js";
import {
  ico, pilule, filtre, choixRadio, tete, label, note, ligneEtat, papier, titrePapier, champPapier, etiquetteEncre, pave, confirmer, points,
  teinteRarete, possession, selecteurDisposition, lireDisposition, dispositionActifs, etatDe, teteListe, pastillesListe, compteListe,
  plusListe, nouvelleListe, contient, actif, trier, actionsListe, repeindre, variationTexte, pctSigne, argentDisponible,
} from "./immobilier.js";
import { photo as photoCatalogue, chargerPhotos, tableauGarde, listeEtDetail, estChoisi, videDetail } from "./catalogues.js";

// MARK: - Styles de la zone

const CSS = `
.vitrine-montre .cadran-montre { width:100%; height:100%; display:block; }
.montre-ligne { display:flex; align-items:center; gap:12px; padding:10px; width:100%; text-align:left; }
.montre-poignet { display:flex; align-items:center; gap:14px; width:100%; text-align:left; }
.annonce-montre { display:flex; flex-direction:column; gap:10px; padding:12px; border-radius:16px; background:#F1EEE7; color:#1D1C1A; box-shadow:0 4px 16px rgba(0,0,0,.3); }
.annonce-montre .sous-papier { font-size:12px; color:#6B675F; }
.annonce-montre .points i { background:#CFCAC0; } .annonce-montre .points i.oui { background:#1D1C1A; }
.bouton-encre { font-size:13px; font-weight:600; color:#F1EEE7; background:#1D1C1A; padding:0 16px; min-height:36px; border-radius:99px; }
.bouton-encre:disabled { opacity:.35; cursor:default; }
.titre-montre { font-size:22px; font-weight:700; letter-spacing:-.02em; margin:0; }
.vente-montre { text-align:left; }
.maisons-montres { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.maison-montre { display:flex; flex-direction:column; gap:6px; text-align:left; padding:8px 8px 12px; }
.maison-montre .nom { font-size:15px; font-weight:600; line-height:1.2; }
.maison-montre .det { font-size:12px; color:var(--texte2); }
.surtitre-montre { font-size:11px; font-weight:600; color:var(--texte2); text-transform:uppercase; letter-spacing:.06em; }
.options-montre { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; padding:2px 2px 4px; margin:0 -2px; }
.options-montre::-webkit-scrollbar { display:none; }
.option-montre { flex:none; width:104px; display:flex; flex-direction:column; align-items:center; gap:5px; padding:10px 6px 9px; border-radius:14px; border:1px solid var(--filet2); text-align:center; }
.option-montre[aria-pressed="true"] { border:1.5px solid var(--texte); background:color-mix(in srgb, var(--texte) 6%, transparent); }
.option-montre .pastille-option { width:34px; height:34px; border-radius:50%; box-shadow:inset 0 0 0 1px rgba(255,255,255,.18), 0 1px 3px rgba(0,0,0,.35); }
.option-montre .n { font-size:12px; font-weight:600; line-height:1.2; min-height:29px; display:flex; align-items:center; }
.option-montre .c { font-size:11px; color:var(--texte2); font-variant-numeric:tabular-nums; }
.option-montre .e { font-size:10px; font-weight:600; }
.select-maison { width:100%; min-height:40px; border-radius:12px; padding:0 12px; font:inherit; font-size:14px; background:transparent; color:var(--texte); border:1px solid var(--filet2); }
.atelier-montre { position:relative; border-radius:22px; overflow:hidden; }
.atelier-montre .photo-mini { position:absolute; right:10px; bottom:10px; width:64px; height:64px; border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.25); }
`;
if (typeof document !== "undefined" && !document.getElementById("css-montres")) {
  const s = document.createElement("style");
  s.id = "css-montres";
  s.textContent = CSS;
  document.head.append(s);
}

// MARK: - Le cadran dessiné (CadranMontre) et la vitrine (VitrineMontre)

const clarte = (hex) => {
  const v = parseInt(String(hex ?? "#3A3D45").replace("#", ""), 16) || 0x3a3d45;
  return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
};

/** Le contour du boîtier dans un carré de 100 : rond, carré, tonneau ou coussin. */
function contour(forme, cx, cy, l, h, attrs) {
  if (forme === "ronde") return `<circle cx="${cx}" cy="${cy}" r="${l / 2}" ${attrs}/>`;
  const r = forme === "carree" ? l * 0.14 : forme === "tonneau" ? l * 0.34 : l * 0.3;
  return `<rect x="${cx - l / 2}" y="${cy - h / 2}" width="${l}" height="${h}" rx="${r}" ${attrs}/>`;
}

/** L'heure du jeu (l'heure du serveur). */
const heureJeu = () => new Date(window.__grind?.maintenant?.() ?? Date.now());

/** Un petit tirage stable (les mouchetures d'une météorite, les pierres d'un pavé). */
const tirage = (n) => { let x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

/**
 * Une montre de face, à ses couleurs, ses aiguilles à l'heure du jeu. RNT-182 : la lunette bicolore
 * (lunette2), sertie (serti), le cadran à motif (panda, meteorite, pave, nacre, aventurine, squelette,
 * digital, diamants), le tourbillon à 6 h ; un bracelet métal (de la couleur du boîtier) a ses maillons,
 * un bracelet cuir ou caoutchouc ses surpiqûres.
 */
export function cadran(a, { id = "" } = {}) {
  const f = a.forme ?? "ronde";
  const [bl, bh] = f === "carree" ? [50, 64] : f === "tonneau" ? [52, 66] : [60, 60];
  const avecLunette = (a.lunette || a.serti) && f !== "carree";
  const ep = avecLunette ? bl * (a.serti ? 0.11 : 0.09) : bl * 0.05;
  const [cl, ch] = [bl - 2 * ep, bh - 2 * ep];
  const r = Math.min(cl, ch) / 2;
  const motif = a.motif ?? "";
  const encre = clarte(a.cadran) > 0.55 ? "#1B1C20" : "#F4F1EA";
  const g = `m${id}${Math.random().toString(36).slice(2, 7)}`;
  const t = heureJeu();
  const minutes = t.getMinutes(), heures = (t.getHours() % 12) + minutes / 60;
  const aiguille = (lg, la, angle, c) => `<rect x="${50 - la / 2}" y="${50 - lg + la / 2}" width="${la}" height="${lg}" rx="${la / 2}" fill="${c}" transform="rotate(${angle} 50 50)"/>`;
  const epais = a.famille === "plongee" ? r * 0.09 : a.famille === "habillee" ? r * 0.035 : r * 0.055;
  const digital = a.famille === "digital" || motif === "digital";

  // Les index : des bâtons ; des pierres pour un cadran « index diamants » ; rien pour un pavé ou un écran.
  const index = digital || motif === "pave" ? "" : Array.from({ length: 12 }, (_, i) => {
    if (motif === "diamants") return `<circle cx="50" cy="${50 - r * 0.78}" r="${r * (i % 3 === 0 ? 0.07 : 0.05)}" fill="#F7F9FF" stroke="#C9D4E8" stroke-width=".25" transform="rotate(${i * 30} 50 50)"/>`;
    const long = r * (i % 3 === 0 ? 0.24 : 0.15);
    return `<rect x="${50 - epais / 2}" y="${50 - r * 0.78 - long / 2}" width="${epais}" height="${long}" rx="${epais / 2}" fill="${i === 0 && a.famille !== "habillee" ? "#E3C46B" : encre}" transform="rotate(${i * 30} 50 50)"/>`;
  }).join("");

  // La lunette : une couleur, deux couleurs (« Pepsi » : la première en haut), ou des pierres.
  let lunette = "";
  if (avecLunette) {
    const rl = bl / 2 - ep * 0.3;
    if (a.lunette2 && f === "ronde") {
      const re = rl, ri = r + ep * 0.05;
      const arc = (haut, c) => `<path d="M${50 - re} 50 A${re} ${re} 0 0 ${haut ? 1 : 0} ${50 + re} 50 L${50 + ri} 50 A${ri} ${ri} 0 0 ${haut ? 0 : 1} ${50 - ri} 50 Z" fill="${c}"/>`;
      lunette = arc(true, a.lunette) + arc(false, a.lunette2);
    } else if (a.lunette) {
      lunette = contour(f, 50, 50, bl - ep * 0.6, bh - ep * 0.6, `fill="${a.lunette}"`);
    }
    if (a.serti) {
      const n = f === "ronde" ? 32 : 28, rp = r + ep * 0.5;
      const teinte = a.lunette && clarte(a.lunette) < 0.6 ? a.lunette : "#F6F8FD";
      lunette += Array.from({ length: n }, (_, i) => {
        const ang = (i / n) * Math.PI * 2;
        const x = 50 + Math.cos(ang) * rp * (f === "ronde" ? 1 : bl / Math.max(bl, bh));
        const y = 50 + Math.sin(ang) * rp * (f === "ronde" ? 1 : bh / Math.max(bl, bh));
        return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(ep * 0.3).toFixed(2)}" fill="${teinte}" stroke="#fff" stroke-opacity=".7" stroke-width=".2"/>`;
      }).join("");
    } else if (a.lunette && a.famille !== "habillee") {
      lunette += Array.from({ length: 12 }, (_, i) =>
        `<rect x="${50 - ep * 0.09}" y="${50 - r - ep * 0.72}" width="${ep * (i ? 0.18 : 0.3)}" height="${ep * 0.55}" fill="${clarte(a.lunette) > 0.55 ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.7)"}" transform="rotate(${i * 30} 50 50)"/>`).join("");
    }
  }

  // La matière du cadran.
  let matiere = "";
  if (motif === "meteorite") {
    matiere = Array.from({ length: 70 }, (_, i) => {
      const ang = tirage(i) * Math.PI * 2, d = Math.sqrt(tirage(i + 99)) * r * 0.97;
      return `<circle cx="${(50 + Math.cos(ang) * d).toFixed(2)}" cy="${(50 + Math.sin(ang) * d).toFixed(2)}" r="${(0.3 + tirage(i + 7) * 1.4).toFixed(2)}" fill="${tirage(i + 3) > 0.5 ? "#fff" : "#000"}" fill-opacity="${(0.08 + tirage(i + 5) * 0.14).toFixed(2)}"/>`;
    }).join("");
  } else if (motif === "pave") {
    matiere = Array.from({ length: 90 }, (_, i) => {
      const ang = i * 2.39996, d = Math.sqrt(i / 90) * r * 0.95;
      return `<circle cx="${(50 + Math.cos(ang) * d).toFixed(2)}" cy="${(50 + Math.sin(ang) * d).toFixed(2)}" r="${(r * 0.055).toFixed(2)}" fill="#fff" stroke="#C9D2E4" stroke-width=".15"/>`;
    }).join("");
  } else if (motif === "aventurine") {
    matiere = Array.from({ length: 40 }, (_, i) => {
      const ang = tirage(i + 40) * Math.PI * 2, d = Math.sqrt(tirage(i + 140)) * r * 0.95;
      return `<circle cx="${(50 + Math.cos(ang) * d).toFixed(2)}" cy="${(50 + Math.sin(ang) * d).toFixed(2)}" r="${(0.15 + tirage(i + 9) * 0.35).toFixed(2)}" fill="#fff" fill-opacity="${(0.4 + tirage(i + 11) * 0.6).toFixed(2)}"/>`;
    }).join("");
  } else if (motif === "squelette") {
    matiere = [[0, -0.35, 0.3], [-0.38, 0.22, 0.24], [0.36, 0.25, 0.2]].map(([x, y, k]) =>
      `<circle cx="${50 + x * r}" cy="${50 + y * r}" r="${k * r}" fill="none" stroke="#C9A85A" stroke-opacity=".75" stroke-width="${r * 0.05}" stroke-dasharray="${r * 0.05} ${r * 0.035}"/>
       <circle cx="${50 + x * r}" cy="${50 + y * r}" r="${k * r * 0.25}" fill="#C9A85A" fill-opacity=".6"/>`).join("");
  }
  const nacre = motif === "nacre" ? `<linearGradient id="${g}n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E9F2"/><stop offset=".35" stop-color="#E3EEF5"/><stop offset=".7" stop-color="#F3F0DF"/><stop offset="1" stop-color="#E6DDF0"/></linearGradient>` : "";

  // Les compteurs : chrono (panda : de la couleur opposée au cadran), phase de lune, tourbillon, date.
  let compteurs = "";
  if (digital) {
    const hh = String(t.getHours()).padStart(2, "0"), mm = String(minutes).padStart(2, "0");
    // Un écran à cadran digital est déjà l'écran ; sinon une fenêtre LCD au milieu du cadran.
    compteurs = `${motif === "digital" ? "" : `<rect x="${50 - r * 0.72}" y="${50 - r * 0.32}" width="${r * 1.44}" height="${r * 0.64}" rx="${r * 0.08}" fill="#9AA58B" stroke="#000" stroke-opacity=".35" stroke-width=".4"/>`}
      <text x="50" y="${50 + r * 0.15}" font-size="${r * 0.4}" font-weight="600" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" fill="${clarte(a.cadran) > 0.4 ? "#1E2419" : "#9FE0B5"}">${hh}:${mm}</text>`;
  } else if (a.famille === "chrono") {
    const panda = motif === "panda";
    const fond = panda ? (clarte(a.cadran) > 0.55 ? "#17181B" : "#ECEAE4") : encre;
    compteurs = [[-1, 0], [0, 1], [1, 0]].map(([x, y]) => `<circle cx="${50 + x * r * 0.45}" cy="${50 + y * r * 0.45}" r="${r * 0.24}" fill="${fond}" fill-opacity="${panda ? 1 : 0.08}" stroke="${panda ? fond : encre}" stroke-opacity=".55" stroke-width="${Math.max(0.4, r * 0.02)}"/>`).join("");
  } else if (a.famille === "tourbillon") {
    const ry = 50 + r * 0.42, rr = r * 0.26;
    compteurs = `<circle cx="50" cy="${ry}" r="${rr}" fill="#0E0E10"/>
      <circle cx="50" cy="${ry}" r="${rr * 0.78}" fill="none" stroke="#C9A85A" stroke-width="${rr * 0.12}"/>
      ${[0, 60, 120].map((k) => `<rect x="${50 - rr * 0.06}" y="${ry - rr * 0.78}" width="${rr * 0.12}" height="${rr * 1.56}" fill="#D9DCE1" transform="rotate(${k + minutes * 6} 50 ${ry})"/>`).join("")}
      <circle cx="50" cy="${ry}" r="${rr * 0.18}" fill="#C9A85A"/>`;
  } else if (a.famille === "compliquee") {
    compteurs = `<clipPath id="${g}l"><rect x="${50 - r * 0.25}" y="${50 + r * 0.17}" width="${r * 0.5}" height="${r * 0.26}" rx="${r * 0.13}"/></clipPath>
      <g clip-path="url(#${g}l)"><circle cx="50" cy="${50 + r * 0.42}" r="${r * 0.25}" fill="#1F3A68"/><circle cx="${50 - r * 0.08}" cy="${50 + r * 0.3}" r="${r * 0.08}" fill="#E3C46B"/></g>`;
  } else if (a.famille !== "habillee" && motif !== "pave") {
    compteurs = `<rect x="${50 + r * 0.47}" y="${50 - r * 0.085}" width="${r * 0.22}" height="${r * 0.17}" rx="${r * 0.03}" fill="#fff"/>
      <text x="${50 + r * 0.58}" y="${50 + r * 0.045}" font-size="${r * 0.12}" font-weight="700" text-anchor="middle" font-family="system-ui,sans-serif" fill="#000">${t.getDate()}</text>`;
  }
  const trotteuse = !digital && ["plongee", "sport", "chrono"].includes(a.famille)
    ? aiguille(r * 0.82, Math.max(0.6, r * 0.02), minutes * 6 + 137, a.famille === "plongee" ? "#E5534B" : "#E3C46B") : "";
  const aiguilles = digital ? "" : `${aiguille(r * 0.52, r * 0.075, heures * 30, encre)}${aiguille(r * 0.76, r * 0.055, minutes * 6, encre)}${trotteuse}<circle cx="50" cy="50" r="${r * 0.05}" fill="${encre}"/>`;

  // Le bracelet : des maillons s'il est du métal du boîtier, des surpiqûres sinon.
  const metal = String(a.bracelet).toLowerCase() === String(a.boitier).toLowerCase();
  const larg = bl * 0.56;
  const bracelet = (y, haut) => {
    const m = `mask="url(#${g}${haut ? "h" : "b"})"`;
    const x0 = 50 - larg / 2;
    const dessus = metal
      ? [0, 1, 2, 3, 4].map((k) => `<rect x="${x0 + 0.4}" y="${y + 1.5 + k * 4.2}" width="${larg - 0.8}" height=".35" fill="#000" fill-opacity=".22" ${m}/>`).join("")
        + `<rect x="${x0 + larg * 0.32}" y="${y}" width="${larg * 0.36}" height="22" fill="#fff" fill-opacity=".14" ${m}/>`
      : `<rect x="${x0 + 1.4}" y="${y}" width="${larg - 2.8}" height="22" rx="1.5" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".35" stroke-dasharray="1 .8" ${m}/>`;
    return `<rect x="${x0}" y="${y}" width="${larg}" height="22" rx="3" fill="${a.bracelet}" ${m}/>${dessus}`;
  };
  const fondCadran = motif === "nacre" ? `url(#${g}n)` : a.cadran;
  return `<svg viewBox="0 0 100 100" class="cadran-montre" aria-hidden="true">
    <defs>
      <linearGradient id="${g}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a.boitier}"/><stop offset=".5" stop-color="${a.boitier}" stop-opacity=".6"/><stop offset="1" stop-color="${a.boitier}"/></linearGradient>
      <radialGradient id="${g}r" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <linearGradient id="${g}v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${g}hm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <linearGradient id="${g}bm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="${g}h"><rect x="0" y="${50 - bh / 2 - 22 + 4}" width="100" height="22" fill="url(#${g}hm)"/></mask>
      <mask id="${g}b"><rect x="0" y="${50 + bh / 2 - 4}" width="100" height="22" fill="url(#${g}bm)"/></mask>
      <clipPath id="${g}k">${contour(f, 50, 50, cl, ch, "")}</clipPath>
      <filter id="${g}o" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-opacity=".45"/></filter>
      ${nacre}
    </defs>
    ${bracelet(50 - bh / 2 - 22 + 4, true)}${bracelet(50 + bh / 2 - 4, false)}
    <rect x="${50 + bl / 2 - 1.5}" y="45.7" width="5" height="8.5" rx="2.5" fill="url(#${g}c)"/>
    ${contour(f, 50, 50, bl, bh, `fill="url(#${g}c)" filter="url(#${g}o)"`)}
    ${lunette}
    ${contour(f, 50, 50, cl, ch, `fill="${fondCadran}"`)}
    <g clip-path="url(#${g}k)">${matiere}</g>
    ${contour(f, 50, 50, cl, ch, `fill="url(#${g}r)"`)}
    ${index}${compteurs}${aiguilles}
    ${contour(f, 50, 50, cl, ch, `fill="url(#${g}v)"`)}
  </svg>`;
}

/** VitrineMontre : un écrin de velours sombre, un projecteur, le liseré de la rareté ; la photo si elle existe. */
export function vitrineMontre(a, { hauteur = 120, eteinte = false, largeur = "", prioritaire = false } = {}) {
  const c = teinteRarete(a.rarete);
  const photo = photoCatalogue("montre", a.photo, { eteinte, voile: false, prioritaire });
  return `<div class="vitrine vitrine-montre" style="--h:${hauteur}px;${largeur ? `--l:${largeur}px;` : ""}background:linear-gradient(#24222A,#0E0D11);${c ? `--bord:2px solid ${c}` : ""}" aria-hidden="true">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0, rgba(255,255,255,${eteinte ? 0.04 : 0.14}), transparent 70%)"></div>
    <div style="position:absolute;inset:${hauteur * 0.06}px;${eteinte ? "filter:saturate(.2);opacity:.55" : ""}">${cadran(a)}</div>${photo}
  </div>`;
}

/** PastilleRareteMontre : rien pour une montre courante. */
export function pastilleRareteMontre(r, { enLigne = false } = {}) {
  const c = teinteRarete(r);
  return c ? `<span class="rarete ${enLigne ? "en-ligne" : ""}" style="--r:${c}">${["", "✦ Recherchée", "✦ Rare", "♛ Mythique"][Math.min(3, r)]}</span>` : "";
}

const virgule = (x, d) => x.toFixed(d).replace(".", ",");
const varPct = (v) => `<span class="chiffres" style="font-size:12px;font-weight:600;color:${v >= 0 ? "var(--gain)" : "var(--perte)"}">${pctSigne(v, 1)}</span>`;
const courbeCote = (h) => (h?.length >= 2 ? courbeValeurs(h, { hauteur: 70 }) : `<p class="aide">La courbe se dessine au fil des jours.</p>`);
const aCoups = (l) => (l ?? []).map((x) => note(x.ampleur >= 0 ? "hausse" : "alerteTri", `Jour ${x.jour + 1} : ${esc(x.texte)} (${pctSigne(x.ampleur, 0)})`, x.ampleur >= 0 ? "var(--gain)" : "var(--perte)")).join("");
const jourEtHeure = (d) => new Date(d).toLocaleString("fr-BE", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const jourCourt = (d) => new Date(d).toLocaleDateString("fr-BE", { weekday: "short", day: "numeric", month: "short" });

/** Une ligne de montre (catalogue, maison) : sa vitrine, sa marque, son nom, son prix, sa cote. */
function ligneModele(m, palier = "", choisi = false) {
  const etat = m.star ? `<span style="font-size:12px;font-weight:600;color:var(--or)">Liste d'attente · ${esc(m.delai.toLowerCase())}</span>`
    : !m.disponible ? `<span style="font-size:12px;font-weight:600;color:var(--alerte)">${m.retourDans ? `De retour dans ${m.retourDans} sem.` : "Aux enchères seulement"}</span>`
    : m.enVitrine ? `<span style="font-size:12px;font-weight:600;color:var(--gain)">En vitrine ici</span>`
    : `<span style="font-size:12px;color:var(--texte2)">${esc(m.delai)}${palier ? ` · ${esc(palier)}` : ""}</span>`;
  return `<button class="carte montre-ligne" data-action="ouvrir" data-page="modeleMontre" data-p='${esc(JSON.stringify({ id: m.id }))}' ${choisi ? 'aria-current="true"' : ""}>
    ${vitrineMontre(m.apparence, { hauteur: 76, largeur: 76, eteinte: !m.disponible && !m.star })}
    <span style="flex:1;min-width:0;text-align:left;display:flex;flex-direction:column;gap:2px">
      <span class="surtitre-montre">${esc(m.marque)}</span>
      <span style="font-size:15px;font-weight:600">${esc(m.nom)}</span>
      <span><b class="chiffres" style="font-size:14px">${montant(m.prix)}</b> <span class="chiffres" style="font-size:12px;color:${m.cote >= m.prix ? "var(--gain)" : "var(--texte2)"}">cote ${montant(m.cote)}</span></span>
      ${etat}
    </span>
    <span style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">${pastilleRareteMontre(m.apparence.rarete, { enLigne: true })}${varPct(m.variation)}</span>
  </button>`;
}

/** Une pièce de la vitrine (StockMontre). */
function ligneStock(s, choisi = false) {
  return `<button class="carte montre-ligne" data-action="ouvrir" data-page="pieceMontre" data-p='${esc(JSON.stringify({ id: s.id }))}' ${choisi ? 'aria-current="true"' : ""}>
    ${vitrineMontre(s.apparence, { hauteur: 76, largeur: 76 })}
    <span style="flex:1;min-width:0;text-align:left;display:flex;flex-direction:column;gap:2px">
      <span class="surtitre-montre">${esc(s.marque)}${s.boutique ? " · boutique" : ""}</span>
      <span style="font-size:15px;font-weight:600">${esc(s.nom)}</span>
      <span style="font-size:12px;color:var(--texte2)">${s.options.length ? esc(s.options.join(", ")) : "De série"}</span>
    </span>
    <span style="text-align:right">${s.prixNegocie != null ? `<div class="barre chiffres" style="font-size:12px">${montant(s.prix)}</div><div class="chiffres" style="font-size:15px;font-weight:700;color:var(--gain)">${montant(s.prixNegocie)}</div>`
      : `<div class="chiffres" style="font-size:15px;font-weight:700">${montant(s.prix)}</div>`}</span>
  </button>`;
}

/** Mes commandes et mes listes d'attente. */
function blocCommandes(t) {
  if (!t.commandes.length && !t.attentes.length) return "";
  return carte(`${tete("calendrier", "var(--vente)", "Commandes et listes d'attente")}
    ${t.commandes.map((c) => `<div class="rangee" style="gap:12px">${vitrineMontre(c.apparence, { hauteur: 52, largeur: 52 })}
      <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${esc(c.nom)}</div>
        <div class="aide">Arrive ${esc(jourEtHeure(c.arrivee))}${c.options.length ? ` · ${esc(c.options.join(", "))}` : ""}</div></div>
      <span class="chiffres" style="font-size:13px">${montant(c.prix)}</span></div>`).join("")}
    ${t.attentes.map((a) => `<button class="rangee" style="gap:12px;width:100%;text-align:left" data-action="ouvrir" data-page="modeleMontre" data-p='${esc(JSON.stringify({ id: a.modele }))}'>${vitrineMontre(a.apparence, { hauteur: 52, largeur: 52 })}
      <div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${esc(a.nom)}</div>
        <div class="aide" style="${a.tourVenu ? "color:var(--gain);font-weight:600" : ""}">${a.tourVenu ? `Ton tour est venu : commande-la dans les ${a.joursPourCommander} jours` : `Liste d'attente : encore ${a.semaines} semaine${a.semaines > 1 ? "s" : ""}`}</div></div></button>`).join("")}`, { classe: "pz-carte" });
}

// MARK: - La section de l'onglet Actifs (SectionMontres)

export const section = {
  async donnees(ctx) { return { t: await ctx.tableau("montres") }; },
  rendu(d) {
    const t = d?.t;
    if (!t) return vide("L'horlogerie ouvre avec ta première saison.");
    const galerie = lireDisposition() === "galerie";
    const portee = t.pieces.find((x) => x.id === t.portee);
    const exemple = t.modeles.find((m) => m.id === "rolex-submariner") ?? t.modeles[0];
    return `<div class="pz-pile" style="gap:14px">
      ${!t.pieces.length ? `<div class="pz-pile" style="gap:12px">${exemple ? vitrineMontre(exemple.apparence, { hauteur: 150, eteinte: true }) : ""}
          <p class="aide">Plus de cinq cents montres, de la Casio à la pièce unique, à composer comme une voiture. Un placement qui a sa cote, et un statut : porte-la, elle te fait plaisir, t'aide à négocier… et attire les voleurs.</p></div>` : `
        ${portee ? `<button class="carte pad montre-poignet" data-action="ouvrir" data-page="montre" data-p='${esc(JSON.stringify({ id: portee.id }))}'>
            ${vitrineMontre(portee.apparence, { hauteur: 92, largeur: 92 })}
            <span style="flex:1;min-width:0;text-align:left;display:flex;flex-direction:column;gap:3px">
              <span class="aide">Au poignet</span>
              <span style="font-size:16px;font-weight:600">${esc(portee.marque)} ${esc(portee.nom)}</span>
              <span style="font-size:12px;font-weight:500;color:var(--gain)">+${virgule(t.plaisirJour, 2)} de plaisir par jour</span>
              ${t.credibilite > 0 ? `<span style="font-size:12px;color:var(--texte2)">Crédibilité : ${pourcent(t.credibilite, 1)} de remise en plus quand tu négocies</span>` : ""}
              <span style="font-size:12px;color:${t.risqueVol > 0.003 ? "var(--alerte)" : "var(--texte2)"}">Vol : ${pourcent(t.risqueVol, 2)} par jour ici</span>
            </span></button>`
          : `<p class="aide">Aucune montre au poignet : celles de l'écrin dorment, sans usure ni risque. Ouvre-en une pour la porter.</p>`}
        <div class="rangee entre"><span class="libelle">${t.pieces.length} montre${t.pieces.length > 1 ? "s" : ""} dans l'écrin</span>${selecteurDisposition()}</div>
        <div class="possessions ${galerie ? "galerie" : ""}">${t.pieces.map((x) => possession({
          nom: `${x.marque} ${x.nom}`, valeur: montant(x.valeur), galerie, page: "montre", p: { id: x.id },
          badge: x.plusValue !== 0 ? (x.plusValue > 0 ? "+" : "−") + montant(Math.abs(x.plusValue)) : "",
          lignes: [[x.statut, x.fausseConnue ? "var(--alerte)" : x.portee ? "var(--gain)" : "var(--texte2)", x.portee ? "main" : ""],
                   [`${x.palier}, état ${pourcent(x.etat)}`, "var(--texte2)"]],
          visuel: (h) => vitrineMontre(x.apparence, { hauteur: h }),
        })).join("")}</div>`}
      ${blocCommandes(t)}
      ${carte(
        ligne({ titre: "Horlogerie", detail: t.aLHorlogerie ? `Tu y es : ${t.stock.length} pièces en vitrine, tout le catalogue à composer` : `${t.stock.length} pièces en vitrine à ${esc(t.ville)}, tout le catalogue à composer`, page: "horlogerie", icone: ico.horloge, teinte: "var(--vente)" })
        + ligne({ titre: "Annonces", detail: `${t.annonces.length} montres d'occasion cette semaine, attention aux copies`, page: "annoncesMontres", icone: ico.etiquette, teinte: "var(--equipe)" })
        + ligne({ titre: "Enchères", detail: "Le dimanche après-midi, quelques pièces rares", page: "encheresMontres", icone: ico.marteau, teinte: "var(--grandir)" }))}
    </div>`;
  },
  actions: { dispositionActifs },
};

// MARK: - L'horlogerie (EcranHorlogerie) : la vitrine, les maisons, le catalogue

const TRIS_HORLOGERIE = [{ id: "prix", nom: "Prix" }, { id: "cote", nom: "Cote / neuf", croissant: false }, { id: "variation", nom: "Semaine", croissant: false }, { id: "nom", nom: "Nom" }];
const TRANCHES = [["p0", "Moins de 1 000 €", 0, 100000], ["p1", "1 000 à 10 000 €", 100000, 1000000], ["p2", "10 000 à 50 000 €", 1000000, 5000000],
  ["p3", "50 000 à 250 000 €", 5000000, 25000000], ["p4", "Plus de 250 000 €", 25000000, Infinity]];
const listeHorlogerie = (p) => etatDe(p, "horlogerie", () => ({ ...nouvelleListe("prix"), marque: "" }));
const ongletHorlogerie = (p) => etatDe(p, "ongletHorlogerie", { choix: "vitrine" });

function corpsCatalogue(d, p) {
  const e = listeHorlogerie(p), t = d.t;
  const tranches = TRANCHES.filter(([id]) => actif(e, id));
  const matieres = t.matieres.map((x) => x.id).filter((x) => actif(e, `matiere:${x}`));
  const base = t.modeles
    .filter((m) => contient(e, m.marque, m.nom, m.collection, m.reference ?? ""))
    .filter((m) => !e.marque || m.marque === e.marque)
    .filter((m) => !tranches.length || tranches.some(([, , lo, hi]) => m.prix >= lo && m.prix < hi))
    .filter((m) => !matieres.length || m.matieres.some((x) => matieres.includes(x)))
    .filter((m) => !actif(e, "vitrine") || m.enVitrine)
    .filter((m) => !actif(e, "stars") || m.star)
    .filter((m) => !actif(e, "abordable") || m.prix <= d.dispo)
    .filter((m) => !actif(e, "hausse") || m.variation > 0);
  const l = trier(base, e, { prix: (m) => m.prix, cote: (m) => m.cote / Math.max(1, m.prix), variation: (m) => m.variation }, (m) => `${m.marque} ${m.nom}`);
  const filtres = [...TRANCHES.map(([id, nom]) => ({ id, nom })), ...t.matieres.map((x) => ({ id: `matiere:${x.id}`, nom: x.nom })),
    { id: "vitrine", nom: "En vitrine ici" }, { id: "stars", nom: "Modèles stars" }, { id: "abordable", nom: "À ta portée" }, { id: "hausse", nom: "En hausse" }];
  return `${pastillesListe("horlogerie", e, filtres)}${compteListe("horlogerie", e, l.length, "modèles")}
    ${!l.length ? `<p class="aide">Aucun modèle ne correspond.</p>` : ""}
    <div class="cat-grille"><div class="cat-cartes">${l.slice(0, e.montres).map((m) => ligneModele(m, t.paliers[m.palier] ?? "", estChoisi(p, "modeleMontre", "id", m.id))).join("")}</div></div>
    ${plusListe("horlogerie", l.length, e.montres)}`;
}

function rendreHorlogerie(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Horlogerie")}${vide("L'horlogerie ouvre avec ta première saison.")}`;
  const o = ongletHorlogerie(p).choix;
  const e = listeHorlogerie(p);
  const marques = [...new Set(t.modeles.map((m) => m.marque))].sort((a, b) => a.localeCompare(b, "fr"));
  let corps;
  if (o === "vitrine") {
    corps = `${!t.aLHorlogerie ? note("repere", `Pour emporter une pièce, commander, réviser ou expertiser, va à l'horlogerie de ${esc(t.ville)} (Accueil, le plan). Ici, tu regardes.`) : ""}
      <p class="aide">${t.stock.length} pièces à emporter tout de suite, renouvelées chaque semaine${t.boutiques.length ? `, dont les boutiques ${esc(t.boutiques.join(", "))}` : ""}. Une pièce de vitrine se discute ; le reste du catalogue se commande, avec le délai de sa maison.</p>
      ${blocCommandes(t)}
      <div class="cat-grille"><div class="cat-cartes">${t.stock.map((s) => ligneStock(s, estChoisi(p, "pieceMontre", "id", s.id))).join("")}</div></div>`;
  } else if (o === "maisons") {
    corps = `<p class="aide">${t.maisons.length} maisons, de la pièce unique à la montre de tous les jours. Chacune livre à son rythme.</p>
      <div class="maisons-montres">${t.maisons.map((m) => `<button class="carte maison-montre" data-action="ouvrir" data-page="maisonMontres" data-p='${esc(JSON.stringify({ id: m.id }))}'>
        ${vitrineMontre(m.apparence, { hauteur: 110 })}
        <span class="nom">${esc(m.id)}</span>
        <span class="det">${m.modeles} modèle${m.modeles > 1 ? "s" : ""} · dès ${montant(m.prixMin)}</span>
        <span class="det">${esc(m.delai)}${m.boutiqueIci ? ` · <b style="color:var(--gain)">boutique ici</b>` : ""}</span>
      </button>`).join("")}</div>`;
  } else {
    corps = `${teteListe({ id: "horlogerie", etat: e, invite: "Marque, modèle, référence", tris: TRIS_HORLOGERIE })}
      <select class="select-maison" data-saisie="horlogerieMarque" aria-label="Maison">
        <option value="">Toutes les maisons</option>${marques.map((m) => `<option value="${esc(m)}" ${m === e.marque ? "selected" : ""}>${esc(m)}</option>`).join("")}
      </select>
      <div id="horlogerie-corps" class="pz-pile" style="gap:12px">${corpsCatalogue(d, p)}</div>`;
  }
  return `${entetePousse("Horlogerie")}
  <div class="pz-pile" style="gap:14px">
    ${segment([["vitrine", "Vitrine"], ["maisons", "Maisons"], ["catalogue", "Catalogue"]], o, "ongletHorlogerie")}
    ${corps}
  </div>`;
}

// MARK: - Une maison (EcranMaisonMontres)

function rendreMaison(d) {
  const t = d.t;
  if (!t) return `${entetePousse("Maison")}${vide("Cette maison n'est pas au catalogue.")}`;
  return `${entetePousse(t.id)}
  <div class="pz-pile" style="gap:14px">
    ${carte(ligneValeur("Délai de livraison", esc(t.delai)) + ligneValeur("Négociation", esc(t.negociation))
      + ligneValeur(`Boutique à ${t.ville}`, t.boutiqueIci ? "Oui" : "Non") + ligneValeur("Modèles", String(t.modeles)))}
    ${t.attentes.length ? carte(`${tete("couronne", "var(--or)", "Tes listes d'attente")}${t.attentes.map((a) => `<p class="aide"><b>${esc(a.nom)}</b> : ${a.tourVenu ? `ton tour est venu, ${a.joursPourCommander} jours pour commander` : `encore ${a.semaines} semaine${a.semaines > 1 ? "s" : ""}`}. Chaque pièce ${esc(t.id)} achetée te fait monter.</p>`).join("")}`, { classe: "pz-carte" }) : ""}
    ${t.collections.map((c) => `<div class="pz-pile" style="gap:10px">
      <div class="rangee entre"><span class="libelle">${esc(c.id)}</span><span class="aide">dès ${montant(c.prixMin)}</span></div>
      ${c.modeles.map((m) => ligneModele(m)).join("")}</div>`).join("")}
  </div>`;
}

// MARK: - Le configurateur (EcranModeleMontre)

const etatConfig = (p) => etatDe(p, "config", { config: null, enCours: false });

/** La pastille d'une option : sa couleur (deux pour une lunette bicolore), des pierres, un motif. */
function pastilleOption(type, o, boitier) {
  const c = o.hex ?? boitier ?? "#C9CCD1";
  let fond = `background:${c}`;
  if (o.hex2) fond = `background:linear-gradient(180deg, ${o.hex} 50%, ${o.hex2} 50%)`;
  else if (o.serti) fond = `background:radial-gradient(circle at 35% 35%, #fff, ${c} 60%)`;
  else if (o.motif === "meteorite") fond = `background:radial-gradient(circle at 30% 30%, rgba(255,255,255,.25) 0 8%, transparent 9%), radial-gradient(circle at 65% 60%, rgba(0,0,0,.25) 0 10%, transparent 11%), ${c}`;
  else if (o.motif === "pave") fond = `background:radial-gradient(circle, #fff 0 22%, transparent 24%) 0 0/8px 8px, #DDE3EE`;
  else if (o.motif === "nacre") fond = `background:linear-gradient(135deg,#F6E9F2,#E3EEF5,#F3F0DF)`;
  else if (o.motif === "aventurine") fond = `background:radial-gradient(circle, #fff 0 6%, transparent 8%) 2px 3px/9px 9px, ${c}`;
  else if (o.motif === "panda") fond = `background:radial-gradient(circle at 30% 50%, ${clarte(c) > 0.5 ? "#17181B" : "#ECEAE4"} 0 16%, transparent 17%), radial-gradient(circle at 70% 50%, ${clarte(c) > 0.5 ? "#17181B" : "#ECEAE4"} 0 16%, transparent 17%), ${c}`;
  else if (type === "mecanisme") fond = `background:conic-gradient(from 0deg, #C9A85A, #8D7440, #C9A85A, #8D7440, #C9A85A)`;
  return `<span class="pastille-option" style="${fond}"></span>`;
}

const texteEffet = (o) => {
  if (o.etoile) return `<span class="e" style="color:var(--or)">★ ${pctSigne(o.cote, 0)} à la revente</span>`;
  if (Math.abs(o.cote) >= 0.005) return `<span class="e" style="color:${o.cote > 0 ? "var(--gain)" : "var(--perte)"}">${pctSigne(o.cote, 0)} à la revente</span>`;
  return `<span class="e" style="color:var(--texte3)">Cote inchangée</span>`;
};

function rendreModele(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Montre")}${vide("Ce modèle n'est pas au catalogue.")}`;
  const e = etatConfig(p);
  const dessin = t.apparenceConfiguree ?? t.apparence;
  // La photo du modèle sur sa fiche : la série en grand ; composé, la montre dessinée, la photo en vignette.
  const photo = t.apparence.photo;
  const heros = photo && t.serie ? vitrineMontre(t.apparence, { hauteur: 260, prioritaire: true })
    : `${vitrineMontre(dessin, { hauteur: 260 })}${photo ? `<div class="photo-mini">${vitrineMontre(t.apparence, { hauteur: 64 })}</div>` : ""}`;
  const choix = (t.rangees ?? []).filter((r) => r.options.length > 1);
  const fixes = (t.rangees ?? []).filter((r) => r.options.length === 1);
  const immediat = !t.arriveeMin;
  const prete = !t.refus && t.aLHorlogerie && !e.enCours;
  const titreBouton = e.enCours ? "Commande…" : immediat ? `Acheter, ${montant(t.prixConfigure)}` : `Commander, ${montant(t.prixConfigure)}`;
  return `${entetePousse(t.marque)}
  <div class="pz-pile">
    <div class="atelier-montre">${heros}<div style="position:absolute;top:10px;left:10px">${pastilleRareteMontre(t.rareteRang)}</div></div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <span class="surtitre-montre">${esc(t.collection)}${t.reference ? ` · réf. ${esc(t.reference)}` : ""}</span>
      <h2 class="titre-montre">${esc(t.nom)}</h2>
      <p style="font-size:14px;color:var(--texte2);margin:0">${esc(t.detail)}</p>
      <div class="pz-prix" style="margin-top:6px"><span class="chiffres" style="font-size:34px">${montant(t.prixConfigure)}</span>
        ${!t.serie ? `<span style="font-size:13px;color:var(--texte2)">série ${montant(t.prix)}</span>` : ""}</div>
      <div class="rangee" style="gap:14px;flex-wrap:wrap">
        <span style="font-size:13px;color:var(--texte2)">Revente estimée <b class="chiffres" style="color:${t.reventeConfiguree >= t.prixConfigure ? "var(--gain)" : "var(--texte)"}">${montant(t.reventeConfiguree)}</b></span>
        ${Math.abs(t.facteurCote - 1) >= 0.005 ? `<span style="font-size:13px;font-weight:600;color:${t.facteurCote > 1 ? "var(--gain)" : "var(--perte)"}">${pctSigne(t.facteurCote - 1, 0)} sur la cote</span>` : ""}
      </div>
      <div style="padding-top:4px">${boutonEpingler(null, { sorte: "montre", cible: t.id, montant: t.prixConfigure, nom: `${t.marque} ${t.nom}` })}</div>
    </div>
    ${choix.map((r) => carte(`<span class="libelle">${esc(r.titre)}</span>
      <div class="options-montre" role="radiogroup" aria-label="${esc(r.titre)}">${r.options.map((o) => `<button class="option-montre" role="radio" aria-pressed="${o.id === r.choisi}" aria-checked="${o.id === r.choisi}" data-action="option" data-rangee="${r.id}" data-id="${esc(o.id)}">
        ${pastilleOption(r.id, o, dessin.boitier)}
        <span class="n">${esc(o.nom)}</span>
        <span class="c">${o.surcout === 0 ? "De série" : (o.surcout > 0 ? "+" : "−") + montant(Math.abs(o.surcout))}</span>
        ${texteEffet(o)}
      </button>`).join("")}</div>`, { classe: "pz-carte" })).join("")}
    ${fixes.length ? carte(fixes.map((r) => ligneValeur(r.titre, esc(r.options[0].nom))).join("")) : ""}
    ${carte(`${tete("horloge", "var(--controles)", immediat ? "Disponible tout de suite" : `Livrée en ${t.delai.toLowerCase()}`)}
      ${!immediat ? `<p class="aide">Commandée maintenant, elle arrive entre le ${esc(jourCourt(t.arriveeMin))} et le ${esc(jourCourt(t.arriveeMax))}, le matin. Tu es prévenu à son arrivée.</p>` : ""}
      <p class="aide">${esc(t.entretien)}</p>`, { classe: "pz-carte" })}
    ${t.star ? carte(`${tete("couronne", "var(--or)", "Liste d'attente")}
      <p class="aide">${t.inscrit ? (t.tourVenu ? "Ton tour est venu : compose-la et commande-la." : `Tu es inscrit : encore ${t.semainesAttente} semaine${t.semainesAttente > 1 ? "s" : ""}. Chaque pièce ${esc(t.marque)} achetée te fait monter.`)
        : `Un modèle star : ${t.semainesAttente} semaines d'attente. Acheter d'autres pièces ${esc(t.marque)} te fait monter.`}</p>
      ${t.peutSInscrire ? pilule("M'inscrire sur la liste", "inscrire", { plein: true }) : ""}`, { classe: "pz-carte" }) : ""}
    ${t.stock?.length ? carte(`${tete("etiquette", "var(--equipe)", `En vitrine à ${esc(d.ville)}`)}${t.stock.map(ligneStock).join("")}`, { classe: "pz-carte" }) : ""}
    ${carte(ligneValeur("Au poignet, chaque jour", `+${virgule(t.plaisirJour, 2)} de plaisir`)
      + ligneValeur("Crédibilité au poignet", t.credibilite > 0 ? `${pourcent(t.credibilite, 1)} de remise en plus` : "aucune")
      + ligneValeur("Cote de la série", montant(t.cote))
      + (t.possedees > 0 ? ligneValeur("Dans ton écrin", String(t.possedees)) : ""))}
    ${carte(`${courbeCote(t.historique)}${aCoups(t.aCoups)}`, { classe: "pz-carte" })}
    ${t.refus ? note("alerteTri", esc(t.refus), "var(--alerte)") : !t.aLHorlogerie ? note("repere", `Va à l'${esc(t.horlogerie.toLowerCase())} de la ville pour la commander (Accueil, le plan).`) : ""}
    <button class="bouton teinte" style="--c:var(--vente)" data-action="commander" ${prete ? "" : "disabled"}>${titreBouton}</button>
    ${!t.serie ? `<button class="bouton secondaire" data-action="serie">Revenir à la série</button>` : ""}
  </div>`;
}

// MARK: - Une pièce de la vitrine (EcranPieceMontre)

function rendrePiece(d) {
  const t = d.t, s = t?.stock.find((x) => x.id === d.id);
  if (!s) return `${entetePousse("Vitrine")}${vide("Cette pièce n'est plus en vitrine.")}`;
  const prix = s.prixNegocie ?? s.prix;
  return `${entetePousse(s.boutique ? `Boutique ${s.marque}` : "Vitrine")}
  <div class="pz-pile">
    ${vitrineMontre(s.apparence, { hauteur: 250, prioritaire: true })}
    <div style="display:flex;flex-direction:column;gap:4px">
      <span class="surtitre-montre">${esc(s.marque)}</span>
      <h2 class="titre-montre">${esc(s.nom)}</h2>
      <p class="aide">${s.options.length ? esc(s.options.join(", ")) : "De série"} · ${esc(s.mecanisme)}</p>
      <div class="pz-prix"><span class="chiffres ${s.prixNegocie != null ? "gain" : ""}" style="font-size:34px">${montant(prix)}</span>${s.prixNegocie != null ? `<span class="barre">${montant(s.prix)}</span>` : ""}</div>
      <span style="font-size:13px;color:var(--texte2)">Revente estimée <b class="chiffres">${montant(s.revente)}</b> · à emporter tout de suite</span>
    </div>
    ${carte(`${label("mallette", "Discuter le prix")}
      <div style="font-size:14px;font-weight:500;color:${s.vendeurParti ? "var(--alerte)" : "var(--texte2)"}">${esc(s.negociation)}</div>
      ${s.peutOffrir ? pilule("Faire une offre", "offre", { plein: true, desactive: !t.aLHorlogerie }) : ""}
      ${!t.aLHorlogerie ? `<p class="aide">On discute sur place, à l'horlogerie.</p>` : ""}`, { classe: "pz-carte" })}
    <button class="bouton teinte" style="--c:var(--vente)" data-action="acheterStock" ${t.aLHorlogerie && !s.vendeurParti ? "" : "disabled"}>L'emporter, ${montant(prix)}</button>
    <button class="bouton secondaire" data-action="ouvrir" data-page="modeleMontre" data-p='${esc(JSON.stringify({ id: s.modele }))}'>Voir le modèle et le composer</button>
    <div>${boutonEpingler(null, { sorte: "montre", cible: s.modele, montant: prix, nom: `${s.marque} ${s.nom}` })}</div>
  </div>`;
}

// MARK: - Les annonces (EcranAnnoncesMontres)

const TRIS_ANNONCES = [{ id: "prix", nom: "Prix" }, { id: "affaire", nom: "Sous la cote" }, { id: "etat", nom: "État", croissant: false }, { id: "nom", nom: "Nom" }];
const listeAnnonces = (p) => etatDe(p, "annonces", () => nouvelleListe("prix"));

function corpsAnnonces(d, p) {
  const e = listeAnnonces(p), t = d.t;
  const prixDe = (a) => a.prixNegocie ?? a.prix;
  const base = t.annonces
    .filter((a) => contient(e, a.nom, a.palier))
    .filter((a) => !actif(e, "abordable") || prixDe(a) <= d.dispo)
    .filter((a) => !actif(e, "papiers") || a.boitePapiers)
    .filter((a) => !actif(e, "authentiques") || a.fausse === false);
  const l = trier(base, e, { prix: prixDe, etat: (a) => a.etat, affaire: (a) => prixDe(a) / Math.max(1, a.cote) }, (a) => a.nom);
  const filtres = [{ id: "abordable", nom: "À ta portée" }, { id: "papiers", nom: "Boîte et papiers" }, { id: "authentiques", nom: "Expertisées vraies" }];
  return `${pastillesListe("annonces", e, filtres)}${compteListe("annonces", e, l.length, "annonces")}
    ${!l.length ? `<p class="aide">${t.annonces.length ? "Aucune annonce ne correspond." : "Plus d'annonce cette semaine."}</p>` : ""}
    ${l.map((a) => `<div class="annonce-montre">
      <div class="rangee" style="gap:12px;align-items:flex-start">
        ${vitrineMontre(a.apparence, { hauteur: 96, largeur: 96 })}
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
          <div style="font-size:16px;font-weight:600">${esc(a.nom)}</div>
          <div class="sous-papier">${esc(a.palier)}, état ${pourcent(a.etat)}</div>
          <div class="sous-papier">${a.boitePapiers ? "Avec boîte et papiers" : "Sans boîte ni papiers"}</div>
          <div class="sous-papier">Vendue depuis ${esc(a.vendeur)}</div>
        </div>
        <div style="text-align:right">${a.prixNegocie != null ? `<div class="sous-papier" style="text-decoration:line-through">${montant(a.prix)}</div><div class="chiffres" style="font-size:17px;font-weight:700;color:#2E6B4F">${montant(a.prixNegocie)}</div>`
          : `<div class="chiffres" style="font-size:17px;font-weight:700">${montant(a.prix)}</div>`}<div class="sous-papier">cote ${montant(a.cote)}</div></div>
      </div>
      ${a.fausse != null ? `<div style="font-size:12px;font-weight:600;color:${a.fausse ? "#B3261E" : "#2E6B4F"}">${a.fausse ? "Expertisée : une contrefaçon" : "Expertisée : authentique"}</div>` : ""}
      <div class="rangee entre" style="gap:8px"><span class="sous-papier" style="color:${a.vendeurParti ? "#B3261E" : "#6B675F"}">${esc(a.negociation)}</span>${points(a.patience, a.patienceMax)}</div>
      <div class="rangee" style="gap:8px;flex-wrap:wrap">
        ${!a.expertisee ? `<button class="bouton-encre" data-action="expertiser" data-id="${esc(a.id)}" ${t.aLHorlogerie ? "" : "disabled"}>Expertiser, ${montant(t.expertise)}</button>` : ""}
        ${a.peutOffrir ? `<button class="bouton-encre" data-action="offreAnnonce" data-id="${esc(a.id)}">Faire une offre</button>` : ""}
        <button class="bouton-encre" data-action="acheterOccasion" data-id="${esc(a.id)}" ${a.vendeurParti ? "disabled" : ""}>Acheter</button>
      </div>
      ${!a.expertisee && !t.aLHorlogerie ? `<div class="sous-papier" style="font-size:11px">L'expertise se fait à l'horlogerie.</div>` : ""}
    </div>`).join("")}`;
}

// MARK: - Les enchères (EcranEncheresMontres)

function rendreEncheres(d) {
  const t = d.t;
  const m = Date.now() + (window.__grind?.etat?.decalage ?? 0);
  return `${entetePousse("Enchères de montres")}
  <div class="pz-pile">
    <p class="aide">Chaque dimanche après-midi, quelques pièces rares et mythiques, authentifiées par la maison. Donne ton plafond : la mise monte toute seule, le plus haut l'emporte au prix juste au-dessus du deuxième. Tes montres se mettent en vente depuis leur fiche.</p>
    ${!t?.ventes.length ? `<p class="aide">Aucune vente cette semaine.</p>` : carte(t.ventes.map((v) => {
      const temps = v.terminee ? (v.invendue ? "Invendue" : "Adjugée") : m < v.debut ? new Date(v.debut).toLocaleString("fr-BE", { weekday: "long", hour: "2-digit", minute: "2-digit" }) : "En cours";
      return `<button class="ligne vente-montre" data-action="vente" data-id="${esc(v.id)}">
        ${vitrineMontre(v.apparence, { hauteur: 58, largeur: 58 })}
        <span style="flex:1;min-width:0"><div class="titre">${esc(v.nom)}</div>
          <div class="detail">${v.aMoi ? "Ta montre" : `${esc(v.palier)}, état ${pourcent(v.etat)}`}</div>
          ${v.monPlafond != null ? `<div style="font-size:12px;font-weight:500;color:${v.meneur === "Toi" ? "var(--gain)" : "var(--perte)"}">Ton plafond : ${montant(v.monPlafond)}</div>` : ""}</span>
        <span style="text-align:right"><div class="chiffres" style="font-size:15px;font-weight:600">${montant(v.invendue && !v.terminee ? v.estimation : v.prix)}</div>
          <div style="font-size:12px;color:var(--texte2)">${esc(temps)}</div></span></button>`;
    }).join(""))}
  </div>`;
}

// MARK: - La fiche d'une montre (EcranMontre)

const texteRisque = (x) => pourcent(x ?? 0, 2);

function rendreMontre(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Montre")}${vide("Cette montre n'est plus dans ton écrin.")}`;
  const e = etatDe(p, "montre", { part: 1, enCours: false });
  const reserve = Math.max(10000, Math.round((t.valeur * e.part) / 10000) * 10000);
  const aReviser = t.etat < 0.99 || t.retardRevision > 0 || (t.prochaineRevision != null && t.prochaineRevision <= 7);
  const echeance = t.prochaineRevision == null ? "" : t.retardRevision > 0 ? `Révision en retard de ${t.retardRevision} jour${t.retardRevision > 1 ? "s" : ""} : sa valeur baisse un peu chaque semaine.`
    : t.prochaineRevision <= 0 ? "Révision à faire aujourd'hui." : `Prochaine révision dans ${t.prochaineRevision} jour${t.prochaineRevision > 1 ? "s" : ""}.`;
  return `${entetePousse(t.marque)}
  <div class="pz-pile">
    <div style="position:relative">${vitrineMontre(t.apparence, { hauteur: 240, prioritaire: true })}${pastilleRareteMontre(t.apparence.rarete)}</div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <h2 class="titre-montre">${esc(t.nom)}</h2>
      <div class="pz-prix"><span class="chiffres" style="font-size:34px;${t.fausseConnue ? "color:var(--alerte)" : ""}">${montant(t.valeur)}</span>${variationTexte(t.plusValue)}</div>
      <p class="aide">${esc(t.palier)}, ${esc(t.famille.toLowerCase())}, ${esc(t.origine.toLowerCase())}</p>
      ${t.options.length ? `<p class="aide">${esc(t.options.join(", "))}</p>` : ""}
    </div>
    ${carte(`<div class="rangee entre"><span class="libelle">Cote du modèle</span><span class="chiffres" style="font-size:15px;font-weight:600">${montant(t.cote)}</span></div>
      ${courbeCote(t.historique)}${aCoups(t.aCoups)}`, { classe: "pz-carte" })}
    ${carte(`<div class="rangee" style="gap:6px"><span class="pastille" style="--c:var(--controles);width:26px;height:26px;border-radius:8px"><span class="pz-ico" style="width:14px;height:14px">${ico.jauge}</span></span>
        <span class="libelle">État</span>${ligneEtat("", t.etat, pourcent(t.etat)).replace('class="pz-ligne-etat"', 'class="pz-ligne-etat" style="flex:1;font-size:13px"')}</div>
      ${t.fausseConnue ? note("alerteTri", "Une contrefaçon : elle ne vaut presque rien.", "var(--alerte)") : t.certifiee ? note("sceau", "Authentifiée", "var(--gain)") : ""}
      <p class="aide">${esc(t.mecanisme ? `${t.mecanisme}. ` : "")}${esc(echeance || t.entretien)}</p>
      ${t.sertiApres ? note("alerteTri", `Sertie après coup : elle se revend ${pourcent(t.decoteSertissage)} moins bien.`, "var(--alerte)") : ""}
      <div class="rangee" style="gap:8px;flex-wrap:wrap">
        ${aReviser ? pilule(`Réviser, ${montant(t.revision)}`, "reviser", { categorie: "var(--controles)", desactive: !t.aLHorlogerie }) : ""}
        ${t.peutExpertiser ? pilule(`Expertiser, ${montant(t.expertise)}`, "expertiserPiece", { desactive: !t.aLHorlogerie }) : ""}
      </div>
      ${!t.aLHorlogerie && (aReviser || t.peutExpertiser) ? `<p class="aide">La révision et l'expertise se font à l'${esc(t.horlogerie.toLowerCase())}.</p>` : ""}`, { classe: "pz-carte" })}
    ${t.sertissages.length ? carte(`${tete("etincelles", "var(--or)", "Faire sertir la lunette")}
      <p class="aide">Plus cher qu'à la commande, et une pièce sertie après coup perd ${pourcent(t.decoteSertissage)} à la revente.</p>
      <div class="rangee" style="gap:8px;flex-wrap:wrap">${t.sertissages.map((s) => pilule(`${esc(s.nom)}, ${montant(s.surcout)}`, "sertir", { donnees: { id: s.id }, desactive: !t.aLHorlogerie })).join("")}</div>`, { classe: "pz-carte" }) : ""}
    ${papier(`<div style="display:flex;flex-direction:column;gap:9px">
      <div class="rangee entre" style="align-items:flex-start">${titrePapier(t.fausseConnue ? "Rapport d'expertise" : "Certificat d'origine", `${t.marque} ${t.nom}`)}${etiquetteEncre(t.fausseConnue ? "Copie" : t.boitePapiers ? "Complète" : "Montre seule")}</div>
      ${champPapier("Boîte et papiers", t.boitePapiers ? "Oui" : "Non")}
      ${champPapier("Achetée", montant(t.prixAchat))}
      ${champPapier("Prix neuf", montant(t.prixNeuf))}
      ${champPapier("Rachat par l'horloger", montant(t.reprise))}
      ${champPapier("Valeur", montant(t.valeur), true)}</div>`)}
    <div style="height:2px"></div>
    ${carte(`${tete("main", "var(--image)", t.portee ? "Au poignet" : "Dans l'écrin")}
      <p class="aide">${t.portee ? `Chaque jour : +${virgule(t.plaisirJour, 2)} de plaisir, un peu d'usure, et ${texteRisque(t.risqueVol)} de risque de vol ici.`
        : `Elle dort : ni usure ni vol. Au poignet : +${virgule(t.plaisirJour, 2)} de plaisir par jour, ${texteRisque(t.risqueVol)} de risque de vol ici.`}</p>
      ${t.credibilite > 0 ? `<p class="aide">Crédibilité : ${pourcent(t.credibilite, 1)} de remise en plus quand tu négocies, et la banque privée t'ouvre plus tôt.</p>` : ""}
      ${pilule(t.portee ? "La ranger dans l'écrin" : "La porter", "porter", { plein: !t.portee, desactive: t.enVente != null })}`, { classe: "pz-carte" })}
    ${carte(`${tete("bouclier", "var(--argent)", "Assurance", `<span class="aide">${montant(t.primeSemaine, { centimes: true })}/sem.</span>`)}
      ${t.assurances.map((a) => choixRadio(t.assurance === a.id, `${esc(a.nom)} <span class="aide" style="float:right">${montant(a.primeSemaine, { centimes: true })}</span>`, esc(a.detail), "assurer", { niveau: a.id })).join("")}`, { classe: "pz-carte" })}
    ${!t.fausseConnue ? carte(`${label("marteau", "Aux enchères")}
      ${t.enVente != null ? `<p class="aide">En vente pour vingt-quatre heures, réserve ${montant(t.enVente)}. Le résultat arrive dans tes événements.</p>` : `
      <p class="aide">Vingt-quatre heures de vente, à des collectionneurs. En dessous de ta réserve, elle te revient. La maison prend ${pourcent(t.fraisEncheres)} du prix.</p>
      <div class="pz-defile">${[0.8, 1, 1.2].map((k) => filtre(k === 1 ? "Valeur" : pctSigne(k - 1), e.part === k, "partReserve", { k })).join("")}</div>
      <div style="font-size:15px;font-weight:600">Réserve : ${montant(reserve)}</div>
      ${pilule(e.enCours ? "Mise en vente…" : "Mettre aux enchères", "mettreAuxEncheres", { plein: true, donnees: { reserve }, desactive: e.enCours })}`}`, { classe: "pz-carte" }) : ""}
    <button class="bouton secondaire" data-action="vendre" ${t.enVente != null ? "disabled" : ""}>${t.fausseConnue ? "S'en défaire" : `Vendre à l'horloger, ${montant(t.reprise)}`}</button>
  </div>`;
}

// MARK: - Les pages

export const pages = {
  horlogerie: {
    titre: "Horlogerie",
    async donnees(ctx) {
      const [t, dispo] = await Promise.all([tableauGarde(ctx, "montres"), argentDisponible(ctx), chargerPhotos()]);
      return { t, dispo };
    },
    rendu: rendreHorlogerie,
    actions: {
      ...actionsListe("horlogerie", listeHorlogerie, TRIS_HORLOGERIE, (ctx, d, p) => repeindre("horlogerie", corpsCatalogue(d, p))),
      async ongletHorlogerie(ctx, b, d, p) { ongletHorlogerie(p).choix = b.dataset.valeur; await ctx.rafraichir(); },
      horlogerieMarque(ctx, el, d, p) { const e = listeHorlogerie(p); e.marque = el.value; e.montres = 40; repeindre("horlogerie", corpsCatalogue(d, p)); },
    },
  },

  maisonMontres: {
    titre: "Maison",
    async donnees(ctx, p) { return { t: await ctx.tableau("maisonMontres", { id: p.id }) }; },
    rendu: rendreMaison,
    actions: {},
  },

  modeleMontre: {
    titre: "Montre",
    async donnees(ctx, p) {
      const e = etatConfig(p);
      const t = await ctx.tableau("modeleMontre", e.config ? { id: p.id, config: e.config } : { id: p.id });
      if (t?.config && !e.config) e.config = t.config;
      return { t, ville: t?.ville ?? "" };
    },
    rendu: rendreModele,
    actions: {
      async option(ctx, b, d, p) {
        const e = etatConfig(p);
        e.config = { ...(e.config ?? d.t.config), [b.dataset.rangee]: b.dataset.id };
        await ctx.rafraichir();
      },
      async serie(ctx, b, d, p) { etatConfig(p).config = null; await ctx.rafraichir(); },
      inscrire: (ctx, b, d, p) => ctx.decider("montres", { inscrireAttente: { modele: p.id } }, { succes: "Inscrit sur la liste d'attente" }),
      async commander(ctx, b, d, p) {
        const e = etatConfig(p);
        if (e.enCours) return;
        e.enCours = true;
        const immediat = !d.t.arriveeMin;
        const config = d.t.config ?? { cadran: "serie", boitier: "serie", bracelet: "serie", mecanisme: "serie" };
        await ctx.decider("montres", { commander: { modele: p.id, config } },
          { succes: immediat ? `${d.t.marque} ${d.t.nom} : dans ton écrin` : `Commandée : livrée en ${d.t.delai.toLowerCase()}` });
        e.enCours = false;
        await ctx.rafraichir();
      },
    },
  },

  pieceMontre: {
    titre: "Vitrine",
    async donnees(ctx, p) { return { t: await tableauGarde(ctx, "montres"), id: p.id }; },
    rendu: rendrePiece,
    actions: {
      offre(ctx, b, d, p) {
        const s = d.t.stock.find((x) => x.id === p.id);
        if (!s) return;
        pave(ctx, { titre: "Ton offre", aide: `Prix affiché : ${montant(s.prixNegocie ?? s.prix)}. L'horloger fait une contre-proposition, une seule`,
          proposition: Math.trunc(((s.prixNegocie ?? s.prix) * 0.92) / 1000) * 1000,
          valider: (v) => ctx.decider("montres", { offrir: { cle: s.id, offre: v } }) });
      },
      async acheterStock(ctx, b, d, p) {
        const s = d.t.stock.find((x) => x.id === p.id);
        if (await ctx.decider("montres", { acheterStock: { piece: p.id } }, { succes: `${s?.marque ?? ""} ${s?.nom ?? ""} : dans ton écrin` })) await ctx.retour();
      },
    },
  },

  annoncesMontres: {
    titre: "Annonces",
    async donnees(ctx) {
      const [t, dispo] = await Promise.all([tableauGarde(ctx, "montres"), argentDisponible(ctx), chargerPhotos()]);
      return { t, dispo };
    },
    rendu(d, ctx, p) {
      if (!d.t) return `${entetePousse("Annonces")}${vide("Les annonces arrivent avec ta première saison.")}`;
      return `${entetePousse("Annonces")}
      <div class="pz-pile" style="gap:14px">
        <p class="aide">Entre particuliers, renouvelées chaque semaine : moins cher que la cote, mais il circule des copies. Une expertise à l'horlogerie (${montant(d.t.expertise)}) le dit avant d'acheter. Le vendeur se discute, mais sa patience a des limites.</p>
        ${teteListe({ id: "annonces", etat: listeAnnonces(p), invite: "Marque ou modèle", tris: TRIS_ANNONCES })}
        <div id="annonces-corps" class="pz-pile" style="gap:14px">${corpsAnnonces(d, p)}</div>
      </div>`;
    },
    actions: {
      ...actionsListe("annonces", listeAnnonces, TRIS_ANNONCES, (ctx, d, p) => repeindre("annonces", corpsAnnonces(d, p))),
      expertiser: (ctx, b) => ctx.decider("montres", { expertiser: { annonce: b.dataset.id } }, { succes: "Expertise faite" }),
      offreAnnonce(ctx, b, d) {
        const a = d.t.annonces.find((x) => x.id === b.dataset.id);
        if (!a) return;
        pave(ctx, { titre: "Ton offre", aide: `Prix demandé : ${montant(a.prixNegocie ?? a.prix)}. Une offre trop basse l'agace`,
          proposition: Math.trunc(((a.prixNegocie ?? a.prix) * 0.88) / 1000) * 1000,
          valider: (v) => ctx.decider("montres", { offrir: { cle: a.id, offre: v } }) });
      },
      acheterOccasion(ctx, b, d) {
        const a = d.t.annonces.find((x) => x.id === b.dataset.id);
        if (!a) return;
        const prix = a.prixNegocie ?? a.prix;
        const boutons = [{ texte: `Payer ${montant(prix)}`, faire: () => ctx.decider("montres", { acheterOccasion: { annonce: a.id, liquide: false } }, { succes: `${a.nom} : dans ton écrin` }) }];
        if (d.t.argentSale >= prix) boutons.push({ texte: "En liquide, sans trace", genre: "secondaire", faire: () => ctx.decider("montres", { acheterOccasion: { annonce: a.id, liquide: true } }, { succes: `${a.nom} : dans ton écrin` }) });
        confirmer(ctx, {
          titre: "Acheter cette montre ?",
          message: a.expertisee ? (a.fausse ? "L'expert l'a dit : c'est une copie. Elle ne vaut presque rien." : "Expertisée : authentique.")
            : `Pas expertisée : une contrefaçon reste possible. L'horlogerie l'expertise pour ${montant(d.t.expertise)}.`,
          boutons,
        });
      },
    },
  },

  encheresMontres: {
    titre: "Enchères de montres",
    async donnees(ctx) { return { t: await tableauGarde(ctx, "montres") }; },
    rendu: rendreEncheres,
    actions: {
      vente(ctx, b, d) {
        const v = d.t?.ventes.find((x) => x.id === b.dataset.id);
        if (!v) return;
        const m = Date.now() + (window.__grind?.etat?.decalage ?? 0);
        if (v.aMoi) return ctx.toast("Ta montre est en vente jusqu'à la fin : si elle dépasse ta réserve, elle part au meilleur enchérisseur.", "info");
        if (v.terminee) return ctx.toast(v.invendue ? "Invendue." : `Adjugée ${montant(v.prix)}.`, "info");
        if (m < v.debut) return ctx.toast("La vente n'a pas encore ouvert : reviens dimanche après-midi.", "info");
        pave(ctx, {
          titre: `Ton plafond pour ${v.nom}`,
          aide: `Le maximum que tu es prêt à payer (au moins ${montant(v.plafondMinimum)}). Il faut l'avoir sur une de tes cartes ou en liquide ; tu ne paies que si tu gagnes`,
          proposition: v.plafondMinimum,
          valider: (x) => ctx.commande("encheres.miser", { vente: v.id, plafond: x }, { succes: "C'est noté. Tu seras prévenu à la fin de la vente." }),
        });
      },
    },
  },

  montre: {
    titre: "Montre",
    async donnees(ctx, p) { return { t: await ctx.tableau("montre", { id: p.id }) }; },
    rendu: rendreMontre,
    actions: {
      porter: (ctx, b, d, p) => ctx.decider("montres", { porter: d.t.portee ? {} : { montre: p.id } }, { succes: d.t.portee ? "Rangée dans l'écrin" : "Au poignet" }),
      reviser: (ctx, b, d, p) => ctx.decider("montres", { reviser: { montre: p.id } }, { succes: "Révisée : comme neuve" }),
      expertiserPiece: (ctx, b, d, p) => ctx.decider("montres", { expertiserPiece: { montre: p.id } }, { succes: "Expertise faite" }),
      sertir(ctx, b, d, p) {
        const s = d.t.sertissages.find((x) => x.id === b.dataset.id);
        if (!s) return;
        confirmer(ctx, {
          titre: "Faire sertir la lunette ?",
          message: `${s.nom}, ${montant(s.surcout)}. Une pièce sertie après coup se revend ${pourcent(d.t.decoteSertissage)} moins bien.`,
          boutons: [{ texte: `Sertir, ${montant(s.surcout)}`, faire: () => ctx.decider("montres", { sertir: { montre: p.id, lunette: s.id } }, { succes: "Sertie" }) }],
        });
      },
      assurer: (ctx, b, d, p) => ctx.decider("assurances", { regler: { _0: "montres", element: String(p.id), niveau: Number(b.dataset.niveau) } }),
      async partReserve(ctx, b, d, p) { etatDe(p, "montre", {}).part = Number(b.dataset.k); await ctx.rafraichir(); },
      async mettreAuxEncheres(ctx, b, d, p) {
        const e = etatDe(p, "montre", {});
        e.enCours = true;
        await ctx.decider("montres", { mettreAuxEncheres: { montre: p.id, reserve: Number(b.dataset.reserve) } }, { succes: "En vente pour 24 h" });
        e.enCours = false;
        await ctx.rafraichir();
      },
      vendre(ctx, b, d, p) {
        const t = d.t;
        if (t.fausseConnue) {
          confirmer(ctx, {
            titre: "Une contrefaçon",
            message: `L'horloger n'en veut pas. Un particulier la paierait comme une vraie, mais il peut la faire expertiser (${pourcent(t.risqueFaux ?? 0)} de risque) : tu le rembourses, amende et casier.`,
            boutons: t.gainFaux != null ? [{ texte: `La vendre comme vraie : ${montant(t.gainFaux)} en liquide`, genre: "danger",
              faire: async () => { if (await ctx.decider("illegal", { vendreMontreCommeVraie: { montre: p.id } }, { succes: "Vendue comme vraie. Pourvu qu'il ne la fasse pas expertiser…" })) await ctx.retour(); } }] : [],
          });
          return;
        }
        confirmer(ctx, {
          titre: "Vendre cette montre ?",
          message: "L'horloger la rachète à sa valeur, moins sa marge. Aux enchères, elle peut partir plus cher.",
          boutons: [{ texte: `Vendre pour ${montant(t.reprise)}`, faire: async () => { if (await ctx.decider("montres", { vendre: { montre: p.id } }, { succes: "Vendue" })) await ctx.retour(); } }],
        });
      },
    },
  },
};

// Lot D : les photos, et au grand écran l'horlogerie garde sa vitrine ou son catalogue à gauche, la fiche à droite.
for (const id of ["maisonMontres", "modeleMontre", "pieceMontre", "montre"]) {
  const def = pages[id];
  pages[id] = { ...def, async donnees(ctx, p) { await chargerPhotos(); return def.donnees(ctx, p); } };
}
pages.horlogerie = listeEtDetail("horlogerie", pages.horlogerie,
  { modeleMontre: pages.modeleMontre, pieceMontre: pages.pieceMontre, maisonMontres: pages.maisonMontres }, {
    vide: () => videDetail("Choisis une montre", "Sa fiche, ses options et la commande s'ouvrent ici, sans quitter l'horlogerie."),
  });
const sectionDonneesMontres = section.donnees;
section.donnees = async (ctx) => { await chargerPhotos(); return sectionDonneesMontres(ctx); };
