// ══════════════════════════════════════════════════════════════════════
//  Les titres de profil (RNT-270, D267) : TitreProfilVue.swift sur le web.
//
//  Le joueur en choisit un à afficher sous son pseudo (profil, fiche joueur,
//  membres du monde) ; dans un classement, seulement sa petite icône. Le
//  catalogue (id, nom, icône SF, description) est dans Balance.json ›
//  titresProfil ; les titres possédés sont tenus par le serveur (titres_mes,
//  titre_choisir). Les styles sont dans css/pages/enligne.css (.tp-*).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "./format.js";
import * as serveur from "./serveur.js";

/** La clé du titre choisi, copie locale de ce que dit le serveur (comme CompteLocal.cleTitreProfil sur l'iPhone). */
export const CLE_TITRE_PROFIL = "grind.titreProfil";

const lire = (k) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const ecrire = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} };

/** Les icônes du catalogue (noms SF Symbols), dessinées au trait. Une inconnue : un petit rond. */
const TRAITS = {
  "hammer.fill": '<path d="m14.5 4.5 5 5-2.2 2.2-5-5zM12.3 8.2 4 16.5 7.5 20l8.3-8.3"/>',
  "testtube.2": '<path d="M9.5 3h5M10.5 3v6.2L5.2 18.6A1.6 1.6 0 0 0 6.6 21h10.8a1.6 1.6 0 0 0 1.4-2.4L13.5 9.2V3M8 15h8"/>',
  "text.bubble.fill": '<path d="M4 5h16v11h-9.5L6 20v-4H4zM8 9.3h8M8 12.3h5"/>',
  "flag.fill": '<path d="M5.5 21V4M5.5 4.5h12l-2.6 3.7 2.6 3.8h-12"/>',
  "ladybug.fill": '<ellipse cx="12" cy="13.5" rx="5.5" ry="6.5"/><path d="M12 7v13M9 5l1.5 2M15 5l-1.5 2M3.5 11l3 1M20.5 11l-3 1M3.5 17l3-1.5M20.5 17l-3-1.5"/>',
};

export const iconeTitre = (nom, taille = 13) => `<svg class="tp-ico" width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAITS[nom] ?? '<circle cx="12" cy="12" r="5"/>'}</svg>`;

/** Le titre sous un pseudo : son icône et son nom. `t` : { id, nom, icone } (ou rien). */
export const ligneTitre = (t, taille = 13) => t ? `<span class="tp-ligne" style="--tp:${taille}px" aria-label="Titre : ${esc(t.nom)}">${iconeTitre(t.icone, taille)}<span>${esc(t.nom)}</span></span>` : "";

/** Dans un classement : la seule icône, à côté du pseudo. */
export const pastilleTitre = (t) => t ? `<span class="tp-pastille" title="${esc(t.nom)}" role="img" aria-label="Titre : ${esc(t.nom)}">${iconeTitre(t.icone, 12)}</span>` : "";

/** Le titre d'un identifiant dans le catalogue ({ id, nom, icone, description }), ou null. */
export const titreDe = (catalogue, id) => (id && Array.isArray(catalogue) ? catalogue.find((t) => t.id === id) ?? null : null);

/** Ton titre choisi (copie locale) tel qu'on l'affiche, ou null. */
export const monTitre = (catalogue) => titreDe(catalogue, lire(CLE_TITRE_PROFIL));

/** Le catalogue de cette version du moteur (une lecture, gardée par le moteur). */
export const catalogue = (ctx) => ctx.balance("titresProfil").catch(() => null);

/** Ce que le serveur dit de tes titres : { titres: [id], choisi }, ou null (hors ligne, pas de compte). Remet la copie locale d'équerre. */
export async function chargerMesTitres() {
  try {
    const r = await serveur.titresMes();
    ecrire(CLE_TITRE_PROFIL, r?.choisi ?? "");
    return { titres: Array.isArray(r?.titres) ? r.titres : [], choisi: r?.choisi ?? null };
  } catch { return null; }
}

/** Choisit le titre à afficher (null : aucun). Rend vrai si le serveur l'a retenu. */
export async function choisirMonTitre(id) {
  await serveur.choisirTitre(id);
  ecrire(CLE_TITRE_PROFIL, id ?? "");
}

/** Le réglage (Réglages › Toi) : tout le catalogue, ceux qu'on a d'abord, le choisi coché. Rien tant qu'on n'en a aucun. */
export function sectionTitres(cat, mes) {
  if (!Array.isArray(cat) || !mes?.titres?.length) return "";
  const a = new Set(mes.titres), choisi = a.has(mes.choisi) ? mes.choisi : null;
  const tous = [...cat.filter((t) => a.has(t.id)), ...cat.filter((t) => !a.has(t.id))];
  const ligne = (t) => {
    const possede = !t || a.has(t.id), actif = t ? t.id === choisi : choisi === null;
    return `<button class="tp-choix" data-action="choisirTitreProfil" data-id="${esc(t?.id ?? "")}" aria-pressed="${actif}" ${possede ? "" : "disabled"}>
      <span class="tp-choix-ico ${possede ? "" : "ferme"}">${t ? iconeTitre(t.icone, 16) : ""}</span>
      <span class="tp-choix-txt"><b>${esc(t?.nom ?? "Aucun")}</b>${t ? `<span class="aide">${esc(t.description)}</span>` : ""}</span>
      <span class="tp-choix-etat">${actif ? "✓" : possede ? "" : "verrouillé"}</span></button>`;
  };
  return `<section class="rg-bloc"><h2 class="libelle">Titre de profil</h2>
    <p class="aide">Affiché sous ton pseudo, dans ton profil, les mondes et les classements.</p>
    <div class="tp-liste">${ligne(null)}${tous.map(ligne).join("")}</div></section>`;
}
