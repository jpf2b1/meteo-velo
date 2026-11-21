// Nom de la "mémoire" (le cache). En changeant 'v6', on force les téléphones à télécharger la mise à jour
const CACHE_NAME = 'meteo-velo-v6';

// Liste des fichiers que le navigateur doit garder en mémoire pour que l'appli fonctionne vite (et hors ligne)
const urlsToCache = [
    '/meteo-velo/',
    '/meteo-velo/index.html',
    '/meteo-velo/manifest.json',
    '/meteo-velo/icon-192.png',
    '/meteo-velo/icon-512.png'
];

// Phase 1 : Installation (Téléchargement des fichiers définis au dessus)
self.addEventListener('install', event => {
    // Force l'installation immédiate de cette nouvelle version
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// Phase 2 : Activation (Nettoyage de l'ancienne mémoire)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                // Si l'ancienne mémoire (v5, v4...) ne correspond pas au nom actuel (v6), on la supprime
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        })
    );
});

// Phase 3 : Fetch (Interception du réseau quand l'utilisateur navigue)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Si le fichier demandé est dans notre mémoire cache, on le donne, sinon on va le chercher sur internet
            return response || fetch(event.request);
        })
    );
});