// ══════════════════════════════════════════════════════════════════════
//  Zone « combines » (D186, vague 1) — EcranCombines.swift : l'illégal.
//
//  D358 : en haut un résumé (soupçon en jauge fine, argent sale, casier, prison),
//  puis les actions en sections repliées (Coups, Blanchiment, Équipe,
//  Protections et vengeance, Casier), les explications derrière « ? ».
//  Puis le tuyau du jour, les petits coups (jauge de risque à dix crans),
//  la corruption, le blanchiment, ce qui tourne au noir, et l'extrait de
//  casier sur papier, ses cases de points et son tampon.
//  Les combines à deux (FeuilleComplice, en ligne) ne sont pas sur le web.
//  RNT-178 : sous chaque coup, ce qui fait varier son risque ; puis le
//  niveau, le matériel du marché noir, les joueurs du monde (feuille
//  « Combines » d'une cible), tes coups, et ceux qu'on t'a faits avec la
//  plainte (CombinesJoueurs.swift). Le web n'a pas encore de client des
//  mondes en ligne : cibles et coups y arrivent par le pont (combines.*).
//
//  D404 : petits coups et gros coups (les mêmes que contre un joueur), le
//  tuyau au club ; la corruption (prix selon la fortune, risque, refus) et
//  les contrôles annoncés à arranger viennent du tableau « illegal ».
// ══════════════════════════════════════════════════════════════════════
import { montant, variation, esc } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, petit, bouton, champEuros, lireEuros } from "../ui.js?v=3e8bddd9";
import { coffreJuger } from "../enligne.js?v=3e8bddd9"; // D347 : le serveur juge les essais avec le vrai code
import { choixCompact, choisi, actionsChoixCompact, SEUIL } from "../choix-compact.js?v=3e8bddd9"; // D352

const I = (d, t = 0) => `<svg viewBox="0 0 24 24" ${t ? `width="${t}" height="${t}"` : ""} fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SF = {
  etalage: '<path d="M3 4h2l2.2 10.5h10.6L20 7H6.2"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  pickpocket: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V5.5a1.5 1.5 0 0 1 3 0V13M17 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-14 0v-2.5a1.5 1.5 0 0 1 3 0"/>',
  velo: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-8h5l3 8M10 8l2 8H6M14 5h2"/>',
  cambriolage: '<path d="M2.5 11L12 4l9.5 7M5 9.5V20h14V9.5M10 20v-5h4v5"/>',
  voiture: '<path d="M3 15.5V13l2.5-1 2.5-3.5h7l3 3.5 3 .8v2.7z"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
  masque: '<path d="M4 6c3 1 13 1 16 0v5a8 8 0 0 1-16 0zM8.5 11h2M13.5 11h2M9.5 15.5c1.5 1 3.5 1 5 0"/>',
  dossier: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 13h6"/>',
  inspecteur: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c1-3.6 3.6-5.5 6.5-5.5 1.3 0 2.5.3 3.5 1M17 13.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM18.6 17.3 21 20"/>',
  marche: '<path d="M3 9l9-5 9 5M5 9.5v8.5M9.5 9.5v8.5M14.5 9.5v8.5M19 9.5v8.5M3 20.5h18"/>',
  enveloppe: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  billets: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
  oeilBarre: '<path d="M3 3l18 18M10.6 6.1A9.5 9.5 0 0 1 12 6c5 0 8.5 4.5 9.5 6-.5.8-1.6 2.3-3.2 3.6M6.4 7.8C4.5 9.1 3.2 10.9 2.5 12c1 1.5 4.5 6 9.5 6 1.5 0 2.9-.4 4.1-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  verrou: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  oreille: '<path d="M7 9a5 5 0 0 1 10 0c0 3-2.5 4-3 6.5-.4 2-1.6 3.5-3.5 3.5A3 3 0 0 1 7.5 17M10 9.5a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.5"/>',
  hausse: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  horloge: '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v4h4M12 7.5V12l3 2"/>',
  colonnes: '<path d="M3 9l9-5 9 5M5 9.5v8.5M9.5 9.5v8.5M14.5 9.5v8.5M19 9.5v8.5M3 20.5h18"/>',
};
// RNT-188 : la contrebande par la mer.
SF.voile = '<path d="M12 3v13M12 4.5l6.5 10.5H12M11 7l-5.5 8H11M3.5 18.5c2.5 2 14.5 2 17 0"/>';
// D404 : le tuyau au club, le permis, le juge, le contrôleur.
SF.verre = '<path d="M7 3.5h10l-1 6a4 4 0 0 1-8 0zM12 13.5v6M8.5 20.5h7"/>';
SF.compteur = '<path d="M4 16a8 8 0 1 1 16 0M12 16l4-5M4 16h2M18 16h2M12 8V6"/>';
SF.juge = '<path d="M3 21h18M5 21v-2h14v2M12 3l7 4H5zM7 9v8M12 9v8M17 9v8"/>';
SF.bouclier = '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4"/>';
const ICONE_COUP = { etalage: "etalage", pickpocket: "pickpocket", velo: "velo", cambriolage: "cambriolage", voiture: "voiture", fumoir: "verre" };
const ICONE_CORRUPTION = { dossier: "dossier", inspecteur: "inspecteur", marche: "marche", points: "compteur", juge: "juge" };


const pct = (x, signe = false) => `${signe && x > 0 ? "+" : ""}${Math.round(x * 100)} %`;


export const pages = {
  combines: {
    titre: "Combines",
    css: "combines", // RNT-370 : protections et vengeance
    async donnees(ctx) {
      const t = await ctx.tableau("illegal");
      // RNT-178 : niveau, matériel, joueurs du monde, coups faits et subis.
      const j = await ctx.tableau("combines");
      return { t, j, pseudo: ctx.etat.compte?.pseudo ?? "" };
    },
    rendu(d) {
      if (!d?.t) return `${entetePousse("Combines")}<div class="vide">Les combines s'ouvrent avec ta première saison.</div>`;
      const t = d.t, j = d.j;
      // D358 (Arthur 15/11 00:26) : un résumé en tête, puis les actions en sections repliées ; les explications derrière « ? ».
      const possibles = t.coups.filter((c) => !c.fait && !c.refus).length + (j?.mer ?? []).filter((c) => !c.refus).length;
      return `
        ${entetePousse("Combines")}
        <div class="pile cb-page">
          ${resume(t)}
          ${tuyau(t)}
          ${sectionCb("coups", "Coups", possibles ? `${possibles} possible${possibles > 1 ? "s" : ""}` : "Demain", `${coups(t)}${parLaMer(j, t)}${monde(j)}${corruption(t)}`)}
          ${sectionCb("blanchiment", "Blanchiment", t.argentSale > 0 ? montant(t.argentSale) : "Rien à blanchir", `${blanchiment(t)}${auNoir(t)}`)}
          ${j ? sectionCb("equipe", "Équipe", `Niveau ${j.niveau} sur 4`, equipe(j)) : ""}
          ${j && (j.enLigne || j.subis.length) ? sectionCb("protections", "Protections et vengeance", j.subis.length ? `${j.subis.length} coup${j.subis.length > 1 ? "s" : ""} subi${j.subis.length > 1 ? "s" : ""}` : "",
            `${j.enLigne && j.protections ? sectionProtections(j.protections) : ""}${subis(j)}`) : ""}
          ${sectionCb("casier", "Casier", `${t.points} point${t.points > 1 ? "s" : ""} sur ${t.pointsPrison}`, `${casier(t, d.pseudo)}${faits(j)}`)}
        </div>`;
    },
    actions: {
      ...actionsChoixCompact((x) => x.redessiner()), // D352 : le choix compact des joueurs du monde
      // RNT-178 : le marché noir (fenêtre de paiement), la feuille d'une cible, la plainte.
      acheterOutil: (ctx, el) => ctx.decider("combines", { acheterOutil: { _0: el.dataset.id } }, { succes: "À toi" }),
      porterPlainte: (ctx, el) => ctx.decider("combines", { porterPlainte: { _0: el.dataset.id } }, { succes: "Plainte déposée : la police enquête" }),
      // RNT-370 : alarmes, gardiens, coffre renforcé, assurances (fenêtre de paiement) ; RNT-371 : riposte, détective.
      proteger: (ctx, el) => ctx.decider("combines", { proteger: { lieu: el.dataset.lieu, sorte: el.dataset.sorte, niveau: Number(el.dataset.niveau) } },
        { succes: Number(el.dataset.niveau) ? "En place" : "Retiré" }),
      renforcerCoffre: (ctx, el) => ctx.decider("combines", { renforcerCoffre: { _0: Number(el.dataset.niveau) } }, { succes: "Coffre renforcé" }),
      assurer: (ctx, el) => ctx.decider("combines", { assurer: { risque: el.dataset.risque, ...(el.dataset.formule ? { formule: el.dataset.formule } : {}) } },
        { succes: el.dataset.formule ? "Assurance signée" : "Assurance résiliée" }),
      riposter: (ctx, el) => ctx.decider("combines", { riposter: { _0: el.dataset.id } }, { succes: "Riposte lancée : le serveur la porte à ton voleur" }),
      detective: (ctx, el) => ctx.decider("combines", { detective: { _0: el.dataset.id } }, { succes: "Le détective enquête" }),
      // 17/11 : « Chez un joueur » d'un gros coup : la liste des joueurs à viser, puis leur feuille filtrée sur ce coup.
      chezUnJoueur(ctx, el) {
        const coup = el.dataset.coup;
        const cibles = (ctx.etat.donnees?.j?.cibles ?? []).filter((c) => !c.enFocus && !c.tenteAujourdhui);
        ctx.feuille({
          titre: "Chez quel joueur ?",
          rendu: () => cibles.length ? `<div class="pile">${cibles.map((c) => `<div class="filet"></div><div class="rangee cb-cible">
            <div class="cb-delit-texte"><div class="cb-nom">${esc(c.pseudo)}${c.bot ? " · bot" : ""}</div><div class="aide">${esc(c.ou ?? "")}</div></div>
            ${petit("Viser", "viser", { plein: true, donnees: { id: c.id } })}</div>`).join("")}</div>`
            : `<p class="aide">Personne à viser aujourd'hui (en focus ou déjà tenté).</p>`,
          actions: { viser: (x, b) => { pages.combines.actions.ouvrirCible(ctx, { dataset: { id: b.dataset.id, coup } }); } },
        });
      },
      async ouvrirCible(ctx, el) {
        const id = el.dataset.id;
        const filtre = el.dataset.coup || null;
        const c = await ctx.tableau("combinesCible", { id });
        if (!c) return ctx.toast("Ce joueur n'est plus dans le monde.", "refus");
        ctx.feuille({
          titre: `Combines contre ${c.pseudo}`,
          rendu: () => feuilleCible(filtre ? { ...c, possibilites: c.possibilites.filter((p) => p.coup === filtre) } : c), // D352 : redessinée par le choix compact
          actions: {
            ...actionsChoixCompact((x) => x.redessiner()),
            coffreCible: (x) => ouvrirCoffreCible(x, id), // D347
            async tenter(x, b) {
              const op = { tenter: { cible: id, coup: b.dataset.coup, ...(b.dataset.objet ? { objet: b.dataset.objet } : {}) } };
              const avant = ctx.etat.donnees?.j?.faits?.length ?? 0;
              if (!(await x.decider("combines", op))) return;
              const j = ctx.etat.donnees?.j;
              const pris = j && j.faits.length > avant && j.faits[0].statut.startsWith("Arrêté");
              x.toast(pris ? "Arrêté sur le fait" : "Réussi : il le découvrira à sa prochaine connexion", pris ? "refus" : "gain");
            },
          },
        });
      },
      async coup(ctx, el, d) {
        const avant = d.t;
        if (!(await ctx.decider("illegal", { coup: { _0: el.dataset.id } }))) return;
        const apres = ctx.etat.donnees?.t;
        if (apres && apres.casier.length > avant.casier.length) ctx.toast("Arrêté", "refus");
        else if (apres) ctx.toast(`Réussi : +${montant(apres.argentSale - avant.argentSale)} en liquide`, "gain");
      },
      // RNT-188 : la contrebande par la mer.
      async contrebande(ctx, el, d) {
        const avant = d.t;
        if (!(await ctx.decider("combines", { contrebande: { bateau: Number(el.dataset.bateau), cargaison: el.dataset.id } }))) return;
        const apres = ctx.etat.donnees?.t;
        if (apres && apres.casier.length > avant.casier.length) ctx.toast("La douane t'attendait", "refus");
        else if (apres) ctx.toast(`Passée : +${montant(apres.argentSale - avant.argentSale)} en liquide`, "gain");
      },
      async corrompre(ctx, el, d) {
        const avant = d.t;
        if (!(await ctx.decider("illegal", { corrompre: { _0: el.dataset.id } }))) return;
        const apres = ctx.etat.donnees?.t;
        const pris = apres && apres.casier.length > avant.casier.length;
        ctx.toast(pris ? (el.dataset.id === "juge" ? "Pris : corruption de magistrat" : "Pris : corruption de fonctionnaire") : "C'est fait", pris ? "refus" : "gain");
      },
      // D404 : arranger le contrôleur d'un contrôle annoncé (le même geste que sur l'événement, vie.js).
      async soudoyer(ctx, el, d) {
        const avant = d.t.soupcon;
        if (!(await ctx.decider("evenements", { soudoyer: { evenement: Number(el.dataset.id) } }))) return;
        const pris = (ctx.etat.donnees?.t?.soupcon ?? avant) > avant;
        ctx.toast(pris ? "Le contrôleur a refusé : il passera quand même" : "Enveloppe glissée", pris ? "refus" : "gain");
      },
      ignorerTuyau: (ctx) => ctx.decider("illegal", { ignorerTuyau: {} }, { succes: "Tuyau ignoré" }),
      miser(ctx) {
        ctx.feuille({
          titre: "Miser sur le tuyau",
          contenu: `${champEuros("mise", { etiquette: "Combien ?" })}
            <p class="aide">Depuis ton compte courant ; dénouement demain.</p>
            ${bouton("Miser", "validerMise")}`,
          actions: {
            async validerMise(c) {
              const v = lireEuros("mise");
              if (!v || v <= 0) return c.toast("Indique un montant.", "refus");
              await c.decider("illegal", { miserTuyau: { _0: v } }, { succes: "Position prise, l'annonce tombe demain" });
            },
          },
        });
      },
      blanchir(ctx, el, d) {
        const b = d.t.blanchiment.find((x) => x.id === Number(el.dataset.id));
        if (!b) return;
        const maxi = Math.min(b.reste, d.t.argentSale);
        const garde = 1 - d.t.decoteBlanchiment;
        ctx.feuille({
          titre: `Blanchir par ${b.nom}`,
          contenu: `${champEuros("blanchi", { etiquette: `Jusqu'à ${montant(maxi)}`, placeholder: montant(maxi) })}
            <div class="choix">${[0.25, 0.5, 1].map((x) => petit(x === 1 ? "Tout" : `${Math.round(x * 100)} %`, "partBlanchie", { donnees: { v: String(Math.floor(maxi * x)) } })).join("")}</div>
            <p class="aide">Rendu propre dans la boîte, moins ${Math.round(d.t.decoteBlanchiment * 100)} %.</p>
            ${bouton("Blanchir", "validerBlanchi")}`,
          actions: {
            partBlanchie(c, e) {
              const champ = document.getElementById("blanchi");
              if (champ) champ.value = (Number(e.dataset.v) / 100).toLocaleString("fr-BE", { maximumFractionDigits: 2, useGrouping: false });
            },
            async validerBlanchi(c) {
              const v = lireEuros("blanchi");
              if (!v || v <= 0) return c.toast("Indique un montant.", "refus");
              if (v > maxi) return c.toast(`Au plus ${montant(maxi)} cette semaine.`, "refus");
              await c.decider("illegal", { blanchir: { boite: b.id, _1: v } }, { succes: `${montant(Math.round(v * garde))} propres dans ${b.nom}` });
            },
          },
        });
      },
    },
  },
};

// MARK: D358 — les sections repliées, le « ? », le résumé

/** Les sections ouvertes, gardées d'un rendu à l'autre (le toucher ne redessine pas la page). */
const ouvertes = new Set();
if (typeof document !== "undefined") document.addEventListener("toggle", (e) => {
  const el = e.target;
  if (!el?.classList?.contains("cb-section")) return;
  if (el.open) ouvertes.add(el.dataset.section); else ouvertes.delete(el.dataset.section);
}, true);

const CHEVRON = '<path d="M9 6l6 6-6 6"/>';
function sectionCb(id, titre, meta, corps) {
  if (!corps.trim()) return "";
  return `<details class="carte cb-section" data-section="${id}"${ouvertes.has(id) ? " open" : ""}>
    <summary class="cb-sommaire"><span class="cb-s-titre">${esc(titre)}</span><span class="cb-s-meta">${meta}</span><span class="cb-chevron">${I(CHEVRON, 16)}</span></summary>
    <div class="cb-corps">${corps}</div></details>`;
}

/** Une explication derrière « ? » (l'iPhone : AideRepliee). */
const aideQ = (texte, { titre = "" } = {}) => `<details class="cb-q"><summary aria-label="Comment ça marche${titre ? ` : ${esc(titre)}` : ""}">?</summary><p class="aide">${texte}</p></details>`;

/** L'en-tête d'un bloc : son titre et, derrière « ? », ce qu'il faut savoir. */
const enteteBloc = (titre, aide = "") => `<div class="cb-entete"><span class="libelle">${esc(titre)}</span>${aide ? aideQ(aide, { titre }) : ""}</div>`;

/** La liasse, plus petite et à plat (D358 : l'objet garde sa matière, sans dégradé). */
function liasse(epaisseur) {
  const n = 1 + Math.round(epaisseur * 4);
  const billets = Array.from({ length: n }, (_, i) => `<rect class="cb-billet" x="3" y="${22 - i * 3}" width="42" height="18" rx="2.5" transform="rotate(${i % 2 === 0 ? -3 : 2} 24 ${31 - i * 3})"/>`).join("");
  return `<svg class="cb-liasse" viewBox="0 0 48 44" aria-hidden="true">${billets}<rect class="cb-bague" x="20" y="${22 - (n - 1) * 3}" width="7" height="${18 + (n - 1) * 3}"/></svg>`;
}

/** Le risque (ou le soupçon) en jauge fine, et le pourcentage (JaugeFine de l'iPhone). */
function jaugeRisque(risque, { libelle = "Risque d'être pris" } = {}) {
  const r = Math.min(1, Math.max(0, risque));
  const ton = r > 0.6 ? "perte" : r > 0.3 ? "alerte" : "";
  return `<div class="rangee cb-risque" role="img" aria-label="${libelle} : ${Math.round(r * 100)} %">
    <span class="jauge-fine ${ton}" style="--part:${r.toFixed(3)}"><i></i></span><span class="cb-pct ${ton || "gain"}">${Math.round(r * 100)} %</span></div>`;
}

/** D358 : le résumé : le soupçon, l'argent sale, le casier, la prison. */
function resume(t) {
  const ton = t.soupcon > 0.3 ? "danger" : t.soupcon > 0.05 ? "alerte" : "";
  const zero = t.soupconZeroDans != null ? (t.soupconZeroDans <= 1 ? "À zéro cette nuit." : `À zéro dans ${t.soupconZeroDans} jours.`) : "";
  const prison = t.prisonJours > 0;
  return carte(`<div class="cb-resume">
      <div class="cb-r-soupcon"><div class="cb-entete"><span class="aide">Soupçon</span>${aideQ(`Chaque combine rapporte plus, et fait monter le soupçon. Pris, tu paies selon la gravité ; chaque récidive coûte 50 % de plus, et au-delà de ${t.pointsPrison} points de casier, c'est la prison.`, { titre: "les combines" })}</div>
        ${jaugeRisque(t.soupcon, { libelle: "Soupçon" })}
        <div class="cb-r-texte ${ton}">${esc(t.soupconTexte)}${zero ? ` <span class="t2">${zero}</span>` : ""}</div></div>
      <div class="cb-r-case">${liasse(Math.min(1, t.argentSale / 5_000_000))}<div><div class="aide">Argent sale</div><div class="chiffres cb-r-chiffre">${montant(t.argentSale)}</div></div></div>
      <div class="cb-r-case"><span class="pastille cb-r-pastille" style="--c:${t.points >= t.pointsPrison - 1 && t.points > 0 ? "var(--c-danger)" : "var(--vente)"}">${I(SF.colonnes, 17)}</span>
        <div><div class="aide">Casier</div><div class="chiffres cb-r-chiffre">${t.points} / ${t.pointsPrison}</div></div></div>
      <div class="cb-r-statut ${prison ? "danger" : "t2"}"><span class="cb-ic">${I(SF.verrou, 15)}</span>${prison
        ? `En prison encore ${t.prisonJours} jour${t.prisonJours > 1 ? "s" : ""} : le focus ne paie rien, tes boîtes tournent au ralenti.` : "Libre."}</div>
    </div>`, { pad: true });
}

// MARK: Le tuyau

function tuyau(t) {
  if (t.initie) return carte(`<div class="rangee cb-ligne-forte"><span class="cb-ic">${I(SF.hausse, 18)}</span>${esc(t.initie)}</div>`, { pad: true });
  if (!t.tuyau) return "";
  const tu = t.tuyau;
  const corps = t.tuyauTexte
    ? `<div class="cb-tuyau-texte">${esc(t.tuyauTexte)}</div>
       <div class="cb-corps-texte">Mise chez lui : ${pct(tu.hausse, true)} attendus. Ou prends position toi-même en bourse sur ce rayon avant l'annonce.</div>
       ${t.tuyauExpose > 0 ? `<div class="alerte cb-note">Tu as déjà ${montant(t.tuyauExpose)} d'exposition sur ce tuyau en bourse.</div>` : ""}`
    : `<div class="cb-corps-texte">Un ami chez ${esc(tu.nom)} te souffle une annonce avant qu'elle soit publique : ${pct(tu.hausse, true)} attendus demain.</div>`;
  return carte(`<div class="pile cb-bloc">
      <div class="cb-entete"><span class="rangee libelle cb-titre-ic"><span class="cb-ic">${I(SF.oreille, 18)}</span>Un tuyau</span>${aideQ(`Délit d'initié, en misant chez lui comme en bourse : ${pct(t.risqueEnquete)} de risque d'enquête, gain confisqué et amende du double.`, { titre: "le tuyau" })}</div>
      ${corps}
      <div class="rangee">${petit("Miser", "miser", { plein: true })}${petit("Ignorer", "ignorerTuyau")}</div>
    </div>`, { pad: true });
}

// MARK: Les petits coups

const badgeGrave = () => `<span class="cb-grave" title="Délit grave : compte double au casier">Grave ×2</span>`;

const pastille = (icone, teinte) => `<span class="pastille cb-pastille" style="--c:${teinte}">${I(SF[icone] ?? SF.masque, 18)}</span>`;

/** Une ligne de délit : le nom, ce qu'il rapporte, son risque en jauge fine ; le détail et les facteurs derrière « ? ». */
function rangeeDelit({ icone, teinte, nom, grave, detail, gain, risque, bouton: b, terne, facteurs = null }) {
  return `<div class="filet"></div>
    <div class="rangee cb-delit${terne ? " terne" : ""}">
      ${pastille(icone, teinte)}
      <div class="cb-delit-texte">
        <div class="rangee cb-nom-ligne"><span class="cb-nom">${esc(nom)}</span>${grave ? badgeGrave() : ""}</div>
        ${gain}
        ${jaugeRisque(risque)}
        ${aideQ(`${esc(detail)}${facteurs ? listeFacteurs(facteurs) : ""}`, { titre: nom })}
      </div>
      <div class="cb-bouton">${b}</div>
    </div>`;
}

const ligneGain = (texte, icone = SF.billets, ton = "gain") => `<div class="rangee ${ton} cb-gain"><span class="cb-ic">${I(icone, 14)}</span>${texte}</div>`;

/** D404 : les petits coups (l'entrée des débutants), puis les gros coups, les mêmes qu'on tente chez un joueur du monde. */
function coups(t) {
  const ligne = (c) => rangeeDelit({
    icone: ICONE_COUP[c.id], teinte: c.grave ? "var(--c-danger)" : "var(--vente)", nom: c.nom, grave: c.grave, detail: c.detail,
    gain: ligneGain(`${montant(c.gainMin)} à ${montant(c.gainMax)} en liquide`)
      + (c.refus ? `<div class="alerte cb-note">${esc(c.refus)}</div>` : c.chezUnJoueur ? `<div class="rangee cb-note">${petit("Chez un joueur", "chezUnJoueur", { donnees: { coup: c.fusion } })}</div>` : ""),
    risque: c.risque, terne: c.fait || !!c.refus, facteurs: c.detailRisque,
    bouton: petit(c.fait ? "Demain" : "Tenter", "coup", { plein: !c.fait && !c.refus, donnees: { id: c.id }, desactive: c.fait || !!c.refus || t.prisonJours > 0 }),
  });
  const petits = t.coups.filter((c) => !c.fusion), gros = t.coups.filter((c) => c.fusion);
  return `<div class="cb-sous">${enteteBloc("Petits coups")}</div>${petits.map(ligne).join("")}`
    + (gros.length ? `<div class="filet"></div><div class="cb-sous">${enteteBloc("Gros coups", "Les mêmes règles que contre un joueur : il faut le niveau, le risque et la sanction sont les siens, chaque réussite compte pour les deux.")}</div>${gros.map(ligne).join("")}` : "");
}

// MARK: Par la mer (RNT-188) — SectionContrebande, EcranCombines.swift

function parLaMer(j, t) {
  const l = j?.mer ?? [];
  if (!l.length) return "";
  const lignes = l.map((c) => rangeeDelit({
    icone: "voile", teinte: c.grave ? "var(--c-danger)" : "var(--equipe)", nom: c.nom, grave: c.grave,
    detail: c.refus ? `${c.detail} ${c.refus}` : `${c.detail} Sur ${c.nomBateau} ; ${montant(c.carburant)} de carburant.`,
    gain: ligneGain(`${montant(c.gainMin)} à ${montant(c.gainMax)} en liquide`),
    risque: c.risque?.risque ?? 0, terne: !!c.refus, facteurs: c.risque,
    bouton: petit("Tenter", "contrebande", { plein: !c.refus, donnees: { id: c.id, bateau: String(c.bateau ?? "") }, desactive: !!c.refus || t.prisonJours > 0 }),
  })).join("");
  return `<div class="filet"></div><div class="cb-sous">${enteteBloc("Par la mer", "Une traversée sur un de tes bateaux, loin de la douane. Un bateau rapide la sème ; un yacht a l'air respectable. Pris sur un délit grave, le bateau peut être saisi.")}</div>${lignes}`;
}

// MARK: Entre joueurs (RNT-178) — CombinesJoueurs.swift

const SF2 = {
  gants: '<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 9.5V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4.3 14.6a1.5 1.5 0 0 1 2.4-1.8L7 13"/>',
  crochets: '<path d="M14.5 4.5l5 5M17 7l-9.5 9.5M5 19l2.5-2.5M4 14l6 6"/>',
  brouilleur: '<path d="M12 12v8M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13M3 3l18 18"/>',
  telephone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 6h4M10 18h4"/>',
  portefeuille: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 9.5h18M16 14h2"/>',
  montre: '<circle cx="12" cy="12" r="5.5"/><path d="M12 9.5V12l1.5 1.5M9.5 6.8 10 3h4l.5 3.8M9.5 17.2 10 21h4l.5-3.8"/>',
  sabotage: '<path d="M13 2.5 5 13.5h6l-1 8 8-11h-6z"/><path d="M3 3l18 18"/>',
  cambriolage: SF.cambriolage,
  vehicule: SF.voiture, // RNT-317
  personne: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6"/>',
  bot: '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 3.5V7M9 12h.01M15 12h.01M9.5 15.5h5"/>',
  coche: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  maquilleur: '<path d="M18.5 3.5l2 2-9 9-3 1 1-3z"/><path d="M8 16c-2 0-3.5 1.5-3.5 4.5C7 20.5 9 19 9 17"/>', // D333 : l'atelier de maquillage
};
const ICONE_OUTIL = { gants: "gants", crochets: "crochets", brouilleur: "brouilleur", telephone: "telephone", maquilleur: "maquilleur" };

/** « −20 % », « +10 % », « = » : l'effet d'un facteur sur le risque. */
const effet = (x) => { const p = Math.round((x - 1) * 100); return p === 0 ? "=" : p > 0 ? `+${p} %` : `−${-p} %`; };

/** Ce qui fait varier le risque, facteur par facteur (FacteursRisque). */
function listeFacteurs(d) {
  return `<div class="facteurs">${d.facteurs.map((f) => `<div class="rangee cb-facteur">
      <span class="cb-f-nom">${esc(f.nom)}</span><span class="cb-f-detail">${esc(f.detail)}</span>
      <span class="${f.effet < 0.995 ? "gain" : f.effet > 1.005 ? "alerte" : "t2"} cb-f-effet">${effet(f.effet)}</span></div>`).join("")}</div>`;
}

const pastille2 = (icone, teinte) => `<span class="pastille cb-pastille" style="--c:${teinte}">${I(SF2[icone] ?? SF.masque, 18)}</span>`;
const tonCouleur = (ton) => (ton === "perte" ? "danger" : ton === "gain" ? "gain" : ton === "attente" ? "alerte" : "t2");

/** D358 : l'équipe : le niveau de combines et le matériel du marché noir. */
function equipe(j) {
  const niveau = `<div class="pile cb-bloc">
      <div class="rangee entre"><span class="libelle">Niveau de combines</span><span class="chiffres cb-niveau">${j.niveau} sur 4</span></div>
      <p class="aide">${j.prochainNiveau != null ? `${j.reussites} réussite${j.reussites > 1 ? "s" : ""} : encore ${j.prochainNiveau} pour le niveau ${j.niveau + 1}.` : `${j.reussites} réussites : tous les coups te sont ouverts.`}</p>
      ${j.soupconVille ? `<div class="t2 cb-note">${esc(j.soupconVille)}</div>` : ""}
    </div>`;
  const outils = `<div class="filet"></div><div class="cb-sous">${enteteBloc("Matériel", "Acheté au marché noir (10 % de moins en liquide), il baisse le risque des coups qu'il sert. Les gros coups se débloquent avec l'expérience des petits.")}</div>
    ${j.outils.map((o) => `<div class="filet"></div><div class="rangee outil cb-delit" data-outil="${esc(o.id)}">
      ${pastille2(ICONE_OUTIL[o.id] ?? "crochets", "var(--c-controles, var(--accent))")}
      <div class="cb-delit-texte">
        <span class="cb-nom">${esc(o.nom)}</span>
        <span class="gain cb-gain">Risque −${Math.round(o.effet * 100)} % : ${esc(o.pour)}</span>
        ${aideQ(esc(o.detail), { titre: o.nom })}</div>
      <div class="cb-bouton">${o.possede ? `<span class="t2 rangee cb-a-toi">${I(SF2.coche, 13)}À toi</span>` : petit(montant(o.prix), "acheterOutil", { plein: true, donnees: { id: o.id } })}</div>
    </div>`).join("")}`;
  return `${niveau}${outils}`;
}

/** Les joueurs du monde à viser (le choix compact de D352 au-delà de quelques-uns). */
function monde(j) {
  if (!j?.enLigne) return "";
  return `<div class="filet"></div><div class="cb-sous">${enteteBloc("Dans le monde", "Un coup par joueur et par jour, dans sa ville ; jamais quelqu'un en focus.")}</div>
    ${j.cibles.length ? "" : `<p class="aide cb-sous">Personne d'autre pour l'instant.</p>`}
    ${j.cibles.length > SEUIL ? `<div class="chx-dans-monde">${choixCompact("joueurs", "Qui viser ?", j.cibles.map((c) => ({ id: c.id, titre: c.pseudo, sousTitre: c.ou,
      famille: c.bot ? "Bots" : "Joueurs", ville: c.ici ? "Ici" : "Ailleurs", refus: c.enFocus ? "En focus" : c.tenteAujourdhui ? "Déjà tenté aujourd'hui" : null })), { unite: "joueurs" })}
      ${choisi("joueurs") ? `<div class="rangee chx-ouvrir">${petit("Combines contre ce joueur", "ouvrirCible", { plein: true, donnees: { id: choisi("joueurs") } })}</div>` : ""}</div>` : ""}
    ${(j.cibles.length > SEUIL ? [] : j.cibles).map((c) => `<div class="filet"></div><div class="rangee cible cb-cible" data-cible="${esc(c.id)}">
      ${pastille2(c.bot ? "bot" : "personne", c.ici ? "var(--vente)" : "var(--c-controles, var(--accent))")}
      <div class="cb-delit-texte"><div class="cb-nom">${esc(c.pseudo)}${c.bot ? " · bot" : ""}</div>
        <div class="aide">${[c.ou, c.enFocus ? "en focus" : "", c.tenteAujourdhui ? "déjà tenté aujourd'hui" : ""].filter(Boolean).map(esc).join(", ")}</div></div>
      ${petit("Combines", "ouvrirCible", { donnees: { id: c.id } })}</div>`).join("")}`;
}

/** Un coup fait ou subi (CombinesJoueurs.swift). */
function ligneCoup(x, plainte) {
  return `<div class="filet"></div><div class="rangee coup-joueur cb-delit" data-coup="${esc(x.id)}">
      ${pastille2(x.icone === "watch.analog" ? "montre" : x.icone === "wallet.pass.fill" ? "portefeuille" : x.icone === "bolt.slash.fill" ? "sabotage" : x.icone === "car.fill" ? "vehicule" : "cambriolage",
        x.ton === "perte" ? "var(--c-danger)" : x.ton === "gain" ? "var(--argent)" : "var(--vente)")}
      <div class="cb-delit-texte">
        <span class="cb-nom">${esc(x.nom)}</span>
        <span class="aide">Jour ${x.jour}${x.qui ? (plainte ? `, c'était ${esc(x.qui)}` : `, contre ${esc(x.qui)}`) : ""}</span>
        ${x.detail ? `<span class="cb-corps-texte">${esc(x.detail)}</span>` : ""}
        <span class="${tonCouleur(x.ton)} statut cb-note">${esc(x.statut)}</span></div>
      ${plainte ? `<div class="vengeance">
        ${x.peutPorterPlainte ? petit("Porter plainte", "porterPlainte", { plein: true, donnees: { id: x.id } }) : ""}
        ${x.refusRiposte == null ? petit(`Riposter${x.risqueRiposte != null ? ` · ${Math.round(x.risqueRiposte * 100)} %` : ""}`, "riposter", { donnees: { id: x.id } }) : ""}
        ${x.refusDetective == null ? petit("Détective", "detective", { donnees: { id: x.id } }) : x.detective === "en_cours" ? `<span class="aide">Détective en cours</span>` : ""}
      </div>` : ""}
    </div>`;
}

function subis(j) {
  if (!j.subis.length) return "";
  return `<div class="filet"></div><div class="cb-sous">${enteteBloc("On t'a visé", "Une plainte n'aboutit pas toujours, faute de preuves ; si elle aboutit, tu es remboursé et tu sais qui. Tu peux aussi riposter sans savoir qui c'est (une fois par coup), ou payer un détective : s'il trouve, tu sais qui ; le voleur apprend qu'on enquête, jamais par qui.")}
    ${j.prixDetective != null ? `<p class="aide pr-detective">Un détective : ${montant(j.prixDetective)}, trois chances sur cinq de trouver.</p>` : ""}</div>
    ${j.subis.map((x) => ligneCoup(x, true)).join("")}`;
}

function faits(j) {
  if (!j?.faits.length) return "";
  return `<div class="cb-sous">${enteteBloc("Tes coups")}</div>${j.faits.map((x) => ligneCoup(x, false)).join("")}`;
}

/** RNT-370 : te protéger (SectionProtections) : chez toi, tes garages, le coffre renforcé, les assurances (css/pages/combines.css). */
function sectionProtections(p) {
  const rangee = (nom, detail, effet, bouton) => `<div class="rangee pr-choix"><div class="pr-texte">
      <span class="pr-nom">${esc(nom)}</span><p class="aide">${esc(detail)}</p>${effet ? `<span class="gain pr-effet">${esc(effet)}</span>` : ""}</div>
      <div class="pr-bouton">${bouton}</div></div>`;
  const choix = (c, lieu, bloque) => {
    const [, sorte] = c.id.split("|");
    return rangee(c.nom, c.detail, c.effet + (c.semaine > 0 ? ` · ${montant(c.semaine).replace(/<[^>]*>/g, "")} par semaine` : ""),
      c.actif ? petit("Retirer", "proteger", { donnees: { lieu, sorte, niveau: "0" } })
        : petit(c.prix > 0 ? montant(c.prix) : "Installer", "proteger", { plein: !bloque, desactive: bloque, donnees: { lieu, sorte, niveau: String(c.niveau) } }));
  };
  const refus = (r) => (r ? `<div class="alerte pr-refus">${esc(r)}</div>` : "");
  const lieux = p.lieux.map((l) => `<div class="filet"></div><div class="pile pr-bloc lieu-protege" data-lieu="${esc(l.id)}">
      <span class="pr-titre">${esc(l.nom)}</span><p class="aide resume">${esc(l.resume)}</p>${refus(l.refus)}
      ${[...l.alarmes, ...l.gardiens].map((c) => choix(c, l.id, !!l.refus)).join("")}</div>`).join("");
  const renforts = `<div class="filet"></div><div class="pile pr-bloc"><span class="pr-titre">Coffre renforcé</span>${refus(p.refusRenfort)}
      ${p.renforts.map((c) => rangee(`${c.niveau}. ${c.nom}`, c.detail, c.effet, c.actif ? `<span class="t2 pr-actif">En place</span>` : c.prix > 0
        ? petit(montant(c.prix), "renforcerCoffre", { plein: !p.refusRenfort, desactive: !!p.refusRenfort, donnees: { niveau: String(c.niveau) } }) : "")).join("")}</div>`;
  const assurances = p.assurances.map((a) => `<div class="filet"></div><div class="pile pr-bloc assurance" data-risque="${esc(a.id)}">
      <span class="pr-titre">Assurance : ${esc(a.nom)}</span><p class="aide">${esc(a.detail)}</p>
      ${a.formules.map((f) => rangee(f.nom, f.detail, "", f.actif ? petit("Résilier", "assurer", { donnees: { risque: a.id } })
        : petit(`${montant(f.prix)}/sem.`, "assurer", { plein: p.enLigne, desactive: !p.enLigne, donnees: { risque: a.id, formule: f.id.split("|")[1] } }))).join("")}</div>`).join("");
  return `<div class="pr-entete">${enteteBloc("Te protéger", "Une alarme ou un gardien font prendre un voleur plus souvent, et le font parfois fuir les mains vides. Les autres voient tes niveaux, jamais ce que tu as.")}
    ${p.coutSemaine > 0 ? `<div class="t2 pr-semaine">Chaque dimanche : ${montant(p.coutSemaine)}</div>` : ""}</div>
    ${lieux}${renforts}${assurances}`;
}

/** La feuille d'une cible (FeuilleCombinesJoueur) : chaque coup, son risque en clair, ou le refus. */
function feuilleCible(c) {
  return `<div class="pile cb-feuille">
    <p class="aide">${[c.ou, c.bot ? "bot" : "", c.enFocus ? "en focus" : "", `ton niveau : ${c.niveau}`].filter(Boolean).map(esc).join(" · ")}</p>
    <p class="aide">Le coup se joue ici ; il le découvre à sa prochaine connexion, et ce que tu touches dépend de ce qu'il a vraiment. Il ne saura qui c'était que si sa plainte aboutit.</p>
    ${c.coffre ? carteCoffreCible(c.coffre) : "" /* D347 : son coffre, à ouvrir soi-même */}
    ${groupes(c.possibilites).map(([coup, l]) => l.length > SEUIL
      // D352 : beaucoup de cibles pour un même coup (ses boîtes, ses véhicules) : le choix compact, puis la carte choisie.
      ? choixCompact(`cible-${c.id}-${coup}`, coup === "sabotage" ? "Quelle boîte saboter ?" : "Quel véhicule voler ?", l.map(elementChoix),
          { unite: coup === "sabotage" ? "boîtes" : "véhicules" }) + (l.filter((p) => p.id === choisi(`cible-${c.id}-${coup}`)).map(cartePossibilite).join(""))
      : l.map(cartePossibilite).join("")).join("")}
  </div>`;
}

/** Les possibilités par coup, dans l'ordre du moteur. */
function groupes(l) {
  const m = new Map();
  for (const p of l) m.set(p.coup, [...(m.get(p.coup) ?? []), p]);
  return [...m.entries()];
}

const elementChoix = (p) => ({ id: p.id, titre: p.cible ?? p.nom, famille: p.famille, ville: p.villeNom, valeur: p.valeur, etoiles: p.etoiles, km: p.km, refus: p.refus });
const ICONE_COUP_JOUEUR = { portefeuille: "portefeuille", montre: "montre", sabotage: "sabotage", cambriolage: "cambriolage", vehicule: "vehicule" };

/** Une possibilité : le coup, son risque en clair, ou le refus. */
function cartePossibilite(p) {
  const icone = ICONE_COUP_JOUEUR;
  return carte(`<div class="pile possibilite cb-possibilite${p.refus ? " terne" : ""}" data-id="${esc(p.id)}">
      <div class="rangee cb-delit-tete">
        ${pastille2(icone[p.coup], p.grave ? "var(--c-danger)" : "var(--vente)")}
        <div class="cb-delit-texte">
          <div class="rangee cb-nom-ligne"><span class="cb-nom">${esc(p.nom)}</span>${p.grave ? badgeGrave() : ""}</div>
          <p class="aide">${esc(p.detail)}</p>
          ${ligneGain(esc(p.gain))}
        </div>
        <div class="cb-bouton">${petit("Tenter", "tenter", { plein: !p.refus, desactive: !!p.refus, donnees: { coup: p.coup, ...(p.objet ? { objet: p.objet } : {}) } })}</div>
      </div>
      ${jaugeRisque(p.risque.risque)}
      ${listeFacteurs(p.risque)}
      ${p.echec > 0 ? `<p class="alerte echec">Ses protections le font échouer ${Math.round(p.echec * 100)} % du temps. Réussite : ${Math.round(p.reussite * 100)} %.</p>` : ""}
      <p class="aide">Pris : ${montant(p.amende)} d'amende, ${p.grave ? "deux points" : "un point"} au casier.</p>
      ${p.refus ? `<div class="alerte refus cb-note">${esc(p.refus)}</div>` : ""}
    </div>`, { pad: true });
}

// MARK: D347 — le coffre d'une cible : le clavier (un Mastermind) ou la molette (à l'oreille)

const duree = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)} min${sec % 60 ? ` ${String(sec % 60).padStart(2, "0")}` : ""}` : `${sec} s`);

/** La carte du coffre dans la feuille d'une cible. */
function carteCoffreCible(k) {
  const x = k.tentative;
  const etat = !x ? "" : x.resultat === "ouvert" || x.resultat === "perce" ? "Ouvert : cambriole maintenant" : x.resultat === "temps" ? "Trop tard aujourd'hui"
    : x.resultat ? "Raté pour aujourd'hui" : "Tu es devant";
  const outils = [k.stethoscope && k.serrure === "molette" ? "stéthoscope" : "", k.lampeUV && k.serrure === "code" ? "lampe UV" : "", k.perceuse ? "perceuse" : ""].filter(Boolean);
  return carte(`<div class="cc-carte">
    <div class="rangee entre"><span class="libelle">Son coffre : ${esc(k.serrureNom)}</span><span class="chiffres t2">${duree(k.secondes)}</span></div>
    <p class="aide">${esc(k.detail)}. Sans l'ouvrir, le cambriolage ne prend que ce qui traîne.${outils.length ? ` Tes outils : ${outils.join(", ")}.` : ""}</p>
    ${etat ? `<div class="cc-etat ${x.resultat === "ouvert" || x.resultat === "perce" ? "gain" : x.resultat ? "perte" : ""}">${esc(etat)}</div>` : ""}
    ${petit(x && !x.resultat ? "Reprendre" : "Attaquer le coffre", "coffreCible", { plein: !k.refus, desactive: !!k.refus && !(x && !x.resultat) })}
    ${k.refus && !(x && !x.resultat) ? `<p class="aide">${esc(k.refus)}</p>` : ""}
  </div>`, { pad: true });
}

/** La feuille du coffre : on s'y met, puis chaque geste passe par le serveur (s'il connaît le code), sinon la partie juge. */
async function ouvrirCoffreCible(ctx, id) {
  let c = await ctx.tableau("combinesCible", { id });
  if (!c?.coffre) return;
  let minuteur = null;
  let saisie = "";
  let molette = null; // le chiffre écouté en dernier
  const relire = async (x) => { c = await ctx.tableau("combinesCible", { id }) ?? c; x?.redessiner?.(); };
  const geste = async (x, g, texte = "") => {
    const ok = await ctx.decider("combines", { crochetage: { _0: g } }, { succes: texte, fermer: false });
    await relire(x);
    return ok;
  };
  const tic = () => {
    const el = document.getElementById("cc-temps");
    const fin = c?.coffre?.fin;
    if (!el || !fin) return;
    const reste = Math.max(0, Math.round((fin - Date.now()) / 1000));
    el.textContent = reste > 0 ? duree(reste) : "Trop tard";
    el.classList.toggle("alerte", reste <= 20);
    const part = c.coffre.secondes ? reste / c.coffre.secondes : 0;
    document.getElementById("cc-jauge")?.style.setProperty("--part", part.toFixed(3));
  };
  ctx.feuille({
    titre: `Le coffre de ${c.pseudo}`,
    rendu: () => renduCoffre(c.coffre, { saisie, molette }),
    actions: {
      async ccCommencer(x) {
        const uv = await coffreJuger(id, { sorte: "uv", lampe: !!c.coffre.lampeUV });
        await geste(x, { commencer: { cible: id, ...(uv ? { uv: uv.uses ?? [] } : {}) } });
      },
      async ccTouche(x, b) {
        const k = b.dataset.touche, n = c.coffre.chiffres;
        if (k === "⌫") saisie = saisie.slice(0, -1); else if (saisie.length < n) saisie += k;
        x.redessiner();
        if (saisie.length < n) return;
        const code = saisie; saisie = "";
        const r = await coffreJuger(id, { sorte: "essai", code });
        await geste(x, { essayer: { code, ...(r ? { bien: r.bien, mal: r.mal } : {}) } });
      },
      async ccEcouter(x, b) {
        const chiffre = Number(b.dataset.chiffre), k = c.coffre;
        molette = chiffre;
        const r = await coffreJuger(id, { sorte: "ecoute", rang: k.tentative?.trouves?.length ?? 0, chiffre, stethoscope: !!k.tentative?.stethoscope, portee: 2 });
        navigator.vibrate?.(r?.force >= 2 ? 18 : 4);
        await geste(x, { ecouter: { chiffre, ...(r ? { force: r.force } : {}) } });
      },
      async ccVerrouiller(x) {
        if (molette == null) return;
        const k = c.coffre;
        const r = await coffreJuger(id, { sorte: "cran", rang: k.tentative?.trouves?.length ?? 0, chiffre: molette });
        const avant = k.tentative?.trouves?.length ?? 0;
        await geste(x, { verrouiller: { chiffre: molette, ...(r ? { juste: !!r.juste } : {}) } });
        if ((c.coffre.tentative?.trouves?.length ?? 0) > avant) navigator.vibrate?.([10, 40, 10]);
        molette = null; x.redessiner();
      },
      ccPercer: (x) => geste(x, { percer: {} }, "Percé : tout le quartier l'a entendu"),
      ccPartir: async (x) => { if (!c.coffre.tentative?.resultat) await geste(x, { abandonner: {} }); ctx.fermerFeuille(); },
    },
  });
  minuteur = setInterval(() => { if (!document.getElementById("cc-temps")) { clearInterval(minuteur); return; } tic(); }, 500);
  tic();
}

/** Ce que montre la feuille du coffre, selon la serrure et la tentative. */
function renduCoffre(k, { saisie, molette }) {
  const x = k.tentative;
  if (!x) {
    return `<div class="pile cc-feuille">
      <p class="aide">${esc(k.aide)}</p>
      <p class="aide">Temps laissé par ses protections : <b class="chiffres">${duree(k.secondes)}</b>. Un seul essai par jour.</p>
      ${k.refus ? `<div class="alerte refus">${esc(k.refus)}</div>` : ""}
      ${bouton("S'y mettre", "ccCommencer", { desactive: !!k.refus })}
    </div>`;
  }
  const fini = !!x.resultat;
  const ouvert = x.resultat === "ouvert" || x.resultat === "perce";
  const tete = `<div class="cc-tete"><span id="cc-temps" class="chiffres cc-temps">${fini ? "" : duree(k.secondes)}</span>
    <span class="jauge-fine cc-jauge" id="cc-jauge"><i></i></span></div>`;
  const fin = fini ? `<div class="cc-resultat ${ouvert ? "gain" : "perte"}">${ouvert ? (x.resultat === "perce" ? "Percé. Cambriole maintenant : tout le quartier l'a entendu." : "Ouvert. Cambriole maintenant, avant qu'il ne rentre.")
      : x.resultat === "temps" ? "Trop tard : quelqu'un arrive, tu dois partir." : "Raté : tu n'en tireras rien aujourd'hui."}</div>` : "";
  const corps = k.serrure === "code" ? clavierCoffre(k, x, saisie, fini) : moletteCoffre(k, x, molette, fini);
  return `<div class="pile cc-feuille">${fini ? "" : tete}${fin}${corps}
    <div class="choix">${!fini && k.perceuse ? petit("Percer", "ccPercer") : ""}${petit(fini ? "Fermer" : "Partir", "ccPartir")}</div></div>`;
}

/** Le clavier : les essais passés (● bien placé, ○ bon chiffre ailleurs), les cases, dix touches (les usées en UV). */
function clavierCoffre(k, x, saisie, fini) {
  const reste = (x.essaisMax ?? 8) - x.essais.length;
  const uv = new Set(x.uv ?? []);
  const essais = x.essais.map((e) => `<div class="cc-essai"><span class="chiffres">${esc(e.code.split("").join(" "))}</span>
    <span class="cc-pions" aria-label="${e.bien} bien placé${e.bien > 1 ? "s" : ""}, ${e.mal} mal placé${e.mal > 1 ? "s" : ""}">${"<i class=\"bien\"></i>".repeat(e.bien)}${"<i class=\"mal\"></i>".repeat(e.mal)}${"<i></i>".repeat(Math.max(0, k.chiffres - e.bien - e.mal))}</span></div>`).join("");
  const touches = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
  return `${essais ? `<div class="cc-essais">${essais}</div>` : ""}
    ${fini ? "" : `<div class="pc-cases">${Array.from({ length: k.chiffres }, (_, i) => `<i class="${i < saisie.length ? "plein" : ""}"></i>`).join("")}</div>
    <p class="aide centre">${reste} essai${reste > 1 ? "s" : ""} · ● à sa place, ○ bon chiffre ailleurs${uv.size ? " · la lampe UV allume les touches usées" : ""}</p>
    <div class="touches">${touches.map((t) => t ? `<button data-action="ccTouche" data-touche="${t}" class="${uv.has(Number(t)) ? "uv" : ""}" aria-label="${t === "⌫" ? "effacer" : t}">${t}</button>` : "<span></span>").join("")}</div>`}`;
}

/** La molette : dix crans en rond ; toucher un cran l'écoute (plus fort près du bon) ; verrouiller le dernier écouté. */
function moletteCoffre(k, x, molette, fini) {
  const n = k.chiffres, ecoutes = new Map((x.ecoutes ?? []).map((e) => [e.chiffre, e.force]));
  const crans = Array.from({ length: 10 }, (_, d) => {
    const a = (d / 10) * 2 * Math.PI - Math.PI / 2;
    const f = ecoutes.get(d);
    return `<button class="cc-cran${molette === d ? " choisi" : ""}${f != null ? ` f${f}` : ""}" data-action="ccEcouter" data-chiffre="${d}" ${fini ? "disabled" : ""}
      style="--x:${(50 + 40 * Math.cos(a)).toFixed(2)}%;--y:${(50 + 40 * Math.sin(a)).toFixed(2)}%" aria-label="Cran ${d}${f != null ? `, clic ${["muet", "faible", "net", "fort"][f]}` : ""}">${d}</button>`;
  }).join("");
  const f = molette != null ? ecoutes.get(molette) : null;
  return `<div class="cc-trouves" aria-label="Crans trouvés">${Array.from({ length: n }, (_, i) => `<i class="${i < x.trouves.length ? "plein" : i === x.trouves.length && !fini ? "courant" : ""}">${i < x.trouves.length ? x.trouves[i] : ""}</i>`).join("")}</div>
    <div class="cc-molette">${crans}<span class="cc-centre">${molette != null ? `<b class="chiffres">${molette}</b><small>${["rien", "un souffle", "un clic", "un claquement"][f ?? 0]}</small>` : "<small>Touche un cran pour l'écouter</small>"}</span></div>
    ${fini ? "" : `<p class="aide centre">Cran ${x.trouves.length + 1} sur ${n} · ${x.erreurs} erreur${x.erreurs > 1 ? "s" : ""} sur ${x.erreursMax ?? 3}${x.stethoscope ? " · au stéthoscope, les voisins s'entendent" : ""}</p>
    ${bouton(molette != null ? `Verrouiller le ${molette}` : "Verrouiller ce cran", "ccVerrouiller", { desactive: molette == null })}`}`;
}

// MARK: La corruption (D128, D404)

/** D404 : le prix (selon ta fortune), le risque et ce qui l'empêche viennent du moteur (TableauIllegal.corruptions). */
function corruption(t) {
  const controles = (t.controles ?? []).map((x) => rangeeDelit({
    icone: "bouclier", teinte: "var(--c-danger)", nom: "Arranger le contrôleur", grave: false,
    detail: "Réussi, il ne relève rien. Pris : une amende lourde, du soupçon, et le contrôle passe quand même.",
    gain: `<p class="aide">${esc(x.titre)}, ${esc(x.boite)}, à ${new Date(x.passage).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}</p>${ligneGain(`Pot-de-vin : ${montant(x.cout)}`, SF.enveloppe, "alerte")}`,
    risque: x.risque, terne: false,
    bouton: petit("Payer", "soudoyer", { plein: true, donnees: { id: String(x.id) }, desactive: t.prisonJours > 0 }),
  })).join("");
  const lignes = (t.corruptions ?? []).map((c) => rangeeDelit({
    icone: ICONE_CORRUPTION[c.id] ?? "enveloppe", teinte: "var(--c-danger)", nom: c.nom, grave: true, detail: c.detail,
    gain: ligneGain(`Pot-de-vin : ${montant(c.cout)}`, SF.enveloppe, "alerte") + (c.refus && !c.fait ? `<p class="aide">${esc(c.refus)}</p>` : ""),
    risque: c.risque, terne: c.fait || !!c.refus,
    bouton: petit(c.fait ? "Demain" : "Payer", "corrompre", { plein: !c.fait && !c.refus, donnees: { id: c.id }, desactive: c.fait || !!c.refus }),
  })).join("");
  if (!controles && !lignes) return "";
  return `<div class="filet"></div><div class="cb-sous">${enteteBloc("Corruption", "Le pot-de-vin se paie en liquide : ton argent sale d'abord, puis ton liquide, puis ton compte. Son prix suit ta fortune. Un juge, seul, s'achète en prison.")}</div>${controles}${lignes}`;
}

// MARK: Le blanchiment

function blanchiment(t) {
  if (t.argentSale <= 0) return `<p class="aide cb-sous">Pas d'argent sale à blanchir.</p>`;
  const lignes = t.blanchiment.map((b) => `<div class="rangee entre"><div><div class="cb-nom">${esc(b.nom)}</div><div class="aide">Encore ${montant(b.reste)} cette semaine</div></div>
    ${petit("Blanchir", "blanchir", { donnees: { id: String(b.id) }, desactive: b.reste <= 0 })}</div>`).join("");
  return `<div class="pile cb-bloc">
    ${enteteBloc("Blanchir", `Faire passer l'argent sale pour des ventes d'une de tes boîtes : il en ressort ${pct(1 - t.decoteBlanchiment)}, propre, dans sa trésorerie. Une boîte ne justifie pas plus de la moitié de ce qu'elle vend par semaine.`)}
    ${t.blanchiment.length ? lignes : `<div class="alerte cb-note">Il te faut une boîte.</div>`}</div>`;
}

// MARK: Ce qui tourne au noir

function auNoir(t) {
  if (!t.auNoir.length) return "";
  const lignes = t.auNoir.map((l) => `<div class="filet"></div><div class="rangee cb-noir">
      <span class="pastille" style="--c:var(--vente)">${I(SF.oeilBarre, 17)}</span><span class="cb-noir-texte">${esc(l)}</span></div>`).join("");
  return `<div class="filet"></div><div class="cb-sous cb-entete"><span class="rangee"><span class="libelle">Ce qui tourne au noir</span><span class="alerte chiffres cb-compte">${t.auNoir.length}</span></span>
      ${aideQ("Chaque contrôle peut le trouver ; plus il y en a, plus le soupçon monte.", { titre: "ce qui tourne au noir" })}</div>${lignes}`;
}

// MARK: L'extrait de casier, sur papier (D358 : plus petit, grain léger, typographie nette, une seule ombre)

function casier(t, pseudo) {
  const n = Math.max(t.pointsPrison, t.points);
  const cases = Array.from({ length: n }, (_, i) => {
    const plein = i < t.points;
    const cadenas = i === t.pointsPrison - 1 ? `<span class="cb-cadenas">${I(SF.verrou, 10)}</span>` : "";
    return `<span class="cb-case${plein ? " pleine" : ""}">${cadenas}</span>`;
  }).join("");
  const presque = t.points >= t.pointsPrison - 1 && t.points > 0;
  const lignes = t.casier.length
    ? t.casier.map((c) => `<div class="cb-p-ligne">
        <div class="cb-p-tete"><span class="cb-p-motif">${esc(c.motif)}</span>${c.amende > 0 ? `<span class="cb-p-amende">${variation(-c.amende)}</span>` : ""}</div>
        <div class="cb-p-detail">${c.jour < 0 ? "Avant la saison" : `Jour ${c.jour}`}${c.detail ? `, ${esc(c.detail)}` : ""}${c.prison > 0 ? `, ${c.prison} jours de prison` : ""}</div>
      </div>`).join("")
    : `<div class="cb-p-neant"><span>Néant</span><span class="cb-tampon">VIERGE</span></div>`;
  return `<div class="cb-papier" role="group" aria-label="Extrait de casier">
      <div class="cb-p-entete"><div><div class="cb-p-titre">Extrait de casier</div><div class="cb-p-detail">${pseudo ? `Bulletin n° 3, ${esc(pseudo)}` : "Bulletin n° 3"}</div></div>
        <span class="cb-p-ic">${I(SF.colonnes, 18)}</span></div>
      <div class="cb-p-points">${cases}<span class="cb-p-total">${t.points} point${t.points > 1 ? "s" : ""} sur ${t.pointsPrison}</span></div>
      <div class="cb-p-detail${presque ? " rouge" : ""}">${presque ? "Encore un délit et c'est la prison." : `À ${t.pointsPrison} points, la prison.`}</div>
      ${lignes}
    </div>`;
}
