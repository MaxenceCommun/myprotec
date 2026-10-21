/**
 * PROTEC LIVE - MODULE DE COMMUNICATION BACKEND & TEMPS RÉEL (Socket.io & REST)
 * Connecte le frontend MyProtec au backend dédié HTTPS (https://api.myprotec.fr)
 */

(function(window) {
  'use strict';

  const API_URL = 'https://api.myprotec.fr';
  let socket = null;

  try {
    if (typeof io !== 'undefined') {
      socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000
      });
    } else {
      console.warn('[API MyProtec] CDN Socket.io non détecté au chargement du script api.js');
    }
  } catch (err) {
    console.error('[API MyProtec] Erreur lors de l’initialisation de Socket.io:', err);
  }

  const API = {
    async getInterventions() {
      const res = await fetch(`${API_URL}/api/interventions`);
      if (!res.ok) throw new Error("Erreur de récupération des interventions");
      return await res.json();
    },
    async updateStatut(id, statut) {
      const res = await fetch(`${API_URL}/api/interventions/${id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut })
      });
      if (!res.ok) throw new Error("Erreur de mise à jour du statut");
      return await res.json();
    }
  };

  const ProtecAPI = {
    API_URL: API_URL,
    socket: socket,
    API: API,
    getInterventions: API.getInterventions,
    updateStatut: API.updateStatut,
    isBackendManaged: true,
    _initialized: false,
    _gameRef: null,

    /**
     * Initialisation et raccordement au jeu
     */
    init(game) {
      this._gameRef = game || window.game;
      if (this._initialized) return;
      this._initialized = true;

      console.log('⚡ [API MyProtec] Initialisation du module temps réel vers', API_URL);

      // 1. Initialiser la connexion Socket.io si ce n'était pas encore fait
      if (!this.socket && typeof io !== 'undefined') {
        try {
          this.socket = io(API_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 2000
          });
        } catch (e) {
          console.warn('[API MyProtec] Échec réinitialisation Socket.io:', e);
        }
      }

      // 2. Brancher les écouteurs Socket.io
      this.setupSocketListeners();

      // 3. Charger initialement les interventions actives depuis l'API REST
      this.loadInitialInterventions();
    },

    /**
     * Configuration des écouteurs temps réel Socket.io
     */
    setupSocketListeners() {
      if (!this.socket) {
        console.warn('[API MyProtec] Impossible d’enregistrer les écouteurs Socket.io (socket absent)');
        return;
      }

      this.socket.on('connect', () => {
        console.log('⚡ [API MyProtec] Connecté au serveur Socket.io OVH (id:', this.socket.id, ')');
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('⚠️ [API MyProtec] Déconnecté de Socket.io :', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.warn('⚠️ [API MyProtec] Erreur de connexion Socket.io :', error.message);
      });

      // 4. Écoute de l'événement 'nouvelle_intervention'
      this.socket.on('nouvelle_intervention', (intervention) => {
        console.log('🚨 [API MyProtec] Événement temps réel nouvelle_intervention reçu :', intervention);
        this.handleNewIntervention(intervention);
      });

      // 4. Écoute de l'événement 'statut_intervention_change'
      this.socket.on('statut_intervention_change', ({ id, statut }) => {
        console.log('🔄 [API MyProtec] Événement temps réel statut_intervention_change reçu :', { id, statut });
        this.handleStatutChange(id, statut);
      });
    },

    /**
     * 3. Chargement initial des interventions via GET ${API_URL}/api/interventions
     */
    async loadInitialInterventions() {
      try {
        console.log(`[API MyProtec] Chargement initial des interventions depuis ${API_URL}/api/interventions...`);
        const interventions = await API.getInterventions();
        console.log(`[API MyProtec] ${interventions.length} intervention(s) reçue(s) du backend :`, interventions);

        if (Array.isArray(interventions)) {
          const game = this._gameRef || window.game;
          interventions.forEach(interv => {
            this.syncInterventionIntoGame(interv, false);
          });

          if (game) {
            this.purgeUnconventionedMissions(game);
          }

          this.refreshUI();
        }
      } catch (error) {
        console.error('[API MyProtec] Erreur lors du chargement des interventions:', error);
      }
    },

    /**
     * Purge stricte des missions actives non conventionnées
     */
    purgeUnconventionedMissions(game) {
      if (!game || !Array.isArray(game.missions)) return;
      const hasSamu = Boolean(game.samuConvention && game.samuConvention.signed && game.samuGarde && game.samuGarde.active);
      const hasSdis = Boolean(game.sdisConvention && game.sdisConvention.signed && game.sdisGarde && game.sdisGarde.active);
      const hasAasc = Boolean(game.aascConvention && game.aascConvention.signed);

      // 1. RÈGLE STRICTE DPS : Un DPS ne doit JAMAIS être lancé en alerte directe sans validation de devis par le joueur !
      // Les seuls missions d'alerte immédiate sont les crises (NOVI, inondations, recherches de personnes, violences urbaines, tempêtes...).
      const invalidAlertDps = game.missions.filter(m => m && m.type === 'dps' && (m.status === 'declenche' || m.status === 'prealerte' || m.isBackendIntervention || String(m.id).startsWith('interv-')));
      if (invalidAlertDps.length > 0) {
        console.log(`[API MyProtec] Détection et retrait de ${invalidAlertDps.length} mission(s) DPS lancée(s) en alerte directe sans devis.`);
        if (!Array.isArray(game.devis)) game.devis = [];
        invalidAlertDps.forEach(dps => {
          const devId = `dev-${dps.id}`;
          if (!game.devis.some(d => d.id === devId || d.id === dps.id || (dps.backendId && d.backendId == dps.backendId))) {
            const dev = {
              id: devId,
              backendId: dps.backendId || null,
              clientName: dps.clientName || 'Organisateur de l’événement',
              clientType: 'association',
              eventName: dps.title,
              durationHours: dps.durationHours || 6,
              lat: dps.lat,
              lng: dps.lng,
              publicCount: '1 500 personnes',
              scale: dps.scale || 'DPS-PE (4 secouristes + VPSP)',
              requiredVolunteers: dps.requiredVolunteers || 4,
              requiredRanks: ['CE', 'PSE2', 'PSE1'],
              requiredVehicles: (dps.requiredVehicles && dps.requiredVehicles.length > 0) ? dps.requiredVehicles : ['VPSP'],
              status: 'pending',
              address: dps.address || 'Sur site',
              mealsProvidedByOrganizer: true,
              proposedPrice: dps.rewardMoney || 950,
              createdAt: Date.now()
            };
            if (typeof game.calculateBareme === 'function') {
              dev.bareme = game.calculateBareme(dev);
              dev.proposedPrice = dev.bareme?.totalBareme || dev.proposedPrice;
            }
            if (typeof game.enrichMissionLocationWithCity === 'function') {
              game.enrichMissionLocationWithCity(dev);
            }
            game.devis.push(dev);
          }
        });
        game.missions = game.missions.filter(m => !invalidAlertDps.includes(m));
      }

      // 2. Filtrage des conventions SAMU, SDIS et Crises
      game.missions = game.missions.filter(m => {
        if (!m) return false;
        if ((m.type === 'samu' || m.type === 'garde_samu') && !hasSamu) return false;
        if ((m.type === 'pompiers' || m.type === 'garde_sdis') && !hasSdis) return false;
        if (m.type === 'crise' && !hasAasc) return false;
        return true;
      });
    },

    /**
     * 4a. Traitement d'une nouvelle intervention en temps réel
     */
    handleNewIntervention(intervention) {
      if (!intervention || !intervention.id) return;
      const game = this._gameRef || window.game;

      const result = this.syncInterventionIntoGame(intervention, true);
      if (!result) return;

      const rawTitle = intervention.titre || 'Intervention';
      const cleanTitle = rawTitle.replace(/\brenfort\s+dps\b/gi, 'DPS').replace(/\brenfort\s+poste\b/gi, 'Poste').replace(/\brenfort\s+/gi, '').trim();

      // CAS 1 : C'EST UNE DEMANDE DE DPS -> PAS D'ALERTE D'URGENCE DIRECTE, NOTIFICATION DE DEVIS COMMERCIALE
      if (result.isDevis || result.type === 'dps' || result.missionType === 'dps') {
        const devId = result.devis?.id || `dev-interv-${intervention.id}`;
        if (window.ProtecNotifications && typeof window.ProtecNotifications.notifyCategory === 'function') {
          window.ProtecNotifications.notifyCategory('finances', '📋 NOUVELLE DEMANDE DE DEVIS DPS', `${cleanTitle} à ${intervention.commune || 'Secteur'}. À étudier et valider dans le module Devis.`, devId);
        }
        if (game && typeof game.showToast === 'function') {
          game.showToast('📋 Nouvelle Demande de Devis DPS', `« ${cleanTitle} » à ${intervention.commune || 'Secteur'}. Rendez-vous dans le module Devis pour le chiffrer et le valider.`, 'blue', {
            target: { type: 'devis', id: devId }
          });
        }
        this.refreshUI();
        return;
      }

      // CAS 2 : CRISES MAJEURES & URGENCES CONVENTIONNÉES (NOVI, Inondations, Recherches, Violences Urbaines, Tempêtes, SAMU, SDIS)
      // Seules ces interventions peuvent sonner l'alerte opérationnelle immédiate !
      if (window.ProtecAudio && typeof window.ProtecAudio.playAlertSound === 'function') {
        try { window.ProtecAudio.playAlertSound(); } catch (e) {}
      } else if (game && typeof game.playSound === 'function') {
        try { game.playSound('alert'); } catch (e) {}
      }

      const severityUpper = (intervention.gravite || 'Urgence').toUpperCase();
      const isCrisis = result.type === 'crise';
      const title = isCrisis ? `🔴 ALERTE CRISE MAJEURE (${severityUpper})` : `🚨 NOUVELLE INTERVENTION (${severityUpper})`;
      const desc = `${cleanTitle} à ${intervention.commune || 'Secteur'}. Moyens requis : ${(intervention.vehicules_requis || []).join(', ') || 'Équipe de secours'}`;

      if (window.ProtecNotifications && typeof window.ProtecNotifications.notifyCategory === 'function') {
        window.ProtecNotifications.notifyCategory('alert', title, desc, `interv-${intervention.id}`);
      } else if (window.ProtecIncidents && typeof window.ProtecIncidents.sendSystemNotification === 'function') {
        window.ProtecIncidents.sendSystemNotification(title, desc, `interv-${intervention.id}`);
      }

      if (game && typeof game.showToast === 'function') {
        game.showToast(title, desc, 'red', {
          target: { type: 'mission', id: result.id }
        });
      }

      this.refreshUI();
    },

    /**
     * 4b. Traitement du changement de statut reçu par Socket.io
     */
    handleStatutChange(id, statut) {
      const game = this._gameRef || window.game;
      if (!game || !Array.isArray(game.missions)) return;

      const cleanId = String(id).replace(/^interv-/, '');
      const mission = game.missions.find(m => m.backendId == cleanId || m.id == id || m.id == `interv-${cleanId}`);

      if (!mission) {
        console.log(`[API MyProtec] Mission #${cleanId} non trouvée en local, rechargement...`);
        this.loadInitialInterventions();
        return;
      }

      mission.backendStatut = statut;

      if (statut === 'engagee') {
        mission.status = 'ongoing';
        mission.progress = Math.max(25, mission.progress || 0);
        if (game && typeof game.showToast === 'function') {
          game.showToast('Intervention Engagée 🚑', `« ${mission.title} » est passée au statut Engagée.`, 'blue');
        }
      } else if (statut === 'terminee') {
        mission.status = 'completed';
        mission.progress = 100;
        if (game && typeof game.showToast === 'function') {
          game.showToast('Intervention Clôturée 🏁', `« ${mission.title} » a été clôturée sur le serveur.`, 'green');
        }
      } else if (statut === 'en_attente') {
        mission.status = 'declenche';
      }

      this.refreshUI();
    },

    /**
     * 5. Envoi de la mise à jour de statut vers le backend (PUT ${API_URL}/api/interventions/${id}/statut)
     */
    async updateInterventionStatut(id, statut) {
      if (!id) return;
      const cleanId = String(id).replace(/^interv-/, '');

      try {
        console.log(`[API MyProtec] Envoi PUT ${API_URL}/api/interventions/${cleanId}/statut -> statut="${statut}"`);
        const data = await API.updateStatut(cleanId, statut);
        console.log(`✅ [API MyProtec] Statut mis à jour sur le serveur pour #${cleanId}:`, data);
        return true;
      } catch (err) {
        console.error(`[API MyProtec] Erreur réseau lors de la mise à jour du statut pour #${cleanId}:`, err);
        return false;
      }
    },

    /**
     * Conversion et synchronisation d'une intervention reçue dans l'état du jeu
     */
    syncInterventionIntoGame(interv, isNew = false) {
      const game = this._gameRef || window.game;
      if (!game) return null;
      if (!Array.isArray(game.missions)) game.missions = [];

      const cleanId = String(interv.id);
      const missionId = `interv-${cleanId}`;

      const reqVehicles = Array.isArray(interv.vehicules_requis) ? [...interv.vehicules_requis] : [];
      const reqVolunteers = Math.max(2, reqVehicles.length * 2);
      const lat = parseFloat(interv.lat);
      const lng = parseFloat(interv.lng);

      let clientStatus = 'declenche';
      if (interv.statut === 'engagee') clientStatus = 'ongoing';
      else if (interv.statut === 'terminee') clientStatus = 'completed';

      // Assainissement : la notion de "renfort" n'est jamais générée automatiquement pour les DPS (réservée aux demandes manuelles entre joueurs)
      const rawTitle = interv.titre || 'Intervention Opérationnelle';
      const sanitizedTitle = rawTitle.replace(/\brenfort\s+dps\b/gi, 'DPS').replace(/\brenfort\s+poste\b/gi, 'Poste de secours').replace(/\brenfort\s+/gi, '').trim();
      const rawDesc = interv.description || 'Intervention déclenchée par le centre opérationnel.';
      const sanitizedDesc = rawDesc.replace(/\brenfort\s+dps\b/gi, 'DPS').replace(/\ben\s+renfort\s+dps\b/gi, 'en poste de secours').trim();

      // Détermination rigoureuse du type de mission
      const titleLower = sanitizedTitle.toLowerCase();
      const descLower = sanitizedDesc.toLowerCase();
      const allText = `${titleLower} ${descLower}`;

      // 1. Détection prioritaire des VRAIES CRISES (les seules missions qui doivent se lancer comme des alertes immédiates)
      const isCrisis = /crise|inondation|crue|novi|recherche|disparition|violence|urbain|émeute|tempête|ouragan|cyclone|catastrophe|sinistre|effondrement|explosion|sauvetage|déblaiement|hébergement|accueil des impliqués|soutien logistique|plan blanc|orsec|alerte rouge|catnat/i.test(allText);

      // 2. Détection des DPS (événements sportifs, culturels, rassemblements du public)
      const isDPS = /dps|poste de secours|sportif|course|trail|match|stade|concert|festival|brocante|foire|marathon|triathlon|fête|rassemblement|événement|manif|spectacle/i.test(allText);

      // 3. Détection des urgences SAMU 15
      const isSamu = reqVehicles.includes('VPSP') || /détresse|malaise|cardiaque|avc|respiratoire|smur|samu|urgence vitale|étouffement|inconscient|coma/i.test(allText);

      let missionType = 'pompiers';
      if (isCrisis) {
        missionType = 'crise';
      } else if (isDPS) {
        missionType = 'dps';
      } else if (isSamu) {
        missionType = 'samu';
      }

      // VÉRIFICATION STRICTE DES CONDITIONS CONVENTIONNELLES & EFFECTIFS
      if (!game.stations || game.stations.length === 0) {
        return null; // Antenne non encore placée sur la carte
      }

      let existing = game.missions.find(m => m.id === missionId || m.backendId == cleanId);

      // RÈGLE D'OR DPS :
      // UN DPS NE DOIT JAMAIS SE LANCER EN ALERTE DIRECTE DANS LES MISSIONS OPÉRATIONNELLES SANS VALIDATION DE DEVIS !
      // Si une demande de DPS arrive, elle est obligatoirement orientée vers le module DEVIS (game.devis).
      if (missionType === 'dps') {
        if (existing) {
          game.missions = game.missions.filter(m => m.id !== missionId && m.backendId != cleanId);
        }
        if (!Array.isArray(game.devis)) game.devis = [];
        const devisId = `dev-interv-${cleanId}`;
        let existingDevis = game.devis.find(d => d.id === devisId || d.backendId == cleanId);
        if (!existingDevis) {
          const newDevis = {
            id: devisId,
            backendId: cleanId,
            clientName: interv.client || interv.organisateur || 'Organisateur de l’événement',
            clientType: 'association',
            eventName: sanitizedTitle,
            durationHours: 6,
            lat: isNaN(lat) ? (game.stations?.[0]?.lat || 48.6921) : lat,
            lng: isNaN(lng) ? (game.stations?.[0]?.lng || 6.1844) : lng,
            publicCount: '1 500 personnes',
            scale: 'DPS-PE (4 secouristes + VPSP)',
            requiredVolunteers: reqVolunteers || 4,
            requiredRanks: ['CE', 'PSE2', 'PSE1'],
            requiredVehicles: reqVehicles.length > 0 ? reqVehicles : ['VPSP'],
            status: 'pending',
            address: interv.commune ? `${interv.commune} (Secteur d'intervention)` : 'Sur site',
            mealsProvidedByOrganizer: true,
            proposedPrice: 1200 + (reqVehicles.length * 200),
            createdAt: Date.now()
          };
          if (typeof game.calculateBareme === 'function') {
            newDevis.bareme = game.calculateBareme(newDevis);
            newDevis.proposedPrice = newDevis.bareme?.totalBareme || newDevis.proposedPrice;
          }
          if (typeof game.enrichMissionLocationWithCity === 'function') {
            game.enrichMissionLocationWithCity(newDevis);
          }
          game.devis.push(newDevis);
          if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
          if (typeof game.saveGame === 'function') game.saveGame();
          existingDevis = newDevis;
        }
        return { isDevis: true, devis: existingDevis, missionType: 'dps' };
      }

      // 1. Mission SAMU : Exige impérativement Convention Cadre SAMU signée ET garde VPSP active
      if (missionType === 'samu') {
        const hasSamuConv = Boolean(game.samuConvention && game.samuConvention.signed);
        const hasSamuGarde = Boolean(game.samuGarde && game.samuGarde.active);
        const hasVpsp = Array.isArray(game.vehicles) && game.vehicles.some(v => v.type === 'VPSP');

        if (!hasSamuConv || !hasSamuGarde || !hasVpsp) {
          if (existing) {
            game.missions = game.missions.filter(m => m.id !== missionId && m.backendId != cleanId);
          }
          return null;
        }

        const maxVectors = (game.samuGarde && game.samuGarde.assignedVehicles && game.samuGarde.assignedVehicles.length > 0)
          ? game.samuGarde.assignedVehicles.length
          : 1;
        const activeSamu = (game.missions || []).filter(m => m.type === 'samu' && (m.status === 'ongoing' || m.status === 'declenche' || m.status === 'planifie') && m.id !== missionId && m.backendId != cleanId);
        if (activeSamu.length >= maxVectors && !existing) {
          return null;
        }
      }

      // 2. Mission Garde SDIS : Exige convention SDIS et garde active
      if (missionType === 'pompiers') {
        const hasSdisConv = Boolean(game.sdisConvention && game.sdisConvention.signed);
        const hasSdisGarde = Boolean(game.sdisGarde && game.sdisGarde.active);
        if (!hasSdisConv || !hasSdisGarde) {
          if (existing) {
            game.missions = game.missions.filter(m => m.id !== missionId && m.backendId != cleanId);
          }
          return null;
        }
      }

      // 3. Mission Crise / Soutien Logistique : Exige convention AASC / agrément sécurité civile
      if (missionType === 'crise') {
        const hasAascConv = Boolean(game.aascConvention && game.aascConvention.signed);
        if (!hasAascConv) {
          if (existing) {
            game.missions = game.missions.filter(m => m.id !== missionId && m.backendId != cleanId);
          }
          return null;
        }
      }

      if (existing) {
        existing.title = sanitizedTitle || existing.title;
        existing.desc = sanitizedDesc || existing.desc;
        existing.commune = interv.commune || existing.commune;
        existing.city = interv.commune || existing.city;
        existing.address = interv.commune ? `${interv.commune} (Secteur d'intervention)` : existing.address;
        if (!isNaN(lat) && !isNaN(lng)) {
          existing.lat = lat;
          existing.lng = lng;
        }
        existing.backendStatut = interv.statut;
        existing.status = clientStatus;
        existing.type = missionType;
        existing.isRenfort = false;
        existing.requiredVehicles = reqVehicles;
        existing.requiredVolunteers = reqVolunteers;
        existing.urgency = interv.gravite || existing.urgency;
        existing.severity = interv.gravite || existing.severity;
        return existing;
      }

      const newMission = {
        id: missionId,
        backendId: interv.id,
        isBackendIntervention: true,
        isRenfort: false,
        title: sanitizedTitle,
        desc: sanitizedDesc,
        commune: interv.commune || 'Secteur d’intervention',
        city: interv.commune || 'Secteur d’intervention',
        address: interv.commune ? `${interv.commune} (Secteur d'intervention)` : 'Sur secteur',
        lat: isNaN(lat) ? (game.stations?.[0]?.lat || 48.6921) : lat,
        lng: isNaN(lng) ? (game.stations?.[0]?.lng || 6.1844) : lng,
        type: missionType,
        urgency: interv.gravite || 'moyen',
        severity: interv.gravite || 'moyen',
        status: clientStatus,
        backendStatut: interv.statut,
        requiredVehicles: reqVehicles,
        requiredVolunteers: reqVolunteers,
        requiredRanks: ['PSE1', 'PSE2'],
        registeredVolunteers: [],
        assignedCrew: { volunteers: [], vehicles: [] },
        rewardMoney: 450 + (reqVehicles.length * 150),
        rewardReputation: 25,
        progress: (clientStatus === 'ongoing') ? 50 : 0,
        isAlert: clientStatus === 'declenche',
        createdAt: interv.created_at || new Date().toISOString(),
        spawnedAt: interv.created_at ? new Date(interv.created_at).getTime() : Date.now(),
        durationSeconds: 1800,
        durationHours: 0.5
      };

      game.missions.push(newMission);
      return newMission;
    },

    /**
     * Rafraîchissement de la carte, des statistiques et du tableau de bord
     */
    refreshUI() {
      const game = this._gameRef || window.game;
      if (!game) return;

      if (typeof game.renderMissions === 'function') {
        game.renderMissions();
      }
      if (typeof game.updateStatsUI === 'function') {
        game.updateStatsUI();
      }

      this.updateDashboardQuickBar();
    },

    /**
     * Mise à jour de la barre / liste des interventions actives du tableau de bord
     */
    updateDashboardQuickBar() {
      const game = this._gameRef || window.game;
      if (!game) return;

      const pillsContainer = document.getElementById('active-missions-pills');
      if (!pillsContainer) return;

      const pinnedIds = Array.isArray(game.pinnedMissionIds) ? game.pinnedMissionIds : [];
      const pinnedMissions = (game.missions || []).filter(m => 
        (m.isPinned || pinnedIds.includes(m.id)) &&
        m.status !== 'completed' && m.status !== 'canceled'
      );

      // RÈGLE MÉTIER STRICTE : Si l'utilisateur n'a rien épinglé, ne rien afficher !
      if (pinnedMissions.length === 0) {
        pillsContainer.innerHTML = '';
        return;
      }

      const displayMissions = pinnedMissions;

      pillsContainer.innerHTML = displayMissions.slice(0, 5).map(m => {
        const isPinned = Boolean(m.isPinned || pinnedIds.includes(m.id));
        const isWaiting = (m.status === 'declenche' || m.status === 'prealerte');
        const badgeColor = isWaiting ? 'bg-red-600 text-white animate-pulse' : (m.status === 'ongoing' ? 'bg-emerald-600 text-white' : 'bg-pc-blue text-white');
        const badgeLabel = isWaiting ? 'En attente' : (m.status === 'ongoing' ? 'Engagée' : (m.status === 'planifie' ? 'Planifié' : 'Actif'));
        
        let iconName = 'siren';
        if (m.type === 'dps') iconName = 'calendar';
        else if (m.type === 'samu') iconName = 'activity';
        else if (m.type === 'pompiers') iconName = 'flame';
        else if (m.type === 'social') iconName = 'heart-handshake';
        else if (m.status === 'ongoing') iconName = 'truck';

        const vehList = (m.requiredVehicles && m.requiredVehicles.length > 0)
          ? m.requiredVehicles.join(', ')
          : (m.scale || 'Dispositif');

        return `
          <div onclick="window.game && window.game.openMissionDetails('${m.id}')" 
               class="glass-panel-heavy p-2.5 rounded-2xl border border-white/90 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-between gap-2.5 max-w-xs group bg-white/90 dark:bg-slate-900/90 backdrop-blur-md relative">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <div class="w-8 h-8 rounded-xl ${isWaiting ? 'bg-red-100 text-red-600 dark:bg-red-950/60' : (m.status === 'ongoing' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60' : 'bg-blue-100 text-pc-blue dark:bg-blue-950/60')} flex items-center justify-center shrink-0">
                <i data-lucide="${iconName}" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-[11px] font-extrabold text-slate-900 dark:text-white truncate">${m.title}</div>
                <div class="text-[9.5px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <span>📍 ${m.commune || m.city || 'Secteur'}</span>
                  <span>•</span>
                  <span>${vehList}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase shrink-0 ${badgeColor}">
                ${badgeLabel}
              </span>
              <button type="button" 
                      onclick="event.stopPropagation(); window.game && window.game.togglePinMission('${m.id}', event);" 
                      class="p-1 rounded-lg text-amber-500 hover:text-rose-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer shrink-0" 
                      title="${isPinned ? 'Retirer du raccourci' : 'Épingler en raccourci'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin ${isPinned ? 'rotate-[-35deg]' : ''}"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  };

  window.API = API;
  window.socket = socket;
  window.ProtecAPI = ProtecAPI;

  // Auto-initialisation au chargement si window.game existe déjà
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.game && !ProtecAPI._initialized) {
          ProtecAPI.init(window.game);
        }
      }, 500);
    });
  }

})(window);
