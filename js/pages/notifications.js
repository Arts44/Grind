// ══════════════════════════════════════════════════════════════════════
//  Les notifications de Grind (RNT-211) — la cloche de l'accueil.
//
//  En tête, ce qui attend ta réponse (CentreDemandes du moteur) : qui,
//  quoi, quand ça expire, et « Accepter » / « Refuser » sur place (ou
//  « Voir » quand il faut choisir : un chantage, un interrogatoire, une
//  invitation dans un monde). Une fois répondu ou expiré, la demande
//  passe dans l'historique, avec les avis (une rencontre qui dit oui, un
//  bot qui décline) ; chaque ligne mène à l'écran concerné.
//
//  Les briques servent la page Événements (vie.js), qui les pose au-dessus
//  des événements du jour.
// ══════════════════════════════════════════════════════════════════════
import { esc } from "../format.js";
import { petit } from "../ui.js";

const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONES = {
  repas: '<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M17 21V3c-2 1.5-3 4-3 7v3h3"/>',
  soiree: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10.5 8.5v5l4-2.5zM8 21h8"/>',
  voyage: '<path d="M10.5 13.5 3 11l1.5-1.5 8 1 4-4.5a2 2 0 0 1 3 3l-4.5 4 1 8L14.5 22l-2.5-7.5-3 3V21l-1.5 1-1.5-3.5L2.5 17 3.5 15.5H6z"/>',
  combine: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
  dilemme: '<path d="M4 5h16v11H9l-5 4zM12 8.5v3M12 14v.2"/>',
  chantage: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
  pret: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
  rachat: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  loyer: '<path d="M4 20V9l8-5 8 5v11zM10 20v-5h4v5"/>',
  ami: '<circle cx="10" cy="8" r="3.6"/><path d="M3 20c.8-3.8 3.6-5.6 7-5.6 1.4 0 2.7.3 3.8.9M18 13v6M15 16h6"/>',
  defi: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  monde: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5S14.5 17.9 12 20.5M12 3.5C9.5 6.1 8.4 8.9 8.4 12s1.1 5.9 3.6 8.5"/>',
  oui: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16.5 9.5"/>',
  non: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  avis: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  // RNT-221 : « on t'a dépassé » sur une vente aux enchères.
  enchere: '<path d="M14.5 4.5l5 5-3 3-5-5zM12.5 8.5 4 17a1.4 1.4 0 0 0 2 2l8.5-8.5"/>',
  // RNT-250 : un favori arrivé sur le marché.
  favori: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
};
ICONES.contre = ICONES.combine;
/** La teinte de chaque genre (CategorieAction de l'iPhone). */
const TEINTES = { repas: "#3FB6A8", soiree: "#8E7CF2", voyage: "var(--equipe)", combine: "var(--controles)", contre: "var(--controles)",
  dilemme: "var(--c-danger)", chantage: "var(--c-danger)", pret: "var(--argent)", rachat: "var(--argent)", loyer: "var(--grandir)",
  ami: "var(--equipe)", defi: "var(--or)", monde: "var(--equipe)" };

const icone = (genre) => I(ICONES[genre] ?? ICONES.avis);

/** « 2 h », « 35 min », « < 1 min » jusqu'à l'échéance. */
export function restant(expire, maintenant) {
  const ms = expire - maintenant;
  if (ms <= 60_000) return "< 1 min";
  if (ms < 3_600_000) return `${Math.ceil(ms / 60_000)} min`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h`;
  return `${Math.floor(ms / 86_400_000)} j`;
}

/** « à l'instant », « il y a 12 min », « hier 18:30 ». */
function quand(ms, maintenant) {
  const d = maintenant - ms;
  if (d < 60_000) return "à l'instant";
  if (d < 3_600_000) return `il y a ${Math.floor(d / 60_000)} min`;
  const date = new Date(ms), h = date.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
  if (d < 86_400_000 && new Date(maintenant).getDate() === date.getDate()) return `aujourd'hui ${h}`;
  return `${date.toLocaleDateString("fr-BE", { day: "numeric", month: "short" })} ${h}`;
}

/** Une demande : qui et quoi, l'échéance, et de quoi y répondre. */
export function carteDemande(d, maintenant) {
  const fin = d.expire ? `<span class="nt-expire chiffres" data-expire="${d.expire}" title="Expire dans ${restant(d.expire, maintenant)}">${restant(d.expire, maintenant)}</span>` : "";
  const gestes = d.directe
    ? `${petit(esc(d.refuser), "repondreDemande", { donnees: { id: d.id, oui: "0" } })}${petit(esc(d.accepter), "repondreDemande", { plein: true, donnees: { id: d.id, oui: "1" } })}`
    : petit("Voir", "voirDemande", { plein: true, donnees: { id: d.id } });
  return `<article class="carte nt-demande" data-demande="${esc(d.id)}" data-cle="${esc(d.id)}" style="--c:${TEINTES[d.genre] ?? "var(--accent)"}">
    <button class="nt-corps" data-action="voirDemande" data-id="${esc(d.id)}" aria-label="${esc(`${d.titre}. ${d.detail}`)}${d.expire ? `, expire dans ${restant(d.expire, maintenant)}` : ""}">
      <span class="nt-icone">${icone(d.genre)}</span>
      <span class="nt-texte"><span class="nt-titre">${esc(d.titre)}</span><span class="nt-detail">${esc(d.detail)}</span></span>
      ${fin}
    </button>
    <div class="nt-gestes">${d.directe ? `<button class="nt-voir" data-action="voirDemande" data-id="${esc(d.id)}">Voir</button>` : ""}<span class="espace"></span>${gestes}</div>
  </article>`;
}

/** L'historique : les demandes closes (avec leur issue) et les avis, les plus récents d'abord. */
export function historique(l, maintenant) {
  if (!l?.length) return "";
  return `<section class="nt-historique" aria-label="Historique des notifications">
    <div class="section">Historique</div>
    <div class="carte">${l.map((h) => {
      const genre = h.issue === "avis" ? (h.icone === "star.fill" ? "favori" : h.cible?.sorte === "enchere" ? "enchere" : h.icone?.includes("xmark") || h.icone?.includes("slash") ? "non" : "oui") : h.genre;
      const ton = h.issue === "acceptee" ? "gain" : h.issue === "refusee" || h.issue === "expiree" ? "t3" : "";
      const attrs = h.cible ? `data-action="voirHistorique" data-id="${esc(h.id)}"` : "disabled";
      return `<button class="nt-ligne ${h.nonLu ? "non-lu" : ""}" ${attrs} data-cle="${esc(h.id)}">
        <span class="nt-icone petite" style="--c:${TEINTES[h.genre] ?? (genre === "non" ? "var(--texte3)" : genre === "enchere" ? "var(--perte)" : genre === "favori" ? "var(--or)" : "var(--gain)")}">${icone(genre)}</span>
        <span class="nt-texte"><span class="nt-titre">${esc(h.titre)}</span>
          <span class="nt-detail">${h.detail ? `<span class="${ton}">${esc(h.detail)}</span> · ` : ""}${quand(h.le, maintenant)}</span></span>
        ${h.nonLu ? '<i class="nt-point" aria-label="Nouveau"></i>' : ""}
      </button>`;
    }).join('<div class="filet"></div>')}</div>
  </section>`;
}
