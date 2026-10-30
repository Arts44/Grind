// ══════════════════════════════════════════════════════════════════════
//  Le début d'une saison (ChoixProfil, EcranAccueil.swift ; D205).
//
//  Où commencer (solo, monde privé, monde public), puis le profil de
//  départ, la ville où l'on vit, la banque. Dans un monde en ligne, la
//  saison se joue dans ce monde (son code, sa graine, son jour de départ) ;
//  un monde aux départs égaux impose son profil (RNT-147).
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js";
import { entetePousse, carte, bouton, segment, icones } from "../ui.js";
import { SYMBOLES } from "./vie.js";
import { ONGLETS } from "../barre.js";
import * as L from "../enligne.js";
import { appeler } from "../serveur.js";

const s = { cle: null, etape: "ou", choisi: null, ville: null, banque: null, recherche: "", region: "" };
const PALIERS = ["Modeste", "Confortable", "Aisé", "Privilégié"];
const TEINTE_PALIER = ["var(--gain)", "var(--texte2)", "var(--alerte)", "var(--perte)"];
const filet = '<div class="filet"></div>';

/** Repartir de zéro pour chaque nouvelle ouverture de la page. */
function reinitialiser(cle, monde) {
  Object.assign(s, { cle, etape: monde ? "profil" : "ou", choisi: null, ville: null, banque: null, recherche: "", region: "" });
}

const radio = (oui) => `<span class="el-radio ${oui ? "oui" : ""}" aria-hidden="true"></span>`;

export const pages = {
  saison: {
    titre: "Nouvelle saison",
    css: "enligne", // RNT-210 : les fiches du départ (el-profil, el-ville, el-ou), dans css/pages/enligne.css
    sansBarre: (ctx) => !ctx.etat.jeu?.saison || ctx.etat.jeu?.terminee,
    async donnees(ctx, p) {
      const cle = JSON.stringify(p ?? {});
      if (s.cle !== cle) reinitialiser(cle, p?.monde);
      const [pr, entreprises, monde, apercu] = await Promise.all([
        ctx.jouer("profils", {}, { silencieux: true }), ctx.balance("entreprises"), ctx.balance("monde"), ctx.tableau("apercuSaison"),
      ]);
      // RNT-147 : un monde aux départs égaux impose son profil.
      let impose = null;
      if (p?.monde) {
        const o = await appeler("monde_options", { p_code: p.monde.code }).catch(() => null);
        impose = (o?.futures ?? o?.options)?.profilImpose ?? null;
      }
      const profils = pr?.profils ?? [];
      if (impose && profils.some((x) => x.id === impose)) s.choisi = impose;
      if (!s.choisi) s.choisi = profils.find((x) => x.debloque)?.id ?? null;
      const banques = s.etape === "banque" ? await ctx.jouer("saison.banques", { ville: s.ville }, { silencieux: true }) : null;
      const parties = (await ctx.jouer("parties", {}, { silencieux: true }))?.parties ?? [];
      return { profils, niveau: pr?.niveau ?? 1, villes: entreprises?.villes ?? [], pays: monde?.pays ?? [], apercu, impose, banques, parties };
    },
    rendu(d, ctx, p) {
      const titre = { ou: "Où commencer ?", profil: "Ton profil de départ", ville: "Où vis-tu ?", banque: "Ta banque" }[s.etape];
      let corps = "";
      if (s.etape === "ou") corps = ou(d);
      else if (s.etape === "profil") corps = profils(d, p);
      else if (s.etape === "ville") corps = villes(d);
      else corps = banques(d);
      const nomVille = d.villes.find((v) => v.id === s.ville)?.nom;
      const principal = s.etape === "ou" ? ""
        : bouton(s.etape === "banque" ? (nomVille ? `Commencer à ${esc(nomVille)}` : "Commencer") : s.etape === "ville" && !s.ville ? "Choisis ta ville" : "Continuer",
          "etapeSuivante", { desactive: (s.etape === "ville" && !s.ville) || (s.etape === "profil" && !d.profils.find((x) => x.id === s.choisi && (x.debloque || d.impose))) });
      const peutRevenir = s.etape !== "ou" && !(s.etape === "profil" && p?.monde) || ctx.etat.piles[ctx.etat.onglet].length > 1;
      return `${entetePousse(titre)}
        <div class="pile" style="gap:16px">${corps}</div>
        ${principal || peutRevenir ? `<div class="bas-colle pile" style="gap:4px">${principal}${peutRevenir ? bouton("Retour", "etapePrecedente", { genre: "discret" }) : ""}</div>` : ""}`;
    },
    actions: {
      departOu(ctx, b) {
        const emp = b.dataset.emplacement;
        if (emp === "locale") { s.etape = "profil"; return ctx.rafraichir(); }
        // D215 : un monde public se rejoint ; un monde privé se rejoint avec un code, ou se crée.
        if (emp === "publique") return ctx.ouvrir("rejoindreMonde", { n: Date.now(), mode: "publics" });
        ctx.feuille({ titre: "Monde privé", contenu: `<div class="pile" style="gap:12px">
          <p class="aide">Entre amis, jusqu'à cinq : un code à partager.</p>
          ${bouton("Rejoindre avec un code", "privePar", { donnees: { page: "rejoindreMonde" } })}
          ${bouton("Créer un monde", "privePar", { genre: "secondaire", donnees: { page: "creerMonde" } })}</div>`, actions: {
          privePar(c, x) { c.fermerFeuille(); c.ouvrir(x.dataset.page, { n: Date.now(), mode: "code" }); },
        } });
      },
      profilDepart(ctx, b) { s.choisi = b.dataset.id; ctx.redessiner(); },
      choisirVille(ctx, b) { s.ville = b.dataset.ville; ctx.redessiner(); },
      choisirBanque(ctx, b) { s.banque = b.dataset.id; ctx.redessiner(); },
      chercherVille(ctx, el) {
        s.recherche = el.value;
        const q = s.recherche.toLowerCase();
        document.querySelectorAll("[data-ville]").forEach((x) => { x.hidden = q && !x.dataset.cherche.includes(q); });
      },
      regionVille(ctx, b) { s.region = s.region === b.dataset.valeur ? "" : b.dataset.valeur; ctx.redessiner(); },
      async etapePrecedente(ctx, b, d, p) {
        if (s.etape === "banque") s.etape = "ville";
        else if (s.etape === "ville") s.etape = "profil";
        else if (s.etape === "profil" && !p?.monde) s.etape = "ou";
        else return ctx.retour();
        ctx.rafraichir();
      },
      async etapeSuivante(ctx, b, d, p) {
        if (s.etape === "profil") { s.etape = "ville"; return ctx.rafraichir(); }
        if (s.etape === "ville") { s.etape = "banque"; s.banque = null; return ctx.rafraichir(); }
        // La banque d'office (celle qu'on aurait sans choisir) : on ne la demande pas, comme avant.
        const liste = d.banques?.banques ?? [];
        const banque = s.banque ?? (liste.some((x) => x.id === d.banques?.dOffice) ? null : liste[0]?.id ?? null);
        const remplacer = d.parties.some((x) => x.emplacement === (p?.monde ? (p.monde.prive ? "privee" : "publique") : "locale") && !x.terminee);
        const r = await ctx.jouer("saison.commencer", {
          profil: s.choisi, ville: s.ville, ...(banque && banque !== d.banques?.dOffice ? { banque } : {}), remplacer,
          ...(p?.monde ? { monde: p.monde, joueur: (await import("../serveur.js")).identite.joueur, impose: !!d.impose } : {}),
        });
        if (!r) return;
        if (r.refus) return ctx.toast(r.refus, "refus");
        await ctx.jouer("etat", {}, { silencieux: true });
        const nom = d.profils.find((x) => x.id === s.choisi)?.nom ?? "";
        s.cle = null;
        ctx.etat.piles = Object.fromEntries(ONGLETS.map((o) => [o.id, [{ id: o.id, p: {} }]]));
        ctx.etat.onglet = "accueil";
        await ctx.sauvegarder();
        ctx.toast(p?.monde ? `Saison lancée dans « ${p.monde.nom} »` : `Saison lancée : ${nom}`, "gain");
        await ctx.rafraichir();
        if (p?.monde) L.synchroniser(ctx, { force: true }).then(() => ctx.rafraichir());
      },
    },
  },
};

/** Solo, monde privé, monde public (ChoixProfil.choixPartie). */
function ou(d) {
  const sortes = [
    ["locale", "Solo", "Toi seul, à ton rythme.", icones.personne, "var(--grandir)"],
    ["privee", "Monde privé", "Entre amis, jusqu'à cinq : un code à partager.", icones.amis, "var(--equipe)"],
    ["publique", "Monde public", "Avec des inconnus, dix par monde, à tout moment de la saison.", SYMBOLES.globe, "var(--image)"],
  ];
  return `<p class="aide">Une partie de chaque sorte peut tourner en même temps ; chaque session de focus les paie toutes.</p>
    ${sortes.map(([emp, nom, texte, ic, t]) => {
      const x = d.parties.find((y) => y.emplacement === emp && !y.terminee);
      return `<button class="carte el-ou" data-action="departOu" data-emplacement="${emp}">
        <span class="pastille" style="--c:${t};width:44px;height:44px;border-radius:12px">${ic}</span>
        <span style="flex:1;min-width:0;text-align:left"><span style="display:block;font-size:17px;font-weight:600">${nom}</span><span class="aide" style="display:block">${texte}</span>
          ${x ? `<span class="alerte" style="display:block;font-size:12px;font-weight:600;margin-top:3px">En cours : ${esc(x.profilNom)}, jour ${x.jour}${emp === "locale" ? " ; recommencer l'abandonne" : ""}</span>` : ""}</span>
        <span class="chevron" style="width:14px;color:var(--texte3)">${icones.chevron}</span></button>`;
    }).join("")}`;
}

/** RNT-147 : les profils en quatre paliers ; ceux au-delà de ton niveau restent fermés ; un monde aux départs égaux n'en montre qu'un. */
function profils(d, p) {
  const liste = d.impose ? d.profils.filter((x) => x.id === d.impose) : d.profils;
  const tete = p?.monde ? `<p class="aide" style="text-align:center">Monde en ligne « ${esc(p.monde.nom)} »</p>`
    : d.apercu ? `<p class="aide" style="text-align:center">${esc(d.apercu.nom)}, ${esc(d.apercu.dates)}${d.apercu.aBattre != null ? `<br>Score à battre : ${montant(d.apercu.aBattre)}. Seuls tes badges et tes cosmétiques te suivent.` : ""}</p>` : "";
  const groupes = [1, 2, 3, 4].map((n) => {
    const ps = liste.filter((x) => x.palierEffectif === n);
    if (!ps.length) return "";
    return `<div class="libelle" style="color:${TEINTE_PALIER[n - 1]};margin-top:4px">${esc(ps[0].nomPalier ?? PALIERS[n - 1])}</div>
      ${carte(ps.map((x, k) => {
        const ferme = !d.impose && !x.debloque, choisi = s.choisi === x.id;
        return `${k ? filet : ""}<button class="el-profil" data-action="profilDepart" data-id="${esc(x.id)}" ${ferme ? "disabled" : ""} aria-pressed="${choisi}">
          ${ferme ? `<span style="width:22px;flex:none;display:grid;color:var(--texte3)">${icones.verrou}</span>` : radio(choisi)}
          <span style="flex:1;min-width:0;text-align:left"><span class="rangee entre" style="gap:8px"><span class="libelle">${esc(x.nom)}</span>
            ${ferme ? `<span class="puce">Niveau ${x.niveauEffectif}</span>` : `<span class="t2 chiffres" style="font-size:13px;letter-spacing:0">${montant(x.capitalCentimes)}</span>`}</span>
            <span class="aide" style="display:block;margin-top:2px">${esc(x.description)}</span>
            ${choisi && !ferme ? `<span style="display:block;margin-top:6px">${(x.atouts ?? []).map((a) => `<span class="atout">${esc(a)}</span>`).join("")}${(x.defauts ?? []).map((a) => `<span class="defaut">${esc(a)}</span>`).join("")}</span>` : ""}</span>
        </button>`;
      }).join(""))}`;
  }).join("");
  return `${tete}${d.impose ? `<p class="or" style="font-size:13px;font-weight:500">Départs égaux : le créateur du monde donne ce profil à tout le monde.</p>` : ""}${groupes}`;
}

/** Les villes du jeu, regroupées par pays, la Belgique d'abord (ChoixProfil.villes). */
function villes(d) {
  const regions = [...new Set(d.villes.map((v) => v.region))].sort();
  const liste = d.villes.filter((v) => !s.region || v.region === s.region);
  const pays = d.pays.filter((p) => liste.some((v) => v.codePays === p.code))
    .sort((a, b) => (a.code === "BE" ? -1 : b.code === "BE" ? 1 : a.nom.localeCompare(b.nom, "fr")));
  return `<p class="aide" style="text-align:center">Ton pays décide des banques qui t'ouvrent un compte et du rayon local en bourse.</p>
    <input class="champ" style="font-weight:500" placeholder="Ville ou pays" value="${esc(s.recherche)}" data-saisie="chercherVille" aria-label="Chercher une ville">
    <div class="choix">${regions.map((r) => `<button class="petit ${s.region === r ? "plein" : ""}" data-action="regionVille" data-valeur="${esc(r)}" aria-pressed="${s.region === r}">${esc(r)}</button>`).join("")}</div>
    ${pays.map((p) => carte(`<div class="rangee" style="gap:8px;padding:12px 16px 6px"><span style="font-size:20px">${p.drapeau ?? ""}</span><span class="libelle">${esc(p.nom)}</span></div>
      ${liste.filter((v) => v.codePays === p.code).sort((a, b) => a.nom.localeCompare(b.nom, "fr")).map((v) => {
        const cherche = `${v.nom} ${p.nom} ${v.region}`.toLowerCase();
        const q = s.recherche.toLowerCase();
        return `<button class="el-ville" data-action="choisirVille" data-ville="${esc(v.id)}" data-cherche="${esc(cherche)}" ${q && !cherche.includes(q) ? "hidden" : ""} aria-pressed="${s.ville === v.id}">
          ${radio(s.ville === v.id)}<span style="font-size:15px;font-weight:500">${esc(v.nom)}</span></button>`;
      }).join("")}<div style="height:6px"></div>`)).join("")}`;
}

/** Les banques que la ville de départ ouvre (ChoixProfil.banques). */
function banques(d) {
  const liste = d.banques?.banques ?? [];
  const choisie = s.banque ?? (liste.some((x) => x.id === d.banques?.dOffice) ? d.banques.dOffice : liste[0]?.id);
  return `<p class="aide" style="text-align:center">Ton compte courant et ton épargne y seront ouverts. Tu pourras en changer plus tard.</p>
    ${carte(liste.map((b, k) => `${k ? filet : ""}<button class="el-profil" data-action="choisirBanque" data-id="${esc(b.id)}" aria-pressed="${choisie === b.id}">
      ${radio(choisie === b.id)}<span style="flex:1;min-width:0;text-align:left"><span class="libelle">${esc(b.drapeau ?? "")} ${esc(b.nom)}</span>
      <span class="aide" style="display:block">${esc(b.description)}</span></span></button>`).join(""))}`;
}
