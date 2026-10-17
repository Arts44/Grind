// ══════════════════════════════════════════════════════════════════════
//  La carte « Ici » de l'accueil (RNT-195, D209) : CarteIci.swift sur le web.
//
//  En haut de l'accueil, sous le solde : le lieu où l'on est (nom, ville,
//  un dessin sobre), ce qu'on peut y faire en gros boutons ; touchée, une
//  feuille avec le reste (ce qui presse, tout près, les gens ici, à
//  distance). En route : l'avancement, l'arrivée, ce qu'on fera en arrivant.
//
//  Tout vient du tableau « ici » (TableauIci, moteur). Chaque action porte
//  sa destination (page + paramètres), la même que sur l'iPhone ; `executer`
//  la traduit vers l'écran exact du web.
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "./format.js";
import { carte } from "./ui.js";
import { SF_REPAS, ouvrirRepas, guichetCoffre, actionsCoffre, pages as pagesManger } from "./pages/manger.js";
import { pages as pagesBanque } from "./pages/banque.js";

// MARK: Icônes (les noms SF Symbols du moteur, dessinés au trait)

const TRAITS = {
  ...SF_REPAS,
  "building.columns.fill": '<path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>',
  "creditcard.fill": '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>',
  "banknote.fill": '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  "lock.fill": '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  "house.and.flag.fill": '<path d="M3.5 20V11l6.5-5 6.5 5v9zM8 20v-5h4v5M17 3v6M17 3h4l-1 1.5 1 1.5h-4"/>',
  "watch.analog": '<rect x="7" y="7" width="10" height="10" rx="5"/><path d="M9 7l.8-4h4.4l.8 4M9 17l.8 4h4.4l.8-4M12 9.5V12l1.5 1"/>',
  "car.side.fill": '<path d="M3 15.5v-2.5l2.5-1 2.5-3.5h6l3.5 3.5 3 .8v2.7z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  "wrench.and.screwdriver.fill": '<path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L20 12l-8 8-3-3 8-8 .9.9M4 4l5 5M3.5 7.5 7.5 3.5"/>',
  "airplane.departure": '<path d="M3 19.5h18M4.5 14.5l3.5 1 11-5.5a1.8 1.8 0 0 0-1.6-3.2L13 9 7 6.5 5.5 7.3l4 3.4-3 1.5-2-1z"/>',
  airplane: '<path d="M12 3c.8 0 1.3.8 1.3 1.8V10l7.2 4v1.8l-7.2-2.2v4.6l2.2 1.6v1.4L12 20.4l-3.5.8v-1.4l2.2-1.6v-4.6L3.5 15.8V14l7.2-4V4.8C10.7 3.8 11.2 3 12 3z"/>',
  "tram.fill": '<rect x="5.5" y="4" width="13" height="13" rx="3"/><path d="M5.5 11h13M9 20l1.5-3M15 20l-1.5-3M9 14.5h.01M15 14.5h.01M10 2h4"/>',
  "frying.pan.fill": '<circle cx="9.5" cy="12" r="6"/><path d="M15.5 12h6"/>',
  "menucard.fill": '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  "map.fill": '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',
  mappin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  "chart.line.uptrend.xyaxis": '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  magnifyingglass: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  "storefront.fill": '<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20.5v-6h6v6"/>',
  "building.2.fill": '<path d="M4 21V5l7-2v18M11 21V9l9 2.5V21M7 8h.01M7 12h.01M7 16h.01M15 14h.01M15 17.5h.01"/>',
  "theatermasks.fill": '<path d="M4 6c3 1 13 1 16 0v5a8 8 0 0 1-16 0zM8.5 11h2M13.5 11h2M9.5 15.5c1.5 1 3.5 1 5 0"/>',
  "shippingbox.fill": '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  "figure.walk": '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 2.5 2.5V21M8 12l2.5-4.5h3l2 4 2.5 1M10.5 7.5 9 13"/>',
  "sailboat.fill": '<path d="M11 3v13H5zM13 6l5.5 10H13zM3 18.5h18l-2 2.5H5z"/>',
  "ferry.fill": '<path d="M3 15h18l-2.5 4.5h-13zM6 15v-4h12v4M9 11V7h6v4M3 21.5c2 0 2-1 4.5-1s2.5 1 4.5 1 2-1 4.5-1 2.5 1 4.5 1"/>',
  "wrench.adjustable.fill": '<path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L20 12l-8 8-3-3 8-8 .9.9"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
};
const ic = (nom, t = 20) =>
  `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAITS[nom] ?? TRAITS.mappin}</svg>`;
const hex = (n) => `#${(n ?? 0x8e9bb0).toString(16).padStart(6, "0")}`;
const TON = { alerte: "#E5534B", attention: "var(--or)", info: "var(--texte2)" };
const dest = (d) => esc(JSON.stringify(d));

// MARK: La carte

let ctxCourant = null;
let dernier = null; // le dernier tableau, pour dessiner tout de suite au prochain rendu
let minuteur = null;

/** Une ligne dans accueil.js : la carte, dessinée avec le dernier tableau connu, puis mise à jour. */
export function carteIci(ctx) {
  ctxCourant = ctx;
  styles();
  queueMicrotask(rafraichir);
  if (!minuteur) minuteur = setInterval(() => { if (document.getElementById("zone-ici")) rafraichir(); }, 30_000);
  return `<div id="zone-ici">${dernier ? dessiner(dernier) : squelette()}</div>`;
}

async function rafraichir() {
  if (!ctxCourant) return;
  const t = await ctxCourant.tableau("ici").catch(() => null);
  dernier = t;
  const zone = document.getElementById("zone-ici");
  if (!zone) return;
  const html = t ? dessiner(t) : "";
  if (zone.innerHTML !== html) zone.innerHTML = html;
}

const squelette = () => `<div class="carte ici squelette" style="height:236px;margin-top:16px"></div>`;

function dessiner(t) {
  const enRoute = t.enRoute;
  const presse = t.presse[0];
  const autour = [t.presse.length && `${t.presse.length} à voir`, t.proches.length && `${t.proches.length} tout près`, t.gens.length && `${t.gens.length} ${t.gens.length > 1 ? "personnes" : "personne"} ici`]
    .filter(Boolean).join(" · ");
  const boutons = (enRoute ? t.distance : t.actions).slice(0, 4);
  return `
  <div class="carte ici" style="--t:${hex(t.teinte)}" data-ici-ouvrir role="button" tabindex="0" aria-label="${esc(t.titre)} : ouvrir ce qui est autour">
    <div class="scene">${enRoute ? route(enRoute.part) : toits(t.silhouette)}
      <span class="pastille-ici">${ic(t.icone, 22)}</span>
      <span class="badge-ici">${enRoute ? (enRoute.local ? "En chemin" : "En voyage") : "Ici"}</span>
    </div>
    <div class="corps">
      <h3>${esc(t.titre)}</h3>
      <div class="sous">${enRoute ? `${esc(enRoute.moyen)} · ${esc(enRoute.arriveeTexte)}` : esc(t.type || t.villeNom)}</div>
      ${enRoute ? `<div class="rail-ici"><i style="width:${Math.round(enRoute.part * 100)}%"></i></div>
        ${enRoute.aLArrivee.length ? `<div class="arrivee">En arrivant à ${esc(enRoute.versNom)} : ${enRoute.aLArrivee.map((a) => esc(a.titre.toLowerCase())).join(", ")}</div>` : ""}
        <div class="libelle-ici">À distance</div>` : ""}
      <div class="actions-ici">${boutons.map(boutonAction).join("")}</div>
      ${presse ? `<div class="presse-ici" style="--p:${TON[presse.ton] ?? TON.info}"><i></i><span>${esc(presse.titre)}</span></div>` : ""}
      ${!enRoute && t.gens.length ? `<div class="gens-ici">${t.gens.slice(0, 4).map((g) => `<button class="gens-un" data-ici-joueur="${esc(g.id)}" aria-label="${esc(g.pseudo)}${g.bot ? ", bot" : ""}, ${esc(g.ou)}"><span class="avatar-ici" style="background:${hex(g.teinte)}">${esc(g.pseudo.slice(0, 1).toUpperCase())}</span><span><b>${esc(g.pseudo)}</b>${g.bot ? " · bot" : ""}<span class="d">${esc(g.ou)}</span></span></button>`).join("")}</div>` : ""}
      ${autour ? `<div class="autour"><span>Autour de toi</span><span>${esc(autour)} ${ic("chevron", 12)}</span></div>` : ""}
    </div>
  </div>`;
}

const boutonAction = (a) => `<button class="action-ici" data-ici-dest="${dest(a.destination)}">${ic(a.icone)}<span>${esc(a.titre)}${a.detail ? `<span class="d">${esc(a.detail)}</span>` : ""}</span></button>`;

/** La ligne des toits du lieu (silhouette du moteur), sobre, posée sur l'horizon. */
function toits(h) {
  const n = h.length || 7, l = 350 / n;
  const blocs = h.map((x, i) => {
    const haut = Math.round(10 + x * 50), w = Math.round(l * 0.72), xx = Math.round(i * l + l * 0.14);
    const fen = haut > 26 ? `<rect x="${xx + w / 2 - 2}" y="${64 - haut + 8}" width="4" height="4" rx="1" fill="var(--t)" opacity=".55"/>` : "";
    return `<rect x="${xx}" y="${64 - haut}" width="${w}" height="${haut}" rx="3" fill="var(--t)" opacity="${(0.08 + x * 0.1).toFixed(2)}"/>${fen}`;
  }).join("");
  return `<svg class="toits" viewBox="0 0 350 64" preserveAspectRatio="none" aria-hidden="true">${blocs}<rect x="0" y="63" width="350" height="1" fill="var(--t)" opacity=".4"/></svg>`;
}

/** En route : la ligne du trajet, et l'endroit où l'on en est. */
function route(part) {
  const x = 24 + part * 302;
  return `<svg class="toits" viewBox="0 0 350 64" preserveAspectRatio="none" aria-hidden="true">
    <line x1="24" y1="40" x2="326" y2="40" stroke="var(--t)" stroke-opacity=".3" stroke-width="2" stroke-dasharray="4 6"/>
    <line x1="24" y1="40" x2="${x.toFixed(1)}" y2="40" stroke="var(--t)" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="24" cy="40" r="4" fill="var(--t)"/><circle cx="326" cy="40" r="4" fill="none" stroke="var(--t)" stroke-width="2"/>
    <circle cx="${x.toFixed(1)}" cy="40" r="6.5" fill="var(--t)"/></svg>`;
}

// MARK: La feuille (le reste)

function ouvrirFeuille(ctx, t) {
  const ligne = ({ icone, titre, detail, teinte, bouton, destination, avatar }) => `
    <div class="ligne ligne-ici">
      ${avatar ?? `<span class="puce-ici" style="--t:${teinte}">${ic(icone, 17)}</span>`}
      <div style="flex:1;min-width:0"><div class="titre-l">${titre}</div>${detail ? `<div class="detail-l">${detail}</div>` : ""}</div>
      ${bouton && destination ? `<button class="petit" data-action="iciDest" data-dest="${dest(destination)}">${esc(bouton)}</button>` : ""}
    </div>`;
  const bloc = (titre, lignes) => (lignes.length ? `<div class="section">${titre}</div>${carte(lignes.join(""))}` : "");
  const presse = t.presse.map((u) => ligne({ icone: u.icone, titre: esc(u.titre), detail: esc(u.detail), teinte: TON[u.ton] ?? TON.info, bouton: u.bouton, destination: u.destination }));
  const proches = t.proches.map((p) => ligne({ icone: p.icone, titre: esc(p.nom), detail: `${esc(p.type)} · ${esc(p.trajet)}${p.cout ? ` · ${montant(p.cout)}` : ""}`, teinte: "var(--equipe)", bouton: "Y aller", destination: p.destination }));
  const gens = t.gens.map((g) => ligne({
    avatar: `<span class="avatar-ici" style="background:${hex(g.teinte)}">${esc(g.pseudo.slice(0, 1).toUpperCase())}</span>`,
    titre: `<button class="lien-ici" data-ici-joueur="${esc(g.id)}">${esc(g.pseudo)}</button>${g.bot ? ` <span class="t3" style="font-weight:500">· bot</span>` : ""}`, detail: esc(g.ou),
    bouton: g.actions[g.actions.length - 1]?.titre, destination: g.actions[g.actions.length - 1]?.destination,
  }));
  const distance = t.distance.map((a) => ligne({ icone: a.icone, titre: esc(a.titre), detail: esc(a.detail ?? ""), teinte: "var(--argent)", bouton: "Ouvrir", destination: a.destination }));
  const enRoute = t.enRoute;
  ctx.feuille({
    titre: enRoute ? enRoute.titre : t.titre,
    contenu: `<div class="pile feuille-ici">
      ${enRoute && enRoute.aLArrivee.length ? bloc(`En arrivant à ${esc(enRoute.versNom)}`, enRoute.aLArrivee.map((a) => ligne({ icone: a.icone, titre: esc(a.titre), teinte: hex(t.teinte) }))) : ""}
      ${bloc("Ce qui presse", presse)}
      ${bloc("Tout près", proches)}
      ${bloc(t.etat === "ici" ? "Les gens ici" : "Les gens de la ville", gens)}
      ${bloc("À distance", distance)}
      ${!presse.length && !proches.length && !gens.length ? `<p class="aide">Rien ne presse. ${enRoute ? "Tu gères tout à distance en attendant d'arriver." : ""}</p>` : ""}
    </div>`,
    actions: {
      iciDest: (c, el) => { ctx.fermerFeuille(); return executer(ctx, JSON.parse(el.dataset.dest)); },
    },
  });
}

// MARK: Les destinations (le même vocabulaire que l'iPhone, D209)

export async function executer(ctx, d) {
  const p = d.params ?? {};
  switch (d.page) {
    case "onglet":
      if (p.section) { try { localStorage.setItem("actifs.onglet", p.section); } catch {} }
      return ctx.allerOnglet(p.onglet);
    case "banque.ouvrirCompte":
      pagesBanque.banque.rendu({}); // les styles de la banque (la feuille d'ouverture en dépend), sans quitter l'accueil
      return pagesBanque.banque.actions.ouvrirCompte(ctx, null, { t: await ctx.tableau("banque") });
    case "banque.credit":
      return ctx.ouvrir("banque.credit", {}, { onglet: "banque" });
    case "degeler":
      return ctx.decider("banque", { degeler: { carte: Number(p.carte) } }, { succes: "Carte dégelée" });
    case "coffre": {
      const pf = await ctx.tableau("portefeuille");
      const agence = p.agence === "1";
      const actions = Object.fromEntries(Object.entries(actionsCoffre).map(([k, f]) => [k, (c, el) => f(c, el, { pf })]));
      return ctx.feuille({ titre: agence ? "Coffre à l'agence" : "Ton coffre", contenu: `<div class="pile">${guichetCoffre(pf, { agence }) || `<p class="aide">Pas de coffre ici.</p>`}</div>`, actions });
    }
    case "repas":
      return ouvrirRepas(ctx, await ctx.tableau("manger"), p.option);
    case "courses":
      return pagesManger.manger.actions.courses(ctx, { dataset: { livrer: p.livrer ?? "0" } }, { t: await ctx.tableau("manger") });
    case "manger":
      if (p.inviter) {
        const t = await ctx.tableau("manger");
        if (t?.nourriture?.invitables?.some((x) => x.id === p.inviter)) return pagesManger.manger.actions.inviter(ctx, { dataset: { id: p.inviter } }, { t });
      }
      return ctx.ouvrir("manger");
    case "horlogerie": case "concession": case "marcheImmo": case "port": case "chantierNaval":
      return ctx.ouvrir(d.page, {}, { onglet: "actifs" });
    case "boite": case "bien":
      return ctx.ouvrir(d.page, { id: d.page === "boite" ? Number(p.id) : p.id }, { onglet: "actifs" });
    case "inspecter": {
      // Retour du 16/10 : la boîte d'un autre joueur, sa fiche ouverte sur l'inspection (on y est déjà).
      const { ouvrirBoiteJoueur } = await import("./pages/boite-joueur.js");
      return ouvrirBoiteJoueur(ctx, p.boite);
    }
    case "visiter":
      return ctx.decider("immobilier", { visiter: { bien: p.bien } }, { succes: "Visite faite : l'état et les travaux sont sur l'annonce" });
    case "aller": {
      const corps = { lieu: p.lieu, moyen: p.moyen, ...(p.vehicule != null ? { vehicule: Number(p.vehicule) } : {}) };
      return ctx.decider("monde", { allerA: corps }, { succes: "En route" });
    }
    default:
      return ctx.ouvrir(d.page);
  }
}

// Un seul écouteur : les boutons de la carte, puis la carte elle-même (le reste en feuille).
document.addEventListener("click", async (ev) => {
  const ctx = ctxCourant;
  if (!ctx) return;
  const b = ev.target.closest("[data-ici-dest]");
  const j = ev.target.closest("[data-ici-joueur]");
  try {
    // RNT-200 : un joueur ou un bot d'ici : sa fiche.
    if (j) { ev.preventDefault(); ev.stopPropagation(); const { ouvrirFicheJoueur } = await import("./pages/joueurs.js"); return await ouvrirFicheJoueur(ctx, j.dataset.iciJoueur); }
    if (b) { ev.preventDefault(); return await executer(ctx, JSON.parse(b.dataset.iciDest)); }
    if (ev.target.closest("[data-ici-ouvrir]") && dernier) return ouvrirFeuille(ctx, dernier);
  } catch (e) { console.error(e); ctx.toast(e.message, "refus"); }
});
document.addEventListener("keydown", (ev) => {
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.matches?.("[data-ici-ouvrir]") && ctxCourant && dernier) { ev.preventDefault(); ouvrirFeuille(ctxCourant, dernier); }
});

// MARK: Styles

function styles() {
  if (document.getElementById("styles-ici")) return;
  const s = document.createElement("style");
  s.id = "styles-ici";
  s.textContent = `
.ici { display: block; overflow: hidden; border-radius: var(--r-carte, 22px); margin-top: 16px; cursor: pointer; text-align: left; }
.ici.squelette { opacity: .5; }
.ici .scene { position: relative; height: 112px; background: linear-gradient(165deg, color-mix(in srgb, var(--t) 30%, transparent), color-mix(in srgb, var(--t) 4%, transparent) 75%); }
.ici .toits { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 64px; }
.ici .pastille-ici { position: absolute; top: 14px; left: 16px; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center;
  color: var(--t); background: color-mix(in srgb, var(--t) 16%, rgba(0,0,0,.35)); border: 1px solid color-mix(in srgb, var(--t) 30%, transparent); }
.ici .badge-ici { position: absolute; top: 16px; right: 16px; font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
  color: var(--texte2); padding: 5px 10px; border-radius: 99px; background: rgba(0,0,0,.28); }
.ici .corps { padding: 14px 16px 16px; }
.ici h3 { font-size: 19px; font-weight: 650; letter-spacing: -.01em; line-height: 1.25; }
.ici .sous { font-size: 13px; color: var(--texte2); margin-top: 3px; }
.actions-ici { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
.action-ici { min-height: 58px; border-radius: 16px; background: rgba(255,255,255,.05); border: 1px solid var(--filet); display: flex; align-items: center;
  gap: 10px; padding: 10px 12px; font-size: 14px; font-weight: 600; text-align: left; color: var(--texte); }
.action-ici:hover { background: rgba(255,255,255,.08); }
.action-ici svg { color: var(--t); flex: none; }
.action-ici:last-child:nth-child(odd) { grid-column: span 2; }
.action-ici > span { min-width: 0; }
.action-ici .d { display: block; font-size: 11.5px; font-weight: 500; color: var(--texte2); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.presse-ici { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 13px; font-weight: 500; }
.presse-ici i { width: 7px; height: 7px; border-radius: 50%; background: var(--p); flex: none; }
.gens-ici { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.gens-un { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 8px; border-radius: 14px; background: rgba(255,255,255,.04); text-align: left; font-size: 13px; color: var(--texte); }
.gens-un .d { display: block; font-size: 11px; color: var(--texte2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gens-un > span:last-child { min-width: 0; }
.lien-ici { font: inherit; color: inherit; text-decoration: underline; text-decoration-color: var(--filet2); text-underline-offset: 3px; }
.autour { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--filet); font-size: 12.5px; color: var(--texte2); }
.autour span:last-child { display: flex; align-items: center; gap: 4px; }
.rail-ici { height: 6px; border-radius: 3px; background: var(--puce2); margin-top: 12px; overflow: hidden; }
.rail-ici i { display: block; height: 100%; border-radius: 3px; background: var(--t); }
.ici .arrivee { font-size: 12.5px; color: var(--texte2); margin-top: 10px; }
.libelle-ici { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--texte3); margin-top: 14px; }
.ligne-ici .titre-l { font-size: 14px; font-weight: 600; }
.ligne-ici .detail-l { font-size: 12px; color: var(--texte2); margin-top: 2px; }
.puce-ici { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; flex: none; color: var(--t); background: color-mix(in srgb, var(--t) 14%, transparent); }
.avatar-ici { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; flex: none; font-size: 14px; font-weight: 700; color: #0d111c; }
`;
  document.head.append(s);
}
