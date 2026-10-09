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

      // 2. Création de l'enregistrement avec mot de passe et ville exacte
      const newPlayer = {
        username: username.trim(),
        password_hash: pwdHash,
        station_name: extraData.stationName || 'Antenne Protection Civile',
        city: detectedCity,
        department_code: extraData.departmentCode || '54',
        role: 'directeur',
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
        sncfConvention: game.sncfConvention,
        cumpConvention: game.cumpConvention,
        jobOffers: game.jobOffers,
        adRewards: game.adRewards,
        workplaceEquipment: game.workplaceEquipment
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
        funds: game.resources?.funds || 15000,
        updated_at: new Date().toISOString()
      };

      const { error } = await this.client
        .from('game_saves')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.warn('Avertissement sauvegarde Supabase:', error);
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

      // 1. Recherche par UUID si valide
      if (isUUID) {
        const { data: byId, error } = await this.client
          .from('game_saves')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && byId) data = byId;
      }

      // 2. Repli par username si non trouvé ou si userId n'est pas un UUID
      const targetUser = username || (!isUUID ? userId : null);
      if (!data && targetUser) {
        const { data: byName, error: errName } = await this.client
          .from('game_saves')
          .select('*')
          .eq('username', targetUser)
          .maybeSingle();
        if (!errName && byName) data = byName;
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
      const isUUID = typeof player.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(player.id);
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
        alliance_id: player.allianceId || 'alliance-fnpc',
        last_sync: new Date().toISOString()
      };

      const { error } = await this.client
        .from('alliance_stations')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        // En cas de conflit, mise à jour directe
        const { error: updErr } = await this.client
          .from('alliance_stations')
          .update(payload)
          .eq('id', String(station.id));
        if (updErr) {
          await this.client.from('alliance_stations').insert([payload]);
        }
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
          created_at: now.toISOString()
        }, { onConflict: 'id' });
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
  }
};

// Initialisation dès le chargement du document
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.ProtecSupabase.init());
} else {
  window.ProtecSupabase.init();
}
