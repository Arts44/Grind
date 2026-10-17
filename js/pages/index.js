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
  reglages: ["reglages", "compte", "reglagesCompte", "reglagesFocus", "reglagesApparence", "reglagesCarte", "reglagesAide", "reglagesAvance", "retours"], // lot C : les rubriques
  actifs: ["actifs"],
  banque: ["banque", "banque.credit", "banque.assurances", "assurances", "banque.impots"],
  marches: ["marches", "marches.titre"],
  entreprises: ["fonder", "boite", "equipe", "reprises", "participations"],
  immobilier: ["marcheImmo", "achat", "bien", "encheres"],
  vehicules: ["concession", "configurateur", "occasion", "vehicule", "permis"],
  bateaux: ["chantierNaval", "bateau", "port"], // RNT-188
  vie: ["patrimoine", "plaisir", "repartition", "activite", "evenements"],
  profil: ["profil", "bilan", "collection"],
  monde: ["monde"],
  combines: ["combines"],
  montres: ["horlogerie", "maisonMontres", "modeleMontre", "pieceMontre", "annoncesMontres", "encheresMontres", "montre"],
  objectifs: ["objectif", "objectifs"],
  manger: ["manger"],
  enligne: ["enLigne", "bourseMonde", "propositions", "reglesMonde", "amis", "ami", "journalDimanche", "discussionAmi"], // D205 ; lot E : social.js
  saison: ["saison"], // D205
  guide: ["guide", "guideChapitre"], // D205
  trainvie: ["trainDeVie", "abonnements"], // RNT-190
  villes: ["monde.lieux", "monde.lieu", "monde.villes", "monde.ville", "monde.chantiers", "monde.residences"], // RNT-198
  joueurs: ["joueurs"], // RNT-200
  nouveautes: ["nouveautes"], // RNT-196
  mondes: ["mondes", "parties", "creerMonde", "rejoindreMonde", "rejoindre"], // D215
};

// Des chemins écrits en entier : un outil (ou le navigateur, pour modulepreload) les voit.
const IMPORTS = {
  focus: () => import("./focus.js"),
  accueil: () => import("./accueil.js"),
  reglages: () => import("./reglages.js"),
  actifs: () => import("./actifs.js"),
  banque: () => import("./banque.js"),
  marches: () => import("./marches.js"),
  entreprises: () => import("./entreprises.js"),
  immobilier: () => import("./immobilier.js"),
  vehicules: () => import("./vehicules.js"),
  bateaux: () => import("./bateaux.js"),
  vie: () => import("./vie.js"),
  profil: () => import("./profil.js"),
  monde: () => import("./monde.js"),
  combines: () => import("./combines.js"),
  montres: () => import("./montres.js"),
  objectifs: () => import("./objectifs.js"),
  manger: () => import("./manger.js"),
  enligne: () => import("./enligne.js"),
  saison: () => import("./saison.js"),
  guide: () => import("./guide.js"),
  trainvie: () => import("./trainvie.js"),
  villes: () => import("./villes.js"),
  joueurs: () => import("./joueurs.js"),
  nouveautes: () => import("./nouveautes.js"),
  mondes: () => import("./mondes.js"),
};

/** Les racines des onglets, dans l'ordre où on les précharge (l'accueil est déjà là). */
const ONGLETS = ["focus", "banque", "marches", "actifs"];

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
    }).catch((e) => { delete fichiers[f]; throw e; });
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
    l.href = `css/pages/${nom}.css`;
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
