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
  deptSearchQuery: '',
  roomsConfig: {
    room_1: 'libre',
    room_2: 'libre',
    room_3: 'libre'
  },

  showWizard(game) {
    this.game = game;
    this.currentStep = 1;
    this.deptCode = game.currentDepartmentCode || game.player?.departmentCode || '75';
    this.deptSearchQuery = '';
    this.teamName = this.teamName || '';

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

  onTeamNameInput(val) {
    this.teamName = val;
  },

  onDeptSearch(val) {
    this.deptSearchQuery = val || '';
    const depts = (window.ProtecDepartements && window.ProtecDepartements.list && window.ProtecDepartements.list.length > 0)
      ? window.ProtecDepartements.list
      : ((window.ProtecDepartements && window.ProtecDepartements.DEPARTEMENTS_DATA) || []);
    const listEl = document.getElementById('onboarding-depts-list');
    if (listEl) {
      listEl.innerHTML = this.renderDeptListItems(depts, this.deptSearchQuery);
    }
  },

  selectDepartment(code) {
    this.deptCode = code;
    const depts = (window.ProtecDepartements && window.ProtecDepartements.list && window.ProtecDepartements.list.length > 0)
      ? window.ProtecDepartements.list
      : ((window.ProtecDepartements && window.ProtecDepartements.DEPARTEMENTS_DATA) || []);
    const currentDept = depts.find(d => d.code === code) || depts[0];

    // Mettre à jour la carte d'affichage du département actif
    const cardEl = document.getElementById('onboarding-selected-dept-card');
    if (cardEl && currentDept) {
      cardEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-pc-blue text-white font-black text-sm flex items-center justify-center shadow-sm">
            ${currentDept.code}
          </div>
          <div>
            <div class="text-sm font-black text-slate-900">${currentDept.name}</div>
            <div class="text-[11px] font-medium text-slate-500">Région : ${currentDept.region}</div>
          </div>
        </div>
        <span class="text-xs font-black text-pc-blue bg-white px-2.5 py-1 rounded-lg border border-pc-blue/20 shadow-xs">
          Sélectionné ✓
        </span>
      `;
    }

    // Mettre à jour la liste des éléments
    const listEl = document.getElementById('onboarding-depts-list');
    if (listEl) {
      listEl.innerHTML = this.renderDeptListItems(depts, this.deptSearchQuery);
    }
  },

  renderDeptListItems(depts, query = '') {
    const q = (query || '').trim().toLowerCase();
    const filtered = depts.filter(d => {
      if (!q) return true;
      return d.code.toLowerCase().includes(q) || 
             d.name.toLowerCase().includes(q) || 
             d.region.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      return `
        <div class="p-3 text-center text-xs text-slate-500 font-medium">
          Aucun département trouvé pour « ${query} ».
        </div>
      `;
    }

    return filtered.map(d => {
      const isSelected = d.code === this.deptCode;
      return `
        <button 
          type="button" 
          onclick="window.ProtecOnboarding.selectDepartment('${d.code}')"
          class="w-full p-2.5 rounded-lg flex items-center justify-between text-left transition cursor-pointer ${
            isSelected 
              ? 'bg-pc-blue text-white font-black shadow-xs' 
              : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-200/80 font-bold'
          }">
          <div class="flex items-center gap-2.5 truncate">
            <span class="px-2 py-0.5 rounded text-xs font-black ${
              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-pc-blue'
            }">
              ${d.code}
            </span>
            <span class="text-xs truncate">${d.name}</span>
            <span class="text-[10px] opacity-75 truncate">(${d.region})</span>
          </div>
          ${isSelected ? '<span class="text-xs font-black">✓</span>' : ''}
        </button>
      `;
    }).join('');
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

  // --- ÉTAPE 1 : CHOIX DU NOM DE L'ANTENNE ---
  renderStep1() {
    const depts = (window.ProtecDepartements && window.ProtecDepartements.list && window.ProtecDepartements.list.length > 0)
      ? window.ProtecDepartements.list
      : ((window.ProtecDepartements && window.ProtecDepartements.DEPARTEMENTS_DATA) || []);
    const currentDept = depts.find(d => d.code === this.deptCode) || depts.find(d => d.code === '75') || depts[0];

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <img src="logo_myprotec.png" alt="MyProtec" class="h-14 sm:h-16 object-contain drop-shadow-md mx-auto" />
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">1. Fondez votre Antenne Opérationnelle</h2>
          <p class="text-xs text-slate-600 max-w-md mx-auto">
            Indiquez le nom de votre antenne locale et sélectionnez son département d'implantation.
          </p>
        </div>

        <!-- Saisie du nom de l'antenne -->
        <div class="p-4 rounded-2xl glass-card space-y-3 bg-white/90">
          <div>
            <label class="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
              NOM DE L'ANTENNE
            </label>
            <input 
              id="onboarding-team-name-input"
              type="text" 
              value="${(this.teamName || '').replace(/"/g, '&quot;')}"
              oninput="window.ProtecOnboarding.onTeamNameInput(this.value)"
              placeholder="Ex: Antenne de Bordeaux, Antenne Paris 15..."
              class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-pc-blue focus:ring-2 focus:ring-pc-blue/30 text-sm font-black text-slate-900 bg-white"
            />
          </div>

          <!-- Sélection du département avec barre de recherche dédiée -->
          <div class="pt-3 border-t border-slate-100 space-y-2.5">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-black text-slate-800 uppercase tracking-wider">
                DÉPARTEMENT D'IMPLANTATION
              </label>
              <span class="text-[10px] font-bold text-pc-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                101 Départements & Outre-mer
              </span>
            </div>

            <!-- Département Actif Sélectionné -->
            <div id="onboarding-selected-dept-card" class="p-3 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-2 border-pc-blue/40 flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-pc-blue text-white font-black text-sm flex items-center justify-center shadow-xs">
                  ${currentDept.code}
                </div>
                <div>
                  <div class="text-sm font-black text-slate-900">${currentDept.name}</div>
                  <div class="text-[11px] font-medium text-slate-500">Région : ${currentDept.region}</div>
                </div>
              </div>
              <span class="text-xs font-black text-pc-blue bg-white px-2.5 py-1 rounded-lg border border-pc-blue/20 shadow-xs flex items-center gap-1">
                <span>✓</span> Sélectionné
              </span>
            </div>

            <!-- Barre de recherche pour trouver facilement son département -->
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input 
                id="onboarding-dept-search"
                type="search" 
                value="${this.deptSearchQuery || ''}"
                oninput="window.ProtecOnboarding.onDeptSearch(this.value)"
                placeholder="Rechercher par numéro ou nom (ex: 33, 974, Paris, Gironde, Réunion...)"
                class="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:border-pc-blue focus:ring-2 focus:ring-pc-blue/30 text-xs font-bold text-slate-900 bg-white"
              />
            </div>

            <!-- Liste filtrable des 101 départements à sélectionner en 1 clic -->
            <div 
              id="onboarding-depts-list" 
              class="max-h-44 overflow-y-auto space-y-1 p-1 border border-slate-200 rounded-xl bg-slate-50/70 custom-scrollbar">
              ${this.renderDeptListItems(depts, this.deptSearchQuery)}
            </div>
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

  // --- ÉTAPE 2 : GESTION DES ESPACES DU LOCAL AVEC PLAN 2D ---
  renderPlan2DSVG() {
    const r1Type = this.roomsConfig.room_1 || 'libre';
    const r2Type = this.roomsConfig.room_2 || 'libre';
    const r3Type = this.roomsConfig.room_3 || 'libre';

    const getRoomStyle = (type) => {
      switch (type) {
        case 'formation':
          return { fill: '#0c2244', stroke: '#3b82f6', label: '🎓 Formation (PSC/SST)', badgeBg: '#1e40af' };
        case 'logistique':
          return { fill: '#331f0e', stroke: '#f59e0b', label: '📦 Pharmacie & Stockage', badgeBg: '#b45309' };
        case 'vie':
          return { fill: '#062b1e', stroke: '#10b981', label: '☕ Foyer & Vestiaires', badgeBg: '#047857' };
        case 'bureau':
          return { fill: '#1f1642', stroke: '#8b5cf6', label: '💼 Bureau & Direction', badgeBg: '#6d28d9' };
        default:
          return { fill: '#0f172a', stroke: '#475569', label: '⚪ Salle Libre (Non affectée)', badgeBg: '#334155' };
      }
    };

    const s1 = getRoomStyle(r1Type);
    const s2 = getRoomStyle(r2Type);
    const s3 = getRoomStyle(r3Type);

    return `
      <div class="relative w-full rounded-2xl bg-[#0a0e17] border-2 border-slate-800 p-2 sm:p-3 shadow-xl overflow-hidden select-none">
        <div class="flex items-center justify-between pb-2 px-1 text-slate-300 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-black text-white uppercase tracking-wider text-[11px]">Plan d'Architecte 2D • Bâtiment d'Antenne (84.6 m² + Cour)</span>
          </div>
          <span class="text-[10.5px] font-mono text-slate-400">Échelle 1:50</span>
        </div>

        <svg viewBox="0 0 740 370" class="w-full h-auto max-h-[300px] block rounded-xl font-sans">
          <!-- Grille de fond millimétrée -->
          <defs>
            <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#121927" stroke-width="0.8" />
            </pattern>
            <pattern id="cad-grid-major" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1c2638" stroke-width="1.2" />
            </pattern>
          </defs>

          <rect width="740" height="370" fill="#0a0e17" />
          <rect width="740" height="370" fill="url(#cad-grid)" />
          <rect width="740" height="370" fill="url(#cad-grid-major)" />

          <!-- ZONE EXTÉRIEURE : PARKING OPÉRATIONNEL -->
          <g id="zone-parking">
            <rect x="20" y="20" width="230" height="330" fill="#111724" stroke="#334155" stroke-width="1.5" stroke-dasharray="4 4" rx="8" />
            
            <!-- Titre Parking -->
            <text x="135" y="42" fill="#94a3b8" font-size="10" font-weight="800" text-anchor="middle" letter-spacing="1">
              PARKING OPÉRATIONNEL EXTÉRIEUR
            </text>
            <text x="135" y="55" fill="#64748b" font-size="8.5" text-anchor="middle">
              Cour bitumée réservée aux vecteurs
            </text>

            <!-- Emplacement Véhicule 1 -->
            <rect x="35" y="70" width="200" height="110" fill="rgba(245, 158, 11, 0.05)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 4" rx="6" />
            <text x="135" y="115" fill="#f59e0b" font-size="11" font-weight="900" text-anchor="middle">
              🅿️ EMPLACEMENT 01
            </text>
            <text x="135" y="132" fill="#fbbf24" font-size="9" font-weight="700" text-anchor="middle">
              Stationnement Ambulance VPSP
            </text>
            <text x="135" y="148" fill="#78716c" font-size="8" text-anchor="middle">
              (Sol extérieur pour charges lourdes)
            </text>

            <!-- Emplacement Véhicule 2 -->
            <rect x="35" y="195" width="200" height="110" fill="rgba(245, 158, 11, 0.05)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 4" rx="6" />
            <text x="135" y="240" fill="#f59e0b" font-size="11" font-weight="900" text-anchor="middle">
              🅿️ EMPLACEMENT 02
            </text>
            <text x="135" y="257" fill="#fbbf24" font-size="9" font-weight="700" text-anchor="middle">
              Stationnement VTU / Logistique
            </text>
            <text x="135" y="273" fill="#78716c" font-size="8" text-anchor="middle">
              (Sol extérieur pour charges lourdes)
            </text>

            <text x="135" y="335" fill="#10b981" font-size="8.5" font-weight="800" text-anchor="middle">
              ✓ Stationnement d'origine inclus sans frais
            </text>
          </g>

          <!-- BÂTIMENT DE L'ANTENNE (MURS PORTEURS EXTÉRIEURS) -->
          <g id="zone-batiment">
            <!-- Contour extérieur porteur (dalle bâtiment) -->
            <rect x="270" y="20" width="450" height="330" fill="#0f172a" stroke="#1e293b" stroke-width="8" rx="4" />
            <rect x="270" y="20" width="450" height="330" fill="none" stroke="#475569" stroke-width="1.5" rx="4" />

            <!-- SALLE 1 (Nord-Ouest) : 19.3 m² -->
            <rect x="274" y="24" width="216" height="146" fill="${s1.fill}" stroke="${s1.stroke}" stroke-width="2" rx="3" />
            <text x="382" y="52" fill="#ffffff" font-size="12" font-weight="900" text-anchor="middle">
              SALLE 1 • 19.3 m²
            </text>
            <rect x="300" y="65" width="164" height="22" fill="${s1.badgeBg}" rx="4" />
            <text x="382" y="80" fill="#ffffff" font-size="9.5" font-weight="800" text-anchor="middle">
              ${s1.label}
            </text>
            <text x="382" y="110" fill="#94a3b8" font-size="8.5" text-anchor="middle">
              Dimensions : 4.60m × 4.20m
            </text>
            <text x="382" y="125" fill="#64748b" font-size="8" text-anchor="middle">
              Accès direct par porte principale
            </text>

            <!-- SALLE 2 (Nord-Est) : 20.2 m² -->
            <rect x="496" y="24" width="220" height="146" fill="${s2.fill}" stroke="${s2.stroke}" stroke-width="2" rx="3" />
            <text x="606" y="52" fill="#ffffff" font-size="12" font-weight="900" text-anchor="middle">
              SALLE 2 • 20.2 m²
            </text>
            <rect x="524" y="65" width="164" height="22" fill="${s2.badgeBg}" rx="4" />
            <text x="606" y="80" fill="#ffffff" font-size="9.5" font-weight="800" text-anchor="middle">
              ${s2.label}
            </text>
            <text x="606" y="110" fill="#94a3b8" font-size="8.5" text-anchor="middle">
              Dimensions : 4.80m × 4.20m
            </text>
            <text x="606" y="125" fill="#64748b" font-size="8" text-anchor="middle">
              Double baie vitrée extérieure
            </text>

            <!-- SALLE 3 (Sud) : 45.1 m² (Grande Salle) -->
            <rect x="274" y="176" width="442" height="170" fill="${s3.fill}" stroke="${s3.stroke}" stroke-width="2" rx="3" />
            <text x="495" y="215" fill="#ffffff" font-size="13" font-weight="900" text-anchor="middle">
              SALLE 3 (GRANDE SALLE PRINCIPALE) • 45.1 m²
            </text>
            <rect x="400" y="230" width="190" height="24" fill="${s3.badgeBg}" rx="5" />
            <text x="495" y="246" fill="#ffffff" font-size="10.5" font-weight="800" text-anchor="middle">
              ${s3.label}
            </text>
            <text x="495" y="278" fill="#94a3b8" font-size="9" text-anchor="middle">
              Grande travée modulable : 9.40m × 4.80m
            </text>
            <text x="495" y="295" fill="#64748b" font-size="8.5" text-anchor="middle">
              Accès matériel direct vers la cour extérieure
            </text>

            <!-- CLOISONS INTÉRIEURES ÉPAISSES -->
            <line x1="490" y1="20" x2="490" y2="173" stroke="#334155" stroke-width="6" />
            <line x1="270" y1="173" x2="720" y2="173" stroke="#334155" stroke-width="6" />

            <!-- OUVERTURES & PORTES RÉELLES -->
            <!-- Porte Principale (Ouest, vers parking) -->
            <path d="M 270 55 A 35 35 0 0 1 305 90" fill="none" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="3 2" />
            <line x1="270" y1="55" x2="270" y2="90" stroke="#f8fafc" stroke-width="2.5" />
            <text x="255" y="75" fill="#cbd5e1" font-size="7.5" font-weight="700" text-anchor="end">Porte 93cm</text>

            <!-- Porte Salle 1 -> Salle 2 -->
            <path d="M 490 85 A 30 30 0 0 1 520 115" fill="none" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="3 2" />
            <line x1="490" y1="85" x2="490" y2="115" stroke="#f8fafc" stroke-width="2.5" />

            <!-- Porte Salle 1 -> Salle 3 -->
            <path d="M 370 173 A 30 30 0 0 1 400 203" fill="none" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="3 2" />
            <line x1="370" y1="173" x2="400" y2="173" stroke="#f8fafc" stroke-width="2.5" />

            <!-- Accès Matériel Salle 3 vers parking -->
            <path d="M 270 235 A 35 35 0 0 1 305 270" fill="none" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="3 2" />
            <line x1="270" y1="235" x2="270" y2="270" stroke="#f8fafc" stroke-width="2.5" />
            <text x="255" y="255" fill="#cbd5e1" font-size="7.5" font-weight="700" text-anchor="end">Accès 93cm</text>

            <!-- Fenêtres Extérieures Cyan -->
            <line x1="330" y1="20" x2="390" y2="20" stroke="#38bdf8" stroke-width="3" />
            <line x1="550" y1="20" x2="620" y2="20" stroke="#38bdf8" stroke-width="3" />
            <line x1="720" y1="70" x2="720" y2="120" stroke="#38bdf8" stroke-width="3" />
            <line x1="720" y1="220" x2="720" y2="280" stroke="#38bdf8" stroke-width="3" />
          </g>
        </svg>
      </div>
    `;
  },

  // --- ÉTAPE 2 : GESTION DES ESPACES DU LOCAL ---
  renderStep2() {
    const roomDefs = [
      { id: 'room_1', name: 'Salle 1 (Nord-Ouest)', surface: '19.3 m²', dims: '4.60m × 4.20m', defaultType: this.roomsConfig.room_1 },
      { id: 'room_2', name: 'Salle 2 (Nord-Est)', surface: '20.2 m²', dims: '4.80m × 4.20m', defaultType: this.roomsConfig.room_2 },
      { id: 'room_3', name: 'Salle 3 (Grande Salle Sud)', surface: '45.1 m²', dims: '9.40m × 4.80m', defaultType: this.roomsConfig.room_3 }
    ];

    const typeLabels = {
      'libre': { label: '⚪ Salle Libre (Non affectée)', desc: 'Pièce vide prête à être aménagée selon les priorités opérationnelles.' },
      'formation': { label: '🎓 Salle de Formation & Pédagogie', desc: 'Permet d’accueillir les formations grand public (PSC, SST) et recyclages internes.' },
      'logistique': { label: '📦 Pharmacie & Lots de Secours', desc: 'Entrepose les bouteilles d’oxygène B5, DAE, trousses de soins et lots PMA.' },
      'vie': { label: '☕ Foyer de Repos & Vestiaires', desc: 'Espace de vie convivial des secouristes, vestiaires et récupération.' },
      'bureau': { label: '💼 Bureau & Direction Opérationnelle', desc: 'Secrétariat, planification des DPS et accueil administratif.' }
    };

    return `
      <div class="space-y-4">
        <div class="text-center space-y-1">
          <span class="text-2xl">📐</span>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900">2. Gestion des Espaces du Local</h2>
          <p class="text-xs text-slate-600 max-w-md mx-auto">
            Visualisez le plan 2D d'architecte et affectez la vocation de chaque pièce du bâtiment de votre antenne.
          </p>
        </div>

        <!-- PLAN 2D D'ARCHITECTE DU BÂTIMENT -->
        ${this.renderPlan2DSVG()}

        <!-- Précision réglementaire sur le Stationnement & Garage -->
        <div class="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 space-y-1.5 shadow-xs">
          <div class="flex items-center gap-2 font-black text-amber-900">
            <span class="text-base">🚒</span>
            <span>Règle d'Implantation : Stationnement des Véhicules & Garage</span>
          </div>
          <p class="text-[11.5px] text-amber-900 leading-relaxed">
            • <strong>Stationnement d'origine :</strong> Les ambulances et véhicules de l'antenne stationnent sur les 2 emplacements du <strong>Parking Opérationnel Extérieur</strong> dans la cour (dalle goudronnée visible à gauche du plan).<br>
            • <strong>Garage intérieur dans le bâtiment :</strong> N'est pas prévu d'origine dans ce local standard. Transformer une salle intérieure en garage couvert requiert des <strong>travaux structurels lourds</strong> (dalle béton armé résistant aux charges lourdes de 3,5 tonnes, percement de façade avec linteau pour pose d'une porte de garage sectionnelle industrielle et permis de construire avec coût financier et délai de chantier dans le module Travaux).
          </p>
        </div>

        <!-- Configuration des 3 pièces intérieures -->
        <div class="space-y-3">
          ${roomDefs.map((rm, idx) => `
            <div class="p-4 rounded-2xl glass-card border border-slate-300 space-y-2 bg-white shadow-xs">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="w-7 h-7 rounded-lg bg-pc-blue/10 text-pc-blue font-black text-xs flex items-center justify-center">${idx + 1}</span>
                  <div>
                    <h4 class="text-xs font-black text-slate-900">${rm.name}</h4>
                    <span class="text-[10px] text-slate-500 font-semibold">${rm.surface} (${rm.dims})</span>
                  </div>
                </div>
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${this.roomsConfig[rm.id] === 'libre' ? 'bg-slate-100 text-slate-600 border border-slate-300' : 'bg-pc-blue/10 text-pc-blue border border-pc-blue/30'}">
                  ${this.roomsConfig[rm.id] === 'libre' ? '⚪ Libre' : this.roomsConfig[rm.id]}
                </span>
              </div>

              <!-- Sélecteur de vocation des pièces intérieures (sans garage inadapté) -->
              <select 
                onchange="window.ProtecOnboarding.onRoomChange('${rm.id}', this.value)"
                class="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white transition cursor-pointer">
                <option value="libre" ${this.roomsConfig[rm.id] === 'libre' ? 'selected' : ''}>⚪ Salle Libre (Non affectée)</option>
                <option value="formation" ${this.roomsConfig[rm.id] === 'formation' ? 'selected' : ''}>🎓 Salle de Formation & Pédagogie (PSC1, SST, PSE)</option>
                <option value="logistique" ${this.roomsConfig[rm.id] === 'logistique' ? 'selected' : ''}>📦 Pharmacie & Lots de Secours d'Urgence (O2, DAE, PMA)</option>
                <option value="vie" ${this.roomsConfig[rm.id] === 'vie' ? 'selected' : ''}>☕ Foyer de Repos & Vestiaires Secouristes</option>
                <option value="bureau" ${this.roomsConfig[rm.id] === 'bureau' ? 'selected' : ''}>💼 Bureau & Direction Opérationnelle (Accueil / DPS)</option>
              </select>

              <p class="text-[11px] text-slate-600">
                ${typeLabels[this.roomsConfig[rm.id]]?.desc || ''}
              </p>
            </div>
          `).join('')}
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
      { icon: '📐', title: 'Aménager le local sur le Plan 2D', desc: 'Disposer le mobilier et affecter les salles selon vos missions.', reward: '+750 €' }
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
    const stationName = (this.teamName && this.teamName.trim()) ? this.teamName.trim() : (deptInfo ? `Antenne ${deptInfo.name} (${deptCode})` : `Antenne Protection Civile (${deptCode})`);

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
