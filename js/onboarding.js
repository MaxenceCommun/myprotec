/**
 * PROTEC LIVE - ONBOARDING INITIAL EN 3 ÉTAPES (PREMIER LANCEMENT)
 * 
 * 1. Choix du nom de l'équipe de base (généré aléatoirement et modifiable)
 * 2. Gestion des espaces du local (affectation initiale des salles de la base)
 * 3. Présentation des objectifs (missions de démarrage & progression)
 * 
 * Ce module s'exécute avant d'afficher la carte et permet au joueur
 * de fonder et configurer son antenne de manière claire et guidée.
 */

window.ProtecOnboarding = {
  currentStep: 1,
  teamName: '',
  deptCode: '75',
  roomsConfig: {
    room_1: 'libre',
    room_2: 'libre',
    room_3: 'libre'
  },

  PREFIXES: [
    'Antenne Territoriale',
    'Unité Opérationnelle',
    'Détachement de Secours',
    'Section d’Intervention',
    'Équipe de Premiers Secours',
    'Poste Opérationnel',
    'Antenne Locale',
    'Compagnie de Sécurité Civile'
  ],

  NAMES: [
    'Alpha', 'Phénix', 'Horizon', 'Concorde', 'Aurore', 'Sentinelle',
    'Solidarité', 'Vanguard', 'Saint-Martin', 'Étoile', 'Littoral',
    'Fraternité', 'Secours 15', 'Vigilance', 'Bouclier', 'Espoir',
    'Alliance', 'Éclair', 'Saphir', 'Dauphin'
  ],

  generateRandomTeamName(deptCode = '75') {
    const p = this.PREFIXES[Math.floor(Math.random() * this.PREFIXES.length)];
    const n = this.NAMES[Math.floor(Math.random() * this.NAMES.length)];
    return `${p} ${n} (${deptCode})`;
  },

  showWizard(game) {
    this.game = game;
    this.currentStep = 1;
    this.deptCode = game.currentDepartmentCode || game.player?.departmentCode || '75';
    this.teamName = this.generateRandomTeamName(this.deptCode);

    // Initialiser les pièces par défaut
    this.roomsConfig = {
      room_1: 'libre',
      room_2: 'libre',
      room_3: 'libre'
    };

    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.zIndex = '99999';

    this.renderWizard();
  },

  rerollTeamName() {
    this.teamName = this.generateRandomTeamName(this.deptCode);
    const input = document.getElementById('onboarding-team-name-input');
    if (input) input.value = this.teamName;
  },

  onTeamNameInput(val) {
    this.teamName = val.trim() || `Antenne de Secours (${this.deptCode})`;
  },

  onDeptChange(val) {
    this.deptCode = val;
    this.teamName = this.generateRandomTeamName(this.deptCode);
    this.renderWizard();
  },

  onRoomChange(roomId, type) {
    this.roomsConfig[roomId] = type;
    this.renderWizard();
  },

  setStep(step) {
    // Validation étape 1
    if (this.currentStep === 1 && step > 1) {
      const input = document.getElementById('onboarding-team-name-input');
      if (input && input.value.trim()) {
        this.teamName = input.value.trim();
      }
    }
    this.currentStep = Math.max(1, Math.min(3, step));
    this.renderWizard();
  },

  renderWizard() {
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    let contentHTML = '';
    if (this.currentStep === 1) {
      contentHTML = this.renderStep1();
    } else if (this.currentStep === 2) {
      contentHTML = this.renderStep2();
    } else {
      contentHTML = this.renderStep3();
    }

    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl border-2 border-slate-300 text-slate-800 modal-fade-in space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <!-- Barre de progression des 3 étapes -->
        <div class="space-y-2 pb-3 border-b border-slate-200">
          <div class="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-400">
            <span>Procédure de Lancement Officiel</span>
            <span class="text-pc-blue font-bold">Étape ${this.currentStep} sur 3</span>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <!-- Étape 1 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 1 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : (this.currentStep > 1 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200')}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 1 ? 'bg-white text-pc-blue' : (this.currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600')}">
                ${this.currentStep > 1 ? '✓' : '1'}
              </span>
              <span class="text-[11px] font-bold truncate">Nom de l'équipe</span>
            </div>

            <!-- Étape 2 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 2 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : (this.currentStep > 2 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-400 border-slate-200')}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 2 ? 'bg-white text-pc-blue' : (this.currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600')}">
                ${this.currentStep > 2 ? '✓' : '2'}
              </span>
              <span class="text-[11px] font-bold truncate">Espaces du local</span>
            </div>

            <!-- Étape 3 -->
            <div class="p-2 rounded-xl border flex items-center gap-2 ${this.currentStep === 3 ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : 'bg-slate-100 text-slate-400 border-slate-200'}">
              <span class="w-5 h-5 rounded-lg flex items-center justify-center font-black text-xs ${this.currentStep === 3 ? 'bg-white text-pc-blue' : 'bg-slate-300 text-slate-600'}">
                3
              </span>
              <span class="text-[11px] font-bold truncate">Objectifs</span>
            </div>
          </div>
        </div>

        <!-- Contenu de l'étape active -->
        <div class="space-y-5">
          ${contentHTML}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // --- ÉTAPE 1 : CHOIX DU NOM DE L'ÉQUIPE DE BASE ---
  renderStep1() {
    const depts = window.ProtecDepartements?.DEPARTEMENTS_DATA || [
      { code: '75', name: 'Paris', region: 'Île-de-France' },
      { code: '69', name: 'Rhône', region: 'Auvergne-Rhône-Alpes' },
      { code: '13', name: 'Bouches-du-Rhône', region: 'PACA' },
      { code: '33', name: 'Gironde', region: 'Nouvelle-Aquitaine' },
      { code: '59', name: 'Nord', region: 'Hauts-de-France' },
      { code: '31', name: 'Haute-Garonne', region: 'Occitanie' }
    ];

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <img src="logo_myprotec.png" alt="MyProtec" class="h-14 sm:h-16 object-contain drop-shadow-md mx-auto" />
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">1. Fondez votre Équipe Opérationnelle</h2>
          <p class="text-xs text-slate-600 max-w-md mx-auto">
            Choisissez l'appellation de votre antenne locale. Vous pouvez utiliser le nom généré automatiquement ou le modifier à votre guise.
          </p>
        </div>

        <!-- Champ du nom de l'équipe avec bouton de tirage aléatoire -->
        <div class="p-4 rounded-2xl glass-card space-y-3 bg-white/90">
          <label class="block text-xs font-black text-slate-800 uppercase tracking-wider">
            Nom officiel de l'antenne / équipe :
          </label>

          <div class="flex items-center gap-2">
            <input 
              id="onboarding-team-name-input"
              type="text" 
              value="${this.teamName.replace(/"/g, '&quot;')}"
              oninput="window.ProtecOnboarding.onTeamNameInput(this.value)"
              placeholder="Ex: Antenne Territoriale Phénix (75)"
              class="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-pc-blue focus:ring-2 focus:ring-pc-blue/30 text-sm font-black text-slate-900 bg-white"
            />
            <button 
              type="button" 
              onclick="window.ProtecOnboarding.rerollTeamName()" 
              class="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs border border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Générer un autre nom aléatoire">
              <span>🎲</span>
              <span class="hidden sm:inline">Autre nom</span>
            </button>
          </div>

          <!-- Choix du département -->
          <div class="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span class="font-bold text-slate-600">Département d'implantation :</span>
            <select 
              onchange="window.ProtecOnboarding.onDeptChange(this.value)"
              class="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-black text-slate-900 bg-white">
              ${depts.map(d => `
                <option value="${d.code}" ${this.deptCode === d.code ? 'selected' : ''}>
                  ${d.code} - ${d.name} (${d.region})
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Dotation initiale municipale & Équipe constitutive -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Dotation -->
          <div class="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 text-xs space-y-1">
            <span class="text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1">
              <span>💰</span> Dotation Municipale Initiale
            </span>
            <div class="text-lg font-black text-emerald-950 font-mono">15 000 €</div>
            <p class="text-[11px] text-emerald-700 leading-tight">
              Subvention d'équipement accordée pour l'ouverture de votre antenne locale.
            </p>
          </div>

          <!-- Effectif de départ -->
          <div class="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 text-xs space-y-1">
            <span class="text-[10px] font-black uppercase text-blue-900 tracking-wider flex items-center gap-1">
              <span>👥</span> Équipage de Secours Fondateur
            </span>
            <div class="text-sm font-black text-blue-950">5 Bénévoles Qualifiés</div>
            <p class="text-[11px] text-blue-700 leading-tight">
              1 Chef d'Équipe (CE), 2 Équipiers Secouristes (PSE2) et 2 Secouristes (PSE1).
            </p>
          </div>
        </div>

        <!-- Bouton Étape Suivante -->
        <div class="pt-2">
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(2)"
            class="w-full py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-lg hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer">
            <span>Valider le nom et configurer les locaux</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;
  },

  // --- ÉTAPE 2 : GESTION DES ESPACES DU LOCAL ---
  renderStep2() {
    const roomDefs = [
      { id: 'room_1', name: 'Salle 1 (Espace Principal)', surface: '48 m²', defaultType: this.roomsConfig.room_1 },
      { id: 'room_2', name: 'Salle 2 (Espace Secondaire)', surface: '35 m²', defaultType: this.roomsConfig.room_2 },
      { id: 'room_3', name: 'Salle 3 (Annexe Technique)', surface: '24 m²', defaultType: this.roomsConfig.room_3 }
    ];

    const typeLabels = {
      'libre': { label: '⚪ Salle Libre (Non affectée)', desc: 'Pièce vide prête à être aménagée selon les besoins futurs.' },
      'garage': { label: '🚒 Garage & Logistique Véhicules', desc: 'Permet d’abriter les vecteurs et d’accélérer les départs d’urgence.' },
      'logistique': { label: '📦 Stockage & Pharmacie d’Urgence', desc: 'Entrepose les bouteilles d’O2, DAE, trousses de soins et lots PMA.' },
      'vie': { label: '☕ Foyer de Repos & Vestiaires', desc: 'Espace de convivialité des secouristes, réduit la fatigue et le stress.' },
      'formation': { label: '🎓 Salle de Formation & Cours', desc: 'Permet d’accueillir les sessions PSC1, SST et recyclages PSE.' }
    };

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <span class="text-2xl">📐</span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">2. Gestion des Espaces du Local</h2>
          <p class="text-xs text-slate-600 max-w-md mx-auto">
            Le bâtiment de base est prêt. C'est à vous d'affecter la vocation de chaque salle. L'agencement initial est validé sans frais ; toute modification ultérieure aura un coût.
          </p>
        </div>

        <!-- Avertissement aménagement -->
        <div class="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <span class="text-base">⚠️</span>
          <div class="leading-relaxed">
            <strong>Règle d'aménagement :</strong> Par défaut, les salles sont libres. Vous pouvez affecter vos pièces dès maintenant ou les laisser libres pour décider plus tard.
          </div>
        </div>

        <!-- Liste des 3 salles configurables -->
        <div class="space-y-3">
          ${roomDefs.map((rm, idx) => `
            <div class="p-4 rounded-2xl glass-card border border-slate-300 space-y-2 bg-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-lg bg-pc-blue/10 text-pc-blue font-black text-xs flex items-center justify-center">${idx + 1}</span>
                  <div>
                    <h4 class="text-xs font-black text-slate-900">${rm.name}</h4>
                    <span class="text-[10px] text-slate-400 font-semibold">${rm.surface} utiles</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${this.roomsConfig[rm.id] === 'libre' ? 'bg-slate-100 text-slate-600 border border-slate-300' : 'bg-pc-blue/10 text-pc-blue border border-pc-blue/30'}">
                  ${this.roomsConfig[rm.id] === 'libre' ? 'Libre' : this.roomsConfig[rm.id]}
                </span>
              </div>

              <!-- Sélecteur de vocation -->
              <select 
                onchange="window.ProtecOnboarding.onRoomChange('${rm.id}', this.value)"
                class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white transition cursor-pointer">
                <option value="libre" ${this.roomsConfig[rm.id] === 'libre' ? 'selected' : ''}>⚪ Salle Libre (Non affectée)</option>
                <option value="garage" ${this.roomsConfig[rm.id] === 'garage' ? 'selected' : ''}>🚒 Garage & Véhicules</option>
                <option value="logistique" ${this.roomsConfig[rm.id] === 'logistique' ? 'selected' : ''}>📦 Logistique & Stockage Pharmacie</option>
                <option value="vie" ${this.roomsConfig[rm.id] === 'vie' ? 'selected' : ''}>☕ Foyer & Vestiaires Secouristes</option>
                <option value="formation" ${this.roomsConfig[rm.id] === 'formation' ? 'selected' : ''}>🎓 Salle de Formation & Pédagogie</option>
              </select>

              <p class="text-[10.5px] text-slate-500 italic">
                ${typeLabels[this.roomsConfig[rm.id]]?.desc || ''}
              </p>
            </div>
          `).join('')}
        </div>

        <!-- Emplacements Parking extérieur -->
        <div class="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base">🅿️</span>
            <div>
              <span class="font-black text-slate-800 block">Stationnement Véhicules (Cour / Abri)</span>
              <span class="text-[10px] text-slate-500">2 emplacements de parking réservés (Emplacement 01 et 02)</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">2 Places Libres</span>
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
            <span>Valider les locaux & Voir les objectifs</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;
  },

  // --- ÉTAPE 3 : PRÉSENTATION DES OBJECTIFS ---
  renderStep3() {
    const starterTasks = [
      { icon: '📜', title: 'Souscrire la Convention Préfectorale d’AASC (800 €)', desc: 'Base légale indispensable pour opérer : signer la convention d’agrément avec la Préfecture.', reward: '+1 000 €' },
      { icon: '🚑', title: 'Acquérir votre 1er véhicule opérationnel', desc: 'Commander une ambulance VPSP (5 places) ou un utilitaire VTU (3 places).', reward: '+600 €' },
      { icon: '📦', title: 'Équiper l’antenne en matériel de secours', desc: 'Acheter les premiers consommables (Oxygène O2, électrodes DAE, trousses de soins).', reward: '+400 €' },
      { icon: '📢', title: 'Publier 1 offre de recrutement', desc: 'Recruter un jeune en Service Civique ou un cadre opérationnel salarié.', reward: '+500 €' },
      { icon: '📐', title: 'Aménager le local sur le Plan 2D CAD', desc: 'Disposer le mobilier et affecter les salles selon vos missions.', reward: '+750 €' }
    ];

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <span class="text-2xl">🎯</span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">3. Présentation des Objectifs de Départ</h2>
          <p class="text-xs text-slate-600 max-w-md mx-auto">
            Voici vos 5 missions de lancement pour structurer votre antenne et amorcer vos premières interventions opérationnelles :
          </p>
        </div>

        <!-- Liste des 5 objectifs prioritaires -->
        <div class="space-y-2">
          ${starterTasks.map((t, idx) => `
            <div class="p-3 rounded-2xl glass-card border border-slate-200 flex items-center justify-between gap-3 bg-white hover:border-slate-300 transition">
              <div class="flex items-center gap-3">
                <span class="text-xl flex-shrink-0">${t.icon}</span>
                <div>
                  <h4 class="text-xs font-black text-slate-900">${t.title}</h4>
                  <p class="text-[10px] text-slate-500 font-medium">${t.desc}</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-xl text-xs font-black font-mono text-emerald-700 bg-emerald-50 border border-emerald-300 flex-shrink-0">
                ${t.reward}
              </span>
            </div>
          `).join('')}
        </div>

        <!-- Principe d'évolution dynamique -->
        <div class="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
          <span class="font-black flex items-center gap-1.5 text-indigo-900">
            <span>📈</span> Système d'Évolution de l'Antenne
          </span>
          <p class="text-[11px] text-indigo-800 leading-relaxed">
            Plus votre antenne grandit, plus les tâches deviennent importantes (réquisitions préfectorales, interventions NOVI, gardes SAMU) et plus les subventions fédérales et récompenses augmentent !
          </p>
        </div>

        <!-- Boutons de validation finale -->
        <div class="pt-2 flex items-center justify-between gap-3">
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.setStep(2)"
            class="px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
            ⬅ Retour
          </button>
          <button 
            type="button" 
            onclick="window.ProtecOnboarding.finalizeOnboarding()"
            class="flex-1 py-4 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-pc-blue text-white shadow-xl hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer animate-pulse">
            <span>Valider et Découvrir la Carte</span>
            <span>🚀</span>
          </button>
        </div>
      </div>
    `;
  },

  // Finalisation et création de l'antenne
  finalizeOnboarding() {
    const game = this.game || window.game;
    if (!game) return;

    const deptCode = this.deptCode || '75';
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(deptCode) : null;
    const lat = deptInfo ? deptInfo.lat : 48.8566;
    const lng = deptInfo ? deptInfo.lng : 2.3522;
    const stationId = `station-${Date.now()}`;
    const stationName = this.teamName || `Antenne Territoriale (${deptCode})`;

    const newStation = {
      id: stationId,
      name: stationName,
      departmentCode: deptCode,
      city: deptInfo?.name || deptCode,
      citycode: deptCode,
      lat: lat,
      lng: lng,
      isMain: true,
      level: 1,
      rooms: {
        formation: this.roomsConfig.room_1 === 'formation' || this.roomsConfig.room_2 === 'formation' || this.roomsConfig.room_3 === 'formation',
        standard: true
      },
      vehicles: [],
      stock: {},
      initialSetupDone: true
    };

    // Configuration des locaux d'architecte
    if (window.ProtecLocaux) {
      const archModel = JSON.parse(JSON.stringify(window.ProtecLocaux.getArchitectModel()));
      if (archModel && archModel.rooms && archModel.rooms.length >= 3) {
        archModel.rooms[0].type = this.roomsConfig.room_1 || 'libre';
        archModel.rooms[1].type = this.roomsConfig.room_2 || 'libre';
        archModel.rooms[2].type = this.roomsConfig.room_3 || 'libre';
      }
      newStation.premises = {
        buildingId: 'base_standard',
        name: `Local Opérationnel - ${stationName}`,
        tenure: 'rented',
        monthlyRent: 850,
        surfaceM2: 125,
        architecture: archModel
      };
    }

    // 1. Zéro véhicule au départ
    game.vehicles = [];
    newStation.vehicles = [];

    // 2. Zéro stock au départ
    game.logistics = { oxygenBottles: 0, aedPads: 0, woundKits: 0, cervicalCollars: 0 };

    // 3. Zéro convention au départ (ni AASC, ni partenaires)
    game.aascConvention = { signed: false, signedAt: null, cost: 800 };
    game.samuConvention = { signed: false, signedAt: null, totalInterventions: 0 };
    game.sdisConvention = { signed: false, signedAt: null, totalInterventions: 0 };
    game.sncfConvention = { signed: false, signedAt: null, totalInterventions: 0 };
    game.cumpConvention = { signed: false, signedAt: null, totalMissions: 0, successfulMissions: 0, normCompliant: false };
    game.sdisGarde = { active: false, vehicleId: null, caserneCrew: [], astreinteCrew: [], mode: 'poste' };

    // 4. Exactement 5 bénévoles constitutifs
    const starters = [
      { name: 'Alexandre Roux', role: 'Chef d’Équipe', rank: 'CE', exp: 30, isTrainer: false, avatar: '👨‍💼', dispoType: 'salarié', dispoJours: ['Vendredi', 'Samedi', 'Dimanche'], motivation: 85, skills: ['ce', 'pse2', 'pse1', 'permis_b'] },
      { name: 'Sarah Benali', role: 'Équipier Secouriste', rank: 'PSE2', exp: 25, isTrainer: false, avatar: '👩‍🚒', dispoType: 'étudiante', dispoJours: ['Mardi', 'Samedi', 'Dimanche'], motivation: 80, skills: ['pse2', 'pse1', 'permis_b'] },
      { name: 'Thomas Girard', role: 'Équipier Secouriste', rank: 'PSE2', exp: 20, isTrainer: false, avatar: '🧑‍🚒', dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'], motivation: 80, skills: ['pse2', 'pse1'] },
      { name: 'Lucas Martin', role: 'Secouriste', rank: 'PSE1', exp: 15, isTrainer: false, avatar: '🙋‍♂️', dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'], motivation: 75, skills: ['pse1', 'permis_b'] },
      { name: 'Élodie Leroy', role: 'Secouriste', rank: 'PSE1', exp: 10, isTrainer: false, avatar: '🧑', dispoType: 'étudiante', dispoJours: ['Mercredi', 'Vendredi', 'Samedi'], motivation: 85, skills: ['pse1'] }
    ];

    game.volunteers = starters.map(s => ({
      id: `vol-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: s.name,
      role: s.role,
      rank: s.rank,
      exp: s.exp,
      energy: 100,
      motivation: s.motivation,
      humeur: 85,
      contractType: 'benevole',
      profilSocial: s.dispoType === 'étudiante' ? 'etudiant' : 'salarie',
      status: 'dispo',
      stationId: stationId,
      isTrainer: s.isTrainer,
      avatar: s.avatar,
      dispoType: s.dispoType,
      dispoJours: s.dispoJours,
      skills: s.skills || []
    }));

    game.stations = [newStation];

    // Fermer le modal d'onboarding
    const modal = document.getElementById('onboarding-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    // Sauvegarde et mise à jour complète de l'interface
    game.saveGame();
    game.updateStatsUI();
    game.renderStations();
    game.renderMissions();

    // Centrer et afficher la carte Leaflet
    if (game.map) {
      game.map.setView([lat, lng], 13);
      setTimeout(() => {
        game.map.invalidateSize();
      }, 250);
    }

    game.showToast('Antenne Inaugurée ! 🎉', `Bienvenue à « ${stationName} » ! Suivez le guide pour souscrire votre convention AASC.`, 'green');

    // Démarrer le tutoriel interactif de démarrage
    if (window.ProtecTutorial) {
      setTimeout(() => {
        window.ProtecTutorial.start(game);
      }, 500);
    }
  }
};
