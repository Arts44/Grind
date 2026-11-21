// ══════════════════════════════════════════════════════════════════════
//  « Ma vie amoureuse » (D456 ; avant : D346) : EcranCouple.swift,
//  EcranRencontres.swift, FichePersonne.swift.
//
//  Trois pages, les mêmes tableaux que l'iPhone : « couple » (ta relation
//  ou célibataire, ta double vie, ce qui presse, trois cartes : Rencontres,
//  Entourage, Famille), « rencontres » (la rencontre qui attend, le bar,
//  ceux à revoir) et « personne » (UNE fiche pour une rencontre, un proche,
//  ton partenaire ou ta double vie : les mêmes gestes pour tout le monde).
//  Les gestes passent par la famille « couple » (OperationCouple) ; ce qui
//  touche un joueur part au serveur (enligne.js, synchroniserCouple).
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, bouton, petit, teintes, confirmer, champEuros, lireEuros, menuAncre, interrupteur, jaugeFine, ligne } from "../ui.js?v=3e8bddd9";
import { dessinJeu } from "../icones-jeu.js?v=3e8bddd9"; // D357 : les actions du fil en icônes Reicon

const montant = (c) => montantBrut(c).replace("-", "−");
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SF = {
  heart: I('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
  gift: I('<rect x="3.5" y="9" width="17" height="11" rx="2"/><path d="M3.5 13h17M12 9v11M12 9c-2.5 0-4.5-1-4.5-3a2 2 0 0 1 4.5 0zM12 9c2.5 0 4.5-1 4.5-3a2 2 0 0 0-4.5 0z"/>'),
  person: I('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  briefcase: I('<rect x="3" y="7.5" width="18" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 13h18"/>'),
  ring: I('<circle cx="12" cy="14" r="6"/><path d="M9.5 4h5l1.5 2.5-4 2.5-4-2.5z"/>'),
  bank: I('<path d="M3 9 12 4l9 5M5 9.5V18M9.5 9.5V18M14.5 9.5V18M19 9.5V18M3 20.5h18"/>'),
  sparkles: I('<path d="M10 3l1.5 4.5L16 9l-4.5 1.5L10 15l-1.5-4.5L4 9l4.5-1.5zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>'),
  broken: I('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6l-1.5 3.6 3 2-1.5 3.5M12 7.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10"/>'),
  // D359 : la photo et l'appel (les mêmes symboles que l'iPhone, camera et phone).
  camera: I('<path d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4z"/><circle cx="12" cy="13" r="3.2"/>'),
  phone: I('<path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 13l4 1.5v3A2 2 0 0 1 18 19.5 15.5 15.5 0 0 1 4.5 6 2 2 0 0 1 6.5 4z"/>'),
  // D456 : la page « Ma vie amoureuse », ce qui presse, la fiche.
  message: I('<path d="M4 5h16v11H8l-4 4z"/>'),
  calendar: I('<rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>'),
  hand: I('<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10.5V5a1.5 1.5 0 0 1 3 0v5.5M14 10.5V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.8-2.4L4 15a1.5 1.5 0 0 1 2.3-1.9L8 15"/>'),
  eye: I('<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 4l16 16"/>'),
  amis: I('<circle cx="9" cy="8.5" r="3"/><circle cx="16.5" cy="9.5" r="2.3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 7 0"/>'),
  famille: I('<circle cx="8" cy="6" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M4.5 20v-5.5a3.5 3.5 0 0 1 7 0V20M13.5 20v-3.5a3 3 0 0 1 6 0V20M11.5 15h2"/>'),
  alerte: I('<path d="M12 4 3 19.5h18zM12 10v4.5M12 17.2v.3"/>'),
};
const pastille = (icone, teinte) => `<span class="pastille" style="--c:${teinte}">${SF[icone] ?? SF.heart}</span>`;

// D388 (Arthur 16/11) : plus d'avatar (l'initiale dans un cercle) ni de visage dessiné (D354, VisagePNJ) : le prénom
// suffit. Le moteur garde `intime.avatar` (les couleurs tirées), il n'est plus dessiné.

/** La tuile de l'accueil (TuileCouple) : « Vie amoureuse ». */
export function tuileCouple(t) {
  if (!t) return "";
  const p = t.partenaire;
  return `<button class="tuile tuile-couple" data-action="ouvrir" data-page="couple" aria-label="${esc(`Vie amoureuse : ${t.tuileTitre}, ${t.tuileDetail}`)}">
    ${pastille(p || t.rencontre ? "heart" : "person", teintes.image) /* D388 : plus de visage, l'icône du couple */}
    <span class="cp-tuile-corps"><span class="cp-tuile-l">Vie amoureuse</span><span class="cp-tuile-t">${esc(t.tuileTitre)}</span>
      <span class="cp-tuile-d ${p?.ton === "alerte" ? "alerte" : ""}">${esc(t.tuileDetail)}</span></span>
    <span class="chevron" aria-hidden="true">›</span></button>`;
}

const pFiche = (id) => `data-action="ouvrir" data-page="personne" data-p='${esc(JSON.stringify({ id }))}'`;
const tonTeinte = (ton) => (ton === "alerte" ? "var(--alerte)" : ton === "attention" ? "var(--or)" : "var(--image)");

// ══ D456 : « Ma vie amoureuse » ════════════════════════════════════════

/** En haut : ta relation (ou célibataire). Toucher ton partenaire ouvre sa fiche. */
function relation(t) {
  const p = t.partenaire;
  if (p) {
    return `<button class="carte cp-relation-carte" ${pFiche(p.personne.id)} id="cp-partenaire" aria-label="${esc(`${p.personne.prenom}, ${p.etapeNom}, ${p.motRelation}`)}">
      <span class="cp-rangee"><span class="cp-prenom">${esc(p.personne.prenom)}</span><span class="chevron" aria-hidden="true">›</span></span>
      <span class="cp-etape">${esc(p.etapeNom)} · ${esc(p.depuis.toLowerCase())}</span>
      ${jaugeFine(p.relation / 100, tonTeinte(p.ton))}
      <span class="cp-rangee"><span class="cp-mot" style="--c:${tonTeinte(p.ton)}">${esc(p.motRelation)}</span><span class="chiffres t2">${p.relation}</span></span></button>`;
  }
  if (t.joueur) return joueur(t.joueur, t);
  return carte(`<div class="cp-vide">${pastille("heart", teintes.image)}<div class="cp-vide-t">Célibataire</div><div class="cp-mon-age">Toi, ${t.age} ans</div></div>`, { classe: "cp-carte-pad" });
}

const ligneDoubleVie = (d) => `<button class="carte cp-ligne" ${pFiche(d.personne.id)} id="cp-double-vie">
  ${pastille("eye", teintes.danger)}<span class="cp-corps"><span class="cp-nom">Ta double vie : ${esc(d.personne.prenom)}</span>
  <span class="cp-detail">${esc(d.motRelation)} · risque ${d.risqueIci} % près de chez vous</span></span><span class="chevron" aria-hidden="true">›</span></button>`;

function blocScene(s) {
  return carte(`<div class="cp-scene" id="cp-scene"><div class="section cp-section">${esc(s.prenom)} veut te parler</div><p class="aide">${esc(s.motif)}</p>
    <p class="cp-question">« ${esc(s.question)} »</p>
    <div class="cp-boutons">${petit("Mentir", "scene", { plein: true, donnees: { choix: "mentir" } })}${petit("Avouer", "scene", { donnees: { choix: "avouer" } })}${petit("Partir", "scene", { donnees: { choix: "partir" } })}</div></div>`, { classe: "cp-carte-pad" });
}

/** D456 (Arthur, 20/11) : son ex refait surface : lui en parler, ou laisser couler (chacun son risque). */
function blocExRevenu(x) {
  return carte(`<div class="cp-scene" id="cp-ex-revenu"><div class="section cp-section">${esc(x.prenom)} refait surface</div><p>${esc(x.texte)}</p>
    <div class="cp-boutons">${petit(`Lui en parler · risque ${x.risqueParler} %`, "exRevenu", { plein: true, donnees: { parler: "1" } })}${petit(`Laisser couler · risque ${x.risqueCouler} %`, "exRevenu", { donnees: { parler: "0" } })}</div>
    <p class="aide">En parler peut froisser ; laisser couler, c'est risquer que ça reprenne entre eux.</p></div>`, { classe: "cp-carte-pad" });
}

const ICONE_PRESSE = { message: "message", rdv: "calendar", rencontre: "heart", dispute: "broken", demande: "hand", envie: "sparkles", anniversaire: "gift" };

/** Ce qui presse (Gottman : répondre d'abord) : quatre lignes, puis « Voir les N autres ». */
function presse(t) {
  const l = (t.presse ?? []).filter((x) => x.sorte !== "scene");
  if (!l.length) return "";
  const ligne = (x) => {
    const attrs = x.sorte === "message" && x.personne ? `data-action="messages" data-id="${esc(x.personne)}"`
      : x.sorte === "rencontre" ? `data-action="ouvrir" data-page="rencontres"` : x.personne ? pFiche(x.personne) : "";
    return `<button class="cp-presse" ${attrs}>${pastille(ICONE_PRESSE[x.sorte] ?? "alerte", x.ton === "alerte" ? teintes.danger : x.ton === "attention" ? teintes.vente : teintes.image)}
      <span class="cp-corps"><span class="cp-nom">${esc(x.titre)}</span>${x.detail ? `<span class="cp-detail">${esc(x.detail)}</span>` : ""}</span><span class="chevron" aria-hidden="true">›</span></button>`;
  };
  return `<div id="cp-presse"><div class="section cp-section">Ce qui presse</div>${carte(`${l.slice(0, 4).map(ligne).join("")}
    ${l.length > 4 ? `<details class="cp-plus-conv"><summary class="cp-detail">Voir les ${l.length - 4} autres</summary>${l.slice(4).map(ligne).join("")}</details>` : ""}`, { classe: "cp-liste" })}</div>`;
}

/** Les trois cartes : Rencontres, Entourage, Famille. */
function cartes(t) {
  const PAGE = { rencontres: "rencontres", entourage: "cercle", famille: "famille" };
  const IC = { rencontres: ["heart", teintes.image], entourage: ["amis", teintes.equipe], famille: ["famille", teintes.equipe] };
  return carte((t.cartes ?? []).map((c) => `<button class="cp-carte-vie" data-action="ouvrir" data-page="${PAGE[c.id]}" id="cp-carte-${c.id}">
    ${pastille(IC[c.id][0], IC[c.id][1])}<span class="cp-corps"><span class="cp-nom">${esc(c.titre)}${c.attention ? `<i class="cp-point" aria-label="À voir"></i>` : ""}</span>
    <span class="cp-detail">${esc(c.detail)}</span></span><span class="chevron" aria-hidden="true">›</span></button>`).join(""), { classe: "cp-liste" });
}

// ══ Les rencontres ═════════════════════════════════════════════════════

function auBar(t) {
  return `<div><div class="section cp-section">Ce soir à ${esc(t.bar)}<span class="cp-mon-age">Toi, ${t.age} ans</span></div><div class="cp-bar" id="cp-bar">${t.auBar.map((p) => {
    const deja = t.abordees.includes(p.id);
    return `<button class="cp-personne" data-action="aborder" data-id="${esc(p.id)}" ${deja ? "disabled" : ""}>
      <span class="cp-nom">${esc(p.prenom)}, ${p.age}</span>
      <span class="cp-detail">${esc(p.portrait)}</span><span class="cp-aborder">${deja ? "Déjà tenté ce soir" : "Aborder"}</span></button>`;
  }).join("")}</div></div>`;
}

function aRevoir(l) {
  return `<div><div class="section cp-section">À revoir</div>${carte(l.map((p) => `<button class="cp-ligne-p" ${pFiche(p.id)} data-pretendant="${esc(p.id)}">
    <span class="cp-corps"><span class="cp-nom">${esc(p.personne.prenom)}, ${p.personne.age} ans${p.personne.intime?.nonLus ? ` <span class="cp-pastille cp-en-ligne">${p.personne.intime.nonLus}</span>` : ""}</span>
    <span class="cp-detail">${esc(p.personne.caractere)} · rencontré${esc(p.personne.accord ?? "")} à ${esc(p.lieu)}</span>
    ${jaugeFine(p.affinite / 100, teintes.image)}</span><span class="chevron" aria-hidden="true">›</span></button>`).join(""), { classe: "cp-liste" })}</div>`;
}

// ══ La fiche d'une personne (rencontre, proche, partenaire, double vie) ═══

const jauge = (titre, v, mot, teinte) => `<div class="cp-jauge-l"><span class="cp-rangee"><span class="cp-detail">${esc(titre)}</span>
  <span class="chiffres cp-mot" style="--c:${teinte}">${mot ? `${esc(mot)} · ` : ""}${v}</span></span>${jaugeFine(v / 100, teinte)}</div>`;

function enteteFiche(f) {
  const p = f.personne;
  return carte(`<div class="cp-fiche-tete" id="cp-fiche">
    <div class="cp-prenom">${esc(p.prenom)}, ${p.age} ans</div>
    <div class="cp-detail">${esc([f.lienDepart, p.metier].filter(Boolean).join(" · "))}</div>
    ${p.distance ? `<div class="cp-detail or">${esc(p.distance)} : une relation à distance</div>` : ""}
    ${f.relation != null ? jauge("Relation", f.relation, f.motRelation, tonTeinte(f.ton)) : ""}
    ${f.attirance != null ? jauge("Attirance", f.attirance, null, "var(--image)") : ""}
    ${f.amitie != null ? jauge(f.statut === "proche" || f.statut === "pretendant" ? "Amitié" : "Votre lien", f.amitie, null, "var(--or)") : ""}
    ${f.rancune ? jauge("Rancune", f.rancune, null, "var(--alerte)") : ""}</div>`, { classe: "cp-carte-pad" });
}

function gestes(f) {
  const nl = f.personne.intime?.nonLus ?? 0;
  const bloque = f.raisonSeduire != null;
  const g = (action, icone, titre, desactive = false) => `<button class="carte cp-geste" data-action="${action}" ${desactive ? "disabled" : ""}>${SF[icone]}<span>${esc(titre)}</span></button>`;
  return `<div class="cp-gestes" id="cp-gestes">${g("messagesFiche", "message", nl ? `Messages · ${nl}` : "Messages")}${g("rdvFiche", "calendar", "Rendez-vous", bloque || !!f.raisonRendezVous)}
    ${g("offrirFiche", "gift", "Offrir", bloque)}${g("sortirFiche", "sparkles", "Sortir", bloque || !!f.raisonRendezVous)}</div>
    ${f.raisonSeduire ?? f.raisonRendezVous ? `<p class="aide">${esc(f.raisonSeduire ?? f.raisonRendezVous)}</p>` : ""}`;
}

function etape(f) {
  let h = "";
  if (f.ensemble && f.raisonSeduire == null) {
    h += `<div class="cp-suite">${bouton(esc(f.ensemble), "ensemble", { genre: "teinte", teinte: teintes.image, desactive: !!f.raisonEnsemble, donnees: { id: f.id, prenom: f.personne.prenom } })}
      ${f.raisonEnsemble ? `<p class="aide">${esc(f.raisonEnsemble)}</p>` : f.ensemble !== "On se met ensemble ?" ? `<p class="aide">En secret : ce serait une double vie, avec le risque d'être découvert.</p>` : ""}</div>`;
  }
  const x = f.partenaire;
  if (x) {
    h += `<div class="cp-suite" id="cp-etapes">
      ${x.etape === "ensemble" ? `${bouton("Emménager ensemble", "emmenager", { genre: "secondaire", desactive: !!x.raisonEmmenager })}${x.raisonEmmenager ? `<p class="aide">${esc(x.raisonEmmenager)}</p>` : ""}` : ""}
      ${x.etape === "cohabitation" ? `${bouton("Se marier…", "mariage", { genre: "secondaire", desactive: !!x.raisonMarier })}${x.raisonMarier ? `<p class="aide">${esc(x.raisonMarier)}</p>` : ""}` : ""}
      ${x.etape === "marie" ? compteJoint({ compteJoint: f.compteJoint, partJoint: f.partJoint }, true) : ""}
      <div class="cp-notes">${[x.anniversaire, x.attention, x.mariage ? [x.mariage, x.regime].filter(Boolean).join(" · ") : "",
        x.partFoyer > 0 ? `${montant(x.partFoyer)} au foyer chaque dimanche` : "", ...(f.apports ?? [])].filter(Boolean).map((l) => `<p class="cp-note">${SF.sparkles}${esc(l)}</p>`).join("")}</div>
      <button class="cp-rompre" data-action="rompre">${x.etape === "marie" ? "Divorcer" : "Rompre"}</button></div>`;
  }
  const d = f.doubleVie;
  if (d) {
    const rdv = (titre, risque, loin, liquide) => `<button class="ce-rdv" data-action="voirLiaison" data-loin="${loin}" data-liquide="${liquide}">
      <b>${esc(titre)}</b><span class="${risque >= 15 ? "alerte" : "aide"}">risque ${risque} %</span></button>`;
    h += carte(`<div class="cp-discret" id="cp-discret"><div class="section cp-section">Se voir en secret</div>
      <p class="aide">${esc([d.depuis, d.alibi ? `${d.alibi} te couvre` : "", d.telephone ? "un deuxième téléphone" : ""].filter(Boolean).join(" · "))}</p>
      ${rdv("Près de chez vous", d.risqueIci, false, false)}${rdv("Loin, à l'hôtel", d.risqueLoin, true, false)}${rdv("Loin, payé en liquide", d.risqueLoinLiquide, true, true)}
      <div class="cp-rangee">${d.telephone ? "<span></span>" : petit("Un deuxième téléphone", "telephone")}${petit("Arrêter", "arreterLiaison")}</div></div>`, { classe: "cp-carte-pad" });
  }
  return h;
}

function rendreFiche(d) {
  const f = d.f;
  if (!f) return `${entetePousse("")}<div class="vide cp-vide-page">Cette personne n'est plus dans ta vie.</div>`;
  const p = f.personne;
  const souhait = f.partenaire?.souhait;
  return `${entetePousse(p.prenom)}<div class="pile cp-page">
    ${enteteFiche(f)}
    ${f.avertissement ? `<p class="cp-note alerte">${SF.broken}${esc(f.avertissement)}</p>` : ""}
    ${etatIntime(p, f.avec)}
    ${souhait ? carte(`<div class="cp-rangee" id="cp-souhait">${pastille("sparkles", teintes.vente)}
      <span class="cp-corps"><span class="cp-nom">Son envie : ${esc(souhait.nom.toLowerCase())}</span>${souhait.detail ? `<span class="cp-detail">${esc(souhait.detail)}</span>` : ""}</span>
      ${petit(montant(souhait.prix), "exaucer", { plein: true })}</div>`, { classe: "cp-carte-pad" }) : ""}
    ${gestes(f)}
    ${etape(f)}
    ${f.proche ? carte(ligne({ titre: "Lui parler", detail: esc(["Des nouvelles, un conseil, un service, un prêt…", f.pretEnCours ? `te doit ${montant(f.pretEnCours)}` : ""].filter(Boolean).join(" · ")),
      icone: "amis", teinte: teintes.equipe, page: "filCercle", p: { id: f.proche } }), { classe: "cp-liste" }) : ""}
    ${f.garderEnAmi ? `<div class="cp-suite">${bouton("Garder en ami" + (p.accord ?? ""), "devenirAmi", { genre: "secondaire", donnees: { id: f.id } })}</div>` : ""}
    ${p.intime ? `<details class="carte cp-carte-pad cp-profil" id="cp-profil"><summary class="cp-nom">${p.intime.compatibilite != null ? `Son profil · ${p.intime.compatibilite} % compatibles` : "Son profil"}</summary>${carteIntime(p)}</details>` : ""}
  </div>`;
}

/** Le fil des messages : la même feuille pour tout le monde (le tableau « personne »). */
async function feuilleMessages(ctx, id) {
  let f = await ctx.tableau("personne", { id });
  if (!f) return;
  const avec = f.avec;
  const icone = (action, nom, libelle) => `<button class="cp-ic" data-action="${action}" title="${esc(libelle)}" aria-label="${esc(libelle)}">${dessinJeu(nom, "reicon")}</button>`;
  const def = {
    titre: f.personne.prenom,
    rendu: () => {
      const p = f.personne;
      const i = p.intime ?? {};
      const m = i.messages ?? [];
      const attend = m.some((x) => x.reponses.length);
      return `<div class="cp-fil" id="cp-fil">
        <div class="cp-fil-tete"><span class="cp-corps"><span class="cp-nom">${esc(p.prenom)}</span>
          ${i.statut ? `<span class="cp-detail ${i.statut === "En ligne" ? "gain" : ""}" id="cp-statut">${esc(i.statut)}</span>` : ""}
          <span class="cp-detail">${esc(i.dernierRdv ?? f.lienDepart ?? "")}${p.distance ? ` · ${esc(p.distance)}` : ""}</span></span></div>
        <div class="cp-fil-messages">
        ${m.length ? "" : `<p class="aide cp-centre">Pas encore de messages : écris-lui en premier.</p>`}
        ${m.map((x) => x.deMoi ? `<div class="cp-bulle-l"><p class="cp-bulle moi">${esc(x.reponse)}</p>${x.vu ? `<span class="cp-heure cp-droite">${esc(x.vu)}</span>` : ""}</div>`
          : `<div class="cp-bulle-l">${x.appel ? `<span class="cp-appel gain">${SF.phone}Appel</span>` : ""}<p class="cp-bulle">${esc(x.texte)}</p><span class="cp-heure">${esc(x.heure)}</span>
          ${x.reponse ? `<p class="cp-bulle moi">${esc(x.reponse)}</p>` : ""}${x.note ? `<span class="cp-heure alerte cp-droite">${esc(x.note)}</span>` : x.reponse && x.vu ? `<span class="cp-heure cp-droite">${esc(x.vu)}</span>` : ""}
          ${x.reponses.length && x.attente ? `<span class="cp-heure alerte">${esc(x.attente)}</span>` : ""}${x.reponses.length && x.vu ? `<span class="cp-heure">${esc(x.vu)}</span>` : ""}</div>`).join("")}</div>
        <div class="cp-barre" id="cp-barre">
          <div class="cp-icones">${icone("ficheRdv", "repas", "Proposer un rendez-vous")}${icone("ficheOffrir", "acheter", "Offrir un cadeau")}
            <button class="cp-ic" data-action="fichePhoto" title="${esc(i.raisonPhoto ?? "Envoyer une photo")}" aria-label="${esc(i.raisonPhoto ?? "Envoyer une photo")}" ${i.raisonPhoto != null ? "disabled" : ""}>${dessinJeu("photo", "reicon") /* D373 */}</button>
            <button class="cp-ic" data-action="appeler" title="${esc(i.raisonAppel ?? "Appeler")}" aria-label="${esc(i.raisonAppel ?? "Appeler")}" ${i.raisonAppel != null ? "disabled" : ""}>${dessinJeu("appel", "reicon")}</button></div>
          <div class="cp-reponses">${attend ? m.filter((x) => x.reponses.length).slice(-1).flatMap((x) => x.reponses.map((r) =>
            `<button class="cp-replique" data-action="repondreMsg" data-m="${x.id}" data-k="${r.id}">${esc(r.texte)}</button>`)).join("")
            : (i.ecrire ?? []).map((r) => `<button class="cp-replique" data-action="ecrire" data-k="${r.id}">${esc(r.texte)}</button>`).join("")}</div></div></div>`;
    },
    actions: {
      async repondreMsg(c, el) {
        const op = { message: { message: Number(el.dataset.m), reponse: Number(el.dataset.k), ...(avec ? { avec } : {}) } };
        if (!(await ctx.decider("couple", op, { succes: "" }))) return;
        await relire();
      },
      async ecrire(c, el) {
        if (!(await ctx.decider("couple", { ecrire: { ligne: Number(el.dataset.k), ...(avec ? { avec } : {}) } }, { succes: "Envoyé" }))) return;
        await relire();
      },
      // D359 : la photo, l'appel. D389 : le sujet se choisit, groupé (feuillePhoto).
      fichePhoto: () => feuillePhoto(ctx, f.personne, avec, relire),
      async appeler() {
        if (!(await ctx.decider("couple", { appeler: avec ? { avec } : {} }, { succes: "" }))) return;
        await relire();
      },
      ficheRdv: async () => feuillePlanRdv(ctx, await ctx.tableau("couple"), avec, f.personne.prenom),
      ficheOffrir: async () => feuilleOffrir(ctx, f),
    },
  };
  async function relire() {
    f = (await ctx.tableau("personne", { id })) ?? f;
    ctx.feuille(def);
  }
  ctx.feuille(def);
  // D359 : le fil ouvert, ses messages sont lus (« vu ») ; sans fermer la feuille ni rien noter.
  ctx.jouer("decider", { famille: "couple", operation: { lire: avec ? { avec } : {} } }, { silencieux: true }).catch(() => {});
}

/** Offrir : le petit catalogue, et tes vrais biens (montres, véhicules, logements, objets). */
function feuilleOffrir(ctx, f) {
  const avec = f.avec;
  const d = avec ? { avec } : {};
  ctx.feuille({
    titre: `Offrir à ${f.personne.prenom}`,
    contenu: `<div class="pile">${menuOptions(f.cadeaux, "cadeau", d)}
      ${f.biens?.length ? `<div class="section cp-section">Un de tes biens</div><div class="cp-options">${f.biens.map((b) =>
        `<button class="cp-option" data-action="bien" data-famille="${esc(b.famille)}" data-id="${esc(b.id)}">
          <span>${esc(b.nom)}</span><span class="chiffres">${montant(b.valeur)}</span></button>`).join("")}</div>` : ""}</div>`,
    actions: {
      cadeau: (c, el) => ctx.decider("couple", { cadeau: { id: el.dataset.id, ...d } }, { succes: `Offert à ${f.personne.prenom}` }),
      bien: (c, el) => ctx.decider("couple", { offrirBien: { famille: el.dataset.famille, id: el.dataset.id, ...d } }, { succes: `Offert à ${f.personne.prenom}` }),
    },
  });
}

/** Sortir : une sortie toute prête (et présenter à tes amis). */
function feuilleSortir(ctx, f) {
  const d = f.avec ? { avec: f.avec } : {};
  const presenter = !f.personne.intime?.raisonPresenter;
  ctx.feuille({
    titre: `Sortir avec ${f.personne.prenom}`,
    contenu: `<div class="pile">${menuOptions(f.sorties, "sortie")}${presenter ? bouton("Présenter à tes amis", "presenter", { genre: "secondaire" }) : `<p class="aide">${esc(f.personne.intime.raisonPresenter)}</p>`}</div>`,
    actions: {
      sortie: (c, el) => ctx.decider("couple", { sortir: { id: el.dataset.id, ...d } }, { succes: `Sortie avec ${f.personne.prenom}` }),
      presenter: () => ctx.decider("couple", { presenter: d }, { succes: `${f.personne.prenom} rencontre tes amis` }),
    },
  });
}

/** Les gestes des cartes de rendez-vous, de la dispute, de la demande : sur la page et sur la fiche. */
const actionsIntime = {
  paix: (ctx, b) => ctx.decider("couple", { reconcilier: b.dataset.avec ? { avec: b.dataset.avec } : {} }),
  demande: (ctx, b) => ctx.decider("couple", { demande: { oui: b.dataset.oui === "1", ...(b.dataset.avec ? { avec: b.dataset.avec } : {}) } }),
  allerRdv: async (ctx, b) => feuilleAller(ctx, await ctx.tableau("couple"), b.dataset.id, b.dataset.prenom),
  annulerRdv: (ctx, b) => ctx.decider("couple", { annulerRendezVous: { id: Number(b.dataset.id) } }, { succes: "Rendez-vous annulé" }),
  contre: (ctx, b) => ctx.decider("couple", { accepterContre: b.dataset.avec ? { avec: b.dataset.avec } : {} }, { succes: "C'est prévu" }),
  rival: (ctx, b) => ctx.decider("couple", { rival: { choix: b.dataset.choix } }),
  messages: (ctx, b) => feuilleMessages(ctx, b.dataset.id),
  async ensemble(ctx, b) {
    const r = await deciderEtLire(ctx, { proposerEnsemble: { id: b.dataset.id } });
    if (r) ctx.toast(r === "oui" ? `${b.dataset.prenom} a dit oui` : `${b.dataset.prenom} veut encore attendre`, r === "oui" ? "gain" : "refus");
  },
};

const menuOptions = (options, action, donnees = {}) => `<div class="cp-options">${options.map((o) =>
  `<button class="cp-option" data-action="${action}" data-id="${esc(o.id)}" ${Object.entries(donnees).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")}>
     <span>${esc(o.nom)}</span><span class="chiffres">${montant(o.prix)}</span></button>`).join("")}</div>`;

function carteRencontre(x) {
  return carte(`<div class="cp-rencontre" id="cp-rencontre">
    <div class="cp-rangee">
      <span class="cp-corps"><span class="cp-nom">${esc(x.personne.prenom)}, ${x.personne.age} ans</span>
      <span class="cp-detail">${esc(x.personne.portrait)} · ${esc(x.personne.caractere.toLowerCase())}</span></span>
      <span class="cp-minutes chiffres">${x.minutesRestantes} min</span></div>
    <p class="cp-situation">${esc(x.situation)}</p>
    ${(x.echanges ?? []).map((e) => `<div class="cp-echange"><p class="cp-bulle moi">${esc(e.reponse)}</p><p class="cp-reaction ${e.ton}">${esc(e.reaction)}</p></div>`).join("")}
    ${x.ligne ? `<p class="cp-bulle">${esc(x.ligne)}</p>` : ""}
    <div class="cp-rangee cp-tour"><span class="cp-detail">Échange ${x.tour ?? 1} sur ${x.toursMax ?? 1}</span><span class="cp-humeur ${x.humeurTon ?? ""}">${esc(x.humeur ?? "")}</span></div>
    <div class="cp-repliques">${x.repliques.map((r) => `<button class="cp-replique" data-action="repondre" data-k="${r.id}" data-prenom="${esc(x.personne.prenom)}">${esc(r.texte)}</button>`).join("")}</div>
    <button class="cp-passer" data-action="ignorer">Passer ton chemin</button></div>`);
}

const info = (icone, titre, detail) => `<div class="cp-info"><span class="cp-info-ic">${SF[icone]}</span>
  <span class="cp-corps"><span class="cp-info-t">${esc(titre)}</span>${detail ? `<span class="cp-detail">${esc(detail)}</span>` : ""}</span></div>`;

function compteJoint(t, retrait) {
  return carte(`<div class="cp-rangee cp-joint" id="cp-joint">${pastille("bank", teintes.argent)}
    <span class="cp-corps"><span class="cp-nom">Compte joint</span><span class="cp-detail">${montant(t.compteJoint)} · ${montant(t.partJoint)} comptent dans ta fortune</span></span>
    <span class="cp-boutons-v">${petit("Verser", "verser", { plein: true })}${retrait ? petit("Retirer", "retirer", { desactive: t.compteJoint <= 0 }) : ""}</span></div>`, { classe: "cp-carte-pad" });
}

function joueur(j, t) {
  return `<div class="cp-heros" id="cp-joueur">
      <div class="cp-prenom">${esc(j.pseudo)}</div><div class="cp-etape">${esc(j.statutNom)}</div>
      ${j.mariage ? `<p class="aide">${esc([j.mariage, j.regime].filter(Boolean).join(" · "))}</p>` : ""}</div>
    ${j.statut === "demandeRecue" ? `<div class="cp-duo">${bouton("Accepter", "repondreJoueur", { genre: "teinte", teinte: teintes.image, donnees: { oui: "1" } })}${bouton("Refuser", "repondreJoueur", { genre: "secondaire", donnees: { oui: "0" } })}</div>` : ""}
    ${j.proposition ? carte(`<div class="cp-proposition"><div class="cp-nom">${esc(j.propositionDeMoi ? `Tu proposes : ${j.proposition.toLowerCase()}` : `${j.pseudo} propose : ${j.proposition.toLowerCase()}`)}</div>
      ${j.propositionDeMoi ? `<p class="aide">En attente de sa réponse.</p>` : `<div class="cp-boutons">${petit("Accepter", "accepterJoueur", { plein: true, donnees: { oui: "1" } })}${petit("Refuser", "accepterJoueur", { donnees: { oui: "0" } })}</div>`}</div>`, { classe: "cp-carte-pad" }) : ""}
    <div class="cp-suite">
      ${j.statut === "ensemble" ? bouton("Proposer de vivre ensemble", "emmenagerJoueur", { genre: "secondaire", desactive: !!j.raisonEmmenager }) : ""}
      ${j.statut === "cohabitation" ? bouton("Demander en mariage…", "mariage", { genre: "secondaire", desactive: !!j.raisonMarier }) : ""}
      ${j.statut === "marie" ? compteJoint(t, j.retrait == null) : ""}
      ${j.statut === "marie" && j.retrait != null ? carte(`<div class="cp-proposition" id="cp-retrait"><div class="cp-nom">${esc(j.retraitDeMoi ? `Tu proposes de retirer ${montant(j.retrait)}` : `${j.pseudo} propose de retirer ${montant(j.retrait)}`)}</div>
        ${j.retraitDeMoi ? `<p class="aide">En attente de sa réponse : l'argent arrive sur ton compte quand il accepte.</p>` : `<p class="aide">Accepté, la somme quitte le compte joint pour son compte.</p><div class="cp-boutons">${petit("Accepter", "accepterRetrait", { plein: true, donnees: { oui: "1" } })}${petit("Refuser", "accepterRetrait", { donnees: { oui: "0" } })}</div>`}</div>`, { classe: "cp-carte-pad" }) : "" /* D350 : le retrait se propose, l'autre accepte */}
      ${j.enCouple || j.statut === "demandeEnvoyee" ? `<button class="cp-rompre" data-action="rompre">${j.statut === "marie" ? "Divorcer" : j.enCouple ? "Rompre" : "Annuler la demande"}</button>` : ""}</div>`;
}

// ── D354 : le profil, la compatibilité, la dispute, la demande ──

function carteIntime(p) {
  const i = p.intime;
  if (!i) return "";
  const c = i.compatibilite;
  return carte(`<div class="cp-intime" id="cp-intime">
    <div class="cp-rangee cp-compat"><span class="section cp-section">Compatibilité</span>
      ${c != null ? `<span class="cp-pourcent chiffres ${c >= 65 ? "gain" : c < 45 ? "perte" : ""}">${c} %</span>` : `<span class="cp-detail">À découvrir</span>`}</div>
    ${c != null ? `<div class="cp-jauge" style="--p:${c}"><span></span></div>` : ""}
    ${i.indices.map((x) => `<p class="cp-indice">${esc(x)}</p>`).join("")}
    ${i.profil.length ? `<div class="filet"></div>${i.profil.map((l) => `<div class="cp-trait"><span class="cp-nom">${esc(l.titre)}</span><span class="cp-detail">${esc(l.texte)}</span></div>`).join("")}` : ""}
    ${i.atout ? `<p class="cp-atout or">${esc(i.atout)}</p>` : ""}
    ${i.album?.length ? `<div class="filet"></div><details class="cp-album" id="cp-album"><summary class="cp-nom">Vos souvenirs · ${i.album.length}</summary>
      ${i.album.map((x) => `<div class="cp-rangee cp-souvenir"><span class="cp-detail">${esc(x.titre)}</span><span class="cp-heure">${esc(x.quand)}</span></div>`).join("")}</details>` : ""}</div>`, { classe: "cp-carte-pad" });
}

function etatIntime(p, avec) {
  const i = p.intime;
  if (!i) return "";
  const d = avec ? { avec } : {};
  let h = "";
  if (i.dispute) h += carte(`<div class="cp-rangee" id="cp-dispute">${pastille("broken", teintes.controles)}
      <span class="cp-corps"><span class="cp-nom">${esc(i.dispute)}</span><span class="cp-detail">La relation s'use chaque nuit, le focus est plus dur. Un cadeau, une sortie ou parler.</span></span>
      ${petit("Faire la paix", "paix", { plein: true, donnees: d })}</div>`, { classe: "cp-carte-pad" });
  if (i.rdv) h += carte(`<div class="cp-proposition" id="cp-rdv"><div class="cp-nom">${esc(i.rdv.deLui ? `${p.prenom} t'attend` : `Rendez-vous avec ${p.prenom}`)} · ${esc(i.rdv.quand)}</div>
      <p class="aide">${esc(i.rdv.texte)}</p>
      <div class="cp-boutons">${petit(i.rdv.pret ? "Y aller" : "Pas encore l'heure", "allerRdv", { plein: true, desactive: !i.rdv.pret, donnees: { id: i.rdv.id, prenom: p.prenom } })}
      ${petit("Annuler", "annulerRdv", { donnees: { id: i.rdv.id } })}</div></div>`, { classe: "cp-carte-pad" });
  if (i.contre) h += carte(`<div class="cp-proposition" id="cp-contre"><div class="cp-nom">${esc(p.prenom)} propose plutôt</div><p class="aide">${esc(i.contre)}</p>
      <div class="cp-boutons">${petit("D'accord", "contre", { plein: true, donnees: d })}</div></div>`, { classe: "cp-carte-pad" });
  if (i.rival) h += carte(`<div class="cp-proposition" id="cp-rival"><div class="cp-nom alerte">${esc(i.rival)}</div>
      <div class="cp-boutons">${petit("En parler", "rival", { plein: true, donnees: { choix: "parler" } })}${petit("Le confronter", "rival", { donnees: { choix: "confronter" } })}${petit("Faire confiance", "rival", { donnees: { choix: "laisser" } })}</div></div>`, { classe: "cp-carte-pad" });
  if (i.bilan) h += carteBilan(i.bilan, p.prenom);
  if (i.demande) h += carte(`<div class="cp-proposition" id="cp-demande"><div class="cp-nom">${esc(i.demande.texte)}</div>
      <div class="cp-boutons">${petit(i.demande.montant ? `Prêter ${montant(i.demande.montant)}` : "Avec plaisir", "demande", { plein: true, donnees: { ...d, oui: "1" } })}
      ${petit("Pas cette fois", "demande", { donnees: { ...d, oui: "0" } })}</div></div>`, { classe: "cp-carte-pad" });
  return h;
}

/** D357 : le bilan d'une soirée. */
const carteBilan = (b, prenom) => carte(`<div class="cp-bilan" id="cp-bilan"><div class="cp-rangee"><span class="cp-nom">${esc(b.titre)} avec ${esc(prenom)}</span><span class="cp-detail">${esc(b.quand)}</span></div>
  ${b.plus.map((x) => `<p class="cp-plus">+ ${esc(x)}</p>`).join("")}${b.moins.map((x) => `<p class="cp-moins">− ${esc(x)}</p>`).join("")}
  ${b.imprevus.map((x) => `<p class="cp-imprevu">${esc(x)}</p>`).join("")}${b.moment ? `<p class="cp-moment">${esc(b.moment)}</p>` : ""}
  ${b.paye > 0 ? `<p class="cp-detail">Tu as payé ${montant(b.paye)}.</p>` : ""}</div>`, { classe: "cp-carte-pad" });

/** D389 (Arthur 16/11 04:30) : la photo, sujet au choix : Véhicules, Montres, Logement, Moments ; au-delà de 4, repliés. */
function feuillePhoto(ctx, p, avec, relire) {
  const GROUPES = ["Véhicules", "Montres", "Logement", "Moments"];
  const ouverts = new Set();
  const photos = p.intime?.photos ?? [];
  const ligne = (x) => `<button class="cp-option" data-action="photo" data-id="${esc(x.id)}"><span>${esc(x.nom)}</span></button>`;
  const def = {
    titre: `Une photo pour ${p.prenom}`,
    rendu: () => `<div class="cp-photos" id="cp-photos">${GROUPES.map((g) => {
      const l = photos.filter((x) => (x.groupe ?? "Moments") === g);
      if (!l.length) return "";
      const plie = l.length > 4 && !ouverts.has(g);
      return `<section class="cp-photo-groupe"><h3 class="libelle">${esc(g)}</h3><div class="cp-options">${(plie ? l.slice(0, 4) : l).map(ligne).join("")}
        ${plie ? `<button class="cp-option cp-plus" data-action="deplier" data-g="${esc(g)}"><span>Voir les ${l.length - 4} autres</span></button>` : ""}</div></section>`;
    }).join("")}</div>`,
    actions: {
      deplier(c, el) { ouverts.add(el.dataset.g); c.redessiner(); },
      async photo(c, el) {
        if (await ctx.decider("couple", { photo: { sujet: el.dataset.id, ...(avec ? { avec } : {}) } }, { succes: "Photo envoyée" })) await relire();
      },
    },
  };
  ctx.feuille(def);
}

/** D357 : choisir un rendez-vous : la ville et le lieu, l'heure, le transport (et la voiture), l'activité. */
function feuillePlanRdv(ctx, t, avec, prenom, depart = {}) {
  const o = t?.planRdv;
  if (!o) return;
  const ici = o.villes[0];
  const etat = { ville: ici.id, lieu: depart.lieu ?? ici.lieux.find((l) => l.type === "restaurant")?.id ?? ici.lieux[0]?.id, creneau: "soir",
    transport: "taxi", vehicule: o.vehicules[0]?.id ?? null, activite: "diner", cadeau: t.cadeaux[0]?.id ?? null };
  const choix = (cle, liste, nom = (x) => x.nom) => `<div class="cp-choix">${liste.map((x) =>
    `<button class="cp-puce ${String(etat[cle]) === String(x.id) ? "actif" : ""}" data-action="choisir" data-cle="${cle}" data-v="${esc(x.id)}">${esc(nom(x))}</button>`).join("")}</div>`;
  const def = {
    titre: `Rendez-vous avec ${prenom ?? ""}`,
    rendu: () => {
      const v = o.villes.find((x) => x.id === etat.ville) ?? ici;
      const lieu = v.lieux.find((l) => l.id === etat.lieu) ?? v.lieux[0];
      if (lieu) etat.lieu = lieu.id;
      const activites = o.activites.filter((a) => !a.lieux.length || a.lieux.includes(lieu?.type));
      if (!activites.some((a) => a.id === etat.activite)) etat.activite = activites[0]?.id;
      const vehicules = o.vehicules.filter((x) => (etat.transport === "jet" ? x.jet : !x.jet));
      return `<div class="pile cp-plan" id="cp-plan">
        <div class="section cp-section">Où</div>${choix("ville", o.villes, (x) => (x.ici ? x.nom : `${x.nom} (week-end)`))}
        ${choix("lieu", v.lieux, (x) => `${x.nom} · ${x.typeNom}`)}
        <div class="section cp-section">Quand</div>${choix("creneau", v.ici ? o.creneaux : o.creneaux.filter((c) => c.id === "weekend"))}
        <div class="section cp-section">Comment</div>${choix("transport", o.transports)}
        ${["voiture", "jet"].includes(etat.transport) ? (vehicules.length ? choix("vehicule", vehicules) : `<p class="aide">Aucun véhicule de ce genre dans ton garage.</p>`) : ""}
        <div class="section cp-section">Pour faire quoi</div>${choix("activite", activites)}
        ${etat.activite === "cadeau" ? choix("cadeau", t.cadeaux) : ""}
        ${bouton("Proposer", "proposer")}</div>`;
    },
    actions: {
      choisir: (c, el) => { etat[el.dataset.cle] = el.dataset.v; if (el.dataset.cle === "ville") { etat.lieu = null; if (el.dataset.v !== ici.id) etat.creneau = "weekend"; } ctx.feuille(def); },
      async proposer() {
        const v = o.villes.find((x) => x.id === etat.ville);
        const plan = { lieu: etat.lieu, creneau: etat.creneau, transport: etat.transport, activite: etat.activite,
          ...(avec ? { avec } : {}), ...(v && !v.ici ? { ville: v.id } : {}),
          ...(["voiture", "jet"].includes(etat.transport) && etat.vehicule != null ? { vehicule: Number(etat.vehicule) } : {}),
          ...(etat.activite === "cadeau" && etat.cadeau ? { cadeau: etat.cadeau } : {}) };
        const r = await deciderEtLire(ctx, { proposerRendezVous: { plan } });
        if (r) ctx.toast(r === "oui" ? `${prenom} a dit oui` : r === "autre chose" ? `${prenom} propose autre chose` : `${prenom} a dit non`, r === "oui" ? "gain" : "refus");
      },
    },
  };
  ctx.feuille(def);
}

/** D357 : y aller : qui paie, puis le bilan de la soirée. */
function feuilleAller(ctx, t, id, prenom) {
  const o = t?.planRdv;
  ctx.feuille({
    titre: `Ce soir avec ${prenom}`,
    contenu: `<div class="pile"><p class="aide">Au moment de l'addition…</p><div class="cp-options">${(o?.paiements ?? []).map((x) =>
      `<button class="cp-option" data-action="payer" data-p="${esc(x.id)}"><span>${esc(x.nom)}</span></button>`).join("")}</div></div>`,
    actions: {
      payer: (c, el) => ctx.decider("couple", { vivreRendezVous: { id: Number(id), paiement: el.dataset.p } }, { succes: "La soirée est finie" }),
    },
  });
}

/** D354 : « Qui tu es » (Profil) : ton genre et qui t'attire, modifiables. */
export function carteQuiTuEs(i) {
  if (!i) return "";
  return carte(`<div class="cp-qui" id="cp-qui"><div class="section cp-section">Qui tu es</div><p class="aide">${esc(i.phrase)}</p>
    <div class="cp-duo">${menuAncre({ libelle: "Je suis", options: i.genres.map((x) => [x.id, x.nom]), choisie: i.genre, action: "identiteGenre", aligner: "gauche" })}
    ${menuAncre({ libelle: "M'attirent", options: i.attirances.map((x) => [x.id, x.nom]), choisie: i.attirance, action: "identiteAttirance" })}</div>
    ${i.defini ? interrupteur({ titre: "Montrer sur mon profil public", detail: "Privé par défaut : personne ne le voit tant que c'est coupé.", actif: !!i.publique, action: "identitePublique" }) : ""}</div>`, { classe: "cp-carte-pad" });
}

export const actionsQuiTuEs = {
  identiteGenre: (ctx, el, d) => ctx.decider("couple", { identite: { genre: el.value, attirance: d.identite?.attirance ?? "tous" } }, { succes: "C'est noté", fermer: false }),
  identiteAttirance: (ctx, el, d) => ctx.decider("couple", { identite: { genre: d.identite?.genre ?? "nonprecise", attirance: el.value } }, { succes: "C'est noté", fermer: false }),
  identitePublique: (ctx, el, d) => ctx.decider("couple", { identitePublique: { oui: !d.identite?.publique } }, { succes: "C'est noté", fermer: false }),
};

/** Le mariage : cérémonie, invités, amis en ligne, lune de miel, bague, régime ; le total suit. */
function feuilleMariage(ctx, t) {
  const n = t.noces;
  if (!n) return;
  const avecJoueur = !t.partenaire && !!t.joueur;
  const prenom = t.partenaire?.personne.prenom ?? t.joueur?.pseudo ?? "";
  const choix = { ceremonie: n.ceremonies[0].id, invites: 40, lune: "aucune", bague: n.bagues[0].id, regime: "communaute", amis: new Set() };
  const total = () => {
    const c = n.ceremonies.find((x) => x.id === choix.ceremonie);
    const inv = Math.min(choix.invites, c.invitesMax);
    return c.prix + n.prixInvite * inv + (n.lunesDeMiel.find((x) => x.id === choix.lune)?.prix ?? 0) + (n.bagues.find((x) => x.id === choix.bague)?.prix ?? 0);
  };
  const choixListe = (cle, liste, rendu) => `<div class="cp-choix" role="radiogroup">${liste.map((x) =>
    `<button class="cp-choix-l" role="radio" aria-checked="${choix[cle] === x.id}" data-action="choisir" data-cle="${cle}" data-id="${esc(x.id)}">${rendu(x)}</button>`).join("")}</div>`;
  const def = {
    titre: "Votre mariage",
    rendu: () => {
      const c = n.ceremonies.find((x) => x.id === choix.ceremonie);
      const inv = Math.min(choix.invites, c.invitesMax);
      return `<div class="pile cp-noces">
        <div class="section cp-section">La cérémonie</div>
        ${choixListe("ceremonie", n.ceremonies, (x) => `<span class="cp-corps"><span class="cp-nom">${esc(x.nom)}</span><span class="cp-detail">${esc(x.detail)} · ${x.invitesMax} invités au plus</span></span><span class="chiffres">${montant(x.prix)}</span>`)}
        <div class="cp-invites"><span>${inv} invités · ${montant(n.prixInvite)} chacun</span>
          <span class="cp-boutons">${petit("−", "invites", { donnees: { d: "-10" }, desactive: inv <= 0 })}${petit("+", "invites", { donnees: { d: "10" }, desactive: inv >= c.invitesMax })}</span></div>
        ${n.amis.length ? `<div class="section cp-section">Tes amis en ligne</div><div class="cp-amis">${n.amis.map((a) =>
          `<button class="cp-ami" aria-pressed="${choix.amis.has(a)}" data-action="ami" data-id="${esc(a)}">${esc(a)}</button>`).join("")}</div>` : ""}
        <div class="section cp-section">La lune de miel</div>
        ${choixListe("lune", n.lunesDeMiel, (x) => `<span class="cp-nom">${esc(x.nom)}</span><span class="chiffres">${x.prix > 0 ? montant(x.prix) : ""}</span>`)}
        <div class="section cp-section">La bague</div>
        ${choixListe("bague", n.bagues, (x) => `<span class="cp-corps"><span class="cp-nom">${esc(x.nom)}</span><span class="cp-detail">${esc(x.marque)}</span></span><span class="chiffres">${montant(x.prix)}</span>`)}
        <div class="section cp-section">Le régime</div>
        ${choixListe("regime", n.regimes, (x) => `<span class="cp-corps"><span class="cp-nom">${esc(x.nom)}</span><span class="cp-detail">${esc(x.detail)}</span></span>`)}
        ${bouton(`${avecJoueur ? `Demander ${esc(prenom)} en mariage` : "Se marier"} · ${montant(total())}`, "marier")}
        <p class="aide">${avecJoueur ? `Tu paies quand ${esc(prenom)} dit oui.` : "Payé aujourd'hui. Le compte joint s'ouvre avec le mariage."}</p></div>`;
    },
    actions: {
      choisir: (c, el) => { choix[el.dataset.cle] = el.dataset.id; ctx.feuille(def); },
      invites: (c, el) => { choix.invites = Math.max(0, choix.invites + Number(el.dataset.d)); ctx.feuille(def); },
      ami: (c, el) => { const a = el.dataset.id; if (choix.amis.has(a)) choix.amis.delete(a); else choix.amis.add(a); ctx.feuille(def); },
      marier: () => {
        const c = n.ceremonies.find((x) => x.id === choix.ceremonie);
        const noces = { ceremonie: choix.ceremonie, invites: Math.min(choix.invites, c.invitesMax), luneDeMiel: choix.lune, bague: choix.bague, regime: choix.regime,
          ...(choix.amis.size ? { amis: [...choix.amis].sort() } : {}) };
        return ctx.decider("couple", avecJoueur ? { marierJoueur: { noces } } : { marier: { noces } },
          { succes: avecJoueur ? `Demande envoyée à ${prenom}` : "Mariés !" });
      },
    },
  };
  ctx.feuille(def);
}

/** Une décision dont le résultat (la réplique, « On se met ensemble ? ») est au journal. */
async function deciderEtLire(ctx, operation) {
  if (!(await ctx.decider("couple", operation, { succes: "" }))) return null;
  const j = await ctx.jouer("journal", { nombre: 1 }, { silencieux: true });
  return j?.journal?.[0]?.detail?.split(" : ").pop() ?? null;
}

/** Les gestes de la page avec un vrai joueur (le compte joint, le mariage, rompre). */
const actionsJoueur = {
  verser: (ctx) => ctx.feuille({ titre: "Verser au compte joint", contenu: `<div class="pile">${champEuros("cp-montant", { etiquette: "Montant" })}
      <p class="aide">Il compte pour moitié dans ta fortune.</p>${bouton("Verser", "valider")}</div>`,
    actions: { valider: () => { const m = lireEuros("cp-montant"); if (m > 0) return ctx.decider("couple", { verserJoint: { montant: m } }, { succes: `${montant(m)} au compte joint` }); } } }),
  retirer: (ctx, b, d) => {
    // D350 : avec un vrai joueur, le retrait se propose ; l'argent arrive quand il accepte.
    const avecJoueur = !d?.f && !!d?.t?.joueur;
    return ctx.feuille({ titre: avecJoueur ? "Proposer un retrait" : "Retirer du compte joint", contenu: `<div class="pile">${champEuros("cp-montant", { etiquette: "Montant" })}${bouton(avecJoueur ? "Proposer" : "Retirer", "valider")}</div>`,
      actions: { valider: () => { const m = lireEuros("cp-montant"); if (m > 0) return ctx.decider("couple", { retirerJoint: { montant: m } }, { succes: avecJoueur ? "Retrait proposé" : `${montant(m)} retirés` }); } } });
  },
  async rompre(ctx, b, d) {
    const divorce = d.f ? d.f.partenaire?.etape === "marie" : d.t?.joueur?.statut === "marie";
    const ok = await confirmer({ titre: divorce ? "Divorcer ?" : "Rompre ?", danger: true, oui: divorce ? "Divorcer" : "Rompre",
      texte: divorce ? "L'avocat, le partage selon votre régime, peut-être une pension : et le moral en berne quelques jours." : "Le moral en prendra un coup quelques jours." });
    if (ok) return ctx.decider("couple", { rompre: {} }, { succes: "C'est fini" });
  },
  mariage: async (ctx, b, d) => feuilleMariage(ctx, d.f ? { ...(await ctx.tableau("couple")), noces: d.f.noces } : d.t),
};

export const pages = {
  couple: {
    titre: "Ma vie amoureuse",
    css: "couple",
    async donnees(ctx) { return { t: await ctx.tableau("couple") }; },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Ma vie amoureuse")}<div class="vide cp-vide-page">Ta vie amoureuse se vit pendant une saison.</div>`;
      return `${entetePousse("Ma vie amoureuse", `<button class="cp-qui-lien" data-action="quiTuEs" id="cp-qui-lien">Qui tu es ›</button>`)}
      <div class="pile cp-page">
        ${t.refusAge ? `<p class="aide cp-centre">${esc(t.refusAge)}</p>` : ""}
        ${relation(t)}
        ${t.doubleVie ? ligneDoubleVie(t.doubleVie) : ""}
        ${t.scene ? blocScene(t.scene) : ""}
        ${t.exRevenu ? blocExRevenu(t.exRevenu) : ""}
        ${presse(t)}
        ${cartes(t)}
        ${t.partenaire || t.pretendants.length || t.joueur?.enCouple ? carte(interrupteur({ titre: "Garder tes histoires", detail: "À la saison suivante, ton couple et tes rencontres te suivent si tu l’actives.", actif: t.garder, action: "garder" })) : ""}
        ${t.chagrin ? `<p class="cp-note alerte">${SF.broken}${esc(t.chagrin)}</p>` : ""}
        ${t.pensions.map((x) => `<p class="cp-note">${SF.bank}${esc(x)}</p>`).join("")}
        <p class="aide cp-centre">${esc(t.note)}</p>
      </div>`;
    },
    actions: {
      ...actionsIntime,
      ...actionsJoueur,
      scene: (ctx, b) => ctx.decider("cercle", { repondreScene: { choix: b.dataset.choix } }),
      exRevenu: (ctx, b) => ctx.decider("cercle", { reagirExRevenu: { parler: b.dataset.parler === "1" } }),
      garder: (ctx, b, d) => ctx.decider("couple", { garder: { oui: !d.t.garder } }),
      async quiTuEs(ctx) {
        const identite = await ctx.tableau("identiteCouple");
        const def = { titre: "Qui tu es", contenu: carteQuiTuEs(identite), actions: Object.fromEntries(Object.entries(actionsQuiTuEs).map(([k, f]) =>
          [k, async (c, el) => { await f(ctx, el, { identite: await ctx.tableau("identiteCouple") }); def.contenu = carteQuiTuEs(await ctx.tableau("identiteCouple")); ctx.feuille(def); }])) };
        ctx.feuille(def);
      },
      repondreJoueur: (ctx, b) => ctx.decider("couple", { repondreJoueur: { oui: b.dataset.oui === "1" } }, { succes: b.dataset.oui === "1" ? "Vous êtes ensemble" : "Demande refusée" }),
      accepterJoueur: (ctx, b) => ctx.decider("couple", { accepterJoueur: { oui: b.dataset.oui === "1" } }, { succes: b.dataset.oui === "1" ? "C'est oui" : "C'est non" }),
      accepterRetrait: (ctx, b) => ctx.decider("couple", { accepterRetraitJoueur: { oui: b.dataset.oui === "1" } }, { succes: b.dataset.oui === "1" ? "Retrait accepté" : "Retrait refusé" }),
      emmenagerJoueur: (ctx) => ctx.decider("couple", { emmenagerJoueur: {} }, { succes: "Proposé" }),
    },
  },
  // D456 : les gens qu'on ne connaît pas encore (la rencontre qui attend, le bar, ceux à revoir).
  rencontres: {
    titre: "Rencontres",
    css: "couple",
    async donnees(ctx) { return { t: await ctx.tableau("couple") }; },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Rencontres")}<div class="vide cp-vide-page">Les rencontres se vivent pendant une saison.</div>`;
      const l = t.pretendants.filter((p) => !p.proche);
      const enCouple = t.partenaire || t.joueur?.enCouple;
      return `${entetePousse("Rencontres")}<div class="pile cp-page" id="cp-rencontres">
        ${t.refusAge ? `<p class="aide cp-centre">${esc(t.refusAge)}</p>` : ""}
        ${enCouple && (t.bar || l.length) ? `<p class="cp-note alerte" id="cp-ailleurs">${SF.broken}Tu es en couple : voir quelqu'un d'autre en cachette peut se savoir.</p>` : ""}
        ${t.rencontre ? carteRencontre(t.rencontre) : ""}
        ${t.bar && !t.rencontre ? auBar(t) : ""}
        ${l.length ? aRevoir(l) : ""}
        ${!l.length && !t.rencontre && !t.bar && !t.refusAge ? `<div class="cp-vide">${pastille("heart", teintes.image)}<div class="cp-vide-t">Personne pour l'instant</div>
          <p class="aide">Sors : un verre au bar, une soirée au club, un dîner, une séance à la salle. On ne rencontre personne chez soi.</p></div>` : ""}
      </div>`;
    },
    actions: {
      async repondre(ctx, b) {
        const r = await deciderEtLire(ctx, { repondre: { replique: Number(b.dataset.k) } });
        if (r && r !== "la conversation continue") ctx.toast(r === "ça accroche" ? `Ça accroche avec ${b.dataset.prenom}` : `Ça ne prend pas avec ${b.dataset.prenom}`, r === "ça accroche" ? "gain" : "refus");
      },
      ignorer: (ctx) => ctx.decider("couple", { ignorer: {} }, { succes: "Une autre fois" }),
      aborder: (ctx, b) => ctx.decider("couple", { aborder: { id: b.dataset.id } }),
    },
  },
  // D456 : UNE fiche pour une personne (rencontre, proche, partenaire, double vie).
  personne: {
    titre: "Fiche",
    css: ["couple", "cercle"],
    async donnees(ctx, p) { return { f: await ctx.tableau("personne", { id: p?.id }) }; },
    rendu: rendreFiche,
    actions: {
      ...actionsIntime,
      ...actionsJoueur,
      // Ses parents ne se séduisent pas : leurs messages passent par « Lui parler ».
      messagesFiche: (ctx, b, d) => (d.f.raisonSeduire && d.f.proche ? ctx.ouvrir("filCercle", { id: d.f.proche }) : feuilleMessages(ctx, d.f.id)),
      rdvFiche: async (ctx, b, d) => feuillePlanRdv(ctx, await ctx.tableau("couple"), d.f.avec, d.f.personne.prenom),
      offrirFiche: (ctx, b, d) => feuilleOffrir(ctx, d.f),
      sortirFiche: (ctx, b, d) => feuilleSortir(ctx, d.f),
      exaucer: (ctx) => ctx.decider("couple", { exaucer: {} }, { succes: "Envie exaucée" }),
      emmenager: (ctx) => ctx.decider("couple", { emmenager: {} }, { succes: "Vous vivez ensemble" }),
      voirLiaison: (ctx, b) => ctx.decider("cercle", { voirLiaison: { loin: b.dataset.loin === "true", liquide: b.dataset.liquide === "true" } }, { succes: "Un rendez-vous discret" }),
      telephone: (ctx) => ctx.decider("cercle", { acheterTelephone: {} }, { succes: "Un deuxième téléphone, payé en liquide" }),
      arreterLiaison: (ctx, b, d) => ctx.decider("cercle", { arreterLiaison: {} }, { succes: `C'est fini avec ${d.f.personne.prenom}` }),
      devenirAmi: (ctx, b, d) => ctx.decider("cercle", { devenirAmi: { pretendant: b.dataset.id } }, { succes: `${d.f.personne.prenom} devient ton ami${d.f.personne.accord ?? ""}` }),
    },
  },
};
