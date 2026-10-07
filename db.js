const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'protec_database.json');

// Création du dossier data si inexistant
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error('Erreur création dossier data:', e);
  }
}

// État initial de la BDD
const defaultDb = {
  users: {},         // usernameLower -> { id, username, passwordHash, salt, stationName, city, createdAt, lastLogin }
  sessions: {},      // token -> { userId, username, createdAt, expiresAt }
  savedGames: {},    // userId -> { savedAt, data }
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

class Database {
  constructor() {
    this.data = this.load();
    this.saveTimeout = null;
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // Fusionne avec les valeurs par défaut
        return {
          ...defaultDb,
          ...parsed,
          users: parsed.users || {},
          sessions: parsed.sessions || {},
          savedGames: parsed.savedGames || {},
          alliances: parsed.alliances && parsed.alliances.length ? parsed.alliances : defaultDb.alliances,
          allianceStations: parsed.allianceStations && parsed.allianceStations.length ? parsed.allianceStations : defaultDb.allianceStations,
          formationsSpeciales: parsed.formationsSpeciales && parsed.formationsSpeciales.length ? parsed.formationsSpeciales : defaultDb.formationsSpeciales,
          chatMessages: parsed.chatMessages && parsed.chatMessages.length ? parsed.chatMessages : defaultDb.chatMessages
        };
      } catch (e) {
        console.error('Erreur lecture BDD, utilisation état par défaut:', e);
      }
    }
    return JSON.parse(JSON.stringify(defaultDb));
  }

  // Sauvegarde asynchrone sécurisée (écriture atomique pour éviter toute corruption)
  save() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        const tmpFile = DB_FILE + '.tmp';
        fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf8');
        fs.renameSync(tmpFile, DB_FILE);
      } catch (err) {
        console.error('Erreur écriture fichier BDD:', err);
      }
    }, 200);
  }

  // Chiffrement sécurisé du mot de passe avec sel cryptographique
  hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  generateSalt() {
    return crypto.randomBytes(16).toString('hex');
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Inscription
  registerUser(username, password, stationName, city) {
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return { error: 'Le nom d’utilisateur doit comporter au moins 3 caractères.' };
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return { error: 'Le mot de passe doit comporter au moins 4 caractères.' };
    }

    const cleanUsername = username.trim();
    const key = cleanUsername.toLowerCase();

    if (this.data.users[key]) {
      return { error: 'Ce nom d’utilisateur est déjà utilisé. Veuillez en choisir un autre.' };
    }

    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(password, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    const userRecord = {
      id: userId,
      username: cleanUsername,
      passwordHash,
      salt,
      stationName: (stationName && stationName.trim()) || `Antenne ${cleanUsername}`,
      city: city || 'paris',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    this.data.users[key] = userRecord;

    // Création session token
    const token = this.generateToken();
    this.data.sessions[token] = {
      userId,
      username: cleanUsername,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000 // 30 jours
    };

    this.save();

    return {
      success: true,
      token,
      user: {
        id: userId,
        username: cleanUsername,
        stationName: userRecord.stationName,
        city: userRecord.city
      }
    };
  }

  // Connexion
  loginUser(username, password) {
    if (!username || !password) {
      return { error: 'Identifiant et mot de passe requis.' };
    }

    const key = username.trim().toLowerCase();
    const userRecord = this.data.users[key];

    if (!userRecord) {
      return { error: 'Utilisateur introuvable.' };
    }

    const hashCheck = this.hashPassword(password, userRecord.salt);
    if (hashCheck !== userRecord.passwordHash) {
      return { error: 'Mot de passe incorrect.' };
    }

    userRecord.lastLogin = new Date().toISOString();

    const token = this.generateToken();
    this.data.sessions[token] = {
      userId: userRecord.id,
      username: userRecord.username,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000
    };

    this.save();

    return {
      success: true,
      token,
      user: {
        id: userRecord.id,
        username: userRecord.username,
        stationName: userRecord.stationName,
        city: userRecord.city
      }
    };
  }

  // Validation de session
  getUserByToken(token) {
    if (!token) return null;
    const session = this.data.sessions[token];
    if (!session) return null;
    if (session.expiresAt && session.expiresAt < Date.now()) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }

    // Trouver l'utilisateur
    for (const key of Object.keys(this.data.users)) {
      if (this.data.users[key].id === session.userId) {
        return this.data.users[key];
      }
    }
    return null;
  }

  logoutUser(token) {
    if (token && this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
      return true;
    }
    return false;
  }

  // Sauvegarde de partie en BDD
  saveGame(userId, gameData) {
    if (!userId || !gameData) return false;
    this.data.savedGames[userId] = {
      savedAt: new Date().toISOString(),
      data: gameData
    };
    this.save();
    return true;
  }

  // Chargement de partie depuis la BDD
  loadGame(userId) {
    if (!userId) return null;
    return this.data.savedGames[userId] || null;
  }
}

module.exports = new Database();
