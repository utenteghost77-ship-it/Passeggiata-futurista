// ── PASSEGGIATA FUTURISTA — Service Worker ──────────
const CACHE_NAME = 'passeggiata-futurista-v1';

// Risorse locali da mettere in cache subito (app shell)
const PRECACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,900;1,400;1,600&family=Playfair+Display:ital,wght@0,700;1,700&display=swap'
];

// ── INSTALL: pre-cacha le risorse core ─────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── ACTIVATE: rimuovi cache vecchie ────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: strategia Network-first per audio/img esterni,
//           Cache-first per risorse locali ───────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Risorse esterne (Dropbox, Imgur, Google Fonts): network-first, fallback cache
  const isExternal = !url.origin.includes(self.location.origin);
  if (isExternal) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Metti in cache solo risposte valide (no audio stream parziali)
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Risorse locali: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
