/**
 * PROTEC LIVE - TUTORIEL OFFICIEL DE DÉMARRAGE EN 4 ÉTAPES
 * 
 * Étape 1 : Présentation de l'équipe de base (5 bénévoles) avec modification des identités (noms, avatars)
 * Étape 2 : Placement du bâtiment sur la carte (géolocalisation Leaflet dans le département)
 * Étape 3 : Aménagement du bâtiment (bâtiment de base fourni VIDE, achat et placement du mobilier)
 * Étape 4 : Signature de l'affiliation FNPC pour devenir une vraie AASC
 * 
 * Lancement du jeu : Démarre sans aucun véhicule ni matériel.
 * Ce sont ensuite les défis et missions qui guident et récompensent le joueur.
 */

window.ProtecOnboarding = {
  currentStep: 1,
  teamName: 'Antenne Protection Civile',
  deptCode: '54',
  game: null,

  // 1. Équipe fondatrice personnalisable (5 bénévoles constitutifs)
  volunteersList: [
    { id: 'vol_1', name: 'Alexandre Roux', role: 'Chef d’Équipe', rank: 'CE', gender: 'h', avatar: '👨‍💼', skills: ['ce', 'pse2', 'pse1', 'permis_b'], exp: 30, motivation: 85, dispoType: 'salarié', dispoJours: ['Vendredi', 'Samedi', 'Dimanche'] },
    { id: 'vol_2', name: 'Sarah Benali', role: 'Équipier Secouriste', rank: 'PSE2', gender: 'f', avatar: '👩‍🚒', skills: ['pse2', 'pse1', 'permis_b'], exp: 25, motivation: 80, dispoType: 'étudiante', dispoJours: ['Mardi', 'Samedi', 'Dimanche'] },
    { id: 'vol_3', name: 'Thomas Girard', role: 'Équipier Secouriste', rank: 'PSE2', gender: 'h', avatar: '🧑‍🚒', skills: ['pse2', 'pse1'], exp: 20, motivation: 80, dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'] },
    { id: 'vol_4', name: 'Lucas Martin', role: 'Secouriste', rank: 'PSE1', gender: 'h', avatar: '🙋‍♂️', skills: ['pse1', 'permis_b'], exp: 15, motivation: 75, dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'] },
    { id: 'vol_5', name: 'Élodie Leroy', role: 'Secouriste', rank: 'PSE1', gender: 'f', avatar: '👩', skills: ['pse1'], exp: 10, motivation: 85, dispoType: 'étudiante', dispoJours: ['Mercredi', 'Vendredi', 'Samedi'] }
  ],

  // 2. Coordonnées de placement sur la carte
  placementData: {
    lat: 48.75,
    lng: 6.15,
    city: 'Nancy / Lunéville',
    citycode: '54'
  },
  step2Map: null,
  step2Marker: null,
  existingAllianceStations: [],
  exclusionCircles: [],
  existingStationMarkers: [],
  maskLayer: null,
  deptBorderLayer: null,
  placementValidation: { isValid: true, message: '', nearestStationName: null, nearestDist: null },
  cachedGeoJSON: null,
  lastValidPosition: null,

  // 3. Mobilier acheté, plan 2D vivant et typage des pièces du bâtiment
  placedFurniture: [],
  selectedRoomId: 'room_1',
  camera2D: { panX: 0, panY: 0, zoom: 0 },
  architectureModel: {
    parking: {
      x: 1.0,
      y: 1.5,
      w: 4.8,
      h: 9.0,
      label: 'Parking Opérationnel Extérieur',
      spots: [
        { id: 'spot_1', label: '🅿️ EMPLACEMENT LIBRE 01', x: 1.4, y: 2.2, w: 4.0, d: 2.4 },
        { id: 'spot_2', label: '🅿️ EMPLACEMENT LIBRE 02', x: 1.4, y: 5.6, w: 4.0, d: 2.4 }
      ]
    },
    rooms: [
      { id: 'room_1', type: 'libre', name: 'Salle 1', x: 6.2, y: 1.5, w: 4.6, h: 4.2, area: 19.3 },
      { id: 'room_2', type: 'libre', name: 'Salle 2', x: 10.8, y: 1.5, w: 4.8, h: 4.2, area: 20.2 },
      { id: 'room_3', type: 'libre', name: 'Salle 3', x: 6.2, y: 5.7, w: 9.4, h: 4.8, area: 45.1 }
    ],
    walls: [
      { x1: 6.2, y1: 1.5, x2: 15.6, y2: 1.5, th: 0.24, outer: true },
      { x1: 15.6, y1: 1.5, x2: 15.6, y2: 10.5, th: 0.24, outer: true },
      { x1: 15.6, y1: 10.5, x2: 6.2, y2: 10.5, th: 0.24, outer: true },
      { x1: 6.2, y1: 10.5, x2: 6.2, y2: 1.5, th: 0.24, outer: true },
      { x1: 10.8, y1: 1.5, x2: 10.8, y2: 5.7, th: 0.12, outer: false },
      { x1: 6.2, y1: 5.7, x2: 15.6, y2: 5.7, th: 0.12, outer: false }
    ],
    doors: [
      { id: 'd_entree', x: 6.2, y: 2.2, len: 0.93, wall: 'W', label: 'Porte d’Entrée (93cm)', isMain: true },
      { id: 'd_form', x: 10.8, y: 3.2, len: 0.83, wall: 'W', label: 'Porte Formation (83cm)', isMain: false },
      { id: 'd_reserve', x: 8.2, y: 5.7, len: 0.83, wall: 'N', label: 'Porte Réserve (83cm)', isMain: false },
      { id: 'd_service', x: 6.2, y: 7.6, len: 0.93, wall: 'W', label: 'Accès Matériel (93cm)', isMain: false }
    ],
    windows: [
      { id: 'w_bureau', x: 7.4, y: 1.5, len: 1.60, wall: 'N', label: 'Fenêtre Accueil (1.60m)' },
      { id: 'w_form_n', x: 12.0, y: 1.5, len: 1.80, wall: 'N', label: 'Baie Formation (1.80m)' },
      { id: 'w_form_e', x: 15.6, y: 2.8, len: 1.40, wall: 'E', label: 'Fenêtre Est (1.40m)' },
      { id: 'w_res_s', x: 8.4, y: 10.5, len: 1.60, wall: 'S', label: 'Fenêtre Haute Sud (1.60m)' },
      { id: 'w_res_e', x: 15.6, y: 7.5, len: 1.60, wall: 'E', label: 'Fenêtre Haute Est (1.60m)' }
    ],
    fixtures: [
      { id: 'extincteur_1', x: 6.3, y: 5.8, w: 0.25, h: 0.25, label: 'EXT', type: 'extinguisher' },
      { id: 'extincteur_2', x: 10.9, y: 5.3, w: 0.25, h: 0.25, label: 'EXT', type: 'extinguisher' }
    ]
  },
  roomsConfig: [
    { id: 'room_1', name: 'Salle 1', type: 'libre', label: 'Libre', area: 19.3, icon: '🚪', color: '#131b2e' },
    { id: 'room_2', name: 'Salle 2', type: 'libre', label: 'Libre', area: 20.2, icon: '🚪', color: '#131b2e' },
    { id: 'room_3', name: 'Salle 3', type: 'libre', label: 'Libre', area: 45.1, icon: '🚪', color: '#131b2e' }
  ],
  roomTypesList: [
    { id: 'libre', label: 'Libre (Non affectée)', icon: '🚪', desc: 'Fonction de la pièce non définie', color: '#1e293b' },
    { id: 'bureau', label: 'Bureau & Direction', icon: '💼', desc: 'Gestion administrative & planification', color: '#1e3a8a' },
    { id: 'formation', label: 'Salle de Formation', icon: '🎓', desc: 'Sessions PSC, SST et recyclages (+élèves)', color: '#1e40af' },
    { id: 'stockage', label: 'Stockage & Logistique', icon: '📦', desc: 'Réserve matériel, lots de secours', color: '#334155' },
    { id: 'detente', label: 'Foyer & Repos', icon: '☕', desc: 'Convivialité et récupération secouristes', color: '#065f46' },
    { id: 'vestiaire', label: 'Vestiaires & Sanitaires', icon: '👕', desc: 'Casiers et tenues d’intervention', color: '#4c1d95' },
    { id: 'pc_radio', label: 'PC Radio & Opérations', icon: '📡', desc: 'Poste de commandement opérationnel', color: '#701a75' }
  ],
  furnitureCatalog: [
    { id: 'bureau', type: 'bureau', name: 'Bureau Direction & PC', cost: 250, icon: '🖥️', defaultRoom: 'room_1', desc: 'Gestion administrative & planification des postes', w: 1.8, d: 0.9, color: '#334155', bonus: 'Poste de commandement' },
    { id: 'table_formation', type: 'table_formation', name: 'Table Formation Pédagogique', cost: 180, icon: '📚', defaultRoom: 'room_2', desc: 'Permet d’accueillir les sessions PSC & SST', w: 2.2, d: 1.1, color: '#ea580c', bonus: '+4 élèves par table' },
    { id: 'tableau_blanc', type: 'tableau_blanc', name: 'Tableau Blanc Mural', cost: 120, icon: '📋', defaultRoom: 'room_2', desc: 'Support visuel pour les cours de secourisme', w: 2.2, d: 0.2, color: '#f8fafc', bonus: '+10% qualité formation' },
    { id: 'mannequin_rcp', type: 'mannequin_rcp', name: 'Mannequin Secourisme RCP', cost: 320, icon: '🫀', defaultRoom: 'room_2', desc: 'Indispensable pour l’apprentissage du massage cardiaque', w: 0.6, d: 1.2, color: '#f59e0b', bonus: '+15% qualité formation' },
    { id: 'dae_mural', type: 'dae_mural', name: 'Défibrillateur DAE Mural', cost: 450, icon: '⚡', defaultRoom: 'room_1', desc: 'Sécurité d’urgence et démonstration pratique', w: 0.35, d: 0.35, color: '#10b981', bonus: '+5% qualité & sécurité' },
    { id: 'armoire_pharmacie', type: 'armoire_pharmacie', name: 'Armoire Pharmacie d’Urgence', cost: 190, icon: '🩹', defaultRoom: 'room_3', desc: 'Stockage sécurisé des pansements et compresses', w: 1.2, d: 0.4, color: '#dc2626', bonus: '+20 capacité consommables' },
    { id: 'etagere_lots', type: 'etagere_lots', name: 'Étagère Métallique Lots A/B', cost: 150, icon: '📦', defaultRoom: 'room_3', desc: 'Stockage robuste pour caisses PS et tentes', w: 0.6, d: 2.4, color: '#475569', bonus: '+35 capacité lots A/B' },
    { id: 'casiers_vestiaire', type: 'casiers_vestiaire', name: 'Casiers Tenues F1 Protec', cost: 180, icon: '🦺', defaultRoom: 'room_1', desc: 'Rangement des paquetages d’intervention', w: 0.6, d: 2.5, color: '#0f172a', bonus: '+25 capacité tenues & +2 moral' },
    { id: 'canape_detente', type: 'canape_detente', name: 'Canapé Foyer Bénévoles', cost: 280, icon: '🛋️', defaultRoom: 'room_1', desc: 'Convivialité et récupération des secouristes', w: 2.0, d: 0.9, color: '#059669', bonus: '+10% régénération énergie & +5 moral' },
    { id: 'machine_cafe', type: 'machine_cafe', name: 'Machine à Café & Pause', cost: 85, icon: '☕', defaultRoom: 'room_1', desc: 'Point de pause convivial pour les équipes', w: 0.8, d: 0.6, color: '#d97706', bonus: '+5% régénération énergie & +3 moral' },
    { id: 'lit_garde', type: 'lit_garde', name: 'Lit de Camp / Astreinte', cost: 220, icon: '🛏️', defaultRoom: 'room_1', desc: 'Dortoir de garde pour les permanences SAMU', w: 1.0, d: 2.0, color: '#a855f7', bonus: '+1 lit d’astreinte & +10% énergie' }
  ],

  // 4. Affiliation FNPC
  fnpcSigned: false,

  // Génération aléatoire d'une composition d'équipe constitutive variée
  randomizeVolunteers(notify = true) {
    if (window.ProtecPersonnel && typeof window.ProtecPersonnel.generateStarterVolunteers === 'function') {
      const generated = window.ProtecPersonnel.generateStarterVolunteers(5);
      this.volunteersList = generated.map((v, idx) => ({
        id: `vol_${idx + 1}`,
        name: v.name,
        role: v.role,
        rank: v.rank,
        gender: v.gender,
        avatar: v.avatar,
        skills: v.skills || [],
        exp: v.exp || 20,
        motivation: v.motivation || 85,
        dispoType: v.dispoType || 'salarié',
        dispoJours: v.dispoJours || ['Samedi', 'Dimanche'],
        trait: v.trait || 'devoue'
      }));
    }
    if (this.currentStep === 1) {
      this.renderWizard();
    }
  },

  // Sauvegarde instantanée de la progression totale dans le localStorage (Résilience totale en cas de fermeture)
  saveProgress() {
    try {
      localStorage.setItem('protec_onboarding_step', String(this.currentStep || 1));
      if (this.volunteersList && this.volunteersList.length > 0) {
        localStorage.setItem('protec_onboarding_volunteers', JSON.stringify(this.volunteersList));
      }
      if (this.placementData && this.placementData.lat) {
        localStorage.setItem('protec_onboarding_placement', JSON.stringify(this.placementData));
      }
      if (this.roomsConfig && this.roomsConfig.length > 0) {
        localStorage.setItem('protec_onboarding_rooms', JSON.stringify(this.roomsConfig));
      }
      if (this.placedFurniture) {
        localStorage.setItem('protec_onboarding_furniture', JSON.stringify(this.placedFurniture));
      }
      if (this.selectedRoomId) {
        localStorage.setItem('protec_onboarding_selected_room', this.selectedRoomId);
      }
      localStorage.setItem('protec_onboarding_fnpc_signed', this.fnpcSigned ? 'true' : 'false');
      if (this.fnpcSignatureDataUrl) {
        localStorage.setItem('protec_onboarding_fnpc_sig_data', this.fnpcSignatureDataUrl);
      }
      if (this.teamName) {
        localStorage.setItem('protec_station_name', this.teamName);
      }
      if (this.deptCode) {
        localStorage.setItem('protec_department_code', this.deptCode);
      }
    } catch (e) {
      console.warn('[ProtecOnboarding] Erreur lors de la sauvegarde de progression:', e);
    }
  },

  // Initialisation du Tuto à 4 étapes avec persistance et reprise transparente
  showWizard(game, options = {}) {
    this.game = game || window.game;
    this.fnpcSigned = false;

    // Récupération de la progression en cours si le tuto a été interrompu précédemment
    let savedStep = 1;
    let savedVolunteers = null;
    let savedPlacement = null;
    let savedRooms = null;
    let savedFurniture = null;
    let savedSelectedRoom = null;
    let savedFnpcSigned = false;
    let savedFnpcSigData = null;

    try {
      const storedStep = localStorage.getItem('protec_onboarding_step');
      if (storedStep) savedStep = parseInt(storedStep, 10) || 1;
      const storedVols = localStorage.getItem('protec_onboarding_volunteers');
      if (storedVols) savedVolunteers = JSON.parse(storedVols);
      const storedPlacement = localStorage.getItem('protec_onboarding_placement');
      if (storedPlacement) savedPlacement = JSON.parse(storedPlacement);
      const storedRooms = localStorage.getItem('protec_onboarding_rooms');
      if (storedRooms) savedRooms = JSON.parse(storedRooms);
      const storedFurniture = localStorage.getItem('protec_onboarding_furniture');
      if (storedFurniture) savedFurniture = JSON.parse(storedFurniture);
      const storedSelectedRoom = localStorage.getItem('protec_onboarding_selected_room');
      if (storedSelectedRoom) savedSelectedRoom = storedSelectedRoom;
      const storedFnpcSigned = localStorage.getItem('protec_onboarding_fnpc_signed');
      if (storedFnpcSigned === 'true') savedFnpcSigned = true;
      const storedFnpcSigData = localStorage.getItem('protec_onboarding_fnpc_sig_data');
      if (storedFnpcSigData) savedFnpcSigData = storedFnpcSigData;
    } catch (e) {}

    // Restauration de l'équipe configurée ou génération unique initiale (SANS régénération intempestive)
    if (Array.isArray(savedVolunteers) && savedVolunteers.length === 5) {
      this.volunteersList = savedVolunteers;
    } else if (!this.volunteersList || this.volunteersList.length !== 5) {
      this.randomizeVolunteers(false);
      try {
        localStorage.setItem('protec_onboarding_volunteers', JSON.stringify(this.volunteersList));
      } catch (e) {}
    }

    this.currentStep = Math.max(1, Math.min(4, options.step || savedStep || 1));

    let supaUser = null;
    try {
      supaUser = JSON.parse(localStorage.getItem('protec_user') || 'null');
    } catch (e) {}

    const chosenDept = options.deptCode 
      || (supaUser && (supaUser.departmentCode || supaUser.department_code))
      || this.game?.player?.departmentCode 
      || this.game?.currentDepartmentCode 
      || localStorage.getItem('protec_department_code') 
      || '75';

    this.deptCode = String(chosenDept).trim();
    if (this.game?.player) this.game.player.departmentCode = this.deptCode;
    if (this.game) this.game.currentDepartmentCode = this.deptCode;
    localStorage.setItem('protec_department_code', this.deptCode);

    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    const defaultCity = deptInfo ? (deptInfo.chefLieu || deptInfo.name) : 'Locale';

    if (options.teamName) this.teamName = options.teamName;
    else if (this.game?.player?.stationName) this.teamName = this.game.player.stationName;
    else if (supaUser && (supaUser.stationName || supaUser.station_name)) this.teamName = supaUser.stationName || supaUser.station_name;
    else if (localStorage.getItem('protec_station_name')) this.teamName = localStorage.getItem('protec_station_name');
    else this.teamName = `Antenne de ${defaultCity}`;

    // Position initiale sur la carte
    if (savedPlacement && savedPlacement.lat && savedPlacement.lng) {
      this.placementData.lat = savedPlacement.lat;
      this.placementData.lng = savedPlacement.lng;
      this.placementData.city = savedPlacement.city || (deptInfo ? (deptInfo.chefLieu || deptInfo.name) : 'Secteur Local');
      this.placementData.citycode = savedPlacement.citycode || this.deptCode;
    } else {
      this.placementData.lat = deptInfo ? deptInfo.lat : 48.75;
      this.placementData.lng = deptInfo ? deptInfo.lng : 6.15;
      this.placementData.city = deptInfo ? (deptInfo.chefLieu || deptInfo.name) : 'Secteur Local';
      this.placementData.citycode = this.deptCode;
    }
    this.updatePlacementCoords(this.placementData.lat, this.placementData.lng);

    // Restauration ou initialisation des pièces et du mobilier du bâtiment
    if (Array.isArray(savedRooms) && savedRooms.length > 0) {
      this.roomsConfig = savedRooms;
    } else {
      this.roomsConfig = [
        { id: 'room_1', name: 'Salle 1', type: 'libre', label: 'Libre', area: 19.3, icon: '🚪', color: '#131b2e' },
        { id: 'room_2', name: 'Salle 2', type: 'libre', label: 'Libre', area: 20.2, icon: '🚪', color: '#131b2e' },
        { id: 'room_3', name: 'Salle 3', type: 'libre', label: 'Libre', area: 45.1, icon: '🚪', color: '#131b2e' }
      ];
    }

    if (Array.isArray(savedFurniture)) {
      const MIGRATION_MAP = {
        f_bureau: 'bureau',
        f_pharmacie: 'armoire_pharmacie',
        f_formation: 'table_formation',
        f_mannequin: 'mannequin_rcp',
        f_foyer: 'canape_detente',
        f_lit: 'lit_garde',
        f_etagere: 'etagere_lots'
      };
      this.placedFurniture = savedFurniture.map(f => {
        const mig = MIGRATION_MAP[f.typeId] || MIGRATION_MAP[f.type];
        if (mig) {
          f.typeId = mig;
          f.type = mig;
        }
        return f;
      });
    } else {
      this.placedFurniture = [];
    }

    if (savedSelectedRoom) {
      this.selectedRoomId = savedSelectedRoom;
    } else {
      this.selectedRoomId = 'room_1';
    }

    if (savedFnpcSigned) {
      this.fnpcSigned = true;
      this.fnpcSignatureDataUrl = savedFnpcSigData;
    }

    let modal = document.getElementById('onboarding-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'onboarding-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto';
      document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.zIndex = '99999';

    this.renderWizard();

    // Si le joueur a rechargé la page directement à l'étape 2 ou 4, réactiver les moteurs correspondants
    if (this.currentStep === 2) {
      setTimeout(() => {
        this.initStep2Map();
      }, 150);
    } else if (this.currentStep === 3) {
      setTimeout(() => {
        this.initStep3PlanCanvas();
      }, 80);
    } else if (this.currentStep === 4) {
      setTimeout(() => {
        this.initStep4Signature();
      }, 120);
    }
  },

  setStep(step) {
    if (this.currentStep === 2 && step === 3) {
      if (this.placementValidation && !this.placementValidation.isValid) {
        if (this.game && typeof this.game.showToast === 'function') {
          this.game.showToast('Emplacement Non Valide ⛔', this.placementValidation.message || 'Veuillez positionner votre antenne à un endroit conforme.', 'red');
        }
        return;
      }
    }
    this.currentStep = Math.max(1, Math.min(4, step));
    this.saveProgress();
    this.renderWizard();

    // Initialisation réactive selon l'étape active
    if (this.currentStep === 2) {
      setTimeout(() => {
        this.initStep2Map();
      }, 150);
    } else if (this.currentStep === 3) {
      setTimeout(() => {
        this.initStep3PlanCanvas();
      }, 60);
    } else if (this.currentStep === 4) {
      setTimeout(() => {
        this.initStep4Signature();
      }, 120);
    }
  },

  // -------------------------------------------------------------
  // RENDU DU CONTENEUR GÉNÉRAL DU TUTO EN 4 ÉTAPES
  // -------------------------------------------------------------
  renderWizard() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    let contentHTML = '';
    if (this.currentStep === 1) contentHTML = this.renderStep1();
    else if (this.currentStep === 2) contentHTML = this.renderStep2();
    else if (this.currentStep === 3) contentHTML = this.renderStep3();
    else contentHTML = this.renderStep4();

    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-3xl p-5 sm:p-7 shadow-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 modal-fade-in space-y-5 max-h-[94vh] overflow-y-auto custom-scrollbar">
        <!-- Barre de progression des 4 étapes -->
        <div class="space-y-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
            <span>Tutoriel Fondateur • Protection Civile</span>
            <span class="text-pc-blue dark:text-blue-400 font-bold">Étape ${this.currentStep} sur 4</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <!-- Étape 1 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 1 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : (this.currentStep > 1 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-700')}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 1 ? 'bg-white text-pc-blue' : (this.currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300')}">
                ${this.currentStep > 1 ? '✓' : '1'}
              </span>
              <span class="text-[11px] font-bold truncate">Équipe de base</span>
            </div>

            <!-- Étape 2 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 2 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : (this.currentStep > 2 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-700')}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 2 ? 'bg-white text-pc-blue' : (this.currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300')}">
                ${this.currentStep > 2 ? '✓' : '2'}
              </span>
              <span class="text-[11px] font-bold truncate">Placement carte</span>
            </div>

            <!-- Étape 3 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 3 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : (this.currentStep > 3 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-700')}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 3 ? 'bg-white text-pc-blue' : (this.currentStep > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300')}">
                ${this.currentStep > 3 ? '✓' : '3'}
              </span>
              <span class="text-[11px] font-bold truncate">Aménagement local</span>
            </div>

            <!-- Étape 4 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 4 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-700'}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 4 ? 'bg-white text-pc-blue' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">
                4
              </span>
              <span class="text-[11px] font-bold truncate">Affiliation FNPC</span>
            </div>
          </div>
        </div>

        <!-- Contenu interactif de l'étape active -->
        <div>
          ${contentHTML}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    if (this.currentStep === 3) {
      setTimeout(() => {
        this.initStep3PlanCanvas();
      }, 40);
    }
    if (this.currentStep === 4 && !this.fnpcSigned) {
      setTimeout(() => {
        this.initStep4Signature();
      }, 80);
    }
  },

  // -------------------------------------------------------------
  // ÉTAPE 1 : PRÉSENTATION DE L'ÉQUIPE DE BASE & PERSONNALISATION
  // -------------------------------------------------------------
  renderStep1() {
    const avatarChoices = ['👨‍💼', '👩‍🚒', '🧑‍🚒', '🙋‍♂️', '👩', '👨‍🦱', '👩‍🦰', '🧔', '🧕', '👱‍♂️'];

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <img src="logo_myprotec.png" alt="MyProtec" class="h-12 object-contain drop-shadow mx-auto" />
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">1. Fondation de l'Antenne & Équipe de Base</h2>
          <p class="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            Définissez le nom de votre antenne, son département de rattachement et découvrez vos 5 bénévoles constitutifs.
          </p>
        </div>

        <!-- Encart de fondation : Nom de l'antenne & Choix du département -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-amber-50/70 dark:from-slate-800/90 dark:to-slate-800/70 border-2 border-pc-blue/30 dark:border-blue-500/40 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left shadow-xs">
          <div>
            <label class="block text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <span>🏢</span>
              <span>Nom officiel de votre Antenne</span>
            </label>
            <input 
              type="text" 
              id="onboarding-step1-station-name"
              value="${(this.teamName || '').replace(/"/g, '&quot;')}" 
              placeholder="Ex: Antenne de Nancy, Antenne Paris 15..."
              oninput="window.ProtecOnboarding.updateTeamName(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pc-blue/40 shadow-2xs"
            />
          </div>
          <div>
            <label class="block text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <span>📍</span>
              <span>Département d'Implantation</span>
            </label>
            <select 
              id="onboarding-step1-dept-select"
              onchange="window.ProtecOnboarding.changeDepartment(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pc-blue/40 cursor-pointer shadow-2xs">
              ${this.getDepartmentsList().map(d => `<option value="${d.code}" ${d.code === this.deptCode ? 'selected' : ''}>${d.code} - ${d.name} (${d.region})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- En-tête de section -->
        <div class="flex items-center justify-between px-1 pt-1">
          <span class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">Membres constitutifs (#1 à #5)</span>
        </div>

        <!-- Liste des 5 secouristes personnalisables -->
        <div class="space-y-2.5">
          ${this.volunteersList.map((vol, idx) => `
            <div class="p-3.5 rounded-2xl glass-card bg-white/95 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <!-- Avatar Bénévole Tenue Officielle Protection Civile (Orange #f78d20, Blanc, Bleu #024589) -->
                <div class="relative group">
                  <button type="button" onclick="window.ProtecOnboarding.toggleVolunteerGender('${vol.id}')" class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer shadow-xs overflow-hidden" title="Changer le modèle (Homme / Femme)">
                    ${this.renderVolunteerUniformAvatar(vol, 'w-11 h-11')}
                  </button>
                  <div class="hidden group-hover:flex absolute left-0 top-full mt-1 z-30 p-1 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 gap-1 items-center whitespace-nowrap">
                    <button type="button" onclick="window.ProtecOnboarding.setVolunteerGender('${vol.id}', 'h')" class="px-2 py-1 rounded-lg text-[10px] font-black ${vol.gender === 'h' ? 'bg-pc-blue text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'} transition cursor-pointer">
                      Modèle Homme
                    </button>
                    <button type="button" onclick="window.ProtecOnboarding.setVolunteerGender('${vol.id}', 'f')" class="px-2 py-1 rounded-lg text-[10px] font-black ${vol.gender === 'f' ? 'bg-pc-blue text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'} transition cursor-pointer">
                      Modèle Femme
                    </button>
                  </div>
                </div>

                <!-- Saisie du nom & rôle -->
                <div class="flex-1 space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      vol.rank === 'CE' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700' :
                      (vol.rank === 'PSE2' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700' : 'bg-slate-100 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600')
                    }">
                      ${vol.role} (${vol.rank})
                    </span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-400">#${idx + 1}</span>
                  </div>
                  <input 
                    type="text" 
                    value="${vol.name.replace(/"/g, '&quot;')}" 
                    oninput="window.ProtecOnboarding.updateVolunteerName('${vol.id}', this.value)"
                    placeholder="Prénom Nom" 
                    class="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue w-full max-w-[220px]"
                  />
                </div>
              </div>

              <!-- Compétences & Permis -->
              <div class="flex items-center gap-1.5 flex-wrap text-[10px]">
                ${(vol.skills || []).map(sk => `
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600 uppercase">
                    ${sk.replace('_', ' ')}
                  </span>
                `).join('')}
                <span class="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-800">
                  Motivation ${vol.motivation}%
                </span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Bouton Étape Suivante -->
        <div class="pt-2">
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(2)"
            class="w-full py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">
            <span>Valider l'équipe & Placer le bâtiment sur la carte</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;
  },

  updateVolunteerName(volId, newName) {
    const v = this.volunteersList.find(x => x.id === volId);
    if (v) {
      v.name = newName.trim() || 'Bénévole Secouriste';
      this.saveProgress();
    }
  },

  updateVolunteerAvatar(volId, newAvatar) {
    const v = this.volunteersList.find(x => x.id === volId);
    if (v) {
      v.avatar = newAvatar;
      this.saveProgress();
      this.renderWizard();
    }
  },

  // Rendu de l'avatar avec la tenue officielle Protection Civile (Orange #f78d20, Blanc, Bleu #024589)
  renderVolunteerUniformAvatar(vol, sizeClass = 'w-11 h-11') {
    if (window.game && typeof window.game.getVolunteerAvatarHTML === 'function') {
      return window.game.getVolunteerAvatarHTML(vol, sizeClass, true);
    }

    const cleanName = vol.name || 'Secouriste';
    const nameLower = cleanName.toLowerCase();
    const isFemale = (
      vol.gender === 'f' ||
      vol.gender === 'F' ||
      ['sarah', 'élodie', 'elodie', 'léa', 'lea', 'manon', 'chloé', 'chloe', 'inès', 'ines', 'pauline', 'océane', 'camille', 'sophie', 'marie', 'clara', 'emma'].some(fn => nameLower.includes(fn))
    );
    const clipId = 'onb-torso-' + Math.random().toString(36).slice(2, 9);

    if (isFemale) {
      return `
        <div class="${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 border border-slate-200/90 shadow-2xs transition overflow-hidden" title="${cleanName} (Protection Civile)">
          <svg viewBox="0 0 24 24" class="w-full h-full p-0.5" fill="none">
            <defs>
              <clipPath id="${clipId}">
                <path d="M 4 22 V 18 C 4 15.5 7.2 14 9.5 12.5 C 10 13.8 11 16.5 12 16.5 C 13 16.5 14 13.8 14.5 12.5 C 16.8 14 20 15.5 20 18 V 22 Z" />
              </clipPath>
            </defs>
            <!-- Torse Protection Civile triptyque officiel -->
            <g clip-path="url(#${clipId})">
              <rect x="2" y="12" width="20" height="5.8" fill="#f78d20" />
              <rect x="2" y="17.8" width="20" height="1.6" fill="#ffffff" />
              <rect x="2" y="19.4" width="20" height="3.6" fill="#024589" />
            </g>
            <path d="M 9.6 14.5 L 12 17.5 L 14.4 14.5" stroke="#334155" stroke-width="1.8" fill="#ffffff" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M 9.5 12.5 C 7.2 14 4 15.5 4 18 V 22" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />
            <path d="M 14.5 12.5 C 16.8 14 20 15.5 20 18 V 22" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />
            <path d="M 9.5 12.5 H 6.5 V 7.5 C 6.5 3.4 17.5 3.4 17.5 7.5 V 12.5 H 14.5" fill="#ffffff" stroke="#334155" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      `;
    } else {
      return `
        <div class="${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 border border-slate-200/90 shadow-2xs transition overflow-hidden" title="${cleanName} (Protection Civile)">
          <svg viewBox="0 0 24 24" class="w-full h-full p-0.5" fill="none">
            <defs>
              <clipPath id="${clipId}">
                <path d="M 4 22 V 18 C 4 15.5 7.2 14.5 9.2 14.2 C 9.8 14.2 10.2 15.8 12 15.8 C 13.8 15.8 14.2 14.2 14.8 14.2 C 16.8 14.5 20 15.5 20 18 V 22 Z" />
              </clipPath>
            </defs>
            <!-- Torse Protection Civile triptyque officiel -->
            <g clip-path="url(#${clipId})">
              <rect x="2" y="13" width="20" height="4.8" fill="#f78d20" />
              <rect x="2" y="17.8" width="20" height="1.6" fill="#ffffff" />
              <rect x="2" y="19.4" width="20" height="3.6" fill="#024589" />
            </g>
            <path d="M 9.8 14.2 C 9.8 16.4 14.2 16.4 14.2 14.2" stroke="#334155" stroke-width="1.8" fill="#ffffff" stroke-linecap="round" />
            <path d="M 4 22 V 18 C 4 15.5 7.2 14.5 9.2 14.2" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />
            <path d="M 14.8 14.2 C 16.8 14.5 20 15.5 20 18 V 22" stroke="#334155" stroke-width="1.8" stroke-linecap="round" />
            <path d="M 5.8 3.2 H 14.5 C 16.2 3.2 17.2 4.4 17.2 6.2 V 11 C 17.2 14.8 6.8 14.8 6.8 11 V 6.2 H 5.8 Z" fill="#ffffff" stroke="#334155" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      `;
    }
  },

  setVolunteerGender(volId, gender) {
    const v = this.volunteersList.find(x => x.id === volId);
    if (v) {
      v.gender = gender;
      this.renderWizard();
    }
  },

  toggleVolunteerGender(volId) {
    const v = this.volunteersList.find(x => x.id === volId);
    if (v) {
      const isFemale = v.gender === 'f' || (v.gender !== 'h' && ['sarah', 'élodie', 'elodie'].some(fn => v.name.toLowerCase().includes(fn)));
      v.gender = isFemale ? 'h' : 'f';
      this.renderWizard();
    }
  },

  // -------------------------------------------------------------
  // OUTILS GÉOGRAPHIQUES & GESTION DES CONTRAINTES D'IMPLANTATION
  // -------------------------------------------------------------
  normalizeCityName(str) {
    if (!str) return '';
    return String(str).toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/^ville\s+de\s+/i, '')
      .replace(/^commune\s+de\s+/i, '')
      .replace(/[^a-z0-9]/g, '');
  },

  async loadDepartementsGeoJSON() {
    if (this.cachedGeoJSON) return this.cachedGeoJSON;
    if (window._cachedDepartementsGeoJSON) {
      this.cachedGeoJSON = window._cachedDepartementsGeoJSON;
      return this.cachedGeoJSON;
    }
    try {
      // 1. Encapsulation asynchrone sécurisée (CORS, mode hors-ligne, protocole local file://)
      const res = await fetch('data/departements-version-simplifiee.geojson');
      if (res && res.ok) {
        const data = await res.json();
        this.cachedGeoJSON = data;
        window._cachedDepartementsGeoJSON = data;
        return data;
      } else {
        console.warn(`[GeoJSON] Réponse inattendue (HTTP ${res?.status}) pour data/departements-version-simplifiee.geojson.`);
      }
    } catch (e) {
      console.warn('[GeoJSON] Impossible de charger les contours départementaux (mode local ou hors-ligne) :', e?.message || e);
    }

    // 2. Notification discrète sans bloquer l'initialisation de l'application
    if (!this._geoJsonFallbackNotified) {
      this._geoJsonFallbackNotified = true;
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast(
          'Mode Hors-Ligne Cartographique 🗺️',
          'Les contours géographiques vectoriels n\'ont pas pu être chargés (accès local ou hors-ligne). La carte s\'initialise sur le secteur par défaut.',
          'amber',
          5000
        );
      }
    }

    return null;
  },

  isPointInPolygonRing(pt, ring) {
    let inside = false;
    const x = pt[0], y = pt[1];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  },

  isPointInDepartment(lat, lng, deptCode) {
    const code = String(deptCode).trim();
    if (this.cachedGeoJSON && this.cachedGeoJSON.features) {
      const feat = this.cachedGeoJSON.features.find(f => f.properties && f.properties.code === code);
      if (feat && feat.geometry) {
        const pt = [lng, lat]; // [x, y]
        const geom = feat.geometry;
        if (geom.type === 'Polygon') {
          if (!this.isPointInPolygonRing(pt, geom.coordinates[0])) return false;
          for (let k = 1; k < geom.coordinates.length; k++) {
            if (this.isPointInPolygonRing(pt, geom.coordinates[k])) return false;
          }
          return true;
        } else if (geom.type === 'MultiPolygon') {
          for (const poly of geom.coordinates) {
            if (this.isPointInPolygonRing(pt, poly[0])) {
              let inHole = false;
              for (let k = 1; k < poly.length; k++) {
                if (this.isPointInPolygonRing(pt, poly[k])) { inHole = true; break; }
              }
              if (!inHole) return true;
            }
          }
          return false;
        }
      }
    }

    // Fallback boîte englobante officielle
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(code) : null;
    if (deptInfo && deptInfo.bbox) {
      const [minLat, minLng, maxLat, maxLng] = deptInfo.bbox;
      return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    }
    return true;
  },

  async loadExistingStations() {
    let stations = [];
    if (window.ProtecSupabase && typeof window.ProtecSupabase.getAllianceStations === 'function') {
      try {
        const myId = (this.game?.player && this.game.player.id) || localStorage.getItem('protec_player_id');
        const list = await window.ProtecSupabase.getAllianceStations(myId);
        if (Array.isArray(list)) stations = list;
      } catch (e) {
        console.warn('Erreur chargement alliance_stations:', e);
      }
    }
    if ((!stations || stations.length === 0) && this.game && Array.isArray(this.game.stations)) {
      stations = this.game.stations.filter(s => s && !isNaN(s.lat) && !isNaN(s.lng));
    }
    this.existingAllianceStations = stations || [];
    return this.existingAllianceStations;
  },

  validateCandidateLocation(lat, lng, cityName) {
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    const deptName = deptInfo ? deptInfo.name : this.deptCode;
    const minKm = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('minStationDistanceKm', 20) : 20;

    // 1. Règle absolue : obligatoirement dans le département d'inscription
    const inDept = this.isPointInDepartment(lat, lng, this.deptCode);
    if (!inDept) {
      return {
        isValid: false,
        reason: 'outside_dept',
        message: `Emplacement hors limites : votre antenne doit être obligatoirement située à l'intérieur du département ${deptName} (${this.deptCode}).`,
        minDistance: minKm,
        nearestDist: null,
        nearestStationName: null
      };
    }

    // 2. Règle de distance minimale par rapport à toutes les antennes existantes
    let nearestDist = null;
    let nearestSt = null;

    if (Array.isArray(this.existingAllianceStations)) {
      for (const st of this.existingAllianceStations) {
        const stLat = parseFloat(st.lat);
        const stLng = parseFloat(st.lng);
        if (isNaN(stLat) || isNaN(stLng)) continue;

        const dist = window.ProtecDepartements 
          ? window.ProtecDepartements.calculateDistance(lat, lng, stLat, stLng)
          : 999;

        if (nearestDist === null || dist < nearestDist) {
          nearestDist = dist;
          nearestSt = st;
        }

        if (dist < minKm) {
          return {
            isValid: false,
            reason: 'too_close',
            station: st,
            distance: dist,
            minDistance: minKm,
            message: `Trop proche d'une antenne existante (« ${st.station_name || st.name || st.city} ») : distance mesurée à ${dist.toFixed(1)} km (minimum requis : ${minKm} km).`,
            nearestDist: dist,
            nearestStationName: st.station_name || st.name || st.city
          };
        }
      }
    }

    // 3. Règle d'exclusivité communale : pas dans la même ville
    const normCandCity = this.normalizeCityName(cityName);
    if (normCandCity && Array.isArray(this.existingAllianceStations)) {
      for (const st of this.existingAllianceStations) {
        const normStCity = this.normalizeCityName(st.city);
        if (normStCity && normStCity === normCandCity) {
          return {
            isValid: false,
            reason: 'same_city',
            station: st,
            cityName: cityName,
            minDistance: minKm,
            message: `La commune de « ${cityName} » dispose déjà d'une antenne de la Protection Civile (« ${st.station_name || st.name} »). Veuillez vous implanter dans une autre commune.`,
            nearestDist,
            nearestStationName: st.station_name || st.name || st.city
          };
        }
      }
    }

    return {
      isValid: true,
      message: 'Emplacement conforme aux règles territoriales d\'implantation.',
      nearestDist,
      nearestStationName: nearestSt ? (nearestSt.station_name || nearestSt.name || nearestSt.city) : null,
      minDistance: minKm
    };
  },

  renderExistingStationsOnMap() {
    if (!this.step2Map || !window.L) return;

    (this.exclusionCircles || []).forEach(c => {
      try { this.step2Map.removeLayer(c); } catch (e) {}
    });
    this.exclusionCircles = [];

    (this.existingStationMarkers || []).forEach(m => {
      try { this.step2Map.removeLayer(m); } catch (e) {}
    });
    this.existingStationMarkers = [];

    const minKm = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('minStationDistanceKm', 20) : 20;

    (this.existingAllianceStations || []).forEach(st => {
      const lat = parseFloat(st.lat);
      const lng = parseFloat(st.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      // Cercle d'exclusion
      const circle = L.circle([lat, lng], {
        radius: minKm * 1000,
        color: '#f43f5e',
        fillColor: '#fda4af',
        fillOpacity: 0.16,
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(this.step2Map);

      circle.bindTooltip(`Zone d'exclusion ${minKm} km — Antenne « ${st.station_name || st.name || st.city} »`, {
        direction: 'center',
        opacity: 0.95
      });
      this.exclusionCircles.push(circle);

      // Marqueur antenne réseau existante avec la même icône base_antenne.png et contour bleu
      const stMarkerIcon = L.divIcon({
        className: 'clean-marker',
        html: `
          <div class="custom-leaflet-marker" style="display:flex; align-items:center; justify-content:center;">
            <div class="marker-inner bg-white p-1 flex items-center justify-center transition-transform hover:scale-110" style="width:38px; height:38px; border-radius:50%; border:2.5px solid #024589; box-shadow:0 4px 12px rgba(2,69,137,0.3); background:white;">
              <img src="base_antenne.png" alt="Antenne Réseau" style="width:100%; height:100%; object-fit:contain;" />
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker([lat, lng], { icon: stMarkerIcon }).addTo(this.step2Map);
      const popupContent = `
        <div style="font-family:inherit; font-size:11px; line-height:1.4; padding:2px;">
          <div style="font-weight:900; color:#1e1b4b; font-size:12px;">${st.station_name || st.name || 'Antenne Protection Civile'}</div>
          <div style="color:#4338ca; font-weight:700;">📍 Commune : ${st.city || 'Secteur Local'}</div>
          <div style="color:#64748b; font-size:10px;">Responsable d'antenne : ${st.player_name || st.playerName || 'Responsable d’antenne'}</div>
          <div style="margin-top:4px; padding:2px 6px; background:#ffe4e6; color:#9f1239; border-radius:4px; font-weight:800; font-size:10px; text-align:center;">
            Zone d'exclusion : min. ${minKm} km
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      marker.bindTooltip(`Antenne existante : ${st.station_name || st.city}`, { direction: 'top', offset: [0, -18] });
      this.existingStationMarkers.push(marker);
    });
  },

  updateCandidateMarkerStyle(isValid) {
    if (!this.step2Marker) return;
    const borderColor = isValid ? '#f78d20' : '#e11d48';
    const ringColor = isValid ? 'rgba(247,141,32,0.45)' : 'rgba(225,29,72,0.45)';
    const tagBg = isValid ? '#f78d20' : '#e11d48';
    const tagText = isValid ? 'MOI' : '⚠️';

    const iconHtml = `
      <div class="custom-leaflet-marker" style="display:flex; align-items:center; justify-content:center;">
        <div class="marker-inner bg-white p-1 flex items-center justify-center transition-transform hover:scale-115" style="width:42px; height:42px; border-radius:50%; border:3px solid ${borderColor}; box-shadow:0 6px 16px ${ringColor}; position:relative; background:white;">
          <img src="base_antenne.png" alt="Mon Antenne" style="width:100%; height:100%; object-fit:contain;" />
          <div style="position:absolute; bottom:-3px; right:-3px; background:${tagBg}; color:white; font-size:9px; font-weight:900; padding:1px 4px; border-radius:9999px; border:1.5px solid white; box-shadow:0 1px 3px rgba(0,0,0,0.2);">${tagText}</div>
        </div>
      </div>
    `;
    this.step2Marker.setIcon(L.divIcon({
      className: 'clean-marker',
      html: iconHtml,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    }));
  },

  updateValidationUI(validation) {
    const cardEl = document.getElementById('step2-status-card');
    const validateBtn = document.getElementById('step2-validate-btn');
    const minKm = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('minStationDistanceKm', 20) : 20;

    this.updateCandidateMarkerStyle(validation.isValid);

    if (validateBtn) {
      if (validation.isValid) {
        validateBtn.disabled = false;
        validateBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        validateBtn.classList.add('bg-gradient-to-r', 'from-pc-blue', 'to-pc-blue-light', 'hover:brightness-110', 'shadow-lg');
      } else {
        validateBtn.disabled = true;
        validateBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        validateBtn.classList.remove('from-pc-blue', 'to-pc-blue-light', 'hover:brightness-110');
      }
    }

    if (!cardEl) return;

    if (validation.isValid) {
      const nearestInfo = (validation.nearestDist !== null && validation.nearestDist < 900)
        ? `• Antenne la plus proche : <strong>${validation.nearestStationName || 'Réseau'}</strong> à <strong>${validation.nearestDist.toFixed(1)} km</strong> (≥ ${minKm} km)`
        : `• Aucune antenne proche (< ${minKm} km)`;

      cardEl.className = 'p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/60 text-xs text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm transition-all';
      cardEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
            🏢
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-black text-slate-900 dark:text-white" id="step2-city-label">${this.placementData.city}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/80 dark:text-emerald-200 dark:border-emerald-500 shadow-2xs">
                ✓ Emplacement Autorisé
              </span>
            </div>
            <div class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
              Département <strong class="text-slate-900 dark:text-white">${this.deptCode}</strong> • <span class="font-mono text-slate-500 dark:text-slate-400" id="step2-coords-label">${this.placementData.lat.toFixed(4)}, ${this.placementData.lng.toFixed(4)}</span>
            </div>
            <div class="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
              ${nearestInfo}
            </div>
          </div>
        </div>

        <button 
          type="button" 
          onclick="window.ProtecOnboarding.resetMapPosition()"
          class="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap self-end sm:self-auto">
          🎯 Recentrer
        </button>
      `;
    } else {
      cardEl.className = 'p-3.5 rounded-2xl bg-rose-50/95 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-700/60 text-xs text-rose-950 dark:text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm transition-all';
      cardEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
            ⚠️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-black text-rose-900 dark:text-rose-100" id="step2-city-label">${this.placementData.city}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-900/80 dark:text-rose-200 dark:border-rose-500 shadow-2xs">
                ⛔ Non Conforme
              </span>
            </div>
            <div class="text-[11px] text-rose-800 dark:text-rose-300 font-bold mt-0.5">
              ${validation.message}
            </div>
            <div class="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
              Département <strong class="text-slate-900 dark:text-white">${this.deptCode}</strong> • <span class="font-mono text-slate-500 dark:text-slate-400" id="step2-coords-label">${this.placementData.lat.toFixed(4)}, ${this.placementData.lng.toFixed(4)}</span> (Cliquez sur une zone libre dans le département)
            </div>
          </div>
        </div>

        <button 
          type="button" 
          onclick="window.ProtecOnboarding.resetMapPosition()"
          class="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-800 dark:text-rose-200 font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap self-end sm:self-auto">
          🎯 Recentrer
        </button>
      `;
    }
  },

  // -------------------------------------------------------------
  // ÉTAPE 2 : PLACEMENT DU BÂTIMENT SUR LA CARTE
  // -------------------------------------------------------------
  renderStep2() {
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    const deptName = deptInfo ? deptInfo.name : this.deptCode;
    const minKm = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('minStationDistanceKm', 20) : 20;

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <span class="text-2xl">🗺️</span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">2. Placement de votre Bâtiment sur la Carte</h2>
          <p class="text-xs text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Définissez l'emplacement officiel de votre local d'antenne dans le département <strong>${deptName} (${this.deptCode})</strong>.
            Le bâtiment doit obligatoirement être situé dans le département, dans une commune libre, et à <strong>au moins ${minKm} km</strong> de toute autre antenne.
          </p>
        </div>

        <!-- Encart interactif de configuration de l'antenne & département -->
        <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div>
            <label class="block text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <span>🏢</span>
              <span>Nom officiel de l'antenne</span>
            </label>
            <input 
              type="text" 
              id="onboarding-step2-station-name"
              value="${(this.teamName || '').replace(/"/g, '&quot;')}" 
              placeholder="Ex: Antenne de Nancy, Antenne Paris 15..."
              oninput="window.ProtecOnboarding.updateTeamName(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pc-blue/40 shadow-2xs"
            />
          </div>
          <div>
            <label class="block text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <span>📍</span>
              <span>Département d'implantation</span>
            </label>
            <select 
              id="onboarding-step2-dept-select"
              onchange="window.ProtecOnboarding.changeDepartment(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-pc-blue/40 cursor-pointer shadow-2xs">
              ${this.getDepartmentsList().map(d => `<option value="${d.code}" ${d.code === this.deptCode ? 'selected' : ''}>${d.code} - ${d.name} (${d.region})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Légende opérationnelle de la carte -->
        <div class="flex items-center justify-between flex-wrap gap-2 px-1 text-[11px]">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <span class="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
              Votre Antenne
            </span>
            <span class="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-400">
              <span class="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              Antennes Existantes
            </span>
            <span class="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
              <span class="w-3 h-3 rounded-full bg-rose-200 dark:bg-rose-950 border border-rose-500 inline-block"></span>
              Exclusion (${minKm} km)
            </span>
          </div>
          <span class="text-slate-500 dark:text-slate-400 font-medium">L'extérieur du département est verrouillé et grisé</span>
        </div>

        <!-- Cadre de la carte Leaflet interactive -->
        <div class="relative w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-md">
          <div id="step2-onboarding-map" class="w-full h-full"></div>
          
          <div class="absolute top-2.5 left-2.5 z-[1000] px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm flex items-center gap-1.5 pointer-events-none">
            <span class="text-pc-orange">📍</span>
            <span>Cliquez sur la carte ou déplacez le marqueur dans le département</span>
          </div>
        </div>

        <!-- Récapitulatif dynamique de l'emplacement et conformité -->
        <div id="step2-status-card" class="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-pc-blue text-white font-black text-base flex items-center justify-center shadow-xs">
              🏢
            </div>
            <div>
              <div class="text-sm font-black text-slate-900 dark:text-white" id="step2-city-label">${this.placementData.city}</div>
              <div class="text-[11px] text-slate-600 dark:text-slate-300">
                Département ${this.deptCode} • <span class="font-mono text-slate-500 dark:text-slate-400" id="step2-coords-label">${this.placementData.lat.toFixed(4)}, ${this.placementData.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onclick="window.ProtecOnboarding.resetMapPosition()"
            class="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap">
            🎯 Recentrer la carte
          </button>
        </div>

        <!-- Boutons de navigation -->
        <div class="pt-2 flex items-center justify-between gap-3">
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(1)"
            class="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-700 transition cursor-pointer">
            ⬅ Retour
          </button>
          <button 
            type="button" 
            id="step2-validate-btn"
            onclick="window.ProtecOnboarding.setStep(3)"
            class="flex-1 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">
            <span>Valider l'emplacement & Aménager le bâtiment</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;
  },

  async initStep2Map() {
    const mapEl = document.getElementById('step2-onboarding-map');
    if (!mapEl || !window.L) return;

    if (this.step2Map) {
      this.step2Map.remove();
      this.step2Map = null;
    }

    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    const initialLat = this.placementData.lat || (deptInfo ? deptInfo.lat : 48.8566);
    const initialLng = this.placementData.lng || (deptInfo ? deptInfo.lng : 2.3522);
    const initialZoom = deptInfo ? (deptInfo.zoom || 10) : 10;

    this.step2Map = L.map('step2-onboarding-map', {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.step2Map);

    // 1. Chargement du GeoJSON et des antennes existantes
    const [geojsonData, existingStations] = await Promise.all([
      this.loadDepartementsGeoJSON(),
      this.loadExistingStations()
    ]);
    this.geojsonData = geojsonData;
    this.existingAllianceStations = existingStations;

    // 1.1 Contrôle anti-collision territorial : Si la préfecture/chef-lieu est déjà occupée par un autre joueur
    const minKm = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('minStationDistanceKm', 20) : 20;
    const isCollidingWithOtherStation = (lat, lng) => {
      if (!this.existingAllianceStations || this.existingAllianceStations.length === 0) return false;
      return this.existingAllianceStations.some(st => {
        const stLat = parseFloat(st.lat);
        const stLng = parseFloat(st.lng);
        if (isNaN(stLat) || isNaN(stLng)) return false;
        const dist = window.ProtecDepartements ? window.ProtecDepartements.calculateDistance(lat, lng, stLat, stLng) : 999;
        return dist < minKm;
      });
    };

    let safeLat = initialLat;
    let safeLng = initialLng;

    if (isCollidingWithOtherStation(safeLat, safeLng)) {
      // Trouver automatiquement un point conforme et libre dans le département
      let foundSafe = false;
      const stepDelta = 0.08; // ~8-9 km par pas
      for (let r = 1; r <= 8 && !foundSafe; r++) {
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];
        for (const angle of angles) {
          const rad = angle * Math.PI / 180;
          const candLat = initialLat + (r * stepDelta * Math.cos(rad));
          const candLng = initialLng + (r * stepDelta * Math.sin(rad) * 1.35);
          if (this.isPointInDepartment(candLat, candLng, this.deptCode) && !isCollidingWithOtherStation(candLat, candLng)) {
            safeLat = candLat;
            safeLng = candLng;
            foundSafe = true;
            break;
          }
        }
      }
      this.placementData.lat = safeLat;
      this.placementData.lng = safeLng;
      try {
        localStorage.setItem('protec_onboarding_placement', JSON.stringify(this.placementData));
      } catch (e) {}
    }

    // 2. Application du masque inversé (extérieur du département grisé) et du contour départemental
    if (geojsonData && geojsonData.features) {
      const code = String(this.deptCode).trim();
      const feat = geojsonData.features.find(f => f.properties && f.properties.code === code);
      if (feat && feat.geometry) {
        const worldOuter = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
        const holes = [];
        const geom = feat.geometry;
        if (geom.type === 'Polygon') {
          holes.push(geom.coordinates[0].map(([lng, lat]) => [lat, lng]));
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(poly => {
            holes.push(poly[0].map(([lng, lat]) => [lat, lng]));
          });
        }

        // Masque sombre inversé recouvrant la carte sauf le département
        this.maskLayer = L.polygon([worldOuter, ...holes], {
          color: '#090d16',
          fillColor: '#090d16',
          fillOpacity: 0.62,
          weight: 0,
          interactive: false
        }).addTo(this.step2Map);

        // Contour net du département sélectionné
        this.deptBorderLayer = L.geoJSON(feat, {
          style: {
            color: '#024589',
            weight: 3.5,
            fillColor: '#024589',
            fillOpacity: 0.04,
            dashArray: '3, 6',
            lineCap: 'round',
            interactive: false
          }
        }).addTo(this.step2Map);

        try {
          const b = this.deptBorderLayer.getBounds();
          this.step2Map.fitBounds(b, { padding: [20, 20] });
          this.step2Map.setMaxBounds(b.pad(0.40));
          this.step2Map.setMinZoom(Math.max(6, this.step2Map.getZoom() - 2));
        } catch (e) {}
      }
    }

    // Fallback de centrage si les contours GeoJSON sont indisponibles (mode hors-ligne, file://)
    if (!this.deptBorderLayer && this.step2Map) {
      const fallbackLat = this.placementData?.lat || (deptInfo ? deptInfo.lat : 48.6921); // Meurthe-et-Moselle (54) par défaut
      const fallbackLng = this.placementData?.lng || (deptInfo ? deptInfo.lng : 6.1844);
      try {
        this.step2Map.setView([fallbackLat, fallbackLng], deptInfo?.zoom || 10);
      } catch (e) {}
    }

    // 3. Affichage des antennes existantes et de leurs cercles d'exclusion (20 km)
    this.renderExistingStationsOnMap();

    // 4. Marqueur interactif de l'antenne candidate du joueur
    const markerIcon = L.divIcon({
      className: 'clean-marker',
      html: `
        <div class="custom-leaflet-marker" style="display:flex; align-items:center; justify-content:center;">
          <div class="marker-inner bg-white p-1 flex items-center justify-center transition-transform hover:scale-115" style="width:42px; height:42px; border-radius:50%; border:3px solid #f78d20; box-shadow:0 6px 16px rgba(247,141,32,0.45); position:relative; background:white;">
            <img src="base_antenne.png" alt="Mon Antenne" style="width:100%; height:100%; object-fit:contain;" />
            <div style="position:absolute; bottom:-3px; right:-3px; background:#f78d20; color:white; font-size:9px; font-weight:900; padding:1px 4px; border-radius:9999px; border:1.5px solid white; box-shadow:0 1px 3px rgba(0,0,0,0.2);">MOI</div>
          </div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    this.step2Marker = L.marker([safeLat, safeLng], { 
      icon: markerIcon, 
      draggable: true,
      zIndexOffset: 1000 
    }).addTo(this.step2Map);

    this.lastValidPosition = { lat: safeLat, lng: safeLng };
    if (this.step2Map && (safeLat !== initialLat || safeLng !== initialLng)) {
      this.step2Map.setView([safeLat, safeLng], this.step2Map.getZoom());
    }

    // Gestion du drag du marqueur
    this.step2Marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      const inDept = this.isPointInDepartment(pos.lat, pos.lng, this.deptCode);
      if (!inDept) {
        if (this.game?.showToast) {
          this.game.showToast('Zone non autorisée ⛔', `Vous devez placer votre antenne dans votre département (${this.deptCode}).`, 'red');
        }
        if (this.lastValidPosition) {
          this.step2Marker.setLatLng([this.lastValidPosition.lat, this.lastValidPosition.lng]);
          this.updatePlacementCoords(this.lastValidPosition.lat, this.lastValidPosition.lng);
        }
        return;
      }
      this.updatePlacementCoords(pos.lat, pos.lng);
    });

    // Gestion du clic sur la carte
    this.step2Map.on('click', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const inDept = this.isPointInDepartment(lat, lng, this.deptCode);
      if (!inDept) {
        if (this.game?.showToast) {
          this.game.showToast('Zone non autorisée ⛔', `Vous devez placer votre antenne dans le département sélectionné (${this.deptCode}).`, 'red');
        }
        return;
      }
      this.step2Marker.setLatLng(e.latlng);
      this.updatePlacementCoords(lat, lng);
    });

    setTimeout(() => {
      if (this.step2Map) this.step2Map.invalidateSize();
    }, 200);

    // Lancer la première vérification
    this.updatePlacementCoords(safeLat, safeLng);
  },

  async updatePlacementCoords(lat, lng) {
    this.placementData.lat = lat;
    this.placementData.lng = lng;

    const coordsEl = document.getElementById('step2-coords-label');
    if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    let detectedCity = this.placementData.city || 'Commune Locale';

    // 1. Détection de la commune via API Adresse Gouv
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const c = props.city || props.town || props.village || props.municipality || props.district || props.name;
        if (c) detectedCity = c;
      }
    } catch (e) {
      // 2. Fallback Nominatim OSM
      try {
        const res2 = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
        const data2 = await res2.json();
        const addr = data2.address || {};
        const c2 = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.county;
        if (c2) detectedCity = c2;
      } catch (e2) {}
    }

    // 3. Fallback interne si indisponible
    if ((!detectedCity || detectedCity === 'Commune Locale') && window.ProtecDepartements && typeof window.ProtecDepartements.getNearestCommune === 'function') {
      const nearest = window.ProtecDepartements.getNearestCommune(lat, lng, this.deptCode);
      if (nearest && nearest.nom) detectedCity = nearest.nom;
    }

    this.placementData.city = detectedCity;
    const cityEl = document.getElementById('step2-city-label');
    if (cityEl) cityEl.textContent = detectedCity;

    // 4. Validation stricte des critères d'implantation (Département, 20km, même commune)
    const validation = this.validateCandidateLocation(lat, lng, detectedCity);
    this.placementValidation = validation;

    if (validation.isValid) {
      this.lastValidPosition = { lat, lng };
    }

    this.updateValidationUI(validation);
    this.saveProgress();
  },

  getDepartmentsList() {
    if (window.ProtecAuth && typeof window.ProtecAuth.getDepartementsList === 'function') {
      const l = window.ProtecAuth.getDepartementsList();
      if (Array.isArray(l) && l.length > 0) return l;
    }
    if (window.ProtecDepartements && Array.isArray(window.ProtecDepartements.list) && window.ProtecDepartements.list.length > 0) {
      return window.ProtecDepartements.list;
    }
    if (window.ProtecDepartements && Array.isArray(window.ProtecDepartements.DEPARTEMENTS_DATA) && window.ProtecDepartements.DEPARTEMENTS_DATA.length > 0) {
      return window.ProtecDepartements.DEPARTEMENTS_DATA;
    }
    return [
      { code: '01', name: 'Ain', region: 'Auvergne-Rhône-Alpes' },
      { code: '13', name: 'Bouches-du-Rhône', region: 'PACA' },
      { code: '33', name: 'Gironde', region: 'Nouvelle-Aquitaine' },
      { code: '54', name: 'Meurthe-et-Moselle', region: 'Grand Est' },
      { code: '59', name: 'Nord', region: 'Hauts-de-France' },
      { code: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
      { code: '75', name: 'Paris', region: 'Île-de-France' }
    ];
  },

  updateTeamName(newName) {
    this.teamName = (newName || '').trim();
    if (this.game?.player) this.game.player.stationName = this.teamName;
    try {
      if (this.teamName) {
        localStorage.setItem('protec_station_name', this.teamName);
      } else {
        localStorage.removeItem('protec_station_name');
      }
    } catch (e) {}

    // Synchronisation en direct des champs dans les étapes 1 et 2 s'ils sont affichés
    const inp1 = document.getElementById('onboarding-step1-station-name');
    if (inp1 && inp1.value !== this.teamName) inp1.value = this.teamName;
    const inp2 = document.getElementById('onboarding-step2-station-name');
    if (inp2 && inp2.value !== this.teamName) inp2.value = this.teamName;
  },

  async changeDepartment(newDeptCode) {
    if (!newDeptCode) return;
    this.deptCode = String(newDeptCode).trim();
    if (this.game?.player) this.game.player.departmentCode = this.deptCode;
    if (this.game) this.game.currentDepartmentCode = this.deptCode;
    try {
      localStorage.setItem('protec_department_code', this.deptCode);
    } catch (e) {}

    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    const defaultCity = deptInfo ? (deptInfo.chefLieu || deptInfo.name) : 'Locale';

    // Si le nom était par défaut, suggérer le chef-lieu du nouveau département
    if (!this.teamName || this.teamName === 'Antenne Protection Civile' || this.teamName.startsWith('Antenne de ')) {
      this.teamName = `Antenne de ${defaultCity}`;
      this.updateTeamName(this.teamName);
    }

    // Coordonnées de base du nouveau département
    let targetLat = deptInfo ? deptInfo.lat : 48.75;
    let targetLng = deptInfo ? deptInfo.lng : 6.15;
    let targetCity = defaultCity;

    // Contrôle territorial anti-collision : trouver une commune libre dans ce nouveau département
    const minKm = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('minStationDistanceKm', 20) : 20;
    if (Array.isArray(this.existingAllianceStations) && this.existingAllianceStations.length > 0) {
      const isChefLieuOccupied = this.existingAllianceStations.some(st => {
        const stLat = parseFloat(st.lat);
        const stLng = parseFloat(st.lng);
        if (isNaN(stLat) || isNaN(stLng)) return false;
        const dist = window.ProtecDepartements ? window.ProtecDepartements.calculateDistance(targetLat, targetLng, stLat, stLng) : 999;
        return dist < minKm;
      });

      if (isChefLieuOccupied && deptInfo && Array.isArray(deptInfo.communes)) {
        for (const comm of deptInfo.communes) {
          if (comm.lat && comm.lng) {
            const hasConflict = this.existingAllianceStations.some(st => {
              const stLat = parseFloat(st.lat);
              const stLng = parseFloat(st.lng);
              if (isNaN(stLat) || isNaN(stLng)) return false;
              const dist = window.ProtecDepartements ? window.ProtecDepartements.calculateDistance(comm.lat, comm.lng, stLat, stLng) : 999;
              return dist < minKm;
            });
            if (!hasConflict) {
              targetLat = comm.lat;
              targetLng = comm.lng;
              targetCity = comm.name;
              break;
            }
          }
        }
      }
    }

    this.placementData.lat = targetLat;
    this.placementData.lng = targetLng;
    this.placementData.city = targetCity;
    this.placementData.citycode = this.deptCode;
    try {
      localStorage.setItem('protec_onboarding_placement', JSON.stringify(this.placementData));
    } catch (e) {}

    // Synchronisation des sélecteurs dans le DOM
    const s1 = document.getElementById('onboarding-step1-dept-select');
    if (s1 && s1.value !== this.deptCode) s1.value = this.deptCode;
    const s2 = document.getElementById('onboarding-step2-dept-select');
    if (s2 && s2.value !== this.deptCode) s2.value = this.deptCode;

    // Si on est à l'étape 2 et que la carte est active, déplacer et recharger les calques
    if (this.currentStep === 2 && this.step2Map) {
      const targetZoom = deptInfo ? (deptInfo.zoom || 10) : 10;
      this.step2Map.setView([targetLat, targetLng], targetZoom);
      if (this.step2Marker) {
        this.step2Marker.setLatLng([targetLat, targetLng]);
      }
      this.lastValidPosition = { lat: targetLat, lng: targetLng };
      this.updatePlacementCoords(targetLat, targetLng);

      // Recharger le masque inversé et le contour du nouveau département
      if (this.maskLayer) {
        this.step2Map.removeLayer(this.maskLayer);
        this.maskLayer = null;
      }
      if (this.deptBorderLayer) {
        this.step2Map.removeLayer(this.deptBorderLayer);
        this.deptBorderLayer = null;
      }

      if (this.geojsonData && this.geojsonData.features) {
        const feat = this.geojsonData.features.find(f => f.properties && f.properties.code === this.deptCode);
        if (feat && feat.geometry) {
          const worldOuter = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
          const holes = [];
          const geom = feat.geometry;
          if (geom.type === 'Polygon') {
            holes.push(geom.coordinates[0].map(([lng, lat]) => [lat, lng]));
          } else if (geom.type === 'MultiPolygon') {
            geom.coordinates.forEach(poly => {
              holes.push(poly[0].map(([lng, lat]) => [lat, lng]));
            });
          }

          this.maskLayer = L.polygon([worldOuter, ...holes], {
            color: '#090d16',
            fillColor: '#090d16',
            fillOpacity: 0.62,
            weight: 0,
            interactive: false
          }).addTo(this.step2Map);

          this.deptBorderLayer = L.geoJSON(feat, {
            style: {
              color: '#024589',
              weight: 3.5,
              fillColor: '#024589',
              fillOpacity: 0.04,
              dashArray: '3, 6',
              lineCap: 'round',
              interactive: false
            }
          }).addTo(this.step2Map);

          try {
            const b = this.deptBorderLayer.getBounds();
            this.step2Map.fitBounds(b, { padding: [20, 20] });
            this.step2Map.setMaxBounds(b.pad(0.40));
          } catch (e) {}
        }
      }

      const validation = await this.validatePlacement(targetLat, targetLng);
      this.placementValidation = validation;
      this.updateValidationUI(validation);
    }
  },

  resetMapPosition() {
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    if (!deptInfo) return;

    let targetLat = deptInfo.lat;
    let targetLng = deptInfo.lng;
    let targetCity = deptInfo.chefLieu || deptInfo.name;

    // Contrôle territorial anti-collision lors du recentrage
    const minKm = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('minStationDistanceKm', 20) : 20;
    if (Array.isArray(this.existingAllianceStations) && this.existingAllianceStations.length > 0) {
      const isChefLieuOccupied = this.existingAllianceStations.some(st => {
        const stLat = parseFloat(st.lat);
        const stLng = parseFloat(st.lng);
        if (isNaN(stLat) || isNaN(stLng)) return false;
        const dist = window.ProtecDepartements ? window.ProtecDepartements.calculateDistance(targetLat, targetLng, stLat, stLng) : 999;
        return dist < minKm;
      });

      if (isChefLieuOccupied && deptInfo && Array.isArray(deptInfo.communes)) {
        for (const comm of deptInfo.communes) {
          if (comm.lat && comm.lng) {
            const hasConflict = this.existingAllianceStations.some(st => {
              const stLat = parseFloat(st.lat);
              const stLng = parseFloat(st.lng);
              if (isNaN(stLat) || isNaN(stLng)) return false;
              const dist = window.ProtecDepartements ? window.ProtecDepartements.calculateDistance(comm.lat, comm.lng, stLat, stLng) : 999;
              return dist < minKm;
            });
            if (!hasConflict) {
              targetLat = comm.lat;
              targetLng = comm.lng;
              targetCity = comm.name;
              break;
            }
          }
        }
      }
    }

    this.placementData.lat = targetLat;
    this.placementData.lng = targetLng;
    this.placementData.city = targetCity;

    if (this.step2Map && this.step2Marker) {
      this.step2Map.setView([targetLat, targetLng], deptInfo.zoom || 10);
      this.step2Marker.setLatLng([targetLat, targetLng]);
    }
    const coordsEl = document.getElementById('step2-coords-label');
    if (coordsEl) coordsEl.textContent = `${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}`;
    this.updatePlacementCoords(targetLat, targetLng);
  },

  // -------------------------------------------------------------
  // ÉTAPE 3 : AMÉNAGEMENT DU BÂTIMENT (PLAN 2D VIVANT & OUTILS D'AGENCEMENT)
  // -------------------------------------------------------------
  renderStep3() {
    const currentMoney = 40000 - this.placedFurniture.reduce((sum, f) => sum + (f.cost || 0), 0);
    const activeRoom = this.roomsConfig.find(r => r.id === this.selectedRoomId) || this.roomsConfig[0];
    const activeRoomFurniture = this.placedFurniture.filter(f => f.room === activeRoom.id);

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <span class="text-2xl">🛋️</span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">3. Aménagement de votre Bâtiment d'Antenne</h2>
          <p class="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            Votre caserne est livrée vide. <strong>Définissez la fonction de chaque salle</strong> et <strong>installez votre mobilier</strong> selon vos priorités opérationnelles !
          </p>
        </div>

        <!-- Dotation municipale & Compteur d'équipement -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-cyan-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between text-xs shadow-xs">
          <div>
            <span class="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider block">Dotation Municipale Disponible</span>
            <div class="text-lg font-black text-emerald-950 dark:text-emerald-100 font-mono">${currentMoney.toLocaleString('fr-FR')} €</div>
          </div>
          <span class="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold text-xs shadow-2xs">
            ${this.placedFurniture.length} meuble(s) installé(s) au total
          </span>
        </div>

        <!-- PLAN 2D DU BÂTIMENT VIVANT (HAUTE DÉFINITION & CLIQUABLE) -->
        ${this.renderStep3Plan2D()}

        <!-- GESTION DE LA SALLE SÉLECTIONNÉE (AFFECTATION & MEUBLES EN PLACE) -->
        <div class="p-4 rounded-2xl bg-slate-900 border-2 border-amber-400/80 shadow-md text-white space-y-3.5">
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black uppercase text-amber-400 flex items-center gap-1">
                <span>📍 Salle Active :</span>
              </span>
              <div class="flex gap-1.5">
                ${this.roomsConfig.map(r => `
                  <button type="button" onclick="window.ProtecOnboarding.selectRoom('${r.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${this.selectedRoomId === r.id ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                    <span>${r.icon}</span>
                    <span>${r.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            <div class="text-[11px] text-slate-300 font-semibold">
              Surface : <strong class="text-white">${activeRoom.area} m²</strong> • <strong class="text-amber-300">${activeRoomFurniture.length} meuble(s)</strong> dans cette pièce
            </div>
          </div>

          <!-- Choix du Type / Affectation de la Salle -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-black uppercase tracking-wider text-slate-400">
                1. Affectation / Type de la ${activeRoom.name} :
              </label>
              <span class="text-[10px] text-amber-400 font-bold">Actuel : ${activeRoom.icon} ${activeRoom.label}</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${this.roomTypesList.map(t => {
                const isSelected = activeRoom.type === t.id;
                return `
                  <button type="button" onclick="window.ProtecOnboarding.setRoomType('${activeRoom.id}', '${t.id}')" class="p-2 rounded-xl text-left border transition cursor-pointer flex items-center gap-2 ${isSelected ? 'bg-amber-400/20 border-amber-400 text-white ring-1 ring-amber-400' : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'}">
                    <span class="text-lg flex-shrink-0">${t.icon}</span>
                    <div class="min-w-0 flex-1">
                      <div class="text-xs font-black truncate ${isSelected ? 'text-amber-300' : 'text-white'}">${t.label}</div>
                      <div class="text-[9px] text-slate-400 truncate">${t.desc}</div>
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Meubles actuellement installés dans cette salle -->
          <div class="pt-2 border-t border-slate-800 space-y-2">
            <span class="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              2. Mobilier en place dans la ${activeRoom.name} (${activeRoomFurniture.length}) :
            </span>
            ${activeRoomFurniture.length === 0 ? `
              <p class="text-xs text-slate-500 italic p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
                Cette salle est actuellement vide. Choisissez ci-dessous le mobilier à y installer !
              </p>
            ` : `
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${activeRoomFurniture.map(f => `
                  <div class="p-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-2 text-xs">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-lg flex-shrink-0">${f.icon}</span>
                      <span class="font-bold text-white truncate">${f.name}</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <!-- Déplacer vers une autre salle -->
                      <select onchange="window.ProtecOnboarding.moveFurniture('${f.id}', this.value)" class="text-[10px] py-1 px-1.5 rounded-lg bg-slate-900 border border-slate-600 text-slate-300 font-semibold cursor-pointer" title="Déplacer vers une autre salle">
                        <option value="room_1" ${f.room === 'room_1' ? 'selected' : ''}>Salle 1</option>
                        <option value="room_2" ${f.room === 'room_2' ? 'selected' : ''}>Salle 2</option>
                        <option value="room_3" ${f.room === 'room_3' ? 'selected' : ''}>Salle 3</option>
                      </select>
                      <!-- Retirer -->
                      <button type="button" onclick="window.ProtecOnboarding.removeFurniture('${f.id}')" class="px-2 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-900 text-rose-300 text-[10px] font-bold border border-rose-700/50 transition cursor-pointer" title="Retirer et rembourser">
                        ✕ Retirer
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- CATALOGUE D'ACHAT DE MOBILIER OPÉRATIONNEL -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">3. Catalogue de Mobilier • Installer dans ${activeRoom.name}</span>
            <span class="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Les meubles s'installent dans la pièce active</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${this.furnitureCatalog.map(item => {
              const totalCount = this.placedFurniture.filter(f => (f.typeId === item.id || f.type === item.id)).length;
              return `
                <div class="p-3 rounded-2xl glass-card bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-2.5 hover:border-amber-300 dark:hover:border-amber-400 transition">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-2xl flex-shrink-0">${item.icon}</span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <h4 class="text-xs font-black text-slate-900 dark:text-white truncate">${item.name}</h4>
                        ${item.bonus ? `<span class="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.2 rounded-md">${item.bonus}</span>` : ''}
                      </div>
                      <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${item.desc}</p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[10px] font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-1.5 py-0.2 rounded">${item.cost} €</span>
                        <span class="text-[9.5px] font-mono text-slate-400">${item.w}m × ${item.d}m</span>
                        ${totalCount > 0 ? `<span class="text-[9px] font-black text-pc-blue dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 rounded">${totalCount} en place</span>` : ''}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <button 
                      type="button" 
                      onclick="window.ProtecOnboarding.buyAndPlaceFurniture('${item.id}', '${activeRoom.id}')"
                      class="px-3 py-2 rounded-xl bg-pc-blue hover:bg-blue-600 text-white font-black text-xs transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1">
                      <span>+ Installer</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Boutons de navigation -->
        <div class="pt-2 flex items-center justify-between gap-3">
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(2)"
            class="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-700 transition cursor-pointer">
            ⬅ Retour
          </button>
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(4)"
            class="flex-1 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">
            <span>Valider l'aménagement & Signer l'affiliation FNPC</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;
  },

  selectRoom(roomId) {
    this.selectedRoomId = roomId;
    this.saveProgress();
    this.renderWizard();
  },

  setRoomType(roomId, newTypeId) {
    const r = this.roomsConfig.find(x => x.id === roomId);
    const t = this.roomTypesList.find(x => x.id === newTypeId);
    if (r && t) {
      r.type = t.id;
      r.label = t.label;
      r.icon = t.icon;
      r.color = t.color;
      const modelRoom = (this.architectureModel.rooms || []).find(x => x.id === roomId);
      if (modelRoom) {
        modelRoom.type = t.id;
        modelRoom.name = `${r.name} (${t.label})`;
      }
      this.saveProgress();
      this.renderWizard();
    }
  },

  buyAndPlaceFurniture(typeId, targetRoomId = null) {
    const item = this.furnitureCatalog.find(x => x.id === typeId || x.type === typeId);
    if (!item) return;

    const currentMoney = 40000 - this.placedFurniture.reduce((sum, f) => sum + (f.cost || 0), 0);
    if (currentMoney < item.cost) {
      if (window.ProtecDialog) {
        window.ProtecDialog.alert("Dotation municipale insuffisante pour acheter ce meuble !", "Fonds Insuffisants");
      }
      return;
    }

    const roomId = targetRoomId || this.selectedRoomId || 'room_1';
    const room = this.architectureModel.rooms.find(r => r.id === roomId) || this.architectureModel.rooms[0];

    const roomFurniture = this.placedFurniture.filter(f => f.room === roomId);
    const slotIdx = roomFurniture.length;
    const cols = Math.max(2, Math.floor((room.w - 0.8) / 1.6));
    const col = slotIdx % cols;
    const row = Math.floor(slotIdx / cols);
    const posX = room.x + 0.6 + col * 1.5;
    const posY = room.y + 0.7 + row * 1.4;

    this.placedFurniture.push({
      id: `furn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      typeId: item.type || item.id,
      type: item.type || item.id,
      name: item.name,
      cost: item.cost,
      icon: item.icon,
      room: roomId,
      x: posX,
      y: posY,
      w: item.w || 1.2,
      d: item.d || 0.8,
      color: item.color || '#475569'
    });

    this.saveProgress();
    this.renderWizard();
  },

  moveFurniture(furnId, newRoomId) {
    const f = this.placedFurniture.find(x => x.id === furnId);
    if (f) {
      f.room = newRoomId;
      const room = this.architectureModel.rooms.find(r => r.id === newRoomId) || this.architectureModel.rooms[0];
      const roomFurniture = this.placedFurniture.filter(x => x.room === newRoomId);
      const slotIdx = roomFurniture.indexOf(f);
      const cols = Math.max(2, Math.floor((room.w - 0.8) / 1.6));
      const col = (slotIdx >= 0 ? slotIdx : 0) % cols;
      const row = Math.floor((slotIdx >= 0 ? slotIdx : 0) / cols);
      f.x = room.x + 0.6 + col * 1.5;
      f.y = room.y + 0.7 + row * 1.4;
      this.saveProgress();
      this.renderWizard();
    }
  },

  removeFurniture(furnId) {
    const idx = this.placedFurniture.findIndex(x => x.id === furnId || x.typeId === furnId);
    if (idx !== -1) {
      this.placedFurniture.splice(idx, 1);
      this.saveProgress();
      this.renderWizard();
    }
  },

  // -------------------------------------------------------------
  // RENDU DU PLAN 2D VIVANT (CANVAS HAUTE DÉFINITION TYPE LOCAUX.JS)
  // -------------------------------------------------------------
  renderStep3Plan2D() {
    return `
      <div class="relative w-full rounded-3xl bg-[#0a0e17] border-2 border-slate-700/80 shadow-2xl overflow-hidden select-none">
        <!-- Barre d'outils supérieure du Plan 2D -->
        <div class="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 text-xs">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <span>📐</span> Plan 2D Vivant
            </span>
            <span class="text-[11px] text-slate-300 font-bold hidden sm:inline">
              Cliquez sur une salle pour la sélectionner et l'aménager
            </span>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="window.ProtecOnboarding.zoomPlan(1.2)" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center transition cursor-pointer" title="Zoom avant">+</button>
            <button type="button" onclick="window.ProtecOnboarding.zoomPlan(0.8)" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center transition cursor-pointer" title="Zoom arrière">−</button>
            <button type="button" onclick="window.ProtecOnboarding.resetPlanView()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer" title="Recentrer">
              <span>🎯</span> Recentrer
            </button>
          </div>
        </div>

        <!-- Zone Canvas 2D -->
        <div class="relative w-full h-[320px] sm:h-[400px]">
          <canvas id="onboarding-plan-canvas" class="w-full h-full block cursor-grab active:cursor-grabbing" style="touch-action: none;"></canvas>

          <!-- Badge info bas gauche -->
          <div class="absolute bottom-2.5 left-3 z-10 flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-800 text-[10px] font-bold text-slate-300 pointer-events-none">
            <span class="text-amber-400">💡</span>
            <span>Cliquer sur une pièce pour l'aménager • Glisser pour naviguer</span>
          </div>

          <!-- Badge état mobilier bas droite -->
          <div class="absolute bottom-2.5 right-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-800 text-[10px] font-bold ${this.placedFurniture.length === 0 ? 'text-amber-400' : 'text-emerald-400'} pointer-events-none">
            <span>${this.placedFurniture.length === 0 ? '⚠️ Bâtiment vide' : `✓ ${this.placedFurniture.length} meuble(s) en place`}</span>
          </div>
        </div>
      </div>
    `;
  },

  initStep3PlanCanvas() {
    const canvas = document.getElementById('onboarding-plan-canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const w = (rect.width > 50 ? rect.width : (parent ? parent.clientWidth : 720)) || 720;
    const h = (rect.height > 50 ? rect.height : (parent ? parent.clientHeight : 380)) || 380;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    if (this.camera2D.zoom === 0) {
      this.fitPlanView(canvas.width, canvas.height);
    }

    this.setupPlanCanvasEvents(canvas);
    this.renderStep3Scene();
  },

  setupPlanCanvasEvents(canvas) {
    if (canvas._eventsBound) return;
    canvas._eventsBound = true;

    if (window.ResizeObserver && !canvas._resizeObserverBound) {
      canvas._resizeObserverBound = true;
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 50 && cr.height > 50) {
            const d = window.devicePixelRatio || 1;
            const newW = Math.round(cr.width * d);
            const newH = Math.round(cr.height * d);
            if (canvas.width !== newW || canvas.height !== newH) {
              canvas.width = newW;
              canvas.height = newH;
              if (this.camera2D.zoom === 0) {
                this.fitPlanView(newW, newH);
              }
              this.renderStep3Scene();
            }
          }
        }
      });
      ro.observe(canvas.parentElement || canvas);
    }

    let isPointerDown = false;
    let startX = 0, startY = 0;
    let origPanX = 0, origPanY = 0;
    let hasDragged = false;

    canvas.addEventListener('pointerdown', (e) => {
      isPointerDown = true;
      hasDragged = false;
      startX = e.clientX;
      startY = e.clientY;
      origPanX = this.camera2D.panX;
      origPanY = this.camera2D.panY;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isPointerDown) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const cx = (canvas.width / 2) + this.camera2D.panX;
        const cy = (canvas.height / 2) + this.camera2D.panY;
        const scale = this.camera2D.zoom * dpr;
        const ox = cx - 8.3 * scale;
        const oy = cy - 6.0 * scale;

        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        const wx = (mx - ox) / scale;
        const wy = (my - oy) / scale;

        const hovered = this.architectureModel.rooms.find(r => wx >= r.x && wx <= (r.x + r.w) && wy >= r.y && wy <= (r.y + r.h));
        canvas.style.cursor = hovered ? 'pointer' : 'grab';
        return;
      }

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 4) {
        hasDragged = true;
      }

      const dpr = window.devicePixelRatio || 1;
      this.camera2D.panX = origPanX + dx * dpr;
      this.camera2D.panY = origPanY + dy * dpr;
      this.renderStep3Scene();
    });

    const onPointerUp = (e) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}

      if (!hasDragged) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const cx = (canvas.width / 2) + this.camera2D.panX;
        const cy = (canvas.height / 2) + this.camera2D.panY;
        const scale = this.camera2D.zoom * dpr;
        const ox = cx - 8.3 * scale;
        const oy = cy - 6.0 * scale;

        const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height);
        const wx = (mx - ox) / scale;
        const wy = (my - oy) / scale;

        const clickedRoom = this.architectureModel.rooms.find(r => wx >= r.x && wx <= (r.x + r.w) && wy >= r.y && wy <= (r.y + r.h));
        if (clickedRoom) {
          this.selectRoom(clickedRoom.id);
        }
      }
    };

    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.88;
      this.zoomPlan(factor);
    }, { passive: false });
  },

  zoomPlan(factor) {
    this.camera2D.zoom = Math.max(12, Math.min(55, (this.camera2D.zoom || 24) * factor));
    this.renderStep3Scene();
  },

  resetPlanView() {
    const canvas = document.getElementById('onboarding-plan-canvas');
    if (canvas) {
      this.fitPlanView(canvas.width, canvas.height);
      this.renderStep3Scene();
    }
  },

  fitPlanView(w, h) {
    const dpr = window.devicePixelRatio || 1;
    const availW = w / dpr;
    const availH = h / dpr;
    const modelW = 16.5;
    const modelH = 11.0;
    const scaleX = (availW * 0.88) / modelW;
    const scaleY = (availH * 0.88) / modelH;
    this.camera2D.zoom = Math.max(14, Math.min(36, Math.min(scaleX, scaleY)));
    this.camera2D.panX = 0;
    this.camera2D.panY = 0;
  },

  _getRoomStyle(type) {
    const ROOM_STYLES = {
      libre:       { floor: '#f8fafc', accent: '#cbd5e1', label: '#475569', floorType: 'neutral', name: 'Espace Libre' },
      bureau:      { floor: '#e2e8f0', accent: '#94a3b8', label: '#1e293b', floorType: 'carpet', name: 'Bureau & Direction' },
      formation:   { floor: '#e0f2fe', accent: '#7dd3fc', label: '#0369a1', floorType: 'lino', name: 'Salle de Formation' },
      stockage:    { floor: '#fef3c7', accent: '#fde68a', label: '#92400e', floorType: 'concrete', name: 'Stockage & Logistique' },
      reserve:     { floor: '#fef3c7', accent: '#fde68a', label: '#92400e', floorType: 'concrete', name: 'Stockage & Logistique' },
      garage:      { floor: '#94a3b8', accent: '#64748b', label: '#0f172a', floorType: 'epoxy', name: 'Hangar VPSP' },
      detente:     { floor: '#fed7aa', accent: '#f97316', label: '#9a3412', floorType: 'wood', name: 'Foyer des Bénévoles' },
      foyer:       { floor: '#fed7aa', accent: '#f97316', label: '#9a3412', floorType: 'wood', name: 'Foyer des Bénévoles' },
      dortoir:     { floor: '#e0e7ff', accent: '#a5b4fc', label: '#3730a3', floorType: 'carpet_cozy', name: 'Dortoir de Garde' },
      salle_garde: { floor: '#e0e7ff', accent: '#a5b4fc', label: '#3730a3', floorType: 'carpet_cozy', name: 'Salle de Garde' },
      pc_radio:    { floor: '#ccfbf1', accent: '#5eead4', label: '#115e59', floorType: 'tech', name: 'PC Radio & Régulation' },
      douche:      { floor: '#f8fafc', accent: '#cbd5e1', label: '#0f172a', floorType: 'tiles', name: 'Sanitaires & Douches' },
      wc:          { floor: '#f8fafc', accent: '#cbd5e1', label: '#0f172a', floorType: 'tiles', name: 'Sanitaires' },
      vestiaire:   { floor: '#f8fafc', accent: '#cbd5e1', label: '#0f172a', floorType: 'tiles', name: 'Vestiaires Secouristes' },
      vestiaires:  { floor: '#f8fafc', accent: '#cbd5e1', label: '#0f172a', floorType: 'tiles', name: 'Vestiaires Secouristes' }
    };
    return ROOM_STYLES[type] || ROOM_STYLES.libre;
  },

  drawRoomFloor(ctx, rx, ry, rw, rh, room, style, scale) {
    const fType = style.floorType || 'neutral';

    ctx.fillStyle = style.floor || '#f8fafc';
    ctx.fillRect(rx, ry, rw, rh);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();

    if (fType === 'wood') {
      const plankH = Math.max(7, scale * 0.35);
      const plankW = Math.max(26, scale * 1.3);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.28)';
      ctx.lineWidth = 1;

      for (let y = ry; y < ry + rh; y += plankH) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw, y); ctx.stroke();
        const row = Math.floor((y - ry) / plankH);
        const offset = (row % 2) * (plankW / 2);
        for (let x = rx - offset; x < rx + rw; x += plankW) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, Math.min(y + plankH, ry + rh)); ctx.stroke();
        }
      }

      // Tapis de salon chaleureux
      const rugW = Math.min(rw * 0.65, 80 * (scale / 25));
      const rugH = Math.min(rh * 0.55, 60 * (scale / 25));
      const rugX = rx + rw / 2 - rugW / 2;
      const rugY = ry + rh / 2 - rugH / 2;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(rugX, rugY, rugW, rugH);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.strokeRect(rugX + 2, rugY + 2, rugW - 4, rugH - 4);

    } else if (fType === 'tiles') {
      const tileSize = Math.max(10, scale * 0.45);
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)';
      ctx.lineWidth = 1;
      for (let x = rx; x < rx + rw; x += tileSize) {
        ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh); ctx.stroke();
      }
      for (let y = ry; y < ry + rh; y += tileSize) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw, y); ctx.stroke();
      }

    } else if (fType === 'epoxy') {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.15)';
      ctx.fillRect(rx + rw * 0.2, ry, rw * 0.15, rh);
      ctx.fillRect(rx + rw * 0.65, ry, rw * 0.15, rh);

      const stripH = Math.min(10, rh * 0.15);
      const stripY = ry + rh - stripH;
      for (let x = rx; x < rx + rw; x += 12) {
        ctx.fillStyle = ((Math.floor(x / 12) % 2 === 0) ? '#facc15' : '#1e293b');
        ctx.fillRect(x, stripY, Math.min(12, rx + rw - x), stripH);
      }

    } else if (fType === 'lino') {
      const tileSize = Math.max(14, scale * 0.6);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
      ctx.lineWidth = 1;
      for (let x = rx; x < rx + rw; x += tileSize) {
        ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh); ctx.stroke();
      }
      for (let y = ry; y < ry + rh; y += tileSize) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw, y); ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx + rw * 0.25, ry + 2, rw * 0.5, 4);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + rw * 0.25, ry + 2, rw * 0.5, 4);

    } else if (fType === 'concrete') {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
      ctx.lineWidth = 1;
      const step = Math.max(18, scale * 0.8);
      for (let x = rx; x < rx + rw; x += step) {
        ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh); ctx.stroke();
      }
      for (let y = ry; y < ry + rh; y += step) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw, y); ctx.stroke();
      }

      const palW = Math.min(rw * 0.35, 32);
      const palH = Math.min(rh * 0.35, 24);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(rx + 6, ry + 6, palW, palH);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 6, ry + 6, palW, palH);
      for (let py = ry + 10; py < ry + 6 + palH; py += 6) {
        ctx.beginPath(); ctx.moveTo(rx + 6, py); ctx.lineTo(rx + 6 + palW, py); ctx.stroke();
      }

    } else if (fType === 'carpet' || fType === 'carpet_cozy' || fType === 'tech') {
      const step = Math.max(8, scale * 0.35);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let x = rx; x < rx + rw; x += step * 2) {
        for (let y = ry; y < ry + rh; y += step * 2) {
          ctx.fillRect(x, y, step, step);
        }
      }
    } else {
      const step = Math.max(16, scale * 0.7);
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
      ctx.lineWidth = 1;
      for (let x = rx; x < rx + rw; x += step) {
        ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh); ctx.stroke();
      }
      for (let y = ry; y < ry + rh; y += step) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw, y); ctx.stroke();
      }
    }

    ctx.restore();
  },

  renderStep3Scene() {
    const canvas = document.getElementById('onboarding-plan-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, width, height);

    const cx = (width / 2) + this.camera2D.panX;
    const cy = (height / 2) + this.camera2D.panY;
    const scale = (this.camera2D.zoom || 24) * dpr;

    // 1. Fond extérieur : Pelouse verdoyante et cour pavée
    const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
    grad.addColorStop(0, '#22c55e');
    grad.addColorStop(1, '#15803d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const ox = cx - 8.3 * scale;
    const oy = cy - 6.0 * scale;

    // 2. Zone extérieure : Cour enrobée bitumineuse & Parking Opérationnel
    const pk = this.architectureModel.parking;
    if (pk) {
      const px = ox + pk.x * scale;
      const py = oy + pk.y * scale;
      const pw = pk.w * scale;
      const ph = pk.h * scale;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
      ctx.fillRect(px + 4, py + 5, pw, ph);

      ctx.fillStyle = '#334155';
      ctx.fillRect(px, py, pw, ph);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2 * dpr;
      ctx.strokeRect(px, py, pw, ph);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(9 * dpr)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('🚒 COUR & HANGAR OPÉRATIONNEL', px + pw / 2, py + 8 * dpr);

      (pk.spots || []).forEach((spot, idx) => {
        const sx = ox + spot.x * scale;
        const sy = oy + spot.y * scale;
        const sw = spot.w * scale;
        const sd = spot.d * scale;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(sx, sy, sw, sd);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(sx, sy, sw, sd);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = `bold ${Math.round(8.5 * dpr)}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spot.label || `🅿️ EMPLACEMENT 0${idx + 1}`, sx + sw / 2, sy + sd / 2);
      });
    }

    // 3. Ombre portée globale du bâtiment
    const buildX = ox + 6.0 * scale;
    const buildY = oy + 1.4 * scale;
    const buildW = 9.8 * scale;
    const buildH = 9.2 * scale;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(buildX + 6 * dpr, buildY + 8 * dpr, buildW, buildH, 6 * dpr);
    else ctx.rect(buildX + 6 * dpr, buildY + 8 * dpr, buildW, buildH);
    ctx.fill();

    // 4. Tracé des sols réalistes des pièces
    this.architectureModel.rooms.forEach(r => {
      const rx = ox + r.x * scale;
      const ry = oy + r.y * scale;
      const rw = r.w * scale;
      const rh = r.h * scale;
      const userRoom = this.roomsConfig.find(ur => ur.id === r.id) || r;
      const isSelected = this.selectedRoomId === r.id;

      const roomStyle = this._getRoomStyle(userRoom.type);
      this.drawRoomFloor(ctx, rx, ry, rw, rh, r, roomStyle, scale);

      // Surbrillance orange vive si sélectionnée
      if (isSelected) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3.5 * dpr;
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
        ctx.fillRect(rx, ry, rw, rh);
      }
    });

    // 5. Tracé du Mobilier meublé (style Les Sims)
    (this.placedFurniture || []).forEach(item => {
      const room = this.architectureModel.rooms.find(r => r.id === item.room) || this.architectureModel.rooms[0];
      let fx = item.x;
      let fy = item.y;
      if (!fx || !fy) {
        const roomFurn = this.placedFurniture.filter(f => f.room === item.room);
        const idxInRoom = roomFurn.indexOf(item);
        const cols = Math.max(2, Math.floor((room.w - 0.8) / 1.6));
        const c = idxInRoom % cols;
        const row = Math.floor(idxInRoom / cols);
        fx = room.x + 0.6 + c * 1.5;
        fy = room.y + 0.7 + row * 1.4;
      }

      const fw = item.w || 1.2;
      const fd = item.d || 0.8;

      const ix = ox + fx * scale;
      const iy = oy + fy * scale;
      const iw = fw * scale;
      const ih = fd * scale;

      // Ombre portée du meuble
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(ix + 3, iy + 3, iw, ih);

      // Corps du meuble
      ctx.fillStyle = item.color || '#475569';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ix, iy, iw, ih, 4 * dpr);
      else ctx.rect(ix, iy, iw, ih);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Détails par type
      const itype = item.type || item.typeId;
      if (itype === 'mannequin_rcp') {
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(ix + iw / 2, iy + ih * 0.25, Math.min(iw, ih) * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (itype === 'dae_mural') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.4, iy + ih * 0.2, iw * 0.2, ih * 0.6);
        ctx.fillRect(ix + iw * 0.2, iy + ih * 0.4, iw * 0.6, ih * 0.2);
      } else if (itype === 'armoire_pharmacie') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.45, iy + ih * 0.25, iw * 0.1, ih * 0.5);
        ctx.fillRect(ix + iw * 0.3, iy + ih * 0.45, iw * 0.4, ih * 0.1);
      } else if (itype === 'etagere_lots') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ix, iy + ih * 0.33); ctx.lineTo(ix + iw, iy + ih * 0.33);
        ctx.moveTo(ix, iy + ih * 0.66); ctx.lineTo(ix + iw, iy + ih * 0.66);
        ctx.stroke();
      } else if (itype === 'casiers_vestiaire') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ix + iw * 0.33, iy); ctx.lineTo(ix + iw * 0.33, iy + ih);
        ctx.moveTo(ix + iw * 0.66, iy); ctx.lineTo(ix + iw * 0.66, iy + ih);
        ctx.stroke();
      } else if (itype === 'lit_garde') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.15, iy + ih * 0.08, iw * 0.7, ih * 0.28);
      } else if (itype === 'bureau') {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ix + iw * 0.3, iy + ih * 0.25, iw * 0.4, ih * 0.3);
      } else if (itype === 'machine_cafe') {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ix + iw * 0.35, iy + ih * 0.35, iw * 0.3, ih * 0.3);
      }

      if (item.icon && iw > 18 && ih > 18) {
        ctx.font = `${Math.round(Math.min(iw, ih) * 0.45)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.icon, ix + iw / 2, iy + ih / 2);
      }
    });

    // 6. Murs porteurs solides
    this.architectureModel.walls.forEach(w => {
      const x1 = ox + w.x1 * scale;
      const y1 = oy + w.y1 * scale;
      const x2 = ox + w.x2 * scale;
      const y2 = oy + w.y2 * scale;
      const thBase = Math.max(7 * dpr, w.th * scale);

      // Ombre du mur
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = thBase + 2 * dpr;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1 + 1, y1 + 2); ctx.lineTo(x2 + 1, y2 + 2); ctx.stroke();

      // Corps du mur
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = thBase;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // Arête claire de relief
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });

    // 7. Portes d'accès réelles
    this.architectureModel.doors.forEach(d => {
      const dx = ox + d.x * scale;
      const dy = oy + d.y * scale;
      const dlen = d.len * scale;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = Math.max(7 * dpr, 0.16 * scale);
      ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(dx, dy);
      if (d.wall === 'W') ctx.lineTo(dx + dlen, dy);
      else if (d.wall === 'E') ctx.lineTo(dx - dlen, dy);
      else if (d.wall === 'S') ctx.lineTo(dx, dy - dlen);
      else ctx.lineTo(dx, dy + dlen);
      ctx.stroke();

      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3 * dpr;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(dx, dy);
      if (d.wall === 'W') ctx.lineTo(dx + dlen * 0.7, dy - dlen * 0.7);
      else if (d.wall === 'E') ctx.lineTo(dx - dlen * 0.7, dy - dlen * 0.7);
      else if (d.wall === 'S') ctx.lineTo(dx + dlen * 0.7, dy - dlen * 0.7);
      else ctx.lineTo(dx + dlen * 0.7, dy + dlen * 0.7);
      ctx.stroke();
    });

    // 8. Fenêtres lumineuses
    this.architectureModel.windows.forEach(w => {
      const wx = ox + w.x * scale;
      const wy = oy + w.y * scale;
      const wlen = w.len * scale;

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = Math.max(5 * dpr, 0.1 * scale);
      ctx.beginPath();
      if (w.wall === 'N' || w.wall === 'S') {
        ctx.moveTo(wx, wy); ctx.lineTo(wx + wlen, wy);
      } else {
        ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wlen);
      }
      ctx.stroke();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      if (w.wall === 'N' || w.wall === 'S') {
        ctx.moveTo(wx, wy); ctx.lineTo(wx + wlen, wy);
      } else {
        ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wlen);
      }
      ctx.stroke();
    });

    // 9. Équipements de sécurité
    this.architectureModel.fixtures.forEach(f => {
      if (f.type === 'extinguisher') {
        const px = ox + f.x * scale;
        const py = oy + f.y * scale;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px + 4 * dpr, py + 4 * dpr, 4.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1 * dpr;
        ctx.stroke();
      }
    });

    // 10. Pastille centrale de chaque pièce
    this.architectureModel.rooms.forEach(r => {
      const rx = ox + r.x * scale;
      const ry = oy + r.y * scale;
      const rw = r.w * scale;
      const rh = r.h * scale;

      const userRoom = this.roomsConfig.find(ur => ur.id === r.id) || r;
      const isSelected = this.selectedRoomId === r.id;
      const typeInfo = this.roomTypesList.find(t => t.id === userRoom.type) || { label: userRoom.label || 'Libre', icon: userRoom.icon || '🚪' };
      const roomFurnCount = (this.placedFurniture || []).filter(f => f.room === r.id).length;

      const pillW = Math.min(rw * 0.90, 185 * (scale / 25));
      const pillH = Math.min(rh * 0.42, 38 * (scale / 25));
      const pillX = rx + rw / 2 - pillW / 2;
      const pillY = ry + rh / 2 - pillH / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pillX + 2, pillY + 2, pillW, pillH, 8 * dpr);
      else ctx.rect(pillX + 2, pillY + 2, pillW, pillH);
      ctx.fill();

      ctx.fillStyle = isSelected ? '#ea580c' : 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, 8 * dpr);
      else ctx.rect(pillX, pillY, pillW, pillH);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#fbbf24' : '#475569';
      ctx.lineWidth = isSelected ? 2.5 * dpr : 1.5 * dpr;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(10 * (scale / 25))}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${typeInfo.icon} ${userRoom.name} · ${r.area} m²`, pillX + pillW / 2, pillY + 5 * (scale / 25));

      ctx.fillStyle = isSelected ? '#fef08a' : '#cbd5e1';
      ctx.font = `600 ${Math.round(8.5 * (scale / 25))}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillText(`${typeInfo.label} · ${roomFurnCount} meuble(s)`, pillX + pillW / 2, pillY + 19 * (scale / 25));
    });
  },
  // -------------------------------------------------------------
  // ÉTAPE 4 : SIGNATURE DE L'AFFILIATION FNPC POUR DEVENIR UNE VRAIE AASC
  // -------------------------------------------------------------
  renderStep4() {
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    const deptName = deptInfo ? deptInfo.name : this.deptCode;
    const playerName = this.game?.player?.name || 'Directeur';

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <span class="text-2xl">📜</span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">4. Affiliation Nationale & Agrément AASC</h2>
          <p class="text-xs text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            Pour opérer légalement sur le terrain et être reconnu par l'État et le SAMU, votre antenne doit être officiellement affiliée à la Fédération Nationale de Protection Civile.
          </p>
        </div>

        <!-- CHARTE OFFICIELLE D'AFFILIATION FNPC -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-blue-50/90 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 border-2 border-pc-blue/40 dark:border-blue-500/50 shadow-xl space-y-4 text-center">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <img src="logo_myprotec.png" alt="Protection Civile" class="h-10 object-contain" />
            <div class="text-right">
              <span class="text-[10px] font-black uppercase text-pc-blue dark:text-blue-400 tracking-wider block">Fédération Nationale de Protection Civile</span>
              <span class="text-[9px] text-slate-400 dark:text-slate-400">Agrément National de Sécurité Civile (Loi 2004-811)</span>
            </div>
          </div>

          <div class="space-y-2 py-2">
            <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
              Charte d'Agrément & d'Affiliation Opérationnelle
            </h3>
            <p class="text-xs text-slate-700 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Il est certifié que l'antenne locale <strong>« ${this.teamName} »</strong>, implantée dans le département de <strong>${deptName} (${this.deptCode})</strong>, sous la direction de <strong>${playerName}</strong>, est officiellement reconnue Association Agréée de Sécurité Civile (AASC).
            </p>
          </div>

          <!-- Zone officielle de signature ou Sceau de validation -->
          <div class="py-2">
            ${this.fnpcSigned ? `
              <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 dark:border-emerald-600/70 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <strong class="block text-xs font-black text-emerald-950 dark:text-emerald-100 uppercase tracking-wider">AFFILIATION OFFICIELLEMENT HOMOLOGUÉE</strong>
                    <span class="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Agrément AASC actif • Autorisation préfectorale d’opérer délivrée</span>
                  </div>
                </div>
                ${this.fnpcSignatureDataUrl ? `
                  <div class="h-14 w-32 bg-white/90 dark:bg-slate-900 rounded-xl p-1.5 border border-emerald-300 dark:border-emerald-800 flex flex-col items-center justify-center shadow-xs">
                    <img src="${this.fnpcSignatureDataUrl}" alt="Signature Responsable d’antenne" class="max-h-full max-w-full object-contain" />
                    <span class="text-[7.5px] font-mono text-slate-400 dark:text-slate-400 font-bold uppercase mt-0.5">Paraphe Responsable d’antenne</span>
                  </div>
                ` : ''}
              </div>
            ` : `
              <div id="onboarding-fnpc-signature-container" class="w-full max-w-xl mx-auto"></div>
            `}
          </div>

          <div class="pt-2 text-[10px] text-slate-400 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Agrément types A, B, C, D</span>
            <span>République Française • Ministère de l'Intérieur</span>
          </div>
        </div>

        <!-- Boutons de validation et lancement -->
        <div class="pt-2 flex items-center justify-between gap-3">
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(3)"
            class="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-700 transition cursor-pointer">
            ⬅ Retour
          </button>
          
          <button 
            type="button" 
            ${!this.fnpcSigned ? 'disabled title="Veuillez d’abord signer l’affiliation FNPC ci-dessus avec la souris ou le doigt"' : ''}
            onclick="window.ProtecOnboarding.finalizeOfficialLaunch()"
            class="flex-1 py-4 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              this.fnpcSigned 
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-pc-blue text-white shadow-xl hover:brightness-110 active:scale-95 animate-pulse' 
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
            }">
            <span>Inaugurer l'Antenne et Lancer la Partie</span>
            <span>🚀</span>
          </button>
        </div>
      </div>
    `;
  },

  initStep4Signature() {
    if (this.currentStep !== 4 || this.fnpcSigned) return;
    const container = document.getElementById('onboarding-fnpc-signature-container');
    if (!container || !window.ProtecSignature) return;

    window.ProtecSignature.attachPad(container, {
      title: 'Paraphe & Signature Officielle du Responsable d’antenne :',
      subtitle: '✍️ Tracez votre signature avec votre souris ou votre doigt : elle valide automatiquement l’affiliation',
      placeholder: '✍️ Signez ici de votre main ou avec la souris...',
      height: 125,
      stampText: 'AFFILIATION RATIFIÉE',
      stampSubtext: 'FÉDÉRATION NATIONALE DE SÉCURITÉ CIVILE',
      onSigned: (signatureDataUrl) => {
        this.fnpcSigned = true;
        this.fnpcSignatureDataUrl = signatureDataUrl;
        this.renderWizard();
        const g = this.game || window.game;
        if (g) {
          g.showToast('Affiliation FNPC Validée ! 📜', 'Votre signature a été enregistrée. L’Agrément AASC officiel est délivré !', 'green');
        }
      }
    });
  },

  signFnpcAgreement(signatureDataUrl = null) {
    this.fnpcSigned = true;
    if (signatureDataUrl) this.fnpcSignatureDataUrl = signatureDataUrl;
    this.renderWizard();
  },

  // -------------------------------------------------------------
  // FINALISATION & LANCEMENT DU JEU (0 VÉHICULE, 0 MATÉRIEL)
  // -------------------------------------------------------------
  finalizeOfficialLaunch() {
    const game = this.game || window.game;
    if (!game) return;

    const stationId = `station-${Date.now()}`;
    const stationName = this.teamName || 'Antenne Protection Civile';
    const lat = this.placementData.lat || 48.6921;
    const lng = this.placementData.lng || 6.1844;
    let deptCode = this.deptCode;
    if (window.ProtecDepartements && typeof window.ProtecDepartements.getDepartmentByCoordinates === 'function') {
      const found = window.ProtecDepartements.getDepartmentByCoordinates(lat, lng);
      if (found) deptCode = found.code;
    }
    if (!deptCode) deptCode = '54';
    // La ville correspond impérativement à la commune où le bâtiment est implanté
    let city = (this.placementData && this.placementData.city) ? this.placementData.city.trim() : '';
    if (!city && stationName) {
      city = stationName.replace(/^antenne\s+(de\s+)?/i, '').trim();
    }
    if (!city) city = 'Commune Locale';

    // 1. Modèle d'architecture avec les meubles achetés
    let archModel = null;
    if (window.ProtecLocaux) {
      archModel = JSON.parse(JSON.stringify(window.ProtecLocaux.getArchitectModel()));
      if (archModel) {
        // Enregistrement des types de pièces personnalisés par le joueur
        if (archModel.rooms) {
          archModel.rooms.forEach(r => {
            const userRoom = (this.roomsConfig || []).find(ur => ur.id === r.id);
            if (userRoom) {
              r.type = userRoom.type;
              r.name = `${userRoom.name} (${userRoom.label})`;
              r.icon = userRoom.icon;
              r.color = userRoom.color || '#121722';
            }
          });
        }

        // Le bâtiment démarre avec les meubles achetés et placés par le joueur
        archModel.furniture = this.placedFurniture.map(f => {
          const catItem = (window.ProtecLocaux && window.ProtecLocaux.FURNITURE_CATALOG)
            ? window.ProtecLocaux.FURNITURE_CATALOG.find(c => c.type === (f.type || f.typeId))
            : null;
          let rx = f.x || (f.room === 'room_2' ? 11.5 : (f.room === 'room_3' ? 9.0 : 7.0));
          let ry = f.y || (f.room === 'room_3' ? 7.0 : 2.5);
          return {
            id: f.id,
            type: f.type || f.typeId,
            label: f.name,
            x: rx,
            y: ry,
            w: f.w || (catItem ? catItem.w : 1.2),
            d: f.d || (catItem ? catItem.d : 0.8),
            color: f.color || (catItem ? catItem.color : '#475569'),
            roomId: f.room
          };
        });
      }
    }

    const newStation = {
      id: stationId,
      name: stationName,
      departmentCode: deptCode,
      city: city,
      citycode: this.placementData.citycode || deptCode,
      lat: lat,
      lng: lng,
      isMain: true,
      level: 1,
      vehicles: [],
      stock: {},
      premises: {
        buildingId: 'base_standard',
        name: `Local Opérationnel - ${stationName}`,
        tenure: 'rented',
        monthlyRent: 850,
        surfaceM2: 84.6,
        architecture: archModel
      },
      initialSetupDone: true
    };

    // 2. Dotation initiale officielle : 1 VPSP Ancien fourni avec l'antenne
    const starterVpsp = (typeof game.createDefaultStarterVPSP === 'function')
      ? game.createDefaultStarterVPSP(stationId, newStation)
      : {
          id: `vpsp-starter-${Date.now()}`,
          name: game.generateVehicleCallsign ? game.generateVehicleCallsign('VPSP', stationId, newStation) : `VPSP 01 ${city.toUpperCase()}`,
          type: 'VPSP',
          label: 'Véhicule de Premiers Secours à Personnes (Ancien)',
          model: 'Renault Master II Phase 2 2.5 dCi 120 (Dotation Initiale)',
          year: 2014,
          mileage: 178500,
          kilometrage: 178500,
          capacity: 5,
          seatsCount: 5,
          extraCapacityLabel: null,
          hasTowHitch: false,
          requiresTrailer: false,
          reqSkills: ['permis_vpsp'],
          status: 'dispo',
          fuel: 90,
          mechanical: 85,
          ctStatus: 'valide',
          ctExpiryTimestamp: Date.now() + (300 * 24 * 3600 * 1000),
          insuranceStatus: 'assure',
          insuranceMonthlyCost: 65,
          licenseRequired: 'B',
          stationId: stationId,
          image: (typeof game.getVehicleImage === 'function') ? game.getVehicleImage('VPSP') : 'images/vehicles/VPSP.png',
          types: ['PS', 'VPSP'],
          capacity_log: 0,
          consumables: 0,
          armementLevel: 0,
          isRearmed: false,
          needsRearming: true,
          loadedItems: []
        };

    if (window.ProtecLogistique && typeof window.ProtecLogistique.normalizeVehicle === 'function') {
      window.ProtecLogistique.normalizeVehicle(starterVpsp);
    }

    game.vehicles = [starterVpsp];
    newStation.vehicles = [starterVpsp.id];

    // 3. Inventaire totalement vide au départ
    game.logistics = {
      oxygenBottles: 0,
      aedPads: 0,
      woundKits: 0,
      cervicalCollars: 0
    };
    newStation.stock = {};
    newStation.stockMaterielsPS = 0;
    game.stockMaterielsPS = 0;

    // 4. Conventions d'agrément AASC signée via l'affiliation FNPC
    game.aascConvention = {
      signed: true,
      signedAt: Date.now(),
      cost: 800
    };

    // 5. Enregistrement des 5 bénévoles constitutifs personnalisés et variés
    game.volunteers = this.volunteersList.map(v => {
      const vol = {
        id: `vol-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: v.name,
        role: v.role,
        rank: v.rank,
        exp: v.exp,
        energy: 100,
        motivation: v.motivation,
        humeur: 85,
        trait: v.trait || 'devoue',
        contractType: 'benevole',
        profilSocial: (v.dispoType === 'étudiante' || v.dispoType === 'etudiant') ? 'etudiant' : 'salarie',
        status: 'dispo',
        stationId: stationId,
        avatar: v.avatar,
        gender: v.gender || (v.dispoType === 'étudiante' ? 'f' : 'h'),
        dispoType: v.dispoType,
        dispoJours: v.dispoJours,
        skills: v.skills || []
      };
      return vol;
    });

    game.stations = [newStation];

    if (window.ProtecPersonnel && typeof window.ProtecPersonnel.ensureVolunteerResidence === 'function') {
      game.volunteers.forEach(vol => window.ProtecPersonnel.ensureVolunteerResidence(vol, game));
    }

    if (window.ProtecPersonnel && typeof window.ProtecPersonnel.auditAndSanitizeAllVolunteersResidences === 'function') {
      window.ProtecPersonnel.auditAndSanitizeAllVolunteersResidences(game);
    }

    // Dotation initiale officielle : 40 000 € net
    game.resources.money = 40000;
    game.resources.budget = 40000;
    game.resources.funds = 40000;
    game.resources._money = 40000;

    // Mettre à jour l'identité du joueur
    if (game.player) {
      game.player.stationName = stationName;
      game.player.departmentCode = deptCode;
      game.player.city = city;
    }
    game.currentDepartmentCode = deptCode;
    localStorage.setItem('protec_department_code', deptCode);

    // Synchronisation immédiate vers la BDD Supabase (table players et alliance_stations)
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      const pid = (game.player && game.player.id) || localStorage.getItem('protec_player_id');
      if (pid) {
        window.ProtecSupabase.updatePlayerCityAndStation(pid, city, stationName, deptCode).catch(e => console.warn(e));
      }
      window.ProtecSupabase.syncStationToMap(game.player, newStation);
      if (typeof game.loadAllianceStations === 'function') {
        game.loadAllianceStations();
      }
    }

    // Fermer définitivement le modal d'onboarding et nettoyer la persistance temporaire
    try {
      localStorage.removeItem('protec_onboarding_step');
      localStorage.removeItem('protec_onboarding_volunteers');
      localStorage.removeItem('protec_onboarding_placement');
      localStorage.removeItem('protec_onboarding_rooms');
      localStorage.removeItem('protec_onboarding_furniture');
      localStorage.removeItem('protec_onboarding_selected_room');
      localStorage.removeItem('protec_onboarding_fnpc_signed');
      localStorage.removeItem('protec_onboarding_fnpc_sig_data');
    } catch (e) {}

    const modal = document.getElementById('onboarding-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    // Sauvegarde immédiate
    game.saveGame();
    game.updateStatsUI();
    game.renderStations();
    game.renderMissions();

    // Centrer et afficher la carte Leaflet
    if (game.map) {
      game.map.setView([lat, lng], 13);
      setTimeout(() => {
        game.map.invalidateSize();
      }, 300);
    }

    game.showToast(
      '🎉 Antenne Inaugurée !', 
      `Bienvenue à « ${stationName} » ! Votre affiliation FNPC est active. Répondez aux premiers devis et quêtes pour développer votre antenne.`, 
      'green'
    );
  }
};
