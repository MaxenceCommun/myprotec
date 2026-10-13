const http = require('http');
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
          referral_suspended: !!user.referral_suspended
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
          stations: gameData.stations || [],
          departmentCode: user.departmentCode || (gameData.player && gameData.player.departmentCode),
          allianceId: (gameData.player && gameData.player.allianceId) || 'alliance-fnpc',
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
            lastSaved: new Date().toISOString()
          });
        }
      });
    }
    sendJson(res, 200, { success: true, users });
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
          requesterPlayerId: data.requesterPlayerId || data.playerId || 'directeur-local',
          requesterName: data.requesterName || data.playerName || data.requestingPlayerName || data.stationName || 'Directeur d’Antenne',
          stationName: data.stationName || 'Antenne Locale',
          title: data.title || `Renfort pour ${data.missionType || 'Dispositif de Secours'}`,
          desc: data.desc || `Demande de renforts pour couverture opérationnelle.`,
          unitRequested: data.unitRequested || (data.neededCount ? `${data.neededCount} ${data.neededType || 'VPSP'}` : '1 VPSP ou Binôme PSE'),
          requestedVolunteersCount: data.requestedVolunteersCount || data.neededCount || 2,
          requestedVehicles: data.requestedVehicles || [],
          indemnite: data.indemnite || 180,
          zone: data.zone || 'departemental',
          zoneLabel: data.zoneLabel || 'Départementale',
          status: data.status || 'open',
          createdAt: data.createdAt || new Date().toISOString()
        };
        db.data.renforts.unshift(renfortReq);
        if (db.data.renforts.length > 30) db.data.renforts.pop();
        db.save();
        broadcastSSE('renfort_requested', renfortReq);
        sendJson(res, 200, { success: true, renfort: renfortReq });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
    });
    return;
  }

  // 7. Fournir un Renfort à un Allié
  if (url === '/api/alliances/renfort/fulfill' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { renfortId, providerPlayerId, providerName, unitDetails } = JSON.parse(body);
        const renfort = db.data.renforts.find(r => r.id === renfortId);
        if (renfort) {
          renfort.status = 'fulfilled';
          renfort.fulfilledBy = { providerPlayerId, providerName, unitDetails };
          db.save();
          broadcastSSE('renfort_fulfilled', renfort);
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
        const { userId, badge } = JSON.parse(body);
        if (db.data.savedGames[userId]) {
          const gameData = db.data.savedGames[userId].data;
          if (gameData) {
            gameData.ecussons = gameData.ecussons || [];
            gameData.ecussons.push({
              id: badge.id || `badge-${Date.now()}`,
              code: badge.code,
              nom: badge.nom || badge.name,
              imageUrl: badge.imageUrl,
              rarete: badge.rarete || badge.rarity || 'commun',
              acquiredAt: new Date().toISOString()
            });
            db.save();
          }
        }
        broadcastSSE('badge_awarded', { userId, badge });
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
