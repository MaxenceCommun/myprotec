/**
 * MYPROTEC - MISSIONS LOGISTIQUES À LA BASE
 * ------------------------------------------------------------------
 * - Tâches combinables par véhicule : réarmement, nettoyage à la main,
 *   station de lavage (payante), plein de carburant (payant), chargement /
 *   déchargement de kit.
 * - Début planifié (date + heure). La durée dépend des tâches et du nombre
 *   de bénévoles présents (3 maximum par véhicule).
 * - Les bénévoles quittent leur domicile pour arriver à l'heure de début ;
 *   s'ils s'inscrivent trop tard, leur temps de trajet décale leur arrivée
 *   (la mission démarre avec ceux qui sont déjà là).
 * - Jauge de propreté des véhicules : baisse avec les km parcourus (plus vite
 *   par temps de pluie / neige), alerte sous 40 %, réputation pénalisée si un
 *   véhicule très sale (< 20 %) part en mission.
 */
(function () {
  const MIN = 60000;
  const BASE_ORDER = ['kit_unload', 'wash_hand', 'rearm', 'kit_load'];
  const EXTERNAL = ['wash_station', 'fuel'];
  const MAX_PER_VEH = 3;
  const FUEL_PRICE = 1.85;
  const AWAY = ['transit', 'mission', 'sur_les_lieux', 'in_transit', 'on_site', 'intervention', 'en_route', 'retour', 'vendu', 'garage_externe', 'urgences_chu', 'station_lavage', 'station_service', 'maintenance', 'garage', 'indispo'];
  const MOVING = ['mission', 'transit', 'en_route', 'sur_les_lieux', 'intervention', 'on_site', 'in_transit', 'retour', 'urgences_chu'];

  const TASKS = {
    rearm: { icon: '🧰', label: 'Réarmement', where: 'base' },
    wash_hand: { icon: '🧽', label: 'Nettoyage à la main', where: 'base' },
    wash_station: { icon: '🚿', label: 'Station de lavage', where: 'ext' },
    fuel: { icon: '⛽', label: 'Plein de carburant', where: 'ext' },
    kit_load: { icon: '📦', label: 'Chargement de kit', where: 'base' },
    kit_unload: { icon: '📤', label: 'Déchargement de kit', where: 'base' }
  };

  const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nowOf = (game) => Date.now() + ((game && game.serverTimeOffset) || 0);
  const hhmm = (ts) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const dayLabel = (ts, game) => {
    const d = new Date(ts), n = new Date(nowOf(game));
    const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (same(d, n)) return 'aujourd’hui';
    const t = new Date(n.getTime() + 86400000);
    if (same(d, t)) return 'demain';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const fmtMin = (m) => { m = Math.max(0, Math.round(m)); const h = Math.floor(m / 60), r = m % 60; return h ? `${h} h${r ? String(r).padStart(2, '0') : ''}` : `${r} min`; };

  const ML = {
    TASKS,

    // ---------- Caractéristiques des véhicules ----------
    gabarit(veh) {
      const t = `${veh.type || ''} ${veh.name || ''} ${veh.model || ''}`.toUpperCase();
      if (/FLIT|VALOG|\bPL\b|CAMION|PORTEUR|VTP|MIDLUM|POIDS/.test(t)) return 'pl';
      if (/\bVL\b|VLC|VLHR|VLTT|DUSTER|MOTO|QUAD|VELO/.test(t)) return 'vl';
      return 'fourgon';
    },
    tankLiters(veh) { return { vl: 55, fourgon: 80, pl: 140 }[this.gabarit(veh)]; },
    washPrice(veh) { return { vl: 12, fourgon: 20, pl: 30 }[this.gabarit(veh)]; },
    fuelCost(veh) { const f = typeof veh.fuel === 'number' ? veh.fuel : 100; return Math.round(Math.max(0, 100 - f) / 100 * this.tankLiters(veh) * FUEL_PRICE); },
    armLevel(veh) { return veh.armementLevel !== undefined ? veh.armementLevel : (veh.consumablesPercent !== undefined ? veh.consumablesPercent : (veh.isRearmed === false ? 70 : 100)); },
    clean(veh) { if (typeof veh.cleanliness !== 'number') veh.cleanliness = 100; return veh.cleanliness; },
    kitName(id) { const k = window.ProtecCriseLogistique && window.ProtecCriseLogistique.LOG_KITS && window.ProtecCriseLogistique.LOG_KITS[id]; return k ? (k.shortName || k.name) : (id || 'Kit'); },

    taskMinutes(kind, veh) {
      if (kind === 'rearm') return clamp(Math.round(15 + (100 - this.armLevel(veh)) * 0.45), 15, 60);
      if (kind === 'wash_hand') return { vl: 30, fourgon: 50, pl: 75 }[this.gabarit(veh)];
      if (kind === 'kit_load') return 20;
      if (kind === 'kit_unload') return 15;
      return 0;
    },
    taskCost(kind, veh) {
      if (kind === 'wash_station') return this.washPrice(veh);
      if (kind === 'fuel') return this.fuelCost(veh);
      return 0;
    },
    tripMinutes(kinds) {
      const w = kinds.includes('wash_station'), f = kinds.includes('fuel');
      return 16 + (w ? 15 : 0) + (f ? 10 : 0);
    },

    stationOf(game) { return (game.stations || [])[0] || null; },
    stationVehicles(game) {
      const st = this.stationOf(game);
      return (game.vehicles || []).filter(v => v && v.status !== 'vendu' && (!st || !v.stationId || v.stationId === st.id || (st.vehicles || []).includes(v.id)));
    },
    isOpen(m) { return m && m.logV2 && !['completed', 'canceled', 'annule'].includes(m.status); },
    findOpenMissionForVehicle(game, vehId, kind) {
      return (game.missions || []).find(m => this.isOpen(m) && (m.tasks || []).some(t => t.vehicleId === vehId && (!kind || t.kind === kind) && t.status !== 'done' && t.status !== 'skipped')) || null;
    },
    hasPermit(game, vol, veh) {
      if (typeof game.hasVolunteerSkill !== 'function') return true;
      if (this.gabarit(veh) === 'pl' && /FLIT|VALOG|CAMION|PORTEUR|POIDS/.test(`${veh.type} ${veh.name}`.toUpperCase())) return game.hasVolunteerSkill(vol, 'permis_c');
      return game.hasVolunteerSkill(vol, 'permis_b') || game.hasVolunteerSkill(vol, 'permis_vpsp') || game.hasVolunteerSkill(vol, 'permis_c');
    },
    rally(game, vol) { return typeof game.getVolunteerRallyMinutes === 'function' ? game.getVolunteerRallyMinutes(vol) : 12; },

    // Heure d'arrivée à la base d'un bénévole inscrit
    arrivalTs(game, m, volId) {
      const vol = (game.volunteers || []).find(v => v.id === volId);
      const joined = (m.volunteerJoinedAt && m.volunteerJoinedAt[volId]) || m.createdAt || nowOf(game);
      const r = vol ? this.rally(game, vol) : 12;
      return Math.max(m.plannedStartTs, joined + r * MIN);
    },
    presentIds(game, m, now) {
      now = now || nowOf(game);
      if (!this.isOpen(m)) return [];
      return (m.registeredVolunteers || []).filter(id => {
        if (m.trips && Object.values(m.trips).some(t => t.driverId === id)) return false;
        const vol = (game.volunteers || []).find(v => v.id === id);
        return vol && vol.status === 'logistique' && now >= this.arrivalTs(game, m, id);
      });
    },

    // ---------- Simulation de durée (même règles que le moteur) ----------
    estimate(game, tasks, n) {
      n = Math.max(1, n || 1);
      const st = tasks.map(t => ({ ...t, left: t.work || 0 }));
      const vehIds = [...new Set(st.map(t => t.vehicleId))];
      const trips = {};
      let t = 0, free = n;
      const busyUntil = [];
      for (let step = 0; step < 24 * 60; step++) {
        // fin des trajets
        Object.keys(trips).forEach(vid => { if (trips[vid] <= t) { delete trips[vid]; free++; st.filter(x => x.vehicleId === vid && EXTERNAL.includes(x.kind)).forEach(x => { x.left = 0; x.doneExt = true; }); } });
        const baseLeft = (vid) => st.some(x => x.vehicleId === vid && BASE_ORDER.includes(x.kind) && x.left > 0);
        // départs en station
        vehIds.forEach(vid => {
          if (trips[vid] !== undefined || baseLeft(vid) || free <= 0) return;
          const ext = st.filter(x => x.vehicleId === vid && EXTERNAL.includes(x.kind) && !x.doneExt);
          if (!ext.length) return;
          trips[vid] = t + this.tripMinutes(ext.map(x => x.kind));
          free--;
        });
        // travail à la base
        const working = vehIds.filter(baseLeft);
        let w = free;
        const alloc = {};
        while (w > 0 && working.some(v => (alloc[v] || 0) < MAX_PER_VEH)) {
          for (const v of working) { if (w <= 0) break; if ((alloc[v] || 0) < MAX_PER_VEH) { alloc[v] = (alloc[v] || 0) + 1; w--; } }
        }
        Object.entries(alloc).forEach(([vid, k]) => {
          let cap = k;
          for (const kind of BASE_ORDER) {
            const tk = st.find(x => x.vehicleId === vid && x.kind === kind && x.left > 0);
            if (!tk) continue;
            const use = Math.min(cap, tk.left); tk.left -= use; cap -= use;
            if (cap <= 0) break;
          }
        });
        t++;
        if (!st.some(x => x.left > 0 || (EXTERNAL.includes(x.kind) && !x.doneExt)) && !Object.keys(trips).length) break;
      }
      void busyUntil;
      return t;
    },

    // ---------- Création ----------
    reserveRearmStock(game, usePending) {
      const st = this.stationOf(game);
      if (!st) return { ok: false };
      st.stock = st.stock || {};
      if (!usePending && (st.stock.caisse_rearmement || 0) > 0) { st.stock.caisse_rearmement -= 1; return { ok: true, from: 'stock' }; }
      const pend = (game.deliveries || []).filter(d => d.status === 'in_transit' && (d.stationId === st.id || !d.stationId) && d.items && ((d.items.caisse_rearmement || 0) > 0 || (d.items.stock_materiels_ps || 0) >= 100));
      if (pend.length) {
        const d = pend[0];
        if ((d.items.caisse_rearmement || 0) > 0) d.items.caisse_rearmement -= 1; else d.items.stock_materiels_ps -= 100;
        return { ok: true, from: 'delivery', order: d.orderNumber };
      }
      if ((st.stock.caisse_rearmement || 0) > 0) { st.stock.caisse_rearmement -= 1; return { ok: true, from: 'stock' }; }
      return { ok: false };
    },
    rearmAvailability(game) {
      const st = this.stationOf(game);
      const stock = (st && st.stock && st.stock.caisse_rearmement) || 0;
      const pend = (game.deliveries || []).filter(d => d.status === 'in_transit' && d.items && ((d.items.caisse_rearmement || 0) > 0 || (d.items.stock_materiels_ps || 0) >= 100)).length;
      return { stock, pend };
    },

    buildTasks(game, picks) {
      // picks: [{ vehicleId, kind, kitId }]
      const vehs = this.stationVehicles(game);
      return picks.map((p, i) => {
        const veh = vehs.find(v => v.id === p.vehicleId);
        if (!veh) return null;
        return { id: `t${i + 1}_${p.kind}`, kind: p.kind, vehicleId: veh.id, vehicleName: veh.name || veh.type, kitId: p.kitId || null, work: this.taskMinutes(p.kind, veh), done: 0, cost: this.taskCost(p.kind, veh), status: 'todo' };
      }).filter(Boolean);
    },

    createMission(game, picks, startTs, opts = {}) {
      const tasks = this.buildTasks(game, picks);
      if (!tasks.length) return null;
      const st = this.stationOf(game) || { lat: 48.69, lng: 6.18, name: 'Antenne' };
      const now = nowOf(game);
      // Réservation des caisses de réarmement
      const reservations = [];
      for (const t of tasks.filter(x => x.kind === 'rearm')) {
        const r = this.reserveRearmStock(game, opts.usePending);
        if (!r.ok) { reservations.forEach(rr => { if (rr.from === 'stock') { st.stock.caisse_rearmement = (st.stock.caisse_rearmement || 0) + 1; } }); if (game.showToast) game.showToast('Matériel indisponible ⚠️', `Aucune caisse de réarmement en stock ni en commande pour ${t.vehicleName}. Commandez du matériel à la Centrale d’Achats.`, 'orange'); return null; }
        t.stockFrom = r.from; t.orderRef = r.order || null;
        reservations.push(r);
      }
      const vehIds = [...new Set(tasks.map(t => t.vehicleId))];
      const kinds = [...new Set(tasks.map(t => t.kind))];
      const title = kinds.length === 1 ? `${TASKS[kinds[0]].label} — ${tasks[0].vehicleName}${vehIds.length > 1 ? ` +${vehIds.length - 1}` : ''}` : `Logistique : ${kinds.map(k => TASKS[k].label.toLowerCase()).join(', ')}`;
      const d = new Date(startTs);
      const m = {
        id: `m-log-${now}-${Math.random().toString(36).slice(2, 6)}`,
        logV2: true,
        atBase: true,
        type: 'logistique',
        category: 'logistique',
        categoryLabel: '📦 Mission Logistique',
        isRearmamentWorkshop: kinds.includes('rearm'),
        title,
        desc: `Mission logistique à la base : ${tasks.map(t => `${TASKS[t.kind].label}${t.kind === 'kit_load' ? ' (' + this.kitName(t.kitId) + ')' : ''} – ${t.vehicleName}`).join(' · ')}.`,
        stationId: st.id,
        targetVehicleIds: vehIds,
        targetVehicleId: vehIds[0],
        tasks,
        trips: {},
        workers: {},
        plannedStartTs: startTs,
        eventDate: { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() },
        startHour: d.getHours(),
        startMinute: d.getMinutes(),
        status: 'planifie',
        registeredVolunteers: [],
        volunteerJoinedAt: {},
        requiredVolunteers: 1,
        maxVolunteers: Math.min(10, vehIds.length * MAX_PER_VEH + 1),
        scale: 'LOGISTIQUE',
        rewardMoney: 0,
        rewardReputation: Math.min(20, 4 + tasks.length * 2),
        address: `${st.name || 'Antenne'} (garage)`,
        city: st.city || '',
        lat: Number(st.lat) || 0,
        lng: Number(st.lng) || 0,
        createdAt: now,
        autoCreatedByResp: !!opts.auto,
        journal: [{ ts: now, text: `Mission créée — début prévu ${dayLabel(startTs, game)} à ${hhmm(startTs)}.` }]
      };
      game.missions = Array.isArray(game.missions) ? game.missions : [];
      game.missions.unshift(m);
      if (typeof game.renderMissions === 'function') game.renderMissions();
      if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
      if (typeof game.saveGame === 'function') game.saveGame();
      return m;
    },

    defaultStart(game, leadMin = 30) {
      const n = nowOf(game) + leadMin * MIN;
      const q = 15 * MIN;
      return Math.ceil(n / q) * q;
    },

    createAuto(game, vehId, kinds, pole) {
      const start = this.defaultStart(game, 20);
      const m = this.createMission(game, kinds.map(k => ({ vehicleId: vehId, kind: k })), start, { auto: true });
      if (!m) return null;
      if (pole) {
        const members = (game.volunteers || []).filter(v => (v.status === 'dispo' || !v.status) && (v.poleId === pole.id || (Array.isArray(pole.memberIds) && pole.memberIds.includes(v.id))));
        if (members.length) this.register(game, m.id, members[0].id, true);
      }
      return m;
    },

    register(game, missionId, volId, silent) {
      const m = (game.missions || []).find(x => x.id === missionId);
      const vol = (game.volunteers || []).find(v => v.id === volId);
      if (!m || !vol || !this.isOpen(m)) return false;
      if ((m.registeredVolunteers || []).includes(volId)) return false;
      if ((m.registeredVolunteers || []).length >= m.maxVolunteers) { if (!silent && game.showToast) game.showToast('Équipe complète', 'Le nombre maximum de bénévoles est atteint pour cette mission.', 'orange'); return false; }
      const now = nowOf(game);
      m.registeredVolunteers.push(volId);
      m.volunteerJoinedAt = m.volunteerJoinedAt || {};
      m.volunteerJoinedAt[volId] = now;
      const arr = this.arrivalTs(game, m, volId);
      const late = Math.max(0, Math.round((arr - m.plannedStartTs) / MIN));
      m.journal.unshift({ ts: now, text: `${vol.name} inscrit(e) — arrivée prévue à ${hhmm(arr)}${late > 0 && m.status === 'planifie' ? ` (${late} min après le début : trajet de ${this.rally(game, vol)} min)` : ''}.` });
      if (!silent && game.showToast) {
        game.showToast('Bénévole inscrit 📦', late > 0 && m.status === 'planifie'
          ? `${vol.name} arrivera à ${hhmm(arr)}, soit ${late} min après le début (trajet ${this.rally(game, vol)} min). La mission démarrera avec les bénévoles déjà présents.`
          : `${vol.name} arrivera à la base à ${hhmm(arr)}.`, late > 0 ? 'orange' : 'green');
      }
      if (typeof game.saveGame === 'function') game.saveGame();
      return true;
    },

    unregister(game, missionId, volId) {
      const m = (game.missions || []).find(x => x.id === missionId);
      if (!m) return;
      if (m.trips && Object.values(m.trips).some(t => t.driverId === volId)) { if (game.showToast) game.showToast('Impossible', 'Ce bénévole conduit un véhicule à la station : attendez son retour.', 'orange'); return; }
      m.registeredVolunteers = (m.registeredVolunteers || []).filter(id => id !== volId);
      const vol = (game.volunteers || []).find(v => v.id === volId);
      if (vol && vol.status === 'logistique') vol.status = 'dispo';
      if (m.workers) delete m.workers[volId];
      if (m.departed) delete m.departed[volId];
      m.journal.unshift({ ts: nowOf(game), text: `${vol ? vol.name : 'Un bénévole'} désinscrit(e).` });
      if (typeof game.saveGame === 'function') game.saveGame();
    },

    reschedule(game, missionId, ts) {
      const m = (game.missions || []).find(x => x.id === missionId);
      if (!m || m.status !== 'planifie') return;
      if (!(ts > nowOf(game) - MIN)) { if (game.showToast) game.showToast('Horaire invalide', 'Choisissez une date et une heure à venir.', 'orange'); return; }
      m.plannedStartTs = ts;
      const d = new Date(ts);
      m.eventDate = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
      m.startHour = d.getHours(); m.startMinute = d.getMinutes();
      m.departed = {};
      (m.registeredVolunteers || []).forEach(id => { const v = (game.volunteers || []).find(x => x.id === id); if (v && v.status === 'logistique') v.status = 'dispo'; });
      m.journal.unshift({ ts: nowOf(game), text: `Début reprogrammé ${dayLabel(ts, game)} à ${hhmm(ts)}.` });
      if (typeof game.saveGame === 'function') game.saveGame();
    },

    cancel(game, missionId) {
      const m = (game.missions || []).find(x => x.id === missionId);
      if (!m || !this.isOpen(m)) return;
      if (m.trips && Object.keys(m.trips).length) { if (game.showToast) game.showToast('Impossible', 'Un véhicule est en route vers la station : attendez son retour pour annuler.', 'orange'); return; }
      const st = this.stationOf(game);
      (m.tasks || []).forEach(t => { if (t.kind === 'rearm' && t.status !== 'done' && t.stockFrom && st) { st.stock = st.stock || {}; st.stock.caisse_rearmement = (st.stock.caisse_rearmement || 0) + 1; } });
      (m.registeredVolunteers || []).forEach(id => { const v = (game.volunteers || []).find(x => x.id === id); if (v && v.status === 'logistique') v.status = 'dispo'; });
      m.status = 'canceled';
      m.workers = {};
      m.journal.unshift({ ts: nowOf(game), text: 'Mission annulée.' });
      if (typeof game.renderMissions === 'function') game.renderMissions();
      if (typeof game.saveGame === 'function') game.saveGame();
    },

    // ---------- Moteur (appelé chaque seconde par le jeu) ----------
    tick(game) {
      const now = nowOf(game);
      this.tickDirt(game, now);
      (game.missions || []).forEach(m => { if (this.isOpen(m)) this.tickMission(game, m, now); });
      this.refreshOpenDetails(game);
    },

    log(m, now, text) { m.journal = m.journal || []; m.journal.unshift({ ts: now, text }); if (m.journal.length > 40) m.journal.length = 40; },

    tickMission(game, m, now) {
      const vols = game.volunteers || [];
      const vehs = this.stationVehicles(game);
      m.departed = m.departed || {};
      m.trips = m.trips || {};
      m.workers = m.workers || {};
      // 1. Départs du domicile (à l'heure pour arriver au début, ou dès l'inscription si c'est trop tard)
      (m.registeredVolunteers || []).slice().forEach(id => {
        if (m.departed[id]) return;
        const vol = vols.find(v => v.id === id);
        if (!vol) return;
        const arr = this.arrivalTs(game, m, id);
        const dep = arr - this.rally(game, vol) * MIN;
        if (now < dep) return;
        if (vol.status && !['dispo', 'disponible', 'base', 'logistique'].includes(vol.status)) {
          // Occupé ailleurs au moment de partir : il ne viendra pas
          m.registeredVolunteers = m.registeredVolunteers.filter(x => x !== id);
          this.log(m, now, `${vol.name} n'est plus disponible (statut : ${vol.status}) — désinscrit(e).`);
          if (game.showToast) game.showToast('Bénévole indisponible', `${vol.name} ne peut finalement pas venir à la mission logistique.`, 'orange');
          return;
        }
        vol.status = 'logistique';
        m.departed[id] = now;
        this.log(m, now, `${vol.name} quitte son domicile — arrivée à la base à ${hhmm(arr)}.`);
      });
      // 2. Lancement à l'heure prévue dès qu'un bénévole est sur place
      if (m.status === 'planifie') {
        if (now < m.plannedStartTs) return;
        const present = this.presentIds(game, m, now);
        if (!present.length) {
          if (!(m.registeredVolunteers || []).length && now > m.plannedStartTs + 12 * 3600 * 1000) {
            this.cancel(game, m.id);
            if (game.showToast) game.showToast('Mission logistique annulée', `« ${m.title} » : aucun bénévole inscrit 12 h après l'heure prévue.`, 'orange');
          }
          return;
        }
        m.status = 'ongoing';
        m.startedAt = now;
        m.lastTickAt = now;
        this.log(m, now, `Début de la mission (${present.length} bénévole${present.length > 1 ? 's' : ''} sur place).`);
        if (game.showToast) game.showToast('Mission logistique commencée 📦', `« ${m.title} » a démarré à la base.`, 'blue');
        if (typeof game.renderMissions === 'function') game.renderMissions();
      }
      if (m.status !== 'ongoing') return;
      const dt = clamp((now - (m.lastTickAt || now)) / MIN, 0, 5);
      m.lastTickAt = now;
      // 3. Retours de station (lavage / carburant)
      Object.entries(m.trips).forEach(([vid, trip]) => {
        if (now < trip.endsAt) return;
        const veh = vehs.find(v => v.id === vid) || (game.vehicles || []).find(v => v.id === vid);
        const drv = vols.find(v => v.id === trip.driverId);
        if (veh) {
          if (trip.kinds.includes('wash_station')) veh.cleanliness = 100;
          if (trip.kinds.includes('fuel')) veh.fuel = 100;
          veh.mileage = (veh.mileage || veh.kilometrage || 0) + 8; veh.kilometrage = veh.mileage;
          veh._dirtKm = veh.mileage;
          if (veh.status === 'station_lavage' || veh.status === 'station_service') veh.status = 'dispo';
        }
        if (drv && drv.status === 'mission') drv.status = 'logistique';
        (m.tasks || []).filter(t => t.vehicleId === vid && trip.kinds.includes(t.kind)).forEach(t => { t.status = 'done'; t.done = 1; });
        this.log(m, now, `${veh ? veh.name : 'Le véhicule'} est de retour (${trip.kinds.map(k => TASKS[k].label.toLowerCase()).join(' + ')} effectué${trip.kinds.length > 1 ? 's' : ''}).`);
        delete m.trips[vid];
      });
      // 4. Répartition du travail
      const present = this.presentIds(game, m, now);
      const vehAtBase = (vid) => { const v = vehs.find(x => x.id === vid); return v && !AWAY.includes(v.status) && !m.trips[vid]; };
      const baseLeft = (vid) => (m.tasks || []).some(t => t.vehicleId === vid && BASE_ORDER.includes(t.kind) && t.status !== 'done' && t.status !== 'skipped');
      const extLeft = (vid) => (m.tasks || []).filter(t => t.vehicleId === vid && EXTERNAL.includes(t.kind) && t.status !== 'done' && t.status !== 'skipped');
      let free = present.slice();
      const vehIds = [...new Set((m.tasks || []).map(t => t.vehicleId))];
      // Départs en station : véhicule sans travail restant à la base
      vehIds.forEach(vid => {
        if (m.trips[vid] || baseLeft(vid) || !vehAtBase(vid)) return;
        const ext = extLeft(vid);
        if (!ext.length) return;
        const veh = vehs.find(v => v.id === vid);
        const drvId = free.find(id => this.hasPermit(game, vols.find(v => v.id === id), veh));
        if (!drvId) { m.waitDriver = true; return; }
        const cost = ext.reduce((s, t) => s + (t.kind === 'fuel' ? this.fuelCost(veh) : t.cost), 0);
        if (game.resources && game.resources.money < cost) {
          ext.forEach(t => { t.status = 'skipped'; t.reason = 'Fonds insuffisants'; });
          this.log(m, now, `Passage en station annulé pour ${veh.name} : trésorerie insuffisante (${cost} €).`);
          return;
        }
        if (game.resources && cost > 0) {
          game.resources.money -= cost;
          if (window.ProtecFinances && typeof window.ProtecFinances.recordTransaction === 'function') window.ProtecFinances.recordTransaction(game, -cost, `${ext.map(t => TASKS[t.kind].label).join(' + ')} — ${veh.name}`, 'logistique');
          if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
        }
        const kinds = ext.map(t => t.kind);
        const dur = this.tripMinutes(kinds);
        m.trips[vid] = { driverId: drvId, startedAt: now, endsAt: now + dur * MIN, kinds, cost };
        ext.forEach(t => { t.status = 'doing'; t.cost = t.kind === 'fuel' ? this.fuelCost(veh) : t.cost; });
        veh.status = kinds.includes('wash_station') ? 'station_lavage' : 'station_service';
        const drv = vols.find(v => v.id === drvId);
        if (drv) drv.status = 'mission';
        free = free.filter(id => id !== drvId);
        m.waitDriver = false;
        this.log(m, now, `${drv ? drv.name : 'Un bénévole'} emmène ${veh.name} : ${kinds.map(k => TASKS[k].label.toLowerCase()).join(' + ')} (${cost} €, retour vers ${hhmm(now + dur * MIN)}).`);
      });
      // Travail à la base : 3 bénévoles maximum par véhicule, répartis équitablement
      const working = vehIds.filter(vid => baseLeft(vid) && vehAtBase(vid));
      const alloc = {};
      m.workers = {};
      let fi = 0;
      while (fi < free.length && working.some(v => (alloc[v] || []).length < MAX_PER_VEH)) {
        for (const v of working) {
          if (fi >= free.length) break;
          alloc[v] = alloc[v] || [];
          if (alloc[v].length < MAX_PER_VEH) { alloc[v].push(free[fi]); fi++; }
        }
      }
      Object.entries(alloc).forEach(([vid, ids]) => {
        let cap = ids.length * dt;
        let curKind = null;
        for (const kind of BASE_ORDER) {
          const tk = (m.tasks || []).find(t => t.vehicleId === vid && t.kind === kind && t.status !== 'done' && t.status !== 'skipped');
          if (!tk) continue;
          if (!curKind) curKind = kind;
          tk.status = 'doing';
          const use = Math.min(cap, tk.work - tk.done);
          tk.done += use; cap -= use;
          if (tk.done >= tk.work - 1e-6) this.finishTask(game, m, tk, now);
          if (cap <= 1e-9) break;
        }
        ids.forEach(id => { m.workers[id] = { vehicleId: vid, kind: curKind }; });
      });
      // 5. Fin de mission
      const remaining = (m.tasks || []).some(t => t.status !== 'done' && t.status !== 'skipped');
      if (!remaining && !Object.keys(m.trips).length) this.complete(game, m, now);
    },

    finishTask(game, m, t, now) {
      t.status = 'done';
      t.done = t.work;
      const veh = (game.vehicles || []).find(v => v.id === t.vehicleId);
      if (!veh) return;
      if (t.kind === 'rearm') {
        veh.armementLevel = 100; veh.consumables = 100; veh.consumablesPercent = 100;
        veh.isRearmed = true; veh.needsRearming = false; veh.a_rearme = false;
        veh.warnedLowConsumables = false; veh.breachedConsumables = false; veh.lastRearmedAt = now;
        if (veh.status === 'a_rearme') veh.status = 'dispo';
      } else if (t.kind === 'wash_hand') {
        veh.cleanliness = 100; veh._dirtyWarned = false;
      } else if (t.kind === 'kit_load') {
        veh.logKit = t.kitId;
      } else if (t.kind === 'kit_unload') {
        veh.logKit = null;
      }
      this.log(m, now, `${TASKS[t.kind].icon} ${TASKS[t.kind].label} terminé — ${veh.name}.`);
    },

    complete(game, m, now) {
      m.status = 'completed';
      m.completedAt = now;
      m.workers = {};
      (m.registeredVolunteers || []).forEach(id => {
        const v = (game.volunteers || []).find(x => x.id === id);
        if (v && (v.status === 'logistique' || v.status === 'mission')) v.status = 'dispo';
        if (v) v.energy = Math.max(10, (v.energy || 80) - 6);
      });
      if (game.resources && m.rewardReputation) game.resources.reputationScore = (game.resources.reputationScore || 0) + m.rewardReputation;
      this.log(m, now, 'Mission terminée.');
      const dur = m.startedAt ? Math.round((now - m.startedAt) / MIN) : 0;
      if (game.showToast) game.showToast('Mission logistique terminée ✅', `« ${m.title} » achevée en ${fmtMin(dur)}.`, 'green');
      if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
        window.ProtecNotifications.recordNotification({ title: '📦 Mission logistique terminée', message: `${m.title} — ${fmtMin(dur)}.`, category: 'logistique', color: 'emerald' });
      }
      if (typeof game.renderMissions === 'function') game.renderMissions();
      if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
      if (typeof game.saveGame === 'function') game.saveGame();
    },

    // ---------- Salissure des véhicules ----------
    isWet(game) {
      const w = game.weather || {};
      const c = Number(w.weatherCode || 0);
      return (w.precipitation || 0) > 0.1 || (c >= 51 && c <= 67) || (c >= 71 && c <= 86) || c >= 95;
    },
    tickDirt(game, now) {
      if (this._dirtAt && now - this._dirtAt < 5000) return;
      this._dirtAt = now;
      const wet = this.isWet(game);
      (game.vehicles || []).forEach(v => {
        if (!v) return;
        this.clean(v);
        const km = Number(v.mileage || v.kilometrage || 0);
        if (v._dirtKm === undefined) v._dirtKm = km;
        const delta = km - v._dirtKm;
        if (delta > 2000) v._dirtKm = km; // initialisation / correction du compteur : pas de salissure fictive
        else if (delta > 0) {
          v.cleanliness = clamp(v.cleanliness - delta * 0.35 * (wet ? 2 : 1), 0, 100);
          v._dirtKm = km;
        } else if (delta < 0) v._dirtKm = km;
        if (v.cleanliness < 40 && !v._dirtyWarned) {
          v._dirtyWarned = true;
          if (game.showToast) game.showToast('Véhicule sale 🧽', `${v.name} est sale (propreté ${Math.round(v.cleanliness)} %). Planifiez un nettoyage (à la main ou en station).`, 'orange');
          if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') window.ProtecNotifications.recordNotification({ title: '🧽 Véhicule à nettoyer', message: `${v.name} : propreté ${Math.round(v.cleanliness)} %.`, category: 'logistique', color: 'amber' });
        } else if (v.cleanliness > 60) v._dirtyWarned = false;
        // Départ en mission d'un véhicule très sale : image de l'antenne écornée
        if (MOVING.includes(v.status)) {
          if (v.cleanliness < 20 && !v._dirtyPenalized) {
            v._dirtyPenalized = true;
            if (game.resources) game.resources.reputationScore = Math.max(0, (game.resources.reputationScore || 0) - 2);
            if (game.showToast) game.showToast('Image de l’antenne ⚠️', `${v.name} est parti en mission très sale (${Math.round(v.cleanliness)} %) : -2 réputation.`, 'orange');
          }
        } else if (v._dirtyPenalized && ['dispo', 'disponible', 'base'].includes(v.status)) v._dirtyPenalized = false;
      });
    },

    // ---------- Interface : création ----------
    openCreateModal(game, preset = {}) {
      game = game || window.game;
      this._preset = preset;
      const picks = {};
      (preset.tasks || []).forEach(k => { if (preset.vehicleId) picks[`${preset.vehicleId}|${k}`] = k === 'kit_load' ? (preset.kitId || 'dps') : true; });
      this._picks = picks;
      this._startTs = this.defaultStart(game, 30);
      this._usePending = !!preset.usePending;
      this.renderCreate(game);
    },

    modalShell(id, inner) {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.className = 'fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4';
        el.style.cssText = 'position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;';
        el.addEventListener('click', (e) => { if (e.target === el) el.remove(); });
        document.body.appendChild(el);
      }
      el.innerHTML = `<div class="w-full max-w-3xl rounded-3xl glass-panel-heavy border border-white/80 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-slate-900">${inner}</div>`;
      if (window.lucide) window.lucide.createIcons();
      return el;
    },

    picksToList() {
      return Object.entries(this._picks || {}).filter(([, v]) => v).map(([k, v]) => { const [vehicleId, kind] = k.split('|'); return { vehicleId, kind, kitId: kind === 'kit_load' ? v : null }; });
    },

    togglePick(vehId, kind, value) {
      const k = `${vehId}|${kind}`;
      const p = this._picks || (this._picks = {});
      if (value !== undefined) p[k] = value; else p[k] = !p[k];
      // Exclusions : lavage main / station ; chargement / déchargement
      if (p[k]) {
        if (kind === 'wash_hand') delete p[`${vehId}|wash_station`];
        if (kind === 'wash_station') delete p[`${vehId}|wash_hand`];
      }
      this.renderCreate(window.game);
    },

    setStart(val) {
      const ts = new Date(val).getTime();
      if (isFinite(ts)) this._startTs = ts;
      this.renderCreate(window.game, true);
    },

    gauge(label, pct, color) {
      pct = Math.round(clamp(Number(pct) || 0, 0, 100));
      return `<div class="flex items-center gap-1.5 text-[10px] font-bold text-slate-500" title="${label} ${pct} %"><span class="w-14">${label}</span><div class="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%;background:${color}"></div></div><span class="w-8 text-right font-mono text-slate-700">${pct}%</span></div>`;
    },
    gaugeColor(p) { return p >= 70 ? '#16a34a' : p >= 40 ? '#f59e0b' : '#dc2626'; },

    renderCreate(game, keepScroll) {
      const vehs = this.stationVehicles(game);
      const picks = this.picksToList();
      const avail = this.rearmAvailability(game);
      const rearmCount = picks.filter(p => p.kind === 'rearm').length;
      const tasks = this.buildTasks(game, picks);
      const cost = tasks.reduce((s, t) => s + t.cost, 0);
      const work = tasks.reduce((s, t) => s + t.work, 0);
      const est = (n) => tasks.length ? this.estimate(game, tasks, n) : 0;
      const d = new Date(this._startTs);
      const pad = (x) => String(x).padStart(2, '0');
      const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const chip = (veh, kind, label, extra = '', disabled = false, title = '') => {
        const on = !!(this._picks || {})[`${veh.id}|${kind}`];
        return `<button type="button" ${disabled ? 'disabled' : ''} title="${esc(title)}" onclick="window.ProtecMissionsLog.togglePick('${veh.id}','${kind}')" class="px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition ${on ? 'bg-pc-blue text-white border-pc-blue' : disabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-300 hover:border-pc-blue hover:text-pc-blue cursor-pointer'}">${label}${extra}</button>`;
      };
      const kits = window.ProtecCriseLogistique && window.ProtecCriseLogistique.LOG_KITS ? Object.values(window.ProtecCriseLogistique.LOG_KITS) : [];
      const rows = vehs.map(veh => {
        const away = AWAY.includes(veh.status);
        const busy = this.findOpenMissionForVehicle(game, veh.id);
        const arm = this.armLevel(veh), cl = this.clean(veh), fu = typeof veh.fuel === 'number' ? veh.fuel : 100;
        const kitOn = (this._picks || {})[`${veh.id}|kit_load`];
        const isLog = /VTU|LOG|VTP|FOURGON|VALOG|FLIT/.test(`${veh.type} ${veh.name}`.toUpperCase()) || veh.logKit;
        const noRearmStock = avail.stock + avail.pend <= rearmCount && !(this._picks || {})[`${veh.id}|rearm`];
        return `<div class="p-3 rounded-2xl border border-slate-200 bg-white space-y-2 ${away ? 'opacity-70' : ''}">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="font-black text-sm">${esc(veh.name || veh.type)} <span class="text-[10px] text-slate-400 font-bold">${esc(veh.type || '')}${away ? ' · hors base actuellement' : ''}${busy ? ' · déjà dans une mission logistique' : ''}</span></div>
            ${veh.logKit ? `<span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">📦 ${esc(this.kitName(veh.logKit))}</span>` : ''}
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">${this.gauge('Armement', arm, this.gaugeColor(arm))}${this.gauge('Propreté', cl, this.gaugeColor(cl))}${this.gauge('Carburant', fu, this.gaugeColor(fu))}</div>
          <div class="flex flex-wrap gap-1.5">
            ${chip(veh, 'rearm', '🧰 Réarmement', ` · ${this.taskMinutes('rearm', veh)} min`, noRearmStock, noRearmStock ? 'Aucune caisse de réarmement disponible' : '')}
            ${chip(veh, 'wash_hand', '🧽 Nettoyage à la main', ` · ${this.taskMinutes('wash_hand', veh)} min`)}
            ${chip(veh, 'wash_station', '🚿 Station de lavage', ` · ${this.washPrice(veh)} €`)}
            ${chip(veh, 'fuel', '⛽ Plein', ` · ${this.fuelCost(veh)} €`, fu >= 99, fu >= 99 ? 'Réservoir déjà plein' : '')}
            ${isLog ? (veh.logKit ? chip(veh, 'kit_unload', '📤 Décharger le kit', ' · 15 min') : `<select onchange="window.ProtecMissionsLog.togglePick('${veh.id}','kit_load', this.value || false)" class="px-2 py-1.5 rounded-xl text-[11px] font-black border ${kitOn ? 'bg-pc-blue text-white border-pc-blue' : 'bg-white text-slate-700 border-slate-300'}"><option value="">📦 Charger un kit…</option>${kits.map(k => `<option value="${esc(k.id)}" ${kitOn === k.id ? 'selected' : ''}>${esc(k.shortName || k.name)}</option>`).join('')}</select>`) : ''}
          </div>
        </div>`;
      }).join('');
      const html = `
        <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2.5"><span class="text-2xl">📦</span><div><h3 class="text-base font-black">Nouvelle mission logistique</h3><p class="text-[11px] text-slate-500 font-semibold">Combinez plusieurs tâches sur un ou plusieurs véhicules, et choisissez l'heure de début.</p></div></div>
          <button type="button" onclick="document.getElementById('ml-create-modal').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-black">✕</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 block"><span class="text-[10px] font-black uppercase text-slate-500">Début de la mission</span>
            <input type="datetime-local" value="${local}" onchange="window.ProtecMissionsLog.setStart(this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-bold">
            <span class="text-[10px] text-slate-500 font-semibold block">Les bénévoles partent de chez eux pour être là à l'heure. Une inscription tardive décale l'arrivée du bénévole concerné.</span>
          </label>
          <div class="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-[11.5px] text-indigo-950 space-y-1">
            <div class="flex justify-between font-bold"><span>Tâches</span><b>${tasks.length}</b></div>
            <div class="flex justify-between font-bold"><span>Charge de travail à la base</span><b>${fmtMin(work)}</b></div>
            <div class="flex justify-between font-bold"><span>Frais (station, carburant)</span><b>${cost} €</b></div>
            ${tasks.length ? `<div class="pt-1 border-t border-indigo-200 font-bold">Durée estimée : 1 bénévole <b>${fmtMin(est(1))}</b> · 2 → <b>${fmtMin(est(2))}</b> · 3 → <b>${fmtMin(est(3))}</b></div>` : '<div class="text-indigo-700">Sélectionnez au moins une tâche.</div>'}
            <div class="text-[10px] text-indigo-700">Caisses de réarmement : ${avail.stock} en stock${avail.pend ? ` · ${avail.pend} commande(s) en route` : ''}.</div>
          </div>
        </div>
        <div class="space-y-2" id="ml-veh-list">${rows || '<div class="text-sm text-slate-500">Aucun véhicule à l’antenne.</div>'}</div>
        <div class="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button type="button" onclick="document.getElementById('ml-create-modal').remove()" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black">Annuler</button>
          <button type="button" ${tasks.length ? '' : 'disabled'} onclick="window.ProtecMissionsLog.submitCreate()" class="px-4 py-2.5 rounded-xl text-xs font-black text-white ${tasks.length ? 'bg-[#ff6600] hover:bg-[#e65c00]' : 'bg-slate-300 cursor-not-allowed'}">Planifier la mission${tasks.length ? ` (${dayLabel(this._startTs, game)} à ${hhmm(this._startTs)})` : ''}</button>
        </div>`;
      const prev = document.querySelector('#ml-create-modal > div');
      const top = prev ? prev.scrollTop : 0;
      this.modalShell('ml-create-modal', html);
      const cur = document.querySelector('#ml-create-modal > div');
      if (cur && (keepScroll || prev)) cur.scrollTop = top;
    },

    submitCreate() {
      const game = window.game;
      const picks = this.picksToList();
      if (!picks.length) return;
      if (this._startTs < nowOf(game) - MIN) { if (game.showToast) game.showToast('Horaire invalide', 'Choisissez une heure de début à venir.', 'orange'); return; }
      const m = this.createMission(game, picks, this._startTs, { usePending: this._usePending });
      if (!m) return;
      const el = document.getElementById('ml-create-modal');
      if (el) el.remove();
      if (game.showToast) game.showToast('Mission logistique planifiée 📦', `Début ${dayLabel(m.plannedStartTs, game)} à ${hhmm(m.plannedStartTs)}. Inscrivez vos bénévoles.`, 'green');
      if (window.ProtecAudio && typeof window.ProtecAudio.playSuccessChime === 'function') window.ProtecAudio.playSuccessChime();
      this.openDetails(game, m.id);
    },

    async askCancel(missionId) {
      const game = window.game;
      let ok = true;
      if (window.ProtecDialog && typeof window.ProtecDialog.confirm === 'function') ok = await window.ProtecDialog.confirm('Annuler cette mission logistique ? Les caisses de réarmement réservées retournent en stock.', 'Annuler la mission', { confirmText: 'Annuler la mission', cancelText: 'Garder' });
      if (!ok) return;
      this.cancel(game, missionId);
      this.renderDetails(game);
    },

    // ---------- Interface : fiche de mission ----------
    openDetails(game, missionId) {
      this._detailsId = missionId;
      this.renderDetails(game || window.game);
    },
    refreshOpenDetails(game) {
      if (!this._detailsId || !document.getElementById('ml-details-modal')) return;
      if (this._lastRefresh && Date.now() - this._lastRefresh < 2000) return;
      const active = document.activeElement;
      if (active && active.closest && active.closest('#ml-details-modal') && active.tagName === 'INPUT') return;
      this.renderDetails(game);
    },

    renderDetails(game) {
      this._lastRefresh = Date.now();
      const m = (game.missions || []).find(x => x.id === this._detailsId);
      if (!m) return;
      const now = nowOf(game);
      const vols = game.volunteers || [];
      const vehs = this.stationVehicles(game);
      const present = this.presentIds(game, m, now);
      const statusBadge = { planifie: ['Planifiée', 'bg-blue-50 text-blue-700 border-blue-200'], ongoing: ['En cours', 'bg-amber-50 text-amber-700 border-amber-300'], completed: ['Terminée', 'bg-emerald-50 text-emerald-700 border-emerald-200'], canceled: ['Annulée', 'bg-slate-100 text-slate-500 border-slate-200'] }[m.status] || [m.status, 'bg-slate-100'];
      const n = Math.max(1, (m.registeredVolunteers || []).length);
      const left = (m.tasks || []).map(t => ({ ...t, work: Math.max(0, t.work - t.done) })).filter(t => t.status !== 'done' && t.status !== 'skipped');
      const estLeft = left.length ? this.estimate(game, left, Math.max(1, m.status === 'ongoing' ? present.length || n : n)) : 0;
      const startRef = m.status === 'ongoing' ? now : Math.max(now, m.plannedStartTs);
      const byVeh = {};
      (m.tasks || []).forEach(t => { (byVeh[t.vehicleId] = byVeh[t.vehicleId] || []).push(t); });
      const taskHtml = Object.entries(byVeh).map(([vid, ts]) => {
        const veh = vehs.find(v => v.id === vid) || {};
        const trip = m.trips && m.trips[vid];
        const workers = Object.entries(m.workers || {}).filter(([, w]) => w.vehicleId === vid).map(([id]) => (vols.find(v => v.id === id) || {}).name).filter(Boolean);
        return `<div class="p-3 rounded-2xl bg-white border border-slate-200 space-y-1.5">
          <div class="flex items-center justify-between gap-2"><b class="text-sm">${esc(veh.name || ts[0].vehicleName)}</b><span class="text-[10px] font-bold text-slate-500">${trip ? `🚐 En station — retour vers ${hhmm(trip.endsAt)}` : workers.length ? `👷 ${esc(workers.join(', '))}` : ''}</span></div>
          ${ts.map(t => {
            const pct = t.status === 'done' ? 100 : EXTERNAL.includes(t.kind) ? (trip ? Math.round(clamp((now - trip.startedAt) / (trip.endsAt - trip.startedAt), 0, 1) * 100) : 0) : Math.round(t.done / Math.max(1, t.work) * 100);
            const label = `${TASKS[t.kind].icon} ${TASKS[t.kind].label}${t.kind === 'kit_load' ? ' (' + esc(this.kitName(t.kitId)) + ')' : ''}`;
            const info = EXTERNAL.includes(t.kind) ? `${t.kind === 'fuel' && t.status !== 'done' ? this.fuelCost(veh) : t.cost} €` : fmtMin(t.work);
            return `<div class="text-[11px]"><div class="flex justify-between font-bold"><span>${label}</span><span class="text-slate-500">${t.status === 'skipped' ? `annulé (${esc(t.reason || '')})` : info}</span></div><div class="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-0.5"><div class="h-full ${t.status === 'done' ? 'bg-emerald-500' : 'bg-pc-blue'}" style="width:${pct}%"></div></div></div>`;
          }).join('')}
        </div>`;
      }).join('');
      const volRow = (id) => {
        const v = vols.find(x => x.id === id); if (!v) return '';
        const arr = this.arrivalTs(game, m, id);
        const late = Math.max(0, Math.round((arr - m.plannedStartTs) / MIN));
        const driving = m.trips && Object.values(m.trips).some(t => t.driverId === id);
        let st;
        if (driving) st = '<span class="text-sky-700">🚐 Au volant (station)</span>';
        else if (present.includes(id)) st = `<span class="text-emerald-700">✅ Sur place${m.workers && m.workers[id] ? ` · ${TASKS[m.workers[id].kind] ? TASKS[m.workers[id].kind].label.toLowerCase() : ''}` : ''}</span>`;
        else if (m.departed && m.departed[id]) st = `<span class="text-amber-700">🚗 En route · arrivée ${hhmm(arr)}</span>`;
        else st = `<span class="text-slate-500">Départ du domicile à ${hhmm(arr - this.rally(game, v) * MIN)} · arrivée ${hhmm(arr)}</span>`;
        return `<div class="flex items-center justify-between gap-2 py-1.5 border-t border-dashed border-slate-200 text-[11.5px]"><div class="min-w-0"><b>${esc(v.name)}</b> <span class="text-slate-400">· ${esc(v.rank || '')} · trajet ${this.rally(game, v)} min</span><div class="font-bold">${st}${late > 0 && m.status === 'planifie' ? ` <span class="text-orange-600">(+${late} min après le début)</span>` : ''}</div></div>${m.status !== 'completed' && m.status !== 'canceled' && !driving ? `<button type="button" onclick="window.ProtecMissionsLog.unregister(window.game,'${m.id}','${id}'); window.ProtecMissionsLog.renderDetails(window.game)" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 text-[10px] font-black">Retirer</button>` : ''}</div>`;
      };
      const candidates = vols.filter(v => !(m.registeredVolunteers || []).includes(v.id) && (!v.status || v.status === 'dispo' || v.status === 'disponible') && (!v.stationId || !m.stationId || v.stationId === m.stationId))
        .map(v => ({ v, arr: Math.max(m.status === 'ongoing' ? now : m.plannedStartTs, now + this.rally(game, v) * MIN) }))
        .sort((a, b) => a.arr - b.arr).slice(0, 12);
      const d = new Date(m.plannedStartTs);
      const pad = (x) => String(x).padStart(2, '0');
      const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      const open = this.isOpen(m);
      const html = `
        <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2.5 min-w-0"><span class="text-2xl">📦</span><div class="min-w-0"><div class="flex items-center gap-2 flex-wrap"><h3 class="text-base font-black">${esc(m.title)}</h3><span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadge[1]}">${statusBadge[0]}</span></div>
            <p class="text-[11px] text-slate-500 font-semibold">Mission à la base · ${m.status === 'planifie' ? `début ${dayLabel(m.plannedStartTs, game)} à ${hhmm(m.plannedStartTs)}` : m.status === 'ongoing' ? `commencée à ${hhmm(m.startedAt)}` : m.completedAt ? `terminée à ${hhmm(m.completedAt)}` : ''}${open && left.length ? ` · fin estimée vers ${hhmm(startRef + estLeft * MIN)} (${fmtMin(estLeft)} avec ${m.status === 'ongoing' ? Math.max(1, present.length) : n} bénévole${n > 1 ? 's' : ''})` : ''}</p></div></div>
          <button type="button" onclick="document.getElementById('ml-details-modal').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-black flex-shrink-0">✕</button>
        </div>
        ${m.status === 'planifie' ? `<div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-[11.5px] font-bold"><span>🕑 Début :</span><input type="datetime-local" value="${local}" id="ml-resched" class="px-2 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"><button type="button" onclick="window.ProtecMissionsLog.reschedule(window.game,'${m.id}', new Date(document.getElementById('ml-resched').value).getTime()); window.ProtecMissionsLog.renderDetails(window.game)" class="px-3 py-1.5 rounded-xl bg-pc-blue text-white text-[11px] font-black">Modifier</button>${!(m.registeredVolunteers || []).length ? '<span class="text-orange-600">⚠️ Aucun bénévole inscrit : la mission ne démarrera pas sans au moins un bénévole sur place.</span>' : ''}</div>` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="space-y-2"><div class="text-[10px] font-black uppercase text-slate-500">Tâches</div>${taskHtml}</div>
          <div class="space-y-2">
            <div class="p-3 rounded-2xl bg-white border border-slate-200"><div class="text-[10px] font-black uppercase text-slate-500 mb-1">Bénévoles inscrits (${(m.registeredVolunteers || []).length}/${m.maxVolunteers})</div>${(m.registeredVolunteers || []).map(volRow).join('') || '<div class="text-[11.5px] text-slate-500">Personne pour l’instant.</div>'}</div>
            ${open ? `<div class="p-3 rounded-2xl bg-white border border-slate-200"><div class="text-[10px] font-black uppercase text-slate-500 mb-1">Inscrire un bénévole disponible</div>${candidates.map(({ v, arr }) => {
              const late = Math.max(0, Math.round((arr - m.plannedStartTs) / MIN));
              return `<div class="flex items-center justify-between gap-2 py-1.5 border-t border-dashed border-slate-200 text-[11.5px]"><div class="min-w-0"><b>${esc(v.name)}</b> <span class="text-slate-400">· ${esc(v.rank || '')}</span><div class="text-slate-500 font-semibold">Trajet ${this.rally(game, v)} min · arrivée ${hhmm(arr)}${late > 0 && m.status === 'planifie' ? ` <span class="text-orange-600">(+${late} min)</span>` : ''}</div></div><button type="button" onclick="window.ProtecMissionsLog.register(window.game,'${m.id}','${v.id}'); window.ProtecMissionsLog.renderDetails(window.game)" class="px-2.5 py-1 rounded-lg bg-pc-blue hover:brightness-110 text-white text-[10px] font-black">Inscrire</button></div>`;
            }).join('') || '<div class="text-[11.5px] text-slate-500">Aucun bénévole disponible.</div>'}</div>` : ''}
            <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200"><div class="text-[10px] font-black uppercase text-slate-500 mb-1">Journal</div>${(m.journal || []).slice(0, 8).map(j => `<div class="text-[11px] py-0.5"><span class="font-mono text-slate-400">${hhmm(j.ts)}</span> ${esc(j.text)}</div>`).join('')}</div>
          </div>
        </div>
        ${open ? `<div class="flex justify-between gap-2 pt-2 border-t border-slate-200"><button type="button" onclick="window.ProtecMissionsLog.askCancel('${m.id}')" class="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black border border-red-200">Annuler la mission</button><button type="button" onclick="document.getElementById('ml-details-modal').remove()" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black">Fermer</button></div>` : ''}`;
      const prev = document.querySelector('#ml-details-modal > div');
      const top = prev ? prev.scrollTop : 0;
      this.modalShell('ml-details-modal', html);
      const cur = document.querySelector('#ml-details-modal > div');
      if (cur) cur.scrollTop = top;
    }
  };

  window.ProtecMissionsLog = ML;
})();
