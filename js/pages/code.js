// ══════════════════════════════════════════════════════════════════════
//  D450 « Le code » — EcransCode.swift, écran pour écran :
//    codeEntrainement ← EcranCodeEntrainement (les séries ouvertes par la révision, les thèmes à revoir)
//    codeQuestions    ← EcranCodeQuestions    (une question par écran, examen ou série)
//    codeCorrection   ← EcranCodeCorrection   (le verdict, les erreurs et pourquoi, les thèmes faibles)
//  Le moteur tire les questions (graine de la partie) et corrige ; la page
//  ne fait que montrer et recueillir les réponses. Les dessins (panneaux,
//  carrefours) sont des formes de 100 × 100 tracées en SVG, les mêmes que
//  le Canvas de l'iPhone (CodeDessin.swift).
// ══════════════════════════════════════════════════════════════════════
import { esc } from "../format.js?v=3e8bddd9";
import { carte, bouton, entetePousse, vide } from "../ui.js?v=3e8bddd9";
import { etatDe, oublierEtat, interrupteur, ligneEtat } from "./immobilier.js?v=3e8bddd9";

const LETTRES = ["A", "B", "C", "D"];

/** Un dessin du code en SVG (formes de CodeRoute.Forme). */
export function dessin(formes, { classe = "cd-dessin", titre = "" } = {}) {
  if (!formes?.length) return "";
  const a = (k, v) => (v == null ? "" : ` ${k}="${esc(String(v))}"`);
  const peint = (f) => `${a("fill", f.fond ?? "none")}${f.trait ? `${a("stroke", f.trait)}${a("stroke-width", f.ep ?? 1)} stroke-linecap="round" stroke-linejoin="round"` : ""}`;
  const corps = formes.map((f) => {
    if (f.t === "chemin") return `<path d="${esc(f.d ?? "")}"${peint(f)}/>`;
    if (f.t === "cercle") return `<circle cx="${f.x}" cy="${f.y}" r="${f.r}"${peint(f)}/>`;
    if (f.t === "rect") return `<rect x="${f.x}" y="${f.y}" width="${f.l}" height="${f.h}"${a("rx", f.r)}${peint(f)}/>`;
    if (f.t === "texte") return `<text x="${f.x}" y="${f.y}" font-size="${f.taille}" font-weight="${f.gras ? 700 : 500}" fill="${esc(f.fond ?? "#000")}" text-anchor="middle" dominant-baseline="central" font-family="-apple-system, system-ui, sans-serif">${esc(f.texte ?? "")}</text>`;
    return "";
  }).join("");
  return `<svg class="${classe}" viewBox="0 0 100 100" role="img" aria-label="${esc(titre || "Illustration")}">${corps}</svg>`;
}

// MARK: - S'entraîner

function rendreEntrainement(d, ctx, p) {
  const t = d.t;
  if (!t?.actif) return `${entetePousse("S'entraîner")}${vide("Ce permis n'a pas encore ses questions.")}`;
  const ouvertes = t.series.filter((s) => s.ouverte).length;
  const serie = (s) => s.ouverte
    ? `<button class="cd-serie" data-action="codeSerie" data-n="${s.numero}"><b>Série ${s.numero}</b><span class="aide">${s.meilleure == null ? `${s.taille} questions` : `Meilleure : ${s.meilleure}/${s.taille}`}</span></button>`
    : `<div class="cd-serie ferme" aria-disabled="true"><b>Série ${s.numero}</b><span class="aide">${s.numero} h de révision</span></div>`;
  const faibles = t.faibles.length ? carte(`<div class="cd-bloc"><div class="libelle">À revoir</div>
      ${t.faibles.map((f) => `<div class="cd-faible"><span>${esc(f.nom)}</span><span class="chiffres aide">${f.bonnes}/${f.vues}</span></div>`).join("")}
      <p class="aide">Les thèmes où tu te trompes le plus. Les séries les mélangent tous : refais celles qui les contiennent.</p></div>`, { pad: true }) : "";
  const derniere = t.correction && t.correction.genre === "entrainement"
    ? bouton(`Revoir la série ${t.correction.serie} : ${t.correction.bonnes}/${t.correction.sur}`, "", { genre: "secondaire", page: "codeCorrection", p: { permis: t.permis } }) : "";
  // D460 : l'intitulé, ce qui change selon le pays ; une licence hors du garage (la Super licence) lance son examen d'ici.
  // D462 : « Code belge », « Règles belges de la mer » : le pays fixé à l'inscription.
  const titre = esc(t.titre ?? (t.licence ? t.intitule : `${t.intitule} · ${t.paysNom}`));
  const examen = t.boutonExamen ? bouton(t.boutonExamen, "codeExamen") : t.refusExamen ? `<p class="aide" id="cd-refus">${esc(t.refusExamen)}</p>` : "";
  // D462 : la Super licence se révise comme un permis : ses heures ouvrent les séries.
  const revision = t.revisable ? `${ligneEtat("Révision", t.heures / Math.max(1, t.heuresMax), `${t.heures.toFixed(1).replace(".", ",")} h`)}
      ${interrupteur(t.revise, `<div class="libelle">Réviser la ${esc(t.nom)}</div><div class="aide">Les sessions Révision de Focus : chaque heure ouvre une série.</div>`, "codeReviser")}` : "";
  return `${entetePousse("S'entraîner")}
  <div class="pz-pile cd-page" id="zone-code">
    ${carte(`<div class="cd-bloc"><div class="rangee entre cd-entete"><span class="libelle">${titre}</span>${t.repere ? `<span class="aide">${esc(t.repere)}</span>` : ""}</div>
      <p class="aide">${esc(t.aide || `Une série s'ouvre par heure de révision ; ${ouvertes} sur ${t.series.length} ouverte${ouvertes > 1 ? "s" : ""}.`)}</p>${revision}${examen}</div>`, { pad: true })}
    <div class="cd-series">${t.series.map(serie).join("")}</div>
    ${t.prochaine ? `<p class="aide">${esc(t.prochaine)}</p>` : ""}
    ${faibles}
    ${derniere}
  </div>`;
}

// MARK: - Une question par écran

function etatQuestions(p) { return etatDe(p, "code", { rang: 0, reponses: [], envoi: false }); }

function questionsDe(d, p) { return (p.mode === "examen" ? d.t?.examen : d.t?.serie) ?? []; }

function rendreQuestions(d, ctx, p) {
  const titre = p.mode === "examen" ? "Examen de théorie" : `Série ${p.serie}`;
  const qs = questionsDe(d, p);
  if (!qs.length) return `${entetePousse(titre)}${vide(p.mode === "examen" ? "Aucun examen commencé." : "Cette série n'est pas ouverte.")}`;
  const e = etatQuestions(p);
  e.rang = Math.min(e.rang, qs.length - 1);
  const q = qs[e.rang];
  const choisie = e.reponses[e.rang];
  const dernier = e.rang === qs.length - 1;
  const repondues = e.reponses.filter((x) => x != null).length;
  return `${entetePousse(titre)}
  <div class="pz-pile cd-page" id="zone-code">
    <div class="cd-progres"><span class="chiffres">Question ${e.rang + 1} / ${qs.length}</span><span class="aide">${esc(q.theme)}</span></div>
    <div class="cd-rail" role="progressbar" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${repondues}"><i style="--p:${(repondues / qs.length) * 100}%"></i></div>
    ${carte(`${q.image ? `<div class="cd-image">${dessin(q.image, { titre: q.texte })}</div>` : ""}<p class="cd-question">${esc(q.texte)}</p>`, { pad: true, classe: "cd-carte-question" })}
    <div class="cd-reponses" role="radiogroup" aria-label="Réponses">
      ${q.reponses.map((r, i) => `<button class="cd-reponse" role="radio" aria-checked="${choisie === i}" data-action="codeChoisir" data-i="${i}">
        <span class="cd-lettre">${LETTRES[i]}</span><span>${esc(r)}</span></button>`).join("")}
    </div>
    <div class="cd-nav">
      ${e.rang > 0 ? bouton("Précédente", "codePrecedente", { genre: "secondaire" }) : ""}
      ${dernier ? bouton(p.mode === "examen" ? "Rendre ma copie" : "Corriger", "codeRendre", { desactive: repondues < qs.length || e.envoi })
        : bouton("Suivante", "codeSuivante", { desactive: choisie == null })}
    </div>
    ${dernier && repondues < qs.length ? `<p class="aide">Il reste ${qs.length - repondues} question${qs.length - repondues > 1 ? "s" : ""} sans réponse : reviens-y avec « Précédente ».</p>` : ""}
  </div>`;
}

// MARK: - La correction

function rendreCorrection(d, ctx, p) {
  const c = d.t?.correction;
  if (!c) return `${entetePousse("Correction")}${vide("Pas encore de copie corrigée.")}`;
  const fautes = c.items.filter((x) => !x.juste);
  const justes = c.items.filter((x) => x.juste);
  const item = (x, k) => `<div class="cd-item">
      <div class="cd-item-tete"><span class="chiffres aide">${k}</span><span class="aide">${esc(x.question.theme)}</span>${x.question.grave ? `<span class="cd-grave">Faute grave</span>` : ""}</div>
      ${x.question.image ? `<div class="cd-image petite">${dessin(x.question.image, { titre: x.question.texte })}</div>` : ""}
      <p class="cd-question petite">${esc(x.question.texte)}</p>
      ${x.choisie >= 0 && x.choisie !== x.bonne ? `<div class="cd-rep faux"><span class="cd-marque" aria-hidden="true">✕</span><span>${esc(x.question.reponses[x.choisie])}</span></div>` : ""}
      <div class="cd-rep juste"><span class="cd-marque" aria-hidden="true">✓</span><span>${esc(x.question.reponses[x.bonne])}</span></div>
      <p class="aide">${esc(x.pourquoi)}</p></div>`;
  const rang = (x) => c.items.indexOf(x) + 1;
  const theorie = c.bonnes >= c.seuil && !c.graves;
  const pastilles = c.genre === "examen"
    ? `<div class="cd-pastilles"><span class="cd-pastille ${theorie ? "oui" : "non"}">Théorie</span>${theorie && c.avecPratique !== false ? `<span class="cd-pastille ${c.reussi ? "oui" : "non"}">Pratique</span>` : ""}</div>`
    : c.genre === "pratique" ? `<div class="cd-pastilles"><span class="cd-pastille ${c.reussi ? "oui" : "non"}">Pratique</span></div>` : "";
  return `${entetePousse(c.titre)}
  <div class="pz-pile cd-page" id="zone-code">
    ${carte(`<div class="cd-verdict ${c.reussi ? "oui" : "non"}">
        ${c.sur ? `<div class="cd-score chiffres">${c.bonnes}<span>/${c.sur}</span></div>` : ""}
        <p>${esc(c.verdict)}</p>${pastilles}</div>`, { pad: true })}
    ${c.faibles.length ? carte(`<div class="cd-bloc"><div class="libelle">À revoir</div>
        ${c.faibles.map((f) => `<div class="cd-faible"><span>${esc(f.nom)}</span><span class="chiffres aide">${f.bonnes}/${f.vues}</span></div>`).join("")}</div>`, { pad: true }) : ""}
    ${fautes.length ? `<h3 class="libelle cd-titre">${fautes.length} erreur${fautes.length > 1 ? "s" : ""}</h3>${carte(fautes.map((x) => item(x, rang(x))).join(`<div class="filet"></div>`), { pad: true })}` : ""}
    ${justes.length ? `<details class="carte pad cd-justes"><summary class="libelle">${justes.length} bonne${justes.length > 1 ? "s" : ""} réponse${justes.length > 1 ? "s" : ""}</summary>
        ${justes.map((x) => item(x, rang(x))).join(`<div class="filet"></div>`)}</details>` : ""}
    ${bouton(c.avecPratique === false ? "Retour" : "Retour au permis", "codeFini")}
  </div>`;
}

export const pages = {
  codeEntrainement: {
    titre: "S'entraîner",
    css: "code",
    async donnees(ctx, p) { return { t: await ctx.tableau("code", { id: p.permis }) }; },
    rendu: rendreEntrainement,
    actions: {
      codeSerie(ctx, b, d, p) { return ctx.ouvrir("codeQuestions", { permis: p.permis, mode: "serie", serie: Number(b.dataset.n) }); },
      // D462 : les sessions Révision vont à la licence (ou plus à rien).
      codeReviser(ctx, b, d, p) {
        const oui = !d.t?.revise;
        return ctx.decider("garage", { reviser: oui ? { permis: p.permis } : {} }, { succes: oui ? "Les sessions Révision avancent la théorie" : "Plus de révision en cours" });
      },
      // D460 : la Super licence : tirer les questions (ou reprendre la copie commencée), puis y répondre.
      async codeExamen(ctx, b, d, p) {
        if (!d.t?.examen && !(await ctx.decider("garage", { commencerExamen: { permis: p.permis } }))) return;
        return ctx.ouvrir("codeQuestions", { permis: p.permis, mode: "examen" });
      },
    },
  },
  codeQuestions: {
    titre: "Questions",
    css: "code",
    async donnees(ctx, p) { return { t: await ctx.tableau("code", p.mode === "serie" ? { id: p.permis, serie: p.serie } : { id: p.permis }) }; },
    rendu: rendreQuestions,
    actions: {
      codeChoisir(ctx, b, d, p) { const e = etatQuestions(p); e.reponses[e.rang] = Number(b.dataset.i); ctx.redessiner(); },
      codeSuivante(ctx, b, d, p) { const e = etatQuestions(p); e.rang += 1; ctx.redessiner(); window.scrollTo?.(0, 0); },
      codePrecedente(ctx, b, d, p) { const e = etatQuestions(p); e.rang = Math.max(0, e.rang - 1); ctx.redessiner(); },
      async codeRendre(ctx, b, d, p) {
        const e = etatQuestions(p);
        const qs = questionsDe(d, p);
        if (e.envoi || e.reponses.filter((x) => x != null).length < qs.length) return;
        e.envoi = true;
        const reponses = qs.map((_, i) => e.reponses[i] ?? -1);
        const op = p.mode === "examen" ? { repondreExamen: { permis: p.permis, reponses } } : { entrainement: { permis: p.permis, serie: p.serie, reponses } };
        const ok = await ctx.decider("garage", op);
        e.envoi = false;
        if (!ok) return ctx.redessiner();
        oublierEtat(p, "code");
        await ctx.retour();
        await ctx.ouvrir("codeCorrection", { permis: p.permis });
      },
    },
  },
  codeCorrection: {
    titre: "Correction",
    css: "code",
    async donnees(ctx, p) { return { t: await ctx.tableau("code", { id: p.permis }) }; },
    rendu: rendreCorrection,
    actions: {
      codeFini(ctx) { return ctx.retour(); },
    },
  },
};
