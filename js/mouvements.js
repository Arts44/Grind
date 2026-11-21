// ══════════════════════════════════════════════════════════════════════
//  mouvements.js — D345 : ce que les composants animés de ui.js font en JS
//  (l'équivalent de Rente/Design/Mouvements.swift). Branché une fois par
//  app.js (brancherMouvements), il écoute tout le document :
//
//   - les menus « Anchor Pop » et le « + » qui devient panneau : des
//     popovers placés contre leur bouton, qui en jaillissent (CSS) et s'y
//     referment au choix ;
//   - le chiffre qui glisse (.vg) : quand patcher change sa valeur, le
//     nouveau arrive du côté qui l'a fait changer, l'ancien part de l'autre ;
//     le compteur se pousse d'un pixel vers le côté touché ;
//   - le bouton principal qui répond : le cercle d'attente si l'action
//     dure, puis la coche quand elle rend `true`.
//  « Moins d'animations » (et le mode économie) : rien ne glisse.
// ══════════════════════════════════════════════════════════════════════
import { iconeAnimee } from "./ui.js?v=3e8bddd9";

const calme = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("economie");

/** Place un popover contre son bouton (le menu sous lui, aligné à droite ; le panneau sur lui, coin haut droit). */
function placer(pop, bouton) {
  const r = bouton.getBoundingClientRect(), l = pop.offsetWidth || 220, h = pop.offsetHeight || 200;
  const vw = document.documentElement.clientWidth, vh = innerHeight;
  if (pop.classList.contains("panneau-plus")) {
    const x = Math.min(Math.max(16, r.right - l), vw - l - 16);
    pop.style.setProperty("--mx", `${x}px`);
    pop.style.setProperty("--my", `${Math.max(8, r.top)}px`);
    return;
  }
  const gauche = bouton.dataset.aligner === "gauche";
  let x = gauche ? r.left : r.right - Math.max(l, r.width);
  x = Math.min(Math.max(16, x), vw - l - 16);
  const dessous = r.bottom + 6 + h <= vh - 12 || r.top < h + 18;
  const y = dessous ? r.bottom + 6 : r.top - 6 - h;
  pop.style.setProperty("--mx", `${x}px`);
  pop.style.setProperty("--my", `${Math.max(8, y)}px`);
  pop.style.setProperty("--mw", `${Math.round(r.width)}px`);
  pop.style.setProperty("--mo", `${dessous ? "top" : "bottom"} ${gauche ? "left" : "right"}`);
}

function brancherPopovers() {
  // beforetoggle ne remonte pas : on l'écoute en capture.
  document.addEventListener("beforetoggle", (ev) => {
    const pop = ev.target;
    if (!pop.matches?.(".menu-liste, .panneau-plus")) return;
    const bouton = document.querySelector(`[popovertarget="${CSS.escape(pop.id)}"]:not([popovertargetaction="hide"])`);
    if (ev.newState === "open" && bouton) {
      // Mesuré ouvert une première fois (hors écran), puis placé avant que l'animation ne parte.
      placer(pop, bouton);
      requestAnimationFrame(() => placer(pop, bouton));
    }
    bouton?.setAttribute("aria-expanded", String(ev.newState === "open"));
  }, true);
  // Un choix fait rentrer le menu (ou le panneau) dans son bouton ; l'action de la page part quand même.
  document.addEventListener("click", (ev) => {
    const choix = ev.target.closest?.(".menu-choix, .panneau-plus .ligne");
    if (!choix) return;
    const pop = choix.closest("[popover]");
    // Le choix se lit tout de suite sur le bouton (une page qui ne redessine que sa liste le garde).
    if (choix.matches(".menu-choix") && pop) {
      for (const c of pop.querySelectorAll(".menu-choix")) c.setAttribute("aria-checked", String(c === choix));
      const t = document.querySelector(`[popovertarget="${CSS.escape(pop.id)}"] .mb-texte`);
      if (t) t.textContent = `${t.textContent.split(" : ")[0]} : ${choix.textContent.trim()}`;
    }
    try { pop?.hidePopover(); } catch { /* déjà fermé */ }
  }, true);
  // Faire défiler la page ferme un menu ouvert (il ne flotte pas loin de son bouton).
  addEventListener("scroll", () => {
    for (const p of document.querySelectorAll(".menu-liste:popover-open")) { try { p.hidePopover(); } catch { /* */ } }
  }, { passive: true });
}

/** « n|texte » (data-vg) : la valeur et ce qui s'affiche. */
const lireVg = (v) => { const i = String(v ?? "").indexOf("|"); return i < 0 ? { n: Number(v), t: String(v ?? "") } : { n: Number(v.slice(0, i)), t: v.slice(i + 1) }; };

function glisser(vg, avant) {
  const apres = lireVg(vg.dataset.vg);
  if (!Number.isFinite(avant.n) || avant.n === apres.n || calme()) return;
  const sens = apres.n > avant.n ? "monte" : "descend";
  // L'ancien chiffre est peint par ::after (attr(data-avant)) : le texte de la page reste le seul chiffre.
  vg.dataset.avant = avant.t;
  vg.classList.remove("vg-monte", "vg-descend");
  void vg.offsetWidth; // relance l'animation si l'on touche deux fois de suite
  vg.classList.add(`vg-${sens}`);
  clearTimeout(vg.__vgFin);
  vg.__vgFin = setTimeout(() => { vg.classList.remove("vg-monte", "vg-descend"); delete vg.dataset.avant; }, 320);
  vg.closest(".compteur")?.animate([{ transform: "none" }, { transform: `translateX(${sens === "monte" ? 2 : -2}px)` }, { transform: "none" }], { duration: 260, easing: "ease-out" });
}

function brancherValeursGlissees() {
  new MutationObserver((liste) => {
    for (const m of liste) if (m.type === "attributes" && m.target.classList?.contains("vg")) glisser(m.target, lireVg(m.oldValue));
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-vg"], attributeOldValue: true });
}

/**
 * Le bouton principal qui répond (vidéo 7) : au-delà de 120 ms, son libellé laisse la place au cercle d'attente ;
 * quand l'action rend `true`, une coche, 700 ms. Rend `fin(ok)`, à appeler quand l'action est finie.
 */
export function suivreBouton(b) {
  if (!b?.matches?.(".bouton:not(.discret)")) return { fin() {} };
  const minuteur = setTimeout(() => {
    if (!b.isConnected) return;
    b.classList.add("en-cours");
    b.setAttribute("aria-busy", "true");
    b.insertAdjacentHTML("beforeend", `<span class="bt-attente">${iconeAnimee("chargement", { taille: 20, teinte: "currentColor" })}</span>`);
  }, 120);
  return {
    fin(ok) {
      clearTimeout(minuteur);
      b.classList.remove("en-cours");
      b.removeAttribute("aria-busy");
      b.querySelector(":scope > .bt-attente")?.remove();
      if (!ok || !b.isConnected) return;
      b.classList.add("reussi");
      b.insertAdjacentHTML("beforeend", '<span class="bt-coche" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>');
      setTimeout(() => { b.classList.remove("reussi"); b.querySelector(":scope > .bt-coche")?.remove(); }, 700);
    },
  };
}

let branche = false;
export function brancherMouvements() {
  if (branche) return;
  branche = true;
  brancherPopovers();
  brancherValeursGlissees();
}
