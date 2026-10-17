// ══════════════════════════════════════════════════════════════════════
//  Le train de vie, c'est le réel (RNT-190, D207) : EcranTrainDeVie.swift.
//
//  Plus de niveau à choisir : le bilan de ce que la vie coûte vraiment
//  cette semaine, poste par poste, face à la semaine dernière, et le
//  niveau de vie face au standing attendu. La tuile de l'accueil
//  (tuileTrainDeVie), la carte de la Banque (carteBilanVie) et la page
//  des abonnements lisent les tableaux du moteur « trainDeVie » et
//  « abonnements » (TableauTrainDeVie.swift), comme l'iPhone.
// ══════════════════════════════════════════════════════════════════════
import { montant as montantBrut, esc } from "../format.js";
import { entetePousse, carte, bouton, petit, teintes } from "../ui.js";

/** « −13 643 € » avec le vrai signe moins, comme Montant.texte. */
const montant = (c) => montantBrut(c).replace("-", "−");
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

/** Les symboles de l'iPhone (CategorieVie.icone, les abonnements), en traits simples. */
const SF = {
  "house.fill": I('<path d="M4 20V9l8-5 8 5v11zM10 20v-5h4v5"/>'),
  "fork.knife": I('<path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M17 3c-2 1-3 4-3 7h3v11"/>'),
  "wineglass.fill": I('<path d="M7 3h10l-1 6a4 4 0 0 1-8 0zM12 13v7M8.5 21h7"/>'),
  "wrench.and.screwdriver.fill": I('<path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>'),
  "creditcard.fill": I('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h4"/>'),
  "figure.walk": I('<circle cx="13" cy="4.5" r="1.8"/><path d="M11 21l2-6-2.5-3 1-4 3 3h3M10.5 8 7 10v3M13 15l3 6"/>'),
  "iphone": I('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
  "play.tv.fill": I('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10.5 8.5v5l4-2.5zM8 21h8"/>'),
  "dumbbell.fill": I('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>'),
  "tram.fill": I('<rect x="6" y="4" width="12" height="13" rx="3"/><path d="M6 11h12M9 20l1.5-3M15 20l-1.5-3M9.5 14h.01M14.5 14h.01M10 2h4"/>'),
  // RNT-197 : les nouveaux abonnements et le réseau.
  "iphone.radiowaves.left.and.right": I('<rect x="8.5" y="3" width="7" height="18" rx="2"/><path d="M5.5 8.5a5 5 0 0 0 0 7M18.5 8.5a5 5 0 0 1 0 7M3 6.5a8.5 8.5 0 0 0 0 11M21 6.5a8.5 8.5 0 0 1 0 11"/>'),
  "globe": I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9M12 3C9.5 5.7 8.2 8.7 8.2 12s1.3 6.3 3.8 9"/>'),
  "train.side.front.car": I('<rect x="4" y="4" width="16" height="12" rx="3"/><path d="M4 10h16M8 20l2-4M16 20l-2-4M8 13h.01M16 13h.01"/>'),
  "airplane": I('<path d="M10.5 3.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V9l7 4v2l-7-2v5l2 1.5V21l-3.5-1L8.5 21v-1.5l2-1.5v-5l-7 2v-2l7-4z"/>'),
  "cross.case.fill": I('<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M12 10.5v6M9 13.5h6"/>'),
  "newspaper.fill": I('<path d="M4 5h13v14a1 1 0 0 0 1 1H6a2 2 0 0 1-2-2zM17 9h3v9a2 2 0 0 1-2 2M7.5 8.5h6M7.5 12h6M7.5 15.5h4"/>'),
  "bell.fill": I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>'),
  "creditcard.and.123": I('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9.5h18M6.5 15h2M10.5 15h2M14.5 15h3"/>'),
  "wifi": I('<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 15.8a5 5 0 0 1 6.8 0M12 19.5h.01"/>'),
  "antenna.radiowaves.left.and.right": I('<path d="M12 11v10M12 11a1.5 1.5 0 1 0 0-.01M8.5 7.5a5 5 0 0 0 0 7M15.5 7.5a5 5 0 0 1 0 7M5.5 4.5a9 9 0 0 0 0 13M18.5 4.5a9 9 0 0 1 0 13"/>'),
  "watch.analog": I('<circle cx="12" cy="12" r="5.5"/><path d="M12 9.5V12l1.6 1.2M9 6.8 9.6 3h4.8l.6 3.8M9 17.2l.6 3.8h4.8l.6-3.8"/>'),
  "car.side.fill": I('<path d="M3 15.5V13l2.5-1 2.5-3.5h7l3 3.5 3 .8v2.7z"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>'),
  "wifi.slash": I('<path d="M2.5 9a14 14 0 0 1 6-3.3M13.5 5.6A14 14 0 0 1 21.5 9M5.5 12.5a9.5 9.5 0 0 1 4-2.3M8.6 15.8a5 5 0 0 1 6.8 0M12 19.5h.01M3 3l18 18"/>'),
};
const sf = (nom) => SF[nom] ?? SF["creditcard.fill"];
const pastille = (icone, teinte) => `<span class="pastille" style="--c:${teinte}">${sf(icone)}</span>`;

/** La couleur et le mot de la position face au standing (couleurStanding, motStanding). */
const couleur = (t) => (t.aLaRue ? "alerte" : { "en dessous": "perte", "au-dessus": "gain", "au-dessus de tes moyens": "alerte" }[t.position] ?? "t2");
const mot = (t) => { const s = t.aLaRue ? "à la rue" : t.position; return s.charAt(0).toUpperCase() + s.slice(1); };
const teintePoste = (id) => (id === "logement" ? teintes.grandir : id === "sorties" ? teintes.image : teintes.argent);

// MARK: - La tuile de l'accueil (TuileTrainDeVie)

export function tuileTrainDeVie(t) {
  if (!t) return "";
  return `<button class="carte tuile-vie" data-action="ouvrir" data-page="trainDeVie"
      aria-label="Train de vie : ${esc(montant(t.total))} cette semaine, ${esc(t.logement)}, ${esc(mot(t))}">
    ${pastille(t.aLaRue ? "figure.walk" : "house.fill", t.aLaRue ? teintes.danger : teintes.grandir)}
    <span class="tv-texte"><span class="t">Train de vie</span>
      <span class="v"><span class="chiffres">${montant(t.total)}</span> <span class="tv-sous">cette semaine</span></span>
      <span class="tv-lieu ${t.aLaRue ? "alerte" : ""}">${esc(t.logement)} · ${esc(mot(t).toLowerCase())}</span></span>
    <span class="chevron" style="width:14px;color:var(--texte3)">${I('<path d="M9 5l7 7-7 7"/>')}</span>
  </button>`;
}

// MARK: - La carte de la Banque (CarteBilanVie)

export function carteBilanVie(t) {
  if (!t) return "";
  const postes = t.postes.filter((p) => p.semaine > 0 || p.id === "logement");
  return `<button class="carte bilan-vie" data-action="ouvrir" data-page="trainDeVie">
    <div class="rangee entre" style="align-items:flex-start"><span style="min-width:0;text-align:left"><div class="libelle">${esc(t.logement)}</div>
      <div class="aide">${esc(t.logementDetail)}</div></span><span style="width:14px;color:var(--texte3);flex:none">${I('<path d="M9 5l7 7-7 7"/>')}</span></div>
    <div class="filet" style="margin:10px 0"></div>
    ${postes.map((p) => `<div class="rangee entre bv-ligne"><span class="t2">${esc(p.nom)}</span><span class="chiffres">${montant(p.semaine)}</span></div>`).join("")}
    <div class="rangee entre" style="margin-top:6px"><span style="font-size:15px;font-weight:600">Cette semaine</span><span class="chiffres" style="font-size:17px">${montant(t.total)}</span></div>
    <div class="${couleur(t)}" style="font-size:12px;font-weight:500;margin-top:6px;text-align:left">${esc(mot(t))}${t.totalPrecedent != null ? ` · la semaine dernière, ${montant(t.totalPrecedent)}` : ""}</div>
  </button>`;
}

// MARK: - La barre du standing

function jaugeStanding(t) {
  const [bas, haut] = t.zoneNeutre;
  return `<div style="position:relative;height:30px" role="img" aria-label="Niveau de vie par rapport au standing attendu : ${esc(mot(t))}">
    <div style="position:absolute;left:0;right:0;top:11px;height:8px;border-radius:99px;background:var(--puce2)"></div>
    <div style="position:absolute;top:11px;height:8px;border-radius:99px;background:var(--accent);opacity:.35;left:${bas * 100}%;width:${(haut - bas) * 100}%"></div>
    <div style="position:absolute;top:11px;height:8px;border-radius:99px;background:var(--alerte);opacity:.3;left:${t.zoneExces * 100}%;right:0"></div>
    <div id="vie-curseur" style="position:absolute;top:2px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:var(--texte);border:4px solid var(--fond);
      left:${Math.min(100, Math.max(0, t.curseur * 100))}%;transition:left .35s cubic-bezier(.34,1.56,.64,1)"></div>
  </div>`;
}

function postes(t) {
  return carte(t.postes.map((p) => `<div class="ligne" data-poste="${esc(p.id)}">
      ${pastille(p.icone, teintePoste(p.id))}
      <span style="min-width:0;flex:1"><div class="titre">${esc(p.nom)}</div><div class="detail">${esc(p.detail)}</div></span>
      <span style="text-align:right"><div class="chiffres" style="font-size:15px">${montant(p.semaine)}</div>
        ${p.aVenir > 0 ? `<div style="font-size:11px;font-weight:500;color:var(--texte3)">dimanche</div>`
          : p.precedente != null ? `<div style="font-size:11px;font-weight:500;color:var(--texte3)">avant : ${montant(p.precedente)}</div>` : ""}</span>
    </div>`).join(""));
}

function standing(t) {
  return carte(`
    <div class="rangee entre"><span class="libelle">Par rapport à ton standing</span><span class="aide">attendu ${montant(t.attendu)}</span></div>
    <div class="rangee entre" style="margin-top:12px"><span class="t2" style="font-size:14px">Ton niveau de vie</span><span class="chiffres" style="font-size:15px">${montant(t.niveau)}</span></div>
    <div style="margin:12px 0">${jaugeStanding(t)}</div>
    <div class="${couleur(t)}" style="font-size:13px;font-weight:600">${esc(mot(t))}</div>
    <div style="font-size:15px;font-weight:600;margin-top:6px" id="vie-effet">${esc(t.effet)}</div>
    ${t.dernierDimanche ? `<div class="aide" style="margin-top:8px">${esc(t.dernierDimanche)}</div>` : ""}
    <div class="aide" style="margin-top:8px">${esc(t.conseil)}</div>`, { attrs: 'style="padding:18px 16px"' });
}

// MARK: - Le réseau (RNT-197)

/** Où l'on capte : le wifi, le forfait, ou rien (EtatReseau). Aussi dans Amis et discussion. */
export function carteReseau(r, { compact = false } = {}) {
  if (!r || !r.texte) return "";
  const icone = r.wifi ? "wifi" : r.mobile ? "antenna.radiowaves.left.and.right" : "wifi.slash";
  const teinte = r.wifi || r.mobile ? teintes.argent : teintes.danger;
  return `<div class="carte reseau ${r.discussions ? "" : "sans"}" id="reseau" style="padding:14px 16px">
    <div class="rangee" style="gap:12px;align-items:center">${pastille(icone, teinte)}
      <span style="min-width:0;flex:1"><div class="titre" style="font-size:15px;font-weight:600">${esc(r.texte)}</div>
      ${compact && r.discussions ? "" : `<div class="aide">${esc(r.detail)}</div>`}</span></div></div>`;
}

// MARK: - Les pages

export const pages = {
  trainDeVie: {
    titre: "Train de vie",
    css: "trainvie", // RNT-210 : css/pages/trainvie.css (repris d'anciens.css)
    async donnees(ctx) { return { t: await ctx.tableau("trainDeVie") }; },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Train de vie")}<div class="vide" style="padding:80px 40px 0;font-size:15px">Le train de vie apparaît avec ta première saison.</div>`;
      return `
      ${entetePousse("Train de vie")}
      <div class="pile" style="gap:20px;padding-top:10px">
        <div style="text-align:center;display:grid;gap:6px">
          <div style="font-size:15px;color:var(--texte2)">${t.aLaRue ? "Sans logement" : t.logementLoue ? "Ton logement, loué" : "Ton logement, à toi"}</div>
          <div id="vie-logement" style="font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.15;${t.aLaRue ? "color:var(--alerte)" : ""}">${esc(t.logement)}</div>
          <div class="aide">${esc(t.logementDetail)}</div>
          <div class="chiffres" id="vie-total" style="font-size:48px;line-height:1.1;margin-top:6px">${montant(t.total)}</div>
          <div style="font-size:14px;color:var(--texte2)">${t.totalPrecedent != null ? `cette semaine · la semaine dernière, ${montant(t.totalPrecedent)}` : "dépensé pour vivre cette semaine"}</div>
        </div>
        ${postes(t)}
        ${standing(t)}
        <div class="pile" style="gap:10px">
          ${bouton(t.abonnements.length ? `Tes abonnements (${t.abonnements.length})` : "Prendre un abonnement", "", { genre: "secondaire", page: "abonnements" })}
          ${bouton(t.aLaRue ? "Trouver un logement" : "Déménager", "", { genre: "secondaire", page: "monde" })}
        </div>
        <p class="aide" style="text-align:center;max-width:320px;margin:0 auto">Ton train de vie, c'est ce que tu dépenses vraiment : le loyer ou les charges de ton logement, tes repas, tes sorties, l'entretien de tes véhicules et tes abonnements. Le dimanche, ton niveau de vie de la semaine (la valeur de ton logement, ce que tu as dépensé, le prestige de tes véhicules et montres) est comparé à ton standing.</p>
      </div>`;
    },
  },

  abonnements: {
    titre: "Abonnements",
    async donnees(ctx) { return { t: await ctx.tableau("abonnements") }; },
    rendu(d) {
      const t = d.t;
      if (!t) return `${entetePousse("Abonnements")}<div class="vide" style="padding:80px 40px 0;font-size:15px">Les abonnements se prennent pendant une saison.</div>`;
      const ligneAbo = (l) => `<div class="ligne" data-abonnement="${esc(l.id)}">
            ${pastille(l.icone, l.pris ? teintes.argent : teintes.controles)}
            <span style="min-width:0;flex:1"><div class="titre">${esc(l.nom)}${l.pris ? ` <span class="abo-actif">Actif</span>` : ""}</div><div class="detail">${esc(l.effet)}</div>
              <div class="chiffres" style="font-size:12px;color:var(--texte3);letter-spacing:0">${montant(l.prix)} par semaine${l.remplace ? ` · remplace ${esc(l.remplace)}` : ""}</div></span>
            ${petit(l.action, l.pris ? "resilier" : "prendre", { plein: !l.pris, donnees: { id: l.id, nom: l.nom } })}
          </div>`;
      return `
      ${entetePousse("Abonnements")}
      <div class="pile" style="gap:18px;padding-top:10px">
        <div style="text-align:center;display:grid;gap:4px">
          <div class="chiffres" id="abo-total" style="font-size:40px;line-height:1.1">${montant(t.total)}</div>
          <div style="font-size:14px;color:var(--texte2)">par semaine, à ${esc(t.ville)}</div>
        </div>
        ${carteReseau(t.reseau)}
        ${t.rubriques.map((r) => `<div data-rubrique="${esc(r.id)}"><div class="section" style="margin-top:0">${esc(r.nom)}</div>
          ${carte(r.lignes.map(ligneAbo).join(""))}
          ${r.note ? `<p class="aide" style="margin:8px 4px 0">${esc(r.note)}</p>` : ""}</div>`).join("")}
        ${t.ventePrivee ? carte(`<div class="ligne" id="vente-privee">${pastille(t.ventePrivee.sorte === "montre" ? "watch.analog" : "car.side.fill", teintes.image)}
            <span style="min-width:0;flex:1"><div class="titre">Vente privée : ${esc(t.ventePrivee.nom)}</div><div class="detail">${esc(t.ventePrivee.texte)}</div></span>
            <span class="chiffres" style="font-size:15px">${montant(t.ventePrivee.prix)}</span></div>`) : ""}
        <div id="abo-semaine">${carte(`<div class="libelle">Cette semaine, tes abonnements ont servi</div>
          ${t.semaine.length ? `<ul class="abo-servis">${t.semaine.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<div class="aide" style="margin-top:6px">Rien encore cette semaine.</div>`}
          ${t.economies > 0 ? `<div class="gain" style="font-size:13px;font-weight:600;margin-top:6px">${montant(t.economies)} économisés</div>` : ""}
          ${t.precedente.length ? `<div class="aide" style="margin-top:6px">La semaine dernière : ${esc(t.precedente.join(", "))}</div>` : ""}`, { attrs: 'style="padding:16px"' })}</div>
        <p class="aide" style="text-align:center;max-width:320px;margin:0 auto">${esc(t.note)}</p>
      </div>`;
    },
    actions: {
      prendre: (ctx, b) => ctx.decider("vie", { prendreAbonnement: { id: b.dataset.id } }, { succes: `${b.dataset.nom} : c'est parti` }),
      resilier: (ctx, b) => ctx.decider("vie", { resilierAbonnement: { id: b.dataset.id } }, { succes: `${b.dataset.nom} résilié` }),
    },
  },
};
