// Service Worker — La To Do du Bonheur
// La version doit correspondre à celle affichée dans todo.html
// → changer CACHE_VERSION force le rechargement sur tous les clients
const CACHE_VERSION = 'tdb-v5.12';
const ASSETS = [
  '/tdb/todo.html',
  '/tdb/manifest.json',
  '/tdb/icon-192.png',
  '/tdb/icon-512.png',
];

// Installation : mise en cache des assets statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
  );
  // Prend le contrôle immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

// Activation : supprime les anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch : network-first pour todo.html (toujours la dernière version),
// cache-first pour les assets statiques (icônes, manifest)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Requêtes GitHub API et externes → toujours réseau, jamais cache
  if (!url.origin.includes('github.io')) {
    return;
  }

  // todo.html → network-first : on essaie le réseau, fallback cache si offline
  if (url.pathname.endsWith('todo.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Autres assets (icônes, manifest) → cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
