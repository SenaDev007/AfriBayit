// AfriBayit — Service Worker v2
// Enhanced PWA support with Workbox-style caching strategies

const CACHE_NAME = 'afribayit-v2';
const STATIC_CACHE = 'afribayit-static-v2';
const API_CACHE = 'afribayit-api-v2';
const IMAGE_CACHE = 'afribayit-images-v2';
const OFFLINE_URL = '/offline';

// Cache durations
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const IMAGE_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const STATIC_CACHE_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/logo.png',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

// Routes that use cache-first strategy (static assets)
const CACHE_FIRST_PATTERNS = [
  /\.(?:css|js|woff2?|ttf|eot)$/,
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/,
  /\/_next\/static\//,
];

// Routes that use network-first strategy (API calls)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
];

// ── Install Event ───────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate Event ──────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => ![STATIC_CACHE, API_CACHE, IMAGE_CACHE].includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.skipWaiting();
});

// ── Fetch Event ─────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http requests
  if (!request.url.startsWith('http')) return;

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('https://') && !request.url.startsWith('http://')) return;

  // Route to appropriate strategy
  if (isCacheFirstRequest(request.url)) {
    event.respondWith(cacheFirst(request));
  } else if (isNetworkFirstRequest(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// ── Background Sync for Form Submissions ────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === 'form-submission') {
    event.waitUntil(processOfflineFormSubmissions());
  }
});

async function processOfflineFormSubmissions() {
  // Process queued form submissions when back online
  try {
    const cache = await caches.open('afribayit-forms');
    const requests = await cache.keys();
    for (const request of requests) {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// ── Push Notifications ──────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle notification AfriBayit',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'AfriBayit', options)
    );
  } catch {
    // Fallback for non-JSON push data
    event.waitUntil(
      self.registration.showNotification('AfriBayit', {
        body: event.data.text(),
        icon: '/icons/icon-192x192.svg',
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// ── Caching Strategies ──────────────────────────────────────

/**
 * Cache-First: Try cache, fall back to network.
 * Best for static assets that rarely change.
 */
async function cacheFirst(request) {
  const cacheName = isImageRequest(request.url) ? IMAGE_CACHE : STATIC_CACHE;

  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // For images, return a placeholder
    if (isImageRequest(request.url)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#f0f0f0" width="400" height="300"/><text fill="#999" font-size="16" x="200" y="150" text-anchor="middle">Image non disponible</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    return new Response('', { status: 503 });
  }
}

/**
 * Network-First: Try network, fall back to cache.
 * Best for API calls where fresh data is preferred.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Add warning header for stale data
      const headers = new Headers(cached.headers);
      headers.set('X-Served-From', 'cache');
      headers.set('X-Cache-Age', String(Date.now()));

      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    return new Response(
      JSON.stringify({ error: 'offline', message: 'Données non disponibles hors ligne' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Stale-While-Revalidate: Return cache immediately, update in background.
 * Best for non-critical resources that should load fast.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

/**
 * Navigation handler: Network-first with offline fallback page.
 */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;

    return new Response(
      `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AfriBayit — Hors ligne</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #003087; color: white; text-align: center; padding: 2rem; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 400px; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { opacity: 0.7; margin-bottom: 1.5rem; }
    button { background: white; color: #003087; border: none; padding: 0.75rem 2rem; border-radius: 9999px; font-weight: 600; cursor: pointer; }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Vous êtes hors ligne</h1>
    <p>Vérifiez votre connexion internet et réessayez.</p>
    <button onclick="window.location.reload()">Réessayer</button>
  </div>
</body>
</html>`,
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}

// ── Helper Functions ────────────────────────────────────────

function isCacheFirstRequest(url) {
  return CACHE_FIRST_PATTERNS.some((pattern) => pattern.test(url));
}

function isNetworkFirstRequest(url) {
  return NETWORK_FIRST_PATTERNS.some((pattern) => pattern.test(url));
}

function isImageRequest(url) {
  return /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/.test(url) || url.includes('/image');
}
