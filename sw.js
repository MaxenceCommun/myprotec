/**
 * PROTEC LIVE / MYPROTEC - SERVICE WORKER PWA OFFICIEL
 * Conforme PWA Progressive Web App & W3C
 * 
 * Fonctionnalités :
 * 1. Mode Hors-Ligne & Cache Storage API (Assets, Scripts, Tuiles Carto)
 * 2. Stratégies intelligentes (Network-First pour navigation, Stale-While-Revalidate pour statiques & CDN)
 * 3. Cache tuiles Leaflet pour navigation cartographique fluide hors-ligne
 * 4. Gestion Web Push Notifications & interactions système
 */

const CACHE_VERSION = 'myprotec-pwa-v1.4.1';
const STATIC_CACHE = `myprotec-static-${CACHE_VERSION}`;
const TILES_CACHE = 'myprotec-tiles-v1';
const MAX_TILE_ENTRIES = 250; // Limite pour ne pas saturer le stockage

// Assets essentiels pré-chargés lors de l'installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/logo_myprotec.png',
  '/logo_myprotec_icon.png',
  '/js/supabase.js',
  '/js/systems.js',
  '/js/modals.js',
  '/js/advanced_systems.js',
  '/js/advanced_modals.js',
  '/js/departements.js',
  '/js/auth.js',
  '/js/privacy.js',
  '/js/ads.js',
  '/js/notifications.js',
  '/js/incidents.js',
  '/js/personnel.js',
  '/js/poles.js',
  '/js/formations.js',
  '/js/social.js',
  '/js/admin.js',
  '/js/locaux.js',
  '/js/finances.js',
  '/js/equipements.js',
  '/js/cump.js',
  '/js/pwa.js',
  '/js/audio.js',
  '/js/specialites.js',
  '/js/crise_logistique.js',
  '/js/offline_engine.js'
];

// 1. INSTALLATION : Pré-mise en cache des ressources critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      console.log('[SW] Mise en cache des assets essentiels PWA...');
      // Tentative de mise en cache robuste (ignore individuellement si un CDN ou asset optionnel est indisponible)
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Pré-cache ignoré pour:', asset, err);
        }
      }
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATION : Nettoyage des versions antérieures de cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== STATIC_CACHE && key !== TILES_CACHE) {
            console.log('[SW] Suppression ancien cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. FETCH : Stratégies de cache avancées selon le type de requête
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET ou les requêtes d'API serveur dynamique
  if (request.method !== 'GET') {
    return;
  }

  // Ne pas intercepter les requêtes d'authentification ou API backend
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // A. Navigation principale (chargement de la page HTML / PWA Standalone) -> Network-First avec fallback cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            if (cached) return cached;
            return caches.match('/');
          });
        })
    );
    return;
  }

  // B. Tuiles Cartographiques (Leaflet OSM / ArcGIS / CartoDB) -> Cache-First avec Stale-While-Revalidate
  const isMapTile = (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.hostname.includes('arcgisonline.com') ||
    url.pathname.match(/\/\d+\/\d+\/\d+\.png$/)
  );

  if (isMapTile) {
    event.respondWith(
      caches.open(TILES_CACHE).then(async (tileCache) => {
        const cachedResponse = await tileCache.match(request);
        if (cachedResponse) {
          // Mise à jour en tâche de fond (stale-while-revalidate discret)
          fetch(request).then((freshResponse) => {
            if (freshResponse && freshResponse.status === 200) {
              tileCache.put(request, freshResponse);
            }
          }).catch(() => {/* Hors ligne, ignore */});
          return cachedResponse;
        }

        // Sinon récupérer en réseau et mettre en cache
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            tileCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Tuile non disponible en hors-ligne : renvoie vide ou fallback
          return new Response('', { status: 408, headers: { 'Content-Type': 'image/png' } });
        }
      })
    );
    return;
  }

  // C. Assets statiques locaux et CDN (CSS, JS, Fonts, Icons) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Erreur réseau : si on a du cache, il a déjà été renvoyé
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. NOTIFICATIONS PUSH (Déclenchées UNIQUEMENT si le jeu est COMPLÈTEMENT FERMÉ)
self.addEventListener('push', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // RÈGLE FORMELLE DE L'UTILISATEUR :
      // Inactivité = le joueur n'a VRAIMENT PAS le jeu ouvert (ni téléphone, ni PC, ni tablette).
      // Si au moins un onglet/fenêtre est ouvert sur cet appareil -> NE PAS ENVOYER de push notification !
      if (clientList && clientList.length > 0) {
        console.log('[SW Push] Notification bloquée : le jeu est actuellement ouvert.');
        return;
      }

      let data = {
        title: '🚨 Alerte Protection Civile',
        body: 'Une nouvelle intervention nécessite votre arbitrage ! Connectez-vous.',
        icon: 'logo_myprotec_icon.png',
        badge: 'logo_myprotec_icon.png',
        tag: 'protec-push-alert',
        data: { url: '/' }
      };

      if (event.data) {
        try {
          data = Object.assign(data, event.data.json());
        } catch (e) {
          data.body = event.data.text();
        }
      }

      return self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || 'logo_myprotec_icon.png',
        badge: data.badge || 'logo_myprotec_icon.png',
        tag: data.tag || 'protec-alert',
        vibrate: [300, 150, 300, 150, 400],
        renotify: true,
        requireInteraction: true,
        data: data.data || { url: '/' }
      });
    })
  );
});

// 5. CLIC SUR LES NOTIFICATIONS
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          if (event.notification.data?.action) {
            client.postMessage({
              type: 'NOTIFICATION_ACTION',
              action: event.notification.data.action,
              data: event.notification.data
            });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// 6. MESSAGES INTERNES & NOTIFICATIONS D'ARRIÈRE-PLAN LORS DE L'INACTIVITÉ RÉELLE
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Ne jamais afficher de push notification directe si le jeu est ouvert
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList && clientList.length > 0) {
        // Le jeu est ouvert -> pas de push système OS
        return;
      }
      const { title, options } = event.data;
      self.registration.showNotification(title, options);
    });
  }

  // Alertes planifiées pour l'absence du joueur (déclenchées uniquement si le jeu reste fermé)
  if (event.data && event.data.type === 'SCHEDULE_OFFLINE_ALERTS') {
    const alerts = event.data.alerts || [];
    alerts.forEach(item => {
      setTimeout(async () => {
        // VÉRIFICATION STRICTE DE L'INACTIVITÉ :
        // Le joueur n'a-t-il vraiment pas le jeu ouvert ?
        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        if (clientList && clientList.length > 0) {
          // Le joueur a le jeu ouvert sur cet appareil (PC, téléphone ou tablette) !
          // RÈGLE FORMELLE : Le joueur n'est PAS inactif -> NE PAS ENVOYER de push notification !
          console.log('[SW Schedule] Notification annulée : jeu ouvert.');
          return;
        }

        self.registration.showNotification(item.title, {
          body: item.body,
          icon: 'logo_myprotec_icon.png',
          badge: 'logo_myprotec_icon.png',
          tag: item.tag || `offline-${Date.now()}`,
          vibrate: [300, 150, 300, 150, 450],
          renotify: true,
          requireInteraction: true,
          data: item.data || { url: '/' }
        });
      }, item.delayMs);
    });
  }
});
