// js/auth.js - Authentification Multijoueur Obligatoire & Synchronisation Serveur
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
    } else {
      // Connexion obligatoire au lancement du jeu : affiche le sas de connexion
      this.openAuthModal(true);
    }

    // Intercepter la sauvegarde de partie pour l'envoyer au serveur multijoueur
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
      // 1. Validation prioritaire via Supabase Cloud (si compte déjà connecté ou client Supabase actif)
      if (window.ProtecSupabase && window.ProtecSupabase.client && this.currentUser) {
        try {
          let supaUser = null;
          const isUUID = typeof this.currentUser.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.currentUser.id);
          
          if (isUUID) {
            const { data, error } = await window.ProtecSupabase.client
              .from('players')
              .select('*')
              .eq('id', this.currentUser.id)
              .maybeSingle();
            if (!error && data) supaUser = data;
          }

          if (!supaUser && this.currentUser.username) {
            const { data: byName, error: errName } = await window.ProtecSupabase.client
              .from('players')
              .select('*')
              .eq('username', this.currentUser.username)
              .maybeSingle();
            if (!errName && byName) supaUser = byName;
          }

          if (supaUser) {
            this.currentUser = {
              id: supaUser.id,
              username: supaUser.username,
              role: supaUser.role || 'directeur',
              stationName: supaUser.station_name,
              city: supaUser.city
            };
            this.token = this.token || `supa-${supaUser.id}`;
            localStorage.setItem('protec_auth_token', this.token);
            localStorage.setItem('protec_user', JSON.stringify(this.currentUser));

            game.player.id = supaUser.id;
            game.player.name = supaUser.username;
            game.player.role = supaUser.role || 'user';

            this.updateHeaderUI(false);
            this.closeAuthModal();

            // Activer la surveillance de compte et la synchronisation multijoueur temps réel
            if (window.ProtecSupabase) {
              window.ProtecSupabase.startAccountWatchdog(game);
              window.ProtecSupabase.initMultiplayerRealtime(game);
            }

            // Charger directement la progression depuis Supabase
            await this.checkCloudSaveOnLogin(game);

            if (game.syncPlayerToServer) {
              game.syncPlayerToServer();
            }
            return;
          } else {
            // La ligne n'existe plus dans la table players : compte supprimé de la BDD !
            console.warn('⚠️ Compte joueur absent de Supabase : compte supprimé en base.');
            this.handleAccountDeleted(game);
            return;
          }
        } catch (supaErr) {
          console.warn('Vérification Supabase différée:', supaErr);
        }
      }

      // 2. Si non validé par Supabase et token local présent (serveur Node.js local)
      if (this.token && !this.token.startsWith('supa-')) {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${this.token}` }
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.user) {
            this.currentUser = data.user;
            localStorage.setItem('protec_user', JSON.stringify(data.user));

            game.player.id = data.user.id;
            game.player.name = data.user.username;
            game.player.role = data.user.role || 'user';

            this.updateHeaderUI(false);
            this.closeAuthModal();

            await this.checkCloudSaveOnLogin(game);

            if (game.syncPlayerToServer) {
              game.syncPlayerToServer();
            }
            return;
          }
        }
      }

      // 3. Si compte local présent en mémoire (mode PWA / Cloud actif)
      if (this.currentUser) {
        game.player.id = this.currentUser.id;
        game.player.name = this.currentUser.username;
        this.updateHeaderUI(false);
        this.closeAuthModal();
        await this.checkCloudSaveOnLogin(game);
      } else {
        this.clearSession();
        this.openAuthModal(true);
      }
    } catch (e) {
      console.warn('Erreur vérification session multijoueur:', e);
      if (this.currentUser) {
        game.player.id = this.currentUser.id;
        game.player.name = this.currentUser.username;
        this.updateHeaderUI(false);
        this.closeAuthModal();
        await this.checkCloudSaveOnLogin(game);
      } else {
        this.openAuthModal(true);
      }
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
        dbStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Hors-ligne';
        dbStatus.className = 'text-[8px] sm:text-[9px] font-semibold text-amber-600 flex items-center gap-1';
      } else {
        dbStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> En ligne Multi';
        dbStatus.className = 'text-[8px] sm:text-[9px] font-semibold text-emerald-600 flex items-center gap-1';
      }

      if (statusIcon) {
        statusIcon.className = 'w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center transition';
      }
    } else {
      userLabel.textContent = 'Connexion';
      userLabel.className = 'text-xs font-bold text-slate-700 truncate max-w-[90px] sm:max-w-[120px]';
      dbStatus.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-red-400"></span> Non connecté';
      dbStatus.className = 'text-[8px] sm:text-[9px] font-semibold text-red-500 flex items-center gap-1';

      if (statusIcon) {
        statusIcon.className = 'w-6 h-6 rounded-lg bg-pc-blue/10 text-pc-blue flex items-center justify-center transition';
      }
    }
  },

  openAuthModal(isMandatory = false) {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-modal-close-btn');
    if (!modal) return;

    // Si le joueur n'est pas connecté, la modal est obligatoire et non refermable
    const mandatory = isMandatory || !this.currentUser || !this.token;

    if (closeBtn) {
      if (mandatory) {
        closeBtn.classList.add('hidden');
        closeBtn.classList.remove('flex');
      } else {
        closeBtn.classList.remove('hidden');
        closeBtn.classList.add('flex');
      }
    }

    this.renderModalContent('login', mandatory);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  },

  closeAuthModal() {
    // Impossible de fermer si non connecté
    if (!this.currentUser || !this.token) {
      return;
    }
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  renderModalContent(activeTab = 'login', mandatory = false) {
    const container = document.getElementById('auth-modal-body');
    const titleEl = document.getElementById('auth-modal-title');
    const subTitleEl = document.getElementById('auth-modal-subtitle');
    if (!container) return;

    // Si déjà connecté, afficher le profil du Directeur
    if (this.currentUser && this.token) {
      if (titleEl) titleEl.textContent = 'Profil Directeur';
      if (subTitleEl) subTitleEl.textContent = 'Réseau Opérationnel Multijoueur';

      const syncDate = this.lastSyncTime ? this.lastSyncTime.toLocaleString('fr-FR') : 'Synchronisé';
      const station = window.game?.stations?.[0];
      const actualCity = (station?.city) || 
                         (station?.name ? station.name.replace(/^Antenne\s+(de\s+|d')?/i, '') : '') || 
                         (this.currentUser.city && this.currentUser.city !== 'Paris' ? this.currentUser.city : (window.game?.selectedDept?.name || 'France'));
      const actualStationName = (station?.name) || this.currentUser.stationName || 'Antenne Protection Civile';

      container.innerHTML = `
        <div class="space-y-4">
          <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-emerald-500/20">
              <i data-lucide="radio" class="w-6 h-6"></i>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-slate-900 text-base">${this.currentUser.username}</span>
                <span class="text-[9px] font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">Multijoueur</span>
              </div>
              <div class="text-xs text-slate-600 mt-0.5">
                ${actualStationName} • Ville : <strong class="capitalize">${actualCity}</strong>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-2xl glass-card space-y-2 text-xs text-slate-700">
            <div class="flex justify-between items-center py-1 border-b border-slate-100">
              <span class="text-slate-500 font-medium">Mode de Jeu</span>
              <span class="font-bold text-pc-blue flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Multijoueur
              </span>
            </div>
            <div class="flex justify-between items-center py-1">
              <span class="text-slate-500 font-medium">Synchronisation Réseau</span>
              <span class="font-mono font-bold text-slate-800" id="auth-sync-date">${syncDate}</span>
            </div>
          </div>

          <!-- Collection d'Écussons Commémoratifs & Rareté -->
          ${window.ProtecMultiplayer ? window.ProtecMultiplayer.renderBadgesCollectionHTML(window.game) : ''}

          <!-- Initiative d'Événement Fédéral Exceptionnel -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-lg space-y-2.5">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-sm">
                <i data-lucide="crown" class="w-4 h-4"></i>
              </div>
              <div>
                <h5 class="text-xs font-black text-amber-200 uppercase tracking-wide">Initiative Fédérale Exceptionnelle</h5>
                <p class="text-[10px] text-slate-300">Organisation de Grand Rassemblement & DPS National</p>
              </div>
            </div>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              En tant que Directeur d'Antenne, vous pouvez soumettre un dossier à caractère exceptionnel pour créer un événement public d'envergure nationale ou inter-départementale doté d'un écusson officiel. Tout dossier est rigoureusement audité et validé par l'administration fédérale avant déploiement.
            </p>
            <button onclick="window.ProtecAuth.closeAuthModal(); window.ProtecMultiplayer.openCreateCommunityEventModal(window.game);" class="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <i data-lucide="sparkles" class="w-4 h-4 text-slate-950"></i>
              Proposer un Événement Fédéral (Dossier Exceptionnel)
            </button>
          </div>

          <div class="pt-2">
            <button onclick="window.ProtecAuth.logout(window.game)" class="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center gap-1.5 border border-rose-200/60">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              Se déconnecter du serveur
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Écran de Connexion Obligatoire
    if (titleEl) titleEl.textContent = 'Connexion Multijoueur Requise';
    if (subTitleEl) subTitleEl.textContent = 'Accès au Réseau Opérationnel';

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Message informatif multijoueur -->
        <div class="p-3 rounded-2xl bg-pc-blue/5 border border-pc-blue/15 text-xs text-slate-600 leading-relaxed">
          🚨 <strong>Le jeu fonctionne exclusivement en multijoueur connecté.</strong> Connectez-vous ou créez votre compte directeur pour implanter votre antenne et interagir en temps réel avec les autres joueurs.
        </div>

        <!-- Onglets -->
        <div class="flex rounded-xl bg-slate-100/90 p-1 gap-1 border border-slate-200/50">
          <button onclick="window.ProtecAuth.renderModalContent('login', true)" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'login' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
            Connexion Joueur
          </button>
          <button onclick="window.ProtecAuth.renderModalContent('register', true)" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'register' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
            Nouveau Directeur
          </button>
        </div>

        <!-- Formulaire de Connexion -->
        ${activeTab === 'login' ? `
          <form onsubmit="window.ProtecAuth.handleLoginForm(event, window.game)" class="space-y-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Identifiant Directeur</label>
              <div class="relative">
                <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input type="text" id="auth-login-username" required value="${localStorage.getItem('protec_last_login_username') || this.currentUser?.username || ''}" placeholder="Ex: Cdt_Dupont" class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Mot de passe</label>
              <div class="relative">
                <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                <input type="password" id="auth-login-password" required value="${localStorage.getItem('protec_last_login_password') || ''}" placeholder="••••••••" class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
              </div>
            </div>

            <div id="auth-error-msg" class="hidden p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"></div>

            <button type="submit" id="auth-submit-btn" class="w-full py-3 rounded-xl text-xs font-extrabold bg-pc-blue text-white hover:bg-pc-blue-light transition shadow-lg shadow-pc-blue/20 flex items-center justify-center gap-2">
              <i data-lucide="log-in" class="w-4 h-4"></i>
              Entrer dans la Partie Multijoueur
            </button>
          </form>
        ` : `
          <!-- Formulaire d'Inscription Officiel : Pseudo, Mot de Passe, Département, Nom de l'Antenne -->
          <form onsubmit="window.ProtecAuth.handleRegisterForm(event, window.game)" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Pseudo du Directeur</label>
                <div class="relative">
                  <i data-lucide="user-plus" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                  <input type="text" id="auth-reg-username" required minlength="3" placeholder="Ex: Cdt_Thomas" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Mot de passe</label>
                <div class="relative">
                  <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                  <input type="password" id="auth-reg-password" required minlength="4" placeholder="••••••••" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
                </div>
              </div>
            </div>

            <!-- Nom de l'antenne -->
            <div>
              <label class="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">NOM DE L'ANTENNE</label>
              <input type="text" id="auth-reg-station" required placeholder="Ex: Antenne de Bordeaux, Antenne Paris 15..." class="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue" />
            </div>

            <!-- Département avec recherche rapide -->
            <div class="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div class="flex items-center justify-between">
                <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Département d'Implantation
                </label>
                <span id="auth-reg-dept-badge" class="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ${(() => {
                    const depts = (window.ProtecDepartements && window.ProtecDepartements.list) || [];
                    const cur = depts.find(d => d.code === (window.ProtecAuth.regDeptCode || '75')) || depts[0];
                    return cur ? `✓ ${cur.code} - ${cur.name}` : '75 - Paris';
                  })()}
                </span>
              </div>

              <div class="relative">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                <input 
                  type="search" 
                  id="auth-reg-dept-search"
                  placeholder="Rechercher par numéro ou nom (ex: 33, 974, Gironde, Paris...)"
                  oninput="window.ProtecAuth.onRegDeptSearch(this.value)"
                  class="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pc-blue/30"
                />
              </div>

              <!-- Liste déroulante des départements filtrés -->
              <select 
                id="auth-reg-dept-select"
                onchange="window.ProtecAuth.selectRegDept(this.value)"
                class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white">
                ${(() => {
                  const depts = (window.ProtecDepartements && window.ProtecDepartements.list) || [];
                  const curCode = window.ProtecAuth.regDeptCode || '75';
                  return depts.map(d => `<option value="${d.code}" ${d.code === curCode ? 'selected' : ''}>${d.code} - ${d.name} (${d.region})</option>`).join('');
                })()}
              </select>
            </div>

            <div id="auth-error-msg" class="hidden p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"></div>

            <button type="submit" id="auth-submit-btn" class="w-full py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-pc-orange to-pc-orange-dark text-white hover:brightness-110 transition shadow-lg shadow-pc-orange/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              Créer mon compte & Démarrer le Tutoriel
            </button>
          </form>
        `}

        <!-- Mentions légales & Confidentialité (Obligatoire AdSense & RGPD) -->
        <div class="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Simulation bénévole & indépendante</span>
          <button type="button" onclick="window.ProtecPrivacy.openModal()" class="text-pc-blue font-semibold hover:underline flex items-center gap-1">
            <i data-lucide="shield-check" class="w-3 h-3"></i> Confidentialité & RGPD
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
    submitBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Connexion au serveur...';

    try {
      let data = null;

      // 1. Tentative de connexion via Supabase Cloud en priorité
      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        const supaRes = await window.ProtecSupabase.loginPlayer(username, password);
        if (supaRes && supaRes.user) {
          data = {
            success: true,
            token: `supa-${supaRes.user.id}`,
            user: {
              id: supaRes.user.id,
              username: supaRes.user.username,
              role: supaRes.user.role || 'directeur',
              stationName: supaRes.user.station_name,
              city: supaRes.user.city
            }
          };
        }
      }

      // 2. Si non connecté via Supabase, tentative serveur local
      if (!data) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        data = await res.json();
      }

      if (!data || !data.success) {
        errorEl.textContent = (data && data.error) || 'Erreur lors de la connexion BDD.';
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i> Entrer dans la Partie Multijoueur';
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      // Connexion réussie
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('protec_auth_token', data.token);
      localStorage.setItem('protec_user', JSON.stringify(data.user));
      localStorage.setItem('protec_last_login_username', username);
      localStorage.setItem('protec_last_login_password', password);

      game.player.id = data.user.id;
      game.player.name = data.user.username;
      game.player.role = data.user.role || 'user';

      game.showToast('Connexion Réussie !', `Bienvenue Commandant ${data.user.username} ! Connexion au serveur multijoueur active.`, 'green');
      this.updateHeaderUI();

      // Charger la partie sauvegardée sur le serveur
      await this.checkCloudSaveOnLogin(game);
      this.closeAuthModal();

      // Activer la surveillance de compte et la synchronisation multijoueur temps réel
      if (window.ProtecSupabase) {
        window.ProtecSupabase.startAccountWatchdog(game);
        window.ProtecSupabase.initMultiplayerRealtime(game);
      }

      // Synchroniser immédiatement la présence multijoueur
      if (game.syncPlayerToServer) {
        game.syncPlayerToServer();
      }

    } catch (err) {
      errorEl.textContent = 'Impossible de contacter le serveur multijoueur.';
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
    }
  },

  regDeptCode: '75',

  onRegDeptSearch(val) {
    const q = (val || '').trim().toLowerCase();
    const depts = (window.ProtecDepartements && window.ProtecDepartements.list) || [];
    const select = document.getElementById('auth-reg-dept-select');
    if (!select) return;

    const filtered = depts.filter(d => {
      if (!q) return true;
      return d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q);
    });

    select.innerHTML = filtered.map(d => `<option value="${d.code}" ${d.code === this.regDeptCode ? 'selected' : ''}>${d.code} - ${d.name} (${d.region})</option>`).join('');

    if (filtered.length > 0 && !filtered.some(d => d.code === this.regDeptCode)) {
      this.selectRegDept(filtered[0].code);
    }
  },

  selectRegDept(code) {
    this.regDeptCode = code;
    const depts = (window.ProtecDepartements && window.ProtecDepartements.list) || [];
    const cur = depts.find(d => d.code === code) || depts[0];
    const badge = document.getElementById('auth-reg-dept-badge');
    if (badge && cur) {
      badge.textContent = `✓ ${cur.code} - ${cur.name}`;
    }
    const select = document.getElementById('auth-reg-dept-select');
    if (select && select.value !== code) {
      select.value = code;
    }
  },

  async handleRegisterForm(e, game) {
    e.preventDefault();
    const username = document.getElementById('auth-reg-username').value.trim();
    const password = document.getElementById('auth-reg-password').value;
    const stationName = (document.getElementById('auth-reg-station')?.value || '').trim() || 'Antenne Protection Civile';
    const departmentCode = this.regDeptCode || document.getElementById('auth-reg-dept-select')?.value || '54';
    // La commune exacte sera définie dès l'implantation physique du bâtiment sur la carte
    let city = null;
    if (stationName && stationName.length > 2 && !stationName.toLowerCase().startsWith('antenne')) {
      city = stationName;
    }

    const errorEl = document.getElementById('auth-error-msg');
    const submitBtn = document.getElementById('auth-submit-btn');

    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Création du compte joueur...';

    try {
      let data = null;

      // 1. Enregistrement dans Supabase Cloud en priorité
      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        const supaRes = await window.ProtecSupabase.registerPlayer(username, password, { stationName, departmentCode, city });
        if (supaRes && supaRes.user) {
          data = {
            success: true,
            token: `supa-${supaRes.user.id}`,
            user: {
              id: supaRes.user.id,
              username: supaRes.user.username,
              role: supaRes.user.role || 'directeur',
              stationName: supaRes.user.station_name,
              city: supaRes.user.city || city,
              departmentCode: supaRes.user.department_code || departmentCode
            }
          };
        } else if (supaRes && supaRes.error) {
          errorEl.textContent = supaRes.error;
          errorEl.classList.remove('hidden');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="shield-check" class="w-4 h-4"></i> Créer mon compte & Rejoindre la carte';
          if (window.lucide) window.lucide.createIcons();
          return;
        }
      }

      // 2. Si pas de réponse Supabase, appel API locale
      if (!data) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, stationName, departmentCode })
        });
        data = await res.json();
      }

      if (!data || !data.success) {
        errorEl.textContent = (data && data.error) || 'Erreur lors de l’inscription.';
        errorEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="shield-check" class="w-4 h-4"></i> Créer mon compte & Rejoindre la carte';
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      // Inscription réussie
      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('protec_auth_token', data.token);
      localStorage.setItem('protec_user', JSON.stringify(data.user));
      localStorage.setItem('protec_last_login_username', username);
      localStorage.setItem('protec_last_login_password', password);

      game.player.id = data.user.id;
      game.player.name = data.user.username;
      game.player.role = data.user.role || 'user';
      game.player.deptRole = data.user.deptRole || 'antenne_principale';
      game.player.departmentCode = data.user.departmentCode || departmentCode;
      game.currentDepartmentCode = game.player.departmentCode;
      localStorage.setItem('protec_department_code', game.player.departmentCode);

      // Nouveau compte : état d'antenne vierge et remise à zéro pour démarrer l'implantation
      game.stations = [];
      game.vehicles = [];
      game.volunteers = [];
      game.missions = [];
      game.devis = [];
      game.candidatures = [];
      game.resources.money = 15000;
      game.resources.reputationScore = 50;
      if (game.rewards) {
        (game.rewards.dailyTasks || []).forEach(t => { t.current = 0; t.done = false; });
        (game.rewards.weeklyTasks || []).forEach(w => { w.current = 0; w.done = false; });
      }
      if (game.grants) game.grants.totalVolunteerHours = 0;
      game.updateStatsUI();

      if (game.populateDepartmentSelector) game.populateDepartmentSelector();
      if (game.returnToMyAntenna) game.returnToMyAntenna();

      const roleLabel = game.player.deptRole === 'antenne_principale' ? 'Antenne Principale du Département' : 'Antenne Départementale';
      game.showToast('Compte Créé !', `Bienvenue ${data.user.username} (${roleLabel} • Dépt ${game.player.departmentCode}).`, 'green');
      this.updateHeaderUI();

      // Sauvegarde immédiate et synchronisation multijoueur
      await this.saveToDatabase(game);
      this.closeAuthModal();

      // Activer la surveillance de compte et la synchronisation multijoueur temps réel
      if (window.ProtecSupabase) {
        window.ProtecSupabase.startAccountWatchdog(game);
        window.ProtecSupabase.initMultiplayerRealtime(game);
      }

      if (game.syncPlayerToServer) {
        game.syncPlayerToServer();
      }

      // Démarrer immédiatement le Tuto en 4 étapes de lancement officiel
      setTimeout(() => {
        if (window.ProtecOnboarding) {
          window.ProtecOnboarding.showWizard(game, {
            teamName: stationName,
            deptCode: departmentCode
          });
        }
      }, 300);

    } catch (err) {
      errorEl.textContent = 'Impossible de contacter le serveur multijoueur.';
      errorEl.classList.remove('hidden');
      submitBtn.disabled = false;
    }
  },

  async checkCloudSaveOnLogin(game) {
    if (!this.currentUser) return;

    // 1. Chargement prioritaire depuis Supabase Cloud
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const supaSave = await window.ProtecSupabase.loadGameState(this.currentUser.id, this.currentUser.username);
        if (supaSave && supaSave.save_data && supaSave.save_data.stations && supaSave.save_data.stations.length > 0) {
          this.applyCloudSave(game, supaSave.save_data);
          this.lastSyncTime = new Date(supaSave.updated_at || Date.now());
          this.updateHeaderUI();
          return;
        }
      } catch (supaErr) {
        console.warn('Vérification Supabase différée:', supaErr);
      }
    }

    // 2. Chargement depuis le serveur local (BDD de référence)
    if (!this.token) return;
    try {
      const res = await fetch('/api/game/load', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.save && result.save.stations && result.save.stations.length > 0) {
          // Une sauvegarde officielle avec antenne existe en BDD : l'appliquer à 100%
          this.applyCloudSave(game, result.save);
          this.lastSyncTime = new Date(result.savedAt || Date.now());
          this.updateHeaderUI();
        } else {
          // L'antenne a été supprimée ou n'existe pas en BDD : PURGE TOTALE DE TOUTE PERSISTANCE LOCALE
          game.stations = [];
          game.vehicles = [];
          game.volunteers = [];
          game.missions = [];
          game.devis = [];
          game.candidatures = [];
          game.formations = [];
          localStorage.removeItem('protec_live_save_v4');

          if (game.renderStations) game.renderStations();
          if (game.renderMissions) game.renderMissions();
          if (game.updateStatsUI) game.updateStatsUI();

          // Surtout : NE PAS renvoyer d'ancienne sauvegarde locale vers la BDD !
        }
      }
    } catch (e) {
      console.warn('Erreur chargement cloud:', e);
    }

    // Si aucune antenne n'existe en BDD, lancer impérativement le wizard officiel d'implantation
    if (!game.stations || game.stations.length === 0) {
      setTimeout(() => {
        if (window.ProtecOnboarding) {
          window.ProtecOnboarding.showWizard(game);
        } else if (game.showOnboardingModal) {
          game.showOnboardingModal();
        }
      }, 500);
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
    if (!this.currentUser || this.isSyncing) return;
    // Ne pas sauvegarder un état sans antenne pour ne pas créer d'anomalies
    if (!game.stations || game.stations.length === 0) return;

    this.isSyncing = true;
    try {
      // 1. Sauvegarde instantanée dans Supabase Cloud (table game_saves)
      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        await window.ProtecSupabase.saveGameState(this.currentUser.id, this.currentUser.username, game);
        this.lastSyncTime = new Date();
        this.updateHeaderUI();
      }

      // 2. Synchronisation de redondance avec le serveur local
      if (this.token && !this.token.startsWith('supa-')) {
        const stateToSave = {
          player: game.player,
          clock: game.clock,
          resources: game.resources,
          stations: game.stations,
          vehicles: game.vehicles,
          volunteers: game.volunteers,
          missions: game.missions,
          devis: game.devis,
          candidatures: game.candidatures,
          formations: game.formations,
          history: game.history,
          grants: game.grants,
          baseUpgrades: game.baseUpgrades,
          skillsTree: game.skillsTree,
          challenges: game.challenges,
          adRewards: game.adRewards
        };

        await fetch('/api/game/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: JSON.stringify(stateToSave)
        });
        this.lastSyncTime = new Date();
        this.updateHeaderUI();
      }
    } catch (e) {
      console.warn('Sauvegarde BDD différée:', e);
      this.updateHeaderUI(true);
    } finally {
      this.isSyncing = false;
    }
  },

  async manualSaveToDatabase(game) {
    await this.saveToDatabase(game);
    game.showToast('Synchronisation Réussie', 'Votre partie est à jour sur le serveur multijoueur.', 'green');
    this.renderModalContent();
  },

  async manualLoadFromDatabase(game) {
    // 1. Restauration prioritaire depuis Supabase Cloud
    if (window.ProtecSupabase && window.ProtecSupabase.client && this.currentUser) {
      try {
        const supaSave = await window.ProtecSupabase.loadGameState(this.currentUser.id, this.currentUser.username);
        if (supaSave && supaSave.save_data) {
          this.applyCloudSave(game, supaSave.save_data);
          game.showToast('Progression Restaurée', 'Données restaurées depuis la base Supabase Cloud.', 'green');
          this.closeAuthModal();
          return;
        }
      } catch (e) {
        console.warn('Erreur chargement Supabase manuel:', e);
      }
    }

    // 2. Restauration depuis serveur local
    if (!this.token || this.token.startsWith('supa-')) {
      game.showToast('Information', 'Votre profil est synchronisé avec Supabase Cloud.', 'blue');
      return;
    }

    try {
      const res = await fetch('/api/game/load', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.save) {
          this.applyCloudSave(game, result.save);
          game.showToast('Progression Restaurée', 'Données restaurées depuis le serveur local.', 'green');
          this.closeAuthModal();
        } else {
          game.showToast('Aucune sauvegarde', 'Aucune sauvegarde antérieure trouvée en BDD.', 'orange');
        }
      }
    } catch (e) {
      game.showToast('Erreur', 'Impossible de contacter le serveur local.', 'orange');
    }
  },

  applyCloudSave(game, savedData) {
    try {
      if (!savedData) return;

      // La BDD est l'unique source de vérité
      game.stations = Array.isArray(savedData.stations) ? savedData.stations : [];
      game.vehicles = Array.isArray(savedData.vehicles) ? savedData.vehicles : [];
      game.volunteers = Array.isArray(savedData.volunteers) ? savedData.volunteers.map(v => {
        if (v.name && game.cleanVolunteerName) v.name = game.cleanVolunteerName(v.name);
        return v;
      }) : [];
      game.missions = Array.isArray(savedData.missions) ? savedData.missions : [];
      game.devis = Array.isArray(savedData.devis) ? savedData.devis : [];
      game.candidatures = Array.isArray(savedData.candidatures) ? savedData.candidatures : [];
      game.formations = Array.isArray(savedData.formations) ? savedData.formations : [];

      if (savedData.resources) game.resources = savedData.resources;
      if (savedData.clock) game.clock = savedData.clock;
      if (savedData.grants) game.grants = savedData.grants;
      if (savedData.baseUpgrades) game.baseUpgrades = savedData.baseUpgrades;
      if (savedData.skillsTree) game.skillsTree = savedData.skillsTree;
      if (savedData.logistics) game.logistics = savedData.logistics;
      if (savedData.weather) game.weather = savedData.weather;
      if (savedData.prefectureState) game.prefectureState = savedData.prefectureState;
      if (savedData.adRewards) {
        game.adRewards = savedData.adRewards;
        if (window.ProtecAds) window.ProtecAds.updateUI(game);
      }

      // Purger immédiatement tout résidu local
      localStorage.removeItem('protec_live_save_v4');

      // Assainissement si aucune antenne n'est encore configurée
      if (!game.stations || game.stations.length === 0) {
        if (game.grants) game.grants.totalVolunteerHours = 0;
        if (game.rewards) {
          (game.rewards.dailyTasks || []).forEach(t => { t.current = 0; t.done = false; });
          (game.rewards.weeklyTasks || []).forEach(w => { w.current = 0; w.done = false; });
        }
      }

      game.updateStatsUI();
      if (game.renderStations) game.renderStations();
      if (game.renderMissions) game.renderMissions();
      if (window.ProtecSystems && window.ProtecSystems.updateWeatherAndDayNight) {
        window.ProtecSystems.updateWeatherAndDayNight(game);
      }
    } catch (err) {
      console.error('Erreur application données:', err);
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
    game.showToast('Déconnexion', 'Vous avez quitté le serveur multijoueur.', 'blue');
    // Réaffiche immédiatement le sas de connexion obligatoire
    this.openAuthModal(true);
  },

  // Prise en compte de la suppression du compte dans la base de données
  handleAccountDeleted(game = null) {
    const g = game || window.game;
    this.clearSession();
    localStorage.removeItem('protec_last_login_username');
    localStorage.removeItem('protec_last_login_password');
    localStorage.removeItem('protec_live_save_v4');
    localStorage.removeItem('protec_department_code');

    // Purge totale de l'antenne locale pour éviter toute persistance orpheline
    if (g) {
      g.stations = [];
      g.vehicles = [];
      g.volunteers = [];
      g.missions = [];
      g.devis = [];
      g.candidatures = [];
      g.formations = [];
      if (g.renderStations) g.renderStations();
      if (g.renderMissions) g.renderMissions();
      if (g.updateStatsUI) g.updateStatsUI();
      g.showToast('Compte Supprimé', 'Votre compte a été supprimé de la base de données. Vous avez été déconnecté.', 'red');
    }

    // Réaffiche immédiatement le modal de connexion obligatoire
    this.openAuthModal(true);

    const errorEl = document.getElementById('auth-error-msg');
    if (errorEl) {
      errorEl.textContent = 'Votre compte n’existe plus dans la base de données (supprimé). Veuillez créer un nouveau compte ou vous reconnecter.';
      errorEl.classList.remove('hidden');
    }
  }
};
