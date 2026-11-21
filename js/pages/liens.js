// ══════════════════════════════════════════════════════════════════════
//  Entre joueurs (RNT-399, D349) : EcranLiens.swift.
//
//  Tout vient du tableau « liens » du moteur (TableauLiens.swift), le
//  même que l'iPhone : une carte par lien (parrainage, rivalité, rumeur,
//  espion, cagnotte, associé, colocation) avec ses lignes et ses gestes,
//  et, ouverte sur un joueur, ce qu'on peut lancer avec lui et sur ses
//  boîtes. Un geste porte son opération (famille « liens ») ; un geste à
//  montant la complète. Ce qui part au serveur : enligne.js,
//  synchroniserLiens.
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, bouton, confirmer, champEuros, lireEuros } from "../ui.js?v=3e8bddd9";

const montant = (c) => montantBrut(c).replace("-", "−");

/** La tuile de l'accueil. */
export function tuileLiens(t) {
  if (!t || !t.disponible) return "";
  return `<button class="tuile tuile-liens" data-action="ouvrir" data-page="liens" aria-label="${esc(`${t.tuileTitre} : ${t.tuileDetail}`)}">
    <span class="lj-tuile-corps"><span class="lj-tuile-l">${esc(t.tuileTitre)}</span><span class="lj-tuile-d">${esc(t.tuileDetail)}</span></span>
    <span class="chevron" aria-hidden="true">›</span></button>`;
}

const boutonGeste = (g) => `<button class="lj-geste ${g.destructif ? "lj-danger" : ""}" data-action="geste" data-id="${esc(g.id)}" ${g.raison ? "disabled" : ""}
  ${g.raison ? `title="${esc(g.raison)}"` : ""}><span>${esc(g.libelle)}</span>${g.prix ? `<span class="chiffres">${montant(g.prix)}</span>` : ""}</button>
  ${g.raison ? `<span class="lj-raison">${esc(g.raison)}</span>` : ""}`;

function carteLien(c) {
  return carte(`<div class="lj-carte" data-lien="${esc(c.id)}" data-sorte="${esc(c.sorte)}">
    <div class="lj-tete"><span class="lj-sorte">${esc(c.sorteNom)}</span><span class="lj-statut ${c.aRepondre ? "lj-a-repondre" : ""}">${esc(c.statutNom)}</span></div>
    <div class="lj-titre">${esc(c.titre)}</div>
    ${c.detail ? `<div class="lj-detail">${esc(c.detail)}</div>` : ""}
    ${c.progression != null ? `<progress class="lj-progression" max="100" value="${Math.round(c.progression * 100)}"></progress>` : ""}
    ${c.lignes.length ? `<dl class="lj-lignes">${c.lignes.map((l) => `<div class="lj-ligne"><dt>${esc(l.libelle)}</dt><dd class="${l.ton === "bon" ? "gain" : l.ton === "mauvais" ? "perte" : ""}">${esc(l.valeur)}</dd></div>`).join("")}</dl>` : ""}
    ${c.gestes.length ? `<div class="lj-gestes">${c.gestes.map(boutonGeste).join("")}</div>` : ""}
  </div>`);
}

function cible(c) {
  return `<div><div class="section lj-section">Avec ${esc(c.pseudo)}</div>${carte(`<div class="lj-gestes lj-cible">${c.gestes.map(boutonGeste).join("")}</div>`)}</div>
    ${c.boites.length ? `<div><div class="section lj-section">Ses boîtes</div>${c.boites.map((b) => carte(`<div class="lj-carte lj-boite">
      <div class="lj-titre">${esc(b.nom)}</div><div class="lj-detail">${esc(b.ville)} · vaut environ ${montant(b.valeur)}</div>
      <div class="lj-gestes">${b.gestes.map(boutonGeste).join("")}</div></div>`)).join("")}</div>` : ""}`;
}

/** Tous les gestes de la page, par id. */
function gestes(t) {
  const l = [...t.cartes.flatMap((c) => c.gestes), ...(t.cible?.gestes ?? []), ...(t.cible?.boites ?? []).flatMap((b) => b.gestes)];
  return new Map(l.map((g) => [g.id, g]));
}

/** Le geste à montant, complété (miroir de OperationLiens.avecMontant). */
function avecMontant(op, m) {
  const [cas, x] = Object.entries(op)[0];
  const champ = { deposer: "montant", baisserObjectif: "objectif", voterVente: "prix", defier: "mise" }[cas];
  return champ ? { [cas]: { ...x, [champ]: m } } : op;
}

export const pages = {
  liens: {
    titre: "Entre joueurs",
    css: "liens",
    async donnees(ctx, p) {
      return { t: await ctx.tableau("liens", p?.joueur ? { joueur: String(p.joueur), pseudo: String(p.pseudo ?? "") } : {}) };
    },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Entre joueurs")}<div class="vide">Les liens entre joueurs se tissent pendant une saison.</div>`;
      const vivantes = t.cartes.filter((c) => !["finie", "refusee", "annulee", "expiree"].includes(c.statut));
      const passees = t.cartes.filter((c) => ["finie", "refusee", "annulee", "expiree"].includes(c.statut));
      return `${entetePousse("Entre joueurs")}
      <div class="pile lj-page">
        ${t.raison ? `<p class="aide lj-centre">${esc(t.raison)}</p>` : ""}
        ${t.cible ? cible(t.cible) : ""}
        ${vivantes.length ? `<div><div class="section lj-section">En cours</div>${vivantes.map(carteLien).join("")}</div>`
          : `<div class="lj-vide"><div class="lj-vide-t">Aucun lien pour l'instant</div><p class="aide">Ouvre le profil d'un joueur de ton monde : « Entre vous » propose de le parrainer, de le défier, de vous associer, de partager un logement ou une cagnotte.</p></div>`}
        ${t.enAttente ? `<p class="aide lj-centre">${t.enAttente} envoi${t.enAttente > 1 ? "s" : ""} en route vers le serveur.</p>` : ""}
        ${t.valeur ? `<p class="aide lj-centre">Dans ta fortune : ${montant(t.valeur)} (mises, cagnottes et parts communes).</p>` : ""}
        ${passees.length ? `<div><div class="section lj-section">Terminés</div>${passees.map(carteLien).join("")}</div>` : ""}
        <div><div class="section lj-section">Comment ça marche</div>${carte(`<dl class="lj-lignes lj-aide">${t.aide.map((l) => `<div class="lj-ligne"><dt>${esc(l.libelle)}</dt><dd>${esc(l.valeur)}</dd></div>`).join("")}</dl>`)}</div>
      </div>`;
    },
    actions: {
      async geste(ctx, b, d) {
        const g = gestes(d.t).get(b.dataset.id);
        if (!g || g.raison) return null;
        if (g.saisie === "montant") {
          return ctx.feuille({ titre: g.libelle, contenu: `<div class="pile">${champEuros("lj-montant", { etiquette: "Montant" })}
              ${g.minimum != null && g.maximum != null && g.maximum < 1e14 ? `<p class="aide">Entre ${montant(g.minimum)} et ${montant(g.maximum)}.</p>` : ""}
              ${bouton("Valider", "valider")}</div>`,
            actions: { valider: () => { const m = lireEuros("lj-montant"); if (m > 0) return ctx.decider("liens", avecMontant(g.operation, m), { succes: g.libelle }); } } });
        }
        if (g.saisie === "cagnotte") {
          return ctx.feuille({ titre: "Monter une cagnotte", contenu: `<div class="pile">
              <label class="champ"><span class="etiquette">Ce que vous achetez ensemble</span><input id="lj-titre" type="text" maxlength="60" placeholder="Un appartement à Lyon"></label>
              ${champEuros("lj-objectif", { etiquette: "Objectif" })}${champEuros("lj-depot", { etiquette: "Ton premier versement" })}
              <p class="aide">Au moins ${montant(g.minimum ?? 0)}. Sept jours pour la remplir ; ensuite tu achètes, puis tu rattaches le bien : chacun en a sa part.</p>
              ${bouton("Lancer la cagnotte", "valider")}</div>`,
            actions: { valider: () => {
              const titre = document.getElementById("lj-titre")?.value?.trim() ?? "";
              const op = Object.values(g.operation)[0];
              return ctx.decider("liens", { creerCagnotte: { ...op, titre, objectif: lireEuros("lj-objectif"), depot: Math.max(0, lireEuros("lj-depot") || 0) } }, { succes: "Cagnotte lancée" });
            } } });
        }
        if (g.destructif && !(await confirmer({ titre: g.libelle, danger: true, oui: g.libelle, texte: "C'est définitif." }))) return null;
        return ctx.decider("liens", g.operation, { succes: g.libelle });
      },
    },
  },
};
