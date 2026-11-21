// ══════════════════════════════════════════════════════════════════════
//  Réglages (EcransReglages.swift, RNT-86), comme sur l'iPhone : une page
//  courte de rubriques qui ouvrent chacune leur page (D388 : plus de carte
//  de membre ni de page « Toi » : tout le profil se règle dans
//  Profil › Personnaliser mon profil) :
//    Compte, Mes mondes, Focus, Apparence, Carte ; Nouveautés, Aide, Avancé.
//  Écrire à Grind (EcranRetours) a sa page, avec l'aperçu de la capture.
//
//  Ce qui n'a pas de sens dans un navigateur n'y est pas : l'icône de
//  l'app, la Live Activity, les apps surveillées par Raccourcis (sur le
//  web, quitter l'onglet compte comme une app interdite : la page Focus
//  le dit).
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "../format.js?v=3e8bddd9";
import { entetePousse, bouton, segment, icones, confirmer, champFichier, iconeAnimee } from "../ui.js?v=3e8bddd9";
import { sonsActifs, vibrationsActives, vibrer, actionsReglagesSons } from "../sons.js?v=3e8bddd9"; // lot A : Sons et vibrations
import { CHOIX_ECONOMIE, choixEconomie, choisirEconomie, piedEconomie } from "../economie.js?v=3e8bddd9"; // RNT-261 : le mode économie

import * as serveur from "../serveur.js?v=3e8bddd9";
import * as L from "../enligne.js?v=3e8bddd9";
import { courante } from "./nouveautes.js?v=3e8bddd9";
import * as FID from "../faceid.js?v=3e8bddd9"; // D363 : Face ID / clé d'accès avant de payer
import { SUJETS, ORDRE_TUTORIELS } from "../aide-donnees.js?v=3e8bddd9";
import { ouvrirAide } from "../aide.js?v=3e8bddd9";
import {
  accentChoisi, accentsDisponibles, choisirAccent, CLES, controlePresenceActif, basculerControlePresence,
} from "../compte-local.js?v=3e8bddd9";

const lireLocal = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const ecrireLocal = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

// MARK: Petites briques (RubriqueReglages, LigneReglage, SectionReglages, LigneInterrupteur)

const T = (d, t = 16) => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONES = {
  faceid: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 15.5a3.5 3.5 0 0 0 5 0"/>',
  compte: '<circle cx="9" cy="8" r="3.6"/><path d="M2.8 20c.9-3.6 3.3-5.6 6.2-5.6 1.3 0 2.5.4 3.5 1.1M17 12.5a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2zM19 17l2.5 2.5M20.2 18.2l-1 1"/>',
  mondes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
  focus: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>',
  apparence: '<path d="M14.5 4.5 19.5 9.5 10 19H5v-5z"/><path d="m12.5 6.5 5 5"/>',
  iconeApp: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><path d="M12 10.2v1.8l1.2 1"/>', // D391
  carte: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',
  nouveautes: '<path d="M10 3.5 11.6 8.4 16.5 10 11.6 11.6 10 16.5 8.4 11.6 3.5 10 8.4 8.4z"/><path d="M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  aide: '<path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 17v.3"/>',
  avance: '<path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L20 12l-8 8-3-3 8-8 .9.9M4 4l5 5M3.5 7.5 7.5 3.5"/>',
  personne: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  nuage: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-8A6 6 0 0 0 6.6 9 4.8 4.8 0 0 0 7 18.5z"/><path d="m9.5 13.5 2 2 3.5-3.5"/>',
  nuageAlerte: '<path d="M7 18.5h10.5a4 4 0 0 0 .6-8A6 6 0 0 0 6.6 9 4.8 4.8 0 0 0 7 18.5z"/><path d="M12 11v3M12 16.3v.2"/>',
  envoi: '<circle cx="12" cy="12" r="8.5"/><path d="M12 16V8M8.5 11.5 12 8l3.5 3.5"/>',
  coche: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.5 2.5 4.5-5"/>',
  cloche: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>',
  onglet: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9h18M7 5v4"/>',
  main: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11M11 10.5V5a1.5 1.5 0 0 1 3 0v5.5M14 10.5V7a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.9-2.6L3.6 14a1.5 1.5 0 0 1 2.4-1.8L8 14.5"/>',
  son: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  vibration: '<rect x="8" y="3.5" width="8" height="17" rx="2"/><path d="M4.5 8v8M2 10v4M19.5 8v8M22 10v4"/>',
  livre: '<path d="M4 4.5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 4.5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
  coccinelle: '<path d="M12 6.5a6 6 0 0 1 6 6V15a6 6 0 0 1-12 0v-2.5a6 6 0 0 1 6-6zM12 6.5V21M9 4.5l1.5 2M15 4.5l-1.5 2M6.5 11H3M21 11h-3.5M6.2 16H3.5M20.5 16h-2.7"/>',
  lecture: '<circle cx="12" cy="12" r="8.5"/><path d="m10 8.5 5.5 3.5-5.5 3.5z"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/>',
  photoPlus: '<rect x="3" y="5" width="14" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/><path d="m17 15.5-4-4-7 7M20 3.5v5M17.5 6h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  exporter: '<path d="M12 3.5v11M8 7.5l4-4 4 4M5 13.5v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
  sortie: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 8l-4 4 4 4M5 12h11"/>',
  fermer: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  sceau: '<path d="m12 2.5 2.2 1.8 2.8-.3.9 2.7 2.5 1.4-.6 2.8 1.4 2.5-2 2 .1 2.8-2.8.6-1.5 2.4-2.6-1.1-2.7 1.1-1.4-2.4-2.8-.6.1-2.8-2-2 1.3-2.5-.6-2.8 2.5-1.4 1-2.7 2.7.3z"/><path d="m8.8 12.2 2.2 2.2 4.3-4.6"/>',
  retour: '<path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  // RNT-267 : les catégories de notifications (les symboles de l'iPhone, CategorieNotification.icone).
  notifs: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/><circle cx="18.5" cy="5.5" r="2.5"/>',
  banque: '<path d="M3 9.5 12 4l9 5.5zM5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/>',
  boites: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/>',
  marches: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  encheres: '<path d="M14.5 4.5l5 5-3 3-5-5zM12.5 8.5 4 17a1.4 1.4 0 0 0 2 2l8.5-8.5"/>',
  joueurs: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
  coups: '<path d="M4 5h7v6a3.5 3.5 0 0 1-7 0zM13 8h7v6a3.5 3.5 0 0 1-7 0zM6 9h.5M8.5 9h.5M15 12h.5M17.5 12h.5"/>',
  salaire: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 15h4"/>', // RNT-334 : la carte
  factures: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>', // 17/11
  biens: '<path d="M4 11l8-6 8 6v9H4z"/><path d="M10 20v-5h4v5"/>', // 17/11 : biens et véhicules
  repas: '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M16 3c-1.7 1-2.5 3-2.5 6s1 4 2.5 4v8"/>', // 17/11
  objectifs: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>', // 17/11
  couple: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', // 17/11 : couple et famille
  trajets: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>', // 17/11 : arrivées
  entourage: '<circle cx="12" cy="8" r="3"/><circle cx="5.5" cy="10" r="2.2"/><circle cx="18.5" cy="10" r="2.2"/><path d="M6.5 20c.8-3.3 2.9-5 5.5-5s4.7 1.7 5.5 5M2 18.5c.4-2 1.6-3.2 3.3-3.4M22 18.5c-.4-2-1.6-3.2-3.3-3.4"/>', // D444 : l'entourage
  course: '<path d="M5 21V4M5 4h13l-2.5 4L18 12H5"/>', // D445 : départ et résultat d'une manche
  monde: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5S14.5 17.9 12 20.5M12 3.5C9.5 6.1 8.4 8.9 8.4 12s1.1 5.9 3.6 8.5"/>',
  resume: '<path d="M4 13.5 6.5 5h11L20 13.5V19H4zM4 13.5h5a3 3 0 0 0 6 0h5"/>',
  lune: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
};

/** Une rubrique : la pastille colorée, le titre, ce qu'elle contient, le chevron. */
const rubrique = ({ icone, teinte, titre, resume, page, p = null }) => `
  <button class="rg-rubrique" data-action="ouvrir" data-page="${page}" ${p ? `data-p='${esc(JSON.stringify(p))}'` : ""}>
    <span class="rg-pastille" style="--c:${teinte}">${T(ICONES[icone] ?? icone, 15)}</span>
    <span class="rg-texte"><span class="rg-titre">${esc(titre)}</span><span class="rg-resume">${resume}</span></span>
    <span class="rg-chevron">${icones.chevron}</span></button>`;

/** Une ligne d'une page de réglages : icône discrète (ou pastille teintée), titre, détail, valeur ou chevron. */
function ligneReglage({ icone, teinte = "", titre, detail = "", valeur = "", action = "", page = "", donnees = "" }) {
  const ic = teinte ? `<span class="pastille rg-categorie" style="--c:${teinte}">${T(ICONES[icone] ?? icone, 16)}</span>` : `<span class="rg-icone">${T(ICONES[icone] ?? icone, 18)}</span>`;
  const corps = `${ic}<span class="rg-texte"><span class="rg-titre">${titre}</span>${detail ? `<span class="rg-detail">${detail}</span>` : ""}</span>
    ${valeur ? `<span class="rg-valeur">${valeur}</span>` : ""}${action || page ? `<span class="rg-chevron">${icones.chevron}</span>` : ""}`;
  if (page) return `<button class="rg-ligne" data-action="ouvrir" data-page="${page}" ${donnees}>${corps}</button>`;
  if (action) return `<button class="rg-ligne" data-action="${action}" ${donnees}>${corps}</button>`;
  return `<div class="rg-ligne">${corps}</div>`;
}

/** Un titre au-dessus d'une seule carte pour toutes les lignes, et un pied. */
const sectionReglages = (titre, contenu, pied = "") => `<section class="rg-section">
  ${titre ? `<h2 class="rg-section-titre">${esc(titre)}</h2>` : ""}<div class="carte rg-carte">${contenu}</div>${pied ? `<p class="rg-pied">${pied}</p>` : ""}</section>`;

const interrupteur = ({ icone, titre, detail, actif, action }) => `
  <button class="rg-ligne rg-interrupteur" role="switch" aria-checked="${actif}" data-action="${action}">
    <span class="rg-icone">${T(ICONES[icone], 18)}</span>
    <span class="rg-texte"><span class="rg-titre">${esc(titre)}</span>${detail ? `<span class="rg-detail">${esc(detail)}</span>` : ""}</span>
    <span class="rg-bascule" aria-hidden="true"></span></button>`;

const pageReglages = (titre, contenu) => `${entetePousse(titre)}<div class="rg-page">${contenu}</div>`;

/**
 * RNT-217 : « Toujours là ? » (ReglagesFocus de l'iPhone). Le réglage perso, sauf quand la règle du monde
 * privé où l'on joue (ou celle des mondes publics) l'emporte : l'interrupteur montre alors la règle, figé.
 */
function sectionPresence(ctx) {
  const impose = ctx?.etat.jeu?.controleImpose ?? null;
  const actif = impose ? impose.actif : controlePresenceActif();
  const ligne = `<button class="rg-ligne rg-interrupteur" role="switch" aria-checked="${actif}" data-action="basculerControle" ${impose ? 'aria-disabled="true" disabled' : ""}>
    <span class="rg-icone">${T(ICONES.main, 18)}</span>
    <span class="rg-texte"><span class="rg-titre">« Toujours là ? »</span><span class="rg-detail">Une ou deux questions pendant les sessions de 30 min et plus</span></span>
    <span class="rg-bascule" aria-hidden="true"></span></button>`;
  return sectionReglages("Présence", ligne, esc(textePresence(impose, actif)));
}

/** Le pied de « Présence » : les mots de ReglagesFocus.piedPresence (iPhone). */
function textePresence(impose, actif) {
  if (impose?.source === "monde") return `La règle de ton monde l'emporte : ${impose.actif ? `posé à tous, une question au plus toutes les ${impose.periode} min` : "coupé pour tous"}.`;
  if (impose) return "Dans les mondes publics, le contrôle reste posé à tous.";
  return actif ? "Sans réponse dans les 3 minutes, la session s'arrête, payée jusqu'à ta dernière réponse. Dans un monde privé, la règle du monde peut l'emporter."
    : "Coupé : tes sessions ne posent plus de question. Dans un monde privé, la règle du monde peut l'emporter.";
}

/** RNT-267, RNT-301 : un réglage de notifications changé, gardé au compte (et envoyé au serveur avec la sauvegarde). */
async function reglerNotif(ctx, d, f) {
  const r = structuredClone((await ctx.jouer("notifications.reglages", {}, { silencieux: true }).catch(() => null))?.reglages ?? d?.reglages ?? {});
  f(r);
  delete r.calme; // RNT-301 : plus d'heures calmes propres à Grind
  if (r.resume == null) delete r.resume;
  r.coupees = r.coupees ?? [];
  await ctx.jouer("notifications.regler", { reglages: r }, { silencieux: true });
  vibrer();
  ctx.sauvegarder?.();
  ctx.rafraichir();
}

// MARK: Ce que la page montre

/** D388 : plus de carte de membre en tête des réglages : seul le résumé des notifications est lu. */
async function donneesReglages(ctx) {
  const notifs = await ctx.jouer("notifications.reglages", {}, { silencieux: true }).catch(() => null);
  return { notifs };
}

// MARK: L'état de quelques pages

let sorte = "bug";
let capture = null; // { fichier, url } : la capture jointe à un retour
let envoye = false;
let codeVisible = false;
let codeCopie = false;
let envoi = { enCours: false, fait: false, message: "" };

const SORTES = [
  ["bug", "Un bug", ICONES.coccinelle, "Ce qui s'est passé, et ce que tu attendais. Où étais-tu dans l'app ?"],
  ["avis", "Un avis", '<path d="M3 5.5h11v7.5H8l-3.5 3v-3H3zM10 15.5h6l3.5 3v-3H21V8h-3"/>', "Ce qui te plaît, ce qui te gêne…"],
  ["idee", "Une idée", '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>', "Ce que tu aimerais voir dans Grind."],
];
const STATUTS = { nouveau: ["Envoyé", "t2"], vu: ["Lu", "alerte"], traite: ["Traité", "gain"] };

/** « il y a 2 min », comme `.relative(presentation: .named)`. */
function ilYa(t, maintenant) {
  const s = Math.max(0, Math.round((maintenant - t) / 1000));
  const rtf = new Intl.RelativeTimeFormat("fr-BE", { numeric: "auto" });
  if (s < 60) return rtf.format(-s, "second");
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  return rtf.format(-Math.round(s / 86400), "day");
}

// MARK: Les notifications au choix (RNT-267, D266 ; PageNotificationsReglages de l'iPhone)

/** Les mots des pieds, les mêmes que l'iPhone. RNT-301 : gardés au compte, sans partie aussi. */
const piedCategories = () =>
  "Coupée, une catégorie disparaît : ni notification, ni ligne dans la cloche. Une infraction et « Toujours là ? » pendant une session arrivent toujours. Gardé sur ton compte : l'iPhone et tous tes mondes suivent.";

function piedResume(categories) {
  const l = categories.filter((c) => c.active && c.mineures).map((c) => `${c.nom.toLowerCase()} (${c.mineures})`);
  return l.length ? `Attendent le résumé, à ton heure : ${l.join(", ")}.` : "Rien ne peut attendre dans les catégories gardées.";
}

/** Un interrupteur d'une catégorie (ou d'un réglage), qui écrit dans le compte (RNT-301). */
const basculeNotif = ({ icone, titre, detail, actif, cle }) => `
  <button class="rg-ligne rg-interrupteur" role="switch" aria-checked="${actif}" data-action="basculerNotif" data-cle="${esc(cle)}">
    <span class="rg-icone">${T(ICONES[icone] ?? ICONES.cloche, 18)}</span>
    <span class="rg-texte"><span class="rg-titre">${esc(titre)}</span>${detail ? `<span class="rg-detail">${esc(detail)}</span>` : ""}</span>
    <span class="rg-bascule" aria-hidden="true"></span></button>`;

function etatNotifications() {
  if (typeof Notification === "undefined") return "Non disponibles";
  return { granted: "Autorisées", denied: "Refusées" }[Notification.permission] ?? "À autoriser";
}

// MARK: Les pages

export const pages = {
  reglages: {
    titre: "Réglages",
    css: ["reglages", "compte", "enligne"], // lot A : css/pages/reglages.css, compte.css (accents) pour tout le fichier
    donnees: (ctx) => donneesReglages(ctx),
    rendu(d, ctx) {
      return pageReglages("Réglages", `
        <div class="carte rg-carte">
          ${rubrique({ icone: "compte", teinte: "#4F9BE8", titre: "Compte", resume: ctx.etat.horsLigne ? "Hors ligne : la partie reste ici" : ctx.etat.compte ? "Enregistré sur le serveur" : "À vérifier", page: "reglagesCompte" })}
          ${rubrique({ icone: "mondes", teinte: "#5B8DEF", titre: "Mes mondes", resume: "Où tu joues, en changer, créer, rejoindre", page: "mondes" })}
          ${rubrique({ icone: "focus", teinte: "#34C88A", titre: "Focus", resume: "L'onglet pendant la session, présence", page: "reglagesFocus" })}
          ${rubrique({ icone: "notifs", teinte: "#F26B5B", titre: "Notifications", resume: esc(d.notifs?.resume ?? "Toutes"), page: "reglagesNotifications" })}
          ${rubrique({ icone: "apparence", teinte: "#9D8CFF", titre: "Apparence", resume: "Mode économie, sons et vibrations", page: "reglagesApparence" })}
          ${rubrique({ icone: "carte", teinte: "#5B8DEF", titre: "Carte", resume: "Ce que les autres voient de toi", page: "reglagesCarte" })}
        </div>
        <div class="carte rg-carte">
          ${rubrique({ icone: "coccinelle", teinte: "#F26B5B", titre: "Signaler", resume: "Un bug, un avis, une idée", page: "retours" })}
          ${rubrique({ icone: "nouveautes", teinte: "#F0A04B", titre: "Nouveautés", resume: courante() ? `Version ${esc(courante().numero)} · ${esc(courante().titre)}` : "Ce qui change", page: "nouveautes" })}
          ${rubrique({ icone: "aide", teinte: "#86868F", titre: "Aide", resume: "Le guide, les tutoriels", page: "reglagesAide" })}
          ${rubrique({ icone: "avance", teinte: "#86868F", titre: "Avancé", resume: "Exporter ta partie, te déconnecter", page: "reglagesAvance" })}
        </div>`);
    },
  },

  // D388 (Arthur 16/11) : la page « Toi » (RNT-367) est retirée : elle ne faisait que renvoyer vers Personnaliser.

  // ── Compte : le serveur, la sauvegarde, le code de récupération ──────
  reglagesCompte: {
    titre: "Compte",
    donnees: async (ctx) => ({ devises: await ctx.tableau("devises").catch(() => null) }), // D377
    rendu(d, ctx) {
      const e = ctx.etat;
      const pseudo = e.compte?.pseudo || "Sans pseudo";
      const envoyee = Number(lireLocal("grind.versionEnvoyee") || 0);
      const enAttente = Number(lireLocal("grind.versionLocale") || 0) > envoyee;
      const code = lireLocal("grind.recuperation");
      return pageReglages("Compte", `
        ${sectionReglages("", `
          ${ligneReglage({ icone: "personne", teinte: "var(--equipe)", titre: esc(pseudo), detail: "Ton pseudo, unique sur Grind : il se change dans Profil › Personnaliser" })}
          ${ligneReglage({ icone: e.compte && !e.horsLigne ? "nuage" : "nuageAlerte", titre: e.horsLigne ? "Pas de connexion" : e.compte ? "Enregistré sur le serveur" : "Pas encore vérifié",
            detail: e.horsLigne ? "Ta partie reste dans ce navigateur en attendant" : e.compte ? "Ce navigateur tient ton compte" : "Il se vérifie dès que tu es en ligne" })}`,
          "Ta partie part sur le serveur après chaque action. Un seul appareil tient ton compte à la fois.")}
        ${sectionReglages("Sauvegarde", `
          ${ligneReglage({ icone: enAttente ? "nuageAlerte" : "envoi", titre: envoyee ? `Envoyée ${esc(ilYa(envoyee, ctx.maintenant()))}` : "Pas encore envoyée",
            detail: enAttente ? "Des changements attendent le prochain envoi" : "Dernier envoi réussi" })}
          <button class="rg-ligne rg-envoyer" data-action="envoyerMaintenant" ${envoi.enCours || e.horsLigne || !e.compte ? "disabled" : ""}>
            <span class="rg-icone">${T(envoi.fait ? ICONES.coche : ICONES.exporter, 18)}</span>
            <span class="rg-texte"><span class="rg-titre">${envoi.enCours ? "Envoi…" : envoi.fait ? "Envoyé" : "Envoyer maintenant"}</span></span>
            ${/* D353 : le cercle de la vidéo 1, comme sur l'iPhone (plus la roue grise). */""}${envoi.enCours ? iconeAnimee("chargement", { taille: 18 }) : ""}</button>
          ${envoi.message ? `<p class="rg-note">${esc(envoi.message)}</p>` : ""}`,
          "Si l'envoi échoue, la raison s'affiche ici. Ta partie reste dans ce navigateur en attendant.")}
        ${/* D363 (Arthur, 15/11) : confirmer les gros paiements, et à partir de combien (le même réglage que l'iPhone). */""}
        ${sectionReglages("Paiements", `
          ${interrupteur({ icone: "faceid", titre: "Confirmer les gros paiements", detail: "Ta clé d'accès (Touch ID, Face ID, Windows Hello), sinon un second toucher", actif: FID.faceIDActif(), action: "basculerFaceID" })}
          ${FID.faceIDActif() ? `<div class="reglage-segment">${segment(FID.SEUILS.map((c) => [String(c), c === 0 ? "Par défaut" : c === 1 ? "Toujours" : montant(c)]), String(FID.seuilChoisi()), "choisirSeuilFaceID")}</div>` : ""}`,
          FID.faceIDActif() ? `À partir de ${esc(FID.nomSeuil(FID.seuilChoisi(), montant))}, chaque paiement et chaque virement se confirme.` : "Coupé : tes paiements partent sans confirmation, quel que soit le montant.")}
        ${/* D377 : la devise du patrimoine et des classements (par défaut, celle du pays de résidence). */""}
        ${d?.devises ? sectionReglages("Devise", `<label class="rg-ligne"><span class="rg-texte"><span class="rg-titre">Afficher en</span></span>
            <select class="champ rg-devise" data-saisie="choisirDevise" aria-label="Devise d'affichage">
              <option value="" ${d.devises.choisie ? "" : "selected"}>Celle de mon pays (${esc(d.devises.residence)})</option>
              ${d.devises.devises.map((x) => `<option value="${esc(x.code)}" ${x.code === d.devises.choisie ? "selected" : ""}>${esc(x.symbole)} ${esc(x.nom)}</option>`).join("")}
            </select></label>`,
          `Ton patrimoine et les classements s'affichent dans cette devise, au taux du jour. Par défaut : celle de ton pays de résidence (${esc(d.devises.residence)}).`) : ""}
        ${code ? sectionReglages("Code de récupération", `<div class="rg-code">
            <span class="rg-code-valeur code" aria-live="polite">${codeVisible ? esc(serveur.espacer(code)) : "•••• •••• ••••"}</span>
            <span class="rangee"><button class="petit" data-action="voirCode">${codeVisible ? "Masquer" : "Afficher"}</button>
              <button class="petit" data-action="copierCode">${codeCopie ? "Copié" : "Copier"}</button></span></div>`,
          "Avec ton pseudo, il ramène tes parties sur un autre appareil ; celui-ci est alors déconnecté.") : ""}`);
    },
    actions: {
      voirCode(ctx) { codeVisible = !codeVisible; ctx.redessiner(); },
      basculerFaceID(ctx) { FID.basculerFaceID(); vibrer(); ctx.redessiner(); }, // D363
      choisirSeuilFaceID(ctx, b) { FID.choisirSeuil(b.dataset.valeur); vibrer(); ctx.redessiner(); },
      async choisirDevise(ctx, el) { await ctx.decider("banque", { deviseAffichage: { _0: el.value || null } }, { succes: "Devise d'affichage changée" }); }, // D377
      async copierCode(ctx) {
        try { await navigator.clipboard.writeText(lireLocal("grind.recuperation")); codeCopie = true; ctx.redessiner(); } catch { ctx.toast("La copie n'est pas permise ici.", "refus"); }
      },
      async envoyerMaintenant(ctx) {
        envoi = { enCours: true, fait: false, message: "" };
        ctx.redessiner();
        try {
          await ctx.sauvegarder();
          await ctx.etat.envoi;
          const ok = Number(lireLocal("grind.versionEnvoyee") || 0) >= Number(lireLocal("grind.versionLocale") || 0);
          envoi = { enCours: false, fait: ok, message: ok ? "" : "Pas envoyée : le serveur n'a pas répondu. Elle repartira à la prochaine action." };
          if (ok) vibrer(12);
        } catch (e) { envoi = { enCours: false, fait: false, message: `Pas envoyée : ${e.message}` }; }
        ctx.redessiner();
      },
    },
  },

  // ── Focus ───────────────────────────────────────────────────────────
  reglagesFocus: {
    titre: "Focus",
    donnees: async () => ({}),
    rendu: (d, ctx) => pageReglages("Focus", `
      ${sectionPresence(ctx)}
      ${sectionReglages("Pendant la session", `
        ${ligneReglage({ icone: "cloche", teinte: "var(--vente)", titre: "Notifications", detail: "Les avis du monde en ligne, même l'onglet en arrière-plan", valeur: esc(etatNotifications()),
          action: typeof Notification !== "undefined" && Notification.permission === "default" ? "demanderNotifications" : "" })}
        ${ligneReglage({ icone: "onglet", teinte: "var(--controles)", titre: "Quitter l'onglet", detail: "Pendant un focus, c'est ouvrir une app interdite : le compte à rebours part" })}`,
      "Sur l'iPhone, Temps d'écran surveille tes apps ; ici, c'est l'onglet de Grind qui compte. Reviens avant la fin du compte à rebours et rien ne se passe.")}`),
    actions: {
      async demanderNotifications(ctx) { try { await Notification.requestPermission(); } catch {} ctx.redessiner(); },
      basculerControle(ctx) { if (ctx.etat.jeu?.controleImpose) return; basculerControlePresence(); vibrer(); ctx.redessiner(); },
    },
  },

  // ── Notifications : un interrupteur par catégorie, le résumé (RNT-267) ; au compte (RNT-301) ─
  reglagesNotifications: {
    titre: "Notifications",
    async donnees(ctx) { return (await ctx.jouer("notifications.reglages", {}, { silencieux: true }).catch(() => null)) ?? { categories: [], reglages: {} }; },
    rendu(d) {
      const r = d.reglages ?? {};
      return pageReglages("Notifications", `
        ${sectionReglages("", ligneReglage({ icone: "cloche", teinte: "var(--vente)", titre: "Autorisation", detail: "Les notifications de Grind dans ce navigateur", valeur: esc(etatNotifications()),
          action: typeof Notification !== "undefined" && Notification.permission === "default" ? "demanderNotifications" : "" }))}
        ${sectionReglages("Catégories", (d.categories ?? []).map((c) => basculeNotif({ icone: c.id, titre: c.nom, detail: c.detail, actif: c.active, cle: c.id })).join(""), esc(piedCategories()))}
        ${sectionReglages("Résumé groupé", basculeNotif({ icone: "resume", titre: "Résumé matin et soir", detail: "À 8 h et à 19 h, ce qui peut attendre arrive ensemble", actif: r.resume === true, cle: "resume" }),
          esc(piedResume(d.categories ?? [])))}
        ${sectionReglages("Heures calmes", ligneReglage({ icone: "lune", teinte: "var(--image)", titre: "Mode Concentration", detail: "Celui de ton appareil fait foi" }),
          "Grind suit le mode Concentration ou Sommeil de ton appareil : rien ne sonne pendant, sauf l'infraction et « Toujours là ? » d'une session en cours.")}`);
    },
    actions: {
      async demanderNotifications(ctx) { try { await Notification.requestPermission(); } catch {} ctx.redessiner(); },
      async basculerNotif(ctx, b, d) { await reglerNotif(ctx, d, (r) => {
        const cle = b.dataset.cle;
        if (cle === "resume") r.resume = r.resume === true ? null : true;
        else r.coupees = (r.coupees ?? []).includes(cle) ? r.coupees.filter((x) => x !== cle) : [...(r.coupees ?? []), cle];
      }); },
    },
  },

  // ── Apparence : mode économie, sons, vibrations (RNT-367 : l'accent est dans Personnaliser) ──
  reglagesApparence: {
    titre: "Apparence",
    async donnees() { return {}; },
    rendu() {
      return pageReglages("Apparence", `
        ${/* D391 : l'icône se choisit dans Personnaliser mon profil, seulement (pas de second chemin). */""}
        ${sectionReglages("Mode économie", `<div class="reglage-segment">${segment(CHOIX_ECONOMIE.map((c) => [c.id, c.nom]), choixEconomie(), "choisirEconomie", { defilant: false })}</div>`,
          piedEconomie())}
        ${sectionReglages("Sons et vibrations", `
          ${interrupteur({ icone: "son", titre: "Sons", detail: "L'argent qui rentre, les achats, les signatures, les grands moments", actif: sonsActifs(), action: "basculerSons" })}
          ${interrupteur({ icone: "vibration", titre: "Vibrations", detail: "Assorties à chaque son, sur les téléphones qui vibrent", actif: vibrationsActives(), action: "basculerVibrations" })}`,
          "Le son de l'appareil coupé coupe aussi les sons du jeu.")}`);
    },
    actions: {
      choisirEconomie(ctx, b) { choisirEconomie(b.dataset.valeur); vibrer(); ctx.redessiner(); }, // RNT-261
      ...actionsReglagesSons, // lot A : basculerSons (on entend ce qu'on allume), basculerVibrations
    },
  },

  // ── Carte : les calques, et ce que les autres voient de toi (RNT-185) ─
  reglagesCarte: {
    titre: "Carte",
    async donnees(ctx) { let monde = null; try { monde = await ctx.tableau("monde"); } catch {} return { monde }; },
    rendu(d) {
      // D351 : les calques se règlent sur la carte seulement (son bouton « Filtres ») ; ici, ce que les autres voient de toi.
      return pageReglages("Carte", `
        ${d.monde ? sectionReglages("Les autres te voient", `<div class="rg-interieur">${segment([["invisible", "Invisible"], ["ville", "La ville"], ["lieu", "Le lieu du jeu"]], d.monde.maVisibilite, "visibiliteCarte")}</div>`,
          { invisible: "Personne ne te voit sur la carte.", ville: "Les autres voient seulement ta ville.", lieu: "Les autres voient le lieu du jeu où tu es (jamais ta vraie position)." }[d.monde.maVisibilite] ?? "") : ""}
        ${sectionReglages("Ce que la carte montre", ligneReglage({ icone: "carte", teinte: "#5B8DEF", titre: "Ouvrir la carte", detail: "L'onglet Carte", page: "monde" }),
          "Les calques et les lieux se choisissent sur la carte, avec son bouton « Filtres ».")}`);
    },
    actions: {
      async visibiliteCarte(ctx, b) {
        const precision = { invisible: "cachee", ville: "ville", lieu: "exacte" }[b.dataset.valeur];
        await ctx.commande("carte.visibilite", { precision }, { succes: "Réglage de la carte enregistré", fermer: false });
      },
    },
  },

  // ── Aide : le guide, écrire à Grind, les tutoriels, tes données, crédits ─
  reglagesAide: {
    titre: "Aide",
    donnees: async () => ({}),
    rendu: () => pageReglages("Aide", `
      ${sectionReglages("", `
        ${ligneReglage({ icone: "livre", titre: "Le guide", detail: "Tout le jeu, par thème", page: "guide" })}`)}
      ${sectionReglages("Tutoriels", ORDRE_TUTORIELS.map((s) => ligneReglage({ icone: "lecture", titre: esc(SUJETS[s].titre), action: "tutoriel", donnees: `data-sujet="${s}"` })).join(""))}
      ${sectionReglages("Tes données", `<p class="rg-interieur aide">Tes parties sont enregistrées sur le serveur du jeu, avec ton pseudo. Dans un monde en ligne, ton profil (pseudo, patrimoine, boîtes, biens, positions) est visible des joueurs de ce monde. Les cours de bourse sont simulés, les mêmes pour tous.</p>`)}
      ${sectionReglages("", ligneReglage({ icone: "photo", teinte: "var(--image)", titre: "Crédits", detail: "Icônes et photos, sous licence libre", action: "creditsPhotos" }))}`),
    actions: {
      tutoriel: (ctx, b) => ouvrirAide(ctx, b.dataset.sujet),
      creditsPhotos(ctx) {
        // Les photos du web arrivent avec le lot D (web/photos) ; d'ici là, tout est dessiné.
        const credits = window.__creditsPhotos ?? [];
        // D353 : les icônes du jeu (la même liste sur l'iPhone, CreditIcones).
        const icones = [
          { nom: "Reicon", detail: "Les icônes du jeu, licence MIT", lien: "github.com/dqev/reicon", source: "https://github.com/dqev/reicon" },
          { nom: "Solar Icons", detail: "Le dessin d'origine de Reicon, par 480 Design, licence CC BY 4.0", lien: "Solar Icons sur Figma", source: "https://www.figma.com/community/file/1166831539721848736" },
        ];
        ctx.feuille({
          titre: "Crédits",
          contenu: `<h3 class="rg-credits-t">Icônes</h3><div class="carte rg-carte">${icones.map((c) => `<div class="rg-credit"><b>${c.nom}</b><span class="aide">${c.detail}</span>
              <a class="rg-lien" href="${c.source}" target="_blank" rel="noopener">${c.lien}</a></div>`).join("")}</div>
            <h3 class="rg-credits-t">Photos</h3>` + (credits.length ? `<div class="carte rg-carte">${credits.map((c) => `<div class="rg-credit"><b>${esc(c.nom)}</b><span class="aide">${esc(c.auteur)}, ${esc(c.licence)}</span>
              ${c.source ? `<a class="rg-lien" href="${esc(c.source)}" target="_blank" rel="noopener">Source sur Wikimedia Commons</a>` : ""}</div>`).join("")}</div>`
            : `<p class="aide">Aucune photo livrée pour l’instant : véhicules et biens sont dessinés.</p>`),
        });
      },
    },
  },

  // ── Avancé : exporter, se déconnecter, la version ───────────────────
  reglagesAvance: {
    titre: "Avancé",
    donnees: async () => ({}),
    rendu: () => pageReglages("Avancé", `
      ${sectionReglages("", ligneReglage({ icone: "exporter", teinte: "var(--equipe)", titre: "Exporter ma partie", detail: "Un fichier JSON, à garder ou à joindre à un retour", action: "exporter" }))}
      ${sectionReglages("", ligneReglage({ icone: "sortie", teinte: "var(--c-danger)", titre: "Me déconnecter de ce navigateur", action: "oublier" }),
        "Ta partie reste sur le serveur ; tu la reprends avec ton pseudo et ton code de récupération. Tes couleurs restent dans ce navigateur.")}
      ${sectionReglages("", ligneReglage({ icone: "avance", teinte: "var(--texte2)", titre: "Administration", detail: "Réservée au développeur, sous code", page: "admin" }))}
      <div class="rg-version"><span>Version</span><span class="chiffres">${esc(courante()?.numero ?? "web")}</span></div>`),
    actions: {
      async exporter(ctx) {
        const r = await ctx.jouer("exporter");
        if (!r) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(r.sauvegarde, null, 2)], { type: "application/json" }));
        a.download = `grind-${new Date(ctx.maintenant()).toISOString().slice(0, 10)}.json`;
        a.click();
      },
      async oublier(ctx) {
        const oui = await confirmer({ titre: "Te déconnecter de ce navigateur ?", texte: "Ta partie reste sur le serveur ; tu la reprends avec ton pseudo et ton code de récupération.", oui: "Me déconnecter", danger: true });
        if (!oui) return;
        serveur.identite.oublier();
        ["grind.sauvegarde", "grind.versionLocale", "grind.versionEnvoyee", "grind.recuperation"].forEach((k) => { try { localStorage.removeItem(k); } catch {} });
        location.reload();
      },
    },
  },

  // ── Écrire à Grind (EcranRetours, RNT-156) ──────────────────────────
  retours: {
    titre: "Signaler",
    async donnees(ctx) {
      let retours = [];
      if (ctx.etat.compte) { try { retours = await serveur.mesRetours(); } catch {} }
      return { retours };
    },
    rendu(d, ctx) {
      const s = SORTES.find((x) => x[0] === sorte) ?? SORTES[0];
      const formulaire = `
        <div class="rg-sortes" role="radiogroup" aria-label="Ce que tu veux dire">${SORTES.map(([id, nom, icone]) =>
          `<button role="radio" data-action="sorteRetour" data-sorte="${id}" aria-pressed="${id === sorte}" aria-checked="${id === sorte}">${T(icone, 20)}<span>${esc(nom)}</span></button>`).join("")}</div>
        <textarea class="champ rg-texte-retour" id="retour" maxlength="4000" placeholder="${esc(s[3])}" aria-label="Ton message"></textarea>
        ${champCapture()}
        <p class="rg-mention">${T(ICONES.info, 14)}<span>Envoyé avec ton pseudo, la version du jeu, ton navigateur, ton profil et ton jour de saison, pour qu'on retrouve le problème.</span></p>
        ${bouton("Envoyer", "envoyerRetour", { desactive: !ctx.etat.compte })}`;
      const merci = `<div class="rg-merci">
        <span class="gain">${T(ICONES.sceau, 44)}</span>
        <h2>Merci, c'est envoyé.</h2><p class="aide">Tu verras sa suite ici, dans « Tes retours ».</p>
        ${bouton("Écrire autre chose", "autreRetour", { genre: "secondaire" })}</div>`;
      return `${entetePousse("Signaler")}<div class="rg-page rg-retours">
        ${envoye ? merci : formulaire}
        ${d.retours.length ? `<section class="rg-bloc"><h2 class="libelle">Tes retours</h2>${d.retours.slice(0, 12).map((r) => {
          const [nomS, iconeS] = (SORTES.find((x) => x[0] === r.sorte) ?? [r.sorte, r.sorte, ICONES.info]).slice(1);
          const [statut, ton] = STATUTS[r.statut] ?? [r.statut, "t2"];
          return `<article class="rg-retour">
            <div class="rangee entre"><span class="rg-retour-sorte">${T(iconeS, 12)}${esc(nomS)}</span><span class="rg-retour-statut ${ton}">${esc(statut)}</span></div>
            <p>${esc(r.texte)}</p>
            ${r.reponse ? `<div class="rg-reponse">${T(ICONES.retour, 12)}<span>${esc(r.reponse)}</span></div>` : ""}
            ${r.cree ? `<time class="rg-date">${esc(new Date(r.cree).toLocaleString("fr-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))}</time>` : ""}
          </article>`;
        }).join("")}</section>` : ""}
      </div>`;
    },
    actions: {
      sorteRetour(ctx, b) { sorte = b.dataset.sorte; vibrer(); ctx.redessiner(); },
      autreRetour(ctx) { envoye = false; retirerCapture(); ctx.redessiner(); },
      captureChoisie(ctx, el) {
        const f = el.files?.[0];
        retirerCapture();
        if (f) capture = { fichier: f, url: URL.createObjectURL(f) };
        ctx.redessiner();
      },
      retirerCapture(ctx) { retirerCapture(); ctx.redessiner(); },
      async envoyerRetour(ctx, b, d, p) {
        const texte = (document.getElementById("retour")?.value ?? "").trim();
        if (texte.length < 3) return ctx.toast("Écris au moins quelques mots.", "refus");
        b.disabled = true;
        b.textContent = "…";
        try {
          const image = capture ? await reduireImage(capture.fichier) : "";
          const a = ctx.etat.jeu?.accueil;
          await serveur.envoyerRetour({
            sorte, texte, capture: image,
            // RNT-378 : la version et l'écran d'où il écrit, lus dans la console d'administration.
            contexte: { plateforme: "web", version: courante()?.numero ?? "web", navigateur: navigator.userAgent, profil: a?.profil ?? "", jour: String(a?.jour ?? ""),
              origine: p?.origine ?? "Réglages › Signaler", partie: L.monde?.code ? `en ligne (${L.monde.code})` : "solo" },
          });
          envoye = true;
          retirerCapture();
          vibrer(12);
          await ctx.rafraichir();
        } catch (e) {
          ctx.toast(`Pas envoyé : ${e.message}`, "refus");
          b.disabled = false;
          b.textContent = "Envoyer";
        }
      },
    },
  },
};

/** Le champ « Joindre une capture d'écran » (champFichier du lot A, en français), puis l'aperçu de la capture choisie. */
function champCapture() {
  if (capture) {
    return `<div class="rg-capture">
      <img src="${esc(capture.url)}" alt="La capture jointe">
      <span class="rg-texte"><span class="rg-titre">Capture jointe</span><span class="rg-detail">Réduite avant l'envoi</span></span>
      <button class="rg-retirer" data-action="retirerCapture" aria-label="Retirer la capture">${T(ICONES.fermer, 22)}</button></div>`;
  }
  return champFichier("capture", { etiquette: "Joindre une capture d'écran", aide: "Facultatif · PNG ou JPEG, réduite avant l'envoi", saisie: "captureChoisie" });
}

function retirerCapture() {
  if (capture?.url) URL.revokeObjectURL(capture.url);
  capture = null;
}

/** Ce que le mode en ligne voit de moi change : on le publie tout de suite (pseudo, cosmétiques). */
function publier(ctx) {
  if (L.monde.code && ctx.etat.compte && !ctx.etat.horsLigne) L.synchroniser(ctx, { force: true }).catch(() => {});
}

/** Une capture réduite en JPEG (1 280 px, ~400 Ko au plus), en base64, comme sur l'iPhone. */
async function reduireImage(fichier) {
  const img = await createImageBitmap(fichier);
  const f = Math.min(1, 1280 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * f);
  c.height = Math.round(img.height * f);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  for (const q of [0.8, 0.6, 0.45, 0.3]) {
    const url = c.toDataURL("image/jpeg", q);
    if (url.length < 540_000) return url.split(",")[1];
  }
  return "";
}
