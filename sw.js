const CACHE_NAME = 'meteo-velo-v2';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.jpg'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Force la mise à jour immédiate
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    // Nettoie l'ancienne mémoire quand il y a une mise à jour
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        })
    );
});

// Stratégie : Réseau d'abord, mémoire (cache) en secours
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});