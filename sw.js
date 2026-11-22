const CACHE_NAME = 'meteo-velo-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => {
        // Met en cache les fichiers de base pour le mode hors-ligne
        return cache.addAll(['./', './index.html']); 
    }));
});

self.addEventListener('fetch', (event) => {
    // LE FAMEUX CORRECTIF : On laisse passer toutes les requêtes POST vers internet
    if (event.request.method !== 'GET') {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});