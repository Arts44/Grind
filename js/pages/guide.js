// ══════════════════════════════════════════════════════════════════════
//  Le guide (EcranGuide, EcranChapitre ; RNT-146, D205) : tout le jeu, par
//  thème, avec la recherche. Le texte est celui de l'iPhone, mot pour mot
//  (guide-donnees.js, généré par scripts/guide-web.py).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "../format.js";
import { entetePousse, carte, bouton, icones } from "../ui.js";
import { symbole } from "./vie.js";
import { CHAPITRES } from "../guide-donnees.js";

let recherche = "";
const normaliser = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replaceAll("’", "'");

/** Les sections dont le titre ou le texte contient tous les mots cherchés (Guide.chercher). */
function chercher(q) {
  const mots = normaliser(q).split(" ").filter((m) => m.length >= 2);
  if (!mots.length) return [];
  const sortie = [];
  for (const c of CHAPITRES) for (const s of c.sections) {
    const t = normaliser(`${c.titre} ${s.titre} ${s.texte} ${s.exemple ?? ""}`);
    if (mots.every((m) => t.includes(m))) sortie.push([c, s]);
  }
  const dansTitre = ([, s]) => mots.every((m) => normaliser(s.titre).includes(m));
  return sortie.sort((a, b) => Number(dansTitre(b)) - Number(dansTitre(a)));
}

// RNT-196 : les symboles des chapitres arrivés depuis (la mer, manger, les montres), dessinés ici.
const trait = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const SYMBOLES_GUIDE = {
  "fork.knife": trait('<path d="M7 3v7a2 2 0 0 0 2 2v9M5 3v5M9 3v5M16.5 21V3c-2 1.2-3 3.6-3 6.5V13h3"/>'),
  "sailboat.fill": trait('<path d="M11 3v13H4zM13 6c3 2.5 4.6 6 5 10h-5zM3 18.5h18l-2 2.5H5z"/>'),
  "watch.analog": trait('<rect x="6" y="6" width="12" height="12" rx="6"/><path d="M9 6.3 9.6 3h4.8l.6 3.3M9 17.7l.6 3.3h4.8l.6-3.3M12 9.5V12l1.8 1.2"/>'),
};
const pastille = (sym, t = 40) => `<span class="gd-symbole" style="width:${t}px;height:${t}px">${SYMBOLES_GUIDE[sym] ?? symbole(sym)}</span>`;

function liste() {
  const q = recherche.trim();
  if (q.length < 2) {
    return `<p class="aide" style="margin-bottom:6px">Tout le jeu, par thème. Chaque page a son « ? » qui mène à son chapitre.</p>
      ${CHAPITRES.map((c) => `<button class="gd-ligne" data-action="ouvrir" data-page="guideChapitre" data-p='${esc(JSON.stringify({ id: c.id }))}'>
        ${pastille(c.symbole)}<span style="flex:1;min-width:0;text-align:left"><span class="gd-titre">${esc(c.titre)}</span><span class="aide gd-resume">${esc(c.resume)}</span></span>
        <span class="chevron" style="width:13px;color:var(--texte3)">${icones.chevron}</span></button>`).join("")}
      ${bouton("Pas trouvé ? Signale un bug ou pose ta question", "ouvrir", { genre: "secondaire", page: "reglages" })}`;
  }
  const r = chercher(q);
  if (!r.length) return `<p class="aide" style="text-align:center;padding:30px 10px">Rien sur « ${esc(q)} ». Essaie un autre mot, comme « crédit » ou « permis ».</p>`;
  return `<p class="aide">${r.length} résultat${r.length > 1 ? "s" : ""}</p>
    ${r.map(([c, s]) => `<button class="gd-ligne gd-resultat" data-action="ouvrir" data-page="guideChapitre" data-p='${esc(JSON.stringify({ id: c.id, section: s.titre }))}'>
      <span class="t2" style="font-size:12px;font-weight:600">${esc(c.titre)}</span><span class="gd-titre">${esc(s.titre)}</span><span class="aide gd-resume">${esc(s.texte)}</span></button>`).join("")}`;
}

export const pages = {
  guide: {
    titre: "Le guide",
    css: "guide", // RNT-210 : css/pages/guide.css (repris d'anciens.css)
    rendu: () => `${entetePousse("Le guide")}<div class="pile" style="gap:10px">
      <input class="champ" type="search" id="guide-recherche" style="font-weight:500" placeholder="Chercher dans le guide" value="${esc(recherche)}" data-saisie="chercherGuide" aria-label="Chercher dans le guide">
      <div class="pile" id="guide-liste" style="gap:10px">${liste()}</div></div>`,
    actions: {
      chercherGuide(ctx, el) { recherche = el.value; const l = document.getElementById("guide-liste"); if (l) l.innerHTML = liste(); },
    },
  },
  guideChapitre: {
    titre: "Le guide",
    donnees: async () => ({}),
    rendu(d, ctx, p) {
      const i = CHAPITRES.findIndex((c) => c.id === p.id);
      const c = CHAPITRES[i];
      if (!c) return `${entetePousse("Le guide")}<div class="vide">Ce chapitre n'existe plus.</div>`;
      const suivant = CHAPITRES[i + 1];
      return `${entetePousse("")}<div class="pile" style="gap:14px">
        <div class="pile" style="gap:10px">${pastille(c.symbole, 52)}<h2 style="font-size:28px;font-weight:700;letter-spacing:-.02em">${esc(c.titre)}</h2><p class="t2" style="font-size:15px">${esc(c.resume)}</p></div>
        ${c.sections.map((s) => carte(`<div class="libelle" style="font-size:17px">${esc(s.titre)}</div><p style="margin-top:6px;line-height:1.5">${esc(s.texte)}</p>
          ${s.exemple ? `<p class="gd-exemple">${esc(s.exemple)}</p>` : ""}`, { pad: true, classe: p.section === s.titre ? "gd-surlignee" : "", attrs: `id="gd-${esc(normaliser(s.titre).replace(/[^a-z0-9]+/g, "-"))}"` })).join("")}
        ${suivant ? `<button class="gd-ligne" data-action="ouvrir" data-page="guideChapitre" data-p='${esc(JSON.stringify({ id: suivant.id }))}'>
          <span style="flex:1;text-align:left"><span class="t2" style="display:block;font-size:12px">Chapitre suivant</span><span class="gd-titre">${esc(suivant.titre)}</span></span>
          <span style="width:18px;color:var(--accent)">${icones.chevron}</span></button>` : ""}
      </div>`;
    },
    apres(ctx, d, p) {
      // Ouvert depuis une recherche : on descend à la section, surlignée un instant.
      if (!p.section) return;
      const el = document.getElementById(`gd-${normaliser(p.section).replace(/[^a-z0-9]+/g, "-")}`);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    },
  },
};
