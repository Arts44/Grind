// ══════════════════════════════════════════════════════════════════════
//  patcher(cible, html) — une mise à jour ciblée du DOM (lot A, inventaire § 5.4).
//
//  Au lieu de `cible.innerHTML = html` (tout recréer : le défilement d'un
//  carrousel, une feuille, le focus clavier, une saisie et les transitions
//  CSS se perdent), on compare l'arbre en place au nouveau HTML et on ne
//  touche que ce qui change. Un chiffre qui change ne coûte qu'un nœud
//  texte ; une perle, une pilule, un rail glissent par leur transition CSS.
//
//  Les règles :
//   - les enfants se reconnaissent par `data-cle` (ou `id`) quand ils en ont,
//     sinon par leur place et leur balise ;
//   - un élément `data-garder` (posé par du JS : la carte Leaflet…) n'est
//     jamais touché ni retiré ;
//   - un champ qui a le focus garde sa saisie ; un champ sans focus prend la
//     nouvelle valeur seulement si le HTML l'a changée (`value="…"`) ;
//   - un <details> garde l'état ouvert/fermé choisi par le joueur.
// ══════════════════════════════════════════════════════════════════════

const gabarit = document.createElement("template");

/** Remplace le contenu de `cible` par `html`, en ne touchant que les différences. */
export function patcher(cible, html) {
  if (!cible) return;
  gabarit.innerHTML = html;
  const neuf = gabarit.content;
  patcherEnfants(cible, neuf);
  gabarit.innerHTML = "";
}

/** Met à jour l'élément `ancien` (ses attributs et ses enfants) pour qu'il ressemble à l'élément `neuf`. */
export function patcherElement(ancien, neuf) {
  if (ancien.isEqualNode(neuf)) return;
  patcherAttributs(ancien, neuf);
  const balise = ancien.tagName;
  if (balise === "TEXTAREA") {
    if (ancien.defaultValue !== neuf.defaultValue) {
      ancien.defaultValue = neuf.defaultValue;
      if (document.activeElement !== ancien) ancien.value = neuf.defaultValue;
    }
    return;
  }
  patcherEnfants(ancien, neuf);
  if (balise === "SELECT" && document.activeElement !== ancien) {
    const choisie = neuf.querySelector("option[selected]");
    if (choisie && ancien.value !== choisie.value) ancien.value = choisie.value;
  }
}

const garde = (n) => n.nodeType === 1 && n.hasAttribute("data-garder");
const cle = (n) => (n.nodeType === 1 ? n.getAttribute("data-cle") ?? (n.id || null) : null);
const compatibles = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && a.namespaceURI === b.namespaceURI
  // Un champ ne change pas de genre en place (un texte ne devient pas une case à cocher).
  && (a.tagName !== "INPUT" || a.type === b.type)));

function patcherEnfants(ancien, neuf) {
  const parCle = new Map(), gardes = new Set();
  for (let n = ancien.firstChild; n; n = n.nextSibling) {
    const k = cle(n);
    if (k === null) continue;
    if (garde(n)) gardes.add(k); else parCle.set(k, n);
  }
  let curseur = ancien.firstChild;
  const avance = () => { while (curseur && garde(curseur)) curseur = curseur.nextSibling; };
  for (const nn of [...neuf.childNodes]) {
    avance();
    let m = null;
    const k = cle(nn);
    if (k !== null && gardes.has(k)) continue; // l'élément gardé tient déjà cette place
    if (k !== null) {
      m = parCle.get(k) ?? null;
      if (m && !compatibles(m, nn)) m = null;
      if (m) parCle.delete(k);
    } else if (curseur && cle(curseur) === null && compatibles(curseur, nn)) m = curseur;
    if (m) {
      if (m === curseur) curseur = curseur.nextSibling;
      else ancien.insertBefore(m, curseur);
      if (m.nodeType === 1) patcherElement(m, nn);
      else if (m.nodeValue !== nn.nodeValue) m.nodeValue = nn.nodeValue;
    } else {
      ancien.insertBefore(nn, curseur);
    }
  }
  // Ce qui reste après le curseur n'a pas d'équivalent dans le nouveau HTML.
  while (curseur) {
    const suivant = curseur.nextSibling;
    if (!garde(curseur)) curseur.remove();
    curseur = suivant;
  }
}

function patcherAttributs(ancien, neuf) {
  const champ = ancien.tagName === "INPUT";
  const actif = document.activeElement === ancien;
  for (const a of [...ancien.attributes]) {
    if (neuf.hasAttribute(a.name)) continue;
    if (a.name === "open" && ancien.tagName === "DETAILS") continue; // l'état choisi par le joueur
    ancien.removeAttribute(a.name);
    if (champ && a.name === "checked" && !actif) ancien.checked = false;
  }
  for (const a of neuf.attributes) {
    const avant = ancien.getAttribute(a.name);
    if (avant === a.value) continue;
    ancien.setAttribute(a.name, a.value);
    if (!champ || actif) continue;
    if (a.name === "value") ancien.value = a.value;
    else if (a.name === "checked") ancien.checked = true;
  }
}
