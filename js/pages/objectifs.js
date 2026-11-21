// ══════════════════════════════════════════════════════════════════════
//  Objectifs (RNT-175, D195) — la page Objectifs de l'iPhone
//  (EcranObjectifs) et le bouton « Épingler » des fiches.
//
//  Trois buts au plus : le principal (la tuile de l'accueil) et deux
//  secondaires. Les buts sans fiche (patrimoine, revenu, style de vie,
//  focus) se choisissent ici ; les achats s'épinglent depuis leur fiche
//  (véhicule, bien, boîte à fonder ou à reprendre, PME, titre). Tout vient
//  du moteur : `tableau objectifs`, décisions de la famille « objectifs ».
//  D403 (1.19.21, RNT-350) : un seul tableau de buts, en trois segments :
//  tes épinglés, les défis de la semaine (venus de la page Défis) et les
//  succès à vie les plus proches. Un défi ou un succès s'épingle comme un
//  autre but, et devient la tuile de l'accueil.
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, bouton, petit, rail, icones, segment } from "../ui.js?v=3e8bddd9";
import { SYMBOLES, photoObjectif } from "./vie.js?v=3e8bddd9";
import { blocSemaine, basculerClassement } from "./defis.js?v=3e8bddd9";
import { lire as lireCosmetiques, listeDefis } from "./recompenses.js?v=3e8bddd9"; // 17/11 : les défis de saison, ici (plus dans Style)

const montant = (c) => montantBrut(c).replace("-", "−");
const T = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

/** Un dessin par sorte de but (les symboles SF de l'iPhone, en traits simples). */
const DESSINS = {
  vehicule: icones.voiture,
  montre: T('<circle cx="12" cy="12" r="5.5"/><path d="M12 9.5V12l1.6 1.2M9 6.8 9.8 2.5h4.4l.8 4.3M9 17.2l.8 4.3h4.4l.8-4.3"/>'),
  bien: icones.maison,
  fonder: icones.boite,
  reprise: SYMBOLES.immeuble,
  pme: icones.camembert,
  bourse: icones.marches,
  patrimoine: SYMBOLES.portefeuille,
  doubler: SYMBOLES.portefeuille,
  revenuBoites: icones.euro,
  loyers: T('<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>'),
  trainDeVie: SYMBOLES.etoile,
  villeMonde: SYMBOLES.globe,
  voyage: T('<path d="M3 13.5 21 6l-3.5 12-5.5-4-3 4v-5.5z"/>'),
  focusSemaine: icones.focus,
  serie: SYMBOLES.flamme,
  // D403
  bateau: T('<path d="M11.2 2.5v12.8H4.4zM12.8 5.3l6.3 10H12.8zM2.5 16.9h19l-2.4 3.6H4.9z"/>'),
  jet: T('<path d="M3 13.5 21 6l-3.5 12-5.5-4-3 4v-5.5z"/>'),
  collection: T('<path d="m12 3 9 4.5-9 4.5-9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5"/>'),
  carteFortune: T('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>'),
  mariage: icones.coeur,
  enfant: T('<circle cx="8" cy="5.5" r="2.2"/><circle cx="16.5" cy="9" r="1.8"/><path d="M8 8.5v12M5 12h6M8 14.5l-2.5 6M8 14.5l2.5 6M16.5 11.5v9M14.5 14h4"/>'),
  defi: T('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  succes: SYMBOLES.medaille,
};
const TEINTES = {
  vehicule: "var(--image)", montre: "var(--or)", bien: "var(--grandir)", fonder: "var(--argent)", reprise: "var(--argent)", pme: "var(--argent)",
  bourse: "var(--controles)", patrimoine: "var(--gain)", doubler: "var(--gain)", revenuBoites: "var(--gain)", loyers: "var(--grandir)",
  trainDeVie: "var(--image)", villeMonde: "var(--equipe)", voyage: "var(--equipe)", focusSemaine: "var(--accent)", serie: "var(--alerte)",
  bateau: "var(--image)", jet: "var(--image)", collection: "var(--or)", carteFortune: "var(--argent)", mariage: "var(--grandir)",
  enfant: "var(--grandir)", defi: "var(--equipe)", succes: "var(--or)",
};
const pastille = (sorte, taille = 38) => `<span class="pastille" style="--c:${TEINTES[sorte] ?? "var(--accent)"};width:${taille}px;height:${taille}px;border-radius:${Math.round(taille * 0.3)}px;flex:none">${DESSINS[sorte] ?? SYMBOLES.epingle}</span>`;

// MARK: Le bouton « Épingler » des fiches

/** Le contexte des pages (une liste rendue sans lui le retrouve sur la fenêtre). */
const contexte = (ctx) => ctx ?? globalThis.__grind?.ctx;

/** Les objectifs épinglés, tels que l'accueil les connaît (principal d'abord). */
export const epingles = (ctx) => {
  const a = contexte(ctx)?.etat.jeu?.accueil;
  return [a?.objectif, ...(a?.objectifsSecondaires ?? [])].filter(Boolean);
};

/** Deux buts sont le même s'ils visent la même chose (ButObjectif.memeQue). */
const memeBut = (a, b) => ["sorte", "cible", "montant", "part", "nombre"].every((k) => (a?.[k] ?? null) === (b?.[k] ?? null));

/** L'objectif épinglé qui vise ce but, ou null. */
export const trouver = (ctx, but) => epingles(ctx).find((o) => memeBut(o.but, but)) ?? null;

/** Le bouton d'une fiche : « Épingler » (le but en JSON), ou « Épinglé » pour le retirer. */
export function boutonEpingler(ctx, but, { libelle = "Épingler" } = {}) {
  const o = trouver(ctx, but);
  const contenu = `<span style="width:14px;display:grid">${SYMBOLES.epingle}</span>${o ? (o.principal ? "Ton objectif principal" : "Épinglé, en objectif") : esc(libelle)}`;
  return `<button class="petit ${o ? "" : "plein"}" style="gap:6px" data-action="epinglerBut" data-but="${esc(JSON.stringify(but))}" ${o ? `data-objectif="${o.objectif}"` : ""}
    aria-pressed="${!!o}">${contenu}</button>`;
}

/** Épingle ou retire (action globale « epinglerBut ») ; le premier épinglé devient le principal. */
export async function basculerEpingle(ctx, b) {
  const id = b.dataset.objectif;
  if (id) return ctx.decider("objectifs", { retirer: { objectif: Number(id) } }, { succes: "Objectif retiré" });
  const but = JSON.parse(b.dataset.but);
  return ctx.decider("objectifs", { epingler: { _0: but, principal: epingles(ctx).length === 0 } },
    { succes: epingles(ctx).length === 0 ? "Épinglé : ton objectif principal, sur l'accueil" : "Épinglé dans tes objectifs" });
}

/** « Épingler un montant » (un titre de bourse) : quelques montants au choix. */
export function feuilleMontant(ctx, b) {
  const but = JSON.parse(b.dataset.but);
  const montants = JSON.parse(b.dataset.montants ?? "[100000, 1000000, 10000000, 100000000]");
  ctx.feuille({
    titre: "Un montant à atteindre",
    rendu: () => `<p class="aide" style="margin-bottom:12px">Ce que tes positions sur ${esc(b.dataset.nom ?? "ce titre")} doivent valoir.</p>
      <div class="choix">${montants.map((m) => `<button class="petit" data-action="epinglerBut" data-but="${esc(JSON.stringify({ ...but, montant: m }))}">${montant(m)}</button>`).join("")}</div>`,
    actions: { epinglerBut: (c, x) => basculerEpingle(c, x) },
  });
}

/** Le bouton d'un titre de bourse : un montant à atteindre sur ce titre (ou « Épinglé » pour le retirer). */
export function boutonMontant(ctx, symbole, nom) {
  const o = epingles(ctx).find((x) => x.sorte === "bourse" && x.but.cible === symbole);
  if (o) return `<button class="petit" style="gap:6px" data-action="epinglerBut" data-objectif="${o.objectif}" aria-pressed="true">
    <span style="width:14px;display:grid">${SYMBOLES.epingle}</span>${esc(o.nom)}</button>`;
  return `<button class="petit plein" style="gap:6px" data-action="epinglerMontant" data-but="${esc(JSON.stringify({ sorte: "bourse", cible: symbole }))}" data-nom="${esc(nom)}">
    <span style="width:14px;display:grid">${SYMBOLES.epingle}</span>Épingler un montant</button>`;
}

/** « L'acheter » : la fiche où l'achat se fait. */
export async function versAchat(ctx, a) {
  if (!a) return;
  switch (a.fiche) {
    case "vehicule": return ctx.ouvrir("configurateur", { id: a.id }, { onglet: "actifs" });
    case "bien": return ctx.ouvrir("achat", { id: a.id }, { onglet: "actifs" });
    case "immobilier": return ctx.ouvrir("marcheImmo", {}, { onglet: "actifs" });
    case "fonder": return ctx.ouvrir("fonder", {}, { onglet: "actifs" });
    case "reprise": return ctx.ouvrir("reprises", {}, { onglet: "actifs" });
    case "pme": return ctx.ouvrir("participations", {}, { onglet: "actifs" });
    case "montre": return ctx.ouvrir("modeleMontre", { id: a.id }, { onglet: "actifs" });
    case "bateaux": return ctx.ouvrir("chantierNaval", {}, { onglet: "actifs" }); // D403
    case "aviation": return ctx.ouvrir("concession", {}, { onglet: "actifs" });
    default: return ctx.allerOnglet("actifs");
  }
}

// MARK: La page

/** Le choix d'échéance retenu pour le prochain but ajouté (null : sans). */
let echeanceChoisie = null;

const ligneProgression = (o) => `
  <div class="rangee entre" style="align-items:baseline;gap:8px">
    <span class="aide">${esc(o.progression)}</span>
    <span class="chiffres" style="font-size:14px;letter-spacing:0">${Math.round(o.part * 100)} %</span>
  </div>
  <div style="margin-top:8px">${rail(o.part, o.atteint ? "var(--gain)" : "var(--or)", 6)}</div>`;

function texteRythme(o) {
  if (o.atteint) return o.acquis ? "C'est fait." : o.achat ? "Tu as de quoi : il t'attend." : "Atteint.";
  if (o.manque > 0) {
    // RNT-414 : pas de quoi comptant, mais la banque suivrait : on le dit tel quel.
    if (o.avecCredit) return `Avec un crédit, tu peux déjà l'acheter : il te manque ${montant(o.manque)} comptant.`;
    if (o.rythmeParJour > 0 && o.joursAuRythme != null) {
      return o.joursAuRythme <= o.joursSaison ? `À ton rythme (${montant(o.rythmeParJour)} par jour), à portée dans ${o.joursAuRythme} jour${o.joursAuRythme > 1 ? "s" : ""}.`
        : `À ton rythme, pas avant la fin de la saison : il faudrait ${o.joursAuRythme} jours, il en reste ${o.joursSaison}.`;
    }
    return `Il te manque ${montant(o.manque)}.`;
  }
  return "";
}

function principal(o) {
  const visuel = o.sorte === "vehicule" && o.silhouette ? photoObjectif(o)
    : `<div style="height:150px;border-radius:24px;border:1px solid var(--filet2);margin-top:8px;display:grid;place-items:center;
        background:radial-gradient(120% 90% at 30% 10%, color-mix(in srgb, ${TEINTES[o.sorte]} 30%, transparent), transparent 70%)">${pastille(o.sorte, 64)}</div>`;
  const rythme = texteRythme(o);
  return `
  <div data-objectif="${o.objectif}" class="pile" style="gap:14px">
    ${visuel}
    <div style="text-align:center;display:grid;gap:4px">
      <div class="aide" style="text-transform:uppercase;letter-spacing:.06em;font-size:11px;font-weight:600">Objectif principal · ${esc(o.genre)}</div>
      <div style="font-size:22px;font-weight:700;line-height:1.2">${esc(o.nom)}</div>
      ${o.prix > 0 ? `<div class="chiffres" style="font-size:32px;line-height:1.1">${montant(o.prix)}</div>` : ""}
    </div>
    ${carte(`${ligneProgression(o)}
      ${rythme ? `<div class="aide" style="margin-top:10px">${esc(rythme)}</div>` : ""}
      ${o.echeance ? `<div class="rangee" style="gap:8px;margin-top:10px;font-size:13px">
          <span style="width:15px;display:grid" class="${o.atteint ? "gain" : "or"}">${icones.sablier}</span>
          <span style="font-weight:600">${esc(o.echeance)}</span>${o.rythmeNecessaire ? `<span class="t2">· il faut ${esc(o.rythmeNecessaire)}</span>` : ""}</div>` : ""}`, { pad: true })}
    <div class="rangee" style="gap:8px;justify-content:center;flex-wrap:wrap">
      ${o.achat && !o.acquis ? petit("L'acheter", "acheterObjectif", { plein: o.atteint || o.avecCredit, donnees: { id: o.objectif } }) : ""}
      ${petit(o.echeance ? "Changer l'échéance" : "Une échéance", "echeanceObjectif", { donnees: { id: o.objectif } })}
      ${petit("Retirer", "retirerObjectif", { donnees: { id: o.objectif } })}
    </div>
  </div>`;
}

function secondaire(o) {
  return carte(`
    <div class="rangee" style="gap:12px;align-items:flex-start">
      ${pastille(o.sorte)}
      <div style="flex:1;min-width:0">
        <div class="aide" style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;font-weight:600">${esc(o.genre)}${o.echeance ? ` · ${esc(o.echeance)}` : ""}</div>
        <div style="font-size:15px;font-weight:600;margin-top:2px">${esc(o.nom)}</div>
        <div style="margin-top:8px">${ligneProgression(o)}</div>
        ${o.rythmeNecessaire && !o.atteint ? `<div class="aide" style="margin-top:6px">Il faut ${esc(o.rythmeNecessaire)}.</div>` : ""}
        ${o.avecCredit && !o.atteint ? `<div class="aide ob-credit">Avec un crédit, tu peux déjà l'acheter.</div>` : ""}
      </div>
    </div>
    <div class="rangee" style="gap:8px;margin-top:12px;flex-wrap:wrap">
      ${o.achat && !o.acquis && (o.atteint || o.avecCredit) ? petit("L'acheter", "acheterObjectif", { plein: true, donnees: { id: o.objectif } }) : ""}
      ${petit("En principal", "principalObjectif", { donnees: { id: o.objectif } })}
      ${petit("Échéance", "echeanceObjectif", { donnees: { id: o.objectif } })}
      ${petit("Retirer", "retirerObjectif", { donnees: { id: o.objectif } })}
    </div>`, { pad: true, attrs: `data-objectif="${o.objectif}"` });
}

/** Le moment « atteint » : la fête, et pour un achat le chemin vers la fiche. */
function moment(o) {
  return carte(`
    <div style="display:grid;justify-items:center;text-align:center;gap:8px;padding:6px 0">
      <span style="width:58px;height:58px;border-radius:50%;display:grid;place-items:center;color:var(--gain);background:color-mix(in srgb, var(--gain) 16%, transparent)">
        <span style="width:28px;display:grid">${SYMBOLES.coche}</span></span>
      <div class="aide" style="text-transform:uppercase;letter-spacing:.08em;font-size:11px;font-weight:700;color:var(--gain)">Objectif atteint</div>
      <div style="font-size:20px;font-weight:700;line-height:1.2">${esc(o.nom)}</div>
      <div class="aide">${o.achat && !o.acquis ? "Tu as de quoi te l'offrir. C'est toi qui décides." : "Bien joué. Garde-le épinglé ou choisis le suivant."}</div>
      <div class="rangee" style="gap:8px;margin-top:6px">
        ${o.achat && !o.acquis ? petit("L'acheter", "acheterObjectif", { plein: true, donnees: { id: o.objectif } }) : ""}
        ${petit("Super", "objectifVu", { plein: !(o.achat && !o.acquis), donnees: { id: o.objectif } })}
      </div>
    </div>`, { pad: true, attrs: `data-moment="${o.objectif}" style="border-color:color-mix(in srgb, var(--gain) 45%, var(--filet2))"` });
}

const puce = (texte, but, { actif = false } = {}) =>
  `<button class="petit ${actif ? "plein" : ""}" data-action="ajouterBut" data-but="${esc(JSON.stringify(but))}">${esc(texte)}</button>`;

/** La feuille « Ajouter un objectif » : suggestions, échéance, et les buts sans fiche. */
function rendreAjout(t) {
  const p = t.patrimoine;
  const paliers = [5_000_000, 10_000_000, 25_000_000, 100_000_000, 1_000_000_000, 10_000_000_000].filter((m) => m > p).slice(0, 4);
  const revenus = [100_000, 500_000, 1_000_000, 5_000_000];
  const niveaux = t.niveauxTrain.filter((n) => Number(n.id) > t.niveauTrain).slice(0, 3);
  const groupe = (titre, contenu, aide = "") => `<div style="margin-top:18px"><div class="libelle" style="font-size:14px">${titre}</div>
    ${aide ? `<div class="aide" style="margin:2px 0 8px">${aide}</div>` : `<div style="height:8px"></div>`}<div class="choix">${contenu}</div></div>`;
  return `
    ${t.suggestions.length ? `<div class="libelle" style="font-size:14px">Pour toi, dans cette partie</div>
      <div class="pile" style="gap:8px;margin-top:8px">${t.suggestions.slice(0, 5).map((s) => `
        <button class="carte rangee" style="gap:12px;padding:10px 12px;width:100%;text-align:left" data-action="ajouterBut" data-but="${esc(JSON.stringify(s.but))}">
          ${pastille(s.but.sorte, 32)}<span style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${esc(s.nom)}</div><div class="aide">${esc(s.genre)}</div></span>
          <span style="width:16px;display:grid;color:var(--texte2)">${icones.plus}</span></button>`).join("")}</div>` : ""}
    ${groupe("Échéance", [`<button class="petit ${echeanceChoisie == null ? "plein" : ""}" data-action="choisirEcheance" data-jour="">Sans</button>`,
      ...t.echeances.map((e) => `<button class="petit ${echeanceChoisie === e.jour ? "plein" : ""}" data-action="choisirEcheance" data-jour="${e.jour}">${esc(e.libelle)}</button>`)].join(""),
      "Facultative : la page dira le rythme à tenir.")}
    ${groupe("Patrimoine", [...paliers.map((m) => puce(montant(m), { sorte: "patrimoine", montant: m })), puce("Doubler", { sorte: "doubler" })].join(""))}
    ${groupe("Revenu", [...revenus.map((m) => puce(`${montant(m)} par semaine`, { sorte: "revenuBoites", montant: m })), puce("Vivre de tes loyers", { sorte: "loyers" })].join(""),
      "Le bénéfice d'une semaine de tes boîtes, ou des loyers qui couvrent ton train de vie.")}
    ${groupe("Style de vie", [...niveaux.map((n) => puce(n.nom.split(",")[0], { sorte: "trainDeVie", nombre: Number(n.id) })),
      puce("Une ville-monde", { sorte: "villeMonde" })].join(""), "Un train de vie par semaine (logement, sorties, prestige), habiter une ville-monde.")}
    <div class="choix" style="margin-top:8px">${t.villesMonde.map((v) => puce(`Habiter à ${v.nom}`, { sorte: "villeMonde", cible: v.id })).join("")}</div>
    <label class="etiquette" for="voyage-ville" style="display:block;margin-top:12px">Un voyage</label>
    <div class="rangee" style="gap:8px;margin-top:6px">
      <select id="voyage-ville" class="champ" style="flex:1">${t.villes.map((v) => `<option value="${esc(v.id)}">${esc(v.nom)}</option>`).join("")}</select>
      ${petit("Épingler", "ajouterVoyage", { plein: true })}
    </div>
    ${groupe("Focus", [10, 20, 30, 40].map((h) => puce(`${h} h cette semaine`, { sorte: "focusSemaine", nombre: h })).join("")
      + [7, 14, 30].map((n) => puce(`Série de ${n} jours`, { sorte: "serie", nombre: n })).join(""))}
    ${groupe("Possessions", [puce("Ton premier bateau", { sorte: "bateau" }), puce("Ton premier avion", { sorte: "jet" }),
      puce("Une série de collection", { sorte: "collection", nombre: 1 })].join(""))}
    ${t.cartesFortune?.length ? groupe("Carte de fortune", t.cartesFortune.slice(0, 4).map((c) => puce(c.nom, { sorte: "carteFortune", nombre: Number(c.id) })).join(""),
      "La carte suit ton palier de salaire, à vie.") : ""}
    ${groupe("Famille", [puce("Te marier", { sorte: "mariage" }), puce("Un enfant", { sorte: "enfant", nombre: 1 }), puce("Deux enfants", { sorte: "enfant", nombre: 2 })].join(""))}
    <p class="aide ob-note">Véhicules, montres, biens, boîtes, parts de PME et titres de bourse s'épinglent depuis leur fiche ; un défi ou un succès depuis leur bloc, avec « Épingler ».</p>`;
}

async function ajouter(ctx, but) {
  const t = await ctx.tableau("objectifs");
  const b = { ...but, ...(echeanceChoisie != null ? { echeance: echeanceChoisie } : {}) };
  const ok = await ctx.decider("objectifs", { epingler: { _0: b, principal: (t?.liste.length ?? 0) === 0 } }, { succes: "Objectif épinglé" });
  if (ok) echeanceChoisie = null;
}

function ouvrirAjout(ctx, d) {
  echeanceChoisie = null;
  ctx.feuille({
    titre: "Ajouter un objectif",
    rendu: () => rendreAjout(d.t),
    actions: {
      ajouterBut: (c, b) => ajouter(c, JSON.parse(b.dataset.but)),
      ajouterVoyage: (c) => ajouter(c, { sorte: "voyage", cible: document.getElementById("voyage-ville").value }),
      choisirEcheance(c, b) {
        echeanceChoisie = b.dataset.jour === "" ? null : Number(b.dataset.jour);
        document.querySelectorAll("[data-action=choisirEcheance]").forEach((x) => x.classList.toggle("plein", x === b));
      },
    },
  });
}

function ouvrirEcheance(ctx, d, id) {
  const o = d.t.liste.find((x) => x.objectif === id);
  ctx.feuille({
    titre: "Échéance",
    rendu: () => `<p class="aide" style="margin-bottom:12px">Pour « ${esc(o?.nom ?? "")} » : la page dira le rythme à tenir.</p>
      <div class="choix"><button class="petit ${o?.but.echeance == null ? "plein" : ""}" data-action="poserEcheance" data-jour="">Sans échéance</button>
      ${d.t.echeances.map((e) => `<button class="petit ${o?.but.echeance === e.jour ? "plein" : ""}" data-action="poserEcheance" data-jour="${e.jour}">${esc(e.libelle)}</button>`).join("")}</div>`,
    actions: {
      poserEcheance: (c, b) => c.decider("objectifs", { echeance: { objectif: id, jour: b.dataset.jour === "" ? null : Number(b.dataset.jour) } }, { succes: "Échéance posée" }),
    },
  });
}

/** D403 : le bloc affiché (« epingles », « semaine », « succes »). */
let bloc = "epingles";

/** D403 : un succès proche, sa barre et son bouton « Épingler ». */
function succesProche(ctx, p) {
  const s = p.succes;
  return carte(`<div class="ob-succes" style="--c1:${esc(s.couleurs[0] ?? "#C9CDD3")}">
    <div class="df-rangee"><span class="df-s-corps"><b>${esc(s.nom)}</b><small>${esc(s.detail)}</small></span><span class="df-palier">${esc(s.palierNom)}</span></div>
    <progress class="df-barre" max="100" value="${Math.round(s.progression * 100)}"></progress>
    <div class="df-rangee"><span class="df-avancement chiffres">${esc(s.avancement)}</span>
      ${p.epinglable ? boutonEpingler(ctx, { sorte: "succes", cible: s.id }) : ""}</div>
  </div>`, { pad: true });
}

function blocSucces(ctx, t) {
  return `<div class="df-tete"><span class="df-titre">Les plus proches</span>
      <p class="aide">À vie : ils se gagnent de saison en saison. Épingle celui que tu vises.</p></div>
    ${t.succesProches.length ? t.succesProches.map((p) => succesProche(ctx, p)).join("")
      : '<p class="aide df-centre">Tous tes succès visibles sont obtenus. Les cachés se dévoilent en jouant.</p>'}
    <button class="tuile tuile-defis" data-action="ouvrir" data-page="defis">
      <span class="df-tuile-corps"><span class="df-tuile-l">Tous les succès, les duels et les coffres</span>
        <span class="df-tuile-d chiffres">${t.succesObtenus} / ${t.succesTotal}</span></span>
      <span class="chevron" aria-hidden="true">›</span></button>`;
}

function blocEpingles(t) {
  const [p, ...secondaires] = t.liste;
  const moments = t.liste.filter((o) => o.atteint && !o.vu);
  const ajouterBouton = (texte) => bouton(texte, "ajouterObjectif", { genre: t.liste.length ? "secondaire" : "primaire" });
  if (!p) return `
    <div class="ob-vide">
      <span class="ob-vide-pin">${SYMBOLES.epingle}</span>
      <div class="ob-vide-titre">Aucun objectif épinglé</div>
      <p class="ob-vide-texte">Jusqu'à trois : un principal sur l'accueil, deux en petit dessous. Un patrimoine, une famille, du focus ici ; un défi ou un succès dans les autres blocs ; un véhicule, un bien, une boîte depuis sa fiche. C'est toujours toi qui décides.</p>
      <div class="ob-vide-boutons">${ajouterBouton("Choisir un objectif")}${bouton("Ouvrir Actifs", "versActifs", { genre: "secondaire" })}</div>
    </div>`;
  return `${moments.map(moment).join("")}
    ${principal(p)}
    ${secondaires.length ? `<div class="libelle ob-aussi">Aussi en vue</div>${secondaires.map(secondaire).join("")}` : ""}
    ${t.plein ? `<div class="aide df-centre">Trois objectifs épinglés : retires-en un pour en choisir un autre.</div>` : ajouterBouton(secondaires.length ? "Ajouter un objectif" : "Ajouter un objectif secondaire")}`;
}

/** 17/11 (Arthur) : les défis de la saison (ceux qui donnent une pièce), sous ceux de la semaine. */
function defisSaison(cz) {
  if (!cz?.defis?.length || cz.defisDansObjectifs === false) return ""; // D414 : coupé par l'admin, ils restent dans Style
  return `<div class="ob-saison"><div class="libelle ob-aussi">${esc(cz.nomSaison ? `Les défis de ${cz.nomSaison}` : "Les défis de la saison")}</div>
    ${listeDefis(cz.defis)}<p class="aide cz-note">Les mêmes pour tous les joueurs de ton monde. Chacun donne une pièce unique, qui te suit.</p></div>`;
}

const page = {
  titre: "Objectifs",
  css: ["cosmetiques", "defis"],
  async donnees(ctx) {
    const [t, cz] = await Promise.all([ctx.tableau("objectifs"), bloc === "semaine" ? lireCosmetiques(ctx) : null]);
    return { t, cz };
  },
  rendu(d, ctx) {
    const t = d.t;
    if (!t) return `${entetePousse("Objectifs")}<div class="vide">Les objectifs se choisissent pendant une saison.</div>`;
    const s = t.semaine;
    const corps = bloc === "semaine" ? blocSemaine(s, (but) => boutonEpingler(ctx, but)) + defisSaison(d.cz)
      : bloc === "succes" ? blocSucces(ctx, t) : blocEpingles(t);
    return `
      ${entetePousse("Objectifs")}
      <div class="pile df-page">
        ${segment([["epingles", "Épinglés"], ["semaine", s ? `Semaine ${s.faits}/${s.defis.length}` : "Semaine"], ["succes", "Succès"]], bloc, "bloc", { defilant: false })}
        ${corps}
      </div>`;
  },
  actions: {
    bloc: async (ctx, b) => { bloc = b.dataset.valeur; await ctx.rafraichir(); },
    plus: (ctx) => { basculerClassement(); ctx.redessiner(); },
    versActifs: (ctx) => ctx.allerOnglet("actifs"),
    ajouterObjectif: (ctx, b, d) => ouvrirAjout(ctx, d),
    echeanceObjectif: (ctx, b, d) => ouvrirEcheance(ctx, d, Number(b.dataset.id)),
    async retirerObjectif(ctx, b) { await ctx.decider("objectifs", { retirer: { objectif: Number(b.dataset.id) } }, { succes: "Objectif retiré" }); },
    async principalObjectif(ctx, b) { await ctx.decider("objectifs", { principal: { objectif: Number(b.dataset.id) } }, { succes: "Objectif principal, sur l'accueil" }); },
    async objectifVu(ctx, b) { await ctx.decider("objectifs", { vu: { objectif: Number(b.dataset.id) } }); },
    async acheterObjectif(ctx, b, d) { await versAchat(ctx, d.t.liste.find((o) => o.objectif === Number(b.dataset.id))?.achat); },
  },
};

export const pages = { objectif: page, objectifs: page };
