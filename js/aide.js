// ══════════════════════════════════════════════════════════════════════
//  Le « ? » de chaque onglet (BoutonAide, FeuilleAide de Tutoriels.swift).
//
//  Le rond « ? » est la brique `boutonAide(sujet)` de ui.js (lot A) ; ce
//  module pose `aideContextuelle.ouvrir` : toucher le rond ouvre la feuille
//  des fiches, à faire défiler une par une (Suivant, Compris), avec les
//  démos « Essaie » et le lien vers tout le chapitre du guide. Chargé par
//  app.js au démarrage ; ses styles (css/pages/aide.css) à la première
//  ouverture.
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "./format.js";
import { SUJETS, TRAITS } from "./aide-donnees.js";
import { vibrer } from "./sons.js";
import { aideContextuelle } from "./ui.js";
import { poserStyles } from "./pages/index.js";

const trait = (nom, t = 24) => `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAITS[nom] ?? TRAITS["list.bullet"]}</svg>`;

// Lot A : le « ? » de ui.js ouvre ces fiches ; son libellé dit le sujet (« Comment ça marche : l'accueil »).
aideContextuelle.ouvrir = (ctx, sujet) => ouvrirAide(ctx, sujet);
aideContextuelle.titre = (sujet) => SUJETS[sujet]?.titre.toLowerCase();

// MARK: La feuille

let regles = null; // { marches, banque } : les règles des démos, lues une fois

/** Ouvre la feuille d'un sujet ; `page` : la fiche où commencer. */
export async function ouvrirAide(ctx, sujet, { page = 0 } = {}) {
  const s = SUJETS[sujet];
  if (!s) return ctx.ouvrir("guide", {});
  vibrer();
  await poserStyles(["aide"]);
  // `contenu` (et non `rendu`) : la feuille n'est pas redessinée par les rafraîchissements de la page,
  // la fiche ouverte et les démos gardent leur état.
  ctx.feuille({
    titre: s.titre,
    contenu: `<div class="ad-feuille" data-sujet="${esc(sujet)}">
      <div class="ad-fiches" id="ad-fiches" tabindex="0" aria-label="Fiches, à faire défiler">
        ${s.fiches.map((f, i) => fiche(f, i, s.fiches.length)).join("")}
      </div>
      <div class="ad-points" role="tablist" aria-label="Fiches">${s.fiches.map((f, i) =>
        `<button role="tab" data-action="aideAller" data-rang="${i}" aria-label="${esc(f.titre)}" aria-selected="${i === page}"></button>`).join("")}</div>
      <button class="bouton" data-action="aideSuivant" id="ad-suivant">${s.fiches.length > 1 ? "Suivant" : "Compris"}</button>
      <button class="ad-guide" data-action="aideGuide" data-chapitre="${esc(s.chapitre)}">Tout le chapitre dans le guide</button>
    </div>`,
    actions: {
      aideSuivant() {
        const r = rangCourant();
        if (r < s.fiches.length - 1) aller(r + 1);
        else ctx.fermerFeuille();
      },
      aideAller: (c, b) => aller(Number(b.dataset.rang)),
      aideGuide(c, b) {
        ctx.fermerFeuille();
        ctx.ouvrir("guideChapitre", { id: b.dataset.chapitre });
      },
      demoSens: (c, b) => majDemo(b.closest(".ad-demo"), { sens: Number(b.dataset.valeur) }),
      demoLevier: (c, b) => majDemo(b.closest(".ad-demo"), { levier: Number(b.dataset.valeur) }),
    },
  });
  const liste = document.getElementById("ad-fiches");
  if (!liste) return;
  let attente = 0;
  liste.addEventListener("scroll", () => { cancelAnimationFrame(attente); attente = requestAnimationFrame(() => majPoints(s)); }, { passive: true });
  liste.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); aller(Math.min(s.fiches.length - 1, rangCourant() + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); aller(Math.max(0, rangCourant() - 1)); }
  });
  // Les démos se règlent au curseur : chaque mouvement se lit tout de suite.
  liste.addEventListener("input", (e) => { const d = e.target.closest(".ad-demo"); if (d) majDemo(d, {}); });
  if (page) aller(page, false);
  majPoints(s);
  if (s.fiches.some((f) => f.demo)) chargerDemos(ctx);
}

function fiche(f, i, n) {
  return `<article class="ad-fiche" aria-roledescription="fiche" aria-label="${i + 1} sur ${n} : ${esc(f.titre)}">
    <span class="ad-symbole">${trait(f.symbole, 26)}</span>
    <h3>${esc(f.titre)}</h3>
    <p class="ad-texte">${esc(f.texte)}</p>
    ${f.exemple ? `<div class="ad-exemple"><span class="ad-ampoule">${trait("lightbulb", 18)}</span><span>${esc(f.exemple)}</span></div>` : ""}
    ${f.demo ? `<div class="ad-demo" data-sorte="${f.demo.sorte}" data-sens="${f.demo.sens ?? 1}" data-levier="${f.demo.levier ?? 1}">
      <div class="ad-essaie">${trait("essaie", 16)}Essaie</div><div class="ad-demo-corps"><div class="squelette ad-squelette"></div></div></div>` : ""}
  </article>`;
}

const fiches = () => [...(document.getElementById("ad-fiches")?.children ?? [])];
function rangCourant() {
  const l = document.getElementById("ad-fiches");
  if (!l || !l.clientWidth) return 0;
  return Math.round(l.scrollLeft / l.clientWidth);
}
function aller(rang, doux = true) {
  const l = document.getElementById("ad-fiches");
  const f = fiches()[rang];
  if (!l || !f) return;
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
  l.scrollTo({ left: rang * l.clientWidth, behavior: doux && !reduit ? "smooth" : "auto" });
  vibrer();
}
function majPoints(s) {
  const r = rangCourant();
  document.querySelectorAll(".ad-points button").forEach((b, i) => b.setAttribute("aria-selected", String(i === r)));
  const b = document.getElementById("ad-suivant");
  if (b) b.textContent = r < s.fiches.length - 1 ? "Suivant" : "Compris";
}

// MARK: Les démos (DemoPosition, DemoEpargne), avec les vraies règles

async function chargerDemos(ctx) {
  if (!regles) {
    try {
      const [marches, banque] = await Promise.all([ctx.balance("marches"), ctx.balance("banque")]);
      regles = { marches, banque };
    } catch { regles = null; }
  }
  document.querySelectorAll(".ad-demo").forEach((d) => {
    if (!regles) { d.querySelector(".ad-demo-corps").innerHTML = `<p class="aide">La démo n'a pas pu se préparer.</p>`; return; }
    d.querySelector(".ad-demo-corps").innerHTML = d.dataset.sorte === "epargne" ? corpsEpargne() : corpsPosition(d);
    majDemo(d, {});
  });
}

const pct = (x, signe = true) => `${signe && x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(Math.round(x * 100))} %`;

function corpsPosition(d) {
  const r = regles.marches;
  const sens = Number(d.dataset.sens), levier = Number(d.dataset.levier);
  const seg = (action, options, choisie) => `<div class="segment ad-segment" role="group">${options.map(([v, t]) =>
    `<button data-action="${action}" data-valeur="${v}" aria-pressed="${v === choisie}">${t}</button>`).join("")}</div>`;
  return `${seg("demoSens", [[1, "Achat"], [-1, "Vente à découvert"]], sens)}
    ${seg("demoLevier", (r.leviers ?? [1, 2, 3, 5]).map((l) => [l, `×${l}`]), levier)}
    <label class="ad-ligne"><span class="aide">Le cours bouge de</span><b class="chiffres ad-variation">0 %</b></label>
    <input class="ad-curseur" type="range" min="-30" max="30" step="1" value="0" aria-label="Mouvement du cours">
    <div class="ad-jauge" aria-hidden="true"><i class="ad-appel"></i><i class="ad-liquidation"></i><i class="ad-valeur"></i><i class="ad-mise"></i></div>
    <div class="ad-legende" aria-hidden="true"><span class="ad-l-liq"><i></i>liquidation</span><span class="ad-l-appel"><i></i>appel de marge</span><span><i class="ad-l-mise"></i>ta mise</span></div>
    <div class="ad-ligne"><span class="aide">Ta mise de ${montant(100_000)} vaut</span><b class="chiffres ad-resultat">${montant(100_000)}</b></div>
    <p class="ad-verdict"></p>`;
}

function corpsEpargne() {
  const b = regles.banque.etablissements[0];
  return `<label class="ad-ligne"><span class="aide">Sur ton livret ${esc(b.nom)}</span><b class="chiffres ad-solde">${montant(500_000)}</b></label>
    <input class="ad-curseur" type="range" min="0" max="50000" step="500" value="5000" aria-label="Solde du livret">
    <div class="ad-ligne"><span class="aide">Chaque soir</span><b class="chiffres gain ad-interets"></b></div>
    <p class="aide">Taux de ${(b.tauxEpargneAnnuel * 100).toLocaleString("fr-BE", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} % par an. Les autres banques paient plus ou moins.</p>`;
}

/** SimulationPosition (TableauMarches.swift), ligne pour ligne. */
export function simulerPosition(mise, sens, levier, variation, r) {
  const lev = Math.max(1, levier), s = sens;
  const v = mise * (1 + s * lev * variation);
  const risquee = levier > 1 || sens < 0;
  const ratio = mise > 0 ? v / mise : 1;
  let valeur = Math.round(Math.max(0, v));
  if (risquee && ratio <= r.seuilLiquidation) valeur = 0;
  return {
    valeur, ratio,
    variationAppel: risquee ? -s * (1 - r.seuilAppelMarge) / lev : null,
    variationLiquidation: risquee ? -s * (1 - r.seuilLiquidation) / lev : null,
    etat: !risquee ? "sain" : ratio <= r.seuilLiquidation ? "liquidee" : ratio <= r.seuilAppelMarge ? "appelDeMarge" : "sain",
  };
}

function majDemo(d, change) {
  if (!d || !regles) return;
  if (change.sens != null) d.dataset.sens = change.sens;
  if (change.levier != null) d.dataset.levier = change.levier;
  d.querySelectorAll("[data-action=demoSens]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.valeur) === Number(d.dataset.sens))));
  d.querySelectorAll("[data-action=demoLevier]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.valeur) === Number(d.dataset.levier))));
  const curseur = d.querySelector(".ad-curseur");
  if (d.dataset.sorte === "epargne") {
    const b = regles.banque;
    const solde = Number(curseur.value) * 100;
    // RNT-272 : ReglesBanque.interetsJour, le septième d'une semaine, versé chaque soir.
    const soir = Math.round(Math.max(0, solde) * b.etablissements[0].tauxEpargneAnnuel * (b.facteurEpargne ?? 1) / b.semainesParAn / 7);
    d.querySelector(".ad-solde").textContent = montant(solde);
    d.querySelector(".ad-interets").textContent = `+${montant(soir, { centimes: true })}`;
    return;
  }
  const r = regles.marches;
  const variation = Number(curseur.value) / 100;
  const sim = simulerPosition(100_000, Number(d.dataset.sens), Number(d.dataset.levier), variation, r);
  const x = (k) => `${(Math.min(2, Math.max(0, k)) / 2) * 100}%`;
  const v = d.querySelector(".ad-variation");
  v.textContent = pct(variation);
  v.className = `chiffres ad-variation ${variation >= 0 ? "gain" : "perte"}`;
  const risque = sim.variationAppel != null;
  d.style.setProperty("--appel", risque ? x(r.seuilAppelMarge) : "0%");
  d.style.setProperty("--liquidation", risque ? x(r.seuilLiquidation) : "0%");
  d.style.setProperty("--valeur", `max(6px, ${x(sim.valeur / 100_000)})`);
  d.dataset.etat = sim.etat;
  d.dataset.gagne = String(sim.ratio >= 1);
  d.querySelector(".ad-legende").classList.toggle("sans-risque", !risque);
  d.querySelector(".ad-resultat").textContent = montant(sim.valeur);
  d.querySelector(".ad-verdict").textContent = sim.etat === "liquidee" ? "Liquidée : la position est fermée d'office, la mise est perdue."
    : sim.etat === "appelDeMarge" ? "Appel de marge : remets de l'argent ou coupe avant la liquidation."
    : !risque ? "Sans levier, tu ne perds jamais plus que ta mise : pas d'appel de marge."
    : `Appel de marge si le cours fait ${pct(sim.variationAppel)}, liquidation à ${pct(sim.variationLiquidation)}.`;
  if (sim.etat !== d.dataset.etatAvant && sim.etat !== "sain") vibrer(20);
  d.dataset.etatAvant = sim.etat;
}
