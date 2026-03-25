/*
 * BLACKTRIBE FASHION — SERVICE WORKER
 *
 * Strategy:
 *   Static assets (JS, CSS, fonts, images)  → Cache-first, network fallback
 *   API calls (/api/*)                       → Network-first, cache fallback
 *   Page navigations (HTML)                  → Network-first, offline fallback
 *   Product images (Supabase storage)        → Cache-first, network fallback
 *
 * Cache versioning: bump CACHE_VERSION to force full refresh.
 */

const CACHE_VERSION = 'bt-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

/* Max items per dynamic cache to prevent unbounded growth */
const MAX_DYNAMIC_ITEMS = 50;
const MAX_IMAGE_ITEMS = 100;

/* Assets to precache on install (critical path) */
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
];

/* ─── URL matching ─── */

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

function isStaticAsset(url) {
  return /\.(js|css|woff2|woff|ttf|svg|ico)(\?.*)?$/.test(url.pathname);
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|webp|gif|avif|PNG|JPG|JPEG|WEBP)(\?.*)?$/.test(url.pathname)
    || url.hostname.includes('supabase');
}

function isAnalytics(url) {
  return url.hostname.includes('analytics') || url.hostname.includes('trovarcis');
}

/* ─── Cache size limiter ─── */

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    /* Delete oldest entries first */
    const excess = keys.length - maxItems;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/* ─── Offline fallback HTML ─── */

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline. BlackTribe Fashion.</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0C0C0C;
      color: #EDEBE8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .offline-wrap { max-width: 360px; }
    .offline-brand {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.12em;
      margin-bottom: 48px;
      opacity: 0.4;
    }
    .offline-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
      line-height: 1.2;
    }
    .offline-sub {
      font-size: 14px;
      color: #9B9894;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .offline-btn {
      display: inline-block;
      padding: 12px 32px;
      background: #EDEBE8;
      color: #0C0C0C;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="offline-wrap">
    <div class="offline-brand">BLACKTRIBE</div>
    <h1 class="offline-title">You are offline</h1>
    <p class="offline-sub">Check your internet connection and try again. Previously viewed pieces may still be available.</p>
    <button class="offline-btn" onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>`;


/* ═══ INSTALL ═══ */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  /* Activate immediately — don't wait for existing tabs to close */
  self.skipWaiting();
});


/* ═══ ACTIVATE ═══ */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('bt-') && !name.startsWith(CACHE_VERSION))
          .map((name) => {
            console.log('[sw] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  /* Take control of all open tabs immediately */
  self.clients.claim();
});


/* ═══ FETCH ═══ */

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  /* Skip non-GET requests (POST to /api/events, etc.) */
  if (event.request.method !== 'GET') return;

  /* Skip analytics — never cache, never intercept */
  if (isAnalytics(url)) return;

  /* Skip chrome-extension and other non-http */
  if (!url.protocol.startsWith('http')) return;

  /* API requests: network-first */
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(event.request, DYNAMIC_CACHE));
    return;
  }

  /* Images: cache-first */
  if (isImageRequest(url)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE, MAX_IMAGE_ITEMS));
    return;
  }

  /* Static assets: cache-first */
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  /* Page navigations: network-first with offline fallback */
  if (isNavigationRequest(event.request)) {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  /* Everything else: network-first */
  event.respondWith(networkFirst(event.request, DYNAMIC_CACHE));
});


/* ═══ STRATEGIES ═══ */

/**
 * Cache-first: serve from cache, fall back to network (and cache the response).
 */
async function cacheFirst(request, cacheName, maxItems) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      if (maxItems) trimCache(cacheName, maxItems);
    }
    return response;
  } catch {
    /* Both cache and network failed — return a basic error */
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

/**
 * Network-first: try network, fall back to cache.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      trimCache(cacheName, MAX_DYNAMIC_ITEMS);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ success: false, error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Network-first for navigations with offline HTML fallback.
 */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    /* Try to serve cached version of this page */
    const cached = await caches.match(request);
    if (cached) return cached;

    /* Try to serve cached homepage (SPA — any route works) */
    const cachedHome = await caches.match('/');
    if (cachedHome) return cachedHome;

    /* Last resort: offline page */
    return new Response(OFFLINE_HTML, {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}
