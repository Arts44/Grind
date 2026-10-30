// ══════════════════════════════════════════════════════════════════════
//  Zone « bateaux » (RNT-188, D206) — EcransBateaux.swift, écran pour écran :
//    section        ← SectionBateaux       (Actifs › Bateaux, tableau « flotte »)
//    chantierNaval  ← EcranChantierNaval   (neufs par type, occasions du port ; l'achat passe
//                                           par le configurateur et l'occasion de vehicules.js)
//    bateau         ← EcranBateau          (coque, port, hivernage, sortie, charter, expédition)
//    port           ← EcranPort            (météo, ferries et traversées, cargos)
//  Tout vient du moteur (TableauBateaux.swift) ; les briques de immobilier.js et vehicules.js.
// ══════════════════════════════════════════════════════════════════════
import { montant, pourcent, esc } from "../format.js";
import { carte, ligne, bouton, segment, entetePousse, vide } from "../ui.js";
import {
  ico, pilule, filtre, choixRadio, interrupteur, tete, label, note, ligneEtat, papier, titrePapier, champPapier, confirmer,
  pastilleRarete, possession, selecteurDisposition, lireDisposition, dispositionActifs, etatDe, balance, variationTexte, nombre,
} from "./immobilier.js";
import { vitrine, carteModele, carteEncheresVoiture, ficheTechnique, pages as pagesVehicules } from "./vehicules.js";
import { chargerPhotos, listeEtDetail, estChoisi, videDetail } from "./catalogues.js";

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

const NOMS_MODE = { cargo: "Cargo", camion: "Camion" };

// MARK: - Actifs › Bateaux (SectionBateaux)

export const section = {
  async donnees(ctx) { return { t: await ctx.tableau("flotte") }; },
  rendu(d) {
    const t = d?.t;
    if (!t) return vide("Le port ouvre avec ta première saison.");
    const galerie = lireDisposition() === "galerie";
    return `<div class="pz-pile" style="gap:14px">
      ${!t.bateaux.length ? `<div class="pz-pile" style="gap:12px">${vitrine({ forme: "yacht", teinte: "#1B2A44", hauteur: 120, eteinte: true })}
          <p class="aide">De la barque au mégayacht, au chantier naval d'une ville côtière. Une place au port se loue à la semaine ; le permis côtier, puis l'extension hauturière, pour prendre la mer toi-même.</p></div>` : `
        <div class="rangee entre"><span class="libelle">${t.bateaux.length} bateau${t.bateaux.length > 1 ? "x" : ""}</span>${selecteurDisposition()}</div>
        <div class="possessions ${galerie ? "galerie" : ""}">${t.bateaux.map((b) => possession({
          nom: b.nom, valeur: montant(b.valeur), galerie, page: "bateau", p: { id: b.id },
          badge: b.plusValue !== 0 ? (b.plusValue > 0 ? "+" : "−") + montant(Math.abs(b.plusValue)) : "",
          lignes: [[b.statut, b.ici ? "var(--gain)" : "var(--texte2)", "repere"], ...(b.alerte ? [[b.alerte, "var(--alerte)"]] : []), [`${b.type} · ${virgule(b.longueurM)} m`, "var(--texte2)"]],
          visuel: (h) => vitrine({ forme: b.silhouette, teinte: b.teinte, rarete: b.rarete, hauteur: h, photo: b.photo }),
        })).join("")}</div>
        <div class="mer-fiche">
          <div><div class="v">${montant(t.placesSemaine)}</div><div class="l">places au port / sem.</div></div>
          <div><div class="v">${montant(t.equipagesSemaine)}</div><div class="l">équipages / sem.</div></div>
          <div><div class="v" style="color:${t.charterSemaine > 0 ? "var(--gain)" : "inherit"}">${t.charterSemaine > 0 ? "+" : ""}${montant(t.charterSemaine)}</div><div class="l">charter / sem.</div></div>
        </div>`}
      ${t.ici ? herosPort(t.ici) : ""}
      ${t.expeditions.length ? carte(`${tete("", "", "En route")}${t.expeditions.map((x) => note("horloge", `${esc(x.vehicules)} : ${NOMS_MODE[x.mode] ?? x.mode} vers ${esc(x.vers)}, arrivée ${heure(x.arrivee)}`)).join("")}`, { classe: "pz-carte" }) : ""}
      ${t.enHiver && t.bateaux.length ? note("calendrier", "C'est l'hiver : un bateau resté à l'eau risque le gel. Au sec, il ne s'use pas.", "var(--alerte)") : ""}
      ${carte(
        ligne({ titre: "Chantier naval", detail: "Neufs et occasions, de la barque au mégayacht", page: "chantierNaval", icone: icm.voile, teinte: "var(--vente)" })
        + ligne({ titre: "Le port", detail: t.ici ? "Ferries, traversées, cargos" : "Pas de port ici : cargos et camions", page: "port", icone: icm.ancre, teinte: "var(--equipe)" }))}
    </div>`;
  },
  actions: { dispositionActifs },
};

// MARK: - Le chantier naval (EcranChantierNaval)

const vueChantier = (p) => etatDe(p, "chantier", { neuf: true, type: "tous" });

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
  const modeles = t.modeles.filter((m) => v.type === "tous" || m.type === v.type).sort((a, b) => a.prix - b.prix);
  const occasions = t.occasions.filter((o) => v.type === "tous" || o.type === v.type).sort((a, b) => (a.prixNegocie ?? a.prix) - (b.prixNegocie ?? b.prix));
  return `${entetePousse("Chantier naval")}
  <div class="pz-pile" style="gap:14px">
    ${t.ici ? herosPort(t.ici, { titre: `Chantier de ${t.ici.nom}` }) : ""}
    ${t.refusAchat ? noteMer("ancre", esc(t.refusAchat), "var(--alerte)") : ""}
    ${segment([["neuf", "Neuf"], ["occasion", "Occasion"]], v.neuf ? "neuf" : "occasion", "rayonChantier")}
    <div class="pz-defile">${filtre("Tous", v.type === "tous", "typeChantier", { t: "tous" })}${t.types.map((x) => filtre(x.nom, v.type === x.id, "typeChantier", { t: x.id })).join("")}</div>
    ${v.neuf ? `${modeles.length ? `<div class="cat-grille"><div class="cat-cartes">${modeles.map((m) => ligneModele(m, p)).join("")}</div></div>` : `<p class="aide">Aucun bateau de ce type.</p>`}`
      : `<p class="aide">Entre plaisanciers, renouvelées chaque semaine. Moins cher ; une inspection révèle un vice caché.</p>
         ${occasions.length ? `<div class="cat-grille"><div class="cat-cartes">${occasions.map((o) => ligneOccasion(o, p)).join("")}</div></div>` : `<p class="aide">Pas d'annonce de ce type cette semaine.</p>`}`}
  </div>`;
}

// MARK: - La fiche d'un bateau (EcranBateau)

const TEXTE_ASSURANCE = (a) => (a.couvre < 0.01 ? "Les dégâts sur ton bateau restent pour toi." : a.couvre < 0.99 ? "La moitié des dégâts, au-delà de la franchise." : "Tout, au-delà de la franchise.");

function rendreBateau(d, ctx, p) {
  const b = d.t;
  if (!b) return `${entetePousse("Bateau")}${vide("Ce bateau n'est plus à toi.")}`;
  const t = b.vehicule, f = b.fiche;
  const nomAssurance = t.assurances.find((x) => x.id === t.assurance)?.nom ?? t.assurance;
  const destinations = b.expeditions.filter((x) => !x.refus).slice(0, 6);
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
      <div class="rangee entre">${note(t.conduisible ? "coche" : "permis", esc(t.conduite), t.conduisible ? "var(--texte)" : "var(--alerte)")}
        ${!t.conduisible ? pilule("Permis", "", { page: "permis", p: t.permisRequis ? { permis: t.permisRequis } : null }) : ""}</div>
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
      <p class="aide">Par cargo d'un port à l'autre (ou par camion), en quelques jours : il t'attend au port.</p>
      ${destinations.length ? destinations.map((x) => `<button class="choix-radio" data-action="expedier" data-vers="${esc(x.vers)}" style="padding:10px 0">
          <span class="pz-ico" style="width:18px;height:18px;color:var(--equipe)">${x.mode === "cargo" ? icm.cargo : ico.voitureCote}</span>
          <span style="flex:1;min-width:0"><div class="t">${esc(x.nomVille)}</div><div class="aide">${NOMS_MODE[x.mode]}, ${nombre(Math.round(x.km))} km, ${x.jours} jours</div></span>
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
      <p class="aide">Choisis ce qui part : un cargo entre deux ports, un camion par la route. Arrivée en quelques jours, au port.</p>
      ${t.vehicules.length ? `<div class="mer-choix">${t.vehicules.map((x) => filtre(x.nom, v.choisis.includes(x.id), "choisirExpedie", { id: x.id })).join("")}</div>` : `<p class="aide">Aucun de tes véhicules n'est ici.</p>`}
      ${v.choisis.length ? (t.destinations.length ? (v.toutes ? t.destinations : t.destinations.slice(0, 8)).map((x) => `<button class="choix-radio" data-action="expedierChoix" data-vers="${esc(x.vers)}" style="padding:10px 0">
          <span class="pz-ico" style="width:18px;height:18px;color:var(--equipe)">${x.mode === "cargo" ? icm.cargo : ico.voitureCote}</span>
          <span style="flex:1;min-width:0"><div class="t">${esc(x.nomVille)}</div><div class="aide">${NOMS_MODE[x.mode]}, ${nombre(Math.round(x.km))} km, ${x.jours} jours</div></span>
          <span class="chiffres" style="font-size:14px">${montant(x.cout)}</span></button>`).join("") + (t.destinations.length > 8 && !v.toutes ? `<div class="mer-choix">${pilule(`Toutes les villes (${t.destinations.length})`, "toutesDestinations")}</div>` : "") : `<p class="aide">Nulle part où les envoyer d'ici.</p>`) : ""}`, { classe: "pz-carte" })}
    ${t.expeditions.length ? carte(`${tete("", "", "En route")}${t.expeditions.map((x) => note("horloge", `${esc(x.vehicules)} : ${NOMS_MODE[x.mode] ?? x.mode} vers ${esc(x.vers)}, arrivée ${heure(x.arrivee)}`)).join("")}`, { classe: "pz-carte" }) : ""}
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
      typeChantier(ctx, b, d, p) { vueChantier(p).type = b.dataset.t; ctx.redessiner(); },
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
        const x = d.t.expeditions.find((e) => e.vers === b.dataset.vers);
        if (!x) return;
        confirmer(ctx, {
          titre: `Vers ${x.nomVille} ?`, message: `${NOMS_MODE[x.mode]}, ${x.jours} jours de route. Il t'attendra au port ; en route, il ne sert à rien.`,
          boutons: [{ texte: `Expédier pour ${montant(x.cout)}`, faire: () => ctx.decider("mer", { expedier: { vehicules: [p.id], vers: x.vers } }, { succes: `En route vers ${x.nomVille}` }) }],
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
        const x = d.t.destinations.find((e) => e.vers === b.dataset.vers);
        const v = vuePort(p);
        if (!x) return;
        confirmer(ctx, {
          titre: `Vers ${x.nomVille} ?`, message: `${NOMS_MODE[x.mode]}, ${x.jours} jours de route : tout arrive ensemble, au port.`,
          boutons: [{ texte: `Expédier pour ${montant(x.cout)}`, faire: async () => {
            if (await ctx.decider("mer", { expedier: { vehicules: v.choisis, vers: x.vers } }, { succes: `En route vers ${x.nomVille}` })) { v.choisis = []; await ctx.rafraichir(); }
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
