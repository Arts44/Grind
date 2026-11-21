// ══════════════════════════════════════════════════════════════════════
//  Grind hors ligne (D186, D205) : l'app installée s'ouvre sans réseau.
//
//  Deux caches :
//   - « grind-3e8bddd9 » porte le numéro de version du site (le workflow remplace
//     « grind-3e8bddd9 » par le commit publié) : une nouvelle version vide
//     l'ancien. Les pages, les scripts, les styles : le réseau d'abord (revalidé,
//     D356), le cache sinon ; les modules portent ?v=<commit> (web-versionner) ; les icônes et Leaflet : le cache d'abord.
//   - « grind-moteur » (lot F) garde moteur.wasm et Balance.json par
//     empreinte (moteur.wasm?v=<empreinte>, voir moteur.json) : il survit
//     aux versions du site, et les 50 Mo du moteur ne se retéléchargent
//     que quand le moteur change. Une nouvelle empreinte remplace l'ancienne.
//   - « grind-photos-1 » (lot D) : les photos (photos/*.webp, 40 Mo en
//     tout) ne sont pas dans le cache de démarrage : chacune est gardée la
//     première fois qu'elle s'affiche ; ce cache survit aux versions.
//  Le serveur de jeu (Supabase) et les tuiles de la carte : jamais en
//  cache (le mode en ligne demande le réseau, la partie, elle, continue).
// ══════════════════════════════════════════════════════════════════════
const CACHE = "grind-3e8bddd9";
const MOTEUR = "grind-moteur";
const PHOTOS = "grind-photos-1"; // à changer si scripts/photos-web.py change les photos sans changer leurs noms
const COEUR = ["./", "index.html", "manifest.webmanifest", "icone.svg", "icones/icone-180.png", "icones/icone-192.png",
  "icones/icone-512.png", "icones/icone-masquable-512.png", "icones/icone-32.png", "vendor/leaflet/leaflet.css", "vendor/leaflet/leaflet.js",
  // Lot A : les jetons, les composants, Manrope, les sept sons de l'iPhone.
  "css/jetons.css", "css/composants.css", "polices/manrope-latin.woff2", "polices/manrope-latin-ext.woff2",
  // D336 : la craie des Nouveautés (Caveat, Kalam).
  "polices/caveat-700.woff2", "polices/kalam-400.woff2", "polices/kalam-700.woff2",
  ...["tic", "piece", "achat", "ching", "tampon", "carillon", "alerte", "succes"].flatMap((n) => [`sons/${n}.wav`, `sons/${n}-cristal.wav`, `sons/${n}-feutre.wav`]), // RNT-231 : les voix
  ...["demarrage", "aide-donnees", "aide", "app", "avenir-donnees", "barre", "changelog-donnees", "compte-local", "enligne", "fil", "format", "glisser", "guide-donnees", "ici", "meteo", "moteur-travailleur",
    "moteur", "paiement", "patcher", "serveur", "sons", "ui", "wasi", "cosmetiques", "cartes-fortune", "economie", "titres", "profil-depart", "mouvements", "listes", "vitrine", "icones-jeu", "icones-reicon", "icone-app", "carte-ticket", "choix-compact", "faceid"].map((f) => `js/${f}.js`),
  // D391 : les vingt icônes de l'app (l'aperçu de la grille, le favicon) ; le 180 se charge au choix.
  ...["cadran", "monogramme", "anneau", "rosace", "losange", "lingot", "sablier", "coffrefort", "piles", "diamant", "courbe", "couronne", "ticket",
    "plume", "coupe", "cle", "tours", "jet", "bougies", "lune"].flatMap((n) => [`icones/famille/${n}.svg`, `icones/famille/${n}-32.png`]),
  ...["accueil", "actifs", "admin", "banque", "bateaux", "boite-joueur", "carte", "catalogues", "combines", "cuisine", "depart", "encheres", "enligne", "enligne-fiches", "entreprises", "focus",
    "guide", "immobilier", "index", "joueurs", "manger", "recompenses", "marches-icones", "marches", "revenus", "salaire", "monde", "mondes", "montres", "nouveautes", "notifications", "objectifs", "profil", "reglages", "saison",
    "social", "trainvie", "vehicules", "vie", "villes", "echanges", "favoris", "prison", "casino", "casino-cartes", "roulette", "machines", "casino-partage", "billets", "couple", "liens", "defis", "famille", "series", "course", "code"].map((p) => `js/pages/${p}.js`), // D350 : les pages de la 1.18
  // Les styles des zones (css: des pages, lots B à E), et la liste des photos publiées (lot D ; pas les photos).
  ...["accueil", "actifs", "aide", "banque", "catalogues", "compte", "encheres", "enligne", "focus", "guide", "manger", "marches", "monde", "mondes", "notifications", "reglages", "trainvie", "cosmetiques", "echanges", "favoris", "ardoise", "casino-cartes", "roulette", "machines", "casino-partage", "couple", "liens", "admin", "combines", "course", "code"].map((z) => `css/pages/${z}.css`),
  "photos/index.json", "photos/credits.json"];
const IMMUABLE = /\.(png|svg|woff2|wav)$|\/vendor\//;
const DU_MOTEUR = /\/(moteur\.wasm|Balance\.json|Code\.json)$/; // D450 : Code.json, les questions du code

/** Le moteur de cette version (moteur.json), gardé s'il ne l'est pas déjà. */
async function garderMoteur() {
  let v = null;
  try { v = await (await fetch("moteur.json", { cache: "no-cache" })).json(); } catch {}
  const suffixe = v?.empreinte ? `?v=${v.empreinte}` : "";
  const c = await caches.open(MOTEUR);
  for (const f of ["Balance.json", "Code.json", "moteur.wasm"]) {
    const url = new URL(f + suffixe, self.registration.scope).href;
    if (!(await c.match(url))) await mettreMoteur(c, new Request(url)).catch(() => {});
  }
}

/** Range une réponse du moteur et retire les autres empreintes du même fichier. */
async function mettreMoteur(c, requete, reponse = null) {
  const r = reponse ?? await fetch(requete);
  if (!r.ok) return r;
  const chemin = new URL(requete.url).pathname;
  for (const ancienne of await c.keys()) {
    if (new URL(ancienne.url).pathname === chemin && ancienne.url !== requete.url) await c.delete(ancienne);
  }
  await c.put(requete, r.clone());
  return r;
}

self.addEventListener("install", (e) => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  // Un fichier à la fois : un seul absent ne doit pas empêcher l'installation.
  // D356 : « reload » : jamais la copie du cache HTTP (max-age=600 sur GitHub Pages), qui peut être de l'ancienne version.
  await Promise.all(COEUR.map((f) => c.add(new Request(f, { cache: "reload" })).catch(() => {})));
  // Le moteur pèse des dizaines de Mo : en arrière-plan, pour la prochaine ouverture sans réseau.
  garderMoteur().catch(() => {});
  await self.skipWaiting();
})()));

self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE && n !== MOTEUR && n !== PHOTOS).map((n) => caches.delete(n)))).then(() => self.clients.claim())));

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // le serveur de jeu, les tuiles : jamais en cache
  // Lot D : une photo, le cache d'abord ; gardée la première fois qu'elle s'affiche (jamais préchargée).
  if (/\/photos\/[^/]+\/[^/]+\.webp$/.test(url.pathname)) {
    e.respondWith(caches.open(PHOTOS).then((c) => c.match(e.request).then((x) => x ?? fetch(e.request).then((r) => {
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }))));
    return;
  }
  if (DU_MOTEUR.test(url.pathname)) {
    // Le cache d'abord, à l'adresse exacte (l'empreinte) ; sans empreinte (en local), le réseau d'abord.
    e.respondWith((async () => {
      const c = await caches.open(MOTEUR);
      const x = await c.match(e.request);
      if (x && url.searchParams.has("v")) return x;
      try {
        return await mettreMoteur(c, e.request);
      } catch (err) {
        return x ?? (await c.match(e.request, { ignoreSearch: true })) ?? Promise.reject(err);
      }
    })());
    return;
  }
  if (IMMUABLE.test(url.pathname) && !url.pathname.endsWith("manifest.webmanifest")) {
    e.respondWith(caches.match(e.request).then((x) => x ?? fetch(e.request).then((r) => {
      if (r.ok) { const copie = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copie)); }
      return r;
    })));
    return;
  }
  // D356 : « no-cache » : le serveur confirme (ETag) que la copie du cache HTTP est la bonne, sinon il rend la neuve.
  // Sans cela, une page neuve pouvait se lier à un ui.js de la version d'avant (« binding name … not found »).
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then((r) => {
    if (r.ok) { const copie = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copie)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((x) => x ?? caches.match("index.html"))));
});
