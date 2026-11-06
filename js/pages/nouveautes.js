// ══════════════════════════════════════════════════════════════════════
//  Nouveautés (EcranNouveautes.swift, RNT-196) : ce qui change, version
//  par version, et la feuille « Quoi de neuf » qui s'ouvre une fois après
//  chaque mise à jour. Le texte est celui de l'iPhone, mot pour mot
//  (changelog-donnees.js, généré par scripts/changelog.py depuis
//  RenteCore/…/Resources/Changelog.json). La dernière version vue est
//  retenue dans ce navigateur (grind.nouveautes.vue).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "../format.js";
import { entetePousse } from "../ui.js";
import { VERSIONS } from "../changelog-donnees.js";

const CLE = "grind.nouveautes.vue";
const lireVue = () => { try { return localStorage.getItem(CLE); } catch { return null; } };
const ecrireVue = (v) => { try { localStorage.setItem(CLE, v); } catch {} };

export const courante = () => VERSIONS[0] ?? null;

/** « 1.13.0 » → [1, 13, 0] ; null si ce n'est pas un numéro (NumeroVersion). */
function numero(t) {
  const p = String(t ?? "").split(".");
  if (p.length !== 3 || p.some((x) => !/^(0|[1-9]\d*)$/.test(x))) return null;
  return p.map(Number);
}
const plusRecente = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false; };

/** Changelog.aMontrer : sans version vue, un ancien joueur reçoit la dernière, un nouveau rien. */
export function aMontrer(derniereVue, dejaJoueur) {
  const c = courante();
  if (!c) return [];
  if (derniereVue == null) return dejaJoueur ? [c] : [];
  if (derniereVue === c.numero) return [];
  const v = numero(derniereVue);
  return v ? VERSIONS.filter((x) => plusRecente(numero(x.numero), v)) : VERSIONS;
}

/** Un nouveau joueur : tout est neuf pour lui, la feuille ne s'ouvrira qu'à la prochaine version. */
export function nouveauJoueur() {
  if (lireVue() == null && courante()) ecrireVue(courante().numero);
}

/** À l'entrée dans le jeu : la feuille, une fois. `dejaJoueur` : il avait déjà une partie. Rend vrai si elle s'ouvre. */
export function verifierNouveautes(ctx, { dejaJoueur = true } = {}) {
  const liste = aMontrer(lireVue(), dejaJoueur);
  const c = courante();
  if (!liste.length) { if (c && lireVue() == null && dejaJoueur) ecrireVue(c.numero); return false; }
  const ouvrir = () => {
    ecrireVue(c.numero); // vue dès qu'elle s'ouvre : fermée d'un geste, elle ne revient pas
    ctx.feuille({ titre: "", rendu: () => feuille(liste), actions: { fermerNouveautes: () => ctx.fermerFeuille() } });
  };
  // Une autre feuille est ouverte (le reçu d'une session) : la nôtre attend qu'elle se ferme.
  const d = document.getElementById("feuille");
  if (d?.open) d.addEventListener("close", () => setTimeout(ouvrir, 250), { once: true });
  else ouvrir();
  return true;
}

const SCINTILLE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M10 3.5 11.6 8.4 16.5 10 11.6 11.6 10 16.5 8.4 11.6 3.5 10 8.4 8.4z"/><path d="M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8zM17.5 3l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4L15.5 5l1.4-.6z"/></svg>`;

const STYLE = `<style>
  .nv-puces{display:flex;flex-direction:column;gap:9px;margin:0;padding:0;list-style:none}
  .nv-puces li{display:flex;gap:10px;align-items:baseline;font-size:15px;line-height:1.45;color:var(--texte)}
  .nv-puces li::before{content:"";flex:none;width:5px;height:5px;border-radius:50%;background:var(--accent);transform:translateY(-2px)}
  .nv-puces.corr li::before{background:var(--texte3)}
  .nv-bloc{display:flex;flex-direction:column;gap:9px}
  .nv-bloc + .nv-bloc{margin-top:16px}
  .nv-etiq{font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--texte2)}
  .nv-num{font:600 13px ui-rounded,system-ui,sans-serif;font-variant-numeric:tabular-nums;padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.09);color:var(--texte);flex:none}
  .nv-tete{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;background:none;border:0;color:inherit;text-align:left;cursor:pointer;font:inherit}
  .nv-tete .fl{margin-left:auto;width:14px;color:var(--texte2);transition:transform .25s}
  .nv-carte[open] .nv-tete .fl{transform:rotate(180deg)}
  .nv-carte summary{list-style:none}
  .nv-carte summary::-webkit-details-marker{display:none}
  .nv-corps{padding:16px;border-top:1px solid rgba(255,255,255,.07)}
  .nv-heros .k{font-size:11px;font-weight:600;letter-spacing:.12em;color:var(--accent)}
  .nv-heros .n{font:600 40px ui-rounded,system-ui,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.01em;margin:6px 0 4px}
  .nv-icone{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.06);color:var(--accent)}
  .nv-icone svg{width:24px;height:24px}
  .nv-pied{position:sticky;bottom:calc(-1 * max(24px, env(safe-area-inset-bottom)));margin-top:-8px;padding:22px 0 max(24px, env(safe-area-inset-bottom));background:linear-gradient(rgba(20,20,23,0),var(--feuille) 22px)}
  .nv-feuille h2.nv-titre{font-size:28px;font-weight:700;letter-spacing:-.02em;margin:10px 0 6px}
</style>`;

/** Les nouveautés puis les corrections d'une version (ListeChangements). */
export function changements(v) {
  const bloc = (titre, lignes, corr) => lignes.length
    ? `<div class="nv-bloc"><div class="nv-etiq">${titre}</div><ul class="nv-puces ${corr ? "corr" : ""}">${lignes.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>` : "";
  return bloc("Nouveautés", v.nouveautes, false) + bloc("Corrections", v.corrections, true);
}

function resume(v) {
  const n = v.nouveautes.length, c = v.corrections.length;
  return [v.dateAffichee, n ? `${n} nouveauté${n > 1 ? "s" : ""}` : "", c ? `${c} correction${c > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
}

function feuille(liste) {
  const v = liste[0];
  return `${STYLE}<div class="nv-feuille pile" style="gap:22px">
    <div><div class="nv-icone">${SCINTILLE}</div>
      <h2 class="nv-titre">Quoi de neuf</h2>
      <p class="t2" style="font-size:15px">${liste.length > 1 ? `Grind passe en ${esc(v.numero)} : ${liste.length} versions depuis ta dernière visite.` : `Grind passe en ${esc(v.numero)} · ${esc(v.titre)}.`}</p></div>
    ${liste.map((x) => `<div class="pile" style="gap:12px">
      ${liste.length > 1 ? `<div class="rangee" style="gap:8px"><span class="nv-num">${esc(x.numero)}</span><span class="libelle" style="flex:1">${esc(x.titre)}</span><span class="aide">${esc(x.dateAffichee)}</span></div>` : ""}
      <div>${changements(x)}</div></div>`).join("")}
    <div class="pile nv-pied" style="gap:10px">
      <button class="bouton" data-action="fermerNouveautes">C'est parti</button>
      <p class="aide" style="text-align:center">Toutes les versions : Réglages › Nouveautés.</p>
    </div>
  </div>`;
}

export const pages = {
  nouveautes: {
    titre: "Nouveautés",
    rendu() {
      const c = courante();
      return `${STYLE}${entetePousse("Nouveautés")}<div class="pile" style="gap:14px">
        ${c ? `<div class="nv-heros" style="margin-bottom:6px"><div class="k">TA VERSION</div><div class="n">${esc(c.numero)}</div>
          <div class="aide">${esc(c.titre)} · ${esc(c.dateAffichee)}</div></div>` : ""}
        ${VERSIONS.map((v, i) => `<details class="carte nv-carte" ${i === 0 ? "open" : ""} data-version="${esc(v.numero)}">
          <summary class="nv-tete"><span class="nv-num">${esc(v.numero)}</span>
            <span style="min-width:0;flex:1"><span class="libelle" style="display:block">${esc(v.titre)}</span><span class="aide">${esc(resume(v))}</span></span>
            <span class="fl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span></summary>
          <div class="nv-corps">${changements(v)}</div></details>`).join("")}
        <p class="aide" style="padding:6px 4px 0">Grind grandit à chaque livraison. Une idée, un bug ? Réglages › Écrire à Grind.</p>
      </div>`;
    },
  },
};
