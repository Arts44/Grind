// ══════════════════════════════════════════════════════════════════════
//  Avant le jeu (D186) : chargement du moteur, compte, code de récupération,
//  choix du profil. Ces écrans n'ont pas d'onglets.
// ══════════════════════════════════════════════════════════════════════
import { montant, esc } from "../format.js?v=3e8bddd9";
import { entetePousse } from "../ui.js?v=3e8bddd9";
import { metaProfil, secteursProfil } from "../profil-depart.js?v=3e8bddd9";
import { poserStyles } from "./index.js?v=3e8bddd9";
export { montant, entetePousse };

// Les écrans d'avant le jeu ne sont pas des pages (pas de `css:`) : Bienvenue prend les styles des
// réglages (l'accent) par le même mécanisme (pages/index.js, poserStyles).
poserStyles(["reglages", "compte"]);

export function ecran(etat) {
  switch (etat.ecran) {
    case "erreur": return erreur(etat.erreur);
    case "compte": return etat.codeAMontrer ? codeRecuperation(etat.codeAMontrer) : compte(etat);
    case "profils": return profils(etat);
    default: return chargement();
  }
}

export const chargement = () => `
  <div class="accueil-vide">
    <div class="logo">Grind<span>.</span></div>
    <p class="aide" id="chargement-texte">Le moteur se prépare…</p>
    <div class="rail" style="width:220px;margin:0 auto;--couleur:var(--or)"><i id="chargement-barre" style="width:4%"></i></div>
  </div>`;

/** L'avancement du premier chargement : le moteur pèse des dizaines de Mo, puis il se compile. */
export function majChargement(p) {
  const texte = document.getElementById("chargement-texte");
  const barre = document.getElementById("chargement-barre");
  if (!texte || !barre) return;
  if (p.phase === "compilation") {
    texte.textContent = "Préparation du moteur… (quelques secondes)";
    barre.style.width = "100%";
    return;
  }
  const mo = (x) => (x / 1048576).toFixed(0);
  // Content-Length compte les octets compressés, `recu` les octets décompressés : on plafonne.
  const part = p.total ? Math.min(1, p.recu / p.total) : 0;
  texte.textContent = `Téléchargement du moteur : ${mo(p.recu)} Mo (une seule fois, ensuite il reste en cache)`;
  barre.style.width = `${Math.max(4, Math.round(part * 96))}%`;
}

const erreur = (m) => `
  <div class="accueil-vide">
    <div class="logo">Grind<span>.</span></div>
    <p class="aide">${esc(m)}</p>
    <button class="bouton secondaire" onclick="location.reload()">Réessayer</button>
  </div>`;

// MARK: Compte

function compte(etat) {
  const creer = etat.modeCompte !== "reprendre";
  return `
  <div class="pile bv-page" style="padding-top:6vh">
    <div class="logo" style="text-align:center">Grind<span>.</span></div>
    <p class="aide" style="text-align:center;margin-bottom:12px">Ton argent avance quand tu te concentres. Le même jeu que sur iPhone, dans ton navigateur.</p>
    <div class="choix" role="tablist" style="justify-content:center">
      <button class="petit ${creer ? "actif" : ""}" data-action="modeCompte" data-mode="creer" role="tab" aria-selected="${creer}">Nouveau joueur</button>
      <button class="petit ${creer ? "" : "actif"}" data-action="modeCompte" data-mode="reprendre" role="tab" aria-selected="${!creer}">J'ai déjà un compte</button>
    </div>
    ${creer ? bienvenue() : ""}
    <form class="carte pad pile" style="margin-top:8px">
      <label class="libelle" for="pseudo" style="margin-top:0">Ton pseudo</label>
      <input class="champ" id="pseudo" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="20" placeholder="Celui que verront tes amis">
      ${creer ? `
        ${identite()}
        <p class="aide">Un code de récupération t'est donné à la création : il te permet de retrouver ton compte sur un autre appareil.</p>
        <button class="bouton" data-action="creerCompte" disabled>Créer mon compte</button>
      ` : `
        <label class="libelle" for="code">Code de récupération</label>
        <input class="champ code" id="code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD EFGH JKMN">
        <p class="aide">Les 12 caractères notés à la création du compte. Ils sont aussi dans Réglages › Compte › Code de récupération, sur l'appareil où ton compte est ouvert.</p>
        ${codeGarde() ? `<button type="button" class="petit" data-action="codeGarde" style="align-self:flex-start">Utiliser le code gardé dans ce navigateur</button>` : ""}
        <p class="aide">Ton compte s'ouvre ici, et se ferme sur l'appareil où il était (ton iPhone, par exemple). Tu peux le reprendre là-bas de la même façon.</p>
        <button class="bouton" data-action="reprendreCompte" disabled>Reprendre mon compte</button>
      `}
    </form>
  </div>`;
}

// MARK: Bienvenue (Bienvenue.swift) : qui tu es — le pseudo (D388 : plus d'avatar ; D393 : la couleur dans Personnaliser)

/** La carte de membre en aperçu : elle suit le pseudo tapé. */
function bienvenue() {
  return `<div class="bv-tete"><h1 class="titre-entete">Bienvenue dans Grind</h1>
    <p class="aide">Ton focus devient ton salaire, puis ta fortune. D'abord, qui es-tu ?</p></div>
    <div class="cl-membre" role="img" aria-label="Ta carte de membre">
      <span class="cl-membre-haut"><span class="bv-piece" aria-hidden="true">G</span><span class="cl-mot">Membre</span></span>
      <span class="cl-membre-pseudo" id="bv-pseudo">Choisis un pseudo</span>
      <span class="cl-membre-bas"><span>Aucune saison</span><span class="chiffres">Pas encore de record</span></span>
    </div>`;
}

/** D393 (Arthur 16/11) : ni couleur ni avatar à choisir ici, tout passe par Personnaliser mon profil (comme l'iPhone). */
function identite() {
  return `<p class="aide">Ton avatar et la couleur de l'app se choisissent ensuite dans Profil, « Personnaliser mon profil ».</p>`;
}

// La carte de membre de Bienvenue suit le pseudo tapé, sans redessiner l'écran.
if (typeof document !== "undefined") {
  document.addEventListener("input", (ev) => {
    if (ev.target.id !== "pseudo") return;
    const p = document.getElementById("bv-pseudo");
    if (p) p.textContent = ev.target.value.trim() || "Choisis un pseudo";
  });
}

/** RNT-220 : le code de récupération que ce navigateur garde encore (il a déjà tenu le compte), ou "". */
function codeGarde() {
  try { return localStorage.getItem("grind.recuperation") ?? ""; } catch { return ""; }
}

const codeRecuperation = (code) => `
  <div class="pile" style="padding-top:8vh">
    <h1 style="font-size:26px">Note ton code</h1>
    <p class="aide">C'est la seule façon de retrouver ton compte sur un autre appareil. Il ne sera plus affiché.</p>
    <div class="carte" style="text-align:center;padding:26px 16px">
      <div class="code chiffres" style="font-size:28px;font-weight:700">${esc(code.replace(/(.{4})(?=.)/g, "$1 "))}</div>
    </div>
    <button class="bouton" data-action="codeNote">Je l'ai noté</button>
  </div>`;

// MARK: Profils


function profils(etat) {
  const liste = etat.profils ?? [];
  const paliers = [...new Set(liste.map((p) => p.palierEffectif))].sort();
  const choisi = liste.find((p) => p.id === etat.profilChoisi);
  return `
  <div class="entete"><div><h1>Ton départ</h1><div class="sous">Solo. Les mondes en ligne arrivent dans la prochaine version web.</div></div></div>
  ${paliers.map((n) => {
    const groupe = liste.filter((p) => p.palierEffectif === n);
    return `
    <div class="libelle">${esc(groupe[0]?.nomPalier ?? "")}</div>
    <div class="pile">${groupe.map((p) => carteProfil(p, p.id === etat.profilChoisi)).join("")}</div>`;
  }).join("")}
  <div class="bas-colle">
    <button class="bouton" data-action="commencer" ${choisi?.debloque ? "" : "disabled"}>
      ${choisi ? (choisi.debloque ? `Commencer : ${esc(choisi.nom)}` : `Se débloque au niveau ${choisi.niveauEffectif}`) : "Choisis un profil"}
    </button>
  </div>`;
}

/** D342 : le secteur choisi sur cet écran (remis à zéro quand on change de profil). */
export const etatSecteur = { choisi: null };

function carteProfil(p, choisi) {
  const parHeure = (p.salaireCentimesParMinute ?? 0) * 60;
  return `
  <button class="carte profil ${p.debloque ? "" : "ferme"} ${choisi ? "choisi" : ""}" data-action="choisirProfil" data-id="${esc(p.id)}" aria-pressed="${choisi}">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
      <span class="nom">${esc(p.nom)}</span>
      ${p.debloque ? `<span class="chip chiffres">${montant(parHeure)} / h</span>` : `<span class="chip">🔒 Niveau ${p.niveauEffectif}</span>`}
    </div>
    ${metaProfil(p)}
    <p class="aide" style="margin-top:4px">${esc(p.description)}</p>
    ${choisi ? `
      <div style="margin-top:10px">
        ${(p.atouts ?? []).map((a) => `<div class="atout">${esc(a)}</div>`).join("")}
        ${(p.defauts ?? []).map((d) => `<div class="defaut">${esc(d)}</div>`).join("")}
      </div>` : ""}
  </button>${choisi && p.debloque ? secteursProfil(p, etatSecteur.choisi, "choisirSecteurDepart") : ""}`;
}

