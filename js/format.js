// Formats d'affichage, à la belge, comme dans l'app iPhone.

const euros = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurosCentimes = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

/** Centimes d'euro → « 6 800 € », toujours en euros (D437 : la console d'administration, un compte en euros). */
export const enEuros = (c, { centimes = false } = {}) => (centimes ? eurosCentimes : euros).format((c ?? 0) / 100);

// D437 (Arthur, 19/11 21:13 : « pas juste l'accueil, partout ») : la devise d'affichage du joueur, reçue du moteur
// avec l'état (« devise » : symbole, taux pour 1 €). Le moteur compte en euros ; seul l'affichage convertit.
let affichage = { symbole: "€", taux: 1 };
export function reglerDevise(d) {
  affichage = d && d.taux > 0 && d.symbole ? { symbole: d.symbole, taux: d.taux } : { symbole: "€", taux: 1 };
}
/** La devise d'affichage en cours (la console d'administration, elle, écrit avec enEuros). */
export const deviseAffichage = () => affichage;
const estEuro = (a) => a.symbole === "€" && a.taux === 1;
/** D437 : des centimes d'euro dans la devise d'affichage (centimes de la devise). */
export const enAffichage = (c) => { const a = deviseAffichage(); return estEuro(a) ? (c ?? 0) : Math.round((c ?? 0) * a.taux); };
/** D437 : des centimes de la devise d'affichage (une saisie) ramenés en centimes d'euro. */
export const depuisAffichage = (c) => { const a = deviseAffichage(); return estEuro(a) ? (c ?? 0) : Math.round((c ?? 0) / a.taux); };

/** D437 : une saisie convertie qui dépasse le maximum d'un écart d'arrondi (moins d'une unité de la devise) vaut le maximum. */
export const auPlus = (v, maximum) => {
  if (maximum == null || v == null || v <= maximum) return v;
  return v - maximum <= Math.ceil(100 / deviseAffichage().taux) ? maximum : v;
};

/** Centimes d'euro → « 6 800 € » ; D437 : dans la devise d'affichage (« 116 280 000 Rp »). */
export const montant = (c, { centimes = false } = {}) => {
  const a = deviseAffichage();
  return estEuro(a) ? enEuros(c, { centimes }) : enDevise(enAffichage(c), a.symbole, { centimes });
};

/** D377 : centimes d'une devise → « 12 400 AED », « 1 250 $ » (comme Montant.texte(_:symbole:) sur l'iPhone). */
export function enDevise(c, symbole = "€", { centimes = false } = {}) {
  if (symbole === "€") return enEuros(c, { centimes });
  const v = Math.abs(c ?? 0);
  const unites = centimes ? v : Math.round(v / 100);
  const signe = unites > 0 && (c ?? 0) < 0 ? "\u2212" : "";
  const entier = centimes ? Math.floor(v / 100) : unites;
  const groupes = String(entier).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return signe + groupes + (centimes ? "," + String(v % 100).padStart(2, "0") : "") + "\u00A0" + symbole;
}

/** D377 : des euros (centimes) dans la devise d'un tableau de devises (taux du jour, unités pour 1 €). */
export const versDevise = (c, taux = 1) => Math.round((c ?? 0) * taux);

/** Centimes → « +1 250 € » / « −80 € ». */
export const variation = (c) => {
  const s = montant(Math.abs(c ?? 0));
  if (Math.round(Math.abs(enAffichage(c)) / 100) === 0) return s; // « 0 € », sans signe, comme Montant.swift (D437 : la valeur affichée)
  return (c > 0 ? "+" : "−") + s;
};

/** Minutes → « 3 h 20 », « 45 min ». */
export function duree(minutes) {
  const m = Math.max(0, Math.round(minutes ?? 0));
  if (m < 60) return `${m} min`;
  return m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

/** Secondes → « 24:05 ». */
export function chrono(secondes) {
  const s = Math.max(0, Math.ceil(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const pourcent = (x, decimales = 0) => `${(x * 100).toFixed(decimales).replace(".", ",")} %`;

/** Échapper un texte venu d'ailleurs (pseudo, message) avant de le poser dans le HTML. */
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
