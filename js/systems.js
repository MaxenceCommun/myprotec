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
          this.addRadioLog(game, t.vehicle.name, 3, `STATUT 3 : Sur les lieux. Dispositif en place pour « ${t.mission?.title} ».`);
          game.showToast('Arrivée sur les lieux', `${t.vehicle.name} est au contact. Statut 3 activé.`, 'green');
        } else if (t.statusTarget === 4) {
          this.addRadioLog(game, t.vehicle.name, 5, `STATUT 5 : Arrivée aux Urgences Hospitalières de secteur. Prise en charge médicale.`);
          game.showToast('Arrivée Urgences CHU', `${t.vehicle.name} est arrivé aux Urgences hospitalières. Relève effectuée.`, 'green');
        } else if (t.statusTarget === 6) {
          this.addRadioLog(game, t.vehicle.name, 1, `STATUT 1 : De retour à l’antenne. Véhicule disponible.`);
          game.showToast('Retour Antenne', `${t.vehicle.name} a regagné sa base. Véhicule disponible.`, 'blue');
        }

        if (typeof t.onArrival === 'function') {
          t.onArrival();
        }
      }
    }
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
    const hh = String(game.clock.hour).padStart(2, '0');
    const mm = String(game.clock.minute).padStart(2, '0');
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

    const badge = document.getElementById('badge-radio-dock');
    if (badge) badge.textContent = game.radioLogs.length;
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
    const temp = w.temp;
    const wind = w.windGusts || w.windSpeed || 0;
    const precip = w.precipitation || 0;

    let vigilance = 'green';
    let condition = 'sun';
    let alertTitle = 'Vigilance Verte - Conditions Nominales';
    let alertDesc = 'Aucune vigilance météorologique particulière sur le secteur. Les dispositifs de secours se déroulent normalement.';
    let phenomenon = 'nominal';

    // 1. Alertes Canicule / Très fortes chaleurs
    if (temp >= 35) {
      vigilance = 'red';
      condition = 'heat';
      phenomenon = 'canicule';
      alertTitle = 'Vigilance Rouge Canicule Extrême (Météo-France)';
      alertDesc = `Température extrême mesurée à ${temp}°C. Risque critique de malaises, déshydratations et insolations. Maraudes fraîcheur renforcées et points d'eau d'urgence requis.`;
    } else if (temp >= 30) {
      vigilance = 'orange';
      condition = 'heat';
      phenomenon = 'canicule';
      alertTitle = 'Vigilance Orange Canicule Préfectorale';
      alertDesc = `Fortes chaleurs mesurées à ${temp}°C. Surveillance accrue des personnes vulnérables, mise en place de tentes de déchoquage climatisées sur les DPS.`;
    } else if (temp >= 28) {
      vigilance = 'yellow';
      condition = 'heat';
      phenomenon = 'chaleur';
      alertTitle = 'Vigilance Jaune Chaleur & Coup de Chaud';
      alertDesc = `Température de ${temp}°C. Prévoyez des stocks d'eau supplémentaires pour les secouristes et le public.`;
    }
    // 2. Alertes Vents Violents / Tempête / Chutes d'arbres
    else if (wind >= 90) {
      vigilance = 'red';
      condition = 'wind';
      phenomenon = 'vent';
      alertTitle = 'Vigilance Rouge Vent Violent & Tempête';
      alertDesc = `Rafales enregistrées à plus de ${Math.round(wind)} km/h ! Chutes d'arbres sur chaussée, toitures arrachées et effondrements. Sécurisation immédiate des postes de secours.`;
    } else if (wind >= 65) {
      vigilance = 'orange';
      condition = 'wind';
      phenomenon = 'vent';
      alertTitle = 'Vigilance Orange Vents Forts & Chutes d’Arbres';
      alertDesc = `Rafales de vent à ${Math.round(wind)} km/h. Risque de chutes de branches, coupures de câbles électriques et accidents de la circulation.`;
    } else if (wind >= 50) {
      vigilance = 'yellow';
      condition = 'wind';
      phenomenon = 'vent';
      alertTitle = 'Vigilance Jaune Coups de Vent';
      alertDesc = `Rafales à ${Math.round(wind)} km/h. Attention aux barnums et structures légères sur les dispositifs extérieurs.`;
    }
    // 3. Alertes Pluie-Inondation / Crues / Orages violents
    else if ([95, 96, 99].includes(code) || (precip >= 15)) {
      vigilance = 'orange';
      condition = 'storm';
      phenomenon = 'inondation';
      alertTitle = 'Vigilance Orange Orages Violents & Inondations Rapides';
      alertDesc = 'Activité électrique intense, pluies diluviennes et risques de ruissellements urbains. Équipes en alerte pour pompage et évacuations.';
    } else if ([65, 82].includes(code) || (precip >= 8)) {
      vigilance = 'orange';
      condition = 'flood';
      phenomenon = 'inondation';
      alertTitle = 'Vigilance Orange Crues & Inondations (PCS)';
      alertDesc = 'Fortes précipitations continues. Déclenchement préventif du Plan Communal de Sauvegarde et préparation de Centres d’Accueil des Impliqués (CAI).';
    } else if ([51, 53, 55, 61, 63, 80, 81].includes(code)) {
      vigilance = 'yellow';
      condition = 'rain';
      phenomenon = 'pluie';
      alertTitle = 'Vigilance Jaune Pluie & Chaussée Glissante';
      alertDesc = 'Averses soutenues en cours. Risque d’aquaplaning et d’accidents de circulation accrus.';
    }
    // 4. Alertes Neige / Verglas / Grand Froid
    else if ([71, 73, 75, 77, 85, 86].includes(code) || (temp <= -3)) {
      vigilance = 'orange';
      condition = 'snow';
      phenomenon = 'grand_froid';
      alertTitle = 'Vigilance Orange Neige-Verglas & Grand Froid (Plan Hivernal)';
      alertDesc = `Chutes de neige et températures négatives (${temp}°C). Déclenchement du Plan Grand Froid : maraudes sociales nocturnes d'urgence et chaînes à neige obligatoires.`;
    } else if (temp <= 1) {
      vigilance = 'yellow';
      condition = 'snow';
      phenomenon = 'grand_froid';
      alertTitle = 'Vigilance Jaune Grand Froid';
      alertDesc = `Gelées matinales (${temp}°C). Maraudes renforcées pour distribuer duvets et boissons chaudes aux personnes sans abri.`;
    }
    // 5. Conditions Claires / Nuageuses / Brouillard
    else if ([45, 48].includes(code)) {
      condition = 'fog';
      alertTitle = 'Vigilance Jaune Brouillard Givrant';
      alertDesc = 'Visibilité très réduite sur les axes routiers. Vigilance maximale pour les conducteurs de VPSP.';
    } else if ([1, 2, 3].includes(code)) {
      condition = 'cloud';
    } else {
      condition = 'sun';
    }

    const previousVigilance = w.vigilance;
    w.vigilance = vigilance;
    w.condition = condition;
    w.alertTitle = alertTitle;
    w.alertDesc = alertDesc;
    w.alertPhenomenon = phenomenon;

    // Toast de notification si passage à une vigilance supérieure
    if (previousVigilance !== vigilance && ['yellow', 'orange', 'red'].includes(vigilance)) {
      const color = vigilance === 'red' ? 'red' : (vigilance === 'orange' ? 'orange' : 'amber');
      const vigLabels = { green: 'VERT', yellow: 'JAUNE', orange: 'ORANGE', red: 'ROUGE' };
      const vigFr = vigLabels[vigilance] || vigilance.toUpperCase();
      game.showToast(`Bulletin Météo-France (${vigFr})`, alertTitle, color);
    }
  },

  // Génération automatique d'urgences réactives liées aux alertes Météo-France
  triggerWeatherEmergencyMission(game) {
    if (!game.weather) return;
    const v = game.weather.vigilance;
    // Règle stricte : la vigilance jaune ne déclenche aucune mission d'urgence. Seules orange (peu de chance) et rouge (moyennement) peuvent déclencher.
    if (v === 'green' || v === 'yellow') return;

    // Maximum 2 missions météo actives à la fois
    const ongoingWeatherMissions = game.missions.filter(m => m.type === 'meteo' && ['planifie', 'ongoing'].includes(m.status));
    if (ongoingWeatherMissions.length >= 2) return;

    const base = game.stations[0] || { lat: 48.8566, lng: 2.3522, name: 'Antenne' };
    const meteoCoords = game.calculateRealisticMissionLocation ? game.calculateRealisticMissionLocation(base, 'meteo') : { lat: base.lat + 0.05, lng: base.lng + 0.05 };
    const pheno = game.weather.alertPhenomenon || 'inondation';

    let missionDef = null;

    if (pheno === 'inondation' || pheno === 'pluie') {
      const inondationVariants = [
        {
          title: 'Réquisition Préfecture : Évacuation & Accueil des Sinistrés (CAI)',
          desc: `Crue subite suite aux fortes pluies (${game.weather.precipitation || 12} mm/h). Le Préfet et la Mairie activent les plans de sauvegarde. La Préfecture réquisitionne la Protection Civile (AASC) pour armer un Centre d'Accueil des Impliqués (CAI) dans un gymnase et assister les personnes évacuées.`,
          urgency: 'haute',
          durMin: 35,
          reqVol: 4,
          ranks: ['CE', 'PSE2', 'PSE1'],
          vehs: ['VPSP', 'VL'],
          reward: 480
        },
        {
          title: 'Réquisition Préfecture : Reconnaissance Points Bas & Ravitaillement Hameaux Isolés',
          desc: `Crue majeure constatée par le SIDPC. Des lotissements sont coupés du réseau routier. Réquisition d’un équipage AASC pour reconnaissance, transport et distribution de vivres de première urgence aux riverains sinistrés.`,
          urgency: 'haute',
          durMin: 40,
          reqVol: 4,
          ranks: ['CE', 'PSE2', 'PSE1'],
          vehs: ['VTU', 'VPSP'],
          reward: 520
        }
      ];
      missionDef = inondationVariants[Math.floor(Math.random() * inondationVariants.length)];
    } else if (pheno === 'vent' || pheno === 'tempete') {
      const ventVariants = [
        {
          title: 'Réquisition Préfecture : Sécurisation d’Axe & Assistance Suite Tempête',
          desc: `Rafales mesurées à ${Math.round(game.weather.windGusts || 75)} km/h. Chute d’arbre sur véhicule et axe départemental bloqué. Le Centre Opérationnel Départemental (COD) sollicite l’engagement d’un équipage AASC avec lot de balisage et secours à personnes.`,
          urgency: 'critique',
          durMin: 30,
          reqVol: 3,
          ranks: ['CE', 'PSE2', 'PSE1'],
          vehs: ['VPSP'],
          reward: 450
        },
        {
          title: 'Réquisition Préfecture : Mise en Sécurité Riverains & Toitures Arrachées',
          desc: `Vents violents et dégâts matériels importants. Le SIDPC demande à la Protection Civile d'assister les services municipaux pour évacuer et mettre à l'abri les habitants vers la salle polyvalente communale.`,
          urgency: 'critique',
          durMin: 35,
          reqVol: 4,
          ranks: ['CE', 'PSE2', 'PSE1'],
          vehs: ['VTU', 'VL'],
          reward: 480
        }
      ];
      missionDef = ventVariants[Math.floor(Math.random() * ventVariants.length)];
    } else if (pheno === 'orage' || pheno === 'foudre') {
      missionDef = {
        title: 'Réquisition Préfecture : Orages Violents & Prise en Charge d’Urgence',
        desc: `Intense activité orageuse et foudroiement avec début d’incendie et coupure électrique générale. La Préfecture déclenche l’antenne AASC pour la prise en charge médico-psychologique de proximité et la mise à l’abri des familles.`,
        urgency: 'critique',
        durMin: 32,
        reqVol: 3,
        ranks: ['CE', 'PSE2', 'PSE1'],
        vehs: ['VPSP'],
        reward: 460
      };
    } else if (pheno === 'neige' || pheno === 'verglas') {
      missionDef = {
        title: 'Réquisition Préfecture : Naufragés de la Route & Épisode Hivernal',
        desc: `Verglas généralisé et axes bloqués. Sur ordre de la Préfecture (Cellule de Crise / COD), déploiement d’un dispositif AASC pour distribution de couvertures de survie, boissons chaudes et secours aux automobilistes bloqués.`,
        urgency: 'haute',
        durMin: 45,
        reqVol: 4,
        ranks: ['CE', 'PSE2', 'PSE1'],
        vehs: ['VTU', 'VPSP'],
        reward: 520
      };
    } else if (pheno === 'canicule' || pheno === 'chaleur') {
      missionDef = {
        title: 'Réquisition Préfecture : Plan Canicule & Maraude Sanitaire d’Urgence',
        desc: `Pic de canicule à ${Math.round(game.weather.temp)}°C. Réquisition préfectorale de l'antenne au titre des AASC : hydratation des personnes vulnérables, maraudes urbaines et premier bilan des malaises thermiques.`,
        urgency: 'normale',
        durMin: 40,
        reqVol: 3,
        ranks: ['PSE2', 'PSE1'],
        vehs: ['VPSP'],
        reward: 420
      };
    } else if (pheno === 'grand_froid') {
      missionDef = {
        title: 'Réquisition Préfecture : Plan Grand Froid & Hébergement d’Urgence',
        desc: `Ressenti glacial (${Math.round(game.weather.temp)}°C). La Préfecture active le niveau 2 du Plan Grand Froid et demande à la Protection Civile de renforcer le 115 pour la mise à l’abri et l'accueil en gymnase.`,
        urgency: 'normale',
        durMin: 45,
        reqVol: 3,
        ranks: ['PSE2', 'PSE1'],
        vehs: ['VL'],
        reward: 430
      };
    } else {
      missionDef = {
        title: 'Réquisition Préfecture : Assistance AASC Intempéries Dégradées',
        desc: `Vigilance météo départementale. La Préfecture sollicite l'antenne pour patrouilles de reconnaissance et soutien aux populations sinistrées.`,
        urgency: 'normale',
        durMin: 30,
        reqVol: 3,
        ranks: ['PSE1'],
        vehs: ['VL'],
        reward: 380
      };
    }

    const newWeatherMission = {
      id: `m-meteo-${Date.now()}`,
      type: 'meteo',
      categoryLabel: `Réquisition Préfectorale (AASC)`,
      title: `[Préalerte Préfecture] ${missionDef.title}`,
      desc: `🏛️ RÉQUISITION PRÉFECTORALE (AASC) : Face aux conditions météo (${game.weather.alertTitle}), le Préfet et le Centre Opérationnel Départemental (COD / SIDPC) sollicitent l'engagement de la Protection Civile au titre de ses agréments de Sécurité Civile. ${missionDef.desc} Mobilisez vos secouristes par SMS pour confirmer l'équipage disponible.`,
      lat: meteoCoords.lat,
      lng: meteoCoords.lng,
      scale: `Dispositif Réquisition AASC (${missionDef.reqVol} secouristes)`,
      eventDate: { ...game.clock, hour: game.clock.hour },
      durationSeconds: missionDef.durMin * 60,
      durationHours: (missionDef.durMin / 60).toFixed(1),
      requiredVolunteers: missionDef.reqVol,
      requiredRanks: missionDef.ranks,
      requiredVehicles: missionDef.vehs,
      rewardMoney: missionDef.reward,
      rewardReputation: 45,
      progress: 0,
      status: 'prealerte',
      alertOrigin: 'meteo',
      prealertSecondsLeft: 180,
      prealertTotalSec: 180,
      evolutionResolved: false,
      registeredVolunteers: [],
      assignedCrew: { volunteers: [], vehicles: [] },
      address: (game.generateRealisticStreetAddress ? game.generateRealisticStreetAddress(game.stations?.[0]?.city || 'Centre Urbain', newWeatherMission.lat, newWeatherMission.lng) : 'Poste de Commandement Météo'),
      isSector: false
    };

    if (game.enrichMissionLocationWithCity) {
      game.enrichMissionLocationWithCity(newWeatherMission);
    }

    game.missions.push(newWeatherMission);
    game.renderMissions();
    game.updateStatsUI();
    game.saveGame();

    const vigLabels = { green: 'VERT', yellow: 'JAUNE', orange: 'ORANGE', red: 'ROUGE' };
    const vigFr = vigLabels[game.weather.vigilance] || game.weather.vigilance.toUpperCase();

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'weather',
        `🏛️ RÉQUISITION PRÉFECTURE (AASC - ${vigFr})`,
        `Le Préfet requiert l'engagement de l'antenne : ${missionDef.title}. Mobilisez vos bénévoles par SMS !`,
        `meteo-${newWeatherMission.id}`
      );
    } else if (window.ProtecIncidents) {
      window.ProtecIncidents.sendSystemNotification(
        `🟡 PRÉALERTE PRÉFECTURALE (${game.weather.vigilance.toUpperCase()})`,
        `Vigilance Intempéries active. La Préfecture demande la pré-mobilisation d'une équipe pour : ${missionDef.title}. Lancez vos SMS !`,
        `meteo-${newWeatherMission.id}`
      );
    }
    game.showToast('Préalerte Préfecture', `Mise en veille : ${missionDef.title} ! Recensez vos secouristes.`, 'orange');
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
      if (game.weather.condition === 'heat') textEl.textContent = 'Canicule';
      else if (game.weather.condition === 'flood') textEl.textContent = 'Inondation';
      else if (game.weather.condition === 'storm') textEl.textContent = 'Orages';
      else if (game.weather.condition === 'wind') textEl.textContent = 'Grand Vent';
      else if (game.weather.condition === 'snow') textEl.textContent = 'Neige/Verglas';
      else if (game.weather.condition === 'rain') textEl.textContent = 'Pluie';
      else if (game.weather.condition === 'fog') textEl.textContent = 'Brouillard';
      else if (game.weather.condition === 'cloud') textEl.textContent = 'Nuageux';
      else textEl.textContent = cycle.periodLabel;
    }

    if (weatherWidget) {
      const vigLabels = { green: 'VERTE', yellow: 'JAUNE', orange: 'ORANGE', red: 'ROUGE' };
      const vigFr = vigLabels[game.weather.vigilance] || 'VERTE';
      weatherWidget.setAttribute('title', `Météo : ${currentTemp}°C • Vigilance ${vigFr} (${game.weather.alertTitle})`);
    }
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

    const hours = game.grants.totalVolunteerHours || 0;
    const estimatedAmount = Math.max(3000, Math.min(25000, Math.round(hours * 18 * 1.5)));

    game.grants.municipalDossierSubmitted = true;
    game.grants.lastGrantAwarded = estimatedAmount;
    game.resources.money += estimatedAmount;
    game.resources.reputationScore += 35;

    game.showToast('Subvention Accordée !', `La Mairie a voté une subvention de ${estimatedAmount.toLocaleString('fr-FR')} € valorisant vos ${hours}h d'engagement bénévole !`, 'green');
    game.updateStatsUI();
    game.saveGame();
    game.openModule('devis');
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
  }
};
