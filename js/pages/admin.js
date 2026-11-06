// ══════════════════════════════════════════════════════════════════════
//  La console d'administration du web (ConsoleAdmin de l'iPhone, RNT-293, D279).
//
//  Réglages › Avancé › Administration. Le code se tape à l'entrée ; il ne
//  vit qu'en mémoire, le temps de la page (jamais dans le navigateur), et
//  part avec chaque appel admin_* que le serveur vérifie.
//  Cinq sections : Joueur (recherche, fiche, corrections, catalogue),
//  Monde (règles, joueurs, parloir), Économie (recalcul du crédit, échanges,
//  enchères), Bots, Serveur (version minimale, titres, journal).
//  Ce qui touche une partie est une correction (admin_corriger), appliquée
//  par le moteur du joueur à sa prochaine synchro ; le web ne réécrit rien.
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "../format.js";
import { entetePousse, carte, segment, petit, bouton, vide, champEuros, lireEuros, confirmer, interrupteur } from "../ui.js";
import * as serveur from "../serveur.js";

let code = null; // en mémoire seulement
let section = "joueur";
let bandeau = null; // [texte, ok]
const cache = {};
let recherche = "";
let joueur = null; // { id, pseudo, … } d'admin_comptes
let partie = 0;
let familleOffre = "montres", choisiOffre = null, texteOffre = "";
let familleCompte = "cartes", choisiCompte = null, texteCompte = "";
let monde = "";

const SECTIONS = [["joueur", "Joueur"], ["monde", "Monde"], ["economie", "Économie"], ["bots", "Bots"], ["serveur", "Serveur"]];
const OFFRES = ["montres", "vehicules", "bateaux", "biens", "secteurs", "titres", "permis"];
const DU_COMPTE = ["cartes", "cosmetiques", "titresProfil"];
const BOOLEENS = [["combines", "Combines"], ["chantage", "Chantage"], ["inspection", "Inspection"], ["inspecteAverti", "L'inspecté est averti"],
  ["voyages", "Voyages"], ["casino", "Casino"], ["prisons", "Prisons"], ["controlePresence", "Contrôle de présence"]];
const DUREES = [["", "Celle du jeu"], ["4s", "4 semaines"], ["8s", "8 semaines"], ["13s", "13 semaines"], ["trimestre", "Fin du trimestre"], ["saison", "Changement de saison"]];

const admin = (f, corps = {}) => serveur.appeler(f, { p_code: code, ...corps });
const ok = (texte) => { bandeau = [texte, true]; };
const refus = (e) => { bandeau = [e?.message ?? String(e), false]; };
const date = (d) => (d ? new Date(d).toLocaleString("fr-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "jamais");

/** Une action qui appelle le serveur, puis relit la page. */
async function agir(ctx, succes, f, oublier = []) {
  try { await f(); ok(succes); } catch (e) { refus(e); }
  for (const k of oublier) delete cache[k];
  await ctx.rafraichir();
}

async function catalogue(ctx) {
  cache.catalogue ??= (await ctx.jouer("admin.catalogue", {}))?.familles ?? [];
  return cache.catalogue;
}

function articles(cat, famille, texte, limite = 8) {
  const plier = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const mots = plier(texte).split(/\s+/).filter(Boolean);
  const l = cat.find((f) => f.id === famille)?.articles ?? [];
  return l.filter((a) => mots.every((m) => plier(`${a.nom} ${a.detail} ${a.id}`).includes(m))).slice(0, limite);
}

// MARK: Données

async function donnees(ctx) {
  if (!code) return { verrou: true };
  const d = { cat: await catalogue(ctx) };
  if (section === "joueur") {
    cache.comptes ??= await admin("admin_comptes");
    d.comptes = cache.comptes;
    if (joueur) {
      const cle = `fiche:${joueur.id}`;
      if (!cache[cle]) {
        const s = await admin("admin_sauvegarde", { p_compte: joueur.id });
        cache[cle] = { ...(await ctx.jouer("admin.inspecter", { sauvegarde: s?.donnees ?? null })), maj: s?.maj ?? null };
      }
      d.fiche = cache[cle];
    }
  } else if (section === "serveur") {
    cache.version ??= await admin("admin_version_minimale");
    cache.titres ??= await admin("admin_titres");
    cache.journal ??= await admin("admin_journal");
    Object.assign(d, { version: cache.version, titres: cache.titres, journal: cache.journal });
  } else {
    cache.mondes ??= await admin("admin_mondes");
    d.mondes = cache.mondes;
    if (monde) {
      const cle = `${section}:${monde}`;
      if (!cache[cle]) {
        const p = { p_monde: monde };
        if (section === "monde") cache[cle] = { options: await admin("admin_monde_options", p), visites: await admin("admin_visites", p) };
        if (section === "economie") cache[cle] = { echanges: await admin("admin_echanges", p), encheres: await admin("admin_encheres", p) };
        if (section === "bots") cache[cle] = { bots: await admin("admin_bots", p) };
      }
      Object.assign(d, cache[cle]);
    }
  }
  return d;
}

// MARK: Rendu

const bloc = (titre, contenu) => `<section class="adm-bloc"><h2 class="libelle">${esc(titre)}</h2>${carte(contenu, { pad: true, classe: "adm-carte" })}</section>`;
const ligneAdm = (titre, detail, droite = "") => `<div class="adm-ligne"><span class="adm-texte"><span class="adm-titre">${titre}</span>${detail ? `<span class="adm-detail">${detail}</span>` : ""}</span>${droite ? `<span class="adm-actions">${droite}</span>` : ""}</div>`;
const choixMonde = (d) => `<select class="champ" id="adm-monde" data-saisie="choisirMonde" aria-label="Monde">
  <option value="">Choisir un monde</option>${(d.mondes ?? []).map((m) => `<option value="${esc(m.code)}" ${m.code === monde ? "selected" : ""}>${esc(m.nom)} (${esc(m.code)})</option>`).join("")}</select>`;

function verrou() {
  return `${entetePousse("Administration")}<div class="adm-page adm-verrou">
    <p class="aide">Réservée au développeur.</p>
    <input class="champ" id="adm-code" type="password" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="Code" placeholder="Code">
    ${bouton("Entrer", "entrer")}
    ${bandeau && !bandeau[1] ? `<p class="adm-refus">${esc(bandeau[0])}</p>` : ""}
  </div>`;
}

function resultatsJoueurs(comptes) {
  const r = recherche.trim().toLowerCase();
  const l = (comptes ?? []).filter((c) => !r || c.pseudo.toLowerCase().includes(r)).slice(0, 40);
  if (!l.length) return vide("Aucun joueur.");
  return l.map((c) => `<button class="adm-ligne adm-choix" data-action="choisirJoueur" data-id="${esc(c.id)}">
    <span class="adm-texte"><span class="adm-titre">${esc(c.pseudo)}</span><span class="adm-detail">Vu ${esc(date(c.vu))}${c.mondes?.length ? `, ${esc(c.mondes.map((m) => m.nom).join(", "))}` : ""}</span></span>
    ${c.enAttente ? `<span class="adm-pastille">${c.enAttente}</span>` : ""}</button>`).join("");
}

function resultatsCatalogue(cat, famille, texte, action) {
  const l = articles(cat, famille, texte);
  return l.length ? l.map((a) => `<button class="adm-ligne adm-choix" data-action="${action}" data-id="${esc(a.id)}">
    <span class="adm-texte"><span class="adm-titre">${esc(a.nom)}</span><span class="adm-detail">${esc(a.prix != null ? montant(a.prix) : a.detail)}</span></span></button>`).join("") : vide("Rien ne correspond.");
}

function choixCatalogue(cat, familles, famille, choisi, texte, ids) {
  const nom = (f) => cat.find((x) => x.id === f)?.nom ?? f;
  return `<select class="champ" data-saisie="${ids.famille}" aria-label="Famille">${familles.map((f) => `<option value="${f}" ${f === famille ? "selected" : ""}>${esc(nom(f))}</option>`).join("")}</select>
    ${choisi ? ligneAdm(esc(choisi.nom), esc(choisi.prix != null ? montant(choisi.prix) : choisi.detail), petit("Changer", ids.changer))
      : `<input class="champ" id="${ids.champ}" data-saisie="${ids.saisie}" autocomplete="off" placeholder="Chercher dans le catalogue" value="${esc(texte)}">
         <div id="${ids.resultats}" class="adm-resultats">${resultatsCatalogue(cat, famille, texte, ids.choisir)}</div>`}`;
}

function fiche(d) {
  const f = d.fiche;
  if (!f) return "";
  const parties = f.parties ?? [];
  const p = parties[Math.min(partie, parties.length - 1)];
  let h = bloc(joueur.pseudo, `${ligneAdm("Dernière sauvegarde", esc(date(f.maj)))}${ligneAdm("Carte de fortune", `palier ${f.palierFortune ?? 0}`)}
    ${parties.length > 1 ? segment(parties.map((x, i) => [String(i), x.nom]), String(partie), "choisirPartie") : ""}
    ${p ? `${ligneAdm(esc(`${p.nom}, ${p.profil}`), esc(`Jour ${p.jour} sur ${p.duree}${p.terminee ? ", terminée" : ""}${p.testee ? ", hors record" : ""}`))}
      ${ligneAdm("Patrimoine", montant(p.patrimoine))}${ligneAdm("Compte courant", montant(p.tresorerie))}` : vide("Aucune partie.")}
    ${petit("Choisir un autre joueur", "oublierJoueur")}`);
  if (p) {
    h += bloc("Annonce", `${interrupteur({ titre: "Annonce sous la cloche", actif: cache.visible !== false, action: "basculerVisible" })}`);
    h += bloc("Argent", `<select class="champ" id="adm-cible" aria-label="Compte"><option value="principal">Compte courant</option><option value="liquide">Liquide</option><option value="sale">Argent sale</option></select>
      ${champEuros("adm-montant", { etiquette: "Montant en euros" })}
      ${interrupteur({ titre: "Remboursement d'une erreur", detail: "La saison continue de compter", actif: !!cache.remboursement, action: "basculerRemboursement" })}
      <div class="adm-rangee">${petit("Ajouter", "argent", { plein: true, donnees: { signe: 1 } })}${petit("Retirer", "argent", { donnees: { signe: -1 } })}</div>`);
    const pr = p.prison ?? {};
    h += bloc("Prison", `${pr.enPrison ? `${ligneAdm("Sortie prévue", `jour ${pr.jourSortie}`)}${ligneAdm("Caution", montant(pr.caution))}
        <div class="adm-rangee">${petit("Libérer", "corriger", { plein: true, donnees: { c: { type: "prison_liberer" } } })}${petit("Sous caution", "corriger", { donnees: { c: { type: "prison_caution" } } })}</div>`
      : `<p class="aide">${pr.conditionnelle != null ? `Libre, en conditionnelle jusqu'au jour ${pr.conditionnelle + 1}.` : "Libre."}</p>`}
      <label class="etiquette" for="adm-peine">Peine, en jours à partir d'aujourd'hui (0 : libre)</label>
      <input class="champ" id="adm-peine" inputmode="numeric" autocomplete="off" value="0">
      ${petit("Régler la peine", "peine")}
      ${(p.casier ?? []).map((c) => ligneAdm(esc(c.motif), esc(`${montant(c.amende)}, ${c.points} pt`), `${petit("Retirer et rembourser", "corriger", { donnees: { c: { type: "casier_retirer", id: String(c.id), valeur: 1 } } })}`)).join("")}
      ${(p.casier ?? []).length ? petit("Effacer le casier", "corriger", { donnees: { c: { type: "casier_vider" }, confirmer: "Effacer tout le casier" } }) : ""}`);
    const extra = familleOffre === "titres" ? champEuros("adm-mise", { etiquette: "Mise offerte en euros" })
      : familleOffre === "secteurs" ? `<select class="champ" id="adm-ville" aria-label="Ville"><option value="">Choisir une ville</option>${(d.cat.find((x) => x.id === "villes")?.articles ?? []).map((v) => `<option value="${esc(v.id)}">${esc(v.nom)}</option>`).join("")}</select>
          <input class="champ" id="adm-nom" autocomplete="off" placeholder="Nom de la boîte">`
      : familleOffre === "biens" ? `<label class="adm-coche"><input type="checkbox" id="adm-habite"> Il y habite (logement à soi)</label>` : "";
    h += bloc("Offrir", `${choixCatalogue(d.cat, OFFRES, familleOffre, choisiOffre, texteOffre, { famille: "familleOffre", changer: "changerOffre", champ: "adm-cat", saisie: "chercherOffre", resultats: "adm-cat-res", choisir: "choisirOffre" })}
      ${choisiOffre ? `${extra}${petit(`Offrir : ${esc(choisiOffre.nom)}`, "offrir", { plein: true })}` : ""}`);
    h += bloc("Ce qu'il détient", `${(p.inventaire ?? []).length ? p.inventaire.map((l) => ligneAdm(esc(l.nom), esc(l.detail),
        petit("Retirer", "corriger", { donnees: { c: l.retrait, confirmer: `Retirer ${l.nom}` } }))).join("") : vide("Rien de détenu.")}
      <p class="aide">Retirer revend à 0 € : rien ne revient au joueur, sauf la caisse d'une boîte.</p>`);
  }
  h += bloc("Compte : cartes, cosmétiques, titres", `${choixCatalogue(d.cat, DU_COMPTE, familleCompte, choisiCompte, texteCompte, { famille: "familleCompte", changer: "changerCompte", champ: "adm-cat2", saisie: "chercherCompte", resultats: "adm-cat2-res", choisir: "choisirCompte" })}
    ${choisiCompte ? `<div class="adm-rangee">${petit("Offrir", "compte", { plein: true, donnees: { donner: 1 } })}${petit("Retirer", "compte", { donnees: { donner: 0 } })}</div>` : ""}`);
  h += bloc("Message sous la cloche", `<input class="champ" id="adm-titre-msg" autocomplete="off" placeholder="Titre"><input class="champ" id="adm-texte-msg" autocomplete="off" placeholder="Texte">${petit("Envoyer", "message", { plein: true })}`);
  return h;
}

function sectionMonde(d) {
  const m = (d.mondes ?? []).find((x) => x.code === monde);
  if (!m) return "";
  const o = d.options?.options ?? {};
  return bloc(`${m.nom}, ${m.prive ? "privé" : "public"}`, `${(m.joueurs ?? []).map((j) => ligneAdm(esc(j.pseudo), `place ${j.place}`, petit("Retirer", "retirerJoueur", { donnees: { joueur: j.id, pseudo: j.pseudo } }))).join("")}
      ${petit("Fermer le monde", "fermerMonde")}`)
    + bloc("Règles du monde", `<p class="aide">Effet immédiat pour tout le monde, le fil l'annonce. La durée se change même après le premier jour.</p>
      ${BOOLEENS.map(([k, t]) => `<label class="adm-coche"><input type="checkbox" data-option="${k}" ${o[k] === true || (o[k] == null && ["voyages", "prisons", "casino"].includes(k)) ? "checked" : ""}> ${esc(t)}</label>`).join("")}
      <label class="etiquette" for="adm-duree">Durée de la saison</label>
      <select class="champ" id="adm-duree">${DUREES.map(([v, t]) => `<option value="${v}" ${(o.dureeSaison ?? "") === v ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
      <label class="etiquette" for="adm-options">Toutes les options (JSON)</label>
      <textarea class="champ adm-json" id="adm-options" spellcheck="false">${esc(JSON.stringify(o, null, 2))}</textarea>
      ${petit("Enregistrer : effet immédiat", "enregistrerOptions", { plein: true })}`)
    + bloc("Parloir", (d.visites ?? []).length ? d.visites.map((v) => ligneAdm(esc(`${v.pseudoDe} → ${v.pseudoVers}`), esc(v.statut),
        ["attente", "acceptee"].includes(v.statut) ? petit("Annuler", "annulerVisite", { donnees: { id: v.id } }) : "")).join("") : vide("Aucune visite."));
}

function sectionEconomie(d) {
  if (!monde) return "";
  const a = cache[`apercu:${monde}`];
  return bloc("Recalcul du crédit abusif", `${a ? (a.length ? a.map((x) => ligneAdm(esc(x.pseudo), `−${montant(x.retire)}`)).join("") : vide("Personne à recalculer.")) : ""}
      <div class="adm-rangee">${petit("Aperçu", "apercu")}${petit("Appliquer", "recalcul", { plein: true, desactive: !a?.length })}</div>`)
    + bloc("Échanges", (d.echanges ?? []).length ? d.echanges.slice(0, 30).map((e) => ligneAdm(esc(`${e.pseudoA} ⇄ ${e.pseudoB}`),
        esc(`${e.statut}${e.depotA + e.depotB > 0 ? `, dépôts ${montant(e.depotA + e.depotB)}` : ""}`),
        e.statut === "attente" ? petit("Annuler", "annulerEchange", { donnees: { id: e.id } }) : "")).join("") : vide("Aucun échange."))
    + bloc("Enchères et maisons de ventes", `<p class="aide">Les lots se tirent de la graine du monde : seules les mises se gèrent ici.</p>
      ${(d.encheres ?? []).length ? d.encheres.slice(0, 40).map((x) => ligneAdm(esc(`${x.pseudo} sur ${x.vente}`), esc(`Plafond ${montant(x.plafond)}${x.telephone ? ", par téléphone" : ""}`),
        petit("Retirer", "retirerMise", { donnees: { vente: x.vente, joueur: x.joueur } }))).join("") : vide("Aucune mise.")}`);
}

function sectionBots(d) {
  if (!monde) return "";
  return bloc("Ajouter", `<input class="champ" id="adm-nb-bots" inputmode="numeric" autocomplete="off" value="1" aria-label="Nombre de bots">
      <select class="champ" id="adm-niveau" aria-label="Niveau"><option value="detendu">Détendu</option><option value="normal" selected>Normal</option><option value="coriace">Coriace</option></select>
      ${petit("Ajouter", "ajouterBots", { plein: true })}`)
    + bloc("Bots du monde", (d.bots ?? []).length ? d.bots.map((b) => ligneAdm(esc(b.pseudo + (b.pause ? ", en pause" : "")), esc(`${b.caractere}, ${b.niveau}, ${montant(b.patrimoine)}`),
        `${petit(b.pause ? "Reprendre" : "Pause", "pauseBot", { donnees: { joueur: b.joueur, pause: b.pause ? 0 : 1 } })}${petit("Retirer", "retirerBot", { donnees: { joueur: b.joueur } })}`)).join("") : vide("Aucun bot."));
}

function sectionServeur(d) {
  return bloc("Version minimale", `<p class="aide">Une app plus ancienne ne joue plus en ligne ; le solo, la sauvegarde et les retours restent ouverts.</p>
      <input class="champ" id="adm-version" autocomplete="off" placeholder="1.17.0" value="${esc(d.version?.minimum ?? "")}">
      <select class="champ" id="adm-sans-entete" aria-label="App sans version annoncée"><option value="tolerer">Tolérer une app sans version</option><option value="refuser" ${d.version?.sans_entete === "refuser" ? "selected" : ""}>Refuser une app sans version</option></select>
      ${petit("Enregistrer", "version", { plein: true })}`)
    + bloc("Titres de profil", (d.titres ?? []).length ? d.titres.map((t) => ligneAdm(esc(t.pseudo), esc(t.titre + (t.choisi ? ", affiché" : "")),
        petit("Retirer", "retirerTitre", { donnees: { compte: t.compte, titre: t.titre } }))).join("") : vide("Aucun titre donné."))
    + bloc("Journal des corrections", (d.journal ?? []).length ? d.journal.slice(0, 40).map((e) => ligneAdm(esc(`${e.pseudo} : ${e.action?.type ?? "?"}`),
        esc(`${date(e.cree)}, ${e.annulee ? "annulée" : e.appliquee ? (e.erreur ? `refusée (${e.erreur})` : "appliquée") : "en attente"}`),
        !e.annulee ? petit("Annuler", "annulerCorrection", { donnees: { id: e.id } }) : "")).join("") : vide("Rien encore."));
}

function rendu(d) {
  if (d.verrou) return verrou();
  let corps = "";
  if (section === "joueur") {
    corps = joueur ? fiche(d) : `<input class="champ" id="adm-recherche" data-saisie="chercherJoueur" autocomplete="off" placeholder="Chercher un pseudo" value="${esc(recherche)}">
      <div id="adm-joueurs" class="adm-resultats">${resultatsJoueurs(d.comptes)}</div>`;
  } else if (section === "serveur") corps = sectionServeur(d);
  else corps = `${choixMonde(d)}${section === "monde" ? sectionMonde(d) : section === "economie" ? sectionEconomie(d) : sectionBots(d)}`;
  return `${entetePousse("Administration", petit("Fermer", "quitter"))}<div class="adm-page">
    ${segment(SECTIONS, section, "section")}
    ${bandeau ? `<p class="${bandeau[1] ? "adm-ok" : "adm-refus"}" role="status">${esc(bandeau[0])}</p>` : ""}
    ${corps}</div>`;
}

// MARK: Actions

function corriger(ctx, c, oublier = true) {
  return agir(ctx, "Envoyé : appliqué à la prochaine synchro du joueur.", async () => {
    const p = (cache[`fiche:${joueur.id}`]?.parties ?? [])[partie];
    await admin("admin_corriger", { p_compte: joueur.id, p_emplacement: p?.emplacement ?? "", p_action: c, p_message: "", p_visible: cache.visible !== false && c.type !== "message" });
  }, oublier ? ["comptes"] : []);
}

const lireJSON = (t) => { try { return JSON.parse(t); } catch { return null; } };

export const pages = {
  admin: {
    titre: "Administration",
    css: "admin",
    donnees,
    rendu,
    actions: {
      async entrer(ctx) {
        const essai = document.getElementById("adm-code")?.value ?? "";
        if (!essai) return;
        try {
          await serveur.appeler("admin_entrer", { p_code: essai });
          code = essai;
          bandeau = null;
        } catch (e) {
          bandeau = [e.code === "admin_bloque" ? "Trop d'essais : réessaie dans un quart d'heure." : "Code refusé.", false];
        }
        await ctx.rafraichir();
      },
      quitter(ctx) {
        code = null; joueur = null; bandeau = null;
        for (const k of Object.keys(cache)) delete cache[k];
        ctx.rafraichir();
      },
      section(ctx, b) { section = b.dataset.valeur; bandeau = null; ctx.rafraichir(); },
      chercherJoueur(ctx, el) {
        recherche = el.value;
        const r = document.getElementById("adm-joueurs");
        if (r) r.innerHTML = resultatsJoueurs(cache.comptes);
      },
      choisirJoueur(ctx, b) { joueur = (cache.comptes ?? []).find((c) => c.id === b.dataset.id) ?? null; partie = 0; bandeau = null; ctx.rafraichir(); },
      oublierJoueur(ctx) { if (joueur) delete cache[`fiche:${joueur.id}`]; joueur = null; ctx.rafraichir(); },
      choisirPartie(ctx, b) { partie = Number(b.dataset.valeur) || 0; ctx.redessiner(); },
      basculerVisible(ctx) { cache.visible = cache.visible === false; ctx.redessiner(); },
      basculerRemboursement(ctx) { cache.remboursement = !cache.remboursement; ctx.redessiner(); },
      argent(ctx, b) {
        const m = lireEuros("adm-montant");
        if (!m || m <= 0) return ctx.toast("Un montant, en euros.", "refus");
        corriger(ctx, { type: "argent", compte: document.getElementById("adm-cible")?.value ?? "principal", montant: Number(b.dataset.signe) * m,
          ...(cache.remboursement ? { remboursement: true } : {}) });
      },
      async corriger(ctx, b) {
        const c = lireJSON(b.dataset.c);
        if (!c) return;
        if (b.dataset.confirmer && !(await confirmer({ titre: b.dataset.confirmer, texte: "Cette correction ne s'annule pas depuis le journal.", oui: "Confirmer", danger: true }))) return;
        corriger(ctx, c);
      },
      peine(ctx) {
        const n = Math.max(0, Math.round(Number(document.getElementById("adm-peine")?.value ?? 0) || 0));
        corriger(ctx, { type: "prison_peine", valeur: n });
      },
      familleOffre(ctx, el) { familleOffre = el.value; choisiOffre = null; texteOffre = ""; ctx.redessiner(); },
      chercherOffre(ctx, el) {
        texteOffre = el.value;
        const r = document.getElementById("adm-cat-res");
        if (r) r.innerHTML = resultatsCatalogue(cache.catalogue ?? [], familleOffre, texteOffre, "choisirOffre");
      },
      choisirOffre(ctx, b) { choisiOffre = articles(cache.catalogue ?? [], familleOffre, "", 100000).find((a) => a.id === b.dataset.id) ?? null; ctx.redessiner(); },
      changerOffre(ctx) { choisiOffre = null; ctx.redessiner(); },
      offrir(ctx) {
        const a = choisiOffre;
        if (!a) return;
        const c = {
          montres: { type: "montre_donner", id: a.id },
          vehicules: { type: "vehicule_donner", id: a.id },
          bateaux: { type: "vehicule_donner", id: a.id },
          biens: document.getElementById("adm-habite")?.checked ? { type: "logement_donner", id: a.id, valeur: 1 } : { type: "bien_donner", id: a.id },
          permis: { type: "permis_donner", id: a.id },
        }[familleOffre];
        if (c) return corriger(ctx, c);
        if (familleOffre === "titres") {
          const m = lireEuros("adm-mise");
          if (!m || m <= 0) return ctx.toast("La mise offerte, en euros.", "refus");
          return corriger(ctx, { type: "actions_donner", id: a.id, montant: m });
        }
        const ville = document.getElementById("adm-ville")?.value ?? "", nom = (document.getElementById("adm-nom")?.value ?? "").trim();
        if (!ville || !nom) return ctx.toast("Une ville et un nom.", "refus");
        corriger(ctx, { type: "boite_donner", secteur: a.id, ville, nom });
      },
      familleCompte(ctx, el) { familleCompte = el.value; choisiCompte = null; texteCompte = ""; ctx.redessiner(); },
      chercherCompte(ctx, el) {
        texteCompte = el.value;
        const r = document.getElementById("adm-cat2-res");
        if (r) r.innerHTML = resultatsCatalogue(cache.catalogue ?? [], familleCompte, texteCompte, "choisirCompte");
      },
      choisirCompte(ctx, b) { choisiCompte = articles(cache.catalogue ?? [], familleCompte, "", 100000).find((a) => a.id === b.dataset.id) ?? null; ctx.redessiner(); },
      changerCompte(ctx) { choisiCompte = null; ctx.redessiner(); },
      compte(ctx, b) {
        const a = choisiCompte, donner = b.dataset.donner === "1";
        if (!a) return;
        if (familleCompte === "titresProfil") {
          return agir(ctx, donner ? `Titre « ${a.nom} » donné` : `Titre « ${a.nom} » retiré`,
            () => admin(donner ? "admin_titre_donner" : "admin_titre_retirer", { p_compte: joueur.id, p_titre: a.id }), ["titres"]);
        }
        corriger(ctx, familleCompte === "cartes" ? { type: donner ? "carte_fortune_donner" : "carte_fortune_retirer", valeur: Number(a.id) }
          : { type: donner ? "cosmetique_donner" : "cosmetique_retirer", id: a.id });
      },
      message(ctx) {
        const titre = (document.getElementById("adm-titre-msg")?.value ?? "").trim();
        if (!titre) return ctx.toast("Un titre.", "refus");
        corriger(ctx, { type: "message", titre, texte: (document.getElementById("adm-texte-msg")?.value ?? "").trim() });
      },
      choisirMonde(ctx, el) { monde = el.value; bandeau = null; ctx.rafraichir(); },
      async retirerJoueur(ctx, b) {
        if (!(await confirmer({ titre: `Retirer ${b.dataset.pseudo} ?`, oui: "Retirer du monde", danger: true }))) return;
        agir(ctx, "Joueur retiré", () => admin("admin_retirer_joueur", { p_monde: monde, p_joueur: b.dataset.joueur }), ["mondes"]);
      },
      async fermerMonde(ctx) {
        if (!(await confirmer({ titre: "Fermer ce monde ?", texte: "Le monde et tout ce qui s'y échange disparaissent. Les parties restent, hors ligne.", oui: "Fermer le monde", danger: true }))) return;
        const m = monde;
        monde = "";
        agir(ctx, "Monde fermé", () => admin("admin_fermer_monde", { p_monde: m }), ["mondes"]);
      },
      enregistrerOptions(ctx) {
        const o = lireJSON(document.getElementById("adm-options")?.value ?? "");
        if (!o || typeof o !== "object" || Array.isArray(o)) return ctx.toast("JSON illisible : rien n'est parti.", "refus");
        for (const el of document.querySelectorAll("[data-option]")) o[el.dataset.option] = el.checked;
        const duree = document.getElementById("adm-duree")?.value ?? "";
        if (duree) o.dureeSaison = duree; else delete o.dureeSaison;
        agir(ctx, "Règles enregistrées", () => admin("admin_monde_options_changer", { p_monde: monde, p_options: o }), [`monde:${monde}`]);
      },
      annulerVisite(ctx, b) { agir(ctx, "Visite annulée", () => admin("admin_visite_annuler", { p_id: b.dataset.id }), [`monde:${monde}`]); },
      apercu(ctx) { agir(ctx, "Aperçu à jour", async () => { cache[`apercu:${monde}`] = await admin("admin_recalcul_credit_apercu", { p_monde: monde }); }); },
      async recalcul(ctx) {
        if (!(await confirmer({ titre: "Appliquer le recalcul du crédit ?", texte: "Une correction par joueur concerné. Rejouer ne double rien.", oui: "Déposer les corrections", danger: true }))) return;
        agir(ctx, "Recalcul déposé : appliqué à la prochaine synchro de chaque joueur", () => admin("admin_recalcul_credit_appliquer", { p_monde: monde }), [`apercu:${monde}`]);
      },
      annulerEchange(ctx, b) { agir(ctx, "Échange annulé, dépôts rendus", () => admin("admin_echange_annuler", { p_id: Number(b.dataset.id) }), [`economie:${monde}`]); },
      retirerMise(ctx, b) { agir(ctx, "Mise retirée", () => admin("admin_enchere_retirer", { p_monde: monde, p_vente: b.dataset.vente, p_joueur: b.dataset.joueur }), [`economie:${monde}`]); },
      ajouterBots(ctx) {
        const n = Math.max(1, Math.min(9, Math.round(Number(document.getElementById("adm-nb-bots")?.value ?? 1) || 1)));
        agir(ctx, "Bots demandés : ils arrivent s'il reste des places", () => admin("admin_bots_ajouter", { p_monde: monde, p_nombre: n, p_niveau: document.getElementById("adm-niveau")?.value ?? "normal" }), [`bots:${monde}`, "mondes"]);
      },
      pauseBot(ctx, b) { agir(ctx, b.dataset.pause === "1" ? "Bot en pause" : "Le bot rejoue", () => admin("admin_bot_pause", { p_monde: monde, p_joueur: b.dataset.joueur, p_pause: b.dataset.pause === "1" }), [`bots:${monde}`]); },
      retirerBot(ctx, b) { agir(ctx, "Bot parti", () => admin("admin_bot_retirer", { p_monde: monde, p_joueur: b.dataset.joueur }), [`bots:${monde}`, "mondes"]); },
      version(ctx) {
        const v = (document.getElementById("adm-version")?.value ?? "").trim();
        agir(ctx, "Version minimale enregistrée", () => admin("admin_version_minimale", { p_version: v || null, p_sans_entete: document.getElementById("adm-sans-entete")?.value ?? null }), ["version"]);
      },
      retirerTitre(ctx, b) { agir(ctx, "Titre retiré", () => admin("admin_titre_retirer", { p_compte: b.dataset.compte, p_titre: b.dataset.titre }), ["titres"]); },
      annulerCorrection(ctx, b) { agir(ctx, "Correction annulée", () => admin("admin_annuler", { p_id: Number(b.dataset.id) }), ["journal"]); },
    },
  },
};
