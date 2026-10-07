/**
 * PROTEC LIVE - SIMULATEUR OPÉRATIONNEL DE LA PROTECTION CIVILE
 * Mode Multijoueur en temps réel avec Alliances, Demandes de Renforts,
 * Formations Spéciales Mutualisées et Canal Radio Fédéral.
 */

window.game = null;

class ProtecGame {
  constructor() {
    this.speed = 1;
    this.currentFilter = 'all';
    this.selectedStationId = null;
    this.selectedMissionId = null;
    this.isPlacingAntenna = false;

    // Profil Joueur Réseau
    let savedPlayerId = localStorage.getItem('protec_player_id');
    if (!savedPlayerId) {
      savedPlayerId = `p-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
      localStorage.setItem('protec_player_id', savedPlayerId);
    }
    this.player = {
      id: savedPlayerId,
      name: localStorage.getItem('protec_player_name') || 'Directeur d’Antenne',
      allianceId: localStorage.getItem('protec_alliance_id') || 'alliance-fnpc',
      departmentCode: localStorage.getItem('protec_department_code') || '75',
      deptRole: localStorage.getItem('protec_dept_role') || 'antenne_principale'
    };

    // Calendrier et Horloge Opérationnelle (Lundi 5 Octobre 2026 à 08:00)
    this.clock = {
      year: 2026,
      month: 9, // Octobre
      day: 5,
      hour: 8,
      minute: 0,
      totalHoursElapsed: 0,
      monthsNames: [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ],
      monthsShort: [
        'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
        'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
      ],
      daysNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    };

    // Ressources et Notoriété
    this.resources = {
      money: 15000,
      reputationScore: 0,
      reputationLevel: 1,
      followers: 140,
      alliancePoints: 50,
      campaigns: {
        social: false,
        posters: false
      }
    };

    // Département d'affectation du joueur (101 départements français)
    this.currentDepartmentCode = this.player.departmentCode || '75';

    // Garde SAMU 15 (AASC conventionné)
    this.samuGarde = {
      active: false,
      vehicleId: null,
      crewVolunteerIds: [],
      shiftStartedAt: null,
      totalInterventions: 0
    };

    // Garde Caserne Pompiers (SDIS / BSPP) & Astreinte Domicile (Violences urbaines / Débordements)
    this.sdisGarde = {
      active: false,
      eventName: null,
      eventReason: null,
      eventSeverity: 'normal',
      caserneCrewCountRequested: 0,
      astreinteCrewCountRequested: 0,
      caserneCrew: [],     // Volontaires postés en caserne prêts au départ réflexe VPSP
      astreinteCrew: [],   // Volontaires en astreinte domicile prêts à être rappelés
      vehicleId: null,
      startedAt: null,
      durationHours: 6,
      endsAt: null,
      stateSatisfaction: 100, // 0 - 100 % (Notoriété auprès des services de l'État / Préfecture)
      sanctionWarnings: 0,
      agrementSuspended: false,
      logInterventions: []
    };

    // Confiance Préfectorale & Notoriété Services de l'État
    this.prefectureState = {
      trustScore: 85, // 0 à 100
      agrementSuspended: false,
      warningsCount: 0
    };

    // Données opérationnelles
    this.stations = [];
    this.vehicles = [];
    this.volunteers = [];
    this.devis = [];
    this.missions = [];
    this.candidatures = [];
    this.jobOffers = [];
    this.formations = [];

    // Données Multijoueur & Alliances
    this.alliances = [];
    this.allianceStations = [];
    this.renforts = [];
    this.formationsSpeciales = [];
    this.chatMessages = [];
    this.activeAllianceTab = 'membres';
    this.activePlanningTab = 'calendar';
    this.modalHistory = [];
    this.currentModalKey = null;
    this.sncfConvention = { signed: false, signedAt: null, totalInterventions: 0 };

    // Marqueurs Leaflet
    this.markers = {
      stations: {},
      allianceStations: {},
      missions: {}
    };

    this.loadGame();
    if (window.ProtecSystems) {
      window.ProtecSystems.injectState(this);
    }
    if (window.ProtecAdvanced) {
      window.ProtecAdvanced.injectAdvancedState(this);
    }
    if (window.ProtecPersonnel) {
      window.ProtecPersonnel.injectPersonnelState(this);
    }
    this.init();
    this.initMultiplayer();
    if (window.ProtecAuth) {
      window.ProtecAuth.init(this);
    }
    if (window.ProtecAds) {
      window.ProtecAds.init(this);
    }
    if (window.ProtecNotifications) {
      window.ProtecNotifications.init(this);
    }
  }

  openAuthModal() {
    if (window.ProtecAuth) {
      window.ProtecAuth.openAuthModal();
    }
  }

  // --- DATES & CALENDRIER ---
  getDayOfWeek(year, month, day) {
    const d = new Date(year, month, day);
    return this.clock.daysNames[d.getDay()];
  }

  formatFullDate(dateObj) {
    const dayName = this.getDayOfWeek(dateObj.year, dateObj.month, dateObj.day);
    const monthName = this.clock.monthsNames[dateObj.month];
    return `${dayName} ${dateObj.day} ${monthName} ${dateObj.year}`;
  }

  formatShortDate(dateObj) {
    const dayName = this.getDayOfWeek(dateObj.year, dateObj.month, dateObj.day);
    const monthShort = this.clock.monthsShort[dateObj.month];
    return `${dayName} ${dateObj.day} ${monthShort}`;
  }

  createDateOffset(daysAhead, hour = 14) {
    const d = new Date(this.clock.year, this.clock.month, this.clock.day + daysAhead);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      hour: hour,
      dayName: this.clock.daysNames[d.getDay()]
    };
  }

  // --- INITIALISATION DU MULTIJOUEUR ---
  initMultiplayer() {
    // 1. Récupération de l'état initial du serveur
    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        if (data.alliances) this.alliances = data.alliances;
        if (data.allianceStations) {
          // FILTRE STRICT : Ne JAMAIS inclure nos propres antennes dans les antennes alliées
          this.allianceStations = (data.allianceStations || []).filter(st => {
            if (st.playerId === this.player.id) return false;
            if (this.stations.some(s => s.id === st.id)) return false;
            if (this.stations.some(s => Math.abs(s.lat - st.lat) < 0.0003 && Math.abs(s.lng - st.lng) < 0.0003)) return false;
            return true;
          });
        }
        if (data.renforts) this.renforts = data.renforts;
        if (data.formationsSpeciales) this.formationsSpeciales = data.formationsSpeciales;
        if (data.chatMessages) this.chatMessages = data.chatMessages;

        this.renderAllianceStations();
        this.updateStatsUI();
      })
      .catch(err => console.log('Mode hors ligne serveur:', err));

    // 2. Connexion SSE (Server-Sent Events) en temps réel
    if (window.EventSource) {
      const evtSource = new EventSource('/api/events');
      evtSource.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data);
          this.handleMultiplayerEvent(type, data);
        } catch (err) {
          console.warn('Erreur message SSE:', err);
        }
      };
      evtSource.onerror = () => {
        // En cas de coupure temporaire, EventSource reconnecte tout seul
      };
    }

    // 3. Battement de coeur périodique pour diffuser nos antennes aux autres joueurs
    setInterval(() => {
      this.syncPlayerToServer();
    }, 15000);
  }

  syncPlayerToServer() {
    const payload = {
      id: this.player.id,
      name: this.player.name,
      allianceId: this.player.allianceId,
      stations: this.stations.map(s => ({
        id: s.id,
        name: s.name,
        city: s.city,
        lat: s.lat,
        lng: s.lng,
        level: s.level,
        vehiclesCount: s.vehicles.length,
        volunteersCount: this.volunteers.filter(v => v.stationId === s.id).length
      })),
      volunteersCount: this.volunteers.length,
      vehiclesCount: this.vehicles.length
    };

    fetch('/api/player/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  handleMultiplayerEvent(type, data) {
    if (type === 'renfort_requested') {
      if (data.requesterPlayerId !== this.player.id) {
        this.renforts.unshift(data);
        this.showToast('Appel à Renfort d’Alliance', `[${data.allianceTag || 'Allié'}] ${data.title} a besoin de renforts !`, 'orange');
        this.updateStatsUI();
      }
    } else if (type === 'renfort_fulfilled') {
      const r = this.renforts.find(renf => renf.id === data.id);
      if (r) r.status = 'fulfilled';
      if (data.requesterPlayerId === this.player.id) {
        this.showToast('Renfort Reçu !', `${data.fulfilledBy.providerName} vous a dépêché : ${data.fulfilledBy.unitDetails} !`, 'green');
      }
      this.updateStatsUI();
    } else if (type === 'formation_created') {
      this.formationsSpeciales.unshift(data);
      if (data.organizerPlayerId !== this.player.id) {
        this.showToast('Nouveau Stage Fédéral', `Stage spécial « ${data.title} » proposé par ${data.organizerName}.`, 'blue');
      }
      this.updateStatsUI();
    } else if (type === 'chat_message') {
      this.chatMessages.push(data);
      if (data.senderId !== this.player.id) {
        this.showToast('Radio Alliance', `${data.senderName} : « ${data.text.substr(0, 45)}... »`, 'blue');
      }
      const chatBox = document.getElementById('alliance-chat-messages');
      if (chatBox) this.renderChatMessages();
    } else if (type === 'player_sync') {
      if (data.player && data.player.id !== this.player.id) {
        // Mettre à jour les stations de cet allié sur la carte
        this.updateRemotePlayerStations(data.player);
      }
    } else if (type === 'admin_broadcast') {
      this.showToast(data.title || 'Message Flash de la Direction', data.message, data.type || 'orange');
      if (window.ProtecIncidents) {
        window.ProtecIncidents.sendSystemNotification(data.title || '🚨 Direction Nationale', data.message, 'admin-broadcast');
      }
    } else if (type === 'admin_user_updated') {
      if (data.userId === this.player.id) {
        if (data.updates.money !== undefined) {
          this.resources.money = Number(data.updates.money);
          this.updateStatsUI();
          this.showToast('Actualisation Trésorerie BDD', `Solde ajusté à ${Number(data.updates.money).toLocaleString('fr-FR')} € par l’Administration.`, 'green');
        }
        if (data.updates.isBanned) {
          alert('Votre compte a été suspendu par un administrateur.');
          location.reload();
        }
      }
    }
  }

  updateRemotePlayerStations(remotePlayer) {
    if (!remotePlayer || remotePlayer.id === this.player.id) return;

    // Retirer anciennes stations de ce joueur et de nos propres stations
    this.allianceStations = this.allianceStations.filter(s =>
      s.playerId !== remotePlayer.id &&
      !this.stations.some(my => my.id === s.id) &&
      !this.stations.some(my => Math.abs(my.lat - s.lat) < 0.0003 && Math.abs(my.lng - s.lng) < 0.0003)
    );

    // Ajouter les nouvelles
    if (remotePlayer.stations && remotePlayer.stations.length > 0) {
      remotePlayer.stations.forEach(st => {
        if (this.stations.some(my => my.id === st.id)) return;
        if (this.stations.some(my => Math.abs(my.lat - st.lat) < 0.0003 && Math.abs(my.lng - st.lng) < 0.0003)) return;
        this.allianceStations.push({
          id: st.id,
          playerId: remotePlayer.id,
          playerName: remotePlayer.name,
          name: st.name,
          city: st.city,
          lat: st.lat,
          lng: st.lng,
          level: st.level,
          vehicles: st.vehiclesCount,
          volunteers: st.volunteersCount,
          allianceId: remotePlayer.allianceId
        });
      });
    }

    this.renderAllianceStations();
  }

  // --- RENDU CARTE ALLIANCE ---
  renderAllianceStations() {
    Object.values(this.markers.allianceStations).forEach(m => this.map.removeLayer(m));
    this.markers.allianceStations = {};

    this.allianceStations.forEach(st => {
      // Sécurité absolue : ignorer si c'est notre antenne
      if (st.playerId === this.player.id) return;
      if (this.stations.some(my => my.id === st.id)) return;
      if (this.stations.some(my => Math.abs(my.lat - st.lat) < 0.0003 && Math.abs(my.lng - st.lng) < 0.0003)) return;

      const el = document.createElement('div');
      el.className = 'custom-leaflet-marker';
      el.innerHTML = `
        <div class="marker-inner bg-indigo-700 border-indigo-200">
          <i data-lucide="shield-check" class="w-4 h-4 text-white"></i>
          <span class="badge-counter bg-indigo-500">${st.vehicles}</span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'clean-marker',
        html: el,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });

      const marker = L.marker([st.lat, st.lng], { icon }).addTo(this.map);
      marker.on('click', () => {
        this.openAllianceStationDetails(st);
      });

      this.markers.allianceStations[st.id] = marker;
    });

    if (window.lucide) window.lucide.createIcons();
  }

  openAllianceStationDetails(st) {
    const drawer = document.getElementById('context-drawer');
    const title = document.getElementById('drawer-title');
    const catBadge = document.getElementById('drawer-category-badge');
    const headerIcon = document.getElementById('drawer-header-icon');
    const body = document.getElementById('drawer-body');
    const footer = document.getElementById('drawer-footer');

    catBadge.textContent = 'ANTENNE PARTENAIRE ALLIÉE';
    catBadge.className = 'text-[10px] uppercase font-bold tracking-wider text-indigo-700';
    title.textContent = st.name;
    headerIcon.setAttribute('data-lucide', 'shield-check');

    body.innerHTML = `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-extrabold text-indigo-900">Directeur : ${st.playerName}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">Allié UFSC</span>
          </div>
          <p class="text-xs text-indigo-800">Antenne conventionnée avec l’Union Fédérale. Prête à déployer des renforts sur demande.</p>
        </div>

        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 rounded-2xl bg-white/80 border border-slate-200">
            <span class="text-slate-400 block text-[10px] font-bold uppercase">Véhicules</span>
            <span class="text-sm font-extrabold text-slate-800">${st.vehicles} unités</span>
          </div>
          <div class="p-3 rounded-2xl bg-white/80 border border-slate-200">
            <span class="text-slate-400 block text-[10px] font-bold uppercase">Secouristes</span>
            <span class="text-sm font-extrabold text-slate-800">${st.volunteers} membres</span>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-white/80 border border-slate-200 space-y-2">
          <h4 class="text-xs font-extrabold text-slate-700 uppercase">Entraide Opérationnelle</h4>
          <p class="text-xs text-slate-600 leading-relaxed">
            Vous pouvez solliciter un départ de renfort VPSP ou d'équipiers auprès de cette antenne si l'un de vos dispositifs planifiés manque d'effectif.
          </p>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button onclick="window.game.closeDrawer()" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">Fermer</button>
      <button onclick="window.game.requestDirectRenfort('${st.id}', '${st.name}')" class="flex-1 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center justify-center gap-1.5">
        <i data-lucide="send" class="w-4 h-4"></i>
        Demander un Renfort VPSP
      </button>
    `;

    drawer.classList.remove('hidden');
    drawer.classList.add('flex', 'drawer-slide-in');
    if (window.lucide) window.lucide.createIcons();
  }

  requestDirectRenfort(targetStationId, targetStationName) {
    this.closeDrawer();
    const renfortData = {
      requesterPlayerId: this.player.id,
      requesterName: this.player.name,
      allianceId: this.player.allianceId,
      allianceTag: 'UFSC',
      title: `Renfort d’urgence pour DPS urbain`,
      desc: `Demande de 1 VPSP ou 2 secouristes qualifiés transmise à ${targetStationName}.`,
      targetStationName: targetStationName,
      unitRequested: '1 VPSP ou binôme PSE',
      indemnite: 180
    };

    fetch('/api/alliances/renfort/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renfortData)
    }).then(res => res.json()).then(data => {
      this.renforts.unshift(data.renfort);
      this.showToast('Appel à Renfort Transmis', `Demande envoyée à ${targetStationName}. En attente de détachement...`, 'green');
      this.updateStatsUI();
    }).catch(() => {
      // Simulation locale si serveur hors-ligne
      renfortData.id = `renf-${Date.now()}`;
      this.renforts.unshift(renfortData);
      this.showToast('Appel à Renfort Transmis', `Demande transmise sur la fréquence fédérale.`, 'green');
    });
  }

  init() {
    this.initMap();
    this.renderStations();
    this.disperseOverlappingMissions();
    this.renderMissions();
    this.updateStatsUI();
    this.startSimulationClock();

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Demande des notifications d'urgence pour incidents & SAMU (PC & Mobile)
    if (window.ProtecIncidents && 'Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        window.ProtecIncidents.requestNotificationPermission();
      }, 4000);
    }

    if (this.stations.length === 0) {
      this.showOnboardingModal();
    } else {
      this.showToast('Partie chargée', `Bienvenue ! Votre antenne compte ${this.volunteers.length} secouristes.`, 'blue');
    }
  }

  saveGame() {
    try {
      const state = {
        player: this.player,
        clock: this.clock,
        resources: this.resources,
        currentCityKey: this.currentCityKey,
        stations: this.stations,
        vehicles: this.vehicles,
        volunteers: this.volunteers,
        devis: this.devis,
        missions: this.missions,
        candidatures: this.candidatures,
        formations: this.formations,
        logistics: this.logistics,
        weather: this.weather,
        grants: this.grants,
        radioLogs: this.radioLogs,
        rewards: this.rewards,
        bureau: this.bureau,
        samuGarde: this.samuGarde,
        sdisGarde: this.sdisGarde,
        prefectureState: this.prefectureState,
        sncfConvention: this.sncfConvention,
        jobOffers: this.jobOffers,
        adRewards: this.adRewards
      };
      localStorage.setItem('protec_live_save_v4', JSON.stringify(state));
    } catch (e) {
      console.warn('Erreur sauvegarde:', e);
    }
  }

  loadGame() {
    try {
      const saved = localStorage.getItem('protec_live_save_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stations && parsed.stations.length > 0) {
          this.clock = parsed.clock || this.clock;
          this.resources = parsed.resources || this.resources;
          this.currentCityKey = parsed.currentCityKey || this.currentCityKey;
          this.stations = parsed.stations || [];
          this.vehicles = parsed.vehicles || [];
          this.volunteers = parsed.volunteers || [];
          this.devis = parsed.devis || [];
          this.missions = parsed.missions || [];
          this.candidatures = parsed.candidatures || [];
          this.jobOffers = parsed.jobOffers || [];
          this.formations = parsed.formations || [];
          this.logistics = parsed.logistics || this.logistics;
          this.weather = parsed.weather || this.weather;
          this.grants = parsed.grants || this.grants;
          this.radioLogs = parsed.radioLogs || this.radioLogs;
          this.rewards = parsed.rewards || this.rewards;
          this.bureau = parsed.bureau || this.bureau;
          this.manoeuvres = parsed.manoeuvres || this.manoeuvres;
          this.samuGarde = parsed.samuGarde || this.samuGarde;
          this.sdisGarde = parsed.sdisGarde || this.sdisGarde;
          this.prefectureState = parsed.prefectureState || this.prefectureState;
          this.sncfConvention = parsed.sncfConvention || this.sncfConvention;
          this.adRewards = parsed.adRewards || null;
          if (parsed.player) this.player = parsed.player;
        }
      }
    } catch (e) {
      console.warn('Erreur chargement:', e);
    }
  }

  confirmResetGame() {
    this.openResetModal();
  }

  openResetModal() {
    const modal = document.getElementById('reset-confirm-modal');
    const input = document.getElementById('reset-confirm-input');
    if (input) input.value = '';
    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  closeResetModal() {
    const modal = document.getElementById('reset-confirm-modal');
    if (modal) modal.classList.add('hidden');
  }

  async executeSecureReset() {
    const input = document.getElementById('reset-confirm-input');
    if (!input || input.value.trim().toUpperCase() !== 'CONFIRMER') {
      this.showToast('Validation requise', 'Veuillez saisir exactement le mot CONFIRMER pour valider.', 'orange');
      return;
    }

    // 1. Sauvegarde / Snapshot d'archive avant effacement (Protection intégrale)
    let currentSnapshot = null;
    try {
      currentSnapshot = {
        clock: this.clock,
        resources: this.resources,
        currentCityKey: this.currentCityKey,
        stations: this.stations,
        vehicles: this.vehicles,
        volunteers: this.volunteers,
        devis: this.devis,
        missions: this.missions,
        candidatures: this.candidatures,
        formations: this.formations,
        logistics: this.logistics,
        weather: this.weather,
        grants: this.grants,
        radioLogs: this.radioLogs,
        rewards: this.rewards,
        bureau: this.bureau,
        manoeuvres: this.manoeuvres,
        adRewards: this.adRewards,
        player: this.player
      };
      // Archive d'urgence locale dans le localStorage
      localStorage.setItem('protec_backup_before_reset', JSON.stringify({
        date: new Date().toISOString(),
        playerId: this.player.id,
        playerName: this.player.name,
        snapshot: currentSnapshot
      }));
    } catch (err) {
      console.warn('Erreur snapshot local:', err);
    }

    // 2. Envoi de l'archive au serveur / BDD pour conservation sécurisée
    try {
      const token = localStorage.getItem('protec_auth_token');
      await fetch('/api/game/archive-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          playerId: this.player.id,
          playerName: this.player.name,
          reason: 'Réinitialisation manuelle demandée par le joueur',
          snapshotData: currentSnapshot
        })
      });
    } catch (err) {
      console.warn('Erreur envoi archive serveur:', err);
    }

    // 3. Effacement de la sauvegarde active
    localStorage.removeItem('protec_live_save_v4');
    this.closeResetModal();
    this.showToast('Antenne réinitialisée', 'Votre ancienne partie a été archivée avec succès. Rechargement...', 'green');
    setTimeout(() => {
      location.reload();
    }, 1200);
  }

  showOnboardingModal() {
    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.remove('hidden');
  }

  startFirstStationOnboarding() {
    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.add('hidden');
    this.startAntennaPlacement();
  }

  initMap() {
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(this.currentDepartmentCode) : null;
    const centerLat = deptInfo ? deptInfo.lat : 48.8566;
    const centerLng = deptInfo ? deptInfo.lng : 2.3522;
    const initialZoom = deptInfo ? deptInfo.zoom : 11;

    this.map = L.map('map', {
      center: [centerLat, centerLng],
      zoom: initialZoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.baseLayers = {
      light: L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 16
        }),
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 16
        })
      ]),
      osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      })
    };

    this.baseLayers.light.addTo(this.map);

    L.control.layers({
      'Épuré (Gris clair)': this.baseLayers.light,
      'Rues (OpenStreetMap)': this.baseLayers.osm
    }, null, { position: 'bottomright' }).addTo(this.map);

    // Initialisation du sélecteur départemental desktop
    this.populateDepartmentSelector();

    this.map.on('click', (e) => {
      if (this.isPlacingAntenna) {
        this.confirmAntennaPlacement(e.latlng);
      } else {
        this.closeDrawer();
      }
    });
  }

  populateDepartmentSelector() {
    const sel = document.getElementById('department-selector');
    if (!sel || !window.ProtecDepartements) return;

    sel.innerHTML = window.ProtecDepartements.list.map(d => `
      <option value="${d.code}" ${d.code === this.currentDepartmentCode ? 'selected' : ''}>
        ${d.code} - ${d.name} ${d.code === this.currentDepartmentCode ? '⭐ (Mon Antenne)' : ''}
      </option>
    `).join('');
  }

  // Permet d'explorer / observer un autre département sur la carte SANS changer l'affectation de l'antenne
  inspectDepartment(deptCode) {
    if (!window.ProtecDepartements) return;
    const dept = window.ProtecDepartements.getByCode(deptCode);
    if (!dept) return;

    // Déplacement de la caméra Leaflet pour visualiser le département
    this.map.flyTo([dept.lat, dept.lng], dept.zoom, { duration: 1.5 });

    const myDeptCode = this.currentDepartmentCode || this.player.departmentCode || '75';
    const isOtherDept = (dept.code !== myDeptCode);

    // Mise à jour de la bannière visuelle d'observation
    const banner = document.getElementById('inspect-dept-banner');
    const returnBtn = document.getElementById('btn-return-my-antenna');
    const nameEl = document.getElementById('inspect-dept-name');
    const myCodeEl = document.getElementById('inspect-my-dept-code');

    if (banner && nameEl && myCodeEl) {
      if (isOtherDept) {
        nameEl.textContent = `${dept.name} (${dept.code})`;
        myCodeEl.textContent = myDeptCode;
        banner.classList.remove('hidden');
        if (returnBtn) returnBtn.classList.remove('hidden');
        this.showToast('Mode Observation', `Consultation du département ${dept.name} (${dept.code}). Votre antenne reste affectée en ${myDeptCode}.`, 'blue');
      } else {
        banner.classList.add('hidden');
        if (returnBtn) returnBtn.classList.add('hidden');
      }
    }
  }

  // Recentre la carte immédiatement sur l'antenne ou le département officiel du joueur
  returnToMyAntenna() {
    const myDeptCode = this.currentDepartmentCode || this.player.departmentCode || '75';
    const dept = window.ProtecDepartements ? window.ProtecDepartements.getByCode(myDeptCode) : null;

    if (this.stations.length > 0) {
      this.map.flyTo([this.stations[0].lat, this.stations[0].lng], 13, { duration: 1.2 });
    } else if (dept) {
      this.map.flyTo([dept.lat, dept.lng], dept.zoom, { duration: 1.2 });
    }

    // Réinitialise le sélecteur d'exploration sur notre propre département
    const sel = document.getElementById('department-selector');
    if (sel) sel.value = myDeptCode;

    const banner = document.getElementById('inspect-dept-banner');
    const returnBtn = document.getElementById('btn-return-my-antenna');
    if (banner) banner.classList.add('hidden');
    if (returnBtn) returnBtn.classList.add('hidden');

    this.showToast('Mon Antenne', `Retour à votre antenne d'affectation (${myDeptCode}).`, 'blue');
  }

  // Alias rétro-compatible si appelé ailleurs
  changeDepartment(deptCode) {
    this.inspectDepartment(deptCode);
  }

  renderStations() {
    Object.values(this.markers.stations).forEach(m => this.map.removeLayer(m));
    this.markers.stations = {};

    this.stations.forEach(station => {
      const el = document.createElement('div');
      el.className = 'custom-leaflet-marker';
      el.innerHTML = `
        <div class="marker-inner bg-white border-2 border-pc-blue p-0.5 shadow-lg">
          <img src="logo_protection_civile.png" alt="PC" class="w-full h-full object-contain rounded-full" />
          <span class="badge-counter bg-pc-orange">${station.vehicles.length}</span>
        </div>
      `;

      const icon = L.divIcon({
        className: 'clean-marker',
        html: el,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });

      const marker = L.marker([station.lat, station.lng], { icon }).addTo(this.map);
      marker.on('click', () => this.openStationDetails(station.id));
      this.markers.stations[station.id] = marker;
    });

    if (window.lucide) window.lucide.createIcons();
  }

  renderMissions() {
    Object.values(this.markers.missions).forEach(m => this.map.removeLayer(m));
    this.markers.missions = {};

    this.missions.forEach(mission => {
      if (this.currentFilter !== 'all' && mission.type !== this.currentFilter) return;

      // Règle : Afficher sur la carte exclusivement les DPS programmés pour le jour même (ou en cours)
      if (mission.type === 'dps' && mission.status === 'planifie') {
        const isToday = mission.eventDate ? (mission.eventDate.day === this.clock.day && mission.eventDate.month === this.clock.month) : true;
        if (!isToday) return;
      }

      const el = document.createElement('div');
      el.className = 'custom-leaflet-marker';

      let colorClass = 'bg-pc-blue';
      let pingClass = 'radar-ping-blue';
      let iconName = 'shield-alert';

      if (mission.type === 'samu') { colorClass = 'bg-pc-orange'; pingClass = 'radar-ping-orange'; iconName = 'activity'; }
      else if (mission.type === 'pompiers') { colorClass = 'bg-red-700'; pingClass = 'radar-ping-red'; iconName = 'flame'; }
      else if (mission.type === 'meteo') { colorClass = 'bg-sky-600'; pingClass = 'radar-ping-blue'; iconName = 'cloud-lightning'; }
      else if (mission.type === 'social') { colorClass = 'bg-purple-600'; pingClass = 'radar-ping-purple'; iconName = 'heart-handshake'; }
      else if (mission.type === 'crise') { colorClass = 'bg-red-600'; pingClass = 'radar-ping-red'; iconName = 'siren'; }

      let badgeHtml = '';
      if (mission.status === 'ongoing') {
        badgeHtml = `<span class="badge-counter bg-emerald-500 animate-pulse">✓</span>`;
      } else if (mission.status === 'prealerte') {
        badgeHtml = `<span class="badge-counter bg-amber-500 animate-ping">⏳</span>`;
        pingClass = 'radar-ping-orange';
      } else if (mission.status === 'declenche') {
        badgeHtml = `<span class="badge-counter bg-red-600 animate-pulse">!</span>`;
        pingClass = 'radar-ping-red';
      } else if (mission.status === 'planifie') {
        const isComplete = (mission.registeredVolunteers?.length || 0) >= mission.requiredVolunteers;
        badgeHtml = `<span class="badge-counter ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}">${mission.registeredVolunteers?.length || 0}/${mission.requiredVolunteers}</span>`;
      }

      el.innerHTML = `
        <div class="${pingClass}"></div>
        <div class="marker-inner ${colorClass}">
          <i data-lucide="${iconName}" class="w-4 h-4 text-white"></i>
          ${badgeHtml}
        </div>
      `;

      const icon = L.divIcon({
        className: 'clean-marker',
        html: el,
        iconSize: [42, 42],
        iconAnchor: [21, 21]
      });

      const marker = L.marker([mission.lat, mission.lng], { icon }).addTo(this.map);
      marker.on('click', () => this.openMissionDetails(mission.id));
      this.markers.missions[mission.id] = marker;
    });

    if (window.lucide) window.lucide.createIcons();
    this.updateMissionCounts();
  }

  startAntennaPlacement() {
    if (this.stations.length >= 1) {
      this.showToast('Limite d’Antenne Atteinte', 'En tant que Directeur, vous gérez votre antenne unique d’affectation départementale.', 'orange');
      return;
    }
    this.isPlacingAntenna = true;
    document.getElementById('antenna-placement-banner').classList.remove('hidden');
    document.getElementById('map').style.cursor = 'crosshair';
    this.showToast('Implantation', 'Cliquez sur la carte dans votre département pour positionner votre repère d’antenne.', 'blue');
  }

  cancelAntennaPlacement() {
    this.isPlacingAntenna = false;
    if (this.tempPlacementMarker) {
      this.map.removeLayer(this.tempPlacementMarker);
      this.tempPlacementMarker = null;
    }
    this.pendingPlacementLatLng = null;
    const modal = document.getElementById('placement-validation-modal');
    if (modal) modal.classList.add('hidden');
    const banner = document.getElementById('antenna-placement-banner');
    if (banner) banner.classList.add('hidden');
    document.getElementById('map').style.cursor = '';
  }

  async confirmAntennaPlacement(latlng) {
    if (this.stations.length >= 1) {
      this.showToast('Action impossible', 'Vous possédez déjà votre antenne départementale.', 'orange');
      this.cancelAntennaPlacement();
      return;
    }

    // 1. Contrôle strict de géolocalisation dans le bon département d'affectation
    const deptCode = this.currentDepartmentCode || this.player.departmentCode || '75';
    if (window.ProtecDepartements) {
      const isInside = window.ProtecDepartements.isCoordinateInside(deptCode, latlng.lat, latlng.lng);
      if (!isInside) {
        const dept = window.ProtecDepartements.getByCode(deptCode);
        this.showToast(
          'Hors du Département !',
          `Vous êtes affecté au département ${dept?.name || deptCode} (${deptCode}). Veuillez obligatoirement cliquer à l'intérieur de ce département.`,
          'orange'
        );
        return;
      }
    }

    // 2. Détermination de la commune ou de l'arrondissement via l'API Adresse officielle
    let detectedCity = `Secteur ${deptCode}`;
    let detectedCityCode = deptCode;
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${latlng.lng}&lat=${latlng.lat}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        // Pour Paris, Lyon, Marseille : privilégier l'arrondissement (district ou nom spécifique)
        detectedCity = props.district || props.city || `Secteur ${deptCode}`;
        detectedCityCode = props.citycode || deptCode;
      }
    } catch (e) {
      // Fallback
    }

    // 3. Contrôle de la règle : UNE SEULE ANTENNE PAR VILLE / ARRONDISSEMENT
    const allKnownStations = [...(this.stations || []), ...(this.allianceStations || [])];
    const isOccupied = allKnownStations.some(st => {
      if (st.city && st.city.toLowerCase() === detectedCity.toLowerCase()) return true;
      if (st.citycode && st.citycode === detectedCityCode) return true;
      // Contrôle de proximité physique (< 2.2 km) pour couvrir les centres urbains et arrondissements
      if (st.lat && st.lng) {
        const distKm = Math.sqrt(Math.pow(st.lat - latlng.lat, 2) + Math.pow((st.lng - latlng.lng) * Math.cos(latlng.lat * Math.PI / 180), 2)) * 111;
        if (distKm < 2.2) return true;
      }
      return false;
    });

    if (isOccupied) {
      this.showToast(
        'Secteur Déjà Couvert !',
        `Une antenne de la Protection Civile est déjà implantée à « ${detectedCity} ». La réglementation n’autorise qu’une seule antenne par ville ou arrondissement !`,
        'orange'
      );
      if (this.tempPlacementMarker) {
        this.map.removeLayer(this.tempPlacementMarker);
        this.tempPlacementMarker = null;
      }
      return;
    }

    const cost = 2500;
    if (this.resources.money < cost) {
      this.showToast('Trésorerie insuffisante', `Il vous faut ${cost} € de trésorerie pour implanter l'antenne.`, 'orange');
      this.cancelAntennaPlacement();
      return;
    }

    // Sauvegarde temporaire des coordonnées et informations de localisation
    this.pendingPlacementLatLng = latlng;
    this.pendingPlacementCity = detectedCity;
    this.pendingPlacementCityCode = detectedCityCode;

    // Création ou déplacement du repère temporaire visuel
    if (this.tempPlacementMarker) {
      this.tempPlacementMarker.setLatLng(latlng);
    } else {
      const el = document.createElement('div');
      el.className = 'custom-leaflet-marker';
      el.innerHTML = `
        <div class="radar-ping-orange"></div>
        <div class="marker-inner bg-pc-orange border-2 border-white p-1 shadow-2xl animate-pulse">
          <span class="text-xs font-black text-white">📍</span>
        </div>
      `;
      const icon = L.divIcon({
        className: 'clean-marker',
        html: el,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      this.tempPlacementMarker = L.marker([latlng.lat, latlng.lng], { icon }).addTo(this.map);
    }

    // Remplissage des détails dans la modale de validation
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(deptCode) : null;
    const isMainAntenna = this.player.deptRole === 'antenne_principale';
    const stationName = isMainAntenna 
      ? `Antenne de ${detectedCity} (Principale ${deptCode})` 
      : `Antenne de ${detectedCity} (${deptCode})`;

    this.pendingPlacementName = stationName;

    const deptEl = document.getElementById('placement-val-dept');
    if (deptEl) deptEl.textContent = `${deptInfo?.name || deptCode} (${deptCode}) • ${detectedCity}`;
    const nameEl = document.getElementById('placement-val-name');
    if (nameEl) nameEl.textContent = stationName;
    const coordsEl = document.getElementById('placement-val-coords');
    if (coordsEl) coordsEl.textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    const costEl = document.getElementById('placement-val-cost');
    if (costEl) costEl.textContent = `${cost.toLocaleString('fr-FR')} €`;

    const modal = document.getElementById('placement-validation-modal');
    if (modal) {
      modal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  adjustPlacementMarker() {
    const modal = document.getElementById('placement-validation-modal');
    if (modal) modal.classList.add('hidden');
    this.showToast('Ajustement', 'Cliquez à un autre endroit dans votre département pour repositionner le repère.', 'blue');
  }

  confirmAntennaPlacementFinal() {
    if (!this.pendingPlacementLatLng) return;
    const latlng = this.pendingPlacementLatLng;
    const deptCode = this.currentDepartmentCode || this.player.departmentCode || '75';
    const cost = 2500;

    if (this.resources.money < cost) {
      this.showToast('Trésorerie insuffisante', `Il vous faut ${cost} € de trésorerie.`, 'orange');
      this.cancelAntennaPlacement();
      return;
    }

    this.resources.money -= cost;
    const stationId = `station-${Date.now()}`;
    const isMainAntenna = this.player.deptRole === 'antenne_principale';
    const stationName = this.pendingPlacementName || (isMainAntenna 
      ? `Antenne Principale (${deptCode})` 
      : `Antenne Territoriale ${this.player.name} (${deptCode})`);

    const newStation = {
      id: stationId,
      name: stationName,
      departmentCode: deptCode,
      city: this.pendingPlacementCity || deptCode,
      citycode: this.pendingPlacementCityCode || deptCode,
      lat: latlng.lat,
      lng: latlng.lng,
      isMain: isMainAntenna,
      level: 1,
      rooms: { formation: false, standard: true },
      vehicles: []
    };
    const isFirst = this.stations.length === 0;
    if (isFirst) {
      const vehId = `vpsp-${Date.now()}`;
      this.vehicles.push({
        id: vehId,
        name: 'VPSP 01',
        type: 'VPSP',
        label: 'Ambulance de Premiers Secours',
        capacity: 4,
        status: 'dispo',
        stationId: stationId,
        image: 'images/vehicles/VPSP.png'
      });
      newStation.vehicles.push(vehId);

      const starters = [
        { name: 'Alexandre Roux', role: 'Chef d’Équipe', rank: 'CE', exp: 60, isTrainer: true, avatar: '👨‍💼', dispoType: 'salarié', dispoJours: ['Vendredi', 'Samedi', 'Dimanche'], motivation: 85 },
        { name: 'Sarah Benali', role: 'Équipier Secouriste', rank: 'PSE2', exp: 40, isTrainer: false, avatar: '👩‍🚒', dispoType: 'étudiante', dispoJours: ['Mardi', 'Samedi', 'Dimanche'], motivation: 80 },
        { name: 'Lucas Martin', role: 'Secouriste', rank: 'PSE1', exp: 20, isTrainer: false, avatar: '🙋‍♂️', dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'], motivation: 75 },
        { name: 'Élodie Leroy', role: 'Bénévole Stagiaire', rank: 'Stagiaire', exp: 5, isTrainer: false, avatar: '🧑', dispoType: 'étudiante', dispoJours: ['Mercredi', 'Vendredi', 'Samedi'], motivation: 90 }
      ];

      starters.forEach(s => {
        this.volunteers.push({
          id: `vol-${Date.now()}-${Math.random()}`,
          name: s.name,
          role: s.role,
          rank: s.rank,
          exp: s.exp,
          status: 'dispo',
          stationId: stationId,
          isTrainer: s.isTrainer,
          avatar: s.avatar,
          dispoType: s.dispoType,
          dispoJours: s.dispoJours,
          motivation: s.motivation
        });
      });

      this.generateStarterDevis(latlng);
      this.generateStarterCandidatures();
    }

    this.stations.push(newStation);
    this.cancelAntennaPlacement();
    this.renderStations();
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();
    this.syncPlayerToServer();

    // Actualisation météo réelle immédiate au point exact de l'antenne nouvellement créée
    if (window.ProtecSystems) {
      window.ProtecSystems.fetchRealWeather(this, true);
    }

    this.showToast('Antenne Inaugurée !', `${stationName} est ouverte. Un premier devis de la mairie vous attend !`, 'green');
    this.openStationDetails(stationId);
  }

  // --- BARÈME ET DEVIS ---
  calculateBareme(devis) {
    const ratePerHour = 18;
    const personnelCost = devis.requiredVolunteers * devis.durationHours * ratePerHour;
    let vehicleCost = 0;
    devis.requiredVehicles.forEach(v => {
      if (v === 'VPSP') vehicleCost += 110;
      else if (v === 'VTU') vehicleCost += 55;
      else if (v === 'VL') vehicleCost += 35;
    });

    let matCost = 35;
    if (devis.scale.includes('DPS-PE')) matCost = 65;
    if (devis.scale.includes('DPS-ME') || devis.scale.includes('DPS-GE')) matCost = 120;
    const adminCost = 40;
    const totalBareme = personnelCost + vehicleCost + matCost + adminCost;

    return {
      ratePerHour,
      personnelCost,
      vehicleCost,
      matCost,
      adminCost,
      totalBareme
    };
  }

  // --- GÉOLOCALISATION RÉALISTE DES MISSIONS & ÉVÉNEMENTS ---
  // Règle : Les missions doivent être réparties dans le département. Si plusieurs antennes sont implantées dans le département,
  // la mission est générée à proximité de l'antenne concernée (son bassin de vie).
  calculateRealisticMissionLocation(baseStation = null, missionType = 'dps') {
    const deptCode = this.currentDepartmentCode || this.player.departmentCode || '75';
    const dept = window.ProtecDepartements ? window.ProtecDepartements.getByCode(deptCode) : null;
    const stationsInDept = (this.stations || []).filter(s => s.departmentCode === deptCode || !s.departmentCode);
    const hasMultipleStations = stationsInDept.length > 1;

    // Point d'ancrage principal
    const base = baseStation || stationsInDept[0] || (dept ? { lat: dept.lat, lng: dept.lng } : { lat: 48.8566, lng: 2.3522 });

    let minDistanceKm = 1.8;
    let maxDistanceKm = 10.0;

    if (hasMultipleStations) {
      // Plusieurs antennes dans le même département : la mission reste dans le secteur de proximité de cette antenne
      if (missionType === 'samu' || missionType === 'pompiers') {
        minDistanceKm = 1.2;
        maxDistanceKm = 6.5; // Urgence réflexe de secteur
      } else if (missionType === 'dps') {
        minDistanceKm = 1.8;
        maxDistanceKm = 13.0; // Postes de secours du bassin
      } else {
        minDistanceKm = 2.5;
        maxDistanceKm = 18.0; // SNCF, météo, grandes crises
      }
    } else {
      // Antenne UNIQUE dans le département : l'antenne couvre TOUT le territoire départemental
      // Ventilation réaliste : une partie en agglomération, le reste dans les villes et cantons du département
      if (missionType === 'samu') {
        minDistanceKm = 1.8;
        maxDistanceKm = Math.random() < 0.6 ? 7.5 : 16.0;
      } else if (missionType === 'pompiers') {
        minDistanceKm = 1.8;
        maxDistanceKm = Math.random() < 0.65 ? 8.5 : 18.0;
      } else if (missionType === 'dps') {
        const roll = Math.random();
        if (roll < 0.30) {
          minDistanceKm = 2.5; maxDistanceKm = 8.5; // Urbain / agglomération
        } else if (roll < 0.70) {
          minDistanceKm = 8.5; maxDistanceKm = 22.0; // Villes moyennes & bassin du département
        } else {
          minDistanceKm = 20.0; maxDistanceKm = 40.0; // Rassemblements majeurs départementaux
        }
      } else if (missionType === 'sncf') {
        minDistanceKm = 4.0;
        maxDistanceKm = 30.0;
      } else {
        // Météo / Crise Préfecture
        minDistanceKm = 4.0;
        maxDistanceKm = 38.0;
      }
    }

    // Points existants pour anti-collision / anti-agglutinement
    const existingPoints = [
      ...this.stations.map(s => ({ lat: s.lat, lng: s.lng, minDist: 1.0 })),
      ...this.missions.map(m => ({ lat: m.lat, lng: m.lng, minDist: 1.4 })),
      ...this.devis.map(d => ({ lat: d.lat, lng: d.lng, minDist: 1.4 }))
    ];

    let bestCoord = null;
    const maxTries = 40;

    for (let tryIdx = 0; tryIdx < maxTries; tryIdx++) {
      const angle = Math.random() * 2 * Math.PI;
      const distKm = minDistanceKm + Math.random() * (maxDistanceKm - minDistanceKm);

      // 1 degré lat ~ 110.574 km
      const deltaLat = (distKm / 110.574) * Math.cos(angle);
      const latRad = (base.lat * Math.PI) / 180;
      const kmPerLngDeg = 111.320 * Math.cos(latRad);
      const deltaLng = (distKm / (kmPerLngDeg || 75)) * Math.sin(angle);

      const candLat = base.lat + deltaLat;
      const candLng = base.lng + deltaLng;

      // 1. Contrôle impératif : rester DANS les limites du département (bbox)
      if (dept && dept.bbox) {
        const [minLat, minLng, maxLat, maxLng] = dept.bbox;
        const latMargin = (maxLat - minLat) * 0.03;
        const lngMargin = (maxLng - minLng) * 0.03;
        if (candLat < minLat + latMargin || candLat > maxLat - latMargin ||
            candLng < minLng + lngMargin || candLng > maxLng - lngMargin) {
          continue;
        }
      }

      // 2. Contrôle anti-agglutinement avec les autres points
      let collision = false;
      for (const p of existingPoints) {
        const dLat = (candLat - p.lat) * 110.574;
        const dLng = (candLng - p.lng) * (kmPerLngDeg || 75);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < (p.minDist || 1.2)) {
          collision = true;
          break;
        }
      }

      if (!collision) {
        bestCoord = { lat: candLat, lng: candLng };
        break;
      }

      if (!bestCoord) {
        bestCoord = { lat: candLat, lng: candLng };
      }
    }

    if (!bestCoord) {
      bestCoord = { lat: base.lat + 0.03, lng: base.lng + 0.03 };
    }

    return bestCoord;
  }

  // Enrichissement automatique du nom de la commune hôte par reverse-géocodage
  enrichMissionLocationWithCity(item) {
    if (!item || !item.lat || !item.lng) return;
    try {
      fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${item.lng}&lat=${item.lat}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const city = props.city || props.district || props.name;
            if (city) {
              item.commune = city;
              if (item.eventName && !item.eventName.includes(city)) {
                item.eventLocationDetail = `Lieu : ${city} (${item.commune})`;
              }
            }
          }
        })
        .catch(() => {});
    } catch (e) {}
  }

  // Dispersion des missions existantes si elles sont trop agglutinées dans un rayon étroit
  disperseOverlappingMissions() {
    if (this.stations.length === 0) return;
    const base = this.stations[0];
    let changed = false;

    const allItems = [...this.missions, ...this.devis];
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      if (!item.lat || !item.lng) continue;

      const distToStation = Math.sqrt(Math.pow((item.lat - base.lat) * 110.574, 2) + Math.pow((item.lng - base.lng) * 75, 2));

      let tooClose = distToStation < 0.9;
      for (let j = 0; j < i; j++) {
        const other = allItems[j];
        const dist = Math.sqrt(Math.pow((item.lat - other.lat) * 110.574, 2) + Math.pow((item.lng - other.lng) * 75, 2));
        if (dist < 1.3) {
          tooClose = true;
          break;
        }
      }

      if (tooClose) {
        const mType = item.type || (item.scale ? 'dps' : 'dps');
        const newCoord = this.calculateRealisticMissionLocation(base, mType);
        item.lat = newCoord.lat;
        item.lng = newCoord.lng;
        this.enrichMissionLocationWithCity(item);
        changed = true;
      }
    }

    if (changed) {
      this.saveGame();
    }
  }

  generateStarterDevis(centerLatLng) {
    const eventDate = this.createDateOffset(5, 10);
    const coords = this.calculateRealisticMissionLocation({ lat: centerLatLng.lat, lng: centerLatLng.lng }, 'dps');
    const d = {
      id: `dev-${Date.now()}`,
      clientName: 'Comité des Fêtes & Mairie',
      clientType: 'municipalite',
      eventName: 'Fête de Printemps & Brocante Municipale',
      eventDate: eventDate,
      durationHours: 7,
      lat: coords.lat,
      lng: coords.lng,
      publicCount: '1 200 personnes',
      scale: 'PAPS (Point d’Alerte - 2 secouristes)',
      requiredVolunteers: 2,
      requiredRanks: ['PSE2', 'PSE1'],
      requiredVehicles: [],
      status: 'pending'
    };

    d.bareme = this.calculateBareme(d);
    d.proposedPrice = d.bareme.totalBareme;
    this.enrichMissionLocationWithCity(d);
    this.devis.push(d);
  }

  generateRandomDevisOpportunity() {
    if (this.stations.length === 0) return;
    const base = this.stations[Math.floor(Math.random() * this.stations.length)];
    const cap = this.calculatePlayerCapacity ? this.calculatePlayerCapacity() : { tier: 1 };
    const deptCode = this.currentDepartmentCode || this.player.departmentCode || '75';

    // L'accès aux tailles de dispositifs et aux sollicitations dépend de la réputation de l'antenne
    const rep = this.resources.reputationScore || 0;
    let allowedTier = 1; // PAPS par défaut
    if (rep >= 120 && cap.tier >= 2) allowedTier = 2; // DPS-PE accessible
    if (rep >= 350 && cap.tier >= 3) allowedTier = 3; // DPS-ME accessible
    if (rep >= 700 && cap.tier >= 4) allowedTier = 4; // DPS-GE accessible

    let eventsList = [];
    if (allowedTier === 1) {
      // Débutant (PAPS : 2 à 3 secouristes, durées 2h à 4h)
      eventsList = [
        { name: 'Cross du Collège Pasteur', client: 'Éducation Nationale', cType: 'association', dur: 3, pub: '450 élèves', scale: 'PAPS (2 secouristes)', reqV: 2, ranks: ['PSE1', 'PSE2'], reqVeh: [], hiddenMin: 2, hiddenSkills: ['PSE1'], matCost: 15 },
        { name: 'Brocante de Quartier des Berges', client: 'Comité des Fêtes', cType: 'association', dur: 4, pub: '1 200 chineurs', scale: 'PAPS (2 secouristes)', reqV: 2, ranks: ['PSE1', 'PSE2'], reqVeh: [], hiddenMin: 2, hiddenSkills: ['PSE1'], matCost: 15 },
        { name: 'Tournoi Minimes de Handball', client: 'Club Omnisports', cType: 'club_sportif', dur: 3, pub: '600 personnes', scale: 'PAPS (3 secouristes)', reqV: 3, ranks: ['PSE1', 'PSE2'], reqVeh: cap.vpspCount > 0 ? ['VPSP'] : [], hiddenMin: 3, hiddenSkills: ['PSE2'], matCost: 20 },
        { name: 'Fête de Quartier & Olympiades', client: 'Maison de Quartier', cType: 'association', dur: 4, pub: '800 habitants', scale: 'PAPS (2 secouristes)', reqV: 2, ranks: ['PSE1', 'PSE2'], reqVeh: [], hiddenMin: 2, hiddenSkills: ['PSE1'], matCost: 15 },
        { name: 'Kermesse des Écoles & Fête Laïque', client: 'Association Parents Élèves', cType: 'association', dur: 3, pub: '550 familles', scale: 'PAPS (2 secouristes)', reqV: 2, ranks: ['PSE1', 'PSE2'], reqVeh: [], hiddenMin: 2, hiddenSkills: ['PSE1'], matCost: 12 },
        { name: 'Course d’Orientation & Marche Nordique', client: 'Ligue Randonnée Pédestre', cType: 'club_sportif', dur: 4, pub: '400 marcheurs', scale: 'PAPS (3 secouristes)', reqV: 3, ranks: ['PSE1', 'PSE2'], reqVeh: [], hiddenMin: 3, hiddenSkills: ['PSE2'], matCost: 18 },
        { name: 'Tournoi Départemental de Gymnastique', client: 'Comité de Gymnastique', cType: 'club_sportif', dur: 4, pub: '750 spectateurs', scale: 'PAPS (3 secouristes)', reqV: 3, ranks: ['PSE1', 'PSE2'], reqVeh: cap.vpspCount > 0 ? ['VPSP'] : [], hiddenMin: 3, hiddenSkills: ['PSE2'], matCost: 20 },
        { name: 'Rencontre Régionale d’Échecs Géants', client: 'Ligue Échiquéenne', cType: 'association', dur: 3, pub: '350 participants', scale: 'PAPS (2 secouristes)', reqV: 2, ranks: ['PSE1'], reqVeh: [], hiddenMin: 2, hiddenSkills: ['PSE1'], matCost: 10 }
      ];
    } else if (allowedTier === 2) {
      // Opérationnel (DPS-PE : 4 à 6 secouristes, 1 VPSP, durées 4h à 6h)
      eventsList = [
        { name: 'Course Nocturne des 10 km', client: 'Athlétic Club Régional', cType: 'association', dur: 5, pub: '2 500 coureurs', scale: 'DPS-PE (4 secouristes + VPSP)', reqV: 4, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 4, hiddenSkills: ['CE'], matCost: 35 },
        { name: 'Feu d’Artifice & Bal Républicain', client: 'Mairie', cType: 'collectivite', dur: 4, pub: '3 500 spectateurs', scale: 'DPS-PE (5 secouristes + VPSP)', reqV: 5, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 5, hiddenSkills: ['CE', 'PSE2'], matCost: 40 },
        { name: 'Tournoi Régional de Judo', client: 'Ligue Régionale', cType: 'club_sportif', dur: 6, pub: '1 500 judokas & public', scale: 'DPS-PE (4 secouristes)', reqV: 4, ranks: ['PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 4, hiddenSkills: ['PSE2'], matCost: 30 },
        { name: 'Carnaval Municipal & Défilé des Chars', client: 'Direction de la Culture', cType: 'collectivite', dur: 5, pub: '4 200 spectateurs', scale: 'DPS-PE (5 secouristes + VPSP)', reqV: 5, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 5, hiddenSkills: ['CE', 'PSE2'], matCost: 42 },
        { name: 'Salon Pop-Culture & Convention Geek', client: 'Agence Événementielle', cType: 'professionnel', dur: 6, pub: '3 800 visiteurs', scale: 'DPS-PE (4 secouristes + VPSP)', reqV: 4, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 4, hiddenSkills: ['CE'], matCost: 35 },
        { name: 'Trail des Crêtes & Sentiers Boisés', client: 'Fédération Trail', cType: 'club_sportif', dur: 6, pub: '1 800 coureurs', scale: 'DPS-PE (5 secouristes + VPSP + VTU)', reqV: 5, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 5, hiddenSkills: ['CE', 'PSE2'], matCost: 45 },
        { name: 'Gala Régional de Boxe & Muay Thaï', client: 'Ligue Sports de Combat', cType: 'club_sportif', dur: 5, pub: '2 200 spectateurs', scale: 'DPS-PE (5 secouristes + VPSP)', reqV: 5, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 5, hiddenSkills: ['CE', 'PSE2'], matCost: 48 },
        { name: 'Fête Médiévale & Reconstitution Historique', client: 'Office de Tourisme', cType: 'collectivite', dur: 6, pub: '3 000 visiteurs', scale: 'DPS-PE (4 secouristes + VPSP)', reqV: 4, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 4, hiddenSkills: ['CE'], matCost: 38 },
        { name: 'Fête de la Musique - Scène Centrale', client: 'Direction Événements Mairie', cType: 'collectivite', dur: 6, pub: '5 000 festivaliers', scale: 'DPS-PE (6 secouristes + VPSP)', reqV: 6, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 6, hiddenSkills: ['CE', 'PSE2'], matCost: 50 },
        { name: 'Traversée à la Nage en Eau Libre', client: 'Comité Régional Natation', cType: 'club_sportif', dur: 5, pub: '1 200 participants & public', scale: 'DPS-PE (4 secouristes + VPSP)', reqV: 4, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 4, hiddenSkills: ['CE', 'PSE2'], matCost: 35 }
      ];

      // Prise en compte de l'environnement territorial réel
      // 1. Départements du Sud / Boisés (Feux de forêts, patrouilles préventives)
      if (['13', '83', '06', '30', '34', '84', '20', '2A', '2B', '40', '33', '11', '66'].includes(deptCode)) {
        eventsList.push({ name: 'Patrouille Préventive Massif Boisé', client: 'Préfecture & DFCI', cType: 'collectivite', dur: 5, pub: 'Secteur Boisé', scale: 'DPS-PE (4 secouristes + VTU)', reqV: 4, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VTU', 'VPSP'], hiddenMin: 4, hiddenSkills: ['CE'], matCost: 30 });
        eventsList.push({ name: 'Féria Municipale & Course Camarguaise/Landaise', client: 'Club Taurin', cType: 'association', dur: 6, pub: '4 500 aficionados', scale: 'DPS-PE (6 secouristes + VPSP)', reqV: 6, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 6, hiddenSkills: ['CE', 'PSE2'], matCost: 55 });
      }

      // 2. Villes universitaires (Soirées étudiantes et galas récurrents le jeudi/vendredi soir)
      if (['75', '69', '13', '31', '59', '33', '35', '34', '67', '38', '44', '49', '86', '76', '14', '54'].includes(deptCode)) {
        eventsList.push({ name: 'Gala Annuel & Nuit des Étudiants', client: 'BDE Fédéral Universitaire', cType: 'association', dur: 6, pub: '3 200 étudiants', scale: 'DPS-PE (5 secouristes + VPSP)', reqV: 5, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 6, hiddenSkills: ['CE', 'PSE2'], matCost: 45 });
        eventsList.push({ name: 'Festival Universitaire Rock & Campus', client: 'Fédération Étudiante', cType: 'association', dur: 5, pub: '2 800 étudiants', scale: 'DPS-PE (5 secouristes + VPSP)', reqV: 5, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 5, hiddenSkills: ['CE', 'PSE2'], matCost: 40 });
      }

      // 3. Zéniths et grandes salles de spectacles
      if (['75', '93', '92', '69', '13', '31', '59', '67', '44', '33', '83', '76', '21', '63', '45', '54'].includes(deptCode)) {
        eventsList.push({ name: 'Concert Populaire au Zénith', client: 'Production Spectacles', cType: 'professionnel', dur: 5, pub: '5 500 spectateurs', scale: 'DPS-PE (6 secouristes + VPSP)', reqV: 6, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 6, hiddenSkills: ['CE'], matCost: 45 });
        eventsList.push({ name: 'Spectacle Musical & Tournée des Artistes', client: 'Live Nation France', cType: 'professionnel', dur: 5, pub: '6 000 spectateurs', scale: 'DPS-PE (6 secouristes + VPSP)', reqV: 6, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 6, hiddenSkills: ['CE', 'PSE2'], matCost: 48 });
      }
    } else {
      // Confirmé / Grand Dispositif (DPS-ME / GE : 6 à 12 secouristes, 1 à 2 VPSP)
      eventsList = [
        { name: 'Festival Musical de Plein Air', client: 'Collectif Festif', cType: 'professionnel', dur: 8, pub: '6 000 festivaliers', scale: 'DPS-ME (8 secouristes + 2 VPSP)', reqV: 8, ranks: ['CD', 'CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 8, hiddenSkills: ['CD', 'CE'], matCost: 65 },
        { name: 'Triathlon Départemental', client: 'Fédération Triathlon', cType: 'association', dur: 7, pub: '4 000 participants', scale: 'DPS-ME (6 secouristes + VPSP + VTU)', reqV: 6, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 6, hiddenSkills: ['CE', 'PSE2'], matCost: 55 },
        { name: 'Rencontre Nationale de Rugby', client: 'Stade Municipal', cType: 'professionnel', dur: 5, pub: '8 500 supporters', scale: 'DPS-ME (10 secouristes + 2 VPSP)', reqV: 10, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 10, hiddenSkills: ['CE', 'PSE2'], matCost: 70 },
        { name: 'Marathon International Métropolitain', client: 'Fédération d’Athlétisme', cType: 'professionnel', dur: 8, pub: '14 000 coureurs & public', scale: 'DPS-GE (12 secouristes + 2 VPSP + VTU)', reqV: 12, ranks: ['CD', 'CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP', 'VTU'], hiddenMin: 12, hiddenSkills: ['CD', 'CE'], matCost: 95 },
        { name: 'Foire Exposition & Salon de l’Artisanat', client: 'Parc des Expositions Régional', cType: 'professionnel', dur: 8, pub: '10 500 visiteurs', scale: 'DPS-ME (8 secouristes + 2 VPSP)', reqV: 8, ranks: ['CD', 'CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 8, hiddenSkills: ['CD', 'CE'], matCost: 75 },
        { name: 'Arène Esport & Championnat International', client: 'Gaming Federation', cType: 'professionnel', dur: 7, pub: '7 500 fans', scale: 'DPS-ME (8 secouristes + 2 VPSP)', reqV: 8, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 8, hiddenSkills: ['CE', 'PSE2'], matCost: 65 },
        { name: 'Festival Pyrotechnique & Son et Lumière', client: 'Comité Métropolitain', cType: 'collectivite', dur: 6, pub: '11 000 spectateurs', scale: 'DPS-GE (10 secouristes + 2 VPSP + VTU)', reqV: 10, ranks: ['CD', 'CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP', 'VTU'], hiddenMin: 10, hiddenSkills: ['CD', 'CE'], matCost: 80 }
      ];

      // Matchs de championnat tous les 15 jours dans les stades majeurs
      if (['75', '93', '92', '13', '69', '59', '31', '33', '44', '06', '67', '35', '42', '51', '29', '34', '57', '76', '54'].includes(deptCode)) {
        eventsList.push({ name: 'Match de Championnat au Grand Stade', client: 'Club Professionnel de Football', cType: 'professionnel', dur: 5, pub: '18 000 supporters', scale: 'DPS-ME (8 secouristes + 2 VPSP)', reqV: 8, ranks: ['CD', 'CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'], hiddenMin: 8, hiddenSkills: ['CE', 'PSE2'], matCost: 75 });
        eventsList.push({ name: 'Derby Régional à Guichets Fermés', client: 'Ligue Professionnelle', cType: 'professionnel', dur: 5, pub: '21 000 supporters', scale: 'DPS-GE (12 secouristes + 2 VPSP + VTU)', reqV: 12, ranks: ['CD', 'CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP', 'VTU'], hiddenMin: 12, hiddenSkills: ['CD', 'CE'], matCost: 95 });
      }

      // Secteur aéroportuaire majeur
      if (['75', '93', '95', '94', '91', '31', '06', '33', '69', '44', '59', '57', '54'].includes(deptCode)) {
        eventsList.push({ name: 'Meeting Aérien & Aéro-Show', client: 'Aéroport & Direction Sécurité', cType: 'professionnel', dur: 8, pub: '12 000 spectateurs', scale: 'DPS-GE (10 secouristes + 2 VPSP + VTU)', reqV: 10, ranks: ['CD', 'CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP', 'VTU'], hiddenMin: 10, hiddenSkills: ['CD', 'CE'], matCost: 85 });
      }
    }

    const pick = eventsList[Math.floor(Math.random() * eventsList.length)];
    const missionCoords = this.calculateRealisticMissionLocation(base, 'dps');
    const daysAhead = 1 + Math.floor(Math.random() * 4);
    const startHour = (pick.name.includes('Nocturne') || pick.name.includes('Concert') || pick.name.includes('Gala') || pick.name.includes('Étudiants')) ? 19 : 14;
    const endHour = (startHour + pick.dur) % 24;
    const eventDate = this.createDateOffset(daysAhead, startHour);
    eventDate.startHour = startHour;
    eventDate.endHour = endHour;

    const d = {
      id: `dev-${Date.now()}`,
      clientName: pick.client,
      clientType: pick.cType,
      eventName: pick.name,
      eventDate: eventDate,
      durationHours: pick.dur,
      lat: missionCoords.lat,
      lng: missionCoords.lng,
      publicCount: pick.pub,
      scale: pick.scale,
      requiredVolunteers: pick.reqV,
      requiredRanks: pick.ranks,
      requiredVehicles: pick.reqVeh,
      // Informations cachées au joueur
      hiddenMinVolunteers: pick.hiddenMin || pick.reqV,
      hiddenRequiredSkills: pick.hiddenSkills || pick.ranks || [],
      consumableCost: pick.matCost || 30,
      status: 'pending'
    };

    d.bareme = this.calculateBareme(d);
    d.proposedPrice = d.bareme.totalBareme;

    this.devis.push(d);
    this.updateStatsUI();
    this.saveGame();

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'dps',
        `📬 Nouvelle Demande de DPS`,
        `${pick.client} vous sollicite pour « ${pick.name} » (${pick.scale}). Consultez et validez le devis !`,
        `dps-${d.id}`
      );
    }

    this.showToast('Nouvelle Demande Organisateur', `« ${pick.name} » (${pick.scale}) vous a sollicité pour un devis.`, 'blue');
  }

  setPlanningTab(tab) {
    this.activePlanningTab = tab;
    this.openModule('planning', true);
  }

  selectPlanningDay(day) {
    this.selectedPlanningDay = day;
    this.openModule('planning', true);
  }

  calculateDynamicBareme(devis) {
    const ratePerHour = 18;
    const vols = devis.configuredVolunteers || devis.requiredVolunteers || 4;
    const dur = devis.durationHours || 4;
    const personnelCost = vols * dur * ratePerHour;

    let vehicleCost = 0;
    const vehs = devis.configuredVehicles || devis.requiredVehicles || [];
    vehs.forEach(v => {
      if (v === 'VPSP') vehicleCost += 110;
      else if (v === 'VTU') vehicleCost += 55;
      else if (v === 'VL') vehicleCost += 35;
    });

    const scale = devis.configuredScale || devis.scale || 'DPS-PE';
    let matCost = 35;
    if (scale.includes('DPS-PE')) matCost = 65;
    if (scale.includes('DPS-ME') || scale.includes('DPS-GE')) matCost = 120;
    const adminCost = 40;
    const totalBareme = personnelCost + vehicleCost + matCost + adminCost;

    return {
      ratePerHour,
      personnelCost,
      vehicleCost,
      matCost,
      adminCost,
      totalBareme
    };
  }

  updateDevisScale(devisId, scaleType) {
    const devis = this.devis.find(d => d.id === devisId);
    if (!devis) return;

    devis.configuredScale = scaleType;
    if (scaleType === 'PAPS') {
      devis.configuredVolunteers = 2;
      devis.configuredVehicles = [];
    } else if (scaleType === 'DPS-PE') {
      devis.configuredVolunteers = Math.max(4, Math.min(6, devis.configuredVolunteers || 4));
      if (!devis.configuredVehicles || devis.configuredVehicles.length === 0) devis.configuredVehicles = ['VPSP'];
    } else if (scaleType === 'DPS-ME') {
      devis.configuredVolunteers = Math.max(8, Math.min(12, devis.configuredVolunteers || 8));
      devis.configuredVehicles = ['VPSP', 'VPSP'];
    } else if (scaleType === 'DPS-GE') {
      devis.configuredVolunteers = Math.max(14, devis.configuredVolunteers || 14);
      devis.configuredVehicles = ['VPSP', 'VPSP', 'VTU'];
    }

    const b = this.calculateDynamicBareme(devis);
    devis.proposedPrice = b.totalBareme;
    this.openModule('devis', true);
  }

  adjustDevisVolunteers(devisId, delta) {
    const devis = this.devis.find(d => d.id === devisId);
    if (!devis) return;

    const current = devis.configuredVolunteers || 4;
    devis.configuredVolunteers = Math.max(2, Math.min(36, current + delta));
    const b = this.calculateDynamicBareme(devis);
    devis.proposedPrice = b.totalBareme;
    this.openModule('devis', true);
  }

  updateDevisVehicles(devisId, vehOption) {
    const devis = this.devis.find(d => d.id === devisId);
    if (!devis) return;

    if (vehOption === 'none') devis.configuredVehicles = [];
    else if (vehOption === 'vpsp1') devis.configuredVehicles = ['VPSP'];
    else if (vehOption === 'vpsp2') devis.configuredVehicles = ['VPSP', 'VPSP'];
    else if (vehOption === 'vpsp_vtu') devis.configuredVehicles = ['VPSP', 'VTU'];

    const b = this.calculateDynamicBareme(devis);
    devis.proposedPrice = b.totalBareme;
    this.openModule('devis', true);
  }

  previewDevisPrice(devisId, enteredValue) {
    const devis = this.devis.find(d => d.id === devisId);
    if (!devis) return;

    const price = Math.max(0, parseFloat(enteredValue) || 0);
    devis.proposedPrice = price;

    const dynamicBareme = this.calculateDynamicBareme(devis);
    const bareme = dynamicBareme.totalBareme;
    const ratio = bareme > 0 ? (price / bareme) : 1;

    const previewEl = document.getElementById(`devis-feedback-${devisId}`);
    if (!previewEl) return;

    let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    let text = '';
    let acceptRate = '';

    if (ratio <= 0.85) {
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      text = 'Tarif très compétitif';
      acceptRate = 'Très forte chance de remporter face à la concurrence (~85%)';
    } else if (ratio <= 1.05) {
      badgeClass = 'bg-blue-100 text-pc-blue border-blue-200';
      text = 'Tarif conforme au barème';
      acceptRate = 'Concurrence active (Croix-Rouge, Ordre de Malte) : gain probable (~65%)';
    } else if (ratio <= 1.25) {
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
      text = 'Tarif supérieur au barème';
      acceptRate = 'Risque de perdre face aux offres concurrentes (~40%)';
    } else {
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
      text = 'Tarif excessif';
      acceptRate = 'Rejet très probable par l’organisateur (<15%)';
    }

    const pctDiff = Math.round((ratio - 1) * 100);
    const sign = pctDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`;

    previewEl.innerHTML = `
      <div class="p-2.5 rounded-xl border text-xs flex items-center justify-between ${badgeClass}">
        <div>
          <span class="font-extrabold block">${text} (${sign} par rapport au dimensionnement)</span>
          <span class="text-[11px] opacity-90">${acceptRate}</span>
        </div>
        <span class="font-mono font-bold text-xs">${price} €</span>
      </div>
    `;
  }

  submitCustomDevis(devisId) {
    const devis = this.devis.find(d => d.id === devisId);
    if (!devis) return;

    const input = document.getElementById(`devis-price-input-${devisId}`);
    const price = input ? parseFloat(input.value) : (devis.proposedPrice || 250);

    if (isNaN(price) || price <= 0) {
      this.showToast('Montant invalide', 'Veuillez saisir un tarif valide en euros.', 'orange');
      return;
    }

    devis.proposedPrice = price;
    devis.status = 'sent';

    this.showToast('Devis transmis', `Offre de ${price} € envoyée à l’organisateur. Commission de sécurité et étude des offres concurrentes...`, 'blue');
    this.openModule('devis', true);

    setTimeout(() => {
      const dynamicBareme = this.calculateDynamicBareme(devis);
      const bareme = dynamicBareme.totalBareme;
      const ratio = price / bareme;

      // 1. CONTRÔLE DE SÉCURITÉ ET CONFORMITÉ (RNMSC)
      // Extraction de l'affluence numérique (ex: "3 200 personnes" -> 3200)
      const numMatch = (devis.publicCount || '').match(/\d[\d\s]*/);
      const publicEst = numMatch ? parseInt(numMatch[0].replace(/\s/g, ''), 10) : 1000;
      const vols = devis.configuredVolunteers || devis.requiredVolunteers || 4;
      const vehs = devis.configuredVehicles || [];

      // A. Rejet pour sous-dimensionnement manifeste
      if (publicEst >= 3000 && vols < 4) {
        devis.status = 'rejected_security';
        this.showToast('Refus Préfectoral & Organisateur', `Offre rejetée : Dispositif très sous-dimensionné (${vols} secouristes pour ${devis.publicCount}). La commission de sécurité exige un dispositif renforcé.`, 'orange');
        this.updateStatsUI();
        this.saveGame();
        return;
      }
      if (publicEst >= 1500 && vols < 3 && vehs.length === 0) {
        devis.status = 'rejected_security';
        this.showToast('Sous-dimensionnement', `Offre rejetée : Un simple PAPS à pied (${vols} secouristes) est insuffisant pour encadrer ${devis.publicCount}. Une ambulance VPSP est requise.`, 'orange');
        this.updateStatsUI();
        this.saveGame();
        return;
      }

      // B. Rejet pour sur-dimensionnement absurde
      if (publicEst <= 350 && vols >= 12 && price > 1200) {
        devis.status = 'rejected_budget';
        this.showToast('Offre Disproportionnée', `L'organisateur refuse l'offre : Dispositif sur-dimensionné (${vols} secouristes) et tarif hors budget pour un modeste rassemblement.`, 'orange');
        this.updateStatsUI();
        this.saveGame();
        return;
      }

      // 2. CONCURRENCE DES AUTRES ASSOCIATIONS (Croix-Rouge, Ordre de Malte, etc.)
      const competitors = ['la Croix-Rouge française', 'l’Ordre de Malte France', 'la Fédération Française de Sauvetage et de Secourisme (FFSS)'];
      const rival = competitors[Math.floor(Math.random() * competitors.length)];

      const repBonus = Math.min(0.20, ((this.resources.reputationScore || 50) / 500) * 0.15);
      
      // Facteur de concurrence : même dans la moyenne, il y a de la compétition !
      let winProb = 0.62 + repBonus;
      if (ratio <= 0.85) winProb += 0.20; // Tarif très avantageux
      else if (ratio <= 1.05) winProb += 0.05; // Dans la moyenne
      else if (ratio <= 1.25) winProb -= 0.20; // Plus cher
      else winProb -= 0.45; // Nettement plus cher

      winProb = Math.max(0.10, Math.min(0.92, winProb));

      const isWon = Math.random() <= winProb;

      if (isWon) {
        devis.status = 'signed';
        this.convertDevisToScheduledMission(devis);
        this.resources.reputationScore = (this.resources.reputationScore || 50) + 12;
        this.showToast('Convention Signée !', `L’organisateur de « ${devis.eventName} » a retenu votre proposition face à ${rival} !`, 'green');
      } else {
        devis.status = 'rejected_competition';
        this.showToast('Offre Non Retenue', `L’organisateur a préféré l’offre concurrente de ${rival} (meilleur compromis). Continuez la prospection !`, 'orange');
      }

      this.updateStatsUI();
      this.saveGame();
    }, 3200);
  }

  convertDevisToScheduledMission(devis) {
    const volsCount = devis.configuredVolunteers || devis.requiredVolunteers || 4;
    const scaleChosen = devis.configuredScale || devis.scale || 'DPS-PE';
    const vehsChosen = (devis.configuredVehicles !== undefined) ? devis.configuredVehicles : devis.requiredVehicles;

    const newMission = {
      id: `m-plan-${Date.now()}`,
      type: 'dps',
      categoryLabel: 'DPS - Dispositif Prévu au Calendrier',
      title: devis.eventName,
      desc: `Couverture sanitaire pour ${devis.publicCount}. ${scaleChosen}.`,
      lat: devis.lat,
      lng: devis.lng,
      scale: scaleChosen,
      eventDate: devis.eventDate,
      durationHours: devis.durationHours,
      startHour: devis.eventDate.startHour || devis.eventDate.hour,
      endHour: devis.eventDate.endHour || ((devis.eventDate.hour + devis.durationHours) % 24),
      duration: devis.durationHours * 10,
      durationSeconds: Math.round(devis.durationHours * 3600),
      requiredVolunteers: volsCount,
      requiredRanks: devis.requiredRanks || ['PSE1', 'PSE2'],
      requiredVehicles: vehsChosen || [],
      rewardMoney: devis.proposedPrice,
      rewardReputation: 25,
      // Critères cachés de conformité
      hiddenMinVolunteers: devis.hiddenMinVolunteers || volsCount,
      hiddenRequiredSkills: devis.hiddenRequiredSkills || devis.requiredRanks || [],
      consumableCost: devis.consumableCost || 30,
      clientName: devis.clientName,
      clientType: devis.clientType,
      progress: 0,
      status: 'planifie',
      registeredVolunteers: [],
      assignedCrew: { volunteers: [], vehicles: [] }
    };

    this.missions.push(newMission);
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();
    this.checkVolunteerRegistrations(newMission);
  }

  checkVolunteerRegistrations(mission) {
    if (mission.status !== 'planifie') return;

    this.volunteers.forEach(vol => {
      if (mission.registeredVolunteers.includes(vol.id)) return;
      if (mission.registeredVolunteers.length >= mission.requiredVolunteers) return;

      if (window.ProtecPersonnel) {
        const dispoCheck = window.ProtecPersonnel.calculateAvailability(vol, this, mission);
        if (!dispoCheck.available) return;
      } else {
        const isAvailableThisDay = vol.dispoJours?.includes(mission.eventDate?.dayName);
        if (!isAvailableThisDay && Math.random() > 0.15) return;
      }

      const chance = (vol.motivation || 70) / 100;
      if (Math.random() < chance) {
        mission.registeredVolunteers.push(vol.id);
      }
    });

    this.renderMissions();
    this.updateStatsUI();
  }

  relanceVolunteers(missionId) {
    this.launchSmsMobilization(missionId);
  }

  launchSmsMobilization(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    if (mission.smsCampaignActive) {
      this.showToast('Diffusion SMS en cours', 'Une mobilisation SMS est déjà active. Les réponses des secouristes arrivent...', 'blue');
      return;
    }

    const unassignedVols = this.volunteers.filter(v => 
      !mission.registeredVolunteers.includes(v.id) &&
      v.status !== 'mission' &&
      !v.isBurnout
    );

    if (unassignedVols.length === 0) {
      this.showToast('Aucun bénévole disponible', 'Tous vos personnels sont déjà engagés ou en repos.', 'orange');
      return;
    }

    mission.smsCampaignActive = true;
    mission.relancesCount = (mission.relancesCount || 0) + 1;

    const urgencyTag = (mission.status === 'prealerte' || mission.status === 'declenche') ? 'Alerte Urgence' : 'Poste DPS';
    this.showToast('Diffusion SMS Lancée', `📱 Message d'alerte [${urgencyTag}] envoyé à ${unassignedVols.length} secouriste(s). Réponses en attente...`, 'blue');

    let pendingResponses = unassignedVols.length;

    unassignedVols.forEach((vol) => {
      // 1. CALCUL DU TAUX DE CHANCE DE RÉPONSE FAVORABLE (Motivation, Énergie/Fatigue, Humeur, Statut)
      const motivation = vol.motivation !== undefined ? vol.motivation : 70;
      const energy = vol.energy !== undefined ? vol.energy : 80;
      const humeur = vol.humeur !== undefined ? vol.humeur : 70;

      let proba = 0.20 + (motivation * 0.35 / 100) + (humeur * 0.25 / 100);

      // Pénalité importante si fatigue / manque d'énergie
      if (energy < 35) proba -= 0.40;
      else if (energy < 60) proba -= 0.15;

      // Traits de caractère
      if (vol.trait === 'devoue') proba += 0.20;
      if (vol.trait === 'casanier') proba -= 0.20;
      if (vol.trait === 'ambitieux') proba += 0.10;

      // Les salariés permanents ont une disponibilité contractuelle plus forte
      if (vol.contractType === 'salarie') proba += 0.30;

      // Borne de probabilité réaliste (entre 8% et 94%)
      proba = Math.max(0.08, Math.min(0.94, proba));

      // 2. CALCUL DU DÉLAI DE RÉPONSE INDIVIDUEL (Temps réaliste entre 4 et 26 secondes)
      const baseSec = 4 + Math.random() * 14;
      const delaySec = Math.max(3, Math.min(30, baseSec + ((100 - motivation) * 0.12) + ((100 - energy) * 0.08)));
      const delayMs = Math.round(delaySec * 1000 / Math.max(1, this.speed || 1));

      // 3. PROGRAMMATION EN ARRIÈRE-PLAN DU RETOUR SMS
      setTimeout(() => {
        pendingResponses--;
        if (pendingResponses <= 0) {
          mission.smsCampaignActive = false;
        }

        const currentMission = this.missions.find(m => m.id === missionId);
        if (!currentMission) return;
        if (['completed', 'canceled_favorable'].includes(currentMission.status)) return;

        const isFull = currentMission.registeredVolunteers.length >= currentMission.requiredVolunteers;
        const willAccept = !isFull && (Math.random() <= proba);

        if (willAccept) {
          currentMission.registeredVolunteers.push(vol.id);
          this.showToast('📱 SMS Reçu : DISPO !', `${vol.name} (${vol.rank}) : « Présent ! Je me rends disponible. »`, 'green');
        } else if (!isFull) {
          if (Math.random() < 0.45) {
            const reasons = ['Obligation pro', 'Contrainte familiale', 'Pas dispo ce soir', 'Besoin de repos'];
            const r = reasons[Math.floor(Math.random() * reasons.length)];
            this.showToast('📱 SMS Reçu : Non dispo', `${vol.name} : « Désolé, impossible (${r}) »`, 'slate');
          }
        }

        this.saveGame();
        this.renderMissions();
        this.updateStatsUI();

        if (this.selectedMissionId === currentMission.id) {
          this.openMissionDetails(currentMission.id);
        }
      }, delayMs);
    });

    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();
    this.openMissionDetails(mission.id);
  }

  // --- CONVENTION PARTENAIRE RÉSEAU FERRÉ SNCF (ASSISTANCE & CHU) ---
  signSncfConvention() {
    if (this.volunteers.length < 3 || this.vehicles.length < 1) {
      this.showToast('Critères Non Atteints', 'Pour signer la Convention SNCF, votre antenne doit disposer d’au moins 3 secouristes et 1 véhicule (VPSP ou VTU/VL).', 'orange');
      return;
    }

    this.sncfConvention = {
      signed: true,
      signedAt: Date.now(),
      totalInterventions: 0
    };

    this.resources.money += 400; // Dotation initiale de conventionnement
    this.resources.reputationScore += 25;
    this.showToast('Convention SNCF Signée !', 'Partenariat d’assistance voyageurs et CHU en gare activé (+400 € de dotation de conventionnement).', 'green');
    this.saveGame();
    this.updateStatsUI();
    this.openModule('devis', true);
  }

  terminateSncfConvention() {
    this.sncfConvention = { signed: false, signedAt: null, totalInterventions: 0 };
    this.showToast('Convention SNCF Résiliée', 'La convention avec la SNCF a été suspendue.', 'slate');
    this.saveGame();
    this.updateStatsUI();
    this.openModule('devis', true);
  }

  triggerSncfPrealert() {
    if (!this.sncfConvention || !this.sncfConvention.signed) return;

    const activeSncf = this.missions.find(m => m.alertOrigin === 'sncf' && ['prealerte', 'declenche', 'ongoing'].includes(m.status));
    if (activeSncf) return;

    const base = this.stations[0] || { lat: 48.8566, lng: 2.3522, name: 'Antenne' };
    const sncfCoords = this.calculateRealisticMissionLocation(base, 'sncf');

    const sncfScenarios = [
      {
        title: 'Incident Réseau SNCF : TGV Bloqué en Pleine Voie & Montage CHU en Gare',
        desc: 'Rupture de caténaire suite à de violents coups de vent. Le TGV 6742 est immobilisé en pleine voie avec 640 passagers sans électricité. La direction de crise SNCF sollicite la Protection Civile pour pré-alerte et montage possible d’un Centre d’Hébergement d’Urgence (CHU 40 lits) et distribution d’eau en gare.',
        reqVol: 4,
        vehs: ['VTU', 'VPSP'],
        reward: 480
      },
      {
        title: 'Panne Motrice SNCF : Prise en Charge Voyageurs & Ravitaillement CHU',
        desc: 'Panne de motrice sur axe principal. 450 voyageurs bloqués sur le quai en soirée hivernale. Réquisition SNCF pour ravitaillement alimentaire d’urgence, couvertures isothermes et mise en place de lits de camp CHU.',
        reqVol: 3,
        vehs: ['VTU'],
        reward: 420
      },
      {
        title: 'Alerte Bagage Abandonné : Évacuation Hall de Gare & Prise en Charge',
        desc: 'Colis suspect découvert en gare centrale. Périmètre de sécurité de 100m déployé par les démineurs. La SNCF demande l’assistance de la Protection Civile pour l’accueil et le réconfort des voyageurs déroutés.',
        reqVol: 3,
        vehs: ['VTU'],
        reward: 390
      },
      {
        title: 'Canicule Réseau TER : Distribution Massive d’Eau & Malaises Quai',
        desc: 'Climatisation en panne sur 3 rames consécutives avec 38°C en gare. Déploiement d’un poste de secours avancé sur quai et distribution de 500 bouteilles d’eau fraîches.',
        reqVol: 4,
        vehs: ['VPSP', 'VTU'],
        reward: 450
      },
      {
        title: 'Accident Grave de Voyageur : Soutien Psychologique & Tri d’Urgence',
        desc: 'Choc émotionnel violent chez plusieurs dizaines de témoins suite à un accident de personne sur la voie 2. La SNCF active la convention d’aide aux victimes et soutien psychologique d’urgence.',
        reqVol: 4,
        vehs: ['VPSP'],
        reward: 510
      }
    ];

    const pick = sncfScenarios[Math.floor(Math.random() * sncfScenarios.length)];

    const newSncfMission = {
      id: `m-sncf-${Date.now()}`,
      type: 'crise',
      categoryLabel: 'Convention SNCF - Assistance Voyageurs & CHU',
      title: `[Préalerte] ${pick.title}`,
      desc: `🟡 PRÉALERTE SNCF (Convention Partenaire) : ${pick.desc} Aucun effectif n'est pré-engagé d'avance. Lancez immédiatement la mobilisation par SMS pour recenser les secouristes disponibles.`,
      lat: sncfCoords.lat,
      lng: sncfCoords.lng,
      scale: `Dispositif CHU SNCF (${pick.reqVol} secouristes)`,
      eventDate: { ...this.clock, hour: this.clock.hour },
      durationSeconds: 40 * 60,
      durationHours: 0.7,
      requiredVolunteers: pick.reqVol,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: pick.vehs,
      rewardMoney: pick.reward,
      rewardReputation: 35,
      progress: 0,
      status: 'prealerte',
      alertOrigin: 'sncf',
      prealertSecondsLeft: 60,
      prealertTotalSec: 60,
      evolutionResolved: false,
      registeredVolunteers: [],
      assignedCrew: { volunteers: [], vehicles: [] }
    };

    this.enrichMissionLocationWithCity(newSncfMission);
    this.missions.push(newSncfMission);
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'weather',
        `🟡 PRÉALERTE CONVENTION SNCF`,
        `Incident ferroviaire : ${pick.title}. Mobilisation des effectifs et montage CHU demandés par la SNCF !`,
        `sncf-${newSncfMission.id}`
      );
    } else if (window.ProtecIncidents) {
      window.ProtecIncidents.sendSystemNotification(
        `🟡 PRÉALERTE SNCF RÉSEAU FERRÉ`,
        `Incident ferroviaire en cours. Mise en veille et recensement effectifs CHU demandés par la SNCF.`,
        `sncf-${newSncfMission.id}`
      );
    }
    game.showToast('Préalerte SNCF', `Incident ferroviaire : ${pick.title} ! Mobilisez votre personnel par SMS.`, 'orange');
  }

  // --- GESTION DES ÉVOLUTIONS DES PRÉALERTES (FAVORABLE VS AGGRAVATION) ---
  resolvePrealertFavorable(mission) {
    mission.status = 'canceled_favorable';
    this.resources.money += 120; // Indemnité de veille républicaine
    this.resources.reputationScore += 10;

    // Libérer les personnels qui s'étaient mobilisés
    (mission.registeredVolunteers || []).forEach(id => {
      const v = this.volunteers.find(vol => vol.id === id);
      if (v) v.status = 'dispo';
    });

    const originName = mission.alertOrigin === 'sncf' ? 'la SNCF' : 'la Préfecture';
    this.showToast('🟢 Préalerte Levée !', `Amélioration confirmée ! ${originName} lève le dispositif de veille. Merci pour votre réactivité (+120 € d’indemnité de veille, +10 réputation).`, 'green');

    // Retrait de la mission après un bref délai pour laisser lire
    setTimeout(() => {
      const idx = this.missions.findIndex(m => m.id === mission.id);
      if (idx !== -1) {
        this.missions.splice(idx, 1);
        this.renderMissions();
        this.updateStatsUI();
        this.saveGame();
      }
    }, 4500);

    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();
    if (this.selectedMissionId === mission.id) {
      this.closeDrawer();
    }
  }

  resolvePrealertAggravation(mission) {
    mission.status = 'declenche';
    mission.title = mission.title.replace('[Préalerte] ', '[ALERTE ACTIVE] ');
    const originName = mission.alertOrigin === 'sncf' ? 'la SNCF' : 'la Préfecture';

    if (window.ProtecIncidents) {
      window.ProtecIncidents.sendSystemNotification(
        `🚨 PASSAGE EN ALERTE ACTIVE !`,
        `Aggravation confirmée ! ${originName} ordonne le déploiement immédiat pour : ${mission.title}.`,
        `alert-${mission.id}`
      );
    }

    this.showToast('🔴 ALERTE DÉCLENCHÉE !', `Aggravation confirmée ! ${originName} ordonne le déploiement immédiat sur zone !`, 'red');

    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();

    if (this.selectedMissionId === mission.id) {
      this.openMissionDetails(mission.id);
    }
  }

  generateStarterCandidatures() {
    this.candidatures = [
      {
        id: `cand-${Date.now()}-1`,
        name: 'Mathieu Garnier',
        age: 22,
        job: 'Étudiant en Droit',
        motivation: 'Je souhaite m’engager pour me former aux gestes d’urgence et aider ma ville.',
        dispoJours: ['Samedi', 'Dimanche'],
        dispoType: 'étudiant',
        avatar: '🙋‍♂️',
        rank: 'Stagiaire',
        role: 'Bénévole Stagiaire',
        skills: ['PSC1'],
        exp: 5,
        isTrainer: false
      },
      {
        id: `cand-${Date.now()}-2`,
        name: 'Julie Rousseau',
        age: 31,
        job: 'Infirmière libérale',
        motivation: 'Titulaire AFGSU et PSE2, je veux rejoindre les équipes de secours pour apporter mon soutien sur le terrain.',
        dispoJours: ['Vendredi', 'Samedi', 'Dimanche'],
        dispoType: 'salarié',
        avatar: '👩‍⚕️',
        rank: 'PSE2',
        role: 'Équipier Secouriste',
        skills: ['PSE2', 'AFGSU', 'formateur'],
        exp: 50,
        isTrainer: true
      }
    ];
  }

  toggleCampaign(campaignType) {
    const costWeekly = campaignType === 'social' ? 150 : 200;

    if (!this.resources.campaigns[campaignType]) {
      if (this.resources.money < costWeekly) {
        this.showToast('Fonds insuffisants', `La campagne requiert ${costWeekly} €.`, 'orange');
        return;
      }
      this.resources.money -= costWeekly;
      this.resources.campaigns[campaignType] = true;
      this.showToast('Campagne lancée', `Campagne de communication activée.`, 'green');
    } else {
      this.resources.campaigns[campaignType] = false;
      this.showToast('Campagne suspendue', 'Campagne arrêtée.', 'blue');
    }

    this.updateStatsUI();
    this.saveGame();
    this.openModule('recrutement');
  }

  acceptCandidature(candId, stationId) {
    const cand = this.candidatures.find(c => c.id === candId);
    if (!cand) return;

    if (cand.type === 'salarie' && window.ProtecPersonnel) {
      window.ProtecPersonnel.hireCandidateFromInterview(this, candId);
      return;
    }

    this.candidatures = this.candidatures.filter(c => c.id !== candId);

    const initialRank = cand.rank || (cand.skills?.includes('PSE2') ? 'PSE2' : (cand.skills?.includes('PSE1') ? 'PSE1' : 'Stagiaire'));
    const initialRole = cand.role || (initialRank === 'CE' ? 'Chef d’Équipe' : (initialRank === 'PSE2' ? 'Équipier Secouriste' : (initialRank === 'PSE1' ? 'Secouriste' : 'Bénévole Stagiaire')));
    const initialExp = cand.exp !== undefined ? cand.exp : (initialRank === 'CE' ? 80 : (initialRank === 'PSE2' ? 45 : (initialRank === 'PSE1' ? 20 : 0)));

    const newVol = {
      id: `vol-${Date.now()}`,
      name: cand.name,
      role: initialRole,
      rank: initialRank,
      exp: initialExp,
      contractType: 'benevole',
      status: 'dispo',
      stationId: stationId || this.stations[0]?.id,
      isTrainer: !!cand.isTrainer,
      avatar: cand.avatar || '🙋',
      dispoType: cand.dispoType || 'bénévole',
      dispoJours: cand.dispoJours || ['Samedi', 'Dimanche'],
      motivation: cand.motivationGrade ? Math.min(100, parseInt(cand.motivationGrade) * 5) : (cand.motivationScore || 85),
      skills: cand.skills || [initialRank],
      energy: 90,
      humeur: 85
    };

    this.volunteers.push(newVol);
    this.closeModal();
    this.updateStatsUI();
    this.saveGame();
    this.showToast('Bénévole Intégré !', `${cand.name} (${initialRank}${cand.isTrainer ? ' • Formateur' : ''}) a signé sa charte d'engagement bénévole !`, 'green');
    this.openModule('recrutement');
  }

  rejectCandidature(candId) {
    this.candidatures = this.candidatures.filter(c => c.id !== candId);
    this.closeModal();
    this.updateStatsUI();
    this.saveGame();
    this.openModule('recrutement');
  }

  launchScheduledMission(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    // Vérification stricte des Agréments de Sécurité Civile officiels
    if (this.resources.agrements) {
      if (mission.type === 'samu' && !this.resources.agrements.A) {
        this.showToast('Agrément Manquant', 'L’Agrément A (SAMU 15) est obligatoire pour les départs réflexes ! Obtenez-le dans le pôle Recrutement.', 'orange');
        return;
      }
      if (mission.type === 'social' && !this.resources.agrements.B) {
        this.showToast('Agrément Manquant', 'L’Agrément B (Action Sociale) est obligatoire pour les maraudes ! Obtenez-le dans le pôle Recrutement.', 'orange');
        return;
      }
      if (mission.type === 'crise' && !this.resources.agrements.C) {
        this.showToast('Agrément Manquant', 'L’Agrément C (Soutien Sinistrés / NOVI) est requis pour les catastrophes ! Obtenez-le dans le pôle Recrutement.', 'orange');
        return;
      }
      if (mission.type === 'dps' && !this.resources.agrements.D) {
        this.showToast('Agrément Manquant', 'L’Agrément D (Dispositifs de Secours) est requis pour les DPS ! Obtenez-le dans le pôle Recrutement.', 'orange');
        return;
      }
    }

    // Cas spécifique des interventions pompiers (Garde SDIS)
    if (mission.type === 'pompiers') {
      if (this.sdisGarde && this.sdisGarde.active) {
        // Remplir l'équipage avec la garde caserne postée
        const caserneIds = this.sdisGarde.caserneCrew || [];
        if (caserneIds.length > 0 && mission.registeredVolunteers.length === 0) {
          mission.registeredVolunteers = [...caserneIds];
        }
      }
    }

    if (mission.registeredVolunteers.length < mission.requiredVolunteers) {
      this.showToast('Effectif incomplet', `Il manque encore ${mission.requiredVolunteers - mission.registeredVolunteers.length} secouriste(s). Pensez à demander un renfort d'alliance ou rappeler votre astreinte !`, 'orange');
      return;
    }

    // Contrôle des compétences exigées (CE / PSE2)
    const requiredRanks = mission.requiredRanks || [];
    const crewVols = mission.registeredVolunteers.map(vid => this.volunteers.find(v => v.id === vid)).filter(Boolean);
    const hasRequiredSkills = requiredRanks.every(rankReq => crewVols.some(v => v.rank === rankReq || (rankReq === 'PSE1' && ['PSE2', 'CE', 'CD', 'Cadre'].includes(v.rank))));
    
    if (!hasRequiredSkills && mission.type === 'pompiers') {
      this.applyPrefectureSanction('Équipage déployé sans les qualifications obligatoires (Absence de Chef d’Équipe ou PSE)', 12);
    }

    const crew = [];
    mission.registeredVolunteers.forEach(vid => {
      const v = this.volunteers.find(vol => vol.id === vid);
      if (v) {
        v.status = 'mission';
        // Impact fatigue & moral
        v.energy = Math.max(10, (v.energy || 90) - 20);
        crew.push(v);
      }
    });

    const assignedVehicles = [];
    if (mission.requiredVehicles.length > 0) {
      // Pour les pompiers, privilégier le VPSP armé en caserne
      let dispoVeh = null;
      if (mission.type === 'pompiers' && this.sdisGarde && this.sdisGarde.vehicleId) {
        dispoVeh = this.vehicles.find(v => v.id === this.sdisGarde.vehicleId);
      }
      if (!dispoVeh) {
        dispoVeh = this.vehicles.find(veh => (veh.status === 'dispo' || veh.status === 'sdis_caserne') && mission.requiredVehicles.includes(veh.type));
      }

      if (dispoVeh) {
        dispoVeh.status = 'mission';
        dispoVeh.fuel = Math.max(10, (dispoVeh.fuel || 90) - 12);
        assignedVehicles.push(dispoVeh);
      }
    }

    mission.status = 'ongoing';
    mission.startedAt = Date.now();
    if (!mission.durationSeconds) {
      if (mission.type === 'samu') mission.durationSeconds = 25 * 60; // 25 min réelles
      else if (mission.type === 'social') mission.durationSeconds = 2 * 3600; // 2h réelles
      else if (mission.durationHours) mission.durationSeconds = Math.round(mission.durationHours * 3600);
      else mission.durationSeconds = 1800;
    }
    mission.endsAt = mission.startedAt + (mission.durationSeconds * 1000);
    mission.progress = 0;
    mission.assignedCrew = {
      volunteers: crew,
      vehicles: assignedVehicles
    };

    // Trajets routiers animés avec gyrophares pour tous les véhicules affectés
    if (assignedVehicles.length > 0 && window.ProtecSystems) {
      assignedVehicles.forEach((veh, idx) => {
        const station = this.stations.find(s => s.id === veh.stationId) || this.stations[0];
        const origin = { lat: station.lat, lng: station.lng };
        const dest = { lat: mission.lat, lng: mission.lng };
        setTimeout(() => {
          window.ProtecSystems.startTransit(this, veh, origin, dest, mission, 2, () => {
            // Arrivé sur place
          });
        }, idx * 750);
      });
    }

    this.renderStations();
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    this.showToast('Départ en Mission', `Le dispositif « ${mission.title} » est déployé sur les lieux !`, 'blue');
    this.openMissionDetails(mission.id);
  }

  completeMission(mission) {
    mission.status = 'completed';

    const hoursDone = Math.max(2, Math.round(mission.duration / 10));
    if (this.grants) {
      this.grants.totalVolunteerHours = (this.grants.totalVolunteerHours || 0) + (hoursDone * (mission.assignedCrew?.volunteers?.length || 2));
    }

    const crew = mission.assignedCrew?.volunteers || [];
    const vehicles = mission.assignedCrew?.vehicles || [];

    // 1. ÉVALUATION CACHÉE SPÉCIFIQUE DES DPS ÉVÉNEMENTIELS
    if (mission.type === 'dps') {
      const minReq = mission.hiddenMinVolunteers || mission.requiredVolunteers || 2;
      const hasLeader = crew.some(v => ['CE', 'CD', 'Cadre'].includes(v.rank));
      const isUnderstaffed = crew.length < minReq;
      const isUnderqualified = (mission.scale?.includes('ME') || mission.scale?.includes('GE') || minReq >= 5) && !hasLeader;

      // Déduction du coût des consommables pour l'antenne (pansements, compresses, O2)
      const consumableCost = mission.consumableCost || (mission.scale?.includes('ME') ? 60 : 25);
      this.resources.money = Math.max(0, this.resources.money - consumableCost);

      if (isUnderstaffed || isUnderqualified) {
        // Catastrophe opérationnelle !
        const repLoss = 18;
        this.resources.reputationScore = Math.max(0, (this.resources.reputationScore || 50) - repLoss);

        // Baisse sévère de motivation des secouristes présents
        crew.forEach(v => {
          v.motivation = Math.max(10, (v.motivation || 70) - 30);
          v.humeur = Math.max(10, (v.humeur || 70) - 32);
        });

        // Risque de démission d'un bénévole dégoûté par le sous-effectif
        const disgusted = crew.find(v => v.motivation < 35 && v.contractType === 'benevole');
        if (disgusted) {
          this.volunteers = this.volunteers.filter(v => v.id !== disgusted.id);
          this.showToast('Démission d’un Bénévole', `${disgusted.name} a démissionné de la Protection Civile, épuisé(e) et dégoûté(e) du sous-dimensionnement sur « ${mission.title} ».`, 'red');
        }

        this.showToast(
          'Catastrophe sur le DPS !',
          `Dispositif sous-dimensionné (${crew.length}/${minReq} requis) ou sans encadrement sur « ${mission.title} » ! Secouristes débordés, organisateur furieux et réputation en baisse (-${repLoss} pts).`,
          'red'
        );
      } else {
        // Succès éclatant : Gain de réputation progressif et dégressif (plus la réputation est haute, moins elle monte vite)
        const currentRep = this.resources.reputationScore || 0;
        const repGain = Math.max(2, Math.round(18 * (1 - (currentRep / 2200))));
        this.resources.reputationScore = currentRep + repGain;

        // Bénévoles fiers et motivés
        crew.forEach(v => {
          v.motivation = Math.min(100, (v.motivation || 75) + 6);
          v.humeur = Math.min(100, (v.humeur || 75) + 6);
        });

        this.showToast(
          'Bilan Organisateur : Parfait !',
          `L’organisateur de « ${mission.title} » est comblé par le professionnalisme de vos secouristes (+${repGain} popularité, -${consumableCost} € consommables).`,
          'green'
        );
      }
    } else {
      this.resources.reputationScore += mission.rewardReputation || 15;
      this.showToast('Dispositif terminé', `« ${mission.title} » clôturé (+${mission.rewardMoney} €) !`, 'green');
    }

    // 2. PRISE EN CHARGE DU PÔLE SOCIAL LORS D'UNE MARAUDE
    if (mission.type === 'social' && window.ProtecSocial) {
      window.ProtecSocial.onMaraudeCompleted(this, 4);
    }

    // 3. RETOUR DES PERSONNELS ET FATIGUE
    crew.forEach(v => {
      if (mission.type === 'pompiers' && this.sdisGarde && this.sdisGarde.active && this.sdisGarde.caserneCrew.includes(v.id)) {
        v.status = 'sdis_caserne';
      } else if (v.contractType === 'salarie' && window.ProtecPersonnel) {
        // Enregistrement des heures au forfait mensuel et application du repos légal de 11h (Code du Travail)
        window.ProtecPersonnel.recordMissionForSalarie(v, mission, this);
      } else {
        v.status = 'dispo';
      }
      v.exp += 15;
      if (window.ProtecPersonnel) {
        const result = window.ProtecPersonnel.applyMissionExertion(v, mission);
        if (result && result.burnout) {
          this.showToast('Alerte Surmenage / Burnout', `${v.name} est épuisé(e) et placé(e) en repos obligatoire (30 min).`, 'red');
        }
      } else {
        v.energy = Math.max(10, (v.energy || 80) - 15);
      }
    });

    // 4. RETOUR DES VÉHICULES, RÉARMEMENT ET USURE SELON LE MORAL
    const avgMoral = crew.length > 0 ? (crew.reduce((sum, v) => sum + (v.motivation || 70), 0) / crew.length) : 70;
    vehicles.forEach(veh => {
      if (mission.type === 'pompiers' && this.sdisGarde && this.sdisGarde.active && veh.id === this.sdisGarde.vehicleId) {
        veh.status = 'sdis_caserne';
      } else {
        veh.status = 'dispo';
      }

      // Nécessite un réarmement de matériel avant de repartir
      veh.needsRearming = true;
      veh.fuel = Math.max(10, (veh.fuel || 90) - 15);

      // Usure mécanique : Des bénévoles en forme et motivés prennent plus soin du matériel
      const wearRate = avgMoral >= 80 ? 2 : (avgMoral < 50 ? 8 : 4);
      veh.mechanical = Math.max(10, (veh.mechanical || 95) - wearRate);

      if (avgMoral < 45 && Math.random() < 0.22) {
        veh.isBrokenDown = true;
        this.showToast('Panne Véhicule', `${veh.name} est tombé en panne mécanique suite à une mauvaise manipulation en mission ! Révision garage requise.`, 'red');
      }
    });

    // Consommation de matériel de secours
    if (window.ProtecSystems) {
      if (mission.type === 'samu' || mission.type === 'pompiers') window.ProtecSystems.consumeSupply(this, 'oxygenBottles', 1);
      else window.ProtecSystems.consumeSupply(this, 'woundKits', 1);
    }

    if (mission.type === 'pompiers' && this.prefectureState) {
      this.prefectureState.trustScore = Math.min(100, (this.prefectureState.trustScore || 85) + 3);
    }

    this.resources.money += mission.rewardMoney || 0;

    this.renderStations();
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    if (this.selectedMissionId === mission.id) {
      this.openMissionDetails(mission.id);
    }
  }

  openMissionDetails(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    this.selectedMissionId = missionId;
    const drawer = document.getElementById('context-drawer');
    const title = document.getElementById('drawer-title');
    const catBadge = document.getElementById('drawer-category-badge');
    const headerIcon = document.getElementById('drawer-header-icon');
    const body = document.getElementById('drawer-body');
    const footer = document.getElementById('drawer-footer');

    catBadge.textContent = mission.categoryLabel;
    title.textContent = mission.title;
    headerIcon.setAttribute('data-lucide', 'calendar');

    const registeredVols = this.volunteers.filter(v => mission.registeredVolunteers?.includes(v.id));
    const isComplete = registeredVols.length >= mission.requiredVolunteers;

    let progressPct = 0;
    let remainingTimeText = '';
    if (mission.status === 'ongoing') {
      const now = Date.now();
      const totalSec = mission.durationSeconds || (mission.duration * 60) || 1800;
      const elapsedSec = Math.max(0, Math.floor((now - (mission.startedAt || now)) / 1000));
      const remainingSec = Math.max(0, totalSec - elapsedSec);
      progressPct = Math.min(100, Math.round((elapsedSec / totalSec) * 100));

      const hrs = Math.floor(remainingSec / 3600);
      const mins = Math.floor((remainingSec % 3600) / 60);
      const secs = remainingSec % 60;
      remainingTimeText = hrs > 0 ? `${hrs}h ${mins.toString().padStart(2, '0')}m restantes` : `${mins}m ${secs.toString().padStart(2, '0')}s restantes`;
    }

    body.innerHTML = `
      <div class="space-y-4">
        <div class="p-3.5 rounded-2xl glass-card text-xs text-slate-700 leading-relaxed">
          ${mission.desc}
        </div>

        <div class="p-3.5 rounded-2xl glass-card-blue flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-pc-blue font-bold">
            <i data-lucide="clock" class="w-4 h-4"></i>
            <span>Date : <strong>${mission.eventDate ? this.formatFullDate(mission.eventDate) + ' à ' + mission.eventDate.hour + 'h00' : 'Aujourd’hui'}</strong></span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full font-extrabold ${isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${isComplete ? 'Complet' : `Manque ${mission.requiredVolunteers - registeredVols.length}`}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-2xl glass-card-emerald flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">€</div>
            <div>
              <div class="text-[10px] text-emerald-700 font-bold uppercase">Facturation Convention</div>
              <div class="text-sm font-extrabold text-emerald-800 mono-num">+${mission.rewardMoney} €</div>
            </div>
          </div>
          <div class="p-3 rounded-2xl glass-card-amber flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <i data-lucide="award" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="text-[10px] text-amber-700 font-bold uppercase">Réputation</div>
              <div class="text-sm font-extrabold text-amber-800 mono-num">+${mission.rewardReputation} pts</div>
            </div>
          </div>
        </div>

        ${mission.status === 'prealerte' ? `
          <div class="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="font-black text-xs flex items-center gap-1.5 text-amber-900">
                <i data-lucide="hourglass" class="w-4 h-4 text-amber-600 animate-spin"></i>
                VEILLE PRÉFECTORALE & PRÉALERTE ÉVOLUTIVE
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 mono-num animate-pulse">
                ⏳ ${mission.prealertSecondsLeft || 0}s restantes
              </span>
            </div>
            <p class="text-[11px] text-amber-800 leading-relaxed">
              <strong>Zéro secouriste pré-engagé d’avance.</strong> Diffusez immédiatement la mobilisation par SMS. Les réponses arriveront au fil des secondes selon l’humeur, la fatigue et les disponibilités réelles de chacun.
            </p>
            <div class="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
              <div class="bg-amber-500 h-full rounded-full transition-all duration-300" style="width: ${Math.round(((mission.prealertTotalSec - (mission.prealertSecondsLeft || 0)) / (mission.prealertTotalSec || 60)) * 100)}%"></div>
            </div>
          </div>
        ` : ''}

        ${mission.status === 'declenche' ? `
          <div class="p-4 rounded-2xl bg-red-50 border-2 border-red-400 text-red-950 space-y-2 shadow-sm animate-pulse">
            <div class="flex items-center justify-between">
              <span class="font-black text-xs flex items-center gap-1.5 text-red-900">
                <i data-lucide="siren" class="w-4 h-4 text-red-600"></i>
                ALERTE DÉCLENCHÉE - DÉPLOIEMENT IMMÉDIAT
              </span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-200 text-red-900">
                URGENT
              </span>
            </div>
            <p class="text-[11px] text-red-800 leading-relaxed">
              Aggravation confirmée ! La situation exige l’engagement de vos moyens sur le terrain. Complétez l’équipage et déclenchez le départ sans retard pour préserver la réputation de l’antenne.
            </p>
          </div>
        ` : ''}

        ${mission.status === 'ongoing' ? `
          ${mission.currentIncident ? `
            <div class="p-3.5 rounded-2xl bg-orange-50 border-2 border-pc-orange text-xs shadow-sm flex items-center justify-between gap-2 animate-pulse">
              <div class="flex items-center gap-2">
                <span class="text-lg">🚨</span>
                <div>
                  <div class="font-black text-orange-950">${mission.currentIncident.title}</div>
                  <div class="text-[10px] text-orange-800 font-semibold">Incident en cours ! Arbitrage requis</div>
                </div>
              </div>
              <button onclick="window.ProtecIncidents.openIncidentModal(window.game, window.game.missions.find(m => m.id === '${mission.id}'))" class="px-3 py-1.5 rounded-xl bg-pc-orange text-white text-xs font-black hover:bg-pc-orange-hover transition shadow">
                Décider
              </button>
            </div>
          ` : ''}

          <div class="p-4 rounded-2xl glass-card-blue space-y-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-pc-blue flex items-center gap-1.5">
                <i data-lucide="radio" class="w-3.5 h-3.5 text-pc-blue animate-pulse"></i>
                Dispositif actif sur le terrain
              </span>
              <span class="font-extrabold mono-num text-pc-blue">${remainingTimeText} (${progressPct}%)</span>
            </div>
            <div class="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden shimmer-bar">
              <div class="bg-gradient-to-r from-pc-blue to-pc-orange h-full rounded-full transition-all duration-300" style="width: ${progressPct}%"></div>
            </div>
            
            <button onclick="window.ProtecModals.openFicheBilan(window.game, '${mission.id}', '${mission.assignedCrew?.vehicles[0]?.id}')" class="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-pc-orange text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2">
              <i data-lucide="file-text" class="w-4 h-4"></i>
              Fiche Bilan Secouriste (Régulation SAMU 15)
            </button>
          </div>
        ` : `
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Effectifs Répondants (${registeredVols.length} / ${mission.requiredVolunteers})
              </h4>
              <div class="flex gap-2">
                <button onclick="window.game.requestAllianceRenfortForMission('${mission.id}')" class="text-xs font-extrabold text-indigo-600 hover:underline flex items-center gap-1" title="Faire appel aux autres joueurs et antennes alliées">
                  <i data-lucide="users" class="w-3.5 h-3.5"></i>
                  Renfort Alliance
                </button>
                <button onclick="window.game.launchSmsMobilization('${mission.id}')" class="text-xs font-extrabold text-pc-orange hover:underline flex items-center gap-1">
                  <i data-lucide="send" class="w-3.5 h-3.5"></i>
                  ${mission.smsCampaignActive ? 'Mobilisation en cours...' : 'Mobilisation SMS'}
                </button>
              </div>
            </div>

            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              ${registeredVols.length === 0 ? '<p class="text-xs text-amber-600 p-2.5 glass-card-amber rounded-xl">Aucun secouriste n’a encore validé sa disponibilité. Cliquez sur « Mobilisation SMS » pour sonder les effectifs disponibles.</p>' : ''}
              ${registeredVols.map(v => `
                <div class="p-2.5 rounded-xl glass-card flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-base">${v.avatar}</span>
                    <div>
                      <div class="font-bold text-slate-800">${v.name}</div>
                      <div class="text-[10px] text-slate-500">${v.dispoType} • Dispo : ${v.dispoJours.join(', ')}</div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-blue/10 text-pc-blue">${v.rank}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `}
      </div>
    `;

    if (mission.status === 'prealerte') {
      footer.innerHTML = `
        <button onclick="window.game.closeDrawer()" class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Fermer</button>
        <button onclick="window.game.launchSmsMobilization('${mission.id}')" class="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-pc-orange text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5" ${mission.smsCampaignActive ? 'disabled' : ''}>
          <i data-lucide="send" class="w-3.5 h-3.5"></i>
          ${mission.smsCampaignActive ? 'Diffusion SMS en cours...' : '📱 Mobilisation SMS'}
        </button>
        <button onclick="window.game.registerSalarieToMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1" title="Inscrire d'office un salarié permanent">
          <i data-lucide="briefcase" class="w-3.5 h-3.5"></i> + Salarié
        </button>
        <button onclick="window.game.requestAllianceRenfortForMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-pc-blue hover:bg-blue-100 transition flex items-center gap-1" title="Demander renforts aux antennes alliées">
          <i data-lucide="handshake" class="w-3.5 h-3.5"></i> Alliances
        </button>
      `;
    } else if (mission.status === 'declenche') {
      footer.innerHTML = `
        <button onclick="window.game.closeDrawer()" class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Fermer</button>
        <button onclick="window.game.launchSmsMobilization('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1">
          <i data-lucide="bell" class="w-3.5 h-3.5"></i> SMS
        </button>
        <button onclick="window.game.registerSalarieToMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1">
          <i data-lucide="briefcase" class="w-3.5 h-3.5"></i> + Salarié
        </button>
        ${isComplete ? `
          <button onclick="window.game.launchScheduledMission('${mission.id}')" class="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-pc-orange text-white shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5 animate-pulse">
            <i data-lucide="siren" class="w-4 h-4"></i>
            🚨 Engager & Partir
          </button>
        ` : `
          <div class="flex-1 px-3 py-2 rounded-xl text-center text-[10px] font-black bg-red-100 text-red-900 border border-red-300">
            Manque ${mission.requiredVolunteers - registeredVols.length} secouriste(s)
          </div>
        `}
      `;
    } else if (mission.status === 'planifie') {
      const isComplete = registeredVols.length >= mission.requiredVolunteers;
      footer.innerHTML = `
        <button onclick="window.game.closeDrawer()" class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Fermer</button>
        <button onclick="window.game.relanceVolunteers('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1" title="Relancer les bénévoles par message">
          <i data-lucide="bell" class="w-3.5 h-3.5"></i> SMS
        </button>
        <button onclick="window.game.registerSalarieToMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1" title="Inscrire d'office un salarié permanent">
          <i data-lucide="briefcase" class="w-3.5 h-3.5"></i> + Salarié
        </button>
        <button onclick="window.game.requestAllianceRenfortForMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-pc-blue hover:bg-blue-100 transition flex items-center gap-1" title="Demander renforts aux antennes alliées">
          <i data-lucide="handshake" class="w-3.5 h-3.5"></i> Alliances
        </button>
        ${isComplete ? `
          <button onclick="window.game.launchScheduledMission('${mission.id}')" class="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-lg shadow-pc-blue/20 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5">
            <i data-lucide="play" class="w-3.5 h-3.5"></i>
            Départ Anticipé
          </button>
        ` : `
          <div class="flex-1 px-3 py-2 rounded-xl text-center text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
            Manque ${mission.requiredVolunteers - registeredVols.length} secouriste(s)
          </div>
        `}
      `;
    } else {
      footer.innerHTML = `
        <button onclick="window.game.closeDrawer()" class="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">Fermer</button>
      `;
    }

    drawer.classList.remove('hidden');
    drawer.classList.add('flex', 'drawer-slide-in');
    if (window.lucide) window.lucide.createIcons();
  }

  registerSalarieToMission(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    const allSalaries = this.volunteers.filter(v => (v.contractType === 'salarie' || v.dispoType === 'salarié' || v.dispoType === 'salarie_permanent'));
    if (allSalaries.length === 0) {
      this.showToast('Aucun Salarié Embauché', 'Votre antenne n’a pas encore embauché de salarié permanent (recrutement disponible dans Pôle RH).', 'orange');
      return;
    }

    const now = Date.now();
    // 1. Contrôle du repos quotidien obligatoire de 11h consécutives (Code du Travail Art. L3131-1)
    const restingSalaries = allSalaries.filter(v => v.status === 'repos_legal' && v.mandatoryRestUntil && now < v.mandatoryRestUntil);
    const availableSalaries = allSalaries.filter(v => 
      !mission.registeredVolunteers.includes(v.id) && 
      v.status === 'dispo' &&
      (!v.mandatoryRestUntil || now >= v.mandatoryRestUntil) &&
      !v.currentVacation
    );

    if (availableSalaries.length === 0) {
      if (restingSalaries.length > 0) {
        const first = restingSalaries[0];
        const secLeft = Math.ceil((first.mandatoryRestUntil - now) / 1000);
        this.showToast(
          '🛑 Repos Légal (Code du Travail Art. L3131-1)',
          `${first.name} est en repos quotidien obligatoire de 11h consécutives (encore ${secLeft}s). Cette obligation légale s’applique uniquement aux salariés, pas aux bénévoles.`,
          'red'
        );
      } else {
        this.showToast('Salariés Indisponibles', 'Tous vos salariés sont actuellement en mission ou en vacation interne.', 'orange');
      }
      return;
    }

    const sal = availableSalaries[0];
    mission.registeredVolunteers.push(sal.id);
    this.showToast('Salarié Affecté d’Office', `${sal.name} (${sal.rank}) a été positionné sur le dispositif par la direction de l'antenne.`, 'green');
    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();
    this.openMissionDetails(missionId);
  }

  requestAllianceRenfortForMission(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    const needed = mission.requiredVolunteers - (mission.registeredVolunteers?.length || 0);
    const renfortData = {
      requesterPlayerId: this.player.id,
      requesterName: this.player.name,
      allianceId: this.player.allianceId,
      allianceTag: 'UFSC',
      missionId: mission.id,
      title: `Renfort pour ${mission.title}`,
      desc: `Dispositif prévu le ${this.formatShortDate(mission.eventDate)}. Besoin urgent de ${needed} secouriste(s) ou VPSP.`,
      unitRequested: `${needed} secouristes ou VPSP`,
      indemnite: 200
    };

    fetch('/api/alliances/renfort/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renfortData)
    }).then(res => res.json()).then(data => {
      this.renforts.unshift(data.renfort);
      this.showToast('Appel à Renfort Diffusé', `Tous les directeurs d’antennes alliés ont reçu votre appel de détresse !`, 'green');
      this.updateStatsUI();
    }).catch(() => {
      renfortData.id = `renf-${Date.now()}`;
      this.renforts.unshift(renfortData);
      this.showToast('Appel à Renfort Diffusé', `Alerte transmise sur la fréquence fédérale !`, 'green');
    });
  }

  openStationDetails(stationId) {
    const station = this.stations.find(s => s.id === stationId);
    if (!station) return;

    this.selectedStationId = stationId;
    const drawer = document.getElementById('context-drawer');
    const title = document.getElementById('drawer-title');
    const catBadge = document.getElementById('drawer-category-badge');
    const headerIcon = document.getElementById('drawer-header-icon');
    const body = document.getElementById('drawer-body');
    const footer = document.getElementById('drawer-footer');

    catBadge.textContent = 'ANTENNE OPÉRATIONNELLE';
    title.textContent = station.name;
    headerIcon.setAttribute('data-lucide', 'building-2');

    const stationVehicles = this.vehicles.filter(v => station.vehicles.includes(v.id));
    const stationVolunteers = this.volunteers.filter(v => v.stationId === station.id);

    body.innerHTML = `
      <div class="space-y-4">
        <div class="p-3.5 rounded-2xl glass-card space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-pc-blue">Niveau du Local</span>
            <span class="px-2 py-0.5 rounded font-extrabold bg-pc-blue text-white">Niveau ${station.level}</span>
          </div>
          <p class="text-xs text-slate-500">Standard radio et armoire de secours opérationnels.</p>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Flotte (${stationVehicles.length})</h4>
            <button onclick="window.game.openBuyVehicleModal('${station.id}')" class="text-xs font-bold text-pc-orange hover:underline">+ Acheter Véhicule</button>
          </div>
          <div class="space-y-1.5">
            ${stationVehicles.map(v => `
              <div class="p-2.5 rounded-xl glass-card flex items-center justify-between text-xs">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-7 bg-slate-100/90 rounded-lg p-0.5 flex items-center justify-center flex-shrink-0 border border-slate-200/60 shadow-inner">
                    <img src="${v.image || window.game.getVehicleImage(v.type)}" alt="${v.name}" class="max-h-full max-w-full object-contain" onerror="this.outerHTML='🚑'" />
                  </div>
                  <div>
                    <span class="font-black text-slate-800 leading-tight block">${v.name}</span>
                    <span class="text-[9px] text-slate-400 font-semibold">${v.label || v.type}</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'dispo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
                  ${v.status === 'dispo' ? 'DISPO' : 'ENGAGÉ'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Effectif Rattaché (${stationVolunteers.length})</h4>
            <button onclick="window.game.openModule('recrutement')" class="text-xs font-bold text-pc-blue hover:underline">Recruter (Candidatures)</button>
          </div>
          <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            ${stationVolunteers.map(v => `
              <div class="p-2.5 rounded-xl glass-card flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-base">${v.avatar}</span>
                  <div>
                    <div class="font-bold text-slate-800">${v.name}</div>
                    <div class="text-[10px] text-slate-500">${v.dispoType} • Dispo : ${v.dispoJours.join(', ')}</div>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-blue/10 text-pc-blue">${v.rank}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button onclick="window.game.closeDrawer()" class="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">Fermer</button>
    `;

    drawer.classList.remove('hidden');
    drawer.classList.add('flex', 'drawer-slide-in');
    if (window.lucide) window.lucide.createIcons();
  }

  closeDrawer() {
    const drawer = document.getElementById('context-drawer');
    drawer.classList.add('hidden');
    drawer.classList.remove('flex', 'drawer-slide-in');
    this.selectedMissionId = null;
  }

  // --- MODULE ALLIANCES & MULTIJOUEUR ---
  setAllianceTab(tabKey) {
    this.activeAllianceTab = tabKey;
    this.openModule('alliance');
  }

  fulfillRenfort(renfortId) {
    const renfort = this.renforts.find(r => r.id === renfortId);
    if (!renfort) return;

    // Trouver un VPSP ou secouriste disponible
    const dispoVeh = this.vehicles.find(v => v.status === 'dispo');
    if (!dispoVeh) {
      this.showToast('Moyens indisponibles', 'Vous devez avoir au moins 1 véhicule disponible au garage pour détacher un renfort.', 'orange');
      return;
    }

    const payload = {
      renfortId: renfort.id,
      providerPlayerId: this.player.id,
      providerName: this.player.name,
      unitDetails: `${dispoVeh.name} (${this.player.name})`
    };

    fetch('/api/alliances/renfort/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(() => {
      renfort.status = 'fulfilled';
      this.resources.money += renfort.indemnite || 200;
      this.resources.alliancePoints += 35;
      this.showToast('Renfort Dépêché !', `Votre ${dispoVeh.name} part épauler ${renfort.requesterName} ! (+${renfort.indemnite} € d’indemnité et +35 pts d’alliance)`, 'green');
      this.updateStatsUI();
      this.openModule('alliance');
    }).catch(() => {
      renfort.status = 'fulfilled';
      this.resources.money += renfort.indemnite || 200;
      this.resources.alliancePoints += 35;
      this.showToast('Renfort Dépêché !', `Unité partie en renfort inter-antennes !`, 'green');
      this.updateStatsUI();
      this.openModule('alliance');
    });
  }

  registerVolunteerToSpecialFormation(formationId) {
    const form = this.formationsSpeciales.find(f => f.id === formationId);
    if (!form) return;

    // Bénévoles disponibles éligibles
    const eligibleVolunteers = this.volunteers.filter(v => v.status === 'dispo');
    if (eligibleVolunteers.length === 0) {
      this.showToast('Aucun bénévole disponible', 'Tous vos secouristes sont en mission ou indisponibles.', 'orange');
      return;
    }

    if (this.resources.money < form.costPerCandidate) {
      this.showToast('Trésorerie insuffisante', `Le stage requiert ${form.costPerCandidate} € d'inscription.`, 'orange');
      return;
    }

    const candidate = eligibleVolunteers[0];
    this.resources.money -= form.costPerCandidate;
    candidate.status = 'formation';

    fetch('/api/alliances/formation/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formationId: form.id,
        volunteerName: candidate.name,
        playerName: this.player.name,
        candidateRank: candidate.rank
      })
    }).then(res => res.json()).then(() => {
      form.registeredCandidates.push({ volunteerName: candidate.name, playerName: this.player.name });
      this.showToast('Inscription Validée !', `${candidate.name} a été inscrit au « ${form.title} » organisé par ${form.organizerName} !`, 'green');
      this.updateStatsUI();
      this.openModule('alliance');
    }).catch(() => {
      form.registeredCandidates.push({ volunteerName: candidate.name, playerName: this.player.name });
      this.showToast('Inscription Validée', `${candidate.name} est inscrit au stage fédéral.`, 'green');
      this.updateStatsUI();
      this.openModule('alliance');
    });
  }

  sendAllianceChatMessage() {
    const input = document.getElementById('alliance-chat-input');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    input.value = '';

    const payload = {
      senderId: this.player.id,
      senderName: this.player.name,
      allianceId: this.player.allianceId,
      text: text
    };

    fetch('/api/alliances/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      this.chatMessages.push(data.message);
      this.renderChatMessages();
    }).catch(() => {
      this.chatMessages.push({
        id: `msg-${Date.now()}`,
        senderName: this.player.name,
        text: text,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
      this.renderChatMessages();
    });
  }

  renderChatMessages() {
    const container = document.getElementById('alliance-chat-messages');
    if (!container) return;

    container.innerHTML = this.chatMessages.map(m => `
      <div class="p-2.5 rounded-xl bg-white/70 border border-slate-200/80 text-xs space-y-0.5">
        <div class="flex items-center justify-between text-[10px] text-slate-400">
          <strong class="text-indigo-700">${m.senderName}</strong>
          <span>${m.time || ''}</span>
        </div>
        <p class="text-slate-800">${m.text}</p>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  // --- POPUP MODULES DOCK ---
  openModule(moduleKey, isBackNavigation = false) {
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');
    const backBtn = document.getElementById('modal-back-btn');

    if (!isBackNavigation && this.currentModalKey && this.currentModalKey !== moduleKey) {
      if (!this.modalHistory) this.modalHistory = [];
      this.modalHistory.push(this.currentModalKey);
    }
    this.currentModalKey = moduleKey;

    if (backBtn) {
      if (this.modalHistory && this.modalHistory.length > 0) {
        backBtn.classList.remove('hidden');
      } else {
        backBtn.classList.add('hidden');
      }
    }

    modal.classList.remove('hidden');

    if (moduleKey === 'alliance') {
      title.textContent = 'Fédération & Alliances Multijoueur';
      subtitle.textContent = 'Entraide inter-antennes, détachements de renforts, stages mutualisés et radio';
      icon.setAttribute('data-lucide', 'handshake');

      const alliance = this.alliances[0] || { name: 'Union Fédérale de Sécurité Civile', tag: 'UFSC', treasury: 8500 };
      const currentTab = this.activeAllianceTab || 'membres';

      body.innerHTML = `
        <div class="space-y-5">
          
          <!-- En-tête de l'Alliance -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-700 to-pc-blue text-white flex items-center justify-between shadow-lg">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-lg">
                ${alliance.tag || 'PC'}
              </div>
              <div>
                <h4 class="text-base font-extrabold leading-tight">${alliance.name}</h4>
                <p class="text-xs text-white/80">Caisse de solidarité fédérale : <strong>${(alliance.treasury || 8500).toLocaleString('fr-FR')} €</strong> • Vos points d’alliance : <strong>${this.resources.alliancePoints} pts</strong></p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Réseau Connecté
              </span>
            </div>
          </div>

          <!-- Onglets du module Alliance -->
          <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
            <button onclick="window.game.setAllianceTab('membres')" class="px-3.5 py-1.5 rounded-xl transition ${currentTab === 'membres' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
              Antennes & Membres (${this.allianceStations.length + this.stations.length})
            </button>
            <button onclick="window.game.setAllianceTab('renforts')" class="px-3.5 py-1.5 rounded-xl transition ${currentTab === 'renforts' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'} flex items-center gap-1.5">
              Appels à Renforts
              <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">${this.renforts.filter(r => r.status === 'open').length}</span>
            </button>
            <button onclick="window.game.setAllianceTab('formations')" class="px-3.5 py-1.5 rounded-xl transition ${currentTab === 'formations' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
              Stages Mutualisés (${this.formationsSpeciales.length})
            </button>
            <button onclick="window.game.setAllianceTab('manoeuvres')" class="px-3.5 py-1.5 rounded-xl transition ${currentTab === 'manoeuvres' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'} flex items-center gap-1">
              <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
              Manœuvres Fédérales
            </button>
            <button onclick="window.game.setAllianceTab('radio')" class="px-3.5 py-1.5 rounded-xl transition ${currentTab === 'radio' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'} flex items-center gap-1">
              <i data-lucide="radio" class="w-3.5 h-3.5"></i>
              Radio Alliance
            </button>
          </div>

          <!-- Contenu selon onglet actif -->
          <div id="alliance-tab-content">
            ${currentTab === 'membres' ? `
              <div class="space-y-4">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-500">Toutes les antennes connectées partagent leurs ressources en cas de crise majeure.</span>
                  <button onclick="window.game.openPlayerProfileModal()" class="font-bold text-indigo-600 hover:underline">Modifier mon profil joueur</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <!-- Notre antenne -->
                  <div class="p-4 rounded-2xl glass-card-blue border-2 border-pc-blue/40 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-blue text-white">VOTRE ANTENNE</span>
                      <span class="text-xs font-bold text-slate-800">${this.player.name}</span>
                    </div>
                    <h5 class="text-sm font-extrabold text-slate-900">${this.stations[0]?.name || 'Antenne en création'}</h5>
                    <div class="text-xs text-slate-600 flex justify-between pt-2 border-t border-slate-100/70">
                      <span>Véhicules : <strong>${this.vehicles.length}</strong></span>
                      <span>Bénévoles : <strong>${this.volunteers.length}</strong></span>
                    </div>
                  </div>

                  <!-- Antennes alliées -->
                  ${this.allianceStations.map(st => `
                    <div class="p-4 rounded-2xl glass-card space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">ALLIÉ EN LIGNE</span>
                        <span class="text-xs font-bold text-slate-700">${st.playerName}</span>
                      </div>
                      <h5 class="text-sm font-extrabold text-slate-900">${st.name}</h5>
                      <div class="text-xs text-slate-600 flex justify-between pt-2 border-t border-slate-100/70">
                        <span>Flotte : <strong>${st.vehicles} véhicules</strong></span>
                        <span>Secouristes : <strong>${st.volunteers} membres</strong></span>
                      </div>
                      <div class="pt-1 flex justify-end">
                        <button onclick="window.game.openAllianceStationDetails({ id: '${st.id}', name: '${st.name}', playerName: '${st.playerName}', vehicles: ${st.vehicles}, volunteers: ${st.volunteers} })" class="text-xs font-bold text-indigo-600 hover:underline">
                          Voir sur la carte ➜
                        </button>
                      </div>
                    </div>
                  `).join('')}

                </div>
              </div>
            ` : ''}

            ${currentTab === 'renforts' ? `
              <div class="space-y-4">
                <div class="p-3.5 rounded-2xl glass-card-amber text-xs text-amber-900 flex items-center justify-between">
                  <span>Dépêchez vos véhicules en renfort auprès d’antennes alliées pour toucher des indemnités et de la réputation !</span>
                  <button onclick="window.game.openModule('planning')" class="px-3 py-1.5 rounded-xl font-bold bg-amber-600 text-white hover:bg-amber-700 transition">
                    + Émettre un Appel depuis mon Planning
                  </button>
                </div>

                <div class="space-y-3">
                  ${this.renforts.length === 0 ? '<p class="text-xs text-slate-500 p-6 glass-card rounded-2xl text-center">Aucune demande de renfort active actuellement.</p>' : ''}
                  ${this.renforts.map(r => `
                    <div class="p-4 rounded-2xl glass-card flex items-center justify-between">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${r.status === 'fulfilled' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                            ${r.status === 'fulfilled' ? 'RENFORT ASSURÉ' : 'URGENT'}
                          </span>
                          <span class="text-xs font-bold text-slate-700">Demandé par <strong>${r.requesterName}</strong></span>
                        </div>
                        <h5 class="text-sm font-extrabold text-slate-900">${r.title}</h5>
                        <p class="text-xs text-slate-500">${r.desc} • Moyens attendus : <strong class="text-slate-800">${r.unitRequested}</strong></p>
                      </div>

                      <div class="text-right space-y-2">
                        <div class="text-xs font-bold text-emerald-700 mono-num">+${r.indemnite || 180} €</div>
                        ${r.status === 'open' && r.requesterPlayerId !== this.player.id ? `
                          <button onclick="window.game.fulfillRenfort('${r.id}')" class="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center gap-1.5">
                            <i data-lucide="send" class="w-3.5 h-3.5"></i>
                            Dépêcher Renfort
                          </button>
                        ` : `
                          <span class="text-xs text-slate-400 font-bold">${r.status === 'fulfilled' ? 'Renfort en route' : 'Votre appel'}</span>
                        `}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${currentTab === 'formations' ? `
              <div class="space-y-4">
                <div class="p-3.5 rounded-2xl glass-card-blue text-xs text-indigo-900 flex items-center justify-between">
                  <span>Les antennes disposant d’instructeurs qualifiés ouvrent des stages de perfectionnement aux alliés.</span>
                  <button onclick="window.game.proposeSpecialFormationModal()" class="px-3.5 py-1.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition">
                    + Proposer un Stage Spécial
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  ${this.formationsSpeciales.map(f => `
                    <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3">
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                          <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white">${f.type}</span>
                          <span class="text-xs font-extrabold mono-num text-slate-800">${f.costPerCandidate} € / candidat</span>
                        </div>
                        <h5 class="text-sm font-extrabold text-slate-900">${f.title}</h5>
                        <p class="text-xs text-slate-500">${f.desc}</p>
                        <div class="text-[11px] text-slate-400">Organisé par : <strong>${f.organizerName}</strong> (${f.stationName})</div>
                      </div>

                      <div class="pt-2 border-t border-slate-100/70 flex items-center justify-between text-xs">
                        <span class="text-slate-500">Inscrits : <strong>${f.registeredCandidates?.length || 0} / ${f.maxCandidates}</strong></span>
                        <button onclick="window.game.registerVolunteerToSpecialFormation('${f.id}')" class="px-3.5 py-1.5 rounded-xl font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
                          Inscrire un Bénévole
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${currentTab === 'manoeuvres' && window.ProtecAdvancedModals ? window.ProtecAdvancedModals.renderManoeuvres(this) : ''}

            ${currentTab === 'radio' ? `
              <div class="space-y-3">
                <div class="p-3 rounded-2xl glass-card text-xs text-slate-600 flex items-center gap-2">
                  <i data-lucide="radio" class="w-4 h-4 text-indigo-600"></i>
                  <span>Canal tactique inter-antennes de l’alliance. Tous les directeurs connectés reçoivent les messages.</span>
                </div>

                <div id="alliance-chat-messages" class="h-64 overflow-y-auto space-y-2 p-2 glass-card rounded-2xl border border-white/60">
                  <!-- Rempli dynamiquement -->
                </div>

                <div class="flex items-center gap-2 pt-1">
                  <input 
                    type="text" 
                    id="alliance-chat-input" 
                    placeholder="Message radio à l’alliance (ex: VPSP disponible en renfort secteur Sud)..." 
                    onkeydown="if(event.key === 'Enter') window.game.sendAllianceChatMessage()"
                    class="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                  <button onclick="window.game.sendAllianceChatMessage()" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm">
                    <i data-lucide="send" class="w-3.5 h-3.5"></i>
                    Émettre
                  </button>
                </div>
              </div>
            ` : ''}
          </div>

        </div>
      `;

      if (currentTab === 'radio') {
        setTimeout(() => this.renderChatMessages(), 50);
      }
    } else if (moduleKey === 'planning') {
      title.textContent = 'Planning Opérationnel des Dispositifs & Missions';
      subtitle.textContent = 'Dispositifs prévisionnels (DPS), gardes SAMU/SDIS, maraudes sociales et calendrier officiel';
      icon.setAttribute('data-lucide', 'calendar');

      const currentTab = this.activePlanningTab || 'calendar';
      const allScheduled = this.missions.filter(m => m.status === 'planifie' || m.status === 'ongoing' || m.type === 'dps');
      
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      const curMonthName = monthNames[this.clock.month] || 'Mois';
      const curYear = this.clock.year || 2026;
      const todayDay = this.clock.day || 1;
      const selectedDay = this.selectedPlanningDay || todayDay;

      // Calcul du calendrier mensuel
      const daysInMonth = new Date(curYear, this.clock.month + 1, 0).getDate();
      const firstDayIndex = (new Date(curYear, this.clock.month, 1).getDay() + 6) % 7; // 0 = Lundi, 6 = Dimanche

      const selectedDayMissions = allScheduled.filter(m => m.eventDate && m.eventDate.day === selectedDay && m.eventDate.month === this.clock.month);

      body.innerHTML = `
        <div class="space-y-5">
          <!-- Barre d'onglets Vue Calendrier / Vue Liste -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div class="flex items-center gap-2">
              <button onclick="window.game.setPlanningTab('calendar')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${currentTab === 'calendar' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
                <i data-lucide="calendar" class="w-4 h-4"></i>
                Vue Calendrier
              </button>
              <button onclick="window.game.setPlanningTab('list')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${currentTab === 'list' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}">
                <i data-lucide="list" class="w-4 h-4"></i>
                Vue Liste Chronologique (${allScheduled.length})
              </button>
            </div>
            <div class="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Aujourd'hui : <strong class="text-slate-800">${this.formatFullDate(this.clock)}</strong>
            </div>
          </div>

          ${currentTab === 'calendar' ? `
            <!-- VUE CALENDRIER -->
            <div class="space-y-4">
              <div class="flex items-center justify-between px-1">
                <div>
                  <h4 class="text-base font-extrabold text-slate-900">${curMonthName} ${curYear}</h4>
                  <p class="text-[11px] text-slate-500">Sélectionnez un jour pour consulter ou gérer les dispositifs programmés</p>
                </div>
                <div class="flex items-center gap-3 text-[11px] text-slate-600">
                  <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-pc-blue"></span> DPS Événement</span>
                  <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-pc-orange"></span> Garde SAMU/SDIS</span>
                  <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Social</span>
                </div>
              </div>

              <!-- Grille du calendrier -->
              <div class="glass-card rounded-2xl p-4 shadow-sm">
                <!-- En-têtes des jours de la semaine -->
                <div class="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
                </div>

                <!-- Cases des jours -->
                <div class="grid grid-cols-7 gap-1.5">
                  <!-- Décalage premier jour -->
                  ${Array.from({ length: firstDayIndex }).map(() => `
                    <div class="h-16 rounded-xl bg-slate-50/50 opacity-30 border border-transparent"></div>
                  `).join('')}

                  <!-- Jours du mois -->
                  ${Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === todayDay;
                    const isSelected = day === selectedDay;
                    const dayMissions = allScheduled.filter(m => m.eventDate && m.eventDate.day === day && m.eventDate.month === this.clock.month);
                    const dpsCount = dayMissions.filter(m => m.type === 'dps').length;
                    const otherCount = dayMissions.filter(m => m.type !== 'dps').length;

                    let bgClass = 'bg-white hover:bg-slate-50 border-slate-200/80';
                    if (isSelected) bgClass = 'bg-pc-blue/10 border-pc-blue ring-2 ring-pc-blue/30';
                    else if (isToday) bgClass = 'bg-amber-50/80 border-amber-300';

                    return `
                      <button 
                        onclick="window.game.selectPlanningDay(${day})" 
                        class="h-16 rounded-xl p-1.5 flex flex-col justify-between text-left transition border ${bgClass} cursor-pointer group"
                      >
                        <div class="flex items-center justify-between w-full">
                          <span class="text-xs font-extrabold ${isToday ? 'text-amber-800 font-black' : isSelected ? 'text-pc-blue' : 'text-slate-800'}">
                            ${day}
                          </span>
                          ${isToday ? `<span class="px-1 py-0.2 rounded text-[8px] font-black bg-amber-400 text-amber-950 uppercase">Auj.</span>` : ''}
                        </div>

                        <div class="flex flex-col gap-0.5 w-full">
                          ${dpsCount > 0 ? `
                            <div class="px-1 py-0.2 rounded text-[9px] font-extrabold bg-pc-blue text-white truncate text-center">
                              DPS (${dpsCount})
                            </div>
                          ` : ''}
                          ${otherCount > 0 ? `
                            <div class="px-1 py-0.2 rounded text-[9px] font-extrabold bg-pc-orange text-white truncate text-center">
                              Garde (${otherCount})
                            </div>
                          ` : ''}
                        </div>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Détail de la journée sélectionnée -->
              <div class="p-4 rounded-2xl glass-card space-y-3">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 class="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <i data-lucide="calendar-check" class="w-4 h-4 text-pc-blue"></i>
                    Dispositifs & Missions du ${selectedDay} ${curMonthName} ${curYear}
                    ${selectedDay === todayDay ? `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">Aujourd'hui sur la carte</span>` : ''}
                  </h4>
                  <span class="text-xs font-bold text-slate-500">${selectedDayMissions.length} mission(s) programmée(s)</span>
                </div>

                ${selectedDayMissions.length === 0 ? `
                  <p class="text-xs text-slate-500 py-6 text-center italic">
                    Aucun dispositif programmé pour cette date. Consultez vos devis reçus ou activez la communication pour recevoir des sollicitations.
                  </p>
                ` : `
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    ${selectedDayMissions.map(m => {
                      const regCount = m.registeredVolunteers?.length || 0;
                      const isFull = regCount >= m.requiredVolunteers;
                      const timeStr = `${m.startHour || m.eventDate?.hour || 14}h00 à ${(m.endHour || ((m.eventDate?.hour || 14) + (m.durationHours || 4)) % 24)}h00`;

                      return `
                        <div class="p-3.5 rounded-xl glass-card border border-slate-200/80 flex flex-col justify-between space-y-2.5">
                          <div>
                            <div class="flex items-center justify-between">
                              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-pc-blue text-white">${timeStr}</span>
                              <span class="text-xs font-bold text-emerald-700 mono-num">+${m.rewardMoney} €</span>
                            </div>
                            <h5 class="text-xs font-extrabold text-slate-900 mt-1">${m.title}</h5>
                            <p class="text-[11px] text-slate-500">${m.scale || 'DPS'} • Véhicules : <strong>${(m.requiredVehicles && m.requiredVehicles.length > 0) ? m.requiredVehicles.join(', ') : 'Poste fixe / pédestre'}</strong></p>
                          </div>

                          <div class="pt-2 border-t border-slate-100 space-y-1.5">
                            <div class="flex items-center justify-between text-xs font-bold">
                              <span class="${isFull ? 'text-emerald-700' : 'text-amber-700'}">
                                ${isFull ? '✓ Effectif complet' : `⚠️ Incomplet (${regCount}/${m.requiredVolunteers})`}
                              </span>
                              <div class="flex gap-2">
                                <button onclick="window.game.requestAllianceRenfortForMission('${m.id}')" class="text-indigo-600 hover:underline text-[11px] font-bold">Renfort</button>
                                <button onclick="window.game.relanceVolunteers('${m.id}')" class="text-pc-orange hover:underline text-[11px] font-bold">Relancer</button>
                              </div>
                            </div>
                            <div class="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                              <div class="h-full rounded-full ${isFull ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${Math.min(100, (regCount / m.requiredVolunteers) * 100)}%"></div>
                            </div>
                          </div>

                          <button onclick="window.game.closeModal(); window.game.openMissionDetails('${m.id}')" class="w-full py-1.5 rounded-xl text-xs font-bold glass-button text-slate-800 transition">
                            Fiche détaillée & Inscriptions
                          </button>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>
            </div>
          ` : `
            <!-- VUE LISTE CHRONOLOGIQUE -->
            <div class="space-y-4">
              <div class="p-4 rounded-2xl glass-card-blue flex items-center justify-between text-xs text-pc-blue">
                <div>
                  <span class="font-bold block">Calendrier des Dispositifs :</span>
                  Vue continue de tous les postes et interventions planifiés dans le département. Seuls les postes du jour apparaissent sur la carte tactique.
                </div>
                <div class="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/80 border border-pc-blue/30 text-pc-blue whitespace-nowrap ml-3">
                  ${allScheduled.length} Dispositifs
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${allScheduled.length === 0 ? '<p class="text-xs text-slate-500 p-6 glass-card rounded-2xl text-center col-span-2">Aucun événement planifié pour l’instant. Établissez des devis dans le module Devis pour remplir votre planning.</p>' : ''}
                ${allScheduled.map(m => {
                  const regCount = m.registeredVolunteers?.length || 0;
                  const isFull = regCount >= m.requiredVolunteers;
                  const dateStr = m.eventDate ? this.formatFullDate(m.eventDate) + ' à ' + (m.startHour || m.eventDate.hour || 14) + 'h00' : 'Date à confirmer';
                  const isToday = m.eventDate ? (m.eventDate.day === this.clock.day && m.eventDate.month === this.clock.month) : false;

                  return `
                    <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border ${isToday ? 'border-amber-300 ring-2 ring-amber-200' : 'border-slate-200/80'}">
                      <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${isToday ? 'bg-amber-500 text-white' : 'bg-pc-blue text-white'}">
                            ${dateStr} ${isToday ? '⭐ (AUJOURD’HUI)' : ''}
                          </span>
                          <span class="text-xs font-bold mono-num text-emerald-600">+${m.rewardMoney} €</span>
                        </div>
                        <h4 class="text-sm font-extrabold text-slate-900">${m.title}</h4>
                        <p class="text-xs text-slate-500">${m.scale || 'DPS'} • Véhicules : <strong>${(m.requiredVehicles && m.requiredVehicles.length > 0) ? m.requiredVehicles.join(', ') : 'Poste fixe / pédestre'}</strong></p>
                      </div>

                      <div class="space-y-1.5 pt-2 border-t border-slate-100/70">
                        <div class="flex items-center justify-between text-xs font-bold">
                          <span class="${isFull ? 'text-emerald-700' : 'text-amber-700'}">
                            ${isFull ? '✓ Effectif complet' : `⚠️ Incomplet (${regCount}/${m.requiredVolunteers})`}
                          </span>
                          <div class="flex gap-2">
                            <button onclick="window.game.requestAllianceRenfortForMission('${m.id}')" class="text-indigo-600 hover:underline text-[11px] font-bold">
                              Renfort Alliance
                            </button>
                            <button onclick="window.game.relanceVolunteers('${m.id}')" class="text-pc-orange hover:underline text-[11px] font-bold">
                              Relancer
                            </button>
                          </div>
                        </div>
                        <div class="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                          <div class="h-full rounded-full ${isFull ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${Math.min(100, (regCount / m.requiredVolunteers) * 100)}%"></div>
                        </div>
                      </div>

                      <button onclick="window.game.closeModal(); window.game.openMissionDetails('${m.id}')" class="w-full py-2 rounded-xl text-xs font-bold glass-button text-slate-800 transition">
                        Détail du dispositif
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `}
        </div>
      `;
    } else if (moduleKey === 'devis') {
      title.textContent = 'Gestion des Devis & Dimensionnement DPS';
      subtitle.textContent = 'Configurez votre type de DPS, secouristes et véhicules. L’organisateur évalue votre offre face à la concurrence.';
      icon.setAttribute('data-lucide', 'file-check');

      const pendingDevis = this.devis.filter(d => d.status === 'pending');
      const treatedDevis = this.devis.filter(d => d.status !== 'pending');

      body.innerHTML = `
        <div class="space-y-6">
          <div class="p-4 rounded-2xl glass-card-amber text-xs text-amber-950 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-extrabold flex items-center gap-1.5 text-amber-900">
                <i data-lucide="scale" class="w-4 h-4 text-amber-600"></i>
                Barème Réglementaire & Mise en Concurrence (RNMSC)
              </span>
              <span class="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-lg">Mise en Concurrence Active</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-amber-800">
              <div class="p-2 glass-card rounded-xl">Vacation secouriste : <strong>18,00 €/h</strong></div>
              <div class="p-2 glass-card rounded-xl">Ambulance VPSP : <strong>110,00 €</strong></div>
              <div class="p-2 glass-card rounded-xl">Matériel & DSA : <strong>35 à 120 €</strong></div>
              <div class="p-2 glass-card rounded-xl">Frais convention : <strong>40,00 €</strong></div>
            </div>
            <p class="text-[11px] text-amber-700 italic">
              <strong>Règle :</strong> Vous définissez librement le type de DPS, le nombre de secouristes et les véhicules. L’organisateur évalue si votre dimensionnement respecte la sécurité, et compare votre tarif à ceux de la concurrence (Croix-Rouge, Ordre de Malte).
            </p>
          </div>

          <!-- Section Communication, Publicité & Rayonnement d'Antenne -->
          <div class="p-4 rounded-2xl glass-card space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black uppercase text-slate-800 tracking-wider">Rayonnement & Communication de l'Antenne</h4>
                <p class="text-[11px] text-slate-500">Activez des campagnes de communication pour accroître votre popularité et recevoir des sollicitations d'organisateurs d'événements.</p>
              </div>
              <div class="text-right">
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Popularité</span>
                <span class="text-xs font-black text-pc-blue">${this.resources.reputationScore} pts (${this.resources.followers} abonnés)</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div class="p-3 rounded-2xl glass-card flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-slate-800">Campagne Réseaux Sociaux</div>
                  <div class="text-[10px] text-slate-500">Notoriété locale & associations (+sollicitations)</div>
                </div>
                <button onclick="window.game.toggleCampaign('social'); window.game.openModule('devis', true);" class="px-3 py-1.5 rounded-xl text-xs font-bold ${this.resources.campaigns.social ? 'bg-emerald-600 text-white' : 'glass-button text-slate-700'} transition">
                  ${this.resources.campaigns.social ? 'Active ✓' : 'Lancer (150 €)'}
                </button>
              </div>

              <div class="p-3 rounded-2xl glass-card flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-slate-800">Affichage & Mairie</div>
                  <div class="text-[10px] text-slate-500">Visibilité municipale (+grands dispositifs)</div>
                </div>
                <button onclick="window.game.toggleCampaign('posters'); window.game.openModule('devis', true);" class="px-3 py-1.5 rounded-xl text-xs font-bold ${this.resources.campaigns.posters ? 'bg-emerald-600 text-white' : 'glass-button text-slate-700'} transition">
                  ${this.resources.campaigns.posters ? 'Actif ✓' : 'Lancer (200 €)'}
                </button>
              </div>
            </div>
          </div>

          <!-- Section Subventions & Mécénat Participatif -->
          <div class="p-4 rounded-2xl glass-card-emerald shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">🏛️</div>
                <div>
                  <h4 class="text-xs font-extrabold text-slate-900">Dossier de Subvention Municipale & Mécénat</h4>
                  <p class="text-[11px] text-slate-500">Heures de bénévolat d’intérêt général cumulées : <strong class="text-emerald-700 font-mono">${this.grants?.totalVolunteerHours || 42} h</strong> (valeur : ~${((this.grants?.totalVolunteerHours || 42) * 18).toLocaleString('fr-FR')} €)</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="window.ProtecSystems.togglePublicDonations(window.game)" class="px-3 py-1.5 rounded-xl text-xs font-bold ${this.grants?.publicDonationsActive ? 'bg-emerald-600 text-white' : 'glass-button text-slate-700'} transition">
                  ${this.grants?.publicDonationsActive ? 'Dons en ligne : ACTIFS' : 'Activer l’Appel aux Dons (-66% impôt)'}
                </button>
                <button onclick="window.ProtecSystems.submitMunicipalGrantDossier(window.game)" class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 shadow transition flex items-center gap-1.5">
                  <i data-lucide="file-check-2" class="w-3.5 h-3.5"></i>
                  ${this.grants?.municipalDossierSubmitted ? 'Dossier Déposé ✓' : 'Déposer Dossier Mairie'}
                </button>
              </div>
            </div>
          </div>

          <!-- Section Convention Partenaire SNCF (Assistance Voyageurs & CHU) -->
          <div class="p-4 rounded-2xl ${this.sncfConvention?.signed ? 'glass-card-blue border-blue-300' : 'glass-card border-slate-200'} shadow-sm space-y-3 border">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl ${this.sncfConvention?.signed ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-black text-lg shadow-sm">
                  🚆
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-xs font-black text-slate-900 uppercase">Convention Partenaire SNCF (Assistance Voyageurs & CHU)</h4>
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${this.sncfConvention?.signed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
                      ${this.sncfConvention?.signed ? 'Convention Signée ✓' : 'Non Signée'}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-600 mt-0.5">
                    Partenariat de crise avec le groupe SNCF Réseau pour l'assistance aux voyageurs en cas de trains bloqués, rupture caténaire et déploiement de Centres d’Hébergement d’Urgence (CHU) en gare.
                  </p>
                  <div class="flex flex-wrap gap-3 mt-1.5 text-[10px] text-slate-500 font-bold">
                    <span>Dotation initiale : <strong class="text-emerald-700 font-mono">+400 €</strong></span>
                    <span>•</span>
                    <span>Indemnité de veille : <strong class="text-emerald-700 font-mono">+120 € / levée</strong></span>
                    <span>•</span>
                    <span>Prestation CHU : <strong class="text-emerald-700 font-mono">+420 à +480 €</strong></span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                ${this.sncfConvention?.signed ? `
                  <button onclick="window.game.terminateSncfConvention(); window.game.openModule('devis', true);" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition border border-rose-200">
                    Résilier
                  </button>
                ` : `
                  <button onclick="window.game.signSncfConvention(); window.game.openModule('devis', true);" class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5">
                    <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
                    Signer la Convention SNCF (+400 €)
                  </button>
                `}
              </div>
            </div>
          </div>

          <!-- Demandes reçues avec configurateur personnalisé -->
          <div class="space-y-4">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Demandes Reçues des Organisateurs (${pendingDevis.length})</h4>

            ${pendingDevis.length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucune demande reçue pour le moment. Développez la communication et la réputation de votre antenne pour recevoir des devis d’organisateurs.</p>' : ''}
            
            ${pendingDevis.map(d => {
              // Initialisation des valeurs configurées par le joueur
              if (!d.configuredScale) {
                d.configuredScale = d.scale ? d.scale.split(' ')[0] : 'DPS-PE';
                d.configuredVolunteers = d.requiredVolunteers || 4;
                d.configuredVehicles = (d.requiredVehicles && d.requiredVehicles.length > 0) ? [...d.requiredVehicles] : ['VPSP'];
              }

              const dynamicBareme = this.calculateDynamicBareme(d);
              const dateStr = this.formatFullDate(d.eventDate);
              const defaultVal = d.proposedPrice || dynamicBareme.totalBareme;

              const vehKey = (d.configuredVehicles.length === 0) ? 'none' : 
                (d.configuredVehicles.length === 2 && d.configuredVehicles.includes('VTU')) ? 'vpsp_vtu' :
                (d.configuredVehicles.length === 2) ? 'vpsp2' : 'vpsp1';

              return `
                <div class="p-5 rounded-2xl glass-card space-y-4 border border-slate-200/80 shadow-sm" id="devis-card-${d.id}">
                  <!-- En-tête de la demande -->
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-pc-blue text-white">${d.eventName}</span>
                        <span class="text-xs font-bold text-slate-500">${d.clientName} (${d.clientType})</span>
                      </div>
                      <h4 class="text-base font-extrabold text-slate-900 mt-1">${d.eventName}</h4>
                      <p class="text-xs text-slate-500">
                        Date : <strong>${dateStr}</strong> • Durée : <strong>${d.durationHours}h</strong> • Affluence attendue : <strong class="text-slate-800">${d.publicCount}</strong>
                      </p>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] text-slate-400 font-bold uppercase block">Barème Conseillé</span>
                      <span class="text-base font-extrabold mono-num text-slate-800" id="bareme-total-display-${d.id}">${dynamicBareme.totalBareme} €</span>
                    </div>
                  </div>

                  <!-- CONFIGURATEUR PAR LE JOUEUR -->
                  <div class="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                    <div class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
                      <span>🛠️ Dimensionnement proposé par votre antenne</span>
                      <span class="text-[10px] text-slate-400 font-bold lowercase">Défini par le joueur</span>
                    </div>

                    <!-- 1. Type de Dispositif -->
                    <div>
                      <label class="block text-[11px] font-bold text-slate-600 mb-1">Type de dispositif (RNMSC) :</label>
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                        <button onclick="window.game.updateDevisScale('${d.id}', 'PAPS')" class="p-2 rounded-xl font-bold transition text-center ${d.configuredScale === 'PAPS' ? 'bg-pc-blue text-white shadow-sm' : 'glass-button text-slate-700'}">
                          PAPS (2 sec.)
                        </button>
                        <button onclick="window.game.updateDevisScale('${d.id}', 'DPS-PE')" class="p-2 rounded-xl font-bold transition text-center ${d.configuredScale === 'DPS-PE' ? 'bg-pc-blue text-white shadow-sm' : 'glass-button text-slate-700'}">
                          DPS-PE (3-6 sec.)
                        </button>
                        <button onclick="window.game.updateDevisScale('${d.id}', 'DPS-ME')" class="p-2 rounded-xl font-bold transition text-center ${d.configuredScale === 'DPS-ME' ? 'bg-pc-blue text-white shadow-sm' : 'glass-button text-slate-700'}">
                          DPS-ME (7-12 sec.)
                        </button>
                        <button onclick="window.game.updateDevisScale('${d.id}', 'DPS-GE')" class="p-2 rounded-xl font-bold transition text-center ${d.configuredScale === 'DPS-GE' ? 'bg-pc-blue text-white shadow-sm' : 'glass-button text-slate-700'}">
                          DPS-GE (13+ sec.)
                        </button>
                      </div>
                    </div>

                    <!-- 2. Effectif secouristes & Véhicules engagés -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <!-- Secouristes -->
                      <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">Effectif Secouriste Engagé :</label>
                        <div class="flex items-center gap-2">
                          <button onclick="window.game.adjustDevisVolunteers('${d.id}', -1)" class="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-black hover:bg-slate-100 transition">-</button>
                          <div class="flex-1 text-center py-1.5 rounded-xl bg-white border border-slate-200 font-extrabold text-xs text-slate-800">
                            <span class="text-sm font-black text-pc-blue" id="vol-count-${d.id}">${d.configuredVolunteers}</span> secouristes
                          </div>
                          <button onclick="window.game.adjustDevisVolunteers('${d.id}', 1)" class="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-black hover:bg-slate-100 transition">+</button>
                        </div>
                      </div>

                      <!-- Véhicules -->
                      <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">Moyens Véhicules :</label>
                        <select onchange="window.game.updateDevisVehicles('${d.id}', this.value)" class="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800">
                          <option value="none" ${vehKey === 'none' ? 'selected' : ''}>Sans véhicule (Poste pédestre / Tente)</option>
                          <option value="vpsp1" ${vehKey === 'vpsp1' ? 'selected' : ''}>1 Ambulance VPSP (+110 €)</option>
                          <option value="vpsp2" ${vehKey === 'vpsp2' ? 'selected' : ''}>2 Ambulances VPSP (+220 €)</option>
                          <option value="vpsp_vtu" ${vehKey === 'vpsp_vtu' ? 'selected' : ''}>1 VPSP + 1 VTU Logistique (+165 €)</option>
                        </select>
                      </div>
                    </div>

                    <!-- Décomposition du coût indicatif -->
                    <div class="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-[11px] text-slate-600 flex flex-wrap justify-between gap-2">
                      <span>Personnel : <strong class="text-slate-800">${dynamicBareme.personnelCost} €</strong></span>
                      <span>Véhicules : <strong class="text-slate-800">${dynamicBareme.vehicleCost} €</strong></span>
                      <span>Matériel : <strong class="text-slate-800">${dynamicBareme.matCost} €</strong></span>
                      <span>Dossier : <strong class="text-slate-800">${dynamicBareme.adminCost} €</strong></span>
                    </div>
                  </div>

                  <!-- SAISIE DU PRIX PROPOSÉ PAR LE JOUEUR & SOUMISSION -->
                  <div class="p-4 rounded-xl glass-card space-y-3">
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex-1">
                        <label class="block text-xs font-extrabold text-slate-800 mb-1">Votre Tarif Proposé (€) :</label>
                        <div class="relative rounded-xl shadow-sm">
                          <input 
                            type="number" 
                            id="devis-price-input-${d.id}" 
                            value="${defaultVal}" 
                            min="50" 
                            max="10000"
                            step="10"
                            oninput="window.game.previewDevisPrice('${d.id}', this.value)"
                            class="w-full px-3.5 py-2.5 rounded-xl glass-input font-mono font-extrabold text-base text-slate-900 focus:ring-2 focus:ring-pc-blue"
                          />
                          <span class="absolute right-3.5 top-2.5 text-slate-400 font-bold">€</span>
                        </div>
                      </div>
                      <div class="flex items-end">
                        <button onclick="window.game.submitCustomDevis('${d.id}')" class="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center gap-2">
                          <i data-lucide="send" class="w-4 h-4"></i>
                          Soumettre l'Offre
                        </button>
                      </div>
                    </div>

                    <div id="devis-feedback-${d.id}">
                      <div class="p-2.5 rounded-xl border text-xs flex items-center justify-between glass-card-blue">
                        <div>
                          <span class="font-extrabold block text-pc-blue">Tarif calqué sur votre dimensionnement</span>
                          <span class="text-[11px] text-slate-500">Mise en concurrence avec la Croix-Rouge et l'Ordre de Malte</span>
                        </div>
                        <span class="font-mono font-bold text-pc-blue">${defaultVal} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else if (moduleKey === 'recrutement') {
      title.textContent = 'Pôle Recrutement, Notoriété & Réseaux Sociaux';
      subtitle.textContent = 'Développez la visibilité de l’antenne et intégrez de nouveaux bénévoles';
      icon.setAttribute('data-lucide', 'user-plus');

      body.innerHTML = `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold text-sky-900">Réseaux Sociaux (Instagram / TikTok)</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${this.resources.campaigns.social ? 'bg-emerald-600 text-white' : 'glass-button text-slate-600'}">
                    ${this.resources.campaigns.social ? 'ACTIF' : 'INACTIF'}
                  </span>
                </div>
                <p class="text-xs text-sky-700 mt-1">Génère des candidatures régulières de jeunes et étudiants (150 € / sem).</p>
              </div>
              <button onclick="window.game.toggleCampaign('social')" class="w-full py-2 rounded-xl text-xs font-bold ${this.resources.campaigns.social ? 'glass-button text-slate-700' : 'bg-sky-600 text-white'} shadow-sm transition">
                ${this.resources.campaigns.social ? 'Arrêter la campagne' : 'Activer la campagne (150 €)'}
              </button>
            </div>

            <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-xs font-extrabold text-amber-900">Affichage Municipal & Panneaux Mairie</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${this.resources.campaigns.posters ? 'bg-emerald-600 text-white' : 'glass-button text-slate-600'}">
                    ${this.resources.campaigns.posters ? 'ACTIF' : 'INACTIF'}
                  </span>
                </div>
                <p class="text-xs text-amber-700 mt-1">Attire des profils d'actifs et de professionnels de santé (200 € / sem).</p>
              </div>
              <button onclick="window.game.toggleCampaign('posters')" class="w-full py-2 rounded-xl text-xs font-bold ${this.resources.campaigns.posters ? 'glass-button text-slate-700' : 'bg-amber-600 text-white'} shadow-sm transition">
                ${this.resources.campaigns.posters ? 'Arrêter la campagne' : 'Activer la campagne (200 €)'}
              </button>
            </div>
          </div>

          <!-- Section Postes Salariés Ouverts (CDD / CDI) -->
          <div class="p-4 rounded-2xl glass-card border border-indigo-200/90 bg-gradient-to-r from-indigo-50/50 via-white to-blue-50/50 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-xs font-black uppercase text-indigo-950 tracking-wider">Postes Salariés Ouverts & Offres d’Emploi (${(this.jobOffers || []).length})</h4>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Forfait 151h • Code du Travail</span>
                </div>
                <p class="text-[11px] text-slate-500">Ouvrez des postes en CDD ou CDI avec missions définies. Les candidatures tombent dans les heures suivantes.</p>
              </div>
              <button onclick="window.ProtecPersonnel.openJobOfferModal(window.game)" class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 flex-shrink-0">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                + Ouvrir un Poste (CDD / CDI)
              </button>
            </div>

            <!-- Liste des offres ouvertes -->
            ${(!this.jobOffers || this.jobOffers.length === 0) ? `
              <p class="text-[11px] text-slate-500 italic p-3 bg-white/70 rounded-xl border border-dashed border-indigo-200 text-center">
                Aucun poste salarié ouvert actuellement. Cliquez sur « + Ouvrir un Poste » pour lancer une offre de recrutement (CDD ou CDI).
              </p>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                ${this.jobOffers.map(job => `
                  <div class="p-3.5 rounded-xl glass-card space-y-2 border border-indigo-100">
                    <div class="flex items-center justify-between">
                      <h5 class="text-xs font-black text-slate-900">${job.title}</h5>
                      <span class="px-2 py-0.5 rounded text-[10px] font-black ${job.contractType === 'CDI' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}">
                        ${job.contractType} ${job.durationMonths ? `(${job.durationMonths} mois)` : ''}
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-600 flex justify-between">
                      <span>Rémunération : <strong class="text-emerald-700 font-mono">${job.salary} € / mois</strong></span>
                      <span class="text-slate-400">• Forfait 151h</span>
                    </div>
                    <div class="flex flex-wrap gap-1 text-[9px] font-bold text-slate-600">
                      ${(job.missions || []).map(m => `<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">✓ ${m}</span>`).join('')}
                    </div>
                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span class="text-indigo-700 font-bold">${job.applicantsCount || 0} candidature(s) reçue(s)</span>
                      <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-black">${job.status === 'ouvert' ? 'Diffusion Active' : 'Poste Pourvu'}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Section Candidatures Reçues (Bénévoles & Salariés) -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Candidatures Reçues (${this.candidatures.length})</h4>
              <span class="text-[11px] text-slate-500 font-semibold">Entretien d’embauche / d’intégration requis avant signature</span>
            </div>

            ${this.candidatures.length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucune candidature pour l’instant. Activez une campagne bénévole ou publiez une offre de poste salarié.</p>' : ''}
            
            <div class="space-y-3">
              ${this.candidatures.map(cand => {
                const isSalarie = cand.type === 'salarie';
                return `
                  <div class="p-4 rounded-2xl glass-card space-y-3 border ${isSalarie ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200'}">
                    <div class="flex items-start gap-3">
                      <span class="text-3xl">${cand.avatar || '🙋'}</span>
                      <div class="flex-1">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <h5 class="text-sm font-extrabold text-slate-900">${cand.name} (${cand.age} ans)</h5>
                            <span class="px-2 py-0.5 rounded text-[10px] font-black ${isSalarie ? 'bg-indigo-600 text-white' : (cand.rank && cand.rank !== 'Stagiaire' ? 'bg-pc-blue text-white' : 'bg-slate-200 text-slate-700')}">
                              ${isSalarie ? `SALARIÉ • ${cand.contractType}` : (cand.rank || 'Bénévole')}
                            </span>
                            ${cand.isTrainer ? '<span class="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">🎓 Formateur</span>' : ''}
                          </div>

                          ${cand.interviewPassed ? `
                            <span class="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Note : ${cand.motivationGrade} ✓
                            </span>
                          ` : `
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Entretien requis
                            </span>
                          `}
                        </div>

                        ${isSalarie ? `
                          <!-- POUR LE SALARIÉ : PAS DE DISPONIBILITÉS PERSONNELLES (C'EST LE POSTE QUI JOUE) -->
                          <div class="mt-1 text-xs">
                            <p class="text-indigo-900 font-bold">Poste visé : « ${cand.jobOfferTitle} » (${cand.monthlySalary} €/mois)</p>
                            <p class="text-[11px] text-slate-500 italic mt-0.5">Disponibilités : Fixées par le contrat de travail (forfait 151h mensuelles, 35h/semaine).</p>
                          </div>
                        ` : `
                          <!-- POUR LE BÉNÉVOLE : DISPONIBILITÉS DÉTAILLÉES -->
                          <p class="text-xs text-slate-500 mt-1">${cand.job || 'Bénévole'} • Dispo : <strong class="text-pc-blue">${(cand.dispoJours || ['Samedi', 'Dimanche']).join(', ')}</strong></p>
                        `}

                        ${cand.skills && cand.skills.length > 0 ? `
                          <div class="flex flex-wrap gap-1 mt-1.5">
                            ${cand.skills.map(s => `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">✓ ${s}</span>`).join('')}
                          </div>
                        ` : ''}
                      </div>
                    </div>

                    <div class="p-3 rounded-xl bg-white/70 text-xs text-slate-700 italic border border-slate-100">
                      « ${cand.motivation} »
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div class="text-[11px] text-slate-400 font-semibold">
                        ${cand.interviewPassed ? 'Entretien réalisé • Bilan RH disponible' : 'Faites passer l’entretien pour évaluer la motivation'}
                      </div>
                      <div class="flex items-center gap-2">
                        <button onclick="window.game.rejectCandidature('${cand.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold glass-button text-slate-500 hover:text-rose-600 transition">
                          Décliner
                        </button>
                        
                        <button onclick="window.ProtecPersonnel.openInterviewModal(window.game, '${cand.id}')" class="px-4 py-2 rounded-xl text-xs font-black ${isSalarie ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-pc-blue hover:bg-pc-blue-light'} text-white shadow-md transition flex items-center gap-1.5">
                          <i data-lucide="mic" class="w-3.5 h-3.5"></i>
                          ${cand.interviewPassed ? 'Voir Compte-Rendu & Décider' : 'Faire Passer l’Entretien'}
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Section Statuts & Recrutement RH (Bénévoles, Services Civiques, Salariés) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200/80 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-slate-800">Bénévoles</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">0 € / mois</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Cœur associatif. Disponibilités variables selon le profil (parents, étudiants, actifs).</p>
              </div>
              <div class="text-[11px] font-extrabold text-pc-blue">
                Effectif : ${this.volunteers.filter(v => (v.contractType || 'benevole') === 'benevole').length} membres
              </div>
            </div>

            <div class="p-3.5 rounded-2xl glass-card border border-amber-200/80 bg-amber-50/30 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-amber-900">Services Civiques</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">115 € / mois</span>
                </div>
                <p class="text-[11px] text-amber-700 mt-1">Engagement jeune 24-35h/semaine. Très grande disponibilité opérationnelle.</p>
              </div>
              <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] font-extrabold text-amber-900">
                  Actifs : ${this.volunteers.filter(v => v.contractType === 'service_civique').length}
                </span>
                <button onclick="window.ProtecPersonnel.hireServiceCivique(window.game)" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition">
                  + Recruter (250 €)
                </button>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl glass-card border border-indigo-200/80 bg-indigo-50/30 flex flex-col justify-between space-y-2">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-indigo-900">Salariés Permanents</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">2 200 € / mois</span>
                </div>
                <p class="text-[11px] text-indigo-700 mt-1">Cadres 35h formateurs et coordinateurs. Forfait 151h mensuelles, repos légal de 11h consécutives.</p>
              </div>
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-extrabold text-indigo-900">
                    Actifs : ${this.volunteers.filter(v => v.contractType === 'salarie').length}
                  </span>
                  <button onclick="window.ProtecPersonnel.hireSalarie(window.game)" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
                    + Embaucher (1 200 €)
                  </button>
                </div>
                <button onclick="window.ProtecPersonnel.openSalarieManagementModal(window.game)" class="w-full py-1.5 rounded-xl text-xs font-black bg-indigo-100/80 hover:bg-indigo-200 text-indigo-900 border border-indigo-300/70 transition flex items-center justify-center gap-1.5 shadow-sm">
                  <i data-lucide="clock" class="w-3.5 h-3.5 text-indigo-700"></i>
                  Gérer Heures & Repos (Code du Travail)
                </button>
              </div>
            </div>
          </div>

          <!-- Section Agréments de Sécurité Civile Officiels (A, B, C, D) -->
          <div class="p-4 rounded-2xl glass-card border border-slate-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black uppercase text-slate-800 tracking-wider">Agréments de Sécurité Civile (Ministère & Préfecture)</h4>
                <p class="text-[11px] text-slate-500">Habilitations officielles obligatoires pour déverrouiller les types de missions.</p>
              </div>
              <span class="text-xs font-extrabold text-pc-blue">
                ${Object.values(this.resources.agrements || {}).filter(Boolean).length} / 4 Actifs
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${(window.ProtecPersonnel?.agrementsCatalog || []).map(agr => {
                const isOwned = this.resources.agrements && this.resources.agrements[agr.code];
                return `
                  <div class="p-3.5 rounded-2xl border ${isOwned ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white/80 border-slate-200'} flex flex-col justify-between space-y-2">
                    <div class="space-y-1">
                      <div class="flex items-center justify-between">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black ${isOwned ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}">
                          ${agr.category}
                        </span>
                        <span class="text-xs font-extrabold ${isOwned ? 'text-emerald-700' : 'mono-num text-slate-700'}">
                          ${isOwned ? 'VALIDÉ ✓' : agr.cost + ' €'}
                        </span>
                      </div>
                      <h5 class="text-xs font-black text-slate-900">${agr.title}</h5>
                      <p class="text-[11px] text-slate-500">${agr.desc}</p>
                      <div class="text-[10px] font-extrabold ${isOwned ? 'text-emerald-800' : 'text-pc-blue'}">
                        Débloque : ${agr.unlocks}
                      </div>
                    </div>

                    <div class="pt-2 border-t border-slate-100 flex justify-end">
                      ${isOwned ? `
                        <span class="text-[11px] font-black text-emerald-600">Audit Conforme</span>
                      ` : `
                        <button onclick="window.ProtecPersonnel.purchaseAgrement(window.game, '${agr.code}')" class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-pc-blue hover:bg-pc-blue-light text-white shadow-sm transition">
                          Déposer Dossier Préfecture (${agr.cost} €)
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Section Vie Associative & Cohésion d'Antenne -->
          <div class="p-4 rounded-2xl glass-card space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="text-xs font-extrabold text-indigo-900">Vie Associative & Cohésion d’Équipe</h4>
                <p class="text-[11px] text-indigo-700">Préservez l'énergie, remontez le moral et évitez les surmenages / burnouts.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button onclick="window.ProtecPersonnel.openSalarieManagementModal(window.game)" class="px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:brightness-110 shadow transition flex items-center gap-1">
                  <i data-lucide="briefcase" class="w-3.5 h-3.5"></i>
                  Salariés & Code du Travail
                </button>
                <button onclick="window.game.openModule('competences')" class="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600 text-white hover:bg-purple-700 shadow transition flex items-center gap-1">
                  <i data-lucide="award" class="w-3.5 h-3.5"></i>
                  Habilitations & Bureau
                </button>
                <button onclick="window.ProtecSystems.organizeTeamEvent(window.game, 'bbq')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 shadow transition">
                  🍖 Barbecue Convivial (150 €)
                </button>
                <button onclick="window.ProtecSystems.organizeTeamEvent(window.game, 'recyclage')" class="px-3 py-1.5 rounded-xl text-xs font-bold glass-button text-indigo-700 transition">
                  🎓 Recyclage FC PSE
                </button>
              </div>
            </div>

            <!-- Liste détaillée des secouristes en activité -->
            <div class="space-y-2 pt-2 border-t border-indigo-100/70">
              <span class="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Effectif Détaillé de l'Antenne (${this.volunteers.length})</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                ${this.volunteers.map(v => {
                  const energy = v.energy !== undefined ? v.energy : 85;
                  const motivation = v.motivation !== undefined ? v.motivation : 80;
                  const humeurScore = v.humeur !== undefined ? v.humeur : 80;
                  const humeur = window.ProtecPersonnel ? window.ProtecPersonnel.getHumeurLabel(humeurScore) : { label: 'Neutre', icon: '🙂' };
                  const contractLabel = v.contractType === 'salarie' ? 'Salarié Permanent' : (v.contractType === 'service_civique' ? 'Service Civique' : 'Bénévole');
                  const trait = window.ProtecPersonnel?.traits[v.trait] || { name: 'Secouriste standard' };

                  return `
                    <div class="p-3 rounded-2xl glass-card text-xs space-y-2 ${v.isBurnout ? 'border-2 border-red-400 bg-red-50/40' : ''}">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="text-xl">${v.avatar || '⛑️'}</span>
                          <div>
                            <div class="font-black text-slate-900 leading-tight">${v.name}</div>
                            <div class="text-[10px] text-slate-500 font-semibold">${v.rank} • ${contractLabel}</div>
                          </div>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-black ${v.isBurnout ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-700'}">
                          ${v.isBurnout ? 'BURNOUT / REPOS' : v.status.toUpperCase()}
                        </span>
                      </div>

                      <div class="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Profil : <strong>${v.dispoType || 'Disponible'}</strong></span>
                        <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">${trait.name}</span>
                      </div>

                      <div class="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-slate-100">
                        <div>
                          <div class="flex justify-between text-slate-500 mb-0.5">
                            <span>Énergie</span>
                            <strong class="${energy < 30 ? 'text-red-600' : 'text-slate-700'}">${energy}%</strong>
                          </div>
                          <div class="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                            <div class="h-full rounded-full ${energy < 30 ? 'bg-red-500' : 'bg-emerald-500'}" style="width: ${energy}%"></div>
                          </div>
                        </div>

                        <div>
                          <div class="flex justify-between text-slate-500 mb-0.5">
                            <span>Motivation</span>
                            <strong class="text-slate-700">${motivation}%</strong>
                          </div>
                          <div class="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                            <div class="h-full rounded-full bg-pc-blue" style="width: ${motivation}%"></div>
                          </div>
                        </div>

                        <div>
                          <div class="flex justify-between text-slate-500 mb-0.5">
                            <span>Humeur</span>
                            <span class="text-slate-700">${humeur.icon}</span>
                          </div>
                          <div class="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                            <div class="h-full rounded-full bg-amber-500" style="width: ${humeurScore}%"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (moduleKey === 'samu') {
      title.textContent = 'Permanence & Gardes SAMU 15 (AASC)';
      subtitle.textContent = 'Mise à disposition conventionnée d’ambulances VPSP et équipages au profit du SAMU départemental';
      icon.setAttribute('data-lucide', 'activity');

      const isGuardActive = this.samuGarde && this.samuGarde.active;
      const vpsps = this.vehicles.filter(v => v.type === 'VPSP');
      const dispoVpsps = vpsps.filter(v => v.status === 'dispo' || (isGuardActive && v.id === this.samuGarde.vehicleId));
      const qualifiedVolunteers = this.volunteers.filter(v => ['CE', 'PSE2', 'PSE1'].includes(v.rank) && (v.status === 'dispo' || (isGuardActive && this.samuGarde.crewVolunteerIds.includes(v.id))));
      const currentVpsp = isGuardActive ? this.vehicles.find(v => v.id === this.samuGarde.vehicleId) : null;
      const currentCrew = isGuardActive ? this.volunteers.filter(v => this.samuGarde.crewVolunteerIds.includes(v.id)) : [];
      const samuMissions = this.missions.filter(m => m.type === 'samu');

      body.innerHTML = `
        <div class="space-y-5">
          <!-- Carte Convention SAMU 15 -->
          <div class="p-4 rounded-2xl ${isGuardActive ? 'bg-gradient-to-r from-emerald-500/15 to-pc-blue/15 border-2 border-emerald-500' : 'glass-card-orange'} space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl ${isGuardActive ? 'bg-emerald-600 text-white' : 'bg-pc-orange text-white'} flex items-center justify-center font-bold text-lg shadow-sm">
                  🚑
                </div>
                <div>
                  <h4 class="text-sm font-black text-slate-900">Convention Cadre SAMU 15 & AASC</h4>
                  <p class="text-[11px] text-slate-600">
                    Mise à disposition opérationnelle en renfort des pompiers (BSPP/SDIS) et ambulanciers privés.
                  </p>
                </div>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-black ${isGuardActive ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'}">
                ${isGuardActive ? 'GARDE ACTIVE (RÉFLEXE 15)' : 'ASTREINTE FERMÉE'}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-white/70 border border-slate-200/60 text-xs text-slate-700 space-y-1">
              <div class="flex justify-between">
                <span>Rémunération indemnitaire convention :</span>
                <strong class="text-emerald-700 font-mono">280 à 480 € / intervention d'urgence</strong>
              </div>
              <div class="flex justify-between">
                <span>Équipage réglementaire requis :</span>
                <strong class="text-slate-800">1 VPSP + 3 à 4 secouristes (minimum 1 CE + 1 PSE2 + 1 PSE1)</strong>
              </div>
            </div>

            <!-- Actions d'armement de la garde -->
            <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              ${isGuardActive ? `
                <div class="text-xs text-emerald-800">
                  <span>Ambulance engagée : <strong>${currentVpsp?.name || 'VPSP'}</strong> • Équipage : <strong>${currentCrew.length} secouristes</strong></span>
                </div>
                <button onclick="window.game.stopSamuGuard()" class="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow transition">
                  Mettre fin à la Garde SAMU
                </button>
              ` : `
                <div class="text-xs text-slate-500">
                  ${vpsps.length === 0 ? '⚠️ Vous devez posséder au moins 1 VPSP pour conventionner avec le SAMU.' : `${dispoVpsps.length} VPSP et ${qualifiedVolunteers.length} secouristes qualifiés disponibles.`}
                </div>
                <button onclick="window.game.startSamuGuard()" ${vpsps.length === 0 || qualifiedVolunteers.length < 3 ? 'disabled class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed"' : 'class="px-4 py-2 rounded-xl text-xs font-black bg-pc-orange hover:bg-pc-orange-hover text-white shadow-md transition"'}>
                  Armer la Garde SAMU (VPSP)
                </button>
              `}
            </div>
          </div>

          <!-- Alertes & Missions de la garde en cours -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Départs Réflexes Régulés (${samuMissions.length})
              </h4>
              ${isGuardActive ? '<span class="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Écoute régulation 15 active</span>' : ''}
            </div>

            ${samuMissions.length === 0 ? `
              <div class="p-6 rounded-2xl glass-card text-center space-y-1">
                <p class="text-xs font-bold text-slate-700">Aucun départ réflexe régulé pour l'instant.</p>
                <p class="text-[11px] text-slate-500">
                  ${isGuardActive ? 'Le centre 15 vous dépêchera dès qu’une urgence survient sur votre secteur.' : 'Armez une Garde SAMU ci-dessus pour recevoir des appels réflexes du 15.'}
                </p>
              </div>
            ` : ''}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${samuMissions.map(m => `
                <div class="p-4 rounded-2xl glass-card space-y-2 border-l-4 border-pc-orange">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black bg-pc-orange text-white">APPEL RÉFLEXE 15</span>
                    <span class="text-xs font-bold mono-num text-emerald-700">+${m.rewardMoney} €</span>
                  </div>
                  <h4 class="text-sm font-extrabold text-slate-900">${m.title}</h4>
                  <p class="text-xs text-slate-600">${m.desc}</p>
                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[11px] text-slate-500 font-semibold">${m.scale}</span>
                    <button onclick="window.game.closeModal(); window.game.openMissionDetails('${m.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-pc-blue text-white hover:bg-pc-blue-light shadow-sm transition">
                      ${m.status === 'ongoing' ? 'Suivre Intervention' : 'Partir en Urgence'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (moduleKey === 'pompiers') {
      title.textContent = 'Garde Caserne Pompiers & Astreinte Domicile (SDIS)';
      subtitle.textContent = 'Mise à disposition opérationnelle VPSP en caserne pompiers et équipes d’astreinte rappelables';
      icon.setAttribute('data-lucide', 'flame');

      const sdis = this.sdisGarde || {};
      const isGuardActive = sdis.active;
      const vpsps = this.vehicles.filter(v => v.type === 'VPSP');
      const dispoVpsps = vpsps.filter(v => v.status === 'dispo' || (isGuardActive && v.id === sdis.vehicleId));
      const currentVpsp = isGuardActive ? this.vehicles.find(v => v.id === sdis.vehicleId) : null;
      
      const caserneCrewVols = (sdis.caserneCrew || []).map(id => this.volunteers.find(v => v.id === id)).filter(Boolean);
      const astreinteCrewVols = (sdis.astreinteCrew || []).map(id => this.volunteers.find(v => v.id === id)).filter(Boolean);
      const dispoVolunteers = this.volunteers.filter(v => v.status === 'dispo');

      const trustScore = this.prefectureState?.trustScore !== undefined ? this.prefectureState.trustScore : 85;
      const warningsCount = this.prefectureState?.warningsCount || 0;
      const isSuspended = this.prefectureState?.agrementSuspended || false;

      let trustColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      if (trustScore < 50) trustColor = 'text-red-700 bg-red-50 border-red-200';
      else if (trustScore < 75) trustColor = 'text-amber-700 bg-amber-50 border-amber-200';

      const sdisMissions = this.missions.filter(m => m.type === 'pompiers');

      body.innerHTML = `
        <div class="space-y-5">
          
          <!-- Statut Notoriété Préfecture & Services de l'État -->
          <div class="p-4 rounded-2xl border ${trustColor} flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${isSuspended ? '🚫' : (trustScore < 50 ? '⚠️' : '🏛️')}</span>
              <div>
                <h4 class="text-xs font-black uppercase tracking-wider">
                  Notoriété Services de l'État & Préfecture (SIDPC)
                </h4>
                <p class="text-[11px] opacity-90">
                  ${isSuspended ? '🚨 <strong>AGRÉMENT SUSPENDU :</strong> Défaut répété de gestion ou retards intolérables. Déposez un recours.' : 'Évaluation continue de la ponctualité, compétences des équipages et respect des consignes.'}
                </p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-black mono-num block">${trustScore} / 100</span>
              <span class="text-[10px] font-bold ${warningsCount > 0 ? 'text-red-600' : 'text-slate-500'}">
                ${warningsCount > 0 ? `⚠️ ${warningsCount} avertissement(s)` : 'Situation Conforme ✓'}
              </span>
            </div>
          </div>

          <!-- Configuration du Dispositif Garde Postée & Astreinte -->
          <div class="p-5 rounded-2xl glass-card space-y-4 border ${isGuardActive ? 'border-red-400 bg-red-50/20' : 'border-slate-200'}">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl ${isGuardActive ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-700'} flex items-center justify-center text-lg font-black shadow-sm">
                  🚒
                </div>
                <div>
                  <h4 class="text-sm font-black text-slate-900">
                    ${isGuardActive ? `Garde SDIS en cours : ${sdis.eventName || 'Dispositif Sécuritaire'}` : 'Organiser une Garde Caserne & Astreinte Domicile'}
                  </h4>
                  <p class="text-[11px] text-slate-500">
                    ${isGuardActive ? sdis.eventReason : 'En cas de violences urbaines, mouvements sociaux ou festivités sensibles, positionnez un VPSP en caserne pompiers et une équipe d’astreinte à domicile.'}
                  </p>
                </div>
              </div>

              <span class="px-3 py-1 rounded-full text-xs font-black ${isGuardActive ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}">
                ${isGuardActive ? 'DISPOSITIF ARMÉ' : 'HORS SERVICE'}
              </span>
            </div>

            ${!isGuardActive ? `
              <!-- Paramétrage par le joueur -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label class="font-extrabold text-slate-800 block">Contexte opérationnel :</label>
                  <select id="sdis-event-select" class="w-full p-2 rounded-lg bg-white border border-slate-300 font-bold text-xs">
                    <option value="violences_urbaines">Violences urbaines & Mouvements lycéens (Tension élevée)</option>
                    <option value="fete_nationale">Dispositif renforcé Nuit du 14 Juillet</option>
                    <option value="greve_transports">Astreinte Débordements & Grands Rassemblements</option>
                    <option value="garde_sdis_renfort">Garde Caserne Pompier Classique (Renfort VSAV)</option>
                  </select>
                </div>

                <div class="p-3 rounded-xl bg-red-50/70 border border-red-200 space-y-1.5">
                  <div class="flex justify-between items-center">
                    <label class="font-extrabold text-red-900 block">Équipe Garde Caserne (VPSP) :</label>
                    <span id="sdis-caserne-count-badge" class="font-bold text-red-700">3 pers</span>
                  </div>
                  <input type="range" id="sdis-caserne-slider" min="2" max="4" value="3" oninput="document.getElementById('sdis-caserne-count-badge').textContent = this.value + ' pers'" class="w-full accent-red-600">
                  <p class="text-[10px] text-red-700">Présents physiquement à la caserne, départ sous 2 min.</p>
                </div>

                <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <div class="flex justify-between items-center">
                    <label class="font-extrabold text-amber-900 block">Équipe Astreinte Domicile :</label>
                    <span id="sdis-astreinte-count-badge" class="font-bold text-amber-700">2 pers</span>
                  </div>
                  <input type="range" id="sdis-astreinte-slider" min="0" max="4" value="2" oninput="document.getElementById('sdis-astreinte-count-badge').textContent = this.value + ' pers'" class="w-full accent-amber-600">
                  <p class="text-[10px] text-amber-700">Chez eux, rappelables sous 15 min en cas de débordement.</p>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span class="text-slate-500">
                  ${dispoVpsps.length === 0 ? '⚠️ Aucun VPSP disponible.' : `${dispoVpsps.length} VPSP et ${dispoVolunteers.length} secouristes disponibles.`}
                </span>
                <button onclick="window.game.armSdisDispositif()" ${dispoVpsps.length === 0 || dispoVolunteers.length < 3 || isSuspended ? 'disabled class="px-5 py-2.5 rounded-xl font-black bg-slate-200 text-slate-400 cursor-not-allowed"' : 'class="px-5 py-2.5 rounded-xl font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 transition flex items-center gap-1.5"'}>
                  <i data-lucide="shield-alert" class="w-4 h-4"></i>
                  Armer la Garde Pompiers & Astreinte
                </button>
              </div>
            ` : `
              <!-- Dispositif Actif : Suivi direct et interaction continue -->
              <div class="space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div class="p-3.5 rounded-xl bg-red-100/60 border border-red-300 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-black text-red-950 flex items-center gap-1.5">
                        <i data-lucide="radio" class="w-4 h-4 text-red-600"></i>
                        Postés à la Caserne (${caserneCrewVols.length} secouristes)
                      </span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">Prêt au départ</span>
                    </div>
                    <div class="space-y-1 text-[11px] text-red-900">
                      <div>Ambulance : <strong>${currentVpsp?.name || 'VPSP'}</strong></div>
                      <div>Équipage : <strong>${caserneCrewVols.map(v => `${v.name} (${v.rank})`).join(', ')}</strong></div>
                    </div>
                  </div>

                  <div class="p-3.5 rounded-xl bg-amber-100/60 border border-amber-300 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="font-black text-amber-950 flex items-center gap-1.5">
                        <i data-lucide="home" class="w-4 h-4 text-amber-600"></i>
                        Astreinte Domicile (${astreinteCrewVols.length} secouristes)
                      </span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">Dispo appel</span>
                    </div>
                    <div class="space-y-1 text-[11px] text-amber-900">
                      <div>Délai de rappel estimé : <strong>10 à 15 min</strong></div>
                      <div>Secouristes : <strong>${astreinteCrewVols.length > 0 ? astreinteCrewVols.map(v => `${v.name} (${v.rank})`).join(', ') : 'Aucun'}</strong></div>
                    </div>
                    ${astreinteCrewVols.length > 0 ? `
                      <button onclick="window.game.recallAstreinteCrewToCaserne()" class="w-full py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition">
                        Biper & Rappeler l'astreinte en caserne
                      </button>
                    ` : ''}
                  </div>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div class="text-slate-600">
                    Dispositif armé pour <strong>${sdis.durationHours || 6} heures</strong> • Satisfaction Préfecture : <strong class="text-red-700">${sdis.stateSatisfaction || 100}%</strong>
                  </div>
                  <button onclick="window.game.disarmSdisDispositif()" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition">
                    Mettre fin au dispositif
                  </button>
                </div>
              </div>
            `}
          </div>

          <!-- Alertes & Missions de renfort pompiers -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Interventions & Renforts Pompiers en cours (${sdisMissions.length})
              </h4>
              ${isGuardActive ? '<span class="text-[11px] font-bold text-red-600 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Veille opérationnelle CODIS active</span>' : ''}
            </div>

            ${sdisMissions.length === 0 ? `
              <div class="p-6 rounded-2xl glass-card text-center space-y-1">
                <p class="text-xs font-bold text-slate-700">Aucun départ pompiers en attente.</p>
                <p class="text-[11px] text-slate-500">
                  ${isGuardActive ? 'Le CTA-CODIS ou le centre 15 sonnera votre équipe dès qu’un départ réflexe ou un débordement survient.' : 'Armez le dispositif ci-dessus pour engager votre équipage en garde caserne.'}
                </p>
              </div>
            ` : ''}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${sdisMissions.map(m => `
                <div class="p-4 rounded-2xl glass-card space-y-2 border-l-4 border-red-600">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white">DÉPART POMPIERS</span>
                    <span class="text-xs font-bold mono-num text-emerald-700">+${m.rewardMoney} €</span>
                  </div>
                  <h4 class="text-sm font-extrabold text-slate-900">${m.title}</h4>
                  <p class="text-xs text-slate-600">${m.desc}</p>
                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[11px] text-slate-500 font-semibold">${m.scale}</span>
                    <button onclick="window.game.closeModal(); window.game.openMissionDetails('${m.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-sm transition">
                      ${m.status === 'ongoing' ? 'Suivre Intervention' : 'Départ Immédiat'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      `;
    } else if (moduleKey === 'social') {
      if (window.ProtecSocial) {
        window.ProtecSocial.renderModal(this);
      } else {
        title.textContent = 'Pôle Action Sociale & Solidarité';
        subtitle.textContent = 'Maraudes de nuit et écoute pour les personnes vulnérables';
        icon.setAttribute('data-lucide', 'heart-handshake');

        const socialMissions = this.missions.filter(m => m.type === 'social');
        body.innerHTML = `
          <div class="space-y-4">
            <div class="p-4 rounded-2xl glass-card-purple text-xs text-purple-950">
              Distribution de kits d'hygiène et couvertures isothermes. Fort impact sur la notoriété municipale.
            </div>
            ${socialMissions.length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucune maraude planifiée.</p>' : ''}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${socialMissions.map(m => `
                <div class="p-4 rounded-2xl glass-card space-y-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">MARAUDE</span>
                  <h4 class="text-sm font-extrabold text-slate-900">${m.title}</h4>
                  <p class="text-xs text-slate-600">${m.desc}</p>
                  <div class="pt-2 border-t border-slate-100/70 flex justify-end">
                    <button onclick="window.game.closeModal(); window.game.openMissionDetails('${m.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:brightness-110 shadow-sm transition">Déployer</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    } else if (moduleKey === 'formation') {
      if (window.ProtecFormations) {
        window.ProtecFormations.renderModal(this);
      } else {
        title.textContent = 'Pôle Pédagogique & Évolution Interne';
        subtitle.textContent = 'Parcours de formation et stages de qualification';
        icon.setAttribute('data-lucide', 'graduation-cap');

        const volunteersToPromote = this.volunteers.filter(v => v.status === 'dispo');

        body.innerHTML = `
          <div class="space-y-4">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Arbre de qualification interne</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              ${volunteersToPromote.map(v => {
                let nextRank = null;
                let cost = 0;
                if (v.rank === 'Stagiaire') { nextRank = 'PSE1'; cost = 80; }
                else if (v.rank === 'PSE1') { nextRank = 'PSE2'; cost = 150; }
                else if (v.rank === 'PSE2') { nextRank = 'CE'; cost = 250; }
                else if (v.rank === 'CE') { nextRank = 'CD'; cost = 400; }

                return `
                  <div class="p-3 rounded-2xl glass-card flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <span class="text-xl">${v.avatar}</span>
                      <div>
                        <div class="text-xs font-bold text-slate-900">${v.name}</div>
                        <div class="text-[10px] text-slate-500">${v.rank} (${v.exp} XP)</div>
                      </div>
                    </div>
                    ${nextRank ? `
                      <button onclick="window.game.upgradeVolunteer('${v.id}', '${nextRank}')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold glass-button hover:bg-pc-blue hover:text-white transition text-slate-700">
                        ${nextRank} (${cost}€)
                      </button>
                    ` : `
                      <span class="px-2 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Cadre</span>
                    `}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    } else if (moduleKey === 'base') {
      title.textContent = 'Antennes & Flotte';
      subtitle.textContent = 'Gestion des locaux et des véhicules';
      icon.setAttribute('data-lucide', 'building-2');

      const isLeader = this.player.deptRole === 'antenne_principale';
      const deptCode = this.currentDepartmentCode || this.player.departmentCode || '75';
      const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(deptCode) : null;

      body.innerHTML = `
        <div class="space-y-4">
          <!-- Carte d'affiliation départementale -->
          <div class="p-4 rounded-2xl ${isLeader ? 'bg-gradient-to-r from-pc-blue/15 to-indigo-100/60 border border-pc-blue/30' : 'bg-slate-50 border border-slate-200'} space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">${isLeader ? '🏛️' : '🏢'}</span>
                <div>
                  <h4 class="text-xs font-black uppercase text-slate-900 tracking-wider">
                    Département ${deptInfo?.name || deptCode} (${deptCode})
                  </h4>
                  <p class="text-[11px] text-slate-500 font-semibold">
                    Statut : <strong class="${isLeader ? 'text-pc-blue' : 'text-slate-700'}">${isLeader ? 'Antenne Principale du Département (Fondateur)' : 'Antenne Départementale Rattachée'}</strong>
                  </p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-xl text-[10px] font-black ${isLeader ? 'bg-pc-blue text-white shadow-sm' : 'bg-slate-200 text-slate-700'}">
                ${isLeader ? 'PRINCIPALE' : 'TERRITORIALE'}
              </span>
            </div>

            ${isLeader ? `
              <div class="pt-2 border-t border-pc-blue/20 flex items-center justify-between text-xs">
                <span class="text-[11px] text-slate-600">Vous détenez l'antenne principale. Vous pouvez la léguer à un collègue du département.</span>
                <button onclick="window.game.openTransferAntennaModal()" class="px-3 py-1.5 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-pc-blue border border-pc-blue/30 shadow-sm transition">
                  Léguer l'Antenne ➜
                </button>
              </div>
            ` : `
              <p class="text-[11px] text-slate-500">
                Vous intervenez en coordination avec l'Antenne Principale de votre département.
              </p>
            `}
          </div>

          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Votre Antenne Opérationnelle (${this.stations.length})</h4>
            <span class="text-[11px] font-bold text-slate-500">Antenne Unique de Direction</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${this.stations.map(st => `
              <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h5 class="text-sm font-extrabold text-slate-900">${st.name}</h5>
                    <span class="text-[10px] font-bold text-slate-400">Dépt ${st.departmentCode || deptCode}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-blue text-white">Niveau ${st.level}</span>
                </div>
                <div class="text-xs text-slate-600">Véhicules : <strong>${st.vehicles.length}</strong></div>
                <div class="grid grid-cols-2 gap-2">
                  <button onclick="window.game.closeModal(); window.game.openStationDetails('${st.id}')" class="py-2 rounded-xl text-xs font-bold glass-button text-slate-700 transition">
                    Gérer l’antenne
                  </button>
                  <button onclick="window.game.openModule('amenagement')" class="py-2 rounded-xl text-xs font-black bg-pc-blue/10 hover:bg-pc-blue/20 text-pc-blue transition flex items-center justify-center gap-1">
                    <i data-lucide="hammer" class="w-3.5 h-3.5"></i>
                    Aménager
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (moduleKey === 'radio') {
      title.textContent = 'Canal Radio & Main Courante Opérationnelle';
      subtitle.textContent = 'Fréquence inter-services, transmissions officielles et codes statuts S1 à S6';
      icon.setAttribute('data-lucide', 'radio');
      if (window.ProtecModals) {
        body.innerHTML = window.ProtecModals.renderRadio(this);
      }
    } else if (moduleKey === 'logistique') {
      title.textContent = 'Pôle Logistique, Pharmacie & Garage';
      subtitle.textContent = 'Gestion des stocks médicaux d’urgence et maintenance de la flotte';
      icon.setAttribute('data-lucide', 'package-check');
      if (window.ProtecModals) {
        body.innerHTML = window.ProtecModals.renderLogistique(this);
      }
    } else if (moduleKey === 'meteo') {
      title.textContent = 'Bulletin Météo-France & Vigilance Préfectorale';
      subtitle.textContent = 'Surveillance des risques départementaux et consignes de sécurité civile';
      icon.setAttribute('data-lucide', 'cloud-sun');
      if (window.ProtecModals) {
        body.innerHTML = window.ProtecModals.renderMeteo(this);
      }
    } else if (moduleKey === 'recompenses') {
      title.textContent = 'Récompenses Quotidiennes & Défis';
      subtitle.textContent = 'Série de connexions, dotations fédérales et objectifs de l’antenne';
      icon.setAttribute('data-lucide', 'gift');
      if (window.ProtecAdvancedModals) {
        body.innerHTML = window.ProtecAdvancedModals.renderRewards(this);
      }
    } else if (moduleKey === 'amenagement') {
      title.textContent = 'Aménagement & Évolution du Local';
      subtitle.textContent = 'Améliorez vos pièces pour débloquer des bonus passifs permanents';
      icon.setAttribute('data-lucide', 'hammer');
      if (window.ProtecAdvancedModals) {
        body.innerHTML = window.ProtecAdvancedModals.renderStationRooms(this, this.selectedStationId || this.stations[0]?.id);
      }
    } else if (moduleKey === 'poles') {
      if (window.ProtecPoles) {
        window.ProtecPoles.renderModal(this);
      }
    } else if (moduleKey === 'competences') {
      if (window.ProtecPoles) {
        window.ProtecPoles.renderModal(this);
      } else if (window.ProtecAdvancedModals) {
        title.textContent = 'Arbre de Compétences & Bureau d’Antenne';
        subtitle.textContent = 'Habilitations individuelles des secouristes et gouvernance associative';
        icon.setAttribute('data-lucide', 'award');
        body.innerHTML = window.ProtecAdvancedModals.renderVolunteerSkills(this);
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  async openTransferAntennaModal() {
    const deptCode = this.currentDepartmentCode || this.player.departmentCode || '75';
    let deptInfo = null;
    try {
      const res = await fetch(`/api/department/info?code=${deptCode}`);
      const data = await res.json();
      deptInfo = data.department;
    } catch (e) {}

    const otherAntennas = (deptInfo?.antennas || []).filter(a => a.playerId !== this.player.id);

    const modal = document.getElementById('main-modal');
    modal.classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Léguer l’Antenne Principale';
    document.getElementById('modal-subtitle').textContent = `Passation du commandement départemental (${deptCode})`;
    document.getElementById('modal-icon').setAttribute('data-lucide', 'crown');

    const body = document.getElementById('modal-body');
    if (otherAntennas.length === 0) {
      body.innerHTML = `
        <div class="space-y-4 text-center py-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl">🏛️</div>
          <h4 class="text-sm font-black text-slate-800">Aucun autre joueur dans ce département</h4>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">
            Vous êtes le seul directeur installé dans le département ${deptCode}. Dès qu'un autre joueur créera une antenne départementale ici, vous pourrez lui léguer la direction principale.
          </p>
        </div>
      `;
    } else {
      body.innerHTML = `
        <div class="space-y-4">
          <div class="p-3.5 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-xs">
            ⚠️ <strong>Transmission de commandement :</strong> En léguant l'Antenne Principale, le joueur choisi deviendra le nouveau titulaire départemental. Votre antenne deviendra une antenne départementale rattachée.
          </div>

          <h5 class="text-xs font-black uppercase text-slate-600">Directeurs du département éligibles :</h5>
          <div class="space-y-2">
            ${otherAntennas.map(a => `
              <div class="p-3.5 rounded-2xl glass-card flex items-center justify-between text-xs">
                <div>
                  <div class="font-black text-slate-900">${a.playerName}</div>
                  <div class="text-[11px] text-slate-500">${a.stationName}</div>
                </div>
                <button onclick="window.game.executeTransferAntenna('${deptCode}', '${a.playerId}', '${a.playerName}')" class="px-3.5 py-2 rounded-xl text-xs font-black bg-pc-blue hover:bg-pc-blue-light text-white shadow-sm transition">
                  Transmettre le Titre
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  async executeTransferAntenna(deptCode, newLeaderId, newLeaderName) {
    if (!confirm(`Confirmez-vous la passation de l’Antenne Principale du département ${deptCode} à ${newLeaderName} ?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('protec_auth_token');
      const res = await fetch('/api/department/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ departmentCode: deptCode, newLeaderId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.player.deptRole = 'antenne_departementale';
        localStorage.setItem('protec_dept_role', 'antenne_departementale');
        this.closeModal();
        this.showToast('Passation Effectuée', `L'Antenne Principale a été léguée à ${newLeaderName} avec succès.`, 'green');
        this.openModule('base');
        this.saveGame();
      } else {
        alert(data.error || 'Erreur lors de la passation.');
      }
    } catch (e) {
      alert('Erreur réseau lors de la passation.');
    }
  }

  proposeSpecialFormationModal() {
    const titles = [
      { t: 'Stage Chef de Dispositif (CD) & Commandement', type: 'CD', cost: 250, desc: 'Coordination de grands rassemblements et cellule de crise.' },
      { t: 'Stage Pilotage & Conduite d’Urgence VPSP', type: 'PILOTAGE', cost: 130, desc: 'Techniques de franchissement et sécurité convoi.' },
      { t: 'Stage Sauvetage Spécialisé & Milieu Périlleux', type: 'SECOURS_SPEC', cost: 200, desc: 'Évacuation en milieu difficile et assistance pompiers.' }
    ];
    const pick = titles[Math.floor(Math.random() * titles.length)];

    const payload = {
      organizerPlayerId: this.player.id,
      organizerName: this.player.name,
      allianceId: this.player.allianceId,
      title: pick.t,
      type: pick.type,
      desc: pick.desc,
      stationName: this.stations[0]?.name || 'Antenne Locale',
      costPerCandidate: pick.cost,
      maxCandidates: 6
    };

    fetch('/api/alliances/formation/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      this.formationsSpeciales.unshift(data.formation);
      this.showToast('Stage Fédéral Ouvert', `Le stage « ${pick.t} » est ouvert aux inscriptions de l'alliance !`, 'green');
      this.openModule('alliance');
    }).catch(() => {
      payload.id = `form-spec-${Date.now()}`;
      this.formationsSpeciales.unshift(payload);
      this.showToast('Stage Fédéral Ouvert', `Stage ouvert sur le réseau de l'alliance.`, 'green');
      this.openModule('alliance');
    });
  }

  upgradeVolunteer(volunteerId, nextRank) {
    const v = this.volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    const costs = { 'PSE1': 80, 'PSE2': 150, 'CE': 250, 'CD': 400 };
    const cost = costs[nextRank] || 100;

    if (this.resources.money < cost) {
      this.showToast('Fonds insuffisants', `La formation coûte ${cost} €.`, 'orange');
      return;
    }

    this.resources.money -= cost;
    v.rank = nextRank;
    if (nextRank === 'CE') v.role = 'Chef d’Équipe';
    if (nextRank === 'CD') v.role = 'Chef de Dispositif';
    if (nextRank === 'PSE2') v.role = 'Équipier Secouriste';
    if (nextRank === 'PSE1') v.role = 'Secouriste';

    this.updateStatsUI();
    this.saveGame();
    this.showToast('Promotion validée', `${v.name} est désormais certifié ${nextRank} !`, 'green');
    this.openModule('formation');
  }

  openBuyVehicleModal(stationId) {
    const modal = document.getElementById('main-modal');
    modal.classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Commander un Véhicule Opérationnel';
    document.getElementById('modal-subtitle').textContent = 'Flotte d’urgence, de logistique, fluviale et commandement';
    document.getElementById('modal-icon').setAttribute('data-lucide', 'truck');

    if (window.ProtecAdvancedModals) {
      document.getElementById('modal-body').innerHTML = window.ProtecAdvancedModals.renderVehicleShop(this, stationId);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  buyVehicle(stationId, type) {
    const cost = type === 'VPSP' ? 3200 : 1800;
    if (this.resources.money < cost) {
      this.showToast('Trésorerie insuffisante', `L’achat requiert ${cost} €.`, 'orange');
      return;
    }

    const station = this.stations.find(s => s.id === stationId);
    if (!station) return;

    this.resources.money -= cost;
    const vehId = `${type.toLowerCase()}-${Date.now()}`;
    const newVeh = {
      id: vehId,
      name: `${type} 0${station.vehicles.length + 1}`,
      type: type,
      label: type === 'VPSP' ? 'Ambulance de Premiers Secours' : 'Véhicule Social & Logistique',
      capacity: 4,
      status: 'dispo',
      stationId: stationId,
      image: this.getVehicleImage(type)
    };

    this.vehicles.push(newVeh);
    station.vehicles.push(vehId);

    this.closeModal();
    this.updateStatsUI();
    this.renderStations();
    this.saveGame();
    this.syncPlayerToServer();
    this.showToast('Véhicule livré', `${newVeh.name} est prêt au départ !`, 'green');
    this.openStationDetails(stationId);
  }

  getVehicleImage(type) {
    const clean = (type || 'VPSP').toUpperCase();
    const map = {
      'VPSP': 'images/vehicles/VPSP.png',
      'VTU': 'images/vehicles/VTU.png',
      'VL': 'images/vehicles/VL.png',
      'VLM': 'images/vehicles/VL.png',
      'VLHR': 'images/vehicles/VLHR.png',
      'PCM': 'images/vehicles/PCM.png',
      'VPC': 'images/vehicles/PCM.png',
      'VTP': 'images/vehicles/VTP.png',
      'VAHU': 'images/vehicles/VAHU.png',
      'VCYN': 'images/vehicles/VCYN.png',
      'FLIT': 'images/vehicles/FLIT.png',
      'VST': 'images/vehicles/VST.png',
      'VTD': 'images/vehicles/VTD.png',
      'ERS': 'images/vehicles/ERS.png',
      'BLS': 'images/vehicles/ERS.png',
      'MOTO': 'images/vehicles/Moto.png',
      'QUAD': 'images/vehicles/QUAD.png',
      'VELO': 'images/vehicles/VELO.png',
      'REM': 'images/vehicles/REM.png'
    };
    return map[clean] || `images/vehicles/${type}.png`;
  }

  closeModal() {
    const modal = document.getElementById('main-modal');
    if (modal) modal.classList.add('hidden');
    this.modalHistory = [];
    this.currentModalKey = null;
    const backBtn = document.getElementById('modal-back-btn');
    if (backBtn) backBtn.classList.add('hidden');
  }

  goBackModal() {
    if (this.modalHistory && this.modalHistory.length > 0) {
      const prevKey = this.modalHistory.pop();
      this.openModule(prevKey, true);
    } else {
      this.closeModal();
    }
  }

  handleBackdropClick(event) {
    if (this.modalHistory && this.modalHistory.length > 0) {
      this.goBackModal();
    } else {
      this.closeModal();
    }
  }

  openOverviewModal() { this.openModule('planning'); }
  openFinancesModal() { this.openModule('devis'); }
  openTeamModal() { this.openModule('recrutement'); }
  openReputationModal() { this.openModule('recrutement'); }

  openMobileMenu() {
    const sheet = document.getElementById('mobile-modules-sheet');
    if (sheet) {
      sheet.classList.remove('hidden');
      sheet.classList.add('flex');
      if (window.lucide) window.lucide.createIcons();
    }
  }

  closeMobileMenu() {
    const sheet = document.getElementById('mobile-modules-sheet');
    if (sheet) {
      sheet.classList.add('hidden');
      sheet.classList.remove('flex');
    }
  }

  setFilter(filterKey) {
    this.currentFilter = filterKey;
    ['all', 'dps', 'samu', 'meteo', 'pompiers', 'social', 'crise'].forEach(f => {
      const btn = document.getElementById(`filter-btn-${f}`);
      if (!btn) return;
      if (f === filterKey) {
        btn.classList.add('border-pc-blue/40', 'text-pc-blue', 'font-bold');
        btn.classList.remove('text-slate-600', 'font-semibold');
      } else {
        btn.classList.remove('border-pc-blue/40', 'text-pc-blue', 'font-bold');
        btn.classList.add('text-slate-600', 'font-semibold');
      }
    });

    this.renderMissions();
  }

  // --- GESTIONNAIRE DE TEMPS RÉEL (1 SECONDE = 1 SECONDE RÉELLE) ---
  startSimulationClock() {
    setInterval(() => {
      const now = new Date();
      this.clock.hour = now.getHours();
      this.clock.minute = now.getMinutes();
      this.clock.second = now.getSeconds();
      this.clock.day = now.getDate();
      this.clock.month = now.getMonth();
      this.clock.year = now.getFullYear();

      const currentTime = Date.now();

      // 1. Progression des missions en cours (Vraie durée)
      this.missions.forEach(m => {
        if (m.status === 'ongoing') {
          if (!m.startedAt) m.startedAt = currentTime;
          if (!m.durationSeconds) {
            if (m.type === 'samu') m.durationSeconds = 25 * 60; // 25 min réelles
            else if (m.type === 'social') m.durationSeconds = 2 * 3600; // 2 heures réelles
            else if (m.durationHours) m.durationSeconds = Math.round(m.durationHours * 3600);
            else m.durationSeconds = 1800; // 30 min
          }
          if (!m.endsAt) m.endsAt = m.startedAt + (m.durationSeconds * 1000);

          m.progress = Math.min(m.durationSeconds, Math.floor((currentTime - m.startedAt) / 1000));
          if (currentTime >= m.endsAt) {
            this.completeMission(m);
          }
        }
      });

      // 1d. GESTION DES SALARIÉS, CODE DU TRAVAIL ET VACATIONS INTERNES
      if (window.ProtecPersonnel) {
        window.ProtecPersonnel.updateSalariesClock(this);
        const salarieModalOpen = document.getElementById('main-modal');
        const modalTitle = document.getElementById('modal-title');
        if (salarieModalOpen && !salarieModalOpen.classList.contains('hidden') && modalTitle && modalTitle.textContent.includes('Direction RH : Salariés')) {
          const body = document.getElementById('modal-body');
          if (body) {
            body.innerHTML = window.ProtecPersonnel.renderSalarieManagementHTML(this);
            if (window.lucide) window.lucide.createIcons();
          }
        }
      }

      // 1b. DÉPART AUTOMATIQUE DES DPS À L'HEURE DU POSTE
      if (this.clock.second === 0) {
        this.missions.forEach(m => {
          if (m.type === 'dps' && m.status === 'planifie') {
            const isToday = this.clock.day === m.eventDate?.day;
            const targetHour = m.startHour || m.eventDate?.hour || 14;
            const isHourReached = isToday && this.clock.hour >= targetHour;

            if (isHourReached) {
              const registered = m.registeredVolunteers?.length || 0;
              if (registered >= m.requiredVolunteers && !m.autoLaunched) {
                m.autoLaunched = true;
                this.launchScheduledMission(m.id);
                this.showToast('Début du Poste !', `C’est l’heure ! « ${m.title} » débute sur les lieux (${registered} secouristes en mission).`, 'blue');
              } else if (registered < m.requiredVolunteers && !m.alertLateShown) {
                m.alertLateShown = true;
                this.showToast('Retard Prise de Poste !', `L’heure du poste « ${m.title} » est arrivée mais l’effectif est incomplet (${registered}/${m.requiredVolunteers}) ! L’organisateur attend son dispositif.`, 'orange');
              }
            }
          }
        });
      }

      // 1c. GESTION DES PRÉALERTES ÉVOLUTIVES (Météo / SNCF / Préfecture)
      this.missions.forEach(m => {
        if (m.status === 'prealerte') {
          if (typeof m.prealertSecondsLeft === 'number') {
            m.prealertSecondsLeft--;
            if (m.prealertSecondsLeft <= 0) {
              // Fin du compte à rebours de veille préfectorale : arbitrage évolutif
              // 35% d'évolution favorable (levée d'alerte, indemnité) vs 65% d'aggravation (déclenchement opérationnel immédiat)
              if (Math.random() < 0.35) {
                this.resolvePrealertFavorable(m);
              } else {
                this.resolvePrealertAggravation(m);
              }
            }
          }
        }
      });

      // 2. Vérification des incidents rares et variés en mission (toutes les 4 secondes)
      if (this.clock.second % 4 === 0 && window.ProtecIncidents) {
        window.ProtecIncidents.checkOngoingMissions(this);
      }

      // 3. Dispatch dynamique d'urgences SAMU 15 (uniquement si une Garde SAMU 15 est activée par convention)
      if (this.clock.second === 15 || this.clock.second === 45) {
        if (this.stations.length > 0 && this.samuGarde && this.samuGarde.active) {
          if (Math.random() < 0.28) {
            this.triggerRandomSamuEmergency();
          }
        }
      }

      // 3b. Dispatch d'interventions SDIS Pompiers (uniquement si une Garde Caserne Pompiers est armée)
      if (this.clock.second === 5 || this.clock.second === 35) {
        if (this.stations.length > 0 && this.sdisGarde && this.sdisGarde.active) {
          // Si violences urbaines ou 14 juillet, intensité plus soutenue
          const chance = (this.sdisGarde.eventSeverity === 'critique' || this.sdisGarde.eventSeverity === 'eleve') ? 0.35 : 0.20;
          if (Math.random() < chance) {
            this.triggerRandomSdisEmergency();
          }
        }
      }

      // 3c. Contrôle des retards de départ SDIS Pompiers (Temps imparti dépassé = sanction Préfecture)
      if (this.clock.second % 5 === 0) {
        const pendingSdis = this.missions.filter(m => m.type === 'pompiers' && m.status === 'planifie');
        pendingSdis.forEach(m => {
          if (m.spawnedAt && m.maxResponseMinutes) {
            const elapsedMins = (currentTime - m.spawnedAt) / 60000;
            if (elapsedMins > m.maxResponseMinutes && !m.sanctionApplied) {
              m.sanctionApplied = true;
              this.applyPrefectureSanction(`Retard inacceptable de départ sur réquisition pompiers (${Math.round(elapsedMins)} min d'attente)`, 18);
            }
          }
        });
      }

      // 3d. Déclenchement périodique d'incident réseau ferré SNCF (si Convention signée)
      if (this.clock.second === 20 && this.clock.minute % 10 === 0) {
        if (this.stations.length > 0 && this.sncfConvention && this.sncfConvention.signed) {
          if (Math.random() < 0.35) {
            this.triggerSncfPrealert();
          }
        }
      }

      // 4. Sollicitations spontanées des organisateurs locaux (toutes les 2 à 3 minutes selon popularité & pub)
      if (this.clock.second === 0 && this.clock.minute % 2 === 0) {
        if (this.stations.length > 0) {
          let devisChance = 0.20; // Chance de base
          const repScore = this.resources.reputationScore || 0;
          devisChance += Math.min(0.35, repScore / 1000); // Bonus réputation
          if (this.resources.campaigns.social) devisChance += 0.25; // Bonus com réseaux
          if (this.resources.campaigns.posters) devisChance += 0.20; // Bonus com affichage
          
          const pendingDevisCount = this.devis.filter(d => d.status === 'pending').length;
          if (pendingDevisCount < 4 && Math.random() < devisChance) {
            this.generateRandomDevisOpportunity();
          }
        }
      }

      // 5. Arrivée de nouvelles candidatures spontanées
      if (this.clock.second === 0 && this.clock.minute % 6 === 0) {
        let candChance = 0.35;
        if (this.resources.campaigns.social) candChance += 0.30;
        if (this.resources.campaigns.posters) candChance += 0.25;
        if (Math.random() < candChance) {
          this.generateRandomCandidature();
        }
      }

      // 6. Transits routiers animés et météo dynamique
      if (window.ProtecSystems) {
        window.ProtecSystems.updateTransits(this);
        window.ProtecSystems.updateWeatherAndDayNight(this);
      }

      // 7. Micro-dons citoyens en ligne
      if (this.grants && this.grants.publicDonationsActive && this.clock.second === 0 && Math.random() < 0.25) {
        const don = 25 + Math.floor(Math.random() * 50);
        this.resources.money += don;
        this.showToast('Don en Ligne Reçu !', `Un citoyen reconnaissant a versé ${don} € à l’association.`, 'green');
        this.updateStatsUI();
      }

      // 8. Régénération avancée de l'énergie, moral et gestion du burnout au repos
      if (this.clock.second === 0 && this.clock.minute % 2 === 0) {
        if (window.ProtecPersonnel) {
          window.ProtecPersonnel.applyRestCycle(this);
          window.ProtecPersonnel.processSalariesAndStipends(this);
        } else {
          this.volunteers.forEach(v => {
            if (v.status === 'dispo' && v.energy < 100) {
              v.energy = Math.min(100, (v.energy || 80) + 3);
            }
          });
        }
      }

      this.updateClockUI();

      if (this.selectedMissionId) {
        const cur = this.missions.find(m => m.id === this.selectedMissionId);
        if (cur && (cur.status === 'ongoing' || cur.status === 'prealerte')) {
          this.openMissionDetails(cur.id);
        }
      }

    }, 1000);
  }

  updateClockUI() {
    const hh = String(this.clock.hour).padStart(2, '0');
    const mm = String(this.clock.minute).padStart(2, '0');
    const ss = String(this.clock.second || 0).padStart(2, '0');

    const timeEl = document.getElementById('clock-time');
    if (timeEl) timeEl.textContent = `${hh}:${mm}:${ss}`;

    const timeMobileEl = document.getElementById('clock-time-mobile');
    if (timeMobileEl) timeMobileEl.textContent = `${hh}:${mm}`;

    const dateEl = document.getElementById('clock-date');
    if (dateEl) {
      dateEl.textContent = this.formatShortDate(this.clock) + ` ${this.clock.year}`;
    }
  }

  // Calcul des moyens réels du joueur pour dimensionner les interventions
  calculatePlayerCapacity() {
    const totalVolunteers = this.volunteers.length;
    const availableVolunteers = this.volunteers.filter(v => v.status === 'dispo').length;
    const vpspCount = this.vehicles.filter(v => v.type === 'VPSP').length;
    const vtuCount = this.vehicles.filter(v => v.type === 'VTU').length;
    const vlCount = this.vehicles.filter(v => v.type === 'VL').length;
    const ceCount = this.volunteers.filter(v => v.rank === 'CE' || v.rank === 'CD' || v.rank === 'Cadre').length;

    let tier = 1; // Débutant (PAPS 2-4 pers)
    if (totalVolunteers >= 18 && vpspCount >= 2) tier = 3; // Confirmé (DPS-ME)
    else if (totalVolunteers >= 7 && vpspCount >= 1) tier = 2; // Opérationnel (DPS-PE)
    if (totalVolunteers >= 28 && this.stations.length >= 2) tier = 4; // Grande Antenne (DPS-GE)

    return {
      totalVolunteers,
      availableVolunteers,
      vpspCount,
      vtuCount,
      vlCount,
      ceCount,
      tier
    };
  }

  // Alerte d'urgence SAMU 15 calibrée aux moyens de l'antenne
  triggerRandomSamuEmergency() {
    const pendingSamu = this.missions.filter(m => m.type === 'samu' && m.status === 'planifie');
    if (pendingSamu.length >= 2) return;

    const base = this.stations[Math.floor(Math.random() * this.stations.length)];
    const capacity = this.calculatePlayerCapacity();

    const emergencies = [
      { title: 'Urgence 15 : Malaise Voie Publique', desc: 'Passant pris de vertiges et chute au sol. Bilan et surveillance requis.', durMin: 20, reward: 280 },
      { title: 'Urgence 15 : Détresse Respiratoire à Domicile', desc: 'Patient dyspnéique en crise sévère. Oxygénothérapie et bilan régulateur.', durMin: 25, reward: 340 },
      { title: 'Urgence 15 : Accident de Trottinette Électrique', desc: 'Choc contre trottoir, dermabrasions multiples et suspicion entorse cheville.', durMin: 22, reward: 310 },
      { title: 'Urgence 15 : Arrêt Cardio-Respiratoire (Départ Réflexe)', desc: 'Témoin signale une victime inconsciente sans respiration au centre commercial.', durMin: 30, reward: 480 },
      { title: 'Urgence 15 : Douleur Thoracique Constrictive', desc: 'Homme de 56 ans avec douleur rétro-sternale irradiant dans le bras gauche. Oxygénothérapie et bilan régulateur.', durMin: 25, reward: 360 },
      { title: 'Urgence 15 : Suspicion AVC / Déficit Moteur Brutal', desc: 'Femme de 68 ans présentant une asymétrie faciale et une perte de force au bras droit. Départ réflexe prioritaire.', durMin: 24, reward: 370 },
      { title: 'Urgence 15 : Malaise Hypoglycémique en Gare', desc: 'Voyageur diabétique confus et sueurs profuses. Prise de dextro et resucrage oral sous avis médical.', durMin: 20, reward: 290 },
      { title: 'Urgence 15 : Chute de Personne Âgée avec Suspicion Fracture', desc: 'Octogénaire au sol depuis 2 heures. Douleur aiguë à l’aine et raccourcissement du membre inférieur.', durMin: 28, reward: 330 },
      { title: 'Urgence 15 : Choc Anaphylactique / Piqûre d’Hyménoptère', desc: 'Gonflement des lèvres, urticaire géante et dyspnée sifflante suite à une piqûre de guêpe.', durMin: 22, reward: 390 },
      { title: 'Urgence 15 : AVP Deux-Roues contre Véhicule Léger', desc: 'Collision urbaine. Motard projeté sur la chaussée. Maintien tête dans l’axe, retrait du casque et pose du collier.', durMin: 30, reward: 420 },
      { title: 'Urgence 15 : Brûlure Domestique Étendue du 2nd Degré', desc: 'Ébouillantement lors de la préparation d’un repas. Arrosage immédiat à l’eau tempérée et pansements stériles.', durMin: 22, reward: 320 }
    ];

    const pick = emergencies[Math.floor(Math.random() * emergencies.length)];
    const samuCoords = this.calculateRealisticMissionLocation(base, 'samu');

    const reqVol = Math.min(Math.max(2, capacity.availableVolunteers || 3), 4);
    const ranks = ['PSE1', 'PSE2'];
    if (reqVol >= 3 && capacity.ceCount > 0) ranks.unshift('CE');

    const newSamu = {
      id: `m-samu-${Date.now()}`,
      type: 'samu',
      categoryLabel: 'SAMU 15 - Réquisition Urgence Préfectorale',
      title: pick.title,
      desc: pick.desc,
      lat: samuCoords.lat,
      lng: samuCoords.lng,
      scale: `Départ Réflexe (${reqVol} secouristes)`,
      eventDate: { ...this.clock, hour: this.clock.hour },
      durationSeconds: pick.durMin * 60,
      durationHours: (pick.durMin / 60).toFixed(1),
      requiredVolunteers: reqVol,
      requiredRanks: ranks,
      requiredVehicles: ['VPSP'],
      rewardMoney: pick.reward,
      rewardReputation: 35,
      progress: 0,
      status: 'planifie',
      registeredVolunteers: [],
      assignedCrew: { volunteers: [], vehicles: [] }
    };

    this.enrichMissionLocationWithCity(newSamu);
    this.missions.push(newSamu);
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'samu',
        `🚑 DÉPART RÉFLEXE SAMU 15`,
        `${pick.title} à proximité de ${base.name}. VPSP demandé en urgence !`,
        `samu-${newSamu.id}`
      );
    } else if (window.ProtecIncidents) {
      window.ProtecIncidents.sendSystemNotification(
        `🚑 DÉPART RÉFLEXE SAMU 15`,
        `${pick.title} à proximité de ${base.name}. VPSP demandé !`,
        `samu-${newSamu.id}`
      );
    }

    this.showToast('Appel Régulation SAMU 15', `Départ réflexe : ${pick.title} !`, 'orange');
  }

  startSamuGuard() {
    const vpsp = this.vehicles.find(v => v.type === 'VPSP' && v.status === 'dispo');
    if (!vpsp) {
      this.showToast('Aucun VPSP disponible', 'Vous devez disposer d’au moins 1 ambulance VPSP libre au garage.', 'orange');
      return;
    }

    // Sélection d'un équipage complet : 1 CE ou PSE2 en chef de bord, + 2 PSE1/PSE2
    const availableQualif = this.volunteers.filter(v => v.status === 'dispo' && ['CE', 'PSE2', 'PSE1'].includes(v.rank));
    if (availableQualif.length < 3) {
      this.showToast('Équipage insuffisant', 'Une garde SAMU requiert au moins 3 secouristes qualifiés disponibles (CE, PSE2, PSE1).', 'orange');
      return;
    }

    // Privilégier un CE ou PSE2
    const leader = availableQualif.find(v => v.rank === 'CE') || availableQualif.find(v => v.rank === 'PSE2') || availableQualif[0];
    const team = [leader];
    for (const v of availableQualif) {
      if (team.length < 3 && v.id !== leader.id) {
        team.push(v);
      }
    }

    this.samuGarde = {
      active: true,
      vehicleId: vpsp.id,
      crewVolunteerIds: team.map(v => v.id),
      shiftStartedAt: Date.now(),
      totalInterventions: (this.samuGarde?.totalInterventions || 0)
    };

    vpsp.status = 'samu_garde';
    team.forEach(v => { v.status = 'samu_garde'; });

    this.showToast('Garde SAMU 15 Armée !', `Ambulance ${vpsp.name} et ${team.length} secouristes mis à disposition de la régulation départementale 15.`, 'green');
    this.saveGame();
    this.updateStatsUI();
    this.openModule('samu');
  }

  stopSamuGuard() {
    if (!this.samuGarde || !this.samuGarde.active) return;

    if (this.samuGarde.vehicleId) {
      const v = this.vehicles.find(veh => veh.id === this.samuGarde.vehicleId);
      if (v && v.status === 'samu_garde') v.status = 'dispo';
    }

    (this.samuGarde.crewVolunteerIds || []).forEach(vid => {
      const vol = this.volunteers.find(v => v.id === vid);
      if (vol && vol.status === 'samu_garde') vol.status = 'dispo';
    });

    this.samuGarde.active = false;
    this.samuGarde.vehicleId = null;
    this.samuGarde.crewVolunteerIds = [];
    this.samuGarde.shiftStartedAt = null;

    this.showToast('Fin de Garde SAMU', 'L’ambulance et l’équipage ont réintégré l’antenne et sont à nouveau disponibles.', 'blue');
    this.saveGame();
    this.updateStatsUI();
    this.openModule('samu');
  }

  // --- GARDE CASERNE POMPIERS & ASTREINTE DOMICILE (SDIS / PRÉFECTURE) ---
  armSdisDispositif() {
    if (this.prefectureState && this.prefectureState.agrementSuspended) {
      this.showToast('Agrément Suspendu', 'L’agrément préfectoral de votre antenne est suspendu pour manquements graves.', 'red');
      return;
    }

    const eventSelect = document.getElementById('sdis-event-select');
    const caserneSlider = document.getElementById('sdis-caserne-slider');
    const astreinteSlider = document.getElementById('sdis-astreinte-slider');

    const eventKey = eventSelect ? eventSelect.value : 'violences_urbaines';
    const caserneTarget = caserneSlider ? parseInt(caserneSlider.value) : 3;
    const astreinteTarget = astreinteSlider ? parseInt(astreinteSlider.value) : 2;

    const eventDetails = {
      violences_urbaines: {
        title: 'Violences Urbaines & Mouvements Lycéens',
        reason: 'Tensions urbaines vives, barricades et feux de poubelles. Le SDIS sollicite un VPSP posté en caserne prêt au départ immédiat et une astreinte à domicile en renfort.',
        durationHours: 6,
        severity: 'critique',
        rewardIntervention: 420
      },
      fete_nationale: {
        title: 'Dispositif Renforcé 14 Juillet',
        reason: 'Forte affluence festive, tirs de mortiers et malaises. Pré-positionnement caserne indispensable.',
        durationHours: 8,
        severity: 'eleve',
        rewardIntervention: 380
      },
      greve_transports: {
        title: 'Astreinte Débordements & Rassemblements',
        reason: 'Blocages routiers et cortèges sauvages. Astreinte renforcée rappelable sous 15 min.',
        durationHours: 5,
        severity: 'modere',
        rewardIntervention: 340
      },
      garde_sdis_renfort: {
        title: 'Garde Caserne Classique (Renfort VSAV Pompiers)',
        reason: 'Surcharge des ambulances pompiers. Prise en charge des départs secours d’urgence aux personnes.',
        durationHours: 12,
        severity: 'normal',
        rewardIntervention: 300
      }
    };

    const selEvent = eventDetails[eventKey] || eventDetails.violences_urbaines;

    // 1. Contrôle véhicule VPSP
    const vpsp = this.vehicles.find(v => v.type === 'VPSP' && v.status === 'dispo');
    if (!vpsp) {
      this.showToast('VPSP manquant', 'Une ambulance VPSP libre est exigée pour armer la garde caserne pompiers.', 'orange');
      return;
    }

    // 2. Sélection équipage Caserne (Posté, prêt à partir)
    const dispoQualif = this.volunteers.filter(v => v.status === 'dispo');
    if (dispoQualif.length < (caserneTarget + astreinteTarget)) {
      this.showToast('Effectif insuffisant', `Vous avez demandé ${caserneTarget} en caserne et ${astreinteTarget} en astreinte (${caserneTarget + astreinteTarget} au total), mais seuls ${dispoQualif.length} sont disponibles.`, 'orange');
      return;
    }

    // Équipe Caserne (priorité CE et PSE2 pour la conformité)
    const caserneCrew = [];
    const astreinteCrew = [];

    // Trier pour placer un gradé (CE ou PSE2) en caserne
    dispoQualif.sort((a, b) => {
      const rankVal = { 'Cadre': 4, 'CD': 4, 'CE': 3, 'PSE2': 2, 'PSE1': 1, 'Stagiaire': 0 };
      return (rankVal[b.rank] || 0) - (rankVal[a.rank] || 0);
    });

    for (let i = 0; i < dispoQualif.length; i++) {
      const v = dispoQualif[i];
      if (caserneCrew.length < caserneTarget) {
        caserneCrew.push(v);
      } else if (astreinteCrew.length < astreinteTarget) {
        astreinteCrew.push(v);
      }
    }

    // Vérifier les compétences requises en caserne
    const hasLeader = caserneCrew.some(v => v.rank === 'CE' || v.rank === 'PSE2');
    if (!hasLeader) {
      this.showToast('Compétence Manquante', 'L’équipe de garde postée en caserne doit comporter au moins 1 Chef d’Équipe (CE) ou PSE2 certifié !', 'orange');
      return;
    }

    // Passer les statuts
    vpsp.status = 'sdis_caserne';
    caserneCrew.forEach(v => { v.status = 'sdis_caserne'; });
    astreinteCrew.forEach(v => { v.status = 'sdis_astreinte'; });

    this.sdisGarde = {
      active: true,
      eventKey: eventKey,
      eventName: selEvent.title,
      eventReason: selEvent.reason,
      eventSeverity: selEvent.severity,
      rewardIntervention: selEvent.rewardIntervention,
      caserneCrewCountRequested: caserneTarget,
      astreinteCrewCountRequested: astreinteTarget,
      caserneCrew: caserneCrew.map(v => v.id),
      astreinteCrew: astreinteCrew.map(v => v.id),
      vehicleId: vpsp.id,
      startedAt: Date.now(),
      durationHours: selEvent.durationHours,
      endsAt: Date.now() + (selEvent.durationHours * 3600 * 1000),
      stateSatisfaction: 100,
      logInterventions: []
    };

    this.showToast('Dispositif SDIS Armé !', `VPSP en caserne pompiers (${caserneCrew.length} secouristes) + Astreinte domicile (${astreinteCrew.length} secouristes) activées.`, 'green');
    this.saveGame();
    this.updateStatsUI();
    this.openModule('pompiers');
  }

  recallAstreinteCrewToCaserne() {
    if (!this.sdisGarde || !this.sdisGarde.active) return;
    const astreinteIds = this.sdisGarde.astreinteCrew || [];
    if (astreinteIds.length === 0) {
      this.showToast('Aucune astreinte', 'Tous vos effectifs sont déjà en caserne.', 'orange');
      return;
    }

    astreinteIds.forEach(vid => {
      const v = this.volunteers.find(vol => vol.id === vid);
      if (v) {
        v.status = 'sdis_caserne';
        if (!this.sdisGarde.caserneCrew.includes(v.id)) {
          this.sdisGarde.caserneCrew.push(v.id);
        }
      }
    });

    this.sdisGarde.astreinteCrew = [];
    this.showToast('Bipeurs Activés !', `Rappel d'urgence : les ${astreinteIds.length} secouristes d’astreinte convergent vers la caserne pompiers (arrivée 10 min).`, 'green');
    this.saveGame();
    this.updateStatsUI();
    this.openModule('pompiers');
  }

  disarmSdisDispositif() {
    if (!this.sdisGarde || !this.sdisGarde.active) return;

    if (this.sdisGarde.vehicleId) {
      const v = this.vehicles.find(veh => veh.id === this.sdisGarde.vehicleId);
      if (v && (v.status === 'sdis_caserne' || v.status === 'sdis_astreinte')) v.status = 'dispo';
    }

    const allCrew = [...(this.sdisGarde.caserneCrew || []), ...(this.sdisGarde.astreinteCrew || [])];
    allCrew.forEach(vid => {
      const vol = this.volunteers.find(v => v.id === vid);
      if (vol && (vol.status === 'sdis_caserne' || vol.status === 'sdis_astreinte')) vol.status = 'dispo';
    });

    this.sdisGarde.active = false;
    this.sdisGarde.vehicleId = null;
    this.sdisGarde.caserneCrew = [];
    this.sdisGarde.astreinteCrew = [];

    this.showToast('Dispositif Clôturé', 'Fin de garde en caserne pompiers. Équipages et VPSP de retour à l’antenne.', 'blue');
    this.saveGame();
    this.updateStatsUI();
    this.openModule('pompiers');
  }

  triggerRandomSdisEmergency() {
    if (!this.sdisGarde || !this.sdisGarde.active) return;

    const pending = this.missions.filter(m => m.type === 'pompiers' && m.status === 'planifie');
    if (pending.length >= 2) return;

    const base = this.stations[0] || { lat: 48.8566, lng: 2.3522, name: 'Caserne Pompiers' };
    const sdisCoords = this.calculateRealisticMissionLocation(base, 'pompiers');

    const scenarios = [
      {
        title: 'Départ Réflexe SDIS : Blessé Barricade / Mouvement Lycéen',
        desc: 'Tension urbaine vive. Victime présentant un traumatisme crânien léger suite à jet de projectile. Départ réflexe VPSP caserne demandé par le CODIS.',
        urgency: 'haute',
        durMin: 25,
        maxResponseMinutes: 3,
        requiresLeader: true
      },
      {
        title: 'Renfort Pompiers : Intoxication Fumées Feux de Poubelles',
        desc: 'Propagations de fumées épaisses au pied d’un immeuble d’habitation. Deux victimes incommodées à bilanter et oxygéner.',
        urgency: 'critique',
        durMin: 30,
        maxResponseMinutes: 4,
        requiresLeader: true
      },
      {
        title: 'Débordement Secteur : Chute et Traumatisme Voie Publique',
        desc: 'Foule dispersée par les forces de l’ordre, passant bousculé au sol avec suspicion fracture du poignet. Bilan pompiers requis.',
        urgency: 'normale',
        durMin: 20,
        maxResponseMinutes: 5,
        requiresLeader: false
      },
      {
        title: 'Soutien Sanitaire Opérationnel (SSO) : Feu de Pavillon',
        desc: 'Incendie violent en combles. Les pompiers engagent les binômes sous ARI. Le VPSP Protection Civile est requis pour le suivi des constantes des pompiers et le bilan des occupants sinistrés.',
        urgency: 'critique',
        durMin: 35,
        maxResponseMinutes: 4,
        requiresLeader: true
      },
      {
        title: 'Secours Routier : Collision Frontale Hors Agglomération',
        desc: 'Deux véhicules légers impliqués sur la départementale. Le VPSP intervient en appui du FPTSR pour le calage, la pose de colliers cervicaux et le conditionnement coquille.',
        urgency: 'haute',
        durMin: 30,
        maxResponseMinutes: 3,
        requiresLeader: true
      },
      {
        title: 'Évacuation Sanitaire : Relevage Complexe en Étage Étroit',
        desc: 'Victime immobilisée dans un escalier hélicoïdal étroit. Brancardage en plan dur et portage coordonné avec l’équipe de garde.',
        urgency: 'normale',
        durMin: 25,
        maxResponseMinutes: 5,
        requiresLeader: false
      },
      {
        title: 'Secours Aquatique : Hypothermie Sévère sur Berges',
        desc: 'Passant repêché par l’équipe nautique des pompiers. Prise en charge thermique d’urgence, déshabillage d’urgence et séchage sous couverture isotherme.',
        urgency: 'haute',
        durMin: 28,
        maxResponseMinutes: 4,
        requiresLeader: true
      }
    ];

    const pick = scenarios[Math.floor(Math.random() * scenarios.length)];
    const reward = this.sdisGarde.rewardIntervention || 380;

    const newSdis = {
      id: `m-sdis-${Date.now()}`,
      type: 'pompiers',
      categoryLabel: 'SDIS Pompiers - Garde Postée & Renfort VSAV',
      title: pick.title,
      desc: pick.desc,
      lat: sdisCoords.lat,
      lng: sdisCoords.lng,
      scale: 'VPSP Caserne Pompiers (3 secouristes)',
      eventDate: { ...this.clock, hour: this.clock.hour },
      durationSeconds: pick.durMin * 60,
      durationHours: (pick.durMin / 60).toFixed(1),
      requiredVolunteers: 3,
      requiredRanks: pick.requiresLeader ? ['CE', 'PSE2', 'PSE1'] : ['PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      rewardMoney: reward,
      rewardReputation: 40,
      maxResponseMinutes: pick.maxResponseMinutes,
      spawnedAt: Date.now(),
      progress: 0,
      status: 'planifie',
      registeredVolunteers: [],
      assignedCrew: { volunteers: [], vehicles: [] }
    };

    this.enrichMissionLocationWithCity(newSdis);
    this.missions.push(newSdis);
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'sdis',
        `🚒 DÉPART POMPIERS IMMÉDIAT (CODIS)`,
        `${pick.title} : Équipage VPSP en caserne sonné pour départ réflexe !`,
        `sdis-${newSdis.id}`
      );
    } else if (window.ProtecIncidents) {
      window.ProtecIncidents.sendSystemNotification(
        `🚨 DÉPART POMPIERS IMMÉDIAT`,
        `${pick.title} ! Équipage VPSP en caserne sonné par le CODIS !`,
        `sdis-${newSdis.id}`
      );
    }

    this.showToast('Départ Pompiers (CODIS)', `${pick.title} ! Départ réflexe immédiat requis.`, 'orange');
  }

  applyPrefectureSanction(reason, scorePenalty = 15) {
    if (!this.prefectureState) {
      this.prefectureState = { trustScore: 85, agrementSuspended: false, warningsCount: 0 };
    }

    this.prefectureState.trustScore = Math.max(0, this.prefectureState.trustScore - scorePenalty);
    this.prefectureState.warningsCount = (this.prefectureState.warningsCount || 0) + 1;

    // Dégradation de réputation globale
    this.resources.reputationScore = Math.max(0, (this.resources.reputationScore || 0) - 40);

    // Si confiance trop basse ou 3 avertissements : suspension d'agrément
    if (this.prefectureState.trustScore <= 20 || this.prefectureState.warningsCount >= 3) {
      this.prefectureState.agrementSuspended = true;
      if (this.resources.agrements) {
        this.resources.agrements.A = false; // Suspension secours à personnes
      }
      this.showToast(
        '🚨 SUSPENSION D’AGRÉMENT PRÉFECTORAL !',
        `Décision préfectorale d'urgence : votre agrément opérationnel est suspendu suite à des fautes répétées (${reason}). Déposez un recours auprès de la Préfecture.`,
        'red'
      );
    } else {
      this.showToast(
        '⚠️ AVERTISSEMENT PRÉFECTORAL',
        `Rappel à l'ordre des services de l'État : ${reason} (-${scorePenalty} pts de confiance, Avertissement ${this.prefectureState.warningsCount}/3).`,
        'orange'
      );
    }

    this.saveGame();
    this.updateStatsUI();
  }

  // Candidature spontanée de bénévole
  generateRandomCandidature() {
    const pool = [
      { n: 'Clémentine Vasseur', a: 24, j: 'Secrétaire médicale', d: ['Samedi', 'Dimanche'], t: 'salarié', av: '👩', rank: 'PSE1', role: 'Secouriste', skills: ['PSE1', 'secrétariat'], isTrainer: false, exp: 25 },
      { n: 'Maxime Caron', a: 20, j: 'Étudiant en STAPS', d: ['Mercredi', 'Samedi'], t: 'étudiant', av: '🙋‍♂️', rank: 'Stagiaire', role: 'Bénévole Stagiaire', skills: ['PSC1', 'sportif'], isTrainer: false, exp: 5 },
      { n: 'Aurélie Giraud', a: 28, j: 'Enseignante', d: ['Mercredi', 'Samedi', 'Dimanche'], t: 'salarié', av: '👩‍🏫', rank: 'PSE1', role: 'Secouriste Formateur', skills: ['PSE1', 'formateur'], isTrainer: true, exp: 40 },
      { n: 'Julien Mercier', a: 31, j: 'Infirmier DE', d: ['Lundi', 'Jeudi', 'Vendredi'], t: 'salarié', av: '👨‍⚕️', rank: 'PSE2', role: 'Équipier Secouriste', skills: ['PSE2', 'formateur', 'AFGSU', 'soins_urgence'], isTrainer: true, exp: 65 },
      { n: 'Inès Bouzid', a: 22, j: 'Étudiante Droit', d: ['Vendredi', 'Samedi', 'Dimanche'], t: 'étudiant', av: '👩‍🎓', rank: 'Stagiaire', role: 'Bénévole Stagiaire', skills: ['GQS'], isTrainer: false, exp: 0 },
      { n: 'Thomas Delattre', a: 35, j: 'Technicien Réseaux', d: ['Samedi', 'Dimanche'], t: 'salarié', av: '👨‍💼', rank: 'PSE1', role: 'Secouriste Chauffeur', skills: ['PSE1', 'permis_vpsp'], isTrainer: false, exp: 30 },
      { n: 'Kévin Bouchard', a: 29, j: 'Ancien Pompier Volontaire', d: ['Vendredi', 'Samedi', 'Dimanche'], t: 'salarié', av: '👨‍🚒', rank: 'CE', role: 'Chef d’Équipe Opérationnel', skills: ['CE', 'PSE2', 'permis_vpsp', 'commandement'], isTrainer: false, exp: 80 }
    ];
    const p = pool[Math.floor(Math.random() * pool.length)];
    this.candidatures.push({
      id: `cand-${Date.now()}`,
      name: p.n,
      age: p.a,
      job: p.j,
      motivation: 'Très motivé(e) pour donner de mon temps libre, porter la tenue orange et bleue et secourir nos concitoyens.',
      dispoJours: p.d,
      dispoType: p.t,
      avatar: p.av,
      rank: p.rank,
      role: p.role,
      skills: p.skills,
      isTrainer: p.isTrainer,
    });

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'rh',
        '👥 Nouvelle Candidature Bénévole !',
        `${p.n} (${p.rank} • ${p.j}) souhaite intégrer votre antenne. Planifiez son entretien d'intégration !`,
        `cand-${Date.now()}`
      );
    }

    this.showToast('Nouvelle Candidature', `${p.n} (${p.j} • ${p.rank}) souhaite intégrer votre antenne.`, 'blue');
    this.updateStatsUI();
  }

  updateStatsUI() {
    const moneyFormatted = this.resources.money.toLocaleString('fr-FR');
    const statMoney = document.getElementById('stat-money');
    if (statMoney) statMoney.textContent = moneyFormatted;

    const statMoneyMobile = document.getElementById('stat-money-mobile');
    if (statMoneyMobile) {
      if (this.resources.money >= 1000000) {
        statMoneyMobile.textContent = (this.resources.money / 1000000).toFixed(1) + 'M €';
      } else if (this.resources.money >= 10000) {
        statMoneyMobile.textContent = Math.round(this.resources.money / 1000) + 'k €';
      } else {
        statMoneyMobile.textContent = moneyFormatted + ' €';
      }
    }

    const availableCount = this.volunteers.filter(v => v.status === 'dispo').length;
    const volAvail = document.getElementById('stat-volunteers-avail');
    if (volAvail) volAvail.textContent = availableCount;
    const volTotal = document.getElementById('stat-volunteers-total');
    if (volTotal) volTotal.textContent = this.volunteers.length;

    const planCount = this.missions.filter(m => m.status === 'planifie' || m.status === 'ongoing').length;
    const devisCount = this.devis.filter(d => d.status === 'pending').length;
    const candCount = this.candidatures.length;
    const renfCount = this.renforts.filter(r => r.status === 'open').length;

    const bPlan = document.getElementById('badge-planning-dock');
    if (bPlan) bPlan.textContent = planCount;

    const bPlanMobile = document.getElementById('badge-planning-dock-mobile');
    if (bPlanMobile) bPlanMobile.textContent = planCount;

    const samuCount = this.missions.filter(m => m.type === 'samu' && (m.status === 'planifie' || m.status === 'ongoing')).length;
    const bSamuMobile = document.getElementById('badge-samu-dock-mobile');
    if (bSamuMobile) bSamuMobile.textContent = samuCount;

    const bRadioMobile = document.getElementById('badge-radio-dock-mobile');
    if (bRadioMobile) bRadioMobile.textContent = this.missions.filter(m => m.status === 'ongoing').length;

    const sdisCount = this.missions.filter(m => m.type === 'pompiers' && (m.status === 'planifie' || m.status === 'ongoing')).length;
    const bPompiers = document.getElementById('badge-pompiers-dock');
    if (bPompiers) bPompiers.textContent = sdisCount;

    const bDev = document.getElementById('badge-devis-dock');
    if (bDev) bDev.textContent = devisCount;

    const bCand = document.getElementById('badge-recrutement-dock');
    if (bCand) bCand.textContent = candCount;

    const bAll = document.getElementById('badge-alliance-dock');
    if (bAll) {
      if (renfCount > 0) {
        bAll.textContent = renfCount;
        bAll.classList.remove('hidden');
      } else {
        bAll.classList.add('hidden');
      }
    }

    // Gestion de la notification cadeau : UNIQUEMENT s'il y a quelque chose de prêt à être réclamé
    const r = this.rewards;
    const today = this.clock ? this.clock.day : new Date().getDate();
    let hasSomethingToClaim = false;
    if (r) {
      // 1. Récompense quotidienne non encore réclamée aujourd'hui
      if (r.lastDailyClaimDay !== today) {
        hasSomethingToClaim = true;
      }
      // 2. Défi journalier complété prêt à être encaissé
      if (r.dailyTasks && r.dailyTasks.some(t => !t.done && (t.current >= t.goal))) {
        hasSomethingToClaim = true;
      }
      // 3. Défi hebdomadaire prêt à être encaissé
      if (r.weeklyTasks && r.weeklyTasks.some(t => !t.done && (t.current >= t.goal))) {
        hasSomethingToClaim = true;
      }
    }
    const rewardDot = document.getElementById('badge-rewards-dot');
    const rewardReadyText = document.getElementById('stat-rewards-ready');
    if (rewardDot) {
      if (hasSomethingToClaim) {
        rewardDot.classList.remove('hidden');
        if (rewardReadyText) {
          rewardReadyText.textContent = 'Cadeau prêt !';
          rewardReadyText.className = 'text-xs font-black text-rose-600 flex items-center gap-1';
        }
      } else {
        rewardDot.classList.add('hidden');
        if (rewardReadyText) {
          rewardReadyText.textContent = 'Quotidien';
          rewardReadyText.className = 'text-xs font-bold text-slate-600 flex items-center gap-1';
        }
      }
    }

    const notEl = document.getElementById('stat-notoriety');
    if (notEl) notEl.textContent = `${this.resources.followers} abonnés`;

    const dotEl = document.getElementById('stat-campaign-dot');
    if (dotEl) {
      if (this.resources.campaigns.social || this.resources.campaigns.posters) {
        dotEl.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5';
      } else {
        dotEl.className = 'w-2 h-2 rounded-full bg-slate-300 ml-0.5';
      }
    }
  }

  updateMissionCounts() {
    const counts = {
      all: this.missions.length,
      dps: this.missions.filter(m => m.type === 'dps').length,
      samu: this.missions.filter(m => m.type === 'samu').length,
      pompiers: this.missions.filter(m => m.type === 'pompiers').length,
      meteo: this.missions.filter(m => m.type === 'meteo').length,
      social: this.missions.filter(m => m.type === 'social').length,
      crise: this.missions.filter(m => m.type === 'crise').length
    };

    ['all', 'dps', 'samu', 'pompiers', 'meteo', 'social', 'crise'].forEach(c => {
      const el = document.getElementById(`count-${c}`);
      if (el) el.textContent = counts[c];
    });
  }

  showToast(title, message, color = 'blue') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'glass-panel-heavy p-3.5 rounded-2xl border border-white/80 shadow-xl flex items-start gap-3 pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0';

    let iconBg = 'bg-pc-blue/10 text-pc-blue';
    let iconName = 'bell';
    if (color === 'orange') { iconBg = 'bg-pc-orange/15 text-pc-orange'; iconName = 'alert-triangle'; }
    if (color === 'green') { iconBg = 'bg-emerald-100 text-emerald-600'; iconName = 'check-circle-2'; }

    toast.innerHTML = `
      <div class="w-7 h-7 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5">
        <i data-lucide="${iconName}" class="w-4 h-4"></i>
      </div>
      <div class="flex-1 pr-2">
        <h5 class="text-xs font-extrabold text-slate-900 leading-tight">${title}</h5>
        <p class="text-[11px] text-slate-600 mt-0.5 leading-normal">${message}</p>
      </div>
      <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 20);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new ProtecGame();
});
