// ══════════════════════════════════════════════════════════════════════
//  Zone « cercle » (D444, D456) — EcranCercle.swift et FeuilleParler.
//  L'entourage : tes amis, vos amis, ses parents, sa famille, tes ex,
//  ses ex. Toucher quelqu'un ouvre SA fiche (page « personne », la même
//  que pour une rencontre). « Lui parler » (page « filCercle ») : sur le
//  web, pas d'Apple Intelligence : on choisit une intention, puis une des
//  6 à 8 phrases (ou on écrit, et l'intention choisie fait foi) ; la
//  réponse arrive dans le même fil que ses messages. Le moteur décide.
// ══════════════════════════════════════════════════════════════════════
import { montant, esc, deviseAffichage } from "../format.js?v=3e8bddd9";
import { entetePousse, carte, petit, champEuros, lireEuros } from "../ui.js?v=3e8bddd9";
import { etatDe } from "./immobilier.js?v=3e8bddd9";

const vueFil = (p) => etatDe(p, "filCercle", { intention: null });

const jauge = (v) => `<span class="ce-jauge" aria-label="Lien ${v} sur 100"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${v >= 60 ? "var(--or)" : v >= 30 ? "var(--texte2)" : "var(--alerte)"}"></i></span>`;

function lignePersonne(x) {
  return `<button class="choix-radio ce-ligne" data-action="ouvrir" data-page="personne" data-p='${esc(JSON.stringify({ id: x.personne || x.id }))}' data-proche="${esc(x.id)}">
    <span class="ce-initiale">${esc(x.prenom.slice(0, 1))}</span>
    <span class="ce-corps"><b>${esc(x.prenom)}${x.doubleVie ? ' <span class="ce-marque alerte" aria-label="Ta double vie">secret</span>' : x.attirance != null ? ' <span class="ce-marque" aria-label="Tu la séduis">♥</span>' : ""}${x.anniversaire ? " 🎁" : ""}${x.nonLu ? ' <i class="ce-point"></i>' : ""}</b><span class="aide">${esc(x.detail)}</span></span>
    ${jauge(x.lien)}<span class="chevron" aria-hidden="true">›</span></button>`;
}

function rendreCercle(d) {
  const t = d.t;
  if (!t) return `${entetePousse("Entourage")}<div class="vide">Ton entourage se vit pendant une saison.</div>`;
  if (!t.permis) return `${entetePousse("Entourage")}<div class="vide">Le couple et l'entourage sont coupés dans ce monde.</div>`;
  // D456 : la scène et la double vie sont sur « Ma vie amoureuse » et la fiche ; garder en ami, sur la fiche d'une rencontre.
  return `${entetePousse("Entourage")}<div class="pz-pile">
    ${t.conditions.length ? `<p class="aide alerte">À tenir : ${esc(t.conditions.join(", ").toLowerCase())}.</p>` : ""}
    ${t.groupes.map((g) => carte(`<div class="libelle">${esc(g.nom)}</div>${g.personnes.map(lignePersonne).join("")}`, { classe: "pz-carte" })).join("")}
    ${t.groupes.length ? "" : `<div class="vide">Personne pour l'instant. Tes amis arrivent avec la saison.</div>`}
  </div>`;
}

function rendreFil(d, ctx, p) {
  const f = d.t?.fil;
  if (!f) return `${entetePousse("Entourage")}<div class="vide">Cette personne n'est plus dans ton entourage.</div>`;
  const v = vueFil(p);
  const i = f.intentions.find((x) => x.id === v.intention);
  return `${entetePousse(`Parler à ${f.personne.prenom}`)}<div class="pz-pile">
    <p class="aide">${esc(f.personne.detail)}</p>
    <div class="ce-fil">${f.messages.length ? f.messages.slice(-20).map((m) => `<div class="ce-msg ${m.moi ? "moi" : ""}">${esc(m.texte)}</div>`).join("") : '<p class="aide">Pas encore de messages.</p>'}</div>
    <div class="libelle">Que veux-tu lui dire ?</div>
    <div class="mer-choix">${f.intentions.map((x) => petit(x.nom, "intention", { plein: x.id === v.intention, donnees: { id: x.id } })).join("")}</div>
    ${i ? `<div class="pz-pile" style="gap:6px">${i.cout ? `<p class="aide">Coûte ${montant(i.cout)}.</p>` : ""}
      <label class="ce-ecrire"><input type="text" id="ce-texte" maxlength="280" placeholder="Écris-lui… (ou prends une phrase)" autocomplete="off"></label>
      ${petit("Envoyer", "envoyerTexte", { plein: true })}
      ${i.phrases.map((ph, k) => `<button class="ce-phrase" data-action="phrase" data-k="${k}">${esc(ph)}</button>`).join("")}</div>` : ""}
    ${f.peutPreter ? carte(`<div class="rangee entre ce-preter"><div style="flex:1;min-width:0">${champEuros("ce-pret", { placeholder: `Prêter… (${deviseAffichage().symbole})` })}</div>${petit("Prêter", "preter")}</div>`, { classe: "pz-carte" }) : ""}
    ${f.associables?.length ? carte(`<div class="libelle">S'associer</div><p class="aide">${esc(f.personne.prenom)} entre au capital, aux conditions d'une levée de fonds.</p>${f.associables.map((b) => `<div class="rangee entre"><span><b>${esc(b.nom)}</b> <span class="aide">${b.part} % pour ${montant(b.montant)}</span></span>${petit("Lui céder", "associer", { donnees: { id: String(b.id) } })}</div>`).join("")}`, { classe: "pz-carte" }) : ""}
  </div>`;
}

const parler = async (ctx, p, d, phrase, texte) => {
  const v = vueFil(p);
  if (!v.intention) return;
  await ctx.decider("cercle", { parler: { proche: p.id, intention: v.intention, ...(phrase != null ? { phrase } : {}), ...(texte ? { texte } : {}) } });
};

export const pages = {
  cercle: {
    titre: "Entourage",
    css: "cercle",
    async donnees(ctx) { return { t: await ctx.tableau("cercle") }; },
    rendu: rendreCercle,
    actions: {},
  },
  // D456 : « Lui parler » (depuis la fiche d'un proche).
  filCercle: {
    titre: "Lui parler",
    css: "cercle",
    async donnees(ctx, p) { return { t: await ctx.tableau("cercle", { proche: p.id }) }; },
    rendu: rendreFil,
    actions: {
      intention(ctx, b, d, p) { const v = vueFil(p); v.intention = v.intention === b.dataset.id ? null : b.dataset.id; ctx.redessiner(); },
      phrase: (ctx, b, d, p) => parler(ctx, p, d, Number(b.dataset.k), null),
      envoyerTexte: (ctx, b, d, p) => { const t = document.getElementById("ce-texte")?.value?.trim(); if (t) return parler(ctx, p, d, null, t); },
      preter(ctx, b, d, p) {
        // D449 (CER-Q6) : le champ monétaire de partout (D437) : tapé dans la devise d'affichage, envoyé en centimes d'euro.
        const c = lireEuros("ce-pret");
        if (c != null && c > 0) return ctx.decider("cercle", { preter: { proche: p.id, montant: c } }, { succes: "Prêt envoyé" });
      },
      associer: (ctx, b, d, p) => ctx.decider("cercle", { associer: { proche: p.id, boite: Number(b.dataset.id) } }, { succes: "Un ami associé" }),
    },
  },
};
