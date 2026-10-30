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
import { montant as montantBrut, variation, esc, duree } from "../format.js";
import { entetePousse, carte, segment, vide, petit, bouton } from "../ui.js";
import * as L from "../enligne.js";
import { avatarAutre, entreVous, actionsFiche, liensFiche } from "./enligne.js";
import * as S from "./social.js";
import * as C from "../cosmetiques.js"; // RNT-231 : ses cosmétiques équipés

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
};
const ic = (nom, t = 20) =>
  `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAITS[nom] ?? TRAITS.sparkles}</svg>`;

// MARK: Les données

/** Ce que le moteur demande pour la page et la fiche : profils, relevés, amis, demandes, fil. */
function parametres() {
  const a = L.monde.amis ?? {};
  return {
    profils: L.monde.profils, releves: L.monde.fortunes ?? {}, fil: L.monde.fil ?? [],
    amis: (a.amis ?? []).map((x) => x.id), demandes: (a.envoyees ?? []).map((x) => x.id), bloques: L.monde.bloques ?? [],
    ...(L.monde.refusDiscussion ? { refusDiscussion: L.monde.refusDiscussion } : {}),
  };
}

const vue = { tri: "fortune", classement: "fortune" };

// MARK: La page « Les joueurs »

const ligneJoueur = (x) => `<button class="jr-ligne ${x.moi ? "moi" : ""}" data-action="ficheJoueur" data-id="${esc(x.id)}" aria-label="${esc(x.pseudo)}${x.bot ? ", bot" : ""}, ${esc(x.ou)}">
    <span class="jr-av">${avatarAutre(x, 42)}${x.memeLieu ? '<i class="jr-ici" title="Au même endroit que toi"></i>' : ""}</span>
    <span class="jr-qui">
      <span class="jr-nom"><span class="el-coupe">${x.moi ? esc(`${x.pseudo} (toi)`) : C.pseudoHabille(x.pseudo, x.cosmetiques)}</span>${x.bot ? '<span class="jr-pastille">bot</span>' : ""}</span>
      <span class="jr-sous">${x.bot && x.caractere ? `<span class="jr-caractere">${esc(x.caractere)}</span> · ` : ""}${x.activite ? `<b>${esc(x.activite)}</b> · ` : ""}${esc(x.ou)}</span>
    </span>
    <span class="jr-chiffres"><span class="chiffres">${montant(x.patrimoine)}</span>
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
      <span style="flex:1;min-width:0;display:grid"><span class="jr-nom"><span class="el-coupe">${esc(r.moi ? `${r.pseudo} (toi)` : r.pseudo)}</span>${r.bot ? '<span class="jr-pastille">bot</span>' : ""}</span>
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
    return { t: r?.joueurs ?? null };
  },
  rendu(d) {
    const t = d.t;
    if (!t) return `${entetePousse("Les joueurs")}${vide("Les joueurs se retrouvent dans un monde en ligne : rejoins-en un, privé ou public.")}`;
    const groupes = t.groupes.filter((g) => g.lignes.length);
    return `${entetePousse("Les joueurs")}<div class="pile" style="gap:16px">
      <p class="aide" style="margin:0 4px">${esc(t.resume)} dans ce monde. Touche quelqu'un pour sa fiche : sa courbe, ce qu'il fait, et tout ce que vous pouvez faire ensemble.</p>
      ${carte(classementSaison(t))}
      ${segment(t.tris.map((x) => [x.id, x.nom]), vue.tri, "triJoueurs")}
      ${groupes.map((g) => `<div>${g.titre ? `<div class="section" style="margin-top:0">${esc(g.titre)}</div>` : ""}${carte(g.lignes.map(ligneJoueur).join(filet))}</div>`).join("")}
      ${invitationNotifications()}
    </div>`;
  },
  tic(ctx, d) { if (d?.t && Date.now() - L.monde.derniere > 60_000) L.synchroniser(ctx).then((ok) => { if (ok) ctx.rafraichir(); }); },
  actions: {
    triJoueurs(ctx, b) { vue.tri = b.dataset.valeur; ctx.rafraichir(); },
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
  const W = 320, H = 132, H0 = 10, H1 = 112;
  const valeurs = [...c.lui, ...c.moi].filter((v) => v != null);
  if (valeurs.length < 2) return "";
  let min = Math.min(...valeurs), max = Math.max(...valeurs);
  if (max === min) { min -= 1; max += 1; }
  const n = c.jours.length;
  const x = (i) => (n > 1 ? (i / (n - 1)) * W : W / 2);
  const y = (v) => H1 - ((v - min) / (max - min)) * (H1 - H0);
  const trace = (serie) => {
    const pts = serie.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean);
    return pts.length === 1 ? [pts[0], pts[0]] : pts;
  };
  const lui = trace(c.lui), moi = trace(c.moi);
  const dernier = (serie) => { for (let i = serie.length - 1; i >= 0; i--) if (serie[i] != null) return [x(i), y(serie[i])]; return null; };
  const [lx, ly] = dernier(c.lui) ?? [W, H1];
  const m = dernier(c.moi);
  const id = `jr${Math.random().toString(36).slice(2, 7)}`;
  return `<figure class="jr-courbe" aria-label="${esc(c.resume)}"><div class="jr-trace">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${teinte}" stop-opacity=".28"/><stop offset="1" stop-color="${teinte}" stop-opacity="0"/></linearGradient></defs>
      ${[0.25, 0.5, 0.75].map((k) => `<line x1="0" x2="${W}" y1="${(H0 + k * (H1 - H0)).toFixed(1)}" y2="${(H0 + k * (H1 - H0)).toFixed(1)}" stroke="rgba(255,255,255,.05)" vector-effect="non-scaling-stroke"/>`).join("")}
      ${lui.length ? `<polygon points="${lui[0].split(",")[0]},${H1} ${lui.join(" ")} ${lx.toFixed(1)},${H1}" fill="url(#${id})"/>` : ""}
      ${moi.length ? `<polyline class="jr-moi" points="${moi.join(" ")}" fill="none" stroke="var(--texte2)" stroke-width="1.6" stroke-dasharray="4 4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>` : ""}
      ${lui.length ? `<polyline class="jr-lui" points="${lui.join(" ")}" fill="none" stroke="${teinte}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : ""}
    </svg>
    <i class="jr-point" style="left:${((lx / W) * 100).toFixed(2)}%;top:${((ly / H) * 100).toFixed(2)}%;--c:${teinte}"></i>
    ${m ? `<i class="jr-point moi" style="left:${((m[0] / W) * 100).toFixed(2)}%;top:${((m[1] / H) * 100).toFixed(2)}%"></i>` : ""}</div>
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
const lignePossession = (x) => `<div class="rangee" style="gap:12px;padding:13px 16px">
  <span class="t2" style="width:22px;flex:none;display:grid">${ic(x.icone)}</span>
  <div style="flex:1;min-width:0"><div class="libelle el-coupe">${esc(x.titre)}</div>${x.detail ? `<div class="aide">${esc(x.detail)}</div>` : ""}</div>
  <span class="chiffres ${x.ton}" style="font-size:15px;white-space:nowrap">${esc(x.valeur)}</span></div>`;

/**
 * RNT-212 : ouvre le profil d'un joueur ou d'un bot, d'où qu'on vienne (la page, le classement, la carte, l'Ici,
 * les amis, le fil, la bourse du monde, Entre joueurs) : la page « joueur », par-dessus une feuille fermée.
 */
export async function ouvrirFicheJoueur(ctx, id, pseudo = "") {
  if (!id) return null;
  ctx.fermerFeuille();
  return ctx.ouvrir("joueur", pseudo ? { id: String(id), pseudo } : { id: String(id) });
}

const embleme = () => `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
  <defs><linearGradient id="jr-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4E3B0"/><stop offset="1" stop-color="#B78A3B"/></linearGradient></defs>
  <circle cx="12" cy="12" r="11.5" fill="url(#jr-or)"/><circle cx="12" cy="12" r="8.6" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".8"/>
  <text x="12" y="16.3" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="12.5" fill="rgba(0,0,0,.55)">G</text></svg>`;

/** La carte de membre d'un autre joueur (CarteDeMembre) : « Membre » ou « Bot », l'avatar, le pseudo et son titre, où et combien. */
function carteMembre({ pseudo, titre, bot, lieu, chiffre, mention, avatar, cosmetiques = null }) {
  const h = C.habillageMembre(cosmetiques); // RNT-231 : son fond, son accent, sa bannière, son pseudo animé
  return `<div class="cl-membre jr-membre ${h.classe}" ${h.style} role="img" aria-label="${esc(`${pseudo}${bot ? ", bot" : ""}${titre ? `, ${titre}` : ""}. ${lieu}. ${chiffre}`)}">${h.banniere}
    <span class="cl-membre-haut">${embleme()}<span class="cl-mot">${bot ? "Bot" : "Membre"}</span>${avatar}</span>
    <span class="cl-membre-pseudo ${h.pseudo}">${esc(pseudo)}</span>
    ${titre ? `<span class="jr-membre-titre">${esc(titre)}</span>` : ""}
    <span class="cl-membre-bas"><span>${esc(lieu)}</span><span class="chiffres">${esc(chiffre)}</span></span>
    ${mention ? `<span class="cl-membre-depuis">${esc(mention)}</span>` : ""}</div>`;
}

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

function rendreProfil(d, ctx, p) {
  const n = ctx.maintenant();
  const { f, prof, ev } = d;
  const ami = d.ami;
  const pseudo = qui(d, p).pseudo || "Ce joueur";
  if (!f && !prof && !ami) return `${entetePousse("Profil")}${vide("Ce joueur n'est plus dans le monde.")}`;
  const fp = d.fiche?.profil ?? null; // un ami hors du monde : son dernier monde publié
  const pp = prof ?? fp;
  const vitrine = d.fiche?.vitrine ?? ami?.vitrine ?? null;
  const teinte = hex(f?.teinte ?? pp?.teinte);
  const pres = presence(d, n);
  const lieu = f ? f.ou : pres ?? "Hors de ton monde";
  const chiffre = f ? `Fortune ${montant(f.patrimoine)}` : vitrine?.record != null ? `Record ${montant(vitrine.record)}` : pp ? `Patrimoine ${montant(pp.patrimoine)}` : "";
  const mention = f?.bot ? `${f.bot.libelle}, ${f.bot.niveau.toLowerCase()}` : f?.moi ? "C'est toi" : ami ? (pres ? `Ton ami · ${pres}` : "Ton ami")
    : prof ? "Joue dans ton monde" : "";
  const avatar = pp ? avatarAutre(pp, 52) : `<span class="so-initiale jr-initiale" aria-hidden="true">${esc(String(pseudo).slice(0, 1).toUpperCase())}</span>`;
  const cosmetiques = f?.cosmetiques ?? pp?.cosmetiques ?? null;
  const tete = carteMembre({ pseudo, titre: f?.titre ?? pp?.titre, bot: !!f?.bot, lieu, chiffre, mention, avatar, cosmetiques })
    + vitrineCosmetiques(cosmetiques, f?.collection ?? pp?.collection);

  const saison = f ? `<div class="jr-tete" style="--t:${teinte}">
      <div class="jr-bande">
        <div><div class="chiffres" style="font-size:22px">${montant(f.patrimoine)}</div><div class="aide">Fortune</div></div>
        <div><div class="chiffres ${f.rang === 1 ? "or" : ""}" style="font-size:22px">${f.rang ? ordinal(f.rang) : "–"}</div><div class="aide">sur ${f.total}</div></div>
        <div><div class="chiffres ${f.variationSemaine > 0 ? "gain" : f.variationSemaine < 0 ? "perte" : ""}" style="font-size:22px">${variation(f.variationSemaine)}</div><div class="aide">7 jours</div></div>
      </div>
      ${f.courbe ? `${courbeComparee(f.courbe, teinte, f.moi ? "Toi" : f.pseudo)}<p class="jr-resume">${esc(f.courbe.resume)}</p>` : `<p class="aide" style="margin-top:12px">La courbe se dessine après quelques jours.</p>`}
    </div>` : fp ? S.stats(fp) : "";

  const liste = actionsProfil(d);
  const ensemble = liste.length ? `<div><div class="section" style="margin-top:0">Ensemble</div><div class="jr-actions">${liste.map(tuileAction).join("")}</div></div>` : "";
  const ceBot = f?.bot ? section("Ce bot", `<div class="jr-bot">
        <div><div class="aide">Caractère</div><div class="libelle">${esc(f.bot.caractere)}</div><div class="aide">${esc(f.bot.description)}</div></div>
        <div><div class="aide">Niveau</div><div class="libelle">${esc(f.bot.niveau)}</div><div class="aide">${esc(f.bot.rythme)}</div></div></div>`,
      "Un bot joue avec les mêmes règles que toi, même quand tu dors. Il cède sa place au prochain vrai joueur.") : "";
  const activite = f ? section(f.moi ? "Ton activité" : "Son activité", [...f.statut, ...f.faits].map((x) => `<div class="rangee" style="gap:12px;padding:12px 16px">
        <span class="t2" style="width:20px;flex:none;display:grid">${ic(x.icone, 18)}</span><span style="font-size:14px;flex:1">${esc(x.texte)}</span></div>`).join(filet)
      || `<p class="aide" style="padding:16px">Rien de visible pour l'instant.</p>`) : "";
  const bande = (els) => `<div class="jr-chiffres-bande">${els.map(([t, v]) => `<div><div class="chiffres">${esc(v)}</div><div class="aide">${esc(t)}</div></div>`).join("")}</div>`;
  const accompli = f || vitrine ? section(f?.moi ? "Ce que tu as accompli" : "Ce qu'il a accompli", [
      vitrine ? bande([["Niveau", String(vitrine.niveau ?? 1)], ["7 jours", duree(vitrine.focus7j ?? 0)], ["Record", vitrine.record != null ? montant(vitrine.record) : "–"]]) : "",
      f ? bande([["Semaine", f.focus.semaine], ["Saison", f.focus.saison], ["Série", f.focus.serie]]) : "",
      f ? grilleClassements(f.classements) : "",
    ].filter(Boolean).join(filet), f ? `Sa place dans les six classements du monde, sur ${f.total}.` : "") : "";
  const possessions = f ? `${f.possessions.map((s) => section(s.titre, s.lignes.map(lignePossession).join(filet), s.pied ?? "")).join("")}
    ${!f.moi && !f.possessions.length ? `<p class="aide" style="margin:0 4px">Il ne montre encore rien de ce qu'il possède.</p>` : ""}` : "";
  const entreAmis = ami ? `${S.blocDefi(L.monde.defis ?? [], ami, n)}${S.blocInviter(d.mondes ?? [], new Set((d.fiche?.mondes ?? []).map((m) => m.code)))}
    ${(d.fiche?.mondes ?? []).some((m) => m.ensemble) ? `<div><div class="section so-section">Vos mondes ensemble</div>${carte(d.fiche.mondes.filter((m) => m.ensemble).map((m, k) => `${k ? filet : ""}${S.ligneMonde(m.nom, m.prive, `Code ${m.code}`, "")}`).join(""))}</div>` : ""}
    ${d.fiche?.erreur ? `<p class="aide">${esc(d.fiche.erreur)}</p>` : ""}` : "";
  const maj = f?.majLe ?? Date.parse(pp?.majLe ?? "");
  const autour = ev ? `${entreVous(prof, ev)}${liensFiche(prof)}` : "";
  const fin = `${ami ? bouton("Retirer de mes amis", "retirerAmi", { genre: "secondaire" }).replace('class="bouton secondaire"', 'class="bouton secondaire so-retirer"') : ""}
    ${Number.isFinite(maj) ? `<p class="aide" style="padding:0 4px">Mis à jour ${relatif(maj, n)}.</p>` : ""}`;

  // Au large : deux colonnes, comme l'iPhone retourné ; entre amis, la discussion se tient à droite, en panneau.
  const gauche = `${tete}${saison}${ensemble}${ceBot}`;
  const droite = `${activite}${accompli}${possessions}${entreAmis}${autour}${fin}`;
  const panneau = ami ? `<aside class="so-panneau-discussion" aria-label="Discussion avec ${esc(pseudo)}"><div class="libelle so-titre-bloc">Discussion</div>${S.discussion(d)}</aside>` : "";
  return `${entetePousse(f?.moi ? "Ton profil" : pseudo)}<div class="so-page so-ami jr-page"><div class="so-deux">
    ${ami ? `<div class="pile jr-colonne">${gauche}${droite}</div>${panneau}` : `<div class="pile jr-colonne">${gauche}</div><div class="pile jr-colonne">${droite}</div>`}
  </div></div>`;
}

const ACTIONS_FICHE = ["feuillePret", "combinesJoueur", "signalerInspection", "signalerComportement", "copierJoueur", "feuilleCombineDuo",
  "feuilleChantage", "signalerPreuve", "rejoindreVille"];

const pageJoueur = {
  titre: "Profil",
  css: ["compte", "enligne"], // la carte de membre (compte.css), les pièces entre amis (enligne.css)
  async donnees(ctx, p) {
    styles();
    await C.chargerCatalogue(ctx);
    const id = String(p?.id ?? "");
    if (!L.monde.code) await L.synchroniser(ctx, { force: true }).catch(() => false);
    if (!(L.monde.amis?.amis ?? []).length) await L.chargerAmis().catch(() => null);
    const prof = L.monde.profils.find((x) => lc(x.id) === lc(id)) ?? null;
    const ami = (L.monde.amis?.amis ?? []).find((x) => lc(x.id) === lc(id)) ?? null;
    const f = L.monde.code && prof ? (await ctx.jouer("enLigne.ficheJoueur", { joueur: id, ...parametres() }, { silencieux: true }))?.fiche ?? null : null;
    const ev = f && !f.moi ? await ctx.jouer("enLigne.entreVous", { joueur: prof.id, interactions: L.monde.interactions }, { silencieux: true }) : null;
    // Un ami : sa vitrine, ses mondes, mes mondes (pour l'y inviter) ; la discussion se lit quand elle se voit.
    const a = ami ? await S.lireAmi(ctx, { id: ami.id, pseudo: ami.pseudo }) : {};
    return { ...a, f, prof, ev, ami };
  },
  rendu: (d, ctx, p) => rendreProfil(d, ctx, p),
  apres(ctx, d, p) {
    if (!d?.ami) return;
    S.enBasDuFil();
    if (!d.coupe && d.messages === null && document.getElementById("fil-discussion")?.offsetParent) S.relireDiscussion(ctx, d, qui(d, p));
  },
  tic(ctx, d, p) {
    if (d?.ami && !d.coupe && Date.now() - (d.lu ?? 0) > 5000 && document.getElementById("fil-discussion")?.offsetParent) S.relireDiscussion(ctx, d, qui(d, p));
  },
  actions: {
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
        case "manger": case "aller": case "inspecter": {
          if (dest.page === "monde") return ctx.ouvrir("monde", { ville: dest.params?.ville });
          const { executer } = await import("../ici.js");
          return executer(ctx, dest);
        }
        case "ami":
          try { await L.demanderAmi(moi.pseudo); await L.chargerAmis(); ctx.toast(`Demande envoyée à ${moi.pseudo}`, "gain"); } catch (e) { ctx.toast(e.message, "refus"); }
          return ctx.rafraichir();
        case "combine": return actionsFiche(d.prof, d.ev).feuilleCombineDuo(ctx);
        case "coup": return actionsFiche(d.prof, d.ev).combinesJoueur(ctx);
        case "voyage": return feuilleVoyage(ctx, d.prof);
        case "bloquer": {
          const r = await L.bloquer(ctx, d.prof.id, dest.params?.bloque === "1");
          if (r) return ctx.toast(r, "refus");
          ctx.toast(dest.params?.bloque === "1" ? `${moi.pseudo} est bloqué` : `${moi.pseudo} est débloqué`, "gain");
          return ctx.rafraichir();
        }
        default: return null;
      }
    },
  },
};

/** Voyage à deux : qui paie quoi, puis l'invitation part avec le trajet commencé. */
function feuilleVoyage(ctx, p) {
  let frais = "partage";
  const choix = [["invitant", "Je t'invite"], ["partage", "On partage"], ["chacun", "Chacun paie"]];
  ctx.feuille({ titre: `Voyager avec ${p.pseudo}`, rendu: () => `<div class="pile" style="gap:14px">
    <p class="aide">Il part avec toi, à la même heure, par le même moyen. Un voyage à deux rend la route plus agréable, et une combine en chemin moins risquée.</p>
    <div class="choix">${choix.map(([v, n]) => petit(n, "fraisVoyage", { plein: frais === v, donnees: { valeur: v } })).join("")}</div>
    ${bouton(`Inviter ${esc(p.pseudo)}`, "envoyerVoyage", { genre: "teinte", teinte: "var(--equipe)" })}</div>`, actions: {
    fraisVoyage(c, b) { frais = b.dataset.valeur; c.redessiner(); },
    async envoyerVoyage(c) {
      const r = await L.inviterEnVoyage(c, p.id, frais);
      if (r) return c.toast(r, "refus");
      c.fermerFeuille(); c.toast("Invitation envoyée", "gain");
    },
  } });
}

// MARK: Styles

function styles() {
  if (document.getElementById("styles-joueurs")) return;
  const s = document.createElement("style");
  s.id = "styles-joueurs";
  s.textContent = `
.jr-ligne { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; text-align: left; }
.jr-ligne.moi { background: rgba(255,255,255,.035); }
.jr-ligne:hover, .jr-rang:hover { background: rgba(255,255,255,.03); }
.jr-av { position: relative; flex: none; display: grid; }
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
`;
  document.head.append(s);
}

// RNT-212 : « ami » (l'ancienne fiche d'un ami) ouvre le même profil.
export const pages = { joueurs: pageJoueurs, joueur: pageJoueur, ami: pageJoueur };
