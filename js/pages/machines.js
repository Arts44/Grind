// ══════════════════════════════════════════════════════════════════════
//  Les machines à sous (D338, 1.17.47), comme sur l'iPhone (MachineASousVue.swift) :
//  la machine du casino (Fruits d'or partout, Prestige à partir de 4 étoiles,
//  Riviera à 5), ses rouleaux qui tournent et s'arrêtent un à un, ses lignes,
//  sa table des gains et ce qu'elle rend en moyenne (RTP). Le moteur tire
//  (MachineASous.swift), le tableau « machines » donne tout.
// ══════════════════════════════════════════════════════════════════════
import { montant, pourcent as pourcentBrut, esc } from "../format.js?v=3e8bddd9";
import { carte, bouton, entetePousse, vide, bandeau } from "../ui.js?v=3e8bddd9";
import * as enLigne from "../enligne.js?v=3e8bddd9";

/** « 2,7 % » sans coupure avant le signe. */
const pourcent = (x, d) => pourcentBrut(x, d).replace(" %", "\u00a0%");
const reduit = () => matchMedia?.("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("economie");
const vue = (p) => (p.vue ??= { machine: null, mise: 0, vu: null, tourne: false });

/** Un symbole, dessiné de ses tracés (les mêmes que l'iPhone). */
function symbole(m, id) {
  const s = m.symboles.find((x) => x.id === id);
  if (!s) return "";
  const calques = s.calques.map((c) => `<path d="${c.trace}" fill="${c.couleur}"/>`).join("");
  const texte = s.texte ? `<text x="12" y="12.6" class="ms-texte${s.texte.length > 1 ? " court" : ""}" fill="${s.couleurTexte}">${esc(s.texte)}</text>` : "";
  return `<svg class="ms-sym" viewBox="0 0 24 24" role="img" aria-label="${esc(s.nom)}">${calques}${texte}</svg>`;
}

/** Un rouleau : à l'arrêt, ses trois rangées ; en route, une longue bande qui défile jusqu'aux trois rangées d'arrivée. */
function rouleau(m, k, fenetre, depart) {
  const r = m.rouleaux[k];
  if (depart == null) return `<div class="ms-rouleau"><div class="ms-bande">${fenetre.map((s) => `<div class="ms-case">${symbole(m, s)}</div>`).join("")}</div></div>`;
  const tours = 10 + 4 * k;
  const l = [...Array(3)].map((_, i) => r[(depart + i) % r.length]);
  for (let i = 0; i < tours; i++) l.push(r[(depart + 3 + i) % r.length]);
  l.push(...fenetre);
  return `<div class="ms-rouleau"><div class="ms-bande" data-cases="${l.length}">${l.map((s) => `<div class="ms-case">${symbole(m, s)}</div>`).join("")}</div></div>`;
}

/** Les lignes gagnantes, tracées sur la vitre. */
function lignes(m, gagnantes) {
  const n = m.rouleaux.length;
  return `<svg class="ms-lignes" viewBox="0 0 ${n * 10} 30" preserveAspectRatio="none" aria-hidden="true">${gagnantes.map((g) => {
    const pts = m.lignes[g.ligne].slice(0, n).map((r, i) => `${i * 10 + 5},${r * 10 + 5}`).join(" ");
    return `<polyline points="${pts}"/>`;
  }).join("")}</svg>`;
}

function rendre(d, ctx, p) {
  const t = d.t;
  if (!t) return `${entetePousse("Machines à sous")}${vide("Le casino ouvre avec ta première saison.")}`;
  const v = vue(p);
  const ouvertes = t.machines.filter((x) => x.ouverte);
  if (!v.machine || !ouvertes.some((x) => x.machine.id === v.machine)) v.machine = (ouvertes.at(-1) ?? t.machines[0]).machine.id;
  const ma = t.machines.find((x) => x.machine.id === v.machine);
  const m = ma.machine;
  if (v.vu == null && !v.tourne) v.vu = t.coups;
  v.mise = Math.min(v.mise, ma.misesLigne.length - 1);
  const miseLigne = ma.misesLigne[v.mise] ?? ma.misesLigne[0];
  const dernier = t.dernier?.machine === m.id ? t.dernier : null;
  const enAttente = v.tourne || v.vu !== t.coups;
  const jetons = enAttente && dernier ? t.entete.jetons - dernier.gain + dernier.mise : t.entete.jetons;
  // À l'arrêt : le dernier tour de cette machine, sinon le haut de ses bandes.
  const fenetre = dernier ? dernier.fenetre : m.rouleaux.map((r) => r.slice(0, 3));
  const enRoute = v.tourne && v.depart;
  const rouleaux = m.rouleaux.map((_, k) => rouleau(m, k, fenetre[k], enRoute ? v.depart[k] : null)).join("");
  const gagne = !enAttente && dernier && dernier.gain > 0;
  const choix = t.machines.map((x) => `<button class="ms-onglet${x.machine.id === m.id ? " choisi" : ""}" data-action="machine" data-id="${x.machine.id}" ${x.ouverte ? "" : "disabled"} aria-pressed="${x.machine.id === m.id}">
      <b>${esc(x.machine.nom)}</b><span>${x.ouverte ? `${x.machine.rouleaux.length} rouleaux · ${x.machine.lignes.length} lignes` : `Casinos ${x.machine.etoilesMin} étoiles`}</span></button>`).join("");
  // La table des gains : une rangée par symbole, une colonne par nombre de symboles alignés (5, 4, 3…).
  const nombres = [...new Set(m.gains.map((g) => g.nombre))].sort((a, b) => b - a);
  const table = `<div class="ms-tete"><span></span>${nombres.map((n) => `<span>${n} alignés</span>`).join("")}</div>` + [...new Set(m.gains.map((g) => g.symbole))].map((s) =>
    `<div class="ms-gain">${symbole(m, s)}${nombres.map((n) => { const g = m.gains.find((x) => x.symbole === s && x.nombre === n); return `<b>${g ? `× ${g.multiple}` : "—"}</b>`; }).join("")}</div>`).join("");
  return `${entetePousse("Machines à sous")}
    <div class="pile ms-page" id="zone-machines">
      ${t.entete.refus ? bandeau(esc(t.entete.refus), "var(--alerte)") : ""}
      <div class="ms-onglets" role="group" aria-label="Machines">${choix}</div>
      <div class="ms-meuble ${m.id}">
        <div class="ms-fronton"><b>${esc(m.nom)}</b><span>${"★".repeat(m.etoilesMin)}</span></div>
        <div class="ms-vitre" style="--n:${m.rouleaux.length}">${rouleaux}${gagne ? lignes(m, dernier.gagnantes) : ""}</div>
        <div class="ms-compteurs">
          <div><span>Jetons</span><b class="chiffres">${montant(jetons)}</b></div>
          <div><span>Mise</span><b class="chiffres">${montant(miseLigne * m.lignes.length)}</b></div>
          <div><span>Gain</span><b class="chiffres${gagne ? " gagne" : ""}">${!enAttente && dernier ? montant(dernier.gain) : "—"}</b></div>
        </div>
      </div>
      <div class="ms-mises" role="group" aria-label="Mise par ligne">${ma.misesLigne.map((x, i) => `<button class="ms-mise${i === v.mise ? " choisi" : ""}" data-action="mise" data-i="${i}" aria-pressed="${i === v.mise}">${montant(x * m.lignes.length)}<span>${montant(x, { centimes: x % 100 !== 0 })} la ligne</span></button>`).join("")}</div>
      ${bouton(v.tourne ? "Les rouleaux tournent…" : `Tourner · ${montant(miseLigne * m.lignes.length)}`, "tourner", { desactive: v.tourne || !!t.entete.refus || !ma.ouverte })}
      ${gagne ? `<p class="aide ms-detail">${dernier.gagnantes.map((g) => `Ligne ${g.ligne + 1} : ${g.nombre} ${esc(m.symboles.find((s) => s.id === g.symbole)?.nom ?? g.symbole)}, ${g.multiple} × ${montant(dernier.miseLigne, { centimes: dernier.miseLigne % 100 !== 0 })}`).join(" · ")}</p>` : ""}
      <div class="libelle">Table des gains · fois la mise d'une ligne</div>
      ${carte(`<div class="ms-table" style="--k:${nombres.length}">${table}</div>
        <p class="aide">${esc(m.detail)} Une ligne gagne quand ses symboles sont les mêmes depuis le rouleau de gauche. Cette machine rend en moyenne ${pourcent(ma.rtp, 1)} de ce qui est misé : la maison garde ${pourcent(1 - ma.rtp, 1)}.</p>`, { pad: true })}
    </div>`;
}

async function animer() {
  const bandes = [...document.querySelectorAll("#zone-machines .ms-bande[data-cases]")];
  if (!bandes.length || reduit()) return;
  const fins = bandes.map((b, k) => {
    const n = Number(b.dataset.cases);
    return b.animate([{ transform: "translateY(0)" }, { transform: `translateY(${-(n - 3) / n * 100}%)` }],
      { duration: 900 + 380 * k, easing: "cubic-bezier(.2,.6,.25,1.04)", fill: "forwards" }).finished.catch(() => {});
  });
  await Promise.all(fins);
}

export const pages = {
  machines: {
    titre: "Machines à sous",
    css: "machines",
    async donnees(ctx) { return { t: await ctx.tableau("machines") }; },
    rendu: rendre,
    actions: {
      machine(ctx, b, d, p) { const v = vue(p); if (v.tourne) return; v.machine = b.dataset.id; v.vu = d.t.coups; ctx.redessiner(); },
      mise(ctx, b, d, p) { vue(p).mise = Number(b.dataset.i); ctx.redessiner(); },
      async tourner(ctx, b, d, p) {
        const v = vue(p);
        if (v.tourne) return;
        const ma = d.t.machines.find((x) => x.machine.id === v.machine);
        if (!ma) return;
        const miseLigne = ma.misesLigne[v.mise] ?? ma.misesLigne[0];
        // Les rouleaux repartent d'où ils étaient.
        const avant = d.t.dernier?.machine === ma.machine.id ? d.t.dernier.arrets : ma.machine.rouleaux.map(() => 0);
        v.tourne = true; v.depart = avant;
        const ok = await ctx.decider("tableCasino", { machine: { id: ma.machine.id, miseLigne } }, { fermer: false });
        const t = ctx.etat.donnees?.t;
        if (!ok || !t?.dernier) { v.tourne = false; v.depart = null; ctx.redessiner(); return; }
        ctx.redessiner();
        // D339 : en ligne, le tour nourrit le jackpot du casino (1 %) et tente sa chance (casino-multi.sql), sans attendre les rouleaux.
        const etatCasino = await ctx.tableau("casino");
        enLigne.casinoMachine(ctx, etatCasino?.casinoActuel, etatCasino?.nomCasino, t.dernier.mise, `${t.coups}-${Date.now()}`)
          .then((r) => { if (r?.gagne) ctx.toast(`Jackpot ! ${montant(r.montant)} : le pot des machines est à toi.`, "gain"); });
        await animer();
        v.tourne = false; v.depart = null; v.vu = t.coups;
        ctx.redessiner();
        // Le dessin peut garder les mêmes bandes : leur défilement (gardé à la fin) ne doit pas les pousser hors de la vitre.
        for (const b of document.querySelectorAll("#zone-machines .ms-bande")) for (const a of b.getAnimations()) a.cancel();
        if (t.dernier.gain > t.dernier.mise) ctx.toast(`Gagné : ${montant(t.dernier.gain)}`, "gain");
      },
    },
  },
};
