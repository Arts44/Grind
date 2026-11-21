// ══════════════════════════════════════════════════════════════════════
//  La famille (1.19, D376) : EcranFamille.swift.
//
//  Tout vient du tableau « famille » du moteur (TableauFamille.swift), le
//  même que l'iPhone : la garde pendant le focus et le coût de la semaine,
//  une carte par enfant, adopter, la saison suivante ; la fiche d'un enfant
//  (page « enfant ») en trois segments : Ensemble, École, Avenir. Les gestes
//  passent par la famille « couple » (OperationCouple).
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, petit, teintes, interrupteur, segment, jaugeFine, attrsDonnees } from "../ui.js?v=3e8bddd9";

const montant = (c) => montantBrut(c).replace("-", "−");
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SF = {
  famille: I('<circle cx="8" cy="6" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M4.5 20v-5.5a3.5 3.5 0 0 1 7 0V20M13.5 20v-3.5a3 3 0 0 1 6 0V20M11.5 15h2"/>'),
  maison: I('<path d="M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>'),
  alerte: I('<path d="M12 4 3 19.5h18zM12 10v4.5M12 17.2v.3"/>'),
  main: I('<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10.5V5a1.5 1.5 0 0 1 3 0v5.5M14 10.5V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.8-2.4L4 15a1.5 1.5 0 0 1 2.3-1.9L8 15"/>'),
  bouclier: I('<path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6zM9 12l2.2 2.2L15.5 10"/>'),
  doc: I('<path d="M7 3.5h7l4 4V20.5H7zM14 3.5V8h4M9.5 12.5h6M9.5 16h6"/>'),
  valise: I('<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/>'),
  etoile: I('<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>'),
  cle: I('<circle cx="8" cy="15" r="3.5"/><path d="m10.5 12.5 8-8M15.5 7.5l2 2M17.5 5.5l2 2"/>'),
};
const pastille = (icone, teinte) => `<span class="pastille" style="--c:${teinte}">${SF[icone] ?? SF.etoile}</span>`;
const ans = (n) => `${n} an${n > 1 ? "s" : ""}`;

// D388 (Arthur 16/11) : plus d'avatar (l'initiale dans un cercle, comme AvatarCouple) : le prénom suffit.

/** D376 : la ligne Famille du groupe Vie de l'accueil (TuileFamille). */
export function tuileFamille(t) {
  if (!t) return "";
  return `<button class="tuile tuile-couple" data-action="ouvrir" data-page="famille" aria-label="${esc(`Famille : ${t.tuileTitre}, ${t.tuileDetail}`)}">
    ${pastille("famille", teintes.equipe)}
    <span class="cp-tuile-corps"><span class="cp-tuile-l">Famille</span><span class="cp-tuile-t">${esc(t.tuileTitre)}</span>
      <span class="cp-tuile-d ${t.gardeTon === "alerte" ? "alerte" : ""}">${esc(t.tuileDetail)}</span></span>
    <span class="chevron" aria-hidden="true">›</span></button>`;
}

function entete(t) {
  return carte(`<div class="fa-entete">
    <div class="fa-rangee"><span class="section fa-section">Cette semaine</span><span class="fa-total chiffres">${montant(t.coutSemaine)}</span></div>
    ${t.garde ? `<p class="fa-note ${t.gardeTon === "alerte" ? "alerte" : ""}">${t.gardeTon === "alerte" ? SF.alerte : SF.main}Pendant le focus : ${esc(t.garde)}</p>` : ""}
    ${t.nounouUtile || t.nounou ? interrupteur({ titre: `Nounou · ${montant(t.nounouPrix)} par semaine`, actif: t.nounou, action: "nounou" }) : ""}
    ${t.contraceptionPossible ? interrupteur({ titre: `Contraception · ${montant(t.contraceptionPrix)} par semaine`, detail: t.contraceptionDetail, actif: t.contraception, action: "contraception" }) /* D456 : ici, plus sur le couple */ : ""}</div>`, { classe: "cp-carte-pad" });
}

function ligneEnfant(e) {
  return `<button class="fa-ligne" data-action="ouvrir" data-page="enfant" data-p='${esc(JSON.stringify({ id: e.id }))}' aria-label="${esc(`${e.prenom}, ${e.age} ans, ${e.statut}, ${e.detail}`)}">
    <span class="fa-corps"><span class="fa-nom">${esc(e.prenom)}, ${ans(e.age)}</span>
      <span class="fa-detail">${esc(e.tranche)} · ${esc(e.statut)}</span>
      <span class="fa-detail ${e.evenement ? "fa-decision" : e.ton === "alerte" ? "alerte" : "t3"}">${esc(e.detail)}</span></span>
    ${e.coutSemaine > 0 ? `<span class="fa-prix chiffres">${montant(e.coutSemaine)}</span>` : ""}
    <span class="chevron" aria-hidden="true">›</span></button>`;
}

function adoption(t) {
  return carte(`<div class="fa-rangee fa-adoption">${pastille("maison", teintes.equipe)}
    <span class="fa-corps"><span class="fa-nom">${t.adoption ? `Adoption : ${esc(t.adoption.toLowerCase())}` : "Adopter"}</span>
      <span class="aide">${esc(t.adoption ? "Le dossier est accepté : l'enfant arrive bientôt." : (t.refusAdoption ?? t.adoptionDetail))}</span></span>
    ${t.adoption ? "" : petit(montant(t.adoptionPrix), "adopter", { plein: true, desactive: !!t.refusAdoption })}</div>`, { classe: "cp-carte-pad" });
}

// MARK: La fiche d'un enfant

let rubrique = "ensemble";

function evenement(ev, e) {
  return carte(`<div class="fa-evenement"><p class="fa-nom">${esc(ev.titre)}</p><p class="aide">${esc(ev.texte)}</p>
    ${ev.choix.map((c) => `<button class="cp-replique fa-choix" data-action="choix" ${attrsDonnees({ enfant: e.id, k: String(c.id) })}><span>${esc(c.texte)}</span>${c.prix > 0 ? `<span class="chiffres t2">${montant(c.prix)}</span>` : ""}</button>`).join("")}</div>`, { classe: "cp-carte-pad" });
}

function ensemble(e) {
  return `${carte(e.sorties.map((s) => `<div class="fa-rangee fa-option">${pastille("etoile", teintes.image)}
      <span class="fa-corps"><span class="fa-nom-petit">${esc(s.nom)}</span><span class="aide">${esc(s.detail)}</span></span>
      ${petit(montant(s.prix), "sortie", { donnees: { enfant: e.id, id: s.id, nom: s.nom, prenom: e.prenom }, desactive: !s.ouverte })}</div>`).join(""))}
    ${e.souvenirs.length ? `<div class="section">L'album</div>${e.souvenirs.map((s) => `<div class="fa-rangee fa-souvenir"><span>${esc(s.titre)}</span><span class="t3">${esc(s.quand)}</span></div>`).join("")}` : ""}`;
}

function ecole(e) {
  const talents = `<div class="fa-talents">${e.talents.map((x) => carte(`<span class="fa-nom-petit">${esc(x.nom)}</span>${jaugeFine(x.valeur / 100, teintes.equipe)}<span class="t3 chiffres fa-mini">${x.valeur}/100</span>`, { classe: "fa-talent" })).join("")}</div>`;
  return `${e.bulletin ? `<p class="fa-note">${SF.doc}Dernier bulletin : ${esc(e.bulletin)}</p>` : ""}${talents}
    ${e.ecole ? carte(interrupteur({ titre: "École privée", detail: `${montant(e.ecolePrix)} par semaine : des talents qui montent deux fois plus vite.`, actif: e.ecolePrivee, action: "ecole", donnees: { enfant: e.id, privee: e.ecolePrivee ? "0" : "1" } }))
      : e.parti ? "" : `<p class="aide">L'école commence à 3 ans.</p>`}
    ${e.parti ? "" : carte(e.activites.map((a) => interrupteur({ titre: a.nom, detail: a.ouverte ? `${montant(a.prix)} · ${a.detail}` : a.detail, actif: a.active, action: "activite", desactive: !a.ouverte, donnees: { enfant: e.id, id: a.id, oui: a.active ? "0" : "1" } })).join(""))}`;
}

function avenir(e, t) {
  return `${e.metier ? `<p class="fa-note">${SF.valise}${esc(e.metier)}${e.salaire ? ` · ${montant(e.salaire)} par semaine` : ""}</p>` : `<p class="aide">À 18 ans, ${esc(e.prenom)} part de la maison avec un métier selon son meilleur talent.</p>`}
    ${e.boite ? `<p class="fa-note">${SF.cle}Dirige ${esc(e.boite)}</p>` : e.peutReprendre ? carte(`<div class="pile"><div class="section">Reprendre une boîte</div><p class="aide">${esc(e.reprise)}</p>
      <div class="cp-options">${t.boites.map((b) => `<button class="cp-option" data-action="confier" ${attrsDonnees({ enfant: e.id, boite: String(b.id), nom: b.nom, prenom: e.prenom })}><span>${esc(b.nom)}</span><span class="t2">Lui confier</span></button>`).join("")}</div></div>`, { classe: "cp-carte-pad" }) : ""}
    ${e.peutHeriter ? carte(interrupteur({ titre: "Héritier de la saison suivante", detail: "Une part de ta fortune finale l'attend au premier jour de la saison suivante.", actif: e.heritier, action: "heritier", donnees: { enfant: e.heritier ? "" : e.id } })) : ""}`;
}

const actions = {
  nounou: (ctx, b, d) => ctx.decider("couple", { nounou: { oui: !d.t.nounou } }, { succes: d.t.nounou ? undefined : "Nounou engagée" }),
  contraception: (ctx, b, d) => ctx.decider("couple", { contraception: { oui: !d.t.contraception } }, { succes: d.t.contraception ? undefined : "Contraception : c'est noté" }), // D456
  adopter: (ctx) => ctx.decider("couple", { adopter: {} }, { succes: "Dossier déposé" }),
  garderFamille: (ctx, b, d) => ctx.decider("couple", { garderFamille: { oui: !d.t.garder } }),
  choix: (ctx, b) => ctx.decider("couple", { choixEnfant: { enfant: b.dataset.enfant, choix: Number(b.dataset.k) } }),
  sortie: (ctx, b) => ctx.decider("couple", { sortieEnfant: { enfant: b.dataset.enfant, id: b.dataset.id } }, { succes: `${b.dataset.nom} avec ${b.dataset.prenom}` }),
  ecole: (ctx, b) => ctx.decider("couple", { ecole: { enfant: b.dataset.enfant, privee: b.dataset.privee === "1" } }),
  activite: (ctx, b) => ctx.decider("couple", { activiteEnfant: { enfant: b.dataset.enfant, id: b.dataset.id, oui: b.dataset.oui === "1" } }),
  confier: (ctx, b) => ctx.decider("couple", { confierBoite: { enfant: b.dataset.enfant, boite: Number(b.dataset.boite) } }, { succes: `${b.dataset.prenom} dirige ${b.dataset.nom}` }),
  heritier: (ctx, b) => ctx.decider("couple", { heritier: b.dataset.enfant ? { enfant: b.dataset.enfant } : {} }),
  rubrique: (ctx, b) => { rubrique = b.dataset.valeur; ctx.rafraichir(); },
};

export const pages = {
  famille: {
    titre: "Famille",
    css: ["couple", "famille"],
    async donnees(ctx) { return { t: await ctx.tableau("famille") }; },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Famille")}<div class="vide cp-vide-page">La famille se vit pendant une saison.</div>`;
      return `${entetePousse("Famille")}
      <div class="pile fa-page">
        ${entete(t)}
        ${t.enfants.length ? carte(t.enfants.map(ligneEnfant).join(`<div class="filet fa-filet"></div>`)) : ""}
        ${adoption(t)}
        ${carte(interrupteur({ titre: "Garder ta famille", detail: t.heritier ? `À la saison suivante, tes enfants te suivent ; ${t.heritier} hérite.` : "Activé : à la saison suivante, tes enfants te suivent. Sinon tu repars de zéro.", actif: t.garder, action: "garderFamille" }))}
        <p class="aide cp-centre">${esc(t.note)}</p>
      </div>`;
    },
    actions,
  },
  enfant: {
    titre: "Famille",
    css: ["couple", "famille"],
    async donnees(ctx, p) { return { t: await ctx.tableau("famille"), id: p?.id }; },
    rendu(d) {
      const t = d.t;
      const e = t?.enfants.find((x) => x.id === d.id);
      if (!e) return `${entetePousse("Famille")}<div class="vide cp-vide-page">Cet enfant n'est plus là.</div>`;
      const corps = rubrique === "ecole" ? ecole(e) : rubrique === "avenir" ? avenir(e, t) : ensemble(e);
      return `${entetePousse(e.prenom)}
      <div class="pile fa-page">
        <div class="fa-rangee fa-tete"><span class="fa-corps"><span class="fa-titre">${esc(e.prenom)}, ${ans(e.age)}</span>
          <span class="aide">${esc(e.tranche)} · ${esc(e.statut)}${e.adopte ? ` · adopté${e.fille ? "e" : ""}` : ""}</span>
          ${e.parti ? "" : `<span class="aide">Lien ${e.lien}/100 · ${montant(e.coutSemaine)} par semaine</span>`}</span></div>
        ${e.evenement ? evenement(e.evenement, e) : ""}
        ${segment([["ensemble", "Ensemble"], ["ecole", "École"], ["avenir", "Avenir"]], rubrique, "rubrique", { defilant: false })}
        ${corps}
      </div>`;
    },
    actions,
  },
};
