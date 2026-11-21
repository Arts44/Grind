// ══════════════════════════════════════════════════════════════════════
//  Onglet Accueil (EcranAccueil.swift, ObjetsAccueil.swift).
//
//  L'en-tête (l'emblème, le « ? », le monde en ligne, les amis, les
//  événements, ton avatar), puis le patrimoine (D347) : le grand chiffre,
//  la barre de répartition détaillée et la courbe de la saison, lue au
//  doigt. Dessous, la carte « Ici »,
//  les raccourcis (ce qui demande ton attention), les quatre tuiles à
//  objets, la faim, le train de vie, le plan du monde autour de toi et
//  les combines ; la dernière semaine, le temps qui reste, et le dernier
//  jour ta place en direct.
//
//  Les blocs montent de 14 px, décalés de 0,1 s, à l'ouverture (pas aux
//  rafraîchissements). Grand écran : le patrimoine à gauche, Ici, raccourcis
//  et tuiles à droite, le plan en bande dessous (D89, inventaire § 4).
// ══════════════════════════════════════════════════════════════════════
import { montant, variation, esc } from "../format.js?v=3e8bddd9";
import { courbe, bouton, icones, boutonAide, chiffreAnime } from "../ui.js?v=3e8bddd9";
import { tuileFaim, mangerIci } from "./manger.js?v=3e8bddd9";
import { carteIci } from "../ici.js?v=3e8bddd9"; // RNT-195
import { tuileTrainDeVie } from "./trainvie.js?v=3e8bddd9";
import { tuileCouple } from "./couple.js?v=3e8bddd9"; // D346
import { tuileFamille } from "./famille.js?v=3e8bddd9"; // D376
import { tuileLiens } from "./liens.js?v=3e8bddd9"; // D349
import { tuileDefis } from "./defis.js?v=3e8bddd9"; // D381
import { carteRevenus } from "./revenus.js?v=3e8bddd9"; // RNT-272
import { symbole, silhouette } from "./vie.js?v=3e8bddd9";
import { avatarJoueur } from "../compte-local.js?v=3e8bddd9"; // D393 : ton avatar (symbole et teinte), de retour
import * as L from "../enligne.js?v=3e8bddd9";
import { jaugeAccueil } from "./recompenses.js?v=3e8bddd9"; // RNT-231
import { iconeJeu } from "../icones-jeu.js?v=3e8bddd9"; // D353 : les icônes du jeu bougent une fois à l'ouverture

/** PartRepartition.Nature : la couleur du prototype et le symbole de la pile. */
const NATURES = {
  liquidites: ["Liquidités", "#6CC7EC", '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/>'],
  bourse: ["Bourse", "#4F9BE8", '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'],
  immobilier: ["Immobilier", "#9D8CFF", '<path d="M3.5 10.5 12 3.5l8.5 7V20h-17z"/>'],
  entreprises: ["Entreprises", "#FFB547", '<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10H3zM9 20v-6h6v6"/>'],
  vehicules: ["Véhicules", "#FF8A65", '<path d="M5 16l1.5-5.5h11L19 16M3 15h18v4H3z"/>'],
  montres: ["Montres", "#E8C77A", '<rect x="7" y="7" width="10" height="10" rx="5"/><path d="M9 7l.8-4h4.4l.8 4M9 17l.8 4h4.4l.8-4"/>'],
};
/** CategorieAction : D353, les jetons (jetons.css), plus une copie en hexadécimal. */
const TEINTES = { image: "var(--image)", grandir: "var(--grandir)", argent: "var(--argent)", equipe: "var(--equipe)", vente: "var(--vente)", controles: "var(--controles)", danger: "var(--c-danger)" };

const T = (d, t = 18, extra = "") => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICONES = {
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5S14.5 17.9 12 20.5M12 3.5C9.5 6.1 8.4 8.9 8.4 12s1.1 5.9 3.6 8.5"/>',
  alerte: '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  echanges: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>', // RNT-251 : deux flèches qui se croisent
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
const CŒUR_BRISE = '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" fill="currentColor" stroke="none"/><path d="M4 4l16 16" stroke="var(--fond)" stroke-width="2.4"/>';

let affiche = null; // le patrimoine affiché par le compteur (il part de 0 la première fois)

export const pages = {
  accueil: {
    titre: "Accueil",
    css: ["accueil", "compte", "manger", "cosmetiques", "couple", "liens", "defis"], // lot A : css/pages/accueil.css, compte.css (l'avatar) ; RNT-210 : manger ici (manger.js)
    async donnees(ctx) {
      // RNT-190 : le train de vie a sa tuile, sous la faim ; RNT-140 : les boîtes à voir pour les raccourcis.
      const [fin, vie, entreprises, enLigne, notifications, couple, liens, famille, defis] = await Promise.all([ctx.tableau("finDeSaison"), ctx.tableau("trainDeVie"),
        ctx.tableau("entreprises"), ctx.jouer("enLigne.etat", {}, { silencieux: true }), L.etatDemandes(ctx), ctx.tableau("couple"), ctx.tableau("liens"), ctx.tableau("famille"),
        ctx.tableau("defis")]); // D381
      const jauge = ctx.etat.jeu?.accueil && !ctx.etat.jeu.accueil.saisonTerminee ? await jaugeAccueil(ctx) : ""; // RNT-231
      // RNT-211 : la cloche compte aussi ce qui attend ta réponse (invitations, demandes, propositions) et les avis pas vus.
      return { a: ctx.etat.jeu?.accueil, jauge, fin, faim: ctx.etat.jeu?.faimTuile, vie, entreprises, enLigne: enLigne?.enLigne ?? null, notifications, couple, liens, famille, defis };
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
        </div>
      </div>`;
    },
    // Lot A : au palier moyen et large, toute la largeur (.page.ample) ; les colonnes viennent de accueil.css.
    renduLarge(d, ctx, p) { return pages.accueil.rendu(d, ctx, p); },
    apres(ctx, d) {
      // Le chiffre héros roule (chiffreAnime, lot A) : de 0 la première fois, puis à chaque rafraîchissement (patcher).
      const a = d?.a;
      if (a && affiche !== a.patrimoine) {
        const premier = affiche === null;
        affiche = a.patrimoine;
        if (premier) requestAnimationFrame(() => ctx.redessiner());
      }
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
  // RNT-251 : les offres d'échange qui attendent ma réponse.
  const echanges = (L.monde.echanges ?? []).filter((e) => e.statut === "attente" && !L.estMoi(e.versions?.at(-1)?.par)
    && (!e.expire || Date.parse(e.expire) > Date.now())).length;
  return `<header class="ac-entete">
    <div class="ac-marque" role="heading" aria-level="1">${embleme()}<span>Grind</span></div>
    <div class="ac-boutons">
      ${boutonAide("accueil")}
      ${enLigne ? `<button class="rond" id="raccourci-monde" data-action="ouvrir" data-page="enLigne" aria-label="Ton monde en ligne : ${esc(enLigne.nom)}" title="${esc(enLigne.nom)}">${T(ICONES.globe, 17)}</button>` : ""}
      ${enLigne ? `<button class="rond ac-echanges" id="raccourci-echanges" data-action="ouvrir" data-page="echanges" aria-label="${echanges ? `Échanges, ${echanges} à trancher` : "Échanges entre joueurs"}">${T(ICONES.echanges, 17)}${echanges ? `<span class="ac-pastille chiffres">${echanges}</span>` : ""}</button>` : ""}
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

// MARK: Le patrimoine (D347) : le chiffre héros, la répartition détaillée, la courbe de la saison lue au doigt

/** D347 : le chiffre en grand, la barre de répartition (chaque part, son montant, son pourcentage) et la courbe de la
 *  saison qu'on lit au doigt. Plus de porte de coffre : le vrai coffre est chez toi (Banque › Portefeuille). */
function heros(a) {
  const v = a.variationSemaine;
  const ton = variation(v).startsWith("+") ? "gain" : variation(v).startsWith("−") ? "perte" : "t2";
  // D377 : le patrimoine dans la devise d'affichage, au taux du jour.
  const tx = a.tauxDevise ?? 1;
  symboleHeros = a.symboleDevise ?? "€";
  const depart = affiche === null ? 0 : Math.round(a.patrimoine * tx);
  const n = herosLongueur(Math.round(a.patrimoine * tx));
  return `<section class="ac-heros" aria-label="Patrimoine">
    <div class="ac-heros-tete">
      <span class="ac-jour">${a.saisonTerminee ? "Saison terminée" : `Jour ${a.jour} sur ${a.dureeJours}`}</span>
    </div>
    ${/* D353 : toucher le grand chiffre ouvre l'historique du patrimoine. */""}<button type="button" class="ac-heros-texte" style="--n:${n}" data-action="ouvrir" data-page="patrimoine" aria-label="Patrimoine, voir l'historique">
      ${chiffreHeros(depart, Math.round(a.patrimoine * tx))}
      <div class="ac-variation"><span class="chiffres ${ton}">${variation(v)}</span><span class="${ton}">cette semaine</span></div>
    </button>
    ${barreRepartition(a.repartition)}
    ${"" /* D413 (17/11, Arthur) : plus de courbe ici, en double avec la page Patrimoine que le grand chiffre ouvre. */}
  </section>`;
}

/** La répartition détaillée : une barre segmentée, puis chaque part avec son montant et son pourcentage. */
function barreRepartition(parts) {
  const l = [...(parts ?? [])].filter((p) => p.montant > 0).sort((x, y) => y.montant - x.montant);
  if (!l.length) return "";
  const pc = (x) => (x < 0.01 ? "< 1 %" : `${Math.round(x * 100)} %`);
  // D351 : la barre détaillée ouvre le détail de la répartition (l'ancienne tuile « Répartition » est retirée).
  return `<button class="ac-repartition" data-action="ouvrir" data-page="repartition" aria-label="Répartition, voir le détail">
    <div class="ac-rep-barre" role="img" aria-label="${esc(l.map((p) => `${NATURES[p.nature]?.[0] ?? p.nature} ${pc(p.part)}`).join(", "))}">
      ${l.map((p) => `<i style="--c:${NATURES[p.nature]?.[1] ?? "var(--texte3)"};--part:${p.part.toFixed(4)}"></i>`).join("")}</div>
    <div class="ac-rep-legende">${l.map((p) => `<span class="ac-rep-part"><span class="ac-rep-point" style="--c:${NATURES[p.nature]?.[1] ?? "var(--texte3)"}"></span>
      <span class="ac-rep-nom">${esc(NATURES[p.nature]?.[0] ?? p.nature)}</span><span class="ac-rep-val chiffres">${montant(p.montant)}</span><span class="ac-rep-pct chiffres">${pc(p.part)}</span></span>`).join("")}</div>
  </button>`;
}

/** Montant.decoupe : « −12 345 » et « ,67 € ». */
const FMT_HEROS = new Intl.NumberFormat("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function decoupe(c) {
  const v = Math.round(c ?? 0);
  const complet = FMT_HEROS.format(Math.abs(v) / 100);
  const i = complet.lastIndexOf(",");
  return { euros: (v < 0 ? "−" : "") + complet.slice(0, i), suite: `${complet.slice(i)} ${symboleHeros}` };
}

/** D377 : le symbole de la devise d'affichage (tableau d'accueil). */
let symboleHeros = "€";

/** ChiffreHeros : les euros en grand, les centimes et « € » à 26 / 60 ; chaque chiffre roule (chiffreAnime). */
function chiffreHeros(c, cible) {
  const d = decoupe(c), v = decoupe(cible);
  return `<div class="ch-heros heros-chiffre" id="ac-patrimoine" role="img" aria-label="Patrimoine, ${v.euros}${v.suite}">
    <span class="ch-euros" aria-hidden="true">${chiffreAnime(null, { texte: d.euros })}</span><span class="ch-suite" aria-hidden="true">${chiffreAnime(null, { texte: d.suite })}</span></div>`;
}

/** Le nombre de caractères des euros : la taille du chiffre s'y règle pour tenir à côté de la roue. */
const herosLongueur = (c) => Math.max(1, new Intl.NumberFormat("fr-BE", { maximumFractionDigits: 0 }).format(Math.trunc(Math.abs(c ?? 0) / 100)).length + (c < 0 ? 1 : 0));

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
  const dm = a.dernierMouvement;
  const o = a.objectif;
  return `<div class="ac-tuiles grille2">
    ${tuile("plaisir", "Plaisir", a.burnout ? "Burnout" : `${a.jaugeArrondie}, ${esc(a.etatJauge)}`, anneau(a.partJauge, a.burnout), { couleur: a.burnout ? "alerte" : "" })}
    ${o ? tuileObjectif(o, a.objectifsSecondaires ?? [])
        : tuile("objectifs", "Objectif", "Aucun, à épingler", `<span class="ac-emplacement">${T(ICONES.plus, 18)}</span>`, { couleur: "t2" })}
    ${tuile("activite", "Activité", dm ? variation(dm.montant) : "Rien encore", mouvement(dm), { couleur: dm ? (dm.montant >= 0 ? "gain" : "perte") : "t2" })}
    ${tuile("combines", "Combines", esc(a.combines), `<span class="ac-emplacement ac-icone">${iconeJeu("combines", { entree: true })}</span>`) /* D351 : à la place de la bande */}
    ${/* D353 : UNE carte, une ligne chacun : faim, train de vie, couple, entre joueurs, épargne et chantiers (plus de mur de tuiles). D358 : sans titre. */""}
    ${d.defis ? `<div class="ac-large">${tuileDefis(d.defis)}</div>` /* D381 : toujours là, les succès sont à vie */ : ""}
    <div class="ac-large ac-vie ac-groupe">${tuileFaim(d.faim)}${tuileTrainDeVie(d.vie)}${d.couple ? tuileCouple(d.couple) : ""}${d.famille ? tuileFamille(d.famille) : ""}${d.liens?.disponible ? tuileLiens(d.liens) : ""}${a.revenus?.utile ? carteRevenus(a.revenus) /* RNT-272 : versés chaque soir */ : ""}</div>
  </div>`;
}

/** D353 : une tuile à plat (le voile et le filet d'une carte), sans dégradé teinté ni lueur. */
function tuile(page, titre, valeur, objet, { couleur = "" } = {}) {
  return `<button class="tuile ac-tuile" data-action="ouvrir" data-page="${page}" aria-label="${esc(titre)} : ${esc(valeur.replace(/<[^>]+>/g, ""))}">
    <span class="ac-objet">${objet}</span>
    <span class="ac-t">${esc(titre)}</span><span class="ac-v chiffres-doux ${couleur}">${valeur}</span></button>`;
}

/** L'anneau du plaisir : un cœur au centre, l'anneau à la couleur de l'app, rempli à la jauge. */
function anneau(part, burnout) {
  const c = 2 * Math.PI * 27;
  const p = Math.max(0.02, Math.min(1, part ?? 0));
  return `<span class="ac-anneau ${burnout ? "burnout" : ""}"><svg viewBox="0 0 62 62" width="62" height="62" aria-hidden="true">
    <circle cx="31" cy="31" r="27" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
    <circle class="ac-anneau-jauge" cx="31" cy="31" r="27" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${((1 - p) * c).toFixed(1)}" transform="rotate(-90 31 31)"/></svg>
    <span class="ac-coeur">${burnout ? T(CŒUR_BRISE, 20) : iconeJeu("plaisir", { entree: true })}</span></span>`;
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

function mouvement(dm) {
  return `<span class="ac-mouvement"><span class="ac-mouvement-rond ${dm ? (dm.montant >= 0 ? "gain" : "perte") : "t2"}">${dm ? symbole(dm.icone) : T(ICONES.liste, 19)}</span>
    <span class="ac-mouvement-titre">${esc(dm?.titre ?? "Tes rentrées et dépenses apparaîtront ici")}</span></span>`;
}

// D351 : le plan du monde et la bande « Combines » ont quitté l'accueil : la carte a son onglet (D341), les combines une tuile.

