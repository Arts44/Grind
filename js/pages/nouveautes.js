// ══════════════════════════════════════════════════════════════════════
//  Nouveautés (EcranNouveautes.swift, RNT-196) : ce qui change, version
//  par version, et la feuille « Quoi de neuf » qui s'ouvre une fois après
//  chaque mise à jour. Le texte est celui de l'iPhone, mot pour mot
//  (changelog-donnees.js, généré par scripts/changelog.py depuis
//  RenteCore/…/Resources/Changelog.json). La dernière version vue est
//  retenue dans ce navigateur (grind.nouveautes.vue).
//
//  D336 (1.17.43) : la page passe au tableau noir (css/pages/ardoise.css,
//  Caveat et Kalam) et gagne le tableau « À venir ».
// ══════════════════════════════════════════════════════════════════════
import { esc } from "../format.js?v=3e8bddd9";
import { entetePousse } from "../ui.js?v=3e8bddd9";
import { VERSIONS } from "../changelog-donnees.js?v=3e8bddd9";
import { AVENIR } from "../avenir-donnees.js?v=3e8bddd9"; // D336
import { poserStyles } from "./index.js?v=3e8bddd9";

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
  const ouvrir = async () => {
    ecrireVue(c.numero); // vue dès qu'elle s'ouvre : fermée d'un geste, elle ne revient pas
    await poserStyles(["ardoise"]); // les ardoises de la page Nouveautés, ouverte ou non
    ctx.feuille({ titre: "", rendu: () => feuille(liste), actions: { fermerNouveautes: () => ctx.fermerFeuille() } });
  };
  // Une autre feuille est ouverte (le reçu d'une session) : la nôtre attend qu'elle se ferme.
  const d = document.getElementById("feuille");
  if (d?.open) d.addEventListener("close", () => setTimeout(ouvrir, 250), { once: true });
  else ouvrir();
  return true;
}

/**
 * « Quoi de neuf » (D336) : une ardoise par version depuis la dernière vue, la plus récente d'abord,
 * écrites comme la page Nouveautés (versionCraie, css/pages/ardoise.css). FeuilleNouveautes sur l'iPhone.
 */
function feuille(liste) {
  const v = liste[0];
  return `<div class="nv-feuille ard-cadre">
    <header class="nv-tete">
      <h2 class="ard-nom nv-titre">Quoi de neuf</h2>
      <p class="ard-date">${liste.length > 1 ? `Grind passe en ${esc(v.numero)} : ${liste.length} versions depuis ta dernière visite.` : `Grind passe en ${esc(v.numero)} · ${esc(v.titre)}.`}</p>
    </header>
    ${liste.map((x, i) => `<div class="ardoise ard-libre" style="--i:${Math.min(i, 8)}">${versionCraie(x, i === 0)}</div>`).join("")}
    <div class="nv-pied">
      <button class="bouton" data-action="fermerNouveautes">C'est parti</button>
      <p class="ard-note">Toutes les versions : Réglages › Nouveautés.</p>
    </div>
  </div>`;
}

// MARK: Les ardoises (D336)
// La page : deux tableaux noirs écrits à la craie, l'un sous l'autre (côte à côte quand c'est large),
// chacun d'une hauteur fixe et qui défile seul. « Ce qui a changé » : toutes les versions ; « À venir » :
// les prochaines, lues par le moteur (commande « aVenir », AVenir.json comme sur l'iPhone), avec leurs
// mots effacés.

/** Un mot effacé : 1 lisible à demi, 2 quelques lettres (les autres, une trace), 3 une trace seule. */
function morceau(m) {
  if (m.n === 0) return esc(m.t);
  if (m.n === 1) return `<span class="ard-eff1">${esc(m.t)}</span>`;
  if (m.n === 2) return `<span class="ard-eff2">${[...m.t].map((c) => (c === "_" ? '<span class="ard-trou">n</span>' : esc(c))).join("")}</span>`;
  return `<span class="ard-eff3" style="--l:${Number(m.l) || 4}"></span>`;
}

const ligneAVenir = (l, i) =>
  `<li style="--i:${Math.min(i, 24)}"><span class="sr">${esc(l.lu)}</span><span aria-hidden="true">${l.morceaux.map(morceau).join("")}</span></li>`;

/** Une version à la craie (VersionCraie) : la page Nouveautés et la feuille « Quoi de neuf ». */
function versionCraie(v, tienne) {
  const bloc = (titre, lignes, corr) => lignes.length
    ? `${titre ? `<p class="ard-sous">${titre}</p>` : ""}<ul class="ard-lignes${corr ? " corr" : ""}">${lignes.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : "";
  return `<article class="ard-version" data-version="${esc(v.numero)}">
      <h2 class="ard-titre">${esc(v.titre)}${tienne ? '<span class="ard-tienne">ta version</span>' : ""}</h2>
      <p class="ard-date">${esc(v.numero)} · ${esc(v.dateAffichee)}</p>
      ${bloc("", v.nouveautes, false)}${bloc(v.nouveautes.length ? "Corrigé" : "", v.corrections, true)}
    </article>`;
}

function ardoiseJournal() {
  return VERSIONS.map((v, i) => versionCraie(v, i === 0)).join("")
    + `<p class="ard-note">Grind grandit à chaque livraison. Une idée, un bug ? Réglages › Signaler.</p>`;
}

function ardoiseAVenir(a) {
  if (!a) return `<p class="ard-note">Le tableau se prépare : il s'affichera avec la prochaine mise à jour du moteur.</p>`;
  if (!a.versions.length) return `<p class="ard-note">Tout ce qui était au tableau est arrivé. La suite s'écrit…</p>`;
  return a.versions.map((v) => `<article class="ard-version" data-avenir="${esc(v.numero)}">
      <p class="ard-date">${esc(v.numero)}</p>
      <h2 class="ard-titre">${esc(v.titre)}</h2>
      <ul class="ard-lignes ard-ecrit">${v.lignes.map(ligneAVenir).join("")}</ul>
    </article>`).join("") + (a.note ? `<p class="ard-note">${esc(a.note)}</p>` : "");
}

export const pages = {
  nouveautes: {
    titre: "Nouveautés",
    css: "ardoise",
    async donnees(ctx) {
      // D336 : le moteur lit AVenir.json (le WebAssembly n'a pas les ressources du paquet : la page le lui donne).
      const r = await ctx.jouer("aVenir", { source: AVENIR, courante: courante()?.numero ?? null }, { silencieux: true });
      return { aVenir: r ? { note: r.note, versions: r.versions ?? [] } : null };
    },
    rendu(d) {
      const ardoise = (id, nom, contenu) => `<section class="ard-bloc" aria-labelledby="ard-nom-${id}">
          <h2 class="ard-nom" id="ard-nom-${id}">${nom}</h2>
          <div class="ardoise" id="ard-${id}" tabindex="0">${contenu}</div></section>`;
      return `${entetePousse("Nouveautés")}<div class="ard-cadre"><div class="ard-pile">
        ${ardoise("journal", "Ce qui a changé", ardoiseJournal())}
        ${ardoise("avenir", "À venir", ardoiseAVenir(d?.aVenir))}
      </div></div>`;
    },
  },
};
