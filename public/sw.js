// AfriBayit Service Worker — app shell caching + offline fallback
//
// Strategies:
//   - Install: pre-cache the app shell (HTML routes + critical assets).
//   - Activate: clean up old cache versions.
//   - Same-origin GET (non-API): cache-first, fall back to network, then
//     offline fallback page.
//   - Images (same-origin): stale-while-revalidate.
//   - /api/ and /auth/ requests: network-first (always serve fresh data
//     when online; never cache authenticated responses).

const APP_SHELL_CACHE = 'afribayit-shell-v1';
const IMAGE_CACHE = 'afribayit-images-v1';
const API_CACHE = 'afribayit-api-v1';

const APP_SHELL_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.svg',
  '/logo.png',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// ─── Install: pre-cache app shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // Use addAll with safe fall-back — a 404 on one asset shouldn't abort
      // the whole install.
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

// ─── Activate: clean old caches ───────────────────────────────────────────
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

// ─── Fetch: route by request type ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET — never intercept POST/PUT/DELETE.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin requests (let the browser handle them).
  if (url.origin !== self.location.origin) return;

  // Skip Next.js internals / HMR / dev-only paths.
  if (
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/__nextjs') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  // ─── API requests: network-first ───
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(networkFirst(request, API_CACHE, /* cacheTtl */ 0));
    return;
  }

  // ─── Images: stale-while-revalidate ───
  if (
    request.destination === 'image' ||
    /\.(?:png|jpe?g|webp|gif|svg|avif|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // ─── Same-origin navigations + static assets: cache-first ───
  event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
});

// ─── Cache strategies ─────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Navigation requests fall back to the offline page.
    if (request.mode === 'navigate') {
      const offline = await cache.match('/offline');
      if (offline) return offline;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreSearch: true });

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
    // Only cache successful, non-authenticated GETs.
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
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

// ─── Message handler: skipWaiting on user prompt ──────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
