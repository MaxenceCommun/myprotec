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

    // Données opérationnelles
    this.stations = [];
    this.vehicles = [];
    this.volunteers = [];
    this.devis = [];
    this.missions = [];
    this.candidatures = [];
    this.formations = [];

    // Données Multijoueur & Alliances
    this.alliances = [];
    this.allianceStations = [];
    this.renforts = [];
    this.formationsSpeciales = [];
    this.chatMessages = [];
    this.activeAllianceTab = 'membres';

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
        manoeuvres: this.manoeuvres,
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
          this.formations = parsed.formations || [];
          this.logistics = parsed.logistics || this.logistics;
          this.weather = parsed.weather || this.weather;
          this.grants = parsed.grants || this.grants;
          this.radioLogs = parsed.radioLogs || this.radioLogs;
          this.rewards = parsed.rewards || this.rewards;
          this.bureau = parsed.bureau || this.bureau;
          this.manoeuvres = parsed.manoeuvres || this.manoeuvres;
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
      }
    });
  }

  populateDepartmentSelector() {
    const sel = document.getElementById('department-selector');
    if (!sel || !window.ProtecDepartements) return;

    sel.innerHTML = window.ProtecDepartements.list.map(d => `
      <option value="${d.code}" ${d.code === this.currentDepartmentCode ? 'selected' : ''}>
        ${d.code} - ${d.name}
      </option>
    `).join('');
  }

  changeDepartment(deptCode) {
    if (!window.ProtecDepartements) return;
    const dept = window.ProtecDepartements.getByCode(deptCode);
    if (!dept) return;

    this.currentDepartmentCode = dept.code;
    this.player.departmentCode = dept.code;
    localStorage.setItem('protec_department_code', dept.code);

    this.map.flyTo([dept.lat, dept.lng], dept.zoom, { duration: 1.5 });
    
    const topName = document.getElementById('top-current-station-name');
    if (topName) topName.textContent = `${dept.name} (${dept.code})`;

    this.showToast('Département Sélectionné', `Vue centrée sur le département ${dept.name} (${dept.code}).`, 'blue');
    this.saveGame();
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

      const el = document.createElement('div');
      el.className = 'custom-leaflet-marker';

      let colorClass = 'bg-pc-blue';
      let pingClass = 'radar-ping-blue';
      let iconName = 'shield-alert';

      if (mission.type === 'samu') { colorClass = 'bg-pc-orange'; pingClass = 'radar-ping-orange'; iconName = 'activity'; }
      else if (mission.type === 'social') { colorClass = 'bg-purple-600'; pingClass = 'radar-ping-purple'; iconName = 'heart-handshake'; }
      else if (mission.type === 'crise') { colorClass = 'bg-red-600'; pingClass = 'radar-ping-red'; iconName = 'siren'; }

      let badgeHtml = '';
      if (mission.status === 'ongoing') {
        badgeHtml = `<span class="badge-counter bg-emerald-500 animate-pulse">✓</span>`;
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
    this.isPlacingAntenna = true;
    document.getElementById('antenna-placement-banner').classList.remove('hidden');
    document.getElementById('map').style.cursor = 'crosshair';
    this.showToast('Implantation', 'Cliquez sur la carte pour choisir l’adresse de votre antenne.', 'blue');
  }

  cancelAntennaPlacement() {
    this.isPlacingAntenna = false;
    document.getElementById('antenna-placement-banner').classList.add('hidden');
    document.getElementById('map').style.cursor = '';
  }

  confirmAntennaPlacement(latlng) {
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

    const isFirst = this.stations.length === 0;
    const cost = isFirst ? 2500 : 4500;

    if (this.resources.money < cost) {
      this.showToast('Trésorerie insuffisante', `Il vous faut ${cost} € de trésorerie.`, 'orange');
      this.cancelAntennaPlacement();
      return;
    }

    this.resources.money -= cost;
    const stationId = `station-${Date.now()}`;
    const deptInfo = window.ProtecDepartements ? window.ProtecDepartements.getByCode(deptCode) : null;
    const isMainAntenna = this.player.deptRole === 'antenne_principale';
    
    let stationName = '';
    if (isFirst) {
      stationName = isMainAntenna 
        ? `Antenne Principale (${deptCode})` 
        : `Antenne Territoriale ${this.player.name} (${deptCode})`;
    } else {
      stationName = `Antenne Rattachée ${this.stations.length + 1} (${deptCode})`;
    }

    const newStation = {
      id: stationId,
      name: stationName,
      departmentCode: deptCode,
      city: deptCode,
      lat: latlng.lat,
      lng: latlng.lng,
      isMain: isFirst && isMainAntenna,
      level: 1,
      rooms: { formation: false, standard: true },
      vehicles: []
    };

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

  generateStarterDevis(centerLatLng) {
    const eventDate = this.createDateOffset(5, 10);
    const d = {
      id: `dev-${Date.now()}`,
      clientName: 'Comité des Fêtes & Mairie',
      clientType: 'municipalite',
      eventName: 'Fête de Printemps & Brocante Municipale',
      eventDate: eventDate,
      durationHours: 7,
      lat: centerLatLng.lat + 0.007,
      lng: centerLatLng.lng + 0.009,
      publicCount: '1 200 personnes',
      scale: 'PAPS (Point d’Alerte - 2 secouristes)',
      requiredVolunteers: 2,
      requiredRanks: ['PSE2', 'PSE1'],
      requiredVehicles: [],
      status: 'pending'
    };

    d.bareme = this.calculateBareme(d);
    d.proposedPrice = d.bareme.totalBareme;
    this.devis.push(d);
  }

  generateRandomDevisOpportunity() {
    if (this.stations.length === 0) return;
    const base = this.stations[Math.floor(Math.random() * this.stations.length)];
    const cap = this.calculatePlayerCapacity ? this.calculatePlayerCapacity() : { tier: 1 };

    let eventsList = [];
    if (cap.tier === 1) {
      // Débutant : 2 à 3 secouristes, durées réalistes 2h à 4h
      eventsList = [
        { name: 'Cross du Collège Pasteur', client: 'Éducation Nationale', cType: 'association', dur: 3, pub: '450 élèves', scale: 'PAPS (2 secouristes)', reqV: 2, ranks: ['PSE1', 'PSE2'], reqVeh: [] },
        { name: 'Brocante de Quartier des Berges', client: 'Comité des Fêtes', cType: 'association', dur: 4, pub: '1 200 chineurs', scale: 'PAPS (2 secouristes)', reqV: 2, ranks: ['PSE1', 'PSE2'], reqVeh: [] },
        { name: 'Tournoi Minimes de Handball', client: 'Club Omnisports', cType: 'club_sportif', dur: 3, pub: '600 personnes', scale: 'PAPS (3 secouristes)', reqV: 3, ranks: ['PSE1', 'PSE2'], reqVeh: cap.vpspCount > 0 ? ['VPSP'] : [] },
        { name: 'Gala Étudiant des Beaux-Arts', client: 'BDE Université', cType: 'association', dur: 4, pub: '800 étudiants', scale: 'DPS-PE (3 secouristes)', reqV: Math.min(3, Math.max(2, cap.totalVolunteers || 2)), ranks: ['PSE1', 'PSE2'], reqVeh: cap.vpspCount > 0 ? ['VPSP'] : [] }
      ];
    } else if (cap.tier === 2) {
      // Opérationnel : 4 à 6 secouristes, 1 VPSP, durées 4h à 6h
      eventsList = [
        { name: 'Course Nocturne des 10 km', client: 'Athlétic Club Régional', cType: 'association', dur: 5, pub: '2 500 coureurs', scale: 'DPS-PE (4 secouristes + VPSP)', reqV: 4, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'] },
        { name: 'Feu d’Artifice & Bal Républicain', client: 'Mairie', cType: 'collectivite', dur: 4, pub: '3 500 spectateurs', scale: 'DPS-PE (5 secouristes + VPSP)', reqV: 5, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'] },
        { name: 'Tournoi Régional de Judo', client: 'Ligue Régionale', cType: 'club_sportif', dur: 6, pub: '1 500 judokas & public', scale: 'DPS-PE (4 secouristes)', reqV: 4, ranks: ['PSE2', 'PSE1'], reqVeh: ['VPSP'] }
      ];
    } else {
      // Confirmé / Grand Dispositif : 6 à 12 secouristes, 1 à 2 VPSP
      eventsList = [
        { name: 'Festival Musical de Plein Air', client: 'Collectif Festif', cType: 'professionnel', dur: 8, pub: '6 000 festivaliers', scale: 'DPS-ME (8 secouristes + 2 VPSP)', reqV: 8, ranks: ['CD', 'CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'] },
        { name: 'Triathlon Départemental', client: 'Fédération Triathlon', cType: 'association', dur: 7, pub: '4 000 participants', scale: 'DPS-ME (6 secouristes + VPSP + VTU)', reqV: 6, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'] },
        { name: 'Rencontre Nationale de Rugby', client: 'Stade Municipal', cType: 'professionnel', dur: 5, pub: '8 500 supporters', scale: 'DPS-ME (10 secouristes + 2 VPSP)', reqV: 10, ranks: ['CE', 'PSE2', 'PSE1'], reqVeh: ['VPSP'] }
      ];
    }

    const pick = eventsList[Math.floor(Math.random() * eventsList.length)];
    const offsetLat = (Math.random() - 0.5) * 0.035;
    const offsetLng = (Math.random() - 0.5) * 0.035;
    const daysAhead = 1 + Math.floor(Math.random() * 4);
    const eventDate = this.createDateOffset(daysAhead, 14);

    const d = {
      id: `dev-${Date.now()}`,
      clientName: pick.client,
      clientType: pick.cType,
      eventName: pick.name,
      eventDate: eventDate,
      durationHours: pick.dur,
      lat: base.lat + offsetLat,
      lng: base.lng + offsetLng,
      publicCount: pick.pub,
      scale: pick.scale,
      requiredVolunteers: pick.reqV,
      requiredRanks: pick.ranks,
      requiredVehicles: pick.reqVeh,
      status: 'pending'
    };

    d.bareme = this.calculateBareme(d);
    d.proposedPrice = d.bareme.totalBareme;

    this.devis.push(d);
    this.updateStatsUI();
    this.saveGame();
    this.showToast('Nouvelle Demande Organisateur', `« ${pick.name} » (${pick.scale}) vous a sollicité pour un devis.`, 'blue');
  }

  previewDevisPrice(devisId, enteredValue) {
    const devis = this.devis.find(d => d.id === devisId);
    if (!devis) return;

    const price = Math.max(0, parseFloat(enteredValue) || 0);
    devis.proposedPrice = price;

    const bareme = devis.bareme.totalBareme;
    const ratio = bareme > 0 ? (price / bareme) : 1;

    const previewEl = document.getElementById(`devis-feedback-${devisId}`);
    if (!previewEl) return;

    let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    let text = '';
    let acceptRate = '';

    if (ratio <= 0.85) {
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      text = 'Tarif solidaire / réduit';
      acceptRate = 'Acceptation quasi-certaine (~98%)';
    } else if (ratio <= 1.05) {
      badgeClass = 'bg-blue-100 text-pc-blue border-blue-200';
      text = 'Tarif conforme au barème national';
      acceptRate = 'Acceptation très probable (~90%)';
    } else if (ratio <= 1.25) {
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
      text = 'Tarif majoré modéré';
      acceptRate = 'Acceptation modérée (~65%)';
    } else if (ratio <= 1.45) {
      badgeClass = 'bg-orange-100 text-orange-800 border-orange-200';
      text = 'Tarif élevé pour le budget';
      acceptRate = 'Risque fort de refus (~30%)';
    } else {
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
      text = 'Tarif prohibitif';
      acceptRate = 'Refus quasi-certain (>90%)';
    }

    const pctDiff = Math.round((ratio - 1) * 100);
    const sign = pctDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`;

    previewEl.innerHTML = `
      <div class="p-2.5 rounded-xl border text-xs flex items-center justify-between ${badgeClass}">
        <div>
          <span class="font-extrabold block">${text} (${sign} par rapport au barème)</span>
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
    const price = input ? parseFloat(input.value) : devis.proposedPrice;

    if (isNaN(price) || price <= 0) {
      this.showToast('Montant invalide', 'Veuillez saisir un tarif valide en euros.', 'orange');
      return;
    }

    devis.proposedPrice = price;
    devis.status = 'sent';

    this.showToast('Devis transmis', `Devis de ${price} € envoyé à l’organisateur. Examen de conformité...`, 'blue');
    this.openModule('devis');

    setTimeout(() => {
      const bareme = devis.bareme.totalBareme;
      const ratio = price / bareme;

      let clientTolerance = 1.0;
      if (devis.clientType === 'municipalite') clientTolerance = 1.15;
      if (devis.clientType === 'professionnel') clientTolerance = 1.25;
      if (devis.clientType === 'association') clientTolerance = 0.95;

      const repBonus = (this.resources.reputationScore / 500) * 0.15;

      let acceptProbability = 1.0;
      if (ratio <= 0.85) acceptProbability = 0.98;
      else if (ratio <= 1.05) acceptProbability = 0.90 + repBonus;
      else if (ratio <= 1.25) acceptProbability = (0.65 * clientTolerance) + repBonus;
      else if (ratio <= 1.45) acceptProbability = (0.30 * clientTolerance) + repBonus;
      else acceptProbability = Math.max(0.05, 0.10 * clientTolerance);

      const isAccepted = Math.random() <= acceptProbability;

      if (isAccepted) {
        devis.status = 'signed';
        this.convertDevisToScheduledMission(devis);
        this.showToast('Convention Signée !', `L’organisateur de « ${devis.eventName} » a validé le devis de ${price} € !`, 'green');
      } else {
        devis.status = 'rejected';
        this.showToast('Devis Décliné', `Montant de ${price} € jugé trop onéreux pour l'événement (Barème : ${bareme} €).`, 'orange');
      }

      this.updateStatsUI();
      this.saveGame();
    }, 3500);
  }

  convertDevisToScheduledMission(devis) {
    const newMission = {
      id: `m-plan-${Date.now()}`,
      type: 'dps',
      categoryLabel: 'DPS - Dispositif Prévu au Calendrier',
      title: devis.eventName,
      desc: `Couverture sanitaire pour ${devis.publicCount}. ${devis.scale}.`,
      lat: devis.lat,
      lng: devis.lng,
      scale: devis.scale,
      eventDate: devis.eventDate,
      duration: devis.durationHours * 10,
      requiredVolunteers: devis.requiredVolunteers,
      requiredRanks: devis.requiredRanks,
      requiredVehicles: devis.requiredVehicles,
      rewardMoney: devis.proposedPrice,
      rewardReputation: 25,
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
        const dispoCheck = window.ProtecPersonnel.calculateAvailability(vol, this);
        if (!dispoCheck.available) return;
      } else {
        const isAvailableThisDay = vol.dispoJours?.includes(mission.eventDate?.dayName);
        if (!isAvailableThisDay) return;
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
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return;

    let newlyRegistered = 0;
    this.volunteers.forEach(vol => {
      if (mission.registeredVolunteers.includes(vol.id)) return;
      if (mission.registeredVolunteers.length >= mission.requiredVolunteers) return;

      if (vol.isBurnout) return; // Ne peut pas être relancé si en arrêt
      if (vol.energy < 25 && vol.trait !== 'devoue') return;

      const boostChance = ((vol.motivation || 70) + 35) / 100;
      if (Math.random() < boostChance) {
        mission.registeredVolunteers.push(vol.id);
        newlyRegistered++;
      }
    });

    mission.relancesCount = (mission.relancesCount || 0) + 1;
    this.saveGame();
    this.renderMissions();
    this.updateStatsUI();

    if (newlyRegistered > 0) {
      this.showToast('Relance réussie', `+${newlyRegistered} secouriste(s) se sont positionnés !`, 'green');
    } else {
      this.showToast('Aucun retour favorable', 'Tous les secouristes disponibles ont des contraintes personnelles.', 'orange');
    }

    this.openMissionDetails(mission.id);
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
        avatar: '🙋‍♂️'
      },
      {
        id: `cand-${Date.now()}-2`,
        name: 'Julie Rousseau',
        age: 31,
        job: 'Infirmière libérale',
        motivation: 'Titulaire AFGSU, je veux rejoindre les équipes de secours pour apporter mon soutien sur le terrain.',
        dispoJours: ['Vendredi', 'Samedi', 'Dimanche'],
        dispoType: 'salarié',
        avatar: '👩‍⚕️'
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

    this.candidatures = this.candidatures.filter(c => c.id !== candId);

    const newVol = {
      id: `vol-${Date.now()}`,
      name: cand.name,
      role: 'Bénévole Stagiaire',
      rank: 'Stagiaire',
      exp: 0,
      status: 'dispo',
      stationId: stationId || this.stations[0]?.id,
      isTrainer: false,
      avatar: cand.avatar,
      dispoType: cand.dispoType,
      dispoJours: cand.dispoJours,
      motivation: 85
    };

    this.volunteers.push(newVol);
    this.updateStatsUI();
    this.saveGame();
    this.showToast('Bénévole intégré !', `${cand.name} a signé sa charte d'engagement !`, 'green');
    this.openModule('recrutement');
  }

  rejectCandidature(candId) {
    this.candidatures = this.candidatures.filter(c => c.id !== candId);
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

    if (mission.registeredVolunteers.length < mission.requiredVolunteers) {
      this.showToast('Effectif incomplet', `Il manque encore ${mission.requiredVolunteers - mission.registeredVolunteers.length} secouriste(s). Pensez à demander un renfort d'alliance !`, 'orange');
      return;
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
      const dispoVeh = this.vehicles.find(veh => veh.status === 'dispo' && mission.requiredVehicles.includes(veh.type));
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

    // Trajet routier animé avec gyrophare si véhicule présent
    if (assignedVehicles.length > 0 && window.ProtecSystems) {
      const veh = assignedVehicles[0];
      const station = this.stations.find(s => s.id === veh.stationId) || this.stations[0];
      const origin = { lat: station.lat, lng: station.lng };
      const dest = { lat: mission.lat, lng: mission.lng };
      window.ProtecSystems.startTransit(this, veh, origin, dest, mission, 2, () => {
        // Arrivé sur place
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

    mission.assignedCrew.volunteers.forEach(v => {
      v.status = 'dispo';
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
    mission.assignedCrew.vehicles.forEach(veh => {
      veh.status = 'dispo';
    });

    // Consommation de matériel de secours
    if (window.ProtecSystems) {
      if (mission.type === 'samu') window.ProtecSystems.consumeSupply(this, 'oxygenBottles', 1);
      else window.ProtecSystems.consumeSupply(this, 'woundKits', 1);
    }

    this.resources.money += mission.rewardMoney;
    this.resources.reputationScore += mission.rewardReputation;

    this.renderStations();
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    this.showToast('Dispositif terminé', `« ${mission.title} » clôturé (+${mission.rewardMoney} €) !`, 'green');

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
                Bénévoles Inscrits (${registeredVols.length} / ${mission.requiredVolunteers})
              </h4>
              <div class="flex gap-2">
                <button onclick="window.game.requestAllianceRenfortForMission('${mission.id}')" class="text-xs font-extrabold text-indigo-600 hover:underline flex items-center gap-1" title="Faire appel aux autres joueurs et antennes alliées">
                  <i data-lucide="users" class="w-3.5 h-3.5"></i>
                  Renfort Alliance
                </button>
                <button onclick="window.game.relanceVolunteers('${mission.id}')" class="text-xs font-extrabold text-pc-orange hover:underline flex items-center gap-1">
                  <i data-lucide="send" class="w-3.5 h-3.5"></i>
                  Relancer
                </button>
              </div>
            </div>

            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              ${registeredVols.length === 0 ? '<p class="text-xs text-amber-600 p-2.5 glass-card-amber rounded-xl">Aucun bénévole positionné pour l’instant. Lancez une relance ou demandez du renfort à vos alliés.</p>' : ''}
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

    if (mission.status === 'planifie') {
      footer.innerHTML = `
        <button onclick="window.game.closeDrawer()" class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Fermer</button>
        <button onclick="window.game.relanceVolunteers('${mission.id}')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition">
          Alerte SMS
        </button>
        <button onclick="window.game.launchScheduledMission('${mission.id}')" class="flex-1 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-pc-blue to-pc-blue-light text-white shadow-lg shadow-pc-blue/20 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2">
          <i data-lucide="play" class="w-4 h-4"></i>
          Faire Partir
        </button>
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
  openModule(moduleKey) {
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

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
      title.textContent = 'Planning des Dispositifs de Secours (DPS)';
      subtitle.textContent = 'Événements programmés au calendrier officiel, suivi des effectifs et relances';
      icon.setAttribute('data-lucide', 'calendar');

      const dpsMissions = this.missions.filter(m => m.type === 'dps');

      body.innerHTML = `
        <div class="space-y-5">
          <div class="p-4 rounded-2xl glass-card-blue flex items-center justify-between text-xs text-pc-blue">
            <div>
              <span class="font-bold block">Fonctionnement du calendrier :</span>
              Chaque DPS a une date et heure fixées à l’avance. Les secouristes disponibles s’inscrivent d’eux-mêmes.
            </div>
            <button onclick="window.game.generateRandomDevisOpportunity()" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-pc-blue text-white hover:bg-pc-blue-light transition whitespace-nowrap ml-3 shadow-sm">
              + Demande Organisateur
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${dpsMissions.length === 0 ? '<p class="text-xs text-slate-500 p-6 glass-card rounded-2xl text-center col-span-2">Aucun événement planifié pour l’instant. Établissez des devis dans le module Devis pour remplir votre planning.</p>' : ''}
            ${dpsMissions.map(m => {
              const regCount = m.registeredVolunteers?.length || 0;
              const isFull = regCount >= m.requiredVolunteers;
              const dateStr = m.eventDate ? this.formatFullDate(m.eventDate) + ' à ' + m.eventDate.hour + 'h00' : 'Date à confirmer';

              return `
                <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pc-blue text-white">${dateStr}</span>
                      <span class="text-xs font-bold mono-num text-emerald-600">+${m.rewardMoney} €</span>
                    </div>
                    <h4 class="text-sm font-extrabold text-slate-900">${m.title}</h4>
                    <p class="text-xs text-slate-500">${m.scale} • Durée : ${Math.round(m.duration / 10)}h d’intervention</p>
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
      `;
    } else if (moduleKey === 'devis') {
      title.textContent = 'Gestion des Devis & Barème National';
      subtitle.textContent = 'Saisie libre du montant avec barème de référence officiel et acceptation selon budget';
      icon.setAttribute('data-lucide', 'file-check');

      const pendingDevis = this.devis.filter(d => d.status === 'pending');
      const treatedDevis = this.devis.filter(d => d.status !== 'pending');

      body.innerHTML = `
        <div class="space-y-6">
          <div class="p-4 rounded-2xl glass-card-amber text-xs text-amber-950 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-extrabold flex items-center gap-1.5 text-amber-900">
                <i data-lucide="scale" class="w-4 h-4 text-amber-600"></i>
                Barème Réglementaire de Référence (Protection Civile)
              </span>
              <button onclick="window.game.generateRandomDevisOpportunity(); window.game.openModule('devis');" class="text-xs font-bold text-pc-blue hover:underline">+ Nouvelle Demande Organisateur</button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-amber-800">
              <div class="p-2 glass-card rounded-xl">Vacation secouriste : <strong>18,00 €/h</strong></div>
              <div class="p-2 glass-card rounded-xl">Ambulance VPSP : <strong>110,00 €</strong></div>
              <div class="p-2 glass-card rounded-xl">Matériel & DSA : <strong>35 à 120 €</strong></div>
              <div class="p-2 glass-card rounded-xl">Frais convention : <strong>40,00 €</strong></div>
            </div>
            <p class="text-[11px] text-amber-700 italic">
              Vous êtes libre de fixer le montant du devis. Attention : un tarif excessif par rapport au barème sera rejeté par l’organisateur pour dépassement budgétaire !
            </p>
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

          <div class="space-y-4">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Demandes Reçues à Chiffrer (${pendingDevis.length})</h4>

            ${pendingDevis.length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucun devis en attente. Cliquez sur « + Nouvelle Demande » pour en simuler une.</p>' : ''}
            
            ${pendingDevis.map(d => {
              const b = d.bareme;
              const dateStr = this.formatFullDate(d.eventDate);
              const defaultVal = d.proposedPrice || b.totalBareme;

              return `
                <div class="p-5 rounded-2xl glass-card space-y-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-pc-blue text-white">${d.scale}</span>
                        <span class="text-xs font-bold text-slate-500">${d.clientName}</span>
                      </div>
                      <h4 class="text-base font-extrabold text-slate-900 mt-1">${d.eventName}</h4>
                      <p class="text-xs text-slate-500">Prévu le <strong>${dateStr}</strong> • Durée : <strong>${d.durationHours}h</strong> • Affluence : ${d.publicCount}</p>
                    </div>
                    <div class="text-right">
                      <span class="text-[10px] text-slate-400 font-bold uppercase block">Barème Conseillé</span>
                      <span class="text-base font-extrabold mono-num text-slate-800">${b.totalBareme} €</span>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl glass-card-blue text-xs space-y-1 text-slate-600">
                    <div class="flex justify-between">
                      <span>${d.requiredVolunteers} secouristes × ${d.durationHours}h × 18 €/h :</span>
                      <strong class="font-mono text-slate-800">${b.personnelCost} €</strong>
                    </div>
                    ${b.vehicleCost > 0 ? `
                      <div class="flex justify-between">
                        <span>Forfait véhicule (${d.requiredVehicles.join(', ')}) :</span>
                        <strong class="font-mono text-slate-800">${b.vehicleCost} €</strong>
                      </div>
                    ` : ''}
                    <div class="flex justify-between">
                      <span>Lots de premiers secours & DSA :</span>
                      <strong class="font-mono text-slate-800">${b.matCost} €</strong>
                    </div>
                    <div class="flex justify-between">
                      <span>Frais de dossier et convention :</span>
                      <strong class="font-mono text-slate-800">${b.adminCost} €</strong>
                    </div>
                  </div>

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
                          Soumettre le Devis
                        </button>
                      </div>
                    </div>

                    <div id="devis-feedback-${d.id}">
                      <div class="p-2.5 rounded-xl border text-xs flex items-center justify-between glass-card-blue">
                        <div>
                          <span class="font-extrabold block text-pc-blue">Tarif conforme au barème national</span>
                          <span class="text-[11px] text-slate-500">Acceptation très probable (~90%)</span>
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

          <div class="space-y-3">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Candidatures Reçues (${this.candidatures.length})</h4>
            ${this.candidatures.length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucune candidature pour l’instant. Activez une campagne pour attirer des candidats.</p>' : ''}
            <div class="space-y-3">
              ${this.candidatures.map(cand => `
                <div class="p-4 rounded-2xl glass-card space-y-3">
                  <div class="flex items-center gap-2.5">
                    <span class="text-2xl">${cand.avatar}</span>
                    <div>
                      <h5 class="text-sm font-extrabold text-slate-900">${cand.name} (${cand.age} ans)</h5>
                      <p class="text-xs text-slate-500">${cand.job} • Dispo : <strong>${cand.dispoJours.join(', ')}</strong></p>
                    </div>
                  </div>
                  <div class="p-3 rounded-xl glass-card text-xs text-slate-700 italic">
                    « ${cand.motivation} »
                  </div>
                  <div class="flex items-center justify-end gap-2">
                    <button onclick="window.game.rejectCandidature('${cand.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold glass-button text-slate-500">Décliner</button>
                    <button onclick="window.game.acceptCandidature('${cand.id}')" class="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 text-white shadow-md hover:bg-emerald-700 transition">Valider l'Intégration</button>
                  </div>
                </div>
              `).join('')}
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
                <p class="text-[11px] text-indigo-700 mt-1">Cadres 35h formateurs et coordinateurs. Disponibilité quasi-permanente (95%).</p>
              </div>
              <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] font-extrabold text-indigo-900">
                  Actifs : ${this.volunteers.filter(v => v.contractType === 'salarie').length}
                </span>
                <button onclick="window.ProtecPersonnel.hireSalarie(window.game)" class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition">
                  + Embaucher (1 200 €)
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
      title.textContent = 'Pôle Urgence SAMU 15';
      subtitle.textContent = 'Départs réflexes ambulance VPSP sur demande de la régulation';
      icon.setAttribute('data-lucide', 'activity');

      const samuMissions = this.missions.filter(m => m.type === 'samu');
      body.innerHTML = `
        <div class="space-y-4">
          <div class="p-4 rounded-2xl glass-card-orange text-xs text-orange-950">
            <strong>Garde Urgence 15 :</strong> Les alertes SAMU surviennent inopinément et exigent le départ immédiat d’un VPSP avec secouristes qualifiés.
          </div>
          ${samuMissions.length === 0 ? '<p class="text-xs text-slate-500 p-4 glass-card rounded-2xl text-center">Aucun départ réflexe en cours.</p>' : ''}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${samuMissions.map(m => `
              <div class="p-4 rounded-2xl glass-card space-y-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-orange text-white">APPEL 15</span>
                <h4 class="text-sm font-extrabold text-slate-900">${m.title}</h4>
                <p class="text-xs text-slate-600">${m.desc}</p>
                <div class="pt-2 border-t border-slate-100/70 flex justify-end">
                  <button onclick="window.game.closeModal(); window.game.openMissionDetails('${m.id}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pc-orange text-white hover:brightness-110 shadow-sm transition">Gérer</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (moduleKey === 'social') {
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
    } else if (moduleKey === 'formation') {
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
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Vos Antennes Opérationnelles (${this.stations.length})</h4>
            <button onclick="window.game.closeModal(); window.game.startAntennaPlacement()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-pc-orange text-white hover:bg-pc-orange-hover shadow-sm transition">
              + Implanter Antenne (4 500 €)
            </button>
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
    } else if (moduleKey === 'competences') {
      title.textContent = 'Arbre de Compétences & Bureau d’Antenne';
      subtitle.textContent = 'Habilitations individuelles des secouristes et gouvernance associative';
      icon.setAttribute('data-lucide', 'award');
      if (window.ProtecAdvancedModals) {
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
    document.getElementById('main-modal').classList.add('hidden');
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
    ['all', 'dps', 'samu', 'social', 'crise'].forEach(f => {
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

      // 2. Vérification des incidents rares et variés en mission (toutes les 4 secondes)
      if (this.clock.second % 4 === 0 && window.ProtecIncidents) {
        window.ProtecIncidents.checkOngoingMissions(this);
      }

      // 3. Dispatch dynamique d'urgences SAMU 15 (aléatoire régulier)
      if (this.clock.second === 15 || this.clock.second === 45) {
        if (this.stations.length > 0 && Math.random() < 0.15) {
          this.triggerRandomSamuEmergency();
        }
      }

      // 4. Génération périodique de Devis adaptés aux moyens du joueur (toutes les 5 minutes)
      if (this.clock.second === 0 && this.clock.minute % 5 === 0) {
        if (this.stations.length > 0 && Math.random() < 0.50) {
          this.generateRandomDevisOpportunity();
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
        if (cur && cur.status === 'ongoing') {
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
      { title: 'Urgence 15 : Arrêt Cardio-Respiratoire (Départ Réflexe)', desc: 'Témoin signale une victime inconsciente sans respiration au centre commercial.', durMin: 30, reward: 480 }
    ];

    const pick = emergencies[Math.floor(Math.random() * emergencies.length)];
    const offsetLat = (Math.random() - 0.5) * 0.03;
    const offsetLng = (Math.random() - 0.5) * 0.03;

    const reqVol = Math.min(Math.max(2, capacity.availableVolunteers || 3), 4);
    const ranks = ['PSE1', 'PSE2'];
    if (reqVol >= 3 && capacity.ceCount > 0) ranks.unshift('CE');

    const newSamu = {
      id: `m-samu-${Date.now()}`,
      type: 'samu',
      categoryLabel: 'SAMU 15 - Réquisition Urgence Préfectorale',
      title: pick.title,
      desc: pick.desc,
      lat: base.lat + offsetLat,
      lng: base.lng + offsetLng,
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

    this.missions.push(newSamu);
    this.renderMissions();
    this.updateStatsUI();
    this.saveGame();

    if (window.ProtecIncidents) {
      window.ProtecIncidents.sendSystemNotification(
        `🚑 DÉPART RÉFLEXE SAMU 15`,
        `${pick.title} à proximité de ${base.name}. VPSP demandé !`,
        `samu-${newSamu.id}`
      );
    }

    this.showToast('Appel Régulation SAMU 15', `Départ réflexe : ${pick.title} !`, 'orange');
  }

  // Candidature spontanée de bénévole
  generateRandomCandidature() {
    const pool = [
      { n: 'Clémentine Vasseur', a: 24, j: 'Secrétaire médicale', d: ['Samedi', 'Dimanche'], t: 'salarié', av: '👩' },
      { n: 'Maxime Caron', a: 20, j: 'Étudiant en STAPS', d: ['Mercredi', 'Samedi'], t: 'étudiant', av: '🙋‍♂️' },
      { n: 'Aurélie Giraud', a: 28, j: 'Enseignante', d: ['Mercredi', 'Samedi', 'Dimanche'], t: 'salarié', av: '👩‍🏫' },
      { n: 'Julien Mercier', a: 31, j: 'Infirmier DE', d: ['Lundi', 'Jeudi', 'Vendredi'], t: 'salarié', av: '👨‍⚕️' },
      { n: 'Inès Bouzid', a: 22, j: 'Étudiante Droit', d: ['Vendredi', 'Samedi', 'Dimanche'], t: 'étudiant', av: '👩‍🎓' },
      { n: 'Thomas Delattre', a: 35, j: 'Technicien Réseaux', d: ['Samedi', 'Dimanche'], t: 'salarié', av: '👨‍💼' }
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
      avatar: p.av
    });
    this.showToast('Nouvelle Candidature', `${p.n} (${p.j}) souhaite intégrer votre antenne.`, 'blue');
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

    const bDev = document.getElementById('badge-devis-dock');
    if (bDev) bDev.textContent = devisCount;

    const bCand = document.getElementById('badge-recrutement-dock');
    if (bCand) bCand.textContent = candCount;

    const bAll = document.getElementById('badge-alliance-dock');
    if (bAll) bAll.textContent = renfCount || this.allianceStations.length;

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
      social: this.missions.filter(m => m.type === 'social').length,
      crise: this.missions.filter(m => m.type === 'crise').length
    };

    ['all', 'dps', 'samu', 'social', 'crise'].forEach(c => {
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
