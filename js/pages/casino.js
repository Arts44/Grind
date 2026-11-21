// ══════════════════════════════════════════════════════════════════════
//  Hôtels et casino (RNT-260, D277), comme sur l'iPhone (EcransHotelsCasinos.swift) :
//    hotels  ← EcranHotels   (dormir ce soir, les avis à laisser, mes hôtels)
//    hotel   ← EcranHotel    (la fiche d'un de mes hôtels : chambres, saison, étoiles, avis)
//    casino  ← EcranCasino   (les casinos d'ici, les jetons, les jeux, les garde-fous, mes licences)
//  Les tableaux viennent du moteur (TableauHotelsCasino.swift).
// ══════════════════════════════════════════════════════════════════════
import { montant, pourcent, esc } from "../format.js?v=3e8bddd9";
import { carte, ligne, bouton, petit, entetePousse, vide, bandeau, champEuros, lireEuros, segment, confirmer } from "../ui.js?v=3e8bddd9";
import * as enLigne from "../enligne.js?v=3e8bddd9";

const etoiles = (n) => "★".repeat(n) + `<span class="t2">${"★".repeat(Math.max(0, 5 - n))}</span>`;
// D334 : un hôtel ou un casino se visite sur place : « Tu y es », sinon « Y aller » (le trajet que propose le moteur).
const surPlace = (s, geste) => !s ? "" : ` · ${s.ici ? `Tu y es : touche pour ${geste}` : s.allerY ? `Y aller${s.trajet ? ` : ${esc(s.trajet)}` : ""} ; on ${geste === "jouer" ? "joue" : "réserve"} sur place` : "Sur place seulement"}${s.horaire ? ` · ${esc(s.horaire)}` : ""}`;
const vaY = (s) => !!s && !s.ici;
async function allerEtablissement(ctx, s, nom) {
  const p = s?.allerY?.params;
  if (!p) return ctx.toast(`Rends-toi d'abord sur place : ${nom} (carte du Monde).`, "refus");
  return ctx.decider("monde", { allerA: { lieu: p.lieu, moyen: p.moyen, ...(p.vehicule != null ? { vehicule: Number(p.vehicule) } : {}) } }, { succes: `En route pour ${nom}` });
}
const note = (x, n) => (x == null ? `<span class="t2">Pas encore d'avis</span>` : `${x.toFixed(1).replace(".", ",")} / 5 · ${n} avis`);

// MARK: - Dormir à l'hôtel

function rendreHotels(d) {
  const t = d.t;
  if (!t) return `${entetePousse("Hôtels")}${vide("Les hôtels ouvrent avec ta première saison.")}`;
  const nuit = t.nuit ? bandeau(`Ce soir : ${esc(t.nuit.nom)} (${t.nuit.etoiles} étoiles)${t.nuit.prix ? `, ${montant(t.nuit.prix)}` : ", offerte"}.`, "var(--equipe)") : "";
  const lignes = t.hotels.map((h) => ligne({
    titre: `${esc(h.offre.nom)} <span class="etoiles">${etoiles(h.offre.etoiles)}</span>`,
    detail: `${h.aMoi ? "Ton hôtel : la chambre est offerte" : h.proprietaireNom ? `Tenu par ${esc(h.proprietaireNom)}` : "Hôtel de la ville"} · ${note(h.note, h.avis)} · +${String(h.plaisir).replace(".", ",")} de plaisir${surPlace(h.surPlace, "réserver")}`,
    valeur: h.aMoi ? "Offerte" : montant(h.offre.prix),
    action: t.refus ? "" : "reserver", donnees: { id: h.offre.id }, desactive: !!t.refus,
  })).join("");
  const aNoter = t.aNoter.length ? `<div class="libelle">Laisser un avis</div>${carte(t.aNoter.map((x) => ligne({ titre: esc(x.nom), detail: `${x.etoiles} étoiles`, action: "noter", donnees: { hotel: x.hotel } })).join(""))}` : "";
  const mes = t.mesHotels.length ? `<div class="libelle">Mes hôtels</div>${carte(t.mesHotels.map((h) => ligne({
    titre: `${esc(h.nom)} <span class="etoiles">${etoiles(h.etoiles)}</span>`,
    detail: `${esc(h.ville)} · ${h.chambres} chambres${h.occupation != null ? ` · ${pourcent(h.occupation)} occupées hier` : ""} · ${note(h.note, h.avis)}`,
    valeur: `${montant(h.prixNuit)}/nuit`, page: "hotel", p: { id: h.id },
  })).join(""))}` : "";
  return `${entetePousse("Hôtels")}
    <div class="pile" id="zone-hotels">
      <p class="aide">À ${esc(t.nomVille)}. En voyage, une nuit à l'hôtel remplace ton logement : pas de nuit à la rue, et du plaisir selon les étoiles.</p>
      ${t.refus ? bandeau(esc(t.refus), "var(--texte2)") : ""}${nuit}
      ${t.hotels.length ? carte(lignes) : vide("Pas d'hôtel ici.")}
      ${aNoter}${mes}
    </div>`;
}

// MARK: - La fiche d'un de mes hôtels

function rendreHotel(d) {
  const t = d.t;
  if (!t) return `${entetePousse("Hôtel")}${vide("Cet hôtel n'est plus à toi.")}`;
  const barres = t.saison.map((m) => `<div class="hc-mois${m.enCours ? " en-cours" : ""}" title="${esc(m.nom)}"><span style="--h:${Math.round(m.occupation * 100)}%"></span><em>${esc(m.nom.slice(0, 1))}</em></div>`).join("");
  return `${entetePousse(esc(t.nom))}
    <style>.hc-saison{display:flex;gap:4px;align-items:flex-end;height:90px}.hc-mois{flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;text-align:center}.hc-mois span{display:block;height:var(--h);background:var(--equipe);border-radius:4px 4px 0 0;opacity:.55}.hc-mois.en-cours span{opacity:1}.hc-mois em{font-style:normal;font-size:11px;color:var(--texte2)}</style>
    <div class="pile" id="zone-hotel">
      ${carte(`<div class="etoiles grand">${etoiles(t.etoiles)}</div>
        ${ligne({ titre: "Chambres", valeur: String(t.chambres) })}
        ${ligne({ titre: "Occupées hier", valeur: t.occupation != null ? pourcent(t.occupation) : "—" })}
        ${ligne({ titre: "Prix d'une nuit", valeur: montant(t.prixNuit) })}
        ${ligne({ titre: "Trésorerie", valeur: montant(t.tresorerie) })}`, { pad: true })}
      <div class="libelle">L'année</div>
      ${carte(`<div class="hc-saison">${barres}</div><p class="aide">${esc(t.profil)} Les nuitées vendues = chambres × occupation.</p>`, { pad: true })}
      <div class="libelle">Étoiles</div>
      ${carte(t.choixEtoiles.map((e) => ligne({
        titre: `<span class="etoiles">${etoiles(e.n)}</span>`, detail: e.actuelle ? "Aujourd'hui" : `${montant(e.prixNuit)} la nuit${e.cout ? `, travaux ${montant(e.cout)} (trésorerie de l'hôtel)` : ""}`,
        action: e.actuelle ? "" : "changerEtoiles", donnees: { n: e.n }, desactive: e.actuelle,
      })).join(""))}
      <div class="libelle">Avis des joueurs · ${note(t.note, t.avis.length)}</div>
      ${t.avis.length ? carte(t.avis.map((a) => ligne({ titre: `${"★".repeat(a.note)} ${esc(a.texte)}`, detail: esc(a.auteur) })).join("")) : vide("Pas encore d'avis : les joueurs qui y dorment peuvent en laisser un.")}
    </div>`;
}

// MARK: - Le casino

/** D338 : le nom d'un coup joué à la roulette ou à une machine (« roulette:francaise », « machine:prestige »). */
const nomCoup = (j) => j === "roulette" ? "Roulette" : j === "roulette:francaise" ? "Roulette française" : j.startsWith("machine:") ? `Machine à sous, ${({ fruits: "Fruits d'or", prestige: "Prestige", riviera: "Riviera" })[j.slice(8)] ?? j.slice(8)}` : j;

function rendreCasino(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Casino")}${vide("Le casino ouvre avec ta première saison.")}`;
  if (!t.permis) return `${entetePousse("Casino")}<div class="pile" id="zone-casino">${vide("Les casinos sont coupés dans ce monde.")}</div>`;
  const enJeu = t.casinoActuel != null;
  const casinos = t.casinos.map((c) => ligne({
    titre: esc(c.offre.nom), detail: (c.ferme ? (c.aMoi ? "Fermé : paie les gains de ton client (Banque, À payer)" : "Fermé : les gains d'un client sont impayés") : c.interdit ? "Interdit d'entrée pour la saison" : c.aMoi ? "Ton casino" : c.proprietaireNom ? `Tenu par ${esc(c.proprietaireNom)}` : "Casino de la ville") + surPlace(c.surPlace, "jouer"),
    action: t.refus || c.interdit || c.ferme ? "" : "jetons", donnees: { id: c.offre.id }, desactive: !!t.refus || c.interdit || !!c.ferme,
    valeur: t.casinoActuel === c.offre.id ? montant(t.jetons) : "",
  })).join("");
  // D337 : la salle et ses tables ; assis (jetons en main, sur place), on s'y installe main par main.
  const table = enJeu ? `<div class="libelle">À la table · ${esc(t.nomCasino ?? "")}</div>
    ${carte(`<div class="heros-chiffre" style="--taille:30px">${montant(t.jetons)}</div><p class="aide">de jetons · encore ${montant(t.achatsRestants)} de jetons à acheter aujourd'hui</p>
      ${bouton("Encaisser mes jetons", "encaisser", { genre: "secondaire" })}`, { pad: true })}` : "";
  const salle = (t.tables ?? []).length ? `<div class="libelle">Les tables</div>${carte(t.tables.map((x) => ligne({
    titre: esc(x.nom), detail: x.bientot ? "Bientôt" : `${esc(x.detail)}${x.avantage ? ` · ${esc(x.avantage)}` : ""}${t.assis ? "" : " · prends d'abord des jetons, sur place"}`,
    // D338 : la roulette et les machines ont leurs pages à elles.
    page: x.bientot || !t.assis ? "" : ["roulette", "machines"].includes(x.id) ? x.id : "casinoTable", p: { jeu: x.id },
  })).join(""), { classe: "salle-tables" })}` : "";
  const coups = t.derniers.length ? carte(t.derniers.slice(0, 6).map((c) => ligne({
    titre: esc(t.jeux.find((j) => j.id === c.jeu)?.nom ?? nomCoup(c.jeu)) + (c.compte ? " · cartes comptées" : ""), detail: `Mise ${montant(c.mise)}`,
    valeur: c.gain > 0 ? `+${montant(c.gain)}` : "Perdu", couleurValeur: c.gain > c.mise ? "gain" : "perte",
  })).join("")) : "";
  const garde = carte(`${ligne({ titre: "Plafond du jour", detail: "5 % de ton patrimoine net, jamais à crédit", valeur: montant(t.plafondJour) })}
    ${ligne({ titre: "Addiction", detail: esc(t.conseilAddiction ?? "Elle monte avec les mises, plus vite quand tu perds, et redescend la nuit."), valeur: esc(t.niveauAddiction), couleurValeur: t.addiction >= 0.4 ? "perte" : "" })}
    ${ligne({ titre: "Se faire aider", detail: t.enSoin ? "En cours : pas de casino, l'envie redescend vite" : `${t.soinJours} jours sans casino, l'envie redescend vite`, valeur: montant(t.soinPrix), action: t.enSoin ? "" : "soigner", desactive: t.enSoin })}
    ${ligne({ titre: "M'exclure des casinos", detail: t.exclu ? "En cours" : "Ni jetons ni mises, sans retour possible", action: t.exclu ? "" : "exclure", desactive: t.exclu })}`);
  const licences = `<div class="libelle">Licences</div>${carte(`${t.licences.map((l) => ligne({ titre: `Licence à ${esc(l.nomVille)}`, detail: l.ouvert ? "Ton casino est ouvert" : "Ouvre ton casino depuis Entreprises", valeur: montant(l.prix) })).join("")}
    ${ligne({ titre: "Licences aux enchères", detail: t.ventesLicences ? `${t.ventesLicences} en vente ou à venir` : "1 à 3 par grande ville, chaque début de saison", page: "encheres" })}`)}`;
  return `${entetePousse("Casino")}
    <div class="pile" id="zone-casino">
      <p class="aide">À ${esc(t.nomVille)}. Blackjack, poker, baccarat, roulette, machines à sous : à la longue, la maison gagne toujours.</p>
      ${t.refus ? bandeau(esc(t.refus), "var(--alerte)") : ""}
      ${t.casinos.length ? carte(casinos) : vide("Pas de casino ici : il en faut une licence, dans les grandes villes.")}
      ${table}${salle}${d.partagee ?? ""}${coups}
      <div class="libelle">Garde-fous</div>${garde}
      ${licences}
      <p class="aide">Résultat de la saison : ${montant(t.resultatSaison)}.</p>
    </div>`;
}

export const pages = {
  hotels: {
    titre: "Hôtels",
    async donnees(ctx) { return { t: await ctx.tableau("hotels") }; },
    rendu: rendreHotels,
    actions: {
      reserver(ctx, b, d) {
        const h = d.t.hotels.find((x) => x.offre.id === b.dataset.id);
        if (!h) return;
        if (vaY(h.surPlace)) return allerEtablissement(ctx, h.surPlace, h.offre.nom); // D334
        const o = { ...h.offre }; if (o.proprietaire == null) delete o.proprietaire;
        return ctx.decider("hotel", { reserver: { _0: o } }, { succes: `Bonne nuit à ${h.offre.nom}` });
      },
      noter(ctx, b, d) {
        const x = d.t.aNoter.find((a) => a.hotel === b.dataset.hotel);
        if (!x) return;
        let n = 4;
        ctx.feuille({
          titre: `Ton avis sur ${x.nom}`,
          contenu: `<div class="pile">${segment([1, 2, 3, 4, 5].map((k) => [String(k), "★".repeat(k)]), String(n), "note")}
            ${carte(d.t.textesAvis.map((s, i) => ligne({ titre: esc(s), action: "texte", donnees: { i } })).join(""))}</div>`,
          actions: {
            note(c, el) { n = Number(el.dataset.valeur); el.closest(".segment")?.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === el))); },
            texte: (c, el) => c.decider("hotel", { avis: { hotel: x.hotel, note: n, texte: Number(el.dataset.i) } }, { succes: "Merci pour ton avis" }),
          },
        });
      },
    },
  },

  hotel: {
    titre: "Hôtel",
    async donnees(ctx, p) { return { t: await ctx.tableau("hotel", { id: p.id }) }; },
    rendu: rendreHotel,
    actions: {
      async changerEtoiles(ctx, b, d, p) {
        const e = d.t.choixEtoiles.find((x) => x.n === Number(b.dataset.n));
        if (!e) return;
        if (e.cout && !(await confirmer({ titre: `Passer à ${e.n} étoiles ?`, texte: `Travaux : ${montant(e.cout)}, payés par la trésorerie de l'hôtel. La nuit passe à ${montant(e.prixNuit)}.`, oui: "Faire les travaux" }))) return;
        return ctx.decider("hotel", { etoiles: { boite: p.id, etoiles: e.n } }, { succes: `${e.n} étoiles` });
      },
    },
  },

  casino: {
    titre: "Casino",
    css: "casino-cartes", // D337 : la salle des tables
    async donnees(ctx) {
      const t = await ctx.tableau("casino");
      // D339 : en ligne, au casino de ses jetons : la salle partagée (casino-multi.sql) ; un serveur sans ce fichier : rien.
      let partagee = null;
      if (t?.casinoActuel && enLigne.monde.code) {
        const brute = await enLigne.casinoSalle(t.casinoActuel, t.ville);
        if (brute) {
          enLigne.synchroniserCaisseCasino(ctx).catch(() => 0);
          const { salleHTML } = await import("./casino-partage.js?v=3e8bddd9");
          partagee = salleHTML(await ctx.tableau("salleCasino", { salle: brute }));
        }
      }
      return { t, partagee };
    },
    rendu: rendreCasino,
    actions: {
      jetons(ctx, b, d) {
        const c = d.t.casinos.find((x) => x.offre.id === b.dataset.id);
        if (!c) return;
        if (vaY(c.surPlace)) return allerEtablissement(ctx, c.surPlace, c.offre.nom); // D334
        const o = { ...c.offre }; if (o.proprietaire == null) delete o.proprietaire;
        ctx.feuille({
          titre: `Jetons, ${c.offre.nom}`,
          contenu: `<div class="pile">${champEuros("jetons-casino", { etiquette: "Combien ?" })}
            <p class="aide">Payés comptant (un compte courant ou le liquide), jamais à crédit. Encore ${montant(d.t.achatsRestants)} aujourd'hui.</p>
            ${bouton("Acheter les jetons", "acheter")}</div>`,
          actions: {
            async acheter(x) {
              const m = lireEuros("jetons-casino");
              if (!m || m <= 0) return x.toast("Indique un montant.", "refus");
              await x.decider("casino", { acheterJetons: { _0: o, montant: m } }, { succes: "Jetons en main" });
            },
          },
        });
      },
      encaisser: (ctx) => ctx.decider("casino", { encaisser: {} }, { succes: "Jetons encaissés" }),
      async soigner(ctx, b, d) {
        if (!(await confirmer({ titre: "Te faire aider ?", texte: `${d.t.soinJours} jours sans casino, accompagné : l'envie redescend vite. ${montant(d.t.soinPrix)}.`, oui: "Me faire aider" }))) return;
        return ctx.decider("casino", { soigner: {} }, { succes: "Tu te fais aider" });
      },
      exclure(ctx, b, d) {
        ctx.feuille({
          titre: "M'exclure des casinos",
          contenu: `<div class="pile"><p class="aide">Plus de jetons ni de mises dans aucun casino, jusqu'au bout. Pas de retour en arrière.</p>
            ${carte(d.t.exclusionsJours.map((j) => ligne({ titre: j >= 90 ? "Toute la saison" : `${j} jours`, action: "pour", donnees: { j } })).join(""))}</div>`,
          actions: { pour: (c, el) => c.decider("casino", { exclure: { jours: Number(el.dataset.j) } }, { succes: "Exclu des casinos" }) },
        });
      },
    },
  },
};
