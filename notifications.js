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

  async subscribeUserToPush(onProgress, forceRenew = false) {
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

      // 3. Clé VAPID officielle W3C (synchronisée avec le serveur Protec)
      let vapidPublicKey = 'BKLdj5RykkIOWRhAriMzfKsYON-juKOqSvFCclSz6zgr0CRZdLlQOhfd9nAwmXZZjsNMJU-pl5Csy4Yg-c6mHe0';
      if (window.game && window.game.isBackendOnline) {
        try {
          const keyRes = await fetch('/api/push/key');
          if (keyRes.ok) {
            const keyData = await keyRes.json();
            if (keyData.publicKey) vapidPublicKey = keyData.publicKey;
          }
        } catch (e) {}
      }

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

      // Si renouvellement forcé demandé ou token existant périmé
      if (subscription && forceRenew) {
        log('Purge de l\'ancienne souscription (renouvellement forcé FCM)...');
        try {
          await subscription.unsubscribe();
        } catch (unsubErr) {
          console.warn('[WebPush] Avertissement désabonnement ancien token:', unsubErr);
        }
        subscription = null;
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

      // 8. Transmission persistante dans Supabase game_saves
      if (window.ProtecSupabase?.client && playerId && playerId !== 'local') {
        try {
          const subJson = (typeof subscription.toJSON === 'function') ? subscription.toJSON() : subscription;
          window.ProtecSupabase.client.from('game_saves').select('save_data').eq('user_id', playerId).maybeSingle().then(({ data }) => {
            if (data) {
              const sd = data.save_data || {};
              sd.push_subscription = subJson;
              sd.push_updated_at = new Date().toISOString();
              window.ProtecSupabase.client.from('game_saves').update({ save_data: sd }).eq('user_id', playerId).then(() => {
                log('Abonnement synchronisé dans la sauvegarde Supabase.');
              });
            }
          });
        } catch (eSupa) {
          console.warn('[WebPush] Erreur sauvegarde Supabase game_saves:', eSupa);
        }
      }

      // 9. Enregistrement auprès du serveur Node.js si actif
      if (window.game?.isBackendOnline) {
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
      }

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
    alertModes: {
      samu: 'sound_notif',
      sdis: 'sound_notif',
      dps: 'sound_notif',
      rh: 'sound_notif',
      weather: 'sound_notif'
    },
    alertSounds: {
      samu: 'alerte_crise.mp3',
      sdis: 'attention.mp3',
      dps: 'info.mp3',
      rh: 'notif.mp3',
      weather: 'attention.mp3'
    },
    samuAlerts: true,
    sdisAlerts: true,
    dpsAlerts: true,
    rhAlerts: true,
    weatherAlerts: true,
    inactivityEngagement: true
  },

  // Liste officielle des sons réels disponibles
  availableAlertSounds: [
    { value: 'alerte_crise.mp3', key: 'alerte_crise', label: '🚨 Alerte Crise', desc: 'Urgence & Crise' },
    { value: 'attention.mp3', key: 'attention', label: '⚠️ Attention', desc: '2-Tons Attention' },
    { value: 'notif.mp3', key: 'notif', label: '📻 Radio Secours', desc: 'Bip Radio Secours' },
    { value: 'info.mp3', key: 'info', label: 'ℹ️ Information', desc: 'Carillon Information' },
    { value: 'expire.mp3', key: 'expire', label: '⏱️ Expiration', desc: 'Tonalité Expiration' },
    { value: 'erreur.mp3', key: 'erreur', label: '❌ Erreur', desc: 'Signal d\'Erreur' }
  ],

  alertCategoriesList: [
    {
      id: 'samu',
      label: 'Départs Réflexes SAMU 15',
      icon: '🚑',
      desc: 'Urgences vitales, malaises et transports sanitaires 15'
    },
    {
      id: 'sdis',
      label: 'Gardes & Renforts SDIS',
      icon: '🚒',
      desc: 'Astreintes caserne et renforts Sapeurs-Pompiers'
    },
    {
      id: 'dps',
      label: 'Nouvelles Demandes DPS',
      icon: '📋',
      desc: 'Sollicitations des organisateurs et devis d’événements'
    },
    {
      id: 'rh',
      label: 'Candidatures RH Reçues',
      icon: '👥',
      desc: 'Dépôts de candidatures de nouveaux bénévoles'
    },
    {
      id: 'weather',
      label: 'Vigilance Météo-France & SNCF',
      icon: '⚡',
      desc: 'Bulletins préfectoraux et alertes météorologiques'
    }
  ],

  getAlertMode(category) {
    const cat = (category === 'meteo') ? 'weather' : category;
    if (this.config.alertModes && this.config.alertModes[cat] !== undefined) {
      return this.config.alertModes[cat];
    }
    const legacyKey = `${cat}Alerts`;
    if (this.config[legacyKey] !== undefined) {
      return this.config[legacyKey] ? 'sound_notif' : 'off';
    }
    return 'sound_notif';
  },

  setAlertMode(category, mode) {
    const cat = (category === 'meteo') ? 'weather' : category;
    if (!this.config.alertModes) this.config.alertModes = {};
    this.config.alertModes[cat] = mode;
    this.config[`${cat}Alerts`] = (mode !== 'off');
    this.saveConfig();
  },

  getAlertSound(category) {
    const cat = (category === 'meteo') ? 'weather' : category;
    const defaults = {
      samu: 'alerte_crise.mp3',
      sdis: 'attention.mp3',
      dps: 'info.mp3',
      rh: 'notif.mp3',
      weather: 'attention.mp3'
    };
    if (this.config.alertSounds && this.config.alertSounds[cat]) {
      const val = this.config.alertSounds[cat];
      return (typeof val === 'string' && val.endsWith('.mp3')) ? val : `${val}.mp3`;
    }
    return defaults[cat] || 'info.mp3';
  },

  setAlertSound(category, soundKey) {
    const cat = (category === 'meteo') ? 'weather' : category;
    if (!this.config.alertSounds) this.config.alertSounds = {};
    const normKey = (typeof soundKey === 'string' && soundKey.endsWith('.mp3')) ? soundKey : `${soundKey}.mp3`;
    this.config.alertSounds[cat] = normKey;
    this.saveConfig();
  },

  previewAlertSound(soundKey) {
    if (window.ProtecAudio && typeof window.ProtecAudio.playFile === 'function') {
      window.ProtecAudio.playFile(soundKey);
    }
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
      // Dédoublonnage d'assainissement et purge des notifications de filtres
      const seenBilanDays = new Set();
      this.history = this.history.filter(item => {
        if (!item || !item.title) return false;
        const t = (item.title || '').toLowerCase();
        const m = (item.message || '').toLowerCase();
        // Purger les notifications système de filtres, thèmes, apparence, préférences
        if (
          t.includes('filtre') ||
          t.includes('apparence') ||
          t.includes('thème') ||
          t.includes('theme') ||
          t.includes('paramètre') ||
          t.includes('parametre') ||
          t.includes('option') ||
          t.includes('préférence') ||
          t.includes('preference') ||
          t.includes('copié') ||
          t.includes('copie') ||
          t.includes('presse-papier') ||
          t.includes('acronyme') ||
          t.includes('journal') ||
          m.includes('thème sélectionné') ||
          m.includes('mode sombre') ||
          m.includes('mode clair')
        ) return false;

        if (item.title.includes('Trésorerie & Bilan')) {
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
          if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED' || event.data?.type === 'NOTIFICATION_ACTION_CLICKED') {
            const d = event.data.data || {};
            this.syncCloudMissions();
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
        const parsed = JSON.parse(saved);
        this.config = Object.assign(this.config, parsed);
        if (parsed.alertModes) {
          this.config.alertModes = Object.assign(this.config.alertModes || {}, parsed.alertModes);
        }
        if (parsed.alertSounds) {
          this.config.alertSounds = Object.assign(this.config.alertSounds || {}, parsed.alertSounds);
        }
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
    if (options.customSound && window.ProtecAudio && typeof window.ProtecAudio.playFile === 'function') {
      window.ProtecAudio.playFile(options.customSound);
      return;
    }
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
    const t = (data.title || '').toLowerCase();
    const m = (data.message || data.body || '').toLowerCase();

    // RÈGLE MÉTIER STRICTE : Ne jamais enregistrer les événements cosmétiques, filtres, thèmes ou réglages dans le journal d'alertes
    if (
      data.skipRecord ||
      t.includes('filtre') ||
      t.includes('apparence') ||
      t.includes('thème') ||
      t.includes('theme') ||
      t.includes('paramètre') ||
      t.includes('parametre') ||
      t.includes('option') ||
      t.includes('préférence') ||
      t.includes('preference') ||
      t.includes('copié') ||
      t.includes('copie') ||
      t.includes('presse-papier') ||
      t.includes('acronyme') ||
      t.includes('journal') ||
      m.includes('thème sélectionné') ||
      m.includes('mode sombre') ||
      m.includes('mode clair') ||
      m.includes('presse-papier')
    ) {
      return;
    }
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
    if (this.history.length > 50) this.history = this.history.slice(0, 50);
    try {
      localStorage.setItem('protec_notif_history', JSON.stringify(this.history));
    } catch (e) {
      try {
        // En cas de QuotaExceededError, réduire aux 15 dernières notifications
        this.history = this.history.slice(0, 15);
        localStorage.setItem('protec_notif_history', JSON.stringify(this.history));
      } catch (crit) {
        console.warn('[Notifications] QuotaExceededError persistant sur protec_notif_history :', crit?.message || crit);
      }
    }

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
    this.updateHeaderUI();
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
    if (options.customSound && window.ProtecAudio && typeof window.ProtecAudio.playFile === 'function') {
      if (this.config.sound) {
        window.ProtecAudio.playFile(options.customSound);
      }
    } else {
      this.playAlertSound(title, body, options);
    }
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
    const cat = (category === 'meteo') ? 'weather' : category;
    const mode = this.getAlertMode(cat);

    // 1. Statut Désactivé : silence complet
    if (mode === 'off') return;

    if (cat === 'samu') {
      if (!window.game || !window.game.samuConvention || !window.game.samuConvention.signed) return;
    }
    if (cat === 'sdis') {
      if (!window.game || !window.game.sdisGarde || !window.game.sdisGarde.active) return;
    }

    const soundKey = this.getAlertSound(cat);

    if (mode === 'sound_only') {
      // 2. Statut Son uniquement : joue la tonalité choisie et vibre, enregistre dans l'historique sans push OS
      if (this.config.sound && window.ProtecAudio && typeof window.ProtecAudio.playFile === 'function') {
        window.ProtecAudio.playFile(soundKey);
      }
      this.triggerVibration();
      this.recordNotification({ title, message: this.sanitizeMessage(body), color: 'orange', category: cat });
      return;
    }

    // 3. Statut Son + Notif : joue la tonalité choisie ET envoie la notification push
    this.sendPushNotification(title, body, {
      tag: `${cat}-${tag}`,
      category: cat,
      customSound: soundKey
    });
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

    // 2. Programmation auprès du serveur Web Push pour chaque mission/intervention en cours
    if (window.game && Array.isArray(window.game.missions)) {
      const ongoing = window.game.missions.filter(m => m.status === 'ongoing' && m.endsAt && m.endsAt > Date.now());
      ongoing.forEach(m => {
        const remainingSec = Math.max(5, Math.round((m.endsAt - Date.now()) / 1000));
        this.scheduleDelayedPush({
          eventId: `mission_end_${m.id}`,
          delaySeconds: remainingSec,
          title: '🚑 Véhicules de Retour à l’Antenne',
          body: `L'opération "${m.title || m.type || 'DPS'}" est terminée. Vos véhicules et équipiers sont disponibles.`,
          data: { url: '/jeu.html', missionId: m.id }
        });
      });
    }

    // 3. Programmation de rappel d'inactivité adapté aux moyens réels et conventions du joueur
    const game = window.game;
    const hasSamuConvention = Boolean(game && game.samuConvention?.signed);
    const hasVpsp = Boolean(game && Array.isArray(game.vehicles) && game.vehicles.some(v => v.type === 'VPSP'));

    let emergencyTitle = '📬 Nouveau Devis : Sollicitation DPS en Attente';
    let emergencyBody = 'Un organisateur attend votre validation de devis pour un poste de secours. Touchez pour ouvrir votre planning !';
    let pushCat = 'dps';

    if (hasSamuConvention && hasVpsp) {
      emergencyTitle = '🚨 Alerte SAMU 15 : VPSP Requis';
      emergencyBody = 'Le SAMU 15 demande une ambulance de votre antenne. Touchez pour reprendre votre service !';
      pushCat = 'samu';
    }

    this.scheduleDelayedPush({
      eventId: `inactivity_reminder_${Date.now()}`,
      delaySeconds: this.inactivityIntervalSec,
      title: emergencyTitle,
      body: emergencyBody,
      data: { url: '/jeu.html', category: pushCat }
    });

    // 4. Programmation Service Worker au niveau de l'OS (secours différé si onglet juste minimisé)
    if (this.swRegistration && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_BACKGROUND_ALERT',
        delayMs: this.inactivityIntervalSec * 1000,
        data: {
          title: emergencyTitle,
          body: emergencyBody,
          url: '/jeu.html',
          data: { url: '/jeu.html', category: pushCat }
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
    // Annulation auprès du serveur des alertes d'inactivité
    try {
      fetch('/api/push/cancel-scheduled-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: window.game?.player?.id })
      }).catch(() => {});
    } catch (e) {}

    this.checkPendingSupabaseNotifications();
    this.syncCloudMissions();
  },

  // Synchronisation dynamique des missions reçues par Push / Supabase Cloud
  async syncCloudMissions() {
    if (!window.ProtecSupabase?.client || !window.game) return;
    let cachedUser = null;
    try {
      cachedUser = window.ProtecAuth?.currentUser || JSON.parse(localStorage.getItem('protec_user_profile') || '{}');
    } catch (e) {}
    const uid = cachedUser?.id || window.game.player?.id;
    const uname = cachedUser?.username || window.game.player?.name;
    if (!uid && !uname) return;

    try {
      const supaSave = await window.ProtecSupabase.loadGameState(uid, uname);
      if (supaSave?.save_data?.missions && Array.isArray(supaSave.save_data.missions)) {
        const currentIds = new Set((window.game.missions || []).map(m => m.id));
        let hasNew = false;
        supaSave.save_data.missions.forEach(m => {
          if (!currentIds.has(m.id)) {
            if (!Array.isArray(window.game.missions)) window.game.missions = [];
            window.game.missions.unshift(m);
            currentIds.add(m.id);
            hasNew = true;
          }
        });
        if (hasNew) {
          if (typeof window.game.renderMissions === 'function') window.game.renderMissions();
          if (typeof window.game.updateStatsUI === 'function') window.game.updateStatsUI();
          if (typeof window.game.showToast === 'function') {
            window.game.showToast('🚨 Nouvelle Mission Disponible !', 'Une intervention d’urgence attend vos effectifs sur la carte.', 'orange');
          }
        }
      }
    } catch (e) {
      console.warn('Erreur syncCloudMissions:', e);
    }
  },

  // Génération autonome d'une mission d'urgence réelle pour accompagner un push
  generateEmergencyMission(game, title = null, requestedType = 'auto') {
    if (!game || !game.stations || game.stations.length === 0) return null;

    const hasSamuConvention = Boolean(game.samuConvention && game.samuConvention.signed);
    const hasVpsp = Array.isArray(game.vehicles) && game.vehicles.some(v => v.type === 'VPSP');
    const totalVols = (game.volunteers || []).length;

    // Détermination du type de mission réellement adapté aux moyens du joueur
    let type = requestedType;
    if (type === 'samu' || type === 'auto') {
      if (!hasSamuConvention || !hasVpsp || totalVols < 3) {
        // Le joueur n'a pas les moyens ou pas la convention SAMU 15 -> Basculer impérativement sur un DPS
        type = 'dps';
      } else {
        type = 'samu';
      }
    }

    // Contrôle d'unicité : s'il existe déjà une mission non assignée du même type en attente, la réutiliser et ne pas en créer d'autre !
    if (Array.isArray(game.missions)) {
      const existing = game.missions.find(m => m.status === 'planifie' && (m.id.startsWith('samu_') || m.id.startsWith('dps_') || m.type === type));
      if (existing) {
        return existing;
      }
    }

    const station = game.stations[0];
    const mLat = Number(station.lat || 48.6921) + (Math.random() - 0.5) * 0.04;
    const mLng = Number(station.lng || 6.1844) + (Math.random() - 0.5) * 0.04;
    const mId = `${type}_${Date.now()}`;

    let mission;
    if (type === 'samu') {
      mission = {
        id: mId,
        type: 'samu',
        category: 'urgences',
        title: title || 'Détresse Respiratoire à Domicile',
        desc: 'Réquisition d’urgence régulée. VPSP demandé immédiatement sur les lieux.',
        lat: mLat,
        lng: mLng,
        city: station.city || 'Secteur Opérationnel',
        departmentCode: station.departmentCode || '54',
        address: `Secteur ${station.city || 'Antenne'} (Régulation 15)`,
        status: 'planifie',
        progress: 0,
        requiredVehicles: ['VPSP'],
        requiredVolunteers: 3,
        requiredRanks: ['PSE1', 'PSE2'],
        registeredVolunteers: [],
        assignedCrew: { volunteers: [], vehicles: [] },
        rewardMoney: 350,
        rewardReputation: 45,
        durationSeconds: 1200,
        durationHours: "0.3",
        createdAt: Date.now(),
        spawnedAt: Date.now()
      };
    } else {
      // Mission DPS adaptée aux moyens réels du joueur (PAPS ou DPS-PE)
      const availableVeh = (game.vehicles || []).find(v => v.type === 'VTU' || v.type === 'VL') || (game.vehicles || [])[0];
      const reqVol = Math.max(2, Math.min(3, totalVols || 2));
      mission = {
        id: mId,
        type: 'dps',
        category: 'dps',
        title: title || 'Poste de Secours : Tournoi Sportif Local',
        desc: 'Dispositif Prévisionnel de Secours pour un événement local. Prise en charge des malaises et traumatismes légers.',
        lat: mLat,
        lng: mLng,
        city: station.city || 'Secteur Opérationnel',
        departmentCode: station.departmentCode || '54',
        address: `Gymnase Municipal, ${station.city || 'Antenne'}`,
        status: 'planifie',
        progress: 0,
        requiredVehicles: availableVeh ? [availableVeh.type] : [],
        requiredVolunteers: reqVol,
        requiredRanks: reqVol >= 3 ? ['CE', 'PSE2', 'PSE1'] : ['PSE1', 'PSE2'],
        registeredVolunteers: [],
        assignedCrew: { volunteers: [], vehicles: [] },
        rewardMoney: 280,
        rewardReputation: 35,
        durationSeconds: 1800,
        durationHours: "0.5",
        createdAt: Date.now(),
        spawnedAt: Date.now()
      };
    }

    if (!Array.isArray(game.missions)) game.missions = [];
    if (!game.missions.some(m => m.id === mId)) {
      game.missions.unshift(mission);
      if (typeof game.renderMissions === 'function') game.renderMissions();
      if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
      if (typeof game.saveGame === 'function') game.saveGame();
    }
    // Sauvegarder également dans Supabase
    const userId = window.ProtecAuth?.currentUser?.id || game.player?.id;
    if (userId && window.ProtecSupabase?.queuePlayerNotification) {
      window.ProtecSupabase.queuePlayerNotification(userId, {
        title: `🚨 ${mission.title}`,
        body: mission.desc,
        category: type,
        missionId: mId
      });
    }
    return mission;
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

  // Méthode pour renouveler explicitement l'abonnement Push (purge token expiré 410)
  async renewPushSubscription() {
    if (window.game && typeof window.game.showToast === 'function') {
      window.game.showToast('Abonnement Push', 'Renouvellement en cours auprès de Google / Apple...', 'blue');
    }
    const res = await this.subscribeUserToPush((msg) => {
      console.log('[WebPush Renew]', msg);
    }, true);

    if (res.success) {
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Abonnement Réactivé', 'Votre terminal est réenregistré avec un token tout neuf !', 'green');
      }
      this.renderSettingsModalBody();
    } else {
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Erreur Abonnement', res.message || 'Échec du renouvellement', 'red');
      }
    }
    return res;
  },

  // Planification d'une alerte différée auprès du serveur (ex: véhicule qui rentre dans 5 minutes)
  async scheduleDelayedPush({ eventId, delaySeconds, title, body, data }) {
    if (!delaySeconds || delaySeconds <= 0) return false;
    
    let subEndpoint = this.pushSubscription?.endpoint;
    if (!subEndpoint) {
      try {
        const localSub = JSON.parse(localStorage.getItem('protec_push_sub') || '{}');
        subEndpoint = localSub.endpoint;
      } catch (e) {}
    }

    let cachedUser = null;
    try {
      cachedUser = window.ProtecAuth?.currentUser || JSON.parse(localStorage.getItem('protec_user_profile') || '{}');
    } catch (e) {}
    const userId = cachedUser?.id || window.game?.player?.id;

    // 1. Enregistrement auprès du serveur Node.js si accessible
    try {
      const res = await fetch('/api/push/schedule-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          userId,
          endpoint: subEndpoint,
          delaySeconds,
          title: title || '🚑 Intervention Terminée',
          body: body || 'Les véhicules sont de retour à l’antenne.',
          data: data || { url: '/jeu.html' }
        })
      });
      if (res.ok) return true;
    } catch (e) {}

    // 2. Fallback Service Worker local si la page est encore en mémoire / réduite
    if (this.swRegistration && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_BACKGROUND_ALERT',
        delayMs: delaySeconds * 1000,
        data: {
          title: title || '🚑 Intervention Terminée',
          body: body || 'Les véhicules sont de retour à l’antenne.',
          url: '/jeu.html'
        }
      });
    }
    return true;
  },

  // Test immédiat de notification (Bouton dans la modale)
  async testNotification() {
    this.sendPushNotification(
      'Test Opérationnel VPSP',
      'Votre appareil reçoit bien les alertes d’urgence et notifications de rappel MyProtec.',
      { tag: 'test-direct-notif' }
    );

    // Déclencher également l'émission Web Push serveur si le joueur a une souscription
    let ep = this.pushSubscription?.endpoint;
    let keys = this.pushSubscription?.keys;
    if (!ep) {
      try {
        const localSub = JSON.parse(localStorage.getItem('protec_push_sub') || '{}');
        ep = localSub.endpoint;
        keys = localSub.keys;
      } catch (e) {}
    }

    if (ep) {
      try {
        const res = await fetch('/api/push/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: ep,
            p256dh: keys?.p256dh,
            auth: keys?.auth,
            title: '🚨 Test Web Push Réussi !',
            body: 'Votre terminal reçoit les notifications même application totalement fermée.'
          })
        });
        const data = await res.json().catch(() => ({}));
        if (data.expired) {
          console.warn('[WebPush] Token expiré détecté (410). Renouvellement automatique...');
          await this.renewPushSubscription();
        }
      } catch (e) {}
    }

    if (window.game) {
      window.game.showToast('Test Envoyé', 'Vérifiez la bannière et le son d’alerte sur votre écran !', 'green');
    }
  },

  // Test avec application fermée ou mise en veille (compte à rebours de 10 secondes)
  async testOfflinePush(seconds = 10) {
    if (this.permission !== 'granted') {
      await this.requestPermission();
      if (this.permission !== 'granted') return;
    }

    // S'assurer qu'un abonnement valide existe
    if (!this.pushSubscription) {
      await this.subscribeUserToPush();
    }

    let subEndpoint = this.pushSubscription?.endpoint;
    let keys = this.pushSubscription?.keys;
    if (!subEndpoint) {
      try {
        const localSub = JSON.parse(localStorage.getItem('protec_push_sub') || '{}');
        subEndpoint = localSub.endpoint;
        keys = localSub.keys;
      } catch (e) {}
    }

    if (window.game && typeof window.game.showToast === 'function') {
      window.game.showToast(
        'Test App Fermée',
        `RÉDUISEZ OU FERMEZ LE JEU DÈS MAINTENANT ! L’alerte arrivera dans ${seconds} secondes sur votre appareil.`,
        'orange'
      );
    }

    // 1. Déclenchement de la mission réelle correspondante
    let testMissionId = null;
    const hasSamu = Boolean(window.game && window.game.samuConvention?.signed && Array.isArray(window.game.vehicles) && window.game.vehicles.some(v => v.type === 'VPSP'));
    const testCat = hasSamu ? 'samu' : 'dps';
    const testTitle = hasSamu ? '🚨 Réquisition SAMU 15 (App Fermée)' : '📬 Demande DPS Urgente (App Fermée)';
    const testBody = hasSamu
      ? 'Engagement immédiat VPSP demandé ! Touchez pour mobiliser votre équipage sur la carte.'
      : 'Un organisateur sollicite un poste de secours ! Touchez pour mobiliser votre équipe.';

    if (window.game && window.game.stations && window.game.stations.length > 0) {
      const realMission = this.generateEmergencyMission(window.game, hasSamu ? 'Détresse Respiratoire à Domicile (Test App Fermée)' : 'Poste de Secours d’Urgence (Test App Fermée)', testCat);
      if (realMission) testMissionId = realMission.id;
    }

    // 2. Déclenchement serveur Web Push avec délai (réveil réseau OS natif même app tuée)
    if (subEndpoint) {
      try {
        const res = await fetch('/api/push/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subEndpoint,
            p256dh: keys?.p256dh,
            auth: keys?.auth,
            delaySeconds: seconds,
            title: testTitle,
            body: testBody,
            icon: 'https://myprotec.fr/badge-monochrome.png',
            badge: 'https://myprotec.fr/badge-monochrome.png',
            data: { url: '/jeu.html', missionId: testMissionId, category: testCat }
          })
        });
        const data = await res.json().catch(() => ({}));
        if (data.expired) {
          console.warn('[WebPush] Token expiré détecté (410). Renouvellement automatique...');
          await this.renewPushSubscription();
        }
      } catch (e) {}
    }

    // 2. Programmation Service Worker locale (secours immédiat si onglet juste minimisé)
    if (this.swRegistration && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_BACKGROUND_ALERT',
        delayMs: seconds * 1000,
        data: {
          title: '🚨 Test Réussi : Alerte Arrière-Plan',
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
      <div class="w-full max-w-xl rounded-3xl glass-panel-heavy border border-white/80 p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
                  <span class="font-bold text-slate-800 block">Tonalités & Signaux d'Alerte</span>
                  <span class="text-[11px] text-slate-500">Lecture des signaux sonores lors des alertes et départs réflexes</span>
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


            <!-- Catégories Opérationnelles : 3 Statuts & Personnalisation Audio -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[10.5px]">Types d'Alertes & Personnalisation</h4>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400">Choisissez le statut (Désactivé, Son seul, Son + Notif) et la tonalité audio de chaque alerte</p>
                </div>
              </div>

              <div class="space-y-2.5">
                ${this.alertCategoriesList.map(cat => {
                  const mode = this.getAlertMode(cat.id);
                  const sound = this.getAlertSound(cat.id);

                  let badgeText = 'Son + Notif';
                  let badgeClass = 'bg-pc-blue/15 text-pc-blue dark:bg-sky-950/60 dark:text-sky-300 border border-blue-200 dark:border-blue-800';
                  if (mode === 'off') {
                    badgeText = 'Désactivé';
                    badgeClass = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
                  } else if (mode === 'sound_only') {
                    badgeText = 'Son uniquement';
                    badgeClass = 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
                  }

                  return `
                    <div class="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5 transition">
                      <!-- En-tête : Titre & Badge d'état -->
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span class="text-base">${cat.icon}</span>
                          <div>
                            <h5 class="text-xs font-black text-slate-900 dark:text-slate-100">${cat.label}</h5>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">${cat.desc}</p>
                          </div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wide shrink-0 ${badgeClass}">
                          ${badgeText}
                        </span>
                      </div>

                      <!-- 3 Statuts par Alerte -->
                      <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                        <button type="button" onclick="window.ProtecNotifications.setAlertMode('${cat.id}', 'off'); window.ProtecNotifications.renderSettingsModalBody();"
                          class="py-1 px-1.5 rounded-lg text-[10.5px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${mode === 'off' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">
                          <span>🔕</span>
                          <span>Désactivé</span>
                        </button>

                        <button type="button" onclick="window.ProtecNotifications.setAlertMode('${cat.id}', 'sound_only'); window.ProtecNotifications.renderSettingsModalBody();"
                          class="py-1 px-1.5 rounded-lg text-[10.5px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${mode === 'sound_only' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">
                          <span>🔊</span>
                          <span>Son seul</span>
                        </button>

                        <button type="button" onclick="window.ProtecNotifications.setAlertMode('${cat.id}', 'sound_notif'); window.ProtecNotifications.renderSettingsModalBody();"
                          class="py-1 px-1.5 rounded-lg text-[10.5px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${mode === 'sound_notif' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}">
                          <span>🔔</span>
                          <span>Son + Notif</span>
                        </button>
                      </div>

                      <!-- Personnalisation du son -->
                      <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                        <div class="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-600 dark:text-slate-300">
                          <span>🎵</span>
                          <span>Tonalité d'alerte :</span>
                        </div>
                        <div class="flex items-center gap-1.5 flex-1 max-w-[260px]">
                          <select id="notif-sound-${cat.id}"
                            onchange="window.ProtecNotifications.setAlertSound('${cat.id}', this.value); window.ProtecNotifications.previewAlertSound(this.value);"
                            class="w-full text-[10.5px] font-semibold py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-pc-blue focus:outline-none cursor-pointer">
                            ${this.availableAlertSounds.map(s => {
                              const isSelected = (sound === s.value || sound === s.key || sound === s.value.replace('.mp3', ''));
                              return `<option value="${s.value}" ${isSelected ? 'selected' : ''}>${s.label} (${s.desc})</option>`;
                            }).join('')}
                          </select>
                          <button type="button"
                            onclick="window.ProtecNotifications.previewAlertSound(document.getElementById('notif-sound-${cat.id}').value)"
                            class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-pc-blue hover:text-white text-slate-700 dark:text-slate-200 text-[10.5px] font-extrabold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                            title="Tester / Écouter ce son">
                            <span>▶️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
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
