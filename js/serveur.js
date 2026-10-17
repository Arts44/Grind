// ══════════════════════════════════════════════════════════════════════
//  Le serveur de Grind (Supabase), vu du navigateur (D186).
//
//  Les mêmes appels que l'app iPhone (ServiceEnLigne) : même compte,
//  même sauvegarde, mêmes mondes. L'identité de l'appareil (un identifiant
//  et un secret) vit dans le stockage du navigateur.
// ══════════════════════════════════════════════════════════════════════

const URL_RPC = "https://hxfpdvedgaqyphvijeei.supabase.co/rest/v1/rpc/";
const CLE = "sb_publishable_r6cdvZyjyj_YGcQ5GxCdQQ_nVw__ZKl";

/** Les codes d'erreur du serveur, en phrases (les mêmes que l'app iPhone). */
const MESSAGES = {
  autre_appareil: "Ton compte est ouvert sur un autre appareil. Reprends-le avec ton code de récupération.",
  compte_inconnu: "Ce compte n'existe plus sur le serveur.",
  pseudo_pris: "Ce pseudo est déjà pris.",
  pseudo_invalide: "Le pseudo doit faire de 2 à 20 caractères.",
  pseudo_refuse: "Ce pseudo n'est pas accepté. Choisis-en un autre.",
  trop_d_essais: "Trop d'essais : réessaie dans 15 minutes.",
  recuperation_refusee: "Pseudo ou code de récupération incorrect.",
  retours_trop: "Tu as déjà envoyé 20 retours aujourd'hui : réessaie demain.",
  trop_gros: "La partie est trop lourde pour le serveur.",
  // D205 : les mondes en ligne (les mêmes phrases que ServiceEnLigne.Erreur sur l'iPhone).
  introuvable: "Aucun monde avec ce code.",
  complet: "Ce monde est complet (5 joueurs).",
  deja_commence: "La saison de ce monde a déjà commencé, et on ne peut plus la rejoindre.",
  deja_signale: "Le serveur a refusé : tu as déjà signalé ce joueur aujourd'hui.",
  deja_inspectee: "Le serveur a refusé : tu as déjà inspecté cette boîte aujourd'hui : son résultat est dans « Entre joueurs ».",
  irreversible: "Le serveur a refusé : cette correction ne s'annule pas : fais-en une autre.",
  deja_denonce: "Le serveur a refusé : tu l'as déjà signalé cette semaine.",
  actions_insuffisantes: "Le serveur a refusé : pas assez d'actions.",
  pas_assez_en_bourse: "Le serveur a refusé : il n'y a plus assez d'actions en bourse.",
  offre_introuvable: "Le serveur a refusé : cette offre n'existe plus.",
  pas_proprietaire: "Le serveur a refusé : cette boîte n'est plus à toi.",
  prix_hors_cours: "Le serveur a refusé : le prix doit rester entre la moitié et le double du cours.",
  deja_propose: "Le serveur a refusé : tu lui as déjà fait une proposition : retire-la d'abord.",
  offre_perimee: "Le serveur a refusé : le vendeur n'a plus ces parts : l'offre est retirée.",
  copie_de_soi: "Le serveur a refusé : on ne se copie pas soi-même.",
  trop_de_copies: "Le serveur a refusé : tu copies déjà trois joueurs.",
  pas_de_copie: "Le serveur a refusé : tu ne copies pas ce joueur.",
  trop_tot: "Le serveur a refusé : le journal paraît le dimanche à 18 h.",
  franchise_de_soi: "Le serveur a refusé : c'est ta propre marque.",
  franchise_fermee: "Le serveur a refusé : cette marque n'accepte plus de nouvelle succursale.",
  deja_succursale: "Le serveur a refusé : tu as déjà une succursale de cette marque dans cette ville.",
  plafond: "Le serveur a refusé : tu as atteint ton plafond de chantages et de signalements cette semaine.",
  option_coupee: "Le serveur a refusé : c'est coupé dans les règles de ce monde.",
  sans_preuve: "Le serveur a refusé : il te faut d'abord une preuve : inspecte une de ses boîtes.",
  sous_contrat: "Le serveur a refusé : il t'a payé : tu ne peux plus le signaler pendant deux semaines.",
  bloque: "Le serveur a refusé : ce joueur ne reçoit pas tes propositions.",
  expiree: "Le serveur a refusé : trop tard : la proposition a expiré.",
  pas_admin: "Le serveur a refusé : seul le créateur d'un monde privé change ses règles.",
  pseudo_inconnu: "Le serveur a refusé : aucun joueur ne porte ce pseudo.",
  soi_meme: "Le serveur a refusé : c'est toi.",
  pas_ami: "Le serveur a refusé : invite d'abord ce joueur en ami.",
  deja_dedans: "Le serveur a refusé : ton ami joue déjà dans ce monde.",
  trop_de_messages: "Le serveur a refusé : doucement : 60 messages par heure au plus.",
  deja_defi: "Le serveur a refusé : vous avez déjà un défi en cours, ou en attente de réponse.",
  pas_de_succursale: "Le serveur a refusé : tu n'as pas de succursale de cette marque.",
};

export class ErreurServeur extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const stockage = {
  lire: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  ecrire: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
};

export const identite = {
  get joueur() {
    let j = stockage.lire("grind.joueur");
    if (!j) { j = crypto.randomUUID().toUpperCase(); stockage.ecrire("grind.joueur", j); }
    return j;
  },
  get secret() {
    let s = stockage.lire("grind.secret");
    if (!s) { s = crypto.randomUUID().toUpperCase() + crypto.randomUUID().toUpperCase(); stockage.ecrire("grind.secret", s); }
    return s;
  },
  remplacer(joueur, secret) { stockage.ecrire("grind.joueur", joueur); stockage.ecrire("grind.secret", secret); },
  oublier() { ["grind.joueur", "grind.secret", "grind.pseudo"].forEach((k) => stockage.ecrire(k, null)); },
  get pseudo() { return stockage.lire("grind.pseudo"); },
  set pseudo(p) { stockage.ecrire("grind.pseudo", p); },
};

const ident = () => ({ p_id: identite.joueur, p_secret: identite.secret });

/**
 * Un appel RPC. Rend la réponse décodée ; lève ErreurServeur avec une phrase lisible.
 * D205 : `brut` retouche le corps en texte (un entier de 64 bits : la graine d'un monde), `transformer`
 * le texte de la réponse avant de le lire (la graine rendue en texte, sans perdre de chiffres).
 */
export async function appeler(fonction, corps = {}, { brut = null, transformer = null } = {}) {
  let r;
  try {
    const texteCorps = JSON.stringify(corps);
    r = await fetch(URL_RPC + fonction, {
      method: "POST",
      headers: { apikey: CLE, Authorization: `Bearer ${CLE}`, "Content-Type": "application/json" },
      body: brut ? brut(texteCorps) : texteCorps,
    });
  } catch {
    throw new ErreurServeur("reseau", "Pas de connexion au serveur.");
  }
  let texte = await r.text();
  if (r.ok && transformer) texte = transformer(texte);
  if (!r.ok) {
    let code = "";
    try { code = JSON.parse(texte).message ?? ""; } catch {}
    throw new ErreurServeur(code, MESSAGES[code] ?? (code || `Erreur du serveur (${r.status}).`));
  }
  return texte ? JSON.parse(texte) : null;
}

// MARK: Compte

/** « ABCDEFGHJKMN » : 12 caractères sans 0/O ni 1/I/L, comme sur l'iPhone. */
export function tirerCodeRecuperation() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const t = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(t, (x) => alphabet[x % alphabet.length]).join("");
}

export const espacer = (code) => code.replace(/(.{4})(?=.)/g, "$1 ");

export async function lireCompte() {
  const o = await appeler("compte_lire", ident());
  return o?.id ? { id: o.id, pseudo: o.pseudo ?? "" } : null;
}

export async function creerCompte(pseudo, code) {
  const o = await appeler("compte_creer", { ...ident(), p_pseudo: pseudo, p_recup: code });
  identite.pseudo = o?.pseudo ?? pseudo;
  return { id: o?.id ?? identite.joueur, pseudo: identite.pseudo };
}

/** Reprend un compte sur ce navigateur : nouvel identifiant de session, l'autre appareil est déconnecté. */
export async function recupererCompte(pseudo, code) {
  const secret = crypto.randomUUID().toUpperCase() + crypto.randomUUID().toUpperCase();
  const propre = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const o = await appeler("compte_recuperer", { p_pseudo: pseudo, p_recup: propre, p_secret: secret });
  if (!o?.id) throw new ErreurServeur("recuperation_refusee", MESSAGES.recuperation_refusee);
  identite.remplacer(o.id.toUpperCase(), secret);
  identite.pseudo = o.pseudo ?? pseudo;
  return { id: o.id, pseudo: identite.pseudo };
}

// MARK: Sauvegarde

export async function lireSauvegarde() {
  const o = await appeler("sauvegarde_lire", ident());
  return o?.donnees ? { donnees: o.donnees, version: Number(o.version ?? 0) } : null;
}

export async function ecrireSauvegarde(donnees, version) {
  return appeler("sauvegarde_ecrire", { ...ident(), p_donnees: donnees, p_version: version });
}

/**
 * Garder la partie du navigateur ou prendre celle du serveur — la règle de l'iPhone (RNT-118) :
 * le serveur ne gagne que s'il est plus récent que tout ce que ce navigateur connaît.
 */
export function deciderSynchro({ serveur, locale, envoyee, envoiEnCours = false }) {
  if (!envoiEnCours && serveur > Math.max(locale, envoyee)) return { prendre: "serveur" };
  return { prendre: "locale", renvoyer: locale > serveur };
}

// MARK: L'heure du serveur (D119)

/** Écart serveur − navigateur, en ms : le jeu ne fait pas confiance à l'horloge de l'ordinateur. */
export async function decalageHeure() {
  const avant = Date.now();
  const iso = await appeler("heure");
  const apres = Date.now();
  return new Date(iso).getTime() - (avant + apres) / 2;
}

// MARK: Écrire à Grind (RNT-156)

export async function envoyerRetour({ sorte, texte, contexte, capture }) {
  return appeler("retour_envoyer", {
    ...ident(), p_sorte: sorte, p_texte: texte, p_contexte: contexte ?? {}, p_capture: capture ?? "", p_plateforme: "web",
  });
}

export async function mesRetours() {
  return (await appeler("retours_mes", ident())) ?? [];
}
