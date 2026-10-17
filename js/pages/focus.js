// ══════════════════════════════════════════════════════════════════════
//  Onglet Focus (EcranFocus.swift, SessionImmersive.swift, FeuilleExamens.swift,
//  ObjetsFocus.swift) — lot B du 3e temps (docs/inventaire-web.md § 2.3).
//
//  Trois temps, comme l'iPhone :
//   1. Préparer : le type (quatre tuiles), la durée (l'anneau AnneauDuree,
//      les durées courantes et ± 5 min, jusqu'à 12 h), ce que ça rapporte
//      (une carte d'aperçu), le rythme, les règles repliées, les examens ;
//      un seul bouton, collé en bas.
//   2. Tenir : la session en plein écran (piles de pièces, chrono, barre,
//      bonus visé), qu'on peut réduire ; « Arrêter » demande confirmation.
//   3. Encaisser : le reçu, un ticket de caisse dentelé, puis l'éclat.
//
//  Le navigateur joue le rôle de Temps d'écran : quitter l'onglet pendant
//  une session ouvre une infraction (voir app.js). Les styles sont dans
//  web/css/pages/focus.css (déclaré par `css:`).
// ══════════════════════════════════════════════════════════════════════
import { montant, duree, esc } from "../format.js";
import { enteteRacine, segment, confirmer, boutonAide } from "../ui.js";
import { poserStyles } from "./index.js";
import { vibrer } from "../sons.js";

// MARK: Réglages et outils

const DUREES = [25, 45, 60, 90, 120, 180];
/** Un tour d'anneau (AnneauDuree, plage 240), le pas, et le plafond des ± (EcranFocus.dureeMax). */
const PLAGE = 240, PAS = 5, MAX = 720;

/** L'état propre à la page, hors moteur. */
const local = {
  charge: false,
  reduite: null, // l'identifiant de la session dont le plein écran est réduit
  partAffichee: null, // pour animer l'anneau d'un dessin au suivant
  semaines: 2,
  fenetre: 180, // fenetrePresenceSecondes (Balance › infractions)
  minuteLue: -1, // la minute de session pour laquelle le moteur a été relu
  basSignature: "",
  enCours: false, // un appel à la fois (un double appui ne lance pas deux sessions)
  geste: null, // la durée sous le doigt pendant un geste sur l'anneau (un rafraîchissement la garde)
  m: null, // la durée que l'anneau montre
  cadran: null, // { ctx, f, m0 } : la dernière préparation dessinée (lue par les gestes)
};

const sessionDe = (f) => (f?.session && !f.session.arretVolontaire ? f.session : null);
const finDe = (s) => s.debut + s.minutesPrevues * 60_000;
const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

/** « 25 min », « 1 h 30 », « 3 h » (les pastilles et les paliers de l'iPhone). */
const dureePastille = (d) => (d >= 60 ? `${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60}` : ""}` : `${d} min`);
/** « 45 min », « 1 h 05 » (le centre de l'anneau). */
const dureeCadran = (d) => (d >= 60 ? `${Math.floor(d / 60)} h ${String(d % 60).padStart(2, "0")}` : `${d} min`);
const pct = (x, signe = true) => `${signe && x > 0 ? "+" : ""}${Math.round(x * 100)} %`;
const dec = (x, n = 2) => x.toFixed(n).replace(".", ",");
const heure = (ms) => new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
/** Le compte à rebours de SwiftUI : « 24:05 », « 1:02:03 ». */
function rebours(ms) {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
const tauxPour = (f, m) => Math.max(0, ...f.paliers.filter((p) => m >= p.minutes).map((p) => p.bonus));
const multHumeur = (f) => f.multiplicateurHumeur * (f.burnout ? 0.5 : 1);

// MARK: Icônes (traits, 24 × 24, comme ui.js)

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ic = {
  travail: I('<rect x="3" y="7.5" width="18" height="12" rx="2.5"/><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 13h18"/>'),
  revision: I('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>'),
  lecture: I('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6M9 11h6"/>'),
  sport: I('<circle cx="14.5" cy="4.5" r="1.8"/><path d="M8 21l3-5.5 3 2.5 1.5 3M11 15.5 12.5 9l-3.5 1.5L7 13.5M12.5 9l3 3 3-1"/>'),
  medaille: I('<path d="M8 3l2.5 6M16 3l-2.5 6"/><circle cx="12" cy="14.5" r="5.5"/><path d="M12 12v5"/>'),
  coeur: I('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
  coeurBarre: I('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10zM4 4l16 16"/>'),
  maitrise: I('<path d="M3 17l5.5-5.5 4 4L21 7M15 7h6v6"/>'),
  bouclier: I('<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
  alerte: I('<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/>'),
  lune: I('<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/><path d="M15 3h4l-4 4h4"/>'),
  verrou: I('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  toque: I('<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2V11M21.5 9v5"/>'),
  moins: I('<path d="M5 12h14"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  bas: I('<path d="M6 9l6 6 6-6"/>'),
  haut: I('<path d="M6 15l6-6 6 6"/>'),
  sablier: I('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>'),
  main: I('<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7-2.5 0-4-1.2-5.5-3.5L3.5 14a1.5 1.5 0 0 1 2.5-1.6L8 15"/>'),
  cloche: I('<path d="M6 16V11a6 6 0 0 1 9.5-4.9M18 11v5l1.5 2h-15M10 20a2 2 0 0 0 4 0M3 3l18 18"/>'),
  sac: I('<path d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8"/>'),
  onglet: I('<rect x="3" y="5" width="18" height="15" rx="2.5"/><path d="M3 9.5h18M7 5v4.5"/>'),
  plein: I('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  sortir: I('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
};
const iconeType = (t) => ic[t?.id] ?? ({ "briefcase.fill": ic.travail, "book.closed.fill": ic.revision, "text.book.closed.fill": ic.lecture, "figure.run": ic.sport })[t?.icone] ?? ic.travail;
const pastille = (icone, teinte) => `<span class="pastille fp-pastille" style="--c:${teinte}">${icone}</span>`;

// MARK: La page

export const pages = {
  focus: {
    titre: "Focus",
    css: "focus", // lot A : web/css/pages/focus.css, posé avec la page
    async donnees(ctx) {
      const e = ctx.etat;
      if (!local.charge) {
        // Comme @AppStorage : la durée et le type choisis restent d'une visite à l'autre.
        local.charge = true;
        const m = Number(lire("grind.focus.duree"));
        if (m >= PAS && m <= MAX) e.apercu.minutes = m;
        const t = lire("grind.focus.type");
        if (t) e.apercu.type = t;
        const inf = await ctx.balance("infractions");
        if (inf?.fenetrePresenceSecondes) local.fenetre = inf.fenetrePresenceSecondes;
      }
      await ctx.jouer("etat", { minutes: e.apercu.minutes, type: e.apercu.type }, { silencieux: true });
      const examens = await ctx.tableau("examens");
      const rythme = await ctx.tableau("rythme");
      return { f: e.jeu?.focus, examens, rythme };
    },
    rendu(d, ctx) {
      const f = d.f;
      if (!f) return `${enteteRacine("Focus", { droite: boutonAide("focus") })}<div class="vide">Le focus n'est pas prêt.</div>`;
      const s = sessionDe(f);
      const examens = d.examens;
      return `<div class="fp ${s ? "fp-pendant" : "fp-avant"}">
        ${enteteRacine("Focus", { droite: boutonAide("focus") })}
        ${examens?.enCours ? bandeauExamens(examens) : ""}
        ${s ? sessionReduite(f, s, ctx.maintenant()) + carteSanctions(f) : preparation(f, ctx.etat.apercu, d)}
      </div>`;
    },
    // Lot A : au palier moyen et large, la page a toute la largeur (.page.ample) ; la grille cadran | réglages
    // vient des requêtes de conteneur de focus.css.
    renduLarge(d, ctx, p) { return pages.focus.rendu(d, ctx, p); },
    apres(ctx, d) {
      brancherCadran(ctx, d);
      animerCadran();
      majImmersive(ctx);
    },
    tic(ctx) {
      ticImmersive(ctx);
      ticReduite(ctx);
      ticPresence(ctx);
    },
    actions: {
      typeFocus: (ctx, b) => choisirType(ctx, b.dataset.type),
      duree: (ctx, b) => choisirDuree(ctx, Number(b.dataset.minutes)),
      moins: (ctx) => choisirDuree(ctx, Math.max(PAS, ctx.etat.apercu.minutes - PAS)),
      plus: (ctx) => choisirDuree(ctx, Math.min(MAX, ctx.etat.apercu.minutes + PAS)),
      lancerFocus: (ctx, b, d) => une(() => lancer(ctx, d)),
      // La session en plein écran (ses boutons vivent hors de #app, mais la page est au sommet).
      reduire: (ctx) => { local.reduite = sessionDe(ctx.etat.jeu?.focus)?.id ?? null; majImmersive(ctx); },
      revenir: (ctx) => { local.reduite = null; majImmersive(ctx); },
      arreterFocus: (ctx) => une(() => arreter(ctx)),
      encaisserFin: (ctx) => une(async () => {
        // Session finie mais pas encore close (verdict en attente) : le moteur rattrape et paie.
        await ctx.jouer("actif");
        await ctx.rafraichir();
        verifierRecu(ctx, { neuf: true });
        ctx.sauvegarder();
      }),
      pleinEcran: () => basculerPleinEcran(),
      // Les examens (RNT-117).
      arreterExamens: (ctx) => ctx.commande("examens.arreter", {}, { succes: "Les examens s'arrêtent ce soir.", fermer: false }),
      declarerExamens: (ctx, b, d) => ouvrirExamens(ctx, d.examens),
    },
  },
};

/** Un seul appel à la fois. */
async function une(travail) {
  if (local.enCours) return;
  local.enCours = true;
  try { await travail(); } finally { local.enCours = false; }
}

async function choisirType(ctx, type) {
  ctx.etat.apercu.type = type;
  ecrire("grind.focus.type", type);
  await ctx.rafraichir();
}

async function choisirDuree(ctx, m) {
  clearTimeout(local.clavier); // un autre choix l'emporte sur les flèches en attente
  m = Math.max(PAS, Math.min(MAX, Math.round(m / PAS) * PAS));
  ctx.etat.apercu.minutes = m;
  ecrire("grind.focus.duree", String(m));
  await ctx.rafraichir();
}

async function lancer(ctx, d) {
  const f = d.f;
  const { minutes, type } = ctx.etat.apercu;
  const t = f.types.find((x) => x.id === type) ?? f.type;
  // Une révision sans permis choisi révise le premier en cours.
  const permis = f.permisRevise == null ? f.permisEnCours?.[0] : null;
  if (t.revision && permis) await ctx.jouer("decider", { famille: "garage", operation: { reviser: { permis } } }, { silencieux: true });
  local.reduite = null;
  if (!(await ctx.jouer("focus.demarrer", { minutes, type }))) return;
  await ctx.rafraichir();
  ctx.sauvegarder();
}

async function arreter(ctx) {
  const f = ctx.etat.jeu?.focus;
  const s = sessionDe(f);
  if (!s) return;
  const faites = Math.min(s.minutesPrevues, Math.floor((ctx.maintenant() - s.debut) / 60_000));
  const ok = await confirmer({
    titre: "Arrêter la session ?",
    texte: f.tauxBonus > 0 ? "Les minutes faites sont payées, mais le bonus de tenue est perdu." : "Les minutes faites sont payées.",
    oui: `Arrêter et encaisser ${faites} min`,
    non: "Continuer",
    danger: true,
  });
  if (!ok || !sessionDe(ctx.etat.jeu?.focus)) return;
  await ctx.jouer("focus.arreter");
  await ctx.rafraichir();
  verifierRecu(ctx, { neuf: true });
  ctx.sauvegarder();
}

// MARK: Préparer

function preparation(f, apercu, d) {
  const enExamens = !!d.examens?.enCours;
  const bloque = f.type.revision && !(f.permisEnCours?.length) && !enExamens;
  return `
    <div class="fp-grille">
      <div class="fp-col-cadran">
        ${cadran(f, local.geste ?? apercu.minutes)}
        ${durees(local.geste ?? apercu.minutes)}
      </div>
      <div class="fp-col-reglages">
        ${choixType(f, enExamens)}
        ${carteApercu(f, apercu.minutes)}
        ${rythme(d.rythme)}
        ${regles(f)}
        ${d.examens && !d.examens.enCours ? carteExamens(d.examens) : ""}
        <div class="fp-lancer">
          ${f.saisonEnCours ? "" : `<p class="aide fp-centre">Sans saison en cours, une session ne rapporte rien.</p>`}
          <button class="bouton" data-action="lancerFocus" ${bloque ? "disabled" : ""}>Lancer la session</button>
        </div>
      </div>
    </div>`;
}

/** Les quatre types en tuiles égales ; la description du type choisi dessous. */
function choixType(f, enExamens) {
  const tuiles = f.types.map((t) => {
    const choisi = t.id === f.type.id;
    return `<button class="fp-tuile ${choisi ? "choisie" : ""}" data-action="typeFocus" data-type="${esc(t.id)}" aria-pressed="${choisi}" aria-label="${esc(t.nom)}">
      <span class="fp-tuile-icone">${iconeType(t)}</span>
      <span class="fp-tuile-nom">${esc(t.nom.split(" /")[0])}</span>
    </button>`;
  }).join("");
  const permis = f.permisRevise ?? f.permisEnCours?.[0];
  let note = "";
  if (f.type.revision && enExamens) {
    note = `<p class="fp-note gain">${ic.toque}<span>Examens : la révision est payée comme du travail${f.permisEnCours?.length ? `, et ses heures vont au permis ${esc(permis)}` : ""}.</span></p>`;
  } else if (f.type.revision) {
    note = f.permisEnCours?.length
      ? `<p class="fp-note t2">${ic.toque}<span>Les heures iront au permis ${esc(permis)}.</span></p>`
      : `<p class="fp-note alerte">${ic.verrou}<span>Inscris-toi d'abord à un permis, dans Actifs › Véhicules.</span></p>`;
  }
  return `<div class="fp-types">
    <div class="fp-tuiles" role="group" aria-label="Type de session">${tuiles}</div>
    <p class="aide">${esc(f.type.description)}</p>${note}
  </div>`;
}

/**
 * L'anneau de la durée (AnneauDuree, RNT-140) : une seule poignée à faire tourner, un tour vaut
 * quatre heures, par pas de cinq minutes ; au-delà, les pastilles et les ±. Ce que la session
 * rapportera s'inscrit au centre.
 */
function cadran(f, m) {
  const part = Math.min(1, m / PLAGE);
  const n = PLAGE / 15;
  const graduations = Array.from({ length: n }, (_, i) => {
    const heure = i % 4 === 0;
    return `<rect class="${heure ? "h" : ""}" x="${heure ? 148.5 : 149}" y="${heure ? 29 : 31}" width="${heure ? 3 : 2}" height="${heure ? 10 : 6}" rx="1.5" transform="rotate(${(i / n) * 360} 150 150)"/>`;
  }).join("");
  return `<div class="fp-cadran" id="fp-cadran" role="slider" tabindex="0" aria-label="Durée" aria-valuemin="${PAS}" aria-valuemax="${MAX}"
      aria-valuenow="${m}" aria-valuetext="${esc(dureeCadran(m))}" style="--part:${part}" data-part="${part}">
    <svg viewBox="0 0 300 300" aria-hidden="true">
      <defs><radialGradient id="fp-disque"><stop offset="0" stop-color="#1B1C22"/><stop offset="1" stop-color="#0D0E11"/></radialGradient></defs>
      <circle cx="150" cy="150" r="128" fill="url(#fp-disque)"/>
      <circle cx="150" cy="150" r="138" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="16"/>
      <g class="fp-graduations">${graduations}</g>
    </svg>
    <div class="fp-arc"></div>
    <div class="fp-arc-debut"></div>
    <div class="fp-bras"><i class="fp-poignee"></i></div>
    <div class="fp-centre-cadran">
      <div class="fp-duree" id="fp-duree">${dureeCadran(m)}</div>
      <div class="fp-gain-prevu" id="fp-gain">${f.type.partSalaire > 0 ? montant(f.gainPrevu + f.bonusPrevu) : `+${Math.round(f.plaisirPrevu)} plaisir`}</div>
      <div class="fp-tour" id="fp-tour" ${m > PLAGE ? "" : "hidden"}>au-delà d'un tour</div>
    </div>
  </div>`;
}

/** Les durées courantes d'un geste, et ± 5 min pour affiner (jusqu'à 12 h). */
function durees(m) {
  return `<div class="fp-durees">
    <button class="petit fp-rond" data-action="moins" aria-label="Cinq minutes de moins" ${m <= PAS ? "disabled" : ""}>${ic.moins}</button>
    <div class="fp-pilules">${DUREES.map((d) => `<button class="petit ${d === m ? "plein" : ""}" data-action="duree" data-minutes="${d}" aria-pressed="${d === m}">${dureePastille(d)}</button>`).join("")}</div>
    <button class="petit fp-rond" data-action="plus" aria-label="Cinq minutes de plus" ${m >= MAX ? "disabled" : ""}>${ic.plus}</button>
  </div>`;
}

/** Ce que la session rapporte : le bonus de tenue, l'humeur, la maîtrise, l'alerte des 4 h. */
function carteApercu(f, m) {
  const h = multHumeur(f);
  const suivant = f.paliers.find((p) => p.minutes > m);
  const premier = f.paliers[0]?.minutes ?? 25;
  return `<div class="carte fp-apercu" id="fp-apercu">
    <div class="fp-ligne">
      ${pastille(ic.medaille, "var(--argent)")}
      <div class="fp-ligne-corps">
        <div class="libelle">${f.tauxBonus > 0 ? `Bonus de tenue ${pct(f.tauxBonus)}` : `Pas de bonus sous ${dureePastille(premier)}`}</div>
        ${suivant ? `<div class="aide">${pct(suivant.bonus)} dès ${dureePastille(suivant.minutes)}</div>` : ""}
      </div>
      ${f.bonusPrevu > 0 ? `<span class="fp-valeur gain chiffres">+${montant(f.bonusPrevu)}</span>` : ""}
    </div>
    <div class="filet"></div>
    <div class="fp-ligne">
      ${pastille(f.burnout ? ic.coeurBarre : ic.coeur, "var(--image)")}
      <div class="fp-ligne-corps"><div class="libelle">Humeur : ${esc(f.etatJauge)}${f.burnout ? ", burnout" : ""}</div></div>
      <span class="fp-valeur chiffres ${h > 1 ? "gain" : h < 1 ? "alerte" : "t2"}">${h === 1 ? "salaire normal" : `salaire ×${dec(h)}`}</span>
    </div>
    ${f.maitrise ? `<div class="filet"></div>${ligneMaitrise(f.maitrise)}` : ""}
    ${f.plaisirPrevu < 0 ? `<div class="filet"></div><p class="fp-note alerte fp-pad">${ic.alerte}<span>Au-delà de 4 h de travail aujourd'hui, cette session coûtera ${dec(-f.plaisirPrevu, 1)} points d'humeur.</span></p>` : ""}
  </div>`;
}

/** D213 : la maîtrise, les heures de focus de la saison qui font grossir le capital et les boîtes. */
function ligneMaitrise(m) {
  return `<div class="fp-ligne fp-haut fp-maitrise">
    ${pastille(ic.maitrise, "var(--grandir)")}
    <div class="fp-ligne-corps">
      <div class="fp-entre"><span class="libelle">${esc(m.titre)}</span><span class="fp-valeur chiffres ${m.active ? "gain" : "t2"}">${esc(m.valeur)}</span></div>
      ${m.active ? "" : `<div class="rail fp-rail" role="progressbar" aria-valuemin="0" aria-valuemax="${m.seuilHeures}" aria-valuenow="${m.heures}" style="--c:var(--gain);--part:${m.part}"><i></i></div>`}
      <div class="aide">${esc(m.detail)}</div>
    </div>
  </div>`;
}

/** D101 : au-delà de 8 h dans la journée, ou d'un rythme improbable sur la semaine. */
function rythme(r) {
  if (!r) return "";
  if (r.improbable) return `<p class="fp-note alerte">${ic.alerte}<span>Rythme improbable : plus de 10 h par jour en moyenne cette semaine. Tes gains sont réduits à ${Math.round(r.facteur * 100)} % jusqu'à un rythme normal.</span></p>`;
  if (r.minutesAujourdhui >= 8 * 60) return `<p class="fp-note t2">${ic.lune}<span>Déjà ${Math.floor(r.minutesAujourdhui / 60)} h aujourd'hui : au-delà de 8 h, chaque minute rapporte moins, et plus rien après 12 h.</span></p>`;
  return "";
}

/** Les échecs de la semaine et l'onglet surveillé, repliés : on les ouvre quand on veut. */
function regles(f) {
  const n = f.echecsSemaine;
  return `<details class="carte fp-regles">
    <summary class="fp-ligne">
      ${pastille(ic.bouclier, n > 0 ? "var(--c-danger)" : "var(--controles)")}
      <div class="fp-ligne-corps">
        <div class="libelle">Règles de la session</div>
        <div class="aide ${n > 0 ? "alerte" : ""}">${n === 0 ? "Aucun échec cette semaine" : `${n} échec${n > 1 ? "s" : ""} cette semaine`}</div>
      </div>
      <span class="fp-chevron">${ic.bas}</span>
    </summary>
    <div class="fp-regles-corps">${carteSanctions(f)}</div>
  </details>`;
}

/** Les cartons d'arbitre (CartonsEchecs) : jaune, orange, rouge, comme la sanction qui suit. */
const cartons = (n) => `<div class="fp-cartons" role="img" aria-label="${n} échec${n > 1 ? "s" : ""} cette semaine">${[0, 1, 2].map((i) => `<i class="${i < n ? "retourne" : ""}" style="--i:${i - 1}"></i>`).join("")}</div>`;

function carteSanctions(f) {
  const n = f.echecsSemaine;
  return `<div class="carte fp-sanctions">
    <div class="fp-ligne fp-pad">
      ${cartons(n)}
      <div class="fp-ligne-corps">
        <div class="libelle ${n > 0 ? "alerte" : ""}">${n === 0 ? "Aucun échec cette semaine" : `${n} échec${n > 1 ? "s" : ""} cette semaine`}</div>
        <div class="aide">${esc(f.prochaineSanction)}</div>
      </div>
    </div>
    ${f.gelJusqua ? `<div class="filet"></div><p class="fp-note alerte fp-pad fp-fort">${ic.verrou}<span>Compte gelé jusqu'à ${heure(f.gelJusqua)}</span></p>` : ""}
    <div class="filet"></div>
    <p class="fp-note t2 fp-pad">${ic.onglet}<span>Onglet surveillé : pendant une session, passer sur un autre onglet ou une autre app compte comme ouvrir une app interdite. Reviens vite, sinon la session est perdue.</span></p>
  </div>`;
}

/** Le plein écran a été réduit : une carte pour y revenir. */
function sessionReduite(f, s, maintenant) {
  const finie = maintenant >= finDe(s);
  return `<button class="carte fp-reduite" data-action="revenir">
    <span class="fp-reduite-icone">${iconeType(f.type)}</span>
    <span class="fp-ligne-corps">
      <span class="libelle">${esc(f.type.nom)} en cours</span>
      <span class="fp-reduite-temps ${finie ? "gain" : ""}" id="fp-reduite-temps">${finie ? "Terminée, à encaisser" : rebours(finDe(s) - maintenant)}</span>
    </span>
    <span class="fp-reduite-revenir">Revenir ${ic.haut}</span>
  </button>`;
}

// MARK: L'anneau : le doigt, la souris, le clavier

function brancherCadran(ctx, d) {
  const el = document.getElementById("fp-cadran");
  if (!el || !d?.f) return;
  // L'anneau reste le même élément d'un rafraîchissement à l'autre (patcher, lot A) : ses gestes se branchent
  // une fois ; ils lisent la dernière partie dessinée (local.cadran) et la durée en cours de geste (local.geste),
  // qu'un rafraîchissement pendant le geste redessine telle quelle.
  local.cadran = { ctx, f: d.f, m0: ctx.etat.apercu.minutes };
  if (local.geste == null) local.m = ctx.etat.apercu.minutes;
  if (el.__branche) return;
  el.__branche = true;
  let glisse = false;
  /** Pendant le geste, l'anneau et le centre suivent sans attendre le moteur. */
  const montrer = (x) => {
    const { f, m0 } = local.cadran;
    local.m = x;
    if (glisse) local.geste = x;
    const part = Math.min(1, x / PLAGE);
    el.style.setProperty("--part", part);
    local.partAffichee = part;
    el.setAttribute("aria-valuenow", x);
    el.setAttribute("aria-valuetext", dureeCadran(x));
    document.getElementById("fp-duree").textContent = dureeCadran(x);
    document.getElementById("fp-tour").hidden = x <= PLAGE;
    if (f.type.partSalaire > 0 && m0 > 0) {
      // Une estimation le temps du geste (le salaire au prorata, le bonus du palier) ; le moteur tranche au lâcher.
      const salaire = (f.gainPrevu / m0) * x;
      document.getElementById("fp-gain").textContent = montant(Math.round(salaire * (1 + tauxPour(f, x))));
    }
    for (const b of document.querySelectorAll(".fp-pilules [data-minutes]")) {
      const oui = Number(b.dataset.minutes) === x;
      b.classList.toggle("plein", oui);
      b.setAttribute("aria-pressed", oui);
    }
  };
  const depuis = (ev) => {
    const r = el.getBoundingClientRect();
    let a = Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) + Math.PI / 2;
    if (a < 0) a += 2 * Math.PI;
    let x = Math.round(((a / (2 * Math.PI)) * PLAGE) / PAS) * PAS;
    const m = local.m;
    // Pas de saut d'un bout à l'autre en passant par midi.
    if (m > (PLAGE * 3) / 4 && x < PLAGE / 4) x = PLAGE;
    if (m < PLAGE / 4 && x > (PLAGE * 3) / 4) x = PAS;
    x = Math.max(PAS, Math.min(PLAGE, x));
    if (x !== m) { montrer(x); vibrer(4); }
  };
  el.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    glisse = true;
    el.setPointerCapture(ev.pointerId);
    el.classList.add("glisse");
    depuis(ev);
    ev.preventDefault();
  });
  el.addEventListener("pointermove", (ev) => { if (glisse) depuis(ev); });
  const fin = () => {
    if (!glisse) return;
    glisse = false;
    el.classList.remove("glisse");
    const { ctx } = local.cadran;
    const m = local.m;
    local.geste = null;
    if (m !== ctx.etat.apercu.minutes) choisirDuree(ctx, m);
  };
  el.addEventListener("pointerup", fin);
  el.addEventListener("pointercancel", fin);
  el.addEventListener("keydown", (ev) => {
    const { ctx } = local.cadran;
    const m = local.m;
    const pas = { ArrowUp: PAS, ArrowRight: PAS, ArrowDown: -PAS, ArrowLeft: -PAS, PageUp: 15, PageDown: -15 }[ev.key];
    let x = pas ? m + pas : ev.key === "Home" ? PAS : ev.key === "End" ? PLAGE : null;
    if (x == null) return;
    ev.preventDefault();
    x = Math.max(PAS, Math.min(MAX, x));
    if (x === m) return;
    montrer(x);
    clearTimeout(local.clavier);
    local.clavier = setTimeout(() => choisirDuree(ctx, local.m).then(() => document.getElementById("fp-cadran")?.focus({ preventScroll: true })), 280);
  });
}

/** L'anneau part de sa position précédente et glisse jusqu'à la nouvelle (la page vient d'être redessinée). */
function animerCadran() {
  const el = document.getElementById("fp-cadran");
  if (!el) return;
  const cible = Number(el.dataset.part);
  if (local.partAffichee != null && local.partAffichee !== cible) {
    el.classList.add("sans-transition");
    el.style.setProperty("--part", local.partAffichee);
    el.getBoundingClientRect();
    el.classList.remove("sans-transition");
    requestAnimationFrame(() => el.style.setProperty("--part", cible));
  }
  local.partAffichee = cible;
}

// MARK: Tenir : la session en plein écran

/** Une pièce par minute ; au-delà de deux heures, une pièce pour plusieurs minutes. */
const pasPieces = (prevues) => Math.max(1, Math.ceil(prevues / 120));
const COLONNES = 6;

/** Le plein écran suit la page : ouvert pendant une session (sauf s'il a été réduit), fermé sinon. */
function majImmersive(ctx) {
  const f = ctx.etat.jeu?.focus;
  const s = sessionDe(f);
  const pageFocus = !!document.querySelector("#app .fp");
  let el = document.getElementById("fp-immersive");
  if (!s || !pageFocus || local.reduite === s.id) {
    if (el) fermerImmersive(el);
    return;
  }
  if (el && el.dataset.session === s.id) return ticImmersive(ctx);
  el?.remove();
  el = document.createElement("div");
  el.id = "fp-immersive";
  el.className = "fp-immersive";
  el.dataset.session = s.id;
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", `${f.type.nom}, session de ${duree(s.minutesPrevues)}`);
  el.innerHTML = htmlImmersive(f, s);
  document.body.append(el);
  document.body.classList.add("fp-plein-ecran");
  local.basSignature = "";
  local.minuteLue = -1;
  ticImmersive(ctx, { premier: true });
  el.querySelector("[data-action=reduire]")?.focus({ preventScroll: true });
  observerApp();
}

function fermerImmersive(el) {
  document.body.classList.remove("fp-plein-ecran");
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  el.classList.add("sort");
  setTimeout(() => el.remove(), 260);
}

/** Si une autre page remplace le Focus (un onglet, un lien), le plein écran s'en va avec lui. */
let observateur = null;
function observerApp() {
  if (observateur) return;
  observateur = new MutationObserver(() => {
    if (!document.querySelector("#app .fp")) {
      const el = document.getElementById("fp-immersive");
      if (el) fermerImmersive(el);
    }
  });
  observateur.observe(document.getElementById("app"), { childList: true });
}

function htmlImmersive(f, s) {
  return `<div class="fp-im-cadre">
    <header class="fp-im-tete">
      <span class="fp-im-type">${iconeType(f.type)}${esc(f.type.nom)}</span>
      <span class="fp-im-boutons">
        ${document.fullscreenEnabled ? `<button class="fp-im-rond" data-action="pleinEcran" aria-label="Plein écran">${ic.plein}</button>` : ""}
        <button class="fp-im-rond" data-action="reduire" aria-label="Réduire">${ic.bas}</button>
      </span>
    </header>
    <div class="fp-im-corps">
      <div class="fp-im-chrono" role="timer" aria-live="off">
        <div class="fp-im-temps" id="chrono">${rebours(finDe(s) - Date.now())}</div>
        <div class="fp-im-gain chiffres" id="fp-im-gain"></div>
        <div class="fp-im-barre"><i id="fp-im-barre"></i></div>
      </div>
      <div class="fp-piles" id="fp-piles" role="img">${Array.from({ length: COLONNES }, () => `<div class="fp-colonne"></div>`).join("")}</div>
      <div class="fp-im-bas" id="fp-im-bas"></div>
    </div>
    <p class="fp-im-pied">Garde cet onglet ouvert : le quitter compte comme ouvrir une app interdite.</p>
  </div>`;
}

/** Chaque seconde : le chrono, le gain, la barre, les pièces ; le bas seulement quand il change. */
function ticImmersive(ctx, { premier = false } = {}) {
  const el = document.getElementById("fp-immersive");
  const f = ctx.etat.jeu?.focus;
  const s = sessionDe(f);
  if (!el || !s || el.dataset.session !== s.id) return;
  const t = ctx.maintenant();
  const fin = finDe(s);
  const finie = t >= fin;
  const ecoulees = Math.min(s.minutesPrevues, Math.max(0, Math.floor((t - s.debut) / 60_000)));
  // Le moteur compte le gain en minutes entières (D31) : relu une fois par minute, sans redessiner la page.
  if (ecoulees !== local.minuteLue && !premier) {
    local.minuteLue = ecoulees;
    ctx.jouer("etat", { minutes: ctx.etat.apercu.minutes, type: ctx.etat.apercu.type }, { silencieux: true }).then(() => ticImmersive(ctx, { premier: true }));
  }
  if (premier) local.minuteLue = ecoulees;
  el.querySelector("#chrono").textContent = finie ? "Terminé" : rebours(fin - t);
  const gain = el.querySelector("#fp-im-gain");
  const texteGain = f.type.partSalaire > 0
    ? montant(f.gainEcoule, { centimes: true })
    : `+${Math.round((f.plaisirPrevu * ecoulees) / Math.max(1, s.minutesPrevues))} plaisir`;
  if (gain.textContent !== texteGain) {
    gain.textContent = texteGain;
    if (!premier) { gain.classList.remove("roule"); gain.getBoundingClientRect(); gain.classList.add("roule"); }
  }
  el.querySelector("#fp-im-barre").style.setProperty("--part", Math.min(1, Math.max(0, (t - s.debut) / Math.max(1, fin - s.debut))).toFixed(4));
  const pas = pasPieces(s.minutesPrevues);
  majPiles(el.querySelector("#fp-piles"), Math.floor(ecoulees / pas), Math.floor(s.minutesPrevues / pas), !premier);
  // Le bas : les infractions, le bonus visé, les boutons.
  const verdict = finie && f.infractions?.length ? Math.max(...f.infractions.map((i) => i.echeance)) : null;
  const signature = JSON.stringify([finie, f.infractions?.map((i) => [i.app, i.echeance]), f.tauxBonus, f.bonusPrevu, verdict, ecoulees]);
  if (signature !== local.basSignature) {
    local.basSignature = signature;
    el.querySelector("#fp-im-bas").innerHTML = htmlBas(f, s, finie, verdict);
  }
  for (const r of el.querySelectorAll("[data-echeance]")) {
    const e = Number(r.dataset.echeance);
    r.textContent = e > t ? rebours(e - t) : "échue";
  }
}

function htmlBas(f, s, finie, verdict) {
  const alertes = (f.infractions ?? []).map((i) => `<div class="fp-im-alerte">${ic.alerte}<span>Ferme ${esc(i.app)}</span><span class="chiffres" data-echeance="${i.echeance}"></span></div>`).join("");
  const bonus = f.tauxBonus > 0 && !finie
    ? `<p class="fp-im-bonus"><span class="or">${ic.medaille}</span>Tiens jusqu'à ${heure(finDe(s))} : bonus de tenue ${pct(f.tauxBonus)}${f.bonusPrevu > 0 ? `, ${montant(f.bonusPrevu)}` : ""}</p>` : "";
  const boutons = finie
    ? `${verdict ? `<p class="fp-note alerte fp-centre">${ic.sablier}<span>Une app interdite est ouverte : verdict à ${heure(verdict)}. Ferme-la pour encaisser.</span></p>` : ""}
       <button class="bouton" data-action="encaisserFin">Encaisser</button>`
    : `<button class="bouton secondaire" data-action="arreterFocus">Arrêter</button>`;
  return `${alertes}${bonus}${boutons}`;
}

/** Les piles : six colonnes qui montent, une pièce par minute payée ; la nouvelle tombe d'en haut. */
function majPiles(piles, pieces, total, animer) {
  if (!piles) return;
  const parColonne = Math.max(1, Math.ceil(Math.max(total, 1) / COLONNES));
  piles.style.setProperty("--par-colonne", parColonne);
  piles.setAttribute("aria-label", `${pieces} pièce${pieces > 1 ? "s" : ""}`);
  let ajout = false;
  [...piles.children].forEach((col, c) => {
    const n = Math.max(0, Math.min(parColonne, pieces - c * parColonne));
    while (col.children.length > n) col.lastElementChild.remove();
    while (col.children.length < n) {
      const p = document.createElement("i");
      p.className = `fp-piece${animer ? " tombe" : ""}`;
      col.append(p);
      ajout = true;
    }
  });
  if (ajout && animer) navigator.vibrate?.(8);
}

function ticReduite(ctx) {
  const el = document.getElementById("fp-reduite-temps");
  const s = sessionDe(ctx.etat.jeu?.focus);
  if (!el || !s) return;
  const reste = finDe(s) - ctx.maintenant();
  el.textContent = reste > 0 ? rebours(reste) : "Terminée, à encaisser";
  el.classList.toggle("gain", reste <= 0);
}

async function basculerPleinEcran() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch {}
  const b = document.querySelector("#fp-immersive [data-action=pleinEcran]");
  if (b) b.innerHTML = document.fullscreenElement ? ic.sortir : ic.plein;
}

/**
 * D101 : « Toujours là ? » avec le temps qu'il reste pour répondre (AlertePresence). La question
 * elle-même est posée par app.js (verifierPresence) ; la page lui donne la mise en scène de l'iPhone.
 */
function ticPresence(ctx) {
  const d = document.getElementById("presence");
  if (!d?.open) return;
  const s = sessionDe(ctx.etat.jeu?.focus);
  const controles = ctx.etat.jeu?.controlesPresence ?? [];
  const c = s ? controles[s.presencesConfirmees ?? 0] : null;
  if (!d.querySelector(".fp-presence")) {
    d.classList.add("fp-presence-dialogue");
    d.innerHTML = `<div class="fp-presence">
      <span class="or">${ic.main}</span>
      <div class="fp-ligne-corps"><div class="fp-presence-titre">Toujours là ?</div><div class="chiffres fp-presence-reste" id="fp-presence-reste"></div></div>
      <button class="petit plein" data-action="presence">Je suis là</button>
    </div>
    <p class="aide">Confirme que tu es toujours concentré, sinon la session s'arrête ici.</p>`;
  }
  const r = document.getElementById("fp-presence-reste");
  if (r && c != null) r.textContent = rebours(Math.max(0, c + local.fenetre * 1000 - ctx.maintenant()));
}

// MARK: Examens (RNT-117)

function bandeauExamens(t) {
  const fin = t.finPeriode ? new Date(t.finPeriode - 1000).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" }) : "";
  return `<div class="carte fp-examens-bandeau">
    <span class="fp-reduite-icone">${ic.toque}</span>
    <div class="fp-ligne-corps">
      <div class="libelle">${t.joursRestants > 1 ? `Examens : encore ${t.joursRestants} jours` : "Examens : dernier jour"}</div>
      <div class="aide">Révision payée comme du travail, aucun événement, pas de burnout.</div>
      ${fin ? `<div class="aide">Jusqu'à ${esc(fin)} soir.</div>` : ""}
    </div>
    <button class="petit" data-action="arreterExamens">Arrêter</button>
  </div>`;
}

function carteExamens(t) {
  return `<div class="carte pad fp-examens">
    <div class="fp-entre"><span class="fp-examens-titre">${ic.toque}<span class="libelle">Mode examens</span></span><span class="legende">${t.utilisees} sur ${t.maxParSaison} cette saison</span></div>
    <p class="aide">Tu révises pour de vrai ? Déclare ta période : le jeu se met en retrait pendant que tu étudies.</p>
    ${t.refus ? `<p class="fp-refus">${esc(t.refus)}</p>` : `<button class="bouton secondaire" data-action="declarerExamens">Déclarer mes examens</button>`}
  </div>`;
}

function ouvrirExamens(ctx, t) {
  if (!t) return;
  const [min, max] = Array.isArray(t.semaines) ? t.semaines : [1, 4];
  local.semaines = Math.min(Math.max(local.semaines, min), max);
  const effet = (icone, titre, detail) => `<div class="fp-effet">
      <span class="fp-effet-icone">${icone}</span>
      <div><div class="libelle">${titre}</div><div class="aide">${detail}</div></div>
    </div>`;
  ctx.feuille({
    titre: "Mode examens",
    rendu: () => `<div class="fp-feuille-examens">
      <div class="carte pad fp-pile-petite">
        <div class="libelle">Combien de temps ?</div>
        ${segment(Array.from({ length: max - min + 1 }, (_, i) => [String(min + i), `${min + i} sem.`]), String(local.semaines), "semainesExamens")}
        <p class="aide">${local.semaines > t.semainesRestantes ? "La saison se termine avant : la période s'arrêtera avec elle." : `À partir d'aujourd'hui, ${local.semaines * 7} jours.`}</p>
      </div>
      <div class="carte pad fp-pile">
        ${effet(ic.revision, "Révision mieux payée", `${pct(t.partRevision, false)} du salaire au lieu de ${pct(t.partRevisionHabituelle, false)}, permis ou pas.`)}
        ${effet(ic.cloche, "Aucun événement", "Ni tuile ni coup du sort : ceux d'aujourd'hui qui ne sont pas tombés sont annulés.")}
        ${effet(ic.coeur, "Pas de burnout", `Ta jauge ne descend pas sous ${Math.round(t.plancher)}.`)}
        ${effet(ic.sac, "Vivre chichement sans pénalité", "Dépense moins pour tenir : le dimanche, ta jauge n'en souffre pas.")}
      </div>
      <p class="aide">${t.maxParSaison === 1 ? "Une seule période par saison. Tu peux l'arrêter avant la fin ; elle compte quand même."
        : `Au plus ${t.maxParSaison} périodes par saison, ${t.delaiJours} jours d'écart. Arrêtée avant la fin, elle compte quand même.`}</p>
      <button class="bouton" data-action="commencerExamens">Commencer aujourd'hui</button>
    </div>`,
    actions: {
      semainesExamens(c, b) { local.semaines = Number(b.dataset.valeur); c.redessiner(); },
      commencerExamens: (c) => une(() => c.commande("examens.declarer", { semaines: local.semaines }, { succes: "Bonnes révisions : le jeu se met en retrait." })),
    },
  });
}

// MARK: Encaisser : le reçu (RNT-172)

/**
 * Le ticket d'une session payée, comme SessionImmersive sur l'iPhone. Il s'ouvre tout seul quand la
 * session se termine (onglet visible), au retour sur l'onglet après une session payée, et au
 * lancement si un reçu n'a pas encore été vu. « Encaisser » le range (une seule fois par reçu).
 */
const CLE_RECU = "grind.recuVu";
const lireVu = () => lire(CLE_RECU);
const ecrireVu = (id) => ecrire(CLE_RECU, id);

export function verifierRecu(ctx, { neuf = false } = {}) {
  const f = ctx.etat.jeu?.focus;
  const recu = f?.dernierRecu;
  if (!recu || sessionDe(f)) return false;
  const vu = lireVu();
  // Premier passage sur ce navigateur : l'ancien reçu ne ressort pas, sauf s'il vient d'arriver.
  if (vu == null && !neuf) { ecrireVu(recu.id); return false; }
  if (vu === recu.id) return false;
  if (document.getElementById("fp-recu")?.dataset.recu === recu.id) return true;
  // Le reçu peut sortir avant toute visite du Focus : ses styles (css: "focus") d'abord.
  poserStyles(["focus"]).then(() => ouvrirRecu(ctx, recu, f));
  return true;
}

const plaisirTexte = (x) => Math.abs(x).toLocaleString("fr-BE", { maximumFractionDigits: 1 });

function ticket(r, type) {
  const ligne = (l, v) => `<div class="fp-t-ligne"><span>${esc(l)}</span><span>${v}</span></div>`;
  const c = r.calcul;
  const lignes = [
    ligne("Session", esc(type?.nom ?? "Focus")),
    ligne("Durée", r.complete ? `${r.minutes} min` : `${r.minutes} / ${r.minutesPrevues} min`),
  ];
  if (r.salaire > 0) lignes.push(ligne("Salaire", montant(r.salaire, { centimes: true })));
  // RNT-55 : ce qui a changé le salaire se lit sur le ticket, pas seulement son montant.
  if (c) {
    if (c.part !== 1 && c.part > 0) lignes.push(ligne(`Part ${(type?.nom ?? "").toLowerCase()}`, partTexte(c.part)));
    if (Math.abs(c.humeur - 1) > 0.001) lignes.push(ligne("Humeur", `×${dec(c.humeur)}`));
    if (c.burnout) lignes.push(ligne("Burnout", "÷2"));
  }
  if (r.bonus > 0) lignes.push(ligne("Bonus de tenue", montant(r.bonus, { centimes: true })));
  else if (!r.complete) lignes.push(ligne("Bonus de tenue", "perdu"));
  if (r.plaisir) lignes.push(ligne(r.plaisir > 0 ? "Plaisir" : "Fatigue", `${r.plaisir > 0 ? "+" : "−"}${plaisirTexte(r.plaisir)}`));
  if (r.heuresRevision > 0) lignes.push(ligne("Révision du permis", `+${dec(r.heuresRevision, 1)} h`));
  const total = r.salaire + r.bonus;
  // Une séance de sport ne paie pas : son total, c'est le plaisir gagné.
  const totalTexte = total > 0 || r.plaisir <= 0 ? montant(total, { centimes: true }) : `+${plaisirTexte(r.plaisir)} plaisir`;
  const date = new Date(r.debut).toLocaleString("fr-BE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return `<div class="fp-ticket-ombre"><div class="fp-ticket" id="recu-ticket">
    <div class="fp-t-tete"><span class="fp-embleme" aria-hidden="true">G</span><b>GRIND</b><span class="fp-t-date">${esc(date)}</span></div>
    <hr>${lignes.join("")}<hr>
    <div class="fp-t-total"><b>TOTAL</b><b>${totalTexte}</b></div>
    <p class="fp-t-merci">${r.complete ? "Session tenue jusqu'au bout. Merci." : "Session arrêtée avant la fin."}</p>
  </div></div>`;
}

function partTexte(p) {
  if (Math.abs(p - 0.5) < 0.001) return "½ salaire";
  if (Math.abs(p - 0.25) < 0.001) return "¼ salaire";
  if (Math.abs(p - 0.75) < 0.001) return "¾ salaire";
  return `${Math.round(p * 100)} % du salaire`;
}

function ouvrirRecu(ctx, r, f) {
  document.getElementById("fp-recu")?.remove();
  const type = f.types?.find((t) => t.id === r.type) ?? f.type;
  const total = r.salaire + r.bonus;
  const d = document.createElement("dialog");
  d.id = "fp-recu";
  d.className = "fp-recu";
  d.dataset.recu = r.id;
  d.setAttribute("aria-label", r.complete ? "Session tenue" : "Session arrêtée");
  const eclat = `<div class="fp-eclat" aria-live="polite">${Array.from({ length: 10 }, (_, i) => `<span class="fp-embleme" style="--a:${(i / 10) * 360}deg">G</span>`).join("")}<b>${total > 0 ? `+${montant(total)}` : "Rangé"}</b></div>`;
  d.innerHTML = `<div class="fp-recu-cadre">
      <div class="fp-recu-scene">${ticket(r, type)}${eclat}</div>
      <button class="bouton" data-fp="encaisser">${total > 0 ? `Encaisser ${montant(total)}` : "Ranger le reçu"}</button>
    </div>`;
  let parti = false;
  d.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (!ev.target.closest("[data-fp=encaisser]") || parti) return;
    parti = true;
    ev.target.closest("button").disabled = true;
    navigator.vibrate?.([12, 40, 18]);
    d.classList.add("encaisse");
    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      ecrireVu(r.id);
      d.classList.add("sort");
      setTimeout(() => { d.close(); d.remove(); }, 220);
    }, reduit ? 300 : 950);
  });
  d.addEventListener("cancel", (ev) => ev.preventDefault()); // comme le plein écran de l'iPhone : on encaisse pour sortir
  document.body.append(d);
  d.showModal();
  d.querySelector("[data-fp=encaisser]").focus({ preventScroll: true });
}
