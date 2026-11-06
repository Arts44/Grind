// Formats d'affichage, à la belge, comme dans l'app iPhone.

const euros = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurosCentimes = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

/** Centimes → « 6 800 € ». */
export const montant = (c, { centimes = false } = {}) => (centimes ? eurosCentimes : euros).format((c ?? 0) / 100);

/** Centimes → « +1 250 € » / « −80 € ». */
export const variation = (c) => {
  const s = montant(Math.abs(c ?? 0));
  if (Math.round(Math.abs(c ?? 0) / 100) === 0) return s; // « 0 € », sans signe, comme Montant.swift
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
