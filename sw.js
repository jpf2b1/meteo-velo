const CACHE_NAME = 'meteo-velo-v1';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
    // Interception du fichier envoyé via le menu "Partager" du téléphone
    if (event.request.method === 'POST' && event.request.url.endsWith('/share-target')) {
        event.respondWith((async () => {
            try {
                const formData = await event.request.formData();
                const file = formData.get('file');
                
                if (file) {
                    const gpxText = await file.text();
                    
                    // Sauvegarde du GPX partagé dans IndexedDB
                    await new Promise((resolve, reject) => {
                        const request = indexedDB.open('MeteoVeloDB', 1);
                        request.onupgradeneeded = (e) => e.target.result.createObjectStore('gpxStore');
                        request.onsuccess = (e) => {
                            const db = e.target.result;
                            const tx = db.transaction('gpxStore', 'readwrite');
                            tx.objectStore('gpxStore').put(gpxText, 'last_gpx');
                            tx.oncomplete = () => resolve();
                        };
                        request.onerror = reject;
                    });
                }
                // Redirection vers l'appli en lui signalant qu'un fichier partagé est prêt
                return Response.redirect('/?shared=true', 303);
            } catch (error) {
                console.error("Erreur lors de la réception du fichier partagé :", error);
                return Response.redirect('/', 303);
            }
        })());
    } else {
        // Comportement classique pour les autres requêtes (pas de cache forcé ici pour simplifier)
        event.respondWith(fetch(event.request));
    }
});