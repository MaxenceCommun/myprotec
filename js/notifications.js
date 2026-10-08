/**
 * PROTEC LIVE - GESTIONNAIRE COMPLET DE PUSH NOTIFICATIONS & ENGAGEMENT
 * - Service Worker natif (Arrière-plan PC & Smartphone)
 * - Sons opérationnels 2-tons et vibrations haptiques
 * - Alertes d'interventions en direct (SAMU 15, Pompiers, Devis DPS, Candidatures)
 * - Moteur d'incitation à la reconnexion périodique lors des absences du joueur
 */

window.ProtecNotifications = {
  swRegistration: null,
  permission: 'default',
  inactivityTimer: null,
  inactivityIntervalSec: 180, // 3 minutes d'absence pour la première alerte de rappel
  history: [],
  activeTab: 'history',
  lastUserInteraction: Date.now(),

  isDeviceMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth < 768 && ('ontouchstart' in window));
  },

  isUserActivelyPlaying() {
    const isVisible = (document.visibilityState === 'visible');
    const hasFocus = (typeof document.hasFocus === 'function') ? document.hasFocus() : true;
    const recentlyInteracted = (Date.now() - this.lastUserInteraction) < 30000; // Actif il y a moins de 30 secondes
    return isVisible && hasFocus && recentlyInteracted;
  },

  isPCOpenAndActive() {
    try {
      const pcHeartbeat = parseInt(localStorage.getItem('protec_pc_heartbeat') || '0', 10);
      return (Date.now() - pcHeartbeat) < 30000; // PC actif il y a moins de 30 secondes
    } catch (e) {
      return false;
    }
  },

  shouldSendSystemNotification() {
    if (!this.config.enabled) return false;
    if (this.permission !== 'granted') return false;

    // RÈGLE 1 : Si le joueur est actif sur le jeu sur cet écran -> NE PAS envoyer de notification système OS
    if (this.isUserActivelyPlaying()) {
      return false;
    }

    const isMobile = this.isDeviceMobile();

    if (isMobile) {
      // RÈGLE 2 (TÉLÉPHONE) : Envoyer SEULEMENT si inactif sur le téléphone ET que le jeu est fermé ou inactif sur PC
      if (this.isPCOpenAndActive()) {
        return false; // Le joueur est sur son PC, ne pas sonner sur son téléphone
      }
      // Téléphone en arrière-plan, écran verrouillé ou joueur inactif
      return true;
    } else {
      // RÈGLE 3 (PC) : Envoyer sur PC uniquement si le jeu est ouvert sur le PC MAIS que le joueur n'est pas sur la page
      // (autre onglet actif, fenêtre masquée/minimisée ou inactivité sans interaction)
      const isAwayFromPage = (document.visibilityState === 'hidden') || (document.hasFocus && !document.hasFocus()) || ((Date.now() - this.lastUserInteraction) >= 30000);
      return isAwayFromPage;
    }
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
      title: '🚑 ALERTE 15 : Départ Réflexe VPSP Requis !',
      body: 'Le SAMU 15 demande une ambulance de votre antenne pour un malaise grave sur la voie publique. Reconnectez-vous vite pour engager votre équipage !',
      tag: 'reengage-samu'
    },
    {
      title: '📬 NOUVEAU DEVIS : Sollicitation DPS Urgente !',
      body: 'La Mairie et le Comité des Fêtes vous ont transmis un devis prioritaire pour un festival ce week-end. Répondez avant clôture des candidatures !',
      tag: 'reengage-dps'
    },
    {
      title: '👥 RECRUTEMENT : Nouvelle Candidature Reçue !',
      body: 'Un bénévole qualifié PSE2 vient de déposer sa candidature à l’antenne. Faites-lui passer son entretien pour renforcer vos équipes !',
      tag: 'reengage-rh'
    },
    {
      title: '⚠️ BULLETIN PRÉFECTURE : Risque Météo Majeur !',
      body: 'Météo-France place votre département en vigilance accrue. Les services de l’État pré-alertent votre antenne de Protection Civile !',
      tag: 'reengage-meteo'
    },
    {
      title: '🎁 CADEAU QUOTIDIEN & SUBVENTIONS DISPONIBLES !',
      body: 'Vos récompenses administratives et dotations de mécénat sont prêtes à être récupérées à l’antenne. Ne passez pas à côté !',
      tag: 'reengage-reward'
    }
  ],

  // Initialisation du gestionnaire
  async init(game) {
    this.loadConfig();
    try {
      this.history = JSON.parse(localStorage.getItem('protec_notif_history') || '[]');
    } catch (e) {
      this.history = [];
    }

    // 1. Détection de la permission actuelle
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }

    // 2. Enregistrement du Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        this.swRegistration = reg;
        console.log('✅ Service Worker MyProtec enregistré avec succès:', reg.scope);
      } catch (err) {
        console.warn('Erreur enregistrement Service Worker:', err);
      }
    }

    // 3. Mise à jour des badges visuels dans l'UI
    this.updateHeaderUI();

    // 4. Écoute du cycle de vie de la page pour le moteur d'incitation (Background Engagement)
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

    // Heartbeat régulier pour informer le smartphone si le PC est actif
    setInterval(() => {
      if (!this.isDeviceMobile() && document.visibilityState === 'visible' && (Date.now() - this.lastUserInteraction < 45000)) {
        localStorage.setItem('protec_pc_heartbeat', Date.now().toString());
      }
    }, 10000);
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

  // Mise à jour de l'icône et des indicateurs visuels du header
  updateHeaderUI() {
    const isGranted = (this.permission === 'granted' && this.config.enabled);
    const badge = document.getElementById('push-notif-badge');
    const badgeMobile = document.getElementById('push-notif-badge-mobile');
    const icon = document.getElementById('push-notif-icon');

    if (badge) {
      badge.className = `absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${isGranted ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`;
    }
    if (badgeMobile) {
      badgeMobile.className = `absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${isGranted ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`;
    }
    if (icon) {
      icon.className = `w-3.5 h-3.5 transition-transform ${isGranted ? 'text-amber-500 font-black' : 'text-slate-400'}`;
    }
  },

  // Demande d'autorisation de notifications native
  async requestPermission() {
    if (!('Notification' in window)) {
      if (window.game) window.game.showToast('Navigateur Non Compatible', 'Votre navigateur ne prend pas en charge les notifications Web.', 'orange');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      this.permission = perm;
      this.updateHeaderUI();

      if (perm === 'granted') {
        this.config.enabled = true;
        this.saveConfig();
        this.sendPushNotification(
          '🔔 Notifications MyProtec Activées !',
          'Parfait ! Vous recevrez désormais les alertes SAMU 15, SDIS, devis DPS et rappels d’intervention en direct sur votre appareil.',
          { tag: 'welcome-notification' }
        );
        if (window.game) window.game.showToast('Notifications Activées', 'Alertes opérationnelles prêtes !', 'green');
        return true;
      } else {
        if (window.game) window.game.showToast('Autorisation Refusée', 'Les notifications ont été bloquées par votre navigateur.', 'orange');
        return false;
      }
    } catch (e) {
      console.warn('Erreur demande permission:', e);
      return false;
    }
  },

  // Émission sonore opérationnelle (Bitonal alerte de secours)
  playAlertSound() {
    if (!this.config.sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Ton 1 (880 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);

      // Ton 2 (659 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.22);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.22);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {}
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

  // Enregistrement d'une notification dans l'historique
  recordNotification(data) {
    if (!data) return;
    const item = {
      id: Date.now() + Math.random(),
      title: data.title || 'Notification',
      message: data.message || data.body || '',
      color: data.color || 'blue',
      category: data.category || 'general',
      targetType: data.targetType || (data.target && data.target.type) || null,
      targetId: data.targetId || (data.target && data.target.id) || null,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    };
    this.history.unshift(item);
    if (this.history.length > 80) this.history = this.history.slice(0, 80);
    try {
      localStorage.setItem('protec_notif_history', JSON.stringify(this.history));
    } catch (e) {}

    const badge = document.getElementById('notif-history-count');
    if (badge) badge.textContent = this.history.length;

    if (this.activeTab === 'history') {
      const listEl = document.getElementById('notif-history-list');
      if (listEl) this.renderHistoryList();
    }
  },

  // Clic direct sur une notification pour ouvrir l'information concernée
  handleNotificationClick(index) {
    const item = this.history[index];
    if (!item) return;

    this.closeSettingsModal();
    const game = window.game;
    if (!game) return;

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    // 1. Cible explicite
    if (item.targetType === 'mission' && item.targetId) {
      game.openMissionDetails(item.targetId);
      return;
    }
    if (item.targetType === 'module' && item.targetId) {
      game.openModule(item.targetId);
      return;
    }

    // 2. Détection intelligente selon le texte & la catégorie
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();

    // Recherche d'une mission correspondante dans les missions actives
    const matchedMission = game.missions.find(m => 
      m.id === item.targetId ||
      title.includes(m.title.toLowerCase()) || 
      (m.title && title.includes(m.title.toLowerCase().substring(0, 15)))
    );
    if (matchedMission) {
      game.openMissionDetails(matchedMission.id);
      return;
    }

    // Catégories thématiques
    if (title.includes('devis') || msg.includes('devis')) {
      game.openModule('missions');
      setTimeout(() => {
        const devisTabBtn = document.querySelector('[onclick*="devis"]');
        if (devisTabBtn) devisTabBtn.click();
      }, 100);
      return;
    }

    if (title.includes('candidat') || title.includes('recrutement') || msg.includes('candidature') || item.category === 'rh') {
      game.openModule('benevoles');
      return;
    }

    if (title.includes('samu') || title.includes('15') || title.includes('garde') || title.includes('sdis') || title.includes('alerte') || title.includes('départ') || title.includes('secours') || title.includes('crise') || title.includes('cai') || title.includes('cump') || title.includes('sinistre')) {
      const activeUrgent = game.missions.find(m => ['declenche', 'prealerte', 'ongoing'].includes(m.status));
      if (activeUrgent) {
        game.openMissionDetails(activeUrgent.id);
      } else {
        game.openModule('missions');
      }
      return;
    }

    if (title.includes('spécialité') || title.includes('drone') || title.includes('cyno') || title.includes('bateau')) {
      if (window.ProtecSpecialites) {
        window.ProtecSpecialites.openSpecialitesModal(game);
      }
      return;
    }

    if (title.includes('pôle') || title.includes('pole')) {
      if (window.ProtecPoles) {
        window.ProtecPoles.openModal(game);
      }
      return;
    }

    if (title.includes('local') || title.includes('bâtiment') || title.includes('sécurité') || title.includes('travaux')) {
      game.openModule('locaux');
      return;
    }

    if (title.includes('flotte') || title.includes('véhicule') || title.includes('vpsp') || title.includes('réarmement')) {
      game.openModule('flotte');
      return;
    }

    // Par défaut : ouvrir les missions
    game.openModule('missions');
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
    // 1. Enregistre TOUJOURS dans le journal in-app (consultable via la cloche d'alertes)
    this.recordNotification({ title, message: body, color: 'orange', category: options.category || 'push' });

    // 2. Contrôle strict de la pertinence de l'envoi système :
    // - Aucune notif système si le joueur a les yeux sur le jeu (actif)
    // - Sur smartphone : uniquement si inactif sur le téléphone ET jeu fermé/inactif sur PC
    // - Sur PC : uniquement si le jeu est ouvert mais que l'utilisateur est sur une autre page / en arrière-plan
    if (!this.shouldSendSystemNotification()) {
      return;
    }

    // 3. Son d'alerte et vibration
    this.playAlertSound();
    this.triggerVibration();

    const notifOptions = Object.assign({
      body: body,
      icon: 'logo_myprotec_icon.png',
      badge: 'logo_myprotec_icon.png',
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

    // 2. Affichage via le Service Worker si actif (permet de fonctionner onglet masqué)
    if (this.swRegistration && 'showNotification' in this.swRegistration) {
      try {
        this.swRegistration.showNotification(title, notifOptions);
        return;
      } catch (e) {
        console.warn('Erreur showNotification via Service Worker, fallback standard:', e);
      }
    }

    // 3. Fallback standard via Notification API
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
    if (category === 'samu' && !this.config.samuAlerts) return;
    if (category === 'sdis' && !this.config.sdisAlerts) return;
    if (category === 'dps' && !this.config.dpsAlerts) return;
    if (category === 'rh' && !this.config.rhAlerts) return;
    if (category === 'weather' && !this.config.weatherAlerts) return;

    this.sendPushNotification(title, body, { tag: `${category}-${tag}` });
  },

  // --- MOTEUR D'INCITATION À LA RECONNEXION (ENGAGEMENT SCHEDULER) ---
  onPageHidden() {
    if (!this.config.inactivityEngagement || !this.config.enabled || this.permission !== 'granted') return;

    this.clearInactivityTimer();

    // Planification d'une notification d'incitation après quelques minutes d'absence
    this.inactivityTimer = setTimeout(() => {
      // Choisir un scénario aléatoire captivant
      const pick = this.reengagementScenarios[Math.floor(Math.random() * this.reengagementScenarios.length)];
      this.sendPushNotification(pick.title, pick.body, { tag: pick.tag });
    }, this.inactivityIntervalSec * 1000);
  },

  onPageVisible() {
    this.clearInactivityTimer();
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
      '🚨 [TEST] DÉPART RÉFLEXE VPSP !',
      'Test opérationnel réussi : Votre appareil reçoit bien les alertes d’urgence et notifications de rappel MyProtec.',
      { tag: 'test-direct-notif' }
    );
    if (window.game) {
      window.game.showToast('Test Envoyé', 'Vérifiez la bannière et le son d’alerte sur votre écran !', 'green');
    }
  },

  // Ouverture de la modale de réglage des notifications
  openSettingsModal() {
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
            <div class="w-10 h-10 rounded-2xl bg-pc-orange/15 text-pc-orange flex items-center justify-center text-lg font-black">
              <i data-lucide="bell" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Centre de Notifications Push</h3>
              <p class="text-[11px] text-slate-500 font-semibold">Alertes opérationnelles en temps réel & rappels d’absence</p>
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

  // Rendu du corps de la modale avec onglets Historique et Paramètres
  renderSettingsModalBody() {
    const body = document.getElementById('notif-settings-body');
    if (!body) return;

    const isHistory = (this.activeTab === 'history');
    const isPermGranted = (this.permission === 'granted');
    const isPermDenied = (this.permission === 'denied');

    body.innerHTML = `
      <div class="space-y-4 text-xs">
        <!-- Barre d'onglets : Journal d'Historique vs Paramètres Push -->
        <div class="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
          <div class="flex items-center gap-2">
            <button onclick="window.ProtecNotifications.switchTab('history')" class="px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${isHistory ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
              <span>Journal des Alertes</span>
              <span class="px-1.5 py-0.2 rounded-full text-[10px] font-black ${isHistory ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'}">${this.history.length}</span>
            </button>
            <button onclick="window.ProtecNotifications.switchTab('settings')" class="px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${!isHistory ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
              <i data-lucide="settings" class="w-3.5 h-3.5"></i>
              <span>Réglages Push & Sons</span>
            </button>
          </div>
          ${isHistory && this.history.length > 0 ? `
            <button onclick="window.ProtecNotifications.clearHistory()" class="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition">
              Vider le journal
            </button>
          ` : ''}
        </div>

        ${isHistory ? `
          <!-- VUE 1 : HISTORIQUE DES NOTIFICATIONS -->
          <div id="notif-history-list" class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            ${this.history.length === 0 ? `
              <div class="p-8 text-center glass-card rounded-2xl space-y-2">
                <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <i data-lucide="inbox" class="w-5 h-5"></i>
                </div>
                <div class="font-bold text-slate-700 text-sm">Aucune notification dans l'historique</div>
                <p class="text-[11px] text-slate-400 max-w-xs mx-auto">Toutes les alertes d'urgence, nouveaux devis, retours d'appels et messages reçus seront archivés ici pour que vous n'en manquiez aucun.</p>
              </div>
            ` : this.history.map((item, idx) => {
              const borderColors = {
                red: 'border-l-4 border-l-red-500 bg-red-50/20',
                orange: 'border-l-4 border-l-amber-500 bg-amber-50/20',
                amber: 'border-l-4 border-l-amber-500 bg-amber-50/20',
                green: 'border-l-4 border-l-emerald-500 bg-emerald-50/20',
                emerald: 'border-l-4 border-l-emerald-500 bg-emerald-50/20',
                blue: 'border-l-4 border-l-pc-blue bg-blue-50/20'
              };
              const cardClass = borderColors[item.color] || 'border-l-4 border-l-slate-400 bg-slate-50/40';

              return `
                <div onclick="window.ProtecNotifications.handleNotificationClick(${idx})" class="p-3 rounded-2xl glass-card border border-slate-200/80 ${cardClass} shadow-sm space-y-1 cursor-pointer hover:scale-[1.01] hover:shadow-md transition active:scale-[0.99]" title="Cliquer pour ouvrir directement cette information">
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>${item.title}</span>
                      <span class="text-[9px] text-pc-blue font-bold px-1.5 py-0.2 rounded bg-blue-100/70 hover:bg-blue-200">Ouvrir ➜</span>
                    </span>
                    <span class="text-[10px] font-mono font-semibold text-slate-400">${item.time}</span>
                  </div>
                  <p class="text-[11px] text-slate-600 leading-snug">${item.message}</p>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <!-- VUE 2 : RÉGLAGES PUSH & SONS -->
          <div class="space-y-4">
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

            <!-- Bouton Test Direct -->
            ${isPermGranted ? `
              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span class="font-bold text-slate-800 block">Vérifier le fonctionnement</span>
                  <span class="text-[11px] text-slate-500">Déclenche une notification test avec sonnerie d'urgence 2-tons</span>
                </div>
                <button onclick="window.ProtecNotifications.testNotification()" class="px-3.5 py-1.5 rounded-xl bg-pc-orange hover:brightness-110 text-white font-extrabold shadow transition flex items-center gap-1.5">
                  <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i>
                  Tester
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

    if (window.lucide) window.lucide.createIcons();
  },

  // Modification d'un paramètre
  toggleConfig(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }
};
