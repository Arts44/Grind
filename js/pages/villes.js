// ══════════════════════════════════════════════════════════════════════
//  L'écran Monde en pages (RNT-198, D211) — EcranMondePages.swift.
//
//  Sous la carte, deux lignes ouvrent leur page :
//    monde.lieux       les lieux de la ville où l'on est, le temps à pied
//    monde.lieu        un lieu : ce qu'on y fait (la table de la carte Ici), Y aller
//    monde.villes      les villes, à chercher, trier, filtrer
//    monde.ville       la fiche d'une ville : fiscalité, coût de la vie face à
//                      ta ville, voisines, vie de la ville, devis du voyage ;
//                      deux boutons : Chantiers et Résidences à louer
//    monde.chantiers   les chantiers d'une ville (RNT-150), enfin sur le web
//    monde.residences  les logements à louer : visibles de loin, le bail se
//                      signe à l'agence immobilière de la ville
//  Tout vient du moteur (TableauLieuxVille, TableauVille, TableauChantiersVille,
//  TableauResidences) : les textes qui comparent sont déjà faits.
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js";
import { entetePousse, carte, bouton, petit, icones, ligne, rail } from "../ui.js";
import { sf, de, voyagerVers, allerVersLieu } from "./monde.js";
import { monde as mondeEnLigne, voterChantier } from "../enligne.js";
import { balanceGardee, listeEtDetail, estChoisi, videDetail } from "./catalogues.js";

const nombre = (x, d = 0) => x.toLocaleString("fr-BE", { minimumFractionDigits: d, maximumFractionDigits: d });
const sectionTitre = (t) => `<div class="section" style="margin:6px 4px 8px">${esc(t)}</div>`;
const pied = (t) => (t ? `<p class="aide" style="margin:8px 4px 0">${esc(t)}</p>` : "");
const pastille = (icone, teinte) => `<span class="pastille" style="--c:${teinte}">${sf(icone)}</span>`;
const TEINTE = { lieu: "#6FA8FF", ici: "var(--or)", mien: "#F2A65A", grandir: "var(--grandir)", equipe: "var(--equipe)" };

/** Une ligne qui pousse une page (titre, détail, valeur, chevron). */
function lignePage({ id = "", page, p, icone, teinte, titre, detail = "", valeur = "", valeurOr = false, choisie = false }) {
  return `<button class="ligne" ${id ? `id="${esc(id)}"` : ""} data-action="ouvrir" data-page="${esc(page)}" data-p='${esc(JSON.stringify(p ?? {}))}' ${choisie ? 'aria-current="true"' : ""}>
    ${pastille(icone, teinte)}
    <span style="flex:1;min-width:0"><div class="titre" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(titre)}</div>${detail ? `<div class="detail">${esc(detail)}</div>` : ""}</span>
    ${valeur !== "" ? `<span class="valeur" style="font-size:13px;${valeurOr ? "color:var(--or)" : "color:var(--texte2)"}">${esc(valeur)}</span>` : ""}
    <span class="chevron">${icones.chevron}</span></button>`;
}

// MARK: Les lieux de la ville

const pageLieux = {
  css: "monde", // lot A : css/pages/monde.css (pour toutes les pages de ce fichier)
  titre: "Lieux",
  async donnees(ctx) { return { l: await ctx.tableau("lieuxVille") }; },
  rendu(d, ctx, pListe) {
    const t = d?.l;
    if (!t) return `${entetePousse("Lieux")}<div class="vide">En voyage, on n'est dans aucune ville : les lieux reviennent à l'arrivée.</div>`;
    const lignes = t.lieux.map((l) => lignePage({
      id: `lieu-${l.id}`, page: "monde.lieu", p: { id: l.id }, icone: l.icone, teinte: l.ici ? TEINTE.ici : TEINTE.lieu, titre: l.nom,
      detail: l.vehicules.length ? `${l.type} ; garé ici : ${l.vehicules.join(", ")}` : l.type, valeur: l.trajet, valeurOr: l.ici,
      choisie: estChoisi(pListe, "monde.lieu", "id", l.id),
    })).join("");
    return `${entetePousse(t.villeNom)}
      <div class="pile">
        <p class="aide" style="margin:0 4px">${t.enRoute ? "Tu es en route : les distances partent de là où tu es."
          : t.endroitActuel ? `Ici : ${esc(t.endroitActuel)}. Touche un lieu pour voir ce qu'on y fait.` : "Touche un lieu pour voir ce qu'on y fait."}</p>
        <div id="liste-lieux">${carte(lignes)}</div>
      </div>`;
  },
};

const pageLieu = {
  titre: "Lieu",
  async donnees(ctx, p) { return { l: await ctx.tableau("lieuxVille"), id: p?.id }; },
  rendu(d) {
    const l = d?.l?.lieux.find((x) => x.id === d.id);
    if (!l) return `${entetePousse("Lieu")}<div class="vide">Ce lieu n'est plus dans ta ville.</div>`;
    const actions = l.actions.length
      ? l.actions.map((a) => ligne({ titre: esc(a.titre), detail: esc(a.detail ?? ""), icone: sf(a.icone), teinte: TEINTE.equipe })).join("")
      : ligne({ titre: "Rien de spécial", detail: "Un endroit de la ville, sur ta route", icone: sf("mappin"), teinte: TEINTE.lieu });
    return `${entetePousse(l.nom)}
      <div class="pile" id="fiche-lieu">
        <div class="rangee" style="gap:14px;margin:4px 4px 0">
          <span class="pastille" style="--c:var(--equipe);width:48px;height:48px;border-radius:13px">${sf(l.icone, 24)}</span>
          <div><div class="libelle">${esc(l.type)}</div><div style="font-size:13px;font-weight:500;color:${l.ici ? "var(--or)" : "var(--texte2)"}">${esc(l.trajet)}</div></div>
        </div>
        ${l.vehicules.length ? `<p class="aide" style="margin:0 4px">Garé ici : ${esc(l.vehicules.join(", "))}</p>` : ""}
        <div>${sectionTitre("Ce qu'on y fait")}${carte(actions)}${pied(l.ici ? "Tu es ici : ces gestes sont sur la carte Ici de l'accueil." : "Sur place : vas-y d'abord.")}</div>
        ${l.ici ? bouton("Ouvrir la carte Ici", "versIci", { genre: "secondaire" }) : bouton("Y aller", "allerLieu", { genre: "teinte", teinte: "var(--equipe)" })}
      </div>`;
  },
  actions: {
    versIci: (ctx) => ctx.allerOnglet("accueil"),
    allerLieu: (ctx, el, d) => allerVersLieu(ctx, d.id),
  },
};

// MARK: Les villes — chercher, trier, filtrer (RNT-136)

const vue = { requete: "", tri: "km", filtres: new Set() };

function villesFiltrees(d) {
  const t = d.m;
  const regions = d.regions;
  const residence = t.lieux.find((l) => l.residence)?.pays;
  const q = vue.requete.trim().toLocaleLowerCase("fr");
  const choisies = [...vue.filtres].filter((f) => f.startsWith("region:")).map((f) => f.slice(7));
  const liste = t.lieux
    .filter((l) => !q || [l.nom, l.pays, regions[l.id]].some((x) => (x ?? "").toLocaleLowerCase("fr").includes(q)))
    .filter((l) => !vue.filtres.has("miens") || l.possessions > 0 || l.residence)
    .filter((l) => !vue.filtres.has("pays") || l.pays === residence)
    .filter((l) => !choisies.length || choisies.includes(regions[l.id]));
  const nom = (a, b) => a.nom.localeCompare(b.nom, "fr");
  if (vue.tri === "km") liste.sort((a, b) => (a.ici ? -1 : a.km) - (b.ici ? -1 : b.km) || nom(a, b));
  else if (vue.tri === "possessions") liste.sort((a, b) => b.possessions - a.possessions || nom(a, b));
  else liste.sort(nom);
  return liste;
}

let pVilles = null; // l'entrée de pile de la liste des villes (la ligne choisie au grand écran)
function listeVilles(d) {
  const liste = villesFiltrees(d);
  if (!liste.length) return `<p class="aide" style="margin:0 4px">Aucune ville ne correspond.</p>`;
  return carte(liste.map((l) => {
    const mien = l.possessions > 0 || l.residence;
    return lignePage({
      id: `ville-${l.id}`, page: "monde.ville", p: { id: l.id }, icone: l.ici ? "location.fill" : mien ? "house.fill" : "mappin",
      teinte: l.ici ? TEINTE.ici : mien ? TEINTE.mien : TEINTE.lieu, titre: l.nom, detail: l.pays,
      valeur: l.ici ? "Tu es ici" : `${nombre(Math.round(l.km))} km`, valeurOr: l.ici,
      choisie: estChoisi(pVilles, "monde.ville", "id", l.id),
    });
  }).join(""));
}

function barreVilles(d) {
  const regions = [...new Set(Object.values(d.regions))].sort();
  const puce = (id, nom) => `<button class="petit ${vue.filtres.has(id) ? "plein" : ""}" data-action="filtrer" data-valeur="${esc(id)}" aria-pressed="${vue.filtres.has(id)}" style="min-height:30px;font-size:13px">${esc(nom)}</button>`;
  const tri = (id, nom) => `<button class="petit ${vue.tri === id ? "plein" : ""}" data-action="trier" data-valeur="${id}" aria-pressed="${vue.tri === id}" style="min-height:30px;font-size:13px">${nom}</button>`;
  return `<div class="rangee entre" style="margin:0 4px"><span class="libelle">Toutes les villes</span><span class="aide" id="compte-villes">${villesFiltrees(d).length} villes</span></div>
    <input class="champ" type="search" placeholder="Ville, pays ou région" value="${esc(vue.requete)}" data-saisie="chercher" aria-label="Chercher une ville" style="font-size:15px;font-weight:500;min-height:46px">
    <div style="display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 20px">
      ${tri("km", "Distance")}${tri("possessions", "Mes biens")}${tri("nom", "Nom")}
      <span style="width:1px;flex:none;background:var(--filet2);margin:4px 2px"></span>
      ${puce("miens", "Où j'ai des biens")}${puce("pays", "Mon pays")}${regions.map((r) => puce(`region:${r}`, r)).join("")}
    </div>`;
}

function majVilles(d, { barre = false } = {}) {
  if (barre) { const b = document.getElementById("barre-villes"); if (b) b.innerHTML = barreVilles(d); }
  const el = document.getElementById("liste-villes");
  if (el) el.innerHTML = listeVilles(d);
  const n = document.getElementById("compte-villes");
  if (n) n.textContent = `${villesFiltrees(d).length} villes`;
}

const pageVilles = {
  titre: "Villes",
  async donnees(ctx) {
    const [m, entreprises] = await Promise.all([ctx.tableau("monde"), balanceGardee(ctx, "entreprises")]);
    return m ? { m, regions: Object.fromEntries((entreprises?.villes ?? []).map((v) => [v.id, v.region])) } : { m: null };
  },
  rendu(d, ctx, p) {
    pVilles = p;
    if (!d?.m) return `${entetePousse("Villes")}<div class="vide">Le monde s'ouvre avec ta première saison.</div>`;
    return `${entetePousse("Villes")}
      <div class="pile"><div class="pile" id="barre-villes">${barreVilles(d)}</div><div id="liste-villes">${listeVilles(d)}</div></div>`;
  },
  actions: {
    chercher(ctx, el, d) { vue.requete = el.value; majVilles(d); },
    trier(ctx, el, d) { vue.tri = el.dataset.valeur; majVilles(d, { barre: true }); },
    filtrer(ctx, el, d) {
      const f = el.dataset.valeur;
      vue.filtres.has(f) ? vue.filtres.delete(f) : vue.filtres.add(f);
      majVilles(d, { barre: true });
    },
  },
};

// MARK: La fiche d'une ville

/** Une ligne de la fiche : titre et détail à gauche ; valeur et comparaison (gain, perte) à droite. */
function ligneFiche(l) {
  const ton = l.ton === "gain" ? "gain" : l.ton === "perte" ? "perte" : "";
  return `<div class="ligne" style="align-items:flex-start" data-ligne="${esc(l.id)}">
    <span style="flex:1;min-width:0"><div class="titre">${esc(l.titre)}</div>${l.detail ? `<div class="detail">${esc(l.detail)}</div>` : ""}</span>
    <span style="text-align:right;flex:none;max-width:52%"><div class="chiffres" style="font-size:15px;letter-spacing:0">${esc(l.valeur)}</div>
      ${l.comparaison ? `<div class="${ton}" style="font-size:12px;font-weight:500;${ton ? "" : "color:var(--texte2)"}">${esc(l.comparaison)}</div>` : ""}</span></div>`;
}

function badgePalier(v) {
  const c = v.palier > v.palierBase ? "var(--gain)" : v.palier < v.palierBase ? "var(--perte)" : "var(--texte2)";
  const fleche = v.palier > v.palierBase ? "↑ " : v.palier < v.palierBase ? "↓ " : "";
  return `<span style="flex:none;padding:5px 10px;border-radius:99px;border:1px solid var(--filet2);background:rgba(255,255,255,.05);font-size:12px;font-weight:600;color:${c}">${fleche}Palier ${v.palier}</span>`;
}

function voisines(t) {
  const temps = (icone, x, nom) => `<span style="display:grid;justify-items:center;gap:2px;min-width:40px;font-size:11px;font-weight:500;color:var(--texte2);${x ? "" : "opacity:.45"}" aria-label="${nom} : ${x ?? "non"}">
    <span style="width:13px;height:13px;display:grid">${sf(icone, 13)}</span><span class="chiffres" style="letter-spacing:0">${esc(x ?? "—")}</span></span>`;
  return t.voisines.map((v) => `<button class="ligne" data-action="ouvrir" data-page="monde.ville" data-p='${esc(JSON.stringify({ id: v.id }))}' style="padding:11px 16px">
      <span style="flex:1;min-width:0"><div class="titre">${esc(v.nom)}</div><div class="detail">${nombre(v.km)} km, ${esc(v.pays)}</div></span>
      <span class="rangee" style="gap:8px;flex:none">${temps("tram.fill", v.train, "Train")}${temps("car.fill", v.voiture, "Voiture")}${temps("airplane", v.avion, "Avion")}</span>
      <span class="chevron">${icones.chevron}</span></button>`).join("");
}

function vieVille(t) {
  const v = t.vie;
  const gens = v.joueurs + v.bots === 0 ? "Personne en vue"
    : [v.joueurs ? `${v.joueurs} joueur${v.joueurs > 1 ? "s" : ""}` : "", v.bots ? `${v.bots} bot${v.bots > 1 ? "s" : ""}` : ""].filter(Boolean).join(", ");
  const lignes = [
    ligne({ titre: esc(v.nomPalier), valeur: `Palier ${v.palier}`, icone: sf("building.2.fill"), teinte: TEINTE.grandir }),
    ligne({ titre: esc(gens), detail: esc(v.presents.join(", ")), icone: sf("person.2.fill"), teinte: TEINTE.equipe }),
    ligne({ titre: "Boîtes", detail: `${v.mesBoites} à toi, ${v.boitesJoueurs} aux autres joueurs${v.mesBiens ? ` ; ${v.mesBiens} bien${v.mesBiens > 1 ? "s" : ""} à toi` : ""}`, icone: sf("storefront.fill"), teinte: "var(--vente)" }),
    ligne({ titre: v.aeroport ? "Un aéroport" : "Pas d'aéroport", detail: v.aeroport ? "Les vols partent d'ici" : "L'avion part d'une ville plus grande", icone: sf("airplane"), teinte: TEINTE.equipe }),
  ];
  if (v.port) {
    const m = v.port.meteo?.[0];
    lignes.push(ligne({ titre: esc(v.port.nom), detail: esc(`${v.port.ferry ? "Port et terminal de ferries" : "Port de plaisance"}, ${v.port.mer}${m?.detail ? ` ; ${m.detail}` : ""}`),
      valeur: m ? `Mer ${esc(m.texte.toLowerCase())}` : "", icone: sf(v.port.ferry ? "ferry.fill" : "sailboat.fill"), teinte: "#4FA3D9" }));
  }
  return `<div>${sectionTitre("La vie de la ville")}${carte(lignes.join(""))}${pied(v.mecene)}</div>`;
}

function devisVille(t) {
  if (t.ici) return "";
  const lignes = t.devis.length ? t.devis.slice(0, 5).map((dv) => `<div class="ligne" style="padding:10px 16px;min-height:0;${dv.refus ? "opacity:.6" : ""}">
      <span style="width:26px;flex:none;display:grid;place-items:center">${sf(dv.icone, 20)}</span>
      <span style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600">${esc(dv.nom)}</div><div class="detail" style="font-size:12px">${esc(dv.refus ?? dv.duree)}</div></span>
      ${dv.refus ? "" : `<span class="valeur chiffres" style="font-size:14px;letter-spacing:0">${montant(dv.cout)}</span>`}</div>`).join("")
    : ligne({ titre: t.enVoyage ? "Tu es en route" : "Aucun moyen d'y aller d'ici", icone: sf("nosign"), teinte: "var(--texte3)" });
  return `<div id="devis-ville">${sectionTitre("Y aller")}${carte(lignes)}${pied(t.enVoyage ? "En voyage : repars une fois arrivé." : "Choisis ton billet dans la feuille du voyage.")}</div>
    ${bouton("Y aller", "voyager", { genre: "teinte", teinte: "var(--equipe)", desactive: t.enVoyage || !t.devis.some((x) => !x.refus) })}`;
}

const pageVille = {
  titre: "Ville",
  async donnees(ctx, p) { return { v: await ctx.tableau("ville", { id: p?.id ?? "" }) }; },
  rendu(d) {
    const t = d?.v;
    if (!t) return `${entetePousse("Ville")}<div class="vide">Cette ville n'est pas sur la carte.</div>`;
    const tete = carte(`<div class="pile" style="gap:6px">
        <div class="rangee" style="gap:8px">${t.drapeau ? `<span style="font-size:22px">${t.drapeau}</span>` : ""}
          <span class="libelle" style="flex:1">${esc(t.pays)}, ${esc(t.region)}</span>${badgePalier(t.vie)}</div>
        <p class="aide" style="margin:0">${t.ici ? `Tu es ici.${t.residence ? " C'est ta ville." : ""}` : `${nombre(Math.round(t.km))} km à vol d'oiseau${t.residence ? ", ta ville" : ""}`}</p>
        ${t.installation ? `<p class="aide" id="ville-installation" style="margin:0;font-weight:600;color:var(--texte)">${esc(t.installation)}</p>` : ""}
        ${t.atout ? `<p style="margin:0;font-size:13px;color:var(--texte2)">${esc(t.atout)}</p>` : ""}</div>`, { pad: true });
    const boutons = carte(
      lignePage({ id: "bouton-chantiers", page: "monde.chantiers", p: { id: t.id }, icone: "hammer.fill", teinte: TEINTE.grandir, titre: "Chantiers",
        detail: t.chantiersOuverts ? `${t.chantiersOuverts} ouvert${t.chantiersOuverts > 1 ? "s" : ""} : investir, voter, candidater` : "Investir dans la ville" })
      + lignePage({ id: "bouton-residences", page: "monde.residences", p: { id: t.id }, icone: "house.fill", teinte: TEINTE.mien, titre: "Résidences à louer",
        detail: `${t.residences} logement${t.residences > 1 ? "s" : ""} ; le bail se signe à l'agence` }));
    return `${entetePousse(t.nom)}
      <div class="pile" id="fiche-ville">
        ${tete}
        <div id="fiscalite">${sectionTitre("Fiscalité")}${carte(t.fiscalite.map(ligneFiche).join(""))}${pied(t.piedFiscalite)}</div>
        <div id="cout-vie">${sectionTitre("Coût de la vie")}${carte(t.coutVie.map(ligneFiche).join(""))}${pied(t.reference ? `Comparé à ${t.reference}.` : "")}</div>
        <div id="voisines">${sectionTitre("Voisines")}${carte(voisines(t))}${pied("Durées de jeu, comme les devis du voyage.")}</div>
        ${vieVille(t)}
        ${boutons}
        ${devisVille(t)}
      </div>`;
  },
  actions: { voyager: (ctx, el, d) => voyagerVers(ctx, d.v.id) },
};

// MARK: Les chantiers d'une ville (RNT-150)

/** Le choix d'affichage de chaque chantier : le montant à investir, la boîte et le pot-de-vin du dossier. */
const choixChantier = { montant: {}, boite: {}, pot: {} };

function carteChantier(t, c) {
  const k = Math.max(0, t.montants.indexOf(choixChantier.montant[c.id] ?? t.montants[0]));
  const m = t.montants[k];
  const refus = c.refusMontants[k];
  const propositions = c.statut === "propose" ? `<div class="pile" style="gap:8px">
      <div style="font-size:13px;font-weight:600">${t.enLigne ? "Vote pour le chantier" : "Choisis le chantier"}</div>
      <div class="rangee" style="gap:8px;align-items:stretch">${c.propositions.map((p) => `<button data-action="choisirChantier" data-rang="${c.rang}" data-type="${esc(p.id)}" data-chantier="${esc(c.id)}" aria-pressed="${p.choisi}"
          style="flex:1;min-height:78px;border-radius:14px;display:grid;justify-items:center;align-content:center;gap:6px;padding:8px 4px;font-size:11px;font-weight:500;text-align:center;
          color:${p.choisi ? "var(--texte)" : "var(--texte2)"};background:${p.choisi ? "rgba(255,255,255,.08)" : "transparent"};border:${p.choisi ? "1.5px solid color-mix(in srgb,var(--or) 70%,transparent)" : "1px solid var(--filet2)"}">
          <span style="width:18px;height:18px;display:grid">${sf(p.icone, 18)}</span>${esc(p.nom)}${p.voix != null ? `<span class="chiffres" style="letter-spacing:0;color:var(--texte2)">${p.voix} voix</span>` : ""}</button>`).join("")}</div>
      ${t.enLigne ? `<p class="legende" style="margin:0">Le chantier qui a le plus de voix au début des travaux est retenu.</p>` : ""}</div>` : "";
  const montants = `<div style="display:flex;gap:6px;overflow-x:auto;scrollbar-width:none">${t.montants.map((x, i) =>
    `<button class="petit ${i === k ? "plein" : ""}" data-action="montantChantier" data-chantier="${esc(c.id)}" data-montant="${x}" aria-pressed="${i === k}" style="min-height:30px;font-size:13px">${montant(x)}</button>`).join("")}</div>`;
  return carte(`<div class="pile" data-chantier="${esc(c.id)}">
      <div class="rangee" style="gap:12px">${pastille(c.icone, TEINTE.grandir)}
        <div style="flex:1;min-width:0"><div style="font-size:16px;font-weight:600">${esc(c.nom)}</div><div class="aide">${esc(c.quand)}</div></div>
        <div style="text-align:right"><div class="chiffres" style="font-size:15px;letter-spacing:0">${montant(c.cout)}</div><div class="aide">à financer</div></div></div>
      <p style="margin:0;font-size:13px;color:var(--texte2)">${esc(c.detail)}</p>
      <div style="position:relative">${rail(c.part, "var(--or)")}<i aria-hidden="true" style="position:absolute;top:-2px;left:calc(${t.partPourPalier * 100}% - 1px);width:2px;height:12px;background:rgba(255,255,255,.6)"></i></div>
      <div class="rangee entre"><span class="aide">${Math.round(c.part * 100)} % financé par les joueurs</span>${c.mesParts ? `<span style="font-size:12px;font-weight:600;color:var(--or)">Tes parts : ${montant(c.mesParts)}</span>` : ""}</div>
      ${propositions}
      ${montants}
      ${bouton(`Investir ${montant(m)}`, "investirChantier", { genre: "teinte", teinte: TEINTE.grandir, donnees: { rang: String(c.rang), montant: String(m) }, desactive: !!refus })}
      ${refus ? `<p class="legende" style="margin:0">${esc(refus)}</p>` : ""}
      <div class="filet"></div>
      ${marche(c)}
    </div>`, { pad: true });
}

function marche(c) {
  const mc = c.marche;
  const tete = `<div class="rangee entre"><span style="font-size:14px;font-weight:600">Marché public</span><span class="chiffres" style="font-size:12px;letter-spacing:0;color:var(--texte2)">${montant(mc.contrat)} pour la boîte</span></div>`;
  if (mc.etat !== "dossier") return `${tete}<p class="${mc.ton === "gain" ? "gain" : "legende"}" style="margin:0;font-size:13px">${esc(mc.texte ?? "")}</p>`;
  const boite = mc.boites.find((b) => b.id === choixChantier.boite[c.id]) ?? mc.boites[0];
  const pot = choixChantier.pot[c.id] ?? 0;
  const refus = boite?.refus[pot];
  const pilule = (texte, action, valeur, choisi, teinte = "") => `<button class="petit ${choisi ? "plein" : ""}" data-action="${action}" data-chantier="${esc(c.id)}" data-valeur="${valeur}" aria-pressed="${choisi}" style="min-height:30px;font-size:13px;${teinte}">${esc(texte)}</button>`;
  return `${tete}
    ${mc.boites.length > 1 ? `<div class="choix">${mc.boites.map((b) => pilule(b.nom, "boiteDossier", b.id, b.id === boite?.id)).join("")}</div>` : `<p class="aide" style="margin:0">Avec ${esc(boite?.nom ?? "")}</p>`}
    <div class="choix">${mc.pots.map((p) => pilule(p.titre, "potDossier", p.id, p.id === pot)).join("")}</div>
    <p style="margin:0;font-size:12px;color:${pot ? "var(--alerte)" : "var(--texte2)"}">${esc(mc.pots[pot]?.texte ?? "")}</p>
    <p class="legende" style="margin:0">Note du dossier : ${boite?.notes[pot] ?? 0} sur 100.</p>
    ${refus ? `<p class="legende alerte" style="margin:0">${esc(refus)}</p>` : ""}
    ${bouton("Déposer le dossier", "candidater", { genre: "teinte", teinte: pot ? "var(--c-danger)" : "var(--vente)", donnees: { rang: String(c.rang), boite: String(boite?.id ?? -1), pot: String(pot) }, desactive: !boite || !!refus })}`;
}

const pageChantiers = {
  titre: "Chantiers",
  async donnees(ctx, p) { return { c: await ctx.tableau("chantiersVille", { id: p?.id ?? "" }) }; },
  rendu(d) {
    const t = d?.c;
    if (!t) return `${entetePousse("Chantiers")}<div class="vide">Cette ville n'a pas de chantier.</div>`;
    const finis = t.finis.length ? carte(t.finis.map((f) => ligne({ titre: esc(f.nom), valeur: esc(f.texte), couleurValeur: f.gain ? "gain" : "", icone: sf(f.icone), teinte: "var(--texte3)" })).join("")) : "";
    return `${entetePousse(`Chantiers ${de(t.villeNom)}`)}
      <div class="pile" id="page-chantiers">
        <div class="rangee entre" style="margin:0 4px"><span class="aide" style="flex:1">${esc(t.mecene)}</span>${badgePalier({ palier: t.palier, palierBase: t.palierBase })}</div>
        ${t.ouverts.map((c) => carteChantier(t, c)).join("")}
        ${t.ouverts.length ? "" : `<p class="aide" style="margin:0 4px">Pas de chantier ouvert pour l'instant.</p>`}
        ${finis ? `<div>${sectionTitre("Inaugurés")}${finis}</div>` : ""}
        ${pied(t.pied)}
      </div>`;
  },
  actions: {
    montantChantier(ctx, el) { choixChantier.montant[el.dataset.chantier] = Number(el.dataset.montant); ctx.redessiner(); },
    boiteDossier(ctx, el) { choixChantier.boite[el.dataset.chantier] = Number(el.dataset.valeur); ctx.redessiner(); },
    potDossier(ctx, el) { choixChantier.pot[el.dataset.chantier] = Number(el.dataset.valeur); ctx.redessiner(); },
    investirChantier: (ctx, el, d) => ctx.commande("villes.investir", { ville: d.c.ville, rang: Number(el.dataset.rang), montant: Number(el.dataset.montant) },
      { succes: `${montant(Number(el.dataset.montant))} investis` }),
    async choisirChantier(ctx, el, d) {
      // En ligne, c'est un vote (le serveur arrête le chantier) ; en solo, ton choix.
      if (mondeEnLigne.code) {
        try { await voterChantier(ctx, el.dataset.chantier, el.dataset.type); } catch (e) { ctx.toast(e.message, "refus"); }
        return ctx.rafraichir();
      }
      return ctx.commande("villes.chantier", { ville: d.c.ville, rang: Number(el.dataset.rang), type: el.dataset.type });
    },
    candidater: (ctx, el, d) => ctx.commande("villes.candidater", { ville: d.c.ville, rang: Number(el.dataset.rang), boite: Number(el.dataset.boite), pot: Number(el.dataset.pot) },
      { succes: "Dossier déposé" }),
  },
};

// MARK: Les résidences à louer

const pageResidences = {
  titre: "Résidences",
  async donnees(ctx, p) { return { r: await ctx.tableau("residences", { id: p?.id ?? "" }) }; },
  rendu(d) {
    const t = d?.r;
    if (!t) return `${entetePousse("Résidences")}<div class="vide">Cette ville n'a pas de logement à louer.</div>`;
    const message = carte(`<div class="pile" style="gap:10px">
        <div class="rangee" style="gap:10px;align-items:flex-start;font-size:14px;font-weight:600;${t.peutLouer ? "color:var(--gain)" : ""}" id="message-residences">
          <span style="width:18px;height:18px;flex:none;display:grid">${sf(t.peutLouer ? "checkmark.seal.fill" : "house.and.flag.fill", 18)}</span><span>${esc(t.message)}</span></div>
        ${t.logementActuel ? `<p class="aide" style="margin:0">Ton logement : ${esc(t.logementActuel)}.</p>` : ""}
        ${t.allerAgence ? `<div>${petit("Aller à l'agence", "allerAgence", { plein: true })}</div>` : ""}</div>`, { pad: true });
    const liste = t.residences.map((r) => carte(`<div class="rangee" style="align-items:flex-start;gap:12px" data-residence="${esc(r.id)}">
        <span style="width:84px;height:64px;flex:none;border-radius:12px;display:grid;place-items:center;color:rgba(255,255,255,.85);background:linear-gradient(160deg,#2a2c33,#16171b);border:1px solid var(--filet)">${sf(r.icone, 28)}</span>
        <div style="flex:1;min-width:0" class="pile">
          <div style="font-size:15px;font-weight:600">${esc(r.nom)}</div>
          <div class="aide" style="margin-top:-8px">${esc(r.typeNom)}, ${montant(r.loyer)} par semaine</div>
          <div>${r.actuelle ? `<span style="font-size:13px;font-weight:600;color:var(--or)">Ton logement</span>`
            : petit("Louer", "louer", { plein: t.peutLouer, donnees: { bien: r.id, nom: r.nom } })}</div>
        </div></div>`, { attrs: 'style="padding:12px"' })).join("");
    return `${entetePousse(`Résidences à ${t.villeNom}`)}
      <div class="pile" id="page-residences">${message}${liste || `<p class="aide" style="margin:0 4px">Aucun logement à louer ici pour l'instant.</p>`}</div>`;
  },
  actions: {
    // Visible de loin : louer à distance, le moteur dit où signer.
    louer: (ctx, el) => ctx.decider("monde", { louerLogement: { bien: el.dataset.bien } }, { succes: `Tu loues ${el.dataset.nom}` }),
    allerAgence(ctx, el, d) {
      const p = d.r.allerAgence?.params;
      if (!p) return;
      return ctx.decider("monde", { allerA: { lieu: p.lieu, moyen: p.moyen, ...(p.vehicule != null ? { vehicule: Number(p.vehicule) } : {}) } },
        { succes: "En route vers l'agence immobilière" });
    },
  },
};

export const pages = {
  // Lot D : au grand écran, les lieux et les villes gardent leur liste à gauche, la fiche à droite.
  "monde.lieux": listeEtDetail("monde.lieux", pageLieux, { "monde.lieu": pageLieu }, {
    vide: () => videDetail("Choisis un lieu", "Ce qu'on y fait et le chemin pour y aller s'ouvrent ici."),
  }),
  "monde.lieu": pageLieu,
  "monde.villes": listeEtDetail("monde.villes", pageVilles, { "monde.ville": pageVille }, {
    vide: () => videDetail("Choisis une ville", "Sa fiscalité, son coût de la vie, ses voisines et le voyage s'ouvrent ici, sans quitter la liste."),
  }),
  "monde.ville": pageVille,
  "monde.chantiers": pageChantiers,
  "monde.residences": pageResidences,
};
