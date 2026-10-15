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

const CACHE_VERSION = 'myprotec-online-v2.5.1';
const STATIC_CACHE = `myprotec-static-${CACHE_VERSION}`;


// Assets statiques essentiels mis en cache pour la rapidité de chargement
const STATIC_ASSETS = [
  './',
  'index.html',
  'jeu',
  'jeu.html',
  'badge-monochrome.png',
  'icons/badge-monochrome.png',
  'ecussons.html',
  'discord_callback.html',
  'landing.css',
  'styles.css',
  'app.js',
  'js/app.js',
  'manifest.json',
  'favicon.ico',
  'logo_myprotec.png',
  'logo_myprotec_icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-192x192.png',
  'icon-512x512.png',
  'icons/icon-16x16.png',
  'icons/icon-32x32.png',
  'icons/icon-48x48.png',
  'icons/icon-64x64.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-192x192.png',
  'icons/icon-256x256.png',
  'icons/icon-384x384.png',
  'icons/icon-512x512.png',
  'icons/icon-maskable-512x512.png',
  'js/supabase.js',
  'js/systems.js',
  'js/modals.js',
  'js/advanced_systems.js',
  'js/advanced_modals.js',
  'js/departements.js',
  'js/qrcode.min.js',
  'js/auth.js',
  'js/privacy.js',
  'js/ads.js',
  'js/notifications.js',
  'js/incidents.js',
  'js/personnel.js',
  'js/poles.js',
  'js/formations.js',
  'js/social.js',
  'js/conventions.js',
  'js/communication.js',
  'js/messaging.js',
  'js/admin.js',
  'js/locaux.js',
  'js/finances.js',
  'js/equipements.js',
  'js/cump.js',
  'js/pwa.js',
  'js/audio.js',
  'js/specialites.js',
  'js/crise_logistique.js',
  'js/glossaire.js',
  'js/signature.js',
  'js/onboarding.js',
  'js/tutorial.js',
  'js/veille_operationnelle.js',
  'js/multijoueur.js',
  'sons/notif.mp3',
  'sons/info.mp3',
  'sons/expire.mp3',
  'sons/erreur.mp3',
  'sons/attention.mp3',
  'sons/alerte_crise.mp3'
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

  // B. Navigation HTML principale & Scripts JS : Network-First obligatoire pour garantir le code à jour
  const isCodeAsset = request.destination === 'script' || request.destination === 'style' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  if (request.mode === 'navigate' || isCodeAsset) {
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
          // Si le réseau est coupé, renvoyer la ressource en cache
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === 'navigate') return caches.match('/index.html');
            return null;
          });
        })
    );
    return;
  }

  // C. Ne pas intercepter les requêtes cross-origin externes (CDN, tuiles, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // D. Assets statiques locaux (images, css, polices) : Stale-While-Revalidate
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

// 4. NOTIFICATIONS PUSH NATIVES W3C (MOBILITÉ & RÉVEIL TERMINAL APP FERMÉE)
// Conforme architecture officielle W3C Web Push RFC 8030 / RFC 8291 / RFC 8292

// Résolution absolue et sécurisée des URLs d'assets (compatible GitHub Pages en sous-dossier et localhost)
const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path.replace(/^\//, ''), self.registration.scope).href;
};

const DEFAULT_BADGE = getAssetUrl('badge-monochrome.png');
const DEFAULT_ICON = getAssetUrl('badge-monochrome.png');

self.addEventListener('push', (event) => {
  let payload = {
    title: '🚨 ALERTE MYPROTEC',
    body: 'Mobilisation opérationnelle demandée !',
    icon: DEFAULT_ICON,
    badge: DEFAULT_BADGE,
    tag: `protec-alert-${Date.now()}`,
    data: { url: 'jeu.html' },
    actions: [
      { action: 'action_open', title: '📍 Voir l\'Intervention' },
      { action: 'action_dispo', title: '✅ Disponible' }
    ]
  };

  if (event.data) {
    try {
      const json = event.data.json();
      payload = Object.assign(payload, json);
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body || payload.message || 'Intervention ou devis en attente.',
    icon: payload.icon ? getAssetUrl(payload.icon) : DEFAULT_ICON,
    badge: payload.badge ? getAssetUrl(payload.badge) : DEFAULT_BADGE,
    vibrate: [500, 200, 500, 200, 1000, 300, 1000], // Séquence vibratoire d'urgence
    sound: getAssetUrl('sons/alerte_crise.mp3'),
    tag: payload.tag || `protec-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: payload.data || { url: 'jeu.html' },
    actions: payload.actions || [
      { action: 'action_open', title: '📍 Voir l\'Intervention' },
      { action: 'action_dispo', title: '✅ Disponible' }
    ]
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const isForeground = clientList && clientList.some(c => c.visibilityState === 'visible' && c.focused);
      if (isForeground) {
        // Si l'application est déjà ouverte et au premier plan actif : propager au jeu
        clientList.forEach(c => {
          c.postMessage({ type: 'PUSH_NOTIFICATION_RECEIVED', data: payload });
        });
        return;
      }

      // Application FERMÉE ou écran verrouillé : réveil OS natif immédiat
      return self.registration.showNotification(payload.title || '🚨 ALERTE MYPROTEC', notificationOptions);
    })
  );
});

// Clic sur une notification push sur l'écran verrouillé ou dans le centre de notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const rawUrl = event.notification.data?.url || 'jeu.html';
  const targetUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
    ? rawUrl
    : new URL(rawUrl.replace(/^\//, ''), self.registration.scope).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Si une fenêtre du jeu est déjà ouverte, la focaliser
      for (const client of clientList) {
        if (client.url && (client.url.includes('jeu') || client.url.includes(self.registration.scope))) {
          if ('focus' in client) {
            if (action) {
              client.postMessage({ type: 'NOTIFICATION_ACTION_CLICKED', action, data: event.notification.data });
            }
            return client.focus();
          }
        }
      }
      // 2. Sinon ouvrir la fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});


// 5. GESTION DES MESSAGES DEPUIS L'APPLICATION & SYNC ARRIÈRE-PLAN
const SUPABASE_URL = 'https://yrayehhbqcnuiuejqsjz.supabase.co';
const SUPABASE_KEY = 'sb_publishable__SL5mXhQJBnyBBxgJJajXw_tCxJzlPs';

let currentUserId = null;
let currentUsername = 'Directeur';

async function checkPendingSupabaseAlerts() {
  if (!currentUserId || currentUserId === 'local') return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?user_id=eq.${encodeURIComponent(currentUserId)}&select=save_data`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) return;
    const records = await res.json();
    if (!Array.isArray(records) || records.length === 0) return;

    const saveData = records[0].save_data || {};
    const pending = saveData.pending_notifications || [];

    if (pending.length === 0) return;

    // Vérifier si une fenêtre est ouverte et visible
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const isForeground = clientList && clientList.some(c => c.visibilityState === 'visible' && c.focused);

    for (const notif of pending) {
      if (isForeground) {
        clientList.forEach(c => {
          c.postMessage({ type: 'PUSH_NOTIFICATION_RECEIVED', data: notif });
        });
      } else {
        await self.registration.showNotification(notif.title || '🚨 Alerte Protection Civile', {
          body: notif.body || notif.message || 'Nouvelle notification opérationnelle.',
          icon: notif.icon ? getAssetUrl(notif.icon) : DEFAULT_ICON,
          badge: notif.badge ? getAssetUrl(notif.badge) : DEFAULT_BADGE,
          tag: notif.tag || `protec-pending-${Date.now()}`,
          vibrate: [300, 150, 300, 150, 450],
          renotify: true,
          requireInteraction: true,
          data: notif.data || { url: 'jeu.html' }
        });
      }
    }

    // Purger les notifications traitées dans Supabase
    saveData.pending_notifications = [];
    await fetch(`${SUPABASE_URL}/rest/v1/game_saves?user_id=eq.${encodeURIComponent(currentUserId)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ save_data: saveData })
    });
  } catch (err) {
    console.warn('[SW] Erreur vérification alertes Supabase:', err);
  }
}

self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Enregistrement de l'utilisateur actif
  if (event.data.type === 'SET_CURRENT_USER' && event.data.user) {
    currentUserId = event.data.user.id;
    currentUsername = event.data.user.username;
    checkPendingSupabaseAlerts();
  }

  // Planification d'une alerte si l'utilisateur quitte ou ferme l'application
  if (event.data.type === 'SCHEDULE_BACKGROUND_ALERT') {
    const delayMs = Number(event.data.delayMs) || 180000;
    const alertData = event.data.data || {
      title: '🚨 Alerte 15 : VPSP Requis',
      body: 'Le SAMU demande une ambulance de votre antenne. Reprenez votre service !',
      url: 'jeu.html'
    };

    // Vérifier également immédiatement la file d'attente
    checkPendingSupabaseAlerts();

    const timerId = setTimeout(() => {
      // Vérifier les notifications en attente Supabase en priorité
      checkPendingSupabaseAlerts().finally(() => {
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          const isForeground = clientList && clientList.some(c => c.visibilityState === 'visible' && c.focused);
          if (isForeground) return;

          self.registration.showNotification(alertData.title, {
            body: alertData.body,
            icon: alertData.icon ? getAssetUrl(alertData.icon) : DEFAULT_ICON,
            badge: alertData.badge ? getAssetUrl(alertData.badge) : DEFAULT_BADGE,
            tag: `protec-bg-${Date.now()}`,
            vibrate: [300, 150, 300, 150, 450],
            renotify: true,
            requireInteraction: true,
            data: { url: alertData.url || 'jeu.html' }
          });
        });
      });
    }, delayMs);

    backgroundAlertTimers.push(timerId);
  }

  // Annulation si l'utilisateur est revenu sur le jeu
  if (event.data.type === 'CANCEL_BACKGROUND_ALERTS') {
    backgroundAlertTimers.forEach(id => clearTimeout(id));
    backgroundAlertTimers = [];
  }
});

// Écouteurs de synchronisation en arrière-plan (PWA mobile installée)
self.addEventListener('sync', (event) => {
  if (event.tag === 'protec-sync-alerts') {
    event.waitUntil(checkPendingSupabaseAlerts());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'protec-alerts-sync') {
    event.waitUntil(checkPendingSupabaseAlerts());
  }
});

