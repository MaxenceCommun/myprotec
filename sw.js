/**
 * PROTEC LIVE - SERVICE WORKER OFFICIEL
 * Gestion des Push Notifications d'urgence en arrière-plan, clics de reconnexion
 * et planificateur d'engagement pour inciter le joueur à revenir.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Gestion des clics sur les notifications système
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focaliser
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
      // Sinon, ouvrir une nouvelle fenêtre vers le jeu
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Réception d'un événement Web Push (Serveur Push distant si configuré)
self.addEventListener('push', (event) => {
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

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || 'logo_myprotec_icon.png',
      badge: data.badge || 'logo_myprotec_icon.png',
      tag: data.tag || 'protec-alert',
      vibrate: [300, 150, 300, 150, 400],
      renotify: true,
      requireInteraction: true,
      data: data.data || { url: '/' }
    })
  );
});

// Écoute des messages venant du jeu (pour affichage de notification délégué)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
