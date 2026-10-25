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

const CACHE_VERSION = 'myprotec-online-v3.0.2';
const STATIC_CACHE = `myprotec-static-${CACHE_VERSION}`;

// Tableau de suivi des minuteurs d'alerte en arrière-plan
let backgroundAlertTimers = [];


// Assets statiques essentiels mis en cache pour la rapidité de chargement
const STATIC_ASSETS = [
  './',
  'index.html',
  'jeu',
  'jeu.html',
  'badge-monochrome.png',
  'images/badges/ecusson_inconnu.png',
  'images/badges/ecusson_adherent_2027.png',
  'images/ecusson_adherent_2027.png',
  'js/ecussons.js',
  'ecussons.js',
  'icons/badge-monochrome.png',
  'ecussons.html',
  'discord_callback.html',
  'landing.css',
  'styles.css',
  'app.js',
  'js/app.js',
  'gameplay_config.js',
  'js/gameplay_config.js',
  'manifest.json',
  'favicon.ico',
  'logo_myprotec.png',
  'logo_myprotec_white.png',
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
  'js/base_live_scene.js',
  'js/locaux.js',
  'js/finances.js',
  'js/equipements.js',
  'js/cump.js',
  'js/pwa.js',
  'js/audio.js',
  'js/specialites.js',
  'js/health_infrastructures.js',
  'js/osm_poi_system.js',
  'js/dps_generator.js',
  'js/crise_logistique.js',
  'js/missions_logistiques.js',
  'js/glossaire.js',
  'js/signature.js',
  'js/onboarding.js',
  'js/tutorial.js',
  'js/veille_operationnelle.js',
  'js/multijoueur.js',
  'js/antenne_messages.js',
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

// Résolution absolue et sécurisée des URLs d'assets (compatible GitHub Pages et réveil OS)
const getAssetUrl = (path) => {
  if (!path) return 'https://myprotec.fr/badge-monochrome.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.replace(/^\//, '');
  return `https://myprotec.fr/${cleanPath}`;
};

const DEFAULT_ICON = 'https://myprotec.fr/badge-monochrome.png';
const DEFAULT_BADGE = 'https://myprotec.fr/badge-monochrome.png';

self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        title: '🚨 Alerte Opérationnelle MyProtec',
        body: event.data.text()
      };
    }
  }

  const title = payload.title || '🚨 ALERTE MYPROTEC';
  const body = payload.body || payload.message || 'Mobilisation opérationnelle demandée !';
  const icon = payload.icon ? getAssetUrl(payload.icon) : DEFAULT_ICON;
  const badge = payload.badge ? getAssetUrl(payload.badge) : DEFAULT_BADGE;
  const targetUrl = payload.data?.url || payload.url || '/jeu.html';

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: badge,
    vibrate: payload.vibrate || [200, 100, 200],
    tag: payload.tag || `protec-alert-${Date.now()}`,
    renotify: true,
    data: Object.assign({ url: targetUrl, title: title, body: body }, payload.data || {}),
    actions: payload.actions || [
      { action: 'action_open', title: '📍 Voir l’Intervention' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
      .catch((err) => {
        console.warn('[SW] showNotification échec avec options complètes, essai fallback simple:', err);
        return self.registration.showNotification(title, {
          body: body,
          icon: icon,
          data: { url: targetUrl, title: title, body: body }
        });
      })
      .then(() => {
        // Si une fenêtre est active en avant-plan, lui propager également l'événement en direct
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          clientList.forEach((c) => {
            try { c.postMessage({ type: 'PUSH_NOTIFICATION_RECEIVED', data: payload }); } catch (e) {}
          });
        });
      })
      .catch((err) => console.error('[SW] Erreur finale notification push:', err))
  );
});

// Clic sur une notification push sur l'écran verrouillé ou dans le centre de notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || '/jeu.html';
  const targetUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
    ? rawUrl
    : new URL(rawUrl.replace(/^\//, ''), self.registration.scope).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. Chercher si une fenêtre existante de l'application est déjà ouverte
      for (const client of clientList) {
        if (client.url && (client.url === targetUrl || client.url.includes('jeu') || client.url.includes(self.registration.scope))) {
          if ('focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_ACTION_CLICKED',
              action: event.action || 'click',
              data: {
                title: event.notification.title,
                body: event.notification.body,
                ...(event.notification.data || {})
              }
            });
            return client.focus();
          }
        }
      }
      // 2. Sinon ouvrir l'URL ciblée dans une nouvelle fenêtre/onglet
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});


// 5. GESTION DES MESSAGES DEPUIS L'APPLICATION & SYNC ARRIÈRE-PLAN
const SUPABASE_URL = 'https://yrayehhbqcnuiuejqsjz.supabase.co';
const SUPABASE_KEY = 'sb_publishable__SL5mXhQJBnyBBxgJJajXw_tCxJzlPs';
const USER_CACHE_KEY = 'protec-user-cache-v1';

let currentUserId = null;
let currentUsername = 'Directeur';

async function getStoredUserId() {
  if (currentUserId && currentUserId !== 'local') return currentUserId;
  try {
    const cache = await caches.open(USER_CACHE_KEY);
    const cached = await cache.match('/active-user-session');
    if (cached) {
      const parsed = await cached.json();
      if (parsed?.id) {
        currentUserId = parsed.id;
        currentUsername = parsed.username || currentUsername;
        return currentUserId;
      }
    }
  } catch (e) {}
  return currentUserId;
}

async function persistCurrentUser(user) {
  if (!user || !user.id) return;
  currentUserId = user.id;
  currentUsername = user.username || currentUsername;
  try {
    const cache = await caches.open(USER_CACHE_KEY);
    await cache.put(
      new Request('/active-user-session'),
      new Response(JSON.stringify({ id: user.id, username: user.username }), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (e) {}
}

async function checkPendingSupabaseAlerts() {
  const userId = await getStoredUserId();
  if (!userId || userId === 'local') return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?user_id=eq.${encodeURIComponent(userId)}&select=save_data`, {
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
          try { c.postMessage({ type: 'PUSH_NOTIFICATION_RECEIVED', data: notif }); } catch (e) {}
        });
      } else {
        await self.registration.showNotification(notif.title || '🚨 Alerte Protection Civile', {
          body: notif.body || notif.message || 'Nouvelle notification opérationnelle.',
          icon: notif.icon ? getAssetUrl(notif.icon) : DEFAULT_ICON,
          badge: notif.badge ? getAssetUrl(notif.badge) : DEFAULT_BADGE,
          tag: notif.tag || `protec-pending-${Date.now()}`,
          vibrate: [300, 150, 300, 150, 450],
          renotify: true,
          data: notif.data || { url: 'jeu.html' }
        }).catch(() => {
          return self.registration.showNotification(notif.title || '🚨 Alerte Protection Civile', {
            body: notif.body || notif.message || 'Nouvelle notification opérationnelle.',
            icon: DEFAULT_ICON
          });
        });
      }
    }

    // Purger les notifications traitées dans Supabase
    saveData.pending_notifications = [];
    await fetch(`${SUPABASE_URL}/rest/v1/game_saves?user_id=eq.${encodeURIComponent(userId)}`, {
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
    event.waitUntil(
      persistCurrentUser(event.data.user).then(() => checkPendingSupabaseAlerts())
    );
  }

  // Planification d'une alerte si l'utilisateur quitte ou ferme l'application
  if (event.data.type === 'SCHEDULE_BACKGROUND_ALERT') {
    // Purge préventive des anciens timers d'inactivité pour éviter l'accumulation en rafale
    backgroundAlertTimers.forEach(id => clearTimeout(id));
    backgroundAlertTimers = [];

    const delayMs = Number(event.data.delayMs) || 5000;
    const alertData = event.data.data || {
      title: '🚨 Alerte 15 : VPSP Requis',
      body: 'Le SAMU demande une ambulance de votre antenne. Reprenez votre service !',
      url: 'jeu.html'
    };

    const taskPromise = new Promise((resolve) => {
      const timerId = setTimeout(() => {
        checkPendingSupabaseAlerts().finally(() => {
          self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const isForeground = clientList && clientList.some(c => c.visibilityState === 'visible' && c.focused);
            if (isForeground) {
              resolve();
              return;
            }

            self.registration.showNotification(alertData.title, {
              body: alertData.body,
              icon: alertData.icon ? getAssetUrl(alertData.icon) : DEFAULT_ICON,
              badge: alertData.badge ? getAssetUrl(alertData.badge) : DEFAULT_BADGE,
              tag: 'protec-bg-inactivity',
              vibrate: [300, 150, 300, 150, 450],
              renotify: true,
              data: { url: alertData.url || 'jeu.html' }
            }).catch(() => {
              return self.registration.showNotification(alertData.title, {
                body: alertData.body,
                icon: DEFAULT_ICON
              });
            }).finally(resolve);
          }).catch(resolve);
        });
      }, delayMs);

      backgroundAlertTimers.push(timerId);
    });

    event.waitUntil(taskPromise);
  }

  // Planification d'alertes futures précises (Fin de mission, livraison colis, début de garde)
  if (event.data.type === 'SCHEDULE_FUTURE_ALERT') {
    const alert = event.data.alert;
    if (alert && alert.targetTime) {
      const delayMs = Math.max(100, alert.targetTime - Date.now());
      const timerId = setTimeout(() => {
        self.registration.showNotification(alert.title || '🚨 Protection Civile', {
          body: alert.body || 'Événement opérationnel à l\'antenne.',
          icon: alert.icon ? getAssetUrl(alert.icon) : DEFAULT_ICON,
          badge: alert.badge ? getAssetUrl(alert.badge) : DEFAULT_BADGE,
          tag: alert.tag || `protec-${alert.id || Date.now()}`,
          vibrate: [300, 150, 300, 150, 450],
          renotify: true,
          requireInteraction: true,
          data: alert.data || { url: 'jeu.html' }
        }).catch(() => {
          return self.registration.showNotification(alert.title || '🚨 Protection Civile', {
            body: alert.body || 'Événement opérationnel.',
            icon: DEFAULT_ICON
          });
        });
      }, delayMs);
      backgroundAlertTimers.push(timerId);
    }
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

