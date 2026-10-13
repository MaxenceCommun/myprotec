/**
 * PROTEC LIVE / MYPROTEC - GESTIONNAIRE CLIENT PWA
 * Gestion de l'installation Progressive Web App, de l'état autonome (Standalone),
 * du statut réseau (En ligne / Hors-ligne) et du guide d'installation iOS Safari.
 */

window.ProtecPWA = {
  deferredPrompt: null,
  isStandalone: false,
  isIOS: false,
  isOnline: navigator.onLine,

  init() {
    this.checkStandalone();
    this.checkPlatform();
    this.setupNetworkListeners();
    this.setupInstallPrompt();
    this.registerServiceWorker();
    this.updateUI();
  },

  // 1. Détecte si l'application est déjà exécutée en tant qu'application installée (PWA Standalone)
  async checkStandalone() {
    this.isStandalone = (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('protec_pwa_installed') === 'true'
    );

    if (!this.isStandalone && 'getInstalledRelatedApps' in navigator) {
      try {
        const related = await navigator.getInstalledRelatedApps();
        if (related && related.length > 0) {
          this.isStandalone = true;
          try { localStorage.setItem('protec_pwa_installed', 'true'); } catch (e) {}
          this.updateUI();
        }
      } catch (e) {}
    }
  },

  // 2. Détecte la plateforme (iOS vs Android / PC)
  checkPlatform() {
    const ua = window.navigator.userAgent.toLowerCase();
    this.isIOS = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
  },

  // 3. Enregistrement du Service Worker
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('📱 [PWA] Service Worker opérationnel sur le scope :', registration.scope);

            // Détection de mise à jour du Service Worker
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.showUpdateBanner();
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.warn('⚠️ [PWA] Erreur enregistrement Service Worker :', error);
          });
      });
    }
  },

  // 4. Écoute de l'événement d'installation PWA
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Empêche la mini-bannière par défaut sur Chrome mobile
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('📲 [PWA] Événement d\'installation capturé (beforeinstallprompt)');
      this.updateUI();
    });

    window.addEventListener('appinstalled', () => {
      console.log('🎉 [PWA] MyProtec a été installé avec succès !');
      this.deferredPrompt = null;
      this.isStandalone = true;
      try { localStorage.setItem('protec_pwa_installed', 'true'); } catch (e) {}
      this.updateUI();
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Application installée', 'MyProtec est maintenant installée sur votre appareil.', 'green');
      }
    });
  },

  // 5. Surveillance de l'état de connexion réseau (Jeu 100% en ligne connecté)
  setupNetworkListeners() {
    window.addEventListener('online', async () => {
      this.isOnline = true;
      const isConnected = await this.verifySupabaseConnectivity();
      if (isConnected) {
        this.hideOfflineBlockingModal();
        if (window.game && typeof window.game.showToast === 'function') {
          window.game.showToast('Connexion Rétablie 🌐', 'Liaison avec les serveurs Supabase restaurée. Partie synchronisée.', 'green');
        }
        if (window.game && typeof window.game.syncPlayerToServer === 'function') {
          window.game.syncPlayerToServer();
        }
      } else {
        this.showOfflineBlockingModal('Serveurs Supabase Inaccessibles');
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineBlockingModal('Connexion Internet Interrompue');
    });

    // Contrôle initial
    if (!navigator.onLine) {
      this.showOfflineBlockingModal('Connexion Internet Requise');
    } else {
      setTimeout(() => {
        this.verifySupabaseConnectivity().then(ok => {
          if (!ok) this.showOfflineBlockingModal('Serveurs Supabase Injoignables');
        });
      }, 1500);
    }
  },

  async verifySupabaseConnectivity() {
    if (!navigator.onLine) return false;
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { error } = await window.ProtecSupabase.client
          .from('players')
          .select('id')
          .limit(1);
        return !error;
      } catch (e) {
        return false;
      }
    }
    return navigator.onLine;
  },

  // Affiche un écran de blocage plein écran infranchissable
  showOfflineBlockingModal(reason = 'Connexion Internet Requise') {
    let modal = document.getElementById('pwa-offline-blocking-screen');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pwa-offline-blocking-screen';
      modal.className = 'fixed inset-0 z-[9999999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 select-none';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-rose-500/80 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in duration-300">
        <div class="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto text-3xl">
          📡
        </div>

        <div class="space-y-2">
          <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Jeu 100% En Ligne Connecté
          </span>
          <h2 class="text-xl sm:text-2xl font-black text-white">
            ${reason}
          </h2>
          <p class="text-xs text-slate-300 leading-relaxed">
            MyProtec est un univers opérationnel persistant en temps réel, synchronisé avec la base de données centrale Supabase. 
            <strong>Aucune partie ne peut se dérouler hors-ligne</strong> pour garantir l'équité multijoueur et l'intégrité de vos données.
          </p>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-400 space-y-1">
          <div class="flex items-center justify-center gap-2 text-rose-400 font-bold">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Tentative de reconnexion automatique en cours...</span>
          </div>
          <span class="text-[10px] text-slate-500 block">Vérifiez votre réseau Wi-Fi ou vos données mobiles.</span>
        </div>

        <button 
          onclick="window.ProtecPWA.retryConnection()"
          class="w-full py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-rose-600 to-pc-orange hover:brightness-110 active:scale-95 text-white shadow-xl transition flex items-center justify-center gap-2 cursor-pointer">
          <span>🔄 Réessayer la connexion maintenant</span>
        </button>
      </div>
    `;

    // Boucle de tentative automatique toutes les 4 secondes
    if (this._retryTimer) clearInterval(this._retryTimer);
    this._retryTimer = setInterval(() => {
      this.retryConnection();
    }, 4000);
  },

  hideOfflineBlockingModal() {
    if (this._retryTimer) {
      clearInterval(this._retryTimer);
      this._retryTimer = null;
    }
    const modal = document.getElementById('pwa-offline-blocking-screen');
    if (modal) modal.remove();
  },

  async retryConnection() {
    const isConnected = await this.verifySupabaseConnectivity();
    if (isConnected) {
      this.hideOfflineBlockingModal();
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Connecté aux serveurs 🌐', 'Accès multijoueur rétabli avec succès.', 'green');
      }
      if (window.game && typeof window.game.syncPlayerToServer === 'function') {
        window.game.syncPlayerToServer();
      }
    }
  },

  // Bannière discrète lors d'une mise à jour disponible
  showUpdateBanner() {
    const existing = document.getElementById('pwa-update-toast');
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = 'pwa-update-toast';
    toast.className = 'fixed bottom-5 right-5 z-50 p-4 rounded-2xl glass-panel-heavy border-2 border-pc-blue shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 max-w-sm';
    toast.innerHTML = `
      <div class="w-10 h-10 rounded-xl bg-pc-blue/15 text-pc-blue flex items-center justify-center flex-shrink-0 text-lg">
        ⚡
      </div>
      <div class="flex-1 text-xs">
        <strong class="text-slate-800 font-extrabold block">Mise à jour disponible !</strong>
        <span class="text-slate-500">Une nouvelle version de MyProtec est prête.</span>
      </div>
      <button onclick="window.location.reload()" class="px-3 py-1.5 rounded-xl bg-pc-blue text-white text-xs font-black shadow hover:bg-pc-blue-light transition">
        Actualiser
      </button>
    `;
    document.body.appendChild(toast);
  },

  // 6. Action d'installation
  async promptInstall() {
    // Si déjà installé
    if (this.isStandalone) {
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('✅ MyProtec est déjà installé sur cet appareil.', 'info');
      }
      return;
    }

    // Cas 1 : Navigateur supportant beforeinstallprompt (Chrome, Edge, Android)
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt();
        const choice = await this.deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('Utilisateur a accepté l\'installation PWA');
        } else {
          console.log('Installation refusée par l\'utilisateur');
        }
        this.deferredPrompt = null;
        this.updateUI();
      } catch (err) {
        console.warn('Erreur déclenchement prompt PWA:', err);
      }
      return;
    }

    // Cas 2 : iOS Safari ou navigateur sans prompt natif direct -> Ouvrir le guide d'installation
    this.openInstallModal();
  },

  // 7. Modale explicative d'installation (iOS & Desktop)
  openInstallModal() {
    const existing = document.getElementById('pwa-install-modal');
    if (existing) {
      existing.classList.remove('hidden');
      existing.classList.add('flex');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'pwa-install-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
    modal.onclick = (e) => {
      if (e.target === modal) this.closeInstallModal();
    };

    modal.innerHTML = `
      <div class="w-full max-w-md rounded-3xl glass-panel-heavy border border-white/80 p-6 shadow-2xl relative">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-5">
          <div class="flex items-center gap-3">
            <img src="logo_myprotec_icon.png" alt="MyProtec" class="w-12 h-12 rounded-2xl shadow-md p-1 bg-white border border-slate-100 object-contain" />
            <div>
              <h3 class="text-base font-black text-slate-900">Installer MyProtec</h3>
              <p class="text-xs text-slate-500 font-semibold">Application Web Progressive (PWA)</p>
            </div>
          </div>
          <button onclick="window.ProtecPWA.closeInstallModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
            ✕
          </button>
        </div>

        <div class="space-y-4 text-xs text-slate-600">
          <p class="font-medium text-slate-700 leading-relaxed">
            Installez <strong class="text-pc-blue font-bold">MyProtec</strong> directement sur votre écran d'accueil pour une expérience optimale :
          </p>

          <div class="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
            <div class="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center gap-2">
              <span class="text-base">🚀</span> Accès direct en 1 clic
            </div>
            <div class="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-2">
              <span class="text-base">📶</span> Fonctionne hors-ligne
            </div>
            <div class="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-center gap-2">
              <span class="text-base">🔔</span> Alertes d'urgence réelles
            </div>
            <div class="p-2.5 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-center gap-2">
              <span class="text-base">🖥️</span> Plein écran sans barre d'URL
            </div>
          </div>

          ${this.isIOS ? `
            <div class="p-4 rounded-2xl bg-slate-900 text-white space-y-2 mt-4">
              <div class="font-black text-xs text-amber-400 flex items-center gap-1.5">
                <span>🍎</span> Sur iPhone & iPad (Safari) :
              </div>
              <ol class="list-decimal list-inside space-y-1.5 text-[11px] text-slate-200">
                <li>Touchez l'icône de <strong>Partage</strong> <span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">⎋ Partager</span> en bas du navigateur.</li>
                <li>Faites défiler et choisissez <strong class="text-white">« Sur l'écran d'accueil »</strong> ➕</li>
                <li>Touchez <strong class="text-pc-orange">Ajouter</strong> en haut à droite.</li>
              </ol>
            </div>
          ` : `
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div class="font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>💻</span> Sur Ordinateur / Android :
              </div>
              <p class="text-[11px] text-slate-500">
                Cliquez sur l'icône d'installation dans la barre d'adresse de votre navigateur (Chrome/Edge/Brave) ou validez l'invitation ci-dessous :
              </p>
              ${this.deferredPrompt ? `
                <button onclick="window.ProtecPWA.promptInstall(); window.ProtecPWA.closeInstallModal();" class="w-full mt-2 py-2.5 px-4 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2">
                  📲 Installer immédiatement sur cet appareil
                </button>
              ` : `
                <div class="p-2.5 rounded-xl bg-blue-50 text-pc-blue text-[11px] font-semibold text-center">
                  Utilisez le menu ⋮ de votre navigateur puis « Installer MyProtec » ou « Ajouter à l'écran d'accueil ».
                </div>
              `}
            </div>
          `}
        </div>

        <div class="mt-5 flex items-center justify-between gap-2">
          <button onclick="localStorage.setItem('protec_pwa_installed', 'true'); window.ProtecPWA.isStandalone = true; window.ProtecPWA.updateUI(); window.ProtecPWA.closeInstallModal();" class="text-xs font-bold text-slate-500 hover:text-emerald-600 transition flex items-center gap-1">
            ✓ Déjà installée sur mon appareil
          </button>
          <button onclick="window.ProtecPWA.closeInstallModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition">
            Fermer
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  closeInstallModal() {
    const modal = document.getElementById('pwa-install-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  // 8. Mise à jour de l'UI (boutons header)
  updateUI() {
    const desktopBtn = document.getElementById('pwa-install-btn');
    const mobileBtn = document.getElementById('pwa-install-btn-mobile');

    const isInstalled = this.isStandalone || localStorage.getItem('protec_pwa_installed') === 'true';

    // Si déjà installé en standalone ou enregistré, on retire définitivement les boutons
    if (isInstalled) {
      if (desktopBtn) desktopBtn.remove();
      if (mobileBtn) mobileBtn.remove();
      return;
    }

    // Sinon, on affiche le bouton si le prompt est disponible ou sur iOS
    if (desktopBtn) {
      desktopBtn.classList.remove('hidden');
    }
    if (mobileBtn) {
      mobileBtn.classList.remove('hidden');
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) {}
    }
  }
};

/**
 * MODULE ANALYTICS SUPPORTS & INSTALLATIONS PWA
 * Détecte si le joueur a installé l'application, sur quelle plateforme il joue,
 * calcule la répartition par joueur et génère les graphiques d'analyse.
 */
window.ProtecPlatformAnalytics = {
  detectPlatform() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const plat = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();

    if (/android/.test(ua) || /android/.test(plat)) return 'Android';
    if (/iphone|ipad|ipod/.test(ua)) return 'iOS';
    if (/win/.test(plat) || /windows/.test(ua)) return 'Windows';
    if (/mac/.test(plat) || /macintosh|mac os x/.test(ua)) return 'macOS';
    if (/cros/.test(ua)) return 'ChromeOS';
    if (/linux/.test(plat) || /linux/.test(ua)) return 'Linux';
    return 'Autre';
  },

  detectDeviceType() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const width = window.innerWidth || screen.width || 1024;

    if (/ipad|tablet/.test(ua) || (width >= 768 && width <= 1024 && 'ontouchstart' in window)) {
      return 'Tablette';
    }
    if (/mobile|iphone|ipod|android.*mobile/.test(ua) || width < 768) {
      return 'Mobile';
    }
    return 'Desktop';
  },

  detectBrowser() {
    const ua = (navigator.userAgent || '').toLowerCase();
    if (/edg\//.test(ua)) return 'Edge';
    if (/samsungbrowser/.test(ua)) return 'Samsung Internet';
    if (/opr\/|opera/.test(ua)) return 'Opera';
    if (/chrome|crios/.test(ua) && !/edg\//.test(ua)) return 'Chrome';
    if (/firefox|fxios/.test(ua)) return 'Firefox';
    if (/safari/.test(ua) && !/chrome|crios/.test(ua)) return 'Safari';
    return 'Navigateur Web';
  },

  detectIsInstalled() {
    const isStandalone = (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      navigator.standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('protec_pwa_installed') === 'true'
    );
    return Boolean(isStandalone);
  },

  getCurrentDevice() {
    return {
      platform: this.detectPlatform(),
      deviceType: this.detectDeviceType(),
      browser: this.detectBrowser(),
      isInstalled: this.detectIsInstalled(),
      screenResolution: `${window.screen?.width || window.innerWidth || 0}x${window.screen?.height || window.innerHeight || 0}`,
      lastSeen: new Date().toISOString()
    };
  },

  // Enregistrer ou mettre à jour la session courante du joueur
  recordSession(user, game) {
    const dev = this.getCurrentDevice();
    let stats = null;

    try {
      const raw = localStorage.getItem('protec_platform_stats');
      if (raw) stats = JSON.parse(raw);
    } catch (e) {}

    if (!stats || typeof stats !== 'object') {
      stats = {
        platforms: {},
        devices: {},
        installations: { installed: 0, web: 0 },
        lastDevice: dev
      };
    }

    if (!stats.platforms) stats.platforms = {};
    if (!stats.devices) stats.devices = {};
    if (!stats.installations) stats.installations = { installed: 0, web: 0 };

    // Incrémenter la plateforme courante
    stats.platforms[dev.platform] = (stats.platforms[dev.platform] || 0) + 1;
    stats.devices[dev.deviceType] = (stats.devices[dev.deviceType] || 0) + 1;

    if (dev.isInstalled) {
      stats.installations.installed = (stats.installations.installed || 0) + 1;
    } else {
      stats.installations.web = (stats.installations.web || 0) + 1;
    }

    stats.lastDevice = dev;

    try {
      localStorage.setItem('protec_platform_stats', JSON.stringify(stats));
      localStorage.setItem('protec_last_device', JSON.stringify(dev));
    } catch (e) {}

    if (user) {
      user.platformStats = stats;
      user.lastDevice = dev;
    }
    if (game) {
      game.platformStats = stats;
      game.lastDevice = dev;
      if (game.player) {
        game.player.platformStats = stats;
        game.player.lastDevice = dev;
      }
    }

    return stats;
  },

  // Palette de couleurs et icônes par OS
  getPlatformStyle(platform) {
    switch (platform) {
      case 'Windows':
        return { color: 'bg-blue-600', text: 'text-blue-700', bgLight: 'bg-blue-50', icon: '💻', border: 'border-blue-200' };
      case 'Android':
        return { color: 'bg-emerald-500', text: 'text-emerald-700', bgLight: 'bg-emerald-50', icon: '🤖', border: 'border-emerald-200' };
      case 'iOS':
        return { color: 'bg-slate-800', text: 'text-slate-800', bgLight: 'bg-slate-100', icon: '🍎', border: 'border-slate-300' };
      case 'macOS':
        return { color: 'bg-indigo-600', text: 'text-indigo-700', bgLight: 'bg-indigo-50', icon: '🖥️', border: 'border-indigo-200' };
      case 'Linux':
        return { color: 'bg-amber-600', text: 'text-amber-700', bgLight: 'bg-amber-50', icon: '🐧', border: 'border-amber-200' };
      case 'ChromeOS':
        return { color: 'bg-teal-600', text: 'text-teal-700', bgLight: 'bg-teal-50', icon: '🌐', border: 'border-teal-200' };
      default:
        return { color: 'bg-slate-500', text: 'text-slate-700', bgLight: 'bg-slate-50', icon: '📱', border: 'border-slate-200' };
    }
  },

  // Génération du widget graphique pour un joueur spécifique
  renderPlayerPlatformChartHTML(platformStats, lastDevice, username = 'Joueur') {
    const stats = platformStats || { platforms: { [this.detectPlatform()]: 1 }, installations: { installed: this.detectIsInstalled() ? 1 : 0, web: this.detectIsInstalled() ? 0 : 1 } };
    const dev = lastDevice || stats.lastDevice || this.getCurrentDevice();

    const platforms = stats.platforms || {};
    const totalSessions = Object.values(platforms).reduce((a, b) => a + Number(b || 0), 0) || 1;

    const installedCount = stats.installations?.installed || (dev.isInstalled ? 1 : 0);
    const webCount = stats.installations?.web || (!dev.isInstalled ? 1 : 0);
    const totalInstalls = installedCount + webCount || 1;
    const installRate = Math.round((installedCount / totalInstalls) * 100);

    const sortedPlatforms = Object.entries(platforms).sort((a, b) => b[1] - a[1]);

    return `
      <div class="space-y-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-xs">
        <!-- En-tête Statut App Installée vs Navigateur -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Support & Installation</span>
            <div class="flex items-center gap-2 mt-0.5">
              ${dev.isInstalled ? `
                <span class="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  📱 Application PWA Installée
                </span>
              ` : `
                <span class="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                  🌐 Navigateur Web (${dev.browser || 'Web'})
                </span>
              `}
              <span class="text-[11px] font-bold text-slate-500">
                sur <strong>${dev.platform || 'Système inconnu'}</strong> (${dev.deviceType || 'Appareil'})
              </span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-slate-400 block">Taux d'usage App</span>
            <span class="text-sm font-black ${installRate >= 50 ? 'text-emerald-600' : 'text-slate-700'}">${installRate}%</span>
          </div>
        </div>

        <!-- Jauge d'utilisation App vs Web -->
        <div class="space-y-1">
          <div class="flex justify-between text-[10px] font-bold text-slate-500">
            <span class="text-emerald-700">App Installée (${installedCount} session${installedCount > 1 ? 's' : ''})</span>
            <span class="text-slate-600">Navigateur Web (${webCount} session${webCount > 1 ? 's' : ''})</span>
          </div>
          <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex border border-slate-200/60">
            <div class="bg-emerald-500 h-full transition-all" style="width: ${installRate}%"></div>
            <div class="bg-slate-300 h-full transition-all" style="width: ${100 - installRate}%"></div>
          </div>
        </div>

        <!-- Graphique des plateformes utilisées par ce joueur -->
        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between text-[11px] font-black text-slate-700">
            <span>Répartition par Plateforme de Jeu :</span>
            <span class="text-[10px] font-bold text-slate-400">${totalSessions} accès enregistrés</span>
          </div>

          <div class="space-y-2">
            ${sortedPlatforms.map(([plat, count]) => {
              const pct = Math.round((count / totalSessions) * 100);
              const style = this.getPlatformStyle(plat);
              return `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span>${style.icon}</span>
                      <span>${plat}</span>
                      ${dev.platform === plat ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-100 text-indigo-700">Actuel</span>' : ''}
                    </span>
                    <span class="font-black ${style.text}">
                      ${count} (${pct}%)
                    </span>
                  </div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
                    <div class="${style.color} h-full rounded-full transition-all" style="width: ${Math.max(4, pct)}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Détails matériels & Dernier accès -->
        <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
          <span>Navigateur : <strong>${dev.browser || 'Inconnu'}</strong></span>
          <span>Écran : <strong>${dev.screenResolution || 'N/A'}</strong></span>
          <span>Dernière connexion : <strong>${dev.lastSeen ? new Date(dev.lastSeen).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Récente'}</strong></span>
        </div>
      </div>
    `;
  },

  // Génération du tableau de bord Analytics Global de la communauté (pour le Panel Admin)
  renderGlobalPlatformAnalyticsHTML(usersList = []) {
    const users = Array.isArray(usersList) ? usersList : [];
    const totalUsers = users.length || 1;

    let installedUsersCount = 0;
    let webUsersCount = 0;
    const globalPlatforms = {};
    const globalDevices = {};

    users.forEach(u => {
      const stats = u.platformStats || u.saveData?.platformStats || null;
      const dev = u.lastDevice || u.saveData?.lastDevice || stats?.lastDevice || null;

      const isInst = (dev && dev.isInstalled) || (stats && stats.installations?.installed > 0);
      if (isInst) {
        installedUsersCount++;
      } else {
        webUsersCount++;
      }

      // Plateforme principale du joueur
      const p = (dev && dev.platform) || (stats && Object.keys(stats.platforms || {})[0]) || 'Windows';
      globalPlatforms[p] = (globalPlatforms[p] || 0) + 1;

      // Type d'appareil
      const d = (dev && dev.deviceType) || 'Desktop';
      globalDevices[d] = (globalDevices[d] || 0) + 1;
    });

    const globalInstallRate = Math.round((installedUsersCount / totalUsers) * 100);
    const sortedGlobalPlatforms = Object.entries(globalPlatforms).sort((a, b) => b[1] - a[1]);
    const topPlatform = sortedGlobalPlatforms[0] ? sortedGlobalPlatforms[0][0] : 'Windows';

    return `
      <div class="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl space-y-4">
        <!-- En-tête de section -->
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h3 class="text-sm font-black text-white flex items-center gap-2">
                Analyse des Supports de Jeu & Taux d'Installation App
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Données Live</span>
              </h3>
              <p class="text-[11px] text-white/70">Statistiques pour mesurer les supports les plus utilisés et le succès du déploiement PWA.</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-white/80 bg-white/10 px-3 py-1 rounded-xl">
            ${totalUsers} Directeur${totalUsers > 1 ? 's' : ''} analysé${totalUsers > 1 ? 's' : ''}
          </span>
        </div>

        <!-- 3 Métriques Clés -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Carte 1 : Taux d'installation -->
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span class="text-[10px] font-extrabold uppercase text-indigo-300 tracking-wider block">Taux d'Installation App</span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-black text-emerald-400">${globalInstallRate}%</span>
              <span class="text-[11px] text-white/60">(${installedUsersCount} installés)</span>
            </div>
            <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
              <div class="bg-emerald-400 h-full rounded-full" style="width: ${globalInstallRate}%"></div>
            </div>
          </div>

          <!-- Carte 2 : Plateforme N°1 -->
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span class="text-[10px] font-extrabold uppercase text-sky-300 tracking-wider block">Plateforme Leader</span>
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black text-sky-300">${topPlatform}</span>
              <span class="text-[11px] text-white/60">(${sortedGlobalPlatforms[0] ? Math.round((sortedGlobalPlatforms[0][1] / totalUsers) * 100) : 0}%)</span>
            </div>
            <span class="text-[10px] text-white/50 block">Support privilégié par les directeurs</span>
          </div>

          <!-- Carte 3 : Type d'appareil -->
          <div class="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span class="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider block">Répartition Appareils</span>
            <div class="flex items-center gap-3 text-xs font-bold pt-0.5">
              <span>🖥️ Desktop : <strong>${globalDevices['Desktop'] || 0}</strong></span>
              <span>📱 Mobile : <strong>${globalDevices['Mobile'] || 0}</strong></span>
              <span>📟 Tab : <strong>${globalDevices['Tablette'] || 0}</strong></span>
            </div>
            <span class="text-[10px] text-white/50 block">Mix d'usage bureau et mobilité</span>
          </div>
        </div>

        <!-- Graphique des Plateformes Comparatif -->
        <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
          <span class="text-xs font-black text-white block">Parts de Marché par Plateforme (OS) :</span>
          <div class="space-y-2">
            ${sortedGlobalPlatforms.map(([plat, count]) => {
              const pct = Math.round((count / totalUsers) * 100);
              const style = this.getPlatformStyle(plat);
              return `
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-white flex items-center gap-1.5">
                      <span>${style.icon}</span>
                      <span>${plat}</span>
                    </span>
                    <span class="font-black text-indigo-200">
                      ${count} joueur${count > 1 ? 's' : ''} (${pct}%)
                    </span>
                  </div>
                  <div class="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div class="${style.color} h-full rounded-full transition-all" style="width: ${Math.max(3, pct)}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }
};

// Initialisation dès chargement du script
window.addEventListener('DOMContentLoaded', () => {
  window.ProtecPWA.init();
  if (window.ProtecPlatformAnalytics) {
    window.ProtecPlatformAnalytics.recordSession(window.ProtecAuth?.currentUser, window.game);
  }
});
