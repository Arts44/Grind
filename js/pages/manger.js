// ══════════════════════════════════════════════════════════════════════
//  Page « Manger » (RNT-177, RNT-183, D198, D202) — EcranManger.swift.
//
//  En haut, la faim : l'assiette qui se vide, le mot (Rassasié… Affamé),
//  le pourcentage, le temps avant d'avoir faim et ce que coûte le ventre
//  vide. Puis la table en cours, les invitations reçues, où manger ici
//  (une carte par endroit : on choisit son plat, sa boisson, son dessert,
//  avec qui, la table VIP, un pourboire), chez toi (le frigo, les courses,
//  cuisiner), avec qui (rencontres, joueurs et bots de la ville) et le
//  ventre vide expliqué. Tout achat passe par la fenêtre de paiement.
//
//  Le module donne aussi aux autres pages : la tuile Faim de l'accueil
//  (`tuileFaim`, `mangerIci`), l'assiette (`assiette`), la carte d'un
//  endroit (`ouvrirRepas`), le guichet d'une adresse ou du domicile
//  (`guichetRepas`, `guichetCoffre`), les coffres (`ouvrirCoffre`…).
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js";
import { entetePousse, carte, bouton, petit, ligne, rail, bandeau, champEuros, lireEuros } from "../ui.js";
import { ouvrirCuisine as cuisineMaison, carteEnCuisine, laisserEnPlan, minuteurs } from "./cuisine.js"; // RNT-189, RNT-199
import { poserStyles } from "./index.js";

// RNT-210 : ses feuilles (repas, cuisine, coffre) s'ouvrent aussi depuis l'accueil, la Banque et le Monde :
// css/pages/manger.css est posé dès que le fichier est chargé, d'où qu'il le soit.
poserStyles(["manger"]);

// MARK: Icônes (les symboles SF du moteur, en traits)

const I = (d, t = 0) => `<svg viewBox="0 0 24 24" ${t ? `width="${t}" height="${t}"` : ""} fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const SF_REPAS = {
  "house.fill": '<path d="M4 20V9l8-5 8 5v11zM10 20v-5h4v5"/>',
  bicycle: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l2 8H6M14 5h2"/>',
  "takeoutbag.and.cup.and.straw.fill": '<path d="M5 9h10l-1 11H6zM7 9V7a3 3 0 0 1 6 0v2M16 11h4l-1 9h-3M18 11l1-5 2-1"/>',
  "takeoutbag.and.cup.and.straw": '<path d="M5 9h10l-1 11H6zM7 9V7a3 3 0 0 1 6 0v2M16 11h4l-1 9h-3M18 11l1-5 2-1"/>',
  "fork.knife": '<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M17 21V3c-2 1.5-3 4-3 7v3h3"/>',
  "star.fill": '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
  "wineglass.fill": '<path d="M7 3h10l-.5 5a4.5 4.5 0 0 1-9 0zM12 12.5V20M8.5 20.5h7"/>',
  "music.note.house.fill": '<path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5"/><path d="M14 11v5.2a1.6 1.6 0 1 1-1.2-1.6V11.5l3.2-.8"/>',
  "cart.fill": '<path d="M3 4h2.5l2.2 11h10.6l2-8H7"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  "basket.fill": '<path d="M4 10h16l-1.6 9.2a1 1 0 0 1-1 .8H6.6a1 1 0 0 1-1-.8zM8 10l3-6M16 10l-3-6M9.5 14v3M14.5 14v3"/>',
  "cross.case.fill": '<rect x="3.5" y="7" width="17" height="12.5" rx="2.2"/><path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7M12 10.5v5.5M9.2 13.2h5.6"/>',
  cylinder: '<ellipse cx="12" cy="6" rx="6" ry="2.5"/><path d="M6 6v12c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6"/>',
  snowflake: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6l2.5-1.5M9.5 19.5 12 18l2.5 1.5"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19l7-7"/>',
  egg: '<path d="M12 3c3.6 0 6 5.5 6 10a6 6 0 0 1-12 0c0-4.5 2.4-10 6-10z"/>',
  bag: '<path d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
  basket: '<path d="M4 10h16l-1.6 9.2a1 1 0 0 1-1 .8H6.6a1 1 0 0 1-1-.8zM8 10l3-6M16 10l-3-6"/>',
  oval: '<ellipse cx="12" cy="12.5" rx="5.5" ry="7.5"/>',
  carrot: '<path d="M14 10 5 19c-.6.6.4 1.6 1 1l9-9M14 10l3-3M14 10c1.5-1.5 3.5-1 4 0M17 7c.5-1.5 2-2.5 3.5-2.5M17 7c-1-1-1-3 0-4"/>',
  triangle: '<path d="M12 4 21 19H3z"/>',
  flame: '<path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-10-2 2-3 4-3 6-1-1-1.5-2-1.5-3C7.5 10 6 12.5 6 15a6 6 0 0 0 6 6z"/>',
  fish: '<path d="M3 12c3-4 8-5 12-3l4-3v12l-4-3c-4 2-9 1-12-3z"/><circle cx="8" cy="11.2" r=".8"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.8 3.6-5.6 7-5.6s6.2 1.8 7 5.6"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/>',
  coffre: '<rect x="3.5" y="4" width="17" height="15" rx="2"/><circle cx="12" cy="11.5" r="3.2"/><path d="M12 8.3v1M12 13.7v1M8.8 11.5h1M14.2 11.5h1M6 19v1.5M18 19v1.5"/>',
  faim: '<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M17 21V3c-2 1.5-3 4-3 7v3h3"/>',
  "play.tv.fill": '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10.5 8.5v5l4-2.5zM8 21h8"/>', // RNT-197
};
export const sfRepas = (nom, t = 0) => I(SF_REPAS[nom] ?? SF_REPAS["fork.knife"], t);

const TEINTE = { maison: "#F2A65A", livraison: "#3FB6A8", fastfood: "#E0913F", brasserie: "#C9A15B", etoile: "#B98BFF", bar: "#E76FA3", club: "#6F7CF2",
  supermarche: "#4FB37E", epicerie: "#C9A15B", hopital: "#E5534B" };
const teinte = (id) => TEINTE[id] ?? "var(--accent)";

/** La couleur du ton de la faim (TableauFaim.ton) : plein, creux, faim, alerte. */
export const TON_FAIM = { plein: "#3FB6A8", creux: "#E3C46B", faim: "#F0954A", alerte: "#E5534B" };
const tonDe = (f) => (f >= 60 ? "plein" : f >= 40 ? "creux" : f >= 20 ? "faim" : "alerte");

/** Les mots de la faim (sans le moteur : MoteurEconomie.etatFaim). */
export const etatFaim = (f) => (f >= 80 ? "Rassasié" : f >= 60 ? "Ça va" : f >= 40 ? "Un petit creux" : f >= 20 ? "Faim" : "Affamé");

/** L'assiette : le bord, et ce qu'il reste dedans, en part de tarte (la faim, de 0 à 1). */
export function assiette(part, taille = 44, couleur = TON_FAIM.plein) {
  const p = Math.max(0, Math.min(1, part ?? 1));
  const r = 17;
  const a = p * 2 * Math.PI;
  const x = 32 + r * Math.sin(a), y = 32 - r * Math.cos(a);
  const plein = p >= 0.999
    ? `<circle cx="32" cy="32" r="${r}" fill="${couleur}"/>`
    : p > 0.005 ? `<path d="M32 32 L32 ${32 - r} A${r} ${r} 0 ${p > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z" fill="${couleur}"/>` : "";
  return `<svg class="assiette" width="${taille}" height="${taille}" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="29" fill="rgba(255,255,255,.035)" stroke="var(--filet2)" stroke-width="1.5"/>
    <circle cx="32" cy="32" r="21" fill="none" stroke="var(--filet2)" stroke-width="1.2"/>
    <circle cx="32" cy="32" r="${r}" fill="var(--puce)"/>${plein}</svg>`;
}

/** Ancien anneau de la faim (D198), gardé pour les pages qui l'importent encore. */
export function anneauFaim(faim, taille = 46) {
  return assiette((faim ?? 100) / 100, taille, TON_FAIM[tonDe(faim ?? 100)]);
}

const minutes = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}` : `${m} min`);
const effet = (o) => [o.faim ? `cale +${Math.round(o.faim)}` : "", o.plaisir ? `plaisir +${Math.round(o.plaisir)}` : ""].filter(Boolean).join(" · ");

// MARK: La tuile de l'accueil

/** La tuile Faim (TableauFaim) : l'assiette, le mot, le pourcentage, le temps avant d'avoir faim, « Manger ». */
export function tuileFaim(t) {
  if (!t) return "";
  const c = TON_FAIM[t.ton] ?? TON_FAIM.plein;
  return `<div class="carte tuile-faim" style="--c:${c}">
    <button class="tf-corps" data-action="ouvrir" data-page="manger" aria-label="Faim : ${esc(t.mot)}, ${t.faim} %">
      ${assiette(t.part, 54, c)}
      <span class="tf-texte"><span class="t">Faim</span>
        <span class="v">${esc(t.mot)} <span class="chiffres tf-pc">${t.faim} %</span></span>
        <span class="tf-avant ${t.alerte ? "alerte" : ""}">${esc(t.etatLieu ?? t.avant)}</span></span>
    </button>
    <button class="petit teinte" style="--c:${c}" data-action="mangerIci">Manger</button>
    <div class="tf-rail">${rail(t.part, c, 4)}</div>
  </div>`;
}

/** « Manger » sur l'accueil : ce qui est possible là où l'on est, sans quitter l'accueil. */
export async function mangerIci(ctx) {
  const t = await ctx.tableau("manger");
  if (!t) return;
  const ici = t.options.filter((o) => !o.refus);
  ctx.feuille({
    titre: "Manger ici",
    contenu: `<div class="pile">
      ${t.aTable ? aTable(t) : ""}
      ${ici.length ? carte(ici.map((o) => ligneOption(o)).join("")) : `<p class="aide">Rien d'ouvert ici pour l'instant.</p>`}
      <p class="aide" style="margin:0 4px">${esc(t.lieu ? `${t.lieu}, ${t.ville}` : t.ville)} · ${t.faim} %, ${esc(t.etatFaim.toLowerCase())}.</p>
      ${bouton("Tout voir", "", { genre: "secondaire", page: "manger" })}</div>`,
    actions: {
      repas: (c, el) => ouvrirRepas(ctx, t, el.dataset.id),
      seLever: () => seLever(ctx),
    },
  });
}

// MARK: La page

export const pages = {
  manger: {
    titre: "Manger",
    css: "manger", // RNT-210 : css/pages/manger.css (repris d'anciens.css)
    async donnees(ctx) {
      return { t: await ctx.tableau("manger") };
    },
    rendu(d) {
      const t = d?.t;
      if (!t) return `${entetePousse("Manger")}<div class="vide">La faim compte avec ta première saison.</div>`;
      const n = t.nourriture;
      // Ce qui est possible ici d'abord, puis les adresses de la ville (on s'y rend par le plan).
      const options = [...t.options].sort((a, b) => (a.refus ? 1 : 0) - (b.refus ? 1 : 0));
      return `${entetePousse("Manger")}
        <div class="pile manger">
          ${carteFaim(t)}
          ${n?.hopitalJusqua ? bandeau(`<b>Aux urgences</b> jusqu'à ${esc(n.hopitalJusqua)} : on te sert ici. La note : ${montant(n.noteHopital)}.`, "#E5534B") : ""}
          ${n?.enCuisine ? carteEnCuisine(n.enCuisine) : ""}
          ${t.aTable ? aTable(t) : ""}
          ${n ? invitationsRecues(n) : ""}
          <div class="rangee entre" style="margin:10px 4px 0"><span class="section" style="margin:0">Où manger</span><span class="aide">${esc(t.lieu ? `${t.lieu}, ${t.ville}` : t.ville)}</span></div>
          ${t.pointe ? `<p class="aide" style="margin:0 4px">Heure de pointe : une file aux adresses. Un pourboire en liquide fait passer devant.</p>` : ""}
          ${carte(options.map((o) => ligneOption(o)).join(""))}
          ${n ? chezToi(n) : ""}
          ${n ? avecQui(n) : ""}
          ${n ? ventreVide(n) : `<p class="aide">${esc(t.paieTexte)}</p>`}
        </div>`;
    },
    actions: {
      repas: (ctx, el, d) => ouvrirRepas(ctx, d.t, el.dataset.id),
      seLever: (ctx) => seLever(ctx),
      laisserEnPlan: (ctx) => laisserEnPlan(ctx), // RNT-199
      versMonde: (ctx) => ctx.ouvrir("monde"),
      cuisiner: (ctx, el, d) => ouvrirCuisine(ctx, d.t),
      courses: (ctx, el, d) => ouvrirCourses(ctx, d.t, el.dataset.livrer === "1"),
      maisonCuisine: (ctx) => cuisineMaison(ctx, { onglet: "maison" }), // RNT-189
      repondre: (ctx, el) => ctx.decider("portefeuille", { repondreRepas: { id: el.dataset.id, accepte: el.dataset.oui === "1" } },
        { succes: el.dataset.oui === "1" ? "Invitation acceptée" : "Invitation déclinée" }),
      annulerInvitation: (ctx, el) => ctx.decider("portefeuille", { annulerRepas: { _0: el.dataset.id } }, { succes: "Invitation annulée" }),
      proposerDate: (ctx, el) => ctx.decider("portefeuille", { proposerDate: { _0: el.dataset.id } }, { succes: "Invitation lancée" }),
      inviter: (ctx, el, d) => ouvrirInvitation(ctx, d.t, el.dataset.id),
      soiree: (ctx, el, d) => ouvrirSoiree(ctx, d.t), // RNT-197 : le streaming
      lancerSoiree: (ctx, el) => ctx.decider("portefeuille", { soiree: { avec: el.dataset.avec || null } }, { succes: "Bonne soirée" }),
    },
  },
};

// MARK: La soirée film (RNT-197, le streaming)

/** Seul pour souffler, ou avec un invité qui a accepté une « soirée film », ou une rencontre qui a dit oui. */
function ouvrirSoiree(ctx, t) {
  const n = t.nourriture;
  if (!n) return;
  const avec = [
    ...n.convives.filter((c) => c.lieu === "soiree").map((c) => ({ id: c.id, nom: c.nom, detail: c.sorte === "date" ? "En tête-à-tête, chez toi" : "Entre amis, chez toi" })),
    ...n.rencontres.filter((r) => r.accepte === true).map((r) => ({ id: `r:${r.id}`, nom: r.prenom, detail: "A dit oui : en tête-à-tête, chez toi" })),
  ];
  ctx.feuille({
    titre: "Soirée film",
    contenu: `<div class="pile">
      ${n.refusSoiree ? bandeau(esc(n.refusSoiree), "var(--texte2)") : ""}
      ${carte([
        ligne({ titre: "Seul", detail: "Un film, le canapé : de quoi souffler", icone: sfRepas("play.tv.fill"), teinte: "#8E7CF2", action: "soireeAvec", donnees: { avec: "" }, desactive: !!n.refusSoiree }),
        ...avec.map((a) => ligne({ titre: `Avec ${esc(a.nom)}`, detail: esc(a.detail), icone: sfRepas("heart"), teinte: "#E76FA3", action: "soireeAvec", donnees: { avec: a.id }, desactive: !!n.refusSoiree })),
      ].join(""))}
      <p class="aide">Une soirée par jour, sans restaurant à payer. À deux, un gros plaisir pour vous deux. Pour recevoir, invite quelqu'un à une « Soirée film » (Avec qui).</p></div>`,
    actions: {
      soireeAvec: (c, el) => ctx.decider("portefeuille", { soiree: { avec: el.dataset.avec || null } }, { succes: "Bonne soirée" }),
    },
  });
}

function carteFaim(t) {
  const n = t.nourriture, tu = n?.tuile;
  const c = TON_FAIM[tu?.ton ?? tonDe(t.faim)];
  const malaises = n?.malaisesAujourdhui ?? 0;
  return carte(`<div class="rangee" style="gap:16px">
      ${assiette(t.partFaim, 68, c)}
      <div style="flex:1;min-width:0">
        <div class="aide">Faim</div>
        <div class="rangee" style="gap:8px;align-items:baseline"><span class="libelle" style="font-size:20px;color:${c}">${esc(t.etatFaim)}</span>
          <span class="chiffres t2" style="font-size:17px">${t.faim} %</span></div>
        <div class="aide ${tu?.alerte ? "alerte" : ""}" style="margin-top:2px">${esc(tu?.etatLieu ?? tu?.avant ?? "")}</div>
      </div></div>
    <div style="margin-top:12px">${rail(t.partFaim, c, 6)}</div>
    <p class="aide" style="margin-top:10px">${esc(t.paieTexte)}${malaises ? ` ${malaises} malaise${malaises > 1 ? "s" : ""} aujourd'hui${malaises === 1 ? " : un second, et c'est l'hôpital" : ""}.` : ""}</p>`, { pad: true });
}

/** RNT-199 : chez soi, le repas avance (un rail) ; la faim et le plaisir viennent à la fin. */
function aTableMaison(a) {
  minuteurs();
  const total = a.fin - a.debut, fait = (window.__grind?.maintenant?.() ?? Date.now()) - a.debut;
  return `<div class="minuteur-rail" data-debut="${a.debut}" data-fin="${a.fin}" style="margin-top:12px">${rail(total > 0 ? fait / total : 1, TEINTE.maison, 5)}</div>
    <p class="aide" style="margin-top:8px">La faim et le plaisir viennent en fin de repas : te lever avant, c'est moins calé.</p>`;
}

/** RNT-252 : le plat servi, la faim et le plaisir montent en mangeant (un rail, du service à la fin). */
function aTableServi(a) {
  minuteurs();
  repasAVue();
  const total = a.fin - a.servi, fait = (window.__grind?.maintenant?.() ?? Date.now()) - a.servi;
  const part = total > 0 ? Math.min(1, Math.max(0, fait) / total) : 1;
  // RNT-264 : ce qui est déjà reçu est acquis, même si l'on se lève.
  return `<div class="minuteur-rail repas-note" data-debut="${a.servi}" data-fin="${a.fin}">${rail(part, TEINTE.maison, 5)}</div>
    <p class="repas-recu chiffres" data-repas-progressif>Déjà reçu : +${Math.round(a.faimTotale * part)} faim, +${Math.round(a.plaisirTotal * part)} plaisir sur +${Math.round(a.faimTotale)}, +${Math.round(a.plaisirTotal)}.</p>
    <p class="aide repas-note">La faim et le plaisir montent pendant que tu manges. Ce qui est reçu reste acquis ; te lever avant la fin, c'est perdre le reste.</p>`;
}

/** RNT-264 : à table, la page se redessine toutes les 10 s (la faim, l'humeur et « Déjà reçu » montent à vue). */
let repasMinuteur = null;
function repasAVue() {
  if (repasMinuteur) return;
  repasMinuteur = setInterval(() => {
    if (!document.querySelector("[data-repas-progressif]")) { clearInterval(repasMinuteur); repasMinuteur = null; return; }
    if (document.querySelector("dialog[open]")) return;
    window.__grind?.rafraichir?.();
  }, 10_000);
}

/** Se lever : le toast dit le bilan exact (reçu, perdu), pris au moment du clic. */
export async function seLever(ctx) {
  const t = await ctx.tableau("manger");
  const a = t?.aTable;
  return ctx.decider("portefeuille", { seLever: {} }, { succes: a?.livreurAttendu ? "Livraison annulée" : a?.bilan ?? "Tu te lèves de table" });
}

function aTable(t) {
  const a = t.aTable;
  const plats = t.plats?.length ? t.plats.join(" · ") : "";
  // RNT-252 : en attendant le livreur, le focus marche ; partir, c'est le rater (le repas reste payé).
  const texte = a.livreurAttendu
    ? `${plats ? `${esc(plats)}. ` : ""}Le livreur arrive à ${esc(a.serviTexte ?? a.finTexte)}. Fais un focus en attendant, mais ne pars pas : il repartirait, et le repas reste payé.`
    : `${plats ? `${esc(plats)}. ` : ""}Jusqu'à ${esc(a.finTexte)}${a.file ? `, dont ${a.file} min de file` : ""}${a.avec ? `, ${esc(a.avec)}` : ""}. Pas de trajet d'ici là.`;
  return carte(`<div class="rangee" style="gap:12px">
      <span class="pastille" style="--c:${teinte(a.formule)}">${sfRepas("fork.knife")}</span>
      <div style="flex:1;min-width:0"><div class="libelle" id="a-table-titre">${a.livreurAttendu ? "Livraison" : "À table"} : ${esc(a.nom)}</div>
        <div class="aide">${texte}</div></div></div>
    ${a.servi != null ? aTableServi(a) : a.formule === "maison" ? aTableMaison(a) : ""}
    ${a.routine ? `<p class="aide repas-note">${esc(a.routine)}</p>` : ""}
    ${a.resultat ? `<p class="aide" style="margin-top:8px">${esc(a.resultat)}</p>` : ""}
    <div class="choix" style="margin-top:10px">${petit(a.livreurAttendu ? "Annuler, le repas reste payé" : "Se lever", "seLever")}</div>`, { pad: true });
}

function ligneOption(o, { plan = true } = {}) {
  const prixBase = o.id === "maison" ? 0 : o.aPartirDe ?? o.prix;
  // Chez soi, les courses sont déjà payées : pas de prix à droite.
  const prix = o.id === "maison" ? "" : `${o.aPartirDe ? "dès " : ""}${montant(prixBase)}`;
  const duree = o.plats ? (o.file ? `${o.file} min de file` : "") : `${minutes(o.minutes)}${o.file ? ` + ${o.file} min de file` : ""}`;
  const quoi = o.plats ? `${o.plats.filter((p) => p.sorte === "plat").length} plats${o.plats.some((p) => p.local) ? ", spécialités d'ici" : ""}` : effet(o);
  const detail = [o.lieuNom !== o.nom && o.lieuNom !== "Où que tu sois" ? esc(o.lieuNom) : "", quoi, duree].filter(Boolean).join(" · ")
    + (o.refus ? `<br><span class="t3">${esc(o.refus)}</span>` : "");
  const action = o.refus ? (plan && (o.lieu?.startsWith("s:") || o.lieu === "domicile") ? "versMonde" : "") : "repas";
  return ligne({ titre: esc(o.nom), detail, valeur: prix, icone: sfRepas(o.icone), teinte: teinte(o.id), action, donnees: { id: o.id }, desactive: !action });
}

function invitationsRecues(n) {
  const l = n.invitations.filter((i) => i.peutRepondre);
  if (!l.length) return "";
  return carte(l.map((i) => `<div class="ligne" style="flex-wrap:wrap">
      <span class="pastille" style="--c:${i.sorte === "date" ? "#E76FA3" : i.sorte === "affaires" ? "#C9A15B" : "#3FB6A8"}">${sfRepas(i.sorte === "date" ? "heart" : i.sorte === "affaires" ? "briefcase" : "person")}</span>
      <span style="flex:1;min-width:0"><div class="titre">${esc(i.nom)} t'invite</div><div class="detail">${esc(SORTES[i.sorte] ?? "")} · ${esc(i.lieuNom.toLowerCase())}, ${esc(i.ville)}</div></span>
      <span class="choix">${petit("Décliner", "repondre", { donnees: { id: i.id, oui: "0" } })}${petit("Accepter", "repondre", { plein: true, donnees: { id: i.id, oui: "1" } })}</span>
    </div>`).join(""));
}
const SORTES = { ami: "entre amis", affaires: "dîner d'affaires", date: "en tête-à-tête" };

function chezToi(n) {
  const jauges = `<div class="frigo">
      <div><div class="rangee entre"><span class="aide">Frigo · frais</span><span class="chiffres" style="font-size:13px">${n.frais}/${n.capaciteFrais}</span></div>${rail(n.frais / n.capaciteFrais, "#6FB7E9", 4)}</div>
      <div><div class="rangee entre"><span class="aide">Placard · sec</span><span class="chiffres" style="font-size:13px">${n.sec}/${n.capaciteSec}</span></div>${rail(n.sec / n.capaciteSec, "#C9A15B", 4)}</div></div>`;
  const stock = n.stock.length
    ? `<div class="denrees">${n.stock.map((x) => `<span class="denree ${x.bientot ? "bientot" : ""}" title="${esc(x.conservation)}">${sfRepas(x.icone, 14)}${esc(x.nom)} <b class="chiffres">${x.quantite}</b>${x.perime && x.sorte === "frais" ? `<i>${esc(x.perime)}</i>` : ""}</span>`).join("")}</div>`
    : `<p class="aide">${n.habite ? "Le frigo est vide." : "Pas de logement, pas de frigo : loue ou achète un toit."}</p>`;
  const faisables = n.recettes.filter((r) => !r.manque.length).length;
  const ou = n.auMagasin ? `Tu es ${n.epicerieFine ? "à l'épicerie fine" : "au supermarché"}.` : `${esc(n.supermarche ?? "Le supermarché")} est sur le plan${n.epicerie ? `, ${esc(n.epicerie)} aussi` : ""}.`;
  return `<div class="section">Chez toi</div>
    ${carte(`${jauges}${stock}
      ${n.jetees ? `<p class="aide" style="margin-top:8px">${n.jetees} portion${n.jetees > 1 ? "s" : ""} jetée${n.jetees > 1 ? "s" : ""}, périmée${n.jetees > 1 ? "s" : ""}.</p>` : ""}
      ${n.livraisons.map((l) => `<p class="aide" style="margin-top:6px">${sfRepas("cart.fill", 13)} ${esc(l)}</p>`).join("")}
      <div class="choix" style="margin-top:12px">
        ${petit(`Cuisiner${faisables ? ` (${faisables})` : ""}`, "cuisiner", { desactive: !n.habite })}
        ${n.auMagasin ? petit("Faire les courses", "courses", { plein: true, desactive: !n.habite }) : ""}
        ${petit(`Se faire livrer (${n.livraisonMinutes} min)`, "courses", { donnees: { livrer: "1" }, desactive: !n.habite })}
        ${petit("Restes, congélateur", "maisonCuisine", { desactive: !n.habite })}
        ${n.soiree ? petit("Soirée film", "soiree", { teinte: "#8E7CF2" }) : ""}
      </div>
      <p class="aide" style="margin-top:10px">${ou} Le frais périme en quelques jours, le sec se garde des mois.</p>`, { pad: true })}`;
}

function avecQui(n) {
  const lignes = [];
  // Une rencontre qui a dit oui a sa ligne plus bas (avec son portrait) : pas deux fois.
  for (const c of n.convives.filter((x) => !x.id.startsWith("r:"))) {
    // RNT-197 : une soirée film acceptée se lance d'ici, chez soi.
    if (c.lieu === "soiree") {
      lignes.push(`<div class="ligne" data-convive="${esc(c.id)}"><span class="pastille" style="--c:#8E7CF2">${sfRepas("play.tv.fill")}</span>
        <span style="flex:1;min-width:0"><div class="titre">${esc(c.nom)}</div><div class="detail">${esc(`${SORTES[c.sorte] ?? ""} · ${c.detail}`)}${n.refusSoiree ? `<br><span class="t3">${esc(n.refusSoiree)}</span>` : ""}</div></span>
        ${petit("Lancer", "lancerSoiree", { plein: true, donnees: { avec: c.id }, desactive: !!n.refusSoiree })}</div>`);
      continue;
    }
    lignes.push(ligne({ titre: esc(c.nom), detail: esc(`${SORTES[c.sorte] ?? ""}${c.detail ? ` · ${c.detail}` : ""}`), icone: sfRepas(c.sorte === "date" ? "heart" : c.sorte === "affaires" ? "briefcase" : "person"),
      teinte: c.sorte === "date" ? "#E76FA3" : "#3FB6A8" }));
  }
  for (const r of n.rencontres) {
    const etat = r.accepte === true ? `<span class="gain">a dit oui</span>` : r.accepte === false ? `<span class="t3">a décliné</span>` : petit("Inviter à dîner", "proposerDate", { donnees: { id: r.id } });
    lignes.push(`<div class="ligne"><span class="pastille" style="--c:#E76FA3">${sfRepas("heart")}</span>
      <span style="flex:1;min-width:0"><div class="titre">${esc(r.prenom)}</div><div class="detail">${esc(r.portrait)} · rencontré${r.prenom.match(/a$|e$/) ? "e" : ""} au ${esc(r.ou)}, ${esc(r.jusqua)}</div></span>${etat}</div>`);
  }
  for (const i of n.invitations.filter((x) => x.deMoi)) {
    lignes.push(`<div class="ligne"><span class="pastille" style="--c:#6F7CF2">${sfRepas("person")}</span>
      <span style="flex:1;min-width:0"><div class="titre">${esc(i.nom)}</div><div class="detail">${esc(i.texte)} · ${esc(SORTES[i.sorte] ?? "")}</div></span>
      ${i.peutAnnuler ? petit("Annuler", "annulerInvitation", { donnees: { id: i.id } }) : ""}</div>`);
  }
  for (const p of n.invitables) {
    lignes.push(`<div class="ligne"><span class="pastille" style="--c:#5b8def">${sfRepas("person")}</span>
      <span style="flex:1;min-width:0"><div class="titre">${esc(p.pseudo)}${p.bot ? ` <span class="puce">Bot</span>` : ""}</div><div class="detail">${p.enFocus ? "En focus" : "Dans ta ville"}</div></span>
      ${petit("Inviter", "inviter", { donnees: { id: p.id } })}</div>`);
  }
  const vide = n.enLigne ? "Personne de ton monde dans cette ville pour l'instant." : "Au bar et au club, on rencontre du monde : invite-le ensuite à dîner. En ligne, invite un joueur ou un bot de ta ville.";
  // RNT-197 : sans réseau, les invitations attendent le wifi.
  const coupe = n.reseau && !n.reseau.discussions ? bandeau(`<b>Pas de réseau.</b> ${esc(n.reseau.detail)}`, "var(--texte2)") : "";
  return `<div class="section">Avec qui</div>
    ${coupe}
    ${lignes.length ? carte(lignes.join("")) : ""}
    ${n.bonus.map((b) => `<p class="aide" style="margin:8px 4px 0">${sfRepas("briefcase", 13)} ${esc(b)}</p>`).join("")}
    <p class="aide" style="margin:8px 4px 0">${lignes.length ? "Un dîner d'affaires (brasserie, étoilé) : une meilleure négociation, ou un employé clé moins cher. Un date réussi fait monter l'humeur." : vide}</p>`;
}

function ventreVide(n) {
  return `<div class="section">Le ventre vide</div>
    ${carte(n.effetsFaim.map((e, i) => `<div class="avantage" style="padding:${i ? "8px" : "0"} 0 0"><span style="color:${["#F0954A", "#E3C46B", "#E5534B"][i] ?? "var(--texte2)"}">•</span><span class="aide" style="color:var(--texte)">${esc(e)}</span></div>`).join(""), { pad: true })}
    <p class="aide" style="margin:8px 4px 0">${esc(n.hopital ?? "L'hôpital")} est sur le plan de la ville. Une alerte prévient avant le malaise.</p>`;
}

// MARK: La carte d'un endroit (aussi depuis le guichet d'une adresse)

const choix = { lieu: "", plat: null, boisson: null, dessert: null, pourboire: false, vip: false, affaires: null, avec: null, devis: null, refus: null };

export async function ouvrirRepas(ctx, t, id) {
  const o = t?.options.find((x) => x.id === id);
  if (!o) return;
  if (o.id === "maison" && t.nourriture) return ouvrirCuisine(ctx, t);
  if (!o.plats) return ouvrirFormule(ctx, o);
  Object.assign(choix, { lieu: o.id, plat: null, boisson: null, dessert: null, pourboire: false, vip: false, affaires: null, avec: null, devis: null, refus: null });
  // Le premier plat de la carte (une spécialité d'ici quand il y en a une) est proposé d'avance.
  choix.plat = o.plats.find((p) => p.sorte === "plat")?.id ?? null;
  const convives = (t.nourriture?.convives ?? []).filter((c) => !c.lieu || c.lieu === o.id);
  const commande = () => {
    const c = { lieu: o.id };
    for (const k of ["plat", "boisson", "dessert", "affaires", "avec"]) if (choix[k]) c[k] = choix[k];
    if (choix.pourboire) c.pourboire = true;
    if (choix.vip) c.vip = true;
    return c;
  };
  const majDevis = async () => {
    const r = await ctx.jouer("repas.devis", { commande: commande() });
    choix.devis = r?.devis ?? null;
    choix.refus = r?.refus ?? null;
  };
  const groupe = (sorte, titre) => {
    const l = o.plats.filter((p) => p.sorte === sorte);
    if (!l.length) return "";
    return `<div class="section" style="margin-top:6px">${titre}</div>${carte(l.map((p) => `<button class="ligne plat ${choix[sorte] === p.id ? "choisi" : ""}" data-action="choisirPlat" data-id="${esc(p.id)}" data-sorte="${sorte}" aria-pressed="${choix[sorte] === p.id}">
        <span class="coche">${choix[sorte] === p.id ? "✓" : ""}</span>
        <span style="min-width:0;flex:1"><div class="titre">${esc(p.nom)}${p.local ? ` <span class="puce local">Spécialité</span>` : ""}</div>
          <div class="detail">${[p.detail ? esc(p.detail) : "", p.minutes ? `${p.minutes} min` : "", effet(p)].filter(Boolean).join(" · ")}</div></span>
        <span class="valeur">${montant(p.prix)}</span></button>`).join(""))}`;
  };
  const def = {
    titre: o.lieuNom === "Où que tu sois" ? o.nom : o.lieuNom,
    rendu: () => {
      const d = choix.devis;
      const options = [
        o.pourboire && o.file > 0 ? petit(choix.pourboire ? `Pourboire ${montant(o.pourboire)} : sans file` : `Passer la file (${o.file} min)`, "basculer", { plein: choix.pourboire, donnees: { k: "pourboire" } }) : "",
        o.vip ? petit(choix.vip ? `Table VIP · +${montant(o.vip)}` : "Table VIP", "basculer", { plein: choix.vip, donnees: { k: "vip" } }) : "",
        o.affaires ? petit(choix.affaires === "negociation" ? "Affaires : négociation" : "Dîner d'affaires : négociation", "affaires", { plein: choix.affaires === "negociation", donnees: { v: "negociation" } }) : "",
        o.affaires ? petit(choix.affaires === "recrutement" ? "Affaires : recrutement" : "Dîner d'affaires : recrutement", "affaires", { plein: choix.affaires === "recrutement", donnees: { v: "recrutement" } }) : "",
        ...convives.map((c) => petit(`Avec ${c.nom}`, "avec", { plein: choix.avec === c.id, donnees: { id: c.id } })),
      ].filter(Boolean);
      return `<div class="pile carte-repas">
        ${carte(`<div class="rangee" style="gap:12px"><span class="pastille" style="--c:${teinte(o.id)}">${sfRepas(o.icone)}</span>
          <div style="flex:1;min-width:0"><div class="libelle">${esc(o.nom)}</div><div class="aide">${esc(o.detail)}</div></div></div>`, { pad: true })}
        ${groupe("plat", o.id === "club" ? "L'entrée" : o.id === "bar" ? "À grignoter" : "Plats")}
        ${groupe("boisson", "Boissons")}
        ${groupe("dessert", "Desserts")}
        ${options.length ? `<div class="section" style="margin-top:6px">Avec qui, comment</div><div class="choix">${options.join("")}</div>` : ""}
        ${d ? carte(`${ligne({ titre: o.id === "livraison" ? "Livré dans" : "Servi dans", valeur: `${minutes(d.serviMinutes)}${d.file ? ` <span class="t3">dont ${d.file} min de file</span>` : ""}` })}
            ${ligne({ titre: "À table", valeur: minutes(d.mangerMinutes) })}
            ${ligne({ titre: "Ça cale", valeur: `+${Math.round(d.faim)}, en mangeant` })}
            ${d.routine ? `<p class="aide alerte repas-routine">${esc(d.routine)}</p>` : ""}
            ${ligne({ titre: "Plaisir", valeur: `+${Math.round(d.plaisir)}${d.humeur ? ` <span class="gain">+${Math.round(d.humeur)} d'humeur</span>` : ""}` })}
            ${d.pourDeux ? ligne({ titre: "Pour deux", detail: esc(d.avecTexte ?? ""), valeur: "×2" }) : ""}
            ${d.prixCash < d.prix ? ligne({ titre: "Payé en liquide", valeur: montant(d.prixCash), couleurValeur: "gain" }) : ""}`)
          : choix.refus ? `<p class="aide alerte" style="margin:0 4px">${esc(choix.refus)}</p>` : ""}
        ${bouton(d ? `Payer ${montant(d.prix + d.pourboire)}` : "Choisis à la carte", "payerRepas", { teinte: teinte(o.id), genre: "teinte", desactive: !d })}
        <p class="aide" style="text-align:center">Carte ou liquide : la fenêtre de paiement te le demande.${d?.pourboire ? ` Le pourboire, en liquide.` : ""}</p>
      </div>`;
    },
    actions: {
      async choisirPlat(c, el) {
        const k = el.dataset.sorte;
        choix[k] = choix[k] === el.dataset.id ? null : el.dataset.id;
        await majDevis(); ctx.feuille(def);
      },
      async basculer(c, el) { choix[el.dataset.k] = !choix[el.dataset.k]; await majDevis(); ctx.feuille(def); },
      async affaires(c, el) { choix.affaires = choix.affaires === el.dataset.v ? null : el.dataset.v; if (choix.affaires) choix.avec = null; await majDevis(); ctx.feuille(def); },
      async avec(c, el) { choix.avec = choix.avec === el.dataset.id ? null : el.dataset.id; if (choix.avec) choix.affaires = null; await majDevis(); ctx.feuille(def); },
      payerRepas: () => ctx.decider("portefeuille", { commander: { _0: commande() } }, { succes: o.id === "bar" || o.id === "club" ? "Bonne soirée" : "Bon appétit" }),
    },
  };
  await majDevis();
  ctx.feuille(def);
}

/** Une formule sans carte (ancienne balance) : le repas du bloc F. */
function ouvrirFormule(ctx, o) {
  let pourboire = false;
  const def = {
    titre: o.lieuNom === "Où que tu sois" ? o.nom : o.lieuNom,
    rendu: () => `<div class="pile">
      ${carte(`${ligne({ titre: "À table", valeur: minutes(o.minutes + (pourboire ? 0 : o.file)) })}${ligne({ titre: "Effet", valeur: esc(effet(o) || "aucun") })}`)}
      ${o.pourboire && o.file > 0 ? `<div class="choix">${petit(pourboire ? `Pourboire : ${montant(o.pourboire)}` : `Passer la file (${o.file} min)`, "basculer", { plein: pourboire })}</div>` : ""}
      ${bouton(`Payer ${montant(o.prix)}`, "payerRepas")}</div>`,
    actions: {
      basculer() { pourboire = !pourboire; ctx.feuille(def); },
      payerRepas: () => ctx.decider("portefeuille", { manger: { formule: o.id, pourboire, affaires: false } }, { succes: "Bon appétit" }),
    },
  };
  ctx.feuille(def);
}

// MARK: Chez soi : cuisiner, les courses

async function ouvrirCuisine(ctx, t) {
  if (await cuisineMaison(ctx, { onglet: "recettes" })) return; // RNT-189 : la cuisine maison (cuisine.js)
  const n = t.nourriture;
  if (!n) return;
  const ici = n.ici === "maison";
  ctx.feuille({
    titre: "Cuisiner",
    contenu: `<div class="pile">
      ${!ici ? bandeau(n.habite ? "Rentre chez toi pour cuisiner (Monde, « Dans la ville »)." : "Il te faut un logement, loué ou acheté, pour cuisiner.", "var(--texte2)") : ""}
      ${carte(n.recettes.map((r) => ligne({
        titre: esc(r.nom),
        detail: `${esc(r.ingredients)} · ${r.minutes} min · ${effet(r)}${r.manque.length ? `<br><span class="t3">Il manque : ${esc(r.manque.join(", ").toLowerCase())}</span>` : ""}`,
        icone: sfRepas("fork.knife"), teinte: TEINTE.maison, action: "cuire", donnees: { id: r.id }, desactive: !!r.manque.length || !ici,
      })).join(""))}
      <p class="aide">Cuisiner prend du temps et ne coûte rien de plus : les courses sont payées. Les portions qui périment le plus tôt partent d'abord.</p></div>`,
    actions: {
      cuire: (c, el) => ctx.decider("portefeuille", { cuisiner: { _0: el.dataset.id } }, { succes: "Bon appétit" }),
    },
  });
}

async function ouvrirCourses(ctx, t, livrer) {
  if (await cuisineMaison(ctx, { onglet: "courses", livrer })) return; // RNT-189 : les rayons (cuisine.js)
  const n = t.nourriture;
  if (!n) return;
  const panier = {};
  const prix = (x) => (livrer ? x.prixLivre : x.prix);
  const total = () => n.catalogue.reduce((s, x) => s + prix(x) * (panier[x.id] ?? 0), 0) + (livrer && Object.values(panier).some((q) => q > 0) ? n.fraisLivraison : 0);
  const ajout = (sorte) => n.catalogue.filter((x) => x.sorte === sorte).reduce((s, x) => s + (panier[x.id] ?? 0), 0);
  const def = {
    titre: livrer ? "Courses livrées" : n.epicerieFine ? "Épicerie fine" : "Supermarché",
    rendu: () => {
      const f = n.frais + ajout("frais"), s = n.sec + ajout("sec");
      const groupe = (sorte, titre) => `<div class="section" style="margin-top:6px">${titre}</div>${carte(n.catalogue.filter((x) => x.sorte === sorte).map((x) => `<div class="ligne">
          <span class="pastille" style="--c:${sorte === "frais" ? "#6FB7E9" : "#C9A15B"}">${sfRepas(x.icone)}</span>
          <span style="min-width:0;flex:1"><div class="titre">${esc(x.nom)}</div><div class="detail">${montant(prix(x))} la portion · ${esc(x.conservation)}${x.quantite ? ` · ${x.quantite} chez toi` : ""}</div></span>
          <span class="pas"><button class="rond" data-action="moins" data-id="${esc(x.id)}" aria-label="Une de moins" ${panier[x.id] ? "" : "disabled"}>−</button>
          <b class="chiffres">${panier[x.id] ?? 0}</b><button class="rond" data-action="plus" data-id="${esc(x.id)}" aria-label="Une de plus">+</button></span></div>`).join(""))}`;
      return `<div class="pile">
        <div class="frigo">
          <div><div class="rangee entre"><span class="aide">Frigo</span><span class="chiffres ${f > n.capaciteFrais ? "alerte" : ""}" style="font-size:13px">${f}/${n.capaciteFrais}</span></div>${rail(Math.min(1, f / n.capaciteFrais), f > n.capaciteFrais ? "var(--alerte)" : "#6FB7E9", 4)}</div>
          <div><div class="rangee entre"><span class="aide">Placard</span><span class="chiffres ${s > n.capaciteSec ? "alerte" : ""}" style="font-size:13px">${s}/${n.capaciteSec}</span></div>${rail(Math.min(1, s / n.capaciteSec), s > n.capaciteSec ? "var(--alerte)" : "#C9A15B", 4)}</div></div>
        ${groupe("frais", "Frais")}
        ${groupe("sec", "Sec")}
        ${livrer ? `<p class="aide">Livrées chez toi dans ${n.livraisonMinutes} min, ${montant(n.fraisLivraison)} de frais et un peu plus cher qu'en magasin.</p>` : n.epicerieFine ? `<p class="aide">Plus cher, mais ce que tu cuisines avec fait bien plus plaisir.</p>` : ""}
        ${bouton(total() ? `Payer ${montant(total())}` : "Ton panier est vide", "payerCourses", { desactive: !total() })}</div>`;
    },
    actions: {
      plus(c, el) { panier[el.dataset.id] = (panier[el.dataset.id] ?? 0) + 1; ctx.feuille(def); },
      moins(c, el) { panier[el.dataset.id] = Math.max(0, (panier[el.dataset.id] ?? 0) - 1); ctx.feuille(def); },
      payerCourses: () => {
        const articles = Object.fromEntries(Object.entries(panier).filter(([, q]) => q > 0));
        return ctx.decider("portefeuille", { faireCourses: { _0: { articles, ...(livrer ? { livrer: true } : {}) } } },
          { succes: livrer ? `Livrées dans ${n.livraisonMinutes} min` : "Courses au frigo" });
      },
    },
  };
  ctx.feuille(def);
}

// MARK: Inviter un joueur ou un bot

function ouvrirInvitation(ctx, t, id) {
  const p = t.nourriture?.invitables.find((x) => x.id === id);
  if (!p) return;
  let sorte = "ami", lieu = "brasserie";
  const lieux = t.options.filter((o) => o.lieu?.startsWith("s:"));
  // RNT-197 : avec le streaming, une soirée film chez toi (entre amis ou en tête-à-tête).
  if (t.nourriture?.soiree) lieux.push({ id: "soiree", nom: "Soirée film chez toi", affaires: false, soiree: true });
  const def = {
    titre: `Inviter ${p.pseudo}`,
    rendu: () => `<div class="pile">
      <div class="section" style="margin-top:0">Pour quoi</div>
      <div class="choix">${Object.entries(SORTES).map(([k, v]) => petit(v[0].toUpperCase() + v.slice(1), "sorte", { plein: sorte === k, donnees: { v: k } })).join("")}</div>
      <div class="section">Où</div>
      <div class="choix">${lieux.map((o) => petit(o.nom, "lieu", { plein: lieu === o.id, donnees: { v: o.id }, desactive: sorte === "affaires" && !o.affaires })).join("")}</div>
      <p class="aide">${p.bot ? "Un bot répond selon son caractère, dans les deux heures." : "Il reçoit ton invitation et répond quand il veut (six heures)."} ${lieu === "soiree" ? "Chez toi, rien à payer : lance la soirée une fois qu'il a dit oui." : "Tu paies pour deux, sur place."}</p>
      ${bouton("Inviter", "envoyer")}</div>`,
    actions: {
      sorte(c, el) { sorte = el.dataset.v; if (sorte === "affaires" && !lieux.find((o) => o.id === lieu)?.affaires) lieu = "brasserie"; ctx.feuille(def); },
      lieu(c, el) { lieu = el.dataset.v; ctx.feuille(def); },
      envoyer: () => ctx.decider("portefeuille", { inviterRepas: { vers: p.id, sorte, lieu } }, { succes: `Invitation envoyée à ${p.pseudo}` }),
    },
  };
  ctx.feuille(def);
}

/** Le guichet d'une adresse (« s:… ») ou du domicile, dans Monde › Dans la ville. */
export function guichetRepas(lieu, t) {
  if (!t) return "";
  const ici = t.options.filter((o) => o.lieu === lieu);
  if (!ici.length) return "";
  const lignes = ici.map((o) => ligneOption(o, { plan: false })).join("");
  return `<div><div class="section" style="margin-top:4px">${lieu === "domicile" ? "Chez toi" : "Sur place"}</div>${t.aTable ? aTable(t) : ""}${carte(lignes)}
    <p class="aide" style="margin:8px 4px 0">${t.pointe && ici.some((o) => o.file) ? "Heure de pointe : la file attend. Un pourboire en liquide fait passer devant." : `Faim ${t.faim} %, ${esc(t.etatFaim.toLowerCase())}.`}</p></div>`;
}

// MARK: Coffres (portefeuille)

/** Le coffre de la maison ou de l'agence, avec ce qu'on peut y faire d'ici. */
export function guichetCoffre(pf, { agence = false } = {}) {
  if (!pf) return "";
  const c = agence ? pf.coffreBanque : pf.coffre;
  let lignes = "";
  if (c) {
    lignes += ligne({ titre: esc(c.nom), detail: `${montant(c.total)} sur ${montant(c.capacite)}${c.sale ? `, dont ${montant(c.sale)} d'argent sale` : ""}`,
      icone: sfRepas("coffre"), teinte: "#C9A15B" });
    if (c.ici) {
      lignes += ligne({ titre: "Déposer", detail: `${montant(pf.poche)} en poche`, action: "coffre", donnees: { sens: "deposer", agence: agence ? "1" : "" }, desactive: pf.poche <= 0 });
      lignes += ligne({ titre: "Retirer", detail: pf.place != null ? `Encore ${montant(pf.place)} possibles en poche` : "", action: "coffre", donnees: { sens: "retirer", agence: agence ? "1" : "" }, desactive: c.total <= 0 });
      if (agence) lignes += ligne({ titre: "Rendre le coffre", detail: c.total ? "Vide-le d'abord" : "Plus de loyer", action: "rendreCoffre", desactive: c.total > 0 });
    }
  } else if (agence && pf.aLAgence) {
    lignes += ligne({ titre: "Louer un coffre", detail: `${montant(pf.loyerCoffreBanque)} par semaine, à vider sur place`, icone: sfRepas("coffre"), teinte: "#C9A15B", action: "louerCoffre" });
  } else if (!agence) {
    lignes += ligne({ titre: "Installer un coffre", detail: pf.habite ? "Petit, ignifugé ou chambre forte" : "Il te faut un logement", icone: sfRepas("coffre"), teinte: "#C9A15B", action: "acheterCoffre", desactive: !pf.habite });
  }
  if (!lignes) return "";
  return `<div><div class="section" style="margin-top:4px">${agence ? "Coffre à l'agence" : "Coffre-fort"}</div>${carte(lignes)}
    <p class="aide" style="margin:8px 4px 0">Au coffre, le liquide ne compte ni dans le plafond en poche ni pour les pickpockets.</p></div>`;
}

/** Déposer ou retirer : un montant, borné par la poche (ou le plafond) et le coffre. */
export function ouvrirCoffre(ctx, pf, sens, agence) {
  const c = agence ? pf.coffreBanque : pf.coffre;
  if (!c) return;
  const maximum = sens === "deposer" ? Math.min(pf.poche, c.capacite - c.total) : Math.min(c.total, pf.place ?? c.total);
  const op = agence ? (sens === "deposer" ? "deposerCoffreBanque" : "retirerCoffreBanque") : (sens === "deposer" ? "deposerCoffre" : "retirerCoffre");
  ctx.feuille({
    titre: sens === "deposer" ? "Déposer au coffre" : "Retirer du coffre",
    contenu: `<div class="pile">
      ${champEuros("montant-coffre", { etiquette: `Au plus ${montant(Math.max(0, maximum))}` })}
      ${sens === "deposer" && pf.argentSale > 0 ? `<p class="aide">L'argent sale part au coffre en premier.</p>` : ""}
      <div class="choix">${petit("Tout", "coffreTout")}</div>
      ${bouton(sens === "deposer" ? "Déposer" : "Retirer", "coffreValider")}</div>`,
    actions: {
      coffreTout() { const el = document.getElementById("montant-coffre"); if (el) el.value = (Math.max(0, maximum) / 100).toFixed(2).replace(".", ",").replace(/,00$/, ""); },
      async coffreValider() {
        const m = lireEuros("montant-coffre");
        if (!(m > 0)) return ctx.toast("Indique un montant.", "refus");
        await ctx.decider("portefeuille", { [op]: { _0: m } }, { succes: sens === "deposer" ? `${montant(m)} au coffre` : `${montant(m)} en poche` });
      },
    },
  });
}

/** Le catalogue des coffres pour la maison. */
export function ouvrirAchatCoffre(ctx, pf) {
  ctx.feuille({
    titre: "Un coffre chez toi",
    contenu: `<div class="pile">
      ${carte(pf.coffres.map((m) => ligne({
        titre: esc(m.nom), detail: `${esc(m.detail)} · jusqu'à ${montant(m.capacite)} · ${Math.round(m.risque * 1000) / 10} % de cambriolage par semaine${m.refus ? `<br><span class="t3">${esc(m.refus)}</span>` : ""}`,
        valeur: `${montant(m.prix)}<div class="detail" style="text-align:right">${montant(m.prixCash)} cash</div>`,
        icone: sfRepas("coffre"), teinte: "#C9A15B", action: "acheterModele", donnees: { id: m.id }, desactive: !!m.refus,
      })).join(""))}
      <p class="aide">Posé par un artisan : payé en liquide, c'est moins cher. On y dépose et on retire chez toi.</p></div>`,
    actions: {
      acheterModele: (_c, el) => ctx.decider("portefeuille", { acheterCoffre: { _0: el.dataset.id } }, { succes: "Coffre installé chez toi" }),
    },
  });
}

/** Le portefeuille expliqué (Banque › Portefeuille) : plafond, avantages, limites, coffres. */
export function panneauPortefeuille(pf) {
  if (!pf) return `<p class="aide">Le liquide ne rapporte rien et n'apparaît sur aucun relevé.</p>`;
  const part = pf.plafond ? pf.poche / pf.plafond : 0;
  return `
    <div class="rangee entre" style="align-items:baseline"><span style="font-size:13px;font-weight:600;color:var(--texte2)">En poche</span>
      <span class="chiffres" style="font-size:13px">${montant(pf.poche)} sur ${montant(pf.plafond ?? 0)}</span></div>
    ${rail(part, part >= 0.9 ? "var(--alerte)" : "#C9A15B", 6)}
    ${pf.argentSale ? `<p class="aide">Dont ${montant(pf.argentSale)} d'argent sale.</p>` : ""}
    ${pf.carteGelee ? bandeau("Ta carte est gelée : le liquide paie quand même.", "var(--argent)") : ""}
    <div class="palier">
      <div style="font-size:13px;font-weight:600;color:var(--texte2)">Avantages</div>
      ${pf.avantages.map((a) => `<div class="avantage"><span style="color:var(--gain)">+</span><span>${esc(a)}</span></div>`).join("")}
      ${pf.remises.length ? `<div class="aide" style="margin-top:4px">${pf.remises.map((r) => `${esc(r.nom)} : −${Math.round(r.part * 100)} %`).join(" · ")}</div>` : ""}
      <div style="font-size:13px;font-weight:600;color:var(--texte2);margin-top:8px">Limites</div>
      ${pf.limites.map((a) => `<div class="avantage"><span style="color:var(--perte)">−</span><span>${esc(a)}</span></div>`).join("")}
      ${pf.seuilDepot != null ? `<div class="aide" style="margin-top:4px">Déposé cette semaine : ${montant(pf.depotsSemaine)} ; sans soupçon jusqu'à ${montant(pf.seuilDepot)}.</div>` : ""}
    </div>
    ${guichetCoffre(pf)}
    ${pf.coffreBanque || pf.aLAgence ? guichetCoffre(pf, { agence: true }) : `<p class="aide">Un coffre se loue aussi à l'agence bancaire, à vider sur place.</p>`}`;
}

/** Les actions des coffres, à brancher dans une page qui a `d.pf`. */
export const actionsCoffre = {
  coffre: (ctx, el, d) => ouvrirCoffre(ctx, d.pf, el.dataset.sens, !!el.dataset.agence),
  acheterCoffre: (ctx, el, d) => ouvrirAchatCoffre(ctx, d.pf),
  louerCoffre: (ctx) => ctx.decider("portefeuille", { louerCoffreBanque: {} }, { succes: "Coffre loué à l'agence" }),
  rendreCoffre: (ctx) => ctx.decider("portefeuille", { rendreCoffreBanque: {} }, { succes: "Coffre rendu" }),
};
