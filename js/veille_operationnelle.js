/**
 * PROTEC LIVE - MODULE OFFICIEL DE VEILLE OPÉRATIONNELLE & ASTREINTES
 * 
 * Gestion des 3 échelles de veille opérationnelle :
 * 1. "Protection Civile" (National)
 * 2. "Zone de Défense et de sécurité [X]" (Zone de Défense)
 * 3. "Département" (Départemental)
 * 
 * Système d'inscription libre équitable garantissant un tour de rôle équilibré.
 */

window.ProtecVeille = {
  // Définition des 3 échelons opérationnels
  ECHELONS: [
    {
      id: 'departemental',
      title: 'Département',
      scopeName: 'Départemental',
      icon: 'map-pin',
      theme: 'emerald',
      bgGradient: 'from-emerald-700 to-teal-900',
      shiftHours: 6,
      indemniteHourly: 120,
      reputationPoints: 15,
      getLabel: (dept) => `Département ${dept.code} - ${dept.name}`,
      getSubLabel: (dept) => `Préfecture : ${dept.chefLieu || dept.name}`,
      description: 'Supervision des dispositifs locaux, coordination des moyens et alertes du département.'
    },
    {
      id: 'zonal',
      title: 'Zone de Défense',
      scopeName: 'Zone de Défense et de Sécurité',
      icon: 'shield',
      theme: 'sky',
      bgGradient: 'from-sky-700 to-indigo-950',
      shiftHours: 8,
      indemniteHourly: 250,
      reputationPoints: 35,
      getLabel: (dept) => dept.zoneDefense.name,
      getSubLabel: (dept) => `Siège zonal : ${dept.zoneDefense.siege || 'EMIZ'} (${dept.zoneDefense.regions.join(', ')})`,
      description: 'Coordination zonale EMIZ, validation des colonnes de renforts inter-départementales.'
    },
    {
      id: 'national',
      title: 'Protection Civile',
      scopeName: 'National (Fédération)',
      icon: 'flag',
      theme: 'indigo',
      bgGradient: 'from-indigo-800 to-slate-950',
      shiftHours: 12,
      indemniteHourly: 500,
      reputationPoints: 75,
      getLabel: () => 'Protection Civile (National)',
      getSubLabel: () => 'Centre Opérationnel National (COPC) • Fédération Nationale',
      description: 'Veille opérationnelle nationale, supervision des crises majeures NOVI et renforts zonaux.'
    }
  ],

  // Initialisation du module
  init(game) {
    if (!game.veilleOperationnelle) {
      game.veilleOperationnelle = this.getDefaultState(game);
    }
    this.ensureStateIntegrity(game);
  },

  // État par défaut
  getDefaultState(game) {
    return {
      departemental: {
        currentOfficer: null, // { playerId, playerName, stationName, startedAt, endsAt }
        queue: [], // [{ playerId, playerName, stationName, requestedAt, shiftsDone }]
        history: {}, // playerId -> count of shifts done
        lastShiftOfficerId: null, // pour la règle de carence anti-monopole
        journal: []
      },
      zonal: {
        currentOfficer: null,
        queue: [],
        history: {},
        lastShiftOfficerId: null,
        journal: []
      },
      national: {
        currentOfficer: null,
        queue: [],
        history: {},
        lastShiftOfficerId: null,
        journal: []
      }
    };
  },

  ensureStateIntegrity(game) {
    if (!game.veilleOperationnelle) game.veilleOperationnelle = {};
    ['departemental', 'zonal', 'national'].forEach(echId => {
      if (!game.veilleOperationnelle[echId]) {
        game.veilleOperationnelle[echId] = {
          currentOfficer: null,
          queue: [],
          history: {},
          lastShiftOfficerId: null,
          journal: []
        };
      }
    });
  },

  // Récupère les métadonnées de localisation de l'antenne du joueur
  getDeptContext(game) {
    const deptCode = game.currentDepartmentCode || game.stations?.[0]?.departmentCode || '54';
    const deptObj = (window.ProtecDepartements && window.ProtecDepartements.getByCode(deptCode)) || {
      code: deptCode,
      name: 'Meurthe-et-Moselle',
      chefLieu: 'Nancy',
      region: 'Grand Est'
    };
    const zoneDef = (window.ProtecDepartements && window.ProtecDepartements.getZoneDefense)
      ? window.ProtecDepartements.getZoneDefense(deptCode)
      : {
          id: 'est',
          code: 'EST',
          name: 'Zone de Défense et de Sécurité Est',
          siege: 'Metz / Strasbourg',
          regions: ['Grand Est']
        };

    return {
      ...deptObj,
      zoneDefense: zoneDef
    };
  },

  // Vérifie l'éligibilité du joueur pour un échelon (Règle du tour de rôle équitable)
  checkEligibility(game, echelonId) {
    this.ensureStateIntegrity(game);
    const state = game.veilleOperationnelle[echelonId];
    const myId = game.player?.id;

    // Déjà en cours de veille ?
    if (state.currentOfficer && state.currentOfficer.playerId === myId) {
      return { eligible: false, reason: 'Vous êtes déjà actuellement en veille opérationnelle sur cet échelon.' };
    }

    // Déjà dans la file d'attente ?
    if (state.queue.some(q => q.playerId === myId)) {
      return { eligible: false, inQueue: true, reason: 'Vous êtes déjà inscrit dans la file d’attente pour le prochain tour.' };
    }

    // Règle de carence (Repos de veille obligatoire) :
    // Si le joueur vient tout juste de terminer le dernier créneau, il doit laisser son tour pour le créneau suivant
    if (state.lastShiftOfficerId === myId && (state.queue.length > 0 || state.currentOfficer)) {
      return {
        eligible: false,
        resting: true,
        reason: 'Période de relève / repos opérationnel : vous devez laisser un tour à un autre directeur pour assurer l’équité.'
      };
    }

    return { eligible: true };
  },

  // Prendre la garde immédiatement (si le poste est vacant)
  takeShiftNow(game, echelonId) {
    this.ensureStateIntegrity(game);
    const state = game.veilleOperationnelle[echelonId];
    const ech = this.ECHELONS.find(e => e.id === echelonId);
    if (!ech) return;

    const el = this.checkEligibility(game, echelonId);
    if (!el.eligible && !el.resting) {
      game.showToast('Action impossible', el.reason, 'orange');
      return;
    }

    const myId = game.player?.id || 'directeur-local';
    const myName = game.player?.name || 'Directeur d’Antenne';
    const myStation = game.stations?.[0]?.name || 'Antenne Locale';

    const now = Date.now();
    const durationMs = ech.shiftHours * 3600 * 1000;

    state.currentOfficer = {
      playerId: myId,
      playerName: myName,
      stationName: myStation,
      startedAt: now,
      endsAt: now + durationMs,
      shiftHours: ech.shiftHours
    };

    // Retirer de la file s'il y était
    state.queue = state.queue.filter(q => q.playerId !== myId);

    // Enregistrer dans le journal
    const deptCtx = this.getDeptContext(game);
    const scopeLabel = ech.getLabel(deptCtx);
    state.journal.unshift({
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      text: `Prise de garde opérationnelle par ${myName} (${myStation}) pour ${ech.shiftHours}h.`
    });

    // Mettre à jour l'historique
    state.history[myId] = (state.history[myId] || 0) + 1;

    game.showToast('Veille Opérationnelle Active', `Vous avez pris la veille opérationnelle pour « ${scopeLabel} » pour une durée de ${ech.shiftHours}h.`, 'green');
    game.saveGame();
    this.renderModal(game);
  },

  // S'inscrire dans la file d'attente pour le prochain tour
  joinQueue(game, echelonId) {
    this.ensureStateIntegrity(game);
    const state = game.veilleOperationnelle[echelonId];
    const ech = this.ECHELONS.find(e => e.id === echelonId);
    if (!ech) return;

    const myId = game.player?.id || 'directeur-local';
    const myName = game.player?.name || 'Directeur d’Antenne';
    const myStation = game.stations?.[0]?.name || 'Antenne Locale';

    if (state.queue.some(q => q.playerId === myId)) {
      game.showToast('Déjà inscrit', 'Vous êtes déjà inscrit dans la liste d’attente pour ce créneau.', 'blue');
      return;
    }

    const shiftsDone = state.history[myId] || 0;

    state.queue.push({
      playerId: myId,
      playerName: myName,
      stationName: myStation,
      requestedAt: Date.now(),
      shiftsDone: shiftsDone
    });

    // Tri équitable : Priorité à ceux qui ont fait LE MOINS de veilles opérationnelles !
    state.queue.sort((a, b) => a.shiftsDone - b.shiftsDone || a.requestedAt - b.requestedAt);

    const pos = state.queue.findIndex(q => q.playerId === myId) + 1;
    const deptCtx = this.getDeptContext(game);
    game.showToast('Inscription Enregistrée', `Vous êtes inscrit en position #${pos} pour le prochain tour de veille « ${ech.getLabel(deptCtx)} ».`, 'green');
    game.saveGame();
    this.renderModal(game);
  },

  // Quitter la file d'attente
  leaveQueue(game, echelonId) {
    this.ensureStateIntegrity(game);
    const state = game.veilleOperationnelle[echelonId];
    const myId = game.player?.id;
    state.queue = state.queue.filter(q => q.playerId !== myId);
    game.showToast('Désinscription', 'Vous avez quitté la file d’attente de cet échelon.', 'blue');
    game.saveGame();
    this.renderModal(game);
  },

  // Transmettre la relève / Fin de garde
  passRelief(game, echelonId) {
    this.ensureStateIntegrity(game);
    const state = game.veilleOperationnelle[echelonId];
    const ech = this.ECHELONS.find(e => e.id === echelonId);
    if (!ech) return;

    const myId = game.player?.id;
    if (!state.currentOfficer || state.currentOfficer.playerId !== myId) return;

    const officerName = state.currentOfficer.playerName;
    state.lastShiftOfficerId = myId;

    // Calcul de l'indemnité perçue
    const totalGains = ech.shiftHours * ech.indemniteHourly;
    if (game.resources) {
      game.resources.money = (game.resources.money || 0) + totalGains;
      game.resources.reputationScore = (game.resources.reputationScore || 0) + ech.reputationPoints;
    }

    // Y a-t-il quelqu'un dans la file d'attente pour prendre la relève ?
    if (state.queue.length > 0) {
      const nextOfficer = state.queue.shift();
      const now = Date.now();
      state.currentOfficer = {
        playerId: nextOfficer.playerId,
        playerName: nextOfficer.playerName,
        stationName: nextOfficer.stationName,
        startedAt: now,
        endsAt: now + (ech.shiftHours * 3600 * 1000),
        shiftHours: ech.shiftHours
      };
      state.history[nextOfficer.playerId] = (state.history[nextOfficer.playerId] || 0) + 1;
      state.journal.unshift({
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        text: `Relève assurée : ${officerName} transmet la consigne à ${nextOfficer.playerName} (${nextOfficer.stationName}).`
      });
    } else {
      state.currentOfficer = null;
      state.journal.unshift({
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        text: `Fin de garde de ${officerName}. Poste en veille libre.`
      });
    }

    game.showToast('Garde Terminée', `Fin de veille opérationnelle. Indemnités perçues : +${totalGains.toLocaleString('fr-FR')} € et +${ech.reputationPoints} pts de réputation.`, 'green');
    game.saveGame();
    this.renderModal(game);
  },

  // Rendu de la modale complète de Veille Opérationnelle
  renderModal(game) {
    this.init(game);
    let modal = document.getElementById('veille-operationnelle-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'veille-operationnelle-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto';
      document.body.appendChild(modal);
    }

    const deptCtx = this.getDeptContext(game);
    const myId = game.player?.id;

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-4xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 bg-white border border-slate-200 text-slate-800 my-auto max-h-[92vh] overflow-y-auto">
        
        <!-- En-tête -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pc-blue to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20">
              <i data-lucide="shield-alert" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-black text-slate-900 leading-tight">Veille Opérationnelle & Astreintes des Cadres</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">Tour de Rôle Équitable</span>
              </div>
              <p class="text-xs text-slate-500 font-semibold">
                Permanent d'astreinte opérationnelle aux 3 échelons : Département, Zone de Défense et National
              </p>
            </div>
          </div>
          <button onclick="document.getElementById('veille-operationnelle-modal').classList.add('hidden')" class="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer transition">
            ✕
          </button>
        </div>

        <!-- Bannière explicative du tour de rôle équitable -->
        <div class="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div class="flex items-start gap-2.5">
            <span class="text-lg">⚖️</span>
            <div>
              <strong class="block font-black text-indigo-900">Règle Fédérale d'Équité & Relève Opérationnelle</strong>
              <span class="text-[11px] text-indigo-800">Tout directeur est libre de s'inscrire. Pour garantir que chaque joueur ait son tour, une période de repos obligatoire sépare chaque créneau et la priorité est donnée aux directeurs ayant effectué le moins d'astreintes.</span>
            </div>
          </div>
          <div class="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-[11px] font-bold text-indigo-900 whitespace-nowrap shadow-xs">
            Antenne d'attache : <strong>${deptCtx.name} (${deptCtx.code})</strong>
          </div>
        </div>

        <!-- Les 3 Cartes d'Échelons -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${this.ECHELONS.map(ech => this.renderEchelonCardHTML(game, ech, deptCtx, myId)).join('')}
        </div>

        <!-- Journal de bord & Consignes récentes -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <i data-lucide="clipboard-list" class="w-4 h-4 text-indigo-600"></i>
              Main Courante de Veille & Relèves Opérationnelles
            </h5>
            <span class="text-[10px] text-slate-400 font-bold">Historique en temps réel</span>
          </div>
          <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
            ${this.renderCombinedJournalHTML(game)}
          </div>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  },

  // Rendu de la carte d'un échelon
  renderEchelonCardHTML(game, ech, deptCtx, myId) {
    const state = game.veilleOperationnelle[ech.id] || {};
    const label = ech.getLabel(deptCtx);
    const subLabel = ech.getSubLabel(deptCtx);
    const officer = state.currentOfficer;
    const queue = state.queue || [];
    const myShiftsCount = (state.history && state.history[myId]) || 0;
    const isMe = officer && officer.playerId === myId;
    const inQueue = queue.some(q => q.playerId === myId);
    const queuePos = queue.findIndex(q => q.playerId === myId) + 1;
    const eligibility = this.checkEligibility(game, ech.id);

    return `
      <div class="rounded-2xl border-2 ${isMe ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200' : 'border-slate-200'} bg-white overflow-hidden flex flex-col justify-between transition-all">
        
        <!-- En-tête de l'échelon -->
        <div class="p-3.5 bg-gradient-to-r ${ech.bgGradient} text-white space-y-1">
          <div class="flex items-center justify-between text-[10px]">
            <span class="px-2 py-0.5 rounded-full font-black bg-white/20 backdrop-blur-md uppercase tracking-wider text-[9px]">
              ${ech.scopeName}
            </span>
            <span class="font-bold text-white/90">
              Shift : ${ech.shiftHours}h
            </span>
          </div>
          <h4 class="text-sm font-black text-white leading-tight truncate" title="${label}">${label}</h4>
          <p class="text-[10px] text-white/75 truncate" title="${subLabel}">${subLabel}</p>
        </div>

        <!-- Corps de l'échelon -->
        <div class="p-3.5 space-y-3 flex-1 text-xs">
          
          <!-- État actuel du poste -->
          <div class="p-2.5 rounded-xl ${officer ? (isMe ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 border border-slate-200') : 'bg-amber-50/80 border border-amber-200'} space-y-1">
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-bold text-slate-500">Cadre en poste :</span>
              <span class="px-2 py-0.5 rounded-full font-black ${officer ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}">
                ${officer ? '🟢 En Veille Active' : '🟡 Poste Vacant'}
              </span>
            </div>
            ${officer ? `
              <div class="flex items-center gap-2 pt-1">
                <div class="w-7 h-7 rounded-lg ${isMe ? 'bg-indigo-600' : 'bg-slate-700'} text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                  ${officer.playerName.substring(0, 2).toUpperCase()}
                </div>
                <div class="truncate">
                  <strong class="block text-slate-900 truncate leading-tight">${officer.playerName} ${isMe ? '<span class="text-indigo-600 font-black">(VOUS)</span>' : ''}</strong>
                  <span class="text-[10px] text-slate-500 block truncate">${officer.stationName}</span>
                </div>
              </div>
            ` : `
              <p class="text-[11px] text-amber-900 font-semibold pt-0.5">
                Aucun cadre actuellement en veille. Vous pouvez prendre le tour immédiatement !
              </p>
            `}
          </div>

          <!-- Rémunération & Avantages -->
          <div class="grid grid-cols-2 gap-1.5 text-[11px] p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span class="block text-[9px] text-slate-400 font-bold uppercase">Indemnité</span>
              <strong class="text-emerald-700 font-black">${ech.indemniteHourly} € / h</strong>
            </div>
            <div>
              <span class="block text-[9px] text-slate-400 font-bold uppercase">Prestige Antenne</span>
              <strong class="text-indigo-700 font-black">+${ech.reputationPoints} pts</strong>
            </div>
          </div>

          <!-- File d'attente / Relève -->
          <div class="space-y-1 text-[11px]">
            <div class="flex items-center justify-between text-slate-600 font-bold">
              <span>File de Relève :</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-black text-slate-700">${queue.length} inscrit(s)</span>
            </div>
            ${queue.length > 0 ? `
              <div class="space-y-1 max-h-16 overflow-y-auto text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                ${queue.map((q, idx) => `
                  <div class="flex items-center justify-between text-slate-700 truncate">
                    <span class="truncate"><strong>#${idx + 1}</strong> ${q.playerName} ${q.playerId === myId ? '<span class="text-indigo-600 font-bold">(Vous)</span>' : ''}</span>
                    <span class="text-[9px] text-slate-400 font-mono">${q.shiftsDone} garde(s)</span>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-[10px] text-slate-400 italic">Personne en attente pour le prochain tour.</p>
            `}
          </div>

          <!-- Mes statistiques sur cet échelon -->
          <div class="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
            <span>Vos astreintes effectuées :</span>
            <strong class="text-slate-800 font-black">${myShiftsCount} fois</strong>
          </div>

        </div>

        <!-- Boutons d'action contextuels -->
        <div class="p-3 border-t border-slate-100 bg-slate-50/60 flex flex-col gap-1.5">
          ${isMe ? `
            <button onclick="window.ProtecVeille.passRelief(window.game, '${ech.id}')" class="w-full py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
              Transmettre la Relève & Clôturer
            </button>
          ` : officer ? (
            inQueue ? `
              <button onclick="window.ProtecVeille.leaveQueue(window.game, '${ech.id}')" class="w-full py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition flex items-center justify-center gap-1 cursor-pointer">
                ✕ Quitter la file (Position #${queuePos})
              </button>
            ` : `
              <button onclick="window.ProtecVeille.joinQueue(window.game, '${ech.id}')" class="w-full py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                S'inscrire pour la Relève Suivante
              </button>
            `
          ) : (
            eligibility.eligible ? `
              <button onclick="window.ProtecVeille.takeShiftNow(window.game, '${ech.id}')" class="w-full py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse">
                <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
                Prendre la Veille Immédiatement
              </button>
            ` : `
              <button disabled class="w-full py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed text-center" title="${eligibility.reason}">
                Période de Relève (En repos)
              </button>
            `
          )}
        </div>

      </div>
    `;
  },

  // Rendu de la main courante combinée
  renderCombinedJournalHTML(game) {
    const combined = [];
    ['departemental', 'zonal', 'national'].forEach(id => {
      const ech = this.ECHELONS.find(e => e.id === id);
      const journal = game.veilleOperationnelle?.[id]?.journal || [];
      journal.forEach(j => {
        combined.push({
          echelon: ech.title,
          color: ech.theme,
          time: j.time,
          text: j.text
        });
      });
    });

    if (combined.length === 0) {
      return `<p class="text-slate-400 text-center py-2 italic text-[11px]">Aucun mouvement de garde consigné pour le moment. Prenez votre première astreinte !</p>`;
    }

    return combined.slice(0, 10).map(c => `
      <div class="flex items-center gap-2 text-[11px] text-slate-700 py-0.5 border-b border-slate-100 last:border-0">
        <span class="font-mono text-slate-400 text-[10px]">${c.time}</span>
        <span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-${c.color}-100 text-${c.color}-800">[${c.echelon}]</span>
        <span class="truncate">${c.text}</span>
      </div>
    `).join('');
  }
};
