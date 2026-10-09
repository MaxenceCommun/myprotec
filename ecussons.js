/**
 * MYPROTEC - Module de Collection et Troc d'Écussons
 * Système officiel de gestion des patchs de la Protection Civile,
 * tableau en liège interactif et bourse d'échanges inter-antennes en ligne.
 */

window.ProtecEcussons = {
  catalog: [],
  playerEcussons: [], // [{ ecusson_id, quantite, ecusson: {...} }]
  activeOffers: [],
  myOffers: [],
  activeCategoryFilter: 'all',
  currentTab: 'tableau', // 'tableau' ou 'bourse'
  isInitialized: false,

  // --- CATALOGUE LOCAL DE SECOURS (IDEMPOTENT AVEC SUPABASE_SETUP.SQL) ---
  FALLBACK_CATALOG: [
    { id: 'ec-spec-pse', code: 'spec_pse', nom: 'Équipier Secouriste Opérationnel', description: 'Délivré aux antennes maintenant un équipage PSE complet prêt à intervenir.', categorie: 'specialite', rarete: 'commun', icon: 'shield', color: '#1d4ed8' },
    { id: 'ec-spec-aqua', code: 'spec_aqua', nom: 'Sauvetage Aquatique & Inondations', description: 'Reconnaissance des unités de sauvetage côtier, fleuves et crues.', categorie: 'specialite', rarete: 'rare', icon: 'waves', color: '#0284c7' },
    { id: 'ec-spec-cyno', code: 'spec_cyno', nom: 'Unité Cynotechnique de Recherche', description: 'Dédié aux équipes cynotechniques de recherche de personnes disparues.', categorie: 'specialite', rarete: 'rare', icon: 'paw-print', color: '#b45309' },
    { id: 'ec-spec-pma', code: 'spec_pma', nom: 'Poste Médical Avancé (PMA)', description: 'Capacité de déploiement d’une chaîne médicale complète de tri et d’urgence.', categorie: 'specialite', rarete: 'epique', icon: 'cross', color: '#7e22ce' },
    { id: 'ec-spec-formateur', code: 'spec_formateur', nom: 'Corps National des Formateurs', description: 'Distinction des antennes disposant de formateurs certifiés (PICF / PAE).', categorie: 'specialite', rarete: 'rare', icon: 'graduation-cap', color: '#059669' },
    { id: 'ec-spec-aep', code: 'spec_aep', nom: 'Soutien Psychologique (AEP)', description: 'Équipes formées à la prise en charge d’urgence des chocs émotionnels.', categorie: 'specialite', rarete: 'rare', icon: 'heart-pulse', color: '#e11d48' },

    { id: 'ec-miss-froid', code: 'miss_grand_froid', nom: 'Plan Grand Froid & Maraudes', description: 'Mobilisation solidaire de nuit auprès des personnes vulnérables en période hivernale.', categorie: 'mission', rarete: 'rare', icon: 'snowflake', color: '#0ea5e9' },
    { id: 'ec-miss-14juillet', code: 'miss_14_juillet', nom: 'Dispositif Fête Nationale 14 Juillet', description: 'Sécurisation des festivités républicaines, bals et feux d’artifice.', categorie: 'mission', rarete: 'epique', icon: 'sparkles', color: '#6366f1' },
    { id: 'ec-miss-marathon', code: 'miss_marathon', nom: 'Sécurisation Grands Événements Sportifs', description: 'Couverture médicale complète de marathons et trails de grande affluence.', categorie: 'mission', rarete: 'commun', icon: 'trophy', color: '#ea580c' },
    { id: 'ec-miss-festival', code: 'miss_festival', nom: 'Sécurité Festivals & Musique', description: 'Encadrement préventif et secours d’urgence sur événements musicaux.', categorie: 'mission', rarete: 'rare', icon: 'music', color: '#9333ea' },
    { id: 'ec-miss-sncf', code: 'miss_sncf', nom: 'Convention Catastrophe Ferroviaire SNCF', description: 'Agrément et réactivité sur accidents et blocages majeurs du réseau ferré.', categorie: 'mission', rarete: 'historique', icon: 'train', color: '#d97706' },

    { id: 'ec-dept-54', code: 'dept_54', nom: 'Protection Civile 54 • Meurthe-et-Moselle', description: 'Écusson territorial des secouristes lorrains du 54.', categorie: 'departement', rarete: 'commun', icon: 'map-pin', color: '#2563eb' },
    { id: 'ec-dept-75', code: 'dept_75', nom: 'Protection Civile de Paris (75)', description: 'Écusson historique de la capitale et des brigades d’intervention parisiennes.', categorie: 'departement', rarete: 'rare', icon: 'landmark', color: '#1e40af' },
    { id: 'ec-dept-69', code: 'dept_69', nom: 'Protection Civile du Rhône (69)', description: 'Insigne officiel des unités de secours de la métropole lyonnaise.', categorie: 'departement', rarete: 'commun', icon: 'map-pin', color: '#2563eb' },
    { id: 'ec-dept-13', code: 'dept_13', nom: 'Protection Civile des Bouches-du-Rhône (13)', description: 'Écusson des secouristes méditerranéens et veille feux de forêt.', categorie: 'departement', rarete: 'rare', icon: 'flame', color: '#dc2626' },
    { id: 'ec-dept-33', code: 'dept_33', nom: 'Protection Civile de Gironde (33)', description: 'Distinction territoriale des secouristes du littoral aquitain.', categorie: 'departement', rarete: 'commun', icon: 'map-pin', color: '#2563eb' },
    { id: 'ec-dept-59', code: 'dept_59', nom: 'Protection Civile du Nord (59)', description: 'Écusson des unités engagées sur le littoral flamand et métropole lilloise.', categorie: 'departement', rarete: 'commun', icon: 'map-pin', color: '#2563eb' },

    { id: 'ec-renf-dpsge', code: 'renf_dps_ge', nom: 'Grande Envergure • Renfort Inter-Antennes', description: 'Décerné pour l’envoi d’un équipage en renfort solidaire sur un DPS-GE.', categorie: 'renfort', rarete: 'epique', icon: 'users', color: '#4f46e5' },
    { id: 'ec-renf-crue', code: 'renf_colonne_crue', nom: 'Colonne Nationale Crues & Inondations', description: 'Insigne de prestige remis lors des déploiements majeurs de pompage et sauvetage.', categorie: 'renfort', rarete: 'historique', icon: 'droplets', color: '#0284c7' },
    { id: 'ec-renf-zonal', code: 'renf_zonal', nom: 'Solidarité Zonale de Sécurité Civile', description: 'Appui rapide et détachement de vecteurs entre départements voisins.', categorie: 'renfort', rarete: 'rare', icon: 'share-2', color: '#0d9488' },
    { id: 'ec-renf-fondateur', code: 'renf_fondateur', nom: 'Pionnier FNPC • Fondation d’Antenne', description: 'Écusson commémoratif remis aux directeurs ayant fondé leur antenne locale.', categorie: 'renfort', rarete: 'historique', icon: 'crown', color: '#eab308' }
  ],

  // --- INITIALISATION DU MODULE & SYNCHRONISATION ---
  async initEcussons(game) {
    if (!game) game = window.game;
    this.catalog = [...this.FALLBACK_CATALOG];

    // 1. Tenter le chargement du catalogue officiel depuis Supabase
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { data: supaCatalog, error: catErr } = await window.ProtecSupabase.client
          .from('ecussons')
          .select('*')
          .order('categorie', { ascending: true });

        if (!catErr && supaCatalog && supaCatalog.length > 0) {
          this.catalog = supaCatalog;
        }
      } catch (e) {
        console.warn('Chargement catalogue écussons Supabase:', e);
      }
    }

    // 2. Charger les écussons du joueur
    await this.refreshPlayerEcussons(game);

    // Si le joueur a une antenne et aucun écusson, lui attribuer son écusson fondateur
    if (this.playerEcussons.length === 0 && game && game.stations && game.stations.length > 0) {
      await this.attribuerEcusson('renf_fondateur', game.stations[0].id, false);
      const deptCode = game.stations[0].departmentCode || '54';
      const deptBadgeCode = `dept_${deptCode}`;
      if (this.catalog.some(c => c.code === deptBadgeCode)) {
        await this.attribuerEcusson(deptBadgeCode, game.stations[0].id, false);
      }
    }

    this.isInitialized = true;
  },

  async refreshPlayerEcussons(game) {
    if (!game) game = window.game;
    const antenneId = this.getAntenneId(game);
    if (!antenneId) return;

    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { data, error } = await window.ProtecSupabase.client
          .from('antenne_ecussons')
          .select('*, ecusson:ecussons(*)')
          .eq('antenne_id', antenneId);

        if (!error && data) {
          this.playerEcussons = data.map(item => ({
            antenne_id: item.antenne_id,
            ecusson_id: item.ecusson_id,
            quantite: item.quantite || 1,
            ecusson: item.ecusson || this.catalog.find(c => c.id === item.ecusson_id) || {}
          }));
          return;
        }
      } catch (e) {
        console.warn('Erreur lecture antenne_ecussons:', e);
      }
    }

    // Fallback local résilient
    if (!game.localEcussons) {
      game.localEcussons = [
        { code: 'renf_fondateur', quantite: 1 }
      ];
    }
    this.playerEcussons = game.localEcussons.map(le => {
      const ec = this.catalog.find(c => c.code === le.code) || {};
      return {
        antenne_id: antenneId,
        ecusson_id: ec.id,
        quantite: le.quantite,
        ecusson: ec
      };
    });
  },

  getAntenneId(game) {
    if (!game) game = window.game;
    return game?.player?.id || game?.stations?.[0]?.id || 'antenne-locale';
  },

  // --- ATTRIBUTION D'UN ÉCUSSON (UPSERT & NOTIFICATION) ---
  async attribuerEcusson(codeEcusson, antenneId = null, notify = true) {
    const game = window.game;
    if (!antenneId) antenneId = this.getAntenneId(game);
    const badge = this.catalog.find(b => b.code === codeEcusson);
    if (!badge) {
      console.warn(`Écusson introuvable pour le code: ${codeEcusson}`);
      return;
    }

    let isNew = true;
    const existing = this.playerEcussons.find(pe => pe.ecusson?.code === codeEcusson || pe.ecusson_id === badge.id);
    if (existing) {
      existing.quantite = (existing.quantite || 1) + 1;
      isNew = false;
    } else {
      this.playerEcussons.push({
        antenne_id: antenneId,
        ecusson_id: badge.id,
        quantite: 1,
        ecusson: badge
      });
    }

    // Persistance Supabase Cloud
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { error } = await window.ProtecSupabase.client
          .from('antenne_ecussons')
          .upsert({
            antenne_id: antenneId,
            ecusson_id: badge.id,
            quantite: existing ? existing.quantite : 1,
            updated_at: new Date().toISOString()
          }, { onConflict: 'antenne_id,ecusson_id' });

        if (error) console.warn('Erreur upsert antenne_ecussons:', error);
      } catch (e) {
        console.warn('Erreur Supabase attribuerEcusson:', e);
      }
    }

    // Persistance locale de secours
    if (game) {
      if (!game.localEcussons) game.localEcussons = [];
      const loc = game.localEcussons.find(l => l.code === codeEcusson);
      if (loc) loc.quantite = (loc.quantite || 1) + 1;
      else game.localEcussons.push({ code: codeEcusson, quantite: 1 });
      if (typeof game.saveGame === 'function') game.saveGame();
    }

    // Notification sonore et visuelle
    if (notify && game) {
      const rareteLabels = {
        commun: 'Écusson Commun',
        rare: 'Écusson Rare ⭐',
        epique: 'Écusson Épique 🌟',
        historique: 'Écusson Historique 👑'
      };
      const title = isNew ? `🎉 Nouvel Écusson : ${badge.nom}` : `🔁 Doublon Obtenu : ${badge.nom} (x${existing.quantite})`;
      const desc = isNew
        ? `Félicitations ! L’écusson [${rareteLabels[badge.rarete] || badge.rarete}] a été accroché sur votre tableau en liège !`
        : `Vous possédez désormais un exemplaire supplémentaire pouvant être proposé au troc sur la bourse !`;

      game.showToast(title, desc, badge.rarete === 'historique' ? 'purple' : 'green');

      if (window.ProtecNotifications) {
        window.ProtecNotifications.recordNotification({
          title,
          message: `${badge.nom} • ${badge.description}`,
          category: 'system',
          level: badge.rarete === 'historique' ? 'success' : 'info'
        });
      }

      this.triggerPatchCelebration(badge);
    }
  },

  triggerPatchCelebration(badge) {
    const banner = document.createElement('div');
    banner.className = 'fixed top-12 left-1/2 -translate-x-1/2 z-[9999] p-4 rounded-3xl bg-slate-950/95 border-2 border-amber-400 text-white shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-6 duration-300 max-w-md';
    banner.innerHTML = `
      <div class="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 p-2 flex items-center justify-center flex-shrink-0 text-3xl">
        ${this.renderBadgeIconSvg(badge, 44)}
      </div>
      <div>
        <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Collection d'Antenne • Débloqué !</span>
        <h4 class="text-sm font-extrabold text-white leading-tight">${badge.nom}</h4>
        <p class="text-[11px] text-slate-300 line-clamp-2 mt-0.5">${badge.description}</p>
      </div>
    `;
    document.body.appendChild(banner);
    setTimeout(() => {
      banner.classList.add('animate-out', 'fade-out', 'slide-out-to-top-6');
      setTimeout(() => banner.remove(), 400);
    }, 4200);
  },

  // --- RENDU VISUEL D'UN ÉCUSSON (SVG BRODÉ HAUTE FIDÉLITÉ) ---
  renderBadgeIconSvg(badge, size = 48) {
    const rareteColors = {
      commun: { stroke: '#94a3b8', glow: 'rgba(148, 163, 184, 0.2)' },
      rare: { stroke: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)' },
      epique: { stroke: '#c084fc', glow: 'rgba(192, 132, 252, 0.5)' },
      historique: { stroke: '#fbbf24', glow: 'rgba(251, 191, 36, 0.7)' }
    };
    const c = rareteColors[badge.rarete] || rareteColors.commun;
    const initial = (badge.nom || 'PC').substring(0, 2).toUpperCase();

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" class="filter drop-shadow-md transition transform hover:scale-105">
        <defs>
          <radialGradient id="grad-${badge.code}" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.35" />
          </radialGradient>
        </defs>
        <!-- Forme Blason Écusson -->
        <path d="M50 5 L88 18 C88 58 50 95 50 95 C50 95 12 58 12 18 Z" fill="#0f172a" stroke="${c.stroke}" stroke-width="4" stroke-dasharray="2 1" />
        <path d="M50 8 L85 20 C85 56 50 90 50 90 C50 90 15 56 15 20 Z" fill="url(#grad-${badge.code})" />
        
        <!-- Triangle Bleu & Orange Officiel Protection Civile -->
        <polygon points="50,22 76,70 24,70" fill="#f97316" stroke="#ffffff" stroke-width="1.5" />
        <polygon points="50,28 70,66 30,66" fill="#1e3a8a" />
        
        <!-- Étoile ou Symbole central -->
        <circle cx="50" cy="50" r="8" fill="#ffffff" opacity="0.9" />
        <text x="50" y="53" font-size="7" font-weight="900" fill="#1e3a8a" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${initial}</text>
        
        <!-- Bordure cousue extérieure -->
        <path d="M50 3 L90 17 C90 60 50 97 50 97 C50 97 10 60 10 17 Z" fill="none" stroke="${c.stroke}" stroke-width="1" opacity="0.6" />
      </svg>
    `;
  },

  // --- RENDU DE LA VUE PRINCIPALE « TABLEAU EN LIÈGE » ---
  renderTableauEcussons(game, container = null) {
    if (!game) game = window.game;
    const target = container || document.getElementById('modal-body');
    if (!target) return;

    const ownedMap = new Map();
    this.playerEcussons.forEach(pe => {
      const code = pe.ecusson?.code || pe.code;
      if (code) ownedMap.set(code, pe);
    });

    const totalInCatalog = this.catalog.length;
    const totalOwned = ownedMap.size;
    const percentOwned = Math.round((totalOwned / Math.max(1, totalInCatalog)) * 100);

    // Filtrer par catégorie
    const filteredCatalog = this.activeCategoryFilter === 'all'
      ? this.catalog
      : this.catalog.filter(b => b.categorie === this.activeCategoryFilter);

    const categories = [
      { id: 'all', label: 'Toutes' },
      { id: 'specialite', label: 'Spécialités' },
      { id: 'mission', label: 'Missions' },
      { id: 'departement', label: 'Départements' },
      { id: 'renfort', label: 'Renforts' }
    ];

    target.innerHTML = `
      <div class="space-y-5">
        <!-- Barre de Navigation Supérieure (Tableau en Liège vs Bourse aux Échanges) -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div class="flex items-center gap-2">
            <button onclick="window.ProtecEcussons.switchTab('tableau')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.currentTab === 'tableau' ? 'bg-amber-700 text-white shadow-md' : 'glass-button text-slate-700'}">
              <span>📌</span>
              <span>Tableau d’Écussons en Liège</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-900/60 text-white">${totalOwned}/${totalInCatalog}</span>
            </button>
            <button onclick="window.ProtecEcussons.switchTab('bourse')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.currentTab === 'bourse' ? 'bg-indigo-600 text-white shadow-md' : 'glass-button text-slate-700'}">
              <span>🤝</span>
              <span>Bourse aux Échanges (Troc)</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-indigo-800/60 text-white">En Ligne</span>
            </button>
          </div>

          <div class="text-xs text-slate-500 font-bold flex items-center gap-2">
            <span>Progression : <strong>${percentOwned}%</strong></span>
            <div class="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div class="bg-amber-600 h-full rounded-full" style="width: ${percentOwned}%"></div>
            </div>
          </div>
        </div>

        ${this.currentTab === 'bourse' ? `
          <div id="bourse-echanges-container"></div>
        ` : `
          <!-- Filtres de Catégories -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            ${categories.map(cat => `
              <button onclick="window.ProtecEcussons.setCategoryFilter('${cat.id}')" class="px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer whitespace-nowrap ${this.activeCategoryFilter === cat.id ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">
                ${cat.label}
              </button>
            `).join('')}
          </div>

          <!-- TABLEAU EN LIÈGE (Cadre Bois & Surface Liège) -->
          <div class="cork-board-frame p-3 sm:p-5 rounded-3xl shadow-2xl relative border-8 border-amber-950/70 overflow-hidden" style="background: radial-gradient(circle, #b88656 0%, #8c5828 100%);">
            <!-- Texture liège subtile avec punaises décoratives -->
            <div class="absolute top-2 left-2 w-3 h-3 rounded-full bg-red-600 shadow-sm border border-red-800"></div>
            <div class="absolute top-2 right-2 w-3 h-3 rounded-full bg-blue-600 shadow-sm border border-blue-800"></div>
            <div class="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-yellow-500 shadow-sm border border-yellow-700"></div>
            <div class="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-green-600 shadow-sm border border-green-800"></div>

            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 sm:gap-4 justify-items-center py-2">
              ${filteredCatalog.map(badge => {
                const owned = ownedMap.get(badge.code);
                const isOwned = !!owned;
                const qty = owned ? (owned.quantite || 1) : 0;
                const hasDuplicate = qty > 1;

                return `
                  <div onclick="window.ProtecEcussons.openBadgeDetailsModal('${badge.code}')" class="relative group cursor-pointer flex flex-col items-center p-2 rounded-2xl transition transform hover:-translate-y-1 hover:scale-105 select-none ${isOwned ? '' : 'opacity-40 filter grayscale hover:opacity-60'}">
                    <!-- Punaise au sommet de l'écusson -->
                    <div class="w-2.5 h-2.5 rounded-full bg-amber-200 border border-amber-800 shadow-sm -mb-1.5 z-10"></div>
                    
                    <!-- Visuel brodé du patch -->
                    <div class="relative p-1">
                      ${this.renderBadgeIconSvg(badge, 68)}
                      
                      <!-- Badge de Doublon (quantite > 1) -->
                      ${hasDuplicate ? `
                        <span class="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 border border-white shadow-md animate-bounce">
                          x${qty}
                        </span>
                      ` : (isOwned ? `
                        <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black bg-emerald-600 text-white border border-white flex items-center justify-center shadow">
                          ✓
                        </span>
                      ` : '')}
                    </div>

                    <!-- Libellé du patch -->
                    <span class="text-[10px] font-extrabold text-amber-50 text-center leading-tight line-clamp-2 mt-1 drop-shadow-md max-w-[80px]">
                      ${isOwned ? badge.nom : '???'}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `}
      </div>
    `;

    if (this.currentTab === 'bourse') {
      this.renderBourseEchanges(game);
    }
    if (window.lucide) window.lucide.createIcons();
  },

  switchTab(tab) {
    this.currentTab = tab;
    this.renderTableauEcussons(window.game);
  },

  setCategoryFilter(cat) {
    this.activeCategoryFilter = cat;
    this.renderTableauEcussons(window.game);
  },

  // --- MODALE DE DÉTAIL D'UN ÉCUSSON ---
  openBadgeDetailsModal(code) {
    const badge = this.catalog.find(b => b.code === code);
    if (!badge) return;

    const owned = this.playerEcussons.find(pe => pe.ecusson?.code === code || pe.code === code);
    const qty = owned ? (owned.quantite || 1) : 0;
    const isOwned = qty > 0;
    const canTrade = qty >= 2;

    const modalId = 'badge-detail-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    const rareteBadges = {
      commun: '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-800">Commun</span>',
      rare: '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">Rare ⭐</span>',
      epique: '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300">Épique 🌟</span>',
      historique: '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">Historique 👑</span>'
    };

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-sm rounded-3xl p-6 bg-white shadow-2xl border border-slate-200 text-slate-800 space-y-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            ${rareteBadges[badge.rarete] || ''}
            <span class="text-[10px] font-bold text-slate-400 uppercase">${badge.categorie}</span>
          </div>
          <button onclick="document.getElementById('${modalId}').remove()" class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center">✕</button>
        </div>

        <div class="flex flex-col items-center text-center space-y-2">
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
            ${this.renderBadgeIconSvg(badge, 88)}
          </div>
          <h3 class="text-base font-black text-slate-900">${badge.nom}</h3>
          <p class="text-xs text-slate-600 leading-relaxed">${badge.description}</p>
        </div>

        <!-- Statut d'acquisition -->
        <div class="p-3.5 rounded-2xl ${isOwned ? 'bg-emerald-50 border border-emerald-200 text-emerald-950' : 'bg-slate-50 border border-slate-200 text-slate-600'} text-xs space-y-1">
          <div class="flex items-center justify-between font-black">
            <span>Statut de Collection :</span>
            <span class="${isOwned ? 'text-emerald-700' : 'text-slate-500'}">
              ${isOwned ? `Débloqué (x${qty})` : '🔒 Non découvert'}
            </span>
          </div>
          <p class="text-[11px] ${isOwned ? 'text-emerald-800' : 'text-slate-500'}">
            ${isOwned
              ? (canTrade ? 'Vous possédez au moins un doublon : cet écusson est éligible au troc sur la bourse !' : 'Un seul exemplaire en collection. Trouvez un doublon pour pouvoir le troquer.')
              : 'Critère d’obtention : Participez aux missions, formations ou renforts correspondants pour décrocher ce patch.'}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('${modalId}').remove()" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
            Fermer
          </button>
          ${canTrade ? `
            <button onclick="document.getElementById('${modalId}').remove(); window.ProtecEcussons.openCreateOfferModal('${badge.code}')" class="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
              <span>🤝</span>
              <span>Proposer au Troc</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  },

  // --- BOURSE AUX ÉCHANGES (TROC EN LIGNE) ---
  async renderBourseEchanges(game) {
    const container = document.getElementById('bourse-echanges-container');
    if (!container) return;

    container.innerHTML = `
      <div class="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <span class="animate-spin">⏳</span> Chargement des offres de troc en direct sur le réseau...
      </div>
    `;

    const antenneId = this.getAntenneId(game);

    // 1. Charger les offres ouvertes depuis Supabase
    let offers = [];
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { data, error } = await window.ProtecSupabase.client
          .from('ecusson_echanges')
          .select('*, ecusson_offert:ecussons!ecusson_offert_id(*), ecusson_demande:ecussons!ecusson_demande_id(*)')
          .eq('statut', 'ouvert')
          .order('created_at', { ascending: false });

        if (!error && data) {
          offers = data;
        }
      } catch (e) {
        console.warn('Erreur chargement offres de troc:', e);
      }
    }

    this.activeOffers = offers;
    const othersOffers = offers.filter(o => o.antenne_offreur_id !== antenneId);
    const myOffers = offers.filter(o => o.antenne_offreur_id === antenneId);

    // Patchs éligibles au troc (quantite >= 2)
    const duplicates = this.playerEcussons.filter(pe => (pe.quantite || 0) >= 2);

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Bandeau Création d'Offre de Troc -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 class="text-sm font-black flex items-center gap-2">
              <span>🤝</span> Bourse d'Échanges Inter-Antennes
            </h4>
            <p class="text-xs text-indigo-200">
              Échangez vos doublons contre des écussons manquants avec les directeurs d’antenne alliés.
            </p>
          </div>
          <div>
            <button onclick="window.ProtecEcussons.openCreateOfferModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer ${duplicates.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}" ${duplicates.length === 0 ? 'disabled' : ''}>
              <span>➕</span>
              <span>Déposer une Offre (${duplicates.length} doublons)</span>
            </button>
          </div>
        </div>

        <!-- Mes Offres en Cours -->
        ${myOffers.length > 0 ? `
          <div class="space-y-3">
            <h5 class="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
              Vos Offres Ouvertes sur la Bourse (${myOffers.length})
            </h5>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${myOffers.map(o => `
                <div class="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-sm flex items-center justify-between gap-3 text-xs">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 p-0.5 rounded-xl bg-white border border-indigo-100 flex items-center justify-center">
                      ${this.renderBadgeIconSvg(o.ecusson_offert || {}, 34)}
                    </div>
                    <div>
                      <div class="font-extrabold text-indigo-950">Vous offrez : ${o.ecusson_offert?.nom || 'Écusson'}</div>
                      <div class="text-[11px] text-indigo-700 font-semibold">En échange de : <strong>${o.ecusson_demande?.nom || 'Écusson demandé'}</strong></div>
                    </div>
                  </div>
                  <button onclick="window.ProtecEcussons.annulerOffre('${o.id}')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white hover:bg-red-50 text-red-600 border border-red-200 transition">
                    Annuler
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Offres Disponibles des Autres Antennes -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black text-slate-700 uppercase tracking-wider">
              Offres de Troc Actives sur le Réseau (${othersOffers.length})
            </h5>
            <span class="text-[10px] text-slate-400 font-bold">Transaction bilatérale 100% sécurisée</span>
          </div>

          ${othersOffers.length === 0 ? `
            <div class="p-8 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 text-center space-y-2">
              <span class="text-3xl">📭</span>
              <p class="text-xs font-bold text-slate-700">Aucune offre extérieure ouverte pour le moment.</p>
              <p class="text-[11px] text-slate-400">Soyez le premier à proposer un échange en déposant un écusson en double !</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${othersOffers.map(o => {
                const offBadge = o.ecusson_offert || {};
                const reqBadge = o.ecusson_demande || {};
                // Vérifier si le joueur possède le badge demandé
                const playerHasRequired = this.playerEcussons.some(pe => pe.ecusson?.id === reqBadge.id || pe.ecusson?.code === reqBadge.code);

                return `
                  <div class="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-sm transition space-y-3">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-bold text-slate-500">Antenne Allié</span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">Ouvert</span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <!-- Offert -->
                      <div class="flex items-center gap-2">
                        <div class="w-10 h-10 p-0.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          ${this.renderBadgeIconSvg(offBadge, 34)}
                        </div>
                        <div class="min-w-0">
                          <span class="text-[9px] uppercase font-black text-emerald-700 block">Offert</span>
                          <span class="text-xs font-bold text-slate-900 truncate block">${offBadge.nom || 'Écusson'}</span>
                        </div>
                      </div>

                      <!-- Demandé -->
                      <div class="flex items-center gap-2 border-l border-slate-200 pl-2">
                        <div class="w-10 h-10 p-0.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                          ${this.renderBadgeIconSvg(reqBadge, 34)}
                        </div>
                        <div class="min-w-0">
                          <span class="text-[9px] uppercase font-black text-amber-700 block">Demandé</span>
                          <span class="text-xs font-bold text-slate-900 truncate block">${reqBadge.nom || 'Écusson'}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between pt-1">
                      <span class="text-[11px] ${playerHasRequired ? 'text-emerald-700 font-bold' : 'text-slate-400 font-semibold'}">
                        ${playerHasRequired ? '✓ Vous possédez cet écusson !' : '✕ Écusson manquant'}
                      </span>
                      <button onclick="window.ProtecEcussons.accepterOffre('${o.id}')" class="px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${playerHasRequired ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}" ${!playerHasRequired ? 'disabled' : ''}>
                        <span>🤝</span>
                        <span>Conclure l'Échange</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  // --- MODALE DE DÉPÔT D'OFFRE DE TROC ---
  openCreateOfferModal(presetCode = null) {
    const duplicates = this.playerEcussons.filter(pe => (pe.quantite || 0) >= 2);
    if (duplicates.length === 0) {
      window.game.showToast('Aucun Doublon', 'Vous devez posséder au moins 2 exemplaires d’un écusson pour pouvoir le proposer à l’échange.', 'orange');
      return;
    }

    const modalId = 'create-offer-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    // Écussons non possédés ou catalogue pour la demande
    const availableToRequest = this.catalog;

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-slate-200 text-slate-800 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-base font-black text-slate-900 leading-tight">Déposer une Offre de Troc</h3>
            <p class="text-xs text-slate-500">Choisissez un doublon à céder et l'écusson recherché</p>
          </div>
          <button onclick="document.getElementById('${modalId}').remove()" class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- 1. Écusson offert -->
          <div>
            <label class="block font-extrabold text-slate-700 mb-1">Écusson offert (parmi vos doublons) :</label>
            <select id="trade-select-offered" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
              ${duplicates.map(d => {
                const badge = d.ecusson || {};
                const selected = (presetCode && badge.code === presetCode) ? 'selected' : '';
                return `<option value="${badge.id || d.ecusson_id}" ${selected}>${badge.nom} (en stock : x${d.quantite})</option>`;
              }).join('')}
            </select>
          </div>

          <!-- 2. Écusson demandé -->
          <div>
            <label class="block font-extrabold text-slate-700 mb-1">Écusson souhaité en échange :</label>
            <select id="trade-select-wanted" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white">
              ${availableToRequest.map(b => `
                <option value="${b.id}">${b.nom} [${b.rarete.toUpperCase()} - ${b.categorie}]</option>
              `).join('')}
            </select>
          </div>
        </div>

        <p class="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <strong>Règle FNPC :</strong> L’exemplaire offert sera réservé pour la bourse. Vous conserverez votre exemplaire original dans votre tableau en liège.
        </p>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="document.getElementById('${modalId}').remove()" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
            Annuler
          </button>
          <button onclick="window.ProtecEcussons.confirmerCreationOffre()" class="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <span>🤝</span>
            <span>Publier l'Offre</span>
          </button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  },

  async confirmerCreationOffre() {
    const offeredSelect = document.getElementById('trade-select-offered');
    const wantedSelect = document.getElementById('trade-select-wanted');
    if (!offeredSelect || !wantedSelect) return;

    const offeredId = offeredSelect.value;
    const wantedId = wantedSelect.value;

    if (!offeredId || !wantedId) return;
    if (offeredId === wantedId) {
      window.game.showToast('Choix Invalide', 'Vous ne pouvez pas demander le même écusson que celui offert.', 'orange');
      return;
    }

    const antenneId = this.getAntenneId(window.game);

    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { data, error } = await window.ProtecSupabase.client.rpc('creer_offre_echange', {
          p_ecusson_offert_id: offeredId,
          p_ecusson_demande_id: wantedId,
          p_antenne_id: antenneId
        });

        if (error) {
          window.game.showToast('Erreur Troc', error.message || 'Impossible de créer l’offre.', 'orange');
          return;
        }

        window.game.showToast('Offre Publiée ! 🤝', 'Votre proposition d’échange est désormais visible par tous les directeurs alliés !', 'green');
      } catch (e) {
        window.game.showToast('Erreur Réseau', 'Erreur lors de la publication de l’offre.', 'orange');
        return;
      }
    } else {
      // Simulation locale
      window.game.showToast('Offre Publiée (Local)', 'Offre de troc simulée.', 'green');
    }

    const modal = document.getElementById('create-offer-modal');
    if (modal) modal.remove();

    await this.refreshPlayerEcussons(window.game);
    this.renderBourseEchanges(window.game);
  },

  async annulerOffre(offreId) {
    const antenneId = this.getAntenneId(window.game);

    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { data, error } = await window.ProtecSupabase.client.rpc('annuler_offre_echange', {
          p_offre_id: offreId,
          p_antenne_id: antenneId
        });

        if (error) {
          window.game.showToast('Erreur', error.message || 'Impossible d’annuler l’offre.', 'orange');
          return;
        }

        window.game.showToast('Offre Annulée', 'L’écusson a été réintégré à votre tableau d’antenne.', 'blue');
      } catch (e) {
        window.game.showToast('Erreur', 'Erreur réseau lors de l’annulation.', 'orange');
        return;
      }
    }

    await this.refreshPlayerEcussons(window.game);
    this.renderBourseEchanges(window.game);
  },

  async accepterOffre(offreId) {
    const antenneId = this.getAntenneId(window.game);

    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      try {
        const { data, error } = await window.ProtecSupabase.client.rpc('accepter_offre_echange', {
          p_offre_id: offreId,
          p_antenne_demandeur_id: antenneId
        });

        if (error) {
          window.game.showToast('Échange Impossible', error.message || 'Transaction non autorisée.', 'orange');
          return;
        }

        window.game.showToast('Troc Conclu ! 🎉', 'L’échange est validé ! Votre nouvel écusson est accroché à votre tableau en liège.', 'green');
      } catch (e) {
        window.game.showToast('Erreur', 'Erreur réseau lors de l’échange.', 'orange');
        return;
      }
    }

    await this.refreshPlayerEcussons(window.game);
    this.renderBourseEchanges(window.game);
  }
};
