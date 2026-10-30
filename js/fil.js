// ══════════════════════════════════════════════════════════════════════
//  Le fil du monde sans perte ni doublon (D218), côté web : les mêmes
//  règles que RenteCore/…/EnLigne/FilDuMonde.swift (testées sous Linux)
//  et que l'iPhone (ModeleFil.swift). Pur : rien ici ne touche au réseau,
//  ../enligne.js fait le transport ; web/tests/fil-synchro.mjs l'essaie.
//
//    aPublier    les lignes du journal qui partent au fil, repérées par
//                leur id (plus par une date avancée même en cas d'échec)
//    fusionner   le fil connu et ce qui arrive, par id : rien de perdu,
//                pas de doublon, une réponse en retard n'efface rien
//    curseur     le plus grand id reçu : on demande la suite (fil_depuis)
//    EtatSynchro réessayer de moins en moins vite, et le dire discrètement
// ══════════════════════════════════════════════════════════════════════

/** Les lignes du journal qui partent au fil, et leur icône (FilDuMonde.faits). */
export const FAITS = [["Création de ", "storefront.fill"], ["Achat : ", "house.fill"], ["Achat neuf : ", "car.fill"],
  ["Achat d'occasion : ", "car.fill"], ["Capital ouvert", "chart.pie.fill"], ["Tu prends le contrôle", "crown.fill"],
  ["Prêt personnel accordé", "banknote.fill"], ["Prêt reçu", "banknote.fill"]];
export const TAILLE_MAX = 300;
export const PUBLIES_MAX = 600;
export const REPECHAGE_MAX = 86_400_000; // ms : un ancien repère par date ne repêche pas plus d'un jour

export const icone = (x) => FAITS.find(([p]) => String(x?.titre ?? "").startsWith(p))?.[1] ?? null;
export const texte = (x, pseudo) => `${pseudo} : ${x.titre}${x.detail ? `, ${x.detail}` : ""}`.slice(0, 140);

/**
 * Les lignes à publier, dans l'ordre du journal (le plus ancien d'abord). `journal` : des lignes
 * { id, date (ms), titre, detail, partie? } ; `partie` : la partie ouverte (« privee », « publique ») ;
 * `seulePartie` : aucune autre partie en cours ; `depuis` (ms) : l'arrivée dans ce monde ; `deja` : un Set d'ids.
 */
export function aPublier(journal, { partie, debutPartie = 0, seulePartie = true, depuis, deja }) {
  return [...journal].sort((a, b) => a.date - b.date).filter((x) => {
    if (!x?.id || deja.has(x.id) || !(x.date >= depuis) || !icone(x)) return false;
    if (x.partie) return x.partie === partie;
    return seulePartie && x.date >= debutPartie;
  });
}

/** Les ids déjà publiés, plus les nouveaux : sans doublon, les plus récents gardés. */
export function publies(deja, nouveaux) {
  const vus = new Set();
  const tout = [...deja, ...nouveaux].reverse().filter((x) => !vus.has(x) && vus.add(x)).reverse();
  return tout.slice(-PUBLIES_MAX);
}

/** Le fil connu et ce qui arrive, par id : le plus récent d'abord. */
export function fusionner(actuel, recus) {
  const parId = new Map();
  for (const f of actuel ?? []) parId.set(Number(f.id), f);
  for (const f of recus ?? []) if (f && f.id != null) parId.set(Number(f.id), { ...f, id: Number(f.id), reactions: f.reactions ?? [] });
  return [...parId.values()].sort((a, b) => b.id - a.id).slice(0, TAILLE_MAX);
}

export const curseur = (fil) => (fil ?? []).reduce((m, f) => Math.max(m, Number(f.id) || 0), 0);

/** Où en est une synchronisation répétée (EtatSynchro.swift). */
export class EtatSynchro {
  static intervalle = 8_000;
  static intervalleMax = 60_000;
  static fraicheur = 90_000;
  constructor() { this.derniereReussite = null; this.echecs = 0; this.erreur = null; }
  reussie(maintenant) { this.derniereReussite = maintenant; this.echecs = 0; this.erreur = null; }
  echouee(message) { this.echecs += 1; this.erreur = message; }
  get horsLigne() { return this.echecs > 0; }
  get delai() {
    return this.echecs ? Math.min(EtatSynchro.intervalleMax, EtatSynchro.intervalle * 2 ** Math.min(this.echecs, 6)) : EtatSynchro.intervalle;
  }
  libelle(maintenant) {
    const ilYA = this.derniereReussite == null ? null : duree(maintenant - this.derniereReussite);
    if (this.horsLigne) return ilYA ? `Hors ligne · dernière synchro il y a ${ilYA}` : "Hors ligne · nouvel essai dans un instant";
    if (this.derniereReussite == null) return "Synchronisation…";
    return maintenant - this.derniereReussite > EtatSynchro.fraicheur ? `Dernière synchro il y a ${ilYA}` : null;
  }
}

function duree(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86_400)} j`;
}
