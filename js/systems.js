/**
 * PROTEC LIVE - MODULE DES 6 SYSTÈMES OPÉRATIONNELS MAJEURS
 * 1. Trajets en temps réel des véhicules & Déplacements sur route (OSRM + Gyrophare)
 * 2. Main courante radio & Codes statuts (1 à 6) & Fiche bilan secouriste SAMU 15
 * 3. Logistique & Pharmacie (O2, DAE, Pansements, Carburant, Désinfection, Révision)
 * 4. Météo dynamique & Alertes préfectorales (Jour/Nuit, Vigilances Canicule/Inondation)
 * 5. Vie associative, Fatigue & Fidélisation (Énergie, Moral, Cohésion, Recyclage FC PSE)
 * 6. Dossiers de Subventions & Financement participatif (Subvention municipale, Dons, Mécénat)
 */

window.ProtecSystems = {
  // Liste des Centres Hospitaliers Universitaires par métropole
  hospitals: {
    paris: [
      { name: 'AP-HP Urgences Pitié-Salpêtrière', lat: 48.8385, lng: 2.3650 },
      { name: 'AP-HP Urgences Lariboisière', lat: 48.8827, lng: 2.3533 },
      { name: 'AP-HP Urgences Georges-Pompidou', lat: 48.8388, lng: 2.2736 }
    ],
    lyon: [
      { name: 'HCL Urgences Édouard Herriot', lat: 45.7438, lng: 4.8821 },
      { name: 'HCL Urgences Lyon Sud', lat: 45.7001, lng: 4.8192 }
    ],
    marseille: [
      { name: 'AP-HM Urgences Timone Adultes', lat: 43.2894, lng: 5.4011 },
      { name: 'AP-HM Urgences Hôpital Nord', lat: 43.3712, lng: 5.3619 }
    ],
    bordeaux: [
      { name: 'CHU Urgences Pellegrin', lat: 44.8299, lng: -0.6053 },
      { name: 'CHU Hôpital Saint-André', lat: 44.8344, lng: -0.5815 }
    ],
    lille: [
      { name: 'CHU Urgences Roger Salengro', lat: 50.6095, lng: 3.0338 },
      { name: 'GHICL Hôpital Saint-Vincent', lat: 50.6276, lng: 3.0722 }
    ]
  },

  // 1. Initialisation de l'état étendu dans le jeu
  injectState(game) {
    if (!game.transits) game.transits = [];
    if (!game.radioLogs) game.radioLogs = [];
    if (!game.logistics) {
      game.logistics = {
        oxygenBottles: 0,
        aedPads: 0,
        woundKits: 0,
        cervicalCollars: 0
      };
    }
    if (!game.weather) {
      game.weather = {
        condition: 'sun',
        temp: 18,
        realTemp: 18,
        windSpeed: 10,
        windGusts: 20,
        precipitation: 0,
        humidity: 65,
        weatherCode: 0,
        vigilance: 'green', // 'green', 'yellow', 'orange', 'red'
        alertTitle: 'Vigilance Verte - Conditions Nominales',
        alertDesc: 'Aucune vigilance météorologique particulière sur le département. Opérations régulières.',
        alertPhenomenon: 'nominal',
        lastUpdateDay: 5,
        lastFetchTimestamp: 0,
        locationName: 'France'
      };
    }
    if (!game.grants) {
      game.grants = {
        totalVolunteerHours: 0,
        municipalDossierSubmitted: false,
        lastGrantAwarded: 0,
        publicDonationsActive: false
      };
    } else if (!game.stations || game.stations.length === 0 || ((game.missions || []).filter(m => m.status === 'completed').length === 0 && (game.volunteers || []).length === 0)) {
      if (game.grants.totalVolunteerHours === 42 || game.grants.totalVolunteerHours === 47 || game.grants.totalVolunteerHours === 40) {
        game.grants.totalVolunteerHours = 0;
      }
    }
  },

  // --- AUDIO TALKIE-WALKIE (Web Audio API sans fichier externe) ---
  playRadioChirp() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._protecAudioCtx) window._protecAudioCtx = new AudioCtx();
      if (window._protecAudioCtx.state === 'suspended') window._protecAudioCtx.resume();
      
      const ctx = window._protecAudioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.05);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Ignorer si audio non débloqué
    }
  },

  // --- 2. TRAJET EN TEMPS RÉEL SUR ROUTE & GYROPHARES ---
  async fetchRouteCoordinates(origin, dest) {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0] && data.routes[0].geometry.coordinates) {
          return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        }
      }
    } catch (e) {
      // Fallback
    }

    // Fallback : interpolation réaliste avec légère courbure
    const points = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = origin.lat + (dest.lat - origin.lat) * t + Math.sin(t * Math.PI) * 0.002;
      const lng = origin.lng + (dest.lng - origin.lng) * t - Math.sin(t * Math.PI) * 0.0015;
      points.push([lat, lng]);
    }
    return points;
  },

  async startTransit(game, vehicle, originCoords, destCoords, mission, statusTarget, onArrivalCallback) {
    const routeCoords = await this.fetchRouteCoordinates(originCoords, destCoords);
    const transitId = `transit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Détection d'un départ d'urgence (SAMU, transport CH, pompiers, crise CUMP/NOVI, préfecture)
    const isEmergency = (
      statusTarget === 4 ||
      mission?.type === 'samu' ||
      mission?.type === 'pompiers' ||
      mission?.type === 'crise' ||
      mission?.isCumpCai === true ||
      ['critique', 'haute'].includes(mission?.urgency)
    );

    // Polyline Leaflet sur la route
    const polyline = L.polyline(routeCoords, {
      color: isEmergency ? (statusTarget === 4 ? '#ef4444' : '#f97316') : '#0284c7',
      weight: isEmergency ? 5 : 3.5,
      opacity: isEmergency ? 0.85 : 0.65,
      dashArray: isEmergency ? null : '6, 6',
      className: isEmergency ? 'route-line-animated' : 'route-line-normal'
    }).addTo(game.map);

    // Marqueur du véhicule : gyrophare clignotant UNIQUEMENT en urgence, puce discrète en allure normale
    const imgUrl = vehicle.image || (game.getVehicleImage ? game.getVehicleImage(vehicle.type) : `images/vehicles/${vehicle.type}.png`);
    const iconHtml = `
      <div class="vehicle-marker-container flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/95 border-2 ${isEmergency ? (statusTarget === 4 ? 'border-red-500 ring-2 ring-red-400/50' : 'border-pc-orange ring-1 ring-orange-400/40') : 'border-slate-300 shadow-md'} shadow-xl text-slate-800 text-[10px] font-black cursor-pointer">
        ${isEmergency ? '<div class="beacon-flash"></div>' : '<div class="w-2 h-2 rounded-full bg-slate-400"></div>'}
        <img src="${imgUrl}" alt="${vehicle.name}" class="h-4 w-7 object-contain flex-shrink-0 drop-shadow-sm" onerror="this.outerHTML='<span class=\"text-xs font-bold text-pc-blue\">VPSP</span>'" />
        <span class="tracking-tight">${vehicle.name}</span>
        ${isEmergency ? '<span class="text-[8px] px-1 py-0.2 rounded font-extrabold bg-red-100 text-red-700 uppercase">Urgence</span>' : ''}
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: 'vehicle-leaflet-icon',
      iconSize: [126, 32],
      iconAnchor: [63, 16]
    });

    const marker = L.marker(routeCoords[0], { icon: icon, zIndexOffset: isEmergency ? 1200 : 800 }).addTo(game.map);

    // Calcul de la distance réelle en kilomètres
    const distKm = Math.max(0.8, Math.hypot(
      (destCoords.lat - originCoords.lat) * 111,
      (destCoords.lng - originCoords.lng) * 111 * Math.cos(originCoords.lat * Math.PI / 180)
    ));

    // Vitesse adaptée :
    // - Allure normale (DPS, maraude, retour antenne statut 6) : 45 km/h sans gyrophare
    // - Départ urgence (SAMU, transport CH, NOVI, pompiers) : +50% plus rapide (~70-75 km/h avec gyrophare)
    const realisticSpeedKmh = isEmergency ? (statusTarget === 4 ? 74 : 68) : 45;
    const baseDurationSec = Math.max(20, Math.min(180, Math.round((distKm / realisticSpeedKmh) * 3600 * 0.35)));
    const durationMs = (baseDurationSec * 1000) / Math.max(1, game.speed || 1);
    const now = Date.now();

    const modeLabel = isEmergency ? (statusTarget === 4 ? 'Statut 4 : Évacuation CHU (Urgence)' : 'Statut 2 : Départ Urgence (Gyrophare)') : (statusTarget === 6 ? 'Statut 6 : Retour Antenne (Normal)' : 'Statut 2 : Déplacement Normal');

    marker.bindTooltip(`<strong>${vehicle.name}</strong><br>Vitesse : ~${realisticSpeedKmh} km/h • Distance : ${distKm.toFixed(1)} km<br>${modeLabel}`, {
      direction: 'top',
      offset: [0, -18],
      className: 'glass-panel text-xs p-2'
    });

    const transit = {
      id: transitId,
      vehicleId: vehicle.id,
      vehicle: vehicle,
      mission: mission,
      statusTarget: statusTarget,
      isEmergency: isEmergency,
      routeCoords: routeCoords,
      distKm: distKm,
      speedKmh: realisticSpeedKmh,
      startTime: now,
      durationMs: durationMs,
      currentStep: 0,
      polyline: polyline,
      marker: marker,
      onArrival: onArrivalCallback
    };

    game.transits.push(transit);

    // Bip radio et message de départ
    this.playRadioChirp();
    const statusLabel = isEmergency ? (statusTarget === 4 ? 'STATUT 4 : Transport CHU' : 'STATUT 2 : Départ Urgent') : (statusTarget === 6 ? 'STATUT 6 : Retour Antenne' : 'STATUT 2 : En route');
    this.addRadioLog(game, vehicle.name, statusTarget, `${statusLabel} vers ${mission ? mission.title : 'Destination'} (${distKm.toFixed(1)} km).`);
    game.showToast(statusLabel, `${vehicle.name} est en route vers les lieux (~${distKm.toFixed(1)} km).`, isEmergency ? 'orange' : 'blue');
  },

  updateTransits(game) {
    if (!game.transits || game.transits.length === 0) return;

    const now = Date.now();

    for (let i = game.transits.length - 1; i >= 0; i--) {
      const t = game.transits[i];
      const elapsed = Math.max(0, now - (t.startTime || now));
      const progress = Math.min(1, elapsed / (t.durationMs || 30000));
      const stepIndex = Math.floor(progress * (t.routeCoords.length - 1));
      t.currentStep = stepIndex;

      if (progress < 1) {
        const nextPos = t.routeCoords[stepIndex] || t.routeCoords[0];
        if (t.marker && nextPos) {
          t.marker.setLatLng(nextPos);
          const remainingKm = (t.distKm * (1 - progress)).toFixed(1);
          const remainingSec = Math.max(1, Math.round((t.durationMs - elapsed) / 1000));
          t.marker.setTooltipContent(`
            <div class="text-xs space-y-0.5">
              <strong class="text-pc-blue block">${t.vehicle.name}</strong>
              <div class="text-[10px] text-slate-600">Vitesse : <span class="font-bold text-red-600">${t.speedKmh} km/h</span> • Reste : <strong>${remainingKm} km</strong> (~${remainingSec}s)</div>
              <div class="text-[9px] font-bold text-slate-500">${t.statusTarget === 4 ? '🚨 Transport Sanitaire vers Urgences CHU' : '🚑 Transit d\'Urgence vers l\'Intervention'}</div>
            </div>
          `);
        }
      } else {
        // Arrivée à destination
        if (t.marker && t.routeCoords.length > 0) {
          t.marker.setLatLng(t.routeCoords[t.routeCoords.length - 1]);
        }
        if (t.polyline && game.map) game.map.removeLayer(t.polyline);
        if (t.marker && game.map) game.map.removeLayer(t.marker);
        game.transits.splice(i, 1);

        this.playRadioChirp();
        if (t.statusTarget === 2) {
          if (t.vehicle) t.vehicle.status = 'sur_les_lieux';
          this.addRadioLog(game, t.vehicle.name, 3, `STATUT 3 : Sur les lieux. Dispositif en place pour « ${t.mission?.title} ».`);
          game.showToast('Arrivée sur les lieux', `${t.vehicle.name} est au contact. Statut 3 activé.`, 'green');
        } else if (t.statusTarget === 4) {
          if (t.vehicle) t.vehicle.status = 'urgences_chu';
          this.addRadioLog(game, t.vehicle.name, 5, `STATUT 5 : Arrivée aux Urgences Hospitalières de secteur. Prise en charge médicale.`);
          game.showToast('Arrivée Urgences CHU', `${t.vehicle.name} est arrivé aux Urgences hospitalières. Relève effectuée.`, 'green');
        } else if (t.statusTarget === 6) {
          if (t.vehicle) {
            t.vehicle.status = 'dispo';
            t.vehicle.needsRearming = false;
            t.vehicle.a_rearme = false;
          }
          this.addRadioLog(game, t.vehicle.name, 1, `STATUT 1 : De retour à l’antenne. Véhicule disponible.`);
          game.showToast('Retour Antenne', `${t.vehicle.name} a regagné sa base. Véhicule disponible.`, 'blue');
        }

        if (typeof t.onArrival === 'function') {
          t.onArrival();
        }

        if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
        if (typeof game.refreshCurrentModalIfSafe === 'function') game.refreshCurrentModalIfSafe();
      }
    }

    // Mise à jour continue des missions gérées par la timeline multi-étapes
    this.updateTimelineMissions(game);
  },

  // =========================================================================
  // MOTEUR D'INTERPOLATION DE POSITION DYNAMIQUE ET TIMELINE MULTI-ÉTAPES
  // =========================================================================

  calculerPositionActuelle(mission, tempsActuel = null) {
    if (!mission) return null;

    const t = (tempsActuel instanceof Date) ? tempsActuel.getTime() :
              (typeof tempsActuel === 'string' && isNaN(Number(tempsActuel))) ? new Date(tempsActuel).getTime() :
              (tempsActuel !== null && tempsActuel !== undefined ? Number(tempsActuel) : Date.now());

    // Récupération des jalons de la mission
    const toMs = (v) => (typeof v === 'number' ? v : (v ? new Date(v).getTime() : 0));
    let tAlerte = toMs(mission.timeline_milestones?.t_alerte || mission.t_alerte || mission.startedAt);
    let tArrBase = toMs(mission.timeline_milestones?.t_arrivee_base || mission.t_arrivee_base);
    let tDepBase = toMs(mission.timeline_milestones?.t_depart_base || mission.t_depart_base);
    let tArrMiss = toMs(mission.timeline_milestones?.t_arrivee_mission || mission.t_arrivee_mission);
    let tFinMiss = toMs(mission.timeline_milestones?.t_fin_mission || mission.t_fin_mission);
    let tRetBase = toMs(mission.timeline_milestones?.t_retour_base || mission.t_retour_base || mission.endsAt);

    // Initialisation automatique par défaut si les jalons ne sont pas encore calculés
    if (!tArrBase || !tArrMiss) {
      if (!tAlerte) tAlerte = t;
      tArrBase = tAlerte + 8 * 60 * 1000;
      tDepBase = tArrBase + 2 * 60 * 1000;
      tArrMiss = tDepBase + 10 * 60 * 1000;
      tFinMiss = tArrMiss + 20 * 60 * 1000;
      tRetBase = tFinMiss + 12 * 60 * 1000;
    }

    const baseLat = Number(mission.coords_base?.lat || window.game?.stations?.[0]?.lat || 48.8566);
    const baseLng = Number(mission.coords_base?.lng || window.game?.stations?.[0]?.lng || 2.3522);
    const pBase = { lat: baseLat, lng: baseLng };

    const pDom = (mission.coords_domicile_max && !isNaN(mission.coords_domicile_max.lat)) ? {
      lat: Number(mission.coords_domicile_max.lat),
      lng: Number(mission.coords_domicile_max.lng)
    } : {
      lat: baseLat + 0.025,
      lng: baseLng + 0.02
    };

    const pMiss = (mission.coords_mission && !isNaN(mission.coords_mission.lat)) ? {
      lat: Number(mission.coords_mission.lat),
      lng: Number(mission.coords_mission.lng)
    } : {
      lat: Number(mission.lat || baseLat),
      lng: Number(mission.lng || baseLng)
    };

    let phase = 1;
    let phaseCode = 'ralliement_domicile';
    let status = "Ralliement domicile -> base (Secouriste en transit)";
    let ratio = 0;
    let lat = pDom.lat;
    let lng = pDom.lng;
    let iconType = 'volunteer';
    let isCompleted = false;

    // Helper interpolation linéaire
    const lerp = (start, end, p) => start + (end - start) * p;

    if (t < tArrBase) {
      // -------------------------------------------------------------
      // Phase 1 : Ralliement domicile -> base (entre t_alerte et t_arrivee_base)
      // Interpoler la position entre coords_domicile_max et coords_base.
      // Icône de bénévole en transit.
      // -------------------------------------------------------------
      phase = 1;
      phaseCode = 'ralliement_domicile';
      status = "Ralliement domicile -> base (Secouriste en transit)";
      iconType = 'volunteer';
      const dur = Math.max(1000, tArrBase - tAlerte);
      ratio = Math.max(0, Math.min(1, (t - tAlerte) / dur));
      lat = lerp(pDom.lat, pBase.lat, ratio);
      lng = lerp(pDom.lng, pBase.lng, ratio);

    } else if (t < tDepBase) {
      // -------------------------------------------------------------
      // Phase 2 : Armement à la base (entre t_arrivee_base et t_depart_base)
      // Position figée sur coords_base.
      // Statut : « En cours d'armement / équipement ».
      // -------------------------------------------------------------
      phase = 2;
      phaseCode = 'armement_base';
      status = "En cours d'armement / équipement";
      iconType = 'base';
      const dur = Math.max(1000, tDepBase - tArrBase);
      ratio = Math.max(0, Math.min(1, (t - tArrBase) / dur));
      lat = pBase.lat;
      lng = pBase.lng;

    } else if (t < tArrMiss) {
      // -------------------------------------------------------------
      // Phase 3 : Trajet aller du vecteur (entre t_depart_base et t_arrivee_mission)
      // Interpoler la position entre coords_base et coords_mission.
      // Icône du véhicule en transit vers les lieux (Gyrophare).
      // -------------------------------------------------------------
      phase = 3;
      phaseCode = 'trajet_aller';
      status = "Départ urgent vers les lieux (Gyrophare)";
      iconType = 'vehicle_emergency';
      const dur = Math.max(1000, tArrMiss - tDepBase);
      ratio = Math.max(0, Math.min(1, (t - tDepBase) / dur));
      lat = lerp(pBase.lat, pMiss.lat, ratio);
      lng = lerp(pBase.lng, pMiss.lng, ratio);

    } else if (t < tFinMiss) {
      // -------------------------------------------------------------
      // Phase 4 : Intervention sur place (entre t_arrivee_mission et t_fin_mission)
      // Position figée sur coords_mission.
      // Statut : « Sur les lieux / En intervention ».
      // -------------------------------------------------------------
      phase = 4;
      phaseCode = 'intervention_sur_place';
      status = "Sur les lieux / En intervention";
      iconType = 'intervention';
      const dur = Math.max(1000, tFinMiss - tArrMiss);
      ratio = Math.max(0, Math.min(1, (t - tArrMiss) / dur));
      lat = pMiss.lat;
      lng = pMiss.lng;

    } else if (t < tRetBase) {
      // -------------------------------------------------------------
      // Phase 5 : Trajet retour du vecteur (entre t_fin_mission et t_retour_base)
      // Interpoler la position entre coords_mission et coords_base.
      // Icône du véhicule retournant au centre (Statut 6).
      // -------------------------------------------------------------
      phase = 5;
      phaseCode = 'trajet_retour';
      status = "Retour vers la base (Statut 6)";
      iconType = 'vehicle_return';
      const dur = Math.max(1000, tRetBase - tFinMiss);
      ratio = Math.max(0, Math.min(1, (t - tFinMiss) / dur));
      lat = lerp(pMiss.lat, pBase.lat, ratio);
      lng = lerp(pMiss.lng, pBase.lng, ratio);

    } else {
      // -------------------------------------------------------------
      // Phase 6 : Clôture (tempsActuel >= t_retour_base)
      // Passer la mission en termine, libérer le personnel et le véhicule,
      // créditer la trésorerie.
      // -------------------------------------------------------------
      phase = 6;
      phaseCode = 'termine';
      status = "Mission terminée / Clôturée";
      iconType = 'completed';
      ratio = 1;
      lat = pBase.lat;
      lng = pBase.lng;
      isCompleted = true;

      // Clôture automatique si la mission est toujours en cours
      if (mission.status === 'ongoing' || mission.status === 'en_cours') {
        this.cloturerMissionUrgence(mission, window.game);
      }
    }

    mission.timeline_phase = phase;

    // Calcul de la progression globale (0 à 1)
    const totalDuration = Math.max(1000, tRetBase - tAlerte);
    const totalElapsed = Math.max(0, Math.min(totalDuration, t - tAlerte));
    const totalProgress = Math.min(1, totalElapsed / totalDuration);

    // Construction HTML de l'icône Leaflet
    const vehName = mission.assignedCrew?.vehicles?.[0]?.name || 'VPSP';
    const volName = mission.slowest_volunteer?.name || 'Secouriste';

    let iconHtml = '';
    if (phase === 1) {
      iconHtml = `
        <div class="timeline-marker flex items-center gap-1.5 px-2 py-1 rounded-xl bg-blue-600 text-white border-2 border-white shadow-xl text-[10px] font-black cursor-pointer animate-pulse">
          <span class="text-sm">🏃</span>
          <span>${volName}</span>
          <span class="text-[8px] bg-blue-800 px-1 py-0.5 rounded">➔ Base</span>
        </div>
      `;
    } else if (phase === 2) {
      iconHtml = `
        <div class="timeline-marker flex items-center gap-1.5 px-2 py-1 rounded-xl bg-amber-500 text-slate-900 border-2 border-white shadow-xl text-[10px] font-black cursor-pointer">
          <span class="text-xs animate-spin">⚙️</span>
          <span>Armement ${vehName}</span>
        </div>
      `;
    } else if (phase === 3) {
      iconHtml = `
        <div class="timeline-marker flex items-center gap-1.5 px-2 py-1 rounded-xl bg-red-600 text-white border-2 border-red-300 ring-2 ring-red-400/50 shadow-xl text-[10px] font-black cursor-pointer">
          <div class="beacon-flash"></div>
          <span>🚨 ${vehName}</span>
          <span class="text-[8px] bg-red-900 px-1 py-0.5 rounded font-bold uppercase">Urgence</span>
        </div>
      `;
    } else if (phase === 4) {
      iconHtml = `
        <div class="timeline-marker flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-600 text-white border-2 border-white shadow-xl text-[10px] font-black cursor-pointer">
          <span class="text-xs">🏥</span>
          <span>${vehName} sur place</span>
        </div>
      `;
    } else if (phase === 5) {
      iconHtml = `
        <div class="timeline-marker flex items-center gap-1.5 px-2 py-1 rounded-xl bg-sky-700 text-white border-2 border-sky-300 shadow-xl text-[10px] font-black cursor-pointer">
          <span class="text-xs">🚑</span>
          <span>${vehName} (Statut 6)</span>
          <span class="text-[8px] bg-sky-900 px-1 py-0.5 rounded">Retour</span>
        </div>
      `;
    } else {
      iconHtml = `
        <div class="timeline-marker flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-700 text-white border-2 border-white shadow-xl text-[10px] font-black">
          <span class="text-xs">🏁</span>
          <span>Disponible</span>
        </div>
      `;
    }

    return {
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      phase,
      phaseCode,
      status,
      ratio: Math.round(ratio * 1000) / 1000,
      progressPercent: Math.round(ratio * 100),
      totalProgress: Math.round(totalProgress * 1000) / 1000,
      milestones: { tAlerte, tArrBase, tDepBase, tArrMiss, tFinMiss, tRetBase },
      coords: { pDom, pBase, pMiss },
      iconType,
      iconHtml,
      isCompleted
    };
  },

  // Clôture d'une mission d'urgence en fin de timeline (Phase 6)
  cloturerMissionUrgence(mission, game = null) {
    const g = game || window.game;
    if (!mission || mission.status === 'completed' || mission.status === 'termine') return;

    mission.status = 'completed';
    mission.resolved_at = new Date().toISOString();
    mission.progress = mission.durationSeconds || 1800;

    // Libération du personnel
    const vols = mission.assignedCrew?.volunteers || mission.registeredVolunteers || [];
    vols.forEach(v => {
      const vid = typeof v === 'object' ? v.id : v;
      const vol = g?.volunteers?.find(x => x.id === vid);
      if (vol) {
        vol.status = 'dispo';
      }
    });

    // Libération des véhicules
    const vehs = mission.assignedCrew?.vehicles || [];
    vehs.forEach(v => {
      const vid = typeof v === 'object' ? v.id : v;
      const veh = g?.vehicles?.find(x => x.id === vid);
      if (veh) {
        veh.status = 'dispo';
        veh.fuel = Math.max(15, (veh.fuel || 90) - 8);
      }
    });

    // Crédit de la trésorerie et récompense
    const reward = Number(mission.rewardMoney || mission.reward || 350);
    if (g && g.resources) {
      g.resources.money = (g.resources.money || 0) + reward;
      g.resources.reputation = Math.min(100, (g.resources.reputation || 50) + 3);
      g.saveGame?.();
      g.updateStatsUI?.();
      g.renderMissions?.();
      g.renderStations?.();
      g.showToast?.('Mission Terminée 🏁', `Dispositif « ${mission.title} » clôturé avec succès après retour base. +${reward} € perçus !`, 'green');
    }

    // Retrait du marqueur Leaflet
    if (mission._timelineMarker && g?.map) {
      g.map.removeLayer(mission._timelineMarker);
      delete mission._timelineMarker;
    }

    // Main courante radio de fin
    const firstVeh = vehs[0] ? (typeof vehs[0] === 'object' ? vehs[0].name : 'VPSP') : 'VPSP';
    this.addRadioLog(g, firstVeh, 1, `STATUT 1 : Mission « ${mission.title} » clôturée. Véhicule et équipage réarmés et disponibles.`);

    // Synchronisation serveur Supabase
    if (window.ProtecSupabase && g?.player?.id) {
      window.ProtecSupabase.resolveMissionOnServer?.(mission.id, g.player.id, reward);
    }
  },

  // Mise à jour continue des marqueurs Leaflet sur la carte pour toutes les missions en timeline
  updateTimelineMissions(game) {
    if (!game || !game.missions || !game.map || !window.L) return;
    const now = Date.now();

    const timelineMissions = game.missions.filter(m => m.status === 'ongoing' && (m.isTimelineUrgence || m.timeline_milestones || m.t_alerte));
    timelineMissions.forEach(m => {
      const pos = this.calculerPositionActuelle(m, now);
      if (!pos) return;

      if (pos.isCompleted) {
        if (m._timelineMarker && game.map) {
          game.map.removeLayer(m._timelineMarker);
          delete m._timelineMarker;
        }
        return;
      }

      // Création ou mise à jour du marqueur Leaflet
      if (!m._timelineMarker) {
        const icon = L.divIcon({
          className: 'timeline-leaflet-icon',
          html: pos.iconHtml,
          iconSize: [140, 32],
          iconAnchor: [70, 16]
        });

        const marker = L.marker([pos.lat, pos.lng], { icon, zIndexOffset: 1500 }).addTo(game.map);
        marker.on('click', () => {
          if (game.openMissionDetails) game.openMissionDetails(m.id);
        });
        marker.bindTooltip(`
          <div class="text-xs space-y-1">
            <strong class="text-pc-blue block">${m.title}</strong>
            <div class="text-[10px] text-slate-700 font-bold">${pos.status}</div>
            <div class="text-[9px] text-slate-500">Étape ${pos.phase}/6 • Progression : ${pos.progressPercent}%</div>
          </div>
        `, { direction: 'top', offset: [0, -18], className: 'glass-panel text-xs p-2' });

        m._timelineMarker = marker;
      } else {
        m._timelineMarker.setLatLng([pos.lat, pos.lng]);
        const iconEl = m._timelineMarker.getElement();
        if (iconEl) {
          iconEl.innerHTML = pos.iconHtml;
        }
        m._timelineMarker.setTooltipContent(`
          <div class="text-xs space-y-1">
            <strong class="text-pc-blue block">${m.title}</strong>
            <div class="text-[10px] text-slate-700 font-bold">${pos.status}</div>
            <div class="text-[9px] text-slate-500">Étape ${pos.phase}/6 • Étape : ${pos.progressPercent}% • Total : ${Math.round(pos.totalProgress * 100)}%</div>
          </div>
        `);
      }
    });
  },

  // Récupération dynamique et détection des Hôpitaux de secteur
  getNearestHospital(game, lat, lng) {
    // 1. Si des hôpitaux de secteur ont été récupérés en arrière-plan (OSM Overpass)
    if (game.sectorHospitals && game.sectorHospitals.length > 0) {
      let nearest = game.sectorHospitals[0];
      let minDist = 9999;
      game.sectorHospitals.forEach(h => {
        const d = Math.hypot(h.lat - lat, h.lng - lng);
        if (d < minDist) {
          minDist = d;
          nearest = h;
        }
      });
      return nearest;
    }

    // 2. Base départementale de référence complète (Couverture nationale des CHU & CH)
    const nationalHospitals = [
      // 54 Meurthe-et-Moselle (Nancy)
      { name: 'CHRU de Nancy - Hôpital Central (Urgences & Déchocage)', lat: 48.6882, lng: 6.1895, dept: '54' },
      { name: 'CHRU de Nancy - Hôpital de Brabois (Pôle Spécialités)', lat: 48.6491, lng: 6.1482, dept: '54' },
      { name: 'Centre Hospitalier de Saint-Charles (Toul)', lat: 48.6744, lng: 5.8856, dept: '54' },
      // 75 Paris & IDF
      { name: 'AP-HP Urgences Pitié-Salpêtrière (Trauma Center)', lat: 48.8385, lng: 2.3650, dept: '75' },
      { name: 'AP-HP Urgences Lariboisière', lat: 48.8827, lng: 2.3533, dept: '75' },
      { name: 'AP-HP Urgences Georges-Pompidou (HEGP)', lat: 48.8388, lng: 2.2736, dept: '75' },
      { name: 'AP-HP Urgences Henri-Mondor (Créteil)', lat: 48.7963, lng: 2.4512, dept: '94' },
      { name: 'AP-HP Urgences Avicenne (Bobigny)', lat: 48.9142, lng: 2.4243, dept: '93' },
      // 69 Rhône (Lyon)
      { name: 'HCL Urgences Édouard Herriot (Pavillon H)', lat: 45.7438, lng: 4.8821, dept: '69' },
      { name: 'HCL Urgences Centre Hospitalier Lyon Sud', lat: 45.7001, lng: 4.8192, dept: '69' },
      { name: 'HCL Hôpital de la Croix-Rousse', lat: 45.7797, lng: 4.8322, dept: '69' },
      // 13 Bouches-du-Rhône (Marseille)
      { name: 'AP-HM Urgences Hôpital de La Timone', lat: 43.2894, lng: 5.4011, dept: '13' },
      { name: 'AP-HM Urgences Hôpital Nord (Marseille)', lat: 43.3712, lng: 5.3619, dept: '13' },
      // 33 Gironde (Bordeaux)
      { name: 'CHU de Bordeaux - Urgences Pellegrin (Tripode)', lat: 44.8299, lng: -0.6053, dept: '33' },
      { name: 'CHU Hôpital Saint-André', lat: 44.8344, lng: -0.5815, dept: '33' },
      // 59 Nord (Lille)
      { name: 'CHU de Lille - Urgences Roger Salengro', lat: 50.6095, lng: 3.0338, dept: '59' },
      { name: 'Centre Hospitalier de Tourcoing', lat: 50.7239, lng: 3.1611, dept: '59' },
      // 67 Bas-Rhin (Strasbourg)
      { name: 'Hôpitaux Universitaires de Strasbourg - Hautepierre', lat: 48.5912, lng: 7.7051, dept: '67' },
      { name: 'Nouvel Hôpital Civil de Strasbourg', lat: 48.5771, lng: 7.7408, dept: '67' },
      // 31 Haute-Garonne (Toulouse)
      { name: 'CHU de Toulouse - Hôpital Purpan (Urgences)', lat: 43.6112, lng: 1.4005, dept: '31' },
      { name: 'CHU de Toulouse - Hôpital Rangueil', lat: 43.5583, lng: 1.4642, dept: '31' },
      // 44 Loire-Atlantique (Nantes)
      { name: 'CHU de Nantes - Hôtel-Dieu (Urgences Adultes)', lat: 47.2120, lng: -1.5528, dept: '44' },
      // 35 Ille-et-Vilaine (Rennes)
      { name: 'CHU de Rennes - Hôpital Pontchaillou', lat: 48.1189, lng: -1.6961, dept: '35' },
      // 06 Alpes-Maritimes (Nice)
      { name: 'CHU de Nice - Hôpital Pasteur 2', lat: 43.7258, lng: 7.2831, dept: '06' },
      // 34 Hérault (Montpellier)
      { name: 'CHU de Montpellier - Hôpital Lapeyronie', lat: 43.6331, lng: 3.8642, dept: '34' }
    ];

    let nearest = nationalHospitals[0];
    let minDist = 9999;
    nationalHospitals.forEach(h => {
      const d = Math.hypot(h.lat - lat, h.lng - lng);
      if (d < minDist) {
        minDist = d;
        nearest = h;
      }
    });

    // Si on est à plus de 45 km d'un hôpital de la liste (département rural)
    if (minDist * 111 > 45) {
      const station = game.stations?.[0];
      const cityName = station?.city || 'Secteur';
      return {
        name: `Centre Hospitalier de ${cityName} (Urgences de Secteur)`,
        lat: lat + 0.015,
        lng: lng + 0.012
      };
    }

    return nearest;
  },

  // Requête en arrière-plan pour scanner les hôpitaux de secteur réels autour de l'antenne
  async fetchSectorHospitalsBackground(game) {
    const station = game.stations?.[0];
    if (!station || !station.lat) return;

    if (!game.sectorHospitals) game.sectorHospitals = [];
    if (game.sectorHospitals.length > 0) return; // Déjà chargés

    try {
      const cLat = station.lat;
      const cLng = station.lng;
      const query = `[out:json][timeout:4];node["amenity"="hospital"](around:25000,${cLat},${cLng});out body 6;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.elements && data.elements.length > 0) {
          game.sectorHospitals = data.elements.map(el => ({
            name: el.tags?.name || `Centre Hospitalier de Secteur (${el.tags?.operator || 'Urgences'})`,
            lat: el.lat,
            lng: el.lon,
            osmId: el.id
          }));
          console.log(`🏥 [Hôpitaux] ${game.sectorHospitals.length} hôpitaux de secteur réels détectés autour de ${station.name}.`);
        }
      }
    } catch (e) {
      // Mode hors-ligne ou timeout : repli automatique vers la base nationale intégrée
    }
  },

  // --- 3. MAIN COURANTE RADIO & STATUTS ---
  addRadioLog(game, indicatif, statusNum, message) {
    if (!game) return;
    const now = new Date();
    const hh = String(game.clock?.hour ?? now.getHours()).padStart(2, '0');
    const mm = String(game.clock?.minute ?? now.getMinutes()).padStart(2, '0');
    const item = {
      id: `rad-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      time: `${hh}:${mm}`,
      indicatif: indicatif,
      status: statusNum,
      message: message
    };
    if (!game.radioLogs) game.radioLogs = [];
    game.radioLogs.unshift(item);
    if (game.radioLogs.length > 50) game.radioLogs.pop();

    const badge = typeof document !== 'undefined' ? document.getElementById('badge-radio-dock') : null;
    if (badge) badge.textContent = game.radioLogs.length;

    // DIFFUSION RÉELLE VERS LA MAIN COURANTE GLOBALE ET LA PAGE D'ACCUEIL
    if (window.ProtecSupabase && typeof window.ProtecSupabase.logOperationalEvent === 'function') {
      const currentStation = (game.stations && game.stations[0]) || {};
      window.ProtecSupabase.logOperationalEvent({
        playerId: window.ProtecAuth?.currentUser?.id || null,
        stationName: currentStation.name || game.player?.stationName || 'Antenne Locale',
        city: currentStation.city || game.player?.city || '',
        departmentCode: currentStation.departmentCode || game.player?.departmentCode || '',
        type: (statusNum === 3) ? 'samu' : ((statusNum === 1) ? 'logistique' : 'radio'),
        indicatif: indicatif,
        statusCode: statusNum,
        message: message,
        severity: (statusNum === 3) ? 'urgent' : (statusNum === 5 ? 'success' : 'info')
      });
    }
  },

  // --- 4. GESTION DES CONSOMMABLES ET VÉHICULES ---
  consumeSupply(game, supplyType, count = 1) {
    if (game.logistics[supplyType] !== undefined) {
      game.logistics[supplyType] = Math.max(0, game.logistics[supplyType] - count);
      this.checkLogisticsAlerts(game);
    }
  },

  restockSupply(game, supplyType, count, cost) {
    if (game.resources.money < cost) {
      game.showToast('Fonds insuffisants', `Ce réassort coûte ${cost} €.`, 'orange');
      return;
    }
    game.resources.money -= cost;
    game.logistics[supplyType] += count;
    game.updateStatsUI();
    game.saveGame();
    game.showToast('Réapprovisionnement validé', `+${count} unités ajoutées au stock pharmacie.`, 'green');
    game.openModule('logistique');
  },

  checkLogisticsAlerts(game) {
    const badge = document.getElementById('badge-logistique-dock');
    const isLow = game.logistics.oxygenBottles <= 2 || game.logistics.aedPads <= 2 || game.logistics.woundKits <= 3;
    if (badge) {
      if (isLow) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }
  },

  serviceVehicle(game, vehicleId, actionType) {
    const v = game.vehicles.find(veh => veh.id === vehicleId);
    if (!v) return;

    if (actionType === 'rearm') {
      const cost = 30;
      if (game.resources.money < cost) {
        game.showToast('Fonds insuffisants', `Le réarmement du matériel requiert ${cost} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      v.needsRearming = false;
      game.showToast('Matériel Réarmé', `${v.name} a reçu ses sacs de secours reconditionnés et son matériel médical complet.`, 'green');
    } else if (actionType === 'fuel') {
      const cost = 75;
      if (game.resources.money < cost) {
        game.showToast('Fonds insuffisants', `Plein carburant : ${cost} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      v.fuel = 100;
      game.showToast('Plein effectué', `${v.name} a le réservoir plein (100%).`, 'green');
    } else if (actionType === 'disinfection') {
      const cost = 25;
      if (game.resources.money < cost) {
        game.showToast('Fonds insuffisants', `Produits désinfectants : ${cost} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      v.disinfectionNeeded = false;
      game.showToast('Bionettoyage terminé', `${v.name} est désinfecté et stérile pour repartir.`, 'green');
    } else if (actionType === 'disinfection_trimestrielle') {
      const cost = 60;
      if (game.resources.money < cost) {
        game.showToast('Fonds insuffisants', `Désinfection trimestrielle agréée ARS : ${cost} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      v.quarterlyDisinfectionDone = true;
      v.missionsSinceDisinfection = 0;
      game.showToast('Désinfection Trimestrielle Validée', `${v.name} a été intégralement nébulisé et certifié conforme ARS / SAMU.`, 'green');
    } else if (actionType === 'mechanical') {
      const cost = 280;
      if (game.resources.money < cost) {
        game.showToast('Fonds insuffisants', `Révision garage & pièces : ${cost} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      v.mechanical = 100;
      v.isBrokenDown = false;
      game.showToast('Révision effectuée', `Contrôle technique et réparations mécaniques validés pour ${v.name}.`, 'green');
    }

    game.updateStatsUI();
    game.saveGame();
    game.openModule('logistique');
  },

  // --- 5. CYCLE JOUR/NUIT ET MÉTÉO ---
  calculateDayNightCycle(game) {
    const hour = game.clock.hour;
    const minute = game.clock.minute || 0;
    const t = hour + (minute / 60); // Heure décimale : 0.00 à 23.99

    let color = 'rgba(0, 0, 0, 0)';
    let period = 'jour';
    let periodLabel = 'Plein jour';
    let periodIcon = '☀️';
    let tempOffset = 0;

    // 1. Pleine Nuit : 22h30 -> 05h30 (t >= 22.5 ou t < 5.5)
    // Ambiance nocturne réaliste : voile bleu nuit / ardoise (#0f172a), carte lisible et gyrophares éclatants
    if (t >= 22.5 || t < 5.5) {
      color = 'rgba(15, 23, 42, 0.42)';
      period = 'nuit';
      periodLabel = 'Nuit';
      periodIcon = '🌙';
      tempOffset = -4; // Fraîcheur de la nuit
    }
    // 2. Aube & Lever progressif du jour : 05h30 -> 08h00 (5.5 <= t < 8.0)
    // Transition continue et douce sur 150 minutes simulées
    else if (t >= 5.5 && t < 8.0) {
      const p = (t - 5.5) / 2.5; // 0.0 (début aube) -> 1.0 (plein jour)
      period = 'aube';
      periodLabel = p < 0.6 ? 'Aube naissante' : 'Lever du soleil';
      periodIcon = '🌅';
      tempOffset = Math.round(-3 + p * 2);

      // Première phase (05h30 - 06h45) : La nuit bleu marine s'estompe et accueille une douce teinte rosée
      if (p < 0.5) {
        const sub = p / 0.5; // 0 -> 1
        const r = Math.round(15 + (120 - 15) * sub);
        const g = Math.round(23 + (70 - 23) * sub);
        const b = Math.round(42 + (75 - 42) * sub);
        const a = (0.42 - (0.42 - 0.20) * sub).toFixed(3);
        color = `rgba(${r}, ${g}, ${b}, ${a})`;
      } 
      // Seconde phase (06h45 - 08h00) : Douce lueur dorée du matin s'effaçant vers le plein jour
      else {
        const sub = (p - 0.5) / 0.5; // 0 -> 1
        const r = Math.round(120 + (255 - 120) * sub);
        const g = Math.round(70 + (190 - 70) * sub);
        const b = Math.round(75 + (120 - 75) * sub);
        const a = (0.20 * (1 - sub)).toFixed(3);
        color = `rgba(${r}, ${g}, ${b}, ${a})`;
      }
    }
    // 3. Plein jour : 08h00 -> 18h30 (8.0 <= t < 18.5)
    // Lumière naturelle totale, carte claire, pure et lumineuse
    else if (t >= 8.0 && t < 18.5) {
      color = 'rgba(0, 0, 0, 0)';
      period = 'jour';
      periodLabel = 'Plein jour';
      periodIcon = '☀️';
      const heatPeak = Math.sin(((t - 8.0) / 10.5) * Math.PI);
      tempOffset = Math.round(heatPeak * 3);
    }
    // 4. Fin d'après-midi & Coucher du soleil doré : 18h30 -> 20h30 (18.5 <= t < 20.5)
    // Apparition progressive et subtile de la Golden Hour (lueur ambrée très légère)
    else if (t >= 18.5 && t < 20.5) {
      const p = (t - 18.5) / 2.0; // 0.0 -> 1.0
      period = 'crepuscule';
      periodLabel = 'Coucher de soleil';
      periodIcon = '🌇';
      tempOffset = Math.round(1 - p * 2);
      const a = (0.12 * p).toFixed(3);
      color = `rgba(217, 119, 6, ${a})`;
    }
    // 5. Crépuscule & Tombée progressive de la nuit : 20h30 -> 22h30 (20.5 <= t < 22.5)
    // Transition fluide du crépuscule ambré vers le bleu nuit complet
    else if (t >= 20.5 && t < 22.5) {
      const p = (t - 20.5) / 2.0; // 0.0 -> 1.0
      period = 'crepuscule';
      periodLabel = 'Crépuscule';
      periodIcon = '🌆';
      tempOffset = Math.round(-1 - p * 3);
      const r = Math.round(217 + (15 - 217) * p);
      const g = Math.round(119 + (23 - 119) * p);
      const b = Math.round(6 + (42 - 6) * p);
      const a = (0.12 + (0.42 - 0.12) * p).toFixed(3);
      color = `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return { color, period, periodLabel, periodIcon, tempOffset };
  },

  // Récupération de la géolocalisation de l'antenne du joueur (ou chef-lieu de département)
  getPlayerAntennaCoords(game) {
    if (game.stations && game.stations.length > 0) {
      return { lat: game.stations[0].lat, lng: game.stations[0].lng, name: game.stations[0].name };
    }
    const deptCode = game.currentDepartmentCode || game.player?.departmentCode || '75';
    if (window.ProtecDepartements) {
      const dept = window.ProtecDepartements.getByCode(deptCode);
      if (dept) return { lat: dept.lat, lng: dept.lng, name: `${dept.name} (${dept.code})` };
    }
    return { lat: 48.8566, lng: 2.3522, name: 'Paris (75)' };
  },

  // Interrogation de l'API météo en temps réel (Open-Meteo pour les coordonnées exactes de l'antenne)
  async fetchRealWeather(game, force = false) {
    const coords = this.getPlayerAntennaCoords(game);
    const now = Date.now();

    // Actualisation automatique régulière (toutes les 3 minutes)
    if (!force && game.weather && game.weather.lastFetchTimestamp && (now - game.weather.lastFetchTimestamp < 3 * 60 * 1000)) {
      return;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat.toFixed(4)}&longitude=${coords.lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const current = data.current;

      if (current) {
        game.weather.realTemp = current.temperature_2m;
        game.weather.temp = current.temperature_2m;
        game.weather.windSpeed = current.wind_speed_10m || 0;
        game.weather.windGusts = current.wind_gusts_10m || current.wind_speed_10m || 0;
        game.weather.precipitation = current.precipitation || 0;
        game.weather.humidity = current.relative_humidity_2m || 60;
        game.weather.weatherCode = current.weather_code;
        game.weather.locationName = coords.name;
        game.weather.lastFetchTimestamp = now;

        // Détection du phénomène et de la vigilance Météo-France correspondante
        this.interpretMeteoFranceVigilance(game);
        console.log(`[Météo Réelle] Synchronisée pour ${coords.name}: ${game.weather.temp}°C, vent ${game.weather.windGusts} km/h, code ${game.weather.weatherCode}, vigilance: ${game.weather.vigilance}`);
      }
    } catch (err) {
      console.warn('Erreur synchronisation météo réelle:', err);
    }
  },

  // Interprétation des alertes Météo-France (Canicule, Crues/Inondations, Vents violents/Chutes d'arbres, Feux de forêt, Orages, Grand Froid)
  interpretMeteoFranceVigilance(game) {
    const w = game.weather;
    const code = w.weatherCode || 0;
    let temp = w.temp != null ? w.temp : 18;
    const wind = w.windGusts || w.windSpeed || 0;
    const precip = w.precipitation || 0;

    // Prise en compte de la saison virtuelle (mois de jeu 0 à 11)
    const month = (game.clock && game.clock.month !== undefined) ? game.clock.month : 9; // 0=Janv, 5=Juin, 6=Juil, 7=Août, 11=Déc
    const isSummer = (month === 5 || month === 6 || month === 7); // Juin, Juillet, Août
    const isWinter = (month === 11 || month === 0 || month === 1); // Décembre, Janvier, Février
    const isSpringAutumn = !isSummer && !isWinter;

    // Ajustement de la température selon la saison si non connectée ou incohérente
    if (isSummer && temp < 20) temp = Math.max(temp, 26);
    if (isWinter && temp > 12) temp = Math.min(temp, 3);

    let vigilance = 'green';
    let condition = 'ensoleille'; // 6 conditions normalisées : ensoleille, canicule, pluie_battante, orage_violent, grand_froid, neige
    let alertTitle = 'Vigilance Verte - Conditions Nominales';
    let alertDesc = 'Aucune vigilance météorologique particulière. Les dispositifs de secours se déroulent normalement.';
    let phenomenon = 'nominal';

    // 1. CANICULE (en été ou forte température)
    if (temp >= 33 || (isSummer && temp >= 30)) {
      vigilance = temp >= 36 ? 'red' : 'orange';
      condition = 'canicule';
      phenomenon = 'canicule';
      alertTitle = temp >= 36 ? 'Vigilance Rouge Canicule Extrême' : 'Vigilance Orange Canicule Préfectorale';
      alertDesc = `Canicule à ${Math.round(temp)}°C. Risque critique de malaises thermiques, déshydratations et insolations. Tentes climatisées et stocks de solutés obligatoires sur les DPS.`;
    }
    // 2. GRAND FROID & NEIGE (en hiver ou températures négatives)
    else if (temp <= -2 || (isWinter && temp <= 0)) {
      vigilance = temp <= -6 ? 'red' : 'orange';
      condition = 'grand_froid';
      phenomenon = 'grand_froid';
      alertTitle = 'Vigilance Grand Froid & Gel Sévère';
      alertDesc = `Froid polaire (${Math.round(temp)}°C). Déclenchement du Plan Grand Froid : maraudes renforcées et accueil en gymnase d'urgence.`;
    } else if ([71, 73, 75, 77, 85, 86].includes(code) || (isWinter && precip > 2 && temp <= 2)) {
      vigilance = 'orange';
      condition = 'neige';
      phenomenon = 'neige';
      alertTitle = 'Vigilance Orange Neige & Verglas';
      alertDesc = 'Chutes de neige et verglas. Risque élevé de glissades, accidents de circulation et axes bloqués. Véhicules équipés et chaînes requis.';
    }
    // 3. ORAGE VIOLENT & PLUIE BATTANTE
    else if ([95, 96, 99].includes(code) || (precip >= 15) || wind >= 70) {
      vigilance = 'orange';
      condition = 'orage_violent';
      phenomenon = 'inondation';
      alertTitle = 'Vigilance Orange Orages Violents & Rafales';
      alertDesc = 'Forte activité orageuse, risques de ruissellement et traumatismes. Véhicules tout-chemin (VLHR) et abris fermés obligatoires pour les secouristes.';
    } else if ([65, 82, 63, 81].includes(code) || (precip >= 7)) {
      vigilance = 'orange';
      condition = 'pluie_battante';
      phenomenon = 'inondation';
      alertTitle = 'Vigilance Orange Pluie Battante & Crues';
      alertDesc = 'Précipitations continues intenses. Risque de glissades, hypothermie et crue de cours d\'eau. Postes ouverts interdits sans barnums étanches.';
    }
    // 4. CONDITIONS CLAIRES / TEMPÉRÉES
    else {
      condition = 'ensoleille';
      vigilance = 'green';
      phenomenon = 'nominal';
      alertTitle = 'Vigilance Verte - Ensoleillé / Nominal';
      alertDesc = 'Conditions nominales d\'intervention sur le département.';
    }

    const previousVigilance = w.vigilance;
    w.vigilance = vigilance;
    w.condition = condition;
    w.temp = temp;
    w.alertTitle = alertTitle;
    w.alertDesc = alertDesc;
    w.alertPhenomenon = phenomenon;

    // Toast de notification si passage à une vigilance supérieure
    if (previousVigilance !== vigilance && ['yellow', 'orange', 'red'].includes(vigilance)) {
      const color = vigilance === 'red' ? 'red' : 'orange';
      const vigLabels = { green: 'VERT', yellow: 'JAUNE', orange: 'ORANGE', red: 'ROUGE' };
      const vigFr = vigLabels[vigilance] || vigilance.toUpperCase();
      game.showToast(`Bulletin Météo-France (${vigFr})`, alertTitle, color);
    }
  },
triggerWeatherEmergencyMission(game) {
    if (!game.weather) return;
    const v = game.weather.vigilance;
    if (v === 'green' || v === 'yellow') return;

    // Maximum 2 missions d'urgence météo/crise actives à la fois
    const ongoingWeatherMissions = game.missions.filter(m => m.type === 'meteo' && ['planifie', 'ongoing', 'prealerte'].includes(m.status));
    if (ongoingWeatherMissions.length >= 2) return;

    const base = game.stations[0] || { lat: 48.8566, lng: 2.3522, name: 'Antenne', city: 'Nancy' };
    const meteoCoords = game.calculateRealisticMissionLocation ? game.calculateRealisticMissionLocation(base, 'meteo') : { lat: base.lat + 0.04, lng: base.lng + 0.04 };
    const cond = game.weather.condition || 'pluie_battante';
    const city = base.city || 'Nancy';

    let missionDef = null;

    if (cond === 'canicule') {
      missionDef = {
        title: 'Plan Canicule Préfectoral : Maraude Sanitaire & Tentes de Déchoquage',
        desc: `Pic de canicule extrême à ${Math.round(game.weather.temp)}°C. Réquisition préfectorale de l'antenne au titre des AASC : hydratation des personnes vulnérables, maraudes urbaines et tentes climatisées pour déchoquage des malaises thermiques.`,
        urgency: 'haute',
        durMin: 35,
        reqVol: 4,
        ranks: ['CE', 'PSE2', 'PSE1'],
        vehs: ['VPSP', 'VL'],
        reward: 1800,
        typeCrise: 'canicule'
      };
    } else if (cond === 'grand_froid') {
      missionDef = {
        title: 'Plan Grand Froid Niveau 2 : Hébergement d’Urgence en Gymnase & Lits de Camp',
        desc: `Vague de froid polaire (${Math.round(game.weather.temp)}°C). La Préfecture et la Mairie de ${city} réquisitionnent la Protection Civile pour ouvrir un centre d'hébergement d'urgence : montage de lits de camp, distribution de duvets et accueil des sans-abris.`,
        urgency: 'haute',
        durMin: 45,
        reqVol: 5,
        ranks: ['CE', 'PSE2', 'PSE1'],
        vehs: ['VTU', 'VPSP'],
        reward: 2200,
        typeCrise: 'grand_froid'
      };
    } else if (cond === 'orage_violent' || cond === 'pluie_battante' || game.weather.alertPhenomenon === 'inondation') {
      missionDef = {
        title: 'Plan Communal de Sauvegarde (PCS) : Centre d’Accueil des Impliqués (CAI)',
        desc: `Crue subite de rivière et inondation d'un quartier de ${city}. Le Maire déclenche le Plan Communal de Sauvegarde. Réquisition d'urgence de la Protection Civile pour armer un Centre d'Accueil des Impliqués (CAI) en salle des fêtes avec lits de camp, réconfort et bilans médico-psychologiques.`,
        urgency: 'critique',
        durMin: 40,
        reqVol: 5,
        ranks: ['CP', 'CE', 'PSE2', 'PSE1'],
        vehs: ['VLHR', 'VPSP'],
        reward: 2800,
        typeCrise: 'inondation'
      };
    } else {
      missionDef = {
        title: 'Réquisition Préfectorale d’Urgence : Soutien aux Populations Sinistrées',
        desc: `Alerte Préfecture majeure : Coup de vent et intempéries. Engagement prioritaire des secouristes pour sécurisation d'axe et assistance d'urgence.`,
        urgency: 'haute',
        durMin: 30,
        reqVol: 4,
        ranks: ['CE', 'PSE2', 'PSE1'],
        vehs: ['VPSP', 'VL'],
        reward: 1900,
        typeCrise: 'tempete'
      };
    }

    const newWeatherMission = {
      id: `m-crise-${Date.now()}`,
      type: 'meteo',
      categoryLabel: 'Plan d’Urgence Préfecture / PCS',
      title: `[URGENCE RÉQUISITION] ${missionDef.title}`,
      desc: `🏛️ ALERTE PRÉFECTURE / PCS : ${missionDef.desc} Mobilisez immédiatement vos bénévoles. Succès : +20 pts Préfecture et +25 pts réputation ${city}. Échec/Refus : pénalité administrative sévère.`,
      lat: meteoCoords.lat,
      lng: meteoCoords.lng,
      commune: city,
      city: city,
      scale: `Dispositif d’Urgence AASC (${missionDef.reqVol} secouristes)`,
      eventDate: { ...game.clock, hour: game.clock.hour },
      durationSeconds: missionDef.durMin * 60,
      durationHours: (missionDef.durMin / 60).toFixed(1),
      requiredVolunteers: missionDef.reqVol,
      requiredRanks: missionDef.ranks,
      requiredVehicles: missionDef.vehs,
      rewardMoney: missionDef.reward,
      rewardReputation: 50,
      progress: 0,
      status: 'prealerte',
      alertOrigin: 'meteo',
      prealertSecondsLeft: 180,
      prealertTotalSec: 180,
      evolutionResolved: false,
      registeredVolunteers: [],
      assignedCrew: { volunteers: [], vehicles: [] },
      address: (game.generateRealisticStreetAddress ? game.generateRealisticStreetAddress(city, meteoCoords.lat, meteoCoords.lng) : `Salle Municipale / CAI - ${city}`),
      isSector: false,
      isEmergencyPlan: true,
      onCompleteSuccess: () => {
        // Impact majeur en cas de succès
        if (window.ProtecConventions) {
          window.ProtecConventions.adjustInstitutionalReputation(game, 'prefecture', 20, 'Plan d\'urgence mené avec succès');
          window.ProtecConventions.adjustLocalReputation(game, city, 25, 'Déploiement exemplaire du CAI / Plan de sauvegarde');
        }
      },
      onFailure: () => {
        // Pénalité sévère en cas d'échec ou d'abandon
        if (window.ProtecConventions) {
          window.ProtecConventions.adjustInstitutionalReputation(game, 'prefecture', -25, 'Échec de réquisition préfectorale');
          window.ProtecConventions.adjustLocalReputation(game, city, -30, 'Carence d\'assistance sur la commune');
        }
      }
    };

    if (game.enrichMissionLocationWithCity) {
      game.enrichMissionLocationWithCity(newWeatherMission);
    }

    game.missions.push(newWeatherMission);
    game.renderMissions();
    game.updateStatsUI();
    game.saveGame();

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'weather',
        `🏛️ RÉQUISITION PRÉFECTURE / PCS (${game.weather.vigilance.toUpperCase()})`,
        `Le Préfet et la Mairie réquisitionnent la Protection Civile : ${missionDef.title}. Lits de camp & équipage d'urgence requis !`,
        `meteo-${newWeatherMission.id}`
      );
    }
    game.showToast('🚨 Réquisition Préfecture / PCS !', `Mobilisation d'urgence : ${missionDef.title} !`, 'red');
  },
updateWeatherAndDayNight(game) {
    const cycle = this.calculateDayNightCycle(game);

    // Application de l'assombrissement nocturne exclusivement sur le fond de carte (tuiles Leaflet)
    // Les marqueurs, véhicules, gyrophares et icônes restent à 100% éclatants au premier plan
    const tilePane = document.querySelector('.leaflet-tile-pane');
    if (tilePane) {
      let nightOverlay = document.getElementById('leaflet-tile-night-overlay');
      if (!nightOverlay) {
        nightOverlay = document.createElement('div');
        nightOverlay.id = 'leaflet-tile-night-overlay';
        nightOverlay.style.position = 'absolute';
        nightOverlay.style.width = '12000px';
        nightOverlay.style.height = '12000px';
        nightOverlay.style.left = '-6000px';
        nightOverlay.style.top = '-6000px';
        nightOverlay.style.pointerEvents = 'none';
        nightOverlay.style.zIndex = '350';
        nightOverlay.style.transition = 'background-color 1.5s ease';
        tilePane.appendChild(nightOverlay);
      }
      nightOverlay.style.backgroundColor = cycle.color;

      if (cycle.period === 'nuit') {
        tilePane.style.filter = 'brightness(0.72) contrast(1.08)';
      } else if (cycle.period === 'crepuscule' || cycle.period === 'aube') {
        tilePane.style.filter = 'brightness(0.88)';
      } else {
        tilePane.style.filter = 'none';
      }
    }

    // Récupération automatique de la météo réelle toutes les 3 minutes ou au premier lancement
    if (!game.weather.lastFetchTimestamp || (Date.now() - game.weather.lastFetchTimestamp > 3 * 60 * 1000)) {
      this.fetchRealWeather(game);
    }

    // Déclenchement calibré d'une mission météo en cas de vigilance active (Jaune = rien, Orange = peu de chance, Rouge = moyennement)
    if (game.clock && game.clock.second === 25 && (game.clock.minute % 4 === 0)) {
      if (game.weather && ['orange', 'red'].includes(game.weather.vigilance)) {
        let proba = 0;
        if (game.weather.vigilance === 'red') proba = 0.28; // Moyennement en rouge
        else if (game.weather.vigilance === 'orange') proba = 0.08; // Peu de chance en orange
        
        if (Math.random() < proba) {
          this.triggerWeatherEmergencyMission(game);
        }
      }
    }

    // Température réelle mesurée (avec léger ressenti selon l'heure)
    const currentTemp = Math.round(game.weather.temp != null ? game.weather.temp : 18);

    // Mise à jour widget météo dans le header
    const tempEl = document.getElementById('weather-temp');
    const iconEl = document.getElementById('weather-icon');
    const badgeEl = document.getElementById('weather-vigilance-badge');
    const textEl = document.getElementById('weather-status-text');
    const weatherWidget = document.getElementById('weather-widget');

    if (tempEl) tempEl.textContent = `${currentTemp}°C`;

    if (iconEl) {
      if (game.weather.condition === 'heat') iconEl.textContent = '🔥';
      else if (game.weather.condition === 'flood') iconEl.textContent = '🌊';
      else if (game.weather.condition === 'storm') iconEl.textContent = '⚡';
      else if (game.weather.condition === 'wind') iconEl.textContent = '💨';
      else if (game.weather.condition === 'snow') iconEl.textContent = '❄️';
      else if (game.weather.condition === 'rain') iconEl.textContent = '🌧️';
      else if (game.weather.condition === 'fog') iconEl.textContent = '🌫️';
      else if (game.weather.condition === 'cloud') iconEl.textContent = '⛅';
      else iconEl.textContent = cycle.periodIcon;
    }

    if (badgeEl) {
      if (game.weather.vigilance === 'green') {
        badgeEl.className = 'px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800';
        badgeEl.textContent = 'Vert';
      } else if (game.weather.vigilance === 'yellow') {
        badgeEl.className = 'px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 animate-pulse';
        badgeEl.textContent = 'Jaune';
      } else if (game.weather.vigilance === 'orange') {
        badgeEl.className = 'px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-orange-100 text-pc-orange animate-pulse';
        badgeEl.textContent = 'Orange';
      } else if (game.weather.vigilance === 'red') {
        badgeEl.className = 'px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700 animate-bounce';
        badgeEl.textContent = 'Rouge';
      }
    }

    if (textEl) {
      if (game.weather.condition === 'canicule') textEl.textContent = 'Canicule 🔥';
      else if (game.weather.condition === 'grand_froid') textEl.textContent = 'Grand Froid ❄️';
      else if (game.weather.condition === 'neige') textEl.textContent = 'Neige/Verglas 🌨️';
      else if (game.weather.condition === 'orage_violent') textEl.textContent = 'Orage Violent ⚡';
      else if (game.weather.condition === 'pluie_battante') textEl.textContent = 'Pluie Battante 🌧️';
      else if (game.weather.condition === 'ensoleille') textEl.textContent = 'Ensoleillé ☀️';
      else textEl.textContent = cycle.periodLabel;
    }

    if (weatherWidget) {
      const vigLabels = { green: 'VERTE', yellow: 'JAUNE', orange: 'ORANGE', red: 'ROUGE' };
      const vigFr = vigLabels[game.weather.vigilance] || 'VERTE';
      weatherWidget.setAttribute('title', `Météo : ${currentTemp}°C • Vigilance ${vigFr} (${game.weather.alertTitle})`);
    }

    // Usure des véhicules stationnés dehors (au-delà de la capacité du garage)
    this.applyWeatherImpactOnUnshelteredVehicles(game);
  },

  // Impact des intempéries sur les véhicules stationnés dehors (au-delà de la capacité du garage de remisage)
  applyWeatherImpactOnUnshelteredVehicles(game) {
    if (!game || !game.weather || !game.stations || !game.stations[0]) return;
    const now = Date.now();
    if (!game._lastShelterWeatherCheck) game._lastShelterWeatherCheck = now;
    // Vérification toutes les 60 secondes de temps réel
    if (now - game._lastShelterWeatherCheck < 60000) return;
    game._lastShelterWeatherCheck = now;

    const cond = game.weather.condition || 'ensoleille';
    const isBadWeather = ['canicule', 'pluie_battante', 'orage_violent', 'grand_froid', 'neige', 'heat', 'storm', 'rain', 'snow'].includes(cond);
    if (!isBadWeather) return;

    const station = game.stations[0];
    const shelter = (window.ProtecLocaux && typeof window.ProtecLocaux.getVehiclesShelterStatus === 'function')
      ? window.ProtecLocaux.getVehiclesShelterStatus(game, station.id)
      : { unshelteredVehicles: [] };

    if (!shelter.unshelteredVehicles || shelter.unshelteredVehicles.length === 0) return;

    shelter.unshelteredVehicles.forEach(v => {
      // Usure accélérée de la carrosserie et mécanique/batterie
      v.cleanliness = Math.max(10, (v.cleanliness !== undefined ? v.cleanliness : 90) - 1.5);
      v.mechanical = Math.max(20, (v.mechanical !== undefined ? v.mechanical : 95) - 1.0);

      // Risque de panne/batterie à plat si exposé et trop dégradé
      if (v.mechanical < 45 && !v.isBrokenDown && v.status === 'dispo') {
        v.isBrokenDown = true;
        v.status = 'en_panne';
        game.showToast(
          'Panne Véhicule non Abrité ⚠️',
          `${v.name} stationné dehors et exposé aux intempéries (${cond}) ne démarre plus ! Batterie déchargée ou mécanique endommagée. Révision garage requise.`,
          'orange'
        );
        if (window.ProtecNotifications) {
          window.ProtecNotifications.recordNotification({
            title: `🌧️ Usure Météo : Panne ${v.name}`,
            message: `Faute de place couverte dans le garage, le véhicule ${v.name} a subi des avaries dues aux intempéries (${cond}). Agrandissez le hangar ou engagez des réparations.`,
            category: 'logistique',
            level: 'warning'
          });
        }
      }
    });
  },

  // --- 6. VIE ASSOCIATIVE & COHÉSION ---
  organizeTeamEvent(game, eventType) {
    if (eventType === 'bbq') {
      const cost = 150;
      if (game.resources.money < cost) {
        game.showToast('Fonds insuffisants', `Le barbecue de cohésion requiert ${cost} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      game.volunteers.forEach(v => {
        v.moral = Math.min(100, (v.moral || 80) + 30);
        v.energy = Math.min(100, (v.energy || 80) + 20);
      });
      game.showToast('Moment de Cohésion Réussi !', 'Barbecue d’antenne : le moral et l’esprit d’équipe sont au maximum (+30% moral) !', 'green');
    } else if (eventType === 'recyclage') {
      let count = 0;
      game.volunteers.forEach(v => {
        if (!v.recycledYear || v.recycledYear < game.clock.year) {
          if (count < 4) {
            v.recycledYear = game.clock.year;
            count++;
          }
        }
      });
      game.showToast('Recyclage FC PSE Réalisé', `${count} secouriste(s) ont validé leur formation continue obligatoire pour ${game.clock.year} !`, 'green');
    }

    game.updateStatsUI();
    game.saveGame();
    game.openModule('recrutement');
  },

  // --- 7. SUBVENTIONS MUNICIPALES & DONS ---
  submitMunicipalGrantDossier(game) {
    if (game.grants.municipalDossierSubmitted) {
      game.showToast('Dossier en instruction', 'Votre dossier est déjà déposé auprès de la commission municipale pour cette année.', 'blue');
      return;
    }

    const baseStation = game.stations?.[0];
    const stationCity = baseStation ? baseStation.city : 'Nancy';
    const repCommune = (game.reputation_villes && game.reputation_villes[stationCity] !== undefined)
      ? game.reputation_villes[stationCity]
      : 50;

    // Règle d'ancrage local : si réputation < 25, la Mairie refuse la subvention !
    if (repCommune < 25) {
      game.showToast(
        'Rejet du Conseil Municipal 🏛️',
        `La Mairie de ${stationCity} a rejeté votre demande de subvention annuelle en raison d'une réputation locale trop dégradée (${repCommune}/100 < 25 pts). Les crédits associatifs ont été réattribués à une association concurrente. Améliorez votre ancrage communal sur les DPS.`,
        'red'
      );
      return;
    }

    const hours = game.grants.totalVolunteerHours || 0;
    const baseEstimated = Math.max(3000, Math.min(25000, Math.round(hours * 18 * 1.5)));

    // Modulation selon la réputation locale : de 0.6x (réputation 30) jusqu'à 2.0x (réputation 100)
    const multiplier = Math.max(0.6, (repCommune / 50));
    const estimatedAmount = Math.round(baseEstimated * multiplier);

    game.grants.municipalDossierSubmitted = true;
    game.grants.lastGrantAwarded = estimatedAmount;
    game.resources.money += estimatedAmount;
    game.resources.reputationScore += 35;

    // Bonus supplémentaire de réputation locale pour vote favorable
    if (window.ProtecConventions) {
      window.ProtecConventions.adjustLocalReputation(game, stationCity, 5, 'Vote favorable subvention municipale');
    }

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, estimatedAmount, `Subvention Municipale Annuelle - Ville de ${stationCity} (Réputation ${repCommune} pts)`, 'subvention');
    }

    const bonusMsg = repCommune >= 65 ? ' (Subvention bonifiée pour partenariat privilégié !)' : '';
    game.showToast(
      'Subvention Accordée ! 🏛️',
      `La Mairie de ${stationCity} a voté une subvention de ${estimatedAmount.toLocaleString('fr-FR')} € valorisant vos ${hours}h d'engagement bénévole !${bonusMsg}`,
      'green'
    );
    game.updateStatsUI();
    game.saveGame();
    if (game.openModule) game.openModule('devis');
  },

  togglePublicDonations(game) {
    game.grants.publicDonationsActive = !game.grants.publicDonationsActive;
    if (game.grants.publicDonationsActive) {
      game.showToast('Campagne de dons active', 'L’appel aux dons et mécénat fiscal (déduction 66%) est mis en ligne.', 'green');
    } else {
      game.showToast('Campagne suspendue', 'L’appel aux dons est suspendu.', 'blue');
    }
    game.saveGame();
    game.openModule('devis');
  },

  // --- 8. CYCLE MENSUEL & GÉNÉRATION D'ÉVÉNEMENTS RÉELS (IA + FALLBACK HORS-LIGNE) ---
  checkMonthlyEventsCycle(game) {
    if (!game || !game.clock) return;
    const year = game.clock.year || new Date().getFullYear();
    const month = game.clock.month ?? new Date().getMonth();
    const monthKey = `${year}-${month}`;

    // Gestion mensuelle des locaux (Loyer, Fluides & Isolation, Commission ERP)
    this.checkMonthlyPremisesCharges(game, monthKey);

    if (!game.monthlyEventsGenerated) game.monthlyEventsGenerated = {};

    // Vérifier si les événements du mois courant existent déjà dans le stockage (mémoire ou localStorage)
    const localSaved = localStorage.getItem(`protec_monthly_events_${monthKey}`);
    if (game.monthlyEventsGenerated[monthKey] || localSaved) {
      if (!game.monthlyEventsGenerated[monthKey] && localSaved) {
        try {
          game.monthlyEventsGenerated[monthKey] = JSON.parse(localSaved);
        } catch (e) {}
      }
      return;
    }

    // Actualisation du vivier d'ancrage réel territorial (20 événements du mois par antenne)
    if (window.ProtecEvenementsReels && typeof window.ProtecEvenementsReels.checkMonthlyTerritoryRefresh === 'function') {
      window.ProtecEvenementsReels.checkMonthlyTerritoryRefresh(game);
    }

    // Si les événements ne sont pas présents pour le mois courant, déclencher la génération
    this.triggerMonthlyEventsGeneration(game, monthKey);
  },

  // Gestion mensuelle des locaux : Loyer, Fluides & Énergie selon isolation, et Commission de Sécurité ERP
  checkMonthlyPremisesCharges(game, monthKey) {
    if (!game || !game.stations || !game.stations[0]) return;
    if (!game.premisesChargesHistory) game.premisesChargesHistory = {};
    if (game.premisesChargesHistory[monthKey]) return; // Déjà traité pour ce mois

    const station = game.stations[0];
    const premises = (window.ProtecLocaux && typeof window.ProtecLocaux.getStationPremises === 'function')
      ? window.ProtecLocaux.getStationPremises(game, station.id)
      : (station.premises || {});

    if (!premises) return;
    game.premisesChargesHistory[monthKey] = { processedAt: Date.now() };

    const month = (game.clock && game.clock.month !== undefined) ? game.clock.month : (new Date().getMonth());
    const isWinter = [10, 11, 0, 1, 2].includes(month); // Novembre à Mars
    const city = station.city || station.commune || 'Nancy';
    const repCity = (game.reputation_villes && game.reputation_villes[city] !== undefined) ? game.reputation_villes[city] : 50;

    // 1. STATUT D'OCCUPATION & LOYER MENSUEL
    const occType = premises.occupationType || (premises.tenure === 'owned' ? 'pleine_propriete' : 'mise_a_disposition_mairie');
    if (occType === 'mise_a_disposition_mairie') {
      if (repCity < 30) {
        // La mairie impose une indemnité compensatoire et menace d'expulsion sous 30 jours !
        premises.evictionNotice = true;
        premises.chargesImposed = true;
        const evictionCost = 650;
        game.resources.money = Math.max(0, game.resources.money - evictionCost);
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(game, -evictionCost, `Indemnité d'occupation municipale imposée (Réputation ${repCity}/100 < 30) - Mairie de ${city}`, 'locaux');
        }
        game.showToast(
          '⚠️ Préavis d’Expulsion & Indemnité Mairie',
          `Votre réputation communale est tombée à ${repCity}/100 ! Le Maire exige une indemnité de 650 € et menace d'expulser l'antenne sous 30 jours si la réputation ne remonte pas.`,
          'red'
        );
        if (window.ProtecNotifications) {
          window.ProtecNotifications.recordNotification({
            title: '🏛️ Mise en Demeure Municipale & Expulsion',
            message: `La Mairie de ${city} met fin à la gratuité du local en raison d'un manque d'engagement associatif (${repCity}/100). Facturation de 650 € et préavis de départ actif.`,
            category: 'general',
            level: 'error'
          });
        }
      } else {
        premises.evictionNotice = false;
        premises.chargesImposed = false;
        premises.monthlyRent = 0;
      }
    } else if (occType === 'location_privee') {
      const rent = premises.monthlyRent || 850;
      game.resources.money = Math.max(0, game.resources.money - rent);
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -rent, `Loyer commercial mensuel des locaux d'antenne (Bail privé indépendant)`, 'locaux');
      }
      game.showToast('Loyer Prélevé 🏢', `Loyer mensuel privé de ${rent} € débité. Indépendance municipale totale garantie.`, 'blue');
    } else if (occType === 'pleine_propriete') {
      premises.monthlyRent = 0;
      premises.evictionNotice = false;
      premises.chargesImposed = false;
    }

    // 2. CHARGES DE FLUIDES & ÉNERGIE (Modulées par l'isolation du bâtiment)
    const baseFluides = premises.fluidesBaseCost || 180;
    const isoLevel = premises.isolationLevel || 2; // 1: Passoire, 2: Standard, 3: BBC
    let fluidesMultiplier = 1.0;
    if (isoLevel === 1) {
      fluidesMultiplier = isWinter ? 1.8 : 1.1; // Factures explosives en hiver pour passoire thermique
    } else if (isoLevel === 3) {
      fluidesMultiplier = 0.7; // Factures réduites de 30% grâce au double vitrage / BBC
    }
    const fluidesCost = Math.round(baseFluides * fluidesMultiplier);
    game.resources.money = Math.max(0, game.resources.money - fluidesCost);
    if (window.ProtecFinances) {
      const isoLabel = isoLevel === 3 ? 'BBC (-30%)' : (isoLevel === 1 ? 'Passoire thermique (+80% en hiver)' : 'Standard');
      window.ProtecFinances.recordTransaction(game, -fluidesCost, `Fluides & Énergie (Eau, Chauffage, Électricité) - Isolation ${isoLabel}`, 'locaux');
    }

    // Risque de gel des médicaments/sérums si passoire thermique en hiver
    if (isoLevel === 1 && isWinter && (game.weather?.temp !== undefined && game.weather.temp <= 0)) {
      game.showToast(
        '❄️ Alerte Gel dans la Pharmacie !',
        `Chute des températures sous 0°C et passoire thermique : risque de gel des solutés et consommables dans le sas pharmacie. Pensez à isoler le bâtiment !`,
        'orange'
      );
    }

    // 3. COMMISSION DE SÉCURITÉ ERP (Contrôle inopiné avec 30% de chance chaque mois)
    if (Math.random() < 0.30) {
      const erpScore = premises.erpSecurityScore !== undefined ? premises.erpSecurityScore : 90;
      const isConforme = premises.erpStatus === 'conforme' && erpScore >= 75;
      if (!isConforme) {
        const fine = 500;
        game.resources.money = Math.max(0, game.resources.money - fine);
        premises.erpStatus = 'non_conforme';
        premises.erpSecurityScore = Math.max(25, erpScore - 20);
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(game, -fine, `Amende administrative de non-conformité ERP - Commission de Sécurité`, 'locaux');
        }
        game.showToast(
          '🚨 Contrôle de Sécurité ERP Défavorable !',
          `La commission de sécurité municipale a constaté des infractions (extincteurs/BAES). Amende de ${fine} € et fermeture temporaire de la salle de formation PSC1 jusqu'à audit !`,
          'red'
        );
        if (window.ProtecNotifications) {
          window.ProtecNotifications.recordNotification({
            title: '🧯 Sanction de Sécurité ERP (Amende 500 €)',
            message: `Non-conformité relevée lors de l'inspection inopinée des locaux. Les sessions PSC1 sont suspendues. Rendez-vous dans le module Locaux pour réaliser un audit de remise aux normes (220 €).`,
            category: 'general',
            level: 'error'
          });
        }
      } else {
        game.showToast(
          'Contrôle ERP Conforme ✓',
          `La commission de sécurité a inspecté le bâtiment de l'antenne. Registre à jour et blocs de secours opérationnels : agrément ERP renouvelé avec félicitations !`,
          'green'
        );
      }
    }

    // 4. MAINTENANCE & CONSOMMABLES DU PARC MATÉRIEL (Moniteurs, QCPR, Radios, Brancards)
    const annualMaintenance = (window.ProtecEquipements && typeof window.ProtecEquipements.getTotalAnnualMaintenance === 'function')
      ? window.ProtecEquipements.getTotalAnnualMaintenance(game)
      : 240;
    const monthlyMaintenance = Math.round(annualMaintenance / 12);
    if (monthlyMaintenance > 0) {
      game.resources.money = Math.max(0, game.resources.money - monthlyMaintenance);
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(
          game,
          -monthlyMaintenance,
          `Entretien, consommables & révision réglementaire du parc matériel (${annualMaintenance} €/an)`,
          'equipement'
        );
      }
    }

    game.saveGame();
    game.updateStatsUI();
  },

  async triggerMonthlyEventsGeneration(game, monthKey) {
    if (game._isGeneratingMonthlyEvents) return;
    game._isGeneratingMonthlyEvents = true;

    try {
      const deptCode = game.currentDepartmentCode || game.player?.departmentCode || '75';
      const deptInfo = (window.ProtecDepartements && typeof window.ProtecDepartements.getByCode === 'function') 
        ? (window.ProtecDepartements.getByCode(deptCode) || { code: deptCode, name: 'France', chefLieu: 'Chef-Lieu', region: 'France' })
        : { code: deptCode, name: 'France', chefLieu: 'Chef-Lieu', region: 'France' };
      
      const communes = (window.ProtecDepartements && typeof window.ProtecDepartements.getCommunesForDepartment === 'function')
        ? window.ProtecDepartements.getCommunesForDepartment(deptCode)
        : [{ nom: deptInfo.chefLieu, cp: `${deptCode}000`, lat: deptInfo.lat || 48.85, lng: deptInfo.lng || 2.35 }];

      const month = game.clock.month ?? new Date().getMonth();
      const year = game.clock.year || new Date().getFullYear();

      console.log(`[MyProtec] Génération des événements mensuels pour ${deptInfo.name} (${deptCode}) - Mois: ${month + 1}/${year}`);

      // 1. Appel API IA avec bascule transparente vers le fallback en cas d'erreur ou d'absence de réseau
      let events = [];
      try {
        events = await this.fetchLlmEvents(deptInfo, communes, month, year);
      } catch (err) {
        console.warn('[MyProtec] Fallback hors-ligne activé pour les événements réels:', err.message);
        events = this.generateLocalFallbackEvents(deptInfo, communes, month, year);
      }

      if (!Array.isArray(events) || events.length === 0) {
        events = this.generateLocalFallbackEvents(deptInfo, communes, month, year);
      }

      // 2. Algorithme de filtrage de capacité opérationnelle (Conventions & DPS)
      let injectedList = [];
      if (window.ProtecConventions && typeof window.ProtecConventions.filterAndInjectMonthlyEvents === 'function') {
        injectedList = window.ProtecConventions.filterAndInjectMonthlyEvents(game, events, deptInfo);
      }

      // 3. Persistance dans le stockage (gameState & localStorage)
      game.monthlyEventsGenerated[monthKey] = {
        generatedAt: Date.now(),
        deptCode: deptCode,
        totalRawEvents: events.length,
        injectedCount: (injectedList || []).length
      };
      localStorage.setItem(`protec_monthly_events_${monthKey}`, JSON.stringify(game.monthlyEventsGenerated[monthKey]));
      
      game.saveGame();
      game.updateStatsUI();

    } catch (error) {
      console.error('[MyProtec] Erreur lors du cycle mensuel d’événements:', error);
    } finally {
      game._isGeneratingMonthlyEvents = false;
    }
  },

  async fetchLlmEvents(deptInfo, communes, monthIndex, year) {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthName = monthNames[monthIndex] || 'Mois courant';
    const communesSample = (communes || []).slice(0, 10).map(c => c.nom).join(', ');

    const systemPrompt = `Tu es un expert des dispositifs prévisionnels de secours (DPS) de la Protection Civile en France.
Génère une liste de 5 à 8 événements réels ou typiques qui se déroulent dans le département ${deptInfo.name} (${deptInfo.code}, région ${deptInfo.region}, préfecture ${deptInfo.chefLieu}) au cours du mois de ${monthName} ${year}.
Exemples de types d'événements : sport, festif, foire, culturel (trails, marathons, foires de printemps/automne, fêtes patronales, carnavals, festivals, concerts, brocantes).
Communes possibles dans ce département : ${communesSample || deptInfo.chefLieu}.

Tu dois impérativement et UNIQUEMENT répondre avec un tableau JSON valide au format strict suivant, sans aucun commentaire ni bloc markdown :
[
  {
    "id": "evt-1",
    "nom": "Nom réel de l'événement",
    "commune": "Nom de la commune hôte",
    "type": "sport",
    "public_instantane": 2500,
    "environnement": "ouvert_urbain",
    "duree_heures": 5,
    "activite_risque": "moyen",
    "delai_acces_secours_minutes": 15,
    "budget_max_organisateur": 650
  }
]
Valeurs autorisées pour type : "sport", "festif", "foire", "culturel".
Valeurs autorisées pour environnement : "ouvert_urbain", "ferme", "dynamique_course".
Valeurs autorisées pour activite_risque : "faible", "moyen", "élevé".`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const apiKey = window.PROTEC_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
    let apiUrl = window.PROTEC_LLM_API_URL || '';

    if (!apiUrl && apiKey) {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    }

    if (!apiUrl) {
      throw new Error('Aucune API LLM configurée (bascule automatique sur générateur local)');
    }

    let bodyPayload;
    if (apiUrl.includes('generativelanguage.googleapis.com')) {
      bodyPayload = {
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
      };
    } else {
      bodyPayload = {
        prompt: systemPrompt,
        department: deptInfo.code,
        month: monthIndex,
        year: year
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Réponse API LLM non-OK: ${response.status}`);
    }

    const data = await response.json();
    let textOutput = '';
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      textOutput = data.candidates[0].content.parts[0].text;
    } else if (data.choices && data.choices[0]?.message?.content) {
      textOutput = data.choices[0].message.content;
    } else if (Array.isArray(data)) {
      return data;
    } else if (typeof data === 'string') {
      textOutput = data;
    } else if (data.events && Array.isArray(data.events)) {
      return data.events;
    }

    textOutput = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(textOutput);
    if (!Array.isArray(parsed)) throw new Error('La réponse LLM ne contient pas un tableau JSON');
    return parsed;
  },

  // Générateur procédural local hors-ligne résilient ancré dans le département
  generateLocalFallbackEvents(deptInfo, communes, monthIndex, year) {
    const commList = (communes && communes.length > 0) 
      ? communes 
      : [{ nom: deptInfo.chefLieu, cp: `${deptInfo.code}000`, lat: deptInfo.lat, lng: deptInfo.lng }];

    const getCommune = (idx) => commList[idx % commList.length]?.nom || deptInfo.chefLieu;

    // Modèles saisonniers crédibles par mois
    const seasonalPools = {
      0: [ // Janvier
        { nom: `Foulées du Nouvel An de ${getCommune(0)}`, type: 'sport', pub: 1200, env: 'dynamique_course', dur: 4, risk: 'faible', delay: 10, budget: 350 },
        { nom: `Tournoi Régional de Futsal & Sports d'Hiver`, type: 'sport', pub: 850, env: 'ferme', dur: 5, risk: 'moyen', delay: 12, budget: 280 },
        { nom: `Fête de la Galette & Vœux Municipaux`, type: 'festif', pub: 1500, env: 'ferme', dur: 4, risk: 'faible', delay: 15, budget: 320 },
        { nom: `Trail Nocturne des Neiges à ${getCommune(1)}`, type: 'sport', pub: 1800, env: 'dynamique_course', dur: 5, risk: 'moyen', delay: 20, budget: 480 },
        { nom: `Brocante d'Hiver sous Halle Couverte`, type: 'foire', pub: 2200, env: 'ferme', dur: 6, risk: 'faible', delay: 10, budget: 420 },
        { nom: `Championnat Départemental de Judo à ${getCommune(2)}`, type: 'sport', pub: 950, env: 'ferme', dur: 6, risk: 'moyen', delay: 12, budget: 360 }
      ],
      1: [ // Février
        { nom: `Grand Carnaval & Défilé des Chars de ${getCommune(0)}`, type: 'festif', pub: 4500, env: 'ouvert_urbain', dur: 5, risk: 'moyen', delay: 15, budget: 550 },
        { nom: `Course Nature de la Saint-Valentin`, type: 'sport', pub: 1100, env: 'dynamique_course', dur: 4, risk: 'faible', delay: 12, budget: 310 },
        { nom: `Foire Agricole d'Hiver du ${deptInfo.name}`, type: 'foire', pub: 3800, env: 'ouvert_urbain', dur: 7, risk: 'faible', delay: 15, budget: 520 },
        { nom: `Meeting Indoor d'Athlétisme à ${getCommune(1)}`, type: 'sport', pub: 1600, env: 'ferme', dur: 5, risk: 'faible', delay: 10, budget: 380 },
        { nom: `Festival de Musique Acoustique en Salle`, type: 'culturel', pub: 1400, env: 'ferme', dur: 5, risk: 'faible', delay: 10, budget: 360 },
        { nom: `Soirée Étudiante & Gala d'Hiver`, type: 'festif', pub: 2800, env: 'ferme', dur: 6, risk: 'moyen', delay: 12, budget: 490 }
      ],
      2: [ // Mars
        { nom: `Semi-Marathon de ${getCommune(0)}`, type: 'sport', pub: 3200, env: 'dynamique_course', dur: 5, risk: 'moyen', delay: 12, budget: 580 },
        { nom: `Carnaval de Printemps & Cavalcade à ${getCommune(1)}`, type: 'festif', pub: 5000, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 15, budget: 620 },
        { nom: `Grande Foire Commerciale de Printemps`, type: 'foire', pub: 6500, env: 'ouvert_urbain', dur: 8, risk: 'faible', delay: 15, budget: 750 },
        { nom: `Cross des Écoles & Collèges à ${getCommune(2)}`, type: 'sport', pub: 900, env: 'dynamique_course', dur: 4, risk: 'faible', delay: 10, budget: 260 },
        { nom: `Salon des Vins et de la Gastronomie Régionale`, type: 'culturel', pub: 2400, env: 'ferme', dur: 6, risk: 'faible', delay: 12, budget: 420 },
        { nom: `Trail des Premières Fleurs`, type: 'sport', pub: 1400, env: 'dynamique_course', dur: 5, risk: 'moyen', delay: 18, budget: 410 }
      ],
      3: [ // Avril
        { nom: (deptInfo.code === '54' ? 'Foire Attractive de Nancy' : `Foire Attractive de ${getCommune(0)}`), type: 'foire', pub: 8500, env: 'ouvert_urbain', dur: 7, risk: 'moyen', delay: 15, budget: 950 },
        { nom: `10 km sur Route de ${getCommune(1)}`, type: 'sport', pub: 2100, env: 'dynamique_course', dur: 4, risk: 'moyen', delay: 12, budget: 440 },
        { nom: `Fête Médiévale & Chasse aux Œufs de Pâques`, type: 'festif', pub: 3400, env: 'ouvert_urbain', dur: 6, risk: 'faible', delay: 15, budget: 510 },
        { nom: `Tournoi Pascal de Football U15 à ${getCommune(2)}`, type: 'sport', pub: 1300, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 10, budget: 360 },
        { nom: `Rencontres Régionales de Danse & Spectacle`, type: 'culturel', pub: 1100, env: 'ferme', dur: 5, risk: 'faible', delay: 10, budget: 290 },
        { nom: `Randonnée du Printemps à ${getCommune(3)}`, type: 'sport', pub: 800, env: 'dynamique_course', dur: 4, risk: 'faible', delay: 20, budget: 240 }
      ],
      4: [ // Mai
        { nom: `Randonnée Cyclotouriste & Fête du Muguet`, type: 'sport', pub: 1500, env: 'dynamique_course', dur: 5, risk: 'faible', delay: 18, budget: 380 },
        { nom: `Nuit Européenne des Musées à ${getCommune(0)}`, type: 'culturel', pub: 2800, env: 'ouvert_urbain', dur: 5, risk: 'faible', delay: 10, budget: 410 },
        { nom: `Tournoi National de Rugby à 7 à ${getCommune(1)}`, type: 'sport', pub: 2600, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 12, budget: 520 },
        { nom: `Fête Foraine & Kermesse Patronale de ${getCommune(2)}`, type: 'festif', pub: 4200, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 15, budget: 580 },
        { nom: `Triathlon Régional du ${deptInfo.name}`, type: 'sport', pub: 2200, env: 'dynamique_course', dur: 6, risk: 'moyen', delay: 15, budget: 540 },
        { nom: `Foire aux Puces & Braderie de Printemps`, type: 'foire', pub: 3900, env: 'ouvert_urbain', dur: 7, risk: 'faible', delay: 12, budget: 480 }
      ],
      5: [ // Juin
        { nom: `Fête de la Musique - Scènes de ${getCommune(0)}`, type: 'festif', pub: 9500, env: 'ouvert_urbain', dur: 7, risk: 'élevé', delay: 15, budget: 1100 },
        { nom: `Fête de la Saint-Jean & Feu Traditionnel`, type: 'festif', pub: 3800, env: 'ouvert_urbain', dur: 5, risk: 'moyen', delay: 15, budget: 530 },
        { nom: `Marathon & Relais Entreprises de ${getCommune(1)}`, type: 'sport', pub: 4800, env: 'dynamique_course', dur: 7, risk: 'moyen', delay: 12, budget: 850 },
        { nom: `Festival Électro & Rock en Plein Air`, type: 'culturel', pub: 6000, env: 'ouvert_urbain', dur: 8, risk: 'élevé', delay: 15, budget: 980 },
        { nom: `Gala de Boxe & Muay-Thaï à ${getCommune(2)}`, type: 'sport', pub: 1900, env: 'ferme', dur: 5, risk: 'moyen', delay: 10, budget: 450 },
        { nom: `Raid Aventure & Course d'Orientation`, type: 'sport', pub: 1100, env: 'dynamique_course', dur: 5, risk: 'moyen', delay: 22, budget: 360 }
      ],
      6: [ // Juillet
        { nom: `Festivités du 14 Juillet & Feu d'Artifice de ${getCommune(0)}`, type: 'festif', pub: 12000, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 15, budget: 1250 },
        { nom: `Bal des Pompiers & Fête Populaire à ${getCommune(1)}`, type: 'festif', pub: 3500, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 12, budget: 520 },
        { nom: `Festival des Scènes d'Été & Guinguette`, type: 'culturel', pub: 4200, env: 'ouvert_urbain', dur: 6, risk: 'faible', delay: 12, budget: 540 },
        { nom: `Critérium Cycliste Professionnel à ${getCommune(2)}`, type: 'sport', pub: 5500, env: 'dynamique_course', dur: 5, risk: 'moyen', delay: 15, budget: 780 },
        { nom: `Traversée à la Nage en Eau Libre & Triathlon`, type: 'sport', pub: 1600, env: 'dynamique_course', dur: 5, risk: 'moyen', delay: 15, budget: 420 },
        { nom: `Tournoi Estival de Beach-Volley`, type: 'sport', pub: 1200, env: 'ouvert_urbain', dur: 5, risk: 'faible', delay: 10, budget: 310 }
      ],
      7: [ // Août
        { nom: `Fête de la Libération & Défilé Commémoratif`, type: 'festif', pub: 3600, env: 'ouvert_urbain', dur: 5, risk: 'faible', delay: 12, budget: 460 },
        { nom: `Nuit des Étoiles & Festival Astronomique à ${getCommune(0)}`, type: 'culturel', pub: 2500, env: 'ouvert_urbain', dur: 5, risk: 'faible', delay: 18, budget: 390 },
        { nom: `Fête Foraine Estivale de ${getCommune(1)}`, type: 'festif', pub: 5200, env: 'ouvert_urbain', dur: 7, risk: 'moyen', delay: 15, budget: 680 },
        { nom: `Trail Estival des Forêts du ${deptInfo.name}`, type: 'sport', pub: 1700, env: 'dynamique_course', dur: 6, risk: 'moyen', delay: 20, budget: 470 },
        { nom: `Festival International des Arts de la Rue`, type: 'culturel', pub: 6500, env: 'ouvert_urbain', dur: 7, risk: 'moyen', delay: 15, budget: 820 },
        { nom: `Régates & Fête Nautique à ${getCommune(2)}`, type: 'sport', pub: 2200, env: 'ouvert_urbain', dur: 5, risk: 'moyen', delay: 15, budget: 440 }
      ],
      8: [ // Septembre
        { nom: `Forum des Associations & Fête de la Ville de ${getCommune(0)}`, type: 'festif', pub: 4800, env: 'ouvert_urbain', dur: 6, risk: 'faible', delay: 12, budget: 550 },
        { nom: `Journées Européennes du Patrimoine à ${getCommune(1)}`, type: 'culturel', pub: 3800, env: 'ouvert_urbain', dur: 6, risk: 'faible', delay: 10, budget: 460 },
        { nom: `Braderie & Grande Brocante de Rentrée`, type: 'foire', pub: 7500, env: 'ouvert_urbain', dur: 8, risk: 'faible', delay: 15, budget: 890 },
        { nom: `Fête de la Mirabelle & des Vendanges`, type: 'festif', pub: 6000, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 15, budget: 740 },
        { nom: `Semi-Marathon & 10 km de Rentrée à ${getCommune(2)}`, type: 'sport', pub: 3100, env: 'dynamique_course', dur: 5, risk: 'moyen', delay: 12, budget: 560 },
        { nom: `Tournoi Interrégional de Rugby à XV`, type: 'sport', pub: 2800, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 10, budget: 510 }
      ],
      9: [ // Octobre
        { nom: `Course Solidaire Octobre Rose de ${getCommune(0)}`, type: 'sport', pub: 4200, env: 'dynamique_course', dur: 4, risk: 'faible', delay: 10, budget: 520 },
        { nom: `Soirée d'Halloween & Nuit des Frissons à ${getCommune(1)}`, type: 'festif', pub: 3200, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 15, budget: 490 },
        { nom: `Fête de la Châtaigne & Foire d'Automne`, type: 'foire', pub: 5100, env: 'ouvert_urbain', dur: 7, risk: 'faible', delay: 15, budget: 640 },
        { nom: `Nuit d'Intégration Étudiante & Concert`, type: 'festif', pub: 3500, env: 'ferme', dur: 6, risk: 'élevé', delay: 12, budget: 620 },
        { nom: `Trail Automnal des Feuilles Mortes`, type: 'sport', pub: 1600, env: 'dynamique_course', dur: 5, risk: 'moyen', delay: 18, budget: 430 },
        { nom: `Salon Départemental de l'Habitat et du Terroir`, type: 'foire', pub: 4500, env: 'ferme', dur: 7, risk: 'faible', delay: 12, budget: 580 }
      ],
      10: [ // Novembre
        { nom: `Commémorations du 11 Novembre & Défilé Solennel`, type: 'culturel', pub: 2200, env: 'ouvert_urbain', dur: 4, risk: 'faible', delay: 10, budget: 310 },
        { nom: `Cross Départemental Scolaire et Universitaire`, type: 'sport', pub: 1900, env: 'dynamique_course', dur: 5, risk: 'faible', delay: 12, budget: 370 },
        { nom: `Foire aux Vins & Terroirs de France à ${getCommune(0)}`, type: 'foire', pub: 4800, env: 'ferme', dur: 7, risk: 'faible', delay: 12, budget: 610 },
        { nom: `Soirée Beaujolais & Repas Festif des Aînés`, type: 'festif', pub: 1800, env: 'ferme', dur: 5, risk: 'faible', delay: 12, budget: 350 },
        { nom: `Open Régional de Tennis de Table à ${getCommune(1)}`, type: 'sport', pub: 850, env: 'ferme', dur: 6, risk: 'faible', delay: 10, budget: 270 },
        { nom: `Salon Geek, Manga & Pop-Culture`, type: 'culturel', pub: 4200, env: 'ferme', dur: 7, risk: 'moyen', delay: 12, budget: 590 }
      ],
      11: [ // Décembre
        { nom: (deptInfo.code === '54' ? 'Fêtes Traditionnelles de la Saint-Nicolas' : `Fêtes & Féeries de la Saint-Nicolas à ${getCommune(0)}`), type: 'festif', pub: 9800, env: 'ouvert_urbain', dur: 6, risk: 'moyen', delay: 15, budget: 1150 },
        { nom: `Marché de Noël & Patinoire Municipale de ${getCommune(1)}`, type: 'festif', pub: 6500, env: 'ouvert_urbain', dur: 7, risk: 'faible', delay: 12, budget: 820 },
        { nom: `Corrida Pédestre de Noël de ${getCommune(2)}`, type: 'sport', pub: 2400, env: 'dynamique_course', dur: 4, risk: 'moyen', delay: 10, budget: 460 },
        { nom: `Manifestation & Défis Sportifs du Téléthon`, type: 'sport', pub: 1900, env: 'ouvert_urbain', dur: 6, risk: 'faible', delay: 12, budget: 360 },
        { nom: `Concert de l'Avent & Chants Sacrés en Cathédrale`, type: 'culturel', pub: 1500, env: 'ferme', dur: 4, risk: 'faible', delay: 10, budget: 320 },
        { nom: `Réveillon Solidaire de la Saint-Sylvestre`, type: 'festif', pub: 1200, env: 'ferme', dur: 6, risk: 'moyen', delay: 12, budget: 380 }
      ]
    };

    const pool = seasonalPools[monthIndex % 12] || seasonalPools[5];
    
    // Attribution des 10 clés strictes requises pour chaque événement
    return pool.map((item, idx) => ({
      id: `evt-${deptInfo.code}-${monthIndex}-${idx + 1}`,
      nom: item.nom,
      commune: getCommune(idx),
      type: item.type,
      public_instantane: item.pub,
      environnement: item.env,
      duree_heures: item.dur,
      activite_risque: item.risk,
      delai_acces_secours_minutes: item.delay,
      budget_max_organisateur: item.budget
    }));
  },

  // Moteur d'évolution des crises majeures et plans d'urgence en temps réel
  progressCrisesEngine(game) {
    if (!game) game = window.game;
    if (window.ProtecCriseLogistique && typeof window.ProtecCriseLogistique.updateAllCrisesTick === 'function') {
      window.ProtecCriseLogistique.updateAllCrisesTick(game);
    }
  }
};

window.calculerPositionActuelle = function(mission, tempsActuel) {
  return window.ProtecSystems?.calculerPositionActuelle(mission, tempsActuel);
};

window.creerTimelineUrgence = function(game, mission, crewVolunteers, vehicle, baseStation) {
  return window.ProtecConventions?.creerTimelineUrgence(game, mission, crewVolunteers, vehicle, baseStation);
};

