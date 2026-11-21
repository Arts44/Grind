// ══════════════════════════════════════════════════════════════════════
//  Les tables partagées du casino (D339, 1.17.48), comme sur l'iPhone
//  (EcransCasinoPartage.swift) : plusieurs joueurs du même monde à la même
//  table, en direct. Le serveur a l'autorité (docs/supabase/casino-multi.sql) :
//  il donne, garde les cartes cachées, valide les tours ; cette page relit la
//  table chaque seconde (sa version : une réponse courte si rien n'a bougé),
//  et le moteur en tire le tableau (TableauTablePartagee.swift).
//    tablePartagee ← EcranTablePartagee (p.table : l'identifiant de la table)
// ══════════════════════════════════════════════════════════════════════
import { montant as montantArrondi, esc } from "../format.js?v=3e8bddd9";

/** Un montant, avec ses centimes s'il en a (les blinds de 2,50 €). */
const montant = (c) => montantArrondi(c, { centimes: (c ?? 0) % 100 !== 0 });
import { carte, ligne, bouton, petit, entetePousse, vide, bandeau, champEuros, lireEuros, confirmer } from "../ui.js?v=3e8bddd9";
import * as enLigne from "../enligne.js?v=3e8bddd9";
import { carteJeu } from "./casino-cartes.js?v=3e8bddd9";
import { roue, tapis as tapisRoulette, animer } from "./roulette.js?v=3e8bddd9";

const vue = (p) => (p.vue ??= { serveur: null, relance: null, mise: null, jeton: 0, mises: {}, ordre: [], angle: 0, tourne: false, vuNumero: null, noteMain: null, lu: 0, attente: false });

/** La place, tournée pour que la mienne soit en bas : sa position sur l'ovale (en %). */
function position(i, n, moi) {
  const k = moi == null ? i : (i - moi + n) % n;
  const a = Math.PI / 2 + (2 * Math.PI * k) / n; // la mienne en bas, puis dans le sens des aiguilles
  return { x: 50 + 36 * Math.cos(a), y: 48 + 36 * Math.sin(a) };
}

function siege(s, t, n, moi) {
  const p = position(s.place, n, moi);
  const cartes = s.cartes.length ? `<div class="cj-rangee mini">${s.cartes.map((c, i) => carteJeu(c, i)).join("")}</div>` : "";
  const mains = s.mains.length ? s.mains.map((m) => `<div class="tp-main${m.active ? " active" : ""}${m.ton ? ` ${m.ton}` : ""}">
      <div class="cj-rangee mini">${m.cartes.map((c, i) => carteJeu(c, i)).join("")}</div><span class="tp-total">${esc(m.total)}</span></div>`).join("") : "";
  const etat = s.couche ? "couche" : s.aLaParole ? "parole" : "";
  return `<div class="tp-siege ${etat}${s.moi ? " moi" : ""}" style="--sx:${p.x.toFixed(1)}%;--sy:${p.y.toFixed(1)}%;--j:${s.couleur}" data-place="${s.place}">
    ${t.jeu === "blackjack" ? mains : cartes}
    <div class="tp-plaque"><span class="tp-jeton" aria-hidden="true">${esc(s.initiale)}</span>
      <div><b>${esc(s.pseudo)}${s.bot ? ' <em class="tp-bot">bot</em>' : ""}</b><span class="chiffres">${montant(s.pile)}</span></div>
      ${s.bouton ? `<span class="tp-bouton" title="Le bouton">D</span>` : ""}</div>
    ${s.nomMain ? `<span class="tp-main-nom">${esc(s.nomMain)}</span>` : ""}
    ${s.net != null ? `<span class="tp-net ${s.ton ?? ""}">${s.net > 0 ? "+" : s.net < 0 ? "−" : ""}${montant(Math.abs(s.net))}</span>`
      : s.derniere ? `<span class="tp-derniere">${esc(s.derniere)}</span>` : ""}
    ${s.mise > 0 ? `<span class="plaque-mise tp-mise">${montant(s.mise)}</span>` : ""}
  </div>`;
}

function libre(place, t, n, moi, assis) {
  const p = position(place, n, moi);
  return `<button class="tp-libre" style="--sx:${p.x.toFixed(1)}%;--sy:${p.y.toFixed(1)}%" data-action="asseoir" data-place="${place}"${assis ? " disabled" : ""}>
    <span>${assis ? "Libre" : "S'asseoir"}</span></button>`;
}

function rendre(d, ctx, p) {
  const t = d.t;
  const v = vue(p);
  if (!t) return `${entetePousse("Table")}${vide(d.erreur ? esc(d.erreur) : "Cette table n'est pas ouverte : il faut être en ligne, au casino.")}`;
  const n = t.placesMax;
  const moi = t.places.find((s) => s.moi)?.place ?? null;
  const sieges = t.places.map((s) => siege(s, t, n, moi)).join("");
  const libres = t.jeu === "roulette" ? "" : t.libres.map((pl) => libre(pl, t, n, moi, t.assis)).join("");
  const minuterie = t.secondes != null ? `<span class="tp-minuterie${t.aMoi ? " moi" : ""}" style="--part:${Math.max(0, Math.min(1, t.secondes / 30))}">${t.secondes} s</span>` : "";
  let centre;
  if (t.jeu === "holdem") {
    centre = `<div class="tp-tableau cj-rangee">${t.tableau.map((c, i) => carteJeu(c, i)).join("")}${'<span class="cj place"></span>'.repeat(Math.max(0, 5 - t.tableau.length))}</div>
      <div class="tp-pot">${t.pot ? `Pot <b class="chiffres">${montant(t.pot)}</b>` : "Texas Hold'em"}</div>
      ${t.pots.length ? `<div class="tp-pots">${t.pots.map(esc).join(" · ")}</div>` : ""}
      ${t.rake && t.phase === "finie" ? `<div class="tp-pots">Commission de la maison ${montant(t.rake)}</div>` : ""}`;
  } else if (t.jeu === "blackjack") {
    centre = `<span class="tapis-role">Croupier</span><div class="cj-rangee">${t.croupier.map((c, i) => carteJeu(c, i)).join("") || '<span class="cj place"></span><span class="cj place"></span>'}</div>
      ${t.totalCroupier ? `<span class="tapis-total">${esc(t.totalCroupier)}</span>` : ""}
      <div class="tapis-devise">Le blackjack paie 3 contre 2 · Le croupier reste sur 17</div>`;
  } else {
    centre = d.r ? roue(d.r, v) : "";
  }
  const table = `<section class="tapis tp-table ${t.jeu}" aria-label="${esc(t.nom)}">
      <div class="tp-centre">${centre}<div class="tapis-message">${esc(t.message)} ${minuterie}</div></div>
      ${t.jeu === "roulette" ? "" : sieges + libres}
    </section>`;

  // Ce que je peux faire.
  let gestes = "";
  if (t.assis) {
    if (t.jeu === "holdem" && t.gestes.length) {
      const r = v.relance ?? t.relanceMin;
      gestes = `<div class="table-gestes">${t.gestes.filter((g) => g.id !== "relancer").map((g) => bouton(esc(g.nom), "geste", { genre: g.id === "coucher" ? "secondaire" : "primaire", donnees: { g: g.id } })).join("")}</div>
        ${t.relanceMin != null ? `<div class="tp-relance">
          <input type="range" id="tp-relance" min="${t.relanceMin}" max="${t.relanceMax}" step="${Math.max(1, Math.round(t.miseMin / 2))}" value="${r}" data-saisie="glisser" aria-label="Montant de la relance">
          ${bouton(`${t.gestes.find((g) => g.id === "relancer")?.nom ?? "Relancer"} à ${montant(r)}`, "relancer", { genre: "secondaire" })}
          ${petit("Tapis", "tapis")}</div>` : ""}`;
    } else if (t.jeu === "blackjack") {
      if (t.gestes.some((g) => g.id === "miser")) {
        const m = v.mise ?? t.miseMin;
        gestes = `<div class="table-mise"><div class="plaques">${t.plaques.map((x) => `<button class="plaque" data-action="plaque" data-m="${x}">${montant(x).replace(/\s?€/, "")}</button>`).join("")}</div>
          <div class="table-mise-ligne"><span class="t2">Mise</span><strong class="chiffres">${montant(m)}</strong>${petit("Effacer", "effacer")}</div>
          ${bouton("Miser", "miserBJ")}</div>`;
      } else if (t.gestes.length) {
        gestes = `<div class="table-gestes">${t.gestes.map((g) => bouton(esc(g.nom), "geste", { genre: g.id === "tirer" ? "primaire" : "secondaire", donnees: { g: g.id } })).join("")}</div>`;
      }
    } else if (d.r) {
      const autres = t.places.filter((s) => !s.moi).flatMap((s) => s.mises.map((m) => ({ cle: m.cle, couleur: s.couleur })));
      const miennes = t.places.find((s) => s.moi)?.mises ?? [];
      const vr = { ...v, mises: Object.fromEntries(miennes.map((m) => [m.cle, m.montant])), autres, vu: t.phase === "tourne" ? 1 : null };
      const gagnantes = new Set(t.phase === "tourne" ? t.places.flatMap((s) => s.mises.filter((m) => m.gagne).map((m) => m.cle)) : []);
      const valeurs = d.r.valeursJetons.filter((x) => x <= Math.max(t.miseMin, t.pile ?? 0));
      gestes = `${tapisRoulette({ ...d.r, dernier: t.numero != null ? { numero: t.numero } : null }, vr, gagnantes)}
        <div class="rl-rack" role="group" aria-label="Valeur du jeton">${valeurs.map((x, i) => `<button class="rl-choix${i === v.jeton ? " choisi" : ""}" data-action="jeton" data-i="${i}" aria-pressed="${i === v.jeton}"><span class="rl-jeton" style="--j:${d.r.couleursJetons[d.r.valeursJetons.indexOf(x)]}"><b>${x >= 100000 ? `${x / 100000}k` : x / 100}</b></span></button>`).join("")}</div>
        <div class="rang rl-gestes">${petit("Tout retirer", "retirer", { desactive: !miennes.length || t.phase !== "mises" })}</div>
        ${t.gestes.some((g) => g.id === "pret") ? bouton("Lancer la bille", "pret") : ""}`;
    }
  }
  const joueursRoulette = t.jeu === "roulette" ? carte(t.places.map((s) => ligne({
    titre: `<span class="tp-pastille" style="--j:${s.couleur}"></span>${esc(s.pseudo)}${s.moi ? " (toi)" : s.bot ? " · bot" : ""}`,
    detail: s.mises.length ? s.mises.map((m) => `${esc(m.nom)} ${montant(m.montant)}`).join(" · ") : s.pret ? "Prêt" : "Pas encore de mise",
    valeur: s.net != null ? `${s.net >= 0 ? "+" : "−"}${montant(Math.abs(s.net))}` : montant(s.pile), couleurValeur: s.net > 0 ? "gain" : s.net < 0 ? "perte" : "",
  })).join("")) : "";
  const histo = t.jeu === "roulette" && t.historique.length ? `<div class="rl-histo" aria-label="Derniers numéros">${t.historique.slice(0, 14).map((n2) => `<span class="rl-pastille ${n2 === 0 ? "vert" : d.r?.roue.find((c) => c.numero === n2)?.couleur ?? ""}">${n2}</span>`).join("")}</div>` : "";
  const asseoir = !t.assis ? `<div class="pile">${t.refus ? bandeau(esc(t.refus), "var(--alerte)") : ""}
      ${carte(`${champEuros("tp-cave", { etiquette: "Ce que tu apportes à la table", valeur: String(Math.round(Math.min(Math.max(t.caveMin, Math.min(t.jetons, t.caveMin * 5)), t.caveMax) / 100)) })}
        <p class="aide">Entre ${montant(t.caveMin)} et ${montant(t.caveMax)}, pris sur tes ${montant(t.jetons)} de jetons ; ils te reviennent quand tu te lèves.</p>
        ${bouton(t.jeu === "roulette" ? "Prendre place" : "S'asseoir", "asseoir", { desactive: !!t.refus })}`, { pad: true })}</div>` : "";
  return `${entetePousse(t.nom)}
    <div class="pile${t.jeu === "roulette" ? " rl-page" : ""}" id="zone-table" data-jeu="${esc(t.jeu)}" data-partagee="1">
      ${table}${histo}
      ${gestes}${joueursRoulette}${asseoir}
      ${t.assis ? `<div class="table-jetons"><span>À la table <strong class="chiffres">${montant(t.pile ?? 0)}</strong> · Jetons ${montant(t.jetons)}</span>${petit("Me lever", "lever")}</div>` : ""}
      <div class="libelle">Règles</div>
      ${carte(`<ul class="regles-table">${t.regles.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>`, { pad: true })}
    </div>`;
}

/** Recalcule le tableau à partir de la dernière vue du serveur ; note une fois ma main réglée dans mes coups. */
async function calculer(ctx, d, p) {
  const v = vue(p);
  if (!v.serveur) return;
  d.t = await ctx.tableau("tablePartagee", { vue: v.serveur });
  const t = d.t;
  const moi = t?.places.find((s) => s.moi);
  if (t?.cleMain && moi?.net != null && v.noteMain !== t.cleMain) {
    v.noteMain = t.cleMain;
    const mise = t.jeu === "holdem" ? (v.serveur.places.find((s) => s.place === moi.place)?.engage ?? 0)
      : t.jeu === "blackjack" ? moi.mains.reduce((a, m) => a + m.mise, 0) : moi.mises.reduce((a, m) => a + m.montant, 0);
    if (mise > 0) await ctx.jouer("decider", { famille: "casino", operation: { noterMainTable: { cle: t.cleMain, jeu: `table:${t.jeu}`, mise, gain: mise + moi.net } } }, { silencieux: true });
  }
}

async function relire(ctx, d, p, { force = false } = {}) {
  const v = vue(p);
  if (v.attente) return false;
  v.attente = true;
  try {
    const r = await enLigne.casinoTable(p.table, force ? null : v.serveur?.version ?? null);
    if (r?.inchange) {
      // Rien n'a bougé : le temps qui reste suit l'heure du serveur.
      if (v.serveur) { v.serveur.maintenant = r.maintenant; v.serveur.echeance = r.echeance; }
    } else if (r) {
      const avant = v.serveur;
      v.serveur = r;
      if (r.jeu === "roulette" && r.phase === "tourne" && r.numero != null && avant?.phase !== "tourne" && d.r) {
        await calculer(ctx, d, p);
        ctx.redessiner();
        v.tourne = true;
        await animer(r.numero, d.r, v);
        v.tourne = false;
        // Le plateau garde son angle par --a : les animations finies s'effacent (comme à la table seule).
        for (const el of document.querySelectorAll(".rl-page .rl-plateau, .rl-page .rl-orbite, .rl-page .rl-bille")) for (const a of el.getAnimations()) a.cancel();
      }
    }
    await calculer(ctx, d, p);
    return true;
  } catch (e) { d.erreur = e.message; return false; } finally { v.attente = false; }
}

const agir = async (ctx, d, p, action, extra = {}) => {
  try {
    vue(p).serveur = await enLigne.casinoAgir(p.table, action, extra);
    await calculer(ctx, d, p);
    ctx.redessiner();
  } catch (e) { ctx.toast(messageRefus(e), "refus"); }
};
const messageRefus = (e) => ({
  pas_ton_tour: "Ce n'est pas ton tour.", coup_refuse: "Ce coup n'est pas possible maintenant.", mises_fermees: "Les mises sont fermées.",
  mise_hors_bornes: "Mise hors des bornes de la table.", mise_sous_minimum: "Pose au moins la mise minimale de la table.", table_fermee: "Cette table n'est pas ouverte dans ce casino.", pas_assez: "Pas assez de jetons à la table.", deja_assis: "Tu es déjà assis à une autre table de ce monde.",
  cave_hors_bornes: "Cette cave n'entre pas dans les bornes de la table.", apport_jour: "Tu as assez apporté aux tables aujourd'hui : 10 % de ton patrimoine au plus (1 000 € au moins).", table_pleine: "La table est pleine.",
})[e.code ?? e.message] ?? e.message;

export const pages = {
  tablePartagee: {
    titre: "Table",
    css: ["casino-cartes", "roulette", "casino-partage"],
    async donnees(ctx, p) {
      const d = { t: null, r: null, erreur: null };
      if (!enLigne.monde.code) return d;
      if (p.table.endsWith(":roulette")) d.r = await ctx.tableau("roulette");
      await relire(ctx, d, p, { force: true });
      return d;
    },
    rendu: rendre,
    async tic(ctx, d, p) {
      if (!d?.t || vue(p).tourne) return;
      if (await relire(ctx, d, p)) ctx.redessiner();
      // La caisse, de temps en temps (une pile levée par le serveur : deux tours manqués, pile vide).
      const v = vue(p);
      if (++v.lu % 15 === 0) enLigne.synchroniserCaisseCasino(ctx).catch(() => 0);
    },
    actions: {
      async asseoir(ctx, b, d, p) {
        const t = d.t;
        if (!t || t.assis) return;
        const apport = lireEuros("tp-cave") ?? t.caveMin;
        if (apport < t.caveMin || apport > t.caveMax) return ctx.toast(`Entre ${montant(t.caveMin)} et ${montant(t.caveMax)}.`, "refus");
        if (apport > t.jetons) return ctx.toast(`Tu n'as que ${montant(t.jetons)} de jetons.`, "refus");
        const place = b.dataset.place != null ? Number(b.dataset.place) : null;
        const r = await enLigne.casinoAsseoir(ctx, t, place, apport);
        if (r.erreur) return ctx.toast(messageRefus({ message: r.erreur }), "refus");
        if (r.vue) { vue(p).serveur = r.vue; await calculer(ctx, d, p); }
        ctx.redessiner();
      },
      async lever(ctx, b, d, p) {
        if (d.t?.phase !== "finie" && d.t?.places.some((s) => s.moi && (s.cartes.length || s.mains.length)) &&
            !(await confirmer({ titre: "Te lever ?", texte: d.t.jeu === "holdem" ? "Tu te couches et tu quittes la table ; tes jetons te reviennent." : "Ta main se termine sans toi ; tes jetons te reviennent à la fin.", oui: "Me lever" }))) return;
        try {
          vue(p).serveur = await enLigne.casinoLever(ctx, p.table);
          await calculer(ctx, d, p);
          ctx.toast("Tu t'es levé de la table.", "gain");
          await ctx.rafraichir();
        } catch (e) { ctx.toast(messageRefus(e), "refus"); }
      },
      geste: (ctx, b, d, p) => agir(ctx, d, p, b.dataset.g),
      glisser(ctx, b, d, p) { vue(p).relance = Number(b.value); const x = document.querySelector('[data-action="relancer"]'); if (x) x.textContent = `Relancer à ${montant(Number(b.value))}`; },
      relancer: (ctx, b, d, p) => agir(ctx, d, p, "relancer", { montant: Number(document.getElementById("tp-relance")?.value ?? d.t.relanceMin) }),
      tapis: (ctx, b, d, p) => agir(ctx, d, p, "relancer", { montant: d.t.relanceMax }),
      plaque(ctx, b, d, p) { const v = vue(p); v.mise = Math.min((v.mise ?? 0) + Number(b.dataset.m), d.t.miseMax); ctx.redessiner(); },
      effacer(ctx, b, d, p) { vue(p).mise = 0; ctx.redessiner(); },
      async miserBJ(ctx, b, d, p) {
        const m = vue(p).mise ?? d.t.miseMin;
        if (m < d.t.miseMin) return ctx.toast(`Mise minimale : ${montant(d.t.miseMin)}.`, "refus");
        await agir(ctx, d, p, "miser", { montant: m });
        vue(p).mise = null;
      },
      jeton(ctx, b, d, p) { vue(p).jeton = Number(b.dataset.i); ctx.redessiner(); },
      poser(ctx, b, d, p) {
        const valeurs = d.r.valeursJetons.filter((x) => x <= Math.max(d.t.miseMin, d.t.pile ?? 0));
        return agir(ctx, d, p, "miser", { cle: b.dataset.cle, montant: valeurs[vue(p).jeton] ?? valeurs[0] ?? d.t.miseMin });
      },
      retirer: (ctx, b, d, p) => agir(ctx, d, p, "retirer"),
      pret: (ctx, b, d, p) => agir(ctx, d, p, "pret"),
    },
  },
};

/** La salle partagée, dans l'écran Casino : les tables, qui y joue, « Rejoindre », les gros gains, le jackpot. */
export function salleHTML(s) {
  if (!s) return "";
  const tables = carte(s.tables.map((x) => ligne({
    titre: `${esc(x.nom)}${x.moi ? " · tu y es" : ""}`,
    detail: `${esc(x.mises)} · ${x.assis.map((a) => esc(a.pseudo) + (a.bot ? " (bot)" : "")).join(", ") || "personne"}`,
    valeur: x.moi ? "Reprendre" : x.libres ? "Rejoindre" : "Complète", couleurValeur: x.moi ? "gain" : "",
    page: x.moi || x.libres ? "tablePartagee" : "", p: { table: x.id },
  })).join(""), { classe: "salle-partagee" });
  const annonces = s.annonces.length ? carte(s.annonces.slice(0, 5).map((a) => ligne({ titre: esc(a.texte), detail: new Date(a.quand).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }) })).join("")) : "";
  return `<div class="libelle">Tables partagées · en direct</div>
    <p class="aide">Les joueurs de ton monde présents dans ce casino${s.presents.length ? ` : ${esc(s.presents.join(", "))}` : ""}. Des bots tiennent les tables quand personne n'y est.</p>
    ${tables}
    ${carte(ligne({ titre: "Jackpot des machines", detail: "1 % de chaque mise aux machines de ce casino, de tous les joueurs", valeur: montant(s.jackpot), couleurValeur: "gain" }))}
    ${annonces ? `<div class="libelle">Dans la salle</div>${annonces}` : ""}`;
}
