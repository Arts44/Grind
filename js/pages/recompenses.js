// ══════════════════════════════════════════════════════════════════════
//  La vitrine et Personnaliser (RNT-231, D230) — EcranVitrine et
//  EcranPersonnaliser de l'iPhone (Rente/Ecrans/EcranCosmetiques.swift).
//
//  Vitrine : ce que tu as gagné, ce qui reste à gagner (à quel record,
//  par quel défi), les défis de la saison avec leur avancement, l'échelle
//  des paliers. Personnaliser : une section par famille, un aperçu en
//  direct en tête (ta carte de membre, ton marqueur, tes objets).
//  Le dévoilement du bilan (`devoiler`) et la jauge de l'accueil
//  (`jaugeAccueil`) vivent ici aussi.
//  Tout vient de TableauCosmetiques (RenteCore).
// ══════════════════════════════════════════════════════════════════════
import { esc, montant } from "../format.js";
import { entetePousse, carte, section, bouton, vide, ligne } from "../ui.js";
import * as C from "../cosmetiques.js";
import { avatarJoueur } from "../compte-local.js";

const GENRES = {
  focus: { c: "var(--grandir)", svg: '<circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4.4l2.6 1.6M9.5 2.8h5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>' },
  economie: { c: "var(--argent)", svg: '<path d="M3.5 17.5 9 12l3.5 3.5 8-8M15 7.5h5.5V13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
  social: { c: "var(--equipe)", svg: '<circle cx="8.5" cy="8" r="3.4"/><circle cx="16.5" cy="9" r="2.8"/><path d="M2.5 19c.7-3.6 3.2-5.6 6-5.6s5.3 2 6 5.6zM15 13.6c2.9 0 5.4 1.6 6.4 5.4h-5.2c-.2-2-.6-3.8-1.2-5.4z"/>' },
  exploration: { c: "var(--image)", svg: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.6 8.4 13.4 13.4 8.4 15.6l2.2-5z"/>' },
};
const icone = (g) => `<span class="cz-defi-icone" style="--c:${GENRES[g]?.c ?? "var(--accent)"}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${GENRES[g]?.svg ?? ""}</svg></span>`;
const rarete = (p) => `<span class="cz-rarete" data-r="${p.rarete}">${esc(p.rareteNom)}</span>`;

const etat = { famille: "profil" };

async function lire(ctx) {
  await C.chargerCatalogue(ctx);
  return ctx.tableau("cosmetiques", { equipement: C.equipement() });
}

/** Une tuile : la miniature, le nom, la rareté et comment on la gagne. */
function tuile(p, { action = "", choisie = false } = {}) {
  const corps = `${C.apercu(p, { ferme: !p.gagnee })}
    <span class="cz-tuile-texte"><b>${esc(p.nom)}</b>${rarete(p)}<span class="cz-source">${p.gagnee ? (p.equipee ? "Équipée" : "Gagnée") : esc(p.source)}</span></span>`;
  if (!action) return `<div class="cz-tuile ${p.gagnee ? "gagnee" : ""}" data-cle="${esc(p.id)}">${corps}</div>`;
  return `<button class="cz-tuile ${p.gagnee ? "gagnee" : ""}" data-action="${action}" data-sorte="${esc(p.sorte)}" data-id="${esc(p.id)}" data-cle="${esc(p.id)}"
    aria-pressed="${choisie}" ${p.gagnee ? "" : "disabled"} aria-label="${esc(`${p.nom}, ${p.rareteNom}. ${p.gagnee ? (choisie ? "Équipée" : "Gagnée") : `À gagner : ${p.source}`}`)}">${corps}</button>`;
}

/** Les défis de la saison, avec leur avancement et la pièce qu'ils donnent. */
export function listeDefis(defis) {
  if (!defis?.length) return "";
  return carte(`<div class="cz-defis">${defis.map((d) => `<div class="cz-defi ${d.fait ? "fait" : ""}" data-cle="${esc(d.id)}">
      ${icone(d.genre)}
      <div class="cz-defi-texte"><b>${esc(d.nom)}</b><span>${esc(d.detail)}</span>
        <div class="cz-defi-rail" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(d.progression * 100)}" aria-label="${esc(d.nom)}"><i style="--part:${(d.progression * 100).toFixed(1)}%;--c:${GENRES[d.genre]?.c ?? "var(--accent)"}"></i></div>
        <span class="chiffres">${d.fait ? "Réussi" : esc(d.avancement)} · ${esc(d.genreNom)}</span></div>
      ${d.piece ? C.apercu(d.piece, { ferme: !d.piece.gagnee }) : ""}
    </div>`).join("")}</div>`);
}

/** L'échelle des paliers de record. */
function echelle(t) {
  return carte(`<div class="cz-paliers">${t.paliers.map((p) => `<div class="cz-palier ${p.atteint ? "atteint" : ""}" data-cle="p${p.numero}">
      <span class="cz-palier-num">${p.numero}</span>
      <span class="cz-palier-texte"><b class="chiffres">${esc(p.texte)}</b><span>${esc([...p.pieces.map((x) => x.nom), ...p.cartes.map((c) => `carte ${c}`)].join(" · "))}</span></span>
      <span class="cz-palier-pieces">${p.pieces.slice(0, 2).map((x) => C.apercu(x, { ferme: !p.atteint })).join("")}</span>
    </div>`).join("")}</div>`);
}

/** La jauge de l'accueil : la prochaine récompense au record, et les défis en cours. Rien hors saison. */
export async function jaugeAccueil(ctx) {
  const t = await lire(ctx).catch(() => null);
  if (!t?.prochaine && !t?.defis?.length) return "";
  const p = t.prochaine;
  const defis = t.defis.slice(0, 5).map((d) => `<span class="${d.fait ? "fait" : ""}">${esc(d.nom)} · ${d.fait ? "réussi" : esc(d.avancement)}</span>`).join("");
  return `<button class="carte cz-jauge" id="cz-jauge" data-action="ouvrir" data-page="vitrine" aria-label="${esc(p ? `${p.titre}. ${p.detail}` : "Défis de la saison")}">
    <span class="cz-jauge-texte"><b>${esc(p?.titre ?? "Défis de la saison")}</b><span>${esc(p?.detail ?? `${t.defis.filter((d) => d.fait).length} sur ${t.defis.length} réussis`)}</span></span>
    ${p?.pieces?.[0] ? C.apercu(p.pieces[0]) : ""}
    ${p ? `<span class="cz-jauge-rail"><i style="--part:${(p.progression * 100).toFixed(1)}%"></i></span>` : ""}
    ${defis ? `<span class="cz-jauge-defis">${defis}</span>` : ""}
  </button>`;
}

/** L'aperçu en direct de Personnaliser : ta carte de membre, ta carte du monde, tes objets. */
function apercuDirect(ctx, t) {
  const valide = Object.fromEntries(t.familles.flatMap((f) => f.sortes).filter((s) => s.equipee).map((s) => [s.id, s.equipee]));
  const h = C.habillageMembre(valide);
  const x = C.piecesDe(valide);
  const pseudo = ctx.etat.compte?.pseudo || "Toi";
  const traine = x.trainee ? C.apercu(x.trainee).replace("cz-apercu", "cz-trace-dessin") : "";
  return carte(`<div class="cz-perso-apercu" id="cz-apercu-direct">
    <div class="cz-perso-rangee">
      <div class="cl-membre ${h.classe}" ${h.style} role="img" aria-label="Ta carte de membre">${h.banniere}
        <span class="cl-membre-haut"><span class="cl-mot">Membre</span>${avatarJoueur(40)}</span>
        <span class="cl-membre-pseudo ${h.pseudo}">${esc(pseudo)}</span>
        <span class="cl-membre-bas"><span>Aperçu</span></span></div>
      <div class="cz-perso-carte-monde" role="img" aria-label="Ton marqueur sur la carte">
        ${x.trainee ? `<span class="cz-trace">${traine}</span>` : ""}
        ${C.svgMarqueur(x.marqueur?.motif, x.couleurMarqueur?.couleurs, { taille: 30, id: "direct" })}
      </div>
    </div>
    <div class="cz-perso-objets" aria-hidden="true">
      <span>${C.svgPlaque(x.plaque)}</span><span>${C.svgFacade(x.facade)}</span><span>${C.svgCadran(x.cadran, { id: "direct" })}</span>
    </div></div>`);
}

export const pages = {
  vitrine: {
    titre: "Vitrine",
    css: "cosmetiques",
    async donnees(ctx) { return { t: await lire(ctx) }; },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Vitrine")}${vide("La vitrine s'ouvre avec ta première saison.")}`;
      const f = t.familles.find((x) => x.id === etat.famille) ?? t.familles[0];
      const pieces = f?.sortes.flatMap((s) => s.pieces) ?? [];
      return `${entetePousse("Vitrine")}
      <div class="cz-page">
        ${carte(`<div class="cz-tete">
          <div class="cz-tete-chiffres"><span class="libelle">Ta collection</span><span class="chiffres">${t.gagnees} / ${t.total}</span></div>
          <p class="aide">Tout le reste est liquidé en fin de saison. Ces pièces-là te suivent : elles se gagnent aux paliers de record et par les défis de saison.</p>
          ${t.record != null ? `<p class="aide">Ton record : <span class="or chiffres">${montant(t.record)}</span></p>` : ""}
        </div>`)}
        ${carte(ligne({ titre: "Personnaliser", detail: "Équipe tes pièces : profil, carte du monde, patrimoine, interface", page: "personnaliser", icone: "image", teinte: "var(--image)" }))}
        ${t.prochaine ? `<div>${section(t.nomSaison ? `${t.nomSaison} : la prochaine récompense` : "La prochaine récompense")}${carte(`<div class="cz-jauge">
            <span class="cz-jauge-texte"><b>${esc(t.prochaine.titre)}</b><span>${esc(t.prochaine.detail)}</span></span>
            ${t.prochaine.pieces[0] ? C.apercu(t.prochaine.pieces[0]) : ""}
            <span class="cz-jauge-rail"><i style="--part:${(t.prochaine.progression * 100).toFixed(1)}%"></i></span></div>`)}</div>` : ""}
        ${t.defis.length ? `<div>${section("Les défis de la saison")}${listeDefis(t.defis)}<p class="aide cz-note">Les mêmes pour tous les joueurs de ton monde. Chacun donne une pièce unique, qui te suit.</p></div>` : ""}
        <div>${section("Les pièces")}
          <div class="cz-familles" role="tablist">${t.familles.map((x) => `<button class="cz-famille-pastille" role="tab" data-action="choisirFamille" data-id="${esc(x.id)}" aria-pressed="${x.id === f.id}" aria-selected="${x.id === f.id}"><b>${esc(x.nom)}</b><span class="chiffres">${x.gagnees} / ${x.total}</span></button>`).join("")}</div>
          <p class="aide cz-note">${esc(f.detail)}</p>
          <div class="cz-grille">${pieces.map((p) => tuile(p)).join("")}</div>
        </div>
        <div>${section("Les paliers de record")}${echelle(t)}<p class="aide cz-note">Ton record, c'est ton meilleur patrimoine de fin de saison. Les deux derniers paliers s'ouvrent aussi au cumul de toutes tes saisons.</p></div>
      </div>`;
    },
    actions: {
      choisirFamille(ctx, b) { etat.famille = b.dataset.id; ctx.redessiner(); },
    },
  },

  personnaliser: {
    titre: "Personnaliser",
    css: "cosmetiques",
    async donnees(ctx) { return { t: await lire(ctx) }; },
    rendu(d, ctx) {
      const t = d.t;
      if (!t) return `${entetePousse("Personnaliser")}${vide("Tes pièces s'équipent dès ta première saison.")}`;
      return `${entetePousse("Personnaliser", `<button class="petit" data-action="ouvrir" data-page="vitrine">Vitrine</button>`)}
      <div class="cz-page">
        ${apercuDirect(ctx, t)}
        ${t.familles.map((f) => `<div>${section(f.nom)}<p class="aide cz-note">${esc(f.detail)}</p>
          ${f.sortes.map((s) => `<div class="cz-sorte" data-cle="${esc(s.id)}"><div class="libelle cz-sorte-nom">${esc(s.nom)} <span class="t2">· ${esc(s.equipee ? s.pieces.find((p) => p.id === s.equipee)?.nom ?? s.defaut : s.defaut)}</span></div>
            <div class="cz-choix" role="listbox" aria-label="${esc(s.nom)}">
              <button class="cz-tuile gagnee" data-action="equiper" data-sorte="${esc(s.id)}" data-id="" aria-pressed="${!s.equipee}"><span class="cz-base">${esc(s.defaut)}</span><span class="cz-tuile-texte"><b>${esc(s.defaut)}</b><span class="cz-source">De base</span></span></button>
              ${s.pieces.map((p) => tuile(p, { action: "equiper", choisie: s.equipee === p.id })).join("")}
            </div></div>`).join("")}
        </div>`).join("")}
        <p class="aide cz-note">Les autres joueurs voient ton profil, ta carte du monde et tes finitions ; l'interface reste à toi.</p>
      </div>`;
    },
    actions: {
      async equiper(ctx, b) {
        C.equiper(b.dataset.sorte, b.dataset.id);
        if (b.dataset.sorte === "sons" && b.dataset.id) import("../sons.js").then((s) => s.jouerFichier("ching"));
        await ctx.rafraichir();
      },
    },
  },
};

// MARK: Le dévoilement du bilan

/**
 * Les récompenses de la saison, une par une (TableauBilan.revelations) : une feuille, « Suivante »,
 * puis « Personnaliser ». Avec « réduire les animations », chaque pièce apparaît sans mouvement.
 */
export async function devoiler(ctx, revelations, { auDebut = 0 } = {}) {
  if (!revelations?.length) return;
  await C.chargerCatalogue(ctx);
  let i = auDebut;
  const rendu = () => {
    const r = revelations[i];
    const p = r.genre === "piece" ? { ...(C.piece(r.piece) ?? {}), sorte: C.piece(r.piece)?.sorte ?? "", gagnee: true } : null;
    const visuel = p?.sorte ? C.apercu(p, { grand: true }) : `<span class="cz-apercu grand cz-badge" style="--c1:#E3C46B;--c2:#8A6A2B"><span class="cz-mini-carte"><i></i><b>${esc(r.nom)}</b></span></span>`;
    const dernier = i === revelations.length - 1;
    return `<div class="cz-devoile" data-rarete="${r.rarete}" data-cle="r${i}">
      <div class="cz-devoile-points" aria-hidden="true">${revelations.map((_, k) => `<i class="${k < i ? "vu" : k === i ? "ici" : ""}"></i>`).join("")}</div>
      <div class="cz-devoile-scene cz-devoile-objet" data-cle="o${i}">${visuel}</div>
      <div class="cz-devoile-texte cz-devoile-objet" data-cle="t${i}" aria-live="polite">
        <span class="cz-rarete" data-r="${r.rarete}">${esc(r.rareteNom)} · ${esc(r.sorte)}</span>
        <b>${esc(r.nom)}</b><span>${esc(r.detail)}</span></div>
      <div class="cz-devoile-boutons">
        ${dernier ? bouton("Personnaliser", "versPersonnaliser") : bouton(`Suivante (${i + 2} sur ${revelations.length})`, "suivante")}
        ${dernier ? bouton("Fermer", "fermer", { genre: "secondaire" }) : bouton("Tout voir", "toutVoir", { genre: "discret" })}
      </div></div>`;
  };
  ctx.feuille({
    titre: `${revelations.length} récompense${revelations.length > 1 ? "s" : ""} gagnée${revelations.length > 1 ? "s" : ""}`,
    rendu,
    actions: {
      suivante(c) { i = Math.min(revelations.length - 1, i + 1); c.redessiner(); import("../sons.js").then((s) => s.jouerSon(revelations[i].rarete >= 4 ? "succes" : "piece")); },
      toutVoir(c) { c.fermerFeuille(); c.ouvrir("vitrine"); },
      versPersonnaliser(c) { c.fermerFeuille(); c.ouvrir("personnaliser"); },
      fermer(c) { c.fermerFeuille(); },
    },
  });
}
