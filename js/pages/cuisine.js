// ══════════════════════════════════════════════════════════════════════
//  La cuisine maison (RNT-189, D208) — EcranCuisine.swift, mot pour mot.
//
//  Une feuille, trois onglets : Recettes (le niveau, les familles, la
//  fiche d'une recette avec ses ingrédients, son risque et son panier
//  tout fait), Courses (les rayons, au magasin où l'on est ou livrées,
//  la place qui reste au frigo, au placard et au congélateur) et Chez
//  toi (ce qu'il y a, les restes, le congélateur à acheter). Tout vient
//  de `TableauCuisine` (moteur) ; tout achat passe par la fenêtre de
//  paiement (`ctx.decider("portefeuille", { cuisine: … })`).
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js";
import { carte, bouton, petit, ligne, rail, segment, bandeau } from "../ui.js";
import { sfRepas, SF_REPAS } from "./manger.js";

// MARK: Icônes en plus de celles des repas (symboles SF, en traits)

const SF_CUISINE = {
  drop: '<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>',
  square: '<rect x="5" y="7" width="14" height="10" rx="2"/>',
  circle: '<circle cx="12" cy="12" r="7"/>',
  cube: '<path d="M12 3.5 19.5 7.5v9L12 20.5 4.5 16.5v-9zM4.5 7.5 12 11.5l7.5-4M12 11.5v9"/>',
  sparkles: '<path d="M10 4l1.6 4.4L16 10l-4.4 1.6L10 16l-1.6-4.4L4 10l4.4-1.6zM17.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  "cup.and.saucer": '<path d="M5 8h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 9h1.5a2.5 2.5 0 0 1 0 5H16M4 20h14"/>',
  wineglass: '<path d="M7 3h10l-.5 5a4.5 4.5 0 0 1-9 0zM12 12.5V20M8.5 20h7"/>',
  refrigerator: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M6 10h12M9 6v2M9 13v3"/>',
  "frying.pan": '<ellipse cx="9.5" cy="13" rx="6.5" ry="5"/><path d="M16 11.5l5.5-2.5"/><circle cx="9.5" cy="13" r="1.8"/>',
  "chef": '<path d="M7 13a4 4 0 0 1-.5-7.9A5 5 0 0 1 12 3a5 5 0 0 1 5.5 2.1A4 4 0 0 1 17 13v6H7zM7 16h10"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  retour: '<path d="M15 5l-7 7 7 7"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
};
const ic = (nom, t = 0) => (SF_CUISINE[nom]
  ? `<svg viewBox="0 0 24 24" ${t ? `width="${t}" height="${t}"` : ""} fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SF_CUISINE[nom]}</svg>`
  : sfRepas(SF_REPAS[nom] ? nom : "fork.knife", t));

// Les teintes : par rayon, par endroit de la maison, par difficulté (du vert facile au rouge du chef).
const RAYON = { frais: "#6FB7E9", epicerie: "#C9A15B", surgeles: "#8FD3E8", boissons: "#B57FD8" };
const OU = { frigo: "#6FB7E9", placard: "#C9A15B", congelateur: "#8FD3E8" };
const NIVEAU = ["#4FB37E", "#4FB37E", "#7CBF5A", "#A8C24F", "#E3C46B", "#F0B04A", "#F0954A", "#E9764A", "#E5534B", "#C9405F"];
const teinteNiveau = (n) => NIVEAU[Math.max(0, Math.min(9, n - 1))];
const euros = (c) => montant(c, { centimes: true });

/** Une fois : les quelques règles de la feuille (le reste vient de styles.css). */
function injecterStyle() {
  if (document.getElementById("style-cuisine")) return;
  const s = document.createElement("style");
  s.id = "style-cuisine";
  s.textContent = `
.cuisine-niveau { display: flex; gap: 14px; align-items: center; }
.cuisine-niveau .medaille { width: 52px; height: 52px; border-radius: 16px; flex: none; display: grid; place-items: center; color: #fff;
  background: linear-gradient(135deg, var(--c), color-mix(in srgb, var(--c) 65%, transparent)); font-size: 22px; font-weight: 700; letter-spacing: -0.04em; }
.cuisine-places { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 12px 16px; }
.cuisine-places .rail { margin-top: 6px; }
.cuisine-filtres { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -20px; padding: 0 20px 2px; }
.cuisine-filtres::-webkit-scrollbar { display: none; }
.cuisine-niv { width: 32px; height: 32px; border-radius: 9px; flex: none; display: grid; place-items: center; font-size: 14px; font-weight: 700;
  color: var(--c); background: color-mix(in srgb, var(--c) 16%, transparent); }
.cuisine-niv.verrou { color: var(--texte3); background: var(--puce); }
.cuisine-niv svg { width: 15px; height: 15px; }
.cuisine-etat { font-size: 12px; margin-top: 3px; color: var(--texte3); }
.cuisine-etat.ok { color: var(--gain); }
.cuisine-etat.risque { color: var(--alerte); }
.cuisine-chiffres { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; text-align: center; }
.cuisine-chiffres b { display: block; font-size: 17px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.03em; }
.cuisine-chiffres span { font-size: 12px; color: var(--texte2); }
.cuisine-ingr { display: flex; align-items: center; gap: 10px; padding: 11px 16px; }
.cuisine-ingr + .cuisine-ingr { border-top: 1px solid var(--filet); }
.cuisine-ingr .nom { flex: 1; min-width: 0; font-size: 15px; }
.cuisine-ingr .qte { font-size: 13px; color: var(--texte2); font-variant-numeric: tabular-nums; }
.cuisine-ingr .ok { color: var(--gain); }
.cuisine-ingr .manque { color: var(--alerte); }
.cuisine-ingr svg { width: 16px; height: 16px; flex: none; color: var(--texte2); }
.cuisine-retour { display: inline-flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 600; color: var(--texte2); align-self: flex-start; }
.cuisine-retour svg { width: 16px; height: 16px; }
.cuisine-total { position: sticky; bottom: 0; padding-top: 10px; background: linear-gradient(transparent, var(--feuille) 30%); }
`;
  document.head.append(s);
}

// MARK: La feuille

/** La cuisine : `onglet` « recettes », « courses » ou « maison » ; `livrer` : les courses livrées d'office. */
export async function ouvrirCuisine(ctx, { onglet = "recettes", livrer = false } = {}) {
  injecterStyle();
  let t = await ctx.tableau("cuisine");
  if (!t) return false;
  const etat = { onglet, famille: "tout", recette: null, livrer: livrer || !t.magasin, rayon: t.rayons[0]?.id ?? "frais", panier: {} };
  // Une feuille fermée entre-temps ne se rouvre pas.
  const recharger = async () => { t = await ctx.tableau("cuisine"); if (t && document.getElementById("feuille")?.open) redessiner(); };
  // Redessine sans perdre où l'on en était dans la liste.
  const redessiner = () => {
    const corps = document.querySelector("#feuille .corps-feuille");
    const haut = corps?.scrollTop ?? 0;
    ctx.feuille(def);
    const apres = document.querySelector("#feuille .corps-feuille");
    if (apres) apres.scrollTop = haut;
  };
  const decider = async (op, succes, { fermer = false } = {}) => {
    const ok = await ctx.decider("portefeuille", { cuisine: { _0: op } }, { succes, fermer });
    if (ok && !fermer) { etat.panier = {}; await recharger(); }
    return ok;
  };
  const def = {
    titre: "Ta cuisine",
    rendu: () => {
      if (etat.recette) return ficheRecette(t, t.recettes.find((r) => r.id === etat.recette), etat);
      return `<div class="pile">
        ${carteEnCuisine(t.enCuisine)}
        ${segment([["recettes", "Recettes"], ["courses", "Courses"], ["maison", "Chez toi"]], etat.onglet, "onglet")}
        ${etat.onglet === "recettes" ? ongletRecettes(t, etat) : etat.onglet === "courses" ? ongletCourses(t, etat) : ongletMaison(t)}
      </div>`;
    },
    actions: {
      onglet(c, el) { etat.onglet = el.dataset.valeur; redessiner(); },
      famille(c, el) { etat.famille = el.dataset.id; redessiner(); },
      recette(c, el) { etat.recette = el.dataset.id; ctx.feuille(def); },
      retourRecettes() { etat.recette = null; redessiner(); },
      mode(c, el) { etat.livrer = el.dataset.valeur === "livrer"; etat.panier = {}; redessiner(); },
      rayon(c, el) { etat.rayon = el.dataset.id; redessiner(); },
      plus(c, el) { etat.panier[el.dataset.id] = (etat.panier[el.dataset.id] ?? 0) + 1; redessiner(); },
      moins(c, el) { etat.panier[el.dataset.id] = Math.max(0, (etat.panier[el.dataset.id] ?? 0) - 1); redessiner(); },
      viderPanier() { etat.panier = {}; redessiner(); },
      payerCourses() {
        const articles = Object.fromEntries(Object.entries(etat.panier).filter(([, q]) => q > 0));
        return decider({ courses: { _0: { articles, ...(etat.livrer ? { livrer: true } : {}) } } },
          etat.livrer ? `Livrées dans ${t.livraisonMinutes} min` : "Courses rangées");
      },
      panier(c, el) {
        const livre = el.dataset.livrer === "1";
        return decider({ courses: { _0: { articles: {}, paniers: { [el.dataset.id]: 1 }, ...(livre ? { livrer: true } : {}) } } },
          livre ? `Panier livré dans ${t.livraisonMinutes} min` : "Panier rangé");
      },
      cuire: (c, el) => decider({ cuisiner: { _0: el.dataset.id } }, "Aux fourneaux", { fermer: true }),
      reste: (c, el) => decider({ mangerReste: { _0: el.dataset.id } }, "Ça réchauffe", { fermer: true }),
      laisserEnPlan: () => decider({ laisserEnPlan: {} }, "Plat laissé en plan"),
      jeter: (c, el) => decider({ jeterReste: { _0: el.dataset.id } }, "Reste jeté"),
      congelateur: (c, el) => decider({ acheterCongelateur: { _0: el.dataset.id } }, "Congélateur branché"),
    },
  };
  ctx.feuille(def);
  return true;
}

// MARK: En cuisine (RNT-199)

/** Le plat sur le feu : le minuteur (qui avance tout seul), l'avertissement, « Laisser en plan ». */
export function carteEnCuisine(e) {
  if (!e) return "";
  minuteurs();
  return carte(`<div class="rangee" style="gap:12px">
      <span class="pastille" style="--c:#F2A65A">${ic("frying.pan")}</span>
      <div style="flex:1;min-width:0">
        <div class="aide">${e.reste ? "Ça réchauffe" : "En cuisine"}</div>
        <div class="libelle">${esc(e.nom)}</div>
        <div class="aide minuteur-cuisine" data-debut="${e.debut}" data-fin="${e.fin}">${esc(e.finTexte)} · encore ${e.minutesRestantes} min</div>
      </div></div>
    <div class="minuteur-rail" data-debut="${e.debut}" data-fin="${e.fin}" style="margin-top:12px">${rail(e.part, "#F2A65A", 5)}</div>
    <p class="aide" style="margin-top:10px">${esc(e.avertissement)} Puis à table, ${e.tableMinutes} min.</p>
    <div class="choix" style="margin-top:10px">${petit("Laisser en plan", "laisserEnPlan")}</div>`, { pad: true });
}

/** Une fois : les minuteurs « encore N min » avancent sans recharger la page. */
let minuteurLance = false;
export function minuteurs() {
  if (minuteurLance) return;
  minuteurLance = true;
  setInterval(() => {
    const now = window.__grind?.maintenant?.() ?? Date.now();
    for (const el of document.querySelectorAll(".minuteur-cuisine[data-fin]")) {
      const reste = Math.max(0, Math.ceil((Number(el.dataset.fin) - now) / 60_000));
      el.textContent = el.textContent.replace(/encore \d+ min/, `encore ${reste} min`);
    }
    for (const el of document.querySelectorAll(".minuteur-rail[data-fin]")) {
      const d = Number(el.dataset.debut), f = Number(el.dataset.fin);
      const i = el.querySelector(".rail i");
      if (i && f > d) i.style.width = `${Math.round(Math.min(1, Math.max(0, (now - d) / (f - d))) * 100)}%`;
    }
  }, 10_000);
}

/** Laisser le plat : il est perdu, mais on peut partir. */
export function laisserEnPlan(ctx) {
  return ctx.decider("portefeuille", { cuisine: { _0: { laisserEnPlan: {} } } }, { succes: "Plat laissé en plan" });
}

// MARK: Le niveau

function carteNiveau(t) {
  const n = t.niveau, c = teinteNiveau(n.niveau);
  const vers = n.suivant != null ? `${n.xp} / ${n.suivant} xp vers ${esc(n.suivantNom)}` : `${n.xp} xp : tout est débloqué`;
  return carte(`<div class="cuisine-niveau">
      <span class="medaille" style="--c:${c}">${n.niveau}</span>
      <div style="flex:1;min-width:0">
        <div class="aide">Niveau de cuisine</div>
        <div class="libelle" style="font-size:18px">${esc(n.nom)}</div>
        <div style="margin-top:8px">${rail(n.part, c, 5)}</div>
        <div class="aide" style="margin-top:6px">${vers}${n.plats ? ` · ${n.plats} plat${n.plats > 1 ? "s" : ""}${n.rates ? `, ${n.rates} raté${n.rates > 1 ? "s" : ""}` : ""}` : ""}</div>
      </div></div>`, { pad: true });
}

// MARK: Recettes

function ongletRecettes(t, etat) {
  const faisables = t.recettes.filter((r) => r.faisable).length;
  const filtres = [["tout", "Toutes"], ["faisables", `Faisables${faisables ? ` (${faisables})` : ""}`], ...t.familles.map((f) => [f.id, f.nom])];
  const liste = t.recettes.filter((r) => etat.famille === "tout" || (etat.famille === "faisables" ? r.faisable : r.famille === etat.famille));
  return `${carteNiveau(t)}
    ${t.refus ? bandeau(esc(t.refus), "var(--texte2)") : ""}
    <div class="cuisine-filtres">${filtres.map(([id, nom]) => petit(esc(nom), "famille", { plein: etat.famille === id, donnees: { id } })).join("")}</div>
    ${liste.length ? carte(liste.map(ligneRecette).join("")) : `<p class="aide">Rien de faisable pour l'instant : un panier tout fait règle ça.</p>`}
    <p class="aide">${esc(t.aide[0])} ${esc(t.aide[1])}</p>`;
}

function etatRecette(r) {
  if (r.verrou) return `<div class="cuisine-etat">Se débloque au niveau ${r.verrou}</div>`;
  if (r.manque.length) return `<div class="cuisine-etat">Il manque : ${esc(r.manque.join(", ").toLowerCase())}</div>`;
  if (r.rate) return `<div class="cuisine-etat risque">Prête · ${r.rate} % de risque de rater</div>`;
  return `<div class="cuisine-etat ok">Prête à cuisiner</div>`;
}

function pastilleNiveau(r) {
  return r.verrou ? `<span class="cuisine-niv verrou">${ic("lock")}</span>`
    : `<span class="cuisine-niv" style="--c:${teinteNiveau(r.niveau)}">${r.niveau}</span>`;
}

function ligneRecette(r) {
  const detail = `${duree(r.minutes)} · cale +${Math.round(r.faim)} · plaisir +${Math.round(r.plaisir)}${r.parts > 1 ? ` · ${r.parts} parts` : ""}${etatRecette(r)}`;
  return `<button class="ligne" data-action="recette" data-id="${esc(r.id)}" data-faisable="${r.faisable ? 1 : 0}">${pastilleNiveau(r)}
    <span style="min-width:0;flex:1"><div class="titre">${esc(r.nom)}</div><div class="detail">${detail}</div></span>
    <span class="chevron">${ic("chevron", 14)}</span></button>`;
}

function ficheRecette(t, r, etat) {
  if (!r) return `<p class="aide">Recette introuvable.</p>`;
  const ici = t.peutCuisiner;
  const ingredients = r.ingredients.map((x) => `<div class="cuisine-ingr">${ic(x.icone)}
      <span class="nom">${esc(x.nom)}</span>
      <span class="qte ${x.enStock >= x.quantite ? "ok" : "manque"}">${x.enStock >= x.quantite ? ic("check", 14) : `${x.enStock}/`}${x.quantite}</span></div>`).join("");
  const cuire = r.verrou ? `Se débloque au niveau ${r.verrou}` : r.manque.length ? "Il manque des produits" : !ici ? "Pas ici" : `Cuisiner · ${duree(r.minutes)}`;
  const paniers = [
    r.panier != null ? petit(`Panier ici · ${euros(r.panier)}`, "panier", { plein: true, donnees: { id: r.id, livrer: "0" }, desactive: !t.habite }) : "",
    petit(`Panier livré · ${euros(r.panierLivre)}`, "panier", { donnees: { id: r.id, livrer: "1" }, desactive: !t.habite }),
  ].join("");
  return `<div class="pile">
    <button class="cuisine-retour" data-action="retourRecettes">${ic("retour")}Recettes</button>
    <div class="rangee" style="gap:14px">${pastilleNiveau(r)}
      <div style="flex:1;min-width:0"><div class="libelle" style="font-size:20px">${esc(r.nom)}</div>
        <div class="aide">Niveau ${r.niveau} · ${esc(t.familles.find((f) => f.id === r.famille)?.nom ?? "")}${r.fois ? ` · réussie ${r.fois} fois` : ""}</div></div></div>
    ${carte(`<div class="cuisine-chiffres">
      <div><b>${duree(r.minutes)}</b><span>en cuisine</span></div>
      <div><b>+${Math.round(r.faim)}</b><span>cale</span></div>
      <div><b>+${Math.round(r.plaisir)}</b><span>plaisir</span></div>
      <div><b>${r.parts}</b><span>part${r.parts > 1 ? "s" : ""}</span></div></div>`, { pad: true })}
    ${r.verrou ? bandeau(`Il te faut le niveau ${r.verrou} de cuisine (tu es niveau ${t.niveau.niveau}).`, "var(--texte2)")
      : r.rate ? bandeau(`Au-dessus de ton niveau : <b>${r.rate} %</b> de risque de rater (moins calé, bien moins bon).`, "var(--alerte)") : ""}
    <div class="section" style="margin-bottom:0">Ingrédients</div>
    ${carte(ingredients)}
    ${r.parts > 1 ? `<p class="aide" style="margin:0 4px">Tu en manges une part ; ${r.parts - 1 > 1 ? `les ${r.parts - 1} autres se gardent` : "l'autre se garde"} au frigo (ou au congélateur).</p>` : ""}
    <div class="section" style="margin-bottom:0">Le panier tout fait</div>
    <p class="aide" style="margin:0 4px">Juste ce qu'il faut pour la recette, ${t.panierSurcout} % plus cher que pris un par un.${r.panierFin && r.panier == null ? " Un produit fin : à l'épicerie fine, ou livré." : ""}</p>
    <div class="choix">${paniers}</div>
    ${bouton(cuire, "cuire", { teinte: teinteNiveau(r.niveau), genre: "teinte", donnees: { id: r.id }, desactive: !r.faisable || !ici })}
    ${!ici && t.refus ? `<p class="aide" style="margin:0 4px;text-align:center">${esc(t.refus)}</p>` : ""}
    <p class="aide" style="margin:0 4px;text-align:center">+${r.xp} xp en cuisine${r.rate ? " (la moitié si c'est raté)" : ""}.</p>
  </div>`;
}

// MARK: Courses

function placesAvec(t, ajout) {
  return t.places.map((p) => {
    const plus = ajout[p.id] ?? 0, x = p.occupe + plus, trop = x > p.capacite;
    return `<div><div class="rangee entre"><span class="aide">${esc(p.nom)}</span><span class="chiffres ${trop ? "alerte" : ""}" style="font-size:13px">${x}/${p.capacite}</span></div>
      ${rail(Math.min(1, x / Math.max(1, p.capacite)), trop ? "var(--alerte)" : OU[p.id], 4)}</div>`;
  }).join("");
}

function ongletCourses(t, etat) {
  const prix = (p) => (etat.livrer ? p.prixLivre : p.prix);
  const tous = t.rayons.flatMap((r) => r.produits);
  const articles = tous.reduce((s, p) => s + prix(p) * (etat.panier[p.id] ?? 0), 0);
  const total = articles + (etat.livrer && articles ? t.fraisLivraison : 0);
  // Où ça va se ranger : frais au frigo, sec au placard, surgelé au congélateur (au frigo sans).
  const ajout = {};
  const congel = t.places.some((p) => p.id === "congelateur");
  for (const p of tous) {
    const q = etat.panier[p.id] ?? 0;
    if (!q) continue;
    const ou = p.garde === "sec" ? "placard" : p.garde === "surgele" && congel ? "congelateur" : "frigo";
    ajout[ou] = (ajout[ou] ?? 0) + q;
  }
  const nb = Object.values(etat.panier).reduce((s, q) => s + q, 0);
  const rayon = t.rayons.find((r) => r.id === etat.rayon) ?? t.rayons[0];
  const ou = t.magasin ? `Tu es ${t.magasin === "epicerie" ? "à l'épicerie fine" : "au supermarché"}${t.magasinNom ? ` (${esc(t.magasinNom)})` : ""}.`
    : `${esc(t.supermarche ?? "Le supermarché")} est sur le plan${t.epicerie ? `, ${esc(t.epicerie)} aussi` : ""} : en attendant, on te livre.`;
  const lignes = rayon.produits.map((p) => {
    const dispo = etat.livrer || p.ici;
    return `<div class="ligne">
      <span class="pastille" style="--c:${RAYON[rayon.id]}">${ic(p.icone)}</span>
      <span style="min-width:0;flex:1"><div class="titre">${esc(p.nom)}${p.fine ? ` <span class="puce" style="padding:1px 7px">fin</span>` : ""}</div>
        <div class="detail">${euros(prix(p))} · ${esc(p.conservation)}${p.quantite ? ` · ${p.quantite} chez toi` : ""}${!dispo ? "<br><span class=\"t3\">À l'épicerie fine (ou livré)</span>" : ""}</div></span>
      <span class="pas"><button class="rond" data-action="moins" data-id="${esc(p.id)}" aria-label="Une de moins" ${etat.panier[p.id] ? "" : "disabled"}>−</button>
        <b class="chiffres">${etat.panier[p.id] ?? 0}</b><button class="rond" data-action="plus" data-id="${esc(p.id)}" aria-label="Une de plus" ${dispo && t.habite ? "" : "disabled"}>+</button></span></div>`;
  }).join("");
  return `${!t.habite ? bandeau("Pas de logement, pas de frigo : loue ou achète un toit.", "var(--alerte)") : ""}
    ${t.magasin ? segment([["ici", t.magasin === "epicerie" ? "Épicerie fine" : "Supermarché"], ["livrer", `Livrées · ${t.livraisonMinutes} min`]], etat.livrer ? "livrer" : "ici", "mode") : ""}
    <p class="aide" style="margin:0 4px">${ou}${etat.livrer ? ` Livrées chez toi : un peu plus cher, ${euros(t.fraisLivraison)} de frais.` : t.magasin === "epicerie" ? " Plus cher, mais ce que tu cuisines avec fait bien plus plaisir." : ""}</p>
    ${carte(`<div class="cuisine-places">${placesAvec(t, ajout)}</div>`, { pad: true })}
    <div class="cuisine-filtres">${t.rayons.map((r) => petit(`${esc(r.nom)}`, "rayon", { plein: r.id === rayon.id, donnees: { id: r.id } })).join("")}</div>
    ${carte(lignes)}
    <p class="aide" style="margin:0 4px">Pour une recette précise, son panier tout fait (Recettes, la fiche) : juste ce qu'il faut, ${t.panierSurcout} % plus cher.</p>
    <div class="cuisine-total">
      ${nb ? `<div class="rangee entre" style="margin:0 4px 8px"><span class="aide">${nb} portion${nb > 1 ? "s" : ""}</span>${petit("Vider", "viderPanier")}</div>` : ""}
      ${bouton(total ? `Payer ${euros(total)}` : "Ton panier est vide", "payerCourses", { genre: "teinte", teinte: "var(--argent)", desactive: !total })}
    </div>`;
}

// MARK: Chez toi

function ongletMaison(t) {
  const parOu = (ou) => t.stock.filter((x) => x.ou === ou);
  const puces = (l) => `<div class="denrees" style="margin-top:10px">${l.map((x) => `<span class="denree ${x.bientot ? "bientot" : ""}">${ic(x.icone, 14)}${esc(x.nom)} <b class="chiffres">${x.quantite}</b><i>${esc(x.perime)}</i></span>`).join("")}</div>`;
  const blocs = [["frigo", "Frigo"], ["placard", "Placard"], ["congelateur", "Congélateur"]].map(([ou, nom]) => {
    const l = parOu(ou);
    return l.length ? `<div style="margin-top:14px"><div class="aide">${nom}</div>${puces(l)}</div>` : "";
  }).join("");
  const restes = t.restes.length ? carte(t.restes.map((r) => `<div class="ligne" style="flex-wrap:wrap">
      <span class="pastille" style="--c:${r.congele ? OU.congelateur : OU.frigo}">${ic(r.congele ? "snowflake" : "frying.pan")}</span>
      <span style="min-width:0;flex:1"><div class="titre">${esc(r.nom)} <span class="chiffres t2">× ${r.portions}</span></div>
        <div class="detail">${r.congele ? "Au congélateur" : "Au frigo"} · ${r.bientot ? `<span class="alerte">${esc(r.perime)}</span>` : esc(r.perime)} · cale +${Math.round(r.faim)} · ${r.minutes} min</div></span>
      <span class="choix">${petit("Jeter", "jeter", { donnees: { id: r.id } })}${petit("Manger", "reste", { plein: true, donnees: { id: r.id }, desactive: !t.peutCuisiner })}</span></div>`).join(""))
    : `<p class="aide" style="margin:0 4px">Pas de restes. Une recette à plusieurs parts en laisse : ${esc(t.aide[2].toLowerCase())}</p>`;
  const congelateurs = carte(t.congelateurs.map((k) => ligne({
    titre: esc(k.nom) + (k.possede ? ` <span class="puce" style="padding:1px 7px">le tien</span>` : ""),
    detail: `${esc(k.detail)} · ${k.capacite} portions${k.refus && !k.possede ? `<br><span class="t3">${esc(k.refus)}</span>` : ""}`,
    valeur: k.possede ? "" : montant(k.prix), icone: ic(k.icone), teinte: OU.congelateur,
    action: k.refus ? "" : "congelateur", donnees: { id: k.id }, desactive: !!k.refus && !k.possede,
  })).join(""));
  return `${!t.habite ? bandeau("Pas de logement, pas de frigo ni de cuisine : loue ou achète un toit.", "var(--alerte)") : ""}
    ${carte(`<div class="cuisine-places">${placesAvec(t, {})}</div>
      ${t.stock.length ? blocs : `<p class="aide" style="margin-top:12px">${t.habite ? "Tout est vide : direction les courses." : "Rien chez toi."}</p>`}
      ${t.jetees ? `<p class="aide" style="margin-top:10px">${t.jetees} portion${t.jetees > 1 ? "s" : ""} jetée${t.jetees > 1 ? "s" : ""}, périmée${t.jetees > 1 ? "s" : ""}.</p>` : ""}
      ${t.livraisons.map((l) => `<p class="aide" style="margin-top:6px">${sfRepas("cart.fill", 13)} ${esc(l)}</p>`).join("")}`, { pad: true })}
    <div class="section" style="margin-bottom:0">Les restes</div>
    ${restes}
    <div class="section" style="margin-bottom:0">${t.congelateur ? "Ton congélateur" : "Un congélateur"}</div>
    <p class="aide" style="margin:0 4px">${t.congelateur ? `Les surgelés et les restes s'y gardent des semaines. Un plus grand reprend ce qu'il y a dedans.` : "Sans congélateur, un surgelé dégèle au frigo (à manger le jour même) et les restes tiennent trois jours. Avec : des semaines."}</p>
    ${congelateurs}`;
}

// MARK: Outils

function duree(m) {
  return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}` : `${m} min`;
}
