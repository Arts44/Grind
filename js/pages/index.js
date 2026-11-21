// ══════════════════════════════════════════════════════════════════════
//  Toutes les pages du web, par identifiant (« banque », « banque.credit », « boite »…).
//
//  Lot F : chaque fichier de pages se charge à la demande (import()), la
//  première fois qu'une de ses pages s'ouvre, au lieu de 1,5 Mo de JS lus
//  avant le premier écran. `pages[id]` reste un objet synchrone pour
//  app.js : une page pas encore chargée a pour `donnees` une fonction qui
//  charge son fichier puis appelle les vraies données ; une fois chargée,
//  `pages[id]` rend exactement la définition du fichier.
//  Après le premier écran, au repos, on précharge les racines des onglets
//  (l'onglet suivant probable), puis le reste.
//
//  FICHIERS : quel fichier porte quelles pages. Une page ajoutée dans un
//  fichier sans être notée ici s'ouvre quand même (on charge alors tous les
//  fichiers pour la trouver) ; l'essai zone-chargement.mjs signale l'oubli.
// ══════════════════════════════════════════════════════════════════════

export const FICHIERS = {
  focus: ["focus"],
  accueil: ["accueil"],
  reglages: ["reglages", "reglagesCompte", "reglagesFocus", "reglagesApparence", "reglagesCarte", "reglagesNotifications", "reglagesAide", "reglagesAvance", "retours"], // lot C : les rubriques
  actifs: ["actifs"],
  banque: ["banque", "banque.credit", "banque.assurances", "assurances", "banque.impots", "banque.prelevements"],
  marches: ["marches", "marches.titre"],
  entreprises: ["fonder", "boite", "equipe", "reprises", "participations", "conseils"], // RNT-230 : les conseils des PME
  immobilier: ["marcheImmo", "achat", "bien"],
  encheres: ["encheres"], // RNT-221 : la salle des ventes unique
  vehicules: ["concession", "configurateur", "occasion", "vehicule", "permis"],
  bateaux: ["chantierNaval", "bateau", "port", "convoyage"], // RNT-188 ; D328 : faire transporter un véhicule
  vie: ["patrimoine", "plaisir", "repartition", "activite", "evenements"],
  profil: ["profil", "bilan", "profilBiens", "profilActivite", "profilPalmares"], // D394 : plus de pages Collection ni « Ma vitrine » ; D454 : les cartes de ton profil
  monde: ["monde", "carte"], // D341 : « carte », la racine de l'onglet Carte
  combines: ["combines"],
  montres: ["horlogerie", "maisonMontres", "modeleMontre", "pieceMontre", "annoncesMontres", "montre"],
  objectifs: ["objectif", "objectifs"],
  manger: ["manger"],
  enligne: ["enLigne", "bourseMonde", "propositions", "reglesMonde", "amis", "gazette", "discussionAmi"], // D205 ; lot E : social.js
  saison: ["saison"], // D205
  guide: ["guide", "guideChapitre"], // D205
  trainvie: ["trainDeVie", "abonnements"], // RNT-190
  couple: ["couple", "rencontres", "personne"], // D346 ; D456 : ma vie amoureuse, les rencontres, la fiche d'une personne
  cercle: ["cercle", "filCercle"], // D444 : l'entourage
  famille: ["famille", "enfant"], // D376 : les enfants (Vie › Famille) et la fiche d'un enfant
  defis: ["defis"], // D381 : les défis de la semaine, les duels, les succès, les coffres
  liens: ["liens"], // D349 : entre joueurs (parrainage, rivalité, rumeurs, cagnotte, associé, colocation)
  admin: ["admin"], // RNT-293 : la console d'administration, sous code
  villes: ["monde.lieux", "monde.lieu", "monde.villes", "monde.ville", "monde.chantiers", "monde.residences"], // RNT-198
  joueurs: ["joueurs", "joueur", "ami", "biensJoueur", "activiteJoueur", "palmaresJoueur", "entreVousJoueur"], // RNT-200 ; RNT-212 : le profil d'un joueur (« ami » y mène aussi) ; D454 : ses cartes
  nouveautes: ["nouveautes"], // RNT-196
  mondes: ["mondes", "parties", "creerMonde", "rejoindreMonde", "rejoindre"], // D215
  recompenses: ["personnaliser"], // RNT-231 ; D394 : la Vitrine est un onglet de Personnaliser
  favoris: ["favoris"], // RNT-250
  echanges: ["echanges", "echange"], // RNT-251 : les échanges entre joueurs
  casino: ["hotels", "hotel", "casino"], // RNT-260 : les hôtels et le casino
  "casino-cartes": ["casinoTable"], // D337 : les tables de cartes (blackjack, poker, baccarat)
  roulette: ["roulette"], // D338 : la table de roulette
  machines: ["machines"], // D338 : les machines à sous
  "casino-partage": ["tablePartagee"], // D339 : les tables partagées entre joueurs
  course: ["course", "courseSerie", "courseCircuit", "courseReglages"], // D445 : circuits, pilote, championnats ; D452 : une série sur sa page ; D461 : les réglages
  code: ["codeEntrainement", "codeQuestions", "codeCorrection"], // D450 : la théorie du permis
};

// Des chemins écrits en entier : un outil (ou le navigateur, pour modulepreload) les voit.
const IMPORTS = {
  focus: () => import("./focus.js?v=3e8bddd9"),
  accueil: () => import("./accueil.js?v=3e8bddd9"),
  reglages: () => import("./reglages.js?v=3e8bddd9"),
  actifs: () => import("./actifs.js?v=3e8bddd9"),
  banque: () => import("./banque.js?v=3e8bddd9"),
  marches: () => import("./marches.js?v=3e8bddd9"),
  entreprises: () => import("./entreprises.js?v=3e8bddd9"),
  immobilier: () => import("./immobilier.js?v=3e8bddd9"),
  encheres: () => import("./encheres.js?v=3e8bddd9"),
  vehicules: () => import("./vehicules.js?v=3e8bddd9"),
  bateaux: () => import("./bateaux.js?v=3e8bddd9"),
  vie: () => import("./vie.js?v=3e8bddd9"),
  profil: () => import("./profil.js?v=3e8bddd9"),
  monde: () => import("./monde.js?v=3e8bddd9"),
  combines: () => import("./combines.js?v=3e8bddd9"),
  montres: () => import("./montres.js?v=3e8bddd9"),
  objectifs: () => import("./objectifs.js?v=3e8bddd9"),
  manger: () => import("./manger.js?v=3e8bddd9"),
  enligne: () => import("./enligne.js?v=3e8bddd9"),
  saison: () => import("./saison.js?v=3e8bddd9"),
  guide: () => import("./guide.js?v=3e8bddd9"),
  trainvie: () => import("./trainvie.js?v=3e8bddd9"),
  couple: () => import("./couple.js?v=3e8bddd9"),
  cercle: () => import("./cercle.js?v=3e8bddd9"), // D444
  famille: () => import("./famille.js?v=3e8bddd9"), // D376
  liens: () => import("./liens.js?v=3e8bddd9"), // D349
  defis: () => import("./defis.js?v=3e8bddd9"), // D381
  villes: () => import("./villes.js?v=3e8bddd9"),
  joueurs: () => import("./joueurs.js?v=3e8bddd9"),
  nouveautes: () => import("./nouveautes.js?v=3e8bddd9"),
  mondes: () => import("./mondes.js?v=3e8bddd9"),
  recompenses: () => import("./recompenses.js?v=3e8bddd9"),
  favoris: () => import("./favoris.js?v=3e8bddd9"),
  echanges: () => import("./echanges.js?v=3e8bddd9"),
  casino: () => import("./casino.js?v=3e8bddd9"),
  "casino-cartes": () => import("./casino-cartes.js?v=3e8bddd9"),
  roulette: () => import("./roulette.js?v=3e8bddd9"),
  machines: () => import("./machines.js?v=3e8bddd9"),
  "casino-partage": () => import("./casino-partage.js?v=3e8bddd9"),
  admin: () => import("./admin.js?v=3e8bddd9"),
  course: () => import("./course.js?v=3e8bddd9"), // D445
  code: () => import("./code.js?v=3e8bddd9"), // D450
};

/** Les racines des onglets, dans l'ordre où on les précharge (l'accueil est déjà là). */
const ONGLETS = ["focus", "banque", "monde", "actifs"]; // D341 : la carte (monde.js) est un onglet ; les marchés, une part d'Actifs (D352 : plus une racine à précharger)

const charges = {}; // id de page → définition réelle
const fichiers = {}; // fichier → promesse de son chargement
const fichierDe = {};
for (const [f, ids] of Object.entries(FICHIERS)) for (const id of ids) fichierDe[id] = f;

/** Charge un fichier de pages et range ses définitions (une seule fois). */
export function chargerFichier(f) {
  if (!fichiers[f]) {
    const p = IMPORTS[f]().then(async (m) => {
      const defs = Object.values(m.pages ?? {});
      // Lot A : les styles que ses pages déclarent (`css:`), posés avant le premier dessin (pas d'éclair).
      await poserStyles(defs.flatMap((d) => (d.css ? [].concat(d.css) : [])));
      for (const [id, def] of Object.entries(m.pages ?? {})) charges[id] ??= def;
      p.fini = true;
      return m;
    }).catch((e) => {
      delete fichiers[f];
      globalThis.__grindReparer?.(e); // D356 : une page d'une autre version (ou cassée) : on recharge, le jeu s'arrête
      throw e;
    });
    fichiers[f] = p;
  }
  return fichiers[f];
}

/**
 * Lot A × F : pose css/pages/<nom>.css une fois par zone et attend qu'il soit lu (3 s au plus).
 * Les pages arrivant à la demande, une zone a ses styles au chargement de son fichier.
 */
export function poserStyles(noms) {
  return Promise.race([Promise.all([...new Set(noms)].map((nom) => new Promise((ok) => {
    if (typeof document === "undefined" || document.querySelector(`link[data-zone="${nom}"]`)) return ok();
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = `css/pages/${nom}.css${globalThis.__grindVersion && globalThis.__grindVersion !== "dev" ? `?v=${globalThis.__grindVersion}` : ""}`; // D356
    l.dataset.zone = nom;
    l.onload = l.onerror = ok;
    document.head.append(l);
  }))), new Promise((ok) => setTimeout(ok, 3000))]);
}

/** La définition de `id`, son fichier chargé (null : aucune page de ce nom). */
export async function chargerPage(id) {
  if (charges[id]) return charges[id];
  const f = fichierDe[id];
  if (f) await chargerFichier(f);
  if (!charges[id]) {
    // Pas notée dans FICHIERS : on la cherche partout.
    await Promise.all(Object.keys(IMPORTS).map(chargerFichier));
    if (charges[id]) console.warn(`[pages] « ${id} » n'est pas dans FICHIERS (pages/index.js) : chargée en cherchant partout.`);
  }
  return charges[id] ?? null;
}

/** Une page pas encore chargée : juste de quoi dessiner le squelette, puis charger à `donnees`. */
function enAttente(id) {
  return {
    get titre() { return charges[id]?.titre ?? ""; },
    async donnees(ctx, p) {
      const def = await chargerPage(id);
      if (!def) throw new Error(`Écran pas encore sur le web : ${id}`);
      prechargerPlusTard();
      return def.donnees ? def.donnees(ctx, p) : null;
    },
    rendu: (d, ctx, p) => charges[id]?.rendu(d, ctx, p) ?? "",
  };
}

const attente = {};
const NOM_DE_PAGE = /^[A-Za-z][\w.-]*$/;
const PAS_DES_PAGES = new Set(["then", "toJSON", "constructor", "prototype", "valueOf", "toString"]);

/**
 * `pages[id]` : la définition chargée, ou une page en attente. Une page inconnue de FICHIERS est
 * aussi « en attente » (on la cherche dans tous les fichiers à son ouverture) : une page ajoutée par
 * un autre lot sans mise à jour de FICHIERS ne casse pas.
 */
export const pages = new Proxy({}, {
  get(_, id) {
    if (typeof id !== "string") return undefined;
    if (charges[id]) return charges[id];
    if (!NOM_DE_PAGE.test(id) || PAS_DES_PAGES.has(id)) return undefined;
    // Tous les fichiers lus et toujours rien : la page n'existe pas (app.js le dit par un toast).
    if (!fichierDe[id] && Object.keys(IMPORTS).every((f) => fichiers[f]?.fini)) return undefined;
    return (attente[id] ??= enAttente(id));
  },
  has(_, id) { return typeof id === "string" && (!!charges[id] || !!fichierDe[id]); },
  ownKeys() { return [...new Set([...Object.keys(fichierDe), ...Object.keys(charges)])]; },
  getOwnPropertyDescriptor(c, id) {
    const v = this.get(c, id);
    return v && this.has(c, id) ? { value: v, enumerable: true, configurable: true, writable: false } : undefined;
  },
});

// MARK: Préchargement

let prevu = false;
const auRepos = (f) => (typeof requestIdleCallback === "function" ? requestIdleCallback(f, { timeout: 4000 }) : setTimeout(f, 300));

/** Après la première page : les racines d'onglets, une par moment de repos, puis les autres fichiers. */
export function prechargerPlusTard() {
  if (prevu) return;
  prevu = true;
  const file = [...ONGLETS, ...Object.keys(IMPORTS).filter((f) => !ONGLETS.includes(f))];
  const suivant = () => {
    const f = file.shift();
    if (!f) return;
    (fichiers[f] ? Promise.resolve() : chargerFichier(f)).catch(() => {}).finally(() => auRepos(suivant));
  };
  // Le premier écran d'abord : on laisse le moteur et le dessin finir.
  setTimeout(() => auRepos(suivant), 1500);
}

// Le premier écran du jeu est l'accueil : son fichier se lit pendant que le moteur se télécharge.
chargerFichier("accueil").catch(() => {});
