// ══════════════════════════════════════════════════════════════════════
//  Les défis (1.19.5, D381) : EcranDefis.swift.
//
//  Tout vient du tableau « defis » du moteur (TableauDefis.swift), le
//  même que l'iPhone, en trois segments pour tenir en deux écrans : les
//  Succès (par catégorie, repliés ; une famille montre son prochain
//  succès), les Coffres (à ouvrir, puis les derniers ouverts) et les
//  Duels. D403 (1.19.21) : la semaine vit dans Objectifs (un seul tableau
//  de buts) ; `blocSemaine` la dessine là-bas, chaque défi s'y épingle.
//  Un duel passe par la famille « liens » (OperationLiens.duel) ; un
//  coffre, par la commande « coffre.ouvrir ».
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, segment, bouton, teintes } from "../ui.js?v=3e8bddd9";
import { apercu } from "../cosmetiques.js?v=3e8bddd9";

const montant = (c) => montantBrut(c).replace("-", "−");
let onglet = "succes";
let classementComplet = false;

const rarete = (p) => `<span class="cz-rarete" data-r="${p.rarete}">${esc(p.rareteNom)}</span>`;
const pc = (x) => `${Math.round(x * 100)} %`;
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const DRAPEAU = I('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>');
const COFFRE = I('<rect x="3.5" y="8" width="17" height="11.5" rx="2"/><path d="M3.5 12.5h17M10 12.5v2.5h4v-2.5M6 8l1.5-3.5h9L18 8"/>');

/** La tuile de l'accueil (TuileDefis). */
export function tuileDefis(t) {
  if (!t) return "";
  const l = [];
  if (t.coffresFermes.length) l.push(`${t.coffresFermes.length} coffre${t.coffresFermes.length > 1 ? "s" : ""} à ouvrir`);
  if (!l.length) l.push(`${t.succesObtenus} succès sur ${t.succesTotal}`);
  const detail = l.join(" · ");
  return `<button class="tuile tuile-defis" data-action="ouvrir" data-page="defis" aria-label="${esc(`Succès et coffres : ${detail}`)}">
    <span class="pastille df-pastille" style="--c:${teintes.equipe}">${DRAPEAU}</span>
    <span class="df-tuile-corps"><span class="df-tuile-l">Succès et coffres</span><span class="df-tuile-d">${esc(detail)}</span></span>
    ${t.coffresFermes.length ? `<span class="df-compte">${t.coffresFermes.length}</span>` : ""}
    <span class="chevron" aria-hidden="true">›</span></button>`;
}

// MARK: La semaine

function carteDefi(d, epingler) {
  return carte(`<div class="df-defi ${d.fait ? "fait" : ""}">
    <div class="df-rangee"><span class="df-genre">${esc(d.genreNom)}</span><span class="df-difficulte" data-d="${d.difficulte}">${esc(d.difficulteNom)}</span></div>
    <div class="df-rangee"><span class="df-nom">${esc(d.nom)}</span>${d.fait ? '<span class="df-coche" aria-label="Réussi">✓</span>' : ""}</div>
    <div class="df-detail">${esc(d.detail)}</div>
    <progress class="df-barre" max="100" value="${Math.round(d.progression * 100)}"></progress>
    <div class="df-rangee"><span class="df-avancement chiffres">${esc(d.avancement)}</span>
      <span class="df-recompense">+${montant(d.recompense.argent)} · ${d.recompense.prestige} prestige · ${esc(d.recompense.coffre)}</span></div>
    ${!d.fait && epingler ? `<div class="df-epingler">${epingler({ sorte: "defi", cible: d.id })}</div>` : ""}
  </div>`, { pad: true });
}

function lesTrois(s) {
  return carte(`<div class="df-trois">
    ${s.piece ? `<span class="df-trois-piece">${apercu(s.piece, { ferme: !s.complete })}</span>` : ""}
    <span class="df-trois-corps"><b>${s.complete ? "Semaine parfaite" : "Les trois défis"}</b>
      ${s.piece ? `<span class="df-trois-p">${esc(s.piece.nom)} ${rarete(s.piece)}</span>` : ""}
      <span class="aide">+${pc(s.bonusFocus)} sur ton focus la semaine prochaine, +${s.prestigeComplet} prestige</span></span>
  </div>`, { pad: true });
}

function classement(s) {
  const lignes = classementComplet ? s.classement : s.classement.slice(0, 5);
  return `<div><div class="section">Classement du monde</div>${carte(`<ol class="df-classement">${lignes.map((l) => `<li class="${l.moi ? "moi" : ""}">
      <span class="df-rang ${l.rang === 1 ? "or" : ""}">${l.rang}</span><span class="df-pseudo">${esc(l.pseudo)}</span><span class="df-l-detail">${esc(l.detail)}</span></li>`).join("")}</ol>
    ${s.classement.length > 5 ? `<button class="lien df-plus" data-action="plus">${classementComplet ? "Voir moins" : "Voir plus"}</button>` : ""}`, { pad: true })}</div>`;
}

function duels(t) {
  const o = t.optionsDuel;
  const cartes = t.duels.map((c) => carte(`<div class="df-duel">
    <div class="df-rangee"><span class="df-nom">${esc(c.titre)}</span><span class="df-statut ${c.aRepondre ? "a-repondre" : ""}">${esc(c.statutNom)}</span></div>
    ${c.detail ? `<div class="df-detail">${esc(c.detail)}</div>` : ""}
    ${c.lignes.length ? `<dl class="df-lignes">${c.lignes.map((l) => `<div><dt>${esc(l.libelle)}</dt><dd class="${l.ton === "bon" ? "gain" : l.ton === "mauvais" ? "perte" : ""}">${esc(l.valeur)}</dd></div>`).join("")}</dl>` : ""}
    ${c.gestes.filter((g) => !g.saisie).map((g) => `<button class="df-geste" data-action="geste" data-id="${esc(g.id)}" ${g.raison ? `disabled title="${esc(g.raison)}"` : ""}>${esc(g.libelle)}</button>`).join("")}
  </div>`, { pad: true })).join("");
  const lancer = o ? `${bouton("Lancer un duel", "duel", { desactive: !!o.raison || !o.adversaires.length })}
    ${o.raison ? `<p class="aide">${esc(o.raison)}</p>` : !o.adversaires.length ? '<p class="aide">Personne d\'autre dans ton monde pour l\'instant.</p>' : ""}` : "";
  return `<div class="pile df-duels"><div class="section">Duels</div>${cartes}${lancer}</div>`;
}

/** D403 : la semaine, dessinée dans Objectifs ; `epingler(but)` rend le bouton « Épingler » d'un défi. */
export function blocSemaine(s, epingler) {
  return s ? `<div class="df-tete"><div class="df-rangee"><span class="df-titre">${esc(s.titre)}</span><span class="aide chiffres">${esc(s.reste)}</span></div>
      <p class="aide">Les mêmes pour tous les joueurs de ton monde. Un nouveau tirage chaque lundi.</p>
      ${s.bonusActif ? `<p class="df-bonus">+${pc(s.bonusActif)} sur ton focus cette semaine</p>` : ""}</div>
    ${s.defis.map((d) => carteDefi(d, epingler)).join("")}${lesTrois(s)}${s.classement.length ? classement(s) : ""}`
    : '<div class="vide">Les défis de la semaine se jouent pendant une saison.</div>';
}

/** « Voir plus » du classement de la semaine. */
export function basculerClassement() { classementComplet = !classementComplet; }

/** D403 : l'onglet Duels, avec le chemin vers la semaine (dans Objectifs). */
function ongletDuels(t) {
  const s = t.semaine;
  const lien = `<button class="tuile tuile-defis" data-action="ouvrir" data-page="objectifs">
    <span class="pastille df-pastille" style="--c:${teintes.equipe}">${DRAPEAU}</span>
    <span class="df-tuile-corps"><span class="df-tuile-l">Les défis de la semaine</span>
      <span class="df-tuile-d">${esc(s ? `${s.faits} / ${s.defis.length} · dans Objectifs` : "Dans Objectifs, avec tes buts")}</span></span>
    <span class="chevron" aria-hidden="true">›</span></button>`;
  return lien + (t.optionsDuel || t.duels.length ? duels(t) : '<p class="aide df-centre">Les duels se lancent entre joueurs d\'un monde en ligne.</p>');
}

// MARK: Les succès

function ligneSucces(s) {
  const c = esc(s.couleurs[0] ?? "#C9CDD3");
  return `<li class="df-succes ${s.obtenu ? "obtenu" : ""}" style="--c1:${c}"><i class="df-point"></i>
    <span class="df-s-corps"><b>${esc(s.nom)}</b><small>${esc(s.detail)}</small></span>
    ${s.piece ? rarete(s.piece) : ""}<span class="df-palier">${esc(s.palierNom)}</span></li>`;
}

function famille(f) {
  const p = f.prochain;
  return `<details class="df-famille"><summary><span class="df-rangee"><b>${esc(f.nom)}</b><span class="aide chiffres">${f.obtenus} / ${f.total}</span></span>
      ${p ? `<progress class="df-barre" max="100" value="${Math.round(p.progression * 100)}" style="--c1:${esc(p.couleurs[0] ?? "#C9CDD3")}"></progress><small class="df-prochain">${esc(p.nom)} · ${esc(p.avancement)}</small>` : ""}</summary>
    <ul class="df-liste">${f.succes.map(ligneSucces).join("")}</ul></details>`;
}

function succes(t) {
  return `${carte(`<div class="df-rangee df-prestige"><span><b class="chiffres">${t.prestige}</b><span class="aide">points de prestige</span></span>
      <span class="df-droite"><b class="chiffres">${t.succesObtenus} / ${t.succesTotal}</b><span class="aide">succès à vie</span></span></div>`, { pad: true })}
    ${t.categories.map((c) => carte(`<details class="df-categorie"><summary class="df-rangee"><b>${esc(c.nom)}</b><span class="aide chiffres">${c.obtenus} / ${c.total}</span></summary>
      <div class="pile df-familles">${c.familles.map(famille).join("")}</div></details>`, { pad: true })).join("")}`;
}

// MARK: Les coffres

const couleurCoffre = (r) => (r >= 3 ? "df-c-epique" : r === 2 ? "df-c-rare" : "df-c-commun");

function coffres(t) {
  const fermes = t.coffresFermes.length ? t.coffresFermes.map((c) => carte(`<div class="df-coffre"><span class="df-coffre-i ${couleurCoffre(c.rarete)}">${COFFRE}</span>
      <span class="df-s-corps"><b>${esc(c.nom)}</b><small>${esc(c.source)}</small></span>
      <button class="df-ouvrir ${couleurCoffre(c.rarete)}" data-action="ouvrirCoffre" data-id="${esc(c.id)}">Ouvrir</button></div>`, { pad: true })).join("")
    : '<div class="vide">Aucun coffre à ouvrir pour l\'instant.</div>';
  const ouverts = t.coffresOuverts.length ? `<div><div class="section">Derniers ouverts</div>${t.coffresOuverts.map((c) => carte(`<div class="df-coffre">
      ${c.piece ? `<span class="df-ouvert-p">${apercu(c.piece)}</span>` : ""}
      <span class="df-s-corps"><b>${esc(c.piece?.nom ?? `${c.prestige ?? 0} points de prestige`)}</b><small>${esc(c.nom)}</small></span>
      ${c.piece ? rarete(c.piece) : ""}</div>`, { pad: true })).join("")}</div>` : "";
  return `<p class="aide">Jamais à vendre : de longues séries de focus, les défis de la semaine et tes cartes de fortune en donnent. Chacun cache une pièce que tu n'as pas.</p>
    ${fermes}${ouverts}`;
}

function revelation(c) {
  if (!c) return "";
  return `<div class="pile df-revele">
    <span class="df-revele-t">${esc(c.nom.toUpperCase())}</span>
    ${c.piece ? `<span class="df-revele-p">${apercu(c.piece, { grand: true })}</span><b class="df-revele-n">${esc(c.piece.nom)}</b>
      <span class="cz-rarete" data-r="${c.piece.rarete}">${esc(c.piece.rareteNom)} · ${esc(c.piece.sorteNom)}</span><p class="aide">À équiper dans Personnaliser.</p>`
      : `<b class="df-revele-prestige chiffres">+${c.prestige ?? 0}</b><p class="aide">points de prestige : tu as déjà tout ce que ce coffre pouvait donner.</p>`}
  </div>`;
}

function feuilleDuel(ctx, o) {
  const options = (l) => l.map(([v, t]) => `<option value="${esc(String(v))}">${esc(t)}</option>`).join("");
  return ctx.feuille({
    titre: "Un duel",
    contenu: `<div class="pile">
      <label class="champ"><span class="etiquette">Contre</span><select id="df-adv">${options(o.adversaires.map((a) => [a.id, a.pseudo]))}</select></label>
      <label class="champ"><span class="etiquette">Objectif</span><select id="df-obj">${options(o.objectifs.map((x) => [x.id, x.nom]))}</select></label>
      <p class="aide" id="df-obj-d">${esc(o.objectifs[0]?.detail ?? "")}</p>
      <label class="champ"><span class="etiquette">Durée</span><select id="df-jours">${options(o.jours.map((j, i) => [j, o.joursNoms[i]]))}</select></label>
      <label class="champ"><span class="etiquette">Mise</span><select id="df-mise">${options(o.mises.map((m) => [m, m === 0 ? "Sans mise" : montant(m)]))}</select></label>
      <p class="aide">Vous misez la même somme ; le gagnant rafle tout. À égalité, chacun reprend la sienne.</p>
      ${bouton("Lancer le duel", "lancer")}</div>`,
    actions: {
      lancer: () => {
        const v = (id) => document.getElementById(id)?.value ?? "";
        const a = o.adversaires.find((x) => x.id === v("df-adv"));
        if (!a) return null;
        return ctx.decider("liens", { duel: { joueur: a.id, pseudo: a.pseudo, objectif: v("df-obj"), jours: Number(v("df-jours")), mise: Number(v("df-mise")) } },
          { succes: `Duel lancé contre ${a.pseudo}` });
      },
    },
  });
}

export const pages = {
  defis: {
    titre: "Défis",
    css: ["cosmetiques", "defis"],
    async donnees(ctx) { return { t: await ctx.tableau("defis") }; },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Défis")}<div class="vide">Les défis se chargent…</div>`;
      const corps = onglet === "coffres" ? coffres(t) : onglet === "duels" ? ongletDuels(t) : succes(t);
      return `${entetePousse("Défis")}
      <div class="pile df-page">
        ${segment([["succes", "Succès"], ["coffres", "Coffres"], ["duels", "Duels"]], onglet, "onglet", { defilant: false })}
        ${corps}
      </div>`;
    },
    actions: {
      onglet: (ctx, b) => { onglet = b.dataset.valeur; ctx.redessiner(); },
      plus: (ctx) => { classementComplet = !classementComplet; ctx.redessiner(); },
      duel: (ctx, b, d) => (d.t?.optionsDuel ? feuilleDuel(ctx, d.t.optionsDuel) : null),
      geste: (ctx, b, d) => {
        const g = d.t?.duels.flatMap((c) => c.gestes).find((x) => x.id === b.dataset.id);
        return g && !g.raison ? ctx.decider("liens", g.operation, { succes: g.libelle }) : null;
      },
      async ouvrirCoffre(ctx, b) {
        const r = await ctx.jouer("coffre.ouvrir", { id: b.dataset.id });
        if (!r) return;
        ctx.sons.jouer("piece");
        const t = await ctx.tableau("defis");
        const c = t?.coffresOuverts.find((x) => x.id === b.dataset.id);
        await ctx.rafraichir();
        if (c) ctx.feuille({ titre: "Coffre ouvert", contenu: revelation(c) });
      },
    },
  },
};
