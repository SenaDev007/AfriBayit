// AfriBayit — Service Worker for PWA
// Enables offline support, caching, background sync, and push notifications

const CACHE_NAME = 'afribayit-v2';
const STATIC_CACHE = 'afribayit-static-v2';
const API_CACHE = 'afribayit-api-v2';
const LISTING_CACHE = 'afribayit-listings-v2';
const OFFLINE_URL = '/offline';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/logo.png',
  '/manifest.json',
];

// API routes that should use network-first strategy
const API_ROUTES = ['/api/properties', '/api/escrow', '/api/payments', '/api/auth', '/api/wallet', '/api/payouts'];

// Listing routes that use stale-while-revalidate
const LISTING_ROUTES = ['/api/properties/search', '/api/properties/neighborhood'];

// Maximum cache age in seconds
const API_CACHE_MAX_AGE = 60; // 1 minute for API
const LISTING_CACHE_MAX_AGE = 300; // 5 minutes for listings

// ============ Install Event ============
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(() => {
      // Don't fail install if some assets can't be cached
      console.warn('[SW] Some static assets failed to cache on install');
    })
  );
  self.skipWaiting();
});

// ============ Activate Event ============
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => ![CACHE_NAME, STATIC_CACHE, API_CACHE, LISTING_CACHE].includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ============ Fetch Event ============
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return;

  // Skip WebSocket requests
  if (request.url.startsWith('ws://') || request.url.startsWith('wss://')) return;

  const url = new URL(request.url);

  // For navigation requests, try network first, fall back to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the page for offline use
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // ── API routes: Network-first strategy ──
  const isApiRoute = API_ROUTES.some(route => url.pathname.startsWith(route));
  if (isApiRoute) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, API_CACHE_MAX_AGE));
    return;
  }

  // ── Listing routes: Stale-while-revalidate strategy ──
  const isListingRoute = LISTING_ROUTES.some(route => url.pathname.startsWith(route));
  if (isListingRoute) {
    event.respondWith(staleWhileRevalidate(request, LISTING_CACHE, LISTING_CACHE_MAX_AGE));
    return;
  }

  // ── All other API requests: Network-first ──
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, API_CACHE_MAX_AGE));
    return;
  }

  // ── Static assets: Cache-first strategy ──
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ============ Caching Strategies ============

/**
 * Cache-first strategy: serve from cache, fall back to network.
 * Best for static assets that rarely change (CSS, JS, images, fonts).
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, clone);
      });
    }
    return response;
  } catch {
    // For image requests, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" fill="#e2e8f0"><rect width="200" height="150"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#94a3b8" font-size="14">Hors ligne</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

/**
 * Network-first strategy: try network, fall back to cache.
 * Best for API calls where freshness matters but offline access is still useful.
 */
async function networkFirstWithCache(request, cacheName, maxAgeSeconds) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, clone);
      });
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Check if cache is stale (optional — still serve it)
      const dateHeader = cached.headers.get('sw-cache-timestamp');
      if (dateHeader) {
        const cacheAge = (Date.now() - parseInt(dateHeader)) / 1000;
        if (cacheAge > maxAgeSeconds * 10) {
          // Very stale — add a warning header
          const headers = new Headers(cached.headers);
          headers.set('X-Stale-Data', 'true');
          return new Response(cached.body, { ...cached, headers });
        }
      }
      return cached;
    }

    // Return offline response for API
    return new Response(
      JSON.stringify({ error: 'Hors ligne', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Stale-while-revalidate strategy: serve from cache, then update in background.
 * Best for property listings where showing slightly stale data is acceptable.
 */
async function staleWhileRevalidate(request, cacheName, maxAgeSeconds) {
  const cached = await caches.match(request);

  // Fetch fresh data in the background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(cacheName).then((cache) => {
          // Add timestamp header for staleness tracking
          const headers = new Headers(response.headers);
          headers.set('sw-cache-timestamp', Date.now().toString());
          cache.put(request, clone);
        });
      }
      return response;
    })
    .catch(() => cached); // If fetch fails, use cached

  // Return cached immediately if available, otherwise wait for fetch
  if (cached) {
    // Revalidate in background (don't await)
    fetchPromise.catch(() => {});
    return cached;
  }

  try {
    return await fetchPromise;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Hors ligne', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============ Background Sync ============
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncPendingFavorites());
  }
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncPendingActions());
  }
});

/**
 * Sync pending favorites that were saved while offline.
 */
async function syncPendingFavorites() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('pending_favorites', 'readonly');
    const store = tx.objectStore('pending_favorites');
    const favorites = await store.getAll();

    for (const fav of favorites) {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fav),
        });
        // Remove from pending store on success
        const deleteTx = db.transaction('pending_favorites', 'readwrite');
        deleteTx.objectStore('pending_favorites').delete(fav.id);
      } catch {
        // Will retry on next sync
      }
    }
  } catch {
    // IndexedDB not available
  }
}

/**
 * Sync pending messages that were saved while offline.
 */
async function syncPendingMessages() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('pending_messages', 'readonly');
    const store = tx.objectStore('pending_messages');
    const messages = await store.getAll();

    for (const msg of messages) {
      try {
        await fetch('/api/chat/conversations/' + msg.conversationId + '/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        });
        const deleteTx = db.transaction('pending_messages', 'readwrite');
        deleteTx.objectStore('pending_messages').delete(msg.id);
      } catch {
        // Will retry on next sync
      }
    }
  } catch {
    // IndexedDB not available
  }
}

/**
 * Sync other pending actions saved while offline.
 */
async function syncPendingActions() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('pending_actions', 'readonly');
    const store = tx.objectStore('pending_actions');
    const actions = await store.getAll();

    for (const action of actions) {
      try {
        await fetch(action.url, {
          method: action.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
        });
        const deleteTx = db.transaction('pending_actions', 'readwrite');
        deleteTx.objectStore('pending_actions').delete(action.id);
      } catch {
        // Will retry on next sync
      }
    }
  } catch {
    // IndexedDB not available
  }
}

/**
 * Open IndexedDB for offline data storage.
 */
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('afribayit_offline', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_favorites')) {
        db.createObjectStore('pending_favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_messages')) {
        db.createObjectStore('pending_messages', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending_actions')) {
        db.createObjectStore('pending_actions', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ Push Notifications ============
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || data.message || 'Nouvelle notification AfriBayit',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        type: data.type || 'general',
      },
      actions: data.actions || [],
      tag: data.tag || 'afribayit-notification',
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'AfriBayit',
        options
      )
    );
  } catch {
    // Fallback for plain text push
    event.waitUntil(
      self.registration.showNotification('AfriBayit', {
        body: event.data.text(),
        icon: '/logo.png',
        badge: '/logo.png',
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
