// ══════════════════════════════════════════════════════════════════════
//  Zone « monde » (D186, vague 1) — EcranMonde.swift, FeuilleVoyage,
//  FeuilleDeplacement, CarteMonde.swift.
//
//  RNT-185 : une seule carte (carte.js), du monde aux bâtiments, à tuiles
//  OpenStreetMap. Dézoomé, chaque ville est un point à la couleur et à la
//  taille de son palier, tes villes en accent, la pièce de Grind où tu es ;
//  zoomé, les rues et les lieux du jeu, par calques. Le trajet avance sur
//  sa ligne. Toucher une ville ouvre les devis du voyage, un lieu ceux du
//  trajet en ville (une ville touchée ouvre aussi sa fiche). Dessous
//  (RNT-198, D211) : la position, puis deux lignes, « Lieux de la ville »
//  et « Villes », qui ouvrent leurs pages (pages/villes.js) ; le guichet
//  de l'endroit où l'on est, ce qu'on peut faire sur place, et déménager.
//
//  Ce que le moteur n'expose pas encore au web (voir le rapport de zone) :
//   - les devis (`devis(vers:)`, `devisLocal`) : les devis entre villes
//     sont recalculés ici avec la règle de MoteurEconomie.devis(vers:) et
//     le catalogue ; dans la ville, prix et durée ne sont connus qu'au départ ;
//   - l'heure du prochain départ des transports (`prochainDepart`).
//  RNT-198 : les chantiers des villes sont exposés (« chantiersVille »), dans la fiche d'une ville.
// ══════════════════════════════════════════════════════════════════════
import { montant, duree, esc } from "../format.js";
import { entetePousse, carte, bouton, petit, icones, ligne, pilules } from "../ui.js";
import { SF_REPAS, guichetRepas, guichetCoffre, ouvrirRepas, actionsCoffre } from "./manger.js";
import { carteHTML, monterCarte, ticCarte, actionsCarte } from "./carte.js";
import { balanceGardee } from "./catalogues.js";
import { invitationDuTrajet, actionsVoyageADeux } from "./enligne-fiches.js"; // lot E : le voyage à deux
import * as L from "../enligne.js";

// MARK: Les icônes SF de l'iPhone, en traits (24 × 24)

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const AVION = '<path d="M12 2.5c.8 0 1.4.7 1.4 1.5v5.2l7.1 4.3v2.2l-7.1-2.3v4.3l2 1.5v1.6L12 20l-3.4.8v-1.6l2-1.5v-4.3l-7.1 2.3v-2.2l7.1-4.3V4c0-.8.6-1.5 1.4-1.5z"/>';
const SF = {
  "tram.fill": '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9" cy="14" r=".6" fill="currentColor"/><circle cx="15" cy="14" r=".6" fill="currentColor"/>',
  "bus.fill": '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M7 21v-3M17 21v-3"/><circle cx="8" cy="14.5" r=".6" fill="currentColor"/><circle cx="16" cy="14.5" r=".6" fill="currentColor"/>',
  "car.fill": '<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="15" width="18" height="4" rx="1.5"/>',
  "car.side.fill": '<path d="M3 15.5V13l2.5-1 2.5-3.5h7l3 3.5 3 .8v2.7z"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
  airplane: AVION, "airplane.departure": AVION, "airplane.circle.fill": AVION,
  bicycle: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l2 8H6M14 5h2"/>',
  motorcycle: '<circle cx="5.5" cy="16" r="3"/><circle cx="18.5" cy="16" r="3"/><path d="M5.5 16h6l3-6h-4M14.5 10l4 6M15 6h3l1 4"/>',
  "sailboat.fill": '<path d="M12 3v13M12 4.5l6.5 10.5H12M11 7l-5.5 8H11M3.5 18.5c2.5 2 14.5 2 17 0"/>',
  // RNT-188 : le ferry.
  "ferry.fill": '<path d="M4 15l1.5-6h13L20 15M7 9V6h6v3M3 18.5c2.5 1.6 15.5 1.6 18 0"/><path d="M9 12h1M13 12h1"/>',
  "figure.walk": '<circle cx="13" cy="4.2" r="1.8"/><path d="M10.5 21l2-6-3-3 1.2-4.8 3.3 3 3 1M9.7 12l-2 3H5"/>',
  scooter: '<circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M6 18h12M15.5 18L13.5 5H17"/>',
  "wrench.and.screwdriver.fill": '<path d="M14 7a4 4 0 0 1 5.5-3.7L17 5.8 18.2 7l2.5-2.5A4 4 0 0 1 15.8 10L7 18.8a1.7 1.7 0 0 1-2.4-2.4z"/>',
  "house.and.flag.fill": '<path d="M4 20V10l7-5 7 5v10zM9 20v-5h4v5M18 3v6M18 3h3.5l-1 1.5 1 1.5H18"/>',
  "house.fill": '<path d="M4 20V9l8-5 8 5v11zM10 20v-5h4v5"/>',
  "house.lodge.fill": '<path d="M2.5 11L12 4l9.5 7M5 9.5V20h14V9.5M10 20v-5h4v5"/>',
  "building.columns.fill": '<path d="M3 9l9-5 9 5M5 9.5v8.5M9.5 9.5v8.5M14.5 9.5v8.5M19 9.5v8.5M3 20.5h18"/>',
  "building.fill": '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  "building.2.fill": '<rect x="3" y="7" width="9" height="14" rx="1"/><rect x="12" y="3" width="9" height="18" rx="1"/><path d="M6 11h3M6 15h3M15 7h3M15 11h3M15 15h3"/>',
  mappin: '<path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  storefront: '<path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5"/>',
  "sun.max.fill": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  snowflake: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 3.8l3 2 3-2M9 20.2l3-2 3 2"/>',
  banknote: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  agrandir: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  moins: '<path d="M5 12h14"/>',
  // RNT-185 : les lieux et les calques de la carte.
  "watch.analog": '<circle cx="12" cy="12" r="5.5"/><path d="M12 9.5V12l1.6 1.2M9 6.8 9.6 3h4.8l.6 3.8M9 17.2l.6 3.8h4.8l.6-3.8"/>',
  "cart.fill": '<path d="M3 4h2.5l2.2 10.5h10l2-7.5H6.6"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  "cross.case.fill": '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M12 10.5v6M9 13.5h6"/>',
  "tag.fill": '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.7 6.7a1.4 1.4 0 0 1-2 0z"/><circle cx="8" cy="8" r="1.4"/>',
  "person.fill": '<circle cx="12" cy="8" r="3.6"/><path d="M5 20.5c.8-3.8 3.6-5.8 7-5.8s6.2 2 7 5.8"/>',
  "person.2.fill": '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 5.8a3 3 0 0 1 0 5.6M17 14.6c2 .6 3.2 2.2 3.6 4.9"/>',
  "storefront.fill": '<path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5"/>',
  // RNT-198 : les pages du Monde (lieux, villes, fiche ville, résidences) et les gestes d'un lieu (la carte Ici).
  "key.fill": '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l2.5 2.5M14.5 8.5 16.5 10.5"/>',
  "hammer.fill": '<path d="M14 6l4 4M4 20l9-9M12 4.5 15.5 1 23 8.5 19.5 12z"/>',
  "globe.europe.africa.fill": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  "mappin.and.ellipse": '<path d="M12 17s-5-4.8-5-8.6a5 5 0 0 1 10 0c0 3.8-5 8.6-5 8.6z"/><circle cx="12" cy="8.5" r="1.8"/><ellipse cx="12" cy="19.5" rx="7" ry="2"/>',
  "info.circle": '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  "location.fill": '<path d="M20 4 4 11l7 2 2 7z"/>',
  "creditcard.fill": '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>',
  "banknote.fill": '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  "lock.fill": '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  magnifyingglass: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>',
  "chart.line.uptrend.xyaxis": '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  "frying.pan.fill": '<circle cx="9.5" cy="12" r="6"/><path d="M15.5 12h6"/>',
  "menucard.fill": '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  "theatermasks.fill": '<path d="M4 6c3 1 13 1 16 0v5a8 8 0 0 1-16 0zM8.5 11h2M13.5 11h2M9.5 15.5c1.5 1 3.5 1 5 0"/>',
  "wrench.adjustable.fill": '<path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L20 12l-8 8-3-3 8-8 .9.9"/>',
  "checkmark.seal.fill": '<path d="M12 2.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 21.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z"/><path d="M8.5 12l2.3 2.3 4.7-4.6"/>',
  nosign: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  // RNT-177 : les sorties de la ville (fast-food, brasserie, étoilé, bar, club).
  ...SF_REPAS,
};
export const sf = (nom, taille = 0) => {
  const s = I(SF[nom] ?? (nom?.includes("car") ? SF["car.fill"] : nom?.includes("airplane") ? AVION : nom?.includes("house") ? SF["house.fill"] : nom?.includes("building") ? SF["building.fill"] : SF.mappin));
  return taille ? s.replace("<svg", `<svg width="${taille}" height="${taille}"`) : s;
};

// MARK: Repères de la carte (CarteMonde.swift)

const COULEUR_PALIER = { 4: "#B98BFF", 3: "#E3B85B", 2: "#5BBF8A", 1: "#8FA3B8" };
const TAILLE_PALIER = [6, 8, 10, 13];
const NOMS_PALIERS_VILLE = ["Abordable", "Régionale", "Métropole", "Ville-monde"];
const NOMS_PALIERS_PAYS = ["Émergent", "Établi", "Prospère", "Privilégié"];
const couleurPalier = (p) => COULEUR_PALIER[p] ?? COULEUR_PALIER[1];
const taillePalier = (p) => TAILLE_PALIER[Math.min(3, Math.max(0, (p ?? 1) - 1))];

/** Les teintes des billets (FicheMoyen) : un moyen, une couleur. */
function teinteMoyen(moyen, vehicule) {
  switch (moyen) {
    case "avion": case "jet": return "#4F7BE0";
    case "train": case "tgv": return "#3FA37A";
    case "bus": case "car": return "#E0913F";
    case "taxi": return "#E3B85B";
    case "bateau": return "#2F8FB0";
    case "ferry": return "#3A7FC4";
    case "pied": return "#5BBF8A";
    case "velo": case "douce": case "trottinette": return "#3FB6A8";
    case "moto": return "#D8504A";
    default: return vehicule != null ? "#8A5CF0" : "#5B6170";
  }
}

// MARK: L'état propre à la page (zoom, recherche, tri, filtres, choix d'un billet)

const vue = { zoom: 0, moyen: null, moyenLocal: null, passager: "seul", frais: "partage" };
let catalogues = null; // la balance ne change pas pendant la partie

/** Les catalogues de la balance dont la page a besoin (une fois par partie). */
async function chargerCatalogues(ctx) {
  if (!catalogues) {
    const [trajets, entreprises, vehicules, monde] = await Promise.all(
      ["trajets", "entreprises", "vehicules", "monde"].map((p) => balanceGardee(ctx, p)));
    catalogues = { trajets, villes: entreprises?.villes ?? [], modeles: vehicules?.modeles ?? [], pays: monde?.pays ?? [] };
  }
  return catalogues;
}

/** RNT-198 : les données de la page Monde, lues depuis une autre page (une fiche) pour ouvrir ses feuilles. */
async function donneesMonde(ctx) {
  const cat = await chargerCatalogues(ctx);
  const [t, garage] = await Promise.all([ctx.tableau("monde"), ctx.tableau("garage")]);
  return t ? { t, garage, cat } : null;
}

/** RNT-198 : la feuille du voyage vers une ville, depuis une fiche (sans la ligne « La fiche de … »). */
export async function voyagerVers(ctx, id) {
  const d = await donneesMonde(ctx);
  if (!d) return;
  await chargerDevis(ctx, "vers", id);
  await chargerDuo(ctx, d, id);
  ouvrirVoyage(ctx, d, id, { fiche: false });
}

/** RNT-198 : la feuille du trajet vers un lieu de la ville, depuis la fiche d'un lieu. */
export async function allerVersLieu(ctx, id) {
  const d = await donneesMonde(ctx);
  if (!d) return;
  await chargerDevis(ctx, "local", id);
  ouvrirDeplacement(ctx, d, id);
}

/** Les feuilles relisent la page Monde quand elle est dessous ; ouvertes depuis une fiche, leurs propres données. */
const donneesFeuille = (ctx, d) => (ctx.etat.donnees?.t?.endroits ? ctx.etat.donnees : d);

const nombre = (x, d = 0) => x.toLocaleString("fr-BE", { minimumFractionDigits: d, maximumFractionDigits: d });
/** « de Paris », « d'Anvers » (MoteurEconomie.de). */
export const de = (nom) => (/^[aeiouyéèêâîô]/i.test(nom ?? "") ? `d'${nom}` : `de ${nom}`);
const heure = (ms) => new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
const pct = (x) => `${Math.round(x * 100)} %`;
function compteARebours(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

// MARK: La page

export const pages = {
  monde: {
    titre: "Monde",
    css: ["monde", "enligne", "manger"], // lot A : css/pages/monde.css (la carte, la légende) ; enligne.css (l'invitation du trajet) ; RNT-210 : les repas (manger.js)
    async donnees(ctx) {
      await chargerCatalogues(ctx);
      const t = await ctx.tableau("monde");
      if (!t) return { t: null };
      const ici = t.endroits.find((e) => e.ici);
      // RNT-177 : à une adresse (« s:… ») ou chez soi, on mange ; chez soi et à l'agence, le coffre.
      const posee = !t.enRouteLocal ? ici?.id : null;
      const [garage, banque, manger, pf] = await Promise.all([
        ctx.tableau("garage"),
        posee === "u:banque" ? ctx.tableau("banque") : null,
        posee?.startsWith("s:") || posee === "domicile" ? ctx.tableau("manger") : null,
        posee === "domicile" || posee === "u:banque" ? ctx.tableau("portefeuille") : null,
      ]);
      return { t, garage, banque, manger, pf, cat: catalogues };
    },
    rendu(d, ctx) {
      if (!d?.t) return `${entetePousse("Monde")}<div class="vide">Le monde s'ouvre avec ta première saison.</div>`;
      const t = d.t;
      const now = ctx.maintenant();
      d.phase = phase(t, now);
      return `
        ${entetePousse("Monde")}
        <div class="pile">
          ${carteHTML(t, now, sf)}
          ${position(t, d, now)}
          ${lignesPages(t)}
          ${t.endroits.length && dansLaVilleUtile(t) ? dansLaVille(t, d, now) : ""}
          ${t.ici && t.surPlace.some((b) => b.sejour || b.local) ? surPlace(t) : ""}
          <p class="aide" style="margin:2px 4px 0">${t.voyages} voyage${t.voyages > 1 ? "s" : ""}, ${nombre(Math.round(t.kilometres))} km parcourus</p>
        </div>`;
    },
    /** RNT-185 : la carte, créée une fois, se replace dans son emplacement après chaque dessin. */
    apres(ctx, d) { if (d?.t) monterCarte(ctx, d, { sf, terres: TERRES }); },
    tic(ctx, d) {
      const t = d?.t;
      if (!t) return;
      const now = ctx.maintenant();
      ticCarte(t, now);
      for (const [id, r] of [["route", t.enRoute], ["route-local", t.enRouteLocal]]) {
        if (!r) continue;
        const el = document.getElementById(`${id}-reste`);
        if (el) el.textContent = compteARebours(r.arrivee - now);
        const at = document.getElementById(`${id}-attente`);
        if (at) at.textContent = compteARebours(r.depart - now);
        const rail = document.getElementById(`${id}-rail`);
        if (rail) rail.style.width = `${Math.round(progression(r, now) * 100)}%`;
      }
      // Départ, arrivée : l'écran change d'état, on relit le moteur (une fois).
      const p = phase(t, now);
      if (p !== d.phase && !d.relu) {
        d.relu = true;
        ctx.rafraichir();
      }
    },
    actions: {
      voyage: async (ctx, el, d) => { await chargerDevis(ctx, "vers", el.dataset.id); await chargerDuo(ctx, d, el.dataset.id); ouvrirVoyage(ctx, d, el.dataset.id); },
      endroit: async (ctx, el, d) => { await chargerDevis(ctx, "local", el.dataset.id); ouvrirDeplacement(ctx, d, el.dataset.id); },
      // RNT-185 : les calques, le zoom, le plein écran ; un joueur touché sur la carte.
      ...actionsCarte,
      ...actionsVoyageADeux, // lot E : l'invitation du trajet
      // RNT-144 : la boîte d'un autre joueur touchée sur le plan : sa fiche ; « Y aller » ouvre le trajet.
      async boiteJoueur(ctx, el, d) {
        const { ouvrirBoiteJoueur } = await import("./boite-joueur.js");
        const lieu = el.dataset.lieu;
        return ouvrirBoiteJoueur(ctx, el.dataset.id, { allerY: lieu ? async (c) => { await chargerDevis(c, "local", lieu); ouvrirDeplacement(c, d, lieu); } : null });
      },
      // RNT-200 : en ligne, la fiche complète du joueur ou du bot.
      async joueurCarte(ctx, el, d) {
        const { monde: m } = await import("../enligne.js");
        if (m.code && m.profils.some((p) => String(p.id).toLowerCase() === String(el.dataset.id).toLowerCase())) {
          const { ouvrirFicheJoueur } = await import("./joueurs.js");
          return ouvrirFicheJoueur(ctx, el.dataset.id);
        }
        ouvrirJoueur(ctx, d, el.dataset.id);
      },
      annulerDepart: (ctx, el, d) => faire(ctx, d, { annulerDepart: {} }, "Départ annulé, billet remboursé"),
      // RNT-190 : rendre sans autre logement met à la rue : on le dit avant de confirmer.
      rendreLogement(ctx, el, d) {
        if (!d.t.avertissementRendre) return faire(ctx, d, { rendreLogement: {} }, "Logement rendu");
        ctx.feuille({
          titre: "Rendre ton logement ?",
          contenu: `<p class="aide" id="avertissement-rue" style="font-size:15px;line-height:1.5;color:var(--texte)">${esc(d.t.avertissementRendre)}</p>
            <div class="pile" style="gap:10px;margin-top:16px">
              <button class="bouton danger" data-action="rendreALaRue">Rendre et vivre à la rue</button>
              <button class="bouton discret" data-action="fermerFeuille">Garder mon logement</button></div>`,
          actions: { rendreALaRue: () => faire(ctx, d, { rendreLogement: {} }, "Logement rendu : tu es à la rue") },
        });
      },
      demenager: (ctx, el, d) => faire(ctx, d, { demenager: {} }, `Tu habites désormais à ${d.t.ici?.nom ?? ""}`),
      sejourner: (ctx, el, d) => faire(ctx, d, { sejourner: { bien: el.dataset.bien } }, "Séjour réservé"),
      async visiter(ctx, el) {
        await ctx.decider("immobilier", { visiter: { bien: el.dataset.bien } }, { succes: "Visite faite : l'état et les travaux sont sur l'annonce" });
      },
      async degeler(ctx, el) {
        await ctx.decider("banque", { degeler: { carte: Number(el.dataset.carte) } }, { succes: "Carte dégelée" });
      },
      versBanque: (ctx) => ctx.allerOnglet("banque"),
      versActifs: (ctx) => ctx.allerOnglet("actifs"),
      // RNT-177 : manger sur place, le coffre.
      repas: (ctx, el, d) => ouvrirRepas(ctx, d.manger, el.dataset.id),
      seLever: (ctx) => ctx.decider("portefeuille", { seLever: {} }, { succes: "Tu te lèves de table" }),
      ...actionsCoffre,
    },
  },
};

/** Où en est-on : la page se relit quand ça change (départ, arrivée). */
function phase(t, now) {
  const p = (r) => (!r ? "-" : now < r.depart ? "attente" : now < r.arrivee ? "route" : "arrive");
  return `${p(t.enRoute)}|${p(t.enRouteLocal)}`;
}
const progression = (r, now) => (r.arrivee > r.depart ? Math.min(1, Math.max(0, (now - r.depart) / (r.arrivee - r.depart))) : 1);

/** Une décision du monde ; un véhicule débridé pris au contrôle le dit (D84). */
async function faire(ctx, d, operation, succes) {
  const avant = (await ctx.tableau("illegal"))?.casier?.length ?? 0;
  const ok = await ctx.decider("monde", operation);
  if (!ok) return false;
  const apres = (await ctx.tableau("illegal"))?.casier?.length ?? 0;
  if (apres > avant) ctx.toast("Contrôle de police : véhicule débridé saisi, amende", "refus");
  else ctx.toast(typeof succes === "function" ? succes(ctx.etat.donnees?.t) : succes, "gain");
  return true;
}

// MARK: Un joueur touché sur la carte (RNT-185)

function ouvrirJoueur(ctx, d, id) {
  const j = d.t.joueurs?.find((x) => x.id === id);
  if (!j) return;
  const ou = j.precision === "lieu" && j.lieuNom ? `${j.lieuNom}, à ${j.villeNom}` : j.villeNom;
  const couleur = `#${(Number(j.teinte) >>> 0 & 0xffffff).toString(16).padStart(6, "0")}`;
  ctx.feuille({
    titre: j.pseudo,
    contenu: `<div class="pile" style="align-items:center;text-align:center">
      <span style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:${couleur};color:#fff;font:700 26px var(--police);box-shadow:0 0 0 3px rgba(255,255,255,.9)">${esc(j.pseudo.slice(0, 1).toUpperCase())}</span>
      <div class="libelle">${j.bot ? "Un bot du monde" : "Un joueur du monde"}</div>
      <p class="aide">${j.precision === "lieu" ? "Il se montre au lieu du jeu où il est" : "Il ne montre que sa ville"} : ${esc(ou)}.${j.ici ? " Il est dans ta ville." : ""}</p></div>`,
  });
}

// MARK: Où l'on est (position)

/** La pièce de Grind (PieceVille), en HTML. */
const piece = (t = 26) => `<span aria-hidden="true" style="flex:none;width:${t}px;height:${t}px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#F4E3B0,#B78A3B);box-shadow:0 0 10px rgba(227,196,107,.6);font:800 ${Math.round(t / 2)}px Georgia,serif;color:rgba(0,0,0,.55)">G</span>`;

/** D112 : en attendant le départ, l'heure, le retard, annuler. */
function attenteDepart(r, id, now) {
  return `<div class="pile" style="gap:8px">
    <div class="rangee entre"><span class="rangee" style="gap:6px;font-size:14px;font-weight:600"><span style="width:16px;display:grid">${sf("clock", 16)}</span>Départ à ${heure(r.depart)}</span>
      <span class="chiffres t2" style="font-size:14px" id="${id}-attente">${compteARebours(r.depart - now)}</span></div>
    ${r.annule ? `<div class="alerte" style="font-size:13px;font-weight:500">Le départ prévu est annulé : tu prends le suivant.</div>`
      : r.retard > 0 ? `<div class="alerte" style="font-size:13px;font-weight:500">Retard annoncé : ${r.retard} min.</div>` : ""}
    <div>${petit("Annuler, billet remboursé", "annulerDepart")}</div></div>`;
}

const railTrajet = (r, id, now, cache = false) =>
  `<div class="rail" style="--c:var(--or);height:6px;${cache ? "opacity:0" : ""}"><i id="${id}-rail" style="width:${Math.round(progression(r, now) * 100)}%"></i></div>`;

function enRouteHTML(r, id, now, taille = 40) {
  return `<div class="rangee" style="gap:12px">
      <span class="pastille" style="--c:var(--equipe);width:${taille}px;height:${taille}px;border-radius:${taille > 36 ? 11 : 9}px">${sf(r.icone)}</span>
      <div style="flex:1;min-width:0"><div class="libelle">En route vers ${esc(r.vers)}</div><div class="aide">${esc(r.moyen)}, depuis ${esc(r.de)}</div></div>
      <span class="chiffres" style="font-size:16px;color:var(--accent)" id="${id}-reste">${compteARebours(r.arrivee - now)}</span>
    </div>`;
}

function position(t, d, now) {
  const filet = `<div class="filet"></div>`;
  let h = "";
  const r = t.enRoute;
  if (r) {
    h += enRouteHTML(r, "route", now);
    h += now < r.depart ? attenteDepart(r, "route", now) : railTrajet(r, "route", now);
    // Lot E (InvitationDuTrajet) : l'ami invité pour ce départ, et « L'attendre » / « Partir sans lui ».
    h += invitationDuTrajet(r.depart, now);
    h += `<p class="aide">Le trajet est un bon moment pour une session de focus.</p>`;
  } else if (t.ici) {
    h += `<div class="rangee" style="gap:12px">${piece()}<div><div class="libelle">Tu es à ${esc(t.ici.nom)}</div>
      <div class="aide">${t.ici.residence ? "C'est ta ville." : `Tu habites à ${esc(t.residence)}.`}</div></div></div>
      <p class="aide">Touche une ville sur la carte pour y aller, ou ouvre sa fiche dans Villes.</p>`;
  }
  if (t.logementLoue && t.loyerLogement != null) {
    h += `${filet}<div class="rangee" style="gap:12px"><div style="flex:1"><div style="font-size:14px;font-weight:600">Ton logement : ${esc(t.logementLoue)}</div>
      <div class="aide">${montant(t.loyerLogement)} de loyer, chaque dimanche. Louer ailleurs, c'est déménager.</div></div>${petit("Rendre", "rendreLogement")}</div>`;
  } else if (t.habite) {
    h += `${filet}<p class="aide">Tu habites ${esc(t.habite)}${t.chargesLogement != null ? ` : pas de loyer, ${montant(t.chargesLogement)} de charges par semaine.` : "."}</p>`;
  } else if (t.aLaRue) {
    // RNT-190 : à la rue, le dire, et la solution.
    h += `${filet}<p class="alerte" id="monde-rue" style="font-size:14px;font-weight:600;margin:0">Tu es à la rue : loue un logement à l'agence immobilière, une chambre suffit.</p>`;
  }
  if (t.sejour && t.joursSejour != null) {
    h += `${filet}<div class="rangee or" style="gap:8px;font-size:14px;font-weight:600"><span style="width:18px;display:grid">${sf("sun.max.fill", 18)}</span>Séjour à ${esc(t.sejour)}, encore ${t.joursSejour} jour${t.joursSejour > 1 ? "s" : ""}</div>`;
  }
  if (t.peutDemenager && t.ici) h += `${filet}${demenager(t, d)}`;
  return carte(`<div class="pile">${h}</div>`, { pad: true });
}

/** RNT-135 : vivre dans ce pays, face au tien ; puis s'installer. */
function demenager(t, d) {
  const villes = d.cat.villes;
  const la = d.cat.pays.find((p) => p.code === villes.find((v) => v.id === t.ici.id)?.codePays);
  const residence = t.lieux.find((l) => l.residence);
  const chezToi = d.cat.pays.find((p) => p.code === villes.find((v) => v.id === residence?.id)?.codePays);
  const comparaison = (titre, a, b) => {
    const e = b > 0 ? a / b - 1 : 0;
    const pareil = Math.abs(e) < 0.01;
    return `<div style="flex:1;padding:10px;border-radius:12px;background:rgba(255,255,255,.04)"><div style="font-size:12px;color:var(--texte2)">${titre}</div>
      <div class="chiffres ${pareil ? "" : e < 0 ? "gain" : "perte"}" style="font-size:15px;letter-spacing:0">${pareil ? "pareil" : `${e > 0 ? "+" : "−"}${Math.round(Math.abs(e) * 100)} %`}</div></div>`;
  };
  const pays = la && chezToi && la.code !== chezToi.code
    ? `<div class="pile" style="gap:8px"><div style="font-size:13px;font-weight:600;color:var(--texte2)">Vivre ${esc(la.au)} (${NOMS_PALIERS_PAYS[Math.min(3, Math.max(0, (la.palier ?? 2) - 1))].toLowerCase()})</div>
        <div class="rangee">${comparaison("Impôts", la.impots ?? 1, chezToi.impots ?? 1)}${comparaison("Coût de la vie", la.coutVie ?? 1, chezToi.coutVie ?? 1)}</div></div>` : "";
  return `${pays}${bouton(`S'installer à ${esc(t.ici.nom)}`, "demenager")}<p class="aide">Ta banque, la bourse locale et ta ville d'attache changent avec toi.</p>`;
}

// MARK: Les deux pages sous la carte (RNT-198) : les lieux de la ville, puis les villes

function lignesPages(t) {
  const ici = t.endroits.find((e) => e.ici);
  const detail = t.enRouteLocal ? `En route vers ${esc(t.enRouteLocal.vers)}` : ici ? `Tu es à ${esc(ici.nom)}` : "Le centre, les agences, tes adresses";
  const lieux = t.ici ? `<button class="ligne" data-action="ouvrir" data-page="monde.lieux" id="ligne-lieux">
      <span class="pastille" style="--c:var(--or)">${sf("mappin.and.ellipse")}</span>
      <span style="flex:1;min-width:0"><div class="titre">Lieux de ${esc(t.ici.nom)}</div><div class="detail">${detail}</div></span>
      <span class="valeur">${t.endroits.length}</span><span class="chevron">${icones.chevron}</span></button>` : "";
  const villes = `<button class="ligne" data-action="ouvrir" data-page="monde.villes" id="ligne-villes">
      <span class="pastille" style="--c:#6FA8FF">${sf("globe.europe.africa.fill")}</span>
      <span style="flex:1;min-width:0"><div class="titre">Villes</div><div class="detail">Fiscalité, coût de la vie, voisines, chantiers, résidences</div></span>
      <span class="valeur">${t.lieux.length}</span><span class="chevron">${icones.chevron}</span></button>`;
  return carte(lieux + villes);
}

// MARK: Dans la ville (D82)

function dansLaVille(t, d, now) {
  const r = t.enRouteLocal;
  const ici = !r ? t.endroits.find((e) => e.ici) : null;
  let h = `<div class="rangee entre"><span class="libelle">Dans la ville</span>${t.endroitActuel && !r ? `<span class="aide" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.endroitActuel)}</span>` : ""}</div>`;
  // D99 : arrivé à l'adresse d'un bien à visiter.
  if (ici?.id.startsWith("a:")) h += bouton(`Visiter : ${esc(ici.nom)}`, "visiter", { donnees: { bien: ici.id.slice(2) } });
  if (ici) h += guichet(ici.id, d, now);
  if (r) {
    h += enRouteHTML(r, "route-local", now, 36);
    if (now < r.depart) h += attenteDepart(r, "route-local", now);
    h += railTrajet(r, "route-local", now, now < r.depart);
  }
  return carte(`<div class="pile">${h}</div>`, { pad: true });
}

/** RNT-198 : « Dans la ville » ne paraît que s'il y a quelque chose à y faire (un trajet, une visite, un guichet). */
function dansLaVilleUtile(t) {
  if (t.enRouteLocal) return true;
  const ici = t.endroits.find((e) => e.ici)?.id;
  return !!ici && (["u:banque", "u:agence", "domicile"].includes(ici) || ici.startsWith("s:") || ici.startsWith("a:"));
}

/** Retour du 13/10 : l'agence bancaire lève les gels ; l'agence immobilière renvoie aux biens. */
function guichet(lieu, d, now) {
  const section = (titre, lignes, pied) => `<div><div class="section" style="margin-top:4px">${titre}</div>${carte(lignes)}<p class="aide" style="margin:8px 4px 0">${pied}</p></div>`;
  if (lieu === "u:banque") {
    const b = d.banque;
    const gelees = [];
    if (b?.gelJusqua > now) gelees.push({ cle: -1, nom: "Carte principale", detail: `Gelée jusqu'à ${heure(b.gelJusqua)}`,
      frais: Math.min(50_000, Math.max(2_000, Math.ceil((b.gelJusqua - now) / 60_000) * 100)) });
    for (const c of b?.cartes ?? []) {
      if (c.ref?.compte && String(c.detail).startsWith("Gelée")) gelees.push({ cle: c.ref.compte._0, nom: c.nom, detail: c.detail, frais: null });
    }
    const lignes = gelees.map((g) => ligne({ titre: `Dégeler : ${esc(g.nom)}`, detail: esc(g.detail), valeur: g.frais != null ? montant(g.frais) : "",
      icone: sf("snowflake"), teinte: "var(--argent)", action: "degeler", donnees: { carte: String(g.cle) } })).join("");
    return section("À l'agence bancaire", lignes
      + ligne({ titre: "Ouvrir un compte", detail: "Dans l'onglet Banque, ouvert ici", icone: "banque", teinte: "var(--argent)", action: "versBanque" })
      + ligne({ titre: "Demander un prêt", detail: "Dans l'onglet Banque, signé ici", icone: "banque", teinte: "var(--argent)", action: "versBanque" }),
      "Un compte s'ouvre ici, un prêt personnel s'y signe. Un gel se lève au guichet : 1 € par minute restante.") + guichetCoffre(d.pf, { agence: true });
  }
  // RNT-177 : une adresse de sortie, ou chez soi (manger, le coffre).
  if (lieu.startsWith("s:")) return guichetRepas(lieu, d.manger);
  if (lieu === "domicile") return guichetRepas(lieu, d.manger) + guichetCoffre(d.pf);
  if (lieu === "u:agence") {
    // RNT-198 : le bail d'un logement se signe ici aussi.
    return section("À l'agence immobilière", ligne({ titre: "Voir les biens à vendre", detail: "Dans Actifs, Immobilier", icone: sf("house.and.flag.fill"), teinte: "var(--grandir)", action: "versActifs" })
      + ligne({ titre: "Louer un logement", detail: "Les résidences à louer de la ville", icone: sf("key.fill"), teinte: "#F2A65A", page: "monde.residences", p: { id: d.t.ici?.id ?? "" } }),
      "Un bien se signe à l'agence de sa ville, un bail aussi.");
  }
  return "";
}

// MARK: Sur place

function surPlace(t) {
  // RNT-198 : louer se fait dans la page des résidences (à l'agence) ; ici, le séjour et le local.
  const liste = t.surPlace.filter((b) => b.sejour || b.local).slice(0, 12).map((b) => carte(`<div class="rangee" style="align-items:flex-start;gap:12px">
      <span style="width:84px;height:64px;flex:none;border-radius:12px;display:grid;place-items:center;color:rgba(255,255,255,.85);background:linear-gradient(160deg,#2a2c33,#16171b);border:1px solid var(--filet)">${sf(b.icone, 28)}</span>
      <div style="flex:1;min-width:0" class="pile">
        <div style="font-size:15px;font-weight:600">${esc(b.nom)}</div>
        <div class="choix" style="gap:8px">
          ${b.sejour ? petit(`Une semaine, ${montant(b.prixSejour)}`, "sejourner", { plein: true, donnees: { bien: b.id } }) : ""}
        </div>
        ${b.local ? `<p class="aide">Une de tes boîtes peut s'y installer : depuis l'écran de la boîte, section Local.</p>` : ""}
      </div></div>`, { attrs: 'style="padding:12px"' })).join("");
  return `<div class="pile"><div class="libelle" style="margin:8px 4px 0">Sur place, à ${esc(t.ici.nom)}</div>
    <p class="aide" style="margin:0 4px">Ici, tu négocies en face : ${pct(t.remiseSurPlace)} de remise possible en plus, un vendeur plus patient.</p>${liste}</div>`;
}

// MARK: Les billets (FicheMoyen), en carrousel

function billet(dv, choisi, local = false) {
  const possible = !dv.refus;
  const c = teinteMoyen(dv.moyen, dv.vehicule);
  const prix = !possible ? "Indisponible" : dv.cout == null ? "Au compteur" : local ? (dv.cout === 0 ? "Gratuit" : montant(dv.cout, { centimes: true })) : montant(dv.cout);
  const trous = Array.from({ length: 9 }, () => `<i style="width:5px;height:5px;border-radius:50%;background:rgba(0,0,0,.35)"></i>`).join("");
  return `<button data-action="choisirMoyen" data-id="${esc(dv.id)}" aria-pressed="${choisi}" class="billet"
    style="position:relative;flex:none;width:min(300px,78vw);height:186px;scroll-snap-align:center;border-radius:22px;overflow:hidden;text-align:left;
      background:linear-gradient(135deg,color-mix(in srgb,${c} ${possible ? 90 : 35}%,transparent),#16171B);
      outline:${choisi ? "2px solid rgba(255,255,255,.85)" : "1px solid rgba(255,255,255,.08)"};outline-offset:${choisi ? 2 : -1}px;transform:scale(${choisi ? 1 : 0.94});opacity:${choisi ? 1 : 0.7};transition:transform .3s var(--courbe-graphite),opacity .3s">
    <span style="position:absolute;right:74px;top:18px;bottom:18px;display:flex;flex-direction:column;justify-content:space-between">${trous}</span>
    <span style="position:absolute;right:-18px;bottom:-26px;color:rgba(255,255,255,.08)">${sf(dv.icone, 120)}</span>
    <span style="position:absolute;inset:16px;display:flex;flex-direction:column;color:#fff">
      <span class="rangee entre" style="align-items:flex-start"><span style="width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:rgba(255,255,255,.14)">${sf(dv.icone, 24)}</span>
        <span class="chiffres" style="font-size:${possible ? 20 : 13}px;letter-spacing:-.02em">${prix}</span></span>
      <span style="flex:1"></span>
      <span style="font-size:21px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(dv.nom)}</span>
      <span style="font-size:12px;font-weight:500;color:rgba(255,255,255,.75);margin-top:3px;min-height:16px">${esc(dv.refus ?? dv.note ?? "")}</span>
      <span class="rangee entre" style="margin-top:6px"><span><span style="display:block;font-size:10px;font-weight:600;color:rgba(255,255,255,.6)">Durée</span><span class="chiffres" style="font-size:14px;letter-spacing:0">${dv.minutes == null ? "Au départ" : duree(dv.minutes)}</span></span>
        <span style="text-align:right"><span style="display:block;font-size:10px;font-weight:600;color:rgba(255,255,255,.6)">Distance</span><span class="chiffres" style="font-size:14px;letter-spacing:0">${local ? `${nombre(dv.km, 1)} km` : `${nombre(Math.round(dv.km))} km`}</span></span></span>
    </span></button>`;
}

const carrousel = (devis, choisi, local) =>
  `<div style="display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin:0 -20px;padding:6px max(20px,calc(50% - 150px))">${devis.map((dv) => billet(dv, dv.id === choisi?.id, local)).join("")}</div>`;

const trierDevis = (l) => l.sort((a, b) => (!!a.refus - !!b.refus) || ((a.minutes ?? 0) - (b.minutes ?? 0)));

/** Les véhicules du garage, avec leur catégorie (par le nom du modèle) et l'endroit où ils sont garés ici. */
function vehiculesDuGarage(d) {
  const garesIci = new Set(d.t.endroits.find((e) => e.ici)?.vehicules ?? []);
  const dansLaVille = new Set(d.t.endroits.flatMap((e) => e.vehicules));
  return (d.garage?.vehicules ?? []).map((v) => ({
    ...v,
    categorie: d.cat.modeles.find((m) => m.nom === v.nom)?.categorie,
    ici: garesIci.has(v.nom),
    enVille: dansLaVille.has(v.nom),
    garage: d.t.endroits.find((e) => e.vehicules.includes(v.nom))?.nom,
  }));
}

/**
 * RNT-168 : les devis du moteur lui-même (ses règles, l'aéroport, l'heure du prochain départ,
 * le prix et la durée en ville), lus juste avant d'ouvrir la feuille. Les copies en JS
 * plus bas ne servent plus que si le moteur ne répond pas.
 */
const devisMoteur = { vers: {}, local: {} };

async function chargerDevis(ctx, sorte, id) {
  try { devisMoteur[sorte][id] = await ctx.tableau(sorte === "vers" ? "devis" : "devisLocal", { vers: id }); }
  catch { devisMoteur[sorte][id] = null; }
}

const heureDepart = (ms) => new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });

function depuisMoteur(liste, local) {
  return liste.map((x) => ({
    ...x,
    note: x.refus ? "" : x.note || (x.prochainDepart ? `Départ à ${heureDepart(x.prochainDepart)}` : local ? (x.effort ? "L'effort se paie en plaisir." : "") : "Tu pars quand tu veux"),
  }));
}

const rad = Math.PI / 180;
const vol = (a, b) => {
  const h = Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** RNT-210 : ReglesTrajets.route(de:vers:) : la route ne traverse pas la mer, elle passe par Suez ou le tunnel. */
function routeEntre(rt, a, b) {
  if (a.masse == null || b.masse == null) return null;
  if (a.masse === b.masse) return { km: vol([a.lat, a.lon], [b.lat, b.lon]) * rt.detourRoute, passages: 0 };
  const ps = rt.passages ?? [];
  const pts = [[a.lat, a.lon], ...ps.map((p) => [p.lat, p.lon]), [b.lat, b.lon]];
  const masses = [[a.masse], ...ps.map((p) => p.entre), [b.masse]];
  const n = pts.length, dist = Array(n).fill(Infinity), sauts = Array(n).fill(0), vu = Array(n).fill(false);
  dist[0] = 0;
  for (;;) {
    let i = -1;
    for (let k = 0; k < n; k++) if (!vu[k] && dist[k] < Infinity && (i < 0 || dist[k] < dist[i])) i = k;
    if (i < 0) break;
    vu[i] = true;
    for (let j = 0; j < n; j++) {
      if (vu[j] || !masses[i].some((x) => masses[j].includes(x))) continue;
      const v = dist[i] + vol(pts[i], pts[j]);
      if (v < dist[j]) { dist[j] = v; sauts[j] = sauts[i] + 1; }
    }
  }
  return dist[n - 1] < Infinity ? { km: dist[n - 1] * rt.detourRoute, passages: sauts[n - 1] - 1 } : null;
}

/**
 * Les devis entre deux villes : la règle de MoteurEconomie.devis(vers:) sur le catalogue
 * (le pont web n'expose pas encore les devis). Le moteur refuse de toute façon ce qui ne va pas.
 */
function devisVers(d, lieu) {
  const m = devisMoteur.vers[lieu.id];
  if (Array.isArray(m)) return trierDevis(depuisMoteur(m, false));
  const rt = d.cat.trajets;
  const depuis = d.cat.villes.find((v) => v.id === d.t.ici?.id);
  const arrivee = d.cat.villes.find((v) => v.id === lieu.id);
  if (!rt || !depuis || !arrivee) return [];
  const chemin = routeEntre(rt, depuis, arrivee);
  const sortie = [];
  for (const m of rt.moyens) {
    const km = m.route ? (chemin?.km ?? lieu.km * rt.detourRoute) : lieu.km;
    let refus = null;
    if (m.route && !chemin) refus = "Pas de route jusque-là : la mer est entre les deux.";
    else if (km > m.porteeMaxKm) refus = chemin?.passages && lieu.km * rt.detourRoute <= m.porteeMaxKm ? "Trop loin par la route : il faut contourner la mer." : "Trop loin.";
    else if (m.porteeMinKm != null && km < m.porteeMinKm) refus = "Trop près pour ça.";
    const minutes = Math.max(1, Math.round(((km / m.vitesseKmh + (m.attenteHeures ?? 0)) * 60) / rt.echelleTemps));
    const cout = m.coutFixeCentimes + Math.round(km * m.coutParKmCentimes);
    const note = m.source === "public" ? "Au prochain départ" : "Tu pars quand tu veux";
    if (m.source === "vehicule") {
      for (const v of vehiculesDuGarage(d).filter((v) => (m.categories ?? []).includes(v.categorie))) {
        let r = refus;
        if (!r && !v.enVille) r = "Il est garé dans une autre ville.";
        if (!r && !v.ici) r = `Il est garé ${v.garage ? `à ${v.garage}` : "ailleurs en ville"}.`;
        if (!r && !v.conduisible) r = "Il te faut le permis.";
        if (!r && v.etat < 0.2) r = "Trop abîmé, fais-le réparer.";
        sortie.push({ id: `${m.id}:${v.id}`, moyen: m.id, nom: v.nom, icone: m.icone, vehicule: v.id, km, cout, minutes, refus: r, note });
      }
    } else sortie.push({ id: m.id, moyen: m.id, nom: m.nom, icone: m.icone, vehicule: null, km, cout, minutes, refus, note });
  }
  return trierDevis(sortie);
}

/** Les moyens dans la ville : prix et durée ne sont connus du moteur qu'au départ (pointe, métro, options). */
function devisLocaux(d, endroit) {
  const m = devisMoteur.local[endroit.id];
  if (Array.isArray(m)) return depuisMoteur(m, true).sort((a, b) => !!a.refus - !!b.refus);
  const rl = d.cat.trajets?.local;
  if (!rl) return [];
  const r = d.t.enRouteLocal;
  const ville = d.t.ici?.id;
  const km = endroit.km;
  const sortie = [];
  for (const m of rl.moyens) {
    const trop = km > m.porteeMaxKm ? "Trop loin." : null;
    const note = m.effort ? "L'effort se paie en plaisir." : "";
    if (m.source === "vehicule") {
      if (r) continue; // en route, on ne reprend pas un véhicule garé ailleurs
      for (const v of vehiculesDuGarage(d).filter((v) => v.enVille && (m.categories ?? []).includes(v.categorie))) {
        let x = trop;
        if (!x && !v.ici) x = `Garé ${v.garage ? `à ${v.garage}` : "ailleurs"}.`;
        if (!x && !v.conduisible) x = "Il te faut le permis.";
        if (!x && v.etat < 0.2) x = "Trop abîmé.";
        sortie.push({ id: `${m.id}:${v.id}`, moyen: m.id, nom: v.nom, icone: m.icone, vehicule: v.id, km, cout: null, minutes: null, refus: x, note });
      }
    } else {
      const x = trop ?? (m.source === "partage" && (rl.villesSansTrottinettes ?? []).includes(ville) ? "Pas de trottinettes partagées ici." : null);
      const meme = r && r.moyen === m.nom;
      sortie.push({ id: m.id, moyen: m.id, nom: m.nom, icone: m.icone, vehicule: null, km, cout: m.source === "pied" ? 0 : null,
        minutes: null, refus: x, note: meme ? "Le même moyen, sans repayer la prise en charge" : note });
    }
  }
  return sortie.sort((a, b) => !!a.refus - !!b.refus);
}

// MARK: « Avec qui ? » — le voyage à deux (FeuilleVoyage, FicheCompagnon)

/**
 * RNT-210 : en ligne, les joueurs de ma ville et la part de l'invité pour chaque billet, lus du moteur
 * (ReglesDuo, `enLigne.voyageADeux`) juste avant d'ouvrir la feuille ; null hors ligne.
 */
let duo = null;
async function chargerDuo(ctx, d, id) {
  duo = null;
  vue.passager = "seul";
  vue.frais = "partage";
  const lieu = d?.t?.lieux?.find((l) => l.id === id);
  if (!lieu || !L.monde.code) return;
  const devis = devisVers(d, lieu).map((x) => ({ id: x.id, moyen: x.moyen, cout: x.cout ?? 0, ...(x.vehicule != null ? { vehicule: x.vehicule } : {}) }));
  const r = await ctx.jouer("enLigne.voyageADeux", { devis, interactions: L.monde.interactions }, { silencieux: true }).catch(() => null);
  duo = r?.enLigne ? r : null;
}

const hexTeinte = (n) => `#${((Number(n) >>> 0) & 0xffffff).toString(16).padStart(6, "0")}`;

/** Une fiche du carrousel : seul, ou un joueur sur place (FicheCompagnon). */
function ficheCompagnon(p, choisi, gauche, droite, detail) {
  const crans = p ? `<span class="mo-crans" aria-label="Confiance ${p.confiance} sur 10">${Array.from({ length: 10 }, (_, k) => `<i class="${k < p.confiance ? "plein" : ""}"></i>`).join("")}<em>confiance ${p.confiance}/10</em></span>`
    : `<span class="mo-compagnon-detail">${esc(detail)}</span>`;
  const avatar = p ? `<span class="mo-compagnon-avatar">${esc(p.pseudo.slice(0, 1).toUpperCase())}</span>` : `<span class="mo-compagnon-avatar seul">${sf("person.fill", 22)}</span>`;
  return `<button class="mo-compagnon" data-action="choisirPassager" data-id="${esc(p?.id ?? "seul")}" aria-pressed="${choisi}"
    ${p ? `style="--c:${hexTeinte(p.teinte)}"` : ""} ${p?.raison ? "disabled" : ""}>
    <span class="rangee entre mo-compagnon-tete">${avatar}<span class="mo-compagnon-genre">${p ? "Duo" : "Solo"}</span></span>
    <span class="mo-compagnon-nom">${esc(p?.pseudo ?? "Seul")}</span>
    ${p?.raison ? `<span class="mo-compagnon-detail">${esc(p.raison)}</span>` : crans}
    <span class="rangee entre mo-compagnon-pied"><span><small>${gauche[0]}</small><b class="chiffres">${gauche[1]}</b></span>
      <span class="droite"><small>${droite[0]}</small><b class="chiffres">${droite[1]}</b></span></span></button>`;
}

/** La section « Avec qui ? » sous les billets ; rien hors ligne. */
function avecQui(choisi) {
  if (!duo) return "";
  if (!duo.voyages) return `<div class="libelle">Avec qui ?</div><p class="mo-duo-note alerte">${sf("nosign", 15)} Les voyages à deux sont coupés dans ce monde.</p>`;
  // Ceux qui peuvent venir d'abord ; un bot reste, grisé, avec sa raison.
  const presents = [...(duo.presents ?? [])].sort((a, b) => !!a.raison - !!b.raison);
  const compagnon = presents.find((p) => p.id === vue.passager && !p.raison);
  const parts = duo.parts?.[choisi?.id] ?? {};
  const fiches = [ficheCompagnon(null, !compagnon, ["Ton billet", montant(choisi?.cout ?? 0)], ["Plaisir", "—"],
    presents.length ? "Touche une fiche pour emmener quelqu'un" : "Aucun joueur sur place avec toi")]
    .concat(presents.map((p) => ficheCompagnon(p, p === compagnon, ["Sa part", montant(parts[vue.frais] ?? 0)], ["Plaisir", `+${duo.plaisir} chacun`])));
  return `<div class="libelle">Avec qui ?</div>
    <div class="mo-compagnons" id="voyage-avec-qui">${fiches.join("")}</div>
    ${compagnon ? `${pilules(duo.frais.map((f) => [f.id, f.nom]), vue.frais, "choisirFrais")}
      <p class="aide mo-duo-note">Il doit accepter avant le départ ; tu suis sa réponse sur la carte de ton trajet.</p>`
      : presents.length ? "" : `<p class="legende mo-duo-note">Pour partir à deux, l'autre joueur doit être dans ta ville.</p>`}`;
}

const compagnonChoisi = () => (duo?.voyages ? duo.presents?.find((p) => p.id === vue.passager && !p.raison) : null) ?? null;

// MARK: FeuilleVoyage — les devis pour aller dans une ville

function ouvrirVoyage(ctx, d, id, { fiche = true } = {}) {
  const lieu = d.t.lieux.find((l) => l.id === id);
  if (!lieu || lieu.ici) return;
  vue.moyen = null;
  let enCours = false;
  ctx.feuille({
    titre: d.t.enRoute?.versID === lieu.id ? lieu.nom : `Aller à ${lieu.nom}`,
    rendu: () => {
      const dd = donneesFeuille(ctx, d);
      const t = dd.t;
      const l = t.lieux.find((x) => x.id === id) ?? lieu;
      // RNT-198 : la fiche de la ville, depuis la ville touchée sur la carte.
      const versFiche = fiche ? `<button class="bouton secondaire" data-action="versFiche" id="voyage-fiche">${sf("info.circle", 18)} La fiche ${esc(de(l.nom))}</button>` : "";
      const tete = `<p class="aide mo-voyage-tete">${esc(l.pays)}${t.enRoute ? "" : `, ${nombre(Math.round(l.km))} km à vol d'oiseau`}</p>`;
      const palier = `<div class="rangee mo-voyage-palier"><i style="--c:${couleurPalier(l.palier)}"></i>${NOMS_PALIERS_VILLE[Math.min(3, Math.max(0, (l.palier ?? 1) - 1))]}${l.possessions ? `, ${l.possessions} possession${l.possessions > 1 ? "s" : ""}` : ""}</div>`;
      if (t.enRoute || !t.ici) {
        const r = t.enRoute;
        const ici = r?.versID === l.id;
        const min = r ? Math.max(0, Math.ceil((r.arrivee - ctx.maintenant()) / 60_000)) : 0;
        return `${tete}${palier}${carte(`<div class="pile mo-voyage-enroute">
          <span class="or">${sf(ici ? "mappin" : "airplane", 44)}</span>
          <div class="mo-voyage-arrivee">${ici ? `Tu y arrives dans ${min} min.` : `Tu es en route pour ${esc(r?.vers ?? "")}, arrivée dans ${min} min.`}</div>
          ${ici ? "" : `<p class="aide">Un voyage entre deux villes ne change pas de cap : repars d'ici une fois arrivé.</p>`}</div>`, { pad: true })}${versFiche}`;
      }
      const devis = devisVers(dd, l);
      const choisi = devis.find((x) => x.id === vue.moyen) ?? devis[0];
      const compagnon = compagnonChoisi();
      return `${tete}${palier}
        <div class="libelle">Comment ?</div>
        ${devis.length ? carrousel(devis, choisi, false) : `<p class="legende">Aucun moyen d'y aller d'ici pour l'instant.</p>`}
        <p class="legende mo-voyage-legende">${devis.length > 1 ? "Touche un billet pour le choisir" : " "}</p>
        ${avecQui(choisi)}
        ${bouton(enCours ? "…" : compagnon ? `Partir avec ${esc(compagnon.pseudo)}` : "Partir", "partir", { genre: "teinte", teinte: "var(--equipe)", desactive: enCours || !choisi || !!choisi.refus })}
        ${versFiche}`;
    },
    actions: {
      choisirMoyen(ctx2, el) { vue.moyen = el.dataset.id; rafraichirFeuille(ctx); },
      // RNT-210 : « Avec qui ? », et qui paie quoi.
      choisirPassager(ctx2, el) { vue.passager = el.dataset.id; rafraichirFeuille(ctx); },
      choisirFrais(ctx2, el) { vue.frais = el.dataset.valeur; rafraichirFeuille(ctx); },
      versFiche() { ctx.fermerFeuille(); return ctx.ouvrir("monde.ville", { id }); },
      async partir(ctx2) {
        const dd = donneesFeuille(ctx, d);
        const l = dd.t.lieux.find((x) => x.id === id) ?? lieu;
        const devis = devisVers(dd, l);
        const choisi = devis.find((x) => x.id === vue.moyen) ?? devis[0];
        if (!choisi || choisi.refus || enCours) return;
        enCours = true;
        // RNT-188 : ton yacht et la voiture dans sa cale partent par « traverser ».
        const op = choisi.embarque != null ? { traverser: { vers: l.id, moyen: choisi.moyen, vehicule: choisi.vehicule, embarque: choisi.embarque } }
          : { voyager: { vers: l.id, moyen: choisi.moyen, ...(choisi.vehicule != null ? { vehicule: choisi.vehicule } : {}) } };
        const compagnon = compagnonChoisi();
        const parti = await faire(ctx, dd, op, `En route pour ${l.nom}`);
        enCours = false;
        // Part, puis invite le joueur choisi (FeuilleVoyage.partir) ; s'il ne peut pas venir, on le dit.
        if (parti && compagnon) {
          const r = await L.inviterEnVoyage(ctx, compagnon.id, vue.frais);
          if (r) return ctx.toast(`Tu es parti seul : ${r}`, "refus");
          ctx.fermerFeuille();
          ctx.toast(`Invitation envoyée à ${compagnon.pseudo}`, "gain");
          ctx.rafraichir();
        }
      },
    },
  });
}

/** Redessine la feuille ouverte sans relire le moteur (un choix de billet). */
function rafraichirFeuille(ctx) {
  const d = document.getElementById("feuille");
  const corps = d?.querySelector(".corps-feuille");
  const f = ctx.etat.feuille;
  if (!corps || !f?.rendu) return;
  const x = corps.querySelector('[style*="scroll-snap-type"]')?.scrollLeft ?? 0;
  const xDuo = corps.querySelector(".mo-compagnons")?.scrollLeft ?? 0;
  corps.innerHTML = f.rendu();
  const duoEl = corps.querySelector(".mo-compagnons");
  if (duoEl) {
    duoEl.scrollLeft = xDuo;
    const f = duoEl.querySelector('[aria-pressed="true"]');
    if (f) duoEl.scrollTo({ left: f.offsetLeft - (duoEl.clientWidth - f.offsetWidth) / 2, behavior: "smooth" });
  }
  const c = corps.querySelector('[style*="scroll-snap-type"]');
  if (c) { c.style.scrollSnapType = "none"; c.scrollLeft = x; c.querySelector('[aria-pressed="true"]')?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); setTimeout(() => { c.style.scrollSnapType = "x mandatory"; }, 400); }
}

// MARK: FeuilleDeplacement — aller ailleurs dans la ville

function ouvrirDeplacement(ctx, d, id) {
  const endroit = d.t.endroits.find((e) => e.id === id);
  if (!endroit || endroit.ici) return;
  vue.moyenLocal = null;
  let enCours = false;
  const enVehicule = () => {
    const r = donneesFeuille(ctx, d)?.t?.enRouteLocal;
    const m = r && d.cat.trajets?.local?.moyens.find((x) => x.nom === r.moyen);
    return r && (!m || m.source === "vehicule");
  };
  ctx.feuille({
    titre: `Aller à ${endroit.nom}`,
    rendu: () => {
      const dd = donneesFeuille(ctx, d);
      const e = dd.t.endroits.find((x) => x.id === id) ?? endroit;
      const enRoute = !!dd.t.enRouteLocal;
      const aide = `<p class="aide" style="text-align:center;margin-top:-8px">${enRoute
        ? "Tu es en route : le trajet repart de là où tu es. Le même moyen ne repaie pas sa prise en charge."
        : `${nombre(e.km, 1)} km par la route.`}</p>`;
      if (enRoute && enVehicule()) {
        // Au volant, on change de cap avec le même véhicule (D98).
        return `${aide}${carte(`<div class="rangee" style="gap:12px"><span class="pastille" style="--c:var(--equipe)">${sf(dd.t.enRouteLocal.icone)}</span>
          <div><div class="libelle">${esc(dd.t.enRouteLocal.moyen)}</div><div class="aide">Tu continues avec, vers ${esc(e.nom)}.</div></div></div>`, { pad: true })}
          ${bouton(enCours ? "…" : "Y aller", "yAller", { genre: "teinte", teinte: "var(--equipe)", desactive: enCours })}`;
      }
      const devis = devisLocaux(dd, e);
      const choisi = devis.find((x) => x.id === vue.moyenLocal) ?? devis[0];
      return `${aide}${carrousel(devis, choisi, true)}
        <p class="legende mo-voyage-legende">${devis.length > 1 ? "Touche un billet pour changer" : " "}</p>
        ${devis.some((x) => x.cout == null) ? `<p class="aide" style="text-align:center;margin-top:-6px">Le prix et la durée se calculent au départ (heure de pointe, métro, options du véhicule).</p>` : ""}
        ${bouton(enCours ? "…" : "Y aller", "yAller", { genre: "teinte", teinte: "var(--equipe)", desactive: enCours || !choisi || !!choisi.refus })}`;
    },
    actions: {
      choisirMoyen(ctx2, el) { vue.moyenLocal = el.dataset.id; rafraichirFeuille(ctx); },
      async yAller() {
        if (enCours) return;
        const dd = donneesFeuille(ctx, d);
        const e = dd.t.endroits.find((x) => x.id === id) ?? endroit;
        const enRoute = !!dd.t.enRouteLocal;
        let op;
        if (enRoute && enVehicule()) op = { changerDestination: { lieu: e.id } };
        else {
          const devis = devisLocaux(dd, e);
          const c = devis.find((x) => x.id === vue.moyenLocal) ?? devis[0];
          if (!c || c.refus) return;
          const corps = { lieu: e.id, moyen: c.moyen, ...(c.vehicule != null ? { vehicule: c.vehicule } : {}) };
          op = enRoute ? { changerTrajet: corps } : { allerA: corps };
        }
        enCours = true;
        await faire(ctx, dd, op, (t) => {
          const r = t?.enRouteLocal;
          return r ? `En route vers ${e.nom}, ${Math.max(1, Math.round((r.arrivee - r.depart) / 60_000))} min` : `En route vers ${e.nom}`;
        });
        enCours = false;
      },
    },
  });
}

// Les terres émergées (Natural Earth 110 m via world-atlas, domaine public), au demi-degré près.
const TERRES = "143,-12 143.5,-13 143.5,-14 144.5,-14.5 145,-15 145.5,-15.5 145.5,-16.5 146,-17 146,-18 146.5,-19 147,-19.5 148,-20 149,-20.5 149,-21 149.5,-22 150,-22.5 151,-23 151,-23.5 152,-24 152.5,-24.5 153,-25.5 153,-26.5 153,-27 153.5,-28 153.5,-28.5 153.5,-29.5 153,-30.5 153,-32 152,-32.5 151.5,-33 151,-34 151,-35 150.5,-35.5 150,-36.5 150,-37 149.5,-38 148.5,-38 147.5,-38 147,-38.5 146,-39 145.5,-38.5 145,-38.5 144,-38.5 143,-38.5 142,-38.5 141,-38 140,-37.5 139.5,-37 139.5,-36.5 139,-36 138.5,-35.5 138.5,-34.5 137.5,-35 137,-35.5 137.5,-34.5 137.5,-34 138,-33 137,-33.5 136,-34.5 135.5,-35 135.5,-34 135,-33.5 134.5,-33 134,-32.5 133,-32 132.5,-32 131.5,-31.5 130,-31.5 129,-31.5 128.5,-32 127.5,-32 127,-32.5 126,-32.5 125.5,-32.5 124.5,-33 123.5,-34 123,-34 121.5,-34 121,-34 120,-34 119,-34.5 118,-35 117,-35 116,-35 115.5,-34.5 115.5,-33.5 115.5,-32.5 115.5,-32 115.5,-31 115,-30 115,-29 114.5,-28.5 114,-27.5 113.5,-27 113.5,-26 114,-26.5 114,-25.5 113.5,-24.5 113.5,-24 114,-23 114,-22 115,-21.5 116,-21 116.5,-20.5 117.5,-20.5 118,-20.5 119,-20.5 119.5,-20 121,-19.5 121.5,-19 122.5,-18 122,-17.5 123,-16.5 123.5,-17.5 123.5,-16.5 124.5,-16.5 124.5,-15.5 125,-15 125.5,-14.5 126.5,-14 127,-14 128,-14.5 128,-15 129,-15 130,-15 129.5,-14 130,-13 131,-12.5 131.5,-12.5 132.5,-12 132.5,-11.5 133,-11.5 134,-12 135,-12 136,-12 136.5,-12 136.5,-13 136,-13.5 135.5,-14.5 136,-15.5 137,-16 137.5,-16 138,-16.5 139,-17 140,-17.5 141,-17.5 141,-16.5 141.5,-16 141.5,-15 141.5,-14.5 141.5,-13.5 141.5,-12.5 142,-11.5 142,-11 143,-11.5|178.5,-17.5 178.5,-18 177.5,-18 178,-17.5|164,-20 165,-20.5 166,-21.5 166.5,-22 167,-22.5 166.5,-22 165.5,-21.5 165,-21.5 164.5,-20.5|127.5,1 128,1.5 128.5,0.5 128,0 128.5,-0.5 127.5,0 127.5,0.5 127.5,1.5 128,2 128,1|-25.5,71 -26,70.5 -27,70.5 -28,70.5 -27.5,71 -26.5,71 -26,71|117.5,8.5 117.5,9 118.5,9.5 119,10.5 119.5,11.5 119.5,10.5 119,10 118.5,9.5 118,8.5|122.5,11.5 123,11.5 122.5,10.5 122,11.5|123,9 122.5,10 123,10.5 123.5,11 123.5,10 123,9|125,12.5 125.5,12 125.5,11 125,11.5 124.5,12.5 125,12.5|138.5,-8.5 137.5,-8.5 138,-7.5 139,-7.5 138.5,-8.5|130,-3 130.5,-3 131,-4 130,-3.5 129.5,-3.5 128.5,-3.5 128,-3 129,-3|123,-8.5 122,-8.5 121.5,-9 120.5,-9 121,-8.5 121.5,-8.5 122.5,-8.5 123,-8|118,-8.5 119,-8.5 118.5,-9 117.5,-9 117,-9 117.5,-8.5 118,-8.5|21.5,78.5 22.5,78 23,78 24,78 25,78 24,77.5 23,77.5 22.5,77.5 21,77.5 21.5,78 21,78 21.5,78.5|62,81 61.5,80.5 60.5,80.5 59.5,80.5 60,81 61.5,81 62,81|50.5,81 51.5,80.5 50.5,80.5 49,80.5 48,80 47.5,80 46.5,80.5 47.5,80.5 48,80.5 49,80.5 50,81|50.5,69 49.5,69 48.5,68.5 48.5,69.5 49,69.5 50,69.5|34.5,35.5 34,35 33.5,35 32.5,34.5 33,35.5 34,35.5|12.5,56 12,55 11,55.5 12,55.5 12.5,56|-180,71.5 -179.5,71.5 -178.5,71.5 -177.5,71 -178.5,71 -179,71 -180,71 180,71 179,71 180,71.5 -180,71.5|-74,-43.5 -74,-42.5 -74,-42 -73.5,-42.5 -73.5,-43|-62,49 -62.5,49 -63.5,49.5 -64.5,50 -63.5,50 -62,49.5|-61,46 -60.5,46.5 -61,45.5 -61.5,46 -61,46.5 -60.5,46.5 -60.5,46|-171.5,63.5 -170.5,63.5 -170,63.5 -169.5,63.5 -170,63 -171,63.5 -171.5,63.5|-77.5,18.5 -76.5,18 -77,18 -78,18|-153,58 -152,57.5 -153,57.5 -153.5,57 -154.5,57 -153.5,57.5 -153,58|-133.5,56.5 -133,56 -132.5,55.5 -133,55.5 -133.5,56|-132.5,54 -132,54 -132,53.5 -132.5,53.5 -133,54|152,-4.5 152.5,-5 151.5,-5.5 151,-6 150,-6.5 149,-6 148.5,-5.5 149.5,-5.5 150,-5 150.5,-5.5 151.5,-5 151.5,-4.5|127.5,-8.5 126.5,-9 126,-9 125,-9.5 124.5,-10 123.5,-10.5 124,-9.5 124.5,-9 125,-8.5 126,-8.5 126.5,-8.5 127,-8.5|145,-41 145.5,-41 146.5,-41 147.5,-41 148.5,-41 148.5,-42 148,-42.5 147.5,-43 147,-43.5 146,-43.5 145.5,-42.5 145,-42 144.5,-41|96.5,81 97.5,81 96,80 95,80 94.5,80 93,80 92,80 91.5,80.5 92,80.5 93,80.5 94,81 95,81 96,81.5 96.5,81|97.5,80 98.5,80 99.5,80 100,80 99,79.5 98.5,79 97.5,79 97,79 96,79 95,79 94,79.5 93.5,79.5 94.5,80 95.5,80 96,80 97,80|103,79.5 104,79 105,79 104.5,78.5 103.5,78.5 103,78.5 102,78 101,78 100.5,78 99.5,78 100.5,78.5 101,79 102,79.5 103,79.5|140,76 141,75.5 141.5,76 142.5,76 143.5,76 145.5,75.5 144.5,75 143.5,75 143,75.5 142,75.5 142.5,75 141.5,75 140.5,75 140,75 139,74.5 138,75 137,75 137.5,76 138.5,76 139.5,76|142,74 143.5,73.5 142.5,73.5 141.5,73.5 141,73.5 140,73.5 141,74 141.5,74|147,75.5 148.5,75.5 149.5,75 150.5,75 149,75 148.5,75 147.5,75 147,75 146,75 147,75.5|173.5,-35 174,-35 174.5,-36 175,-36.5 175.5,-37 176.5,-38 177.5,-38 178.5,-37.5 178.5,-38.5 177.5,-39 177,-39.5 177,-40 176.5,-41 175.5,-41.5 175,-41.5 175,-40.5 174.5,-40 174,-39.5 174.5,-39 174.5,-38 175,-37.5 174.5,-36.5 174,-36 173.5,-35.5 173,-34.5|173,-41.5 174,-41 174,-41.5 173.5,-42.5 173,-43 173,-44 172,-44 171,-44.5 171,-45 170.5,-46 169.5,-46.5 168.5,-46.5 167.5,-46 166.5,-46 166.5,-45.5 167.5,-45 168,-44.5 168.5,-44 169.5,-43.5 170.5,-43 171,-42.5 171.5,-42 172,-41 172.5,-40.5 173,-41.5|126,9.5 126.5,8.5 126.5,7.5 126,6.5 125.5,7 125.5,6 125,6 124,6 124,7 124,7.5 123.5,7.5 122.5,8 122,7 122,7.5 123,8 123.5,8.5 124.5,8.5 125.5,9 125.5,9.5|121,18.5 122,18.5 122,17.5 122,16.5 121.5,15.5 121.5,15 122,14 122.5,14.5 123.5,14 124,13.5 124,12.5 123.5,13 123,13.5 122,14 121,13.5 120.5,14 120,15 120,16 120.5,16.5 120.5,17.5 120.5,18|133.5,-0.5 134,-1.5 134,-2 134.5,-2.5 135.5,-3.5 136,-2.5 136.5,-2 137,-2 138,-1.5 138.5,-2 139.5,-2 140,-2.5 141,-2.5 142,-3 143,-3.5 143.5,-3.5 144.5,-4 145,-4.5 146,-5 146,-5.5 147,-6 147.5,-6 147,-7 147.5,-7.5 148,-8 148.5,-8.5 149,-9.5 150,-10 150.5,-10 150,-10.5 149,-10.5 148,-10 147,-9.5 146.5,-8.5 146,-8 145.5,-8 144.5,-7.5 143.5,-7.5 143.5,-8.5 142.5,-8.5 143.5,-9 142.5,-9.5 141.5,-9 141,-9 140,-8.5 139.5,-8 139,-7.5 138.5,-7 138.5,-6 137.5,-5 136.5,-5 135.5,-4.5 135,-4 134,-4 133.5,-3.5 133,-4 133,-3.5 132.5,-3 133,-2.5 133.5,-2.5 133,-2.5 132.5,-2 131.5,-1.5 132,-0.5 133,-0.5|125,1 124.5,0.5 123.5,0.5 122.5,0.5 121.5,0.5 120.5,0.5 120,0 120,-1 120.5,-1.5 121.5,-1 122.5,-1 123,-0.5 122.5,-1 122,-1.5 122,-2.5 122.5,-3 122.5,-4 122,-4.5 121.5,-4 121,-3 120.5,-2.5 120.5,-3.5 120.5,-4.5 120.5,-5 120,-5.5 119.5,-5 119.5,-4 119,-3.5 119,-3 119,-2 119.5,-1 119.5,0 120,1 121,1.5 122,1 123,1 124,1 124.5,1 125,1.5|107.5,-6 108.5,-6.5 109,-7 110,-7 110.5,-7 111,-6.5 112,-7 113,-7.5 113.5,-7.5 114.5,-8 114.5,-8.5 113.5,-8.5 112.5,-8.5 111.5,-8.5 110.5,-8 109.5,-7.5 108.5,-7.5 107.5,-7.5 106.5,-7.5 106,-7 106,-6 106.5,-6|96.5,5 97,5 98,5 98.5,4 99,3.5 99.5,3.5 100,2.5 100.5,2 101.5,2 102,1.5 102.5,1 103,0.5 103.5,0 103.5,-1 104.5,-1 104.5,-2 105.5,-2.5 106,-3 106,-4 106,-4.5 106,-5.5 105,-5.5 104,-5.5 103.5,-5 102.5,-4 102,-3.5 101,-2.5 101,-2 100.5,-1.5 100,-0.5 99.5,0 99,0.5 99,1.5 98,2 97.5,2.5 97,3.5 96.5,4 96,4.5 95.5,5 96,5.5|117,6.5 117.5,6.5 118,6 119,5.5 118,5 117.5,4 117,3.5 117.5,3 118,2.5 118.5,1.5 118,1 117.5,0 117.5,-1 116.5,-1.5 116.5,-2 116.5,-3 115.5,-4 114.5,-3.5 114,-3.5 113,-3 112.5,-3.5 111.5,-3 110.5,-3 110,-2 110,-1.5 109.5,-1 109.5,0 109,1 109.5,1.5 110,1.5 111,1.5 111.5,2 111.5,3 112.5,3 113.5,3.5 114,4 114.5,5 115.5,5 115.5,5.5 116.5,6.5|68,76 67,76 65.5,76 64.5,76 64,75.5 62,75.5 61,75.5 60.5,75 59,74.5 58.5,74.5 58,74 57,73.5 56,73.5 55,73.5 54,73.5 54.5,74 55.5,74.5 56,74.5 56,75 57.5,75.5 58,75.5 59,76 60,76 60.5,76 61.5,76.5 63,76 63.5,76.5 64.5,76.5 65.5,76.5 66,76.5 67,77 67.5,77 68.5,77 68,76|55.5,73.5 56,73.5 55.5,72.5 55.5,72 56,71.5 57,71 56,70.5 55,70.5 54.5,70.5 53.5,71 53.5,71.5 52.5,71.5 51.5,71.5 52,72 53,72.5 53.5,73 54,73.5 55,73.5|143,54.5 143,53.5 143.5,52.5 143,52 143.5,50.5 144,49.5 144.5,49 144,49.5 143,49 142.5,48 142.5,47.5 143.5,47 142.5,46.5 142,46 142,47 142,47.5 142,48.5 142,49.5 142,50 142,51 141.5,51.5 142,52.5 142,53.5 142.5,54|144,44 144.5,44 145.5,44.5 145,43.5 144.5,43 143.5,42.5 143,42 142,42.5 141,42.5 140.5,41.5 140,42 140,43 141,43 141.5,43.5 141.5,44.5 141.5,45 142.5,45 143,44.5 144,44|141,41.5 141.5,40.5 142,40 142,39.5 141.5,38.5 141,38 141,37 140.5,36.5 141,36 140.5,35 140,35.5 139,35 138.5,35 137.5,34.5 136.5,35 136.5,34 135.5,33.5 135,34.5 134.5,34.5 133.5,34.5 133,34.5 132,34 131.5,34 132,35 132.5,35.5 133.5,35.5 134,35.5 135,35.5 135.5,35.5 136.5,36.5 136.5,37 137,37.5 137.5,37 138,37 139,37.5 139.5,38.5 140,39 140,39.5 140,40.5 140.5,41 141,41|134.5,34.5 134.5,33.5 133.5,33.5 133,33 132.5,33.5 133,34 133.5,34 134.5,34.5|131,33.5 132,33.5 131.5,32.5 131.5,32 131,31.5 130.5,31.5 130,32 130.5,32.5 130,33 131,34|121,22.5 121,22 120.5,22.5 120,23.5 120.5,24.5 121.5,25 122,24.5 121.5,24 121.5,23|111,20 110.5,19.5 110,18.5 109,18.5 108.5,19.5 109.5,20 110,20 111,20|80,10 80.5,9.5 81,8.5 81.5,8 82,7 81.5,6 80.5,6 80,6.5 80,7.5 80,8.5 80,9|49.5,-12.5 50,-13.5 50,-14 50.5,-15 50.5,-16 50,-16.5 49.5,-17.5 49.5,-18.5 49,-19 49,-20 48.5,-21 48,-22 48,-22.5 47.5,-23.5 47.5,-24.5 47,-25 46,-25 45,-25.5 44.5,-25.5 44,-24.5 43.5,-23.5 43.5,-23 43.5,-22 43.5,-21.5 44,-20.5 44.5,-19.5 44,-19 44,-18.5 44,-17.5 44.5,-16.5 45,-16 46,-16 47,-15 47.5,-14.5 48,-13.5 49,-13.5 49,-12.5|-69,-52.5 -68.5,-53 -68,-53.5 -67.5,-54 -66.5,-54.5 -65.5,-54.5 -66,-55 -67,-55 -68,-55 -68.5,-55 -69.5,-55 -70.5,-55 -71,-54.5 -70.5,-54.5 -71,-54 -70,-54.5 -69.5,-54.5 -70,-54 -69.5,-53.5 -70,-53.5 -70,-52.5 -69,-52.5|-82,23 -81,23 -80,23 -79,22.5 -78,22 -77,21.5 -76.5,21.5 -76,21 -75.5,20.5 -74.5,20.5 -75.5,20 -76,20 -77,20 -77.5,20 -77,20.5 -78,20.5 -78.5,21.5 -79,21.5 -80,21.5 -80.5,22 -81,22.5 -82,22.5 -83,22.5 -84,22 -85,22 -84.5,22.5 -83.5,23 -82.5,23|21,80 22,80 23,80.5 23.5,80 24.5,80.5 25.5,80 26.5,80 27,80 26,79.5 25,79.5 24.5,79.5 23,79 22,79.5 21,79.5 20,79.5 21,79.5 20,80 19,79.5 18.5,80 19,80 20,80.5 20.5,80.5|17,80 17.5,80 18.5,79.5 19,79 20,79 21,79 21.5,78.5 20.5,78.5 19.5,78.5 19,78 18,77.5 17,77 16.5,76.5 15.5,77 14.5,77 14,77.5 14.5,77.5 16,78 17,78 16,78 15,78 14,78 15,78 16,78.5 17,78.5 16.5,78.5 15.5,78.5 15,78.5 14,78.5 13,78 12.5,78.5 11.5,79 12.5,79 11.5,79.5 10.5,79.5 11.5,80 12.5,80 13.5,80 13,79.5 14,79.5 14.5,80 15.5,79.5 16.5,79 16,79.5 16.5,80|9.5,41 9.5,40 9.5,39 8.5,39 8.5,40 8,41 9,41|9.5,43 9.5,41.5 8.5,42 9,42.5 9.5,43|15.5,38 15,37.5 15,37 14.5,37 13.5,37.5 13,37.5 13.5,38 14.5,38 15,38|-52.5,70 -52,70 -53,69.5 -53.5,69.5 -54.5,69.5 -54.5,70.5 -53.5,70 -52.5,70|-127,50.5 -126,50.5 -125.5,50.5 -125,49.5 -124,49 -123.5,48.5 -124.5,48.5 -125,49 -126,49 -126.5,49.5 -127,50 -128,50.5 -127,50.5|-72,19.5 -71.5,20 -70.5,20 -70,19.5 -69,19 -68.5,18.5 -69.5,18.5 -70,18.5 -71,18.5 -71.5,18 -72.5,18 -73.5,18 -74,18.5 -73,18.5 -73,19 -73.5,19.5 -72.5,20|-49.5,0 -49,0 -48.5,-1 -49.5,-1.5 -50,-1.5 -51,-1 -50.5,-0.5 -49.5,0|-3,58.5 -4,58 -3,57.5 -2,57.5 -2.5,57 -3,56.5 -2,56 -1.5,55.5 -1,54.5 0,54 0.5,53 1,53 1.5,52.5 1,52 1,51 0.5,51 -1,51 -1.5,50.5 -2.5,50.5 -3,50.5 -3.5,50.5 -4.5,50.5 -5.5,50 -5,50.5 -4.5,51 -3.5,51 -2.5,51.5 -3,51.5 -4,51.5 -5,51.5 -4,52.5 -4.5,53 -3.5,53.5 -3,54 -3.5,54.5 -4.5,55 -5,55 -5,55.5 -5.5,55.5 -5.5,56 -6,56.5 -6,57.5 -5.5,58 -5,58.5 -4,58.5 -3.5,58.5|-7,55 -6.5,55 -5.5,54.5 -6,54 -6,53.5 -6.5,52.5 -7,52 -8,52 -9,51.5 -9.5,51.5 -10.5,52 -10,52.5 -9,52.5 -9.5,52.5 -9,53 -10,53.5 -10,54 -9,54 -8,54.5 -7.5,55.5 -7,55|-180,69 -179.5,69 -178.5,68.5 -177.5,68.5 -177,68 -175.5,67.5 -175,67 -174.5,66.5 -174,67 -173,67 -172.5,67 -171.5,66.5 -170.5,66.5 -170,66 -171,65.5 -172,65.5 -173,65.5 -172.5,65 -172.5,64.5 -173.5,64.5 -174.5,64.5 -175,65 -176,65 -176.5,65.5 -177.5,65.5 -178.5,65.5 -178.5,66 -179.5,66.5 -179.5,65.5 180,65 178.5,64.5 177.5,64.5 177,65 176,65 175.5,65 174.5,64.5 175.5,65 176.5,64.5 177.5,65 178,64 178.5,64 179.5,63 179.5,62.5 178,62.5 177,63 176.5,62.5 175.5,62 175,62 174,62 173.5,61.5 172.5,61.5 172,61 171,60.5 170.5,60 169.5,60.5 169,60.5 168,60.5 167,60.5 166.5,60 166,60.5 165,60 164,60 163.5,59.5 163,59 162,58.5 163,58 163,57 163.5,56.5 162.5,56.5 162,56 162,55 161.5,54.5 160.5,54.5 160,54 160,53 159,53 158.5,52.5 158,52 157,51 156.5,51.5 156.5,52.5 156,53.5 155.5,54.5 155.5,55 156,56.5 157,57.5 157.5,58 158.5,58.5 159.5,59 160.5,59.5 161,60 162,60 162.5,60.5 163.5,61 164,61.5 164,62.5 165,62.5 164.5,62.5 163.5,62.5 163,62 161,61 160,61 160.5,62 159.5,62 158.5,62 157.5,62 157,61.5 156,61 155.5,60.5 154.5,60 154,59.5 155,59.5 154,59 153,59 152.5,59 151.5,59 151,59.5 150.5,59.5 149.5,60 149,59.5 148,59.5 147,59.5 146.5,59 145.5,59.5 144.5,59.5 143.5,59.5 142.5,59 142,58.5 141,58.5 140.5,58 139.5,57.5 138.5,57 137.5,56 137,56 136,55.5 135.5,55 136,54.5 136.5,54 137.5,54.5 137.5,53.5 138.5,53.5 139,54 140,54 140.5,53.5 141.5,53.5 141,52.5 141,51.5 140.5,50.5 140.5,50 140.5,49 140,48 139,47.5 138.5,47 138,46.5 138,46 137,45.5 136.5,45 136,44.5 135.5,43.5 134,43 133.5,43 132.5,43 131.5,43 131,42.5 130.5,42 129.5,41.5 129.5,40.5 128.5,40.5 128,40 127.5,39.5 128,39 128.5,38 129.5,37.5 129.5,36.5 129.5,35.5 129,35 128.5,35 127.5,35 127,34.5 126.5,34.5 126.5,35.5 126.5,36.5 127,37.5 126.5,38 125.5,37.5 125,38.5 125.5,39.5 124.5,40 124,40 123,39.5 122.5,39.5 121.5,39 121.5,39.5 122,40.5 121.5,41 120.5,40 119.5,40 119,39 118.5,39 117.5,39 118,38 119,38 119,37.5 120,37 121,38 122,37.5 122.5,37.5 121.5,37 121,36.5 120,36 119.5,35.5 119.5,34.5 120,34.5 120.5,33.5 121,32.5 121.5,32 122,31.5 121,32 120,32 121,31.5 122,31 121,30.5 120,30.5 121,30.5 122,30 122,29 121.5,28.5 121,28 120.5,27.5 120,27 119.5,26 119.5,25.5 119,25 118,24.5 117.5,24 117,23.5 116,23 115.5,23 114.5,22.5 114,22.5 113,22 112,22 111.5,21.5 110.5,21 110,20.5 110,21 109,21.5 108,21.5 107.5,21.5 106.5,20.5 106,19.5 105.5,19 106.5,18 106.5,17.5 107.5,17 108,16 108.5,15.5 109,14.5 109.5,13.5 109.5,12.5 109,11.5 108.5,11 108,10.5 107,10.5 106.5,10 106,10 105.5,9 105,8.5 105,9.5 104.5,10.5 104,10.5 103,11 103,12 102.5,12.5 101.5,12.5 101,13.5 100,13.5 100,13 100,12 99.5,11 99,10.5 99,9.5 100,8.5 100.5,7.5 101,7 102,6.5 102.5,6 103,5.5 103.5,4.5 103.5,3.5 103.5,3 104,2.5 104.5,1.5 103.5,1.5 102.5,2 102,2.5 101.5,3 101,3.5 100.5,4.5 100.5,5.5 100,6.5 99.5,7 99,8 98,8.5 98.5,9.5 98.5,10 98.5,11 99,11.5 98.5,12.5 98.5,13 98,14 98,14.5 97.5,16 97.5,16.5 97,17 96.5,16.5 96,16 95,16 94.5,16 94.5,17 94.5,17.5 94.5,18.5 94,19 93.5,20 93,20 92,21 92,22 91.5,23 91,22.5 90.5,23.5 90.5,22.5 90.5,22 89.5,22.5 89,21.5 88.5,22 88,22.5 87.5,21.5 87,21.5 87,20.5 86.5,20 85.5,19.5 85,19 84,18.5 83.5,18 82.5,17.5 82,16.5 81,16 80.5,16 80,15 80,14 80.5,13.5 80,12.5 80,12 80,11 79.5,10 79,9.5 78,9 78,8 77,8.5 76.5,9 76,10 76,11 75.5,11.5 75,12.5 74.5,13.5 74.5,14 74,15 74,15.5 73.5,16.5 73,17 73,18 73,18.5 73,19.5 73,20.5 72.5,21.5 72.5,22.5 72,21 71,20.5 70,21 69.5,22 70,22.5 70.5,23 70,23 69,23 68.5,24 67.5,24 67.5,24.5 66.5,25 66,25.5 65.5,25.5 64.5,25 63.5,25.5 62.5,25.5 62,25 61,25 60,25.5 59,25.5 58.5,25.5 57.5,26 57,26.5 56.5,27 55.5,27 55,26.5 54,26.5 53,27 52.5,27.5 52,28 51,28.5 51,29 50.5,29.5 49.5,30 49,30 48,30 48,29 49,28 49.5,27 50,26.5 50,26 50.5,25.5 51,26 51.5,25.5 51.5,24.5 52,24 52.5,24 53.5,24 54,24 55,25 56,26 56.5,25 57,24.5 57.5,24 58.5,23.5 59,23 60,22.5 59.5,22 58.5,21 58,20 58,19.5 57,19 56.5,18 55.5,18 55,17 54.5,17 53.5,16.5 52.5,16.5 52,15.5 51.5,15 50.5,15 49.5,14.5 49,14 48,14 47,13.5 46,13.5 45.5,13 44.5,12.5 43.5,12.5 43,13.5 43,14 43,15 42.5,15.5 43,16.5 42.5,17.5 42,18 41,18.5 41,19.5 40,20.5 39.5,20.5 39,21.5 39,22 39,23 38.5,24 37.5,24.5 37,25 37,25.5 36.5,26.5 36,27.5 35,28 35,29.5 34.5,29 34.5,28 33.5,28.5 33,29 32.5,30 32.5,29 33,28.5 33.5,27.5 34,27 34.5,26 35,25 35.5,24 35.5,23.5 36,22.5 37,22 37,21.5 37,20.5 37.5,19 38,18.5 38.5,18 39,17.5 39,16.5 39.5,16 40,15.5 40.5,15 41,14.5 41.5,14 42.5,13 43,13 43.5,12 42.5,11.5 43.5,11.5 44,11 45,10.5 45.5,11 46.5,10.5 47,11 48,11 49,11.5 50,11.5 51,12 51,11 51.5,10.5 51,10 50.5,9 50,8 49.5,7.5 49,6.5 48.5,5.5 48,4.5 47.5,4 47,3.5 46,2.5 45,2 44.5,1.5 43.5,1 42.5,0 42,-0.5 41.5,-1.5 41,-2 40.5,-2.5 40,-3.5 39.5,-4 39,-4.5 39,-5.5 39,-6 39.5,-7 39.5,-8 39.5,-8.5 39.5,-9.5 40.5,-10.5 40.5,-11.5 40.5,-12 40.5,-13 40.5,-14 41,-15 40.5,-15.5 40,-16 39.5,-16.5 39,-17 38,-17 37.5,-17.5 37,-18.5 36.5,-19 35.5,-19 35,-20 35,-20.5 35.5,-21.5 35.5,-22.5 35.5,-23.5 35.5,-24.5 34.5,-25 34,-25 33,-25.5 32.5,-26 32.5,-27.5 32.5,-28 32,-29 31.5,-29.5 30.5,-30.5 30.5,-31 29.5,-31.5 29,-32.5 28,-33 27,-33.5 26,-33.5 25,-34 24,-34 23.5,-34 22.5,-34 22,-34.5 21,-34.5 20,-35 19.5,-34.5 18.5,-34 18,-33 18.5,-32.5 18,-31.5 17.5,-31 17.5,-30.5 17,-29.5 16.5,-28.5 15.5,-28 15.5,-27.5 15,-26.5 15,-26 15,-25 14.5,-24 14.5,-23.5 14.5,-22.5 14,-22 13.5,-21 13,-20 12.5,-19 12,-18.5 11.5,-17.5 12,-16.5 12,-15.5 12.5,-14.5 12.5,-14 13,-13 13.5,-12.5 14,-11.5 13.5,-11 13.5,-10 13,-9 13.5,-8.5 13,-7 12.5,-6.5 13,-6 12.5,-6 12,-5 11.5,-4 11,-3.5 10.5,-3 10,-2.5 9.5,-2 9,-1 9.5,-0.5 9.5,0.5 9.5,1.5 10,2 10,2.5 9.5,3.5 9,4 8.5,5 7.5,4.5 7,4.5 6,4.5 5.5,5 5,6 4,6.5 3.5,6.5 2.5,6.5 1.5,6 0.5,6 -0.5,5.5 -1.5,5 -2.5,5 -3,5 -4,5 -4.5,5 -5.5,5 -6.5,5 -7,4.5 -8,4.5 -9,5 -9.5,5.5 -10.5,6 -11.5,6.5 -12,7 -12.5,7.5 -13,8.5 -13.5,9 -13.5,10 -14.5,10 -15,11 -15.5,11.5 -16,12 -16.5,12.5 -17,13.5 -16,13.5 -16.5,14 -17,14.5 -17,15.5 -16.5,16.5 -16,17.5 -16,18 -16,19 -16.5,20 -16.5,20.5 -17,21.5 -16.5,22.5 -16,23 -16,23.5 -15,24.5 -15,25 -14.5,26 -14,26.5 -13.5,27 -13,28 -12,28 -11.5,28.5 -10.5,29 -10,29.5 -9.5,30 -10,31 -9.5,32 -9,33 -8.5,33.5 -7.5,33.5 -7,34 -6.5,35 -6,35.5 -5.5,36 -5,35.5 -4,35 -3,35 -2.5,35 -1.5,35 -1,35.5 -0.5,36 0.5,36.5 2,36.5 3,36.5 3.5,37 5,37 5.5,37 7,37 7.5,37 8.5,37 9.5,37.5 10.5,36.5 11,37 10.5,36.5 11,35.5 10.5,34.5 10,34 10.5,33.5 11.5,33.5 12.5,33 13,33 14,33 15,32.5 15.5,31.5 16,31.5 17,31 18,31 18.5,30.5 19.5,30.5 20,31 20,32 20.5,32.5 21,33 22,33 23,32.5 24,32 24.5,32 25.5,31.5 26.5,31.5 27,31.5 28,31 29,31 29.5,31 30.5,31.5 31,31.5 32,31.5 32.5,31 33,31 34,31.5 34.5,32 35,32.5 35,33.5 35.5,34 36,35 36,35.5 36,36.5 35,36.5 34.5,36.5 33.5,36 33,36 32,36.5 31.5,37 30.5,37 30.5,36 29.5,36.5 28.5,37 28,36.5 27.5,37.5 27,38 26.5,38.5 27,38.5 26.5,39.5 26,40 26.5,40.5 27.5,40.5 28.5,40.5 29.5,40.5 30.5,41 31.5,41 32,41.5 33,42 34,42 35,42 36,41.5 36.5,41.5 37.5,41 38.5,41 39.5,41 40,41 41,41.5 41.5,41.5 41.5,42.5 41,43 40,43.5 38.5,44.5 38,44.5 37,45 38,46 38,46.5 38.5,46.5 38,47 37,47 36,46.5 35.5,46.5 35,46 35.5,45.5 36.5,45.5 35.5,45 34.5,45 34,44.5 33.5,45 32.5,45.5 33.5,46 32.5,46 31.5,46.5 32.5,46.5 32,47 31,46.5 30,46 29.5,45.5 29,45 28.5,44 28,43.5 28,42.5 28,42 29,41 28,41 27,40.5 26,40 25.5,41 24.5,41 24,40.5 24,40 23.5,40 22.5,40.5 23,39.5 22.5,39 23.5,38.5 24,38 23.5,38 23,37.5 23,36.5 22,37 21.5,37.5 21,38 21.5,38.5 22.5,38 21.5,38.5 21,39 20,39.5 19.5,40 19.5,41 19.5,42 18.5,42.5 18,43 17,43.5 16,43.5 15,44 15,45 14,45 13.5,45.5 12.5,45.5 12,44.5 12.5,44 13.5,43.5 14,42.5 15,42 16,42 16.5,41 17.5,41 18.5,40.5 17.5,40.5 16.5,40 17,39.5 16.5,38.5 16,38 16,39 16,39.5 15.5,40 15,40.5 14,41 13,41.5 12,42 11.5,42.5 10.5,43 10.5,43.5 9.5,44 9,44.5 8,44 7.5,43.5 6.5,43 6,43 5,43.5 4.5,43.5 3.5,43 3.5,42.5 2.5,41.5 1.5,41 1,41 0.5,40.5 -0.5,39.5 0,39 -0.5,38.5 -1,37.5 -1.5,37.5 -2,36.5 -3.5,37 -4.5,36.5 -5,36.5 -6,36.5 -7,37 -8,37 -8.5,37 -9,38 -9,39 -9.5,38.5 -9.5,39.5 -9,40 -8.5,41 -9,41.5 -9,42.5 -9,43 -8.5,43.5 -7.5,44 -6.5,43.5 -6,43.5 -4.5,43.5 -3.5,43.5 -2.5,43.5 -2,43.5 -1.5,44 -1,45 -0.5,45 -1,45.5 -2,46.5 -1.5,47 -2.5,47.5 -3,47.5 -4,48 -4.5,48 -4,48.5 -3,49 -2.5,48.5 -1.5,48.5 -2,49.5 -1,49.5 0,49.5 0.5,50 1.5,50 2,51 3,51.5 3.5,51.5 4,52 4.5,53 5.5,53 6.5,53.5 7,53.5 8,53.5 9,54 9.5,53.5 9,54.5 8.5,55 8,56 8,56.5 9,56.5 10,57.5 10.5,57.5 10.5,57 11,56.5 10,56 9.5,55.5 9.5,55 10.5,54.5 11.5,54 12,54 13,54.5 14,54 14.5,53.5 15.5,54 16,54.5 17,54.5 18,55 19,54.5 20,54.5 20.5,55 21,55.5 21,56.5 21.5,57 22,57.5 23,57.5 23.5,57 24.5,57.5 24.5,58 23.5,58.5 24,59.5 24.5,59.5 25.5,59.5 26.5,59.5 27.5,59.5 28,59.5 28.5,60 29.5,60 28.5,60.5 28,60.5 26.5,60.5 26,60.5 25,60 24,60 23.5,60 22.5,60 22,60.5 21.5,61 21.5,62 21.5,63 22.5,63.5 23,64 24,64.5 24.5,64.5 25.5,65 25,65.5 24,66 23,65.5 22.5,66 21.5,65.5 21,65 21,64 20,63.5 19,63 18.5,63 18,62.5 17.5,62 17,61 17.5,60.5 18.5,60.5 18.5,59.5 17.5,59 17,58.5 16.5,58 16.5,57 16,56 15,56 14,56 13.5,55.5 12.5,56 12,57 11.5,58 11,58.5 11,59 10,59 9,58.5 8,58 7.5,58 6.5,58 5.5,58.5 6,59.5 5,59.5 6,60 6.5,60.5 6,60 5.5,60 5.5,60.5 6,61 7,61 6,61 5.5,61 5.5,62 6.5,62 5.5,62 6.5,62.5 7.5,62.5 8,62.5 7,62.5 7.5,63 8.5,63 8.5,63.5 9.5,63.5 10,63.5 11,63.5 10.5,63.5 10.5,64.5 11.5,64.5 12,65 13,65.5 12,65 12.5,66 13.5,66 14,67 15,67 15.5,67.5 15,68 15.5,68 16.5,68.5 17.5,69 18,69 19,69.5 19.5,70 20.5,69.5 21.5,70 22,70.5 23,70 23.5,70.5 24.5,71 25.5,71 25,70 26,70.5 27,70.5 27.5,71 28.5,70.5 29,71 30,70.5 31,70.5 30,70 29,70 29.5,70 30.5,70 31.5,69.5 32.5,70 33,69.5 34,69.5 35,69 36,69 36.5,69 37.5,68.5 38.5,68.5 39.5,68 40.5,68 41,67.5 40.5,66.5 39.5,66 38,66 37,66.5 35.5,66.5 35,66.5 34,66.5 33,67 32.5,67 33,66.5 34,66 34.5,65.5 35,64.5 35.5,64.5 36.5,64 37.5,64 38,64.5 37,64.5 37,65 38,65 39,64.5 40,65 40,65.5 40.5,66 41.5,66 42,66.5 43,66.5 43.5,66.5 44.5,66.5 44,67.5 44,68 43.5,68.5 45,68.5 46,68.5 46.5,68 45.5,68 46,67 46.5,67 47.5,67 48,67.5 48.5,67.5 50,68 50.5,68.5 51.5,68.5 52.5,68.5 53.5,69 54,69 53.5,68.5 54.5,68.5 55.5,68.5 56.5,68.5 57.5,68.5 58,69 59,69 59.5,68.5 60.5,68.5 60.5,69.5 62,70 62.5,69.5 63.5,69.5 64,69.5 65,69.5 65.5,69 66.5,69 67,69 68,68.5 69,69 68,69.5 67,69.5 67,70.5 66.5,71 67.5,71.5 68,71.5 68.5,72 69,72.5 69.5,73 70.5,73 71.5,73 72.5,73 72.5,72 72,71.5 72.5,71 72.5,70.5 72.5,70 72.5,69 73.5,68.5 73,67.5 72,67 71,66.5 70.5,66.5 69,67 70,66.5 71,66.5 72,66 73.5,67 74,67.5 74.5,67.5 74.5,68.5 75.5,69 76.5,69 77,68.5 77,68 78,67.5 79,67.5 78,67.5 77.5,68 77.5,69 76.5,69 75.5,69.5 74.5,69 73.5,69.5 74,70.5 73.5,71 73.5,72 75,72 75.5,73 75.5,72 75.5,71.5 76.5,71 77.5,71 78.5,71 78,71.5 77,71.5 76.5,71.5 77.5,72 78,72.5 79.5,72.5 80.5,72 81.5,71.5 82.5,72 82.5,71 82,70.5 82.5,71 82.5,70 83.5,70.5 83.5,71 83.5,72 82.5,72 81.5,72.5 80.5,73 81.5,73.5 83.5,73.5 84.5,73.5 85.5,73.5 86.5,74 86,73.5 86.5,73 87,73.5 86.5,74 86,74.5 87,75 87.5,75 88.5,75.5 89.5,75.5 90,75.5 91,75.5 92,75.5 93.5,76 94.5,76 95.5,76 96.5,76 97,76 98,76 98.5,76 99.5,76 99,76.5 99.5,76.5 100.5,76.5 101.5,76.5 101.5,77 102.5,77.5 103.5,77.5 105,77.5 105.5,77.5 105,77 105.5,77 106.5,77 107,76.5 108,76.5 109.5,76.5 110.5,77 111.5,76.5 112.5,76.5 113,76 114,76 113,75.5 113,75 112,75 111.5,74.5 110.5,74.5 109.5,74 108,73.5 107.5,73.5 106,73.5 105.5,73 106,73 107,73 108,73 108.5,73.5 109.5,73.5 110.5,73.5 111.5,74 112,73.5 113,73.5 113.5,73.5 113.5,72.5 114,73.5 115,73.5 116.5,73.5 117.5,73.5 118.5,73.5 119,73 119.5,73 120.5,73 121.5,73 122.5,73 123,73 124,73.5 125,73.5 125.5,73.5 126.5,73.5 127.5,73.5 128.5,73.5 129,72.5 128,72.5 129,72 130,71 130.5,71 131.5,71 132,71 132.5,72 133.5,71.5 134,71.5 135,71.5 136,71.5 137,71.5 138,71 138.5,71.5 139.5,71.5 140,72 139,72 140.5,72.5 141.5,73 142,72.5 143.5,72.5 144.5,72.5 145,72.5 146,72.5 145,72.5 144,72.5 145,72.5 146.5,72.5 146,72 145,72 146,71.5 147,72 148.5,72.5 149.5,72 150,71.5 150.5,71.5 151.5,71.5 152.5,71 153.5,71 154.5,71 155.5,71 156.5,71 157.5,71 158.5,71 159.5,71 160,70.5 160,69.5 161,69.5 162,69.5 163,69.5 164,69.5 166,69.5 167,69.5 167.5,69.5 168.5,69 169.5,69 170,69 171,69 170,69.5 171,70 172,70 173,70 173.5,70 175,70 176,70 177,69.5 178,69.5 179,69.5 180,69 -180,69|-15.5,66 -15,66 -14,65.5 -14,64.5 -15,64.5 -16,64 -16.5,64 -17.5,63.5 -18.5,63.5 -20,63.5 -20.5,63.5 -21,64 -22.5,64 -21.5,64.5 -22.5,65 -23.5,65 -24,65 -23,65 -22,65 -22.5,65.5 -23.5,65.5 -23,66 -22.5,66 -23,66.5 -22.5,66.5 -21.5,66 -21,65.5 -20.5,65.5 -20,66 -19,66 -18,66 -17.5,66 -16.5,66 -16,66.5|54.5,81 55.5,81 56,81 57,81 57.5,81 57,80.5 56,80.5 55,81 54,81|-86.5,71 -86,71 -85,71 -85.5,72 -84.5,72 -85.5,72.5 -84.5,73 -85,73 -84,73.5 -83.5,73.5 -82.5,73.5 -81.5,73.5 -81,73 -81,72.5 -80,72 -79,72.5 -78,72.5 -77.5,72.5 -76.5,72.5 -75.5,72.5 -75,72.5 -76,72 -75,72 -74,72 -75,71.5 -74,71.5 -73,71.5 -72,71.5 -71.5,71.5 -72.5,71 -71.5,71 -70.5,71 -71.5,70.5 -70.5,70.5 -69.5,71 -69,70.5 -69.5,70 -69,70 -68,70.5 -67.5,70 -68,70 -69,69.5 -68,69.5 -67,69.5 -68,69 -69,69 -68,69 -68.5,69 -68,68.5 -67,68.5 -66.5,68 -65.5,68 -65,68 -64,67.5 -64.5,67.5 -63.5,67.5 -63,67 -62.5,67 -61.5,67 -62,66.5 -62.5,65.5 -63.5,66 -63.5,65 -64.5,65 -65,65.5 -64.5,66 -66,66 -66.5,66.5 -67.5,66.5 -68.5,66 -67.5,65.5 -67,65 -66.5,65 -65.5,65 -65,64 -64.5,63.5 -65,64 -65,63 -65.5,63 -66.5,63 -67.5,63.5 -68,63.5 -67.5,63 -66.5,62.5 -66,62 -67,62 -68.5,62 -69,62.5 -70,63 -71,63 -71.5,63 -72,63.5 -73,64 -73.5,64.5 -74.5,64.5 -75,64.5 -76,64.5 -76.5,64.5 -77,64.5 -78,64.5 -77.5,65 -76.5,65.5 -75.5,65 -74.5,65.5 -74,65.5 -74.5,66 -73.5,66.5 -73,67 -72.5,67.5 -73.5,68.5 -74,68.5 -75,69 -76,69 -76.5,68.5 -76,69 -76.5,69.5 -77.5,70 -78,70 -79,70.5 -79.5,70 -80,70 -81,70 -82,70 -83,70 -84,70 -85,70 -86,70 -86.5,70.5 -87.5,70.5 -88,70.5 -89,71 -88.5,71 -87.5,71 -88.5,71 -89.5,71.5 -90,72 -89.5,72.5 -89,73.5 -87.5,73.5 -87,74 -86,74 -85,74 -86,73.5 -86.5,72.5 -86,72 -85.5,71.5 -86,71|-69.5,83 -68.5,83 -67.5,83 -66.5,83 -68.5,82.5 -67.5,82.5 -67,82.5 -66,83 -65,83 -64.5,83 -63.5,83 -62.5,82.5 -61.5,82.5 -62.5,82 -63.5,82 -64.5,81.5 -65,81.5 -66,81.5 -67,81.5 -68.5,81.5 -65.5,81.5 -65,81.5 -65.5,81.5 -66.5,81 -68,81 -68.5,80.5 -69.5,80.5 -70.5,80.5 -71.5,80 -70.5,80 -71.5,80 -72.5,79.5 -73.5,80 -74,80 -73,79.5 -74,79.5 -75,79.5 -76,79.5 -77,79.5 -76,79.5 -75,79 -76,79 -77.5,79 -78.5,79 -77.5,79 -77,79 -76,79 -75.5,79 -74.5,79 -75.5,78.5 -76.5,78.5 -75.5,78.5 -76.5,78 -77.5,78 -78.5,77.5 -79,77.5 -80,77.5 -81,77.5 -82,77.5 -81,77.5 -80,77 -79,77 -78.5,77 -79.5,76.5 -80,76.5 -80.5,76 -81.5,76.5 -82.5,76.5 -83.5,76.5 -84,76.5 -85,76.5 -86,76.5 -87,76.5 -88,76.5 -89,76.5 -89.5,77 -89,77 -88,77 -87,77 -87.5,77.5 -87,78 -86,77.5 -85,77.5 -84,77.5 -83,77.5 -84,77.5 -85,77.5 -85.5,78 -84.5,78 -85.5,78 -86,78 -87,78 -87,79 -85.5,79 -85,79 -84,79 -83,79 -82,79 -83,79 -84,79 -84.5,79 -83.5,79 -84.5,79.5 -85.5,79.5 -86,79.5 -86.5,80 -85,80.5 -84,80.5 -83.5,80 -82.5,80 -81.5,79.5 -81,79.5 -80.5,79.5 -81,79.5 -82.5,80 -83,80.5 -81,80.5 -80,80.5 -78.5,81 -77.5,81 -78.5,81 -77.5,81.5 -78.5,81.5 -79,81 -80,81 -81,80.5 -82.5,80.5 -83.5,80.5 -84,80.5 -85,80.5 -86,80.5 -85,81 -83.5,81 -84.5,81 -86,81 -87,80.5 -88,80.5 -89,81 -87.5,81 -86.5,81 -86,81 -85,81 -86,81 -86.5,81 -87.5,81 -89,81 -90,81 -89,81.5 -88,81.5 -89,81.5 -90.5,81.5 -91.5,81.5 -90.5,82 -89.5,82 -88.5,82 -87.5,82 -87,82 -86,82 -85,82 -86.5,82 -86,82.5 -85,82.5 -84,82.5 -83,82 -81.5,82 -80.5,82 -79.5,82 -81.5,82 -82.5,82.5 -81.5,82.5 -81,82.5 -80,82.5 -79,82.5 -80,83 -79,83 -78.5,83 -77.5,83 -76.5,82.5 -75.5,82.5 -76.5,83 -75.5,83 -74.5,83 -73.5,83 -72.5,82.5 -72,83 -71.5,83 -70,83|-94.5,72 -93.5,71.5 -93,71 -92,70.5 -92.5,69.5 -92,69.5 -91,69.5 -90.5,69.5 -91,69.5 -90.5,69 -90,68.5 -89.5,69.5 -88.5,69 -88,68.5 -88,67.5 -87,67.5 -86,68 -85.5,69 -85.5,69.5 -84.5,70 -84,69.5 -83,69.5 -82.5,69.5 -81.5,69 -82,68.5 -82.5,68.5 -82,68 -81.5,67 -82.5,66.5 -83,66.5 -84,66.5 -84.5,67 -84,66.5 -85,66.5 -86,66.5 -86.5,66.5 -86.5,65.5 -87.5,65.5 -88.5,65.5 -89,65.5 -90,66 -90.5,66 -91.5,66 -90.5,66 -90,65.5 -88,65.5 -87.5,65.5 -88,64.5 -88.5,64 -89.5,64 -90.5,63.5 -91.5,63.5 -92.5,64 -93,64 -92,63.5 -91.5,63.5 -90.5,63 -92,63 -92.5,62.5 -93,62 -94,61.5 -94.5,60.5 -95,59.5 -94.5,58.5 -93.5,58.5 -93,58 -92.5,57.5 -91,57 -90,57 -89.5,57 -88.5,56.5 -87.5,56 -87,56 -86,55.5 -85.5,55 -84.5,55.5 -84,55.5 -83,55 -82.5,55 -82.5,54 -82,53.5 -82,52.5 -81,52 -80.5,51.5 -79.5,51 -79.5,51.5 -78.5,52 -79,53 -79,53.5 -79.5,54.5 -79,55 -78,55 -77.5,55.5 -76.5,56.5 -76.5,57 -77,58 -78,58.5 -78.5,59 -78,59.5 -77.5,60 -78,60.5 -77.5,61.5 -78,62.5 -77,62.5 -76,62.5 -75,62.5 -74,62.5 -73.5,62.5 -72.5,62 -72,61.5 -71.5,61 -70.5,61 -69.5,61 -69.5,60 -70.5,60 -70,60 -69.5,59.5 -70,59 -69.5,59 -68.5,59 -68.5,58 -67.5,58.5 -66.5,58.5 -66,58.5 -65.5,59 -65.5,59.5 -65,60.5 -64,60 -63.5,59 -63,58.5 -63.5,58.5 -63,58.5 -62.5,58 -62,57.5 -61.5,57 -62,56.5 -61.5,56 -60.5,55.5 -60,55.5 -59,55 -58.5,55 -58,54.5 -58.5,54 -59.5,54 -60.5,53.5 -59.5,53.5 -59,54 -58,54 -57,54 -56.5,53.5 -56,53 -56,52.5 -56,52 -57,51.5 -58,51.5 -59,51 -60,50.5 -61,50 -61.5,50 -62.5,50.5 -63.5,50.5 -64.5,50.5 -65,50.5 -66,50 -67,50 -67.5,49.5 -68.5,49 -69,48.5 -70,48 -71,48.5 -70,48 -70.5,47.5 -71,47 -72,46.5 -72.5,46.5 -73.5,46 -74,45.5 -74.5,45 -74,45.5 -73.5,46 -72.5,46.5 -71.5,46.5 -70.5,47 -70,47.5 -69,48.5 -68,48.5 -67,49 -66,49 -65.5,49.5 -65,49 -64.5,48.5 -65,48 -66,48 -65,48 -65.5,47 -64.5,46.5 -64,46 -63,46 -62,45.5 -61.5,45.5 -62,45 -63,44.5 -64,44.5 -64.5,44 -65.5,43.5 -66,44 -65,45 -64,45 -63.5,45.5 -64.5,45.5 -65.5,45.5 -66,45.5 -67,45 -67.5,44.5 -68.5,44.5 -69.5,44 -70.5,43.5 -70.5,43 -71,42.5 -70.5,42 -71.5,41.5 -72,41.5 -73,41.5 -73.5,41 -74.5,40.5 -74,39.5 -75,39 -75.5,39.5 -75,39 -75.5,37.5 -76,38.5 -76,39 -76.5,38.5 -77.5,38.5 -76.5,38 -76.5,37.5 -76,36.5 -75.5,36 -76,36.5 -76.5,36 -76,35.5 -77,35.5 -76.5,35 -77.5,34.5 -78,34 -79,33.5 -79.5,33 -80,32.5 -81,32 -81.5,31.5 -81.5,30.5 -81.5,30 -81,29 -80.5,28 -80,27 -80,26 -80.5,25.5 -81,25 -81.5,26 -82,27 -82.5,27.5 -82.5,28.5 -83.5,29.5 -84,30 -85,30 -85.5,30 -86,30.5 -87,30.5 -88,30 -88.5,30.5 -89.5,30 -90.5,30.5 -89.5,30 -89,29.5 -90,29.5 -91,29 -92,30 -92.5,29.5 -93.5,30 -94.5,29.5 -95.5,29 -96.5,28.5 -97,28 -97.5,27.5 -97.5,26.5 -97.5,25 -97.5,24.5 -98,23.5 -98,22.5 -97.5,22 -97.5,21 -96.5,20 -96,19 -95.5,18.5 -95,18.5 -94,18.5 -93,18.5 -92.5,18.5 -92,18.5 -91,19 -90.5,19.5 -90.5,20.5 -90,21.5 -89,21.5 -88,21.5 -87.5,21.5 -87,21.5 -87,20.5 -87.5,20 -87.5,19 -88,18 -88,17.5 -88.5,16.5 -89,16 -88,15.5 -87.5,16 -86.5,16 -86,16 -84.5,16 -84,15.5 -83,15 -83.5,14 -83.5,13.5 -83.5,12.5 -83.5,11.5 -83.5,10.5 -83,10 -82.5,9.5 -81.5,9 -81,9 -80,9 -79,9.5 -78,9 -77.5,8.5 -77,8 -76.5,9 -75.5,9.5 -75.5,10.5 -75,11 -74,11.5 -73.5,11.5 -72.5,11.5 -72,12 -71.5,12.5 -72,11.5 -71.5,11 -72,10 -71.5,9 -71,9.5 -71.5,10.5 -71,11 -70,11.5 -69,11.5 -68.5,11 -68,10.5 -67,10.5 -66,10.5 -65.5,10 -64,10.5 -63.5,10.5 -62.5,10.5 -62,10.5 -62.5,10.5 -62.5,10 -61.5,10 -61,9 -61.5,8.5 -61,8.5 -60,8.5 -59,7.5 -58.5,7 -58,6.5 -57,6 -56.5,6 -55.5,6 -55,6 -54,6 -53,5.5 -52,4.5 -51.5,4 -51,3.5 -50.5,2 -50,1.5 -50.5,1 -51,0 -51.5,-0.5 -52,-1 -52.5,-1.5 -51.5,-1.5 -51,-1 -50.5,-2 -49.5,-2 -48.5,-1.5 -48.5,-1 -47.5,-1 -46.5,-1 -45.5,-1.5 -45,-1.5 -44.5,-2.5 -44.5,-3 -44.5,-2.5 -43.5,-2.5 -42.5,-2.5 -42,-2.5 -41,-3 -40,-3 -39,-3.5 -38.5,-4 -38,-4.5 -37,-5 -36,-5 -35.5,-5 -35,-6 -35,-7 -35,-7.5 -35,-8.5 -35.5,-9 -36,-9.5 -36.5,-10.5 -37,-11 -37.5,-11.5 -38,-12.5 -38.5,-12.5 -39,-13.5 -39,-14.5 -39,-15.5 -39,-16.5 -39,-17.5 -39.5,-18.5 -39.5,-19.5 -40,-20 -40.5,-21 -41,-21.5 -41.5,-22 -42,-23 -43,-23 -43.5,-23 -44.5,-23 -45,-23.5 -46,-24 -46.5,-24 -47.5,-25 -48,-25.5 -48.5,-26 -48.5,-27 -48.5,-28 -49,-28.5 -49.5,-29.5 -50.5,-30.5 -51,-31.5 -51.5,-31.5 -51,-31 -50.5,-30.5 -51.5,-31 -52,-31.5 -52,-32 -52.5,-33 -53.5,-33.5 -54,-34.5 -55,-35 -55.5,-35 -56.5,-35 -57,-34.5 -58,-34.5 -58.5,-33.5 -58,-33 -58.5,-33.5 -58.5,-34.5 -57.5,-35 -57.5,-36 -56.5,-36.5 -57,-37.5 -57.5,-38 -58,-38.5 -59,-38.5 -59.5,-39 -61,-39 -62,-39 -62,-40 -62,-40.5 -63,-41 -64,-41 -65,-40.5 -65,-41.5 -64.5,-42.5 -63.5,-42.5 -64,-43 -64.5,-42.5 -65,-43.5 -65,-44 -65.5,-44.5 -66.5,-45 -67.5,-45.5 -67.5,-46.5 -67,-47 -66,-47 -66,-48 -67,-48.5 -67.5,-49 -68,-50 -68.5,-50 -69,-50.5 -69,-51.5 -68.5,-52 -69.5,-52.5 -70.5,-52.5 -71,-53 -71.5,-54 -72,-53.5 -71.5,-53 -72.5,-53 -73,-53.5 -72,-52.5 -73,-53 -73.5,-52.5 -74.5,-52 -73.5,-52 -73,-52 -73.5,-52 -74,-51.5 -75,-51 -74.5,-50.5 -74,-51 -74.5,-50.5 -74,-49.5 -74.5,-48.5 -74,-48 -74.5,-48 -74,-47 -75,-46.5 -75.5,-47 -75,-46 -74.5,-46 -74,-46.5 -73.5,-45.5 -72.5,-44.5 -73,-44 -73,-43.5 -73,-42.5 -73,-41.5 -73.5,-42 -74,-41 -73.5,-40 -73,-39.5 -73.5,-38.5 -73.5,-37.5 -73,-37 -73,-36 -72.5,-35 -72,-34.5 -71.5,-33.5 -71.5,-32 -71.5,-31.5 -71.5,-31 -71.5,-30 -71.5,-29.5 -71,-28.5 -71,-27.5 -71,-27 -70.5,-26 -70.5,-25.5 -70.5,-24.5 -70.5,-23.5 -70.5,-22.5 -70,-22 -70,-20.5 -70,-20 -70.5,-19 -71,-18 -71.5,-17.5 -72,-17 -73,-16.5 -73.5,-16 -74.5,-15.5 -75.5,-15 -76,-14.5 -76,-13.5 -76.5,-13 -77,-12 -77.5,-11.5 -77.5,-11 -78.5,-10 -78.5,-9 -79,-8 -79.5,-7.5 -80,-7 -81,-6.5 -81,-5.5 -81.5,-5 -81,-4 -80.5,-3.5 -80,-3 -80.5,-2.5 -81,-1.5 -80.5,-1 -80,0 -80,0.5 -79,1 -79,2 -78.5,2.5 -77.5,3 -77,4 -77.5,4.5 -77.5,5.5 -77.5,6 -78,7 -78.5,8 -78.5,8.5 -79,9 -80,8.5 -80,7.5 -80.5,7 -81,8 -82,8 -82.5,8.5 -83.5,8.5 -84,9.5 -85,10 -86,10.5 -86,11 -86.5,11.5 -87,12.5 -87.5,13 -88.5,13 -89.5,13.5 -90,13.5 -91,14 -92,14.5 -93,15 -93.5,15.5 -94,16 -95,16 -96,16 -96.5,15.5 -97,16 -98,16 -99,16.5 -99.5,16.5 -100.5,17 -101,17.5 -102,18 -102.5,18 -103.5,18.5 -104,19 -105,19.5 -105.5,20 -105.5,21 -105.5,21.5 -105.5,22.5 -106,23 -107,24 -108,24.5 -108.5,25.5 -109.5,25.5 -109.5,26.5 -110.5,27 -111,28 -111.5,28.5 -112,29 -112.5,29.5 -113,30.5 -113.5,31.5 -114.5,31.5 -114.5,31 -114.5,30 -114,29.5 -113.5,29 -113,28.5 -112.5,27.5 -112,26.5 -111.5,26 -111,25 -110.5,24.5 -110,24 -109.5,23.5 -110,23 -110.5,23.5 -111.5,24.5 -112,25 -112,25.5 -113,26.5 -114,27 -114.5,27.5 -114,28 -114.5,29 -115.5,29.5 -116,30 -116,31 -116.5,31.5 -117,32.5 -117.5,33.5 -118,33.5 -119,34 -120,34.5 -120.5,35 -121,35.5 -121.5,36 -122,37 -122.5,38 -123,38 -123.5,39 -124,40 -124.5,40.5 -124,41 -124.5,42 -124.5,43 -124,43.5 -124,44.5 -124,45.5 -124,46 -123.5,46 -124,46.5 -124,47 -124.5,48 -123.5,48 -122.5,48 -123,47.5 -122,48 -122.5,49 -123.5,49.5 -124,50 -124.5,50 -125,50.5 -126,50.5 -127,51 -127.5,51.5 -128,52 -127,52.5 -128,52.5 -128.5,53 -129,53.5 -128,53.5 -129,54 -129.5,53.5 -130,54 -130.5,54.5 -130,55 -130.5,54.5 -131,55 -131,56 -132,55.5 -132,56.5 -133,57 -133.5,57 -134,58 -135,58.5 -135,59 -135,58.5 -136,58.5 -137,59 -136,58.5 -137,58.5 -138,59 -139,59 -139.5,59.5 -140.5,59.5 -141.5,60 -142,60 -143,60 -144,60 -144.5,60 -145,60.5 -146,60.5 -146.5,61 -147.5,61 -148.5,61 -148,60.5 -149,60 -149.5,60 -150.5,59.5 -151,59.5 -152,59.5 -151,59.5 -151.5,60.5 -150.5,61 -149.5,61 -150.5,61.5 -151.5,61 -152.5,60.5 -153,60 -154,59.5 -153.5,59 -154,58.5 -154.5,58 -155.5,58 -156,57.5 -156.5,57 -157.5,56.5 -158,56.5 -158.5,56 -159.5,56 -160,55.5 -161,55.5 -161.5,55.5 -162.5,55 -163.5,55 -163,55.5 -162,55.5 -161,56 -160.5,56 -160,56.5 -159,57 -158.5,57.5 -157.5,57.5 -157.5,58 -157,59 -157.5,58.5 -158.5,58.5 -159,58.5 -159.5,59 -160.5,59 -161,59 -162,58.5 -161.5,59 -162,60 -163,60 -163.5,60 -164.5,60 -165,60.5 -164,60.5 -163.5,61 -164.5,61 -165.5,61 -166,61.5 -165.5,62.5 -164.5,62.5 -164,63.5 -163.5,63 -162.5,63.5 -161.5,63.5 -161,63.5 -161,64.5 -162,64.5 -162.5,64.5 -163.5,64.5 -164.5,64.5 -165,64.5 -166,64.5 -167,65 -166,65.5 -167.5,65.5 -166.5,66 -165.5,66 -164.5,66.5 -163.5,66.5 -163,66 -162,66 -161,66 -162,66.5 -162.5,67 -161.5,66.5 -161,66.5 -162,66.5 -163,67 -163.5,67 -164,67.5 -165.5,68 -166,68.5 -165.5,69 -164.5,69 -163.5,69 -162.5,70 -161,70.5 -160,70.5 -159.5,70.5 -160,70.5 -159.5,71 -158.5,71 -157.5,71 -157,71.5 -156,71 -155,71 -154,71 -153,71 -152.5,71 -151,70.5 -150.5,70.5 -149.5,70.5 -149,70.5 -148,70.5 -147,70 -146.5,70 -145.5,70 -144.5,70 -143.5,70 -142.5,70 -141.5,70 -140.5,69.5 -139,69.5 -138.5,69 -137.5,69 -136,69 -135.5,68.5 -135,69.5 -134,69.5 -133.5,69.5 -132.5,69.5 -131.5,70 -131,70 -130,70 -131,69.5 -132,69.5 -133,69 -132,69.5 -131,69.5 -129.5,70 -129,70 -128,70 -127.5,70.5 -126.5,70 -126,69.5 -125,69.5 -124.5,70 -124,69.5 -123,69.5 -122.5,70 -121.5,70 -121,69.5 -120.5,69.5 -119,69.5 -118,69 -117.5,69 -116.5,69 -115.5,69 -114.5,68.5 -114,68.5 -115,68.5 -115.5,68 -114.5,68 -114,67.5 -113,67.5 -112.5,67.5 -111.5,68 -111,68 -110,68 -109,67.5 -108.5,67.5 -107.5,66.5 -107.5,67.5 -107.5,68 -107,68 -106,68.5 -107,68.5 -108,68 -108.5,68.5 -108,68.5 -107,69 -106,69 -105,68.5 -104.5,68 -103.5,68 -102.5,68 -101.5,67.5 -100.5,68 -100,68 -99,67.5 -98,68 -97.5,67.5 -98.5,68 -97.5,68.5 -96.5,68 -96,67.5 -95.5,67 -96,67 -95.5,67 -95.5,68 -94.5,68 -93.5,68.5 -94.5,68.5 -94,69.5 -95,69.5 -95.5,70 -96.5,70 -96.5,70.5 -96,71.5 -95,72 -94.5,72|-82,63 -83,62 -83.5,62 -83.5,63 -82.5,63|-95.5,78 -94,78 -93,77.5 -94.5,77.5 -96,77.5|-93.5,75 -94.5,74.5 -95.5,75 -96,75 -95,75.5 -94.5,75.5 -93.5,75|-110,78.5 -110.5,78.5 -111,78.5 -112,78.5 -113,78.5 -112,78.5 -111.5,78.5 -110.5,79 -110,78.5|-105.5,73 -106,73.5 -107,73.5 -105.5,74 -104.5,73.5 -105.5,73|-100,74 -99,73.5 -98,74 -97.5,74 -98,73.5 -97,73 -96.5,72.5 -97,72 -98,71.5 -99,71.5 -99.5,72 -100.5,72 -101.5,72.5 -102,72.5 -102.5,73 -102,73 -101,72.5 -100,73 -101,73.5 -101.5,73.5 -100.5,73.5|-85,65.5 -84,65 -83,65 -82.5,64.5 -81.5,64 -81,64 -80.5,64 -81,63.5 -82,63.5 -83,64 -83.5,64 -84.5,63.5 -85.5,63 -86.5,63.5 -87,63.5 -86.5,64 -86,65 -86,65.5 -85,66|-75.5,68.5 -75,68 -76,67.5 -76.5,67 -77,68 -76.5,68.5 -75.5,68.5|-79.5,73.5 -78.5,73.5 -77.5,73.5 -76.5,73.5 -76,73 -77,73 -78,73 -79,73 -80,73 -80.5,73.5 -79.5,73.5|-97.5,76.5 -98,76 -98.5,75 -99,75 -100,75 -100.5,75.5 -99.5,75.5 -101,75.5 -102.5,75.5 -102,76 -101.5,76.5 -100,76 -99.5,76.5 -99,76.5 -98,76.5|-103.5,79.5 -102.5,79 -101.5,79 -100.5,79 -99.5,78.5 -99,78 -100,78 -101,78 -102,78.5 -102.5,78 -103.5,78.5 -105,78.5 -104,78.5 -104.5,79 -105.5,79 -104,79.5|-92,81 -90.5,80.5 -90,80.5 -89,80.5 -88.5,80 -87.5,80.5 -87,80 -86.5,79.5 -85,79.5 -86,79 -87,79 -87.5,78.5 -88.5,78.5 -89.5,78.5 -90.5,78.5 -91.5,78 -92.5,78.5 -93,78.5 -94,79 -93,79 -92,79.5 -92.5,79.5 -93.5,79.5 -94.5,79.5 -95.5,79.5 -94.5,79.5 -95.5,79.5 -96.5,80 -96,80 -94.5,80 -95.5,80 -96.5,80.5 -95.5,80.5 -95,80.5 -94,80.5 -95,81 -94.5,81 -94,81 -93,81.5 -92,81|-94.5,77 -93.5,77 -92.5,76.5 -91.5,76.5 -89.5,76.5 -90.5,76 -91.5,76 -90.5,76 -89.5,76 -89,75.5 -88,75.5 -87.5,75.5 -86.5,75.5 -85.5,75.5 -84.5,75.5 -83.5,76 -82.5,76 -81.5,76 -80.5,75.5 -79.5,75.5 -80.5,75 -79.5,75 -80.5,74.5 -81,74.5 -82,74.5 -82.5,74.5 -83.5,75 -84,74.5 -85,74.5 -86,74.5 -86.5,74.5 -87.5,74.5 -88.5,74.5 -89.5,74.5 -90.5,74.5 -91,74.5 -92,74.5 -92,75.5 -92.5,76 -93.5,76.5 -94.5,76.5 -95.5,76.5 -96.5,76.5 -95.5,77 -94.5,77|-96,78.5 -95,78.5 -95.5,78 -96.5,78 -97.5,78 -98,78.5 -97,79 -96.5,78.5|-110.5,78 -109.5,78 -110.5,78 -112,77.5 -113,77.5 -112.5,78 -111,78 -110.5,78|-115.5,77.5 -116,77 -117,76.5 -117.5,76.5 -118,77 -119,76 -119.5,76 -120.5,76 -121.5,76 -122,76 -121,76.5 -120.5,77 -120,77 -119,77.5 -118,77.5 -117,77.5 -116,77.5|-108.5,76 -107,76 -106.5,76 -105.5,76 -106,75 -106.5,75 -107.5,75 -108,75 -109,75 -110,75 -111,74.5 -111.5,74.5 -112.5,74.5 -113.5,74.5 -114,74.5 -113.5,75 -112,75 -111.5,75 -112,75 -113,75 -113.5,75 -114.5,75.5 -115,75 -116,75 -117,75 -117.5,75 -116,75.5 -115.5,75.5 -116,75.5 -117,75.5 -116,76 -116.5,76 -116,76 -115,76 -115.5,76 -115,76.5 -114,76.5 -113.5,76 -112.5,76 -111.5,76 -110.5,75.5 -109,75.5 -110,76 -109.5,76.5 -109,77 -108,76.5|-93,74 -92.5,74 -91,74 -91.5,73 -93.5,73 -94,73 -93.5,72.5 -94,72 -95,72 -95.5,73 -95.5,73.5 -94.5,73.5 -94,74 -93,74|-97.5,69.5 -96.5,69.5 -96,69 -95.5,69 -96.5,68.5 -97,68.5 -98,68.5 -99,69 -99.5,69 -98.5,69 -98.5,70 -97.5,69.5|-114.5,72.5 -113.5,72.5 -113,73 -112,73 -111.5,72.5 -110.5,72.5 -109.5,73 -109,72.5 -108.5,72 -107.5,72 -108,72.5 -108,73 -107.5,73.5 -106.5,73 -105.5,73 -105,72 -104.5,71.5 -104,70.5 -103,70.5 -102,70.5 -101,70 -102,69.5 -102.5,69.5 -103.5,69.5 -102.5,69.5 -103,69 -104.5,69 -105.5,69 -106.5,69 -107,69 -108,69 -108.5,69 -109.5,68.5 -110.5,68.5 -111.5,68.5 -112.5,68.5 -113,68.5 -113.5,69 -114.5,69.5 -115.5,69.5 -116.5,69.5 -117,70 -115.5,70.5 -114.5,70.5 -113.5,70.5 -112.5,70 -112,70.5 -113,70.5 -114,70.5 -114.5,70.5 -115.5,70.5 -116,70.5 -117,70.5 -118.5,71 -117.5,71 -116.5,71.5 -115.5,71.5 -117,71.5 -117.5,71.5 -118.5,71.5 -118,72.5 -117.5,73 -116.5,73 -115.5,73 -114.5,73.5 -114.5,72.5|-119.5,74 -119,74 -118,74.5 -117,74 -116,73.5 -117,73 -118,73 -119,72.5 -120,72 -120.5,71.5 -121.5,71.5 -122,71.5 -123,71 -124,71.5 -125,72 -126,72 -125.5,72.5 -124.5,73 -124,73.5 -124.5,74 -123.5,74.5 -122.5,74.5 -121.5,74.5 -121,74.5 -120,74.5|-55.5,51.5 -56,51 -56.5,50 -56,50 -55.5,49.5 -54.5,49.5 -54,49.5 -54,48.5 -53,48.5 -53.5,48 -53,48 -53,47 -53.5,47 -54,48 -54.5,47.5 -55.5,47 -55,47.5 -56,47.5 -56.5,47.5 -57.5,47.5 -58,47.5 -59,47.5 -58.5,48.5 -58.5,49 -57.5,50 -57,50.5 -56.5,51.5 -56,51.5|-45,82 -46,82.5 -47.5,82.5 -46.5,82.5 -45.5,82.5 -45,82|-30,83.5 -29,83.5 -27.5,83.5 -26,83.5 -27.5,83 -30,83 -31.5,83 -30.5,83 -29,83 -28,83 -27,83 -26,83 -25,83 -24,83 -22.5,83 -21.5,82.5 -22.5,82.5 -24,82.5 -29.5,82 -29,82 -28,82 -27,82 -25,82 -24.5,81.5 -23.5,82 -22.5,82 -21.5,82 -21.5,81.5 -22.5,81 -23,81 -22,81 -21,81 -20,81.5 -19,81.5 -18,81.5 -17,81.5 -16.5,82 -15.5,82 -14,82 -13,81.5 -12,81.5 -13,81 -14,81 -15,80.5 -16,80.5 -17,80.5 -16,80.5 -17,80 -17.5,80 -18.5,80 -19.5,80.5 -20,80 -19.5,80 -19.5,79 -20.5,79 -21,78.5 -21.5,78 -20.5,78 -19.5,77.5 -20.5,77.5 -20,77.5 -19,77.5 -19.5,77 -20.5,77 -21.5,76.5 -22.5,77 -21.5,76.5 -20.5,76 -20,76 -19.5,75 -20.5,75.5 -21,75 -22,75 -21,75 -20.5,75 -19.5,74.5 -20.5,74 -21.5,74 -22.5,74 -21.5,74 -20.5,74 -21.5,73.5 -22,73.5 -23,73.5 -24,73.5 -25,73.5 -25.5,74 -26,73.5 -27.5,73.5 -26.5,73.5 -27.5,73 -27,73 -26,73 -25,73.5 -24,73.5 -23,73 -22.5,73 -22,72.5 -23,72.5 -24,72.5 -24.5,73 -26,73 -26.5,72.5 -25.5,73 -25,73 -24,72.5 -23.5,72 -22.5,72 -22.5,71 -21.5,71 -22,70.5 -22.5,71 -23.5,70.5 -24,71 -25,71.5 -25.5,71.5 -26.5,71.5 -26,71.5 -26.5,71 -27.5,71 -28.5,70.5 -27.5,70.5 -26.5,70.5 -27.5,70 -27,70 -25.5,70.5 -24.5,70.5 -24,70 -23,70 -22.5,70 -23,70 -24,69.5 -24.5,69.5 -25.5,69 -26.5,68.5 -27,68.5 -28,68.5 -29,68.5 -29.5,68.5 -30.5,68.5 -31.5,68 -32,68.5 -33,67.5 -33.5,67.5 -34,66.5 -35,66.5 -36,66 -36.5,66 -37.5,65.5 -38,65.5 -37.5,66 -38,66.5 -38,65.5 -39,65.5 -40,65.5 -40.5,65 -40.5,64.5 -41,64.5 -40.5,64 -41.5,63 -42,63 -42.5,62.5 -42,62 -42.5,61 -43,60.5 -44,60.5 -43,60 -44,60 -45.5,60 -44.5,60.5 -45.5,60.5 -46,61 -47,61 -47.5,61 -48.5,61 -49,61.5 -50,62.5 -50,63 -50.5,63 -51.5,63.5 -51,64 -51.5,64 -51,64.5 -50.5,64.5 -51,64.5 -52,64.5 -52,65 -51.5,65.5 -53,65.5 -52.5,66.5 -51.5,66.5 -52.5,66.5 -53,66 -52.5,67 -53.5,67 -53,67.5 -52,67.5 -50.5,67.5 -52,67.5 -52.5,68 -53.5,67.5 -53,68 -52,68 -51.5,68 -52,68 -53,68.5 -52.5,68.5 -52,68.5 -51,68.5 -50.5,69 -50.5,70 -51.5,70 -52.5,70 -53,70.5 -54,70.5 -54.5,70.5 -53.5,71 -52.5,70.5 -52,70.5 -51,70.5 -51.5,71 -52,71 -53,71 -52,71.5 -52.5,71.5 -53.5,71.5 -54.5,71.5 -55,71.5 -55.5,72 -55,72.5 -55.5,73 -56,73.5 -56.5,74 -57,75 -58,75 -58.5,75.5 -59.5,76 -60,76 -61,76 -61.5,76 -62.5,76.5 -63.5,76.5 -64,76 -64.5,76 -65.5,76 -66.5,76 -68,76 -69,76.5 -68,76.5 -69.5,76.5 -70,77 -71,77 -69.5,77 -69,77 -68,77.5 -67,77.5 -68,77.5 -69,77.5 -70,77.5 -71,78 -72,78 -72.5,78.5 -72,78.5 -71,78.5 -70,79 -69,79 -68,79 -66.5,79 -66,79 -65,79.5 -64,80 -65,80 -66,80 -67,80 -66,80.5 -65.5,81 -64.5,81 -64,81 -63,81 -62.5,81 -61.5,81 -61,82 -59.5,82 -58.5,81.5 -57.5,81.5 -56.5,81.5 -58,81.5 -58.5,82 -59.5,82 -57.5,82 -56.5,82 -55.5,82 -54.5,82.5 -54,82 -53.5,82 -53,82.5 -52,82 -51,82 -50,82 -50.5,82 -50,82.5 -49,82.5 -47.5,82 -46.5,82 -45.5,82 -44.5,82 -44.5,82.5 -45.5,82.5 -42.5,82.5 -42,82.5 -44,83 -45.5,83 -46.5,83 -45.5,83 -44.5,83 -43,83.5 -42.5,83 -41.5,83 -40.5,83.5 -39.5,83.5 -39,83 -38,83 -37,83.5 -35.5,83.5 -34.5,83.5 -33.5,83.5 -30.5,83.5";
