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
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Réseau Connecté';
      } else {
        badge.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 border border-amber-300';
        badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Mode Hors-ligne';
      }
    }
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

      // 2. Création de l'enregistrement
      const newPlayer = {
        username: username.trim(),
        station_name: extraData.stationName || 'Antenne Locale',
        city: extraData.city || 'Paris',
        department_code: extraData.departmentCode || '75',
        role: 'directeur',
        alliance_id: extraData.allianceId || 'alliance-fnpc',
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

  // 3. Sauvegarde Cloud de la Partie dans la table game_saves
  async saveGameState(userId, username, game) {
    if (!this.client || !userId) return false;

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
  }
};

// Initialisation dès le chargement du document
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.ProtecSupabase.init());
} else {
  window.ProtecSupabase.init();
}
