// AfriBayit Service Worker — v2 (oct. 2026)
//
// ⚠️ CONTEXTE DE LA RÉVISION v2 : la v1 servait les navigations HTML en
// cache-first avec des noms de caches inchangés entre les déploiements.
// Résultat : les visiteurs récurrents recevaient EN BOUCLE le HTML d'un
// ancien build (le sw.js identique octet par octet ne déclenchait jamais de
// mise à jour côté navigateur) — les corrections déployées n'étaient jamais
// vues sur desktop. Les noms de caches sont désormais suffixés -v2 et le
// hash du fichier change à chaque révision : tout client récurrent met à
// jour son SW au prochain passage, les caches v1 sont purgés à l'activation.
//
// Stratégies v2 :
//   - Install : pré-cache minimal du shell (page offline + manifest + logo).
//   - Activate : purge des caches non listés (v1 → supprimés), claim immédiat.
//   - NAVIGATIONS (HTML) : network-first — le HTML est TOUJOURS frais quand
//     on est en ligne ; le cache n'est qu'un fallback hors-ligne. C'est le
//     comportement correct pour un site qui déploie plusieurs fois par jour.
//   - Assets immuables (/_next/static/, /flags/, /icons/, fonts) : cache-first
//     — ces chemins sont content-hashed ou versionnés, aucun risque de périmé.
//   - Images dynamiques : stale-while-revalidate.
//   - /api/ et /auth/ : network-first, jamais de réponse authentifiée en cache.

const APP_SHELL_CACHE = 'afribayit-shell-v2';
const IMAGE_CACHE = 'afribayit-images-v2';
const API_CACHE = 'afribayit-api-v2';

const APP_SHELL_URLS = [
  '/offline',
  '/manifest.webmanifest',
  '/logo.svg',
  '/logo.png',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Chemins immuables (content-hashed par le build ou statiques versionnés) :
// cache-first autorisé car leur contenu ne change jamais pour une URL donnée.
const IMMUTABLE_PATHS = [
  '/_next/static/',
  '/flags/',
  '/icons/',
  '/images/',
];

// ─── Install : pré-cache minimal ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // addAll avec repli sécurisé — un 404 sur un asset ne doit pas avorter
      // toute l'installation.
      await Promise.all(
        APP_SHELL_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn('[sw] Pre-cache failed for', url, err);
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

// ─── Activate : purge des caches obsolètes (v1…) ─────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const validCaches = new Set([APP_SHELL_CACHE, IMAGE_CACHE, API_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !validCaches.has(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// ─── Fetch : routage par type de requête ─────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Seulement GET — jamais intercepter POST/PUT/DELETE.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Requêtes cross-origin : le navigateur s'en charge.
  if (url.origin !== self.location.origin) return;

  // Internes Next.js / dev-only : ignorer.
  if (
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/__nextjs') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // ─── API / auth : network-first ───
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(networkFirst(request, API_CACHE, /* cacheTtl */ 0));
    return;
  }

  // ─── Assets immuables (hashés) : cache-first ───
  if (
    IMMUTABLE_PATHS.some((p) => url.pathname.startsWith(p)) &&
    request.destination !== 'document'
  ) {
    event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
    return;
  }

  // ─── Images dynamiques : stale-while-revalidate ───
  if (
    request.destination === 'image' ||
    /\.(?:png|jpe?g|webp|gif|svg|avif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // ─── NAVIGATIONS + reste : network-first (HTML toujours frais) ───
  event.respondWith(networkFirst(request, APP_SHELL_CACHE));
});

// ─── Stratégies de cache ─────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: false });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    if (request.mode === 'navigate') {
      const offline = await cache.match('/offline');
      if (offline) return offline;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: false });

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === 'basic') {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    // Mettre en cache uniquement les GET réussis non authentifiés.
    if (
      response &&
      response.ok &&
      response.type === 'basic' &&
      !request.url.includes('/auth/')
    ) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Hors-ligne : dernier HTML connu, sinon page offline explicite.
    if (request.mode === 'navigate') {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      const offline = await cache.match('/offline');
      if (offline) return offline;
    }
    throw err;
  }
}

// ─── Message handler : skipWaiting sur demande explicite ─────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
