// ══════════════════════════════════════════════════════════════════════
//  Zone « profil » : ton profil (EcransProfil.swift, CarteNiveau de
//  EcranAccueil.swift), le bilan de fin de saison et la collection
//  (EcranSaisons.swift).
//
//  Même grammaire que l'iPhone : une en-tête (avatar, pseudo, titre, d'où
//  tu joues, patrimoine, avancée de la saison), puis des sections titrées
//  dans des cartes givrées. Le titre et le cadre choisis restent dans ce
//  navigateur, comme dans les réglages locaux de l'iPhone (@AppStorage).
//  D215 : sous l'en-tête, « Tu joues dans » (la partie ouverte ; « Changer »
//  ouvre Mes mondes) ; les amis ont leur ligne, à part. Les parties
//  retrouvées dans iCloud n'existent pas sur le web.
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, variation, esc } from "../format.js";

/** « −13 643 € » avec le vrai signe moins, comme Montant.texte. */
const montant = (c) => montantBrut(c).replace("-", "\u2212");
import { entetePousse, carte, section, ligne, bouton, rail, courbe } from "../ui.js";
import { SYMBOLES, pct } from "./vie.js";
import { carteTuJouesDans } from "./mondes.js";
import * as L from "../enligne.js";
import { avatarJoueur } from "../compte-local.js";

// MARK: - Le titre et le cadre choisis (CompteLocal.cleTitre, cleCadre)

const lire = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const CLE_TITRE = "grind.titre", CLE_CADRE = "grind.cadre";

/** Les cadres de profil (CadreProfil) : un dégradé angulaire autour de l'avatar. */
const CADRES = {
  emeraude: ["#34C88A", "#9BF0C8", "#34C88A"],
  argent: ["#C9D4E3", "#7D8796", "#C9D4E3"],
  or: ["#E3C46B", "#A8822C", "#F5E2A0", "#E3C46B"],
};

// MARK: - Petites briques

const ecranVide = (texte) => `<div class="vide" style="padding:80px 40px 0;font-size:15px">${texte}</div>`;
const pied = (t) => `<div class="aide" style="margin:8px 4px 0">${t}</div>`;
const tiret = "–";

/** L'avatar du joueur : son symbole blanc sur sa teinte (AvatarJoueur, compte-local.js), et son cadre s'il en a un. */
const avatar = (taille, cadre) => avatarJoueur(taille, { cadre: cadre ?? "" });

/** Une ligne de section de profil : icône discrète, titre, détail, chiffre à droite (LigneChiffre). */
const ligneChiffre = ({ icone, titre, detail = "", valeur, couleur = "", teinte = "var(--accent)" }) => `
  <div class="rangee" style="gap:12px;padding:13px 16px">
    <span style="width:26px;flex:none;display:grid;place-items:center;color:${teinte}"><span style="width:18px;display:grid">${icone}</span></span>
    <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${titre}</div>
      ${detail ? `<div class="aide">${detail}</div>` : ""}</div>
    <span class="chiffres ${couleur}" style="font-size:15px;white-space:nowrap">${valeur}</span>
  </div>`;

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
      <span>Ta saison en cours a reçu des outils de test ou un cadeau de l'admin : elle ne compte ni au record ni à l'expérience. Si c'était pour réparer une erreur du jeu, écris-le à Grind (Réglages › Écrire à Grind) : elle peut compter à nouveau.</span></div>` : ""}
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

// MARK: - Collection

/** Les finitions de carte rares (StyleCarte) : dégradé et motif gravé. */
const FINITIONS = {
  metal: { c: ["#8E9097", "#3D3F45", "#6C6E74"], motif: "repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 1px, transparent 1px 3px)" },
  noire: { c: ["#1A1A1D", "#050506", "#2B2B30"], motif: "" },
  orMassif: { c: ["#E9CF8A", "#9C7A35", "#D9B866"], motif: "repeating-radial-gradient(circle at 30% 120%, rgba(0,0,0,.12) 0 1px, transparent 1px 6px)" },
  diamant: { c: ["#F1F3F6", "#BFD7FF", "#A9AFB8", "#F0E6FF"], motif: "repeating-conic-gradient(from 0deg at 70% 30%, rgba(0,0,0,.06) 0 4deg, transparent 4deg 12deg)" },
};
function apercuFinition(id, debloquee) {
  const f = FINITIONS[id] ?? { c: ["#2A2A30", "#141417"], motif: "" };
  return `<div aria-hidden="true" style="aspect-ratio:1.586;border-radius:14px;border:1px solid rgba(255,255,255,.12);opacity:${debloquee ? 1 : 0.35};
    background:${f.motif ? `${f.motif},` : ""}linear-gradient(135deg, ${f.c.join(", ")})"></div>`;
}

/** Les aperçus des icônes rares de l'app (Assets : Apercu-*), réduits. */
const APERCUS = {
  "AppIcon-Aube": "data:image/webp;base64,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",
  "AppIcon-Nuit": "data:image/webp;base64,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",
  "AppIcon-Emeraude": "data:image/webp;base64,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",
  "AppIcon-Amethyste": "data:image/webp;base64,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",
};

/** Des pilules : les gagnées se choisissent, les autres disent comment les gagner (ListeRecompenses). */
export function listeRecompenses(sorte, elements, choisi) {
  return `<div style="display:grid;gap:8px">${elements.map((e) => {
    const coche = choisi === e.id;
    const icone = !e.gagne ? `<span style="width:15px;display:grid;color:var(--texte2)">${SYMBOLES.verrou}</span>`
      : coche ? `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="var(--accent)"/><path d="m7.5 12.3 3 3 6-6.3" fill="none" stroke="var(--fond)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="var(--texte2)" stroke-width="1.6"/></svg>`;
    return `<button class="rangee" data-action="choisirRecompense" data-sorte="${sorte}" data-id="${esc(e.id)}" ${e.gagne ? "" : "disabled"} aria-pressed="${coche}"
      style="gap:10px;width:100%;padding:11px 14px;border-radius:12px;background:var(--puce);${e.gagne ? "" : "opacity:1"}">
      ${icone}<span style="font-size:15px;font-weight:500;color:${e.gagne ? "var(--texte)" : "var(--texte2)"}">${esc(e.nom)}</span>
      <span class="espace"></span>${e.gagne ? "" : `<span class="aide">${esc(e.condition)}</span>`}</button>`;
  }).join("")}</div>`;
}

// MARK: - Les pages

export const pages = {
  profil: {
    titre: "Profil",
    css: ["compte", "mondes", "enligne"], // lot A : l'avatar (css/pages/compte.css) ; RNT-210 : « Tu joues dans » (mondes.js)
    async donnees(ctx) {
      const [p, r, c, s, monde, paysListe, profils, parties] = await Promise.all([
        ctx.tableau("profil"), ctx.tableau("recompenses"), ctx.tableau("collection"),
        ctx.tableau("courbe", { periode: "saison" }), ctx.tableau("monde"), ctx.balance("monde"),
        ctx.jouer("profils", {}, { silencieux: true }), ctx.jouer("parties", {}, { silencieux: true }),
      ]);
      // D215 : les joueurs du monde ouvert, pour « Tu joues dans » (relus au plus une fois par minute).
      const ouverte = parties?.parties?.find((x) => x.ouverte);
      if (ouverte?.enLigne && !ouverte.terminee && ctx.etat.compte && !ctx.etat.horsLigne) await L.synchroniser(ctx).catch(() => false);
      return { p, r, c, depart: s?.valeurs?.[0] ?? null, monde, pays: paysListe?.pays ?? [], profils: profils?.profils ?? [], parties: parties?.parties ?? [],
        joueurs: ouverte?.enLigne && L.monde.code === ouverte.enLigne.code ? L.monde.profils : [] };
    },
    rendu(d, ctx) {
      const jeu = ctx.etat.jeu;
      if (!d.p || !jeu) return `${entetePousse("Profil")}${ecranVide("Ton profil s'ouvre avec ta première saison.")}`;
      const { p, r, c } = d;
      const enSaison = !!jeu.saison, terminee = !!jeu.terminee;
      const pseudo = ctx.etat.compte?.pseudo || "Choisis un pseudo";
      // Seuls un titre et un cadre gagnés s'affichent, comme dans le profil publié.
      const titre = r?.titres.find((t) => t.id === lire(CLE_TITRE) && t.gagne)?.nom;
      const cadre = r?.cadres.find((t) => t.id === lire(CLE_CADRE) && t.gagne)?.id;
      // « 🇧🇪 Bruxelles, Commerçant installé » : le pays, la ville et le profil de la saison.
      const ici = d.monde?.lieux?.find((l) => l.residence) ?? d.monde?.ici;
      const drapeau = d.pays.find((x) => x.nom === ici?.pays)?.drapeau;
      const endroit = enSaison ? [drapeau, d.monde?.residence].filter(Boolean).join(" ") : "";
      const lieu = [endroit, p.profil].filter(Boolean).join(", ");
      const part = p.dureeJours > 0 ? p.jour / p.dureeJours : 0;
      const patrimoine = jeu.accueil?.patrimoine ?? 0;
      const depart = d.depart ?? patrimoine;
      const progression = depart > 0 ? patrimoine / depart - 1 : 0;

      const suite = enSaison ? `
        <div class="aide">Patrimoine</div>
        <div class="chiffres" style="font-size:34px;line-height:1.15;white-space:nowrap">${montant(patrimoine)}</div>
        <div style="font-size:13px;font-weight:500;margin-top:4px" class="${patrimoine >= depart ? "gain" : "perte"}">${variation(patrimoine - depart)} depuis le départ (${pct(progression, { signe: true })})</div>
        <div style="margin-top:18px">
          <div class="rangee entre" style="font-size:13px;font-weight:500;color:var(--texte2)"><span>${terminee ? "Saison terminée" : `Jour ${p.jour} sur ${p.dureeJours}`}</span>
            <span class="chiffres" style="font-weight:500;letter-spacing:0">${pct(terminee ? 1 : part)}</span></div>
          <div style="margin-top:8px">${rail(terminee ? 1 : part)}</div>
        </div>`
        : `<div class="aide">Aucune saison en cours : choisis un profil de départ pour commencer.</div>`;

      return `
      ${entetePousse("Profil")}
      <div class="pile" style="gap:22px;padding-top:6px">
        <div class="carte">
          <div class="rangee" style="gap:18px;padding:20px">
            ${avatar(68, cadre)}
            <div style="min-width:0;display:grid;gap:3px">
              <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(pseudo)}</div>
              ${titre ? `<div class="or" style="font-size:13px;font-weight:600">${esc(titre)}</div>` : ""}
              ${lieu ? `<div class="aide" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(lieu)}</div>` : ""}
            </div>
          </div>
          <div class="filet"></div>
          <div style="padding:20px">${suite}</div>
        </div>

        ${carteTuJouesDans(d.parties, d.joueurs)}

        ${carteNiveau(jeu.experience ?? { niveau: 1, xp: 0, progression: 0, heures: 0 }, d.profils)}

        ${!enSaison || terminee ? bouton(enSaison ? "Commencer une nouvelle saison" : "Commencer ma première saison", "nouvelleSaison") : ""}

        <div>
          ${section("Ta saison").replace('class="section"', 'class="section" style="margin-top:0"')}
          ${carte(bandeChiffres([["Focus", `${p.heuresFocus} h`], ["Sessions", `${p.sessions}`], ["Tenues", p.tenues != null ? pct(p.tenues) : tiret]]))}
          ${pied("Tenues : les sessions menées au bout, sur toutes celles commencées.")}
        </div>

        <div>
          ${section("Palmarès").replace('class="section"', 'class="section" style="margin-top:0"')}
          ${carte(`
            ${ligneChiffre({ icone: SYMBOLES.trophee, titre: "Record", detail: "Ton meilleur score de saison", valeur: p.meilleurScore != null ? montant(p.meilleurScore) : tiret, couleur: p.meilleurScore != null ? "or" : "t2", teinte: "var(--or)" })}
            ${p.palmares.map((s) => `<div class="filet" style="margin-left:54px"></div>${ligneChiffre({ icone: SYMBOLES.drapeau, titre: esc(s.titre), detail: esc(s.detail), valeur: montant(s.patrimoine) })}`).join("")}`)}
          ${p.palmares.length ? "" : pied("Ton record se pose à la fin de ta première saison.")}
        </div>

        <div>
          ${section("Récompenses").replace('class="section"', 'class="section" style="margin-top:0"')}
          ${carte(`
            ${rubrique({ icone: SYMBOLES.rosette, teinte: "#E0A33A", titre: "Badges et collection", resume: `${c?.obtenus ?? 0} badge${(c?.obtenus ?? 0) > 1 ? "s" : ""} sur ${c?.badges.length ?? 0}, titres, cadres, cartes et icônes`, page: "collection" })}
            ${terminee ? rubrique({ icone: SYMBOLES.drapeau, teinte: "#E3C46B", titre: "Bilan de la saison", resume: "Ton score, la liquidation, ce que tu gardes", page: "bilan" }) : ""}`)}
        </div>

        ${carte(`
          ${rubrique({ icone: SYMBOLES.liste, teinte: "#34C88A", titre: "Activité", resume: "Salaires, production, sanctions", page: "activite" })}
          ${rubrique({ icone: "amis", teinte: "#5B8DEF", titre: "Amis", resume: "Les ajouter, leur écrire, les inviter", page: "amis" })}
          ${rubrique({ icone: "reglages", teinte: "#86868F", titre: "Réglages", resume: "Compte, apparence, aide, ta partie", page: "reglages" })}`)}
      </div>`;
    },
  },

  bilan: {
    titre: "Bilan",
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
      // Ce que la saison a gagné : badges nouveaux, cartes et icônes, titres, cadres, accents.
      const nouveaux = new Set(b.badgesGagnes);
      const r = d.r ?? { titres: [], cadres: [], accents: [] };
      const gagnes = [...r.titres.map((x) => [`Titre « ${x.nom} »`, x]), ...r.cadres.map((x) => [`Cadre ${x.nom}`, x]), ...r.accents.map((x) => [`Accent ${x.nom}`, x])]
        .filter(([, x]) => x.gagne && nouveaux.has(x.condition)).map(([t]) => t);
      const garde = b.badgesGagnes.length || b.debloque.length || gagnes.length ? carte(`
        <div class="libelle">Ce que tu gardes</div>
        <div style="display:grid;gap:10px;margin-top:10px">
          ${b.badgesGagnes.map((n) => `<div class="rangee gain" style="gap:8px;font-size:14px;font-weight:600"><span style="width:16px;display:grid">${SYMBOLES.etoile}</span>${esc(n)}</div>`).join("")}
          ${[...b.debloque, ...gagnes].map((n) => `<div class="rangee" style="gap:8px;font-size:14px;font-weight:600"><span style="width:16px;display:grid;color:var(--accent)">${SYMBOLES.verrou}</span>${esc(n)} débloqué</div>`).join("")}
          <button data-action="ouvrir" data-page="collection" style="font-size:14px;font-weight:500;color:var(--accent);text-align:left">Choisir ton titre et ton cadre</button>
        </div>`, { pad: true }) : "";
      return `
      ${entetePousse("")}
      <div class="pile" style="gap:18px">
        <div style="text-align:center;display:grid;gap:8px;padding-top:22px">
          <div style="font-size:14px;color:var(--texte2)">${esc(b.titre)}</div>
          <div class="chiffres" style="font-size:46px;line-height:1.05;white-space:nowrap">${montant(b.score)}</div>
          <div style="font-size:14px;font-weight:600" class="${b.nouveauRecord ? "gain" : "t2"}">${recordTexte(b)}</div>
        </div>
        ${courbeSaison}
        ${tableauBilan("Ta saison en chiffres", b.stats)}
        ${tableauBilan("Tout est liquidé au prix du marché", b.liquidation)}
        ${garde}
        <p class="aide" style="text-align:center">Ce score devient le record à battre s'il est plus haut. Seuls les badges, les titres et les cosmétiques passent à la saison suivante.</p>
        ${bouton("Passer à la saison suivante", "nouvelleSaison")}
      </div>`;
    },
  },

  collection: {
    titre: "Collection",
    async donnees(ctx) {
      const [c, r] = await Promise.all([ctx.tableau("collection"), ctx.tableau("recompenses")]);
      return { c, r };
    },
    rendu(d) {
      const t = d.c, r = d.r;
      if (!t) return `${entetePousse("Collection")}${ecranVide("La collection s'ouvre avec ta première saison.")}`;
      const choix = (titre, aide, sorte, liste, cle) => `<div style="display:grid;gap:10px">
        <div class="libelle">${titre}</div><div class="aide">${aide}</div>
        ${listeRecompenses(sorte, [{ id: "", nom: "Aucun", gagne: true, condition: "" }, ...liste], lire(cle))}</div>`;
      return `
      ${entetePousse("Collection")}
      <div class="pile" style="gap:20px">
        <p class="aide">Tout le reste est liquidé à la fin de la saison. Ces récompenses-là te suivent.</p>

        <div class="rangee entre"><span class="libelle">Cartes rares</span><span class="aide">${t.record != null ? `record : ${montant(t.record)}` : "selon ton meilleur score"}</span></div>
        <div class="grille2" style="gap:16px 14px;margin-top:-6px">${t.cartes.map((c) => `<div>
          ${apercuFinition(c.id, c.debloquee)}
          <div style="font-size:15px;font-weight:600;margin-top:6px">${esc(c.nom)}</div>
          <div class="aide">${c.debloquee ? "Débloquée, à choisir sur ta carte" : `Record ≥ ${montant(c.seuil)}`}</div></div>`).join("")}</div>

        <div class="libelle">Icônes rares</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px 12px;margin-top:-6px">${t.icones.map((i) => `
          <div style="text-align:center;min-width:0" aria-label="${esc(i.debloquee ? `${i.nom}, débloquée` : `${i.nom}, à gagner : ${i.condition}`)}" role="img">
            ${APERCUS[i.id] ? `<img src="${APERCUS[i.id]}" alt="" style="width:100%;aspect-ratio:1;border-radius:14px;display:block;opacity:${i.debloquee ? 1 : 0.35}">`
              : `<div style="aspect-ratio:1;border-radius:14px;background:var(--puce2);opacity:.35"></div>`}
            <div style="font-size:12px;font-weight:500;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${i.debloquee ? "var(--texte)" : "var(--texte2)"}">${esc(i.nom)}</div>
          </div>`).join("")}</div>
        <p class="aide" style="margin-top:-6px">Une icône se débloque avec son badge, et se choisit dans les réglages de l'iPhone.</p>

        ${r ? `
          ${choix("Titre", "Affiché à côté de ton pseudo, pour les joueurs de ton monde.", "titre", r.titres, CLE_TITRE)}
          ${choix("Cadre de profil", "Autour de ton avatar, visible des autres joueurs.", "cadre", r.cadres, CLE_CADRE)}
          ${r.accents.some((a) => a.gagne) ? `<p class="aide">Tes accents gagnés se choisissent dans Réglages › Apparence. <button class="rg-lien" data-action="ouvrir" data-page="reglagesApparence">Choisir</button></p>` : ""}` : ""}

        <div class="carte">
          <div class="rangee entre" style="padding:16px"><span class="libelle">Badges</span><span class="aide">${t.obtenus} sur ${t.badges.length}</span></div>
          ${t.badges.map((b) => `<div class="filet"></div>
            <div class="rangee" style="gap:12px;padding:12px 16px">
              <i style="width:9px;height:9px;border-radius:50%;flex:none;background:${b.obtenu ? "var(--gain)" : "var(--texte3)"}"></i>
              <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:600">${esc(b.nom)}</div><div class="aide">${esc(b.detail)}</div></div>
              <span style="font-size:13px;font-weight:600;flex:none" class="${b.obtenu ? "gain" : "t2"}">${b.obtenu ? "Obtenu" : "À obtenir"}</span>
            </div>`).join("")}
        </div>
      </div>`;
    },
    actions: {
      choisirRecompense(ctx, b) {
        ecrire(b.dataset.sorte === "cadre" ? CLE_CADRE : CLE_TITRE, b.dataset.id);
        ctx.rafraichir();
      },
    },
  },
};
