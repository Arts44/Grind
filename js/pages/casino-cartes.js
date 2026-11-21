// ══════════════════════════════════════════════════════════════════════
//  Les tables de cartes du casino (D337, 1.17.46), comme sur l'iPhone
//  (EcransCasinoCartes.swift) : blackjack, poker (Casino Hold'em contre la
//  maison), baccarat, joués main par main sur le tapis vert, avec ses
//  jetons, au casino. Le tableau vient du moteur (TableauCasinoCartes.swift) ;
//  les cartes nouvelles glissent depuis le sabot (data-cle : une carte déjà
//  posée ne bouge plus), sauf mouvement réduit.
//    casinoTable ← EcranTableCartes (p.jeu : « blackjack », « holdem », « baccarat »)
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js?v=3e8bddd9";
import { carte, ligne, bouton, petit, entetePousse, vide, bandeau, segment, interrupteur, confirmer } from "../ui.js?v=3e8bddd9";

const vue = (p) => (p.vue ??= { mise: null, pari: "banquier" });

/** Une carte, face ou dos ; `r` : son rang d'arrivée (le délai de la glissade) ; `v` : une carte d'abord posée
 *  face cachée (la carte du croupier, le tournant, la rivière) se retourne, après `v` temps (la rue suivante). */
export function carteJeu(c, r = 0, v = null) {
  if (c.cachee) return `<div class="cj dos" data-cle="${esc(c.id)}" style="--r:${r}" role="img" aria-label="Carte cachée"><span class="cj-motif"></span></div>`;
  return `<div class="cj${c.rouge ? " rouge" : ""}${v != null ? " retournee" : ""}" data-cle="${esc(c.id)}" style="--r:${r}${v != null ? `;--v:${v}` : ""}" role="img" aria-label="${esc(c.lu)}">
    <span class="cj-coin">${esc(c.rang)}<i>${esc(c.couleur)}</i></span><span class="cj-centre">${esc(c.couleur)}</span><span class="cj-coin bas">${esc(c.rang)}<i>${esc(c.couleur)}</i></span></div>`;
}
/** `retournees(i)` : le délai de retournement de la carte i, si elle a été posée face cachée. */
const rangee = (l, cle, retournees = () => null) => `<div class="cj-rangee" data-cle="${esc(cle)}">${l.map((c, i) => carteJeu(c, i, retournees(i))).join("")}</div>`;
const plaque = (m) => `<span class="plaque-mise">${montant(m)}</span>`;

function sabot(t) {
  if (t.sabotRestant == null) return "";
  return `<div class="tapis-sabot" title="Le sabot"><span class="sabot-reste"><span style="--reste:${Math.round(t.sabotRestant * 100)}%"></span></span><em>Sabot</em></div>`;
}

// MARK: Les tapis

function tapisBlackjack(t) {
  const b = t.blackjack;
  const croupier = b ? `${rangee(b.croupier, "croupier", (i) => (i === 1 ? 0 : null))}<div class="tapis-total">${esc(b.totalCroupier)}</div>` : `<div class="cj-rangee vide-tapis"><span class="cj place"></span><span class="cj place"></span></div>`;
  const mains = b ? b.mains.map((m) => `<div class="tapis-main${m.active ? " active" : ""}${m.ton ? ` ${m.ton}` : ""}" data-cle="main-${m.id}">
      ${rangee(m.cartes, `m${m.id}`)}
      <div class="tapis-total">${esc(m.total)}</div>
      ${plaque(m.mise)}${m.issue && b.mains.length > 1 ? `<div class="tapis-issue">${esc(m.issue)}</div>` : ""}</div>`).join("")
    : `<div class="tapis-main"><div class="cj-rangee vide-tapis"><span class="cj place"></span><span class="cj place"></span></div></div>`;
  const msg = b?.message ?? (b ? "" : "Pose ta mise, puis distribue.");
  const resultat = b?.gains != null ? `<div class="tapis-resultat ${b.gains > b.mises ? "gain" : b.gains === b.mises ? "egal" : "perte"}">${b.gains > b.mises ? `+${montant(b.gains - b.mises)}` : b.gains === b.mises ? "Mise rendue" : `−${montant(b.mises - b.gains)}`}</div>` : "";
  return `<section class="tapis" aria-label="Table de blackjack">
    <div class="tapis-haut"><span class="tapis-role">Croupier</span>${sabot(t)}</div>
    ${croupier}
    <div class="tapis-devise">Le blackjack paie 3 contre 2 · Le croupier reste sur 17</div>
    <div class="tapis-mains">${mains}</div>
    <div class="tapis-message">${esc(msg)}${b?.assurance ? ` · Assurance ${montant(b.assurance)}` : ""}</div>${resultat}
  </section>`;
}

function tapisHoldem(t) {
  const h = t.holdem;
  const place = `<div class="cj-rangee vide-tapis"><span class="cj place"></span><span class="cj place"></span></div>`;
  // Le résultat net (comme au blackjack), l'issue en toutes lettres au-dessus.
  const mises = h ? h.ante + (h.appel ?? 0) : 0;
  const resultat = h?.gain != null ? `<div class="tapis-resultat ${h.ton}">${h.gain > mises ? `+${montant(h.gain - mises)}` : h.gain === mises ? "Mise rendue" : `−${montant(mises - h.gain)}`}</div>` : "";
  return `<section class="tapis" aria-label="Table de poker">
    <div class="tapis-haut"><span class="tapis-role">Croupier${h?.mainCroupier ? ` · ${esc(h.mainCroupier)}${h.qualifie === false ? " (ne joue pas)" : ""}` : ""}</span></div>
    ${h ? rangee(h.croupier, "croupier", () => 2) : place}
    <div class="tapis-board">${h ? rangee(h.tableau, "board", (i) => (i >= 3 ? i - 3 : null)) : `<div class="cj-rangee vide-tapis">${'<span class="cj place"></span>'.repeat(5)}</div>`}</div>
    <div class="tapis-devise">Le croupier joue avec une paire de 4 · L'ante paie jusqu'à 100 contre 1</div>
    <div class="tapis-mains"><div class="tapis-main">${h ? rangee(h.joueur, "joueur") : place}
      ${h ? `<div class="tapis-total">${esc(h.mainJoueur ?? "")}</div>${plaque(h.ante + (h.appel ?? 0))}` : ""}</div></div>
    <div class="tapis-message">${h ? (h.phase === "decision" ? "Suivre (2 fois l'ante) ou se coucher ?" : esc(h.issue ?? "")) : "Mise l'ante, puis distribue."}</div>${resultat}
  </section>`;
}

function tapisBaccarat(t) {
  const b = t.baccarat;
  const camp = (nom, cartes, point, cle, gagne) => `<div class="tapis-camp${gagne ? " gagnant" : ""}"><span class="tapis-role">${nom}</span>
    ${cartes ? rangee(cartes, cle) : `<div class="cj-rangee vide-tapis"><span class="cj place"></span><span class="cj place"></span></div>`}
    <div class="tapis-total">${point ?? "—"}</div></div>`;
  return `<section class="tapis" aria-label="Table de baccarat">
    <div class="tapis-camps">${camp("Joueur", b?.joueur, b?.pointJoueur, "j", b && b.pointJoueur > b.pointBanquier)}${camp("Banquier", b?.banquier, b?.pointBanquier, "b", b && b.pointBanquier > b.pointJoueur)}</div>
    <div class="tapis-devise">Banquier 0,95 contre 1 · Joueur 1 contre 1 · Égalité 8 contre 1</div>
    <div class="tapis-message">${b ? esc(b.issue) : "Choisis ton camp, pose ta mise."}</div>
    ${b ? `<div class="tapis-resultat ${b.ton}">${b.gain > b.mise ? `+${montant(b.gain - b.mise)}` : b.gain === b.mise ? "Mise rendue" : `−${montant(b.mise)}`}</div>` : ""}
  </section>`;
}

// MARK: Le comptage

function panneauComptage(t) {
  const k = t.comptage;
  if (!k) return "";
  const niveau = k.surveillance >= 0.6 ? "haute" : k.surveillance > 0 ? "moyenne" : "";
  return carte(`<div class="comptage-chiffres">
      <div><em>Compte courant</em><strong>${k.courant > 0 ? "+" : ""}${k.courant}</strong></div>
      <div><em>Vrai compte</em><strong>${esc(k.vraiTexte)}</strong></div>
      <div><em>Paquets restants</em><strong>${esc(k.paquets)}</strong></div></div>
    <p class="aide">${esc(k.conseil)}</p>
    <div class="surveillance ${niveau}"><div class="surveillance-titre"><span>Surveillance</span><span>${Math.round(k.surveillance * 100)} %</span></div>
      <span class="surveillance-rail"><span style="--veille:${Math.round(k.surveillance * 100)}%"></span></span>
      <p class="aide">${esc(k.surveillanceTexte)}</p></div>`, { pad: true, classe: "comptage" });
}

// MARK: La page

function rendreTable(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Table")}${vide("Cette table n'est pas ouverte.")}`;
  const v = vue(p);
  const mise = v.mise ?? t.miseProposee;
  const tapis = t.jeu === "blackjack" ? tapisBlackjack(t) : t.jeu === "holdem" ? tapisHoldem(t) : tapisBaccarat(t);
  const gestes = t.gestes.length ? `<div class="table-gestes">${t.gestes.map((g) => bouton(esc(g.nom), "geste", { genre: g.id === "tirer" || g.id === "suivre" ? "primaire" : "secondaire", donnees: { g: g.id } })).join("")}</div>` : "";
  const parier = !t.enCours && !t.refus ? `<div class="table-mise">
      ${t.jeu === "baccarat" ? segment(t.paris.map((x) => [x.id, `${x.nom} · ${x.paie}`]), v.pari, "pari") : ""}
      <div class="plaques">${t.plaques.map((m) => `<button class="plaque" data-action="plaque" data-m="${m}" aria-label="Ajouter ${montant(m)}">${montant(m).replace(/\s?€/, "")}</button>`).join("")}</div>
      <div class="table-mise-ligne"><span class="t2">${t.jeu === "holdem" ? "Ante" : "Mise"}</span><strong class="chiffres">${montant(mise)}</strong>${petit("Effacer", "effacer")}</div>
      ${bouton(t.jeu === "baccarat" ? "Miser" : "Distribuer", "distribuer")}</div>` : "";
  const compter = t.jeu === "blackjack" ? carte(interrupteur({ titre: "Compter les cartes", detail: "Interdit ici. Le compte, le vrai compte et la surveillance s'affichent.", actif: t.compter, action: "compter" })) : "";
  const explication = t.jeu === "blackjack" ? `<details class="carte pad explication-comptage"${t.compter ? " open" : ""}><summary>Comment compter les cartes (Hi-Lo)</summary>
      <ol>${t.explicationComptage.map((x) => `<li>${esc(x)}</li>`).join("")}</ol></details>` : "";
  const coups = t.derniers.length ? `<div class="libelle">Derniers coups</div>${carte(t.derniers.slice(0, 5).map((c) => ligne({
    titre: `Mise ${montant(c.mise)}`, valeur: c.gain > c.mise ? `+${montant(c.gain - c.mise)}` : c.gain === c.mise ? "Rendue" : `−${montant(c.mise - c.gain)}`,
    couleurValeur: c.gain > c.mise ? "gain" : c.gain < c.mise ? "perte" : "",
  })).join(""))}` : "";
  return `${entetePousse(t.nom)}
    <div class="pile" id="zone-table" data-jeu="${esc(t.jeu)}">
      ${t.refus ? bandeau(esc(t.refus), "var(--alerte)") : ""}
      ${t.nouveauSabot ? `<p class="aide">Nouveau sabot : les cartes ont été mélangées.</p>` : ""}
      ${tapis}
      ${gestes}${parier}
      <div class="table-jetons"><span>${t.nomCasino ? `${esc(t.nomCasino)} · ` : ""}Jetons <strong class="chiffres">${montant(t.jetons)}</strong></span>${petit("Encaisser", "encaisser", { desactive: t.enCours })}</div>
      ${panneauComptage(t)}${compter}${explication}
      <div class="libelle">Règles · ${esc(t.avantage)}</div>
      ${carte(`<ul class="regles-table">${t.regles.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`, { pad: true })}
      ${coups}
    </div>`;
}

const op = (t, action) => (t.jeu === "blackjack" ? { blackjack: { _0: action } } : { holdem: { _0: action } });

export const pages = {
  casinoTable: {
    titre: "Table",
    css: "casino-cartes",
    async donnees(ctx, p) { return { t: await ctx.tableau("casinoCartes", { id: p.jeu }) }; },
    rendu: rendreTable,
    actions: {
      plaque(ctx, b, d, p) { const v = vue(p); v.mise = (v.mise ?? 0) + Number(b.dataset.m); ctx.redessiner(); },
      effacer(ctx, b, d, p) { vue(p).mise = 0; ctx.redessiner(); },
      pari(ctx, b, d, p) { vue(p).pari = b.dataset.valeur; ctx.redessiner(); },
      async distribuer(ctx, b, d, p) {
        const t = d.t, v = vue(p);
        const m = v.mise ?? t.miseProposee;
        if (!m || m < t.miseMin) return ctx.toast(`Mise minimale : ${montant(t.miseMin)}.`, "refus");
        const o = t.jeu === "blackjack" ? op(t, { miser: { mise: m } }) : t.jeu === "holdem" ? op(t, { miser: { ante: m } }) : { baccarat: { pari: v.pari, mise: m } };
        if (await ctx.decider("casino", o, { fermer: false })) v.mise = null;
      },
      geste(ctx, b, d) {
        const g = b.dataset.g;
        const a = g === "assurance" ? { assurance: { oui: true } } : g === "sansAssurance" ? { assurance: { oui: false } } : { [g]: {} };
        return ctx.decider("casino", op(d.t, a), { fermer: false });
      },
      async compter(ctx, b, d) {
        const oui = !d.t.compter;
        if (oui && !(await confirmer({ titre: "Compter les cartes ?", texte: "C'est interdit ici. La sécurité surveille ceux qui gagnent gros quand le sabot est bon : un avertissement, puis amende, casier et dehors pour la journée.", oui: "Compter", danger: true }))) return;
        return ctx.decider("casino", { compterCartes: { oui } }, { fermer: false });
      },
      encaisser: (ctx) => ctx.decider("casino", { encaisser: {} }, { succes: "Jetons encaissés", fermer: false }),
    },
  },
};
