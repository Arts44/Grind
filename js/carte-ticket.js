// ══════════════════════════════════════════════════════════════════════
//  carte-ticket.js — la carte de profil (D384, K5a), comme l'iPhone
//  (Rente/Design/CarteTicket.swift).
//
//  Un ticket couché : pseudo souligné de l'accent, titre en italique,
//  badges en pièces, record frappé dans un cartouche, talon du palier.
//  La feuille prend le métal de la carte de fortune ; le fond équipé
//  devient sa finition (selon sa rareté). On MAINTIENT une pièce pour
//  lire le badge ; la bulle part quand on lâche.
// ══════════════════════════════════════════════════════════════════════
import { CADRANS, PALIERS_FORTUNE, ROMAINS } from "./cartes-fortune.js?v=3e8bddd9";
import { piecesDe } from "./cosmetiques.js?v=3e8bddd9";
import { catalogueConnu, iconeTitre } from "./titres.js?v=3e8bddd9"; // D398 : les titres de collection en badge
import { SYMBOLES, svgSymbole, hex } from "./compte-local.js?v=3e8bddd9"; // D394 : le petit avatar à côté du pseudo

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Les icônes des badges, en traits (24 × 24). */
const ICONES = {
  million: "M16.5 7.5a6 6 0 1 0 0 9M6 10.5h8M6 13.5h8",
  propre: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 12l2 2 4-4",
  focus100: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l3 2M10 2h4",
  patron: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  proprio: "M4 11l8-7 8 7v9H4zM10 20v-5h4v5",
};
const ETOILE = "M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z";

/** Les badges du catalogue, gagnés d'abord, quatre au plus. `catalogue` : [{ id, nom, detail }].
 *  D392 : `choisis` (ceux que le joueur a choisi de montrer, dans son ordre) passe avant tout. */
export function listeBadges(catalogue, gagnes, places = 4, choisis = null) {
  const g = new Set(gagnes ?? []);
  const saison = (catalogue ?? []).map((b, rang) => ({ ...b, rang, gagne: g.has(b.id) }));
  // D398 : les titres de collection gagnés se montrent aussi en badge (« col_… »).
  const titres = catalogueConnu().filter((t) => g.has(t.id))
    .map((t, i) => ({ id: t.id, nom: t.nom, detail: t.description, icone: t.icone, rang: saison.length + i, gagne: true }));
  const tout = [...saison, ...titres];
  // Un titre de collection dans la liste d'un joueur vient de son choix : on montre son choix, dans son ordre.
  if (!choisis?.length && titres.length) choisis = [...(gagnes ?? [])];
  if (choisis?.length) return choisis.map((id) => tout.find((b) => b.id === id)).filter((b) => b?.gagne).slice(0, places);
  return [...tout.filter((b) => b.gagne), ...tout.filter((b) => !b.gagne)].slice(0, places);
}

/** La feuille d'un palier (0 à 12) : métal et encre, comme FeuilleTicket. */
export function feuille(palier) {
  const i = Math.min(Math.max(0, palier ?? 0), PALIERS_FORTUNE.length - 1);
  const [id, nom] = PALIERS_FORTUNE[i];
  const c = CADRANS[id];
  const m = c.clair ? ["#fbf7ee", "#efe7d6", "#ddd1b8"] : c.app;
  return { m, encre: c.clair ? c.enc : c.fond, romain: ROMAINS[i], nom: nom.toUpperCase() };
}

/** La finition : le fond équipé, selon sa rareté. */
export const finition = (fond) => { const r = fond?.rarete ?? 0; return r <= 1 ? "sablee" : r === 2 ? "brossee" : r === 3 ? "martelee" : "miroir"; };

/**
 * La carte. record : déjà écrit (« 6 240 000 € ») ou null ; palier : 0 à 12 ; badges : listeBadges(…) ;
 * cosmetiques : sorte → pièce (fond, accent, pseudo).
 */
/** D394 (Arthur 16/11 11:55) : `avatar` ({ symbole, teinte }) pose un petit avatar à côté du pseudo, sans cadre (le tien
 *  sur ta carte, celui du joueur sur sa fiche) ; null : aucun. */
export function carteTicket({ pseudo, titre = null, bot = false, record = null, palier = 0, badges = [], cosmetiques = null, petite = false, avatar = null }) {
  const f = feuille(palier);
  const x = piecesDe(cosmetiques);
  const accent = x.accent?.couleurs?.[0];
  const vars = `--t1:${f.m[0]};--t2:${f.m[1]};--t3:${f.m[2]};--te:${f.encre}${accent ? `;--ta:${accent}` : ""}`;
  const pieces = badges.map((b) => `<button type="button" class="ct-piece ${b.gagne ? `ct-m${b.rang % 3}` : "ct-creux"}" data-badge="${esc(b.id)}"
      data-nom="${esc(b.nom)}" data-detail="${esc(b.detail)}" data-gagne="${b.gagne ? "1" : ""}" aria-label="${esc(b.gagne ? b.nom : `${b.nom}, pas encore gagné`)}" title="${esc(b.detail)}">
      ${b.icone ? iconeTitre(b.icone) : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONES[b.id] ?? ETOILE}"/></svg>`}</button>`).join("");
  const label = `${pseudo}${bot ? ", bot" : ""}${titre ? `, ${titre}` : ""}. Palier ${f.nom.toLowerCase()}. ${record ? `Record ${record}` : "Pas encore de record"}`;
  return `<div class="ct-carte ct-${finition(x.fond)}${petite ? " ct-petite" : ""}" style="${vars}">
    <div class="ct-ticket" role="group" aria-label="${esc(label)}">
      <div class="ct-corps">
        <span class="ct-nom">${avatar ? `<span class="ct-av" style="--c:${hex((Number(avatar.teinte) >>> 0) & 0xffffff)}" aria-hidden="true">${svgSymbole(SYMBOLES[avatar.symbole] ? avatar.symbole : "person.fill", 14)}</span>` : ""}<span class="ct-pseudo${accent ? " ct-souligne" : ""}${x.pseudo ? ` cz-pseudo" data-pseudo="${esc(x.pseudo.motif ?? "")}` : ""}">${esc(pseudo)}</span></span>
        ${titre ? `<span class="ct-titre">${esc(titre)}</span>` : ""}
        <span class="ct-pieces">${pieces}</span>
        <span class="ct-poincon"><span class="ct-record-mot">${record ? "RECORD" : "PREMIÈRE SAISON"}</span><span class="ct-record chiffres${record ? "" : " ct-record-vide"}">${esc(record ?? "Pas encore de record")}</span></span>
      </div>
      <span class="ct-perfo" aria-hidden="true"></span>
      <div class="ct-talon"><span class="ct-romain">${f.romain}</span><span class="ct-palier">${f.nom}</span>${bot ? `<span class="ct-bot">Bot</span>` : ""}</div>
    </div>
    <div class="ct-bulle" role="status" aria-live="polite" hidden></div>
  </div>`;
}

// D427 : le choix des badges se fait sur la page (pages/recompenses.js, sectionBadges), plus dans une feuille.

// L'appui long : une seule écoute pour toute la page (les cartes se redessinent souvent).
let minuteur = null;
function montrer(piece) {
  const carte = piece.closest(".ct-carte");
  const bulle = carte?.querySelector(".ct-bulle");
  if (!bulle) return;
  bulle.innerHTML = `<strong>${esc(piece.dataset.nom)}</strong><span>${esc(piece.dataset.detail)}</span>
    <em class="${piece.dataset.gagne ? "ct-gagne" : ""}">${piece.dataset.gagne ? "Gagné" : "Pas encore gagné"}</em>`;
  bulle.hidden = false;
  piece.classList.add("ct-tenue");
  navigator.vibrate?.(8);
}
function cacher() {
  clearTimeout(minuteur);
  document.querySelectorAll(".ct-bulle:not([hidden])").forEach((b) => { b.hidden = true; });
  document.querySelectorAll(".ct-tenue").forEach((p) => p.classList.remove("ct-tenue"));
}
if (typeof document !== "undefined" && !globalThis.__carteTicket) {
  globalThis.__carteTicket = true;
  document.addEventListener("pointerdown", (e) => {
    const p = e.target.closest?.(".ct-piece");
    if (!p) return;
    clearTimeout(minuteur);
    minuteur = setTimeout(() => montrer(p), 450);
  });
  for (const t of ["pointerup", "pointercancel", "scroll"]) document.addEventListener(t, cacher, { capture: true, passive: true });
  // Le doigt sort de la pièce : la bulle part aussi.
  document.addEventListener("pointerout", (e) => { const p = e.target.closest?.(".ct-piece"); if (p && !p.contains(e.relatedTarget)) cacher(); });
  document.addEventListener("contextmenu", (e) => { if (e.target.closest?.(".ct-piece")) e.preventDefault(); });
  // Au clavier : Entrée montre, la touche relâchée cache.
  document.addEventListener("keydown", (e) => { const p = e.target.closest?.(".ct-piece"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); montrer(p); } });
  document.addEventListener("keyup", (e) => { if (e.target.closest?.(".ct-piece")) cacher(); });
}
