// ══════════════════════════════════════════════════════════════════════
//  Les mondes (D215, RNT-201) : où l'on joue, et comment en changer.
//
//    mondes          EcranMesMondes : tes parties (solo, monde privé, monde
//                    public), celle où tu joues cochée, en changer d'un
//                    toucher ; tes autres mondes (sur le serveur) ; Créer,
//                    Rejoindre. « parties » (Tes parties) y mène aussi.
//    creerMonde      EcranCreerMonde : nom, arrivée, bots, règles, puis le
//                    récapitulatif ; créé, le monde s'affiche avec son code
//    rejoindreMonde  EcranRejoindreMonde : les invitations, un code, ou les
//                    mondes publics ; trouvé, l'aperçu et « Prendre ma place »
//    rejoindre       EcranRejoindre : le même aperçu, depuis une invitation
//
//  La page d'un monde (classement, règles, inviter, quitter) est dans
//  enligne.js (`enLigne`) ; les amis aussi (`amis`), à part.
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js";
import { entetePousse, carte, bouton, petit, segment, icones } from "../ui.js";
import { SYMBOLES } from "./vie.js";
import * as L from "../enligne.js";
import { avatarAutre, badgeBot, teteMonde, inviterMonde, feuilleQuitter, sectionsRegles, places, NIVEAUX } from "./enligne.js";

const montant = (c) => montantBrut(c).replace("-", "−");
const lc = (x) => String(x ?? "").toLowerCase();
const filet = '<div class="filet"></div>';
const aide = (t, style = "") => `<p class="aide" style="${style}">${t}</p>`;
const erreurTexte = (t) => (t ? `<p class="el-erreur">${esc(t)}</p>` : "");
const CHECK = `<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="m6.5 12.5 3.5 3.5 7.5-8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** Les trois sortes de parties : leur nom, leur icône, leur teinte (Emplacement). */
export const SORTES = {
  locale: { nom: "Solo", icone: icones.personne, teinte: "var(--grandir)" },
  privee: { nom: "Monde privé", icone: icones.amis, teinte: "var(--equipe)" },
  publique: { nom: "Monde public", icone: SYMBOLES.globe, teinte: "var(--image)" },
};
const ORDRE = ["locale", "privee", "publique"];

/** « Les amis du lundi » ou « Solo » : le nom d'une partie. */
export const nomPartie = (x) => (x.enLigne ? x.enLigne.nom : "Solo");
/** « Monde privé · WEBA2A · jour 4 » ou « Commerçant installé · jour 4 ». */
const sousPartie = (x) => [x.enLigne ? SORTES[x.emplacement].nom : x.profilNom, x.enLigne?.code, `jour ${x.jour}`].filter(Boolean).join(" · ") + (x.terminee ? ", terminée" : "");

// MARK: - La carte « Tu joues dans » (profil)

/**
 * D215 : en haut du profil, où tu joues : la partie ouverte (sorte, nom, code, joueurs), les autres
 * en une ligne, et « Changer ». Rend "" sans partie.
 */
export function carteTuJouesDans(parties, profils = []) {
  const x = parties.find((y) => y.ouverte);
  if (!x) return "";
  const s = SORTES[x.emplacement];
  const autres = parties.filter((y) => !y.ouverte && !y.terminee);
  const humains = profils.filter((p) => p.profilDepart && !p.bot).length, bots = profils.filter((p) => p.profilDepart && p.bot).length;
  const detail = x.enLigne
    ? [s.nom, x.enLigne.code, humains ? `${humains} joueur${humains > 1 ? "s" : ""}${bots ? `, ${bots} bot${bots > 1 ? "s" : ""}` : ""}` : ""].filter(Boolean).join(" · ")
    : `${x.profilNom} · toi seul`;
  return `<div class="carte mm-ici" id="tu-joues-dans">
    <button class="mm-ici-corps" data-action="ouvrir" data-page="${x.enLigne ? "enLigne" : "mondes"}" ${x.enLigne ? `data-p='${esc(JSON.stringify({ emplacement: x.emplacement }))}'` : ""}>
      <span class="pastille mm-pastille" style="--c:${s.teinte}">${s.icone}</span>
      <span style="flex:1;min-width:0"><span class="mm-surtitre">Tu joues dans</span>
        <span class="mm-titre el-coupe">${esc(nomPartie(x))}</span>
        <span class="aide" style="display:block;margin-top:1px">${esc(detail)}</span></span>
    </button>
    <button class="petit" data-action="ouvrir" data-page="mondes" id="changer-monde">Changer</button>
    ${autres.length ? `<div class="mm-ici-pied">Aussi en cours : ${autres.map((y) => esc(nomPartie(y))).join(", ")}</div>` : ""}
  </div>`;
}

// MARK: - Mes mondes

const mm = { connus: [], invitations: [] };

/** Une partie de la liste : cochée si l'on y joue ; le corps y fait jouer, le chevron ouvre sa page. */
function lignePartie(x) {
  const s = SORTES[x.emplacement];
  return `<div class="mm-partie ${x.ouverte ? "ouverte" : ""}">
    <button class="mm-choisir" data-action="jouerIci" data-emplacement="${x.emplacement}" aria-pressed="${x.ouverte}" aria-label="${esc(`${nomPartie(x)}${x.ouverte ? ", tu y joues" : ", y jouer"}`)}">
      <span class="mm-coche" aria-hidden="true">${x.ouverte ? CHECK : ""}</span>
      <span class="pastille" style="--c:${s.teinte}">${s.icone}</span>
      <span style="flex:1;min-width:0"><span class="titre el-coupe" style="display:block">${esc(nomPartie(x))}</span>
        <span class="detail el-coupe" style="display:block">${esc(sousPartie(x))}</span></span>
    </button>
    <button class="mm-voir" data-action="voirPartie" data-emplacement="${x.emplacement}" aria-label="${esc(`Voir ${nomPartie(x)}`)}">${icones.chevron}</button>
  </div>`;
}

const pageMondes = {
  titre: "Mes mondes",
  css: ["mondes", "enligne"], // RNT-210 : css/pages/mondes.css (repris d'anciens.css), et les el-* d'enligne.css
  async donnees(ctx) {
    const parties = (await ctx.jouer("parties", {}, { silencieux: true }))?.parties ?? [];
    const enLigne = !!ctx.etat.compte && !ctx.etat.horsLigne;
    if (enLigne) {
      const [connus, amis] = await Promise.all([L.mondesDuJoueur(ctx.etat.compte.pseudo).catch(() => mm.connus), L.chargerAmis().catch(() => null)]);
      mm.connus = connus ?? [];
      mm.invitations = amis?.invitations ?? mm.invitations;
    }
    return { parties, enLigne };
  },
  rendu(d) {
    const mes = ORDRE.map((e) => d.parties.find((x) => x.emplacement === e)).filter(Boolean);
    const codes = new Set(mes.map((x) => x.enLigne?.code).filter(Boolean));
    const ailleurs = mm.connus.filter((c) => !codes.has(c.code));
    const manquent = ORDRE.filter((e) => !mes.some((x) => x.emplacement === e && !x.terminee));
    const inv = mm.invitations.length;
    const tuile = (action, titre, detail, ic, teinte, badge = "") => `<button class="carte mm-tuile" data-action="${action}" ${d.enLigne ? "" : "disabled"}>
      <span class="rangee entre"><span class="pastille" style="--c:${teinte};width:38px;height:38px;border-radius:11px">${ic}</span>${badge}</span>
      <span><span class="mm-titre" style="font-size:16px">${titre}</span><span class="aide" style="display:block">${detail}</span></span></button>`;
    return `${entetePousse("Mes mondes")}<div class="pile" style="gap:20px;padding-top:6px">
      <div>${mes.length ? carte(mes.map(lignePartie).join(filet), { classe: "mm-liste" }) : carte(aide("Aucune partie pour l'instant.", "padding:16px"))}
        <p class="aide" style="margin:8px 4px 0">Touche une partie pour y jouer. Une de chaque sorte peut tourner en même temps ; chaque session de focus les paie toutes.</p></div>
      <div class="grille2 mm-tuiles">
        ${tuile("versCreer", "Créer un monde", "Privé, entre amis", icones.plus, "var(--equipe)")}
        ${tuile("versRejoindre", "Rejoindre", "Un code ou un monde public", icones.fleches, "var(--image)", inv ? `<span class="mm-badge">${inv}</span>` : "")}
      </div>
      ${d.enLigne ? "" : aide(ctx_horsLigne)}
      ${ailleurs.length ? `<div><div class="section" style="margin-top:0">Tes autres mondes</div>${carte(ailleurs.map((c, k) => `${k ? filet : ""}<div class="rangee" style="gap:12px;padding:12px 16px">
          <span class="pastille" style="--c:var(--texte3)">${icones.amis}</span>
          <div style="flex:1;min-width:0"><div class="libelle el-coupe">${esc(c.nom)}</div><div class="aide">${esc(c.code)}, ${esc(c.pseudo)}${c.moi ? "" : " (autre appareil)"}</div></div>
          ${c.moi && c.sauvegarde ? petit("Reprendre", "reprendre", { plein: true, donnees: { code: c.code } }) : petit("Voir", "voirCode", { donnees: { code: c.code } })}</div>`).join(""))}
        <p class="aide" style="margin:8px 4px 0">Des mondes où ton compte a une place : reprends ta partie depuis le serveur.</p></div>` : ""}
      ${manquent.includes("locale") ? `<div>${carte(`<button class="ligne" data-action="nouvelleSaison"><span class="pastille" style="--c:var(--grandir)">${icones.personne}</span>
          <span style="flex:1;min-width:0"><div class="titre">Commencer une partie solo</div><div class="detail">Toi seul, à ton rythme</div></span><span class="chevron">${icones.chevron}</span></button>`)}</div>` : ""}
    </div>`;
  },
  actions: {
    versCreer: (ctx) => ctx.ouvrir("creerMonde", { n: Date.now() }),
    versRejoindre: (ctx) => ctx.ouvrir("rejoindreMonde", { n: Date.now() }),
    async jouerIci(ctx, b, d) {
      const x = d.parties.find((y) => y.emplacement === b.dataset.emplacement);
      if (!x || x.ouverte) return;
      await ctx.jouer("parties.changer", { emplacement: x.emplacement });
      await ctx.jouer("etat", {}, { silencieux: true });
      ctx.sauvegarder();
      ctx.toast(`Tu joues dans ${x.enLigne ? `« ${x.enLigne.nom} »` : "ta partie solo"}`, "gain");
      if (x.enLigne) L.synchroniser(ctx, { force: true }).then(() => ctx.rafraichir());
      await ctx.rafraichir();
    },
    voirPartie(ctx, b, d) {
      const x = d.parties.find((y) => y.emplacement === b.dataset.emplacement);
      if (!x) return;
      if (x.enLigne) return ctx.ouvrir("enLigne", { emplacement: x.emplacement });
      // La partie solo : où elle en est, et y mettre fin.
      ctx.feuille({ titre: "Ta partie solo", contenu: `<div class="pile" style="gap:16px">
        ${carte([["Profil", esc(x.profilNom)], ["Jour", `${x.jour}${x.terminee ? ", terminée" : ""}`], ["Patrimoine", montant(x.patrimoine)]]
          .map(([t, v]) => `<div class="rangee entre" style="padding:13px 16px;font-size:15px"><span class="t2">${t}</span><span class="chiffres">${v}</span></div>`).join(filet))}
        ${x.ouverte ? "" : bouton("Jouer en solo", "soloIci")}
        ${bouton("Mettre fin à cette partie", "finSolo", { genre: "discret", style: "color:var(--danger)" })}</div>`, actions: {
        async soloIci(c) { c.fermerFeuille(); await pageMondes.actions.jouerIci(c, { dataset: { emplacement: "locale" } }, d); },
        finSolo(c) { c.fermerFeuille(); feuilleQuitter(c, "locale", "Solo", { apres: (cc) => cc.rafraichir() }); },
      } });
    },
    async reprendre(ctx, b) {
      try {
        const etat = await L.lireEtat(b.dataset.code);
        if (!etat) throw new Error("Aucune copie de ta partie sur le serveur.");
        const r = await ctx.jouer("parties.reprendre", { etat });
        if (!r) return;
        if (r.refus) throw new Error(r.refus);
        await ctx.jouer("etat", {}, { silencieux: true });
        ctx.sauvegarder();
        ctx.toast("Partie reprise", "gain");
        await ctx.rafraichir();
      } catch (e) { ctx.toast(e.message, "refus"); }
    },
    voirCode: (ctx, b) => ctx.ouvrir("rejoindre", { code: b.dataset.code }),
  },
};
const ctx_horsLigne = "Sans connexion ni compte, créer et rejoindre attendent le réseau ; tes parties, elles, changent d'un toucher.";

// MARK: - L'aperçu d'un monde trouvé (EntrerDansUnMonde.apercu)

const ap = { trouve: null, apercu: null, enCours: false, erreur: null };

async function voir(ctx, code) {
  const t = await L.trouver(code);
  const dedans = t.profils.some((p) => L.estMoi(p.id));
  const a = await ctx.jouer("enLigne.peutRejoindre", { monde: t.monde, joueurs: t.profils.filter((p) => !p.bot).length, dedans }, { silencieux: true });
  ap.trouve = t;
  ap.apercu = a;
}

async function lancer(ctx, action) {
  ap.enCours = true;
  ap.erreur = null;
  ctx.redessiner();
  try { await action(); } catch (e) { ap.erreur = e.message; }
  ap.enCours = false;
  ctx.redessiner();
}

/** Le monde trouvé : son en-tête, le jour de sa saison, ses joueurs, et « Prendre ma place ». */
function apercu(d, { autre = "Autre monde" } = {}) {
  const { monde: m, profils } = ap.trouve;
  const a = ap.apercu ?? { jour: 0, duree: 91 };
  const solo = d.parties.some((x) => x.emplacement === "locale" && !x.terminee);
  const bots = profils.filter((p) => p.bot).length;
  // Une partie par sorte (D106) : entrer dans un autre monde privé (ou public) met fin à celle qui y tourne.
  const remplace = d.parties.find((x) => x.emplacement === (m.prive ? "privee" : "publique") && !x.terminee && x.enLigne?.code !== m.code);
  return `<div class="pile" style="gap:14px">
    ${teteMonde({ code: m.code, nom: m.nom, prive: m.prive, joueurs: profils.length, bots, places: m.places, jour: a.jour + 1, inviter: m.prive })}
    ${remplace && !a.refus ? `<p class="alerte" style="font-size:13px;font-weight:500">Tu joues déjà dans « ${esc(nomPartie(remplace))} » : un seul monde ${m.prive ? "privé" : "public"} à la fois. Prendre ta place ici y met fin.</p>` : ""}
    ${aide(a.jour === 0 ? "La saison commence aujourd'hui." : `Jour ${a.jour + 1} sur ${a.duree} : tu commenceras aujourd'hui, avec ton capital de départ.`)}
    ${carte(`${profils.map((p, k) => `${k ? filet : ""}<div class="rangee" style="gap:12px;padding:10px 16px">${avatarAutre(p, 32)}
      <span class="libelle el-coupe">${esc(p.pseudo)}</span>${badgeBot(p.bot)}<span class="espace"></span>
      <span class="chiffres t2" style="font-size:15px">${p.profilDepart ? montant(p.patrimoine) : "Se prépare"}</span></div>`).join("")}
      ${profils.length ? "" : `<p class="aide" style="padding:16px">${m.prive ? "Personne pour l'instant. Partage le code." : "Personne pour l'instant : tu ouvres ce monde."}</p>`}`)}
    ${bots ? aide(places(profils, m.places)) : ""}
    ${a.refus ? `<p class="el-erreur">${esc(a.refus)}</p>` : `${bouton(ap.enCours ? "Réservation…" : "Prendre ma place et choisir mon départ", "prendrePlace", { desactive: ap.enCours })}
      ${solo ? aide("Ta partie solo continue à côté : retrouve-la dans Profil, Mes mondes.") : ""}`}
    ${autre ? bouton(autre, "autreMonde", { genre: "discret" }) : ""}
  </div>`;
}

const actionsApercu = {
  inviterMonde: (ctx, b) => inviterMonde(ctx, b),
  prendrePlace: (ctx) => lancer(ctx, async () => {
    const m = ap.trouve.monde;
    await L.rejoindre(ctx, m);
    ap.trouve = null;
    await ctx.ouvrir("saison", { monde: m });
  }),
  autreMonde(ctx) { ap.trouve = null; ap.erreur = null; ctx.redessiner(); },
};

// MARK: - Créer un monde (parcours guidé)

const ETAPES = ["Nom", "Arrivée", "Bots", "Règles", "Récapitulatif"];
/** Les règles d'un monde privé neuf (OptionsPartie.prive). */
const DEFAUT = { combines: true, chantage: true, inspection: true, inspecteAverti: false, voyages: true, plafondHostile: 3, fausseAccusation: 0.02, clientele: 1, impots: 1, controles: 1 };
const NOMS_REGLES = { combines: "Combines à deux", chantage: "Chantage", inspection: "Inspection", inspecteAverti: "", voyages: "Voyages à deux" };

const c = { n: null, etape: 0, nom: "", arrivee: true, bots: false, nombre: 2, niveau: "normal", perso: false, regles: { ...DEFAUT } };

/** Ce qui change des règles par défaut, en mots courts. */
function changements(r) {
  // Les mots de OptionsPartie.changements(depuis: .prive), ceux de l'iPhone.
  const oui = (b) => (b ? "permis" : "coupé");
  const pc = (x) => (x === 1 ? "normal" : `${x > 1 ? "+" : "−"}${Math.round(Math.abs(x - 1) * 100)} %`);
  const t = [];
  for (const k of Object.keys(NOMS_REGLES)) {
    if (r[k] === DEFAUT[k]) continue;
    t.push(k === "inspecteAverti" ? (r[k] ? "L'inspecté est averti" : "L'inspecté n'est plus averti") : `${NOMS_REGLES[k]} : ${oui(r[k])}`);
  }
  if (r.plafondHostile !== DEFAUT.plafondHostile) t.push(`Chantages et signalements : ${r.plafondHostile} par semaine`);
  if (r.fausseAccusation !== DEFAUT.fausseAccusation) t.push(`Fausse accusation : ${Math.round(r.fausseAccusation * 100)} % du patrimoine`);
  for (const [k, n] of [["clientele", "Clientèle"], ["impots", "Impôts"], ["controles", "Contrôles"]]) if (r[k] !== 1) t.push(`${n} : ${pc(r[k])}`);
  if (r.profilImpose) t.push("Profils de départ : égaux");
  return t;
}

/** Une carte à choix unique (radio) : titre, explication. */
const choixCarte = (action, valeur, choisi, titre, detail) => `<button class="carte mm-option ${choisi ? "choisie" : ""}" data-action="${action}" data-valeur="${valeur}" aria-pressed="${choisi}">
  <span class="el-radio ${choisi ? "oui" : ""}"></span><span style="flex:1;min-width:0"><span class="mm-titre" style="font-size:16px">${titre}</span><span class="aide" style="display:block">${detail}</span></span></button>`;

function etapeCreer(d) {
  const r = c.regles;
  switch (c.etape) {
    case 0: return `<div class="pile" style="gap:12px"><label class="mm-question" for="nom-monde">Comment s'appelle ton monde ?</label>
      <input class="champ mm-champ" id="nom-monde" maxlength="28" autocomplete="off" placeholder="Les amis du lundi" value="${esc(c.nom)}" data-saisie="saisieNom">
      ${aide("Un monde privé : cinq places, un code à partager à tes amis. Les mondes publics, eux, s'ouvrent tout seuls : on les rejoint.")}</div>`;
    case 1: return `<div class="pile" style="gap:12px"><div class="mm-question">Quand peut-on arriver ?</div>
      ${choixCarte("choixArrivee", "1", c.arrivee, "Toute la saison", "Un ami peut entrer plus tard ; il commence le jour où il arrive.")}
      ${choixCarte("choixArrivee", "0", !c.arrivee, "Le premier jour seulement", "Tout le monde part le même jour, à armes égales.")}</div>`;
    case 2: return `<div class="pile" style="gap:12px"><div class="mm-question">Compléter avec des bots ?</div>
      ${choixCarte("basculerBots", "0", !c.bots, "Sans bots", "Seulement tes amis.")}
      ${choixCarte("basculerBots", "1", c.bots, "Avec des bots", "Des joueurs du serveur, marqués « bot », qui jouent même quand vous dormez. Chaque ami qui arrive prend la place d'un bot.")}
      ${c.bots ? carte(`<div class="pile" style="gap:10px"><div class="libelle">Combien</div>${segment([1, 2, 3, 4].map((x) => [String(x), String(x)]), String(c.nombre), "nombreBots")}
        <div class="libelle" style="margin-top:4px">Leur niveau</div>${segment(NIVEAUX, c.niveau, "niveauBots")}</div>`, { pad: true }) : ""}</div>`;
    case 3: {
      const ch = changements(r);
      return `<div class="pile" style="gap:12px"><div class="mm-question">Ses règles</div>
      ${choixCarte("choixPerso", "0", !c.perso, "Les règles par défaut", "Combines, chantage, inspection et voyages permis ; économie normale ; profil de départ au choix.")}
      ${choixCarte("choixPerso", "1", c.perso, "Les régler moi-même", ch.length && c.perso ? esc(ch.join(" · ")) : "Ce que les joueurs peuvent se faire, l'économie, des départs égaux.")}
      ${c.perso && d.rm ? `<div class="pile" style="gap:18px;margin-top:6px">${sectionsRegles(d.rm, r, { bots: false })}</div>
        ${aide("Tu pourras les changer en cours de saison, dans Règles du monde : chacun est prévenu.")}` : ""}</div>`;
    }
    default: {
      const ch = c.perso ? changements(r) : [];
      const ligne = (k, t, v) => `<button class="ligne" data-action="allerEtape" data-etape="${k}"><span style="flex:1;min-width:0"><div class="detail" style="margin:0">${t}</div><div class="titre">${v}</div></span><span class="mm-modifier">Modifier</span></button>`;
      return `<div class="pile" style="gap:12px"><div class="mm-question">Tout est prêt ?</div>
      ${carte([
        ligne(0, "Nom", esc(c.nom.trim() || "Mon monde")),
        `<div class="ligne"><span style="flex:1"><div class="detail" style="margin:0">Places</div><div class="titre">5, sur invitation (code)</div></span></div>`,
        ligne(1, "Arrivée", c.arrivee ? "Toute la saison" : "Le premier jour seulement"),
        ligne(2, "Bots", c.bots ? `${c.nombre} bot${c.nombre > 1 ? "s" : ""}, ${NIVEAUX.find(([k]) => k === c.niveau)[1].toLowerCase()}` : "Sans bots"),
        ligne(3, "Règles", ch.length ? esc(ch.join(" · ")) : "Par défaut"),
      ].join(filet))}
      ${aide("Tu recevras un code à partager, puis tu choisiras ton profil de départ.")}</div>`;
    }
  }
}

const pageCreer = {
  titre: "Créer un monde",
  // Un parcours guidé, comme le début de saison : sans la barre d'onglets, le bouton en bas reste visible.
  sansBarre: () => true,
  async donnees(ctx, p) {
    if (p?.n !== c.n) Object.assign(c, { n: p?.n ?? null, etape: 0, nom: "", arrivee: true, bots: false, nombre: 2, niveau: "normal", perso: false, regles: { ...DEFAUT }, fait: false }), Object.assign(ap, { trouve: null, apercu: null, erreur: null, enCours: false });
    const parties = (await ctx.jouer("parties", {}, { silencieux: true }))?.parties ?? [];
    // Les valeurs permises des règles (curseurs, plafonds, profils), celles de « Règles du monde ».
    const rm = c.etape >= 3 ? await ctx.jouer("enLigne.reglesMonde", { monde: {} }, { silencieux: true }) : null;
    return { parties, rm };
  },
  rendu(d, ctx) {
    if (c.fait && ap.trouve) return `${entetePousse("Ton monde est prêt")}<div class="pile" style="gap:16px;padding-top:6px">${apercu(d, { autre: "" })}${erreurTexte(ap.erreur)}</div>`;
    const sans = !ctx.etat.compte ? "Créer un monde demande un compte." : ctx.etat.horsLigne ? "Pas de connexion : créer un monde attend le réseau." : "";
    const dernier = c.etape === ETAPES.length - 1;
    return `${entetePousse("Créer un monde")}
      <div class="mm-etapes" aria-label="Étape ${c.etape + 1} sur ${ETAPES.length}">${ETAPES.map((_, k) => `<i class="${k <= c.etape ? "fait" : ""}"></i>`).join("")}</div>
      <div class="mm-etape-nom">Étape ${c.etape + 1} sur ${ETAPES.length} · ${ETAPES[c.etape]}</div>
      <div class="pile" style="gap:16px;padding-top:14px">${etapeCreer(d)}${sans ? `<p class="el-erreur">${sans}</p>` : ""}${erreurTexte(ap.erreur)}</div>
      <div class="bas-colle pile" style="gap:4px">
        ${dernier ? bouton(ap.enCours ? "Création…" : "Créer le monde", "creerMonde", { desactive: ap.enCours || !!sans }) : bouton("Continuer", "suivant")}
        ${bouton(c.etape ? "Retour" : "Annuler", "precedent", { genre: "discret" })}</div>`;
  },
  actions: {
    ...actionsApercu,
    saisieNom(ctx, el) { c.nom = el.value.slice(0, 28); },
    async suivant(ctx) { c.etape = Math.min(ETAPES.length - 1, c.etape + 1); await ctx.rafraichir(); window.scrollTo?.(0, 0); },
    precedent(ctx) { if (!c.etape) return ctx.retour(); c.etape--; ctx.rafraichir(); },
    allerEtape(ctx, b) { c.etape = Number(b.dataset.etape); ctx.rafraichir(); },
    choixArrivee(ctx, b) { c.arrivee = b.dataset.valeur === "1"; ctx.redessiner(); },
    basculerBots(ctx, b) { c.bots = b.dataset.valeur === "1"; ctx.redessiner(); },
    nombreBots(ctx, b) { c.nombre = Number(b.dataset.valeur); ctx.redessiner(); },
    niveauBots(ctx, b) { c.niveau = b.dataset.valeur; ctx.redessiner(); },
    choixPerso(ctx, b) { c.perso = b.dataset.valeur === "1"; ctx.redessiner(); },
    basculerOption(ctx, b) { c.regles[b.dataset.cle] = !c.regles[b.dataset.cle]; ctx.redessiner(); },
    choisirOption(ctx, b) { c.regles[b.dataset.cle] = JSON.parse(b.dataset.valeur); if (c.regles[b.dataset.cle] === null) delete c.regles[b.dataset.cle]; ctx.redessiner(); },
    creerMonde: (ctx) => lancer(ctx, async () => {
      const nom = c.nom.trim() || "Mon monde";
      const regles = c.perso ? c.regles : null;
      const code = await L.creer(ctx, { nom, arriveeEnCours: c.arrivee, bots: c.bots ? { nombre: c.nombre, niveau: c.niveau } : null, regles });
      await voir(ctx, code);
      c.fait = true;
      window.scrollTo?.(0, 0);
    }),
  },
};

// MARK: - Rejoindre un monde

const rj = { n: null, mode: "code", code: "", publics: null };

const pageRejoindreMonde = {
  titre: "Rejoindre un monde",
  async donnees(ctx, p) {
    if (p?.n !== rj.n) { Object.assign(rj, { n: p?.n ?? null, mode: p?.mode ?? "code", code: "" }); Object.assign(ap, { trouve: null, apercu: null, erreur: null, enCours: false }); }
    const parties = (await ctx.jouer("parties", {}, { silencieux: true }))?.parties ?? [];
    const enLigne = !!ctx.etat.compte && !ctx.etat.horsLigne;
    if (enLigne && !ap.trouve) {
      const [amis, publics] = await Promise.all([L.chargerAmis().catch(() => null), rj.mode === "publics" ? L.mondesPublics().catch(() => []) : Promise.resolve(rj.publics)]);
      mm.invitations = amis?.invitations ?? mm.invitations;
      rj.publics = publics;
    }
    return { parties, enLigne };
  },
  rendu(d) {
    if (ap.trouve) return `${entetePousse("Rejoindre")}<div class="pile" style="gap:16px;padding-top:6px">${apercu(d)}${erreurTexte(ap.erreur)}</div>`;
    if (!d.enLigne) return `${entetePousse("Rejoindre un monde")}<div class="vide">Rejoindre un monde demande un compte et le réseau. Tes parties, elles, continuent.</div>`;
    const inv = mm.invitations;
    const corps = rj.mode === "code"
      ? carte(`<div class="pile" style="gap:12px"><label class="mm-question" style="font-size:17px" for="code-saisi">Le code que ton ami t'a envoyé</label>
          <input class="champ code el-code-saisi" id="code-saisi" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Code à 6 caractères" value="${esc(rj.code)}" data-saisie="saisieCode">
          ${bouton(ap.enCours ? "Recherche…" : "Trouver le monde", "trouverMonde", { desactive: rj.code.length < 6 || ap.enCours })}</div>`, { pad: true })
      : `${carte(`<div class="pile" style="gap:12px"><div class="mm-question" style="font-size:17px">Avec des inconnus</div>
          ${aide("Dix joueurs par monde, à rejoindre à tout moment de la saison ; Grind te place dans un monde qui a de la place, ou en ouvre un.")}
          ${bouton(ap.enCours ? "Recherche…" : "Jouer en public", "jouerPublic", { desactive: ap.enCours })}</div>`, { pad: true })}
        ${(rj.publics ?? []).length ? `<div><div class="section" style="margin-top:0">Ou choisis-en un</div>${carte(rj.publics.map((p, k) => `${k ? filet : ""}<div class="rangee" style="gap:12px;padding:12px 16px">
          <span class="pastille" style="--c:var(--image)">${SYMBOLES.globe}</span>
          <div style="flex:1;min-width:0"><div class="libelle el-coupe">${esc(p.nom)}</div><div class="aide">${p.joueurs} sur ${p.places} joueurs${p.bots > 0 ? `, ${p.bots} bot${p.bots > 1 ? "s" : ""}` : ""}</div></div>
          ${petit("Voir", "voirMonde", { donnees: { code: p.code } })}</div>`).join(""))}</div>` : ""}`;
    return `${entetePousse("Rejoindre un monde")}<div class="pile" style="gap:18px;padding-top:6px">
      ${inv.length ? `<div><div class="section" style="margin-top:0">Tes invitations</div>${carte(inv.map((i, k) => `${k ? filet : ""}<div class="rangee" style="gap:12px;padding:12px 16px">
          <span class="pastille" style="--c:var(--equipe)">${SYMBOLES.enveloppe}</span>
          <div style="flex:1;min-width:0"><div class="libelle el-coupe">${esc(i.nom)}</div><div class="aide">${esc(i.de)} t'invite</div></div>
          ${petit("Voir", "voirInvitation", { teinte: "var(--equipe)", donnees: { id: i.id, code: i.code } })}</div>`).join(""))}</div>` : ""}
      ${segment([["code", "Avec un code"], ["publics", "Mondes publics"]], rj.mode, "modeRejoindre")}
      ${corps}
      ${erreurTexte(ap.erreur)}
    </div>`;
  },
  actions: {
    ...actionsApercu,
    modeRejoindre(ctx, b) { rj.mode = b.dataset.valeur; ap.erreur = null; ctx.rafraichir(); },
    saisieCode(ctx, el) {
      rj.code = L.normaliser(el.value).slice(0, 6);
      if (el.value !== rj.code) el.value = rj.code;
      const btn = document.querySelector("[data-action=trouverMonde]");
      if (btn) btn.disabled = rj.code.length < 6 || ap.enCours;
    },
    trouverMonde: (ctx) => lancer(ctx, () => voir(ctx, rj.code)),
    voirMonde: (ctx, b) => lancer(ctx, () => voir(ctx, b.dataset.code)),
    voirInvitation: (ctx, b) => lancer(ctx, async () => { L.repondreInvitation(Number(b.dataset.id), true).catch(() => {}); await voir(ctx, b.dataset.code); }),
    jouerPublic: (ctx) => lancer(ctx, async () => voir(ctx, await L.mondePublicLibre())),
  },
};

/** Un monde ouvert depuis une invitation ou un lien (EcranRejoindre) : l'aperçu, tout de suite. */
const pageRejoindre = {
  titre: "Rejoindre",
  async donnees(ctx, p) {
    Object.assign(ap, { trouve: null, apercu: null, erreur: null, enCours: false });
    try { await voir(ctx, p.code); } catch (e) { ap.erreur = e.message; }
    return { parties: (await ctx.jouer("parties", {}, { silencieux: true }))?.parties ?? [] };
  },
  rendu(d) { return `${entetePousse("Rejoindre")}<div class="pile" style="gap:16px;padding-top:6px">${ap.trouve ? apercu(d) : ""}${erreurTexte(ap.erreur)}</div>`; },
  actions: { ...actionsApercu, autreMonde: (ctx) => ctx.retour() },
};

export const pages = {
  mondes: pageMondes,
  parties: pageMondes, // Tes parties (D117) : la même liste, depuis D215
  creerMonde: pageCreer,
  rejoindreMonde: pageRejoindreMonde,
  rejoindre: pageRejoindre,
};
