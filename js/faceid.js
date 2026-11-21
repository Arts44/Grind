// ══════════════════════════════════════════════════════════════════════
//  faceid.js — D363 (Arthur, 15/11) : confirmer les gros paiements.
//
//  Le même réglage que l'iPhone (Réglages › Compte › Paiements) : un
//  interrupteur et un seuil, gardés dans ce navigateur. Au-delà du seuil,
//  le navigateur demande sa clé d'accès (Touch ID, Face ID, Windows Hello)
//  quand il en a une ; sinon, un second toucher confirme, comme avant.
//
//  La clé d'accès ne prouve rien au serveur : elle sert seulement à ce que
//  personne ne paie depuis ton navigateur ouvert sans toi.
// ══════════════════════════════════════════════════════════════════════

const CLE_ACTIF = "paiement.faceID";
const CLE_SEUIL = "paiement.faceIDSeuil";
const CLE_CLE = "paiement.passkey";
/** En centimes ; 0 : le seuil du jeu ; 1 : chaque paiement. Les mêmes que l'iPhone. */
export const SEUILS = [0, 1, 100_000, 500_000, 5_000_000, 10_000_000, 100_000_000];

const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} };

export const faceIDActif = () => lire(CLE_ACTIF) !== "0";
export const seuilChoisi = () => Number(lire(CLE_SEUIL) || 0);
export function choisirSeuil(c) { ecrire(CLE_SEUIL, String(Number(c) || 0)); }
export function basculerFaceID() { ecrire(CLE_ACTIF, faceIDActif() ? "0" : "1"); }

/** Le seuil appliqué : celui choisi, sinon celui du jeu (`t.seuilFaceID`). */
export const seuilEffectif = (t) => seuilChoisi() > 0 ? seuilChoisi() : (t?.seuilFaceID ?? 1_000_000);

/** Ce paiement demande-t-il une confirmation ? */
export const exige = (t) => faceIDActif() && t.montant > 0 && !t.differe && !t.recevoir && t.montant >= seuilEffectif(t);

/** Le nom d'un seuil dans le menu. */
export const nomSeuil = (c, montant) => c === 0 ? `${montant(1_000_000)} (par défaut)` : c === 1 ? "Chaque paiement" : montant(c);

const disponible = () => typeof window !== "undefined" && window.PublicKeyCredential && navigator.credentials
  && window.isSecureContext;

const octets = (n) => crypto.getRandomValues(new Uint8Array(n));
const versB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Vrai si ce navigateur a un authentificateur intégré (Touch ID, Face ID, Windows Hello). */
export async function passkeyPossible() {
  if (!disponible()) return false;
  try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch { return false; }
}

/** Crée la clé d'accès de Grind dans ce navigateur, une fois. */
async function creerCle() {
  const cred = await navigator.credentials.create({ publicKey: {
    challenge: octets(32),
    rp: { name: "Grind" },
    user: { id: octets(16), name: "grind", displayName: "Grind — paiements" },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
    timeout: 60_000,
  } });
  if (!cred) return null;
  ecrire(CLE_CLE, versB64(cred.rawId));
  return cred.rawId;
}

/**
 * Demande la clé d'accès. Rend `true` (confirmé), `false` (refusé ou annulé) ou `null` (pas de clé
 * d'accès possible ici : la fenêtre confirme alors par un second toucher).
 */
export async function verifier() {
  if (!(await passkeyPossible())) return null;
  try {
    let id = lire(CLE_CLE);
    if (!id) return (await creerCle()) ? true : false; // la création demande déjà Touch ID / Face ID
    const ok = await navigator.credentials.get({ publicKey: {
      challenge: octets(32),
      allowCredentials: [{ type: "public-key", id: deB64(id) }],
      userVerification: "required",
      timeout: 60_000,
    } });
    return !!ok;
  } catch (err) {
    // La clé a disparu (navigateur vidé) : on la recrée à la prochaine demande.
    if (err?.name === "InvalidStateError" || err?.name === "NotFoundError") ecrire(CLE_CLE, null);
    return false;
  }
}
