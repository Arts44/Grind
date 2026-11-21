// ══════════════════════════════════════════════════════════════════════
//  Le social en ligne (lot E) : ce que l'iPhone montre entre amis et le
//  journal du monde, copiés écran par écran.
//
//    gazette           EcranGazette (RNT-282) : la Gazette du dimanche soir, son archive
//                      (D352 : la Feuille du dimanche, RNT-106, y est fondue)
//    amis              EcranAmis : ajouter, invitations, demandes, défis,
//                      tes amis, le classement des 7 jours (DefisAmis)
//    (ami)             RNT-212 : la fiche d'un ami est devenue son profil
//                      (joueurs.js, page « joueur ») ; ce fichier en garde
//                      les pièces : vitrine, son dernier monde, pousser, le
//                      défi, inviter dans un monde, vos mondes, retirer
//    discussionAmi     DiscussionAmi : les bulles, relues toutes les 5 s
//
//  Les styles sont dans web/css/pages/enligne.css (classes « so- ») ; le
//  transport dans ../enligne.js (defis_*, journal_*, ami_*).
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc, duree } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, bouton, petit, icones, lienJoueur } from "../ui.js?v=3e8bddd9";
import * as L from "../enligne.js?v=3e8bddd9";
import { carteReseau } from "./trainvie.js?v=3e8bddd9";

const montant = (c) => montantBrut(c).replace("-", "−");
const filet = '<div class="filet"></div>';
const lc = (x) => String(x ?? "").toLowerCase();
/** Montant.pourcentage(x, decimales: 0) : « +12 % », « −3 % », « 0 % ». */
const pctSigne = (x, d = 0) => {
  const v = Math.round(Math.abs(x * 100) * 10 ** d) / 10 ** d;
  const corps = v.toFixed(d).replace(".", ",");
  return `${v > 0 ? (x < 0 ? "−" : "+") : ""}${corps} %`;
};
const S = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICONE = {
  drapeaux: S('<path d="M5 21V4M5 4h9l-1.5 3L14 10H5M19 21V8M19 8h-4"/>'),
  couronne: S('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>', 'fill="currentColor"'),
  bulles: S('<path d="M4 15.5V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8zM20 10v9l-3-2.5h-6a2 2 0 0 1-2-2"/>'),
  eclair: S('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', 'fill="currentColor"'),
  coche: S('<path d="M5 12.5 10 17 19 7"/>'),
  avion: S('<path d="M21 3 3 10.5l7 2.5 2.5 7z"/>'),
  fleche: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  haut: S('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  minuteur: S('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>'),
  globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>'),
};

/** « il y a 3 minutes » (.relative(presentation: .named)). */
export function relatif(ms, maintenant = Date.now()) {
  const s = Math.round((ms - maintenant) / 1000);
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const a = Math.abs(s);
  if (a < 60) return rtf.format(Math.round(s), "second");
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86_400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86_400), "day");
}

// MARK: - La vitrine d'un ami (D185)

/** « En focus, encore 18 min » ; null hors session (VitrineCompte.statutFocus). */
export function statutFocus(v, maintenant) {
  const fin = L.dateVitrine(v?.enFocusJusqua);
  if (!fin || fin <= maintenant) return null;
  const reste = Math.max(1, Math.floor((fin - maintenant) / 60_000));
  const quoi = { sport: "Au sport", lecture: "En lecture", revision: "En révision" }[v.typeFocus] ?? "En focus";
  return `${quoi}, encore ${reste} min`;
}
export const enFocus = (v, n) => { const fin = L.dateVitrine(v?.enFocusJusqua); return !!fin && fin > n; };
export const vuRecemment = (vu, n) => !!vu && Date.parse(vu) > n - 600_000;

// MARK: - Les défis (CarteDefi)

/** Le jour « 2026-10-17 » de Bruxelles à `ms` ; le défi se compte en jours de Bruxelles, comme le serveur. */
const jourBruxelles = (ms) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" }).format(ms);
const enJours = (s) => { const [a, m, j] = String(s).split("-").map(Number); return Date.UTC(a, m - 1, j) / 86_400_000; };
/** Jours qui restent, aujourd'hui compris (0 : fini). */
export const joursRestants = (d, maintenant) => (d.fin ? Math.max(0, enJours(d.fin) - enJours(jourBruxelles(maintenant)) + 1) : 0);

function etiquetteDefi(d, n) {
  if (d.statut === "attente") return ["En attente", "var(--alerte)"];
  if (d.statut === "fini") return ["Terminé", d.moi >= d.lui ? "var(--gain)" : "var(--texte2)"];
  const j = joursRestants(d, n);
  return [j <= 1 ? "Dernier jour" : `${j} jours`, "var(--equipe)"];
}

function barreDefi(nom, minutes, maxi, couleur, gagne, fini) {
  const part = maxi > 0 ? Math.max(0.02, minutes / maxi) : 0.02;
  return `<div class="so-barre" role="img" aria-label="${esc(nom)} : ${duree(minutes)} de focus">
    <div class="rangee so-barre-tete"><span class="${gagne ? "fort" : ""}">${esc(nom)}</span>${gagne && fini ? `<span class="so-couronne">${ICONE.couronne}</span>` : ""}
      <span class="espace"></span><span class="chiffres">${duree(minutes)}</span></div>
    <div class="so-rail" style="--c:${couleur};--part:${part}"><i></i></div></div>`;
}

/** Un défi : deux barres face à face, et ce qu'il reste à faire (répondre, attendre, le résultat). */
export function carteDefi(d, n) {
  const [etiquette, teinte] = etiquetteDefi(d, n);
  const maxi = Math.max(d.moi, d.lui);
  const ecart = d.moi - d.lui;
  let pied;
  if (d.statut === "attente" && !d.lanceur) {
    // D352 : un défi en attente ne se relève plus (le duel de focus est une rivalité, Entre vous) : il se refuse.
    pied = `<p class="aide">Les défis deviennent des duels de focus : lance-en un depuis son profil, dans « Entre vous ». Celui-ci ne commencera pas.</p>
      <div class="rangee">${petit("Refuser", "repondreDefi", { donnees: { id: d.id, oui: "0" } })}</div>`;
  } else if (d.statut === "attente") {
    pied = `<div class="rangee"><p class="aide espace">Les défis deviennent des duels de focus (Entre vous) : celui-ci ne commencera pas.</p>${petit("Retirer", "annulerDefi", { donnees: { id: d.id } })}</div>`;
  } else if (d.statut === "fini") {
    pied = `<p class="aide">${d.moi > d.lui ? "Tu as gagné. La revanche : un duel de focus, depuis son profil (Entre vous)." : d.moi < d.lui ? `${esc(d.pseudo)} a gagné. La revanche : un duel de focus, depuis son profil (Entre vous).` : "Égalité parfaite."}</p>`;
  } else {
    pied = `<p class="aide">${ecart > 0 ? `Tu mènes de ${duree(ecart)}. Tes sessions comptent jusqu'au dernier jour.` : ecart < 0 ? `Il te manque ${duree(-ecart)} pour passer devant.` : "À égalité. La prochaine session fait la différence."}</p>`;
  }
  return `<div class="carte pad so-defi" data-defi="${esc(d.id)}">
    <div class="rangee so-defi-tete"><span class="so-defi-titre">${ICONE.drapeaux}<span>Défi contre ${esc(d.pseudo)}</span></span><span class="espace"></span>
      <span class="so-etiquette chiffres" style="--c:${teinte}">${esc(etiquette)}</span></div>
    ${d.statut !== "attente" ? `${barreDefi("Toi", d.moi, maxi, "var(--equipe)", d.moi > d.lui, d.statut === "fini")}${barreDefi(d.pseudo, d.lui, maxi, "var(--texte2)", d.lui > d.moi, d.statut === "fini")}` : ""}
    ${pied}</div>`;
}

export const actionsDefis = {
  async repondreDefi(ctx, b) {
    b.disabled = true;
    try { await L.repondreDefi(Number(b.dataset.id), false); } catch (e) { ctx.toast(e.message, "refus"); }
    await L.chargerDefis(ctx);
    ctx.rafraichir();
  },
  async annulerDefi(ctx, b) {
    b.disabled = true;
    await L.annulerDefi(Number(b.dataset.id)).catch(() => {});
    await L.chargerDefis(ctx);
    ctx.rafraichir();
  },
};

/** Le classement des sept derniers jours : toi et tes amis, au focus (ClassementAmis). */
export function classementAmis(amis, moi) {
  const lignes = [...amis.filter((a) => a.vitrine).map((a) => ({ id: a.id, nom: a.pseudo, minutes: a.vitrine.focus7j ?? 0, niveau: a.vitrine.niveau, toi: false })),
    { id: "moi", nom: "Toi", minutes: moi?.focus7j ?? 0, niveau: moi?.niveau, toi: true }]
    .sort((a, b) => (a.minutes === b.minutes ? (a.toi ? -1 : b.toi ? 1 : 0) : b.minutes - a.minutes));
  const maxi = Math.max(1, ...lignes.map((l) => l.minutes));
  const sans = amis.some((a) => !a.vitrine);
  return `<div><div class="section so-section">Focus des 7 derniers jours</div>${carte(lignes.map((l, k) => `${k ? filet : ""}
    <div class="so-classe" role="img" aria-label="${k + 1}e, ${esc(l.nom)}, ${duree(l.minutes)} de focus">
      <span class="so-classe-n chiffres ${k === 0 && l.minutes > 0 ? "or" : ""}">${k + 1}</span>
      <div class="so-classe-corps"><div class="rangee so-classe-tete"><span class="${l.toi ? "so-toi" : ""}">${esc(l.nom)}</span>
        ${l.niveau != null ? `<span class="so-niv">Niv. ${l.niveau}</span>` : ""}<span class="espace"></span><span class="chiffres">${duree(l.minutes)}</span></div>
        <div class="so-rail fin" style="--c:${l.toi ? "var(--equipe)" : "color-mix(in srgb, var(--texte2) 70%, transparent)"};--part:${Math.max(0.015, l.minutes / maxi)}"><i></i></div></div>
    </div>`).join(""))}
    ${sans ? `<p class="aide so-pied">Un ami apparaît ici après avoir ouvert la nouvelle version de Grind.</p>` : ""}</div>`;
}

const rubrique = (r) => `<div class="so-rubrique"><i></i><span>${esc(r)}</span></div>`;

// MARK: - La Gazette du dimanche soir (EcranGazette, RNT-282)

const ligneGazette = (l) => `<div class="so-gaz-ligne"><div class="so-gaz-qui">${lienJoueur(l.joueur, esc(l.pseudo), { pseudo: l.pseudo })}<p>${esc(l.texte)}</p></div>${l.chiffre ? `<span class="so-gaz-chiffre chiffres">${esc(l.chiffre)}</span>` : ""}</div>`;
// D344 : un seul rendu pour tous les articles, quelle que soit leur rubrique (comme EcranGazette.article).
const articleGazette = (a) => `<section class="so-gaz-rub" data-rubrique="${esc(a.rubrique)}">${rubrique(a.titre)}${a.manchette ? `<h2 class="so-gaz-ev">${esc(a.manchette)}</h2>` : ""}${a.texte ? `<p>${esc(a.texte)}</p>` : ""}${(a.lignes ?? []).map(ligneGazette).join("")}</section>`;

function pageDeLaGazette(g, e) {
  const archive = (g.archive ?? []).length > 1 ? `<div class="so-filet-double large" aria-hidden="true"><i></i><i></i></div><section class="so-gaz-archive"><h3>Les éditions passées</h3>
      ${g.archive.map((a) => `<button class="so-gaz-passee" data-action="gazetteChoisir" data-semaine="${a.semaine}" ${a.semaine === e.semaine ? 'aria-current="true"' : ""}><b>N° ${a.numero ?? a.semaine + 1}</b><span class="it">${esc(a.date ?? "")}</span></button>`).join("")}</section>` : "";
  const articles = e.articles ?? [];
  return `<div class="so-journal-fond"><div class="so-papier so-journal so-gazette">
    <header class="so-journal-tete">
      <div class="rangee so-journal-meta"><span>N° ${e.numero}</span><span class="espace"></span><span class="so-coupe">${esc(e.monde)}</span></div>
      <div class="so-filet-double" aria-hidden="true"><i></i><i></i></div>
      <h1 class="so-journal-titre">${esc(g.titre)}</h1>
      <div class="so-filet-double" aria-hidden="true"><i></i><i></i></div>
      <div class="rangee so-journal-meta it"><span>${esc(e.date)}</span></div>
    </header>
    ${articles.length ? articles.map(articleGazette).join("") : `<section class="so-gaz-rub"><p class="aide it">Semaine calme : rien à raconter dans ton monde.</p></section>`}
    <div class="so-bas">${archive}</div>
    <footer class="so-journal-pied"><i></i><p>Paraît chaque dimanche à 20 h.</p></footer>
  </div></div>`;
}

let gazetteChoisie = null;

const pageGazette = {
  titre: "Gazette",
  async donnees(ctx) {
    gazetteChoisie = null;
    if (!L.monde.code || !L.monde.profils.length) await L.synchroniser(ctx, { force: true });
    return { g: await L.chargerGazette(ctx).catch(() => null) };
  },
  rendu(d) {
    const g = d.g;
    if (g && g.ouverte === false) return `${entetePousse("Gazette")}<div class="so-page"><p class="aide">La Gazette est coupée dans ce monde (Régler le monde).</p></div>`;
    const e = gazetteChoisie ?? g?.edition;
    if (!e) return `${entetePousse("Gazette")}<div class="so-page"><p class="aide so-gaz-attente">La première Gazette paraît dimanche à 20 h : les progressions, la plus grosse vente, les faillites.</p></div>`;
    return `${entetePousse(g.titre ?? "Gazette")}<div class="so-page">${pageDeLaGazette(g, e)}</div>`;
  },
  actions: {
    async gazetteChoisir(ctx, b) {
      const s = Number(b.dataset.semaine);
      gazetteChoisie = s === L.monde.gazette?.edition?.semaine ? null : await L.gazetteArchivee(s);
      ctx.redessiner();
    },
  },
};

// MARK: - Amis (EcranAmis)

let pseudoAmi = "";

function ligneAmi(x, n) {
  const present = enFocus(x.vitrine, n) || vuRecemment(x.vu, n);
  const statut = statutFocus(x.vitrine, n);
  const sous = x.nonLus > 0 ? `<div class="so-nouveau">${x.nonLus > 1 ? `${x.nonLus} nouveaux messages` : "Nouveau message"}</div>`
    : statut ? `<div class="so-statut">${ICONE.minuteur}${esc(statut)}</div>`
    : x.vu ? `<div class="detail">Vu ${relatif(Date.parse(x.vu), n)}</div>` : "";
  // RNT-212 : toucher un ami ouvre son profil (joueurs.js, page « joueur »), le même que celui de tout joueur.
  return `<button class="ligne" data-action="ouvrir" data-page="joueur" data-p='${esc(JSON.stringify({ id: x.id, pseudo: x.pseudo }))}'>
    <span class="pastille so-pastille-ami" style="--c:var(--equipe)">${icones.personne}${present ? '<i class="so-present"></i>' : ""}</span>
    <span class="so-flex"><div class="titre">${esc(x.pseudo)}</div>${sous}</span>
    ${x.nonLus > 0 ? `<span class="el-pastille-n">${x.nonLus}</span>` : ""}<span class="chevron">${icones.chevron}</span></button>`;
}

const pageAmis = {
  titre: "Amis",
  async donnees(ctx) {
    // RNT-197 : sans réseau, rien ne se relit : les messages, demandes et invitations arriveront au prochain wifi.
    const reseau = await ctx.tableau("reseau").catch(() => null);
    if (reseau && !reseau.discussions) return { reseau, coupe: true, a: L.monde.amis ?? { amis: [], recues: [], envoyees: [], invitations: [] }, defis: L.monde.defis ?? [] };
    const [a] = await Promise.all([L.chargerAmis(), L.chargerDefis(ctx).catch(() => null)]);
    return { reseau, a, defis: L.monde.defis ?? [], vitrine: L.monde.vitrine ?? null };
  },
  rendu(d, ctx) {
    const n = ctx.maintenant();
    const a = d.a;
    if (d.coupe) {
      return `${entetePousse("Amis")}<div class="so-page"><div class="pile so-pile">${carteReseau(d.reseau)}
        <div><div class="section so-section">Tes amis</div>${carte(a.amis.length ? a.amis.map((x, k) => `${k ? filet : ""}<div class="ligne so-eteinte">
          <span class="pastille" style="--c:var(--equipe)">${icones.personne}</span><span class="so-flex"><div class="titre">${esc(x.pseudo)}</div></span></div>`).join("")
          : `<p class="aide so-vide-carte">Pas encore d'amis.</p>`)}
          <p class="aide so-pied">Tes messages, demandes et invitations arriveront d'un coup au prochain wifi.</p></div></div></div>`;
    }
    const ajouter = carte(`<div class="pile so-ajout"><label class="libelle" for="pseudo-ami">Ajouter un ami</label>
        <div class="rangee"><input class="champ so-flex" id="pseudo-ami" placeholder="Son pseudo" autocapitalize="off" autocomplete="off" spellcheck="false" value="${esc(pseudoAmi)}" data-saisie="saisiePseudo">
        ${petit("Ajouter", "ajouterAmi", { teinte: "var(--equipe)" })}</div></div>`, { pad: true });
    const invitations = a.invitations.length ? `<div><div class="section so-section">Invitations à jouer</div>${carte(a.invitations.map((i, k) => `${k ? filet : ""}<div class="rangee so-ligne">
        <span class="pastille" style="--c:var(--equipe)">${i.prive ? icones.amis : ICONE.globe}</span><div class="so-flex"><div class="libelle">${esc(i.nom)}</div><div class="aide">${esc(i.de)} t'invite, code ${esc(i.code)}</div></div>
        ${petit("Refuser", "refuserInvitation", { donnees: { id: i.id } })}${petit("Voir", "voirInvitationAmi", { teinte: "var(--equipe)", donnees: { id: i.id, code: i.code, prive: i.prive ? "1" : "0" } })}</div>`).join(""))}
        <p class="aide so-pied">Accepter t'ouvre le monde : tu y choisis ton profil, comme avec un code.</p></div>` : "";
    const recues = a.recues.length ? `<div><div class="section so-section">Demandes reçues</div>${carte(a.recues.map((x, k) => `${k ? filet : ""}<div class="rangee so-ligne">
        <span class="pastille" style="--c:var(--equipe)">${icones.personne}</span><span class="libelle so-flex">${esc(x.pseudo)}</span>
        ${petit("Refuser", "repondreAmi", { donnees: { id: x.id, oui: "0" } })}${petit("Accepter", "repondreAmi", { teinte: "var(--equipe)", donnees: { id: x.id, oui: "1" } })}</div>`).join(""))}</div>` : "";
    const defis = d.defis?.length ? `<div class="pile so-defis"><div class="libelle so-titre-bloc">Défis</div>${d.defis.map((x) => carteDefi(x, n)).join("")}</div>` : "";
    const tes = `<div><div class="section so-section">Tes amis</div>${carte(a.amis.length ? a.amis.map((x, k) => `${k ? filet : ""}${ligneAmi(x, n)}`).join("")
        : `<p class="aide so-vide-carte">Pas encore d'amis. Ajoute-les par leur pseudo ; ils acceptent depuis cette page.</p>`)}
        ${a.envoyees.length ? `<p class="aide so-pied">En attente : ${a.envoyees.map((x) => esc(x.pseudo)).join(", ")}.</p>` : ""}</div>`;
    const classement = a.amis.length ? classementAmis(a.amis, d.vitrine) : "";
    // Au grand écran : à gauche ce qu'on fait (ajouter, répondre, tes amis), à droite les défis et le classement.
    return `${entetePousse("Amis")}<div class="so-page"><div class="so-deux">
      <div class="pile so-pile">${d.reseau && !d.reseau.wifi ? carteReseau(d.reseau, { compact: true }) : ""}${ajouter}${invitations}${recues}${tes}</div>
      <div class="pile so-pile">${defis}${classement}</div></div></div>`;
  },
  actions: {
    ...actionsDefis,
    saisiePseudo(ctx, el) { pseudoAmi = el.value; },
    async ajouterAmi(ctx) {
      const p = pseudoAmi.trim();
      if (p.length < 2) return ctx.toast("Son pseudo fait au moins 2 caractères.", "refus");
      try { await L.demanderAmi(p); pseudoAmi = ""; const c = document.getElementById("pseudo-ami"); if (c) c.value = ""; ctx.toast(`Demande envoyée à ${p}`, "gain"); ctx.rafraichir(); } catch (e) { ctx.toast(e.message, "refus"); }
    },
    async repondreAmi(ctx, b) { try { await L.repondreAmi(b.dataset.id, b.dataset.oui === "1"); } catch (e) { ctx.toast(e.message, "refus"); } ctx.rafraichir(); },
    async refuserInvitation(ctx, b) { await L.repondreInvitation(Number(b.dataset.id), false).catch(() => {}); ctx.rafraichir(); },
    async voirInvitationAmi(ctx, b) {
      L.repondreInvitation(Number(b.dataset.id), true).catch(() => {});
      await ctx.ouvrir("rejoindre", { code: b.dataset.code, vue: b.dataset.prive === "1" ? "privee" : "publique" });
    },
  },
};

// MARK: - La fiche d'un ami (FicheAmi)

/** L'état de la fiche ouverte : les invitations envoyées, « Pousser » envoyé, le texte en cours. */
export const fiche = { id: null, invites: new Set(), pousse: false, lance: false, brouillon: "" };

export function puces(v) {
  const puce = (t, x) => `<div class="so-puce"><div class="chiffres">${esc(x)}</div><div>${esc(t)}</div></div>`;
  return `<div class="so-puces">${puce("Niveau", String(v.niveau ?? 1))}${puce("7 jours", duree(v.focus7j ?? 0))}${puce("Série", `${v.serie ?? 0} j`)}${v.record != null ? puce("Record", montant(v.record)) : ""}</div>`;
}

export function stats(p) {
  const chiffre = (v, l) => `<div class="so-chiffre"><div class="chiffres">${v}</div><div class="aide">${l}</div></div>`;
  const prog = p.patrimoineDepart > 0 ? p.patrimoine / p.patrimoineDepart - 1 : 0;
  const n = (k, un, x) => (x?.length ? `${x.length} ${un}${x.length > 1 ? "s" : ""}` : null);
  const avoirs = [n("b", "boîte", p.boites), n("b", "bien", p.biens), n("v", "véhicule", p.vehicules)].filter(Boolean);
  return carte(`<div class="pile so-stats"><div class="rangee"><span class="libelle">Son dernier monde</span><span class="espace"></span><span class="aide">Jour ${p.jour}</span></div>
    <div class="so-chiffres">${chiffre(montant(p.patrimoine), "patrimoine")}${chiffre(pctSigne(prog), "depuis le départ")}
      ${chiffre(`${Math.floor((p.minutesFocusSemaine ?? 0) / 60)} h`, "de focus cette semaine")}${chiffre(`${p.serie ?? 0} j`, "de série")}</div>
    ${(p.boites?.length || p.biens?.length) && avoirs.length ? `<p class="aide">${avoirs.join(", ")}</p>` : ""}</div>`, { pad: true });
}

export const ligneMonde = (nom, prive, detail, droite) => `<div class="rangee so-ligne">
  <span class="pastille" style="--c:var(--equipe)">${prive ? icones.amis : ICONE.globe}</span>
  <div class="so-flex"><div class="libelle so-coupe">${esc(nom)}</div><div class="aide">${esc(detail)}</div></div>${droite}</div>`;

export function blocInviter(mondes, dedans) {
  const pied = mondes.length ? "Il reçoit l'invitation dans ses amis ; en l'acceptant, il choisit son profil." : "Tu ne joues dans aucun monde en ligne : rejoins-en un ou crée le tien pour l'y inviter.";
  return `<div><div class="section so-section">Inviter dans un monde</div>${carte(mondes.length ? mondes.map((m, k) => `${k ? filet : ""}${ligneMonde(m.nom, m.prive !== false, m.prive === false ? "Monde public" : `Monde privé, code ${m.code}`,
      dedans.has(m.code) ? `<span class="so-etat t2">${ICONE.coche}Déjà dedans</span>`
      : fiche.invites.has(m.code) ? `<span class="so-etat so-bleu">${ICONE.avion}Invité</span>`
      : petit("Inviter", "inviterDansMonde", { teinte: "var(--equipe)", donnees: { code: m.code, nom: m.nom } }))}`).join("")
    : `<p class="aide so-vide-carte">Aucun monde en cours.</p>`)}<p class="aide so-pied">${pied}</p></div>`;
}

/** Les bulles d'une discussion (DiscussionAmi.bulle) : un jour en tête de chaque journée, l'état sous la dernière. */
function bulles(messages) {
  if (!messages.length) return "";
  const jour = new Intl.DateTimeFormat("fr-BE", { weekday: "long", day: "numeric", month: "long" });
  const heure = new Intl.DateTimeFormat("fr-BE", { hour: "2-digit", minute: "2-digit" });
  const cle = (ms) => new Date(ms).toDateString();
  return messages.map((m, k) => {
    const t = Date.parse(m.cree) || Date.now();
    const sep = k === 0 || cle(Date.parse(messages[k - 1].cree)) !== cle(t) ? `<div class="so-jour">${esc(jour.format(t))}</div>` : "";
    const der = k === messages.length - 1 ? `<div class="so-sous-bulle">${m.moi ? `${m.lu ? "Lu" : "Envoyé"}, ` : ""}${heure.format(t)}</div>` : "";
    return `${sep}<div class="so-bulle-l ${m.moi ? "moi" : ""}"><div class="so-bulle">${esc(m.texte)}</div>${der}</div>`;
  }).join("");
}

const filVide = (d) => (d.messages === null ? "" : `<div class="so-vide-discussion">${ICONE.bulles}<p class="aide">Écris-lui le premier message.</p></div>`);

export function discussion(d, { id = "fil-discussion" } = {}) {
  const coupe = d.coupe;
  // RNT-197 : sans réseau, la discussion attend le prochain wifi.
  const corps = coupe ? `${d.reseau ? carteReseau(d.reseau) : ""}<p class="aide so-coupee" id="discussion-coupee">Pas de réseau : la discussion revient au prochain wifi, avec ce qu'il t'a écrit entre-temps.</p>`
    : d.messages?.length ? bulles(d.messages) : filVide(d);
  return `<div class="so-discussion"><div class="so-fil" id="${id}" aria-live="polite">${corps}</div>
    <div class="so-saisie"><textarea class="so-message" id="message-ami" rows="1" maxlength="1000" placeholder="Message" autocomplete="off" data-saisie="saisieMessage" ${coupe ? "disabled" : ""}>${esc(fiche.brouillon)}</textarea>
      <button class="so-envoyer" data-action="envoyerMessage" aria-label="Envoyer" ${coupe || !fiche.brouillon.trim() ? "disabled" : ""}>${ICONE.haut}</button></div></div>`;
}

/**
 * Ce que lit la fiche (et la discussion) : sa fiche publiée, mes mondes, les défis ; la discussion, elle, ne se
 * lit que quand elle se voit (la page poussée, ou le panneau du grand écran) : la lire marque ses messages lus.
 */
export async function lireAmi(ctx, p, { avecFiche = true } = {}) {
  const reseau = await ctx.tableau("reseau").catch(() => null);
  const coupe = !!reseau && !reseau.discussions;
  if (fiche.id !== p.id) Object.assign(fiche, { id: p.id, invites: new Set(), pousse: false, lance: false, brouillon: "" });
  const [fi, messages, parties] = await Promise.all([
    avecFiche && !coupe ? L.ficheAmi(p.id).catch((e) => ({ erreur: e.message })) : null,
    coupe || avecFiche ? null : L.discussionAmi(p.id).catch(() => []),
    avecFiche ? ctx.jouer("parties", {}, { silencieux: true }).catch(() => null) : null,
  ]);
  if (avecFiche && !coupe) await L.chargerDefis(ctx).catch(() => null);
  if (messages) marquerLu(p.id);
  const mondes = (parties?.parties ?? []).filter((x) => x.enLigne && !x.terminee).map((x) => x.enLigne);
  // Les 100 derniers, du plus ancien au plus récent (le serveur les rend du plus récent au plus ancien).
  return { fiche: fi, messages: messages ? messages.slice().reverse() : coupe ? [] : null, mondes, reseau, coupe, lu: messages ? Date.now() : 0 };
}

/** Relit la discussion sans toucher au reste de la page (toutes les 5 s, comme l'iPhone). */
export async function relireDiscussion(ctx, d, p) {
  if (d.coupe || d.relecture) return;
  d.relecture = true;
  try {
    const l = (await L.discussionAmi(p.id).catch(() => null))?.slice().reverse();
    if (!l) return;
    const avant = d.messages ? JSON.stringify(d.messages.map((m) => [m.id, m.lu])) : null;
    d.messages = l;
    marquerLu(p.id);
    if (JSON.stringify(l.map((m) => [m.id, m.lu])) !== avant) majFil(d);
  } finally { d.relecture = false; d.lu = Date.now(); }
}

function majFil(d) {
  const fil = document.getElementById("fil-discussion");
  if (!fil) return;
  const enBas = fil.scrollHeight - fil.scrollTop - fil.clientHeight < 40;
  fil.innerHTML = d.messages?.length ? bulles(d.messages) : filVide(d);
  if (enBas) fil.scrollTop = fil.scrollHeight;
}
/** D182 : la discussion vient d'être lue, la pastille tombe tout de suite. */
function marquerLu(id) {
  const a = (L.monde.amis?.amis ?? []).find((x) => lc(x.id) === lc(id));
  if (a) a.nonLus = 0;
}
export const enBasDuFil = () => { const f = document.getElementById("fil-discussion"); if (f) f.scrollTop = f.scrollHeight; };

export const actionsDiscussion = {
  saisieMessage(ctx, el) {
    fiche.brouillon = el.value;
    const b = document.querySelector("[data-action=envoyerMessage]");
    if (b) b.disabled = !el.value.trim();
    // Le champ grandit avec le texte, jusqu'à cinq lignes.
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  },
  async envoyerMessage(ctx, b, d, p) {
    const t = fiche.brouillon.trim();
    if (!t || d.envoi) return;
    d.envoi = true;
    fiche.brouillon = "";
    const champ = document.getElementById("message-ami");
    if (champ) { champ.value = ""; champ.style.height = ""; }
    b.disabled = true;
    // Affiché tout de suite ; la liste du serveur le remplace à la relecture.
    d.messages = [...(d.messages ?? []), { id: -((d.messages?.length ?? 0) + 1), moi: true, texte: t, lu: false, cree: new Date().toISOString() }];
    majFil(d); enBasDuFil();
    try { await L.ecrireAmi(p.id, t); }
    catch (e) {
      ctx.toast(e.message, "refus");
      d.messages = d.messages.filter((m) => !(m.id < 0 && m.texte === t));
      fiche.brouillon = t;
      if (champ) champ.value = t;
      majFil(d);
    }
    d.envoi = false;
    await relireDiscussion(ctx, d, p);
  },
};

/** RNT-212 : les gestes entre amis, dans le profil d'un joueur (joueurs.js) : pousser, défier, inviter, retirer. */
export const actionsAmi = {
  async pousser(ctx, b, d, p) {
    // D185 : un message tout prêt, pour le pousser à s'y mettre.
    fiche.pousse = true;
    ctx.redessiner();
    try { await L.ecrireAmi(p.id, "On s'y met ? Une session de focus, maintenant."); if (document.getElementById("fil-discussion")?.offsetParent) await relireDiscussion(ctx, d, p); }
    catch (e) { fiche.pousse = false; ctx.toast(e.message, "refus"); ctx.redessiner(); }
  },
  async inviterDansMonde(ctx, b, d, p) {
    const { code, nom } = b.dataset;
    fiche.invites.add(code);
    ctx.redessiner();
    try { await L.inviterAmi(p.id, code); ctx.toast(`${p.pseudo} est invité dans ${nom}`, "gain"); }
    catch (e) { fiche.invites.delete(code); ctx.toast(e.message, "refus"); ctx.redessiner(); }
  },
  retirerAmi(ctx, b, d, p) {
    ctx.feuille({ titre: `Retirer ${p.pseudo} de tes amis ?`, contenu: `<div class="pile">
      <p class="aide">Votre discussion ne sera plus accessible, et il ne pourra plus t'inviter.</p>
      ${bouton("Retirer", "confirmerRetrait", { genre: "danger" })}</div>`, actions: {
      async confirmerRetrait(c) {
        try { await L.retirerAmi(p.id); c.fermerFeuille(); c.toast("Retiré de tes amis", "gain"); await L.chargerAmis().catch(() => null); c.retour(); }
        catch (e) { c.toast(e.message, "refus"); }
      },
    } });
  },
};

// MARK: - La discussion (DiscussionAmi), poussée depuis la fiche sur un téléphone

const pageDiscussion = {
  titre: "Discussion",
  donnees: (ctx, p) => lireAmi(ctx, p, { avecFiche: false }),
  rendu(d, ctx, p) {
    return `${entetePousse(p.pseudo ?? "Discussion")}<div class="so-page so-page-discussion">${discussion(d)}</div>`;
  },
  apres(ctx, d, p) {
    enBasDuFil();
    if (d && !d.coupe && d.messages === null && document.getElementById("fil-discussion")?.offsetParent) relireDiscussion(ctx, d, p);
  },
  tic(ctx, d, p) { if (d && !d.coupe && Date.now() - (d.lu ?? 0) > 5000) relireDiscussion(ctx, d, p); },
  actions: { ...actionsDiscussion },
};

/** Les pages du social, rangées dans le fichier enligne (pages/index.js, FICHIERS) : pas d'export `pages` à part. */
export const pagesSociales = {
  gazette: pageGazette,
  amis: pageAmis,
  discussionAmi: pageDiscussion,
};

