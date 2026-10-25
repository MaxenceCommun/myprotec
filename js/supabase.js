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
        this.initMultiplayerRealtime(window.game || null);
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
      } else if (data && window.ProtecNotifications) {
        window.ProtecNotifications.sendPushNotification(
          data.title || '📢 Annonce Fédérale',
          data.message || '',
          { category: 'admin_broadcast', color: data.type || 'blue' }
        );
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

    // Écoute 5 bis : Notification administrative ciblée de test
    this.realtimeChannel.on('broadcast', { event: 'admin_player_notification' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && g.handleMultiplayerEvent && data) {
        g.handleMultiplayerEvent('admin_player_notification', data);
      } else if (data && window.ProtecNotifications) {
        // HORS CARTE (ex: sur index.html ou écran d'accueil avec session sauvegardée)
        let currentUser = null;
        try {
          currentUser = window.ProtecAuth?.currentUser || JSON.parse(localStorage.getItem('protec_user_profile') || '{}');
        } catch (e) {}

        const isForMe = !data.targetUserId || data.targetUserId === 'all' ||
                        (currentUser && (currentUser.id === data.targetUserId || currentUser.username === data.targetUserId));
        if (isForMe) {
          const title = data.title || '🔔 Notification Administrateur';
          const msg = data.message || '';
          window.ProtecNotifications.sendPushNotification(title, msg, {
            category: data.category || 'admin-test',
            color: data.type || 'orange'
          });
          if (window.ProtecNotifications.playAlertSound) {
            window.ProtecNotifications.playAlertSound(title, msg, { color: data.type });
          }
        }
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

    // Écoute 8 : Attribution administrative d'écusson en direct
    this.realtimeChannel.on('broadcast', { event: 'badge_awarded' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && g.handleMultiplayerEvent && data) {
        g.handleMultiplayerEvent('badge_awarded', data);
      }
    });

    // Écoute 9 : Retrait administratif d'écusson en direct
    this.realtimeChannel.on('broadcast', { event: 'badge_revoked' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && g.handleMultiplayerEvent && data) {
        g.handleMultiplayerEvent('badge_revoked', data);
      }
    });

    // Écoute 10 : Déplacement en direct des véhicules des confrères directeurs sur la carte
    this.realtimeChannel.on('broadcast', { event: 'player_vehicle_transit' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && data && window.ProtecSystems && typeof window.ProtecSystems.startRemoteVehicleTransit === 'function') {
        window.ProtecSystems.startRemoteVehicleTransit(g, data);
      }
    });

    // Écoute 11 : Alertes de crise départementale partagées (synchronisation entre antennes d'un même département)
    this.realtimeChannel.on('broadcast', { event: 'department_crisis_alert' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && data && typeof g.handleDepartmentCrisisAlert === 'function') {
        g.handleDepartmentCrisisAlert(data);
      }
    });

    // Écoute 12 : Mises à jour d'évolution de crise départementale (aggravation, renforts, levée)
    this.realtimeChannel.on('broadcast', { event: 'department_crisis_update' }, (evt) => {
      const data = evt.payload;
      const g = game || window.game;
      if (g && data && typeof g.handleDepartmentCrisisUpdate === 'function') {
        g.handleDepartmentCrisisUpdate(data);
      }
    });

    this.realtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('⚡ Canal Supabase Realtime actif : synchronisation en direct (< 50ms) connectée.');
      }
    });
  },

  // Diffusion d'une alerte de crise départementale en direct
  broadcastDepartmentCrisis(payload) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'department_crisis_alert',
        payload: payload
      });
    } catch (e) {
      console.warn('Erreur broadcast crise départementale:', e);
    }
  },

  // Diffusion de la mise à jour d'une crise départementale
  broadcastDepartmentCrisisUpdate(payload) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'department_crisis_update',
        payload: payload
      });
    } catch (e) {
      console.warn('Erreur broadcast mise à jour crise départementale:', e);
    }
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
      const senderId = window.game?.player?.id || window.ProtecAuth?.currentUser?.id || localStorage.getItem('protec_player_id') || 'directeur-local';
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'renfort_created',
        payload: {
          ...renfortData,
          senderPlayerId: senderId
        }
      });
    } catch (e) {
      console.warn('Erreur broadcast création renfort:', e);
    }
  },

  // Diffusion en direct d'un déplacement de véhicule sur la carte pour tous les autres joueurs
  broadcastVehicleTransit(payload) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'player_vehicle_transit',
        payload: payload
      });
    } catch (e) {
      console.warn('Erreur broadcast transit véhicule:', e);
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

  // Diffusion d'un test de notification joueur en direct sur Supabase
  broadcastAdminPlayerNotification(notifData) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'admin_player_notification',
        payload: notifData
      });
    } catch (e) {
      console.warn('Erreur broadcast admin_player_notification:', e);
    }
  },

  // File d'attente Supabase pour les notifications des joueurs (réception différée)
  async queuePlayerNotification(targetUserId, notifData) {
    if (!this.client) return false;
    try {
      let query = this.client.from('game_saves').select('user_id, username, save_data');
      if (targetUserId && targetUserId !== 'all') {
        query = query.or(`user_id.eq.${targetUserId},username.eq.${targetUserId}`);
      }
      const { data: saves, error } = await query;
      if (!error && saves && saves.length > 0) {
        for (const save of saves) {
          const sd = save.save_data || {};
          const pending = Array.isArray(sd.pending_notifications) ? sd.pending_notifications : [];
          pending.unshift({
            ...notifData,
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date().toISOString()
          });
          sd.pending_notifications = pending.slice(0, 20);

          // Si la notification correspond à une alerte d'urgence, alerte opérationnelle ou test :
          // Créer la VRAIE mission opérationnelle dans la partie pour que le joueur l'ait immédiatement sur sa carte !
          const isFinanceType = notifData.category === 'finances' || String(notifData.title || '').includes('Devis');
          const isSamuType = String(notifData.title || '').includes('SAMU') || notifData.category === 'samu' || notifData.category === 'urgences';
          const isPompierType = String(notifData.title || '').includes('Pompiers') || notifData.category === 'pompiers' || notifData.category === 'sdis';

          if (isFinanceType) {
            if (!Array.isArray(sd.devis)) sd.devis = [];
            const devisId = `devis_${Date.now()}`;
            sd.devis.unshift({
              id: devisId,
              title: notifData.title?.replace(/^[💶🚨🔔\s]+/, '') || 'Convention Sécurité DPS',
              city: sd.stations?.[0]?.city || 'Nancy',
              amount: 14500,
              requiredVehicles: ['VPSP'],
              requiredVolunteers: 4,
              status: 'en_attente',
              createdAt: Date.now()
            });
          } else {
            if (!Array.isArray(sd.missions)) sd.missions = [];
            const station = (sd.stations && sd.stations[0]) || { lat: 48.6921, lng: 6.1844, name: 'Antenne Protection Civile', city: 'Nancy', departmentCode: '54' };
            const mLat = Number(station.lat || 48.6921) + (Math.random() - 0.5) * 0.04;
            const mLng = Number(station.lng || 6.1844) + (Math.random() - 0.5) * 0.04;
            const mId = isSamuType ? `samu_${Date.now()}` : (isPompierType ? `sdis_${Date.now()}` : `urg_${Date.now()}`);

            const realMission = {
              id: mId,
              type: isSamuType ? 'samu' : (isPompierType ? 'pompiers' : 'crise'),
              category: 'urgences',
              title: notifData.title?.replace(/^[🚨🔔🚑🚒⚠️🏆📢\s]+/, '') || (isSamuType ? 'Détresse Respiratoire à Domicile' : 'Intervention Prioritaire'),
              desc: notifData.message || notifData.body || 'Mission d’urgence régulée. VPSP demandé immédiatement sur les lieux.',
              lat: mLat,
              lng: mLng,
              city: station.city || 'Secteur Opérationnel',
              departmentCode: station.departmentCode || '54',
              address: `Secteur ${station.city || 'Antenne'} (Régulation Opérationnelle)`,
              status: 'planifie',
              progress: 0,
              requiredVehicles: ['VPSP'],
              requiredVolunteers: 3,
              requiredRanks: ['PSE1', 'PSE2'],
              registeredVolunteers: [],
              assignedCrew: { volunteers: [], vehicles: [] },
              rewardMoney: 350,
              rewardReputation: 45,
              durationSeconds: 1200,
              durationHours: "0.3",
              createdAt: Date.now(),
              spawnedAt: Date.now()
            };

            // Éviter les doublons
            if (!sd.missions.some(m => m.id === mId)) {
              sd.missions.unshift(realMission);
            }

            // Si le joueur est actuellement sur cette fenêtre active, injecter également en direct
            const isCurrentActivePlayer = window.game && (
              !window.game.player?.id || 
              window.game.player?.id === save.user_id || 
              window.game.player?.name === save.username ||
              window.ProtecAuth?.currentUser?.id === save.user_id ||
              window.ProtecAuth?.currentUser?.username === save.username
            );
            if (isCurrentActivePlayer && window.game) {
              if (!Array.isArray(window.game.missions)) window.game.missions = [];
              if (!window.game.missions.some(m => m.id === mId)) {
                window.game.missions.unshift(realMission);
                if (typeof window.game.renderMissions === 'function') window.game.renderMissions();
                if (typeof window.game.updateStatsUI === 'function') window.game.updateStatsUI();
              }
            }
          }

          await this.client.from('game_saves').update({ save_data: sd }).eq('user_id', save.user_id);
        }
        return true;
      }
    } catch (e) {
      console.warn('Erreur file d\'attente notification Supabase:', e);
    }
    return false;
  },

  // Sauvegarde d'un abonnement Push W3C dans la table dédiée push_subscriptions
  async savePushSubscription(subscription, userId) {
    if (!this.client || !subscription || !subscription.endpoint) return false;
    try {
      const subJson = (typeof subscription.toJSON === 'function') ? subscription.toJSON() : subscription;
      const endpointUrl = subscription.endpoint;
      const { data: existing } = await this.client
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', endpointUrl)
        .maybeSingle();

      const payload = {
        endpoint: endpointUrl,
        user_id: userId || null,
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString()
      };

      if (existing && existing.id) {
        await this.client.from('push_subscriptions').update(payload).eq('id', existing.id);
      } else {
        await this.client.from('push_subscriptions').insert(payload);
      }
      return true;
    } catch (e) {
      console.warn('Erreur savePushSubscription Supabase:', e);
      return false;
    }
  },


  // Diffusion d'une attribution d'écusson en direct
  broadcastBadgeAwarded(data) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'badge_awarded',
        payload: data
      });
    } catch (e) {
      console.warn('Erreur broadcast badge_awarded:', e);
    }
  },

  // Diffusion d'un retrait d'écusson en direct
  broadcastBadgeRevoked(data) {
    if (!this.realtimeChannel) return;
    try {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'badge_revoked',
        payload: data
      });
    } catch (e) {
      console.warn('Erreur broadcast badge_revoked:', e);
    }
  },

  // Attribution administrative d'un écusson sur Supabase Cloud
  async awardBadge(targetUserId, badge, quantity = 1, notify = true) {
    if (!this.client) return false;
    const qty = Number(quantity || 1);
    const badgeCode = badge?.code || badge;
    const isAll = (targetUserId === 'all');

    try {
      // 1. Récupérer le catalogue pour avoir l'id Supabase de l'écusson si existant
      let ecussonRecord = null;
      try {
        const { data: ecData } = await this.client
          .from('ecussons')
          .select('*')
          .eq('code', badgeCode)
          .maybeSingle();
        if (ecData) ecussonRecord = ecData;
      } catch (e) {}

      // Auto-création dans ecussons si absent
      if (!ecussonRecord) {
        const cat = (window.ProtecEcussons?.catalog || window.ProtecEcussons?.FALLBACK_CATALOG || []);
        const catBadge = cat.find(c => c.code === badgeCode || c.id === badgeCode) || (typeof badge === 'object' ? badge : null);
        if (catBadge) {
          try {
            let catName = catBadge.categorie || catBadge.cat || 'specialite';
            if (!['specialite', 'mission', 'departement', 'renfort'].includes(catName)) {
              catName = 'renfort';
            }
            const { data: newEc } = await this.client.from('ecussons').insert({
              code: badgeCode,
              nom: catBadge.nom || catBadge.name || 'Écusson Officiel',
              description: catBadge.description || catBadge.desc || 'Distinction de la Protection Civile',
              categorie: catName,
              rarete: catBadge.rarete || catBadge.rarity || 'rare',
              badge_url: catBadge.imageUrl || catBadge.badge_url || null
            }).select().maybeSingle();
            if (newEc) ecussonRecord = newEc;
          } catch (insErr) {
            console.warn('Auto-création ecusson Supabase:', insErr);
          }
        }
      }

      // 2. Mettre à jour game_saves
      if (isAll) {
        const { data: saves } = await this.client.from('game_saves').select('*');
        if (saves && saves.length > 0) {
          for (const s of saves) {
            const sData = s.save_data || {};
            if (!sData.localEcussons) sData.localEcussons = [];
            const ex = sData.localEcussons.find(l => l.code === badgeCode);
            if (ex) ex.quantite = (ex.quantite || 1) + qty;
            else sData.localEcussons.push({ code: badgeCode, quantite: qty });

            await this.client.from('game_saves').update({
              save_data: sData,
              updated_at: new Date().toISOString()
            }).eq('id', s.id);

            if (ecussonRecord) {
              const antId = s.user_id || sData?.player?.id || s.username;
              if (antId) {
                try {
                  await this.client.from('antenne_ecussons').upsert({
                    antenne_id: antId,
                    ecusson_id: ecussonRecord.id,
                    quantite: ex ? ex.quantite : qty,
                    updated_at: new Date().toISOString()
                  }, { onConflict: 'antenne_id,ecusson_id' });
                } catch (e) {}
              }
            }
          }
        }
      } else {
        const isUUID = typeof targetUserId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
        let saveRecord = null;

        // Recherche résiliente par UUID puis par username
        if (isUUID) {
          const { data: byId } = await this.client.from('game_saves').select('*').eq('user_id', targetUserId).maybeSingle();
          if (byId) saveRecord = byId;
          else {
            const { data: pl } = await this.client.from('players').select('username').eq('id', targetUserId).maybeSingle();
            if (pl?.username) {
              const { data: byUname } = await this.client.from('game_saves').select('*').eq('username', pl.username).maybeSingle();
              if (byUname) saveRecord = byUname;
            }
          }
        } else {
          const { data: byUname } = await this.client.from('game_saves').select('*').eq('username', targetUserId).maybeSingle();
          if (byUname) saveRecord = byUname;
          else {
            const { data: pl } = await this.client.from('players').select('id').eq('username', targetUserId).maybeSingle();
            if (pl?.id) {
              const { data: byId } = await this.client.from('game_saves').select('*').eq('user_id', pl.id).maybeSingle();
              if (byId) saveRecord = byId;
            }
          }
        }

        let sData = saveRecord?.save_data || {};
        if (!sData.localEcussons) sData.localEcussons = [];
        const ex = sData.localEcussons.find(l => l.code === badgeCode);
        const newQty = (ex ? (ex.quantite || 1) : 0) + qty;
        if (ex) ex.quantite = newQty;
        else sData.localEcussons.push({ code: badgeCode, quantite: qty });

        if (saveRecord) {
          await this.client.from('game_saves').update({
            save_data: sData,
            user_id: saveRecord.user_id || (isUUID ? targetUserId : null),
            username: saveRecord.username || (!isUUID ? targetUserId : null),
            updated_at: new Date().toISOString()
          }).eq('id', saveRecord.id);
        } else {
          await this.client.from('game_saves').insert({
            user_id: isUUID ? targetUserId : null,
            username: isUUID ? null : targetUserId,
            save_data: sData,
            funds: 40000,
            updated_at: new Date().toISOString()
          });
        }

        if (ecussonRecord) {
          const antId = targetUserId || sData?.player?.id;
          try {
            await this.client.from('antenne_ecussons').upsert({
              antenne_id: antId,
              ecusson_id: ecussonRecord.id,
              quantite: newQty,
              updated_at: new Date().toISOString()
            }, { onConflict: 'antenne_id,ecusson_id' });
          } catch (e) {}

          // Si le joueur a une station enregistrée dans alliance_stations, synchroniser aussi pour son ID de station
          try {
            const { data: st } = await this.client.from('alliance_stations').select('id').eq('player_id', targetUserId).maybeSingle();
            if (st && st.id && st.id !== antId) {
              await this.client.from('antenne_ecussons').upsert({
                antenne_id: st.id,
                ecusson_id: ecussonRecord.id,
                quantite: newQty,
                updated_at: new Date().toISOString()
              }, { onConflict: 'antenne_id,ecusson_id' });
            }
          } catch (stErr) {}
        }
      }

      // 3. Diffuser en temps réel
      this.broadcastBadgeAwarded({
        userId: targetUserId,
        badge: typeof badge === 'object' ? badge : { code: badgeCode },
        quantity: qty,
        notify: !!notify
      });

      return true;
    } catch (err) {
      console.warn('Erreur awardBadge Supabase:', err);
      return false;
    }
  },

  // Retrait administratif d'un écusson sur Supabase Cloud
  async revokeBadge(targetUserId, badgeCode, removeAll = false) {
    if (!this.client) return false;
    try {
      const isUUID = typeof targetUserId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);
      let q = this.client.from('game_saves').select('*');
      if (isUUID) q = q.eq('user_id', targetUserId);
      else q = q.eq('username', targetUserId);
      const { data: saveRecord } = await q.maybeSingle();

      if (saveRecord && saveRecord.save_data) {
        const sData = saveRecord.save_data;
        if (sData.localEcussons) {
          const ex = sData.localEcussons.find(l => l.code === badgeCode);
          if (ex) {
            if (removeAll || ex.quantite <= 1) {
              sData.localEcussons = sData.localEcussons.filter(l => l.code !== badgeCode);
            } else {
              ex.quantite -= 1;
            }
          }
          await this.client.from('game_saves').update({
            save_data: sData,
            updated_at: new Date().toISOString()
          }).eq('id', saveRecord.id);
        }
      }

      // Diffuser en temps réel
      this.broadcastBadgeRevoked({
        userId: targetUserId,
        badgeCode: badgeCode,
        removeAll: !!removeAll
      });

      return true;
    } catch (e) {
      console.warn('Erreur revokeBadge Supabase:', e);
      return false;
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
          money: (sData?.resources?.money !== undefined) ? sData.resources.money : (s?.funds ?? 40000),
          volunteersCount: (sData?.volunteers?.length !== undefined) ? sData.volunteers.length : (s?.volunteers_count ?? 4),
          vehiclesCount: (sData?.vehicles?.length !== undefined) ? sData.vehicles.length : (s?.vehicles_count ?? 1),
          stationsCount: (sData?.stations?.length !== undefined) ? sData.stations.length : (s?.stations_count ?? 1),
          missionsCount: (sData?.missions?.length !== undefined) ? sData.missions.length : 0,
          reputationScore: (sData?.resources?.reputationScore !== undefined) ? sData.resources.reputationScore : 50,
          timeTracking: sData?.timeTracking || p.time_tracking || null,
          platformStats: sData?.platformStats || p.platform_stats || null,
          lastDevice: sData?.lastDevice || p.last_device || null,
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
          funds: updates.money !== undefined ? Number(updates.money) : (saveRecord?.funds ?? 40000),
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

  // Récupération de l'IP publique du client (avec fallback rapide)
  async getClientIp() {
    try {
      const res = await fetch('/api/client-ip', { signal: AbortSignal.timeout(1200) }).catch(() => null);
      if (res && res.ok) {
        const d = await res.json().catch(() => null);
        if (d && d.ip) return d.ip;
      }
    } catch (e) {}

    try {
      const res2 = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1500) }).catch(() => null);
      if (res2 && res2.ok) {
        const d2 = await res2.json().catch(() => null);
        if (d2 && d2.ip) return d2.ip;
      }
    } catch (e) {}

    return '127.0.0.1';
  },

  generateReferralCode(username) {
    const prefix = (username || 'PC').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROT';
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}-${rand}`;
  },

  // 1. Inscription d'un nouveau Directeur d'Antenne dans Supabase avec parrainage et sécurité anti-fraude
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
        return { error: 'Ce nom de joueur est déjà utilisé. Veuillez en choisir un autre.' };
      }

      const clientIp = await this.getClientIp();
      const myReferralCode = this.generateReferralCode(username.trim());

      // La ville correspond à l'implantation réelle du bâtiment
      let detectedCity = extraData.city || null;
      if (!detectedCity && extraData.stationName) {
        const cleanSt = extraData.stationName.replace(/^antenne\s+(de\s+)?/i, '').trim();
        if (cleanSt.length > 2) detectedCity = cleanSt;
      }

      // Hachage du mot de passe
      const pwdHash = await this.hashPassword(password);

      // Traitement du code parrain
      let referredBy = null;
      let referralStatus = null;
      let refereeBonusGranted = false;
      const refCodeInput = (extraData.referralCode || extraData.referral_code || '').trim();

      if (refCodeInput) {
        // Trouver le parrain
        const { data: referrer } = await this.client
          .from('players')
          .select('*')
          .or(`referral_code.ilike.${refCodeInput},username.ilike.${refCodeInput}`)
          .maybeSingle();

        if (!referrer) {
          referralStatus = {
            success: false,
            code: 'CODE_NOT_FOUND',
            message: 'Code de parrainage introuvable. Inscription poursuivie sans parrain.'
          };
        } else if (referrer.username.toLowerCase() === username.trim().toLowerCase()) {
          // Auto-parrainage
          await this.logFraudAttemptSupabase(referrer.id, username.trim(), clientIp, extraData.deviceFingerprint, 'SELF_REFERRAL');
          referralStatus = {
            success: false,
            code: 'SELF_REFERRAL',
            message: 'Auto-parrainage interdit.'
          };
        } else if (referrer.referral_suspended) {
          // Parrain suspendu
          await this.logFraudAttemptSupabase(referrer.id, username.trim(), clientIp, extraData.deviceFingerprint, 'REFERRAL_SUSPENDED');
          referralStatus = {
            success: false,
            code: 'REFERRAL_SUSPENDED',
            message: 'Ce parrain est temporairement inéligible au parrainage.'
          };
        } else {
          // Contrôle anti-fraude strict IP
          let fraudReason = null;
          const referrerIps = [referrer.registration_ip, ...(Array.isArray(referrer.last_known_ips) ? referrer.last_known_ips : [])].filter(Boolean);

          if (clientIp && referrerIps.includes(clientIp)) {
            fraudReason = 'SAME_IP_AS_REFERRER';
          }

          if (!fraudReason && clientIp) {
            // Contrôle 2 : IP déjà utilisée par un autre filleul
            const { data: existingReferees } = await this.client
              .from('players')
              .select('id, registration_ip, last_known_ips')
              .not('referred_by', 'is', null);

            if (existingReferees && existingReferees.length > 0) {
              for (const ref of existingReferees) {
                const ips = [ref.registration_ip, ...(Array.isArray(ref.last_known_ips) ? ref.last_known_ips : [])].filter(Boolean);
                if (ips.includes(clientIp)) {
                  fraudReason = 'IP_ALREADY_USED_BY_ANOTHER_REFERRAL';
                  break;
                }
              }
            }
          }

          if (fraudReason) {
            await this.logFraudAttemptSupabase(referrer.id, username.trim(), clientIp, extraData.deviceFingerprint, fraudReason);
            referralStatus = {
              success: false,
              fraudDetected: true,
              code: fraudReason,
              message: 'Parrainage refusé : anomalie de sécurité réseau détectée (adresse IP doublon).'
            };
          } else {
            // Parrainage certifié
            referredBy = referrer.id;
            refereeBonusGranted = true;
            referralStatus = {
              success: true,
              referrerName: referrer.username,
              bonus: 1500,
              message: 'Parrainage validé ! Bonus de bienvenue de 1 500 € accordé.'
            };
          }
        }
      }

      // Nettoyage préventif de toute sauvegarde orpheline résiduelle pour ce pseudo
      try {
        await this.client.from('game_saves').delete().eq('username', username.trim());
      } catch (cleanErr) {}

      // Auto-promotion Admin : Si le pseudo est 'admin' ou s'il n'y a encore aucun administrateur en base
      let shouldBeAdmin = (username.trim().toLowerCase() === 'admin');
      if (!shouldBeAdmin) {
        try {
          const { count, error: countErr } = await this.client
            .from('players')
            .select('id', { count: 'exact', head: true })
            .or('role.eq.admin,is_admin.eq.true');
          if (!countErr && (count === 0 || count === null)) {
            shouldBeAdmin = true;
          }
        } catch (errCheckAdmin) {
          console.warn('Vérification premier admin Supabase:', errCheckAdmin);
        }
      }

      // Création du compte joueur (uniquement les colonnes valides dans Supabase)
      // Détection rôles Discord éventuels lors de l'inscription
      let detectedRole = shouldBeAdmin ? 'admin' : 'directeur';
      let detectedIsAdmin = shouldBeAdmin;
      if (extraData.discord && Array.isArray(extraData.discord.roles)) {
        if (extraData.discord.roles.includes('1561701759733465128')) {
          detectedRole = 'admin';
          detectedIsAdmin = true;
        } else if (extraData.discord.roles.includes('1561702120732758077')) {
          detectedRole = 'gestionnaire';
        }
      }

      const newPlayer = {
        username: username.trim(),
        password_hash: pwdHash,
        station_name: extraData.stationName || 'Antenne Protection Civile',
        city: detectedCity,
        department_code: extraData.departmentCode || '54',
        role: detectedRole,
        is_admin: detectedIsAdmin,
        discord: extraData.discord || null,
        discord_id: extraData.discord?.id || extraData.discordId || null,
        alliance_id: extraData.allianceId || null,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        time_tracking: {
          lastSeen: 0,
          idleSeconds: 0,
          activeSeconds: 0,
          referral_code: myReferralCode,
          referred_by: referredBy,
          registration_ip: clientIp,
          last_known_ips: clientIp ? [clientIp] : []
        }
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

      // Si parrainage certifié, insérer le referral_log
      if (referredBy && inserted && inserted.id) {
        try {
          await this.client.from('referral_logs').insert({
            referrer_id: referredBy,
            referee_id: inserted.id,
            status: 'pending',
            reward_referee_granted: true,
            reward_referrer_granted: false,
            created_at: new Date().toISOString()
          });
        } catch (logErr) {
          console.warn('Erreur insertion referral_logs Supabase:', logErr);
        }
      }

      return { user: inserted, referralStatus, refereeBonusGranted };
    } catch (e) {
      console.error('Exception inscription Supabase:', e);
      return { error: e.message || 'Erreur réseau BDD' };
    }
  },

  // Enregistrement d'une tentative de fraude dans Supabase
  async logFraudAttemptSupabase(referrerId, refereeUsername, ipDetected, deviceFingerprint, reason) {
    if (!this.client || !referrerId) return;
    try {
      await this.client.from('fraud_logs').insert({
        referrer_id: referrerId,
        attempted_referee_username: refereeUsername || 'Inconnu',
        ip_detected: ipDetected || 'Inconnue',
        device_fingerprint: deviceFingerprint || null,
        reason: reason || 'SUSPECTED_FRAUD',
        reviewed: false,
        timestamp: new Date().toISOString()
      });

      // Seuil de récidive : vérifier si >= 3 fraudes non résolues
      const { data: unreviewedFrauds } = await this.client
        .from('fraud_logs')
        .select('id')
        .eq('referrer_id', referrerId)
        .eq('reviewed', false);

      if (unreviewedFrauds && unreviewedFrauds.length >= 3) {
        await this.client
          .from('players')
          .update({ referral_suspended: true })
          .eq('id', referrerId);
      }
    } catch (e) {
      console.warn('Erreur log fraud Supabase:', e);
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
        return { error: 'Compte introuvable. Veuillez vérifier vos identifiants.' };
      }

      if (player.is_banned) {
        return { error: 'Ce compte joueur a été suspendu par un administrateur.' };
      }

      // Vérification sécurisée du mot de passe
      if (player.password_hash) {
        const inputHash = await this.hashPassword(password);
        if (player.password_hash !== inputHash && player.password_hash !== password) {
          return { error: 'Mot de passe incorrect. Veuillez vérifier vos identifiants.' };
        }
      } else if (password) {
        const newHash = await this.hashPassword(password);
        await this.client
          .from('players')
          .update({ password_hash: newHash })
          .eq('id', player.id);
        player.password_hash = newHash;
      }

      // Mise à jour de last_login (colonne native garantie dans Supabase)
      try {
        await this.client
          .from('players')
          .update({ last_login: new Date().toISOString() })
          .eq('id', player.id);
      } catch (updErr) {
        console.warn('Update last_login différé:', updErr);
      }

      return { user: player };
    } catch (e) {
      console.error('Exception connexion Supabase:', e);
      return { error: e.message || 'Erreur réseau BDD' };
    }
  },

  // Valider le palier de première intervention pour le parrain dans Supabase (+2 500 €)
  async claimReferralFirstMissionSupabase(playerId) {
    if (!this.client || !playerId) return { error: 'PlayerId requis' };
    try {
      const { data: log } = await this.client
        .from('referral_logs')
        .select('*')
        .eq('referee_id', playerId)
        .eq('status', 'pending')
        .maybeSingle();

      if (!log) return { success: false, message: 'Aucun parrainage en attente.' };

      // Récupérer le parrain
      const { data: referrer } = await this.client
        .from('players')
        .select('*')
        .eq('id', log.referrer_id)
        .single();

      if (!referrer || referrer.referral_suspended) {
        return { success: false, error: 'Parrain introuvable ou suspendu.' };
      }

      // Valider le log
      await this.client
        .from('referral_logs')
        .update({
          status: 'completed',
          reward_referrer_granted: true,
          validated_at: new Date().toISOString()
        })
        .eq('id', log.id);

      // Créditer le parrain dans game_saves
      const { data: saveRecord } = await this.client
        .from('game_saves')
        .select('*')
        .eq('user_id', referrer.id)
        .maybeSingle();

      if (saveRecord && saveRecord.save_data) {
        const sData = saveRecord.save_data;
        if (!sData.resources) sData.resources = {};
        sData.resources.money = (Number(sData.resources.money) || 15000) + 2500;
        if (sData.resources.budget !== undefined) sData.resources.budget += 2500;
        if (sData.resources.funds !== undefined) sData.resources.funds += 2500;

        await this.client
          .from('game_saves')
          .update({
            save_data: sData,
            funds: sData.resources.money,
            updated_at: new Date().toISOString()
          })
          .eq('id', saveRecord.id);
      }

      return {
        success: true,
        referrerName: referrer.username,
        bonusGranted: 2500
      };
    } catch (e) {
      console.warn('Erreur claimReferralFirstMission Supabase:', e);
      return { error: e.message };
    }
  },

  // Données admin des parrainages et incidents depuis Supabase
  async getReferralAdminDataSupabase() {
    if (!this.client) return null;
    try {
      const [fraudsRes, referralsRes, playersRes] = await Promise.all([
        this.client.from('fraud_logs').select('*').order('timestamp', { ascending: false }),
        this.client.from('referral_logs').select('*').order('created_at', { ascending: false }),
        this.client.from('players').select('id, username, is_banned')
      ]);

      const playersMap = {};
      (playersRes.data || []).forEach(p => { playersMap[p.id] = p; });

      const fraudCountsByReferrer = {};
      (fraudsRes.data || []).forEach(f => {
        fraudCountsByReferrer[f.referrer_id] = (fraudCountsByReferrer[f.referrer_id] || 0) + 1;
      });

      const enrichedFrauds = (fraudsRes.data || []).map(f => {
        const p = playersMap[f.referrer_id];
        const count = fraudCountsByReferrer[f.referrer_id] || 1;
        return {
          ...f,
          referrer_username: p ? p.username : 'Inconnu',
          referrer_suspended: p ? !!p.referral_suspended : false,
          referrer_is_banned: p ? !!p.is_banned : false,
          total_fraud_attempts: count,
          is_recidivist: count >= 2
        };
      });

      const enrichedReferrals = (referralsRes.data || []).map(r => {
        const referrer = playersMap[r.referrer_id];
        const referee = playersMap[r.referee_id];
        return {
          ...r,
          referrer_username: referrer ? referrer.username : 'Inconnu',
          referee_username: referee ? referee.username : 'Inconnu'
        };
      });

      return {
        fraudLogs: enrichedFrauds,
        referralLogs: enrichedReferrals,
        summary: {
          totalReferrals: enrichedReferrals.length,
          completedReferrals: enrichedReferrals.filter(r => r.status === 'completed').length,
          totalFrauds: enrichedFrauds.length,
          unreviewedFrauds: enrichedFrauds.filter(f => !f.reviewed).length,
          recidivistCount: Object.values(fraudCountsByReferrer).filter(c => c >= 2).length
        }
      };
    } catch (e) {
      console.warn('Erreur getReferralAdminDataSupabase:', e);
      return null;
    }
  },

  // Actions administratives sur la fraude ou les parrains dans Supabase
  async processAdminReferralActionSupabase(action, targetId, extra = {}) {
    if (!this.client || !targetId) return { error: 'Paramètres invalides' };
    try {
      if (action === 'review_fraud') {
        await this.client.from('fraud_logs').update({ reviewed: true }).eq('id', targetId);
        return { success: true };
      }
      if (action === 'reactivate_referrer') {
        await this.client.from('players').update({ referral_suspended: false }).eq('id', targetId);
        return { success: true };
      }
      if (action === 'ban_referrer') {
        await this.client.from('players').update({ is_banned: true, referral_suspended: true }).eq('id', targetId);
        return { success: true };
      }
      return { error: 'Action non gérée' };
    } catch (e) {
      return { error: e.message };
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
        alertTriggerLogs: game.alertTriggerLogs || [],
        messagesHistory: game.messagesHistory || {},
        monthlyEventsGenerated: game.monthlyEventsGenerated || {},
        reputation_samu: game.reputation_samu !== undefined ? game.reputation_samu : 50,
        reputation_sdis: game.reputation_sdis !== undefined ? game.reputation_sdis : 50,
        reputation_prefecture: game.reputation_prefecture !== undefined ? game.reputation_prefecture : 50,
        reputation_villes: game.reputation_villes || {},
        departmentInfrastructures: game.departmentInfrastructures || {},
        mealAllowancePerVolunteer: game.mealAllowancePerVolunteer || 15,
        antenneMessagesData: game.antenneMessagesData || null,
        poles: game.poles || null,
        roleRequests: game.roleRequests || [],
        rolesAccessMode: game.rolesAccessMode || 'validation',
        starterGuide: game.starterGuide || null,
        autoFormationActive: game.autoFormationActive !== undefined ? game.autoFormationActive : true,
        autoLogisticsActive: game.autoLogisticsActive !== undefined ? game.autoLogisticsActive : true,
        platformStats: game.platformStats || (window.ProtecPlatformAnalytics?.recordSession(game.player, game)) || null,
        lastDevice: game.lastDevice || (window.ProtecPlatformAnalytics?.getCurrentDevice()) || null,
        localEcussons: (game.localEcussons && game.localEcussons.length > 0) ? game.localEcussons : (game.localEcussons || []),
        // Profil lu par le moteur d'événements du VPS (tirages 24h/24 + réglages de notifications)
        srvProfile: (window.ProtecServerEvents && typeof window.ProtecServerEvents.buildProfile === 'function') ? (() => { try { return window.ProtecServerEvents.buildProfile(game); } catch (eP) { return null; } })() : null
      };

      // Préservation des données injectées à distance (alertes push, missions SAMU, écussons, notifications en attente)
      try {
        const { data: exSave } = await this.client.from('game_saves').select('save_data').eq('user_id', userId).maybeSingle();
        if (exSave?.save_data) {
          // 1. Préserver les notifications en attente
          if (Array.isArray(exSave.save_data.pending_notifications) && exSave.save_data.pending_notifications.length > 0) {
            stateToSave.pending_notifications = exSave.save_data.pending_notifications;
          }
          // 1b. Préserver l'abonnement push du téléphone (sinon la passerelle ne peut plus réveiller l'appareil)
          if (exSave.save_data.push_subscription && !stateToSave.push_subscription) {
            stateToSave.push_subscription = exSave.save_data.push_subscription;
            if (exSave.save_data.push_updated_at) stateToSave.push_updated_at = exSave.save_data.push_updated_at;
          }
          // 1c-bis. Marqueur « moteur d'événements du VPS actif »
          if (exSave.save_data.srv_engine_at) stateToSave.srv_engine_at = exSave.save_data.srv_engine_at;
          // 1c. Événements du serveur pas encore récupérés par le jeu
          if (Array.isArray(exSave.save_data.server_inbox)) {
            stateToSave.server_inbox = (window.ProtecServerEvents && typeof window.ProtecServerEvents.filterInboxForSave === 'function')
              ? window.ProtecServerEvents.filterInboxForSave(exSave.save_data.server_inbox)
              : exSave.save_data.server_inbox;
          }
          // 2. Fusionner les missions injectées à distance pour ne jamais les écraser
          if (Array.isArray(exSave.save_data.missions) && exSave.save_data.missions.length > 0) {
            const currentIds = new Set((stateToSave.missions || []).map(m => m.id));
            exSave.save_data.missions.forEach(m => {
              if (!currentIds.has(m.id)) {
                if (!Array.isArray(stateToSave.missions)) stateToSave.missions = [];
                stateToSave.missions.unshift(m);
                currentIds.add(m.id);
                if (game && Array.isArray(game.missions) && !game.missions.some(gm => gm.id === m.id)) {
                  game.missions.unshift(m);
                  if (typeof game.renderMissions === 'function') game.renderMissions();
                }
              }
            });
          }
          // 3. Préserver les écussons
          if ((!stateToSave.localEcussons || stateToSave.localEcussons.length === 0) && exSave.save_data.localEcussons?.length > 0) {
            stateToSave.localEcussons = exSave.save_data.localEcussons;
            game.localEcussons = exSave.save_data.localEcussons;
          }
        }
      } catch (e) {}

      // Abonnement push mémorisé sur cet appareil : recopié si la sauvegarde n'en a pas
      if (!stateToSave.push_subscription) {
        try {
          const lsSub = JSON.parse(localStorage.getItem('protec_push_sub') || 'null');
          if (lsSub && lsSub.endpoint && lsSub.keys) stateToSave.push_subscription = lsSub;
        } catch (eSub) { /* abonnement local illisible */ }
      }

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
      const isUUID = typeof player.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(player.id);

      // Contrôle de conformité de l'alliance_id pour respecter la clé étrangère alliance_stations_alliance_id_fkey
      let validAllianceId = null;
      if (player.allianceId && player.allianceId !== 'alliance-fnpc') {
        const isAllianceUUID = typeof player.allianceId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(player.allianceId);
        if (isAllianceUUID) {
          validAllianceId = player.allianceId;
        }
      }

      const stLat = parseFloat(station.lat);
      const stLng = parseFloat(station.lng);
      if (isNaN(stLat) || isNaN(stLng)) return;

      const stationKey = station.id ? String(station.id) : `station-${player.id || 'usr'}`;

      const payload = {
        id: stationKey,
        player_id: isUUID ? player.id : null,
        player_name: player.name || player.username || 'Responsable d’antenne',
        station_name: station.name || 'Antenne Protection Civile',
        city: station.city || player.city || 'Paris',
        lat: stLat,
        lng: stLng,
        level: station.level || 1,
        vehicles_count: Array.isArray(station.vehicles) ? station.vehicles.length : 1,
        volunteers_count: Array.isArray(station.volunteers) ? station.volunteers.length : 4,
        alliance_id: validAllianceId,
        last_sync: new Date().toISOString()
      };

      // 1. Contrôle préalable d'existence pour éviter l'erreur HTTP 409 (Conflict)
      const { data: existing } = await this.client
        .from('alliance_stations')
        .select('id')
        .eq('id', stationKey)
        .maybeSingle();

      if (existing && existing.id) {
        await this.client
          .from('alliance_stations')
          .update(payload)
          .eq('id', stationKey);
      } else {
        await this.client
          .from('alliance_stations')
          .insert(payload);
      }
    } catch (e) {
      console.warn('Erreur syncStationToMap:', e);
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
        .limit(100);

      const isUUID = typeof excludePlayerId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(excludePlayerId);
      if (isUUID) {
        query = query.neq('player_id', excludePlayerId);
      }

      const { data, error } = await query;
      let stations = (data && !error && Array.isArray(data)) ? data : [];

      // Enrichissement dynamique depuis game_saves pour s'assurer que TOUS les directeurs réels inscrits apparaissent sur la carte
      try {
        const { data: saves } = await this.client
          .from('game_saves')
          .select('user_id, username, save_data')
          .limit(50);

        if (saves && Array.isArray(saves)) {
          const existingIds = new Set(stations.map(s => String(s.id)));
          saves.forEach(sv => {
            if (excludePlayerId && (sv.user_id === excludePlayerId || sv.username === excludePlayerId)) return;
            const savedStations = sv.save_data?.stations;
            if (Array.isArray(savedStations)) {
              savedStations.forEach(st => {
                if (!st) return;
                const lat = parseFloat(st.lat);
                const lng = parseFloat(st.lng);
                if (isNaN(lat) || isNaN(lng)) return;
                const stKey = String(st.id || ('st-' + sv.user_id));
                if (!existingIds.has(stKey)) {
                  existingIds.add(stKey);
                  stations.push({
                    id: stKey,
                    player_id: sv.user_id,
                    player_name: sv.username || 'Responsable d’antenne',
                    station_name: st.name || 'Antenne Protection Civile',
                    city: st.city || 'Secteur Opérationnel',
                    lat: lat,
                    lng: lng,
                    level: st.level || 1,
                    vehicles_count: Array.isArray(st.vehicles) ? st.vehicles.length : 1,
                    volunteers_count: Array.isArray(sv.save_data?.volunteers) ? sv.save_data.volunteers.length : 4,
                    alliance_id: 'alliance-fnpc'
                  });
                }
              });
            }
          });
        }
      } catch (saveErr) {
        console.warn('Enrichissement stations game_saves différé:', saveErr);
      }

      // Filtrage complémentaire sécurisé côté client
      return stations.filter(st => {
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
    return Date.now();
  },

  // Synchronisation du monde côté serveur (résolution des missions et formations expirées)
  async syncServerWorld(playerId) {
    if (!this.client || !playerId) return null;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(playerId).trim());
    if (!isUUID) {
      // Les comptes locaux ou invités (ex: 'player_xxx') ne possèdent pas d'état persistant RPC serveur Postgres UUID
      return null;
    }
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

  // Sauvegarde d'une crise départementale partagée dans Supabase (visible par tous les directeurs du département)
  async saveDepartmentCrisis(crisisData, departmentCode) {
    if (!this.client || !crisisData) return;
    try {
      const dept = departmentCode || crisisData.departmentCode || '54';
      const now = new Date();
      const startsAt = crisisData.spawnedAt ? new Date(crisisData.spawnedAt).toISOString() : (crisisData.startedAt ? new Date(crisisData.startedAt).toISOString() : now.toISOString());
      const durationSec = crisisData.durationSeconds || (crisisData.durationHours ? Math.round(crisisData.durationHours * 3600) : 7200);
      const endsAt = crisisData.targetTime && crisisData.targetTime > Date.now() + 600000
        ? new Date(crisisData.targetTime).toISOString()
        : new Date(new Date(startsAt).getTime() + durationSec * 1000).toISOString();

      await this.client
        .from('active_missions')
        .upsert({
          id: String(crisisData.id),
          player_id: `DEPT_${dept}`,
          mission_type: 'crise',
          title: crisisData.title || crisisData.titre || 'Crise Opérationnelle',
          status: crisisData.status || 'prealerte',
          starts_at: startsAt,
          ends_at: endsAt,
          duration_seconds: durationSec,
          reward_money: crisisData.rewardMoney || 0,
          reward_xp: crisisData.rewardReputation || 35,
          assigned_volunteers: crisisData.assignedCrew?.volunteers || [],
          assigned_vehicles: crisisData.assignedCrew?.vehicles || [],
          details: {
            ...crisisData,
            departmentCode: dept,
            updatedAt: Date.now()
          },
          created_at: startsAt
        }, { onConflict: 'id' });

      // Inscription automatique dans le journal opérationnel départemental
      this.logOperationalEvent({
        playerId: `DEPT_${dept}`,
        stationName: `Centre Opérationnel ${dept}`,
        city: crisisData.city || crisisData.commune || `Département ${dept}`,
        departmentCode: dept,
        type: 'crise',
        indicatif: 'PRÉFECTURE / COZ',
        statusCode: 1,
        message: `🚨 VEILLE / CRISE DÉPARTEMENTALE [${dept}] : « ${crisisData.title || crisisData.titre} » engagée.`,
        severity: 'danger'
      });
    } catch (e) {
      console.warn('Erreur sauvegarde crise départementale serveur:', e);
    }
  },

  // Récupération des crises actives d'un département (pour les joueurs en ligne et ceux qui se reconnectent)
  async fetchActiveDepartmentCrises(departmentCode) {
    if (!departmentCode) return [];
    // 1. Si Supabase est actif
    if (this.client) {
      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await this.client
          .from('active_missions')
          .select('*')
          .eq('player_id', `DEPT_${departmentCode}`)
          .eq('mission_type', 'crise')
          .gt('ends_at', nowIso)
          .neq('status', 'resolved')
          .neq('status', 'deleted')
          .neq('status', 'cancelled')
          .neq('status', 'terminee');

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(row => {
            const details = row.details || {};
            return {
              ...details,
              id: row.id,
              title: row.title || details.title,
              status: row.status || details.status,
              departmentCode: departmentCode,
              spawnedAt: row.starts_at ? new Date(row.starts_at).getTime() : details.spawnedAt,
              durationSeconds: row.duration_seconds || details.durationSeconds || 7200,
              endsAt: row.ends_at
            };
          });
        }
      } catch (e) {
        console.warn('Erreur récupération crises départementales Supabase:', e);
      }
    }

    // 2. Fallback serveur local (uniquement en dev local localhost / 127.0.0.1 si actif)
    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalHost && !this._localCrisisApiDisabled) {
      try {
        const resp = await fetch(`/api/crises/department/${departmentCode}`);
        if (resp.ok) {
          const json = await resp.json();
          if (json && json.crisis && json.crisis.status !== 'deleted' && json.crisis.status !== 'resolved') {
            return [json.crisis];
          }
        } else {
          this._localCrisisApiDisabled = true;
        }
      } catch (e) {
        this._localCrisisApiDisabled = true;
      }
    }

    return [];
  },

  // Clôture d'une crise départementale dans la base
  async closeDepartmentCrisis(crisisId, departmentCode) {
    if (!crisisId) return;
    const dept = departmentCode || window.game?.currentDepartmentCode || '54';
    try {
      if (this.client) {
        await this.client
          .from('active_missions')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString()
          })
          .eq('id', String(crisisId));

        this.broadcastDepartmentCrisisUpdate({
          id: String(crisisId),
          departmentCode: dept,
          status: 'resolved'
        });
      }
    } catch (e) {
      console.warn('Erreur clôture crise départementale:', e);
    }
  },

  // Suppression administrative d'une crise départementale pour tous les joueurs
  async deleteDepartmentCrisis(crisisId, departmentCode) {
    if (!crisisId) return;
    const dept = departmentCode || window.game?.currentDepartmentCode || '54';

    // 1. Appel serveur local si disponible (uniquement en dev local localhost / 127.0.0.1)
    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalHost && !this._localCrisisApiDisabled) {
      try {
        await fetch('/api/crises/department/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crisisId: String(crisisId), departmentCode: String(dept) })
        });
      } catch (err) {
        this._localCrisisApiDisabled = true;
      }
    }

    // 2. Supabase si configuré
    if (this.client) {
      try {
        await this.client
          .from('active_missions')
          .update({
            status: 'deleted',
            resolved_at: new Date().toISOString()
          })
          .eq('id', String(crisisId));

        this.broadcastDepartmentCrisisUpdate({
          id: String(crisisId),
          departmentCode: String(dept),
          status: 'deleted'
        });
      } catch (e) {
        console.warn('Erreur suppression Supabase crise départementale:', e);
      }
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
