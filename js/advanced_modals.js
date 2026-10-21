/**
 * PROTEC LIVE - RENDU DES INTERFACES AVANCÉES
 */

window.ProtecAdvancedModals = {
  // --- 1. MODAL RÉCOMPENSES & DÉFIS ---
  renderRewards(game) {
    if (window.ProtecAdvanced) {
      if (typeof window.ProtecAdvanced.injectAdvancedState === 'function') {
        window.ProtecAdvanced.injectAdvancedState(game);
      }
      if (typeof window.ProtecAdvanced.syncAdaptiveTasks === 'function') {
        window.ProtecAdvanced.syncAdaptiveTasks(game);
      }
      if (typeof window.ProtecAdvanced.updateTasksProgress === 'function') {
        window.ProtecAdvanced.updateTasksProgress(game);
      }
    }
    const currentTier = window.ProtecAdvanced?.detectAntennaTier?.(game) || 1;
    if (!game.rewards) {
      game.rewards = { streakDays: 1, dailyTasks: [], weeklyTasks: [] };
    }
    if (!Array.isArray(game.rewards.dailyTasks) || game.rewards.dailyTasks.length === 0) {
      game.rewards.dailyTasks = window.ProtecAdvanced?.getTasksForTier?.(currentTier, false) || [];
    }
    if (!Array.isArray(game.rewards.weeklyTasks) || game.rewards.weeklyTasks.length === 0) {
      game.rewards.weeklyTasks = window.ProtecAdvanced?.getTasksForTier?.(currentTier, true) || [];
    }
    const r = game.rewards;
    const streakInfo = window.ProtecAdvanced && typeof window.ProtecAdvanced.getStreakInfo === 'function'
      ? window.ProtecAdvanced.getStreakInfo(game)
      : { streakDays: Number(r.streakDays) || 1, targetClaimDay: 1, canClaim: true, alreadyClaimedToday: false, isBroken: false, hasAntenna: true };

    const hasAntenna = streakInfo.hasAntenna;
    const canClaimStreak = streakInfo.canClaim;
    const streakList = window.ProtecAdvanced?.streakRewardsCatalog || [
      { day: 1, title: 'Jour 1', shortDesc: '500 €', icon: '🎁' },
      { day: 2, title: 'Jour 2', shortDesc: '750 €', icon: '⚡' },
      { day: 3, title: 'Jour 3', shortDesc: '1 000 €', icon: '💰' },
      { day: 4, title: 'Jour 4', shortDesc: '1 250 €', icon: '⭐' },
      { day: 5, title: 'Jour 5', shortDesc: '1 500 €', icon: '💎' },
      { day: 6, title: 'Jour 6', shortDesc: '2 000 €', icon: '🎖️' },
      { day: 7, title: 'Jour 7', shortDesc: '5 000 €', icon: '🏆' }
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

        <!-- Bandeau Dotation Quotidienne & Série Consécutive -->
        <div class="p-5 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white shadow-xl space-y-3.5 relative overflow-hidden">
          <!-- Effet lumineux d'arrière-plan -->
          <div class="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-black uppercase tracking-wider text-rose-200">Dotation Fédérale & Assiduité</span>
                ${streakInfo.isBroken ? `
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 shadow-xs animate-pulse">Série interrompue</span>
                ` : streakInfo.alreadyClaimedToday ? `
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-400 text-slate-950 shadow-xs">À jour ✓</span>
                ` : `
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-yellow-300 text-slate-950 shadow-xs">Dotation prête !</span>
                `}
              </div>
              <h3 class="text-lg font-black mt-0.5 flex items-center gap-2">
                <span>Série de Connexion : Jour ${streakInfo.targetClaimDay} / 7</span>
                <span class="text-xs font-medium text-white/80">(${streakInfo.streakDays} jour(s) validé(s))</span>
              </h3>
            </div>

            <button onclick="window.ProtecAdvanced.claimDailyStreak(window.game)" 
              class="px-5 py-2.5 rounded-2xl font-black text-xs transition shadow-lg cursor-pointer flex items-center justify-center gap-2 ${canClaimStreak ? 'bg-white text-rose-600 hover:bg-rose-50 hover:scale-105 animate-bounce ring-4 ring-white/30' : 'bg-white/30 text-white/90 cursor-not-allowed'}"
              ${!canClaimStreak ? 'disabled' : ''}>
              ${canClaimStreak 
                ? `🎁 Réclamer la Dotation du Jour ${streakInfo.targetClaimDay}` 
                : (!hasAntenna ? '📍 Antenne requise' : `✓ Déjà réclamé aujourd’hui (Revenez demain)`)}
            </button>
          </div>

          <!-- Alerte explicative si la série a été rompue pour cause d'absence hier -->
          ${streakInfo.isBroken ? `
            <div class="p-3 bg-black/25 backdrop-blur-xs border border-amber-300/50 rounded-2xl flex items-center gap-2.5 text-xs text-amber-100">
              <span class="text-xl shrink-0">⚠️</span>
              <div>
                <strong class="text-amber-300">Série interrompue :</strong> Vous ne vous êtes pas connecté hier. La série de connexion quotidienne exige une assiduité quotidienne sans interruption pour atteindre le bonus du Jour 7. Votre série est repartie au <strong>Jour 1</strong> !
              </div>
            </div>
          ` : streakInfo.alreadyClaimedToday ? `
            <div class="p-2.5 bg-black/20 backdrop-blur-xs rounded-xl flex items-center gap-2 text-xs text-emerald-200 font-semibold">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-300 shrink-0"></i>
              <span>Dotation quotidienne récupérée ! Revenez demain pour franchir le <strong>Jour ${(streakInfo.streakDays >= 7) ? 1 : (streakInfo.streakDays + 1)}</strong>.</span>
            </div>
          ` : `
            <div class="p-2.5 bg-black/20 backdrop-blur-xs rounded-xl flex items-center gap-2 text-xs text-rose-100">
              <i data-lucide="flame" class="w-4 h-4 text-yellow-300 shrink-0 animate-pulse"></i>
              <span>Série consécutive en cours ! Connectez-vous chaque jour pour débloquer le Super Bonus Fédéral du Jour 7.</span>
            </div>
          `}

          <!-- Paliers des 7 jours -->
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
            ${streakList.map(s => {
              const isClaimedPast = s.day < streakInfo.targetClaimDay || (streakInfo.alreadyClaimedToday && s.day <= streakInfo.targetClaimDay);
              const isTargetToday = (s.day === streakInfo.targetClaimDay) && !streakInfo.alreadyClaimedToday;
              const isFuture = s.day > streakInfo.targetClaimDay;

              return `
                <div class="p-2.5 rounded-2xl text-center text-xs flex flex-col justify-between transition-all duration-200 ${
                  isTargetToday 
                    ? 'bg-white text-slate-900 shadow-xl ring-4 ring-yellow-300 scale-105 font-black' 
                    : isClaimedPast 
                      ? 'bg-white/20 text-white border border-white/30' 
                      : 'bg-black/25 text-white/60 border border-white/10'
                }">
                  <div class="flex items-center justify-between text-[10px] font-bold">
                    <span>${s.title}</span>
                    ${isClaimedPast ? '<span class="text-emerald-300 text-xs font-black">✓</span>' : (isTargetToday ? '<span class="text-rose-600 text-[9px] font-black animate-pulse">PRÊT</span>' : '<span class="text-white/40 text-[9px]">🔒</span>')}
                  </div>
                  <span class="text-2xl my-1.5">${s.icon}</span>
                  <span class="text-[9.5px] leading-tight font-extrabold line-clamp-2">${s.shortDesc || s.gift}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Objectifs Quotidiens (Missions du Jour) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="target" class="w-4 h-4 text-pc-blue"></i>
                <span>Objectifs du Jour (Missions 24h)</span>
              </h4>
              <p class="text-[11px] text-slate-500">Missions opérationnelles, logistique et formations renouvelées chaque jour.</p>
            </div>
            <span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-bold text-[10px] border border-slate-200">
              📅 Renouvellement à minuit
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${(r.dailyTasks || []).map(t => {
              const cur = t.current || 0;
              const pct = Math.min(100, Math.round((cur / t.goal) * 100));
              const canClaim = !t.done && (cur >= t.goal);

              return `
                <div class="p-4 rounded-3xl glass-card space-y-3 flex flex-col justify-between border transition ${canClaim ? 'border-emerald-400 ring-2 ring-emerald-300/40 bg-emerald-50/20' : 'border-slate-200/90'}">
                  <div class="space-y-2">
                    <div class="flex justify-between items-start gap-2">
                      <div class="flex items-start gap-2">
                        <div class="w-7 h-7 rounded-xl ${canClaim || t.done ? 'bg-emerald-100 text-emerald-800' : 'bg-pc-blue/10 text-pc-blue'} flex items-center justify-center shrink-0 text-xs font-black">
                          <i data-lucide="${t.icon || 'shield'}" class="w-4 h-4"></i>
                        </div>
                        <span class="font-extrabold text-xs text-slate-800 leading-snug">${t.title}</span>
                      </div>
                      <span class="font-mono font-black text-emerald-700 text-xs shrink-0 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">+${t.reward} €</span>
                    </div>

                    <div class="space-y-1 pt-1">
                      <div class="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Progression</span>
                        <span class="font-black text-slate-700 font-mono">${cur} / ${t.goal}</span>
                      </div>
                      <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                        <div class="${t.done || canClaim ? 'bg-emerald-500' : 'bg-pc-blue'} h-full rounded-full transition-all duration-300" style="width: ${t.done ? '100%' : pct + '%'}"></div>
                      </div>
                    </div>
                  </div>

                  <button onclick="window.ProtecAdvanced.claimTaskReward(window.game, '${t.id}', false)" 
                    class="w-full py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${t.done ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : (canClaim ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-bounce' : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed')}"
                    ${!canClaim && !t.done ? 'disabled' : ''}>
                    ${t.done ? 'Accompli ✓' : (canClaim ? '🎁 Réclamer Récompense' : `En cours (${cur}/${t.goal})`)}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Défis Hebdomadaires -->
        <div class="space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <i data-lucide="award" class="w-4 h-4 text-purple-600"></i>
                <span>Défis de la Semaine (Engagement de Sécurité Civile)</span>
              </h4>
              <p class="text-[11px] text-slate-500">Objectifs de fond récompensant le rayonnement et le volume d’activité de l’antenne.</p>
            </div>
            <span class="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 font-bold text-[10px] border border-purple-200">
              ⚡ Bonus hebdomadaires
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${(r.weeklyTasks || []).map(w => {
              const cur = w.current || 0;
              const pct = Math.min(100, Math.round((cur / w.goal) * 100));
              const canClaim = !w.done && (cur >= w.goal);

              return `
                <div class="p-4 rounded-3xl glass-card flex flex-col justify-between gap-3 border transition ${canClaim ? 'border-emerald-400 ring-2 ring-emerald-300/40 bg-emerald-50/20' : 'border-slate-200/90'}">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-start gap-2">
                        <div class="w-7 h-7 rounded-xl ${canClaim || w.done ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'} flex items-center justify-center shrink-0 text-xs font-black">
                          <i data-lucide="${w.icon || 'star'}" class="w-4 h-4"></i>
                        </div>
                        <span class="text-xs font-extrabold text-slate-800 leading-snug">${w.title}</span>
                      </div>
                      <span class="text-xs font-mono font-black text-purple-800 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200 shrink-0">+${w.reward} €</span>
                    </div>

                    <div class="space-y-1 pt-1">
                      <div class="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Progression</span>
                        <span class="font-black text-slate-700 font-mono">${cur} / ${w.goal}</span>
                      </div>
                      <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                        <div class="${w.done || canClaim ? 'bg-emerald-500' : 'bg-purple-600'} h-full rounded-full transition-all duration-300" style="width: ${w.done ? '100%' : pct + '%'}"></div>
                      </div>
                    </div>
                  </div>

                  <button onclick="window.ProtecAdvanced.claimTaskReward(window.game, '${w.id}', true)" 
                    class="w-full py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${w.done ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : (canClaim ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-bounce' : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed')}"
                    ${!canClaim && !w.done ? 'disabled' : ''}>
                    ${w.done ? 'Validé ✓' : (canClaim ? '🎁 Réclamer Récompense' : `En cours (${cur}/${w.goal})`)}
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
      desc: 'Visibilité optimale de nuit et vitesse d’urgence sur interventions (obligatoire sur VPSP).'
    },
    climatisation: {
      id: 'climatisation',
      label: 'Pack Climatisation Cellule & Chauffage Webasto',
      cost: 1850,
      icon: '❄️',
      desc: 'Confort thermique canicule / grand froid pour les victimes et les bénévoles.'
    },
    tensiometre_auto: {
      id: 'tensiometre_auto',
      label: 'Tensiomètre Automatique NIBP Brassard',
      cost: 450,
      icon: '🩺',
      desc: 'Mesure automatique et rapide de la tension artérielle (+5 réputation SAMU 15).'
    },
    schiller_t7: {
      id: 'schiller_t7',
      label: 'Moniteur Multiparamétrique ECG Schiller Touch 7',
      cost: 3800,
      icon: '📟',
      desc: 'Tracé ECG 12 dérivations, constantes temps réel Bluetooth (+10 réputation SAMU 15, +6 moral secouristes).'
    }
  },

  refreshVehicleShop(stationId, shouldFocusSearch = false) {
    if (!window.game) return;
    const showroom = document.getElementById('concessionnaire-showroom-container');
    if (showroom) {
      showroom.innerHTML = this.renderVehicleShop(window.game, stationId);
    } else {
      const body = document.getElementById('modal-body');
      if (body) body.innerHTML = this.renderVehicleShop(window.game, stationId);
    }
    if (shouldFocusSearch) {
      const input = document.getElementById('vehicle-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
    if (window.lucide) window.lucide.createIcons();
  },

  toggleVehicleOption(targetKey, optionKey, stationId) {
    if (!this.selectedVehicleOptions) this.selectedVehicleOptions = {};
    if (!this.selectedVehicleOptions[targetKey]) this.selectedVehicleOptions[targetKey] = {};
    this.selectedVehicleOptions[targetKey][optionKey] = !this.selectedVehicleOptions[targetKey][optionKey];
    this.refreshVehicleShop(stationId);
  },

  getVehicleSelectedOptions(targetKey) {
    return (this.selectedVehicleOptions && this.selectedVehicleOptions[targetKey]) || {};
  },

  setVehicleShopMode(mode, stationId) {
    this.shopMode = mode;
    this.refreshVehicleShop(stationId);
  },

  setVehicleSearch(searchKey, stationId) {
    this.vehicleSearch = searchKey;
    this.refreshVehicleShop(stationId, true);
  },

  setVehicleFilter(filterKey, stationId) {
    this.vehicleFilter = filterKey;
    this.refreshVehicleShop(stationId);
  },

  setVehicleSort(sortKey, stationId) {
    this.vehicleSort = sortKey;
    this.refreshVehicleShop(stationId);
  },

  selectModelVariant(modelId, variantId, stationId) {
    if (!this.selectedVariants) this.selectedVariants = {};
    this.selectedVariants[modelId] = variantId;
    this.refreshVehicleShop(stationId);
  },

  selectTypeSerigraphie(groupKey, variantId, stationId) {
    if (!this.selectedSerigraphies) this.selectedSerigraphies = {};
    this.selectedSerigraphies[groupKey] = variantId;
    this.refreshVehicleShop(stationId);
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

    const isVPSP = vehicleType === 'VPSP' || foundVariant?.type === 'VPSP';

    if (!hasNativeTowHitch && selOpts.towHitch) {
      optionsExtraCost += this.VEHICLE_OPTIONS.towHitch.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.towHitch.label);
      finalTowHitch = true;
    }
    if (!isVPSP && selOpts.ledBar) {
      optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.ledBar.label);
    }
    if (selOpts.climatisation) {
      optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.climatisation.label);
    }
    if (isVPSP && selOpts.tensiometre_auto) {
      optionsExtraCost += this.VEHICLE_OPTIONS.tensiometre_auto.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.tensiometre_auto.label);
    }
    if (isVPSP && selOpts.schiller_t7) {
      optionsExtraCost += this.VEHICLE_OPTIONS.schiller_t7.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.schiller_t7.label);
    }

    const customOptions = Object.assign({}, foundVariant, {
      cost: (foundVariant?.cost || 20000) + optionsExtraCost,
      hasTowHitch: finalTowHitch,
      hasLedBar: isVPSP || Boolean(selOpts.ledBar) || Boolean(foundVariant?.hasLedBar),
      hasConverter230v: true,
      hasTensiometreAuto: isVPSP && Boolean(selOpts.tensiometre_auto),
      hasSchillerT7: isVPSP && Boolean(selOpts.schiller_t7),
      installedOptions: activeOptionsList,
      capacity_log: foundVariant?.capacity_log || this.getVehicleLogCapacity(foundVariant)
    });

    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.buySpecializedVehicle === 'function') {
      window.ProtecAdvanced.buySpecializedVehicle(window.game, stationId, vehicleType, customOptions);
    }
  },

  // Calcul et vérification de la capacité logistique d'un véhicule/variante (tag LOG)
  getVehicleLogCapacity(item) {
    if (!item) return 0;
    const funcs = item.functions || [];
    const types = item.types || (item.type ? [item.type] : []);
    const type = (item.type || '').toUpperCase();
    const isLog = funcs.includes('LOG') || types.includes('LOG') || item.roleGroup === 'logistique' || ['VTU', 'FLIT', 'VAHU', 'VST', 'VTL', 'VALOG'].includes(type) || Boolean(item.capacity_log && item.capacity_log > 0);

    if (!isLog) return 0;

    if (item.capacity_log !== undefined && item.capacity_log !== null && item.capacity_log > 0) {
      return item.capacity_log;
    }

    if (type === 'FLIT') return 12;
    if (['VTU', 'VST', 'VTL'].includes(type)) return 6;
    if (['VAHU', 'VTD'].includes(type)) return 4;
    if (['PCM', 'VCYN', 'VLHR'].includes(type)) return 2;
    return 4;
  },

  getVehicleThumb(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('images/vehicles/') && !imagePath.includes('/thumbs/')) {
      return imagePath.replace('images/vehicles/', 'images/vehicles/thumbs/');
    }
    return imagePath;
  },

  renderVehicleShop(game, stationId) {
    const st = game.stations.find(s => s.id === stationId) || game.stations[0];
    
    // Détermination fiable de la capacité réelle du garage (hangar de l'antenne)
    let maxSlots = 2;
    if (window.ProtecLocaux && typeof window.ProtecLocaux.getGarageCapacity === 'function') {
      maxSlots = window.ProtecLocaux.getGarageCapacity(game, st?.id);
    } else if (window.ProtecAdvanced && typeof window.ProtecAdvanced.getGarageCapacity === 'function') {
      maxSlots = window.ProtecAdvanced.getGarageCapacity(game, st?.id);
    } else {
      const prem = st?.premises || st?.modularPremises;
      const garage = prem?.rooms?.garage_remisage || prem?.rooms?.garage || st?.rooms?.garage_remisage;
      const garageLevel = garage?.level || st?.rooms?.garage || 1;
      maxSlots = garage?.capacity || (garageLevel === 1 ? 2 : (garageLevel === 2 ? 4 : 8));
    }

    const stationVehicles = (game.vehicles || []).filter(v => v && (v.stationId === st?.id || (Array.isArray(st?.vehicles) && st.vehicles.includes(v.id))));
    const inDeliveryVehicles = (game.deliveries || []).filter(d => d.status === 'in_transit' && d.type === 'vehicle' && d.stationId === st?.id);
    const usedSlots = stationVehicles.length + inDeliveryVehicles.length;

    const currentShopMode = this.shopMode || 'models';
    const activeFilter = this.vehicleFilter || 'all';
    const activeSort = this.vehicleSort || 'price_asc';
    const activeSearch = (this.vehicleSearch || '').toLowerCase().trim();

    return `
      <div class="space-y-4">
        <!-- Bandeau d'en-tête et capacité du hangar -->
        <div class="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs backdrop-blur-md">
          <div>
            <h4 class="font-black text-slate-900 dark:text-white text-sm">Centrale d'Acquisition des Véhicules de Secours</h4>
            <p class="text-slate-500 dark:text-slate-400 mt-0.5">Capacité du Hangar : <strong class="text-slate-800 dark:text-slate-200">${usedSlots} / ${maxSlots} véhicules</strong> • Antenne : <strong class="text-slate-800 dark:text-slate-200">${st?.name || 'Principale'}</strong></p>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-bold text-slate-600 dark:text-slate-300">Trésorerie disponible : <strong class="text-pc-blue dark:text-blue-400 font-mono text-sm">${game.resources.money.toLocaleString('fr-FR')} €</strong></span>
          </div>
        </div>

        <!-- Raccourci vers le Marché de l'Occasion -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🏷️</span>
            <div>
              <strong class="text-amber-950 dark:text-amber-200 text-xs block font-black">Envie d'économiser sur votre parc roulant ?</strong>
              <span class="text-[11px] text-amber-800 dark:text-amber-300/80">Découvrez les véhicules révisés cédés par les autres directeurs (jusqu'à -50% vs neuf).</span>
            </div>
          </div>
          <button onclick="window.game.openModule('marche_occasion')" class="px-3.5 py-1.5 rounded-xl bg-pc-orange hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs shadow-xs transition cursor-pointer flex-shrink-0">
            Voir l'Occasion 🏷️
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════════════ -->
        <!-- SÉLECTEUR DES DEUX MODES DE RECHERCHE / CONFIGURATION    -->
        <!-- ══════════════════════════════════════════════════════════ -->
        <div class="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
          <button 
            type="button" 
            onclick="window.ProtecAdvancedModals.setVehicleShopMode('models', '${st?.id}')" 
            class="py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              currentShopMode === 'models' 
                ? 'bg-white dark:bg-pc-blue text-pc-blue dark:text-white shadow-md ring-2 ring-pc-blue/30 scale-[1.01]' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }"
          >
            <span class="text-base">🚗</span>
            <div class="text-left">
              <span class="block leading-none">Par Modèle & Configuration</span>
              <span class="text-[10px] font-semibold ${currentShopMode === 'models' ? 'text-pc-blue/80 dark:text-white/80' : 'text-slate-500 dark:text-slate-400'} block mt-0.5">Master 3, Trafic, Ducato • Choix aménagement & cube</span>
            </div>
          </button>

          <button 
            type="button" 
            onclick="window.ProtecAdvancedModals.setVehicleShopMode('types', '${st?.id}')" 
            class="py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
              currentShopMode === 'types' 
                ? 'bg-white dark:bg-pc-blue text-pc-blue dark:text-white shadow-md ring-2 ring-pc-blue/30 scale-[1.01]' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }"
          >
            <span class="text-base">🚑</span>
            <div class="text-left">
              <span class="block leading-none">Par Type Opérationnel</span>
              <span class="text-[10px] font-semibold ${currentShopMode === 'types' ? 'text-pc-blue/80 dark:text-white/80' : 'text-slate-500 dark:text-slate-400'} block mt-0.5">VPSP, VTU, VTP, VL, Poids Lourds • Sérigraphies regroupées</span>
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
            class="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-sm font-bold text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pc-blue transition"
          />
          ${this.vehicleSearch ? `
            <button onclick="window.ProtecAdvancedModals.setVehicleSearch('', '${st?.id}')" class="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer">✕</button>
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

            const isVPSP = currentVariant.type === 'VPSP';

            // Options configurables actives pour cette variante
            const selOpts = this.getVehicleSelectedOptions(currentVariant.id);
            let optionsExtraCost = 0;
            const hasNativeTowHitch = Boolean(currentVariant.hasTowHitch);

            if (!hasNativeTowHitch && selOpts.towHitch) {
              optionsExtraCost += this.VEHICLE_OPTIONS.towHitch.cost;
            }
            if (!isVPSP && selOpts.ledBar) {
              optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
            }
            if (selOpts.climatisation) {
              optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
            }
            if (isVPSP && selOpts.tensiometre_auto) {
              optionsExtraCost += this.VEHICLE_OPTIONS.tensiometre_auto.cost;
            }
            if (isVPSP && selOpts.schiller_t7) {
              optionsExtraCost += this.VEHICLE_OPTIONS.schiller_t7.cost;
            }

            const totalConfigCost = currentVariant.cost + optionsExtraCost;

            return `
              <div class="p-4 rounded-2xl space-y-3.5 flex flex-col justify-between hover:shadow-xl transition border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs vehicle-showroom-card">
                <div class="space-y-3">
                  <!-- En-tête modèle & marque -->
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-lg">${model.icon || '🚐'}</span>
                        <h4 class="font-black text-slate-900 dark:text-white text-sm">${model.name}</h4>
                      </div>
                      <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">${model.brand}</span>
                    </div>

                    <!-- Prix dynamique selon la configuration active -->
                    <div class="text-right">
                      <span class="font-mono font-black text-base text-slate-900 dark:text-white block">${totalConfigCost.toLocaleString('fr-FR')} €</span>
                      <span class="text-[9.5px] font-bold text-slate-400 dark:text-slate-400">${optionsExtraCost > 0 ? `(dont +${optionsExtraCost} € d'options)` : 'TTC • Neuf d\'usine'}</span>
                    </div>
                  </div>

                  <!-- Image dynamique en temps réel selon la variante -->
                  <div class="h-44 w-full flex items-center justify-center p-3 bg-gradient-to-b from-slate-100/80 to-slate-200/50 dark:from-slate-800/80 dark:to-slate-850/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 overflow-hidden shadow-inner group relative vehicle-image-box">
                    <img 
                      src="${this.getVehicleThumb(currentVariant.image || `images/vehicles/${currentVariant.type}.png`)}" 
                      alt="${currentVariant.name}" 
                      loading="lazy"
                      class="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200" 
                      onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${currentVariant.image || `images/vehicles/${currentVariant.type}.png`}'; } else { this.outerHTML='<span class=\\'text-5xl\\'>${model.icon || '🚐'}</span>'; }" 
                    />

                    <!-- Badge Type Opérationnel en haut à gauche -->
                    <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap max-w-[80%]">
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-pc-blue text-white shadow-xs">
                        ${currentVariant.type}
                      </span>
                      ${(currentVariant.functions || []).map(fCode => {
                        const f = window.ProtecAdvanced?.vehicleFunctions?.[fCode];
                        return `<span class="px-1.5 py-0.5 rounded-md text-[9px] font-black border shadow-2xs ${f?.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'}" title="${f?.code} : ${f?.label}">🏷️ ${fCode}</span>`;
                      }).join('')}
                      ${(() => {
                        const logCap = this.getVehicleLogCapacity(currentVariant);
                        return logCap > 0 ? `
                          <span class="px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs flex items-center gap-1">
                            <i data-lucide="package" class="w-3 h-3"></i>
                            <span>LOG : ${logCap} slots</span>
                          </span>
                        ` : '';
                      })()}
                      <span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 backdrop-blur-xs border border-slate-200/70 dark:border-slate-700">
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
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600' 
                                  : 'bg-emerald-600 text-white border-emerald-700'))
                      }">
                        ${currentVariant.licenseLabel || `Permis ${currentVariant.licenseRequired}`}
                      </span>
                    </div>
                  </div>

                  <!-- Sélecteur d'Aménagement / Configuration spécifique à ce châssis -->
                  <div>
                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                      ⚙️ Choisissez la configuration / aménagement (${variants.length} au choix) :
                    </span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      ${variants.map(v => {
                        const isSelected = v.id === currentVariant.id;
                        const vLogCap = this.getVehicleLogCapacity(v);
                        return `
                          <button 
                            type="button" 
                            onclick="window.ProtecAdvancedModals.selectModelVariant('${model.id}', '${v.id}', '${st?.id}')" 
                            class="px-2.5 py-2 rounded-xl text-left transition border cursor-pointer ${
                              isSelected 
                                ? 'bg-pc-blue/15 dark:bg-pc-blue/30 border-pc-blue text-pc-blue dark:text-blue-300 font-black ring-1 ring-pc-blue/40 shadow-xs' 
                                : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold'
                            }"
                          >
                            <div class="flex items-center justify-between text-xs leading-tight">
                              <span class="truncate">${v.shortName || v.name}</span>
                              <span class="font-mono text-[11px] shrink-0 font-black ${isSelected ? 'text-pc-blue dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'} ml-1">
                                ${(v.cost / 1000).toFixed(1)} k€
                              </span>
                            </div>
                            <span class="text-[9.5px] block font-semibold ${isSelected ? 'text-pc-blue/80 dark:text-blue-200' : 'text-slate-500 dark:text-slate-400'} mt-0.5">
                              ${v.type} ${(v.functions || []).map(f => `[${f}]`).join(' ')} • ${v.capacity} pl.${vLogCap > 0 ? ` • 📦 ${vLogCap} slots LOG` : ''}
                            </span>
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- Description & Spécificités de la variante configurée -->
                  <div class="space-y-1">
                    <h5 class="text-xs font-black text-slate-900 dark:text-white">${currentVariant.name}</h5>
                    <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${currentVariant.desc}</p>
                  </div>

                  <!-- Fiche Technique Rapide (Sans vitesse max) -->
                  <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-2">
                    <div>
                      Capacité : <strong class="text-slate-900 dark:text-white">${currentVariant.capacity} place${currentVariant.capacity > 1 ? 's' : ''}</strong>
                    </div>
                    <div>
                      Attelage : <strong class="${hasNativeTowHitch || selOpts.towHitch ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}">${hasNativeTowHitch ? '✓ De série' : (selOpts.towHitch ? '✓ Option ajoutée' : 'Non équipé')}</strong>
                    </div>
                    ${(() => {
                      const logCap = this.getVehicleLogCapacity(currentVariant);
                      if (logCap > 0) {
                        return `
                          <div class="col-span-2 flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-200">
                            <span class="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                              <i data-lucide="package" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"></i>
                              <span>Capacité Logistique (tag LOG) :</span>
                            </span>
                            <strong class="font-black font-mono text-amber-800 dark:text-amber-300 text-xs">${logCap} slot${logCap > 1 ? 's' : ''} de fret</strong>
                          </div>
                        `;
                      }
                      return '';
                    })()}
                    <div class="col-span-2">
                      Spécialité : <strong class="text-pc-blue dark:text-blue-400">${currentVariant.specialty || 'Polyvalent'}</strong>
                    </div>
                  </div>

                  <!-- Options & Équipements Configurables -->
                  <div class="space-y-1.5 pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
                    <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span>🛠️ Options & Équipements Configurables :</span>
                      ${optionsExtraCost > 0 ? `<span class="text-pc-blue dark:text-blue-400 font-black font-mono">+${optionsExtraCost.toLocaleString('fr-FR')} €</span>` : ''}
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px]">
                      <!-- Option Boule d'attelage -->
                      ${hasNativeTowHitch ? `
                        <div class="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between">
                          <span class="flex items-center gap-1.5"><span>🔗</span> Boule d’attelage</span>
                          <span class="text-[9px] font-black uppercase bg-emerald-200/80 dark:bg-emerald-800/60 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-100">De Série</span>
                        </div>
                      ` : `
                        <button 
                          type="button" 
                          onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'towHitch', '${st?.id}')"
                          class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.towHitch ? 'bg-pc-blue/15 dark:bg-pc-blue/30 border-pc-blue text-pc-blue dark:text-blue-300 font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-750'}"
                        >
                          <span class="flex items-center gap-1.5"><span>🔗</span> Boule d’attelage</span>
                          <span class="font-mono font-black text-[10px] ${selOpts.towHitch ? 'text-pc-blue dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}">+950 €</span>
                        </button>
                      `}

                      <!-- Option Rampe LED : Obligatoire et de série sur VPSP, optionnelle sur les autres -->
                      ${isVPSP ? `
                        <div class="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-bold flex items-center justify-between text-xs">
                          <span class="flex items-center gap-1.5"><span>🚨</span> Rampe Gyrophares LED</span>
                          <span class="text-[9px] font-black uppercase bg-blue-200/80 dark:bg-blue-800/60 px-1.5 py-0.5 rounded text-blue-950 dark:text-blue-100">De Série (Obligatoire)</span>
                        </div>
                      ` : `
                        <button 
                          type="button" 
                          onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'ledBar', '${st?.id}')"
                          class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.ledBar ? 'bg-pc-blue/15 dark:bg-pc-blue/30 border-pc-blue text-pc-blue dark:text-blue-300 font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-750'}"
                        >
                          <span class="flex items-center gap-1.5"><span>🚨</span> Rampe LED & Calandre</span>
                          <span class="font-mono font-black text-[10px] ${selOpts.ledBar ? 'text-pc-blue dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}">+1 250 €</span>
                        </button>
                      `}

                      <!-- Option Climatisation / Chauffage -->
                      <button 
                        type="button" 
                        onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'climatisation', '${st?.id}')"
                        class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.climatisation ? 'bg-pc-blue/15 dark:bg-pc-blue/30 border-pc-blue text-pc-blue dark:text-blue-300 font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-750'}"
                      >
                        <span class="flex items-center gap-1.5"><span>❄️</span> Climatisation / Webasto</span>
                        <span class="font-mono font-black text-[10px] ${selOpts.climatisation ? 'text-pc-blue dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}">+1 850 €</span>
                      </button>

                      <!-- Équipement de Série : Convertisseur 230V Sinus (Systématique) -->
                      <div class="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between text-xs">
                        <span class="flex items-center gap-1.5"><span>⚡</span> Convertisseur 230V Sinus</span>
                        <span class="text-[9px] font-black uppercase bg-emerald-200/80 dark:bg-emerald-800/60 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-100">De Série</span>
                      </div>

                      <!-- Options Médicales de Confort spécifiques VPSP -->
                      ${isVPSP ? `
                        <button 
                          type="button" 
                          onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'tensiometre_auto', '${st?.id}')"
                          class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.tensiometre_auto ? 'bg-pc-blue/15 dark:bg-pc-blue/30 border-pc-blue text-pc-blue dark:text-blue-300 font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-750'}"
                        >
                          <span class="flex items-center gap-1.5"><span>🩺</span> Tensiomètre Auto NIBP</span>
                          <span class="font-mono font-black text-[10px] ${selOpts.tensiometre_auto ? 'text-pc-blue dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}">+450 €</span>
                        </button>

                        <button 
                          type="button" 
                          onclick="window.ProtecAdvancedModals.toggleVehicleOption('${currentVariant.id}', 'schiller_t7', '${st?.id}')"
                          class="p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${selOpts.schiller_t7 ? 'bg-purple-100/70 dark:bg-purple-950/50 border-purple-500 text-purple-900 dark:text-purple-200 font-black shadow-xs ring-1 ring-purple-400/50' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-750'}"
                        >
                          <span class="flex items-center gap-1.5"><span>📟</span> Schiller Touch 7 (ECG)</span>
                          <span class="font-mono font-black text-[10px] ${selOpts.schiller_t7 ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'}">+3 800 €</span>
                        </button>
                      ` : ''}
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
      // 1. VPSP Renault Master 4 Nouvelle Génération
      {
        id: 'type_vpsp_master4',
        type: 'VPSP',
        title: 'VPSP - Ambulance Master IV (Nouvelle Génération)',
        category: 'Secours d’Urgence',
        roleGroup: 'secours',
        desc: 'Ambulance grand confort de dernière génération aux normes EN 1789, brancard 3 points assisté, suspension confort et motorisation efficiente. Conduite avec Permis B.',
        cost: 34500,
        capacity: 5,
        speedKmH: 90,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
        hasTowHitch: false,
        image: 'images/vehicles/master4_vpsp.png',
        icon: '🚑',
        specialty: 'Urgences Réflexes & SAMU 15',
        variantOptions: {
          id: 'master4_vpsp',
          name: 'Renault Master IV - VPSP Nouvelle Génération',
          model: 'Renault Master IV VPSP',
          cost: 34500,
          capacity: 5,
          licenseRequired: 'B',
          image: 'images/vehicles/master4_vpsp.png'
        }
      },
      // 2. VPSP Renault Master 3 Profilé
      {
        id: 'type_vpsp_master3',
        type: 'VPSP',
        title: 'VPSP - Ambulance Profilée Standard (Master III)',
        category: 'Secours d’Urgence',
        roleGroup: 'secours',
        desc: 'Cellule sanitaire profilée d’intervention d’urgence aux normes EN 1789, brancard 3 points et dotation SUAP. Conduite avec Permis B (Habilitation interne P.VPSP requise uniquement pour le transport effectif de victime).',
        cost: 28500,
        capacity: 5,
        speedKmH: 85,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
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
      // 3. VPSP Renault Master 3 Cube
      {
        id: 'type_vpsp_cube_master3',
        type: 'VPSP',
        title: 'VPSP - Grande Cellule Carrée Cube (Master III)',
        category: 'Secours d’Urgence',
        roleGroup: 'secours',
        desc: 'Cellule cubique sanitaire XXL grand volume. Espace d’intervention maximal idéal pour réanimation et soins intensifs. Conduite avec Permis B.',
        cost: 32000,
        capacity: 5,
        speedKmH: 80,
        licenseRequired: 'B',
        licenseLabel: 'Permis B',
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
        functions: ['TU', 'LOG'],
        capacity_log: 6,
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
      // 8. FLIT Poids Lourd Soutien Pop
      {
        id: 'type_flit_heavy',
        type: 'FLIT',
        title: 'FLIT - Fourgon Lourd d’Intervention Technique & Soutien Pop',
        category: 'Technique & Soutien',
        roleGroup: 'heavy',
        functions: ['LOG', 'POP', 'TECH'],
        capacity_log: 12,
        desc: 'Châssis Poids Lourd lourdement équipé avec rideaux alu, groupe électrogène haute puissance, mât d’éclairage télescopique, lot PMA et motopompes. Conducteur Permis C obligatoire.',
        cost: 95000,
        capacity: 3,
        speedKmH: 70,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd)',
        hasTowHitch: true,
        image: 'images/vehicles/flit_pop.png',
        icon: '🏗️',
        specialty: 'Postes Médicaux Avancés & Crises',
        variantOptions: {
          id: 'flit_heavy',
          name: 'FLIT - Fourgon Lourd d’Intervention Technique & Soutien Pop',
          model: 'FLIT Poids Lourd Soutien Pop',
          cost: 95000,
          capacity: 3,
          licenseRequired: 'C',
          image: 'images/vehicles/flit_pop.png',
          functions: ['LOG', 'POP', 'TECH'],
          capacity_log: 12
        }
      },
      // 9. Renault Midliner S135 FLIT Soutien Pop
      {
        id: 'type_midliner_flit',
        type: 'FLIT',
        title: 'FLIT - Renault Midliner S135 Soutien Pop (Poids Lourd)',
        category: 'Technique & Soutien',
        roleGroup: 'heavy',
        functions: ['LOG', 'POP'],
        capacity_log: 8,
        desc: 'Poids Lourd d’assistance aux populations sinistrées et soutien logistique lourd en situation de crise ou inondation.',
        cost: 42000,
        capacity: 3,
        speedKmH: 75,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd)',
        hasTowHitch: true,
        image: 'images/vehicles/midliners135_flit_pop.png',
        icon: '🏗️',
        specialty: 'Catastrophes & Soutien Sinistrés',
        variantOptions: {
          id: 'midliners135_flit_pop',
          name: 'Renault Midliner S135 - FLIT Soutien Pop',
          model: 'Renault Midliner S135 FLIT',
          cost: 42000,
          capacity: 3,
          licenseRequired: 'C',
          image: 'images/vehicles/midliners135_flit_pop.png'
        }
      },
      // 10. PCM Renault Midlum
      {
        id: 'type_pcm_heavy',
        type: 'PCM',
        title: 'PCM - Poste de Commandement Mobile (Renault Midlum)',
        category: 'Commandement Lourd',
        roleGroup: 'heavy',
        desc: 'Centre opérationnel mobile de crise sur châssis Renault Midlum avec baie de transmissions VHF/UHF, satellite et salle de crise embarquée. Conducteur Permis C obligatoire.',
        cost: 55000,
        capacity: 3,
        speedKmH: 70,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd)',
        hasTowHitch: false,
        image: 'images/vehicles/midlum_pc.png',
        icon: '🚍',
        specialty: 'Coordination Grands Événements & NOVI',
        variantOptions: {
          id: 'pcm_heavy',
          name: 'Renault Midlum - PCM Poste de Commandement Mobile',
          model: 'PCM Renault Midlum',
          cost: 55000,
          capacity: 3,
          licenseRequired: 'C',
          image: 'images/vehicles/midlum_pc.png'
        }
      },
      // 11. Renault Trucks PL Soutien Pop
      {
        id: 'type_pl_pop',
        type: 'VTU',
        title: 'PL POP - Poids Lourd Soutien aux Populations (Renault Trucks)',
        category: 'Soutien & Sauvegarde',
        roleGroup: 'heavy',
        desc: 'Camion Poids Lourd grand volume avec hayon élévateur pour le déploiement massif de lits picot, malles d’hébergement d’urgence et ravitaillement citoyen.',
        cost: 58000,
        capacity: 3,
        speedKmH: 75,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd)',
        hasTowHitch: true,
        image: 'images/vehicles/pl_pop.png',
        icon: '🚚',
        specialty: 'Hébergement d’Urgence & Crises',
        variantOptions: {
          id: 'pl_pop',
          name: 'Renault Trucks PL - Soutien aux Populations',
          model: 'Renault Trucks PL POP',
          cost: 58000,
          capacity: 3,
          licenseRequired: 'C',
          image: 'images/vehicles/pl_pop.png'
        }
      },
      // 12. Renault TRM 2000 4x4 Tout-Terrain
      {
        id: 'type_trm_pop',
        type: 'VLHR',
        title: 'TRM 2000 4x4 - Camion Tout-Terrain Soutien aux Populations',
        category: 'Tout-Terrain Lourd',
        roleGroup: 'heavy',
        desc: 'Camion Poids Lourd 4x4 tout-terrain de franchissement lourd pour inondations sévères, tempêtes, pistes dégradées et accès en zone sinistrée coupée du monde.',
        cost: 48000,
        capacity: 3,
        speedKmH: 70,
        licenseRequired: 'C',
        licenseLabel: 'Permis C (Poids Lourd)',
        hasTowHitch: true,
        image: 'images/vehicles/trm_pop.png',
        icon: '🚜',
        specialty: 'Inondations, Tempêtes & Crues',
        variantOptions: {
          id: 'trm_pop',
          name: 'Renault TRM 2000 4x4 - Soutien aux Populations',
          model: 'Renault TRM 2000 4x4',
          cost: 48000,
          capacity: 3,
          licenseRequired: 'C',
          image: 'images/vehicles/trm_pop.png'
        }
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
        <div class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <!-- Filtres boutons -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            ${filterOptions.map(f => {
              const isActive = activeFilter === f.id;
              return `
                <button type="button" onclick="window.ProtecAdvancedModals.setVehicleFilter('${f.id}', '${st?.id}')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-black transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive ? 'bg-pc-blue text-white shadow-sm ring-2 ring-pc-blue/30' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                }">
                  <span>${f.icon}</span>
                  <span>${f.label}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Sélecteur de Tri -->
          <div class="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Trier par :</span>
            <select onchange="window.ProtecAdvancedModals.setVehicleSort(this.value, '${st?.id}')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-white cursor-pointer focus:ring-2 focus:ring-pc-blue">
              <option value="price_asc" ${activeSort === 'price_asc' ? 'selected' : ''}>Prix croissant (Moins cher ➜ Plus cher)</option>
              <option value="price_desc" ${activeSort === 'price_desc' ? 'selected' : ''}>Prix décroissant (Plus cher ➜ Moins cher)</option>
              <option value="name_asc" ${activeSort === 'name_asc' ? 'selected' : ''}>Nom alphabétique (A ➜ Z)</option>
            </select>
          </div>
        </div>

        <!-- Grille des Cartes Opérationnelles -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${filteredCards.length === 0 ? `
            <div class="col-span-full p-8 text-center bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400">
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
            const isVPSP = card.type === 'VPSP';
            const hasNativeTowHitch = Boolean(card.hasTowHitch);

            if (!hasNativeTowHitch && selOpts.towHitch) {
              optionsExtraCost += this.VEHICLE_OPTIONS.towHitch.cost;
            }
            if (!isVPSP && selOpts.ledBar) {
              optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
            }
            if (selOpts.climatisation) {
              optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
            }

            const totalCardCost = card.cost + optionsExtraCost;

            return `
              <div class="p-4 rounded-2xl space-y-3 flex flex-col justify-between hover:shadow-lg transition border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xs vehicle-showroom-card">
                <div class="space-y-2.5">
                  <!-- Image du véhicule -->
                  <div class="h-28 w-full flex items-center justify-center p-2 bg-gradient-to-b from-slate-100/80 to-slate-200/50 dark:from-slate-800/80 dark:to-slate-850/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/80 overflow-hidden shadow-inner group relative vehicle-image-box">
                    <img 
                      src="${this.getVehicleThumb(activeImage || `images/vehicles/${card.type}.png`)}" 
                      alt="${activeTitle}" 
                      loading="lazy"
                      class="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-200" 
                      onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${activeImage || `images/vehicles/${card.type}.png`}'; } else { this.outerHTML='<span class=\\'text-4xl\\'>${card.icon || '🚐'}</span>'; }" 
                    />

                    <!-- Badge Permis Requis bien visible -->
                    <div class="absolute bottom-2 right-2">
                      <span class="px-2 py-0.5 rounded-lg text-[9.5px] font-black tracking-wide border shadow-xs ${
                        isHeavyLicense 
                          ? 'bg-amber-600 text-white border-amber-700' 
                          : (isMotoLicense 
                              ? 'bg-sky-500 text-white border-sky-600' 
                              : (isNoLicense 
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600' 
                                  : 'bg-emerald-600 text-white border-emerald-700'))
                      }">
                        ${card.licenseLabel || `Permis ${card.licenseRequired}`}
                      </span>
                    </div>
                  </div>

                  <!-- Badge catégorie et prix -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-pc-blue/15 text-pc-blue dark:bg-pc-blue/30 dark:text-blue-300">
                        ${card.type}
                      </span>
                      ${(() => {
                        const funcs = game.getVehicleFunctions ? game.getVehicleFunctions(card) : [];
                        return funcs.map(f => `<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black border shadow-2xs ${f.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'}" title="${f.code} : ${f.label}">🏷️ ${f.code}</span>`).join('');
                      })()}
                      ${(() => {
                        const logCap = this.getVehicleLogCapacity(card);
                        return logCap > 0 ? `
                          <span class="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/80 flex items-center gap-1 shadow-2xs">
                            <i data-lucide="package" class="w-2.5 h-2.5 text-amber-700 dark:text-amber-400"></i>
                            <span>LOG : ${logCap} slots</span>
                          </span>
                        ` : '';
                      })()}
                      <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        ${card.category}
                      </span>
                    </div>
                    <div class="text-right">
                      <span class="font-mono font-black text-sm text-slate-900 dark:text-white block">${totalCardCost.toLocaleString('fr-FR')} €</span>
                      ${optionsExtraCost > 0 ? `<span class="text-[9px] font-black text-pc-blue dark:text-blue-400 font-mono">+${optionsExtraCost} € options</span>` : ''}
                    </div>
                  </div>

                  <!-- Titre et Spécialité -->
                  <div>
                    <h5 class="text-xs font-black text-slate-900 dark:text-white leading-tight">${activeTitle}</h5>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">${activeSpecialty}</p>
                  </div>

                  <!-- SÉLECTEUR DE SÉRIGRAPHIE INTÉGRÉ POUR VTU (CONFORME DEMANDE) -->
                  ${card.hasSerigraphieSelector ? `
                    <div class="p-2 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/70 space-y-1.5">
                      <span class="text-[9.5px] font-black text-slate-700 dark:text-orange-200 block uppercase tracking-wider">
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
                                  ? 'bg-white dark:bg-slate-800 border-pc-orange text-pc-orange font-black shadow-xs ring-1 ring-pc-orange/40' 
                                  : 'bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }"
                            >
                              <span>${s.label}</span>
                            </button>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  ` : ''}

                  <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${activeDesc}</p>

                  <!-- Spécifications techniques (Sans vitesse max) -->
                  <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex flex-col gap-1.5">
                    <div class="flex justify-between items-center">
                      <span>Capacité : <strong class="text-slate-900 dark:text-white">${card.capacity} place${card.capacity > 1 ? 's' : ''}</strong></span>
                      <span>Attelage : <strong class="${hasNativeTowHitch || selOpts.towHitch ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}">${hasNativeTowHitch ? '✓ De série' : (selOpts.towHitch ? '✓ Option ajoutée' : 'Non')}</strong></span>
                    </div>

                    ${(() => {
                      const logCap = this.getVehicleLogCapacity(card);
                      if (logCap > 0) {
                        return `
                          <div class="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700 text-amber-900 dark:text-amber-300">
                            <span class="flex items-center gap-1 font-bold">
                              <i data-lucide="package" class="w-3 h-3 text-amber-600 dark:text-amber-400"></i>
                              <span>Capacité Logistique (tag LOG) :</span>
                            </span>
                            <strong class="font-black font-mono text-amber-900 dark:text-amber-300 text-xs">${logCap} slot${logCap > 1 ? 's' : ''}</strong>
                          </div>
                        `;
                      }
                      return '';
                    })()}

                    ${card.requiresTrailer ? `
                      <div class="text-[9.5px] text-amber-800 dark:text-amber-200 font-semibold bg-amber-50 dark:bg-amber-950/40 rounded p-1 border border-amber-200/80 dark:border-amber-800/60">
                        📦 Remorque routière fournie à l'achat
                      </div>
                    ` : ''}
                  </div>

                  <!-- Options & Équipements Configurables -->
                  <div class="space-y-1.5 pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
                    <div class="flex items-center justify-between text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span>🛠️ Options au choix :</span>
                      ${optionsExtraCost > 0 ? `<span class="text-pc-blue dark:text-blue-400 font-mono">+${optionsExtraCost.toLocaleString('fr-FR')} €</span>` : ''}
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px]">
                      ${hasNativeTowHitch ? `
                        <div class="p-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between">
                          <span class="flex items-center gap-1"><span>🔗</span> Attelage</span>
                          <span class="text-[8.5px] font-black uppercase bg-emerald-200/80 dark:bg-emerald-800/60 px-1 rounded text-emerald-900 dark:text-emerald-100">De Série</span>
                        </div>
                      ` : `
                        <button 
                          type="button" 
                          onclick="window.ProtecAdvancedModals.toggleVehicleOption('${card.id}', 'towHitch', '${st?.id}')"
                          class="p-1.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${selOpts.towHitch ? 'bg-pc-blue/15 dark:bg-pc-blue/30 border-pc-blue text-pc-blue dark:text-blue-300 font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-750'}"
                        >
                          <span class="flex items-center gap-1"><span>🔗</span> Attelage</span>
                          <span class="font-mono font-black text-[9.5px] ${selOpts.towHitch ? 'text-pc-blue dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}">+950 €</span>
                        </button>
                      `}

                      <!-- Option Rampe LED : Obligatoire et de série sur VPSP, optionnelle sur les autres -->
                      ${isVPSP ? `
                        <div class="p-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 font-bold flex items-center justify-between text-[10px]">
                          <span class="flex items-center gap-1"><span>🚨</span> Rampe LED</span>
                          <span class="text-[8.5px] font-black uppercase bg-blue-200/80 dark:bg-blue-800/60 px-1.5 py-0.5 rounded text-blue-950 dark:text-blue-100">De Série (Obligatoire)</span>
                        </div>
                      ` : `
                        <button 
                          type="button" 
                          onclick="window.ProtecAdvancedModals.toggleVehicleOption('${card.id}', 'ledBar', '${st?.id}')"
                          class="p-1.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${selOpts.ledBar ? 'bg-pc-blue/15 dark:bg-pc-blue/30 border-pc-blue text-pc-blue dark:text-blue-300 font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-750'}"
                        >
                          <span class="flex items-center gap-1"><span>🚨</span> Rampe LED</span>
                          <span class="font-mono font-black text-[9.5px] ${selOpts.ledBar ? 'text-pc-blue dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}">+1 250 €</span>
                        </button>
                      `}

                      <button 
                        type="button" 
                        onclick="window.ProtecAdvancedModals.toggleVehicleOption('${card.id}', 'climatisation', '${st?.id}')"
                        class="p-1.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${selOpts.climatisation ? 'bg-pc-blue/15 dark:bg-pc-blue/30 border-pc-blue text-pc-blue dark:text-blue-300 font-black shadow-xs ring-1 ring-pc-blue/30' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-750'}"
                      >
                        <span class="flex items-center gap-1"><span>❄️</span> Climatisation/Chauffage</span>
                        <span class="font-mono font-black text-[9.5px] ${selOpts.climatisation ? 'text-pc-blue dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}">+1 850 €</span>
                      </button>

                      <!-- Équipement de Série : Convertisseur 230V Sinus (Systématique) -->
                      <div class="p-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold flex items-center justify-between text-[10px]">
                        <span class="flex items-center gap-1"><span>⚡</span> 230V Pur Sinus</span>
                        <span class="text-[8.5px] font-black uppercase bg-emerald-200/80 dark:bg-emerald-800/60 px-1.5 py-0.5 rounded text-emerald-900 dark:text-emerald-100">De Série</span>
                      </div>
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

      const variantOptions = {
        id: isSoutienPop ? 'master3_vtu_pop' : 'master3_vtu_log',
        name: isSoutienPop ? 'Renault Master III - VTU Soutien aux Populations' : 'Renault Master III - VTU Fourgon Logistique',
        model: isSoutienPop ? 'Renault Master III VTU Soutien Pop' : 'Renault Master III VTU Logistique',
        cost: 17500 + optionsExtraCost,
        capacity: 3,
        licenseRequired: 'B',
        hasTowHitch: true, // De série sur VTU Master 3
        hasLedBar: Boolean(selOpts.ledBar),
        hasConverter230v: true,
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

    if (cardId === 'type_vpsp_master4') {
      options = {
        id: 'master4_vpsp',
        name: 'Renault Master IV - VPSP Nouvelle Génération',
        model: 'Renault Master IV VPSP',
        cost: 34500,
        capacity: 5,
        licenseRequired: 'B',
        hasTowHitch: false,
        image: 'images/vehicles/master4_vpsp.png'
      };
    } else if (cardId === 'type_vpsp_master3') {
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
        name: 'FLIT - Fourgon Lourd d’Intervention Technique & Soutien Pop',
        model: 'FLIT Poids Lourd Soutien Pop',
        cost: 95000,
        capacity: 3,
        licenseRequired: 'C',
        hasTowHitch: true,
        image: 'images/vehicles/flit_pop.png'
      };
    } else if (cardId === 'type_midliner_flit') {
      options = {
        id: 'midliners135_flit_pop',
        name: 'Renault Midliner S135 - FLIT Soutien Pop',
        model: 'Renault Midliner S135 FLIT',
        cost: 42000,
        capacity: 3,
        licenseRequired: 'C',
        hasTowHitch: true,
        image: 'images/vehicles/midliners135_flit_pop.png'
      };
    } else if (cardId === 'type_pcm_heavy') {
      options = {
        id: 'pcm_heavy',
        name: 'Renault Midlum - PCM Poste de Commandement Mobile',
        model: 'PCM Renault Midlum',
        cost: 55000,
        capacity: 3,
        licenseRequired: 'C',
        hasTowHitch: false,
        image: 'images/vehicles/midlum_pc.png'
      };
    } else if (cardId === 'type_pl_pop') {
      options = {
        id: 'pl_pop',
        name: 'Renault Trucks PL - Soutien aux Populations',
        model: 'Renault Trucks PL POP',
        cost: 58000,
        capacity: 3,
        licenseRequired: 'C',
        hasTowHitch: true,
        image: 'images/vehicles/pl_pop.png'
      };
    } else if (cardId === 'type_trm_pop') {
      options = {
        id: 'trm_pop',
        name: 'Renault TRM 2000 4x4 - Soutien aux Populations',
        model: 'Renault TRM 2000 4x4',
        cost: 48000,
        capacity: 3,
        licenseRequired: 'C',
        hasTowHitch: true,
        image: 'images/vehicles/trm_pop.png'
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

    const isVPSP = vehicleType === 'VPSP' || (cardId && cardId.includes('vpsp'));
    const targetOpt = options || Object.assign({}, catalogItem);
    const hasNativeTowHitch = Boolean(targetOpt.hasTowHitch);
    let finalTowHitch = hasNativeTowHitch;

    if (!hasNativeTowHitch && selOpts.towHitch) {
      optionsExtraCost += this.VEHICLE_OPTIONS.towHitch.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.towHitch.label);
      finalTowHitch = true;
    }
    if (!isVPSP && selOpts.ledBar) {
      optionsExtraCost += this.VEHICLE_OPTIONS.ledBar.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.ledBar.label);
    }
    if (selOpts.climatisation) {
      optionsExtraCost += this.VEHICLE_OPTIONS.climatisation.cost;
      activeOptionsList.push(this.VEHICLE_OPTIONS.climatisation.label);
    }

    targetOpt.cost = (targetOpt.cost || 20000) + optionsExtraCost;
    targetOpt.hasTowHitch = finalTowHitch;
    targetOpt.hasLedBar = isVPSP || Boolean(selOpts.ledBar) || Boolean(targetOpt.hasLedBar);
    targetOpt.hasConverter230v = true;
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
