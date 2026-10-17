// ══════════════════════════════════════════════════════════════════════
//  Le mode en ligne du web (D205) : les mondes partagés, comme l'iPhone.
//
//  Les mêmes fonctions SQL que Rente/Services/ServiceEnLigne.swift, par
//  fetch sur l'API RPC de Supabase (la clé publique du compte, aucune
//  bibliothèque). Le moteur fait ce que fait l'iPhone entre deux appels
//  (RenteCore/…/Web/PontEnLigne.swift) ; ce fichier fait le transport :
//
//    synchroniser(ctx)   ModeleDebug.publierEnLigne : mon profil publié, ceux
//                        des autres relus, le marché des titres, les prêts,
//                        les locations, les mises, les virements, les
//                        franchises, les propositions, les coups (RNT-178),
//                        les invitations à manger (RNT-183), les villes, le
//                        fil, les virements reçus ; au plus une fois par
//                        minute sauf « force ».
//    les gestes          prêter, acheter des parts, la bourse du monde,
//                        racheter, franchiser, signaler, bloquer, les amis…
//
//  Ce que le serveur rend est gardé ici (`monde`) pour les pages ; ce qui
//  appartient à la partie (prêts, marché, copies) est relu dans le moteur.
// ══════════════════════════════════════════════════════════════════════
import { appeler, identite, ErreurServeur } from "./serveur.js";
import { fenetrePaiement } from "./paiement.js";
import { avatarPublie } from "./compte-local.js";

/** Ce qu'on sait du monde de la partie ouverte, au dernier passage. */
export const monde = {
  code: null,
  profils: [],
  marche: { titres: [], detentions: [], offres: [], rachats: [] },
  prets: [],
  locations: [],
  fil: [],
  /** RNT-200 : la fortune jour par jour de chacun (fortunes_monde, fortunes.sql) : { joueur: [{ jour, patrimoine }] }. */
  fortunes: {},
  franchises: [],
  interactions: [],
  bloques: [],
  options: null, // { options, futures, effet, admin, prive, journal }
  copies: [],
  amis: { amis: [], recues: [], envoyees: [], invitations: [] },
  erreur: null,
  derniere: 0,
};

const moi = () => identite.joueur;
const lc = (x) => String(x ?? "").toLowerCase();
export const estMoi = (x) => lc(x) === lc(moi());
const base = (code) => ({ p_code: code, p_joueur: moi(), p_secret: identite.secret });
const compte = () => ({ p_id: moi(), p_secret: identite.secret });
/** Un profil publié par l'iPhone : majLe en secondes depuis 2001. */
export const majLe = (p) => (Number(p?.majLe ?? 0) + 978_307_200) * 1000;

// MARK: - Les mondes (EntrerDansUnMonde)

/** « 64 bits » : la graine d'un monde ne tient pas dans un nombre JavaScript ; on la lit en texte. */
function graineEnTexte(texte) { return texte.replace(/"graine"\s*:\s*(-?\d+)/g, '"graine":"$1"'); }

/** Le monde d'un code, et les profils de ses joueurs (ServiceEnLigne.trouver). */
export async function trouver(saisi) {
  const code = normaliser(saisi);
  const o = await appeler("monde", { p_code: code }, { transformer: graineEnTexte });
  if (!o?.nom || !o.debut) throw new ErreurServeur("introuvable", "Aucun monde avec ce code.");
  return {
    monde: { id: code, code, nom: o.nom, prive: o.prive ?? true, arriveeEnCours: o.arriveeEnCours ?? false, debut: Date.parse(o.debut),
             graine: String(o.graine ?? "0"), places: o.places ?? 5, createur: o.createur ?? "" },
    profils: o.profils ?? [],
  };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Le code tel que tapé : en majuscules, sans espaces ni tirets (MondeEnLigne.normaliser). */
export const normaliser = (s) => [...String(s ?? "").toUpperCase()].filter((c) => ALPHABET.includes(c)).join("");

/** Crée un monde privé qui commence aujourd'hui ; `bots` : { nombre, niveau } (RNT-179) ; `regles` : ses options
 *  choisies à la création (D215, OptionsPartie), sinon celles d'un monde privé. */
export async function creer(ctx, { nom, arriveeEnCours, bots = null, regles = null }) {
  // Minuit à Bruxelles, comme Calendar.rente.startOfDay.
  const debut = minuitBruxelles(ctx.maintenant());
  const g = crypto.getRandomValues(new BigUint64Array(1))[0];
  const graine = BigInt.asIntN(64, g).toString();
  const corps = { p_nom: nom, p_prive: true, p_arrivee: arriveeEnCours, p_debut: new Date(debut).toISOString(), p_graine: "__GRAINE__", p_joueur: moi() };
  if (regles) corps.p_options = { ...regles };
  if (bots) {
    const r = await ctx.jouer("enLigne.optionsCreation", bots, { silencieux: true });
    if (r?.options) corps.p_options = regles ? { ...regles, bots: r.options.bots } : r.options;
  }
  const code = await appeler("creer_monde", corps, { brut: (t) => t.replace('"__GRAINE__"', graine) });
  if (typeof code !== "string") throw new ErreurServeur("", "Réponse illisible du serveur.");
  return code;
}

export function minuitBruxelles(ms) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  const ecoule = ((Number(p.hour) % 24) * 3600 + Number(p.minute) * 60 + Number(p.second)) * 1000;
  return Math.floor(ms / 1000) * 1000 - ecoule;
}

export const mondesPublics = async () => (await appeler("mondes_publics", {})) ?? [];
export const mondePublicLibre = () => appeler("monde_public_libre", { p_joueur: moi() });
export const mondesDuJoueur = async (pseudo) => (await appeler("mondes_du_joueur", { p_joueur: moi(), p_pseudo: pseudo ?? "" })) ?? [];

/** La place réservée en rejoignant (ProfilPublic(place:)), puis « rejoindre ». */
export async function rejoindre(ctx, m) {
  const p = avatarLocal(ctx);
  const place = { id: moi(), monde: m.id, pseudo: p.pseudo, symbole: p.symbole, teinte: p.teinte, profilDepart: "",
    majLe: ctx.maintenant() / 1000 - 978_307_200, jour: 0, patrimoine: 0, patrimoineDepart: 0, courbe: [],
    minutesFocusSaison: 0, minutesFocusSemaine: 0, serie: 0, boites: [], biens: [], vehicules: [], positions: [] };
  await appeler("rejoindre", { p_code: m.code, p_joueur: moi(), p_secret: identite.secret, p_donnees: place });
}

/** Le pseudo du compte ; l'avatar et la teinte du web (ceux de l'iPhone par défaut). */
export function avatarLocal(ctx) {
  const lire = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
  // Lot C : l'avatar choisi dans Réglages › Toi (compte-local.js), comme CompteLocal sur l'iPhone.
  return { pseudo: ctx.etat.compte?.pseudo || identite.pseudo || "Joueur", ...avatarPublie(),
           titre: lire("grind.titre"), cadre: lire("grind.cadre") };
}

/** D109 : reprendre ma partie d'un monde depuis la copie du serveur. */
export const lireEtat = (code) => appeler("lire_etat", base(code));

// MARK: - La synchronisation (ModeleDebug.publierEnLigne)

let enCours = null;

/** Rend vrai si la partie ouverte joue dans un monde en ligne. */
export async function etatPartie(ctx) {
  const r = await ctx.jouer("enLigne.etat", {}, { silencieux: true });
  return r?.enLigne ? r : null;
}

/** Publie mon profil et relit le monde ; une à la fois, au plus une par minute sauf `force`. */
export function synchroniser(ctx, { force = false } = {}) {
  // Un passage forcé suit un geste : celui en cours a pu lire le serveur avant lui ; on en refait un après.
  if (enCours) return force ? enCours.then(() => synchroniser(ctx, { force: true })) : enCours;
  if (!force && Date.now() - monde.derniere < 60_000) return Promise.resolve(false);
  enCours = (async () => {
    try { return await passage(ctx); } catch (e) { monde.erreur = e.message; return false; } finally { enCours = null; }
  })();
  return enCours;
}

async function passage(ctx) {
  monde.derniere = Date.now();
  if (ctx.etat.horsLigne || !ctx.etat.compte) return false;
  const e = await etatPartie(ctx);
  if (!e) { monde.code = null; return false; }
  const code = e.enLigne.code;
  if (monde.code !== code) Object.assign(monde, { code, profils: [], fil: [], fortunes: {}, interactions: [], franchises: [], copies: [], options: null });
  const rpc = (f, c = {}) => appeler(f, { ...base(code), ...c });
  const ignorer = (p) => p.catch(() => null);

  // Mon profil, mon registre, une copie de ma partie toutes les 10 minutes (D109).
  const a = avatarLocal(ctx);
  const pr = await ctx.jouer("enLigne.profil", { ...a, interactions: monde.interactions }, { silencieux: true });
  if (!pr?.profil) return false;
  await rpc("publier", { p_donnees: pr.profil });
  // RNT-200 : le relevé du jour de ma fortune (fortunes.sql) ; un serveur sans ce fichier : rien.
  await ignorer(rpc("fortune_relever"));
  if (pr.registre?.length) await ignorer(rpc("registre_publier", { p_boites: pr.registre }));
  if (Date.now() - (monde.copieLe ?? 0) > 600_000) {
    monde.copieLe = Date.now();
    const ex = await ctx.jouer("exporter", {}, { silencieux: true });
    if (ex?.sauvegarde?.saison) await ignorer(rpc("sauver_etat", { p_etat: ex.sauvegarde.saison }));
  }
  if (pr.vitrine) await ignorer(appeler("compte_vitrine", { ...compte(), p_vitrine: pr.vitrine }));

  // Les profils tels que j'ai le droit de les voir (RNT-143), sinon ceux du monde.
  let profils = await ignorer(rpc("profils_vus"));
  if (!Array.isArray(profils) || !profils.length) profils = (await trouver(code)).profils;
  monde.profils = profils;
  monde.copies = (await ignorer(appeler("copies_monde", { p_code: code }))) ?? monde.copies;
  monde.fortunes = (await ignorer(rpc("fortunes_monde"))) ?? monde.fortunes;

  // D107 : ce que les autres ont acheté, et leurs boîtes ; D126 les mises ; D108 les titres ; D110 les prêts ; D111 les locations.
  const [achats, marche, prets, locations, encheres] = await Promise.all([
    appeler("achats_monde", { p_code: code }), appeler("monde_titres", { p_code: code }), appeler("prets_monde", { p_code: code }),
    ignorer(appeler("locations_monde", { p_code: code })), ignorer(appeler("encheres_monde", { p_code: code })),
  ]);
  monde.marche = { titres: [], detentions: [], offres: [], rachats: [], ...(marche ?? {}) };
  monde.prets = prets ?? [];
  monde.locations = locations ?? [];
  const concurrents = {}, prix = {};
  for (const p of profils) if (!estMoi(p.id)) for (const b of p.boites ?? []) {
    if (!b.secteurID || !b.villeID) continue;
    const k = `${b.secteurID}|${b.villeID}`;
    concurrents[k] = (concurrents[k] ?? 0) + 1;
    (prix[k] ??= []).push(b.prixRelatif ?? 1);
  }
  const mises = {};
  for (const x of encheres ?? []) (mises[x.vente] ??= []).push({ joueur: x.joueur, plafond: x.plafond, date: Date.parse(x.date) });
  const sy = await ctx.jouer("enLigne.synchroniser", {
    code, pris: (achats ?? []).filter((x) => !estMoi(x.joueur)).map((x) => x.cle), concurrents, prix,
    marche: monde.marche, prets: monde.prets, locations: monde.locations, mises,
  }, { silencieux: true });
  // RNT-155 : les boîtes des autres (inspection), la carte, les cibles des combines, les copies.
  await ctx.jouer("enLigne.profils", { profils, marche: monde.marche, bloques: monde.bloques }, { silencieux: true });
  if (sy) {
    for (const k of sy.reserver ?? []) await ignorer(rpc("reserver", { p_cle: k }));
    for (const k of sy.liberer ?? []) await ignorer(rpc("liberer", { p_cle: k }));
    for (const t of [...(sy.titres ?? []), ...(pr.titres ?? [])]) await ignorer(publierTitre(code, t));
    for (const x of sy.echeances ?? []) await ignorer(rpc("pret_rembourser", { p_pret: x.pret, p_montant: x.montant }));
    for (const v of sy.virements ?? []) {
      if (v.nature === "copie") await ignorer(rpc("copie_commission", { p_copie: v.vers, p_montant: v.montant }));
      else if (v.nature === "franchise") {
        const [f, ville] = String(v.reference ?? "").split("|");
        if (f && ville) await ignorer(rpc("franchise_payer", { p_franchise: f, p_ville: ville, p_montant: v.montant, p_motif: v.motif }));
      } else await ignorer(rpc("virer", { p_vers: v.vers, p_montant: v.montant, p_motif: v.motif }));
    }
  }
  // RNT-112 : mes marques à jour, celles du monde relues, mes succursales disparues closes.
  await synchroniserFranchises(ctx, code);
  // D113 : les signalements qui me visent passent à l'inspection.
  for (const d of (await ignorer(rpc("denonciations_a_traiter_sujets"))) ?? []) {
    const r = await ctx.jouer("enLigne.denonciation", { sujet: d.sujet ?? null }, { silencieux: true });
    if (r) await ignorer(rpc("denonciation_resultat", { p_id: d.id, p_fautif: r.fautif, p_amende: r.amende }));
  }
  await synchroniserInteractions(ctx, code);
  await annoncerAvis(ctx, code);
  await synchroniserCoups(ctx, code);
  await synchroniserRepas(ctx, code);
  await synchroniserVilles(ctx, code);
  // RNT-197 : sans réseau (ni wifi ni forfait), les messages et les demandes attendent : ils arriveront d'un coup.
  const reseau = await ctx.tableau("reseau").catch(() => null);
  if (!reseau || reseau.discussions) await chargerAmis();
  const fausses = Number((await ignorer(rpc("fausses_accusations"))) ?? 0);
  if (fausses > 0) await ctx.jouer("enLigne.fausseAccusation", { nombre: fausses }, { silencieux: true });
  await publierFaits(ctx, code, a.pseudo);
  monde.fil = (await ignorer(appeler("fil_lire", { p_code: code }))) ?? monde.fil;
  const recus = (await rpc("encaisser")) ?? [];
  if (recus.length) {
    await ctx.jouer("enLigne.encaisser", { virements: recus }, { silencieux: true });
    const total = recus.reduce((s, v) => s + (v.montant ?? 0), 0);
    if (total > 0) ctx.toast(recus.length === 1 ? `${recus[0].motif} : +${euros(total)}` : `Virements reçus : +${euros(total)}`, "gain");
  }
  monde.erreur = null;
  ctx.sauvegarder();
  return true;
}

const euros = (c) => `${Math.round(c / 100).toLocaleString("fr-BE")} €`;

/**
 * RNT-200 : ce qu'un joueur ou un bot vient de faire qui me concerne (une combine, un voyage, un prêt, un
 * rachat ; un chantage, sans nom), annoncé une fois : un toast, et une notification du navigateur si elle
 * est permise (l'équivalent du Notificateur de l'iPhone). Le premier passage n'annonce rien.
 */
async function annoncerAvis(ctx, code) {
  const cle = `grind.avis.${code}`;
  let vus = null;
  try { vus = JSON.parse(localStorage.getItem(cle) ?? "null"); } catch {}
  const r = await ctx.jouer("enLigne.avis", { interactions: monde.interactions, prets: monde.prets, rachats: monde.marche.rachats ?? [],
    profils: monde.profils, vus }, { silencieux: true });
  if (!r) return;
  try { localStorage.setItem(cle, JSON.stringify(r.vus ?? [])); } catch {}
  for (const a of r.avis ?? []) {
    ctx.toast(a.titre, "info");
    notifier(a);
  }
}

/** Une notification du navigateur (permise par « Activer », page Les joueurs) ; rien sinon. */
export function notifier(a) {
  try {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const n = new Notification(a.titre, { body: a.texte, tag: a.cle, icon: "icone.svg" });
    n.onclick = () => { window.focus(); n.close(); };
  } catch {}
}

function publierTitre(code, t) {
  return appeler("titre_publier", { ...base(code), p_id: t.id, p_nom: t.nom, p_secteur: t.secteur, p_ville: t.ville, p_actions: t.actions,
    p_cote: t.cote, p_valeur: t.valeur, p_benefice: t.beneficeSemaine, p_semaine: t.semaine, p_snapshot: t.snapshot ?? null });
}

/** Les faits marquants de mon journal, partagés au fil du monde une seule fois (publierFaits). */
async function publierFaits(ctx, code, pseudo) {
  const cle = `grind.fil.${code}`;
  let dernier = 0;
  try { dernier = Number(localStorage.getItem(cle) ?? 0); } catch {}
  const ecrire = (v) => { try { localStorage.setItem(cle, String(v)); } catch {} };
  if (!dernier) return ecrire(ctx.maintenant()); // la première fois : on part de maintenant
  const FAITS = [["Création de ", "storefront.fill"], ["Achat : ", "house.fill"], ["Achat neuf : ", "car.fill"], ["Achat d'occasion : ", "car.fill"],
    ["Capital ouvert", "chart.pie.fill"], ["Tu prends le contrôle", "crown.fill"], ["Prêt personnel accordé", "banknote.fill"], ["Prêt reçu", "banknote.fill"]];
  const j = await ctx.jouer("journal", { nombre: 60 }, { silencieux: true });
  const lignes = (j?.journal ?? []).filter((x) => x.date > dernier).sort((x, y) => x.date - y.date);
  for (const x of lignes) {
    const f = FAITS.find(([p]) => x.titre?.startsWith(p));
    if (!f) continue;
    const texte = `${pseudo} : ${x.titre}${x.detail ? `, ${x.detail}` : ""}`.slice(0, 140);
    await appeler("fil_publier", { ...base(code), p_texte: texte, p_icone: f[1] }).catch(() => {});
  }
  if (lignes.length) ecrire(lignes.at(-1).date);
}

async function synchroniserFranchises(ctx, code) {
  const liste = (await appeler("franchises_monde", { p_code: code }).catch(() => null)) ?? monde.franchises;
  const r = await ctx.jouer("enLigne.franchises", { franchises: liste }, { silencieux: true });
  for (const f of r?.publier ?? []) await publierFranchise(code, f).catch(() => {});
  for (const c of r?.quitter ?? []) await appeler("franchise_quitter", { ...base(code), p_franchise: c.franchise, p_ville: c.ville }).catch(() => {});
  monde.franchises = liste;
}

const publierFranchise = (code, f) => appeler("franchise_publier", { ...base(code), p_id: f.id, p_boite: f.boite, p_marque: f.marque,
  p_secteur: f.secteur, p_gamme: f.gamme, p_prix: f.prix, p_reputation: f.reputation, p_redevance: f.redevance, p_droit: f.droitEntree, p_ouverte: f.ouverte });

/** Les règles, les blocages, les propositions ; ce qui me revient appliqué ici (synchroniserInteractions). */
async function synchroniserInteractions(ctx, code) {
  const o = await appeler("monde_options", { p_code: code }).catch(() => null);
  if (o) {
    monde.options = o;
    await ctx.jouer("enLigne.options", { options: o.options ?? null }, { silencieux: true });
  }
  monde.bloques = (await appeler("blocages_mes", base(code)).catch(() => null)) ?? monde.bloques;
  const liste = await appeler("interactions_mes", base(code)).catch(() => null);
  if (!Array.isArray(liste)) return;
  monde.interactions = liste;
  const r = await ctx.jouer("enLigne.interactions", { interactions: liste }, { silencieux: true });
  for (const x of r?.repondre ?? []) await repondreServeur(code, x.id, x.statut, x.trouve ? { trouve: x.trouve } : null).catch(() => {});
  for (const d of r?.dilemmes ?? []) await appeler("interaction_envoyer", { ...base(code), p_vers: d.vers, p_sorte: "dilemme", p_donnees: d.donnees, p_expire: d.expire }).catch(() => {});
  if ((r?.repondre?.length ?? 0) + (r?.dilemmes?.length ?? 0) > 0) monde.interactions = (await appeler("interactions_mes", base(code)).catch(() => null)) ?? liste;
}

const repondreServeur = (code, id, statut, reponse) =>
  appeler("interaction_repondre", { ...base(code), p_id: id, p_statut: statut ?? null, p_reponse: reponse && Object.keys(reponse).length ? reponse : null });

/** RNT-178 : les coups entre joueurs (synchroniserCoups). Un serveur sans coups.sql : rien. */
export async function synchroniserCoups(ctx, code = monde.code) {
  if (!code) return;
  const lire = () => appeler("coups_mes", base(code)).catch(() => null);
  let coups = await lire();
  if (!Array.isArray(coups)) return;
  const titres = [];
  const r1 = await ctx.jouer("combines.recevoir", { coups }, { silencieux: true });
  titres.push(...(r1?.titres ?? []));
  const x = await ctx.jouer("combines.aEnvoyer", {}, { silencieux: true });
  const envoyes = { publies: [], appliques: [], plaintes: [] };
  // Un refus du serveur (cible en focus, déjà tenté) est définitif ; le réseau, on réessaiera.
  for (const c of x?.publier ?? []) {
    try { await appeler("coup_publier", { ...base(code), p_coup: c }); envoyes.publies.push(c.id); }
    catch (e) { if (e.code !== "reseau") envoyes.publies.push(c.id); }
  }
  for (const c of x?.appliques ?? []) {
    if (await appeler("coup_appliquer", { ...base(code), p_id: c.id, p_perte: c.perte ?? 0, p_butin: c.butin ?? 0, p_detail: c.detail ?? "" }).then(() => true, () => false)) envoyes.appliques.push(c.id);
  }
  for (const c of x?.plaintes ?? []) if (await appeler("coup_plainte", { ...base(code), p_id: c.id }).then(() => true, () => false)) envoyes.plaintes.push(c.id);
  await ctx.jouer("combines.envoyes", envoyes, { silencieux: true });
  if (envoyes.plaintes.length && Array.isArray(coups = await lire())) {
    const r2 = await ctx.jouer("combines.recevoir", { coups }, { silencieux: true });
    titres.push(...(r2?.titres ?? []));
  }
  for (const t of titres) ctx.toast(t, "refus");
}

/** RNT-183 : les invitations à manger (synchroniserRepas). Un serveur sans repas.sql : rien. */
export async function synchroniserRepas(ctx, code = monde.code) {
  if (!code) return;
  const l = await appeler("repas_mes", base(code)).catch(() => null);
  if (!Array.isArray(l)) return;
  const r = await ctx.jouer("repas.recevoir", { invitations: l }, { silencieux: true });
  const x = await ctx.jouer("repas.aEnvoyer", {}, { silencieux: true });
  const envoyes = { publiees: [], reponses: [], servis: [], vus: [] };
  const definitif = (e) => e.code !== "reseau";
  for (const i of x?.publier ?? []) {
    try { await appeler("repas_inviter", { ...base(code), p_invitation: i }); envoyes.publiees.push(i.id); } catch (e) { if (definitif(e)) envoyes.publiees.push(i.id); }
  }
  for (const [id, statut] of Object.entries(x?.reponses ?? {})) {
    try { await appeler("repas_repondre", { ...base(code), p_id: id, p_statut: statut }); envoyes.reponses.push(id); } catch (e) { if (definitif(e)) envoyes.reponses.push(id); }
  }
  for (const i of x?.servis ?? []) if (await appeler("repas_servir", { ...base(code), p_id: i.id, p_plaisir: i.plaisir ?? 0, p_faim: i.faim ?? 0 }).then(() => true, () => false)) envoyes.servis.push(i.id);
  for (const id of x?.vus ?? []) if (await appeler("repas_vu", { ...base(code), p_id: id }).then(() => true, () => false)) envoyes.vus.push(id);
  if (Object.values(envoyes).some((v) => v.length)) await ctx.jouer("repas.envoyes", envoyes, { silencieux: true });
  for (const t of r?.titres ?? []) ctx.toast(t, "gain");
}

/** RNT-150 : mes mises et candidatures partent, puis les mises et les votes de tous reviennent. */
async function synchroniserVilles(ctx, code) {
  const x = await ctx.jouer("enLigne.villesAEnvoyer", {}, { silencieux: true });
  if (!x) return;
  const mises = [], candidatures = [];
  for (const [id, m] of Object.entries(x.mises ?? {})) if (await appeler("ville_investir", { ...base(code), p_chantier: id, p_montant: m }).then(() => true, () => false)) mises.push(id);
  for (const [id, n] of Object.entries(x.candidatures ?? {})) if (await appeler("chantier_candidater", { ...base(code), p_chantier: id, p_note: n }).then(() => true, () => false)) candidatures.push(id);
  if (mises.length || candidatures.length) await ctx.jouer("enLigne.villesEnvoyees", { mises, candidatures }, { silencieux: true });
  for (const [id, type] of Object.entries(x.arreter ?? {})) await appeler("chantier_arreter", { ...base(code), p_chantier: id, p_type: type }).catch(() => {});
  const v = await appeler("villes_monde", base(code)).catch(() => null);
  if (v) await ctx.jouer("enLigne.villes", v, { silencieux: true });
}

/** Voter pour le chantier d'une ville, en ligne (choisirChantier). */
export async function voterChantier(ctx, chantier, type) {
  await appeler("chantier_voter", { ...base(monde.code), p_chantier: chantier, p_type: type });
  await ctx.jouer("enLigne.vote", { chantier, type }, { silencieux: true });
  await synchroniserVilles(ctx, monde.code);
}

// MARK: - Payer un joueur (carteEnLigne)

/**
 * La fenêtre de paiement d'un paiement en ligne, puis le paiement. Rend un refus (texte), « annule »,
 * ou null quand c'est payé.
 */
export async function payer(ctx, montant, motif) {
  const carte = await choisirCarte(ctx, montant, motif);
  if (carte === null) return "annule";
  const r = await ctx.jouer("enLigne.paiement", { montant, motif, ...(carte !== undefined ? { carte } : {}) }, { silencieux: true });
  return r?.refus ?? (r ? null : "Le moteur a refusé.");
}

/** Le moyen choisi (undefined : rien à choisir, null : annulé). */
export async function choisirCarte(ctx, montant, motif) {
  const a = await ctx.jouer("enLigne.apercuPaiement", { montant, motif }, { silencieux: true });
  return a?.paiement ? fenetrePaiement(a.paiement) : undefined;
}

const rendre = (ctx, montant, motif) => ctx.jouer("enLigne.encaisser", { virements: [{ montant, motif }] }, { silencieux: true });

// MARK: - Les gestes (ModeleDebug, EcranBourseMonde, EcranEnLigne)

/** Un geste : rend le refus (texte) ou null ; republie ensuite. */
async function geste(ctx, f) {
  if (!monde.code) return "Pas en ligne.";
  try {
    const r = await f(monde.code);
    if (typeof r === "string") return r;
  } catch (e) { return e.message; }
  await synchroniser(ctx, { force: true });
  return null;
}

/** Prêter : l'argent quitte mon compte tout de suite, et revient s'il refuse. */
export const preter = (ctx, vers, montant, taux, semaines) => geste(ctx, async (code) => {
  const refus = await payer(ctx, montant, "Prêt à un joueur");
  if (refus) return refus === "annule" ? "annule" : refus;
  try { await appeler("pret_proposer", { ...base(code), p_vers: vers, p_montant: montant, p_taux: taux, p_semaines: semaines }); }
  catch (e) { await rendre(ctx, montant, "Prêt annulé : remboursé"); throw e; }
});

export const repondrePret = (ctx, id, accepte) => geste(ctx, (code) => appeler("pret_repondre", { ...base(code), p_pret: id, p_accepte: accepte }));

export const reagir = async (ctx, fait, emoji) => {
  if (!monde.code) return;
  await appeler("fil_reagir", { ...base(monde.code), p_fil: fait, p_emoji: emoji }).catch(() => {});
  monde.fil = (await appeler("fil_lire", { p_code: monde.code }).catch(() => null)) ?? monde.fil;
};

/** Le prix d'une action : la valeur divisée, poussée par les ordres ; RNT-98 la fièvre du premier jour. */
export function prixAction(t, maintenant = Date.now()) {
  let f = 1;
  if (t.introduitLe != null) {
    const h = (maintenant / 1000 - t.introduitLe) / 3600;
    if (h >= 0 && h < 24) f = 1 + 0.12 * (1 - h / 24) * (Math.sin((2 * Math.PI * h) / 2.3) + 0.5 * Math.sin((2 * Math.PI * h) / 0.37));
  }
  return (t.valeur / Math.max(1, t.actions)) * (t.flux ?? 1) * f;
}
export const premierJour = (t, maintenant = Date.now()) => t.introduitLe != null && maintenant / 1000 - t.introduitLe < 86_400;
export const detenu = (m, titre, joueur = moi()) => (m.detentions ?? []).filter((d) => d.titre === titre && lc(d.joueur) === lc(joueur)).reduce((s, d) => s + d.actions, 0);
/** Les actions en bourse : celles que personne ne détient (MarcheEnLigne.flottant). */
export function flottant(m, titre) {
  const t = (m.titres ?? []).find((x) => x.id === titre);
  if (!t?.cote) return 0;
  return Math.max(0, t.actions - (m.detentions ?? []).filter((d) => d.titre === titre).reduce((s, d) => s + d.actions, 0));
}

/** Acheter sur une offre d'un autre joueur. */
export const acheterOffre = (ctx, o, actions) => geste(ctx, async (code) => {
  const carte = await choisirCarte(ctx, Math.round(o.prixAction * actions), "Achat de parts");
  if (carte === null) return "annule";
  const montant = await appeler("titre_acheter_offre", { ...base(code), p_offre: o.id, p_actions: actions });
  const r = await ctx.jouer("enLigne.paiement", { montant, motif: "Achat de parts", ...(carte !== undefined ? { carte } : {}) }, { silencieux: true });
  return r?.refus ?? null;
});

/** Bourse du monde : + acheter, − vendre ; la fenêtre montre le prix avec 10 % de marge. */
export const bourse = (ctx, t, delta) => geste(ctx, async (code) => {
  let carte;
  if (delta > 0) {
    carte = await choisirCarte(ctx, Math.round(delta * prixAction(t) * 1.1), `Achat en bourse : ${t.nom}`);
    if (carte === null) return "annule";
  }
  const montant = await appeler("titre_bourse", { ...base(code), p_titre: t.id, p_delta: delta });
  if (delta > 0) {
    const r = await ctx.jouer("enLigne.paiement", { montant, motif: `Achat en bourse : ${t.nom}`, ...(carte !== undefined ? { carte } : {}) }, { silencieux: true });
    return r?.refus ?? null;
  }
});

export const revendre = (ctx, t, actions, prix) => geste(ctx, (code) => appeler("titre_offrir", { ...base(code), p_titre: t.id, p_actions: actions, p_prix: prix }));
export const retirerOffre = (ctx, o) => geste(ctx, (code) => appeler("titre_retirer_offre", { ...base(code), p_offre: o.id }));

/** D124 : racheter des parts de ma boîte ; l'argent est mis de côté par le serveur. */
export const proposerRachat = (ctx, t, vendeur, actions, prix) => geste(ctx, async (code) => {
  const carte = await choisirCarte(ctx, Math.round(actions * prix), `Rachat de parts : ${t.nom}`);
  if (carte === null) return "annule";
  const o = await appeler("rachat_proposer", { ...base(code), p_titre: t.id, p_vendeur: vendeur, p_actions: actions, p_prix: prix });
  const r = await ctx.jouer("enLigne.paiement", { montant: o?.montant ?? 0, motif: `Rachat de parts : ${t.nom}`, ...(carte !== undefined ? { carte } : {}) }, { silencieux: true });
  if (r?.refus) { await appeler("rachat_retirer", { ...base(code), p_rachat: o?.id ?? 0 }).catch(() => {}); return r.refus; }
});
export const repondreRachat = (ctx, r, accepter) => geste(ctx, (code) => appeler("rachat_repondre", { ...base(code), p_rachat: r.id, p_accepter: accepter }));
export const retirerRachat = (ctx, r) => geste(ctx, (code) => appeler("rachat_retirer", { ...base(code), p_rachat: r.id }));

/** Ouvre le capital si besoin, publie le titre, rend son identifiant (titrePublie). */
async function titrePublie(ctx, code, boite) {
  const r = await ctx.jouer("enLigne.capital", { boite }, { silencieux: true });
  if (!r) throw new Error("Le moteur a refusé.");
  if (r.refus) throw new Error(r.refus);
  if (r.titre) await publierTitre(code, r.titre);
  return r.id;
}

/** Vendre une part (en %) d'une de mes boîtes aux autres joueurs, à un prix par point de pourcentage. */
export const vendreParts = (ctx, boite, pourcent, prixParPourcent) => geste(ctx, async (code) => {
  const id = await titrePublie(ctx, code, boite);
  await appeler("titre_offrir", { ...base(code), p_titre: id, p_actions: Math.round(pourcent * 10_000), p_prix: prixParPourcent / 10_000 });
});

/** Introduire une part (en %) en bourse ; l'argent arrive au prochain passage. RNT-98 : la première fois s'annonce. */
export const introduire = (ctx, boite, pourcent, nom) => geste(ctx, async (code) => {
  const id = await titrePublie(ctx, code, boite);
  const deja = (monde.marche.titres ?? []).find((t) => t.id === id)?.cote ?? false;
  await appeler("titre_introduire", { ...base(code), p_titre: id, p_actions: Math.round(pourcent * 10_000) });
  if (!deja && nom) await appeler("fil_publier", { ...base(code), p_texte: `${nom} entre en bourse : premier jour agité`, p_icone: "sparkles" }).catch(() => {});
});

/** RNT-112 : ouvrir la marque d'une de mes boîtes, ou la fermer aux nouvelles succursales. */
export const ouvrirMarque = (ctx, boite, redevance, droitEntree, ouverte = true) => geste(ctx, async (code) => {
  const r = await ctx.jouer("enLigne.marque", { boite, redevance, droitEntree, ouverte }, { silencieux: true });
  if (!r?.franchise) return r?.refus ?? "Cette boîte n'existe plus.";
  await publierFranchise(code, r.franchise);
  if (ouverte) await appeler("fil_publier", { ...base(code), p_texte: `${avatarLocal(ctx).pseudo} : ${r.franchise.marque} s'ouvre en franchise`, p_icone: "signature" }).catch(() => {});
});

/** RNT-112 : une succursale d'une marque d'un autre joueur, là où je suis. */
export const ouvrirSuccursale = (ctx, f) => geste(ctx, async (code) => {
  const a = await ctx.jouer("enLigne.succursale.apercu", { franchise: f }, { silencieux: true });
  const carte = a?.paiement ? await fenetrePaiement(a.paiement) : undefined;
  if (carte === null) return "annule";
  const ville = a?.ville;
  const o = await appeler("franchise_rejoindre", { ...base(code), p_franchise: f.id, p_ville: ville });
  const g = { ...f, ...(o ?? {}) };
  const r = await ctx.jouer("enLigne.succursale", { franchise: g, ...(carte !== undefined ? { carte } : {}) }, { silencieux: true });
  if (r?.refus || !r) {
    await appeler("franchise_quitter", { ...base(code), p_franchise: f.id, p_ville: ville }).catch(() => {});
    return r?.refus ?? "Le moteur a refusé.";
  }
});

/** D111 : proposer mon bien à un joueur, le retirer, prendre celui d'un autre. */
export const proposerLocation = (ctx, bien, nom, ville, loyer) => geste(ctx, (code) => appeler("location_proposer", { ...base(code), p_bien: bien, p_nom: nom, p_ville: ville, p_loyer: loyer }));
export const retirerLocation = (ctx, bien) => geste(ctx, (code) => appeler("location_retirer", { ...base(code), p_bien: bien }));
export const prendreLocation = (ctx, l) => geste(ctx, async (code) => {
  const ok = await appeler("location_prendre", { ...base(code), p_bien: l.bien });
  if (!ok) return "Ce logement vient d'être pris.";
  const r = await ctx.jouer("enLigne.louer", { location: l }, { silencieux: true });
  if (r?.refus || !r) { await appeler("location_rendre", { ...base(code), p_bien: l.bien }).catch(() => {}); return r?.refus ?? "Refusé."; }
});

/** D113 : signaler pour travail au noir (anonyme) ; D131 : signaler un comportement. */
export const denoncer = (ctx, joueur) => geste(ctx, (code) => appeler("denoncer", { ...base(code), p_cible: joueur }));
export const signaler = async (joueur, motif) => appeler("signaler", { ...base(monde.code), p_cible: joueur, p_motif: motif });
export const bloquer = (ctx, joueur, bloque) => geste(ctx, async (code) => {
  await appeler("bloquer", { ...base(code), p_vers: joueur, p_bloque: bloque });
  monde.bloques = (await appeler("blocages_mes", base(code)).catch(() => null)) ?? monde.bloques;
});

/** RNT-104 : copier ses ordres en bourse (budget, commission du monde), ou arrêter. */
export const copier = (ctx, joueur, budget, commission = 0.1) => geste(ctx, async (code) => {
  const r = await ctx.jouer("enLigne.copier", { joueur, budget }, { silencieux: true });
  if (r?.refus || !r) return r?.refus ?? "Refusé.";
  await appeler("copie_commencer", { ...base(code), p_copie: joueur, p_budget: budget, p_commission: commission }).catch(() => {});
});
export const arreterCopie = (ctx, joueur, fermer) => geste(ctx, async (code) => {
  const r = await ctx.jouer("enLigne.arreterCopie", { joueur, fermer }, { silencieux: true });
  if (r?.refus || !r) return r?.refus ?? "Refusé.";
  await appeler("copie_arreter", { ...base(code), p_copie: joueur }).catch(() => {});
});

// MARK: - Entre joueurs (push 5)

/** Ce qui m'attend : les propositions à trancher (interactionsATraiter). */
export function aTraiter(maintenant = Date.now()) {
  const exp = (i) => i.expire && Date.parse(i.expire) <= maintenant;
  return monde.interactions.filter((i) => {
    const pourMoi = estMoi(i.vers), deMoi = estMoi(i.de);
    if (["combine", "voyage", "chantage"].includes(i.sorte) && i.statut === "attente") return pourMoi && !exp(i);
    if (i.sorte === "combine" && i.statut === "contre") return deMoi;
    if (i.sorte === "dilemme" && i.statut === "attente") return !(deMoi ? i.reponse?.choixDe : i.reponse?.choixVers) && !exp(i);
    return false;
  });
}

async function envoyer(ctx, code, sorte, vers, donnees, expire) {
  const id = await appeler("interaction_envoyer", { ...base(code), p_vers: vers, p_sorte: sorte, p_donnees: donnees, p_expire: expire ?? null });
  await synchroniserInteractions(ctx, code);
  return id;
}

export const proposerCombine = (ctx, combine, part, joueur) => geste(ctx, async (code) => {
  const r = await ctx.jouer("enLigne.combineDuo", { combine, part }, { silencieux: true });
  if (r?.refus) return r.refus;
  await envoyer(ctx, code, "combine", joueur, r.donnees, r.expire);
});
export const repondre = (ctx, i, statut, reponse = null) => geste(ctx, async (code) => {
  await repondreServeur(code, i.id, statut, reponse);
  await synchroniserInteractions(ctx, code);
});
export const faireChanter = (ctx, joueur, montant) => geste(ctx, async (code) => {
  const r = await ctx.jouer("enLigne.chantage", { joueur, montant }, { silencieux: true });
  if (r?.refus) return r.refus;
  await envoyer(ctx, code, "chantage", joueur, r.donnees, r.expire);
  await ctx.jouer("enLigne.preuve", { joueur }, { silencieux: true });
});
export const payerChantage = (ctx, i) => geste(ctx, async (code) => {
  const r = await ctx.jouer("enLigne.payerChantage", { interaction: i }, { silencieux: true });
  if (r?.refus) return r.refus;
  await repondreServeur(code, i.id, "payee", null);
  await synchroniserInteractions(ctx, code);
});
export const inviterEnVoyage = (ctx, joueur, frais) => geste(ctx, async (code) => {
  const r = await ctx.jouer("enLigne.voyage", { frais }, { silencieux: true });
  if (r?.refus) return r.refus;
  await envoyer(ctx, code, "voyage", joueur, r.donnees, r.expire);
});
export const accepterVoyage = (ctx, i) => geste(ctx, async (code) => {
  const v = await ctx.jouer("enLigne.accepterVoyage", { interaction: i, verifier: true }, { silencieux: true });
  if (v?.refus) return v.refus;
  await repondreServeur(code, i.id, "acceptee", null);
  const r = await ctx.jouer("enLigne.accepterVoyage", { interaction: i }, { silencieux: true });
  await synchroniserInteractions(ctx, code);
  return r?.refus ?? null;
});
/**
 * Retour du 13/10 (ModeleDebug.attendreInvite) : il n'a pas répondu ; on reporte le départ au suivant,
 * on retire l'invitation et on la renvoie pour ce nouveau départ, aux mêmes frais.
 */
export const attendreInvite = (ctx, i) => geste(ctx, async (code) => {
  if (!(await ctx.decider("monde", { reporterDepart: {} }))) return "Le départ ne se reporte pas.";
  await repondreServeur(code, i.id, "annulee", null).catch(() => {});
  const r = await ctx.jouer("enLigne.voyage", { frais: i.donnees?.frais ?? "partage" }, { silencieux: true });
  if (r?.refus) return r.refus;
  await envoyer(ctx, code, "voyage", i.vers, r.donnees, r.expire);
});
/** « Partir sans lui » : l'invitation est retirée ; le trajet part à l'heure, seul. */
export const partirSansLui = (ctx, i) => geste(ctx, async (code) => {
  await repondreServeur(code, i.id, "annulee", null);
  await synchroniserInteractions(ctx, code);
});
/** RNT-144 : inspecter une boîte, envoyée d'abord (le serveur peut refuser), payée ensuite. */
export const inspecter = (ctx, boite, mode) => geste(ctx, async (code) => {
  const v = await ctx.jouer("enLigne.inspection", { boite, mode, verifier: true }, { silencieux: true });
  if (v?.refus) return v.refus;
  const id = await appeler("interaction_envoyer", { ...base(code), p_vers: v.joueur, p_sorte: "inspection", p_donnees: v.donnees, p_expire: null });
  const r = await ctx.jouer("enLigne.inspection", { boite, mode }, { silencieux: true });
  if (r?.refus) { await repondreServeur(code, id, "annulee", null).catch(() => {}); return r.refus; }
  await synchroniserInteractions(ctx, code);
});
export const denoncerSujet = (ctx, joueur, sujet) => geste(ctx, async (code) => {
  await appeler("denoncer_sujet", { ...base(code), p_cible: joueur, p_sujet: sujet ?? null });
  await ctx.jouer("enLigne.preuve", { joueur }, { silencieux: true });
});
export const changerOptions = (ctx, options) => geste(ctx, async (code) => {
  await appeler("monde_options_changer", { ...base(code), p_options: options });
  monde.options = (await appeler("monde_options", { p_code: code }).catch(() => null)) ?? monde.options;
});

// MARK: - Amis (RNT-154)

export async function chargerAmis() {
  const o = await appeler("amis_mes", compte()).catch(() => null);
  if (o) monde.amis = { amis: o.amis ?? [], recues: o.recues ?? [], envoyees: o.envoyees ?? [], invitations: o.invitations ?? [] };
  return monde.amis;
}
export const demanderAmi = (pseudo) => appeler("ami_demander", { ...compte(), p_pseudo: pseudo });
export const repondreAmi = (id, accepte) => appeler("ami_repondre", { ...compte(), p_de: id, p_accepte: accepte });
export const retirerAmi = (id) => appeler("ami_retirer", { ...compte(), p_autre: id });
export const inviterAmi = (ami, code) => appeler("partie_inviter", { ...compte(), p_ami: ami, p_code: code });
export const repondreInvitation = (id, accepte) => appeler("partie_invitation_repondre", { ...compte(), p_invitation: id, p_accepte: accepte });
export const ficheAmi = (ami) => appeler("ami_fiche", { ...compte(), p_ami: ami });
export const discussionAmi = async (ami) => (await appeler("ami_discussion", { ...compte(), p_ami: ami })) ?? [];
export const ecrireAmi = (ami, texte) => appeler("ami_ecrire", { ...compte(), p_ami: ami, p_texte: String(texte).slice(0, 1000) });

// MARK: - Vitrine et défis entre amis (D185, ModeleDebug.chargerDefis)

/** Ma vitrine publiée pour mes amis (niveau, focus, en focus maintenant), et les défis relus. */
let vitrinePubliee = "";

/**
 * Comme l'iPhone : ma vitrine publiée si elle a changé ; mes défis relus ; pour chaque défi en cours,
 * mes minutes de focus depuis son début, déclarées au serveur quand elles ont monté.
 */
export async function chargerDefis(ctx) {
  const l = await appeler("defis_mes", compte()).catch(() => null);
  const enCours = Array.isArray(l) ? l.filter((d) => d.statut === "encours") : [];
  const v = await ctx.jouer("enLigne.vitrine", { defis: enCours }, { silencieux: true });
  if (v?.vitrine) {
    monde.vitrine = v.vitrine;
    const t = JSON.stringify(v.vitrine);
    if (t !== vitrinePubliee) { vitrinePubliee = t; await appeler("compte_vitrine", { ...compte(), p_vitrine: v.vitrine }).catch(() => { vitrinePubliee = ""; }); }
  }
  if (!Array.isArray(l)) return monde.defis;
  for (const d of enCours) {
    const m = v?.minutes?.[String(d.id)] ?? 0;
    if (m > (d.moi ?? 0)) { try { await appeler("defi_progression", { ...compte(), p_defi: d.id, p_minutes: m }); d.moi = m; } catch {} }
  }
  monde.defis = l;
  return l;
}
export const lancerDefi = (ami) => appeler("defi_lancer", { ...compte(), p_ami: ami });
export const repondreDefi = (id, accepte) => appeler("defi_repondre", { ...compte(), p_defi: id, p_accepte: accepte });
export const annulerDefi = (id) => appeler("defi_annuler", { ...compte(), p_defi: id });

/** Une date de la vitrine : en secondes depuis 2001 (l'iPhone, JSONEncoder par défaut) ou en millisecondes. */
export const dateVitrine = (x) => (x == null ? null : Number(x) > 1e11 ? Number(x) : (Number(x) + 978_307_200) * 1000);

// MARK: - Journal du dimanche (RNT-106, ModeleJournal)

/**
 * L'édition à lire : celle du serveur si quelqu'un l'a déjà écrite ; sinon la nôtre (écrite par le moteur
 * avec les profils du moment), déposée : le serveur garde la première, et c'est elle que tout le monde lit.
 */
export async function chargerJournal(ctx) {
  const code = monde.code;
  if (!code) return null;
  const j = await ctx.jouer("enLigne.journal", { profils: monde.profils, fil: monde.fil.map((x) => x.texte) }, { silencieux: true });
  if (!j?.edition) { monde.journal = j ? { ...j, edition: null } : null; return monde.journal; }
  const deja = monde.journal;
  if (deja?.code === code && deja.edition?.semaine === j.semaine && deja.garde) return deja;
  let edition = null, garde = true;
  try { edition = await appeler("journal_lire", { p_code: code, p_semaine: j.semaine }); } catch {}
  if (!edition) {
    try { edition = await appeler("journal_publier", { ...base(code), p_semaine: j.semaine, p_edition: j.edition }); } catch {}
    // Le serveur n'a pas répondu : on montre la nôtre, et on retentera au prochain passage.
    if (!edition) { edition = j.edition; garde = false; }
  }
  monde.journal = { code, titre: j.titre, prochaine: j.prochaine, edition, garde };
  return monde.journal;
}

// MARK: - Locations entre joueurs : le bail et le loyer (D111, D116)

export const expulser = (ctx, bien) => geste(ctx, (code) => appeler("location_expulser", { ...base(code), p_bien: bien }));
export const proposerLoyer = (ctx, bien, loyer) => geste(ctx, (code) => appeler("location_proposer_loyer", { ...base(code), p_bien: bien, p_loyer: loyer }));
export const repondreLoyer = (ctx, bien, accepte) => geste(ctx, (code) => appeler("location_repondre_loyer", { ...base(code), p_bien: bien, p_accepte: accepte }));

/** Le pseudo d'un joueur du monde. */
export function pseudoDe(joueur) {
  if (!joueur) return "Quelqu'un";
  return monde.profils.find((p) => lc(p.id) === lc(joueur))?.pseudo ?? "Un joueur";
}

/** D107 : en ligne, un bien, une occasion, une pièce n'ont qu'un acheteur ; on les réserve avant de payer. */
export function cleUnique(famille, op) {
  const k = Object.keys(op ?? {})[0];
  const v = op?.[k] ?? {};
  if (famille === "immobilier" && k === "acheter") return `bien:${v._0 ?? v.bien ?? v.id}`;
  if (famille === "garage" && k === "acheterOccasion") return `occasion:${v._0 ?? v.annonce}`;
  if (famille === "montres" && k === "acheterStock") return `stock:${v._0 ?? v.piece}`;
  if (famille === "entreprises" && k === "racheter") return `boite:${v._0 ?? v.annonce}`;
  return null;
}

/** D126 : ma mise (mon plafond) sur une vente aux enchères du monde. */
export const miser = (vente, plafond) => appeler("enchere_miser", { ...base(monde.code), p_vente: vente, p_plafond: plafond });

export async function reserver(cle) {
  if (!monde.code || !cle) return null;
  try { return (await appeler("reserver", { ...base(monde.code), p_cle: cle })) ? null : "Un autre joueur vient de l'acheter."; }
  catch (e) { return e.message; }
}
export async function liberer(cle) {
  if (monde.code && cle) await appeler("liberer", { ...base(monde.code), p_cle: cle }).catch(() => {});
}
