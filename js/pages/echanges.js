// ══════════════════════════════════════════════════════════════════════
//  Échanges entre joueurs (RNT-251) — EcranEchanges de l'iPhone.
//
//    echanges   les offres à trancher, les miennes, les accords en cours
//               (prêts, locations, réméré), les loyers, l'historique ;
//               les raccourcis Virement, Prêt, Troc
//    echange    composer une offre ou une contre-offre : deux colonnes
//               « Je donne / Je reçois », l'écart de valeur au milieu,
//               les conditions dessous ; l'ajout par famille en feuille
//
//  Les règles (frais, plafonds, dons, permis, copies) viennent du moteur
//  (PontEchanges.swift) ; le transport de ../enligne.js.
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js";
import { entetePousse, carte, bouton, petit, segment, vide, icones, champEuros, lireEuros, lienJoueur, confirmer } from "../ui.js";
import { symbole } from "./vie.js";
import * as L from "../enligne.js";
import { avatarAutre, pilules } from "./enligne.js";

const montant = (c) => montantBrut(c).replace("-", "−");
const lc = (x) => String(x ?? "").toLowerCase();
const filet = '<div class="filet"></div>';
const jour = (ms) => new Date(ms).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
const dans = (ms, n = Date.now()) => {
  const h = Math.max(0, Math.round((ms - n) / 3_600_000));
  return h >= 48 ? `${Math.round(h / 24)} jours` : h >= 1 ? `${h} h` : "moins d'une heure";
};
const ONGLETS = [["trancher", "À trancher"], ["cours", "En cours"], ["accords", "Accords"], ["historique", "Historique"]];

/** L'état de la page et du brouillon (une offre en cours d'écriture). */
const S = { onglet: "trancher", b: null, verdict: null };

// MARK: - La liste

const pageEchanges = {
  titre: "Échanges",
  css: "echanges",
  async donnees(ctx) {
    await L.synchroniserEchanges(ctx).catch(() => null);
    const t = await ctx.jouer("echanges.tableau", { echanges: L.monde.echanges, notes: L.monde.notesEchanges, pseudos: pseudos() }, { silencieux: true });
    return { t, loyers: (L.monde.locations ?? []).filter((x) => x.locataire && (L.estMoi(x.proprietaire) || L.estMoi(x.locataire))) };
  },
  rendu(d) {
    const t = d.t;
    if (!L.monde.code) return `${entetePousse("Échanges")}${vide("Les échanges se font dans un monde en ligne : rejoins-en un depuis Mes mondes.")}`;
    if (!t) return `${entetePousse("Échanges")}${vide("Le serveur ne répond pas : réessaie dans un instant.")}`;
    const listes = { trancher: t.aTrancher, cours: t.enCours, accords: t.accords, historique: t.historique };
    // Un onglet vide quand une offre attend ma réponse : « À trancher » ; rien à trancher : mes offres en cours.
    if (!(listes[S.onglet] ?? []).length && t.aTrancher.length) S.onglet = "trancher";
    else if (S.onglet === "trancher" && !t.aTrancher.length && t.enCours.length) S.onglet = "cours";
    const liste = listes[S.onglet] ?? [];
    const onglets = ONGLETS.map(([k, n]) => [k, k === "trancher" && t.nombre ? `${n} (${t.nombre})` : n]);
    return `${entetePousse("Échanges")}<div class="ech-page">
      <div class="ech-raccourcis">
        ${raccourci("virement", "Virement", "Envoyer de l'argent", icones.euro)}
        ${raccourci("pret", "Prêt", "Prêter, avec intérêts", icones.banque)}
        ${raccourci("troc", "Troc", "Un panier contre un autre", icones.fleches)}
      </div>
      <p class="ech-note">Ta note de confiance : ${esc(t.maNote)}${t.enPrison ? (t.prisons ? " · en prison, tu n'échanges qu'au parloir" : " · en prison, les échanges restent permis") : ""}</p>
      ${segment(onglets, S.onglet, "ongletEchanges")}
      ${liste.length ? `<div class="ech-cartes">${liste.map((c) => carteEchange(c)).join("")}</div>`
        : vide({ trancher: "Rien à trancher. Les offres qu'on te fait arrivent ici.", cours: "Aucune offre en attente de réponse.",
          accords: "Aucun prêt, aucune location en cours.", historique: "Pas encore d'échange." }[S.onglet])}
      ${S.onglet === "accords" && d.loyers.length ? `<div class="ech-section"><h2 class="ech-titre">Loyers entre joueurs</h2>${carte(d.loyers.map((x, k) => `${k ? filet : ""}<div class="ech-loyer">
        <span class="ech-loyer-nom">${esc(x.nom)}</span><span class="ech-loyer-detail">${L.estMoi(x.proprietaire) ? `Loué à ${esc(L.pseudoDe(x.locataire))}` : `Chez ${esc(L.pseudoDe(x.proprietaire))}`} · ${montant(x.loyer)} par semaine</span></div>`).join(""))}</div>` : ""}
    </div>`;
  },
  actions: {
    ongletEchanges(ctx, b) { S.onglet = b.dataset.valeur ?? b.dataset.id ?? "trancher"; ctx.redessiner(); },
    raccourciEchange(ctx, b) { choisirJoueur(ctx, b.dataset.genre); },
    async gesteEchange(ctx, b, d) {
      const id = Number(b.dataset.id);
      const c = [...d.t.aTrancher, ...d.t.enCours, ...d.t.accords].find((x) => x.id === id);
      const e = L.monde.echanges.find((x) => x.id === id);
      if (!c || !e) return;
      const g = b.dataset.geste;
      let r = null;
      if (g === "accepter") {
        if (!(await confirmer({ titre: "Accepter l'échange ?", texte: `Tu donnes ${montant(c.valeurDonne)}, tu reçois ${montant(c.valeurRecois)}. Ton dépôt part maintenant, l'échange s'exécute aussitôt.`, oui: "Accepter" }))) return;
        r = await L.accepterEchange(ctx, e, e.versions.at(-1), cote(e));
      } else if (g === "contre") {
        S.b = brouillonDe(e);
        return ctx.ouvrir("echange", { id });
      } else if (g === "refuser") r = await L.cloreEchange(ctx, id, "refuse");
      else if (g === "retirer") r = await L.cloreEchange(ctx, id, "retire");
      else if (g === "anticiper") {
        if (!(await confirmer({ titre: "Tout rembourser ?", texte: `${montant(c.accord.soldeAnticipe)} : le capital et les intérêts au prorata des jours.`, oui: "Rembourser" }))) return;
        r = await L.rembourserEchange(ctx, id, c.accord.soldeAnticipe, true);
      } else if (g === "report") return feuilleReport(ctx, c);
      else if (g === "reportAccepter" || g === "reportRefuser") r = await L.reportEchange(ctx, id, c.accord.reportDemande, g === "reportAccepter");
      else if (g === "remere") {
        if (!(await confirmer({ titre: "Racheter ?", texte: `Tu paies ${montant(c.accord.prixRemere)} ; ce que tu avais cédé te revient.`, oui: "Racheter" }))) return;
        r = await L.remereEchange(ctx, id, c.accord.prixRemere);
      }
      if (r && r !== "annule") ctx.toast(r, "refus");
      ctx.rafraichir();
    },
    versionsEchange(ctx, b, d) {
      const c = [...d.t.aTrancher, ...d.t.enCours, ...d.t.accords, ...d.t.historique].find((x) => x.id === Number(b.dataset.id));
      if (c) ctx.feuille({ titre: "Les versions", rendu: () => `<ol class="ech-versions">${c.versions.map((v) => `<li>${esc(v)}</li>`).join("")}</ol>` });
    },
  },
};

const raccourci = (genre, titre, detail, icone) => `<button class="ech-raccourci" data-action="raccourciEchange" data-genre="${genre}">
  <span class="ech-raccourci-icone">${icone}</span><span class="ech-raccourci-titre">${titre}</span><span class="ech-raccourci-detail">${detail}</span></button>`;

const pseudos = () => Object.fromEntries((L.monde.profils ?? []).map((p) => [lc(p.id), p.pseudo]));
const cote = (e) => (L.estMoi(e.a) ? "a" : "b");

/** Une ligne d'actif d'une colonne. */
const ligneActif = (x) => `<li class="ech-actif${x.gage ? " gage" : ""}"><span class="ech-actif-icone">${symbole(x.symbole)}</span>
  <span class="ech-actif-corps"><span class="ech-actif-nom">${esc(x.nom)}</span>${x.detail || x.gage ? `<span class="ech-actif-detail">${esc([x.gage ? "En garantie" : "", x.detail ?? ""].filter(Boolean).join(" · "))}</span>` : ""}</span>
  <span class="ech-actif-valeur chiffres">${montant(x.valeur)}</span></li>`;

/** Les deux colonnes et l'écart au milieu. */
const deuxColonnes = (donne, recois, ecart, texte) => `<div class="ech-colonnes">
  <div class="ech-colonne"><div class="ech-colonne-titre">Je donne</div><ul class="ech-liste">${donne.length ? donne.map(ligneActif).join("") : `<li class="ech-rien">Rien</li>`}</ul></div>
  <div class="ech-ecart ${ecart > 0 ? "gain" : ecart < 0 ? "perte" : ""}"><span class="ech-ecart-fleche">${icones.fleches}</span><span class="ech-ecart-texte">${esc(texte)}</span></div>
  <div class="ech-colonne"><div class="ech-colonne-titre">Je reçois</div><ul class="ech-liste">${recois.length ? recois.map(ligneActif).join("") : `<li class="ech-rien">Rien</li>`}</ul></div>
</div>`;

function carteEchange(c) {
  const p = (L.monde.profils ?? []).find((x) => lc(x.id) === lc(c.avec)) ?? { pseudo: c.pseudo };
  const gestes = { accepter: ["Accepter", true], contre: ["Contre-proposer", false], refuser: ["Refuser", false], retirer: ["Retirer", false],
    anticiper: ["Tout rembourser", true], report: ["Demander un report", false], reportAccepter: ["Accepter le report", true], reportRefuser: ["Refuser", false],
    remere: ["Racheter", true] };
  return carte(`<div class="ech-carte">
    <div class="ech-tete">${avatarAutre(p, 32)}<div class="ech-tete-corps">${lienJoueur(c.avec, `<span class="ech-pseudo">${esc(c.pseudo)}</span>`, { pseudo: c.pseudo })}
      <span class="ech-tete-note">${esc(c.note)}</span></div><span class="ech-etat">${esc(c.etat)}</span></div>
    ${deuxColonnes(c.jeDonne, c.jeRecois, c.ecart, c.ecartTexte)}
    ${c.accord?.mensualite ? `<p class="ech-ligne-aide">${montant(c.accord.mensualite)} par semaine${c.accord.echeance ? `, jusqu'au ${esc(jour(c.accord.echeance))}` : ""}</p>` : ""}
    ${c.accord?.reportDemande ? `<p class="ech-ligne-aide">Report demandé au ${esc(jour(c.accord.reportDemande))}</p>` : ""}
    ${c.conditions.length ? `<ul class="ech-conditions">${c.conditions.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    ${c.message ? `<p class="ech-message">« ${esc(c.message)} »</p>` : ""}
    <div class="ech-pied"><button class="ech-lien" data-action="versionsEchange" data-id="${c.id}">Version ${c.version}</button>
      ${c.expire ? `<span class="ech-expire">Expire dans ${dans(c.expire)}</span>` : ""}<span class="espace"></span>
      ${c.actions.map((g) => petit(gestes[g]?.[0] ?? g, "gesteEchange", { plein: gestes[g]?.[1], donnees: { id: c.id, geste: g } })).join("")}</div>
  </div>`);
}

/** Demander un report : une nouvelle date, que le créancier accepte ou non. */
function feuilleReport(ctx, c) {
  const min = new Date((c.accord.echeance ?? Date.now()) + 86_400_000).toISOString().slice(0, 10);
  ctx.feuille({ titre: "Demander un report", rendu: () => `<div class="ech-feuille">
    <label class="ech-champ"><span>Nouvelle échéance</span><input type="date" id="ech-report" min="${min}" value="${min}"></label>
    <p class="aide">${esc(c.pseudo)} accepte ou refuse ; d'ici là, l'échéance d'avant tient.</p>
    ${bouton("Demander", "envoyerReport")}</div>`, actions: {
    async envoyerReport(cc) {
      const v = document.getElementById("ech-report")?.value;
      cc.fermerFeuille();
      const r = v ? await L.reportEchange(cc, c.id, Date.parse(`${v}T20:00:00`)) : "Choisis une date.";
      if (r) cc.toast(r, "refus");
      cc.rafraichir();
    },
  } });
}

/** Virement, Prêt, Troc : d'abord avec qui. */
function choisirJoueur(ctx, genre) {
  const autres = (L.monde.profils ?? []).filter((p) => p.profilDepart && !L.estMoi(p.id));
  ctx.feuille({ titre: "Avec qui ?", rendu: () => `<div class="ech-feuille">${autres.length ? carte(autres.map((p, k) => `${k ? filet : ""}<button class="ech-joueur" data-action="avecJoueur" data-id="${esc(p.id)}">
    ${avatarAutre(p, 32)}<span class="ech-joueur-nom">${esc(p.pseudo)}</span><span class="chevron">${icones.chevron}</span></button>`).join("")) : vide("Personne d'autre dans ce monde.")}</div>`,
  actions: {
    avecJoueur(cc, b) {
      cc.fermerFeuille();
      ouvrirComposer(cc, b.dataset.id, genre);
    },
  } });
}

/** RNT-251 : « Proposer un échange » (la fiche d'un joueur, un raccourci). */
export function ouvrirComposer(ctx, joueur, genre = "troc") {
  const p = (L.monde.profils ?? []).find((x) => lc(x.id) === lc(joueur));
  S.b = { vers: joueur, pseudo: p?.pseudo ?? "Un joueur", cote: "a", echange: null, donne: [], recois: [], genre,
    conditions: { rendre: genre === "pret" ? "pret" : "aucun", taux: genre === "pret" ? 0.05 : 0, echeance: null, hebdo: genre === "pret", revenus: "emprunteur",
      prixRemere: null, discret: false, validiteHeures: 48, message: null } };
  if (genre !== "troc") S.b.donne.push({ famille: "argent", id: "argent", nom: "Argent", valeur: 0, quantite: 0 });
  if (S.b.conditions.rendre === "pret") S.b.conditions.echeance = Date.now() + 14 * 86_400_000;
  S.verdict = null;
  return ctx.ouvrir("echange", { joueur });
}

/** Une version du serveur en brouillon (contre-offre) : je reste du côté où je suis. */
function brouillonDe(e) {
  const v = e.versions.at(-1);
  const c = cote(e);
  const ech = v.conditions?.echeance;
  return { vers: c === "a" ? e.b : e.a, pseudo: L.pseudoDe(c === "a" ? e.b : e.a), cote: c, echange: e.id, genre: "troc",
    donne: structuredClone(c === "a" ? v.donneA : v.donneB), recois: structuredClone(c === "a" ? v.donneB : v.donneA),
    conditions: { ...v.conditions, echeance: typeof ech === "number" ? (ech + 978_307_200) * 1000 : ech ? Date.parse(ech) : null } };
}

// MARK: - Composer (deux colonnes, conditions, verdict)

/** La version telle que le moteur l'attend (côtés A et B, échéance en secondes depuis 2001). */
function version() {
  const b = S.b;
  const k = { ...b.conditions, echeance: b.conditions.echeance ? b.conditions.echeance / 1000 - 978_307_200 : null };
  if (!k.echeance) delete k.echeance;
  if (k.prixRemere == null) delete k.prixRemere;
  if (!k.message) delete k.message;
  const propre = (l) => l.filter((x) => x.famille !== "argent" || x.valeur > 0);
  return b.cote === "a" ? { par: "", donneA: propre(b.donne), donneB: propre(b.recois), conditions: k }
    : { par: "", donneA: propre(b.recois), donneB: propre(b.donne), conditions: k };
}

async function majVerdict(ctx) {
  S.verdict = await ctx.jouer("echanges.preparer", { version: version(), cote: S.b.cote, ...(S.b.echange ? { echange: S.b.echange } : {}), ...(S.b.vers ? { avec: S.b.vers } : {}) }, { silencieux: true }).catch(() => null);
  ctx.redessiner();
}

const pageEchange = {
  titre: "Proposer un échange",
  css: "echanges",
  async donnees(ctx, p) {
    if (!S.b && p?.joueur) ouvrirComposer(ctx, p.joueur);
    if (!S.b) return { inv: null };
    const [inv, tableau] = await Promise.all([
      ctx.jouer("echanges.inventaire", { joueur: S.b.vers }, { silencieux: true }),
      ctx.jouer("echanges.tableau", { echanges: [], pseudos: pseudos() }, { silencieux: true }),
    ]);
    if (!S.verdict) S.verdict = await ctx.jouer("echanges.preparer", { version: version(), cote: S.b.cote, ...(S.b.echange ? { echange: S.b.echange } : {}), ...(S.b.vers ? { avec: S.b.vers } : {}) }, { silencieux: true }).catch(() => null);
    return { inv, tauxMax: tableau?.tauxMax ?? 0.2, validites: tableau?.validites ?? [6, 24, 48, 72, 168] };
  },
  rendu(d) {
    const b = S.b;
    if (!b) return `${entetePousse("Échange")}${vide("Choisis d'abord avec qui échanger.")}`;
    const v = S.verdict;
    const vd = b.donne.reduce((s, x) => s + (x.gage ? 0 : x.valeur), 0), vr = b.recois.reduce((s, x) => s + (x.gage ? 0 : x.valeur), 0);
    const ecart = vr - vd;
    const k = b.conditions;
    const taux = [0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5].filter((x) => x <= d.tauxMax + 1e-9);
    const titre = b.echange ? `Contre-offre à ${b.pseudo}` : `Échange avec ${b.pseudo}`;
    const colonne = (sens, l) => `<div class="ech-colonne"><div class="ech-colonne-titre">${sens === "donne" ? "Je donne" : "Je reçois"}</div>
      <ul class="ech-liste">${l.map((x, i) => `<li class="ech-actif${x.gage ? " gage" : ""}"><span class="ech-actif-icone">${symbole(SYM[x.famille] ?? "shippingbox")}</span>
        <span class="ech-actif-corps"><span class="ech-actif-nom">${esc(x.famille === "argent" ? "Argent" : x.nom)}</span>
          ${x.famille === "argent" ? champEuros(`ech-argent-${sens}-${i}`, { valeur: x.valeur ? String(Math.round(x.valeur / 100)) : "" }).replace("<input", `<input data-saisie="montantArgent" data-sens="${sens}" data-i="${i}"`)
            : `<span class="ech-actif-detail">${esc([x.gage ? "En garantie" : "", x.total ? `${(x.quantite / x.total * 100).toFixed(1).replace(".", ",")} %` : "", x.detail ?? ""].filter(Boolean).join(" · "))}</span>`}</span>
        ${x.famille === "argent" ? "" : `<span class="ech-actif-valeur chiffres">${montant(x.valeur)}</span>`}
        <span class="ech-actif-gestes">${k.rendre === "pret" && x.famille !== "argent" ? `<button class="ech-mini" data-action="basculerGage" data-sens="${sens}" data-i="${i}" aria-pressed="${!!x.gage}">Garantie</button>` : ""}
          <button class="ech-mini" data-action="retirerActif" data-sens="${sens}" data-i="${i}" aria-label="Retirer">${icones.fermer}</button></span></li>`).join("")}</ul>
      <button class="ech-ajouter" data-action="ajouterActif" data-sens="${sens}">${icones.plus}<span>Ajouter</span></button></div>`;
    return `${entetePousse(titre)}<div class="ech-page">
      <div class="ech-colonnes">${colonne("donne", b.donne)}
        <div class="ech-ecart ${ecart > 0 ? "gain" : ecart < 0 ? "perte" : ""}"><span class="ech-ecart-fleche">${icones.fleches}</span>
          <span class="ech-ecart-texte">${ecart === 0 ? "Équilibré" : `${ecart > 0 ? "Tu gagnes" : "Tu cèdes"} ${montant(Math.abs(ecart))}`}</span></div>
        ${colonne("recois", b.recois)}</div>
      <div class="ech-section"><h2 class="ech-titre">À rendre</h2>${carte(`<div class="ech-conditions-form">
        ${pilules("choisirRendre", [["aucun", "Rien"], ["pret", "Prêt"], ["location", "Location"], ["remere", "Réméré"]], k.rendre)}
        ${k.rendre === "pret" ? `<div class="ech-sous">Intérêts, % par an de jeu (1 semaine)</div>${pilules("choisirTaux", taux.map((x) => [String(x), `${Math.round(x * 100)} %`]), String(k.taux))}
          ${pilules("choisirRythme", [["une", "En une fois"], ["hebdo", "Chaque semaine"]], k.hebdo ? "hebdo" : "une")}` : ""}
        ${k.rendre === "location" ? pilules("choisirRevenus", [["emprunteur", "Revenus à l'emprunteur"], ["proprietaire", "Au propriétaire"]], k.revenus) : ""}
        ${k.rendre === "remere" ? `<div class="ech-sous">Prix du rachat</div>${champEuros("ech-remere", { valeur: k.prixRemere ? String(Math.round(k.prixRemere / 100)) : "" }).replace("<input", '<input data-saisie="prixRemere"')}` : ""}
        ${k.rendre !== "aucun" ? `<label class="ech-champ"><span>Échéance</span><input type="date" data-saisie="choisirEcheance" min="${new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}" value="${k.echeance ? new Date(k.echeance).toISOString().slice(0, 10) : ""}"></label>` : ""}
      </div>`, { pad: true })}</div>
      <div class="ech-section"><h2 class="ech-titre">L'offre</h2>${carte(`<div class="ech-conditions-form">
        ${pilules("choisirVisibilite", [["monde", "Au fil du monde"], ["discret", "Discret (frais ×2)"]], k.discret ? "discret" : "monde")}
        <div class="ech-sous">Valable</div>${pilules("choisirValidite", d.validites.map((h) => [String(h), h >= 24 ? `${h / 24} j` : `${h} h`]), String(k.validiteHeures))}
        <label class="ech-champ"><span>Un mot</span><input type="text" maxlength="140" data-saisie="choisirMessage" value="${esc(k.message ?? "")}" placeholder="Facultatif"></label>
      </div>`, { pad: true })}</div>
      ${v ? `<div class="ech-verdict">${v.refus ? `<p class="ech-refus">${esc(v.refus)}</p>` : ""}${(v.avis ?? []).map((x) => `<p class="ech-avis">${esc(x)}</p>`).join("")}
        <p class="ech-frais">Frais d'acte ${montant(v.frais)} partagés · ton dépôt ${montant(v.depot)}, rendu si l'offre n'aboutit pas</p></div>` : ""}
      ${bouton(b.echange ? "Envoyer la contre-offre" : "Proposer", "envoyerEchange", { desactive: !!v?.refus })}
    </div>`;
  },
  actions: {
    ajouterActif(ctx, b, d) { feuilleFamilles(ctx, b.dataset.sens, d); },
    retirerActif(ctx, b) { S.b[b.dataset.sens === "donne" ? "donne" : "recois"].splice(Number(b.dataset.i), 1); majVerdict(ctx); },
    basculerGage(ctx, b) { const x = S.b[b.dataset.sens === "donne" ? "donne" : "recois"][Number(b.dataset.i)]; x.gage = !x.gage || undefined; majVerdict(ctx); },
    montantArgent(ctx, el) {
      const l = S.b[el.dataset.sens === "donne" ? "donne" : "recois"];
      const x = l[Number(el.dataset.i)];
      const m = lireEuros(el.id) ?? 0;
      Object.assign(x, { valeur: m, quantite: m, nom: montant(m) });
      clearTimeout(S.minuterie);
      S.minuterie = setTimeout(() => majVerdict(ctx), 350);
    },
    choisirRendre(ctx, b) {
      const k = S.b.conditions;
      k.rendre = b.dataset.valeur;
      if (k.rendre !== "aucun" && !k.echeance) k.echeance = Date.now() + 14 * 86_400_000;
      if (k.rendre !== "pret") { for (const x of [...S.b.donne, ...S.b.recois]) delete x.gage; }
      majVerdict(ctx);
    },
    choisirTaux(ctx, b) { S.b.conditions.taux = Number(b.dataset.valeur); majVerdict(ctx); },
    choisirRythme(ctx, b) { S.b.conditions.hebdo = b.dataset.valeur === "hebdo"; majVerdict(ctx); },
    choisirRevenus(ctx, b) { S.b.conditions.revenus = b.dataset.valeur; majVerdict(ctx); },
    choisirVisibilite(ctx, b) { S.b.conditions.discret = b.dataset.valeur === "discret"; majVerdict(ctx); },
    choisirValidite(ctx, b) { S.b.conditions.validiteHeures = Number(b.dataset.valeur); majVerdict(ctx); },
    choisirEcheance(ctx, el) { if (el.value) { S.b.conditions.echeance = Date.parse(`${el.value}T20:00:00`); majVerdict(ctx); } },
    choisirMessage(ctx, el) { S.b.conditions.message = el.value.slice(0, 140) || null; },
    prixRemere(ctx, el) { S.b.conditions.prixRemere = lireEuros(el.id) || null; clearTimeout(S.minuterie); S.minuterie = setTimeout(() => majVerdict(ctx), 350); },
    async envoyerEchange(ctx) {
      const b = S.b;
      const v = version();
      const e = b.echange ? L.monde.echanges.find((x) => x.id === b.echange) : null;
      const r = e ? await L.contreEchange(ctx, e, v, b.cote) : await L.proposerEchange(ctx, b.vers, v);
      if (r) { if (r !== "annule") ctx.toast(r, "refus"); return; }
      ctx.toast(e ? "Contre-offre envoyée" : "Offre envoyée", "info");
      S.b = null; S.verdict = null; S.onglet = "cours";
      ctx.retour();
    },
  },
};

const SYM = { argent: "eurosign", boite: "building.2", parts: "chart.pie", bourse: "chart.line.uptrend.xyaxis", bien: "house", vehicule: "car",
  montre: "clock", cosmetique: "sparkles", objet: "shippingbox" };

/** Ajouter : d'abord la famille, puis on coche (une part se règle au curseur). */
function feuilleFamilles(ctx, sens, d) {
  const familles = (sens === "donne" ? d.inv?.miens : d.inv?.siens) ?? [];
  const liste = S.b[sens === "donne" ? "donne" : "recois"];
  let ouverte = null;
  const deja = (x) => liste.some((y) => y.famille === x.famille && y.id === x.id);
  ctx.feuille({ titre: sens === "donne" ? "Ce que tu donnes" : `Ce que tu demandes à ${S.b.pseudo}`, rendu: () => {
    if (!ouverte) {
      const argent = !liste.some((x) => x.famille === "argent");
      return `<div class="ech-feuille">${carte([
        ...(argent ? [`<button class="ech-famille" data-action="ajouterArgent">${symbole("eurosign")}<span class="ech-famille-nom">Argent</span><span class="chevron">${icones.chevron}</span></button>`] : []),
        ...familles.map((f) => `<button class="ech-famille" data-action="ouvrirFamille" data-id="${f.id}">${symbole(f.symbole)}<span class="ech-famille-nom">${esc(f.nom)}</span>
          <span class="ech-famille-n chiffres">${f.actifs.length}</span><span class="chevron">${icones.chevron}</span></button>`)].join(filet))}
        ${familles.length ? "" : `<p class="aide">${sens === "donne" ? "Rien d'autre que de l'argent à proposer pour l'instant." : "Rien de visible à lui demander, sinon de l'argent."}</p>`}</div>`;
    }
    const f = familles.find((x) => x.id === ouverte);
    return `<div class="ech-feuille"><button class="ech-lien" data-action="fermerFamille">${icones.retour} Familles</button>${carte(f.actifs.map((x, i) => {
      const reserve = x.detail === "Réservé à un échange";
      return `${i ? filet : ""}<label class="ech-coche${reserve ? " desactive" : ""}"><input type="checkbox" data-saisie="cocherActif" data-i="${i}" ${deja(x) ? "checked" : ""} ${reserve ? "disabled" : ""}>
        <span class="ech-coche-corps"><span class="ech-actif-nom">${esc(x.nom)}</span><span class="ech-actif-detail">${esc(x.detail ?? "")}</span></span>
        <span class="ech-actif-valeur chiffres">${montant(x.valeur)}</span></label>
        ${x.famille === "parts" && deja(x) ? `<div class="ech-curseur"><input type="range" min="1" max="100" value="${Math.round((liste.find((y) => y.id === x.id && y.famille === "parts").quantite / x.quantite) * 100)}" data-saisie="partActif" data-i="${i}" aria-label="Part cédée">
          <span class="chiffres">${Math.round((liste.find((y) => y.id === x.id && y.famille === "parts").quantite / x.total) * 1000) / 10} %</span></div>` : ""}`;
    }).join(""))}${bouton("OK", "fermerFeuilleEchange")}</div>`;
  }, actions: {
    ouvrirFamille(cc, b) { ouverte = b.dataset.id; cc.redessiner(); },
    fermerFamille(cc) { ouverte = null; cc.redessiner(); },
    ajouterArgent(cc) { liste.unshift({ famille: "argent", id: "argent", nom: "Argent", valeur: 0, quantite: 0 }); cc.fermerFeuille(); majVerdict(cc); },
    cocherActif(cc, el) {
      const x = familles.find((f) => f.id === ouverte).actifs[Number(el.dataset.i)];
      const k = liste.findIndex((y) => y.famille === x.famille && y.id === x.id);
      if (el.checked && k < 0) liste.push(structuredClone(x)); else if (!el.checked && k >= 0) liste.splice(k, 1);
      cc.redessiner();
    },
    partActif(cc, el) {
      const x = familles.find((f) => f.id === ouverte).actifs[Number(el.dataset.i)];
      const y = liste.find((z) => z.famille === "parts" && z.id === x.id);
      const q = Math.max(1, Math.round(x.quantite * Number(el.value) / 100));
      Object.assign(y, { quantite: q, valeur: Math.round(x.valeur * q / x.quantite) });
      cc.redessiner();
    },
    fermerFeuilleEchange(cc) { cc.fermerFeuille(); majVerdict(cc); },
  } });
}

export const pages = { echanges: pageEchanges, echange: pageEchange };
