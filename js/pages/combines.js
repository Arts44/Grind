// ══════════════════════════════════════════════════════════════════════
//  Zone « combines » (D186, vague 1) — EcranCombines.swift : l'illégal.
//
//  En haut, l'argent sale en liasse et le soupçon en thermomètre à crans.
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
//  Pas dans le tableau « illegal » : le prix, le risque et le « déjà fait
//  aujourd'hui » de la corruption. Le prix et le risque suivent ici la règle
//  du moteur (coutCorruption, risqueCorruption) ; le « déjà fait » vient du
//  refus du moteur.
// ══════════════════════════════════════════════════════════════════════
import { montant, variation, esc } from "../format.js";
import { entetePousse, carte, petit, bouton, champEuros, lireEuros } from "../ui.js";

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
const ICONE_COUP = { etalage: "etalage", pickpocket: "pickpocket", velo: "velo", cambriolage: "cambriolage", voiture: "voiture" };
const ICONE_CORRUPTION = { dossier: "dossier", inspecteur: "inspecteur", marche: "marche" };

// Le papier de l'iPhone (Papier, ObjetsBanque.swift)
const PAPIER = { fond: "#F1EEE7", encre: "#1D1C1A", encre2: "#6B675F", filet: "rgba(29,28,26,.12)", rouge: "#9B2C2C", vert: "#2F6B3A" };
const SERIF = `'New York', 'Iowan Old Style', Georgia, 'Times New Roman', serif`;

const pct = (x, signe = false) => `${signe && x > 0 ? "+" : ""}${Math.round(x * 100)} %`;
/** Les crans du vert au rouge (JaugeRisque.couleur). */
const couleurCran = (i) => (i < 3 ? "var(--gain)" : i < 6 ? "var(--alerte)" : "var(--danger)");

let catalogue = null;

export const pages = {
  combines: {
    titre: "Combines",
    async donnees(ctx) {
      if (!catalogue) catalogue = await ctx.balance("illegal");
      const t = await ctx.tableau("illegal");
      // RNT-178 : niveau, matériel, joueurs du monde, coups faits et subis.
      const j = await ctx.tableau("combines");
      return { t, j, r: catalogue, pseudo: ctx.etat.compte?.pseudo ?? "" };
    },
    rendu(d) {
      if (!d?.t) return `${entetePousse("Combines")}<div class="vide">Les combines s'ouvrent avec ta première saison.</div>`;
      const t = d.t;
      return `
        ${entetePousse("Combines")}
        <div class="pile" style="gap:18px">
          <p class="aide" style="margin:0 4px">Chaque combine rapporte plus, et fait monter le soupçon. Pris, tu paies selon la gravité ; chaque récidive coûte 50 % de plus, et au-delà de ${t.pointsPrison} points de casier, c'est la prison.</p>
          ${tete(t)}
          ${t.prisonJours > 0 ? `<div class="rangee danger" style="gap:10px;padding:14px;border-radius:16px;background:rgba(255,92,92,.12);font-size:14px;font-weight:600;align-items:flex-start">
              <span style="width:18px;flex:none">${I(SF.verrou, 18)}</span>En prison encore ${t.prisonJours} jour${t.prisonJours > 1 ? "s" : ""} : le focus ne paie rien, tes boîtes tournent au ralenti.</div>` : ""}
          ${tuyau(t)}
          ${coups(t)}
          ${parLaMer(d.j, t)}
          ${joueurs(d.j)}
          ${corruption(t, d.r)}
          ${blanchiment(t)}
          ${auNoir(t)}
          ${casier(t, d.pseudo)}
        </div>`;
    },
    actions: {
      // RNT-178 : le marché noir (fenêtre de paiement), la feuille d'une cible, la plainte.
      acheterOutil: (ctx, el) => ctx.decider("combines", { acheterOutil: { _0: el.dataset.id } }, { succes: "À toi" }),
      porterPlainte: (ctx, el) => ctx.decider("combines", { porterPlainte: { _0: el.dataset.id } }, { succes: "Plainte déposée : la police enquête" }),
      async ouvrirCible(ctx, el) {
        const id = el.dataset.id;
        const c = await ctx.tableau("combinesCible", { id });
        if (!c) return ctx.toast("Ce joueur n'est plus dans le monde.", "refus");
        ctx.feuille({
          titre: `Combines contre ${c.pseudo}`,
          contenu: feuilleCible(c),
          actions: {
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
        ctx.toast(pris ? "Pris : corruption de fonctionnaire" : "C'est fait", pris ? "refus" : "gain");
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

// MARK: La tête : la liasse et le thermomètre

function liasse(epaisseur) {
  const n = 1 + Math.round(epaisseur * 6);
  const bas = 62; // le pied de la liasse
  const billets = Array.from({ length: n }, (_, i) => {
    const y = bas - 30 - i * 3;
    return `<rect x="4" y="${y}" width="64" height="30" rx="3" fill="url(#billet)" stroke="rgba(0,0,0,.25)" stroke-width=".5" transform="rotate(${i % 2 === 0 ? -3 : 2} 36 ${y + 15})"/>`;
  }).join("");
  const h = 30 + n * 3;
  return `<svg width="72" height="64" viewBox="0 0 72 64" aria-hidden="true" style="overflow:visible"><defs><linearGradient id="billet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E8F5E"/><stop offset="1" stop-color="#3F5A36"/></linearGradient></defs>
    ${billets}<rect x="31" y="${bas - h - (n - 1) * 1.5 + 3}" width="10" height="${h}" fill="#E9D9A6"/></svg>`;
}

/** Retour du 13/10 : dix crans qui se colorent, du vert au rouge, de plus en plus hauts. */
function thermometre(part) {
  const pleins = Math.ceil(Math.round(part * 10 * 1000) / 1000);
  return `<div style="display:flex;align-items:flex-end;gap:3px;width:130px;height:52px" role="img" aria-label="Soupçon ${Math.round(part * 100)} %">${Array.from({ length: 10 }, (_, i) =>
    `<i style="flex:1;height:${14 + i * 3}px;border-radius:2.5px;background:${i < pleins ? couleurCran(i) : "var(--puce2)"}"></i>`).join("")}</div>`;
}

function tete(t) {
  const ton = t.soupcon > 0.3 ? "danger" : t.soupcon > 0.05 ? "alerte" : "";
  const zero = t.soupconZeroDans != null
    ? `<div class="rangee t2" style="gap:5px;font-size:12px;font-weight:500"><span style="width:14px;display:grid">${I(SF.horloge, 14)}</span>${t.soupconZeroDans <= 1 ? "À zéro cette nuit" : `À zéro dans ${t.soupconZeroDans} jours`}</div>` : "";
  return carte(`<div class="rangee" style="gap:14px;align-items:flex-start">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
        ${liasse(Math.min(1, t.argentSale / 5_000_000))}
        <div style="font-size:13px;color:var(--texte2)">Argent sale</div>
        <div class="chiffres" style="font-size:22px">${montant(t.argentSale)}</div>
      </div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
        ${thermometre(t.soupcon)}
        <div style="font-size:13px;color:var(--texte2)">Soupçon</div>
        <div class="${ton}" style="font-size:13px;font-weight:600;line-height:1.35">${esc(t.soupconTexte)}</div>
        ${zero}
      </div></div>`, { pad: true });
}

// MARK: Le tuyau

function tuyau(t) {
  if (t.initie) return carte(`<div class="rangee" style="gap:10px;font-size:14px;font-weight:600"><span style="width:18px;flex:none">${I(SF.hausse, 18)}</span>${esc(t.initie)}</div>`, { pad: true });
  if (!t.tuyau) return "";
  const tu = t.tuyau;
  const corps = t.tuyauTexte
    ? `<div style="font:600 15px/1.4 ${SERIF}">${esc(t.tuyauTexte)}</div>
       <div style="font-size:14px">Mise chez lui : ${pct(tu.hausse, true)} attendus. Ou prends position toi-même en bourse sur ce rayon avant l'annonce.</div>
       ${t.tuyauExpose > 0 ? `<div class="alerte" style="font-size:13px;font-weight:600">Tu as déjà ${montant(t.tuyauExpose)} d'exposition sur ce tuyau en bourse.</div>` : ""}`
    : `<div style="font-size:14px">Un ami chez ${esc(tu.nom)} te souffle une annonce avant qu'elle soit publique : ${pct(tu.hausse, true)} attendus demain.</div>`;
  return carte(`<div class="pile" style="gap:10px">
      <div class="rangee libelle" style="gap:8px"><span style="width:18px;display:grid">${I(SF.oreille, 18)}</span>Un tuyau</div>
      ${corps}
      <p class="aide">Délit d'initié, en misant chez lui comme en bourse : ${pct(t.risqueEnquete)} de risque d'enquête, gain confisqué et amende du double.</p>
      <div class="rangee">${petit("Miser", "miser", { plein: true })}${petit("Ignorer", "ignorerTuyau")}</div>
    </div>`, { pad: true });
}

// MARK: Les petits coups

const badgeGrave = () => `<span title="Délit grave : compte double au casier" style="font-size:10px;font-weight:800;color:var(--danger);padding:2px 6px;border-radius:99px;border:1px solid rgba(255,92,92,.7);white-space:nowrap">Grave ×2</span>`;

/** Le risque : dix crans qui virent du vert au rouge, et le pourcentage (JaugeRisque). */
function jaugeRisque(risque) {
  const pleins = Math.ceil(Math.round(Math.min(1, Math.max(0, risque)) * 10 * 1000) / 1000);
  const ton = pleins > 6 ? "danger" : pleins > 3 ? "alerte" : "gain";
  return `<div class="rangee" style="gap:8px" role="img" aria-label="Risque d'être pris : ${Math.round(risque * 100)} %">
    <div style="flex:1;display:flex;gap:2.5px">${Array.from({ length: 10 }, (_, i) => `<i style="flex:1;height:6px;border-radius:99px;background:${i < pleins ? couleurCran(i) : "var(--puce2)"}"></i>`).join("")}</div>
    <span class="${ton}" style="width:40px;text-align:right;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums">${Math.round(risque * 100)} %</span></div>`;
}

const pastille = (icone, teinte) => `<span class="pastille" style="--c:${teinte};width:40px;height:40px;border-radius:11px">${I(SF[icone] ?? SF.masque, 20)}</span>`;

function rangeeDelit({ icone, teinte, nom, grave, detail, gain, risque, bouton: b, terne, facteurs = null }) {
  return `<div class="filet"></div>
    <div class="rangee" style="align-items:flex-start;gap:12px;padding:16px;${terne ? "opacity:.5" : ""}">
      ${pastille(icone, teinte)}
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
        <div class="rangee" style="gap:6px;flex-wrap:wrap"><span style="font-size:15px;font-weight:600">${esc(nom)}</span>${grave ? badgeGrave() : ""}</div>
        <p class="aide">${esc(detail)}</p>
        ${gain}
        ${jaugeRisque(risque)}
        ${facteurs ? listeFacteurs(facteurs) : ""}
      </div>
      <div style="flex:none">${b}</div>
    </div>`;
}

function coups(t) {
  const lignes = t.coups.map((c) => rangeeDelit({
    icone: ICONE_COUP[c.id], teinte: c.grave ? "var(--c-danger)" : "var(--vente)", nom: c.nom, grave: c.grave, detail: c.detail,
    gain: `<div class="rangee gain" style="gap:5px;font-size:12px;font-weight:600"><span style="width:14px;display:grid">${I(SF.billets, 14)}</span>${montant(c.gainMin)} à ${montant(c.gainMax)} en liquide</div>`,
    risque: c.risque, terne: c.fait, facteurs: c.detailRisque,
    bouton: petit(c.fait ? "Demain" : "Tenter", "coup", { plein: !c.fait, donnees: { id: c.id }, desactive: c.fait || t.prisonJours > 0 }),
  })).join("");
  return carte(`<div class="libelle" style="padding:16px">Petits coups</div>${lignes}`);
}

// MARK: Par la mer (RNT-188) — SectionContrebande, EcranCombines.swift

function parLaMer(j, t) {
  const l = j?.mer ?? [];
  if (!l.length) return "";
  const lignes = l.map((c) => rangeeDelit({
    icone: "voile", teinte: c.grave ? "var(--c-danger)" : "var(--equipe)", nom: c.nom, grave: c.grave,
    detail: c.refus ? `${c.detail} ${c.refus}` : `${c.detail} Sur ${c.nomBateau} ; ${montant(c.carburant)} de carburant.`,
    gain: `<div class="rangee gain" style="gap:5px;font-size:12px;font-weight:600"><span style="width:14px;display:grid">${I(SF.billets, 14)}</span>${montant(c.gainMin)} à ${montant(c.gainMax)} en liquide</div>`,
    risque: c.risque?.risque ?? 0, terne: !!c.refus, facteurs: c.risque,
    bouton: petit("Tenter", "contrebande", { plein: !c.refus, donnees: { id: c.id, bateau: String(c.bateau ?? "") }, desactive: !!c.refus || t.prisonJours > 0 }),
  })).join("");
  return carte(`<div style="padding:16px"><div class="libelle">Par la mer</div><p class="aide" style="margin-top:3px">Une traversée sur un de tes bateaux, loin de la douane. Un bateau rapide la sème ; un yacht a l'air respectable. Pris sur un délit grave, le bateau peut être saisi.</p></div>${lignes}`);
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
  personne: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6"/>',
  bot: '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 3.5V7M9 12h.01M15 12h.01M9.5 15.5h5"/>',
  coche: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const ICONE_OUTIL = { gants: "gants", crochets: "crochets", brouilleur: "brouilleur", telephone: "telephone" };

/** « −20 % », « +10 % », « = » : l'effet d'un facteur sur le risque. */
const effet = (x) => { const p = Math.round((x - 1) * 100); return p === 0 ? "=" : p > 0 ? `+${p} %` : `−${-p} %`; };

/** Ce qui fait varier le risque, facteur par facteur (FacteursRisque). */
function listeFacteurs(d) {
  return `<div class="facteurs" style="display:flex;flex-direction:column;gap:3px">${d.facteurs.map((f) => `<div class="rangee" style="gap:6px;font-size:12px">
      <span style="font-weight:600;color:var(--texte2)">${esc(f.nom)}</span><span style="color:var(--texte2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.detail)}</span>
      <span class="${f.effet < 0.995 ? "gain" : f.effet > 1.005 ? "alerte" : "t2"}" style="font-weight:700;font-variant-numeric:tabular-nums">${effet(f.effet)}</span></div>`).join("")}</div>`;
}

const pastille2 = (icone, teinte, t = 36) => `<span class="pastille" style="--c:${teinte};width:${t}px;height:${t}px;border-radius:10px;flex:none">${I(SF2[icone] ?? SF.masque, Math.round(t / 2))}</span>`;
const tonCouleur = (ton) => (ton === "perte" ? "danger" : ton === "gain" ? "gain" : ton === "attente" ? "alerte" : "t2");

function joueurs(j) {
  if (!j) return "";
  const niveau = carte(`<div class="pile" style="gap:6px">
      <div class="rangee entre"><span class="libelle">Niveau de combines</span><span class="chiffres" style="font-size:17px">${j.niveau} sur 4</span></div>
      <p class="aide">${j.prochainNiveau != null ? `${j.reussites} réussite${j.reussites > 1 ? "s" : ""} : encore ${j.prochainNiveau} pour le niveau ${j.niveau + 1}. Les gros coups se débloquent avec l'expérience des petits.` : `${j.reussites} réussites : tous les coups te sont ouverts.`}</p>
      ${j.soupconVille ? `<div class="t2" style="font-size:12px;font-weight:500">${esc(j.soupconVille)}</div>` : ""}
    </div>`, { pad: true });
  const outils = carte(`<div style="padding:16px"><div class="libelle">Matériel</div><p class="aide" style="margin-top:3px">Acheté au marché noir (10 % de moins en liquide), il baisse le risque des coups qu'il sert.</p></div>
    ${j.outils.map((o) => `<div class="filet"></div><div class="rangee outil" data-outil="${esc(o.id)}" style="align-items:flex-start;gap:12px;padding:16px">
      ${pastille2(ICONE_OUTIL[o.id] ?? "crochets", "var(--c-controles, var(--accent))")}
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
        <span style="font-size:15px;font-weight:600">${esc(o.nom)}</span><p class="aide">${esc(o.detail)}</p>
        <span class="gain" style="font-size:12px;font-weight:600">Risque −${Math.round(o.effet * 100)} % : ${esc(o.pour)}</span></div>
      <div style="flex:none">${o.possede ? `<span class="t2 rangee" style="gap:4px;font-size:12px;font-weight:600">${I(SF2.coche, 13)}À toi</span>` : petit(montant(o.prix), "acheterOutil", { plein: true, donnees: { id: o.id } })}</div>
    </div>`).join("")}`);
  const monde = !j.enLigne ? "" : carte(`<div style="padding:16px"><div class="libelle">Dans le monde</div><p class="aide" style="margin-top:3px">Un coup par joueur et par jour, dans sa ville ; jamais quelqu'un en focus.</p></div>
    ${j.cibles.length ? "" : `<p class="aide" style="padding:0 16px 16px">Personne d'autre pour l'instant.</p>`}
    ${j.cibles.map((c) => `<div class="filet"></div><div class="rangee cible" data-cible="${esc(c.id)}" style="gap:12px;padding:16px">
      ${pastille2(c.bot ? "bot" : "personne", c.ici ? "var(--vente)" : "var(--c-controles, var(--accent))", 32)}
      <div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:600">${esc(c.pseudo)}${c.bot ? " · bot" : ""}</div>
        <div class="aide">${[c.ou, c.enFocus ? "en focus" : "", c.tenteAujourdhui ? "déjà tenté aujourd'hui" : ""].filter(Boolean).map(esc).join(", ")}</div></div>
      ${petit("Combines", "ouvrirCible", { donnees: { id: c.id } })}</div>`).join("")}`);
  const ligne = (x, plainte) => `<div class="filet"></div><div class="rangee coup-joueur" data-coup="${esc(x.id)}" style="align-items:flex-start;gap:12px;padding:16px">
      ${pastille2(x.icone === "watch.analog" ? "montre" : x.icone === "wallet.pass.fill" ? "portefeuille" : x.icone === "bolt.slash.fill" ? "sabotage" : "cambriolage",
        x.ton === "perte" ? "var(--c-danger)" : x.ton === "gain" ? "var(--argent)" : "var(--vente)")}
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
        <span style="font-size:15px;font-weight:600">${esc(x.nom)}</span>
        <span class="aide">Jour ${x.jour}${x.qui ? (plainte ? `, c'était ${esc(x.qui)}` : `, contre ${esc(x.qui)}`) : ""}</span>
        ${x.detail ? `<span style="font-size:13px">${esc(x.detail)}</span>` : ""}
        <span class="${tonCouleur(x.ton)} statut" style="font-size:13px;font-weight:600">${esc(x.statut)}</span></div>
      ${plainte && x.peutPorterPlainte ? `<div style="flex:none">${petit("Porter plainte", "porterPlainte", { plein: true, donnees: { id: x.id } })}</div>` : ""}
    </div>`;
  const subis = !j.subis.length ? "" : carte(`<div style="padding:16px"><div class="libelle">On t'a visé</div><p class="aide" style="margin-top:3px">Le coffre-fort, chez toi, protège d'un cambriolage. Une plainte n'aboutit pas toujours, faute de preuves ; si elle aboutit, tu es remboursé et tu sais qui.</p></div>
    ${j.subis.map((x) => ligne(x, true)).join("")}`);
  const faits = !j.faits.length ? "" : carte(`<div class="libelle" style="padding:16px">Tes coups</div>${j.faits.map((x) => ligne(x, false)).join("")}`);
  return `${niveau}${outils}${monde}${subis}${faits}`;
}

/** La feuille d'une cible (FeuilleCombinesJoueur) : chaque coup, son risque en clair, ou le refus. */
function feuilleCible(c) {
  const icone = { portefeuille: "portefeuille", montre: "montre", sabotage: "sabotage", cambriolage: "cambriolage" };
  return `<div class="pile" style="gap:14px">
    <p class="aide">${[c.ou, c.bot ? "bot" : "", c.enFocus ? "en focus" : "", `ton niveau : ${c.niveau}`].filter(Boolean).map(esc).join(" · ")}</p>
    <p class="aide">Le coup se joue ici ; il le découvre à sa prochaine connexion, et ce que tu touches dépend de ce qu'il a vraiment. Il ne saura qui c'était que si sa plainte aboutit.</p>
    ${c.possibilites.map((p) => carte(`<div class="pile possibilite" data-id="${esc(p.id)}" style="gap:8px;${p.refus ? "opacity:.75" : ""}">
      <div class="rangee" style="align-items:flex-start;gap:12px">
        ${pastille2(icone[p.coup], p.grave ? "var(--c-danger)" : "var(--vente)", 40)}
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
          <div class="rangee" style="gap:6px;flex-wrap:wrap"><span style="font-size:15px;font-weight:600">${esc(p.nom)}</span>${p.grave ? badgeGrave() : ""}</div>
          <p class="aide">${esc(p.detail)}</p>
          <div class="rangee gain" style="gap:5px;font-size:12px;font-weight:600;align-items:flex-start"><span style="width:14px;display:grid;flex:none">${I(SF.billets, 14)}</span>${esc(p.gain)}</div>
        </div>
        <div style="flex:none">${petit("Tenter", "tenter", { plein: !p.refus, desactive: !!p.refus, donnees: { coup: p.coup, ...(p.objet ? { objet: p.objet } : {}) } })}</div>
      </div>
      ${jaugeRisque(p.risque.risque)}
      ${listeFacteurs(p.risque)}
      <p class="aide">Pris : ${montant(p.amende)} d'amende, ${p.grave ? "deux points" : "un point"} au casier.</p>
      ${p.refus ? `<div class="alerte refus" style="font-size:13px;font-weight:600">${esc(p.refus)}</div>` : ""}
    </div>`, { pad: true })).join("")}
  </div>`;
}

// MARK: La corruption (D128)

/** Le facteur du soupçon, lu sur un coup que le plafond (90 %) ne tronque pas : risque affiché ÷ risque de base. */
function facteurSoupcon(t, r) {
  for (const c of t.coups) {
    const base = r?.coups?.find((x) => x.id === c.id)?.risque;
    if (base > 0 && c.risque < 0.9) return c.risque / base;
  }
  return 1;
}

function corruption(t, r) {
  const liste = r?.corruptions ?? [];
  if (!liste.length) return "";
  const f = facteurSoupcon(t, r);
  const lignes = liste.map((c) => {
    // coutCorruption : faire disparaître un dossier coûte au moins 1,5 fois la dernière amende.
    const derniere = t.casier[0];
    const cout = c.id === "dossier" && derniere ? Math.max(c.coutCentimes, Math.round(derniere.amende * 1.5)) : c.coutCentimes;
    const impossible = (c.id === "dossier" && !t.casier.length) || (c.id === "marche" && !t.blanchiment.length);
    return rangeeDelit({
      icone: ICONE_CORRUPTION[c.id] ?? "enveloppe", teinte: "var(--c-danger)", nom: c.nom, grave: true, detail: c.detail,
      gain: `<div class="rangee alerte" style="gap:5px;font-size:12px;font-weight:600"><span style="width:14px;display:grid">${I(SF.enveloppe, 14)}</span>Pot-de-vin : ${montant(cout)}</div>`,
      risque: Math.min(0.9, c.risque * f), terne: impossible,
      bouton: petit("Payer", "corrompre", { plein: true, donnees: { id: c.id }, desactive: impossible || t.prisonJours > 0 }),
    });
  }).join("");
  return carte(`<div style="padding:16px"><div class="libelle">Corruption</div><p class="aide" style="margin-top:3px">Le pot-de-vin se paie en liquide : ton argent sale d'abord, puis ton liquide, puis ton compte.</p></div>${lignes}`);
}

// MARK: Le blanchiment

function blanchiment(t) {
  if (t.argentSale <= 0) return "";
  const lignes = t.blanchiment.map((b) => `<div class="rangee entre"><div><div style="font-size:14px;font-weight:600">${esc(b.nom)}</div><div class="aide">Encore ${montant(b.reste)} cette semaine</div></div>
    ${petit("Blanchir", "blanchir", { donnees: { id: String(b.id) }, desactive: b.reste <= 0 })}</div>`).join("");
  return carte(`<div class="pile" style="gap:10px">
    <div class="libelle">Blanchir</div>
    <p class="aide">Faire passer l'argent sale pour des ventes d'une de tes boîtes : il en ressort ${pct(1 - t.decoteBlanchiment)}, propre, dans sa trésorerie. Une boîte ne justifie pas plus de la moitié de ce qu'elle vend par semaine.</p>
    ${t.blanchiment.length ? lignes : `<div class="alerte" style="font-size:14px;font-weight:600">Il te faut une boîte.</div>`}</div>`, { pad: true });
}

// MARK: Ce qui tourne au noir

function auNoir(t) {
  if (!t.auNoir.length) return "";
  const lignes = t.auNoir.map((l) => `<div class="filet"></div><div class="rangee" style="gap:12px;padding:12px 16px">
      <span class="pastille" style="--c:var(--vente)">${I(SF.oeilBarre, 17)}</span><span style="font-size:14px;font-weight:500;flex:1">${esc(l)}</span></div>`).join("");
  return carte(`<div class="rangee entre" style="padding:16px"><span class="libelle">Ce qui tourne au noir</span>
      <span class="alerte chiffres" style="font-size:13px;letter-spacing:0;padding:3px 9px;border-radius:99px;background:rgba(255,181,71,.15)">${t.auNoir.length}</span></div>
    ${lignes}<p class="aide" style="padding:16px">Chaque contrôle peut le trouver ; plus il y en a, plus le soupçon monte.</p>`);
}

// MARK: L'extrait de casier, sur papier

function casier(t, pseudo) {
  const n = Math.max(t.pointsPrison, t.points);
  const cases = Array.from({ length: n }, (_, i) => {
    const plein = i < t.points;
    const cadenas = i === t.pointsPrison - 1 ? `<span style="color:${plein ? PAPIER.fond : PAPIER.encre2};display:grid">${I(SF.verrou, 11)}</span>` : "";
    return `<span style="width:26px;height:26px;border-radius:3px;display:grid;place-items:center;background:${plein ? PAPIER.rouge : "transparent"};border:1px solid rgba(29,28,26,.4)">${cadenas}</span>`;
  }).join("");
  const presque = t.points >= t.pointsPrison - 1 && t.points > 0;
  const lignes = t.casier.length
    ? t.casier.map((c) => `<div style="display:flex;flex-direction:column;gap:3px">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px"><span style="font:600 14px ${SERIF}">${esc(c.motif)}</span>
          ${c.amende > 0 ? `<span style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:${PAPIER.rouge};white-space:nowrap">${variation(-c.amende)}</span>` : ""}</div>
        <div style="font-size:12px;color:${PAPIER.encre2}">${c.jour < 0 ? "Avant la saison" : `Jour ${c.jour}`}${c.detail ? `, ${esc(c.detail)}` : ""}${c.prison > 0 ? `, ${c.prison} jours de prison` : ""}</div>
      </div><div style="height:1px;background:${PAPIER.filet}"></div>`).join("")
    : `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0">
        <span style="font:italic 15px ${SERIF};color:${PAPIER.encre2}">Néant</span>
        <span style="font:800 18px ${SERIF};letter-spacing:2px;color:rgba(47,107,58,.75);padding:4px 10px;border:2px solid rgba(47,107,58,.6);border-radius:4px;transform:rotate(-8deg)">VIERGE</span></div>`;
  return `<div style="position:relative;margin-bottom:6px" role="group" aria-label="Extrait de casier">
    <div aria-hidden="true" style="position:absolute;inset:0;border-radius:10px;background:rgba(241,238,231,.55);transform:translateY(4px) rotate(1.4deg)"></div>
    <div style="position:relative;padding:18px;border-radius:10px;background:${PAPIER.fond};color:${PAPIER.encre};box-shadow:0 6px 20px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between">
        <div><div style="font:600 20px ${SERIF}">Extrait de casier</div><div style="font-size:12px;color:${PAPIER.encre2}">${pseudo ? `Bulletin n° 3, ${esc(pseudo)}` : "Bulletin n° 3"}</div></div>
        <span style="color:${PAPIER.encre2}">${I(SF.colonnes, 22)}</span></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">${cases}<span style="flex:1"></span>
          <span style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">${t.points} point${t.points > 1 ? "s" : ""} sur ${t.pointsPrison}</span></div>
        <div style="font-size:12px;color:${presque ? PAPIER.rouge : PAPIER.encre2}">${presque ? "Encore un délit et c'est la prison." : `À ${t.pointsPrison} points, la prison.`}</div>
      </div>
      <div style="height:1px;background:${PAPIER.filet}"></div>
      ${lignes}
    </div></div>`;
}
