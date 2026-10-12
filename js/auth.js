// js/auth.js - Authentification Multijoueur Obligatoire & Synchronisation Serveur
window.ProtecAuth = {
  token: null,
  currentUser: null,
  lastSyncTime: null,
  isSyncing: false,

  init(game = null) {
    this.token = localStorage.getItem('protec_auth_token') || null;
    this.currentUser = JSON.parse(localStorage.getItem('protec_user') || 'null');
    this.updateHeaderUI();

    if (this.token && game) {
      this.checkSession(game);
    } else if (!this.token) {
      // Si la landing page est active, ne pas afficher la modale au chargement pour laisser le joueur découvrir l'accueil
      const landingEl = document.getElementById('myprotec-landing-page');
      if (!landingEl) {
        this.openAuthModal(true);
      }
    }

    // Intercepter la sauvegarde de partie pour l'envoyer au serveur multijoueur si le jeu est instancié
    if (game && typeof game.saveGame === 'function') {
      const originalSaveGame = game.saveGame.bind(game);
      game.saveGame = () => {
        originalSaveGame();
        if (this.token && this.currentUser) {
          this.debouncedSaveToDatabase(game);
        }
      };
    }
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
            const isUserAdmin = !!(supaUser.is_admin === true || supaUser.role === 'admin');
            this.currentUser = {
              id: supaUser.id,
              username: supaUser.username,
              role: supaUser.role || (isUserAdmin ? 'admin' : 'directeur'),
              isAdmin: isUserAdmin,
              stationName: supaUser.station_name,
              city: supaUser.city
            };
            this.token = this.token || `supa-${supaUser.id}`;
            localStorage.setItem('protec_auth_token', this.token);
            localStorage.setItem('protec_user', JSON.stringify(this.currentUser));

            game.player.id = supaUser.id;
            game.player.name = supaUser.username;
            game.player.role = this.currentUser.role;
            game.player.isAdmin = isUserAdmin;

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
            // Si le compte avait un id UUID valide (compte Supabase créé précédemment) qui a disparu de la table :
            if (isUUID) {
              console.warn('⚠️ Compte joueur absent de Supabase : compte supprimé en base.');
              this.handleAccountDeleted(game);
            } else {
              // C'était un identifiant local temporaire non inscrit en base : réinitialisation silencieuse vers la création
              this.clearSession();
              this.openAuthModal(true);
            }
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

    // Sécurité stricte d'accès aux boutons Panel Admin (Desktop et Mobile)
    const isActualAdmin = !!(this.currentUser && (this.currentUser.isAdmin || this.currentUser.role === 'admin'));
    const adminBtn = document.getElementById('admin-header-btn');
    if (adminBtn) {
      if (isActualAdmin) adminBtn.classList.remove('hidden');
      else adminBtn.classList.add('hidden');
    }
    const adminMobileBtn = document.getElementById('admin-mobile-btn');
    if (adminMobileBtn) {
      if (isActualAdmin) adminMobileBtn.classList.remove('hidden');
      else adminMobileBtn.classList.add('hidden');
    }
  },

  openAuthModal(isMandatory = false) {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-modal-close-btn');
    if (!modal) return;

    // Si on se trouve sur la landing page (index.html), la modale n'est JAMAIS bloquante
    const isLandingPage = !!document.getElementById('myprotec-landing-page');
    const mandatory = isLandingPage ? false : (isMandatory || !this.currentUser || !this.token);

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
    const isLandingPage = !!document.getElementById('myprotec-landing-page');

    // Impossible de fermer si non connecté, SAUF si on se trouve sur la landing page
    if (!isLandingPage && (!this.currentUser || !this.token)) {
      return;
    }
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    // Sur jeu.html uniquement : si connecté avec succès, masquer la page d'accueil si elle existe
    const landingEl = document.getElementById('myprotec-landing-page');
    if (!isLandingPage && this.currentUser && this.token && landingEl) {
      landingEl.classList.add('is-hidden');
    }
  },

  renderModalContent(activeTab = 'login', mandatory = false) {
    const container = document.getElementById('auth-modal-body');
    const titleEl = document.getElementById('auth-modal-title');
    const subTitleEl = document.getElementById('auth-modal-subtitle');
    if (!container) return;

    // Si déjà connecté et qu'on ne demande pas explicitement l'inscription, afficher le profil du Directeur
    if (this.currentUser && this.token && activeTab !== 'register') {
      if (titleEl) titleEl.textContent = 'Profil Directeur';
      if (subTitleEl) subTitleEl.textContent = 'Réseau Opérationnel Multijoueur';

      const syncDate = this.lastSyncTime ? this.lastSyncTime.toLocaleString('fr-FR') : 'Synchronisé';
      const station = window.game?.stations?.[0];
      const actualCity = (station?.city) || 
                         (station?.name ? station.name.replace(/^Antenne\s+(de\s+|d')?/i, '') : '') || 
                         (this.currentUser.city && this.currentUser.city !== 'Paris' ? this.currentUser.city : (window.game?.selectedDept?.name || 'France'));
      const actualStationName = (station?.name) || this.currentUser.stationName || 'Antenne Protection Civile';

      const isLandingPage = !window.game || !document.getElementById('map');

      container.innerHTML = `
        <div class="space-y-4">
          <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-emerald-500/20 flex-shrink-0">
              <i data-lucide="radio" class="w-6 h-6"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-slate-900 text-base truncate">${this.currentUser.username}</span>
                <span class="text-[9px] font-black uppercase tracking-wider bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full flex-shrink-0">Connecté</span>
              </div>
              <div class="text-xs text-slate-600 mt-0.5 truncate">
                ${actualStationName} • Ville : <strong class="capitalize">${actualCity}</strong>
              </div>
            </div>
          </div>

          <!-- Bouton d'entrée dans le jeu immédiat si on est sur la page d'accueil -->
          ${isLandingPage ? `
            <div class="space-y-2 pt-1">
              <button onclick="window.location.href='jeu.html'" class="w-full py-3.5 rounded-2xl bg-[#ff6600] hover:bg-[#e65c00] active:scale-98 text-white font-black text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer">
                <span>🚀 Accéder au Poste de Commandement</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
              <button onclick="window.ProtecAuth.clearSession(); window.ProtecAuth.renderModalContent('register', false);" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
                Ouvrir une autre antenne (Nouveau compte)
              </button>
            </div>
          ` : `
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
          `}

          <div class="pt-2">
            <button onclick="window.ProtecAuth.logout(window.game)" class="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center gap-1.5 border border-rose-200/60 cursor-pointer">
              <i data-lucide="log-out" class="w-4 h-4"></i>
              Se déconnecter du serveur
            </button>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
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
                    const depts = (typeof window.ProtecAuth.getDepartementsList === 'function') 
                      ? window.ProtecAuth.getDepartementsList() 
                      : ((window.ProtecDepartements && window.ProtecDepartements.list) || []);
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
                  placeholder="Rechercher par numéro ou nom (ex: 54, 33, Meurthe-et-Moselle, Paris...)"
                  oninput="window.ProtecAuth.onRegDeptSearch(this.value)"
                  class="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pc-blue/30"
                />
              </div>

              <!-- Liste déroulante des départements filtrés -->
              <select 
                id="auth-reg-dept-select"
                onchange="window.ProtecAuth.selectRegDept(this.value)"
                class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white shadow-xs focus:ring-2 focus:ring-pc-blue/30">
                ${(() => {
                  const depts = (typeof window.ProtecAuth.getDepartementsList === 'function') 
                    ? window.ProtecAuth.getDepartementsList() 
                    : ((window.ProtecDepartements && window.ProtecDepartements.list) || []);
                  const curCode = window.ProtecAuth.regDeptCode || '75';
                  return depts.map(d => `<option value="${d.code}" ${d.code === curCode ? 'selected' : ''}>${d.code} - ${d.name} (${d.region})</option>`).join('');
                })()}
              </select>
            </div>

            <div id="auth-error-msg" class="hidden p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"></div>

            <button type="submit" id="auth-submit-btn" class="w-full py-3.5 px-4 rounded-xl text-xs font-black bg-[#ff6600] hover:bg-[#e65c00] active:scale-98 text-white transition shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer border-0 outline-none">
              <i data-lucide="shield-check" class="w-4 h-4 text-white"></i>
              <span>Créer mon compte & Démarrer le Tutoriel</span>
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
          const isUserAdmin = !!(supaRes.user.is_admin === true || supaRes.user.role === 'admin');
          data = {
            success: true,
            token: `supa-${supaRes.user.id}`,
            user: {
              id: supaRes.user.id,
              username: supaRes.user.username,
              role: supaRes.user.role || (isUserAdmin ? 'admin' : 'directeur'),
              isAdmin: isUserAdmin,
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
        if (data && data.user) {
          data.user.isAdmin = !!(data.user.is_admin === true || data.user.role === 'admin');
        }
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
      // Si la connexion a lieu depuis la landing page (hors simulateur), redirection immédiate vers le jeu
      if (!window.game || !document.getElementById('map')) {
        window.location.href = 'jeu.html';
        return;
      }

      game.player.id = data.user.id;
      game.player.name = data.user.username;
      game.player.role = data.user.role || 'user';
      game.player.isAdmin = !!data.user.isAdmin;

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

  // Liste de secours garantie des 101 départements français si departements.js n'était pas encore évalué
  FALLBACK_DEPARTEMENTS_LIST: [
    { code: '01', name: 'Ain', region: 'Auvergne-Rhône-Alpes' },
    { code: '02', name: 'Aisne', region: 'Hauts-de-France' },
    { code: '03', name: 'Allier', region: 'Auvergne-Rhône-Alpes' },
    { code: '04', name: 'Alpes-de-Haute-Provence', region: 'Provence-Alpes-Côte d’Azur' },
    { code: '05', name: 'Hautes-Alpes', region: 'Provence-Alpes-Côte d’Azur' },
    { code: '06', name: 'Alpes-Maritimes', region: 'Provence-Alpes-Côte d’Azur' },
    { code: '07', name: 'Ardèche', region: 'Auvergne-Rhône-Alpes' },
    { code: '08', name: 'Ardennes', region: 'Grand Est' },
    { code: '09', name: 'Ariège', region: 'Occitanie' },
    { code: '10', name: 'Aube', region: 'Grand Est' },
    { code: '11', name: 'Aude', region: 'Occitanie' },
    { code: '12', name: 'Aveyron', region: 'Occitanie' },
    { code: '13', name: 'Bouches-du-Rhône', region: 'Provence-Alpes-Côte d’Azur' },
    { code: '14', name: 'Calvados', region: 'Normandie' },
    { code: '15', name: 'Cantal', region: 'Auvergne-Rhône-Alpes' },
    { code: '16', name: 'Charente', region: 'Nouvelle-Aquitaine' },
    { code: '17', name: 'Charente-Maritime', region: 'Nouvelle-Aquitaine' },
    { code: '18', name: 'Cher', region: 'Centre-Val de Loire' },
    { code: '19', name: 'Corrèze', region: 'Nouvelle-Aquitaine' },
    { code: '21', name: 'Côte-d’Or', region: 'Bourgogne-Franche-Comté' },
    { code: '22', name: 'Côtes-d’Armor', region: 'Bretagne' },
    { code: '23', name: 'Creuse', region: 'Nouvelle-Aquitaine' },
    { code: '24', name: 'Dordogne', region: 'Nouvelle-Aquitaine' },
    { code: '25', name: 'Doubs', region: 'Bourgogne-Franche-Comté' },
    { code: '26', name: 'Drôme', region: 'Auvergne-Rhône-Alpes' },
    { code: '27', name: 'Eure', region: 'Normandie' },
    { code: '28', name: 'Eure-et-Loir', region: 'Centre-Val de Loire' },
    { code: '29', name: 'Finistère', region: 'Bretagne' },
    { code: '2A', name: 'Corse-du-Sud', region: 'Corse' },
    { code: '2B', name: 'Haute-Corse', region: 'Corse' },
    { code: '30', name: 'Gard', region: 'Occitanie' },
    { code: '31', name: 'Haute-Garonne', region: 'Occitanie' },
    { code: '32', name: 'Gers', region: 'Occitanie' },
    { code: '33', name: 'Gironde', region: 'Nouvelle-Aquitaine' },
    { code: '34', name: 'Hérault', region: 'Occitanie' },
    { code: '35', name: 'Ille-et-Vilaine', region: 'Bretagne' },
    { code: '36', name: 'Indre', region: 'Centre-Val de Loire' },
    { code: '37', name: 'Indre-et-Loire', region: 'Centre-Val de Loire' },
    { code: '38', name: 'Isère', region: 'Auvergne-Rhône-Alpes' },
    { code: '39', name: 'Jura', region: 'Bourgogne-Franche-Comté' },
    { code: '40', name: 'Landes', region: 'Nouvelle-Aquitaine' },
    { code: '41', name: 'Loir-et-Cher', region: 'Centre-Val de Loire' },
    { code: '42', name: 'Loire', region: 'Auvergne-Rhône-Alpes' },
    { code: '43', name: 'Haute-Loire', region: 'Auvergne-Rhône-Alpes' },
    { code: '44', name: 'Loire-Atlantique', region: 'Pays de la Loire' },
    { code: '45', name: 'Loiret', region: 'Centre-Val de Loire' },
    { code: '46', name: 'Lot', region: 'Occitanie' },
    { code: '47', name: 'Lot-et-Garonne', region: 'Nouvelle-Aquitaine' },
    { code: '48', name: 'Lozère', region: 'Occitanie' },
    { code: '49', name: 'Maine-et-Loire', region: 'Pays de la Loire' },
    { code: '50', name: 'Manche', region: 'Normandie' },
    { code: '51', name: 'Marne', region: 'Grand Est' },
    { code: '52', name: 'Haute-Marne', region: 'Grand Est' },
    { code: '53', name: 'Mayenne', region: 'Pays de la Loire' },
    { code: '54', name: 'Meurthe-et-Moselle', region: 'Grand Est' },
    { code: '55', name: 'Meuse', region: 'Grand Est' },
    { code: '56', name: 'Morbihan', region: 'Bretagne' },
    { code: '57', name: 'Moselle', region: 'Grand Est' },
    { code: '58', name: 'Nièvre', region: 'Bourgogne-Franche-Comté' },
    { code: '59', name: 'Nord', region: 'Hauts-de-France' },
    { code: '60', name: 'Oise', region: 'Hauts-de-France' },
    { code: '61', name: 'Orne', region: 'Normandie' },
    { code: '62', name: 'Pas-de-Calais', region: 'Hauts-de-France' },
    { code: '63', name: 'Puy-de-Dôme', region: 'Auvergne-Rhône-Alpes' },
    { code: '64', name: 'Pyrénées-Atlantiques', region: 'Nouvelle-Aquitaine' },
    { code: '65', name: 'Hautes-Pyrénées', region: 'Occitanie' },
    { code: '66', name: 'Pyrénées-Orientales', region: 'Occitanie' },
    { code: '67', name: 'Bas-Rhin', region: 'Grand Est' },
    { code: '68', name: 'Haut-Rhin', region: 'Grand Est' },
    { code: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
    { code: '70', name: 'Haute-Saône', region: 'Bourgogne-Franche-Comté' },
    { code: '71', name: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté' },
    { code: '72', name: 'Sarthe', region: 'Pays de la Loire' },
    { code: '73', name: 'Savoie', region: 'Auvergne-Rhône-Alpes' },
    { code: '74', name: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes' },
    { code: '75', name: 'Paris', region: 'Île-de-France' },
    { code: '76', name: 'Seine-Maritime', region: 'Normandie' },
    { code: '77', name: 'Seine-et-Marne', region: 'Île-de-France' },
    { code: '78', name: 'Yvelines', region: 'Île-de-France' },
    { code: '79', name: 'Deux-Sèvres', region: 'Nouvelle-Aquitaine' },
    { code: '80', name: 'Somme', region: 'Hauts-de-France' },
    { code: '81', name: 'Tarn', region: 'Occitanie' },
    { code: '82', name: 'Tarn-et-Garonne', region: 'Occitanie' },
    { code: '83', name: 'Var', region: 'Provence-Alpes-Côte d’Azur' },
    { code: '84', name: 'Vaucluse', region: 'Provence-Alpes-Côte d’Azur' },
    { code: '85', name: 'Vendée', region: 'Pays de la Loire' },
    { code: '86', name: 'Vienne', region: 'Nouvelle-Aquitaine' },
    { code: '87', name: 'Haute-Vienne', region: 'Nouvelle-Aquitaine' },
    { code: '88', name: 'Vosges', region: 'Grand Est' },
    { code: '89', name: 'Yonne', region: 'Bourgogne-Franche-Comté' },
    { code: '90', name: 'Territoire de Belfort', region: 'Bourgogne-Franche-Comté' },
    { code: '91', name: 'Essonne', region: 'Île-de-France' },
    { code: '92', name: 'Hauts-de-Seine', region: 'Île-de-France' },
    { code: '93', name: 'Seine-Saint-Denis', region: 'Île-de-France' },
    { code: '94', name: 'Val-de-Marne', region: 'Île-de-France' },
    { code: '95', name: 'Val-d’Oise', region: 'Île-de-France' },
    { code: '971', name: 'Guadeloupe', region: 'Guadeloupe' },
    { code: '972', name: 'Martinique', region: 'Martinique' },
    { code: '973', name: 'Guyane', region: 'Guyane' },
    { code: '974', name: 'La Réunion', region: 'La Réunion' },
    { code: '976', name: 'Mayotte', region: 'Mayotte' }
  ],

  getDepartementsList() {
    if (window.ProtecDepartements && Array.isArray(window.ProtecDepartements.list) && window.ProtecDepartements.list.length > 0) {
      return window.ProtecDepartements.list;
    }
    if (window.ProtecDepartements && Array.isArray(window.ProtecDepartements.DEPARTEMENTS_DATA) && window.ProtecDepartements.DEPARTEMENTS_DATA.length > 0) {
      return window.ProtecDepartements.DEPARTEMENTS_DATA;
    }
    return this.FALLBACK_DEPARTEMENTS_LIST;
  },

  onRegDeptSearch(val) {
    const q = (val || '').trim().toLowerCase();
    const depts = this.getDepartementsList();
    const select = document.getElementById('auth-reg-dept-select');
    if (!select) return;

    const filtered = depts.filter(d => {
      if (!q) return true;
      const codeStr = String(d.code).toLowerCase();
      const nameStr = String(d.name || '').toLowerCase();
      const regionStr = String(d.region || '').toLowerCase();
      return codeStr.includes(q) || nameStr.includes(q) || regionStr.includes(q);
    });

    if (filtered.length === 0) {
      select.innerHTML = `<option value="" disabled selected>Aucun département trouvé pour "${val}"</option>`;
      return;
    }

    select.innerHTML = filtered.map(d => `<option value="${d.code}" ${d.code === this.regDeptCode ? 'selected' : ''}>${d.code} - ${d.name} (${d.region})</option>`).join('');

    // Si le département actuellement sélectionné n'est pas dans le filtre, on prend le premier résultat
    if (!filtered.some(d => d.code === this.regDeptCode)) {
      this.selectRegDept(filtered[0].code);
    }
  },

  selectRegDept(code) {
    if (!code) return;
    this.regDeptCode = code;
    const depts = this.getDepartementsList();
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
          submitBtn.innerHTML = '<i data-lucide="shield-check" class="w-4 h-4"></i> <span>Créer mon compte & Démarrer le Tutoriel</span>';
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
        submitBtn.innerHTML = '<i data-lucide="shield-check" class="w-4 h-4"></i> <span>Créer mon compte & Démarrer le Tutoriel</span>';
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

      // PURGE FORMELLE DU LOCALSTORAGE : Tout nouveau compte démarre avec une sauvegarde locale vierge
      localStorage.removeItem('protec_live_save_v4');
      localStorage.removeItem('protec_offline_queue');
      localStorage.removeItem('protec_admin_auth');

      // Si l'inscription a lieu depuis la landing page (hors simulateur), redirection immédiate vers le jeu
      if (!window.game || !document.getElementById('map')) {
        window.location.href = 'jeu.html';
        return;
      }

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
  hasPendingSave: false,
  debouncedSaveToDatabase(game, forceInstant = false) {
    if (this.debouncedSaveTimeout) clearTimeout(this.debouncedSaveTimeout);
    if (forceInstant) {
      this.saveToDatabase(game);
      return;
    }
    this.debouncedSaveTimeout = setTimeout(() => {
      this.saveToDatabase(game);
    }, 400);
  },

  async saveToDatabase(game) {
    if (!this.currentUser) return;
    if (this.isSyncing) {
      this.hasPendingSave = true;
      return;
    }
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
        const moneyVal = (game.resources?.money !== undefined) ? game.resources.money : ((game.resources?.budget !== undefined) ? game.resources.budget : 15000);
        if (game.resources) {
          game.resources.money = moneyVal;
          game.resources.budget = moneyVal;
          game.resources.funds = moneyVal;
        }

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
          adRewards: game.adRewards,
          annualContracts: game.annualContracts || [],
          messagesHistory: game.messagesHistory || {},
          monthlyEventsGenerated: game.monthlyEventsGenerated || {},
          aascConvention: game.aascConvention || null,
          samuConvention: game.samuConvention || null,
          sdisConvention: game.sdisConvention || null,
          sncfConvention: game.sncfConvention || null,
          cumpConvention: game.cumpConvention || null,
          conventionRequests: game.conventionRequests || null,
          financesHistory: game.financesHistory || [],
          alertSubscription: game.alertSubscription || null,
          treasury: game.treasury || null,
          bureau: game.bureau || null,
          samuGarde: game.samuGarde || null,
          sdisGarde: game.sdisGarde || null,
          reputation_samu: game.reputation_samu !== undefined ? game.reputation_samu : 50,
          reputation_sdis: game.reputation_sdis !== undefined ? game.reputation_sdis : 50,
          reputation_prefecture: game.reputation_prefecture !== undefined ? game.reputation_prefecture : 50,
          reputation_villes: game.reputation_villes || {}
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
      if (this.hasPendingSave) {
        this.hasPendingSave = false;
        setTimeout(() => this.saveToDatabase(game), 50);
      }
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
      game.annualContracts = Array.isArray(savedData.annualContracts) ? savedData.annualContracts : [];
      if (Array.isArray(savedData.messagesHistory)) game.messagesHistory = savedData.messagesHistory;
      if (savedData.monthlyEventsGenerated && typeof savedData.monthlyEventsGenerated === 'object') game.monthlyEventsGenerated = savedData.monthlyEventsGenerated;
      if (savedData.reputation_samu !== undefined) game.reputation_samu = savedData.reputation_samu;
      if (savedData.reputation_sdis !== undefined) game.reputation_sdis = savedData.reputation_sdis;
      if (savedData.reputation_prefecture !== undefined) game.reputation_prefecture = savedData.reputation_prefecture;
      if (savedData.reputation_villes && typeof savedData.reputation_villes === 'object') game.reputation_villes = savedData.reputation_villes;

      if (savedData.resources) {
        game.resources = savedData.resources;
        const m = (game.resources.money !== undefined) ? game.resources.money : ((game.resources.budget !== undefined) ? game.resources.budget : 15000);
        game.resources.money = m;
        game.resources.budget = m;
        game.resources.funds = m;
      }
      if (savedData.aascConvention) game.aascConvention = savedData.aascConvention;
      if (savedData.samuConvention) game.samuConvention = savedData.samuConvention;
      if (savedData.sdisConvention) game.sdisConvention = savedData.sdisConvention;
      if (savedData.sncfConvention) game.sncfConvention = savedData.sncfConvention;
      if (savedData.cumpConvention) game.cumpConvention = savedData.cumpConvention;
      if (savedData.conventionRequests) game.conventionRequests = savedData.conventionRequests;
      if (Array.isArray(savedData.financesHistory)) game.financesHistory = savedData.financesHistory;
      if (savedData.alertSubscription) game.alertSubscription = savedData.alertSubscription;
      if (savedData.treasury) game.treasury = savedData.treasury;
      if (savedData.bureau) game.bureau = savedData.bureau;
      if (savedData.samuGarde) game.samuGarde = savedData.samuGarde;
      if (savedData.sdisGarde) game.sdisGarde = savedData.sdisGarde;

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

      // Assurer la présence du VPSP initial et normaliser les indicatifs d'antenne
      if (typeof game.ensureStarterVehicle === 'function') {
        game.ensureStarterVehicle();
      }
      if (typeof game.normalizeAllVehicles === 'function') {
        game.normalizeAllVehicles();
      }

      if (typeof game.initReactiveResources === 'function') {
        game.initReactiveResources();
      }
      game.updateStatsUI();
      if (game.renderStations) game.renderStations();
      if (game.renderMissions) game.renderMissions();
      if (typeof game.cleanPastDevis === 'function') {
        game.cleanPastDevis();
      }
      if (window.ProtecSystems && window.ProtecSystems.updateWeatherAndDayNight) {
        window.ProtecSystems.updateWeatherAndDayNight(game);
      }
    } catch (err) {
      console.error('Erreur application données:', err);
    }
  },

  logout(game = null) {
    if (this.token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      }).catch(() => {});
    }
    this.clearSession();
    const g = game || window.game;
    if (g && typeof g.showToast === 'function') {
      g.showToast('Déconnexion', 'Vous avez quitté le serveur multijoueur.', 'blue');
    }
    if (window.MyProtecLanding && typeof window.MyProtecLanding.showLanding === 'function') {
      window.MyProtecLanding.showLanding();
      if (typeof window.MyProtecLanding.updateAuthButtonsState === 'function') {
        window.MyProtecLanding.updateAuthButtonsState();
      }
    } else {
      this.openAuthModal(true);
    }
  },

  // Prise en compte de la suppression du compte dans la base de données
  handleAccountDeleted(game = null) {
    // Verrou anti-spam : éviter les exécutions multiples en rafale
    if (this._isHandlingAccountDeleted) return;
    this._isHandlingAccountDeleted = true;
    setTimeout(() => { this._isHandlingAccountDeleted = false; }, 4000);

    // Arrêt immédiat du watchdog de surveillance
    if (window.ProtecSupabase && window.ProtecSupabase.stopAccountWatchdog) {
      window.ProtecSupabase.stopAccountWatchdog();
    }

    const wasLoggedIn = Boolean(this.currentUser && this.currentUser.id);
    this.clearSession();
    localStorage.removeItem('protec_last_login_username');
    localStorage.removeItem('protec_last_login_password');
    localStorage.removeItem('protec_live_save_v4');
    localStorage.removeItem('protec_department_code');
    localStorage.removeItem('protec_player_id');

    const g = game || window.game;
    // Purge totale de l'antenne locale pour éviter toute persistance orpheline
    if (g) {
      if (g.player) g.player.id = null;
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
      
      // Afficher l'alerte UNIQUEMENT si l'utilisateur était réellement connecté auparavant
      if (wasLoggedIn) {
        g.showToast('Compte Supprimé', 'Votre compte a été supprimé de la base de données. Vous avez été déconnecté.', 'red');
      }
    }

    // Réaffiche le modal de connexion obligatoire
    this.openAuthModal(true);

    const errorEl = document.getElementById('auth-error-msg');
    if (errorEl) {
      if (wasLoggedIn) {
        errorEl.textContent = 'Votre compte n’existe plus dans la base de données (supprimé). Veuillez créer un nouveau compte ou vous reconnecter.';
        errorEl.classList.remove('hidden');
      } else {
        errorEl.classList.add('hidden');
      }
    }
  }
};
