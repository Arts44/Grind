// ══════════════════════════════════════════════════════════════════════
//  Réglages (EcransReglages.swift, RNT-86), comme sur l'iPhone : une page
//  courte, la carte de membre (elle ouvre « Toi » : pseudo, avatar, titre,
//  cadre), puis des rubriques qui ouvrent chacune leur page :
//    Compte, Mes mondes, Focus, Apparence, Carte ; Nouveautés, Aide, Avancé.
//  Écrire à Grind (EcranRetours) a sa page, avec l'aperçu de la capture.
//
//  Ce qui n'a pas de sens dans un navigateur n'y est pas : l'icône de
//  l'app, la Live Activity, les apps surveillées par Raccourcis (sur le
//  web, quitter l'onglet compte comme une app interdite : la page Focus
//  le dit).
// ══════════════════════════════════════════════════════════════════════
import * as Z from "../cosmetiques.js"; // RNT-231 : ta carte de membre habillée
import { esc, montant } from "../format.js";
import { entetePousse, bouton, segment, icones, confirmer, champFichier } from "../ui.js";
import { sonsActifs, vibrationsActives, vibrer, actionsReglagesSons } from "../sons.js"; // lot A : Sons et vibrations
import { CHOIX_ECONOMIE, choixEconomie, choisirEconomie, piedEconomie } from "../economie.js"; // RNT-261 : le mode économie
import { CALQUES_DEFAUT, calquesActifs, basculerCalque } from "./carte.js";
import * as serveur from "../serveur.js";
import * as L from "../enligne.js";
import { courante } from "./nouveautes.js";
import { listeRecompenses } from "./profil.js";
import { SUJETS, ORDRE_TUTORIELS } from "../aide-donnees.js";
import { ouvrirAide } from "../aide.js";
import {
  avatarJoueur, svgSymbole, LISTE_SYMBOLES, TEINTES, hex, symboleChoisi, teinteChoisie, choisirSymbole, choisirTeinte,
  accentChoisi, accentsDisponibles, choisirAccent, membreDepuis, CLES, controlePresenceActif, basculerControlePresence,
} from "../compte-local.js";

const lireLocal = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const ecrireLocal = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

// MARK: Petites briques (RubriqueReglages, LigneReglage, SectionReglages, LigneInterrupteur)

const T = (d, t = 16) => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONES = {
  compte: '<circle cx="9" cy="8" r="3.6"/><path d="M2.8 20c.9-3.6 3.3-5.6 6.2-5.6 1.3 0 2.5.4 3.5 1.1M17 12.5a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2zM19 17l2.5 2.5M20.2 18.2l-1 1"/>',
  mondes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
  focus: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>',
  apparence: '<path d="M14.5 4.5 19.5 9.5 10 19H5v-5z"/><path d="m12.5 6.5 5 5"/>',
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

// MARK: La carte de membre (CarteMembre)

function carteMembre(ctx, d, { lien = true } = {}) {
  const pseudo = ctx.etat.compte?.pseudo || L.avatarLocal(ctx).pseudo || "";
  const record = d?.profil?.meilleurScore;
  const ville = d?.ville;
  const depuis = membreDepuis(ctx.maintenant());
  const date = new Date(depuis).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });
  const h = Z.habillageMembre(Z.equipement());
  const corps = `${h.banniere}
    <span class="cl-membre-haut">${embleme()}<span class="cl-mot">Membre</span>${avatarJoueur(52)}</span>
    <span class="cl-membre-pseudo ${h.pseudo}">${esc(pseudo || "Choisis un pseudo")}</span>
    <span class="cl-membre-bas"><span>${ville ? `${esc(ville.drapeau)} ${esc(ville.nom)}` : "Aucune saison"}</span>
      <span class="chiffres">${record != null ? `Record ${esc(montant(record))}` : "Pas encore de record"}</span></span>
    <span class="cl-membre-depuis">${d?.installation ? esc(d.installation) : `Membre depuis le ${esc(date)}`}</span>`;
  return lien
    ? `<button class="cl-membre ${h.classe}" ${h.style} data-action="ouvrir" data-page="compte" aria-label="Ta carte de membre : ${esc(pseudo)}. Pseudo, avatar, titre et cadre">${corps}</button>`
    : `<div class="cl-membre ${h.classe}" ${h.style} role="img" aria-label="Ta carte de membre : ${esc(pseudo)}">${corps}</div>`;
}

const embleme = () => `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
  <defs><linearGradient id="rg-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4E3B0"/><stop offset="1" stop-color="#B78A3B"/></linearGradient></defs>
  <circle cx="12" cy="12" r="11.5" fill="url(#rg-or)"/><circle cx="12" cy="12" r="8.6" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".8"/>
  <text x="12" y="16.3" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="12.5" fill="rgba(0,0,0,.55)">G</text></svg>`;

/** Ce que la carte de membre montre : le record (TableauProfil) et la ville avec son drapeau (TableauVille). */
async function donneesMembre(ctx) {
  const [profil, ville, installation] = await Promise.all([ctx.tableau("profil").catch(() => null), ctx.tableau("ville").catch(() => null),
    ctx.tableau("installation").catch(() => null)]);
  // RNT-226 : l'installation en cours remplace « Membre depuis », comme sur l'iPhone.
  return { profil, ville, installation: installation?.texte ?? null };
}

// MARK: L'état de quelques pages

let sorte = "bug";
let capture = null; // { fichier, url } : la capture jointe à un retour
let envoye = false;
let codeVisible = false;
let codeCopie = false;
let erreurPseudo = "";
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

function etatNotifications() {
  if (typeof Notification === "undefined") return "Non disponibles";
  return { granted: "Autorisées", denied: "Refusées" }[Notification.permission] ?? "À autoriser";
}

// MARK: Les pages

export const pages = {
  reglages: {
    titre: "Réglages",
    css: ["reglages", "compte"], // lot A : css/pages/reglages.css, compte.css (avatar, accents) pour tout le fichier
    donnees: (ctx) => donneesMembre(ctx),
    rendu(d, ctx) {
      const a = accentChoisi();
      return pageReglages("Réglages", `
        ${carteMembre(ctx, d)}
        <div class="carte rg-carte">
          ${rubrique({ icone: "compte", teinte: "#4F9BE8", titre: "Compte", resume: ctx.etat.horsLigne ? "Hors ligne : la partie reste ici" : ctx.etat.compte ? "Enregistré sur le serveur" : "À vérifier", page: "reglagesCompte" })}
          ${rubrique({ icone: "mondes", teinte: "#5B8DEF", titre: "Mes mondes", resume: "Où tu joues, en changer, créer, rejoindre", page: "mondes" })}
          ${rubrique({ icone: "focus", teinte: "#34C88A", titre: "Focus", resume: "Notifications, l'onglet pendant la session", page: "reglagesFocus" })}
          ${rubrique({ icone: "apparence", teinte: "#9D8CFF", titre: "Apparence", resume: `Accent ${esc(a.nom.toLowerCase())}, sons`, page: "reglagesApparence" })}
          ${rubrique({ icone: "carte", teinte: "#5B8DEF", titre: "Carte", resume: "Calques, ce que les autres voient", page: "reglagesCarte" })}
        </div>
        <div class="carte rg-carte">
          ${rubrique({ icone: "nouveautes", teinte: "#F0A04B", titre: "Nouveautés", resume: courante() ? `Version ${esc(courante().numero)} · ${esc(courante().titre)}` : "Ce qui change", page: "nouveautes" })}
          ${rubrique({ icone: "aide", teinte: "#86868F", titre: "Aide", resume: "Le guide, écrire à Grind, tutoriels", page: "reglagesAide" })}
          ${rubrique({ icone: "avance", teinte: "#86868F", titre: "Avancé", resume: "Exporter ta partie, te déconnecter", page: "reglagesAvance" })}
        </div>`);
    },
  },

  // ── Toi : pseudo, avatar, titre, cadre (EcranCompte) ─────────────────
  compte: {
    titre: "Toi",
    async donnees(ctx) {
      const [m, r] = await Promise.all([donneesMembre(ctx), ctx.tableau("recompenses").catch(() => null)]);
      return { ...m, r };
    },
    rendu(d, ctx) {
      const symbole = symboleChoisi(), teinte = teinteChoisie();
      const r = d.r;
      const choix = (titre, aide, sorteR, liste, cle) => `<section class="rg-bloc"><h2 class="libelle">${titre}</h2><p class="aide">${aide}</p>
        ${listeRecompenses(sorteR, [{ id: "", nom: "Aucun", gagne: true, condition: "" }, ...liste], lireLocal(cle))}</section>`;
      return `${entetePousse("Toi")}<div class="rg-page">
        ${carteMembre(ctx, d, { lien: false })}
        <section class="rg-bloc">
          <label class="libelle" for="pseudo-compte">Pseudo</label>
          <form class="rg-pseudo">
            <input class="champ" id="pseudo-compte" maxlength="20" autocomplete="nickname" autocapitalize="off" spellcheck="false"
              value="${esc(ctx.etat.compte?.pseudo ?? "")}" placeholder="Ton nom dans le jeu" enterkeyhint="done" ${ctx.etat.compte ? "" : "disabled"}>
            <button class="petit plein" data-action="enregistrerPseudo" ${ctx.etat.compte ? "" : "disabled"}>OK</button>
          </form>
          ${erreurPseudo ? `<p class="rg-erreur">${esc(erreurPseudo)}</p>` : `<p class="aide">Unique sur Grind. Valide avec OK ou la touche Entrée.</p>`}
        </section>
        <section class="rg-bloc">
          <h2 class="libelle">Avatar</h2>
          <div class="cl-symboles" role="radiogroup" aria-label="Symbole de l'avatar">${LISTE_SYMBOLES.map((s) =>
            `<button role="radio" data-action="choisirSymbole" data-symbole="${s}" aria-pressed="${s === symbole}" aria-checked="${s === symbole}" aria-label="${esc(s)}">${svgSymbole(s, 18)}</button>`).join("")}</div>
          <div class="cl-teintes" role="radiogroup" aria-label="Teinte de l'avatar">${TEINTES.map((t, i) =>
            `<button role="radio" data-action="choisirTeinte" data-teinte="${i}" aria-pressed="${i === teinte}" aria-checked="${i === teinte}" aria-label="Teinte ${i + 1}" style="--c:${hex(t)}"><i></i></button>`).join("")}</div>
        </section>
        ${r ? `${choix("Titre", "Affiché à côté de ton pseudo, pour les joueurs de ton monde.", "titre", r.titres, CLES.titre)}
               ${choix("Cadre de profil", "Autour de ton avatar, visible des autres joueurs.", "cadre", r.cadres, CLES.cadre)}` : ""}
      </div>`;
    },
    actions: {
      choisirSymbole(ctx, b) { choisirSymbole(b.dataset.symbole); vibrer(); publier(ctx); ctx.redessiner(); },
      choisirTeinte(ctx, b) { choisirTeinte(b.dataset.teinte); vibrer(); publier(ctx); ctx.redessiner(); },
      choisirRecompense(ctx, b) { ecrireLocal(b.dataset.sorte === "cadre" ? CLES.cadre : CLES.titre, b.dataset.id); vibrer(); publier(ctx); ctx.redessiner(); },
      /** Le pseudo est unique sur le serveur : on le change là d'abord (ModeleCompte.changerPseudo). */
      async enregistrerPseudo(ctx) {
        const p = (document.getElementById("pseudo-compte")?.value ?? "").trim();
        if (p === ctx.etat.compte?.pseudo) return;
        erreurPseudo = "";
        if (p.length < 2 || p.length > 20) { erreurPseudo = "De 2 à 20 caractères."; return ctx.redessiner(); }
        const code = lireLocal("grind.recuperation");
        if (!code) { erreurPseudo = "Ton compte n'est pas encore créé."; return ctx.redessiner(); }
        try {
          const c = await serveur.creerCompte(p, code);
          ctx.etat.compte = { ...ctx.etat.compte, pseudo: c.pseudo };
          ctx.toast("Pseudo enregistré", "gain");
          publier(ctx);
        } catch (e) {
          erreurPseudo = e.message;
          const champ = document.getElementById("pseudo-compte");
          if (champ) champ.value = ctx.etat.compte?.pseudo ?? "";
        }
        ctx.redessiner();
      },
    },
  },

  // ── Compte : le serveur, la sauvegarde, le code de récupération ──────
  reglagesCompte: {
    titre: "Compte",
    donnees: async () => ({}),
    rendu(d, ctx) {
      const e = ctx.etat;
      const pseudo = e.compte?.pseudo || "Sans pseudo";
      const envoyee = Number(lireLocal("grind.versionEnvoyee") || 0);
      const enAttente = Number(lireLocal("grind.versionLocale") || 0) > envoyee;
      const code = lireLocal("grind.recuperation");
      return pageReglages("Compte", `
        ${sectionReglages("", `
          ${ligneReglage({ icone: "personne", teinte: "var(--equipe)", titre: esc(pseudo), detail: "Ton pseudo, unique sur Grind" })}
          ${ligneReglage({ icone: e.compte && !e.horsLigne ? "nuage" : "nuageAlerte", titre: e.horsLigne ? "Pas de connexion" : e.compte ? "Enregistré sur le serveur" : "Pas encore vérifié",
            detail: e.horsLigne ? "Ta partie reste dans ce navigateur en attendant" : e.compte ? "Ce navigateur tient ton compte" : "Il se vérifie dès que tu es en ligne" })}`,
          "Ta partie part sur le serveur après chaque action. Un seul appareil tient ton compte à la fois.")}
        ${sectionReglages("Sauvegarde", `
          ${ligneReglage({ icone: enAttente ? "nuageAlerte" : "envoi", titre: envoyee ? `Envoyée ${esc(ilYa(envoyee, ctx.maintenant()))}` : "Pas encore envoyée",
            detail: enAttente ? "Des changements attendent le prochain envoi" : "Dernier envoi réussi" })}
          <button class="rg-ligne rg-envoyer" data-action="envoyerMaintenant" ${envoi.enCours || e.horsLigne || !e.compte ? "disabled" : ""}>
            <span class="rg-icone">${T(envoi.fait ? ICONES.coche : ICONES.exporter, 18)}</span>
            <span class="rg-texte"><span class="rg-titre">${envoi.enCours ? "Envoi…" : envoi.fait ? "Envoyé" : "Envoyer maintenant"}</span></span>
            ${envoi.enCours ? `<span class="rg-tourne" aria-hidden="true"></span>` : ""}</button>
          ${envoi.message ? `<p class="rg-note">${esc(envoi.message)}</p>` : ""}`,
          "Si l'envoi échoue, la raison s'affiche ici. Ta partie reste dans ce navigateur en attendant.")}
        ${code ? sectionReglages("Code de récupération", `<div class="rg-code">
            <span class="rg-code-valeur code" aria-live="polite">${codeVisible ? esc(serveur.espacer(code)) : "•••• •••• ••••"}</span>
            <span class="rangee"><button class="petit" data-action="voirCode">${codeVisible ? "Masquer" : "Afficher"}</button>
              <button class="petit" data-action="copierCode">${codeCopie ? "Copié" : "Copier"}</button></span></div>`,
          "Avec ton pseudo, il ramène tes parties sur un autre appareil ; celui-ci est alors déconnecté.") : ""}`);
    },
    actions: {
      voirCode(ctx) { codeVisible = !codeVisible; ctx.redessiner(); },
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

  // ── Apparence : accent, sons, vibrations ────────────────────────────
  reglagesApparence: {
    titre: "Apparence",
    async donnees(ctx) { return { r: await ctx.tableau("recompenses").catch(() => null) }; },
    rendu(d) {
      // D123 : les six de base, plus les accents gagnés en fin de saison.
      const gagnes = (d.r?.accents ?? []).filter((x) => x.gagne).map((x) => x.id);
      const a = accentChoisi();
      return pageReglages("Apparence", `
        ${sectionReglages("Couleur d'accent", `<div class="cl-accents" role="radiogroup" aria-label="Couleur d'accent">${accentsDisponibles(gagnes).map((x) =>
          `<button role="radio" data-action="choisirAccent" data-accent="${x.id}" aria-pressed="${x.id === a.id}" aria-checked="${x.id === a.id}" style="--c:${x.couleur}"><i></i>${esc(x.nom)}</button>`).join("")}</div>`,
          "Platine et Rubis se gagnent en fin de saison.")}
        ${sectionReglages("Mode économie", `<div class="reglage-segment">${segment(CHOIX_ECONOMIE.map((c) => [c.id, c.nom]), choixEconomie(), "choisirEconomie", { defilant: false })}</div>`,
          piedEconomie())}
        ${sectionReglages("Sons et vibrations", `
          ${interrupteur({ icone: "son", titre: "Sons", detail: "L'argent qui rentre, les achats, les signatures, les grands moments", actif: sonsActifs(), action: "basculerSons" })}
          ${interrupteur({ icone: "vibration", titre: "Vibrations", detail: "Assorties à chaque son, sur les téléphones qui vibrent", actif: vibrationsActives(), action: "basculerVibrations" })}`,
          "Le son de l'appareil coupé coupe aussi les sons du jeu.")}`);
    },
    actions: {
      choisirAccent(ctx, b) { choisirAccent(b.dataset.accent); vibrer(); ctx.redessiner(); },
      choisirEconomie(ctx, b) { choisirEconomie(b.dataset.valeur); vibrer(); ctx.redessiner(); }, // RNT-261
      ...actionsReglagesSons, // lot A : basculerSons (on entend ce qu'on allume), basculerVibrations
    },
  },

  // ── Carte : les calques, et ce que les autres voient de toi (RNT-185) ─
  reglagesCarte: {
    titre: "Carte",
    async donnees(ctx) { let monde = null; try { monde = await ctx.tableau("monde"); } catch {} return { monde }; },
    rendu(d) {
      const actifs = calquesActifs();
      return pageReglages("Carte", `
        ${sectionReglages("Ce que la carte montre", `<div class="rg-interieur"><div class="choix">${(d.monde?.calques?.length ? d.monde.calques : CALQUES_DEFAUT).map((c) =>
          `<button class="petit ${actifs[c.id] ? "plein" : ""}" data-action="calqueReglage" data-id="${esc(c.id)}" aria-pressed="${!!actifs[c.id]}" title="${esc(c.detail)}">${esc(c.nom)}</button>`).join("")}</div></div>`,
          "Les mêmes calques que sur la carte du Monde : le choix est retenu dans ce navigateur.")}
        ${d.monde ? sectionReglages("Les autres te voient", `<div class="rg-interieur">${segment([["invisible", "Invisible"], ["ville", "La ville"], ["lieu", "Le lieu du jeu"]], d.monde.maVisibilite, "visibiliteCarte")}</div>`,
          { invisible: "Personne ne te voit sur la carte.", ville: "Les autres voient seulement ta ville.", lieu: "Les autres voient le lieu du jeu où tu es (jamais ta vraie position)." }[d.monde.maVisibilite] ?? "") : ""}`);
    },
    actions: {
      calqueReglage(ctx, b) { basculerCalque(b.dataset.id); ctx.rafraichir(); },
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
        ${ligneReglage({ icone: "livre", titre: "Le guide", detail: "Tout le jeu, par thème", page: "guide" })}
        ${ligneReglage({ icone: "coccinelle", teinte: "var(--image)", titre: "Écrire à Grind", detail: "Un bug, un avis, une idée", page: "retours" })}`)}
      ${sectionReglages("Tutoriels", ORDRE_TUTORIELS.map((s) => ligneReglage({ icone: "lecture", titre: esc(SUJETS[s].titre), action: "tutoriel", donnees: `data-sujet="${s}"` })).join(""))}
      ${sectionReglages("Tes données", `<p class="rg-interieur aide">Tes parties sont enregistrées sur le serveur du jeu, avec ton pseudo. Dans un monde en ligne, ton profil (pseudo, patrimoine, boîtes, biens, positions) est visible des joueurs de ce monde. Les cours de bourse sont simulés, les mêmes pour tous.</p>`)}
      ${sectionReglages("", ligneReglage({ icone: "photo", teinte: "var(--image)", titre: "Crédits des photos", detail: "Les auteurs, sous licence libre", action: "creditsPhotos" }))}`),
    actions: {
      tutoriel: (ctx, b) => ouvrirAide(ctx, b.dataset.sujet),
      creditsPhotos(ctx) {
        // Les photos du web arrivent avec le lot D (web/photos) ; d'ici là, tout est dessiné.
        const credits = window.__creditsPhotos ?? [];
        ctx.feuille({
          titre: "Crédits des photos",
          contenu: credits.length ? `<div class="carte rg-carte">${credits.map((c) => `<div class="rg-credit"><b>${esc(c.nom)}</b><span class="aide">${esc(c.auteur)}, ${esc(c.licence)}</span>
              ${c.source ? `<a class="rg-lien" href="${esc(c.source)}" target="_blank" rel="noopener">Source sur Wikimedia Commons</a>` : ""}</div>`).join("")}</div>`
            : `<p class="aide">Aucune photo livrée pour l’instant : véhicules et biens sont dessinés.</p>`,
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
        "Ta partie reste sur le serveur ; tu la reprends avec ton pseudo et ton code de récupération. Tes couleurs et ton avatar restent dans ce navigateur.")}
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
    titre: "Écrire à Grind",
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
      return `${entetePousse("Écrire à Grind")}<div class="rg-page rg-retours">
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
      async envoyerRetour(ctx, b) {
        const texte = (document.getElementById("retour")?.value ?? "").trim();
        if (texte.length < 3) return ctx.toast("Écris au moins quelques mots.", "refus");
        b.disabled = true;
        b.textContent = "…";
        try {
          const image = capture ? await reduireImage(capture.fichier) : "";
          const a = ctx.etat.jeu?.accueil;
          await serveur.envoyerRetour({
            sorte, texte, capture: image,
            contexte: { plateforme: "web", navigateur: navigator.userAgent, profil: a?.profil ?? "", jour: String(a?.jour ?? ""), origine: "Réglages › Aide" },
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

/** Ce que le mode en ligne voit de moi change : on le publie tout de suite (avatar, titre, cadre, pseudo). */
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
