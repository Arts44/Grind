// ══════════════════════════════════════════════════════════════════════
//  La salle des ventes unique (RNT-221) — EcranEncheres.swift, écran pour
//  écran :
//    encheres  ← EcranEncheres   (toutes les familles, un filtre, « Mes
//                                 ventes », « Mes mises », en cours, à
//                                 venir, terminées ; la photo de l'actif)
//    la feuille d'une vente ← FeuilleEnchere (la mise EXACTE ; en option,
//                                 « Enchérir pour moi jusqu'à »)
//
//  Le moteur rend le tableau « encheres » (TableauEncheres), le même que
//  l'iPhone. RNT-248 : une seule entrée, la ligne en tête d'Actifs (plus de
//  lignes « Enchères » dans les familles) ; « on t'a dépassé » et la fiche d'un
//  actif en vente l'ouvrent sur la vente (p.vente). p.famille reste pour les essais.
// ══════════════════════════════════════════════════════════════════════
import { montant, pourcent, esc } from "../format.js";
import { carte, entetePousse, pilules, bouton, petit, interrupteur, ligneValeur } from "../ui.js";
import { chargerPhotos } from "./catalogues.js";
import { facade, etatDe, ico } from "./immobilier.js";
import { vitrine } from "./vehicules.js";
import { vitrineMontre } from "./montres.js";

// MARK: - La photo de l'actif

/** VignetteVente : la photo de la fiche (bien, véhicule), le dessin d'une montre, un symbole sinon. */
function vignette(v, hauteur, largeur = "") {
  if (v.apparence) return vitrineMontre(v.apparence, { hauteur, largeur });
  if (v.photoSorte === "vehicule") return vitrine({ forme: v.silhouette ?? "sportive", teinte: v.teinte ?? "#8A8F98", rarete: v.rarete, hauteur, largeur, photo: v.photo ?? "" });
  if (v.photoSorte === "bien") return facade({ icone: v.icone, rarete: v.rarete, hauteur, largeur, photo: v.photo ?? "" });
  return `<span class="ec-symbole" aria-hidden="true">${ico.marteau}</span>`;
}

// MARK: - Le temps

const fr = (ms, o) => new Date(ms).toLocaleString("fr-BE", o);
/** « 2 h 05 », « 4:12 », « ouvre mardi 14:00 », « Adjugée ». */
function temps(v, m) {
  if (m < v.debut) return `Ouvre ${fr(v.debut, { weekday: "long", hour: "2-digit", minute: "2-digit" })}`;
  if (v.terminee || m >= v.fin) return v.invendue ? "Invendue" : "Adjugée";
  const s = Math.max(0, Math.floor((v.fin - m) / 1000));
  return s >= 3600 ? `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
const horloge = (v, m) => `<span class="ec-temps chiffres" data-debut="${v.debut}" data-fin="${v.fin}" data-terminee="${v.terminee}" data-invendue="${v.invendue}">${esc(temps(v, m))}</span>`;

// MARK: - La salle

function ligneVente(v, m) {
  const statut = v.maMise != null && !v.aMoi
    ? `<div class="ec-statut ${v.meneurToi ? "gain" : "perte"}">${v.meneurToi ? `Tu mènes : ${montant(v.maMise)}` : `Dépassé : ta mise ${montant(v.maMise)}`}</div>` : "";
  return `<button class="ec-ligne" data-action="vente" data-id="${esc(v.id)}" data-cle="${esc(v.id)}">
    <span class="ec-vignette">${vignette(v, 52, 52)}</span>
    <span class="ec-corps"><span class="ec-nom">${esc(v.nom)}</span>
      <span class="ec-detail">${esc(v.lieu ? `${v.natureTexte}, ${v.lieu}` : v.natureTexte)}</span>${statut}</span>
    <span class="ec-droite"><span class="ec-prix chiffres">${montant(v.prix)}</span>${horloge(v, m)}</span>
  </button>`;
}

function sectionVentes(titre, l, m, vide = "") {
  if (!l.length && !vide) return "";
  return `<section class="ec-section"><h2 class="ec-titre">${esc(titre)}</h2>
    ${carte(l.length ? l.map((v) => ligneVente(v, m)).join(`<div class="filet"></div>`) : `<p class="aide ec-vide">${esc(vide)}</p>`)}</section>`;
}

function rendreSalle(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Salle des ventes")}<p class="aide">La salle des ventes s'ouvre avec ta première saison.</p>`;
  const e = etatDe(p, "encheres", { famille: p?.famille ?? "" });
  const m = ctx.maintenant();
  const garde = (l) => l.filter((v) => !e.famille || v.famille === e.famille);
  const options = [["", "Tout"], ...t.familles.map((f) => [f.id, f.nombre ? `${f.nom} ${f.nombre}` : f.nom])];
  return `${entetePousse("Salle des ventes")}
  <div class="ec-page">
    ${pilules(options, e.famille, "familleVentes")}
    <p class="aide">Tape ta mise : c'est elle qui compte, au centime. Coche « Enchérir pour moi » pour monter d'un pas au-dessus des autres, jusqu'au plafond que tu fixes.</p>
    ${sectionVentes("Mes ventes", garde(t.mesVentes), m)}
    ${sectionVentes("Mes mises", garde(t.mesMises), m)}
    ${sectionVentes("En cours", garde(t.enCours), m, "Aucune vente en ce moment.")}
    ${sectionVentes("À venir", garde(t.aVenir), m, "Rien de prévu d'ici la fin de la semaine.")}
    ${sectionVentes("Terminées", garde(t.terminees), m)}
  </div>`;
}

// MARK: - La feuille d'une vente

/** L'état de la feuille ouverte (une à la fois) : la vente relue, la mise et le plafond saisis. */
const F = { id: null, v: null, mise: 0, plafond: 0, auto: false, touche: false, enCours: false, message: null, restes: null };

const euros = (c) => String(Math.round((c ?? 0) / 100));
const lireEuros = (texte) => {
  const t = String(texte ?? "").replace(/\s|€/g, "").replace(",", ".");
  const v = Math.round(Number(t) * 100);
  return t && Number.isFinite(v) && v > 0 ? v : 0;
};

/** Le minimum suit le prix ; une mise tapée à la main n'est relevée que si elle passe dessous. */
function suivreMinimum() {
  const v = F.v;
  if (!v) return;
  if (!F.touche || F.mise < v.miseMinimum) { F.mise = v.miseMinimum; F.touche = false; }
  if (F.plafond <= F.mise) F.plafond = F.mise + v.pas * 5;
}

function detailRestes(r) {
  if (!r) return "";
  return `${carte([
    ligneValeur("Métier", `${esc(r.metier)}, ${esc(r.ville)}`),
    ligneValeur("Matériel", `${montant(r.materiel)}${r.machines > 0 ? `, ${r.machines} machine${r.machines > 1 ? "s" : ""}` : ""}`),
    ligneValeur("Local", esc(r.local)),
    ligneValeur("À l'adjudication, en plus", `${montant(r.roulement)} de salaires`),
    r.coutNeuf != null ? ligneValeur("La même, neuve", montant(r.coutNeuf)) : "",
    r.dette != null ? ligneValeur("Ses dettes", montant(r.dette)) : "",
  ].filter(Boolean).join(`<div class="filet"></div>`))}
  <p class="aide">${r.dette == null ? `Gagner ces restes rouvre ${esc(r.nom)} : même métier, même ville, son matériel et sa clientèle, avec une équipe neuve.`
    : "Les restes de ta boîte. La vente rembourse d'abord ses dettes ; le reste éventuel te revient. Tu peux aussi miser pour la reprendre."}</p>`;
}

function panneauMise(v) {
  const etatMise = v.maMise != null
    ? `<div class="ec-ma-mise"><span class="${v.meneurToi ? "gain" : "perte"}">${v.meneurToi ? "Tu mènes" : "On t'a dépassé"}</span>
        <span class="chiffres">Ta mise : ${montant(v.maMise)}${v.monPlafond != null ? `, plafond : ${montant(v.monPlafond)}` : ""}</span></div>` : "";
  const pret = F.mise >= v.miseMinimum && (!F.auto || F.plafond > F.mise);
  return carte(`${etatMise}
    <label class="ec-libelle" for="ec-mise">Ta mise</label>
    <div class="ec-champ"><input id="ec-mise" class="chiffres" inputmode="decimal" autocomplete="off" data-saisie="saisieMise" value="${euros(F.mise)}" aria-label="Ta mise en euros"><span>€</span></div>
    <div class="ec-pas">${[1, 5, 10].map((k) => petit(`+${montant(v.pas * k)}`, "pasMise", { donnees: { k } })).join("")}${petit("Minimum", "miseMinimum")}</div>
    ${interrupteur({ titre: "Enchérir pour moi", detail: "Si on te dépasse, ta mise monte d'un pas au-dessus, jamais plus, jusqu'à ton plafond.", actif: F.auto, action: "autoMise" })}
    ${F.auto ? `<label class="ec-libelle" for="ec-plafond">Plafond</label>
      <div class="ec-champ"><input id="ec-plafond" class="chiffres" inputmode="decimal" autocomplete="off" data-saisie="saisiePlafond" value="${euros(F.plafond)}" aria-label="Plafond en euros"><span>€</span></div>` : ""}
    <div class="ec-resume"><div><span>Ta mise</span><b class="chiffres">${montant(F.mise)}</b></div>
      ${F.auto ? `<div><span>Plafond</span><b class="chiffres">${montant(F.plafond)}</b></div>` : ""}</div>
    <p class="aide">Au moins ${montant(v.miseMinimum)}. Il faut l'avoir sur une de tes cartes ou en liquide ; tu ne paies que si tu gagnes.</p>
    ${bouton(F.enCours ? "Envoi…" : `Miser ${montant(F.mise)}`, "miserVente", { desactive: F.enCours || !pret })}`, { classe: "ec-mise" });
}

function rendreFeuille(ctx) {
  const v = F.v;
  if (!v) return `<p class="aide">Cette vente n'est plus en salle.</p>`;
  const m = ctx.maintenant();
  const enTete = v.terminee ? (v.invendue ? "Invendue" : "Adjugée à") : v.invendue ? "Mise à prix" : "Prix actuel";
  const qui = v.terminee ? esc(v.meneur) : v.invendue ? `Personne n'a encore misé, ${horloge(v, m)}` : `${esc(v.meneur)} mène, ${horloge(v, m)}`;
  let bas = "";
  if (v.aMoi) {
    bas = `${v.retirable ? petit(F.enCours ? "Retrait…" : "Retirer la vente", "retirerVente", { desactive: F.enCours }) : ""}
      <p class="aide">Ta vente court jusqu'à la fin. Au-dessus de ton prix de réserve (la mise à prix), l'actif part au meilleur enchérisseur, frais de la maison déduits.</p>`;
  } else if (v.ouverte) bas = panneauMise(v);
  else if (m < v.debut) bas = `<p class="aide">La vente ouvre ${esc(fr(v.debut, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}. Reviens à ce moment-là pour miser.</p>`;
  return `<div class="ec-feuille">
    <div class="ec-photo">${vignette(v, 190)}</div>
    <div><div class="aide">${esc(v.lieu ? `${v.natureTexte}, ${v.lieu}` : v.natureTexte)}</div><div class="ec-nom-grand">${esc(v.nom)}</div></div>
    <div class="ec-heros"><div class="aide">${enTete}</div><div class="ec-prix-grand chiffres">${montant(v.prix)}</div>
      <div class="ec-qui ${v.meneurToi ? "gain" : ""}">${qui}</div></div>
    ${carte([
      ligneValeur("Estimation", montant(v.estimation)),
      ligneValeur("Mise à prix", montant(v.miseAPrix)),
      ligneValeur("Pas minimum", montant(v.pas)),
      ligneValeur("État", v.etat != null ? pourcent(v.etat) : "inconnu : on achète sans visiter"),
    ].join(`<div class="filet"></div>`))}
    ${v.nature === "restes" ? detailRestes(F.restes) : ""}
    ${bas}
    ${F.message ? `<p class="ec-message ${F.message[1] ? "gain" : "perte"}">${esc(F.message[0])}</p>` : ""}
  </div>`;
}

async function relireVente(ctx) {
  if (!F.id) return;
  F.v = await ctx.tableau("venteEnchere", { id: F.id });
  suivreMinimum();
}

async function ouvrirVente(ctx, id) {
  Object.assign(F, { id, v: null, mise: 0, plafond: 0, auto: false, touche: false, enCours: false, message: null, restes: null });
  await relireVente(ctx);
  if (!F.v) return ctx.toast("Cette vente n'est plus en salle.", "info");
  if (F.v.nature === "restes") F.restes = await ctx.tableau("restes", { id });
  const majChamp = (id, c) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = euros(c); };
  ctx.feuille({
    titre: "Enchère",
    rendu: () => rendreFeuille(ctx),
    actions: {
      saisieMise(c, el) { F.mise = lireEuros(el.value); F.touche = true; ctx.redessiner(); },
      saisiePlafond(c, el) { F.plafond = lireEuros(el.value); ctx.redessiner(); },
      pasMise(c, b) { F.mise += F.v.pas * Number(b.dataset.k); F.touche = true; majChamp("ec-mise", F.mise); ctx.redessiner(); },
      miseMinimum() { F.mise = F.v.miseMinimum; F.touche = false; majChamp("ec-mise", F.mise); ctx.redessiner(); },
      autoMise() { F.auto = !F.auto; if (F.plafond <= F.mise) F.plafond = F.mise + F.v.pas * 5; ctx.redessiner(); },
      async miserVente() {
        if (F.enCours) return;
        F.enCours = true; F.message = null; ctx.redessiner();
        const ok = await ctx.commande("encheres.miser", { vente: F.id, mise: F.mise, ...(F.auto ? { plafond: F.plafond } : {}) }, { fermer: false });
        F.enCours = false;
        // Refusée : le refus est dit par le toast (moteur ou serveur) ; rien d'ancien ne reste affiché.
        F.message = ok ? ["C'est noté. Si on te dépasse, tu seras prévenu.", true] : null;
        if (ok) F.touche = false;
        await relireVente(ctx);
        majChamp("ec-mise", F.mise);
        ctx.redessiner();
      },
      async retirerVente() {
        F.enCours = true; ctx.redessiner();
        const ok = await ctx.commande("encheres.retirer", { vente: F.id }, { succes: "Vente retirée" });
        F.enCours = false;
        if (!ok) ctx.redessiner();
      },
    },
  });
}

// MARK: - La page

let luA = 0;

export const pages = {
  encheres: {
    titre: "Salle des ventes",
    css: ["encheres", "catalogues"],
    async donnees(ctx, p) {
      const [t] = await Promise.all([ctx.tableau("encheres"), chargerPhotos()]);
      return { t };
    },
    rendu: rendreSalle,
    /** La notification « on t'a dépassé » ouvre la salle sur la vente. */
    apres(ctx, d, p) {
      if (p?.vente && !p.__ouverte) { p.__ouverte = true; ouvrirVente(ctx, p.vente); }
    },
    /** Chaque seconde, les comptes à rebours ; toutes les cinq, les prix (et la feuille ouverte). */
    async tic(ctx, d) {
      const m = ctx.maintenant();
      for (const el of document.querySelectorAll(".ec-temps")) {
        el.textContent = temps({ debut: Number(el.dataset.debut), fin: Number(el.dataset.fin), terminee: el.dataset.terminee === "true", invendue: el.dataset.invendue === "true" }, m);
      }
      if (Date.now() - luA < 5000 || ctx.etat.decisions) return;
      luA = Date.now();
      if (F.id && ctx.etat.feuille) await relireVente(ctx);
      ctx.rafraichir();
    },
    actions: {
      familleVentes(ctx, b, d, p) { etatDe(p, "encheres", {}).famille = b.dataset.valeur; ctx.redessiner(); },
      vente: (ctx, b) => ouvrirVente(ctx, b.dataset.id),
    },
  },
};
