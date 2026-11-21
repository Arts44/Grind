// ══════════════════════════════════════════════════════════════════════
//  Grind sur le web (D186, RNT-148) — le cœur de l'app.
//
//  Le moteur (le même que l'iPhone) calcule tout ; ce fichier :
//   - démarre : le moteur, l'heure du serveur, le compte, la partie ;
//   - navigue comme l'iPhone : cinq onglets (Focus, Banque, Accueil,
//     Carte, Actifs ; D341 : la carte a son onglet, les marchés sont une
//     part d'Actifs), une pile de pages par onglet, des feuilles ;
//   - passe à chaque page un contexte (`ctx`) pour lire un écran du
//     moteur et y prendre une décision ;
//   - sauvegarde (dans le navigateur, puis sur le serveur) ;
//   - joue le rôle de Temps d'écran : quitter l'onglet pendant une session
//     de focus, c'est comme ouvrir une app interdite sur l'iPhone.
//
//  Une page (js/pages/*.js) : { titre, donnees(ctx, p), rendu(d, ctx, p),
//  renduLarge?(d, ctx, p), panneau?, css?, actions: { nom(ctx, el, d, p) },
//  tic(ctx, d, p), apres(ctx, d, p) }. Voir web/README.md et docs/web-design.md.
//
//  Lot A (17/10) : chaque page de la pile garde ses données et sa position
//  de défilement ; un rafraîchissement met la page à jour en place
//  (patcher), sans squelette ; au grand écran, le rail (palier moyen) ou
//  la colonne et le panneau liste + détail (palier large).
// ══════════════════════════════════════════════════════════════════════
import { ouvrirMoteur } from "./moteur.js?v=3e8bddd9";
import * as serveur from "./serveur.js?v=3e8bddd9";
import { pages, chargerPage, chargerFichier, poserStyles } from "./pages/index.js?v=3e8bddd9";
import * as depart from "./pages/depart.js?v=3e8bddd9";
import * as objectifs from "./pages/objectifs.js?v=3e8bddd9";
import { ONGLETS, monterBarre, majBarre } from "./barre.js?v=3e8bddd9";
import { esc, reglerDevise } from "./format.js?v=3e8bddd9";
import { patcher } from "./patcher.js?v=3e8bddd9";
import { brancherGlisser } from "./glisser.js?v=3e8bddd9"; // RNT-411 : les rangées défilantes, à la souris
import { brancherMouvements, suivreBouton } from "./mouvements.js?v=3e8bddd9"; // D345 : menus, panneaux, chiffres qui glissent, bouton qui répond
import { brancherIconesJeu } from "./icones-jeu.js?v=3e8bddd9"; // D353 : les icônes du jeu bougent quand on les touche
import { majChampFichier, aideContextuelle, entetePousse, icones, confirmer } from "./ui.js?v=3e8bddd9";
import "./aide.js?v=3e8bddd9"; // lot C : les fiches du « ? » (aideContextuelle.ouvrir)
import { jouerSon, vibrer, retourRecent } from "./sons.js?v=3e8bddd9";
import { apercuCommande, demanderPaiement } from "./paiement.js?v=3e8bddd9";
import { verifierRecu, finSession } from "./pages/focus.js?v=3e8bddd9";
import { verifierNouveautes, nouveauJoueur } from "./pages/nouveautes.js?v=3e8bddd9"; // RNT-196
import { chargerCatalogue } from "./cosmetiques.js?v=3e8bddd9"; // RNT-231 : le thème et les sons équipés
import * as enLigne from "./enligne.js?v=3e8bddd9";
import { complements } from "./pages/enligne-fiches.js?v=3e8bddd9";
import { actualiserMeteo } from "./meteo.js?v=3e8bddd9";
import { sceneDeblocage } from "./cartes-fortune.js?v=3e8bddd9"; // RNT-276
import { economieActive } from "./economie.js?v=3e8bddd9"; // RNT-261 : le mode économie (classe posée à l'import)
import { appliquerIcone } from "./icone-app.js?v=3e8bddd9"; // D391 : l'icône de l'app choisie, en favicon

/** Les paliers de largeur (docs/web-design.md) : compact < 700 ≤ moyen < 1 100 ≤ large. */
export const PALIERS = { moyen: 700, large: 1100 };
const palierFenetre = () => (window.innerWidth >= PALIERS.large ? "large" : window.innerWidth >= PALIERS.moyen ? "moyen" : "compact");

const etat = {
  moteur: null,
  decalage: 0, // serveur − navigateur, en ms
  compte: null, // { id, pseudo }
  horsLigne: false,
  jeu: null, // la dernière réponse « état » du moteur (accueil, focus, expérience…)
  ecran: "chargement", // chargement, compte, profils, jeu, erreur
  erreur: null,
  modeCompte: "creer",
  codeAMontrer: null,
  profils: null,
  profilChoisi: null,
  apercu: { minutes: 25, type: "travail" },
  modifie: false,
  envoi: null,
  // Navigation : une pile par onglet ; chaque entrée { id, p } garde ses `donnees` et son `defil`.
  onglet: "accueil",
  piles: Object.fromEntries(ONGLETS.map((o) => [o.id, [{ id: o.id, p: {} }]])),
  feuille: null, // { titre, contenu, page } quand une feuille est ouverte
  palier: palierFenetre(),
  chargements: 0, // lectures de page en cours (les essais attendent qu'elles soient finies)
  cible: null, // l'entrée dont une action est en cours (liste ou détail)
  source: null, // « liste » ou « panneau » : d'où vient le geste en cours
  sens: "aucun", // la page dessinée arrive-t-elle ("", "retour") ou se met-elle à jour en place ("aucun") ? (dessinerDans)
  silenceJusqua: 0, // RNT-102 : au retour au premier plan, on apprend sans jouer
};
// Les données de la page visée (compatibilité : `ctx.etat.donnees`, lu par d'anciennes actions).
Object.defineProperty(etat, "donnees", { enumerable: true, get: () => (entreeActive()?.donnees ?? null) });

const maintenant = () => Date.now() + etat.decalage;
const $app = () => document.getElementById("app");
const $panneau = () => document.getElementById("panneau");
const pile = () => etat.piles[etat.onglet];
const sommet = () => pile().at(-1);

// MARK: Le moteur

const LECTURE = ["presence", "etat", "admin.catalogue", "admin.inspecter", "admin.resume", "profils", "exporter", "journal", "tableau", "balance", "paiement.apercu", "repas.devis", "sons.observer",
  // D205 : les lectures du mode en ligne (le reste du mode en ligne change la partie, et se sauvegarde).
  "parties", "saison.banques", "enLigne.etat", "enLigne.classements", "enLigne.apercuPaiement", "enLigne.peutRejoindre",
  "enLigne.entreJoueurs", "enLigne.entreVous", "enLigne.reglesMonde", "enLigne.optionsCreation", "combines.aEnvoyer", "repas.aEnvoyer", "prison.tableau", "prison.aEnvoyer",
  "enLigne.villesAEnvoyer", "enLigne.succursale.apercu", "meteo.ports", "notifications.etat",
  "notifications.reglages", "notifications.classer", "notifications.resume", // RNT-267
  "aVenir", // D336 : le tableau « À venir » des Nouveautés
  "synchro.resume", "synchro.decider", "synchro.reculerait", "synchro.abaisser"]; // D401 : la synchro décidée par le moteur

/** Une commande au moteur. Rend la réponse, ou null après avoir montré le refus. */
async function jouer(cmd, params = {}, { silencieux = false } = {}) {
  if (globalThis.__grindModulesCasses) return null; // D356 : le jeu ne tourne pas à moitié chargé (demarrage.js recharge)
  const r = await etat.moteur.appel({ cmd, maintenant: maintenant(), ...params });
  if (!r.ok) {
    if (!silencieux) toast(r.erreur, "refus");
    return null;
  }
  if ("focus" in r) { etat.jeu = r; reglerDevise(r.devise); } // D437 : tous les montants dans la devise d'affichage
  if (!LECTURE.includes(cmd)) etat.modifie = true;
  if (r.aSauvegarder) sauvegarder();
  return r;
}

/**
 * D455 : le jeu ouvert (l'onglet visible : à l'ouverture, puis chaque minute) ou fermé (caché, quitté). Ouvert, les
 * boîtes rapportent 100 % ; fermé, 75 %, puis moins après 24 h. Une vraie ouverture ou fermeture se sauvegarde (un
 * battement, non) ; au retour, la phrase des boîtes part en tête du résumé de l'absence.
 */
async function noterPresence(ouvert) {
  if (!etat.moteur || !etat.jeu?.saison) return null;
  const r = await jouer("presence", { ouvert }, { silencieux: true });
  if (r && (!ouvert || r.nouvelle)) etat.modifie = true;
  if (r?.retourBoites) enLigne.retenirRetourBoites(ctx, r.retourBoites);
  return r;
}

/** RNT-102 : LE son de ce qui vient d'arriver (le moteur décide, comme sur l'iPhone). */
async function ecouter() {
  if (etat.ecran !== "jeu") return;
  const r = await jouer("sons.observer", { silencieux: Date.now() < etat.silenceJusqua }, { silencieux: true });
  if (r?.son) jouerSon(r.son);
}

// MARK: Le contexte des pages

const ctx = {
  etat,
  maintenant,
  jouer,
  /** Un écran du moteur, tel que l'iPhone l'affiche (null : rien à montrer). */
  async tableau(nom, params = {}) {
    const r = await jouer("tableau", { nom, ...params });
    return r ? r.tableau : null;
  },
  async balance(partie) {
    const r = await jouer("balance", { partie });
    return r ? r.balance : null;
  },
  /** Une décision du jeu (famille + opération telle que Swift l'encode). Rend vrai si acceptée. */
  async decider(famille, operation, { succes = "", fermer = true, lien = null } = {}) {
    // RNT-172 : un achat payé par carte demande avec quoi payer, par-dessus la feuille d'achat.
    // `decisions` : une décision en cours (les essais attendent qu'elle soit finie).
    etat.decisions = (etat.decisions ?? 0) + 1;
    try {
      const carte = await demanderPaiement(jouer, famille, operation);
      if (carte === null) return false;
      // D107, D205 : en ligne, un bien, une occasion, une pièce, une boîte à reprendre n'ont qu'un acheteur.
      let cle = enLigne.monde.code ? enLigne.cleUnique(famille, operation) : null;
      // RNT-269 (D251) : une pièce rare arrivée (neuf de la concession, de l'horlogerie) n'a qu'un acheteur.
      const neuf = operation?.acheterNeuf;
      if (enLigne.monde.code && !cle && neuf && (famille === "garage" || famille === "montres")) {
        const r = await jouer("arrivee.cle", { genre: famille === "garage" ? "vehicule" : "montre", id: neuf.modele ?? neuf._0 }, { silencieux: true });
        cle = r?.cle ?? null;
      }
      if (cle) { const refus = await enLigne.reserver(cle); if (refus) { toast(refus, "refus"); return false; } }
      const r = await jouer("decider", { famille, operation, ...(carte !== undefined ? { carte } : {}) });
      if (!r) { if (cle) enLigne.liberer(cle); return false; }
      if (famille === "immobilier" && operation?.vendre) enLigne.liberer(`bien:${operation.vendre._0 ?? operation.vendre.bien}`);
      if (succes) toast(succes, "gain", lien === false ? null : (lien ?? lienVers(famille)));
      if (fermer) fermerFeuille();
      await rafraichir();
      // RNT-178, RNT-183 : un coup, une invitation à manger partent tout de suite au serveur.
      if (enLigne.monde.code && famille === "combines" && !operation?.crochetage) enLigne.synchroniserCoups(ctx).then(rafraichir);
      if (enLigne.monde.code && famille === "portefeuille") enLigne.synchroniserRepas(ctx).then(rafraichir);
      if (enLigne.monde.code && famille === "couple") enLigne.synchroniserCouple(ctx).then(rafraichir); // D346
      if (enLigne.monde.code && famille === "banque" && operation?.envoyer) Promise.resolve(enLigne.synchroniser(ctx, { force: true })).then(rafraichir); // D347
      if (enLigne.monde.code && famille === "portefeuille" && operation?.coffreFort) enLigne.coffrePoser(ctx, operation.coffreFort); // D347 : le code au serveur
      if (enLigne.monde.code && famille === "liens") enLigne.synchroniserLiens(ctx).then(rafraichir); // D349
      return true;
    } finally {
      etat.decisions--;
    }
  },
  /** Une commande hors opérations (objectif.epingler, conge, encheres.miser…). */
  async commande(cmd, params = {}, { succes = "", fermer = true, lien = null } = {}) {
    // RNT-219 : une mise, un investissement, une candidature passent aussi par la fenêtre de paiement.
    const a = apercuCommande(cmd, params);
    const carte = a ? await demanderPaiement(jouer, a.famille, a.operation) : undefined;
    if (carte === null) return false;
    if (carte !== undefined) params = { ...params, carte };
    // RNT-221 : en ligne, une mise passe d'abord par le serveur. Le moteur la vérifie (sans l'inscrire), le
    // serveur la prend, et seulement alors elle entre dans la partie : un refus du serveur ne laisse rien ici.
    const mise = cmd === "encheres.miser" && enLigne.monde.code && params.mise != null;
    if (mise) {
      if (!(await jouer(cmd, { ...params, verifier: true }))) return false;
      try { await enLigne.miser(params.vente, params.plafond ?? params.mise, params.mise, params.telephone === true); }
      catch (e) { toast(`Le serveur n'a pas pris ta mise (${e.message}). Rien n'est engagé.`, "refus"); return false; }
    }
    const r = await jouer(cmd, params);
    if (!r) return false;
    // D126, D205 : l'ancienne forme (un plafond seul) part au serveur après la partie.
    if (cmd === "encheres.miser" && enLigne.monde.code && !mise) await enLigne.miser(params.vente, params.plafond).catch((e) => toast(e.message, "refus"));
    if (succes) toast(succes, "gain", lien === false ? null : (lien ?? (a ? lienVers(a.famille) : null)));
    if (fermer) fermerFeuille();
    await rafraichir();
    return true;
  },
  ouvrir,
  retour,
  allerOnglet,
  fermerPanneau,
  feuille: ouvrirFeuille,
  fermerFeuille,
  rafraichir,
  /** D205 : redessine la page (et la feuille) sans relire ses données : un choix d'affichage. */
  redessiner() { rendre(); if (etat.feuille?.rendu) majFeuille(); },
  toast,
  sauvegarder,
  /** Lot A : le palier de largeur (« compact », « moyen », « large ») et si un panneau de détail est ouvert. */
  get palier() { return etat.palier; },
  get avecPanneau() { return !!disposition().detail; },
  /** Lot A : la page est-elle dessinée dans le panneau de détail (au palier large) ? */
  dansPanneau: (p) => disposition().detail?.p === p,
  sons: { jouer: jouerSon, vibrer },
};

// MARK: Navigation

/** Une page s'ouvre-t-elle dans le panneau de détail (palier large) ? `panneau: true` ou une fonction (ctx, p). */
function enPanneau(e) {
  const v = pages[e?.id]?.panneau;
  return typeof v === "function" ? !!v(ctx, e.p) : !!v;
}

/**
 * Ce qui est à l'écran : la page de #app et, au palier large, le détail dans #panneau quand le sommet
 * de la pile est une page `panneau` (la liste est alors la dernière page en dessous qui n'en est pas une).
 */
function disposition() {
  const p = pile();
  const s = p.at(-1);
  if (etat.palier === "large" && etat.ecran === "jeu" && p.length > 1 && enPanneau(s)) {
    for (let k = p.length - 2; k >= 0; k--) if (k === 0 || !enPanneau(p[k])) return { liste: p[k], detail: s };
  }
  return { liste: s, detail: null };
}

/** L'entrée que vise un geste en cours, sinon le sommet. */
function entreeActive() {
  const { liste, detail } = disposition();
  return etat.cible && (etat.cible === liste || etat.cible === detail) ? etat.cible : sommet();
}

/** Note où l'on en est dans les pages affichées (pour y revenir au même endroit). */
function memoriserDefilement() {
  if (etat.ecran !== "jeu") return;
  const { liste, detail } = disposition();
  if ($app().__entree === liste) liste.defil = window.scrollY;
  if (detail && $panneau().__entree === detail) detail.defil = $panneau().scrollTop;
}

/**
 * Pousse une page dans l'onglet courant (ou dans `onglet`). Au palier large, un détail ouvert depuis la liste
 * remplace le détail déjà ouvert (la liste reste où elle est), comme sur un iPad.
 */
async function ouvrir(id, p = {}, { onglet = null, remplacer = false } = {}) {
  // D341 : le Monde est l'onglet Carte, les Marchés une part d'Actifs : ce qui les ouvrait mène à ces onglets.
  if (id === "monde") return ouvrirRacine("carte", p);
  if (id === "marches") return ouvrirRacine("actifs", {}, "marches");
  if (!pages[id]) return toast(`Écran pas encore sur le web : ${id}`, "refus");
  // Lot F : la définition chargée d'abord (panneau, renduLarge, css se lisent avant le dessin).
  try { await chargerPage(id); } catch {}
  memoriserDefilement();
  if (onglet && onglet !== etat.onglet) etat.onglet = onglet;
  const d = disposition();
  let retires = 0;
  if (d.detail && (remplacer || etat.source === "liste") && enPanneau({ id, p })) {
    const k = pile().indexOf(d.liste);
    retires = pile().length - k - 1;
    pile().splice(k + 1);
  }
  pile().push({ id, p });
  if (retires) history.replaceState({ n: pile().length }, "");
  else history.pushState({ n: pile().length }, "");
  await afficher("");
}

/** D341 : un onglet ouvert à sa racine (la pile vidée), avec ses paramètres ; `partie` : la part d'Actifs à montrer. */
async function ouvrirRacine(onglet, p = {}, partie = null) {
  if (partie) { try { localStorage.setItem("actifs.onglet", partie); } catch {} }
  memoriserDefilement();
  etat.piles[onglet] = [{ id: onglet, p }];
  etat.onglet = onglet;
  if (document.getElementById("barre")) dessinerBarre();
  await afficher("");
}

async function retour() {
  if (etat.feuille) return fermerFeuille();
  const p = pile();
  if (p.length > 1) {
    memoriserDefilement();
    p.pop();
    await afficher("retour");
  }
}

/** Ferme le panneau de détail (palier large) : la pile revient à la liste. */
async function fermerPanneau() {
  const { liste, detail } = disposition();
  if (!detail) return;
  memoriserDefilement();
  pile().splice(pile().indexOf(liste) + 1);
  history.replaceState({ n: pile().length }, "");
  await afficher("aucun");
}

/**
 * RNT-295 : la page où se voit le résultat d'une décision, par famille. Une action faite d'ailleurs
 * (l'accueil, la carte, une fiche) propose d'y aller dans son toast.
 */
const DESTINATIONS = {
  banque: { page: "banque", onglet: "banque", texte: "Voir la banque" },
  assurances: { page: "banque", onglet: "banque", texte: "Voir la banque" },
  marches: { page: "actifs", onglet: "actifs", partie: "marches", texte: "Voir les marchés" }, // D341 : Actifs › Marchés
  immobilier: { page: "immobilier", onglet: "actifs", texte: "Voir tes biens" },
  garage: { page: "vehicules", onglet: "actifs", texte: "Voir tes véhicules" },
  mer: { page: "bateaux", onglet: "actifs", texte: "Voir tes bateaux" },
  entreprises: { page: "entreprises", onglet: "actifs", texte: "Voir tes boîtes" },
  montres: { page: "montres", onglet: "actifs", texte: "Voir tes montres" },
  encheres: { page: "encheres", onglet: "actifs", texte: "Voir les enchères" },
  combines: { page: "combines", onglet: "actifs", texte: "Voir tes combines" },
  vie: { page: "vie", onglet: "actifs", texte: "Voir ta vie" },
  villes: { page: "villes", onglet: "actifs", texte: "Voir les villes" },
};

/** Le lien du toast pour une famille ; null si l'on est déjà sur sa page (ou qu'elle n'en a pas). */
export function lienVers(famille) {
  const d = DESTINATIONS[famille];
  if (!d || !pages[d.page]) return null;
  if (etat.onglet === d.onglet && (d.page === d.onglet || pile().some((x) => x.id === d.page))
      && (!d.partie || (() => { try { return localStorage.getItem("actifs.onglet") === d.partie; } catch { return true; } })())) return null;
  return d;
}

async function allerVers(d) {
  if (etat.feuille) fermerFeuille();
  if (d.partie) return ouvrirRacine(d.onglet, {}, d.partie); // D341
  if (d.page === d.onglet) return allerOnglet(d.onglet);
  return ouvrir(d.page, d.p ?? {}, { onglet: d.onglet });
}

/** Change d'onglet ; toucher l'onglet déjà ouvert vide sa pile et remonte en haut (comme sur l'iPhone). */
async function allerOnglet(id) {
  memoriserDefilement();
  if (id === etat.onglet) {
    etat.piles[id] = etat.piles[id].slice(0, 1);
    etat.piles[id][0].defil = 0;
    if ($app().__entree === etat.piles[id][0]) window.scrollTo(0, 0); // déjà à la racine : on remonte
  }
  etat.onglet = id;
  // La perle part tout de suite, avant la lecture de la page (elle glisse pendant le calcul).
  if (document.getElementById("barre")) dessinerBarre();
  await afficher("");
}

window.addEventListener("popstate", () => { if (etat.ecran === "jeu") retour(); });

/** Lit les données d'une entrée de la pile ; elles restent dans l'entrée (le retour les réutilise). */
async function charger(e) {
  const def = pages[e.id];
  etat.chargements++;
  try {
    const d = def.donnees ? await def.donnees(ctx, e.p) : null;
    await completer(e, d);
    e.donnees = d;
  } catch (err) {
    console.error(err);
    if (e.donnees === undefined || e.donnees?.erreur) e.donnees = { erreur: err.message };
  } finally {
    etat.chargements--;
  }
}

/**
 * Affiche la pile après un geste de navigation. Une page déjà vue se montre tout de suite avec ses données
 * et sa position, puis se relit en arrière-plan et se met à jour en place. Une page neuve se lit ; son
 * squelette n'apparaît que si la lecture dépasse 120 ms (plus d'éclair de squelette).
 */
async function afficher(sens = "") {
  if (etat.ecran !== "jeu") return rendre();
  const { liste, detail } = disposition();
  const visibles = [liste, detail].filter(Boolean);
  for (const e of visibles) e.arrive = true; // un geste de navigation : la page arrive (etat.sens, dessinerDans)
  const neuves = visibles.filter((e) => e.donnees === undefined && pages[e.id].donnees);
  const anciennes = visibles.filter((e) => !neuves.includes(e));
  const lectures = neuves.map(charger);
  if (lectures.length) await Promise.race([Promise.all(lectures), new Promise((ok) => setTimeout(ok, 120))]);
  rendre(sens);
  if (lectures.length) { await Promise.all(lectures); rendre(); }
  // Une page déjà vue : relue sans bloquer, mise à jour en place si elle est toujours là.
  if (anciennes.length) { await Promise.all(anciennes.map(charger)); rendre(); }
}

/**
 * D205 : les cartes du mode en ligne sur une fiche (boîte, bien), comme l'iPhone les ajoute
 * quand la partie joue dans un monde (pages/enligne-fiches.js). Rangées dans `donnees.__enLigne`.
 */
async function completer(s, d) {
  const c = complements[s.id];
  if (!c || !d || d.erreur) return;
  d.__enLigne = await c.donnees(ctx, s.p).catch(() => null);
  if (d.__enLigne && c.css) await poserStyles([].concat(c.css)); // lot A : les styles du complément (lot E)
}

/** Recalcule ce qui est affiché (après une décision, le retour au premier plan…), sans squelette. */
async function rafraichir() {
  if (etat.ecran !== "jeu") return rendre();
  for (const e of pile()) if (e.arrive) e.arrive = false; // mise à jour en place : plus d'apparition
  etat.chargements++; // tout le rafraîchissement compte (les essais attendent la page à jour)
  try { await rafraichirTout(); } finally { etat.chargements--; }
}

async function rafraichirTout() {
  await jouer("etat", { minutes: etat.apercu.minutes, type: etat.apercu.type }, { silencieux: true });
  // D206 : la vraie météo des ports, au plus une fois par heure, sans attendre (la page se redessine si elle arrive).
  if (etat.jeu?.saison) actualiserMeteo(jouer, maintenant).then((ok) => { if (ok && ["port", "bateau", "chantierNaval", "actifs"].includes(sommet()?.id)) rafraichir(); });
  const { liste, detail } = disposition();
  await Promise.all([liste, detail].filter(Boolean).map(charger));
  // Les pages cachées de la pile se relisent quand on y revient (elles montrent d'abord leurs données gardées).
  rendre();
  if (etat.feuille?.rendu) majFeuille();
  ecouter();
}

// MARK: Feuilles (sheets)

/** Une feuille du bas : `contenu` (HTML) ou `rendu()` (redessinée après chaque décision, en place). */
function ouvrirFeuille({ titre, contenu = "", rendu = null, actions = {} }) {
  etat.feuille = { titre, contenu, rendu, actions };
  let d = document.getElementById("feuille");
  if (!d) {
    d = document.createElement("dialog");
    d.id = "feuille";
    d.className = "feuille";
    d.addEventListener("close", () => { etat.feuille = null; });
    d.addEventListener("click", (e) => { if (e.target === d) fermerFeuille(); });
    document.body.append(d);
  }
  majFeuille();
  if (!d.open) d.showModal();
  d.querySelector("input,select,textarea")?.focus({ preventScroll: true });
}

function majFeuille() {
  const d = document.getElementById("feuille");
  const f = etat.feuille;
  if (!d || !f) return;
  const corps = f.rendu ? f.rendu() : f.contenu;
  // La même feuille, redessinée : mise à jour en place (défilement, saisie et focus gardés).
  if (d.__feuille === f && d.open) {
    d.querySelector(".tete h2").textContent = f.titre;
    patcher(d.querySelector(".corps-feuille"), corps);
  } else {
    d.innerHTML = `<div class="poignee"></div>
      <div class="tete"><h2>${esc(f.titre)}</h2><button class="rond" data-action="fermerFeuille" aria-label="Fermer">✕</button></div>
      <div class="corps-feuille">${corps}</div>`;
    d.__feuille = f;
  }
  apresDessin(d);
}

function fermerFeuille() {
  const d = document.getElementById("feuille");
  if (d?.open) d.close();
  if (d) d.__feuille = null;
  etat.feuille = null;
}

// MARK: Démarrage

/**
 * Lot A : les styles des zones. Une page déclare `css: "focus"` (ou une liste) ; depuis le lot F, chaque
 * fichier css/pages/<zone>.css est posé au chargement du fichier de pages qui le déclare (pages/index.js,
 * poserStyles) ; l'accueil, premier écran du jeu, se charge pendant le téléchargement du moteur.
 */
const styles = chargerFichier("accueil").catch(() => {});

async function demarrer() {
  appliquerIcone(); // D391 : l'icône choisie devient le favicon de l'onglet
  rendre();
  try {
    etat.moteur = await ouvrirMoteur({ progres: (p) => depart.majChargement(p) });
  } catch (e) {
    etat.ecran = "erreur";
    etat.erreur = e.message;
    return rendre();
  }
  await Promise.race([styles, new Promise((ok) => setTimeout(ok, 3000))]);
  try { etat.decalage = await serveur.decalageHeure(); } catch { etat.decalage = 0; }
  await serveur.verifierVersion(); // RNT-263 : le minimum du serveur ; trop ancienne, l'app le sait avant tout appel en ligne
  try {
    etat.compte = await serveur.lireCompte();
  } catch (e) {
    if (e.code === "autre_appareil") return deconnecte(e);
    etat.horsLigne = true; // pas de réseau : on joue avec la partie du navigateur
  }
  if (!etat.compte && !etat.horsLigne) {
    etat.ecran = "compte";
    return rendre();
  }
  await chargerPartie();
}

/**
 * La partie du navigateur ou celle du serveur, selon la règle de l'iPhone (RNT-118).
 * D237 : `reprise` (compte repris ou créé ici) : celle du serveur fait foi ; une partie neuve du navigateur
 * ne la remplace jamais ; une partie qui la ferait reculer reste ici mais ne part pas sans l'accord du joueur.
 */
async function chargerPartie({ reprise = false } = {}) {
  const locale = lireLocal();
  let donnees = locale?.donnees ?? null;
  let pourquoi = null;
  etat.remplacement = null;
  if (!etat.horsLigne) {
    try {
      const s = await serveur.lireSauvegarde();
      if (s) {
        // D401 : le moteur résume les deux copies (coffres, succès, cartes et cosmétiques compris) et décide,
        // comme sur l'iPhone (DecisionSynchro) : plus de seconde version de la règle écrite en JavaScript.
        const partieServeur = await resumeMoteur(s.donnees), partieLocale = donnees ? await resumeMoteur(donnees) : null;
        retenirResumeServeur(partieServeur);
        const envoyee = Number(lire("grind.versionEnvoyee") ?? 0);
        // Un moteur qui ne sait pas décider (il n'arrive pas) : la règle des versions seule (RNT-118), et rien ne part
        // (sauvegarder attend un résumé du moteur).
        const d = await moteurSynchro("synchro.decider", { serveur: s.version, locale: locale?.version ?? 0, envoyee, partieServeur, partieLocale, reprise })
          ?? { prendre: reprise || s.version > Math.max(locale?.version ?? 0, envoyee) ? "serveur" : "locale" };
        if (d.prendre === "serveur" || !donnees) {
          if (donnees) pourquoi = reprise ? "compte repris" : d.localeNeuve ? "la partie du navigateur était neuve" : "plus récente";
          else if (reprise) pourquoi = "compte repris";
          donnees = s.donnees;
          ecrireLocal(s.donnees, s.version);
          ecrire("grind.versionEnvoyee", String(s.version));
        } else if (d.confirmer) etat.remplacement = d.confirmer;
      }
    } catch (e) { if (e.code === "autre_appareil") return deconnecte(e); }
  }
  const r = await jouer("charger", { sauvegarde: donnees, ...(pourquoi ? { reprise: pourquoi } : {}) }, { silencieux: true });
  if (!r) {
    etat.ecran = "erreur";
    etat.erreur = "La partie n'a pas pu être relue par le moteur.";
    return rendre();
  }
  etat.modifie = false;
  if (document.visibilityState === "visible") await noterPresence(true); // D455 : le jeu est ouvert
  if (pourquoi) { etat.modifie = true; toast("Ta partie du serveur est reprise sur ce navigateur.", "gain"); }
  if (!r.saison || r.terminee) await ouvrirProfils();
  else entrerDansLeJeu();
  if (etat.remplacement) demanderRemplacement();
  else recevoirCorrections();
}

/**
 * RNT-293 : les corrections de l'admin, appliquées par le moteur comme sur l'iPhone (ModeleCompte.recevoirCorrections) :
 * chacune une seule fois sur ce navigateur (notée avant), puis signalée au serveur. Au plus une lecture par minute.
 */
let correctionsLues = 0;
async function recevoirCorrections() {
  if (!etat.compte || etat.horsLigne || etat.ecran !== "jeu" || Date.now() - correctionsLues < 60_000) return;
  correctionsLues = Date.now();
  let liste;
  try { liste = await serveur.corrections(); } catch { return; }
  if (!liste?.length) return;
  let traitees = [];
  try { traitees = JSON.parse(lire("grind.correctionsTraitees") ?? "[]"); } catch {}
  const deja = liste.filter((c) => traitees.includes(c.id)).map((c) => c.id);
  const nouvelles = liste.filter((c) => !traitees.includes(c.id));
  ecrire("grind.correctionsTraitees", JSON.stringify([...traitees, ...nouvelles.map((c) => c.id)].slice(-500)));
  const r = nouvelles.length ? await jouer("corrections.appliquer", { corrections: nouvelles }, { silencieux: true }) : null;
  // Un type que ce moteur ne sait pas lire reste en attente, pour une version plus récente (ni noté, ni signalé).
  const illisibles = nouvelles.map((c) => c.id).filter((id) => r && !r.ids.includes(id));
  if (illisibles.length) ecrire("grind.correctionsTraitees", JSON.stringify([...traitees, ...nouvelles.map((c) => c.id)].filter((id) => !illisibles.includes(id)).slice(-500)));
  const ids = [...deja, ...(r?.ids ?? [])];
  if (r?.ids?.length) {
    // D401 : une carte ou un cosmétique retiré par l'admin l'est pour de bon : ce que le serveur connaît descend aussi.
    const connue = resumeServeurConnu();
    if (connue) retenirResumeServeur((await moteurSynchro("synchro.abaisser", { connue, locale: await resumeMoteur(null) }))?.resume ?? connue);
    etat.modifie = true; await sauvegarder(); await rafraichir();
  }
  if (ids.length) serveur.correctionsAppliquees(ids, r?.erreurs ?? {}).catch(() => {});
}

/**
 * D205 : le début d'une saison se fait dans le jeu, comme ChoixProfil sur l'iPhone : où commencer
 * (solo, monde privé, monde public), le profil, la ville, la banque (pages/saison.js).
 */
async function ouvrirProfils() {
  nouveauJoueur(); // RNT-196 : sans version vue, un joueur qui commence n'a pas de « Quoi de neuf »
  etat.piles = Object.fromEntries(ONGLETS.map((o) => [o.id, [{ id: o.id, p: {} }]]));
  etat.onglet = "accueil";
  etat.piles.accueil.push({ id: "saison", p: {} });
  etat.ecran = "jeu";
  history.replaceState({ n: 2 }, "");
  await afficher("");
}

function entrerDansLeJeu() {
  etat.ecran = "jeu";
  history.replaceState({ n: 1 }, "");
  afficher("");
  etat.silenceJusqua = Date.now() + 1500;
  ecouter(); // le premier appel apprend l'état : rien ne sonne au lancement
  verifierRecu(ctx); // RNT-172 : une session payée pendant l'absence montre son reçu
  chargerCatalogue(ctx).catch(() => null); // RNT-231 : pose le thème équipé
  verifierNouveautes(ctx); // RNT-196 : une fois après chaque mise à jour (après le reçu s'il est ouvert)
}

function deconnecte(e) {
  etat.ecran = "compte";
  etat.modeCompte = "reprendre";
  toast(e.message, "refus");
  rendre();
}

// MARK: Sauvegarde

const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

function lireLocal() {
  const t = lire("grind.sauvegarde");
  if (!t) return null;
  try { return { donnees: JSON.parse(t), version: Number(lire("grind.versionLocale") ?? 0) }; } catch { return null; }
}

function ecrireLocal(donnees, version) {
  ecrire("grind.sauvegarde", JSON.stringify(donnees));
  ecrire("grind.versionLocale", String(version));
}

/** Exporte la partie, la garde dans le navigateur, puis l'envoie au serveur (un envoi à la fois). */
async function sauvegarder() {
  // D356 : jamais de sauvegarde (ni locale ni envoyée) quand un module n'a pas pu se charger.
  if (!etat.moteur || etat.ecran !== "jeu" || globalThis.__grindModulesCasses) return;
  const r = await etat.moteur.appel({ cmd: "exporter", maintenant: maintenant() });
  if (!r.ok) return;
  const version = Math.max(Math.round(maintenant()), Number(lire("grind.versionLocale") ?? 0) + 1);
  ecrireLocal(r.sauvegarde, version);
  etat.modifie = false;
  if (etat.horsLigne || !etat.compte) return;
  if (etat.envoi) { etat.renvoyer = true; return; }
  etat.envoi = (async () => {
    // D237 : un envoi retenu s'arrête sans rien attendre ; sans ce premier tour, il finissait avant que
    // `etat.envoi` soit posé, et la promesse restait là pour toujours (plus aucun envoi ensuite).
    await null;
    do {
      etat.renvoyer = false;
      const v = Number(lire("grind.versionLocale"));
      // D401 : une question déjà posée (la copie du serveur a moins que celle-ci) : rien ne part avant la réponse.
      if (etat.remplacement && !etat.remplacementAccepte) break;
      const donnees = lireLocal().donnees, resume = await resumeMoteur(null);
      // D237 : une partie qui ferait reculer celle du serveur ne part pas sans l'accord du joueur.
      // D401 : le moteur compare, coffres, succès, cartes de fortune et cosmétiques compris.
      const connue = resumeServeurConnu();
      // Sans résumé du moteur, on ne sait pas si la partie recule : elle reste ici (la prochaine sauvegarde réessaie).
      if (!resume && !etat.remplacementAccepte) break;
      const recul = etat.remplacementAccepte || !connue ? null
        : (await moteurSynchro("synchro.reculerait", { nouvelle: resume, ancienne: connue }))?.recul ?? null;
      if (recul) {
        if (!etat.remplacement) { etat.remplacement = recul; demanderRemplacement(); }
        break;
      }
      try {
        if (etat.remplacementAccepte) await serveur.remplacerSauvegarde(donnees, v);
        else await serveur.ecrireSauvegarde(donnees, v);
        etat.remplacementAccepte = false;
        retenirResumeServeur(resume);
        ecrire("grind.versionEnvoyee", String(v));
      } catch (e) {
        if (e.code === "autre_appareil") deconnecte(e);
        // D237 : le serveur (sauvegardes-protegees.sql) garde sa partie, plus avancée : on la reprend.
        else if (e.code === "ecraserait_partie") {
          etat.envoi = null;
          await chargerPartie({ reprise: true });
          toast("Le serveur avait une partie plus avancée : elle est reprise ici.", "refus");
          return;
        }
        break;
      }
    } while (etat.renvoyer);
    etat.envoi = null;
  })();
}

// D237 : ce que le serveur a (résumé de la partie), au dernier échange réussi.
function resumeServeurConnu() {
  try { return JSON.parse(lire("grind.resumeServeur") ?? "null"); } catch { return null; }
}
function retenirResumeServeur(r) { if (r) ecrire("grind.resumeServeur", JSON.stringify(r)); }
/** D401 : une commande de synchro au moteur (sans toast ni « modifié ») ; null s'il refuse. */
async function moteurSynchro(cmd, params) {
  const r = await etat.moteur.appel({ cmd, maintenant: maintenant(), ...params });
  return r?.ok ? r : null;
}
/** D401 : le résumé d'une sauvegarde par le moteur ; `null` : celui de la partie chargée. */
async function resumeMoteur(donnees) {
  return (await moteurSynchro("synchro.resume", donnees ? { sauvegarde: donnees } : {}))?.resume ?? null;
}

/** D237 : « Remplacer ta partie du serveur ? » — oui : celle du navigateur part ; non : celle du serveur revient. */
async function demanderRemplacement() {
  const recul = etat.remplacement;
  if (!recul || etat.questionRemplacement) return;
  etat.questionRemplacement = true;
  const oui = await confirmer({ titre: "Remplacer ta partie du serveur ?", danger: true, oui: "Remplacer", non: "Reprendre celle du serveur",
    texte: `Sur ce navigateur, ${recul.texte}. Remplacer efface la partie du serveur.` });
  etat.questionRemplacement = false;
  etat.remplacement = null;
  if (oui) {
    etat.remplacementAccepte = true;
    etat.modifie = true;
    await sauvegarder();
  } else {
    await chargerPartie({ reprise: true });
  }
}

setInterval(() => { if (etat.modifie) sauvegarder(); }, 30_000);

// MARK: Le focus et l'onglet

function sessionEnCours() {
  const s = etat.jeu?.focus?.session;
  return s && !s.arretVolontaire ? s : null;
}

document.addEventListener("visibilitychange", async () => {
  if (etat.ecran !== "jeu") return;
  if (document.visibilityState === "hidden") {
    // D364 (Arthur, 15/11) : plus d'infraction quand l'onglet est caché. Le navigateur ne distingue pas
    // l'écran verrouillé d'une autre app ouverte, et verrouiller coupait la session. Tant pis pour la triche
    // sur le web, en attendant le compte développeur Apple (et Temps d'écran dans l'app).
    noterPresence(false); // D455 : fermé (le moteur traite les appels dans l'ordre : la sauvegarde le contient)
    sauvegarder();
  } else {
    await noterPresence(true); // D455 : ouvert, avant le rattrapage
    const avant = sessionEnCours();
    const coupure = coupureEnAttente();
    etat.silenceJusqua = Date.now() + 1500; // un rattrapage au retour se tait (RNT-102)
    await jouer(avant ? "onglet.revenu" : "actif");
    if (avant && !sessionEnCours()) {
      const recu = etat.jeu.focus.dernierRecu;
      // RNT-217 : une question restée sans réponse pendant l'absence l'a arrêtée, pas l'onglet quitté.
      if (coupure && coupure.t <= maintenant()) annoncerCoupure(coupure);
      else if (!recu || recu.debut !== avant.debut) toast("Session arrêtée pendant ton absence.", "refus");
    }
    // RNT-172 : de retour après une session payée, son reçu s'ouvre.
    verifierRecu(ctx, { neuf: !!avant });
    // D218 : de retour dans l'onglet, le fil tout de suite (sans attendre ses 8 s).
    if (etat.compte && !etat.horsLigne) enLigne.synchroniserFil(ctx, { force: true }).catch(() => {});
    recevoirCorrections(); // RNT-293
    rafraichir();
  }
});
window.addEventListener("pagehide", () => {
  if (etat.ecran === "jeu" && etat.jeu?.saison) { noterPresence(false); sauvegarder(); return; } // D455
  if (etat.modifie) sauvegarder();
});

// Une fois par seconde : le chrono, la fin de session, les contrôles de présence.
let finDemandee = null;
let avisEncheresA = 0;
/** RNT-334 : le dernier changement de palier annoncé dans ce navigateur. */
const CLE_ANNONCE_PALIER = "grind.palier.annonce";
let ticsEconomie = 0;
let minuitDemande = null; // RNT-387 : le minuit déjà demandé (une fois)
let paliersPublies = null; // RNT-362 : les paliers du dernier tic
// D364 (Arthur, 15/11) : pendant une session, l'écran reste allumé (Wake Lock). Sans ça, le téléphone
// se verrouillait tout seul au bout de quelques minutes, l'onglet passait « caché » et la session tombait
// comme si on avait ouvert une autre app. Rendu à la fin de la session ; repris au retour dans l'onglet
// (le navigateur le relâche quand la page est cachée).
let verrouEcran = null;
async function garderEcranAllume(oui) {
  try {
    if (oui && !verrouEcran && document.visibilityState === "visible" && navigator.wakeLock) {
      verrouEcran = await navigator.wakeLock.request("screen");
      verrouEcran.addEventListener?.("release", () => { verrouEcran = null; });
    } else if (!oui && verrouEcran) {
      const v = verrouEcran; verrouEcran = null; await v.release();
    }
  } catch { verrouEcran = null; }
}

let battementA = 0; // D455 : le dernier battement « ouvert »
setInterval(async () => {
  if (etat.ecran !== "jeu") return;
  if (document.visibilityState === "visible" && Date.now() - battementA >= 60_000) { battementA = Date.now(); noterPresence(true); }
  const s = sessionEnCours();
  garderEcranAllume(!!s); // D364
  enLigne.suivreNePasDeranger(ctx, s); // RNT-400 (D343) : la session « Ne pas déranger » finie, son résumé
  if (s) {
    const fin = finSession(s); // RNT-400 : pauses comprises
    if (maintenant() >= fin && finDemandee !== s.id) {
      finDemandee = s.id;
      await jouer("actif"); // le moteur clôt la session menée à terme et paie
      const recu = etat.jeu.focus.dernierRecu;
      // RNT-172 : le reçu s'ouvre (sinon, au moins le montant).
      if (!sessionEnCours() && recu && !verifierRecu(ctx, { neuf: true })) toast(`Session tenue : +${depart.montant(recu.salaire + recu.bonus)}`, "gain");
      await sauvegarder(); // tout de suite : fermer l'onglet juste après ne doit rien faire perdre
      await rafraichir();
    }
    // RNT-217 : sans réponse à « Toujours là ? » dans la fenêtre, la session s'arrête à l'échéance, tout de suite.
    const coupure = coupureEnAttente();
    if (coupure && maintenant() >= coupure.t && finDemandee !== `coupure-${s.id}`) {
      finDemandee = `coupure-${s.id}`;
      await jouer("actif"); // le moteur arrête la session, payée jusqu'à la dernière réponse
      if (!sessionEnCours()) annoncerCoupure(coupure);
      await sauvegarder();
      await rafraichir();
    }
    verifierPresence();
  }
  verifierCarteFortune();
  // RNT-387 : minuit de Bruxelles passé, l'onglet ouvert : la veille se clôt (combines, parloir… repartent).
  const minuit = etat.jeu?.prochainMinuit;
  if (minuit && maintenant() >= minuit && !etat.decisions && minuitDemande !== minuit) {
    minuitDemande = minuit;
    await jouer("minuit", {}, { silencieux: true });
    await sauvegarder();
    await rafraichir();
  }
  // RNT-261 : en mode économie, les pages ne se mettent à jour que toutes les cinq secondes.
  const { liste, detail } = disposition();
  if (!economieActive() || ++ticsEconomie % 5 === 0) for (const e of [liste, detail]) if (e) pages[e.id]?.tic?.(ctx, e.donnees ?? null, e.p);
  // RNT-221 : « on t'a dépassé » sur une vente : un toast et une notification du navigateur qui ouvre la vente.
  if (etat.jeu?.saison && !etat.decisions && Date.now() - avisEncheresA > 10_000) {
    avisEncheresA = Date.now();
    const r = await jouer("encheres.avis", {}, { silencieux: true });
    for (const a of r?.avis ?? []) await enLigne.annoncer(ctx, { titre: a.titre, texte: a.texte, cle: a.vendue ? `enchere-vendue-${a.vente}` : a.gagnee ? `enchere-gagnee-${a.vente}` : `enchere-${a.vente}`, cible: { sorte: "enchere", id: a.vente } }); // RNT-372 : dépassé ou adjugé
    // RNT-250 : un favori arrivé sur le marché : un toast et une notification qui ouvre l'offre (une fois : le moteur s'en souvient).
    const f = await jouer("favoris.avis", {}, { silencieux: true });
    for (const a of f?.avis ?? []) await enLigne.annoncer(ctx, { titre: a.titre, texte: a.texte, cle: `favori-${a.cle}`, cible: a.cible });
    // D447 : l'entourage (le Cercle) en notification du navigateur, catégorie « Entourage ».
    await enLigne.annoncerEntourage(ctx);
    // RNT-267 : l'heure d'un résumé venue (8 h, 19 h), ce qui attendait arrive ensemble.
    await enLigne.envoyerResumes(ctx);
    // D328 : ce dont l'heure est connue (fin de vente, arrivée, facture) se programme d'avance.
    await enLigne.programmerEcheances(ctx);
  }
  // RNT-362 : une carte de fortune ou un palier du salaire qui change part au profil tout de suite (sans la minute).
  const paliers = `${etat.jeu?.palierFortune ?? 0}:${etat.jeu?.focus?.salairePalier?.palier ?? 0}`;
  if (paliersPublies !== null && paliers !== paliersPublies && etat.jeu?.saison && etat.compte && !etat.horsLigne) enLigne.synchroniser(ctx, { force: true });
  paliersPublies = paliers;
  // RNT-334 : le palier du salaire (et la carte de fortune) qui monte ou descend : une notification, une fois par changement.
  const ap = etat.jeu?.focus?.salairePalier?.annonce;
  if (ap && etat.jeu?.saison) {
    let vu = null;
    try { vu = localStorage.getItem(CLE_ANNONCE_PALIER); } catch {}
    if (vu !== ap.id) {
      try { localStorage.setItem(CLE_ANNONCE_PALIER, ap.id); } catch {}
      enLigne.annoncer(ctx, { cle: ap.id, titre: ap.titre, texte: ap.texte, ton: ap.monte ? "gain" : "info" });
    }
  }
  // D205 : en ligne, comme l'iPhone au premier plan, on publie et on relit le monde au plus une fois par minute.
  if (document.visibilityState === "visible" && etat.compte && !etat.horsLigne && !etat.decisions) {
    enLigne.synchroniser(ctx);
    enLigne.synchroniserFil(ctx); // D218 : le fil à part, toutes les 8 s (il se cadence lui-même)
  }
}, 1000);

/** RNT-217 : l'échéance de la question en attente (le moteur arrête la session là) et ce qu'on dira alors. */
function coupureEnAttente() {
  const t = sessionEnCours() ? etat.jeu?.coupure : null;
  return t ? { t, texte: etat.jeu.texteCoupure ?? "" } : null;
}

/** RNT-217 : « Session arrêtée : tu n'as pas répondu », à la place de « Session tenue » (la notification de l'iPhone). */
function annoncerCoupure(coupure) {
  document.getElementById("presence")?.close();
  toast(`Session arrêtée : tu n'as pas répondu. ${coupure.texte}`.trim(), "refus");
  jouerSon("alerte");
}

/** RNT-276 (D263) : une carte de fortune débloquée se montre une fois (2 s), puis le moteur le note. */
function verifierCarteFortune() {
  const p = etat.jeu?.fortuneADevoiler;
  if (p == null || document.getElementById("deblocage-fortune")) return;
  const hote = document.createElement("div");
  hote.id = "deblocage-fortune";
  hote.innerHTML = sceneDeblocage(p);
  let fini = false;
  const fermer = async () => {
    if (fini) return;
    fini = true;
    hote.remove();
    await jouer("fortune.vue", { palier: p }, { silencieux: true });
  };
  hote.addEventListener("click", fermer);
  document.body.appendChild(hote);
  setTimeout(fermer, 4600);
}

/** « Toujours là ? » : un contrôle passé et pas encore confirmé ouvre la question. */
function verifierPresence() {
  const s = sessionEnCours();
  const controles = etat.jeu?.controlesPresence ?? [];
  const passes = controles.filter((c) => c <= maintenant()).length;
  let d = document.getElementById("presence");
  if (s && passes > (s.presencesConfirmees ?? 0)) {
    if (!d) {
      d = document.createElement("dialog");
      d.id = "presence";
      d.className = "alerte-presence";
      d.innerHTML = `<h2>Toujours là ?</h2>
        <p class="aide">Confirme que tu es toujours concentré, sinon la session s'arrête ici.</p>
        <button class="bouton" data-action="presence">Je suis là</button>`;
      document.body.append(d);
    }
    if (!d.open) { d.showModal(); jouerSon("alerte"); }
  } else if (d?.open) d.close();
}

// MARK: Actions globales

const actions = {
  ouvrir: (b) => ouvrir(b.dataset.page, b.dataset.p ? JSON.parse(b.dataset.p) : {}),
  retour: () => history.state?.n > 1 ? history.back() : retour(),
  onglet: (b) => allerOnglet(b.dataset.onglet),
  fermerFeuille: () => fermerFeuille(),
  // RNT-212 : un nom ou un avatar de joueur, partout (lienJoueur, ui.js) : son profil.
  async profilJoueur(b) {
    const { ouvrirFicheJoueur } = await import("./pages/joueurs.js?v=3e8bddd9");
    return ouvrirFicheJoueur(ctx, b.dataset.joueur, b.dataset.pseudo ?? "");
  },
  // Lot A : ✕ du panneau de détail (palier large) : tout le détail se ferme, la liste reste.
  fermerPanneau: () => fermerPanneau(),
  // RNT-175 : le bouton « Épingler » de chaque fiche, et le montant d'un titre à épingler.
  epinglerBut: (b) => objectifs.basculerEpingle(ctx, b),
  epinglerMontant: (b) => objectifs.feuilleMontant(ctx, b),
  // RNT-250 : l'étoile « Favori » des fiches et de Mes favoris.
  async favori(b) { const { basculerFavori } = await import("./pages/favoris.js?v=3e8bddd9"); return basculerFavori(ctx, b); },
  // Lot A : le « ? » d'un écran (boutonAide) ; les fiches viennent du lot C, sinon le guide.
  aide: (b) => (aideContextuelle.ouvrir ? aideContextuelle.ouvrir(ctx, b.dataset.sujet) : ouvrir("guide", {})),
  async presence() {
    const r = await jouer("focus.presence");
    document.getElementById("presence")?.close();
    // RNT-217 : trop tard, on le dit (la session est déjà arrêtée) au lieu de ne rien faire.
    if (r?.messagePresence) toast(r.messagePresence, "refus");
    rafraichir();
  },

  // Compte
  modeCompte: (b) => { etat.modeCompte = b.dataset.mode; rendre(); },
  async creerCompte() {
    const pseudo = document.getElementById("pseudo").value.trim();
    const code = serveur.tirerCodeRecuperation();
    try {
      etat.compte = await serveur.creerCompte(pseudo, code);
      ecrire("grind.recuperation", code);
      etat.codeAMontrer = code;
      rendre();
    } catch (e) { toast(e.message, "refus"); }
  },
  async codeNote() { etat.codeAMontrer = null; await chargerPartie(); },
  // RNT-220 : ce navigateur a déjà tenu le compte : son code y est encore, pas besoin d'aller le chercher.
  codeGarde() {
    const champ = document.getElementById("code"), code = lire("grind.recuperation") ?? "";
    if (!champ || !code) return;
    champ.value = code.replace(/(.{4})(?=.)/g, "$1 ");
    champ.dispatchEvent(new Event("input", { bubbles: true }));
  },
  async reprendreCompte() {
    const pseudo = document.getElementById("pseudo").value.trim();
    const code = document.getElementById("code").value;
    try {
      etat.compte = await serveur.recupererCompte(pseudo, code);
      ecrire("grind.recuperation", code.toUpperCase().replace(/[^A-Z0-9]/g, ""));
      // D237 : la partie du serveur fait foi : celle du navigateur n'est jamais envoyée par-dessus.
      ["grind.sauvegarde", "grind.versionLocale", "grind.versionEnvoyee", "grind.resumeServeur"].forEach((k) => localStorage.removeItem(k));
      toast(`Bon retour, ${etat.compte.pseudo}.`, "gain");
      await chargerPartie({ reprise: true });
    } catch (e) { toast(e.message, "refus"); }
  },

  // Profils
  choisirProfil: (b) => { if (etat.profilChoisi !== b.dataset.id) depart.etatSecteur.choisi = null; etat.profilChoisi = b.dataset.id; rendre(); },
  // D342 : la boîte de départ au choix (le fondateur).
  choisirSecteurDepart: (b) => { depart.etatSecteur.choisi = b.dataset.secteur; rendre(); },
  async commencer() {
    const p = etat.profils.find((x) => x.id === etat.profilChoisi);
    if (!p?.debloque) return;
    const r = await jouer("nouvelleSaison", { profil: p.id, remplacer: !!etat.jeu?.saison, ...(depart.etatSecteur.choisi ? { secteur: depart.etatSecteur.choisi } : {}) });
    if (!r) return;
    etat.piles = Object.fromEntries(ONGLETS.map((o) => [o.id, [{ id: o.id, p: {} }]]));
    etat.onglet = "accueil";
    await sauvegarder();
    toast(`Saison lancée : ${p.nom}`, "gain");
    entrerDansLeJeu();
  },
  nouvelleSaison: () => (etat.ecran === "jeu" ? ouvrir("saison") : ouvrirProfils()),
};

/** L'entrée de la pile qui reçoit un geste : celle du panneau, celle de la liste, sinon le sommet. */
function entreeDuGeste(el) {
  const { liste, detail } = disposition();
  if (detail && el.closest("#panneau")) return { e: detail, source: "panneau" };
  if (el.closest("#app")) return { e: liste, source: detail ? "liste" : null };
  return { e: sommet(), source: null };
}

document.addEventListener("click", async (ev) => {
  const b = ev.target.closest("[data-action]");
  if (!b || b.disabled) return;
  ev.preventDefault();
  const nom = b.dataset.action;
  const { e: s, source } = etat.ecran === "jeu" ? entreeDuGeste(b) : { e: null, source: null };
  const def = etat.ecran === "jeu" ? pages[s?.id] : null;
  etat.cible = s;
  etat.source = source;
  // D345 (vidéo 7) : un bouton principal dont l'action dure montre le cercle d'attente, puis la coche si elle rend vrai.
  const suivi = suivreBouton(b);
  let r;
  try {
    const c = etat.ecran === "jeu" ? complements[s?.id]?.actions?.[nom] : null;
    if (etat.feuille?.actions?.[nom]) r = await etat.feuille.actions[nom](ctx, b, s?.donnees ?? null, s?.p);
    else if (def?.actions?.[nom]) r = await def.actions[nom](ctx, b, s?.donnees ?? null, s?.p);
    else if (c) r = await c(ctx, b, s?.donnees ?? null, s?.p);
    else if (actions[nom]) r = await actions[nom](b);
    else console.warn("Action inconnue :", nom);
    return r;
  } catch (e) {
    console.error(e);
    toast(e.message, "refus");
  } finally {
    suivi.fin(r === true);
    etat.source = null;
  }
});
document.addEventListener("submit", (ev) => ev.preventDefault());
document.addEventListener("input", (ev) => {
  // Le bouton du formulaire de compte s'allume quand le pseudo (et le code) sont plausibles.
  if (ev.target.id === "pseudo" || ev.target.id === "code") {
    const p = document.getElementById("pseudo")?.value.trim() ?? "";
    const c = (document.getElementById("code")?.value ?? "").replace(/[^A-Za-z0-9]/g, "");
    const b = document.querySelector("[data-action=creerCompte],[data-action=reprendreCompte]");
    if (b) b.disabled = p.length < 2 || (b.dataset.action === "reprendreCompte" && c.length !== 12);
  }
  // Une page peut réagir à la saisie (aperçu d'un montant…) : data-saisie="nomAction".
  const a = ev.target.dataset?.saisie;
  if (!a || etat.ecran !== "jeu") return;
  const { e: s } = entreeDuGeste(ev.target);
  etat.cible = s;
  (etat.feuille?.actions?.[a] ?? pages[s?.id]?.actions?.[a])?.(ctx, ev.target, s?.donnees ?? null, s?.p);
});
// Lot A : le champ fichier en français montre le nom du fichier choisi.
document.addEventListener("change", (ev) => { if (ev.target.matches?.(".champ-fichier input[type=file]")) majChampFichier(ev.target); });
// Lot A : une photo chargée remplace son repli ; une photo absente le laisse.
document.addEventListener("load", (ev) => { if (ev.target.matches?.("img[data-photo]")) ev.target.parentElement.classList.add("chargee"); }, true);
document.addEventListener("error", (ev) => { if (ev.target.matches?.("img[data-photo]")) ev.target.parentElement.classList.add("ratee"); }, true);

// Lot A : le clavier du Mac. 1 à 5 : les onglets ; Échap : revenir ; « / » : chercher.
document.addEventListener("keydown", (ev) => {
  if (etat.ecran !== "jeu" || ev.metaKey || ev.ctrlKey || ev.altKey || ev.defaultPrevented) return;
  if (ev.target.closest?.("input, textarea, select, [contenteditable]") || document.querySelector("dialog[open]")) return;
  if (document.body.classList.contains("sans-barre")) return;
  if (/^[1-5]$/.test(ev.key)) { ev.preventDefault(); allerOnglet(ONGLETS[Number(ev.key) - 1].id); } else if (ev.key === "Escape" && pile().length > 1 && !document.documentElement.classList.contains("carte-ouverte")) { // RNT-411 : Échap ferme d'abord la carte en plein écran
     ev.preventDefault(); actions.retour(); } else if (ev.key === "/") {
    const c = document.querySelector("#panneau input[type=search], #app input[type=search], #app input[data-recherche]");
    if (c) { ev.preventDefault(); c.focus(); }
  }
});

brancherGlisser();
brancherMouvements();
brancherIconesJeu();

// MARK: Dessin

const squelette = (def, racine) => `${racine ? "" : entetePousse(def.titre ?? "")}<div class="squelette-page"><div class="squelette"></div><div class="squelette bas"></div></div>`;

/**
 * Dessine la pile : la page de #app et, au palier large, le détail dans #panneau. Une page déjà dans son
 * conteneur se met à jour en place (patcher) ; une page qui arrive entre (glissement, `sens`).
 */
function rendre(sens = "aucun") {
  const app = $app();
  const pan = $panneau();
  document.body.dataset.palier = etat.palier;
  if (etat.ecran !== "jeu") {
    document.getElementById("barre")?.remove();
    document.body.classList.add("sans-barre");
    document.body.classList.remove("avec-panneau");
    app.innerHTML = depart.ecran(etat);
    app.__entree = null;
    if (pan) { pan.innerHTML = ""; pan.__entree = null; }
    return;
  }
  const { liste, detail } = disposition();
  document.body.classList.toggle("avec-panneau", !!detail);
  dessinerDans(app, liste, { sens, ample: !detail });
  if (detail) dessinerDans(pan, detail, { sens, ample: false });
  else if (pan?.__entree) { pan.innerHTML = ""; pan.__entree = null; }
  // Le premier détail du panneau se ferme par ✕ (fermerPanneau) ; un détail empilé dessus garde son retour.
  if (detail) {
    const premier = pile().indexOf(detail) === pile().indexOf(disposition().liste) + 1;
    const b = pan.querySelector(".entete-pousse [data-action=retour]");
    if (b && premier) { b.dataset.action = "fermerPanneau"; b.setAttribute("aria-label", "Fermer"); b.innerHTML = icones.fermer; }
  }
  // La ligne de la liste dont le détail est ouvert à droite est marquée.
  for (const b of app.querySelectorAll("[data-action=ouvrir][data-page]")) {
    const ouverte = !!detail && b.dataset.page === detail.id && (b.dataset.p ?? "{}") === JSON.stringify(detail.p ?? {});
    if (ouverte) b.setAttribute("aria-current", "true"); else if (b.getAttribute("aria-current") === "true") b.removeAttribute("aria-current");
  }
  // D205 : le début d'une saison n'a pas d'onglets (comme ChoixProfil, en plein écran).
  const def = pages[sommet().id];
  const sansBarre = typeof def.sansBarre === "function" ? def.sansBarre(ctx) : !!def.sansBarre;
  document.body.classList.toggle("sans-barre", sansBarre);
  if (sansBarre) { document.getElementById("barre")?.remove(); return; }
  dessinerBarre();
}

function dessinerDans(conteneur, e, { sens, ample }) {
  const def = pages[e.id];
  const racine = e === pile()[0];
  const large = ample && etat.palier !== "compact" && !!def.renduLarge;
  const charge = !(e.donnees === undefined && def.donnees);
  const enPlace = conteneur.__entree === e && conteneur.firstElementChild?.classList.contains("page");
  // `etat.sens` : la page arrive ("", "retour") jusqu'au prochain rafraîchissement de ses données, puis « aucun »
  // (l'accueil du lot C décale ses blocs à l'arrivée, pas à chaque rafraîchissement ; un redessin les garde).
  if (charge && e.arrive === undefined) e.arrive = true;
  etat.sens = charge && e.arrive ? (sens === "aucun" ? "" : sens) : "aucun";
  let html;
  if (!charge) html = squelette(def, racine);
  else if (e.donnees?.erreur) html = `${racine ? "" : entetePousse(def.titre ?? "")}<div class="vide">${esc(e.donnees.erreur)}</div>`;
  else {
    const d = e.donnees ?? null;
    html = (large ? def.renduLarge : def.rendu)(d, ctx, e.p) + (d?.__enLigne ? complements[e.id].rendu(d.__enLigne, ctx, e.p) : "");
  }
  const classes = `page${racine ? " racine" : ""}${large ? " ample" : ""}`;
  const fenetre = conteneur.id === "app";
  if (enPlace) {
    const w = conteneur.firstElementChild;
    const anim = [...w.classList].filter((c) => c === "entre" || c === "retour").join(" ");
    w.className = `${classes}${anim ? ` ${anim}` : ""}`;
    patcher(w, html);
  } else {
    const anim = sens === "aucun" ? "" : ` entre${sens === "retour" ? " retour" : ""}`;
    conteneur.innerHTML = `<div class="${classes}${anim}">${html}</div>`;
    conteneur.__entree = e;
    conteneur.__defilRendu = false;
  }
  // La position gardée revient dès que la page a son contenu (au retour, à l'onglet retrouvé).
  if (charge && !conteneur.__defilRendu) {
    conteneur.__defilRendu = true;
    const y = e.defil ?? 0;
    if (fenetre) window.scrollTo(0, y); else conteneur.scrollTop = y;
  }
  apresDessin(conteneur);
  // RNT-185 : une page qui garde un objet vivant (la carte) le replace après son dessin.
  if (charge && e.donnees && !e.donnees.erreur) def.apres?.(ctx, e.donnees, e.p);
}

/** Ce qui suit chaque dessin : champs fichier, photos déjà chargées, segments défilants sur leur choix. */
function apresDessin(racine) {
  for (const f of racine.querySelectorAll(".champ-fichier input[type=file]")) if (f.files?.length) majChampFichier(f);
  for (const img of racine.querySelectorAll("img[data-photo]")) {
    if (!img.complete) continue;
    img.parentElement.classList.toggle("chargee", img.naturalWidth > 0);
    img.parentElement.classList.toggle("ratee", img.naturalWidth === 0);
  }
  for (const s of racine.querySelectorAll(".segment.defilant")) {
    const b = s.querySelector('[aria-pressed="true"]');
    if (!b || s.scrollWidth <= s.clientWidth) continue;
    const g = b.offsetLeft, dr = g + b.offsetWidth;
    if (g < s.scrollLeft || dr > s.scrollLeft + s.clientWidth) s.scrollLeft = g - (s.clientWidth - b.offsetWidth) / 2;
  }
}

/**
 * La navigation du palier (barre perle, rail ou colonne), dessinée une fois, puis mise à jour :
 * la perle glisse vers l'onglet ouvert.
 */
function dessinerBarre() {
  let barre = document.getElementById("barre");
  if (!barre) {
    barre = document.createElement("nav");
    barre.id = "barre";
    barre.setAttribute("aria-label", "Onglets");
    document.body.append(barre);
  }
  monterBarre(barre, etat.palier);
  majBarre(barre, { onglet: etat.onglet, page: sommet()?.id });
}
window.addEventListener("resize", () => {
  const p = palierFenetre();
  if (p !== etat.palier) {
    memoriserDefilement();
    etat.palier = p;
    if (etat.ecran === "jeu") afficher("aucun");
    else rendre();
  } else if (etat.ecran === "jeu" && document.getElementById("barre")) dessinerBarre();
});

/**
 * RNT-295 : un toast peut porter un lien vers la page concernée (« Compte ouvert · Voir la banque »).
 * `lien` : { texte, page, p?, onglet? } ; le toast reste un peu plus longtemps pour laisser le temps de toucher.
 */
export function toast(texte, ton = "", lien = null) {
  const t = document.createElement("div");
  t.className = `toast ${ton}${lien ? " avec-lien" : ""}`;
  t.setAttribute("role", "status");
  const span = document.createElement("span");
  span.textContent = texte;
  t.append(span);
  if (lien) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "toast-lien";
    b.textContent = lien.texte;
    b.addEventListener("click", async () => { t.remove(); await allerVers(lien); });
    t.append(b);
  }
  document.getElementById("toasts").append(t);
  setTimeout(() => t.remove(), lien ? 6500 : 4200);
  // Comme CoucheToasts : un gain vibre (sauf juste après un son d'événement), un refus aussi.
  if (ton === "gain" && !retourRecent()) vibrer([12, 60, 18]);
  else if (ton === "refus") vibrer([20, 50, 20, 50, 20]);
}

// Pour les essais automatiques (web/tests) : l'état, le contexte, la navigation.
window.__grind = { etat, actions, jouer, maintenant, ctx, ouvrir, allerOnglet, sauvegarder, rafraichir, disposition };

// D205 : installable et hors ligne (sw.js) ; en local, seulement à la demande (?sw=1, l'essai zone-pwa).
if ("serviceWorker" in navigator && (location.protocol === "https:" || new URLSearchParams(location.search).has("sw"))) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
demarrer();
