// ══════════════════════════════════════════════════════════════════════
//  La boîte d'un autre joueur (RNT-144) : FicheBoiteJoueur de l'iPhone
//  (Rente/Ecrans/EcranInteractions.swift) sur le web.
//
//  Sa devanture, à qui elle est, ce qu'elle vaut, où en est mon
//  inspection, et « L'inspecter » sur place : rapide ou poussée, au prix
//  du moteur. La règle (l'option du monde, une inspection par boîte et
//  par jour) est celle du moteur (`enLigne.boiteJoueur`), la même que la
//  carte « Ici » de l'accueil, d'où l'on ouvre cette fiche (retour du
//  16/10), et que le plan.
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js";
import { carte, ligne, bouton } from "../ui.js";
import * as L from "../enligne.js";

const LOUPE = '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5"/>';
const TRAITS = {
  boutique: '<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20.5v-6h6v6"/>',
  rapide: LOUPE,
  poussee: '<rect x="4" y="3" width="12" height="17" rx="2"/><path d="M7.5 7.5h5M7.5 11h3"/><circle cx="15.5" cy="15.5" r="3.3"/><path d="M18 18l3 3"/>',
  attente: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9"/>',
  rien: '<path d="M12 3l2.4 1.7 2.9-.2.9 2.8 2.4 1.7-.9 2.8.9 2.8-2.4 1.7-.9 2.8-2.9-.2L12 21l-2.4-1.7-2.9.2-.9-2.8-2.4-1.7.9-2.8-.9-2.8 2.4-1.7.9-2.8 2.9.2z"/><path d="M8.8 12.2l2.2 2.2 4.2-4.4"/>',
  trouve: `${LOUPE}<path d="M10.5 7.5v3.5M10.5 13.3h.01"/>`,
};
const ic = (nom, t = 20) =>
  `<svg viewBox="0 0 24 24" width="${t}" height="${t}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRAITS[nom]}</svg>`;

/** Ma dernière inspection de cette boîte : en attente, ou ce qu'elle a trouvé (EtatInspection). */
function etatInspection(x) {
  const trouve = x.trouve ?? [];
  const icone = x.fini ? (trouve.length ? "trouve" : "rien") : "attente";
  const titre = x.fini ? (trouve.length ? "Inspection : trouvé" : "Inspection : rien de notable") : "Inspection en cours";
  const texte = x.fini
    ? (trouve.length ? `${trouve.join(", ")}. Tu peux le signaler ou le faire chanter depuis sa fiche.` : "Rien ne dépasse. Ça ne veut pas dire qu'il est en règle.")
    : "Le résultat arrive dès que le patron ouvre Grind ; tu seras prévenu.";
  return `<div class="bj-etat ${x.fini && trouve.length ? "trouve" : ""}" id="bj-etat">
    <span class="bj-pastille">${ic(icone, 19)}</span>
    <div style="min-width:0;display:grid;gap:4px"><div class="bj-etat-t">${esc(titre)}</div>
      <div class="aide">${esc(texte)}</div><div class="bj-legende">Une inspection par boîte et par jour.</div></div></div>`;
}

/**
 * Ouvre la fiche de la boîte `id` (« <joueur>|<n° dans son profil> »). `allerY(ctx)` : y aller quand on
 * n'y est pas (le plan l'offre ; depuis la carte « Ici », on y est déjà).
 */
export async function ouvrirBoiteJoueur(ctx, id, { allerY = null } = {}) {
  styles();
  const charger = () => ctx.jouer("enLigne.boiteJoueur", { boite: id, interactions: L.monde.interactions ?? [] }, { silencieux: true });
  let f = await charger();
  if (!f || f.refus) return ctx.toast(f?.refus ?? "Cette boîte n'est plus dans le monde.", "refus");
  let enCours = false;
  let retour = null;
  const rendu = () => {
    const b = f.boite;
    const teinte = b.couleur ? `#${String(b.couleur).replace("#", "")}` : "var(--controles)";
    const peut = f.inspection && !f.recente;
    const modes = f.modes.map((m) => ligne({
      titre: esc(m.titre), detail: esc(m.detail), valeur: montant(m.cout), icone: ic(m.mode, 18), teinte: "var(--controles)",
      action: "inspecterBoite", donnees: { mode: m.mode }, desactive: enCours,
    })).join('<div class="filet"></div>');
    return `<div class="pile bj-fiche" style="gap:16px">
      <div class="bj-devanture" style="--t:${teinte}"><span class="bj-store"></span><span class="bj-porte">${ic("boutique", 30)}</span></div>
      <div style="display:grid;gap:3px"><div class="bj-nom">${esc(b.nom)}</div>
        <div class="aide">La boîte de ${esc(b.pseudo || "un joueur du monde")}, ${esc(String(b.secteur).toLowerCase())} · ${esc(b.ville)}</div></div>
      ${carte(ligne({ titre: "Valeur estimée", valeur: montant(b.valeur) }))}
      ${f.derniere ? etatInspection(f.derniere) : ""}
      ${!f.inspection ? `<p class="aide" style="margin:0 4px">L'inspection est coupée dans ce monde.</p>` : ""}
      ${peut && f.ici ? `<div id="bj-inspecter"><div class="section" style="margin-top:0">L'inspecter</div>${carte(modes)}
        <p class="aide" style="margin:8px 4px 0">Rien de notable ne veut pas dire qu'il est en règle : l'inspection peut passer à côté. ${f.averti ? "Il saura qu'on l'a inspecté, pas par qui." : "Il ne saura rien."}</p></div>` : ""}
      ${peut && !f.ici ? `<div class="pile" style="gap:8px">${allerY ? bouton("Y aller pour l'inspecter", "allerBoite", { genre: "teinte", teinte: "var(--controles)" }) : ""}
        <p class="aide" style="margin:0 4px">L'inspection se fait sur place.</p></div>` : ""}
      ${retour ? `<p class="bj-retour" role="status">${esc(retour)}</p>` : ""}
    </div>`;
  };
  ctx.feuille({
    titre: "",
    rendu,
    actions: {
      async inspecterBoite(c, el) {
        if (enCours) return; // un double appui ne paie pas deux fois
        enCours = true; retour = null; c.redessiner();
        const r = await L.inspecter(c, id, el.dataset.mode);
        enCours = false;
        retour = r ?? null;
        f = (await charger()) ?? f;
        if (!r) c.toast("Inspection envoyée", "gain");
        c.redessiner();
      },
      allerBoite(c) { c.fermerFeuille(); allerY?.(c); },
    },
  });
}

function styles() {
  if (document.getElementById("styles-boite-joueur")) return;
  const s = document.createElement("style");
  s.id = "styles-boite-joueur";
  s.textContent = `
.bj-devanture { position: relative; height: 104px; margin-top: 4px; border-radius: 20px; overflow: hidden; display: grid; place-items: end center;
  background: linear-gradient(170deg, color-mix(in srgb, var(--t) 26%, transparent), color-mix(in srgb, var(--t) 5%, transparent) 80%); border: 1px solid var(--filet); }
.bj-store { position: absolute; top: 0; left: 0; right: 0; height: 22px;
  background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--t) 70%, transparent) 0 18px, color-mix(in srgb, var(--t) 30%, transparent) 18px 36px); }
.bj-porte { width: 64px; height: 58px; border-radius: 14px 14px 0 0; display: grid; place-items: center; color: var(--t);
  background: color-mix(in srgb, var(--t) 14%, rgba(0,0,0,.35)); border: 1px solid color-mix(in srgb, var(--t) 30%, transparent); border-bottom: 0; }
.bj-nom { font-size: 22px; font-weight: 650; letter-spacing: -.01em; }
.bj-etat { display: flex; gap: 12px; align-items: flex-start; padding: 14px; border-radius: 18px; background: rgba(255,255,255,.04); border: 1px solid var(--filet2); }
.bj-etat.trouve { border-color: color-mix(in srgb, var(--or) 60%, transparent); }
.bj-pastille { flex: none; width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; color: var(--controles);
  background: color-mix(in srgb, var(--controles) 16%, transparent); }
.bj-etat-t { font-size: 15px; font-weight: 600; }
.bj-legende { font-size: 11.5px; color: var(--texte3); }
.bj-retour { margin: 0 4px; font-size: 14px; font-weight: 500; color: var(--alerte); }
`;
  document.head.append(s);
}
