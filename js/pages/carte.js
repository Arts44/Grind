// ══════════════════════════════════════════════════════════════════════
//  Carte — une seule carte, du monde aux bâtiments (RNT-185, D203).
//
//  Une vraie carte à tuiles OpenStreetMap, dessinée par Leaflet (copié
//  dans web/vendor/leaflet, avec sa licence : aucun CDN). Dézoomé, les
//  villes du jeu ; zoomé, les rues, avec les lieux du jeu posés dessus :
//  tes lieux, les lieux utiles, les autres joueurs, les biens à vendre.
//  Chaque calque s'allume ou s'éteint, et le choix est retenu (le même
//  réglage que dans Réglages).
//
//  En route, l'icône avance sur sa ligne (un grand cercle en avion), la
//  carte la suit, et une barre donne l'heure d'arrivée.
//
//  Sous les tuiles, les terres (Natural Earth, domaine public) restent
//  dessinées : sans réseau, la carte garde sa forme.
//
//  Le reste de la page se redessine en HTML à chaque rafraîchissement :
//  la carte, elle, est créée une fois et replacée dans son emplacement
//  (`#carte-slot`) après chaque dessin, pour ne jamais perdre le zoom.
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "../format.js";
import * as Z from "../cosmetiques.js"; // RNT-231 : les marqueurs et les traînées équipés

// MARK: Les calques, retenus (les mêmes que dans Réglages)

const CLE_CALQUES = "grind.carte.calques";
export const CALQUES_DEFAUT = [
  { id: "miens", nom: "Mes lieux", detail: "Domicile, biens, boîtes, véhicules garés", icone: "house.fill" },
  { id: "utiles", nom: "Lieux utiles", detail: "Banque, agences, horlogerie, restaurants, aéroport", icone: "building.columns.fill" },
  { id: "joueurs", nom: "Joueurs", detail: "Les autres joueurs et les bots, selon leur réglage", icone: "person.2.fill" },
  { id: "aVendre", nom: "À vendre", detail: "Les biens du marché, à leur adresse", icone: "tag.fill" },
];

export function calquesActifs() {
  let x = null;
  try { x = JSON.parse(localStorage.getItem(CLE_CALQUES) ?? "null"); } catch {}
  return Object.fromEntries(CALQUES_DEFAUT.map((c) => [c.id, x?.[c.id] ?? true]));
}
export function basculerCalque(id) {
  const a = calquesActifs();
  a[id] = !a[id];
  try { localStorage.setItem(CLE_CALQUES, JSON.stringify(a)); } catch {}
  return a;
}

// MARK: Leaflet, chargé à la première carte

let chargement = null;
function chargerLeaflet() {
  if (window.L?.map) return Promise.resolve(window.L);
  return (chargement ??= new Promise((ok, ko) => {
    const base = new URL("../../vendor/leaflet/", import.meta.url);
    if (!document.querySelector("link[data-leaflet]")) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = new URL("leaflet.css", base).href;
      l.dataset.leaflet = "";
      document.head.append(l);
    }
    const s = document.createElement("script");
    s.src = new URL("leaflet.js", base).href;
    s.onload = () => ok(window.L);
    s.onerror = () => { chargement = null; ko(new Error("La carte n'a pas pu se charger.")); };
    document.head.append(s);
  }));
}

// MARK: L'état de la carte (créée une fois)

const C = {
  map: null, el: null, couches: null, toi: null, trace: null, cle: null,
  suivre: true, plein: false, zoomRues: false, d: null, sf: null, terres: "",
  // RNT-224 : la ville visée quand on n'y est pas (son id, ses lieux lus au moteur), et ses repères.
  ctx: null, visee: null, distante: null, marquesDistantes: [],
};
/** RNT-224 : le rayon où l'on cherche la ville à montrer zoomée (TableauMonde.rayonVilleViseeKm). */
const RAYON_VILLE_VISEE_KM = 30;
/** En dessous de ce zoom, les villes ; au-dessus, les rues et les lieux. */
const ZOOM_RUES = 10;
const OR = "#e3c46b";
const COULEUR_PALIER = { 4: "#B98BFF", 3: "#E3B85B", 2: "#5BBF8A", 1: "#8FA3B8" };
const TAILLE_PALIER = [6, 8, 10, 13];
const NOMS_PALIERS = ["Abordable", "Régionale", "Métropole", "Ville-monde"]; // ReglesEntreprises.nomsPaliersVille

const heure = (ms) => new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
const progression = (r, now) => (r.arrivee > r.depart ? Math.min(1, Math.max(0, (now - r.depart) / (r.arrivee - r.depart))) : 1);
function compteARebours(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}
const hexa = (n) => `#${(Number(n) >>> 0 & 0xffffff).toString(16).padStart(6, "0")}`;
/** « 245 k€ », « 1,2 M€ » : le prix d'une étiquette. */
function prixCourt(c) {
  const e = (c ?? 0) / 100;
  if (e >= 1e6) return `${(e / 1e6).toLocaleString("fr-BE", { maximumFractionDigits: 1 })} M€`;
  if (e >= 1e3) return `${Math.round(e / 1e3).toLocaleString("fr-BE")} k€`;
  return `${Math.round(e)} €`;
}

/** Le trajet en cours : le voyage entre villes, sinon le trajet en ville. */
const trajet = (t) => t?.enRoute ?? t?.enRouteLocal ?? null;

/** Le tracé, sans saut à l'antiméridien (Tokyo → Los Angeles reste d'un seul tenant). */
function deplier(points) {
  const out = [];
  for (const [lat, lon0] of points) {
    let lon = lon0;
    const p = out[out.length - 1];
    if (p) { while (lon - p[1] > 180) lon -= 360; while (lon - p[1] < -180) lon += 360; }
    out.push([lat, lon]);
  }
  return out;
}

/** Où en est-on sur le tracé (part de 0 à 1), et le cap (degrés, 0 = nord). */
function surTrace(points, f) {
  if (!points.length) return null;
  if (points.length === 1) return { p: points[0], cap: 0 };
  const x = Math.min(points.length - 1.000001, Math.max(0, f * (points.length - 1)));
  const i = Math.floor(x), k = x - i;
  const a = points[i], b = points[i + 1];
  const p = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const dy = b[0] - a[0], dx = (b[1] - a[1]) * Math.cos((a[0] * Math.PI) / 180);
  return { p, cap: (Math.atan2(dx, dy) * 180) / Math.PI };
}

function traceDe(t) {
  const r = trajet(t);
  if (!r) return [];
  if (r.trace?.length) return deplier(r.trace);
  if (r.deLat != null) return deplier([[r.deLat, r.deLon], [r.versLat, r.versLon]]);
  return [];
}

// MARK: Le HTML de l'emplacement (redessiné avec la page)

/** L'emplacement de la carte et ce qui flotte dessus : calques, boutons, barre du trajet. */
export function carteHTML(t, now, sf) {
  const a = calquesActifs();
  const calques = (t.calques?.length ? t.calques : CALQUES_DEFAUT);
  const r = trajet(t);
  const puces = calques.map((c) => `<button class="carte-puce" data-action="calque" data-id="${esc(c.id)}" aria-pressed="${!!a[c.id]}" title="${esc(c.detail)}">
      <span>${sf(c.icone, 14)}</span>${esc(c.id === "utiles" ? "Utiles" : c.nom)}</button>`).join("");
  return `<div id="carte-slot" class="carte-slot ${C.plein ? "plein" : ""} ${r ? "trajet" : ""}" data-zoom="${C.zoomRues ? "rues" : "villes"}" role="region" aria-label="Carte">
    <div class="carte-puces" role="group" aria-label="Calques de la carte">${puces}</div>
    ${bandeauHTML()}
    <div class="carte-boutons">
      <button class="carte-rond" data-action="pleinEcranCarte" aria-label="${C.plein ? "Fermer la carte" : "Carte en plein écran"}">${C.plein ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' : sf("agrandir", 16)}</button>
      <button class="carte-rond" data-action="zoomCarte" data-pas="1" aria-label="Zoomer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>
      <button class="carte-rond" data-action="zoomCarte" data-pas="-1" aria-label="Dézoomer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg></button>
      <button class="carte-rond" data-action="recentrerCarte" aria-label="Me retrouver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.5 18L12 17l-7.5 4z"/></svg></button>
    </div>
    ${r ? barreTrajet(t, r, now, sf) : legendePaliers()}
  </div>`;
}

/** RNT-224 : zoomée sur une ville où l'on n'est pas, le bandeau le dit (BandeauVilleDistante de l'iPhone). */
function bandeauHTML() {
  const a = C.distante;
  return `<div class="carte-bandeau" id="carte-bandeau" role="status" ${a ? "" : "hidden"}>${a ? `<span class="carte-bandeau-icone">${C.sf?.(a.enVoyage ? "airplane" : "location.slash.fill", 12) ?? ""}</span><b>${esc(a.bandeau ?? a.villeNom)}</b><span>Lieux en lecture</span>` : ""}</div>`;
}

/** LegendePaliers : les quatre paliers des villes, leur couleur et la taille de leur point. */
const legendePaliers = () => `<div class="carte-legende" aria-label="Paliers des villes">${NOMS_PALIERS.map((n, i) =>
  `<span><i style="--c:${COULEUR_PALIER[i + 1]};--t:${TAILLE_PALIER[i]}px"></i>${n}</span>`).join("")}</div>`;

/** La barre du trajet : où l'on va, l'heure d'arrivée, ce qui reste, l'avancement. */
function barreTrajet(t, r, now, sf) {
  const attente = now < r.depart;
  const local = !t.enRoute;
  return `<div class="carte-barre" id="carte-barre">
    <span class="carte-barre-icone">${sf(r.icone, 18)}</span>
    <span class="carte-barre-texte">
      <span class="carte-barre-titre">${esc(local ? r.vers : `${r.de} → ${r.vers}`)}</span>
      <span class="carte-barre-detail" id="carte-barre-detail">${attente ? `${esc(r.moyen)}, départ à ${heure(r.depart)}` : `${esc(r.moyen)}, arrivée à ${heure(r.arrivee)}`}</span>
      <span class="carte-barre-rail"><i id="carte-barre-rail" style="width:${Math.round(progression(r, now) * 100)}%"></i></span>
    </span>
    <span class="carte-barre-reste chiffres" id="carte-barre-reste">${compteARebours((attente ? r.depart : r.arrivee) - now)}</span>
  </div>`;
}

// MARK: Monter la carte dans son emplacement (après chaque dessin de la page)

export async function monterCarte(ctx, d, { sf, terres }) {
  const slot = document.getElementById("carte-slot");
  if (!slot || !d?.t) return;
  C.d = d; C.sf = sf; C.terres = terres; C.ctx = ctx;
  let L;
  try { L = await chargerLeaflet(); } catch (e) {
    if (!slot.querySelector(".carte-erreur")) slot.insertAdjacentHTML("afterbegin", `<div class="carte-erreur">${esc(e.message)}</div>`);
    return;
  }
  if (!document.getElementById("carte-slot")) return; // la page a changé pendant le chargement
  if (!C.map) creer(L);
  const s = document.getElementById("carte-slot");
  if (C.el.parentElement !== s) s.prepend(C.el);
  C.map.invalidateSize({ animate: false });
  dessiner(L, d.t, ctx.maintenant());
}

function creer(L) {
  C.el = document.createElement("div");
  C.el.className = "carte-leaflet";
  C.el.dataset.garder = ""; // lot A : patcher ne touche jamais la carte vivante
  // Créée hors de la page : Leaflet lirait une position vide et la forcerait en « relative ».
  C.el.style.position = "absolute";
  C.el.style.inset = "0";
  const map = L.map(C.el, { zoomControl: false, attributionControl: true, worldCopyJump: true, minZoom: 2, maxZoom: 18,
                            zoomSnap: 0.5, zoomDelta: 1, wheelPxPerZoomLevel: 90, fadeAnimation: true });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  map.createPane("terres").style.zIndex = 150;
  // Les terres, sous les tuiles : la carte garde sa forme sans réseau.
  const anneaux = C.terres.split("|").map((r) => r.split(" ").map((q) => { const [lon, lat] = q.split(",").map(Number); return [lat, lon]; }));
  L.polygon(anneaux, { pane: "terres", stroke: true, color: "#2a2e36", weight: 0.6, fillColor: "#1b1e24", fillOpacity: 1, interactive: false, smoothFactor: 1.5 }).addTo(map);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, className: "tuiles-osm", crossOrigin: false,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  C.couches = {
    villes: L.layerGroup().addTo(map), trace: L.layerGroup().addTo(map),
    miens: L.layerGroup(), utiles: L.layerGroup(), joueurs: L.layerGroup(), aVendre: L.layerGroup(), toi: L.layerGroup().addTo(map),
  };
  // Une touche arrivée pendant l'animation est rattrapée à la fin de celle-ci.
  map.on("zoomend", () => {
    if (C.cible != null && C.cible !== map.getZoom()) setTimeout(() => C.cible != null && map.setZoom(C.cible), 0);
    else C.cible = null;
    visibilite(L);
  });
  // RNT-224 : la carte posée (après un glissé ou un zoom), on regarde quelle ville elle vise.
  map.on("moveend", () => viser(L));
  // Le joueur déplace la carte : elle cesse de suivre le trajet (le bouton « Me retrouver » la remet).
  map.on("dragstart", () => { C.suivre = false; });
  C.map = map;
  map.setView([30, 10], 2);
}

/** Les calques allumés, et les villes ou les rues selon le zoom. */
function visibilite() {
  const a = calquesActifs();
  const rues = C.map.getZoom() >= ZOOM_RUES;
  C.zoomRues = rues;
  document.getElementById("carte-slot")?.setAttribute("data-zoom", rues ? "rues" : "villes");
  const montrer = (couche, oui) => (oui ? (C.map.hasLayer(couche) || couche.addTo(C.map)) : C.map.removeLayer(couche));
  montrer(C.couches.villes, !rues);
  for (const id of ["miens", "utiles", "aVendre"]) montrer(C.couches[id], rues && a[id]);
  // Les joueurs se voient de loin aussi (à leur ville), si le calque est allumé.
  montrer(C.couches.joueurs, a.joueurs);
  C.el?.classList.toggle("noms-visibles", C.map.getZoom() >= 15);
  eviterPion();
}

/**
 * RNT-224 : la ville que montre la carte zoomée : celle dont le centre est le plus proche du centre
 * de la carte, à 30 km au plus (TableauMonde.villeVisee, même calcul, même distance).
 */
export function villeVisee(lieux, lat, lon, rayonKm = RAYON_VILLE_VISEE_KM) {
  const rad = Math.PI / 180;
  let meilleure = null, min = Infinity;
  for (const l of lieux ?? []) {
    const dLat = (l.lat - lat) * rad, dLon = (l.lon - lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat * rad) * Math.cos(l.lat * rad) * Math.sin(dLon / 2) ** 2;
    const km = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
    if (km <= rayonKm && km < min) { min = km; meilleure = l.id; }
  }
  return meilleure;
}

/** RNT-224 : la carte posée, quelle ville vise-t-elle ? Ses lieux ne se relisent qu'au changement de ville. */
async function viser(L) {
  if (!C.map || !C.d?.t) return;
  const t = C.d.t;
  const c = C.map.getCenter();
  const v = C.map.getZoom() >= ZOOM_RUES ? villeVisee(t.lieux, c.lat, c.lng) : null;
  const id = v && v !== t.ici?.id ? v : null;
  if (id === C.visee) return;
  C.visee = id;
  const a = id ? await C.ctx?.tableau("endroitsVille", { id }) : null;
  if (C.visee !== id) return; // la carte a visé ailleurs pendant la lecture
  C.distante = a ?? null;
  poserDistants(L);
  const b = document.getElementById("carte-bandeau");
  if (b) b.outerHTML = bandeauHTML();
}

/** RNT-224 : les lieux de la ville visée, atténués, chacun dans son calque ; touchés, leur fiche en lecture. */
function poserDistants(L) {
  for (const m of C.marquesDistantes) m.remove();
  C.marquesDistantes = [];
  const a = C.distante;
  if (!a || !C.couches) return;
  const sf = C.sf;
  const k = C.couches;
  const poser = (lat, lon, html, groupe, z) => {
    const m = L.marker([lat, lon], { icon: icone(L, html), keyboard: false, riseOnHover: true, zIndexOffset: z }).addTo(groupe);
    C.marquesDistantes.push(m);
  };
  for (const e of a.endroits ?? []) {
    if (e.id.startsWith("j:")) continue; // les boîtes des autres : plus bas, à leur couleur
    const calque = e.calque ?? "utiles";
    const html = `<button class="mk-lieu distant ${calque}" data-action="lieuDistant" data-id="${esc(e.id)}" aria-label="${esc(e.nom)}, ${esc(a.villeNom)} : tu n'y es pas" title="${esc(e.nom)} : ${esc(e.type)}">
      <span class="disque">${sf(e.icone, 14)}</span>${e.vehicules?.length ? `<span class="garee">${sf("car.fill", 10)}</span>` : ""}<span class="nom">${esc(e.nom)}</span></button>`;
    poser(e.lat, e.lon, html, k[calque === "joueurs" ? "joueurs" : calque] ?? k.utiles, 150);
  }
  for (const b of a.boitesJoueurs ?? []) {
    const hex = String(b.couleur ?? "").replace("#", "");
    const fond = /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : "#5B6170";
    const html = `<button class="mk-boite distant" data-action="lieuDistant" data-id="${esc(b.lieu ?? "")}" style="--c:${fond}" aria-label="${esc(b.nom)}, boîte de ${esc(b.pseudo || "un joueur")}, à ${esc(a.villeNom)}" title="${esc(b.nom)}, boîte de ${esc(b.pseudo || "un joueur")}">
      ${sf("storefront", 13)}<span class="nom">${esc(b.nom)}</span></button>`;
    poser(b.lat, b.lon, html, k.joueurs, 140);
  }
}

/** RNT-224 : la ville zoomée où l'on n'est pas, et ses lieux (pour la fiche d'un lieu). */
export const villeDistante = () => C.distante;

/**
 * RNT-210 : au téléphone, la pièce de Grind tombait sur les étiquettes de prix des biens à vendre
 * autour de toi (« 42 k€ » caché sous le « G »). Une étiquette qui touche le pion, ou une étiquette
 * déjà posée, descend d'un cran (jusqu'à six) ; refait à chaque dessin et à chaque zoom.
 */
function eviterPion() {
  if (!C.el) return;
  const prix = [...C.el.querySelectorAll(".mk-prix")];
  for (const p of prix) p.style.removeProperty("--dy");
  const pion = C.el.querySelector(".mk-piece:not(.ville)");
  if (!pion || !prix.length) return;
  const marge = 3;
  const boite = (r, dy = 0) => ({ g: r.left - marge, d: r.right + marge, h: r.top + dy - marge, b: r.bottom + dy + marge });
  const croise = (a, b) => a.g < b.d && b.g < a.d && a.h < b.b && b.h < a.b;
  const occupes = [boite(pion.getBoundingClientRect())];
  const rects = prix.map((p) => [p, p.getBoundingClientRect()]).sort((a, b) => a[1].top - b[1].top);
  for (const [p, r] of rects) {
    let dy = 0;
    for (let k = 0; k < 6 && occupes.some((o) => croise(boite(r, dy), o)); k++) dy += r.height + marge;
    if (dy) p.style.setProperty("--dy", `${dy}px`);
    occupes.push(boite(r, dy));
  }
}

function icone(L, html, taille = [0, 0]) {
  return L.divIcon({ className: "carte-marque", html, iconSize: taille });
}

function dessiner(L, t, now) {
  const sf = C.sf;
  const k = C.couches;
  Object.values(k).forEach((g) => g.clearLayers());

  // Les villes (dézoomé) : la taille et la couleur de leur palier, les tiennes en accent.
  const vers = t.enRoute?.versID;
  for (const l of [...t.lieux].sort((a, b) => (a.palier - b.palier))) {
    const mien = l.possessions > 0 || l.residence;
    if (l.ici) continue;
    const taille = TAILLE_PALIER[Math.min(3, Math.max(0, (l.palier ?? 1) - 1))] + (mien ? 3 : 0);
    const nomme = mien || l.id === vers;
    const html = `<button class="mk-ville ${mien ? "mien" : ""} ${nomme ? "nommee" : ""}" data-action="voyage" data-id="${esc(l.id)}" style="--c:${mien ? "var(--accent)" : COULEUR_PALIER[l.palier] ?? COULEUR_PALIER[1]};--t:${taille}px" aria-label="${esc(l.nom)}, ${esc(l.pays)}">
      <i></i>${l.boitesJoueurs > 0 ? `<b class="mk-boites" aria-hidden="true">${sf("storefront.fill", 7)}</b>` : ""}<span>${esc(l.nom)}</span></button>`;
    L.marker([l.lat, l.lon], { icon: icone(L, html), keyboard: false, riseOnHover: true, zIndexOffset: mien ? 200 : l.palier * 10 }).addTo(k.villes);
  }

  // Les endroits de la ville (zoomé), chacun dans son calque.
  for (const e of t.endroits ?? []) {
    if (e.id.startsWith("j:")) continue; // les boîtes des autres : calque Joueurs, à leur couleur
    const calque = e.calque ?? "utiles";
    const ici = e.ici && !t.enRouteLocal;
    const vehicules = e.vehicules?.length ? ` ; garé ici : ${e.vehicules.join(", ")}` : "";
    const html = `<button class="mk-lieu ${calque} ${ici ? "ici" : ""}" ${ici ? "" : `data-action="endroit" data-id="${esc(e.id)}"`} aria-label="${esc(e.nom)}${ici ? ", tu es ici" : ""}" title="${esc(e.nom)} : ${esc(e.type)}${esc(vehicules)}">
      <span class="disque">${sf(e.icone, 15)}</span>${e.vehicules?.length ? `<span class="garee">${sf("car.fill", 10)}</span>` : ""}<span class="nom">${esc(e.nom)}</span></button>`;
    L.marker([e.lat, e.lon], { icon: icone(L, html), keyboard: false, riseOnHover: true, zIndexOffset: ici ? 900 : calque === "miens" ? 500 : 300 })
      .addTo(k[calque === "joueurs" ? "joueurs" : calque] ?? k.utiles);
  }

  // Les boîtes des autres joueurs, à leur couleur (un texte hexadécimal, « E5534B ») ; touchées : leur fiche,
  // y aller et l'inspecter (FicheBoiteJoueur de l'iPhone).
  for (const b of t.boitesJoueurs ?? []) {
    const hex = String(b.couleur ?? "").replace("#", "");
    const fond = /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : "#5B6170";
    const html = `<button class="mk-boite" data-action="boiteJoueur" data-id="${esc(b.id)}" data-lieu="${esc(b.lieu ?? "")}" style="--c:${fond}" aria-label="${esc(b.nom)}, boîte de ${esc(b.pseudo || "un joueur")}" title="${esc(b.nom)}, boîte de ${esc(b.pseudo || "un joueur")}">
      ${sf("storefront", 13)}<span class="nom">${esc(b.nom)}</span></button>`;
    L.marker([b.lat, b.lon], { icon: icone(L, html), keyboard: false, zIndexOffset: 250 }).addTo(k.joueurs);
  }

  // Les autres joueurs, selon leur réglage : à leur ville, ou au lieu du jeu où ils sont.
  for (const j of t.joueurs ?? []) {
    const ou = j.precision === "lieu" && j.lieuNom ? j.lieuNom : j.villeNom;
    // RNT-231 : un marqueur équipé (forme, couleur) remplace l'initiale sur sa teinte.
    const x = Z.piecesDe(j.cosmetiques);
    const dessin = x.marqueur || x.couleurMarqueur
      ? `<span class="mk-forme">${Z.svgMarqueur(x.marqueur?.motif, x.couleurMarqueur?.couleurs, { taille: 30, teinte: hexa(j.teinte), id: j.id })}</span>`
      : `<span class="avatar">${esc((j.pseudo || "?").slice(0, 1).toUpperCase())}</span>`;
    const html = `<button class="mk-joueur ${j.precision}" data-action="joueurCarte" data-id="${esc(j.id)}" style="--c:${hexa(j.teinte)}" aria-label="${esc(j.pseudo)}${j.bot ? " (bot)" : ""}, à ${esc(ou)}" title="${esc(j.pseudo)}, à ${esc(ou)}">
      ${dessin}<span class="nom">${esc(j.pseudo)}</span></button>`;
    L.marker([j.lat, j.lon], { icon: icone(L, html), keyboard: false, riseOnHover: true, zIndexOffset: 700 }).addTo(k.joueurs);
  }

  // Les biens à vendre, à leur adresse.
  for (const b of t.aVendre ?? []) {
    const html = `<button class="mk-prix" data-action="ouvrir" data-page="achat" data-p='${esc(JSON.stringify({ id: b.id }))}' aria-label="${esc(b.nom)}, ${esc(montant(b.prix))}" title="${esc(b.nom)}, ${esc(montant(b.prix))}">
      ${sf(b.icone, 11)}${prixCourt(b.prix)}</button>`;
    L.marker([b.lat, b.lon], { icon: icone(L, html), keyboard: false, riseOnHover: true, zIndexOffset: 100 }).addTo(k.aVendre);
  }

  // Le trajet en cours : la ligne (un grand cercle en avion), et toi dessus.
  const pts = traceDe(t);
  C.trace = pts;
  C.toi = null;
  if (pts.length > 1) {
    // RNT-231 : ta traînée équipée colore et dessine le trajet (pointillés, sillage, comète).
    const tr = Z.piece(Z.equipement().trainee);
    const style = !tr ? { color: OR, weight: t.enRoute ? 2.5 : 3, opacity: 0.85, dashArray: t.enRoute ? "2 7" : "1 7" }
      : tr.motif === "pointilles" ? { color: tr.couleurs[0], weight: 3, opacity: 0.95, dashArray: "1 8" }
      : tr.motif === "sillage" ? { color: tr.couleurs[0], weight: 5, opacity: 0.55 }
      : { color: tr.couleurs[0], weight: 4, opacity: 0.9 };
    if (tr?.motif === "sillage") L.polyline(pts, { color: tr.couleurs[1], weight: 1.4, opacity: 0.9, lineCap: "round", interactive: false }).addTo(k.trace);
    L.polyline(pts, { ...style, lineCap: "round", interactive: false }).addTo(k.trace);
    const r = trajet(t);
    const fin = pts[pts.length - 1];
    L.marker(fin, { icon: icone(L, `<span class="mk-arrivee"></span>`), interactive: false, keyboard: false }).addTo(k.trace);
    const ou = surTrace(pts, progression(r, now));
    const avion = /airplane/.test(r.icone);
    C.toi = L.marker(ou.p, {
      icon: icone(L, `<span class="mk-toi enroute"><span class="disque" style="${avion ? `transform:rotate(${ou.cap.toFixed(0)}deg)` : ""}">${sf(avion ? "airplane" : r.icone, 15)}</span></span>`),
      interactive: false, keyboard: false, zIndexOffset: 1000,
    }).addTo(k.toi);
  } else {
    // Arrêté : la pièce de Grind, à ta ville (dézoomé) ou à l'endroit où tu es (zoomé).
    const ici = (t.endroits ?? []).find((e) => e.ici);
    const ville = t.ici;
    if (ville) {
      L.marker([ville.lat, ville.lon], { icon: icone(L, `<span class="mk-piece ville" title="${esc(ville.nom)}, tu es ici">G</span><span class="mk-piece-nom ville">${esc(ville.nom)}</span>`), interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(k.villes);
    }
    if (ici) {
      L.marker([ici.lat, ici.lon], { icon: icone(L, `<span class="mk-piece" title="${esc(ici.nom)}, tu es ici">G</span>`), interactive: false, keyboard: false, zIndexOffset: 1100 }).addTo(k.toi);
    }
  }
  cadrer(t, now);
  // RNT-224 : les lieux de la ville visée, gardés d'un dessin à l'autre (relus seulement si elle change).
  C.marquesDistantes = [];
  poserDistants(L);
  eviterPion();
  visibilite(L);
  viser(L);
}

/** Où regarder : au changement de situation seulement (arrivée, départ), jamais à chaque rafraîchissement. */
function cadrer(t, now) {
  const r = trajet(t);
  const cle = `${t.ici?.id ?? "-"}|${t.enRoute?.versID ?? "-"}|${t.enRouteLocal?.versID ?? "-"}|${(t.endroits ?? []).find((e) => e.ici)?.id ?? "-"}`;
  if (cle === C.cle) return;
  const premiere = C.cle == null;
  C.cle = cle;
  C.suivre = true;
  const anime = !premiere;
  if (t.enRoute && C.trace.length > 1) {
    // Un voyage : toute la ligne, puis la carte suit l'icône.
    C.map.fitBounds(C.trace, { padding: [46, 46], maxZoom: 9, animate: anime });
  } else if (t.enRouteLocal && C.trace.length > 1) {
    C.map.fitBounds(C.trace, { padding: [70, 70], maxZoom: 15.5, animate: anime });
  } else if (t.endroits?.length) {
    // Dans la ville : les endroits proches (l'aéroport, au loin, ne cadre pas).
    const pres = t.endroits.filter((e) => e.id !== "u:aeroport" && !e.id.startsWith("j:"));
    const ici = t.endroits.find((e) => e.ici);
    // Autour de l'endroit où l'on est, à l'échelle des rues : les lieux voisins se lisent un à un.
    if (ici) C.map.setView([ici.lat, ici.lon], 14, { animate: anime });
    else if (pres.length) C.map.fitBounds(pres.map((e) => [e.lat, e.lon]), { padding: [42, 42], maxZoom: 15, animate: anime });
  } else if (t.ici) {
    C.map.setView([t.ici.lat, t.ici.lon], 5, { animate: anime });
  }
  void now; void r;
}

// MARK: Chaque seconde : l'icône avance, la carte suit, la barre décompte

export function ticCarte(t, now) {
  const r = trajet(t);
  if (!C.map || !r) return;
  const rail = document.getElementById("carte-barre-rail");
  if (rail) rail.style.width = `${Math.round(progression(r, now) * 100)}%`;
  const reste = document.getElementById("carte-barre-reste");
  if (reste) reste.textContent = compteARebours((now < r.depart ? r.depart : r.arrivee) - now);
  if (!C.toi || C.trace.length < 2) return;
  const ou = surTrace(C.trace, progression(r, now));
  C.toi.setLatLng(ou.p);
  const disque = C.toi.getElement()?.querySelector(".disque");
  if (disque && /airplane/.test(r.icone)) disque.style.transform = `rotate(${ou.cap.toFixed(0)}deg)`;
  if (C.suivre && now >= r.depart) {
    const p = C.map.latLngToContainerPoint(ou.p), taille = C.map.getSize();
    // On recentre en douceur quand l'icône s'éloigne du milieu.
    if (Math.abs(p.x - taille.x / 2) > taille.x * 0.12 || Math.abs(p.y - taille.y / 2) > taille.y * 0.12) C.map.panTo(ou.p, { animate: true, duration: 0.8 });
  }
}

// MARK: Les gestes des boutons (appelés par la page Monde)

export const actionsCarte = {
  calque(ctx, el, d) {
    basculerCalque(el.dataset.id);
    el.setAttribute("aria-pressed", String(calquesActifs()[el.dataset.id]));
    if (C.map) visibilite();
  },
  zoomCarte(ctx, el) {
    if (!C.map) return;
    // Des touches rapprochées s'additionnent (getZoom ne bouge qu'à la fin de l'animation).
    C.cible = Math.max(2, Math.min(18, (C.cible ?? C.map.getZoom()) + Number(el.dataset.pas) * 1.5));
    C.map.setZoom(C.cible);
  },
  recentrerCarte(ctx, el, d) {
    if (!C.map) return;
    C.suivre = true;
    const t = d?.t;
    if (C.toi) C.map.setView(C.toi.getLatLng(), Math.max(C.map.getZoom(), t?.enRoute ? 5 : 14), { animate: true });
    else { C.cle = null; cadrer(t, ctx.maintenant()); }
  },
  pleinEcranCarte() {
    C.plein = !C.plein;
    const s = document.getElementById("carte-slot");
    s?.classList.toggle("plein", C.plein);
    document.documentElement.classList.toggle("carte-ouverte", C.plein);
    const b = s?.querySelector('[data-action="pleinEcranCarte"]');
    if (b) {
      b.setAttribute("aria-label", C.plein ? "Fermer la carte" : "Carte en plein écran");
      b.innerHTML = C.plein ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' : C.sf("agrandir", 16);
    }
    setTimeout(() => C.map?.invalidateSize({ animate: false }), 30);
  },
};
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && C.plein && !document.querySelector("dialog[open]")) actionsCarte.pleinEcranCarte(); });

/** Pour les essais : la carte, son zoom et ses calques. */
window.__carte = C;

// MARK: Le style de la carte (ici, pour ne pas toucher à la feuille commune)

const style = document.createElement("style");
style.textContent = `
.carte-slot{position:relative;height:380px;border-radius:24px;overflow:hidden;background:#0b0c0f;border:1px solid var(--filet2);isolation:isolate}
.carte-slot.plein{position:fixed;inset:0;height:auto;border-radius:0;border:0;z-index:40}
html.carte-ouverte nav.perle{visibility:hidden}
.carte-slot .carte-leaflet.leaflet-container{position:absolute;inset:0;background:#0b0c0f;font:inherit}
.carte-leaflet .leaflet-tile-pane{filter:invert(1) hue-rotate(185deg) brightness(.78) contrast(.92) saturate(.32)}
.carte-slot .leaflet-container .leaflet-control-attribution{background:rgba(11,12,15,.66);color:rgba(238,238,240,.55);font:500 9.5px var(--police);padding:1px 7px;border-top-left-radius:8px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.carte-slot .leaflet-container .leaflet-control-attribution a{color:rgba(238,238,240,.78);text-decoration:none}
.carte-slot.trajet .leaflet-container .leaflet-control-attribution{margin-bottom:78px;border-radius:8px}
.carte-erreur{position:absolute;inset:0;display:grid;place-items:center;color:var(--texte2);font-size:14px}
.carte-puces{position:absolute;z-index:1000;top:10px;left:10px;right:10px;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:1px;-webkit-mask-image:linear-gradient(90deg,#000 88%,transparent);mask-image:linear-gradient(90deg,#000 88%,transparent)}
.carte-puces::-webkit-scrollbar{display:none}
.carte-puce{flex:none;display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 11px 0 9px;border-radius:99px;font:600 12px var(--police);color:var(--texte2);background:rgba(16,17,21,.72);border:1px solid rgba(255,255,255,.08);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);transition:color .2s,background .2s,border-color .2s}
.carte-puce span{display:grid;width:14px;height:14px;opacity:.55}
.carte-puce[aria-pressed=true]{color:var(--texte);background:rgba(34,36,42,.86);border-color:rgba(255,255,255,.2)}
.carte-puce[aria-pressed=true] span{opacity:1;color:var(--accent)}
.carte-boutons{position:absolute;z-index:1000;top:50px;right:10px;display:flex;flex-direction:column;gap:8px}
.carte-rond{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:var(--texte);background:rgba(16,17,21,.72);border:1px solid rgba(255,255,255,.1);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.carte-rond svg{width:16px;height:16px}
.carte-rond[data-action=zoomCarte][data-pas="1"]{margin-top:6px}
.carte-slot.plein .carte-puces{top:max(12px,env(safe-area-inset-top))}
.carte-slot.plein .carte-boutons{top:calc(max(12px,env(safe-area-inset-top)) + 42px)}
.carte-barre{position:absolute;z-index:1000;left:10px;right:10px;bottom:10px;display:flex;align-items:center;gap:12px;padding:11px 14px 11px 11px;border-radius:18px;background:rgba(16,17,21,.8);border:1px solid rgba(255,255,255,.1);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5)}
.carte-slot.plein .carte-barre{bottom:max(14px,env(safe-area-inset-bottom));left:max(14px,calc(50% - 260px));right:max(14px,calc(50% - 260px))}
.carte-barre-icone{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#14120c;background:linear-gradient(135deg,#f4e3b0,#c99b45)}
.carte-barre-icone svg{width:18px;height:18px}
.carte-barre-texte{flex:1;min-width:0;display:grid;gap:3px}
.carte-barre-titre{font:650 14.5px var(--police);color:var(--texte);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.carte-barre-detail{font:500 12px var(--police);color:var(--texte2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.carte-barre-rail{display:block;height:4px;border-radius:9px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:3px}
.carte-barre-rail i{display:block;height:100%;border-radius:9px;background:${OR};transition:width 1s linear}
.carte-barre-reste{flex:none;font-size:16px;color:${OR};letter-spacing:0}
.carte-marque{background:none;border:0}
.carte-marque>*{position:absolute;left:0;top:0;transform:translate(-50%,-50%)}
.carte-marque button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mk-ville{display:grid;place-items:center;width:26px;height:26px}
.mk-ville i{display:block;width:var(--t);height:var(--t);border-radius:50%;background:var(--c);box-shadow:0 0 0 1px rgba(255,255,255,.3),0 1px 4px rgba(0,0,0,.6);transition:transform .2s var(--courbe-graphite)}
.mk-ville.mien i{box-shadow:0 0 0 1.5px rgba(255,255,255,.9),0 0 12px color-mix(in srgb,var(--c) 60%,transparent)}
.mk-ville:hover i{transform:scale(1.35)}
.mk-ville span{position:absolute;top:calc(50% + var(--t) / 2 + 3px);left:50%;transform:translateX(-50%);white-space:nowrap;font:500 10.5px var(--police);color:rgba(238,238,240,.82);text-shadow:0 0 3px #0b0c0f,0 0 3px #0b0c0f,0 1px 2px #000;opacity:0;pointer-events:none;transition:opacity .2s}
.mk-ville.nommee span,.mk-ville:hover span{opacity:1}
.mk-ville.mien span{font-weight:650;color:var(--texte)}
.mk-piece{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#F4E3B0,#B78A3B);box-shadow:0 0 0 1.5px rgba(255,255,255,.65),0 0 16px rgba(227,196,107,.75);font:800 13px Georgia,serif;color:rgba(0,0,0,.55)}
.mk-piece-nom{transform:translate(-50%,19px)!important;white-space:nowrap;font:700 11.5px var(--police);color:var(--texte);text-shadow:0 0 3px #0b0c0f,0 0 3px #0b0c0f,0 1px 2px #000}
.mk-lieu{display:grid;place-items:center}
.mk-lieu .disque{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;color:rgba(238,238,240,.92);background:rgba(18,19,23,.9);box-shadow:0 0 0 1px rgba(255,255,255,.22),0 4px 12px rgba(0,0,0,.55);transition:transform .2s var(--courbe-graphite)}
.mk-lieu .disque svg{width:15px;height:15px}
.mk-lieu:hover .disque{transform:scale(1.12)}
.mk-lieu.miens .disque{color:#0d111c;background:var(--accent);box-shadow:0 0 0 1.5px rgba(255,255,255,.75),0 4px 14px rgba(0,0,0,.55)}
.mk-lieu.ici .disque,.mk-lieu.ici .nom{width:0;height:0;box-shadow:none;opacity:0!important}
.mk-lieu .garee{position:absolute;right:-5px;bottom:-3px;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:#2a2c33;color:var(--texte);box-shadow:0 0 0 1px rgba(255,255,255,.3)}
.mk-lieu .garee svg{width:10px;height:10px}
.mk-lieu .nom,.mk-boite .nom,.mk-joueur .nom{position:absolute;top:calc(100% + 4px);left:50%;transform:translateX(-50%);white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis;font:600 10.5px var(--police);color:rgba(238,238,240,.9);padding:2px 7px;border-radius:99px;background:rgba(14,15,18,.78);opacity:0;pointer-events:none;transition:opacity .2s}
.noms-visibles .mk-lieu .nom,.noms-visibles .mk-boite .nom,.mk-lieu:hover .nom,.mk-boite:hover .nom,.mk-joueur:hover .nom,.noms-visibles .mk-joueur .nom{opacity:1}
.mk-boite{display:grid;place-items:center;width:26px;height:26px;border-radius:8px;color:#fff;background:var(--c);box-shadow:0 0 0 1.5px rgba(255,255,255,.7),0 3px 10px rgba(0,0,0,.5)}
.mk-boite svg{width:13px;height:13px}
.mk-joueur{display:grid;place-items:center}
.mk-joueur .mk-forme{display:grid;place-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,.55))}
.mk-joueur .avatar{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;font:700 12px var(--police);color:#fff;background:var(--c);box-shadow:0 0 0 2px rgba(255,255,255,.92),0 3px 10px rgba(0,0,0,.55)}
.mk-joueur.ville .avatar{box-shadow:0 0 0 2px rgba(255,255,255,.92),0 0 0 7px color-mix(in srgb,var(--c) 22%,transparent),0 3px 10px rgba(0,0,0,.55)}
.mk-prix{translate:0 var(--dy,0px);display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px 0 6px;border-radius:99px;font:650 11px var(--police);letter-spacing:-.01em;color:var(--texte);background:rgba(18,19,23,.9);box-shadow:0 0 0 1px rgba(240,149,74,.55),0 3px 10px rgba(0,0,0,.5);white-space:nowrap;font-variant-numeric:tabular-nums}
.mk-prix svg{width:11px;height:11px;color:#f0954a}
.mk-prix:hover{background:#26272d}
.mk-toi .disque{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;color:#14120c;background:linear-gradient(135deg,#f4e3b0,#c99b45);box-shadow:0 0 0 2px rgba(255,255,255,.9),0 0 18px rgba(227,196,107,.7);transition:transform .9s linear}
.mk-toi .disque svg{width:16px;height:16px}
.mk-arrivee{display:block;width:12px;height:12px;border-radius:50%;background:#0b0c0f;box-shadow:0 0 0 2.5px ${OR}}
.carte-slot[data-zoom=villes] .leaflet-tile-pane{opacity:.92}
.carte-bandeau{position:absolute;z-index:1000;top:48px;left:10px;display:flex;align-items:center;gap:7px;max-width:calc(100% - 66px);height:30px;padding:0 13px;border-radius:99px;font:500 12px var(--police);color:var(--texte2);white-space:nowrap;background:rgba(16,17,21,.78);border:1px solid rgba(255,255,255,.1);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);animation:bandeau-entre .25s var(--courbe-graphite)}
.carte-bandeau[hidden]{display:none}
.carte-bandeau b{font-weight:650;font-size:13px;color:var(--texte);overflow:hidden;text-overflow:ellipsis}
.carte-bandeau-icone{display:grid;width:12px;height:12px;flex:none}
.carte-slot.plein .carte-bandeau{top:calc(max(12px,env(safe-area-inset-top)) + 40px)}
@keyframes bandeau-entre{from{opacity:0;transform:translateY(-6px)}}
.mk-lieu.distant .disque{width:28px;height:28px;color:rgba(238,238,240,.62);background:rgba(18,19,23,.78);box-shadow:0 2px 8px rgba(0,0,0,.4);outline:1px dashed rgba(255,255,255,.3);outline-offset:-1px;opacity:.85}
.mk-lieu.distant .disque svg{width:14px;height:14px}
.mk-lieu.distant.miens .disque{color:var(--accent);background:rgba(18,19,23,.78)}
.mk-boite.distant{opacity:.7;filter:saturate(.55);box-shadow:0 0 0 1px rgba(255,255,255,.45),0 3px 10px rgba(0,0,0,.4)}
`;
document.head.append(style);
