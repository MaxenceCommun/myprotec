/* =============================================================================
 * MyProtec – Réception des événements générés par le serveur (VPS) 24h/24
 * -----------------------------------------------------------------------------
 * Le serveur (js/server_events_engine.js) tire les crises, inter SAMU/SDIS,
 * demandes de DPS et candidatures pour tous les joueurs, jeu ouvert ou fermé,
 * et notifie le téléphone selon les réglages du joueur.
 *
 * Ce module :
 *   - calcule le « profil serveur » enregistré dans chaque sauvegarde (srvProfile) ;
 *   - récupère la boîte de réception du serveur (save_data.server_inbox) toutes les 5 s ;
 *   - construit chaque événement avec les générateurs habituels du jeu ;
 *   - signale au serveur que le jeu est ouvert (évite les notifications en double).
 * ============================================================================= */
(function () {
  'use strict';

  const POLL_MS = 5000;
  const HEARTBEAT_MS = 30000;
  const STATUS_TTL_MS = 24 * 3600 * 1000;
  const CONSUMED_KEY = 'protec_srv_inbox_consumed';
  const ENGINE_OK_KEY = 'protec_srv_engine_ok';

  const loadConsumed = () => {
    try { return new Set(JSON.parse(localStorage.getItem(CONSUMED_KEY) || '[]')); } catch (e) { return new Set(); }
  };

  const ProtecServerEvents = {
    consumed: loadConsumed(),
    _pollTimer: null,
    _hbTimer: null,
    _busy: false,
    _engineOk: false,

    // Moteur serveur joignable (ou l'a été dans les dernières 24 h) : le jeu ne tire plus rien localement
    isActive() {
      if (this._engineOk) return true;
      try {
        const ts = Number(localStorage.getItem(ENGINE_OK_KEY) || 0);
        return ts > 0 && (Date.now() - ts) < STATUS_TTL_MS;
      } catch (e) { return false; }
    },

    currentUserId() {
      let u = null;
      try { u = (window.ProtecAuth && window.ProtecAuth.currentUser) || JSON.parse(localStorage.getItem('protec_user_profile') || '{}'); } catch (e) { u = null; }
      return (u && u.id) || null;
    },

    init() {
      if (this._pollTimer) return;
      this.checkEngine();
      this._pollTimer = setInterval(() => this.poll(), POLL_MS);
      this._hbTimer = setInterval(() => this.heartbeat(), HEARTBEAT_MS);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { this.heartbeat(); this.poll(); } });
      setTimeout(() => { this.heartbeat(); this.poll(); }, 1500);
    },

    async checkEngine() {
      try {
        const r = await fetch('/api/events-engine/status', { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        if (j && j.engine && j.engine.active) {
          this._engineOk = true;
          try { localStorage.setItem(ENGINE_OK_KEY, String(Date.now())); } catch (e) { /* stockage indisponible */ }
        }
      } catch (e) { /* serveur injoignable : on garde le dernier état connu */ }
    },

    heartbeat() {
      if (document.visibilityState && document.visibilityState !== 'visible') return;
      const userId = this.currentUserId();
      if (!userId) return;
      fetch('/api/events-engine/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        keepalive: true
      }).catch(() => {});
    },

    // -------------------------------------------------------------------------
    // Profil serveur : tout ce dont le moteur a besoin pour tirer comme le jeu
    // -------------------------------------------------------------------------
    buildProfile(game) {
      if (!game) return null;
      const cfg = (k, d) => (window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get(k, d) : d);
      const missions = game.missions || [];
      const vehicles = game.vehicles || [];
      const now = Date.now();

      // Crises (canTriggerDailyCrisis + pool de conventions)
      const pool = [];
      if (game.aascConvention && game.aascConvention.signed) pool.push('aasc');
      if (game.sncfConvention && game.sncfConvention.signed) pool.push('sncf');
      if (game.cumpConvention && game.cumpConvention.signed && game.cumpConvention.normCompliant) pool.push('cump');
      const crisisActive = missions.some(m => m && (m.type === 'crise' || m.isCrisis || m.isEmergencyPlan) && ['prealerte', 'declenche', 'ongoing', 'planifie'].includes(m.status));

      // Gardes SAMU planifiées (fenêtres horaires réelles)
      const windows = [];
      missions.forEach(m => {
        if (!m || !(m.type === 'garde_samu' || (m.type === 'samu' && m.isGarde))) return;
        const dur = (Number(m.durationHours) || 6) * 3600 * 1000;
        if (m.status === 'ongoing') {
          const start = Number(m.startedAt || m.startTime || m.spawnedAt) || now;
          windows.push([Math.min(start, now), Math.max(start + dur, now + 15 * 60 * 1000), true]);
        } else if (m.status === 'planifie' && m.eventDate) {
          const ed = m.eventDate;
          const start = new Date(ed.year, ed.month, ed.day, ed.hour || 0, ed.minute || 0).getTime();
          if (isFinite(start) && start + dur > now) windows.push([start, start + dur, true]);
        }
      });
      const vpspOk = (v) => v && v.type === 'VPSP' && !v.isBrokenDown && !v.isUnavailable && !v.isUnderRepair;
      const activeSamu = missions.filter(m => m && (m.type === 'samu' || m.type === 'garde_samu') && !m.isRenfort && !m.isGarde && ['ongoing', 'transit', 'sur_place', 'transport_chu', 'retour_base', 'planifie'].includes(m.status)).length;
      const posture = game.samuGarde && game.samuGarde.mode === 'poste' ? 'base' : 'domicile';
      const req = (game.samuConvention && game.samuConvention.requirements) || {};
      const activeSdis = missions.filter(m => m && m.type === 'pompiers' && !m.isRenfort && !m.isGarde && (m.status === 'ongoing' || m.status === 'planifie')).length;

      // Demandes de DPS (bloc 4 de la boucle de simulation)
      const completedDps = missions.filter(m => m && m.type === 'dps' && m.status === 'completed').length;
      const vols = (game.volunteers || []).length;
      const rep = (game.resources && game.resources.reputationScore) || 0;
      let notoriety = 0.18, cooldownH = 3.5;
      if (completedDps >= 30 && rep >= 150) { notoriety = 1.0; cooldownH = 1; }
      else if (completedDps >= 12 && rep >= 70) { notoriety = 0.60; cooldownH = 2; }
      else if (completedDps >= 4 && rep >= 35) { notoriety = 0.35; cooldownH = 2.5; }
      let devisLastTs = 0;
      if (game.clock && game._lastDevisReceivedTotalHours) {
        const c = game.clock;
        const curHours = (c.year * 8760) + (c.month * 720) + (c.day * 24) + (c.hour || 0);
        const since = curHours - game._lastDevisReceivedTotalHours;
        if (since >= 0 && since < 24 * 365) devisLastTs = now - since * 3600 * 1000;
      }
      const reviews = (window.ProtecCommunication && typeof window.ProtecCommunication.getReviewsStats === 'function') ? window.ProtecCommunication.getReviewsStats(game) : { average: 4.8 };
      const campaign = !!((game.commData && game.commData.activeCampaign && game.commData.activeCampaign.subjectId === 'dps') || (game.resources && game.resources.campaigns && (game.resources.campaigns.social || game.resources.campaigns.posters)));
      const cfgMaxDevis = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('maxSimultaneousPendingDevis', 6) : null;
      const maxDevis = cfgMaxDevis !== null ? cfgMaxDevis : (typeof game.getSimultaneousDevisLimit === 'function' ? game.getSimultaneousDevisLimit() : 0);
      const website = game.antenneWebsite || null;

      // Candidatures (bloc 5)
      const cap = typeof game.getDailyRecruitmentCap === 'function' ? game.getDailyRecruitmentCap() : null;
      let candBonus = 0;
      if (game.commData && game.commData.activeCampaign && game.commData.activeCampaign.subjectId === 'recrutement') candBonus += 0.06;
      if (game.resources && game.resources.campaigns && game.resources.campaigns.social) candBonus += 0.03;
      if (game.resources && game.resources.campaigns && game.resources.campaigns.posters) candBonus += 0.02;
      const dcs = game.dailyCandidatureStats || {};

      const notifCfg = (window.ProtecNotifications && window.ProtecNotifications.config) || null;

      return {
        v: 1,
        savedAt: now,
        stationsCount: (game.stations || []).length,
        deptCode: String((game.stations && game.stations[0] && game.stations[0].departmentCode) || (game.player && game.player.departmentCode) || ''),
        notif: notifCfg ? { enabled: notifCfg.enabled !== false, alertModes: Object.assign({}, notifCfg.alertModes || {}) } : null,
        crisis: { pool, mult: cfg('criseChanceMultiplier', 1.0), lastDay: game.lastCrisisCalendarDay || null, lastTs: game.lastCrisisTimestamp || 0, active: crisisActive },
        samu: {
          signed: !!(game.samuConvention && game.samuConvention.signed),
          windows,
          legacyActive: !!(game.samuGarde && game.samuGarde.active),
          vpsp: vehicles.filter(vpspOk).length,
          activeCount: activeSamu,
          chance: cfg('samuEmergencyChance', 0.28),
          maxResp: posture === 'domicile' ? (req.maxDepartureHomeMinutes || 12) : (req.maxDepartureBaseMinutes || 3)
        },
        sdis: {
          active: !!(game.sdisGarde && game.sdisGarde.active),
          severity: (game.sdisGarde && game.sdisGarde.eventSeverity) || null,
          chanceNormal: cfg('sdisEmergencyChanceNormal', 0.20),
          chanceHigh: cfg('sdisEmergencyChanceHigh', 0.35),
          activeCount: activeSdis
        },
        devis: {
          max: maxDevis,
          pending: (game.devis || []).filter(d => d && d.status === 'pending').length,
          notoriety, cooldownH, lastTs: devisLastTs,
          freshness: website ? (website.freshness !== undefined ? website.freshness : 85) : 85,
          autopilot: !!(website && website.autoPilotSalarieId),
          reviewsOk: (reviews && reviews.average >= 4.7) || false,
          volunteers: vols, completedDps, campaign,
          socialVis: (game.socialMedia && game.socialMedia.visibilityScore !== undefined) ? game.socialMedia.visibilityScore : 75,
          mult: cfg('dpsRequestBaseChanceMultiplier', 1.0)
        },
        cand: cap ? {
          cap: { maxPerDay: cap.maxPerDay, minIntervalHours: cap.minIntervalHours, hourlyBaseChance: cap.hourlyBaseChance, tier: cap.tier },
          bonus: candBonus,
          mult: cfg('candidatureChanceMultiplier', 1.0),
          todayKey: dcs.date || null,
          todayCount: dcs.count || 0,
          lastTs: dcs.lastSpawnTimestamp || 0,
          pending: (game.candidatures || []).filter(c => c && c.status !== 'rejected').length
        } : null
      };
    },

    // Fusion à la sauvegarde : on conserve les événements serveur pas encore récupérés
    filterInboxForSave(inbox) {
      if (!Array.isArray(inbox)) return [];
      return inbox.filter(e => e && e.id && !this.consumed.has(e.id));
    },

    // -------------------------------------------------------------------------
    // Récupération et construction des événements
    // -------------------------------------------------------------------------
    async poll() {
      if (this._busy) return;
      const game = window.game;
      const supa = window.ProtecSupabase && window.ProtecSupabase.client;
      const userId = this.currentUserId();
      if (!game || !supa || !userId || !Array.isArray(game.stations) || !game.stations.length) return;
      this._busy = true;
      try {
        const { data, error } = await supa.from('game_saves').select('inbox:save_data->server_inbox').eq('user_id', userId).maybeSingle();
        if (error || !data) return;
        const inbox = Array.isArray(data.inbox) ? data.inbox : [];
        if (inbox.length && !this._engineOk) {
          this._engineOk = true;
          try { localStorage.setItem(ENGINE_OK_KEY, String(Date.now())); } catch (e) { /* stockage indisponible */ }
        }
        const fresh = inbox.filter(e => e && e.id && !this.consumed.has(e.id)).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        if (!fresh.length) return;
        for (const ev of fresh) {
          try { await this.materialize(game, ev); } catch (e) { console.warn('[Événements serveur] Construction impossible', ev, e); }
          this.consumed.add(ev.id);
        }
        try { localStorage.setItem(CONSUMED_KEY, JSON.stringify([...this.consumed].slice(-300))); } catch (e) { /* stockage indisponible */ }
        if (typeof game.saveGame === 'function') game.saveGame();
      } catch (e) {
        /* réseau indisponible : nouvel essai au prochain passage */
      } finally {
        this._busy = false;
      }
    },

    async materialize(game, ev) {
      const opts = { fromServer: true, at: Number(ev.createdAt) || Date.now(), serverEventId: ev.id };
      switch (ev.type) {
        case 'crise':
          if (ev.kind === 'cump' && window.ProtecCump && typeof window.ProtecCump.triggerCumpAlert === 'function') {
            window.ProtecCump.triggerCumpAlert(game, opts);
          } else if (typeof game.triggerAascPrealert === 'function') {
            await game.triggerAascPrealert(ev.kind === 'sncf' ? 'sncf' : null, opts);
          }
          break;
        case 'samu':
          if (typeof game.triggerRandomSamuEmergency === 'function') game.triggerRandomSamuEmergency(Object.assign(opts, { maxResponseMinutes: ev.maxResponseMinutes }));
          break;
        case 'sdis':
          if (typeof game.triggerRandomSdisEmergency === 'function') game.triggerRandomSdisEmergency(opts);
          break;
        case 'devis':
          if (typeof game.generateRandomDevisOpportunity === 'function') game.generateRandomDevisOpportunity(opts);
          break;
        case 'candidature':
          if (typeof game.generateRandomCandidature === 'function') game.generateRandomCandidature(true);
          break;
        default:
          break;
      }
    }
  };

  window.ProtecServerEvents = ProtecServerEvents;
  // Démarrage dès que le jeu est prêt
  const boot = setInterval(() => {
    if (window.game && window.ProtecSupabase) { clearInterval(boot); ProtecServerEvents.init(); }
  }, 1000);
})();
