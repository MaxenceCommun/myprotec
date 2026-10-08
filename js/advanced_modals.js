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
      { key: 'formation', title: 'Salle Pédagogique & Formations PSC1', icon: '🎓' },
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

  renderVehicleShop(game, stationId) {
    const st = game.stations.find(s => s.id === stationId) || game.stations[0];
    const garageLevel = st?.rooms?.garage || 1;
    const maxSlots = garageLevel === 1 ? 2 : (garageLevel === 2 ? 4 : 8);
    const usedSlots = st?.vehicles?.length || 0;

    const activeFilter = this.vehicleFilter || 'all';
    const activeSort = this.vehicleSort || 'price_asc';

    let list = [...(window.ProtecAdvanced.vehicleCatalog || [])];

    // 1. Filtrage par type de mission / véhicule
    if (activeFilter !== 'all') {
      list = list.filter(v => v.missionFilter && v.missionFilter.includes(activeFilter));
    }

    // 2. Tri par prix ou critère
    if (activeSort === 'price_asc') {
      list.sort((a, b) => a.cost - b.cost);
    } else if (activeSort === 'price_desc') {
      list.sort((a, b) => b.cost - a.cost);
    } else if (activeSort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    const filterOptions = [
      { id: 'all', label: 'Tout le Catalogue', icon: '🏪' },
      { id: 'secours', label: 'Secours & Sanitaire (VPSP, MPS)', icon: '🚑' },
      { id: 'liaison', label: 'Reconnaissance & Commandement (VL, PCM)', icon: '🚗' },
      { id: 'logistique', label: 'Logistique & Transport (VTU, VTP)', icon: '🚐' },
      { id: 'social', label: 'Social & Accueil (VAHU)', icon: '☕' },
      { id: 'usar', label: 'Spécialités USAR & Cyno', icon: '⛏️' },
      { id: 'nautique', label: 'Nautique (ERS Bateau)', icon: '🚤' },
      { id: 'tout_terrain', label: 'Tout-Terrain & Remorques', icon: '🚜' }
    ];

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

        <!-- Barre de Filtres par Type de Mission & Tri par Prix -->
        <div class="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <!-- Filtres par type de mission / véhicule -->
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

          <!-- Sélecteur de Tri par Prix -->
          <div class="flex items-center gap-2 self-end md:self-auto shrink-0">
            <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">Trier par :</span>
            <select onchange="window.ProtecAdvancedModals.setVehicleSort(this.value, '${st?.id}')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-300 font-bold text-xs text-slate-800 cursor-pointer focus:ring-2 focus:ring-pc-blue">
              <option value="price_asc" ${activeSort === 'price_asc' ? 'selected' : ''}>Prix croissant (Moins cher ➜ Plus cher)</option>
              <option value="price_desc" ${activeSort === 'price_desc' ? 'selected' : ''}>Prix décroissant (Plus cher ➜ Moins cher)</option>
              <option value="name_asc" ${activeSort === 'name_asc' ? 'selected' : ''}>Nom alphabétique (A ➜ Z)</option>
            </select>
          </div>
        </div>

        <!-- Grille des Véhicules filtrés et triés -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${list.length === 0 ? `
            <div class="col-span-full p-8 text-center glass-card rounded-2xl text-slate-500">
              <p class="font-bold text-sm">Aucun véhicule trouvé pour cette sélection.</p>
            </div>
          ` : list.map(veh => `
            <div class="p-4 rounded-2xl glass-card space-y-3 flex flex-col justify-between hover:shadow-lg transition">
              <div class="space-y-2">
                <!-- Image officielle du véhicule -->
                <div class="h-24 w-full flex items-center justify-center p-2 bg-gradient-to-b from-slate-50 to-slate-100/60 rounded-2xl border border-slate-100 overflow-hidden shadow-inner group">
                  <img src="${veh.image || `images/vehicles/${veh.type}.png`}" alt="${veh.name}" class="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform" onerror="this.outerHTML='<span class=\\'text-3xl\\'>${veh.icon}</span>'" />
                </div>

                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-pc-blue/10 text-pc-blue">${veh.category}</span>
                  <span class="font-mono font-black text-sm text-slate-900">${veh.cost.toLocaleString('fr-FR')} €</span>
                </div>

                <div>
                  <h5 class="text-xs font-black text-slate-900 leading-tight">${veh.name}</h5>
                  <p class="text-[10px] text-slate-500 font-semibold mt-0.5">${veh.specialty}</p>
                </div>

                <p class="text-[11px] text-slate-600 leading-relaxed">${veh.desc}</p>

                <div class="p-2.5 rounded-xl glass-card-blue text-[10px] text-pc-blue font-bold flex flex-col gap-1.5">
                  <div class="flex justify-between items-center">
                    <span>Capacité : <strong class="text-slate-900">${veh.capacity} place${veh.capacity > 1 ? 's' : ''}</strong>${veh.extraCapacityLabel ? ` <span class="text-indigo-800 font-semibold">${veh.extraCapacityLabel}</span>` : ''}</span>
                    <span class="text-slate-600">Vitesse : ${veh.speedKmH} km/h</span>
                  </div>

                  <!-- Présence d'attelage discrète -->
                  ${veh.hasTowHitch ? `
                    <div class="text-[10.5px] text-emerald-700 font-bold flex items-center gap-1">
                      <span>✓ Attelage</span>
                    </div>
                  ` : ''}

                  <!-- Remorque fournie à l'achat pour bateau ou quad -->
                  ${veh.requiresTrailer ? `
                    <div class="text-[10px] bg-amber-50 rounded-lg p-2 border border-amber-200/80 space-y-0.5">
                      <div class="text-emerald-700 font-bold flex items-center gap-1">
                        <span>📦 Remorque fournie à l’achat</span>
                      </div>
                      <div class="text-amber-800 font-semibold text-[9.5px]">
                        ⚠️ Se déplace tracté par un véhicule avec attelage (VL, VTU...)
                      </div>
                    </div>
                  ` : ''}

                  ${veh.reqSkills && veh.reqSkills.length > 0 ? `
                    <div class="text-[9px] text-blue-900 bg-blue-100/80 rounded-md px-1.5 py-0.5 font-semibold border border-blue-200 flex items-center gap-1">
                      <span>📋 Qualifications requises : SSA & Conduite Bateau</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <button onclick="window.ProtecAdvanced.buySpecializedVehicle(window.game, '${st?.id}', '${veh.type}')" class="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>Commander (${veh.cost.toLocaleString('fr-FR')} €)</span>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
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
