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
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "./format.js";

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
  if (cmd === "encheres.miser") return { famille: "encheres", operation: { vente: p.vente, plafond: p.plafond, mise: p.mise } };
  if (cmd === "villes.investir") return { famille: "villes", operation: { investir: { ville: p.ville, rang: p.rang, montant: p.montant } } };
  if (cmd === "villes.candidater") return { famille: "villes", operation: { candidater: { ville: p.ville, rang: p.rang, boite: p.boite, pot: p.pot } } };
  return null;
}

const STYLE = `
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
  dialog.paiement .p-annuler { min-height: 44px; width: 100%; text-align: center; color: var(--texte2); font-weight: 500; font-size: 15px; }
`;

function stylesUneFois() {
  if (document.getElementById("style-paiement")) return;
  const s = document.createElement("style");
  s.id = "style-paiement";
  s.textContent = STYLE;
  document.head.append(s);
}

const COCHE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;

function heure(ms) { return new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }); }

function detail(t, m) {
  if (m.gelJusqua) return `Gelée jusqu'à ${heure(m.gelJusqua)}`;
  if (!m.peutPayer) return `${m.detail}, solde trop juste`;
  const morceaux = [m.detail];
  if (t.montant > 0 && !t.differe) morceaux.push(`il restera ${montant(m.solde - (t.montant - (m.remise || 0)))}`);
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
  const r = await jouer("paiement.apercu", { famille, operation }, { silencieux: true });
  const t = r?.paiement;
  if (!t) return undefined;
  return fenetrePaiement(t);
}

/** D205 : la même fenêtre pour un aperçu déjà calculé (un paiement à un joueur, une succursale). */
export function fenetrePaiement(t) {
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
    const titreBouton = () => {
      const m = moyen();
      if (!m) return t.moyens.some((x) => x.peutPayer) ? "Choisis avec quoi payer" : "Aucun moyen ne peut payer";
      const avec = m.liquide ? "en liquide" : `avec ${m.cle === -1 ? m.detail : m.nom}`;
      if (t.differe) return m.liquide ? "Prélever sur le portefeuille" : `Prélever sur ${m.cle === -1 ? m.detail : m.nom}`;
      if (confirmer) return `Toucher encore pour payer ${montant(t.montant - (m.remise || 0))}`;
      return t.montant > 0 ? `Payer ${montant(t.montant - (m.remise || 0))} ${avec}` : `Payer ${avec}`;
    };
    const rendre = () => {
      d.innerHTML = `<div class="poignee"></div>
        <div class="p-entete"><div class="t2" style="font-size:15px;font-weight:600">${t.differe ? "Avec quelle carte ?" : "Payer"}</div>
          <div class="p-quoi" id="p-quoi">${esc(t.libelle)}</div>
          ${t.montant > 0 ? `<div class="p-prix" id="p-prix">${montant(t.montant)}</div>` : ""}</div>
        <div class="corps-feuille">
          <div class="carte" role="radiogroup" aria-label="Moyen de paiement">${t.moyens.map((m) => `
            <button class="p-moyen" role="radio" aria-checked="${m.cle === choisi}" data-cle="${m.cle}" ${m.peutPayer ? "" : "disabled"}>
              ${vignette(m)}
              <span style="flex:1;min-width:0"><div class="p-nom">${esc(m.nom)}</div><div class="p-detail ${m.peutPayer ? "" : "alerte"}">${esc(detail(t, m))}</div>
                ${m.remise > 0 ? `<div class="p-remise">−${montant(m.remise)} en payant cash</div>` : ""}</span>
              <span class="p-solde">${montant(m.solde)}</span>
              <span class="p-coche">${m.cle === choisi ? COCHE : ""}</span>
            </button>`).join("")}</div>
          ${t.faceID ? `<p class="aide" style="text-align:center">Au-delà de ${montant(t.seuilFaceID)}, un second toucher confirme le paiement (Face ID sur l'iPhone).</p>` : ""}
          <button class="bouton" id="p-payer" ${moyen()?.peutPayer ? "" : "disabled"}>${esc(titreBouton())}</button>
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
      const ligne = ev.target.closest(".p-moyen");
      if (ligne && !ligne.disabled) { choisi = Number(ligne.dataset.cle); confirmer = false; return rendre(); }
      if (ev.target.closest("#p-annuler")) return repondre(null);
      if (ev.target.closest("#p-payer")) {
        if (!moyen()?.peutPayer) return;
        if (t.faceID && !confirmer) { confirmer = true; return rendre(); }
        return repondre(choisi);
      }
    });
    d.addEventListener("cancel", (ev) => { ev.preventDefault(); repondre(null); });
    rendre();
    document.body.append(d);
    d.showModal();
  });
}
