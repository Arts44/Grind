// ══════════════════════════════════════════════════════════════════════
//  Les cartes du mode en ligne sur les fiches (D205) : ce que l'iPhone
//  ajoute à la fiche d'une boîte (CarteCapitalEnLigne, CarteMarqueEnLigne)
//  et d'un bien (CarteLocationJoueurs) quand la partie joue dans un monde.
//
//  Une page « complétée » (boite, bien) reçoit ces cartes en bas, par
//  app.js (`complements`) : ses propres fichiers n'en savent rien.
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js";
import { carte, petit, bouton, champEuros, lireEuros } from "../ui.js";
import * as L from "../enligne.js";

const montant = (c) => montantBrut(c).replace("-", "−");
const pct = (x, d = 0) => `${(x * 100).toFixed(d).replace(".", ",")} %`;
const lc = (x) => String(x ?? "").toLowerCase();
const filet = '<div class="filet"></div>';
const pilules = (action, choix, choisie) => `<div class="choix el-pilules">${choix.map(([v, t]) =>
  `<button class="petit ${String(v) === String(choisie) ? "plein" : ""}" data-action="${action}" data-valeur="${esc(v)}" aria-pressed="${String(v) === String(choisie)}">${esc(t)}</button>`).join("")}</div>`;
const titre = (t) => `<div class="libelle" style="margin-bottom:6px">${t}</div>`;

const marque = { redevance: null, droit: 0 };

// Lot A : `css` des compléments, posé par app.js avant leur premier dessin (la fiche d'une boîte, d'un bien).
export const complements = {
  // ── La fiche d'une boîte : son capital, sa marque ────────────────────
  boite: {
    css: "enligne",
    async donnees(ctx, p) {
      const e = await L.etatPartie(ctx);
      if (!e) return null;
      const id = Number(p.id);
      const b = e.boites.find((x) => x.id === id);
      if (!b) return null;
      return { e, b, regles: e.reglesFranchises ?? null, micro: !!b.micro };
    },
    rendu(x) {
      const { e, b } = x;
      const m = L.monde.marche;
      const t = b.titre ? m.titres.find((y) => y.id === b.titre) : null;
      const gardee = t ? L.detenu(m, t.id) / t.actions : 1;
      const capital = carte(`<div class="pile" style="gap:12px">${titre("Capital")}
        <p class="aide" style="margin-top:-6px">${t ? `Tu gardes ${pct(gardee, 1)} du capital${t.cote ? `, cotée à ${montant(Math.round(L.prixAction(t) * 10_000))} le pour-cent` : ""}.`
          : `Vends des parts aux joueurs de « ${esc(e.enLigne.nom)} », ou fais entrer ta boîte en bourse. Au-delà de 50 % chez un autre, elle passe à lui.`}</p>
        <div class="rangee">${petit("Vendre des parts", "capitalParts", { plein: true })}${petit(t?.cote ? "Remettre en bourse" : "Entrer en bourse", "capitalBourse")}</div></div>`, { pad: true });
      // La marque : un contrat (succursale franchisée), ma marque publiée, ou la proposer.
      const contrat = (e.franchises ?? []).find((c) => c.boite === b.id);
      const f = L.monde.franchises.find((y) => lc(y.id) === lc(b.marque));
      let mq = "";
      if (contrat) {
        mq = carte(`<div class="pile" style="gap:10px">${titre("Succursale franchisée")}
          <p class="aide">Sous la marque ${esc(contrat.marque)}, à ${esc(L.pseudoDe(contrat.franchiseur))}. Chaque dimanche, ${pct(contrat.redevance)} du chiffre d'affaires de la semaine part au franchiseur, payés par la trésorerie de la boîte, avant l'impôt.</p>
          <div class="rangee entre"><span class="t2">Versé jusqu'ici</span><span class="chiffres">${montant(contrat.verse)}</span></div></div>`, { pad: true });
      } else if (f) {
        const actives = (f.succursales ?? []).filter((s) => s.actif);
        const verse = (f.succursales ?? []).reduce((s, x) => s + (x.verse ?? 0), 0);
        mq = carte(`<div style="padding:16px"><div class="rangee entre"><span class="libelle">Ta marque en franchise</span>
            <span class="${f.ouverte ? "gain" : "t2"}" style="font-size:12px;font-weight:600">${f.ouverte ? "Ouverte" : "Fermée"}</span></div>
          <p class="aide">Redevance ${pct(f.redevance)} du chiffre d'affaires, droit d'entrée ${f.droitEntree === 0 ? "offert" : montant(f.droitEntree)}.</p></div>
          ${actives.length ? actives.map((s) => `${filet}<div class="rangee entre" style="padding:12px 16px"><div><div class="libelle">${esc(L.pseudoDe(s.joueur))}</div><div class="aide">${esc(s.ville)}</div></div><span class="chiffres">${montant(s.verse)}</span></div>`).join("")
            : `${filet}<p class="aide" style="padding:16px">${f.ouverte ? "Aucune succursale pour l'instant. Les joueurs du monde la trouvent dans Monde en ligne, Échanges." : "Aucune succursale."}</p>`}
          ${filet}<div class="rangee entre" style="padding:16px"><span class="t2">Reçu en tout</span><span class="chiffres ${verse > 0 ? "gain" : ""}">${montant(verse)}</span></div>
          <div style="padding:0 16px 16px">${petit(f.ouverte ? "Fermer aux nouvelles succursales" : "Rouvrir aux succursales", "basculerMarque")}</div>`);
      } else if (!x.micro && x.regles) {
        const r = x.regles;
        if (marque.redevance == null || !r.redevances.includes(marque.redevance)) marque.redevance = r.redevances[0] ?? 0.05;
        mq = carte(`<div class="pile" style="gap:12px">${titre("Ta marque aux joueurs du monde")}
          <p class="aide" style="margin-top:-6px">Un autre joueur ouvre une succursale de ta marque dans sa ville : sa boîte, avec ta réputation en partant. Chaque dimanche, il te verse une part de son chiffre d'affaires.</p>
          ${b.refusMarque ? `<p class="alerte" style="font-size:13px;font-weight:500">${esc(b.refusMarque)}</p>` : `
            <div class="t2" style="font-size:13px;font-weight:600">Redevance</div>${pilules("redevanceMarque", r.redevances.map((v) => [v, pct(v)]), marque.redevance)}
            <div class="t2" style="font-size:13px;font-weight:600">Droit d'entrée</div>${pilules("droitMarque", r.droitsEntreeCentimes.map((v) => [v, v === 0 ? "Offert" : montant(v)]), marque.droit)}
            <div>${petit("Ouvrir ma marque en franchise", "ouvrirMarque", { plein: true })}</div>`}</div>`, { pad: true });
      }
      return `<div class="pile" style="gap:16px;margin-top:18px">${capital}${mq}</div>`;
    },
    actions: {
      capitalParts: (ctx, b, d, p) => feuilleCapital(ctx, d, p, "parts"),
      capitalBourse: (ctx, b, d, p) => feuilleCapital(ctx, d, p, "bourse"),
      redevanceMarque(ctx, b) { marque.redevance = Number(b.dataset.valeur); ctx.redessiner(); },
      droitMarque(ctx, b) { marque.droit = Number(b.dataset.valeur); ctx.redessiner(); },
      async ouvrirMarque(ctx, b, d, p) {
        const r = await L.ouvrirMarque(ctx, Number(p.id), marque.redevance, marque.droit, true);
        ctx.toast(r ?? "Ta marque est ouverte aux joueurs du monde", r ? "refus" : "gain");
        ctx.rafraichir();
      },
      async basculerMarque(ctx, b, d, p) {
        const x = d.__enLigne;
        const f = L.monde.franchises.find((y) => lc(y.id) === lc(x?.b?.marque));
        if (!f) return;
        const r = await L.ouvrirMarque(ctx, Number(p.id), f.redevance, f.droitEntree, !f.ouverte);
        ctx.toast(r ?? (f.ouverte ? "Fermée : les succursales en place continuent" : "Rouverte"), r ? "refus" : "gain");
        ctx.rafraichir();
      },
    },
  },

  // ── La fiche d'un bien : le louer à un joueur (D111) ─────────────────
  bien: {
    css: "enligne",
    async donnees(ctx, p) {
      const e = await L.etatPartie(ctx);
      const t = ctx.etat.donnees?.t;
      if (!e || !t) return null;
      const def = (await ctx.balance("immobilier"))?.biens?.find((b) => b.id === p.id);
      return { e, t, ville: def?.ville ?? "", loyerDef: def?.loyerCentimes ?? t.loyerReference };
    },
    rendu(x, ctx, p) {
      const { e, t } = x;
      const annonce = L.monde.locations.find((l) => l.bien === p.id);
      let corps;
      if (annonce?.locataire && !L.estMoi(annonce.locataire)) {
        // D111, D116 : il l'habite ; renégocier le loyer, ou mettre fin au bail.
        corps = `<p class="aide">${esc(L.pseudoDe(annonce.locataire))} l'habite et te verse ${montant(annonce.loyer)} chaque semaine.</p>
          ${negociationLoyer(annonce)}
          <div>${petit("Mettre fin au bail", "finBail", { donnees: { bien: annonce.bien } })}</div>`;
      } else if (annonce) {
        corps = `<p class="aide">Proposé aux joueurs à ${montant(annonce.loyer)} par semaine.</p><div>${petit("Retirer l'annonce", "retirerAnnonce")}</div>`;
      } else {
        const libre = !t.habite && !t.locataire;
        corps = `<p class="aide">Un joueur de ton monde peut venir y habiter ; son loyer te revient chaque semaine.</p>
          ${libre ? `${champEuros("loyer-joueur", { valeur: String(Math.round((x.loyerDef ?? 0) / 100)), etiquette: "Loyer par semaine" })}<div>${petit("Proposer", "proposerAnnonce", { plein: true })}</div>`
            : `<p class="aide">Libère-le d'abord (tu l'habites, ou il est loué).</p>`}`;
      }
      void e;
      return `<div style="margin-top:18px">${carte(`<div class="pile" style="gap:12px">${titre("Louer à un joueur")}${corps}</div>`, { pad: true })}</div>`;
    },
    actions: {
      async proposerAnnonce(ctx, b, d, p) {
        const v = lireEuros("loyer-joueur");
        if (!v || v <= 0) return ctx.toast("Indique un loyer.", "refus");
        const r = await L.proposerLocation(ctx, p.id, d.t?.nom ?? p.id, d.__enLigne?.ville ?? "", v);
        ctx.toast(r ?? "Annonce publiée", r ? "refus" : "gain");
        ctx.rafraichir();
      },
      async retirerAnnonce(ctx, b, d, p) {
        const r = await L.retirerLocation(ctx, p.id);
        ctx.toast(r ?? "Annonce retirée", r ? "refus" : "gain");
        ctx.rafraichir();
      },
    },
  },
};

// MARK: - Le voyage à deux depuis le trajet (InvitationDuTrajet), pour monde.js (lot D)

/**
 * Sur la carte du trajet : l'invitation envoyée pour ce départ (`depart` en ms), et où elle en est ;
 * s'il n'a pas répondu avant le départ, « L'attendre » (départ suivant) ou « Partir sans lui ».
 * Rend "" s'il n'y a pas d'invitation. Actions : actionsVoyageADeux (à étendre dans la page qui l'affiche).
 */
export function invitationDuTrajet(depart, maintenant = Date.now()) {
  const dateDe = (x) => (x == null ? null : typeof x === "number" ? (x > 1e11 ? x : (x + 978_307_200) * 1000) : Date.parse(x));
  const i = L.monde.interactions.find((x) => x.sorte === "voyage" && L.estMoi(x.de) && Math.abs((dateDe(x.donnees?.depart) ?? 0) - depart) < 60_000);
  if (!i) return "";
  const p = L.pseudoDe(i.vers);
  const texte = { attente: `${p} n'a pas encore répondu`, acceptee: `${p} part avec toi`, traitee: `${p} part avec toi`, refusee: `${p} a décliné`, expiree: `${p} n'a pas répondu à temps` }[i.statut] ?? `Invitation à ${p}`;
  const etat = ["acceptee", "traitee"].includes(i.statut) ? "fait" : ["refusee", "expiree"].includes(i.statut) ? "echec" : "encours";
  return `<div class="pile so-trajet" data-etat="${etat}">
    <div class="rangee so-trajet-tete"><span class="pastille" style="--c:var(--equipe)">${PERSONNES}</span><span class="libelle so-flex">${esc(texte)}</span></div>
    ${i.statut === "attente" && maintenant < depart ? `<p class="aide">Sans réponse au départ, tu pars seul. Tu peux aussi l'attendre au départ suivant.</p>
      <div class="rangee">${petit("L'attendre", "attendreInvite", { teinte: "var(--equipe)", donnees: { id: i.id } })}${petit("Partir sans lui", "partirSansLui", { donnees: { id: i.id } })}</div>` : ""}</div>`;
}
const PERSONNES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8.5" cy="6" r="2.5"/><circle cx="15.5" cy="6" r="2.5"/><path d="M5 21v-6l-1.5-4h10L12 15v6M12 15l.5 6M19.5 11 21 15v6"/></svg>';

export const actionsVoyageADeux = {
  async attendreInvite(ctx, b) {
    const i = L.monde.interactions.find((x) => x.id === Number(b.dataset.id));
    if (!i) return;
    b.disabled = true;
    const r = await L.attendreInvite(ctx, i);
    ctx.toast(r ?? "Départ reporté : il a jusqu'au suivant pour répondre", r ? "refus" : "info");
    ctx.rafraichir();
  },
  async partirSansLui(ctx, b) {
    const i = L.monde.interactions.find((x) => x.id === Number(b.dataset.id));
    if (!i) return;
    b.disabled = true;
    const r = await L.partirSansLui(ctx, i);
    if (r) ctx.toast(r, "refus");
    ctx.rafraichir();
  },
};

// MARK: - Le bail entre joueurs (NegociationLoyer, D116 ; fin de bail, D111)

/**
 * Renégocier le loyer, d'un côté comme de l'autre : la proposition en attente (la sienne, ou la mienne),
 * puis « Proposer un autre loyer ». Actions : actionsLoyer (à étendre dans la page qui l'affiche).
 */
export function negociationLoyer(l) {
  let attente = "";
  if (l.loyerPropose && l.proposePar) {
    attente = L.estMoi(l.proposePar)
      ? `<p class="aide">Tu as proposé ${montant(l.loyerPropose)} par semaine ; en attente de réponse.</p>`
      : `<p class="so-alerte">Nouveau loyer proposé : ${montant(l.loyerPropose)} par semaine (au lieu de ${montant(l.loyer)}).</p>
        <div class="rangee">${petit("Refuser", "repondreLoyer", { donnees: { bien: l.bien, oui: "0" } })}${petit("Accepter", "repondreLoyer", { plein: true, donnees: { bien: l.bien, oui: "1" } })}</div>`;
  }
  return `<div class="pile so-loyer">${attente}<button class="so-lien" data-action="feuilleLoyer" data-bien="${esc(l.bien)}">Proposer un autre loyer</button></div>`;
}

export const actionsLoyer = {
  async repondreLoyer(ctx, b) {
    b.disabled = true;
    const r = await L.repondreLoyer(ctx, b.dataset.bien, b.dataset.oui === "1");
    if (r) ctx.toast(r, "refus");
    ctx.rafraichir();
  },
  feuilleLoyer(ctx, b) {
    const l = L.monde.locations.find((x) => x.bien === b.dataset.bien);
    if (!l) return;
    ctx.feuille({ titre: "Loyer proposé par semaine", contenu: `<div class="pile so-feuille">
      ${champEuros("loyer-propose", { valeur: String(Math.round(l.loyer / 100)), etiquette: "Par semaine" })}
      <p class="aide">Aujourd'hui : ${montant(l.loyer)} par semaine. L'autre accepte ou refuse ; rien ne change sans lui.</p>
      ${bouton("Proposer", "envoyerLoyer")}</div>`, actions: {
      async envoyerLoyer(c) {
        const v = lireEuros("loyer-propose");
        if (!v || v <= 0) return c.toast("Indique un loyer.", "refus");
        c.fermerFeuille();
        const r = await L.proposerLoyer(c, l.bien, v);
        c.toast(r ?? "Loyer proposé", r ? "refus" : "gain");
        c.rafraichir();
      },
    } });
  },
  finBail(ctx, b) {
    const l = L.monde.locations.find((x) => x.bien === b.dataset.bien);
    if (!l) return;
    const nom = L.pseudoDe(l.locataire);
    ctx.feuille({ titre: `Mettre fin au bail de ${nom} ?`, contenu: `<div class="pile so-feuille">
      <p class="aide">Il quitte le logement à son prochain passage. Ton annonce reste en ligne.</p>
      ${bouton("Il doit partir", "confirmerFinBail", { genre: "danger" })}</div>`, actions: {
      async confirmerFinBail(c) {
        c.fermerFeuille();
        const r = await L.expulser(c, l.bien);
        c.toast(r ?? `${nom} quitte le logement à son prochain passage`, r ? "refus" : "info");
        c.rafraichir();
      },
    } });
  },
};

/**
 * Une feuille à curseur : redessinée sans toucher au curseur qu'on fait glisser (redessiner tout le
 * remplacerait sous le doigt). Les autres éléments sont remplacés un par un ; si la forme change, tout.
 */
export function majGardantCurseur(ctx) {
  const corps = document.querySelector("#feuille .corps-feuille");
  const f = ctx.etat.feuille;
  if (!corps || !f?.rendu) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = f.rendu();
  const neuf = tmp.firstElementChild, vieux = corps.firstElementChild;
  if (!neuf || !vieux || neuf.children.length !== vieux.children.length) return ctx.redessiner();
  [...neuf.children].forEach((n, i) => {
    const v = vieux.children[i];
    if (v.tagName !== "INPUT" && v.outerHTML !== n.outerHTML) v.replaceWith(n.cloneNode(true));
  });
}

/** Vendre des parts aux joueurs, ou entrer en bourse (la feuille de CarteCapitalEnLigne). */
function feuilleCapital(ctx, d, p, mode) {
  const x = d.__enLigne;
  const m = L.monde.marche;
  const t = x.b.titre ? m.titres.find((y) => y.id === x.b.titre) : null;
  const gardee = t ? L.detenu(m, t.id) / t.actions : 1;
  const max = Math.max(1, Math.floor(gardee * 100));
  const valeur = x.b.valeur;
  let pc = Math.min(10, max), prix = Math.round(valeur / 100);
  const rendu = () => `<div class="pile" style="gap:14px">
    <div class="chiffres" style="font-size:28px">${pc} % du capital</div>
    <input type="range" class="el-curseur" min="1" max="${max}" step="1" value="${pc}" data-saisie="pcCapital" aria-label="Part du capital">
    ${mode === "parts" ? `<p class="aide">Prix demandé : ${montant(prix)} le pour-cent, soit ${montant(prix * pc)}. Valeur de la boîte : ${montant(valeur)}.</p>
      ${pilules("prixCapital", [0.8, 1, 1.2, 1.5].map((k) => [Math.round((valeur / 100) * k), k === 1 ? "Valeur" : `${k > 1 ? "+" : "−"}${Math.round(Math.abs(k - 1) * 100)} %`]), prix)}`
      : `<p class="aide">Le marché te paie ${montant(Math.round((valeur * pc) / 100))} tout de suite. Ensuite le cours suit les résultats de ta boîte et les ordres des joueurs.</p>`}
    ${gardee * 100 - pc < 50 ? `<p class="alerte" style="font-size:13px;font-weight:500">Attention : tu garderais moins de 50 %. Un joueur qui achète assez prend ta boîte.</p>` : ""}
    ${bouton("Confirmer", "confirmerCapital")}</div>`;
  ctx.feuille({ titre: mode === "parts" ? "Vendre des parts" : "Entrer en bourse", rendu, actions: {
    pcCapital(c, el) { pc = Number(el.value); majGardantCurseur(c); },
    prixCapital(c, el) { prix = Number(el.dataset.valeur); c.redessiner(); },
    async confirmerCapital(c) {
      const r = mode === "parts" ? await L.vendreParts(c, Number(p.id), pc, prix) : await L.introduire(c, Number(p.id), pc, ctx.etat.donnees?.t?.nom);
      if (r) return c.toast(r, "refus");
      c.fermerFeuille();
      c.toast(mode === "parts" ? "Parts mises en vente" : "Ta boîte entre en bourse", "gain");
      c.rafraichir();
    },
  } });
}

// La fiche d un bien loué à un joueur : renégocier, mettre fin au bail (définies plus haut, posées ici).
Object.assign(complements.bien.actions, actionsLoyer);
