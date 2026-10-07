const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = parseInt(process.env.PORT || '8080', 10);
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// --- ÉTAT MULTIJOUEUR EN MÉMOIRE DU SERVEUR ---
const gameState = {
  players: {}, // id -> { id, name, allianceId, stations: [], volunteersCount, vehiclesCount, lastSeen }
  alliances: [
    {
      id: 'alliance-fnpc',
      name: 'Union Fédérale de Sécurité Civile',
      tag: 'UFSC',
      description: 'Alliance fondatrice pour l’entraide opérationnelle, les renforts NOVI et les stages de cadres.',
      leaderId: 'system',
      leaderName: 'Direction Nationale',
      treasury: 8500,
      members: ['system-p1', 'system-p2'],
      color: '#002E6D',
      createdAt: '2026-10-01'
    }
  ],
  // Antennes d'alliés simulés pour que la carte soit vivante dès le départ
  allianceStations: [
    {
      id: 'station-allie-92',
      playerId: 'system-p1',
      playerName: 'Cdt. Thomas (PC 92)',
      name: 'Antenne Hauts-de-Seine (Boulogne)',
      city: 'paris',
      lat: 48.8397,
      lng: 2.2399,
      level: 2,
      vehicles: 3,
      volunteers: 12,
      allianceId: 'alliance-fnpc'
    },
    {
      id: 'station-allie-93',
      playerId: 'system-p2',
      playerName: 'Cap. Sophie (PC 93)',
      name: 'Antenne Seine-Saint-Denis (Saint-Denis)',
      city: 'paris',
      lat: 48.9362,
      lng: 2.3574,
      level: 2,
      vehicles: 2,
      volunteers: 10,
      allianceId: 'alliance-fnpc'
    }
  ],
  renforts: [],
  formationsSpeciales: [
    {
      id: 'form-spec-1',
      organizerPlayerId: 'system-p1',
      organizerName: 'Cdt. Thomas (PC 92)',
      allianceId: 'alliance-fnpc',
      title: 'Stage Fédéral : Chef de Dispositif (CD) & Commandement',
      type: 'CD',
      desc: 'Formation de coordination d’envergure inter-antennes avec simulation de Poste de Commandement.',
      stationName: 'Antenne Boulogne (PC 92)',
      costPerCandidate: 250,
      maxCandidates: 6,
      registeredCandidates: [
        { volunteerName: 'Julien Bernard', playerName: 'PC 93' }
      ],
      durationDays: 3,
      status: 'open'
    },
    {
      id: 'form-spec-2',
      organizerPlayerId: 'system-p2',
      organizerName: 'Cap. Sophie (PC 93)',
      allianceId: 'alliance-fnpc',
      title: 'Stage Spécial : Conduite d’Urgence VPSP & Tout-Terrain',
      type: 'VPSP_PILOT',
      desc: 'Habilitation conduite rapide en convoi et franchissement.',
      stationName: 'Antenne Saint-Denis (PC 93)',
      costPerCandidate: 120,
      maxCandidates: 8,
      registeredCandidates: [],
      durationDays: 2,
      status: 'open'
    }
  ],
  chatMessages: [
    {
      id: 'msg-1',
      senderName: 'Cdt. Thomas (PC 92)',
      allianceId: 'alliance-fnpc',
      text: 'Bienvenue aux nouvelles antennes dans l’Union Fédérale. Dispo pour renforts VPSP sur les gros DPS de fin de semaine !',
      time: '08:15'
    }
  ]
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

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, gameState }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 3. État global
  if (url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(gameState));
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
        gameState.alliances.push(newAlliance);
        if (gameState.players[data.playerId]) {
          gameState.players[data.playerId].allianceId = newAlliance.id;
        }
        broadcastSSE('alliance_created', newAlliance);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, alliance: newAlliance }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
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
        const alliance = gameState.alliances.find(a => a.id === allianceId);
        if (alliance && !alliance.members.includes(playerId)) {
          alliance.members.push(playerId);
          if (gameState.players[playerId]) {
            gameState.players[playerId].allianceId = allianceId;
          }
          broadcastSSE('alliance_joined', { playerId, allianceId });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, alliance }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
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
        const renfort = JSON.parse(body);
        renfort.id = `renf-${Date.now()}`;
        renfort.createdAt = Date.now();
        renfort.status = 'open'; // open, fulfilled, closed
        gameState.renforts.unshift(renfort);
        broadcastSSE('renfort_requested', renfort);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, renfort }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
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
        const renfort = gameState.renforts.find(r => r.id === renfortId);
        if (renfort) {
          renfort.status = 'fulfilled';
          renfort.fulfilledBy = { providerPlayerId, providerName, unitDetails };
          broadcastSSE('renfort_fulfilled', renfort);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, renfort }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
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
        gameState.formationsSpeciales.unshift(form);
        broadcastSSE('formation_created', form);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, formation: form }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
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
        const formation = gameState.formationsSpeciales.find(f => f.id === formationId);
        if (formation && formation.registeredCandidates.length < formation.maxCandidates) {
          formation.registeredCandidates.push({ volunteerName, playerName, candidateRank });
          broadcastSSE('formation_registered', { formationId, candidate: { volunteerName, playerName } });
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, formation }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
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
        gameState.chatMessages.push(msg);
        if (gameState.chatMessages.length > 50) gameState.chatMessages.shift();
        broadcastSSE('chat_message', msg);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: msg }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
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
    server.listen(PORT);
  } else {
    console.error('Erreur serveur:', e);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur Protec Live Multijoueur actif sur http://0.0.0.0:${PORT} (ou http://localhost:${PORT})`);
});
