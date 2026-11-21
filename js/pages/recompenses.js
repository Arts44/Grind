// ══════════════════════════════════════════════════════════════════════
//  Personnaliser mon profil (RNT-231, D230, D394) — EcranPersonnaliser de
//  l'iPhone (Rente/Ecrans/EcranCosmetiques.swift).
//
//  D394 : une seule page, en onglets (Profil, Carte, Vitrine, Collection,
//  Style, Icônes) ; plus de pages Vitrine, Collection ni « Ma vitrine ».
//  L'onglet s'ouvre par le paramètre `onglet` (`ouvrir("personnaliser",
//  { onglet: "carte" })`).
//  Le dévoilement du bilan (`devoiler`) et la jauge de l'accueil
//  (`jaugeAccueil`) vivent ici aussi.
//  Tout vient de TableauCosmetiques (RenteCore).
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, section, bouton, vide, ligne, icones, petit, segment, interrupteur } from "../ui.js?v=3e8bddd9";
import * as C from "../cosmetiques.js?v=3e8bddd9";
import { CLES, avatarPublie, svgSymbole, LISTE_SYMBOLES, TEINTES, hex, symboleChoisi, teinteChoisie, choisirSymbole, choisirTeinte,
  accentChoisi, accentsDisponibles, choisirAccent } from "../compte-local.js?v=3e8bddd9"; // RNT-367 : l'accent ici aussi ; D393 : l'avatar
import * as serveur from "../serveur.js?v=3e8bddd9"; // RNT-367 : le pseudo se change ici
import * as T from "../titres.js?v=3e8bddd9"; // RNT-326 : le titre de profil
import * as L from "../enligne.js?v=3e8bddd9";
import { vibrer } from "../sons.js?v=3e8bddd9";
import * as CT from "../carte-ticket.js?v=3e8bddd9"; // D384 : la carte de profil en ticket
import { listeRecompenses, vitrineChoisie, choixCarte, CLE_CARTE_VITRINE } from "../vitrine.js?v=3e8bddd9";
import { iconeChoisie, choisirIcone } from "../icone-app.js?v=3e8bddd9"; // D391 : l'icône de l'app, en favicon
import { ongletCollection, ongletVitrine, actionsSeries } from "./series.js?v=3e8bddd9"; // D394 : les onglets Collection et Vitrine
import { carteFortune } from "../cartes-fortune.js?v=3e8bddd9"; // D394 : les cartes de fortune, dans l'onglet Carte

/** RNT-367 : l'erreur du dernier changement de pseudo (« De 2 à 20 caractères », pseudo pris…). */
let erreurPseudo = "";

const lireLocal = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const ecrireLocal = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

const GENRES = {
  focus: { c: "var(--grandir)", svg: '<circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4.4l2.6 1.6M9.5 2.8h5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>' },
  economie: { c: "var(--argent)", svg: '<path d="M3.5 17.5 9 12l3.5 3.5 8-8M15 7.5h5.5V13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
  social: { c: "var(--equipe)", svg: '<circle cx="8.5" cy="8" r="3.4"/><circle cx="16.5" cy="9" r="2.8"/><path d="M2.5 19c.7-3.6 3.2-5.6 6-5.6s5.3 2 6 5.6zM15 13.6c2.9 0 5.4 1.6 6.4 5.4h-5.2c-.2-2-.6-3.8-1.2-5.4z"/>' },
  exploration: { c: "var(--image)", svg: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.6 8.4 13.4 13.4 8.4 15.6l2.2-5z"/>' },
};
const icone = (g) => `<span class="cz-defi-icone" style="--c:${GENRES[g]?.c ?? "var(--accent)"}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${GENRES[g]?.svg ?? ""}</svg></span>`;
const rarete = (p) => `<span class="cz-rarete" data-r="${p.rarete}">${esc(p.rareteNom)}</span>`;

const etat = { famille: "profil", iconeMontree: null };

export async function lire(ctx) {
  await C.chargerCatalogue(ctx);
  return ctx.tableau("cosmetiques", { equipement: C.equipement() });
}

/** Une tuile : la miniature, le nom, la rareté et comment on la gagne. */
function tuile(p, { action = "", choisie = false } = {}) {
  const corps = `${C.apercu(p, { ferme: !p.gagnee })}
    <span class="cz-tuile-texte"><b>${esc(p.nom)}</b>${rarete(p)}<span class="cz-source">${p.gagnee ? (p.equipee ? "Équipée" : "Gagnée") : esc(p.source)}</span></span>`;
  if (!action) return `<div class="cz-tuile ${p.gagnee ? "gagnee" : ""}" data-cle="${esc(p.id)}">${corps}</div>`;
  return `<button class="cz-tuile ${p.gagnee ? "gagnee" : ""}" data-action="${action}" data-sorte="${esc(p.sorte)}" data-id="${esc(p.id)}" data-cle="${esc(p.id)}"
    aria-pressed="${choisie}" ${p.gagnee ? "" : "disabled"} aria-label="${esc(`${p.nom}, ${p.rareteNom}. ${p.gagnee ? (choisie ? "Équipée" : "Gagnée") : `À gagner : ${p.source}`}`)}">${corps}</button>`;
}

/** Les défis de la saison, avec leur avancement et la pièce qu'ils donnent. */
export function listeDefis(defis) {
  if (!defis?.length) return "";
  return carte(`<div class="cz-defis">${defis.map((d) => `<div class="cz-defi ${d.fait ? "fait" : ""}" data-cle="${esc(d.id)}">
      ${icone(d.genre)}
      <div class="cz-defi-texte"><b>${esc(d.nom)}</b><span>${esc(d.detail)}</span>
        <div class="cz-defi-rail" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(d.progression * 100)}" aria-label="${esc(d.nom)}"><i style="--part:${(d.progression * 100).toFixed(1)}%;--c:${GENRES[d.genre]?.c ?? "var(--accent)"}"></i></div>
        <span class="chiffres">${d.fait ? "Réussi" : esc(d.avancement)} · ${esc(d.genreNom)}</span></div>
      ${d.piece ? C.apercu(d.piece, { ferme: !d.piece.gagnee }) : ""}
    </div>`).join("")}</div>`);
}

/** L'échelle des paliers de record. */
function echelle(t) {
  return carte(`<div class="cz-paliers">${t.paliers.map((p) => `<div class="cz-palier ${p.atteint ? "atteint" : ""}" data-cle="p${p.numero}">
      <span class="cz-palier-num">${p.numero}</span>
      <span class="cz-palier-texte"><b class="chiffres">${esc(p.texte)}</b><span>${esc([...p.pieces.map((x) => x.nom), ...p.cartes.map((c) => `carte ${c}`)].join(" · "))}</span></span>
      <span class="cz-palier-pieces">${p.pieces.slice(0, 2).map((x) => C.apercu(x, { ferme: !p.atteint })).join("")}</span>
    </div>`).join("")}</div>`);
}

/** La jauge de l'accueil : la prochaine récompense au record, et les défis en cours. Rien hors saison.
 *  D396 : une simple information ; Personnaliser s'ouvre seulement par le bouton du profil. */
export async function jaugeAccueil(ctx) {
  const t = await lire(ctx).catch(() => null);
  if (!t?.prochaine && !t?.defis?.length) return "";
  const p = t.prochaine;
  const defis = t.defis.slice(0, 5).map((d) => `<span class="${d.fait ? "fait" : ""}">${esc(d.nom)} · ${d.fait ? "réussi" : esc(d.avancement)}</span>`).join("");
  return `<div class="carte cz-jauge" id="cz-jauge" role="group" aria-label="${esc(p ? `${p.titre}. ${p.detail}` : "Défis de la saison")}">
    <span class="cz-jauge-texte"><b>${esc(p?.titre ?? "Défis de la saison")}</b><span>${esc(p?.detail ?? `${t.defis.filter((d) => d.fait).length} sur ${t.defis.length} réussis`)}</span></span>
    ${p?.pieces?.[0] ? C.apercu(p.pieces[0]) : ""}
    ${p ? `<span class="cz-jauge-rail"><i style="--part:${(p.progression * 100).toFixed(1)}%"></i></span>` : ""}
    ${defis ? `<span class="cz-jauge-defis">${defis}</span>` : ""}
  </div>`;
}

/** D394 : l'aperçu de l'onglet Carte : ta carte en ticket (K5a, D384), telle que les autres la voient.
 *  D454 : aussi en tête de ton profil (`d.id` : « pf-carte »). */
export function apercuCarte(ctx, t, d = {}) {
  const valide = Object.fromEntries(t.familles.flatMap((f) => f.sortes).filter((s) => s.equipee).map((s) => [s.id, s.equipee]));
  const pseudo = ctx.etat.compte?.pseudo || "Toi";
  // D398 : un titre de collection choisi compte comme gagné pour la carte.
  const choisisTitres = (d.affiches ?? []).filter((id) => id.startsWith("col_"));
  const badges = CT.listeBadges((d.badges ?? []).map(({ id, nom, detail }) => ({ id, nom, detail })),
    [...(d.badges ?? []).filter((b) => b.obtenu).map((b) => b.id), ...choisisTitres], 4, d.affiches);
  // L'onglet Profil la montre en petit (comme CarteMembre(compacte:) de l'iPhone), l'onglet Carte en grand.
  return `<div class="cz-perso-apercu" id="${d.id ?? (d.petite ? "cz-apercu-profil" : "cz-apercu-direct")}"><div class="cl-membre-cadre">${CT.carteTicket({ pseudo, titre: d.titreProfil?.nom ?? null,
    record: d.record != null ? montant(d.record) : null, palier: d.carte ?? 0, badges, cosmetiques: valide, petite: !!d.petite,
    avatar: avatarPublie() })}</div></div>`;
}

/** D394 : l'aperçu de l'onglet Style : ta carte du monde (marqueur, traînée) et tes objets (plaque, façade, cadran). */
function apercuObjets(t) {
  const valide = Object.fromEntries(t.familles.flatMap((f) => f.sortes).filter((s) => s.equipee).map((s) => [s.id, s.equipee]));
  const x = C.piecesDe(valide);
  const traine = x.trainee ? C.apercu(x.trainee).replace("cz-apercu", "cz-trace-dessin") : "";
  return carte(`<div class="cz-perso-apercu" id="cz-apercu-objets">
    <div class="cz-perso-rangee">
      <div class="cz-perso-carte-monde" role="img" aria-label="Ton marqueur sur la carte">
        ${x.trainee ? `<span class="cz-trace">${traine}</span>` : ""}
        ${C.svgMarqueur(x.marqueur?.motif, x.couleurMarqueur?.couleurs, { taille: 30, id: "direct" })}
      </div>
      <div class="cz-perso-objets" aria-hidden="true">
        <span>${C.svgPlaque(x.plaque)}</span><span>${C.svgFacade(x.facade)}</span><span>${C.svgCadran(x.cadran, { id: "direct" })}</span>
      </div>
    </div></div>`);
}

/** RNT-393 (D320) : le style de tes cartes bancaires, dans Personnaliser seulement (SectionCartesBancaires de l'iPhone). */
function sectionCartesBancaires(d) {
  const cartes = d.banque?.cartes ?? [];
  if (!cartes.length || !d.B) return "";
  const gagne = C.styleCarteEquipe(), porteuse = gagne ? d.B.porteuseStyleGagne(cartes) : null; // D389
  return `<section class="rg-bloc" id="cz-cartes-bancaires"><h2 class="libelle">Tes cartes bancaires</h2>
    <p class="aide">Leur style : les finitions de leur banque et tes cartes de fortune.</p>
    <div class="carte rg-carte">${cartes.map((c, i) => `<button class="rg-ligne" data-action="styleCarteBancaire" data-rang="${i}" aria-label="Style de la carte ${esc(c.nom)}">
      <span class="rg-texte"><span class="rg-titre">${esc(c.nom)}</span><span class="rg-detail">${esc(gagne && d.B.idCarte(c) === porteuse ? `${gagne.nom}, ton style gagné` : d.B.nomStyle(c.style))}</span></span>
      <span class="rg-chevron">${icones.chevron}</span></button>`).join("")}</div>${porteStyleGagne(d)}</section>`;
}

/** D389 (Arthur 16/11 04:30) : le style de carte gagné se porte sur UNE carte de paiement, choisie ici (par défaut,
 *  celle du compte de départ). Le choix se garde avec l'équipement des cosmétiques (`styleCarteSur`). */
function porteStyleGagne(d) {
  const p = C.styleCarteEquipe();
  const l = d.B.candidatesStyleGagne(d.banque?.cartes);
  if (!p || !l.length) return "";
  const porteuse = d.B.porteuseStyleGagne(d.banque.cartes);
  return `<div class="rg-style-gagne"><p class="aide">Ton style gagné, ${esc(p.nom)}, se porte sur une seule carte :</p>
    <div class="choix" role="radiogroup" aria-label="La carte qui porte ${esc(p.nom)}">${l.map((c) => petit(esc(c.nom), "porterStyleGagne",
      { plein: d.B.idCarte(c) === porteuse, donnees: { id: d.B.idCarte(c) } })).join("")}</div></div>`;
}

/** D394 (Arthur 16/11 09:59) : les onglets de « Personnaliser mon profil », les mêmes que l'iPhone (OngletPersonnaliser). */
export const ONGLETS = [["profil", "Profil"], ["carte", "Carte"], ["vitrine", "Vitrine"], ["collection", "Collection"], ["style", "Style"], ["icones", "Icônes"]];
const ongletDe = (p) => (ONGLETS.some(([id]) => id === p?.onglet) ? p.onglet : "profil");

/** Ce que chaque onglet lit en plus (la page ne lit que ce qu'elle montre). */
async function completer(ctx, d, onglet) {
  if ((onglet === "vitrine" || onglet === "collection") && !d.sc) d.sc = await ctx.tableau("seriesCollection").catch(() => null);
  if (onglet === "carte" && !d.B) [d.banque, d.B] = await Promise.all([ctx.tableau("banque").catch(() => null), import("./banque.js?v=3e8bddd9")]);
  if (onglet === "carte") d.prestige = await ctx.tableau("prestige").catch(() => null); // D441
  if (onglet === "icones" && !d.icones) d.icones = await ctx.tableau("icones").catch(() => null);
}

/** RNT-276 (D263) : une carte de fortune (acquise, ou en grisé ; la suivante avec sa jauge). D394 : dans l'onglet Carte. */
function carteCollection(c) {
  return `<div class="collection-fortune">
    ${carteFortune(c.palier, { verrou: c.acquise ? null : montant(c.seuil) })}
    <div class="rangee entre"><span class="titre-f"><i>${esc(c.romain)}</i> ${esc(c.nom)}</span><span class="aide">${montant(c.seuil)}</span></div>
    ${c.part != null ? `<div class="jauge-f" role="progressbar" aria-valuenow="${Math.round(c.part * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="--part:${c.part}"></i></div>
      <div class="aide">${montant(c.patrimoine ?? 0)} sur ${montant(c.seuil)}</div>`
      : `<div class="aide">${c.acquise ? (c.palier === 0 ? "Ta carte de départ" : "À choisir comme style de tes cartes") : `Patrimoine net de ${montant(c.seuil)}`}</div>`}
  </div>`;
}

/** Un bloc replié de l'onglet Carte (badges, paliers, cartes de fortune) : le titre et son compte. */
const repli = (id, titre, compte, corps) => `<details class="carte pz-repli" id="${id}"><summary class="pz-repli-t"><b>${esc(titre)}</b><span class="chiffres t2">${esc(compte)}</span></summary><div class="pz-repli-c">${corps}</div></details>`;

function ongletProfil(d, ctx) {
  const a = accentChoisi(), gagnes = (d.r?.accents ?? []).filter((x) => x.gagne).map((x) => x.id);
  return `${partie("Ton profil", "Ce que les autres joueurs voient à côté de ton pseudo. Tu ne montres que ce que tu as gagné.")}
    ${apercuCarte(ctx, d.t, { titreProfil: d.titreProfil, carte: vitrineChoisie(d.c).palier, record: d.record, badges: d.c?.badges, affiches: d.c?.affiches, petite: true })}
    <section class="rg-bloc">
      <label class="libelle" for="pseudo-compte">Pseudo</label>
      <form class="rg-pseudo">
        <input class="champ" id="pseudo-compte" maxlength="20" autocomplete="nickname" autocapitalize="off" spellcheck="false"
          value="${esc(ctx.etat.compte?.pseudo ?? "")}" placeholder="Ton nom dans le jeu" enterkeyhint="done" ${ctx.etat.compte ? "" : "disabled"}>
        <button class="petit plein" data-action="enregistrerPseudo" ${ctx.etat.compte ? "" : "disabled"}>OK</button>
      </form>
      ${erreurPseudo ? `<p class="rg-erreur">${esc(erreurPseudo)}</p>` : `<p class="aide">Unique sur Grind. Valide avec OK ou la touche Entrée.</p>`}
    </section>
    ${(() => { const symbole = symboleChoisi(), teinte = teinteChoisie(); /* D393 : l'avatar de retour, ici seulement */ return `<section class="rg-bloc">
      <h2 class="libelle">Avatar</h2>
      <div class="cl-symboles" role="radiogroup" aria-label="Symbole de l'avatar">${LISTE_SYMBOLES.map((s) =>
        `<button role="radio" data-action="choisirSymbole" data-symbole="${s}" aria-pressed="${s === symbole}" aria-checked="${s === symbole}" aria-label="${esc(s)}">${svgSymbole(s, 18)}</button>`).join("")}</div>
      <div class="cl-teintes" role="radiogroup" aria-label="Teinte de l'avatar">${TEINTES.map((t, i) =>
        `<button role="radio" data-action="choisirTeinte" data-teinte="${i}" aria-pressed="${i === teinte}" aria-checked="${i === teinte}" aria-label="Teinte ${i + 1}" style="--c:${hex(t)}"><i></i></button>`).join("")}</div>
      <p class="aide">Ta teinte colore aussi ton point sur la carte et ta courbe.</p>
    </section>`; })()}
    ${sectionTitres(d)}
    <section class="rg-bloc">
      <h2 class="libelle">Couleur d'accent</h2>
      <div class="cl-accents" role="radiogroup" aria-label="Couleur d'accent">${accentsDisponibles(gagnes).map((x) =>
        `<button role="radio" data-action="choisirAccent" data-accent="${x.id}" aria-pressed="${x.id === a.id}" aria-checked="${x.id === a.id}" style="--c:${x.couleur}"><i></i>${esc(x.nom)}</button>`).join("")}</div>
      <p class="aide">Pour toi seul : la couleur des boutons et des chiffres. Platine et Rubis se gagnent en fin de saison.</p>
    </section>`;
}

const DRAPEAU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h13l-2.5 4.5L18 13H5"/></svg>';

/** D395 (Arthur 16/11) : le palmarès (tes saisons passées) quitte le profil et vit ici seulement, sous le record. */
function palmares(l) {
  if (!l?.length) return `<p class="aide" id="pz-palmares-vide">Ton record se pose à la fin de ta première saison.</p>`;
  return repli("pz-palmares", "Ton palmarès", `${l.length} saison${l.length > 1 ? "s" : ""}`, l.map((s) => `<div class="pz-saison">
      <span class="pz-saison-ico">${DRAPEAU}</span><span class="pz-saison-t"><b>${esc(s.titre)}</b><span class="aide">${esc(s.detail)}</span></span>
      <span class="chiffres">${esc(montant(s.patrimoine))}</span></div>`).join(`<div class="filet"></div>`));
}

/** D427 (Arthur, 19/11 : « l'interface pour choisir ses badges est bizarre ») : une seule section, sur la page, comme
 *  sur iPhone : toucher un badge gagné le met sur la carte ou l'en retire tout de suite (4 au plus, dans l'ordre) ;
 *  les badges à obtenir sont repliés en bas. Avant : un bouton, une feuille, et une deuxième liste en double. */
function sectionBadges(c) {
  if (!c) return "";
  const gagnes = [...(c.badges ?? []).filter((b) => b.obtenu), ...(c.titresBadges ?? [])];
  const manquants = (c.badges ?? []).filter((b) => !b.obtenu);
  const actuels = (c.affiches ?? []).filter((id) => gagnes.some((b) => b.id === id));
  const ligne = (b) => {
    const rang = actuels.indexOf(b.id);
    return `<button type="button" class="pz-badge pz-badge-choix${rang >= 0 ? " choisi" : ""}" data-action="basculerBadge" data-id="${esc(b.id)}"
      aria-pressed="${rang >= 0}"><span><b>${esc(b.nom)}</b><span class="aide">${esc(b.detail)}</span></span>
      <span class="pz-badge-rang" aria-hidden="true">${rang >= 0 ? rang + 1 : ""}</span></button>`;
  };
  const tete = `<div class="cz-tete-chiffres"><h2 class="libelle">Tes badges</h2>${gagnes.length ? `<span class="aide pz-badges-compte">${actuels.length ? `Sur ta carte : ${actuels.length} sur 4` : "Choisis-en jusqu'à 4"}</span>` : ""}</div>`;
  const corps = gagnes.length
    ? `<p class="aide">${actuels.length ? "Touche un badge pour le mettre sur ta carte ou l'en retirer." : "Ta carte montre tes badges gagnés. Touche-en un pour choisir toi-même, dans l'ordre où tu les touches."}</p>
       <div class="carte pz-badges-liste" data-choix="${esc(JSON.stringify(actuels))}">${gagnes.map(ligne).join(`<div class="filet"></div>`)}</div>
       ${actuels.length ? `<div class="rangee"><button class="petit" data-action="badgesAuto">Laisser la carte choisir</button></div>` : ""}`
    : `<p class="aide">Pas encore de badge ni de titre de collection : le premier million, une saison sans infraction, une série complète…</p>`;
  const reste = manquants.length ? repli("pz-badges", "À obtenir", String(manquants.length), manquants.map((b) => `<div class="pz-badge"><i></i><span><b>${esc(b.nom)}</b><span class="aide">${esc(b.detail)}</span></span></div>`).join(`<div class="filet"></div>`)) : "";
  return `<section class="rg-bloc" id="pz-tes-badges">${tete}${corps}${reste}</section>`;
}

/** D441 : ton rang de prestige (sa bannière se gagne avec lui) et le choix de te cacher du classement Général (SectionPrestige de l'iPhone). */
function sectionPrestige(p) {
  const m = p?.moi;
  if (!m) return "";
  return `<section class="rg-bloc" id="pz-prestige">
    <div class="cz-tete-chiffres"><h2 class="libelle">Ton prestige</h2><span class="chiffres or">${esc(`${m.nom} · niv. ${m.niveau}`)}</span></div>
    <div class="cg-jauge"><i style="width:${Math.round(m.progression * 100)}%"></i></div>
    <p class="aide">${m.points} points, à vie : tes succès, tes saisons et tes collections, × la note du monde et ton profil de départ. Chaque rang donne sa bannière.</p>
    ${carte(interrupteur({ titre: "Paraître au classement Général", actif: !p.cache, action: "cacherGeneral" }))}
  </section>`;
}

function ongletCarte(d, ctx) {
  const t = d.t, c = d.c;
  const vit = vitrineChoisie(c);
  const badges = c?.badges ?? [];
  const fortune = c?.fortune ?? [];
  return `${partie("Ta carte", "Ta carte de membre telle que les autres la voient, ses badges, ton record et tes cartes de fortune.")}
    ${apercuCarte(ctx, t, { titreProfil: d.titreProfil, carte: vit.palier, record: d.record, badges: c?.badges, affiches: c?.affiches })}
    ${sectionBadges(c)}
    ${sectionPrestige(d.prestige)}
    <section class="rg-bloc" id="pz-record">
      <div class="cz-tete-chiffres"><h2 class="libelle">Ton record</h2><span class="chiffres ${t.record != null ? "or" : "t2"}">${t.record != null ? esc(montant(t.record)) : "–"}</span></div>
      <p class="aide">Ton meilleur patrimoine de fin de saison. Chaque palier donne ses pièces et ses cartes, à vie.</p>
      ${t.prochaine ? carte(`<div class="cz-jauge">
          <span class="cz-jauge-texte"><b>${esc(t.prochaine.titre)}</b><span>${esc(t.prochaine.detail)}</span></span>
          ${t.prochaine.pieces[0] ? C.apercu(t.prochaine.pieces[0]) : ""}
          <span class="cz-jauge-rail"><i style="--part:${(t.prochaine.progression * 100).toFixed(1)}%"></i></span></div>`) : ""}
      ${repli("pz-paliers", `Les ${t.paliers.length} paliers de record`, `${t.paliers.filter((p) => p.atteint).length} atteints`,
        `${echelle(t)}<p class="aide cz-note">Les deux derniers paliers s'ouvrent aussi au cumul de toutes tes saisons.</p>`)}
      ${palmares(d.palmares)}
    </section>
    ${sectionCartes(c)}
    ${fortune.length ? repli("pz-fortune", "Les cartes de fortune", `${fortune.filter((x) => x.acquise).length} sur ${fortune.length}`,
      `<div class="grille2 grille-fortune">${fortune.map(carteCollection).join("")}</div>`) : ""}
    ${sectionCartesBancaires(d)}`;
}

function ongletStyle(d) {
  const t = d.t;
  const f = t.familles.find((x) => x.id === etat.famille) ?? t.familles[0];
  return `${partie("Ton style", `Tes pièces, gagnées aux paliers de record et par les défis de saison : ${t.gagnees} sur ${t.total}. Elles te suivent d'une saison à l'autre.`)}
    ${apercuObjets(t)}
    ${t.defis.length && t.defisDansObjectifs === false /* D414 : ici seulement si l'admin a coupé « Défis de saison dans Objectifs » */
      ? `<div>${section(t.nomSaison ? `Les défis de ${t.nomSaison}` : "Les défis de la saison")}${listeDefis(t.defis)}<p class="aide cz-note">Les mêmes pour tous les joueurs de ton monde. Chacun donne une pièce unique, qui te suit.</p></div>` : ""}
    <div class="cz-familles" role="tablist">${t.familles.map((x) => `<button class="cz-famille-pastille" role="tab" data-action="choisirFamille" data-id="${esc(x.id)}" aria-pressed="${x.id === f?.id}" aria-selected="${x.id === f?.id}"><b>${esc(x.nom)}</b><span class="chiffres">${x.gagnees} / ${x.total}</span></button>`).join("")}</div>
    ${f ? `<div><p class="aide cz-note">${esc(f.detail)}</p>
      ${f.sortes.map((s) => `<div class="cz-sorte" data-cle="${esc(s.id)}"><div class="libelle cz-sorte-nom">${esc(s.nom)} <span class="t2">· ${esc(s.equipee ? s.pieces.find((p) => p.id === s.equipee)?.nom ?? s.defaut : s.defaut)}</span></div>
        <div class="cz-choix" role="listbox" aria-label="${esc(s.nom)}">
          <button class="cz-tuile gagnee" data-action="equiper" data-sorte="${esc(s.id)}" data-id="" aria-pressed="${!s.equipee}"><span class="cz-base">${esc(s.defaut)}</span><span class="cz-tuile-texte"><b>${esc(s.defaut)}</b><span class="cz-source">De base</span></span></button>
          ${s.pieces.map((p) => tuile(p, { action: "equiper", choisie: s.equipee === p.id })).join("")}
        </div></div>`).join("")}</div>` : ""}
    <p class="aide cz-note">Les autres joueurs voient ton profil, ta carte du monde et tes finitions ; l'interface reste à toi.</p>`;
}

export const pages = {
  // RNT-326 : « Personnaliser mon profil », la seule page où l'on règle ce que les autres voient de soi
  // (EcranPersonnaliser de l'iPhone). D394 : en onglets ; plus de pages Vitrine, Collection ni « Ma vitrine ».
  personnaliser: {
    titre: "Personnaliser mon profil",
    css: ["cosmetiques", "compte", "enligne", "reglages", "series"],
    async donnees(ctx, p) {
      const [t, c, r, pr, cat, mes] = await Promise.all([lire(ctx), ctx.tableau("collection").catch(() => null), ctx.tableau("recompenses").catch(() => null),
        ctx.tableau("profil").catch(() => null), T.catalogue(ctx), ctx.etat.compte && !ctx.etat.horsLigne ? T.chargerMesTitres(ctx) : null]);
      const d = { t, c, r, record: pr?.meilleurScore ?? null, palmares: pr?.palmares ?? [], cat, mes, titreProfil: T.monTitre(cat) };
      await completer(ctx, d, ongletDe(p));
      return d;
    },
    rendu(d, ctx, p) {
      const t = d.t;
      if (!t) return `${entetePousse("Personnaliser mon profil")}${vide("Ton profil se personnalise dès ta première saison.")}`;
      const o = ongletDe(p);
      const corps = o === "carte" ? ongletCarte(d, ctx) : o === "vitrine" ? ongletVitrine(d.sc) : o === "collection" ? ongletCollection(d.sc)
        : o === "style" ? ongletStyle(d) : o === "icones" ? `${partie("Icône de l'app", "Pour toi seul : l'icône de l'onglet de ton navigateur.")}${sectionIcones(d.icones)}` : ongletProfil(d, ctx);
      return `${entetePousse("Personnaliser mon profil")}
      <div class="cz-page" data-onglet="${o}">
        <div class="pz-onglets">${segment(ONGLETS, o, "ongletPerso")}</div>
        ${corps}
      </div>`;
    },
    actions: {
      ...actionsSeries, // D394 : les onglets Collection et Vitrine (series.js)
      /** D441 : se cacher du classement Général (ou y revenir) ; la vitrine republiée le dit au serveur. */
      async cacherGeneral(ctx, b, d) {
        const cache = !(d?.prestige?.cache ?? false);
        await ctx.jouer("prestige.cacher", { oui: cache });
        if (d) d.prestige = await ctx.tableau("prestige").catch(() => null);
        await ctx.rafraichir();
      },
      /** D394 : un onglet ; ce qu'il lit en plus se charge à la première ouverture. */
      async ongletPerso(ctx, b, d, p) {
        if (!p || !d) return;
        p.onglet = b.dataset.valeur;
        await completer(ctx, d, p.onglet);
        ctx.redessiner();
        window.scrollTo?.({ top: 0 });
      },
      choisirFamille(ctx, b) { etat.famille = b.dataset.id; ctx.redessiner(); },
      /** D391 : une icône débloquée se choisit (le favicon suit) ; verrouillée, sa condition s'affiche sous la grille. */
      choisirIcone(ctx, b, d) {
        const i = d.icones?.icones.find((x) => x.id === b.dataset.id);
        if (!i) return;
        if (!i.debloquee) { etat.iconeMontree = etat.iconeMontree === i.id ? null : i.id; return ctx.redessiner(); }
        etat.iconeMontree = null;
        choisirIcone(i.fichier);
        vibrer();
        ctx.redessiner();
      },
      // D392, D427 : les badges montrés sur la carte (4 au plus), choisis sur la page.
      async basculerBadge(ctx, b) {
        const id = b.dataset.id;
        let choix = JSON.parse(b.closest("[data-choix]")?.dataset.choix ?? "[]");
        if (choix.includes(id)) choix = choix.filter((x) => x !== id);
        else if (choix.length < 4) choix = [...choix, id];
        else { ctx.toast("Quatre badges au plus : retires-en un d'abord.", "refus"); return; }
        vibrer();
        await ctx.jouer("badges.afficher", { ids: choix });
        ctx.rafraichir();
      },
      async badgesAuto(ctx) { await ctx.jouer("badges.afficher", { ids: [] }); ctx.rafraichir(); },
      // RNT-367 : l'accent, avant dans Réglages › Apparence.
      choisirAccent(ctx, b) { choisirAccent(b.dataset.accent); vibrer(); ctx.redessiner(); },
      /** RNT-367 : le pseudo, avant dans « Toi ». Unique sur le serveur : on le change là d'abord (ModeleCompte.changerPseudo). */
      async enregistrerPseudo(ctx) {
        const p = (document.getElementById("pseudo-compte")?.value ?? "").trim();
        if (p === ctx.etat.compte?.pseudo) return;
        erreurPseudo = "";
        if (p.length < 2 || p.length > 20) { erreurPseudo = "De 2 à 20 caractères."; return ctx.redessiner(); }
        const code = lireLocal("grind.recuperation");
        if (!code) { erreurPseudo = "Ton compte n'est pas encore créé."; return ctx.redessiner(); }
        try {
          const c = await serveur.creerCompte(p, code);
          ctx.etat.compte = { ...ctx.etat.compte, pseudo: c.pseudo };
          ctx.toast("Pseudo enregistré", "gain");
          publierProfil(ctx);
        } catch (e) {
          erreurPseudo = e.message;
          const champ = document.getElementById("pseudo-compte");
          if (champ) champ.value = ctx.etat.compte?.pseudo ?? "";
        }
        ctx.redessiner();
      },
      // RNT-393 (D320) : le style d'une carte bancaire (avant : l'appui long sur la carte, dans Banque).
      styleCarteBancaire(ctx, b, d) { const c = d.banque?.cartes?.[Number(b.dataset.rang)]; if (c) d.B.ouvrirStyle(ctx, c); },
      // D393 : l'avatar se règle de nouveau ici (D388 l'avait retiré) ; les autres le voient tout de suite.
      choisirSymbole(ctx, b) { choisirSymbole(b.dataset.symbole); vibrer(); publierProfil(ctx); ctx.redessiner(); },
      choisirTeinte(ctx, b) { choisirTeinte(b.dataset.teinte); vibrer(); publierProfil(ctx); ctx.redessiner(); },
      // D389 : la carte qui porte le style gagné (une seule).
      porterStyleGagne(ctx, b) { C.equiper("styleCarteSur", b.dataset.id); vibrer(); ctx.redessiner(); },
      async equiper(ctx, b) {
        C.equiper(b.dataset.sorte, b.dataset.id);
        if (b.dataset.sorte === "sons" && b.dataset.id) import("../sons.js?v=3e8bddd9").then((s) => s.jouerFichier("ching"));
        await ctx.rafraichir();
      },
      /** La carte se garde sur l'appareil et part avec le profil publié (le moteur la borne à ce qu'on possède). */
      choisirCarteVitrine(ctx, b) {
        ecrireLocal(CLE_CARTE_VITRINE, b.dataset.palier ?? "");
        vibrer(); publierProfil(ctx); ctx.redessiner();
      },
      /** RNT-270 : le serveur retient le titre (il refuse celui qu'on n'a pas), puis le profil part avec. */
      async choisirTitreProfil(ctx, b) {
        try { await T.choisirMonTitre(b.dataset.id || null); } catch (e) { ctx.toast(e?.message || "Titre refusé.", "perte"); return; }
        const d = ctx.etat.donnees;
        if (d) { if (d.mes) d.mes = { ...d.mes, choisi: b.dataset.id || null }; d.titreProfil = T.monTitre(d.cat); }
        vibrer(); publierProfil(ctx); ctx.redessiner();
      },
      /** D387 : tous ses titres de collection, ou seulement les premiers. */
      voirTitresCollection(ctx) {
        const d = ctx.etat.donnees;
        if (d) d.toutVoirTitres = !d.toutVoirTitres;
        ctx.redessiner();
      },
    },
  },
};

/** D391 « Vingt icônes » : LA grille des icônes de l'app (comme ChoixIconeApp de l'iPhone) ; verrouillées en grisé,
 *  leur condition au toucher. Sur le web, l'icône choisie devient le favicon de l'onglet (icone-app.js). */
function sectionIcones(t) {
  if (!t?.icones?.length) return "";
  const choisie = iconeChoisie();
  const montree = t.icones.find((i) => i.id === etat.iconeMontree && !i.debloquee);
  const n = t.icones.filter((i) => i.debloquee).length;
  return `<section class="rg-bloc" id="pz-icones">
    <h2 class="libelle">Icône de l'app</h2>
    <div class="pz-icones" role="radiogroup" aria-label="Icône de l'app">${t.icones.map((i) => {
      const prise = i.debloquee && i.fichier === choisie;
      return `<button role="radio" class="pz-icone${i.debloquee ? "" : " verrou"}${montree?.id === i.id ? " montree" : ""}" data-action="choisirIcone" data-id="${esc(i.id)}"
        aria-checked="${prise}" aria-pressed="${prise}" aria-label="${esc(i.debloquee ? `Icône ${i.nom}` : `Icône ${i.nom}, verrouillée : ${i.condition}`)}">
        <span class="pz-icone-image"><img src="icones/famille/${esc(i.fichier)}.svg" alt="" width="56" height="56" loading="lazy">${i.debloquee ? "" : `<i class="pz-cadenas">${CADENAS}</i>`}</span>
        <span class="pz-icone-nom">${esc(i.nom)}</span></button>`;
    }).join("")}</div>
    ${montree ? `<p class="pz-icone-condition"><b>${esc(montree.nom)}</b> : ${esc(montree.condition)}</p>` : ""}
    <p class="aide">${n} sur ${t.icones.length}. Les verrouillées se gagnent avec un succès : touche-les pour savoir lequel. L'icône choisie devient celle de l'onglet.</p>
  </section>`;
}

const CADENAS = '<svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true"><path fill="currentColor" d="M7 10V7.5a5 5 0 0 1 10 0V10h.5A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10zm2.5 0h5V7.5a2.5 2.5 0 0 0-5 0z"/></svg>';

/** Un grand intertitre de la page, et sa phrase. */
const partie = (titre, aide) => `<div class="pz-partie"><h2>${esc(titre)}</h2><p class="aide">${esc(aide)}</p></div>`;

/** Ce que les autres voient de moi change : on le publie tout de suite. */
function publierProfil(ctx) {
  if (L.monde.code && ctx.etat.compte && !ctx.etat.horsLigne) L.synchroniser(ctx, { force: true }).catch(() => {});
}

/** RNT-325 : le titre de profil, toujours là (hors ligne et sans titre aussi : on dit pourquoi la liste est vide). */
function sectionTitres(d) {
  const liste = T.sectionTitres(d.cat, d.mes, !!d.toutVoirTitres);
  if (liste) return liste;
  const pourquoi = d.mes ? "Aucun titre pour l'instant." : "Tes titres s'affichent une fois en ligne.";
  // D387 : sans titre, on dit comment en gagner un (les séries de collection).
  const col = d.mes?.tableau?.collectionTotal ? `<p class="aide">${esc(d.mes.tableau.collectionTexte)}</p>` : "";
  return `<section class="rg-bloc"><h2 class="libelle">Titre de profil</h2><p class="aide">${pourquoi}</p>${col}</section>`;
}

/** RNT-322 : la carte de fortune montrée, parmi celles gagnées ; jamais une carte qu'on n'a pas. */
function sectionCartes(c) {
  const acquises = (c?.fortune ?? []).filter((x) => x.acquise);
  if (!acquises.length) return "";
  const brut = lireLocal(CLE_CARTE_VITRINE);
  const defaut = brut === "" || (brut !== "-1" && !acquises.some((x) => String(x.palier) === brut));
  return `<section class="rg-bloc"><h2 class="libelle">Carte de fortune</h2>
    <p class="aide">Une carte que tu as gagnée, en badge sur ta carte de membre, dans les mondes et les classements.</p>
    <div class="tp-liste">
      ${choixCarte({ palier: "", nom: "Ma plus haute carte", romain: "", actif: defaut })}
      ${[...acquises].reverse().map((x) => choixCarte({ palier: x.palier, nom: x.nom, romain: x.romain, actif: !defaut && String(x.palier) === brut })).join("")}
      ${choixCarte({ palier: -1, nom: "Aucune", romain: "", actif: brut === "-1" })}
    </div></section>`;
}

// MARK: Le dévoilement du bilan

/**
 * Les récompenses de la saison, une par une (TableauBilan.revelations) : une feuille, « Suivante »,
 * puis « Personnaliser ». Avec « réduire les animations », chaque pièce apparaît sans mouvement.
 */
export async function devoiler(ctx, revelations, { auDebut = 0 } = {}) {
  if (!revelations?.length) return;
  await C.chargerCatalogue(ctx);
  let i = auDebut;
  const rendu = () => {
    const r = revelations[i];
    const p = r.genre === "piece" ? { ...(C.piece(r.piece) ?? {}), sorte: C.piece(r.piece)?.sorte ?? "", gagnee: true } : null;
    const visuel = p?.sorte ? C.apercu(p, { grand: true }) : `<span class="cz-apercu grand cz-badge" style="--c1:#E3C46B;--c2:#8A6A2B"><span class="cz-mini-carte"><i></i><b>${esc(r.nom)}</b></span></span>`;
    const dernier = i === revelations.length - 1;
    return `<div class="cz-devoile" data-rarete="${r.rarete}" data-cle="r${i}">
      <div class="cz-devoile-points" aria-hidden="true">${revelations.map((_, k) => `<i class="${k < i ? "vu" : k === i ? "ici" : ""}"></i>`).join("")}</div>
      <div class="cz-devoile-scene cz-devoile-objet" data-cle="o${i}">${visuel}</div>
      <div class="cz-devoile-texte cz-devoile-objet" data-cle="t${i}" aria-live="polite">
        <span class="cz-rarete" data-r="${r.rarete}">${esc(r.rareteNom)} · ${esc(r.sorte)}</span>
        <b>${esc(r.nom)}</b><span>${esc(r.detail)}</span></div>
      <div class="cz-devoile-boutons">
        ${dernier ? bouton("Fermer", "fermer") : bouton(`Suivante (${i + 2} sur ${revelations.length})`, "suivante")}
        ${dernier ? "" : bouton("Passer", "toutVoir", { genre: "discret" })}
      </div></div>`;
  };
  ctx.feuille({
    titre: `${revelations.length} récompense${revelations.length > 1 ? "s" : ""} gagnée${revelations.length > 1 ? "s" : ""}`,
    rendu,
    actions: {
      suivante(c) { i = Math.min(revelations.length - 1, i + 1); c.redessiner(); import("../sons.js?v=3e8bddd9").then((s) => s.jouerSon(revelations[i].rarete >= 4 ? "succes" : "piece")); },
      toutVoir(c) { c.fermerFeuille(); }, // D394 : « Passer » (comme l'iPhone) ; le bilan les montre toutes
      fermer(c) { c.fermerFeuille(); },
    },
  });
}
