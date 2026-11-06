// ══════════════════════════════════════════════════════════════════════
//  La prison d'une ville (RNT-280) : EcranPrison de l'iPhone
//  (Rente/Ecrans/EcranPrison.swift) sur le web.
//
//  Les détenus et leur sortie (jamais le motif, jamais le dénonciateur),
//  le parloir : demander une visite (50 €), répondre en détenu, et, la
//  visite acceptée, payer la caution (don ou prêt), donner de l'argent,
//  laisser un mot, apporter un colis. En prison : la peine, l'avocat, le
//  travail du jour, les mots reçus. Toutes les règles viennent du moteur
//  (prison.tableau, PontPrisons.swift).
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js";
import { carte, ligne, bouton } from "../ui.js";
import * as L from "../enligne.js";

const TRAITS = {
  prison: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 4v16M12 4v16M16 4v16"/>',
  visite: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 11h5M18.5 8.5v5"/>',
  caution: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
  argent: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.6-.8-1.6-1.2-2.8-1.2-1.7 0-2.8.9-2.8 2s1 1.7 2.8 2 2.8.9 2.8 2-1.1 2-2.8 2c-1.2 0-2.2-.4-2.8-1.2M12 6.5v1.5M12 16v1.5"/>',
  note: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>',
  colis: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  avocat: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17"/>',
  travail: '<path d="M14.5 4.5l5 5-2 2-5-5zM12.5 6.5 4 15l2 2 1.5-1.5M7.5 15.5l2 2L18 9"/>',
};
const ic = (nom, t = 20) =>
  `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAITS[nom]}</svg>`;
const TEINTE = "var(--controles)";

/** Payer un geste du parloir : la fenêtre de paiement, puis la commande du moteur. Rend le refus ou null. */
async function payerPuis(ctx, prix, motif, cmd, params) {
  const carteChoisie = await L.choisirCarte(ctx, prix, motif);
  if (carteChoisie === null) return "annule";
  const r = await ctx.jouer(cmd, { ...params, ...(carteChoisie !== undefined ? { carte: carteChoisie } : {}) }, { silencieux: true });
  return r?.refus ?? (r ? null : "Le moteur a refusé.");
}

function detenus(t) {
  if (!t.detenus.length) return carte(`<p class="aide pr-pied">Personne derrière les barreaux en ce moment.</p>`, { pad: true });
  return carte(t.detenus.map((d) => ligne({
    titre: esc(d.pseudo), detail: esc(d.visite ? `${d.sortie} · ${montant(t.prixVisite)} la visite` : `${d.sortie} · ${d.raison ?? ""}`),
    icone: ic("visite", 18), teinte: TEINTE, action: d.visite ? "visiter" : null, donnees: { joueur: d.id }, desactive: !d.visite,
  })).join('<div class="filet"></div>'));
}

function visite(v, t) {
  const tete = ligne({ titre: esc(v.pseudo), detail: esc(`${v.texte}${v.ouverte ? ` · ${v.jusqua}` : ""}`), icone: ic(v.role === "visiteur" ? "visite" : "prison", 18), teinte: TEINTE });
  let corps = "";
  if (v.aRepondre) {
    corps = `<div class="choix pr-choix">${bouton("Accepter", "repondre", { genre: "teinte", teinte: TEINTE, donnees: { id: v.id, oui: "1" } })}
      ${bouton("Refuser", "repondre", { genre: "secondaire", donnees: { id: v.id, oui: "0" } })}</div>`;
  } else if (v.ouverte && v.role === "visiteur") {
    const gestes = [];
    if (!v.cautionPayee && v.caution > 0) {
      gestes.push(ligne({ titre: "Payer sa caution", detail: `${montant(v.caution)}, en don`, icone: ic("caution", 18), teinte: "var(--argent)", action: "caution", donnees: { id: v.id, montant: String(v.caution), pret: "0" } }));
      gestes.push(ligne({ titre: "Avancer sa caution", detail: `${montant(v.caution)}, en prêt : il reçoit une facture à te rembourser`, icone: ic("caution", 18), teinte: "var(--argent)", action: "caution", donnees: { id: v.id, montant: String(v.caution), pret: "1" } }));
    } else if (v.cautionPayee) gestes.push(ligne({ titre: "Caution payée", detail: "Il sort dès qu'il ouvre Grind", icone: ic("caution", 18), teinte: "var(--argent)" }));
    gestes.push(ligne({ titre: "Lui donner de l'argent", detail: "Un virement, de ta main à la sienne", icone: ic("argent", 18), teinte: "var(--argent)", action: "donner", donnees: { id: v.id } }));
    gestes.push(ligne({ titre: v.note ? "Changer ton mot" : "Laisser un mot", detail: v.note ? esc(v.note) : "Il le lira dans son fil", icone: ic("note", 18), teinte: TEINTE, action: "note", donnees: { id: v.id } }));
    gestes.push(ligne({ titre: v.colisApporte ? "Colis apporté" : "Apporter un colis", detail: v.colisApporte ? "Fouillé à l'entrée" : `${montant(t.prixColis)}, fouillé à l'entrée : il peut être confisqué`,
      icone: ic("colis", 18), teinte: "#F2A65A", action: v.colisApporte ? null : "colis", donnees: { id: v.id }, desactive: v.colisApporte }));
    corps = gestes.join('<div class="filet"></div>') + `<p class="aide pr-pied">Au parloir, et seulement ici, vous pouvez échanger : Échanges, « Troc ».</p>`;
  } else if (v.ouverte) {
    corps = `<p class="aide pr-pied">Au parloir : vous pouvez échanger (Échanges), ${v.jusqua}.</p>`;
  }
  return carte(tete + (corps ? `<div class="filet"></div>${corps}` : ""));
}

function peine(p) {
  return `<div><div class="section pr-section">Ta peine</div>${carte([
    ligne({ titre: p.sortie, detail: `${p.jours} jour${p.jours > 1 ? "s" : ""} encore · ${p.remise}`, icone: ic("prison", 18), teinte: TEINTE }),
    ligne({ titre: "Bonne conduite", detail: esc(p.bonneConduite), icone: ic("visite", 18), teinte: "var(--gain)" }),
    ligne({ titre: "Travailler à l'atelier", detail: p.travail ?? `1 h de moins, ${montant(p.travailGain, { centimes: true })} gagnés`, icone: ic("travail", 18), teinte: "#F2A65A",
      action: p.travail ? null : "travailler", desactive: !!p.travail }),
    ligne({ titre: "Prendre un avocat", detail: p.avocat ?? "30 % de moins sur ce qui reste", valeur: p.avocat ? "" : montant(p.avocatPrix), icone: ic("avocat", 18), teinte: TEINTE,
      action: p.avocat ? null : "avocat", desactive: !!p.avocat }),
    ligne({ titre: "Ta caution", detail: "Un visiteur peut la payer au parloir", valeur: montant(p.caution), icone: ic("caution", 18), teinte: "var(--argent)" }),
  ].join('<div class="filet"></div>'))}
  <p class="aide pr-pied">En prison, tu ne décides rien hors du parloir. Tes boîtes tournent au ralenti, sans jamais perdre. Tenter d'échanger hors du parloir annule ta bonne conduite.</p></div>`;
}

/** Ouvre la prison de `ville` (celle où je suis, ou où je purge ma peine, sans ville). */
export async function ouvrirPrison(ctx, ville = null) {
  styles();
  const charger = () => ctx.jouer("prison.tableau", { ...(ville ? { ville } : {}), profils: L.monde.profils ?? [] }, { silencieux: true }).then((r) => r?.tableau ?? null);
  let t = await charger();
  if (!t) return ctx.toast("Pas de prison dans cette partie.", "refus");
  let enCours = false;
  let retour = null;
  let saisie = null; // { id, sorte: "donner" | "note" }
  const rafraichir = async (c) => { await L.synchroniserPrison(c).catch(() => null); t = (await charger()) ?? t; c.redessiner(); };
  const rendu = () => {
    if (!t.actif) return `<div class="pile"><div class="section pr-section">Prison de ${esc(t.villeNom)}</div>
      <p class="aide pr-pied">Les prisons sont fermées dans ce monde (Régler le monde).</p></div>`;
    const formulaire = saisie ? `<div class="pile pr-saisie" id="pr-saisie">
        ${saisie.sorte === "donner" ? `<input id="pr-montant" type="number" min="1" step="1" inputmode="numeric" placeholder="Montant en euros" aria-label="Montant en euros">`
          : `<textarea id="pr-texte" maxlength="200" rows="3" placeholder="Quelques mots" aria-label="Ton mot"></textarea>`}
        <div class="choix pr-choix">${bouton(saisie.sorte === "donner" ? "Donner" : "Laisser ce mot", "valider", { genre: "teinte", teinte: TEINTE })}${bouton("Annuler", "annulerSaisie", { genre: "secondaire" })}</div></div>` : "";
    return `<div class="pile pr-fiche">
      <div class="rangee pr-tete"><span class="pastille" style="--c:#8E9AAF">${ic("prison", 22)}</span>
        <div class="pr-corps"><div class="pr-nom">Prison de ${esc(t.villeNom)}</div>
        <div class="aide">Parloir ${esc(t.horaires)} · ${t.parloirOuvert ? "ouvert" : "fermé"}</div></div></div>
      ${t.casier ? `<p class="aide pr-pied">${esc(t.casier)}</p>` : ""}
      ${t.conditionnelle ? `<p class="aide pr-pied">${esc(t.conditionnelle)} : pas de visite au parloir.</p>` : ""}
      ${t.peine ? peine(t.peine) : ""}
      ${t.visites.length ? `<div><div class="section pr-section">Parloir</div><div class="pile pr-visites">${t.visites.map((v) => visite(v, t)).join("")}</div></div>` : ""}
      ${formulaire}
      ${t.notes.length ? `<div><div class="section pr-section">Mots reçus</div>${carte(t.notes.map((n) => ligne({ titre: esc(n.de), detail: esc(n.texte), icone: ic("note", 18), teinte: TEINTE })).join('<div class="filet"></div>'))}</div>` : ""}
      ${t.peine ? "" : `<div><div class="section pr-section">Les détenus</div>${detenus(t)}
        <p class="aide pr-pied">Une visite par jour, ${montant(t.prixVisite)}, aux heures du parloir. Le détenu accepte ou refuse.</p></div>`}
      ${retour ? `<p class="pr-retour" role="status">${esc(retour)}</p>` : ""}
    </div>`;
  };
  const faire = async (c, f, succes) => {
    if (enCours) return;
    enCours = true; retour = null; c.redessiner();
    const r = await f();
    enCours = false;
    if (r === "annule") { c.redessiner(); return; }
    retour = r ?? null;
    if (!r && succes) c.toast(succes, "gain");
    await rafraichir(c);
  };
  ctx.feuille({
    titre: "",
    rendu,
    actions: {
      visiter: (c, el) => faire(c, () => payerPuis(c, t.prixVisite, "Visite au parloir", "prison.visiter", { joueur: el.dataset.joueur }), "Demande de visite envoyée"),
      repondre: (c, el) => faire(c, async () => (await c.jouer("prison.repondre", { id: el.dataset.id, accepte: el.dataset.oui === "1" }, { silencieux: true }))?.refus ?? null,
        el.dataset.oui === "1" ? "Visite acceptée" : "Visite refusée"),
      caution: (c, el) => faire(c, () => payerPuis(c, Number(el.dataset.montant), "Caution", "prison.caution",
        { visite: el.dataset.id, montant: Number(el.dataset.montant), pret: el.dataset.pret === "1" }), "Caution payée"),
      colis: (c, el) => faire(c, () => payerPuis(c, t.prixColis, "Colis au parloir", "prison.colis", { visite: el.dataset.id }), "Colis apporté"),
      donner(c, el) { saisie = { id: el.dataset.id, sorte: "donner" }; c.redessiner(); },
      note(c, el) { saisie = { id: el.dataset.id, sorte: "note" }; c.redessiner(); },
      annulerSaisie(c) { saisie = null; c.redessiner(); },
      valider(c) {
        const s = saisie;
        if (!s) return;
        if (s.sorte === "donner") {
          const m = Math.round(Number(document.getElementById("pr-montant")?.value ?? 0) * 100);
          if (!(m > 0)) { retour = "Indique un montant."; return c.redessiner(); }
          saisie = null;
          return faire(c, () => payerPuis(c, m, "Don au parloir", "prison.donner", { visite: s.id, montant: m }), "Argent donné");
        }
        const texte = document.getElementById("pr-texte")?.value ?? "";
        saisie = null;
        return faire(c, async () => (await c.jouer("prison.note", { visite: s.id, texte }, { silencieux: true }))?.refus ?? null, "Mot laissé");
      },
      travailler: (c) => faire(c, async () => (await c.jouer("prison.travailler", {}, { silencieux: true }))?.refus ?? null, "Journée d'atelier faite"),
      avocat: (c) => faire(c, () => payerPuis(c, t.peine?.avocatPrix ?? 0, "Avocat", "prison.avocat", {}), "Ton avocat a plaidé"),
    },
  });
}

function styles() {
  if (document.getElementById("styles-prison")) return;
  const s = document.createElement("style");
  s.id = "styles-prison";
  s.textContent = `
.pr-fiche { gap: 16px; }
.pr-tete { gap: 12px; align-items: center; }
.pr-corps { min-width: 0; }
.pr-nom { font-size: 20px; font-weight: 650; letter-spacing: -.01em; }
.pr-section { margin-top: 4px; }
.pr-pied { margin: 8px 4px 0; }
.pr-fiche > .aide { margin: 0 4px; }
.pr-visites { gap: 10px; }
.pr-choix { gap: 8px; padding: 4px 0 2px; }
.pr-saisie { gap: 8px; }
.pr-saisie textarea, .pr-saisie input { width: 100%; box-sizing: border-box; }
.pr-retour { margin: 0 4px; font-size: 14px; font-weight: 500; color: var(--alerte); }
`;
  document.head.append(s);
}
