/**
 * PROTEC LIVE - GESTIONNAIRE COMPLET DE PUSH NOTIFICATIONS & ENGAGEMENT
 * - Service Worker natif (Arrière-plan PC & Smartphone)
 * - Sons opérationnels 2-tons et vibrations haptiques
 * - Alertes d'interventions en direct (SAMU 15, Pompiers, Devis DPS, Candidatures)
 * - Moteur d'incitation à la reconnexion périodique lors des absences du joueur
 * - Résolution précise des cibles d'ouverture et masquage strict des boutons s'il n'y a rien à ouvrir.
 */

window.ProtecNotifications = {
  swRegistration: null,
  permission: 'default',
  inactivityTimer: null,
  inactivityIntervalSec: 180, // 3 minutes d'absence pour la première alerte de rappel
  history: [],
  activeTab: 'history',
  lastUserInteraction: Date.now(),
  pushSubscription: null,
  vapidPublicKey: null,

  // Identifiant unique de cette fenêtre de jeu
  instanceId: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  async getServiceWorkerRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        const swUrl = new URL('sw.js', window.location.href).href;
        const swScope = new URL('./', window.location.href).pathname;
        reg = await navigator.serviceWorker.register(swUrl, { scope: swScope });
      }
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      return reg;
    } catch (e) {
      console.warn('[WebPush] Erreur getServiceWorkerRegistration:', e);
      return null;
    }
  },

  async subscribeUserToPush(onProgress) {
    const log = (msg) => {
      console.log('[WebPush]', msg);
      if (typeof onProgress === 'function') onProgress(msg);
    };

    if (typeof window === 'undefined') {
      return { success: false, message: 'Environnement non-navigateur' };
    }

    log('Vérification compatibilité navigateur...');
    if (!('serviceWorker' in navigator)) {
      return { success: false, message: 'Les Service Workers ne sont pas supportés sur ce navigateur' };
    }

    if (!('PushManager' in window)) {
      return {
        success: false,
        message: "PushManager indisponible. Sur iPhone/iPad, installez d'abord l'application sur l'écran d'accueil."
      };
    }

    try {
      // 1. Demande de permission native au système OS
      log('Demande de permission de notification au système...');
      const permission = await Notification.requestPermission();
      this.permission = permission;
      log(`Permission accordée : ${permission}`);
      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Permission de notification refusée. Activez-la dans les réglages du navigateur.'
        };
      }

      // 2. Enregistrement ou récupération du Service Worker
      log('Initialisation du Service Worker W3C...');
      let registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        throw new Error('Impossible d\'enregistrer le Service Worker');
      }
      this.swRegistration = registration;

      // 3. Clé VAPID officielle W3C (identique à Site Protec)
      let vapidPublicKey = 'BHB8wWHGzna7sB2I7J17-BWXzyfcQFlqDoOxL27ZrVewvMHP6P7vl7YFvOhVV3wB4ZvHQNbYs7m7xB_Rj2tZa0Y';
      try {
        const keyRes = await fetch('/api/push/key');
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (keyData.publicKey) vapidPublicKey = keyData.publicKey;
        }
      } catch (e) {}

      this.vapidPublicKey = vapidPublicKey;
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // 4. Vérifier si l'appareil a déjà une souscription active
      log('Vérification de la souscription PushManager existante...');
      let subscription = null;
      try {
        subscription = await registration.pushManager.getSubscription();
      } catch (e) {
        log(`Note: getSubscription a renvoyé : ${e?.message}`);
      }

      // 5. Création de la souscription auprès de Google FCM / Apple APNs
      if (!subscription) {
        log('Attente de l\'activation complète du Service Worker...');
        if (!registration.active) {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise(res => setTimeout(res, 2500))
          ]).catch(() => null);
          const updatedReg = await this.getServiceWorkerRegistration();
          if (updatedReg) registration = updatedReg;
        }

        log('Appel à pushManager.subscribe auprès des passerelles FCM / Apple...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        log('Souscription PushManager créée avec succès !');
      } else {
        log('Souscription existante retrouvée avec succès !');
      }

      this.pushSubscription = subscription;

      // 6. Sauvegarde locale dans localStorage pour réutilisation instantanée
      try {
        localStorage.setItem('protec_push_sub', JSON.stringify(subscription));
      } catch (e) {}

      // 7. Résolution du joueur
      let cachedUser = null;
      try {
        cachedUser = window.ProtecAuth?.currentUser || JSON.parse(localStorage.getItem('protec_user_profile') || '{}');
      } catch (e) {}

      const playerId = cachedUser?.id || (window.game?.player?.id) || 'local';
      const username = cachedUser?.username || (window.game?.player?.name) || 'Directeur';

      // 8. Transmission persistante dans la table Supabase push_subscriptions
      if (window.ProtecSupabase?.client) {
        try {
          const subJson = (typeof subscription.toJSON === 'function') ? subscription.toJSON() : subscription;
          await window.ProtecSupabase.client.from('push_subscriptions').upsert({
            endpoint: subscription.endpoint,
            user_id: (playerId && playerId !== 'local') ? playerId : null,
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || '',
            user_agent: navigator.userAgent,
            updated_at: new Date().toISOString()
          }, { onConflict: 'endpoint' });
          log('Abonnement synchronisé dans la table Supabase push_subscriptions.');
        } catch (eSupa) {
          console.warn('[WebPush] Erreur Supabase push_subscriptions:', eSupa);
        }

        // Sauvegarde miroir dans game_saves
        if (playerId && playerId !== 'local') {
          try {
            window.ProtecSupabase.client.from('game_saves').select('save_data').eq('user_id', playerId).maybeSingle().then(({ data }) => {
              if (data) {
                const sd = data.save_data || {};
                sd.push_subscription = (typeof subscription.toJSON === 'function') ? subscription.toJSON() : subscription;
                sd.push_updated_at = new Date().toISOString();
                window.ProtecSupabase.client.from('game_saves').update({ save_data: sd }).eq('user_id', playerId).then(() => {});
              }
            });
          } catch (e) {}
        }
      }

      // 9. Enregistrement auprès du serveur Node.js si actif
      try {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: (typeof subscription.toJSON === 'function') ? subscription.toJSON() : subscription,
            playerId,
            username,
            userAgent: navigator.userAgent
          })
        });
      } catch (e) {}

      // Informer le Service Worker du joueur actuel
      if (registration.active) {
        registration.active.postMessage({
          type: 'SET_CURRENT_USER',
          user: { id: playerId, username }
        });
      }

      this.config.enabled = true;
      this.saveConfig();
      this.updateHeaderUI();
      this.hideSubscriptionBanner();

      return {
        success: true,
        message: 'Push Notifications et Bip opérationnels sur ce téléphone !',
        subscription
      };
    } catch (error) {
      log(`ERREUR : ${error?.message || error}`);
      console.error('Erreur détaillée abonnement push:', error);
      return {
        success: false,
        message: error?.message || "Échec de l'abonnement push"
      };
    }
  },

  async syncPushSubscription(game) {
    return (await this.subscribeUserToPush()).subscription || null;
  },


  isDeviceMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth < 768 && ('ontouchstart' in window));
  },

  // Vérifie si le jeu est actuellement ouvert sur n'importe quel appareil (PC, téléphone ou tablette)
  isGameOpenOnAnyDevice() {
    return true;
  },

  // Contrôle de l'envoi de notification système OS (mobile et PC)
  shouldSendSystemNotification() {
    if (!('Notification' in window) && !this.swRegistration) return false;
    const perm = window.Notification ? Notification.permission : this.permission;
    if (perm !== 'granted') return false;
    if (!this.config.enabled) return false;
    return true;
  },

  // Configuration utilisateur (sauvegardée en localStorage)
  config: {
    enabled: true,
    sound: true,
    vibrate: true,
    samuAlerts: true,
    sdisAlerts: true,
    dpsAlerts: true,
    rhAlerts: true,
    weatherAlerts: true,
    inactivityEngagement: true
  },

  // Scénarios d'incitation à la reconnexion lorsque le joueur a quitté le jeu
  reengagementScenarios: [
    {
      title: 'Alerte 15 : Départ Réflexe VPSP Requis',
      body: 'Le SAMU 15 demande une ambulance de votre antenne pour un malaise grave sur la voie publique. Reconnectez-vous vite pour engager votre équipage !',
      tag: 'reengage-samu',
      condition: (game) => Boolean(game && game.samuConvention?.signed && game.samuGarde?.active && Array.isArray(game.missions) && game.missions.some(m => m.type === 'samu' && ['declenche', 'prealerte', 'ongoing'].includes(m.status)))
    },
    {
      title: 'Nouveau Devis : Sollicitation DPS en Attente',
      body: 'Des organisateurs d’événements ont transmis des devis DPS en attente de validation. Répondez avant la clôture !',
      tag: 'reengage-dps',
      condition: (game) => Boolean(game && Array.isArray(game.dpsQuotes) && game.dpsQuotes.some(q => q.status === 'pending' || q.status === 'received' || q.status === 'negotiation'))
    },
    {
      title: 'Recrutement : Candidature(s) en Attente',
      body: 'Des candidats bénévoles attendent leur entretien à l’antenne. Renforcez vos équipes opérationnelles !',
      tag: 'reengage-rh',
      condition: (game) => Boolean(game && Array.isArray(game.candidatures) && game.candidatures.filter(c => c.type !== 'salarie').length > 0)
    },
    {
      title: 'Recrutement : Nouvelle Candidature Reçue',
      body: 'Un bénévole qualifié vient de déposer sa candidature à l’antenne. Faites-lui passer son entretien pour renforcer vos équipes !',
      tag: 'reengage-rh-new',
      condition: (game) => Boolean(game && (!game.candidatures || game.candidatures.filter(c => c.type !== 'salarie').length < 4)),
      action: (game) => {
        if (game && typeof game.generateRandomCandidature === 'function') {
          game.generateRandomCandidature();
          if (typeof game.saveGame === 'function') game.saveGame();
        }
      }
    },
    {
      title: 'Bulletin Préfecture : Risque Météo Majeur',
      body: 'Météo-France place votre département en vigilance accrue. Les services de l’État pré-alertent votre antenne de Protection Civile !',
      tag: 'reengage-meteo',
      condition: (game) => Boolean(game && (typeof game.isFeatureUnlocked === 'function' ? game.isFeatureUnlocked('meteo') : true) && game.weather && ['jaune', 'orange', 'rouge'].includes((game.weather.vigilanceLevel || '').toLowerCase()))
    }

  ],

  // Initialisation du gestionnaire
  async init(game) {
    this.loadConfig();
    try {
      this.history = JSON.parse(localStorage.getItem('protec_notif_history') || '[]');
      // Dédoublonnage d'assainissement : ne conserver qu'une seule notification Trésorerie & Bilan par jour au maximum
      const seenBilanDays = new Set();
      this.history = this.history.filter(item => {
        if (item && item.title && item.title.includes('Trésorerie & Bilan')) {
          const dayKey = item.date || item.time || 'day';
          if (seenBilanDays.has(dayKey)) return false;
          seenBilanDays.add(dayKey);
        }
        return true;
      });
      localStorage.setItem('protec_notif_history', JSON.stringify(this.history));
    } catch (e) {
      this.history = [];
    }

    // 1. Détection de la permission actuelle
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }

    // 2. Enregistrement du Service Worker et synchronisation Web Push
    if ('serviceWorker' in navigator) {
      try {
        const reg = await this.getServiceWorkerRegistration();
        this.swRegistration = reg;

        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
            const d = event.data.data || {};
            if (window.game && typeof window.game.showToast === 'function') {
              window.game.showToast(d.title || '🚨 Alerte Reçue', d.body || d.message || '', d.type || 'orange');
            }
            this.playAlertSound(d.title, d.body);
            this.triggerVibration();
          }
        });

        if (this.permission === 'granted') {
          // Synchronisation automatique immédiate (fonctionne dès index.html)
          this.subscribeUserToPush();
        }

        // Vérification des notifications en attente dans Supabase
        this.checkPendingSupabaseNotifications();
      } catch (err) {
        console.warn('Erreur enregistrement Service Worker:', err);
      }
    }

    // 3. Mise à jour des badges visuels dans l'UI et affichage bannière W3C
    this.updateHeaderUI();
    this.checkAndRenderSubscriptionBanner();

    // 4. Écoute du cycle de vie de la page pour le moteur d'incitation
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden();
      } else {
        this.lastUserInteraction = Date.now();
        this.onPageVisible();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.onPageHidden();
    });

    // 5. Écouteurs de présence active pour ne pas notifier un joueur en pleine partie
    const onUserActive = () => {
      this.lastUserInteraction = Date.now();
      if (!this.isDeviceMobile()) {
        localStorage.setItem('protec_pc_heartbeat', Date.now().toString());
      }
    };

    ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
      window.addEventListener(evt, onUserActive, { passive: true });
    });

    // Vérification du bilan de trésorerie quotidien à 00h00 heure française
    setInterval(() => {
      this.checkMidnightDailyFinanceReport(window.game);
    }, 15000);

    // Heartbeat régulier
    setInterval(() => {
      if (!this.isDeviceMobile() && document.visibilityState === 'visible' && (Date.now() - this.lastUserInteraction < 45000)) {
        localStorage.setItem('protec_pc_heartbeat', Date.now().toString());
      }
    }, 10000);
  },

  // Bilan quotidien de trésorerie et d'activité envoyé à 00h00 heure française (une seule fois par jour)
  checkMidnightDailyFinanceReport(game) {
    if (!game) game = window.game;
    try {
      // Calcul sous le fuseau Europe/Paris (heure officielle française)
      const formatter = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(new Date());
      const p = {};
      parts.forEach(part => p[part.type] = part.value);

      const hour = parseInt(p.hour, 10);
      const minute = parseInt(p.minute, 10);
      const todayDateKey = `${p.year}-${p.month}-${p.day}`;

      // S'envoie UNIQUEMENT à 00h00 heure française (entre 00:00 et 00:01)
      if (hour !== 0 || minute !== 0) return;

      const lastSentDate = localStorage.getItem('protec_last_daily_finance_report');
      if (lastSentDate === todayDateKey) return; // Déjà envoyé pour aujourd'hui

      // Enregistrement strict de la date d'envoi pour zéro doublon
      localStorage.setItem('protec_last_daily_finance_report', todayDateKey);

      const moneyStr = (game && game.resources && game.resources.money !== undefined)
        ? `Trésorerie disponible : ${Math.round(game.resources.money).toLocaleString('fr-FR')} €.`
        : 'Consultez votre trésorerie et vos dotations !';

      this.recordNotification({
        title: 'Trésorerie & Bilan d’Activité',
        message: `Bilan quotidien de votre antenne à 00h00. ${moneyStr} Votre antenne est prête pour une nouvelle journée opérationnelle.`,
        category: 'finances',
        color: 'blue'
      });

      if (this.shouldSendSystemNotification()) {
        this.sendPushNotification(
          'Trésorerie & Bilan d’Activité',
          `Bilan quotidien à 00h00. ${moneyStr}`,
          { tag: `daily-finance-${todayDateKey}`, category: 'finances' }
        );
      }
    } catch (e) {
      console.warn('Erreur vérification bilan minuit:', e);
    }
  },

  // Bannière d'incitation à l'abonnement Push (conforme à PushSubscriptionBanner de Site Protec)
  checkAndRenderSubscriptionBanner() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (this.permission === 'granted' || sessionStorage.getItem('protec_push_banner_dismissed')) {
      this.hideSubscriptionBanner();
      return;
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone);

    let banner = document.getElementById('push-subscription-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'push-subscription-banner';
      banner.className = 'w-full bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-semibold shadow-md border-b border-red-500 z-50 transition-all duration-300';
      
      const targetContainer = document.getElementById('landing-referral-banner') || document.body.firstElementChild;
      if (targetContainer && targetContainer.parentNode) {
        targetContainer.parentNode.insertBefore(banner, targetContainer);
      } else {
        document.body.prepend(banner);
      }
    }

    if (isIos && !isStandalone) {
      // iPhone / iPad : instructions PWA requises par Apple
      banner.innerHTML = `
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-3 text-left">
          <div class="flex items-center gap-2.5">
            <span class="text-xl shrink-0">📱</span>
            <p class="text-[11px] sm:text-xs leading-snug">
              <strong>Bénévole sur iPhone :</strong> Pour recevoir les alertes d'urgence même application fermée, installez l'application : touchez <strong>Partager</strong> <span class="font-mono bg-white/20 px-1 rounded">⎋</span> en bas de Safari, puis <strong>« Sur l'écran d'accueil »</strong>.
            </p>
          </div>
          <button onclick="window.ProtecNotifications.dismissBanner()" class="text-white/80 hover:text-white text-xs underline shrink-0 cursor-pointer">
            Masquer
          </button>
        </div>
      `;
    } else {
      // Cas général Android & Ordinateur
      banner.innerHTML = `
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-base">🚨</div>
            <div>
              <p class="text-xs sm:text-sm font-black tracking-tight text-white">
                Activer les alertes de secours sur ce téléphone (même app fermée)
              </p>
              <p class="text-[11px] text-red-100 font-normal">
                Recevez les départs réflexes SAMU 15, gardes SDIS et devis DPS avec vibreur même téléphone verrouillé.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button onclick="window.ProtecNotifications.requestPermission()" class="bg-white text-red-900 hover:bg-red-50 font-black text-xs px-3.5 py-1.5 sm:py-2 rounded-xl shadow-sm border border-red-200 transition cursor-pointer flex items-center gap-1.5 shrink-0">
              <span>🔔 M'ABONNER AUX ALERTES</span>
            </button>
            <button onclick="window.ProtecNotifications.dismissBanner()" class="text-white/80 hover:text-white text-xs underline px-2 py-1 cursor-pointer">
              Plus tard
            </button>
          </div>
        </div>
      `;
    }
    banner.classList.remove('hidden');
  },

  dismissBanner() {
    sessionStorage.setItem('protec_push_banner_dismissed', 'true');
    this.hideSubscriptionBanner();
  },

  hideSubscriptionBanner() {
    const banner = document.getElementById('push-subscription-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  },

  // Chargement de la configuration
  loadConfig() {
    try {
      const saved = localStorage.getItem('protec_notif_config');
      if (saved) {
        this.config = Object.assign(this.config, JSON.parse(saved));
      }
    } catch (e) {}
  },

  // Sauvegarde de la configuration
  saveConfig() {
    try {
      localStorage.setItem('protec_notif_config', JSON.stringify(this.config));
    } catch (e) {}
    this.updateHeaderUI();
  },

  // Comptage des notifications non lues
  getUnreadCount() {
    return (this.history || []).filter(item => item && !item.read).length;
  },

  // Marquer toutes les notifications comme lues
  markAllAsRead() {
    let changed = false;
    (this.history || []).forEach(item => {
      if (item && !item.read) {
        item.read = true;
        changed = true;
      }
    });
    if (changed) {
      try {
        localStorage.setItem('protec_notif_history', JSON.stringify(this.history));
      } catch (e) {}
    }
    this.updateHeaderUI();
  },

  // Mise à jour de l'icône et des indicateurs visuels du header
  updateHeaderUI() {
    const unreadCount = this.getUnreadCount();
    const hasUnread = unreadCount > 0;
    const isGranted = (this.permission === 'granted' && this.config.enabled);
    const badge = document.getElementById('push-notif-badge');
    const badgeMobile = document.getElementById('push-notif-badge-mobile');
    const icon = document.getElementById('push-notif-icon');

    if (badge) {
      if (hasUnread) {
        badge.className = 'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white notif-badge-active';
      } else {
        badge.className = 'hidden';
      }
    }
    if (badgeMobile) {
      if (hasUnread) {
        badgeMobile.className = 'absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white notif-badge-active';
      } else {
        badgeMobile.className = 'hidden';
      }
    }
    if (icon) {
      icon.className = `w-3.5 h-3.5 transition-transform ${hasUnread ? 'text-red-500 font-black animate-bounce' : (isGranted ? 'text-amber-500 font-black' : 'text-slate-400')}`;
    }
  },

  // Demande d'autorisation de notifications native avec abonnement W3C immédiat
  async requestPermission() {
    const res = await this.subscribeUserToPush((msg) => {
      console.log('[PushRegister]', msg);
    });

    if (res.success) {
      this.permission = 'granted';
      this.config.enabled = true;
      this.saveConfig();
      this.updateHeaderUI();
      this.hideSubscriptionBanner();

      this.sendPushNotification(
        'Notifications MyProtec Activées',
        'Parfait ! Vous recevrez désormais les alertes SAMU 15, SDIS, devis DPS et rappels d’intervention en direct sur votre appareil, même lorsque l’application est fermée.',
        { tag: 'welcome-notification' }
      );

      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Notifications Activées', 'Alertes prêtes (y compris avec application fermée) !', 'green');
      }
      return true;
    } else {
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Autorisation Requise', res.message, 'orange');
      }
      return false;
    }
  },


  // Émission sonore opérationnelle (Intégration des sons MP3 officiels)
  playAlertSound(title = '', body = '', options = {}) {
    if (!this.config.sound) return;
    if (window.ProtecAudio) {
      if (typeof window.ProtecAudio.handleToastAudio === 'function' && (title || body)) {
        window.ProtecAudio.handleToastAudio(title, body, options.color || 'blue', options.target || null);
      } else if (typeof window.ProtecAudio.playInfoSound === 'function') {
        window.ProtecAudio.playInfoSound();
      }
    }
  },

  // Vibration tactile sur mobile
  triggerVibration() {
    if (!this.config.vibrate) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate([300, 150, 300, 150, 450]);
      } catch (e) {}
    }
  },

  // Résolution rigoureuse et vérification de la cible d'une notification
  // Retourne { type: string, id: string, label: string } s'il y a quelque chose à ouvrir, ou null s'il n'y a rien.
  resolveTarget(item, game) {
    if (!item || !game) return null;

    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();

    // 0. Filtrage immédiat des notifications purement informatives sans action ni écran associé
    const purelyInformativeWords = [
      'relevé copié', 'sauvegarde effectuée', 'partie sauvegardée', 'action impossible',
      'validation requise', 'limite d\'antenne', 'copié !', 'trésorerie insuffisante',
      'antenne réinitialisée', 'partie chargée', 'jeu en pause', 'vitesse normale', 'mode autonome'
    ];
    if (purelyInformativeWords.some(w => title.includes(w) || msg.includes(w))) {
      return null;
    }

    // 1. Cible explicite fournie
    if ((item.targetType === 'mission' || item.type === 'mission') && (item.targetId || item.id)) {
      let rawId = item.targetId || item.id;
      if (typeof rawId === 'string') rawId = rawId.replace(/^(sncf-|evt-|dps-|alert-)/, '');
      const exists = (game.missions || []).some(m => m.id === rawId);
      if (exists) {
        return { type: 'mission', id: rawId, label: 'Localiser & Gérer' };
      }
    }

    if (item.targetType === 'module' && item.targetId) {
      return { type: 'module', id: item.targetId, label: 'Consulter' };
    }

    if (item.targetType === 'station' && item.targetId) {
      return { type: 'station', id: item.targetId, label: 'Voir l\'antenne' };
    }

    // 2. Détection intelligente contextuelle basée sur les entités réelles en jeu
    // A. Mission active correspondante
    if (Array.isArray(game.missions)) {
      const matchedMission = game.missions.find(m => {
        if (!m || !m.title) return false;
        if (item.targetId && m.id === item.targetId) return true;
        const mt = m.title.toLowerCase();
        return title.includes(mt) || (mt.length > 8 && title.includes(mt.substring(0, 15)));
      });
      if (matchedMission) {
        return { type: 'mission', id: matchedMission.id, label: 'Voir l\'intervention' };
      }
    }

    // B. Devis / Sollicitations DPS
    if (title.includes('devis') || msg.includes('devis') || title.includes('organisateur') || item.category === 'dps') {
      return { type: 'module', id: 'devis', label: 'Consulter le devis' };
    }

    // C. Candidatures / Recrutement RH
    if (title.includes('candidat') || title.includes('recrutement') || msg.includes('candidature') || item.category === 'rh') {
      return { type: 'module', id: 'recrutement', label: 'Voir les candidatures' };
    }

    // D. SAMU 15 / Départs réflexes
    if (title.includes('samu') || title.includes('15') || item.category === 'samu') {
      const samuMission = (game.missions || []).find(m => m.type === 'samu' && ['declenche', 'prealerte', 'ongoing'].includes(m.status));
      if (samuMission) {
        return { type: 'mission', id: samuMission.id, label: 'Voir la sortie 15' };
      }
      return { type: 'module', id: 'samu', label: 'Ouvrir le SAMU' };
    }

    // E. SDIS 18 / Pompiers
    if (title.includes('sdis') || title.includes('pompier') || title.includes('18') || item.category === 'sdis') {
      const sdisMission = (game.missions || []).find(m => m.type === 'pompiers' && ['declenche', 'prealerte', 'ongoing'].includes(m.status));
      if (sdisMission) {
        return { type: 'mission', id: sdisMission.id, label: 'Voir la garde 18' };
      }
      return { type: 'module', id: 'pompiers', label: 'Ouvrir le SDIS' };
    }

    // F. Crise, NOVI, CUMP, Plan d'urgence
    if (title.includes('crise') || title.includes('novi') || title.includes('cai') || title.includes('cump') || title.includes('catastrophe')) {
      const crisisMission = (game.missions || []).find(m => (m.isCrisis || m.type === 'crise') && ['declenche', 'prealerte', 'ongoing'].includes(m.status));
      if (crisisMission) {
        return { type: 'mission', id: crisisMission.id, label: 'Voir l\'urgence' };
      }
      return { type: 'module', id: 'crise', label: 'Cellule de crise' };
    }

    // G. SNCF / Réseau Ferré & Naufragés du rail
    if (title.includes('sncf') || msg.includes('sncf') || title.includes('ferroviaire') || msg.includes('ferroviaire') || title.includes('gare') || msg.includes('gare')) {
      const sncfMission = (game.missions || []).find(m => m.alertOrigin === 'sncf' || (m.title && m.title.toLowerCase().includes('sncf')));
      if (sncfMission) {
        return { type: 'mission', id: sncfMission.id, label: 'Localiser la Mission SNCF' };
      }
    }

    // H. Météo & Vigilance
    if (title.includes('météo') || title.includes('meteo') || title.includes('vigilance') || item.category === 'weather' || item.category === 'meteo') {
      return { type: 'module', id: 'meteo', label: 'Bulletin météo' };
    }

    // H. Trésorerie & Comptabilité
    if (title.includes('trésorerie') || title.includes('comptable') || title.includes('finances') || title.includes('subvention') || item.category === 'finances') {
      return { type: 'module', id: 'finances', label: 'Voir la trésorerie' };
    }

    // I. Équipements & Matériel
    if (title.includes('équipement') || title.includes('matériel') || title.includes('qcpr') || title.includes('tenue') || item.category === 'equipements') {
      return { type: 'module', id: 'equipements', label: 'Voir les équipements' };
    }

    // J. Locaux & Aménagement
    if (title.includes('local') || title.includes('locaux') || title.includes('bâtiment') || title.includes('travaux') || item.category === 'locaux') {
      return { type: 'module', id: 'locaux', label: 'Gérer les locaux' };
    }

    // K. Flotte & Véhicules
    if (title.includes('véhicule') || title.includes('flotte') || title.includes('vpsp') || title.includes('vtu') || title.includes('réarmement')) {
      return { type: 'module', id: 'base', label: 'Gérer la flotte' };
    }

    // L. Formations grand public & internes
    if (title.includes('formation') || title.includes('psc1') || title.includes('sst') || item.category === 'formation') {
      return { type: 'module', id: 'formation', label: 'Voir les formations' };
    }

    // M. Pôle Social & Maraudes
    if (title.includes('social') || title.includes('maraude') || title.includes('115') || item.category === 'social') {
      return { type: 'module', id: 'social', label: 'Pôle social' };
    }

    // N. Alliance & Multijoueur
    if (title.includes('alliance') || title.includes('renfort') || title.includes('fédéral') || item.category === 'alliance') {
      return { type: 'module', id: 'alliance', label: 'Réseau alliance' };
    }

    // Si aucune cible valide et concrète n'a été identifiée : pas de lien fantôme !
    return null;
  },

  // Enregistrement d'une notification dans l'historique
  sanitizeMessage(msg) {
    if (typeof msg !== 'string') return msg;
    return msg
      .replace(/([,\s•\.\-]*[+\-]?\d+\s*(?:pts?|points?|%)\s*(?:de\s*)?(?:r[ée]putation|r[ée]put|popularit[ée]|morale?|motivation|coh[ée]sion|relations?)[^,\.\)]*)/gi, '')
      .replace(/\s*\([^\)]*(?:r[ée]putation|r[ée]put|moral|motivation)[^\)]*\)/gi, '')
      .replace(/(?:,\s*)?(?:baisse|perte)\s+(?:du\s+)?moral\s*(?:et\s*d[ée]gradation\s*de\s*la\s*r[ée]putation)?/gi, '')
      .replace(/(?:,\s*)?d[ée]gradation\s+de\s+la\s+r[ée]putation/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  },

  recordNotification(data) {
    if (!data) return;
    const item = {
      id: Date.now() + Math.random(),
      title: data.title || 'Notification',
      message: this.sanitizeMessage(data.message || data.body || ''),
      color: data.color || 'blue',
      category: data.category || 'general',
      targetType: data.targetType || (data.target && data.target.type) || null,
      targetId: data.targetId || (data.target && data.target.id) || null,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      read: false
    };
    this.history.unshift(item);
    if (this.history.length > 80) this.history = this.history.slice(0, 80);
    try {
      localStorage.setItem('protec_notif_history', JSON.stringify(this.history));
    } catch (e) {}

    const badge = document.getElementById('notif-history-count');
    if (badge) badge.textContent = this.history.length;

    this.updateHeaderUI();

    if (this.activeTab === 'history') {
      const listEl = document.getElementById('notif-history-list');
      if (listEl) this.renderHistoryList();
    }
  },

  // Clic direct sur une notification pour ouvrir l'information concernée
  handleNotificationClick(index) {
    const item = this.history[index];
    if (!item) return;

    const game = window.game;
    if (!game) return;

    const target = this.resolveTarget(item, game);
    if (!target) {
      // Aucune information spécifique à ouvrir : ne rien faire de trompeur
      return;
    }

    this.closeSettingsModal();
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    if (target.type === 'mission' && target.id) {
      game.openMissionDetails(target.id);
    } else if (target.type === 'module' && target.id) {
      if (target.id === 'recrutement') {
        game.showCandidaturesView = true;
        // Si aucune candidature bénévole n'est présente alors qu'une notification de candidature est cliquée,
        // on honore la notification en générant immédiatement un candidat qualifié !
        if (!game.candidatures || game.candidatures.filter(c => c.type !== 'salarie').length === 0) {
          if (typeof game.generateRandomCandidature === 'function') {
            game.generateRandomCandidature();
          }
        }
      }
      game.openModule(target.id);
    } else if (target.type === 'station' && target.id) {
      game.openStationDetails(target.id);
    }
  },

  clearHistory() {
    this.history = [];
    try {
      localStorage.removeItem('protec_notif_history');
    } catch (e) {}
    this.renderSettingsModalBody();
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.renderSettingsModalBody();
  },

  // Envoi d'une vraie notification Push système (Arrière-plan & Écran verrouillé)
  sendPushNotification(title, body, options = {}) {
    body = this.sanitizeMessage(body);
    // 1. Enregistre TOUJOURS dans le journal in-app
    this.recordNotification({ title, message: body, color: 'orange', category: options.category || 'push' });

    // 2. Contrôle strict de la pertinence de l'envoi système
    if (!this.shouldSendSystemNotification()) {
      return;
    }

    // 3. Son d'alerte et vibration
    this.playAlertSound(title, body, options);
    this.triggerVibration();

    const notifOptions = Object.assign({
      body: body,
      icon: options.icon || 'badge-monochrome.png',
      badge: options.badge || 'badge-monochrome.png',
      tag: options.tag || `protec-${Date.now()}`,
      vibrate: [300, 150, 300, 150, 450],
      renotify: true,
      requireInteraction: true,
      data: {
        url: window.location.href,
        timestamp: Date.now(),
        ...options.data
      }
    }, options);

    // Affichage via le Service Worker si actif
    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      try {
        this.swRegistration.showNotification(title, notifOptions);
        return;
      } catch (e) {
        console.warn('Erreur showNotification via Service Worker, fallback standard:', e);
      }
    }

    // Fallback standard via Notification API
    if ('Notification' in window) {
      try {
        const notif = new Notification(title, notifOptions);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Erreur notification standard:', e);
      }
    }
  },

  // Notification d'un événement selon sa catégorie
  notifyCategory(category, title, body, tag = 'alert') {
    if (!this.config.enabled) return;
    if (category === 'samu') {
      if (!this.config.samuAlerts) return;
      if (!window.game || !window.game.samuConvention || !window.game.samuConvention.signed) return;
    }
    if (category === 'sdis') {
      if (!this.config.sdisAlerts) return;
      if (!window.game || !window.game.sdisGarde || !window.game.sdisGarde.active) return;
    }
    if (category === 'dps' && !this.config.dpsAlerts) return;
    if (category === 'rh' && !this.config.rhAlerts) return;
    if ((category === 'weather' || category === 'meteo') && !this.config.weatherAlerts) return;

    this.sendPushNotification(title, body, { tag: `${category}-${tag}`, category: category });
  },

  // --- MOTEUR D'INCITATION À LA RECONNEXION & APP FERMÉE ---
  onPageHidden() {
    if (!this.config.inactivityEngagement || !this.config.enabled || this.permission !== 'granted') return;

    this.clearInactivityTimer();

    // 1. Minuteur local si l'onglet reste en veille en arrière-plan
    this.inactivityTimer = setTimeout(() => {
      const game = window.game;
      const eligible = this.reengagementScenarios.filter(s => {
        if (typeof s.condition === 'function') {
          return s.condition(game);
        }
        return true;
      });
      if (eligible.length === 0) return;
      const pick = eligible[Math.floor(Math.random() * eligible.length)];
      if (pick) {
        if (typeof pick.action === 'function') {
          pick.action(game);
        }
        this.sendPushNotification(pick.title, pick.body, { tag: pick.tag });
      }
    }, this.inactivityIntervalSec * 1000);

    // 2. Programmation Service Worker au niveau de l'OS (si l'application est TOTALEMENT FERMÉE)
    if (this.swRegistration && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_BACKGROUND_ALERT',
        delayMs: this.inactivityIntervalSec * 1000,
        data: {
          title: '🚨 Alerte SAMU 15 : VPSP Requis',
          body: 'Le SAMU 15 demande une ambulance de votre antenne. Touchez pour reprendre votre service !',
          url: '/jeu.html'
        }
      });
    }
  },

  onPageVisible() {
    this.clearInactivityTimer();
    // Annulation des alertes de réengagement puisque le joueur est revenu
    if (this.swRegistration && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CANCEL_BACKGROUND_ALERTS'
      });
    }
    this.checkPendingSupabaseNotifications();
  },

  // Récupération des notifications en attente stockées en BDD Supabase (réception dès l'ouverture du site ou reconnexion)
  async checkPendingSupabaseNotifications() {
    if (!window.ProtecSupabase?.client) return;
    let cachedUser = null;
    try {
      cachedUser = window.ProtecAuth?.currentUser || JSON.parse(localStorage.getItem('protec_user_profile') || '{}');
    } catch (e) {}
    if (!cachedUser || !cachedUser.id) return;

    try {
      const { data, error } = await window.ProtecSupabase.client
        .from('game_saves')
        .select('save_data')
        .eq('user_id', cachedUser.id)
        .maybeSingle();

      if (!error && data?.save_data?.pending_notifications) {
        const pending = data.save_data.pending_notifications;
        const lastSeen = Number(localStorage.getItem('protec_last_seen_notif') || 0);
        const unread = pending.filter(n => new Date(n.created_at).getTime() > lastSeen);

        if (unread.length > 0) {
          unread.forEach(n => {
            this.sendPushNotification(n.title || '🔔 Alerte MyProtec', n.message || n.body || '', {
              category: n.category || 'admin-test',
              color: n.type || 'orange'
            });
          });
          localStorage.setItem('protec_last_seen_notif', Date.now().toString());
        }
      }
    } catch (e) {}
  },

  clearInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  },

  // Test immédiat de notification (Bouton dans la modale)
  testNotification() {
    this.sendPushNotification(
      'Test Opérationnel VPSP',
      'Votre appareil reçoit bien les alertes d’urgence et notifications de rappel MyProtec.',
      { tag: 'test-direct-notif' }
    );
    if (window.game) {
      window.game.showToast('Test Envoyé', 'Vérifiez la bannière et le son d’alerte sur votre écran !', 'green');
    }
  },

  // Test avec application fermée ou mise en veille (compte à rebours)
  testOfflinePush(seconds = 5) {
    if (this.permission !== 'granted') {
      this.requestPermission();
      return;
    }
    if (window.game && typeof window.game.showToast === 'function') {
      window.game.showToast('Test App Fermée', `Fermez ou réduisez maintenant l'application. La notification arrivera dans ${seconds}s !`, 'orange');
    }
    if (this.swRegistration && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_BACKGROUND_ALERT',
        delayMs: seconds * 1000,
        data: {
          title: '🚨 Test Réussi : Application Fermée',
          body: 'Le Service Worker MyProtec a bien délivré cette alerte en arrière-plan avec sonnerie et vibreur !',
          url: '/jeu.html'
        }
      });
    }
  },

  // Ouverture de la modale de réglage des notifications et paramètres
  openSettingsModal(defaultTab = null) {
    if (defaultTab) {
      this.activeTab = defaultTab;
    }
    this.markAllAsRead();
    let modal = document.getElementById('notif-settings-modal');
    if (!modal) {
      this.createSettingsModalDOM();
      modal = document.getElementById('notif-settings-modal');
    }

    this.renderSettingsModalBody();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  },

  closeSettingsModal() {
    const modal = document.getElementById('notif-settings-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  // Création du DOM de la modale
  createSettingsModalDOM() {
    const div = document.createElement('div');
    div.id = 'notif-settings-modal';
    div.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm hidden items-center justify-center p-3 sm:p-4';
    div.innerHTML = `
      <div class="w-full max-w-lg rounded-3xl glass-panel-heavy border border-white/80 p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-pc-blue/10 text-pc-blue flex items-center justify-center text-lg font-black">
              <i data-lucide="settings" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Paramètres & Notifications</h3>
              <p class="text-[11px] text-slate-500 font-semibold">Affichage, popups d’acronymes, alertes d’urgence & journal</p>
            </div>
          </div>
          <button onclick="window.ProtecNotifications.closeSettingsModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div id="notif-settings-body"></div>
      </div>
    `;
    document.body.appendChild(div);
  },

  // Rendu de la liste d'historique avec conditionnement strict du bouton d'ouverture
  renderHistoryList() {
    const listEl = document.getElementById('notif-history-list');
    if (!listEl) return;

    if (this.history.length === 0) {
      listEl.innerHTML = `
        <div class="p-8 text-center glass-card rounded-2xl space-y-2">
          <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <i data-lucide="inbox" class="w-5 h-5"></i>
          </div>
          <div class="font-bold text-slate-700 text-sm">Aucune notification dans l'historique</div>
          <p class="text-[11px] text-slate-400 max-w-xs mx-auto">Toutes les alertes d'urgence, nouveaux devis, retours d'appels et messages reçus seront archivés ici.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const borderColors = {
      red: 'border-l-4 border-l-red-500 bg-red-50/20',
      orange: 'border-l-4 border-l-amber-500 bg-amber-50/20',
      amber: 'border-l-4 border-l-amber-500 bg-amber-50/20',
      green: 'border-l-4 border-l-emerald-500 bg-emerald-50/20',
      emerald: 'border-l-4 border-l-emerald-500 bg-emerald-50/20',
      blue: 'border-l-4 border-l-pc-blue bg-blue-50/20'
    };

    listEl.innerHTML = this.history.map((item, idx) => {
      const cardClass = borderColors[item.color] || 'border-l-4 border-l-slate-400 bg-slate-50/40';
      const target = this.resolveTarget(item, window.game);
      const hasTarget = !!target;

      return `
        <div ${hasTarget ? `onclick="window.ProtecNotifications.handleNotificationClick(${idx})"` : ''}
          class="p-3 rounded-2xl glass-card border border-slate-200/80 ${cardClass} shadow-sm space-y-1 ${hasTarget ? 'cursor-pointer hover:scale-[1.01] hover:shadow-md transition active:scale-[0.99]' : 'cursor-default'}"
          ${hasTarget ? `title="Cliquer pour ouvrir : ${target.label}"` : ''}>
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-slate-900 text-xs flex items-center gap-2">
              <span>${item.title}</span>
              ${hasTarget ? `
                <button onclick="event.stopPropagation(); window.ProtecNotifications.handleNotificationClick(${idx})"
                  class="text-[9px] text-pc-blue font-bold px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 transition flex items-center gap-1 shadow-xs">
                  <span>${target.label || 'Ouvrir'}</span>
                  <i data-lucide="arrow-right" class="w-2.5 h-2.5"></i>
                </button>
              ` : ''}
            </span>
            <span class="text-[10px] font-mono font-semibold text-slate-400">${item.time}</span>
          </div>
          <p class="text-[11px] text-slate-600 leading-snug">${item.message}</p>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  // Rendu du corps de la modale avec onglets Historique et Paramètres
  renderSettingsModalBody() {
    const body = document.getElementById('notif-settings-body');
    if (!body) return;

    const isHistory = (this.activeTab === 'history');
    const isPermGranted = (this.permission === 'granted');
    const isPermDenied = (this.permission === 'denied');

    body.innerHTML = `
      <div class="space-y-4 text-xs">
        <!-- Barre d'onglets : Journal d'Historique vs Paramètres & Options -->
        <div class="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div class="flex items-center gap-2">
            <button onclick="window.ProtecNotifications.switchTab('history')" class="px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${isHistory ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
              <span>Journal des Alertes</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-black ${isHistory ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}">${this.history.length}</span>
            </button>
            <button onclick="window.ProtecNotifications.switchTab('settings')" class="px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${!isHistory ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
              <i data-lucide="settings" class="w-3.5 h-3.5"></i>
              <span>Paramètres & Options</span>
            </button>
          </div>
          ${isHistory && this.history.length > 0 ? `
            <button onclick="window.ProtecNotifications.clearHistory()" class="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition flex items-center gap-1">
              <i data-lucide="trash-2" class="w-3 h-3"></i> Vider le journal
            </button>
          ` : ''}
        </div>

        ${isHistory ? `
          <!-- VUE 1 : HISTORIQUE DES NOTIFICATIONS -->
          <div id="notif-history-list" class="space-y-2 max-h-[60vh] overflow-y-auto pr-1"></div>
        ` : `
          <!-- VUE 2 : RÉGLAGES & PARAMÈTRES DU JEU -->
          <div class="space-y-4">
            <!-- SECTION 1 : INTERFACE & EXPÉRIENCE DE JEU -->
            <div class="space-y-2.5">
              <h4 class="font-black text-slate-700 uppercase tracking-wider text-[10px]">Interface & Affichage</h4>

              <!-- Sélecteur de Thème Visuel (Système, Clair, Foncé) -->
              <div class="p-3.5 rounded-2xl glass-card border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-xs">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="font-extrabold text-slate-800 dark:text-white block text-xs">Thème de l’interface</span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Choisissez entre l'apparence claire, sombre ou automatique calquée sur votre système.
                    </span>
                  </div>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                    ${(window.ProtecTheme?.getThemePreference() || 'system').toUpperCase()}
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-2 pt-1">
                  ${(() => {
                    const currentPref = window.ProtecTheme ? window.ProtecTheme.getThemePreference() : 'system';
                    const themes = [
                      { id: 'system', label: 'Système', icon: '💻', desc: 'Auto (OS)' },
                      { id: 'light', label: 'Clair', icon: '☀️', desc: 'Lumineux' },
                      { id: 'dark', label: 'Foncé', icon: '🌙', desc: 'Sombre' }
                    ];
                    return themes.map(th => {
                      const isActive = (currentPref === th.id);
                      return `
                        <button type="button" 
                          onclick="if(window.ProtecTheme) window.ProtecTheme.setThemePreference('${th.id}')"
                          class="p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                            isActive 
                              ? 'bg-pc-blue text-white border-pc-blue shadow-sm ring-2 ring-pc-blue/30 font-black' 
                              : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-bold'
                          }">
                          <span class="text-base leading-none">${th.icon}</span>
                          <span class="text-xs">${th.label}</span>
                          <span class="text-[9px] ${isActive ? 'text-blue-100' : 'text-slate-400'} font-normal">${th.desc}</span>
                        </button>
                      `;
                    }).join('');
                  })()}
                </div>
              </div>

              <label class="flex items-center justify-between p-3.5 rounded-2xl glass-card border border-slate-200 cursor-pointer hover:bg-slate-50/70 transition shadow-xs">
                <div class="pr-3">
                  <div class="flex items-center gap-2">
                    <span class="font-extrabold text-slate-800 block text-xs">Infobulles et popups d’acronymes</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-pc-blue/10 text-pc-blue font-bold">VPSP, CAI, PMA...</span>
                  </div>
                  <span class="text-[11px] text-slate-500 block leading-relaxed mt-0.5">
                    Affiche la définition complète au survol de la souris ou au clic sur les abréviations de la Protection Civile.
                  </span>
                </div>
                <input type="checkbox" id="setting-acronym-popups" ${(!window.ProtecGlossaire || window.ProtecGlossaire.isEnabled()) ? 'checked' : ''} onchange="if(window.ProtecGlossaire) window.ProtecGlossaire.setEnabled(this.checked); if(window.game) window.game.showToast('Paramètres', this.checked ? 'Popups d’acronymes activés' : 'Popups d’acronymes masqués', 'blue');" class="w-4 h-4 text-pc-blue rounded cursor-pointer flex-shrink-0" />
              </label>
            </div>

            <!-- SECTION 2 : NOTIFICATIONS PUSH & ALERTES SYSTÈME -->
            <div class="space-y-2.5 pt-1">
              <h4 class="font-black text-slate-700 uppercase tracking-wider text-[10px]">Alertes Opérationnelles Push</h4>
            <!-- Statut d'autorisation système -->
            <div class="p-4 rounded-2xl ${isPermGranted ? 'bg-emerald-50 border border-emerald-200' : (isPermDenied ? 'bg-rose-50 border border-rose-200' : 'bg-amber-50 border border-amber-200')} flex items-center justify-between">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full ${isPermGranted ? 'bg-emerald-500' : (isPermDenied ? 'bg-rose-500' : 'bg-amber-500 animate-pulse')}"></span>
                  <span class="font-extrabold ${isPermGranted ? 'text-emerald-900' : (isPermDenied ? 'text-rose-900' : 'text-amber-900')}">
                    ${isPermGranted ? 'Autorisation Push Activée' : (isPermDenied ? 'Autorisation Bloquée par le Navigateur' : 'Autorisation En Attente')}
                  </span>
                </div>
                <p class="text-[11px] ${isPermGranted ? 'text-emerald-700' : (isPermDenied ? 'text-rose-700' : 'text-amber-700')}">
                  ${isPermGranted 
                    ? 'Votre appareil est configuré pour recevoir les alertes même lorsque le jeu est en arrière-plan.' 
                    : (isPermDenied 
                      ? 'Pour activer les notifications, autorisez le site dans les paramètres de votre navigateur (icône cadenas).' 
                      : 'Cliquez ci-contre pour autoriser l’envoi des alertes opérationnelles.')}
                </p>
              </div>
              ${!isPermGranted && !isPermDenied ? `
                <button onclick="window.ProtecNotifications.requestPermission().then(() => window.ProtecNotifications.renderSettingsModalBody())" class="px-3.5 py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-extrabold shadow-md transition flex items-center gap-1.5 flex-shrink-0">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                  Autoriser
                </button>
              ` : ''}
            </div>

            <!-- Bouton Test Direct & Test App Fermée -->
            ${isPermGranted ? `
              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span class="font-bold text-slate-800 block">Vérifier le fonctionnement immédiat</span>
                  <span class="text-[11px] text-slate-500">Déclenche une notification test avec sonnerie d'urgence sur cet écran</span>
                </div>
                <button onclick="window.ProtecNotifications.testNotification()" class="px-3.5 py-1.5 rounded-xl bg-pc-orange hover:brightness-110 text-white font-extrabold shadow transition flex items-center gap-1.5">
                  <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i>
                  Tester
                </button>
              </div>

              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300/80">
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="font-black text-amber-950 block">Test Réception Mobile (App Fermée)</span>
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">Push OS</span>
                  </div>
                  <span class="text-[11px] text-amber-800 leading-snug">Lance un délai de 5s : fermez le navigateur ou verrouillez l'écran pour tester l'alerte native</span>
                </div>
                <button onclick="window.ProtecNotifications.testOfflinePush(5)" class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow transition flex items-center gap-1.5 flex-shrink-0">
                  <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
                  Fermer & Tester (5s)
                </button>
              </div>
            ` : ''}

            <!-- Paramètres Généraux -->
            <div class="space-y-2.5 pt-2">
              <h4 class="font-black text-slate-700 uppercase tracking-wider text-[10px]">Options Générales</h4>

              <label class="flex items-center justify-between p-3 rounded-2xl glass-card border border-slate-200 cursor-pointer">
                <div>
                  <span class="font-bold text-slate-800 block">Activer les Notifications Push</span>
                  <span class="text-[11px] text-slate-500">Réception des alertes sur le bureau et le mobile</span>
                </div>
                <input type="checkbox" id="notif-opt-enabled" ${this.config.enabled ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('enabled', this.checked)" class="w-4 h-4 text-pc-blue rounded cursor-pointer" />
              </label>

              <label class="flex items-center justify-between p-3 rounded-2xl glass-card border border-slate-200 cursor-pointer">
                <div>
                  <span class="font-bold text-slate-800 block">Sonnerie d'Alerte (2-tons radio)</span>
                  <span class="text-[11px] text-slate-500">Tonalité d'urgence lors d'un départ réflexe</span>
                </div>
                <input type="checkbox" id="notif-opt-sound" ${this.config.sound ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('sound', this.checked)" class="w-4 h-4 text-pc-blue rounded cursor-pointer" />
              </label>

              <label class="flex items-center justify-between p-3 rounded-2xl glass-card border border-slate-200 cursor-pointer">
                <div>
                  <span class="font-bold text-slate-800 block">Vibrations Tactiles (Mobile)</span>
                  <span class="text-[11px] text-slate-500">Séquence haptique de rappel d'urgence</span>
                </div>
                <input type="checkbox" id="notif-opt-vibrate" ${this.config.vibrate ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('vibrate', this.checked)" class="w-4 h-4 text-pc-blue rounded cursor-pointer" />
              </label>
            </div>

            <!-- Moteur d'engagement périodique (Inactivité) -->
            <div class="space-y-2.5 pt-2">
              <h4 class="font-black text-slate-700 uppercase tracking-wider text-[10px]">Rappels d’Incitation & Reconnexion</h4>

              <label class="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                <div>
                  <span class="font-bold text-amber-950 block">Rappels en Cas d’Absence</span>
                  <span class="text-[11px] text-amber-800">Vous alerte périodiquement si une urgence, un devis ou une subvention attend votre retour</span>
                </div>
                <input type="checkbox" id="notif-opt-inactivity" ${this.config.inactivityEngagement ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('inactivityEngagement', this.checked)" class="w-4 h-4 text-amber-600 rounded cursor-pointer" />
              </label>
            </div>

            <!-- Catégories Opérationnelles -->
            <div class="space-y-2.5 pt-2">
              <h4 class="font-black text-slate-700 uppercase tracking-wider text-[10px]">Types d'Alertes Filtrables</h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 glass-card cursor-pointer">
                  <span class="font-semibold text-slate-700 text-[11px]">Départs Réflexes SAMU 15</span>
                  <input type="checkbox" ${this.config.samuAlerts ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('samuAlerts', this.checked)" class="w-4 h-4 text-pc-blue rounded" />
                </label>
                <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 glass-card cursor-pointer">
                  <span class="font-semibold text-slate-700 text-[11px]">Gardes & Renforts SDIS</span>
                  <input type="checkbox" ${this.config.sdisAlerts ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('sdisAlerts', this.checked)" class="w-4 h-4 text-pc-blue rounded" />
                </label>
                <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 glass-card cursor-pointer">
                  <span class="font-semibold text-slate-700 text-[11px]">Nouvelles Demandes DPS</span>
                  <input type="checkbox" ${this.config.dpsAlerts ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('dpsAlerts', this.checked)" class="w-4 h-4 text-pc-blue rounded" />
                </label>
                <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 glass-card cursor-pointer">
                  <span class="font-semibold text-slate-700 text-[11px]">Candidatures RH Reçues</span>
                  <input type="checkbox" ${this.config.rhAlerts ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('rhAlerts', this.checked)" class="w-4 h-4 text-pc-blue rounded" />
                </label>
                <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 glass-card cursor-pointer sm:col-span-2">
                  <span class="font-semibold text-slate-700 text-[11px]">Vigilance Météo-France & SNCF</span>
                  <input type="checkbox" ${this.config.weatherAlerts ? 'checked' : ''} onchange="window.ProtecNotifications.toggleConfig('weatherAlerts', this.checked)" class="w-4 h-4 text-pc-blue rounded" />
                </label>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    if (isHistory) {
      this.renderHistoryList();
    } else {
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // Modification d'un paramètre
  toggleConfig(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }
};
