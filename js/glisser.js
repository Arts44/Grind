// ══════════════════════════════════════════════════════════════════════
//  Glisser à la souris (RNT-411, D323).
//
//  Au doigt ou au pavé tactile, une rangée qui défile de côté (les calques
//  de la carte, les filtres, les pastilles, les carrousels) se pousse toute
//  seule. À la souris, rien : pas de barre de défilement (elles sont
//  cachées), et la molette ne défile que de haut en bas.
//
//  Ici, pour toute rangée « overflow-x: auto » de l'app, sans la nommer :
//   - bouton gauche enfoncé, la souris tire la rangée ; passé 5 px, c'est
//     un glissé, et le clic qui suit est avalé (la pastille sous la souris
//     ne se déclenche pas) ; en dessous, c'est un clic comme avant ;
//   - la molette verticale fait défiler la rangée de côté tant qu'elle peut
//     encore avancer ; au bout, la page reprend la molette.
//
//  Le doigt et le stylet ne passent pas par ici (pointerType « mouse »
//  seulement) : leur défilement natif reste tel quel.
// ══════════════════════════════════════════════════════════════════════

const SEUIL = 5;

/** La rangée qui défile de côté sous `el` (elle déborde, et son style le permet), sinon null. */
export function rangeeDefilante(el) {
  for (let n = el instanceof Element ? el : el?.parentElement; n && n !== document.body; n = n.parentElement) {
    if (n.scrollWidth - n.clientWidth < 2) continue;
    const s = getComputedStyle(n).overflowX;
    if (s === "auto" || s === "scroll") return n;
  }
  return null;
}

let geste = null; // { rangee, x, depart, id, glisse }
let avaler = false;

function debut(e) {
  if (e.pointerType !== "mouse" || e.button !== 0) return;
  // Une saisie, un curseur : la souris y sélectionne ou règle, elle ne tire pas la rangée.
  if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
  const rangee = rangeeDefilante(e.target);
  if (!rangee) return;
  geste = { rangee, x: e.clientX, depart: rangee.scrollLeft, id: e.pointerId, glisse: false };
}

function bouge(e) {
  if (!geste || e.pointerId !== geste.id) return;
  if (!(e.buttons & 1)) { fin(e); return; } // le bouton a été lâché hors de la fenêtre
  const dx = e.clientX - geste.x;
  if (!geste.glisse) {
    if (Math.abs(dx) < SEUIL) return;
    geste.glisse = true;
    geste.rangee.classList.add("glisse"); // pas d'aimant ni de sélection de texte pendant le glissé
    try { geste.rangee.setPointerCapture(geste.id); } catch {}
  }
  geste.rangee.scrollLeft = geste.depart - dx;
  e.preventDefault();
}

function fin(e) {
  if (!geste || (e.pointerId != null && e.pointerId !== geste.id)) return;
  const g = geste;
  geste = null;
  if (!g.glisse) return;
  g.rangee.classList.remove("glisse");
  try { g.rangee.releasePointerCapture(g.id); } catch {}
  // Le clic que le navigateur envoie après ce glissé ne compte pas ; s'il n'en envoie pas, on oublie au tour suivant.
  avaler = true;
  setTimeout(() => { avaler = false; }, 0);
}

function clic(e) {
  if (!avaler) return;
  avaler = false;
  e.preventDefault();
  e.stopPropagation();
}

function molette(e) {
  if (e.ctrlKey || e.shiftKey || !e.deltaY || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return; // un pavé tactile défile déjà de côté
  const rangee = rangeeDefilante(e.target);
  if (!rangee) return;
  // Une rangée qui défile aussi de haut en bas garde sa molette.
  if (rangee.scrollHeight - rangee.clientHeight > 1 && /auto|scroll/.test(getComputedStyle(rangee).overflowY)) return;
  const max = rangee.scrollWidth - rangee.clientWidth;
  const pas = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * rangee.clientWidth : e.deltaY;
  if ((pas < 0 && rangee.scrollLeft <= 0) || (pas > 0 && rangee.scrollLeft >= max - 1)) return; // au bout : la page défile
  rangee.scrollLeft += pas;
  e.preventDefault();
}

/** Branche le glissé à la souris sur tout le document (une fois, au démarrage de l'app). */
export function brancherGlisser(doc = document) {
  doc.addEventListener("pointerdown", debut);
  doc.addEventListener("pointermove", bouge);
  doc.addEventListener("pointerup", fin);
  doc.addEventListener("pointercancel", fin);
  doc.addEventListener("click", clic, true);
  doc.addEventListener("wheel", molette, { passive: false });
  // L'image ou le lien sous la souris ne part pas en glisser-déposer à la place de la rangée.
  doc.addEventListener("dragstart", (e) => { if (geste || rangeeDefilante(e.target)) e.preventDefault(); });
}
