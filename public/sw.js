// TriagePulse Production Service Worker v1.0.0
const CACHE_NAME = 'triagepulse-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/join',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
];

// Install: Cache critical core shells safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          // ignore individual asset load failure
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and WebSocket / SSE streams
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/realtime')) return;

  // 1. Static Assets (Icons, fonts, images, scripts, styles): Cache-First with Network Fallback
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkRes;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // 2. Navigation & API Requests: Network-First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkRes) => {
        // Cache successful HTML and API pages for offline hospital resilience
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;

        // If navigating to an HTML page while completely offline
        if (request.headers.get('accept')?.includes('text/html')) {
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
        }

        return new Response(
          JSON.stringify({
            offline: true,
            message: 'TriagePulse is currently running in offline mode. Waiting for hospital network reconnect.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
  );
});
