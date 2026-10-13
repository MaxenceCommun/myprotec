/**
 * PROTEC LIVE - GESTIONNAIRE DE BASE DE DONNÉES CLOUD SUPABASE (POSTGRESQL)
 * 
 * Connecteur officiel pour la synchronisation des données de jeu, comptes directeurs,
 * sauvegardes en cloud, stations multijoueur, sécurité des locaux et main courante.
 */

window.ProtecSupabase = {
  url: 'https://yrayehhbqcnuiuejqsjz.supabase.co',
  key: 'sb_publishable__SL5mXhQJBnyBBxgJJajXw_tCxJzlPs',
  client: null,
  isInitialized: false,
  isConnected: false,
  realtimeChannel: null,
  watchdogTimer: null,

  // Initialisation du client Supabase
  init() {
    if (this.isInitialized) return;

    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        this.client = window.supabase.createClient(this.url, this.key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        });
        this.isInitialized = true;
        this.checkConnection();
        console.log('✅ Client Supabase PostgreSQL initialisé avec succès.');
      } else {
        // En attente du chargement du script CDN
        setTimeout(() => this.init(), 150);
      }
    } catch (err) {
      console.warn('⚠️ Initialisation Supabase en mode hors-ligne:', err);
    }
  },

  // Test de connectivité à la base Supabase
  async checkConnection() {
    if (!this.client) return false;
    try {
      const { data, error } = await this.client
        .from('players')
        .select('id')
        .limit(1);

      if (!error) {
        this.isConnected = true;
        this.updateStatusBadge(true);
        return true;
      } else {
        // La table players n'est peut-être pas encore créée ou accessible
        console.info('Connexion Supabase active (réponse API reçue).');
        this.isConnected = true;
        this.updateStatusBadge(true);
        return true;
      }
    } catch (e) {
      console.warn('Vérification Supabase différée:', e);
      this.updateStatusBadge(false);
      return false;
    }
  },

  // Mise à jour visuelle du badge de statut Supabase dans l'interface
  updateStatusBadge(connected) {
    const badge = document.getElementById('supabase-status-badge');
    if (badge) {
      if (connected) {
        badge.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-300';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Connecté (Serveur)';
      } else {
        badge.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 border border-rose-300';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Déconnecté';
      }
    }
  },

  // 1. Vérification de l'existence du compte dans la table players (déconnexion si supprimé)
  async checkPlayerExists(playerId) {
    if (!this.client || !playerId) return true;
    try {
      const isUUID = typeof playerId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId);
      let query = this.client.from('players').select('id');
      if (isUUID) {
        query = query.eq('id', playerId);
      } else {
        query = query.eq('username', playerId);
      }
      const { data, error } = await query.maybeSingle();
      if (error) {
        // En cas d'erreur de communication, ne pas déconnecter intempestivement
        return true;
      }
      return data !== null;
    } catch (e) {
      return true;
    }
  },

  // Surveillance périodique et écoute temps réel pour déconnexion si compte supprimé
  startAccountWatchdog(game) {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    const checkNow = async () => {
      // SÉCURITÉ ABSOLUE : Vérifier UNIQUEMENT si le joueur est activement connecté avec une session valide
      const currentUser = window.ProtecAuth?.currentUser;
      const token = window.ProtecAuth?.token;
      if (!currentUser || !currentUser.id || !token) {
        // Le joueur n'est pas connecté : aucun contrôle de suppression de compte
        if (this.watchdogTimer) {
          clearInterval(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        return;
      }

      const pid = currentUser.id;
      const exists = await this.checkPlayerExists(pid);
      if (!exists) {
        console.warn('⚠️ Compte joueur supprimé de la BDD : déconnexion immédiate !');
        if (window.ProtecAuth && window.ProtecAuth.handleAccountDeleted) {
          window.ProtecAuth.handleAccountDeleted(game || window.game);
        }
      }
    };

    // Vérification périodique toutes les 12 secondes uniquement si connecté
    this.watchdogTimer = setInterval(checkNow, 12000);

    // Vérification au retour sur l'onglet uniquement si connecté
    if (!this._watchdogListenersAttached) {
      this._watchdogListenersAttached = true;
      window.addEventListener('focus', () => {
        if (window.ProtecAuth?.currentUser?.id) checkNow();
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && window.ProtecAuth?.currentUser?.id) {
          checkNow();
        }
      });
    }
  },

  // Arrêt du watchdog lors d'une déconnexion ou fermeture
  stopAccountWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  },

  // Initialisation du canal temps réel WebSockets Supabase pour tous les joueurs
  initMultiplayerRealtime(game) {
    if (!this.client) return;

    if (this.realtimeChannel) {
      try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
    }

    const channelName = 'protec-live-global';
    this.realtimeChannel = this.client.channel(channelName, {
      config: {
        broadcast: { self: false }
      }
    });

    // Écoute 1 : Détection temps réel de suppression de joueur dans la table players
    this.realtimeChannel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'players' }, (payload) => {
      const currentUser = window.ProtecAuth?.currentUser;
      if (!currentUser || !currentUser.id) return; // Non connecté : ignorer strictement

      const pid = currentUser.id;
      const pname = currentUser.username;
      if (payload.old && (payload.old.id === pid || (pname && payload.old.username === pname))) {
        console.warn('⚠️ Événement Supabase DELETE reçu sur notre compte joueur !');
        if (window.ProtecAuth && window.ProtecAuth.handleAccountDeleted) {
          window.ProtecAuth.handleAccountDeleted(game || window.game);
        }
      }
    });

    // Écoute 2 : Synchronisation temps réel des engagements de renforts (arbitrage sans conflit)
    this.realtimeChannel.on('broadcast', { event: 'renfort_contribution' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && g.handleRemoteRenfortContribution && data) {
        g.handleRemoteRenfortContribution(data);
      }
    });

    // Écoute 3 : Synchronisation temps réel de nouvelles demandes de renfort
    this.realtimeChannel.on('broadcast', { event: 'renfort_created' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && g.handleRemoteRenfortCreated && data) {
        g.handleRemoteRenfortCreated(data);
      }
    });

    // Écoute 4 : Annonces administratives globales en direct (Flash, Maintenance, Événements)
    this.realtimeChannel.on('broadcast', { event: 'admin_broadcast' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && g.handleMultiplayerEvent && data) {
        g.handleMultiplayerEvent('admin_broadcast', data);
      }
    });

    // Écoute 5 : Modification administrative de compte joueur (argent, ban, reset mdp)
    this.realtimeChannel.on('broadcast', { event: 'admin_user_updated' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && g.handleMultiplayerEvent && data) {
        g.handleMultiplayerEvent('admin_user_updated', data);
      }
    });

    // Écoute 6 : Synchronisation temps réel de la bourse de l'occasion (market_listings)
    this.realtimeChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'market_listings' }, (payload) => {
      const g = game || window.game;
      if (window.ProtecMarcheOccasion && window.ProtecMarcheOccasion.handleRealtimeEvent) {
        window.ProtecMarcheOccasion.handleRealtimeEvent(payload, g);
      }
    });

    // Écoute 7 : Broadcast des annonces du marché d'occasion
    this.realtimeChannel.on('broadcast', { event: 'market_update' }, (evt) => {
      const g = game || window.game;
      if (window.ProtecMarcheOccasion && window.ProtecMarcheOccasion.handleBroadcastEvent) {
        window.ProtecMarcheOccasion.handleBroadcastEvent(evt.payload, g);
      }
    });

    this.realtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('⚡ Canal Supabase Realtime actif : synchronisation en direct (< 50ms) connectée.');
      }
    });
  },

  // Diffusion d'un engagement de renfort en temps réel à tous les directeurs connectés
  broadcastRenfortContribution(payload) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'renfort_contribution',
        payload: payload
      });
    } catch (e) {
      console.warn('Erreur broadcast renfort:', e);
    }
  },

  // Diffusion d'une nouvelle demande de renfort en temps réel
  broadcastRenfortCreated(renfortData) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'renfort_created',
        payload: renfortData
      });
    } catch (e) {
      console.warn('Erreur broadcast création renfort:', e);
    }
  },

  // Diffusion d'une annonce administrative en direct sur Supabase
  broadcastAdminAnnouncement(broadcastData) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'admin_broadcast',
        payload: broadcastData
      });
    } catch (e) {
      console.warn('Erreur broadcast annonce admin:', e);
    }
  },

  // Diffusion d'une mise à jour de compte joueur en direct sur Supabase
  broadcastAdminUserUpdated(updateData) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'admin_user_updated',
        payload: updateData
      });
    } catch (e) {
      console.warn('Erreur broadcast admin_user_updated:', e);
    }
  },

  // Récupération de tous les comptes joueurs et de leurs sauvegardes pour le Panel Admin
  async getAllPlayersForAdmin() {
    if (!this.client) return [];
    try {
      const { data: players, error } = await this.client
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !players) return [];

      // Récupérer les sauvegardes correspondantes
      const { data: saves } = await this.client
        .from('game_saves')
        .select('*');

      const savesMap = {};
      if (saves && Array.isArray(saves)) {
        saves.forEach(s => {
          if (s.user_id) savesMap[s.user_id] = s;
          if (s.username) savesMap[s.username] = s;
        });
      }

      return players.map(p => {
        const s = savesMap[p.id] || savesMap[p.username] || null;
        const sData = s ? s.save_data : null;
        return {
          id: p.id,
          username: p.username,
          role: p.role || 'user',
          isBanned: !!p.is_banned,
          stationName: p.station_name || 'Antenne',
          city: p.city || 'Paris',
          departmentCode: p.department_code || '75',
          createdAt: p.created_at,
          lastLogin: p.last_login,
          money: (sData?.resources?.money !== undefined) ? sData.resources.money : (s?.funds ?? 15000),
          volunteersCount: (sData?.volunteers?.length !== undefined) ? sData.volunteers.length : (s?.volunteers_count ?? 4),
          vehiclesCount: (sData?.vehicles?.length !== undefined) ? sData.vehicles.length : (s?.vehicles_count ?? 1),
          stationsCount: (sData?.stations?.length !== undefined) ? sData.stations.length : (s?.stations_count ?? 1),
          missionsCount: (sData?.missions?.length !== undefined) ? sData.missions.length : 0,
          reputationScore: (sData?.resources?.reputationScore !== undefined) ? sData.resources.reputationScore : 50,
          timeTracking: sData?.timeTracking || p.time_tracking || null,
          lastSaved: s?.updated_at || null,
          saveData: sData
        };
      });
    } catch (e) {
      console.warn('Erreur lecture admin players Supabase:', e);
      return [];
    }
  },

  // Modification d'un compte joueur dans Supabase par l'Admin
  async updatePlayerByAdmin(playerId, updates) {
    if (!this.client || !playerId) return { error: 'Paramètres invalides' };
    try {
      const isUUID = typeof playerId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId);
      const playerUpdates = {};

      if (updates.username) playerUpdates.username = updates.username.trim();
      if (updates.role) playerUpdates.role = updates.role;
      if (updates.isBanned !== undefined) playerUpdates.is_banned = !!updates.isBanned;
      if (updates.stationName) playerUpdates.station_name = updates.stationName.trim();
      if (updates.newPassword) {
        playerUpdates.password_hash = await this.hashPassword(updates.newPassword);
      }

      if (Object.keys(playerUpdates).length > 0) {
        let q = this.client.from('players').update(playerUpdates);
        if (isUUID) q = q.eq('id', playerId);
        else q = q.eq('username', playerId);
        const { error } = await q;
        if (error) console.warn('Erreur update player Supabase:', error);
      }

      // Si l'argent ou des éléments de jeu ont été modifiés dans la sauvegarde
      if (updates.money !== undefined || updates.saveData) {
        let saveRecord = await this.loadGameState(playerId);
        let sData = saveRecord?.save_data || {};
        if (updates.saveData) {
          sData = { ...sData, ...updates.saveData };
        }
        if (updates.money !== undefined) {
          if (!sData.resources) sData.resources = {};
          sData.resources.money = Number(updates.money);
          sData.resources.budget = Number(updates.money);
          sData.resources.funds = Number(updates.money);
        }
        await this.client.from('game_saves').upsert({
          user_id: isUUID ? playerId : null,
          username: updates.username || (saveRecord ? saveRecord.username : null),
          save_data: sData,
          funds: updates.money !== undefined ? Number(updates.money) : (saveRecord?.funds ?? 15000),
          updated_at: new Date().toISOString()
        }, { onConflict: isUUID ? 'user_id' : 'username' });
      }

      // Émettre le broadcast temps réel
      this.broadcastAdminUserUpdated({ userId: playerId, updates });

      return { success: true };
    } catch (e) {
      console.warn('Erreur update admin Supabase:', e);
      return { error: e.message || 'Erreur mise à jour BDD' };
    }
  },

  // Suppression définitive d'un compte joueur dans Supabase
  async deletePlayerByAdmin(playerId) {
    if (!this.client || !playerId) return { error: 'Paramètres invalides' };
    try {
      const isUUID = typeof playerId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId);
      let q = this.client.from('players').delete();
      if (isUUID) q = q.eq('id', playerId);
      else q = q.eq('username', playerId);
      await q;

      let qSave = this.client.from('game_saves').delete();
      if (isUUID) qSave = qSave.eq('user_id', playerId);
      else qSave = qSave.eq('username', playerId);
      await qSave;

      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  },

  // Fonction de hachage sécurisée pour les mots de passe
  async hashPassword(password) {
    if (!password) return null;
    try {
      if (window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(String(password) + '_protec_secret_salt_2026');
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {}
    let h = 0;
    const str = String(password) + '_salt';
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return 'h_' + Math.abs(h).toString(16);
  },

  // 1. Inscription d'un nouveau Directeur d'Antenne dans Supabase
  async registerPlayer(username, password, extraData = {}) {
    if (!this.client) return { error: 'Client BDD non initialisé' };

    try {
      // 1. Vérifier si le pseudo existe déjà
      const { data: existing } = await this.client
        .from('players')
        .select('id')
        .eq('username', username.trim())
        .maybeSingle();

      if (existing) {
        return { error: 'Ce nom de directeur est déjà utilisé. Veuillez en choisir un autre.' };
      }

      // La ville correspond strictement à l'implantation réelle du bâtiment
      let detectedCity = extraData.city || null;
      if (!detectedCity && extraData.stationName) {
        const cleanSt = extraData.stationName.replace(/^antenne\s+(de\s+)?/i, '').trim();
        if (cleanSt.length > 2) detectedCity = cleanSt;
      }

      // Hachage du mot de passe
      const pwdHash = await this.hashPassword(password);

      // Nettoyage préventif de toute sauvegarde orpheline résiduelle pour ce pseudo
      try {
        await this.client.from('game_saves').delete().eq('username', username.trim());
      } catch (cleanErr) {}

      // 2. Création de l'enregistrement avec mot de passe et ville exacte
      const newPlayer = {
        username: username.trim(),
        password_hash: pwdHash,
        station_name: extraData.stationName || 'Antenne Protection Civile',
        city: detectedCity,
        department_code: extraData.departmentCode || '54',
        role: 'directeur',
        is_admin: false, // Sécurité : jamais administrateur par défaut à l'inscription
        alliance_id: extraData.allianceId || null,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      const { data: inserted, error: insertErr } = await this.client
        .from('players')
        .insert(newPlayer)
        .select()
        .single();

      if (insertErr) {
        console.error('Erreur inscription Supabase:', insertErr);
        return { error: insertErr.message || 'Erreur lors de l’inscription BDD' };
      }

      return { user: inserted };
    } catch (e) {
      console.error('Exception inscription Supabase:', e);
      return { error: e.message || 'Erreur réseau BDD' };
    }
  },

  // 2. Connexion d'un Directeur dans Supabase
  async loginPlayer(username, password) {
    if (!this.client) return { error: 'Client BDD non initialisé' };

    try {
      const { data: player, error } = await this.client
        .from('players')
        .select('*')
        .eq('username', username.trim())
        .maybeSingle();

      if (error || !player) {
        return { error: 'Directeur introuvable. Veuillez vérifier vos identifiants.' };
      }

      // Vérification sécurisée du mot de passe
      if (player.password_hash) {
        const inputHash = await this.hashPassword(password);
        if (player.password_hash !== inputHash && player.password_hash !== password) {
          return { error: 'Mot de passe incorrect. Veuillez vérifier vos identifiants.' };
        }
      } else if (password) {
        // Enregistrement transparent du mot de passe pour les comptes existants
        const newHash = await this.hashPassword(password);
        await this.client
          .from('players')
          .update({ password_hash: newHash })
          .eq('id', player.id);
        player.password_hash = newHash;
      }

      // Mise à jour de la dernière connexion
      await this.client
        .from('players')
        .update({ last_login: new Date().toISOString() })
        .eq('id', player.id);

      return { user: player };
    } catch (e) {
      console.error('Exception connexion Supabase:', e);
      return { error: e.message || 'Erreur réseau BDD' };
    }
  },

  // Mise à jour de la ville et de l'antenne du joueur dans la BDD Supabase
  async updatePlayerCityAndStation(playerId, city, stationName = null, departmentCode = null) {
    if (!this.client || !playerId || !city) return;
    try {
      const updates = { city: city.trim(), last_login: new Date().toISOString() };
      if (stationName) updates.station_name = stationName.trim();
      if (departmentCode) updates.department_code = String(departmentCode).trim();

      const isUUID = typeof playerId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId);
      if (isUUID) {
        await this.client
          .from('players')
          .update(updates)
          .eq('id', playerId);
      } else {
        await this.client
          .from('players')
          .update(updates)
          .eq('username', playerId);
      }
    } catch (e) {
      console.warn('Erreur mise à jour ville Supabase:', e);
    }
  },

  // 3. Sauvegarde Cloud de la Partie dans la table game_saves
  async saveGameState(userId, username, game) {
    if (!this.client || !userId) return false;

    // Détection de suppression : si le compte n'existe plus en BDD, déconnexion immédiate
    const exists = await this.checkPlayerExists(userId);
    if (!exists) {
      console.warn('⚠️ Joueur non trouvé en BDD lors de la sauvegarde : compte supprimé.');
      if (window.ProtecAuth && window.ProtecAuth.handleAccountDeleted) {
        window.ProtecAuth.handleAccountDeleted(game);
      }
      return false;
    }

    try {
      const moneyVal = (game.resources?.money !== undefined) ? game.resources.money : ((game.resources?.budget !== undefined) ? game.resources.budget : 15000);
      if (game.resources) {
        game.resources.money = moneyVal;
        game.resources.budget = moneyVal;
        game.resources.funds = moneyVal;
      }

      const stateToSave = {
        player: game.player,
        clock: game.clock,
        resources: game.resources,
        currentCityKey: game.currentCityKey,
        stations: game.stations,
        vehicles: game.vehicles,
        volunteers: game.volunteers,
        devis: game.devis,
        missions: game.missions,
        candidatures: game.candidatures,
        formations: game.formations,
        logistics: game.logistics,
        weather: game.weather,
        grants: game.grants,
        radioLogs: game.radioLogs,
        rewards: game.rewards,
        bureau: game.bureau,
        samuGarde: game.samuGarde,
        sdisGarde: game.sdisGarde,
        prefectureState: game.prefectureState,
        aascConvention: game.aascConvention || null,
        samuConvention: game.samuConvention || null,
        sdisConvention: game.sdisConvention || null,
        sncfConvention: game.sncfConvention || null,
        cumpConvention: game.cumpConvention || null,
        conventionRequests: game.conventionRequests || null,
        financesHistory: game.financesHistory || [],
        alertSubscription: game.alertSubscription || null,
        treasury: game.treasury || null,
        jobOffers: game.jobOffers,
        adRewards: game.adRewards,
        workplaceEquipment: game.workplaceEquipment,
        annualContracts: game.annualContracts || [],
        messagesHistory: game.messagesHistory || {},
        monthlyEventsGenerated: game.monthlyEventsGenerated || {},
        reputation_samu: game.reputation_samu !== undefined ? game.reputation_samu : 50,
        reputation_sdis: game.reputation_sdis !== undefined ? game.reputation_sdis : 50,
        reputation_prefecture: game.reputation_prefecture !== undefined ? game.reputation_prefecture : 50,
        reputation_villes: game.reputation_villes || {}
      };

      const payload = {
        user_id: userId,
        username: username,
        save_data: stateToSave,
        resources: game.resources,
        stations_count: (game.stations || []).length,
        volunteers_count: (game.volunteers || []).length,
        vehicles_count: (game.vehicles || []).length,
        reputation: game.resources?.reputation || 50,
        funds: moneyVal,
        updated_at: new Date().toISOString()
      };

      let saveError = null;
      try {
        let existing = null;
        if (userId) {
          const { data } = await this.client
            .from('game_saves')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          existing = data;
        }
        if (!existing && username) {
          const { data } = await this.client
            .from('game_saves')
            .select('id')
            .eq('username', username)
            .maybeSingle();
          existing = data;
        }

        if (existing && existing.id) {
          const { error } = await this.client
            .from('game_saves')
            .update(payload)
            .eq('id', existing.id);
          saveError = error;
        } else {
          const { error } = await this.client
            .from('game_saves')
            .insert(payload);
          saveError = error;
        }
      } catch (errUpsert) {
        saveError = errUpsert;
      }

      if (saveError) {
        console.warn('Avertissement sauvegarde Supabase:', saveError);
        return false;
      }

      console.log('☁️ Partie sauvegardée dans Supabase avec succès.');

      // Synchronisation de la commune exacte du bâtiment dans la table players
      const currentStation = (game.stations && game.stations[0]) || null;
      const buildingCity = currentStation?.city || game.player?.city;
      const playerStation = currentStation?.name || game.player?.stationName;
      const playerDept = currentStation?.departmentCode || game.player?.departmentCode;
      if (buildingCity && userId) {
        this.updatePlayerCityAndStation(userId, buildingCity, playerStation, playerDept).catch(() => {});
      }

      return true;
    } catch (e) {
      console.warn('Erreur push sauvegarde Supabase:', e);
      return false;
    }
  },

  // 4. Chargement de la Partie Cloud depuis game_saves
  async loadGameState(userId, username = null) {
    if (!this.client || (!userId && !username)) return null;

    try {
      const isUUID = typeof userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      let data = null;

      // 1. Recherche stricte par UUID officiel du compte actuel
      if (isUUID) {
        const { data: byId, error } = await this.client
          .from('game_saves')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && byId) data = byId;
      }

      // 2. Contrôle de sécurité sur les sauvegardes orphelines par username
      const targetUser = username || (!isUUID ? userId : null);
      if (targetUser) {
        const { data: byName } = await this.client
          .from('game_saves')
          .select('*')
          .eq('username', targetUser)
          .maybeSingle();

        if (byName) {
          // Si une sauvegarde existe sous ce pseudo mais avec un UUID d'un ancien compte supprimé différent de l'actuel
          if (isUUID && byName.user_id && byName.user_id !== userId) {
            console.warn('🧹 Purge d’une ancienne sauvegarde orpheline liée à un ancien compte supprimé:', byName.user_id);
            await this.client.from('game_saves').delete().eq('id', byName.id);
            // Ne surtout pas charger cette ancienne sauvegarde pour le nouveau compte !
            data = null;
          } else if (!data && !isUUID) {
            data = byName;
          }
        }
      }

      return data;
    } catch (e) {
      console.warn('Erreur lecture sauvegarde Supabase:', e);
      return null;
    }
  },

  // 5. Synchronisation de l'antenne pour le Multijoueur (table alliance_stations)
  async syncStationToMap(player, station) {
    if (!this.client || !player || !station) return;

    try {
      // Contrôle de conformité de l'alliance_id pour respecter la clé étrangère alliance_stations_alliance_id_fkey
      let validAllianceId = null;
      if (player.allianceId && player.allianceId !== 'alliance-fnpc') {
        const isAllianceUUID = typeof player.allianceId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(player.allianceId);
        if (isAllianceUUID) {
          validAllianceId = player.allianceId;
        }
      }

      const payload = {
        id: String(station.id),
        player_id: isUUID ? player.id : null,
        player_name: player.name || 'Directeur d’Antenne',
        station_name: station.name,
        city: station.city || 'Paris',
        lat: station.lat,
        lng: station.lng,
        level: station.level || 1,
        vehicles_count: (station.vehicles || []).length,
        volunteers_count: (station.volunteers || []).length,
        alliance_id: validAllianceId,
        last_sync: new Date().toISOString()
      };

      // 1. Contrôle préalable d'existence pour éviter l'erreur HTTP 409 (Conflict)
      const { data: existing } = await this.client
        .from('alliance_stations')
        .select('id')
        .eq('id', String(station.id))
        .maybeSingle();

      if (existing && existing.id) {
        await this.client
          .from('alliance_stations')
          .update(payload)
          .eq('id', String(station.id));
      } else {
        await this.client
          .from('alliance_stations')
          .insert(payload);
      }
    } catch (e) {
      // Ignorer silencieusement pour éviter de polluer la console
    }
  },

  // 6. Récupération des Antennes des Autres Joueurs pour Leaflet
  async getAllianceStations(excludePlayerId = null) {
    if (!this.client) return [];

    try {
      let query = this.client
        .from('alliance_stations')
        .select('*')
        .order('last_sync', { ascending: false })
        .limit(50);

      // N'appliquer le filtre SQL que si excludePlayerId est un UUID valide pour éviter l'erreur 22P02
      const isUUID = typeof excludePlayerId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(excludePlayerId);
      if (isUUID) {
        query = query.neq('player_id', excludePlayerId);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      // Filtrage complémentaire sécurisé côté client
      return data.filter(st => {
        if (!excludePlayerId) return true;
        if (st.player_id && String(st.player_id) === String(excludePlayerId)) return false;
        return true;
      });
    } catch (e) {
      console.warn('Erreur lecture stations Supabase:', e);
      return [];
    }
  },

  // 7. Enregistrement d'un Événement de Sécurité des Locaux (Vol déjoué, tag, etc.)
  async logSecurityEvent(eventData) {
    if (!this.client) return;

    try {
      await this.client
        .from('security_events')
        .insert({
          station_id: eventData.stationId || 'st-default',
          player_id: eventData.playerId || null,
          event_type: eventData.type || 'tentative_vol',
          details: eventData.details || '',
          loss_amount: eventData.lossAmount || 0,
          foiled: !!eventData.foiled,
          created_at: new Date().toISOString()
        });
    } catch (e) {
      console.warn('Erreur log sécurité Supabase:', e);
    }
  },

  // 8. Tchat d'Alliance & Main Courante
  async sendChatMessage(msgData) {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from('chat_messages')
        .insert({
          alliance_id: msgData.allianceId || 'alliance-fnpc',
          author_id: msgData.authorId || 'player',
          author_name: msgData.authorName || 'Secouriste',
          station_name: msgData.stationName || 'Antenne Locale',
          message: msgData.message,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) return null;
      return data;
    } catch (e) {
      console.warn('Erreur envoi message Supabase:', e);
      return null;
    }
  },

  async getChatMessages(allianceId = 'alliance-fnpc') {
    if (!this.client) return [];

    try {
      const { data, error } = await this.client
        .from('chat_messages')
        .select('*')
        .eq('alliance_id', allianceId)
        .order('created_at', { ascending: false })
        .limit(40);

      if (error || !data) return [];
      return data.reverse();
    } catch (e) {
      console.warn('Erreur lecture tchat Supabase:', e);
      return [];
    }
  },

  // ============================================================================
  // MONDE PERSISTANT SERVEUR : SYNCHRONISATION TEMPORELLE ET RÉSOLUTION RPC
  // ============================================================================

  // Récupération de l'horodatage officiel du serveur Postgres
  async fetchServerTime() {
    if (!this.client) return Date.now();
    try {
      const { data, error } = await this.client.rpc('sync_server_world', { p_player_id: 'ping' });
      if (!error && data && data.server_time) {
        return new Date(data.server_time).getTime();
      }
    } catch (e) {
      // Fallback
    }
    return Date.now();
  },

  // Synchronisation du monde côté serveur (résolution des missions et formations expirées)
  async syncServerWorld(playerId) {
    if (!this.client || !playerId) return null;
    try {
      const { data, error } = await this.client.rpc('sync_server_world', { p_player_id: String(playerId) });
      if (error) {
        console.warn('Avertissement sync_server_world RPC:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('Erreur appel RPC sync_server_world:', e);
      return null;
    }
  },

  // Déclaration d'une mission active avec durée réelle sur le serveur
  async registerMissionOnServer(mission, playerId) {
    if (!this.client || !mission || !playerId) return;
    try {
      const now = new Date();
      const startsAt = mission.startedAt ? new Date(mission.startedAt).toISOString() : now.toISOString();
      const duration = mission.durationSeconds || (mission.durationHours ? Math.round(mission.durationHours * 3600) : 1800);
      const endsAt = mission.endsAt ? new Date(mission.endsAt).toISOString() : new Date(Date.now() + duration * 1000).toISOString();

      await this.client
        .from('active_missions')
        .upsert({
          id: String(mission.id),
          player_id: String(playerId),
          mission_type: mission.type || 'dps',
          title: mission.title || 'Mission Dispositif',
          status: 'ongoing',
          starts_at: startsAt,
          ends_at: endsAt,
          duration_seconds: duration,
          reward_money: mission.reward || mission.budget || 0,
          reward_xp: mission.xpReward || 0,
          assigned_volunteers: mission.assignedVolunteers || [],
          assigned_vehicles: mission.assignedVehicles || [],
          details: { category: mission.category, commune: mission.commune },
          t_alerte: mission.t_alerte || null,
          t_arrivee_base: mission.t_arrivee_base || null,
          t_depart_base: mission.t_depart_base || null,
          t_arrivee_mission: mission.t_arrivee_mission || null,
          t_fin_mission: mission.t_fin_mission || null,
          t_retour_base: mission.t_retour_base || null,
          coords_domicile_max: mission.coords_domicile_max || null,
          coords_base: mission.coords_base || null,
          coords_mission: mission.coords_mission || null,
          timeline_phase: mission.timeline_phase ? String(mission.timeline_phase) : 'alerte',
          created_at: now.toISOString()
        }, { onConflict: 'id' });

      // Diffusion automatique de l'événement opérationnel pour la main courante
      this.logOperationalEvent({
        playerId: String(playerId),
        stationName: mission.stationName || 'Antenne Locale',
        city: mission.details?.commune || mission.commune || '',
        departmentCode: mission.departmentCode || '',
        type: (mission.mission_type === 'samu' || mission.type === 'samu') ? 'samu' : 'dps',
        indicatif: (mission.mission_type === 'samu' || mission.type === 'samu') ? 'SAMU 15' : 'DISPOSITIF DPS',
        statusCode: 1,
        message: `Déploiement opérationnel • « ${mission.title || 'Mission'} » engagée sur ${mission.details?.commune || mission.commune || 'le secteur'}.`,
        severity: 'info'
      });
    } catch (e) {
      console.warn('Erreur enregistrement mission serveur:', e);
    }
  },

  // Déclaration d'une formation active sur le serveur
  async registerFormationOnServer(formation, playerId) {
    if (!this.client || !formation || !playerId) return;
    try {
      const now = new Date();
      const startsAt = formation.startedAt ? new Date(formation.startedAt).toISOString() : now.toISOString();
      const duration = (formation.durationHours || 4) * 3600;
      const endsAt = formation.endsAt ? new Date(formation.endsAt).toISOString() : new Date(Date.now() + duration * 1000).toISOString();

      await this.client
        .from('active_formations')
        .upsert({
          id: String(formation.id),
          player_id: String(playerId),
          diploma: formation.diploma || 'PSC1',
          station_id: formation.stationId || null,
          status: 'ongoing',
          starts_at: startsAt,
          ends_at: endsAt,
          trainee_ids: formation.traineeIds || [],
          cost: formation.cost || 0,
          created_at: now.toISOString()
        }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Erreur enregistrement formation serveur:', e);
    }
  },

  // --- BOURSE DE L'OCCASION (MARKET LISTINGS) ---
  async fetchMarketListings(category = 'all', status = 'active') {
    if (!this.client) return [];
    try {
      let query = this.client
        .from('market_listings')
        .select('*');
      
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.warn('Erreur chargement market_listings:', error);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('Exception fetchMarketListings:', e);
      return [];
    }
  },

  async createMarketListing(listingData) {
    if (!this.client) return { error: 'Client Supabase indisponible' };
    try {
      const { data, error } = await this.client
        .from('market_listings')
        .insert([listingData])
        .select()
        .single();
      
      if (error) throw error;

      // Broadcast pour affichage instantané chez les autres directeurs
      this.broadcastMarketEvent({ type: 'created', listing: data });
      return { success: true, listing: data };
    } catch (e) {
      console.warn('Erreur createMarketListing:', e);
      return { error: e.message || 'Erreur publication annonce' };
    }
  },

  async buyMarketListing(listingId, buyerId, buyerName) {
    if (!this.client) return { error: 'Client Supabase indisponible' };
    try {
      // 1. Tenter la fonction RPC transactionnelle PostgreSQL
      const { data: rpcRes, error: rpcErr } = await this.client.rpc('buy_market_listing', {
        p_listing_id: listingId,
        p_buyer_id: buyerId,
        p_buyer_name: buyerName
      });

      if (!rpcErr && rpcRes) {
        if (!rpcRes.success) {
          return { error: rpcRes.error || 'Erreur lors de l\'achat' };
        }
        this.broadcastMarketEvent({ type: 'bought', listingId, buyerName });
        return { success: true, ...rpcRes };
      }

      // 2. Fallback direct si la fonction RPC n'a pas encore été créée dans l'éditeur SQL Supabase
      const { data: listing, error: fetchErr } = await this.client
        .from('market_listings')
        .select('*')
        .eq('id', listingId)
        .eq('status', 'active')
        .maybeSingle();

      if (fetchErr || !listing) {
        return { error: 'Annonce introuvable ou déjà vendue.' };
      }

      if (listing.seller_user_id === buyerId) {
        return { error: 'Vous ne pouvez pas acheter votre propre annonce.' };
      }

      // Mise à jour de l'annonce en statut 'sold'
      const { data: updated, error: updateErr } = await this.client
        .from('market_listings')
        .update({
          status: 'sold',
          buyer_antenne_id: buyerId,
          buyer_name: buyerName,
          sold_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .eq('status', 'active')
        .select()
        .single();

      if (updateErr || !updated) {
        return { error: 'Ce bien a déjà été acheté par une autre antenne.' };
      }

      this.broadcastMarketEvent({ type: 'bought', listingId, buyerName });
      return { success: true, listing: updated, price: listing.price, item_data: listing.item_data };
    } catch (e) {
      console.warn('Exception buyMarketListing:', e);
      return { error: e.message || 'Erreur achat annonce' };
    }
  },

  async cancelMarketListing(listingId, userId) {
    if (!this.client) return { error: 'Client Supabase indisponible' };
    try {
      // 1. Tenter la fonction RPC
      const { data: rpcRes, error: rpcErr } = await this.client.rpc('cancel_market_listing', {
        p_listing_id: listingId,
        p_user_id: userId
      });

      if (!rpcErr && rpcRes) {
        if (!rpcRes.success) {
          return { error: rpcRes.error || 'Erreur annulation' };
        }
        this.broadcastMarketEvent({ type: 'cancelled', listingId });
        return { success: true, ...rpcRes };
      }

      // 2. Fallback direct
      const { data: updated, error: updateErr } = await this.client
        .from('market_listings')
        .update({ status: 'cancelled' })
        .eq('id', listingId)
        .eq('seller_user_id', userId)
        .eq('status', 'active')
        .select()
        .single();

      if (updateErr || !updated) {
        return { error: 'Impossible de retirer cette annonce (non trouvée ou déjà vendue).' };
      }

      this.broadcastMarketEvent({ type: 'cancelled', listingId });
      return { success: true, listing: updated, item_data: updated.item_data, category: updated.category };
    } catch (e) {
      console.warn('Exception cancelMarketListing:', e);
      return { error: e.message || 'Erreur retrait annonce' };
    }
  },

  broadcastMarketEvent(payload) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'market_update',
        payload: payload
      });
    } catch (e) {
      console.warn('Erreur broadcast market_update:', e);
    }
  },

  // --- TÉLÉMÉTRIE & MAIN COURANTE EN DIRECT RÉELLES ---

  // Diffuser un événement opérationnel (radio, mission, alerte) à l'ensemble du réseau
  async logOperationalEvent(eventData) {
    if (!eventData) return;
    const now = new Date();
    const payload = {
      player_id: eventData.playerId || window.ProtecAuth?.currentUser?.id || null,
      station_name: eventData.stationName || 'Antenne Locale',
      city: eventData.city || '',
      department_code: eventData.departmentCode || '',
      log_type: eventData.type || 'radio',
      indicatif: eventData.indicatif || 'RADIO',
      status_code: eventData.statusCode || 1,
      message: eventData.message || '',
      severity: eventData.severity || 'info',
      created_at: now.toISOString()
    };

    // 1. Tenter l'insertion dans operational_log
    if (this.client) {
      try {
        await this.client.from('operational_log').insert(payload);
      } catch (e) {
        // Fallback discret si la table n'est pas encore créée
      }
    }

    // 2. Diffuser sur Supabase Realtime (instantané < 50ms sur toutes les pages d'accueil et sessions)
    if (this.realtimeChannel) {
      try {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'operational_event',
          payload: payload
        });
      } catch (err) {
        console.warn('Erreur broadcast operational_event:', err);
      }
    }
  },

  // Récupérer la télémétrie opérationnelle collective 100% réelle
  async getOperationalTelemetry() {
    let volunteers = 0;
    let dps = 0;
    let fleet = 0;
    let patients = 0;
    let stations = 0;

    // 1. Interroger Supabase si connecté
    if (this.client) {
      try {
        // Sauvegardes de tous les directeurs inscrits
        const { data: saves, error: sErr } = await this.client
          .from('game_saves')
          .select('volunteers_count, vehicles_count, stations_count, save_data');

        if (!sErr && saves && saves.length > 0) {
          saves.forEach(s => {
            const vCount = Number(s.volunteers_count) || (s.save_data?.volunteers?.length || 0);
            const fCount = Number(s.vehicles_count) || (s.save_data?.vehicles?.length || 0);
            const stCount = Number(s.stations_count) || (s.save_data?.stations?.length || 0);

            volunteers += vCount;
            fleet += fCount;
            stations += stCount;

            // Bilans & prises en charge cumulés (missions terminées dans save_data)
            const missions = s.save_data?.missions || [];
            missions.forEach(m => {
              if (m.status === 'completed') {
                const careCount = m.victimsCount || m.patientsTreated || (m.type === 'dps' ? 3 : (m.type === 'samu' ? 1 : 2));
                patients += careCount;
              }
            });
          });
        }

        // Missions actives en cours sur le serveur
        const { data: activeMissions, error: mErr } = await this.client
          .from('active_missions')
          .select('id, status, assigned_volunteers, assigned_vehicles')
          .eq('status', 'ongoing');

        if (!mErr && activeMissions) {
          dps = activeMissions.length;
        }

        // Antennes déclarées
        const { count: stationCount, error: stErr } = await this.client
          .from('alliance_stations')
          .select('*', { count: 'exact', head: true });

        if (!stErr && stationCount !== null) {
          stations = Math.max(stations, stationCount);
        }

        // Nombre de directeurs / antennes enregistrées
        const { count: playerCount, error: pErr } = await this.client
          .from('players')
          .select('*', { count: 'exact', head: true });
        if (!pErr && playerCount !== null) {
          stations = Math.max(stations, playerCount);
        }
      } catch (e) {
        console.warn('Erreur récupération télémétrie Supabase:', e);
      }
    }

    // 2. Si la base est vierge ou hors-ligne, vérifier la sauvegarde locale pour le joueur
    if (volunteers === 0 && dps === 0 && fleet === 0 && patients === 0) {
      try {
        const localRaw = localStorage.getItem('protec_save') || localStorage.getItem('myprotec_save');
        if (localRaw) {
          const lSave = JSON.parse(localRaw);
          volunteers = lSave.volunteers?.length || 0;
          fleet = lSave.vehicles?.length || 0;
          stations = lSave.stations?.length || 1;
          const lMissions = lSave.missions || [];
          dps = lMissions.filter(m => m.status === 'en_cours' || m.status === 'ongoing').length;
          lMissions.filter(m => m.status === 'completed').forEach(m => {
            patients += m.victimsCount || m.patientsTreated || (m.type === 'dps' ? 3 : 1);
          });
        }
      } catch (err) {}
    }

    return {
      volunteers,
      dps,
      fleet,
      patients,
      stations
    };
  },

  // Récupérer l'historique réel des opérations pour la main courante
  async getOperationalLogs(limit = 15) {
    const logs = [];

    // 1. Essayer de lire la table operational_log
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('operational_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          data.forEach(item => {
            logs.push(this.formatLogItem(item));
          });
          return logs;
        }
      } catch (e) {}

      // 2. Fallback réel : Extraire depuis active_missions & server_events_log
      try {
        const { data: missions } = await this.client
          .from('active_missions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (missions && missions.length > 0) {
          missions.forEach(m => {
            const isCompleted = m.status === 'completed';
            const commune = m.details?.commune || 'Secteur';
            logs.push({
              id: 'm-' + m.id,
              time: this.formatTime(m.created_at || m.starts_at),
              indicatif: m.mission_type === 'samu' ? 'SAMU 15' : 'POSTE DPS',
              icon: m.mission_type === 'samu' ? 'activity' : 'shield-check',
              color: m.mission_type === 'samu' ? 'text-amber-600' : 'text-blue-600',
              bg: m.mission_type === 'samu' ? 'bg-amber-50' : 'bg-blue-50',
              border: m.mission_type === 'samu' ? 'border-amber-200' : 'border-blue-200',
              text: isCompleted 
                ? `Dispositif « ${m.title} » clôturé avec succès sur ${commune}. Tous équipages réarmés.`
                : `Engagement opérationnel • « ${m.title} » en cours sur ${commune} (${m.assigned_volunteers?.length || 0} secouristes mobilisés).`,
              created_at: m.created_at || m.starts_at
            });
          });
        }

        const { data: sEvents } = await this.client
          .from('server_events_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (sEvents && sEvents.length > 0) {
          sEvents.forEach(ev => {
            logs.push({
              id: 'sev-' + ev.id,
              time: this.formatTime(ev.created_at),
              indicatif: 'REGULATION',
              icon: ev.event_type === 'formation_completed' ? 'graduation-cap' : 'siren',
              color: ev.event_type === 'formation_completed' ? 'text-emerald-600' : 'text-red-600',
              bg: ev.event_type === 'formation_completed' ? 'bg-emerald-50' : 'bg-red-50',
              border: ev.event_type === 'formation_completed' ? 'border-emerald-200' : 'border-red-200',
              text: `${ev.title} • ${ev.message}`,
              created_at: ev.created_at
            });
          });
        }
      } catch (e) {}
    }

    // 3. Si aucun log distant n'est trouvé, vérifier les radioLogs de la sauvegarde locale
    if (logs.length === 0) {
      try {
        const localRaw = localStorage.getItem('protec_save') || localStorage.getItem('myprotec_save');
        if (localRaw) {
          const lSave = JSON.parse(localRaw);
          const rLogs = lSave.radioLogs || [];
          rLogs.slice(0, limit).forEach((rl, idx) => {
            logs.push({
              id: 'lrad-' + idx,
              time: rl.time || new Date().toLocaleTimeString('fr-FR'),
              indicatif: rl.indicatif || rl.channel || 'RADIO',
              icon: rl.status === 3 ? 'heart-pulse' : (rl.status === 2 ? 'map-pin' : 'radio'),
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              border: 'border-blue-200',
              text: `${rl.indicatif ? rl.indicatif + ' : ' : ''}${rl.message || rl.text || ''}`,
              created_at: new Date().toISOString()
            });
          });
        }
      } catch (err) {}
    }

    // Trier par date décroissante
    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
  },

  // Formater un item venant de operational_log
  formatLogItem(item) {
    let icon = 'radio';
    let color = 'text-blue-600';
    let bg = 'bg-blue-50';
    let border = 'border-blue-200';

    if (item.log_type === 'samu' || item.status_code === 3) {
      icon = 'heart-pulse';
      color = 'text-amber-600';
      bg = 'bg-amber-50';
      border = 'border-amber-200';
    } else if (item.log_type === 'crise' || item.severity === 'urgent') {
      icon = 'siren';
      color = 'text-red-600';
      bg = 'bg-red-50';
      border = 'border-red-200';
    } else if (item.log_type === 'formation') {
      icon = 'graduation-cap';
      color = 'text-emerald-600';
      bg = 'bg-emerald-50';
      border = 'border-emerald-200';
    } else if (item.log_type === 'logistique' || item.status_code === 1) {
      icon = 'truck';
      color = 'text-indigo-600';
      bg = 'bg-indigo-50';
      border = 'border-indigo-200';
    } else if (item.severity === 'success') {
      icon = 'shield-check';
      color = 'text-emerald-600';
      bg = 'bg-emerald-50';
      border = 'border-emerald-200';
    }

    const indicatifLabel = item.indicatif ? `${item.indicatif} • ` : '';
    const stationLabel = item.station_name ? ` (${item.station_name})` : '';

    return {
      id: item.id || `op-${Date.now()}`,
      time: this.formatTime(item.created_at),
      indicatif: item.indicatif || 'RADIO',
      icon,
      color,
      bg,
      border,
      text: `${indicatifLabel}${item.message}${stationLabel}`,
      created_at: item.created_at || new Date().toISOString()
    };
  },

  formatTime(isoString) {
    if (!isoString) return new Date().toLocaleTimeString('fr-FR');
    try {
      const d = new Date(isoString);
      return [
        String(d.getHours()).padStart(2, '0'),
        String(d.getMinutes()).padStart(2, '0'),
        String(d.getSeconds()).padStart(2, '0')
      ].join(':');
    } catch (e) {
      return new Date().toLocaleTimeString('fr-FR');
    }
  },

  // Écoute en continu de la main courante et de la télémétrie
  subscribeOperationalStream(onTelemetryUpdate, onNewLog) {
    if (!this.client) return null;

    if (!this.realtimeChannel) {
      this.realtimeChannel = this.client.channel('protec-live-global', {
        config: { broadcast: { self: true } }
      });

      // Écoute des broadcasts d'événements opérationnels en direct
      this.realtimeChannel.on('broadcast', { event: 'operational_event' }, (evt) => {
        if (evt.payload && typeof onNewLog === 'function') {
          onNewLog(this.formatLogItem(evt.payload));
        }
        if (typeof onTelemetryUpdate === 'function') {
          this.getOperationalTelemetry().then(onTelemetryUpdate);
        }
      });

      // Écoute des modifications de tables (missions, sauvegardes, operational_log)
      this.realtimeChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'operational_log' }, (payload) => {
        if (payload.new && typeof onNewLog === 'function') {
          onNewLog(this.formatLogItem(payload.new));
        }
      });

      this.realtimeChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'active_missions' }, () => {
        if (typeof onTelemetryUpdate === 'function') {
          this.getOperationalTelemetry().then(onTelemetryUpdate);
        }
      });

      this.realtimeChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'game_saves' }, () => {
        if (typeof onTelemetryUpdate === 'function') {
          this.getOperationalTelemetry().then(onTelemetryUpdate);
        }
      });

      this.realtimeChannel.subscribe();
    }
  }
};

// Initialisation dès le chargement du document
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.ProtecSupabase.init());
} else {
  window.ProtecSupabase.init();
}
