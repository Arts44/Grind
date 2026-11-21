// ══════════════════════════════════════════════════════════════════════
//  Zone « en ligne » (D205) : les mondes partagés, comme l'iPhone.
//
//    enLigne        EcranEnLigne (D215) : la page d'UN monde : son en-tête
//                   (code, joueurs, inviter), ses pages (joueurs, règles,
//                   entre joueurs, bourse), classement, échanges, fil, quitter
//    bourseMonde    EcranBourseMonde : parts, bourse, rachats
//    propositions   EcranPropositions : « Entre joueurs »
//    reglesMonde    EcranReglesMonde
//    amis, ami…     dans social.js (lot E) : EcranAmis, FicheAmi, DiscussionAmi,
//                   les défis entre amis, le Journal du dimanche
//
//  D215 : Mes mondes, Créer un monde, Rejoindre sont dans mondes.js.
//
//  Le transport est dans ../enligne.js, les règles et les textes dans le
//  moteur (PontEnLigne.swift, PontEntreJoueurs.swift).
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, variation, esc } from "../format.js?v=3e8bddd9";
import { ligneTitre, pastilleTitre } from "../titres.js?v=3e8bddd9"; // RNT-270
import { badgeFortune } from "../cartes-fortune.js?v=3e8bddd9"; // RNT-322 : la carte mise en avant, dans les membres
import { entetePousse, carte, ligne, bouton, petit, segment, vide, icones, courbeValeurs, champEuros, lireEuros, lienJoueur, menuAncre } from "../ui.js?v=3e8bddd9";
import { symbole, SYMBOLES } from "./vie.js?v=3e8bddd9";
import * as L from "../enligne.js?v=3e8bddd9";
import { majGardantCurseur, negociationLoyer, actionsLoyer } from "./enligne-fiches.js?v=3e8bddd9";
import * as social from "./social.js?v=3e8bddd9";

const montant = (c) => montantBrut(c).replace("-", "−");
const pct = (x, d = 0) => `${(x * 100).toFixed(d).replace(".", ",")} %`;
const hex = (n) => `#${Number(n ?? 0x8a8f98).toString(16).padStart(6, "0")}`;
const lc = (x) => String(x ?? "").toLowerCase();
const heures = (m) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
const ordinal = (r) => (r === 1 ? "1er" : `${r}e`);
const filet = '<div class="filet"></div>';
const aide = (t, style = "") => `<p class="aide" style="${style}">${t}</p>`;
const erreurTexte = (t) => (t ? `<p class="el-erreur">${esc(t)}</p>` : "");

/** « il y a 3 minutes » : la date relative de l'iPhone (.relative(presentation: .named)). */
function relatif(ms, maintenant = Date.now()) {
  const s = Math.round((ms - maintenant) / 1000);
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const a = Math.abs(s);
  if (a < 60) return rtf.format(Math.round(s), "second");
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86_400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86_400), "day");
}

// MARK: - Les briques (AvatarAutre, BadgeBot, CodeMonde, Interrupteur)

const CARACTERES = { entrepreneur: "Entrepreneur", trader: "Trader", rentier: "Rentier immobilier", flambeur: "Flambeur", magouilleur: "Magouilleur" };
export const NIVEAUX = [["detendu", "Détendus"], ["normal", "Normaux"], ["coriace", "Coriaces"]];

/** L'avatar d'un autre joueur, d'après son profil publié : son symbole blanc sur sa teinte.
 *  D393 (Arthur 16/11) : de retour pour les joueurs (pas les personnes du jeu), sans cadre (D388) ; tailles en variables. */
export function avatarAutre(p, taille = 36) {
  return `<span class="el-avatar" style="--taille:${taille}px;--c:${hex(p?.teinte)};--l:${Math.round(taille * 0.46)}px" aria-hidden="true">
    <span class="el-symbole">${symbole(p?.symbole ?? "person.fill")}</span></span>`;
}

/** RNT-179 : le badge discret d'un bot ; avec `detail`, son caractère et son niveau. */
export function badgeBot(bot, detail = false) {
  if (!bot) return "";
  const n = NIVEAUX.find(([k]) => k === bot.niveau)?.[1] ?? "Normaux";
  return `<span class="el-bot">${detail ? `Bot · ${esc(CARACTERES[bot.caractere] ?? "Entrepreneur")}, ${n.toLowerCase()}` : "Bot"}</span>`;
}

/** « 2 joueurs et 3 bots sur 5 : un bot te laisse sa place. » */
export function places(profils, n) {
  const h = profils.filter((p) => !p.bot).length, b = profils.length - h;
  const joueurs = `${h} joueur${h > 1 ? "s" : ""}`;
  return b > 0 ? `${joueurs} et ${b} bot${b > 1 ? "s" : ""} sur ${n} : un bot te laisse sa place.` : `${joueurs} sur ${n}`;
}

/**
 * D215 : l'en-tête d'un monde (TeteMonde) : sa sorte, son nom, « tu y joues », Inviter ;
 * puis, en bande, son code, ses joueurs et le jour de sa saison.
 */
export function teteMonde({ code, nom, prive = true, joueurs = null, bots = 0, places: n = prive ? 5 : 10, jour = null, duree = null, ici = false, inviter = true, avecNom = true }) {
  return `<div class="carte el-tete">
    <div class="el-x1 rangee">
      <span class="pastille el-tete-pastille" style="--c:${prive ? "var(--equipe)" : "var(--image)"}">${prive ? icones.amis : SYMBOLES.globe}</span>
      <div class="el-x2"><div class="el-genre">${prive ? "Monde privé" : "Monde public"}</div>
        ${avecNom ? `<div class="el-nom-monde">${esc(nom)}</div>` : `<div class="aide">${prive ? "Entre amis, sur invitation" : "Avec des inconnus"}</div>`}</div>
      ${ici ? `<span class="el-ici">Tu y joues</span>` : ""}
    </div>
    <div class="filet"></div>
    <div class="el-bande">
      <div><div class="aide">Code</div><span class="el-code" id="code-monde">${esc(code)}</span></div>
      ${joueurs != null ? `<div><div class="aide">Joueurs</div><div class="el-val">${joueurs} sur ${n}</div>${bots ? `<div class="aide">dont ${bots} bot${bots > 1 ? "s" : ""}</div>` : ""}</div>` : ""}
      ${jour != null ? `<div><div class="aide">Saison</div><div class="el-val">Jour ${jour}</div>${duree ? `<div class="aide">${esc(duree)}</div>` : ""}</div>` : ""}
    </div>
    ${inviter ? `<div class="filet"></div><button class="el-inviter" data-action="inviterMonde" data-code="${esc(code)}" data-nom="${esc(nom)}">${PARTAGER}<span>Inviter des amis</span></button>` : ""}
  </div>`;
}

/** D215 : Inviter (FeuilleInviter) : partager le code, ou l'envoyer à un ami (ceux déjà dedans sont marqués). */
export async function inviterMonde(ctx, b) {
  const { code, nom } = b.dataset;
  const [amis, t] = await Promise.all([L.chargerAmis().catch(() => null), L.trouver(code).catch(() => null)]);
  const dedans = new Set((t?.profils ?? []).map((p) => lc(p.id)));
  const envoyes = new Set();
  const liste = amis?.amis ?? [];
  ctx.feuille({ titre: `Inviter dans « ${nom} »`, rendu: () => `<div class="el-x3 pile">
    <div class="carte el-invite"><div class="aide">Le code du monde</div><div class="el-code el-code-grand">${esc(code)}</div>
      ${bouton(`${PARTAGER} Partager l'invitation`, "partagerMonde", { genre: "secondaire", donnees: { code, nom } })}</div>
    <div><div class="el-x4 section">Tes amis</div>${carte(liste.length ? liste.map((x, k) => `${k ? filet : ""}<div class="el-x5 rangee">
        <span class="pastille" style="--c:var(--equipe)">${icones.personne}</span><span class="el-x6 libelle el-coupe">${esc(x.pseudo)}</span>
        ${dedans.has(lc(x.id)) ? `<span class="aide">Déjà dedans</span>` : envoyes.has(x.id) ? `<span class="el-x7 gain">Invité</span>`
          : petit("Inviter", "envoyerInvitation", { teinte: "var(--equipe)", donnees: { id: x.id } })}</div>`).join("")
      : `<p class="el-x8 aide">Pas encore d'amis : ajoute-les par leur pseudo, dans Amis.</p>`)}</div>
    </div>`, actions: {
    partagerMonde: (c, x) => partager(c, x.dataset.code, x.dataset.nom),
    async envoyerInvitation(c, x) {
      try { await L.inviterAmi(x.dataset.id, code); envoyes.add(x.dataset.id); c.toast("Invitation envoyée", "gain"); c.redessiner(); } catch (e) { c.toast(e.message, "refus"); }
    },
  } });
}

async function partager(ctx, code, nom) {
  const texte = `Rejoins mon monde « ${nom} » dans Grind : code ${code}`;
  try {
    if (navigator.share) await navigator.share({ text: texte });
    else { await navigator.clipboard.writeText(texte); ctx.toast("Invitation copiée", "gain"); }
  } catch {}
}
export const PARTAGER = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 11v8.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V11"/></svg>`;

/** Un interrupteur iOS (Interrupteur) : un libellé, une aide, la bascule à droite. */
export const interrupteur = (action, actif, titre, detail = "", { desactive = false, donnees = {} } = {}) => `
  <button class="el-interrupteur" data-action="${action}" role="switch" aria-checked="${!!actif}" ${desactive ? "disabled" : ""} ${Object.entries(donnees).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")}>
    <span class="el-x9"><span class="el-x10 libelle">${titre}</span>${detail ? `<span class="el-x10 aide">${detail}</span>` : ""}</span>
    <span class="el-bascule" aria-hidden="true"></span>
  </button>`;

/** Des pastilles à choix unique (PiluleFiltre). */
export const pilules = (action, choix, choisie, { desactive = false } = {}) => `<div class="choix el-pilules">${choix.map(([v, t]) =>
  `<button class="petit ${String(v) === String(choisie) ? "plein" : ""}" data-action="${action}" data-valeur="${esc(v)}" aria-pressed="${String(v) === String(choisie)}" ${desactive ? "disabled" : ""}>${esc(t)}</button>`).join("")}</div>`;

/** Une ligne qui ouvre une page (LigneLien) ou déclenche une action (LigneReglage). */
export const lien = (titre, detail, { page = "", p = null, action = "", donnees = {}, icone = "", teinte = "" } = {}) =>
  ligne({ titre: esc(titre), detail: esc(detail), page, p, action, donnees, icone, teinte });

/** Ce qui fait l'avatar du joueur sur le web (pas de choix d'avatar ici : celui de l'iPhone par défaut). */
const moiProfil = (ctx) => ({ ...L.avatarLocal(ctx), id: "moi" });

// MARK: - L'état de la page d'un monde

// RNT-266 : `ouverts`, les sections dépliées de la fiche (les membres, au départ).
const f = { classement: "patrimoine", synchroLe: 0, ouverts: new Set(["membres"]), general: false, generalLu: null };

// MARK: - La fiche d'un monde (RNT-266, D265 ; FicheDuMonde)

const COURONNE = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/></svg>';

/** Une section repliée : son titre, son résumé, un chevron ; `contenu` n'est dessiné qu'ouvert. */
function repli(id, titre, detail, contenu) {
  const ouvert = f.ouverts.has(id);
  return `<section class="fm-repli${ouvert ? " ouvert" : ""}" data-section="${id}">
    <button class="fm-repli-tete" data-action="ongletMonde" data-valeur="${id}" aria-expanded="${ouvert}">
      <span class="fm-repli-titre">${titre}</span>${detail ? `<span class="fm-repli-detail el-coupe">${esc(detail)}</span>` : ""}
      <span class="fm-chevron" aria-hidden="true">${icones.chevron}</span></button>
    ${ouvert ? `<div class="fm-repli-corps">${contenu()}</div>` : ""}</section>`;
}

/** Le résumé : la saison, ton rang et ta fortune, le podium, les arrivées. */
function resumeMonde(d, fi) {
  const l = d.cible.enLigne;
  const avatar = (m) => avatarAutre(d.tous.find((p) => lc(p.id) === lc(m.id)) ?? {}, 34);
  const podium = fi.podium.length ? `<div class="filet"></div><div class="fm-podium">${fi.podium.map((m) => `<${d.enCours ? `button data-action="ficheJoueur" data-id="${esc(m.id)}"` : "div"} class="fm-place">
      <span class="fm-av">${avatar(m)}<i class="fm-medaille${m.rang === 1 ? " or" : ""}">${m.rang}</i></span>
      <span class="fm-place-nom el-coupe">${esc(m.moi ? "Toi" : m.pseudo)}</span>${ligneTitre(m.titre, 11)}<span class="chiffres t2 fm-place-val">${montant(m.patrimoine)}</span></${d.enCours ? "button" : "div"}>`).join("")}</div>` : "";
  return `<div class="carte fm-resume">
    <div class="fm-haut"><span class="el-genre">${l.prive !== false ? "Monde privé" : "Monde public"}</span>${d.enCours ? `<span class="el-ici">Tu y joues</span>` : ""}</div>
    <div class="fm-saison"><span class="fm-jour">Jour ${fi.jour}</span><span class="t2">sur ${fi.duree}${d.cible.dureeNom ? ` · ${esc(d.cible.dureeNom)}` : ""}</span></div>
    <div class="fm-barre" role="progressbar" aria-label="Saison" aria-valuemin="1" aria-valuemax="${fi.duree}" aria-valuenow="${fi.jour}"><i style="--p:${Math.round(fi.progression * 1000) / 10}%"></i></div>
    <div class="filet"></div>
    <div class="el-bande"><div><div class="aide">Ton rang</div><div class="el-val" id="mon-rang">${fi.moi ? `${ordinal(fi.moi.rang)} sur ${fi.membres.length}` : "—"}</div></div>
      <div><div class="aide">Ta fortune</div><div class="el-val">${montant(fi.moi?.patrimoine ?? d.cible.patrimoine)}</div></div></div>
    ${podium}
    <div class="filet"></div>
    <p class="fm-etat${fi.ouvert ? " ouvert" : ""}" id="etat-arrivees">${esc(fi.etat)}</p>
  </div>`;
}

const IC = (d) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC_JOUER = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>`;
const IC_COPIER = IC('<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>');
const IC_TROPHEE = IC('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v4M8.5 20h7"/>');
const IC_FIL = IC('<path d="M5 7h14M5 12h14M5 17h9"/>');
const IC_GAZETTE = IC('<path d="M5 5h11v14H7a2 2 0 0 1-2-2zM16 9h3v8a2 2 0 0 1-2 2M8 9h5M8 12h5M8 15h3"/>');

/** Une action en rond, son nom dessous : un bouton, ou un lien vers une page. */
const rond = (nom, icone, { action = "", page = "", donnees = {}, plein = false } = {}) => {
  const attrs = page ? `data-action="ouvrir" data-page="${esc(page)}"` : `data-action="${esc(action)}" ${Object.entries(donnees).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")}`;
  return `<button class="fm-act${plein ? " plein" : ""}" ${attrs}><span class="fm-rond">${icone}</span><span class="fm-act-nom">${nom}</span></button>`;
};

/** Les actions en icônes (reprendre, code, partager, inviter, règles), puis le code du monde. */
function actionsMonde(d, fi) {
  const x = d.cible, l = x.enLigne;
  const admin = l.prive !== false && !!L.monde.options?.admin && lc(L.monde.options.admin) === lc(d.e?.moi ?? l.joueur);
  return carte(`
    ${d.enCours ? "" : `<div class="fm-reprendre">${aide(`Ta partie y continue : ${esc(x.profilNom)}, ${montant(x.patrimoine)}. Le classement, les échanges et le fil s'ouvrent quand tu y joues.`)}</div>${filet}`}
    <div class="fm-acts">
      ${d.enCours ? "" : rond("Reprendre", IC_JOUER, { action: "jouerIci", donnees: { emplacement: x.emplacement }, plein: true })}
      ${rond("Code", IC_COPIER, { action: "copierCode", donnees: { code: l.code } })}
      ${rond("Partager", PARTAGER.replace('width="15" height="15"', 'width="22" height="22"'), { action: "partagerCode", donnees: { code: l.code, nom: l.nom } })}
      ${rond("Inviter", icones.amis, { action: "inviterMonde", donnees: { code: l.code, nom: l.nom } })}
      ${rond(admin ? "Régler" : "Règles", icones.document, { page: "reglesMonde" })}
    </div>
    ${filet}
    <div class="fm-code"><span class="aide">Code du monde</span><span class="el-code" id="code-monde">${esc(l.code)}</span></div>`);
}

/** Joueurs et bots, triés par fortune : admin, présence, palier. */
function membresMonde(d, fi) {
  if (!fi.membres.length) return carte(`<p class="aide fm-vide">${esc(L.monde.erreur ?? "Chargement des membres…")}</p>`);
  return carte(fi.membres.map((m, k) => {
    const p = d.tous.find((y) => lc(y.id) === lc(m.id)) ?? {};
    const balise = d.enCours ? "button" : "div";
    return `${k ? filet : ""}<${balise} class="el-rang fm-membre${m.moi ? " moi" : ""}" ${d.enCours ? `data-action="ficheJoueur" data-id="${esc(m.id)}"` : ""}>
      <span class="fm-av">${avatarAutre(p, 34)}${m.actif && !m.moi ? `<i class="fm-point${m.focus ? " focus" : ""}"></i>` : ""}</span>
      <span class="fm-qui"><span class="rangee fm-nom"><span class="libelle el-coupe">${esc(m.moi ? `${m.pseudo} (toi)` : m.pseudo)}</span>${m.admin ? `<span class="fm-admin" title="Admin du monde">${COURONNE}</span>` : ""}${badgeFortune(m.carte)}${badgeBot(p.bot)}</span>
        ${ligneTitre(m.titre, 12)}<span class="aide el-coupe">${esc([m.bot ? null : m.presence, m.palier].filter(Boolean).join(" · "))}</span></span>
      <span class="chiffres t2 fm-fortune">${montant(m.patrimoine)}</span></${balise}>`;
  }).join(""));
}

/** D441 : le rang d'un nombre de points de prestige (RangPrestige du moteur, mêmes règles). */
export function rangPrestige(points, r) {
  if (!r) return null;
  const seuil = (n) => (n <= 0 ? 0 : Math.round(r.premierSeuil * r.facteur ** (n - 1)));
  let n = 0;
  while (n < 200 && points >= seuil(n + 1)) n += 1;
  const rang = Math.min(n, r.rangs.length - 1);
  return { niveau: n + 1, nom: r.rangs[rang] ?? "", texte: `${r.rangs[rang] ?? ""} · niv. ${n + 1}` };
}

/** D441 : le classement Général : mon rang et ma marche suivante, puis les premiers (prestige à vie, tous mondes). */
function classementGeneral(d) {
  const p = d.prestige, c = d.general, m = p?.moi;
  const tete = m ? `<div class="cg-moi"><div class="rangee"><div><b class="cg-rang">${esc(m.nom)}</b><div class="aide">Niveau ${m.niveau}</div></div>
      <div class="cg-points"><span class="chiffres">${m.points}</span><div class="aide">points de prestige</div></div></div>
      <div class="cg-jauge"><i style="width:${Math.round(m.progression * 100)}%"></i></div>
      <p class="aide">${esc(m.rangSuivant ? `${m.seuilSuivant - m.points} points avant ${m.rangSuivant}` : `${m.seuilSuivant - m.points} points avant le niveau ${m.niveau + 1}`)}</p></div>` : "";
  if (!c) return `${tete}${filet}<p class="aide fm-explication">${f.generalLu ? "Le classement Général n'est pas encore ouvert." : "Chargement du classement…"}</p>`;
  const lignes = [...(c.joueurs ?? [])];
  if (c.moi && !lignes.some((x) => x.moi)) lignes.push({ pseudo: d.profils?.find((x) => L.estMoi(x.id))?.pseudo ?? "Toi", prestige: c.moi.prestige, place: c.moi.place, moi: true });
  return `${tete}${lignes.map((x) => `${filet}<div class="el-classe ${x.moi ? "moi" : ""}">
      <span class="el-n ${x.place === 1 ? "or" : ""}">${x.place}</span>
      <span class="fm-qui"><span class="libelle el-coupe">${esc(x.moi ? `${x.pseudo} (toi)` : x.pseudo)}</span>
        <span class="aide">${esc(rangPrestige(x.prestige, p?.regles)?.texte ?? "")}</span></span>
      <span class="chiffres fm-valeur">${x.prestige}</span></div>`).join("")}
    ${lignes.length ? "" : `${filet}<p class="aide fm-explication">Personne au classement pour l'instant.</p>`}
    ${c.moi?.cache ? `<p class="aide fm-explication">Tu te caches : les autres ne te voient pas ici (Personnaliser › Carte).</p>` : ""}`;
}

/** Le classement (MondeEnCours.classements), au choix de l'onglet ; D441 : « Ce monde » ou « Général ». */
function classementMonde(d) {
  const portee = `<div class="fm-choix">${segment([["monde", "Ce monde"], ["general", "Général"]], f.general ? "general" : "monde", "choisirPortee", { defilant: false })}</div>`;
  if (f.general) return carte(portee + classementGeneral(d));
  const profils = d.profils.filter((p) => p.profilDepart);
  const c = d.classements?.find((x) => x.id === f.classement) ?? d.classements?.[0];
  return carte(`${portee}
    <div class="fm-choix">${menuAncre({ libelle: "Classement", options: (d.classements ?? []).map((x) => [x.id, x.nom]), choisie: c?.id, action: "choisirClassement", aligner: "gauche" }) /* D352 : menuAncre (D345) */}</div>
    <p class="aide fm-explication">${esc(c?.explication ?? "")}</p>
    ${d.prestige?.noteMonde ? `<p class="aide fm-explication">Note du monde : ${esc(d.prestige.noteMonde)} · le record et le prestige comptent × la note</p>` : "" /* D441 : reste de OPT */}
    ${(c?.lignes ?? []).map((x) => {
      const p = profils.find((y) => lc(y.id) === lc(x.id)) ?? {};
      return `${filet}<button class="el-classe ${x.moi ? "moi" : ""}" data-action="ficheJoueur" data-id="${esc(x.id)}">
        <span class="el-n ${x.rang === 1 ? "or" : ""}">${x.rang}</span>${avatarAutre(p, 36)}
        <span class="fm-qui"><span class="rangee fm-nom"><span class="libelle el-coupe">${esc(x.moi ? `${p.pseudo} (toi)` : p.pseudo)}</span>${pastilleTitre(x.titre)}${badgeBot(p.bot)}</span>
          ${x.sous ? `<span class="aide">${esc(x.sous)}</span>` : ""}</span>
        <span class="chiffres fm-valeur">${esc(x.valeur)}</span></button>`;
    }).join("")}`);
}

/** RNT-281 : l'événement du monde de la semaine, et la rumeur du dimanche (tirés par le moteur, les mêmes pour tous). */
function carteEvenements() {
  const ev = L.monde.evenements ?? [];
  return ev.length ? carte(ev.map((x, i) => `${i ? filet : ""}<div class="rangee fm-fait fm-evenement" data-evenement="${esc(String(x.id))}">
      <span class="t2 fm-fait-icone">${symbole(x.icone)}</span>
      <span class="fm-fait-texte"><strong>${esc(x.texte)}</strong></span></div>`).join("")) : "";
}

/** Le fil du monde : l'événement de la semaine, puis les grands moments (D352 : plus de Feuille, la Gazette a sa tuile). */
function filMonde() {
  return carteEvenements() + carte(`${L.monde.fil.length ? "" : `<p class="aide fm-vide">Les grands moments du monde s'afficheront ici : achats, records, boîtes fondées.</p>`}
    ${L.monde.fil.slice(0, 40).map((x, i) => `${i ? filet : ""}<div class="rangee fm-fait">
      <span class="t2 fm-fait-icone">${symbole(x.icone)}</span>
      <span class="fm-fait-texte">${lienJoueur(x.joueur, esc(x.texte))}</span></div>`).join("")}`)
    // D218 : discret, seulement si le fil n'est pas frais (hors ligne, ou plus d'une minute et demie).
    + ((t) => t ? `<p class="aide" id="etat-fil">${esc(t)}</p>` : "")(L.monde.synchroFil?.libelle(Date.now()));
}

/** Une tuile givrée : une page du monde, ou une section de la fiche (`section`). */
const tuile = (titre, detail, icone, teinte, { page = "", section = "", badge = 0 } = {}) => {
  const attrs = page ? `data-action="ouvrir" data-page="${esc(page)}"` : `data-action="versSection" data-valeur="${esc(section)}"`;
  return `<button class="carte fm-tuile" ${attrs}><span class="fm-tuile-ico" style="--fm-teinte:${teinte}">${icone}</span>${badge ? `<span class="fm-badge" aria-label="${badge} à trancher">${badge}</span>` : ""}
    <span class="fm-tuile-titre">${esc(titre)}</span><span class="aide fm-tuile-detail el-coupe">${esc(detail)}</span></button>`;
};

/** Les autres pages du monde, en tuiles qui défilent de côté : la bourse, les joueurs, entre joueurs, le classement, le fil. */
function tuilesMonde(d, fi) {
  const n = d.entre?.nombre ?? 0;
  const joueurs = `${fi.joueurs} joueur${fi.joueurs > 1 ? "s" : ""}${fi.bots ? `, ${fi.bots} bot${fi.bots > 1 ? "s" : ""}` : ""}`;
  return `<div class="fm-tuiles">
    ${tuile("Bourse du monde", "Parts, bourse, rachats", icones.marches, "var(--argent)", { page: "bourseMonde" })}
    ${tuile("Les joueurs", joueurs, icones.amis, "var(--equipe)", { page: "joueurs" })}
    ${tuile("Entre joueurs", n > 0 ? `${n} à trancher` : "Combines, voyages", icones.fleches, "var(--controles)", { page: "propositions", badge: n })}
    ${tuile("Classement", fi.moi ? `Tu es ${ordinal(fi.moi.rang)}` : "Patrimoine et plus", IC_TROPHEE, "var(--or, #c9a64a)", { section: "classement" })}
    ${L.monde.options?.options?.gazette === false ? "" : tuile("Gazette", L.monde.gazette?.edition ? `N° ${L.monde.gazette.edition.numero}, ${L.monde.gazette.edition.date}` : "Chaque dimanche soir", IC_GAZETTE, "var(--encre, #1d1c1a)", { page: "gazette" })}
    ${tuile("Fil du monde", L.monde.fil[0]?.texte ?? "Les grands moments", IC_FIL, "var(--vente)", { section: "fil" })}
  </div>`;
}

/** La fiche : le résumé, les tuiles vers les pages, les actions, le détail replié, puis quitter. */
function ficheMonde(d, ctx) {
  const fi = d.fiche;
  if (!fi) return vide("La fiche du monde se charge…");
  const classe = d.classements?.find((x) => x.id === f.classement) ?? d.classements?.[0];
  const membres = `${fi.joueurs} joueur${fi.joueurs > 1 ? "s" : ""}${fi.bots ? `, ${fi.bots} bot${fi.bots > 1 ? "s" : ""}` : ""}${fi.places ? ` sur ${fi.places}` : ""}`;
  return `<div class="pile fm-pile">
    ${resumeMonde(d, fi)}
    ${d.enCours ? tuilesMonde(d, fi) : ""}
    ${actionsMonde(d, fi)}
    ${repli("membres", "Membres", membres, () => membresMonde(d, fi))}
    ${d.enCours ? `${repli("classement", "Classement", classe?.nom ?? "", () => classementMonde(d))}
      ${repli("echanges", "Échanges", "Prêts, logements, franchises", () => echanges(d, ctx))}
      ${repli("fil", "Fil", L.monde.fil[0]?.texte ?? "", filMonde)}
      ${L.monde.erreur && fi.membres.length ? `<p class="alerte fm-erreur">${esc(L.monde.erreur)}</p>` : ""}` : ""}
    ${carte(`<button class="fm-quitter" data-action="quitterMonde" data-emplacement="${esc(d.cible.emplacement)}" data-nom="${esc(d.cible.enLigne.nom)}">Quitter ce monde</button>`)}
  </div>`;
}

const quitter = (x) => `<div class="fm-quitter-seul">${bouton("Quitter ce monde", "quitterMonde", { genre: "discret", donnees: { emplacement: x.emplacement, nom: x.enLigne.nom } })}</div>`;

/** Ce qui se négocie entre joueurs : parts, prêts, logements (MondeEnCours.echanges). */
function echanges(d, ctx) {
  const n = d.entre?.nombre ?? 0;
  const moi = lc(d.e.moi);
  const v = d.visibilite;
  const prets = (d.e.prets ?? []).filter((p) => (lc(p.emprunteur) === moi || lc(p.preteur) === moi) && ["propose", "accepte"].includes(p.statut));
  const libres = L.monde.locations.filter((x) => lc(x.proprietaire) !== moi && (!x.locataire || lc(x.locataire) === moi));
  const franchises = L.monde.franchises.filter((x) => x.ouverte && lc(x.franchiseur) !== moi)
    .sort((a, b) => b.reputation - a.reputation || a.marque.localeCompare(b.marque));
  const copies = d.e.copies ?? [];
  return `<div class="el-x3 pile">
    ${v ? `<div><div class="el-x4 section">Ta position</div>${carte(`<div class="el-x11 pile">
      <div class="libelle">Précision</div>${pilules("precision", v.precisions.map((x) => [x.id, x.nom]), v.precision)}
      <div class="el-x12 libelle">Qui la voit</div>${pilules("publicVise", v.publics.map((x) => [x.id, x.nom]), v.public)}</div>`, { pad: true })}
      <p class="el-x13 aide">Tes proches : les joueurs en qui ta confiance atteint ${v.seuil} sur 10.</p></div>` : ""}
    ${copies.length ? carte(`<div class="el-x8 libelle">Tes copies</div>${copies.map((x) => `${filet}<div class="el-x5 rangee">
      <div class="el-x2"><div class="libelle">${lienJoueur(x.joueur, esc(x.pseudo ?? L.pseudoDe(x.joueur)))}</div><div class="aide">Budget ${montant(x.budget ?? 0)}</div></div>
      ${petit("Arrêter", "arreterCopie", { donnees: { id: x.joueur } })}</div>`).join("")}`) : ""}
    ${franchises.length ? carte(`<div class="el-x8"><div class="libelle">Franchises des joueurs</div><p class="aide">Ouvre une succursale d'une marque qui marche, là où tu es.</p></div>
      ${franchises.map((x) => `${filet}<button class="ligne" data-action="feuilleSuccursale" data-id="${esc(x.id)}">
        <span class="el-x2"><div class="titre">${esc(x.marque)}</div><div class="detail">${esc(nomSecteur(d, x.secteur))}, à ${esc(L.pseudoDe(x.franchiseur))}</div></span>
        <span class="el-x14"><div class="el-x15 or">${etoiles(x.reputation)}</div><div class="aide">${pct(x.redevance)} du chiffre</div></span>
        <span class="chevron">${icones.chevron}</span></button>`).join("")}`) : ""}
    ${prets.length ? carte(`<div class="el-x8 libelle">Prêts</div>${prets.map((x) => {
      const jeDois = lc(x.emprunteur) === moi;
      const nom = L.pseudoDe(jeDois ? x.preteur : x.emprunteur);
      const du = Math.round(x.montant * (1 + x.taux * x.semaines));
      const reste = du - (x.rembourse ?? 0);
      return `${filet}<div class="el-x5 rangee">
        <div class="el-x2"><div class="libelle">${esc(jeDois ? `${nom} te prête ${montant(x.montant)}` : `Tu prêtes ${montant(x.montant)} à ${nom}`)}</div>
          <div class="aide">${x.statut === "propose" ? `Rendre ${montant(du)} en ${x.semaines} semaines` : `Reste ${montant(reste)}, ${montant(Math.ceil(du / x.semaines))} par semaine`}</div></div>
        ${jeDois && x.statut === "propose" ? `${petit("Refuser", "repondrePret", { donnees: { id: x.id, oui: "0" } })}${petit("Accepter", "repondrePret", { plein: true, donnees: { id: x.id, oui: "1" } })}`
          : x.statut === "propose" ? `<span class="aide">En attente</span>` : ""}</div>`;
    }).join("")}`) : ""}
    ${libres.length ? carte(`<div class="el-x8 libelle">Logements des joueurs</div>${libres.map((x) => `${filet}<div class="el-x5 rangee">
      <div class="el-x2"><div class="libelle">${esc(x.nom)}</div><div class="aide">${nomJ(x.proprietaire)}, ${esc(nomVille(d, x.ville))}, ${montant(x.loyer)} par semaine</div>
        ${lc(x.locataire) === moi ? negociationLoyer(x) : ""}</div>
      ${lc(x.locataire) === moi ? `<span class="el-x7 or">Chez toi</span>` : petit("Louer", "prendreLocation", { plein: true, donnees: { id: x.bien } })}</div>`).join("")}`) : ""}
    ${lien("Échanges", "Offres, prêts, locations, réméré : tout ce qui change de main entre joueurs", { page: "echanges", icone: "fleches", teinte: "var(--argent)" })}
    ${aide("Pour lui proposer un échange ou une combine, l'inviter en voyage, copier ses ordres ou le signaler, touche son nom : son profil s'ouvre.")}
  </div>`;
}

const etoiles = (r) => { const n = Math.max(0, Math.min(5, Math.round(r ?? 0))); return "★".repeat(n) + `<span class="t3">${"★".repeat(5 - n)}</span>`; };
const nomVille = (d, id) => d.villes?.find((v) => v.id === id)?.nom ?? id ?? "";
const nomSecteur = (d, id) => d.secteurs?.find((s) => s.id === id)?.nom ?? id ?? "";
/** RNT-212 : le nom d'un joueur, qui ouvre son profil. */
const nomJ = (id) => lienJoueur(id, esc(L.pseudoDe(id)), { pseudo: L.pseudoDe(id) });

// MARK: - Aucun monde (D215)

function aucunMonde() {
  return `<div class="el-x16 pile">
    <span class="el-x17 pastille el-tete-pastille">${icones.amis}</span>
    <div><div class="el-x18">Aucun monde en ligne</div>
      <p class="el-x19 aide">Crée un monde pour tes amis, ou rejoins-en un : avec un code, ou parmi les mondes publics.</p></div>
    <div class="el-x20 pile">${bouton("Créer un monde", "versCreer")}
    ${bouton("Rejoindre un monde", "", { genre: "secondaire", page: "rejoindreMonde" })}</div>
  </div>`;
}

// MARK: - La fiche d'un joueur (FicheJoueur)

/** RNT-200 : la fiche d'un joueur ou d'un bot est celle de « Les joueurs » (joueurs.js), d'où qu'on l'ouvre. */
async function ouvrirFiche(ctx, id) {
  const { ouvrirFicheJoueur } = await import("./joueurs.js?v=3e8bddd9");
  return ouvrirFicheJoueur(ctx, id);
}

/** RNT-200 : copier, prêter, (combines,) signaler : les liens du bas de la fiche. */
export function liensFiche(p, { combines = false, echange = true } = {}) { // D454 : `echange` faux : « Échanger » est en haut du profil
  return `<div>${carte(`
      ${lien("Copier ses ordres", L.monde.copies.some((x) => L.estMoi(x.copieur) && lc(x.copie) === lc(p.id)) ? "Tu le copies déjà" : "Tes ordres suivent les siens, pour un budget", { action: "copierJoueur", donnees: { id: p.id }, icone: "marches", teinte: "var(--argent)" })}
      ${echange ? lien("Proposer un échange", "Argent, parts, biens, véhicules, montres ; un prêt, une location", { action: "proposerEchangeJoueur", donnees: { id: p.id }, icone: "fleches", teinte: "var(--argent)" }) : ""}
      ${combines ? lien("Combines", "Le voler, saboter sa boîte : le risque et ce qui l'en empêche", { action: "combinesJoueur", donnees: { id: p.id }, icone: "masque", teinte: "var(--c-danger)" }) : ""}
      ${lien("Le signaler à l'inspection", "Travail au noir, anonymement", { action: "signalerInspection", donnees: { id: p.id }, icone: "info", teinte: "var(--c-danger)" })}
      ${lien("Signaler un comportement", "Pseudo choquant, triche", { action: "signalerComportement", donnees: { id: p.id }, icone: SYMBOLES.drapeau, teinte: "var(--c-danger)" })}`)}</div>`;
}

/** « Entre vous » (SectionEntreVous) : la confiance, ce qu'on peut faire, bloquer. RNT-200 : `compact` (la fiche),
 *  sans ce qu'elle montre déjà en tuiles : la combine, le rejoindre, bloquer. */
export function entreVous(p, v, { compact = true } = {}) {
  const crans = Array.from({ length: 10 }, (_, k) => `<i class="${k < v.confiance ? (v.proche ? "proche" : v.confiance <= 3 ? "bas" : "moyen") : ""}"></i>`).join("");
  return `<div><div class="el-x4 section">Entre vous</div>${carte(`
    <div class="el-x21 rangee"><span class="libelle">Confiance</span><span class="espace"></span><span class="el-crans" aria-label="Confiance ${v.confiance} sur 10">${crans}</span>
      <span class="el-x15 t2 chiffres">${v.confiance}/10</span></div>
    ${v.combines && !compact ? `${filet}${lien("Lui proposer une combine", v.detailCombine, { action: "feuilleCombineDuo", icone: "amis", teinte: "var(--controles)" })}` : ""}
    ${v.ville && !compact ? `${filet}${lien(`Le rejoindre à ${v.ville.nom}`, `${Math.round(v.ville.km)} km ; choisis ton moyen`, { action: "rejoindreVille", donnees: { ville: v.ville.id }, icone: "carte", teinte: "var(--equipe)" })}` : ""}
    ${v.preuves.map((s) => `${filet}${lien(`Le signaler : ${s.texte}`, "Ta preuve d'inspection, anonymement", { action: "signalerPreuve", donnees: { sujet: s.id }, icone: "info", teinte: "var(--c-danger)" })}`).join("")}
    ${v.preuves.length && v.chantage ? `${filet}${lien("Le faire chanter", "Il paie ou tu le signales ; il ne saura pas qui", { action: "feuilleChantage", icone: SYMBOLES.enveloppe, teinte: "var(--c-danger)" })}` : ""}
    ${compact ? "" : `${filet}<div class="el-x22">${interrupteur("bloquerJoueur", v.bloque, "Bloquer", "Ses combines et ses invitations ne t'arrivent plus")}</div>`}`)}
    <p class="el-x13 aide">${esc(v.pied)}</p></div>`;
}

export function actionsFiche(p, v) {
  const nom = p.pseudo;
  return {
    // RNT-251 : le prêt, le rachat et le virement passent par Échanges.
    async proposerEchangeJoueur(ctx, b) { (await import("./echanges.js?v=3e8bddd9")).ouvrirComposer(ctx, b.dataset.id ?? p.id); },
    // D351 : « Prêter » se fait seulement dans Échanges › Prêt (la feuille du profil est retirée).
    async combinesJoueur(ctx) {
      // RNT-178 : la feuille « Combines » d'une cible, celle de la page Combines.
      const { pages } = await import("./combines.js?v=3e8bddd9");
      ctx.fermerFeuille();
      await pages.combines.actions.ouvrirCible(ctx, { dataset: { id: p.id } });
    },
    signalerInspection(ctx) {
      ctx.feuille({ titre: `Signaler ${nom} pour travail au noir ?`, contenu: `<div class="pile">
        ${aide(`S'il emploie des gens au noir, tu touches 25 % de son amende et il ne saura jamais que c'est toi. S'il est en règle, c'est toi qui prends une fausse accusation au casier : ${montant(v?.amendeFausseAccusation ?? 150_000)} au moins.`)}
        ${bouton("Signaler anonymement", "confirmerSignalement", { genre: "danger" })}</div>`, actions: {
        async confirmerSignalement(c) {
          const r = await L.denoncer(c, p.id);
          c.fermerFeuille();
          c.toast(r ?? "Signalement envoyé. L'inspection passera chez lui ; tu sauras le résultat par ton compte ou ton casier.", r ? "refus" : "gain");
        },
      } });
    },
    signalerComportement(ctx) {
      ctx.feuille({ titre: "Signaler un comportement", contenu: `<div class="pile">${["Pseudo choquant", "Triche", "Autre"].map((m) => bouton(m, "motifSignalement", { genre: "secondaire", donnees: { motif: m } })).join("")}</div>`, actions: {
        async motifSignalement(c, b) {
          try { await L.signaler(p.id, b.dataset.motif); c.toast("Merci : le signalement est transmis.", "gain"); } catch (e) { c.toast(e.message, "refus"); }
          c.fermerFeuille();
        },
      } });
    },
    copierJoueur(ctx) {
      const deja = L.monde.copies.some((x) => L.estMoi(x.copieur) && lc(x.copie) === lc(p.id));
      ctx.feuille({ titre: deja ? `Tu copies ${nom}` : `Copier ${nom}`, contenu: deja ? `<div class="pile">${aide("Arrêter la copie : tes positions copiées restent ouvertes, ou se ferment au cours.")}
          ${bouton("Arrêter et garder les positions", "arreter", { genre: "secondaire", donnees: { fermer: "0" } })}${bouton("Arrêter et tout fermer", "arreter", { genre: "danger", donnees: { fermer: "1" } })}</div>`
        : `<div class="pile">${aide("Chaque ordre qu'il passe en bourse passe aussi chez toi, à la taille de ton budget. Il touche 10 % de ce que ses ordres te font gagner.")}
          ${champEuros("budget-copie", { valeur: "5000", etiquette: "Budget" })}${bouton("Copier ses ordres", "copier")}</div>`, actions: {
        async copier(c) {
          const b = lireEuros("budget-copie");
          if (!b || b <= 0) return c.toast("Indique un budget.", "refus");
          const r = await L.copier(c, p.id, b);
          if (r) return c.toast(r, "refus");
          c.fermerFeuille(); c.toast(`Tu copies ${nom}`, "gain");
        },
        async arreter(c, b) {
          const r = await L.arreterCopie(c, p.id, b.dataset.fermer === "1");
          if (r) return c.toast(r, "refus");
          c.fermerFeuille(); c.toast("Copie arrêtée", "gain");
        },
      } });
    },
    feuilleCombineDuo(ctx) {
      let choisie = null, part = 0.5;
      const dessin = () => `<div class="el-x23 pile">
        ${aide("Le butin se partage selon la part que tu proposes ; il peut contre-proposer une fois. Pris, chacun choisit en secret de se taire ou de parler.")}
        ${carte(v.liste.map((c, k) => `${k ? filet : ""}<button class="ligne" data-action="choisirCombine" data-id="${esc(c.id)}" aria-pressed="${choisie === c.id}">
          <span class="pastille" style="--c:${c.duo ? "var(--controles)" : "var(--c-danger)"}">${icones.amis}</span>
          <span class="el-x2"><div class="titre">${esc(c.nom)}</div><div class="detail">${esc(c.detail)}</div></span>
          <span class="el-radio ${choisie === c.id ? "oui" : ""}"></span></button>`).join(""))}
        ${v.enRoute ? aide("En route ensemble : le risque baisse de 30 %.") : ""}
        <div class="libelle">Ta part</div>${pilules("partCombine", v.parts.map((x) => [x, `${Math.round(x * 100)} %`]), part)}
        ${bouton(`Proposer à ${esc(nom)}`, "proposerCombine", { genre: "teinte", teinte: "var(--controles)", desactive: !choisie })}</div>`;
      ctx.feuille({ titre: `Combine avec ${nom}`, rendu: dessin, actions: {
        choisirCombine(c, b) { choisie = b.dataset.id; c.redessiner(); },
        partCombine(c, b) { part = Number(b.dataset.valeur); c.redessiner(); },
        async proposerCombine(c) {
          const r = await L.proposerCombine(c, choisie, part, p.id);
          if (r) return c.toast(r, "refus");
          c.fermerFeuille(); c.toast("Proposition envoyée", "gain");
        },
      } });
    },
    feuilleChantage(ctx) {
      let m = v.montantsChantage[1];
      ctx.feuille({ titre: `Faire chanter ${nom}`, rendu: () => `<div class="el-x23 pile">
        ${aide("Il a 24 h. Il paie : l'argent est à toi et tu ne peux plus le signaler pendant deux semaines. Il refuse : le signalement part, à ton nom pour l'inspection, jamais pour lui.")}
        ${pilules("montantChantage", v.montantsChantage.map((x) => [x, montant(x)]), m)}
        ${bouton("Envoyer anonymement", "envoyerChantage", { genre: "teinte", teinte: "var(--c-danger)" })}</div>`, actions: {
        montantChantage(c, b) { m = Number(b.dataset.valeur); c.redessiner(); },
        async envoyerChantage(c) {
          const r = await L.faireChanter(c, p.id, m);
          if (r) return c.toast(r, "refus");
          c.fermerFeuille(); c.toast("Message envoyé", "gain");
        },
      } });
    },
    signalerPreuve(ctx, b) {
      const sujet = b.dataset.sujet;
      ctx.feuille({ titre: "Le signaler à l'inspection ?", contenu: `<div class="pile">${aide("Fondé, tu touches 25 % de son amende ; il ne saura pas que c'est toi. La preuve est usée.")}
        ${bouton("Signaler anonymement", "confirmerPreuve", { genre: "danger" })}</div>`, actions: {
        async confirmerPreuve(c) {
          const r = await L.denoncerSujet(c, p.id, sujet);
          c.fermerFeuille(); c.toast(r ?? "Signalement envoyé", r ? "refus" : "gain");
        },
      } });
    },
    async bloquerJoueur(ctx) {
      const r = await L.bloquer(ctx, p.id, !v.bloque);
      if (r) return ctx.toast(r, "refus");
      v.bloque = !v.bloque;
      ctx.redessiner();
    },
    rejoindreVille(ctx, b) {
      ctx.fermerFeuille();
      ctx.ouvrir("monde", { ville: b.dataset.ville });
    },
  };
}

// MARK: - Les pages

/** La partie d'un monde visée : celle demandée, sinon le monde ouvert, sinon le premier monde en cours. */
const cibleDe = (parties, emp) => {
  const enLigne = parties.filter((x) => x.enLigne && !x.terminee);
  return (emp ? enLigne.find((x) => x.emplacement === emp) : null) ?? enLigne.find((x) => x.ouverte) ?? enLigne[0] ?? null;
};

/** RNT-266 : le résumé et les membres (FicheMonde, dans le moteur), comme l'iPhone. */
async function fiche(ctx, cible, trouve, profils) {
  const fi = await ctx.jouer("enLigne.ficheMonde", { profils, monde: trouve?.monde ?? null, createur: L.monde.options?.admin ?? trouve?.monde?.createur ?? null,
    jour: cible.jour, duree: cible.duree, moi: cible.enLigne.joueur }, { silencieux: true });
  return { fiche: fi, tous: profils };
}

const pageEnLigne = {
  titre: "Monde en ligne",
  css: "enligne", // lot A : css/pages/enligne.css, pour toutes les pages de ce fichier (social.js compris)
  async donnees(ctx, p) {
    const parties = (await ctx.jouer("parties", {}, { silencieux: true }))?.parties ?? [];
    const cible = cibleDe(parties, p?.emplacement);
    if (!cible) return { aucun: true, parties };
    const bal = await ctx.balance("entreprises");
    const base = { parties, cible, villes: bal?.villes ?? [], secteurs: bal?.secteurs ?? [], profils: [] };
    // D215 : un monde où l'on ne joue pas en ce moment ne s'ouvre pas tout seul : on le montre, « Jouer ici ».
    if (!cible.ouverte) {
      const trouve = ctx.etat.compte && !ctx.etat.horsLigne ? await L.trouver(cible.enLigne.code).catch(() => null) : null;
      return { ...base, enCours: false, trouve, ...(await fiche(ctx, cible, trouve, trouve?.profils ?? [])) };
    }
    if (Date.now() - f.synchroLe > 20_000) { f.synchroLe = Date.now(); await L.synchroniser(ctx, { force: true }); }
    const [e, cl, vis, entre, prestige] = await Promise.all([
      L.etatPartie(ctx), ctx.jouer("enLigne.classements", { profils: L.monde.profils }, { silencieux: true }),
      ctx.jouer("enLigne.visibilite", {}, { silencieux: true }), ctx.jouer("enLigne.entreJoueurs", { interactions: L.monde.interactions }, { silencieux: true }),
      ctx.tableau("prestige"), // D441 : mon rang, les règles des rangs, la note du monde
    ]);
    if (!e) return { ...base, enCours: false };
    // RNT-281 : l'événement de la semaine et la rumeur du dimanche, pour le Fil (D352 : la Feuille est fondue dans la Gazette).
    await L.chargerEvenements(ctx).catch(() => null);
    // RNT-266 : le monde trouvé (places, arrivées, créateur), une fois par minute au plus.
    if (!f.trouve || f.trouve.monde.code !== cible.enLigne.code || Date.now() - f.trouveLe > 60_000) {
      f.trouve = await L.trouver(cible.enLigne.code).catch(() => f.trouve);
      f.trouveLe = Date.now();
    }
    // D441 : le classement Général, lu au plus une fois par minute quand l'onglet est ouvert.
    if (f.general && (!f.generalLu || Date.now() - f.generalLu.le > 60_000)) f.generalLu = { le: Date.now(), c: await L.classementGeneral() };
    return { ...base, enCours: true, e, prestige, general: f.generalLu?.c ?? null, profils: L.monde.profils, classements: cl?.classements ?? [], visibilite: vis, entre,
      ...(await fiche(ctx, cible, f.trouve?.monde?.code === cible.enLigne.code ? f.trouve : null, L.monde.profils)) };
  },
  rendu(d, ctx) {
    const titre = d.cible?.enLigne?.nom ?? "Monde en ligne";
    const corps = d.aucun ? aucunMonde()
      : ctx.etat.horsLigne && d.enCours ? `${vide("Pas de connexion : le monde revient quand le réseau revient. Ta partie, elle, continue.")}${quitter(d.cible)}`
      : ficheMonde(d, ctx);
    return `${entetePousse(d.aucun ? "Monde en ligne" : titre)}<div class="el-x24 pile">${corps}</div>`;
  },
  tic(ctx, d) {
    // Comme l'iPhone : on republie et on relit au plus une fois par minute pendant qu'on regarde le monde.
    if (d?.enCours && Date.now() - L.monde.derniere > 60_000) L.synchroniser(ctx).then((ok) => { if (ok) ctx.rafraichir(); });
    // D218 : le fil se relit seul toutes les 8 s (L.synchroniserFil le cadence) ; redessiné s'il a changé.
    if (d?.enCours && f.ouverts.has("fil")) {
      const avant = `${L.monde.fil[0]?.id ?? 0}|${L.monde.fil.length}|${L.monde.synchroFil?.libelle(Date.now()) ?? ""}`;
      L.synchroniserFil(ctx).then(() => {
        if (`${L.monde.fil[0]?.id ?? 0}|${L.monde.fil.length}|${L.monde.synchroFil?.libelle(Date.now()) ?? ""}` !== avant) ctx.redessiner();
      });
    }
  },
  actions: {
    // RNT-266 : ouvrir ou replier une section de la fiche.
    // RNT-278 : une tuile du haut ouvre sa section et y descend.
    versSection(ctx, b) {
      const id = b.dataset.valeur; f.ouverts.add(id); ctx.redessiner();
      requestAnimationFrame(() => document.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },
    ongletMonde(ctx, b) { const id = b.dataset.valeur; if (!f.ouverts.delete(id)) f.ouverts.add(id); ctx.redessiner(); },
    async copierCode(ctx, b) {
      try { await navigator.clipboard.writeText(b.dataset.code); ctx.toast("Code copié", "gain"); } catch { ctx.toast(`Le code : ${b.dataset.code}`, "info"); }
    },
    partagerCode: (ctx, b) => partager(ctx, b.dataset.code, b.dataset.nom),
    choisirClassement(ctx, el) { f.classement = el.value; ctx.redessiner(); },
    async choisirPortee(ctx, b) { f.general = b.dataset.valeur === "general"; await ctx.rafraichir(); }, // D441
    versCreer: (ctx) => ctx.ouvrir("creerMonde", { n: Date.now() }),
    inviterMonde: (ctx, b) => inviterMonde(ctx, b),
    async jouerIci(ctx, b) {
      await ctx.jouer("parties.changer", { emplacement: b.dataset.emplacement });
      await ctx.jouer("etat", {}, { silencieux: true });
      ctx.sauvegarder();
      f.synchroLe = 0;
      await ctx.rafraichir();
    },
    quitterMonde: (ctx, b) => feuilleQuitter(ctx, b.dataset.emplacement, b.dataset.nom),
    ficheJoueur: (ctx, b) => ouvrirFiche(ctx, b.dataset.id),
    async precision(ctx, b) { await ctx.jouer("enLigne.visibilite", { precision: b.dataset.valeur }); await L.synchroniser(ctx, { force: true }); ctx.rafraichir(); },
    async publicVise(ctx, b) {
      const v = await ctx.jouer("enLigne.visibilite", {}, { silencieux: true });
      await ctx.jouer("enLigne.visibilite", { precision: v.precision, public: b.dataset.valeur });
      await L.synchroniser(ctx, { force: true });
      ctx.rafraichir();
    },
    async repondrePret(ctx, b) {
      const r = await L.repondrePret(ctx, Number(b.dataset.id), b.dataset.oui === "1");
      if (r) ctx.toast(r, "refus"); else ctx.rafraichir();
    },
    async prendreLocation(ctx, b) {
      const l = L.monde.locations.find((x) => x.bien === b.dataset.id);
      const r = l ? await L.prendreLocation(ctx, l) : "Ce logement vient d'être pris.";
      ctx.toast(r ?? "Tu y habites", r ? "refus" : "gain");
      ctx.rafraichir();
    },
    async arreterCopie(ctx, b) {
      const r = await L.arreterCopie(ctx, b.dataset.id, false);
      ctx.toast(r ?? "Copie arrêtée", r ? "refus" : "gain");
      ctx.rafraichir();
    },
    feuilleSuccursale: (ctx, b) => feuilleSuccursale(ctx, b.dataset.id),
    ...actionsLoyer, // D116 : renégocier le loyer du logement d'un joueur où j'habite
  },
};

/** D215 : quitter un monde (Tes parties › Y mettre fin) : la partie s'arrête, sans palmarès ; les autres continuent. */
export function feuilleQuitter(ctx, emplacement, nom, { apres = (c) => c.retour() } = {}) {
  const solo = emplacement === "locale";
  ctx.feuille({ titre: solo ? "Mettre fin à ta partie solo ?" : `Quitter « ${nom} » ?`, contenu: `<div class="pile">
    ${aide(`${solo ? "Elle s'arrête" : "Ta partie dans ce monde s'arrête"} sans entrer au palmarès. Tes autres parties ne bougent pas.`)}
    ${bouton(solo ? "Y mettre fin" : "Quitter ce monde", "confirmerQuitter", { genre: "danger" })}</div>`, actions: {
    async confirmerQuitter(c) {
      await c.jouer("parties.abandonner", { emplacement });
      c.fermerFeuille();
      c.sauvegarder();
      c.toast(solo ? "Partie solo terminée" : `Tu as quitté « ${nom} »`, "info");
      await apres(c);
    },
  } });
}

/** Ouvrir une succursale (FeuilleSuccursale) : la boîte qu'on aurait, ce qu'elle coûte, ce qu'elle doit. */
async function feuilleSuccursale(ctx, id) {
  const fr = L.monde.franchises.find((x) => x.id === id);
  if (!fr) return;
  const [a, bal] = await Promise.all([ctx.jouer("enLigne.succursale.apercu", { franchise: fr }, { silencieux: true }), ctx.balance("entreprises")]);
  const ville = bal?.villes?.find((v) => v.id === a?.ville)?.nom ?? a?.ville ?? "";
  const ligneS = (t, v, fort = false) => `<div class="el-x25 rangee entre"><span class="t2">${t}</span><span class="chiffres" style="font-size:${fort ? 17 : 15}px;font-weight:${fort ? 700 : 600};text-align:right">${v}</span></div>`;
  ctx.feuille({ titre: `Succursale ${fr.marque}`, contenu: `<div class="el-x3 pile">
    ${aide(`La marque de ${esc(L.pseudoDe(fr.franchiseur))}, dans ta ville.`)}
    ${carte([ligneS("Ville", esc(ville)), ligneS("Redevance", `${pct(fr.redevance)} du chiffre, chaque dimanche`), ligneS("Droit d'entrée", fr.droitEntree === 0 ? "offert" : montant(fr.droitEntree)),
      ligneS("À payer maintenant", a?.cout != null ? montant(a.cout) : "—", true)].join(filet))}
    ${aide("C'est ta boîte : tu la gères, tu touches son bénéfice. La redevance sort de sa trésorerie le dimanche, avant l'impôt. La vendre ou la fermer met fin au contrat.")}
    ${bouton(`Ouvrir une succursale à ${esc(ville)}`, "ouvrirSuccursale")}</div>`, actions: {
    async ouvrirSuccursale(c) {
      const r = await L.ouvrirSuccursale(c, fr);
      if (r === "annule") return;
      if (r) return c.toast(r, "refus");
      c.fermerFeuille(); c.toast(`Succursale ${fr.marque} ouverte`, "gain"); c.rafraichir();
    },
  } });
}

// MARK: - Bourse du monde (EcranBourseMonde)

/** RNT-136 : chercher, trier et filtrer les boîtes des joueurs (EtatListe(tri: "miennes")) ; les filtres se combinent. */
const bourse = { recherche: "", tri: "miennes", croissant: true, filtres: new Set(), parPatron: false, replies: new Set() };
const TRIS_BOURSE = [
  { id: "miennes", nom: "Les miennes d'abord", croissant: true },
  // RNT-259 (D245) : capitalisation, variation et patron (CoteMonde.trier).
  { id: "capitalisation", nom: "Capitalisation", croissant: false }, { id: "variation", nom: "Variation", croissant: false },
  { id: "patron", nom: "Patron", croissant: true }, { id: "valeur", nom: "Valeur", croissant: false },
  { id: "benefice", nom: "Bénéfice", croissant: false }, { id: "rendement", nom: "Rendement", croissant: false },
  { id: "action", nom: "Prix du pour-cent", croissant: true }, { id: "nom", nom: "Nom", croissant: true },
];
const FILTRES_BOURSE = [["miennes", "Mes boîtes", icones.personne], ["autres", "Des autres", icones.amis], ["cotees", "Cotées", icones.marches], ["benef", "Bénéficiaires", SYMBOLES.haut]];
const S_TRI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5"/></svg>';
const S_LOUPE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';

/** Les boîtes visibles, cherchées, filtrées, triées comme l'iPhone ; `tous` : avant la recherche. */
function titresBourse(d, ctx) {
  const m = L.monde.marche, moi = lc(d.e.moi), t0 = ctx.maintenant();
  // RNT-155 : une boîte vendue ou fermée laisse son titre ; on la cache si son propriétaire ne l'a plus, sauf si l'on en détient.
  const vivants = (m.titres ?? []).filter((t) => {
    // RNT-275 : la Bourse ne liste que les titres cotés, et ceux dont des parts sont en vente ou dont je détiens des parts chez un autre.
    if (!t.cote && !(m.offres ?? []).some((o) => o.titre === t.id) && !(lc(t.proprietaire) !== moi && L.detenu(m, t.id) > 0)) return false;
    if (lc(t.proprietaire) === moi) return true;
    const p = L.monde.profils.find((x) => lc(x.id) === lc(t.proprietaire));
    return !p || (p.boites ?? []).some((b) => b.nom === t.nom) || L.detenu(m, t.id) > 0;
  });
  const tous = [...vivants.filter((t) => lc(t.proprietaire) === moi), ...vivants.filter((t) => lc(t.proprietaire) !== moi)];
  const q = lc(bourse.recherche.trim());
  const f = bourse.filtres;
  const base = tous.filter((t) => !q || [t.nom, L.pseudoDe(t.proprietaire), nomVille(d, t.ville), nomSecteur(d, t.secteur)].some((x) => lc(x).includes(q)))
    .filter((t) => !f.has("miennes") || lc(t.proprietaire) === moi).filter((t) => !f.has("autres") || lc(t.proprietaire) !== moi)
    .filter((t) => !f.has("cotees") || t.cote).filter((t) => !f.has("benef") || t.beneficeSemaine > 0);
  const cles = { valeur: (t) => t.valeur, benefice: (t) => t.beneficeSemaine, action: (t) => L.prixAction(t, t0), rendement: (t) => t.beneficeSemaine / Math.max(1, t.valeur),
    capitalisation: (t) => L.capitalisation(t), variation: (t) => L.variation(t, t0) };
  const sens = bourse.croissant ? 1 : -1;
  const cle = cles[bourse.tri];
  const parNom = (a, b) => a.nom.localeCompare(b.nom, "fr", { numeric: true });
  // Par patron : de A à Z ; chez un même patron, la plus grosse capitalisation d'abord.
  const titres = cle ? [...base].sort((a, b) => sens * (cle(a) - cle(b)) || parNom(a, b))
    : bourse.tri === "patron" ? [...base].sort((a, b) => sens * L.pseudoDe(a.proprietaire).localeCompare(L.pseudoDe(b.proprietaire), "fr", { sensitivity: "base" })
      || L.capitalisation(b) - L.capitalisation(a) || parNom(a, b))
    : bourse.tri === "nom" ? [...base].sort((a, b) => sens * parNom(a, b)) : base;
  return { tous, titres };
}

/** RNT-259 : les titres déjà triés, regroupés par patron dans l'ordre de leur premier titre (CoteMonde.grouper). */
function groupesBourse(titres) {
  const groupes = new Map();
  for (const t of titres) {
    const p = lc(t.proprietaire);
    if (!groupes.has(p)) groupes.set(p, { patron: t.proprietaire, titres: [], cap: 0 });
    const g = groupes.get(p);
    g.titres.push(t);
    g.cap += L.capitalisation(t);
  }
  return [...groupes.values()];
}

/** RNT-259 : la liste d'attente d'introduction, quand la cote du monde est pleine. */
function fileBourse(m, moi) {
  const file = L.fileAttente(m);
  if (!file.length) return "";
  return carte(`<div class="pile el-pile10"><div class="libelle">Liste d'attente d'introduction</div>
    ${aide(`La bourse du monde est pleine (${L.PAR_MONDE} titres) : la première inscrite entre dès qu'une place se libère.`)}
    ${file.map((a, k) => { const t = m.titres.find((x) => x.id === a.titre); return `<div class="rangee el-file">
      <span class="chiffres or el-file-rang">${k + 1}</span><div class="el-offre-texte"><div class="el-offre-titre">${esc(t?.nom ?? "Une boîte")}</div>
      <div class="aide">${lc(a.joueur) === moi ? "Toi" : nomJ(a.joueur)}, ${pct(a.actions / Math.max(1, t?.actions ?? 1))} mis en bourse</div></div>
      ${lc(a.joueur) === moi ? petit("Quitter", "quitterFile", { donnees: { titre: a.titre } }) : ""}</div>`; }).join("")}</div>`, { pad: true });
}

/** BarreListe : la recherche, le tri (critère et sens), les pastilles de filtre, le compte. */
function barreBourse(n) {
  const t = TRIS_BOURSE.find((x) => x.id === bourse.tri);
  return `<div class="so-barre-liste">
    <div class="rangee so-barre-haut"><label class="carte so-recherche">${S_LOUPE}<input id="bourse-q" type="search" placeholder="Boîte, joueur, ville, métier" value="${esc(bourse.recherche)}" data-saisie="chercherTitre" autocomplete="off" enterkeyhint="search" aria-label="Chercher"></label>
      <button class="carte so-tri" data-action="menuTriBourse" aria-label="Trier par ${esc(t?.nom ?? "")}, ${bourse.croissant ? "croissant" : "décroissant"}">${S_TRI}<span>${esc(t?.nom ?? "Trier")}</span></button></div>
    <div class="so-defile" role="group" aria-label="Filtres">${FILTRES_BOURSE.map(([id, nom, ic]) => `<button class="so-filtre" data-action="filtrerTitres" data-valeur="${id}" aria-pressed="${bourse.filtres.has(id)}">${ic}<span>${nom}</span></button>`).join("")}</div>
    <div class="rangee so-compte" id="bourse-compte">${compteBourse(n)}</div>
    <div class="rangee el-cote"><span class="aide">${(L.monde.marche.titres ?? []).filter((t) => t.cote).length} / ${L.PAR_MONDE} titres cotés</span><span class="espace"></span>
      <button class="so-filtre" data-action="parPatron" aria-pressed="${bourse.parPatron}">${icones.amis}<span>Par patron</span></button></div></div>`;
}
const compteBourse = (n) => `<span class="chiffres">${n} boîte${n > 1 ? "s" : ""}</span><span class="espace"></span>${bourse.filtres.size || bourse.recherche ? `<button data-action="effacerBourse">Tout effacer</button>` : ""}`;

/** RNT-229 : le prix d'une revente, en multiple de la valeur calculée de la boîte (50 % à 300 %). */
const PRIX_REVENTE = [[0.5, "−50 %"], [0.8, "−20 %"], [1, "Valeur"], [1.25, "+25 %"], [1.5, "+50 %"], [2, "×2"], [3, "×3"]];
const prixRevente = (t, k) => L.valeurAction(t) * Math.min(L.BORNES_PRIX[1], Math.max(L.BORNES_PRIX[0], k));

const pageBourse = {
  titre: "Bourse du monde",
  async donnees(ctx) {
    // Comme l'iPhone (.task { publierEnLigne(force: true) }) : le marché relu à l'ouverture, au plus toutes les 15 s.
    await L.synchroniser(ctx, { force: Date.now() - L.monde.derniere > 15_000 });
    const [e, bal] = await Promise.all([L.etatPartie(ctx), ctx.balance("entreprises")]);
    return { e, villes: bal?.villes ?? [], secteurs: bal?.secteurs ?? [] };
  },
  rendu(d, ctx) {
    if (!d.e) return `${entetePousse("Bourse du monde")}${vide("La bourse du monde s'ouvre dans un monde en ligne.")}`;
    const m = L.monde.marche, moi = lc(d.e.moi), t0 = ctx.maintenant();
    const { tous, titres } = titresBourse(d, ctx);
    const recues = (m.rachats ?? []).filter((r) => lc(r.vendeur) === moi), envoyees = (m.rachats ?? []).filter((r) => lc(r.acheteur) === moi);
    const pctR = (r) => pct(r.actions / Math.max(1, (m.titres.find((t) => t.id === r.titre)?.actions ?? 1)), 1);
    const nomT = (id, defaut) => m.titres.find((t) => t.id === id)?.nom ?? defaut;
    const rachats = recues.length || envoyees.length ? carte(`<div class="el-x26 pile"><div class="libelle">Propositions de rachat</div>
      ${recues.map((r) => `<div class="el-x27 pile"><div class="el-x28">${nomJ(r.acheteur)} veut ${pctR(r)} de ${esc(nomT(r.titre, "ta boîte"))}</div>
        ${aide(`${montant(r.montant)}, déjà payés : tu les reçois si tu acceptes.`)}
        <div class="rangee">${petit("Accepter", "repondreRachat", { plein: true, donnees: { id: r.id, oui: "1" } })}${petit("Refuser", "repondreRachat", { donnees: { id: r.id, oui: "0" } })}</div></div>`).join("")}
      ${envoyees.map((r) => `<div class="el-x26 rangee"><div class="el-x6"><div class="el-x29">À ${nomJ(r.vendeur)} : ${pctR(r)} de ${esc(nomT(r.titre, "sa boîte"))}</div>
        ${aide(`${montant(r.montant)} mis de côté, en attente de sa réponse.`)}</div>${petit("Retirer", "retirerRachat", { donnees: { id: r.id } })}</div>`).join("")}</div>`, { pad: true }) : "";
    const carteTitre = (t) => {
      const det = L.detenu(m, t.id), un = Math.floor(t.actions / 100), prix = L.prixAction(t, t0), fl = L.flottant(m, t.id);
      const offres = (m.offres ?? []).filter((o) => o.titre === t.id && lc(o.vendeur) !== moi);
      const miennes = (m.offres ?? []).filter((o) => o.titre === t.id && lc(o.vendeur) === moi);
      const mien = lc(t.proprietaire) === moi;
      // RNT-229 : le rendement pour l'acheteur (dividende net d'une semaine / prix), la réserve de 24 h du patron.
      const rend = (prixA) => { const x = L.rendementSemaine(t, prixA); return x > 0 ? `${pct(x, 2)} par an de jeu` : "pas de dividende cette semaine"; };
      const fiche = (m.dividendes ?? []).find((x) => x.titre === t.id);
      const heure = (ms) => new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
      const autres = (m.detentions ?? []).filter((x) => x.titre === t.id && x.actions > 0 && lc(x.joueur) !== moi);
      return carte(`<div class="el-x26 pile">
        <div class="el-x30 rangee"><div class="el-x2"><div class="libelle">${esc(t.nom)}</div>
          <div class="aide">${mien ? esc(L.pseudoDe(t.proprietaire)) : nomJ(t.proprietaire)}, ${esc(nomSecteur(d, t.secteur))}, ${esc(nomVille(d, t.ville))}</div></div>
          <div class="el-x14"><div class="el-x31 chiffres">${montant(Math.round(prix * un))}</div><div class="aide">${t.cote ? "le pour-cent, en bourse" : "le pour-cent"}</div></div></div>
        ${L.premierJour(t, t0) ? `<div class="el-x7 or">Premier jour de cotation : le cours s'agite et chaque ordre pèse double</div>` : ""}
        ${mien ? `<div class="pile el-pile6"><div class="gain el-gain13">Ta boîte : tu en détiens ${pct(det / t.actions, 1)}.</div>
            ${autres.map((x) => `<div class="el-x27 rangee"><span class="el-x6 aide">${nomJ(x.joueur)} en détient ${pct(x.actions / t.actions, 1)}.</span>${petit("Proposer un rachat", "rachatEchange", { donnees: { id: x.joueur } })}</div>`).join("")}
            ${fl > 0 ? aide(`${pct(fl / t.actions, 1)} sont en bourse : « Acheter » les rachète au cours.`) : ""}
            ${autres.length && !offres.length && fl <= 0 ? aide("Un rachat se propose dans Échanges : ses parts contre ton argent ; il peut refuser ou contre-proposer.") : ""}</div>`
          : det > 0 ? `<div class="pile el-pile6"><div class="gain el-gain13">Tu détiens ${pct(det / t.actions, 1)}, soit ${montant(Math.round(det * prix))}. Dividende chaque lundi : ta part de son bénéfice de la semaine, moins 30 % de précompte.</div>
            <div class="grille2 el-grille8">${[["Reçus en tout", montant(fiche?.total ?? 0)], ["Rendement", rend(prix)],
              ["Dernier versement", fiche?.dernier ? montant(fiche.dernier) : "pas encore"], ["Versements", String(fiche?.versements ?? 0)]]
              .map(([g, v]) => `<div class="carte el-case"><div class="aide">${g}</div><div class="chiffres el-chiffre15">${esc(v)}</div></div>`).join("")}</div></div>` : ""}
        ${t.cote ? `<div class="el-x11 rangee">${petit("Acheter", "ordreMonde", { plein: true, donnees: { titre: t.id, sens: "achat" }, desactive: fl <= 0 })}${petit("Vendre", "ordreMonde", { donnees: { titre: t.id, sens: "vente" }, desactive: det <= 0 })}
          <span class="espace"></span><span class="aide">${pct(fl / t.actions, 1)} en bourse</span></div>` : ""}
        ${offres.map((o) => { const reserve = mien ? null : L.reservePatron(m, o, t0); return `<div class="rangee el-offre"><div class="el-offre-texte"><div class="el-offre-titre">${pct(o.actions / t.actions, 1)} proposés par ${nomJ(o.vendeur)}</div>
          <div class="aide">${montant(Math.round(o.prixAction * un))} le pour-cent, ${montant(Math.round(o.prixAction * o.actions))} le tout · rendement ${rend(o.prixAction)}</div>
          ${reserve ? `<div class="aide or">Réservé au patron jusqu'à ${heure(reserve)}</div>` : mien && L.reservePatron(m, o, t0) ? `<div class="aide or">Tu as la priorité jusqu'à ${heure(L.reservePatron(m, o, t0))}</div>` : ""}</div>
          ${petit("Acheter", "acheterOffre", { plein: true, donnees: { id: o.id }, desactive: !!reserve })}</div>`; }).join("")}
        ${miennes.map((o) => `<div class="rangee el-offre"><div class="el-offre-texte"><div class="el-offre-titre">Tu proposes ${pct(o.actions / t.actions, 1)}</div>
          <div class="aide">${montant(Math.round(o.prixAction * un))} le pour-cent, pas encore vendus</div></div>${petit("Retirer de la vente", "retirerParts", { donnees: { id: o.id } })}</div>`).join("")}
        ${det > 0 && !mien ? `<button class="el-lien" data-action="ordreMonde" data-titre="${esc(t.id)}" data-sens="revente">Revendre des parts aux joueurs</button>` : ""}
      </div>`, { pad: true });
    };
    // Au grand écran, les boîtes se rangent en grille (deux colonnes dès que la page a la place).
    return `${entetePousse("Bourse du monde")}<div class="so-page"><div class="pile so-pile">
      ${rachats}
      ${tous.length ? barreBourse(titres.length) : aide("Aucune boîte de joueur n'a encore ouvert son capital. Ouvre le tien depuis la fiche d'une de tes boîtes.")}
      ${fileBourse(m, moi)}
      <div class="${bourse.parPatron ? "pile el-groupes" : "so-grille"}" id="bourse-liste">${tous.length && !titres.length ? aide("Aucune boîte ne correspond.")
        : !bourse.parPatron ? titres.map(carteTitre).join("")
        : groupesBourse(titres).map((g) => { const replie = bourse.replies.has(lc(g.patron)), n = g.titres.length;
          return `<section class="pile el-groupe"><button class="rangee el-groupe-tete" data-action="replierPatron" data-patron="${esc(lc(g.patron))}" aria-expanded="${!replie}">
            <span class="el-chevron" aria-hidden="true">${icones.chevron}</span><span class="libelle">${lc(g.patron) === moi ? "Toi" : esc(L.pseudoDe(g.patron))}</span>
            <span class="aide">${n} boîte${n > 1 ? "s" : ""}</span><span class="espace"></span><span class="chiffres t2">${montant(Math.round(g.cap))}</span></button>
            ${replie ? "" : `<div class="so-grille">${g.titres.map(carteTitre).join("")}</div>`}</section>`; }).join("")}</div></div></div>`;
  },
  tic(ctx, d) { if (L.monde.marche.titres?.some((t) => L.premierJour(t, ctx.maintenant())) && Date.now() % 5000 < 1000) ctx.redessiner(); },
  actions: {
    chercherTitre(ctx, el, d) {
      // La saisie ne se redessine pas (on garde le curseur) : seuls la liste et le compte changent.
      bourse.recherche = el.value;
      const tmp = document.createElement("div");
      tmp.innerHTML = pageBourse.rendu(d, ctx);
      for (const id of ["bourse-liste", "bourse-compte"]) {
        const neuf = tmp.querySelector(`#${id}`), vieux = document.getElementById(id);
        if (neuf && vieux) vieux.innerHTML = neuf.innerHTML;
      }
    },
    filtrerTitres(ctx, b) {
      const f = b.dataset.valeur;
      if (bourse.filtres.has(f)) bourse.filtres.delete(f); else bourse.filtres.add(f);
      ctx.redessiner();
    },
    parPatron(ctx) { bourse.parPatron = !bourse.parPatron; ctx.redessiner(); },
    replierPatron(ctx, b) {
      const p = b.dataset.patron;
      if (bourse.replies.has(p)) bourse.replies.delete(p); else bourse.replies.add(p);
      ctx.redessiner();
    },
    async quitterFile(ctx, b) {
      const r = await L.quitterAttente(ctx, b.dataset.titre);
      ctx.toast(r ?? "Tu quittes la liste d'attente", r ? "refus" : "info");
      ctx.rafraichir();
    },
    effacerBourse(ctx) { bourse.filtres.clear(); bourse.recherche = ""; const q = document.getElementById("bourse-q"); if (q) q.value = ""; ctx.redessiner(); },
    menuTriBourse(ctx) {
      // Le menu de tri de BarreListe : un critère (dans son sens naturel), et le sens.
      ctx.feuille({ titre: "Trier par", rendu: () => `<div class="pile so-pile">${carte(TRIS_BOURSE.map((t, k) => `${k ? filet : ""}<button class="ligne" data-action="choisirTriBourse" data-valeur="${t.id}" aria-pressed="${bourse.tri === t.id}">
          <span class="so-flex titre">${esc(t.nom)}</span>${bourse.tri === t.id ? `<span class="so-coche">${SYMBOLES.coche}</span>` : ""}</button>`).join(""))}
        ${carte(`<button class="ligne" data-action="sensTriBourse"><span class="so-flex titre">${bourse.croissant ? "Ordre croissant" : "Ordre décroissant"}</span><span class="so-coche">${bourse.croissant ? SYMBOLES.haut : SYMBOLES.bas}</span></button>`)}</div>`,
      actions: {
        choisirTriBourse(c, b) {
          const id = b.dataset.valeur;
          if (id !== bourse.tri) bourse.croissant = TRIS_BOURSE.find((t) => t.id === id)?.croissant ?? true;
          bourse.tri = id;
          c.fermerFeuille(); c.redessiner();
        },
        sensTriBourse(c) { bourse.croissant = !bourse.croissant; c.redessiner(); },
      } });
    },
    async acheterOffre(ctx, b) {
      const o = L.monde.marche.offres.find((x) => x.id === Number(b.dataset.id));
      if (!o) return;
      const r = await L.acheterOffre(ctx, o, o.actions);
      if (r !== "annule") ctx.toast(r ?? "C'est fait", r ? "refus" : "gain");
      ctx.rafraichir();
    },
    retirerParts(ctx, b) {
      // RNT-229 : retirer tout ou une partie des parts invendues, sans frais.
      const o = L.monde.marche.offres.find((x) => x.id === Number(b.dataset.id));
      const t = o && L.monde.marche.titres.find((x) => x.id === o.titre);
      if (!o || !t) return;
      const maxPc = Math.max(0.1, (o.actions / t.actions) * 100);
      let pc = maxPc;
      ctx.feuille({ titre: "Retirer de la vente", rendu: () => `<div class="pile el-pile14">
          <div class="chiffres el-chiffre28">${pc.toFixed(1).replace(".", ",")} % du capital</div>
          <input type="range" min="0.1" max="${maxPc}" step="0.1" value="${pc}" data-saisie="pcRetrait" aria-label="Part retirée" class="el-curseur">
          ${pilules("pcRetraitRapide", [[maxPc, "Tout"], ...(maxPc > 1 ? [[maxPc / 2, "La moitié"]] : [])], pc)}
          ${aide("Sans frais : ces parts restent à toi. Le reste reste en vente au même prix.")}
          ${bouton("Retirer", "validerRetrait")}</div>`, actions: {
        pcRetrait(c, el) { pc = Number(el.value); majGardantCurseur(c); },
        pcRetraitRapide(c, el) { pc = Number(el.dataset.valeur); c.redessiner(); },
        async validerRetrait(c) {
          const actions = Math.min(o.actions, Math.round((pc / 100) * t.actions));
          c.fermerFeuille();
          const r = await L.retirerParts(c, o, actions >= o.actions ? null : actions);
          c.toast(r ?? "Retiré de la vente", r ? "refus" : "gain");
          c.rafraichir();
        },
      } });
    },
    async repondreRachat(ctx, b) {
      const r = await L.repondreRachat(ctx, { id: Number(b.dataset.id) }, b.dataset.oui === "1");
      ctx.toast(r ?? "C'est fait", r ? "refus" : "gain"); ctx.rafraichir();
    },
    async retirerRachat(ctx, b) {
      const r = await L.retirerRachat(ctx, { id: Number(b.dataset.id) });
      ctx.toast(r ?? "C'est fait", r ? "refus" : "gain"); ctx.rafraichir();
    },
    ordreMonde(ctx, b) {
      const t = L.monde.marche.titres.find((x) => x.id === b.dataset.titre);
      if (!t) return;
      const sens = b.dataset.sens;
      const max = sens === "achat" ? L.flottant(L.monde.marche, t.id) : L.detenu(L.monde.marche, t.id);
      const maxPct = Math.max(0.1, (max / t.actions) * 100);
      let pc = Math.min(1, maxPct), prime = sens === "revente" ? 1 : 0;
      const dessin = () => {
        const actions = Math.min(max, Math.round((pc / 100) * t.actions));
        const prix = sens === "revente" ? prixRevente(t, prime) : L.prixAction(t, ctx.maintenant());
        return `<div class="pile el-pile14">
          <div class="chiffres el-chiffre28">${pc.toFixed(1).replace(".", ",")} % du capital</div>
          <input type="range" min="0.1" max="${maxPct}" step="0.1" value="${pc}" data-saisie="pourcentOrdre" aria-label="Part du capital" class="el-curseur">
          ${pilules("pourcentRapide", [...[1, 5, 10, 25].filter((x) => x <= maxPct).map((x) => [x, `${x} %`]), [maxPct, "Tout"]], pc)}
          ${sens === "revente" ? `<div class="libelle">Prix demandé</div>${pilules("primeOrdre", PRIX_REVENTE, prime)}
            ${aide(`Entre la moitié et trois fois la valeur de la boîte. Pour l'acheteur : ${(() => { const x = L.rendementSemaine(t, prixRevente(t, prime)); return x > 0 ? `${pct(x, 2)} de dividende par an de jeu` : "pas de dividende cette semaine"; })()}. Le patron a 24 h de priorité.`)}` : ""}
          ${aide(`${actions.toLocaleString("fr-BE")} actions, environ ${montant(Math.round(actions * (sens === "revente" ? prix : L.prixAction(t, ctx.maintenant()))))}${sens === "revente" ? "" : ". Le cours bouge avec ton ordre : 10 % du capital le fait varier de 5 %."}`)}
          ${bouton(sens === "revente" ? "Mettre en vente" : sens === "achat" ? "Acheter" : "Vendre", "validerOrdre", { desactive: actions <= 0 })}</div>`;
      };
      ctx.feuille({ titre: sens === "revente" ? "Revendre aux joueurs" : sens === "achat" ? `Acheter ${t.nom}` : `Vendre ${t.nom}`, rendu: dessin, actions: {
        pourcentOrdre(c, el) { pc = Number(el.value); majGardantCurseur(c); },
        pourcentRapide(c, el) { pc = Number(el.dataset.valeur); c.redessiner(); },
        primeOrdre(c, el) { prime = Number(el.dataset.valeur); c.redessiner(); },
        async validerOrdre(c) {
          const actions = Math.min(max, Math.round((pc / 100) * t.actions));
          c.fermerFeuille();
          const r = sens === "revente" ? await L.revendre(c, t, actions, prixRevente(t, prime))
            : await L.bourse(c, t, sens === "achat" ? actions : -actions);
          if (r !== "annule") c.toast(r ?? "C'est fait", r ? "refus" : "gain");
          c.rafraichir();
        },
      } });
    },
    // D352 : une offre de rachat passe par Échanges (D349 : le propriétaire refuse ou contre-propose).
    async rachatEchange(ctx, b) { (await import("./echanges.js?v=3e8bddd9")).ouvrirComposer(ctx, b.dataset.id); },
  },
};

// MARK: - Entre joueurs (EcranPropositions)

const AVANCE = { fait: "var(--argent)", encours: "var(--or)", attente: "rgba(255,255,255,.2)", echec: "var(--c-danger)" };
const ICONE_SORTE = { combine: icones.amis, dilemme: icones.amis, inspection: icones.info, chantage: SYMBOLES.enveloppe, voyage: icones.carte };
const TEINTE_SORTE = { combine: "var(--controles)", dilemme: "var(--c-danger)", chantage: "var(--c-danger)", inspection: "var(--controles)", voyage: "var(--equipe)" };

function carteInteraction(x, maintenant) {
  const restant = x.expire ? Math.max(0, x.expire - maintenant) : 0;
  const av = x.avancement ? `<div class="el-avance">${x.avancement.map(([t, e], k) => `${k ? `<i style="background:${e === "attente" ? "rgba(255,255,255,.12)" : AVANCE[e]}"></i>` : ""}<b class="${e}" style="--c:${AVANCE[e]}"></b>`).join("")}</div>
    <div class="el-avance-t">${x.avancement.map(([t, e]) => `<span class="${e}">${esc(t)}</span>`).join("")}</div>` : "";
  return carte(`<div class="el-x23 pile">
    <div class="el-x30 rangee"><span class="pastille" style="--c:${TEINTE_SORTE[x.sorte]};width:38px;height:38px;border-radius:11px">${ICONE_SORTE[x.sorte]}</span>
      <div class="el-x2"><div class="el-x32">${lienJoueur(x.joueur, esc(x.titre))}</div><div class="aide">${esc(x.detail)}</div></div>
      ${restant ? `<span class="el-x33 t2 chiffres">${restant > 3_600_000 ? `${Math.floor(restant / 3_600_000)} h` : `${Math.ceil(restant / 60_000)} min`}</span>` : ""}</div>
    ${av}
    ${x.deja ? `<div class="el-x34 t2">${esc(x.deja)}</div>` : ""}
    ${x.actions.length ? `<div class="el-x35 rangee">${x.actions.map((a) => petit(esc(a.titre), "repondreInteraction", { teinte: a.categorie ? `var(--${a.categorie === "danger" ? "c-danger" : a.categorie})` : "", donnees: { id: x.id, geste: a.action } })).join("")}</div>` : ""}
    ${x.regle ? `<p class="el-x36 t2">${esc(x.regle)}</p>` : ""}
  </div>`, { pad: true });
}

const pagePropositions = {
  titre: "Entre joueurs",
  async donnees(ctx) {
    await L.synchroniser(ctx, { force: true });
    return { t: await ctx.jouer("enLigne.entreJoueurs", { interactions: L.monde.interactions }, { silencieux: true }) };
  },
  rendu(d, ctx) {
    const t = d.t;
    if (!t) return `${entetePousse("Entre joueurs")}${vide("Rien entre vous pour l'instant.")}`;
    const n = ctx.maintenant();
    return `${entetePousse("Entre joueurs")}<div class="el-x37 pile">
      ${!t.aTraiter.length && !t.enCours.length && !t.historique.length ? vide("Rien entre vous pour l'instant. Touche le nom d'un joueur pour lui proposer une combine ou un voyage.") : ""}
      ${t.aTraiter.length ? `<div class="el-x38 libelle">À toi de répondre</div>${t.aTraiter.map((x) => carteInteraction(x, n)).join("")}` : ""}
      ${t.enCours.length ? `<div class="el-x38 libelle">Tes propositions</div>${t.enCours.map((x) => carteInteraction(x, n)).join("")}` : ""}
      ${t.historique.length ? `<div><div class="el-x4 section">Historique</div>${carte(t.historique.map((h, k) => `${k ? filet : ""}<div class="el-x5 rangee">
        <span class="pastille" style="--c:${TEINTE_SORTE[h.icone]}">${ICONE_SORTE[h.icone]}</span><div class="el-x2"><div class="el-x28">${lienJoueur(h.joueur, esc(h.texte))}</div><div class="aide">${relatif(h.cree, n)}</div></div></div>`).join(""))}
        <p class="el-x13 aide">Les trois dernières semaines.</p></div>` : ""}
    </div>`;
  },
  actions: {
    async repondreInteraction(ctx, b, d) {
      const toutes = [...(d.t?.aTraiter ?? []), ...(d.t?.enCours ?? [])];
      const x = toutes.find((y) => y.id === Number(b.dataset.id));
      const i = L.monde.interactions.find((y) => y.id === Number(b.dataset.id)) ?? x?.interaction;
      if (!x || !i) return;
      const geste = b.dataset.geste;
      let r = null;
      switch (geste) {
        case "accepterCombine": r = await L.repondre(ctx, i, "acceptee"); break;
        case "refuserCombine": r = await L.repondre(ctx, i, "refusee"); break;
        case "retirer": r = await L.repondre(ctx, i, "annulee"); break;
        case "taire": r = await L.repondre(ctx, i, null, { choix: "silence" }); break;
        case "parler": r = await L.repondre(ctx, i, null, { choix: "trahir" }); break;
        case "refuserVoyage": case "refuserChantage": r = await L.repondre(ctx, i, "refusee"); break;
        case "accepterVoyage": r = await L.accepterVoyage(ctx, i); break;
        case "payerChantage": r = await L.payerChantage(ctx, i); break;
        case "contreProposer": {
          const c = x.contre;
          let part = c.parts.reduce((a, p) => (Math.abs(p - c.depart) < Math.abs(a - c.depart) ? p : a), 0.5);
          ctx.feuille({ titre: "Ta contre-proposition", rendu: () => `<div class="el-x3 pile">${pilules("partContre", c.parts.map((p) => [p, `${Math.round(p * 100)} %`]), part)}
            ${aide(`Ta part : ${montant(Math.round(c.gainMin * part))} à ${montant(Math.round(c.gainMax * part))}.`)}
            ${bouton("Envoyer", "envoyerContre", { genre: "teinte", teinte: "var(--controles)" })}</div>`, actions: {
            partContre(cc, el) { part = Number(el.dataset.valeur); cc.redessiner(); },
            async envoyerContre(cc) {
              cc.fermerFeuille();
              const rr = await L.repondre(cc, i, "contre", { contre: 1 - part });
              if (rr) cc.toast(rr, "refus");
              cc.rafraichir();
            },
          } });
          return;
        }
        default: return;
      }
      if (r && r !== "annule") ctx.toast(r, "refus"); // RNT-219 : fenêtre de paiement annulée
      ctx.rafraichir();
    },
  },
};

// MARK: - Règles du monde (EcranReglesMonde)

/**
 * D215 : les sections des règles (entre joueurs, garde-fous, économie, départs, focus, bots), sur un brouillon `b` ;
 * les mêmes dans « Règles du monde » et à la création d'un monde. Actions : basculerOption, choisirOption,
 * basculerBots, choisirBot.
 */
export function sectionsRegles(r, b, { modifiable = true, bots = true, duree = true } = {}) {
  PREREGLAGES = r.prereglages ?? PREREGLAGES;
  const ecart = (x) => (x === 1 ? "Normal" : `${x > 1 ? "+" : "−"}${Math.round(Math.abs(x - 1) * 100)} %`);
  const inter = (k, t, action = "basculerOption", valeur = b[k]) => `<div class="mr-ligne-inter">${interrupteur(action, valeur, t, "", { desactive: !modifiable, donnees: { cle: k } })}</div>`;
  const choix = (k, t, valeurs, action = "choisirOption", valeur = b[k], fige = false) => `<div class="mr-ligne"><div class="libelle mr-titre">${t}</div>${pilules(action, valeurs.map(([v, n]) => [JSON.stringify(v), n]), JSON.stringify(valeur ?? null), { desactive: !modifiable || fige }).replaceAll(`data-action="${action}"`, `data-action="${action}" data-cle="${k}"`)}</div>`;
  // RNT-251 : les règles des échanges (taux maximal, anti-abus), dans `b.echanges` ; RNT-266 : la bourse, dans `b.bourse`.
  const ech = { ...ECHANGES_DEFAUT, ...(b.echanges ?? {}) };
  const brs = { ...BOURSE_DEFAUT, ...(b.bourse ?? {}) };
  const sec = (t, c, pied = "") => `<div><div class="section mr-section">${t}</div>${carte(c)}${pied ? `<p class="aide mr-pied">${pied}</p>` : ""}</div>`;
  // Retour du 16/10 : un monde privé créé avant les bots peut en prendre (ou les renvoyer).
  const choixBot = (k, t, valeurs) => `<div class="mr-ligne"><div class="libelle mr-titre">${t}</div>${pilules("choisirBot", valeurs.map(([v, n]) => [JSON.stringify(v), n]), JSON.stringify(b.bots?.[k] ?? null), { desactive: !modifiable }).replaceAll('data-action="choisirBot"', `data-action="choisirBot" data-cle="${k}"`)}</div>`;
  // RNT-266 (D265) : trois préréglages qui règlent tout d'un coup ; « Personnalisé » quand une règle s'en écarte.
  const suivi = prereglageSuivi(b);
  const prereglages = sec("Préréglage", `<div class="mr-prereglages">${PREREGLAGES.map((p) =>
    `<button class="petit ${suivi?.id === p.id ? "plein" : ""}" data-action="choisirPrereglage" data-valeur="${p.id}" aria-pressed="${suivi?.id === p.id}" ${modifiable ? "" : "disabled"}>${esc(p.nom)}</button>`).join("")}</div>`,
    `${esc(suivi?.resume ?? "Personnalisé : tes propres réglages.")} Le profil de départ, le nombre de bots et la durée ne changent pas.`);
  return `${PREREGLAGES.length ? prereglages : ""}
      ${bots ? sec("Bots", [
        `<div class="mr-ligne-inter">${interrupteur("basculerBots", b.bots?.actif === true, "Compléter avec des bots", "", { desactive: !modifiable })}</div>`,
        ...(b.bots?.actif ? [choixBot("nombre", "Combien", [1, 2, 3, 4].map((x) => [x, String(x)])), choixBot("niveau", "Niveau", NIVEAUX)] : []),
      ].join(filet), "Des joueurs du jeu qui complètent le monde. Chaque vrai joueur qui arrive prend la place d'un bot ; un bot qui part rend ce qu'il doit.") : ""}
      ${sectionGarde(r, b, inter, choix, sec)}
      ${sec("Économie", [
        // RNT-265 (D264) : la durée de la saison (OptionsPartie.dureeSaison), figée après le premier jour.
        ...(duree && r.durees ? [choix("dureeSaison", "Durée de la saison", r.durees.map((d) => [d.id, d.nom]), "choisirOption", b.dureeSaison, r.dureeModifiable === false)] : []),
        ...["clientele", "impots", "controles"].map((k, i) => choix(k, ["Clientèle des boîtes", "Impôts", "Contrôles"][i], r.curseurs.map((x) => [x, ecart(x)]))),
        choix("profilImpose", "Profil de départ", [[null, "Au choix"], ...r.profils.map((p) => [p.id, p.nom])])].join(filet),
        "Égaux : tous les nouveaux joueurs commencent avec ce profil, même s'ils ne l'ont pas encore débloqué. La durée de la saison et l'argent de départ ne changent pas en cours de route. Une saison plus courte va plus vite : revenus multipliés, délais raccourcis, prix inchangés.")}
      ${sec("Échanges", [choix("tauxMax", "Intérêts au plus, par an de jeu (1 semaine)", [0.05, 0.1, 0.2, 0.5].map((x) => [x, `${Math.round(x * 100)} %`]), "choisirEchange", ech.tauxMax),
        inter("aucuneLimite", "Aucune limite", "basculerEchange", ech.aucuneLimite),
        ...(ech.aucuneLimite ? [] : [inter("prixPlancher", "Prix plancher : sous la moitié, c'est un don", "basculerEchange", ech.prixPlancher),
          inter("plafondDons", "Dons : 10 % du patrimoine par semaine au plus", "basculerEchange", ech.plafondDons),
          inter("donsHorsClassement", "Les dons reçus ne comptent pas au classement", "basculerEchange", ech.donsHorsClassement)])].join(filet),
        "Un an de taux dure une semaine de jeu, comme à la banque.")}
      ${sec("Entre joueurs", [inter("combines", "Combines à deux"), inter("chantage", "Chantage"), inter("inspection", "Inspection"), inter("inspecteAverti", "L'inspecté est averti"), inter("voyages", "Voyages à deux"), inter("prisons", "Prisons et parloir", "basculerPrisons", b.prisons !== false), inter("gazette", "Gazette du dimanche", "basculerGazette", b.gazette !== false),
        choix("plafondHostile", "Chantages et signalements par semaine", r.plafonds.map((x) => [x, String(x)])), choix("fausseAccusation", "Fausse accusation", r.partsFausseAccusation.map((x) => [x, `${Math.round(x * 100)} %`]))].join(filet))}
      ${sec("Événements du monde", [inter("evenementsMonde", "Événement de la semaine", "basculerEvenements", b.evenementsMonde !== false)].join(filet), "Chaque lundi, un secteur bouge pour tout le monde : boîtes, immobilier ou voitures. Une rumeur l'annonce le dimanche.")}
      ${sec("Casinos", [inter("casino", "Casinos : licences et jeux", "basculerCasino", b.casino !== false)].join(filet), "Coupés : plus de licences aux enchères, plus de jeux.")}
      ${sec("Circuits", [inter("circuits", "Circuits : journées piste et championnats", "basculerCircuits", b.circuits !== false)].join(filet), "Coupés : plus de journées piste, plus de séries ; les points de course déjà gagnés restent.")}
      ${sec("Présence", [choix("controlePresence", "« Toujours là ? »", [[null, "Au choix"], [true, "Posé à tous"], [false, "Coupé"]]),
        choix("periodeControle", "Une question au plus toutes les", [[null, `${r.periodeControleDefaut ?? 20} min`], ...(r.periodesControle ?? []).filter((x) => x !== r.periodeControleDefaut).map((x) => [x, `${x} min`])])].join(filet),
        "Au choix : chacun suit son réglage (Réglages › Focus). Sinon la règle du monde l'emporte, pour les sessions lancées après le changement.")}
      ${sec("Bourse", [choix("coteesParJoueur", "Entreprises cotées par joueur, au plus", (r.bourseCotees ?? [1, 2, 3, 5]).map((x) => [x, String(x)]), "choisirBourse", brs.coteesParJoueur),
        choix("titresMax", "Titres cotés dans le monde, au plus", (r.bourseTitres ?? [10, 20, 30, 50]).map((x) => [x, String(x)]), "choisirBourse", brs.titresMax)].join(filet),
        "Abaisser une limite retire tout de suite de la cote les plus petits titres en trop ; leurs actionnaires sont remboursés au cours.")}`;
}

let brouillon = null;

/** D425 (OPT) : la note de difficulté d'un brouillon (OptionsPartie.noteDifficulte du moteur, mêmes poids). */
export function noteDifficulte(b, N) {
  let n = 1;
  if (b.faim === false) n += N.faimCoupee;
  if (b.sante === false) n += N.santeCoupee;
  if (b.trainDeVie === false) n += N.trainDeVieCoupe;
  const cran = Math.min(3, Math.max(0, b.evenementsDurs ?? 2));
  n += [N.evenementsAucun, N.evenementsDoux, 0, N.evenementsDurs][cran];
  const imp = b.impots ?? 1, ctl = b.controles ?? 1;
  if (imp <= 0.75) n += N.impotsBas; else if (imp >= 1.3) n += N.impotsHauts;
  if (ctl >= 1.3) n += N.controlesHauts;
  return Math.round(Math.max(0.3, Math.min(1.6, n)) * 100) / 100;
}
export const texteNote = (n) => n.toFixed(2).replace(".", ",");

/** D425 (OPT) : « Ce que le monde garde » et la note, en direct pendant qu'on coche (comme SectionsRegles sur iPhone). */
function sectionGarde(r, b, inter, choix, sec) {
  const N = r.reglesNote;
  if (!N) return "";
  const note = noteDifficulte(b, N);
  const teinte = note < N.seuilSucces ? "var(--perte)" : note > 1 ? "var(--gain)" : "var(--texte)";
  const ouvert = (k) => b[k] !== false;
  const pied = "Couper la faim, la santé ou le train de vie, ou adoucir les coups durs, baisse la note ; des impôts, des contrôles ou des coups durs plus forts la montent. Le record compte × la note."
    + (note < N.seuilSucces ? ` Sous ${texteNote(N.seuilSucces)} : pas de succès à vie dans ce monde.` : "")
    + (r.dureeModifiable === false ? " Changer ces réglages en cours de saison la sort du record, des succès et du prestige." : "");
  return sec("Ce que le monde garde", [
    `<div class="mr-ligne mr-note"><div class="libelle mr-titre">Note de difficulté</div><div class="mr-note-chiffre" style="color:${teinte}">${texteNote(note)}</div></div>`,
    inter("couple", "Couple et enfants", "basculerMonde", ouvert("couple")),
    inter("duels", "Duels", "basculerMonde", ouvert("duels")),
    inter("vols", "Vols entre joueurs", "basculerMonde", ouvert("vols")),
    inter("faim", "Faim", "basculerMonde", ouvert("faim")),
    inter("sante", "Santé et burnout", "basculerMonde", ouvert("sante")),
    inter("trainDeVie", "Train de vie", "basculerMonde", ouvert("trainDeVie")),
    inter("encheres", "Enchères et ventes", "basculerMonde", ouvert("encheres")),
    choix("evenementsDurs", "Coups durs : accidents, pannes, vols, maladies", (r.cransEvenements ?? []).map((n, i) => [i, n]), "choisirOption", b.evenementsDurs ?? 2),
  ].join(filet), pied);
}

/** RNT-251 : les règles des échanges par défaut (OptionsEchanges du moteur). */
export const ECHANGES_DEFAUT = { tauxMax: 0.2, prixPlancher: true, plafondDons: true, donsHorsClassement: false, aucuneLimite: false };
/** RNT-266 : les limites de la bourse par défaut (OptionsBourse du moteur). */
export const BOURSE_DEFAUT = { coteesParJoueur: 3, titresMax: 20 };
/** RNT-266 : les préréglages du moteur (PrereglageMonde), chacun réglé sur un monde privé par défaut. */
let PREREGLAGES = [];
const NIVEAU_PREREGLAGE = { detendu: "detendu", standard: "normal", competitif: "coriace" };

/** Des options comparables : le profil de départ, les bots et la durée à part, les valeurs absentes à leur défaut (PrereglageMonde.reconnu). */
const normales = (o) => {
  const x = { ...o, echanges: { ...ECHANGES_DEFAUT, ...(o.echanges ?? {}) }, bourse: { ...BOURSE_DEFAUT, ...(o.bourse ?? {}) } };
  delete x.profilImpose; delete x.bots; delete x.prereglage; delete x.dureeSaison;
  x.controlePresence ??= null; x.periodeControle ??= null;
  return JSON.stringify(Object.keys(x).sort().map((k) => [k, x[k]]));
};
/** Le préréglage que suit `b` (null : personnalisé). */
export function prereglageSuivi(b) {
  if (!b) return null;
  return PREREGLAGES.find((p) => normales(p.options) === normales(b) && (!b.bots?.actif || (b.bots.niveau ?? "normal") === NIVEAU_PREREGLAGE[p.id])) ?? null;
}
/** `b` réglé sur le préréglage `id` : tout, sauf le profil de départ, le nombre de bots et la durée (PrereglageMonde.appliquer). */
function appliquerPrereglage(b, id) {
  const p = PREREGLAGES.find((x) => x.id === id);
  if (!p) return b;
  for (const k of Object.keys(b)) delete b[k];
  Object.assign(b, structuredClone(p.options));
  return b;
}

/** RNT-251 : les gestes des règles d'échange, sur un brouillon d'options (Règles du monde, Créer un monde) ; RNT-266 : la bourse, les préréglages. */
export const actionsEchanges = (lire) => ({
  basculerEchange(ctx, el) { const o = lire(); o.echanges = { ...ECHANGES_DEFAUT, ...(o.echanges ?? {}) }; o.echanges[el.dataset.cle] = !o.echanges[el.dataset.cle]; ctx.redessiner(); },
  choisirEchange(ctx, el) { const o = lire(); o.echanges = { ...ECHANGES_DEFAUT, ...(o.echanges ?? {}), [el.dataset.cle]: JSON.parse(el.dataset.valeur) }; ctx.redessiner(); },
  choisirBourse(ctx, el) { const o = lire(); o.bourse = { ...BOURSE_DEFAUT, ...(o.bourse ?? {}), [el.dataset.cle]: JSON.parse(el.dataset.valeur) }; ctx.redessiner(); },
  choisirPrereglage(ctx, el) {
    const o = lire();
    const garde = { profilImpose: o.profilImpose, bots: o.bots, dureeSaison: o.dureeSaison };
    appliquerPrereglage(o, el.dataset.valeur);
    if (garde.profilImpose != null) o.profilImpose = garde.profilImpose;
    if (garde.dureeSaison != null) o.dureeSaison = garde.dureeSaison; // RNT-265
    if (garde.bots) o.bots = { ...garde.bots, niveau: NIVEAU_PREREGLAGE[el.dataset.valeur] };
    ctx.redessiner();
  },
});

const pageRegles = {
  titre: "Règles du monde",
  async donnees(ctx) {
    if (!L.monde.options) await L.synchroniser(ctx, { force: true });
    const r = await ctx.jouer("enLigne.reglesMonde", { monde: L.monde.options ?? {} }, { silencieux: true });
    if (r && !brouillon && L.monde.options) brouillon = { ...r.brouillon };
    // D451 : sans réponse du serveur, on ne sait pas qui est l'hôte : le dire, au lieu de tout griser sans raison.
    return { r, sansServeur: !L.monde.options };
  },
  rendu(d) {
    const r = d.r;
    if (!r) return `${entetePousse("Règles du monde")}${vide("Les règles s'affichent dans un monde en ligne.")}`;
    const b = brouillon ?? r.actives, admin = r.admin;
    const change = JSON.stringify(b) !== JSON.stringify(r.brouillon);
    return `${entetePousse("Règles du monde")}<div class="pile mr-pile">
      ${d.sansServeur ? `<div class="rangee mr-reseau">${aide("Règles du serveur indisponibles (réseau) : on ne sait pas encore si tu es l'hôte.")}${bouton("Réessayer", "relireRegles", { genre: "secondaire" })}</div>` : aide(admin ? "Tu as créé ce monde : tu en règles les règles. Enregistré, un changement vaut tout de suite pour tout le monde, et le fil l'annonce."
        : r.prive === false ? "Un monde public garde ses règles." : "Seul le créateur du monde les change.")}
      ${sectionsRegles(r, b, { modifiable: admin, bots: r.prive !== false, duree: r.prive !== false })}
      ${admin ? bouton("Enregistrer : effet immédiat", "appliquerOptions", { desactive: !change }) : ""}
      ${r.journal.length ? `<div><div class="section mr-section">Journal des changements</div>${carte(r.journal.map((j, k) => `${k ? filet : ""}<div class="mr-ligne"><div class="mr-quand">${new Date(j.quand).toLocaleString("fr-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div><div class="aide">${esc(j.texte)}</div></div>`).join(""))}</div>` : ""}
    </div>`;
  },
  actions: {
    basculerBots(ctx) { brouillon.bots = { actif: false, nombre: 2, niveau: "normal", ...(brouillon.bots ?? {}) }; brouillon.bots.actif = !brouillon.bots.actif; ctx.redessiner(); },
    choisirBot(ctx, b) { brouillon.bots = { actif: true, nombre: 2, niveau: "normal", ...(brouillon.bots ?? {}), [b.dataset.cle]: JSON.parse(b.dataset.valeur) }; ctx.redessiner(); },
    ...actionsEchanges(() => brouillon),
    basculerOption(ctx, b) { brouillon[b.dataset.cle] = !brouillon[b.dataset.cle]; ctx.redessiner(); },
    basculerCasino(ctx) { brouillon.casino = brouillon.casino === false ? null : false; ctx.redessiner(); }, // RNT-260 : nil = permis
    basculerCircuits(ctx) { brouillon.circuits = brouillon.circuits === false ? null : false; ctx.redessiner(); }, // D445 : nil = ouverts
    // RNT-280 : les prisons, ouvertes par défaut (nil) ; coupées : faux.
    basculerPrisons(ctx) { brouillon.prisons = brouillon.prisons === false ? null : false; ctx.redessiner(); },
    basculerEvenements(ctx) { brouillon.evenementsMonde = brouillon.evenementsMonde === false ? null : false; ctx.redessiner(); }, // RNT-281
    basculerMonde(ctx, b) { const k = b.dataset.cle; brouillon[k] = brouillon[k] === false ? null : false; ctx.redessiner(); }, // D425 : nil = ouvert
    basculerGazette(ctx) { brouillon.gazette = brouillon.gazette === false ? null : false; ctx.redessiner(); }, // RNT-282
    choisirOption(ctx, b) { brouillon[b.dataset.cle] = JSON.parse(b.dataset.valeur); if (brouillon[b.dataset.cle] === null) delete brouillon[b.dataset.cle]; ctx.redessiner(); },
    // D451 : relire les règles quand le serveur n'avait pas répondu.
    async relireRegles(ctx) { await L.synchroniser(ctx, { force: true }); brouillon = null; ctx.rafraichir(); },
    async appliquerOptions(ctx) {
      // RNT-266 : le préréglage suivi part avec les options, pour que le fil le nomme (reglages-monde.sql).
      const p = prereglageSuivi(brouillon);
      const r = await L.changerOptions(ctx, p ? { ...brouillon, prereglage: p.id } : brouillon);
      ctx.toast(r ?? "Règles enregistrées : elles valent dès maintenant", r ? "refus" : "gain");
      brouillon = null;
      ctx.rafraichir();
    },
  },
};

export const pages = {
  enLigne: pageEnLigne,
  bourseMonde: pageBourse,
  propositions: pagePropositions,
  reglesMonde: pageRegles,
  ...social.pagesSociales, // lot E : Journal du dimanche, Amis, fiche d'un ami, discussion
};
