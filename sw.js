const CACHE_NAME = 'meteo-velo-v3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
      await clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Interception du fichier envoyé via le menu "Partager" de Komoot / Fichiers
  if (event.request.method === 'POST' && url.pathname.includes('share-target')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('file');

        if (file) {
          const gpxText = await file.text();

          await new Promise((resolve, reject) => {
            const request = indexedDB.open('MeteoVeloDB', 1);
            request.onupgradeneeded = (e) => {
              if (!e.target.result.objectStoreNames.contains('gpxStore')) {
                e.target.result.createObjectStore('gpxStore');
              }
            };
            request.onsuccess = (e) => {
              const db = e.target.result;
              const tx = db.transaction('gpxStore', 'readwrite');
              tx.objectStore('gpxStore').put(gpxText, 'last_gpx');
              tx.oncomplete = () => resolve();
              tx.onerror = () => reject(tx.error);
            };
            request.onerror = () => reject(request.error);
          });
        }

        return Response.redirect('./?shared=true', 303);
      } catch (error) {
        console.error('Erreur lors de la réception du fichier partagé :', error);
        return Response.redirect('./', 303);
      }
    })());
    return;
  }

  // 2. Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // 3. Toujours privilégier le réseau pour le Worker météo et les API externes (IGN / tuiles / CDN)
  const estRequeteExterneOuWorker =
    url.origin !== self.location.origin ||
    url.hostname.includes('workers.dev');

  if (estRequeteExterneOuWorker) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. Stratégie "Network First" avec repli sur le cache pour les fichiers de l'application
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        throw error;
      }
    })()
  );
});