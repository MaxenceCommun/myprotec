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
        this.onPageVisible();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.onPageHidden();
    });
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

  // Envoi d'une vraie notification Push système (Arrière-plan & Écran verrouillé)
  sendPushNotification(title, body, options = {}) {
    if (!this.config.enabled) return;
    if (this.permission !== 'granted') return;

    // 1. Son d'alerte et vibration
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

  // Rendu du corps de la modale de réglages
  renderSettingsModalBody() {
    const body = document.getElementById('notif-settings-body');
    if (!body) return;

    const isPermGranted = (this.permission === 'granted');
    const isPermDenied = (this.permission === 'denied');

    body.innerHTML = `
      <div class="space-y-4 text-xs">
        
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
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Modification d'un paramètre
  toggleConfig(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }
};
