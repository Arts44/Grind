// ══════════════════════════════════════════════════════════════════════
//  Course (D445, 1.20) : EcranCourse.swift.
//
//  Tout vient du tableau « circuits » du moteur (TableauCircuits.swift),
//  le même que l'iPhone : le pilote et sa licence, rouler ici (journée
//  piste), les séries de la semaine (s'inscrire, calendrier, classement),
//  les derniers résultats, les circuits du monde. Les gestes partent dans
//  la famille « circuits ».
//  D446 : l'onglet Écurie (pilotes engagés, mécanos, sponsors) ; une série
//  peut être courue par un pilote de l'écurie.
//  D452 (docs/recherches/course.md : Gran Turismo, F1 Manager) : en haut,
//  la chose à faire (la prochaine manche, sinon réserver une session) ou,
//  en piste, l'écran en direct (Rentrer au stand toujours visible) ; tout
//  avant de payer (le jour et son tarif, les tours estimés, le risque) ;
//  les résultats en podium ; l'onglet Records (par circuit, par voiture).
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, ligne, bouton, petit, segment, rail, vide } from "../ui.js?v=3e8bddd9";
import { etatDe } from "./immobilier.js?v=3e8bddd9";

const vue = (p) => etatDe(p, "course", { onglet: "piste", circuit: null, vehicule: null, formule: "1h", tousVehicules: false, voiture: {}, pilote: {}, nomEcurie: "", instructeur: false, reglages: {} });
const DISC = { kart: "Karting", coupe: "Coupe", gt4: "GT4", gt3: "GT3", endurance: "Endurance", monoplace: "Monoplace", moto: "Moto" };
const heure = (d) => new Date(d).toLocaleString("fr-BE", { weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function blocPilote(t, v) {
  const p = t.pilote;
  // D457 : ce qu'il faut pour la licence suivante (fait, à faire), puis l'examen pratique sur un vrai circuit (onglet Rouler).
  const conds = (p.conditions ?? []).map((x) => `<div class="aide${x.ok ? " co-ici" : ""}">${x.ok ? "✓" : "○"} ${esc(x.texte)}</div>`).join("");
  const lic = p.prochaineLicence
    ? `<div class="co-section"><div class="co-manche"><span class="co-fort">Licence ${esc(p.prochaineLicenceNom)}</span><span class="aide">${p.prochaineLicencePrix ? `examen ${montant(p.prochaineLicencePrix)}` : "examen gratuit"}</span></div>
        ${conds}${p.examenOuvert && v.onglet !== "piste" ? `<div>${petit("Passer l'examen sur un circuit", "allerRouler", { plein: true, donnees: { id: "" } })}</div>` : ""}</div>
      ${p.theorie ? bouton(p.theorieAcquise ? "Théorie acquise : revoir le règlement" : "La théorie : le règlement, 20 questions", "", { genre: "secondaire", page: "codeEntrainement", p: { permis: p.theorie } }) : ""}
      ${p.theorieManque ? `<p class="aide" id="co-theorie-manque">${esc(p.theorieManque)} En attendant, révise : chaque heure ouvre une série.</p>` : ""}` : ""; // D460 ; D462 : à 40 points
  return carte(`<div class="co-pilote">
      <div class="co-niveau"><span class="chiffres">${p.niveau}</span><span class="aide">/ 100</span></div>
      <div class="co-pilote-corps"><div class="titre">Ton niveau de pilote</div>
        ${rail(p.niveau / 100)}
        <div class="aide">${p.licence ? `Licence ${esc(p.licence)}` : "Sans licence"} · ${p.tours} tours · ${p.courses} courses · ${p.podiums} podiums${p.titres ? ` · ${p.titres} titres` : ""}</div>
      </div></div>${lic}`, { pad: true });
}

// D452 : « 12:34 » (ou « 1 h 05 ») : le temps qui reste.
const reste = (sec) => {
  const x = Math.max(0, Math.round(sec));
  const h = Math.floor(x / 3600), m = Math.floor((x % 3600) / 60), s = x % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};

/** Une date du moteur : les tableaux la donnent en millisecondes (PontWeb, millisecondsSince1970) ; Date.parse ne lit que du texte. */
const enMs = (v) => (typeof v === "number" ? v : Date.parse(v));
/** D452 : la session en cours, en direct : les tours tombent en vrai temps (le moteur les calcule à son heure). */
function blocDirect(x) {
  const fin = enMs(x.fin);
  const tours = x.tours.length
    ? `<div class="co-tours co-direct-tours">${x.tours.map((c, i) => `<span class="chiffres${i === x.meilleurIndex ? " co-meilleur" : ""}${i === 0 ? " co-dernier" : ""}">${esc(c)}</span>`).join("")}</div>`
    : `<div class="aide">Premier tour en cours : son chrono tombe à la ligne.</div>`;
  const record = x.recordBattu && x.nombreTours ? `<span class="co-record">Record personnel battu</span>` : x.record ? `Ton record ${esc(x.record)}` : "Premier passage ici";
  return carte(`<div class="co-section co-direct" id="co-direct" data-fin="${fin}">
      <div class="co-serie-tete"><div class="titre">En piste · ${esc(x.circuitNom)}</div><span class="co-disc co-vif">${x.finie ? "Fini" : "En direct"}</span></div>
      <div class="aide">${esc(x.vehicule)} · ${esc(x.formule)}${x.instructeur ? " · avec un instructeur" : ""}</div>
      ${x.briefingJusqua && enMs(x.briefingJusqua) > (window.__grind?.maintenant?.() ?? Date.now()) ? `<div class="aide">Briefing de sécurité jusqu'à ${new Date(x.briefingJusqua).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })} : les tours partent après.</div>` : ""}
      ${x.examen ? `<div class="aide co-fort">${esc(x.examen)}</div>` : ""}
      ${x.meteo ? `<div class="aide co-fort co-meteo">☂ ${esc(x.meteo)}</div>` : ""}
      <div class="co-chiffres co-chiffres-4">
        <div><span class="chiffres">${x.nombreTours}</span><span class="aide">tours</span></div>
        <div><span class="chiffres">${esc(x.meilleur ?? "—")}</span><span class="aide">meilleur</span></div>
        <div><span class="chiffres">${esc(x.ecart ?? "—")}</span><span class="aide">écart</span></div>
        <div><span class="chiffres" data-reste>${reste(x.restantSec)}</span><span class="aide">reste</span></div>
      </div>
      ${rail(x.part)}
      <div class="aide">${record}${x.toursRestants > 0 ? ` · encore ${x.toursRestants} tours environ` : ""}${x.accident ? " · Accrochage : la session s'arrête là." : ""}</div>
      ${tours}
      ${bouton("Rentrer au stand", "stand", { genre: "secondaire", desactive: x.finie })}
      <div class="aide">Pendant la session, tu restes au circuit : pas de trajet, pas de session de travail. Rentrer plus tôt ne rembourse rien.</div>
    </div>`, { pad: true });
}

/** D452 : la page se redessine toutes les 5 s pendant la session, le temps restant chaque seconde. */
let directMinuteur = null;
function directAVue() {
  if (typeof window === "undefined" || directMinuteur) return;
  let n = 0;
  directMinuteur = setInterval(() => {
    const el = document.getElementById("co-direct");
    if (!el) { clearInterval(directMinuteur); directMinuteur = null; return; }
    const fin = Number(el.dataset.fin);
    const sec = (fin - (window.__grind?.maintenant?.() ?? Date.now())) / 1000;
    const r = el.querySelector("[data-reste]");
    if (r) r.textContent = reste(sec);
    n += 1;
    if ((n % 5 === 0 || sec <= 0) && !document.querySelector("dialog[open]")) window.__grind?.rafraichir?.();
  }, 1000);
}

/** D452 (recherches) : la prochaine chose à faire, en haut : la manche qui vient (où j'en suis par rapport au circuit), sinon rouler. */
function blocAFaire(a, v) {
  return carte(`<div class="co-section co-afaire">
      <div class="co-serie-tete"><div class="libelle">À faire</div><span class="co-disc${a.pret ? " co-pret" : ""}">${a.pret ? "Prêt" : "À préparer"}</span></div>
      <div class="titre co-afaire-titre">${esc(a.titre)}</div>
      <div class="aide">${esc(a.detail)}</div>
      <div class="aide${a.pret ? " co-ici" : ""}">${esc(a.etat)}</div>
      ${a.circuit && v.onglet !== "piste" ? `<div>${petit("Rouler", "allerRouler", { plein: true, donnees: { id: a.circuit } })}</div>` : ""}
    </div>`, { pad: true });
}

const PODIUM = { 1: "co-p1", 2: "co-p2", 3: "co-p3" };
/** D452 (recherches) : les résultats en podium clair (P1, P2, P3 en or, argent, bronze). */
function blocResultats(t) {
  if (!t.resultats.length) return vide("Pas encore de course : inscris-toi à une série.");
  return carte(`<div class="co-section">${t.resultats.map((r) => `<div class="co-ecurie-ligne co-resultat"><div class="co-ecurie-corps"><div class="titre">${esc(r.titre)}</div><div class="aide">${esc(r.detail)}</div></div>
      <span class="co-place chiffres ${PODIUM[r.position] ?? ""}">${r.position ? `P${r.position}` : "—"}</span></div>`).join("")}</div>`, { pad: true });
}

/** D458 : les records : tes records du monde, puis une ligne par circuit (ses records, le tien) vers sa fiche. */
function blocRecords(t) {
  const tous = [...t.ici, ...t.ailleurs].sort((a, b) => (!a.monRecord - !b.monRecord) || a.villeNom.localeCompare(b.villeNom) || a.nom.localeCompare(b.nom));
  const miens = (t.mesRecords ?? []).length ? carte(`<div class="co-section"><div class="titre">Tes records du monde</div>${t.mesRecords.map((x) => `<div class="aide co-fort">⏱ ${esc(x)}</div>`).join("")}</div>`, { pad: true }) : "";
  return `${miens}${carte(tous.map((c) => ligne({ titre: esc(c.nom),
    detail: `${esc(c.villeNom)} · ${c.records.length ? `${c.records.length} records` : "pas de record"}${c.records.some((x) => x.moi) ? " · dont à toi" : ""}`,
    valeur: c.monRecord ? esc(c.monRecord) : "", page: "courseCircuit", p: { id: c.id } })).join(""))}`;
}

/** D458 : la fiche d'un circuit : ses records par catégorie (le monde, l'absolu s'il est ailleurs), tes tours, la règle du tour parfait. */
function blocFiche(c, t) {
  const recs = c.records.length ? c.records.map((x) => `<div class="co-record-ligne"><div class="co-manche"><span class="co-fort">${esc(x.nom)}</span><span class="chiffres${x.moi ? " co-fort co-ici" : ""}">${esc(x.chrono)}</span></div>
      <div class="aide">${esc(x.qui)}${x.absolu ? ` · ${esc(x.absolu)}` : ""}</div></div>`).join("")
    : `<div class="aide">Aucun record sourcé ici : le premier tour parfait en course le fixe.</div>`;
  const miens = c.parVoiture.length ? c.parVoiture.map((x) => `<div class="co-manche"><span>${esc(x.vehicule)}</span><span class="chiffres">${esc(x.chrono)}</span></div>`).join("")
    : `<div class="aide">Tu n'y as pas encore roulé : va au circuit, un lieu du plan de ${esc(c.villeNom)}.</div>`;
  return `${carte(`<div class="co-section"><div class="aide">${esc(c.villeNom)} · ${esc(c.km)} · ${c.virages} virages</div>${recs}</div>`, { pad: true })}
    ${carte(`<div class="co-section"><div class="titre">Tes tours ici</div>${miens}${t.reglesRecord ? `<div class="aide">${esc(t.reglesRecord)}</div>` : ""}</div>`, { pad: true })}`;
}

/** D452 suite + D458 : la voiture choisie : l'usure (l'atelier), sa catégorie, ce qui manque pour un tour parfait. */
function blocVoiture(w) {
  return `<div class="co-ecurie-ligne"><div class="co-ecurie-corps"><div class="titre">${esc(w.nom)} · ${esc(w.categorie)}</div>
      <div class="aide">${esc(w.usure ?? "Pneus et freins neufs")}</div><div class="aide">${esc(w.tourParfait)}</div></div>
      ${w.atelier != null ? petit(w.atelier > 0 ? `Atelier · ${montant(w.atelier)}` : "Atelier", "atelier", { donnees: { id: String(w.id) } }) : ""}</div>`;
}

/** D461 : « Pluie l'après-midi » → « pluie l'après-midi ». */
const minuscule = (x) => (x ? x[0].toLowerCase() + x.slice(1) : "");

/** D461 : la météo, lisible avant de réserver : en ce moment (les pneus montés), puis les jours qui viennent. */
function blocMeteo(c, kart) {
  const icone = c.meteoMouillee ? "☂" : "☀";
  return `<div class="co-meteo${c.meteoMouillee ? " co-mouillee" : ""}"><div class="aide${c.meteoMouillee ? " co-fort" : ""}">${icone} ${esc(c.meteo)}${c.meteoMouillee && !kart ? " · pas de record possible" : ""}</div>
      <div class="aide">${(c.prevision ?? []).map((x) => `${esc(x.jour)} : ${esc(minuscule(x.texte))}`).join(" · ")}</div></div>`;
}

/** D461 : la carte des réglages de la voiture choisie pour ce circuit : le résumé, l'avis du mécano ; elle ouvre leur page. */
function carteReglages(w, c) {
  const g = w.reglages;
  if (!g) return "";
  return ligne({ titre: `Réglages pour ${esc(c.nom)}`, detail: `${esc(g.base ? "Réglage de base · à affiner en roulant" : g.resume)}${g.retour[0] ? `<br>${esc(g.retour[0])}` : ""}`,
    icone: "reglages", page: "courseReglages", p: { circuit: c.id, vehicule: w.id } });
}

/** D461 : la page des réglages : quatre curseurs (0 à 10, ce que chacun fait), la météo, l'avis du mécano. L'idéal n'est jamais affiché. */
function blocReglages(t, c, w, v) {
  const g = w.reglages;
  const valeurs = v.reglages?.[`${c.id}|${w.id}`] ?? g.valeurs;
  const change = valeurs.some((x, i) => x !== g.valeurs[i]);
  const base = g.valeurs.map(() => Math.floor(g.crans / 2));
  const meteo = carte(`<div class="co-section"><div class="libelle">${esc(c.nom)}</div>
      <div class="aide co-fort">${c.meteoMouillee ? "☂" : "☀"} ${esc(c.meteo)}</div>
      <div class="aide">${c.meteoMouillee ? "Sous la pluie, le bon réglage change : plus d'appui, une suspension plus souple, les freins un peu vers l'arrière."
        : "Chaque circuit a son bon réglage, et la pluie le change. Roule, écoute le mécano, ajuste."}</div></div>`, { pad: true });
  const avis = carte(`<div class="co-section"><div class="libelle">L'avis du mécano</div>
      ${g.retour.length ? g.retour.map((x) => `<div class="co-avis">🔧 ${esc(x)}</div>`).join("") : `<div class="aide">Roule au moins 3 tours avec ces réglages : le mécano te dira ce qui ne va pas.</div>`}
      ${g.retourSur ? `<div class="aide">${esc(g.retourSur)}</div>` : ""}</div>`, { pad: true });
  const curseurs = carte(`<div class="co-section co-curseurs">${t.curseurs.map((x, i) => `<div class="co-curseur">
      <div class="co-manche"><span class="co-fort">${esc(x.nom)}</span><span class="chiffres co-vif" data-valeur-curseur="${i}">${valeurs[i]} / ${g.crans}</span></div>
      <input type="range" class="co-glissiere" min="0" max="${g.crans}" step="1" value="${valeurs[i]}" data-saisie="reglerCurseur" data-i="${i}" aria-label="${esc(x.nom)}"${g.enPiste ? " disabled" : ""}>
      <div class="co-manche aide"><span>${esc(x.gauche)}</span><span>${esc(x.droite)}</span></div>
      <div class="aide">${esc(x.phrase)}</div></div>`).join("")}</div>`, { pad: true });
  const gestes = `${g.enPiste ? `<div class="aide">Elle est en piste : rentre au stand pour la régler.</div>` : ""}
    <div class="co-boutons">${bouton("Enregistrer", "enregistrerReglages", { desactive: !change || g.enPiste, donnees: { circuit: c.id, vehicule: String(w.id) } })}
      ${bouton("Réglage de base", "reglageDeBase", { genre: "secondaire", desactive: g.enPiste || valeurs.every((x, i) => x === base[i]), donnees: { cle: `${c.id}|${w.id}`, base: base.join(",") } })}</div>`;
  return `${meteo}${avis}${curseurs}${gestes}`;
}

/** D457 : l'examen de la licence suivante, ici, avec la voiture choisie : un tour sous le temps cible. */
function blocExamen(ex, c, w) {
  return `<div class="co-section"><div class="titre">Examen ${esc(ex.nom)}</div>
      <div class="aide">${w?.cibleExamen ? `Un tour sous ${esc(w.cibleExamen)} avec ${esc(w.nom)}, en ${ex.minutes} min de piste. Raté : nouvel essai dans 3 jours.` : "Il faut ta voiture au circuit."}</div>
      ${ex.refus ? `<div class="aide co-refus">${esc(ex.refus)}</div>` : ""}
      <div>${petit(`Passer l'examen · ${ex.prix ? montant(ex.prix) : "gratuit"}`, "examen", { plein: true, donnees: { licence: ex.licence, circuit: c.id, vehicule: w ? String(w.id) : "" }, desactive: !!ex.refus || !w || !c.surPlace })}</div></div>`;
}

function ligneVehicule(w, choisi) {
  if (w.present) return "";
  const gestes = [w.conduire ? petit(`Conduire · ${esc(w.conduireTexte ?? "")}`, "conduire", { donnees: { id: String(w.id) } }) : "",
    w.porterMode ? petit(`Faire porter · ${montant(w.porterPrix)}`, "porter", { plein: !w.conduire, donnees: { id: String(w.id) } }) : ""].join("");
  return `<div class="co-ecurie-ligne"><div class="co-ecurie-corps"><div class="titre">${esc(w.nom)}</div>
      <div class="aide">${esc(w.refus ?? (w.porterTexte ? `${w.detail} · porte-voitures : ${w.porterTexte}` : w.detail))}</div></div>
      <div class="co-gestes">${gestes}</div></div>`;
}

function blocPiste(t, v) {
  if (t.session && !t.session.finie) return `<p class="aide">Tu es en piste (${esc(t.session.circuitNom)}) : la session est en haut, en direct.</p>`;
  if (!t.ici.length) return carte(`<p class="aide">Tu es en route : rouler se fait sur place.</p>`, { pad: true });
  const c = t.ici.find((x) => x.id === v.circuit) ?? t.ici[0];
  const kart = c.type === "karting";
  const presents = c.vehicules.filter((w) => w.present);
  const choisi = presents.find((w) => w.id === v.vehicule) ?? presents[0];
  const absents = c.vehicules.filter((w) => !w.present);
  const montres = v.tousVehicules ? absents : absents.slice(0, 3);
  const f = c.formules.find((x) => x.id === v.formule) ?? c.formules[1] ?? c.formules[0];
  const ou = c.surPlace ? `<div class="aide co-ici">Tu es au circuit.</div>`
    : `<div class="co-ecurie-ligne"><div class="co-ecurie-corps"><div class="titre">Tu n'es pas au circuit</div><div class="aide">${esc(c.trajet ?? "On roule sur place.")}</div></div>
        ${c.allerY ? petit("Y aller", "allerCircuit", { plein: true, donnees: { id: c.id } }) : ""}</div>`;
  const choixVeh = kart ? `<div class="aide">Kart de location fourni.</div>` : `${presents.length
    ? `<div class="filtres" role="group">${presents.map((x) => `<button class="filtre" data-action="choisirVehicule" data-id="${x.id}" aria-pressed="${x.id === choisi?.id}">${esc(x.nom)}</button>`).join("")}</div>`
    : `<div class="aide">Aucun de tes véhicules n'est au circuit : amènes-en un.</div>`}
      ${montres.map((w) => ligneVehicule(w, choisi)).join("")}
      ${absents.length > 3 && !v.tousVehicules ? `<div>${petit(`Tous mes véhicules (${absents.length})`, "tousVehicules")}</div>` : ""}`;
  const possible = c.surPlace && (kart || !!choisi);
  // Les sessions : le prix, le prix à l'heure, les tours que la voiture choisie (ou le kart) y fera.
  const tours = kart ? c.toursKart : (choisi?.tours ?? []);
  const usures = kart ? [] : (choisi?.usureFormules ?? []);
  const prix = (x) => (v.instructeur ? x.prixInstructeur : x.prix);
  const sessions = `<div class="co-sessions" role="radiogroup" aria-label="Session">${c.formules.map((x, i) => `<button type="button" class="co-session" role="radio" data-action="choisirFormule" data-valeur="${esc(x.id)}" aria-checked="${x.id === f?.id}">
      <span class="co-session-corps"><span class="titre">${esc(x.nom)}</span><span class="aide">${esc(x.detail)}${i < tours.length ? ` · environ ${tours[i]} tours` : ""}${usures[i] > 0 ? ` · usure ≈ ${montant(usures[i])}` : ""}</span></span>
      <span class="chiffres co-session-prix">${montant(prix(x))}</span></button>`).join("")}</div>`;
  // D452 suite : l'instructeur en option (+50 %, le niveau monte 1,5 fois plus vite).
  const instr = `<div class="filtres" role="group"><button class="filtre" data-action="instructeur" aria-pressed="${!!v.instructeur}">Avec un instructeur · +50 %, niveau ×1,5</button></div>`;
  const dj = t.session ?? null;
  const derniere = t.derniereJournee;
  const resultat = derniere && !dj ? carte(`<div class="co-journee"><div class="titre">Dernière session · ${esc(derniere.vehicule)} · ${esc((t.ici.find((x) => x.id === derniere.circuit) ?? t.ailleurs.find((x) => x.id === derniere.circuit))?.nom ?? "")}</div>
      <div class="co-tours">${t.derniereJourneeTours.slice(-12).map((x, i, a) => `<span class="chiffres${derniere.tours[derniere.tours.length - a.length + i] === Math.min(...derniere.tours) ? " co-meilleur" : ""}">${esc(x)}</span>`).join("")}</div>
      <div class="aide">${derniere.tours.length} tours · ${derniere.accident ? "Accrochage : la session s'est arrêtée là, le véhicule est abîmé." : derniere.recordBattu ? "Record personnel battu." : "Tours chronométrés."}${derniere.meteo === "pluie" ? " Sous la pluie." : derniere.meteo === "humide" ? " Sur piste humide." : ""}</div>
      ${(derniere.retour ?? []).map((x) => `<div class="co-avis">🔧 ${esc(x)}</div>`).join("")}</div>`, { pad: true }) : "";
  return `${dj ? blocDirect(dj) : ""}${carte(`<div class="co-section">
      <div class="filtres" role="group">${t.ici.map((x) => `<button class="filtre" data-action="choisirCircuit" data-id="${esc(x.id)}" aria-pressed="${x.id === c.id}">${esc(x.nom)}</button>`).join("")}</div>
      <div class="aide">${esc(c.km)} · ${c.virages} virages · record ${esc(c.recordReel)}${c.monRecord ? ` · ton record ${esc(c.monRecord)}` : ""}</div>
      ${ou}
      <div class="aide co-jour">${esc(c.jourTexte)}</div>
      ${blocMeteo(c, kart)}
      ${c.briefing ? `<div class="aide">${esc(c.briefing)}</div>` : ""}
      ${sessions}
      ${choixVeh}
      ${choisi && !kart ? blocVoiture(choisi) + carteReglages(choisi, c) : ""}
      ${instr}
      <div class="aide">${esc(c.risque)}${choisi?.chronoEstime ? ` Ton tour attendu : ${esc(choisi.chronoEstime)}.` : ""}</div>
      ${bouton(`En piste · ${montant(f ? prix(f) : 0)}`, "enPiste", { desactive: !possible, donnees: { circuit: c.id, kart: kart ? "1" : "", formule: f?.id ?? "", vehicule: choisi ? String(choisi.id) : "" } })}
      ${c.examen && !kart ? blocExamen(c.examen, c, choisi) : ""}
    </div>`, { pad: true })}${resultat}`;
}

function carteSerie(s, v) {
  const choisie = v.voiture[s.id] ?? s.vehicules[0]?.id;
  // Inscrit : le calendrier manche par manche ; sinon une ligne (le premier départ, les circuits), pour tenir en deux écrans.
  const cal = !s.inscrit ? (!s.ouverte ? "" : `<div class="aide">Départ ${esc(heure(s.calendrier[0]?.date))} · ${esc([...new Set(s.calendrier.map((m) => m.circuit))].join(", "))}</div>`) : s.calendrier.map((m) => `<div class="co-manche"><span>${m.numero}. ${esc(m.circuit)}${m.villeNom ? `, ${esc(m.villeNom)}` : ""}</span>
      <span class="aide">${m.resultat ? esc(m.resultat) : esc(heure(m.date))}${m.meteo ? ` · ${esc(m.meteo)}` : ""}</span></div>`).join("");
  const cl = s.classement.length ? `<div class="co-classement">${s.classement.map((x, i) => `<div class="co-classe${x.moi ? " co-moi" : ""}"><span>${i + 1}. ${esc(x.nom)}</span><span class="chiffres">${x.points} pts</span></div>`).join("")}</div>` : "";
  const voitures = !s.fournie && s.vehicules.length && s.ouverte
    ? `<div class="filtres" role="group">${s.vehicules.map((x) => `<button class="filtre" data-action="choisirVoiture" data-serie="${esc(s.id)}" data-id="${x.id}" aria-pressed="${x.id === choisie}">${esc(x.nom)}</button>`).join("")}</div>` : "";
  const qui = s.pilotes.find((x) => x.id === v.pilote[s.id]);
  const pilotes = s.pilotes.length && s.ouverte && !s.inscrit
    ? `<div class="filtres" role="group"><button class="filtre" data-action="choisirPiloteSerie" data-serie="${esc(s.id)}" data-id="" aria-pressed="${!qui}">Toi</button>${s.pilotes.map((x) => `<button class="filtre" data-action="choisirPiloteSerie" data-serie="${esc(s.id)}" data-id="${esc(x.id)}" aria-pressed="${qui?.id === x.id}">${esc(x.nom)} (${x.niveau})</button>`).join("")}</div>` : "";
  const refus = qui ? null : s.refus;
  const geste = s.inscrit ? (s.finale ? `<div class="co-finale">${esc(s.finale)}</div>` : `<div class="aide">${s.pilote ? `${esc(s.pilote)} court pour ton écurie, où que tu sois.` : esc(s.consigne ? `Inscrit. ${s.consigne}` : "Inscrit : sois sur le circuit à chaque départ (absent : forfait).")}</div>`)
    : s.ouverte ? `${voitures}${pilotes}${refus ? `<div class="aide co-refus">${esc(refus)}</div>` : ""}${petit(`S'inscrire · ${montant(s.prix)}`, "inscrire", { plein: true, donnees: { serie: s.id }, desactive: !!refus })}`
      : `<div class="aide">La première manche est partie : nouvelle édition lundi.</div>`;
  return carte(`<div class="co-serie">
      <div class="co-serie-tete"><div class="titre">${esc(s.nom)}</div><span class="co-disc">${esc(DISC[s.discipline] ?? s.discipline)}</span></div>
      <div class="aide">${s.manches} manches · ${esc(s.conditions)}</div>
      ${s.prerequis ? `<div class="aide${s.prerequisOk ? " co-ici" : ""}">${s.prerequisOk ? "✓" : "🔒"} ${esc(s.prerequis)}</div>` : ""}
      ${cal}${cl}${geste}</div>`, { pad: true });
}

function lignePetit(titre, detail, libelle, action, donnees, desactive) {
  return `<div class="co-ecurie-ligne"><div class="co-ecurie-corps"><div class="titre">${esc(titre)}</div><div class="aide">${esc(detail)}</div></div>${petit(libelle, action, { plein: true, donnees, desactive })}</div>`;
}

function blocEcurie(t, v) {
  const e = t.ecurie;
  if (!e) return vide("Pas d'écurie dans ce monde.");
  if (!e.fondee) {
    return carte(`<div class="co-section"><div class="titre">Ta propre écurie</div>
      <div class="aide">Des pilotes qui courent à ta place, des mécanos qui font gagner des dixièmes, des sponsors qui paient chaque manche.</div>
      <input class="champ" id="co-nom-ecurie" maxlength="30" placeholder="Le nom de l'écurie" value="${esc(v.nomEcurie)}">
      ${bouton(`Fonder · ${montant(e.prixFondation)}`, "fonderEcurie")}</div>`, { pad: true });
  }
  const tete = carte(`<div class="co-section"><div class="titre">${esc(e.nom ?? "Ton écurie")}</div>
      <div class="aide">Visibilité ${e.visibilite} · ${esc(e.bilan)}</div>
      <div class="titre">Pilotes (${e.pilotes.length} sur ${e.pilotesMax})</div>
      ${e.pilotes.length ? e.pilotes.map((p) => lignePetit(p.nom, p.detail, "Renvoyer", "renvoyerPilote", { id: p.id }, false)).join("") : `<div class="aide">Aucun pilote : engage un candidat ci-dessous.</div>`}
      <div class="co-ecurie-ligne"><div class="co-ecurie-corps"><div class="titre">Mécanos : ${e.mecanos} sur ${e.mecanosMax}</div><div class="aide">${esc(e.gainMecano)} chacun · ${montant(e.coutMecano)} par manche</div></div>
        ${petit("−", "mecanos", { donnees: { n: String(e.mecanos - 1) }, desactive: e.mecanos <= 0 })}${petit("+", "mecanos", { plein: true, donnees: { n: String(e.mecanos + 1) }, desactive: e.mecanos >= e.mecanosMax })}</div>
      <div class="titre">Sponsors (${e.sponsors.length} sur ${e.sponsorsMax})</div>
      ${e.sponsors.map((s) => `<div><div>${esc(s.nom)}</div><div class="aide">${esc(s.detail)}</div></div>`).join("")}</div>`, { pad: true });
  const cand = e.candidats.length ? carte(`<div class="co-section"><div class="titre">Pilotes libres cette semaine</div>
      ${e.candidats.map((p) => lignePetit(p.nom, p.detail, "Engager", "engagerPilote", { id: p.id }, e.pilotes.length >= e.pilotesMax)).join("")}</div>`, { pad: true }) : "";
  const offres = e.offres.length ? carte(`<div class="co-section"><div class="titre">Offres de sponsors</div>
      ${e.offres.map((s) => lignePetit(s.nom, s.detail, "Signer", "signerSponsor", { id: s.id }, e.sponsors.length >= e.sponsorsMax)).join("")}</div>`, { pad: true }) : "";
  return `${tete}${cand}${offres}`;
}

export const pages = {
  // D458 : la fiche d'un circuit (ses records par catégorie, tes tours).
  courseCircuit: {
    titre: "Circuit",
    css: "course",
    async donnees(ctx, p) { return { t: await ctx.tableau("circuits") }; },
    rendu(d, ctx, p) {
      const c = d.t ? [...d.t.ici, ...d.t.ailleurs].find((x) => x.id === p?.id) : null;
      if (!c) return `${entetePousse("Circuit")}${vide("Ce circuit n'existe plus.")}`;
      return `${entetePousse(esc(c.nom))}<div class="pile co-page" id="zone-course">${blocFiche(c, d.t)}</div>`;
    },
    actions: {},
  },
  // D461 : les réglages d'une voiture pour un circuit (EcranReglagesCourse sur l'iPhone).
  courseReglages: {
    titre: "Réglages",
    css: "course",
    async donnees(ctx, p) { return { t: await ctx.tableau("circuits") }; },
    rendu(d, ctx, p) {
      const c = d.t?.ici.find((x) => x.id === p?.circuit);
      const w = c?.vehicules.find((x) => x.id === Number(p?.vehicule));
      if (!c || !w?.reglages) return `${entetePousse("Réglages")}${vide("Va au circuit avec ta voiture pour la régler.")}`;
      return `${entetePousse(`Réglages · ${esc(w.nom)}`)}<div class="pile co-page" id="zone-course">${blocReglages(d.t, c, w, vue(p))}</div>`;
    },
    actions: {
      // Le curseur bouge : la valeur s'affiche tout de suite (sans redessiner, le doigt garde le curseur) ; « Enregistrer » s'allume.
      reglerCurseur(ctx, el, d, p) {
        const c = d?.t?.ici.find((x) => x.id === p?.circuit);
        const w = c?.vehicules.find((x) => x.id === Number(p?.vehicule));
        if (!w?.reglages) return;
        const cle = `${c.id}|${w.id}`;
        const x = vue(p);
        const v = [...(x.reglages[cle] ?? w.reglages.valeurs)];
        const i = Number(el.dataset.i);
        v[i] = Number(el.value);
        x.reglages[cle] = v;
        const z = document.querySelector(`#zone-course [data-valeur-curseur="${i}"]`);
        if (z) z.textContent = `${v[i]} / ${w.reglages.crans}`;
        const b = document.querySelector("#zone-course [data-action=enregistrerReglages]");
        if (b) b.disabled = w.reglages.enPiste || v.every((y, k) => y === w.reglages.valeurs[k]);
      },
      reglageDeBase(ctx, b, d, p) { vue(p).reglages[b.dataset.cle] = b.dataset.base.split(",").map(Number); ctx.redessiner(); },
      async enregistrerReglages(ctx, b, d, p) {
        const cle = `${b.dataset.circuit}|${b.dataset.vehicule}`;
        const c = d.t.ici.find((x) => x.id === b.dataset.circuit);
        const w = c?.vehicules.find((x) => x.id === Number(b.dataset.vehicule));
        const v = vue(p).reglages[cle] ?? w?.reglages?.valeurs;
        if (!v || v.length !== 4) return;
        const op = { regler: { circuit: b.dataset.circuit, vehicule: Number(b.dataset.vehicule), aero: v[0], rapports: v[1], suspension: v[2], freins: v[3] } };
        if (await ctx.decider("circuits", op, { succes: `Réglages enregistrés pour ${c?.nom ?? "ce circuit"}` })) {
          delete vue(p).reglages[cle];
          await ctx.rafraichir();
        }
      },
    },
  },
  // D452 (des pages courtes) : une série sur sa page (s'inscrire, calendrier, classement).
  courseSerie: {
    titre: "Série",
    css: "course",
    async donnees(ctx, p) { return { t: await ctx.tableau("circuits") }; },
    rendu(d, ctx, p) {
      const s = d.t?.series.find((x) => x.id === p?.id);
      if (!s) return `${entetePousse("Série")}${vide("Cette série n'existe plus.")}`;
      return `${entetePousse(esc(s.nom))}<div class="pile co-page" id="zone-course">${carteSerie(s, vue(p))}</div>`;
    },
    actions: {},
  },
  course: {
    titre: "Course",
    css: "course",
    async donnees(ctx, p) { return { t: await ctx.tableau("circuits") }; },
    rendu(d, ctx, p) {
      const t = d.t;
      if (!t) return `${entetePousse("Course")}${vide("Les circuits arrivent avec une saison en cours.")}`;
      if (!t.permis) return `${entetePousse("Course")}${vide("Les circuits sont coupés dans ce monde.")}`;
      const v = vue(p);
      const enPiste = t.session && !t.session.finie;
      if (enPiste) directAVue(); // D452 : les tours tombent en vrai temps
      // D452 (des pages courtes) : les séries en une carte, une ligne chacune ; le détail sur sa page.
      const corps = v.onglet === "series" ? carte(t.series.map((s) => ligne({ titre: esc(s.nom), detail: esc(s.resume), valeur: s.inscrit ? "Inscrit" : esc(DISC[s.discipline] ?? s.discipline), couleurValeur: s.inscrit ? "or" : "t2", page: "courseSerie", p: { id: s.id } })).join(""))
        : v.onglet === "resultats" ? blocResultats(t)
        : v.onglet === "circuits" ? blocRecords(t)
        : v.onglet === "ecurie" ? blocEcurie(t, v)
        : blocPiste(t, v);
      // D452 (recherches) : en haut, la session en direct (Rentrer au stand toujours visible), sinon la chose à faire.
      const haut = enPiste ? blocDirect(t.session) : t.aFaire ? blocAFaire(t.aFaire, v) : "";
      return `${entetePousse("Course")}
      <div class="pile co-page" id="zone-course">
        ${haut}
        ${blocPilote(t, v)}
        ${segment([["piste", "Rouler"], ["series", "Séries"], ["resultats", "Résultats"], ["circuits", "Records"], ["ecurie", "Écurie"]], v.onglet, "ongletCourse", { defilant: false })}
        ${corps}
      </div>`;
    },
    actions: {
      ongletCourse(ctx, b, d, p) { vue(p).onglet = b.dataset.valeur; ctx.redessiner(); },
      choisirCircuit(ctx, b, d, p) { vue(p).circuit = b.dataset.id; ctx.redessiner(); },
      choisirVehicule(ctx, b, d, p) { vue(p).vehicule = Number(b.dataset.id); ctx.redessiner(); },
      choisirFormule(ctx, b, d, p) { vue(p).formule = b.dataset.valeur; ctx.redessiner(); },
      allerRouler(ctx, b, d, p) { const x = vue(p); x.onglet = "piste"; if (b.dataset.id) x.circuit = b.dataset.id; ctx.redessiner(); },
      instructeur(ctx, b, d, p) { const x = vue(p); x.instructeur = !x.instructeur; ctx.redessiner(); },
      async atelier(ctx, b) { if (await ctx.decider("circuits", { atelier: { vehicule: Number(b.dataset.id) } }, { succes: "Pneus et freins neufs" })) await ctx.rafraichir(); },
      async examen(ctx, b) {
        const op = { examenLicence: { licence: b.dataset.licence, circuit: b.dataset.circuit, vehicule: Number(b.dataset.vehicule) } };
        if (await ctx.decider("circuits", op, { succes: "Examen : un tour sous le temps cible" })) await ctx.rafraichir();
      },
      tousVehicules(ctx, b, d, p) { vue(p).tousVehicules = true; ctx.redessiner(); },
      choisirVoiture(ctx, b, d, p) { vue(p).voiture[b.dataset.serie] = Number(b.dataset.id); ctx.redessiner(); },
      choisirPiloteSerie(ctx, b, d, p) { vue(p).pilote[b.dataset.serie] = b.dataset.id || null; ctx.redessiner(); },
      async fonderEcurie(ctx, b, d, p) {
        const nom = document.getElementById("co-nom-ecurie")?.value ?? "";
        vue(p).nomEcurie = nom;
        if (await ctx.decider("circuits", { fonderEcurie: { nom } }, { succes: "Écurie fondée" })) await ctx.rafraichir();
      },
      async engagerPilote(ctx, b) { if (await ctx.decider("circuits", { engagerPilote: { _0: b.dataset.id } }, { succes: "Pilote engagé" })) await ctx.rafraichir(); },
      async renvoyerPilote(ctx, b) { if (await ctx.decider("circuits", { renvoyerPilote: { _0: b.dataset.id } }, { succes: "Pilote renvoyé" })) await ctx.rafraichir(); },
      async mecanos(ctx, b) { if (await ctx.decider("circuits", { mecanos: { _0: Number(b.dataset.n) } }, { succes: "Mécanos réglés" })) await ctx.rafraichir(); },
      async signerSponsor(ctx, b) { if (await ctx.decider("circuits", { signerSponsor: { _0: b.dataset.id } }, { succes: "Sponsor signé" })) await ctx.rafraichir(); },
      async enPiste(ctx, b, d, p) {
        const vehicule = b.dataset.kart || !b.dataset.vehicule ? null : Number(b.dataset.vehicule);
        const corps = { circuit: b.dataset.circuit, session: b.dataset.formule, ...(vehicule != null ? { vehicule } : {}) };
        const op = vue(p).instructeur ? { enPisteInstructeur: corps } : { enPiste: corps }; // D452 suite
        if (await ctx.decider("circuits", op, { succes: "En piste : les tours tombent en direct" })) await ctx.rafraichir();
      },
      async stand(ctx) { if (await ctx.decider("circuits", { rentrerAuStand: {} }, { succes: "Retour au stand" })) await ctx.rafraichir(); },
      async allerCircuit(ctx, b, d) {
        const c = d.t.ici.find((x) => x.id === b.dataset.id);
        const q = c?.allerY?.params;
        if (!q) return ctx.toast("Aucun moyen d'y aller pour l'instant.", "refus");
        if (await ctx.decider("monde", { allerA: { lieu: q.lieu, moyen: q.moyen, ...(q.vehicule != null ? { vehicule: Number(q.vehicule) } : {}) } }, { succes: `En route pour ${c.nom}` })) await ctx.rafraichir();
      },
      async conduire(ctx, b, d, p) {
        const c = d.t.ici.find((x) => x.id === vue(p).circuit) ?? d.t.ici[0];
        const q = c?.vehicules.find((w) => w.id === Number(b.dataset.id))?.conduire?.params;
        if (!q) return;
        if (await ctx.decider("monde", { allerA: { lieu: q.lieu, moyen: q.moyen, vehicule: Number(q.vehicule) } }, { succes: `Au volant, vers ${c.nom}` })) await ctx.rafraichir();
      },
      async porter(ctx, b, d, p) {
        const c = d.t.ici.find((x) => x.id === vue(p).circuit) ?? d.t.ici[0];
        const w = c?.vehicules.find((x) => x.id === Number(b.dataset.id));
        if (!w?.porterMode) return;
        const op = { expedier: { vehicules: [w.id], vers: c.ville, mode: w.porterMode, lieu: c.lieu } };
        if (await ctx.decider("mer", op, { succes: `${w.nom} part vers ${c.nom}` })) await ctx.rafraichir();
      },
      async inscrire(ctx, b, d, p) {
        const s = d.t.series.find((x) => x.id === b.dataset.serie);
        const vehicule = s && !s.fournie ? (vue(p).voiture[s.id] ?? s.vehicules[0]?.id) : null;
        const pilote = vue(p).pilote[b.dataset.serie];
        const op = pilote ? { inscrirePilote: { serie: b.dataset.serie, pilote, ...(vehicule != null ? { vehicule } : {}) } }
          : { inscrire: { serie: b.dataset.serie, ...(vehicule != null ? { vehicule } : {}) } };
        if (await ctx.decider("circuits", op, { succes: `Inscrit : ${s?.nom ?? ""}` })) await ctx.rafraichir();
      },
      async licence(ctx, b) {
        if (await ctx.decider("circuits", { licence: { _0: b.dataset.id } }, { succes: "Licence obtenue" })) await ctx.rafraichir();
      },
    },
  },
};
pages.courseSerie.actions = pages.course.actions; // les mêmes gestes (s'inscrire, choisir la voiture, le pilote)
pages.courseCircuit.actions = pages.course.actions;
