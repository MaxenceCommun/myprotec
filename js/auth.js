// js/auth.js - Gestion de l'Authentification, Comptes & Synchronisation BDD
window.ProtecAuth = {
  token: null,
  currentUser: null,
  lastSyncTime: null,
  isSyncing: false,

  init(game) {
    this.token = localStorage.getItem('protec_auth_token') || null;
    this.currentUser = JSON.parse(localStorage.getItem('protec_user') || 'null');
    this.updateHeaderUI();

    if (this.token) {
      this.checkSession(game);
    }

    // Intercepter saveGame de game pour synchroniser automatiquement avec la BDD
    const originalSaveGame = game.saveGame.bind(game);
    game.saveGame = () => {
      originalSaveGame();
      if (this.token && this.currentUser) {
        this.debouncedSaveToDatabase(game);
      }
    };
  },

  async checkSession(game) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user;
        localStorage.setItem('protec_user', JSON.stringify(data.user));
        this.updateHeaderUI();
        // Vérifier si une sauvegarde BDD existe et peut être chargée
        this.checkCloudSaveOnLogin(game);
      } else {
        // Session expirée
        this.clearSession();
      }
    } catch (e) {
      console.warn('Mode hors-ligne ou serveur distant injoignable pour la BDD:', e);
      this.updateHeaderUI(true);
    }
  },

  clearSession() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('protec_auth_token');
    localStorage.removeItem('protec_user');
    this.updateHeaderUI();
  },

  updateHeaderUI(offline = false) {
    const userLabel = document.getElementById('auth-user-label');
    const dbStatus = document.getElementById('auth-db-status');
    const statusIcon = document.getElementById('auth-status-icon');

    if (!userLabel || !dbStatus) return;

    if (this.currentUser && this.token) {
      userLabel.textContent = this.currentUser.username;
      userLabel.className = 'text-xs font-bold text-pc-blue truncate max-w-[90px] sm:max-w-[120px]';

      if (offline) {
        dbStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> BDD locale';
        dbStatus.className = 'text-[8px] sm:text-[9px] font-semibold text-amber-600 flex items-center gap-1';
      } else {
        const timeStr = this.lastSyncTime ? this.lastSyncTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Connecté';
        dbStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> BDD : ${timeStr}`;
        dbStatus.className = 'text-[8px] sm:text-[9px] font-semibold text-emerald-600 flex items-center gap-1';
      }

      if (statusIcon) {
        statusIcon.className = 'w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center transition';
      }
    } else {
      userLabel.textContent = 'Connexion';
      userLabel.className = 'text-xs font-bold text-slate-700 truncate max-w-[90px] sm:max-w-[120px]';
      dbStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Non connecté';
      dbStatus.className = 'text-[8px] sm:text-[9px] font-semibold text-slate-400 flex items-center gap-1';

      if (statusIcon) {
        statusIcon.className = 'w-6 h-6 rounded-lg bg-pc-blue/10 text-pc-blue flex items-center justify-center transition';
      }
    }
  },

  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    this.renderModalContent();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  },

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  renderModalContent(activeTab = 'login') {
    const container = document.getElementById('auth-modal-body');
    if (!container) return;

    // Si déjà connecté, afficher le profil et la gestion BDD
    if (this.currentUser && this.token) {
      const syncDate = this.lastSyncTime ? this.lastSyncTime.toLocaleString('fr-FR') : 'En attente de synchro';
      container.innerHTML = `
        <div class="space-y-4">
          <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-emerald-500/20">
              <i data-lucide="check-circle-2" class="w-6 h-6"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-slate-900 text-base">${this.currentUser.username}</span>
                <span class="text-[9px] font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">En Ligne BDD</span>
              </div>
              <div class="text-xs text-slate-600 mt-0.5">
                ${this.currentUser.stationName} • Ville : <strong class="capitalize">${this.currentUser.city || 'Paris'}</strong>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-2xl glass-card space-y-2 text-xs text-slate-700">
            <div class="flex justify-between items-center py-1 border-b border-slate-100">
              <span class="text-slate-500 font-medium">Statut Base de Données</span>
              <span class="font-bold text-emerald-600 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Synchronisation active
              </span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-slate-100">
              <span class="text-slate-500 font-medium">Dernière sauvegarde BDD</span>
              <span class="font-mono font-bold text-slate-800" id="auth-sync-date">${syncDate}</span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-slate-500 font-medium">Identifiant unique BDD</span>
              <span class="font-mono text-[10px] text-slate-400">${this.currentUser.id}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <button onclick="window.ProtecAuth.manualSaveToDatabase(window.game)" class="py-2.5 px-3 rounded-xl text-xs font-bold bg-pc-blue text-white hover:bg-pc-blue-light transition flex items-center justify-center gap-1.5 shadow-sm">
              <i data-lucide="cloud-upload" class="w-4 h-4"></i>
              Sauvegarder en BDD
            </button>
            <button onclick="window.ProtecAuth.manualLoadFromDatabase(window.game)" class="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-1.5">
              <i data-lucide="cloud-download" class="w-4 h-4"></i>
              Recharger depuis BDD
            </button>
          </div>

          <div class="pt-2">
            <button onclick="window.ProtecAuth.logout(window.game)" class="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center gap-1.5 border border-rose-200/60">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              Se déconnecter
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Écran de Connexion / Inscription
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Tabs Header -->
        <div class="flex rounded-xl bg-slate-100/90 p-1 gap-1 border border-slate-200/50">
          <button onclick="window.ProtecAuth.renderModalContent('login')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'login' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
            Connexion
          </button>
          <button onclick="window.ProtecAuth.renderModalContent('register')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'register' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
            Créer un compte BDD
          </button>
        </div>

        <!-- Formulaire de Connexion -->
        ${activeTab === 'login' ? `
          <form onsubmit="window.ProtecAuth.handleLoginForm(event, window.game)" class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Identifiant Directeur</label>
              <div class="relative">
                <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input type="text" id="auth-login-username" required placeholder="Ex: Cdt_Dupont" class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Mot de passe</label>
              <div class="relative">
                <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input type="password" id="auth-login-password" required placeholder="••••••••" class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
              </div>
            </div>

            <div id="auth-error-msg" class="hidden p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"></div>

            <button type="submit" id="auth-submit-btn" class="w-full py-3 rounded-xl text-xs font-extrabold bg-pc-blue text-white hover:bg-pc-blue-light transition shadow-lg shadow-pc-blue/20 flex items-center justify-center gap-2">
              <i data-lucide="log-in" class="w-4 h-4"></i>
              Se connecter & Synchroniser la BDD
            </button>
          </form>
        ` : `
          <!-- Formulaire d'Inscription -->
          <form onsubmit="window.ProtecAuth.handleRegisterForm(event, window.game)" class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Identifiant Directeur / Secouriste</label>
              <div class="relative">
                <i data-lucide="user-plus" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input type="text" id="auth-reg-username" required minlength="3" placeholder="Ex: Cdt_Thomas" class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Mot de passe</label>
              <div class="relative">
                <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input type="password" id="auth-reg-password" required minlength="4" placeholder="Minimum 4 caractères" class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nom de l'Antenne</label>
                <input type="text" id="auth-reg-station" placeholder="Ex: Antenne Paris 15e" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
              </div>
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Ville de rattachement</label>
                <select id="auth-reg-city" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue">
                  <option value="paris">Paris (75)</option>
                  <option value="lyon">Lyon (69)</option>
                  <option value="marseille">Marseille (13)</option>
                  <option value="bordeaux">Bordeaux (33)</option>
                  <option value="lille">Lille (59)</option>
                </select>
              </div>
            </div>

            <div id="auth-error-msg" class="hidden p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"></div>

            <button type="submit" id="auth-submit-btn" class="w-full py-3 rounded-xl text-xs font-extrabold bg-pc-orange text-white hover:bg-pc-orange-dark transition shadow-lg shadow-pc-orange/20 flex items-center justify-center gap-2">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              Créer mon compte & Enregistrer mon antenne en BDD
            </button>
          </form>
        `}

        <div class="pt-2 text-center">
          <button onclick="window.ProtecAuth.closeAuthModal()" class="text-xs font-bold text-slate-400 hover:text-slate-600 transition">
            Continuer en invité (sauvegarde locale navigateur uniquement)
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async handleLoginForm(e, game) {
    e.preventDefault();
    const username = document.getElementById('auth-login-username').value;
    const password = document.getElementById('auth-login-password').value;
    const errorEl = document.getElementById('auth-error-msg');
    const submitBtn = document.getElementById('auth-submit-btn');

    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Connexion...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        errorEl.textContent = data.error || 'Erreur lors de la connexion.';
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i> Se connecter';
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      // Connexion réussie
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('protec_auth_token', data.token);
      localStorage.setItem('protec_user', JSON.stringify(data.user));

      game.player.id = data.user.id;
      game.player.name = data.user.username;

      game.showToast('Connexion Réussie !', `Bienvenue Commandant ${data.user.username}. Vos données sont synchronisées en BDD.`, 'green');
      this.updateHeaderUI();

      // Charger la partie sauvegardée en BDD
      await this.checkCloudSaveOnLogin(game);
      this.closeAuthModal();

    } catch (err) {
      errorEl.textContent = 'Impossible de contacter le serveur BDD.';
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
    }
  },

  async handleRegisterForm(e, game) {
    e.preventDefault();
    const username = document.getElementById('auth-reg-username').value;
    const password = document.getElementById('auth-reg-password').value;
    const stationName = document.getElementById('auth-reg-station').value;
    const city = document.getElementById('auth-reg-city').value;
    const errorEl = document.getElementById('auth-error-msg');
    const submitBtn = document.getElementById('auth-submit-btn');

    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Création du compte BDD...';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, stationName, city })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        errorEl.textContent = data.error || 'Erreur lors de l’inscription.';
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="shield-check" class="w-4 h-4"></i> Créer mon compte';
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      // Inscription réussie
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('protec_auth_token', data.token);
      localStorage.setItem('protec_user', JSON.stringify(data.user));

      game.player.id = data.user.id;
      game.player.name = data.user.username;

      // Si l'utilisateur a donné un nom d'antenne, on l'applique
      if (stationName && game.stations.length > 0) {
        game.stations[0].name = stationName;
        game.currentStationName = stationName;
      }

      game.showToast('Compte Créé !', `Bienvenue ${data.user.username}. Votre antenne est enregistrée dans la base de données.`, 'green');
      this.updateHeaderUI();

      // Sauvegarde immédiate de l'état actuel en BDD
      await this.saveToDatabase(game);
      this.closeAuthModal();

    } catch (err) {
      errorEl.textContent = 'Impossible de contacter le serveur BDD.';
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
    }
  },

  async checkCloudSaveOnLogin(game) {
    if (!this.token) return;
    try {
      const res = await fetch('/api/game/load', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.save) {
          this.applyCloudSave(game, result.save);
          this.lastSyncTime = new Date(result.savedAt || Date.now());
          this.updateHeaderUI();
          game.showToast('Sauvegarde BDD Chargée', 'Votre progression a été restaurée depuis le serveur.', 'blue');
        } else {
          // Aucune sauvegarde en BDD : on y envoie la partie locale
          await this.saveToDatabase(game);
        }
      }
    } catch (e) {
      console.warn('Erreur vérification sauvegarde cloud:', e);
    }
  },

  debouncedSaveTimeout: null,
  debouncedSaveToDatabase(game) {
    if (this.debouncedSaveTimeout) clearTimeout(this.debouncedSaveTimeout);
    this.debouncedSaveTimeout = setTimeout(() => {
      this.saveToDatabase(game);
    }, 1500);
  },

  async saveToDatabase(game) {
    if (!this.token || this.isSyncing) return;
    this.isSyncing = true;
    try {
      const stateToSave = {
        player: game.player,
        clock: game.clock,
        resources: game.resources,
        stations: game.stations,
        vehicles: game.vehicles,
        volunteers: game.volunteers,
        missions: game.missions,
        history: game.history,
        grants: game.grants,
        baseUpgrades: game.baseUpgrades,
        skillsTree: game.skillsTree,
        challenges: game.challenges
      };

      const res = await fetch('/api/game/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(stateToSave)
      });

      if (res.ok) {
        this.lastSyncTime = new Date();
        this.updateHeaderUI();
      }
    } catch (e) {
      console.warn('Sauvegarde BDD en échec:', e);
      this.updateHeaderUI(true);
    } finally {
      this.isSyncing = false;
    }
  },

  async manualSaveToDatabase(game) {
    await this.saveToDatabase(game);
    game.showToast('Sauvegarde BDD Réussie', 'Votre progression a été synchronisée sur le serveur de base de données.', 'green');
    this.renderModalContent();
  },

  async manualLoadFromDatabase(game) {
    if (!this.token) return;
    try {
      const res = await fetch('/api/game/load', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.save) {
          this.applyCloudSave(game, result.save);
          game.showToast('Progression Restaurée', 'La partie stockée sur la base de données a été chargée.', 'green');
          this.closeAuthModal();
        } else {
          game.showToast('Aucune sauvegarde', 'Aucune sauvegarde antérieure n’a été trouvée sur la BDD.', 'orange');
        }
      }
    } catch (e) {
      game.showToast('Erreur', 'Impossible de charger la sauvegarde BDD.', 'orange');
    }
  },

  applyCloudSave(game, savedData) {
    try {
      if (savedData.stations) game.stations = savedData.stations;
      if (savedData.vehicles) game.vehicles = savedData.vehicles;
      if (savedData.volunteers) game.volunteers = savedData.volunteers;
      if (savedData.missions) game.missions = savedData.missions;
      if (savedData.resources) game.resources = savedData.resources;
      if (savedData.clock) game.clock = savedData.clock;
      if (savedData.grants) game.grants = savedData.grants;
      if (savedData.baseUpgrades) game.baseUpgrades = savedData.baseUpgrades;
      if (savedData.skillsTree) game.skillsTree = savedData.skillsTree;
      if (savedData.challenges) game.challenges = savedData.challenges;

      // Actualisation complète de l'interface et de la carte
      game.updateStatsUI();
      if (game.renderStationMarkers) game.renderStationMarkers();
      if (game.renderMissionsOnMap) game.renderMissionsOnMap();
      if (window.ProtecSystems && window.ProtecSystems.updateWeatherAndDayNight) {
        window.ProtecSystems.updateWeatherAndDayNight(game);
      }
    } catch (err) {
      console.error('Erreur application sauvegarde BDD:', err);
    }
  },

  logout(game) {
    if (this.token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      }).catch(() => {});
    }
    this.clearSession();
    game.showToast('Déconnexion', 'Vous êtes maintenant en session invité locale.', 'blue');
    this.renderModalContent('login');
  }
};
