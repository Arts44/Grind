// ══════════════════════════════════════════════════════════════════════
//  Onglet Accueil (EcranAccueil.swift, ObjetsAccueil.swift).
//
//  L'en-tête (l'emblème, le « ? », le monde en ligne, les amis, les
//  événements, l'avatar), puis le coffre : la roue tourne avec le
//  patrimoine, le chiffre héros compte jusqu'à sa valeur, la variation de
//  la semaine, l'horizon et la courbe du mois. Dessous, la carte « Ici »,
//  les raccourcis (ce qui demande ton attention), les quatre tuiles à
//  objets, la faim, le train de vie, le plan du monde autour de toi et
//  les combines ; la dernière semaine, le temps qui reste, et le dernier
//  jour ta place en direct.
//
//  Les blocs montent de 14 px, décalés de 0,1 s, à l'ouverture (pas aux
//  rafraîchissements). Grand écran : le coffre à gauche, Ici, raccourcis
//  et tuiles à droite, le plan en bande dessous (D89, inventaire § 4).
// ══════════════════════════════════════════════════════════════════════
import { variation, esc } from "../format.js";
import { courbe, bouton, icones, boutonAide, chiffreAnime } from "../ui.js";
import { tuileFaim, mangerIci } from "./manger.js";
import { carteIci } from "../ici.js"; // RNT-195
import { tuileTrainDeVie } from "./trainvie.js";
import { carteRevenus } from "./revenus.js"; // RNT-272
import { symbole, silhouette } from "./vie.js";
import { avatarJoueur } from "../compte-local.js";
import * as L from "../enligne.js";
import { jaugeAccueil } from "./recompenses.js"; // RNT-231

/** PartRepartition.Nature : la couleur du prototype et le symbole de la pile. */
const NATURES = {
  liquidites: ["Liquidités", "#6CC7EC", '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/>'],
  bourse: ["Bourse", "#4F9BE8", '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'],
  immobilier: ["Immobilier", "#9D8CFF", '<path d="M3.5 10.5 12 3.5l8.5 7V20h-17z"/>'],
  entreprises: ["Entreprises", "#FFB547", '<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10H3zM9 20v-6h6v6"/>'],
  vehicules: ["Véhicules", "#FF8A65", '<path d="M5 16l1.5-5.5h11L19 16M3 15h18v4H3z"/>'],
  montres: ["Montres", "#E8C77A", '<rect x="7" y="7" width="10" height="10" rx="5"/><path d="M9 7l.8-4h4.4l.8 4M9 17l.8 4h4.4l.8-4"/>'],
};
/** CategorieAction : la lueur de chaque tuile. */
const TEINTES = { image: "#E76FA3", grandir: "#6A6FE0", argent: "#3FBF85", equipe: "#5B8DEF", vente: "#F0954A", controles: "#9D7BEA", danger: "#E5534B" };

const T = (d, t = 18, extra = "") => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICONES = {
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5S14.5 17.9 12 20.5M12 3.5C9.5 6.1 8.4 8.9 8.4 12s1.1 5.9 3.6 8.5"/>',
  alerte: '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  duo: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
  cloche: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>',
  clocheBadge: '<path d="M6 16V11a6 6 0 0 1 9-5.2M18 11v5l1.5 2h-15M10 20a2 2 0 0 0 4 0"/><circle cx="18.5" cy="6" r="2.5" fill="currentColor"/>',
  drapeau: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  sablier: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  masques: '<path d="M4 6c3 1 13 1 16 0v5a8 8 0 0 1-16 0zM8.5 11h2M13.5 11h2M9.5 15.5c1.5 1 3.5 1 5 0"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  liste: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17.5" r="1"/>',
};
const CŒUR = '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="currentColor" stroke="none"/>';
const CŒUR_BRISE = '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="currentColor" stroke="none"/><path d="M4 4l16 16" stroke="var(--fond)" stroke-width="2.4"/>';

let affiche = null; // le patrimoine affiché par le compteur (il part de 0 la première fois)

export const pages = {
  accueil: {
    titre: "Accueil",
    css: ["accueil", "compte", "manger", "cosmetiques"], // lot A : css/pages/accueil.css, compte.css (l'avatar) ; RNT-210 : manger ici (manger.js)
    async donnees(ctx) {
      // RNT-190 : le train de vie a sa tuile, sous la faim ; RNT-140 : les boîtes à voir pour les raccourcis.
      const [fin, monde, vie, entreprises, enLigne, notifications] = await Promise.all([ctx.tableau("finDeSaison"), ctx.tableau("monde"), ctx.tableau("trainDeVie"),
        ctx.tableau("entreprises"), ctx.jouer("enLigne.etat", {}, { silencieux: true }), L.etatDemandes(ctx)]);
      const jauge = ctx.etat.jeu?.accueil && !ctx.etat.jeu.accueil.saisonTerminee ? await jaugeAccueil(ctx) : ""; // RNT-231
      // RNT-211 : la cloche compte aussi ce qui attend ta réponse (invitations, demandes, propositions) et les avis pas vus.
      return { a: ctx.etat.jeu?.accueil, jauge, fin, monde, faim: ctx.etat.jeu?.faimTuile, vie, entreprises, enLigne: enLigne?.enLigne ?? null, notifications };
    },
    rendu(d, ctx) {
      const a = d.a;
      // À l'ouverture, les blocs apparaissent l'un après l'autre ; un rafraîchissement redessine sans bouger.
      const anime = ctx.etat.sens !== "aucun";
      const app = (rang, html) => (html ? `<div class="ac-bloc ${anime ? "ac-apparition" : ""}" style="--rang:${rang}">${html}</div>` : "");
      if (!a) {
        return `<div class="ac-page">${app(0, entete(null, ctx, d))}
          ${app(1, `<div class="vide ac-sans-saison"><div class="libelle">Aucune saison en cours</div>
            <p class="aide">Choisis un profil : chaque session de focus te fera gagner de l'argent.</p>${bouton("Commencer une saison", "nouvelleSaison")}</div>`)}</div>`;
      }
      return `<div class="ac-page">
        ${app(0, entete(a, ctx, d))}
        <div class="ac-corps">
          <div class="ac-gauche">
            ${app(1, heros(a))}
            ${d.fin ? app(3, compteARebours(d.fin, a)) : ""}
            ${d.jauge ? app(3, d.jauge) : ""}
            ${a.saisonTerminee ? app(3, bouton("Voir le bilan de la saison", "", { page: "bilan" })) : ""}
          </div>
          <div class="ac-droite">
            ${app(1, carteIci(ctx))}
            ${app(2, raccourcis(a, d))}
            ${app(2, tuiles(a, d))}
          </div>
          <div class="ac-bande">
            ${app(3, `<div class="ac-bande-grille">${tuileMonde(a, d)}${bandeMonde(a.combines, "Combines", "combines")}</div>`)}
          </div>
        </div>
      </div>`;
    },
    // Lot A : au palier moyen et large, toute la largeur (.page.ample) ; les colonnes viennent de accueil.css.
    renduLarge(d, ctx, p) { return pages.accueil.rendu(d, ctx, p); },
    apres(ctx, d) {
      // Le chiffre héros roule (chiffreAnime, lot A) : de 0 la première fois, puis à chaque rafraîchissement
      // (patcher) ; la roue du coffre tourne avec lui (transition CSS sur --angle).
      const a = d?.a;
      if (a && affiche !== a.patrimoine) {
        const premier = affiche === null;
        affiche = a.patrimoine;
        if (premier) requestAnimationFrame(() => ctx.redessiner());
      }
      monterPlan(d);
    },
    actions: {
      versActifs: (ctx) => ctx.allerOnglet("actifs"),
      // RNT-183 : « Manger » sur la tuile Faim : ce qui est possible ici, sans quitter l'accueil.
      mangerIci: (ctx) => mangerIci(ctx),
    },
  },
};

// MARK: En-tête

function entete(a, ctx, d) {
  const demandes = d.notifications?.nombre ?? 0;
  const attente = (a?.evenementsEnAttente ?? 0) + demandes;
  const amis = (L.monde.amis?.recues?.length ?? 0) + (L.monde.amis?.invitations?.length ?? 0);
  const enLigne = d.enLigne;
  return `<header class="ac-entete">
    <div class="ac-marque" role="heading" aria-level="1">${embleme()}<span>Grind</span></div>
    <div class="ac-boutons">
      ${boutonAide("accueil")}
      ${enLigne ? `<button class="rond" id="raccourci-monde" data-action="ouvrir" data-page="enLigne" aria-label="Ton monde en ligne : ${esc(enLigne.nom)}" title="${esc(enLigne.nom)}">${T(ICONES.globe, 17)}</button>` : ""}
      <button class="rond ac-amis" data-action="ouvrir" data-page="amis" aria-label="${amis ? "Amis, du nouveau à voir" : "Amis"}">${T(ICONES.duo, 17)}${amis ? `<span class="ac-pastille chiffres">${amis}</span>` : ""}</button>
      <button class="ac-cloche ${attente ? "en-attente" : ""}" data-action="ouvrir" data-page="evenements" aria-label="${attente ? `Notifications, ${attente} à voir` : "Notifications, rien de nouveau"}">
        ${T(attente ? ICONES.clocheBadge : ICONES.cloche, 16)}<span class="chiffres">${attente}</span></button>
      <button class="ac-avatar" data-action="ouvrir" data-page="profil" aria-label="Ton profil">${avatarJoueur(36)}</button>
    </div>
  </header>`;
}

/** EmblemeRente : une pièce frappée d'un G. */
const embleme = (t = 24) => `<svg class="ac-embleme" width="${t}" height="${t}" viewBox="0 0 24 24" aria-hidden="true">
  <defs><linearGradient id="ac-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4E3B0"/><stop offset="1" stop-color="#B78A3B"/></linearGradient></defs>
  <circle cx="12" cy="12" r="11.5" fill="url(#ac-or)"/><circle cx="12" cy="12" r="11" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.6" stroke-dasharray="1.2 1.2"/>
  <circle cx="12" cy="12" r="8.6" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".8"/>
  <text x="12" y="16.3" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-size="12.5" fill="rgba(0,0,0,.55)">G</text></svg>`;

// MARK: Le coffre et le chiffre héros (CoffreFort, ChiffreHeros)

/** Un tour complet de la roue tous les 10 000 €. */
const angleRoue = (centimes) => (((centimes ?? 0) / 100) % 10_000) / 10_000 * 360;

function heros(a) {
  const v = a.variationSemaine;
  const ton = variation(v).startsWith("+") ? "gain" : variation(v).startsWith("−") ? "perte" : "t2";
  const depart = affiche === null ? 0 : a.patrimoine;
  const n = herosLongueur(a.patrimoine);
  return `<button class="ac-heros" data-action="ouvrir" data-page="patrimoine" aria-label="Patrimoine, ouvre la courbe">
    <div class="ac-coffre">
      <span class="ac-porte" aria-hidden="true"><i class="ac-charniere haut"></i><i class="ac-charniere bas"></i><i class="ac-rivet a"></i><i class="ac-rivet b"></i><i class="ac-rivet c"></i><i class="ac-rivet d"></i></span>
      ${roue(angleRoue(depart))}
      <div class="ac-coffre-texte" style="--n:${n}">
        <div class="ac-jour">${a.saisonTerminee ? "Saison terminée" : `Jour ${a.jour} sur ${a.dureeJours}`}</div>
        ${chiffreHeros(depart, a.patrimoine)}
        <div class="ac-variation"><span class="chiffres ${ton}">${variation(v)}</span><span class="${ton}">cette semaine</span></div>
      </div>
    </div>
    <div class="ac-horizon" aria-hidden="true"><i></i></div>
    <div class="ac-courbe">${a.courbeSuffisante ? courbe(a.courbe, a.courbeAbscisses) : attenteCourbe()}</div>
  </button>`;
}

/** Montant.decoupe : « −12 345 » et « ,67 € ». */
const FMT_HEROS = new Intl.NumberFormat("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function decoupe(c) {
  const v = Math.round(c ?? 0);
  const complet = FMT_HEROS.format(Math.abs(v) / 100);
  const i = complet.lastIndexOf(",");
  return { euros: (v < 0 ? "−" : "") + complet.slice(0, i), suite: `${complet.slice(i)} €` };
}

/** ChiffreHeros : les euros en grand, les centimes et « € » à 26 / 60 ; chaque chiffre roule (chiffreAnime). */
function chiffreHeros(c, cible) {
  const d = decoupe(c), v = decoupe(cible);
  return `<div class="ch-heros heros-chiffre" id="ac-patrimoine" role="img" aria-label="Patrimoine, ${v.euros}${v.suite}">
    <span class="ch-euros" aria-hidden="true">${chiffreAnime(null, { texte: d.euros })}</span><span class="ch-suite" aria-hidden="true">${chiffreAnime(null, { texte: d.suite })}</span></div>`;
}

/** Le nombre de caractères des euros : la taille du chiffre s'y règle pour tenir à côté de la roue. */
const herosLongueur = (c) => Math.max(1, new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 0 }).format(Math.trunc(Math.abs(c ?? 0) / 100)).length + (c < 0 ? 1 : 0));

/** RoueCoffre : le cadran gradué, la roue à quatre rayons, le repère en or. */
function roue(angle) {
  const graduations = Array.from({ length: 40 }, (_, k) =>
    `<rect x="49.3" y="${k % 5 === 0 ? 3 : 5}" width="1.4" height="${k % 5 === 0 ? 7 : 4}" rx=".7" fill="rgba(255,255,255,${k % 5 === 0 ? 0.55 : 0.2})" transform="rotate(${k * 9} 50 50)"/>`).join("");
  const rayons = [0, 90, 180, 270].map((r) => `<g transform="rotate(${r} 50 50)"><rect x="47.75" y="18" width="4.5" height="26" rx="2.25" fill="url(#ac-acier)"/><circle cx="50" cy="18" r="4.5" fill="var(--or)"/></g>`).join("");
  return `<svg class="ac-roue" id="ac-roue" viewBox="0 0 100 100" style="--angle:${angle}deg" aria-hidden="true">
    <defs>
      <radialGradient id="ac-cadran"><stop offset=".2" stop-color="#2E3137"/><stop offset="1" stop-color="#15171A"/></radialGradient>
      <linearGradient id="ac-bord" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.25)"/><stop offset="1" stop-color="rgba(0,0,0,.6)"/></linearGradient>
      <linearGradient id="ac-acier" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9CDD4"/><stop offset="1" stop-color="#6C7078"/></linearGradient>
      <linearGradient id="ac-moyeu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E3E6EB"/><stop offset="1" stop-color="#6C7078"/></linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49" fill="url(#ac-cadran)"/><circle cx="50" cy="50" r="48" fill="none" stroke="url(#ac-bord)" stroke-width="2"/>
    ${graduations}
    <g class="ac-roue-tourne">${rayons}<circle cx="50" cy="50" r="13" fill="url(#ac-moyeu)" stroke="rgba(0,0,0,.4)" stroke-width=".8"/>
      <text x="50" y="54.3" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="12" fill="rgba(0,0,0,.5)">G</text></g>
    <path d="M46 0h8l-4 6z" fill="var(--or)"/>
  </svg>`;
}

/** AttenteCourbe : une ligne de base en tirets, un point, et ce qui va venir. */
const attenteCourbe = () => `<div class="ac-attente"><div class="ac-attente-ligne"><i></i><b></b></div>
  <span>La courbe se dessine à ton prochain mouvement d'argent.</span></div>`;

/** D123 : la dernière semaine, le temps qui reste ; le dernier jour, ta place en direct. */
function compteARebours(p, a) {
  const autres = (L.monde.code ? L.monde.profils : []).filter((x) => !L.estMoi(x.id));
  const rang = 1 + autres.filter((x) => (x.patrimoine ?? 0) > a.patrimoine).length;
  const total = autres.length + 1;
  const detail = p.derniereJournee && total > 1 ? `En direct : ${rang === 1 ? "1er" : `${rang}e`} sur ${total} au patrimoine` : "Tout sera valorisé au prix du marché à la clôture.";
  return `<div class="carte ac-rebours" role="group" aria-label="Fin de saison dans ${esc(p.texte)}. ${esc(detail)}">
    <span class="${p.derniereJournee ? "or" : "t2"}">${T(p.derniereJournee ? ICONES.drapeau : ICONES.sablier, 20)}</span>
    <div><div class="libelle">Fin de saison dans ${esc(p.texte)}</div><div class="aide">${esc(detail)}</div></div></div>`;
}

// MARK: Raccourcis (RaccourcisAccueil)

function raccourcis(a, d) {
  const enAlerte = (d.entreprises?.boites ?? []).filter((b) => b.tresorerie < 0 || b.alertes > 0).length;
  const propositions = L.monde.code ? L.aTraiter(Date.now()).length : 0;
  const evenements = a.evenementsEnAttente ?? 0;
  if (!enAlerte && !propositions && !evenements) return "";
  const puce = (titre, icone, teinte, detail, attrs) => `<button class="ac-raccourci" ${attrs}>
    <span class="pastille" style="--c:${teinte}">${T(icone, 14)}</span>
    <span><span class="ac-r-titre">${titre}</span>${detail ? `<span class="ac-r-detail">${detail}</span>` : ""}</span></button>`;
  return `<div class="ac-raccourcis" role="group" aria-label="À voir">
    ${enAlerte ? puce(`${enAlerte} boîte${enAlerte > 1 ? "s" : ""} à voir`, ICONES.alerte, TEINTES.danger, "", 'data-action="versActifs"') : ""}
    ${propositions ? puce(`${propositions} à trancher`, ICONES.duo, TEINTES.controles, "Entre joueurs", 'data-action="ouvrir" data-page="propositions"') : ""}
    ${evenements ? puce(`${evenements} événement${evenements > 1 ? "s" : ""}`, ICONES.clocheBadge, TEINTES.vente, "", 'data-action="ouvrir" data-page="evenements"') : ""}
  </div>`;
}

// MARK: Les tuiles (TuileObjet, AnneauPlaisir, TuileObjectif, PilesRepartition, ObjetDernierMouvement)

function tuiles(a, d) {
  const principale = [...a.repartition].sort((x, y) => y.part - x.part)[0];
  const dm = a.dernierMouvement;
  const o = a.objectif;
  return `<div class="ac-tuiles grille2">
    ${tuile("plaisir", "Plaisir", a.burnout ? "Burnout" : `${a.jaugeArrondie}, ${esc(a.etatJauge)}`, anneau(a.partJauge, a.burnout), { teinte: TEINTES.image, couleur: a.burnout ? "alerte" : "" })}
    ${o ? tuileObjectif(o, a.objectifsSecondaires ?? [])
        : tuile("objectifs", "Objectif", "Aucun, à épingler", `<span class="ac-emplacement">${T(ICONES.plus, 18)}</span>`, { couleur: "t2" })}
    ${tuile("repartition", "Répartition", principale?.part > 0 ? `${NATURES[principale.nature]?.[0] ?? principale.nature} d'abord` : "Rien encore", piles(a.repartition), { teinte: TEINTES.grandir })}
    ${tuile("activite", "Activité", dm ? variation(dm.montant) : "Rien encore", mouvement(dm), { teinte: TEINTES.argent, couleur: dm ? (dm.montant >= 0 ? "gain" : "perte") : "t2" })}
    <div class="ac-large ac-faim">${tuileFaim(d.faim)}</div>
    <div class="ac-large ac-vie">${tuileTrainDeVie(d.vie)}</div>
    ${a.revenus?.utile ? `<div class="ac-large ac-revenus">${carteRevenus(a.revenus)}</div>` : "" /* RNT-272 : versés chaque soir */}
  </div>`;
}

function tuile(page, titre, valeur, objet, { teinte = "", couleur = "" } = {}) {
  return `<button class="tuile ac-tuile ${teinte ? "teintee" : ""}" ${teinte ? `style="--c:${teinte}"` : ""} data-action="ouvrir" data-page="${page}" aria-label="${esc(titre)} : ${esc(valeur.replace(/<[^>]+>/g, ""))}">
    <span class="ac-objet">${objet}</span>
    <span class="ac-t">${esc(titre)}</span><span class="ac-v chiffres-doux ${couleur}">${valeur}</span></button>`;
}

/** L'anneau du plaisir : un cœur au centre, l'anneau à la couleur de l'app, rempli à la jauge. */
function anneau(part, burnout) {
  const c = 2 * Math.PI * 27;
  const p = Math.max(0.02, Math.min(1, part ?? 0));
  return `<span class="ac-anneau ${burnout ? "burnout" : ""}"><svg viewBox="0 0 62 62" width="62" height="62" aria-hidden="true">
    <circle cx="31" cy="31" r="27" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>
    <circle class="ac-anneau-jauge" cx="31" cy="31" r="27" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${((1 - p) * c).toFixed(1)}" transform="rotate(-90 31 31)"/></svg>
    <span class="ac-coeur">${T(burnout ? CŒUR_BRISE : CŒUR, 20)}</span></span>`;
}

/** RNT-52, RNT-175 : la photo (sur le web, la silhouette ou le symbole) occupe la tuile, le nom et l'avancée dessus. */
function tuileObjectif(o, autres) {
  const pc = (x) => `${Math.round((x ?? 0) * 100)} %`;
  const vehicule = o.sorte === "vehicule" && o.silhouette;
  const fond = vehicule
    ? `<svg class="ac-silhouette" viewBox="0 0 240 110" aria-hidden="true">${silhouette(o.silhouette)}</svg>`
    : `<span class="ac-objectif-symbole">${symbole(o.icone || "car.side.fill")}</span>`;
  return `<button class="tuile ac-tuile ac-objectif" style="--c:${esc(o.teinte || "#2C3038")}" data-action="ouvrir" data-page="objectifs"
      aria-label="Objectif : ${esc(o.nom)}, ${pc(o.part)}${autres.map((x) => `, ${esc(x.nom)} ${pc(x.part)}`).join("")}">
    <span class="ac-objectif-fond ${vehicule ? "vehicule" : ""}">${fond}</span>
    <span class="ac-objectif-texte">
      <span class="ac-t">Objectif</span>
      <span class="ac-objectif-nom">${esc(o.nom)}</span>
      <span class="ac-objectif-rail"><span class="rail"><i style="width:${Math.max(4, Math.round(Math.min(1, o.part ?? 0) * 100))}%"></i></span><b class="chiffres">${pc(o.part)}</b></span>
      ${autres.map((x) => `<span class="ac-secondaire"><i class="${x.atteint ? "atteint" : ""}"></i><span>${esc(x.nom)}</span><b class="chiffres">${pc(x.part)}</b></span>`).join("")}
    </span></button>`;
}

/** Les piles de la répartition : une colonne par nature, à sa hauteur, son symbole dessous. */
function piles(parts) {
  return `<span class="ac-piles">${parts.map((p) => {
    const [, c, s] = NATURES[p.nature] ?? ["", "#888", ""];
    return `<span class="ac-pile ${p.part > 0 ? "" : "vide"}" style="--c:${c};--h:${Math.max(4, Math.round(46 * p.part))}px"><i></i>${T(s, 11)}</span>`;
  }).join("")}</span>`;
}

function mouvement(dm) {
  return `<span class="ac-mouvement"><span class="ac-mouvement-rond ${dm ? (dm.montant >= 0 ? "gain" : "perte") : "t2"}">${dm ? symbole(dm.icone) : T(ICONES.liste, 19)}</span>
    <span class="ac-mouvement-titre">${esc(dm?.titre ?? "Tes rentrées et dépenses apparaîtront ici")}</span></span>`;
}

// MARK: Le monde (CarteAccueil, BandeMonde)

function bandeMonde(position, titre, page) {
  return `<button class="ac-bande-monde" data-action="ouvrir" data-page="${page}" aria-label="${esc(titre)}, ${esc(position)}">
    <span class="ac-bande-symbole">${T(ICONES.masques, 26)}</span>
    <span class="ac-bande-texte"><span class="ac-t">${esc(titre)}</span><span class="ac-bande-v">${esc(position)}</span></span>
    <span class="ac-chevron">${T(ICONES.chevron, 13)}</span></button>`;
}

/** Se situer d'un coup d'œil : le plan autour de toi (ou le trajet), pas seulement le nom de la ville. */
function tuileMonde(a, d) {
  return `<button class="ac-monde" data-action="ouvrir" data-page="monde" aria-label="Monde, ${esc(a.position)}">
    <span class="ac-plan" id="ac-plan" aria-hidden="true"></span>
    <span class="ac-monde-texte"><span class="ac-t">Monde</span><span class="ac-bande-v">${esc(a.position)}</span></span>
    <span class="ac-chevron">${T(ICONES.chevron, 13)}</span>
    <span class="ac-plan-mention" aria-hidden="true">© OpenStreetMap</span></button>`;
}

let plan = null; // { el, map, cle } : le plan est créé une fois et replacé après chaque dessin

function chargerLeaflet() {
  if (window.L?.map) return Promise.resolve(window.L);
  return new Promise((ok, ko) => {
    const base = new URL("../../vendor/leaflet/", import.meta.url);
    if (!document.querySelector("link[data-leaflet]")) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = new URL("leaflet.css", base).href; l.dataset.leaflet = "";
      document.head.append(l);
    }
    const s = document.createElement("script");
    s.src = new URL("leaflet.js", base).href;
    s.onload = () => ok(window.L);
    s.onerror = () => ko(new Error("plan indisponible"));
    document.head.append(s);
  });
}

async function monterPlan(d) {
  const t = d?.monde;
  if (!document.getElementById("ac-plan") || !t) return;
  let Lf;
  try { Lf = await chargerLeaflet(); } catch { return; }
  const slot = document.getElementById("ac-plan");
  if (!slot) return;
  if (!plan) {
    const el = document.createElement("div");
    el.className = "ac-plan-carte";
    // Créé hors de la page : sans position en ligne, Leaflet la forcerait en « relative ».
    el.style.position = "absolute";
    el.style.inset = "0";
    const map = Lf.map(el, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
      boxZoom: false, keyboard: false, touchZoom: false, tap: false, fadeAnimation: false, zoomAnimation: false, inertia: false });
    Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, className: "ac-tuiles" }).addTo(map);
    plan = { el, map, couche: Lf.layerGroup().addTo(map), cle: "" };
  }
  if (plan.el.parentElement !== slot) slot.append(plan.el);
  plan.map.invalidateSize({ animate: false });
  const moi = t.positionLat != null ? [t.positionLat, t.positionLon]
    : (() => { const e = (t.endroits ?? []).find((x) => x.ici); return e ? [e.lat, e.lon] : t.ici ? [t.ici.lat, t.ici.lon] : null; })();
  const r = t.enRoute;
  const de = r ? (t.lieux ?? []).find((l) => l.nom === r.de) : null;
  const vers = r ? (t.lieux ?? []).find((l) => l.id === r.versID) : null;
  const cle = JSON.stringify([moi, r?.versID, (t.endroits ?? []).length]);
  if (cle === plan.cle) return;
  plan.cle = cle;
  plan.couche.clearLayers();
  const marque = (html, ll, z = 0) => Lf.marker(ll, { icon: Lf.divIcon({ className: "ac-mk", html, iconSize: [0, 0] }), interactive: false, keyboard: false, zIndexOffset: z }).addTo(plan.couche);
  if (de && vers) {
    // Entre deux villes : les deux, pour voir le trajet.
    Lf.polyline([[de.lat, de.lon], [vers.lat, vers.lon]], { color: "#E3C46B", opacity: 0.8, weight: 2, dashArray: "5 4", interactive: false }).addTo(plan.couche);
    marque('<i class="ac-m-vers"></i>', [vers.lat, vers.lon]);
    if (moi) marque('<i class="ac-m-moi"></i>', moi, 500);
    plan.map.fitBounds([[de.lat, de.lon], [vers.lat, vers.lon]], { padding: [24, 24], animate: false });
    return;
  }
  for (const e of (t.endroits ?? []).filter((x) => !x.ici && !String(x.id).startsWith("j:"))) marque(`<i class="ac-m-lieu">${symbole(e.icone)}</i>`, [e.lat, e.lon]);
  if (moi) {
    marque('<i class="ac-m-moi"></i>', moi, 500);
    plan.map.setView(moi, 14, { animate: false }); // ≈ 4 km de côté, comme l'iPhone
  } else plan.map.setView([50.85, 4.35], 12, { animate: false });
}
