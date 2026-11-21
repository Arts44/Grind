// ══════════════════════════════════════════════════════════════════════
//  Billets du voyage (D348, 1.18.8) — Rente/Design/BilletsVoyage.swift.
//
//  Arthur : « pas de ticket pour un voyage en voiture, réfléchis et sois
//  cohérent ». Le moteur dit l'allure de chaque devis (`genre`) :
//   - billet : avion de ligne (codes d'aéroport), train (gares), bus, ferry ;
//   - itineraire : ton véhicule, le taxi : une carte de route, pas de billet ;
//   - planDeVol : ton avion, le jet loué : un arc, sans siège ni porte.
//  La classe (2de, 1re, Business ; Éco à Première) se choisit sous les
//  billets. En route : la carte d'embarquement, l'arc du vol, le billet
//  électronique, ou au volant les jauges fines. Styles : css/pages/monde.css
//  (§ D348) ; les seules valeurs posées ici sont des variables (--c, --v).
// ══════════════════════════════════════════════════════════════════════
import { montant, duree, esc } from "../format.js?v=3e8bddd9";
import { friseTrajet } from "../ui.js?v=3e8bddd9";
import { sf, teinteMoyen, vignetteVehicule } from "./monde.js?v=3e8bddd9";

const heure = (ms) => new Date(ms).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
const kmTexte = (km, local) => (local ? `${km.toFixed(1).replace(".", ",")} km` : `${Math.round(km).toLocaleString("fr-BE")} km`);

/** L'allure d'un devis venu sans elle (le calcul de secours de la page) : la règle de ReglesTrajets.genre. */
export const genreDe = (dv, source) => dv.genre ?? (source === "public" ? "billet" : ["avionPerso", "jet"].includes(dv.moyen) ? "planDeVol" : "itineraire");

/** La classe affichée : celle choisie, sinon celle proposée (DevisTrajet.offre(classe:)). */
export const offreDe = (dv, classe) => (dv.classes ?? []).find((o) => o.id === (classe ?? dv.classe)) ?? (dv.classes ?? []).find((o) => o.id === dv.classe) ?? null;
/** Le prix dans cette classe (DevisTrajet.cout(classe:)). */
export const prixDe = (dv, classe) => offreDe(dv, classe)?.cout ?? dv.cout;

function prixTexte(dv, local, classe) {
  if (dv.refus) return "Indisponible";
  if (dv.cout == null) return "Au compteur";
  const c = prixDe(dv, classe); // D350 : en ville aussi (le train régional a ses classes)
  return local ? (c === 0 ? "Gratuit" : montant(c, { centimes: true })) : montant(c);
}

/** Un devis en fiche : un billet, une carte de route ou un plan de vol (FicheMoyen). */
export function ficheMoyen(dv, choisi, local = false, classe = null) {
  return dv.genre === "billet" ? ficheBillet(dv, choisi, local, classe) : ficheItineraire(dv, choisi, local);
}

function ficheBillet(dv, choisi, local, classe) {
  const possible = !dv.refus;
  const part = dv.prochainDepart ?? Date.now();
  const arrivee = part + (dv.minutes ?? 0) * 60_000;
  const aerien = dv.moyen === "avion";
  const offre = offreDe(dv, classe);
  const codes = dv.codeDe != null && dv.codeVers != null;
  const bout = (code, nom, h, fin) => `<span class="vo-bout${fin ? " fin" : ""}"><b class="vo-code${aerien ? "" : " ville"}">${esc(code)}</b><i>${esc(nom ?? "")}</i><em class="chiffres">${h}</em></span>`;
  const corps = codes
    ? `<span class="vo-codes">${bout(dv.codeDe, dv.nomDe, heure(part), false)}
        <span class="vo-milieu"><span class="vo-fil">${sf(dv.icone, 11)}</span><i class="chiffres">${dv.minutes == null ? "" : duree(dv.minutes)}</i></span>
        ${bout(dv.codeVers, dv.nomVers, heure(arrivee), true)}</span>`
    : `<span class="vo-seul"><b>${esc(dv.nom)}</b><i class="chiffres">${dv.prochainDepart ? `Prochain à ${heure(dv.prochainDepart)}` : dv.minutes == null ? "" : duree(dv.minutes)}</i></span>`;
  const note = dv.refus ?? dv.fermeArrivee ?? (dv.note || (dv.prochainDepart ? `Départ à ${heure(dv.prochainDepart)}` : ""));
  return `<button data-action="choisirMoyen" data-id="${esc(dv.id)}" aria-pressed="${choisi}" class="vo-fiche vo-billet${possible ? "" : " vo-off"}" style="--c:${teinteMoyen(dv.moyen, dv.vehicule)}">
    <span class="vo-tete"><span class="vo-mode">${sf(dv.icone, 12)}<span>${esc(dv.nom)}</span></span><span class="vo-prix chiffres">${prixTexte(dv, local, classe)}</span></span>
    ${corps}
    <span class="vo-talon"><b>${esc(offre?.nom ?? (local ? "Ticket" : "Billet"))}</b><i class="${possible ? "" : "alerte"}">${esc(note)}</i></span>
  </button>`;
}

function ficheItineraire(dv, choisi, local) {
  const possible = !dv.refus;
  const vol = dv.genre === "planDeVol";
  const arrivee = (dv.prochainDepart ?? Date.now()) + (dv.minutes ?? 0) * 60_000;
  const tete = dv.photo ? vignetteVehicule(dv, 84, 52) : `<span class="vo-ico">${sf(dv.icone, 18)}</span>`;
  // Le plan de vol n'a pas la place d'une note par défaut (les codes la remplacent).
  const sienne = vol && dv.note === "Tu pars quand tu veux" ? "" : dv.note; // la note de secours de la page
  const note = dv.refus ?? dv.fermeArrivee ?? (sienne || (vol ? "" : "Tu pars quand tu veux"));
  return `<button data-action="choisirMoyen" data-id="${esc(dv.id)}" aria-pressed="${choisi}" class="vo-fiche vo-route${possible ? "" : " vo-off"}" style="--c:${teinteMoyen(dv.moyen, dv.vehicule)}">
    <span class="vo-tete">${tete}<span class="vo-prix chiffres">${prixTexte(dv, local)}${vol ? "<small>Plan de vol</small>" : ""}</span></span>
    <span class="vo-nom">${esc(dv.nom)}</span>
    ${vol && dv.codeDe && dv.codeVers ? `<span class="vo-sous">${esc(dv.codeDe)} → ${esc(dv.codeVers)}</span>` : ""}
    ${trace(vol, 0)}
    ${note ? `<span class="vo-note${possible ? "" : " alerte"}">${esc(note)}</span>` : ""}
    <span class="vo-stats"><span><i>Distance</i><b class="chiffres">${kmTexte(dv.km ?? 0, local)}</b></span>
      <span class="m"><i>Durée</i><b class="chiffres">${dv.minutes == null ? "Au départ" : duree(dv.minutes)}</b></span>
      <span class="f"><i>Arrivée</i><b class="chiffres">${dv.minutes == null ? "—" : heure(arrivee)}</b></span></span>
  </button>`;
}

/** Le tracé : une ligne entre deux points (la route) ou un arc en pointillés (le vol) ; `part` : le trait plein. */
function trace(arc, part, id = "") {
  const d = arc ? "M2 22 Q50 -8 98 22" : "M2 6 L98 6"; // l'arc garde sa forme, la hauteur suit le CSS
  return `<span class="vo-trace${arc ? " arc" : ""}"><svg viewBox="0 0 100 ${arc ? 24 : 12}" preserveAspectRatio="none" aria-hidden="true">
    <path class="fond" d="${d}" pathLength="100"/><path class="fait" d="${d}" pathLength="100"${id ? ` id="${id}"` : ""} style="--v:${(part * 100).toFixed(1)}"/></svg></span>`;
}

/** D348 : 2de, 1re ou Business ; Éco à Première ; dessous, ce qu'elle apporte (ChoixClasse). */
export function choixClasse(dv, classe) {
  const offres = dv?.classes ?? [];
  if (dv?.refus || offres.length < 2) return "";
  const c = offreDe(dv, classe) ?? offres[0];
  return `<div class="vo-classes"><div class="libelle">Classe</div>
    <div class="vo-classes-l" role="group" aria-label="Classe">${offres.map((o) => `<button class="vo-classe" data-action="choisirClasse" data-id="${esc(o.id)}" aria-pressed="${o.id === c.id}" aria-label="${esc(`${o.nom}, ${montant(o.cout)}`)}"><b>${esc(o.court)}</b><i class="chiffres">${montant(o.cout)}</i></button>`).join("")}</div>
    <p class="aide">${esc(`${c.avantages}. ${textePlaisir(c.plaisir)}`)}</p></div>`;
}

/** D383 : le plan de cabine de la classe affichée (avion de ligne) ; null : sans plan. */
export const planDe = (dv, classe) => (dv?.refus ? null : offreDe(dv, classe)?.planCabine ?? null);
/** D383 : la place retenue : touchée, sinon proposée par le plan (le dernier genre choisi) ; null : au hasard. */
export const placeDe = (dv, classe, siege, auHasard) => {
  const plan = planDe(dv, classe);
  return !plan || auHasard ? null : siege ?? plan.propose ?? null;
};
const placeDuPlan = (plan, id) => plan.rangs.flatMap((r) => r.blocs.flat()).find((p) => p.id === id) ?? null;
/** D383 : le prix dans cette classe à cette place (DevisTrajet.cout(classe:siege:)). */
export const prixPlaceDe = (dv, classe, siege) => {
  const plan = planDe(dv, classe), p = plan && siege ? placeDuPlan(plan, siege) : null;
  return prixDe(dv, classe) + (p ? plan.genres.find((g) => g.id === p.genre)?.supplement ?? 0 : 0);
};

/** D383 : le petit plan de cabine à toucher (PlanCabineVue) : places colorées par genre, prises grisées, la choisie
 *  à l'accent ; la légende dit l'effet et le supplément. Le plan défile dans un cadre court (Éco : 27 rangs). */
export function planCabine(dv, classe, siege, auHasard) {
  const plan = planDe(dv, classe);
  if (!plan) return "";
  const choisie = placeDe(dv, classe, siege, auHasard);
  const p = choisie ? placeDuPlan(plan, choisie) : null;
  const g = p ? plan.genres.find((x) => x.id === p.genre) : null;
  const nom = (id) => plan.genres.find((x) => x.id === id)?.nom ?? id;
  const rangee = (numero, blocs) => `<div class="vo-rang"><i class="chiffres">${numero ?? ""}</i>${blocs.join('<span class="vo-allee"></span>')}<i></i></div>`;
  const tete = rangee(null, plan.lettres.map((b) => `<span class="vo-bloc">${b.map((l) => `<b>${esc(l)}</b>`).join("")}</span>`));
  const rangs = plan.rangs.map((r) => rangee(r.numero, r.blocs.map((b) => `<span class="vo-bloc">${b.map((x) =>
    `<button class="vo-siege g-${esc(x.genre)}" data-action="choisirSiege" data-id="${esc(x.id)}" aria-pressed="${x.id === choisie}"${x.prise ? " disabled" : ""} aria-label="${esc(`Place ${x.id}, ${nom(x.genre)}${x.prise ? ", prise" : ""}`)}"></button>`).join("")}</span>`)));
  const legende = plan.genres.map((x) => `<span><i class="g-${esc(x.id)}"></i>${esc(x.nom)}${x.supplement > 0 ? ` +${montant(x.supplement)}` : ""}</span>`).join("")
    + `<span><i class="g-prise"></i>Prise</span>`;
  const texte = p ? `${p.id} · ${g?.nom ?? ""} : ${g?.effet ?? ""}. ${textePlaisir(g?.plaisir ?? 0)}` : "Touche une place libre ; sans choix, elle est tirée au hasard.";
  return `<div class="vo-cabine-b"><div class="vo-allure-t"><span class="libelle">Ta place</span>${p ? `<button class="vo-hasard" data-action="siegeAuHasard">Au hasard</button>` : ""}</div>
    <div class="vo-cabine">${tete}<div class="vo-cabine-rangs${plan.rangs.length > 6 ? " long" : ""}">${rangs.join("")}</div></div>
    <div class="vo-legende-sieges">${legende}</div>
    <p class="aide">${esc(texte)}</p></div>`;
}

/** D355 : au volant de ton véhicule, l'allure : Prudent, Normal, Pressé (ChoixAllure) ; durée, prix, risque de radar. */
export function choixAllure(dv, allure) {
  const offres = dv?.allures ?? [];
  if (dv?.refus || !offres.length) return "";
  const c = offres.find((o) => o.id === (allure ?? dv.allure)) ?? offres[0];
  const risque = c.risqueRadar > 0 ? ` Risque de radar : ${Math.round(c.risqueRadar * 100)} %.` : "";
  return `<div class="vo-classes"><div class="vo-allure-t"><span class="libelle">Allure</span>${dv.pointsPermis != null ? `<span class="chiffres t2">Permis : ${dv.pointsPermis} points</span>` : ""}</div>
    <div class="vo-classes-l" role="group" aria-label="Allure">${offres.map((o) => `<button class="vo-allure-p" data-action="choisirAllure" data-id="${esc(o.id)}" aria-pressed="${o.id === c.id}" aria-label="${esc(`${o.nom}, ${o.minutes} minutes, ${montant(o.cout)}`)}"><b>${esc(o.nom)}</b><i class="chiffres">${o.minutes} min · ${montant(o.cout)}</i></button>`).join("")}</div>
    <p class="aide">${esc(c.resume + risque)}</p></div>`;
}

/** D355 : l'allure retenue d'un devis (celle choisie, sinon celle proposée). */
export const allureDe = (dv, allure) => (dv?.allures ?? []).find((o) => o.id === (allure ?? dv.allure)) ?? null;

export function textePlaisir(p) {
  const v = Math.abs(p).toFixed(1).replace(".0", "").replace(".", ",");
  if (p > 0.05) return `Plaisir +${v}.`;
  if (p < -0.05) return `−${v} de plaisir : les heures sont longues.`;
  return "Sans effet sur le plaisir.";
}

// MARK: En route

const part = (r, now) => (r.arrivee > r.depart ? Math.min(1, Math.max(0, (now - r.depart) / (r.arrivee - r.depart))) : 1);

/** La vitesse au compteur (ConduiteEnCours.vitesse) : nulle au départ et à l'arrivée, autour de la moyenne entre.
 *  D352 : `profil` (vitessesKmh) : la vitesse au volant tronçon par tronçon (la zone traversée), comme l'iPhone. */
export function vitesseConduite(moyenne, p, profil = null) {
  if (!(p > 0 && p < 1)) return 0;
  let base = moyenne;
  if (profil?.length) {
    const x = Math.min(profil.length - 1, Math.max(0, p * profil.length - 0.5));
    const i = Math.floor(x), f = x - i;
    base = profil[i] + (profil[Math.min(profil.length - 1, i + 1)] - profil[i]) * f;
  }
  const rampe = Math.min(1, p / 0.04, (1 - p) / 0.04);
  const houle = 0.93 + 0.14 * (0.5 + 0.5 * Math.sin(p * 2 * Math.PI * 7));
  return Math.round(base * houle * rampe);
}

/** Le trajet en cours selon son allure (CarteEnRoute). `id` : le préfixe des éléments que `ticEnRoute` met à jour. */
export function carteEnRoute(r, now, id) {
  if (r.conduite) return conduite(r, r.conduite, now, id);
  if (r.billet && (r.billet.moyen === "avion" || r.billet.genre === "planDeVol")) return carteVol(r, r.billet, now, id);
  if (r.billet) return billetEnRoute(r, r.billet, now, id);
  return `<div id="${id}-frise">${friseTrajet({ de: r.de, vers: r.vers, mode: "camion", depart: r.depart, arrivee: r.arrivee, maintenant: now })}</div>`;
}

const champ = (t, v, fin = false) => `<span class="vo-champ${fin ? " fin" : ""}"><i>${esc(t)}</i><b class="chiffres">${esc(v)}</b></span>`;

function carteVol(r, b, now, id) {
  const p = part(r, now);
  const ligne = b.moyen === "avion";
  const reste = now < r.depart ? duree(Math.round((r.arrivee - r.depart) / 60_000)) : `${duree(Math.max(0, Math.round((r.arrivee - now) / 60_000)))} restantes`;
  const pied = ligne
    ? `${champ("Terminal", b.terminal ?? "—")}${champ("Porte", b.porte ?? "—")}${champ(b.genreSiege ?? "Siège", b.siege ?? "—")}${champ(b.classe ?? "Vol", b.numero, true)}` // D383 : « Hublot 19A »
    : `${champ("Plan de vol", `${b.codeDe ?? ""} → ${b.codeVers ?? ""}`)}${champ(b.numero || "Ton appareil", r.moyen, true)}`;
  const embarquement = ligne && now < r.depart
    ? `<div class="vo-embarquement"><div class="pile"><b>Carte d'embarquement</b>${b.embarquement ? champ("Embarquement jusqu'à", heure(b.embarquement)) : ""}${champ("Réservation", b.reference)}</div>${qr(b.reference)}</div>` : "";
  return `<div class="vo-vol">
    <div class="vo-vol-haut"><span class="vo-bout"><b class="vo-code">${esc(b.codeDe ?? r.de)}</b><em class="chiffres">${heure(r.depart)}</em></span>
      <span class="vo-vol-arc">${trace(true, p, `${id}-arc`)}<i class="chiffres" id="${id}-restant">${reste}</i></span>
      <span class="vo-bout fin"><b class="vo-code">${esc(b.codeVers ?? r.vers)}</b><em class="chiffres">${heure(r.arrivee)}</em></span></div>
    <div class="vo-pied">${pied}</div>${embarquement}</div>`;
}

function billetEnRoute(r, b, now, id) {
  const bout = (code, nom, h, fin) => `<span class="vo-bout${fin ? " fin" : ""}"><b class="vo-code ville">${esc(code)}</b>${nom && nom !== code ? `<i>${esc(nom)}</i>` : ""}<em class="chiffres">${h}</em></span>`;
  return `<div class="vo-ebillet">
    <div class="vo-codes">${bout(b.codeDe ?? r.de, b.nomDe, heure(r.depart), false)}${bout(b.codeVers ?? r.vers, b.nomVers, heure(r.arrivee), true)}</div>
    <div class="vo-avance">${sf(r.icone, 12)}${trace(false, part(r, now), `${id}-ligne`)}</div>
    <div class="vo-pied pointille">${b.voiture ? champ("Voiture", b.voiture) : ""}${b.siege ? champ("Place", b.siege) : ""}${b.embarque ? champ("À bord", b.embarque) : ""}${champ(b.classe ?? "Billet", b.numero, true)}</div></div>`;
}

/** Un QR décoratif tiré de la référence (QRDecoratif) : trois repères et des modules ; il ne mène nulle part. */
function qr(graine) {
  const n = 21;
  let h = 1469598103934665603n;
  for (const c of new TextEncoder().encode(graine)) h = ((h ^ BigInt(c)) * 1099511628211n) & 0xFFFFFFFFFFFFFFFFn;
  const repere = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  let rects = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let plein;
    if (repere(x, y)) {
      const dx = x < 7 ? x : x - (n - 7), dy = y < 7 ? y : y - (n - 7);
      plein = dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
    } else {
      h ^= (h << 13n) & 0xFFFFFFFFFFFFFFFFn; h ^= h >> 7n; h ^= (h << 17n) & 0xFFFFFFFFFFFFFFFFn;
      plein = (h & 3n) === 0n || (h & 5n) === 1n;
    }
    if (plein) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg class="vo-qr" viewBox="0 0 ${n} ${n}" aria-hidden="true">${rects}</svg>`;
}

const ARC = "M15.96 64.04 A34 34 0 1 1 64.04 64.04";
/** Une jauge fine (JaugeFine) : un arc de 270°, la valeur en trait, une aiguille, le chiffre au centre. */
function jauge(titre, v, texte, unite, id, alerte = false) {
  const x = Math.min(1, Math.max(0, v));
  return `<span class="vo-jauge${alerte ? " alerte" : ""}" id="${id}"><svg viewBox="0 0 80 80" aria-hidden="true"><path class="fond" d="${ARC}" pathLength="100"/>
      <path class="val" d="${ARC}" pathLength="100" style="--v:${(x * 100).toFixed(1)}"/><g class="aiguille" style="--a:${(270 * x - 135).toFixed(1)}deg"><circle cx="40" cy="6" r="3"/></g></svg>
    <span class="vo-jauge-c"><b class="chiffres">${esc(texte)}</b><i>${esc(unite)}</i></span><span class="vo-jauge-t">${esc(titre)}</span></span>`;
}

function valeursConduite(r, c, now) {
  const p = part(r, now);
  const vitesse = now < r.depart ? 0 : vitesseConduite(c.vitesseMoyenneKmh, p, c.vitessesKmh);
  const etat = c.etatDepart - (c.etatDepart - c.etatArrivee) * p;
  return { p, vitesse, etat, reste: Math.round(c.km * (1 - p)), paye: Math.round(c.carburant * p) };
}

function conduite(r, c, now, id) {
  const x = valeursConduite(r, c, now);
  return `<div class="vo-conduite" role="img" aria-label="${esc(`Au volant de ${c.vehicule}, ${x.vitesse} km/h, ${x.reste} km restants`)}">
    <div class="vo-conduite-t"><span><i>Au volant</i> ${esc(c.vehicule)}</span><span class="t2">${esc(r.de)} → ${esc(r.vers)}</span></div>
    <div class="vo-jauges">${jauge("Vitesse", x.vitesse / Math.max(1, c.vitesseMaxKmh), String(x.vitesse), "km/h", `${id}-vitesse`)}
      ${jauge("Trajet", x.p, String(x.reste), "km restants", `${id}-trajet`)}
      ${jauge("État", x.etat, String(Math.round(x.etat * 100)), "%", `${id}-etat`, x.etat < 0.3)}</div>
    <div class="vo-energie"><i>${esc(c.energie)}</i><span class="vo-fil-fin"><i id="${id}-energie" style="--v:${(x.p * 100).toFixed(1)}"></i></span>
      <span class="chiffres t2" id="${id}-paye">${montant(x.paye)} sur ${montant(c.carburant)}</span></div>
    ${c.allure ? `<div class="vo-allure"><b class="${c.allure === "Pressé" ? "vo-presse" : ""}">${esc(c.allure)}</b><span class="chiffres t2" id="${id}-limite">${limiteTexte(c, x.p)}</span><span class="chiffres t2">${c.points != null ? `Permis ${c.points}/${c.pointsMax}` : ""}</span></div>` : ""}
    ${c.flash && now >= r.depart && x.p >= c.flash.part ? `<p class="vo-flash">${esc(texteFlash(c.flash))}</p>` : ""}
    ${c.moyennePorteAPorteKmh != null ? `<p class="vo-porte chiffres">Moyenne porte à porte : ${Math.round(c.moyennePorteAPorteKmh)} km/h</p>` : ""}</div>`;
}

/** D355 : la limite de la zone traversée à cette part du trajet. */
function limiteTexte(c, p) {
  const l = c.limitesKmh ?? [];
  return l.length ? `Limite ${Math.round(l[Math.min(l.length - 1, Math.max(0, Math.floor(p * l.length)))])}` : "";
}

/** D355 : la phrase d'un radar (FlashRadar.texte). */
function texteFlash(f) {
  return `Flashé à ${Math.round(f.kmh)} km/h (limite ${Math.round(f.limiteKmh)}) : ${montant(f.amende)}, ${f.points} point${f.points > 1 ? "s" : ""}${f.suspension ? ", permis suspendu" : ""}`;
}

/** Chaque seconde : les jauges, l'arc et la ligne avancent sans redessiner la carte. */
export function ticEnRoute(r, now, id) {
  if (!r) return;
  const p = part(r, now);
  for (const k of ["arc", "ligne"]) document.getElementById(`${id}-${k}`)?.style.setProperty("--v", (p * 100).toFixed(1));
  const rest = document.getElementById(`${id}-restant`);
  if (rest && now >= r.depart) rest.textContent = `${duree(Math.max(0, Math.round((r.arrivee - now) / 60_000)))} restantes`;
  const c = r.conduite;
  if (!c) return;
  const x = valeursConduite(r, c, now);
  const poser = (k, v, texte) => {
    const el = document.getElementById(`${id}-${k}`);
    if (!el) return;
    const w = Math.min(1, Math.max(0, v));
    el.querySelector(".val")?.style.setProperty("--v", (w * 100).toFixed(1));
    el.querySelector(".aiguille")?.style.setProperty("--a", `${(270 * w - 135).toFixed(1)}deg`);
    const b = el.querySelector(".vo-jauge-c b");
    if (b) b.textContent = texte;
  };
  poser("vitesse", x.vitesse / Math.max(1, c.vitesseMaxKmh), String(x.vitesse));
  poser("trajet", x.p, String(x.reste));
  poser("etat", x.etat, String(Math.round(x.etat * 100)));
  document.getElementById(`${id}-energie`)?.style.setProperty("--v", (x.p * 100).toFixed(1));
  const lim = document.getElementById(`${id}-limite`);
  if (lim) lim.textContent = limiteTexte(c, x.p); // D355
  const paye = document.getElementById(`${id}-paye`);
  if (paye) paye.textContent = `${montant(x.paye)} sur ${montant(c.carburant)}`;
}
