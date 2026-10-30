// ══════════════════════════════════════════════════════════════════════
//  Les sons et les vibrations (Rente/Design/Sons.swift, RNT-102, lot A).
//
//  Les sept sons de l'iPhone (web/sons/<nom>.wav, synthétisés par
//  docs/sons/<nom>.py : aucun son emprunté), joués par Web Audio, et la
//  vibration qui va avec chacun (`navigator.vibrate`, Android ; l'iPhone
//  et le Mac l'ignorent). Quel son pour quel moment : le moteur décide
//  (`sons.observer`, SuiviAmbiance), app.js appelle `jouerSon(nom)`.
//
//  Deux interrupteurs, dans Réglages (blocReglagesSons) : « Sons » et
//  « Vibrations », gardés dans le navigateur (les clés de l'iPhone).
// ══════════════════════════════════════════════════════════════════════
import { interrupteur, carte, section } from "./ui.js";

export const SONS = ["tic", "piece", "achat", "ching", "tampon", "alerte", "succes"];
const CLE_SONS = "reglages.sons", CLE_VIBRATIONS = "reglages.vibrations";

const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const coupe = (v) => v === "0" || v === "false";
export const sonsActifs = () => !coupe(lire(CLE_SONS));
export const vibrationsActives = () => !coupe(lire(CLE_VIBRATIONS));

/** Les sons quotidiens restent en retrait ; les grands moments, un peu plus présents (Sons.volume). */
const VOLUME = { tic: 0.45, piece: 0.6, achat: 0.6, tampon: 0.7, alerte: 0.7, ching: 0.8, succes: 0.8 };
/** Une pièce légère, un tampon sec, un succès qui dure (Sons.vibrer), en millisecondes. */
const VIBRATION = { tic: [6], piece: [10], achat: [14], tampon: [22], ching: [12, 60, 18], alerte: [30, 80, 30], succes: [16, 150, 10, 140, 6] };

let contexte = null;
const tampons = new Map();
let dernierRetour = 0;

function audio() {
  if (contexte) return contexte;
  const C = window.AudioContext ?? window.webkitAudioContext;
  if (!C) return null;
  try { contexte = new C(); } catch { return null; }
  return contexte;
}

/** RNT-231 : les sons équipés (« sons-cristal » → sons/tic-cristal.wav) ; Graphite : les fichiers de base. */
function voix() {
  try { const id = JSON.parse(localStorage.getItem("grind.cosmetiques") ?? "{}")?.sons ?? ""; return /^sons-[a-z]+$/.test(id) ? id.slice(4) : ""; } catch { return ""; }
}

async function tampon(nom) {
  nom = nom + voix();
  if (tampons.has(nom)) return tampons.get(nom);
  const p = fetch(`sons/${nom}.wav`).then((r) => r.arrayBuffer()).then((b) => audio()?.decodeAudioData(b)).catch(() => null);
  tampons.set(nom, p);
  return p;
}

/** Un son seul (sans vibration), à son volume. Silencieux si les sons sont coupés ou si rien n'a encore été touché. */
export async function jouerFichier(nom, volume = VOLUME[nom] ?? 0.7) {
  if (!sonsActifs() || !SONS.includes(nom)) return;
  const c = audio();
  if (!c) return;
  // Les navigateurs n'ouvrent le son qu'après un geste : avant, on se tait (pas d'erreur).
  if (c.state === "suspended") { try { await c.resume(); } catch {} if (c.state !== "running") return; }
  const b = await tampon(nom);
  if (!b) return;
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = volume;
  src.buffer = b;
  src.connect(g).connect(c.destination);
  src.start();
}

/** Une vibration seule : un son (« piece »), une durée en ms (une sélection : 8) ou un motif ; sans argument, une sélection. */
export function vibrer(motif = 8) {
  if (!vibrationsActives() || !navigator.vibrate) return;
  try { navigator.vibrate(Array.isArray(motif) ? motif : typeof motif === "number" ? [motif] : VIBRATION[motif] ?? [10]); } catch {}
}

/** Un moment du jeu : son son, et sa vibration (Sons.jouer(SonJeu)). */
export function jouerSon(nom) {
  if (!SONS.includes(nom)) return;
  dernierRetour = Date.now();
  jouerFichier(nom);
  vibrer(nom);
}

/** Un son d'événement vient de jouer (moins d'une seconde) : le toast qui suit ne revibre pas. */
export const retourRecent = () => Date.now() - dernierRetour < 1000;

/** Le premier geste ouvre le son (politique des navigateurs) et prépare les fichiers. */
function deverrouiller() {
  const c = audio();
  if (c?.state === "suspended") c.resume().catch(() => {});
  if (sonsActifs()) SONS.forEach(tampon);
  removeEventListener("pointerdown", deverrouiller, true);
  removeEventListener("keydown", deverrouiller, true);
}
addEventListener("pointerdown", deverrouiller, true);
addEventListener("keydown", deverrouiller, true);

// MARK: Les réglages (Réglages › Apparence sur l'iPhone)

/** Le bloc « Sons et vibrations » des Réglages : deux interrupteurs. */
export const blocReglagesSons = () => `${section("Sons et vibrations")}
  ${carte(`${interrupteur({ titre: "Sons", detail: "Le « ching » d'une rentrée, le tampon d'une signature…", actif: sonsActifs(), action: "basculerSons" })}
    ${interrupteur({ titre: "Vibrations", detail: "Sur les téléphones qui savent vibrer.", actif: vibrationsActives(), action: "basculerVibrations" })}`)}`;

/** Les actions de ces interrupteurs (à fusionner dans celles de la page Réglages). */
export const actionsReglagesSons = {
  basculerSons(ctx) {
    const oui = !sonsActifs();
    ecrire(CLE_SONS, oui ? "1" : "0");
    if (oui) jouerFichier("piece", 0.6); // comme l'iPhone : on entend ce qu'on vient d'allumer
    ctx.redessiner();
  },
  basculerVibrations(ctx) {
    const oui = !vibrationsActives();
    ecrire(CLE_VIBRATIONS, oui ? "1" : "0");
    if (oui) vibrer("piece");
    ctx.redessiner();
  },
};
