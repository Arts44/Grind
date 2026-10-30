// ══════════════════════════════════════════════════════════════════════
//  Le serveur de Grind (Supabase), vu du navigateur (D186).
//
//  Les mêmes appels que l'app iPhone (ServiceEnLigne) : même compte,
//  même sauvegarde, mêmes mondes. L'identité de l'appareil (un identifiant
//  et un secret) vit dans le stockage du navigateur.
// ══════════════════════════════════════════════════════════════════════

import { VERSIONS } from "./changelog-donnees.js";

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
  recuperation_refusee: "Pseudo ou code de récupération incorrect. Ton code est dans Réglages › Compte › Code de récupération, sur l'appareil où ton compte est ouvert.",
  retours_trop: "Tu as déjà envoyé 20 retours aujourd'hui : réessaie demain.",
  trop_gros: "La partie est trop lourde pour le serveur.",
  // D237 : le serveur garde la partie la plus avancée, et le profil d'une saison commencée.
  ecraserait_partie: "Le serveur a une partie plus avancée que celle-ci : elle est gardée.",
  ecraserait_profil: "Ta saison dans ce monde est déjà sur le serveur : elle n'est pas remplacée.",
  deja_place: "Tu as déjà une saison en cours dans ce monde : reprends-la plutôt que d'en recommencer une.",
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
  // RNT-259 (D245) : les limites de la bourse du monde (les mêmes phrases que ServiceEnLigne sur l'iPhone).
  trop_de_cotees: "Le serveur a refusé : tu as déjà 3 entreprises cotées : retire d'abord une de tes 3.",
  bourse_pleine: "La bourse du monde est pleine (20 titres) : inscris ta boîte en liste d'attente.",
  deja_cote: "Le serveur a refusé : cette boîte est déjà cotée.",
  pas_cote: "Le serveur a refusé : cette boîte n'est pas cotée.",
  prix_monte: "Le serveur a refusé : le cours a monté entre-temps : relis le prix et recommence.",
  offre_introuvable: "Le serveur a refusé : cette offre n'existe plus.",
  pas_proprietaire: "Le serveur a refusé : cette boîte n'est plus à toi.",
  prix_hors_cours: "Le serveur a refusé : le prix doit rester entre la moitié et trois fois la valeur de la boîte.",
  reserve_patron: "Ces parts sont réservées 24 h au patron de la boîte : réessaie après.",
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

/**
 * RNT-263 (D249) : le serveur refuse une app trop ancienne dans un monde en ligne (version-minimale.sql).
 * Le web envoie sa version dans « x-client-info: grind-web/1.16.2 » (cet en-tête-là passe le CORS de Supabase).
 */
export const VERSION_APP = VERSIONS[0].numero;
export const CODE_MISE_A_JOUR = "version_trop_ancienne";
MESSAGES[CODE_MISE_A_JOUR] = "Mets à jour Grind pour jouer en ligne : cette version est trop ancienne. Recharge la page (ou ferme et rouvre l'app installée). Le solo reste jouable.";
/** Les appels permis à une app trop ancienne : l'heure, le minimum, le compte, la sauvegarde, les retours et l'admin (comme pre_requete_grind). */
export const FONCTIONS_LIBRES = new Set(["heure", "version_minimale", "compte_lire", "compte_creer", "compte_recuperer",
  "sauvegarde_lire", "sauvegarde_ecrire", "sauvegarde_remplacer", "corrections_lire", "corrections_appliquer", "retour_envoyer", "retours_mes"]);
export const estEnLigne = (fonction) => !FONCTIONS_LIBRES.has(fonction) && !fonction.startsWith("admin_");
const numero = (t) => (/^\d+\.\d+\.\d+$/.test(String(t)) ? String(t).split(".").map(Number) : null);
/** Cette version est-elle sous le minimum ? Un numéro illisible ne refuse jamais. */
export function refuse(version, minimum) {
  const v = numero(version), m = numero(minimum);
  if (!v || !m) return false;
  for (let i = 0; i < 3; i++) if (v[i] !== m[i]) return v[i] < m[i];
  return false;
}
/** Le minimum lu au lancement (null : pas encore lu, ou hors ligne : on laisse passer, le serveur tranchera). */
let minimumServeur = null;
export const versionAJour = () => !refuse(VERSION_APP, minimumServeur);
export function reglerMinimum(minimum) { minimumServeur = numero(minimum) ? minimum : null; }

/** Lit le minimum du serveur ; rend vrai si cette version est trop ancienne pour jouer en ligne. */
export async function verifierVersion() {
  try { reglerMinimum((await appeler("version_minimale"))?.minimum); } catch { /* hors ligne : le serveur tranchera */ }
  return !versionAJour();
}

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
  // Sachant déjà qu'elle est trop ancienne, l'app ne fait pas l'appel en ligne.
  if (estEnLigne(fonction) && !versionAJour()) throw new ErreurServeur(CODE_MISE_A_JOUR, MESSAGES[CODE_MISE_A_JOUR]);
  let r;
  try {
    const texteCorps = JSON.stringify(corps);
    r = await fetch(URL_RPC + fonction, {
      method: "POST",
      headers: { apikey: CLE, Authorization: `Bearer ${CLE}`, "Content-Type": "application/json", "x-client-info": `grind-web/${VERSION_APP}` },
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
 * D237 : le serveur a la partie (sauvegardes-protegees.sql) ; le joueur a confirmé « Remplacer ».
 * Un serveur sans ce fichier n'a pas sauvegarde_remplacer, ni de protection : l'écriture ordinaire suffit.
 */
export async function remplacerSauvegarde(donnees, version) {
  try {
    return await appeler("sauvegarde_remplacer", { ...ident(), p_donnees: donnees, p_version: version });
  } catch (e) {
    if (e.code === "reseau" || !/sauvegarde_remplacer|PGRST202|\(404\)/.test(`${e.code} ${e.message}`)) throw e;
    return ecrireSauvegarde(donnees, version);
  }
}

/**
 * D237 (ResumePartie, RenteCore/Partage/Synchro.swift) : ce qu'il faut d'une sauvegarde pour savoir si une
 * autre la ferait reculer : la saison ouverte, les autres parties, le nombre de saisons au palmarès.
 */
export function resumePartie(donnees) {
  if (!donnees || typeof donnees !== "object") return null;
  const partie = (e) => ({ debut: Date.parse(e.debut) || 0, jours: e.jours?.length ?? 0, terminee: !!e.terminee });
  return { saison: donnees.saison ? partie(donnees.saison) : null, autres: (donnees.autresSaisons ?? []).map(partie),
           bilans: donnees.palmares?.length ?? 0 };
}

const partiesDe = (r) => (r.saison ? [r.saison] : []).concat(r.autres);
const meme = (a, b) => Math.abs(a.debut - b.debut) < 1000;
export const estNeuve = (r) => r.bilans === 0 && r.autres.length === 0 && (r.saison?.jours ?? 0) === 0;

/** Pourquoi remplacer `ancienne` (celle du serveur) par `nouvelle` la ferait reculer ; null : elle ne recule pas. */
export function reculerait(nouvelle, ancienne) {
  if (!nouvelle || !ancienne) return null;
  if (estNeuve(nouvelle) && !estNeuve(ancienne)) return { cas: "partieNeuve", texte: "cette partie est neuve, celle du serveur est déjà jouée" };
  if (estNeuve(nouvelle) && !nouvelle.saison && ancienne.saison) return { cas: "partieNeuve", texte: "cette partie est neuve, celle du serveur est déjà jouée" };
  if (ancienne.saison && !nouvelle.saison) return { cas: "saisonAbsente", texte: "cette partie n'a plus de saison, celle du serveur en a une" };
  if (nouvelle.bilans < ancienne.bilans) return { cas: "bilansPerdus", texte: "cette partie a moins de saisons au palmarès que celle du serveur" };
  const pa = partiesDe(ancienne), pn = partiesDe(nouvelle);
  if (pa.length && Math.max(...pn.map((p) => p.debut), -Infinity) < Math.max(...pa.map((p) => p.debut)) - 1000) {
    return { cas: "saisonPlusAncienne", texte: "la saison du serveur est plus récente" };
  }
  for (const a of pa) {
    const n = pn.find((p) => meme(p, a));
    if (n && n.jours < a.jours) return { cas: "moinsDeJours", texte: `cette partie en est au jour ${n.jours}, celle du serveur au jour ${a.jours}` };
  }
  return null;
}

/**
 * Garder la partie du navigateur ou prendre celle du serveur — la règle de l'iPhone (RNT-118) :
 * le serveur ne gagne que s'il est plus récent que tout ce que ce navigateur connaît.
 * D237 (DecisionSynchro.decider, partieServeur/partieLocale) : on regarde aussi le contenu.
 *  - `reprise` (compte repris ou créé ici) : la partie du serveur fait foi ;
 *  - une partie locale neuve ne remplace jamais une partie jouée : on prend celle du serveur ;
 *  - une partie locale qui ferait reculer celle du serveur reste, mais ne part pas sans l'accord du joueur.
 */
export function deciderSynchro({ serveur, locale, envoyee, envoiEnCours = false, partieServeur = null, partieLocale = null, reprise = false }) {
  if (reprise && partieServeur) return { prendre: "serveur" };
  const base = !envoiEnCours && serveur > Math.max(locale, envoyee)
    ? { prendre: "serveur" } : { prendre: "locale", renvoyer: locale > serveur };
  const recul = reculerait(partieLocale, partieServeur);
  if (recul?.cas === "partieNeuve") return { prendre: "serveur" };
  if (recul && base.prendre === "locale") return { prendre: "locale", renvoyer: false, confirmer: recul };
  return base;
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
