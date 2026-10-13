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
  resetArchives: [], // [{ id, userId, username, timestamp, reason, snapshotData }]
  departments: {},   // deptCode -> { code, name, chefLieu, leaderPlayerId, leaderPlayerName, mainStationId, mainStationName, antennas: [{ playerId, playerName, stationId, stationName, role, joinedAt }] }
  alliances: [],
  allianceStations: [],
  renforts: [],
  formationsSpeciales: [],
  chatMessages: [],
  marketplace: [],
  communityEvents: [],
  badgesCollection: [],
  customVehicleCatalog: null,
  customEquipmentCatalog: null,
  customBadgesCatalog: null,
  referralLogs: [],  // [{ id, referrer_id, referee_id, status, reward_referee_granted, reward_referrer_granted, created_at, validated_at }]
  fraudLogs: []      // [{ id, timestamp, referrer_id, attempted_referee_username, ip_detected, device_fingerprint, reason, reviewed }]
};

class Database {
  constructor() {
    this.data = this.load();
    this.saveTimeout = null;
    this.ensureAdminUser();
  }

  load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // Filtrer strictement pour éradiquer TOUTES les antennes fictives créées par le système
        const cleanedStations = (parsed.allianceStations || []).filter(st => 
          st && st.id && !st.id.startsWith('station-allie') && !(st.playerId && st.playerId.startsWith('system'))
        );

        return {
          ...defaultDb,
          ...parsed,
          users: parsed.users || {},
          sessions: parsed.sessions || {},
          savedGames: parsed.savedGames || {},
          resetArchives: parsed.resetArchives || [],
          departments: parsed.departments || {},
          alliances: parsed.alliances && parsed.alliances.length ? parsed.alliances : defaultDb.alliances,
          allianceStations: cleanedStations,
          formationsSpeciales: (parsed.formationsSpeciales || []).filter(f => !(f.organizerPlayerId && f.organizerPlayerId.startsWith('system'))),
          chatMessages: parsed.chatMessages || [],
          marketplace: parsed.marketplace || [],
          communityEvents: parsed.communityEvents || [],
          badgesCollection: parsed.badgesCollection || [],
          referralLogs: parsed.referralLogs || [],
          fraudLogs: parsed.fraudLogs || []
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

  normalizeIp(ip) {
    if (!ip || typeof ip !== 'string') return '';
    let clean = ip.trim();
    if (clean.startsWith('::ffff:')) clean = clean.slice(7);
    if (clean === '::1') clean = '127.0.0.1';
    return clean;
  }

  generateReferralCode(username) {
    const prefix = (username || 'PC').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROT';
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${rand}`;
  }

  findUserByReferralCode(code) {
    if (!code) return null;
    const cleanCode = String(code).trim().toUpperCase();
    for (const u of Object.values(this.data.users)) {
      if (u.referral_code && u.referral_code.toUpperCase() === cleanCode) {
        return u;
      }
      if (u.username && u.username.toUpperCase() === cleanCode) {
        return u;
      }
    }
    return null;
  }

  logFraudAttempt(referrerId, refereeUsername, ipDetected, deviceFingerprint, reason) {
    const log = {
      id: `frd-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      referrer_id: referrerId,
      attempted_referee_username: refereeUsername || 'Inconnu',
      ip_detected: ipDetected || 'Inconnue',
      device_fingerprint: deviceFingerprint || null,
      reason: reason || 'SUSPECTED_FRAUD',
      reviewed: false
    };
    this.data.fraudLogs = this.data.fraudLogs || [];
    this.data.fraudLogs.unshift(log);

    // Notification Parrain
    const referrer = Object.values(this.data.users).find(u => u.id === referrerId);
    if (referrer) {
      referrer.pending_referral_alerts = referrer.pending_referral_alerts || [];
      referrer.pending_referral_alerts.unshift({
        id: `alt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: "Avertissement : Une tentative de parrainage non conforme a été détectée sur votre compte (adresse IP ou appareil doublon). La liaison a été rejetée et l'incident consigné.",
        reason: reason
      });

      // Seuil de récidive : 3 tentatives non résolues (reviewed === false)
      const unreviewedFraudCount = this.data.fraudLogs.filter(f => f.referrer_id === referrerId && !f.reviewed).length;
      if (unreviewedFraudCount >= 3) {
        referrer.referral_suspended = true;
      }
    }

    this.save();
    return log;
  }

  // Inscription avec gestion du parrainage et sécurité anti-fraude IP
  registerUser(username, password, stationName, city, departmentCode, referralCodeInput = null, clientIpRaw = null, deviceFingerprint = null) {
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

    const clientIp = this.normalizeIp(clientIpRaw);
    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(password, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    const isFirstUser = Object.keys(this.data.users).length === 0;
    const role = (isFirstUser || key === 'admin') ? 'admin' : 'user';

    const cleanDept = (departmentCode || city || '75').toString().trim().toUpperCase();

    // Rôle départemental
    let deptRole = 'antenne_departementale';
    if (!this.data.departments[cleanDept]) {
      this.data.departments[cleanDept] = {
        code: cleanDept,
        name: `Département ${cleanDept}`,
        leaderPlayerId: userId,
        leaderPlayerName: cleanUsername,
        mainStationId: null,
        mainStationName: (stationName && stationName.trim()) || `Antenne Principale (${cleanDept})`,
        createdAt: new Date().toISOString(),
        antennas: []
      };
      deptRole = 'antenne_principale';
    }

    const assignedStationName = (stationName && stationName.trim()) || (deptRole === 'antenne_principale' ? `Antenne Principale (${cleanDept})` : `Antenne Territoriale ${cleanUsername} (${cleanDept})`);

    // Traitement du parrainage
    let referredBy = null;
    let referralStatus = null;
    let refereeBonusGranted = false;

    if (referralCodeInput && String(referralCodeInput).trim().length > 0) {
      const codeClean = String(referralCodeInput).trim();
      const referrer = this.findUserByReferralCode(codeClean);

      if (!referrer) {
        referralStatus = {
          success: false,
          code: 'CODE_NOT_FOUND',
          message: 'Code de parrainage introuvable. Inscription poursuivie sans parrain.'
        };
      } else if (referrer.id === userId || referrer.username.toLowerCase() === key) {
        // Auto-parrainage
        this.logFraudAttempt(referrer.id, cleanUsername, clientIp, deviceFingerprint, 'SELF_REFERRAL');
        referralStatus = {
          success: false,
          code: 'SELF_REFERRAL',
          message: 'Auto-parrainage interdit.'
        };
      } else if (referrer.referral_suspended) {
        // Parrain suspendu
        this.logFraudAttempt(referrer.id, cleanUsername, clientIp, deviceFingerprint, 'REFERRAL_SUSPENDED');
        referralStatus = {
          success: false,
          code: 'REFERRAL_SUSPENDED',
          message: 'Ce parrain est temporairement inéligible au parrainage.'
        };
      } else {
        // CONTRÔLE ANTI-FRAUDE STRICT
        let fraudReason = null;

        // Contrôle 1 (Parrain <-> Filleul)
        const referrerIps = [referrer.registration_ip, ...(referrer.last_known_ips || [])]
          .map(ip => this.normalizeIp(ip))
          .filter(Boolean);

        if (clientIp && referrerIps.includes(clientIp)) {
          fraudReason = 'SAME_IP_AS_REFERRER';
        }

        // Contrôle 2 (Filleul <-> Autres filleuls existants)
        if (!fraudReason && clientIp) {
          for (const u of Object.values(this.data.users)) {
            if (u.referred_by) {
              const otherRefereeIps = [u.registration_ip, ...(u.last_known_ips || [])]
                .map(ip => this.normalizeIp(ip))
                .filter(Boolean);
              if (otherRefereeIps.includes(clientIp)) {
                fraudReason = 'IP_ALREADY_USED_BY_ANOTHER_REFERRAL';
                break;
              }
            }
          }
        }

        if (fraudReason) {
          // Bloquer la liaison mais NE PAS bloquer l'inscription du compte
          this.logFraudAttempt(referrer.id, cleanUsername, clientIp, deviceFingerprint, fraudReason);
          referralStatus = {
            success: false,
            fraudDetected: true,
            code: fraudReason,
            message: 'Parrainage refusé : anomalie de sécurité réseau détectée (adresse IP doublon).'
          };
        } else {
          // Parrainage certifié conforme
          referredBy = referrer.id;
          refereeBonusGranted = true;

          const refLog = {
            id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            referrer_id: referrer.id,
            referee_id: userId,
            status: 'pending',
            reward_referee_granted: true,
            reward_referrer_granted: false,
            created_at: new Date().toISOString(),
            validated_at: null
          };
          this.data.referralLogs = this.data.referralLogs || [];
          this.data.referralLogs.unshift(refLog);

          referralStatus = {
            success: true,
            referrerName: referrer.username,
            bonus: 1500,
            message: 'Parrainage validé ! Bonus de bienvenue de 1 500 € accordé.'
          };
        }
      }
    }

    const myReferralCode = this.generateReferralCode(cleanUsername);

    const userRecord = {
      id: userId,
      username: cleanUsername,
      passwordHash,
      salt,
      role,
      deptRole,
      departmentCode: cleanDept,
      isBanned: false,
      stationName: assignedStationName,
      city: cleanDept,
      // Champs Parrainage & Sécurité
      referral_code: myReferralCode,
      referred_by: referredBy,
      referral_suspended: false,
      registration_ip: clientIp || null,
      last_known_ips: clientIp ? [clientIp] : [],
      pending_referral_alerts: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    this.data.users[key] = userRecord;

    // Enregistrement de l'antenne dans le département
    this.data.departments[cleanDept].antennas.push({
      playerId: userId,
      playerName: cleanUsername,
      stationName: assignedStationName,
      role: deptRole,
      joinedAt: new Date().toISOString()
    });

    // Sauvegarde initiale avec éventuel bonus filleul (+1 500 €)
    const initialMoney = 15000 + (refereeBonusGranted ? 1500 : 0);
    this.data.savedGames[userId] = {
      savedAt: new Date().toISOString(),
      data: {
        player: {
          id: userId,
          name: cleanUsername,
          departmentCode: cleanDept,
          allianceId: 'alliance-fnpc'
        },
        resources: {
          money: initialMoney,
          budget: initialMoney,
          funds: initialMoney,
          reputationScore: 50
        }
      }
    };

    // Création session token
    const token = this.generateToken();
    this.data.sessions[token] = {
      userId,
      username: cleanUsername,
      role,
      deptRole,
      departmentCode: cleanDept,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000 // 30 jours
    };

    this.save();

    return {
      success: true,
      token,
      referralStatus,
      user: {
        id: userId,
        username: cleanUsername,
        role,
        deptRole,
        departmentCode: cleanDept,
        stationName: userRecord.stationName,
        city: userRecord.city,
        referral_code: myReferralCode,
        referred_by: referredBy,
        referral_suspended: false
      }
    };
  }

  // Connexion
  loginUser(username, password, clientIpRaw = null) {
    if (!username || !password) {
      return { error: 'Identifiant et mot de passe requis.' };
    }

    const key = username.trim().toLowerCase();
    const userRecord = this.data.users[key];

    if (!userRecord) {
      return { error: 'Utilisateur introuvable.' };
    }

    if (userRecord.isBanned) {
      return { error: 'Ce compte joueur a été suspendu par un administrateur.' };
    }

    const hashCheck = this.hashPassword(password, userRecord.salt);
    if (hashCheck !== userRecord.passwordHash) {
      return { error: 'Mot de passe incorrect.' };
    }

    userRecord.lastLogin = new Date().toISOString();
    const role = userRecord.role || (key === 'admin' ? 'admin' : 'user');
    userRecord.role = role;

    // Mise à jour de l'historique IP
    const clientIp = this.normalizeIp(clientIpRaw);
    if (clientIp) {
      userRecord.last_known_ips = userRecord.last_known_ips || [];
      if (!userRecord.last_known_ips.includes(clientIp)) {
        userRecord.last_known_ips.push(clientIp);
        if (userRecord.last_known_ips.length > 20) userRecord.last_known_ips.shift();
      }
      if (!userRecord.registration_ip) userRecord.registration_ip = clientIp;
    }

    // Assurer la présence d'un referral_code pour les anciens comptes
    if (!userRecord.referral_code) {
      userRecord.referral_code = this.generateReferralCode(userRecord.username);
    }
    if (userRecord.referral_suspended === undefined) {
      userRecord.referral_suspended = false;
    }

    const alertsToSend = [...(userRecord.pending_referral_alerts || [])];
    // Réinitialiser les alertes après lecture
    userRecord.pending_referral_alerts = [];

    const token = this.generateToken();
    this.data.sessions[token] = {
      userId: userRecord.id,
      username: userRecord.username,
      role,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000
    };

    this.save();

    return {
      success: true,
      token,
      pendingAlerts: alertsToSend,
      user: {
        id: userRecord.id,
        username: userRecord.username,
        role,
        stationName: userRecord.stationName,
        city: userRecord.city,
        referral_code: userRecord.referral_code,
        referred_by: userRecord.referred_by || null,
        referral_suspended: !!userRecord.referral_suspended
      }
    };
  }

  // Déblocage de la prime parrain lors du palier (1ère intervention terminée)
  claimReferralFirstMission(userId) {
    if (!userId) return { error: 'UserId requis' };
    this.data.referralLogs = this.data.referralLogs || [];
    const log = this.data.referralLogs.find(l => l.referee_id === userId && l.status === 'pending');
    if (!log) {
      return { success: false, message: 'Aucun parrainage en attente pour ce joueur.' };
    }

    const referrer = Object.values(this.data.users).find(u => u.id === log.referrer_id);
    if (!referrer) {
      return { error: 'Parrain introuvable' };
    }

    if (referrer.referral_suspended) {
      return { success: false, error: 'Le parrain est actuellement suspendu du programme.' };
    }

    // Valider le parrainage
    log.status = 'completed';
    log.reward_referrer_granted = true;
    log.validated_at = new Date().toISOString();

    // Créditer le bonus de 2 500 € au parrain
    const referrerSave = this.data.savedGames[referrer.id];
    if (referrerSave && referrerSave.data && referrerSave.data.resources) {
      const currentMoney = referrerSave.data.resources.money || 15000;
      referrerSave.data.resources.money = currentMoney + 2500;
      if (referrerSave.data.resources.budget !== undefined) referrerSave.data.resources.budget += 2500;
      if (referrerSave.data.resources.funds !== undefined) referrerSave.data.resources.funds += 2500;
      referrerSave.savedAt = new Date().toISOString();
    }

    // Notification d'information pour le parrain
    referrer.pending_referral_alerts = referrer.pending_referral_alerts || [];
    referrer.pending_referral_alerts.unshift({
      id: `rew-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'reward',
      message: `Félicitations ! Votre filleul a accompli sa première intervention. Vous recevez votre prime de parrainage de +2 500 € !`
    });

    this.save();
    return {
      success: true,
      referrerId: referrer.id,
      referrerName: referrer.username,
      bonusGranted: 2500
    };
  }

  // Données complètes pour l'onglet Admin Sécurité & Parrainages
  getReferralAdminData() {
    this.data.fraudLogs = this.data.fraudLogs || [];
    this.data.referralLogs = this.data.referralLogs || [];

    const fraudCountsByReferrer = {};
    this.data.fraudLogs.forEach(f => {
      fraudCountsByReferrer[f.referrer_id] = (fraudCountsByReferrer[f.referrer_id] || 0) + 1;
    });

    const enrichedFraudLogs = this.data.fraudLogs.map(f => {
      const referrer = Object.values(this.data.users).find(u => u.id === f.referrer_id);
      const count = fraudCountsByReferrer[f.referrer_id] || 1;
      return {
        ...f,
        referrer_username: referrer ? referrer.username : 'Inconnu',
        referrer_suspended: referrer ? !!referrer.referral_suspended : false,
        referrer_is_banned: referrer ? !!referrer.isBanned : false,
        total_fraud_attempts: count,
        is_recidivist: count >= 2
      };
    });

    const enrichedReferralLogs = this.data.referralLogs.map(r => {
      const referrer = Object.values(this.data.users).find(u => u.id === r.referrer_id);
      const referee = Object.values(this.data.users).find(u => u.id === r.referee_id);
      return {
        ...r,
        referrer_username: referrer ? referrer.username : 'Inconnu',
        referee_username: referee ? referee.username : 'Inconnu'
      };
    });

    return {
      fraudLogs: enrichedFraudLogs,
      referralLogs: enrichedReferralLogs,
      summary: {
        totalReferrals: this.data.referralLogs.length,
        completedReferrals: this.data.referralLogs.filter(r => r.status === 'completed').length,
        totalFrauds: this.data.fraudLogs.length,
        unreviewedFrauds: this.data.fraudLogs.filter(f => !f.reviewed).length,
        recidivistCount: Object.values(fraudCountsByReferrer).filter(c => c >= 2).length
      }
    };
  }

  // Actions d'administration sur les parrainages et incidents de fraude
  processAdminReferralAction(action, targetId, extra = {}) {
    if (action === 'review_fraud') {
      const log = (this.data.fraudLogs || []).find(f => f.id === targetId);
      if (!log) return { error: 'Log d’incident introuvable.' };
      log.reviewed = true;
      this.save();
      return { success: true, log };
    }

    if (action === 'reactivate_referrer') {
      const user = Object.values(this.data.users).find(u => u.id === targetId);
      if (!user) return { error: 'Joueur introuvable.' };
      user.referral_suspended = false;
      this.save();
      return { success: true, user: { id: user.id, username: user.username, referral_suspended: false } };
    }

    if (action === 'warn_referrer') {
      const user = Object.values(this.data.users).find(u => u.id === targetId);
      if (!user) return { error: 'Joueur introuvable.' };
      user.pending_referral_alerts = user.pending_referral_alerts || [];
      user.pending_referral_alerts.unshift({
        id: `adm-warn-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'admin_warning',
        message: extra.message || "Avertissement Administrateur : Des irrégularités ont été constatées sur l’utilisation de votre code de parrainage. Veillez à respecter les conditions d'utilisation."
      });
      this.save();
      return { success: true };
    }

    if (action === 'ban_referrer') {
      const user = Object.values(this.data.users).find(u => u.id === targetId);
      if (!user) return { error: 'Joueur introuvable.' };
      user.isBanned = true;
      user.referral_suspended = true;
      for (const [token, sess] of Object.entries(this.data.sessions)) {
        if (sess.userId === user.id) delete this.data.sessions[token];
      }
      this.save();
      return { success: true, user: { id: user.id, username: user.username, isBanned: true } };
    }

    return { error: 'Action non reconnue.' };
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
        const u = this.data.users[key];
        if (u.isBanned) return null;
        return u;
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

    // Mettre à jour les analytics de plateforme sur l'utilisateur si disponibles
    if (this.data.users[userId]) {
      if (gameData.platformStats) this.data.users[userId].platformStats = gameData.platformStats;
      if (gameData.lastDevice) this.data.users[userId].lastDevice = gameData.lastDevice;
    }

    this.save();
    return true;
  }

  // Chargement de partie depuis la BDD
  loadGame(userId) {
    if (!userId) return null;
    return this.data.savedGames[userId] || null;
  }

  // Archivage sécurisé lors d'une remise à zéro (Anti fausse-manip)
  archiveAndResetGame(userId, username, reason = 'Demande joueur', localSnapshot = null) {
    if (!this.data.resetArchives) this.data.resetArchives = [];
    
    // Récupérer la dernière sauvegarde BDD ou le snapshot transmis
    const currentSave = this.data.savedGames[userId];
    const dataToArchive = (currentSave && currentSave.data) ? currentSave.data : localSnapshot;

    const archiveEntry = {
      id: `arc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: userId || 'anonymous',
      username: username || 'Directeur Anonyme',
      timestamp: new Date().toISOString(),
      reason: reason,
      hasData: !!dataToArchive,
      snapshotData: dataToArchive || null
    };

    // Garder jusqu'à 100 archives horodatées
    this.data.resetArchives.unshift(archiveEntry);
    if (this.data.resetArchives.length > 100) {
      this.data.resetArchives.pop();
    }

    // Effacer la sauvegarde active si l'utilisateur est identifié
    if (userId && this.data.savedGames[userId]) {
      delete this.data.savedGames[userId];
    }

    this.save();
    return archiveEntry;
  }

  // Obtenir la liste des archives de remise à zéro
  getResetArchives() {
    return (this.data.resetArchives || []).map(a => ({
      id: a.id,
      userId: a.userId,
      username: a.username,
      timestamp: a.timestamp,
      reason: a.reason,
      hasData: !!a.snapshotData,
      money: a.snapshotData?.resources?.money ?? null,
      stationsCount: a.snapshotData?.stations?.length ?? 0,
      volunteersCount: a.snapshotData?.volunteers?.length ?? 0
    }));
  }

  // Restaurer une archive de partie vers le joueur ciblé
  restoreResetArchive(archiveId, targetUserId) {
    if (!this.data.resetArchives) return { error: 'Aucune archive disponible.' };
    const archive = this.data.resetArchives.find(a => a.id === archiveId);
    if (!archive || !archive.snapshotData) {
      return { error: 'Archive introuvable ou ne contenant pas de données exploitables.' };
    }

    const userId = targetUserId || archive.userId;
    if (!userId || userId === 'anonymous') {
      return { error: 'Identifiant joueur cible invalide.' };
    }

    // Réaffectation de la sauvegarde en BDD
    this.data.savedGames[userId] = {
      savedAt: new Date().toISOString(),
      data: archive.snapshotData
    };
    this.save();

    return {
      success: true,
      restoredTo: userId,
      savedAt: new Date().toISOString(),
      data: archive.snapshotData
    };
  }

  // --- MÉTHODES DU PANEL ADMIN ---

  ensureAdminUser() {
    const adminKey = 'admin';
    if (!this.data.users[adminKey]) {
      const salt = this.generateSalt();
      const passwordHash = this.hashPassword('admin123', salt);
      this.data.users[adminKey] = {
        id: 'usr_admin_master',
        username: 'Admin',
        passwordHash,
        salt,
        role: 'admin',
        isBanned: false,
        stationName: 'Direction Nationale FNPC',
        city: 'Paris',
        departmentCode: '75',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      this.save();
    } else {
      this.data.users[adminKey].role = 'admin';
      this.data.users[adminKey].departmentCode = this.data.users[adminKey].departmentCode || '75';
      this.save();
    }

    // Assurer la présence de l'antenne nationale de la Direction FNPC pour le multijoueur
    if (!this.data.savedGames['usr_admin_master'] || !this.data.savedGames['usr_admin_master'].data?.stations?.length) {
      this.data.savedGames['usr_admin_master'] = {
        savedAt: new Date().toISOString(),
        data: {
          player: {
            id: 'usr_admin_master',
            name: 'Direction Nationale FNPC',
            departmentCode: '75',
            allianceId: 'alliance-fnpc'
          },
          stations: [
            {
              id: 'station-fnpc-national-hq',
              name: 'Direction Générale Nationale (FNPC)',
              city: 'Paris',
              departmentCode: '75',
              lat: 48.8955,
              lng: 2.2905,
              level: 3,
              vehicles: [
                { id: 'v-nat-1', name: 'PC Mobile FNPC', type: 'PCM' },
                { id: 'v-nat-2', name: 'VPSP FNPC 01', type: 'VPSP' },
                { id: 'v-nat-3', name: 'VL Commandement 01', type: 'VLC' }
              ],
              volunteers: [
                { id: 'vol-nat-1', name: 'Président FNPC', rank: 'Cadre Fédéral' },
                { id: 'vol-nat-2', name: 'Directeur Opérationnel', rank: 'Chef de Dispositif' }
              ]
            }
          ]
        }
      };
      this.save();
    }
  }

  getAllUsersForAdmin() {
    return Object.values(this.data.users).map(u => {
      const save = this.data.savedGames[u.id];
      const gData = save ? save.data : null;
      return {
        id: u.id,
        username: u.username,
        role: u.role || 'user',
        isBanned: !!u.isBanned,
        referral_code: u.referral_code || null,
        referred_by: u.referred_by || null,
        referral_suspended: !!u.referral_suspended,
        registration_ip: u.registration_ip || null,
        last_known_ips: u.last_known_ips || [],
        stationName: u.stationName || 'Antenne',
        city: u.city || 'paris',
        departmentCode: u.departmentCode || '75',
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        money: gData?.resources?.money ?? 15000,
        volunteersCount: gData?.volunteers?.length ?? 4,
        vehiclesCount: gData?.vehicles?.length ?? 1,
        stationsCount: gData?.stations?.length ?? 1,
        missionsCount: gData?.missions?.length ?? 0,
        reputationScore: gData?.resources?.reputationScore ?? 50,
        timeTracking: u.timeTracking || gData?.timeTracking || null,
        platformStats: u.platformStats || gData?.platformStats || null,
        lastDevice: u.lastDevice || gData?.lastDevice || null,
        lastSaved: save?.savedAt || null,
        saveData: gData
      };
    });
  }

  updateUserByAdmin(userId, updates) {
    let targetKey = null;
    let targetUser = null;

    for (const [key, u] of Object.entries(this.data.users)) {
      if (u.id === userId) {
        targetKey = key;
        targetUser = u;
        break;
      }
    }

    if (!targetUser) return { error: 'Joueur introuvable.' };

    // Modification du pseudo
    if (updates.newUsername && updates.newUsername.trim().length >= 3) {
      const newClean = updates.newUsername.trim();
      const newKey = newClean.toLowerCase();
      if (newKey !== targetKey && this.data.users[newKey]) {
        return { error: 'Ce nom d’utilisateur est déjà utilisé par un autre joueur.' };
      }
      targetUser.username = newClean;
      if (newKey !== targetKey) {
        this.data.users[newKey] = targetUser;
        delete this.data.users[targetKey];
        targetKey = newKey;
      }
    }

    if (updates.role !== undefined) {
      targetUser.role = updates.role;
    }
    if (updates.isBanned !== undefined) {
      targetUser.isBanned = !!updates.isBanned;
      if (targetUser.isBanned) {
        // Déconnecter immédiatement
        for (const [token, sess] of Object.entries(this.data.sessions)) {
          if (sess.userId === userId) delete this.data.sessions[token];
        }
      }
    }
    if (updates.stationName) {
      targetUser.stationName = updates.stationName;
    }
    if (updates.city) {
      targetUser.city = updates.city;
    }
    if (updates.newPassword && updates.newPassword.length >= 4) {
      const newSalt = this.generateSalt();
      targetUser.salt = newSalt;
      targetUser.passwordHash = this.hashPassword(updates.newPassword, newSalt);
    }

    // Mise à jour de la sauvegarde de jeu (Trésorerie, Véhicules, Missions...)
    if (updates.money !== undefined || updates.saveData) {
      if (!this.data.savedGames[userId]) {
        this.data.savedGames[userId] = {
          savedAt: new Date().toISOString(),
          data: { resources: { money: Number(updates.money || 15000) } }
        };
      }
      const saveRecord = this.data.savedGames[userId];
      if (!saveRecord.data) saveRecord.data = {};
      if (!saveRecord.data.resources) saveRecord.data.resources = {};

      if (updates.money !== undefined && !isNaN(updates.money)) {
        saveRecord.data.resources.money = Number(updates.money);
        saveRecord.data.resources.budget = Number(updates.money);
        saveRecord.data.resources.funds = Number(updates.money);
      }

      if (updates.saveData) {
        saveRecord.data = { ...saveRecord.data, ...updates.saveData };
      }

      saveRecord.savedAt = new Date().toISOString();
    }

    this.save();
    return { success: true, user: targetUser };
  }

  deleteUserByAdmin(userId) {
    let targetKey = null;
    for (const [key, u] of Object.entries(this.data.users)) {
      if (u.id === userId) {
        targetKey = key;
        break;
      }
    }
    if (!targetKey) return { error: 'Joueur introuvable.' };

    delete this.data.users[targetKey];
    delete this.data.savedGames[userId];
    for (const [token, sess] of Object.entries(this.data.sessions)) {
      if (sess.userId === userId) delete this.data.sessions[token];
    }
    this.save();
    return { success: true };
  }

  // Informations sur le département et ses antennes
  getDepartmentInfo(deptCode) {
    const clean = String(deptCode || '').trim().toUpperCase();
    return this.data.departments[clean] || null;
  }

  // Léguer / Transférer le rôle d'Antenne Principale à un autre joueur du département
  transferMainAntenna(deptCode, currentLeaderId, newLeaderId) {
    const clean = String(deptCode || '').trim().toUpperCase();
    const dept = this.data.departments[clean];
    if (!dept) return { error: 'Département introuvable.' };

    if (dept.leaderPlayerId !== currentLeaderId) {
      return { error: 'Seul le titulaire de l’antenne principale peut la léguer.' };
    }

    let targetUser = null;
    let currentUser = null;
    for (const u of Object.values(this.data.users)) {
      if (u.id === newLeaderId) targetUser = u;
      if (u.id === currentLeaderId) currentUser = u;
    }

    if (!targetUser) return { error: 'Nouveau titulaire introuvable.' };

    // Mise à jour département
    dept.leaderPlayerId = targetUser.id;
    dept.leaderPlayerName = targetUser.username;

    // Mise à jour des rôles utilisateurs
    if (currentUser) currentUser.deptRole = 'antenne_departementale';
    targetUser.deptRole = 'antenne_principale';

    // Mise à jour dans la liste des antennes
    dept.antennas.forEach(a => {
      if (a.playerId === currentLeaderId) a.role = 'antenne_departementale';
      if (a.playerId === newLeaderId) a.role = 'antenne_principale';
    });

    this.save();
    return { success: true, department: dept };
  }
}

module.exports = new Database();
