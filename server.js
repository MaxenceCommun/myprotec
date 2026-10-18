const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

let PORT = parseInt(process.env.PORT || '8080', 10);
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8'
};

// --- ÉTAT MULTIJOUEUR EN BDD ---
const gameState = {
  players: {}, // En mémoire vive pour le statut connecté / lastSeen
  get alliances() { return db.data.alliances; },
  get allianceStations() {
    const list = [];
    const seenStationIds = new Set();
    const seenPlayerIds = new Set();

    // 1. Antennes des joueurs connectés en mémoire vive
    Object.values(this.players).forEach(p => {
      if (p && p.id && !p.id.startsWith('system') && p.stations && Array.isArray(p.stations)) {
        seenPlayerIds.add(p.id);
        p.stations.forEach(st => {
          if (st && st.id && !st.id.startsWith('station-allie') && !seenStationIds.has(st.id)) {
            seenStationIds.add(st.id);
            list.push({
              id: st.id,
              playerId: p.id,
              playerName: p.name || 'Directeur d’Antenne',
              name: st.name,
              city: st.city,
              departmentCode: st.departmentCode || p.departmentCode,
              lat: st.lat,
              lng: st.lng,
              level: st.level || 1,
              vehicles: (st.vehicles || []).length || st.vehiclesCount || 1,
              volunteers: (st.volunteers || []).length || st.volunteersCount || 4,
              allianceId: p.allianceId || 'alliance-fnpc',
              isOnline: true
            });
          }
        });
      }
    });

    // 2. Antennes des joueurs persistés en base (savedGames) - visibles même hors-ligne !
    if (db.data && db.data.savedGames) {
      Object.entries(db.data.savedGames).forEach(([userId, saveEntry]) => {
        const gameData = saveEntry?.data;
        if (!gameData || !Array.isArray(gameData.stations)) return;
        const playerRec = Object.values(db.data.users || {}).find(u => u.id === userId);
        const playerName = playerRec ? playerRec.username : (gameData.player?.name || 'Directeur d’Antenne');

        gameData.stations.forEach(st => {
          if (st && st.id && !st.id.startsWith('station-allie') && !seenStationIds.has(st.id)) {
            seenStationIds.add(st.id);
            seenPlayerIds.add(userId);
            const isOnline = Boolean(this.players[userId] && (Date.now() - this.players[userId].lastSeen < 120000));
            list.push({
              id: st.id,
              playerId: userId,
              playerName: playerName,
              name: st.name,
              city: st.city,
              departmentCode: st.departmentCode || gameData.player?.departmentCode,
              lat: st.lat,
              lng: st.lng,
              level: st.level || 1,
              vehicles: (st.vehicles || []).length || 1,
              volunteers: (st.volunteers || []).length || 4,
              allianceId: gameData.player?.allianceId || 'alliance-fnpc',
              isOnline: isOnline
            });
          }
        });
      });
    }

    return list;
  },
  get renforts() { return db.data.renforts; },
  get formationsSpeciales() { return db.data.formationsSpeciales; },
  get chatMessages() { return db.data.chatMessages; },
  get marketplace() { return db.data.marketplace || []; },
  get communityEvents() { return db.data.communityEvents || []; },
  get badgesCollection() { return db.data.badgesCollection || []; }
};

// Abonnés SSE pour le push en temps réel
const sseClients = [];

function broadcastSSE(type, data) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch (e) {
      // client déconnecté
    }
  });
}

function getAuthUser(req) {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  let token = null;
  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  }
  return db.getUserByToken(token);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = forwarded.split(',');
    if (list.length > 0) return list[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket.remoteAddress || '';
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

// Configuration OAuth2 Discord Officielle
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1559698958966857788';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'PBVswxt7MDfJFbUMV86EI3yBMJnda9-7';
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || 'e3386fdde63936935ff2d3567b51a0d5717f0f822f8eec83d7f62454ac22558b';

async function exchangeDiscordCode(code, redirectUri) {
  const tokenParams = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    client_secret: DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  });

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: tokenParams.toString()
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    const errMsg = tokenData.error_description || tokenData.error || 'Échec de la validation OAuth Discord';
    throw new Error(errMsg);
  }

  const userRes = await fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`
    }
  });

  const userData = await userRes.json();
  if (!userRes.ok || !userData.id) {
    throw new Error('Échec de la récupération du profil utilisateur Discord');
  }

  const avatarUrl = userData.avatar
    ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${(BigInt(userData.id) >> 22n) % 6n}.png`;

  return {
    id: userData.id,
    username: userData.username,
    global_name: userData.global_name || userData.username,
    discriminator: userData.discriminator || '0',
    avatar: userData.avatar || null,
    avatarUrl,
    email: userData.email || null
  };
}

// =========================================================================
// MOTEUR WEB PUSH NORMÉ RFC 8291 / RFC 8292 (PUSH MOBILE APP FERMÉE)
// =========================================================================

let webpush = null;
try {
  webpush = require('web-push');
} catch (e) {
  console.warn('Module web-push non disponible :', e.message);
}

function getOrCreateVapidKeys() {
  return db.getOrCreateVapidKeys();
}

// Registre en mémoire des alertes Web Push différées (fin d'intervention, rappels opérationnels app fermée)
const scheduledPushEvents = new Map();

function configureWebPush() {
  const keys = getOrCreateVapidKeys();
  if (webpush && keys && keys.publicKey && keys.privateKey) {
    try {
      webpush.setVapidDetails(
        keys.subject || 'mailto:contact@myprotec.fr',
        keys.publicKey,
        keys.privateKey
      );
    } catch (err) {
      console.warn('[WebPush] Configuration VAPID details :', err.message);
    }
  }
  return keys;
}

async function sendSingleWebPush(subscription, payloadObject) {
  if (!subscription || !subscription.endpoint) {
    return { success: false, error: 'Abonnement incomplet' };
  }

  const p256dh = subscription.p256dh || subscription.keys?.p256dh;
  const auth = subscription.auth || subscription.keys?.auth;

  if (!p256dh || !auth) {
    return { success: false, error: 'Clés p256dh ou auth manquantes dans l’abonnement.' };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: { p256dh, auth }
  };

  configureWebPush();

  if (webpush) {
    try {
      const res = await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payloadObject),
        {
          TTL: 86400,
          urgency: 'high'
        }
      );
      return { success: true, status: res.statusCode };
    } catch (err) {
      const statusCode = err.statusCode || 500;
      const isExpired = statusCode === 404 || statusCode === 410;
      return {
        success: false,
        expired: isExpired,
        status: statusCode,
        error: err.message || (err.body ? String(err.body) : 'Erreur envoi notification')
      };
    }
  }

  return { success: false, error: 'Module web-push indisponible sur le serveur' };
}

async function dispatchWebPushToPlayer(targetUserId, payloadObject) {
  configureWebPush();
  const subs = db.getAllPushSubscriptions();
  console.log(`📡 [WebPush Server] Dispatch demandé vers target='${targetUserId}', total abonnés en base: ${subs.length}`);

  if (subs.length === 0) {
    console.warn('⚠️ [WebPush Server] Aucun abonnement push enregistré dans la base de données.');
    return 0;
  }

  // Normalisation du payload pour Service Worker W3C
  const pushPayload = {
    title: payloadObject.title || '🚨 ALERTE MYPROTEC',
    body: payloadObject.body || payloadObject.message || 'Nouvelle notification opérationnelle !',
    message: payloadObject.message || payloadObject.body || 'Nouvelle notification opérationnelle !',
    icon: payloadObject.icon || '/icons/icon-192x192.png',
    badge: payloadObject.badge || '/icons/badge-monochrome.png',
    data: Object.assign({ url: '/jeu.html', category: payloadObject.category || 'alert' }, payloadObject.data || {}),
    vibrate: payloadObject.vibrate || [500, 200, 500, 200, 500],
    tag: payloadObject.tag || `protec-alert-${Date.now()}`
  };

  // Résolution de l'utilisateur cible dans la BDD pour obtenir ID et Username
  let targetUser = null;
  const isBroadcast = !targetUserId || targetUserId === 'all' || targetUserId === 'me' || targetUserId === 'local';
  if (!isBroadcast) {
    targetUser = Object.values(db.data.users || {}).find(u => 
      u.id === targetUserId || 
      (u.username && u.username.toLowerCase() === String(targetUserId).toLowerCase())
    );
  }

  let matchingSubs = subs.filter(s => {
    if (!s || !s.endpoint) return false;
    if (isBroadcast) return true;

    const pid = String(s.user_id || s.userId || '').toLowerCase();
    const uname = String(s.username || '').toLowerCase();
    const target = String(targetUserId).toLowerCase();

    // 1. Match direct sur ID ou username
    if (pid === target || uname === target) return true;

    // 2. Match croisé si l'utilisateur cible est connu en base
    if (targetUser) {
      if (pid === String(targetUser.id).toLowerCase()) return true;
      if (uname === String(targetUser.username).toLowerCase()) return true;
    }

    return false;
  });

  // Fallback test admin : si aucun abonnement spécifique ne matchait, cibler tous les abonnements récents
  if (matchingSubs.length === 0 && subs.length > 0) {
    console.log(`ℹ️ [WebPush Server] Aucun abonnement ciblé pour '${targetUserId}', bascule sur tous les abonnés (${subs.length}) pour garantir le test.`);
    matchingSubs = subs;
  }

  console.log(`📲 [WebPush Server] Abonnements correspondants : ${matchingSubs.length} sur ${subs.length}`);

  let sentCount = 0;
  for (const sub of matchingSubs) {
    console.log(`🚀 [WebPush Server] Envoi vers ${sub.endpoint.slice(0, 45)}... (user: ${sub.username || sub.user_id || 'inconnu'})`);
    const res = await sendSingleWebPush(sub, pushPayload);
    console.log(`   -> Résultat envoi : success=${res.success}, status=${res.status || 'N/A'}`);
    if (res.success) {
      sentCount++;
      sub.last_used = Date.now();
      db.save();
    } else if (res.expired) {
      console.warn(`   -> Abonnement expiré, suppression : ${sub.endpoint}`);
      db.deletePushSubscription(sub.endpoint);
    }
  }
  return sentCount;
}


const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // Gestion CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token, x-admin-key',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    res.end();
    return;
  }

  // Obtenir l'IP client
  if (url === '/api/client-ip' && req.method === 'GET') {
    const rawIp = getClientIp(req);
    sendJson(res, 200, { success: true, ip: db.normalizeIp(rawIp) });
    return;
  }

  // --- API AUTHENTIFICATION & BASE DE DONNÉES ---

  // Inscription
  if (url === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { username, password, stationName, city, departmentCode, referralCode, referral_code, deviceFingerprint } = JSON.parse(body);
        const dept = departmentCode || city || '75';
        const clientIp = getClientIp(req);
        const refCode = referralCode || referral_code || null;
        const result = db.registerUser(username, password, stationName, dept, dept, refCode, clientIp, deviceFingerprint);
        if (result.error) {
          sendJson(res, 400, { success: false, error: result.error });
        } else {
          broadcastSSE('player_registered', { user: result.user });
          sendJson(res, 201, result);
        }
      } catch (err) {
        console.error('Erreur API Inscription:', err);
        sendJson(res, 400, { success: false, error: err.message || 'Données invalides' });
      }
    });
    return;
  }

  // Connexion
  if (url === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);
        const clientIp = getClientIp(req);
        const result = db.loginUser(username, password, clientIp);
        if (result.error) {
          sendJson(res, 401, { success: false, error: result.error });
        } else {
          sendJson(res, 200, result);
        }
      } catch (err) {
        sendJson(res, 400, { success: false, error: 'Données invalides' });
      }
    });
    return;
  }

  // Vérifier Session actuelle (Me)
  if (url === '/api/auth/me' && req.method === 'GET') {
    const user = getAuthUser(req);
    if (!user) {
      sendJson(res, 401, { success: false, error: 'Non authentifié' });
    } else {
      const pendingAlerts = [...(user.pending_referral_alerts || [])];
      user.pending_referral_alerts = [];
      db.save();
      sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role || 'user',
          stationName: user.stationName,
          city: user.city,
          referral_code: user.referral_code,
          referred_by: user.referred_by || null,
          referral_suspended: !!user.referral_suspended,
          discord: user.discord || null
        },
        pendingAlerts
      });
    }
    return;
  }

  // Déconnexion
  if (url === '/api/auth/logout' && req.method === 'POST') {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
    let token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim()) : null;
    db.logoutUser(token);
    sendJson(res, 200, { success: true });
    return;
  }

  // Obtenir la configuration Discord publique
  if (url === '/api/auth/discord/config' && req.method === 'GET') {
    sendJson(res, 200, { success: true, clientId: DISCORD_CLIENT_ID });
    return;
  }

  // Callback OAuth2 Discord (Redirection depuis le portail Discord)
  if (url === '/api/auth/discord/callback' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:8080'}`);
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');
    const err = urlObj.searchParams.get('error_description') || urlObj.searchParams.get('error');

    if (err) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#fff;">
        <h2 style="color:#ef4444;">Connexion Discord Annulée</h2>
        <p>${err}</p>
        <button onclick="window.close()" style="margin-top:16px;padding:10px 20px;border-radius:10px;background:#334155;color:#fff;border:none;cursor:pointer;">Fermer</button>
      </body></html>`);
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#fff;">
        <h2 style="color:#ef4444;">Code OAuth manquant</h2>
        <button onclick="window.close()" style="margin-top:16px;padding:10px 20px;border-radius:10px;background:#334155;color:#fff;border:none;cursor:pointer;">Fermer</button>
      </body></html>`);
      return;
    }

    const redirectUri = `${urlObj.origin}/api/auth/discord/callback`;
    const clientIp = getClientIp(req);

    // Déterminer s'il s'agit d'une liaison avec un compte existant
    let existingUserId = null;
    if (state && state.startsWith('link:')) {
      existingUserId = state.slice(5).trim();
    }

    exchangeDiscordCode(code, redirectUri)
      .then(discordProfile => {
        const result = db.loginOrLinkDiscord(discordProfile, existingUserId, clientIp);
        if (result.error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#fff;">
            <h2 style="color:#ef4444;">Erreur de Liaison Discord</h2>
            <p>${result.error}</p>
            <button onclick="window.close()" style="margin-top:16px;padding:10px 20px;border-radius:10px;background:#334155;color:#fff;border:none;cursor:pointer;">Fermer</button>
          </body></html>`);
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(`<!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Connexion Discord...</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#fff;">
          <div style="font-size:48px;margin-bottom:16px;">🎮</div>
          <h2 style="color:#5865F2;">Connexion Discord Réussie !</h2>
          <p style="color:#94a3b8;">Bienvenue, <strong>${result.user?.discord?.global_name || result.user?.username}</strong>. Synchronisation de votre antenne...</p>
          <script>
            const payload = {
              type: 'DISCORD_AUTH_SUCCESS',
              action: '${result.action}',
              token: '${result.token || ''}',
              user: ${JSON.stringify(result.user || {})}
            };
            if (window.opener) {
              window.opener.postMessage(payload, '*');
              setTimeout(() => window.close(), 600);
            } else {
              window.location.href = '/jeu.html?discord_auth=1';
            }
          </script>
        </body>
        </html>`);
      })
      .catch(e => {
        console.error('Erreur Callback Discord:', e);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#0f172a;color:#fff;">
          <h2 style="color:#ef4444;">Erreur Discord</h2>
          <p>${e.message}</p>
          <button onclick="window.close()" style="margin-top:16px;padding:10px 20px;border-radius:10px;background:#334155;color:#fff;border:none;cursor:pointer;">Fermer</button>
        </body></html>`);
      });
    return;
  }

  // Échange de code OAuth2 Discord (Appel API direct depuis le client)
  if (url === '/api/auth/discord/exchange' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { code, redirectUri, existingUserId } = JSON.parse(body);
        if (!code) {
          sendJson(res, 400, { success: false, error: 'Code OAuth manquant' });
          return;
        }
        const clientIp = getClientIp(req);
        const discordProfile = await exchangeDiscordCode(code, redirectUri);
        const result = db.loginOrLinkDiscord(discordProfile, existingUserId, clientIp);
        if (result.error) {
          sendJson(res, 400, { success: false, error: result.error });
        } else {
          sendJson(res, 200, result);
        }
      } catch (err) {
        console.error('Erreur exchange Discord:', err);
        sendJson(res, 400, { success: false, error: err.message || 'Erreur échange Discord' });
      }
    });
    return;
  }

  // Dissociation du compte Discord
  if (url === '/api/auth/discord/unlink' && req.method === 'POST') {
    const user = getAuthUser(req);
    if (!user) {
      sendJson(res, 401, { success: false, error: 'Non authentifié' });
      return;
    }
    const result = db.unlinkDiscord(user.id);
    sendJson(res, 200, result);
    return;
  }

  // Validation du palier première mission terminée pour le parrainage
  if (url === '/api/referral/claim-first-mission' && req.method === 'POST') {
    const user = getAuthUser(req);
    if (!user) {
      sendJson(res, 401, { success: false, error: 'Connexion requise.' });
      return;
    }
    const result = db.claimReferralFirstMission(user.id);
    if (result.success) {
      broadcastSSE('referral_validated', result);
    }
    sendJson(res, 200, result);
    return;
  }

  // Statut parrainage du joueur
  if (url === '/api/referral/status' && req.method === 'GET') {
    const user = getAuthUser(req);
    if (!user) {
      sendJson(res, 401, { success: false, error: 'Connexion requise.' });
      return;
    }
    const myReferrals = (db.data.referralLogs || []).filter(r => r.referrer_id === user.id);
    sendJson(res, 200, {
      success: true,
      referral_code: user.referral_code,
      referral_suspended: !!user.referral_suspended,
      referred_by: user.referred_by || null,
      total_referees: myReferrals.length,
      completed_referees: myReferrals.filter(r => r.status === 'completed').length
    });
    return;
  }

  // Informations sur le département
  if (url.startsWith('/api/department/info') && req.method === 'GET') {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const deptCode = parsedUrl.searchParams.get('code') || '75';
    const deptInfo = db.getDepartmentInfo(deptCode);
    sendJson(res, 200, { success: true, department: deptInfo });
    return;
  }

  // Léguer l'antenne principale à un autre joueur du département
  if (url === '/api/department/transfer' && req.method === 'POST') {
    const user = getAuthUser(req);
    if (!user) {
      sendJson(res, 401, { success: false, error: 'Connexion requise' });
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { departmentCode, newLeaderId } = JSON.parse(body);
        const result = db.transferMainAntenna(departmentCode, user.id, newLeaderId);
        if (result.error) {
          sendJson(res, 400, { success: false, error: result.error });
        } else {
          broadcastSSE('department_leader_changed', { department: result.department });
          sendJson(res, 200, { success: true, department: result.department });
        }
      } catch (err) {
        sendJson(res, 400, { success: false, error: err.message });
      }
    });
    return;
  }

  // Sauvegarder la partie du joueur en BDD
  if (url === '/api/game/save' && req.method === 'POST') {
    const user = getAuthUser(req);
    if (!user) {
      sendJson(res, 401, { success: false, error: 'Connexion requise pour sauvegarder en BDD' });
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const gameData = JSON.parse(body);
        db.saveGame(user.id, gameData);
        gameState.players[user.id] = {
          id: user.id,
          name: user.username,
          discord: user.discord || null,
          stations: gameData.stations || [],
          departmentCode: user.departmentCode || (gameData.player && gameData.player.departmentCode),
          allianceId: (gameData.player && gameData.player.allianceId) || 'alliance-fnpc',
          platformStats: gameData.platformStats || null,
          lastDevice: gameData.lastDevice || null,
          lastSeen: Date.now()
        };
        broadcastSSE('stations_updated', { allianceStations: gameState.allianceStations });
        sendJson(res, 200, { success: true, savedAt: new Date().toISOString() });
      } catch (err) {
        sendJson(res, 400, { success: false, error: err.message });
      }
    });
    return;
  }

  // Statut du cron serveur 24h/24 (Moteur autonome hors-ligne)
  if (url === '/api/cron/status' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      cronActive: true,
      intervalSeconds: 60,
      lastTickAt: lastCronTickTime ? new Date(lastCronTickTime).toISOString() : null,
      serverUptimeSec: Math.floor(process.uptime()),
      totalSavedGames: Object.keys(db.data?.savedGames || {}).length,
      activeOnlinePlayers: Object.keys(gameState.players).length
    });
    return;
  }

  // Déclenchement manuel de test du cron serveur
  if (url === '/api/cron/tick' && req.method === 'POST') {
    const changesCount = runServerMinuteTick();
    sendJson(res, 200, {
      success: true,
      message: 'Tick cron serveur exécuté avec succès',
      changesCount: changesCount,
      executedAt: new Date().toISOString()
    });
    return;
  }

  // Charger la partie du joueur depuis la BDD
  if (url === '/api/game/load' && req.method === 'GET') {
    const user = getAuthUser(req);
    if (!user) {
      sendJson(res, 401, { success: false, error: 'Connexion requise' });
      return;
    }
    const saved = db.loadGame(user.id);
    sendJson(res, 200, { success: true, save: saved ? saved.data : null, savedAt: saved ? saved.savedAt : null });
    return;
  }

  // Archivage sécurisé avant remise à zéro (Anti fausse manipulation)
  if (url === '/api/game/archive-reset' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const user = getAuthUser(req);
        const userId = user ? user.id : payload.playerId;
        const username = user ? user.username : payload.playerName;
        const snapshot = payload.snapshotData || null;
        const reason = payload.reason || 'Remise à zéro sécurisée';

        const archive = db.archiveAndResetGame(userId, username, reason, snapshot);
        sendJson(res, 200, { success: true, archiveId: archive.id, timestamp: archive.timestamp });
      } catch (err) {
        sendJson(res, 400, { success: false, error: err.message });
      }
    });
    return;
  }

  // Consulter les archives de remise à zéro (Panel Admin)
  if (url === '/api/admin/reset-archives' && req.method === 'GET') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    const archives = db.getResetArchives();
    sendJson(res, 200, { success: true, archives });
    return;
  }

  // Restaurer une archive de remise à zéro vers un joueur (Panel Admin)
  if (url === '/api/admin/restore-archive' && req.method === 'POST') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { archiveId, targetUserId } = JSON.parse(body);
        const result = db.restoreResetArchive(archiveId, targetUserId);
        if (result.error) {
          sendJson(res, 400, { success: false, error: result.error });
        } else {
          broadcastSSE('player_restored', { userId: result.restoredTo });
          sendJson(res, 200, { success: true, ...result });
        }
      } catch (err) {
        sendJson(res, 400, { success: false, error: err.message });
      }
    });
    return;
  }

  // --- API MULTIJOUEUR EN TEMPS RÉEL ---

  // 1. SSE Stream
  if (url === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('retry: 3000\n\n');
    sseClients.push(res);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
    return;
  }

  // 2. Synchronisation de joueur
  if (url === '/api/player/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const player = JSON.parse(body);
        player.lastSeen = Date.now();
        const authUser = getAuthUser(req);
        if (authUser && authUser.discord) {
          player.discord = authUser.discord;
        } else if (player.id && db.data.users) {
          const matchedUser = Object.values(db.data.users).find(u => u.id === player.id);
          if (matchedUser && matchedUser.discord) {
            player.discord = matchedUser.discord;
          }
        }
        gameState.players[player.id] = player;

        // Si timeTracking est envoyé, le sauvegarder dans l'utilisateur en base
        if (player.timeTracking && db.data.users) {
          for (const u of Object.values(db.data.users)) {
            if (u.id === player.id) {
              u.timeTracking = player.timeTracking;
              u.lastLogin = new Date().toISOString();
              break;
            }
          }
        }

        broadcastSSE('player_sync', { player });
        sendJson(res, 200, { success: true, gameState });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 3. État global
  if (url === '/api/state') {
    sendJson(res, 200, gameState);
    return;
  }

  // --- API PANEL ADMIN (Gestion globale des joueurs) ---

  // Liste de tous les joueurs
  if (url === '/api/admin/users' && req.method === 'GET') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    const users = db.getAllUsersForAdmin();
    // Compléter avec les joueurs actifs connectés (gameState.players) qui ne sont pas dans db.users
    const seenUserIds = new Set(users.map(u => u.id));
    if (gameState && gameState.players) {
      Object.values(gameState.players).forEach(p => {
        if (p && p.id && !seenUserIds.has(p.id)) {
          seenUserIds.add(p.id);
          const st0 = (p.stations && p.stations[0]) || null;
          users.push({
            id: p.id,
            username: p.name || 'Directeur d’Antenne',
            role: 'user',
            isBanned: false,
            stationName: st0?.name || 'Antenne Locale',
            city: st0?.city || 'Paris',
            departmentCode: st0?.departmentCode || p.departmentCode || '75',
            createdAt: new Date().toISOString(),
            lastLogin: new Date(p.lastSeen || Date.now()).toISOString(),
            money: 15000,
            volunteersCount: p.volunteersCount || 4,
            vehiclesCount: p.vehiclesCount || 1,
            stationsCount: (p.stations && p.stations.length) || 1,
            missionsCount: 0,
            reputationScore: 50,
            timeTracking: p.timeTracking || null,
            platformStats: p.platformStats || null,
            lastDevice: p.lastDevice || null,
            lastSaved: new Date().toISOString()
          });
        }
      });
    }
    const activeSubs = Object.values(db.data.pushSubscriptions || {});
    users.forEach(u => {
      u.hasPushSubscription = activeSubs.some(s => {
        const pid = String(s.userId || '').toLowerCase();
        const uname = String(s.username || '').toLowerCase();
        return (u.id && pid === String(u.id).toLowerCase()) || (u.username && uname === String(u.username).toLowerCase());
      });
    });

    sendJson(res, 200, { success: true, users, totalPushSubscriptions: activeSubs.length });
    return;
  }

  // Statistiques globales du serveur
  if (url === '/api/admin/stats' && req.method === 'GET') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    const allUsers = Object.values(db.data.users);
    sendJson(res, 200, {
      success: true,
      stats: {
        totalUsers: allUsers.length,
        activeOnline: Object.keys(gameState.players).length,
        alliancesCount: db.data.alliances.length,
        totalSavedGames: Object.keys(db.data.savedGames).length
      }
    });
    return;
  }

  // Admin : Sécurité & Parrainages (Logs de fraude et parrainages)
  if (url === '/api/admin/referrals' && req.method === 'GET') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    const referralData = db.getReferralAdminData();
    sendJson(res, 200, { success: true, ...referralData });
    return;
  }

  // Admin : Action sur un incident de fraude ou un compte parrain
  if (url === '/api/admin/referrals/action' && req.method === 'POST') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { action, targetId, extra } = JSON.parse(body);
        const result = db.processAdminReferralAction(action, targetId, extra || {});
        if (result.error) {
          sendJson(res, 400, { success: false, error: result.error });
        } else {
          broadcastSSE('admin_referral_updated', { action, targetId });
          sendJson(res, 200, { success: true, ...result });
        }
      } catch (err) {
        sendJson(res, 400, { success: false, error: err.message });
      }
    });
    return;
  }

  // Modification d'un joueur par l'admin (argent, mot de passe, ban, rôle)
  if (url === '/api/admin/user/update' && req.method === 'POST') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { userId, ...updates } = JSON.parse(body);
        const result = db.updateUserByAdmin(userId, updates);
        if (result.error) {
          sendJson(res, 400, { success: false, error: result.error });
        } else {
          broadcastSSE('admin_user_updated', { userId, updates });
          sendJson(res, 200, { success: true, user: result.user });
        }
      } catch (err) {
        sendJson(res, 400, { success: false, error: 'Données invalides' });
      }
    });
    return;
  }

  // Suppression d'un joueur par l'admin
  if (url === '/api/admin/user/delete' && req.method === 'POST') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { userId } = JSON.parse(body);
        const result = db.deleteUserByAdmin(userId);
        if (result.error) {
          sendJson(res, 400, { success: false, error: result.error });
        } else {
          sendJson(res, 200, { success: true });
        }
      } catch (err) {
        sendJson(res, 400, { success: false, error: 'Données invalides' });
      }
    });
    return;
  }

  // Alerte / Annonce globale diffusée à tous les joueurs
  if (url === '/api/admin/broadcast' && req.method === 'POST') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message, title, type } = JSON.parse(body);
        broadcastSSE('admin_broadcast', {
          title: title || 'Message de la Direction Nationale',
          message: message,
          type: type || 'blue',
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
        sendJson(res, 200, { success: true });
      } catch (err) {
        sendJson(res, 400, { success: false, error: 'Données invalides' });
      }
    });
    return;
  }

  // Clé publique VAPID pour les Push Notifications du Service Worker
  if ((url === '/api/push/vapid-public-key' || url === '/api/push/key') && req.method === 'GET') {
    const keys = getOrCreateVapidKeys();
    sendJson(res, 200, { success: true, publicKey: keys.publicKey });
    return;
  }

  // Enregistrement d'un abonnement Push (Web & Mobile, PWA)
  if (url === '/api/push/subscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        let endpoint = payload.endpoint;
        let p256dh = payload.p256dh;
        let auth = payload.auth;
        let userId = payload.user_id || payload.userId || payload.playerId;
        let username = payload.username;
        let userAgent = payload.userAgent || payload.user_agent;

        if (payload.subscription) {
          endpoint = endpoint || payload.subscription.endpoint;
          if (payload.subscription.keys) {
            p256dh = p256dh || payload.subscription.keys.p256dh;
            auth = auth || payload.subscription.keys.auth;
          }
        }

        if (!endpoint || !p256dh || !auth) {
          sendJson(res, 400, {
            success: false,
            error: 'Abonnement incomplet : endpoint, p256dh et auth sont requis.'
          });
          return;
        }

        const subRecord = db.savePushSubscription({
          endpoint,
          p256dh,
          auth,
          user_id: userId || null,
          username: username || 'Directeur',
          userAgent: userAgent || ''
        });

        console.log(`📲 [WebPush] Abonnement enregistré pour ${subRecord.username || subRecord.user_id || 'Inconnu'}`);
        sendJson(res, 200, { success: true, registered: true, subscription: subRecord });
      } catch (e) {
        sendJson(res, 400, { success: false, error: e.message });
      }
    });
    return;
  }

  // Désabonnement Push
  if (url === '/api/push/unsubscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { endpoint } = JSON.parse(body);
        if (endpoint) {
          db.deletePushSubscription(endpoint);
        }
        sendJson(res, 200, { success: true, unregistered: true });
      } catch (e) {
        sendJson(res, 400, { success: false, error: e.message });
      }
    });
    return;
  }

  // Émission d'une notification push de test vers un endpoint ou un user_id donné
  if (url === '/api/push/test' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const reqData = JSON.parse(body || '{}');
        const endpoint = reqData.endpoint;
        const userId = reqData.user_id || reqData.userId || reqData.playerId;
        const title = reqData.title || '🚨 TEST NOTIFICATION WEB PUSH';
        const msgBody = reqData.body || reqData.message || 'Notification test reçue avec succès alors que l’application est fermée !';

        let targetSub = null;
        if (endpoint) {
          targetSub = db.getPushSubscription(endpoint);
          if (!targetSub && reqData.p256dh && reqData.auth) {
            targetSub = { endpoint, keys: { p256dh: reqData.p256dh, auth: reqData.auth } };
          }
        } else if (userId) {
          const subs = db.getAllPushSubscriptions();
          targetSub = subs.find(s => (s.user_id === userId || s.userId === userId));
        } else {
          const subs = db.getAllPushSubscriptions();
          targetSub = subs[subs.length - 1]; // Dernier abonné
        }

        if (!targetSub || !targetSub.endpoint) {
          return sendJson(res, 404, {
            success: false,
            error: 'Aucun abonnement push trouvé pour envoyer le test. Veuillez d’abord vous abonner.'
          });
        }

        const notificationPayload = {
          title,
          body: msgBody,
          icon: reqData.icon || '/icons/icon-192x192.png',
          badge: reqData.badge || '/icons/badge-monochrome.png',
          data: Object.assign({ url: '/jeu.html' }, reqData.data || {})
        };

        const delaySec = Math.min(Math.max(0, Number(reqData.delaySeconds) || 0), 300);
        if (delaySec > 0) {
          setTimeout(async () => {
            try {
              await sendSingleWebPush(targetSub, notificationPayload);
            } catch (e) {}
          }, delaySec * 1000);

          return sendJson(res, 200, {
            success: true,
            scheduled: true,
            delaySeconds: delaySec,
            endpoint: targetSub.endpoint,
            recipient: targetSub.username || targetSub.user_id || 'Inconnu'
          });
        }

        const result = await sendSingleWebPush(targetSub, notificationPayload);
        if (result.success) {
          sendJson(res, 200, {
            success: true,
            delivered: true,
            status: result.status,
            endpoint: targetSub.endpoint,
            recipient: targetSub.username || targetSub.user_id || 'Inconnu'
          });
        } else {
          if (result.expired) {
            db.deletePushSubscription(targetSub.endpoint);
          }
          sendJson(res, result.status || 500, {
            success: false,
            error: result.error,
            expired: !!result.expired
          });
        }
      } catch (err) {
        sendJson(res, 400, { success: false, error: err.message });
      }
    });
    return;
  }

  // Planification d'une alerte Web Push différée (fin d'intervention, retour de véhicule, rappel opérationnel app fermée)
  if (url === '/api/push/schedule-event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { eventId, userId, endpoint, delaySeconds, title, body: msgBody, data } = JSON.parse(body || '{}');
        const delay = Math.max(1, Number(delaySeconds) || 60);
        const timerKey = eventId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        if (scheduledPushEvents.has(timerKey)) {
          clearTimeout(scheduledPushEvents.get(timerKey).timeoutId);
        }

        const timeoutId = setTimeout(async () => {
          scheduledPushEvents.delete(timerKey);
          try {
            let targetSub = null;
            if (endpoint) targetSub = db.getPushSubscription(endpoint);
            if (!targetSub && userId) {
              const allSubs = db.getAllPushSubscriptions();
              targetSub = allSubs.find(s => s.user_id === userId || s.userId === userId || s.playerId === userId);
            }
            if (targetSub) {
              await sendSingleWebPush(targetSub, {
                title: title || '🚑 Notification Opérationnelle MyProtec',
                body: msgBody || 'Une opération requiert votre attention.',
                icon: 'icon-192.png',
                badge: 'badge-monochrome.png',
                vibrate: [200, 100, 200],
                data: Object.assign({ url: '/' }, data || {})
              });
              console.log(`[WebPush Server] Alerte différée ${timerKey} envoyée avec succès à ${targetSub.username || targetSub.user_id}`);
            }
          } catch (pushErr) {
            console.warn(`[WebPush Server] Erreur lors de l'envoi différé ${timerKey} :`, pushErr.message || pushErr);
          }
        }, delay * 1000);

        scheduledPushEvents.set(timerKey, { timeoutId, userId, scheduledAt: Date.now(), triggerAt: Date.now() + delay * 1000 });
        sendJson(res, 200, { success: true, scheduled: true, eventId: timerKey, delaySeconds: delay });
      } catch (e) {
        sendJson(res, 400, { success: false, error: e.message });
      }
    });
    return;
  }

  // Annulation d'une alerte différée
  if (url === '/api/push/cancel-scheduled-event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { eventId } = JSON.parse(body || '{}');
        if (eventId && scheduledPushEvents.has(eventId)) {
          clearTimeout(scheduledPushEvents.get(eventId).timeoutId);
          scheduledPushEvents.delete(eventId);
          sendJson(res, 200, { success: true, canceled: true, eventId });
        } else {
          sendJson(res, 200, { success: true, canceled: false, message: 'Événement non trouvé ou déjà exécuté' });
        }
      } catch (e) {
        sendJson(res, 400, { success: false, error: e.message });
      }
    });
    return;
  }

  // Test et émission de notification ciblée vers un joueur spécifique (SSE + Web Push OS)
  if (url === '/api/admin/notify-player' && req.method === 'POST') {
    const user = getAuthUser(req);
    const adminKey = req.headers['x-admin-key'];
    if ((!user || user.role !== 'admin') && adminKey !== 'protec_admin_secret_2026') {
      sendJson(res, 403, { success: false, error: 'Accès réservé aux administrateurs.' });
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { targetUserId, title, message, category, type, testOptions, push } = JSON.parse(body);
        const payloadData = {
          targetUserId: targetUserId || 'all',
          title: title || '🔔 Notification de Test',
          message: message || 'Ceci est une notification de test envoyée par l’Administration.',
          body: message || 'Ceci est une notification de test envoyée par l’Administration.',
          category: category || 'test',
          type: type || 'orange',
          testOptions: testOptions || {},
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-monochrome.png',
          vibrate: [500, 200, 500, 200, 500],
          data: { url: '/jeu.html', category: category || 'test' }
        };

        // 1. Broadcast SSE temps réel (pour les joueurs avec l'application ouverte)
        broadcastSSE('admin_player_notification', payloadData);

        // 2. Déclenchement Web Push natif FCM/Apple (réception MÊME SI LA WEB APP EST FERMÉE)
        let pushDispatched = 0;
        if (push !== false) {
          pushDispatched = await dispatchWebPushToPlayer(targetUserId || 'all', payloadData);
        }

        sendJson(res, 200, {
          success: true,
          deliveredSSE: true,
          pushDispatchedCount: pushDispatched,
          deliveredAt: Date.now()
        });
      } catch (err) {
        sendJson(res, 400, { success: false, error: 'Données invalides' });
      }
    });
    return;
  }

  // 4. Création d'une Alliance
  if (url === '/api/alliances/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const newAlliance = {
          id: `all-${Date.now()}`,
          name: data.name,
          tag: data.tag || 'PC',
          description: data.description || 'Alliance de Protection Civile',
          leaderId: data.playerId,
          leaderName: data.playerName,
          treasury: 1000,
          members: [data.playerId],
          color: data.color || '#FF6600',
          createdAt: new Date().toISOString().split('T')[0]
        };
        db.data.alliances.push(newAlliance);
        if (gameState.players[data.playerId]) {
          gameState.players[data.playerId].allianceId = newAlliance.id;
        }
        db.save();
        broadcastSSE('alliance_created', newAlliance);
        sendJson(res, 200, { success: true, alliance: newAlliance });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 5. Rejoindre une Alliance
  if (url === '/api/alliances/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { playerId, allianceId } = JSON.parse(body);
        const alliance = db.data.alliances.find(a => a.id === allianceId);
        if (alliance && !alliance.members.includes(playerId)) {
          alliance.members.push(playerId);
          if (gameState.players[playerId]) {
            gameState.players[playerId].allianceId = allianceId;
          }
          db.save();
          broadcastSSE('alliance_joined', { playerId, allianceId });
        }
        sendJson(res, 200, { success: true, alliance });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 6. Demande de Renfort Inter-Alliés
  if (url === '/api/alliances/renfort/request' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const renfortReq = {
          id: data.id || `renfort-${Date.now()}`,
          allianceId: data.allianceId || 'alliance-fnpc',
          allianceTag: data.allianceTag || 'UFSC',
          missionId: data.missionId || null,
          missionTitle: data.missionTitle || data.title || '',
          missionLat: data.missionLat || null,
          missionLng: data.missionLng || null,
          missionAddress: data.missionAddress || '',
          requesterPlayerId: data.requesterPlayerId || data.playerId || 'directeur-local',
          requesterName: data.requesterName || data.playerName || data.requestingPlayerName || data.stationName || 'Directeur d’Antenne',
          stationName: data.stationName || 'Antenne Locale',
          departmentCode: String(data.departmentCode || '54'),
          title: data.title || `Renfort pour ${data.missionType || 'Dispositif de Secours'}`,
          desc: data.desc || `Demande de renforts pour couverture opérationnelle.`,
          unitRequested: data.unitRequested || (data.neededCount ? `${data.neededCount} ${data.neededType || 'VPSP'}` : '1 VPSP ou Binôme PSE'),
          requestedVolunteersCount: data.requestedVolunteersCount || data.neededCount || 2,
          requiredVolsCount: data.requiredVolsCount || data.requestedVolunteersCount || data.neededCount || 2,
          requestedVehicles: data.requestedVehicles || [],
          needLabel: data.needLabel || (data.requestedVehicles && data.requestedVehicles.length > 0 ? data.requestedVehicles.join(', ') : 'Renforts'),
          slotsCommitted: 0,
          indemnite: data.indemnite || 180,
          zone: data.zone || 'departemental',
          zoneLabel: data.zoneLabel || 'Départementale',
          status: data.status || 'open',
          createdAt: data.createdAt || new Date().toISOString()
        };
        db.data.renforts.unshift(renfortReq);
        if (db.data.renforts.length > 50) db.data.renforts.pop();
        db.save();
        broadcastSSE('renfort_requested', renfortReq);
        sendJson(res, 200, { success: true, renfort: renfortReq });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 6b. Diffusion et Synchronisation des Crises Départementales Partagées
  if (url === '/api/crises/department/broadcast' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const deptCode = String(payload.departmentCode || payload.crisisData?.departmentCode || '54');
        if (!db.data.department_crises) db.data.department_crises = {};
        db.data.department_crises[deptCode] = payload.crisisData;
        db.save();
        broadcastSSE('department_crisis_alert', payload);
        sendJson(res, 200, { success: true, departmentCode: deptCode });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  if (url.startsWith('/api/crises/department/') && req.method === 'GET') {
    const deptCode = String(url.split('/').pop() || '54');
    const crisis = (db.data.department_crises || {})[deptCode] || null;
    sendJson(res, 200, { success: true, crisis });
    return;
  }

  // 7. Fournir un Renfort à un Allié
  if (url === '/api/alliances/renfort/fulfill' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const renfortId = payload.renfortId;
        const renfort = db.data.renforts.find(r => r.id === renfortId);
        if (renfort) {
          renfort.status = payload.status || 'fulfilled';
          renfort.slotsCommitted = (renfort.slotsCommitted || 0) + (payload.volunteersCount || 1);
          if (!renfort.contributions) renfort.contributions = [];
          renfort.contributions.push({
            contributorId: payload.providerPlayerId || payload.contributorId,
            contributorName: payload.providerName || payload.contributorName,
            stationName: payload.stationName,
            volunteersCount: payload.volunteersCount || 1,
            vehicleName: payload.vehicleName || payload.unitDetails,
            timestamp: Date.now()
          });
          renfort.fulfilledBy = {
            providerPlayerId: payload.providerPlayerId,
            providerName: payload.providerName,
            unitDetails: payload.unitDetails || payload.vehicleName
          };
          db.save();
          broadcastSSE('renfort_fulfilled', Object.assign({}, renfort, payload));
        }
        sendJson(res, 200, { success: true, renfort });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 7b. Annuler / Retirer une demande de Renfort
  if (url === '/api/alliances/renfort/cancel' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { renfortId } = JSON.parse(body);
        db.data.renforts = (db.data.renforts || []).filter(r => r.id !== renfortId);
        db.save();
        broadcastSSE('renfort_cancelled', { id: renfortId });
        sendJson(res, 200, { success: true, renfortId });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 8. Proposer une Formation Spéciale
  if (url === '/api/alliances/formation/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const form = JSON.parse(body);
        form.id = `form-spec-${Date.now()}`;
        form.status = 'open';
        form.registeredCandidates = [];
        db.data.formationsSpeciales.unshift(form);
        db.save();
        broadcastSSE('formation_created', form);
        sendJson(res, 200, { success: true, formation: form });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 9. Inscrire un bénévole à une formation spéciale alliée
  if (url === '/api/alliances/formation/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { formationId, volunteerName, playerName, candidateRank } = JSON.parse(body);
        const formation = db.data.formationsSpeciales.find(f => f.id === formationId);
        if (formation && formation.registeredCandidates.length < formation.maxCandidates) {
          formation.registeredCandidates.push({ volunteerName, playerName, candidateRank });
          db.save();
          broadcastSSE('formation_registered', { formationId, candidate: { volunteerName, playerName } });
        }
        sendJson(res, 200, { success: true, formation });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 10. Message Chat Radio Alliance
  if (url === '/api/alliances/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const msg = JSON.parse(body);
        msg.id = `msg-${Date.now()}`;
        msg.time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const authUser = getAuthUser(req);
        if (authUser && authUser.discord) {
          msg.senderDiscord = authUser.discord;
        } else if (msg.senderId && db.data.users) {
          const matchedUser = Object.values(db.data.users).find(u => u.id === msg.senderId);
          if (matchedUser && matchedUser.discord) {
            msg.senderDiscord = matchedUser.discord;
          }
        }
        db.data.chatMessages.push(msg);
        if (db.data.chatMessages.length > 50) db.data.chatMessages.shift();
        db.save();
        broadcastSSE('chat_message', msg);
        sendJson(res, 200, { success: true, message: msg });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 11. Bourse Fédérale : Créer une offre (Vente, Don, Échange)
  if (url === '/api/alliances/marketplace/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const offer = JSON.parse(body);
        offer.id = offer.id || `mkt-${Date.now()}`;
        db.data.marketplace = db.data.marketplace || [];
        db.data.marketplace.unshift(offer);
        if (db.data.marketplace.length > 50) db.data.marketplace.pop();
        db.save();
        broadcastSSE('marketplace_created', offer);
        sendJson(res, 200, { success: true, offer });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 12. Bourse Fédérale : Supprimer / Retirer une offre
  if (url === '/api/alliances/marketplace/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { offerId } = JSON.parse(body);
        db.data.marketplace = (db.data.marketplace || []).filter(o => o.id !== offerId);
        db.save();
        broadcastSSE('marketplace_deleted', { offerId });
        sendJson(res, 200, { success: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 13. Événements Communautaires : Proposer un Événement
  if (url === '/api/alliances/events/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        event.id = event.id || `evt-comm-${Date.now()}`;
        db.data.communityEvents = db.data.communityEvents || [];
        db.data.communityEvents.unshift(event);
        if (db.data.communityEvents.length > 30) db.data.communityEvents.pop();
        db.save();
        broadcastSSE('community_event_created', event);
        sendJson(res, 200, { success: true, event });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 14. Événements Communautaires : Participer à un Événement
  if (url === '/api/alliances/events/participate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { eventId, playerId } = JSON.parse(body);
        const event = (db.data.communityEvents || []).find(e => e.id === eventId);
        if (event) {
          event.registeredAntennas = event.registeredAntennas || [];
          if (!event.registeredAntennas.some(a => a.playerId === playerId)) {
            event.registeredAntennas.push({ playerId, at: new Date().toISOString() });
            db.save();
            broadcastSSE('community_event_participated', { eventId, playerId });
          }
        }
        sendJson(res, 200, { success: true, event });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 15. Transfert / Don d'Écusson
  if (url === '/api/alliances/badges/transfer' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { badge, fromPlayerId, toStationId } = JSON.parse(body);
        broadcastSSE('badge_transferred', { badge, fromPlayerId, toStationId });
        sendJson(res, 200, { success: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 16. Admin : Valider un Événement Proposé (avec modifications éventuelles)
  if (url === '/api/admin/events/approve' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { eventId, updatedData } = JSON.parse(body);
        db.data.communityEvents = db.data.communityEvents || [];
        const index = db.data.communityEvents.findIndex(e => e.id === eventId);
        if (index !== -1) {
          const current = db.data.communityEvents[index];
          const merged = { ...current, ...(updatedData || {}), status: 'open', approvedAt: new Date().toISOString() };
          db.data.communityEvents[index] = merged;
          db.save();
          broadcastSSE('community_event_approved', { event: merged });
          sendJson(res, 200, { success: true, event: merged });
        } else {
          sendJson(res, 404, { error: 'Événement introuvable' });
        }
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 17. Admin : Modifier toutes les informations d'un Événement (Adresse, Indemnisation, Écusson, Moyens...)
  if (url === '/api/admin/events/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { eventId, updatedData } = JSON.parse(body);
        db.data.communityEvents = db.data.communityEvents || [];
        const index = db.data.communityEvents.findIndex(e => e.id === eventId);
        if (index !== -1) {
          const current = db.data.communityEvents[index];
          const merged = { ...current, ...(updatedData || {}), id: eventId, updatedAt: new Date().toISOString() };
          db.data.communityEvents[index] = merged;
          db.save();
          broadcastSSE('community_event_updated', { event: merged });
          sendJson(res, 200, { success: true, event: merged });
        } else {
          sendJson(res, 404, { error: 'Événement introuvable' });
        }
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 18. Admin : Refuser un Événement Proposé
  if (url === '/api/admin/events/reject' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { eventId, reason } = JSON.parse(body);
        db.data.communityEvents = db.data.communityEvents || [];
        const event = db.data.communityEvents.find(e => e.id === eventId);
        if (event) {
          event.status = 'rejected';
          event.rejectionReason = reason || 'Non conforme aux critères opérationnels';
          db.save();
          broadcastSSE('community_event_rejected', { eventId, reason: event.rejectionReason });
          sendJson(res, 200, { success: true, event });
        } else {
          sendJson(res, 404, { error: 'Événement introuvable' });
        }
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 19. Admin : Créer un nouvel Événement Fédéral Officiel
  if (url === '/api/admin/events/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const eventData = JSON.parse(body);
        eventData.id = eventData.id || `ev-admin-${Date.now()}`;
        eventData.status = eventData.status || 'open';
        eventData.createdAt = new Date().toISOString();
        eventData.participants = eventData.participants || [];
        db.data.communityEvents = db.data.communityEvents || [];
        db.data.communityEvents.unshift(eventData);
        db.save();
        broadcastSSE('community_event_approved', { event: eventData });
        sendJson(res, 200, { success: true, event: eventData });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 20. Admin : Supprimer un Événement
  if (url === '/api/admin/events/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { eventId } = JSON.parse(body);
        db.data.communityEvents = (db.data.communityEvents || []).filter(e => e.id !== eventId);
        db.save();
        sendJson(res, 200, { success: true, eventId });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 21. Admin : Lecture des catalogues personnalisés (Véhicules, Matériel, Écussons)
  if (url === '/api/admin/catalogs' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      vehicles: db.data.customVehicleCatalog || null,
      equipments: db.data.customEquipmentCatalog || null,
      badges: db.data.customBadgesCatalog || null,
      events: db.data.communityEvents || []
    });
    return;
  }

  // 22. Admin : Sauvegarde des catalogues personnalisés
  if (url === '/api/admin/catalogs/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.vehicles !== undefined) db.data.customVehicleCatalog = payload.vehicles;
        if (payload.equipments !== undefined) db.data.customEquipmentCatalog = payload.equipments;
        if (payload.badges !== undefined) db.data.customBadgesCatalog = payload.badges;
        db.save();
        broadcastSSE('catalogs_updated', {
          vehicles: db.data.customVehicleCatalog,
          equipments: db.data.customEquipmentCatalog,
          badges: db.data.customBadgesCatalog
        });
        sendJson(res, 200, { success: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 23. Admin : Attribuer un Écusson à un Directeur / Joueur
  if (url === '/api/admin/badges/award' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { userId, badge, quantity = 1, notify = true } = JSON.parse(body);
        if (db.data.savedGames[userId]) {
          const gameData = db.data.savedGames[userId].data;
          if (gameData) {
            gameData.ecussons = gameData.ecussons || [];
            gameData.localEcussons = gameData.localEcussons || [];

            // 1. localEcussons
            const existingLoc = gameData.localEcussons.find(l => l.code === badge.code);
            if (existingLoc) {
              existingLoc.quantite = (existingLoc.quantite || 1) + Number(quantity || 1);
            } else {
              gameData.localEcussons.push({ code: badge.code, quantite: Number(quantity || 1) });
            }

            // 2. ecussons array
            const existingEc = gameData.ecussons.find(e => e.code === badge.code);
            if (existingEc) {
              existingEc.quantite = (existingEc.quantite || 1) + Number(quantity || 1);
              existingEc.updatedAt = new Date().toISOString();
            } else {
              gameData.ecussons.push({
                id: badge.id || `badge-${Date.now()}`,
                code: badge.code,
                nom: badge.nom || badge.name,
                imageUrl: badge.imageUrl,
                rarete: badge.rarete || badge.rarity || 'commun',
                quantite: Number(quantity || 1),
                acquiredAt: new Date().toISOString()
              });
            }
            db.save();
          }
        }
        broadcastSSE('badge_awarded', { userId, badge, quantity, notify });
        sendJson(res, 200, { success: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 24. Admin : Retirer / Réduire un Écusson d'un Joueur
  if (url === '/api/admin/badges/revoke' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { userId, badgeCode, quantity = 1, removeAll = false } = JSON.parse(body);
        if (db.data.savedGames[userId]) {
          const gameData = db.data.savedGames[userId].data;
          if (gameData) {
            if (gameData.localEcussons) {
              const loc = gameData.localEcussons.find(l => l.code === badgeCode);
              if (loc) {
                if (removeAll || loc.quantite <= quantity) {
                  gameData.localEcussons = gameData.localEcussons.filter(l => l.code !== badgeCode);
                } else {
                  loc.quantite -= Number(quantity || 1);
                }
              }
            }
            if (gameData.ecussons) {
              const ec = gameData.ecussons.find(e => e.code === badgeCode);
              if (ec) {
                if (removeAll || (ec.quantite || 1) <= quantity) {
                  gameData.ecussons = gameData.ecussons.filter(e => e.code !== badgeCode);
                } else {
                  ec.quantite = (ec.quantite || 1) - Number(quantity || 1);
                }
              }
            }
            db.save();
          }
        }
        broadcastSSE('badge_revoked', { userId, badgeCode });
        sendJson(res, 200, { success: true });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // --- SERVEUR DE FICHIERS STATIQUES & ROUTES APPLICATIVES ---
  let targetFile = url === '/' ? 'index.html' : url;
  if (url === '/jeu' || url === '/myprotec/jeu' || url === '/game' || url === '/simulateur') {
    targetFile = 'jeu.html';
  } else if (url === '/privacy' || url === '/politique-confidentialite' || url === '/mentions-legales') {
    targetFile = 'privacy.html';
  } else if (url === '/ecussons' || url === '/collections' || url === '/badges') {
    targetFile = 'ecussons.html';
  }
  let filePath = path.join(__dirname, targetFile);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Accès interdit');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('Fichier non trouvé');
      } else {
        res.writeHead(500);
        res.end(`Erreur serveur: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.warn(`Le port ${PORT} est déjà utilisé. Essai automatique sur le port ${PORT + 1}...`);
    PORT++;
    server.listen(PORT, '0.0.0.0');
  } else {
    console.error('Erreur serveur:', e);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Protec Live Multijoueur actif sur http://0.0.0.0:${PORT} (ou http://localhost:${PORT})`);
});

// =========================================================================
// MOTEUR DE FOND CRON 24H/24 (Avancement Autonome des Parties Hors-Ligne)
// =========================================================================

let lastCronTickTime = null;

function runServerMinuteTick() {
  const now = Date.now();
  lastCronTickTime = now;
  let hasGlobalChanges = false;
  let totalChangesProcessed = 0;

  // 1. Gestion des parties des joueurs hors-ligne (inactifs depuis plus de 2 minutes)
  if (db.data && db.data.savedGames) {
    Object.entries(db.data.savedGames).forEach(([userId, saveEntry]) => {
      const gameData = saveEntry?.data;
      if (!gameData) return;

      // Détection de l'activité du joueur : s'il est en ligne, son navigateur gère déjà le jeu
      const lastSeen = gameState.players[userId]?.lastSeen || 0;
      const isPlayerOnline = (now - lastSeen) < 120000;
      if (isPlayerOnline) return;

      let hasPlayerChanges = false;

      // a. Avancement des opérations de chargement / déchargement logistique (Kits VTU)
      if (Array.isArray(gameData.vehicles)) {
        gameData.vehicles.forEach(veh => {
          if (veh.logOperation) {
            const elapsed = Math.floor((now - veh.logOperation.startTime) / 1000);
            if (elapsed >= (veh.logOperation.durationSec || 120)) {
              if (veh.logOperation.type === 'loading') {
                veh.logKit = veh.logOperation.kitId;
              } else if (veh.logOperation.type === 'unloading') {
                veh.logKit = null;
              }
              veh.logOperation = null;
              veh.status = 'dispo';
              hasPlayerChanges = true;
              totalChangesProcessed++;
            }
          }
        });
      }

      // b. Gestion des ateliers de réarmement (missions de réarmement)
      if (Array.isArray(gameData.missions)) {
        gameData.missions.forEach(m => {
          if ((m.isRearmentWorkshop || m.isRearmamentWorkshop) && (m.status === 'ongoing' || m.status === 'en_cours')) {
            const regCount = Math.max(1, (m.registeredVolunteers || []).length);
            const effectiveMinutes = Math.max(10, Math.round((m.baseWorkMinutes || 60) / regCount));
            if (m.startTime && (now - m.startTime) >= effectiveMinutes * 60000) {
              m.status = 'completed';
              (m.targetVehicleIds || []).forEach(vId => {
                const targetV = (gameData.vehicles || []).find(v => v.id === vId);
                if (targetV) {
                  targetV.armementLevel = 100;
                  targetV.isRearmed = true;
                  targetV.needsRearming = false;
                  targetV.a_rearme = false;
                }
              });
              // Libérer les bénévoles inscrits
              (m.registeredVolunteers || []).forEach(volId => {
                const vol = (gameData.volunteers || []).find(v => v.id === volId);
                if (vol && vol.status === 'mission') {
                  vol.status = 'disponible';
                  vol.assignedMissionId = null;
                }
              });
              hasPlayerChanges = true;
              totalChangesProcessed++;
            }
          }
        });
      }

      // c. Avancement et fin des missions classiques (DPS, SAMU, etc.)
      if (Array.isArray(gameData.missions)) {
        gameData.missions.forEach(m => {
          if (m.status === 'ongoing' || m.status === 'en_cours' || m.status === 'dispatched') {
            const isCrisis = Boolean(m.isCrisis || ['crise', 'pompiers', 'samu', 'meteo'].includes(m.type));
            if (!isCrisis) {
              const endsAt = m.endsAt || (m.startedAt ? m.startedAt + ((m.durationSeconds || 1800) * 1000) : null);
              if (endsAt && now >= endsAt) {
                m.status = 'completed';
                // Libérer les véhicules engagés
                (m.assignedVehicleIds || []).forEach(vehId => {
                  const veh = (gameData.vehicles || []).find(v => v.id === vehId);
                  if (veh && veh.status !== 'indispo') {
                    veh.status = 'dispo';
                    veh.assignedMissionId = null;
                  }
                });
                // Libérer les bénévoles engagés
                (m.registeredVolunteers || []).forEach(volId => {
                  const vol = (gameData.volunteers || []).find(v => v.id === volId);
                  if (vol && vol.status !== 'indisponible') {
                    vol.status = 'disponible';
                    vol.assignedMissionId = null;
                  }
                });
                // Rémunération de la mission si devis/budget
                const payout = m.budget || m.totalPrice || m.price || 0;
                if (payout > 0 && gameData.resources) {
                  gameData.resources.money = (gameData.resources.money || 0) + payout;
                }
                hasPlayerChanges = true;
                totalChangesProcessed++;
              }
            } else if (m.crisisCanClose) {
              // Si la crise a été déclarée prête à clore par le COS
              m.status = 'completed';
              (m.assignedVehicleIds || []).forEach(vehId => {
                const veh = (gameData.vehicles || []).find(v => v.id === vehId);
                if (veh) {
                  veh.status = 'dispo';
                  veh.assignedMissionId = null;
                }
              });
              (m.registeredVolunteers || []).forEach(volId => {
                const vol = (gameData.volunteers || []).find(v => v.id === volId);
                if (vol) {
                  vol.status = 'disponible';
                  vol.assignedMissionId = null;
                }
              });
              hasPlayerChanges = true;
              totalChangesProcessed++;
            }
          }
        });
      }

      // d. Résolution des véhicules en transit de retour vers la base
      if (Array.isArray(gameData.vehicles)) {
        gameData.vehicles.forEach(veh => {
          if (veh.status === 'transit') {
            const activeMiss = (gameData.missions || []).find(m => m.id === veh.assignedMissionId && (m.status === 'ongoing' || m.status === 'en_cours'));
            if (!activeMiss) {
              veh.status = 'dispo';
              veh.assignedMissionId = null;
              hasPlayerChanges = true;
              totalChangesProcessed++;
            }
          }
        });
      }

      // e. Résolution des secouristes en transit ou au repos
      if (Array.isArray(gameData.volunteers)) {
        gameData.volunteers.forEach(vol => {
          if (vol.status === 'transit') {
            const activeMiss = (gameData.missions || []).find(m => m.id === vol.assignedMissionId && (m.status === 'ongoing' || m.status === 'en_cours'));
            if (!activeMiss) {
              vol.status = 'disponible';
              vol.assignedMissionId = null;
              hasPlayerChanges = true;
              totalChangesProcessed++;
            }
          }
          // Récupération progressive de l'énergie au repos en base (+1% / min jusqu'à 100)
          if ((vol.status === 'disponible' || vol.status === 'dispo') && (vol.energy !== undefined) && vol.energy < 100) {
            vol.energy = Math.min(100, (vol.energy || 90) + 1);
            hasPlayerChanges = true;
          }
        });
      }

      // f. Avancement de l'horloge interne de la partie
      if (gameData.clock) {
        let m = (gameData.clock.minute || 0) + 1;
        let h = gameData.clock.hour || 8;
        let d = gameData.clock.day || 1;
        let mo = gameData.clock.month || 1;
        let y = gameData.clock.year || 2026;

        if (m >= 60) {
          m = 0;
          h += 1;
          if (h >= 24) {
            h = 0;
            d += 1;
            if (d > 30) {
              d = 1;
              mo += 1;
              if (mo > 12) {
                mo = 1;
                y += 1;
              }
            }
          }
        }
        gameData.clock.minute = m;
        gameData.clock.hour = h;
        gameData.clock.day = d;
        gameData.clock.month = mo;
        gameData.clock.year = y;
        gameData.clock.second = 0;
        hasPlayerChanges = true;
      }

      if (hasPlayerChanges) {
        saveEntry.savedAt = new Date().toISOString();
        hasGlobalChanges = true;
      }
    });
  }

  // 2. Nettoyage et maintenance du réseau d'Alliance (renforts expirés, joueurs déconnectés)
  if (Array.isArray(db.data?.renforts)) {
    const renfortsBefore = db.data.renforts.length;
    // Les demandes ouvertes depuis plus de 72h réelles sans réponse sont archivées
    db.data.renforts = db.data.renforts.filter(r => {
      if (r.status === 'open' && r.createdAt) {
        const ageHours = (now - new Date(r.createdAt).getTime()) / (1000 * 3600);
        return ageHours < 72;
      }
      return true;
    });
    if (db.data.renforts.length !== renfortsBefore) hasGlobalChanges = true;
  }

  // Nettoyage des joueurs inactifs en mémoire vive (> 30 min)
  Object.keys(gameState.players).forEach(pId => {
    if (now - (gameState.players[pId].lastSeen || 0) > 1800000) {
      delete gameState.players[pId];
      hasGlobalChanges = true;
    }
  });

  // 3. Bilan quotidien de Trésorerie & Activité à 00h00 heure française (une seule fois par jour)
  try {
    const frDateFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const frParts = {};
    frDateFormatter.formatToParts(new Date(now)).forEach(pt => frParts[pt.type] = pt.value);
    const frHour = parseInt(frParts.hour, 10);
    const frMinute = parseInt(frParts.minute, 10);
    const frTodayKey = `${frParts.year}-${frParts.month}-${frParts.day}`;

    if (frHour === 0 && frMinute === 0) {
      if (db.data && db.data.savedGames) {
        Object.entries(db.data.savedGames).forEach(([userId, saveEntry]) => {
          const gameData = saveEntry?.data;
          if (!gameData) return;
          if (gameData.lastDailyFinanceReport !== frTodayKey) {
            gameData.lastDailyFinanceReport = frTodayKey;
            const moneyVal = Math.round(gameData.resources?.money || 0);
            if (!Array.isArray(gameData.pending_notifications)) gameData.pending_notifications = [];
            gameData.pending_notifications.push({
              title: 'Trésorerie & Bilan d’Activité',
              message: `Bilan quotidien de votre antenne à 00h00. Trésorerie disponible : ${moneyVal.toLocaleString('fr-FR')} €. Votre antenne est prête pour une nouvelle journée opérationnelle.`,
              category: 'finances',
              type: 'blue',
              created_at: new Date().toISOString()
            });
            hasGlobalChanges = true;
          }
        });
      }
    }
  } catch (errBilan) {
    console.warn('Erreur cron bilan minuit:', errBilan);
  }

  if (hasGlobalChanges) {
    db.save();
    broadcastSSE('stations_updated', { allianceStations: gameState.allianceStations });
  }

  return totalChangesProcessed;
}

// Lancement automatique du cron toutes les 60 secondes (60 000 ms)
const SERVER_CRON_INTERVAL_MS = 60000;
setInterval(runServerMinuteTick, SERVER_CRON_INTERVAL_MS);
console.log('[CRON SERVEUR 24H/24] Moteur autonome initialisé (cycle toutes les 60 secondes).');
