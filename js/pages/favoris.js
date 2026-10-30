// ══════════════════════════════════════════════════════════════════════
//  Mes favoris (RNT-250, D242) — EcranFavoris de l'iPhone.
//
//  L'étoile des fiches (configurateur d'un modèle, modèle de montre,
//  achat d'un bien), même quand il n'est pas en vente ; la page « Mes
//  favoris », depuis Actifs : chacun avec son état (en vente, aux
//  enchères, bientôt, absent et quand il revient) et le lien vers
//  l'offre. Le moteur surveille les arrivées et les annonce une fois
//  (tableau « favoris », décisions de la famille « favoris »,
//  commande « favoris.avis » lue par app.js pour la notification).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "../format.js";
import { carte, entetePousse } from "../ui.js";
import { chargerPhotos } from "./catalogues.js";
import { facade } from "./immobilier.js";
import { vitrine } from "./vehicules.js";
import { vitrineMontre } from "./montres.js";

const ETOILE = '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>';
/** L'étoile : pleine quand le favori est posé. */
export const etoile = (plein) => `<svg class="fv-etoile-svg" viewBox="0 0 24 24" fill="${plein ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true">${ETOILE}</svg>`;

const contexte = (ctx) => ctx ?? globalThis.__grind?.ctx;

/** Ce favori est-il posé ? (l'état du jeu porte les clés « vehicule:… », « montre:… », « bien:… »). */
export const estFavori = (ctx, genre, id) => (contexte(ctx)?.etat.jeu?.favoris ?? []).includes(`${genre}:${id}`);

/** Le bouton d'une fiche : « Favori » (une étoile), à côté de « Épingler ». Action globale « favori ». */
export function boutonFavori(ctx, genre, id) {
  const pose = estFavori(ctx, genre, id);
  return `<button class="petit fv-bouton ${pose ? "pose" : ""}" data-action="favori" data-genre="${esc(genre)}" data-id="${esc(id)}" aria-pressed="${pose}"
    aria-label="${pose ? "Retirer des favoris" : "Ajouter aux favoris : prévenu quand il arrive sur le marché"}">${etoile(pose)}${pose ? "En favori" : "Favori"}</button>`;
}

/** RNT-275 : l'étoile d'une carte de liste (un bien absent ou « à venir » ne s'ouvre pas : c'est là qu'on le met en favori). */
export function etoileCarte(ctx, genre, id, absent = false) {
  const pose = estFavori(ctx, genre, id);
  return `<button class="fv-carte ${pose ? "pose" : ""} ${absent ? "absent" : ""}" data-action="favori" data-genre="${esc(genre)}" data-id="${esc(id)}" aria-pressed="${pose}"
    aria-label="${pose ? "Retirer des favoris" : "Ajouter aux favoris : prévenu quand il arrive sur le marché"}">${etoile(pose)}</button>`;
}

/** Pose ou retire (action globale « favori »). */
export function basculerFavori(ctx, b) {
  const genre = b.dataset.genre, id = b.dataset.id;
  const pose = estFavori(ctx, genre, id);
  return ctx.decider("favoris", { [pose ? "retirer" : "poser"]: { genre, id } },
    { succes: pose ? "Retiré de tes favoris" : "En favori : tu seras prévenu quand il arrive sur le marché", fermer: false });
}

/** L'offre d'un favori (ou sa fiche) : la page où l'acheter, dans Actifs. */
export function ouvrirOffre(ctx, cible) {
  if (!cible) return;
  if (cible.sorte === "enchere") return ctx.ouvrir("encheres", { vente: String(cible.id) }, { onglet: "actifs" });
  const s = String(cible.id), k = s.indexOf(":");
  const quoi = s.slice(0, k), id = s.slice(k + 1);
  const page = { vehicule: "configurateur", montre: "modeleMontre", bien: "achat", occasion: "occasion", annonceMontre: "annoncesMontres" }[quoi];
  if (!page) return ctx.ouvrir("favoris", {}, { onglet: "actifs" });
  return ctx.ouvrir(page, page === "annoncesMontres" ? {} : { id }, { onglet: "actifs" });
}

// MARK: - La page

function vignette(l) {
  if (l.apparence) return vitrineMontre(l.apparence, { hauteur: 52, largeur: 52 });
  if (l.photoSorte === "vehicule") return vitrine({ forme: l.silhouette ?? "sportive", teinte: l.teinte ?? "#8A8F98", rarete: l.rarete, hauteur: 52, largeur: 52, photo: l.photo ?? "" });
  if (l.photoSorte === "bien") return facade({ icone: l.icone, rarete: l.rarete, hauteur: 52, largeur: 52, photo: l.photo ?? "" });
  return `<span class="fv-symbole" aria-hidden="true">${etoile(true)}</span>`;
}

const TONS = { enVente: "gain", encheres: "or", bientot: "accent", absent: "t2" };

function ligneFavori(l) {
  const detail = [l.detail, l.rarete > 0 ? l.rareteNom : ""].filter(Boolean).join(" · ");
  return `<div class="fv-ligne" data-cle="${esc(l.id)}">
    <button class="fv-ouvrir" data-action="offre" data-id="${esc(l.id)}">
      <span class="fv-vignette">${vignette(l)}</span>
      <span class="fv-corps"><span class="fv-nom">${esc(l.nom)}</span>
        ${detail ? `<span class="fv-detail">${esc(detail)}</span>` : ""}
        <span class="fv-etat ${TONS[l.etat] ?? "t2"}">${esc(l.etatTexte)}</span></span>
    </button>
    <button class="fv-retirer" data-action="favori" data-genre="${esc(l.genre)}" data-id="${esc(l.cle)}" aria-pressed="true" aria-label="Retirer ${esc(l.nom)} des favoris">${etoile(true)}</button>
  </div>`;
}

function section(titre, l) {
  if (!l.length) return "";
  return `<section class="fv-section"><h2 class="fv-titre">${esc(titre)}</h2>${carte(l.map(ligneFavori).join(`<div class="filet"></div>`))}</section>`;
}

function rendre(d) {
  const t = d.t;
  if (!t) return `${entetePousse("Mes favoris")}<p class="aide">Tes favoris s'ouvrent avec ta première saison.</p>`;
  const la = t.lignes.filter((l) => l.etat !== "absent");
  const absents = t.lignes.filter((l) => l.etat === "absent");
  return `${entetePousse("Mes favoris")}
  <div class="fv-page">
    <p class="aide">Touche l'étoile d'un modèle ou d'un bien, même absent du marché : dès qu'il arrive (concession, chantier naval, horlogerie, agence, salle des ventes), tu es prévenu, une fois.</p>
    ${t.lignes.length ? `${section("Sur le marché", la)}${section("Absents", absents)}`
      : carte(`<div class="fv-vide"><span class="fv-symbole" aria-hidden="true">${etoile(false)}</span><p class="aide">Aucun favori pour l'instant. Les pièces rares (✦ Onyx et au-delà) ne passent que certaines semaines : mets-les en favori depuis leur fiche.</p></div>`)}
  </div>`;
}

export const pages = {
  favoris: {
    titre: "Mes favoris",
    css: ["favoris", "catalogues"],
    async donnees(ctx) {
      const [t] = await Promise.all([ctx.tableau("favoris"), chargerPhotos()]);
      return { t };
    },
    rendu: rendre,
    actions: {
      offre(ctx, b, d) {
        const l = d.t?.lignes.find((x) => x.id === b.dataset.id);
        if (l) return ouvrirOffre(ctx, l.offre ?? l.fiche);
      },
    },
  },
};
