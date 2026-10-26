/**
 * Moyens des crises (réquisitions de l'autorité d'engagement)
 * 1. L'autorité demande des moyens PAR MISSION (véhicules, matériel, personnels, compétences)
 * 2. Le joueur recueille les disponibilités par SMS (module ProtecSmsMobilization)
 * 3. Il engage ses véhicules (présents dans ses antennes)
 * 4. Il charge le matériel de son stock dans les véhicules engagés
 * 5. Il affecte les bénévoles disponibles aux véhicules, et chaque véhicule à une mission
 */
window.ProtecCriseMoyens = {
  // Véhicules acceptés en remplacement d'un type demandé
  SUBSTITUTES: {
    VL: ['VL', 'VLHR', 'PCM', 'VCYN'],
    VLHR: ['VLHR'],
    VTU: ['VTU', 'VAHU', 'VST', 'FLIT', 'VTD'],
    VTP: ['VTP'],
    VPSP: ['VPSP'],
    PCM: ['PCM'],
    ERS: ['ERS'],
    VCYN: ['VCYN', 'VLHR', 'VL']
  },

  VEH_LABELS: {
    VPSP: 'VPSP (secours & évacuation)', VL: 'VL (liaison)', VLHR: 'VLHR 4x4 (hors-route)', VTU: 'VTU (logistique)',
    VTP: 'VTP (transport de personnels)', PCM: 'PC mobile', ERS: 'Embarcation (ERS)', VCYN: 'Véhicule cynotechnique'
  },

  // Règles « mission demandée → moyens », de la plus spécifique à la plus générale
  RULES: [
    { test: /drone/, icon: '🛸', build: (s) => ({ vehicles: { VL: 1 }, lots: { [/therm|nuit|recherche|disparu/.test(s) ? 'lot_drone_thermique' : 'lot_drone_reco']: 1 }, personnel: 2, skills: [{ key: 'telepilote', count: 1 }] }) },
    { test: /cyno/, icon: '🐕', build: () => ({ vehicles: { VCYN: 1 }, lots: {}, personnel: 2, skills: [{ key: 'cyno', count: 1 }] }) },
    { test: /nautique|embarcation|aquatique|bateau/, icon: '🚤', build: () => ({ vehicles: { ERS: 1, VLHR: 1 }, lots: {}, personnel: 3, skills: [{ key: 'permis_bateau', count: 1 }, { key: 'aquatique', count: 1 }] }) },
    { test: /reconnaissance hr|hors.route|tout.terrain|4x4|escarp|reconnaissance terrestre/, icon: '⛰️', build: () => ({ vehicles: { VLHR: 1 }, lots: {}, personnel: 2, skills: [{ key: 'conduite_4x4', count: 1 }] }) },
    { test: /battue|ratissage|recherche p[ée]destre|recherche de personne|reconnaissance p[ée]destre/, icon: '🔦', build: (s) => ({ vehicles: { VTP: 1 }, lots: Object.assign({ lot_secours_b: 1 }, /nuit|nocturne/.test(s) ? { lot_eclairage: 1 } : {}), personnel: 8, skills: [{ key: 'ce', count: 1 }] }) },
    { test: /noria|[ée]vacuation|acheminement|navette|transport/, icon: '🚐', build: (s, m) => /sanitaire|urgence|victime|bless|h[ôo]pita|ap-hp/.test(s)
      ? { vehicles: { VPSP: Math.max(1, (m.requiredAssets && m.requiredAssets.vpsp) || 1) }, lots: { lot_secours_b: Math.max(1, (m.requiredAssets && m.requiredAssets.vpsp) || 1) }, personnel: 3 * Math.max(1, (m.requiredAssets && m.requiredAssets.vpsp) || 1), skills: [{ key: 'cond_vpsp', count: Math.max(1, (m.requiredAssets && m.requiredAssets.vpsp) || 1) }] }
      : { vehicles: { VTP: Math.max(1, (m.requiredAssets && m.requiredAssets.vtp) || 1) }, lots: {}, personnel: 2 * Math.max(1, (m.requiredAssets && m.requiredAssets.vtp) || 1), skills: [] } },
    { test: /sanitaire|bilan|\bpma\b|soins|relevage|prise en charge|secours/, icon: '🚑', build: (s, m) => {
      const n = Math.max(1, (m.requiredAssets && m.requiredAssets.vpsp) || 1);
      const lots = { lot_secours_b: n };
      if (/pma|poste m[ée]dical/.test(s) || (m.requiredAssets && m.requiredAssets.pma)) { lots.lot_secours_a = 1; lots.lot_secours_c = 1; }
      return { vehicles: { VPSP: n }, lots, personnel: 3 * n, skills: [{ key: 'ce', count: n }, { key: 'cond_vpsp', count: n }] };
    } },
    { test: /\bcai\b|impliqu|cump|soutien psy|[ée]coute|m[ée]dico.psy/, icon: '🤝', build: () => ({ vehicles: { VTU: 1 }, lots: { lot_soutien_psy: 1 }, personnel: 4, skills: [{ key: 'ce', count: 1 }, { key: 'soutien_psy', count: 1 }] }) },
    { test: /accueil|orientation|r[ée]confort|information/, icon: '🧭', build: () => ({ vehicles: { VL: 1 }, lots: {}, personnel: 4, skills: [{ key: 'ce', count: 1 }] }) },
    { test: /\bchu\b|h[ée]bergement|lits/, icon: '🛌', build: (s, m) => ({ vehicles: { VTU: 1 }, lots: { lot_hebergement: Math.max(1, Math.ceil(((m.requiredAssets && m.requiredAssets.chu_places) || 30) / 30)) }, personnel: 6, skills: [{ key: 'ce', count: 1 }, { key: 'log', count: 1 }] }) },
    { test: /groupe.? [ée]lectrog|[ée]nergie|black.out|[ée]lectri/, icon: '⚡', build: () => ({ vehicles: { VTU: 1 }, lots: { remorque_groupe_electro: 1, lot_eclairage: 1 }, personnel: 2, skills: [{ key: 'log', count: 1 }] }) },
    { test: /pompage|[ée]puisement|motopompe/, icon: '💧', build: (s) => ({ vehicles: { VTU: 1 }, lots: Object.assign({ lot_pompage: 1 }, /lourd|gros|motopompe/.test(s) ? { remorque_motopompe: 1 } : {}), personnel: 3, skills: [{ key: 'log', count: 1 }] }) },
    { test: /tron[çc]onn|d[ée]gagement|arbre/, icon: '🪚', build: () => ({ vehicles: { VTU: 1 }, lots: { lot_tronconnage: 1 }, personnel: 3, skills: [{ key: 'tronconnage', count: 1 }] }) },
    { test: /b[âa]chage|toiture|mise hors d.eau/, icon: '🛡️', build: () => ({ vehicles: { VTU: 1 }, lots: { lot_bachage: 1 }, personnel: 3, skills: [{ key: 'log', count: 1 }] }) },
    { test: /ravitaill|vivres|collation|distribution|couverture|boisson/, icon: '☕', build: () => ({ vehicles: { VTU: 1 }, lots: { lot_ravitaillement: 1 }, personnel: 3, skills: [{ key: 'log', count: 1 }] }) },
    { test: /commandement|coordination|\bpc\b|poste de commandement/, icon: '📡', build: () => ({ vehicles: { PCM: 1 }, lots: { lot_poste_commandement_mobile: 1 }, personnel: 2, skills: [{ key: 'cp', count: 1 }, { key: 'transmissions', count: 1 }] }) },
    { test: /[ée]clairage|nuit/, icon: '💡', build: () => ({ vehicles: { VTU: 1 }, lots: { lot_eclairage: 1 }, personnel: 2, skills: [{ key: 'log', count: 1 }] }) },
    { test: /logisti/, icon: '📦', build: () => ({ vehicles: { VTU: 1 }, lots: { lot_eclairage: 1 }, personnel: 2, skills: [{ key: 'log', count: 1 }] }) }
  ],

  // ---------------------------------------------------------------------------
  // Données
  // ---------------------------------------------------------------------------
  appliesTo(mission) {
    return Boolean(mission && (mission.type === 'crise' || mission.isCrisis) && Array.isArray(mission.assignedMissions) && mission.assignedMissions.length > 0);
  },

  ensureRequests(game, mission) {
    if (!this.appliesTo(mission)) return [];
    if (Array.isArray(mission.authorityRequests) && mission.authorityRequests.length) return mission.authorityRequests;
    const reqs = mission.assignedMissions.map((title, i) => {
      const s = String(title || '').toLowerCase();
      const rule = this.RULES.find(r => r.test.test(s));
      const built = rule ? rule.build(s, mission) : { vehicles: { VL: 1 }, lots: {}, personnel: 3, skills: [{ key: 'ce', count: 1 }] };
      return { id: `req_${i + 1}`, title, icon: rule ? rule.icon : '📋', vehicles: built.vehicles || {}, lots: built.lots || {}, personnel: built.personnel || 2, skills: (built.skills || []).filter(x => x && x.count > 0) };
    });
    // Ajustement des effectifs au plafond demandé par l'autorité
    const target = Number(mission.requiredVolunteers) || 0;
    const sum = reqs.reduce((a, r) => a + r.personnel, 0);
    if (target > 0 && sum !== target && reqs.length) {
      if (sum < target) {
        const biggest = reqs.reduce((b, r) => (r.personnel > b.personnel ? r : b), reqs[0]);
        biggest.personnel += target - sum;
      } else {
        const ratio = target / sum;
        reqs.forEach(r => { r.personnel = Math.max(2, Math.round(r.personnel * ratio)); });
      }
    }
    mission.authorityRequests = reqs;
    return reqs;
  },

  getVehicleCatalogEntry(veh) {
    const cat = (window.ProtecAdvanced && Array.isArray(window.ProtecAdvanced.vehicleCatalog)) ? window.ProtecAdvanced.vehicleCatalog : [];
    return cat.find(c => c.type === veh.type) || {};
  },

  getSeats(veh) {
    return Number(veh.capacity || veh.seatsCount || this.getVehicleCatalogEntry(veh).capacity) || 4;
  },

  // Emplacements de chargement (les véhicules non logistiques emportent tout de même 1 sac / petit lot)
  getLoadSlots(veh) {
    const own = Number(veh.capacity_log);
    const cat = Number(this.getVehicleCatalogEntry(veh).capacity_log);
    const v = own > 0 ? own : (cat > 0 ? cat : 0);
    return v > 0 ? v : 1;
  },

  canTow(veh) {
    if (veh.hasTowHitch !== undefined) return Boolean(veh.hasTowHitch);
    const c = this.getVehicleCatalogEntry(veh);
    return Boolean(c.hasTowHitch) || ['VL', 'VLHR', 'VTU'].includes(String(veh.type || '').toUpperCase());
  },

  isTrailer(lotId) { return String(lotId).startsWith('remorque_'); },

  lotMeta(game, lotId) {
    const cat = (typeof game.getAvailableLotsCatalog === 'function') ? game.getAvailableLotsCatalog() : [];
    return cat.find(l => l.id === lotId) || { id: lotId, name: lotId, emoji: '📦', logSlots: 1 };
  },

  typeMatches(reqType, vehType) {
    const list = this.SUBSTITUTES[reqType] || [reqType];
    return list.includes(String(vehType || '').toUpperCase());
  },

  getEngagedVehicles(game, mission) {
    const ids = new Set((mission.assignedVehicleIds || []).map(v => (typeof v === 'object' && v ? v.id : v)));
    (mission.assignedCrew && mission.assignedCrew.vehicles || []).forEach(v => ids.add(typeof v === 'object' && v ? v.id : v));
    const own = [...ids].map(id => (game.vehicles || []).find(v => v.id === id)).filter(Boolean);
    return own.concat(this.getRenfortVehicles(mission));
  },

  isRenfortVeh(v) { return Boolean(v && (v.isRenfort || String(v.id || v).startsWith('rf_'))); },

  isVehicleDeployed(mission, vehId) {
    const tId = `team_veh_${vehId}`;
    return (mission.deployedTeams || []).includes(tId) || (mission.assignedCrew && (mission.assignedCrew.vehicles || []).some(v => (v.id || v) === vehId));
  },

  getLoads(mission) {
    if (!mission.crisisVehicleLoads || typeof mission.crisisVehicleLoads !== 'object') mission.crisisVehicleLoads = {};
    return mission.crisisVehicleLoads;
  },

  getTasks(mission) {
    if (!mission.crisisVehicleTasks || typeof mission.crisisVehicleTasks !== 'object') mission.crisisVehicleTasks = {};
    return mission.crisisVehicleTasks;
  },

  getCrew(game, mission, vehId) {
    if (String(vehId).startsWith('rf_')) {
      const map = mission.renfortCrew || {};
      return this.getRenfortVolunteers(mission).filter(v => map[v.id] === vehId);
    }
    const reg = new Set(mission.registeredVolunteers || []);
    const tId = `team_veh_${vehId}`;
    return (game.volunteers || []).filter(v => reg.has(v.id) && mission.volunteerTeams && (mission.volunteerTeams[v.id] === tId || mission.volunteerTeams[v.id] === vehId));
  },

  // Stock disponible d'un lot : stock des antennes − déjà chargé sur les autres crises non terminées
  getLotAvailable(game, mission, lotId) {
    const stock = this.getLotStock(game, lotId);
    let used = 0;
    const myId = game.player?.id || 'usr_local';
    (game.missions || []).concat(game.activeCrises || []).forEach(m => {
      if (!m || this.isEnded(m)) return;
      Object.entries(m.crisisVehicleLoads || {}).forEach(([vid, l]) => { if (!String(vid).startsWith('rf_')) used += Number(l && l[lotId]) || 0; });
      // Matériel proposé / engagé en renfort par mon antenne sur d'autres crises
      (m.proposedRenforts || []).forEach(p => {
        if (p.sourcePlayerId !== myId) return;
        if (p.status === 'proposed') used += Number(p.lots && p.lots[lotId]) || 0;
        else if (p.status === 'accepted' || p.status === 'on_site') used += Number(p.accepted && p.accepted.lots && p.accepted.lots[lotId]) || 0;
      });
    });
    return { stock, available: Math.max(0, stock - used) };
  },

  // Stock d'un lot : stocks des antennes (logistique) ou équipement de l'antenne (boutique)
  getLotStock(game, lotId) {
    const st = (game.stations || []).reduce((s, x) => s + (Number(x && x.stock && x.stock[lotId]) || 0), 0);
    const wp = Number(game.workplaceEquipment && game.workplaceEquipment[lotId]) || 0;
    return Math.max(st, wp);
  },

  isEnded(m) {
    return ['completed', 'canceled', 'cancelled', 'canceled_favorable', 'failed', 'echec', 'terminee', 'termine'].includes(m && m.status);
  },

  usedSlots(game, loads) {
    return Object.entries(loads || {}).reduce((a, [id, n]) => a + (this.isTrailer(id) ? 0 : (this.lotMeta(game, id).logSlots || 1) * (Number(n) || 0)), 0);
  },

  // Synchronise le matériel chargé avec la liste générique de la mission (compatibilité avec le reste du jeu)
  syncMissionLots(mission) {
    const total = {};
    Object.values(this.getLoads(mission)).forEach(l => Object.entries(l || {}).forEach(([id, n]) => { total[id] = (total[id] || 0) + (Number(n) || 0); }));
    mission.configuredLotCounts = total;
    mission.configuredLots = Object.entries(total).flatMap(([id, n]) => Array(n).fill(id));
  },

  // ---------------------------------------------------------------------------
  // Couverture des besoins
  // ---------------------------------------------------------------------------
  computeCoverage(game, mission) {
    const reqs = this.ensureRequests(game, mission);
    const tasks = this.getTasks(mission);
    const loads = this.getLoads(mission);
    const engaged = this.getEngagedVehicles(game, mission);
    const S = window.ProtecSmsMobilization;
    const per = reqs.map(r => {
      const vehs = engaged.filter(v => tasks[v.id] === r.id);
      const crew = vehs.flatMap(v => this.getCrew(game, mission, v.id));
      const vehStatus = Object.entries(r.vehicles).map(([t, n]) => ({ type: t, need: n, have: Math.min(n, vehs.filter(v => this.typeMatches(t, v.type)).length) }));
      const lotStatus = Object.entries(r.lots).map(([id, n]) => ({ id, need: n, have: Math.min(n, vehs.reduce((a, v) => a + (Number(loads[v.id] && loads[v.id][id]) || 0), 0)) }));
      const skillStatus = (r.skills || []).map(sk => ({ key: sk.key, need: sk.count, have: Math.min(sk.count, crew.filter(v => S && S.volunteerHasQuotaSkill(v, sk.key)).length) }));
      const parts = [
        ...vehStatus.map(x => x.have / x.need),
        ...lotStatus.map(x => x.have / x.need),
        Math.min(1, crew.length / Math.max(1, r.personnel)),
        ...skillStatus.map(x => x.have / x.need)
      ];
      const ratio = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 1;
      return { req: r, vehs, crew, vehStatus, lotStatus, skillStatus, ratio };
    });
    const weight = per.reduce((a, p) => a + Math.max(1, p.req.personnel), 0) || 1;
    const overall = per.reduce((a, p) => a + p.ratio * Math.max(1, p.req.personnel), 0) / weight;
    const unassignedVehs = engaged.filter(v => !tasks[v.id] || !reqs.some(r => r.id === tasks[v.id]));
    const neededPersonnel = reqs.reduce((a, r) => a + r.personnel, 0);
    const assignedCount = per.reduce((a, p) => a + p.crew.length, 0);
    mission.crisisCoverageBest = Math.max(Number(mission.crisisCoverageBest) || 0, overall);
    return { per, overall, unassignedVehs, neededPersonnel, assignedCount, surplusPersonnel: Math.max(0, assignedCount - neededPersonnel) };
  },

  // Indemnisation à la clôture : moyens manquants = mission dégradée et moins payée
  applyCoverageToReward(game, mission) {
    if (!this.appliesTo(mission) || mission.crisisRewardAdjusted) return;
    const best = Math.max(Number(mission.crisisCoverageBest) || 0, this.computeCoverage(game, mission).overall);
    const factor = 0.4 + 0.6 * Math.min(1, best);
    mission.crisisRewardBase = mission.rewardMoney || 0;
    mission.rewardMoney = Math.round((mission.rewardMoney || 0) * factor);
    mission.crisisRewardAdjusted = true;
    mission.crisisCoverageAtEnd = best;
  },

  // Quotas de compétences suggérés pour le SMS (somme des compétences demandées par l'autorité)
  getSuggestedQuotas(game, mission) {
    const reqs = this.ensureRequests(game, mission);
    const map = {};
    reqs.forEach(r => (r.skills || []).forEach(s => { map[s.key] = (map[s.key] || 0) + s.count; }));
    return Object.entries(map).map(([key, count]) => ({ key, count, mode: 'demande' }));
  },

  getSuggestedTarget(game, mission) {
    return this.ensureRequests(game, mission).reduce((a, r) => a + r.personnel, 0);
  },

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  _mission(missionId) {
    const game = window.game;
    return game ? (game.missions || []).find(m => m.id === missionId) : null;
  },

  _refresh(missionId) {
    const game = window.game;
    if (!game) return;
    game.saveGame();
    if (game.selectedMissionId === missionId) game.openMissionDetails(missionId);
  },

  _isManagerBlocked(game, mission) {
    const myId = game.player?.id || 'usr_local';
    if (mission.managerPlayerId && mission.managerPlayerId !== myId) {
      game.showToast('Commandement Exclusif', `Seul le responsable de crise (${mission.managerPlayerName}) peut modifier les moyens engagés.`, 'orange');
      return true;
    }
    return false;
  },

  setStep(missionId, step) {
    const game = window.game;
    if (!game) return;
    if (!game.crisisLogStep) game.crisisLogStep = {};
    game.crisisLogStep[missionId] = step;
    game.missionDetailActiveTab = 'logistique';
    if (game.selectedMissionId === missionId) game.openMissionDetails(missionId);
  },

  getVehicleBlocker(game, mission, veh) {
    const other = (game.missions || []).find(m => m.id !== mission.id && !['completed', 'canceled', 'cancelled', 'canceled_favorable'].includes(m.status)
      && ((m.assignedVehicleIds || []).some(x => (x.id || x) === veh.id) || (m.assignedCrew && (m.assignedCrew.vehicles || []).some(x => (x.id || x) === veh.id))));
    if (other) return `Engagé sur « ${other.title} »`;
    const st = String(veh.status || 'dispo');
    if (!['dispo', 'disponible', 'sdis_caserne', 'base'].includes(st)) {
      const labels = { mission: 'En intervention', transit: 'En transit', a_rearme: 'À réarmer', maintenance: 'En maintenance', panne: 'En panne', samu_garde: 'De garde SAMU', sdis_astreinte: 'Astreinte SDIS', repos: 'Indisponible' };
      return labels[st] || 'Indisponible';
    }
    return null;
  },

  toggleVehicle(missionId, vehId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission || this._isManagerBlocked(game, mission)) return;
    const veh = (game.vehicles || []).find(v => v.id === vehId);
    if (!veh) return;
    if (!Array.isArray(mission.assignedVehicleIds)) mission.assignedVehicleIds = [];
    const engaged = this.getEngagedVehicles(game, mission).some(v => v.id === vehId);

    if (engaged) {
      if (this.isVehicleDeployed(mission, vehId)) {
        // Véhicule parti : repli géré par le jeu (retour base)
        game.toggleMissionVehicle(missionId, vehId);
        return;
      }
      mission.assignedVehicleIds = mission.assignedVehicleIds.filter(x => (x.id || x) !== vehId);
      if (Array.isArray(mission.assignedVehicles)) mission.assignedVehicles = mission.assignedVehicles.filter(x => (x.id || x) !== vehId);
      delete this.getLoads(mission)[vehId];
      delete this.getTasks(mission)[vehId];
      Object.keys(mission.volunteerTeams || {}).forEach(id => {
        if (mission.volunteerTeams[id] === `team_veh_${vehId}` || mission.volunteerTeams[id] === vehId) delete mission.volunteerTeams[id];
      });
      this.syncMissionLots(mission);
      game.showToast('Véhicule retiré', `${veh.name} n'est plus engagé. Son matériel et son équipage sont libérés.`, 'slate');
    } else {
      const blocker = this.getVehicleBlocker(game, mission, veh);
      if (blocker) { game.showToast('Véhicule indisponible 🚫', `${veh.name} : ${blocker}.`, 'orange'); return; }
      mission.assignedVehicleIds.push(vehId);
      // Affectation automatique à la première mission qui attend ce type de véhicule
      const reqs = this.ensureRequests(game, mission);
      const tasks = this.getTasks(mission);
      const engagedNow = this.getEngagedVehicles(game, mission);
      const target = reqs.find(r => Object.entries(r.vehicles).some(([t, n]) => this.typeMatches(t, veh.type)
        && engagedNow.filter(v => v.id !== vehId && tasks[v.id] === r.id && this.typeMatches(t, v.type)).length < n));
      if (target) tasks[vehId] = target.id;
      game.showToast('Véhicule engagé 🚑', `${veh.name} (${veh.type}) engagé${target ? ` pour « ${target.title} »` : ''}.`, 'blue');
    }
    this._refresh(missionId);
  },

  setVehicleTask(missionId, vehId, reqId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission || this._isManagerBlocked(game, mission)) return;
    const tasks = this.getTasks(mission);
    if (reqId) tasks[vehId] = reqId; else delete tasks[vehId];
    this._refresh(missionId);
  },

  loadLot(missionId, vehId, lotId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission || !lotId || this._isManagerBlocked(game, mission)) return;
    const veh = (game.vehicles || []).find(v => v.id === vehId);
    if (!veh) return;
    if (this.isVehicleDeployed(mission, vehId)) { game.showToast('Véhicule parti', 'Impossible de charger du matériel : le véhicule a déjà quitté la base.', 'orange'); return; }
    const loads = this.getLoads(mission);
    const cur = loads[vehId] || (loads[vehId] = {});
    const meta = this.lotMeta(game, lotId);
    const { available } = this.getLotAvailable(game, mission, lotId);
    if (available <= 0) { game.showToast('Stock épuisé 📦', `Plus aucun « ${meta.name} » disponible dans vos antennes.`, 'orange'); return; }
    if (this.isTrailer(lotId)) {
      if (!this.canTow(veh)) { game.showToast('Attelage requis 🔗', `${veh.name} n'a pas d'attelage pour tracter « ${meta.name} ».`, 'orange'); return; }
      const trailers = Object.entries(cur).filter(([id, n]) => this.isTrailer(id) && n > 0).length;
      if (trailers >= 1) { game.showToast('Une seule remorque', `${veh.name} tracte déjà une remorque.`, 'orange'); return; }
    } else {
      const slots = this.getLoadSlots(veh);
      const used = this.usedSlots(game, cur);
      const need = meta.logSlots || 1;
      if (used + need > slots) { game.showToast('Véhicule plein 📦', `${veh.name} : ${used}/${slots} emplacement(s) utilisés, « ${meta.name} » en demande ${need}.`, 'orange'); return; }
    }
    cur[lotId] = (Number(cur[lotId]) || 0) + 1;
    this.syncMissionLots(mission);
    this._refresh(missionId);
  },

  unloadLot(missionId, vehId, lotId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission || this._isManagerBlocked(game, mission)) return;
    if (this.isVehicleDeployed(mission, vehId)) { game.showToast('Véhicule parti', 'Le matériel est déjà sur le terrain avec le véhicule.', 'orange'); return; }
    const cur = this.getLoads(mission)[vehId] || {};
    cur[lotId] = Math.max(0, (Number(cur[lotId]) || 0) - 1);
    if (!cur[lotId]) delete cur[lotId];
    this.syncMissionLots(mission);
    this._refresh(missionId);
  },

  // Chargement automatique du matériel demandé pour la mission du véhicule
  autoLoadVehicle(missionId, vehId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission) return;
    const reqId = this.getTasks(mission)[vehId];
    const req = this.ensureRequests(game, mission).find(r => r.id === reqId);
    if (!req) { game.showToast('Mission à choisir', 'Affectez d\'abord ce véhicule à une mission (étape 4) pour charger son matériel.', 'orange'); return; }
    const cov = this.computeCoverage(game, mission).per.find(p => p.req.id === reqId);
    let loaded = 0;
    (cov ? cov.lotStatus : []).forEach(ls => {
      for (let i = ls.have; i < ls.need; i++) {
        const before = JSON.stringify(this.getLoads(mission)[vehId] || {});
        this._silentLoad(game, mission, vehId, ls.id);
        if (JSON.stringify(this.getLoads(mission)[vehId] || {}) !== before) loaded++;
      }
    });
    this.syncMissionLots(mission);
    game.showToast(loaded ? 'Chargement effectué 📦' : 'Rien à charger', loaded ? `${loaded} lot(s) chargé(s) selon la demande.` : 'Matériel déjà chargé, en rupture de stock ou véhicule plein.', loaded ? 'green' : 'slate');
    this._refresh(missionId);
  },

  _silentLoad(game, mission, vehId, lotId) {
    const veh = (game.vehicles || []).find(v => v.id === vehId);
    if (!veh || this.getLotAvailable(game, mission, lotId).available <= 0) return;
    const loads = this.getLoads(mission);
    const cur = loads[vehId] || (loads[vehId] = {});
    if (this.isTrailer(lotId)) {
      if (!this.canTow(veh) || Object.keys(cur).some(id => this.isTrailer(id) && cur[id] > 0)) return;
    } else if (this.usedSlots(game, cur) + (this.lotMeta(game, lotId).logSlots || 1) > this.getLoadSlots(veh)) return;
    cur[lotId] = (Number(cur[lotId]) || 0) + 1;
  },

  assignVolunteer(missionId, vehId, volId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission || !volId || this._isManagerBlocked(game, mission)) return;
    const veh = (game.vehicles || []).find(v => v.id === vehId);
    if (!veh) return;
    if (this.getCrew(game, mission, vehId).length >= this.getSeats(veh)) {
      game.showToast('Véhicule complet 💺', `${veh.name} n'a que ${this.getSeats(veh)} place(s) assise(s).`, 'orange');
      return;
    }
    game.setVolunteerCrisisTeam(missionId, volId, `team_veh_${vehId}`);
  },

  unassignVolunteer(missionId, volId) {
    const game = window.game;
    if (!game) return;
    game.setVolunteerCrisisTeam(missionId, volId, null);
  },

  // Répartition automatique des bénévoles disponibles dans les véhicules, selon les compétences demandées
  autoCrew(missionId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission || this._isManagerBlocked(game, mission)) return;
    const S = window.ProtecSmsMobilization;
    const reqs = this.ensureRequests(game, mission);
    const tasks = this.getTasks(mission);
    if (!mission.volunteerTeams) mission.volunteerTeams = {};
    const engaged = this.getEngagedVehicles(game, mission).filter(v => !this.isRenfortVeh(v) && !this.isVehicleDeployed(mission, v.id));
    const deployedIds = new Set(mission.engagedVolunteers || []);
    let free = (game.volunteers || []).filter(v => (mission.registeredVolunteers || []).includes(v.id) && !mission.volunteerTeams[v.id] && !deployedIds.has(v.id));
    let placed = 0;
    const put = (veh, vol) => { mission.volunteerTeams[vol.id] = `team_veh_${veh.id}`; free = free.filter(x => x.id !== vol.id); placed++; };
    engaged.forEach(veh => {
      const seats = this.getSeats(veh);
      const crew = () => this.getCrew(game, mission, veh.id);
      // 1. Conducteur
      if (!crew().some(v => game.isVolunteerQualifiedToDrive(v, veh))) {
        const d = free.find(v => game.isVolunteerQualifiedToDrive(v, veh));
        if (d && crew().length < seats) put(veh, d);
      }
      // 2. Compétences demandées par la mission du véhicule
      const req = reqs.find(r => r.id === tasks[veh.id]);
      (req ? req.skills : []).forEach(sk => {
        let have = crew().filter(v => S && S.volunteerHasQuotaSkill(v, sk.key)).length;
        while (have < sk.count && crew().length < seats) {
          const c = free.find(v => S && S.volunteerHasQuotaSkill(v, sk.key));
          if (!c) break;
          put(veh, c); have++;
        }
      });
    });
    // 3. Compléter les véhicules selon l'effectif demandé par mission
    engaged.forEach(veh => {
      const seats = this.getSeats(veh);
      const req = reqs.find(r => r.id === tasks[veh.id]);
      const reqVehs = req ? engaged.filter(v => tasks[v.id] === req.id) : [veh];
      const reqCrew = () => reqVehs.reduce((a, v) => a + this.getCrew(game, mission, v.id).length, 0);
      while (free.length && this.getCrew(game, mission, veh.id).length < seats && (!req || reqCrew() < req.personnel)) put(veh, free[0]);
    });
    game.showToast(placed ? 'Équipages constitués 👥' : 'Aucun bénévole à placer', placed ? `${placed} bénévole(s) répartis dans les véhicules (conducteurs et compétences en priorité).` : 'Recueillez d\'abord des disponibilités par SMS ou engagez des véhicules.', placed ? 'green' : 'slate');
    this._refresh(missionId);
  },

  deployVehicle(missionId, vehId) {
    const game = window.game;
    if (!game) return;
    game.deployCrisisTeam(missionId, `team_veh_${vehId}`);
  },

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  chip(label, have, need, extraClass = '') {
    const ok = have >= need;
    const cls = ok ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700'
      : (have > 0 ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'
        : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700');
    return `<span class="px-2 py-0.5 rounded-lg text-[10px] font-black border ${cls} ${extraClass}">${label} ${have}/${need}</span>`;
  },

  pct(r) { return Math.round(Math.max(0, Math.min(1, r)) * 100); },

  render(game, mission) {
    this.ensureRequests(game, mission);
    const step = (game.crisisLogStep && game.crisisLogStep[mission.id]) || 1;
    const cov = this.computeCoverage(game, mission);
    const engaged = this.getEngagedVehicles(game, mission);
    const reg = (mission.registeredVolunteers || []).length;
    const loadsCount = Object.values(this.getLoads(mission)).reduce((a, l) => a + Object.values(l || {}).reduce((x, n) => x + (Number(n) || 0), 0), 0);
    const lotsNeeded = mission.authorityRequests.reduce((a, r) => a + Object.values(r.lots).reduce((x, n) => x + n, 0), 0);
    const vehNeeded = mission.authorityRequests.reduce((a, r) => a + Object.values(r.vehicles).reduce((x, n) => x + n, 0), 0);
    const steps = [
      { n: 1, label: 'Demande de l\'autorité', icon: '📋', done: reg > 0, info: `${reg}/${cov.neededPersonnel} dispo` },
      { n: 2, label: 'Véhicules', icon: '🚑', done: engaged.length >= vehNeeded && vehNeeded > 0, info: `${engaged.length}/${vehNeeded}` },
      { n: 3, label: 'Matériel', icon: '📦', done: lotsNeeded === 0 || loadsCount >= lotsNeeded, info: `${loadsCount}/${lotsNeeded}` },
      { n: 4, label: 'Équipages & missions', icon: '👥', done: cov.overall >= 0.999, info: `${this.pct(cov.overall)} %` }
    ];
    const body = step === 1 ? this.renderStepRequest(game, mission, cov)
      : step === 2 ? this.renderStepVehicles(game, mission, cov)
        : step === 3 ? this.renderStepMateriel(game, mission, cov)
          : this.renderStepCrews(game, mission, cov);
    return `
      <div class="space-y-3 animate-in fade-in duration-150">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          ${steps.map(s => `
            <button type="button" onclick="window.ProtecCriseMoyens.setStep('${mission.id}', ${s.n})" class="py-1.5 px-2 rounded-lg text-left transition cursor-pointer ${step === s.n ? 'bg-white dark:bg-slate-900 shadow-sm ring-1 ring-pc-blue' : 'hover:bg-white/60 dark:hover:bg-slate-900/50'}">
              <div class="flex items-center gap-1.5 text-[11px] font-black ${step === s.n ? 'text-pc-blue dark:text-sky-300' : 'text-slate-700 dark:text-slate-200'}">
                <span class="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] ${s.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}">${s.done ? '✓' : s.n}</span>
                <span class="truncate">${s.icon} ${s.label}</span>
              </div>
              <div class="text-[9px] font-bold text-slate-500 dark:text-slate-400 pl-6">${s.info}</div>
            </button>
          `).join('')}
        </div>
        ${body}
        <div class="flex items-center justify-between gap-2">
          ${step > 1 ? `<button type="button" onclick="window.ProtecCriseMoyens.setStep('${mission.id}', ${step - 1})" class="px-3 py-1.5 rounded-lg text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer">← Étape précédente</button>` : '<span></span>'}
          ${step < 4 ? `<button type="button" onclick="window.ProtecCriseMoyens.setStep('${mission.id}', ${step + 1})" class="px-3 py-1.5 rounded-lg text-[11px] font-black bg-pc-blue text-white cursor-pointer">Étape suivante →</button>` : ''}
        </div>
      </div>`;
  },

  renderStepRequest(game, mission, cov) {
    const reg = (mission.registeredVolunteers || []).length;
    const S = window.ProtecSmsMobilization;
    const skillLabel = (k) => (S && S.getQuotaDef ? S.getQuotaDef(k).short : k);
    return `
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="text-xs font-black uppercase text-slate-800 dark:text-white">📋 Moyens demandés par l'autorité d'engagement</div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400">${mission.authorityLabel || 'Autorité requérante'} — moyens exigés pour chaque mission confiée.</div>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="px-2 py-1 rounded-lg text-[10px] font-black border ${cov.overall >= 0.999 ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700' : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700'}">Couverture ${this.pct(cov.overall)} %</span>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          ${cov.per.map(p => {
            const r = p.req;
            return `
              <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 space-y-1.5">
                <div class="flex items-start justify-between gap-2">
                  <div class="text-xs font-black text-slate-900 dark:text-white leading-snug">${r.icon} ${r.title}</div>
                  <span class="text-[10px] font-black ${p.ratio >= 0.999 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} shrink-0">${this.pct(p.ratio)} %</span>
                </div>
                <div class="flex flex-wrap gap-1">
                  ${p.vehStatus.map(v => this.chip(`🚘 ${v.type}`, v.have, v.need)).join('')}
                  ${p.lotStatus.map(l => this.chip(`${this.lotMeta(game, l.id).emoji} ${this.lotMeta(game, l.id).name}`, l.have, l.need)).join('')}
                  ${this.chip('👥 Personnels', Math.min(p.crew.length, r.personnel), r.personnel)}
                  ${p.skillStatus.map(s => this.chip(`🎯 ${skillLabel(s.key)}`, s.have, s.need)).join('')}
                </div>
              </div>`;
          }).join('')}
        </div>
        <div class="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="text-[11px] text-sky-900 dark:text-sky-200">
            <strong>Disponibilités recueillies : ${reg} / ${cov.neededPersonnel} personnels.</strong> Envoyez le SMS de déclenchement : les compétences demandées par l'autorité y sont pré-remplies.
          </div>
          <button type="button" onclick="window.game.openSmsModal('${mission.id}', ${Boolean(mission.smsConsigne)})" class="px-3 py-1.5 rounded-lg text-[11px] font-black bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shrink-0">📱 ${mission.smsConsigne ? 'Nouveau SMS' : 'Envoyer le SMS'}</button>
        </div>
        <p class="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">ℹ️ Vous restez libre d'engager moins ou plus que demandé. Un moyen manquant dégrade la mission et réduit l'indemnisation versée à la clôture ; un moyen en surplus n'est pas remboursé par l'autorité.</p>
      </div>`;
  },

  renderStepVehicles(game, mission, cov) {
    const engaged = this.getEngagedVehicles(game, mission);
    const engagedIds = new Set(engaged.map(v => v.id));
    // Besoins agrégés par type
    const need = {};
    mission.authorityRequests.forEach(r => Object.entries(r.vehicles).forEach(([t, n]) => { need[t] = (need[t] || 0) + n; }));
    const haveType = (t) => engaged.filter(v => this.typeMatches(t, v.type)).length;
    const fleet = [...(game.vehicles || [])].filter(v => v && !v.isTrailerUnit).sort((a, b) => {
      const da = Object.keys(need).some(t => this.typeMatches(t, a.type)) ? 0 : 1;
      const db = Object.keys(need).some(t => this.typeMatches(t, b.type)) ? 0 : 1;
      return da - db || String(a.type).localeCompare(String(b.type));
    });
    const extra = engaged.filter(v => !Object.keys(need).some(t => this.typeMatches(t, v.type)));
    return `
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3">
        <div>
          <div class="text-xs font-black uppercase text-slate-800 dark:text-white">🚑 Véhicules de vos antennes</div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400">Engagez les véhicules demandés. Les véhicules équivalents sont acceptés (ex. un VLHR pour un VL).</div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${Object.entries(need).map(([t, n]) => this.chip(this.VEH_LABELS[t] || t, Math.min(n, haveType(t)), n)).join('')}
        </div>
        ${extra.length ? `<div class="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-600/40 rounded-lg px-2.5 py-1.5">⚠️ Hors demande : ${extra.map(v => v.name).join(', ')} — engagé(s) en surplus, non remboursé(s) par l'autorité.</div>` : ''}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          ${fleet.map(v => {
            const isEng = engagedIds.has(v.id);
            const blocker = isEng ? null : this.getVehicleBlocker(game, mission, v);
            const wanted = Object.entries(need).some(([t, n]) => this.typeMatches(t, v.type) && haveType(t) < n);
            const deployed = isEng && this.isVehicleDeployed(mission, v.id);
            return `
              <div class="p-2.5 rounded-xl border flex items-center justify-between gap-2 ${isEng ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60' : (blocker ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 opacity-60' : (wanted ? 'bg-white dark:bg-slate-900 border-pc-blue/60 ring-1 ring-pc-blue/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'))}">
                <div class="min-w-0">
                  <div class="text-xs font-black text-slate-900 dark:text-white truncate">${v.name || v.type}</div>
                  <div class="text-[10px] text-slate-500 dark:text-slate-400">${v.type} • 💺 ${this.getSeats(v)} • 📦 ${this.getLoadSlots(v)} empl.${this.canTow(v) ? ' • 🔗' : ''}</div>
                  ${blocker ? `<div class="text-[10px] font-bold text-rose-600 dark:text-rose-400">${blocker}</div>` : (wanted && !isEng ? '<div class="text-[10px] font-bold text-pc-blue dark:text-sky-300">Demandé par l\'autorité</div>' : '')}
                </div>
                ${deployed ? '<span class="text-[10px] font-black text-emerald-700 dark:text-emerald-300 shrink-0">En route</span>'
                  : blocker ? '' : `<button type="button" onclick="window.ProtecCriseMoyens.toggleVehicle('${mission.id}', '${v.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer shrink-0 ${isEng ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' : 'bg-pc-blue text-white hover:brightness-110'}">${isEng ? 'Retirer' : 'Engager'}</button>`}
              </div>`;
          }).join('') || '<div class="text-[11px] text-slate-500">Aucun véhicule dans vos antennes.</div>'}
        </div>
        ${this.renderRenfortVehiclesBlock(game, mission)}
      </div>`;
  },

  renderStepMateriel(game, mission, cov) {
    const engaged = this.getEngagedVehicles(game, mission);
    const loads = this.getLoads(mission);
    const need = {};
    mission.authorityRequests.forEach(r => Object.entries(r.lots).forEach(([id, n]) => { need[id] = (need[id] || 0) + n; }));
    const loadedOf = (id) => Object.values(loads).reduce((a, l) => a + (Number(l && l[id]) || 0), 0);
    const catalog = (typeof game.getAvailableLotsCatalog === 'function') ? game.getAvailableLotsCatalog() : [];
    return `
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3">
        <div>
          <div class="text-xs font-black uppercase text-slate-800 dark:text-white">📦 Matériel de vos antennes</div>
          <div class="text-[10px] text-slate-500 dark:text-slate-400">Chargez le matériel demandé dans les véhicules engagés : il part et arrive avec eux. Les remorques se tractent (attelage requis).</div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          ${Object.entries(need).map(([id, n]) => {
            const meta = this.lotMeta(game, id);
            const { stock, available } = this.getLotAvailable(game, mission, id);
            const loaded = loadedOf(id);
            return `<div class="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700">
              <span class="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">${meta.emoji} ${meta.name}</span>
              <span class="flex items-center gap-1 shrink-0">${this.chip('Chargé', Math.min(loaded, n), n)}<span class="text-[9px] font-bold ${stock > 0 ? 'text-slate-500' : 'text-rose-600'}">${stock > 0 ? `${available} en stock` : 'non possédé'}</span></span>
            </div>`;
          }).join('') || '<div class="text-[11px] text-slate-500">L\'autorité ne demande aucun matériel particulier.</div>'}
        </div>
        ${engaged.length === 0 ? `<div class="text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-600/40 rounded-lg px-2.5 py-2">Engagez d'abord des véhicules (étape 2) pour y charger le matériel.</div>` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${engaged.map(v => {
              const cur = loads[v.id] || {};
              const slots = this.getLoadSlots(v);
              const used = this.usedSlots(game, cur);
              const isRf = this.isRenfortVeh(v);
              const deployed = isRf || this.isVehicleDeployed(mission, v.id);
              const req = mission.authorityRequests.find(r => r.id === this.getTasks(mission)[v.id]);
              const options = [...catalog].sort((a, b) => (need[b.id] ? 1 : 0) - (need[a.id] ? 1 : 0)).map(l => {
                const { stock, available } = this.getLotAvailable(game, mission, l.id);
                const dis = available <= 0;
                return `<option value="${l.id}" ${dis ? 'disabled' : ''}>${need[l.id] ? '★ ' : ''}${l.emoji} ${l.name} — ${stock > 0 ? `${available} dispo` : 'non possédé'}</option>`;
              }).join('');
              return `
                <div class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 space-y-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <div class="text-xs font-black text-slate-900 dark:text-white truncate">${v.name || v.type}</div>
                      <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${req ? `${req.icon} ${req.title}` : 'Mission non choisie (étape 4)'}</div>
                    </div>
                    <span class="text-[10px] font-black ${used >= slots ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'} shrink-0">📦 ${used}/${slots}</span>
                  </div>
                  <div class="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div class="h-full ${used >= slots ? 'bg-amber-500' : 'bg-pc-blue'}" style="width:${Math.min(100, Math.round(used / slots * 100))}%"></div></div>
                  <div class="flex flex-wrap gap-1">
                    ${Object.entries(cur).filter(([, n]) => n > 0).map(([id, n]) => `<span class="pl-2 pr-1 py-0.5 rounded-lg text-[10px] font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 flex items-center gap-1">${this.lotMeta(game, id).emoji} ${this.lotMeta(game, id).name} ×${n}${deployed ? '' : `<button type="button" onclick="window.ProtecCriseMoyens.unloadLot('${mission.id}', '${v.id}', '${id}')" class="w-4 h-4 rounded bg-rose-50 text-rose-600 text-[9px] cursor-pointer">✕</button>`}</span>`).join('') || '<span class="text-[10px] text-slate-500 italic">Vide</span>'}
                  </div>
                  ${deployed ? `<div class="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">${isRf ? `🤝 Renfort ${v.sourceStationName || ''} : matériel fourni par l'antenne alliée.` : 'Véhicule parti avec son chargement.'}</div>` : `
                    <div class="flex gap-1.5">
                      <select onchange="if(this.value){ window.ProtecCriseMoyens.loadLot('${mission.id}', '${v.id}', this.value); this.value=''; }" class="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 cursor-pointer">
                        <option value="">+ Charger un lot…</option>${options}
                      </select>
                      ${req && Object.keys(req.lots).length ? `<button type="button" onclick="window.ProtecCriseMoyens.autoLoadVehicle('${mission.id}', '${v.id}')" class="px-2 py-1 rounded-lg text-[10px] font-black bg-pc-blue text-white cursor-pointer shrink-0" title="Charger le matériel demandé pour sa mission">⚡ Auto</button>` : ''}
                    </div>`}
                </div>`;
            }).join('')}
          </div>`}
      </div>`;
  },

  renderStepCrews(game, mission, cov) {
    const S = window.ProtecSmsMobilization;
    const engaged = this.getEngagedVehicles(game, mission);
    const tasks = this.getTasks(mission);
    const reqs = mission.authorityRequests;
    const placedIds = new Set(engaged.flatMap(v => this.getCrew(game, mission, v.id).map(x => x.id)));
    const deployedVols = new Set(mission.engagedVolunteers || []);
    const free = (game.volunteers || []).filter(v => (mission.registeredVolunteers || []).includes(v.id) && !placedIds.has(v.id) && !deployedVols.has(v.id));
    const skillsOf = (v) => (S ? ['cd', 'cs', 'cp', 'ce', 'pse2', 'pse1', 'log', 'cond_vpsp', 'permis_c', 'conduite_4x4', 'permis_moto', 'permis_bateau', 'telepilote', 'cyno', 'aquatique', 'soutien_psy', 'transmissions', 'tronconnage']
      .filter(k => S.volunteerHasQuotaSkill(v, k)) : []);
    // Ne garder que le grade le plus élevé
    const tags = (v) => {
      const ks = skillsOf(v);
      const grades = ['cd', 'cs', 'cp', 'ce', 'pse2', 'pse1'];
      const top = grades.find(g => ks.includes(g));
      return [...(top ? [top] : []), ...ks.filter(k => !grades.includes(k))].map(k => S.getQuotaDef(k).short);
    };
    return `
      <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div class="text-xs font-black uppercase text-slate-800 dark:text-white">👥 Équipages & missions</div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400">Affectez chaque véhicule à une mission demandée, puis les bénévoles disponibles (réponses SMS) aux véhicules.</div>
          </div>
          <button type="button" onclick="window.ProtecCriseMoyens.autoCrew('${mission.id}')" class="px-3 py-1.5 rounded-lg text-[11px] font-black bg-pc-blue text-white cursor-pointer shrink-0">⚡ Répartition auto</button>
        </div>
        ${cov.unassignedVehs.length ? `<div class="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-600/40 rounded-lg px-2.5 py-1.5">⚠️ Sans mission : ${cov.unassignedVehs.map(v => v.name).join(', ')}.</div>` : ''}
        ${engaged.length === 0 ? `<div class="text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-600/40 rounded-lg px-2.5 py-2">Engagez d'abord des véhicules (étape 2).</div>` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            ${engaged.map(v => {
              const crew = this.getCrew(game, mission, v.id);
              const seats = this.getSeats(v);
              const isRf = this.isRenfortVeh(v);
              const deployed = !isRf && this.isVehicleDeployed(mission, v.id);
              const req = reqs.find(r => r.id === tasks[v.id]);
              const sameProp = isRf ? this.getRenfortVehicles(mission).filter(x => x.propId === v.propId && x.id !== v.id) : [];
              const hasDriver = crew.some(c => game.isVolunteerQualifiedToDrive(c, v));
              const reqSkills = req ? req.skills : [];
              return `
                <div class="p-2.5 rounded-xl border ${deployed ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70'} space-y-1.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-black text-slate-900 dark:text-white truncate">${v.name || v.type}</span>
                    <span class="text-[10px] font-black ${crew.length > seats ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'} shrink-0">💺 ${crew.length}/${seats}</span>
                  </div>
                  <select ${deployed ? 'disabled' : ''} onchange="window.ProtecCriseMoyens.setVehicleTask('${mission.id}', '${v.id}', this.value)" class="w-full px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border ${req ? 'border-slate-300 dark:border-slate-600' : 'border-amber-400'} cursor-pointer">
                    <option value="">— Mission du véhicule —</option>
                    ${reqs.map(r => `<option value="${r.id}" ${tasks[v.id] === r.id ? 'selected' : ''}>${r.icon} ${r.title}</option>`).join('')}
                  </select>
                  <div class="flex flex-wrap gap-1">
                    ${hasDriver ? '<span class="px-2 py-0.5 rounded-lg text-[10px] font-black border bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700">🚗 Conducteur ✓</span>' : '<span class="px-2 py-0.5 rounded-lg text-[10px] font-black border bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700">🚗 Conducteur manquant</span>'}
                    ${reqSkills.map(sk => this.chip(`🎯 ${S ? S.getQuotaDef(sk.key).short : sk.key}`, Math.min(sk.count, crew.filter(c => S && S.volunteerHasQuotaSkill(c, sk.key)).length), sk.count)).join('')}
                  </div>
                  <div class="space-y-1">
                    ${crew.map(c => `
                      <div class="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span class="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">${c.name} <span class="text-[9px] font-black text-slate-500">${tags(c).join(' · ')}</span></span>
                        ${isRf ? (sameProp.length ? `<select onchange="if(this.value) window.ProtecCriseMoyens.moveRenfortVolunteer('${mission.id}', '${c.id}', this.value)" class="w-24 px-1 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 cursor-pointer"><option value="">Déplacer…</option>${sameProp.map(x => `<option value="${x.id}">${x.name}</option>`).join('')}</select>` : '') : (deployed ? '' : `<button type="button" onclick="window.ProtecCriseMoyens.unassignVolunteer('${mission.id}', '${c.id}')" class="w-5 h-5 rounded bg-rose-50 text-rose-600 text-[10px] font-black cursor-pointer shrink-0">✕</button>`)}
                      </div>`).join('') || '<div class="text-[10px] text-slate-500 italic">Aucun équipier</div>'}
                  </div>
                  ${isRf ? this.renderRenfortStatusLine(mission, v) : deployed ? '<div class="text-[10px] font-black text-emerald-700 dark:text-emerald-300">✓ Déployé</div>' : `
                    <div class="flex gap-1.5">
                      <select onchange="if(this.value){ window.ProtecCriseMoyens.assignVolunteer('${mission.id}', '${v.id}', this.value); }" class="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 cursor-pointer" ${crew.length >= seats || free.length === 0 ? 'disabled' : ''}>
                        <option value="">${free.length ? '+ Ajouter un équipier…' : 'Aucun bénévole disponible'}</option>
                        ${free.map(f => `<option value="${f.id}">${f.name} — ${tags(f).join(' · ') || (f.rank || 'Secouriste')}${game.isVolunteerQualifiedToDrive(f, v) ? ' 🚗' : ''}</option>`).join('')}
                      </select>
                      <button type="button" ${crew.length && req ? '' : 'disabled'} onclick="window.ProtecCriseMoyens.deployVehicle('${mission.id}', '${v.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${crew.length && req ? 'bg-gradient-to-r from-red-600 to-pc-orange text-white cursor-pointer' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}">🚨 Déployer</button>
                    </div>`}
                </div>`;
            }).join('')}
          </div>`}
        <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 space-y-1">
          <div class="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Bénévoles disponibles non affectés (${free.length})</div>
          <div class="flex flex-wrap gap-1">
            ${free.map(f => `<span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">${f.name} · ${tags(f).join(' · ') || (f.rank || 'Secouriste')}</span>`).join('') || `<span class="text-[10px] text-slate-500 italic">${(mission.registeredVolunteers || []).length ? 'Tous les disponibles sont affectés.' : 'Aucune réponse positive : envoyez le SMS (étape 1).'}</span>`}
          </div>
          ${cov.surplusPersonnel > 0 ? `<div class="text-[10px] font-bold text-amber-700 dark:text-amber-300">⚠️ ${cov.surplusPersonnel} personnel(s) au-delà de la demande : non remboursés par l'autorité.</div>` : ''}
        </div>
      </div>`;
  }
};

// =============================================================================
// RENFORTS DE CRISE ENTRE ANTENNES
// - L'antenne alliée recueille les disponibilités par SMS, puis propose plusieurs
//   véhicules, du matériel et ses bénévoles DISPO.
// - Le directeur accepte entité par entité, sous réserve de pouvoir transporter
//   (places assises + conducteurs pour les humains, emplacements LOG pour le
//   matériel, attelage pour les remorques), et donne la consigne d'acheminement.
// - Les moyens acceptés s'intègrent à la logistique de crise du directeur.
// =============================================================================
Object.assign(window.ProtecCriseMoyens, {
  RENFORT_CONSIGNES: {
    sur_place: { label: '📍 Directement sur les lieux', extraMin: 0 },
    base_directeur: { label: '🏢 Passer par la base du directeur', extraMin: 10 },
    regroupement: { label: '🚩 Point de regroupement (PRV)', extraMin: 5 },
    attente_base: { label: '⏸️ Attendre à leur base, départ sur ordre', wait: true }
  },

  _findAnyMission(game, missionId) {
    return (game.missions || []).find(m => m.id === missionId) || (game.activeCrises || []).find(c => c.id === missionId) || null;
  },

  vehicleLicense(veh) {
    const t = String(veh.type || '').toUpperCase();
    return veh.licenseRequired || this.getVehicleCatalogEntry(veh).licenseRequired || (['FLIT', 'VALOG', 'PCM'].includes(t) ? 'C' : (['MPS', 'MOTO', 'QUAD'].includes(t) ? 'Moto' : 'B'));
  },

  volunteerLicenses(game, vol) {
    return ['B', 'C', 'Moto'].filter(l => game.isVolunteerQualifiedToDrive(vol, { licenseRequired: l, type: l === 'C' ? 'PCM' : (l === 'Moto' ? 'MPS' : 'VL') }));
  },

  // Format unique d'une proposition (compatibilité avec les anciennes propositions à 1 véhicule)
  normalizeProposal(p) {
    if (p && p.version === 2) return p;
    const lots = {};
    (p.embarkedLots || []).forEach(l => { lots[l.id] = (lots[l.id] || 0) + 1; });
    return Object.assign({}, p, {
      vehicles: p.vehicleId ? [{ id: p.vehicleId, name: p.vehicleName, type: p.vehicleType, seats: 4, slots: 1, canTow: false, license: 'B' }] : [],
      volunteers: (p.volunteerIds || []).map((id, i) => ({ id, name: (p.volunteersNames || [])[i] || 'Secouriste', rank: 'Secouriste', skills: ['permis_b'], licenses: ['B'] })),
      lots, lotsMeta: {}
    });
  },

  // Contrôle du transport d'une sélection (véhicules / bénévoles / lots)
  checkTransport(game, vehicles, volunteers, lots, lotsMeta) {
    const seats = vehicles.reduce((a, v) => a + (Number(v.seats) || 0), 0);
    const slotsCap = vehicles.reduce((a, v) => a + (Number(v.slots) || 0), 0);
    const towCap = vehicles.filter(v => v.canTow).length;
    let slotsUsed = 0, trailers = 0;
    Object.entries(lots || {}).forEach(([id, n]) => {
      const q = Number(n) || 0;
      if (this.isTrailer(id)) trailers += q;
      else slotsUsed += q * ((lotsMeta && lotsMeta[id] && lotsMeta[id].slots) || this.lotMeta(game, id).logSlots || 1);
    });
    // Un conducteur titulaire du bon permis par véhicule (appariement glouton, permis rares d'abord)
    const pool = volunteers.map(v => v.licenses || []);
    const order = ['C', 'Moto', 'B'];
    let driversOk = true;
    [...vehicles].sort((a, b) => order.indexOf(a.license || 'B') - order.indexOf(b.license || 'B')).forEach(v => {
      const idx = pool.findIndex(l => l.includes(v.license || 'B'));
      if (idx === -1) driversOk = false; else pool.splice(idx, 1);
    });
    const msgs = [];
    if (volunteers.length > seats) msgs.push(`${volunteers.length} bénévole(s) pour ${seats} place(s) assise(s)`);
    if (vehicles.length && !driversOk) msgs.push('Il manque un conducteur titulaire du bon permis pour au moins un véhicule');
    if (slotsUsed > slotsCap) msgs.push(`Matériel : ${slotsUsed} emplacement(s) LOG pour ${slotsCap} disponible(s)`);
    if (trailers > towCap) msgs.push(`${trailers} remorque(s) pour ${towCap} véhicule(s) avec attelage`);
    if ((volunteers.length || slotsUsed || trailers) && !vehicles.length) msgs.push('Aucun véhicule pour assurer le transport');
    return { ok: msgs.length === 0, seats, slotsCap, slotsUsed, trailers, towCap, driversOk, msgs };
  },

  // ---------------------------------------------------------------------------
  // CÔTÉ ANTENNE DE RENFORT : constitution de la proposition
  // ---------------------------------------------------------------------------
  _offer(missionId) {
    const game = window.game;
    if (!game._rfOffer || game._rfOffer.missionId !== missionId) game._rfOffer = { missionId, vehIds: [], lots: {}, volIds: [] };
    return game._rfOffer;
  },

  openRenfortOffer(missionId) {
    const game = window.game;
    if (!game) return;
    const mission = this._findAnyMission(game, missionId);
    if (!mission) return;
    let modal = document.getElementById('propose-crisis-renfort-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'propose-crisis-renfort-modal';
      modal.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4';
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    this.refreshRenfortOffer(missionId);
  },

  closeRenfortOffer() {
    document.getElementById('propose-crisis-renfort-modal')?.classList.add('hidden');
  },

  refreshRenfortOffer(missionId) {
    const game = window.game;
    const modal = document.getElementById('propose-crisis-renfort-modal');
    if (!game || !modal || modal.classList.contains('hidden')) return;
    const mission = this._findAnyMission(game, missionId);
    if (!mission) return;
    const scrollBox = modal.querySelector('[data-rf-scroll]');
    const scrollTop = scrollBox ? scrollBox.scrollTop : 0;
    modal.innerHTML = this.renderRenfortOfferHTML(game, mission);
    const box2 = modal.querySelector('[data-rf-scroll]');
    if (box2) box2.scrollTop = scrollTop;
    if (window.lucide) window.lucide.createIcons();
  },

  getOfferVehiclesPool(game, mission) {
    return (game.vehicles || []).filter(v => v && !v.isTrailerUnit && !this.getVehicleBlocker(game, mission, v));
  },

  renderRenfortOfferHTML(game, mission) {
    const S = window.ProtecSmsMobilization;
    const offer = this._offer(mission.id);
    const myId = game.player?.id || 'usr_local';
    const sms = (game.crisisRenfortSmsDispos && game.crisisRenfortSmsDispos[mission.id]) || null;
    const responses = (sms && sms.responses) || {};
    const pool = this.getOfferVehiclesPool(game, mission);
    offer.vehIds = offer.vehIds.filter(id => pool.some(v => v.id === id));
    const dispoVols = (game.volunteers || []).filter(v => responses[v.id] && responses[v.id].status === 'available' && !['mission', 'renfort'].includes(v.status));
    offer.volIds = offer.volIds.filter(id => dispoVols.some(v => v.id === id));
    const counts = { available: 0, unavailable: 0, profile: 0 };
    Object.values(responses).forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    const asked = sms ? (game.volunteers || []).filter(v => !v.isBurnout).length : 0;
    const pending = sms ? Math.max(0, asked - Object.keys(responses).length) : 0;
    const catalog = (typeof game.getAvailableLotsCatalog === 'function') ? game.getAvailableLotsCatalog() : [];
    const lotsPool = catalog.map(l => ({ meta: l, ...this.getLotAvailable(game, mission, l.id) })).filter(x => x.available > 0 || offer.lots[x.meta.id]);
    const selVehs = pool.filter(v => offer.vehIds.includes(v.id)).map(v => ({ seats: this.getSeats(v), slots: this.getLoadSlots(v), canTow: this.canTow(v), license: this.vehicleLicense(v) }));
    const selVols = dispoVols.filter(v => offer.volIds.includes(v.id)).map(v => ({ licenses: this.volunteerLicenses(game, v) }));
    const check = this.checkTransport(game, selVehs, selVols, offer.lots, null);
    const total = offer.vehIds.length + offer.volIds.length + Object.values(offer.lots).reduce((a, n) => a + n, 0);
    const canSubmit = total > 0 && ((offer.volIds.length === 0 && Object.keys(offer.lots).length === 0) || offer.vehIds.length > 0);
    const mine = (mission.proposedRenforts || []).filter(p => p.sourcePlayerId === myId && ['proposed', 'accepted', 'on_site'].includes(p.status));
    const tags = (v) => {
      if (!S) return v.rank || 'Secouriste';
      const grades = ['cd', 'cs', 'cp', 'ce', 'pse2', 'pse1'];
      const top = grades.find(g => S.volunteerHasQuotaSkill(v, g));
      const spe = ['log', 'cond_vpsp', 'permis_c', 'conduite_4x4', 'permis_moto', 'permis_bateau', 'telepilote', 'cyno', 'aquatique', 'soutien_psy', 'transmissions', 'tronconnage'].filter(k => S.volunteerHasQuotaSkill(v, k));
      return [...(top ? [top] : []), ...spe].map(k => S.getQuotaDef(k).short).join(' · ') || (v.rank || 'Secouriste');
    };
    const box = 'p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2';
    const h = (n, t, extra = '') => `<div class="flex items-center justify-between gap-2"><span class="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">${n}. ${t}</span>${extra}</div>`;
    return `
      <div class="w-full max-w-2xl rounded-3xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-h-[92vh] flex flex-col">
        <div class="flex items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <div class="min-w-0">
            <h3 class="text-base font-black text-slate-900 dark:text-white">🤝 Proposer un renfort de crise</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${mission.title} • Directeur : ${mission.managerPlayerName || 'Directeur de crise'}</p>
          </div>
          <button type="button" onclick="window.ProtecCriseMoyens.closeRenfortOffer()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 font-black cursor-pointer shrink-0">✕</button>
        </div>
        <div data-rf-scroll class="p-5 space-y-3 overflow-y-auto">
          ${mine.length ? `<div class="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-700/50 space-y-1.5">
            <div class="text-[11px] font-black uppercase text-indigo-900 dark:text-indigo-200">Vos propositions en cours</div>
            ${mine.map(p => `<div class="flex items-center justify-between gap-2 text-[11px]"><span class="text-indigo-900 dark:text-indigo-100">${(p.vehicles || []).length} véhicule(s) • ${(p.volunteers || []).length} bénévole(s) • ${Object.values(p.lots || {}).reduce((a, n) => a + n, 0)} lot(s) — <strong>${p.status === 'proposed' ? 'en attente d\'arbitrage' : `accepté (${p.consigneLabel || ''})`}</strong></span>${p.status === 'proposed' ? `<button type="button" onclick="window.ProtecCriseMoyens.cancelOffer('${mission.id}', '${p.id}')" class="px-2 py-0.5 rounded-lg text-[10px] font-black bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 cursor-pointer">Annuler</button>` : ''}</div>`).join('')}
          </div>` : ''}

          <div class="${box}">
            ${h(1, 'Disponibilités de vos bénévoles', `<button type="button" onclick="window.ProtecCriseMoyens.openRenfortSms('${mission.id}')" class="px-3 py-1.5 rounded-lg text-[11px] font-black ${sms ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100' : 'bg-amber-500 hover:bg-amber-600 text-white'} cursor-pointer shrink-0">📱 ${sms ? 'Nouveau SMS' : 'Demander les disponibilités'}</button>`)}
            <p class="text-[11px] text-slate-600 dark:text-slate-300">${sms
              ? `SMS envoyé : <strong class="text-emerald-600 dark:text-emerald-400">${counts.available} DISPO</strong> • ${pending} en attente • ${counts.unavailable} indisponible(s)${counts.profile ? ` • ${counts.profile} hors profil` : ''}.`
              : 'Un bénévole ne peut pas être engagé sans avoir confirmé sa disponibilité. Envoyez d\'abord le SMS (compétences demandées possibles).'}</p>
          </div>

          <div class="${box}">
            ${h(2, 'Véhicules proposés', `<span class="text-[10px] font-bold text-slate-500">${offer.vehIds.length} sélectionné(s)</span>`)}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              ${pool.map(v => `<label class="flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${offer.vehIds.includes(v.id) ? 'bg-white dark:bg-slate-900 border-pc-blue ring-1 ring-pc-blue' : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'}">
                <input type="checkbox" ${offer.vehIds.includes(v.id) ? 'checked' : ''} onchange="window.ProtecCriseMoyens.offerToggle('${mission.id}', 'veh', '${v.id}')" class="rounded text-pc-blue">
                <span class="min-w-0"><span class="block text-xs font-black text-slate-900 dark:text-white truncate">${v.name || v.type}</span><span class="block text-[10px] text-slate-500">${v.type} • 💺 ${this.getSeats(v)} • 📦 ${this.getLoadSlots(v)}${this.canTow(v) ? ' • 🔗' : ''} • permis ${this.vehicleLicense(v)}</span></span>
              </label>`).join('') || '<div class="text-[11px] text-slate-500">Aucun véhicule disponible dans vos antennes.</div>'}
            </div>
          </div>

          <div class="${box}">
            ${h(3, 'Matériel proposé', `<span class="text-[10px] font-bold text-slate-500">${Object.values(offer.lots).reduce((a, n) => a + n, 0)} lot(s)</span>`)}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              ${lotsPool.map(x => { const q = offer.lots[x.meta.id] || 0; return `<div class="flex items-center justify-between gap-2 p-2 rounded-xl border ${q ? 'bg-white dark:bg-slate-900 border-amber-400' : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'}">
                <span class="min-w-0"><span class="block text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">${x.meta.emoji} ${x.meta.name}</span><span class="block text-[10px] text-slate-500">${this.isTrailer(x.meta.id) ? 'Remorque (attelage)' : `${x.meta.logSlots || 1} empl. LOG`} • ${x.available} dispo</span></span>
                <span class="flex items-center gap-1 shrink-0"><button type="button" onclick="window.ProtecCriseMoyens.offerLot('${mission.id}', '${x.meta.id}', -1)" class="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 font-black text-xs cursor-pointer">-</button><span class="w-5 text-center text-xs font-black">${q}</span><button type="button" onclick="window.ProtecCriseMoyens.offerLot('${mission.id}', '${x.meta.id}', 1)" class="w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 font-black text-xs cursor-pointer">+</button></span>
              </div>`; }).join('') || '<div class="text-[11px] text-slate-500">Aucun matériel en stock.</div>'}
            </div>
          </div>

          <div class="${box}">
            ${h(4, 'Bénévoles disponibles (réponses DISPO)', dispoVols.length ? `<button type="button" onclick="window.ProtecCriseMoyens.offerAllVols('${mission.id}')" class="text-[10px] font-black text-pc-blue dark:text-sky-300 cursor-pointer">Tout sélectionner</button>` : '')}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              ${dispoVols.map(v => `<label class="flex items-center gap-2 p-2 rounded-xl border cursor-pointer ${offer.volIds.includes(v.id) ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'}">
                <input type="checkbox" ${offer.volIds.includes(v.id) ? 'checked' : ''} onchange="window.ProtecCriseMoyens.offerToggle('${mission.id}', 'vol', '${v.id}')" class="rounded text-emerald-600">
                <span class="min-w-0"><span class="block text-xs font-black text-slate-900 dark:text-white truncate">${v.name}</span><span class="block text-[10px] text-slate-500 truncate">${tags(v)}${this.volunteerLicenses(game, v).length ? ` • 🚗 ${this.volunteerLicenses(game, v).join('/')}` : ''}</span></span>
              </label>`).join('') || `<div class="text-[11px] text-slate-500 italic">${sms ? 'Aucune réponse DISPO pour le moment…' : 'Envoyez le SMS pour connaître les disponibilités.'}</div>`}
            </div>
          </div>

          <div class="p-3 rounded-2xl border ${check.ok ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700/50' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-600/50'} text-[11px] space-y-0.5">
            <div class="font-black ${check.ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-200'}">Transport : 💺 ${selVols.length}/${check.seats} • 📦 ${check.slotsUsed}/${check.slotsCap} empl.${check.trailers ? ` • 🔗 ${check.trailers}/${check.towCap}` : ''}</div>
            ${check.msgs.map(m => `<div class="text-amber-800 dark:text-amber-200">⚠️ ${m}</div>`).join('')}
            <div class="text-slate-600 dark:text-slate-300">Le directeur choisira ce qu'il accepte, dans la limite de ce qui peut être transporté, et donnera les consignes d'acheminement.</div>
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 p-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="window.ProtecCriseMoyens.closeRenfortOffer()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">Fermer</button>
          <button type="button" ${canSubmit ? '' : 'disabled'} onclick="window.ProtecCriseMoyens.submitRenfortOffer('${mission.id}')" class="px-5 py-2 rounded-xl text-xs font-black text-white ${canSubmit ? 'bg-gradient-to-r from-emerald-600 to-teal-600 cursor-pointer' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'}">📨 Proposer au directeur</button>
        </div>
      </div>`;
  },

  openRenfortSms(missionId) {
    const game = window.game;
    if (!game || !window.ProtecSmsMobilization) return;
    this.closeRenfortOffer();
    window.ProtecSmsMobilization.openSmsModal(game, missionId, false, { renfortMode: true });
  },

  offerToggle(missionId, kind, id) {
    const o = this._offer(missionId);
    const key = kind === 'veh' ? 'vehIds' : 'volIds';
    o[key] = o[key].includes(id) ? o[key].filter(x => x !== id) : o[key].concat([id]);
    this.refreshRenfortOffer(missionId);
  },

  offerAllVols(missionId) {
    const game = window.game;
    const o = this._offer(missionId);
    const r = (game.crisisRenfortSmsDispos && game.crisisRenfortSmsDispos[missionId] && game.crisisRenfortSmsDispos[missionId].responses) || {};
    o.volIds = (game.volunteers || []).filter(v => r[v.id] && r[v.id].status === 'available' && !['mission', 'renfort'].includes(v.status)).map(v => v.id);
    this.refreshRenfortOffer(missionId);
  },

  offerLot(missionId, lotId, delta) {
    const game = window.game;
    const mission = this._findAnyMission(game, missionId);
    const o = this._offer(missionId);
    const cur = o.lots[lotId] || 0;
    const max = this.getLotAvailable(game, mission, lotId).available;
    const next = Math.max(0, Math.min(max, cur + delta));
    if (next) o.lots[lotId] = next; else delete o.lots[lotId];
    this.refreshRenfortOffer(missionId);
  },

  submitRenfortOffer(missionId) {
    const game = window.game;
    const mission = this._findAnyMission(game, missionId);
    if (!game || !mission) return;
    const o = this._offer(missionId);
    const sms = (game.crisisRenfortSmsDispos && game.crisisRenfortSmsDispos[missionId]) || { responses: {} };
    const vols = (game.volunteers || []).filter(v => o.volIds.includes(v.id));
    if (vols.some(v => !(sms.responses[v.id] && sms.responses[v.id].status === 'available'))) {
      game.showToast('Disponibilité non confirmée', 'Seuls les bénévoles ayant répondu DISPO au SMS peuvent être proposés.', 'orange');
      return;
    }
    const vehs = (game.vehicles || []).filter(v => o.vehIds.includes(v.id));
    if ((vols.length || Object.keys(o.lots).length) && !vehs.length) {
      game.showToast('Transport requis', 'Proposez au moins un véhicule pour acheminer vos bénévoles et votre matériel.', 'orange');
      return;
    }
    const myId = game.player?.id || 'usr_local';
    const myStation = (game.stations || [])[0] || { name: 'Antenne alliée' };
    const route = typeof game.calculateRouteInfo === 'function' ? game.calculateRouteInfo(mission.lat, mission.lng) : {};
    const lotsMeta = {};
    Object.keys(o.lots).forEach(id => { const m = this.lotMeta(game, id); lotsMeta[id] = { name: m.name, emoji: m.emoji, slots: this.isTrailer(id) ? 0 : (m.logSlots || 1) }; });
    const S = window.ProtecSmsMobilization;
    const prop = {
      id: 'prop-renf-' + Date.now(),
      version: 2,
      missionId: mission.id,
      sourcePlayerId: myId,
      sourcePlayerName: game.player?.name || 'Responsable allié',
      sourceStationName: myStation.name,
      sourceStationId: myStation.id,
      vehicles: vehs.map(v => ({ id: v.id, name: v.name || v.type, type: v.type, seats: this.getSeats(v), slots: this.getLoadSlots(v), canTow: this.canTow(v), license: this.vehicleLicense(v) })),
      volunteers: vols.map(v => ({ id: v.id, name: v.name, rank: v.rank || 'Secouriste', skills: [...(v.skills || [])], permis_b: v.permis_b, permis_c: v.permis_c, permis_moto: v.permis_moto, isDriver: v.isDriver, licenses: this.volunteerLicenses(game, v), quotaKey: sms.responses[v.id] && sms.responses[v.id].quotaKey })),
      lots: { ...o.lots },
      lotsMeta,
      smsQuotas: (sms.config && sms.config.skillQuotas) || [],
      arrivalEstimatedMinutes: Math.max(5, Math.round(route.durationMinutes || 12)),
      status: 'proposed',
      createdAt: Date.now()
    };
    // Champs historiques (affichages et partage des indemnités existants)
    Object.assign(prop, {
      vehicleId: prop.vehicles[0] ? prop.vehicles[0].id : null,
      vehicleName: prop.vehicles.map(v => v.name).join(', ') || 'Matériel seul',
      vehicleType: prop.vehicles[0] ? prop.vehicles[0].type : 'VL',
      volunteerIds: prop.volunteers.map(v => v.id),
      volunteersCount: prop.volunteers.length,
      volunteersNames: prop.volunteers.map(v => v.name),
      specialLotLabel: Object.entries(prop.lots).map(([id, n]) => `${lotsMeta[id].name} ×${n}`).join(', '),
      consigneLabel: 'À définir par le directeur'
    });
    vehs.forEach(v => { v.statusBeforeRenfort = v.status; v.status = 'renfort'; v.renfortPropId = prop.id; v.renfortMissionId = mission.id; v.currentMissionTitle = 'Renfort proposé : ' + mission.title; });
    vols.forEach(v => { v.statusBeforeRenfort = v.status; v.status = 'renfort'; v.renfortPropId = prop.id; v.renfortMissionId = mission.id; });
    if (!Array.isArray(mission.proposedRenforts)) mission.proposedRenforts = [];
    mission.proposedRenforts.push(prop);
    game._rfOffer = null;
    this.closeRenfortOffer();
    if (window.ProtecAudio && typeof window.ProtecAudio.playRadioBeep === 'function') window.ProtecAudio.playRadioBeep();
    game.showToast('Renfort proposé 📨', `${prop.vehicles.length} véhicule(s), ${prop.volunteers.length} bénévole(s) et ${Object.values(prop.lots).reduce((a, n) => a + n, 0)} lot(s) proposés à ${mission.managerPlayerName || 'la direction de crise'}.`, 'green');
    this._broadcast(game, mission, 'crisis_renfort_proposed', prop);
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
    if (game.selectedMissionId === mission.id) game.openMissionDetails(mission.id);
  },

  cancelOffer(missionId, propId) {
    const game = window.game;
    const mission = this._findAnyMission(game, missionId);
    const prop = mission && (mission.proposedRenforts || []).find(p => p.id === propId);
    if (prop) this.releaseProposal(game, prop, null);
    game.cancelCrisisProposedRenfort(missionId, propId);
    this.refreshRenfortOffer(missionId);
  },

  _broadcast(game, mission, status, prop) {
    if (window.ProtecSupabase && typeof window.ProtecSupabase.broadcastDepartmentCrisisUpdate === 'function') {
      window.ProtecSupabase.broadcastDepartmentCrisisUpdate({
        id: mission.id,
        departmentCode: mission.departmentCode || game.stations?.[0]?.departmentCode || '54',
        status,
        proposition: prop,
        proposedRenforts: mission.proposedRenforts
      });
    }
  },

  // Libère les moyens de MON antenne liés à une proposition (sauf ceux conservés)
  releaseProposal(game, prop, keep = null) {
    const keepVeh = new Set((keep && keep.vehicleIds) || []);
    const keepVol = new Set((keep && keep.volunteerIds) || []);
    (game.vehicles || []).forEach(v => {
      if (v.renfortPropId !== prop.id || keepVeh.has(v.id)) return;
      v.status = (v.statusBeforeRenfort && !['renfort', 'mission'].includes(v.statusBeforeRenfort)) ? v.statusBeforeRenfort : 'dispo';
      delete v.renfortPropId; delete v.renfortMissionId; delete v.statusBeforeRenfort; v.currentMissionTitle = null;
    });
    (game.volunteers || []).forEach(v => {
      if (v.renfortPropId !== prop.id || keepVol.has(v.id)) return;
      v.status = (v.statusBeforeRenfort && !['renfort', 'mission'].includes(v.statusBeforeRenfort)) ? v.statusBeforeRenfort : 'dispo';
      delete v.renfortPropId; delete v.renfortMissionId; delete v.statusBeforeRenfort;
    });
  },

  // Mon renfort a été accepté (en tout ou partie) : seuls les moyens retenus partent
  applySenderAcceptance(game, mission, prop) {
    const acc = prop.accepted || { vehicleIds: [], volunteerIds: [] };
    this.releaseProposal(game, prop, acc);
    (game.vehicles || []).forEach(v => { if (acc.vehicleIds.includes(v.id) && v.renfortPropId === prop.id) { v.status = 'mission'; v.currentMissionTitle = 'Renfort : ' + mission.title; } });
    (game.volunteers || []).forEach(v => { if (acc.volunteerIds.includes(v.id) && v.renfortPropId === prop.id) v.status = 'mission'; });
    const nb = acc.vehicleIds.length + acc.volunteerIds.length + Object.values(acc.lots || {}).reduce((a, n) => a + n, 0);
    game.showToast('✓ Renfort accepté par le directeur', `${nb} moyen(s) retenu(s). Consigne : ${prop.consigneLabel}.${prop.waiting ? ' Attendez l\'ordre de départ.' : ''} Les moyens non retenus sont libérés.`, 'green', { type: 'mission', id: mission.id });
  },

  // Libération automatique quand la crise est terminée ou que la proposition a disparu
  releaseFinishedRenforts(game) {
    if (!game) return;
    const all = (game.missions || []).concat(game.activeCrises || []);
    const props = new Map();
    all.forEach(m => (m.proposedRenforts || []).forEach(p => props.set(p.id, { m, p })));
    let changed = false;
    const ids = new Set();
    (game.vehicles || []).concat(game.volunteers || []).forEach(x => { if (x && x.renfortPropId) ids.add(x.renfortPropId); });
    ids.forEach(pid => {
      const e = props.get(pid);
      if (!e || this.isEnded(e.m) || ['rejected', 'cancelled'].includes(e.p.status)) {
        this.releaseProposal(game, e ? e.p : { id: pid }, null);
        changed = true;
      }
    });
    if (changed && typeof game.saveGame === 'function') game.saveGame();
  },

  // ---------------------------------------------------------------------------
  // CÔTÉ DIRECTEUR : arbitrage entité par entité + consigne d'acheminement
  // ---------------------------------------------------------------------------
  renderArbitrage(game, mission) {
    const proposals = (mission.proposedRenforts || []).filter(p => p.status === 'proposed').map(p => this.normalizeProposal(p));
    if (!proposals.length) return '';
    return `
      <div class="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500 space-y-3">
        <div>
          <div class="text-xs font-black uppercase text-amber-950 dark:text-amber-200">🤝 Propositions de renfort reçues (${proposals.length})</div>
          <div class="text-[11px] text-amber-900 dark:text-amber-300">Acceptez chaque véhicule, lot ou bénévole séparément. Les bénévoles et le matériel doivent pouvoir être transportés par les véhicules retenus. Vous donnez ensuite la consigne d'acheminement.</div>
        </div>
        ${proposals.map(p => this.renderProposalCard(game, mission, p)).join('')}
      </div>`;
  },

  renderProposalCard(game, mission, p) {
    const S = window.ProtecSmsMobilization;
    const pid = p.id;
    const tags = (v) => {
      if (!S) return v.rank;
      const grades = ['cd', 'cs', 'cp', 'ce', 'pse2', 'pse1'];
      const top = grades.find(g => S.volunteerHasQuotaSkill(v, g));
      const spe = ['log', 'cond_vpsp', 'permis_c', 'conduite_4x4', 'permis_moto', 'permis_bateau', 'telepilote', 'cyno', 'aquatique', 'soutien_psy', 'transmissions', 'tronconnage'].filter(k => S.volunteerHasQuotaSkill(v, k));
      return [...(top ? [top] : []), ...spe].map(k => S.getQuotaDef(k).short).join(' · ') || v.rank;
    };
    const lotName = (id) => (p.lotsMeta && p.lotsMeta[id] && p.lotsMeta[id].name) || this.lotMeta(game, id).name;
    return `
      <div data-rf-prop="${pid}" class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600/50 space-y-2">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="text-xs font-black text-slate-900 dark:text-white">🏢 ${p.sourceStationName || 'Antenne alliée'} <span class="font-semibold text-slate-500">• ${p.sourcePlayerName || ''} • trajet ~${p.arrivalEstimatedMinutes || 12} min</span></span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
          <div class="space-y-1">
            <div class="text-[10px] font-black uppercase text-slate-500">🚘 Véhicules</div>
            ${(p.vehicles || []).map(v => `<label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked data-rf-kind="veh" value="${v.id}" onchange="window.ProtecCriseMoyens.updateArbitrage('${mission.id}', '${pid}')" class="rounded"><span class="truncate"><strong>${v.name}</strong> <span class="text-slate-500">${v.type} • 💺${v.seats} • 📦${v.slots}${v.canTow ? ' • 🔗' : ''}</span></span></label>`).join('') || '<span class="text-slate-500 italic">Aucun</span>'}
          </div>
          <div class="space-y-1">
            <div class="text-[10px] font-black uppercase text-slate-500">📦 Matériel</div>
            ${Object.entries(p.lots || {}).map(([id, n]) => `<div class="flex items-center justify-between gap-1"><span class="truncate">${lotName(id)}</span><span class="flex items-center gap-1 shrink-0"><input type="number" min="0" max="${n}" value="${n}" data-rf-kind="lot" data-lot="${id}" onchange="window.ProtecCriseMoyens.updateArbitrage('${mission.id}', '${pid}')" class="w-11 px-1 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center font-black">/${n}</span></div>`).join('') || '<span class="text-slate-500 italic">Aucun</span>'}
          </div>
          <div class="space-y-1">
            <div class="text-[10px] font-black uppercase text-slate-500">👥 Bénévoles</div>
            ${(p.volunteers || []).map(v => `<label class="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked data-rf-kind="vol" value="${v.id}" onchange="window.ProtecCriseMoyens.updateArbitrage('${mission.id}', '${pid}')" class="rounded"><span class="truncate"><strong>${v.name}</strong> <span class="text-slate-500">${tags(v)}${(v.licenses || []).length ? ' • 🚗' : ''}</span></span></label>`).join('') || '<span class="text-slate-500 italic">Aucun</span>'}
          </div>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <select data-rf-consigne class="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 cursor-pointer">
            ${Object.entries(this.RENFORT_CONSIGNES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('')}
          </select>
          <div class="flex gap-1.5 shrink-0">
            <button type="button" onclick="window.game.rejectCrisisProposedRenfort('${mission.id}', '${pid}')" class="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer">Tout refuser</button>
            <button type="button" data-rf-accept onclick="window.ProtecCriseMoyens.acceptRenfortSelection('${mission.id}', '${pid}')" class="px-3 py-1.5 rounded-lg text-[11px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white cursor-pointer">Accepter la sélection</button>
          </div>
        </div>
        <div data-rf-check class="text-[11px]">${this.renderArbitrageCheck(game, p, this._defaultSelection(p))}</div>
      </div>`;
  },

  _defaultSelection(p) {
    return { vehicleIds: (p.vehicles || []).map(v => v.id), volunteerIds: (p.volunteers || []).map(v => v.id), lots: { ...(p.lots || {}) } };
  },

  _readSelection(pid) {
    const card = document.querySelector(`[data-rf-prop="${pid}"]`);
    if (!card) return null;
    const sel = { vehicleIds: [], volunteerIds: [], lots: {}, consigne: 'sur_place' };
    card.querySelectorAll('input[data-rf-kind="veh"]:checked').forEach(i => sel.vehicleIds.push(i.value));
    card.querySelectorAll('input[data-rf-kind="vol"]:checked').forEach(i => sel.volunteerIds.push(i.value));
    card.querySelectorAll('input[data-rf-kind="lot"]').forEach(i => { const n = Math.max(0, Math.min(Number(i.max) || 0, parseInt(i.value, 10) || 0)); if (n) sel.lots[i.dataset.lot] = n; });
    const c = card.querySelector('[data-rf-consigne]');
    if (c) sel.consigne = c.value;
    return { card, sel };
  },

  renderArbitrageCheck(game, p, sel) {
    const vehs = (p.vehicles || []).filter(v => sel.vehicleIds.includes(v.id));
    const vols = (p.volunteers || []).filter(v => sel.volunteerIds.includes(v.id));
    const c = this.checkTransport(game, vehs, vols, sel.lots, p.lotsMeta);
    return `<div class="px-2.5 py-1.5 rounded-lg ${c.ok ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'} font-bold">
      ${c.ok ? '✓' : '✕'} Transport : 💺 ${vols.length}/${c.seats} • 📦 ${c.slotsUsed}/${c.slotsCap} empl.${c.trailers ? ` • 🔗 ${c.trailers}/${c.towCap}` : ''}${c.msgs.length ? ' — ' + c.msgs.join(' ; ') : ''}
    </div>`;
  },

  updateArbitrage(missionId, pid) {
    const game = window.game;
    const mission = this._findAnyMission(game, missionId);
    const raw = mission && (mission.proposedRenforts || []).find(x => x.id === pid);
    const r = this._readSelection(pid);
    if (!raw || !r) return;
    const p = this.normalizeProposal(raw);
    const box = r.card.querySelector('[data-rf-check]');
    if (box) box.innerHTML = this.renderArbitrageCheck(game, p, r.sel);
  },

  acceptRenfortSelection(missionId, pid) {
    const game = window.game;
    const mission = this._findAnyMission(game, missionId);
    if (!game || !mission) return;
    const raw = (mission.proposedRenforts || []).find(x => x.id === pid);
    const r = this._readSelection(pid);
    if (!raw || !r) return;
    const p = this.normalizeProposal(raw);
    const sel = r.sel;
    const vehs = (p.vehicles || []).filter(v => sel.vehicleIds.includes(v.id));
    const vols = (p.volunteers || []).filter(v => sel.volunteerIds.includes(v.id));
    if (!vehs.length && !vols.length && !Object.keys(sel.lots).length) { game.showToast('Rien de sélectionné', 'Cochez au moins un moyen, ou refusez la proposition.', 'orange'); return; }
    const c = this.checkTransport(game, vehs, vols, sel.lots, p.lotsMeta);
    if (!c.ok) { game.showToast('Transport impossible 🚫', c.msgs.join(' ; ') + '.', 'orange'); return; }
    const cons = this.RENFORT_CONSIGNES[sel.consigne] || this.RENFORT_CONSIGNES.sur_place;
    Object.assign(raw, {
      version: 2,
      vehicles: p.vehicles, volunteers: p.volunteers, lots: p.lots, lotsMeta: p.lotsMeta || {},
      accepted: { vehicleIds: sel.vehicleIds, volunteerIds: sel.volunteerIds, lots: sel.lots },
      status: 'accepted',
      acceptedAt: Date.now(),
      consigne: sel.consigne,
      consigneLabel: cons.label,
      waiting: Boolean(cons.wait),
      arrivalAt: cons.wait ? null : Date.now() + (15 + (raw.arrivalEstimatedMinutes || 12) + (cons.extraMin || 0)) * 60000,
      // Champs historiques
      vehicleName: vehs.map(v => v.name).join(', ') || 'Matériel seul',
      volunteersCount: vols.length,
      volunteersNames: vols.map(v => v.name)
    });
    this._dispatchRenfortInMission(game, mission, raw);
    const logMsg = `🤝 RENFORT ACCEPTÉ : ${raw.sourceStationName} engage ${vehs.length} véhicule(s), ${vols.length} bénévole(s) et ${Object.values(sel.lots).reduce((a, n) => a + n, 0)} lot(s). Consigne : ${cons.label}.`;
    if (window.ProtecCriseLogistique && typeof window.ProtecCriseLogistique.logOperationalEvent === 'function') window.ProtecCriseLogistique.logOperationalEvent(game, mission, logMsg, 'direction');
    if (window.ProtecAudio && typeof window.ProtecAudio.playRadioBeep === 'function') window.ProtecAudio.playRadioBeep();
    game.showToast('Renfort accepté', `${raw.sourceStationName} : ${vehs.length} véhicule(s), ${vols.length} bénévole(s). ${cons.label}.`, 'green');
    if (raw.sourcePlayerId === (game.player?.id || 'usr_local')) this.applySenderAcceptance(game, mission, raw);
    this._broadcast(game, mission, 'crisis_renfort_accepted', raw);
    game.saveGame();
    if (game.selectedMissionId === mission.id) game.openMissionDetails(mission.id);
  },

  // Répartition des bénévoles de renfort dans leurs véhicules et chargement de leur matériel
  _dispatchRenfortInMission(game, mission, prop) {
    if (!mission.renfortCrew) mission.renfortCrew = {};
    const vehs = this.getRenfortVehicles(mission).filter(v => v.propId === prop.id);
    const vols = this.getRenfortVolunteers(mission).filter(v => v.propId === prop.id);
    const seatsLeft = {};
    vehs.forEach(v => { seatsLeft[v.id] = this.getSeats(v); });
    const placed = new Set();
    vehs.forEach(v => {
      const d = vols.find(x => !placed.has(x.id) && (x.licenses || []).includes(v.license || 'B'));
      if (d) { mission.renfortCrew[d.id] = v.id; placed.add(d.id); seatsLeft[v.id]--; }
    });
    vols.filter(x => !placed.has(x.id)).forEach(x => {
      const v = vehs.find(y => seatsLeft[y.id] > 0);
      if (v) { mission.renfortCrew[x.id] = v.id; seatsLeft[v.id]--; }
    });
    const loads = this.getLoads(mission);
    Object.entries((prop.accepted && prop.accepted.lots) || {}).forEach(([id, n]) => {
      for (let i = 0; i < n; i++) {
        const meta = (prop.lotsMeta && prop.lotsMeta[id]) || { slots: this.lotMeta(game, id).logSlots || 1 };
        const target = vehs.find(v => {
          const cur = loads[v.id] || {};
          if (this.isTrailer(id)) return v.canTow && !Object.keys(cur).some(k => this.isTrailer(k) && cur[k] > 0);
          const used = Object.entries(cur).reduce((a, [k, q]) => a + (this.isTrailer(k) ? 0 : (((prop.lotsMeta && prop.lotsMeta[k] && prop.lotsMeta[k].slots) || 1) * q)), 0);
          return used + (meta.slots || 1) <= this.getLoadSlots(v);
        });
        if (target) { loads[target.id] = loads[target.id] || {}; loads[target.id][id] = (loads[target.id][id] || 0) + 1; }
      }
    });
    // Mission de l'autorité suggérée pour chaque véhicule de renfort
    const reqs = this.ensureRequests(game, mission);
    const tasks = this.getTasks(mission);
    vehs.forEach(v => {
      if (tasks[v.id]) return;
      const r = reqs.find(q => Object.keys(q.vehicles).some(t => this.typeMatches(t, v.type)));
      if (r) tasks[v.id] = r.id;
    });
    if (!Array.isArray(mission.crisisTeams)) mission.crisisTeams = [];
    mission.crisisTeams.push({ id: `team_renfort_${prop.id}`, name: `Renfort ${prop.sourceStationName || 'allié'}`, type: 'renfort', isRenfort: true, sourceStationName: prop.sourceStationName, sourcePlayerName: prop.sourcePlayerName, sourcePlayerId: prop.sourcePlayerId, volunteersCount: prop.volunteersCount, volunteersNames: prop.volunteersNames, consigneLabel: prop.consigneLabel, arrivalAt: prop.arrivalAt });
  },

  // Véhicules et bénévoles de renfort ACCEPTÉS, intégrés à la logistique du directeur
  getRenfortVehicles(mission) {
    const out = [];
    (mission.proposedRenforts || []).forEach(p => {
      if (!['accepted', 'on_site'].includes(p.status) || !p.accepted) return;
      (p.vehicles || []).filter(v => p.accepted.vehicleIds.includes(v.id)).forEach(v => out.push({
        id: `rf_${p.id}_${v.id}`, name: `${v.name} · ${p.sourceStationName || 'Renfort'}`, type: v.type,
        capacity: v.seats, capacity_log: v.slots, hasTowHitch: v.canTow, canTow: v.canTow, license: v.license, licenseRequired: v.license,
        isRenfort: true, propId: p.id, sourceStationName: p.sourceStationName, status: 'renfort'
      }));
    });
    return out;
  },

  getRenfortVolunteers(mission) {
    const out = [];
    (mission.proposedRenforts || []).forEach(p => {
      if (!['accepted', 'on_site'].includes(p.status) || !p.accepted) return;
      (p.volunteers || []).filter(v => p.accepted.volunteerIds.includes(v.id)).forEach(v => out.push(Object.assign({}, v, { id: `rfv_${p.id}_${v.id}`, isRenfort: true, propId: p.id })));
    });
    return out;
  },

  moveRenfortVolunteer(missionId, rfVolId, rfVehId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission || this._isManagerBlocked(game, mission)) return;
    const veh = this.getRenfortVehicles(mission).find(v => v.id === rfVehId);
    if (!veh) return;
    if (this.getCrew(game, mission, rfVehId).length >= this.getSeats(veh)) { game.showToast('Véhicule complet 💺', `${veh.name} n'a plus de place assise.`, 'orange'); return; }
    if (!mission.renfortCrew) mission.renfortCrew = {};
    mission.renfortCrew[rfVolId] = rfVehId;
    this._refresh(missionId);
  },

  // Renfort en attente à sa base : ordre de départ du directeur
  orderRenfortDeparture(missionId, propId) {
    const game = window.game;
    const mission = this._mission(missionId);
    if (!game || !mission || this._isManagerBlocked(game, mission)) return;
    const p = (mission.proposedRenforts || []).find(x => x.id === propId);
    if (!p) return;
    p.waiting = false;
    p.consigne = 'sur_place';
    p.consigneLabel = this.RENFORT_CONSIGNES.sur_place.label;
    p.arrivalAt = Date.now() + (15 + (p.arrivalEstimatedMinutes || 12)) * 60000;
    game.showToast('Ordre de départ transmis', `Le renfort de ${p.sourceStationName} fait mouvement directement sur les lieux.`, 'blue');
    this._broadcast(game, mission, 'crisis_renfort_accepted', p);
    this._refresh(missionId);
  },

  renderRenfortStatusLine(mission, v) {
    const p = (mission.proposedRenforts || []).find(x => x.id === v.propId) || {};
    if (p.waiting) return `<div class="flex items-center justify-between gap-2"><span class="text-[10px] font-black text-amber-700 dark:text-amber-300">⏸️ En attente à sa base</span><button type="button" onclick="window.ProtecCriseMoyens.orderRenfortDeparture('${mission.id}', '${p.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-gradient-to-r from-red-600 to-pc-orange text-white cursor-pointer">🚨 Ordonner le départ</button></div>`;
    const t = p.arrivalAt ? new Date(p.arrivalAt) : null;
    const arrived = t && Date.now() >= p.arrivalAt;
    return `<div class="text-[10px] font-black ${arrived ? 'text-emerald-700 dark:text-emerald-300' : 'text-indigo-700 dark:text-indigo-300'}">🤝 Renfort ${p.sourceStationName || ''} • ${p.consigneLabel || ''} • ${arrived ? 'sur place' : (t ? `arrivée ~${String(t.getHours()).padStart(2, '0')}h${String(t.getMinutes()).padStart(2, '0')}` : '')}</div>`;
  },

  renderRenfortVehiclesBlock(game, mission) {
    const rfs = this.getRenfortVehicles(mission);
    if (!rfs.length) return '';
    return `
      <div class="space-y-1.5">
        <div class="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300">🤝 Véhicules de renfort acceptés</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          ${rfs.map(v => `<div class="p-2.5 rounded-xl border bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700/60">
            <div class="text-xs font-black text-slate-900 dark:text-white truncate">${v.name}</div>
            <div class="text-[10px] text-slate-500 dark:text-slate-400">${v.type} • 💺 ${this.getSeats(v)} • 📦 ${this.getLoadSlots(v)} empl.</div>
            ${this.renderRenfortStatusLine(mission, v)}
          </div>`).join('')}
        </div>
      </div>`;
  }
});

// Libération périodique des moyens de renfort quand la crise se termine
setInterval(() => { try { window.ProtecCriseMoyens.releaseFinishedRenforts(window.game); } catch (e) { /* ignoré */ } }, 30000);
