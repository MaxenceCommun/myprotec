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

// Initialisation dès chargement du script
window.addEventListener('DOMContentLoaded', () => {
  window.ProtecPWA.init();
});
