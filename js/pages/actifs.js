// ══════════════════════════════════════════════════════════════════════
//  Onglet Actifs (EcranActifs, EcransEntreprises.swift) : « Tes actifs
//  valent », puis les cinq parts à égalité, en tuiles (RNT-40, RNT-176,
//  RNT-188) : Entreprises, Immobilier, Véhicules, Bateaux, Montres, chacune
//  avec son objet et sa valeur ; touchée, elle ouvre son panneau. Chaque
//  panneau vient de sa zone (entreprises.js, immobilier.js…), qui exporte
//  `section`. Le « ? » ouvre le tutoriel des actifs.
//
//  RNT-221 : sous les parts, la salle des ventes unique (toutes les enchères).
//
//  En paysage et sur grand écran (D89) : la valeur et les parts à gauche,
//  le contenu de la part à droite.
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js";
import * as entreprises from "./entreprises.js";
import * as immobilier from "./immobilier.js";
import * as vehicules from "./vehicules.js";
import * as montres from "./montres.js";
import * as bateaux from "./bateaux.js";
import { vibrer } from "../sons.js";
import { boutonAide, chiffreAnime, carte, ligne } from "../ui.js";

// RNT-176 : la quatrième part, les montres. RNT-188 : la cinquième, les bateaux.
const SECTIONS = { entreprises, immobilier, vehicules, bateaux, montres };
const T = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
/** OngletActifs : le nom et l'objet de chaque part. */
const PARTS = [
  ["entreprises", "Entreprises", '<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20.5v-6h6v6"/>'],
  ["immobilier", "Immobilier", '<path d="M4 21V5l7-2v18M11 21V9l9 2.5V21M7 8h.01M7 12h.01M7 16h.01M15 14h.01M15 17.5h.01"/>'],
  ["vehicules", "Véhicules", '<path d="M3 15.5v-2.5l2.5-1 2.5-3.5h6l3.5 3.5 3 .8v2.7z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>'],
  ["bateaux", "Bateaux", '<path d="M11 3v13H5zM13 6l5.5 10H13zM3 18.5h18l-2 2.5H5z"/>'],
  ["montres", "Montres", '<rect x="7" y="7" width="10" height="10" rx="5"/><path d="M9 7l.8-4h4.4l.8 4M9 17l.8 4h4.4l.8-4M12 9.5V12l1.5 1"/>'],
];
/** RNT-250 : l'étoile de Mes favoris. */
const ETOILE = T('<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>');
const lire = () => { try { const v = localStorage.getItem("actifs.onglet"); return SECTIONS[v] ? v : "entreprises"; } catch { return "entreprises"; } };

export const pages = {
  actifs: {
    titre: "Actifs",
    css: ["actifs", "catalogues"], // lot A : css/pages/actifs.css ; les parts montrent les photos des catalogues
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
      } : null;
      return { choix, d, valeurs, permisEnCours: garage?.permisEnCours ?? 0, favoris: (ctx.etat.jeu?.favoris ?? []).length };
    },
    rendu(d, ctx) {
      const s = SECTIONS[d.choix]?.section;
      const entete = `<header class="entete-racine at-entete"><h1 class="titre-onglet">Actifs</h1>${boutonAide("entreprises")}</header>`;
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
            ${/* RNT-221 : la salle des ventes unique, en tête des actifs : toutes les enchères, toutes les familles.
                 RNT-227 : juste dessous, la seule entrée des permis (voiture, moto, bateau, avion, hélico). */""}
            ${carte(ligne({ titre: "Salle des ventes", detail: "Biens, véhicules, bateaux, montres : toutes les enchères", page: "encheres",
              icone: immobilier.ico.marteau, teinte: "var(--grandir)" })
              + ligne({ titre: d.permisEnCours > 0 ? `Permis (${d.permisEnCours} en cours)` : "Permis", detail: "Route, eau, airs : s'inscrire, réviser, passer l'examen",
                page: "permis", icone: immobilier.ico.permis, teinte: "var(--equipe)" })
              // RNT-250 : Mes favoris : être prévenu quand un modèle ou un bien voulu arrive sur le marché.
              + ligne({ titre: d.favoris ? `Mes favoris (${d.favoris})` : "Mes favoris", detail: "Prévenu dès qu'un modèle ou un bien voulu arrive",
                page: "favoris", icone: ETOILE, teinte: "var(--or)" }), { classe: "at-ventes" })}
          </div>
          <div class="at-section" role="tabpanel">${s ? s.rendu(d.d, ctx) : `<div class="vide">Bientôt sur le web.</div>`}</div>
        </div></div>`;
    },
    // Lot A : au palier moyen et large, toute la largeur (.page.ample) ; les colonnes viennent de actifs.css.
    renduLarge(d, ctx, p) { return pages.actifs.rendu(d, ctx, p); },
    apres(ctx, d) {
      // « Tes actifs valent » roule tout seul (chiffreAnime, mis à jour en place par patcher).
      // Les pages des parts peuvent avoir leur propre `apres`.
      SECTIONS[d.choix]?.section?.apres?.(ctx, d.d);
    },
    actions: new Proxy({
      sectionActifs(ctx, b) {
        if (b.dataset.valeur === lire()) return;
        try { localStorage.setItem("actifs.onglet", b.dataset.valeur); } catch {}
        vibrer();
        // La tuile choisie s'allume tout de suite, le panneau suit dès qu'il est lu.
        document.querySelectorAll(".at-part").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        ctx.rafraichir();
      },
    }, {
      // Les actions des parts passent par la page Actifs.
      get(cible, nom) {
        if (nom in cible) return cible[nom];
        for (const m of Object.values(SECTIONS)) if (m.section?.actions?.[nom]) return (ctx, el, d, p) => m.section.actions[nom](ctx, el, d?.d, p);
        return undefined;
      },
    }),
  },
};
