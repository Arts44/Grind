// ══════════════════════════════════════════════════════════════════════
//  Onglet Actifs (EcranActifs, EcransEntreprises.swift) : « Tes actifs
//  valent », puis les cinq parts à égalité, en tuiles (RNT-40, RNT-176,
//  RNT-188, D341) : Entreprises, Immobilier, Véhicules, Bateaux, Montres,
//  Marchés (ce n'est plus un onglet), chacune
//  avec son objet et sa valeur ; touchée, elle ouvre son panneau. Chaque
//  panneau vient de sa zone (entreprises.js, immobilier.js…), qui exporte
//  `section`. Le « ? » ouvre le tutoriel des actifs.
//
//  RNT-221 : sous les parts, la salle des ventes unique (toutes les enchères).
//
//  En paysage et sur grand écran (D89) : la valeur et les parts à gauche,
//  le contenu de la part à droite.
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js?v=3e8bddd9";
import * as entreprises from "./entreprises.js?v=3e8bddd9";
import * as immobilier from "./immobilier.js?v=3e8bddd9";
import * as vehicules from "./vehicules.js?v=3e8bddd9";
import * as montres from "./montres.js?v=3e8bddd9";
import * as bateaux from "./bateaux.js?v=3e8bddd9";
import * as marches from "./marches.js?v=3e8bddd9"; // D341 : les marchés, une part d'Actifs
import { vibrer } from "../sons.js?v=3e8bddd9";
import { boutonAide, chiffreAnime, carte, ligne, boutonPanneau, teintes } from "../ui.js?v=3e8bddd9";

// RNT-176 : la quatrième part, les montres. RNT-188 : la cinquième, les bateaux. D341 : la sixième, les marchés.
const SECTIONS = { entreprises, immobilier, vehicules, bateaux, montres, marches };
const T = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/** OngletActifs : le nom et l'objet de chaque part. */
const PARTS = [
  ["entreprises", "Entreprises", '<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20.5v-6h6v6"/>'],
  ["immobilier", "Immobilier", '<path d="M4 21V5l7-2v18M11 21V9l9 2.5V21M7 8h.01M7 12h.01M7 16h.01M15 14h.01M15 17.5h.01"/>'],
  ["vehicules", "Véhicules", '<path d="M3 15.5v-2.5l2.5-1 2.5-3.5h6l3.5 3.5 3 .8v2.7z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>'],
  ["bateaux", "Bateaux", '<path d="M11 3v13H5zM13 6l5.5 10H13zM3 18.5h18l-2 2.5H5z"/>'],
  ["montres", "Montres", '<rect x="7" y="7" width="10" height="10" rx="5"/><path d="M9 7l.8-4h4.4l.8 4M9 17l.8 4h4.4l.8-4M12 9.5V12l1.5 1"/>'],
  ["marches", "Marchés", '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'],
];
/** RNT-374 (D380) : la rosette de la Collection. */
/** RNT-250 : l'étoile de Mes favoris. */
const ETOILE = T('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>');
const lire = () => { try { const v = localStorage.getItem("actifs.onglet"); return SECTIONS[v] ? v : "entreprises"; } catch { return "entreprises"; } };

/**
 * RNT-312 : un seul bloc d'actions en tête de chaque part, avec ce qui a du sens pour elle.
 * RNT-221 : la salle des ventes unique (toutes les enchères, toutes les familles).
 * RNT-227 : la seule entrée des permis (voiture, moto, bateau, avion, hélico). Mes favoris : RNT-250.
 * `propres` : les lignes propres à la part (concession, chantier naval…), déjà rendues.
 */
function blocActions(d, { propres = [], permis = false, salle = true } = {}) {
  const lignes = [...propres];
  // D396 : plus de ligne « Collection » (Personnaliser s'ouvre seulement depuis le profil).
  if (permis) {
    lignes.push(ligne({ titre: d.permisEnCours > 0 ? `Permis (${d.permisEnCours} en cours)` : "Permis", detail: "Route, eau, airs : s'inscrire, réviser, passer l'examen",
      page: "permis", icone: immobilier.ico.permis, teinte: "var(--equipe)" }));
  }
  if (salle) {
    lignes.push(ligne({ titre: "Salle des ventes", detail: "Biens, véhicules, bateaux, montres : toutes les enchères", page: "encheres",
      icone: immobilier.ico.marteau, teinte: "var(--grandir)" }));
    lignes.push(ligne({ titre: d.favoris ? `Mes favoris (${d.favoris})` : "Mes favoris", detail: "Prévenu dès qu'un modèle ou un bien voulu arrive",
      page: "favoris", icone: ETOILE, teinte: "var(--or)" }));
  }
  return lignes.length ? carte(lignes.join(""), { classe: "at-ventes" }) : "";
}

export const pages = {
  actifs: {
    titre: "Actifs",
    css: ["actifs", "catalogues", "marches", "entreprises"], // D358 : la part Boîtes (entreprises.css) ; D341 : la part Marchés // lot A : css/pages/actifs.css ; les parts montrent les photos des catalogues
    async donnees(ctx) {
      const choix = lire();
      const s = SECTIONS[choix]?.section;
      // Un tableau demandé deux fois (la valeur des entreprises et leur panneau) n'est calculé qu'une fois.
      const memo = new Map();
      const c = Object.create(ctx);
      c.tableau = (nom, p = {}) => { const k = nom + JSON.stringify(p); if (!memo.has(k)) memo.set(k, ctx.tableau(nom, p)); return memo.get(k); };
      // RNT-129 : la valeur des biens se lit sans construire le tableau de l'immobilier (800 annonces).
      const [ent, rep, garage, flotte, d] = await Promise.all([c.tableau("entreprises"), c.tableau("repartition"), c.tableau("garage"), c.tableau("flotte"),
        s?.donnees ? s.donnees(c) : null]);
      const part = (n) => rep?.parts?.find((x) => x.nature === n)?.montant ?? 0;
      const valeurs = ent ? {
        entreprises: ent.valeurTotale ?? 0, immobilier: part("immobilier"), vehicules: garage?.valeurTotale ?? 0,
        bateaux: flotte?.valeurTotale ?? 0, montres: part("montres"),
        marches: part("bourse"), // D341 : le compte-titres, comme la part Bourse de la répartition
      } : null;
      return { choix, d, valeurs, permisEnCours: garage?.permisEnCours ?? 0, favoris: (ctx.etat.jeu?.favoris ?? []).length };
    },
    rendu(d, ctx) {
      const s = SECTIONS[d.choix]?.section;
      // D345 (vidéo 5) : le « + » qui devient panneau : créer, reprendre, acheter (EcranActifs.optionsAjout).
      const ajout = d.valeurs ? boutonPanneau({ libelle: "Ajouter un actif", titre: "Ajouter", options: [
        { titre: "Fonder une boîte", detail: "En huit étapes, du secteur aux statuts", icone: "boite", teinte: teintes.grandir, action: "panneauFonder" },
        { titre: "Racheter une boîte", detail: "En activité, en faillite, chez les joueurs", icone: "verrou", teinte: teintes.equipe, page: "reprises" }, // RNT-344 (D402)
        { titre: "Acheter un bien", icone: "maison", teinte: teintes.argent, action: "panneauPart", donnees: { valeur: "immobilier" } },
        { titre: "Acheter un véhicule", icone: "voiture", teinte: teintes.vente, action: "panneauPart", donnees: { valeur: "vehicules" } },
        { titre: "Acheter une montre", icone: "focus", teinte: teintes.image, action: "panneauPart", donnees: { valeur: "montres" } },
        { titre: "Passer un ordre en bourse", icone: "marches", teinte: teintes.controles, action: "panneauPart", donnees: { valeur: "marches" } },
      ] }) : "";
      const entete = `<header class="entete-racine at-entete"><h1 class="titre-onglet">Actifs</h1><div class="rangee">${ajout}${boutonAide(d.choix === "marches" ? "marches" : "entreprises")}</div></header>`;
      if (!d.valeurs) return `<div class="at-page">${entete}<p class="aide">Les actifs s'ouvrent avec ta première saison.</p></div>`;
      const total = Object.values(d.valeurs).reduce((a, b) => a + b, 0);
      return `<div class="at-page">${entete}
        <div class="at-corps">
          <div class="at-resume">
            <div class="at-total" aria-label="Tes actifs valent ${esc(montant(total))}" role="group">
              <span class="at-total-titre">Tes actifs valent</span>
              <span class="at-total-v chiffres" id="at-total" aria-hidden="true">${chiffreAnime(total)}</span>
            </div>
            <div class="at-parts" role="tablist" aria-label="Les parts de tes actifs">${PARTS.map(([id, nom, objet]) => {
              const choisie = id === d.choix;
              return `<button class="at-part" role="tab" data-action="sectionActifs" data-valeur="${id}" aria-selected="${choisie}" aria-label="${esc(nom)}, ${esc(montant(d.valeurs[id]))}">
                <span class="at-objet">${T(objet)}</span><span class="at-nom">${esc(nom)}</span><span class="at-valeur chiffres">${montant(d.valeurs[id])}</span></button>`;
            }).join("")}</div>
          </div>
          <div class="at-section" role="tabpanel">${s ? s.rendu(d.d, ctx, (o) => blocActions(d, o)) : `<div class="vide">Bientôt sur le web.</div>`}</div>
        </div></div>`;
    },
    // Lot A : au palier moyen et large, toute la largeur (.page.ample) ; les colonnes viennent de actifs.css.
    renduLarge(d, ctx, p) { return pages.actifs.rendu(d, ctx, p); },
    apres(ctx, d) {
      // « Tes actifs valent » roule tout seul (chiffreAnime, mis à jour en place par patcher).
      // Les pages des parts peuvent avoir leur propre `apres`.
      SECTIONS[d.choix]?.section?.apres?.(ctx, d.d);
    },
    /** D341 : le « tic » de la part montrée (les cours des marchés glissent toutes les 5 secondes). */
    tic(ctx, d) { return SECTIONS[d?.choix]?.section?.tic?.(ctx, d?.d); },
    actions: new Proxy({
      // D345 : « Fonder une boîte » depuis le « + » (le même départ que le bouton de la part Entreprises).
      panneauFonder(ctx) { return entreprises.section.actions.entNouvelleBoite(ctx); },
      panneauPart(ctx, b) { return pages.actifs.actions.sectionActifs(ctx, b); },
      sectionActifs(ctx, b) {
        if (b.dataset.valeur === lire()) return;
        try { localStorage.setItem("actifs.onglet", b.dataset.valeur); } catch {}
        vibrer();
        // La tuile choisie s'allume tout de suite, le panneau suit dès qu'il est lu.
        document.querySelectorAll(".at-part").forEach((x) => x.setAttribute("aria-selected", String(x.dataset.valeur === b.dataset.valeur)));
        ctx.rafraichir();
      },
    }, {
      // Les actions des parts passent par la page Actifs.
      get(cible, nom) {
        if (nom in cible) return cible[nom];
        // D341 : la part montrée d'abord (les marchés ont « chercher », « trier »… comme d'autres parts).
        const ici = SECTIONS[lire()]?.section?.actions?.[nom];
        if (ici) return (ctx, el, d, p) => SECTIONS[lire()].section.actions[nom](ctx, el, d?.d, p);
        for (const m of Object.values(SECTIONS)) if (m.section?.actions?.[nom]) return (ctx, el, d, p) => m.section.actions[nom](ctx, el, d?.d, p);
        return undefined;
      },
    }),
  },
};
