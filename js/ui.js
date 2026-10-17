// ══════════════════════════════════════════════════════════════════════
//  Les briques des écrans (D186, lot A) — l'équivalent web de Rente/Design :
//  carte, ligne de carte, boutons, segment, rail, chiffre héros (qui roule),
//  courbe, pastille d'icône, interrupteur, champ fichier, photo avec repli,
//  confirmation, bouton d'aide, colonnes du grand écran. Chaque fonction
//  rend du HTML (sauf `confirmer`, qui ouvre une feuille et rend une
//  promesse) ; les textes venus d'ailleurs passent par `esc`. Les styles
//  sont dans css/composants.css ; la convention dans docs/web-design.md.
//
//  Navigation dans le HTML :
//    data-action="ouvrir" data-page="banque.credit" data-p='{"id":3}'  → pousse une page
//    data-action="retour"                                               → revient
//    data-action="<nom>"                                                → action de la page (ou globale)
// ══════════════════════════════════════════════════════════════════════
import { esc, montant, variation } from "./format.js";
export { esc };
export { patcher } from "./patcher.js";

// MARK: Icônes (traits simples, 24 × 24, couleur du texte)

const I = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icones = {
  focus: I('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>'),
  banque: I('<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>'),
  accueil: I('<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>'),
  marches: I('<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>'),
  actifs: I('<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="15" width="18" height="4" rx="1.5"/><circle cx="7.5" cy="19.5" r="1.5"/><circle cx="16.5" cy="19.5" r="1.5"/>'),
  retour: I('<path d="M15 5l-7 7 7 7"/>'),
  chevron: I('<path d="M9 5l7 7-7 7"/>'),
  fermer: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  cloche: I('<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>'),
  personne: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  amis: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>'),
  fleches: I('<path d="M7 7h12l-3-3M17 17H5l3 3"/>'),
  boite: I('<path d="M3 9.5 5 4h14l2 5.5M3 9.5h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 20.5v-6h6v6"/>'),
  maison: I('<path d="M4 20V9l8-5 8 5v11zM10 20v-5h4v5"/>'),
  voiture: I('<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="15" width="18" height="4" rx="1.5"/>'),
  carte: I('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>'),
  masque: I('<path d="M4 6c3 1 13 1 16 0v5a8 8 0 0 1-16 0zM8.5 11h2M13.5 11h2M9.5 15.5c1.5 1 3.5 1 5 0"/>'),
  coeur: I('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
  cible: I('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/>'),
  camembert: I('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
  activite: I('<path d="M4 7h16M4 12h10M4 17h13"/>'),
  reglages: I('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
  info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  sablier: I('<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>'),
  euro: I('<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4.5 10.5h9M4.5 13.5h9"/>'),
  bouclier: I('<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/>'),
  document: I('<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"/>'),
  verrou: I('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>'),
  image: I('<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 8.5"/>'),
  alerte: I('<path d="M12 4 2.8 19.5h18.4zM12 10v4.5M12 17v.3"/>'),
  question: I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.2-2.5 3.8M12 17v.3"/>'),
  son: I('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
};

// MARK: Mise en page

/** En-tête d'un onglet racine : grand titre (30, 700), sous-titre, et des boutons à droite. */
export const enteteRacine = (titre, { sous = "", droite = "" } = {}) => `
  <header class="entete-racine">
    <div><h1 class="titre-onglet">${esc(titre)}</h1>${sous ? `<div class="sous">${sous}</div>` : ""}</div>
    ${droite ? `<div class="rangee">${droite}</div>` : ""}
  </header>`;

/** En-tête d'une page poussée : retour, titre (20, 600), et des boutons à droite. */
export const entetePousse = (titre, droite = "") => `
  <header class="entete-pousse">
    <button class="rond" data-action="retour" aria-label="Retour">${icones.retour}</button>
    <h1>${esc(titre)}</h1>${droite}
  </header>`;

export const section = (t) => `<div class="section">${esc(t)}</div>`;

/** Carte : `contenu` tel quel ; `pad` ajoute la marge intérieure de 16. */
export const carte = (contenu, { pad = false, classe = "", attrs = "" } = {}) =>
  `<div class="carte ${pad ? "pad" : ""} ${classe}" ${attrs}>${contenu}</div>`;

/**
 * Une ligne de carte : pastille, titre, détail, valeur à droite. Avec `page`, la ligne ouvre cette page ;
 * avec `action`, elle déclenche l'action (et `donnees` part en data-*).
 */
export function ligne({ titre, detail = "", valeur = "", couleurValeur = "", icone = "", teinte = "", page = "", p = null, action = "", donnees = {}, desactive = false }) {
  const pastille = icone ? `<span class="pastille" style="--c:${teinte || "var(--accent)"}">${icones[icone] ?? icone}</span>` : "";
  const v = valeur !== "" ? `<span class="valeur ${couleurValeur}">${valeur}</span>` : "";
  const ch = page || action ? `<span class="chevron">${icones.chevron}</span>` : "";
  const corps = `${pastille}<span class="ligne-corps"><div class="titre">${titre}</div>${detail ? `<div class="detail">${detail}</div>` : ""}</span>${v}${ch}`;
  if (page) return `<button class="ligne" data-action="ouvrir" data-page="${esc(page)}" ${p ? `data-p='${esc(JSON.stringify(p))}'` : ""} ${desactive ? "disabled" : ""}>${corps}</button>`;
  if (action) return `<button class="ligne" data-action="${esc(action)}" ${attrsDonnees(donnees)} ${desactive ? "disabled" : ""}>${corps}</button>`;
  return `<div class="ligne">${corps}</div>`;
}

/** Libellé à gauche, valeur à droite (LigneCarte). */
export const ligneValeur = (titre, valeur, couleur = "") => ligne({ titre: esc(titre), valeur, couleurValeur: couleur });

export const attrsDonnees = (d) => Object.entries(d).map(([k, v]) => `data-${k}="${esc(typeof v === "string" ? v : JSON.stringify(v))}"`).join(" ");

// MARK: Boutons

/** Bouton : `genre` primaire (accent), teinte (catégorie), secondaire (verre), discret, danger. */
export function bouton(texte, action, { genre = "primaire", teinte = "", donnees = {}, desactive = false, page = "", p = null, style = "" } = {}) {
  const classe = genre === "primaire" ? "bouton" : `bouton ${genre}`;
  // `style` : hérité d'anciennes pages ; une page nouvelle passe une classe de sa zone, jamais un style.
  const st = teinte || style ? ` style="${teinte ? `--c:${teinte};` : ""}${style}"` : "";
  if (page) return `<button class="${classe}"${st} data-action="ouvrir" data-page="${esc(page)}" ${p ? `data-p='${esc(JSON.stringify(p))}'` : ""} ${desactive ? "disabled" : ""}>${texte}</button>`;
  return `<button class="${classe}"${st} data-action="${esc(action)}" ${attrsDonnees(donnees)} ${desactive ? "disabled" : ""}>${texte}</button>`;
}

export const petit = (texte, action, { plein = false, teinte = "", donnees = {}, desactive = false } = {}) =>
  `<button class="petit ${plein ? "plein" : ""} ${teinte ? "teinte" : ""}"${teinte ? ` style="--c:${teinte}"` : ""} data-action="${esc(action)}" ${attrsDonnees(donnees)} ${desactive ? "disabled" : ""}>${texte}</button>`;

/**
 * Segment : 2 à 5 choix exclusifs ; chaque bouton déclenche `action` avec data-valeur.
 * Il défile quand il déborde (un libellé n'est jamais coupé) ; `defilant` (d'office au-delà de quatre
 * choix) ajoute le fondu des bords, et app.js garde le choix visible.
 */
export const segment = (options, choisie, action, { defilant = options.length > 4 } = {}) => `
  <div class="segment ${defilant ? "defilant" : ""}" role="group">${options.map(([v, t]) =>
    `<button data-action="${esc(action)}" data-valeur="${esc(v)}" aria-pressed="${v === choisie}">${esc(t)}</button>`).join("")}</div>`;

/** Une rangée de pilules de filtre qui défile (`choisie` enfoncée). */
export const pilules = (options, choisie, action) => `
  <div class="filtres" role="group">${options.map(([v, t]) =>
    `<button class="filtre" data-action="${esc(action)}" data-valeur="${esc(v)}" aria-pressed="${v === choisie}">${esc(t)}</button>`).join("")}</div>`;

// MARK: Valeurs

export const rail = (part, teinte = "var(--accent)", hauteur = 8) =>
  `<div class="rail" style="--c:${teinte};--h:${hauteur}px"><i style="--part:${Math.max(0, Math.min(100, Math.round((part ?? 0) * 100)))}%"></i></div>`;

/** La variation colorée : « +1 250 € » en vert, « −80 € » en orange. */
export const variationColoree = (c) => `<span class="chiffres ${c > 0 ? "gain" : c < 0 ? "perte" : "t2"}">${variation(c)}</span>`;

/** Le chiffre héros : dégradé, chasse fixe, et ses chiffres roulent quand il change (numericText). */
export const heros = (c, taille = 38) => `<div class="heros-chiffre" style="--taille:${taille}px">${chiffreAnime(c)}</div>`;

/**
 * Un chiffre qui roule : chaque chiffre est une colonne 0–9 qui glisse à sa place quand la valeur change
 * (la page est mise à jour par patcher : le nouveau `--n` déclenche la transition CSS).
 * `texte` : un texte déjà formaté (« 12,4 % », « 3 h 20 ») ; sinon `c`, des centimes, en montant.
 * Le texte reste lisible tel quel (textContent, copier-coller, lecteurs d'écran) : seule sa peinture roule.
 */
export function chiffreAnime(c, { texte = null, centimes = false, classe = "" } = {}) {
  const t = texte ?? montant(c, { centimes });
  const n = t.length;
  const morceaux = [...t].map((x, i) => {
    const cle = `r${n - i}`; // compté depuis la droite : les unités restent les unités quand un chiffre s'ajoute
    return /\d/.test(x) ? `<span class="rc" data-cle="${cle}" style="--n:${x}">${x}</span>` : `<span class="rs" data-cle="${cle}">${esc(x)}</span>`;
  }).join("");
  return `<span class="roule ${classe}" aria-label="${esc(t)}">${morceaux}</span>`;
}

/** Courbe aire : hauteurs entre 0 et 1 (et abscisses entre 0 et 1, facultatives), comme CourbeAiree. */
export function courbe(h, x = null, { hauteur = 70, couleur = "var(--courbe)" } = {}) {
  if (!h?.length) return "";
  const n = h.length;
  const pts = h.map((v, i) => `${(((x?.[i] ?? (n > 1 ? i / (n - 1) : 0.5))) * 300).toFixed(1)},${(hauteur - 4 - v * (hauteur - 10)).toFixed(1)}`);
  // Un identifiant stable pour une même forme : patcher ne réécrit pas le dégradé à chaque rafraîchissement.
  const id = `g${hauteur}-${pts.length}-${Math.round(h.reduce((s, v) => s + v, 0) * 1000)}`;
  return `<svg class="courbe-svg" viewBox="0 0 300 ${hauteur}" preserveAspectRatio="none" style="--h:${hauteur}px" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e4ea" stop-opacity=".22"/><stop offset="1" stop-color="#e4e4ea" stop-opacity="0"/></linearGradient></defs>
    <polygon points="0,${hauteur} ${pts.join(" ")} 300,${hauteur}" fill="url(#${id})"/>
    <polyline points="${pts.join(" ")}" fill="none" stroke="${couleur}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

/** Une courbe à partir de valeurs brutes (cours, patrimoine) : normalise entre min et max. */
export function courbeValeurs(valeurs, options = {}) {
  if (!valeurs?.length) return "";
  const min = Math.min(...valeurs), max = Math.max(...valeurs);
  return courbe(valeurs.map((v) => (max > min ? (v - min) / (max - min) : 0.5)), null, options);
}

export const vide = (texte) => `<div class="vide">${texte}</div>`;
export const bandeau = (texte, teinte = "var(--alerte)") => `<div class="bandeau" style="--c:${teinte}"><div>${texte}</div></div>`;

/** Champ montant en euros (la valeur se lit avec lireEuros). */
export const champEuros = (id, { valeur = "", placeholder = "0 €", etiquette = "" } = {}) => `
  ${etiquette ? `<label class="etiquette" for="${id}">${esc(etiquette)}</label>` : ""}
  <input class="champ" id="${id}" inputmode="decimal" autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(valeur)}">`;

/** « 1 250,50 » → 125050 centimes ; null si illisible. */
export function lireEuros(id) {
  const t = (document.getElementById(id)?.value ?? "").replace(/\s|€/g, "").replace(",", ".");
  if (!t) return null;
  const x = Number(t);
  return Number.isFinite(x) ? Math.round(x * 100) : null;
}

// MARK: Contrôles

/** Interrupteur (Toggle) : une ligne de carte qui bascule ; `action` reçoit les data-* de `donnees`. */
export const interrupteur = ({ titre, detail = "", actif = false, action, donnees = {}, desactive = false }) => `
  <button class="interrupteur" role="switch" aria-checked="${!!actif}" data-action="${esc(action)}" ${attrsDonnees(donnees)} ${desactive ? "disabled" : ""}>
    <span class="ligne-corps"><div class="titre">${esc(titre)}</div>${detail ? `<div class="detail">${esc(detail)}</div>` : ""}</span>
    <span class="bascule" aria-hidden="true"></span>
  </button>`;

/**
 * Champ fichier en français (jamais « Choose File ») : une zone à toucher ; le nom du fichier choisi
 * s'affiche (app.js écoute le changement). Le fichier se lit par `document.getElementById(id).files[0]` ;
 * `saisie` : l'action de la page appelée au choix (data-saisie, comme un champ de saisie).
 */
export const champFichier = (id, { accept = "image/*", etiquette = "Joindre une capture", aide = "PNG ou JPEG", bouton: texteBouton = "Choisir", saisie = "" } = {}) => `
  <label class="champ-fichier" data-aide="${esc(aide)}">
    <span class="cf-icone" aria-hidden="true">${icones.image}</span>
    <span class="cf-texte"><span class="cf-nom" data-vide="${esc(etiquette)}">${esc(etiquette)}</span><span class="cf-aide">${esc(aide)}</span></span>
    <span class="petit cf-bouton" aria-hidden="true">${esc(texteBouton)}</span>
    <input type="file" id="${esc(id)}" accept="${esc(accept)}" aria-label="${esc(etiquette)}"${saisie ? ` data-saisie="${esc(saisie)}"` : ""}>
  </label>`;

/** Le choix d'un champ fichier : son nom à la place de l'invitation (appelé par app.js à chaque changement). */
export function majChampFichier(input) {
  const zone = input.closest(".champ-fichier");
  if (!zone) return;
  const f = input.files?.[0];
  const nom = zone.querySelector(".cf-nom"), aide = zone.querySelector(".cf-aide");
  zone.classList.toggle("rempli", !!f);
  nom.textContent = f ? f.name : nom.dataset.vide;
  aide.textContent = f ? `${Math.max(1, Math.round(f.size / 1024))} Kio · toucher pour changer` : zone.dataset.aide;
}

/**
 * Une photo chargée à la demande, avec son repli (une illustration, une silhouette, un pictogramme)
 * tant qu'elle n'est pas là, ou si elle manque. `ratio` : « 4 / 3 », « 16 / 9 », « 1 ».
 */
export const photo = ({ src, alt = "", ratio = "4 / 3", repli = icones.image, classe = "", ajuste = "" }) => `
  <span class="photo ${classe}" style="--ratio:${ratio}${ajuste ? `;--ajuste:${ajuste}` : ""}">
    <span class="photo-repli" aria-hidden="true">${repli}</span>
    ${src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" data-photo>` : ""}
  </span>`;

/**
 * Le « ? » d'un écran (BoutonAide) : ouvre les fiches de ce sujet (aideContextuelle, posée par js/aide.js,
 * lot C), sinon le guide. Un seul pour tout le web (le dessin du lot C) ; `grand` : la taille des ronds voisins.
 */
const POINT_AIDE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 17v.3"/></svg>';
export const boutonAide = (sujet, { libelle = "", grand = false } = {}) =>
  `<button class="rond${grand ? " grand" : ""} aide-bouton" data-action="aide" data-sujet="${esc(sujet)}" aria-label="${esc(libelle || `Comment ça marche : ${aideContextuelle.titre?.(sujet) ?? "aide"}`)}" title="Comment ça marche">${POINT_AIDE}</button>`;

/**
 * Qui ouvre l'aide d'un sujet. Le lot C y pose sa fonction (les fiches de Tutoriels) :
 *   aideContextuelle.ouvrir = (ctx, sujet) => ctx.feuille({ … }) ; aideContextuelle.titre = (sujet) => « l'accueil »
 * Sans elle, le « ? » ouvre le guide.
 */
export const aideContextuelle = { ouvrir: null, titre: null };

// MARK: Grand écran

/** Deux colonnes au palier moyen et large (une seule sur téléphone) : pour un `renduLarge`. */
export const colonnes = (gauche, droite, { classe = "" } = {}) =>
  `<div class="colonnes ${classe}"><div class="colonne-pile">${gauche}</div><div class="colonne-pile">${droite}</div></div>`;

// MARK: Confirmation (FeuilleConfirmation)

/**
 * Une question, deux boutons, à la place de `confirm()` ; rend une promesse (vrai si confirmé).
 *   if (!(await confirmer({ titre: "Arrêter la session ?", oui: "Arrêter", danger: true }))) return;
 */
export function confirmer({ titre, texte = "", oui = "Confirmer", non = "Annuler", danger = false, icone = danger ? "alerte" : "question" }) {
  return new Promise((rendre) => {
    const d = document.createElement("dialog");
    d.className = `confirmation ${danger ? "danger" : ""}`;
    d.setAttribute("aria-labelledby", "confirmation-titre");
    d.innerHTML = `<div class="cf-symbole" aria-hidden="true">${icones[icone] ?? icone}</div>
      <h2 id="confirmation-titre">${esc(titre)}</h2>${texte ? `<p>${esc(texte)}</p>` : ""}
      <div class="cf-boutons"><button class="bouton" data-reponse="oui">${esc(oui)}</button><button class="bouton discret" data-reponse="non">${esc(non)}</button></div>`;
    let reponse = false;
    d.addEventListener("click", (e) => {
      e.stopPropagation(); // la feuille de confirmation n'est pas une page : aucune action de page
      const b = e.target.closest("[data-reponse]");
      if (b) { reponse = b.dataset.reponse === "oui"; d.close(); } else if (e.target === d) d.close();
    });
    d.addEventListener("close", () => { d.remove(); rendre(reponse); });
    document.body.append(d);
    d.showModal();
    d.querySelector("[data-reponse=oui]").focus({ preventScroll: true });
  });
}

/** Les catégories d'action de l'iPhone, par nom. */
export const teintes = { argent: "var(--argent)", equipe: "var(--equipe)", vente: "var(--vente)", controles: "var(--controles)", image: "var(--image)", danger: "var(--c-danger)", grandir: "var(--grandir)" };
