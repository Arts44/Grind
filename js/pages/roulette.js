// ══════════════════════════════════════════════════════════════════════
//  La table de roulette (D338, 1.17.47), comme sur l'iPhone (TableRoulette.swift) :
//  la roue européenne à un zéro, le tapis vert où l'on pose ses jetons d'un
//  toucher (plein au centre d'une case, cheval sur un bord, carré dans un coin,
//  transversale et sixain au bord gauche d'une rangée), la roue qui tourne et
//  la bille qui tombe (sans animation si l'on réduit les mouvements), les
//  derniers numéros. Le moteur tire et règle (Roulette.swift), le tableau
//  « roulette » donne tout (TableauxJeuxCasino.swift).
// ══════════════════════════════════════════════════════════════════════
import { montant, pourcent as pourcentBrut, esc } from "../format.js?v=3e8bddd9";
import { carte, bouton, petit, entetePousse, vide, bandeau, segment } from "../ui.js?v=3e8bddd9";

const PAS = 360 / 37;
/** « 2,7 % » sans coupure avant le signe. */
const pourcent = (x, d) => pourcentBrut(x, d).replace(" %", "\u00a0%");
const reduit = () => matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("economie");

/** L'état de la table, gardé avec la page : le jeton choisi, les mises posées, la roue, le dernier coup vu. */
const vue = (p) => (p.vue ??= { table: "europeenne", jeton: 0, mises: {}, ordre: [], precedentes: null, angle: 0, vu: null, tourne: false });

/** Les numéros d'une mise (les mêmes règles que Roulette.swift, pour dessiner) ; le moteur, lui, vérifie. */
const SIMPLES = [["manque", "1 à 18"], ["pair", "Pair"], ["rouge", ""], ["noir", ""], ["impair", "Impair"], ["passe", "19 à 36"]];
const DOUZAINES = [["d1", "1<sup>re</sup> 12"], ["d2", "2<sup>e</sup> 12"], ["d3", "3<sup>e</sup> 12"]];

/** Jeton compact : « 25 », « 1k », « 10k ». */
const court = (c) => { const e = c / 100; return e >= 1000 ? `${e / 1000}k` : String(e); };

/** Les zones du tapis où poser un jeton, sur la grille des numéros (3 colonnes × 13 rangées, le zéro en haut). */
function zones() {
  const z = [];
  const k = (l) => "n:" + [...l].sort((a, b) => a - b).join("-");
  for (let n = 1; n <= 36; n++) {
    const r = Math.ceil(n / 3), c = (n - 1) % 3;
    if (n % 3 !== 0) z.push({ cle: k([n, n + 1]), x: c + 1, y: r + 0.5, genre: "v" });
    if (n <= 33) z.push({ cle: k([n, n + 3]), x: c + 0.5, y: r + 1, genre: "h" });
    if (n % 3 !== 0 && n <= 32) z.push({ cle: k([n, n + 1, n + 3, n + 4]), x: c + 1, y: r + 1, genre: "coin" });
    if (n % 3 === 1) z.push({ cle: k([n, n + 1, n + 2]), x: 0, y: r + 0.5, genre: "v" });
    if (n % 3 === 1 && n <= 31) z.push({ cle: k([n, n + 1, n + 2, n + 3, n + 4, n + 5]), x: 0, y: r + 1, genre: "coin" });
  }
  for (const n of [1, 2, 3]) z.push({ cle: k([0, n]), x: n - 0.5, y: 1, genre: "h" });
  z.push({ cle: k([0, 1, 2]), x: 1, y: 1, genre: "coin" }, { cle: k([0, 2, 3]), x: 2, y: 1, genre: "coin" }, { cle: k([0, 1, 2, 3]), x: 0, y: 1, genre: "coin" });
  return z;
}
const ZONES = zones();
/** Où dessiner le jeton d'une mise intérieure (sur la grille des numéros). */
const position = (cle) => {
  const z = ZONES.find((x) => x.cle === cle);
  if (z) return z;
  const n = Number(cle.slice(2));
  return n === 0 ? { x: 1.5, y: 0.5 } : { x: ((n - 1) % 3) + 0.5, y: Math.ceil(n / 3) + 0.5 };
};

const jeton = (valeur, couleurs, valeurs, classe = "") => {
  const i = Math.max(0, valeurs.filter((v) => v <= valeur).length - 1);
  return `<span class="rl-jeton ${classe}" style="--j:${couleurs[i] ?? "#b3262e"}"><b>${court(valeur)}</b></span>`;
};

// MARK: La roue

export function roue(t, v) {
  const R = 100, rp = 84, ri = 62;
  const secteurs = t.roue.map((c, i) => {
    const a0 = (i - 0.5) * PAS * Math.PI / 180, a1 = (i + 0.5) * PAS * Math.PI / 180;
    const p = (r, a) => `${(Math.sin(a) * r).toFixed(2)} ${(-Math.cos(a) * r).toFixed(2)}`;
    const ac = i * PAS * Math.PI / 180;
    return `<path class="rl-case ${c.couleur}" d="M${p(rp, a0)} A${rp} ${rp} 0 0 1 ${p(rp, a1)} L${p(ri, a1)} A${ri} ${ri} 0 0 0 ${p(ri, a0)} Z"/>
      <text class="rl-num" transform="translate(${p(rp - 9, ac).replace(" ", ",")}) rotate(${(i * PAS).toFixed(2)})">${c.numero}</text>`;
  }).join("");
  const rayons = Array.from({ length: 8 }, (_, i) => `<line class="rl-rayon" x1="0" y1="0" x2="${(Math.sin(i * Math.PI / 4) * 50).toFixed(1)}" y2="${(-Math.cos(i * Math.PI / 4) * 50).toFixed(1)}"/>`).join("");
  return `<svg class="rl-roue" viewBox="-105 -105 210 210" role="img" aria-label="La roue">
    <circle class="rl-bois" r="${R + 4}"/><circle class="rl-piste" r="${R - 4}"/>
    <g class="rl-plateau" style="--a:${v.angle}deg">${secteurs}<circle class="rl-cone" r="${ri}"/>${rayons}<circle class="rl-moyeu" r="12"/></g>
    <g class="rl-orbite"><circle class="rl-bille" cx="0" cy="${-(rp - 20)}" r="4.6"/></g>
  </svg>`;
}

// MARK: Le tapis

export function tapis(t, v, gagnantes) {
  const { valeursJetons: valeurs, couleursJetons: couleurs } = t;
  // D339 : à une table partagée, les jetons des autres joueurs, à leur couleur (`v.autres` : { cle, couleur }).
  const autres = (cle) => (v.autres ?? []).filter((a) => a.cle === cle).map((a) => `<i class="rl-autre" style="--j:${a.couleur}"></i>`).join("");
  const mise = (cle) => (v.mises[cle] ? jeton(v.mises[cle], couleurs, valeurs, gagnantes.has(cle) ? "gagne" : "") : "") + autres(cle);
  const cases = [`<button class="rl-n vert" data-action="poser" data-cle="n:0" style="--x:1.5;--y:0.5" aria-label="Plein 0"><span>0</span></button>`];
  for (let n = 1; n <= 36; n++) {
    const coul = t.roue.find((c) => c.numero === n).couleur;
    cases.push(`<button class="rl-n ${coul}" data-action="poser" data-cle="n:${n}" style="--x:${((n - 1) % 3) + 0.5};--y:${Math.ceil(n / 3) + 0.5}" aria-label="Plein ${n}"><span>${n}</span></button>`);
  }
  const bords = ZONES.map((z) => `<button class="rl-bord ${z.genre}" data-action="poser" data-cle="${z.cle}" style="--x:${z.x};--y:${z.y}" aria-label="${esc(z.cle)}"></button>`).join("");
  const jetonsInterieurs = [...new Set([...Object.keys(v.mises), ...(v.autres ?? []).map((a) => a.cle)])].filter((c) => c.startsWith("n:")).map((c) => {
    const p = position(c);
    return `<span class="rl-pose" style="--x:${p.x};--y:${p.y}">${mise(c)}</span>`;
  }).join("");
  const dernier = v.vu != null && t.dernier && !v.tourne ? t.dernier.numero : null;
  const marque = dernier != null ? (() => { const p = position(`n:${dernier}`); return `<span class="rl-marque" style="--x:${p.x};--y:${p.y}"></span>`; })() : "";
  const simples = SIMPLES.map(([cle, txt]) => `<button class="rl-ext rl-simple ${cle}" data-action="poser" data-cle="${cle}">${txt ? `<span>${txt}</span>` : `<i class="rl-losange ${cle}"></i>`}${mise(cle)}</button>`).join("");
  const douzaines = DOUZAINES.map(([cle, txt]) => `<button class="rl-ext rl-douz" data-action="poser" data-cle="${cle}"><span>${txt}</span>${mise(cle)}</button>`).join("");
  const colonnes = ["c1", "c2", "c3"].map((cle) => `<button class="rl-ext rl-col" data-action="poser" data-cle="${cle}"><span>2 à 1</span>${mise(cle)}</button>`).join("");
  return `<div class="rl-tapis" id="rl-tapis">
    <div class="rl-simples">${simples}</div>
    <div class="rl-douzaines">${douzaines}</div>
    <div class="rl-nums">${cases.join("")}${bords}${marque}${jetonsInterieurs}</div>
    <div class="rl-cols">${colonnes}</div>
  </div>`;
}

// MARK: La page

function rendre(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Roulette")}${vide("Le casino ouvre avec ta première saison.")}`;
  const v = vue(p);
  if (v.vu == null && !v.tourne) v.vu = t.coups;
  const enAttente = v.tourne || v.vu !== t.coups;
  const r = !enAttente ? t.dernier : null;
  const jetons = enAttente && t.dernier ? t.entete.jetons - (sommeRendus(t.dernier) - sommeMises(t.dernier)) : t.entete.jetons;
  const posees = Object.values(v.mises).reduce((a, b) => a + b, 0);
  const histo = (enAttente ? t.historique.slice(1) : t.historique).slice(0, 14);
  const gagnantes = new Set(r ? r.mises.filter((m, i) => r.rendus[i] > 0).map((m) => m.cle) : []);
  const resultat = r && v.vu === t.coups && t.dernier ? (() => {
    const gain = sommeRendus(r) - sommeMises(r);
    return `<div class="rl-resultat ${r.couleur}"><span class="rl-pastille ${r.couleur}">${r.numero}</span>
      <div><b>${r.numero === 0 ? "Zéro" : `${r.numero} ${r.couleur === "rouge" ? "Rouge" : "Noir"}`}</b>
      <span class="${gain > 0 ? "gain" : "t2"}">${sommeRendus(r) > 0 ? `La table te rend ${montant(sommeRendus(r))}` : `Mises perdues : ${montant(sommeMises(r))}`}</span></div></div>`;
  })() : `<div class="rl-resultat attente"><span class="t2">${v.tourne ? "Rien ne va plus…" : "Faites vos jeux."}</span></div>`;
  const choixJetons = t.valeursJetons.map((x, i) => `<button class="rl-choix${i === v.jeton ? " choisi" : ""}" data-action="jeton" data-i="${i}" aria-pressed="${i === v.jeton}">${jeton(x, t.couleursJetons, t.valeursJetons)}</button>`).join("");
  return `${entetePousse("Roulette")}
    <div class="pile rl-page" id="zone-roulette">
      ${t.entete.refus ? bandeau(esc(t.entete.refus), "var(--alerte)") : ""}
      ${t.francaiseOuverte ? segment([["europeenne", "Européenne"], ["francaise", "Française · la partage"]], t.francaise ? "francaise" : "europeenne", "choisirTable") : ""}
      <div class="rl-haut">
        ${roue(t, v)}
        <div class="rl-cote">
          ${resultat}
          <div class="rl-histo" aria-label="Derniers numéros">${histo.map((c) => `<span class="rl-pastille ${c.couleur}">${c.numero}</span>`).join("") || `<span class="t2">Pas encore de numéro.</span>`}</div>
          <div class="rl-solde"><span class="t2">Jetons</span><b class="chiffres">${montant(jetons)}</b><span class="t2">Sur le tapis : ${montant(posees)}</span></div>
        </div>
      </div>
      ${tapis(t, v, gagnantes)}
      <div class="rl-rack" role="group" aria-label="Valeur du jeton">${choixJetons}</div>
      <div class="rang rl-gestes">
        ${petit("Annuler", "annuler", { desactive: !v.ordre.length || v.tourne })}
        ${petit("Tout retirer", "effacer", { desactive: !v.ordre.length || v.tourne })}
        ${v.precedentes && !v.ordre.length ? petit("Rejouer", "rejouer", { desactive: v.tourne }) : ""}
      </div>
      ${bouton(v.tourne ? "La bille tourne…" : `Lancer la bille${posees ? ` · ${montant(posees)}` : ""}`, "lancer", { desactive: v.tourne || !posees || !!t.entete.refus })}
      <div class="libelle">Paiements</div>
      ${carte(`<div class="rl-paiements">${t.paiements.map((x) => `<div><span>${esc(x.nom)}<em class="t2"> · ${esc(x.exemple)}</em></span><b>${x.contre} contre 1</b></div>`).join("")}</div>
        <p class="aide">${esc(t.regle)} La maison garde en moyenne ${pourcent(t.avantageMaison, 1)} de chaque mise${t.francaise ? `, ${pourcent(t.avantageChancesSimples, 2)} sur les chances simples` : ""}. Touche le centre d'une case pour un plein, un bord pour un cheval, un coin pour un carré, le bord gauche d'une rangée pour une transversale.</p>`, { pad: true })}
    </div>`;
}

const sommeMises = (r) => r.mises.reduce((a, m) => a + m.montant, 0);
const sommeRendus = (r) => r.rendus.reduce((a, b) => a + b, 0);

/** La roue tourne, la bille tombe dans la case du numéro. */
export async function animer(numero, t, v) {
  // D339 : la même roue à la table partagée (.rl-page aussi).
  const plateau = document.querySelector(".rl-page .rl-plateau");
  const orbite = document.querySelector(".rl-page .rl-orbite");
  const bille = orbite?.querySelector(".rl-bille");
  const i = t.roue.findIndex((c) => c.numero === numero);
  // La case gagnante finit en haut, sous la bille : le plateau tourne de 2 à 3 tours de plus.
  const depart = v.angle;
  let fin = -i * PAS;
  while (fin > depart - 720) fin -= 360;
  v.angle = ((fin % 360) + 360) % 360;
  if (!plateau || reduit()) return;
  const duree = 4200;
  const a = plateau.animate([{ transform: `rotate(${depart}deg)` }, { transform: `rotate(${fin}deg)` }], { duration: duree, easing: "cubic-bezier(.15,.65,.25,1)", fill: "forwards" });
  orbite.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(1440deg)" }], { duration: duree, easing: "cubic-bezier(.1,.55,.3,1)", fill: "forwards" });
  bille?.animate([{ transform: "translateY(-14px)" }, { transform: "translateY(-14px)", offset: 0.55 }, { transform: "translateY(3px)", offset: 0.85 }, { transform: "translateY(0)" }],
    { duration: duree, easing: "ease-in", fill: "forwards" });
  await a.finished.catch(() => {});
}

export const pages = {
  roulette: {
    titre: "Roulette",
    css: "roulette",
    // D338 : la table française (casinos 5 étoiles) se demande par son nom.
    async donnees(ctx, p) { return { t: await ctx.tableau("roulette", vue(p).table === "francaise" ? { id: "francaise" } : {}) }; },
    rendu: rendre,
    actions: {
      choisirTable(ctx, b, d, p) {
        const v = vue(p);
        if (v.tourne || v.table === b.dataset.valeur) return;
        Object.assign(v, { table: b.dataset.valeur, mises: {}, ordre: [], precedentes: null, vu: null });
        ctx.rafraichir();
      },
      jeton(ctx, b, d, p) { vue(p).jeton = Number(b.dataset.i); ctx.redessiner(); },
      poser(ctx, b, d, p) {
        const v = vue(p), t = d.t;
        if (v.tourne) return;
        if (v.vu !== t.coups) v.vu = t.coups;
        const x = t.valeursJetons[v.jeton] ?? t.valeursJetons[0];
        const total = Object.values(v.mises).reduce((a, c) => a + c, 0) + x;
        if (total > t.entete.jetons) return ctx.toast(`Tu n'as que ${montant(t.entete.jetons)} de jetons.`, "refus");
        v.mises[b.dataset.cle] = (v.mises[b.dataset.cle] ?? 0) + x;
        v.ordre.push([b.dataset.cle, x]);
        ctx.redessiner();
      },
      annuler(ctx, b, d, p) {
        const v = vue(p), der = v.ordre.pop();
        if (!der) return;
        v.mises[der[0]] -= der[1];
        if (v.mises[der[0]] <= 0) delete v.mises[der[0]];
        ctx.redessiner();
      },
      effacer(ctx, b, d, p) { const v = vue(p); v.mises = {}; v.ordre = []; ctx.redessiner(); },
      rejouer(ctx, b, d, p) {
        const v = vue(p);
        if (!v.precedentes) return;
        v.mises = { ...v.precedentes };
        v.ordre = Object.entries(v.mises);
        ctx.redessiner();
      },
      async lancer(ctx, b, d, p) {
        const v = vue(p);
        const mises = Object.entries(v.mises).map(([cle, m]) => ({ cle, montant: m }));
        if (!mises.length || v.tourne) return;
        v.tourne = true;
        ctx.redessiner();
        const ok = await ctx.decider("tableCasino", d.t.francaise ? { rouletteFrancaise: { mises } } : { roulette: { mises } }, { fermer: false });
        const t = ctx.etat.donnees?.t;
        if (!ok || !t?.dernier) { v.tourne = false; ctx.redessiner(); return; }
        await animer(t.dernier.numero, t, v);
        v.precedentes = { ...v.mises };
        v.mises = {}; v.ordre = [];
        v.tourne = false;
        v.vu = t.coups;
        ctx.redessiner();
        // Le plateau garde son angle par --a : les animations finies (gardées à la fin) s'effacent.
        for (const el of document.querySelectorAll("#zone-roulette .rl-plateau, #zone-roulette .rl-orbite, #zone-roulette .rl-bille")) for (const a of el.getAnimations()) a.cancel();
        const net = sommeRendus(t.dernier) - sommeMises(t.dernier);
        if (net > 0) ctx.toast(`Gagné : ${montant(net)}`, "gain");
      },
    },
  },
};
