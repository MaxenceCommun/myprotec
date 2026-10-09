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
  deptCode: '75',
  game: null,

  // 1. Équipe fondatrice personnalisable (5 bénévoles constitutifs)
  volunteersList: [
    { id: 'vol_1', name: 'Alexandre Roux', role: 'Chef d’Équipe', rank: 'CE', avatar: '👨‍💼', skills: ['ce', 'pse2', 'pse1', 'permis_b'], exp: 30, motivation: 85, dispoType: 'salarié', dispoJours: ['Vendredi', 'Samedi', 'Dimanche'] },
    { id: 'vol_2', name: 'Sarah Benali', role: 'Équipier Secouriste', rank: 'PSE2', avatar: '👩‍🚒', skills: ['pse2', 'pse1', 'permis_b'], exp: 25, motivation: 80, dispoType: 'étudiante', dispoJours: ['Mardi', 'Samedi', 'Dimanche'] },
    { id: 'vol_3', name: 'Thomas Girard', role: 'Équipier Secouriste', rank: 'PSE2', avatar: '🧑‍🚒', skills: ['pse2', 'pse1'], exp: 20, motivation: 80, dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'] },
    { id: 'vol_4', name: 'Lucas Martin', role: 'Secouriste', rank: 'PSE1', avatar: '🙋‍♂️', skills: ['pse1', 'permis_b'], exp: 15, motivation: 75, dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'] },
    { id: 'vol_5', name: 'Élodie Leroy', role: 'Secouriste', rank: 'PSE1', avatar: '👩', skills: ['pse1'], exp: 10, motivation: 85, dispoType: 'étudiante', dispoJours: ['Mercredi', 'Vendredi', 'Samedi'] }
  ],

  // 2. Coordonnées de placement sur la carte
  placementData: {
    lat: 48.8566,
    lng: 2.3522,
    city: 'Paris',
    citycode: '75'
  },
  step2Map: null,
  step2Marker: null,

  // 3. Mobilier acheté et typage des pièces du bâtiment (initialement VIDE)
  placedFurniture: [],
  selectedRoomId: 'room_1',
  roomsConfig: [
    { id: 'room_1', name: 'Salle 1', type: 'bureau', label: 'Bureau & Direction', area: 19.3, icon: '💼', color: '#131b2e' },
    { id: 'room_2', name: 'Salle 2', type: 'formation', label: 'Salle de Formation', area: 20.2, icon: '🎓', color: '#131b2e' },
    { id: 'room_3', name: 'Salle 3', type: 'stockage', label: 'Stockage & Logistique', area: 45.1, icon: '📦', color: '#131b2e' }
  ],
  roomTypesList: [
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

  // Initialisation du Tuto à 4 étapes
  showWizard(game, options = {}) {
    this.game = game || window.game;
    this.currentStep = 1;
    this.fnpcSigned = false;

    if (options.teamName) this.teamName = options.teamName;
    else if (this.game?.player?.stationName) this.teamName = this.game.player.stationName;

    if (options.deptCode) this.deptCode = options.deptCode;
    else if (this.game?.currentDepartmentCode || this.game?.player?.departmentCode) {
      this.deptCode = this.game.currentDepartmentCode || this.game.player.departmentCode;
    }

    // Centrer initialement l'emplacement sur le chef-lieu du département
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    this.placementData.lat = deptInfo ? deptInfo.lat : 48.8566;
    this.placementData.lng = deptInfo ? deptInfo.lng : 2.3522;
    this.placementData.city = deptInfo ? deptInfo.chefLieu : 'Antenne Centrale';
    this.placementData.citycode = this.deptCode;

    // Le bâtiment démarre TOTALEMENT VIDE avec les pièces de base prêtes à être configurées
    this.placedFurniture = [];
    this.selectedRoomId = 'room_1';
    this.roomsConfig = [
      { id: 'room_1', name: 'Salle 1', type: 'bureau', label: 'Bureau & Direction', area: 19.3, icon: '💼', color: '#131b2e' },
      { id: 'room_2', name: 'Salle 2', type: 'formation', label: 'Salle de Formation', area: 20.2, icon: '🎓', color: '#131b2e' },
      { id: 'room_3', name: 'Salle 3', type: 'stockage', label: 'Stockage & Logistique', area: 45.1, icon: '📦', color: '#131b2e' }
    ];

    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.zIndex = '99999';

    this.renderWizard();
  },

  setStep(step) {
    this.currentStep = Math.max(1, Math.min(4, step));
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
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">1. Présentation de votre Équipe de Base</h2>
          <p class="text-xs text-slate-600 max-w-lg mx-auto">
            Voici les 5 bénévoles constitutifs qui fondent votre antenne avec vous. Vous pouvez personnaliser leurs noms et avatars avant de démarrer.
          </p>
        </div>

        <!-- Liste des 5 secouristes personnalisables -->
        <div class="space-y-2.5">
          ${this.volunteersList.map((vol, idx) => `
            <div class="p-3.5 rounded-2xl glass-card bg-white/95 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <!-- Avatar avec menu de sélection -->
                <div class="relative group">
                  <button type="button" class="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 text-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer shadow-xs" title="Changer l'avatar">
                    ${vol.avatar}
                  </button>
                  <div class="hidden group-hover:flex absolute left-0 top-full mt-1 z-30 p-1.5 rounded-xl bg-white shadow-xl border border-slate-200 gap-1 flex-wrap w-44">
                    ${avatarChoices.map(av => `
                      <button type="button" onclick="window.ProtecOnboarding.updateVolunteerAvatar('${vol.id}', '${av}')" class="w-7 h-7 rounded-lg hover:bg-blue-50 text-base flex items-center justify-center transition cursor-pointer">
                        ${av}
                      </button>
                    `).join('')}
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

  // -------------------------------------------------------------
  // ÉTAPE 2 : PLACEMENT DU BÂTIMENT SUR LA CARTE
  // -------------------------------------------------------------
  renderStep2() {
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    const deptName = deptInfo ? deptInfo.name : this.deptCode;

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <span class="text-2xl">🗺️</span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">2. Placement de votre Bâtiment sur la Carte</h2>
          <p class="text-xs text-slate-600 max-w-lg mx-auto">
            Définissez l'emplacement officiel de votre local d'antenne dans le département <strong>${deptName} (${this.deptCode})</strong>.
          </p>
        </div>

        <!-- Cadre de la carte Leaflet interactive -->
        <div class="relative w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border-2 border-slate-300 shadow-md">
          <div id="step2-onboarding-map" class="w-full h-full"></div>
          
          <div class="absolute top-2.5 left-2.5 z-[1000] px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur border border-slate-200 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1.5 pointer-events-none">
            <span class="text-pc-orange">📍</span>
            <span>Cliquez sur la carte pour positionner votre antenne</span>
          </div>
        </div>

        <!-- Récapitulatif de l'emplacement sélectionné -->
        <div class="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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
            onclick="window.ProtecOnboarding.resetToChefLieu()"
            class="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs whitespace-nowrap">
            🎯 Recentrer sur ${deptInfo?.chefLieu || 'le chef-lieu'}
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
            onclick="window.ProtecOnboarding.setStep(3)"
            class="flex-1 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">
            <span>Valider l'emplacement & Aménager le bâtiment</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;
  },

  initStep2Map() {
    const mapEl = document.getElementById('step2-onboarding-map');
    if (!mapEl || !window.L) return;

    if (this.step2Map) {
      this.step2Map.remove();
      this.step2Map = null;
    }

    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    const initialLat = this.placementData.lat || (deptInfo ? deptInfo.lat : 48.8566);
    const initialLng = this.placementData.lng || (deptInfo ? deptInfo.lng : 2.3522);
    const initialZoom = deptInfo ? deptInfo.zoom : 11;

    this.step2Map = L.map('step2-onboarding-map', {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.step2Map);

    const markerIcon = L.divIcon({
      className: 'clean-marker',
      html: `
        <div style="background:#ea580c; border:2px solid white; border-radius:12px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:16px;">
          🏢
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    this.step2Marker = L.marker([initialLat, initialLng], { icon: markerIcon, draggable: true }).addTo(this.step2Map);

    this.step2Marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      this.updatePlacementCoords(pos.lat, pos.lng);
    });

    this.step2Map.on('click', (e) => {
      this.step2Marker.setLatLng(e.latlng);
      this.updatePlacementCoords(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => {
      if (this.step2Map) this.step2Map.invalidateSize();
    }, 200);
  },

  async updatePlacementCoords(lat, lng) {
    this.placementData.lat = lat;
    this.placementData.lng = lng;

    const coordsEl = document.getElementById('step2-coords-label');
    if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const detectedCity = props.district || props.city || `Secteur ${this.deptCode}`;
        this.placementData.city = detectedCity;
        this.placementData.citycode = props.citycode || this.deptCode;
        const cityEl = document.getElementById('step2-city-label');
        if (cityEl) cityEl.textContent = detectedCity;
      }
    } catch (e) {
      // Ignorer si hors-ligne
    }
  },

  resetToChefLieu() {
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.deptCode) : null;
    if (!deptInfo) return;

    this.placementData.lat = deptInfo.lat;
    this.placementData.lng = deptInfo.lng;
    this.placementData.city = deptInfo.chefLieu;

    if (this.step2Map && this.step2Marker) {
      this.step2Map.setView([deptInfo.lat, deptInfo.lng], deptInfo.zoom || 11);
      this.step2Marker.setLatLng([deptInfo.lat, deptInfo.lng]);
    }
    const cityEl = document.getElementById('step2-city-label');
    if (cityEl) cityEl.textContent = deptInfo.chefLieu;
    const coordsEl = document.getElementById('step2-coords-label');
    if (coordsEl) coordsEl.textContent = `${deptInfo.lat.toFixed(4)}, ${deptInfo.lng.toFixed(4)}`;
  },

  // -------------------------------------------------------------
  // ÉTAPE 3 : AMÉNAGEMENT DU BÂTIMENT (GESTION DES SALLES & PLACEMENT DU MOBILIER)
  // -------------------------------------------------------------
  renderStep3() {
    const currentMoney = 15000 - this.placedFurniture.reduce((sum, f) => sum + f.cost, 0);
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

    const currentMoney = 15000 - this.placedFurniture.reduce((sum, f) => sum + f.cost, 0);
    if (currentMoney < item.cost) {
      alert("Dotation municipale insuffisante pour acheter ce meuble !");
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
    const deptCode = this.deptCode || '75';
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(deptCode) : null;
    const lat = this.placementData.lat || (deptInfo ? deptInfo.lat : 48.8566);
    const lng = this.placementData.lng || (deptInfo ? deptInfo.lng : 2.3522);
    const city = this.placementData.city || (deptInfo ? deptInfo.chefLieu : 'Antenne Centrale');

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

    // 2. Exactement 0 véhicule au départ
    game.vehicles = [];
    newStation.vehicles = [];

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

    // 5. Enregistrement des 5 bénévoles constitutifs personnalisés
    game.volunteers = this.volunteersList.map(v => ({
      id: `vol-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: v.name,
      role: v.role,
      rank: v.rank,
      exp: v.exp,
      energy: 100,
      motivation: v.motivation,
      humeur: 85,
      contractType: 'benevole',
      profilSocial: v.dispoType === 'étudiante' ? 'etudiant' : 'salarie',
      status: 'dispo',
      stationId: stationId,
      avatar: v.avatar,
      dispoType: v.dispoType,
      dispoJours: v.dispoJours,
      skills: v.skills || []
    }));

    game.stations = [newStation];

    // Déduction des dépenses d'ameublement du trésor initial (15 000 €)
    const spentFurniture = this.placedFurniture.reduce((sum, f) => sum + f.cost, 0);
    game.resources.money = Math.max(2000, 15000 - spentFurniture);

    // Mettre à jour l'identité du joueur
    if (game.player) {
      game.player.stationName = stationName;
      game.player.departmentCode = deptCode;
      game.player.city = city;
    }
    game.currentDepartmentCode = deptCode;
    localStorage.setItem('protec_department_code', deptCode);

    // Synchronisation immédiate vers la BDD Supabase (table players)
    if (window.ProtecSupabase && window.ProtecSupabase.client) {
      const pid = (game.player && game.player.id) || localStorage.getItem('protec_player_id');
      if (pid) {
        window.ProtecSupabase.updatePlayerCityAndStation(pid, city, stationName, deptCode).catch(e => console.warn(e));
      }
    }

    // Fermer définitivement le modal d'onboarding
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
