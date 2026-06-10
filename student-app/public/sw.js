/// <reference lib="webworker" />

const CACHE_NAME = 'dakkho-v1';
const STATIC_CACHE_NAME = 'dakkho-static-v1';
const API_CACHE_NAME = 'dakkho-api-v1';

// Static assets to pre-cache on install (app shell)
const APP_SHELL = [
  '/',
  '/logo.png',
  '/logo.svg',
  '/favicon.png',
];

// Cache-first for static assets: JS, CSS, fonts, images
const STATIC_EXTENSIONS = [
  '.js', '.css', '.woff2', '.woff', '.ttf', '.otf',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.mp3', '.wav', '.ogg',
];

// OneSignal SDK paths — never cache these (OneSignal manages its own SW)
const ONESIGNAL_PATHS = [
  'OneSignalSDKWorker.js',
  'OneSignalSDKUpdaterWorker.js',
  'cdn.onesignal.com',
  'onesignal.com',
];

// ============ INSTALL EVENT ============
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ============ ACTIVATE EVENT ============
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ============ FETCH EVENT ============
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip OneSignal SDK requests
  if (ONESIGNAL_PATHS.some((path) => url.pathname.includes(path) || url.hostname.includes(path))) {
    return;
  }

  // Skip chrome-extension and other non-http(s) protocols
  if (!url.protocol.startsWith('http')) return;

  // Strategy selection based on request type
  if (isApiRequest(url)) {
    // API requests: Network-First (stale-while-revalidate)
    event.respondWith(networkFirst(event.request));
  } else if (isStaticAsset(url)) {
    // Static assets: Cache-First
    event.respondWith(cacheFirst(event.request));
  } else {
    // Navigation & other: Network-First with cache fallback
    event.respondWith(networkFirst(event.request));
  }
});

// ============ BACKGROUND SYNC ============
self.addEventListener('sync', (event) => {
  if (event.tag === 'watch-progress-sync') {
    event.waitUntil(syncWatchProgress());
  }
});

async function syncWatchProgress() {
  // Read pending progress updates from IndexedDB and POST to API
  try {
    const db = await openProgressDB();
    const tx = db.transaction('pending-progress', 'readonly');
    const store = tx.objectStore('pending-progress');
    const allRecords = await store.getAll();

    for (const record of allRecords) {
      try {
        await fetch('/api/student/watch-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
        // Remove synced record
        const deleteTx = db.transaction('pending-progress', 'readwrite');
        const deleteStore = deleteTx.objectStore('pending-progress');
        await deleteStore.delete(record.id);
      } catch {
        // Will retry on next sync
        break;
      }
    }
  } catch {
    // IndexedDB not available or no pending records
  }
}

function openProgressDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dakkho-progress-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-progress')) {
        db.createObjectStore('pending-progress', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ STRATEGY HELPERS ============

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext)) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Offline and no cache — return a basic offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network failed — try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
