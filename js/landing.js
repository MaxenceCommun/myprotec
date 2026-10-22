/**
 * MYPROTEC - MOTEUR INTERACTIF DE LA PAGE D'ACCUEIL (LANDING PAGE)
 * Gestion de la télémétrie en direct, téléscripteur opérationnel, accordéon des 6 pôles,
 * vitrine des écussons avec 3D Tilt dynamique, reflets holographiques Foil et sas d'authentification.
 */

window.MyProtecLanding = {
  isInitialized: false,
  tickerTimer: null,
  counterTimer: null,
  activeFilter: 'all',

  // Données de base de télémétrie opérationnelle (synchronisées avec Supabase en direct)
  telemetry: {
    stations: 0,
    volunteers: 0,
    fleet: 0,
    dps: 0
  },

  // Flux de dépêches pour le téléscripteur opérationnel (alimenté par les opérations réelles)
  tickerLogPreset: [],

  // Barème officiel des points selon le niveau de rareté
  rarityWeights: {
    historique: 5,
    epique: 3,
    rare: 2,
    commun: 1
  },

  // Données des vitrines d'antennes de secours (strictement réelles : Supabase & antenne locale du joueur)
  antennesShowcases: [],

  // Initialisation au chargement de la page
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.checkLandingVisibility();
    this.checkReferralBanner();
    this.updateAuthButtonsState();
    this.initLiveTicker();
    this.initDynamicCounters();
    this.initAccordion();
    this.syncLeaderboardWithDatabase().then(() => {
      this.renderShowcaseGrid('all');
    });
    this.init3DTilt();
    this.initTooltip();

    // Fermeture de la modale de collection avec la touche Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAntenneCollectionModal();
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  checkReferralBanner() {
    let refCode = null;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      refCode = urlParams.get('ref') || urlParams.get('parrain');
      if (refCode) {
        refCode = refCode.trim().toUpperCase();
        try { localStorage.setItem('protec_pending_ref', refCode); } catch (e) {}
      } else {
        try { refCode = localStorage.getItem('protec_pending_ref'); } catch (e) {}
      }
    } catch (e) {}

    const banner = document.getElementById('landing-referral-banner');
    const label = document.getElementById('landing-ref-code-label');
    const heroBtnText = document.getElementById('landing-hero-register-text');

    if (refCode && banner) {
      if (label) label.textContent = refCode;
      banner.classList.remove('hidden');
      if (heroBtnText) {
        heroBtnText.innerHTML = `Jouer gratuitement <span class="text-[11px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black ml-1 shadow-xs">+1 500 €</span>`;
      }
    }
  },

  // Décision de visibilité : Sur la page index.html, la landing page reste TOUJOURS visible
  checkLandingVisibility() {
    const landingEl = document.getElementById('myprotec-landing-page');
    if (!landingEl) return;

    // Ne jamais masquer le contenu sur la landing page
    landingEl.classList.remove('is-hidden');
    landingEl.scrollTop = 0;
    this.updateAuthButtonsState();
  },

  // Mise à jour adaptative des boutons d'accès (Navbar et Hero) selon la session
  updateAuthButtonsState() {
    const token = localStorage.getItem('protec_auth_token');
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('protec_user') || 'null');
    } catch (e) {
      user = null;
    }

    const isLoggedIn = !!(token || user || window.ProtecAuth?.currentUser);
    const navActions = document.getElementById('landing-nav-actions');
    const heroActions = document.getElementById('landing-hero-actions');

    if (isLoggedIn) {
      const activeUser = user || window.ProtecAuth?.currentUser || {};
      const username = activeUser.username || 'Joueur';
      const safeName = (function(str) {
        return String(str || '').replace(/[&<>"']/g, m => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        })[m]);
      })(username);

      if (navActions) {
        navActions.innerHTML = `
          <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-slate-800/90 border border-blue-200/80 dark:border-slate-700 text-xs font-bold text-[#002e6d] dark:text-blue-200 shadow-xs">
            <i data-lucide="shield" class="w-3.5 h-3.5 text-[#0055b8] dark:text-blue-400"></i>
            <span class="truncate max-w-[130px]">${safeName}</span>
          </div>
          <button onclick="window.MyProtecLanding.enterGame()" class="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#0055b8] to-[#0284c7] hover:from-[#004494] hover:to-[#0270a8] shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
            <span>Mon Antenne</span>
          </button>
          <button onclick="window.ProtecAuth.logout(); window.MyProtecLanding.updateAuthButtonsState();" class="p-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white/80 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition cursor-pointer" title="Se déconnecter">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
          </button>
        `;
      }

      if (heroActions) {
        heroActions.innerHTML = `
          <button onclick="window.MyProtecLanding.enterGame()" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-[#0055b8] to-[#0284c7] hover:from-[#004494] hover:to-[#0270a8] text-white font-black text-sm shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-2 cursor-pointer group">
            <i data-lucide="play" class="w-4 h-4 fill-current"></i>
            <span>Accéder à mon Antenne</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </button>
          <button onclick="window.ProtecAuth.logout(); window.MyProtecLanding.updateAuthButtonsState();" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 font-extrabold text-sm border border-slate-200/90 dark:border-slate-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Changer de compte</span>
          </button>
        `;
      }
    } else {
      if (navActions) {
        navActions.innerHTML = `
          <button onclick="window.MyProtecLanding.openAuth('login')" class="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition shadow-xs flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="user" class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"></i>
            <span>Connexion</span>
          </button>
          <button onclick="window.MyProtecLanding.handlePlayClick()" class="px-4.5 py-2 rounded-xl text-xs font-black text-white bg-[#ff6600] hover:bg-[#e65c00] shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
            <span>Jouer</span>
          </button>
        `;
      }

      if (heroActions) {
        heroActions.innerHTML = `
          <button onclick="window.MyProtecLanding.handlePlayClick()" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#ff6600] hover:bg-[#e65c00] text-white font-black text-sm shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-2 cursor-pointer group">
            <i data-lucide="play" class="w-4 h-4 fill-current"></i>
            <span id="landing-hero-register-text">Jouer gratuitement</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </button>
          <button onclick="window.MyProtecLanding.openAuth('login')" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-extrabold text-sm border border-slate-200/90 dark:border-slate-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="log-in" class="w-4 h-4 text-[#0055b8] dark:text-blue-400"></i>
            <span>Se connecter</span>
          </button>
        `;
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  // Action unifiée du bouton Jouer (vers jeu.html si connecté, modal login/register si non connecté)
  handlePlayClick() {
    const token = localStorage.getItem('protec_auth_token');
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('protec_user') || 'null');
    } catch (e) {}
    if (token || user || window.ProtecAuth?.currentUser) {
      this.enterGame();
      return;
    }
    const hasAccount = !!localStorage.getItem('protec_last_login_username') || !!localStorage.getItem('protec_user');
    this.openAuth(hasAccount ? 'login' : 'register');
  },

  // Ouvrir le simulateur opérationnel en direct
  enterGame() {
    window.location.href = 'jeu.html';
  },

  // Réafficher la landing page (ex: depuis le profil ou déconnexion)
  showLanding() {
    const landingEl = document.getElementById('myprotec-landing-page');
    if (landingEl) {
      landingEl.classList.remove('is-hidden');
      landingEl.scrollTop = 0;
    }
    this.updateAuthButtonsState();
  },

  // Déclencher la modal d'authentification dans le mode souhaité
  openAuth(mode = 'login') {
    if (window.ProtecAuth) {
      window.ProtecAuth.openAuthModal(false);
      window.ProtecAuth.renderModalContent(mode, false);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  // 1. TÉLÉMÉTRIE EN DIRECT RÉELLE (DONNÉES DU RÉSEAU SUPABASE)
  async initDynamicCounters() {
    const elStations = document.getElementById('lp-stat-stations');
    const elVols = document.getElementById('lp-stat-volunteers');
    const elFleet = document.getElementById('lp-stat-fleet');
    const elDps = document.getElementById('lp-stat-dps');

    const updateStatsFromData = (stats) => {
      if (!stats) return;
      this.telemetry.stations = stats.stations || this.telemetry.stations || 54;
      this.telemetry.volunteers = stats.volunteers || this.telemetry.volunteers || 1428;
      this.telemetry.fleet = stats.fleet || this.telemetry.fleet || 312;
      this.telemetry.dps = stats.dps || this.telemetry.dps || 84;

      if (elStations) elStations.textContent = this.telemetry.stations.toLocaleString('fr-FR');
      if (elVols) elVols.textContent = this.telemetry.volunteers.toLocaleString('fr-FR');
      if (elFleet) elFleet.textContent = this.telemetry.fleet.toLocaleString('fr-FR');
      if (elDps) elDps.textContent = this.telemetry.dps.toLocaleString('fr-FR');
    };

    // Rendu initial immédiat avec les données de base
    updateStatsFromData(this.telemetry);

    const fetchRealData = async () => {
      if (window.ProtecSupabase && typeof window.ProtecSupabase.getOperationalTelemetry === 'function') {
        try {
          const stats = await window.ProtecSupabase.getOperationalTelemetry();
          updateStatsFromData(stats);
        } catch (e) {
          console.warn('Erreur télémétrie réelle:', e);
        }
      }
    };

    // Chargement immédiat des statistiques réelles depuis Supabase
    await fetchRealData();

    // Actualisation périodique de fond toutes les 12 secondes
    if (this.counterTimer) clearInterval(this.counterTimer);
    this.counterTimer = setInterval(fetchRealData, 12000);
  },

  // 2. CONSOLE DE TÉLÉSCRIPTEUR (MAIN COURANTE DES OPÉRATIONS 100% RÉELLE)
  async initLiveTicker() {
    const feed = document.getElementById('lp-ticker-feed');
    if (!feed) return;

    // Rendu d'une ligne de main courante réelle
    const renderRow = (item, prepend = true) => {
      if (!item) return;
      const row = document.createElement('div');
      row.className = 'lp-ticker-item p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs flex items-start gap-3 text-xs mb-2.5 transition animate-fade-in';
      row.innerHTML = `
        <span class="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg flex-shrink-0 mt-0.5">
          ${item.time || new Date().toLocaleTimeString('fr-FR')}
        </span>
        <div class="w-6 h-6 rounded-lg ${item.bg || 'bg-blue-50'} ${item.color || 'text-blue-600'} border ${item.border || 'border-blue-200'} flex items-center justify-center flex-shrink-0 mt-0.5">
          <i data-lucide="${item.icon || 'radio'}" class="w-3.5 h-3.5"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-slate-700 leading-snug font-medium break-words">
            ${item.text || ''}
          </p>
        </div>
      `;

      if (prepend) {
        // Retirer les éventuels messages d'attente initiaux si un vrai log arrive
        const emptyNotice = feed.querySelector('.lp-ticker-empty');
        if (emptyNotice) feed.removeChild(emptyNotice);

        feed.insertBefore(row, feed.firstChild);
      } else {
        feed.appendChild(row);
      }

      if (window.lucide) window.lucide.createIcons();

      // Conserver un maximum de 18 lignes visibles
      while (feed.children.length > 18) {
        feed.removeChild(feed.lastChild);
      }
    };

    feed.innerHTML = '';

    // Chargement initial des vrais événements opérationnels enregistrés
    if (window.ProtecSupabase && typeof window.ProtecSupabase.getOperationalLogs === 'function') {
      try {
        const logs = await window.ProtecSupabase.getOperationalLogs(15);
        if (logs && logs.length > 0) {
          logs.forEach(logItem => renderRow(logItem, false));
        } else {
          // Si aucune opération n'a encore été enregistrée dans la BDD (état vierge)
          const nowStr = new Date().toLocaleTimeString('fr-FR');
          feed.innerHTML = `
            <div class="lp-ticker-empty py-8 text-center text-xs text-slate-400 font-medium">
              Aucune transmission en cours.
            </div>
          `;
          if (window.lucide) window.lucide.createIcons();
        }
      } catch (err) {
        console.warn('Erreur chargement logs opérationnels réels:', err);
      }
    }

    // Connexion au flux temps réel Supabase Realtime (< 50ms)
    if (window.ProtecSupabase && typeof window.ProtecSupabase.subscribeOperationalStream === 'function') {
      window.ProtecSupabase.subscribeOperationalStream(
        (updatedStats) => {
          if (updatedStats) {
            const elVols = document.getElementById('lp-stat-volunteers');
            const elDps = document.getElementById('lp-stat-dps');
            const elFleet = document.getElementById('lp-stat-fleet');
            const elPatients = document.getElementById('lp-stat-patients');
            if (elVols) elVols.textContent = (updatedStats.volunteers || 0).toLocaleString('fr-FR');
            if (elDps) elDps.textContent = (updatedStats.dps || 0).toLocaleString('fr-FR');
            if (elFleet) elFleet.textContent = (updatedStats.fleet || 0).toLocaleString('fr-FR');
            if (elPatients) elPatients.textContent = (updatedStats.patients || 0).toLocaleString('fr-FR');
          }
        },
        (newLogItem) => {
          renderRow(newLogItem, true);
        }
      );
    }
  },

  // 3. ACCORDÉON DES 6 PÔLES D'ANTENNE
  initAccordion() {
    const items = document.querySelectorAll('.pole-accordion-item');
    if (!items || items.length === 0) return;

    const setExpanded = (activeItem) => {
      items.forEach(el => {
        if (el === activeItem) {
          el.classList.add('is-expanded');
        } else {
          el.classList.remove('is-expanded');
        }
      });
    };

    items.forEach((item, index) => {
      // Au survol (curseur) sur desktop
      item.addEventListener('mouseenter', () => {
        setExpanded(item);
      });

      // Au clic (tactile / mobile)
      item.addEventListener('click', () => {
        setExpanded(item);
      });
    });

    // Par défaut, le 1er pôle est déplié
    setExpanded(items[0]);
  },

  // Calcul du score de collection selon la somme des niveaux de rareté
  calculateAntenneScore(badges) {
    if (!badges || !Array.isArray(badges)) return 0;
    return badges.reduce((sum, b) => {
      const r = b.rarity || b.rarete || 'commun';
      const weight = this.rarityWeights[r] || 1;
      return sum + weight;
    }, 0);
  },

  // Synchronisation avec la base Supabase et la partie locale si existante
  async syncLeaderboardWithDatabase() {
    try {
      // 1. S'assurer de l'initialisation Supabase
      if (window.ProtecSupabase) {
        if (typeof window.ProtecSupabase.init === 'function' && !window.ProtecSupabase.client) {
          window.ProtecSupabase.init();
        }
        for (let i = 0; i < 25; i++) {
          if (window.ProtecSupabase.client) break;
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // Catalogues officiels & de secours
      const catalog = (window.ProtecEcussons?.catalog || window.ProtecEcussons?.FALLBACK_CATALOG || []);

      // Indexation unifiée par Joueur / Antenne
      const playerGroups = {}; // key = playerId

      const getOrInitGroup = (pid, plHint = null, stHint = null) => {
        if (!playerGroups[pid]) {
          playerGroups[pid] = {
            playerId: pid,
            player: plHint,
            station: stHint,
            badgesMap: new Map()
          };
        } else {
          if (!playerGroups[pid].player && plHint) playerGroups[pid].player = plHint;
          if (!playerGroups[pid].station && stHint) playerGroups[pid].station = stHint;
        }
        return playerGroups[pid];
      };

      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        const [
          { data: supaAntennes },
          { data: supaStations },
          { data: supaPlayers },
          { data: supaSaves }
        ] = await Promise.all([
          window.ProtecSupabase.client.from('antenne_ecussons').select('antenne_id, quantite, ecusson:ecussons(*)').catch(() => ({ data: [] })),
          window.ProtecSupabase.client.from('alliance_stations').select('id, player_id, player_name, station_name, city').catch(() => ({ data: [] })),
          window.ProtecSupabase.client.from('players').select('id, username, station_name, city, department_code').catch(() => ({ data: [] })),
          window.ProtecSupabase.client.from('game_saves').select('user_id, username, save_data').catch(() => ({ data: [] }))
        ]);

        const stationsMap = new Map();
        (supaStations || []).forEach(s => {
          if (s.id) stationsMap.set(s.id, s);
          if (s.player_id && !stationsMap.has(s.player_id)) stationsMap.set(s.player_id, s);
        });

        const playersMap = new Map();
        (supaPlayers || []).forEach(p => {
          if (p.id) playersMap.set(p.id, p);
          if (p.username) playersMap.set(p.username, p);
        });

        // A. Agréger les écussons depuis antenne_ecussons
        (supaAntennes || []).forEach(item => {
          const st = stationsMap.get(item.antenne_id);
          const pl = playersMap.get(item.antenne_id) || (st?.player_id ? playersMap.get(st.player_id) : null);
          const targetPid = pl?.id || st?.player_id || item.antenne_id;
          const group = getOrInitGroup(targetPid, pl, st);

          if (item.ecusson) {
            const code = item.ecusson.code;
            let name = item.ecusson.nom || 'Écusson';
            let imgUrl = item.ecusson.badge_url || item.ecusson.imageUrl;

            if (code === 'renf_fondateur' || (name && name.includes('Pionnier'))) {
              name = 'Membre Fondateur';
              imgUrl = 'images/badges/membre_fondateur.png';
            } else if (code === 'dept_54') {
              name = 'Protection Civile 54 • Meurthe-et-Moselle';
              imgUrl = 'images/badges/badge_meurthe_et_moselle_54.png';
            } else if (!imgUrl) {
              const fb = catalog.find(f => f.code === code || f.id === code);
              if (fb && (fb.imageUrl || fb.badge_url)) imgUrl = fb.imageUrl || fb.badge_url;
            }

            const qty = item.quantite || 1;
            const existing = group.badgesMap.get(code);
            if (existing) {
              existing.quantite = Math.max(existing.quantite || 1, qty);
            } else {
              group.badgesMap.set(code, {
                id: item.ecusson.id,
                code: code,
                name: name,
                cat: item.ecusson.categorie || 'specialite',
                rarity: item.ecusson.rarete || 'commun',
                icon: item.ecusson.icon || 'shield',
                imageUrl: imgUrl,
                desc: item.ecusson.description || '',
                quantite: qty
              });
            }
          }
        });

        // B. Agréger les écussons depuis game_saves (sauvegardes cloud directes)
        (supaSaves || []).forEach(s => {
          const pl = (s.user_id ? playersMap.get(s.user_id) : null) || (s.username ? playersMap.get(s.username) : null);
          const st = (s.user_id ? stationsMap.get(s.user_id) : null) || (pl?.id ? stationsMap.get(pl.id) : null);
          const targetPid = s.user_id || pl?.id || s.username;
          if (!targetPid) return;
          const group = getOrInitGroup(targetPid, pl, st);

          const locBadges = s.save_data?.localEcussons || s.save_data?.ecussons || [];
          locBadges.forEach(lb => {
            const code = lb.code || lb.id;
            if (!code) return;
            const catItem = catalog.find(c => c.code === code || c.id === code) || {};
            let name = catItem.nom || lb.name || 'Écusson';
            let imgUrl = catItem.imageUrl || catItem.badge_url || lb.imageUrl;

            if (code === 'renf_fondateur' || name.includes('Pionnier')) {
              name = 'Membre Fondateur';
              imgUrl = 'images/badges/membre_fondateur.png';
            } else if (code === 'dept_54') {
              name = 'Protection Civile 54 • Meurthe-et-Moselle';
              imgUrl = 'images/badges/badge_meurthe_et_moselle_54.png';
            }

            const qty = lb.quantite || 1;
            const existing = group.badgesMap.get(code);
            if (existing) {
              existing.quantite = Math.max(existing.quantite || 1, qty);
            } else {
              group.badgesMap.set(code, {
                id: lb.id || code,
                code: code,
                name: name,
                cat: catItem.categorie || lb.cat || 'specialite',
                rarity: catItem.rarete || lb.rarity || 'commun',
                icon: catItem.icon || lb.icon || 'shield',
                imageUrl: imgUrl,
                desc: catItem.description || lb.desc || '',
                quantite: qty
              });
            }
          });
        });

        // C. Convertir en showcases pour l'affichage
        const dynamicList = [];
        for (const [pid, grp] of Object.entries(playerGroups)) {
          const badges = Array.from(grp.badgesMap.values());
          if (badges.length === 0) continue;

          const pl = grp.player || playersMap.get(pid);
          const st = grp.station || stationsMap.get(pid);

          let stationName = st?.station_name || pl?.station_name;
          if (!stationName || stationName === 'Antenne Locale' || stationName === 'Mon Antenne' || stationName.startsWith('station-')) {
            const city = pl?.city || st?.city;
            const dept = pl?.department_code;
            if (city) stationName = `Antenne de ${city}`;
            else if (dept) stationName = `Antenne Protection Civile (${dept})`;
            else stationName = 'Antenne Protection Civile';
          } else if (!stationName.toLowerCase().includes('antenne') && !stationName.toLowerCase().includes('protection civile')) {
            stationName = `Antenne de ${stationName}`;
          }

          const directorName = pl?.username || st?.player_name || 'Responsable d’antenne';
          const city = pl?.city || st?.city || '';
          const dept = pl?.department_code || '';
          let deptLabel = 'Réseau National';
          if (city && dept) deptLabel = `${city} (${dept})`;
          else if (city) deptLabel = city;
          else if (dept) deptLabel = `Département ${dept}`;

          dynamicList.push({
            id: `supa-${pid}`,
            antenneId: pid,
            name: stationName,
            director: directorName,
            department: deptLabel,
            badges: badges
          });
        }

        if (dynamicList.length > 0) {
          this.antennesShowcases = dynamicList;
        }
      }

      // Fallback local si aucune antenne distante trouvée
      if (this.antennesShowcases.length === 0) {
        const localRaw = localStorage.getItem('protec_save') || localStorage.getItem('myprotec_save') || localStorage.getItem('protec_save_game');
        if (localRaw) {
          const lSave = JSON.parse(localRaw);
          const lEcussons = lSave.localEcussons || lSave.ecussons || [];
          if (lEcussons.length > 0) {
            const stationName = lSave.stations?.[0]?.name || lSave.player?.stationName || 'Mon Antenne';
            const dept = lSave.stations?.[0]?.departmentCode || lSave.player?.departmentCode || '54';
            const city = lSave.stations?.[0]?.city || lSave.player?.city || 'Nancy';
            const playerName = lSave.player?.name || 'Joueur';

            const badges = lEcussons.map(le => {
              const catItem = catalog.find(c => c.code === (le.code || le.id) || c.id === (le.id || le.code)) || {};
              let code = le.code || catItem.code;
              let name = catItem.nom || le.name || 'Écusson';
              let imgUrl = catItem.imageUrl || le.imageUrl;
              if (code === 'renf_fondateur' || name.includes('Pionnier')) {
                name = 'Membre Fondateur';
                imgUrl = 'images/badges/membre_fondateur.png';
              } else if (code === 'dept_54') {
                name = 'Protection Civile 54 • Meurthe-et-Moselle';
                imgUrl = 'images/badges/badge_meurthe_et_moselle_54.png';
              }
              return {
                id: le.id || le.code,
                code: code,
                name: name,
                cat: catItem.categorie || le.cat || 'specialite',
                rarity: catItem.rarete || le.rarity || 'commun',
                icon: catItem.icon || le.icon || 'shield',
                imageUrl: imgUrl,
                desc: catItem.description || ''
              };
            });

            this.antennesShowcases = [{
              id: 'player-station',
              name: stationName,
              director: playerName,
              department: `${city} (${dept})`,
              badges: badges
            }];
          }
        }
      }
    } catch (e) {
      console.warn('Erreur synchronisation classement écussons:', e);
    }
  },

  // 4. RÉSOLUTION D'IMAGES & SÉLECTION DES ÉCUSSONS VITRINES (ACCUEIL)
  getBadgeImage(badge) {
    if (!badge) return null;
    let img = badge.imageUrl || (badge.badge_url && (badge.badge_url.includes('/') || badge.badge_url.includes('.')) ? badge.badge_url : null);
    const code = badge.code || badge.id || '';
    const name = badge.name || badge.nom || '';

    if (code === 'renf_fondateur' || name.includes('Fondateur') || name.includes('Pionnier')) {
      return 'images/badges/membre_fondateur.png';
    }
    if (code === 'dept_54' || code === 'ec-dept-54') {
      return 'images/badges/badge_meurthe_et_moselle_54.png';
    }
    if (code === 'badge_admin' || code === 'ec-admin') {
      return 'images/badge_admin.png';
    }
    if (typeof code === 'string' && code.startsWith('badge_def_')) {
      return `images/${code}.png`;
    }
    if (img && (img.startsWith('images/') || img.startsWith('http') || img.startsWith('data:'))) {
      return img;
    }
    return 'images/badges/ecusson_inconnu.png';
  },

  // Rendu visuel d'un écusson avec effet holographique foil STRICTEMENT CONFINÉ au visuel de l'écusson
  // et calque de masque officiel pour l'écusson Membre Fondateur
  renderBadgeVisual(badge, sizeClass = 'w-14 h-16') {
    const imgSrc = this.getBadgeImage(badge);
    const code = badge.code || badge.id || '';
    const name = badge.name || badge.nom || '';
    const r = badge.rarity || badge.rarete || 'commun';
    const isFondateur = code === 'renf_fondateur' || name.includes('Fondateur') || name.includes('Pionnier');

    // 1. Écusson d'Honneur Suprême : Membre Fondateur avec masque et texture spéculaire officielle
    if (isFondateur) {
      return `
        <div class="ecusson-fondateur-wrapper select-none ${sizeClass} filter drop-shadow-md transition-transform" title="${name}">
          <img src="images/badges/membre_fondateur.png" alt="${name}" class="w-full h-full object-contain pointer-events-none relative z-0" onerror="this.onerror=null; this.parentElement.innerHTML='👑';" />
          <div class="ecusson-fondateur-mask">
            <div class="ecusson-fondateur-ambient"></div>
            <div class="ecusson-fondateur-shimmer"></div>
          </div>
        </div>
      `;
    }

    const hasFoil = (r === 'historique' || r === 'epique' || r === 'rare');
    const foilClass = r === 'historique' ? 'foil-historique' : (r === 'epique' ? 'foil-epique' : 'foil-rare');

    // 2. Écusson avec image PNG réelle : cadre isolé recevant l'effet foil sans toucher la carte
    if (imgSrc) {
      return `
        <div class="ecusson-visual-frame ${sizeClass} filter drop-shadow-md transition-transform">
          <img src="${imgSrc}" alt="${name}" class="w-full h-full object-contain pointer-events-none relative z-0" onerror="this.onerror=null; this.src='images/badges/ecusson_inconnu.png';" />
          <div class="hidden w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 items-center justify-center shadow-2xs">
            <i data-lucide="shield" class="w-5 h-5"></i>
          </div>
          ${hasFoil ? `<div class="foil-shiny-layer ${foilClass}"></div>` : ''}
        </div>
      `;
    }

    // 3. Écusson vectoriel avec icône
    return `
      <div class="ecusson-visual-frame w-11 h-11 rounded-xl ${
        r === 'historique' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
        (r === 'epique' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
        (r === 'rare' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-slate-100 text-slate-600 border border-slate-200'))
      } shadow-2xs transition-transform">
        <i data-lucide="${(badge.icon && !badge.icon.includes('/') && !badge.icon.includes('.')) ? badge.icon : 'shield'}" class="w-5 h-5 relative z-0"></i>
        ${hasFoil ? `<div class="foil-shiny-layer ${foilClass}"></div>` : ''}
      </div>
    `;
  },

  // Clé de persistance pour les écussons choisis par le joueur pour la vitrine d'accueil
  getFeaturedStorageKey(antenneId) {
    return `protec_showcase_badges_${antenneId || 'default'}`;
  },

  getFeaturedBadgeCodes(antenneId, allBadges = []) {
    let saved = [];
    try {
      const raw = localStorage.getItem(this.getFeaturedStorageKey(antenneId));
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      saved = [];
    }

    if (Array.isArray(saved) && saved.length > 0) {
      const validCodes = saved.filter(code => allBadges.some(b => (b.code || b.id) === code));
      if (validCodes.length > 0) return validCodes.slice(0, 4);
    }

    // Par défaut : trier par rareté décroissante (historique > épique > rare > commun) et retenir jusqu'à 4
    const sorted = [...allBadges].sort((a, b) => {
      const wA = this.rarityWeights[a.rarity || a.rarete] || 1;
      const wB = this.rarityWeights[b.rarity || b.rarete] || 1;
      return wB - wA;
    });

    return sorted.slice(0, 4).map(b => b.code || b.id);
  },

  toggleFeaturedBadge(antenneId, badgeCode) {
    const antenne = this.antennesShowcases.find(a => a.id === antenneId);
    if (!antenne) return;

    const currentCodes = this.getFeaturedBadgeCodes(antenneId, antenne.badges);
    let updated = [];

    if (currentCodes.includes(badgeCode)) {
      if (currentCodes.length <= 1) {
        if (window.ProtecDialogs && typeof window.ProtecDialogs.toast === 'function') {
          window.ProtecDialogs.toast('Vous devez conserver au moins 1 écusson en vitrine.', 'info');
        } else {
          alert('Vous devez conserver au moins 1 écusson en vitrine.');
        }
        return;
      }
      updated = currentCodes.filter(c => c !== badgeCode);
    } else {
      if (currentCodes.length >= 4) {
        if (window.ProtecDialogs && typeof window.ProtecDialogs.toast === 'function') {
          window.ProtecDialogs.toast('Vous pouvez sélectionner au maximum 4 écussons en vitrine d\'accueil.', 'warning');
        } else {
          alert('Vous pouvez sélectionner au maximum 4 écussons en vitrine d\'accueil.');
        }
        return;
      }
      updated = [...currentCodes, badgeCode];
    }

    try {
      localStorage.setItem(this.getFeaturedStorageKey(antenneId), JSON.stringify(updated));
    } catch (e) {}

    // Rafraîchir la vitrine sur la page d'accueil et la modale si ouverte
    this.renderShowcaseGrid(this.activeFilter);
    this.renderModalCollectionItems(antenneId);
  },

  // 5. VITRINE DES ÉCUSSONS : CLASSEMENT STRICT PAR SOMME DES NIVEAUX DE RARETÉ
  searchQuery: '',
  filterShowcaseSearch(query) {
    this.searchQuery = (query || '').trim().toLowerCase();
    this.renderShowcaseGrid(this.activeFilter, null, this.searchQuery);
  },

  renderShowcaseGrid(filter = 'all', limit = null, search = null) {
    this.activeFilter = filter;
    if (search !== null) this.searchQuery = (search || '').trim().toLowerCase();
    const container = document.getElementById('lp-showcase-grid');
    if (!container) return;

    // Détermination de la limite (sur accueil data-limit="3", sur page dédiée pas de limite)
    if (limit === null) {
      const dataLim = container.getAttribute('data-limit');
      if (dataLim !== null) {
        limit = parseInt(dataLim, 10);
      } else {
        limit = window.location.pathname.includes('ecussons') ? 0 : 3;
      }
    }

    // 1. Calculer pour chaque antenne la somme exacte des niveaux de rareté
    const rankedAntennes = this.antennesShowcases.map(antenne => {
      const score = this.calculateAntenneScore(antenne.badges);
      return {
        ...antenne,
        rarityScore: score
      };
    });

    // 2. Classer les joueurs / antennes par ordre strictement décroissant du score de rareté
    rankedAntennes.sort((a, b) => b.rarityScore - a.rarityScore);

    // 3. Assigner les rangs officiels
    rankedAntennes.forEach((antenne, idx) => {
      antenne.rank = idx + 1;
    });

    // Filtrage par recherche éventuelle
    let listToRender = rankedAntennes;
    if (this.searchQuery) {
      const sq = this.searchQuery;
      listToRender = listToRender.filter(a => {
        const matchName = (a.name || '').toLowerCase().includes(sq);
        const matchDir = (a.director || '').toLowerCase().includes(sq);
        const matchDept = (a.department || '').toLowerCase().includes(sq);
        const matchBadge = (a.badges || []).some(b => (b.name || '').toLowerCase().includes(sq) || (b.code || '').toLowerCase().includes(sq));
        return matchName || matchDir || matchDept || matchBadge;
      });
    }

    // Application de la limite (ex: Top 3 sur la page d'accueil)
    if (limit > 0) {
      listToRender = listToRender.slice(0, limit);
    }

    if (listToRender.length === 0) {
      const isSearchOrFilter = this.searchQuery || filter !== 'all';
      container.innerHTML = `
        <div class="col-span-full py-12 px-6 text-center text-slate-400 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
          <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
            <i data-lucide="${isSearchOrFilter ? 'search-x' : 'shield-alert'}" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="text-sm font-black text-slate-700 dark:text-slate-200">
              ${isSearchOrFilter ? 'Aucune collection ne correspond à votre recherche' : 'Aucune antenne enregistrée actuellement'}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              ${isSearchOrFilter 
                ? 'Modifiez vos termes de recherche ou sélectionnez une autre catégorie.' 
                : 'Fondez votre antenne locale et accomplissez vos premières missions pour afficher vos écussons officiels sur la vitrine nationale.'
              }
            </p>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // 4. Rendu des cartes de vitrine classées avec sélection d'écussons et clic complet
    const htmlCards = listToRender.map(antenne => {
      // Déterminer les écussons à afficher sur la carte de vitrine (max 4 pour préserver la mise en page)
      const featuredCodes = this.getFeaturedBadgeCodes(antenne.id, antenne.badges);
      
      let displayBadges = [];
      if (filter === 'all') {
        // En mode 'all' : afficher les écussons choisis par le joueur (ou les 4 plus rares)
        displayBadges = antenne.badges.filter(b => featuredCodes.includes(b.code || b.id));
        if (displayBadges.length === 0) displayBadges = antenne.badges.slice(0, 4);
      } else {
        // En mode filtré par catégorie : afficher les écussons correspondants (max 4)
        const catBadges = antenne.badges.filter(b => b.cat === filter);
        const featInCat = catBadges.filter(b => featuredCodes.includes(b.code || b.id));
        displayBadges = featInCat.length > 0 ? featInCat : catBadges.slice(0, 4);
      }

      // Comptage précis par palier de rareté
      const histoCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'historique').length;
      const epiCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'epique').length;
      const rareCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'rare').length;
      const comCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'commun').length;

      // Badge de classement
      let rankBadgeHTML = '';
      if (antenne.rank === 1) {
        rankBadgeHTML = `
          <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-sm">
            🥇 1er National
          </span>
        `;
      } else if (antenne.rank === 2) {
        rankBadgeHTML = `
          <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-200 text-slate-800 flex items-center gap-1.5 shadow-2xs">
            🥈 2ème
          </span>
        `;
      } else if (antenne.rank === 3) {
        rankBadgeHTML = `
          <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-700/15 text-amber-900 border border-amber-600/30 flex items-center gap-1.5">
            🥉 3ème
          </span>
        `;
      } else {
        rankBadgeHTML = `
          <span class="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200/80">
            Rang #${antenne.rank}
          </span>
        `;
      }

      return `
        <div 
          class="showcase-grid-card group cursor-pointer" 
          onclick="window.MyProtecLanding.openAntenneCollectionModal('${antenne.id}')"
          title="Cliquer pour afficher la collection complète de ${antenne.name}"
        >
          <div class="showcase-inner-card p-6 flex flex-col justify-between h-full bg-white/90 group-hover:bg-white rounded-3xl border border-slate-200/80 group-hover:border-blue-300 shadow-md group-hover:shadow-xl transition-all duration-300">
            
            <!-- En-tête : Rang officiel & Collection -->
            <div class="space-y-3 pb-4 border-b border-slate-200/70">
              <div class="flex items-center justify-between">
                ${rankBadgeHTML}
                <div class="text-right">
                  <div class="text-xs font-black text-slate-700 flex items-center justify-end gap-1">
                    <span class="text-sm font-black text-slate-900 mono-num">${antenne.badges.length}</span>
                    <span>écusson${antenne.badges.length > 1 ? 's' : ''}</span>
                  </div>
                  <span class="block text-[9px] font-bold text-blue-600 group-hover:underline uppercase tracking-wider">Cliquer pour explorer</span>
                </div>
              </div>

              <div>
                <h4 class="text-base font-black text-slate-900 tracking-tight leading-snug group-hover:text-blue-700 transition-colors">
                  ${antenne.name}
                </h4>
                <div class="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span>${antenne.director || 'Direction d’Antenne'}</span>
                  <span>•</span>
                  <span>${antenne.department}</span>
                </div>
              </div>
            </div>

            <!-- Grille des écussons en vitrine de l'antenne (2 à 4 sélectionnés) -->
            <div class="grid grid-cols-2 gap-3 my-5">
              ${displayBadges.length > 0 ? displayBadges.map(badge => {
                const r = badge.rarity || badge.rarete || 'commun';
                return `
                  <div 
                    class="patch-badge-item group/patch relative p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col items-center text-center overflow-hidden transition hover:shadow-md hover:border-blue-300"
                    onmouseenter="window.MyProtecLanding.showBadgeTooltip(event, '${badge.name}', '${badge.desc || ''}', '${r.toUpperCase()}')"
                    onmouseleave="window.MyProtecLanding.hideBadgeTooltip()"
                  >
                    <!-- Visuel Écusson : Image PNG Réelle / Shimmer Fondateur / Foil Isolé -->
                    ${this.renderBadgeVisual(badge, 'w-14 h-16 mb-2')}

                    <strong class="text-[11px] font-black text-slate-800 dark:text-slate-100 leading-tight block truncate max-w-full">
                      ${badge.name}
                    </strong>
                    
                    <span class="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide mt-1.5 ${
                      r === 'historique' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300' :
                      (r === 'epique' ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300' :
                      (r === 'rare' ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'))
                    }">
                      ${r}
                    </span>
                  </div>
                `;
              }).join('') : `
                <div class="col-span-2 py-8 text-center text-xs text-slate-400 font-medium">
                  Aucun écusson sélectionné dans cette catégorie.
                </div>
              `}
            </div>

            <!-- Pied de carte : Appel à l'action d'ouverture de la collection complète -->
            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5 font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                <i data-lucide="layers" class="w-4 h-4 text-blue-500"></i>
                <span>Toute la collection (${antenne.badges.length})</span>
                ${antenne.badges.length > displayBadges.length ? `
                  <span class="ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                    +${antenne.badges.length - displayBadges.length}
                  </span>
                ` : ''}
              </div>
              <div class="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-blue-600 text-slate-500 group-hover:text-white flex items-center justify-center transition shadow-2xs group-hover:translate-x-0.5">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </div>
            </div>

          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = htmlCards;

    // Actualiser le style des boutons de filtre
    const buttons = document.querySelectorAll('.lp-filter-btn');
    buttons.forEach(btn => {
      const f = btn.getAttribute('data-filter');
      if (f === filter) {
        btn.className = 'lp-filter-btn px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer bg-slate-900 text-white shadow-sm flex items-center gap-1.5';
      } else {
        btn.className = 'lp-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer bg-white/80 text-slate-600 hover:bg-white border border-slate-200 flex items-center gap-1.5';
      }
    });

    if (window.lucide) window.lucide.createIcons();
    this.init3DTilt();
  },

  // 6. MODALE DÉTAILLÉE DE TOUTE LA COLLECTION D'ÉCUSSONS (100+ ÉCUSSONS)
  currentModalAntenneId: null,
  modalFilterCat: 'all',
  modalFilterRarity: 'all',
  modalSearchQuery: '',

  openAntenneCollectionModal(antenneId) {
    const antenne = this.antennesShowcases.find(a => a.id === antenneId);
    if (!antenne) return;

    this.currentModalAntenneId = antenneId;
    this.modalFilterCat = 'all';
    this.modalFilterRarity = 'all';
    this.modalSearchQuery = '';

    let modal = document.getElementById('lp-antenne-collection-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lp-antenne-collection-modal';
      document.body.appendChild(modal);
    }

    this.renderCollectionModalContent(antenne);
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    if (window.lucide) window.lucide.createIcons();
  },

  closeAntenneCollectionModal() {
    const modal = document.getElementById('lp-antenne-collection-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    document.body.classList.remove('overflow-hidden');
    this.currentModalAntenneId = null;
  },

  setModalCategoryFilter(cat) {
    this.modalFilterCat = cat;
    if (this.currentModalAntenneId) {
      this.renderModalCollectionItems(this.currentModalAntenneId);
    }
  },

  setModalRarityFilter(rarity) {
    this.modalFilterRarity = rarity;
    if (this.currentModalAntenneId) {
      this.renderModalCollectionItems(this.currentModalAntenneId);
    }
  },

  filterModalSearch(query) {
    this.modalSearchQuery = (query || '').trim().toLowerCase();
    if (this.currentModalAntenneId) {
      this.renderModalCollectionItems(this.currentModalAntenneId);
    }
  },

  renderCollectionModalContent(antenne) {
    const modal = document.getElementById('lp-antenne-collection-modal');
    if (!modal) return;

    const histoCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'historique').length;
    const epiCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'epique').length;
    const rareCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'rare').length;
    const comCount = antenne.badges.filter(b => (b.rarity || b.rarete) === 'commun').length;
    const score = this.calculateAntenneScore(antenne.badges);

    modal.innerHTML = `
      <div 
        class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onclick="window.MyProtecLanding.closeAntenneCollectionModal()"
      ></div>

      <div class="relative bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col z-10 overflow-hidden animate-fade-in mx-4">
        
        <!-- EN-TÊTE DE LA MODALE -->
        <div class="p-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80 flex items-start justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                Rang National #${antenne.rank || 1}
              </span>
              <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Score de Rareté : <strong>${score} pts</strong>
              </span>
              <span class="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                ${antenne.badges.length} écussons possédés
              </span>
            </div>
            
            <h3 class="text-xl font-black text-slate-900 tracking-tight">
              Collection • ${antenne.name}
            </h3>
            <p class="text-xs text-slate-500 font-medium">
              ${antenne.director || 'Direction d’Antenne'} • ${antenne.department}
            </p>
          </div>

          <button 
            onclick="window.MyProtecLanding.closeAntenneCollectionModal()" 
            class="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer flex-shrink-0"
            title="Fermer (Échap)"
          >
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- BANDEAU D'AIDE & EXPLICATION VITRINE (CHOISIR JUSQU'À 4 ÉCUSSONS) -->
        <div class="px-6 py-3 bg-amber-50/80 border-b border-amber-200/70 flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 text-amber-900 font-bold">
            <i data-lucide="sparkles" class="w-4 h-4 text-amber-600 flex-shrink-0"></i>
            <span>
              <strong>Vitrine d'accueil :</strong> Cliquez sur <strong>⭐ En vitrine</strong> pour choisir les 4 écussons affichés sur la carte de la page d'accueil.
            </span>
          </div>
          <span id="lp-modal-featured-count" class="px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-950 font-black text-[11px] whitespace-nowrap">
            0/4 en vitrine
          </span>
        </div>

        <!-- BARRE DE RECHERCHE ET FILTRES DANS LA MODALE -->
        <div class="px-6 py-3.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <!-- Recherche rapide -->
          <div class="relative flex-1 min-w-[220px]">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input 
              type="text" 
              placeholder="Rechercher un écusson parmi les ${antenne.badges.length}..." 
              value="${this.modalSearchQuery}"
              oninput="window.MyProtecLanding.filterModalSearch(this.value)"
              class="w-full pl-9 pr-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          <!-- Filtres de catégorie -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <button onclick="window.MyProtecLanding.setModalCategoryFilter('all')" class="lp-modal-cat-btn px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${this.modalFilterCat === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Tous
            </button>
            <button onclick="window.MyProtecLanding.setModalCategoryFilter('mission')" class="lp-modal-cat-btn px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${this.modalFilterCat === 'mission' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Missions
            </button>
            <button onclick="window.MyProtecLanding.setModalCategoryFilter('specialite')" class="lp-modal-cat-btn px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${this.modalFilterCat === 'specialite' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Spécialités
            </button>
            <button onclick="window.MyProtecLanding.setModalCategoryFilter('renfort')" class="lp-modal-cat-btn px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${this.modalFilterCat === 'renfort' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Renforts
            </button>
            <button onclick="window.MyProtecLanding.setModalCategoryFilter('departement')" class="lp-modal-cat-btn px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${this.modalFilterCat === 'departement' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Départements
            </button>
          </div>
        </div>

        <!-- CORPS SCROLLABLE : GRILLE DES ÉCUSSONS (OPTIMISÉ POUR 100+ ÉCUSSONS) -->
        <div id="lp-modal-badges-grid" class="flex-1 p-6 overflow-y-auto space-y-4">
          <!-- Injecté dynamiquement par renderModalCollectionItems -->
        </div>

        <!-- PIED DE MODALE -->
        <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-500">
          <div id="lp-modal-summary-text">
            Affichage de ${antenne.badges.length} écussons
          </div>
          <button 
            onclick="window.MyProtecLanding.closeAntenneCollectionModal()" 
            class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition cursor-pointer shadow-sm"
          >
            Terminer
          </button>
        </div>

      </div>
    `;

    this.renderModalCollectionItems(antenne.id);
  },

  renderModalCollectionItems(antenneId) {
    const antenne = this.antennesShowcases.find(a => a.id === antenneId);
    const container = document.getElementById('lp-modal-badges-grid');
    if (!antenne || !container) return;

    const featuredCodes = this.getFeaturedBadgeCodes(antenneId, antenne.badges);

    // Mettre à jour le compteur dans le bandeau
    const featCountEl = document.getElementById('lp-modal-featured-count');
    if (featCountEl) {
      featCountEl.textContent = `${featuredCodes.length}/4 en vitrine`;
    }

    // Actualiser le style des boutons de catégorie de la modale
    const catButtons = document.querySelectorAll('.lp-modal-cat-btn');
    catButtons.forEach(btn => {
      const isCurrent = (btn.textContent.trim().toLowerCase() === 'tous' && this.modalFilterCat === 'all') ||
                        (btn.textContent.trim().toLowerCase() === 'missions' && this.modalFilterCat === 'mission') ||
                        (btn.textContent.trim().toLowerCase() === 'spécialités' && this.modalFilterCat === 'specialite') ||
                        (btn.textContent.trim().toLowerCase() === 'renforts' && this.modalFilterCat === 'renfort') ||
                        (btn.textContent.trim().toLowerCase() === 'départements' && this.modalFilterCat === 'departement');
      if (isCurrent) {
        btn.className = 'lp-modal-cat-btn px-2.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer bg-slate-900 text-white';
      } else {
        btn.className = 'lp-modal-cat-btn px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    });

    // Filtrer les badges selon catégorie et recherche
    let badgesToDisplay = antenne.badges.filter(b => {
      const matchCat = this.modalFilterCat === 'all' || b.cat === this.modalFilterCat;
      const matchRarity = this.modalFilterRarity === 'all' || (b.rarity || b.rarete) === this.modalFilterRarity;
      let matchQuery = true;
      if (this.modalSearchQuery) {
        const sq = this.modalSearchQuery;
        matchQuery = (b.name || '').toLowerCase().includes(sq) ||
                     (b.code || '').toLowerCase().includes(sq) ||
                     (b.desc || '').toLowerCase().includes(sq);
      }
      return matchCat && matchRarity && matchQuery;
    });

    // Trier les badges : D'abord ceux en vitrine, puis par niveau de rareté décroissant
    badgesToDisplay.sort((a, b) => {
      const aCode = a.code || a.id;
      const bCode = b.code || b.id;
      const aFeat = featuredCodes.includes(aCode);
      const bFeat = featuredCodes.includes(bCode);
      if (aFeat && !bFeat) return -1;
      if (!aFeat && bFeat) return 1;

      const wA = this.rarityWeights[a.rarity || a.rarete] || 1;
      const wB = this.rarityWeights[b.rarity || b.rarete] || 1;
      return wB - wA;
    });

    // Résumé dans le footer
    const summaryEl = document.getElementById('lp-modal-summary-text');
    if (summaryEl) {
      summaryEl.textContent = `Affichage de ${badgesToDisplay.length} sur ${antenne.badges.length} écussons (${featuredCodes.length} affichés sur la page d'accueil)`;
    }

    if (badgesToDisplay.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-400 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <i data-lucide="search-x" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
          <p class="text-sm font-black text-slate-600">Aucun écusson ne correspond à votre filtre</p>
          <p class="text-xs text-slate-400 mt-1">Essayez un autre mot-clé ou sélectionnez une autre catégorie.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        ${badgesToDisplay.map(badge => {
          const r = badge.rarity || badge.rarete || 'commun';
          const code = badge.code || badge.id;
          const isFeatured = featuredCodes.includes(code);
          const imgSrc = this.getBadgeImage(badge);

          return `
            <div class="group/item relative p-4 rounded-2xl bg-white border ${isFeatured ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md' : 'border-slate-200/90 shadow-2xs'} flex flex-col justify-between transition hover:shadow-lg overflow-hidden">
              <div>
                <!-- Bouton toggle en vitrine (Étoile) -->
                <div class="flex items-center justify-between mb-2">
                  <span class="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide ${
                    r === 'historique' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300' :
                    (r === 'epique' ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-300' :
                    (r === 'rare' ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'))
                  }">
                    ${r}
                  </span>

                  <button 
                    onclick="window.MyProtecLanding.toggleFeaturedBadge('${antenneId}', '${code}')"
                    class="px-2 py-0.5 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                      isFeatured 
                        ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-2xs' 
                        : 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900'
                    }"
                    title="${isFeatured ? 'Retirer de la vitrine d\'accueil' : 'Afficher sur la vitrine d\'accueil (max 4)'}"
                  >
                    <span>${isFeatured ? '★ Vitrine' : '☆ Choisir'}</span>
                  </button>
                </div>

                <!-- Visuel écusson isolé recevant les textures et reflets -->
                <div class="w-full flex items-center justify-center my-1">
                  ${this.renderBadgeVisual(badge, 'w-16 h-20')}
                </div>

                <h5 class="text-xs font-black text-slate-900 mt-2 leading-snug line-clamp-2">
                  ${badge.name}
                </h5>

                <p class="text-[10px] text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                  ${badge.desc || 'Distinction officielle de la Protection Civile.'}
                </p>
              </div>

              <div class="pt-2 mt-3 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>${badge.cat || 'Écusson'}</span>
                <span>${this.rarityWeights[r] || 1} pt${(this.rarityWeights[r] || 1) > 1 ? 's' : ''}</span>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // 5. EFFET 3D TILT DYNAMIQUE À LA SOURIS
  init3DTilt() {
    const cards = document.querySelectorAll('[data-tilt]');
    if (!cards || cards.length === 0) return;

    cards.forEach(card => {
      const inner = card.querySelector('.showcase-inner-card');
      if (!inner) return;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg
        const rotateY = ((x - centerX) / centerX) * 9;

        inner.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;
      });

      card.addEventListener('mouseleave', () => {
        inner.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });
  },

  // 6. GESTION DE L'INFOBULLE FLOTTANTE D'ÉCUSSON
  initTooltip() {
    if (document.getElementById('lp-ecusson-tooltip')) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'lp-ecusson-tooltip';
    document.body.appendChild(tooltip);
  },

  showBadgeTooltip(e, name, desc, copies) {
    const tooltip = document.getElementById('lp-ecusson-tooltip');
    if (!tooltip) return;

    tooltip.innerHTML = `
      <div class="space-y-1.5 text-xs">
        <div class="flex items-center justify-between pb-1 border-b border-slate-700">
          <strong class="font-black text-white text-xs">${name}</strong>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">Insigne Officiel</span>
        </div>
        <p class="text-[11px] text-slate-300 leading-relaxed font-normal">${desc}</p>
        <div class="text-[10px] text-amber-400 font-bold pt-1 flex items-center gap-1">
          <span>Rarete en jeu :</span>
          <span class="text-slate-300 font-medium">${copies}</span>
        </div>
      </div>
    `;

    const x = Math.min(window.innerWidth - 340, Math.max(10, e.clientX + 16));
    const y = Math.min(window.innerHeight - 150, Math.max(10, e.clientY - 20));

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.classList.add('is-visible');
  },

  hideBadgeTooltip() {
    const tooltip = document.getElementById('lp-ecusson-tooltip');
    if (tooltip) {
      tooltip.classList.remove('is-visible');
    }
  }
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  window.MyProtecLanding.init();
});
