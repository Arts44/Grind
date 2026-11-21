// ══════════════════════════════════════════════════════════════════════
//  D391 « Vingt icônes » : l'icône de l'app choisie sur le web.
//
//  Les vingt icônes (Balance.saisons.icones, tableau « icones ») se
//  choisissent dans Personnaliser mon profil, comme sur l'iPhone. Ici, le
//  choix est gardé sur l'appareil (« grind.iconeApp » : le nom de fichier,
//  « cadran » par défaut) et devient le favicon de l'onglet, et l'icône
//  d'écran d'accueil (apple-touch-icon) pour un ajout fait après le choix.
//  Le manifeste reste celui du Cadran : un navigateur ne relit pas les
//  icônes d'une app déjà installée (il faudrait la réinstaller).
//  Les fichiers : icones/famille/<nom>.svg, -32.png, -180.png
//  (design/icone/famille/generer.py).
// ══════════════════════════════════════════════════════════════════════
export const CLE_ICONE = "grind.iconeApp";
export const ICONE_DEFAUT = "cadran";

/** Un nom de fichier sûr (lettres minuscules et chiffres), sinon le Cadran. */
const propre = (f) => (typeof f === "string" && /^[a-z0-9]{1,32}$/.test(f) ? f : ICONE_DEFAUT);

export function iconeChoisie() {
  try { return propre(localStorage.getItem(CLE_ICONE)); } catch { return ICONE_DEFAUT; }
}

/** Les adresses de l'icône (le Cadran garde celles du site, déjà en cache). */
export function adresses(fichier) {
  const f = propre(fichier);
  if (f === ICONE_DEFAUT) return { svg: "icone.svg", png32: "icones/icone-32.png", png180: "icones/icone-180.png" };
  const b = `icones/famille/${f}`;
  return { svg: `${b}.svg`, png32: `${b}-32.png`, png180: `${b}-180.png` };
}

function lien(selecteur, rel, attributs) {
  let l = document.head.querySelector(selecteur);
  if (!l) {
    l = document.createElement("link");
    l.rel = rel;
    for (const [k, v] of Object.entries(attributs)) l.setAttribute(k, v);
    document.head.append(l);
  }
  return l;
}

/** Pose l'icône sur l'onglet (SVG et PNG 32) et sur l'écran d'accueil (180). */
export function appliquerIcone(fichier = iconeChoisie()) {
  if (typeof document === "undefined") return;
  const a = adresses(fichier);
  lien('link[rel=icon][type="image/svg+xml"]', "icon", { type: "image/svg+xml" }).href = a.svg;
  lien('link[rel=icon][sizes="32x32"]', "icon", { type: "image/png", sizes: "32x32" }).href = a.png32;
  lien("link[rel=apple-touch-icon]", "apple-touch-icon", {}).href = a.png180;
}

/** Choisit une icône (son nom de fichier, « cadran » : celle de Grind). */
export function choisirIcone(fichier) {
  const f = propre(fichier);
  try {
    if (f === ICONE_DEFAUT) localStorage.removeItem(CLE_ICONE);
    else localStorage.setItem(CLE_ICONE, f);
  } catch {}
  appliquerIcone(f);
  return f;
}
