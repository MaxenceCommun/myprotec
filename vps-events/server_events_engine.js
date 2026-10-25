'use strict';
// =============================================================================
// MOTEUR D'ÉVÉNEMENTS SERVEUR 24h/24 (VPS)
// -----------------------------------------------------------------------------
// Source unique des événements du jeu, que le joueur soit connecté ou non :
//   - Crises (préalertes AASC / SNCF / CUMP)
//   - Interventions SAMU 15 et SDIS pendant les gardes actives
//   - Demandes de devis DPS
//   - Candidatures spontanées de bénévoles
// Les probabilités reprennent exactement les règles du jeu (app.js).
//
// Fonctionnement :
//   1. Chaque sauvegarde du jeu contient un « profil serveur » (save_data.srvProfile)
//      calculé par le navigateur : conventions, gardes planifiées, notoriété,
//      plafonds, réglages de notifications…
//   2. Toutes les minutes, le moteur lit ces profils dans Supabase et effectue les tirages.
//   3. Un événement tiré est déposé dans save_data.server_inbox ; le jeu le récupère
//      (toutes les 5 s s'il est ouvert, sinon à l'ouverture) et le construit avec ses
//      générateurs habituels.
//   4. Si le joueur n'a pas le jeu ouvert, une notification est ajoutée à
//      save_data.pending_notifications selon ses réglages ; la passerelle Cloud Push
//      existante (server.js) l'envoie sur son téléphone dans la seconde.
// =============================================================================

const fs = require('fs');
const path = require('path');

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const PARIS_TZ = 'Europe/Paris';

const DEFAULTS = {
  tickMs: 60 * 1000,
  onlineWindowMs: 45 * 1000,          // Joueur considéré « jeu ouvert » si battement < 45 s
  inactiveAfterMs: 14 * 24 * HOUR,    // Plus d'événements pour un compte sans sauvegarde depuis 14 jours
  maxCatchUpMinutes: 5,               // Après une coupure du serveur, pas de rafale d'événements
  samuBusyMs: 75 * MIN,               // Durée d'engagement estimée du VPSP de garde après une inter
  sdisBusyMs: 60 * MIN,
  inboxMax: 60,
  pendingNotifMax: 20
};

// ---------------------------------------------------------------------------
// Outils temps (heure de Paris, identique à l'horloge du jeu)
// ---------------------------------------------------------------------------
let PARIS_FMT = null;
function parisParts(ts) {
  const fmt = PARIS_FMT || (PARIS_FMT = new Intl.DateTimeFormat('fr-FR', {
    timeZone: PARIS_TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
  }));
  const out = {};
  fmt.formatToParts(new Date(ts)).forEach(p => { if (p.type !== 'literal') out[p.type] = Number(p.value); });
  const weekday = new Date(Date.UTC(out.year, out.month - 1, out.day)).getUTCDay();
  return { year: out.year, month: out.month - 1, day: out.day, hour: out.hour % 24, minute: out.minute, weekday };
}
// Même clé que app.js (lastCrisisCalendarDay = `${year}-${month}-${day}`, mois 0-11)
function crisisDayKey(ts) { const p = parisParts(ts); return `${p.year}-${p.month}-${p.day}`; }
// Même clé que canSpawnSpontaneousCandidate (date UTC ISO)
function utcDayKey(ts) { return new Date(ts).toISOString().slice(0, 10); }
// Créneau de 30 min (minute 0 et 30 heure de Paris)
function halfHourSlot(ts) { return Math.floor(ts / (30 * MIN)); }
function hourSlot(ts) { return Math.floor(ts / HOUR); }

function probOver(pPerDraw, draws) {
  if (!(pPerDraw > 0) || !(draws > 0)) return 0;
  return 1 - Math.pow(1 - Math.min(1, pPerDraw), draws);
}

// ---------------------------------------------------------------------------
// Règles de tirage (copie fidèle des règles d'app.js)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Modèle réaliste (validé le 25/10/2026) : volumes mensuels hors saison haute
//   Demandes DPS / mois  : débutante 0-2 · en développement 3-8 · grosse 15-30
//   Candidatures / mois  : débutante 0-2 · en développement 3-6 · grosse 8-15
//   Antenne totalement inconnue : ~1 DPS tous les 2-3 mois, ~1 candidature / mois
// Rythmes : saisonnalité, heures de bureau, jours ouvrés, rentrée, bouche-à-oreille.
// ---------------------------------------------------------------------------
const MINUTES_PER_MONTH = 30 * 24 * 60;
const normalize = (arr) => { const m = arr.reduce((a, b) => a + b, 0) / arr.length; return arr.map(v => v / m); };
const REALISM = {
  // Saisonnalité (index = mois 0-11) : base 1 = mars / octobre (« hors saison haute »)
  seasonDps: [0.6, 0.7, 0.9, 1.3, 1.6, 1.8, 1.7, 1.3, 1.4, 1.0, 0.7, 1.0],
  seasonCand: [1.2, 1.0, 1.0, 1.0, 1.0, 0.9, 0.6, 0.5, 1.8, 1.4, 1.0, 0.8],
  // Heures de Paris : les organisateurs écrivent en journée, les candidats aussi le soir
  hourDps: normalize([0.03, 0.02, 0.02, 0.02, 0.02, 0.05, 0.15, 0.5, 1.6, 2.0, 2.0, 1.9, 0.9, 1.0, 1.9, 2.0, 1.9, 1.6, 1.0, 0.7, 0.5, 0.35, 0.2, 0.08]),
  hourCand: normalize([0.08, 0.04, 0.03, 0.03, 0.03, 0.05, 0.15, 0.4, 0.8, 1.1, 1.2, 1.2, 1.5, 1.4, 1.1, 1.1, 1.2, 1.4, 1.7, 1.9, 1.9, 1.6, 1.0, 0.4]),
  // Jours (0 = dimanche) : peu de demandes de devis le week-end
  dayDps: normalize([0.3, 1.25, 1.25, 1.2, 1.2, 1.1, 0.5]),
  dayCand: normalize([1.0, 1.05, 1.0, 1.0, 1.0, 0.95, 0.9]),
  minGapDevisMs: 2 * HOUR,

  // Demandes DPS par mois (hors saisonnalité)
  dpsMonthly(d, freshness) {
    if (d.unknown) return 0.4 * (Number(d.mult) || 1);
    let r = 0.3;                                                         // présence minimale (annuaire, mairie)
    if (d.sitePublished) r += 0.8 * Math.max(0, Math.min(100, freshness)) / 100;       // site internet à jour
    if ((Number(d.reviewsCount) || 0) >= 3) r += Math.max(0, Math.min(2.2, ((Number(d.reviewsAvg) || 0) - 3.5) * 1.5)); // avis organisateurs
    r += Math.min(6, (Number(d.completedLast90) || 0) * 0.35);           // bouche-à-oreille récent
    r += Math.min(8, (Number(d.completedTotal) || 0) * 0.12);            // références accumulées
    r += Math.min(6, Math.max(0, Number(d.rep) || 0) / 40);              // réputation
    r += Math.min(1.5, Math.max(0, Number(d.socialVis) || 0) / 100 * 1.5); // réseaux sociaux
    r += Math.min(3, (Number(d.volunteers) || 0) / 12);                  // capacité : les organisateurs préfèrent les antennes étoffées
    if (d.campaign) r += 2;                                              // campagne ciblée DPS en cours
    return r * (Number(d.mult) || 1);
  },
  // Candidatures par mois (hors saisonnalité)
  candMonthly(c, freshness) {
    if (c.unknown) return 1.0 * (Number(c.mult) || 1);
    let r = 0.5;
    if (c.sitePublished) r += 0.6 * Math.max(0, Math.min(100, freshness)) / 100;
    r += Math.min(4, Math.max(0, Number(c.rep) || 0) / 50);
    r += Math.min(3, (Number(c.completedTotal) || 0) * 0.08);             // visibilité terrain (DPS assurés)
    r += Math.min(2, Math.max(0, Number(c.socialVis) || 0) / 100 * 2);
    r += Math.min(2, (Number(c.volunteers) || 0) / 20);
    r += Math.min(4, (Number(c.psc1Last30) || 0) * 1.0);                  // stagiaires PSC1 qui veulent s'engager
    if (c.campaign) r += 3;                                              // campagne de recrutement
    return r * (Number(c.mult) || 1);
  }
};

const RULES = {
  // 3d. Crises : test toutes les 10 s, probabilité divisée par 2 de 01h à 07h
  crisisChancePer10s(hour, mult) {
    const isNight = hour >= 1 && hour < 7;
    return (isNight ? 0.00003378 : 0.00006757) * (mult || 1);
  },
  // 4. Demandes de DPS : tirage à chaque créneau de 30 min
  devisChance(d, freshness) {
    const n = Number(d.notoriety) || 0.18;
    let c = 0.04 * n;
    if (freshness >= 80) c += 0.08 * n;
    else if (freshness >= 50) c += 0.04 * n;
    else if (freshness < 30) c *= 0.5;
    if (d.reviewsOk) c += 0.04 * n;
    const vols = Number(d.volunteers) || 0;
    if (vols >= 30) c += 0.05 * n; else if (vols >= 15) c += 0.03 * n;
    const done = Number(d.completedDps) || 0;
    if (done >= 15) c += 0.05 * n; else if (done >= 5) c += 0.03 * n;
    if (d.campaign) c += 0.18 * Math.max(0.40, n);
    if ((d.socialVis === undefined ? 75 : d.socialVis) >= 75) c += 0.04 * n;
    return c * (Number(d.mult) || 1);
  },
  // 5. Candidatures : tirage toutes les heures (minute 0)
  candidatureChance(c) {
    const base = (c.cap && c.cap.hourlyBaseChance) || 0.04;
    return (base + (Number(c.bonus) || 0)) * (Number(c.mult) || 1);
  },
  candidatureMaxPending(tier) { return tier === 'large' ? 4 : (tier === 'growing' ? 3 : 2); }
};

// Libellés des notifications (contenu : catégorie + délai)
const CRISIS_LABELS = {
  aasc: 'Préfecture (convention AASC)',
  sncf: 'SNCF (convention d’assistance)',
  cump: 'CUMP (soutien psychologique)'
};

function notifFor(ev) {
  switch (ev.type) {
    case 'crise':
      return {
        category: 'crise',
        title: `⚠️ PRÉALERTE CRISE – ${CRISIS_LABELS[ev.kind] || 'Autorité'}`,
        body: 'Votre antenne est placée en veille opérationnelle. Ouvrez MyProtec pour prendre la main sur le dispositif.'
      };
    case 'samu':
      return {
        category: 'samu',
        title: '🚑 INTER SAMU 15 – Départ réflexe',
        body: `La régulation demande un départ réflexe de votre VPSP de garde. Délai de départ : ${ev.maxResponseMinutes || 12} min.`
      };
    case 'sdis':
      return {
        category: 'sdis',
        title: '🚒 INTER SDIS – Départ réflexe caserne',
        body: 'Le CODIS engage votre VPSP de garde. Délai de départ : 3 min.'
      };
    case 'devis':
      return {
        category: 'dps',
        title: '📋 Nouvelle demande de DPS',
        body: 'Un organisateur sollicite un devis de poste de secours. À étudier dans le module Devis.'
      };
    case 'candidature':
      return {
        category: 'rh',
        title: '👤 Nouvelle candidature bénévole',
        body: 'Un citoyen souhaite rejoindre votre antenne. Consultez le module Ressources humaines.'
      };
    default:
      return null;
  }
}

// Réglages de notifications du joueur (miroir de ProtecNotifications.config)
function notifMode(cfg, category) {
  if (!cfg) return 'sound_notif';
  if (cfg.enabled === false) return 'off';
  const modes = cfg.alertModes || {};
  if (modes[category] !== undefined) return modes[category];
  const legacy = cfg[`${category}Alerts`];
  if (legacy !== undefined) return legacy ? 'sound_notif' : 'off';
  return 'sound_notif';
}

// Une garde planifiée couvre-t-elle l'instant ts ?
function inWindows(windows, ts) {
  return (windows || []).some(w => Array.isArray(w) ? (ts >= w[0] && ts < w[1] && w[2] !== false) : (w && ts >= w.start && ts < w.end && w.crewOk !== false));
}

// ---------------------------------------------------------------------------
// Tirages d'un joueur pour un pas de temps
// ---------------------------------------------------------------------------
function drawForPlayer(prof, st, inbox, now, prevTs, opts, rnd) {
  const events = [];
  const R = rnd || Math.random;
  const minutes = Math.max(0, Math.min(opts.maxCatchUpMinutes, (now - prevTs) / MIN));
  if (minutes <= 0) return events;
  const savedAt = Number(prof.savedAt) || 0;
  const inboxOf = (type) => inbox.filter(e => e && e.type === type);
  const mkId = (type) => `srv-${type}-${now}-${Math.floor(R() * 1e6).toString(36)}`;

  // --- 1. Crises -----------------------------------------------------------
  const cr = prof.crisis || {};
  const pool = Array.isArray(cr.pool) ? cr.pool.filter(Boolean) : [];
  if (pool.length && !inboxOf('crise').length) {
    const today = crisisDayKey(now);
    const lastTs = Math.max(Number(cr.lastTs) || 0, Number(st.crisisLastTs) || 0);
    // Crise active au moment de la dernière sauvegarde (sauf si le serveur en a émis une depuis)
    const activeAtSave = !!cr.active && savedAt >= (Number(st.crisisLastTs) || 0);
    const allowed = cr.lastDay !== today && st.crisisLastDay !== today && (now - lastTs >= 20 * HOUR) && !activeAtSave;
    if (allowed) {
      const hour = parisParts(now).hour;
      const p = probOver(RULES.crisisChancePer10s(hour, cr.mult), minutes * 6);
      if (R() < p) {
        const kind = pool[Math.floor(R() * pool.length)];
        events.push({ id: mkId('crise'), type: 'crise', kind, createdAt: now });
        st.crisisLastTs = now;
        st.crisisLastDay = today;
      }
    }
  }

  // --- 2. Interventions SAMU 15 (garde active, VPSP disponible) ---------------
  const sa = prof.samu || {};
  if (sa.signed && (Number(sa.vpsp) || 0) > 0) {
    const guardActive = inWindows(sa.windows, now) || (!!sa.legacyActive && (now - savedAt) < 24 * HOUR);
    const busyAtSave = (Number(sa.activeCount) || 0) > 0 && savedAt >= (Number(st.samuLastTs) || 0);
    if (guardActive && now >= (Number(st.samuBusyUntil) || 0) && !busyAtSave) {
      const chance = Number(sa.chance) >= 0 ? Number(sa.chance) : 0.28;
      if (R() < probOver(chance, minutes * 2)) {
        events.push({ id: mkId('samu'), type: 'samu', createdAt: now, maxResponseMinutes: Number(sa.maxResp) || 12 });
        st.samuLastTs = now;
        st.samuBusyUntil = now + opts.samuBusyMs;
      }
    }
  }

  // --- 3. Interventions SDIS (garde caserne armée) ----------------------------
  const sd = prof.sdis || {};
  if (sd.active && (now - savedAt) < 24 * HOUR) {
    const busyAtSave = (Number(sd.activeCount) || 0) > 0 && savedAt >= (Number(st.sdisLastTs) || 0);
    if (now >= (Number(st.sdisBusyUntil) || 0) && !busyAtSave) {
      const high = sd.severity === 'critique' || sd.severity === 'eleve';
      const chance = high ? (Number(sd.chanceHigh) >= 0 ? Number(sd.chanceHigh) : 0.35) : (Number(sd.chanceNormal) >= 0 ? Number(sd.chanceNormal) : 0.20);
      if (R() < probOver(chance, minutes * 2)) {
        events.push({ id: mkId('sdis'), type: 'sdis', createdAt: now });
        st.sdisLastTs = now;
        st.sdisBusyUntil = now + opts.sdisBusyMs;
      }
    }
  }

  // --- 4. Demandes de DPS (modèle réaliste) -----------------------------------
  const P = parisParts(now);
  const dv = prof.devis || {};
  if ((Number(dv.max) || 0) > 0) {
    const pending = (Number(dv.pending) || 0) + inboxOf('devis').length;
    const lastTs = Math.max(Number(dv.lastTs) || 0, Number(st.devisLastTs) || 0);
    if (pending < Number(dv.max) && (now - lastTs) >= REALISM.minGapDevisMs) {
      // Fraîcheur du site : -0,7 point par heure depuis la sauvegarde (sauf salarié délégué)
      const freshness = !dv.sitePublished ? 0 : (dv.autopilot ? 100 : Math.max(5, (Number(dv.freshness) || 0) - 0.7 * Math.max(0, (now - savedAt) / HOUR)));
      const perMinute = REALISM.dpsMonthly(dv, freshness) / MINUTES_PER_MONTH
        * REALISM.seasonDps[P.month] * REALISM.hourDps[P.hour] * REALISM.dayDps[P.weekday];
      if (R() < probOver(perMinute, minutes)) {
        events.push({ id: mkId('devis'), type: 'devis', createdAt: now });
        st.devisLastTs = now;
      }
    }
  }

  // --- 5. Candidatures (modèle réaliste + plafonds du jeu) --------------------
  const ca = prof.cand || {};
  if (ca.cap) {
    const today = utcDayKey(now);
    const inboxCand = inboxOf('candidature');
    const countToday = (ca.todayKey === today ? (Number(ca.todayCount) || 0) : 0) + inboxCand.filter(e => utcDayKey(e.createdAt) === today).length;
    const lastTs = Math.max(Number(ca.lastTs) || 0, Number(st.candLastTs) || 0, ...inboxCand.map(e => Number(e.createdAt) || 0));
    const minInterval = Number(ca.cap.minIntervalHours) || 0;
    const pending = (Number(ca.pending) || 0) + inboxCand.length;
    const allowed = countToday < (Number(ca.cap.maxPerDay) || 0)
      && !(lastTs > 0 && (now - lastTs) / HOUR < minInterval)
      && pending < RULES.candidatureMaxPending(ca.cap.tier);
    if (allowed) {
      const freshness = !ca.sitePublished ? 0 : (ca.autopilot ? 100 : Math.max(5, (Number(ca.freshness) || 0) - 0.7 * Math.max(0, (now - savedAt) / HOUR)));
      const perMinute = REALISM.candMonthly(ca, freshness) / MINUTES_PER_MONTH
        * REALISM.seasonCand[P.month] * REALISM.hourCand[P.hour] * REALISM.dayCand[P.weekday];
      if (R() < probOver(perMinute, minutes)) {
        events.push({ id: mkId('candidature'), type: 'candidature', createdAt: now });
        st.candLastTs = now;
      }
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Moteur (accès Supabase REST, état persistant, boucle)
// ---------------------------------------------------------------------------
function createEngine(options = {}) {
  const opts = Object.assign({}, DEFAULTS, options);
  const url = opts.supabaseUrl;
  const key = opts.supabaseKey;
  const fetchFn = opts.fetch || (typeof fetch === 'function' ? fetch : null);
  const log = opts.log || ((...a) => console.log('[Moteur événements]', ...a));
  const statePath = opts.statePath || path.join(process.cwd(), 'data', 'server_events_state.json');
  const heartbeats = new Map();
  let state = { players: {}, lastTickAt: 0 };
  let timer = null;
  let running = false;
  const stats = { startedAt: Date.now(), ticks: 0, events: 0, notifications: 0, lastError: null, lastTickAt: 0, players: 0 };

  try {
    if (fs.existsSync(statePath)) state = Object.assign(state, JSON.parse(fs.readFileSync(statePath, 'utf8')));
  } catch (e) { log('État illisible, réinitialisation :', e.message); }

  function persist() {
    try {
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, JSON.stringify(state));
    } catch (e) { log('Écriture de l’état impossible :', e.message); }
  }

  const headers = (extra) => Object.assign({ apikey: key, Authorization: `Bearer ${key}` }, extra || {});

  async function fetchProfiles() {
    const res = await fetchFn(`${url}/rest/v1/game_saves?select=user_id,username,prof:save_data->srvProfile,inbox:save_data->server_inbox,engAt:save_data->srv_engine_at`, { headers: headers() });
    if (!res.ok) throw new Error(`Lecture des profils impossible (HTTP ${res.status})`);
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  }

  // Dépôt des événements + notifications dans la sauvegarde du joueur (lecture puis écriture)
  async function deliver(userId, events, notifs, now) {
    const q = `user_id=eq.${encodeURIComponent(userId)}`;
    const res = await fetchFn(`${url}/rest/v1/game_saves?${q}&select=save_data`, { headers: headers() });
    if (!res.ok) throw new Error(`Lecture de la sauvegarde impossible (HTTP ${res.status})`);
    const rows = await res.json();
    const sd = rows && rows[0] && rows[0].save_data;
    if (!sd) return false;
    // Marqueur lu par le jeu : « le moteur du serveur est actif » (le jeu coupe alors ses tirages locaux)
    sd.srv_engine_at = now || Date.now();
    const inbox = Array.isArray(sd.server_inbox) ? sd.server_inbox : [];
    const known = new Set(inbox.map(e => e && e.id));
    events.forEach(e => { if (!known.has(e.id)) inbox.push(e); });
    // Nettoyage : événements de plus de 7 jours jamais récupérés
    sd.server_inbox = inbox.filter(e => e && (Date.now() - (Number(e.createdAt) || 0)) < 7 * 24 * HOUR).slice(-opts.inboxMax);
    if (notifs.length) {
      const pending = Array.isArray(sd.pending_notifications) ? sd.pending_notifications : [];
      notifs.forEach(n => pending.unshift(n));
      sd.pending_notifications = pending.slice(0, opts.pendingNotifMax);
    }
    const patch = await fetchFn(`${url}/rest/v1/game_saves?${q}`, {
      method: 'PATCH',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify({ save_data: sd })
    });
    if (!patch.ok) throw new Error(`Écriture de la sauvegarde impossible (HTTP ${patch.status})`);
    return true;
  }

  function isOnline(userId, now) {
    const hb = heartbeats.get(String(userId));
    return !!hb && (now - hb) < opts.onlineWindowMs;
  }

  async function tick(nowArg) {
    if (running || !fetchFn || !url || !key) return [];
    running = true;
    const now = nowArg || Date.now();
    const delivered = [];
    try {
      const rows = await fetchProfiles();
      stats.players = 0;
      for (const row of rows) {
        const prof = row && row.prof;
        if (!prof || !prof.v || !(Number(prof.stationsCount) > 0)) continue;
        if (now - (Number(prof.savedAt) || 0) > opts.inactiveAfterMs) continue;
        stats.players++;
        const uid = String(row.user_id);
        const st = state.players[uid] || (state.players[uid] = {});
        let prevTs = Number(st.lastTickAt) || (now - opts.tickMs);
        if (prevTs > now) prevTs = now - opts.tickMs; // horloge serveur recalée
        const inbox = Array.isArray(row.inbox) ? row.inbox : [];
        const events = drawForPlayer(prof, st, inbox, now, prevTs, opts);
        st.lastTickAt = now;
        if (!events.length) {
          // Rafraîchit le marqueur « moteur actif » toutes les 6 h
          if (!(Number(row.engAt) > 0) || now - Number(row.engAt) > 6 * HOUR) {
            try { await deliver(uid, [], [], now); } catch (e) { stats.lastError = e.message; }
          }
          continue;
        }

        const online = isOnline(uid, now);
        const notifs = [];
        if (!online) {
          events.forEach(ev => {
            const n = notifFor(ev);
            if (!n) return;
            const mode = notifMode(prof.notif, n.category);
            if (mode === 'off') return;
            notifs.push({
              id: `notif_${ev.id}`,
              title: n.title,
              body: n.body,
              message: n.body,
              category: n.category,
              type: ev.type === 'devis' || ev.type === 'candidature' ? 'blue' : 'red',
              eventId: ev.id,
              push: mode !== 'sound_only',
              created_at: new Date(now).toISOString()
            });
          });
        }
        try {
          await deliver(uid, events, notifs, now);
          stats.events += events.length;
          stats.notifications += notifs.length;
          delivered.push({ userId: uid, events, notifs, online });
          log(`${row.username || uid} : ${events.map(e => e.type + (e.kind ? '/' + e.kind : '')).join(', ')}${online ? ' (jeu ouvert)' : ` → ${notifs.length} notification(s)`}`);
        } catch (e) {
          stats.lastError = e.message;
          log('Échec de dépôt pour', row.username || uid, ':', e.message);
        }
      }
      state.lastTickAt = now;
      stats.ticks++;
      stats.lastTickAt = now;
      persist();
    } catch (e) {
      stats.lastError = e.message;
      log('Tick en erreur :', e.message);
    } finally {
      running = false;
    }
    return delivered;
  }

  return {
    tick,
    start() {
      if (timer) return;
      if (!fetchFn) { log('fetch indisponible (Node 18+ requis) : moteur désactivé.'); return; }
      timer = setInterval(() => { tick(); }, opts.tickMs);
      setTimeout(() => { tick(); }, 5000);
      log(`Actif : tirages toutes les ${Math.round(opts.tickMs / 1000)} s (crises, SAMU/SDIS, DPS, candidatures).`);
    },
    stop() { if (timer) clearInterval(timer); timer = null; },
    heartbeat(userId) { if (userId) heartbeats.set(String(userId), Date.now()); },
    status() { return Object.assign({ active: !!timer, version: 1 }, stats, { online: heartbeats.size }); },
    _state: () => state
  };
}

// Routes HTTP à brancher dans server.js : renvoie true si la requête a été traitée
function handleHttp(engine, req, res) {
  const u = String(req.url || '').split('?')[0];
  if (u === '/api/events-engine/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ success: true, engine: engine.status() }));
    return true;
  }
  if (u === '/api/events-engine/heartbeat' && req.method === 'POST') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 2000) req.destroy(); });
    req.on('end', () => {
      try { const p = JSON.parse(body || '{}'); engine.heartbeat(p.userId || p.user_id); } catch (e) { /* corps invalide */ }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ success: true }));
    });
    return true;
  }
  return false;
}

module.exports = { createEngine, handleHttp, drawForPlayer, notifFor, notifMode, RULES, REALISM, _time: { parisParts, crisisDayKey, utcDayKey } };
