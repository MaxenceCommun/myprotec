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
    this.cumpConvention = { signed: false, signedAt: null, totalMissions: 0, successfulMissions: 0, complianceScore: 100 };
    this.aascConvention = { signed: false, signedAt: null, cost: 800 };
    this.samuConvention = { signed: false, signedAt: null, totalInterventions: 0 };
    this.sdisConvention = { signed: false, signedAt: null, totalInterventions: 0 };
    this.logistics = { oxygenBottles: 0, aedPads: 0, woundKits: 0, cervicalCollars: 0 };

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
    this.isBackendOnline = false;

    // 1. Détection de disponibilité du serveur backend optionnel
    fetch('/api/state')
      .then(res => {
        if (!res.ok) throw new Error(`Backend non disponible (HTTP ${res.status})`);
        return res.json();
      })
      .then(data => {
        this.isBackendOnline = true;
        if (data.alliances) this.alliances = data.alliances;
        if (data.allianceStations) {
          // FILTRE STRICT : Ne JAMAIS inclure d'antennes fictives système ni nos propres antennes
          this.allianceStations = (data.allianceStations || []).filter(st => {
            if (!st || !st.id || !st.playerId) return false;
            if (st.playerId === this.player.id) return false;
            if (st.playerId.startsWith('system') || st.id.startsWith('station-allie') || st.isFictive) return false;
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

        // Récupération complémentaire depuis Supabase Cloud
        if (window.ProtecSupabase && window.ProtecSupabase.client) {
          window.ProtecSupabase.getAllianceStations(this.player.id).then(supaStations => {
            if (supaStations && supaStations.length > 0) {
              const existingIds = new Set(this.allianceStations.map(s => s.id));
              supaStations.forEach(st => {
                if (!existingIds.has(st.id) && !this.stations.some(my => my.id === st.id)) {
                  this.allianceStations.push({
                    id: st.id,
                    playerId: st.player_id,
                    playerName: st.player_name || 'Directeur d’Antenne',
                    name: st.station_name,
                    city: st.city,
                    lat: st.lat,
                    lng: st.lng,
                    level: st.level || 1,
                    vehicles: st.vehicles_count || 1,
                    volunteers: st.volunteers_count || 4,
                    allianceId: st.alliance_id || 'alliance-fnpc'
                  });
                }
              });
              this.renderAllianceStations();
            }
          }).catch(() => {});
        }

        // 2. Connexion SSE (Server-Sent Events) uniquement si le backend est actif
        if (window.EventSource) {
          const evtSource = new EventSource('/api/events');
          evtSource.onmessage = (e) => {
            try {
              const { type, data } = JSON.parse(e.data);
              this.handleMultiplayerEvent(type, data);
            } catch (err) {}
          };
          evtSource.onerror = () => {
            evtSource.close();
          };
        }
      })
      .catch(() => {
        // Mode autonome / Cloud direct (Supabase) : aucun message d'erreur inutile
        this.isBackendOnline = false;
        if (window.ProtecSupabase && window.ProtecSupabase.client) {
          window.ProtecSupabase.getAllianceStations(this.player.id).then(supaStations => {
            if (supaStations && supaStations.length > 0) {
              this.allianceStations = supaStations.map(st => ({
                id: st.id,
                playerId: st.player_id,
                playerName: st.player_name || 'Directeur d’Antenne',
                name: st.station_name,
                city: st.city,
                lat: st.lat,
                lng: st.lng,
                level: st.level || 1,
                vehicles: st.vehicles_count || 1,
                volunteers: st.volunteers_count || 4,
                allianceId: st.alliance_id || 'alliance-fnpc'
              }));
              this.renderAllianceStations();
            }
          }).catch(() => {});
        }
      });

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

    if (this.isBackendOnline) {
      fetch('/api/player/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }

    // Synchronisation Cloud Supabase
    if (window.ProtecSupabase && this.stations && this.stations.length > 0) {
      this.stations.forEach(st => {
        window.ProtecSupabase.syncStationToMap(this.player, st);
      });
    }
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
    if (!remotePlayer || remotePlayer.id === this.player.id || remotePlayer.id.startsWith('system')) return;

    // Retirer anciennes stations de ce joueur et de nos propres stations
    this.allianceStations = this.allianceStations.filter(s =>
      s.playerId !== remotePlayer.id &&
      !s.id.startsWith('station-allie') &&
      !this.stations.some(my => my.id === s.id) &&
      !this.stations.some(my => Math.abs(my.lat - s.lat) < 0.0003 && Math.abs(my.lng - s.lng) < 0.0003)
    );

    // Ajouter les nouvelles uniquement pour un vrai joueur humain
    if (remotePlayer.stations && remotePlayer.stations.length > 0) {
      remotePlayer.stations.forEach(st => {
        if (!st || !st.id || st.id.startsWith('station-allie')) return;
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
      // Sécurité absolue : ignorer si antenne fictive / système ou notre propre antenne
      if (!st || !st.id || !st.playerId) return;
      if (st.playerId === this.player.id) return;
      if (st.playerId.startsWith('system') || st.id.startsWith('station-allie') || st.isFictive) return;
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
    // Purge absolue de toute antenne fictive créée par le système
    this.allianceStations = [];
    if (this.markers && this.markers.allianceStations) {
      Object.values(this.markers.allianceStations).forEach(m => this.map.removeLayer(m));
      this.markers.allianceStations = {};
    }
    this.renderStations();
    this.disperseOverlappingMissions();
    this.renderMissions();
    this.updateStatsUI();
    this.updateDockAndFiltersVisibility();
    this.startSimulationClock();

    // Fermeture automatique des sous-menus au clic en dehors du dock
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dock-menu-wrapper')) {
        this.closeAllDockSubmenus();
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Initialisation du moteur d'évolution hors-ligne et de rattrapage
    if (window.ProtecOfflineEngine) {
      window.ProtecOfflineEngine.init(this);
    }

    // Demande des notifications d'urgence pour incidents & SAMU (PC & Mobile)
    if (window.ProtecIncidents && 'Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        window.ProtecIncidents.requestNotificationPermission();
      }, 4000);
    }

    if (this.stations.length === 0) {
      if (window.ProtecOnboarding) {
        window.ProtecOnboarding.showWizard(this);
      } else {
        this.showOnboardingModal();
      }
    } else {
      this.showToast('Partie chargée', `Bienvenue ! Votre antenne compte ${this.volunteers.length} secouristes.`, 'blue');
      // Si l'antenne n'a pas encore validé son aménagement d'ouverture, ouvrir automatiquement le plan 2D pour lancer la partie
      const firstSt = this.stations[0];
      if (firstSt && (!firstSt.premises || !firstSt.premises.architecture)) {
        setTimeout(() => {
          if (window.ProtecLocaux && typeof window.ProtecLocaux.openInitialSetupModal === 'function') {
            window.ProtecLocaux.openInitialSetupModal(this, firstSt.id);
          }
        }, 500);
      }
      if (window.ProtecTutorial) {
        window.ProtecTutorial.init(this);
      }
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
        cumpConvention: this.cumpConvention,
        aascConvention: this.aascConvention,
        samuConvention: this.samuConvention,
        sdisConvention: this.sdisConvention,
        tutorialState: this.tutorialState,
        jobOffers: this.jobOffers,
        adRewards: this.adRewards,
        workplaceEquipment: this.workplaceEquipment
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
          this.stations = (parsed.stations || []).filter(s => s && s.id && !s.id.startsWith('station-allie') && !s.isFictive);
          this.vehicles = parsed.vehicles || [];
          this.volunteers = (parsed.volunteers || []).map(v => {
            if (v.name) v.name = this.cleanVolunteerName(v.name);
            if (!v.skills || !Array.isArray(v.skills) || v.skills.length === 0) {
              const detected = this.getVolunteerAllSkills(v);
              v.skills = detected.map(s => s.id);
            }
            return v;
          });
          this.devis = parsed.devis || [];
          this.missions = parsed.missions || [];
          this.candidatures = (parsed.candidatures || []).map(c => {
            if (c.name) c.name = this.cleanVolunteerName(c.name);
            return c;
          });
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
          this.cumpConvention = parsed.cumpConvention || this.cumpConvention;
          this.aascConvention = parsed.aascConvention || this.aascConvention || { signed: false, signedAt: null, cost: 800 };
          this.samuConvention = parsed.samuConvention || this.samuConvention || { signed: false, signedAt: null, totalInterventions: 0 };
          this.sdisConvention = parsed.sdisConvention || this.sdisConvention || { signed: false, signedAt: null, totalInterventions: 0 };
          this.tutorialState = parsed.tutorialState || this.tutorialState || null;
          this.adRewards = parsed.adRewards || null;
          if (parsed.player) this.player = parsed.player;

          // Assainissement des objectifs et heures bénévoles si aucune antenne n'a encore été créée
          if (!this.stations || this.stations.length === 0) {
            if (this.grants) this.grants.totalVolunteerHours = 0;
            if (this.rewards) {
              (this.rewards.dailyTasks || []).forEach(t => { t.current = 0; t.done = false; });
              (this.rewards.weeklyTasks || []).forEach(w => { w.current = 0; w.done = false; });
            }
          }
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

    // 3. Effacement de la sauvegarde Cloud Supabase et de la sauvegarde active locale
    try {
      if (window.ProtecSupabase && window.ProtecSupabase.client && this.player && this.player.id) {
        await window.ProtecSupabase.client.from('game_saves').delete().eq('user_id', this.player.id);
      }
    } catch (e) {
      console.warn('Erreur purge cloud save:', e);
    }

    localStorage.removeItem('protec_live_save_v4');
    this.closeResetModal();
    this.showToast('Antenne réinitialisée', 'Votre ancienne partie a été archivée avec succès. Rechargement...', 'green');
    setTimeout(() => {
      location.reload();
    }, 1200);
  }

  showOnboardingModal() {
    if (window.ProtecOnboarding) {
      window.ProtecOnboarding.showWizard(this);
    } else {
      const modal = document.getElementById('onboarding-modal');
      if (modal) modal.classList.remove('hidden');
    }
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

    // Auto-ajustement responsive Leaflet pour mobile / rotation d'écran
    window.addEventListener('resize', () => {
      if (this.map) this.map.invalidateSize();
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 200);
    });
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 300);
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
      else if (mission.type === 'meteo') { colorClass = 'bg-sky-700'; pingClass = 'radar-ping-blue'; iconName = 'shield-alert'; }
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

    const cost = this.stations.length === 0 ? 0 : 2500;
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
    const stationName = this.pendingPlacementName || (isMainAntenna 
      ? `Antenne de ${detectedCity} (Principale ${deptCode})` 
      : `Antenne de ${detectedCity} (${deptCode})`);

    this.pendingPlacementName = stationName;

    const deptEl = document.getElementById('placement-val-dept');
    if (deptEl) deptEl.textContent = `${deptInfo?.name || deptCode} (${deptCode}) • ${detectedCity}`;
    const nameEl = document.getElementById('placement-val-name');
    if (nameEl) nameEl.textContent = stationName;
    const coordsEl = document.getElementById('placement-val-coords');
    if (coordsEl) coordsEl.textContent = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    const costEl = document.getElementById('placement-val-cost');
    if (costEl) costEl.textContent = cost === 0 ? 'Gratuit (Subvention inaugurale)' : `${cost.toLocaleString('fr-FR')} €`;

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
    const cost = this.stations.length === 0 ? 0 : 2500;

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
      // 1. ZÉRO VÉHICULE AU DÉPART (l'antenne doit acquérir son 1er véhicule)
      this.vehicles = [];
      newStation.vehicles = [];

      // 2. ZÉRO MATÉRIEL AU DÉPART (stock vierge)
      newStation.stock = {};
      this.logistics = { oxygenBottles: 0, aedPads: 0, woundKits: 0, cervicalCollars: 0 };

      // 3. ZÉRO CONVENTION AU DÉPART (ni AASC, ni partenaires)
      this.aascConvention = { signed: false, signedAt: null, cost: 800 };
      this.samuConvention = { signed: false, signedAt: null, totalInterventions: 0 };
      this.sdisConvention = { signed: false, signedAt: null, totalInterventions: 0 };
      this.sncfConvention = { signed: false, signedAt: null, totalInterventions: 0 };
      this.cumpConvention = { signed: false, signedAt: null, totalMissions: 0, successfulMissions: 0, normCompliant: false };
      this.sdisGarde = { active: false, vehicleId: null, caserneCrew: [], astreinteCrew: [], mode: 'poste' };

      // 4. EXACTEMENT 5 BÉNÉVOLES AVEC COMPÉTENCES DE BASE (1 CE, 2 PSE2, 2 PSE1)
      const starters = [
        { name: 'Alexandre Roux', role: 'Chef d’Équipe', rank: 'CE', exp: 30, isTrainer: false, avatar: '👨‍💼', dispoType: 'salarié', dispoJours: ['Vendredi', 'Samedi', 'Dimanche'], motivation: 85, skills: ['ce', 'pse2', 'pse1', 'permis_b'] },
        { name: 'Sarah Benali', role: 'Équipier Secouriste', rank: 'PSE2', exp: 25, isTrainer: false, avatar: '👩‍🚒', dispoType: 'étudiante', dispoJours: ['Mardi', 'Samedi', 'Dimanche'], motivation: 80, skills: ['pse2', 'pse1', 'permis_b'] },
        { name: 'Thomas Girard', role: 'Équipier Secouriste', rank: 'PSE2', exp: 20, isTrainer: false, avatar: '🧑‍🚒', dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'], motivation: 80, skills: ['pse2', 'pse1'] },
        { name: 'Lucas Martin', role: 'Secouriste', rank: 'PSE1', exp: 15, isTrainer: false, avatar: '🙋‍♂️', dispoType: 'salarié', dispoJours: ['Samedi', 'Dimanche'], motivation: 75, skills: ['pse1', 'permis_b'] },
        { name: 'Élodie Leroy', role: 'Secouriste', rank: 'PSE1', exp: 10, isTrainer: false, avatar: '🧑', dispoType: 'étudiante', dispoJours: ['Mercredi', 'Vendredi', 'Samedi'], motivation: 85, skills: ['pse1'] }
      ];

      this.volunteers = [];
      starters.forEach(s => {
        this.volunteers.push({
          id: `vol-${Date.now()}-${Math.random()}`,
          name: s.name,
          role: s.role,
          rank: s.rank,
          exp: s.exp,
          energy: 100,
          motivation: s.motivation,
          humeur: 85,
          contractType: 'benevole',
          profilSocial: s.dispoType === 'étudiante' ? 'etudiant' : 'salarie',
          status: 'dispo',
          stationId: stationId,
          isTrainer: s.isTrainer,
          avatar: s.avatar,
          dispoType: s.dispoType,
          dispoJours: s.dispoJours,
          skills: s.skills || []
        });
      });
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

    this.showToast('Bâtiment Implanté !', `${stationName} est désormais implantée sur le secteur. Ouverture du plan d'aménagement...`, 'green');
    if (window.ProtecLocaux && typeof window.ProtecLocaux.openInitialSetupModal === 'function') {
      setTimeout(() => {
        window.ProtecLocaux.openInitialSetupModal(this, stationId);
      }, 200);
    } else {
      this.openStationDetails(stationId);
    }
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
      status: 'pending',
      secondsLeft: 240 // 4 minutes pour répondre avant expiration face aux autres associations
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

    devis.configuredVehicleId = vehOption;
    if (vehOption === 'none') {
      devis.configuredVehicles = [];
    } else if (vehOption === 'all_fleet') {
      devis.configuredVehicles = (this.vehicles || []).map(v => v.type || 'VPSP');
    } else {
      const selectedVeh = (this.vehicles || []).find(v => v.id === vehOption);
      if (selectedVeh) {
        devis.configuredVehicles = [selectedVeh.type || 'VPSP'];
      } else {
        devis.configuredVehicles = [];
      }
    }

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
      acceptRate = 'Concurrence active (associations concurrentes agréées) : gain modéré (~30-40% en début de jeu)';
    } else if (ratio <= 1.25) {
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
      text = 'Tarif supérieur au barème';
      acceptRate = 'Risque fort de perdre face aux offres concurrentes (~20%)';
    } else {
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
      text = 'Tarif excessif';
      acceptRate = 'Rejet très probable par l’organisateur (<10%)';
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

      // 2. CONCURRENCE DES AUTRES ASSOCIATIONS AGRÉÉES DE SÉCURITÉ CIVILE
      // Au début (notoriété modeste et antenne peu connue), les organisateurs retiennent souvent les associations concurrentes établies !
      const completedDpsCount = (this.missions || []).filter(m => m.type === 'dps' && m.status === 'completed').length;
      const repScore = this.resources.reputationScore || 30;

      // Base : 25% de base seulement au démarrage du jeu
      let winProb = 0.25;
      if (repScore > 100) winProb += 0.12;
      if (repScore > 300) winProb += 0.15;
      if (completedDpsCount >= 3) winProb += 0.08;
      if (completedDpsCount >= 8) winProb += 0.10;

      // Influence du tarif
      if (ratio <= 0.85) winProb += 0.32; // Offre très attractive : fort argument financier
      else if (ratio <= 0.95) winProb += 0.15;
      else if (ratio <= 1.05) winProb += 0.0; // Barème standard
      else if (ratio <= 1.25) winProb -= 0.22; // Plus cher que la moyenne
      else winProb -= 0.45; // Très cher

      winProb = Math.max(0.08, Math.min(0.88, winProb));

      const isWon = Math.random() <= winProb;

      if (isWon) {
        devis.status = 'signed';
        this.convertDevisToScheduledMission(devis);
        this.resources.reputationScore = (this.resources.reputationScore || 50) + 12;
        this.showToast('Convention Signée !', `L’organisateur de « ${devis.eventName} » a retenu votre proposition face aux associations concurrentes !`, 'green');
      } else {
        devis.status = 'rejected_competition';
        this.showToast('Offre Non Retenue', `L’organisateur a préféré l’offre d’une association concurrente agréée (notoriété établie ou meilleur compromis). Continuez la prospection !`, 'orange');
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
          this.checkEnginProgressNotification(currentMission);
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

  // Contrôle et déclenchement de Push Notification dès qu'un équipage d'engin complet est prêt (montée en charge progressive)
  checkEnginProgressNotification(mission) {
    if (!mission) return;
    if (!mission.notifiedEnginTiers) mission.notifiedEnginTiers = [];

    const regCount = (mission.registeredVolunteers || []).length;
    const reqCount = mission.requiredVolunteers || 3;
    const tier = Math.floor(regCount / 3);

    if (tier >= 1 && !mission.notifiedEnginTiers.includes(tier) && regCount < reqCount) {
      mission.notifiedEnginTiers.push(tier);

      const title = `🚨 Montée en Charge : Engin #${tier} Prêt !`;
      const body = `Équipage complet (${regCount} secouristes mobilisés) disponible pour engager un engin sur « ${mission.title} ». Départ échelonné possible !`;

      if (window.ProtecNotifications) {
        window.ProtecNotifications.notifyCategory('dps', title, body, `engin-tier-${mission.id}-${tier}`);
      } else if (window.ProtecIncidents) {
        window.ProtecIncidents.sendSystemNotification(title, body, `engin-tier-${mission.id}-${tier}`);
      }

      this.showToast(title, body, 'green');
    }
  }

  // Départ échelonné d'un premier engin (montée en charge progressive sur le terrain)
  launchEchelonMission(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    if (!this.aascConvention || !this.aascConvention.signed) {
      this.showToast('Convention d’AASC Requise ⚠️', 'Votre antenne doit obligatoirement souscrire sa Convention d’AASC auprès de la Préfecture (onglet Conventions) pour pouvoir engager des équipes en mission !', 'amber');
      this.openModule('conventions');
      return;
    }

    const availableToDepart = (mission.registeredVolunteers || []).filter(vid => {
      const v = this.volunteers.find(x => x.id === vid);
      return v && v.status !== 'mission';
    });

    if (availableToDepart.length < 3) {
      this.showToast('Effectif insuffisant', 'Il faut au minimum 3 secouristes réunis pour faire partir un premier engin en échelonné.', 'orange');
      return;
    }

    const veh = this.vehicles.find(v => v.status === 'dispo' && (v.type === 'VPSP' || v.type === 'VTU')) || this.vehicles.find(v => v.status === 'dispo' && !v.requiresTrailer);
    if (!veh) {
      this.showToast('Aucun véhicule disponible', 'Tous vos véhicules sont actuellement engagés.', 'orange');
      return;
    }

    const firstCrewIds = availableToDepart.slice(0, 3);
    firstCrewIds.forEach(vid => {
      const v = this.volunteers.find(x => x.id === vid);
      if (v) {
        v.status = 'mission';
        v.energy = Math.max(10, (v.energy || 80) - 15);
      }
    });

    veh.status = 'mission';
    veh.fuel = Math.max(10, (veh.fuel || 90) - 10);

    mission.status = 'ongoing';
    mission.echelonActive = true;
    mission.startedAt = Date.now();
    if (!mission.assignedCrew) mission.assignedCrew = { volunteers: [], vehicles: [] };
    mission.assignedCrew.volunteers = [...firstCrewIds];
    mission.assignedCrew.vehicles = [veh];

    const base = this.stations[0] || { lat: 48.8566, lng: 2.3522 };
    if (window.ProtecSystems) {
      window.ProtecSystems.startTransit(this, veh, { lat: base.lat, lng: base.lng }, { lat: mission.lat, lng: mission.lng }, mission, 2);
    }

    this.showToast('Montée en Charge Initiée', `Premier engin (${veh.name}) parti sur « ${mission.title} » avec 3 secouristes ! Les renforts poursuivent leur mobilisation.`, 'green');
    this.closeDrawer();
    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();
  }

  // Proposition de bascule d'un bénévole d'une mission à une autre (avec dialogue et évaluation de dispo)
  proposeVolunteerSwitch(volId, targetMissionId) {
    const vol = this.volunteers.find(v => v.id === volId);
    const targetMission = this.missions.find(m => m.id === targetMissionId);
    if (!vol || !targetMission) return;

    if (vol.status === 'mission') {
      this.showToast('Bénévole sur le Terrain', `${vol.name} est actuellement engagé(e) sur le terrain et ne peut pas être dérouté(e).`, 'orange');
      return;
    }

    // Recherche d'une autre mission sur laquelle ce bénévole est déjà inscrit
    const currentMission = this.missions.find(m => m.id !== targetMissionId && (m.registeredVolunteers || []).includes(volId) && ['planifie', 'prealerte', 'declenche'].includes(m.status));

    if (!currentMission) {
      if (!targetMission.registeredVolunteers.includes(volId)) {
        targetMission.registeredVolunteers.push(volId);
        this.showToast('Bénévole Affecté', `${vol.name} a été positionné(e) sur « ${targetMission.title} ».`, 'green');
        this.checkEnginProgressNotification(targetMission);
        this.saveGame();
        this.renderMissions();
        this.openMissionDetails(targetMissionId);
      }
      return;
    }

    // Le bénévole est déjà inscrit sur une autre mission : simulation réaliste de son accord
    const motivation = vol.motivation || 70;
    const humeur = vol.humeur || 70;
    const energy = vol.energy || 80;

    let chance = 0.35 + (motivation * 0.30 / 100) + (humeur * 0.20 / 100);
    if (vol.trait === 'devoue') chance += 0.25;
    if (vol.trait === 'casanier') chance -= 0.30;
    if (energy < 40) chance -= 0.25;

    const accepts = Math.random() < chance;

    if (accepts) {
      // Retrait de la mission d'origine
      currentMission.registeredVolunteers = currentMission.registeredVolunteers.filter(id => id !== volId);
      // Inscription sur la nouvelle mission
      if (!targetMission.registeredVolunteers.includes(volId)) {
        targetMission.registeredVolunteers.push(volId);
      }
      vol.energy = Math.max(10, (vol.energy || 80) - 5);

      this.showToast(
        '✅ Bascule Acceptée !',
        `${vol.name} : « C'est noté ! Je me désengage de « ${currentMission.title} » pour venir renforcer « ${targetMission.title} ». »`,
        'green'
      );
      this.checkEnginProgressNotification(targetMission);
    } else {
      const reasons = [
        'j’avais bloqué mon créneau spécifiquement pour la première mission',
        'mes horaires ne me permettent pas de changer de lieu',
        'j’ai déjà fait le point avec l’autre chef de dispositif',
        'je préfère conserver mon engagement initial'
      ];
      const r = reasons[Math.floor(Math.random() * reasons.length)];
      this.showToast(
        '❌ Bascule Refusée',
        `${vol.name} : « Désolé, je ne peux pas basculer : ${r}. Je reste sur « ${currentMission.title} ». »`,
        'orange'
      );
    }

    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();
    this.openMissionDetails(targetMissionId);
  }

  // --- CONVENTION PRÉFECTORALE D'AASC (BASE LÉGALE FONDATRICE) ---
  signAascConvention() {
    const cost = 800;
    if (this.resources.money < cost) {
      this.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour régler les frais d’enregistrement préfectoral de la Convention d'AASC.`, 'red');
      return;
    }

    this.resources.money -= cost;
    this.aascConvention = {
      signed: true,
      signedAt: Date.now(),
      cost: cost
    };
    this.resources.reputationScore = (this.resources.reputationScore || 0) + 50;

    this.showToast('Convention AASC Validée ! 📜', 'Votre antenne est désormais officiellement agréée de Sécurité Civile par la Préfecture ! Vous pouvez assurer vos missions.', 'green');
    this.saveGame();
    this.updateStatsUI();

    if (window.ProtecAdvancedSystems) {
      window.ProtecAdvancedSystems.syncAdaptiveTasks(this);
    }
    if (window.ProtecTutorial) {
      window.ProtecTutorial.advance(this);
    }
    if (this.currentModalKey === 'conventions' && window.ProtecConventions) {
      window.ProtecConventions.renderModal(this);
    }
  }

  // --- CONVENTION CADRE SAMU 15 (URGENCES RÉFLEXES VPSP) ---
  signSamuConvention() {
    if (!this.aascConvention || !this.aascConvention.signed) {
      this.showToast('Convention AASC Requise ⚠️', 'Votre antenne doit préalablement souscrire sa Convention d’AASC auprès de la Préfecture.', 'orange');
      this.openModule('conventions');
      return;
    }
    const vpsps = this.vehicles.filter(v => v.type === 'VPSP');
    const qualified = this.volunteers.filter(v => ['CE', 'PSE2', 'PSE1'].includes(v.rank));
    if (vpsps.length < 1 || qualified.length < 3) {
      this.showToast('Critères Non Remplis', 'Pour conventionner avec le SAMU 15, votre antenne doit disposer d’au moins 1 ambulance VPSP et 3 secouristes qualifiés (CE, PSE2, PSE1).', 'orange');
      return;
    }

    this.samuConvention = {
      signed: true,
      signedAt: Date.now(),
      totalInterventions: 0
    };
    this.resources.money += 350; // Dotation de mise en route SAMU
    this.resources.reputationScore = (this.resources.reputationScore || 0) + 20;
    this.showToast('Convention SAMU 15 Signée ! 🚑', 'Partenariat avec la régulation départementale 15 activé (+350 € dotation). Vous pouvez désormais armer des gardes.', 'green');
    this.saveGame();
    this.updateStatsUI();

    if (window.ProtecAdvancedSystems) {
      window.ProtecAdvancedSystems.syncAdaptiveTasks(this);
    }
    if (this.currentModalKey === 'samu') this.openModule('samu');
    else if (this.currentModalKey === 'conventions') window.ProtecConventions.renderModal(this);
  }

  terminateSamuConvention() {
    if (this.samuGarde && this.samuGarde.active) {
      this.stopSamuGuard();
    }
    this.samuConvention = { signed: false, signedAt: null, totalInterventions: 0 };
    this.showToast('Convention SAMU 15 Résiliée', 'La convention avec la régulation SAMU a été suspendue.', 'slate');
    this.saveGame();
    this.updateStatsUI();
    if (this.currentModalKey === 'samu') this.openModule('samu');
    else if (this.currentModalKey === 'conventions') window.ProtecConventions.renderModal(this);
  }

  // --- CONVENTION PARTENARIALE SDIS (GARDES CASERNE POMPIERS) ---
  signSdisConvention() {
    if (!this.aascConvention || !this.aascConvention.signed) {
      this.showToast('Convention AASC Requise ⚠️', 'Votre antenne doit préalablement souscrire sa Convention d’AASC auprès de la Préfecture.', 'orange');
      this.openModule('conventions');
      return;
    }
    const vpsps = this.vehicles.filter(v => v.type === 'VPSP');
    const qualified = this.volunteers.filter(v => ['CE', 'PSE2', 'PSE1'].includes(v.rank));
    if (vpsps.length < 1 || qualified.length < 3) {
      this.showToast('Critères Non Remplis', 'Pour conventionner avec le SDIS, votre antenne doit disposer d’au moins 1 ambulance VPSP et 3 secouristes qualifiés.', 'orange');
      return;
    }

    this.sdisConvention = {
      signed: true,
      signedAt: Date.now(),
      totalInterventions: 0
    };
    this.resources.money += 350; // Dotation de mise en route SDIS
    this.resources.reputationScore = (this.resources.reputationScore || 0) + 20;
    this.showToast('Convention SDIS Signée ! 🚒', 'Partenariat avec le Service Départemental d’Incendie et de Secours activé (+350 € dotation). Vous pouvez armer les gardes pompiers.', 'green');
    this.saveGame();
    this.updateStatsUI();

    if (window.ProtecAdvancedSystems) {
      window.ProtecAdvancedSystems.syncAdaptiveTasks(this);
    }
    if (this.currentModalKey === 'pompiers') this.openModule('pompiers');
    else if (this.currentModalKey === 'conventions') window.ProtecConventions.renderModal(this);
  }

  terminateSdisConvention() {
    if (this.sdisGarde && this.sdisGarde.active) {
      this.disarmSdisDispositif();
    }
    this.sdisConvention = { signed: false, signedAt: null, totalInterventions: 0 };
    this.showToast('Convention SDIS Résiliée', 'La convention partenariale avec les pompiers a été suspendue.', 'slate');
    this.saveGame();
    this.updateStatsUI();
    if (this.currentModalKey === 'pompiers') this.openModule('pompiers');
    else if (this.currentModalKey === 'conventions') window.ProtecConventions.renderModal(this);
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
    this.candidatures = [];
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

    const currentDay = this.clock?.day || 1;
    const waitDays = Math.max(0, currentDay - (cand.createdDay || currentDay));
    const waitPenalty = waitDays >= 2 ? Math.min(40, waitDays * 15) : 0;

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
      motivation: Math.max(30, (cand.motivationGrade ? Math.min(100, parseInt(cand.motivationGrade) * 5) : (cand.motivationScore || 85)) - waitPenalty),
      skills: cand.skills || [initialRank],
      energy: Math.max(50, 90 - waitPenalty),
      humeur: Math.max(30, 85 - waitPenalty)
    };

    this.volunteers.push(newVol);
    this.closeModal();
    this.updateStatsUI();
    this.saveGame();
    if (waitDays >= 2) {
      this.showToast('Bénévole Intégré (Démotivé)', `${cand.name} a signé sa charte mais débute avec un moral entamé (${newVol.motivation}%) après ${waitDays} jours d’attente sans réponse.`, 'orange');
    } else {
      this.showToast('Bénévole Intégré !', `${cand.name} (${initialRank}${cand.isTrainer ? ' • Formateur' : ''}) a signé sa charte d'engagement bénévole !`, 'green');
    }
    this.openModule('recrutement');
  }

  toggleShowCandidatures() {
    this.showCandidaturesView = !this.showCandidaturesView;
    this.openModule('recrutement', true);
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

    if (!this.aascConvention || !this.aascConvention.signed) {
      this.showToast('Convention d’AASC Requise ⚠️', 'Votre antenne doit obligatoirement souscrire sa Convention d’AASC auprès de la Préfecture (onglet Conventions) pour pouvoir engager des équipes en mission !', 'amber');
      this.openModule('conventions');
      return;
    }

    // Vérification stricte des Agréments de Sécurité Civile officiels
    if (this.resources.agrements) {
      if (mission.type === 'samu' && !this.resources.agrements.A) {
        this.showToast('Agrément Manquant', 'L’Agrément A (SAMU 15) est obligatoire pour les départs réflexes ! Obtenez-le dans le pôle Recrutement.', 'orange');
        return;
      }
      // Pour le social et les maraudes : pas d'agrément exigé (conventions de subventions d'objectifs DDETS, CCAS, CD, Métropole)
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
        // Vérification remorque (ERS Bateau, Quad, Remorque) : Tractage obligatoire
        if (dispoVeh.requiresTrailer) {
          const tractor = this.vehicles.find(v => v.id !== dispoVeh.id && v.status === 'dispo' && v.hasTowHitch);
          if (!tractor) {
            this.showToast('Véhicule avec Attelage Requis ! ⚠️', `${dispoVeh.name} est sur remorque (fournie). Il vous faut un véhicule tracteur équipé d'un crochet d'attelage disponible (VL, VTU...) pour le tracter sur la mission !`, 'orange');
            return;
          }
          tractor.status = 'mission';
          tractor.fuel = Math.max(10, (tractor.fuel || 90) - 10);
          assignedVehicles.push(tractor);
        }

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

    // Enregistrement de la recette dans le grand livre de trésorerie
    if (mission.rewardMoney && window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(this, mission.rewardMoney, `Indemnité Mission : ${mission.title}`, 'prestation');
    }

    // 2. PRISE EN CHARGE DU PÔLE SOCIAL LORS D'UNE MARAUDE
    if (mission.type === 'social' && window.ProtecSocial) {
      window.ProtecSocial.onMaraudeCompleted(this, 4);
    }

    // 2b. COUVERTURE COMMUNICATION & PRESSE (Photographe / Vidéaste d'antenne avec compétence 'communication')
    const comSpecialist = crew.find(v => v.skills && v.skills.includes('communication'));
    if (comSpecialist) {
      const donBonus = 180 + Math.floor(Math.random() * 150);
      const repBonus = 25 + Math.floor(Math.random() * 15);
      this.resources.money += donBonus;
      this.resources.reputationScore += repBonus;

      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(this, donBonus, `Dons Publics Réseaux Sociaux (Reportage de ${comSpecialist.name})`, 'communication');
      }

      this.showToast(
        '📸 Couverture Réseaux Réussie !',
        `${comSpecialist.name} (chargé de com' / photographe) a publié le reportage de l'intervention : +${donBonus} € de dons citoyens en ligne et +${repBonus} pts de notoriété !`,
        'purple'
      );

      // 40% de chance d'inspirer une candidature spontanée
      if (Math.random() < 0.40 && typeof this.generateRandomCandidature === 'function') {
        setTimeout(() => {
          this.generateRandomCandidature();
          this.showToast('Nouvelle Recrue Sensibilisée !', 'Un citoyen a découvert votre antenne grâce aux photos sur les réseaux sociaux et a postulé comme bénévole !', 'blue');
        }, 1500);
      }
    }

    // 2c. SOUTIEN PSYCHOLOGIQUE AEP (Aide et Écoute Psychologique)
    const aep2Specialist = crew.find(v => v.skills && v.skills.includes('aep2'));
    const aep1Specialist = crew.find(v => v.skills && v.skills.includes('aep1'));
    if (aep2Specialist) {
      this.resources.reputationScore = (this.resources.reputationScore || 0) + 30;
      this.showToast(
        '🫂 Soutien Psycho Approfondi (AEP2)',
        `${aep2Specialist.name} (Praticien AEP2) a mené le debriefing post-intervention et le defusing de l’équipage : fatigue divisée par 2 et +30 pts de notoriété !`,
        'purple'
      );
    } else if (aep1Specialist) {
      this.resources.reputationScore = (this.resources.reputationScore || 0) + 15;
      this.showToast(
        '🧠 Écoute Psychologique d’Urgence (AEP1)',
        `${aep1Specialist.name} (Sensibilisé AEP1) a désamorcé l’angoisse des victimes et témoins sur les lieux (+15 pts de notoriété).`,
        'indigo'
      );
    }

    // 2d. BONUS OPÉRATIONNELS DES LOTS D'INTERVENTION & DE SECOURS DE CRISE
    if (window.ProtecEquipements) {
      window.ProtecEquipements.checkMissionLotBonus(this, mission);
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
        const result = window.ProtecPersonnel.applyMissionExertion(v, mission, !!aep2Specialist);
        if (result && result.burnout) {
          this.showToast('Alerte Surmenage / Burnout', `${v.name} est épuisé(e) et placé(e) en repos obligatoire (30 min).`, 'red');
        }
      } else {
        const baseDrain = aep2Specialist ? 8 : 15;
        v.energy = Math.max(10, (v.energy || 80) - baseDrain);
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
  }

  // --- GESTION DES IDENTITÉS DES BÉNÉVOLES (NOM ET PRÉNOM UNIQUEMENT) ---
  openRenameVolunteerModal(volunteerId) {
    const v = this.volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    const clean = this.cleanVolunteerName(v.name);
    const parts = clean.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const modalId = 'rename-volunteer-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-md p-6 shadow-2xl border border-white/95 space-y-4 animate-scale-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-pc-blue/10 text-pc-blue flex items-center justify-center text-xl">
              ✏️
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Identité du Bénévole</h3>
              <p class="text-xs text-slate-500">Modification du prénom et du nom uniquement</p>
            </div>
          </div>
          <button onclick="document.getElementById('${modalId}').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition">
            ✕
          </button>
        </div>

        <div class="p-3 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs flex items-center gap-2.5 text-blue-900">
          <span class="text-lg">ℹ️</span>
          <span>Grade actuel : <strong>${v.rank}</strong> (${v.role || 'Secouriste'}). Les compétences et l'expérience restent inchangées.</span>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Prénom</label>
            <input id="rename-vol-firstname" type="text" value="${firstName.replace(/"/g, '&quot;')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-pc-blue focus:ring-2 focus:ring-pc-blue/30 text-xs font-bold text-slate-900 bg-white" placeholder="ex: Alexandre" />
          </div>

          <div>
            <label class="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Nom</label>
            <input id="rename-vol-lastname" type="text" value="${lastName.replace(/"/g, '&quot;')}" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-pc-blue focus:ring-2 focus:ring-pc-blue/30 text-xs font-bold text-slate-900 bg-white" placeholder="ex: Roux" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button onclick="document.getElementById('${modalId}').remove()" class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
            Annuler
          </button>
          <button onclick="window.game.confirmRenameVolunteer('${v.id}')" class="px-5 py-2.5 rounded-xl text-xs font-black bg-pc-blue hover:bg-pc-blue-light text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <span>Enregistrer l'identité</span>
          </button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const input = document.getElementById('rename-vol-firstname');
      if (input) { input.focus(); input.select(); }
    }, 100);
  }

  confirmRenameVolunteer(volunteerId) {
    const v = this.volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    const fnInput = document.getElementById('rename-vol-firstname');
    const lnInput = document.getElementById('rename-vol-lastname');
    const firstName = fnInput ? fnInput.value.trim() : '';
    const lastName = lnInput ? lnInput.value.trim() : '';

    if (!firstName && !lastName) {
      this.showToast('Champ requis', 'Veuillez saisir au moins un prénom ou un nom.', 'orange');
      return;
    }

    const newFullName = this.cleanVolunteerName(`${firstName} ${lastName}`.trim());
    v.name = newFullName;

    const modal = document.getElementById('rename-volunteer-modal');
    if (modal) modal.remove();

    this.saveGame();
    this.updateStatsUI();
    this.showToast('Identité Mise à Jour', `Le bénévole s'appelle désormais « ${newFullName} ».`, 'green');

    // Rafraîchir l'affichage actif
    if (this.selectedStationId) {
      this.openStationDetails(this.selectedStationId);
    }
    const currentModule = document.getElementById('main-modal');
    if (currentModule && !currentModule.classList.contains('hidden')) {
      const title = document.getElementById('modal-title');
      if (title && title.textContent.includes('Recrutement')) {
        this.openModule('recrutement', true);
      }
    }
  }

  // Nettoyage de sécurité pour garantir qu'aucune mention de genre ne persiste dans les noms ou tooltips
  cleanVolunteerName(name) {
    if (!name) return 'Secouriste';
    return String(name).replace(/\s*\((femme|homme|f|h)\)/gi, '').trim();
  }

  // Rendu moderne et professionnel de l'icône de bénévole (icônes vectorielles distinctes homme / femme sans distinction de couleur)
  getVolunteerAvatarHTML(v, sizeClass = 'w-7 h-7') {
    if (!v) return '';
    if (v.name) v.name = this.cleanVolunteerName(v.name);
    const cleanName = v.name || 'Secouriste';
    const nameLower = cleanName.toLowerCase();
    const isFemale = (
      v.gender === 'f' ||
      v.gender === 'F' ||
      v.sexe === 'f' ||
      v.sexe === 'F' ||
      ['sarah', 'élodie', 'elodie', 'léa', 'lea', 'manon', 'jade', 'chloé', 'chloe', 'inès', 'ines', 'pauline', 'océane', 'oceane', 'camille', 'stéphanie', 'stephanie', 'sophie', 'marie', 'clara', 'valérie', 'valerie', 'emma', 'charlotte', 'juliette', 'audrey', 'céline', 'celine', 'laura', 'marion', 'clémentine', 'clementine', 'aurélie', 'aurelie', 'nathalie'].some(fn => nameLower.startsWith(fn))
    );

    // Icône Homme fidèle (raie/décroché à gauche, col rond U, épaules)
    const maleSvg = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full p-0.5">
        <!-- Tête avec raie/décroché à gauche et menton arrondi -->
        <path d="M 5.8 3.2 H 14.5 C 16.2 3.2 17.2 4.4 17.2 6.2 V 11 C 17.2 14.8 6.8 14.8 6.8 11 V 6.2 H 5.8 Z" />
        <!-- Col rond U -->
        <path d="M 9.8 14.2 C 9.8 16.8 14.2 16.8 14.2 14.2" />
        <!-- Épaules -->
        <path d="M 4 21.5 V 18 C 4 15.5 7.2 14.5 9.2 14.2" />
        <path d="M 14.8 14.2 C 16.8 14.5 20 15.5 20 18 V 21.5" />
      </svg>
    `;

    // Icône Femme fidèle (coupe au carré en cloche, col V, épaules connectées)
    const femaleSvg = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full p-0.5">
        <!-- Chevelure au carré dôme et retours horizontaux -->
        <path d="M 9.5 12.5 H 6.5 V 7.5 C 6.5 3.4 17.5 3.4 17.5 7.5 V 12.5 H 14.5" />
        <!-- Col V distinctif -->
        <path d="M 9.6 14.5 L 12 17.5 L 14.4 14.5" />
        <!-- Épaules connectées à la coupe de cheveux -->
        <path d="M 9.5 12.5 C 7.2 14 4 15.5 4 18 V 21.5" />
        <path d="M 14.5 12.5 C 16.8 14 20 15.5 20 18 V 21.5" />
      </svg>
    `;

    return `
      <div class="${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs transition" title="${cleanName}">
        ${isFemale ? femaleSvg : maleSvg}
      </div>
    `;
  }

  // Récupère l'ensemble exhaustif des compétences et qualifications d'un bénévole
  getVolunteerAllSkills(v) {
    if (!v) return [];
    const skillsMap = {
      'cd': { id: 'cd', label: 'Chef de Dispositif (CD)', cat: 'DPS', badge: 'CD', color: 'bg-amber-950/90 text-amber-300 border-amber-500/70' },
      'ce': { id: 'ce', label: 'Chef d’Équipe (CE)', cat: 'DPS', badge: 'CE', color: 'bg-indigo-950/90 text-indigo-300 border-indigo-500/70' },
      'pse2': { id: 'pse2', label: 'PSE2 Équipier Secouriste', cat: 'Secours', badge: 'PSE2', color: 'bg-blue-950/90 text-sky-300 border-sky-400/70' },
      'pse1': { id: 'pse1', label: 'PSE1 Secouriste', cat: 'Secours', badge: 'PSE1', color: 'bg-sky-950/90 text-sky-300 border-sky-400/70' },
      'stagiaire': { id: 'stagiaire', label: 'Stagiaire en Intégration', cat: 'Formation', badge: 'STAG', color: 'bg-slate-800 text-slate-300 border-slate-600' },
      'psc1': { id: 'psc1', label: 'PSC1 / Premiers Secours', cat: 'Secours', badge: 'PSC1', color: 'bg-teal-950/90 text-teal-300 border-teal-500/70' },
      'permis_vpsp': { id: 'permis_vpsp', label: 'P.VPSP Conduite Ambulance', cat: 'Véhicule', badge: 'P.VPSP', color: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/70' },
      'permis_b': { id: 'permis_b', label: 'Permis B (VL / VTU)', cat: 'Véhicule', badge: 'Permis B', color: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/70' },
      'formateur_ps': { id: 'formateur_ps', label: 'Formateur Premiers Secours (PS)', cat: 'Pédagogie', badge: 'Formateur PS', color: 'bg-orange-950/90 text-orange-300 border-orange-500/70' },
      'formateur_psc': { id: 'formateur_psc', label: 'Formateur PSC (PIC F)', cat: 'Pédagogie', badge: 'Formateur PSC', color: 'bg-amber-950/90 text-amber-300 border-amber-500/70' },
      'formateur_sst': { id: 'formateur_sst', label: 'Formateur SST', cat: 'Pédagogie', badge: 'Formateur SST', color: 'bg-amber-950/90 text-amber-300 border-amber-500/70' },
      'formateur_de_formateur': { id: 'formateur_de_formateur', label: 'Formateur de Formateurs (FdF)', cat: 'Pédagogie', badge: 'FdF', color: 'bg-purple-950/90 text-purple-300 border-purple-500/70' },
      'aep1': { id: 'aep1', label: 'AEP1 Écoute d’Urgence', cat: 'Soutien', badge: 'AEP1', color: 'bg-rose-950/90 text-rose-300 border-rose-500/70' },
      'aep2': { id: 'aep2', label: 'AEP2 Soutien CAI & Catastrophe', cat: 'Soutien', badge: 'AEP2', color: 'bg-rose-950/90 text-rose-300 border-rose-500/70' },
      'telepilote': { id: 'telepilote', label: 'Télépilote Drone S1/S3', cat: 'Spécialité', badge: 'Drone', color: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/70' },
      'cyno': { id: 'cyno', label: 'Cynotechnie (Maître-Chien)', cat: 'Spécialité', badge: 'Cyno', color: 'bg-amber-950/90 text-amber-300 border-amber-600/70' },
      'communication': { id: 'communication', label: 'Communication & Médias', cat: 'Presse', badge: 'Com/Média', color: 'bg-pink-950/90 text-pink-300 border-pink-500/70' }
    };

    const detected = new Set();
    const existing = Array.isArray(v.skills) ? v.skills : [];
    existing.forEach(s => {
      if (!s) return;
      const clean = String(s).toLowerCase().replace(/[- ]/g, '_');
      if (clean.includes('vpsp') || clean.includes('pilotage')) detected.add('permis_vpsp');
      else if (clean.includes('psc') && clean.includes('formateur')) detected.add('formateur_psc');
      else if (clean.includes('ps') && clean.includes('formateur')) detected.add('formateur_ps');
      else if (clean === 'formateur' || clean.includes('formateur')) {
        detected.add('formateur_psc');
        if (['PSE2', 'CE', 'CD'].includes(v.rank)) detected.add('formateur_ps');
      } else if (clean.includes('ce') || clean === 'chef_equipe') detected.add('ce');
      else if (clean.includes('cd') || clean === 'chef_dispositif') detected.add('cd');
      else if (clean.includes('pse2')) detected.add('pse2');
      else if (clean.includes('pse1')) detected.add('pse1');
      else if (clean.includes('drone') || clean.includes('telepilote')) detected.add('telepilote');
      else if (clean.includes('cyno') || clean.includes('chien')) detected.add('cyno');
      else if (clean.includes('aep2')) detected.add('aep2');
      else if (clean.includes('aep1') || clean.includes('aep')) detected.add('aep1');
      else if (clean.includes('com')) detected.add('communication');
      else if (skillsMap[clean]) detected.add(clean);
    });

    // Déduction selon le grade opérationnel officiel de la Protection Civile
    const rank = v.rank || '';
    if (rank === 'CD' || rank.includes('Dispositif')) {
      detected.add('cd');
      detected.add('ce');
      detected.add('pse2');
      detected.add('pse1');
      detected.add('permis_vpsp');
      detected.add('permis_b');
    } else if (rank === 'CE' || rank.includes('Équipe')) {
      detected.add('ce');
      detected.add('pse2');
      detected.add('pse1');
      detected.add('permis_vpsp');
      detected.add('permis_b');
    } else if (rank === 'PSE2' || rank.includes('Équipier')) {
      detected.add('pse2');
      detected.add('pse1');
      detected.add('permis_b');
      if ((v.exp || 0) >= 25 || v.hasPermisVpsp) detected.add('permis_vpsp');
    } else if (rank === 'PSE1' || rank.includes('Secouriste')) {
      detected.add('pse1');
      detected.add('permis_b');
      if ((v.exp || 0) >= 35 || v.hasPermisVpsp) detected.add('permis_vpsp');
    } else if (rank === 'Stagiaire' || rank.includes('Stagiaire')) {
      detected.add('stagiaire');
      detected.add('psc1');
    }

    if (v.isTrainer) {
      detected.add('formateur_psc');
      if (['PSE2', 'CE', 'CD'].includes(rank)) detected.add('formateur_ps');
    }

    return Array.from(detected).map(id => {
      return skillsMap[id] || {
        id: id,
        label: id.toUpperCase(),
        cat: 'Qualif',
        badge: id.toUpperCase(),
        color: 'bg-slate-700 text-slate-200 border-slate-600'
      };
    });
  }

  // Infobulle globale et absolue pour l'affichage sans obstruction des compétences (z-index 99999)
  showFloatingSkillsTooltip(e, volId, isClick = false) {
    const el = document.getElementById('global-skills-tooltip');
    const vol = (this.volunteers || []).find(v => String(v.id) === String(volId)) || (this.candidatures || []).find(c => String(c.id) === String(volId));
    if (!el || !vol) return;

    // Forcer le style sombre haute visibilité directement en JS pour garantir un contraste sans faille
    el.style.backgroundColor = '#0b1120';
    el.style.color = '#f8fafc';
    el.style.border = '2px solid #334155';
    el.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.12)';
    el.style.zIndex = '99999';

    const allSkills = this.getVolunteerAllSkills(vol);
    const skillsBadges = allSkills.length > 0
      ? allSkills.map(s => `
          <div class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-between gap-2 shadow-xs ${s.color}">
            <span class="font-mono font-black tracking-wide">${s.badge || s.id.toUpperCase()}</span>
            <span class="text-[9.5px] font-medium opacity-95 truncate">${s.label}</span>
          </div>
        `).join('')
      : `<span class="text-[10px] text-slate-300 italic">Formation initiale ${vol.rank || 'Secouriste'}</span>`;

    el.innerHTML = `
      <div class="font-black text-xs text-white mb-2.5 pb-2 border-b border-slate-700/80 flex items-center justify-between gap-2">
        <span class="flex items-center gap-2 truncate">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 flex-shrink-0"></span>
          <span class="text-white font-black truncate">${vol.name}</span>
        </span>
        <span class="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-pc-blue text-white font-black border border-blue-400/80 flex-shrink-0">${vol.rank || 'Secouriste'}</span>
      </div>
      <div class="text-[10px] font-black uppercase text-amber-300 mb-2 tracking-wider flex items-center gap-1.5">
        <i data-lucide="award" class="w-3.5 h-3.5 text-amber-400 flex-shrink-0"></i>
        <span>Compétences & Habilitations :</span>
      </div>
      <div class="space-y-1.5 mb-2.5 max-h-72 overflow-y-auto pr-1.5 custom-scrollbar">
        ${skillsBadges}
      </div>
      <div class="text-[9.5px] text-slate-300 pt-2 border-t border-slate-800 flex justify-between items-center font-medium">
        <span>Dispo : <strong class="text-white font-bold">${vol.dispoJours?.join(', ') || 'Semaine & WE'}</strong></span>
        <span>Énergie : <strong class="text-emerald-400 font-bold">${vol.energy || 80}%</strong></span>
      </div>
    `;

    const target = e.currentTarget || e.target;
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 300;
    let left = rect.left;
    if (left + tooltipWidth > window.innerWidth - 12) {
      left = window.innerWidth - tooltipWidth - 12;
    }
    if (left < 12) left = 12;

    // Calcul de position sans tronquage
    el.classList.remove('hidden');
    el.style.left = `${left}px`;
    el.style.top = '-9999px';
    const tipHeight = el.offsetHeight || 320;

    let top = rect.bottom + 6;
    if (top + tipHeight > window.innerHeight - 12) {
      // Si dépasse en bas, placer au-dessus de l'élément
      top = rect.top - tipHeight - 6;
    }
    if (top < 12) {
      top = 12;
      el.style.maxHeight = `${window.innerHeight - 24}px`;
    } else {
      el.style.maxHeight = '';
    }

    el.style.top = `${top}px`;
    if (window.lucide) window.lucide.createIcons();

    if (isClick) {
      const dismiss = (ev) => {
        if (!el.contains(ev.target) && ev.target !== target) {
          el.classList.add('hidden');
          document.removeEventListener('click', dismiss);
        }
      };
      setTimeout(() => document.addEventListener('click', dismiss), 50);
    }
  }

  hideFloatingSkillsTooltip() {
    const el = document.getElementById('global-skills-tooltip');
    if (el) el.classList.add('hidden');
  }

  // Rendu de l'infobulle affichant les compétences détaillées au survol
  getVolunteerSkillsPopoverHTML(v) {
    if (!v) return '';
    return `
      <div class="inline-flex items-center mt-0.5">
        <button type="button" 
          onmouseenter="window.game.showFloatingSkillsTooltip(event, '${v.id}')"
          onmouseleave="window.game.hideFloatingSkillsTooltip()"
          onclick="event.stopPropagation(); window.game.showFloatingSkillsTooltip(event, '${v.id}', true)"
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-pc-blue hover:text-white text-[10.5px] text-slate-700 transition cursor-pointer font-bold border border-slate-300 shadow-2xs group/skill-btn">
          <i data-lucide="award" class="w-3.5 h-3.5 text-pc-blue group-hover/skill-btn:text-white transition-colors"></i>
          <span>Compétences</span>
        </button>
      </div>
    `;
  }

  // Appel téléphonique individuel à un bénévole pour trouver du monde (+ de chance qu'un SMS, mais pas à 100%)
  callVolunteerIndividually(missionId, volId) {
    const mission = this.missions.find(m => m.id === missionId);
    const vol = this.volunteers.find(v => v.id === volId);
    if (!mission || !vol) return;

    if (mission.registeredVolunteers.includes(volId)) {
      this.showToast('Déjà Inscrit', `${vol.name} est déjà inscrit(e) sur ce dispositif.`, 'blue');
      return;
    }

    if (mission.registeredVolunteers.length >= mission.requiredVolunteers) {
      this.showToast('Dispositif Complet', 'Tous les postes secouristes sont déjà pourvus pour cette mission.', 'orange');
      return;
    }

    if (vol.status === 'mission') {
      this.showToast('Secouriste en Mission', `${vol.name} est actuellement sur le terrain et ne peut être mobilisé(e).`, 'orange');
      return;
    }

    // Calcul de probabilité de l'appel téléphonique (plus de chance que par simple SMS, mais pas à 100%)
    const motivation = vol.motivation !== undefined ? vol.motivation : 70;
    const energy = vol.energy !== undefined ? vol.energy : 80;
    const humeur = vol.humeur !== undefined ? vol.humeur : 70;

    // Base à 45% + bonus motivation et humeur
    let proba = 0.45 + (motivation * 0.30 / 100) + (humeur * 0.20 / 100);

    // Pénalités de fatigue
    if (energy < 30) proba -= 0.35;
    else if (energy < 55) proba -= 0.15;

    // Traits de caractère
    if (vol.trait === 'devoue') proba += 0.18;
    if (vol.trait === 'casanier') proba -= 0.18;
    if (vol.contractType === 'salarie') proba += 0.25;

    // Bornes : entre 18% et 92% (jamais 100% garanti)
    proba = Math.max(0.18, Math.min(0.92, proba));

    const willAccept = Math.random() <= proba;

    if (willAccept) {
      mission.registeredVolunteers.push(vol.id);
      vol.motivation = Math.min(100, (vol.motivation || 70) + 4);
      this.showToast('Appel Réussi : DISPO !', `Accord direct de ${vol.name} (${vol.rank}) : « Reçu chef ! Je me prépare et j’arrive à l’antenne pour ${mission.title}. »`, 'green');
      this.checkEnginProgressNotification(mission);
    } else {
      const excuses = [
        'retenu(e) par une urgence familiale',
        'en poste au travail, impossible de se libérer',
        'besoin impératif de repos ce soir',
        'déjà engagé(e) sur un rendez-vous personnel'
      ];
      const r = excuses[Math.floor(Math.random() * excuses.length)];
      this.showToast('Appel : Indisponible', `${vol.name} (${vol.rank}) décline poliment : « Désolé chef, ${r}. »`, 'slate');
    }

    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();

    if (this.selectedMissionId === mission.id) {
      this.openMissionDetails(mission.id);
    }
  }

  formatSkillName(skill) {
    if (!skill) return '';
    const skillsMap = {
      'pse1': 'PSE1 Secouriste',
      'pse2': 'PSE2 Équipier',
      'ce': 'Chef d’Équipe (CE)',
      'cd': 'Chef de Dispositif (CD)',
      'cp': 'Chef de Poste (CP)',
      'aep1': 'AEP1 Écoute d’Urgence',
      'aep2': 'AEP2 Soutien & CAI',
      'formateur_psc': 'Formateur PSC (PIC F)',
      'formateur_ps': 'Formateur Premiers Secours',
      'formateur_sst': 'Formateur SST',
      'formateur_aep': 'Formateur AEP',
      'formateur_de_formateur': 'Formateur de Formateurs (FdF)',
      'cef': 'CEF Encadrant Formation',
      'communication': 'Communication & Médias',
      'pilotage': 'Conduite d’Urgence VPSP',
      'ci': 'Chef d’Intervention',
      'ca': 'Chef d’Agrès',
      'conducteur': 'Conducteur VPSP'
    };
    if (skillsMap[skill]) return skillsMap[skill];
    return String(skill).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getMissionRoles() {
    return [
      { id: 'stagiaire', label: 'Stagiaire', icon: 'graduation-cap', desc: 'Stagiaire en observation ou formation initiale' },
      { id: 'logisticien', label: 'Logisticien', icon: 'package', desc: 'Gestion logistique, approvisionnement et matériel' },
      { id: 'photographe', label: 'Photographe / Vidéaste', icon: 'camera', reqSkill: 'communication', desc: 'Couverture médiatique et communication (+bonus popularité)' },
      { id: 'secouriste', label: 'Secouriste', icon: 'user', desc: 'Intervenant de premier niveau (PSE1)' },
      { id: 'equipier', label: 'Équipier-Secouriste', icon: 'heart-pulse', desc: 'Équipier secouriste qualifié (PSE2)' },
      { id: 'conducteur', label: 'Conducteur', icon: 'truck', reqSkill: 'pilotage', desc: 'Conduite opérationnelle du VPSP / VTU' },
      { id: 'chef_binome', label: 'Chef Binôme', icon: 'users', desc: 'Responsable du binôme de secours' },
      { id: 'chef_equipe', label: 'Chef d’équipe', icon: 'shield', desc: 'Commandement opérationnel de l’équipe' },
      { id: 'chef_poste', label: 'Chef de Poste', icon: 'home', desc: 'Responsable de la structure de soins fixe' },
      { id: 'chef_secteur', label: 'Chef de Secteur', icon: 'compass', desc: 'Coordination tactique sur un secteur géographique' },
      { id: 'chef_dispositif', label: 'Chef de Dispositif', icon: 'award', desc: 'Commandant des opérations de secours du DPS (CDS)' },
      { id: 'pc', label: 'PC (Poste de commandement)', icon: 'radio', desc: 'Opérateur transmissions, SINUS et traçabilité' }
    ];
  }

  setVolunteerMissionRole(missionId, volId, roleId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;
    mission.volunteerRoles = mission.volunteerRoles || {};
    mission.volunteerRoles[volId] = roleId;
    this.saveGame();
    if (this.selectedMissionId === missionId) {
      this.openMissionDetails(missionId);
    }
  }

  autoAssignMissionRoles(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;
    mission.volunteerRoles = mission.volunteerRoles || {};
    const vols = this.volunteers.filter(v => mission.registeredVolunteers?.includes(v.id));
    if (vols.length === 0) return;

    let hasChefDispo = false;
    let hasChefPoste = false;
    let hasChefEquipe = false;
    let hasConducteur = false;
    let hasPhotographe = false;
    let hasPc = false;

    vols.forEach(v => {
      const skills = v.skills || [];
      const rank = v.rank || 'Secouriste';

      // 1. Chef de Dispositif
      if (!hasChefDispo && (rank === 'Chef de Dispositif' || rank.includes('Dispositif'))) {
        mission.volunteerRoles[v.id] = 'chef_dispositif';
        hasChefDispo = true;
        return;
      }

      // 2. Chef de Poste ou Chef d'équipe
      if (!hasChefPoste && (rank.includes('Chef') || rank === 'Chef d’Équipe')) {
        mission.volunteerRoles[v.id] = (mission.requiredVolunteers >= 6) ? 'chef_poste' : 'chef_equipe';
        hasChefPoste = true;
        return;
      }

      // 3. Conducteur si pilotage
      if (!hasConducteur && (skills.includes('pilotage') || skills.includes('conducteur'))) {
        mission.volunteerRoles[v.id] = 'conducteur';
        hasConducteur = true;
        return;
      }

      // 4. Photographe si compétence communication
      if (!hasPhotographe && skills.includes('communication')) {
        mission.volunteerRoles[v.id] = 'photographe';
        hasPhotographe = true;
        return;
      }

      // 5. Opérateur PC si effectif important
      if (!hasPc && vols.length >= 6 && (rank.includes('Équipe') || skills.includes('ce') || skills.includes('ci'))) {
        mission.volunteerRoles[v.id] = 'pc';
        hasPc = true;
        return;
      }

      // 6. Stagiaire
      if (rank === 'Stagiaire') {
        mission.volunteerRoles[v.id] = 'stagiaire';
        return;
      }

      // 7. Équipier (PSE2)
      if (rank === 'Équipier' || skills.includes('pse2')) {
        mission.volunteerRoles[v.id] = 'equipier';
        return;
      }

      // 8. Secouriste standard
      mission.volunteerRoles[v.id] = 'secouriste';
    });

    this.saveGame();
    this.showToast('Rôles Affectés', `Les rôles des ${vols.length} intervenants ont été attribués de façon optimale selon leurs qualifications.`, 'blue');
    if (this.selectedMissionId === missionId) {
      this.openMissionDetails(missionId);
    }
  }

  cancelDpsMission(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    if (mission.status === 'ongoing' || mission.status === 'completed') {
      this.showToast('Action Impossible', 'Un dispositif déjà engagé sur le terrain ne peut pas être annulé.', 'orange');
      return;
    }

    let repLoss = 3;
    let alertMsg = 'Annulation anticipée du DPS';
    if (mission.eventDate) {
      const todayDay = this.currentDayIndex || 0;
      const daysUntil = (mission.eventDate.dayIndex !== undefined ? mission.eventDate.dayIndex - todayDay : 1);
      if (daysUntil <= 0) {
        repLoss = 12; // Le jour même
        alertMsg = 'Annulation le jour même du DPS';
      } else if (daysUntil === 1) {
        repLoss = 8; // La veille
        alertMsg = 'Annulation la veille du DPS';
      } else {
        repLoss = 4;
      }
    } else {
      repLoss = 5;
    }

    if (!confirm(`Êtes-vous certain de vouloir annuler le DPS « ${mission.title} » ?\n\nAttention : Cette annulation impactera la popularité de votre antenne (-${repLoss} pts de réputation) car l'organisateur devra trouver une autre association en urgence.`)) {
      return;
    }

    if (mission.registeredVolunteers) {
      mission.registeredVolunteers.forEach(vid => {
        const v = this.volunteers.find(x => x.id === vid);
        if (v && v.status === 'mission') v.status = 'disponible';
      });
    }

    this.resources.reputationScore = Math.max(0, (this.resources.reputationScore || 50) - repLoss);
    this.missions = this.missions.filter(m => m.id !== missionId);

    this.showToast('DPS Annulé', `Le dispositif « ${mission.title} » a été annulé (-${repLoss} réputation).`, 'orange');
    if (window.ProtecNotifications) {
      window.ProtecNotifications.recordNotification({
        title: `⚠️ ${alertMsg}`,
        message: `Le DPS « ${mission.title} » a été annulé par votre antenne. Perte de réputation : -${repLoss} points.`,
        category: 'dps',
        level: 'warning'
      });
    }

    this.closeDrawer();
    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();
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
        ${mission.isCumpCai ? `
          <div class="p-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-700 to-indigo-800 text-white shadow-md space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase flex items-center gap-1.5">
                <span>🚨</span>
                <span>Astreinte Convention CUMP / CAI</span>
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/20">${mission.cumpData?.odmNumber || 'ODM-CUMP'}</span>
            </div>
            <p class="text-[11px] text-white/90 leading-snug">
              Délais stricts engagés : Accusé &lt; 20 min, Départ agrès &lt; ${mission.cumpData?.maxDepartureMinutes || 60} min, Ouverture CAI &lt; 2h00.
            </p>
            <button onclick="window.ProtecCump.renderCaiModal(window.game, '${mission.id}')" class="w-full py-2.5 rounded-2xl bg-white text-red-700 hover:bg-rose-50 font-black text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="shield-alert" class="w-4 h-4"></i>
              <span>Ouvrir le Pilotage Opérationnel du CAI</span>
            </button>
          </div>
        ` : ''}

        <!-- FICHE OPÉRATIONNELLE D'ALERTE / SITUATION DE TERRAIN -->
        <div class="p-4 rounded-3xl border ${
          mission.status === 'declenche' ? 'bg-red-50/80 border-red-300 text-red-950 shadow-sm' :
          mission.status === 'prealerte' ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-sm' :
          mission.type === 'crise' ? 'bg-purple-50/80 border-purple-300 text-purple-950 shadow-sm' :
          'bg-slate-50 border-slate-200 text-slate-800'
        } space-y-3">
          
          <!-- Niveau d'alerte & Horodatage -->
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              mission.status === 'declenche' ? 'bg-red-600 text-white animate-pulse' :
              mission.status === 'prealerte' ? 'bg-amber-400 text-amber-950' :
              mission.type === 'crise' ? 'bg-purple-700 text-white' :
              'bg-pc-blue text-white'
            }">
              ${
                mission.status === 'declenche' ? '🚨 Alerte Déclenchée - Engagement Terrain' :
                mission.status === 'prealerte' ? '⏳ Vigilance / Préalerte Évolutive' :
                mission.type === 'crise' ? '🚨 Crise Majeure / Plan NOVI' :
                '📋 Dispositif Opérationnel Programmé'
              }
            </span>
            <span class="text-[10px] font-bold text-slate-500">
              ${mission.eventDate ? this.formatFullDate(mission.eventDate) + ' à ' + mission.eventDate.hour + 'h00' : 'Aujourd’hui'}
            </span>
          </div>

          <!-- Type d'événement -->
          <div>
            <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Type d'Événement & Intitulé</span>
            <h4 class="text-xs font-black text-slate-900 leading-snug">${mission.title}</h4>
            <span class="text-[10px] text-slate-500 font-semibold">${mission.locationName || mission.city || 'Secteur d\'intervention territorial'}</span>
          </div>

          <!-- Situation terrain -->
          <div class="p-3 rounded-2xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 leading-relaxed space-y-1">
            <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Situation Opérationnelle :</span>
            <p>${mission.desc}</p>
          </div>

          <!-- Missions prévues sur le terrain -->
          <div class="p-3 rounded-2xl bg-white/90 border border-slate-200/80 space-y-1.5">
            <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Missions Prévues sur Site :</span>
            <ul class="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
              <li>Reconnaissance de périmètre et bilans circonstanciés</li>
              <li>Prise en charge des victimes et gestes de premiers secours</li>
              <li>Accueil, réconfort et distribution d'urgence aux impliqués</li>
              <li>Coordination radio PC et évacuations vers les urgences (CHU)</li>
            </ul>
          </div>

          <!-- Effectif & Spécialités -->
          <div class="grid grid-cols-2 gap-2 text-[10px]">
            <div class="p-2.5 rounded-2xl bg-white/90 border border-slate-200 space-y-0.5">
              <span class="text-slate-400 font-bold block text-[9px] uppercase">Personnel Nécessaire</span>
              <strong class="text-slate-900 text-xs">${mission.requiredVolunteers} secouristes min.</strong>
              <span class="text-slate-500 block text-[9px]">Effectif conseillé : ${mission.requiredVolunteers + 2}</span>
            </div>
            <div class="p-2.5 rounded-2xl bg-white/90 border border-slate-200 space-y-0.5">
              <span class="text-slate-400 font-bold block text-[9px] uppercase">Spécialités Attendues</span>
              <span class="text-emerald-700 font-bold block">Chef d'Équipe (CE) requis</span>
              <span class="text-slate-600 block text-[9px]">Chauffeur VPSP, PSE2/PSE1</span>
            </div>
          </div>

          <!-- Facturation & Réputation -->
          <div class="grid grid-cols-2 gap-2 pt-1">
            <div class="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <span class="text-[10px] text-emerald-800 font-bold">Indemnisation :</span>
              <span class="text-xs font-black text-emerald-900 mono-num">+${mission.rewardMoney} €</span>
            </div>
            <div class="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <span class="text-[10px] text-amber-800 font-bold">Notoriété :</span>
              <span class="text-xs font-black text-amber-900 mono-num">+${mission.rewardReputation} pts</span>
            </div>
          </div>

          ${mission.status === 'prealerte' ? `
            <div class="p-3 rounded-2xl bg-amber-100/70 border border-amber-300 text-amber-950 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-black text-xs flex items-center gap-1.5 text-amber-900">
                  <i data-lucide="hourglass" class="w-4 h-4 text-amber-600 animate-spin"></i>
                  Veille Opérationnelle en cours
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 mono-num animate-pulse">
                  ⏳ ${mission.prealertSecondsLeft || 0}s
                </span>
              </div>
              <p class="text-[10px] text-amber-900 leading-snug">
                Vous décidez si vous lancez la mobilisation générale par SMS. Les réponses des secouristes arriveront au fil des secondes.
              </p>
            </div>
          ` : ''}

        </div>

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

          <!-- Si c'est un sinistre ou une crise : Main Courante Opérationnelle (sans heure de fin fixe) -->
          ${(mission.isCrisis || ['crise', 'pompiers', 'samu', 'meteo'].includes(mission.type)) && window.ProtecCriseLogistique ? `
            ${window.ProtecCriseLogistique.renderCrisisDetailsHTML(this, mission)}
          ` : `
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
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button onclick="window.game.evacuateToNearestHospital('${mission.id}', '${mission.assignedCrew?.vehicles[0]?.id}')" class="py-2.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-pc-orange text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer" title="Déclencher le transport sanitaire vers les Urgences de l'Hôpital de secteur">
                  <i data-lucide="siren" class="w-4 h-4"></i>
                  <span>Évacuer vers CHU (Statut 4)</span>
                </button>
                <button onclick="window.game.completeInterventionOnSite('${mission.id}')" class="py-2.5 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer" title="Victime soignée et laissée sur place après accord de la régulation SAMU 15">
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                  <span>Laissé sur Place / Clôturer</span>
                </button>
              </div>
            </div>
          `}
        ` : `
          <div class="space-y-3">
            <!-- Contrôles Logistique : Transit en 2 étapes & Places Véhicules / Réarmement -->
            ${window.ProtecCriseLogistique ? `
              ${window.ProtecCriseLogistique.renderConvergenceTimeHTML(this, mission)}
              ${window.ProtecCriseLogistique.renderVehiclesCapacityAndRearmAlertHTML(this, mission)}
            ` : ''}

            <div class="flex items-center justify-between">
              <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Effectifs Répondants (${registeredVols.length} / ${mission.requiredVolunteers})
              </h4>
              <div class="flex items-center gap-2">
                <button onclick="window.game.autoAssignMissionRoles('${mission.id}')" class="text-xs font-extrabold text-pc-blue hover:underline flex items-center gap-1" title="Affecter automatiquement les rôles optimaux (Chef de poste, conducteur, photographe...)">
                  <i data-lucide="wand-2" class="w-3.5 h-3.5"></i>
                  Auto-Rôles
                </button>
                <button onclick="window.game.requestAllianceRenfortForMission('${mission.id}')" class="text-xs font-extrabold text-indigo-600 hover:underline flex items-center gap-1" title="Faire appel aux autres joueurs et antennes alliées">
                  <i data-lucide="users" class="w-3.5 h-3.5"></i>
                  Renforts
                </button>
                <button onclick="window.game.launchSmsMobilization('${mission.id}')" class="text-xs font-extrabold text-pc-orange hover:underline flex items-center gap-1">
                  <i data-lucide="send" class="w-3.5 h-3.5"></i>
                  ${mission.smsCampaignActive ? 'SMS en cours...' : 'SMS'}
                </button>
              </div>
            </div>

            ${registeredVols.some(v => (v.skills || []).includes('communication') && mission.volunteerRoles?.[v.id] === 'photographe') ? `
              <div class="p-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-900 text-[11px] flex items-center gap-2 font-medium">
                <i data-lucide="camera" class="w-4 h-4 text-pink-600"></i>
                <span><strong>Couverture Média & Pub :</strong> reportage photo/vidéo sur ce DPS (+notoriété d'antenne garantie).</span>
              </div>
            ` : ''}

            <div class="space-y-2 max-h-64 overflow-y-auto pr-1 pb-20">
              ${registeredVols.length === 0 ? '<p class="text-xs text-amber-600 p-2.5 glass-card-amber rounded-xl">Aucun secouriste n’a encore validé sa disponibilité. Cliquez sur « SMS » ou utilisez l’appel individuel pour mobiliser vos effectifs.</p>' : ''}
              ${registeredVols.map(v => {
                const currentRole = (mission.volunteerRoles && mission.volunteerRoles[v.id]) || (v.rank === 'Stagiaire' ? 'stagiaire' : 'secouriste');
                const rolesList = this.getMissionRoles();
                const hasCom = (v.skills || []).includes('communication') && currentRole === 'photographe';

                return `
                <div class="p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between text-xs hover:border-slate-300 transition gap-2.5">
                  <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    ${this.getVolunteerAvatarHTML(v, 'w-8 h-8 text-xs')}
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-bold text-slate-800 leading-tight truncate max-w-[130px] sm:max-w-[180px]">${v.name}</span>
                        <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">${v.rank || 'Secouriste'}</span>
                        ${hasCom ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-black bg-pink-100 text-pink-700">📸 Média</span>' : ''}
                      </div>
                      ${this.getVolunteerSkillsPopoverHTML(v)}
                    </div>
                  </div>
                  <div class="flex-shrink-0">
                    <select onchange="window.game.setVolunteerMissionRole('${mission.id}', '${v.id}', this.value)" class="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 cursor-pointer focus:ring-1 focus:ring-pc-blue max-w-[130px] sm:max-w-[150px]">
                      ${rolesList.map(r => `
                        <option value="${r.id}" ${r.id === currentRole ? 'selected' : ''}>${r.label}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>
              `;}).join('')}
            </div>

            <!-- Affectation directe, Appel individuel & Bascule de Bénévoles -->
            <details class="group bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <summary class="text-[11px] font-extrabold text-slate-700 cursor-pointer flex items-center justify-between list-none">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="phone-call" class="w-3.5 h-3.5 text-pc-blue"></i>
                  Appels individuels & Affectation manuelle
                </span>
                <span class="text-[10px] font-bold text-slate-400 group-open:rotate-180 transition">▼</span>
              </summary>
              <div class="mt-2 space-y-1.5 max-h-44 overflow-y-auto pt-1 border-t border-slate-200/70">
                ${this.volunteers.filter(v => !mission.registeredVolunteers.includes(v.id)).map(v => {
                  const otherMission = this.missions.find(m => m.id !== mission.id && (m.registeredVolunteers || []).includes(v.id) && ['planifie', 'prealerte', 'declenche'].includes(m.status));
                  return `
                    <div class="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs hover:shadow-sm transition">
                      <div class="flex items-center gap-2">
                        ${this.getVolunteerAvatarHTML(v, 'w-6 h-6 text-[10px]')}
                        <div>
                          <span class="font-bold text-slate-800">${v.name}</span>
                          <span class="text-[9px] text-slate-500 ml-1 font-semibold">${v.rank}</span>
                          ${otherMission ? `<div class="text-[9px] text-amber-700 font-bold truncate max-w-[130px]">Sur : ${otherMission.title}</div>` : ''}
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        ${v.status === 'mission' ? `
                          <span class="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">En mission</span>
                        ` : otherMission ? `
                          <button onclick="window.game.proposeVolunteerSwitch('${v.id}', '${mission.id}')" class="px-2 py-1 rounded text-[10px] font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 transition flex items-center gap-1" title="Proposer au bénévole d'annuler sa participation sur l'autre mission pour venir ici">
                            <i data-lucide="arrow-left-right" class="w-3 h-3"></i>
                            <span>Bascule</span>
                          </button>
                        ` : `
                          <button onclick="window.game.callVolunteerIndividually('${mission.id}', '${v.id}')" class="px-2 py-1 rounded text-[10px] font-black bg-blue-50 hover:bg-blue-100 text-pc-blue border border-blue-200 transition flex items-center gap-1" title="Passer un appel téléphonique direct (plus de chance que le SMS)">
                            <i data-lucide="phone" class="w-3 h-3 text-pc-blue"></i>
                            <span>Appeler</span>
                          </button>
                          <button onclick="window.game.proposeVolunteerSwitch('${v.id}', '${mission.id}')" class="px-2 py-1 rounded text-[10px] font-extrabold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition">
                            + Affecter
                          </button>
                        `}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </details>
          </div>
        `}
      </div>
    `;

    if (mission.status === 'prealerte') {
      const canEchelon = registeredVols.length >= 3 && !isComplete;
      footer.innerHTML = `
        <button onclick="window.game.closeDrawer()" class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Fermer</button>
        <button onclick="window.game.launchSmsMobilization('${mission.id}')" class="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-pc-orange text-white shadow-md hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5" ${mission.smsCampaignActive ? 'disabled' : ''}>
          <i data-lucide="send" class="w-3.5 h-3.5"></i>
          ${mission.smsCampaignActive ? 'Diffusion SMS en cours...' : 'Mobilisation SMS'}
        </button>
        ${canEchelon ? `
          <button onclick="window.game.launchEchelonMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow transition flex items-center gap-1" title="Faire partir un 1er engin avec 3 secouristes">
            <i data-lucide="truck" class="w-3.5 h-3.5"></i> 1er Engin
          </button>
        ` : ''}
        <button onclick="window.game.registerSalarieToMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1" title="Inscrire d'office un salarié permanent">
          <i data-lucide="briefcase" class="w-3.5 h-3.5"></i> + Salarié
        </button>
        <button onclick="window.game.requestAllianceRenfortForMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-pc-blue hover:bg-blue-100 transition flex items-center gap-1" title="Demander renforts aux antennes alliées">
          <i data-lucide="handshake" class="w-3.5 h-3.5"></i> Alliances
        </button>
      `;
    } else if (mission.status === 'declenche') {
      const canEchelon = registeredVols.length >= 3 && !isComplete;
      footer.innerHTML = `
        <button onclick="window.game.closeDrawer()" class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Fermer</button>
        <button onclick="window.game.launchSmsMobilization('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1">
          <i data-lucide="bell" class="w-3.5 h-3.5"></i> SMS
        </button>
        ${canEchelon ? `
          <button onclick="window.game.launchEchelonMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow transition flex items-center gap-1" title="Faire partir un 1er engin avec 3 secouristes">
            <i data-lucide="truck" class="w-3.5 h-3.5"></i> 1er Engin
          </button>
        ` : ''}
        <button onclick="window.game.registerSalarieToMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1">
          <i data-lucide="briefcase" class="w-3.5 h-3.5"></i> + Salarié
        </button>
        ${isComplete ? `
          <button onclick="window.game.launchScheduledMission('${mission.id}')" class="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-pc-orange text-white shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5 animate-pulse">
            <i data-lucide="siren" class="w-4 h-4"></i>
            Engager & Partir
          </button>
        ` : `
          <div class="flex-1 px-3 py-2 rounded-xl text-center text-[10px] font-black bg-red-100 text-red-900 border border-red-300">
            Manque ${mission.requiredVolunteers - registeredVols.length} secouriste(s)
          </div>
        `}
      `;
    } else if (mission.status === 'planifie') {
      const isComplete = registeredVols.length >= mission.requiredVolunteers;
      const canEchelon = registeredVols.length >= 3 && !isComplete;
      footer.innerHTML = `
        <button onclick="window.game.closeDrawer()" class="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Fermer</button>
        <button onclick="window.game.cancelDpsMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition border border-rose-200" title="Annuler ce DPS (pénalité de popularité selon le préavis)">
          <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Annuler DPS
        </button>
        <button onclick="window.game.relanceVolunteers('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1" title="Relancer les bénévoles par message">
          <i data-lucide="bell" class="w-3.5 h-3.5"></i> SMS
        </button>
        ${canEchelon ? `
          <button onclick="window.game.launchEchelonMission('${mission.id}')" class="px-3 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow transition flex items-center gap-1" title="Faire partir un 1er engin avec 3 secouristes">
            <i data-lucide="truck" class="w-3.5 h-3.5"></i> 1er Engin
          </button>
        ` : ''}
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
    this.updateToastContainerPosition();
    if (window.lucide) window.lucide.createIcons();
  }

  // Évacuation sanitaire directe vers les urgences de secteur (sans fiches bilans fastidieuses)
  evacuateToNearestHospital(missionId, vehicleId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;
    const vehicle = this.vehicles.find(v => v.id === vehicleId) || mission.assignedCrew?.vehicles?.[0] || this.vehicles[0];
    this.closeDrawer();

    if (window.ProtecSystems) {
      window.ProtecSystems.consumeSupply(this, 'oxygenBottles', 1);
      const hospital = window.ProtecSystems.getNearestHospital(this, mission.lat, mission.lng);
      const origin = { lat: mission.lat, lng: mission.lng };
      const dest = { lat: hospital.lat, lng: hospital.lng };

      this.showToast('Départ vers les Urgences', `Ambulance ${vehicle?.name || 'VPSP'} en route sous gyrophare vers ${hospital.name} (Statut 4).`, 'orange');

      window.ProtecSystems.startTransit(this, vehicle, origin, dest, mission, 4, () => {
        // Arrivée aux Urgences : dépôt de la victime puis retour disponible
        this.showToast('Admission Urgences Réussie', `Victime transmise aux équipes médicales de ${hospital.name}. Nettoyage et retour antenne.`, 'green');
        this.completeMission(mission);

        // Retour vers l'antenne (Statut 6 -> 1)
        const baseStation = this.stations[0] || { lat: 48.8566, lng: 2.3522 };
        window.ProtecSystems.startTransit(this, vehicle, dest, { lat: baseStation.lat, lng: baseStation.lng }, mission, 6, () => {
          if (vehicle) vehicle.status = 'dispo';
          this.showToast('Véhicule Disponible', `${vehicle?.name || 'VPSP'} est de retour à l'antenne. Prêt pour un nouveau départ.`, 'blue');
        });
      });
    } else {
      this.completeMission(mission);
    }
  }

  // Clôture d'intervention sur place sans transport
  completeInterventionOnSite(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;
    this.closeDrawer();

    if (window.ProtecSystems) {
      window.ProtecSystems.consumeSupply(this, 'woundKits', 1);
    }

    this.showToast('Intervention Clôturée', `Soins réalisés sur place pour « ${mission.title} ». Victime laissée sur place après accord SAMU 15.`, 'green');
    this.completeMission(mission);

    // Libérer les véhicules et bénévoles
    if (mission.assignedCrew?.vehicles) {
      mission.assignedCrew.vehicles.forEach(v => {
        const veh = this.vehicles.find(x => x.id === v.id);
        if (veh) veh.status = 'dispo';
      });
    }
    if (mission.assignedCrew?.volunteers) {
      mission.assignedCrew.volunteers.forEach(volId => {
        const v = this.volunteers.find(x => x.id === volId);
        if (v) v.status = 'dispo';
      });
    }
    this.saveGame();
    this.updateStatsUI();
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
    if (window.ProtecLogistique) {
      window.ProtecLogistique.ensureStationStock(station, this);
    }

    const totalStockItems = Object.values(station.stock || {}).reduce((a, b) => a + b, 0);

    body.innerHTML = `
      <div class="space-y-4">
        <div class="p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="font-extrabold text-pc-blue">Niveau du Local</span>
            <span class="px-2.5 py-0.5 rounded font-black bg-pc-blue text-white shadow-2xs">Niveau ${station.level}</span>
          </div>
          <p class="text-xs text-slate-600 font-medium">Standard radio et armoire de secours opérationnels.</p>
        </div>

        <!-- Stock & Réserve de l'Antenne -->
        <div class="p-3.5 rounded-2xl bg-white border border-slate-300 shadow-xs space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>📦</span> Réserve & Stocks de l'Antenne
            </span>
            <button onclick="window.ProtecLogistique.selectedStationId='${station.id}'; window.ProtecLogistique.activeTab='boutique'; window.game.openModule('logistique');" class="text-xs font-extrabold text-pc-blue hover:underline">
              🛒 Boutique / Acheter
            </button>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span>Matériel en réserve : <strong class="text-slate-900">${totalStockItems} articles</strong></span>
            <button onclick="window.ProtecLogistique.selectedStationId='${station.id}'; window.ProtecLogistique.activeTab='stock'; window.game.openModule('logistique');" class="px-2.5 py-1 rounded-lg bg-blue-100 text-pc-blue font-bold text-[10px] hover:bg-blue-200 transition">
              Inventaire Réserve →
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Flotte (${stationVehicles.length})</h4>
            <button onclick="window.game.openBuyVehicleModal('${station.id}')" class="text-xs font-extrabold text-pc-orange hover:underline">+ Acheter Véhicule</button>
          </div>
          <div class="space-y-1.5">
            ${stationVehicles.map(v => `
              <div class="p-2.5 rounded-xl bg-white border border-slate-300 shadow-xs flex items-center justify-between text-xs hover:border-slate-400 transition">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-7 bg-slate-100 rounded-lg p-0.5 flex items-center justify-center flex-shrink-0 border border-slate-300 shadow-inner">
                    <img src="${v.image || window.game.getVehicleImage(v.type)}" alt="${v.name}" class="max-h-full max-w-full object-contain" onerror="this.outerHTML='🚑'" />
                  </div>
                  <div>
                    <span class="font-black text-slate-900 leading-tight block">${v.name}</span>
                    <span class="text-[9.5px] text-slate-500 font-semibold">${v.label || v.type}</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-black border ${v.status === 'dispo' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'}">
                  ${v.status === 'dispo' ? 'DISPO' : 'ENGAGÉ'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Effectif Rattaché (${stationVolunteers.length})</h4>
            <button onclick="window.game.openModule('recrutement')" class="text-xs font-extrabold text-pc-blue hover:underline">Recruter (Candidatures)</button>
          </div>
          <div class="space-y-1.5">
            ${stationVolunteers.map(v => `
              <div class="p-2.5 rounded-xl bg-white border border-slate-300 shadow-xs flex items-center justify-between text-xs hover:border-slate-400 transition">
                <div class="flex items-center gap-2">
                  ${this.getVolunteerAvatarHTML(v)}
                  <div>
                    <div class="font-black text-slate-900 flex items-center gap-1.5">
                      <span>${v.name}</span>
                      <button type="button" onclick="window.game.openRenameVolunteerModal('${v.id}')" class="text-slate-400 hover:text-pc-blue p-0.5 rounded transition text-xs cursor-pointer" title="Modifier l'identité (prénom et nom)">✏️</button>
                      ${this.getVolunteerSkillsPopoverHTML(v)}
                    </div>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-pc-blue border border-blue-200/90">${v.rank}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button onclick="window.game.closeDrawer()" class="w-full px-4 py-2.5 rounded-xl text-xs font-black bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 shadow-xs transition">Fermer</button>
    `;

    drawer.classList.remove('hidden');
    drawer.classList.add('flex', 'drawer-slide-in');
    this.updateToastContainerPosition();
    if (window.lucide) window.lucide.createIcons();
  }

  closeDrawer() {
    const drawer = document.getElementById('context-drawer');
    if (drawer) {
      drawer.classList.add('hidden');
      drawer.classList.remove('flex', 'drawer-slide-in');
    }
    this.selectedMissionId = null;
    this.updateToastContainerPosition();
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

  // --- SYSTÈME DE DÉVERROUILLAGE & GESTION DES MENUS ET SOUS-MENUS ---

  isFeatureUnlocked(featureKey) {
    const totalVols = this.volunteers ? this.volunteers.length : 0;
    const vpspCount = this.vehicles ? this.vehicles.filter(v => v.type === 'VPSP').length : 0;
    const anyVehCount = this.vehicles ? this.vehicles.length : 0;
    const repScore = this.resources ? (this.resources.reputationScore || 0) : 0;
    const hasAntenne = this.stations && this.stations.length > 0;

    switch (featureKey) {
      // Missions de base
      case 'dps':
      case 'planning':
      case 'devis':
      case 'finances':
      case 'conventions':
      case 'subventions':
      case 'communication':
      case 'tchat':
      case 'messagerie':
        return true;

      // SAMU 15 : Nécessite au moins 1 ambulance VPSP et 3 secouristes
      case 'samu':
        return vpspCount >= 1 && totalVols >= 3;

      // Garde SDIS : Nécessite au moins 1 VPSP et 5 secouristes
      case 'pompiers':
      case 'sdis':
        return vpspCount >= 1 && totalVols >= 5;

      // Action Sociale : Nécessite au moins 1 véhicule et 3 secouristes
      case 'social':
        return anyVehCount >= 1 && totalVols >= 3;

      // Crise NOVI & ORSEC : Nécessite au moins 1 VPSP, 6 secouristes et 40 pts de réputation
      case 'crise':
      case 'novi':
        return vpspCount >= 1 && totalVols >= 6 && repScore >= 40;

      // RH & Bénévoles de base
      case 'benevoles':
      case 'recrutement':
      case 'formation':
        return true;

      // Pôles d'antenne : Nécessite au moins 6 secouristes
      case 'poles':
        return totalVols >= 6;

      // Base & Matériel
      case 'base':
      case 'flotte':
      case 'locaux':
      case 'logistique':
        return hasAntenne;

      // Spécialités (Drone, Cyno, Bateau, 4x4, Moto) : Nécessite au moins 8 secouristes et 60 pts de réputation
      case 'specialites':
        return totalVols >= 8 && repScore >= 60;

      // Alliances : Nécessite au moins 5 secouristes et 20 pts de réputation
      case 'alliance':
        return totalVols >= 5 && repScore >= 20;

      // Radio & Météo
      case 'radio':
      case 'meteo':
        return true;

      default:
        return true;
    }
  }

  getModuleCategory(moduleKey) {
    const categories = {
      'planning': 'missions',
      'conventions': 'missions',
      'devis': 'missions',
      'samu': 'missions',
      'pompiers': 'missions',
      'social': 'missions',
      'crise': 'missions',

      'recrutement': 'rh',
      'formation': 'rh',
      'poles': 'rh',
      'communication': 'rh',
      'competences': 'rh',

      'base': 'materiel',
      'locaux': 'materiel',
      'logistique': 'materiel',
      'specialites': 'materiel',

      'radio': 'liaisons',
      'tchat': 'liaisons',
      'messagerie': 'liaisons',
      'alliance': 'liaisons',
      'meteo': 'liaisons',

      'finances': 'finances',
      'subventions': 'finances'
    };
    return categories[moduleKey] || null;
  }

  toggleDockSubmenu(menuKey, event) {
    if (event) event.stopPropagation();
    const submenu = document.getElementById(`dock-submenu-${menuKey}`);
    if (!submenu) return;
    const isCurrentlyActive = submenu.classList.contains('active');
    this.closeAllDockSubmenus();
    if (!isCurrentlyActive) {
      submenu.classList.add('active');
      this.updateDockAndFiltersVisibility();
      if (window.lucide) window.lucide.createIcons();
    }
  }

  closeAllDockSubmenus() {
    document.querySelectorAll('.dock-submenu').forEach(sm => sm.classList.remove('active'));
  }

  updateDockAndFiltersVisibility() {
    // 1. Mise à jour de la visibilité des éléments sous-menus (data-feature-key)
    document.querySelectorAll('[data-feature-key]').forEach(el => {
      const key = el.getAttribute('data-feature-key');
      const isUnlocked = this.isFeatureUnlocked(key);
      if (isUnlocked) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // 2. Si le filtre actif sur la carte a été masqué (car non débloqué), revenir à "all"
    if (this.currentFilter && this.currentFilter !== 'all' && !this.isFeatureUnlocked(this.currentFilter)) {
      this.setFilter('all');
    }
  }

  renderModalCategorySubnav(currentModuleKey) {
    const subnavEl = document.getElementById('modal-category-subnav');
    if (!subnavEl) return;

    const category = this.getModuleCategory(currentModuleKey);
    if (!category) {
      subnavEl.classList.add('hidden');
      subnavEl.innerHTML = '';
      return;
    }

    const planCount = this.missions ? this.missions.filter(m => m.status === 'planifie' || m.status === 'ongoing' || m.type === 'dps').length : 0;
    const devisCount = this.devis ? this.devis.filter(d => d.status === 'pending').length : 0;
    const samuCount = this.missions ? this.missions.filter(m => m.type === 'samu' && (m.status === 'planifie' || m.status === 'ongoing')).length : 0;
    const sdisCount = this.missions ? this.missions.filter(m => m.type === 'pompiers' && (m.status === 'planifie' || m.status === 'ongoing')).length : 0;
    const socialCount = this.missions ? this.missions.filter(m => m.type === 'social').length : 0;
    const criseCount = this.missions ? this.missions.filter(m => m.type === 'crise' || m.urgency === 'critique').length : 0;

    const categoryDefs = {
      missions: [
        { key: 'planning', label: 'Planning & DPS', icon: 'calendar', count: planCount },
        { key: 'conventions', label: 'Conventions Officielles', icon: 'file-text' },
        { key: 'devis', label: 'Devis & Contrats', icon: 'file-check', count: devisCount },
        { key: 'samu', label: 'SAMU 15', icon: 'activity', count: samuCount },
        { key: 'pompiers', label: 'Garde SDIS', icon: 'flame', count: sdisCount },
        { key: 'social', label: 'Action Sociale', icon: 'heart-handshake', count: socialCount },
        { key: 'crise', label: 'Crise NOVI', icon: 'siren', count: criseCount }
      ],
      rh: [
        { key: 'recrutement', label: 'Bénévoles & Équipe', icon: 'users', count: this.volunteers?.length || 0 },
        { key: 'formation', label: 'Formations', icon: 'graduation-cap' },
        { key: 'poles', label: 'Pôles d\'Antenne', icon: 'layers' },
        { key: 'communication', label: 'Communication & Médias', icon: 'megaphone' }
      ],
      materiel: [
        { key: 'base', label: 'Antenne & Flotte', icon: 'truck', count: this.vehicles?.length || 0 },
        { key: 'locaux', label: 'Locaux & Plan 2D', icon: 'layout-grid' },
        { key: 'logistique', label: 'Logistique & Lots', icon: 'package-check' },
        { key: 'specialites', label: 'Spécialités', icon: 'crosshair' }
      ],
      liaisons: [
        { key: 'radio', label: 'Radio PC', icon: 'radio' },
        { key: 'tchat', label: 'Messagerie & MP', icon: 'message-square' },
        { key: 'alliance', label: 'Alliances', icon: 'handshake', count: this.renforts?.filter(r => r.status === 'open').length || 0 },
        { key: 'meteo', label: 'Météo-France', icon: 'cloud-sun' }
      ],
      finances: [
        { key: 'finances', label: 'Trésorerie & Bilan', icon: 'wallet' },
        { key: 'subventions', label: 'Subventions Publiques', icon: 'landmark' },
        { key: 'devis', label: 'Devis DPS', icon: 'file-check', count: devisCount },
        { key: 'conventions', label: 'Conventions Officielles', icon: 'file-text' }
      ]
    };

    const items = categoryDefs[category] || [];
    // Filtrage STRICT des sous-menus déverrouillés
    const unlockedItems = items.filter(item => this.isFeatureUnlocked(item.key));

    if (unlockedItems.length <= 1) {
      subnavEl.classList.add('hidden');
      subnavEl.innerHTML = '';
      return;
    }

    subnavEl.classList.remove('hidden');
    subnavEl.innerHTML = `
      <div class="flex items-center gap-2 flex-nowrap min-w-max py-0.5">
        ${unlockedItems.map(item => {
          const isActive = item.key === currentModuleKey;
          return `
            <button onclick="window.game.openModule('${item.key}')" 
              class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 whitespace-nowrap cursor-pointer ${isActive 
                ? 'bg-pc-blue text-white shadow-sm ring-2 ring-pc-blue/30' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90'}">
              <i data-lucide="${item.icon}" class="w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}"></i>
              <span>${item.label}</span>
              ${item.count !== undefined && item.count > 0 ? `
                <span class="px-1.5 py-0.2 rounded-full text-[9px] font-black ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
                  ${item.count}
                </span>
              ` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  // --- POPUP MODULES DOCK ---
  openModule(moduleKey, isBackNavigation = false) {
    this.closeAllDockSubmenus();

    const aliases = {
      'missions': 'planning',
      'mission': 'planning',
      'benevoles': 'recrutement',
      'personnel': 'recrutement',
      'flotte': 'base',
      'vehicules': 'base',
      'antennes': 'base',
      'devis_dps': 'devis',
      'dps': 'planning'
    };
    if (moduleKey && aliases[moduleKey]) {
      moduleKey = aliases[moduleKey];
    }

    // Affichage des sous-onglets contextuels de catégorie
    this.renderModalCategorySubnav(moduleKey);

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

    if (moduleKey === 'finances') {
      if (window.ProtecFinances) {
        window.ProtecFinances.renderFinancesModal(this);
        return;
      }
    } else if (moduleKey === 'equipements') {
      if (window.ProtecEquipements) {
        window.ProtecEquipements.renderEquipementsModal(this);
        return;
      }
    } else if (moduleKey === 'conventions') {
      if (window.ProtecConventions) {
        window.ProtecConventions.renderModal(this);
        return;
      }
    } else if (moduleKey === 'subventions') {
      if (window.ProtecSocial) {
        window.ProtecSocial.renderModal(this);
        return;
      }
    } else if (moduleKey === 'communication') {
      if (window.ProtecCommunication) {
        window.ProtecCommunication.renderModal(this);
        return;
      }
    } else if (moduleKey === 'tchat' || moduleKey === 'messagerie') {
      if (window.ProtecMessaging) {
        window.ProtecMessaging.renderModal(this);
        return;
      }
    } else if (moduleKey === 'cump') {
      if (window.ProtecCump) {
        window.ProtecCump.renderCumpTab(this);
        return;
      }
    }

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

      const isAntennaVisible = this.resources.campaigns.social || this.resources.campaigns.posters || (this.stats?.dpsCompleted > 0) || (this.resources.reputationScore >= 60);
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
              <strong>Règle :</strong> Vous définissez librement le type de DPS, le nombre de secouristes et les véhicules. L’organisateur évalue si votre dimensionnement respecte la sécurité, et compare votre tarif à ceux des associations concurrentes agréées.
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

          <!-- Demandes reçues avec configurateur personnalisé -->
          <div class="space-y-4">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Demandes Reçues des Organisateurs (${pendingDevis.length})</h4>

            ${!isAntennaVisible ? `
              <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs flex items-start gap-3">
                <i data-lucide="eye-off" class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"></i>
                <div class="space-y-1">
                  <div class="font-black text-amber-950 uppercase tracking-wide">Antenne Invisible au Public</div>
                  <p class="text-[11px] text-amber-800 leading-relaxed">
                    Votre antenne vient d'ouvrir ou manque de notoriété. Sans <strong>campagne de communication</strong> active (Réseaux sociaux ou Affichage mairie) ou de premier <strong>DPS réalisé</strong>, les organisateurs d'événements ne connaissent pas votre existence et ne peuvent pas vous envoyer de demandes de devis.
                  </p>
                </div>
              </div>
            ` : ''}

            ${pendingDevis.length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucune demande reçue pour le moment. Développez la communication et la réputation de votre antenne pour recevoir des devis d’organisateurs.</p>' : ''}
            
            ${pendingDevis.map(d => {
              // Initialisation des valeurs configurées par le joueur
              if (!d.configuredScale) {
                d.configuredScale = d.scale ? d.scale.split(' ')[0] : 'DPS-PE';
                d.configuredVolunteers = d.requiredVolunteers || 4;
                const ownedVehs = this.vehicles || [];
                if (ownedVehs.length > 0) {
                  d.configuredVehicles = [ownedVehs[0].type || 'VPSP'];
                  d.configuredVehicleId = ownedVehs[0].id;
                } else {
                  d.configuredVehicles = [];
                  d.configuredVehicleId = 'none';
                }
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
                        <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">⏳ Expire dans ${Math.floor((d.secondsLeft !== undefined ? d.secondsLeft : 240) / 60)}m ${((d.secondsLeft !== undefined ? d.secondsLeft : 240) % 60).toString().padStart(2, '0')}s</span>
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

                      <!-- Véhicules (Véhicules réels possédés par l'antenne) -->
                      <div>
                        <label class="block text-[11px] font-bold text-slate-600 mb-1">Moyens Véhicules (Véhicules possédés) :</label>
                        <select onchange="window.game.updateDevisVehicles('${d.id}', this.value)" class="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800">
                          <option value="none" ${(!d.configuredVehicles || d.configuredVehicles.length === 0) ? 'selected' : ''}>Sans véhicule (Poste pédestre / Tente de secours)</option>
                          ${(this.vehicles || []).map(veh => {
                            const vehCost = veh.type === 'VPSP' ? 110 : (veh.type === 'VTU' ? 55 : (veh.type === 'VL' ? 35 : 45));
                            const isSel = d.configuredVehicleId === veh.id || (d.configuredVehicles || []).includes(veh.type);
                            return `<option value="${veh.id}" ${isSel ? 'selected' : ''}>${veh.name} (${veh.label || veh.type}) [+${vehCost} €]</option>`;
                          }).join('')}
                          ${(this.vehicles || []).length >= 2 ? `
                            <option value="all_fleet" ${d.configuredVehicleId === 'all_fleet' ? 'selected' : ''}>Toute la flotte (${(this.vehicles || []).length} véhicules)</option>
                          ` : ''}
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
                          <span class="text-[11px] text-slate-500">Mise en concurrence avec les autres associations agréées</span>
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

      const isAntennaVisible = this.resources.campaigns.social || this.resources.campaigns.posters || (this.stats?.dpsCompleted > 0) || (this.resources.reputationScore >= 60);

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
                  <h4 class="text-xs font-black uppercase text-indigo-950 tracking-wider">Offres Ouvertes : Salariés & Services Civiques (${(this.jobOffers || []).length})</h4>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Recrutements & Engagements</span>
                </div>
                <p class="text-[11px] text-slate-500">Ouvrez des missions de Service Civique (18-25 ans) ou des postes de cadres salariés (CDD/CDI). Les candidatures arrivent progressivement pour passage d'entretien.</p>
              </div>
              <button onclick="window.ProtecPersonnel.openJobOfferModal(window.game)" class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 flex-shrink-0">
                <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                + Ouvrir un Poste / Mission
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

          <!-- Section Candidatures Reçues (Séparation Bénévoles / Salariés) -->
          <div class="space-y-6">
            <!-- 1. CANDIDATURES BÉNÉVOLES -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <i data-lucide="users" class="w-4 h-4 text-pc-blue"></i>
                    Candidatures Bénévoles (${this.candidatures.filter(c => c.type !== 'salarie').length})
                  </h4>
                  <span class="text-[11px] text-slate-500 font-semibold">Citoyens souhaitant rejoindre l'association</span>
                </div>
                <button onclick="window.game.toggleShowCandidatures()" class="px-3 py-1.5 rounded-xl text-xs font-black ${this.showCandidaturesView ? 'bg-slate-200 text-slate-800' : 'bg-pc-blue text-white shadow-sm hover:bg-pc-blue-light'} transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="${this.showCandidaturesView ? 'chevron-up' : 'eye'}" class="w-3.5 h-3.5"></i>
                  <span>${this.showCandidaturesView ? 'Masquer les candidatures' : `Voir les candidatures (${this.candidatures.filter(c => c.type !== 'salarie').length})`}</span>
                </button>
              </div>

              ${!isAntennaVisible ? `
                <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs flex items-start gap-3">
                  <i data-lucide="eye-off" class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"></i>
                  <div class="space-y-1">
                    <div class="font-black text-amber-950 uppercase tracking-wide">Antenne Invisible au Public</div>
                    <p class="text-[11px] text-amber-800 leading-relaxed">
                      Votre antenne vient d'ouvrir ou n'a pas encore de visibilité publique. Sans <strong>campagne de communication</strong> active (Réseaux sociaux ou Affichage mairie) ou de premier <strong>DPS réalisé</strong>, aucun citoyen ne vient postuler spontanément comme bénévole. Lancez une campagne ci-dessus pour faire connaître l'antenne !
                    </p>
                  </div>
                </div>
              ` : ''}

              ${this.showCandidaturesView ? `
                ${this.candidatures.filter(c => c.type !== 'salarie').length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucune candidature bénévole en attente actuellement.</p>' : ''}

                <div class="space-y-3">
                  ${this.candidatures.filter(c => c.type !== 'salarie').map(cand => {
                    const currentDay = this.clock?.day || 1;
                    const daysWaiting = Math.max(0, currentDay - (cand.createdDay || currentDay));
                    const isLate = daysWaiting >= 2;

                    return `
                    <div class="p-4 rounded-2xl glass-card space-y-3 border ${isLate ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'} hover:border-slate-300 transition">
                      <div class="flex items-start gap-3">
                        <div class="flex-shrink-0">${this.getVolunteerAvatarHTML(cand, 'w-10 h-10')}</div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <h5 class="text-sm font-extrabold text-slate-900">${cand.name} (${cand.age} ans)</h5>
                              <span class="px-2 py-0.5 rounded text-[10px] font-black ${cand.rank && cand.rank !== 'Stagiaire' ? 'bg-pc-blue text-white' : 'bg-slate-200 text-slate-700'}">
                                ${cand.rank || 'Bénévole'}
                              </span>
                              ${cand.isTrainer ? '<span class="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">Formateur</span>' : ''}
                            </div>

                            ${cand.interviewPassed ? `
                              <span class="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Note : ${cand.motivationGrade} ✓
                              </span>
                            ` : `
                              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isLate ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'}">
                                ${isLate ? `⏳ Attente : ${daysWaiting} jours (Démotivé)` : 'Entretien requis'}
                              </span>
                            `}
                          </div>

                          <div class="flex items-center gap-2 mt-1">
                            <p class="text-xs text-slate-500">${cand.job || 'Bénévole'} • Dispo : <strong class="text-pc-blue">${(cand.dispoJours || ['Samedi', 'Dimanche']).join(', ')}</strong></p>
                            ${this.getVolunteerSkillsPopoverHTML(cand)}
                          </div>

                          ${cand.skills && cand.skills.length > 0 ? `
                            <div class="flex flex-wrap gap-1 mt-1.5">
                              ${cand.skills.map(s => `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">${this.formatSkillName(s)}</span>`).join('')}
                            </div>
                          ` : ''}
                        </div>
                      </div>

                      <div class="p-3 rounded-xl bg-white/70 text-xs text-slate-700 italic border border-slate-100">
                        « ${cand.motivationText || cand.motivation || 'Très motivé pour intégrer l’antenne et apporter son aide.'} »
                      </div>

                      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div class="text-[11px] text-slate-400 font-semibold">
                          ${isLate ? '<span class="text-amber-700 font-bold">⚠️ Répondez rapidement avant désistement du candidat !</span>' : (cand.interviewPassed ? 'Entretien réalisé • Bilan disponible' : 'Faites passer l’entretien pour valider la motivation')}
                        </div>
                        <div class="flex items-center gap-2">
                          <button onclick="window.game.rejectCandidature('${cand.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold glass-button text-slate-500 hover:text-rose-600 transition">
                            Décliner
                          </button>
                          <button onclick="window.ProtecPersonnel.openInterviewModal(window.game, '${cand.id}')" class="px-4 py-2 rounded-xl text-xs font-black bg-pc-blue hover:bg-pc-blue-light text-white shadow-md transition flex items-center gap-1.5">
                            <i data-lucide="mic" class="w-3.5 h-3.5"></i>
                            ${cand.interviewPassed ? 'Voir Compte-Rendu & Décider' : 'Faire Passer l’Entretien'}
                          </button>
                        </div>
                      </div>
                    </div>
                  `;}).join('')}
                </div>
              ` : ''}
            </div>

            <!-- 2. CANDIDATURES SALARIÉES ET SERVICES CIVIQUES -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="briefcase" class="w-4 h-4 text-indigo-600"></i>
                  Candidatures Salariés (${this.candidatures.filter(c => c.type === 'salarie').length})
                </h4>
                <span class="text-[11px] text-slate-500 font-semibold">Contrat de travail et grille salariale</span>
              </div>

              ${this.candidatures.filter(c => c.type === 'salarie').length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucune candidature salariée pour l’instant. Publiez une offre de poste pour attirer des candidats.</p>' : ''}

              <div class="space-y-3">
                ${this.candidatures.filter(c => c.type === 'salarie').map(cand => `
                  <div class="p-4 rounded-2xl glass-card space-y-3 border border-indigo-200 bg-indigo-50/20 hover:border-indigo-300 transition">
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0">${this.getVolunteerAvatarHTML(cand, 'w-10 h-10')}</div>
                      <div class="flex-1">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <h5 class="text-sm font-extrabold text-slate-900">${cand.name} (${cand.age} ans)</h5>
                            <span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-600 text-white">
                              SALARIÉ • ${cand.contractType}
                            </span>
                            ${cand.isTrainer ? '<span class="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800">Formateur</span>' : ''}
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

                        <div class="mt-1 text-xs">
                          <p class="text-indigo-900 font-bold">Poste visé : « ${cand.jobOfferTitle} » (${cand.monthlySalary} €/mois)</p>
                          <p class="text-[11px] text-slate-500 italic mt-0.5">Disponibilités : Fixées par contrat (forfait 151h mensuelles, repos légal 11h consécutives).</p>
                        </div>

                        ${cand.skills && cand.skills.length > 0 ? `
                          <div class="flex flex-wrap gap-1 mt-1.5">
                            ${cand.skills.map(s => `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">${this.formatSkillName(s)}</span>`).join('')}
                          </div>
                        ` : ''}
                      </div>
                    </div>

                    <div class="p-3 rounded-xl bg-white/70 text-xs text-slate-700 italic border border-slate-100">
                      « ${cand.motivation} »
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div class="text-[11px] text-slate-400 font-semibold">
                        ${cand.interviewPassed ? 'Entretien réalisé • Bilan RH disponible' : 'Faites passer l’entretien pour valider le recrutement'}
                      </div>
                      <div class="flex items-center gap-2">
                        <button onclick="window.game.rejectCandidature('${cand.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold glass-button text-slate-500 hover:text-rose-600 transition">
                          Décliner
                        </button>
                        <button onclick="window.ProtecPersonnel.openInterviewModal(window.game, '${cand.id}')" class="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition flex items-center gap-1.5">
                          <i data-lucide="mic" class="w-3.5 h-3.5"></i>
                          ${cand.interviewPassed ? 'Voir Compte-Rendu & Embaucher' : 'Faire Passer l’Entretien'}
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
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
                <button onclick="window.ProtecPersonnel.openJobOfferModal(window.game, 'service_civique')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition">
                  + Ouvrir Mission (50 €)
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
                  <button onclick="window.ProtecPersonnel.openJobOfferModal(window.game, 'CDI')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
                    + Ouvrir Poste (180 €)
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
                          ${this.getVolunteerAvatarHTML(v, 'w-8 h-8')}
                          <div>
                            <div class="font-black text-slate-900 leading-tight flex items-center gap-1.5">
                              <span>${v.name}</span>
                              <button type="button" onclick="window.game.openRenameVolunteerModal('${v.id}')" class="text-slate-400 hover:text-pc-blue p-0.5 rounded transition text-xs cursor-pointer" title="Modifier l'identité (prénom et nom)">✏️</button>
                            </div>
                            <div class="text-[10px] text-slate-500 font-semibold">${v.rank} • ${contractLabel}</div>
                            ${this.getVolunteerSkillsPopoverHTML(v)}
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
              <span class="px-3 py-1 rounded-full text-xs font-black ${isGuardActive ? 'bg-emerald-600 text-white animate-pulse' : (this.samuConvention?.signed ? 'bg-slate-200 text-slate-700' : 'bg-amber-200 text-amber-900 border border-amber-300')}">
                ${isGuardActive ? 'GARDE ACTIVE (RÉFLEXE 15)' : (this.samuConvention?.signed ? 'ASTREINTE FERMÉE' : 'NON CONVENTIONNÉ')}
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

            ${!this.samuConvention?.signed ? `
              <!-- Avertissement Convention Non Signée : Paramétrage Verrouillé -->
              <div class="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-3">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center text-xl shrink-0">
                    ⚠️
                  </div>
                  <div>
                    <h5 class="text-xs font-black uppercase text-amber-950">Convention Cadre SAMU 15 Requise</h5>
                    <p class="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                      ${!this.aascConvention?.signed 
                        ? 'Votre antenne doit préalablement souscrire sa <strong>Convention Cadre d’AASC</strong> auprès de la Préfecture pour pouvoir conclure des partenariats officiels de sécurité civile.' 
                        : 'Le paramétrage des astreintes et l’armement des ambulances sont verrouillés : vous devez préalablement signer la <strong>Convention Cadre avec la direction du SAMU 15</strong>.'}
                    </p>
                  </div>
                </div>

                <div class="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="text-[10.5px] text-amber-800 font-bold">
                    ${!this.aascConvention?.signed ? 'Étape requise : Convention Préfectorale d’AASC (800 €)' : 'Prérequis SAMU : 1 ambulance VPSP et 3 secouristes qualifiés'}
                  </div>
                  ${!this.aascConvention?.signed ? `
                    <button onclick="window.game.openModule('conventions')" class="px-4 py-2 rounded-xl text-xs font-black bg-amber-700 hover:bg-amber-800 text-white shadow-sm transition cursor-pointer">
                      Souscrire l’AASC (Conventions)
                    </button>
                  ` : `
                    <button onclick="window.game.signSamuConvention()" ${vpsps.length === 0 || qualifiedVolunteers.length < 3 ? 'disabled class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed"' : 'class="px-4 py-2 rounded-xl text-xs font-black bg-pc-blue hover:brightness-110 text-white shadow-md transition cursor-pointer"'}>
                      ✍️ Signer la Convention SAMU 15 (+350 €)
                    </button>
                  `}
                </div>
              </div>
            ` : `
              <!-- Choix du joueur : Déclenchement Automatique (Garde Postée) vs Manuel (Astreinte) -->
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div class="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>Déclenchement Opérationnel :</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${this.samuGarde?.mode === 'poste' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-pc-blue border border-blue-300'}">
                      ${this.samuGarde?.mode === 'poste' ? '🛡️ Garde Postée (Départ Auto)' : '🏠 Astreinte Domicile (Départ Manuel)'}
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-0.5">
                    ${this.samuGarde?.mode === 'poste' ? 'Départ réflexe automatique instantané dès appel 15 (0 clic, réactivité max, fatigue accrue -15).' : 'L’équipage attend à domicile, vous déclenchez vous-même le départ (moins fatiguant -5).'}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button onclick="window.game.setSamuGuardMode('poste')" class="px-3 py-1.5 rounded-xl text-xs font-black transition ${this.samuGarde?.mode === 'poste' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}">
                    🛡️ Garde Postée (Auto)
                  </button>
                  <button onclick="window.game.setSamuGuardMode('astreinte')" class="px-3 py-1.5 rounded-xl text-xs font-black transition ${this.samuGarde?.mode !== 'poste' ? 'bg-pc-blue text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}">
                    🏠 Astreinte (Manuel)
                  </button>
                </div>
              </div>

              <!-- Actions d'armement de la garde -->
              <div class="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                ${isGuardActive ? `
                  <div class="text-xs text-emerald-800">
                    <span>Ambulance engagée : <strong>${currentVpsp?.name || 'VPSP'}</strong> • Équipage : <strong>${currentCrew.length} secouristes</strong></span>
                  </div>
                  <button onclick="window.game.stopSamuGuard()" class="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow transition cursor-pointer">
                    Mettre fin à la Garde SAMU
                  </button>
                ` : `
                  <div class="text-xs text-slate-500">
                    ${vpsps.length === 0 ? '⚠️ Vous devez posséder au moins 1 VPSP pour armer une garde SAMU.' : `${dispoVpsps.length} VPSP et ${qualifiedVolunteers.length} secouristes qualifiés disponibles.`}
                  </div>
                  <button onclick="window.game.startSamuGuard()" ${vpsps.length === 0 || qualifiedVolunteers.length < 3 ? 'disabled class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed"' : 'class="px-4 py-2 rounded-xl text-xs font-black bg-pc-orange hover:bg-pc-orange-hover text-white shadow-md transition cursor-pointer"'}>
                    Armer la Garde SAMU (VPSP)
                  </button>
                `}
              </div>
            `}
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

              <span class="px-3 py-1.5 rounded-full text-xs font-black ${!this.sdisConvention?.signed ? 'bg-amber-100 text-amber-800 border border-amber-300' : (isGuardActive ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600')}">
                ${!this.sdisConvention?.signed ? 'NON CONVENTIONNÉ' : (isGuardActive ? 'DISPOSITIF ARMÉ' : 'HORS SERVICE')}
              </span>
            </div>

            ${!this.sdisConvention?.signed ? `
              <!-- Avertissement et prérequis convention SDIS requise -->
              <div class="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">🚒</span>
                  <div>
                    <h5 class="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Convention Partenariale SDIS Requise
                    </h5>
                    <p class="text-[11.5px] text-amber-900 mt-0.5 leading-relaxed">
                      Pour intégrer le schéma de réponse opérationnelle des Sapeurs-Pompiers (SDIS / CTA-CODIS) et assurer des gardes caserne avec un VPSP, votre antenne doit être signataire de la <strong>Convention Partenariale SDIS</strong>.
                    </p>
                  </div>
                </div>

                <div class="pt-2 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="text-[10.5px] text-amber-800 font-bold">
                    ${!this.aascConvention?.signed ? 'Étape requise : Convention Préfectorale d’AASC (800 €)' : 'Prérequis SDIS : 1 ambulance VPSP et 3 secouristes qualifiés'}
                  </div>
                  ${!this.aascConvention?.signed ? `
                    <button onclick="window.game.openModule('conventions')" class="px-4 py-2 rounded-xl text-xs font-black bg-amber-700 hover:bg-amber-800 text-white shadow-sm transition cursor-pointer">
                      Souscrire l’AASC (Conventions)
                    </button>
                  ` : `
                    <button onclick="window.game.signSdisConvention()" ${vpsps.length === 0 || dispoVolunteers.length < 3 ? 'disabled class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed"' : 'class="px-4 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-md transition cursor-pointer"'}>
                      ✍️ Signer la Convention SDIS (+350 €)
                    </button>
                  `}
                </div>
              </div>
            ` : `
              <!-- Choix du joueur : Déclenchement Automatique (Garde Caserne Postée) vs Manuel (Astreinte) -->
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div class="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>Déclenchement Opérationnel :</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${sdis?.mode === 'poste' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-blue-100 text-pc-blue border border-blue-300'}">
                      ${sdis?.mode === 'poste' ? '🛡️ Caserne Postée (Départ Auto)' : '🏠 Astreinte Domicile (Départ Manuel)'}
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-0.5">
                    ${sdis?.mode === 'poste' ? 'Départ automatique immédiat dès alerte CODIS (0 clic, réactivité max, fatigue accrue -15).' : 'L’équipage attend vos ordres, vous déclenchez vous-même le départ (moins fatiguant -5).'}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <button onclick="window.game.setSdisGuardMode('poste')" class="px-3 py-1.5 rounded-xl text-xs font-black transition ${sdis?.mode === 'poste' ? 'bg-red-600 text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}">
                    🛡️ Caserne Postée (Auto)
                  </button>
                  <button onclick="window.game.setSdisGuardMode('astreinte')" class="px-3 py-1.5 rounded-xl text-xs font-black transition ${sdis?.mode !== 'poste' ? 'bg-pc-blue text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'}">
                    🏠 Astreinte (Manuel)
                  </button>
                </div>
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
                  <button onclick="window.game.openModule('locaux')" class="py-2 rounded-xl text-xs font-black bg-pc-blue hover:bg-pc-blue-light text-white transition flex items-center justify-center gap-1.5 shadow-sm" title="Gestion des locaux, capacité de stockage, salles de formation et éditeur 2D">
                    <i data-lucide="building-2" class="w-3.5 h-3.5"></i>
                    Locaux & Plan 2D
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
      if (window.ProtecLogistique) {
        window.ProtecLogistique.renderModal(this);
      } else if (window.ProtecModals) {
        title.textContent = 'Pôle Logistique, Pharmacie & Garage';
        subtitle.textContent = 'Gestion des stocks médicaux d’urgence et maintenance de la flotte';
        icon.setAttribute('data-lucide', 'package-check');
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
      if (window.ProtecAdvanced && window.ProtecAdvanced.updateTasksProgress) {
        window.ProtecAdvanced.updateTasksProgress(this);
      }
      if (window.ProtecAdvancedModals) {
        body.innerHTML = window.ProtecAdvancedModals.renderRewards(this);
      }
    } else if (moduleKey === 'amenagement' || moduleKey === 'locaux') {
      if (window.ProtecLocaux) {
        window.ProtecLocaux.renderModal(this);
      } else if (window.ProtecAdvancedModals) {
        title.textContent = 'Aménagement & Évolution du Local';
        subtitle.textContent = 'Améliorez vos pièces pour débloquer des bonus passifs permanents';
        icon.setAttribute('data-lucide', 'hammer');
        body.innerHTML = window.ProtecAdvancedModals.renderStationRooms(this, this.selectedStationId || this.stations[0]?.id);
      }
    } else if (moduleKey === 'poles') {
      if (window.ProtecPoles) {
        window.ProtecPoles.renderModal(this);
      }
    } else if (moduleKey === 'specialites') {
      if (window.ProtecSpecialites) {
        window.ProtecSpecialites.renderModal(this);
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
    } else if (moduleKey === 'crise') {
      title.textContent = 'Plan NOVI, Crises Majeures & CUMP';
      subtitle.textContent = 'Dispositif ORSEC, Cellule d’Accueil des Impliqués (CAI), SNCF et Postes Médicaux Avancés';
      icon.setAttribute('data-lucide', 'siren');

      const crisisMissions = (this.missions || []).filter(m => m.type === 'crise' || m.isCumpCai || m.alertOrigin === 'sncf' || ['critique', 'haute'].includes(m.urgency));
      const hasCaiLot = window.ProtecEquipements?.hasEquipment(this, 'lot_soutien_psy');
      const hasPmaLot = window.ProtecEquipements?.hasEquipment(this, 'lot_secours_c');
      const aepVols = (this.volunteers || []).filter(v => (v.skills || []).some(s => s === 'aep1' || s === 'aep2'));
      const cdVols = (this.volunteers || []).filter(v => v.rank === 'CD' || (v.skills || []).includes('cd'));

      body.innerHTML = `
        <div class="space-y-4">
          <!-- Bandeau Statut Préfectoral ORSEC / NOVI -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-700 to-amber-700 text-white shadow-xl flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black">
                🚨
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-rose-200">Dispositif Spécifique ORSEC / NOVI</span>
                <h4 class="text-base font-black">Poste de Commandement de Crise & CUMP</h4>
                <p class="text-xs text-white/80">Agrément C (Missions de Sécurité Civile) • Liaisons SAMU / CODIS / Préfecture</p>
              </div>
            </div>
            <div class="text-right">
              <span class="px-2.5 py-1 rounded-full text-xs font-black bg-white/20 text-white border border-white/30">
                ${crisisMissions.length > 0 ? `${crisisMissions.length} Alerte(s) Active(s)` : 'Veille Opérationnelle'}
              </span>
            </div>
          </div>

          <!-- 4 Indicateurs de Préparation à la Crise -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div class="p-3 rounded-2xl glass-card border border-slate-200 text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 block">Lot Accueil CAI</span>
              <span class="text-xs font-black ${hasCaiLot ? 'text-emerald-600' : 'text-slate-400'}">${hasCaiLot ? 'Opérationnel ✓' : 'Non équipé'}</span>
            </div>
            <div class="p-3 rounded-2xl glass-card border border-slate-200 text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 block">Tente Poste PMA</span>
              <span class="text-xs font-black ${hasPmaLot ? 'text-emerald-600' : 'text-slate-400'}">${hasPmaLot ? 'Armée (Lot C) ✓' : 'En réserve'}</span>
            </div>
            <div class="p-3 rounded-2xl glass-card border border-slate-200 text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 block">Intervenants AEP</span>
              <span class="text-xs font-black text-pc-blue">${aepVols.length} secouriste(s)</span>
            </div>
            <div class="p-3 rounded-2xl glass-card border border-slate-200 text-center">
              <span class="text-[10px] font-black uppercase text-slate-400 block">Chefs Dispositif CD</span>
              <span class="text-xs font-black text-indigo-600">${cdVols.length} cadre(s)</span>
            </div>
          </div>

          <!-- Liste des Événements & Crises en cours -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Missions de Crise & Urgences Réflexes (${crisisMissions.length})</h5>
              <button onclick="window.game.setFilter('crise'); window.game.closeMainModal();" class="text-xs font-bold text-red-600 hover:underline">Voir sur la carte</button>
            </div>

            ${crisisMissions.length === 0 ? `
              <div class="p-6 text-center glass-card rounded-2xl space-y-1.5 border border-slate-200">
                <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg">🛡️</div>
                <div class="font-extrabold text-slate-800 text-xs">Aucune crise majeure déclarée</div>
                <p class="text-[11px] text-slate-400 max-w-sm mx-auto">Votre antenne reste en astreinte 24h/24. En cas d'accident ferroviaire, activation CUMP ou alerte météo, l'ordre de mission apparaîtra immédiatement.</p>
              </div>
            ` : `
              <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                ${crisisMissions.map(m => `
                  <div class="p-3.5 rounded-2xl glass-card border border-red-200 bg-red-50/20 flex items-center justify-between gap-3 shadow-sm">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                        <span class="font-black text-xs text-slate-900">${m.title}</span>
                        <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${m.status === 'prealerte' ? 'bg-amber-100 text-amber-800' : 'bg-red-600 text-white'}">${m.status}</span>
                      </div>
                      <p class="text-[11px] text-slate-600 line-clamp-1">${m.desc || 'Intervention de grande envergure sous autorité préfectorale.'}</p>
                    </div>
                    <button onclick="window.game.closeMainModal(); window.game.openMissionDetails('${m.id}')" class="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow transition flex-shrink-0">
                      Prendre en charge
                    </button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Protocoles Opérationnels de Référence -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <span class="font-bold text-slate-800 block text-[11px] uppercase tracking-wider text-slate-400">Rappels Doctrine Opérationnelle :</span>
            <ul class="space-y-1.5 text-[11px] text-slate-600">
              <li class="flex items-start gap-1.5">
                <span class="text-pc-blue font-bold">•</span>
                <span><strong>Convention CUMP / CAI :</strong> Accusé sous 20 min, départ sous 1h (1h30 nuit), CAI opérationnel sous 2h (4 à 6 intervenants + Chef de détachement).</span>
              </li>
              <li class="flex items-start gap-1.5">
                <span class="text-pc-blue font-bold">•</span>
                <span><strong>Plan NOVI / PMA :</strong> Traçabilité SINUS, noria d'évacuation VPSP vers les Centres Hospitaliers de secteur.</span>
              </li>
            </ul>
          </div>
        </div>
      `;
    } else {
      // Fallback de sécurité : si la clé n'est pas reconnue, rediriger proprement vers le planning
      this.openModule('planning', isBackNavigation);
      return;
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
    const catalogItem = window.ProtecAdvanced?.vehicleCatalog?.find(v => v.type === type);
    const cost = catalogItem ? catalogItem.cost : (type === 'VPSP' ? 28500 : 11500);
    if (this.resources.money < cost) {
      this.showToast('Trésorerie insuffisante', `L’achat requiert ${cost.toLocaleString('fr-FR')} €.`, 'orange');
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
      label: catalogItem?.name || (type === 'VPSP' ? 'Véhicule de Premiers Secours à Personnes' : type),
      capacity: catalogItem ? catalogItem.capacity : (type === 'VPSP' ? 5 : 4),
      seatsCount: catalogItem ? catalogItem.capacity : (type === 'VPSP' ? 5 : 4),
      extraCapacityLabel: catalogItem?.extraCapacityLabel || null,
      hasTowHitch: catalogItem?.hasTowHitch || false,
      requiresTrailer: catalogItem?.requiresTrailer || false,
      reqSkills: catalogItem?.reqSkills || [],
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
      'MPS': 'images/vehicles/Moto.png',
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
    const subnav = document.getElementById('modal-category-subnav');
    if (subnav) subnav.classList.add('hidden');
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
  openFinancesModal() {
    if (window.ProtecFinances) {
      window.ProtecFinances.renderFinancesModal(this);
    } else {
      this.openModule('devis');
    }
  }
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

      // 1. Progression des missions en cours (Vraie durée & Main Courante de Crise)
      this.missions.forEach(m => {
        if (m.status === 'ongoing') {
          // Mission de Sinistre / Crise : Pas de fin arbitraire fixe, Main courante évolutive
          if ((m.isCrisis || ['crise', 'pompiers', 'samu', 'meteo'].includes(m.type)) && window.ProtecCriseLogistique) {
            window.ProtecCriseLogistique.progressCrisisMission(this, m);
          } else {
            // Dispositif classique (DPS, Maraude sociale programmée)
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
        }
      });

      // 1c. LOGISTIQUE RÉELLE : Réarmement des véhicules et tâches en cours
      if (window.ProtecCriseLogistique) {
        window.ProtecCriseLogistique.updateLogisticClock(this);
      }

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

      // 1e. GESTION DES LOCAUX, CHANTIERS DE TRAVAUX & SÉCURITÉ DU BÂTIMENT
      if (window.ProtecLocaux && typeof window.ProtecLocaux.updateClock === 'function') {
        window.ProtecLocaux.updateClock(this);
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

        // Contrôles périodiques CUMP, Subventions et Communication
        if (window.ProtecCump && typeof window.ProtecCump.checkComplianceTimer === 'function') {
          window.ProtecCump.checkComplianceTimer(this);
        }
        if (window.ProtecSocial && typeof window.ProtecSocial.checkDailyDeadlines === 'function') {
          window.ProtecSocial.checkDailyDeadlines(this);
        }
        if (window.ProtecCommunication && typeof window.ProtecCommunication.processDailyTick === 'function') {
          window.ProtecCommunication.processDailyTick(this);
        }
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

      // 1d. GESTION DE L'EXPIRATION DES DEVIS (expiration automatique sous 4 minutes si non traités)
      if (this.devis && this.devis.length > 0) {
        this.devis.forEach(d => {
          if (d.status === 'pending') {
            if (typeof d.secondsLeft !== 'number') {
              d.secondsLeft = 240;
            }
            d.secondsLeft--;
            if (d.secondsLeft <= 0) {
              d.status = 'expired';
              this.showToast('Devis Expiré', `L’organisateur de « ${d.eventName} » a retenu une autre association agréée faute de réponse dans les délais.`, 'orange');
              if (window.ProtecNotifications) {
                window.ProtecNotifications.recordNotification({
                  title: '⏱️ Demande de Devis Expirée',
                  message: `La demande de devis pour « ${d.eventName} » a expiré sans réponse. L'organisateur s'est tourné vers une association concurrente.`,
                  category: 'dps',
                  level: 'warning'
                });
              }
              this.updateStatsUI();
            }
          }
        });
      }

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

      // 3e. Déclenchement d'Ordre de Mission CUMP / CAI (si Convention AASC-CUMP signée)
      if (this.clock.second === 40 && this.clock.minute % 12 === 0) {
        if (this.stations.length > 0 && this.cumpConvention && this.cumpConvention.signed) {
          if (Math.random() < 0.35 && window.ProtecCump && typeof window.ProtecCump.triggerCumpAlert === 'function') {
            window.ProtecCump.triggerCumpAlert(this);
          }
        }
      }

      // 3f. Décompte des délais chronométrés pour les missions CAI / CUMP actives
      if (window.ProtecCump && typeof window.ProtecCump.updateCumpMissionsClock === 'function') {
        window.ProtecCump.updateCumpMissionsClock(this);
      }

      // 4. Sollicitations spontanées des organisateurs locaux
      // RÈGLE : Si l'antenne vient d'ouvrir et ne fait NI pub NI DPS -> VISIBILITÉ NULLE = 0 DEMANDE DE DEVIS
      if (this.clock.second === 0 && this.clock.minute % 2 === 0) {
        if (this.stations.length > 0) {
          const hasActiveCampaign = !!(this.resources.campaigns?.social || this.resources.campaigns?.posters);
          const completedDpsCount = (this.missions || []).filter(m => m.type === 'dps' && m.status === 'completed').length;
          const repScore = this.resources.reputationScore || 0;

          // L'antenne n'est visible que si elle communique activement OU qu'elle a déjà fait ses preuves sur des DPS (ou notoriété établie)
          const isAntennaVisible = hasActiveCampaign || completedDpsCount > 0 || repScore >= 60;

          if (isAntennaVisible) {
            let devisChance = 0.06; // Base modeste
            if (completedDpsCount >= 1) devisChance += 0.14;
            if (completedDpsCount >= 5) devisChance += 0.10;
            devisChance += Math.min(0.20, repScore / 1200); // Bonus réputation
            if (this.resources.campaigns?.social) devisChance += 0.30; // Fort impact pub réseaux
            if (this.resources.campaigns?.posters) devisChance += 0.25; // Fort impact affichage mairie
            
            const pendingDevisCount = this.devis.filter(d => d.status === 'pending').length;
            if (pendingDevisCount < 4 && Math.random() < devisChance) {
              this.generateRandomDevisOpportunity();
            }
          }
        }
      }

      // 5. Arrivée de nouvelles candidatures spontanées
      // RÈGLE RÉALISTE : Arrivée mesurée (1 fois par heure in-game maximum si campagne active)
      if (this.clock.second === 0 && this.clock.minute === 0) {
        if (this.stations.length > 0) {
          const hasActiveCampaign = !!(this.resources.campaigns?.social || this.resources.campaigns?.posters);
          const repScore = this.resources.reputationScore || 0;
          const pendingCount = (this.candidatures || []).filter(c => c.status !== 'rejected').length;

          // Maximum 3 candidatures en attente simultanées
          if (pendingCount < 3) {
            let candChance = 0;
            if (this.resources.campaigns?.social) candChance += 0.20;
            if (this.resources.campaigns?.posters) candChance += 0.12;
            if (!hasActiveCampaign && repScore >= 80) candChance = 0.03; // Très rare sans pub

            if (candChance > 0 && Math.random() < candChance) {
              this.generateRandomCandidature();
            }
          }
        }
      }

      // Suivi quotidien de la motivation des candidats et expiration après plusieurs jours
      if (this.clock.second === 0 && this.clock.minute === 0 && this.clock.hour === 8) {
        if (this.candidatures && this.candidatures.length > 0) {
          const currentDay = this.clock.day || 1;
          this.candidatures.forEach(cand => {
            const ageDays = currentDay - (cand.createdDay || currentDay);
            if (ageDays >= 2 && !cand.isImpatient) {
              cand.isImpatient = true;
              cand.motivation = Math.max(20, (cand.motivation || 85) - 25);
              this.showToast('Candidat Impatient', `${cand.name} attend une réponse depuis 2 jours et commence à se démotiver.`, 'orange');
            }
          });

          // Après 4 jours sans réponse, le candidat retire sa candidature
          const expired = this.candidatures.filter(cand => (currentDay - (cand.createdDay || currentDay)) >= 4);
          if (expired.length > 0) {
            expired.forEach(cand => {
              this.showToast('Candidature Annulée', `Faute de réponse sous 4 jours, ${cand.name} a retiré sa candidature bénévole.`, 'red');
            });
            this.candidatures = this.candidatures.filter(cand => (currentDay - (cand.createdDay || currentDay)) < 4);
            this.updateStatsUI();
          }
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

    // DÉCLENCHEMENT AUTOMATIQUE SI GARDE POSTÉE RÉFLEXE (Choix joueur : Postée = Auto, Astreinte = Manuel)
    const isAutoPoste = this.samuGarde && this.samuGarde.active && this.samuGarde.mode === 'poste';
    if (isAutoPoste) {
      const vpsp = this.vehicles.find(v => v.id === this.samuGarde.vehicleId);
      if (vpsp && vpsp.status !== 'mission') {
        newSamu.status = 'ongoing';
        newSamu.startedAt = Date.now();
        newSamu.registeredVolunteers = [...(this.samuGarde.crewVolunteerIds || [])];
        newSamu.assignedCrew = {
          volunteers: [...(this.samuGarde.crewVolunteerIds || [])],
          vehicles: [vpsp]
        };
        vpsp.status = 'mission';

        // Fatigue accrue garde postée (-15 énergie)
        (this.samuGarde.crewVolunteerIds || []).forEach(vid => {
          const vol = this.volunteers.find(v => v.id === vid);
          if (vol) vol.energy = Math.max(10, (vol.energy || 80) - 15);
        });

        // Transit routier prioritaire vers le lieu de la détresse
        const base = this.stations[0] || { lat: 48.8566, lng: 2.3522 };
        if (window.ProtecSystems) {
          window.ProtecSystems.startTransit(this, vpsp, { lat: base.lat, lng: base.lng }, { lat: newSamu.lat, lng: newSamu.lng }, newSamu, 2);
        }

        this.showToast('⚡ SAMU 15 (Départ Réflexe Auto)', `Ambulance ${vpsp.name} partie immédiatement vers « ${pick.title} » sans attente !`, 'green');
      }
    }

    this.missions.push(newSamu);
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'samu',
        isAutoPoste ? `⚡ DÉPART IMMÉDIAT SAMU 15 (Auto)` : `🚑 DÉPART RÉFLEXE SAMU 15`,
        `${pick.title} à proximité de ${base.name}. ${isAutoPoste ? 'Équipage en route.' : 'VPSP demandé en urgence !'}`,
        `samu-${newSamu.id}`
      );
    } else if (window.ProtecIncidents) {
      window.ProtecIncidents.sendSystemNotification(
        `🚑 DÉPART RÉFLEXE SAMU 15`,
        `${pick.title} à proximité de ${base.name}. VPSP demandé !`,
        `samu-${newSamu.id}`
      );
    }

    if (!isAutoPoste) {
      this.showToast('Appel Régulation SAMU 15', `Départ réflexe : ${pick.title} !`, 'orange');
    }
  }

  setSamuGuardMode(mode) {
    if (!this.samuGarde) this.samuGarde = {};
    this.samuGarde.mode = mode;
    this.showToast('Mode Opérationnel SAMU', mode === 'poste' ? '🛡️ Garde Postée sélectionnée : départs réflexes 100% automatiques !' : '🏠 Astreinte Domicile sélectionnée : validation manuelle par vos soins.', 'blue');
    this.saveGame();
    this.openModule('samu');
  }

  setSdisGuardMode(mode) {
    if (!this.sdisGarde) this.sdisGarde = {};
    this.sdisGarde.mode = mode;
    this.showToast('Mode Opérationnel SDIS', mode === 'poste' ? '🛡️ Garde Caserne Postée sélectionnée : départ réflexe automatique !' : '🏠 Astreinte Domicile sélectionnée : validation manuelle par vos soins.', 'blue');
    this.saveGame();
    this.openModule('pompiers');
  }

  startSamuGuard() {
    if (!this.aascConvention?.signed) {
      this.showToast('Convention AASC Requise ⚠️', 'Vous devez d’abord souscrire la Convention Cadre Fondatrice AASC.', 'orange');
      this.openModule('conventions');
      return;
    }
    if (!this.samuConvention?.signed) {
      this.showToast('Convention SAMU 15 Requise ⚠️', 'Vous devez signer la Convention Cadre SAMU 15 avant d’armer une garde.', 'orange');
      this.openModule('samu');
      return;
    }

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
      mode: this.samuGarde?.mode || 'poste',
      vehicleId: vpsp.id,
      crewVolunteerIds: team.map(v => v.id),
      shiftStartedAt: Date.now(),
      totalInterventions: (this.samuGarde?.totalInterventions || 0)
    };

    vpsp.status = 'samu_garde';
    team.forEach(v => { v.status = 'samu_garde'; });

    this.showToast('Garde SAMU 15 Armée !', `Ambulance ${vpsp.name} et ${team.length} secouristes mis à disposition de la régulation départementale 15 (${this.samuGarde.mode === 'poste' ? 'Départ Auto' : 'Astreinte Manuel'}).`, 'green');
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
    if (!this.aascConvention?.signed) {
      this.showToast('Convention AASC Requise ⚠️', 'Vous devez d’abord souscrire la Convention Cadre Fondatrice AASC.', 'orange');
      this.openModule('conventions');
      return;
    }
    if (!this.sdisConvention?.signed) {
      this.showToast('Convention SDIS Requise ⚠️', 'Vous devez signer la Convention Partenariale SDIS avant d’armer un dispositif pompier.', 'orange');
      this.openModule('pompiers');
      return;
    }
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

    // DÉCLENCHEMENT AUTOMATIQUE SI GARDE CASERNE POSTÉE (Choix joueur : Caserne Postée = Auto, Astreinte = Manuel)
    const isAutoSdis = this.sdisGarde && this.sdisGarde.active && this.sdisGarde.mode === 'poste';
    if (isAutoSdis) {
      const vpsp = this.vehicles.find(v => v.id === this.sdisGarde.vehicleId);
      const crewIds = this.sdisGarde.caserneCrew || [];
      if (vpsp && vpsp.status !== 'mission' && crewIds.length > 0) {
        newSdis.status = 'ongoing';
        newSdis.startedAt = Date.now();
        newSdis.registeredVolunteers = [...crewIds];
        newSdis.assignedCrew = {
          volunteers: [...crewIds],
          vehicles: [vpsp]
        };
        vpsp.status = 'mission';

        // Fatigue accrue garde postée (-15 énergie)
        crewIds.forEach(vid => {
          const vol = this.volunteers.find(v => v.id === vid);
          if (vol) vol.energy = Math.max(10, (vol.energy || 80) - 15);
        });

        const base = this.stations[0] || { lat: 48.8566, lng: 2.3522 };
        if (window.ProtecSystems) {
          window.ProtecSystems.startTransit(this, vpsp, { lat: base.lat, lng: base.lng }, { lat: newSdis.lat, lng: newSdis.lng }, newSdis, 2);
        }

        this.showToast('⚡ SDIS Pompiers (Départ Réflexe Auto)', `Ambulance ${vpsp.name} partie immédiatement vers « ${pick.title} » sans attente !`, 'red');
      }
    }

    this.missions.push(newSdis);
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'sdis',
        isAutoSdis ? `⚡ DÉPART IMMÉDIAT CODIS (Auto)` : `🚒 DÉPART POMPIERS IMMÉDIAT (CODIS)`,
        `${pick.title} : ${isAutoSdis ? 'Équipage en route sous gyrophare.' : 'Équipage VPSP en caserne sonné pour départ réflexe !'}`,
        `sdis-${newSdis.id}`
      );
    } else if (window.ProtecIncidents) {
      window.ProtecIncidents.sendSystemNotification(
        `🚨 DÉPART POMPIERS IMMÉDIAT`,
        `${pick.title} ! Équipage VPSP en caserne sonné par le CODIS !`,
        `sdis-${newSdis.id}`
      );
    }

    if (!isAutoSdis) {
      this.showToast('Départ Pompiers (CODIS)', `${pick.title} ! Départ réflexe immédiat requis.`, 'orange');
    }
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
      role: p.rank === 'PSE2' ? 'Équipier-Secouriste' : p.role,
      skills: p.skills,
      isTrainer: p.isTrainer,
      createdDay: this.clock?.day || 1,
      createdAt: Date.now(),
      motivation: 85,
      isImpatient: false
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
    if (volAvail) {
      volAvail.textContent = availableCount;
      volAvail.title = `${availableCount} bénévole(s) disponible(s) immédiatement`;
    }
    const volTotal = document.getElementById('stat-volunteers-total');
    if (volTotal) {
      volTotal.textContent = this.volunteers.length;
      volTotal.title = `${this.volunteers.length} secouriste(s) au total dans l'antenne`;
    }

    const planCount = this.missions.filter(m => m.status === 'planifie' || m.status === 'ongoing' || m.type === 'dps').length;
    const devisCount = this.devis.filter(d => d.status === 'pending').length;
    const samuCount = this.missions.filter(m => m.type === 'samu' && (m.status === 'planifie' || m.status === 'ongoing')).length;
    const sdisCount = this.missions.filter(m => m.type === 'pompiers' && (m.status === 'planifie' || m.status === 'ongoing')).length;
    const criseCount = this.missions.filter(m => m.type === 'crise' || m.urgency === 'critique').length;
    const candCount = this.candidatures.length;
    const renfCount = this.renforts.filter(r => r.status === 'open').length;
    const ongoingCount = this.missions.filter(m => m.status === 'ongoing').length;

    // Badges Grands Menus Principaux Desktop
    const totalMissionsActive = planCount + devisCount + samuCount + sdisCount + criseCount;
    const bMissionsMain = document.getElementById('badge-missions-main-dock');
    if (bMissionsMain) {
      bMissionsMain.textContent = totalMissionsActive;
      bMissionsMain.className = totalMissionsActive > 0 
        ? 'absolute top-1 right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-pc-blue text-white shadow-sm'
        : 'hidden';
    }

    const bRhMain = document.getElementById('badge-rh-main-dock');
    if (bRhMain) {
      bRhMain.textContent = candCount;
      bRhMain.className = candCount > 0 
        ? 'absolute top-1 right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-500 text-white shadow-sm'
        : 'hidden';
    }

    const bLiaisonsMain = document.getElementById('badge-liaisons-main-dock');
    if (bLiaisonsMain) {
      bLiaisonsMain.textContent = renfCount;
      bLiaisonsMain.className = renfCount > 0 
        ? 'absolute top-1 right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-sky-600 text-white shadow-sm'
        : 'hidden';
    }

    // Badges Mobile
    const bMissionsMob = document.getElementById('badge-missions-mobile');
    if (bMissionsMob) bMissionsMob.textContent = totalMissionsActive;

    const bRhMob = document.getElementById('badge-rh-mobile');
    if (bRhMob) bRhMob.textContent = candCount;

    const bLiaisonsMob = document.getElementById('badge-liaisons-mobile');
    if (bLiaisonsMob) {
      bLiaisonsMob.textContent = renfCount;
      bLiaisonsMob.className = renfCount > 0 
        ? 'absolute -top-1 -right-2 px-1 py-0.1 rounded-full text-[8px] font-black bg-sky-600 text-white min-w-[14px] text-center leading-tight'
        : 'hidden';
    }

    // Badges Sous-menus Flottants
    const bSubPlan = document.getElementById('badge-submenu-planning');
    if (bSubPlan) bSubPlan.textContent = planCount;

    const bSubDev = document.getElementById('badge-submenu-devis');
    if (bSubDev) bSubDev.textContent = devisCount;

    const bSubSamu = document.getElementById('badge-submenu-samu');
    if (bSubSamu) bSubSamu.textContent = samuCount;

    const bSubPomp = document.getElementById('badge-submenu-pompiers');
    if (bSubPomp) bSubPomp.textContent = sdisCount;

    const bSubCrise = document.getElementById('badge-submenu-crise');
    if (bSubCrise) bSubCrise.textContent = criseCount;

    const bSubBenev = document.getElementById('badge-submenu-benevoles');
    if (bSubBenev) bSubBenev.textContent = this.volunteers.length;

    const bSubRecrut = document.getElementById('badge-submenu-recrutement');
    if (bSubRecrut) bSubRecrut.textContent = candCount;

    const bSubVeh = document.getElementById('badge-submenu-vehicules');
    if (bSubVeh) bSubVeh.textContent = this.vehicles.length;

    const bSubRadio = document.getElementById('badge-submenu-radio');
    if (bSubRadio) bSubRadio.textContent = ongoingCount;

    const bSubAll = document.getElementById('badge-submenu-alliance');
    if (bSubAll) {
      bSubAll.textContent = renfCount;
      bSubAll.className = renfCount > 0 
        ? 'text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold'
        : 'hidden';
    }

    // Rétrocompatibilité anciens badges
    const bPlan = document.getElementById('badge-planning-dock');
    if (bPlan) bPlan.textContent = planCount;
    const bDev = document.getElementById('badge-devis-dock');
    if (bDev) bDev.textContent = devisCount;
    const bCand = document.getElementById('badge-recrutement-dock');
    if (bCand) bCand.textContent = candCount;

    // Actualisation du masquage/déblocage automatique
    this.updateDockAndFiltersVisibility();

    // Gestion de la notification cadeau : UNIQUEMENT s'il y a une antenne configurée et quelque chose de prêt à être réclamé
    const r = this.rewards;
    const hasAntenna = this.stations && this.stations.length > 0;
    const today = this.clock ? this.clock.day : new Date().getDate();
    let hasSomethingToClaim = false;
    if (r && hasAntenna) {
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

  updateToastContainerPosition() {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const drawer = document.getElementById('context-drawer');
    const isDrawerOpen = drawer && !drawer.classList.contains('hidden');

    if (isDrawerOpen) {
      if (window.innerWidth >= 640) {
        container.style.right = '465px';
        container.style.left = 'auto';
      } else {
        container.style.right = '1rem';
        container.style.left = '1rem';
      }
    } else {
      container.style.right = '';
      container.style.left = '';
    }
  }

  showToast(title, message, color = 'blue', target = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Enregistrement systématique dans l'historique des notifications
    if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
      window.ProtecNotifications.recordNotification({ title, message, color, target });
    }

    // Effets sonores opérationnels réalistes (Web Audio API)
    if (window.ProtecAudio) {
      if (color === 'red') {
        window.ProtecAudio.playAlertChime();
      } else if (color === 'orange') {
        window.ProtecAudio.playRadioBeep();
      } else if (color === 'green') {
        window.ProtecAudio.playSuccessChime();
      } else {
        window.ProtecAudio.playClickSound();
      }
    }

    this.updateToastContainerPosition();

    const toast = document.createElement('div');
    toast.className = 'glass-panel-heavy p-3.5 rounded-2xl border border-white/80 shadow-2xl flex items-start gap-3 pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0 z-[100] cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-95';
    toast.title = 'Cliquer pour ouvrir directement cette information';

    let iconBg = 'bg-pc-blue/10 text-pc-blue';
    let iconName = 'bell';
    if (color === 'orange') { iconBg = 'bg-pc-orange/15 text-pc-orange'; iconName = 'alert-triangle'; }
    if (color === 'green') { iconBg = 'bg-emerald-100 text-emerald-600'; iconName = 'check-circle-2'; }
    if (color === 'purple') { iconBg = 'bg-purple-100 text-purple-600'; iconName = 'camera'; }
    if (color === 'red') { iconBg = 'bg-rose-100 text-rose-600'; iconName = 'alert-octagon'; }

    toast.innerHTML = `
      <div class="w-7 h-7 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5">
        <i data-lucide="${iconName}" class="w-4 h-4"></i>
      </div>
      <div class="flex-1 pr-2">
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-extrabold text-slate-900 leading-tight">${title}</h5>
          <span class="text-[9px] font-bold text-pc-blue underline ml-1">Voir ➜</span>
        </div>
        <p class="text-[11px] text-slate-600 mt-0.5 leading-normal">${message}</p>
      </div>
      <button onclick="event.stopPropagation(); this.closest('.glass-panel-heavy').remove()" class="text-slate-400 hover:text-slate-600 p-0.5" title="Fermer">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    // Clic direct sur le toast pour ouvrir l'info
    toast.addEventListener('click', (e) => {
      if (e.target.closest('button')) return; // Clic sur la croix
      toast.remove();
      if (target) {
        if (target.type === 'mission' && target.id) {
          this.openMissionDetails(target.id);
          return;
        } else if (target.type === 'module' && target.id) {
          this.openModule(target.id);
          return;
        }
      }
      if (window.ProtecNotifications && typeof window.ProtecNotifications.handleNotificationClick === 'function') {
        window.ProtecNotifications.handleNotificationClick(0); // Ouvre la toute dernière entrée
      }
    });

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
