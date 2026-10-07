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
    const list = [...db.data.allianceStations];
    // Fusionner les antennes de tous les joueurs en ligne
    Object.values(this.players).forEach(p => {
      if (p && p.stations && Array.isArray(p.stations)) {
        p.stations.forEach(st => {
          list.push({
            id: st.id,
            playerId: p.id,
            playerName: p.name || 'Directeur d’Antenne',
            name: st.name,
            city: st.city,
            lat: st.lat,
            lng: st.lng,
            level: st.level || 1,
            vehicles: st.vehiclesCount || 1,
            volunteers: st.volunteersCount || 4,
            allianceId: p.allianceId || 'alliance-fnpc'
          });
        });
      }
    });
    return list;
  },
  get renforts() { return db.data.renforts; },
  get formationsSpeciales() { return db.data.formationsSpeciales; },
  get chatMessages() { return db.data.chatMessages; }
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

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth-token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    res.end();
    return;
  }

  // --- API AUTHENTIFICATION & BASE DE DONNÉES ---

  // Inscription
  if (url === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { username, password, stationName, city } = JSON.parse(body);
        const result = db.registerUser(username, password, stationName, city);
        if (result.error) {
          sendJson(res, 400, { success: false, error: result.error });
        } else {
          sendJson(res, 201, result);
        }
      } catch (err) {
        sendJson(res, 400, { success: false, error: 'Données invalides' });
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
        const result = db.loginUser(username, password);
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
      sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role || 'user',
          stationName: user.stationName,
          city: user.city
        }
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
          id: `renfort-${Date.now()}`,
          allianceId: data.allianceId,
          requestingPlayerId: data.playerId,
          requestingPlayerName: data.playerName,
          stationName: data.stationName,
          missionType: data.missionType || 'DPS Envergure',
          neededType: data.neededType || 'VPSP', // VPSP, SECU, CADRE
          neededCount: data.neededCount || 1,
          createdAt: new Date().toISOString(),
          status: 'pending' // pending, fulfilled
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

  // --- SERVEUR DE FICHIERS STATIQUES ---
  let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
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
