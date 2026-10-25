'use strict';
// =============================================================================
// MyProtec – Programme autonome du VPS : moteur d'événements + envoi des push
// -----------------------------------------------------------------------------
// À lancer à côté de l'API existante (myprotec-api), sans la modifier :
//     cd /var/www/myprotec-events && npm install && pm2 start worker.js --name myprotec-events
//
// 1. Moteur d'événements (server_events_engine.js) : toutes les minutes, tirage des
//    crises, inter SAMU/SDIS, demandes de DPS et candidatures pour chaque joueur.
// 2. Passerelle push : toutes les 2 s, envoie sur le téléphone des joueurs les
//    notifications en attente (save_data.pending_notifications) via Web Push.
// 3. Petite page d'état locale : curl http://localhost:3020/status
// =============================================================================

const http = require('http');
const path = require('path');
const { createEngine } = require('./server_events_engine');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yrayehhbqcnuiuejqsjz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable__SL5mXhQJBnyBBxgJJajXw_tCxJzlPs';
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BKLdj5RykkIOWRhAriMzfKsYON-juKOqSvFCclSz6zgr0CRZdLlQOhfd9nAwmXZZjsNMJU-pl5Csy4Yg-c6mHe0';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'rgoFrFwds0VGKS46Hl2OUKrjlir3Htd3ccpvZ7aQQNA';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@myprotec.fr';
const STATUS_PORT = Number(process.env.STATUS_PORT || 3020);
const PUSH_POLL_MS = 2000;
const PUSH_MAX_AGE_MS = 2 * 3600 * 1000; // une notification de plus de 2 h n'est plus envoyée

if (typeof fetch !== 'function') {
  console.error('❌ Node.js 18 ou plus récent est requis (fonction fetch absente). Version actuelle :', process.version);
  process.exit(1);
}

let webpush = null;
try {
  webpush = require('web-push');
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
} catch (e) {
  console.error('❌ Module web-push absent : lancez « npm install » dans ce dossier.', e.message);
}

const headers = (extra) => Object.assign({ apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, extra || {});
const pushStats = { sent: 0, failed: 0, expired: 0, lastSentAt: 0, lastError: null };

// --- 1. Moteur d'événements ---------------------------------------------------
const engine = createEngine({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
  statePath: path.join(__dirname, 'data', 'server_events_state.json'),
  log: (...a) => console.log(new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }), '[Moteur événements]', ...a)
});
engine.start();

// --- 2. Passerelle push -------------------------------------------------------
const sentIds = new Set();
let pushBusy = false;

async function pushPending() {
  if (pushBusy || !webpush) return;
  pushBusy = true;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?select=user_id,username,pending:save_data->pending_notifications,sub:save_data->push_subscription`, { headers: headers() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const now = Date.now();
    for (const row of (Array.isArray(rows) ? rows : [])) {
      const pending = Array.isArray(row.pending) ? row.pending : [];
      const sub = row.sub;
      if (!sub || !sub.endpoint || !pending.length) continue;
      const toSend = pending.filter(n => n && !n.pushed_at && n.push !== false && !sentIds.has(n.id)
        && (now - new Date(n.created_at || 0).getTime()) < PUSH_MAX_AGE_MS);
      if (!toSend.length) continue;

      const results = {};
      for (const n of toSend) {
        sentIds.add(n.id);
        const payload = JSON.stringify({
          title: n.title || '🚨 ALERTE MYPROTEC',
          body: n.body || n.message || 'Nouvelle alerte opérationnelle.',
          icon: 'https://myprotec.fr/badge-monochrome.png',
          badge: 'https://myprotec.fr/badge-monochrome.png',
          tag: `protec-${n.eventId || n.id}`,
          vibrate: n.category === 'crise' || n.category === 'samu' || n.category === 'sdis' ? [500, 200, 500, 200, 500] : [200, 100, 200],
          data: { url: '/jeu.html', category: n.category || 'alert', fromEngine: !!n.eventId, eventId: n.eventId || null }
        });
        try {
          await webpush.sendNotification(sub, payload, { TTL: 3600, urgency: n.push === false ? 'low' : 'high' });
          results[n.id] = 'delivered';
          pushStats.sent++;
          pushStats.lastSentAt = Date.now();
          console.log(`📲 Push envoyé à ${row.username || row.user_id} : ${n.title}`);
        } catch (err) {
          const code = err && err.statusCode;
          results[n.id] = (code === 404 || code === 410) ? 'expired_410' : 'error';
          if (code === 404 || code === 410) pushStats.expired++; else pushStats.failed++;
          pushStats.lastError = `${code || ''} ${err && err.message}`;
          console.warn(`⚠️ Push refusé pour ${row.username || row.user_id} (${code || 'erreur'}) : ${err && err.message}`);
        }
      }

      // Marque les notifications comme envoyées dans la sauvegarde
      try {
        const q = `user_id=eq.${encodeURIComponent(row.user_id)}`;
        const full = await fetch(`${SUPABASE_URL}/rest/v1/game_saves?${q}&select=save_data`, { headers: headers() });
        const data = full.ok ? await full.json() : null;
        const sd = data && data[0] && data[0].save_data;
        if (sd && Array.isArray(sd.pending_notifications)) {
          const stamp = new Date().toISOString();
          sd.pending_notifications.forEach(n => { if (n && results[n.id]) { n.pushed_at = stamp; n.push_status = results[n.id]; } });
          await fetch(`${SUPABASE_URL}/rest/v1/game_saves?${q}`, {
            method: 'PATCH',
            headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
            body: JSON.stringify({ save_data: sd })
          });
        }
      } catch (e) { /* nouvel essai évité grâce à sentIds */ }
    }
  } catch (e) {
    pushStats.lastError = e.message;
  } finally {
    pushBusy = false;
  }
}
setInterval(pushPending, PUSH_POLL_MS);
setTimeout(pushPending, 1000);

// --- 3. Page d'état locale ----------------------------------------------------
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ engine: engine.status(), push: Object.assign({ webPushReady: !!webpush }, pushStats) }, null, 2));
}).listen(STATUS_PORT, '127.0.0.1', () => {
  console.log(`✅ MyProtec Events démarré. État : curl http://localhost:${STATUS_PORT}/status`);
});
