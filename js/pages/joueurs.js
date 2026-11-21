// ══════════════════════════════════════════════════════════════════════
//  Les joueurs (RNT-200, D214) : trouver les gens du monde en ligne, et
//  tout faire depuis leur fiche. EcranJoueurs.swift sur le web.
//
//    joueurs            la page « Les joueurs » : tout le monde de la partie
//                       en ligne, bots marqués (pastille « bot » et
//                       caractère), triée par fortune, par ville ou « près
//                       de toi » ; le classement de la saison (fortune,
//                       progression de la semaine)
//    ouvrirFicheJoueur  la fiche d'un joueur ou d'un bot : sa courbe de
//                       fortune face à la tienne, son activité, ce qu'il
//                       possède, son caractère (bot), et toutes les actions,
//                       grisées avec leur raison quand elles sont impossibles
//
//  Tout est calculé dans le moteur (PontJoueurs.swift : enLigne.joueurs,
//  enLigne.ficheJoueur) ; ici, le dessin et les gestes (../enligne.js).
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, variation, esc, duree, enDevise } from "../format.js?v=3e8bddd9";
import { ligneTitre, pastilleTitre, catalogue as catalogueTitres } from "../titres.js?v=3e8bddd9"; // RNT-270 ; D398 : titres en badge
import { entetePousse, carte, segment, vide, petit, bouton, menuAncre, courbe, echelleCourbe } from "../ui.js?v=3e8bddd9";
import * as L from "../enligne.js?v=3e8bddd9";
import { avatarAutre, entreVous, actionsFiche, liensFiche } from "./enligne.js?v=3e8bddd9";
import * as S from "./social.js?v=3e8bddd9";
import * as C from "../cosmetiques.js?v=3e8bddd9"; // RNT-231 : ses cosmétiques équipés
import * as FL from "../filtres-listes.js?v=3e8bddd9"; // D442 (FIL) : les filtres des listes
import * as CT from "../carte-ticket.js?v=3e8bddd9"; // D384 : la carte de profil en ticket
import { vitrineMusee } from "./series.js?v=3e8bddd9"; // RNT-374 (D380) : sa vitrine-musée
import { carteFortune, badgeFortune, PALIERS_FORTUNE } from "../cartes-fortune.js?v=3e8bddd9"; // RNT-276
import { grilleCartes, lignePrestige, troisChiffres, pilules, pilule, stylesCartes } from "../profil-cartes.js?v=3e8bddd9"; // D454 : le profil en cartes

const montant = (c) => montantBrut(c).replace("-", "−");
const pct = (x, d = 1) => `${x >= 0 ? "+" : "−"}${(Math.abs(x) * 100).toFixed(d).replace(".", ",")} %`;
const hex = (n) => `#${(Number(n ?? 0x8a8f98) >>> 0 & 0xffffff).toString(16).padStart(6, "0")}`;
const filet = '<div class="filet"></div>';
const lc = (x) => String(x ?? "").toLowerCase();
const ordinal = (r) => (r === 1 ? "1er" : `${r}e`);

/** « il y a 3 minutes ». */
function relatif(ms, maintenant = Date.now()) {
  const s = Math.round((ms - maintenant) / 1000), a = Math.abs(s);
  const r = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (a < 60) return r.format(s, "second");
  if (a < 3600) return r.format(Math.round(s / 60), "minute");
  if (a < 86_400) return r.format(Math.round(s / 3600), "hour");
  return r.format(Math.round(s / 86_400), "day");
}

// MARK: Icônes (les noms SF Symbols du moteur, au trait)

const TRAITS = {
  "bubble.left.fill": '<path d="M4 5h16v11H9l-5 4z"/>',
  "fork.knife": '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2.5 5-2.5 8H17v10"/>',
  "person.badge.plus": '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c1-3.6 3.5-5.5 6.5-5.5s4.2 1 5.3 2.6M19 13v6M16 16h6"/>',
  "person.fill.checkmark": '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c1-3.6 3.5-5.5 6.5-5.5s4.2 1 5.3 2.6M15.5 17l2 2 4-4"/>',
  "person.2.fill": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
  "theatermasks.fill": '<path d="M4 6c3 1 13 1 16 0v5a8 8 0 0 1-16 0zM8.5 11h2M13.5 11h2M9.5 15.5c1.5 1 3.5 1 5 0"/>',
  airplane: '<path d="M12 3c.8 0 1.3.8 1.3 1.8V10l7.2 4v1.8l-7.2-2.2v4.6l2.2 1.6v1.4L12 20.4l-3.5.8v-1.4l2.2-1.6v-4.6L3.5 15.8V14l7.2-4V4.8C10.7 3.8 11.2 3 12 3z"/>',
  "location.fill": '<path d="M20.5 3.5 3.5 10.5l7 2.5 2.5 7z"/>',
  "hand.raised.fill": '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 18 4.5 15l-1-3a1.5 1.5 0 0 1 2.8-1L8 13"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>',
  mappin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  "eye.slash": '<path d="M3 3l18 18M10.6 6.1A9.5 9.5 0 0 1 12 6c5 0 8.5 4 9.5 6-.5 1-1.6 2.6-3.2 3.9M6.4 7.6C4.4 8.9 3 10.8 2.5 12c1 2 4.5 6 9.5 6 1.5 0 2.9-.4 4.1-1"/>',
  "flame.fill": '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.5 3-5.5 3.5-9 2 1 3.5 3 3.5 5 1-1 1.5-2 1.5-3.5 2.5 1.8 4.5 4.6 4.5 7.5 0 3.4-2.6 6-6.5 6z"/>',
  "storefront.fill": '<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20.5v-6h6v6"/>',
  "house.fill": '<path d="M4 20V9l8-5 8 5v11zM10 20v-5h4v5"/>',
  "car.fill": '<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="15" width="18" height="4" rx="1.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  "arrow.up.right": '<path d="M7 17 17 7M9 7h8v8"/>',
  "arrow.down.right": '<path d="M7 7l10 10M17 9v8H9"/>',
  "chart.line.uptrend.xyaxis": '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  "clock.fill": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  "banknote.fill": '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
  "chart.pie.fill": '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  "crown.fill": '<path d="M4 18h16l1-10-5 4-4-6-4 6-5-4z"/>',
  "signature": '<path d="M3 17c3-1 4-7 6-7s-1 7 2 7 3-4 5-4 1 4 5 4"/>',
  // D454 : les pilules du haut du profil et les tuiles d'« Entre vous ».
  "arrow.left.arrow.right": '<path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/>',
  "bolt.fill": '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
  checkmark: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  magnifyingglass: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  "heart.fill": '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  "lock.shield.fill": '<path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z"/><rect x="9" y="11" width="6" height="5" rx="1"/><path d="M10.2 11V9.8a1.8 1.8 0 0 1 3.6 0V11"/>',
  nosign: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  "person.text.rectangle": '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h4M14 13.5h3"/>',
  "doc.text.magnifyingglass": '<path d="M13 21H6.5A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3H14l4 4v4"/><path d="M8 8h5M8 11.5h4"/><circle cx="16" cy="16" r="3"/><path d="M18.2 18.2 21 21"/>',
  "moon.fill": '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
};
const ic = (nom, t = 20) =>
  `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAITS[nom] ?? TRAITS.sparkles}</svg>`;

// MARK: Les données

/** Ce que le moteur demande pour la page et la fiche : profils, relevés, amis, demandes, fil. D454 : mon profil aussi. */
export function parametres() {
  const a = L.monde.amis ?? {};
  return {
    profils: L.monde.profils, autres: L.monde.autresMondes ?? [], releves: L.monde.fortunes ?? {}, fil: L.monde.fil ?? [], // D459 : autres mondes
    amis: (a.amis ?? []).map((x) => x.id), demandes: (a.envoyees ?? []).map((x) => x.id), bloques: L.monde.bloques ?? [],
    ...(L.monde.refusDiscussion ? { refusDiscussion: L.monde.refusDiscussion } : {}),
  };
}

const vue = { tri: "fortune", classement: "fortune" };
// D442 (FIL) : le tri des joueurs gardé d'une visite à l'autre.
try { const t = localStorage.getItem("liste.joueurs.tri"); if (["fortune", "ville", "pres"].includes(t)) vue.tri = t; } catch { /* rien */ }

// MARK: La page « Les joueurs »

/** D377 : la devise d'affichage du joueur (tableau des joueurs), pour les patrimoines de la liste. */
const devise = { taux: 1, symbole: "€" };

const ligneJoueur = (x) => `<button class="jr-ligne ${x.moi ? "moi" : ""}" data-action="ficheJoueur" data-id="${esc(x.id)}" aria-label="${esc(x.pseudo)}${x.bot ? ", bot" : ""}, ${esc(x.ou)}">
    <span class="jr-av">${avatarAutre(x, 42)}${x.memeLieu ? '<i class="jr-ici" role="img" aria-label="Au même endroit que toi" title="Au même endroit que toi"></i>' : ""}</span>
    <span class="jr-qui">
      <span class="jr-nom"><span class="el-coupe">${x.moi ? esc(`${x.pseudo} (toi)`) : C.pseudoHabille(x.pseudo, x.cosmetiques)}</span>${pastilleTitre(x.titreProfil)}${x.bot ? '<span class="jr-pastille">bot</span>' : ""}</span>
      <span class="jr-sous">${x.bot && x.caractere ? `<span class="jr-caractere">${esc(x.caractere)}</span> · ` : ""}${x.activite ? `<b>${esc(x.activite)}</b> · ` : ""}${esc(x.ou)}</span>
    </span>
    <span class="jr-chiffres"><span class="chiffres">${enDevise(Math.round(x.patrimoine * devise.taux), devise.symbole).replace("-", "−")}</span>
      <span class="chiffres ${x.variationSemaine > 0 ? "gain" : x.variationSemaine < 0 ? "perte" : "t3"}" style="font-size:12px">${variation(x.variationSemaine)}</span></span>
  </button>`;

function classementSaison(t) {
  const liste = (vue.classement === "semaine" ? t.semaine : t.fortune).slice(0, 5);
  return `<div class="jr-saison">
    <div class="rangee entre" style="padding:14px 16px 6px"><span class="libelle">Classement de la saison</span>
      <span class="jr-onglets">${[["fortune", "Fortune"], ["semaine", "La semaine"]].map(([v, n]) =>
        `<button data-action="classementSaison" data-valeur="${v}" aria-pressed="${vue.classement === v}">${n}</button>`).join("")}</span></div>
    ${liste.map((r) => `<button class="jr-rang ${r.moi ? "moi" : ""}" data-action="ficheJoueur" data-id="${esc(r.id)}">
      <span class="jr-n ${r.rang === 1 ? "or" : ""}">${r.rang}</span>
      <span style="flex:1;min-width:0;display:grid"><span class="jr-nom"><span class="el-coupe">${esc(r.moi ? `${r.pseudo} (toi)` : r.pseudo)}</span>${badgeFortune(r.palierFortune)}${pastilleTitre(r.titreProfil)}${r.bot ? '<span class="jr-pastille">bot</span>' : ""}</span>
        <span class="aide">${esc(r.detail)}</span></span>
      <span class="chiffres" style="font-size:15px">${esc(r.valeur)}</span></button>`).join(filet)}
  </div>`;
}

/** D'autres pages (l'accueil, l'Ici) l'appellent : un mot pour activer les notifications du navigateur. */
export function invitationNotifications() {
  if (!("Notification" in window) || Notification.permission !== "default") return "";
  return `<div class="jr-notif"><span>${ic("bubble.left.fill", 18)}</span><span style="flex:1">Être prévenu quand un joueur ou un bot te propose quelque chose.</span>
    ${petit("Activer", "activerNotifications", { plein: true })}</div>`;
}

const pageJoueurs = {
  titre: "Les joueurs",
  css: "enligne", // RNT-210 : el-coupe (css/pages/enligne.css, repris d'anciens.css)
  async donnees(ctx) {
    styles();
    await C.chargerCatalogue(ctx);
    await L.synchroniser(ctx, { force: Date.now() - L.monde.derniere > 20_000 });
    if (!L.monde.code) return { t: null };
    const r = await ctx.jouer("enLigne.joueurs", { ...parametres(), tri: vue.tri }, { silencieux: true });
    return { t: r?.joueurs ?? null, filtres: r?.filtres ?? null };
  },
  rendu(d) {
    const t = d.t;
    if (!t) return `${entetePousse("Les joueurs")}${vide("Les joueurs se retrouvent dans un monde en ligne : rejoins-en un, privé ou public.")}`;
    // D442 (FIL) : qui, où, la semaine ; les mêmes cases que l'iPhone (FiltresPossessions.joueurs).
    const coches = FL.preparer("joueurs", d.filtres);
    const groupes = t.groupes.map((g) => ({ ...g, lignes: g.lignes.filter((x) => FL.garde(d.filtres, x.id, coches)) })).filter((g) => g.lignes.length);
    const sansResultat = FL.messageVide(d.filtres, coches);
    devise.taux = t.tauxDevise ?? 1;
    devise.symbole = t.symboleDevise ?? "€";
    return `${entetePousse("Les joueurs")}<div class="pile" style="gap:16px">
      <p class="aide" style="margin:0 4px">${esc(t.resume)} dans ce monde${t.autresMondes ? `, ${t.autresMondes} d'autres mondes (en lecture)` : ""}. Touche quelqu'un pour sa fiche : sa courbe, ce qu'il fait, et tout ce que vous pouvez faire ensemble.</p>
      ${carte(classementSaison(t))}
      ${segment(t.tris.map((x) => [x.id, x.nom]), vue.tri, "triJoueurs")}
      ${FL.barreFiltres("joueurs")}
      ${sansResultat ? `<p class="aide">${esc(sansResultat)}</p>` : ""}
      ${groupes.map((g) => `<div>${g.titre ? `<div class="section" style="margin-top:0">${esc(g.titre)}</div>` : ""}${carte(g.lignes.map(ligneJoueur).join(filet))}</div>`).join("")}
      ${invitationNotifications()}
    </div>`;
  },
  tic(ctx, d) { if (d?.t && Date.now() - L.monde.derniere > 60_000) L.synchroniser(ctx).then((ok) => { if (ok) ctx.rafraichir(); }); },
  actions: {
    ...FL.actionsFiltres, // D442 (FIL)
    triJoueurs(ctx, b) { vue.tri = b.dataset.valeur; try { localStorage.setItem("liste.joueurs.tri", vue.tri); } catch { /* rien */ } ctx.rafraichir(); },
    classementSaison(ctx, b) { vue.classement = b.dataset.valeur; ctx.redessiner(); },
    ficheJoueur: (ctx, b) => ouvrirFicheJoueur(ctx, b.dataset.id),
    async activerNotifications(ctx) {
      try { await Notification.requestPermission(); } catch {}
      ctx.redessiner();
    },
  },
};

// MARK: La fiche d'un joueur ou d'un bot

/** La courbe de sa fortune face à la mienne : deux lignes, son point d'aujourd'hui, les deux bouts de la saison. */
function courbeComparee(c, teinte, pseudo) {
  // D403 (RNT-339) : la courbe commune : sa fortune (pleine, à sa teinte), la mienne en pointillés, son point d'aujourd'hui.
  const n = c.jours.length;
  const idx = c.lui.map((v, i) => (v == null ? null : i)).filter((i) => i != null);
  if (idx.length + c.moi.filter((v) => v != null).length < 2 || !idx.length) return "";
  const e = echelleCourbe(idx.map((i) => c.lui[i]), c.moi);
  const ax = (i) => (n > 1 ? i / (n - 1) : 0.5);
  return `<figure class="jr-courbe" aria-label="${esc(c.resume)}"><div class="jr-trace">
    ${courbe(idx.length === 1 ? [e.h[0], e.h[0]] : e.h, idx.length === 1 ? [ax(idx[0]), ax(idx[0])] : idx.map(ax), { hauteur: 132, marge: 10, couleur: teinte,
      fantome: e.autre, fantomeX: c.moi.map((_, i) => ax(i)), pointFinal: true, classe: "jr-lui", classeFantome: "jr-moi" })}</div>
    <figcaption class="rangee entre"><span class="aide">${esc(c.jours[0])}</span>
      <span class="jr-legende"><span><i style="background:${teinte}"></i>${esc(pseudo)}</span>${c.moi.length ? `<span><i class="tirets"></i>Toi</span>` : ""}</span>
      <span class="aide">${esc(c.jours.at(-1))}</span></figcaption>
  </figure>`;
}

function tuileAction(a) {
  return `<button class="jr-action" data-action="actionJoueur" data-id="${esc(a.id)}" ${a.possible ? "" : `disabled aria-disabled="true"`}>
    <span class="jr-action-ic">${ic(a.icone, 19)}</span>
    <span class="jr-action-t">${esc(a.titre)}</span>
    ${a.possible ? (a.detail ? `<span class="jr-action-d">${esc(a.detail)}</span>` : "") : `<span class="jr-action-d raison">${esc(a.raison ?? "")}</span>`}
  </button>`;
}

const section = (titre, contenu, pied = "") => `<div>${titre ? `<div class="section" style="margin-top:0">${esc(titre)}</div>` : ""}${carte(contenu)}${pied ? `<p class="aide" style="margin:8px 4px 0">${esc(pied)}</p>` : ""}</div>`;
// D352 : lignePossession (la longue liste) est remplacée par « Tous ses biens » (page biensJoueur).

/**
 * RNT-212 : ouvre le profil d'un joueur ou d'un bot, d'où qu'on vienne (la page, le classement, la carte, l'Ici,
 * les amis, le fil, la bourse du monde, Entre joueurs) : la page « joueur », par-dessus une feuille fermée.
 */
export async function ouvrirFicheJoueur(ctx, id, pseudo = "") {
  if (!id) return null;
  ctx.fermerFeuille();
  return ctx.ouvrir("joueur", pseudo ? { id: String(id), pseudo } : { id: String(id) });
}

// D388 : l'ancienne carte de membre d'un autre joueur (avec son avatar) est retirée ; la carte ticket (D384) la remplace.

/** RNT-231 : ce qu'il a équipé, en miniatures, et le nombre de pièces de sa collection. */
function vitrineCosmetiques(c, collection) {
  const x = Object.values(C.piecesDe(c));
  if (!x.length && !collection) return "";
  return `<div class="cz-sienne">${x.map((p) => `<span class="cz-sienne-piece" title="${esc(`${p.nom}`)}">${C.apercu(p)}<span>${esc(p.nom)}</span></span>`).join("")}
    ${collection ? `<span class="aide">${collection} pièce${collection > 1 ? "s" : ""} gagnée${collection > 1 ? "s" : ""}</span>` : ""}</div>`;
}

/** Qui est ce joueur pour les gestes entre amis : son identifiant et son pseudo. */
const qui = (d, p) => ({ id: p.id, pseudo: d.f?.pseudo ?? d.prof?.pseudo ?? d.fiche?.pseudo ?? d.ami?.pseudo ?? p.pseudo ?? "" });

/** « En focus, encore 18 min », « En ligne », « Vu il y a 3 heures » : un ami seulement. */
function presence(d, n) {
  if (!d.ami) return null;
  const v = d.fiche?.vitrine ?? d.ami.vitrine;
  const s = S.statutFocus(v, n);
  if (s) return s;
  const vu = d.fiche?.vu ?? d.ami.vu;
  if (!vu) return "Jamais vu en ligne";
  return S.vuRecemment(vu, n) ? "En ligne" : `Vu ${S.relatif(Date.parse(vu), n)}`;
}

/** Les actions du moteur, plus « Pousser » entre amis ; « Message » ouvre votre discussion. */
function actionsProfil(d) {
  const f = d.f;
  let l = (f?.actions ?? []).map((a) => ({ ...a }));
  if (!d.ami || f?.moi) return l;
  const nonLus = d.ami.nonLus ?? 0;
  const coupe = !!d.coupe;
  const message = { id: "message", titre: "Message", icone: "bubble.left.fill", possible: !coupe, raison: coupe ? "Pas de réseau : au prochain wifi." : null,
    detail: nonLus > 0 ? (nonLus > 1 ? `${nonLus} nouveaux messages` : "Un nouveau message") : "Votre discussion" };
  const pousser = { id: "pousser", titre: S.fiche.pousse ? "Envoyé" : "Pousser", icone: S.fiche.pousse ? "checkmark" : "bolt.fill",
    possible: !S.fiche.pousse && !coupe, detail: "« On s'y met ? » : une session, maintenant", raison: S.fiche.pousse ? "Message envoyé." : coupe ? "Pas de réseau : au prochain wifi." : null };
  const k = l.findIndex((a) => a.id === "message");
  if (k >= 0) { if (l[k].possible) l[k] = message; l.splice(k + 1, 0, pousser); }
  else l = [message, pousser];
  return l;
}

const grilleClassements = (rangs) => `<div class="jr-classements">${rangs.map((r) => `<div role="img" aria-label="${esc(`${r.texte}, ${r.nom}`)}">
    <div class="chiffres ${r.rang === 1 ? "or" : ""}">${r.rang === 1 ? `<span class="jr-couronne">${ic("crown.fill", 12)}</span>` : ""}${esc(r.texte)}</div>
    <div class="aide">${esc(r.nom)}</div></div>`).join("")}</div>`;

// MARK: D454 : le profil en cartes

/** D454 : en haut, ce qu'on fait le plus : écrire (entre amis) ou l'ajouter en ami, quand c'est possible. */
function principales(d) {
  if (d.f?.moi) return [];
  const id = d.ami ? "message" : "ami";
  return actionsProfil(d).filter((a) => a.id === id && a.possible);
}
const peutEchanger = (d) => !!d.prof && d.f?.moi === false;

/** Les pages des cartes d'un joueur (le profil d'un joueur, dans la pile). */
const PAGES_CARTES = { biens: "biensJoueur", activite: "activiteJoueur", palmares: "palmaresJoueur", entreVous: "entreVousJoueur" };

/** Les cartes : celles du moteur ; un ami hors de ton monde : son palmarès (sa vitrine) et entre vous. */
function cartesProfil(d, n) {
  if (d.f) return (d.f.cartes ?? []).filter((c) => c.id !== "reglages");
  const v = d.fiche?.vitrine ?? d.ami?.vitrine ?? null;
  const l = [];
  if (v) l.push({ id: "palmares", titre: "Palmarès", icone: "trophy.fill", resume: `Niveau ${v.niveau ?? 1}${v.record != null ? ` · Record ${montant(v.record)}` : ""}` });
  if (d.ami) { const pr = presence(d, n); l.push({ id: "entreVous", titre: "Entre vous", icone: "person.2.fill", resume: pr ? `Ton ami · ${pr}` : "Ton ami" }); }
  return l;
}

/** Sa carte de profil (la carte en ticket, D384), la mention dessous, ses pièces équipées. */
function teteProfil(d, n, pseudo) {
  const { f, prof } = d;
  const ami = d.ami;
  const fp = d.fiche?.profil ?? null;
  const pp = prof ?? d.autre ?? fp; // D459 : un autre monde : son profil publié
  const vitrine = d.fiche?.vitrine ?? ami?.vitrine ?? null;
  const pres = presence(d, n);
  // D454 : son rang de prestige n'est plus dans la mention (D441) : il a sa ligne juste dessous, une seule fois.
  const mention = f?.bot ? `${f.bot.libelle}, ${f.bot.niveau.toLowerCase()}` : f?.moi ? "C'est toi"
    : f?.autreMonde ? (ami ? `Ton ami · monde « ${f.autreMonde} »` : `Joue dans « ${f.autreMonde} »`) // D459
    : ami ? (pres ? `Ton ami · ${pres}` : "Ton ami")
    : prof ? "Joue dans ton monde" : "";
  const cosmetiques = f?.cosmetiques ?? pp?.cosmetiques ?? null;
  const recordCarte = pp?.record ?? vitrine?.record ?? null;
  const palierCarte = Math.min(Math.max(0, f?.palierFortune ?? (pp?.carteVitrine != null && pp.carteVitrine >= 0 && pp.carteVitrine <= (pp?.palierFortune ?? -1) ? pp.carteVitrine : pp?.palierFortune) ?? 0), 12);
  return `<div class="cl-membre-cadre jr-membre">${CT.carteTicket({ pseudo, titre: f?.titreProfil?.nom ?? null, /* D388 : plus l'ancien titre de saison */ bot: !!f?.bot,
      record: recordCarte != null ? montant(recordCarte) : null, palier: palierCarte, badges: CT.listeBadges(C.badgesSaison(), pp?.badges ?? []), cosmetiques,
      avatar: f || pp ? { symbole: f?.symbole ?? pp?.symbole, teinte: f?.teinte ?? pp?.teinte } : null })}
      ${mention ? `<span class="aide">${esc(mention)}</span>` : ""}</div>`
    + (f?.autreMondeTexte ? `<p class="aide jr-autre-monde">${esc(f.autreMondeTexte)}</p>` : "") // D459
    + vitrineCosmetiques(cosmetiques, f?.collection ?? pp?.collection);
}

function rendreProfil(d, ctx, p) {
  const n = ctx.maintenant();
  const { f, prof } = d;
  const ami = d.ami;
  const pseudo = qui(d, p).pseudo || "Ce joueur";
  if (!f && !prof && !ami) return `${entetePousse("Profil")}${vide("Ce joueur n'est plus dans le monde.")}`;
  const fp = d.fiche?.profil ?? null; // un ami hors du monde : son dernier monde publié
  const pp = prof ?? d.autre ?? fp; // D459 : un autre monde
  // D454 : son prestige, sa fortune, sa place, sa semaine (la courbe : Palmarès).
  const haut = f ? `<div class="carte pc-tete">${f.rangPrestige && f.prestige != null ? `${lignePrestige(f.rangPrestige, f.prestige, f.moi ? d.placeGenerale : null)}${filet}` : ""}
      ${troisChiffres([[montant(f.patrimoine), "Fortune"], [f.rang ? ordinal(f.rang) : "–", `sur ${f.total}`, f.rang === 1 ? "or" : ""],
        [variation(f.variationSemaine), "7 jours", f.variationSemaine > 0 ? "gain" : f.variationSemaine < 0 ? "perte" : ""]])}</div>` : fp ? S.stats(fp) : "";
  const musee = f?.musee ? vitrineMusee(f.musee, f.moi) : ""; // RNT-374 (D380) : sa vitrine
  const lp = [...principales(d).map((a) => pilule({ titre: a.titre, icone: ic(a.icone, 17), action: "actionJoueur", donnees: { id: a.id }, detail: a.detail ?? "" })),
    ...(peutEchanger(d) ? [pilule({ titre: "Échanger", icone: ic("arrow.left.arrow.right", 17), action: "proposerEchangeJoueur", donnees: { id: prof.id },
      detail: "Argent, parts, biens, véhicules, montres ; un prêt, une location" })] : [])]; // RNT-251
  const grille = grilleCartes(cartesProfil(d, n), (c) => (PAGES_CARTES[c.id] ? { page: PAGES_CARTES[c.id], p: { id: p.id } } : null));
  const maj = f?.majLe ?? Date.parse(pp?.majLe ?? "");
  const fin = Number.isFinite(maj) ? `<p class="aide jr-maj">Mis à jour ${relatif(maj, n)}.</p>` : "";
  // Au large : deux colonnes, comme l'iPhone retourné : qui il est à gauche, ce qu'on fait et les cartes à droite.
  return `${entetePousse(f?.moi ? "Ton profil" : pseudo)}<div class="so-page jr-page"><div class="so-deux">
    <div class="pile jr-colonne">${teteProfil(d, n, pseudo)}${haut}</div>
    <div class="pile jr-colonne">${musee}${pilules(lp)}${grille}${fin}</div>
  </div></div>`;
}

/** Une page de carte : son en-tête, une colonne (deux au large quand `droite` est donné). */
const pageCarte = (titre, gauche, droite = "", sous = "") => `${entetePousse(titre)}<div class="so-page jr-page"><div class="so-deux">
  <div class="pile jr-colonne pc-page">${sous ? `<p class="aide">${esc(sous)}</p>` : ""}${gauche}</div>${droite ? `<div class="pile jr-colonne pc-page">${droite}</div>` : ""}</div></div>`;

/** « Boîtes et activité » : ses boîtes (ce qu'il en montre), ce qu'il fait, ce qu'il a fait ; un bot : son caractère. `plus` : ton profil. */
export function corpsActivite({ moi = false, familles = [], statut = [], faits = [], bot = null, plus = "" }) {
  const b = (familles ?? []).find((x) => x.id === "boites");
  const boites = b ? section(`${moi ? "Tes" : "Ses"} boîtes (${b.biens.length})`, b.biens.map((x) => `<div class="jr-bx-ligne jr-bx-sans"><span class="t2 jr-ic">${ic(x.icone, 18)}</span><span><span class="libelle">${esc(x.titre)}</span>${x.detail ? `<span class="aide">${esc(x.detail)}</span>` : ""}</span>
      <span class="chiffres ${esc(x.ton)}">${esc(x.valeurTexte)}</span></div>`).join(""), `Bénéfice de la saison, toutes boîtes : ${b.totalTexte}.`) : "";
  const ceBot = bot ? section("Ce bot", `<div class="jr-bot">
        <div><div class="aide">Caractère</div><div class="libelle">${esc(bot.caractere)}</div><div class="aide">${esc(bot.description)}</div></div>
        <div><div class="aide">Niveau</div><div class="libelle">${esc(bot.niveau)}</div><div class="aide">${esc(bot.rythme)}</div></div></div>`,
      "Un bot joue avec les mêmes règles que toi, même quand tu dors. Il cède sa place au prochain vrai joueur.") : "";
  const fait = section(moi ? "Ce que tu fais" : "Ce qu'il fait", [...statut, ...faits].map((x) => `<div class="rangee jr-fait">
        <span class="t2 jr-ic">${ic(x.icone, 18)}</span><span>${esc(x.texte)}</span></div>`).join(filet)
      || `<p class="aide jr-vide">Rien de visible pour l'instant.</p>`);
  return `${plus}${boites}${ceBot}${fait}`;
}

/** « Palmarès » : sa courbe face à la tienne, ses six classements, son focus, sa carte de fortune ; un ami : sa vitrine. */
export function corpsPalmares({ f = null, vitrine = null, moi = false, plus = "" }) {
  const bande = (els) => `<div class="jr-chiffres-bande">${els.map(([t, v]) => `<div><div class="chiffres">${esc(v)}</div><div class="aide">${esc(t)}</div></div>`).join("")}</div>`;
  const teinte = hex(f?.teinte);
  const saison = f ? `<div class="jr-tete" style="--t:${teinte}"><div class="libelle">${moi ? "Ta saison" : "Sa saison face à la tienne"}</div>
      ${f.courbe ? `${courbeComparee(f.courbe, teinte, moi ? "Toi" : f.pseudo)}<p class="jr-resume">${esc(f.courbe.resume)}</p>` : `<p class="aide jr-vide-courbe">La courbe se dessine après quelques jours.</p>`}</div>` : "";
  const classes = f && (!moi || f.classements.some((r) => r.rang > 0)) ? section("Dans ce monde", grilleClassements(f.classements), `${moi ? "Ta" : "Sa"} place dans les classements du monde, sur ${f.total}.`) : "";
  const focus = f ? section("Focus", bande([["Semaine", f.focus.semaine], ["Saison", f.focus.saison], ["Série", f.focus.serie]])) : "";
  const fortune = f?.palierFortune > 0 ? `<div class="carte fiche-fortune jr-fortune">${carteFortune(Math.min(f.palierFortune, 12))}<div><b>Carte ${esc(PALIERS_FORTUNE[Math.min(f.palierFortune, 12)][1])}</b><div class="aide">${moi ? "Ta" : "Sa"} carte de fortune, à vie.</div></div></div>` : "";
  const avie = vitrine ? section("À vie", bande([["Niveau", String(vitrine.niveau ?? 1)], ["7 jours", duree(vitrine.focus7j ?? 0)], ["Record", vitrine.record != null ? montant(vitrine.record) : "–"]])) : "";
  // D458 : ses records de circuit dans ce monde (lus au serveur).
  const records = f?.recordsCircuits?.length ? section(moi ? "Tes records de circuit" : "Ses records de circuit",
    f.recordsCircuits.map((x) => `<div class="rangee jr-fait"><span>⏱ ${esc(x)}</span></div>`).join("")) : "";
  return { gauche: `${saison}${classes}`, droite: `${focus}${fortune}${records}${avie}${plus}` };
}

const ACTIONS_FICHE = ["proposerEchangeJoueur", "combinesJoueur", "signalerInspection", "signalerComportement", "copierJoueur", "feuilleCombineDuo",
  "feuilleChantage", "signalerPreuve", "rejoindreVille"];

/** Les données du profil d'un joueur, pour sa page et les pages de ses cartes. */
async function donneesJoueur(ctx, p) {
  styles();
  stylesCartes();
  await Promise.all([C.chargerCatalogue(ctx), catalogueTitres(ctx)]);
  const id = String(p?.id ?? "");
  if (!L.monde.code) await L.synchroniser(ctx, { force: true }).catch(() => false);
  if (!(L.monde.amis?.amis ?? []).length) await L.chargerAmis().catch(() => null);
  const prof = L.monde.profils.find((x) => lc(x.id) === lc(id)) ?? null;
  // D459 (FIL-Q4) : un joueur d'un autre monde : sa fiche en lecture (pas `prof` : ni échange, ni « Entre vous » du monde).
  const autre = prof ? null : (L.monde.autresMondes ?? []).find((x) => lc(x.id) === lc(id)) ?? null;
  const ami = (L.monde.amis?.amis ?? []).find((x) => lc(x.id) === lc(id)) ?? null;
  const f = L.monde.code && (prof || autre) ? (await ctx.jouer("enLigne.ficheJoueur", { joueur: id, ...parametres() }, { silencieux: true }))?.fiche ?? null : null;
  const ev = f && !f.moi && prof ? await ctx.jouer("enLigne.entreVous", { joueur: prof.id, interactions: L.monde.interactions }, { silencieux: true }) : null;
  // Un ami : sa vitrine, ses mondes, mes mondes (pour l'y inviter) ; la discussion se lit quand elle se voit.
  const a = ami ? await S.lireAmi(ctx, { id: ami.id, pseudo: ami.pseudo }) : {};
  const placeGenerale = f?.moi && f.rangPrestige ? await L.maPlaceGenerale() : null; // D441 : ma place au Général
  return { ...a, f, prof, autre, ev, ami, placeGenerale };
}

/** Les gestes du profil d'un joueur et de ses pages (les actions, entre amis, la discussion, la fiche). */
const actionsJoueur = {
  ...S.actionsDefis,
  ...Object.fromEntries(Object.keys(S.actionsDiscussion).map((k) => [k, (ctx, b, d, p) => S.actionsDiscussion[k](ctx, b, d, qui(d, p))])),
  ...Object.fromEntries(Object.keys(S.actionsAmi).map((k) => [k, (ctx, b, d, p) => S.actionsAmi[k](ctx, b, d, qui(d, p))])),
  ...Object.fromEntries(ACTIONS_FICHE.map((k) => [k, (ctx, b, d) => actionsFiche(d.prof, d.ev)[k](ctx, b)])),
  async bloquerJoueur(ctx, b, d) { const r = await L.bloquer(ctx, d.prof.id, !d.ev.bloque); if (r) return ctx.toast(r, "refus"); await ctx.rafraichir(); },
  async actionJoueur(ctx, b, d, p) {
    const a = actionsProfil(d).find((x) => x.id === b.dataset.id);
    if (!a?.possible) return null;
    const dest = a.destination ?? {};
    const moi = qui(d, p);
    switch (a.id) {
      case "message": return ctx.ouvrir("discussionAmi", moi);
      case "pousser": return S.actionsAmi.pousser(ctx, b, d, moi);
      case "aller": case "inspecter": case "visite": { // D389 : plus d'« Inviter à manger » ici (Manger › Avec qui) // RNT-280 : « Rendre visite » ouvre sa prison
        if (dest.page === "monde") return ctx.ouvrir("monde", { ville: dest.params?.ville });
        const { executer } = await import("../ici.js?v=3e8bddd9");
        return executer(ctx, dest);
      }
      case "ami":
        try { await L.demanderAmi(moi.pseudo); await L.chargerAmis(); ctx.toast(`Demande envoyée à ${moi.pseudo}`, "gain"); } catch (e) { ctx.toast(e.message, "refus"); }
        return ctx.rafraichir();
      case "casino": // RNT-302 : l'interdire de mes casinos, ou le réautoriser
        return ctx.decider("casino", { interdire: { joueur: dest.params?.joueur ?? d.prof.id, oui: dest.params?.oui === "1" } },
          { succes: dest.params?.oui === "1" ? `${moi.pseudo} est interdit de tes casinos` : `${moi.pseudo} peut revenir dans tes casinos` });
      case "combine": return actionsFiche(d.prof, d.ev).feuilleCombineDuo(ctx);
      case "coup": return actionsFiche(d.prof, d.ev).combinesJoueur(ctx);
      case "couple": { // D346 : lui proposer d'être en couple, ou ouvrir le nôtre
        const dest = a.destination;
        if (dest?.page === "couple.demander") return ctx.decider("couple", { demanderJoueur: { joueur: dest.params.joueur, pseudo: dest.params.pseudo } }, { succes: `Demande envoyée à ${dest.params.pseudo}` });
        return ctx.ouvrir("couple");
      }
      case "liens": return ctx.ouvrir("liens", { joueur: dest.params?.joueur ?? d.prof.id, pseudo: dest.params?.pseudo ?? moi.pseudo }); // D349
      case "bloquer": {
        const r = await L.bloquer(ctx, d.prof.id, dest.params?.bloque === "1");
        if (r) return ctx.toast(r, "refus");
        ctx.toast(dest.params?.bloque === "1" ? `${moi.pseudo} est bloqué` : `${moi.pseudo} est débloqué`, "gain");
        return ctx.rafraichir();
      }
      default: return null;
    }
  },
};

const CSS_JOUEUR = ["compte", "enligne", "series"]; // la carte de membre (compte.css), les pièces entre amis (enligne.css), la vitrine-musée (series.css, D380)
const absent = (d) => !d?.f && !d?.prof && !d?.ami;

const pageJoueur = {
  titre: "Profil",
  css: CSS_JOUEUR,
  donnees: donneesJoueur,
  rendu: (d, ctx, p) => rendreProfil(d, ctx, p),
  actions: actionsJoueur,
};

/** D454 : « Boîtes et activité ». */
const pageActiviteJoueur = {
  titre: "Boîtes et activité",
  css: CSS_JOUEUR,
  donnees: donneesJoueur,
  rendu(d, ctx, p) {
    if (absent(d)) return `${entetePousse("Boîtes et activité")}${vide("Ce joueur n'est plus dans le monde.")}`;
    const f = d.f, pseudo = qui(d, p).pseudo || "Ce joueur";
    return pageCarte("Boîtes et activité", corpsActivite({ moi: !!f?.moi, familles: f?.familles, statut: f?.statut ?? [], faits: f?.faits ?? [], bot: f?.bot ?? null }),
      "", f?.moi ? "" : `Ce que ${pseudo} montre de ses boîtes et de ce qu'il fait.`);
  },
  actions: actionsJoueur,
};

/** D454 : « Palmarès ». */
const pagePalmaresJoueur = {
  titre: "Palmarès",
  css: CSS_JOUEUR,
  donnees: donneesJoueur,
  rendu(d) {
    if (absent(d)) return `${entetePousse("Palmarès")}${vide("Ce joueur n'est plus dans le monde.")}`;
    const c = corpsPalmares({ f: d.f, vitrine: d.fiche?.vitrine ?? d.ami?.vitrine ?? null, moi: !!d.f?.moi });
    return pageCarte("Palmarès", c.gauche || c.droite, c.gauche ? c.droite : "");
  },
  actions: actionsJoueur,
};

/** D454 : « Entre vous » : tout ce que vous pouvez faire (sauf ce qui est en haut du profil), la confiance, entre amis,
 *  copier ses ordres, le signaler ; le retirer de mes amis. Entre amis, au large, la discussion se tient à droite. */
const pageEntreVousJoueur = {
  titre: "Entre vous",
  css: CSS_JOUEUR,
  donnees: donneesJoueur,
  rendu(d, ctx, p) {
    if (absent(d)) return `${entetePousse("Entre vous")}${vide("Ce joueur n'est plus dans le monde.")}`;
    const { f, prof, ev, ami } = d;
    const pseudo = qui(d, p).pseudo || "Ce joueur";
    const haut = new Set(principales(d).map((a) => a.id));
    const liste = actionsProfil(d).filter((a) => !haut.has(a.id));
    const ensemble = liste.length ? `<div><div class="section jr-section">Ce que vous pouvez faire</div><div class="jr-actions">${liste.map(tuileAction).join("")}</div></div>` : "";
    const confiance = ev ? entreVous(prof, ev).replace('<div class="el-x4 section">Entre vous</div>', "") : "";
    const entreAmis = ami ? `${S.blocInviter(d.mondes ?? [], new Set((d.fiche?.mondes ?? []).map((m) => m.code)))}
      ${(d.fiche?.mondes ?? []).some((m) => m.ensemble) ? `<div><div class="section so-section">Vos mondes ensemble</div>${carte(d.fiche.mondes.filter((m) => m.ensemble).map((m, k) => `${k ? filet : ""}${S.ligneMonde(m.nom, m.prive, `Code ${m.code}`, "")}`).join(""))}</div>` : ""}
      ${d.fiche?.erreur ? `<p class="aide">${esc(d.fiche.erreur)}</p>` : ""}` : "";
    const autour = ev ? liensFiche(prof, { echange: false }) : ""; // D454 : « Échanger » est en haut du profil
    const retirer = ami ? bouton("Retirer de mes amis", "retirerAmi", { genre: "secondaire" }).replace('class="bouton secondaire"', 'class="bouton secondaire so-retirer"') : "";
    const corps = `${ensemble}${confiance}${entreAmis}${autour}${retirer}`;
    const panneau = ami ? `<aside class="so-panneau-discussion" aria-label="Discussion avec ${esc(pseudo)}"><div class="libelle so-titre-bloc">Discussion</div>${S.discussion(d)}</aside>` : "";
    return `${entetePousse("Entre vous")}<div class="so-page so-ami jr-page"><div class="so-deux">
      <div class="pile jr-colonne pc-page">${f?.moi ? "" : `<p class="aide">Ce que ${esc(pseudo)} et toi pouvez faire, maintenant ou plus tard.</p>`}${corps}</div>${panneau}</div></div>`;
  },
  apres(ctx, d, p) {
    if (!d?.ami) return;
    S.enBasDuFil();
    if (!d.coupe && d.messages === null && document.getElementById("fil-discussion")?.offsetParent) S.relireDiscussion(ctx, d, qui(d, p));
  },
  tic(ctx, d, p) {
    if (d?.ami && !d.coupe && Date.now() - (d.lu ?? 0) > 5000 && document.getElementById("fil-discussion")?.offsetParent) S.relireDiscussion(ctx, d, qui(d, p));
  },
  actions: actionsJoueur,
};

// D389 (Arthur 16/11 04:30) : plus de « Voyage à deux » sur la fiche : on l'emmène depuis la feuille du trajet (« Avec qui ? »).

// MARK: Styles

export function styles() {
  if (document.getElementById("styles-joueurs")) return;
  const s = document.createElement("style");
  s.id = "styles-joueurs";
  s.textContent = `
.jr-ligne { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; text-align: left; }
.jr-ligne.moi { background: rgba(255,255,255,.035); }
.jr-ligne:hover, .jr-rang:hover { background: rgba(255,255,255,.03); }
.jr-av { position: relative; flex: none; display: grid; } /* D393 : l'avatar de retour */
.jr-ici { position: absolute; right: -1px; bottom: -1px; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 2.5px var(--fond); }
.jr-qui { flex: 1; min-width: 0; display: grid; gap: 2px; }
.jr-nom { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 15px; font-weight: 600; }
.jr-sous { font-size: 12.5px; color: var(--texte2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.jr-sous b { font-weight: 600; color: var(--texte); }
.jr-caractere { color: var(--texte); }
.jr-chiffres { display: grid; justify-items: end; gap: 1px; font-size: 15px; white-space: nowrap; }
.jr-pastille { flex: none; font-size: 10.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #0d111c; background: #b9c3d6; padding: 2px 6px; border-radius: 99px; }
.jr-pastille.grande { font-size: 11px; padding: 3px 8px; }
.jr-onglets { display: inline-flex; gap: 2px; padding: 2px; border-radius: 99px; background: rgba(255,255,255,.05); }
.jr-onglets button { font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 99px; color: var(--texte2); }
.jr-onglets button[aria-pressed=true] { background: rgba(255,255,255,.1); color: var(--texte); }
.jr-rang { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 16px; text-align: left; }
.jr-rang.moi { background: rgba(255,255,255,.035); }
.jr-n { width: 22px; flex: none; font-size: 19px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--texte3); text-align: center; }
.jr-n.or { color: var(--or); }
.jr-notif { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 18px; border: 1px dashed var(--filet2); font-size: 13.5px; color: var(--texte2); }
.jr-tete { padding: 20px; border-radius: 26px; background: linear-gradient(170deg, color-mix(in srgb, var(--t) 16%, rgba(255,255,255,.03)), rgba(255,255,255,.02) 70%); border: 1px solid var(--filet); }
.jr-pseudo { font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.jr-bande { display: grid; grid-template-columns: 1.35fr .8fr 1fr; gap: 10px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--filet); }
.jr-courbe { margin: 18px 0 0; }
.jr-trace { position: relative; height: 132px; }
.jr-courbe svg { display: block; width: 100%; height: 132px; }
.jr-point { position: absolute; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 30%, transparent); }
.jr-point.moi { width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; background: var(--texte2); box-shadow: none; }
.jr-courbe figcaption { margin-top: 6px; gap: 10px; }
.jr-legende { display: flex; gap: 12px; font-size: 12px; font-weight: 600; color: var(--texte2); }
.jr-legende span { display: flex; align-items: center; gap: 5px; }
.jr-legende i { width: 14px; height: 3px; border-radius: 2px; display: block; }
.jr-legende i.tirets { background: repeating-linear-gradient(90deg, var(--texte2) 0 4px, transparent 4px 7px); }
.jr-resume { margin-top: 10px; font-size: 14px; font-weight: 600; }
.jr-bot { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; }
.jr-bot .libelle { margin: 2px 0 3px; }
.jr-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.jr-action { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 10px; row-gap: 2px; align-items: center; min-height: 62px;
  padding: 12px; border-radius: 18px; text-align: left; background: rgba(255,255,255,.05); border: 1px solid var(--filet); color: var(--texte); }
.jr-action:hover:not(:disabled) { background: rgba(255,255,255,.08); }
.jr-action-ic { grid-row: span 2; width: 34px; height: 34px; border-radius: 11px; display: grid; place-items: center; color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
.jr-action-t { font-size: 14px; font-weight: 600; line-height: 1.2; }
.jr-action-d { font-size: 11.5px; color: var(--texte2); line-height: 1.3; }
.jr-action:disabled { cursor: default; background: transparent; border-style: dashed; }
.jr-action:disabled .jr-action-ic { color: var(--texte3); background: rgba(255,255,255,.04); }
.jr-action:disabled .jr-action-t { color: var(--texte2); }
.jr-action-d.raison { color: var(--texte3); }
@media (max-width: 360px) { .jr-actions { grid-template-columns: 1fr; } }
/* RNT-212 : le profil d'un joueur (CarteDeMembre, les classements, les bandes de chiffres). */
.jr-page .jr-colonne { gap: 20px; min-width: 0; }
.jr-membre { flex: none; }
.jr-membre .cl-membre-haut > :last-child { flex: none; }
.jr-membre-titre { font-size: 13px; font-weight: 600; color: var(--or); margin-top: 1px; }
.jr-initiale { width: 52px; height: 52px; font-size: 22px; color: #fff; }
.jr-classements { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px 10px; padding: 16px; }
.jr-classements .chiffres { font-size: 19px; display: flex; align-items: center; gap: 4px; }
.jr-couronne { display: grid; color: var(--or); }
.jr-chiffres-bande { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
.jr-chiffres-bande > div { padding: 14px 12px 14px 16px; min-width: 0; }
.jr-chiffres-bande > div + div { border-left: 1px solid var(--filet); }
.jr-chiffres-bande .chiffres { font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.jr-chiffres-bande .aide { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* D454 : les pages des cartes du profil */
.jr-maj { margin: 0 4px; }
.jr-section { margin-top: 0; }
.jr-fait { gap: 12px; padding: 12px 16px; }
.jr-fait > span:last-child { font-size: 14px; flex: 1; }
.jr-ic { width: 20px; flex: none; display: grid; }
.jr-vide { padding: 16px; }
.jr-vide-courbe { margin-top: 12px; }
.jr-tete .libelle { margin-bottom: 2px; }
.jr-fortune { display: flex; align-items: center; gap: 14px; padding: 16px; }
.jr-fortune > :first-child { width: 120px; flex: none; }
.jr-bx-sans { border-top: 0; }
.jr-bx-sans + .jr-bx-sans { border-top: 1px solid var(--filet); }
.jr-bx-outils { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.jr-bx-outils input { flex: 1 1 200px; min-height: 44px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--filet2, rgba(255,255,255,.12)); background: rgba(255,255,255,.04); color: var(--texte); font: 16px/1.2 var(--police); }
.jr-bx-famille { padding: 0; overflow: hidden; }
.jr-bx-famille > summary { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; list-style: none; }
.jr-bx-famille > summary::-webkit-details-marker { display: none; }
.jr-bx-famille > summary b { flex: 1; font-size: 15px; font-weight: 600; }
.jr-bx-famille > summary .chiffres { font-size: 15px; white-space: nowrap; }
.jr-bx-famille > summary::after { content: "›"; color: var(--texte3); transition: transform var(--d-court, .2s); }
.jr-bx-famille[open] > summary::after { transform: rotate(90deg); }
.jr-bx-ligne { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--filet); }
.jr-bx-ligne > span:first-child { flex: 1; min-width: 0; display: grid; gap: 2px; }
.jr-bx-ligne .libelle { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.jr-bx-ligne .chiffres { font-size: 15px; white-space: nowrap; }
`;
  document.head.append(s);
}

// MARK: - D352 : tous ses biens (EcranBiensJoueur), rangés par famille

const vueBiens = { q: "", tri: "valeur", replies: new Set() };

/** Ses familles, filtrées et triées comme l'iPhone (valeur décroissante, ou nom). */
export function biensFiltres(familles, { q = "", tri = "valeur" } = {}) {
  const norm = (x) => String(x ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const cherche = norm(q.trim());
  return (familles ?? []).map((f) => ({ ...f, biens: f.biens.filter((b) => !cherche || [b.titre, b.detail, f.titre].some((t) => norm(t).includes(cherche)))
    .sort((a, b) => (tri === "nom" ? a.titre.localeCompare(b.titre, "fr") : b.valeur - a.valeur || a.titre.localeCompare(b.titre, "fr"))) }))
    .filter((f) => f.biens.length);
}

function familleBiensHTML(f, ouverte) {
  const mesure = f.mesure === "valeur" ? "Valeur" : f.mesure.charAt(0).toUpperCase() + f.mesure.slice(1);
  return `<details class="carte jr-bx-famille" data-famille="${esc(f.id)}"${ouverte ? " open" : ""}>
    <summary><span class="t2">${ic(f.icone, 18)}</span><b>${esc(f.titre)} (${f.biens.length})</b><span class="aide">${esc(mesure)}</span><span class="chiffres">${esc(f.totalTexte)}</span></summary>
    ${f.biens.map((b) => `<div class="jr-bx-ligne"><span><span class="libelle">${esc(b.titre)}</span>${b.detail ? `<span class="aide">${esc(b.detail)}</span>` : ""}</span>
      <span class="chiffres ${esc(b.ton)}">${esc(b.valeurTexte)}</span></div>`).join("")}</details>`;
}

const corpsBiens = (familles) => {
  const l = biensFiltres(familles, vueBiens);
  return `<p class="aide">${l.reduce((t, x) => t + x.biens.length, 0)} biens</p>${l.map((x) => familleBiensHTML(x, !vueBiens.replies.has(x.id) || !!vueBiens.q.trim())).join("") || `<p class="aide">Rien ne correspond.</p>`}`;
};

/** D454 : ses familles de biens, sans ses boîtes (elles vivent dans « Boîtes et activité ») : CartesProfil.famillesBiens. */
const sansBoites = (familles) => (familles ?? []).filter((x) => x.id !== "boites");

/** D454 : la page « Ses biens » (et « Tes biens », depuis ton profil : profil.js). */
export function rendreBiens(familles, { moi = false, pseudo = "" } = {}) {
  const l = sansBoites(familles);
  const n = l.reduce((t, x) => t + x.biens.length, 0);
  const titre = moi ? "Tes biens" : `Les biens de ${pseudo}`;
  if (!n) return `${entetePousse(titre)}${vide(moi ? "Rien pour l'instant : tes maisons, véhicules, bateaux et montres s'ajouteront ici." : `${pseudo} ne montre encore rien de ce qu'il possède.`)}`;
  return `${entetePousse(titre)}<div class="so-page jr-page"><div class="pile jr-colonne">
      <p class="aide">${n} en tout, en ${l.length} famille${l.length > 1 ? "s" : ""}${moi ? "" : ` : ce que ${esc(pseudo)} montre.`}</p>
      <div class="jr-bx-outils"><label class="sr" for="jr-bx-q">Chercher un bien</label><input type="search" id="jr-bx-q" placeholder="Chercher un bien" value="${esc(vueBiens.q)}" data-saisie="chercherBien" autocomplete="off">
        ${menuAncre({ libelle: "Trier", options: [["valeur", "Valeur"], ["nom", "Nom"]], choisie: vueBiens.tri, action: "trierBiens" })}</div>
      <div class="pile" id="jr-bx-corps">${corpsBiens(l)}</div></div></div>`;
}

/** Chercher et trier dans la page des biens : `familles(d)` donne ses familles. */
export const actionsBiens = (familles) => ({
  chercherBien(ctx, el, d) { vueBiens.q = el.value ?? ""; const c = document.getElementById("jr-bx-corps"); if (c && d) c.innerHTML = corpsBiens(sansBoites(familles(d))); },
  trierBiens(ctx, el) { vueBiens.tri = el.value ?? "valeur"; ctx.redessiner(); },
});

const pageBiens = {
  titre: "Ses biens",
  css: CSS_JOUEUR,
  donnees: donneesJoueur,
  rendu(d, ctx, p) {
    const f = d?.f;
    if (!f) return `${entetePousse("Ses biens")}${vide("Ce joueur n'est plus dans le monde.")}`;
    return rendreBiens(f.familles, { moi: f.moi, pseudo: qui(d, p).pseudo || f.pseudo });
  },
  actions: actionsBiens((d) => d?.f?.familles),
};

// Les sections repliées restent repliées d'un dessin à l'autre.
if (typeof document !== "undefined") {
  document.addEventListener("toggle", (ev) => {
    const f = ev.target?.closest?.(".jr-bx-famille")?.dataset?.famille;
    if (f && ev.target.classList.contains("jr-bx-famille")) { if (ev.target.open) vueBiens.replies.delete(f); else vueBiens.replies.add(f); }
  }, true);
}

// RNT-212 : « ami » (l'ancienne fiche d'un ami) ouvre le même profil.
// D454 : les pages des cartes du profil (ses biens, boîtes et activité, palmarès, entre vous).
export const pages = { joueurs: pageJoueurs, joueur: pageJoueur, ami: pageJoueur, biensJoueur: pageBiens,
  activiteJoueur: pageActiviteJoueur, palmaresJoueur: pagePalmaresJoueur, entreVousJoueur: pageEntreVousJoueur };
