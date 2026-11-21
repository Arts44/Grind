// ══════════════════════════════════════════════════════════════════════
//  Zone « bateaux » (RNT-188, D206) — EcransBateaux.swift, écran pour écran :
//    section        ← SectionBateaux       (Actifs › Bateaux, tableau « flotte »)
//    chantierNaval  ← EcranChantierNaval   (neufs par type, occasions du port ; l'achat passe
//                                           par le configurateur et l'occasion de vehicules.js)
//    bateau         ← EcranBateau          (coque, port, hivernage, sortie, charter, expédition)
//    port           ← EcranPort            (météo, ferries et traversées, cargos)
//  Tout vient du moteur (TableauBateaux.swift) ; les briques de immobilier.js et vehicules.js.
// ══════════════════════════════════════════════════════════════════════
import { montant, pourcent, esc } from "../format.js?v=3e8bddd9";
import { carte, ligne, bouton, segment, entetePousse, vide, friseTrajet } from "../ui.js?v=3e8bddd9";
import {
  ico, pilule, filtre, choixRadio, interrupteur, tete, label, note, ligneEtat, papier, titrePapier, champPapier, confirmer,
  pastilleRarete, possession, listePossessions, selecteurDisposition, lireDisposition, dispositionActifs, etatDe, balance, variationTexte, nombre,
  teteListe, pastillesListe, compteListe, nouvelleListe, contient, actif, passe, passeGroupe, exclu, trier, actionsListe, repeindre, tranchesPrix, gardePrix,
} from "./immobilier.js?v=3e8bddd9";
import { vitrine, carteModele, carteEncheresVoiture, ficheTechnique, enteteLivraison, pages as pagesVehicules } from "./vehicules.js?v=3e8bddd9";
import { chargerPhotos, listeEtDetail, estChoisi, videDetail } from "./catalogues.js?v=3e8bddd9";

// MARK: - Le style de la mer

const CSS = `
.mer-heros { position:relative; overflow:hidden; border-radius:22px; padding:18px 18px 16px; color:#EAF2F8;
  background:radial-gradient(120% 90% at 85% 0%, rgba(120,190,230,.28), transparent 60%), linear-gradient(160deg,#173049 0%,#0C1724 70%);
  border:1px solid rgba(160,200,230,.16); display:flex; flex-direction:column; gap:12px; }
.mer-heros .houle { position:absolute; left:0; right:0; bottom:0; height:46px; opacity:.5; pointer-events:none; }
.mer-heros .nom { font-size:22px; font-weight:700; letter-spacing:-.02em; }
.mer-heros .sous { font-size:13px; color:rgba(234,242,248,.72); }
.mer-jours { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; position:relative; }
.mer-jour { border-radius:12px; padding:8px 4px; text-align:center; background:rgba(255,255,255,.06); }
.mer-jour .j { font-size:11px; color:rgba(234,242,248,.7); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mer-jour .i { width:20px; height:20px; margin:4px auto 2px; display:block; }
.mer-jour .t { font-size:11px; font-weight:600; white-space:nowrap; }
.mer-jour.agitee { background:rgba(227,184,91,.16); } .mer-jour.tempete { background:rgba(226,85,72,.2); }
.mer-chiffres { display:flex; gap:8px; position:relative; }
.mer-chiffre { flex:1; min-width:0; border-radius:12px; padding:8px 10px; background:rgba(255,255,255,.06); }
.mer-chiffre .v { font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
.mer-chiffre .l { font-size:11px; color:rgba(234,242,248,.7); }
.mer-fiche { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.mer-fiche > div { border-radius:12px; padding:10px; background:var(--puce); }
.mer-fiche .v { font-size:16px; font-weight:700; font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
.mer-fiche .l { font-size:11px; color:var(--texte2); }
.mer-devis { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; margin:0 -16px; padding:0 16px 2px; }
.mer-devis button { flex:none; min-width:150px; max-width:220px; text-align:left; border-radius:14px; padding:10px 12px; background:var(--puce); border:1px solid var(--filet2); display:flex; flex-direction:column; gap:3px; }
.mer-devis button[disabled] { opacity:.55; }
.mer-devis .n { font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mer-devis .p { font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; }
.mer-devis .d { font-size:11px; color:var(--texte2); }
.mer-devis .r { font-size:11px; color:var(--alerte); line-height:1.25; }
.mer-choix { display:flex; flex-wrap:wrap; gap:8px; }
.cv-ligne { padding:10px 0; }
.cv-ligne[disabled] { opacity:.55; }
.cv-ico { width:18px; height:18px; color:var(--equipe); flex:none; }
.cv-corps { flex:1; min-width:0; }
.cv-prix { font-size:14px; }
.cv-alerte { color:var(--alerte, #E8833A); }
.cv-cherche { display:flex; align-items:center; gap:8px; padding:0 12px; min-height:40px; border-radius:12px; background:var(--puce); border:1px solid var(--filet2); }
.cv-cherche svg { width:14px; height:14px; color:var(--texte2); flex:none; }
.cv-cherche input { flex:1; min-width:0; background:none; border:0; color:var(--texte); font:inherit; font-size:15px; outline:none; }
.cv-risques { font-size:12px; color:var(--texte2); }
/* D429 : le véhicule en tête, les devis en cartes, la confirmation en bas, « Il est à toi ». */
.cv-devis { display:grid; gap:8px; width:100%; text-align:start; padding:16px; font:inherit; color:inherit; cursor:pointer; border:2px solid transparent; }
.cv-devis.choisi { border-color:var(--equipe); }
.cv-devis[disabled] { opacity:.5; cursor:default; }
.cv-devis-tete { display:flex; align-items:baseline; gap:10px; }
.cv-devis-tete .cv-corps { display:grid; gap:2px; }
.cv-devis-tete b { font-size:16px; }
.cv-devis .cv-prix { font-size:20px; font-weight:700; }
.cv-marques, .cv-etapes { display:flex; flex-wrap:wrap; gap:6px; padding-inline-start:28px; }
.cv-etapes { flex-direction:column; gap:3px; }
.cv-marque { font-size:12px; font-weight:600; color:var(--equipe); padding:3px 8px; border-radius:999px; background:color-mix(in srgb, var(--equipe) 14%, transparent); }
.cv-etape { font-size:13px; color:var(--texte2); }
.cv-etape::before { content:"•"; margin-inline-end:8px; color:var(--texte3); }
.cv-barre { position:sticky; bottom:calc(103px + max(0px, env(safe-area-inset-bottom) - 10px)); z-index:5; border-radius:18px; display:grid; gap:6px; padding:10px 16px; margin-top:12px;
  background:color-mix(in srgb, var(--fond) 82%, transparent); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border-top:1px solid var(--filet); }
.cv-barre .aide { text-align:center; margin:0; }

/* D345 : les envois en route, une frise chacun. */
.bt-frises { display:grid; gap:18px; }
.bt-frise { display:grid; gap:10px; }
`;
if (typeof document !== "undefined" && !document.getElementById("css-bateaux")) {
  const s = document.createElement("style");
  s.id = "css-bateaux";
  s.textContent = CSS;
  document.head.append(s);
}

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const icm = {
  ancre: I('<circle cx="12" cy="5" r="2"/><path d="M12 7v13M8 11h8M4.5 13.5a7.5 7.5 0 0 0 15 0"/>'),
  voile: I('<path d="M12 3v13M12 4.5l6.5 10.5H12M11 7l-5.5 8H11M3.5 18.5c2.5 2 14.5 2 17 0"/>'),
  ferry: I('<path d="M4 15l1.5-6h13L20 15M7 9V6h6v3M3 18.5c2.5 1.6 15.5 1.6 18 0"/><path d="M9 12h1M13 12h1"/>'),
  cargo: I('<path d="M3 15h18l-2 4H5zM5 15V9h4v6M10 15V6h4v9M15 15v-4h4v4"/>'),
  avion: I('<path d="M2 14l8-2-3-8h2l6 7 5-1.5a1.5 1.5 0 0 1 .5 3L15 14l-4 7H9l1-6-8-1z"/>'),
  soleil: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  vent: I('<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8"/>'),
  orage: I('<path d="M7 16a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17 16"/><path d="M12.5 13l-2 4h3l-2 4"/>'),
  flocon: I('<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/>'),
  coque: I('<path d="M3 12h18l-2.5 6h-13zM8 12V8h8v4"/>'),
};
const noteMer = (icone, texte, couleur = "var(--texte2)") => `<div class="pz-note" style="color:${couleur}"><span class="pz-ico">${icm[icone] ?? ""}</span><span>${texte}</span></div>`;
const ICONE_METEO = { "sun.max.fill": icm.soleil, wind: icm.vent, "cloud.bolt.rain.fill": icm.orage };
const houle = `<svg class="houle" viewBox="0 0 400 46" preserveAspectRatio="none" aria-hidden="true"><path d="M0 22 Q25 12 50 22 T100 22 T150 22 T200 22 T250 22 T300 22 T350 22 T400 22 V46 H0Z" fill="rgba(110,170,215,.18)"/><path d="M0 32 Q25 24 50 32 T100 32 T150 32 T200 32 T250 32 T300 32 T350 32 T400 32 V46 H0Z" fill="rgba(110,170,215,.22)"/></svg>`;

const virgule = (x, d = 1) => x.toFixed(d).replace(".", ",").replace(/,0$/, "");
/** D345 : ce qui est en route, une frise par envoi (Parti → En route → Arrivé, le camion, le cargo ou l'avion avance). */
const enRoute = (liste) => (liste.length ? carte(`${tete("", "", "En route")}<div class="bt-frises">${liste.map((x) => `<div class="bt-frise">
  <div class="libelle">${esc(x.vehicules)}<span class="t2"> · ${esc(NOMS_MODE[x.mode] ?? x.mode)}</span></div>
  ${friseTrajet({ de: x.de ?? "", vers: x.vers, mode: x.mode, depart: x.depart ?? null, arrivee: x.arrivee, arriveeTexte: heure(x.arrivee) })}</div>`).join("")}</div>`, { classe: "pz-carte" }) : "");
const heure = (ms) => new Date(ms).toLocaleString("fr-BE", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });
const dureeJeu = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`);

/** Le port d'une ville : son nom, sa mer, la météo de quatre jours, le prix d'une place. */
function herosPort(p, { titre = "", detail = "" } = {}) {
  if (!p) return "";
  const jours = p.meteo.map((m) => `<div class="mer-jour ${m.etat === 2 ? "tempete" : m.etat === 1 ? "agitee" : ""}" title="${esc(m.texte)}">
      <div class="j">${esc(m.nom)}</div><span class="i">${ICONE_METEO[m.icone] ?? icm.soleil}</span><div class="t">${esc(m.texte.replace("Mer ", ""))}</div></div>`).join("");
  return `<div class="mer-heros">${houle}
    <div style="position:relative;display:flex;align-items:flex-start;gap:12px">
      <span style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.1);flex:none"><span style="width:20px;height:20px;display:block">${icm.ancre}</span></span>
      <div style="flex:1;min-width:0"><div class="nom">${esc(titre || p.nom)}</div><div class="sous">${esc(detail || `${p.nomVille} · ${p.mer}`)}</div></div>
      ${p.ferry ? `<span class="sous" style="display:flex;gap:4px;align-items:center"><span style="width:15px;height:15px;display:block">${icm.ferry}</span>Ferries</span>` : ""}
    </div>
    <div class="mer-jours" role="list" aria-label="Météo des quatre jours">${jours}</div>
    <div class="sous" style="position:relative;display:flex;gap:6px;align-items:center">
      <i style="width:7px;height:7px;border-radius:50%;flex:none;background:${p.meteoReelle ? "#5BBF8A" : "rgba(234,242,248,.4)"}"></i>
      <span>${esc(p.sourceMeteo)}${p.meteo[0]?.detail ? ` · ${esc(p.meteo[0].detail)}` : ""}</span></div>
    <div class="mer-chiffres"><div class="mer-chiffre"><div class="v">${montant(p.amarrage10m)}</div><div class="l">une place de 10 m, par semaine</div></div></div>
  </div>`;
}

const NOMS_MODE = { cargo: "Cargo", camion: "Camion", avion: "Avion cargo", chauffeur: "Chauffeur", bateau: "Bateau", pilote: "Pilote convoyeur" }; // D328, D330
// RNT-254 : camion, cargo ou avion cargo, au choix. D328 : le chauffeur et le bateau.
const icoMode = (m) => (m === "cargo" ? icm.cargo : m === "avion" || m === "pilote" ? icm.avion : m === "bateau" ? icm.ferry : ico.voitureCote);
/** D328 : la durée d'un devis d'expédition (« 6 h », « 2 jours »). */
const dureeExpedition = (x) => x.duree || joursTexte(x.jours);
const joursTexte = (n) => `${n} jour${n > 1 ? "s" : ""}`;

// MARK: - Actifs › Bateaux (SectionBateaux)

export const section = {
  async donnees(ctx) { // D442 (FIL) : et les filtres de la liste
    const [t, filtres] = await Promise.all([ctx.tableau("flotte"), ctx.tableau("filtresListe", { liste: "bateaux" })]);
    return { t, filtres };
  },
  rendu(d, _ctx, bloc = () => "") {
    const t = d?.t;
    if (!t) return vide("Le port ouvre avec ta première saison.");
    return `<div class="pz-pile" style="gap:14px">
      ${/* RNT-312 : un seul bloc d'actions, en tête. */""}
      ${bloc({ permis: true, propres: [
        ligne({ titre: "Chantier naval", detail: "Neufs et occasions, de la barque au mégayacht", page: "chantierNaval", icone: icm.voile, teinte: "var(--vente)" }),
        ligne({ titre: "Le port", detail: t.ici ? "Ferries, traversées, cargos" : "Pas de port ici : cargos et camions", page: "port", icone: icm.ancre, teinte: "var(--equipe)" })] })}
      ${!t.bateaux.length ? `<div class="pz-pile" style="gap:12px">${vitrine({ forme: "yacht", teinte: "#1B2A44", hauteur: 120, eteinte: true })}
          <p class="aide">De la barque au mégayacht, au chantier naval d'une ville côtière. Une place au port se loue à la semaine ; le permis côtier, puis l'extension hauturière, pour prendre la mer toi-même.</p></div>` : `
        ${/* RNT-310 : l'aperçu, la recherche, le tri, les types repliables, la liste compacte. */""}
        ${listePossessions({ cle: "bateaux", titre: `${t.bateaux.length} bateau${t.bateaux.length > 1 ? "x" : ""}`, invite: "Chercher un bateau", filtres: d.filtres,
          groupes: [...new Set(t.bateaux.map((b) => b.type))].map((x) => ({ id: x, nom: x })),
          elements: t.bateaux.map((b) => ({ id: String(b.id), nom: b.nom, recherche: [b.type, b.statut], valeur: b.valeur, rang: b.id, groupe: b.type,
            possession: { nom: b.nom, valeur: montant(b.valeur), page: "bateau", p: { id: b.id },
              badge: b.plusValue !== 0 ? (b.plusValue > 0 ? "+" : "−") + montant(Math.abs(b.plusValue)) : "",
              lignes: [[b.statut, b.ici ? "var(--gain)" : "var(--texte2)", "repere"], ...(b.alerte ? [[b.alerte, "var(--alerte)"]] : []), [`${b.type} · ${virgule(b.longueurM)} m`, "var(--texte2)"]],
              visuel: (h) => vitrine({ forme: b.silhouette, teinte: b.teinte, rarete: b.rarete, hauteur: h, photo: b.photo }) } })) })}
        <div class="mer-fiche">
          <div><div class="v">${montant(t.placesSemaine)}</div><div class="l">places au port / sem.</div></div>
          <div><div class="v">${montant(t.equipagesSemaine)}</div><div class="l">équipages / sem.</div></div>
          <div><div class="v" style="color:${t.charterSemaine > 0 ? "var(--gain)" : "inherit"}">${t.charterSemaine > 0 ? "+" : ""}${montant(t.charterSemaine)}</div><div class="l">charter / sem.</div></div>
        </div>`}
      ${t.ici ? herosPort(t.ici) : ""}
      ${enRoute(t.expeditions)}
      ${t.enHiver && t.bateaux.length ? note("calendrier", "C'est l'hiver : un bateau resté à l'eau risque le gel. Au sec, il ne s'use pas.", "var(--alerte)") : ""}
    </div>`;
  },
  actions: { dispositionActifs }, // RNT-310 : les gestes des longues listes passent par la section Immobilier (la page Actifs les cherche dans chaque part)
};

// MARK: - Le chantier naval (EcranChantierNaval)

const vueChantier = (p) => etatDe(p, "chantier", { neuf: true });
// D442 (FIL) : la feuille « Filtres » (type, prix, achat), comme la concession ; le tri et les filtres gardés par liste.
const TRIS_CHANTIER = [{ id: "prix", nom: "Prix" }, { id: "longueur", nom: "Longueur", croissant: false }, { id: "nom", nom: "Nom" }];
const TRIS_CHANTIER_OCCASIONS = [{ id: "prix", nom: "Prix" }, { id: "heures", nom: "Heures moteur" }, { id: "etat", nom: "État", croissant: false }, { id: "nom", nom: "Nom" }];
const listeChantierNeufs = (p) => etatDe(p, "chantierNeufs", () => nouvelleListe("prix", [], true, "chantierNeufs"));
const listeChantierOccasions = (p) => etatDe(p, "chantierOccasions", () => nouvelleListe("prix", [], true, "chantierOccasions"));
const BORNES_BATEAUX = [5_000_000, 50_000_000, 500_000_000];
const gardeTypes = (e, type) => { const t = e.filtres.filter((f) => f.startsWith("type:")); return (!t.length || t.includes(`type:${type}`)) && !exclu(e, `type:${type}`); }; // D453
function corpsChantierNeufs(d, p) {
  const e = listeChantierNeufs(p), t = d.t;
  const base = t.modeles.filter((m) => contient(e, m.nom, m.detail)).filter((m) => gardeTypes(e, m.type)).filter((m) => gardePrix(m.prix, e))
    .filter((m) => passeGroupe(e, "Achat", [["dispo", m.disponible], ["permis", m.conduisible]])); // D462
  const liste = trier(base, e, { prix: (m) => m.prix, longueur: (m) => m.fiche?.longueurM ?? 0 }, (m) => m.nom);
  const filtres = [...t.types.map((x) => ({ id: `type:${x.id}`, nom: x.nom, groupe: "Type" })), ...tranchesPrix(BORNES_BATEAUX),
    { id: "dispo", nom: "Disponibles", groupe: "Achat", test: true }, { id: "permis", nom: "Mon permis", groupe: "Achat", test: true }];
  return `<div class="pz-pile" style="gap:10px">${pastillesListe("chantierNeufs", e, filtres)}${compteListe("chantierNeufs", e, liste.length, "bateaux")}</div>
    ${liste.length ? `<div class="cat-grille"><div class="cat-cartes">${liste.map((m) => ligneModele(m, p)).join("")}</div></div>` : `<p class="aide">Aucun bateau ne correspond.</p>`}`;
}
function corpsChantierOccasions(d, p) {
  const e = listeChantierOccasions(p), t = d.t;
  const base = t.occasions.filter((o) => contient(e, o.nom, o.teinteNom)).filter((o) => gardeTypes(e, o.type)).filter((o) => gardePrix(o.prixNegocie ?? o.prix, e))
    .filter((o) => passe(e, "bonEtat", o.etat >= 0.8));
  const liste = trier(base, e, { prix: (o) => o.prixNegocie ?? o.prix, heures: (o) => o.heures, etat: (o) => o.etat }, (o) => o.nom);
  const filtres = [...t.types.map((x) => ({ id: `type:${x.id}`, nom: x.nom, groupe: "Type" })), ...tranchesPrix(BORNES_BATEAUX),
    { id: "bonEtat", nom: "Bon état", groupe: "Annonce" }];
  return `<div class="pz-pile" style="gap:10px">${pastillesListe("chantierOccasions", e, filtres)}${compteListe("chantierOccasions", e, liste.length, "annonces")}</div>
    ${liste.length ? `<div class="cat-grille"><div class="cat-cartes">${liste.map((o) => ligneOccasion(o, p)).join("")}</div></div>` : `<p class="aide">${t.occasions.length ? "Aucune annonce ne correspond." : "Pas d'annonce cette semaine."}</p>`}`;
}

function ligneModele(m, p) {
  return carteModele(m, "configurateur", m.conduite, estChoisi(p, "configurateur", "id", m.id), m.resume);
}

function ligneOccasion(o, p) {
  return `<button class="annonce" data-action="ouvrir" data-page="occasion" data-p='${esc(JSON.stringify({ id: o.id }))}' ${estChoisi(p, "occasion", "id", o.id) ? 'aria-current="true"' : ""}>
    ${vitrine({ forme: o.silhouette, teinte: o.teinte, rarete: o.rarete, hauteur: 110, pastille: true, photo: o.photo })}
    <div class="rangee entre" style="align-items:flex-start;gap:8px">
      <div style="min-width:0;display:flex;flex-direction:column;gap:2px"><div class="nom">${esc(o.nom)}</div>
        <div class="sous">${esc(o.teinteNom)}, ${nombre(o.heures)} h moteur, état ${pourcent(o.etat)}</div><div class="sous">${esc(o.resume)}</div></div>
      <div>${o.prixNegocie != null ? `<div class="barre">${montant(o.prix)}</div><div class="prix encre-gain">${montant(o.prixNegocie)}</div>` : `<div class="prix">${montant(o.prix)}</div>`}</div>
    </div>
    ${o.vice != null ? `<div class="${o.vice ? "encre-perte" : "encre-gain"}" style="font-size:12px;font-weight:600">${o.vice ? "⚠ Inspecté : vice caché" : "✓ Inspecté : rien à signaler"}</div>` : ""}
  </button>`;
}

function rendreChantier(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Chantier naval")}${vide("Le chantier ouvre avec ta première saison.")}`;
  const v = vueChantier(p);
  return `${entetePousse("Chantier naval")}
  <div class="pz-pile" style="gap:14px">
    ${t.ici ? herosPort(t.ici, { titre: `Chantier de ${t.ici.nom}` }) : ""}
    ${t.refusAchat ? noteMer("ancre", esc(t.refusAchat), "var(--alerte)") : ""}
    ${segment([["neuf", "Neuf"], ["occasion", "Occasion"]], v.neuf ? "neuf" : "occasion", "rayonChantier")}
    ${v.neuf ? `${teteListe({ id: "chantierNeufs", etat: listeChantierNeufs(p), invite: "Modèle ou type", tris: TRIS_CHANTIER })}
        <div id="chantierNeufs-corps" class="pz-pile" style="gap:14px">${corpsChantierNeufs(d, p)}</div>`
      : `<p class="aide">Entre plaisanciers, renouvelées chaque semaine. Moins cher ; une inspection révèle un vice caché.</p>
        ${teteListe({ id: "chantierOccasions", etat: listeChantierOccasions(p), invite: "Modèle ou teinte", tris: TRIS_CHANTIER_OCCASIONS })}
        <div id="chantierOccasions-corps" class="pz-pile" style="gap:14px">${corpsChantierOccasions(d, p)}</div>`}
  </div>`;
}

// MARK: - La fiche d'un bateau (EcranBateau)

const TEXTE_ASSURANCE = (a) => (a.couvre < 0.01 ? "Les dégâts sur ton bateau restent pour toi." : a.couvre < 0.99 ? "La moitié des dégâts, au-delà de la franchise." : "Tout, au-delà de la franchise.");

function rendreBateau(d, ctx, p) {
  const b = d.t;
  if (!b) return `${entetePousse("Bateau")}${vide("Ce bateau n'est plus à toi.")}`;
  const t = b.vehicule, f = b.fiche;
  const nomAssurance = t.assurances.find((x) => x.id === t.assurance)?.nom ?? t.assurance;
  const destinations = b.expeditions.filter((x) => !x.refus).slice(0, 9);
  return `${entetePousse(t.nom)}
  <div class="pz-pile">
    ${vitrine({ forme: t.silhouette, teinte: t.teinte, rarete: t.rarete, hauteur: 170, pastille: true, photo: t.photo, prioritaire: true })}
    <div style="display:flex;flex-direction:column;gap:4px">
      <div class="pz-prix"><span class="chiffres" style="font-size:34px">${montant(t.valeur)}</span>${t.leasing ? "" : variationTexte(t.plusValue)}</div>
      <p class="aide">${esc(b.type)} · ${esc(b.resume)}</p>
      ${note("repere", esc(b.statut), "var(--texte2)")}
    </div>
    <div class="mer-fiche">
      <div><div class="v">${virgule(f.longueurM)} m</div><div class="l">longueur</div></div>
      <div><div class="v">${Math.round(f.noeuds)} nœuds</div><div class="l">${Math.round(f.noeuds * 1.852)} km/h</div></div>
      <div><div class="v">${nombre(Math.round(f.porteeKm))} km</div><div class="l">d'autonomie</div></div>
      <div><div class="v">${"★".repeat(Math.max(1, Math.round(b.prestige * 1.5)))}</div><div class="l">prestige</div></div>
      <div><div class="v">+${virgule(b.plaisirDimanche)}</div><div class="l">plaisir le dimanche</div></div>
      <div><div class="v">${b.embarque ? "Oui" : "—"}</div><div class="l">${b.embarque ? `embarque ${esc(b.embarque)}` : "pas de cale"}</div></div>
    </div>
    ${carte(`${tete("jauge", "var(--controles)", "État")}
      ${ligneEtat("Moteur", t.etat, pourcent(t.etat))}
      ${ligneEtat("Coque", b.coque, pourcent(b.coque))}
      ${b.coque < 0.5 ? note("alerteTri", "Coque encrassée : il perd de sa cote chaque jour.", "var(--alerte)") : ""}
      <div class="mer-choix">${t.etat < 0.95 || t.viceConnu ? pilule(`Réparer le moteur, ${montant(t.reparation)}`, "reparer", { categorie: "var(--controles)" }) : ""}
        ${b.coque < 0.98 ? pilule(`Caréner la coque, ${montant(b.carenage)}`, "carener", { categorie: "var(--controles)" }) : ""}</div>
      <div class="filet"></div>
      ${t.conduite ? `<div class="rangee entre">${note(t.conduisible ? "coche" : "permis", esc(t.conduite), t.conduisible ? "var(--texte)" : "var(--alerte)")}
        ${!t.conduisible ? pilule("Permis", "", { page: "permis", p: t.permisRequis ? { permis: t.permisRequis } : null }) : ""}</div>` : ""}
      ${t.equipage != null ? note("equipage", `Équipage : ${montant(t.equipage)} chaque dimanche`) : ""}`, { classe: "pz-carte" })}
    ${ficheTechnique(t.fiche)}
    ${b.port ? herosPort(b.port) : ""}
    ${carte(`${tete("", "", "Au port", `<span class="aide">${montant(b.place)}/sem.</span>`)}
      ${interrupteur(b.hiverne, `<div class="libelle">Au sec pour l'hiver</div><div class="aide">${montant(b.hivernageSemaine)} par semaine au chantier${b.amarrageSemaine != null ? `, au lieu de ${montant(b.amarrageSemaine)} à l'eau` : ""} : ni usure, ni tempête, ni gel. Il ne sort plus.</div>`, "hiverner")}
      ${b.enHiver && !b.hiverne ? note("calendrier", "C'est l'hiver : à l'eau, le moteur peut geler.", "var(--alerte)") : ""}
      <div class="filet"></div>
      <div class="rangee entre" style="gap:12px"><div><div class="libelle">Sortie en mer</div><div class="aide">${b.refusSortie ? esc(b.refusSortie) : `Trois heures au large : +${virgule(b.sortiePlaisir)} de plaisir, ${montant(b.sortieCout)} de carburant.`}</div></div>
        ${pilule("Sortir", "sortie", { plein: true, desactive: !!b.refusSortie })}</div>`, { classe: "pz-carte" })}
    ${carte(`${tete("cle", "var(--vente)", "Charter")}
      ${interrupteur(b.charter, `<div class="libelle">Le louer à la semaine</div><div class="aide">${b.refusCharter ? esc(b.refusCharter) : `Un loueur s'en occupe : environ +${montant(b.charterSemaine)} par semaine à cette saison, commission déduite. Une semaine où tu t'en sers ne rapporte rien.`}</div>`, "charter")}`, { classe: "pz-carte" })}
    ${carte(`${tete("", "", "Expédier")}
      <p class="aide">Chauffeur ou camion sur un même continent, bateau ou cargo d'un port à l'autre, avion cargo (1 jour, très cher) : il t'attend là-bas.</p>
      ${destinations.length ? destinations.map((x) => `<button class="choix-radio" data-action="expedier" data-vers="${esc(x.vers)}" data-mode="${esc(x.mode)}" style="padding:10px 0">
          <span class="pz-ico" style="width:18px;height:18px;color:var(--equipe)">${icoMode(x.mode)}</span>
          <span style="flex:1;min-width:0"><div class="t">${esc(x.nomVille)}</div><div class="aide">${esc(x.nomMode ?? NOMS_MODE[x.mode])}, ${nombre(Math.round(x.km))} km, ${dureeExpedition(x)}</div>${x.avertissement ? `<div class="aide" style="color:var(--alerte, #E8833A)">${esc(x.avertissement)}</div>` : ""}</span>
          <span class="chiffres" style="font-size:14px">${montant(x.cout)}</span></button>`).join("") : `<p class="aide">${esc(b.expeditions[0]?.refus ?? "Aucune destination pour l'instant.")}</p>`}
      ${pilule("Voyager avec lui", "", { page: "port" })}`, { classe: "pz-carte" })}
    ${papier(`<div style="display:flex;flex-direction:column;gap:9px">
      ${titrePapier("Acte de francisation", t.nom)}
      ${champPapier("Coque", esc(t.teinteNom))}
      ${champPapier("Port d'attache", esc(b.nomVille))}
      ${champPapier("Assurance", `${esc(nomAssurance)}, ${montant(t.prime, { centimes: true })}/sem.`)}
      ${champPapier("Reprise par un courtier", montant(t.reprise))}
      ${champPapier("Cote", montant(t.valeur), true)}</div>`)}
    ${carte(`${tete("bouclier", "var(--argent)", "Assurance", `<span class="aide">${montant(t.prime, { centimes: true })}/sem.</span>`)}
      ${t.assurances.map((a) => choixRadio(t.assurance === a.id, esc(a.nom), TEXTE_ASSURANCE(a), "assuranceBateau", { id: a.id })).join("")}`, { classe: "pz-carte" })}
    ${carte(interrupteur(t.entretien, `<div class="libelle">Contrat d'entretien</div><div class="aide">${montant(t.coutEntretien)} par semaine : la coque s'encrasse moins vite, moins de pannes.</div>`, "entretien"), { pad: true })}
    ${/* RNT-221 : le mettre aux enchères depuis sa fiche, comme une voiture. */""}
    ${carteEncheresVoiture(t, etatDe(p, "vehicule", { part: 1 }), ctx.maintenant())}
    ${bouton(`Vendre à un courtier, ${montant(t.reprise)}`, "vendre", { genre: "secondaire", desactive: !!t.leasing || !!t.enchere })}
  </div>`;
}

// MARK: - Faire transporter un véhicule (D328)

const vueConvoyage = (p) => etatDe(p, "convoyage", { vers: null, lieu: null, toutes: false, q: "", assurer: false, choisi: null, avec: [] });
const sousVille = (x, pays = true) => [x.mot, pays && x.pays ? x.pays : null, `${nombre(Math.round(x.km))} km`].filter(Boolean).map(esc).join(" · ");

/** D330 (RNT-431) : la liste des villes, les plus proches d'abord ; une recherche les filtre toutes. */
function listeVillesConvoyage(t, v) {
  if (!t.villes.length) return `<p class="aide">${v.q ? `Aucune ville ne répond à « ${esc(v.q)} ».` : "Aucune ville où l'envoyer."}</p>`;
  const tout = v.toutes || !!v.q;
  return (tout ? t.villes : t.villes.slice(0, 8)).map((x) => choixRadio(false, esc(x.nom), sousVille(x), "choisirVille", { id: x.id })).join("")
    + (t.villes.length > 8 && !tout ? `<div class="mer-choix">${pilule(`Toutes les villes (${t.villes.length})`, "toutesVilles")}</div>` : "");
}

function rendreConvoyage(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Le faire transporter")}${vide("Ce véhicule n'est plus dans ton garage.")}`;
  const v = vueConvoyage(p);
  const choisie = t.villes.find((x) => x.id === t.vers);
  const villes = choisie
    ? `${choixRadio(true, esc(choisie.nom), sousVille(choisie, false), "choisirVille", { id: "" })}<p class="aide">Touche la ville pour en changer.</p>`
    : `<label class="cv-cherche">${ico.loupe}<input type="search" value="${esc(v.q)}" placeholder="Chercher une ville" data-saisie="chercherVille" autocomplete="off" enterkeyhint="search" aria-label="Chercher une ville"></label>
      <div class="pz-pile" id="cv-villes">${listeVillesConvoyage(t, v)}</div>`;
  const prime = t.devis.find((x) => !x.refus && x.assurance > 0)?.assurance ?? 0;
  const prix = (x) => x.cout + (v.assurer ? x.assurance : 0);
  const endroits = choisie && t.endroits.length ? carte(`${tete("", "", "À quel endroit")}
      <p class="aide">Par la route, il est déposé à la porte. Par la mer ou les airs, la livraison depuis le port ou l'aéroport s'ajoute au prix.</p>
      <div class="mer-choix">${filtre("Au plus simple", !t.lieu, "choisirEndroit", { id: "" })}${t.endroits.map((l) => filtre(l.nom, t.lieu === l.id, "choisirEndroit", { id: l.id })).join("")}</div>`, { classe: "pz-carte" }) : "";
  // D429 : les devis en cartes : le moyen, le prix en grand, les étapes, le moins cher et le plus rapide marqués.
  const carteDevis = (x) => `<button type="button" class="carte cv-devis${v.choisi === x.mode ? " choisi" : ""}" data-action="choisirDevis" data-mode="${esc(x.mode)}"${x.refus ? " disabled" : ""} aria-pressed="${v.choisi === x.mode}">
      <span class="cv-devis-tete"><span class="pz-ico cv-ico">${icoMode(x.mode)}</span>
        <span class="cv-corps"><b>${esc(x.nomMode ?? NOMS_MODE[x.mode] ?? x.mode)}</b>${x.refus ? "" : `<span class="aide">${esc(dureeExpedition(x))}</span>`}</span>
        ${x.refus ? "" : `<span class="chiffres cv-prix">${montant(prix(x))}</span>`}</span>
      ${!x.refus && x.marques?.length ? `<span class="cv-marques">${x.marques.map((m) => `<span class="cv-marque">${esc(m)}</span>`).join("")}</span>` : ""}
      <span class="cv-etapes">${x.refus ? `<span class="aide">${esc(x.refus)}</span>` : `${(x.etapes ?? []).map((e) => `<span class="cv-etape">${esc(e)}</span>`).join("")}
        ${x.livraison > 0 ? `<span class="aide">Livraison ${montant(x.livraison)} comprise</span>` : ""}
        ${x.avertissement ? `<span class="aide cv-alerte">${esc(x.avertissement)}</span>` : ""}
        ${x.note ? `<span class="aide">${esc(x.note)}</span>` : ""}
        ${x.risques ? `<span class="cv-risques">${esc(x.risques)}</span>` : ""}`}</span></button>`;
  const devis = choisie ? `<section class="pz-pile" style="gap:10px"><h2 class="libelle">Par quel moyen</h2>
      ${t.devis.map(carteDevis).join("")}
      ${prime > 0 ? carte(interrupteur(v.assurer, `<div class="libelle">Assurer le transport, ${montant(prime)}</div><div class="aide">Rayure réparée, vol remboursé à sa valeur, un quart du prix rendu en cas de retard.</div>`, "assurerTransport"), { classe: "pz-carte" }) : ""}</section>` : "";
  // D429 : chez toi et tes logements, en un geste.
  const raccourcis = !choisie && t.raccourcis?.length ? carte(`${tete("", "", "Où tu vis")}
      ${t.raccourcis.map((r) => `<button type="button" class="choix-radio cv-ligne" data-action="choisirRaccourci" data-ville="${esc(r.ville)}" data-lieu="${esc(r.lieu ?? "")}">
        <span class="cv-corps"><div class="t">${esc(r.nom)}</div><div class="aide">${esc(r.detail)}</div></span><span class="chevron" aria-hidden="true">›</span></button>`).join("")}`, { classe: "pz-carte" }) : "";
  const x = t.devis.find((e) => e.mode === v.choisi && !e.refus);
  // D433 (LIV, tour 16) : les autres véhicules garés là, sur le même porte-voitures.
  const compagnons = t.compagnons?.length ? carte(`${tete("", "", t.avec?.length ? `Avec lui · ${t.avec.length + 1} véhicules` : "Avec lui")}
      <p class="aide">Un porte-voitures en prend 8 : chacun paie moins à plusieurs.</p>
      <div class="mer-choix">${t.compagnons.map((c) => filtre(c.nom, c.choisi, "choisirCompagnon", { id: c.id })).join("")}</div>`, { classe: "pz-carte" }) : "";
  const barre = x ? `<div class="cv-barre"><p class="aide">${t.avec?.length ? `${t.avec.length + 1} véhicules, ` : ""}${esc(x.nomMode ?? NOMS_MODE[x.mode])} vers ${esc(`${x.nomLieu ? `${x.nomLieu}, ` : ""}${x.nomVille}`)}, ${esc(dureeExpedition(x))}${v.assurer ? ", assuré" : ""}</p>
      <button class="bouton" data-action="envoyer">Envoyer · ${montant(prix(x))}</button></div>` : "";
  const titre = t.aeronef ? "Le faire convoyer" : "Le faire livrer";
  return `${entetePousse(titre)}
  <div class="pz-pile${x ? " cv-avec-barre" : ""}">
    ${enteteLivraison(t, d.v)}
    ${t.refus ? note("alerte", esc(t.refus), "var(--alerte)") : ""}
    ${raccourcis}
    ${carte(`${tete("", "", "Vers quelle ville")}${villes}`, { classe: "pz-carte" })}
    ${compagnons}
    ${endroits}
    ${devis}
    ${enRoute(t.expeditions)}
  </div>${barre}`;
}

// MARK: - Le port (EcranPort)

const vuePort = (p) => etatDe(p, "port", { choisis: [], toutes: false });

function boutonDevis(dv, tr) {
  const op = dv.embarque != null ? { traverser: { vers: tr.vers, moyen: dv.moyen, vehicule: dv.vehicule, embarque: dv.embarque } }
    : { voyager: { vers: tr.vers, moyen: dv.moyen, ...(dv.vehicule != null ? { vehicule: dv.vehicule } : {}) } };
  return `<button data-action="traverser" data-op='${esc(JSON.stringify(op))}' data-nom="${esc(tr.nomVille)}" ${dv.refus ? "disabled" : ""}>
    <span class="n"><span class="pz-ico" style="width:13px;height:13px;display:inline-block;vertical-align:-2px">${dv.moyen === "ferry" ? icm.ferry : icm.voile}</span> ${esc(dv.nom)}</span>
    <span class="p">${montant(dv.cout)}</span>
    <span class="d">${dureeJeu(dv.minutes)} de jeu${dv.note ? ` · ${esc(dv.note)}` : ""}</span>
    ${dv.refus ? `<span class="r">${esc(dv.refus)}</span>` : ""}</button>`;
}

function rendrePort(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Le port")}${vide("Le port ouvre avec ta première saison.")}`;
  const v = vuePort(p);
  const aller = t.port && !t.auPort ? `<div class="mer-choix">${pilule("Aller au port de plaisance", "allerPort", { donnees: { lieu: "u:plaisance" } })}${t.port.ferry ? pilule("Aller au port de ferries", "allerPort", { donnees: { lieu: "u:ferries" } }) : ""}</div>` : "";
  return `${entetePousse("Le port")}
  <div class="pz-pile" style="gap:14px">
    ${t.port ? herosPort(t.port) : noteMer("ancre", esc(t.sansPort ?? ""), "var(--texte2)")}
    ${aller}
    ${t.port ? `<div class="libelle">Traversées</div>
      ${t.traversees.length ? t.traversees.map((tr) => carte(`<div class="rangee entre" style="align-items:baseline"><span style="font-size:16px;font-weight:600">${esc(tr.nomVille)}</span>
          <span class="aide">${nombre(Math.round(tr.km))} km par la mer${tr.memeMer ? "" : ", une autre mer"}</span></div>
          <div class="mer-devis">${tr.devis.filter((x) => !x.refus || x.vehicule == null || !x.refus.startsWith("Trop loin")).map((x) => boutonDevis(x, tr)).join("")}</div>`, { classe: "pz-carte" })).join("")
        : `<p class="aide">Aucun ferry d'ici, et pas de bateau à toi à quai. Le chantier naval en vend.</p>`}` : ""}
    ${carte(`${tete("", "", "Expédier un véhicule")}
      <p class="aide">Choisis ce qui part, puis comment : chauffeur ou camion par la route, bateau ou cargo entre deux ports, avion cargo (1 jour, très cher).</p>
      ${t.vehicules.length ? `<div class="mer-choix">${t.vehicules.map((x) => filtre(x.nom, v.choisis.includes(x.id), "choisirExpedie", { id: x.id })).join("")}</div>` : `<p class="aide">Aucun de tes véhicules n'est ici.</p>`}
      ${v.choisis.length ? (t.destinations.length ? (v.toutes ? t.destinations : t.destinations.slice(0, 8)).map((x) => `<button class="choix-radio" data-action="expedierChoix" data-vers="${esc(x.vers)}" data-mode="${esc(x.mode)}" style="padding:10px 0">
          <span class="pz-ico" style="width:18px;height:18px;color:var(--equipe)">${icoMode(x.mode)}</span>
          <span style="flex:1;min-width:0"><div class="t">${esc(x.nomVille)}</div><div class="aide">${esc(x.nomMode ?? NOMS_MODE[x.mode])}, ${nombre(Math.round(x.km))} km, ${dureeExpedition(x)}</div>${x.avertissement ? `<div class="aide" style="color:var(--alerte, #E8833A)">${esc(x.avertissement)}</div>` : ""}</span>
          <span class="chiffres" style="font-size:14px">${montant(x.cout)}</span></button>`).join("") + (t.destinations.length > 8 && !v.toutes ? `<div class="mer-choix">${pilule(`Toutes les villes (${t.destinations.length})`, "toutesDestinations")}</div>` : "") : `<p class="aide">Nulle part où les envoyer d'ici.</p>`) : ""}`, { classe: "pz-carte" })}
    ${enRoute(t.expeditions)}
  </div>`;
}

/** Aller à un endroit du port, avec le premier moyen possible (comme les bots). */
async function allerAuPort(ctx, lieu) {
  const devis = (await ctx.tableau("devisLocal", { vers: lieu })) ?? [];
  const d = devis.find((x) => !x.refus && x.vehicule == null) ?? devis.find((x) => !x.refus);
  if (!d) return ctx.toast("Aucun moyen d'y aller pour l'instant.", "refus");
  await ctx.decider("monde", { allerA: { lieu, moyen: d.moyen, ...(d.vehicule != null ? { vehicule: d.vehicule } : {}) } }, { succes: "En route pour le port" });
}

// MARK: - Les pages

export const pages = {
  chantierNaval: {
    titre: "Chantier naval",
    async donnees(ctx) { return { t: await ctx.tableau("chantierNaval") }; },
    rendu: rendreChantier,
    actions: {
      rayonChantier(ctx, b, d, p) { vueChantier(p).neuf = b.dataset.valeur === "neuf"; ctx.redessiner(); },
      ...actionsListe("chantierNeufs", listeChantierNeufs, TRIS_CHANTIER, (ctx, d, p) => repeindre("chantierNeufs", corpsChantierNeufs(d, p))),
      ...actionsListe("chantierOccasions", listeChantierOccasions, TRIS_CHANTIER_OCCASIONS, (ctx, d, p) => repeindre("chantierOccasions", corpsChantierOccasions(d, p))),
    },
  },

  bateau: {
    titre: "Bateau",
    async donnees(ctx, p) { return { t: await ctx.tableau("bateau", { id: p.id }) }; },
    rendu: rendreBateau,
    actions: {
      reparer: (ctx, b, d, p) => ctx.decider("garage", { reparer: { vehicule: p.id } }, { succes: "Moteur révisé" }),
      carener: (ctx, b, d, p) => ctx.decider("mer", { carener: { bateau: p.id } }, { succes: "Coque comme neuve" }),
      hiverner: (ctx, b, d, p) => ctx.decider("mer", { hiverner: { bateau: p.id, _1: !d.t.hiverne } }, { succes: d.t.hiverne ? "Remis à l'eau" : "Au sec pour l'hiver" }),
      charter: (ctx, b, d, p) => ctx.decider("mer", { charter: { bateau: p.id, _1: !d.t.charter } }, { succes: d.t.charter ? "Repris du charter" : "Confié au loueur" }),
      sortie: (ctx, b, d, p) => ctx.decider("mer", { sortie: { bateau: p.id } }, { succes: "Trois heures au large" }),
      // RNT-221 : les enchères depuis la fiche (la carte de vehicules.js).
      async partReserve(ctx, b, d, p) { etatDe(p, "vehicule", {}).part = Number(b.dataset.k); await ctx.rafraichir(); },
      async mettreAuxEncheres(ctx, b, d, p) {
        b.disabled = true;
        const ok = await ctx.commande("encheres.mettreVehicule", { vehicule: p.id, reserve: Number(b.dataset.reserve) }, { succes: "En vente pour 24 h" });
        if (!ok) b.disabled = false;
      },
      retirerEnchere: (ctx, b) => ctx.commande("encheres.retirer", { vente: b.dataset.vente }, { succes: "Vente retirée" }),
      entretien: (ctx, b, d, p) => ctx.decider("garage", { entretien: { vehicule: p.id, _1: !d.t.vehicule.entretien } }, { succes: d.t.vehicule.entretien ? "" : "Contrat d'entretien signé" }),
      assuranceBateau: (ctx, b, d, p) => ctx.decider("garage", { assurer: { vehicule: p.id, assurance: b.dataset.id, franchise: d.t.vehicule.franchise } }),
      expedier(ctx, b, d, p) {
        const x = d.t.expeditions.find((e) => e.vers === b.dataset.vers && e.mode === b.dataset.mode);
        if (!x) return;
        confirmer(ctx, {
          titre: `Vers ${x.nomVille} ?`, message: `${NOMS_MODE[x.mode]}, ${dureeExpedition(x)} de route. Il t'attendra à l'arrivée ; en route, il ne sert à rien.`,
          boutons: [{ texte: `Expédier pour ${montant(x.cout)}`, faire: () => ctx.decider("mer", { expedier: { vehicules: [p.id], vers: x.vers, mode: x.mode } }, { succes: `En route vers ${x.nomVille}` }) }],
        });
      },
      vendre(ctx, b, d, p) {
        confirmer(ctx, {
          titre: "Vendre ce bateau ?", message: "Un courtier le reprend à 90 % de sa cote. Un crédit lié continue d'être remboursé.",
          boutons: [{ texte: `Vendre pour ${montant(d.t.vehicule.reprise)}`, faire: async () => { if (await ctx.decider("garage", { vendre: { vehicule: p.id } }, { succes: "Vendu" })) await ctx.retour(); } }],
        });
      },
    },
  },

  // D328 : faire transporter un véhicule, depuis sa fiche et où qu'il soit (EcransBateaux.swift, FeuilleConvoyage).
  convoyage: {
    titre: "Le faire transporter",
    async donnees(ctx, p) {
      const v = vueConvoyage(p);
      const [t, g, f] = await Promise.all([
        ctx.tableau("convoyage", { id: p.id, ...(v.vers ? { vers: v.vers } : {}), ...(v.lieu ? { lieu: v.lieu } : {}), ...(v.q && !v.vers ? { recherche: v.q } : {}),
          ...(v.avec.length ? { avec: v.avec } : {}) }),
        ctx.tableau("garage"), ctx.tableau("flotte")]);
      return { t, v: [...(g?.vehicules ?? []), ...(f?.bateaux ?? [])].find((x) => x.id === p.id) };
    },
    rendu: rendreConvoyage,
    actions: {
      async choisirVille(ctx, b, d, p) { const v = vueConvoyage(p); v.vers = b.dataset.id || null; v.lieu = null; v.q = ""; v.choisi = null; await ctx.rafraichir(); },
      async choisirRaccourci(ctx, b, d, p) { const v = vueConvoyage(p); v.vers = b.dataset.ville; v.lieu = b.dataset.lieu || null; v.choisi = null; await ctx.rafraichir(); },
      choisirDevis(ctx, b, d, p) { const v = vueConvoyage(p); v.choisi = v.choisi === b.dataset.mode ? null : b.dataset.mode; ctx.redessiner(); },
      // D330 (RNT-431) : la recherche passe par le moteur (les mêmes villes que sur l'iPhone), sans redessiner le champ.
      async chercherVille(ctx, el, d, p) {
        const v = vueConvoyage(p);
        const q = el.value;
        v.q = q;
        const t = await ctx.tableau("convoyage", { id: p.id, ...(q ? { recherche: q } : {}) });
        if (vueConvoyage(p).q !== q || !t) return;
        if (d) d.t = t;
        const c = document.getElementById("cv-villes");
        if (c) c.innerHTML = listeVillesConvoyage(t, v);
      },
      async choisirCompagnon(ctx, b, d, p) {
        const v = vueConvoyage(p), id = Number(b.dataset.id);
        v.avec = v.avec.includes(id) ? v.avec.filter((x) => x !== id) : [...v.avec, id];
        v.choisi = null;
        await ctx.rafraichir();
      },
      assurerTransport(ctx, b, d, p) { const v = vueConvoyage(p); v.assurer = !v.assurer; ctx.redessiner(); },
      async choisirEndroit(ctx, b, d, p) { const v = vueConvoyage(p); v.lieu = b.dataset.id || null; v.choisi = null; await ctx.rafraichir(); },
      toutesVilles(ctx, b, d, p) { vueConvoyage(p).toutes = true; ctx.redessiner(); },
      // D429 : on confirme en bas de la page (le bouton « Envoyer · prix »), plus d'alerte.
      async envoyer(ctx, b, d, p) {
        const v = vueConvoyage(p);
        const x = d.t?.devis.find((e) => e.mode === v.choisi);
        if (!x || x.refus) return;
        const ou = `${x.nomLieu ? `${x.nomLieu}, ` : ""}${x.nomVille}`;
        const op = { expedier: { vehicules: [p.id, ...(d.t?.avec ?? [])], vers: x.vers, mode: x.mode, ...(x.lieu ? { lieu: x.lieu } : {}), ...(v.assurer ? { assure: true } : {}) } };
        if (await ctx.decider("mer", op, { succes: `En route vers ${ou}` })) await ctx.retour();
      },
    },
  },

  port: {
    titre: "Le port",
    async donnees(ctx, p) { return { t: await ctx.tableau("port", { vehicules: vuePort(p).choisis }) }; },
    rendu: rendrePort,
    actions: {
      allerPort: (ctx, b) => allerAuPort(ctx, b.dataset.lieu),
      async choisirExpedie(ctx, b, d, p) {
        const v = vuePort(p), id = Number(b.dataset.id);
        v.choisis = v.choisis.includes(id) ? v.choisis.filter((x) => x !== id) : [...v.choisis, id];
        await ctx.rafraichir();
      },
      toutesDestinations(ctx, b, d, p) { vuePort(p).toutes = true; ctx.redessiner(); },
      expedierChoix(ctx, b, d, p) {
        const x = d.t.destinations.find((e) => e.vers === b.dataset.vers && e.mode === b.dataset.mode);
        const v = vuePort(p);
        if (!x) return;
        confirmer(ctx, {
          titre: `Vers ${x.nomVille} ?`, message: `${NOMS_MODE[x.mode]}, ${dureeExpedition(x)} de route : tout arrive ensemble.`,
          boutons: [{ texte: `Expédier pour ${montant(x.cout)}`, faire: async () => {
            if (await ctx.decider("mer", { expedier: { vehicules: v.choisis, vers: x.vers, mode: x.mode } }, { succes: `En route vers ${x.nomVille}` })) { v.choisis = []; await ctx.rafraichir(); }
          } }],
        });
      },
      traverser(ctx, b) {
        const op = JSON.parse(b.dataset.op);
        return ctx.decider("monde", op, { succes: `En route pour ${b.dataset.nom}` });
      },
    },
  },
};

// Lot D : les photos, et au grand écran le chantier garde sa liste à gauche, la fiche à droite.
for (const id of ["bateau", "port"]) {
  const def = pages[id];
  pages[id] = { ...def, async donnees(ctx, p) { await chargerPhotos(); return def.donnees(ctx, p); } };
}
const chantierListe = pages.chantierNaval;
pages.chantierNaval = listeEtDetail("chantierNaval", {
  ...chantierListe,
  async donnees(ctx, p) { await chargerPhotos(); return chantierListe.donnees(ctx, p); },
}, { configurateur: pagesVehicules.configurateur, occasion: pagesVehicules.occasion }, {
  vide: () => videDetail("Choisis un bateau", "Sa photo, sa fiche et le bon de commande s'ouvrent ici, sans quitter le chantier."),
});
const sectionDonneesMer = section.donnees;
section.donnees = async (ctx) => { await chargerPhotos(); return sectionDonneesMer(ctx); };
