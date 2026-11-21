// ══════════════════════════════════════════════════════════════════════
//  Les longues listes et les filtres des lieux (RNT-309, RNT-310) — la
//  copie exacte de RenteCore/Jeu/ListesLongues.swift et FiltresLieux.swift
//  (les mêmes cas sont vérifiés par ListesEtLieuxTests et zone-listes.mjs).
//
//  Chercher sans accents ni majuscules, trier (valeur, nom, récents),
//  l'aperçu des trois plus précieux, les sections ; le filtre des lieux
//  de la ville (catégories, ouvert maintenant, prix, à pied), gardé dans
//  localStorage sous la même clé que l'iPhone (« carte.filtres »).
// ══════════════════════════════════════════════════════════════════════

import { nomExclu } from "./filtres-listes.js?v=3e8bddd9"; // D453 : le nom d'une catégorie exclue
export const SEUIL_OUTILS = 5;
export const TAILLE_APERCU = 3;
/** RNT-388 : la liste compacte d'office à partir de six, sauf choix gardé du joueur. */
export const SEUIL_COMPACT = 6;
export const compactParDefaut = (n) => n >= SEUIL_COMPACT;

export const TRIS = [
  { id: "valeur", nom: "Valeur", croissant: false },
  { id: "nom", nom: "Nom", croissant: true },
  { id: "recent", nom: "Récents", croissant: false },
];

export const plier = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("fr");

/** Chaque mot cherché doit se trouver dans l'un des textes. */
export function correspond(requete, textes) {
  const mots = plier(requete).split(" ").filter(Boolean);
  if (!mots.length) return true;
  const tout = textes.map(plier).join(" ");
  return mots.every((m) => tout.includes(m));
}

export const filtrer = (liste, requete, textes) => (String(requete ?? "").trim() ? liste.filter((x) => correspond(requete, textes(x))) : liste);

/** Stable ; à égalité, le nom départage, puis l'ordre d'origine. `rang` : plus grand = plus récent. */
export function trier(liste, tri, { croissant = null, valeur = () => 0, nom = () => "", rang = () => 0 } = {}) {
  const monte = croissant ?? (tri === "nom");
  const noms = liste.map((x) => plier(nom(x)));
  const cle = (i) => (tri === "valeur" ? valeur(liste[i]) : tri === "recent" ? rang(liste[i]) : 0);
  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  return liste.map((_, i) => i).sort((a, b) => {
    if (tri !== "nom") {
      const x = cle(a), y = cle(b);
      if (x !== y) return monte ? x - y : y - x;
      return cmp(noms[a], noms[b]) || a - b;
    }
    return (monte ? cmp(noms[a], noms[b]) : cmp(noms[b], noms[a])) || a - b;
  }).map((i) => liste[i]);
}

export const apercu = (liste, valeur, n = TAILLE_APERCU) =>
  liste.map((_, i) => i).sort((a, b) => (valeur(liste[b]) - valeur(liste[a])) || a - b).slice(0, Math.max(0, n)).map((i) => liste[i]);
export const reste = (total, n = TAILLE_APERCU) => Math.max(0, total - n);

/** Rangée en sections : l'ordre donné, puis les autres par ordre d'apparition. */
export function sections(liste, cle, ordre = []) {
  const par = new Map();
  for (const x of liste) { const k = cle(x); if (!par.has(k)) par.set(k, []); par.get(k).push(x); }
  const vues = [...par.keys()];
  return [...ordre.filter((k) => par.has(k)), ...vues.filter((k) => !ordre.includes(k))].map((id) => ({ id, elements: par.get(id) }));
}

// MARK: Les billets d'un trajet, les moyens de paiement

export const TRIS_DEVIS = [{ id: "rapide", nom: "Plus rapide" }, { id: "prix", nom: "Moins cher" }, { id: "nom", nom: "Nom" }];
/** RNT-388 : tes véhicules qui ne peuvent pas partir, rangés derrière « Voir les N autres ». */
export const vehiculeEmpeche = (d) => d.vehicule != null && d.refus != null;
export const separerDevis = (devis) => ({ visibles: devis.filter((d) => !vehiculeEmpeche(d)), autres: devis.filter(vehiculeEmpeche) });
export const texteAutres = (n) => (n === 1 ? "Voir l'autre" : `Voir les ${n} autres`);
/**
 * Bug 1.17 (véhicules identiques), la règle de MoteurEconomie.regrouperExemplaires pour les devis calculés ici
 * (le moteur ne répond pas) : les exemplaires d'un même modèle (même moyen, même nom) font un billet, le plus rapide
 * puis le moins cher des libres (le premier s'ils sont tous pris), qui dit « 2 sur 3 libres ».
 */
export function regrouperExemplaires(devis) {
  const cle = (d) => (d.vehicule == null ? null : `${d.moyen}|${d.nom}|${d.embarque ?? ""}|${d.dernier ?? ""}`);
  const membres = new Map();
  for (const d of devis) { const k = cle(d); if (k != null) { if (!membres.has(k)) membres.set(k, []); membres.get(k).push(d); } }
  if (![...membres.values()].some((l) => l.length > 1)) return devis;
  const faits = new Set();
  const sortie = [];
  for (const d of devis) {
    const k = cle(d);
    const tous = k == null ? null : membres.get(k);
    if (!tous || tous.length < 2) { sortie.push(d); continue; }
    if (faits.has(k)) continue;
    faits.add(k);
    const libres = tous.filter((x) => !x.refus);
    const rang = (x) => [x.minutes ?? 0, x.cout ?? 0, x.vehicule ?? 0];
    const avant = (a, b) => { const x = rang(a), y = rang(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i]; return false; };
    const choisi = libres.reduce((m, x) => (m == null || avant(x, m) ? x : m), null) ?? tous[0];
    const x = { ...choisi, exemplaires: tous.length, libres: libres.length };
    if (x.refus) x.refus = `Aucun de tes ${tous.length} n'est libre : ${x.refus.charAt(0).toLowerCase()}${x.refus.slice(1)}`;
    else { const t = texteLibres(libres.length, tous.length); x.note = x.note ? `${t} ${x.note}` : t; }
    sortie.push(x);
  }
  return sortie;
}
/** « 1 sur 2 libre », « 2 sur 3 libres » (MoteurEconomie.texteLibres). */
export const texteLibres = (libres, n) => `${libres} sur ${n} libre${libres > 1 ? "s" : ""}.`;
export const sectionDevis = (d) => (d.vehicule == null ? "transports" : "vehicules");
export const ORDRE_DEVIS = ["transports", "vehicules"];
export const nomSectionDevis = (id) => (id === "vehicules" ? "Tes véhicules" : "Transports");
export function trierDevis(devis, tri) {
  return devis.map((_, i) => i).sort((a, b) => {
    const x = devis[a], y = devis[b];
    if (!x.refus !== !y.refus) return x.refus ? 1 : -1;
    if (tri === "rapide" && (x.minutes ?? 0) !== (y.minutes ?? 0)) return (x.minutes ?? 0) - (y.minutes ?? 0);
    if (tri === "prix" && (x.cout ?? 0) !== (y.cout ?? 0)) return (x.cout ?? 0) - (y.cout ?? 0);
    const nx = plier(x.nom), ny = plier(y.nom);
    return nx < ny ? -1 : nx > ny ? 1 : a - b;
  }).map((i) => devis[i]);
}

export const sectionMoyen = (m) => (m.peutPayer ? "possibles" : "impossibles");
export const ORDRE_MOYENS = ["possibles", "impossibles"];
export const nomSectionMoyens = (id, recevoir) => (id === "possibles" ? (recevoir ? "Peuvent recevoir" : "Peuvent payer") : (recevoir ? "Plafond atteint" : "Gelés ou trop justes"));
export const trierMoyens = (moyens, tri) => trier(moyens, tri === "recent" ? "valeur" : tri, { valeur: (m) => m.solde, nom: (m) => m.nom, rang: (m) => m.cle });

// MARK: Ce qui est gardé (les mêmes clés que l'iPhone)

export function lire(cle, defaut) { try { return localStorage.getItem(cle) ?? defaut; } catch { return defaut; } }
export function ecrire(cle, v) { try { localStorage.setItem(cle, v); } catch {} }
export const lireReplis = (cle) => new Set(String(lire(cle, "")).split(",").filter(Boolean));
export function basculerRepli(cle, id) {
  const s = lireReplis(cle);
  s.has(id) ? s.delete(id) : s.add(id);
  ecrire(cle, [...s].sort().join(","));
}

// MARK: Les filtres des lieux (RNT-309)

export const CATEGORIES_LIEUX = [ // D351 : la copie de InfosLieux.categories (plus fines)
  { id: "manger", nom: "Manger", icone: "fork.knife" },
  { id: "sortir", nom: "Sortir, rencontrer", icone: "wineglass.fill" },
  { id: "hotels", nom: "Hôtels et casinos", icone: "bed.double.fill" },
  { id: "banque", nom: "Banque", icone: "building.columns.fill" },
  { id: "sante", nom: "Santé", icone: "cross.case.fill" },
  { id: "boutiques", nom: "Boutiques", icone: "bag.fill" },
  { id: "transports", nom: "Transports", icone: "tram.fill" },
  { id: "miens", nom: "Mes biens", icone: "house.fill" },
  { id: "boites", nom: "Mes boîtes", icone: "storefront.fill" },
  { id: "prison", nom: "Prison", icone: "lock.shield.fill" },
  { id: "services", nom: "Services", icone: "wrench.and.screwdriver.fill" },
  { id: "joueurs", nom: "Joueurs", icone: "person.2.fill" },
];
export const CHOIX_MINUTES = [5, 10, 20];
export const texteGamme = (g) => "€".repeat(Math.max(1, Math.min(4, g)));

const CLE_FILTRE = "carte.filtres";
export function nouveauFiltre(x = {}) {
  return {
    categories: Array.isArray(x.categories) ? x.categories.filter((c) => typeof c === "string") : [],
    ouverts: x.ouverts === true,
    gammeMax: Number.isInteger(x.gammeMax) ? x.gammeMax : null,
    minutesMax: Number.isInteger(x.minutesMax) ? x.minutesMax : null,
  };
}
export function lireFiltre() { try { return nouveauFiltre(JSON.parse(lire(CLE_FILTRE, "{}"))); } catch { return nouveauFiltre(); } }
export function ecrireFiltre(f) {
  const x = { categories: f.categories, ouverts: f.ouverts };
  if (f.gammeMax != null) x.gammeMax = f.gammeMax;
  if (f.minutesMax != null) x.minutesMax = f.minutesMax;
  ecrire(CLE_FILTRE, JSON.stringify(x));
}
export const nombreFiltres = (f) => (f.categories.length ? 1 : 0) + (f.ouverts ? 1 : 0) + (f.gammeMax == null ? 0 : 1) + (f.minutesMax == null ? 0 : 1);
/** D453 : un appui fait tourner la catégorie : vide → gardée → exclue (« !manger ») → vide (FiltreLieux.basculer). */
export function basculerCategorie(f, id) {
  const sans = f.categories.filter((c) => c !== id && c !== "!" + id);
  return { ...f, categories: f.categories.includes(id) ? [...sans, "!" + id] : f.categories.includes("!" + id) ? sans : [...sans, id] };
}
export const etatCategorie = (f, id) => (f.categories.includes("!" + id) ? "exclue" : f.categories.includes(id) ? "incluse" : "");

/** FiltreLieux.garde : l'endroit où l'on est reste toujours. */
export function garde(f, { categorie, ouvert = null, gamme = null, minutesAPied = null, ici = false }) {
  if (ici) return true;
  if (f.categories.includes("!" + categorie)) return false; // D453 : une catégorie exclue
  const gardees = f.categories.filter((c) => !c.startsWith("!"));
  if (gardees.length && !gardees.includes(categorie)) return false;
  if (f.ouverts && ouvert === false) return false;
  if (f.gammeMax != null && gamme != null && gamme > f.gammeMax) return false; // RNT-388 : sans prix, gardé
  if (f.minutesMax != null && (minutesAPied == null || minutesAPied > f.minutesMax)) return false;
  return true;
}
export const appliquer = (f, lieux) => lieux.filter((l) => garde(f, l));

export function resume(f) {
  const l = [];
  const noms = f.categories.map((c) => {
    const n = CATEGORIES_LIEUX.find((x) => x.id === c.replace(/^!/, ""))?.nom;
    return n && c.startsWith("!") ? nomExclu(n) : n; // D453 : « Pas pour manger »
  }).filter(Boolean);
  if (noms.length) l.push(noms.join(", "));
  if (f.ouverts) l.push("ouvert maintenant");
  if (f.gammeMax != null) l.push(`${texteGamme(f.gammeMax)} au plus`);
  if (f.minutesMax != null) l.push(`${f.minutesMax} min à pied au plus`);
  if (!l.length) return "Tous les lieux";
  l[0] = l[0][0].toLocaleUpperCase("fr") + l[0].slice(1);
  return l.join(", ");
}
