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
        oxygenBottles: 10,
        aedPads: 8,
        woundKits: 14,
        cervicalCollars: 6
      };
    }
    if (!game.weather) {
      game.weather = {
        condition: 'sun',
        temp: 21,
        vigilance: 'green', // 'green', 'yellow', 'orange', 'red'
        alertTitle: 'Vigilance Verte - Conditions Claires',
        alertDesc: 'Aucune vigilance météorologique particulière sur le département. Opérations régulières.',
        lastUpdateDay: 5
      };
    }
    if (!game.grants) {
      game.grants = {
        totalVolunteerHours: 42,
        municipalDossierSubmitted: false,
        lastGrantAwarded: 0,
        publicDonationsActive: false
      };
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

    // Polyline Leaflet sur la route
    const polyline = L.polyline(routeCoords, {
      color: statusTarget === 4 ? '#ef4444' : '#0284c7',
      weight: 4,
      opacity: 0.75,
      className: 'route-line-animated'
    }).addTo(game.map);

    // Marqueur du véhicule avec gyrophare clignotant
    const imgUrl = vehicle.image || (game.getVehicleImage ? game.getVehicleImage(vehicle.type) : `images/vehicles/${vehicle.type}.png`);
    const iconHtml = `
      <div class="vehicle-marker-container flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/95 border-2 ${statusTarget === 4 ? 'border-red-500' : 'border-pc-blue'} shadow-xl text-slate-800 text-[10px] font-black cursor-pointer">
        <div class="beacon-flash"></div>
        <img src="${imgUrl}" alt="${vehicle.name}" class="h-4 w-7 object-contain flex-shrink-0 drop-shadow-sm" onerror="this.outerHTML='🚑'" />
        <span class="tracking-tight">${vehicle.name}</span>
      </div>
    `;

    const icon = L.divIcon({
      html: iconHtml,
      className: 'vehicle-leaflet-icon',
      iconSize: [120, 32],
      iconAnchor: [60, 16]
    });

    const marker = L.marker(routeCoords[0], { icon: icon, zIndexOffset: 1000 }).addTo(game.map);
    marker.bindTooltip(`<strong>${vehicle.name}</strong><br>En route (${statusTarget === 4 ? 'Statut 4 : CHU' : 'Statut 2 : Intervention'})`, {
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
      routeCoords: routeCoords,
      currentStep: 0,
      polyline: polyline,
      marker: marker,
      onArrival: onArrivalCallback
    };

    game.transits.push(transit);

    // Bip radio et message de départ
    this.playRadioChirp();
    const statusLabel = statusTarget === 4 ? 'STATUT 4 : Transport CHU' : 'STATUT 2 : Départ en route';
    this.addRadioLog(game, vehicle.name, statusTarget, `${statusLabel} vers ${mission ? mission.title : 'Destination'}.`);
    game.showToast(statusLabel, `${vehicle.name} est en route sur le réseau routier.`, statusTarget === 4 ? 'orange' : 'blue');
  },

  updateTransits(game) {
    if (!game.transits || game.transits.length === 0) return;

    for (let i = game.transits.length - 1; i >= 0; i--) {
      const t = game.transits[i];
      t.currentStep += 1 * Math.max(1, game.speed);

      if (t.currentStep < t.routeCoords.length) {
        const nextPos = t.routeCoords[t.currentStep];
        t.marker.setLatLng(nextPos);
      } else {
        // Arrivée à destination
        t.marker.setLatLng(t.routeCoords[t.routeCoords.length - 1]);
        game.map.removeLayer(t.polyline);
        game.map.removeLayer(t.marker);
        game.transits.splice(i, 1);

        this.playRadioChirp();
        if (t.statusTarget === 2) {
          this.addRadioLog(game, t.vehicle.name, 3, `STATUT 3 : Sur les lieux. Dispositif en place pour « ${t.mission?.title} ».`);
          game.showToast('Arrivée sur les lieux', `${t.vehicle.name} est au contact. Statut 3 activé.`, 'green');
        } else if (t.statusTarget === 4) {
          this.addRadioLog(game, t.vehicle.name, 5, `STATUT 5 : Arrivée aux Urgences CHU. Dépôt de la fiche bilan.`);
          game.showToast('Arrivée CHU', `${t.vehicle.name} est aux Urgences du CHU. Bilan transmis.`, 'green');
        } else if (t.statusTarget === 6) {
          this.addRadioLog(game, t.vehicle.name, 1, `STATUT 1 : De retour à l’antenne. Véhicule disponible.`);
          game.showToast('Retour Antenne', `${t.vehicle.name} est rentré. Bionettoyage requis si transport.`, 'blue');
        }

        if (typeof t.onArrival === 'function') {
          t.onArrival();
        }
      }
    }
  },

  // Trouver l'hôpital le plus proche
  getNearestHospital(game, lat, lng) {
    const list = this.hospitals[game.currentCityKey] || this.hospitals.paris;
    let nearest = list[0];
    let minDist = 9999;
    list.forEach(h => {
      const d = Math.hypot(h.lat - lat, h.lng - lng);
      if (d < minDist) {
        minDist = d;
        nearest = h;
      }
    });
    return nearest;
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

    if (actionType === 'fuel') {
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
    } else if (actionType === 'mechanical') {
      const cost = 280;
      if (game.resources.money < cost) {
        game.showToast('Fonds insuffisants', `Révision garage : ${cost} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      v.mechanical = 100;
      game.showToast('Révision effectuée', `Contrôle technique et révision validés pour ${v.name}.`, 'green');
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
      tempOffset = -3 + p * 2;

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
      tempOffset = 1 - p * 2;
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
      tempOffset = -1 - p * 3;
      const r = Math.round(217 + (15 - 217) * p);
      const g = Math.round(119 + (23 - 119) * p);
      const b = Math.round(6 + (42 - 6) * p);
      const a = (0.12 + (0.42 - 0.12) * p).toFixed(3);
      color = `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    return { color, period, periodLabel, periodIcon, tempOffset };
  },

  updateWeatherAndDayNight(game) {
    const filterEl = document.getElementById('map-night-filter');
    const cycle = this.calculateDayNightCycle(game);

    // Application progressive du filtre atmosphérique sur la carte
    if (filterEl) {
      filterEl.style.backgroundColor = cycle.color;
    }

    // Événements de vigilance Météo-France tous les quelques jours
    if (game.clock.day !== game.weather.lastUpdateDay && game.clock.hour === 8) {
      game.weather.lastUpdateDay = game.clock.day;
      const roll = Math.random();
      if (roll < 0.15) {
        game.weather.vigilance = 'orange';
        game.weather.temp = 38;
        game.weather.condition = 'heat';
        game.weather.alertTitle = 'Vigilance Orange Canicule Préfectorale';
        game.weather.alertDesc = 'Fortes chaleurs (>38°C). Risque élevé de malaises sur les DPS. Renforcez les points d’eau et maraudes fraîcheur.';
        game.showToast('Alerte Météo-France', 'Passage en Vigilance ORANGE Canicule !', 'orange');
      } else if (roll < 0.23) {
        game.weather.vigilance = 'red';
        game.weather.temp = 16;
        game.weather.condition = 'flood';
        game.weather.alertTitle = 'Vigilance Rouge Crues & Inondations (PCS)';
        game.weather.alertDesc = 'Déclenchement du Plan Communal de Sauvegarde. Mobilisation générale pour l’ouverture de CAI et le pompage d’urgence.';
        game.showToast('Alerte Préfectorale MAJEURE', 'Vigilance ROUGE Inondations activée !', 'orange');
      } else if (roll < 0.45) {
        game.weather.vigilance = 'yellow';
        game.weather.temp = 19;
        game.weather.condition = 'rain';
        game.weather.alertTitle = 'Vigilance Jaune Orages & Pluie';
        game.weather.alertDesc = 'Averses soutenues. Prévoyez des bâches et du matériel étanche sur vos dispositifs.';
      } else {
        game.weather.vigilance = 'green';
        game.weather.temp = 22;
        game.weather.condition = 'sun';
        game.weather.alertTitle = 'Vigilance Verte - Conditions Nominales';
        game.weather.alertDesc = 'Conditions météorologiques calmes.';
      }
    }

    // Température affichée avec prise en compte du cycle diurne/nocturne naturel
    const currentTemp = game.weather.temp + cycle.tempOffset;

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
      else if (game.weather.condition === 'rain') iconEl.textContent = '🌧️';
      else iconEl.textContent = cycle.periodIcon;
    }

    if (badgeEl) {
      if (game.weather.vigilance === 'green') {
        badgeEl.className = 'px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800';
        badgeEl.textContent = 'Vert';
      } else if (game.weather.vigilance === 'yellow') {
        badgeEl.className = 'px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800';
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
      else if (game.weather.condition === 'flood') textEl.textContent = 'Crue / Inondation';
      else if (game.weather.condition === 'rain') textEl.textContent = 'Averses';
      else textEl.textContent = cycle.periodLabel;
    }

    if (weatherWidget) {
      weatherWidget.setAttribute('title', `Bulletin Météo-France : ${cycle.periodLabel} (${currentTemp}°C) • Vigilance ${game.weather.vigilance.toUpperCase()}`);
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

    const hours = game.grants.totalVolunteerHours || 40;
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
