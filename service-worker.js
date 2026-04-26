const CACHE_NAME = 'synthstation-static-v1';
const CORE_PRECACHE_URLS = [
  './manifest.webmanifest',
  './assets/app-icon/icon.svg',
  './assets/app-icon/icon-192.svg',
  './assets/app-icon/icon-512.svg',
  './assets/jetbrains-mono/JetBrainsMono-wght.ttf',
  './assets/fraunces/Fraunces-SOFT-WONK-opsz-wght.ttf'
];
const ENTRY_CANDIDATES = ['./', './index.html', './synthstation.html'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(CORE_PRECACHE_URLS);
      // Entry file name may change; cache whichever candidate URLs resolve.
      await Promise.all(
        ENTRY_CANDIDATES.map(url => cache.add(url).catch(() => null))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(oldKey => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        // Only cache successful same-origin basic responses.
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      });
    })
  );
});
