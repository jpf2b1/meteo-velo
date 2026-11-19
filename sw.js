const CACHE_NAME = 'meteo-velo-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Installation du service worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Interception des requêtes (permet de charger plus vite)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});