/**
 * PROTEC LIVE / MYPROTEC - SERVICE WORKER PWA (MODE 100% EN LIGNE CONNECTÉ)
 * 
 * RÔLE UNIQUE : Cache des assets statiques (styles, scripts de base, logos, images)
 * pour optimiser les performances de chargement et permettre l'installation PWA.
 * 
 * RÈGLE ARCHITECTURALE FORMELLE :
 * - Le jeu est 100% EN LIGNE et CONNECTÉ. Aucun mode dégradé hors ligne.
 * - Les APIs, requêtes Supabase et données dynamiques ne sont JAMAIS interceptées ni mises en cache.
 * - En cas de coupure réseau, le client bloque immédiatement l'accès au jeu.
 */

const CACHE_VERSION = 'myprotec-online-v2.0.0';
const STATIC_CACHE = `myprotec-static-${CACHE_VERSION}`;

// Assets statiques essentiels mis en cache pour la rapidité de chargement
const STATIC_ASSETS = [
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
  '/js/conventions.js',
  '/js/communication.js',
  '/js/messaging.js',
  '/js/admin.js',
  '/js/locaux.js',
  '/js/finances.js',
  '/js/equipements.js',
  '/js/cump.js',
  '/js/pwa.js',
  '/js/audio.js',
  '/js/specialites.js',
  '/js/crise_logistique.js',
  '/js/glossaire.js',
  '/js/signature.js',
  '/js/onboarding.js',
  '/js/tutorial.js',
  '/js/veille_operationnelle.js',
  '/js/multijoueur.js'
];

// 1. INSTALLATION : Mise en cache des assets statiques pour accélérer le premier rendu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      console.log('[SW 100% En Ligne] Mise en cache des assets statiques...');
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Pré-cache ignoré pour:', asset);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATION : Purge des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== STATIC_CACHE) {
            console.log('[SW] Nettoyage ancien cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH : Stratégie stricte de performance statique sans aucun mode hors ligne
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // A. EXCLUSION TOTALE : Requêtes non-GET, APIs serveur, Supabase Cloud ou WebSockets
  // Ces requêtes doivent TOUJOURS passer directement par le réseau sans cache.
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return; // Laisser le réseau natif traiter la requête
  }

  // B. Navigation HTML principale : Network-First obligatoire pour garantir le code à jour
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Si le réseau est coupé, renvoyer la page en cache (qui affichera immédiatement l'écran de blocage hors-ligne)
          return caches.match('/index.html');
        })
    );
    return;
  }

  // C. Ne pas intercepter les requêtes cross-origin externes (CDN, tuiles, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // D. Assets statiques locaux : Cache avec mise à jour en tâche de fond (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. NOTIFICATIONS PUSH (Optionnelles si le jeu est fermé sur le terminal)
self.addEventListener('push', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList && clientList.length > 0) return; // Jeu ouvert : pas de notification externe

      let data = {
        title: '🚨 Alerte Protection Civile',
        body: 'Nouvelle sollicitation opérationnelle en attente de validation.',
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
        data: data.data || { url: '/' }
      });
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
