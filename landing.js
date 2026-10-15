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

  // Données de base de télémétrie opérationnelle
  telemetry: {
    stations: 54,
    volunteers: 1428,
    fleet: 312,
    dps: 84
  },

  // Flux de dépêches pour le téléscripteur opérationnel
  tickerLogPreset: [
    { type: 'samu', icon: 'activity', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Régulation SAMU 15 • VPSP Antenne Nancy engagé sur urgence à domicile (Détresse respiratoire).' },
    { type: 'dps', icon: 'shield-check', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'Dispositif DPS • Marathon Régional validé : 14 secouristes et 2 VPSP en place au km 21.' },
    { type: 'formation', icon: 'graduation-cap', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'Pôle Formation • 8 nouveaux équipiers certifiés PSE2 (Reconnaissance officielle SUAP).' },
    { type: 'logistique', icon: 'truck', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'Logistique Opérationnelle • Réarmement d’urgence : 6 bouteilles O2 rechargées & révision VPSP-02 conforme.' },
    { type: 'crise', icon: 'siren', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'Alerte Vigilance Crues • Pré-alerte COD Préfecture : Colonne motopompes en astreinte 30 min.' },
    { type: 'samu', icon: 'heart-pulse', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'Bilan Transmis • Équipage VPSP évacue victime stable vers le Centre Hospitalier Universitaire.' },
    { type: 'rh', icon: 'users', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'Astreinte Opérationnelle • 12 secouristes volontaires positionnés en renfort de nuit.' },
    { type: 'dps', icon: 'calendar', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'Convention Validée • Signature DPS Festival des Musiques Actuelles (3 500 spectateurs).' }
  ],

  // Barème officiel des points selon le niveau de rareté
  rarityWeights: {
    historique: 5,
    epique: 3,
    rare: 2,
    commun: 1
  },

  // Données des vitrines d'antennes de secours classées par niveau de rareté cumulé
  antennesShowcases: [
    {
      id: 'showcase-1',
      name: 'Antenne Métropolitaine de Nancy',
      director: 'Directeur Thomas',
      department: 'Meurthe-et-Moselle (54)',
      badges: [
        { id: 'b1', code: 'renf_fondateur', name: 'Membre Fondateur', cat: 'renfort', rarity: 'historique', icon: 'crown', desc: 'Attribué aux directeurs membres fondateurs ayant ouvert leur premier centre de secours territorial.', imageUrl: 'images/badges/membre_fondateur.png' },
        { id: 'b2', code: 'renf_colonne_crue', name: 'Colonne Nationale Crues & Inondations', cat: 'renfort', rarity: 'historique', icon: 'droplets', desc: 'Distinction officielle suite aux opérations majeures de pompage lourd et d’évacuation de population.' },
        { id: 'b3', code: 'spec_pma', name: 'Poste Médical Avancé (PMA)', cat: 'specialite', rarity: 'epique', icon: 'plus-square', desc: 'Aptitude certifiée au déploiement rapide d’une chaîne médicale avancée de tri d’urgence.' },
        { id: 'b4', code: 'dept_54', name: 'Protection Civile 54 • Meurthe-et-Moselle', cat: 'departement', rarity: 'commun', icon: 'map-pin', desc: 'Insigne officiel des unités de secours et d’action citoyenne de Meurthe-et-Moselle.', imageUrl: 'images/badges/badge_meurthe_et_moselle_54.png' }
      ]
    },
    {
      id: 'showcase-2',
      name: 'Compagnie d’Intervention de Paris',
      director: 'Commandant Leroy',
      department: 'Paris (75)',
      badges: [
        { id: 'b5', code: 'miss_14_juillet', name: 'Dispositif Fête Nationale 14 Juillet', cat: 'mission', rarity: 'epique', icon: 'sparkles', desc: 'Délivré lors du commandement des dispositifs de grande ampleur lors des célébrations républicaines.' },
        { id: 'b6', code: 'renf_dps_ge', name: 'Grande Envergure • Renfort Inter-Antennes', cat: 'renfort', rarity: 'epique', icon: 'users', desc: 'Décerné lors de l’envoi d’équipages complets VPSP en détachement d’appui hors département.' },
        { id: 'b7', code: 'spec_aep', name: 'Soutien Psychologique d’Urgence (AEP)', cat: 'specialite', rarity: 'rare', icon: 'heart-pulse', desc: 'Cellule habilitée à la prise en charge immédiate du choc émotionnel post-catastrophe.' },
        { id: 'b8', code: 'dept_75', name: 'Protection Civile de Paris', cat: 'departement', rarity: 'rare', icon: 'landmark', desc: 'Écusson territorial des brigades de secours engagées au cœur de la capitale.' }
      ]
    },
    {
      id: 'showcase-3',
      name: 'Unité Littorale des Bouches-du-Rhône',
      director: 'Capitaine Marchand',
      department: 'Bouches-du-Rhône (13)',
      badges: [
        { id: 'b9', code: 'spec_aqua', name: 'Sauvetage Aquatique & Inondations', cat: 'specialite', rarity: 'rare', icon: 'waves', desc: 'Reconnaissance des équipages spécialisés en secours aquatique, fleuves et zones inondables.' },
        { id: 'b10', code: 'spec_cyno', name: 'Unité Cynotechnique de Recherche', cat: 'specialite', rarity: 'rare', icon: 'paw-print', desc: 'Équipes de recherche de personnes égarées et victimes de décombres en zone difficile.' },
        { id: 'b11', code: 'miss_marathon', name: 'Grands Événements Sportifs Nationaux', cat: 'mission', rarity: 'commun', icon: 'trophy', desc: 'Sécurisation et chaîne médicale continue sur marathons et courses d’endurance.' },
        { id: 'b12', code: 'dept_13', name: 'Protection Civile 13 • Méditerranée', cat: 'departement', rarity: 'rare', icon: 'flame', desc: 'Insigne des équipages engagés sur le littoral provençal et en veille de massifs forestiers.' }
      ]
    },
    {
      id: 'showcase-4',
      name: 'Délégation Territoriale de Gironde',
      director: 'Lieutenant Moreau',
      department: 'Gironde (33)',
      badges: [
        { id: 'b13', code: 'spec_formateur', name: 'Corps National des Formateurs', cat: 'specialite', rarity: 'rare', icon: 'graduation-cap', desc: 'Distinction des antennes disposant de formateurs certifiés (PICF / PAE).' },
        { id: 'b14', code: 'miss_festival', name: 'Sécurité Festivals & Musique', cat: 'mission', rarity: 'rare', icon: 'music', desc: 'Encadrement préventif et secours d’urgence sur événements musicaux.' },
        { id: 'b15', code: 'dept_33', name: 'Protection Civile de Gironde', cat: 'departement', rarity: 'commun', icon: 'map-pin', desc: 'Distinction territoriale des secouristes du littoral aquitain.' }
      ]
    },
    {
      id: 'showcase-5',
      name: 'Groupement Opérationnel du Rhône',
      director: 'Directrice Sophie',
      department: 'Rhône (69)',
      badges: [
        { id: 'b16', code: 'spec_pma', name: 'Poste Médical Avancé (PMA)', cat: 'specialite', rarity: 'epique', icon: 'plus-square', desc: 'Capacité de déploiement d’une chaîne médicale complète de tri et d’urgence.' },
        { id: 'b17', code: 'miss_marathon', name: 'Grands Événements Sportifs Nationaux', cat: 'mission', rarity: 'commun', icon: 'trophy', desc: 'Sécurisation et chaîne médicale continue sur marathons et courses d’endurance.' },
        { id: 'b18', code: 'dept_69', name: 'Protection Civile du Rhône', cat: 'departement', rarity: 'rare', icon: 'activity', desc: 'Insigne officiel des unités de secours de la métropole lyonnaise.' }
      ]
    },
    {
      id: 'showcase-6',
      name: 'Compagnie Territoriale des Flandres',
      director: 'Capitaine Dubois',
      department: 'Nord (59)',
      badges: [
        { id: 'b19', code: 'renf_colonne_crue', name: 'Colonne Nationale Crues & Inondations', cat: 'renfort', rarity: 'historique', icon: 'droplets', desc: 'Distinction officielle suite aux opérations majeures de pompage lourd et d’évacuation de population.' },
        { id: 'b20', code: 'spec_cyno', name: 'Unité Cynotechnique de Recherche', cat: 'specialite', rarity: 'rare', icon: 'paw-print', desc: 'Équipes de recherche de personnes égarées et décombres.' },
        { id: 'b21', code: 'dept_59', name: 'Protection Civile du Nord', cat: 'departement', rarity: 'commun', icon: 'shield', desc: 'Unité de secours et d’assistance civique des Hauts-de-France.' }
      ]
    },
    {
      id: 'showcase-7',
      name: 'Antenne Métropolitaine de Toulouse',
      director: 'Commandant Cazeneuve',
      department: 'Haute-Garonne (31)',
      badges: [
        { id: 'b22', code: 'spec_aep', name: 'Soutien Psychologique d’Urgence (AEP)', cat: 'specialite', rarity: 'rare', icon: 'heart-pulse', desc: 'Cellule habilitée à la prise en charge immédiate du choc émotionnel post-catastrophe.' },
        { id: 'b23', code: 'miss_14_juillet', name: 'Dispositif Fête Nationale 14 Juillet', cat: 'mission', rarity: 'epique', icon: 'sparkles', desc: 'Commandement de dispositifs républicains de grande envergure.' },
        { id: 'b24', code: 'dept_31', name: 'Protection Civile 31 • Occitanie', cat: 'departement', rarity: 'commun', icon: 'compass', desc: 'Secouristes d’intervention du bassin toulousain.' }
      ]
    },
    {
      id: 'showcase-8',
      name: 'Unité Océane Loire-Atlantique',
      director: 'Lieutenant Guérin',
      department: 'Loire-Atlantique (44)',
      badges: [
        { id: 'b25', code: 'spec_aqua', name: 'Sauvetage Aquatique & Inondations', cat: 'specialite', rarity: 'rare', icon: 'waves', desc: 'Secours nautique, estuaires et crues.' },
        { id: 'b26', code: 'spec_formateur', name: 'Corps National des Formateurs', cat: 'specialite', rarity: 'rare', icon: 'graduation-cap', desc: 'Équipe agréée formations PSC / PSE.' },
        { id: 'b27', code: 'dept_44', name: 'Protection Civile 44', cat: 'departement', rarity: 'commun', icon: 'anchor', desc: 'Insigne officiel des unités de secours nantaises et atlantiques.' }
      ]
    }
  ],

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

    const isLoggedIn = !!(token && user);
    const navActions = document.getElementById('landing-nav-actions');
    const heroActions = document.getElementById('landing-hero-actions');

    if (isLoggedIn) {
      const username = user.username || 'Directeur';
      const safeName = (function(str) {
        return String(str || '').replace(/[&<>"']/g, m => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        })[m]);
      })(username);

      if (navActions) {
        navActions.innerHTML = `
          <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs font-bold text-[#002e6d]">
            <i data-lucide="shield" class="w-3.5 h-3.5 text-[#0055b8]"></i>
            <span class="truncate max-w-[130px]">${safeName}</span>
          </div>
          <button onclick="window.MyProtecLanding.enterGame()" class="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#0055b8] to-[#0284c7] hover:from-[#004494] hover:to-[#0270a8] shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
            <span>Mon Antenne</span>
          </button>
          <button onclick="window.ProtecAuth.logout(); window.MyProtecLanding.updateAuthButtonsState();" class="p-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 transition cursor-pointer" title="Se déconnecter">
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
          <button onclick="window.ProtecAuth.logout(); window.MyProtecLanding.updateAuthButtonsState();" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/85 hover:bg-white text-slate-700 hover:text-rose-600 font-extrabold text-sm border border-slate-200/90 shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Changer de compte</span>
          </button>
        `;
      }
    } else {
      if (navActions) {
        navActions.innerHTML = `
          <button onclick="window.MyProtecLanding.openAuth('login')" class="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-slate-950 bg-white/80 hover:bg-white border border-slate-200 transition shadow-xs flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="user" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Connexion</span>
          </button>
          <button onclick="window.MyProtecLanding.openAuth('register')" class="px-4.5 py-2 rounded-xl text-xs font-black text-white bg-[#ff6600] hover:bg-[#e65c00] shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i>
            <span>Jouer</span>
          </button>
        `;
      }

      if (heroActions) {
        heroActions.innerHTML = `
          <button onclick="window.MyProtecLanding.openAuth('register')" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#ff6600] hover:bg-[#e65c00] text-white font-black text-sm shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-2 cursor-pointer group">
            <i data-lucide="play" class="w-4 h-4 fill-current"></i>
            <span id="landing-hero-register-text">Jouer gratuitement</span>
            <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
          </button>
          <button onclick="window.MyProtecLanding.openAuth('login')" class="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white/85 hover:bg-white text-slate-800 font-extrabold text-sm border border-slate-200/90 shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="log-in" class="w-4 h-4 text-[#0055b8]"></i>
            <span>Se connecter</span>
          </button>
        `;
      }
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
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

    items.forEach((item, index) => {
      // Sur mobile : clic pour déplier
      item.addEventListener('click', () => {
        items.forEach(el => {
          if (el !== item) el.classList.remove('is-expanded');
        });
        item.classList.toggle('is-expanded');
      });

      // Déplier le premier pôle par défaut
      if (index === 0) {
        item.classList.add('is-expanded');
      }
    });
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
      // 1. Vérifier si une partie locale du joueur possède des écussons
      const localRaw = localStorage.getItem('protec_save') || localStorage.getItem('myprotec_save') || localStorage.getItem('protec_save_game');
      if (localRaw) {
        const lSave = JSON.parse(localRaw);
        const lEcussons = lSave.localEcussons || lSave.ecussons || [];
        if (lEcussons.length > 0) {
          const stationName = lSave.stations?.[0]?.name || lSave.player?.stationName || 'Mon Antenne';
          const dept = lSave.stations?.[0]?.departmentCode || lSave.player?.departmentCode || '54';
          const city = lSave.stations?.[0]?.city || lSave.player?.city || 'Nancy';
          const playerName = lSave.player?.name || 'Directeur';

          // Transformer les écussons locaux
          const catalog = window.ProtecEcussons?.catalog || [];
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

          // Ajouter ou mettre à jour la vitrine du joueur dans le classement
          const existingIdx = this.antennesShowcases.findIndex(a => a.id === 'player-station');
          const playerShowcase = {
            id: 'player-station',
            name: stationName,
            director: playerName,
            department: `${city} (${dept})`,
            badges: badges
          };

          if (existingIdx >= 0) {
            this.antennesShowcases[existingIdx] = playerShowcase;
          } else {
            this.antennesShowcases.push(playerShowcase);
          }
        }
      }

      // 2. Interroger Supabase si la table antenne_ecussons a des données
      if (window.ProtecSupabase && window.ProtecSupabase.client) {
        const [
          { data: supaAntennes, error: errAntennes },
          { data: supaStations },
          { data: supaPlayers }
        ] = await Promise.all([
          window.ProtecSupabase.client.from('antenne_ecussons').select('antenne_id, quantite, ecusson:ecussons(*)'),
          window.ProtecSupabase.client.from('alliance_stations').select('id, player_id, player_name, station_name, city').catch(() => ({ data: [] })),
          window.ProtecSupabase.client.from('players').select('id, username, station_name, city, department_code').catch(() => ({ data: [] }))
        ]);

        if (!errAntennes && supaAntennes && supaAntennes.length > 0) {
          // Indexation rapide des stations et profils directeurs
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

          // Profil utilisateur actuellement connecté (si présent)
          let currentProfile = null;
          try {
            currentProfile = JSON.parse(localStorage.getItem('protec_user_profile') || '{}');
          } catch (e) {}

          // Grouper par antenne_id
          const groups = {};
          supaAntennes.forEach(item => {
            if (!groups[item.antenne_id]) groups[item.antenne_id] = [];
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
              } else if (!imgUrl && window.ProtecEcussons?.FALLBACK_CATALOG) {
                const fb = window.ProtecEcussons.FALLBACK_CATALOG.find(f => f.code === code);
                if (fb && fb.imageUrl) imgUrl = fb.imageUrl;
              }

              groups[item.antenne_id].push({
                id: item.ecusson.id,
                code: code,
                name: name,
                cat: item.ecusson.categorie,
                rarity: item.ecusson.rarete,
                icon: item.ecusson.icon || 'shield',
                imageUrl: imgUrl,
                desc: item.ecusson.description
              });
            }
          });

          // Mettre à jour les données réelles avec les vrais noms d'antenne et pseudos de joueurs
          const dynamicList = [];
          for (const [antId, bList] of Object.entries(groups)) {
            const st = stationsMap.get(antId);
            const pl = playersMap.get(antId) || (st?.player_id ? playersMap.get(st.player_id) : null);

            // Vérifier aussi la session connectée locale si c'est le joueur en cours
            const isCurrent = (currentProfile?.id === antId) || (currentProfile?.station_id === antId);
            const effPl = pl || (isCurrent ? currentProfile : null);

            // Résolution du nom de l'antenne
            let stationName = st?.station_name || effPl?.station_name;
            if (!stationName || stationName === 'Antenne Locale' || stationName === 'Mon Antenne' || stationName.startsWith('station-')) {
              const city = effPl?.city || st?.city;
              const dept = effPl?.department_code;
              if (city) {
                stationName = `Antenne de ${city}`;
              } else if (dept) {
                stationName = `Antenne Protection Civile (${dept})`;
              } else {
                stationName = 'Antenne Protection Civile';
              }
            } else if (!stationName.toLowerCase().includes('antenne') && !stationName.toLowerCase().includes('protection civile')) {
              // Si le nom est juste une ville (ex: "Nancy"), on le rend plus valorisant
              stationName = `Antenne de ${stationName}`;
            }

            // Pseudo du joueur / directeur
            const directorName = effPl?.username || st?.player_name || 'Directeur d’Antenne';

            // Ville et département
            const city = effPl?.city || st?.city || '';
            const dept = effPl?.department_code || '';
            let deptLabel = 'Réseau National';
            if (city && dept) {
              deptLabel = `${city} (${dept})`;
            } else if (city) {
              deptLabel = city;
            } else if (dept) {
              deptLabel = `Département ${dept}`;
            }

            dynamicList.push({
              id: `supa-${antId}`,
              antenneId: antId,
              name: stationName,
              director: directorName,
              department: deptLabel,
              badges: bList
            });
          }

          if (dynamicList.length > 0) {
            this.antennesShowcases = dynamicList;
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
    return null;
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
      container.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-3xl">
          <p class="text-sm font-black text-slate-600">Aucune collection ne correspond à votre recherche</p>
          <p class="text-xs text-slate-400 mt-1">Modifiez vos termes de recherche ou sélectionnez une autre catégorie.</p>
        </div>
      `;
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
                const imgSrc = this.getBadgeImage(badge);
                return `
                  <div 
                    class="patch-badge-item group/patch relative p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col items-center text-center overflow-hidden transition hover:shadow-md hover:border-blue-300"
                    onmouseenter="window.MyProtecLanding.showBadgeTooltip(event, '${badge.name}', '${badge.desc || ''}', '${r.toUpperCase()}')"
                    onmouseleave="window.MyProtecLanding.hideBadgeTooltip()"
                  >
                    <!-- Couche Foil Holographique -->
                    <div class="foil-shiny-layer ${
                      r === 'historique' ? 'foil-historique' :
                      (r === 'epique' ? 'foil-epique' :
                      (r === 'rare' ? 'foil-rare' : ''))
                    }"></div>

                    <!-- Visuel Écusson : Image PNG Réelle ou Icône vectorielle -->
                    ${imgSrc ? `
                      <div class="w-14 h-16 flex items-center justify-center mb-2 filter drop-shadow-md group-hover/patch:scale-105 transition-transform">
                        <img src="${imgSrc}" alt="${badge.name}" class="w-full h-full object-contain pointer-events-none" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                        <div class="hidden w-11 h-11 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 items-center justify-center shadow-2xs">
                          <i data-lucide="shield" class="w-5 h-5"></i>
                        </div>
                      </div>
                    ` : `
                      <div class="w-11 h-11 rounded-xl ${
                        r === 'historique' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        (r === 'epique' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                        (r === 'rare' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-slate-100 text-slate-600 border border-slate-200'))
                      } flex items-center justify-center mb-2 shadow-2xs group-hover/patch:scale-105 transition-transform">
                        <i data-lucide="${(badge.icon && !badge.icon.includes('/') && !badge.icon.includes('.')) ? badge.icon : 'shield'}" class="w-5 h-5"></i>
                      </div>
                    `}

                    <strong class="text-[11px] font-black text-slate-800 leading-tight block truncate max-w-full">
                      ${badge.name}
                    </strong>
                    
                    <span class="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide mt-1.5 ${
                      r === 'historique' ? 'bg-amber-100 text-amber-900' :
                      (r === 'epique' ? 'bg-purple-100 text-purple-900' :
                      (r === 'rare' ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-100 text-slate-600'))
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
              
              <!-- Couche Foil Holographique -->
              <div class="foil-shiny-layer ${
                r === 'historique' ? 'foil-historique' :
                (r === 'epique' ? 'foil-epique' :
                (r === 'rare' ? 'foil-rare' : ''))
              }"></div>

              <div>
                <!-- Bouton toggle en vitrine (Étoile) -->
                <div class="flex items-center justify-between mb-2">
                  <span class="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide ${
                    r === 'historique' ? 'bg-amber-100 text-amber-900' :
                    (r === 'epique' ? 'bg-purple-100 text-purple-900' :
                    (r === 'rare' ? 'bg-cyan-100 text-cyan-900' : 'bg-slate-100 text-slate-600'))
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

                <!-- Visuel écusson -->
                <div class="w-full h-20 flex items-center justify-center my-1 filter drop-shadow-md">
                  ${imgSrc ? `
                    <img src="${imgSrc}" alt="${badge.name}" class="h-full object-contain pointer-events-none group-hover/item:scale-105 transition-transform" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                    <div class="hidden w-12 h-12 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 items-center justify-center shadow-2xs">
                      <i data-lucide="shield" class="w-6 h-6"></i>
                    </div>
                  ` : `
                    <div class="w-12 h-12 rounded-xl ${
                      r === 'historique' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      (r === 'epique' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                      (r === 'rare' ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-slate-100 text-slate-600 border border-slate-200'))
                    } flex items-center justify-center shadow-2xs group-hover/item:scale-105 transition-transform">
                      <i data-lucide="${(badge.icon && !badge.icon.includes('/') && !badge.icon.includes('.')) ? badge.icon : 'shield'}" class="w-6 h-6"></i>
                    </div>
                  `}
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
