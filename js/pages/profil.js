// ══════════════════════════════════════════════════════════════════════
//  Zone « profil » : ton profil (EcransProfil.swift, CarteNiveau de
//  EcranAccueil.swift) et le bilan de fin de saison (EcranSaisons.swift).
//  D394 : plus de page Collection (tout est dans Personnaliser mon profil).
//
//  Même grammaire que l'iPhone : une en-tête (pseudo, titre de profil, d'où
//  tu joues, patrimoine, avancée de la saison), puis des sections titrées
//  dans des cartes givrées. D388 : plus d'avatar, de cadre ni de titre de
//  saison (tout le profil se règle dans Personnaliser mon profil).
//  D395 : plus de palmarès (Personnaliser › Carte), ni de ligne Amis
//  (l'accueil) ni de ligne Bilan (sa tuile). D396 : plus de « Tu joues dans »
//  (Réglages › Mes mondes le montre) ; Personnaliser s'ouvre seulement par le
//  bouton du profil (plus de lien depuis le bilan).
//  D454 : le profil en cartes, la même structure que le profil d'un joueur
//  (joueurs.js, profil-cartes.js) : ta carte de profil (celle de
//  Personnaliser › Carte), Personnaliser, ton prestige et ta saison, ta
//  vitrine ; puis Tes biens, Boîtes et activité (dont Activité : salaires,
//  production, sanctions), Palmarès (ta courbe, tes classements, ton focus,
//  ton niveau, tes sessions) et Réglages (à la place de « Entre vous »).
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, variation, esc } from "../format.js?v=3e8bddd9";

/** « −13 643 € » avec le vrai signe moins, comme Montant.texte. */
const montant = (c) => montantBrut(c).replace("-", "\u2212");
import { entetePousse, carte, section, ligne, bouton, rail, courbe } from "../ui.js?v=3e8bddd9";
import { vibrer } from "../sons.js?v=3e8bddd9";
import { SYMBOLES, pct } from "./vie.js?v=3e8bddd9";
import * as T from "../titres.js?v=3e8bddd9"; // RNT-270 : le titre de profil sous le pseudo
import { listeRecompenses, vitrineChoisie } from "../vitrine.js?v=3e8bddd9"; // RNT-326
export { listeRecompenses, CLE_CARTE_VITRINE, vitrineChoisie } from "../vitrine.js?v=3e8bddd9";
import { devoiler, apercuCarte as apercuCarteMoi, lire as lireCosmetiques } from "./recompenses.js?v=3e8bddd9"; // RNT-231 ; D454 : ta carte en ticket
import { vitrineMusee as vitrineMuseeMoi } from "./series.js?v=3e8bddd9"; // D454 : ta vitrine
import { apercu } from "../cosmetiques.js?v=3e8bddd9";
import { carteFortune, badgeFortune } from "../cartes-fortune.js?v=3e8bddd9"; // RNT-276
import { grilleCartes, lignePrestige, stylesCartes } from "../profil-cartes.js?v=3e8bddd9"; // D454 : le profil en cartes
import * as L from "../enligne.js?v=3e8bddd9";
import * as J from "./joueurs.js?v=3e8bddd9"; // D454 : les pages des cartes, les mêmes que celles d'un joueur

// MARK: - Les réglages locaux

const lire = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

// MARK: - Petites briques

const ecranVide = (texte) => `<div class="vide" style="padding:80px 40px 0;font-size:15px">${texte}</div>`;
const pied = (t) => `<div class="aide" style="margin:8px 4px 0">${t}</div>`;
const tiret = "–";

/** Quelques chiffres côte à côte, séparés par des filets verticaux (BandeChiffres). */
const bandeChiffres = (elements) => `<div style="display:flex">${elements.map(([titre, valeur], i) => `
  ${i ? `<i style="width:1px;background:var(--filet);margin:14px 0"></i>` : ""}
  <div style="flex:1;min-width:0;padding:14px 16px"><div class="chiffres" style="font-size:19px">${valeur}</div><div class="aide">${titre}</div></div>`).join("")}</div>`;

/** Une rubrique qui ouvre une page (RubriqueReglages) ; `desactive` pour ce qui n'est pas encore sur le web. */
const rubrique = ({ icone, teinte, titre, resume, page = "", desactive = false }) => {
  const h = ligne({ titre: esc(titre), detail: resume, icone, teinte, page: desactive ? "" : page });
  return desactive ? h.replace('<div class="ligne">', '<div class="ligne" aria-disabled="true" style="opacity:.55">') : h;
};

// MARK: - CarteNiveau

function carteNiveau(x, profils) {
  const prochain = (profils ?? []).filter((p) => p.niveauEffectif > x.niveau).sort((a, b) => a.niveauEffectif - b.niveauEffectif)[0];
  return carte(`
    <div class="rangee entre" style="align-items:baseline">
      <span style="font-size:22px;font-weight:700">Niveau ${x.niveau}</span>
      <span class="chiffres t2" style="font-size:13px;letter-spacing:0">${x.seuilSuivant != null ? `${x.xp} / ${x.seuilSuivant} XP` : `${x.xp} XP`}</span>
    </div>
    <div style="height:6px;border-radius:99px;background:var(--filet2);margin:10px 0;overflow:hidden"><i style="display:block;height:100%;border-radius:99px;background:var(--or);width:max(6px, ${Math.round(Math.min(1, x.progression) * 100)}%)"></i></div>
    <div class="aide">${Math.round(x.heures)} h de focus</div>
    ${x.saisonDeTest ? `<div class="rangee alerte" style="align-items:flex-start;gap:6px;font-size:12px;font-weight:500;margin-top:10px"><span style="width:14px;flex:none;display:grid">${SYMBOLES.outil}</span>
      <span>Partie de test : pas de carte de fortune, ni record, ni expérience. Si c'était pour réparer une erreur du jeu, dis-le dans Réglages › Signaler : elle peut compter à nouveau.</span></div>`
      : x.exceptionTest ? `<div class="aide" id="pf-exception-test">Saison de test comptée par exception : cartes, défis et niveau arrivent comme d'habitude, et repartent à sa fin. Tes titres restent.</div>` : ""}
    ${prochain ? `<div class="legende" style="margin-top:10px">Prochain profil : ${esc(prochain.nom)}, au niveau ${prochain.niveauEffectif}.</div>` : ""}`, { pad: true });
}

// MARK: - Bilan

function tableauBilan(titre, lignes) {
  return `<div class="carte">
    ${titre ? `<div class="libelle" style="padding:16px">${titre}</div><div class="filet"></div>` : ""}
    ${lignes.map((l, i) => `${i ? `<div class="filet"></div>` : ""}<div class="rangee entre" style="padding:13px 16px;font-size:15px">
      <span class="t2">${esc(l.libelle)}</span><span class="chiffres" style="letter-spacing:0">${esc(l.valeur)}</span></div>`).join("")}
  </div>`;
}

const recordTexte = (b) => (b.recordAvant == null ? "Premier record"
  : b.nouveauRecord ? `Nouveau record, l'ancien était ${montant(b.recordAvant)}` : `Record à battre : ${montant(b.recordAvant)}`);

// MARK: - Les pages

/** D454 : mon profil en cartes (TableauMonProfil) : en ligne, ma fiche ; sinon, ma partie telle que je la publierais. */
async function monProfil(ctx) {
  await L.synchroniser(ctx).catch(() => false);
  J.styles();
  const r = await ctx.jouer("enLigne.monProfil", L.monde.code ? J.parametres() : {}, { silencieux: true }).catch(() => null);
  return r?.profil ?? null;
}

/** Les pages des cartes de ton profil, dans la pile de l'onglet. */
const PAGES_CARTES = { biens: "profilBiens", activite: "profilActivite", palmares: "profilPalmares", reglages: "reglages" };

export const pages = {
  profil: {
    titre: "Profil",
    css: ["compte", "mondes", "enligne", "couple", "cosmetiques", "series"], // D354 : « Qui tu es » (css/pages/couple.css) // lot A : css/pages/compte.css ; D454 : la carte (cosmetiques.css), la vitrine (series.css)
    async donnees(ctx) {
      stylesCartes();
      const [p, r, c, s, monde, paysListe, profils, cat, identite, t, prestige, mp] = await Promise.all([
        ctx.tableau("profil"), ctx.tableau("recompenses"), ctx.tableau("collection"),
        ctx.tableau("courbe", { periode: "saison" }), ctx.tableau("monde"), ctx.balance("monde"),
        ctx.jouer("profils", {}, { silencieux: true }), T.catalogue(ctx),
        ctx.tableau("identiteCouple"), // D354
        lireCosmetiques(ctx).catch(() => null), // D454 : ta carte en ticket
        ctx.tableau("prestige").catch(() => null), // D441
        monProfil(ctx), // D454
      ]);
      const vit = vitrineChoisie(c);
      const place = prestige?.moi && ctx.etat.compte && !ctx.etat.horsLigne ? await L.maPlaceGenerale().catch(() => null) : null;
      return { identite, p, r, c, t, prestige, place, mien: mp, titreProfil: T.monTitre(cat), carteVitrine: vit.palier, nomCarteVitrine: vit.nom, depart: s?.valeurs?.[0] ?? null, monde, pays: paysListe?.pays ?? [], profils: profils?.profils ?? [] };
    },
    rendu(d, ctx) {
      const jeu = ctx.etat.jeu;
      if (!d.p || !jeu) return `${entetePousse("Profil")}${ecranVide("Ton profil s'ouvre avec ta première saison.")}`;
      const { p, c } = d;
      const enSaison = !!jeu.saison, terminee = !!jeu.terminee;
      const pseudo = ctx.etat.compte?.pseudo || "Choisis un pseudo";
      // « 🇧🇪 Bruxelles, Commerçant installé » : le pays, la ville et le profil de la saison.
      const ici = d.monde?.lieux?.find((l) => l.residence) ?? d.monde?.ici;
      const drapeau = d.pays.find((x) => x.nom === ici?.pays)?.drapeau;
      const endroit = enSaison ? [drapeau, d.monde?.residence].filter(Boolean).join(" ") : "";
      const lieu = [endroit, p.profil].filter(Boolean).join(", ");
      const part = p.dureeJours > 0 ? p.jour / p.dureeJours : 0;
      const patrimoine = jeu.accueil?.patrimoine ?? 0;
      const depart = d.depart ?? patrimoine;
      const progression = depart > 0 ? patrimoine / depart - 1 : 0;
      const f = d.mien?.fiche ?? null;
      const rangMonde = f && f.rang > 0 && f.total > 1 ? `${f.rang === 1 ? "1er" : `${f.rang}e`} sur ${f.total}` : "";

      // D454 : ta carte de profil, telle que les autres la voient (Personnaliser › Carte), et d'où tu joues dessous.
      const tete = d.t ? `${apercuCarteMoi(ctx, d.t, { id: "pf-carte", titreProfil: d.titreProfil, carte: d.carteVitrine, record: p.meilleurScore ?? null, badges: c?.badges, affiches: c?.affiches })}
          ${lieu ? `<p class="aide pf-lieu">${esc(lieu)}</p>` : ""}`
        : `<div class="carte pf-carte-simple"><b>${esc(pseudo)}</b>${T.ligneTitre(d.titreProfil)}${lieu ? `<div class="aide">${esc(lieu)}</div>` : ""}</div>`;
      const m = d.prestige?.moi;
      const prestige = m ? `${lignePrestige(`${m.nom} · niv. ${m.niveau}`, m.points, d.place)}<div class="filet pf-filet"></div>` : "";
      const suite = enSaison ? `
        <div class="rangee entre"><span class="libelle">${terminee ? "Saison terminée" : "Ta saison"}</span>${rangMonde ? `<span class="aide">${esc(rangMonde)}</span>` : ""}</div>
        <div class="chiffres pf-patrimoine">${montant(patrimoine)}</div>
        <div class="pf-depuis ${patrimoine >= depart ? "gain" : "perte"}">${variation(patrimoine - depart)} depuis le départ (${pct(progression, { signe: true })})${f && f.variationSemaine ? ` · ${variation(f.variationSemaine)} en 7 jours` : ""}</div>
        <div class="pf-avance">
          <div class="rangee entre pf-jour"><span>${terminee ? "Saison terminée" : `Jour ${p.jour} sur ${p.dureeJours}`}</span>
            <span class="chiffres">${pct(terminee ? 1 : part)}</span></div>
          <div class="pf-rail">${rail(terminee ? 1 : part)}</div>
        </div>`
        : `<div class="aide">Aucune saison en cours : choisis un profil de départ pour commencer.</div>`;
      const cartes = d.mien?.cartes ?? [];
      return `
      ${entetePousse("Profil")}
      <div class="so-page jr-page pf-page"><div class="so-deux">
        <div class="pile jr-colonne">
          ${tete}
          ${bouton("Personnaliser", "", { genre: "secondaire", page: "personnaliser" })}
          <div class="carte pc-tete pf-saison">${prestige}${suite}</div>
          ${!enSaison || terminee ? bouton(enSaison ? "Commencer une nouvelle saison" : "Commencer ma première saison", "nouvelleSaison") : ""}
        </div>
        <div class="pile jr-colonne">
          ${d.mien?.musee ? vitrineMuseeMoi(d.mien.musee, true) : ""}
          ${grilleCartes(cartes, (x) => (PAGES_CARTES[x.id] ? { page: PAGES_CARTES[x.id] } : null))}
        </div>
      </div></div>`;
    },
  },

  // D454 : « Tes biens » : tes maisons, véhicules, bateaux, avions, montres, ta bourse (tes boîtes : Boîtes et activité).
  profilBiens: {
    titre: "Tes biens",
    css: ["compte", "enligne"],
    async donnees(ctx) { return { m: await monProfil(ctx) }; },
    rendu: (d) => J.rendreBiens(d.m?.familles ?? [], { moi: true }),
    actions: J.actionsBiens((d) => d?.m?.familles),
  },

  // D454 : « Boîtes et activité » : tes boîtes, ce que tu fais ; la page Activité (salaires, production, sanctions).
  profilActivite: {
    titre: "Boîtes et activité",
    css: ["compte", "enligne"],
    async donnees(ctx) { stylesCartes(); return { m: await monProfil(ctx) }; },
    rendu(d) {
      const plus = carte(rubrique({ icone: SYMBOLES.liste, teinte: "#34C88A", titre: "Activité", resume: "Salaires, production, sanctions", page: "activite" }));
      return `${entetePousse("Boîtes et activité")}<div class="so-page jr-page"><div class="pile jr-colonne pc-page">
        ${J.corpsActivite({ moi: true, familles: d.m?.familles ?? [], statut: d.m?.statut ?? [], faits: d.m?.faits ?? [], plus })}</div></div>`;
    },
  },

  // D454 : « Palmarès » : ta courbe, tes classements, ton focus (en ligne) ; ton niveau, tes sessions ; ton palmarès des
  // saisons et ton record restent dans Personnaliser › Carte (D395), une seule fois : on y va d'ici.
  profilPalmares: {
    titre: "Palmarès",
    css: ["compte", "enligne"],
    async donnees(ctx) {
      stylesCartes();
      const [m, p, profils] = await Promise.all([monProfil(ctx), ctx.tableau("profil"), ctx.jouer("profils", {}, { silencieux: true })]);
      return { m, p, profils: profils?.profils ?? [] };
    },
    rendu(d, ctx) {
      const jeu = ctx.etat.jeu;
      const p = d.p;
      const niveau = carteNiveau(jeu?.experience ?? { niveau: 1, xp: 0, progression: 0, heures: 0 }, d.profils);
      const sessions = p && jeu?.saison ? `<div>${section("Tes sessions").replace('class="section"', 'class="section pf-section"')}
          ${carte(bandeChiffres([["Focus", `${p.heuresFocus} h`], ["Sessions", `${p.sessions}`], ["Tenues", p.tenues != null ? pct(p.tenues) : tiret]]))}
          ${pied("Tenues : les sessions menées au bout, sur toutes celles commencées.")}</div>` : "";
      // D396 : Personnaliser ne s'ouvre que par le bouton du profil (RNT-393) : ici, on dit seulement où c'est.
      const lien = `<p class="aide jr-maj">Tes saisons passées et ton record : Personnaliser › Carte.</p>`;
      const c = J.corpsPalmares({ f: d.m?.fiche ?? null, moi: true, plus: `${niveau}${sessions}${lien}` });
      return `${entetePousse("Palmarès")}<div class="so-page jr-page"><div class="so-deux">
        ${c.gauche ? `<div class="pile jr-colonne pc-page">${c.gauche}</div>` : ""}<div class="pile jr-colonne pc-page">${c.droite}</div></div></div>`;
    },
  },

  bilan: {
    titre: "Bilan",
    css: "cosmetiques",
    async donnees(ctx) {
      const [b, r, s] = await Promise.all([ctx.tableau("bilan"), ctx.tableau("recompenses"), ctx.tableau("courbe", { periode: "saison" })]);
      return { b, r, s };
    },
    rendu(d) {
      const b = d.b;
      if (!b) return `${entetePousse("")}${ecranVide("Le bilan s'affiche à la fin de la saison.")}`;
      // La courbe de la saison : la série du patrimoine, du départ à la clôture.
      const v = d.s?.valeurs ?? [];
      const bas = Math.min(...v), haut = Math.max(...v);
      const courbeSaison = v.length > 2 && haut > bas ? carte(`
        <div class="libelle">Ta saison</div>
        <div style="margin-top:10px">${courbe(v.map((x) => (x - bas) / (haut - bas)), null, { hauteur: 120 })}</div>
        <div class="rangee entre" style="margin-top:10px"><span class="aide">Jour 1</span><span class="aide">Plus haut ${montant(haut)}</span></div>`, { pad: true }) : "";
      // Ce que la saison a gagné : badges nouveaux, cartes et icônes, accents (D388 : plus de cadres) ;
      // D393 (Arthur 16/11) : les titres de saison gagnés, de nouveau, en souvenir (rien à choisir).
      const nouveaux = new Set(b.badgesGagnes);
      const r = d.r ?? { accents: [], titres: [] };
      const gagnes = (r.accents ?? []).map((x) => [`Accent ${x.nom}`, x])
        .filter(([, x]) => x.gagne && nouveaux.has(x.condition)).map(([t]) => t);
      const titres = (r.titres ?? []).filter((x) => x.gagne && nouveaux.has(x.condition)).map((x) => `Titre « ${x.nom} »`);
      const garde = b.badgesGagnes.length || b.debloque.length || gagnes.length || titres.length ? carte(`
        <div class="libelle">Ce que tu gardes</div>
        <div style="display:grid;gap:10px;margin-top:10px">
          ${b.badgesGagnes.map((n) => `<div class="rangee gain" style="gap:8px;font-size:14px;font-weight:600"><span style="width:16px;display:grid">${SYMBOLES.etoile}</span>${esc(n)}</div>`).join("")}
          ${titres.map((n) => `<div class="rangee pf-titre-souvenir">${SYMBOLES.rosette}${esc(n)}, en souvenir</div>`).join("")}
          ${[...b.debloque, ...gagnes].map((n) => `<div class="rangee" style="gap:8px;font-size:14px;font-weight:600"><span style="width:16px;display:grid;color:var(--accent)">${SYMBOLES.verrou}</span>${esc(n)} débloqué</div>`).join("")}
        </div>`, { pad: true }) : "";
      return `
      ${entetePousse("")}
      <div class="pile" style="gap:18px">
        <div style="text-align:center;display:grid;gap:8px;padding-top:22px">
          <div style="font-size:14px;color:var(--texte2)">${esc(b.titre)}</div>
          <div class="chiffres" style="font-size:46px;line-height:1.05;white-space:nowrap">${montant(b.score)}</div>
          <div style="font-size:14px;font-weight:600" class="${b.nouveauRecord ? "gain" : "t2"}">${recordTexte(b)}</div>
          <div class="aide">Score pondéré : ${montant(b.scorePondere)} (${esc(b.texteCoef)} : note du monde × profil de départ)</div>
        </div>
        ${courbeSaison}
        ${tableauBilan("Ta saison en chiffres", b.stats)}
        ${tableauBilan("Tout est liquidé au prix du marché", b.liquidation)}
        ${garde}
        ${b.revelations?.length ? carte(`<div class="cz-tete"><div class="cz-tete-chiffres"><span class="libelle">Tes récompenses</span><span class="chiffres">${b.revelations.length}</span></div>
          <div class="cz-palier-pieces">${b.revelations.filter((x) => x.genre === "piece").slice(0, 6).map((x) => apercu({ ...x, id: x.piece, sorte: x.sorteId ?? "" })).join("")}</div>
          ${bouton("Les dévoiler une à une", "devoilerRecompenses", { genre: "secondaire" })}</div>`) : ""}
        <p class="aide" style="text-align:center">Ce score devient le record à battre s'il est plus haut. Seuls les badges, les titres et les cosmétiques passent à la saison suivante.</p>
        ${bouton("Passer à la saison suivante", "nouvelleSaison")}
      </div>`;
    },
    // RNT-231 : à la première ouverture du bilan, les récompenses se dévoilent une à une.
    apres(ctx, d) {
      const b = d?.b;
      if (!b?.revelations?.length || lire("grind.devoile") === b.titre) return;
      ecrire("grind.devoile", b.titre);
      devoiler(ctx, b.revelations);
    },
    actions: {
      devoilerRecompenses(ctx, el, d) { devoiler(ctx, d?.b?.revelations ?? []); },
    },
  },
};
