// ══════════════════════════════════════════════════════════════════════
//  La fenêtre de paiement (FeuillePaiement.swift, RNT-172, D192).
//
//  Avant une décision, le moteur la joue sur une copie (commande
//  « paiement.apercu ») : ce qu'on achète, son prix, chaque moyen de payer
//  avec son solde (chaque compte courant, celui de départ compris, et le
//  portefeuille). RNT-219 (D234) : plus de carte principale. Toute
//  décision qui paie ouvre la fenêtre, même avec un seul moyen, et rien
//  n'y est coché d'avance ; le moteur refuse un paiement sans moyen
//  choisi. Une décision qui ne paie rien : null, pas de fenêtre. Un
//  engagement (une mise, un bail, un prêt) ne débite rien tout de suite :
//  la carte choisie paiera plus tard (`differe`).
//
//  La fenêtre est un second <dialog>, ouvert par-dessus la feuille d'achat
//  (concession, immobilier, boîtes, voyages…) : le navigateur empile les
//  dialogues modaux, la feuille reste derrière. Au-delà du seuil de la
//  balance (10 000 €), un second toucher confirme (l'iPhone demande Face ID).
//  RNT-354 : quand aucun moyen seul ne suffit mais qu'ensemble ils
//  suffisent, « Combiner » (t.combinaison) partage le paiement ;
//  RNT-364 : le joueur coche les moyens qui paient et les range (flèches),
//  les parts se recalculent (partsCombinees, le calcul de TableauPaiement.parts)
//  et l'ordre part au moteur (« paiement.ordonner ») juste avant de payer ; la
//  fenêtre montre la part de chacun, le moteur les débite tour à tour.
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "./format.js?v=3e8bddd9";
import { menuAncre } from "./ui.js?v=3e8bddd9"; // D352 : le tri des moyens de paiement
import * as FID from "./faceid.js?v=3e8bddd9"; // D363 : Face ID réglable, clé d'accès du navigateur
import * as L from "./listes.js?v=3e8bddd9"; // RNT-310 : chercher, trier, les sections

/** RNT-219 : toutes les familles passent par l'aperçu (comme ModeleDebug.demanderCarte) ; celles qui ne
 *  paient rien rendent null. Gardé pour les écrans qui le lisent. */
export const FAMILLES_PAIEMENT = ["marches", "immobilier", "garage", "monde", "participations", "entreprises", "montres", "combines",
  "vie", "portefeuille", "mer", "evenements", "assurances", "illegal", "fiscalite", "banque", "encheres", "villes"];

/** RNT-219 : le refus quand chaque banque a déjà un crédit (le même texte que le moteur). */
export const REFUS_AUCUNE_BANQUE = "Tu as déjà un crédit dans chacune de tes banques : rembourse-en un, ou ouvre un compte dans une autre banque.";

const STYLE_BANQUE_CREDIT = `
  .bq-credit { display: flex; flex-direction: column; gap: 6px; }
  .bq-credit .bq-liste { display: flex; flex-wrap: wrap; gap: 6px; }
  .bq-credit .bq-liste button { min-height: 36px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--filet2, rgba(255,255,255,.12));
    font-size: 13px; font-weight: 600; color: var(--texte); background: transparent; }
  .bq-credit .bq-liste button[aria-checked="true"] { background: var(--accent); border-color: var(--accent); color: var(--sur-accent, #fff); }
  .bq-credit .bq-liste button[disabled] { opacity: .45; }
  .bq-credit .bq-titre.attente { color: var(--alerte); }
`;

/**
 * RNT-219 : dans quelle banque emprunter (crédit pro, hypothèque, crédit auto, prêt personnel). Plus de banque
 * principale : rien n'est choisi d'avance ; une banque qui a déjà un crédit est grisée, avec sa raison.
 * `action` : l'action de la page appelée avec `data-banque`.
 */
export function choixBanqueCredit(banques, choisie, action) {
  if (typeof document !== "undefined" && !document.getElementById("style-bq-credit")) {
    const s = document.createElement("style");
    s.id = "style-bq-credit";
    s.textContent = STYLE_BANQUE_CREDIT;
    document.head.append(s);
  }
  if (!(banques ?? []).some((b) => b.libre)) return `<p class="aide" style="color:var(--alerte)">${esc(REFUS_AUCUNE_BANQUE)}</p>`;
  const ok = banques.some((b) => b.id === choisie && b.libre);
  return `<div class="bq-credit"><span class="aide bq-titre ${ok ? "" : "attente"}">${ok ? "Banque du crédit" : "Choisis la banque qui te prête"}</span>
    <div class="bq-liste" role="radiogroup" aria-label="Banque du crédit">${banques.map((b) => `<button type="button" role="radio" aria-checked="${b.id === choisie && b.libre}"
      data-action="${action}" data-banque="${esc(b.id)}" ${b.libre ? "" : "disabled"}>${esc(b.nom)}${b.libre ? "" : ` · ${esc(b.raison ?? "indisponible")}`}</button>`).join("")}</div></div>`;
}

/** RNT-219 : les commandes hors opérations qui paient, vues comme une famille de l'aperçu. */
export function apercuCommande(cmd, p) {
  if (cmd === "encheres.miser") return { famille: "encheres", operation: { vente: p.vente, plafond: p.plafond, mise: p.mise, ...(p.telephone ? { telephone: true } : {}) } };
  if (cmd === "villes.investir") return { famille: "villes", operation: { investir: { ville: p.ville, rang: p.rang, montant: p.montant } } };
  if (cmd === "villes.candidater") return { famille: "villes", operation: { candidater: { ville: p.ville, rang: p.rang, boite: p.boite, pot: p.pot } } };
  return null;
}

const STYLE = `
  .paiement .p-outils { display: flex; gap: 8px; }
  .paiement .p-outils .carte { display: flex; align-items: center; min-height: 40px; padding: 0 12px; border-radius: 14px; }
  .paiement .p-outils .q { flex: 1; min-width: 0; }
  .paiement .p-outils input { flex: 1; min-width: 0; background: none; border: 0; color: var(--texte); font: inherit; font-size: 15px; outline: none; }
  .paiement .p-outils .tri { position: relative; font-size: 13px; font-weight: 600; }
  .paiement .p-outils .tri select { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .paiement .p-section { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 4px; font-size: 13px; font-weight: 600; color: var(--texte2); text-align: left; }
  .paiement .p-section .c { font-size: 12px; color: var(--texte3); font-variant-numeric: tabular-nums; }
  .paiement .p-section .chev { display: grid; transition: transform .2s ease; }
  .paiement .p-section[aria-expanded="true"] .chev { transform: rotate(90deg); }
  dialog.paiement { z-index: 40; }
  dialog.paiement .p-entete { text-align: center; padding: 6px 20px 4px; display: flex; flex-direction: column; gap: 4px; }
  dialog.paiement .p-quoi { font-size: 17px; font-weight: 600; }
  dialog.paiement .p-prix { font-size: 40px; font-weight: 700; letter-spacing: -.5px; font-variant-numeric: tabular-nums; }
  dialog.paiement .p-moyen { display: flex; align-items: center; gap: 12px; padding: 12px 16px; width: 100%; text-align: left; color: var(--texte); }
  dialog.paiement .p-moyen + .p-moyen { border-top: 1px solid var(--filet); }
  dialog.paiement .p-moyen[disabled] { opacity: .45; }
  dialog.paiement .p-vignette { width: 46px; height: 30px; border-radius: 6px; flex: none; display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 700; }
  dialog.paiement .p-nom { font-size: 15px; font-weight: 600; }
  dialog.paiement .p-detail { font-size: 12px; color: var(--texte2); }
  dialog.paiement .p-detail.alerte { color: var(--alerte); }
  dialog.paiement .p-remise { font-size: 12px; font-weight: 600; color: var(--argent); }
  dialog.paiement .p-solde { margin-left: auto; font-weight: 600; font-variant-numeric: tabular-nums; }
  dialog.paiement .p-coche { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--texte3); flex: none; display: grid; place-items: center; }
  dialog.paiement .p-moyen[aria-checked="true"] .p-coche { background: var(--accent); border-color: var(--accent); color: var(--sur-accent, #fff); }
  dialog.paiement .p-combiner { display: grid; gap: 10px; padding: 12px 16px; width: 100%; text-align: left; color: var(--texte); margin-top: 12px; }
  dialog.paiement .p-combiner .p-tete { display: flex; align-items: center; gap: 12px; }
  dialog.paiement .p-combiner .p-vignette { background: rgba(255,255,255,.08); color: var(--texte); font-size: 15px; }
  dialog.paiement .p-parts { display: grid; gap: 6px; padding-left: 58px; }
  dialog.paiement .p-part { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
  dialog.paiement .p-part span:first-child { color: var(--texte2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  dialog.paiement .p-part span:last-child { font-weight: 600; font-variant-numeric: tabular-nums; }
  dialog.paiement .p-combiner [aria-checked="true"] .p-coche { background: var(--accent); border-color: var(--accent); color: var(--sur-accent, #fff); }
  dialog.paiement .p-tete-bouton { width: 100%; text-align: left; color: var(--texte); }
  dialog.paiement .p-souple { flex: 1; min-width: 0; }
  dialog.paiement .p-rang-nom { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  dialog.paiement .p-rang-part { font-weight: 600; font-variant-numeric: tabular-nums; }
  dialog.paiement .p-rang { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  dialog.paiement .p-rang .p-cocher { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; text-align: left; color: var(--texte); min-height: 36px; }
  dialog.paiement .p-rang .p-case { width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--texte3); flex: none; display: grid; place-items: center; font-size: 12px; }
  dialog.paiement .p-rang .p-cocher[aria-checked="true"] .p-case { background: var(--accent); border-color: var(--accent); color: var(--sur-accent, #fff); }
  dialog.paiement .p-rang .p-jusqua { font-size: 11px; color: var(--texte3); }
  dialog.paiement .p-rang .p-fleche { width: 30px; height: 30px; color: var(--texte2); }
  dialog.paiement .p-rang .p-fleche:disabled { opacity: .35; }
  dialog.paiement .p-annuler { min-height: 44px; width: 100%; text-align: center; color: var(--texte2); font-weight: 500; font-size: 15px; }
`;

function stylesUneFois() {
  if (document.getElementById("style-paiement")) return;
  const s = document.createElement("style");
  s.id = "style-paiement";
  s.textContent = STYLE;
  document.head.append(s);
}

const CHEVRON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`;
const COCHE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

function heure(ms) { return new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }); }

function detail(t, m) {
  if (m.gelJusqua) return `Gelée jusqu'à ${heure(m.gelJusqua)}`;
  // RNT-319 : un retrait du coffre : l'argent entre sur le moyen choisi.
  if (t.recevoir) return m.peutPayer ? `${m.detail}, il y aura ${montant(m.solde + t.montant)}` : `${m.detail}, plafond de poche atteint`;
  if (!m.peutPayer) return `${m.detail}${m.texteChange ? `, ${m.texteChange}` : ""}, solde trop juste`;
  const morceaux = [m.detail];
  if (m.texteChange) morceaux.push(m.texteChange); // D377 : les frais de change hors de la devise du lieu
  if (t.montant > 0 && !t.differe) morceaux.push(`il restera ${montant(m.solde - (t.montant - (m.remise || 0)) - (m.fraisChange || 0))}`);
  if (m.cashback) morceaux.push(`${String(Math.round(m.cashback * 1000) / 10).replace(".", ",")} % rendus dimanche`);
  return morceaux.join(", ");
}

function vignette(m) {
  if (m.liquide) return `<span class="p-vignette" style="background:linear-gradient(135deg,var(--argent),color-mix(in srgb,var(--argent) 70%,#000))" aria-hidden="true">€</span>`;
  const c = m.carte?.couleurs?.length ? m.carte.couleurs : ["#3A3D45", "#17181C"];
  return `<span class="p-vignette" style="background:linear-gradient(135deg,${c.join(",")})" aria-hidden="true">${m.gelJusqua ? "❄" : ""}</span>`;
}

/**
 * Demande avec quoi payer une décision. Rend `undefined` si elle ne paie rien, `null` si le joueur
 * annule, sinon la clé du moyen choisi (−1 : le compte de départ, −2 : le liquide, ou un compte).
 */
export async function demanderPaiement(jouer, famille, operation) {
  jouerParDefaut = jouer;
  let r;
  try {
    r = await jouer("paiement.apercu", { famille, operation }, { silencieux: true });
  } catch (e) {
    // RNT-295 : le moteur a planté sur l'aperçu (un piège du wasm, le worker arrêté) : sans ça, rien ne
    // s'ouvrait et rien n'était dit. On le dit, et rien n'est payé.
    console.error(e);
    signalerEchec(e);
    return null;
  }
  const t = r?.paiement;
  if (!t) return undefined;
  return fenetrePaiement(t, jouer);
}

/** RNT-295 : la fenêtre de paiement n'a pas pu s'ouvrir : un toast (le même conteneur que app.js). */
function signalerEchec(e) {
  const zone = typeof document !== "undefined" && document.getElementById("toasts");
  if (!zone) return;
  const t = document.createElement("div");
  t.className = "toast refus";
  t.setAttribute("role", "status");
  t.textContent = `Le paiement n'a pas pu s'ouvrir (${e?.message || "erreur du moteur"}). Recharge la page, puis réessaie.`;
  zone.append(t);
  setTimeout(() => t.remove(), 6500);
}

/** RNT-364 : les parts quand les moyens `ordre` paient dans cet ordre (null : ils ne suffisent pas). */
export function partsCombinees(t, ordre) {
  let reste = t.montant;
  const r = [];
  for (const cle of ordre) {
    if (reste <= 0) break;
    const m = (t.combinables || []).find((x) => x.cle === cle);
    if (!m || r.some((x) => x.cle === cle)) continue;
    const p = Math.min(reste, m.montant);
    if (p <= 0) continue;
    r.push({ cle, nom: m.nom, montant: p });
    reste -= p;
  }
  return reste === 0 && t.montant > 0 ? r : null;
}

let jouerParDefaut = null;

/** D205 : la même fenêtre pour un aperçu déjà calculé (un paiement à un joueur, une succursale).
 *  RNT-364 : `jouer` envoie l'ordre d'un paiement combiné au moteur (sinon, celui du dernier demanderPaiement). */
export function fenetrePaiement(t, jouer = jouerParDefaut) {
  stylesUneFois();
  return new Promise((fini) => {
    // RNT-219 : rien n'est coché d'avance.
    let choisi = null;
    let confirmer = false;
    const d = document.createElement("dialog");
    d.id = "paiement";
    d.className = "feuille paiement";
    d.setAttribute("aria-label", "Payer");
    const moyen = () => t.moyens.find((m) => m.cle === choisi);
    // RNT-354 : la combinaison choisie (plusieurs moyens, chacun sa part).
    const combine = () => !!t.combinaison && choisi === t.cleCombinaison;
    // RNT-364 : l'ordre proposé (le dernier choisi). RNT-384 : les moyens décochés la dernière fois le restent.
    const ordre = (t.combinables || []).map((x) => x.cle);
    const coches = new Set(ordre.filter((c) => !(t.decoches || []).includes(c)));
    const choisis = () => ordre.filter((c) => coches.has(c));
    const parts = () => (t.combinables?.length ? partsCombinees(t, choisis()) : t.combinaison);
    const peutPayer = () => (combine() ? !!parts() : !!moyen()?.peutPayer);
    const titreBouton = () => {
      if (combine()) {
        const p = parts();
        if (!p) return "Coche assez de moyens pour payer";
        return confirmer ? `Toucher encore pour payer ${montant(t.montant)}` : `Payer ${montant(t.montant)} avec ${p.length} moyens`;
      }
      const m = moyen();
      if (!m) return t.recevoir ? (t.moyens.some((x) => x.peutPayer) ? "Choisis où mettre l'argent" : "Aucun moyen ne peut recevoir")
        : t.moyens.some((x) => x.peutPayer) ? "Choisis avec quoi payer" : t.combinaison ? "Combine tes moyens pour payer" : "Aucun moyen ne peut payer";
      if (t.recevoir) return m.liquide ? `Mettre ${montant(t.montant)} en poche` : `Mettre ${montant(t.montant)} sur ${m.cle === -1 ? m.detail : m.nom}`;
      const avec = m.liquide ? "en liquide" : `avec ${m.cle === -1 ? m.detail : m.nom}`;
      if (t.differe) return m.liquide ? "Prélever sur le portefeuille" : `Prélever sur ${m.cle === -1 ? m.detail : m.nom}`;
      if (confirmer) return `Toucher encore pour payer ${montant(t.montant - (m.remise || 0))}`;
      return t.montant > 0 ? `Payer ${montant(t.montant - (m.remise || 0))} ${avec}` : `Payer ${avec}`;
    };
    // RNT-310 : beaucoup de cartes ? Chercher, trier (gardé), et ranger à part celles qui ne peuvent pas payer.
    const long = t.moyens.length >= L.SEUIL_OUTILS;
    let recherche = "";
    const ligneMoyen = (m) => `
            <button class="p-moyen" role="radio" aria-checked="${m.cle === choisi}" data-cle="${m.cle}" ${m.peutPayer ? "" : "disabled"}>
              ${vignette(m)}
              <span style="flex:1;min-width:0"><div class="p-nom">${esc(m.nom)}</div><div class="p-detail ${m.peutPayer ? "" : "alerte"}">${esc(detail(t, m))}</div>
                ${m.remise > 0 ? `<div class="p-remise">−${montant(m.remise)} en payant cash</div>` : ""}</span>
              <span class="p-solde">${montant(m.solde)}</span>
              <span class="p-coche">${m.cle === choisi ? COCHE : ""}</span>
            </button>`;
    const groupe = (liste) => `<div class="carte" role="radiogroup" aria-label="Moyen de paiement">${liste.map(ligneMoyen).join("")}</div>`;
    const outils = () => {
      const tri = L.lire("paiement.tri", "valeur");
      return `<div class="p-outils"><label class="carte q"><input type="search" id="p-chercher" value="${esc(recherche)}" placeholder="Chercher une carte, une banque" autocomplete="off" aria-label="Chercher une carte"></label>
        ${menuAncre({ libelle: "Trier", options: [["valeur", "Solde"], ["nom", "Nom"]], choisie: tri === "nom" ? "nom" : "valeur", action: "pTri" }) /* D352 : menuAncre (D345) */}</div>`;
    };
    const listeMoyens = () => {
      if (!long) return groupe(t.moyens);
      const trouves = L.filtrer(t.moyens, recherche, (m) => [m.nom, m.detail, m.carte?.banqueNom ?? ""]);
      if (!trouves.length) return `<p class="aide lp-vide">Aucune carte ne correspond à « ${esc(recherche)} ».</p>`;
      const fermees = new Set(String(L.lire("paiement.replis", "impossibles")).split(",").filter(Boolean));
      return L.sections(L.trierMoyens(trouves, L.lire("paiement.tri", "valeur")), L.sectionMoyen, L.ORDRE_MOYENS).map((x) => {
        const ouverte = !fermees.has(x.id) || !!recherche.trim();
        return `<button class="p-section" data-section="${x.id}" aria-expanded="${ouverte}"><span class="chev">${CHEVRON}</span>
            <span>${esc(L.nomSectionMoyens(x.id, t.recevoir))}</span><span class="c">${x.elements.length}</span></button>
          ${ouverte ? groupe(x.elements) : ""}`;
      }).join("");
    };
    const repeindreListe = () => { const c = d.querySelector("#p-liste"); if (c) c.innerHTML = listeMoyens(); };
    d.addEventListener("input", (ev) => {
      if (ev.target.id === "p-chercher") { recherche = ev.target.value; repeindreListe(); }
    });
    const rendre = () => {
      d.innerHTML = `<div class="poignee"></div>
        <div class="p-entete"><div class="t2" style="font-size:15px;font-weight:600">${t.recevoir ? "Où va l'argent ?" : t.differe ? "Avec quelle carte ?" : "Payer"}</div>
          <div class="p-quoi" id="p-quoi">${esc(t.libelle)}</div>
          ${t.montant > 0 ? `<div class="p-prix" id="p-prix">${montant(t.montant)}</div>` : ""}</div>
        <div class="corps-feuille">
          ${long ? outils() : ""}
          <div class="pz-pile lp-g10" id="p-liste">${listeMoyens()}</div>
          ${t.combinaison ? (() => {
            const p = parts();
            const lignes = (t.combinables?.length ? t.combinables.map((x) => x.cle) : t.combinaison.map((x) => x.cle));
            const rangs = t.combinables?.length ? ordre : lignes;
            return `<div class="carte p-combiner" id="p-bloc-combiner">
            <button class="p-tete p-tete-bouton" role="radio" aria-checked="${combine()}" data-cle="${t.cleCombinaison}" id="p-combiner">
              <span class="p-vignette" aria-hidden="true">⧉</span>
              <span class="p-souple"><div class="p-nom">Combiner</div><div class="p-detail ${p ? "" : "alerte"}">${p ? "Aucun moyen seul ne suffit : coche ceux qui paient et range-les." : "Les moyens cochés ne suffisent pas."}</div></span>
              <span class="p-coche">${combine() ? COCHE : ""}</span></button>
            <span class="p-parts">${rangs.map((cle, k) => {
              const m = (t.combinables || t.combinaison).find((x) => x.cle === cle) || {};
              const part = p?.find((x) => x.cle === cle);
              const coche = coches.has(cle);
              return `<span class="p-rang" data-rang="${cle}">
                <button class="p-cocher" role="checkbox" aria-checked="${coche}" data-cocher="${cle}">
                  <span class="p-case">${coche ? "✓" : ""}</span>
                  <span class="p-souple"><span class="p-rang-nom">${esc(m.nom || "")}</span>
                    ${t.combinables?.length ? `<span class="p-jusqua">Jusqu'à ${montant(m.montant || 0)}</span>` : ""}</span>
                  <span class="p-rang-part">${part ? montant(part.montant) : "—"}</span></button>
                <button class="p-fleche" data-monter="${cle}" aria-label="Faire payer ${esc(m.nom || "")} plus tôt" ${k === 0 ? "disabled" : ""}>↑</button>
                <button class="p-fleche" data-descendre="${cle}" aria-label="Faire payer ${esc(m.nom || "")} plus tard" ${k === rangs.length - 1 ? "disabled" : ""}>↓</button>
              </span>`;
            }).join("")}</span>
          </div>`;
          })() : ""}
          ${FID.exige(t) ? `<p class="aide" style="text-align:center">Au-delà de ${montant(FID.seuilEffectif(t))}, ta clé d'accès (Touch ID, Face ID, Windows Hello) confirme le paiement, ou un second toucher.</p>` : ""}
          <button class="bouton" id="p-payer" ${peutPayer() ? "" : "disabled"}>${esc(titreBouton())}</button>
          <button class="p-annuler" id="p-annuler">Annuler</button>
        </div>`;
    };
    let repondu = false;
    const repondre = (x) => {
      if (repondu) return;
      repondu = true;
      if (d.open) d.close();
      d.remove();
      fini(x);
    };
    d.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (ev.target === d) return repondre(null); // un toucher hors de la fenêtre : annulé
      // D352 : le tri en menuAncre (D345) : la fenêtre arrête les clics, elle referme le menu et suit le choix elle-même.
      const choix = ev.target.closest(".menu-choix[data-action=pTri]");
      if (choix) {
        L.ecrire("paiement.tri", choix.value);
        const menu = choix.closest("[popover]");
        try { menu?.hidePopover?.(); } catch {}
        menu?.querySelectorAll(".menu-choix").forEach((b) => b.setAttribute("aria-checked", String(b === choix)));
        const t = menu?.parentElement?.querySelector(".mb-texte");
        if (t) t.textContent = `Trier : ${choix.value === "nom" ? "Nom" : "Solde"}`;
        return repeindreListe();
      }
      const section = ev.target.closest(".p-section");
      if (section) {
        const f = new Set(String(L.lire("paiement.replis", "impossibles")).split(",").filter(Boolean));
        f.has(section.dataset.section) ? f.delete(section.dataset.section) : f.add(section.dataset.section);
        L.ecrire("paiement.replis", [...f].sort().join(","));
        return repeindreListe();
      }
      // RNT-364 : cocher, décocher, ranger un moyen du paiement combiné.
      const cocher = ev.target.closest("[data-cocher]");
      if (cocher) {
        const cle = Number(cocher.dataset.cocher);
        if (coches.has(cle)) coches.delete(cle); else coches.add(cle);
        choisi = t.cleCombinaison; confirmer = false; return rendre();
      }
      const fleche = ev.target.closest("[data-monter], [data-descendre]");
      if (fleche && !fleche.disabled) {
        const cle = Number(fleche.dataset.monter ?? fleche.dataset.descendre);
        const i = ordre.indexOf(cle), j = i + (fleche.dataset.monter !== undefined ? -1 : 1);
        if (i >= 0 && j >= 0 && j < ordre.length) [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
        choisi = t.cleCombinaison; confirmer = false; return rendre();
      }
      const ligne = ev.target.closest(".p-moyen, #p-combiner");
      if (ligne && !ligne.disabled) { choisi = Number(ligne.dataset.cle); confirmer = false; return rendre(); }
      if (ev.target.closest("#p-annuler")) return repondre(null);
      if (ev.target.closest("#p-payer")) {
        if (!peutPayer()) return;
        // D363 : la clé d'accès du navigateur d'abord ; sans elle, un second toucher.
        if (FID.exige(t) && !confirmer) {
          return FID.verifier().then((ok) => {
            if (ok === null) { confirmer = true; return rendre(); }
            if (ok) { confirmer = true; return d.querySelector("#p-payer")?.click(); }
          });
        }
        // RNT-364 : le moteur paiera avec les moyens cochés, dans cet ordre.
        if (combine() && jouer && t.combinables?.length) {
          const decoches = ordre.filter((c) => !coches.has(c)); // RNT-384 : retenus pour la fois suivante
          return Promise.resolve(jouer("paiement.ordonner", { ordre, decoches }, { silencieux: true }))
            .catch(() => {}).then(() => repondre(choisi));
        }
        return repondre(choisi);
      }
    });
    d.addEventListener("cancel", (ev) => { ev.preventDefault(); repondre(null); });
    rendre();
    document.body.append(d);
    d.showModal();
  });
}
