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

  // 3. Mobilier acheté et typage des pièces du bâtiment (initialement VIDE)
  placedFurniture: [],
  selectedRoomId: 'room_1',
  roomsConfig: [
    { id: 'room_1', name: 'Salle 1', type: 'libre', label: 'Libre', area: 19.3, icon: '🚪', color: '#131b2e' },
    { id: 'room_2', name: 'Salle 2', type: 'libre', label: 'Libre', area: 20.2, icon: '🚪', color: '#131b2e' },
    { id: 'room_3', name: 'Salle 3', type: 'libre', label: 'Libre', area: 45.1, icon: '🚪', color: '#131b2e' }
  ],
  roomTypesList: [
    { id: 'libre', label: 'Libre (Non affectée)', icon: '🚪', desc: 'Fonction de la pièce non définie', color: '#1e293b' },
    { id: 'bureau', label: 'Bureau & Direction', icon: '💼', desc: 'Gestion administrative & planification', color: '#1e3a8a' },
    { id: 'formation', label: 'Salle de Formation', icon: '🎓', desc: 'Sessions PSC, SST et recyclages', color: '#1e40af' },
    { id: 'stockage', label: 'Stockage & Logistique', icon: '📦', desc: 'Réserve matériel, lots de secours', color: '#334155' },
    { id: 'detente', label: 'Foyer & Repos', icon: '☕', desc: 'Convivialité et récupération secouristes', color: '#065f46' },
    { id: 'vestiaires', label: 'Vestiaires & Sanitaires', icon: '👕', desc: 'Casiers et tenues d’intervention', color: '#4c1d95' },
    { id: 'pc_radio', label: 'PC Radio & Opérations', icon: '📡', desc: 'Poste de commandement opérationnel', color: '#701a75' }
  ],
  furnitureCatalog: [
    { id: 'f_bureau', name: 'Bureau & Fauteuil de Direction', cost: 180, icon: '🪑', defaultRoom: 'room_1', desc: 'Gestion administrative & planification des postes' },
    { id: 'f_pharmacie', name: 'Armoire à Pharmacie Sécurisée', cost: 350, icon: '🗄️', defaultRoom: 'room_3', desc: 'Stockage sécurisé des consommables médicaux' },
    { id: 'f_formation', name: 'Tables & Chaises de Formation', cost: 250, icon: '🎓', defaultRoom: 'room_2', desc: 'Permet d’accueillir les sessions PSC & SST' },
    { id: 'f_mannequin', name: 'Mannequin RCP & Matériel Pédagogique', cost: 400, icon: '🫀', defaultRoom: 'room_2', desc: 'Indispensable pour former le grand public' },
    { id: 'f_foyer', name: 'Canapé & Foyer des Bénévoles', cost: 300, icon: '🛋️', defaultRoom: 'room_1', desc: 'Espace de convivialité et récupération des secouristes' },
    { id: 'f_lit', name: 'Lit de Repos & Vestiaires', cost: 190, icon: '🛏️', defaultRoom: 'room_1', desc: 'Dortoir de garde et vestiaires d’intervention' },
    { id: 'f_etagere', name: 'Étagères Industrielles Lots A/B', cost: 160, icon: '📦', defaultRoom: 'room_3', desc: 'Rangement robuste pour caisses de secours et tentes' }
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

  // Initialisation du Tuto à 4 étapes avec persistance et reprise transparente
  showWizard(game, options = {}) {
    this.game = game || window.game;
    this.fnpcSigned = false;

    // Récupération de la progression en cours si le tuto a été interrompu précédemment
    let savedStep = 1;
    let savedVolunteers = null;
    let savedPlacement = null;
    try {
      const storedStep = localStorage.getItem('protec_onboarding_step');
      if (storedStep) savedStep = parseInt(storedStep, 10) || 1;
      const storedVols = localStorage.getItem('protec_onboarding_volunteers');
      if (storedVols) savedVolunteers = JSON.parse(storedVols);
      const storedPlacement = localStorage.getItem('protec_onboarding_placement');
      if (storedPlacement) savedPlacement = JSON.parse(storedPlacement);
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

    // Le bâtiment démarre TOTALEMENT VIDE avec les pièces de base prêtes à être configurées
    this.placedFurniture = [];
    this.selectedRoomId = 'room_1';
    this.roomsConfig = [
      { id: 'room_1', name: 'Salle 1', type: 'libre', label: 'Libre', area: 19.3, icon: '🚪', color: '#131b2e' },
      { id: 'room_2', name: 'Salle 2', type: 'libre', label: 'Libre', area: 20.2, icon: '🚪', color: '#131b2e' },
      { id: 'room_3', name: 'Salle 3', type: 'libre', label: 'Libre', area: 45.1, icon: '🚪', color: '#131b2e' }
    ];

    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.zIndex = '99999';

    this.renderWizard();
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
    try {
      localStorage.setItem('protec_onboarding_step', String(this.currentStep));
      localStorage.setItem('protec_onboarding_volunteers', JSON.stringify(this.volunteersList));
      if (this.placementData && this.placementData.lat) {
        localStorage.setItem('protec_onboarding_placement', JSON.stringify(this.placementData));
      }
    } catch (e) {}
    this.renderWizard();

    // Si on arrive à l'étape 2, initialiser la carte Leaflet
    if (this.currentStep === 2) {
      setTimeout(() => {
        this.initStep2Map();
      }, 150);
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
      <div class="glass-panel-heavy rounded-3xl w-full max-w-3xl p-5 sm:p-7 shadow-2xl border-2 border-slate-300 text-slate-800 modal-fade-in space-y-5 max-h-[94vh] overflow-y-auto custom-scrollbar">
        <!-- Barre de progression des 4 étapes -->
        <div class="space-y-2 pb-3 border-b border-slate-200">
          <div class="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
            <span>Tutoriel Fondateur • Protection Civile</span>
            <span class="text-pc-blue font-bold">Étape ${this.currentStep} sur 4</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <!-- Étape 1 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 1 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : (this.currentStep > 1 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200')}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 1 ? 'bg-white text-pc-blue' : (this.currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600')}">
                ${this.currentStep > 1 ? '✓' : '1'}
              </span>
              <span class="text-[11px] font-bold truncate">Équipe de base</span>
            </div>

            <!-- Étape 2 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 2 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : (this.currentStep > 2 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200')}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 2 ? 'bg-white text-pc-blue' : (this.currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600')}">
                ${this.currentStep > 2 ? '✓' : '2'}
              </span>
              <span class="text-[11px] font-bold truncate">Placement carte</span>
            </div>

            <!-- Étape 3 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 3 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : (this.currentStep > 3 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200')}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 3 ? 'bg-white text-pc-blue' : (this.currentStep > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600')}">
                ${this.currentStep > 3 ? '✓' : '3'}
              </span>
              <span class="text-[11px] font-bold truncate">Aménagement local</span>
            </div>

            <!-- Étape 4 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 4 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 4 ? 'bg-white text-pc-blue' : 'bg-slate-300 text-slate-600'}">
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
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">1. Fondation de l'Antenne & Équipe de Base</h2>
          <p class="text-xs text-slate-600 max-w-lg mx-auto">
            Définissez le nom de votre antenne, son département de rattachement et découvrez vos 5 bénévoles constitutifs.
          </p>
        </div>

        <!-- Encart de fondation : Nom de l'antenne & Choix du département -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-amber-50/70 border-2 border-pc-blue/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left shadow-xs">
          <div>
            <label class="block text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
              <span>🏢</span>
              <span>Nom officiel de votre Antenne</span>
            </label>
            <input 
              type="text" 
              id="onboarding-step1-station-name"
              value="${(this.teamName || '').replace(/"/g, '&quot;')}" 
              placeholder="Ex: Antenne de Nancy, Antenne Paris 15..."
              oninput="window.ProtecOnboarding.updateTeamName(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-pc-blue/40 shadow-2xs"
            />
          </div>
          <div>
            <label class="block text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
              <span>📍</span>
              <span>Département d'Implantation</span>
            </label>
            <select 
              id="onboarding-step1-dept-select"
              onchange="window.ProtecOnboarding.changeDepartment(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-pc-blue/40 cursor-pointer shadow-2xs">
              ${this.getDepartmentsList().map(d => `<option value="${d.code}" ${d.code === this.deptCode ? 'selected' : ''}>${d.code} - ${d.name} (${d.region})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- En-tête de section -->
        <div class="flex items-center justify-between px-1 pt-1">
          <span class="text-xs font-black text-slate-700 uppercase tracking-wide">Membres constitutifs (#1 à #5)</span>
        </div>

        <!-- Liste des 5 secouristes personnalisables -->
        <div class="space-y-2.5">
          ${this.volunteersList.map((vol, idx) => `
            <div class="p-3.5 rounded-2xl glass-card bg-white/95 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <!-- Avatar Bénévole Tenue Officielle Protection Civile (Orange #f78d20, Blanc, Bleu #024589) -->
                <div class="relative group">
                  <button type="button" onclick="window.ProtecOnboarding.toggleVolunteerGender('${vol.id}')" class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-300 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer shadow-xs overflow-hidden" title="Changer le modèle (Homme / Femme)">
                    ${this.renderVolunteerUniformAvatar(vol, 'w-11 h-11')}
                  </button>
                  <div class="hidden group-hover:flex absolute left-0 top-full mt-1 z-30 p-1 rounded-xl bg-white shadow-xl border border-slate-200 gap-1 items-center whitespace-nowrap">
                    <button type="button" onclick="window.ProtecOnboarding.setVolunteerGender('${vol.id}', 'h')" class="px-2 py-1 rounded-lg text-[10px] font-black ${vol.gender === 'h' ? 'bg-pc-blue text-white' : 'hover:bg-slate-100 text-slate-700'} transition cursor-pointer">
                      Modèle Homme
                    </button>
                    <button type="button" onclick="window.ProtecOnboarding.setVolunteerGender('${vol.id}', 'f')" class="px-2 py-1 rounded-lg text-[10px] font-black ${vol.gender === 'f' ? 'bg-pc-blue text-white' : 'hover:bg-slate-100 text-slate-700'} transition cursor-pointer">
                      Modèle Femme
                    </button>
                  </div>
                </div>

                <!-- Saisie du nom & rôle -->
                <div class="flex-1 space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      vol.rank === 'CE' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      (vol.rank === 'PSE2' ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-slate-100 text-slate-700 border border-slate-300')
                    }">
                      ${vol.role} (${vol.rank})
                    </span>
                    <span class="text-[10px] text-slate-400">#${idx + 1}</span>
                  </div>
                  <input 
                    type="text" 
                    value="${vol.name.replace(/"/g, '&quot;')}" 
                    oninput="window.ProtecOnboarding.updateVolunteerName('${vol.id}', this.value)"
                    placeholder="Prénom Nom" 
                    class="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-pc-blue/30 focus:border-pc-blue w-full max-w-[220px]"
                  />
                </div>
              </div>

              <!-- Compétences & Permis -->
              <div class="flex items-center gap-1.5 flex-wrap text-[10px]">
                ${(vol.skills || []).map(sk => `
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200 uppercase">
                    ${sk.replace('_', ' ')}
                  </span>
                `).join('')}
                <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-black border border-emerald-200">
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
    if (v) v.name = newName.trim() || 'Bénévole Secouriste';
  },

  updateVolunteerAvatar(volId, newAvatar) {
    const v = this.volunteersList.find(x => x.id === volId);
    if (v) {
      v.avatar = newAvatar;
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
      const res = await fetch('data/departements-version-simplifiee.geojson');
      if (res.ok) {
        const data = await res.json();
        this.cachedGeoJSON = data;
        window._cachedDepartementsGeoJSON = data;
        return data;
      }
    } catch (e) {
      console.warn('Impossible de charger data/departements-version-simplifiee.geojson:', e);
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
          <div style="color:#64748b; font-size:10px;">Directeur : ${st.player_name || st.playerName || 'Directeur d’Antenne'}</div>
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

      cardEl.className = 'p-3.5 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm transition-all';
      cardEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
            🏢
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-black text-slate-900" id="step2-city-label">${this.placementData.city}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-300">
                ✓ Emplacement Autorisé
              </span>
            </div>
            <div class="text-[11px] text-slate-600 mt-0.5">
              Département <strong>${this.deptCode}</strong> • <span class="font-mono text-slate-500" id="step2-coords-label">${this.placementData.lat.toFixed(4)}, ${this.placementData.lng.toFixed(4)}</span>
            </div>
            <div class="text-[10px] text-emerald-800 font-medium mt-0.5">
              ${nearestInfo}
            </div>
          </div>
        </div>

        <button 
          type="button" 
          onclick="window.ProtecOnboarding.resetMapPosition()"
          class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap self-end sm:self-auto">
          🎯 Recentrer
        </button>
      `;
    } else {
      cardEl.className = 'p-3.5 rounded-2xl bg-rose-50/95 border-2 border-rose-400 text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm transition-all';
      cardEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0">
            ⚠️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-black text-rose-900" id="step2-city-label">${this.placementData.city}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                ⛔ Non Conforme
              </span>
            </div>
            <div class="text-[11px] text-rose-800 font-bold mt-0.5">
              ${validation.message}
            </div>
            <div class="text-[10px] text-rose-600 mt-0.5">
              Département ${this.deptCode} • <span class="font-mono" id="step2-coords-label">${this.placementData.lat.toFixed(4)}, ${this.placementData.lng.toFixed(4)}</span> (Cliquez sur une zone libre dans le département)
            </div>
          </div>
        </div>

        <button 
          type="button" 
          onclick="window.ProtecOnboarding.resetMapPosition()"
          class="px-3 py-1.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap self-end sm:self-auto">
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
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">2. Placement de votre Bâtiment sur la Carte</h2>
          <p class="text-xs text-slate-600 max-w-xl mx-auto">
            Définissez l'emplacement officiel de votre local d'antenne dans le département <strong>${deptName} (${this.deptCode})</strong>.
            Le bâtiment doit obligatoirement être situé dans le département, dans une commune libre, et à <strong>au moins ${minKm} km</strong> de toute autre antenne.
          </p>
        </div>

        <!-- Encart interactif de configuration de l'antenne & département -->
        <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div>
            <label class="block text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
              <span>🏢</span>
              <span>Nom officiel de l'antenne</span>
            </label>
            <input 
              type="text" 
              id="onboarding-step2-station-name"
              value="${(this.teamName || '').replace(/"/g, '&quot;')}" 
              placeholder="Ex: Antenne de Nancy, Antenne Paris 15..."
              oninput="window.ProtecOnboarding.updateTeamName(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-pc-blue/40 shadow-2xs"
            />
          </div>
          <div>
            <label class="block text-[11px] font-black uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
              <span>📍</span>
              <span>Département d'implantation</span>
            </label>
            <select 
              id="onboarding-step2-dept-select"
              onchange="window.ProtecOnboarding.changeDepartment(this.value)"
              class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-pc-blue/40 cursor-pointer shadow-2xs">
              ${this.getDepartmentsList().map(d => `<option value="${d.code}" ${d.code === this.deptCode ? 'selected' : ''}>${d.code} - ${d.name} (${d.region})</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Légende opérationnelle de la carte -->
        <div class="flex items-center justify-between flex-wrap gap-2 px-1 text-[11px]">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-1 font-bold text-slate-700">
              <span class="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
              Votre Antenne
            </span>
            <span class="inline-flex items-center gap-1 font-bold text-indigo-700">
              <span class="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              Antennes Existantes
            </span>
            <span class="inline-flex items-center gap-1 font-bold text-rose-600">
              <span class="w-3 h-3 rounded-full bg-rose-200 border border-rose-500 inline-block"></span>
              Exclusion (${minKm} km)
            </span>
          </div>
          <span class="text-slate-500 font-medium">L'extérieur du département est verrouillé et grisé</span>
        </div>

        <!-- Cadre de la carte Leaflet interactive -->
        <div class="relative w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md">
          <div id="step2-onboarding-map" class="w-full h-full"></div>
          
          <div class="absolute top-2.5 left-2.5 z-[1000] px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur border border-slate-300 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5 pointer-events-none">
            <span class="text-pc-orange">📍</span>
            <span>Cliquez sur la carte ou déplacez le marqueur dans le département</span>
          </div>
        </div>

        <!-- Récapitulatif dynamique de l'emplacement et conformité -->
        <div id="step2-status-card" class="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-pc-blue text-white font-black text-base flex items-center justify-center shadow-xs">
              🏢
            </div>
            <div>
              <div class="text-sm font-black text-slate-900" id="step2-city-label">${this.placementData.city}</div>
              <div class="text-[11px] text-slate-600">
                Département ${this.deptCode} • <span class="font-mono text-slate-500" id="step2-coords-label">${this.placementData.lat.toFixed(4)}, ${this.placementData.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            onclick="window.ProtecOnboarding.resetMapPosition()"
            class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap">
            🎯 Recentrer la carte
          </button>
        </div>

        <!-- Boutons de navigation -->
        <div class="pt-2 flex items-center justify-between gap-3">
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(1)"
            class="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
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
  // ÉTAPE 3 : AMÉNAGEMENT DU BÂTIMENT (GESTION DES SALLES & PLACEMENT DU MOBILIER)
  // -------------------------------------------------------------
  renderStep3() {
    const currentMoney = 40000 - this.placedFurniture.reduce((sum, f) => sum + f.cost, 0);
    const activeRoom = this.roomsConfig.find(r => r.id === this.selectedRoomId) || this.roomsConfig[0];
    const activeRoomFurniture = this.placedFurniture.filter(f => f.room === activeRoom.id);

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <span class="text-2xl">🛋️</span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">3. Aménagement de votre Bâtiment d'Antenne</h2>
          <p class="text-xs text-slate-600 max-w-lg mx-auto">
            Le bâtiment est fourni vide. <strong>Définissez le type de chaque pièce</strong> et <strong>placez votre mobilier</strong> selon vos priorités opérationnelles !
          </p>
        </div>

        <!-- Dotation & Compteur d'équipement -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-300 flex items-center justify-between text-xs">
          <div>
            <span class="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">Dotation Municipale Disponible</span>
            <div class="text-lg font-black text-emerald-950 font-mono">${currentMoney.toLocaleString('fr-FR')} €</div>
          </div>
          <span class="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-bold text-xs shadow-2xs">
            ${this.placedFurniture.length} meuble(s) installé(s) au total
          </span>
        </div>

        <!-- PLAN 2D DU BÂTIMENT INTERACTIF (CLIQUABLE) -->
        ${this.renderStep3Plan2D()}

        <!-- GESTION DE LA SALLE SÉLECTIONNÉE (TYPE ET MEUBLES INSTALLÉS) -->
        <div class="p-4 rounded-2xl bg-slate-900 border-2 border-amber-400/80 shadow-md text-white space-y-3">
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

          <!-- Choix du Type de Salle -->
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
                    <span class="text-lg">${t.icon}</span>
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
                      <span class="text-lg">${f.icon}</span>
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
            <span class="text-xs font-black uppercase text-slate-800 tracking-wider">3. Catalogue de Mobilier • Ajouter à la ${activeRoom.name}</span>
            <span class="text-[11px] text-slate-500 font-semibold">Les meubles s'installent dans la pièce active</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${this.furnitureCatalog.map(item => {
              const totalCount = this.placedFurniture.filter(f => f.typeId === item.id).length;
              return `
                <div class="p-3 rounded-2xl glass-card bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2.5 hover:border-amber-300 transition">
                  <div class="flex items-center gap-2.5">
                    <span class="text-2xl">${item.icon}</span>
                    <div>
                      <h4 class="text-xs font-black text-slate-900">${item.name}</h4>
                      <p class="text-[10px] text-slate-500">${item.desc}</p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[10px] font-mono font-black text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">${item.cost} €</span>
                        ${totalCount > 0 ? `<span class="text-[9px] font-bold text-slate-500">${totalCount} acheté(s)</span>` : ''}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <button 
                      type="button" 
                      onclick="window.ProtecOnboarding.buyAndPlaceFurniture('${item.id}', '${activeRoom.id}')"
                      class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1">
                      <span>+ Placer dans ${activeRoom.name}</span>
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
            class="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
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
      this.renderWizard();
    }
  },

  buyAndPlaceFurniture(typeId, targetRoomId = null) {
    const item = this.furnitureCatalog.find(x => x.id === typeId);
    if (!item) return;

    const currentMoney = 40000 - this.placedFurniture.reduce((sum, f) => sum + f.cost, 0);
    if (currentMoney < item.cost) {
      window.ProtecDialog.alert("Dotation municipale insuffisante pour acheter ce meuble !", "Fonds Insuffisants");
      return;
    }

    const roomId = targetRoomId || this.selectedRoomId || 'room_1';

    this.placedFurniture.push({
      id: `furn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      typeId: item.id,
      name: item.name,
      cost: item.cost,
      icon: item.icon,
      room: roomId
    });

    this.renderWizard();
  },

  moveFurniture(furnId, newRoomId) {
    const f = this.placedFurniture.find(x => x.id === furnId);
    if (f) {
      f.room = newRoomId;
      this.renderWizard();
    }
  },

  removeFurniture(furnId) {
    const idx = this.placedFurniture.findIndex(x => x.id === furnId || x.typeId === furnId);
    if (idx !== -1) {
      this.placedFurniture.splice(idx, 1);
      this.renderWizard();
    }
  },

  renderStep3Plan2D() {
    const r1 = this.roomsConfig.find(r => r.id === 'room_1') || this.roomsConfig[0];
    const r2 = this.roomsConfig.find(r => r.id === 'room_2') || this.roomsConfig[1];
    const r3 = this.roomsConfig.find(r => r.id === 'room_3') || this.roomsConfig[2];

    const r1Furn = this.placedFurniture.filter(f => f.room === 'room_1');
    const r2Furn = this.placedFurniture.filter(f => f.room === 'room_2');
    const r3Furn = this.placedFurniture.filter(f => f.room === 'room_3');

    const isR1Active = this.selectedRoomId === 'room_1';
    const isR2Active = this.selectedRoomId === 'room_2';
    const isR3Active = this.selectedRoomId === 'room_3';

    return `
      <div class="relative w-full rounded-2xl bg-[#0a0e17] border-2 border-slate-800 p-2.5 shadow-xl select-none">
        <div class="flex items-center justify-between pb-1.5 px-1 text-slate-300 text-xs">
          <span class="font-black text-white uppercase tracking-wider text-[11px]">Plan 2D du Bâtiment • Cliquez sur une salle pour l'aménager</span>
          <span class="text-[10px] text-amber-400 font-bold">
            ${this.placedFurniture.length === 0 ? '⚠️ Bâtiment vide (cliquez sur une salle pour la meubler)' : `✓ ${this.placedFurniture.length} meuble(s) en place`}
          </span>
        </div>

        <svg viewBox="0 0 740 330" class="w-full h-auto max-h-[260px] block rounded-xl font-sans">
          <rect width="740" height="330" fill="#0a0e17" />

          <!-- PARKING EXTÉRIEUR -->
          <rect x="20" y="20" width="220" height="290" fill="#111724" stroke="#334155" stroke-width="1.5" stroke-dasharray="4 4" rx="6" />
          <text x="130" y="45" fill="#94a3b8" font-size="10" font-weight="900" text-anchor="middle">PARKING COUR EXTÉRIEURE</text>
          <text x="130" y="60" fill="#64748b" font-size="8" text-anchor="middle">Emplacements pour véhicules (0 véhicule au départ)</text>
          
          <rect x="35" y="75" width="190" height="100" fill="rgba(245, 158, 11, 0.04)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5 3" rx="5" />
          <text x="130" y="130" fill="#f59e0b" font-size="10" font-weight="800" text-anchor="middle">🅿️ EMPLACEMENT 01 (LIBRE)</text>

          <rect x="35" y="190" width="190" height="100" fill="rgba(245, 158, 11, 0.04)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5 3" rx="5" />
          <text x="130" y="245" fill="#f59e0b" font-size="10" font-weight="800" text-anchor="middle">🅿️ EMPLACEMENT 02 (LIBRE)</text>

          <!-- BÂTIMENT DE L'ANTENNE -->
          <rect x="260" y="20" width="460" height="290" fill="#0f172a" stroke="#1e293b" stroke-width="6" rx="4" />

          <!-- SALLE 1 : 19.3 m² (Cliquable) -->
          <g onclick="window.ProtecOnboarding.selectRoom('room_1')" style="cursor: pointer;">
            <rect x="264" y="24" width="222" height="126" 
              fill="${isR1Active ? '#1e293b' : '#131b2e'}" 
              stroke="${isR1Active ? '#f59e0b' : '#3b82f6'}" 
              stroke-width="${isR1Active ? '3.5' : '1.5'}" 
              rx="4" />
            <text x="375" y="45" fill="#ffffff" font-size="10.5" font-weight="900" text-anchor="middle">
              SALLE 1 (${r1.icon} ${r1.label.toUpperCase()}) • ${r1.area} m²
            </text>
            <text x="375" y="80" fill="#94a3b8" font-size="18" text-anchor="middle">
              ${r1Furn.map(f => f.icon).join(' ') || '<tspan fill="#64748b" font-size="10">(Pièce vide)</tspan>'}
            </text>
            <text x="375" y="130" fill="${isR1Active ? '#fbbf24' : '#38bdf8'}" font-size="9" font-weight="800" text-anchor="middle">
              ${isR1Active ? '📍 SALLE ACTIVE • ' : ''}${r1Furn.length} meuble(s) [Cliquez pour configurer]
            </text>
          </g>

          <!-- SALLE 2 : 20.2 m² (Cliquable) -->
          <g onclick="window.ProtecOnboarding.selectRoom('room_2')" style="cursor: pointer;">
            <rect x="496" y="24" width="220" height="126" 
              fill="${isR2Active ? '#1e293b' : '#131b2e'}" 
              stroke="${isR2Active ? '#f59e0b' : '#3b82f6'}" 
              stroke-width="${isR2Active ? '3.5' : '1.5'}" 
              rx="4" />
            <text x="606" y="45" fill="#ffffff" font-size="10.5" font-weight="900" text-anchor="middle">
              SALLE 2 (${r2.icon} ${r2.label.toUpperCase()}) • ${r2.area} m²
            </text>
            <text x="606" y="80" fill="#94a3b8" font-size="18" text-anchor="middle">
              ${r2Furn.map(f => f.icon).join(' ') || '<tspan fill="#64748b" font-size="10">(Pièce vide)</tspan>'}
            </text>
            <text x="606" y="130" fill="${isR2Active ? '#fbbf24' : '#38bdf8'}" font-size="9" font-weight="800" text-anchor="middle">
              ${isR2Active ? '📍 SALLE ACTIVE • ' : ''}${r2Furn.length} meuble(s) [Cliquez pour configurer]
            </text>
          </g>

          <!-- SALLE 3 : 45.1 m² (Cliquable) -->
          <g onclick="window.ProtecOnboarding.selectRoom('room_3')" style="cursor: pointer;">
            <rect x="264" y="158" width="452" height="148" 
              fill="${isR3Active ? '#1e293b' : '#131b2e'}" 
              stroke="${isR3Active ? '#f59e0b' : '#3b82f6'}" 
              stroke-width="${isR3Active ? '3.5' : '1.5'}" 
              rx="4" />
            <text x="490" y="180" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle">
              SALLE 3 (${r3.icon} ${r3.label.toUpperCase()}) • ${r3.area} m²
            </text>
            <text x="490" y="230" fill="#94a3b8" font-size="20" text-anchor="middle">
              ${r3Furn.map(f => f.icon).join(' ') || '<tspan fill="#64748b" font-size="11">(Pièce vide)</tspan>'}
            </text>
            <text x="490" y="285" fill="${isR3Active ? '#fbbf24' : '#38bdf8'}" font-size="9.5" font-weight="800" text-anchor="middle">
              ${isR3Active ? '📍 SALLE ACTIVE • ' : ''}${r3Furn.length} meuble(s) [Cliquez pour configurer]
            </text>
          </g>

          <!-- Cloisons -->
          <line x1="490" y1="20" x2="490" y2="154" stroke="#334155" stroke-width="5" />
          <line x1="260" y1="154" x2="720" y2="154" stroke="#334155" stroke-width="5" />
        </svg>
      </div>
    `;
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
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">4. Affiliation Nationale & Agrément AASC</h2>
          <p class="text-xs text-slate-600 max-w-lg mx-auto">
            Pour opérer légalement sur le terrain et être reconnu par l'État et le SAMU, votre antenne doit être officiellement affiliée à la Fédération Nationale de Protection Civile.
          </p>
        </div>

        <!-- CHARTE OFFICIELLE D'AFFILIATION FNPC -->
        <div class="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-blue-50/90 border-2 border-pc-blue/40 shadow-xl space-y-4 text-center">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <img src="logo_myprotec.png" alt="Protection Civile" class="h-10 object-contain" />
            <div class="text-right">
              <span class="text-[10px] font-black uppercase text-pc-blue tracking-wider block">Fédération Nationale de Protection Civile</span>
              <span class="text-[9px] text-slate-400">Agrément National de Sécurité Civile (Loi 2004-811)</span>
            </div>
          </div>

          <div class="space-y-2 py-2">
            <h3 class="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
              Charte d'Agrément & d'Affiliation Opérationnelle
            </h3>
            <p class="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
              Il est certifié que l'antenne locale <strong>« ${this.teamName} »</strong>, implantée dans le département de <strong>${deptName} (${this.deptCode})</strong>, sous la direction de <strong>${playerName}</strong>, est officiellement reconnue Association Agréée de Sécurité Civile (AASC).
            </p>
          </div>

          <!-- Zone officielle de signature ou Sceau de validation -->
          <div class="py-2">
            ${this.fnpcSigned ? `
              <div class="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <strong class="block text-xs font-black text-emerald-950 uppercase tracking-wider">AFFILIATION OFFICIELLEMENT HOMOLOGUÉE</strong>
                    <span class="text-[11px] text-emerald-700 font-semibold">Agrément AASC actif • Autorisation préfectorale d’opérer délivrée</span>
                  </div>
                </div>
                ${this.fnpcSignatureDataUrl ? `
                  <div class="h-14 w-32 bg-white/90 rounded-xl p-1.5 border border-emerald-300 flex flex-col items-center justify-center shadow-xs">
                    <img src="${this.fnpcSignatureDataUrl}" alt="Signature Directeur" class="max-h-full max-w-full object-contain" />
                    <span class="text-[7.5px] font-mono text-slate-400 font-bold uppercase mt-0.5">Paraphe Directeur</span>
                  </div>
                ` : ''}
              </div>
            ` : `
              <div id="onboarding-fnpc-signature-container" class="w-full max-w-xl mx-auto"></div>
            `}
          </div>

          <div class="pt-2 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
            <span>Agrément types A, B, C, D</span>
            <span>République Française • Ministère de l'Intérieur</span>
          </div>
        </div>

        <!-- Boutons de validation et lancement -->
        <div class="pt-2 flex items-center justify-between gap-3">
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(3)"
            class="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
            ⬅ Retour
          </button>
          
          <button 
            type="button" 
            ${!this.fnpcSigned ? 'disabled title="Veuillez d’abord signer l’affiliation FNPC ci-dessus avec la souris ou le doigt"' : ''}
            onclick="window.ProtecOnboarding.finalizeOfficialLaunch()"
            class="flex-1 py-4 rounded-2xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              this.fnpcSigned 
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-pc-blue text-white shadow-xl hover:brightness-110 active:scale-95 animate-pulse' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
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
      title: 'Paraphe & Signature Officielle du Directeur d’Antenne :',
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
          let rx = 7.0, ry = 2.5;
          if (f.room === 'room_2') { rx = 11.5; ry = 2.5; }
          else if (f.room === 'room_3') { rx = 9.0; ry = 7.0; }
          return {
            id: f.id,
            type: f.typeId,
            label: f.name,
            x: rx,
            y: ry,
            w: 1.2,
            d: 0.8,
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
          consumables: 100,
          armementLevel: 100,
          isRearmed: true,
          needsRearming: false,
          loadedItems: []
        };

    if (window.ProtecLogistique && typeof window.ProtecLogistique.normalizeVehicle === 'function') {
      window.ProtecLogistique.normalizeVehicle(starterVpsp);
    }

    game.vehicles = [starterVpsp];
    newStation.vehicles = [starterVpsp.id];

    // 3. Exactement 0 stock de consommables au départ
    game.logistics = {
      oxygenBottles: 0,
      aedPads: 0,
      woundKits: 0,
      cervicalCollars: 0
    };

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

    // Déduction des dépenses d'ameublement du trésor initial (40 000 €)
    const spentFurniture = this.placedFurniture.reduce((sum, f) => sum + f.cost, 0);
    game.resources.money = Math.max(5000, 40000 - spentFurniture);

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
