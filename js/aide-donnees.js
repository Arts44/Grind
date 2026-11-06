// ══════════════════════════════════════════════════════════════════════
//  Les fiches du « ? » de chaque onglet (Rente/Design/Tutoriels.swift),
//  mot pour mot : ce qu'on peut faire ici, et pour chaque notion un
//  exemple chiffré. Certaines ont une démo à manipuler (« Essaie ») dont
//  les chiffres viennent des règles du jeu (Balance.json, via le moteur).
//
//  Propriété du lot C ; les pages des autres zones l'utilisent par
//  `boutonAide(sujet)` (js/aide.js).
// ══════════════════════════════════════════════════════════════════════

/** Les symboles des fiches (noms SF Symbols de l'iPhone), au trait, 24 × 24. */
export const TRAITS = {
  "chart.line.uptrend.xyaxis": '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  "heart.fill": '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  "house.fill": '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>',
  "list.bullet": '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.5" cy="6.5" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="17.5" r="1"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>',
  "square.grid.2x2.fill": '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  "medal.fill": '<path d="M8 2.5h3l1.5 5M16 2.5h-3l-1.5 5"/><circle cx="12" cy="15" r="6"/><path d="m12 12 1 2 2.1.3-1.5 1.5.4 2.1-2-1-2 1 .4-2.1-1.5-1.5L11 14z"/>',
  "exclamationmark.triangle.fill": '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  "hand.raised.fill": '<path d="M7.5 12.5V6a1.5 1.5 0 0 1 3 0v5M10.5 11V4.5a1.5 1.5 0 0 1 3 0V11M13.5 11V5.5a1.5 1.5 0 0 1 3 0V12M16.5 12V8.5a1.5 1.5 0 0 1 3 0V14c0 4.4-3 7.5-7.2 7.5-2.6 0-4.3-1.2-5.7-3.3L4 13.8a1.5 1.5 0 0 1 2.4-1.8l1.1 1.4"/>',
  "creditcard.fill": '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>',
  "arrow.left.arrow.right": '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  "building.columns.fill": '<path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>',
  signature: '<path d="M3 17c2.5-6 4.5-9 6-9 2 0-1.5 9 .5 9 1.5 0 2.5-4 4-4s.5 3 2 3c1 0 2-1 3.5-2M3 20.5h18"/>',
  "doc.text.fill": '<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>',
  "beach.umbrella.fill": '<path d="M12 3a8.5 8.5 0 0 1 8.5 8.5h-17A8.5 8.5 0 0 1 12 3zM12 11.5 15 21M3 21h18"/>',
  "storefront.fill": '<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20.5v-6h6v6"/>',
  "slider.horizontal.3": '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  "person.3.fill": '<circle cx="12" cy="7.5" r="3"/><path d="M6.5 19c.7-3 2.9-4.8 5.5-4.8s4.8 1.8 5.5 4.8"/><circle cx="5" cy="9.5" r="2.2"/><circle cx="19" cy="9.5" r="2.2"/><path d="M1.8 17.5c.4-2 1.6-3.2 3.2-3.4M22.2 17.5c-.4-2-1.6-3.2-3.2-3.4"/>',
  "checkmark.shield.fill": '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  "banknote.fill": '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  "bubble.left.and.bubble.right.fill": '<path d="M3 5.5h11v7.5H8l-3.5 3v-3H3zM10 15.5h6l3.5 3v-3H21V8h-3"/>',
  "key.fill": '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16.5 6.5l2.5 2.5M14 9l2 2"/>',
  "car.side.fill": '<path d="M3 15.5v-2.5l2.5-1 2.5-3.5h6l3.5 3.5 3 .8v2.7z"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  "person.text.rectangle.fill": '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8" cy="10.5" r="2"/><path d="M5 16c.5-1.7 1.6-2.6 3-2.6s2.5.9 3 2.6M13.5 10h5M13.5 14h4"/>',
  "moon.zzz.fill": '<path d="M12.5 5A7.5 7.5 0 1 0 19 16 6.4 6.4 0 0 1 12.5 5zM15 3h4l-4 4h4"/>',
  "tag.fill": '<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle cx="8" cy="8" r="1.4"/>',
  "cart.fill": '<path d="M2.5 4h2.5l2.3 11h11l2-8H6.3"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  "arrow.down.right": '<path d="M6 6l12 12M18 9v9H9"/>',
  multiply: '<path d="M6 6l12 12M18 6 6 18"/>',
  "flame.fill": '<path d="M12 21c-3.6 0-6.5-2.6-6.5-6.2 0-3 1.9-5.1 3.5-7 .4 1.5 1.1 2.5 2.2 3-.3-3.4 1.1-6.2 4-7.8-.2 3 1.3 4.6 2.7 6.4 1.1 1.5 1.6 3 1.6 4.7 0 4.1-3 6.9-7.5 6.9z"/>',
  hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
  "shield.fill": '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/>',
  "newspaper.fill": '<path d="M4 5h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM17 9h3v10a2 2 0 0 1-2 2M7 9h7M7 13h7M7 17h4"/>',
  "bell.badge.fill": '<path d="M6 16V11a6 6 0 0 1 9-5.2M18 11v5l1.5 2h-15M10 20a2 2 0 0 0 4 0"/><circle cx="18.5" cy="6" r="2.5"/>',
  "person.crop.circle.badge.checkmark": '<circle cx="11" cy="12" r="8.5"/><circle cx="11" cy="9.5" r="3"/><path d="M5.5 18.3c1.2-2.3 3.1-3.5 5.5-3.5s4.3 1.2 5.5 3.5M16.5 6l1.6 1.6L21.5 4"/>',
  number: '<path d="M9 3.5 7 20.5M17 3.5l-2 17M4 8.5h16M3.5 15.5h16"/>',
  "waveform.path.ecg": '<path d="M2.5 12h4l2-5 3.5 11 2.5-8 1.5 2h5.5"/>',
  lightbulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  essaie: '<path d="M8.5 13V5.5a1.5 1.5 0 0 1 3 0V11l5.2 1.1c1.4.3 2.3 1.6 2.1 3l-.6 3.4a3 3 0 0 1-3 2.5H11c-1 0-1.9-.5-2.5-1.3L5 15.3a1.6 1.6 0 0 1 2.5-2z"/><path d="M4 7.5a6 6 0 0 1 2-4M15.5 3.5a6 6 0 0 1 2 4"/>',
};

const F = (symbole, titre, texte, exemple = null, demo = null) => ({ symbole, titre, texte, exemple, demo });

/** Les sujets (SujetAide) : titre de la feuille, chapitre du guide, fiches. */
export const SUJETS = {
  accueil: {
    titre: "L'accueil", chapitre: "demarrer",
    fiches: [
      F("chart.line.uptrend.xyaxis", "Ton patrimoine", "Tout ce que tu possèdes moins tes dettes : comptes, liquide, bourse, biens. Touche le chiffre pour sa courbe ; glisse le doigt dessus pour lire un jour précis."),
      F("heart.fill", "La jauge de plaisir", "Elle baisse avec les échecs de focus et un train de vie trop bas, monte avec un train de vie au-dessus de ton standing. À zéro, c'est le burnout : salaire et production divisés par deux."),
      F("house.fill", "Le train de vie", "Ce que tu dépenses chaque semaine pour vivre, prélevé jour après jour. Le dimanche, le jeu le compare à ton standing attendu (ce que tes revenus permettent).",
        "Standing attendu 300 € : vivre à 200 € coûte du plaisir, vivre à 400 € en rapporte."),
      F("list.bullet", "Activité", "Le dernier mouvement d'argent : un salaire, un dividende, un loyer, un achat. Touche la tuile pour tout le relevé. Le bénéfice de tes boîtes reste dans leur trésorerie : verse des dividendes pour le toucher."),
    ],
  },
  focus: {
    titre: "Le focus", chapitre: "focus",
    fiches: [
      F("timer", "Une session rapporte", "Choisis ce que tu fais et une durée, puis lance : chaque minute tenue est payée. Arrêter avant la fin paie les minutes faites.",
        "Une pièce tombe sur la pile à chaque minute payée."),
      F("square.grid.2x2.fill", "Quatre types de session", "Travail : plein salaire, tes boîtes tournent. Révision : moitié du salaire, les heures comptent pour ton permis. Lecture / étude : 60 % du salaire et un peu de plaisir. Sport : pas de salaire, mais 20 points de plaisir par heure : une heure fait presque monter ton humeur d’un palier."),
      F("heart.fill", "Ton humeur", "La jauge de plaisir règle ce que tu gagnes : Épuisé ×0,65, Sous tension ×0,82, Stable ×1, Épanoui ×1,18, Au sommet ×1,35. Ça vaut pour le salaire du focus et pour tes boîtes. Au burnout, les gains sont en plus divisés par deux.",
        "La bonne humeur s'use un peu chaque nuit. Au-delà de 4 h de travail dans la journée, chaque heure coûte 3 points ; le sport en rapporte 20 la première heure, 10 la deuxième, puis plus rien."),
      F("medal.fill", "Le bonus de tenue", "Une session menée jusqu'au bout touche un bonus sur son salaire : +5 % dès 25 min, +15 % dès 50, +25 % dès 90, +35 % dès 2 h. Arrêtée avant la fin, elle n'en a pas.",
        "50 min tenues à 600 € : 90 € de bonus."),
      // Sur le web, l'« app interdite », c'est quitter l'onglet du jeu (README) : la fiche le dit.
      F("exclamationmark.triangle.fill", "Les apps interdites", "Ouvrir une app surveillée pendant le focus lance un compte à rebours de 15 secondes. Ferme-la (ou reviens dans Grind) à temps, et rien ne se passe.",
        "Sur le web, quitter l'onglet de Grind compte comme ouvrir une app interdite : reviens vite."),
      F("hand.raised.fill", "Les sanctions", "1er échec de la semaine : la session n'est pas payée. 2e : plus une amende. 3e et suivants : amende plus forte et compte courant gelé pendant un moment."),
    ],
  },
  banque: {
    titre: "La banque", chapitre: "banque",
    fiches: [
      F("creditcard.fill", "Tes comptes, tes cartes", "Chaque compte est une carte. Le compte courant reçoit ton salaire ; l'épargne (le livret) rapporte des intérêts chaque soir. Touche une carte pour la sortir de la pile.", null, { sorte: "epargne" }),
      F("arrow.left.arrow.right", "Virement, retrait, dépôt", "Un seul bouton. Fais glisser les cartes pour choisir d'où part l'argent, puis où il va, puis le montant. Le portefeuille, c'est ton liquide : à l'arrivée, c'est un retrait ; au départ, un dépôt."),
      F("building.columns.fill", "Les banques", "Le « + » ouvre un compte, dans ta banque ou une autre. Chacune a son taux d'épargne, ses frais du dimanche et son prix du crédit. Certaines demandent un gros patrimoine, d'autres d'habiter leur pays."),
      F("signature", "Les crédits", "Emprunte, signe le contrat, l'argent arrive sur ton compte courant. Une échéance part chaque dimanche. Tous tes prêts, toutes banques confondues, ont un plafond : ce que tes revenus des 7 derniers jours remboursent, plus une part de ton patrimoine net ; un nouvel emprunteur doit au plus 5 fois ses revenus d'une semaine, et ce plafond monte avec chaque crédit remboursé à terme. Un crédit par 24 h.",
        "15 000 € sur 10 semaines à 6,5 % : 2 087 € chaque dimanche, 5 865 € d'intérêts au total."),
      F("doc.text.fill", "L'impôt du dimanche", "L'avis montre ce que coûterait ta semaine si elle finissait maintenant : barème progressif, une première part sans impôt. Le liquide n'est pas imposé."),
      F("beach.umbrella.fill", "Les congés", "Dix jours par saison, le jour même ou à l'avance. Un jour de congé : +15 de jauge (+25 dès le 3e d'affilée), aucun événement, un gérant pour tes boîtes. Au retour, +20 % sur ton focus pendant 2 jours."),
    ],
  },
  entreprises: {
    titre: "Les actifs", chapitre: "entreprises",
    fiches: [
      F("storefront.fill", "Fonder une boîte", "Huit étapes : le secteur, le nom, la ville, le local, la gamme et le prix, l'équipe, le financement, puis tu signes les statuts. Chaque choix a un revers : une capitale a plus de clients mais des loyers plus chers, le premium marge plus mais vend moins.",
        "Un petit snack standard coûte environ 30 000 € à ouvrir, selon la ville, fonds de roulement compris."),
      F("timer", "Elle vend quand tu travailles", "Comme toute la production, les ventes du jour suivent tes minutes de focus : à 4 h, ta boîte tourne à plein ; sans focus, elle ne vend rien. Les salaires, le loyer et l'assurance, eux, tombent chaque jour. Un jour de congé, le gérant fait tourner à 58 %."),
      F("slider.horizontal.3", "Pilote ou gestion détaillée", "Par défaut, la boîte tourne en pilote automatique. « Gérer en détail » ouvre le marketing, les machines, les fournisseurs et le choix des candidats : bien réglé, jusqu'à 25 % de plus ; mal réglé, ça coûte."),
      F("person.3.fill", "L'équipe", "Chaque personne a un prénom, un niveau et son salaire. Payer sous le marché fait baisser le moral ; un moral au plus bas mène à la grève. Licencier coûte deux semaines de salaire, payées par la boîte."),
      F("checkmark.shield.fill", "Contrôles et réputation", "Hygiène, sécurité, social, fiscal : les contrôles sont rares. Ignorer un avertissement le fait revenir plus souvent, puis vient l'amende, puis la fermeture. La réputation monte avec un bon prix, une équipe motivée et des clients servis."),
      F("banknote.fill", "L'argent de la boîte", "Le bénéfice reste dans la trésorerie de la boîte. Le dimanche, l'impôt des sociétés en prend une part. Pour le mettre sur ton compte, verse-toi des dividendes : 30 % de précompte est retenu.",
        "10 000 € de dividendes : 7 000 € arrivent sur ton compte."),
      F("house.fill", "L'immobilier", "Un bien rapporte un loyer chaque jour, même sans focus : environ 0,6 % de sa valeur par semaine. C'est lent, mais sûr. Sa valeur monte doucement, plus vite s'il est rare.",
        "Un studio à 180 000 € loué 1 100 € par semaine : 157 € par jour, week-ends compris."),
      F("bubble.left.and.bubble.right.fill", "Négocier", "Fais une offre avant d'acheter. Un vendeur pro fait une seule contre-proposition, puis son prix est ferme. Un particulier descend à chaque offre, mais sa patience s'use : une offre insultante en coûte deux points, et à zéro il ne répond plus jusqu'au lendemain."),
      F("key.fill", "Locataires, travaux, résidence", "Chaque semaine, des candidats : une famille paie à l'heure, un étudiant moins cher et plus risqué, un expat paie plus mais part vite. Les travaux remettent le bien à neuf et montent sa valeur, sans loyer pendant ce temps. Tu peux aussi y habiter."),
      F("car.side.fill", "Les véhicules", "Plus de 500 modèles, du vélo au jet. Le neuf se configure (teinte, jantes, intérieur, packs) et se négocie avec la concession ; l'occasion coûte moins cher, mais un vice caché est possible : fais-la inspecter. La cote baisse chaque jour, sauf pour les pièces rares.",
        "Une pièce Éternelle ou Absolue au garage : un peu de plaisir en plus chaque dimanche."),
      F("doc.text.fill", "Comptant, crédit ou leasing", "Le crédit auto se rembourse le dimanche. Le leasing coûte un loyer par semaine ; le véhicule reste à la société, ne compte pas dans ton patrimoine et repart à la fin, sauf si tu lèves l'option. Louer ton véhicule rapporte chaque jour, avec un risque de dégâts."),
      F("person.text.rectangle.fill", "Les permis", "Inscription, jours de formation, puis examen. Active la révision : tes sessions de focus sont payées à moitié, mais chaque heure ajoute 2 points de réussite. Deux échecs imposent une formation. Le superyacht et les jets se prennent avec un équipage payé."),
      F("moon.zzz.fill", "Le revenu passif", "Sans focus, tes boîtes vendent encore un tiers d'une journée normale. Le focus ajoute le reste : c'est lui qui les fait vraiment tourner."),
      F("tag.fill", "Revendre ou fermer", "Une boîte se revend sur ses résultats : quelques jours de bénéfice selon la ville et la réputation, plus la moitié du matériel, le local s'il est acheté et la trésorerie. Fermer rend le local et la trésorerie, moins les indemnités."),
    ],
  },
  marches: {
    titre: "Les marchés", chapitre: "marches",
    fiches: [
      F("cart.fill", "Acheter", "Tu achètes un morceau d'entreprise (ou d'or, ou de crypto). Ton argent suit le cours : s'il monte, tu gagnes ; s'il baisse, tu perds.", null, { sorte: "position", sens: 1, levier: 1 }),
      F("arrow.down.right", "Vente à découvert", "L'inverse : tu vends des titres empruntés et tu gagnes s'ils baissent. Une garantie de 50 % est bloquée (tu vends deux fois ta garantie), l'emprunt coûte 0,2 % chaque dimanche, et si le cours monte de 50 %, la position est rachetée d'office. Tu ne perds jamais plus que ta garantie.", null, { sorte: "position", sens: -1, levier: 2 }),
      F("multiply", "Le levier", "×2, ×3, ×5 : ta mise compte plusieurs fois. Les gains comme les pertes sont multipliés d'autant.", null, { sorte: "position", sens: 1, levier: 3 }),
      F("flame.fill", "Appel de marge", "Avec un levier ou un pari à la baisse, tu peux perdre ta mise entière, jamais plus. Le jeu te prévient en deux temps. Quand ta position ne vaut plus que 40 % de ta mise : appel de marge, un triangle rouge apparaît sur la position. Tu choisis : remettre de l'argent pour t'éloigner du danger, couper pour sauver ce qui reste, ou attendre que ça remonte. Si elle tombe à 10 %, elle est fermée d'office : c'est la liquidation, la mise est perdue.", null, { sorte: "position", sens: 1, levier: 5 }),
      F("hourglass", "L'ordre à cours limité", "Au lieu d'acheter tout de suite, tu fixes ton prix. L'argent est réservé, l'achat part quand le cours y arrive. Tu peux l'annuler tant qu'il attend.",
        "AB InBev vaut 58 €. Ordre à 55 € : il part si le cours descend à 55 €."),
      F("shield.fill", "Stop-loss et objectif", "Deux ventes automatiques. Le stop-loss coupe la position si le cours va contre toi, pour limiter la perte. L'objectif encaisse quand le cours atteint ton but.",
        "Acheté à 100 € : stop à 90 € (perte limitée à 10 %), objectif à 120 €."),
      F("newspaper.fill", "Les dépêches", "Une nouvelle tombe, et tout un rayon saute d'un coup : pénurie de puces, la tech s'envole ; rappel massif, l'automobile chute. Le lendemain, l'effet se prolonge un peu. Plus rarement, tout le marché part en krach ou en euphorie, puis se corrige en partie. Les dépêches sont les mêmes pour tous les joueurs."),
      F("bell.badge.fill", "Les alertes", "Sur la fiche d'un titre, fixe un cours : tu reçois une notification quand il l'atteint, même app fermée. Tu en reçois aussi pour les dépêches qui touchent ce que tu détiens."),
      F("person.crop.circle.badge.checkmark", "Les gérants", "Confie une somme à un gérant : il la place dans son panier, avec plus ou moins de levier, et se paie sur tes bénéfices (rien si tu perds). Plus il est agressif, plus il prend. Sa part se négocie une fois par semaine : plus la somme confiée est grosse, plus il t'écoute, mais il peut aussi mal le prendre.",
        "Kenji prend 30 %. Il te fait gagner 1 000 € : tu en gardes 700."),
      F("number", "Montant ou parts", "En montant, tu dis combien d'euros tu mises. En parts, combien d'actions tu veux : la mise se calcule au cours du moment."),
      F("waveform.path.ecg", "Des cours simulés", "Les titres portent de vrais noms, mais leurs cours sont simulés : les mêmes pour tous les joueurs, toute la journée, week-end compris. Les dépêches les font sauter ; stops et ordres se déclenchent sur ces cours."),
    ],
  },
};
// La fiche d'un titre a le même tutoriel que les marchés (SujetAide.titre).
SUJETS.titre = SUJETS.marches;

/** L'ordre des tutoriels dans Réglages › Aide. */
export const ORDRE_TUTORIELS = ["accueil", "focus", "banque", "marches", "entreprises"];
