/**
 * PROTEC LIVE - RENDU DES INTERFACES AVANCÉES
 */

window.ProtecAdvancedModals = {
  // --- 1. MODAL RÉCOMPENSES & DÉFIS ---
  renderRewards(game) {
    if (window.ProtecAdvanced && window.ProtecAdvanced.updateTasksProgress) {
      window.ProtecAdvanced.updateTasksProgress(game);
    }
    const r = game.rewards || { streakDays: 1, dailyTasks: [], weeklyTasks: [] };
    const hasAntenna = game.stations && game.stations.length > 0;
    const today = game.clock.day;
    const canClaimStreak = hasAntenna && (r.lastDailyClaimDay !== today);

    const streakList = [
      { day: 1, title: 'Jour 1', gift: '300 € + O2', icon: '🎁' },
      { day: 2, title: 'Jour 2', gift: '450 € + Agrément', icon: '🎖️' },
      { day: 3, title: 'Jour 3', gift: '600 € + DAE', icon: '⚡' },
      { day: 4, title: 'Jour 4', gift: '750 € + Notoriété', icon: '📣' },
      { day: 5, title: 'Jour 5', gift: '900 € + Soins', icon: '🩹' },
      { day: 6, title: 'Jour 6', gift: '1 200 € + Dotation', icon: '⭐' },
      { day: 7, title: 'Jour 7', gift: '2 500 € + FÉDÉRAL', icon: '🏆' }
    ];

    return `
      <div class="space-y-6">
        ${!hasAntenna ? `
          <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-800">
            <span class="text-xl">📍</span>
            <div>
              <p class="font-extrabold">Antenne opérationnelle non définie</p>
              <p class="text-[11px] text-amber-700">Placez d’abord votre antenne sur la carte géographique pour débloquer votre dotation de bienvenue et comptabiliser les objectifs opérationnels.</p>
            </div>
          </div>
        ` : ''}

        <!-- Bandeau Dotation Quotidienne -->
        <div class="p-5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white shadow-xl space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-black uppercase tracking-wider text-rose-200">Série de Connexion Quotidienne</span>
              <h3 class="text-lg font-black mt-0.5">Série en cours : Jour ${r.streakDays || 1} / 7</h3>
            </div>
            <button onclick="window.ProtecAdvanced.claimDailyStreak(window.game)" class="px-5 py-2.5 rounded-xl font-black text-xs ${canClaimStreak ? 'bg-white text-rose-600 hover:bg-rose-50 shadow-lg animate-bounce' : 'bg-white/30 text-white cursor-not-allowed'} transition">
              ${canClaimStreak ? '🎁 Réclamer mon Cadeau' : (!hasAntenna ? '📍 Antenne requise' : 'Déjà réclamé aujourd’hui ✓')}
            </button>
          </div>

          <!-- Paliers des 7 jours -->
          <div class="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-2">
            ${streakList.map(s => {
              const isPast = (r.streakDays || 1) > s.day;
              const isCurrent = (r.streakDays || 1) === s.day;

              return `
                <div class="p-2 rounded-xl text-center text-xs flex flex-col justify-between ${isCurrent ? 'bg-white text-slate-900 shadow-md ring-2 ring-yellow-300' : (isPast ? 'bg-white/20 text-white/90' : 'bg-black/20 text-white/60')}">
                  <span class="text-[10px] font-bold">${s.title}</span>
                  <span class="text-xl my-1">${s.icon}</span>
                  <span class="text-[9px] font-extrabold truncate">${s.gift}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Objectifs Quotidiens -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Objectifs du Jour (Missions 24h)</h4>
            <span class="text-[11px] text-slate-400">Renouvelés chaque jour simulé</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${r.dailyTasks.map(t => {
              const cur = t.current || 0;
              const pct = Math.min(100, Math.round((cur / t.goal) * 100));
              const canClaim = !t.done && (cur >= t.goal);

              return `
                <div class="p-3.5 rounded-2xl glass-card space-y-2 flex flex-col justify-between border ${canClaim ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-slate-200'}">
                  <div>
                    <div class="flex justify-between items-center text-xs">
                      <span class="font-bold text-slate-800">${t.title}</span>
                      <span class="font-mono font-extrabold text-emerald-600">+${t.reward} €</span>
                    </div>
                    <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>Progression</span>
                      <span class="font-bold text-slate-600 font-mono">${cur} / ${t.goal}</span>
                    </div>
                    <div class="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden mt-1">
                      <div class="${t.done || canClaim ? 'bg-emerald-500' : 'bg-pc-blue'} h-full rounded-full transition-all duration-300" style="width: ${t.done ? '100%' : pct + '%'}"></div>
                    </div>
                  </div>
                  <button onclick="window.ProtecAdvanced.claimTaskReward(window.game, '${t.id}', false)" 
                    class="w-full py-1.5 rounded-xl text-xs font-bold transition ${t.done ? 'bg-slate-200/60 text-slate-400 cursor-not-allowed' : (canClaim ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow animate-bounce' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed')}"
                    ${!canClaim && !t.done ? 'disabled' : ''}>
                    ${t.done ? 'Accompli ✓' : (canClaim ? 'Réclamer (+ ' + t.reward + ' €)' : 'En cours (' + cur + '/' + t.goal + ')')}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Défis Hebdomadaires -->
        <div class="space-y-3">
          <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Défis de la Semaine</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${r.weeklyTasks.map(w => {
              const cur = w.current || 0;
              const pct = Math.min(100, Math.round((cur / w.goal) * 100));
              const canClaim = !w.done && (cur >= w.goal);

              return `
                <div class="p-4 rounded-2xl glass-card flex items-center justify-between gap-4 border ${canClaim ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-slate-200'}">
                  <div class="flex-1 space-y-1.5">
                    <span class="text-xs font-bold text-slate-800 block">${w.title}</span>
                    <div class="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Progression : <strong class="font-mono text-slate-700">${cur} / ${w.goal}</strong></span>
                      <span>Gain : <strong class="text-emerald-700 font-mono">+${w.reward} €</strong></span>
                    </div>
                    <div class="w-full bg-slate-200/60 h-2 rounded-full overflow-hidden">
                      <div class="${w.done || canClaim ? 'bg-emerald-500' : 'bg-pc-blue'} h-full rounded-full transition-all duration-300" style="width: ${w.done ? '100%' : pct + '%'}"></div>
                    </div>
                  </div>
                  <button onclick="window.ProtecAdvanced.claimTaskReward(window.game, '${w.id}', true)" 
                    class="px-4 py-2 rounded-xl text-xs font-extrabold transition flex-shrink-0 ${w.done ? 'bg-slate-200/60 text-slate-400 cursor-not-allowed' : (canClaim ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow animate-bounce' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed')}"
                    ${!canClaim && !w.done ? 'disabled' : ''}>
                    ${w.done ? 'Validé ✓' : (canClaim ? 'Réclamer (+ ' + w.reward + ' €)' : 'En cours (' + cur + '/' + w.goal + ')')}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // --- 2. AMÉNAGEMENT DU LOCAL D'ANTENNE ---
  renderStationRooms(game, stationId) {
    const st = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!st) return '<p class="text-xs text-slate-500">Aucune antenne sélectionnée.</p>';

    const rooms = st.rooms || { garage: 1, pharmacie: 1, foyer: 1, formation: 1, radio: 1 };
    const roomKeys = [
      { key: 'garage', title: 'Hangar & Garage Opérationnel', icon: '🚒' },
      { key: 'pharmacie', title: 'Pharmacie Centrale & Réserve', icon: '💊' },
      { key: 'foyer', title: 'Foyer des Bénévoles & Espace Détente', icon: '☕' },
      { key: 'formation', title: 'Salle Pédagogique & Formations PSC', icon: '🎓' },
      { key: 'radio', title: 'Baie Radio & Transmissions', icon: '📡' }
    ];

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl glass-card flex items-center justify-between">
          <div>
            <h4 class="text-xs font-extrabold text-slate-900">Aménagement du Local : ${st.name}</h4>
            <p class="text-[11px] text-slate-500">Développez les pièces de votre base pour débloquer des bonus passifs permanents.</p>
          </div>
          <span class="text-xs font-bold text-slate-600">Trésorerie : <strong class="text-pc-blue font-mono">${game.resources.money.toLocaleString('fr-FR')} €</strong></span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${roomKeys.map(r => {
            const currentLevel = rooms[r.key] || 1;
            const upgrades = window.ProtecAdvanced.roomUpgrades[r.key];
            const currentData = upgrades.find(u => u.level === currentLevel) || upgrades[0];
            const nextData = upgrades.find(u => u.level === currentLevel + 1);

            return `
              <div class="p-4 rounded-2xl glass-card space-y-3 flex flex-col justify-between">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-base">${r.icon}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-pc-blue/10 text-pc-blue">Niveau ${currentLevel} / ${upgrades.length}</span>
                  </div>
                  <h5 class="text-sm font-extrabold text-slate-900">${currentData.name}</h5>
                  <p class="text-xs text-slate-600">${currentData.desc}</p>
                  <div class="p-2 rounded-xl glass-card-blue text-[11px] text-pc-blue font-bold">
                    Bonus actif : ${currentData.bonus}
                  </div>
                </div>

                <div class="pt-2 border-t border-slate-100/70">
                  ${nextData ? `
                    <button onclick="window.ProtecAdvanced.upgradeRoom(window.game, '${st.id}', '${r.key}')" class="w-full py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5">
                      <span>Passer au Niveau ${nextData.level} (${nextData.cost} €)</span>
                    </button>
                  ` : `
                    <div class="w-full py-1.5 rounded-xl text-center text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aménagement Maximal ✓
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // --- 3. COMMANDE DE VÉHICULES SPÉCIALISÉS ---
  vehicleFilter: 'all',
  vehicleSort: 'price_asc',
  vehicleSearch: '',
  shopMode: 'models', // 'models' (Par Porteur & Configuration) ou 'types' (Par Rôle Opérationnel)
  selectedVariants: {}, // { [chassisId]: variantId }
  selectedSerigraphies: {}, // { [groupKey]: variantId }
  selectedVehicleOptions: {}, // { [variantIdOrCardId]: { [optionKey]: boolean } }

  VEHICLE_OPTIONS: {
    towHitch: {
      id: 'towHitch',
      label: 'Boule d’attelage renforcée (Remorquage)',
      cost: 950,
      icon: '🔗',
      desc: 'Permet de tracter remorques lourdes, tentes PMA, lots d’éclairage et bateaux ERS.'
    },
    ledBar: {
      id: 'ledBar',
      label: 'Rampe LED Haute Puissance & Feux Calandre',
      cost: 1250,
      icon: '🚨',
      desc: 'Visibilité optimale de nuit et sécurité renforcée sur voies rapides et autoroute.'
    },
    climatisation: {
      id: 'climatisation',
      label: 'Pack Climatisation Cellule & Chauffage Webasto',
      cost: 1850,
      icon: '❄️',
      desc: 'Confort thermique canicule / grand froid pour les victimes et les bénévoles.'
    },
    converter230v: {
      id: 'converter230v',
      label: 'Convertisseur 230V Sinus & Maintien Charge',
      cost: 1100,
      icon: '⚡',
      desc: 'Alimentation continue des DAE, électro-cardiographes, oxygène et tablettes.'
    }
  },

  toggleVehicleOption(targetKey, optionKey, stationId) {
    if (!this.selectedVehicleOptions) this.selectedVehicleOptions = {};
    if (!this.selectedVehicleOptions[targetKey]) this.selectedVehicleOptions[targetKey] = {};
    this.selectedVehicleOptions[targetKey][optionKey] = !this.selectedVehicleOptions[targetKey][optionKey];
    if (window.game) {
      const body = document.getElementById('modal-body');
      if (body) body.innerHTML = this.renderVehicleShop(window.game, stationId);
    }
  },

  getVehicleSelectedOptions(targetKey) {
    return (this.selectedVehicleOptions && this.selectedVehicleOptions[targetKey]) || {};
  },

  setVehicleShopMode(mode, stationId) {
    this.shopMode = mode;
    if (window.game) {
      const body = document.getElementById('modal-body');
      if (body) body.innerHTML = this.renderVehicleShop(window.game, stationId);
    }
  },

  setVehicleSearch(searchKey, stationId) {
    this.vehicleSearch = searchKey;
    if (window.game) {
      const body = document.getElementById('modal-body');
      if (body) {
        body.innerHTML = this.renderVehicleShop(window.game, stationId);
        const input = document.getElementById('vehicle-search-input');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }
  },

  setVehicleFilter(filterKey, stationId) {
    this.vehicleFilter = filterKey;
    if (window.game) {
      const body = document.getElementById('modal-body');
      if (body) body.innerHTML = this.renderVehicleShop(window.game, stationId);
    }
  },

  setVehicleSort(sortKey, stationId) {
    this.vehicleSort = sortKey;
    if (window.game) {
      const body = document.getElementById('modal-body');
      if (body) body.innerHTML = this.renderVehicleShop(window.game, stationId);
    }
  },

  selectModelVariant(modelId, variantId, stationId) {
    if (!this.selectedVariants) this.selectedVariants = {};
    this.selectedVariants[modelId] = variantId;
    if (window.game) {
      const body = document.getElementById('modal-body');
      if (body) body.innerHTML = this.renderVehicleShop(window.game, stationId);
    }
  },

  selectTypeSerigraphie(groupKey, variantId, stationId) {
    if (!this.selectedSerigraphies) this.selectedSerigraphies = {};
    this.selectedSerigraphies[groupKey] = variantId;
    if (window.game) {
      const body = document.getElementById('modal-body');
      if (body) body.innerHTML = this.renderVehicleShop(window.game, stationId);
    }
  },

  buyConfiguredVariant(stationId, vehicleType, modelId, variantId) {
    const chassisModels = window.ProtecAdvanced?.chassisModels || [];
    let foundVariant = null;

    for (const m of chassisModels) {
      const v = (m.variants || []).find(varItem => varItem.id === variantId);
      if (v) {
        foundVariant = v;
        break;
      }
    }

    if (!foundVariant) {
      // Fallback catalogue classique
      foundVariant = (window.ProtecAdvanced?.vehicleCatalog || []).find(v => v.type === vehicleType);
    }

    const selOpts = this.getVehicleSelectedOptions(variantId);
    let optionsExtraCost = 0;
    const activeOptionsList = [];
    const hasNativeTowHitch = Boolean(foundVariant?.hasTowHitch);
    let finalTowHitch = hasNativeTowHitch;

    if (!hasNativeTowHitch && selOpts.towHitch) {
      optionsExtraCost += this.VEHICLE_OPTIONS.towHitch.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.towHitch.label);
      finalTowHitch = true;
    }
    if (selOpts.ledBar) {
      optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.ledBar.label);
    }
    if (selOpts.climatisation) {
      optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.climatisation.label);
    }
    if (selOpts.converter230v) {
      optionsExtraCost += this.VEHICLE_OPTIONS.converter230v.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.converter230v.label);
    }

    const customOptions = Object.assign({}, foundVariant, {
      cost: (foundVariant?.cost || 20000) + optionsExtraCost,
      hasTowHitch: finalTowHitch,
      installedOptions: activeOptionsList
    });

    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.buySpecializedVehicle === 'function') {
      window.ProtecAdvanced.buySpecializedVehicle(window.game, stationId, vehicleType, customOptions);
    }
  },

  renderVehicleShop(game, stationId) {
    const st = game.stations.find(s => s.id === stationId) || game.stations[0];
    const garageLevel = st?.rooms?.garage || 1;
    const maxSlots = garageLevel === 1 ? 2 : (garageLevel === 2 ? 4 : 8);
    const usedSlots = st?.vehicles?.length || 0;

    const currentShopMode = this.shopMode || 'models';
    const activeFilter = this.vehicleFilter || 'all';
    const activeSort = this.vehicleSort || 'price_asc';
    const activeSearch = (this.vehicleSearch || '').toLowerCase().trim();

    return `
      <div class="space-y-4">
        <!-- Bandeau d'en-tête et capacité du hangar -->
        <div class="p-4 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 class="font-black text-slate-900 text-sm">Centrale d'Acquisition des Véhicules de Secours</h4>
            <p class="text-slate-500 mt-0.5">Capacité du Hangar : <strong>${usedSlots} / ${maxSlots} véhicules</strong> • Antenne : <strong>${st?.name || 'Principale'}</strong></p>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-bold text-slate-600">Trésorerie disponible : <strong class="text-pc-blue font-mono text-sm">${game.resources.money.toLocaleString('fr-FR')} €</strong></span>
          </div>
        </div>

        <!-- Raccourci vers le Marché de l'Occasion -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/80 flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🏷️</span>
            <div>
              <strong class="text-slate-800 text-xs block">Envie d'économiser sur votre parc roulant ?</strong>
              <span class="text-[11px] text-slate-500">Découvrez les véhicules révisés cédés par les autres directeurs (jusqu'à -50% vs neuf).</span>
            </div>
          </div>
          <button onclick="window.game.openModule('marche_occasion')" class="px-3.5 py-1.5 rounded-xl bg-pc-orange hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs shadow-xs transition cursor-pointer flex-shrink-0">
            Voir l'Occasion 🏷️
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- SÉLECTEUR DES DEUX MODES DE RECHERCHE / CONFIGURATION    -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <div class="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
          <button 
            type="button" 
            onclick="window.ProtecAdvancedModals.setVehicleShopMode('models', '${st?.id}')" 
            class="py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              currentShopMode === 'models' 
                ? 'bg-white text-pc-blue shadow-md ring-2 ring-pc-blue/30 scale-[1.01]' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }"
          >
            <span class="text-base">🚗</span>
            <div class="text-left">
              <span class="block leading-none">Par Modèle & Configuration</span>
              <span class="text-[10px] font-semibold text-slate-500 block mt-0.5">Master 3, Trafic, Ducato • Choix aménagement & cube</span>
            </div>
          </button>

          <button 
            type="button" 
            onclick="window.ProtecAdvancedModals.setVehicleShopMode('types', '${st?.id}')" 
            class="py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              currentShopMode === 'types' 
                ? 'bg-white text-pc-blue shadow-md ring-2 ring-pc-blue/30 scale-[1.01]' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }"
          >
            <span class="text-base">🚑</span>
            <div class="text-left">
              <span class="block leading-none">Par Type Opérationnel</span>
              <span class="text-[10px] font-semibold text-slate-500 block mt-0.5">VPSP, VTU, VTP, VL, Poids Lourds • Sérigraphies regroupées</span>
            </div>
          </button>
        </div>

        <!-- Barre de Recherche Véhicules -->
        <div class="relative">
          <input 
            type="text" 
            id="vehicle-search-input"
            value="${this.vehicleSearch || ''}" 
            oninput="window.ProtecAdvancedModals.setVehicleSearch(this.value, '${st?.id}')" 
            placeholder="🔍 Rechercher un véhicule (ex: Master 3, Cube, VPSP, VTU, Trafic, Poids Lourd, Permis C...)" 
            class="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white border border-slate-300 shadow-sm font-bold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pc-blue transition"
          />
          ${this.vehicleSearch ? `
            <button onclick="window.ProtecAdvancedModals.setVehicleSearch('', '${st?.id}')" class="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
          ` : ''}
        </div>

        ${currentShopMode === 'models' 
          ? this.renderModeByModels(game, st, activeSearch, activeSort) 
          : this.renderModeByTypes(game, st, activeSearch, activeFilter, activeSort)
        }
      </div>
    `;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU DU MODE 1 : PAR MODÈLE / CHÂSSIS & CONFIGURATION D'AMÉNAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  renderModeByModels(game, st, activeSearch, activeSort) {
    const chassisList = [...(window.ProtecAdvanced.chassisModels || [])];
    
    // Filtrage recherche
    let filteredChassis = chassisList.filter(model => {
      if (!activeSearch) return true;
      const mName = (model.name || '').toLowerCase();
      const mBrand = (model.brand || '').toLowerCase();
      const mDesc = (model.desc || '').toLowerCase();
      const variantsMatch = (model.variants || []).some(v => 
        (v.name || '').toLowerCase().includes(activeSearch) ||
        (v.type || '').toLowerCase().includes(activeSearch) ||
        (v.shortName || '').toLowerCase().includes(activeSearch) ||
        (v.desc || '').toLowerCase().includes(activeSearch)
      );
      return mName.includes(activeSearch) || mBrand.includes(activeSearch) || mDesc.includes(activeSearch) || variantsMatch;
    });

    if (filteredChassis.length === 0) {
      return `
        <div class="p-8 text-center glass-card rounded-2xl text-slate-500">
          <p class="font-bold text-sm">Aucun modèle trouvé pour la recherche « ${activeSearch} ».</p>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
          <span>Sélectionnez un porteur puis choisissez l’aménagement et la livrée souhaitée :</span>
          <span>${filteredChassis.length} porteur(s) disponible(s)</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          ${filteredChassis.map(model => {
            const variants = model.variants || [];
            const selectedVarId = this.selectedVariants?.[model.id] || model.defaultVariantId || variants[0]?.id;
            const currentVariant = variants.find(v => v.id === selectedVarId) || variants[0];
            if (!currentVariant) return '';

            const isHeavyLicense = currentVariant.licenseRequired === 'C';
            const isMotoLicense = currentVariant.licenseRequired === 'Moto';
            const isNoLicense = currentVariant.licenseRequired === 'None';

            // Options configurables actives pour cette variante
            const selOpts = this.getVehicleSelectedOptions(currentVariant.id);
            let optionsExtraCost = 0;
            const hasNativeTowHitch = Boolean(currentVariant.hasTowHitch);

            if (!hasNativeTowHitch && selOpts.towHitch) {
              optionsExtraCost += this.VEHICLE_OPTIONS.towHitch.cost;
            }
            if (selOpts.ledBar) {
              optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
            }
            if (selOpts.climatisation) {
              optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
            }
            if (selOpts.converter230v) {
              optionsExtraCost += this.VEHICLE_OPTIONS.converter230v.cost;
            }

            const totalConfigCost = currentVariant.cost + optionsExtraCost;

            return `
              <div class="p-4 rounded-2xl glass-card space-y-3.5 flex flex-col justify-between hover:shadow-xl transition border border-slate-200/80 bg-white/95">
                <div class="space-y-3">
                  <!-- En-tête modèle & marque -->
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-lg">${model.icon || '🚐'}</span>
                        <h4 class="font-black text-slate-900 text-sm">${model.name}</h4>
                      </div>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${model.brand}</span>
                    </div>

                    <!-- Prix dynamique selon la configuration active -->
                    <div class="text-right">
                      <span class="font-mono font-black text-base text-slate-900 block">${totalConfigCost.toLocaleString('fr-FR')} €</span>
                      <span class="text-[9.5px] font-bold text-slate-400">${optionsExtraCost > 0 ? `(dont +${optionsExtraCost} € d'options)` : 'TTC • Neuf d\'usine'}</span>
                    </div>
                  </div>

                  <!-- Image dynamique en temps réel selon la variante -->
                  <div class="h-44 w-full flex items-center justify-center p-3 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl border border-slate-100 overflow-hidden shadow-inner group relative">
                    <img 
                      src="${currentVariant.image || `images/vehicles/${currentVariant.type}.png`}" 
                      alt="${currentVariant.name}" 
                      class="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200" 
                      onerror="this.outerHTML='<span class=\\'text-5xl\\'>${model.icon || '🚐'}</span>'" 
                    />

                    <!-- Badge Type Opérationnel en haut à gauche -->
                    <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-pc-blue text-white shadow-xs">
                        ${currentVariant.type}
                      </span>
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/90 text-slate-700 backdrop-blur-xs border border-slate-200/70">
                        ${currentVariant.category}
                      </span>
                    </div>

                    <!-- Badge Permis Requis en bas à droite -->
                    <div class="absolute bottom-2.5 right-2.5">
                      <span class="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border shadow-xs ${
                        isHeavyLicense 
                          ? 'bg-amber-500 text-white border-amber-600 animate-pulse' 
                          : (isMotoLicense 
                              ? 'bg-sky-500 text-white border-sky-600' 
                              : (isNoLicense 
                                  ? 'bg-slate-200 text-slate-700 border-slate-300' 
                                  : 'bg-emerald-600 text-white border-emerald-700'))
                      }">
                        ${currentVariant.licenseLabel || `Permis ${currentVariant.licenseRequired}`}
                      </span>
                    </div>
                  </div>

                  <!-- Sélecteur d'Aménagement / Configuration spécifique à ce châssis -->
                  <div>
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                      ⚙️ Choisissez la configuration / aménagement (${variants.length} au choix) :
                    </span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      ${variants.map(v => {
                        const isSelected = v.id === currentVariant.id;
                        return `
                          <button 
                            type="button" 
                            onclick="window.ProtecAdvancedModals.selectModelVariant('${model.id}', '${v.id}', '${st?.id}')" 
                            class="px-2.5 py-2 rounded-xl text-left transition border cursor-pointer ${
                              isSelected 
                                ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black ring-1 ring-pc-blue/40 shadow-xs' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-700 font-bold'
                            }"
                          >
                            <div class="flex items-center justify-between text-xs leading-tight">
                              <span class="truncate">${v.shortName || v.name}</span>
                              <span class="font-mono text-[11px] shrink-0 font-black ${isSelected ? 'text-pc-blue' : 'text-slate-500'} ml-1">
                                ${(v.cost / 1000).toFixed(1)} k€
                              </span>
                            </div>
                            <span class="text-[9.5px] block font-semibold ${isSelected ? 'text-pc-blue/80' : 'text-slate-400'} mt-0.5">
                              ${v.type} • ${v.capacity} pl.
                            </span>
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- Description & Spécificités de la variante configurée -->
                  <div class="space-y-1">
                    <h5 class="text-xs font-black text-slate-900">${currentVariant.name}</h5>
                    <p class="text-[11px] text-slate-600 leading-relaxed">${currentVariant.desc}</p>
                  </div>

                  <!-- Fiche Technique Rapide (Sans vitesse max) -->
                  <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[10.5px] font-bold text-slate-700 grid grid-cols-2 gap-2">
                    <div>
                      Capacité : <strong class="text-slate-900">${currentVariant.capacity} place${currentVariant.capacity > 1 ? 's' : ''}</strong>
                    </div>
                    <div>
                      Attelage : <strong class="${hasNativeTowHitch || selOpts.towHitch ? 'text-emerald-700' : 'text-slate-400'}">${hasNativeTowHitch ? '✓ De série' : (selOpts.towHitch ? '✓ Option ajoutée' : 'Non équipé')}</strong>
                    </div>
                    <div class="col-span-2">
                      Spécialité : <strong class="text-pc-blue">${currentVariant.specialty || 'Polyvalent'}</strong>
                    </div>
                  </div>

                  <!-- Options & Équipements Configurables -->
                  <div class="space-y-1.5 pt-1.5 border-t border-slate-200/80">
                    <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <span>🛠️ Options & Équipements Configurables :</span>
                      ${optionsExtraCost > 0 ? `<span class="text-pc-blue font-black font-mono">+${optionsExtraCost.toLocaleString('fr-FR')} €</span>` : ''}
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px]">
                      <!-- Option Boule d'attelage -->
                      ${hasNativeTowHitch ? `
                        <div class="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-between">
                          <span class="flex items-center gap-1.5"><span>🔗</span> Boule d’attelage</span>
                          <span class="text-[9px] font-black uppercase bg-emerald-200/70 px-1.5 py-0.5 rounded text-emerald-900">De Série</span>
                        </div>
                      ` : `
                        <button 
                          type="button" 
                          onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'towHitch', '${st?.id}')"
                          class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.towHitch ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'}"
                        >
                          <span class="flex items-center gap-1.5"><span>🔗</span> Boule d’attelage</span>
                          <span class="font-mono font-black text-[10px] ${selOpts.towHitch ? 'text-pc-blue' : 'text-slate-500'}">+950 €</span>
                        </button>
                      `}

                      <!-- Option Rampe LED -->
                      <button 
                        type="button" 
                        onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'ledBar', '${st?.id}')"
                        class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.ledBar ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'}"
                      >
                        <span class="flex items-center gap-1.5"><span>🚨</span> Rampe LED & Calandre</span>
                        <span class="font-mono font-black text-[10px] ${selOpts.ledBar ? 'text-pc-blue' : 'text-slate-500'}">+1 250 €</span>
                      </button>

                      <!-- Option Climatisation / Chauffage -->
                      <button 
                        type="button" 
                        onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'climatisation', '${st?.id}')"
                        class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.climatisation ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'}"
                      >
                        <span class="flex items-center gap-1.5"><span>❄️</span> Pack Climatisation / Webasto</span>
                        <span class="font-mono font-black text-[10px] ${selOpts.climatisation ? 'text-pc-blue' : 'text-slate-500'}">+1 850 €</span>
                      </button>

                      <!-- Option Convertisseur 230V -->
                      <button 
                        type="button" 
                        onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'converter230v', '${st?.id}')"
                        class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.converter230v ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'}"
                      >
                        <span class="flex items-center gap-1.5"><span>⚡</span> Convertisseur 230V Sinus</span>
                        <span class="font-mono font-black text-[10px] ${selOpts.converter230v ? 'text-pc-blue' : 'text-slate-500'}">+1 100 €</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Bouton d'achat de la configuration choisie -->
                <button 
                  type="button" 
                  onclick="window.ProtecAdvancedModals.buyConfiguredVariant('${st?.id}', '${currentVariant.type}', '${model.id}', '${currentVariant.id}')" 
                  class="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Commander cette Configuration (${totalConfigCost.toLocaleString('fr-FR')} €)</span>
                  <span>➜</span>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RENDU DU MODE 2 : PAR RÔLE & TYPE OPÉRATIONNEL (AVEC SÉRIGRAPHIES REGROUPÉES)
  // ══════════════════════════════════════════════════════════════════════════
  renderModeByTypes(game, st, activeSearch, activeFilter, activeSort) {
    const filterOptions = [
      { id: 'all', label: 'Tous les Types', icon: '🏪' },
      { id: 'secours', label: 'VPSP & Urgence (Ambulances)', icon: '🚑' },
      { id: 'logistique', label: 'VTU & Logistique (Tôlés)', icon: '🚐' },
      { id: 'transport', label: 'VTP & Minibus (9 places)', icon: '🚌' },
      { id: 'liaison', label: 'VL & VLHR (Liaison & 4x4)', icon: '🚗' },
      { id: 'heavy', label: 'Poids Lourds (Permis C)', icon: '🚚' },
      { id: 'specialites', label: 'Spécialités (Bateau, USAR, Quad, Moto)', icon: '🚤' }
    ];

    // Construction d'une liste de cartes opérationnelles enrichies
    // Regroupement particulier pour le VTU Master 3 (Logistique vs Soutien aux populations)
    const operationalCards = [
      // 1. VPSP Renault Master 3 Profilé
      {
        id: 'type_vpsp_master3',
        type: 'VPSP',
        title: 'VPSP - Ambulance Profilée Standard (Master III)',
        category: 'Secours d’Urgence',
        roleGroup: 'secours',
        desc: 'Cellule sanitaire profilée d’intervention d’urgence aux normes EN 1789, brancard 3 points et dotation SUAP.',
        cost: 28500,
        capacity: 5,
        speedKmH: 85,
        licenseRequired: 'B',
        licenseLabel: 'Permis B (+ P.VPSP)',
        hasTowHitch: false,
        image: 'images/vehicles/master3_vpsp.png',
        icon: '🚑',
        specialty: 'SAMU 15 & Urgences Réflexes',
        variantOptions: {
          id: 'master3_vpsp',
          name: 'Renault Master III - VPSP Cellule Standard Profilée',
          model: 'Renault Master III VPSP Profilé',
          cost: 28500,
          capacity: 5,
          licenseRequired: 'B',
          image: 'images/vehicles/master3_vpsp.png'
        }
      },
      // 2. VPSP Renault Master 3 Cube
      {
        id: 'type_vpsp_cube_master3',
        type: 'VPSP',
        title: 'VPSP - Grande Cellule Carrée Cube (Master III)',
        category: 'Secours d’Urgence',
        roleGroup: 'secours',
        desc: 'Cellule cubique sanitaire XXL grand volume. Espace d’intervention maximal idéal pour réanimation et soins intensifs.',
        cost: 32000,
        capacity: 5,
        speedKmH: 80,
        licenseRequired: 'B',
        licenseLabel: 'Permis B (+ P.VPSP)',
        hasTowHitch: false,
        image: 'images/vehicles/master3_vpsp_cube.png',
        icon: '🚑',
        specialty: 'Soins Intensifs & Volume XXL',
        variantOptions: {
          id: 'master3_vpsp_cube',
          name: 'Renault Master III - VPSP Grande Cellule Cube Sanitaire',
          model: 'Renault Master III VPSP Cube',
          cost: 32000,
          capacity: 5,
          licenseRequired: 'B',
          image: 'images/vehicles/master3_vpsp_cube.png'
        }
      },
      // 3. VTU Renault Master 3 avec Sélecteur de Sérigraphie Intégré (CONFORME DEMANDE)
      {
        id: 'type_vtu_master3_grouped',
        type: 'VTU',
        title: 'VTU - Fourgon Tout Usage (Renault Master III)',
        category: 'Logistique & Événementiel',
        roleGroup: 'logistique',
        hasSerigraphieSelector: true,
        groupKey: 'vtu_master3_serigraphie',
        serigraphies: [
          {
            key: 'logistique',
            label: '🔵 Logistique',
            subTitle: 'VTU Fourgon Logistique',
            desc: 'Fourgon tôlé utilitaire grand volume pour transport de tentes, lits de camp, barnums et matériel de poste de secours avec sérigraphie Logistique. Crochet d’attelage inclus.',
            image: 'images/vehicles/master3_vtu_log.png',
            specialty: 'Matériel PMA & Tentes'
          },
          {
            key: 'soutien_pop',
            label: '🟠 Soutien aux Populations',
            subTitle: 'VTU Soutien aux Populations & Sinistrés',
            desc: 'Sérigraphie officielle Soutien aux Populations pour assistance citoyenne, centres d’accueil d’urgence et distribution de ravitaillement aux sinistrés.',
            image: 'images/vehicles/master3_vtu_pop.png',
            specialty: 'Assistance Sinistrés & Crises'
          }
        ],
        cost: 17500,
        capacity: 3,
        speedKmH: 75,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        hasTowHitch: true,
        icon: '🚐'
      },
      // 4. VTP Renault Master 3 Minibus 9p
      {
        id: 'type_vtp_master3',
        type: 'VTP',
        title: 'VTP - Minibus Grand Confort 9 Places (Master III)',
        category: 'Transport d’Équipes',
        roleGroup: 'transport',
        desc: 'Minibus vitré 9 places pour acheminement d’équipages complets et relèves distantes avec crochet d’attelage.',
        cost: 21000,
        capacity: 9,
        speedKmH: 85,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        hasTowHitch: true,
        image: 'images/vehicles/master3_vtp.png',
        icon: '🚌',
        specialty: 'Acheminement de Renforts',
        variantOptions: {
          id: 'master3_vtp',
          name: 'Renault Master III - VTP Transport de Personnel (9 places)',
          model: 'Renault Master III VTP',
          cost: 21000,
          capacity: 9,
          licenseRequired: 'B',
          image: 'images/vehicles/master3_vtp.png'
        }
      },
      // 5. VTP Renault Trafic Minibus
      {
        id: 'type_vtp_trafic',
        type: 'VTP',
        title: 'VTP - Minibus Agile 9 Places (Renault Trafic III)',
        category: 'Transport d’Équipes',
        roleGroup: 'transport',
        desc: 'Minibus compact maniable, parfait pour les relèves rapides d’équipes en milieu urbain dense.',
        cost: 19500,
        capacity: 9,
        speedKmH: 90,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        hasTowHitch: true,
        image: 'images/vehicles/trafic_vtp.png',
        icon: '🚌',
        specialty: 'Relèves Urbaines Rapides',
        variantOptions: {
          id: 'trafic3_vtp',
          name: 'Renault Trafic III - VTP Minibus (9 places)',
          model: 'Renault Trafic III VTP',
          cost: 19500,
          capacity: 9,
          licenseRequired: 'B',
          image: 'images/vehicles/trafic_vtp.png'
        }
      },
      // 6. VL Dacia Duster
      {
        id: 'type_vl_duster',
        type: 'VL',
        title: 'VL - Véhicule de Liaison (Dacia Duster II)',
        category: 'Reconnaissance Rapide',
        roleGroup: 'liaison',
        desc: 'Véhicule léger avec rampe lumineuse, équipement radio et crochet d’attelage pour reconnaissance et commandement.',
        cost: 11500,
        capacity: 4,
        speedKmH: 100,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        hasTowHitch: true,
        image: 'images/vehicles/VL.png',
        icon: '🚗',
        specialty: 'Reconnaissance & Commandement'
      },
      // 7. VLHR Toyota Hilux 4x4
      {
        id: 'type_vlhr_hilux',
        type: 'VLHR',
        title: 'VLHR - Véhicule Léger Hors Route 4x4 (Hilux)',
        category: 'Tout-Terrain',
        roleGroup: 'liaison',
        desc: 'Pick-up 4x4 tout-terrain pour zones accidentées, massifs forestiers, franchissement et remorquage lourd.',
        cost: 19500,
        capacity: 4,
        speedKmH: 90,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        hasTowHitch: true,
        image: 'images/vehicles/VLHR.png',
        icon: '🚙',
        specialty: 'Accès Tout-Terrain & Crues'
      },
      // 8. FLIT Poids Lourd (Permis C)
      {
        id: 'type_flit_heavy',
        type: 'FLIT',
        title: 'FLIT - Fourgon Lourd d’Intervention Technique (Poids Lourd > 12t)',
        category: 'Technique & Soutien',
        roleGroup: 'heavy',
        desc: 'Châssis Poids Lourd lourdement équipé (type FPTL / FPTSR > 12t) avec rideaux alu, groupe électrogène haute puissance, mât d’éclairage télescopique, lot PMA et pompes d’épuisement. Conducteur Permis C obligatoire.',
        cost: 95000,
        capacity: 3,
        speedKmH: 70,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd) Requis 🚚',
        hasTowHitch: true,
        image: 'images/vehicles/FLIT.png',
        icon: '🏗️',
        specialty: 'Postes Médicaux Avancés & Crises'
      },
      // 9. PCM Poids Lourd (Permis C)
      {
        id: 'type_pcm_heavy',
        type: 'PCM',
        title: 'PCM - Poste de Commandement Mobile (> 3.5t)',
        category: 'Commandement Lourd',
        roleGroup: 'heavy',
        desc: 'Centre opérationnel mobile de crise avec baie de transmissions VHF/UHF, satellite et salle de crise. Conducteur Permis C obligatoire.',
        cost: 45000,
        capacity: 3,
        speedKmH: 65,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd) Requis 🚚',
        hasTowHitch: false,
        image: 'images/vehicles/PCM.png',
        icon: '🚍',
        specialty: 'Coordination Grands Événements & NOVI'
      },
      // 10. Bateau ERS
      {
        id: 'type_ers_boat',
        type: 'ERS',
        title: 'ERS - Embarcation de Sauvetage + Remorque',
        category: 'Sauvetage Aquatique (SSA)',
        roleGroup: 'specialites',
        desc: 'Bateau pneumatique rigide (4 places) avec remorque routière fournie. Qualifications : SSA & Conduite Bateau.',
        cost: 13500,
        capacity: 4,
        speedKmH: 45,
        licenseRequired: 'B',
        licenseLabel: 'Permis Bateau & SSA',
        requiresTrailer: true,
        image: 'images/vehicles/ERS.png',
        icon: '🚤',
        specialty: 'Sauvetage Aquatique'
      },
      // 11. Moto MPS
      {
        id: 'type_mps_moto',
        type: 'MPS',
        title: 'MPS - Moto de Premiers Secours (2 places)',
        category: 'Vecteur Rapide',
        roleGroup: 'specialites',
        desc: 'Moto de premiers secours pour circulation rapide en trafic dense. Permis Moto requis.',
        cost: 8500,
        capacity: 2,
        speedKmH: 110,
        licenseRequired: 'Moto',
        licenseLabel: 'Permis Moto Requis 🏍️',
        image: 'images/vehicles/Moto.png',
        icon: '🏍️',
        specialty: 'Intervention Express Trafic Dense'
      },
      // 12. Quad Tout-Terrain
      {
        id: 'type_quad_interv',
        type: 'QUAD',
        title: 'Quad Tout-Terrain d’Intervention + Remorque',
        category: 'Tout-Terrain Agile',
        roleGroup: 'specialites',
        desc: 'Quad tout-terrain pour sentiers étroits avec remorque de transport fournie.',
        cost: 7200,
        capacity: 2,
        speedKmH: 50,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        requiresTrailer: true,
        image: 'images/vehicles/QUAD.png',
        icon: '🚜',
        specialty: 'Évacuation Hors Pistes'
      },
      // 13. Binôme Vélo VTT
      {
        id: 'type_velo_patrouille',
        type: 'VELO',
        title: 'Binôme Vélo / VTT Premiers Secours',
        category: 'Dispositif Mobile',
        roleGroup: 'specialites',
        desc: 'Vélos équipés de sacoches de secours et DAE pour patrouilles douces sur berges et parcs.',
        cost: 2500,
        capacity: 2,
        speedKmH: 25,
        licenseRequired: 'None',
        licenseLabel: 'Sans Permis 🚲',
        image: 'images/vehicles/VELO.png',
        icon: '🚲',
        specialty: 'Patrouilles & Parcs'
      }
    ];

    // Filtrage par onglet de rôle
    let filteredCards = operationalCards.filter(c => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'secours') return c.roleGroup === 'secours';
      if (activeFilter === 'logistique') return c.roleGroup === 'logistique';
      if (activeFilter === 'transport') return c.roleGroup === 'transport';
      if (activeFilter === 'liaison') return c.roleGroup === 'liaison';
      if (activeFilter === 'heavy') return c.roleGroup === 'heavy';
      if (activeFilter === 'specialites') return c.roleGroup === 'specialites';
      return true;
    });

    // Filtrage recherche
    if (activeSearch) {
      filteredCards = filteredCards.filter(c => {
        const title = (c.title || '').toLowerCase();
        const type = (c.type || '').toLowerCase();
        const desc = (c.desc || '').toLowerCase();
        const spec = (c.specialty || '').toLowerCase();
        return title.includes(activeSearch) || type.includes(activeSearch) || desc.includes(activeSearch) || spec.includes(activeSearch);
      });
    }

    // Tri
    if (activeSort === 'price_asc') {
      filteredCards.sort((a, b) => a.cost - b.cost);
    } else if (activeSort === 'price_desc') {
      filteredCards.sort((a, b) => b.cost - a.cost);
    } else if (activeSort === 'name_asc') {
      filteredCards.sort((a, b) => a.title.localeCompare(b.title));
    }

    return `
      <div class="space-y-4">
        <!-- Barre de Filtres par Type Opérationnel & Tri -->
        <div class="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <!-- Filtres boutons -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            ${filterOptions.map(f => {
              const isActive = activeFilter === f.id;
              return `
                <button type="button" onclick="window.ProtecAdvancedModals.setVehicleFilter('${f.id}', '${st?.id}')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive ? 'bg-pc-blue text-white shadow-sm ring-2 ring-pc-blue/30' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }">
                  <span>${f.icon}</span>
                  <span>${f.label}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Sélecteur de Tri -->
          <div class="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Trier par :</span>
            <select onchange="window.ProtecAdvancedModals.setVehicleSort(this.value, '${st?.id}')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-xs text-slate-800 cursor-pointer focus:ring-2 focus:ring-pc-blue">
              <option value="price_asc" ${activeSort === 'price_asc' ? 'selected' : ''}>Prix croissant (Moins cher ➜ Plus cher)</option>
              <option value="price_desc" ${activeSort === 'price_desc' ? 'selected' : ''}>Prix décroissant (Plus cher ➜ Moins cher)</option>
              <option value="name_asc" ${activeSort === 'name_asc' ? 'selected' : ''}>Nom alphabétique (A ➜ Z)</option>
            </select>
          </div>
        </div>

        <!-- Grille des Cartes Opérationnelles -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${filteredCards.length === 0 ? `
            <div class="col-span-full p-8 text-center glass-card rounded-2xl text-slate-500">
              <p class="font-bold text-sm">Aucun véhicule opérationnel trouvé pour cette sélection.</p>
            </div>
          ` : filteredCards.map(card => {
            const isHeavyLicense = card.licenseRequired === 'C';
            const isMotoLicense = card.licenseRequired === 'Moto';
            const isNoLicense = card.licenseRequired === 'None';

            // Gestion de la sérigraphie dynamique pour le groupe VTU
            let activeImage = card.image;
            let activeTitle = card.title;
            let activeDesc = card.desc;
            let activeSpecialty = card.specialty;
            let activeSerigraphieLabel = null;

            if (card.hasSerigraphieSelector && card.serigraphies) {
              const selectedSerigKey = this.selectedSerigraphies?.[card.groupKey] || card.serigraphies[0].key;
              const curSerig = card.serigraphies.find(s => s.key === selectedSerigKey) || card.serigraphies[0];
              activeImage = curSerig.image;
              activeTitle = curSerig.subTitle;
              activeDesc = curSerig.desc;
              activeSpecialty = curSerig.specialty;
              activeSerigraphieLabel = curSerig.label;
            }

            // Options configurables actives pour cette carte
            const selOpts = this.getVehicleSelectedOptions(card.id);
            let optionsExtraCost = 0;
            const hasNativeTowHitch = Boolean(card.hasTowHitch);

            if (!hasNativeTowHitch && selOpts.towHitch) {
              optionsExtraCost += this.VEHICLE_OPTIONS.towHitch.cost;
            }
            if (selOpts.ledBar) {
              optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
            }
            if (selOpts.climatisation) {
              optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
            }
            if (selOpts.converter230v) {
              optionsExtraCost += this.VEHICLE_OPTIONS.converter230v.cost;
            }

            const totalCardCost = card.cost + optionsExtraCost;

            return `
              <div class="p-4 rounded-2xl glass-card space-y-3 flex flex-col justify-between hover:shadow-lg transition border border-slate-200/80 bg-white/95">
                <div class="space-y-2.5">
                  <!-- Image du véhicule -->
                  <div class="h-28 w-full flex items-center justify-center p-2 bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-2xl border border-slate-100 overflow-hidden shadow-inner group relative">
                    <img 
                      src="${activeImage || `images/vehicles/${card.type}.png`}" 
                      alt="${activeTitle}" 
                      class="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200" 
                      onerror="this.outerHTML='<span class=\\'text-4xl\\'>${card.icon || '🚐'}</span>'" 
                    />

                    <!-- Badge Permis Requis bien visible -->
                    <div class="absolute bottom-2 right-2">
                      <span class="px-2 py-0.5 rounded-lg text-[9.5px] font-black tracking-wide border shadow-xs ${
                        isHeavyLicense 
                          ? 'bg-amber-500 text-white border-amber-600 animate-pulse' 
                          : (isMotoLicense 
                              ? 'bg-sky-500 text-white border-sky-600' 
                              : (isNoLicense 
                                  ? 'bg-slate-200 text-slate-700 border-slate-300' 
                                  : 'bg-emerald-600 text-white border-emerald-700'))
                      }">
                        ${card.licenseLabel || `Permis ${card.licenseRequired}`}
                      </span>
                    </div>
                  </div>

                  <!-- Badge catégorie et prix -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-pc-blue/10 text-pc-blue">
                        ${card.type}
                      </span>
                      <span class="text-[10px] font-bold text-slate-500">
                        ${card.category}
                      </span>
                    </div>
                    <div class="text-right">
                      <span class="font-mono font-black text-sm text-slate-900 block">${totalCardCost.toLocaleString('fr-FR')} €</span>
                      ${optionsExtraCost > 0 ? `<span class="text-[9px] font-black text-pc-blue font-mono">+${optionsExtraCost} € options</span>` : ''}
                    </div>
                  </div>

                  <!-- Titre et Spécialité -->
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">${activeTitle}</h5>
                    <p class="text-[10px] text-slate-500 font-semibold mt-0.5">${activeSpecialty}</p>
                  </div>

                  <!-- SÉLECTEUR DE SÉRIGRAPHIE INTÉGRÉ POUR VTU (CONFORME DEMANDE) -->
                  ${card.hasSerigraphieSelector ? `
                    <div class="p-2 rounded-xl bg-orange-50/70 border border-orange-200/70 space-y-1.5">
                      <span class="text-[9.5px] font-black text-slate-700 block uppercase tracking-wider">
                        🎨 Sérigraphie / Livrée au choix :
                      </span>
                      <div class="grid grid-cols-1 gap-1">
                        ${card.serigraphies.map(s => {
                          const isCur = (this.selectedSerigraphies?.[card.groupKey] || card.serigraphies[0].key) === s.key;
                          return `
                            <button 
                              type="button" 
                              onclick="window.ProtecAdvancedModals.selectTypeSerigraphie('${card.groupKey}', '${s.key}', '${st?.id}')" 
                              class="px-2 py-1.5 rounded-lg text-left text-[10.5px] font-bold transition border cursor-pointer ${
                                isCur 
                                  ? 'bg-white border-pc-orange text-pc-orange font-black shadow-xs ring-1 ring-pc-orange/40' 
                                  : 'bg-white/60 hover:bg-white text-slate-600 border-slate-200'
                              }"
                            >
                              <span>${s.label}</span>
                            </button>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  ` : ''}

                  <p class="text-[11px] text-slate-600 leading-relaxed">${activeDesc}</p>

                  <!-- Spécifications techniques (Sans vitesse max) -->
                  <div class="p-2.5 rounded-xl glass-card-blue text-[10px] text-pc-blue font-bold flex flex-col gap-1">
                    <div class="flex justify-between items-center">
                      <span>Capacité : <strong class="text-slate-900">${card.capacity} place${card.capacity > 1 ? 's' : ''}</strong></span>
                      <span>Attelage : <strong class="${hasNativeTowHitch || selOpts.towHitch ? 'text-emerald-700' : 'text-slate-500'}">${hasNativeTowHitch ? '✓ De série' : (selOpts.towHitch ? '✓ Option ajoutée' : 'Non')}</strong></span>
                    </div>

                    ${card.requiresTrailer ? `
                      <div class="text-[9.5px] text-amber-800 font-semibold bg-amber-50 rounded p-1 border border-amber-200/80">
                        📦 Remorque routière fournie à l'achat
                      </div>
                    ` : ''}
                  </div>

                  <!-- Options & Équipements Configurables -->
                  <div class="space-y-1.5 pt-1.5 border-t border-slate-200/80">
                    <div class="flex items-center justify-between text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                      <span>🛠️ Options au choix :</span>
                      ${optionsExtraCost > 0 ? `<span class="text-pc-blue font-black font-mono">+${optionsExtraCost.toLocaleString('fr-FR')} €</span>` : ''}
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
                      ${hasNativeTowHitch ? `
                        <div class="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-between">
                          <span class="flex items-center gap-1"><span>🔗</span> Attelage</span>
                          <span class="text-[8.5px] font-black uppercase bg-emerald-200/70 px-1 rounded text-emerald-900">De Série</span>
                        </div>
                      ` : `
                        <button 
                          type="button" 
                          onclick="window.ProtecAdvancedModals.toggleVehicleOption('${card.id}', 'towHitch', '${st?.id}')"
                          class="p-1.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${selOpts.towHitch ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'}"
                        >
                          <span class="flex items-center gap-1"><span>🔗</span> Attelage</span>
                          <span class="font-mono font-black text-[9.5px] ${selOpts.towHitch ? 'text-pc-blue' : 'text-slate-500'}">+950 €</span>
                        </button>
                      `}

                      <button 
                        type="button" 
                        onclick="window.ProtecAdvancedModals.toggleVehicleOption('${card.id}', 'ledBar', '${st?.id}')"
                        class="p-1.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${selOpts.ledBar ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'}"
                      >
                        <span class="flex items-center gap-1"><span>🚨</span> Rampe LED</span>
                        <span class="font-mono font-black text-[9.5px] ${selOpts.ledBar ? 'text-pc-blue' : 'text-slate-500'}">+1 250 €</span>
                      </button>

                      <button 
                        type="button" 
                        onclick="window.ProtecAdvancedModals.toggleVehicleOption('${card.id}', 'climatisation', '${st?.id}')"
                        class="p-1.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${selOpts.climatisation ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'}"
                      >
                        <span class="flex items-center gap-1"><span>❄️</span> Climatisation/Chauffage</span>
                        <span class="font-mono font-black text-[9.5px] ${selOpts.climatisation ? 'text-pc-blue' : 'text-slate-500'}">+1 850 €</span>
                      </button>

                      <button 
                        type="button" 
                        onclick="window.ProtecAdvancedModals.toggleVehicleOption('${card.id}', 'converter230v', '${st?.id}')"
                        class="p-1.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${selOpts.converter230v ? 'bg-pc-blue/10 border-pc-blue text-pc-blue font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:bg-slate-100'}"
                      >
                        <span class="flex items-center gap-1"><span>⚡</span> 230V Pur Sinus</span>
                        <span class="font-mono font-black text-[9.5px] ${selOpts.converter230v ? 'text-pc-blue' : 'text-slate-500'}">+1 100 €</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Bouton de Commande -->
                <button 
                  type="button" 
                  onclick="window.ProtecAdvancedModals.buyFromTypeCard('${st?.id}', '${card.type}', '${card.id}')" 
                  class="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <span>Commander (${totalCardCost.toLocaleString('fr-FR')} €)</span>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  buyFromTypeCard(stationId, vehicleType, cardId) {
    const selOpts = this.getVehicleSelectedOptions(cardId);
    let optionsExtraCost = 0;
    const activeOptionsList = [];

    if (cardId === 'type_vtu_master3_grouped') {
      const selectedSerigKey = this.selectedSerigraphies?.['vtu_master3_serigraphie'] || 'logistique';
      const isSoutienPop = selectedSerigKey === 'soutien_pop';

      if (selOpts.ledBar) {
        optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
        activeOptionsList.push(this.VEHICLE_OPTIONS.ledBar.label);
      }
      if (selOpts.climatisation) {
        optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
        activeOptionsList.push(this.VEHICLE_OPTIONS.climatisation.label);
      }
      if (selOpts.converter230v) {
        optionsExtraCost += this.VEHICLE_OPTIONS.converter230v.cost;
        activeOptionsList.push(this.VEHICLE_OPTIONS.converter230v.label);
      }

      const variantOptions = {
        id: isSoutienPop ? 'master3_vtu_pop' : 'master3_vtu_log',
        name: isSoutienPop ? 'Renault Master III - VTU Soutien aux Populations' : 'Renault Master III - VTU Fourgon Logistique',
        model: isSoutienPop ? 'Renault Master III VTU Soutien Pop' : 'Renault Master III VTU Logistique',
        cost: 17500 + optionsExtraCost,
        capacity: 3,
        licenseRequired: 'B',
        hasTowHitch: true, // De série sur VTU Master 3
        serigraphieLabel: isSoutienPop ? 'Soutien aux Populations' : 'Logistique',
        image: isSoutienPop ? 'images/vehicles/master3_vtu_pop.png' : 'images/vehicles/master3_vtu_log.png',
        specialty: isSoutienPop ? 'Assistance Sinistrés' : 'Transport Lots PMA & Tentes',
        installedOptions: activeOptionsList
      };
      if (window.ProtecAdvanced && typeof window.ProtecAdvanced.buySpecializedVehicle === 'function') {
        window.ProtecAdvanced.buySpecializedVehicle(window.game, stationId, vehicleType, variantOptions);
      }
      return;
    }

    // Autres cartes
    const catalogItem = (window.ProtecAdvanced?.vehicleCatalog || []).find(v => v.type === vehicleType);
    let options = null;

    if (cardId === 'type_vpsp_master3') {
      options = {
        id: 'master3_vpsp',
        name: 'Renault Master III - VPSP Cellule Standard Profilée',
        model: 'Renault Master III VPSP Profilé',
        cost: 28500,
        capacity: 5,
        licenseRequired: 'B',
        hasTowHitch: false,
        image: 'images/vehicles/master3_vpsp.png'
      };
    } else if (cardId === 'type_vpsp_cube_master3') {
      options = {
        id: 'master3_vpsp_cube',
        name: 'Renault Master III - VPSP Grande Cellule Cube Sanitaire',
        model: 'Renault Master III VPSP Cube',
        cost: 32000,
        capacity: 5,
        licenseRequired: 'B',
        hasTowHitch: false,
        image: 'images/vehicles/master3_vpsp_cube.png'
      };
    } else if (cardId === 'type_vtp_master3') {
      options = {
        id: 'master3_vtp',
        name: 'Renault Master III - VTP Transport de Personnel (9 places)',
        model: 'Renault Master III VTP',
        cost: 21000,
        capacity: 9,
        licenseRequired: 'B',
        hasTowHitch: true,
        image: 'images/vehicles/master3_vtp.png'
      };
    } else if (cardId === 'type_vtp_trafic') {
      options = {
        id: 'trafic3_vtp',
        name: 'Renault Trafic III - VTP Minibus (9 places)',
        model: 'Renault Trafic III VTP',
        cost: 19500,
        capacity: 9,
        licenseRequired: 'B',
        hasTowHitch: true,
        image: 'images/vehicles/trafic_vtp.png'
      };
    } else if (cardId === 'type_flit_heavy') {
      options = {
        id: 'flit_heavy',
        name: 'FLIT - Fourgon Lourd d’Intervention Technique (Poids Lourd > 12t)',
        model: 'FLIT Poids Lourd (Type FPTL/FPTSR)',
        cost: 95000,
        capacity: 3,
        licenseRequired: 'C',
        hasTowHitch: true,
        image: 'images/vehicles/FLIT.png'
      };
    } else if (cardId === 'type_pcm_heavy') {
      options = {
        id: 'pcm_heavy',
        name: 'PCM - Poste de Commandement Mobile',
        model: 'PCM Poids Lourd',
        cost: 45000,
        capacity: 3,
        licenseRequired: 'C',
        hasTowHitch: false,
        image: 'images/vehicles/PCM.png'
      };
    } else if (cardId === 'type_ers_boat') {
      options = {
        id: 'ers_boat',
        name: 'ERS - Embarcation de Sauvetage + Remorque',
        model: 'ERS Pneumatique Rigide',
        cost: 13500,
        capacity: 4,
        licenseRequired: 'B',
        licenseLabel: 'Permis Bateau & SSA',
        requiresTrailer: true,
        hasTowHitch: false,
        image: 'images/vehicles/ERS.png'
      };
    }

    const targetOpt = options || Object.assign({}, catalogItem);
    const hasNativeTowHitch = Boolean(targetOpt.hasTowHitch);
    let finalTowHitch = hasNativeTowHitch;

    if (!hasNativeTowHitch && selOpts.towHitch) {
      optionsExtraCost += this.VEHICLE_OPTIONS.towHitch.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.towHitch.label);
      finalTowHitch = true;
    }
    if (selOpts.ledBar) {
      optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.ledBar.label);
    }
    if (selOpts.climatisation) {
      optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.climatisation.label);
    }
    if (selOpts.converter230v) {
      optionsExtraCost += this.VEHICLE_OPTIONS.converter230v.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.converter230v.label);
    }

    targetOpt.cost = (targetOpt.cost || 20000) + optionsExtraCost;
    targetOpt.hasTowHitch = finalTowHitch;
    targetOpt.installedOptions = activeOptionsList;

    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.buySpecializedVehicle === 'function') {
      window.ProtecAdvanced.buySpecializedVehicle(window.game, stationId, vehicleType, targetOpt);
    }
  },

  // --- 4. ARBRE DE COMPÉTENCES & BUREAU D'ANTENNE ---
  renderVolunteerSkills(game) {
    const bureau = game.bureau || { presidentId: null, chefOpId: null, tresorierId: null };

    return `
      <div class="space-y-6">
        <!-- Bureau de l'Antenne -->
        <div class="p-4 rounded-2xl glass-card space-y-3">
          <div>
            <h4 class="text-xs font-black text-indigo-950 uppercase tracking-wider">Bureau & Direction de l'Antenne</h4>
            <p class="text-[11px] text-indigo-700">Nommez des cadres à la gouvernance pour conférer des bonus de gestion à toute l'association.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Président -->
            <div class="p-3 rounded-xl glass-card space-y-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Président(e) d'Antenne</span>
              <div class="text-xs font-bold text-slate-900">${game.volunteers.find(v => v.id === bureau.presidentId)?.name || 'Poste Vacant'}</div>
              <span class="text-[10px] text-emerald-600 font-bold block">+15% Dons & Subventions</span>
              <select onchange="window.ProtecAdvanced.nominateBureauMember(window.game, 'president', this.value)" class="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 glass-input font-medium">
                <option value="">Nommer un cadre...</option>
                ${game.volunteers.map(v => `<option value="${v.id}" ${bureau.presidentId === v.id ? 'selected' : ''}>${v.name} (${v.rank})</option>`).join('')}
              </select>
            </div>

            <!-- Responsable Opérationnel -->
            <div class="p-3 rounded-xl glass-card space-y-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Responsable Opérationnel</span>
              <div class="text-xs font-bold text-slate-900">${game.volunteers.find(v => v.id === bureau.chefOpId)?.name || 'Poste Vacant'}</div>
              <span class="text-[10px] text-pc-blue font-bold block">-20% Délai départ en mission</span>
              <select onchange="window.ProtecAdvanced.nominateBureauMember(window.game, 'chefOp', this.value)" class="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 glass-input font-medium">
                <option value="">Nommer un cadre...</option>
                ${game.volunteers.map(v => `<option value="${v.id}" ${bureau.chefOpId === v.id ? 'selected' : ''}>${v.name} (${v.rank})</option>`).join('')}
              </select>
            </div>

            <!-- Trésorier -->
            <div class="p-3 rounded-xl glass-card space-y-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Trésorier(ère)</span>
              <div class="text-xs font-bold text-slate-900">${game.volunteers.find(v => v.id === bureau.tresorierId)?.name || 'Poste Vacant'}</div>
              <span class="text-[10px] text-amber-600 font-bold block">-15% Coûts garage & pharmacie</span>
              <select onchange="window.ProtecAdvanced.nominateBureauMember(window.game, 'tresorier', this.value)" class="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 glass-input font-medium">
                <option value="">Nommer un cadre...</option>
                ${game.volunteers.map(v => `<option value="${v.id}" ${bureau.tresorierId === v.id ? 'selected' : ''}>${v.name} (${v.rank})</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Habilitations & Compétences par secouriste -->
        <div class="space-y-3">
          <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Arbre d’Habilitations Individuelles</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${game.volunteers.map(v => {
              const currentSkills = v.skills || ['radio'];
              const exp = v.exp || 0;

              return `
                <div class="p-4 rounded-2xl glass-card space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">${v.avatar || '⛑️'}</span>
                      <div>
                        <h5 class="text-xs font-extrabold text-slate-900">${v.name}</h5>
                        <span class="text-[10px] text-slate-500">${v.rank} • <strong>${exp} XP disponible</strong></span>
                      </div>
                    </div>
                  </div>

                  <!-- Liste des compétences -->
                  <div class="space-y-1.5">
                    ${window.ProtecAdvanced.skillsList.map(sk => {
                      const hasSkill = currentSkills.includes(sk.id);
                      const canLearn = !hasSkill && exp >= sk.xpRequired;

                      return `
                        <div class="p-2 rounded-xl border flex items-center justify-between text-xs ${hasSkill ? 'glass-card-emerald text-emerald-950 border-emerald-300/40' : 'glass-card text-slate-700 border-white/60'}">
                          <div class="flex items-center gap-2">
                            <span>${sk.icon}</span>
                            <div>
                              <strong class="block text-[11px]">${sk.name}</strong>
                              <span class="text-[10px] text-slate-400">${sk.desc}</span>
                            </div>
                          </div>
                          <div>
                            ${hasSkill ? `
                              <span class="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">Acquis ✓</span>
                            ` : `
                              <button onclick="window.ProtecAdvanced.learnSkill(window.game, '${v.id}', '${sk.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold ${canLearn ? 'bg-pc-blue text-white hover:bg-pc-blue-light' : 'bg-slate-200/60 text-slate-400 cursor-not-allowed'} transition">
                                Débloquer (${sk.xpRequired} XP)
                              </button>
                            `}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // --- 5. MANŒUVRES MULTIJOUEURS & EXERCICES INTER-ALLIANCES ---
  renderManoeuvres(game) {
    const list = game.manoeuvres || [];

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-pc-blue text-white shadow-lg flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Exercices Fédéraux Inter-Antennes</span>
            <h4 class="text-base font-extrabold">Manœuvres de Sécurité Civile Planifiées</h4>
            <p class="text-xs text-indigo-100">Participez avec vos alliés pour monter en compétences et débloquer des fonds fédéraux.</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">Réseau Fédéral</span>
        </div>

        <div class="space-y-3">
          ${list.map(m => `
            <div class="p-4 rounded-2xl glass-card space-y-3">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">${m.type}</span>
                    <span class="text-xs font-bold text-slate-500">${m.dateDesc}</span>
                  </div>
                  <h4 class="text-sm font-extrabold text-slate-900 mt-1">${m.title}</h4>
                  <p class="text-xs text-slate-600 mt-0.5">${m.desc}</p>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-600 block">+${m.rewardMoney} €</span>
                  <span class="text-[10px] font-bold text-pc-blue block">+${m.rewardXp} XP / bénévole</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-100/70 text-xs">
                <span class="text-slate-500">Antennes alliées mobilisées : <strong>${m.participantsCount} détachements</strong></span>
                <button onclick="window.ProtecAdvanced.joinManoeuvre(window.game, '${m.id}')" class="px-4 py-2 rounded-xl font-extrabold ${m.status === 'joined' ? 'bg-emerald-100 text-emerald-800 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-pc-blue text-white hover:brightness-110'} shadow transition">
                  ${m.status === 'joined' ? 'Détachement Engagé ✓' : 'Engager mon Antenne'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
