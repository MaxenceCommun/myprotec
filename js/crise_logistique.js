/**
 * PROTEC LIVE - GESTION DES CRISES MAJEURES, MAIN COURANTE, RÉARMEMENT & SIMULATION AVANCÉE
 * 
 * 1. Main Courante Opérationnelle (Évolutions imprévisibles, sans heure de fin fixe sur les sinistres)
 * 2. Gestion des Rotations d'Équipes & Relèves (Gestion de la fatigue, stress et repos)
 * 3. Transit Réaliste en 2 Étapes :
 *    - Domicile ➔ Local d'antenne (à allure normale selon l'adresse du bénévole)
 *    - Local d'antenne ➔ Sinistre (à allure d'urgence +50% avec gyrophares)
 *    - Filtre Delta Max de départ (ex: max 30 min pour 1ère intention)
 * 4. Logistique Réelle & Réarmement Flotte :
 *    - Un VPSP non réarmé risque des pannes matérielles (baisse moral et réputation)
 *    - Missions de réarmement programmables avec un bénévole disponible
 *    - Vérification du nombre de places assises dans les véhicules engagés
 * 5. Scénarios Réalistes Préfecture / Gendarmerie / CUMP :
 *    - Recherche de personne disparue (Gendarmerie, PC mobile, drone thermique, chiens cyno, VLTT 4x4)
 *    - Crash aérien (CAI & CUMP, 50 impliqués)
 *    - Incendie EHPAD (Évacuation résidents VPSP & VTP)
 *    - Manifestation étudiante (Préalerte J-1, garde SDIS & astreinte)
 *    - Vigilance canicule SNCF (distribution en gare)
 *    - Tempête alerte rouge (renfort de 10 départements pour CHU et déblaiement)
 *    - Grand froid verglas (manque VSAV -> renfort garde SDIS en SUAP)
 * 6. Convention Mairie Partenaire : Local prêté contre 3 DPS offerts par an
 * 7. Devis avec Concurrence & Délai de Réflexion Réaliste
 * 8. Agrément & Recrutement Service Civique (jeunes 16-25 ans avec analyse de motivation)
 */

window.ProtecCriseLogistique = {
  // Constantes de configuration
  MAX_DELTA_DEFAULT: 30, // 30 minutes de distance max pour 1ère intention

  // Assainissement préventif et récupération automatique des crises et effectifs bloqués
  sanitizeAndRecoverStuckCrises(game) {
    if (!game) game = window.game;
    if (!game || !Array.isArray(game.missions)) return;
    const now = Date.now();

    // 1. Clôturer d'office toute crise qui a reçu l'ordre de fin de mission ou qui dépasse la durée opérationnelle normale
    game.missions.forEach(m => {
      if (!m || m.status !== 'ongoing') return;
      const isCrisisMission = m.isCrisis || ['crise', 'pompiers', 'samu', 'meteo'].includes(m.type);
      if (!isCrisisMission) return;

      const hasResolvedMsg = Array.isArray(m.operationalLog) && m.operationalLog.some(l => 
        l && typeof l.text === 'string' && (
          l.text.includes('Objectifs de mission pleinement atteints') || 
          l.text.includes('autorise la levée du dispositif') ||
          l.text.includes('Fin de mission')
        )
      );

      const elapsedMs = now - (m.startedAt || m.spawnedAt || now);
      const isOverdue = elapsedMs > 7200000; // Plus de 2 heures réelles pour une crise

      if (isOverdue) {
        console.warn(`[ProtecCriseLogistique] Auto-clôture de crise bloquée (> 2h): ${m.title} (${m.id})`);
        this.completeCrisisMission(game, m.id);
      }
    });

    // 2. Récupérer les bénévoles orphelins restés en statut 'mission' alors qu'aucune mission active ne les engage
    if (Array.isArray(game.volunteers)) {
      const activeOngoingMissionIds = new Set(
        game.missions.filter(m => ['ongoing', 'prealerte', 'declenche', 'en_cours', 'dispatched'].includes(m.status)).map(m => m.id)
      );

      game.volunteers.forEach(v => {
        if (v.status === 'mission') {
          const inValidMission = game.missions.some(m =>
            activeOngoingMissionIds.has(m.id) &&
            (m.id === v.currentMissionId || m.id === v.missionId || (m.registeredVolunteers || []).includes(v.id) || (m.assignedCrew?.volunteers || []).some(av => (typeof av === 'object' && av !== null ? av.id : av) === v.id))
          );

          if (!inValidMission) {
            v.status = 'disponible';
            v.currentMissionId = null;
            v.missionId = null;
            v.energy = Math.max(v.energy || 50, 75);
            v.stress = Math.min(v.stress || 20, 20);
          }
        }
      });
    }

    // 3. Récupérer les véhicules orphelins restés en statut 'mission'
    if (Array.isArray(game.vehicles)) {
      const activeOngoingMissionIds = new Set(
        game.missions.filter(m => ['ongoing', 'prealerte', 'declenche', 'en_cours', 'dispatched'].includes(m.status)).map(m => m.id)
      );

      game.vehicles.forEach(veh => {
        if (veh.status === 'mission') {
          const inValidMission = game.missions.some(m =>
            activeOngoingMissionIds.has(m.id) &&
            (m.id === veh.currentMissionId || m.id === veh.missionId || (m.assignedVehicles || []).includes(veh.id) || (m.assignedCrew?.vehicles || []).some(av => (typeof av === 'object' && av !== null ? av.id : av) === veh.id))
          );

          if (!inValidMission) {
            veh.status = 'disponible';
            veh.currentMissionId = null;
            veh.missionId = null;
          }
        }
      });
    }
  },

  // Initialisation de l'état
  injectState(game) {
    if (!game) return;
    this.sanitizeAndRecoverStuckCrises(game);

    if (!game.municipalPartnership) {
      game.municipalPartnership = {
        signed: false,
        freeDpsRequired: 3,
        freeDpsCompleted: 0,
        signedYear: new Date().getFullYear()
      };
    }

    if (!game.serviceCiviqueQuota) {
      game.serviceCiviqueQuota = {
        approved: false,
        maxSlots: 0,
        activeVolunteers: []
      };
    }

    if (!game.logisticTasks) {
      game.logisticTasks = [];
    }

    if (!game.activeCrises) {
      game.activeCrises = [];
    }

    if (!game.crisisReserve) {
      game.crisisReserve = {
        onBase: [], // IDs bénévoles en base
        astreinteDomicile: [] // IDs bénévoles en astreinte domicile
      };
    }

    // Assurer que les véhicules ont leur état de réarmement et places assises
    if (game.vehicles && Array.isArray(game.vehicles)) {
      game.vehicles.forEach(v => {
        if (v.isRearmed === undefined) v.isRearmed = true;
        if (!v.seatsCount || v.seatsCount === 4 && (v.type === 'VPSP' || v.type === 'PCM' || v.type === 'VL')) {
          if (v.capacity !== undefined) v.seatsCount = v.capacity;
          else if (v.type === 'VPSP' || v.name.includes('VPSP')) v.seatsCount = 5;
          else if (v.type === 'VTP' || v.name.includes('VTP')) v.seatsCount = 9;
          else if (v.type === 'VL' || v.name.includes('VL')) v.seatsCount = 4;
          else if (v.type === 'VTU' || v.name.includes('VTU')) v.seatsCount = 3;
          else if (v.type === 'PCM' || v.type === 'PC' || v.name.includes('PCM') || v.name.includes('PC')) v.seatsCount = 3;
          else if (v.type === 'VAHU' || v.name.includes('VAHU')) v.seatsCount = 3;
          else if (v.type === 'FLIT' || v.name.includes('FLIT')) v.seatsCount = 3;
          else if (v.type === 'VCYN' || v.name.includes('VCYN')) v.seatsCount = 3;
          else if (v.type === 'ERS' || v.name.includes('ERS')) v.seatsCount = 4;
          else if (v.type === 'MPS' || v.type === 'MOTO' || v.name.includes('MPS') || v.name.includes('Moto')) v.seatsCount = 2;
          else if (v.type === 'QUAD' || v.name.includes('Quad')) v.seatsCount = 2;
          else if (v.type === 'VTD' || v.name.includes('VTD')) v.seatsCount = 3;
          else if (v.type === 'VLTT' || v.type === 'VLHR' || v.name.includes('VLHR') || v.name.includes('4x4')) v.seatsCount = 4;
          else v.seatsCount = 4;
        }
      });
    }

    // Initialiser les adresses et temps de trajet des bénévoles
    if (game.volunteers && Array.isArray(game.volunteers)) {
      game.volunteers.forEach(v => {
        if (!v.travelTimeToStationMin) {
          const cities = ['Centre-ville', 'Quartier Nord', 'Faubourg Sud', 'Zone Est', 'Commune voisine', 'Périphérie', 'Hameau'];
          const city = cities[Math.floor(Math.random() * cities.length)];
          const km = Math.round((Math.random() * 14 + 1.5) * 10) / 10;
          v.homeAddress = `${Math.floor(Math.random() * 85) + 1} rue de la Paix, ${city}`;
          v.distance_base_km = km;
          v.temps_ralliement_minutes = Math.max(6, Math.round(km * 2.2 + Math.random() * 3));
          v.travelTimeToStationMin = v.temps_ralliement_minutes;
        }
        if (v.experience === undefined) {
          v.experience = v.rank === 'Chef de Dispositif' ? 85 : (v.rank === 'Chef de Poste' ? 70 : (v.rank === 'Chef d’Équipe' ? 55 : (v.rank === 'PSE2' ? 40 : 25)));
        }
        if (v.stress === undefined) v.stress = 5;
        if (v.stressResistance === undefined) {
          v.stressResistance = Math.min(95, Math.max(35, Math.round(40 + (v.experience * 0.45))));
        }
      });
    }
  },

  // =========================================================================
  // 1. CALCUL DU TRANSIT EN 2 ÉTAPES (DOMICILE ➔ LOCAL ➔ MISSION)
  // =========================================================================

  calculateConvergenceTimeMin(volunteers, maxDeltaMin = 30) {
    if (!volunteers || volunteers.length === 0) return 10;
    // Les bénévoles retenus : on prend le temps de trajet maximum pour réunir l'équipage
    const times = volunteers.map(v => v.travelTimeToStationMin || 12);
    const maxTime = Math.max(...times);
    return Math.min(maxDeltaMin + 15, maxTime);
  },

  // Vérifier la conformité des places assises des véhicules
  checkVehiclesSeatingCapacity(engagedVehicles, volunteersCount) {
    let totalSeats = 0;
    engagedVehicles.forEach(v => {
      totalSeats += (v.seatsCount || v.capacity || 4);
    });
    return {
      totalSeats,
      isSufficient: totalSeats >= volunteersCount,
      missingSeats: Math.max(0, volunteersCount - totalSeats)
    };
  },

  // =========================================================================
  // 2. MAIN COURANTE DES TRANSMISSIONS POUR CRISES & SINISTRES
  // =========================================================================

  // Initialiser la main courante d'une mission de crise
  initMissionOperationalLog(mission) {
    if (!mission.operationalLog) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      mission.operationalLog = [
        {
          timestamp: Date.now(),
          time: timeStr,
          source: 'CODIS / Préfecture',
          text: `Déclenchement initial de la Protection Civile : ${mission.title}.`,
          type: 'alert'
        },
        {
          timestamp: Date.now() + 1000,
          time: timeStr,
          source: 'Cadre d’Astreinte Protec',
          text: `Message de mission reçu. Phase 1 : Convergence des secouristes du domicile vers le local d’antenne en cours.`,
          type: 'info'
        }
      ];
      mission.rotationsCount = 0;
      mission.isCrisis = true;
    }
  },

  /**
   * Analyse détaillée et temps réel des moyens et effectifs engagés sur la mission de crise
   */
  getOperationalAssetsStatus(mission, game) {
    if (!mission) return { volsOnScene: 0, volsInTransit: 0, volsAtBase: 0, vpspOnScene: false, vpspInTransit: false, vpspAtBase: false, logOnScene: false, logInTransit: false, logAtBase: false, hasAnyOnScene: false, hasAnyAssetDeparted: false, anyTeamDeployed: false };
    const g = game || window.game;
    const now = Date.now() + (g?.serverTimeOffset || 0);

    let volsOnScene = 0;
    let volsInTransit = 0;
    let volsAtBase = 0;
    let vpspOnScene = false;
    let vpspInTransit = false;
    let vpspAtBase = false;
    let logOnScene = false;
    let logInTransit = false;
    let logAtBase = false;
    let anyTeamDeployed = false;
    let hasAnyAssetDeparted = false;

    const logTypes = ['VTU', 'LOG', 'VLOG', 'PMA', 'FOURGON', 'VTP', 'REMORQUE', 'CAMION'];

    // 1. Analyse des équipes de crise déployées avec timeline
    if (mission.crisisTeamDeployments && typeof mission.crisisTeamDeployments === 'object') {
      Object.values(mission.crisisTeamDeployments).forEach(dep => {
        if (!dep) return;
        anyTeamDeployed = true;
        const veh = dep.assignedVeh || (g?.vehicles || []).find(v => v.id === dep.vehicleId);
        const vType = (veh?.type || '').toUpperCase();
        const vName = (veh?.name || '').toUpperCase();
        const isVpsp = vType === 'VPSP' || vName.includes('VPSP');
        const isLog = logTypes.some(t => vType.includes(t) || vName.includes(t)) || vName.includes('LOGISTIQUE') || vName.includes('MATÉRIEL') || vName.includes('MATERIEL');

        const isOnScene = dep.status === 'sur_les_lieux' || (dep.crisisArrivalAt && now >= dep.crisisArrivalAt);
        const isInTransit = dep.status === 'en_route_gyros' || dep.status === 'en_route_normal' || 
          (dep.vehicleDepartureAt && now >= dep.vehicleDepartureAt && (!dep.crisisArrivalAt || now < dep.crisisArrivalAt));
        const isAtBase = dep.status === 'armement_2min' || 
          (dep.maxArrivalBaseAt && now >= dep.maxArrivalBaseAt && (!dep.vehicleDepartureAt || now < dep.vehicleDepartureAt));

        if (isOnScene) {
          volsOnScene += (dep.volunteersCount || 0);
          if (isVpsp) vpspOnScene = true;
          if (isLog) logOnScene = true;
          hasAnyAssetDeparted = true;
        } else if (isInTransit) {
          volsInTransit += (dep.volunteersCount || 0);
          if (isVpsp) vpspInTransit = true;
          if (isLog) logInTransit = true;
          hasAnyAssetDeparted = true;
        } else if (isAtBase) {
          volsAtBase += (dep.volunteersCount || 0);
          if (isVpsp) vpspAtBase = true;
          if (isLog) logAtBase = true;
        }
      });
    }

    // 2. Détection via les véhicules directement affectés à la mission
    const assignedVehs = (mission.assignedCrew?.vehicles || mission.vehicles || []).map(v => {
      const id = typeof v === 'object' ? v.id : v;
      return (g?.vehicles || []).find(veh => veh.id === id) || (typeof v === 'object' ? v : null);
    }).filter(Boolean);

    assignedVehs.forEach(v => {
      const vType = (v.type || '').toUpperCase();
      const vName = (v.name || '').toUpperCase();
      const isVpsp = vType === 'VPSP' || vName.includes('VPSP');
      const isLog = logTypes.some(t => vType.includes(t) || vName.includes(t)) || vName.includes('LOGISTIQUE') || vName.includes('MATÉRIEL') || vName.includes('MATERIEL');

      const inTransitActive = (g?.transits || []).some(t => (t.vehicleId === v.id || t.vehicle?.id === v.id) && t.statusTarget === 2);
      if (v.status === 'sur_les_lieux' || v.status === 'intervention') {
        if (!inTransitActive) {
          if (isVpsp) vpspOnScene = true;
          if (isLog) logOnScene = true;
          hasAnyAssetDeparted = true;
        } else {
          if (isVpsp) vpspInTransit = true;
          if (isLog) logInTransit = true;
          hasAnyAssetDeparted = true;
        }
      } else if (inTransitActive || v.status === 'transit') {
        if (isVpsp) vpspInTransit = true;
        if (isLog) logInTransit = true;
        hasAnyAssetDeparted = true;
      }
    });

    const hasAnyOnScene = volsOnScene > 0 || vpspOnScene || logOnScene;

    return {
      anyTeamDeployed,
      volsOnScene,
      volsInTransit,
      volsAtBase,
      vpspOnScene,
      vpspInTransit,
      vpspAtBase,
      logOnScene,
      logInTransit,
      logAtBase,
      hasAnyOnScene,
      hasAnyAssetDeparted
    };
  },

  // Évolution de la main courante pendant le sinistre
  progressCrisisMission(game, mission) {
    if (!mission || mission.status !== 'ongoing') return;

    // Si la crise a été déclarée prête à clôturer par le COS :
    // Ne plus rien ajouter et laisser le directeur décider de la clôture
    if (mission.crisisCanClose) {
      return;
    }

    if (!mission.operationalLog) this.initMissionOperationalLog(mission);
    this.sanitizeOperationalLogs(mission, game);

    const now = Date.now();
    if (!mission.lastLogUpdate) mission.lastLogUpdate = now;

    // CADENCE RÉALISTE : Intervalle d'au moins 120 à 180 secondes réelles (2 à 3 minutes) entre les messages
    const updateIntervalMs = 120000;
    if (now - mission.lastLogUpdate < updateIntervalMs) {
      return;
    }

    mission.lastLogUpdate = now;
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const assets = this.getOperationalAssetsStatus(mission, game);

    // Fatigue et stress progressifs UNIQUEMENT pour les secouristes réellement présents sur le terrain
    if (assets.volsOnScene > 0) {
      const onSceneVolIds = new Set();
      if (mission.crisisTeamDeployments) {
        Object.values(mission.crisisTeamDeployments).forEach(dep => {
          if (dep && (dep.status === 'sur_les_lieux' || (dep.crisisArrivalAt && now >= dep.crisisArrivalAt))) {
            (dep.volunteerIds || []).forEach(id => onSceneVolIds.add(id));
          }
        });
      }
      game.volunteers.filter(v => onSceneVolIds.has(v.id)).forEach(v => {
        v.energy = Math.max(5, (v.energy || 80) - 2);
        const stressInc = (100 - (v.stressResistance || 50)) > 40 ? 3 : 1;
        v.stress = Math.min(100, (v.stress || 10) + stressInc);
      });
    }

    // Génération du prochain message adapté au statut des moyens
    const entry = this.generateNextLogEntry(mission, timeStr, assets.volsOnScene, game, assets);
    if (entry) {
      mission.operationalLog.unshift(entry);
      if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();

      if (entry.type === 'milestone') {
        game.showToast('Main Courante : Évolution', `${mission.title} : ${entry.text}`, 'blue');
      }
    }

    // Résolution finale du sinistre par le COS UNIQUEMENT SI :
    // 1. Des moyens et effectifs Protec sont réellement sur place
    // 2. Si incendie ou crise sanitaire : le VPSP a été sur place et a opéré
    // 3. Durée réelle minimale de 12 à 15 minutes réelles écoulée
    // 4. Au moins 6 entrées radio significatives enregistrées
    const crisisDurationMs = now - (mission.startedAt || mission.spawnedAt || now);
    const minCrisisDurationMs = 12 * 60 * 1000; // 12 minutes réelles minimum

    const titleLower = (mission.title || '').toLowerCase();
    const typeLower = (mission.crisisType || '').toLowerCase();
    const isFireOrSanitary = titleLower.includes('feu') || titleLower.includes('incendie') || titleLower.includes('ehpad') || typeLower.includes('feu');
    const requiredVpspCheck = isFireOrSanitary ? assets.vpspOnScene : true;

    if (
      assets.hasAnyOnScene &&
      requiredVpspCheck &&
      crisisDurationMs >= minCrisisDurationMs &&
      mission.operationalLog.length >= 6
    ) {
      this.triggerCrisisResolution(game, mission);
    }
  },

  // Vérifie si un véhicule logistique / matériel est présent sur les lieux
  isLogisticsVehicleOnScene(mission, game) {
    return this.getOperationalAssetsStatus(mission, game).logOnScene;
  },

  // Assainissement préventif des logs existants pour garantir la logique opérationnelle
  sanitizeOperationalLogs(mission, game) {
    if (!mission || !Array.isArray(mission.operationalLog)) return;
    const assets = this.getOperationalAssetsStatus(mission, game);

    // RÈGLE 1 : Si le VPSP n'est pas sur les lieux, aucune prise en charge sanitaire au CAI par le VPSP
    if (!assets.vpspOnScene) {
      mission.operationalLog.forEach(l => {
        if (!l || typeof l.text !== 'string') return;
        if (
          l.text.includes('Prise en charge sanitaire au CAI') || 
          l.text.includes('oxygénothérapie normobarre') || 
          l.text.includes('Bilans transmis à la régulation 15')
        ) {
          if (assets.vpspInTransit) {
            l.source = 'PC Radio Protec';
            l.text = 'VPSP Protec en transit routier vers le sinistre (Statut 2). Implantation du CAI en cours de préparation sur place.';
            l.type = 'info';
          } else {
            l.source = 'COS Sapeurs-Pompiers';
            l.text = 'Sauvetages et reconnaissances sous ARI en cours. En attente du départ et de l’arrivée du VPSP Protection Civile pour l’armement sanitaire du CAI.';
            l.type = 'info';
          }
        }
      });
    }

    // RÈGLE 2 : Si aucun moyen Protec n'est encore sur les lieux, aucune action Protec sur site
    if (!assets.hasAnyOnScene) {
      mission.operationalLog.forEach(l => {
        if (!l || typeof l.text !== 'string') return;
        if (l.text.includes('résidents sinistrés recensés') || l.text.includes('Distribution de couvertures isothermiques')) {
          l.source = 'Cellule de Crise Mairie';
          l.text = 'Gymnase communal réquisitionné et ouvert par l’astreinte municipale. En attente de l’arrivée des secouristes Protec pour l’accueil.';
          l.type = 'info';
        }
        if (l.text.includes('Point ravitaillement opérationnel') || l.text.includes('réhydratation et collations')) {
          l.source = 'CODIS 18';
          l.text = 'Soutien sanitaire et logistique associative sollicités au front d’attaque. En attente de l’engagement des vecteurs associatifs.';
          l.type = 'info';
        }
        if (l.text.includes('Foyer principal circonscrit') && l.text.includes('Prise en charge des sinistrés achevée')) {
          l.source = 'CODIS 18';
          l.text = 'Sauvetages et reconnaissances toujours en cours dans les étages. Les sapeurs-pompiers poursuivent l’attaque du sinistre.';
          l.type = 'info';
        }
      });
    }

    // RÈGLE 3 : Pas de montage de lits sans vecteur logistique sur place
    if (!assets.logOnScene) {
      mission.operationalLog.forEach(l => {
        if (l && typeof l.text === 'string' && (l.text.includes('Montage de 50 lits') || (l.text.includes('lits de camp') && l.text.includes('installés')))) {
          l.source = 'Responsable CAI Protec';
          l.text = 'Hall sécurisé et zone de repli balisée. En attente de l’arrivée du véhicule logistique (VTU/LOG) pour débuter le montage des lits de camp.';
          l.type = 'info';
        }
      });
    }

    // RÈGLE 4 : Élimination des mentions erronées de pompage sur les feux
    const title = (mission.title || '').toLowerCase();
    const desc = (mission.desc || mission.scenarioText || '').toLowerCase();
    const cType = (mission.crisisType || '').toLowerCase();
    const allText = `${title} ${desc} ${cType}`;
    const isFire = allText.includes('feu') || allText.includes('incendie') || allText.includes('immeuble') || allText.includes('habitation') || allText.includes('ehpad');
    const isFlood = allText.includes('inondation') || allText.includes('crue') || allText.includes('submersion') || allText.includes('pompage');
    if (isFire && !isFlood) {
      mission.operationalLog.forEach(l => {
        if (l && typeof l.text === 'string' && l.text.toLowerCase().includes('pompage')) {
          l.source = 'PC de Crise CODIS 18';
          l.text = 'Dispositif de lutte contre les flammes actif. Équipes associatives en soutien accueil et premier secours.';
        }
      });
    }
  },

  generateNextLogEntry(mission, timeStr, volsCount, game, inputAssets) {
    this.sanitizeOperationalLogs(mission, game);

    const logs = mission.operationalLog || [];
    const assets = inputAssets || this.getOperationalAssetsStatus(mission, game || window.game);
    const hasLogOnScene = assets.logOnScene;
    const hasVpspOnScene = assets.vpspOnScene;
    const hasAnyOnScene = assets.hasAnyOnScene;
    const hasDeparted = assets.hasAnyAssetDeparted;
    const volsOnScene = assets.volsOnScene;

    const title = (mission.title || '').toLowerCase();
    const desc = (mission.desc || mission.scenarioText || '').toLowerCase();
    const cType = (mission.crisisType || '').toLowerCase();
    const authority = (mission.authority || mission.authorityLabel || mission.alertOrigin || '').toLowerCase();
    const allText = `${title} ${desc} ${cType} ${authority}`;

    const isFire = cType === 'feu_immeuble' || cType === 'incendie_ehpad' ||
      allText.includes('feu') || allText.includes('incendie') || allText.includes('immeuble') ||
      allText.includes('habitation') || allText.includes('flamme') || allText.includes('fumée') || allText.includes('ehpad');

    const isFlood = cType === 'inondation_lotissements' || cType === 'tempete_rouge' ||
      allText.includes('inondation') || allText.includes('crue') || allText.includes('submersion') ||
      allText.includes('pompage') || allText.includes('tempête') || allText.includes('ruissellement') ||
      allText.includes('eaux chargées') || allText.includes('motopompe');

    const isNovi = cType === 'accident_novi' || allText.includes('novi') || allText.includes('carambolage') ||
      allText.includes('accident') || allText.includes('autocar') || allText.includes('collision') ||
      allText.includes('multiples victimes') || allText.includes('pma');

    const isTrain = cType === 'tgv_bloque' || allText.includes('tgv') || allText.includes('sncf') ||
      allText.includes('train') || allText.includes('ferroviaire') || allText.includes('voyageur') ||
      allText.includes('gare') || allText.includes('caténaire');

    const isSearch = cType === 'recherche_disparu' || cType === 'recherche_foret' ||
      allText.includes('recherche') || allText.includes('disparu') || allText.includes('battue') ||
      allText.includes('cyno') || allText.includes('forêt') || allText.includes('boisée');

    const isCrash = cType === 'crash_aerien' || allText.includes('crash') || allText.includes('aérien') || allText.includes('avion');

    let pool = [];

    // =========================================================================
    // PHASE 1 : AUCUN MOYEN PROTEC N'A QUITTÉ LA BASE (!hasDeparted)
    // =========================================================================
    if (!hasDeparted) {
      if (isFire) {
        pool = [
          {
            source: 'PC de Crise CODIS 18',
            text: 'Important incendie urbain en cours. Plusieurs lances en manœuvre. Demande de renfort associatif confirmée auprès de la Protec. En attente du départ de vos moyens depuis la base.',
            type: 'info'
          },
          {
            source: 'COS Sapeurs-Pompiers',
            text: 'Sauvetages et reconnaissances dans les étages sous ARI. Sinistrés évacués regroupés sur le trottoir sous la pluie. Besoin urgent de l’ouverture d’un Centre d’Accueil (CAI) dès votre arrivée.',
            type: 'info'
          },
          {
            source: 'Cellule de Crise Mairie',
            text: 'Gymnase communal déverrouillé par l’astreinte municipale. Les services municipaux attendent l’arrivée de la Protection Civile pour structurer l’accueil.',
            type: 'info'
          },
          {
            source: 'Cadre d’Astreinte Protec',
            text: 'Rassemblement et équipement des effectifs à l’antenne. Validez le départ des vecteurs (VPSP et logistique) dès armement complet.',
            type: 'alert'
          }
        ];
      } else if (isFlood) {
        pool = [
          {
            source: 'PC de Crise CODIS / Mairie',
            text: 'Montée rapide des eaux constatée sur les points bas. Demande de renfort associatif transmise à la Protec. En attente du départ de vos effectifs.',
            type: 'info'
          },
          {
            source: 'Sauveteurs Nautiques SDIS',
            text: 'Reconnaissances en barque engagées. Plusieurs dizaines d’habitants isolés. Les pompiers sollicitent la Protec pour l’hébergement d’urgence dès votre mise en route.',
            type: 'info'
          },
          {
            source: 'Cadre d’Astreinte Protec',
            text: 'Préparation des lots d’épuisement et vérification des paquetages à la base. Déclenchez le transit dès que les conducteurs sont en place.',
            type: 'alert'
          }
        ];
      } else if (isNovi || isCrash) {
        pool = [
          {
            source: 'Régulation SAMU 15 / CODIS',
            text: 'Accident grave à cinétique violente. Plan NOVI déclenché. Demande d’engagement de vos vecteurs VPSP et soutien logistique. En attente de confirmation de départ.',
            type: 'info'
          },
          {
            source: 'Médecin Chef PMA',
            text: 'Reconnaissances médicales sur la zone de choc. Tri sommaire en cours. Fort besoin de renforts sanitaires associatifs pour la prise en charge et la noria.',
            type: 'info'
          },
          {
            source: 'Cadre d’Astreinte Protec',
            text: 'Mobilisation d’urgence à l’antenne. Armez le VPSP et engagez le départ sur ordre du régulateur.',
            type: 'alert'
          }
        ];
      } else if (isTrain) {
        pool = [
          {
            source: 'Direction de Crise SNCF',
            text: 'Rame immobilisée en pleine voie. Des centaines de voyageurs bloqués. Convention de secours activée. En attente du départ de vos équipes pour la gare.',
            type: 'info'
          },
          {
            source: 'Cadre d’Astreinte Protec',
            text: 'Chargement des packs d’eau et couvertures à l’antenne. En attente de l’ordre de départ du véhicule d’intervention.',
            type: 'alert'
          }
        ];
      } else if (isSearch) {
        pool = [
          {
            source: 'Commandement Gendarmerie',
            text: 'Battue opérationnelle planifiée. Point de rassemblement des moyens fixé au PC Gendarmerie. En attente de l’engagement de vos effectifs depuis l’antenne.',
            type: 'info'
          },
          {
            source: 'Cadre d’Astreinte Protec',
            text: 'Briefing topo et vérification des tenues de terrain à l’antenne. Confirmez le départ des véhicules.',
            type: 'alert'
          }
        ];
      } else {
        pool = [
          {
            source: 'PC de Crise / Autorités',
            text: 'Événement majeur en cours sur le secteur. Les services de secours sollicitent l’appui de la Protection Civile. En attente du départ de vos moyens depuis la base.',
            type: 'info'
          },
          {
            source: 'Commandement Opérationnel',
            text: 'Dispositif de sécurité en place sur le terrain. Les autorités attendent la confirmation du départ de vos premiers effectifs.',
            type: 'info'
          },
          {
            source: 'Cadre d’Astreinte Protec',
            text: 'Préparation et vérification des équipements à l’antenne. Procédez au départ des vecteurs pour engager la mission.',
            type: 'alert'
          }
        ];
      }
    }

    // =========================================================================
    // PHASE 2 : MOYENS EN TRANSIT ROUTIER, AUCUN SUR PLACE (hasDeparted && !hasAnyOnScene)
    // =========================================================================
    else if (!hasAnyOnScene) {
      pool = [
        {
          source: 'Vecteur Protec en transit',
          text: 'Équipage Protec en transit routier (Statut 2). Progression ralentie par la circulation dense. ETA estimé à quelques minutes.',
          type: 'info'
        },
        {
          source: 'PC de Crise CODIS 18',
          text: 'CODIS bien reçu le départ et le transit de vos premiers moyens. Le COS sur place est prévenu de votre approche et prépare le guidage.',
          type: 'info'
        },
        {
          source: 'Police Municipale / Forces de l’Ordre',
          text: 'Périmètre sécurisé et jalonnement des accès activé pour fluidifier l’arrivée des véhicules de la Protection Civile sur la zone d’implantation.',
          type: 'info'
        },
        {
          source: 'COS sur place',
          text: 'Point de situation sur site : impliqués regroupés sous préau ou zone protégée. Nous attendons votre premier échelon pour organiser l’accueil.',
          type: 'info'
        }
      ];
    }

    // =========================================================================
    // PHASE 3 : MOYENS SUR SITE MAIS AUCUN VPSP SUR PLACE (hasAnyOnScene && !hasVpspOnScene)
    // =========================================================================
    else if (!hasVpspOnScene) {
      if (isFire) {
        pool = [
          {
            source: 'Chef de Dispositif Protec',
            text: `Échelon Protec sur les lieux (${volsOnScene} secouristes sur site). Prise de contact avec le COS et ouverture du Centre d’Accueil des Impliqués (CAI) dans le gymnase.`,
            type: 'info'
          },
          {
            source: 'Gestionnaire CAI Protec',
            text: 'Accueil et recensement des familles évacuées : distribution de réconfort, boissons chaudes et couvertures de survie. En attente de l’arrivée du VPSP pour débuter les bilans sanitaires.',
            type: 'info'
          },
          {
            source: 'Logistique Protec',
            text: hasLogOnScene
              ? 'Véhicule logistique sur place : déchargement des lits de camp, barnums et éclairages pour aménager la zone de repos du gymnase.'
              : 'Espace d’accueil sommaire mis en place. En attente de l’arrivée du véhicule logistique (VTU/LOG) pour déployer les lits de camp.',
            type: hasLogOnScene ? 'milestone' : 'info'
          },
          {
            source: 'COS Sapeurs-Pompiers',
            text: 'Attaque du feu maintenue par les sapeurs-pompiers. Le regroupement des personnes sinistrées au gymnase par la Protec soulage considérablement le dispositif incendie.',
            type: 'info'
          }
        ];
      } else if (isFlood) {
        pool = [
          {
            source: 'Chef de Dispositif Protec',
            text: `Échelon Protec sur place (${volsOnScene} intervenants). Prise de contact avec la mairie et ouverture du Centre d’Hébergement d’Urgence (CHU).`,
            type: 'info'
          },
          {
            source: 'Gestionnaire CHU Protec',
            text: hasLogOnScene
              ? 'Matériel logistique au contact : lits de camp déployés, distribution de vêtements secs et collations chaudes aux sinistrés.'
              : 'Accueil au sec des personnes évacuées. En attente du véhicule logistique pour le montage des lits de camp.',
            type: hasLogOnScene ? 'milestone' : 'info'
          },
          {
            source: 'Équipe Pompage Protec',
            text: 'Reconnaissance des caves et sous-sols prioritaires. Mise en batterie des motopompes sur les points bas accessibles.',
            type: 'milestone'
          }
        ];
      } else {
        pool = [
          {
            source: 'Chef de Dispositif Protec',
            text: `Moyens Protec arrivés sur place (${volsOnScene} intervenants engagés). Prise de contact avec le commandement et mise en place de la zone de soutien.`,
            type: 'info'
          },
          {
            source: 'Gestionnaire Terrain Protec',
            text: 'Accueil des impliqués, soutien moral et distribution d’eau. En attente du vecteur VPSP pour les bilans sanitaires et soins.',
            type: 'info'
          },
          {
            source: 'Logistique Protec',
            text: hasLogOnScene
              ? 'Véhicule logistique sur les lieux : matériel déchargé et zone de soutien pleinement opérationnelle.'
              : 'Zone d’accueil sécurisée. En attente du vecteur logistique pour compléter l’équipement.',
            type: hasLogOnScene ? 'milestone' : 'info'
          }
        ];
      }
    }

    // =========================================================================
    // PHASE 4 : VPSP SUR LES LIEUX (hasVpspOnScene) - Pleine capacité opérationnelle
    // =========================================================================
    else {
      if (isFire) {
        pool = [
          {
            source: 'Équipage VPSP / CAI',
            text: 'VPSP positionné au gymnase : armement du point sanitaire. Prise en charge des personnes incommodées par les fumées sous oxygénothérapie normobarre. Bilans transmis au 15.',
            type: 'milestone'
          },
          {
            source: 'Chef de Dispositif Protec',
            text: `Point de situation global : ${volsOnScene} intervenants Protec actifs. Tous les sinistrés sont au chaud, recensés et pris en charge au CAI.`,
            type: 'info'
          },
          {
            source: 'Soutien Sanitaire SDIS',
            text: 'Point de réhabilitation opérationnel : réhydratation, collations énergétiques et surveillance physiologique fournies aux binômes sapeurs-pompiers.',
            type: 'info'
          },
          {
            source: 'Cellule de Crise Mairie',
            text: 'Foyer principal circonscrit par les sapeurs-pompiers. Prise en charge des sinistrés achevée et relogements d’urgence organisés par la municipalité.',
            type: 'success'
          }
        ];
      } else if (isFlood) {
        pool = [
          {
            source: 'Équipage VPSP Protec',
            text: 'VPSP opérationnel au CHU : bilans de réchauffement pour les personnes en hypothermie légère et surveillance médicale rapprochée.',
            type: 'milestone'
          },
          {
            source: 'Gestionnaire CHU Protec',
            text: hasLogOnScene
              ? 'Capacité d’accueil du CHU saturée mais maîtrisée : tous les sinistrés disposent d’un lit de camp, repas chaud et kit d’hygiène.'
              : 'Accueil des sinistrés stabilisé au sec. Soins de confort et soutien moral assurés.',
            type: hasLogOnScene ? 'milestone' : 'info'
          },
          {
            source: 'Équipe Pompage Protec',
            text: 'Épuisement des locaux techniques et habitations inondées mené avec succès en liaison avec le SDIS.',
            type: 'milestone'
          },
          {
            source: 'Vigilance Crues & SIDPC',
            text: 'Amorçage confirmé de la décrue. Poursuite du nettoyage et sécurisation des habitations. Dispositif en voie de stabilisation.',
            type: 'success'
          }
        ];
      } else if (isNovi || isCrash) {
        pool = [
          {
            source: 'Médecin Chef PMA',
            text: 'PMA armé. Équipages Protec intégrés en soutien au brancardage et surveillance continue des Urgences Relatives.',
            type: 'info'
          },
          {
            source: 'Équipage VPSP Protec',
            text: 'VPSP engagé en noria d’évacuation : prise en charge d’une victime stabilisée sous surveillance scopée vers le Trauma Center.',
            type: 'milestone'
          },
          {
            source: 'Officier de Liaison Protec',
            text: 'Point de situation intermédiaire : traçabilité SINUS assurée et prise en charge psychologique des familles au CAI.',
            type: 'info'
          },
          {
            source: 'Commandant des Opérations (COS)',
            text: 'Toutes les victimes ont été évacuées vers les centres hospitaliers. Levée progressive du périmètre de désincarcération.',
            type: 'success'
          }
        ];
      } else if (isTrain) {
        pool = [
          {
            source: 'Équipage VPSP Protec',
            text: 'Point sanitaire VPSP ouvert en gare : bilans pour passagers déshydratés ou anxieux, soins de petite traumatologie et suivi.',
            type: 'milestone'
          },
          {
            source: 'Responsable CHU Protec',
            text: hasLogOnScene
              ? 'Lits de camp montés dans le hall de la gare. Distribution de repas et veille rassurante auprès des familles et personnes âgées.'
              : 'Hall de la gare sécurisé. Ravitaillement et réconfort assurés en continu.',
            type: hasLogOnScene ? 'milestone' : 'info'
          },
          {
            source: 'Direction de Crise SNCF',
            text: 'Autocars de substitution en rotation. Fin d’évacuation des voyageurs et retour progressif à la normale.',
            type: 'success'
          }
        ];
      } else if (isSearch) {
        pool = [
          {
            source: 'Équipe Cyno / Pédestre Protec',
            text: 'Ratissage méthodique des layons. Liaison permanente avec le PC Gendarmerie et balisage des zones explorées.',
            type: 'info'
          },
          {
            source: 'Commandement Gendarmerie',
            text: 'Personne disparue localisée ! Consciente mais désorientée et en légère hypothermie. Équipage VPSP demandé au point de contact.',
            type: 'milestone'
          },
          {
            source: 'Équipage VPSP Protec',
            text: 'Victime prise en charge dans le VPSP : réchauffement actif, bilan transmis au SAMU 15 et transport vers les urgences.',
            type: 'milestone'
          },
          {
            source: 'Commandement Gendarmerie',
            text: 'Opération de recherche couronnée de succès. Fin de la battue et remerciements aux équipes bénévoles.',
            type: 'success'
          }
        ];
      } else {
        pool = [
          {
            source: 'Équipage VPSP Protec',
            text: 'VPSP opérationnel sur zone : bilans de santé, soins d’urgence et surveillance des impliqués coordonnés avec la régulation 15.',
            type: 'milestone'
          },
          {
            source: 'Commandement Terrain Protec',
            text: `Point de situation intermédiaire : ${volsOnScene} secouristes en action. Sécurisation, accueil et premiers secours menés avec rigueur.`,
            type: 'info'
          },
          {
            source: 'Cadre d’Astreinte Protec',
            text: 'Poursuite de la mission. Anticipez la relève des secouristes pour préserver leur condition physique si la crise se prolonge.',
            type: 'alert'
          },
          {
            source: 'Coordination Opérationnelle',
            text: 'Objectifs de secours et de soutien pleinement atteints. Situation stabilisée sur l’ensemble du secteur.',
            type: 'success'
          }
        ];
      }
    }

    if (!pool || pool.length === 0) return null;

    // Sélection intelligente : trouver le premier message de la phase qui n'a pas encore été envoyé
    const existingTexts = logs.map(l => (l.text || '').toLowerCase().trim());
    let selected = pool.find(item => {
      const t = (item.text || '').toLowerCase().trim();
      return !existingTexts.includes(t);
    });

    // Si tous les messages de la phase actuelle ont déjà été envoyés, on émet une ambiance contextuelle sans doublon
    if (!selected) {
      if (!hasDeparted) {
        selected = {
          source: 'PC de Crise CODIS 18',
          text: 'Situation toujours en cours sur zone. En attente de la confirmation d’engagement et de départ de vos effectifs Protec.',
          type: 'info'
        };
      } else if (!hasAnyOnScene) {
        selected = {
          source: 'Vecteur Protec en transit',
          text: 'Progression routière en cours vers le lieu du sinistre. Contact maintenu avec le commandement pour ETA précis.',
          type: 'info'
        };
      } else if (!hasVpspOnScene) {
        selected = {
          source: 'Chef de Dispositif Protec',
          text: 'Maintien du dispositif d’accueil et soutien moral sur place. En attente du vecteur sanitaire pour les bilans complémentaires.',
          type: 'info'
        };
      } else {
        selected = {
          source: 'Commandement Terrain Protec',
          text: 'Dispositif pleinement engagé sur le terrain. Surveillance continue des personnes accueillies et appui aux secours publics.',
          type: 'info'
        };
      }
      if (logs.length > 0 && (logs[0].text || '').toLowerCase().trim() === selected.text.toLowerCase().trim()) {
        return null;
      }
    }

    return {
      ...selected,
      time: timeStr,
      timestamp: Date.now()
    };
  },

  // Résolution finale de la crise par le CODIS
  triggerCrisisResolution(game, mission) {
    if (!mission || mission.status !== 'ongoing' || mission.crisisCanClose) return;
    mission.crisisCanClose = true;
    mission.resolvedAt = Date.now();
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    mission.operationalLog.unshift({
      timestamp: Date.now(),
      time: timeStr,
      source: 'Commandant des Opérations (COS)',
      text: '🏁 Objectifs de mission pleinement atteints ! Situation normalisée sur le terrain. Le COS autorise la levée du dispositif et le retour des moyens à l’antenne.',
      type: 'success'
    });

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.showToast('Accord COS Reçu !', `Le COS autorise la levée du dispositif pour « ${mission.title} ». Vous pouvez désormais clôturer le dispositif.`, 'green');
    game.saveGame();
    game.renderMissions();
  },

  // Effectuer une rotation / relève d'équipage sur le sinistre
  performTeamRotation(game, missionId) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission) return;

    const myId = game.player?.id || 'usr_local';
    if (mission.managerPlayerId && mission.managerPlayerId !== myId) {
      game.showToast('Commandement Exclusif', `Seul le directeur de crise (${mission.managerPlayerName}) peut ordonner une relève d'équipe.`, 'orange');
      return;
    }

    // Trouver des bénévoles disponibles et frais au local
    const freshVols = game.volunteers.filter(v => 
      !mission.registeredVolunteers.includes(v.id) &&
      v.status !== 'mission' &&
      (v.energy || 80) >= 50
    );

    if (freshVols.length < 2) {
      game.showToast('Effectif Insuffisant pour Relève', 'Vous devez avoir au moins 2 secouristes frais (énergie > 50%) au local pour assurer la rotation.', 'orange');
      return;
    }

    // Remplacer les 2 à 4 secouristes les plus fatigués
    const currentlyEngaged = game.volunteers.filter(v => mission.registeredVolunteers.includes(v.id));
    currentlyEngaged.sort((a, b) => (a.energy || 80) - (b.energy || 80));

    const relieved = currentlyEngaged.slice(0, Math.min(currentlyEngaged.length, freshVols.length, 4));
    const newComers = freshVols.slice(0, relieved.length);

    // Retirer les fatigués et les mettre au repos
    relieved.forEach(v => {
      mission.registeredVolunteers = mission.registeredVolunteers.filter(id => id !== v.id);
      v.status = 'disponible';
      v.energy = Math.min(100, (v.energy || 30) + 20); // Repos
      v.stress = Math.max(5, (v.stress || 20) - 15);
    });

    // Ajouter les frais
    newComers.forEach(v => {
      mission.registeredVolunteers.push(v.id);
      v.status = 'mission';
    });

    mission.rotationsCount = (mission.rotationsCount || 0) + 1;
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    mission.operationalLog.unshift({
      timestamp: Date.now(),
      time: timeStr,
      source: 'Cadre d’Astreinte Protec',
      text: `🔄 Rotation opérationnelle réussie : Relève de ${relieved.length} secouristes épuisés par une équipe fraîche. Maintien de la capacité d’action.`,
      type: 'milestone'
    });

    if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();
    game.showToast('Relève Effectuée !', `Rotation n°${mission.rotationsCount} validée (${relieved.length} secouristes relevés et renvoyés au repos).`, 'green');
    game.saveGame();
    if (typeof game.refreshMissionDetailsIfOpen === 'function') {
      game.refreshMissionDetailsIfOpen(mission.id);
    } else {
      game.openMissionDetails(mission.id);
    }
  },

  // Retirer un secouriste spécifique épuisé
  withdrawVolunteer(game, missionId, volunteerId) {
    const mission = game.missions.find(m => m.id === missionId);
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!mission || !vol) return;

    mission.registeredVolunteers = mission.registeredVolunteers.filter(id => id !== volunteerId);
    vol.status = 'disponible';
    vol.energy = Math.min(100, (vol.energy || 20) + 15);
    vol.stress = Math.max(5, (vol.stress || 30) - 20);

    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    mission.operationalLog.unshift({
      timestamp: Date.now(),
      time: timeStr,
      source: 'Chef de Dispositif Protec',
      text: `Secouriste ${vol.name} désengagé et renvoyé au repos à l’antenne pour préserver sa condition physique.`,
      type: 'info'
    });

    game.showToast('Secouriste Désengagé', `${vol.name} a été retiré du dispositif et mis au repos.`, 'blue');
    game.saveGame();
    if (typeof game.refreshMissionDetailsIfOpen === 'function') {
      game.refreshMissionDetailsIfOpen(mission.id);
    } else {
      game.openMissionDetails(mission.id);
    }
  },

  // Désengager un véhicule engagé sur un dispositif de crise avec son équipage complet et transit retour base
  disengageVehicleFromCrisis(game, missionId, vehicleId) {
    if (!game) game = window.game;
    if (typeof game.toggleMissionVehicle === 'function') {
      game.toggleMissionVehicle(missionId, vehicleId);
    }
  },

  // =========================================================================
  // 3. LOGISTIQUE & GESTION DU RÉARMEMENT DE LA FLOTTE
  // =========================================================================

  // Planifier une mission de réarmement logistique
  
  // Kits officiels de chargement des véhicules logistiques (VTU / VTL)
  LOG_KITS: {
    dps: {
      id: 'dps',
      name: 'Kit DPS (Matériels PS & Postes de Secours)',
      shortName: 'Kit DPS (Secours)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: 'briefcase-medical',
      capacitySize: 100, // 100% de la capacité de stockage du VTU
      buildingStorageSize: 8, // Encombrement économisé dans le bâtiment
      loadTimeSec: 180, // 3 minutes en temps de jeu
      unloadTimeSec: 120, // 2 minutes
      desc: 'Lots de secours A & B, oxygénothérapie B5, brancards, chaises d\'escalier et dotation de réarmement pour VPSP sur zone.'
    },
    chu: {
      id: 'chu',
      name: 'Kit CHU (Hébergement d\'Urgence - 50 Lits & Duvets)',
      shortName: 'Kit CHU (50 Lits)',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: 'bed-double',
      capacitySize: 100,
      buildingStorageSize: 15,
      loadTimeSec: 240, // 4 minutes
      unloadTimeSec: 150, // 2.5 minutes
      desc: '50 lits picots Sécurité Civile, 50 duvets thermiques et kits hygiène pour armer un gymnase ou une gare en urgence.'
    },
    pompage: {
      id: 'pompage',
      name: 'Kit Pompage & Inondations (Motopompes & Tuyaux)',
      shortName: 'Kit Pompage',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      icon: 'waves',
      capacitySize: 100,
      buildingStorageSize: 10,
      loadTimeSec: 210, // 3.5 minutes
      unloadTimeSec: 120,
      desc: 'Motopompes thermiques gros débit (60 m³/h), vide-caves, raclettes et 100m de tuyaux de refoulement pour crues et inondations.'
    },
    eclairage: {
      id: 'eclairage',
      name: 'Kit Éclairage & Énergie (Groupe Électrogène & Mâts LED)',
      shortName: 'Kit Éclairage',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: 'lightbulb',
      capacitySize: 100,
      buildingStorageSize: 10,
      loadTimeSec: 180,
      unloadTimeSec: 120,
      desc: 'Groupe électrogène 3.5 kVA insonorisé, 2 mâts LED télescopiques 4m (50 000 lm), ballon Airstar et servitudes électriques.'
    },
    ravitaillement: {
      id: 'ravitaillement',
      name: 'Kit Ravitaillement & Vivres (Cuisine de Crise & Boissons)',
      shortName: 'Kit Ravitaillement',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: 'utensils',
      capacitySize: 100,
      buildingStorageSize: 8,
      loadTimeSec: 180,
      unloadTimeSec: 120,
      desc: 'Percolateurs, vivres, thermos géants, gobelets, barnum pop-up et collations pour secouristes et populations sinistrées.'
    },
    cai: {
      id: 'cai',
      name: 'Kit CAI (Centre d\'Accueil des Impliqués & Soutien Psy)',
      shortName: 'Kit CAI (Impliqués)',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: 'heart-handshake',
      capacitySize: 100,
      buildingStorageSize: 8,
      loadTimeSec: 180,
      unloadTimeSec: 120,
      desc: 'Claustras d\'intimité, tables pliantes, chaises, kits réconfort, couvertures et fiches SINUS pour prise en charge médico-psychologique.'
    }
  },

  // Obtention du stock "Matériels PS" disponible (pourcentage / unités)
  getStationStockPS(game, stationId = null) {
    const station = stationId ? (game.stations || []).find(s => s.id === stationId) : (game.stations && game.stations[0]);
    if (station) {
      if (station.stockMaterielsPS === undefined) {
        station.stockMaterielsPS = 150; // Dotation initiale de départ (150%)
      }
      return Math.round(station.stockMaterielsPS);
    }
    if (game.stockMaterielsPS === undefined) game.stockMaterielsPS = 150;
    return Math.round(game.stockMaterielsPS);
  },

  // Ajustement du stock Matériels PS
  adjustStationStockPS(game, amount, stationId = null) {
    const station = stationId ? (game.stations || []).find(s => s.id === stationId) : (game.stations && game.stations[0]);
    if (station) {
      station.stockMaterielsPS = Math.max(0, Math.round(((station.stockMaterielsPS !== undefined ? station.stockMaterielsPS : 150) + amount) * 10) / 10);
      game.stockMaterielsPS = station.stockMaterielsPS;
      return station.stockMaterielsPS;
    }
    game.stockMaterielsPS = Math.max(0, Math.round(((game.stockMaterielsPS !== undefined ? game.stockMaterielsPS : 150) + amount) * 10) / 10);
    return game.stockMaterielsPS;
  },

  // Évaluation de la possibilité de réarmer un véhicule (sur mission ou à la base)
  canRearmVehicle(game, veh, mission = null) {
    if (!veh) return { can: false, reason: 'Véhicule inexistant.' };

    const armement = veh.armementLevel !== undefined ? veh.armementLevel : (veh.isRearmed === false ? 70 : 100);
    if (armement >= 100 && veh.isRearmed !== false && !veh.needsRearming) {
      return { can: false, reason: 'Le véhicule est déjà à 100% d\'armement et parfaitement opérationnel.' };
    }

    const missingPct = Math.max(0, 100 - armement);

    // CAS 1 : Le véhicule est sur une mission active
    if (mission) {
      const assignedIds = mission.assignedVehicleIds || [];
      const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
      // Recherche d'un véhicule LOG armé sur la mission
      const armedLogVeh = allVehs.find(v => assignedIds.includes(v.id) && v.id !== veh.id && (v.type === 'VTU' || v.type === 'VTL' || v.type === 'VAHU') && (v.logKit === 'dps' || (v.armementLevel || 100) >= 30));

      if (armedLogVeh) {
        return {
          can: true,
          mode: 'mission',
          logVehicle: armedLogVeh,
          missingPct: missingPct
        };
      } else {
        return {
          can: false,
          mode: 'mission',
          reason: 'Réarmement sur zone impossible : aucun véhicule LOG armé (VTU avec Kit DPS) n\'est présent sur la mission. Le véhicule devra rentrer à la base pour se réarmer.',
          missingPct: missingPct
        };
      }
    }

    // CAS 2 : Le véhicule est à la base
    const currentStockPS = this.getStationStockPS(game, veh.stationId);
    if (currentStockPS <= 0) {
      return {
        can: false,
        mode: 'base',
        reason: 'Stock "Matériels PS" épuisé au local (0%). Achetez du stock à la Centrale d\'Achats pour pouvoir réarmer vos véhicules.',
        missingPct: missingPct,
        currentStockPS: currentStockPS
      };
    }

    return {
      can: true,
      mode: 'base',
      missingPct: missingPct,
      currentStockPS: currentStockPS,
      willUse: Math.min(missingPct, currentStockPS)
    };
  },

  // Réarmement d'un véhicule (à la base ou sur mission)
  rearmVehicle(game, vehicleId, missionId = null) {
    const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
    const veh = allVehs.find(v => v.id === vehicleId);
    if (!veh) return;

    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    const check = this.canRearmVehicle(game, veh, mission);

    if (!check.can) {
      game.showToast('Réarmement Impossible ⚠️', check.reason, 'orange');
      return;
    }

    const missing = check.missingPct || 30;

    if (check.mode === 'mission') {
      // Réarmé sur le terrain via le véhicule LOG
      veh.armementLevel = 100;
      veh.isRearmed = true;
      veh.needsRearming = false;
      if (check.logVehicle) {
        check.logVehicle.armementLevel = Math.max(0, (check.logVehicle.armementLevel || 100) - missing);
      }
      game.showToast('Réarmé sur Zone ✓', `${veh.name} a été réarmé sur mission grâce au ${check.logVehicle.name} LOG présent sur place (-${missing}% matériels).`, 'green');
    } else {
      // Réarmé à la base via le stock du local
      const consumed = Math.min(missing, check.currentStockPS);
      this.adjustStationStockPS(game, -consumed, veh.stationId);
      veh.armementLevel = Math.min(100, (veh.armementLevel || 70) + consumed);
      veh.isRearmed = (veh.armementLevel >= 100);
      veh.needsRearming = !veh.isRearmed;

      const remainingStock = this.getStationStockPS(game, veh.stationId);
      game.showToast('Véhicule Réarmé au Local ✓', `${veh.name} a été réarmé à la base (-${consumed}% au stock Matériels PS. Reste en réserve : ${remainingStock}%).`, 'green');
    }

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
    if (typeof game.refreshCurrentModalIfSafe === 'function') game.refreshCurrentModalIfSafe();
  },

  // Démarrer le chargement d'un kit dans un véhicule LOG (VTU / VTL)
  startLoadingVehicleKit(game, vehicleId, kitId) {
    const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
    const veh = allVehs.find(v => v.id === vehicleId);
    if (!veh) return;

    const kit = this.LOG_KITS[kitId];
    if (!kit) return;

    if (veh.status === 'chargement' || veh.status === 'dechargement' || veh.logOperation) {
      game.showToast('Opération en cours', `Le véhicule ${veh.name} est déjà en cours de manipulation logistique.`, 'orange');
      return;
    }

    if (veh.status !== 'dispo' && veh.status !== 'disponible') {
      game.showToast('Véhicule Indisponible', `Le véhicule ${veh.name} n'est pas disponible au garage de la base.`, 'orange');
      return;
    }

    if (veh.logKit && veh.logKit !== kitId) {
      game.showToast('Véhicule Déjà Armé ⚠️', `${veh.name} contient déjà le ${this.LOG_KITS[veh.logKit]?.name || veh.logKit}. Vous devez d'abord le vider (décharger) avant de charger un nouveau matériel.`, 'orange');
      return;
    }

    veh.status = 'chargement';
    veh.logOperation = {
      type: 'loading',
      kitId: kitId,
      startTime: Date.now(),
      durationSec: kit.loadTimeSec || 180,
      label: `Chargement : ${kit.shortName}`
    };

    game.showToast('Chargement Lancé 📦', `Manutentionnaires au travail : chargement du ${kit.name} dans ${veh.name} (${Math.round((kit.loadTimeSec || 180) / 60)} min).`, 'teal');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
    if (typeof game.refreshCurrentModalIfSafe === 'function') game.refreshCurrentModalIfSafe();
  },

  // Démarrer le déchargement d'un véhicule LOG (vidage pour changer de kit)
  startUnloadingVehicleKit(game, vehicleId) {
    const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
    const veh = allVehs.find(v => v.id === vehicleId);
    if (!veh) return;

    if (!veh.logKit) {
      game.showToast('Véhicule Déjà Vide', `${veh.name} n'a aucun matériel à décharger.`, 'blue');
      return;
    }

    if (veh.status === 'chargement' || veh.status === 'dechargement' || veh.logOperation) {
      game.showToast('Opération en cours', `Le véhicule ${veh.name} est déjà en cours de manipulation logistique.`, 'orange');
      return;
    }

    if (veh.status !== 'dispo' && veh.status !== 'disponible') {
      game.showToast('Véhicule Indisponible', `Le véhicule ${veh.name} n'est pas disponible au garage de la base.`, 'orange');
      return;
    }

    const currentKit = this.LOG_KITS[veh.logKit];
    const duration = currentKit?.unloadTimeSec || 120;

    veh.status = 'dechargement';
    veh.logOperation = {
      type: 'unloading',
      oldKitId: veh.logKit,
      startTime: Date.now(),
      durationSec: duration,
      label: `Déchargement : ${currentKit?.shortName || 'Matériel'}`
    };

    game.showToast('Déchargement Lancé 🧹', `Vidage et restitution du matériel de ${veh.name} dans la réserve du bâtiment (${Math.round(duration / 60)} min).`, 'teal');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
    if (typeof game.refreshCurrentModalIfSafe === 'function') game.refreshCurrentModalIfSafe();
  },

  // Analyse des compétences réglementaires d'un équipage de véhicule
  getVehicleCrewQualifications(veh, crew = []) {
    const hasLeader = crew.some(v => ['Chef de Dispositif', 'Chef de Poste', 'Chef d’Équipe', 'Chef d\'Équipe', 'CE', 'Cadre'].includes(v.rank) || (v.skills || []).some(s => s && s.toLowerCase().includes('ce')));
    const hasPSE2 = crew.some(v => v.rank === 'PSE2' || ['Chef de Dispositif', 'Chef de Poste', 'Chef d’Équipe', 'Chef d\'Équipe', 'CE'].includes(v.rank) || (v.skills || []).some(s => s && s.toLowerCase().includes('pse2')));
    const hasDriver = crew.some(v => (v.skills || []).some(s => s && (s.toLowerCase().includes('permis') || s.toLowerCase().includes('chauffeur') || s.toLowerCase().includes('conducteur'))) || (v.age && v.age >= 21) || v.role?.toLowerCase().includes('chauffeur') || v.role?.toLowerCase().includes('conducteur'));

    const vehType = (veh.type || '').toUpperCase();
    let required = [];
    let missing = [];

    if (vehType === 'VPSP') {
      required = ['Chef d\'Équipe (CE)', 'Équipier (PSE2)', 'Chauffeur'];
      if (!hasLeader) missing.push('Chef d\'Équipe (CE)');
      if (!hasPSE2) missing.push('Équipier (PSE2)');
      if (!hasDriver) missing.push('Chauffeur');
    } else if (vehType === 'VTU' || vehType === 'VTL' || vehType === 'VAHU') {
      required = ['Secouriste/Logisticien', 'Chauffeur'];
      if (crew.length < 1) missing.push('Personnel');
      if (!hasDriver) missing.push('Chauffeur');
    } else if (vehType === 'PCM') {
      required = ['Cadre / Chef Dispositif'];
      if (!hasLeader) missing.push('Cadre / Chef Dispositif');
    } else {
      // VTP, VL, etc.
      required = ['Chauffeur'];
      if (!hasDriver) missing.push('Chauffeur');
    }

    return {
      valid: missing.length === 0,
      required: required,
      missing: missing,
      details: required.join(', ')
    };
  },

  // Répartition de l'équipage inscrit sur un véhicule donné
  getVehicleAssignedCrew(mission, veh, game) {
    if (!mission || !veh) return [];
    const allAssignedIds = mission.assignedVehicleIds || [];
    const vehIdx = allAssignedIds.indexOf(veh.id);
    if (vehIdx === -1) return [];

    const regVolIds = mission.registeredVolunteers || [];
    const vols = regVolIds.map(id => (game.volunteers || []).find(v => v.id === id)).filter(Boolean);

    if (mission.vehicleCrews && mission.vehicleCrews[veh.id]) {
      return mission.vehicleCrews[veh.id].map(id => (game.volunteers || []).find(v => v.id === id)).filter(Boolean);
    }

    let offset = 0;
    for (let i = 0; i < vehIdx; i++) {
      const prevVeh = (game.vehicles || []).find(v => v.id === allAssignedIds[i]);
      const prevSeats = prevVeh ? (prevVeh.seatsCount || prevVeh.capacity || 4) : 4;
      offset += prevSeats;
    }
    const seats = veh.seatsCount || veh.capacity || (veh.type === 'VPSP' ? 3 : veh.type === 'VTP' ? 9 : 4);
    return vols.slice(offset, offset + seats);
  },

  // Détection du Kit LOG indispensable pour une mission
  getRequiredMissionKit(mission) {
    if (!mission) return null;
    const type = (mission.type || '').toLowerCase();
    const title = (mission.title || '').toLowerCase();
    const desc = (mission.description || '').toLowerCase();

    if (title.includes('inondation') || title.includes('pompage') || title.includes('crue') || title.includes('eau') || type === 'inondation' || desc.includes('pompage')) {
      return this.LOG_KITS.pompage;
    }
    if (title.includes('chu') || title.includes('naufrag') || title.includes('hébergement') || title.includes('lits') || title.includes('gare') || title.includes('sncf') || (mission.isCrisis && (title.includes('évacuation') || title.includes('sinistr')))) {
      return this.LOG_KITS.chu;
    }
    if (title.includes('cai') || title.includes('impliqué') || title.includes('cump') || title.includes('crash') || title.includes('attentat')) {
      return this.LOG_KITS.cai;
    }
    if (title.includes('recherche') || title.includes('nuit') || title.includes('nocturne') || title.includes('tempête') || title.includes('éclairage')) {
      return this.LOG_KITS.eclairage;
    }
    if (title.includes('canicule') || title.includes('ravitaillement') || title.includes('vivres') || title.includes('maraude')) {
      return this.LOG_KITS.ravitaillement;
    }
    if (type === 'dps' && (mission.scale?.includes('ME') || mission.scale?.includes('GE') || (mission.requiredVolunteers || 0) >= 4)) {
      return this.LOG_KITS.dps;
    }
    return null;
  },

  // Modale pour créer un Atelier de Réarmement Flotte
  openCreateRearmamentModal(game) {
    const primaryStation = game.stations[0] || { id: 'station-1', name: 'Antenne Locale' };
    const stockPS = this.getStationStockPS(game, primaryStation.id);

    // Règle métier : Seuls les engins contenant directement du "Matériel PS" (VPSP / Ambulances PS)
    // sont réarmables en atelier PS au local. Un VTU ne possède pas directement de matériel PS (on réarme ses réassorts séparément).
    // Tous les engins contenant du Matériel PS sont affichés, même à 100%.
    const allCandidateVehs = (game.vehicles || []).filter(v => {
      const t = (v.type || '').toUpperCase();
      const n = (v.name || '').toUpperCase();
      if (t === 'VTU' || t === 'VTP' || t === 'VL' || t === 'VLC' || t === 'LOG' || t === 'FOURGON') return false;
      return t === 'VPSP' || t === 'AMBULANCE' || n.includes('VPSP') || v.hasPsEquipment === true;
    });

    const modalId = 'rearm-workshop-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="w-full max-w-lg rounded-3xl glass-panel-heavy border border-white/80 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
              <i data-lucide="wrench" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-black text-slate-900">Atelier de Réarmement Flotte</h3>
              <p class="text-[11px] text-slate-500 font-semibold">Reconditionnement, désinfection et réarmement en équipe</p>
            </div>
          </div>
          <button onclick="document.getElementById('${modalId}').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
            ✕
          </button>
        </div>

        <!-- Jauge Stock PS disponible -->
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="text-base">📦</span>
            <div>
              <span class="font-extrabold text-slate-800">Stock "Matériels PS" au local :</span>
              <p class="text-[10px] text-slate-500">Consommables nécessaires pour restaurer l'armement</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-xl text-xs font-black ${stockPS > 40 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'}">
            ${stockPS}% disponible
          </span>
        </div>

        <p class="text-xs text-slate-600 leading-snug">
          Sélectionnez les véhicules contenant du matériel PS à reconditionner lors de cette mission atelier au local.
          <br><strong>Barème horaire :</strong> ~1h par VPSP à charge complète (désinfection et réarmement consommables PS).
        </p>

        <!-- Liste des véhicules à cocher (contenants Matériel PS) -->
        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          ${allCandidateVehs.length === 0 ? `
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              Aucun véhicule sanitaire (VPSP) dans votre antenne. Les VTU sont réarmés via leurs réassorts de lots.
            </div>
          ` : allCandidateVehs.map(v => {
            const duration = 60;
            const armement = v.armementLevel !== undefined ? v.armementLevel : (v.isRearmed === false ? 70 : 100);
            const needs = armement < 100 || v.needsRearming || v.isRearmed === false;

            return `
              <label class="p-3 rounded-2xl border ${needs ? 'bg-amber-50/60 border-amber-200 ring-1 ring-amber-100' : 'bg-white border-slate-200'} flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 transition">
                <div class="flex items-center gap-3 min-w-0">
                  <input type="checkbox" name="rearm_veh_cb" value="${v.id}" ${needs ? 'checked' : ''} onchange="window.ProtecCriseLogistique.recalcRearmModalTotals()" class="w-4 h-4 rounded text-pc-blue focus:ring-pc-blue border-slate-300">
                  <div>
                    <div class="font-black text-slate-900 text-xs">
                      ${v.name}
                    </div>
                    <div class="text-[10px] text-slate-500 font-semibold">
                      Armement actuel : <strong class="${armement < 100 ? 'text-amber-700' : 'text-emerald-700'}">${armement}%</strong> • Durée estimée : ${duration} min
                    </div>
                  </div>
                </div>
                <span class="text-[11px] font-bold text-slate-600 shrink-0">+${100 - armement}% PS</span>
              </label>
            `;
          }).join('')}
        </div>

        <!-- Récapitulatif temps et stock -->
        <div id="rearm-modal-summary" class="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-1">
          <!-- Calculé dynamiquement -->
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button type="button" onclick="document.getElementById('${modalId}').remove()" class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
            Annuler
          </button>
          <button type="button" onclick="window.ProtecCriseLogistique.submitRearmWorkshopMission()" class="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-indigo-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="calendar-plus" class="w-4 h-4"></i>
            <span>Créer la Mission d'Atelier</span>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.recalcRearmModalTotals();
  },

  recalcRearmModalTotals() {
    const cbs = document.querySelectorAll('input[name="rearm_veh_cb"]:checked');
    const vehIds = Array.from(cbs).map(c => c.value);
    const game = window.game;
    const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
    let totalMinutes = 0;
    let totalMissingPS = 0;

    vehIds.forEach(id => {
      const v = allVehs.find(x => x.id === id);
      if (v) {
        totalMinutes += 60;
        const armement = v.armementLevel !== undefined ? v.armementLevel : (v.isRearmed === false ? 70 : 100);
        totalMissingPS += Math.max(0, 100 - armement);
      }
    });

    const sumEl = document.getElementById('rearm-modal-summary');
    if (sumEl) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const durationStr = hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins} min`;

      sumEl.innerHTML = `
        <div class="flex items-center justify-between font-bold text-indigo-950">
          <span>Véhicules engagés : <strong>${vehIds.length}</strong></span>
          <span>Charge totale : <strong>${durationStr} de travail</strong></span>
        </div>
        <p class="text-[10.5px] text-indigo-800 leading-snug">
          Consommables requis : <strong>${totalMissingPS}%</strong> au stock Matériels PS.
          <br><em>Le temps se réduira proportionnellement au nombre de bénévoles inscrits !</em>
        </p>
      `;
    }
  },

  submitRearmWorkshopMission() {
    const cbs = document.querySelectorAll('input[name="rearm_veh_cb"]:checked');
    const vehIds = Array.from(cbs).map(c => c.value);
    const game = window.game;

    if (vehIds.length === 0) {
      game.showToast('Aucun véhicule', 'Veuillez cocher au moins un véhicule à réarmer.', 'orange');
      return;
    }

    const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
    let totalMinutes = 0;
    let totalMissingPS = 0;

    vehIds.forEach(id => {
      const v = allVehs.find(x => x.id === id);
      if (v) {
        totalMinutes += 60;
        const armement = v.armementLevel !== undefined ? v.armementLevel : (v.isRearmed === false ? 70 : 100);
        totalMissingPS += Math.max(0, 100 - armement);
      }
    });

    const primaryStation = game.stations[0] || { id: 'station-1', name: 'Antenne Locale' };
    const stockPS = this.getStationStockPS(game, primaryStation.id);

    if (stockPS < totalMissingPS && stockPS <= 0) {
      game.showToast('Stock Matériels PS Épuisé ⚠️', 'Impossible de lancer l\'atelier : le stock Matériels PS au local est vide (0%). Achetez du stock à la Centrale d\'Achats.', 'orange');
      return;
    }

    const now = Date.now();
    const mission = {
      id: `rearm_workshop_${now}`,
      type: 'rearmement',
      title: `Atelier Réarmement Flotte (${vehIds.length} vhc)`,
      subtitle: 'Nettoyage, désinfection, réarmement des consommables et reconditionnement',
      description: `Atelier logistique au local pour réarmer et désinfecter ${vehIds.length} véhicule(s). Les bénévoles inscrits travaillent en équipe pour réduire la durée.`,
      category: 'logistique',
      status: 'planifie',
      isRearmamentWorkshop: true,
      targetVehicleIds: vehIds,
      baseWorkMinutes: totalMinutes,
      durationMinutes: totalMinutes,
      duration: totalMinutes,
      requiredVolunteers: Math.min(4, Math.max(1, Math.ceil(vehIds.length / 2))),
      registeredVolunteers: [],
      neededStockPS: totalMissingPS,
      city: primaryStation.city || 'Local Antenne',
      locationAddress: 'Atelier Logistique de l\'Antenne',
      scale: 'LOGISTIQUE',
      rewardMoney: 0,
      rewardReputation: 12
    };

    if (!Array.isArray(game.missions)) game.missions = [];
    game.missions.unshift(mission);

    const modal = document.getElementById('rearm-workshop-modal');
    if (modal) modal.remove();

    game.showToast('Atelier Créé ! 🛠️', `La mission d'atelier pour ${vehIds.length} véhicule(s) est planifiée. Ouvrez-la pour y inscrire vos bénévoles !`, 'green');
    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.saveGame();
    if (typeof game.openMissionDetails === 'function') {
      game.openMissionDetails(mission.id);
    }
  },

  scheduleRearmamentMission(game, vehicleId, volunteerId = null) {
    const veh = game.vehicles.find(v => v.id === vehicleId);
    if (!veh) return;

    if (veh.isRearmed) {
      game.showToast('Déjà Opérationnel', `${veh.name} est déjà 100% réarmé et désinfecté.`, 'blue');
      return;
    }

    const availableLogisticians = game.volunteers.filter(v => v.status !== 'mission');
    if (availableLogisticians.length === 0) {
      game.showToast('Aucun Personnel Disponible', 'Il vous faut au moins un secouriste ou logisticien disponible pour réarmer le véhicule.', 'orange');
      return;
    }

    const assignedVol = volunteerId ? game.volunteers.find(v => v.id === volunteerId) : availableLogisticians[0];

    const task = {
      id: `task_rearm_${Date.now()}`,
      vehicleId: veh.id,
      vehicleName: veh.name,
      volunteerId: assignedVol.id,
      volunteerName: assignedVol.name,
      startTime: Date.now(),
      durationSeconds: 120, // 2 minutes réelles de travail
      cost: 45 // Petit coût consommables
    };

    if (game.resources.money < task.cost) {
      game.showToast('Fonds Insuffisants', `Le réarmement requiert ${task.cost} € de consommables.`, 'orange');
      return;
    }

    game.resources.money -= task.cost;
    assignedVol.status = 'mission';
    this.injectState(game);
    game.logisticTasks.push(task);

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.showToast('Réarmement Lancé', `🔧 ${assignedVol.name} s'occupe de réarmer ${veh.name} au local (2 min).`, 'teal');
    game.saveGame();
    game.updateStatsUI();
  },

  // Mise à jour de l'horloge des tâches logistiques
  updateLogisticClock(game) {
    this.injectState(game);
    const now = Date.now();

    // 1. Gestion des opérations de chargement / déchargement des véhicules (Kits VTU)
    if (Array.isArray(game.vehicles)) {
      game.vehicles.forEach(veh => {
        if (veh.logOperation) {
          const elapsed = Math.floor((now - veh.logOperation.startTime) / 1000);
          if (elapsed >= veh.logOperation.durationSec) {
            // Opération terminée !
            const op = veh.logOperation;
            veh.logOperation = null;
            veh.status = 'dispo';

            if (op.type === 'loading') {
              veh.logKit = op.kitId;
              const kit = this.LOG_KITS[op.kitId];
              game.showToast('📦 Chargement Terminé !', `${veh.name} est maintenant armé avec le ${kit ? kit.name : op.kitId}. Prêt au départ immédiat sans délai !`, 'green');
              if (window.ProtecNotifications) {
                window.ProtecNotifications.recordNotification({
                  title: '📦 Véhicule Armé & Prêt',
                  message: `${veh.name} a terminé son chargement (${kit ? kit.shortName : op.kitId}). Il est prêt pour engagement.`,
                  category: 'logistique',
                  color: 'emerald'
                });
              }
            } else if (op.type === 'unloading') {
              const oldKit = this.LOG_KITS[op.oldKitId];
              veh.logKit = null;
              game.showToast('🧹 Déchargement Terminé !', `${veh.name} a été entièrement vidé. Le matériel est réintégré dans le stockage du bâtiment.`, 'teal');
            }

            if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
            if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
            if (typeof game.refreshCurrentModalIfSafe === 'function') game.refreshCurrentModalIfSafe();
          }
        }
      });
    }

    // 2. Gestion des missions d'atelier de réarmement
    if (Array.isArray(game.missions)) {
      game.missions.forEach(m => {
        if (m.isRearmentWorkshop || m.isRearmamentWorkshop) {
          if (m.status === 'ongoing' || m.status === 'en_cours') {
            const regCount = Math.max(1, (m.registeredVolunteers || []).length);
            // La durée effective est réduite par le nombre de bénévoles inscrits
            const effectiveMinutes = Math.max(10, Math.round((m.baseWorkMinutes || 60) / regCount));
            m.durationMinutes = effectiveMinutes;

            if (m.startTime) {
              const elapsedMin = Math.floor((now - m.startTime) / 60000);
              if (elapsedMin >= effectiveMinutes) {
                // Clôture atelier
                m.status = 'completed';
                const targetIds = m.targetVehicleIds || [];
                const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
                let rearmedCount = 0;

                targetIds.forEach(id => {
                  const v = allVehs.find(x => x.id === id);
                  if (v) {
                    v.armementLevel = 100;
                    v.isRearmed = true;
                    v.needsRearming = false;
                    rearmedCount++;
                  }
                });

                // Déduction du stock PS
                this.adjustStationStockPS(game, -(m.neededStockPS || 30));

                // Expérience pour les bénévoles
                (m.registeredVolunteers || []).forEach(volId => {
                  const vol = (game.volunteers || []).find(v => v.id === volId);
                  if (vol) {
                    vol.status = 'dispo';
                    vol.experience = Math.min(100, (vol.experience || 30) + 8);
                  }
                });

                game.showToast('🛠️ Atelier Réarmement Terminé !', `${rearmedCount} véhicule(s) ont été reconditionnés et réarmés à 100% au local.`, 'green');
                if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
                if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
                if (typeof game.refreshCurrentModalIfSafe === 'function') game.refreshCurrentModalIfSafe();
              }
            }
          }
        }
      });
    }

    // 3. Gestion des micro-tâches logistiques simples
    if (!game.logisticTasks || game.logisticTasks.length === 0) return;

    game.logisticTasks = game.logisticTasks.filter(task => {
      const elapsed = Math.floor((now - task.startTime) / 1000);
      if (elapsed >= task.durationSeconds) {
        const veh = game.vehicles.find(v => v.id === task.vehicleId);
        if (veh) {
          veh.armementLevel = 100;
          veh.isRearmed = true;
          veh.needsRearming = false;
          veh.a_rearme = false;
          veh.status = 'dispo';
        }

        const vol = game.volunteers.find(v => v.id === task.volunteerId);
        if (vol) {
          vol.status = 'dispo';
          vol.experience = Math.min(100, (vol.experience || 30) + 5);
        }

        game.showToast('Véhicule Réarmé ! ✓', `Ambulance ${task.vehicleName} parfaitement reconditionnée et opérationnelle pour le prochain départ.`, 'green');
        if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
        if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
        if (typeof game.refreshCurrentModalIfSafe === 'function') game.refreshCurrentModalIfSafe();
        return false;
      }
      return true;
    });
  },

  // =========================================================================
  // 4. CONVENTION MAIRIE PARTENAIRE : LOCAL CONTRE 3 DPS OFFERTS
  // =========================================================================

  async signMunicipalPartnership(game) {
    this.injectState(game);
    if (game.municipalPartnership.signed) {
      game.showToast('Convention Active', 'Le partenariat municipal est déjà signé avec la Mairie.', 'blue');
      return;
    }

    const confirmed = await window.ProtecDialog.confirm(
      `La commune propose une convention gagnant-gagnant :\n• Mise à disposition gracieuse des locaux municipaux (Économie de loyer)\n• En contrepartie : L'antenne s'engage à assurer 3 DPS municipaux gratuits par an pour la commune (Fête de la musique, Feu d'artifice, Événement sportif communal).\n\nConfirmez-vous la signature de cette convention ?`,
      'Partenariat Municipal & Sécurité Civile',
      { confirmText: 'Signer le Partenariat', cancelText: 'Annuler' }
    );
    if (!confirmed) {
      return;
    }

    game.municipalPartnership.signed = true;
    game.municipalPartnership.freeDpsCompleted = 0;

    // Si le joueur est en location, suppression du loyer mensuel !
    const st = game.stations[0];
    if (st && st.premises && st.premises.tenure !== 'owned') {
      st.premises.monthlyRent = 0;
    }

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.showToast('Partenariat Municipal Signé !', 'Locaux mis à disposition gratuitement contre 3 DPS offerts par an à la Ville !', 'green');
    game.saveGame();
    game.updateStatsUI();
  },

  // =========================================================================
  // 5. AGRÉMENT & RECRUTEMENT SERVICE CIVIQUE
  // =========================================================================

  requestServiceCiviqueAgreement(game) {
    this.injectState(game);
    if (game.serviceCiviqueQuota.approved) {
      game.showToast('Agrément Déjà Validé', 'Votre antenne dispose déjà de l’agrément d’accueil Service Civique de l’État.', 'blue');
      return;
    }

    if (game.resources.reputationScore < 30) {
      game.showToast('Réputation Insuffisante', 'L’Agence du Service Civique exige au moins 30 pts de réputation pour valider l’agrément.', 'orange');
      return;
    }

    game.serviceCiviqueQuota.approved = true;
    game.serviceCiviqueQuota.maxSlots = 2; // Droit à 2 volontaires au départ

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.showToast('Agrément Service Civique Accordé ! 🎖️', 'L’État autorise l’accueil de 2 volontaires en Service Civique (indemnité prise en charge à 85% par l’État).', 'green');
    game.saveGame();
    game.updateStatsUI();
  },

  // =========================================================================
  // 6. COMPOSANTS D'AFFICHAGE UI POUR LE TIROIR DE MISSION (DRAWER)
  // =========================================================================

  // Affichage du contrôle des places assises et de l'état de réarmement
  renderVehiclesCapacityAndRearmAlertHTML(game, mission) {
    this.injectState(game);
    const assignedVehIds = (mission.assignedVehicleIds || []).concat(mission.assignedCrew?.vehicles?.map(v => v.id || v) || []);
    const uniqueIds = Array.from(new Set(assignedVehIds.filter(Boolean)));
    const assignedVehs = (game.vehicles || []).filter(v => uniqueIds.includes(v.id));
    const registeredCount = (mission.registeredVolunteers || []).length;

    let totalSeats = 0;
    let hasUnrearmed = false;
    let unrearmedVehs = [];

    assignedVehs.forEach(v => {
      totalSeats += (v.seatsCount || v.capacity || 4);
      const armement = v.armementLevel !== undefined ? v.armementLevel : (v.isRearmed === false ? 70 : 100);
      if (armement < 100 || v.isRearmed === false || v.needsRearming) {
        hasUnrearmed = true;
        unrearmedVehs.push(v);
      }
    });

    const missingSeats = Math.max(0, registeredCount - totalSeats);
    const hasEnoughSeats = totalSeats >= registeredCount;

    // Détection d'un véhicule LOG armé sur la mission
    const armedLogVeh = assignedVehs.find(v => (v.type === 'VTU' || v.type === 'VTL' || v.type === 'VAHU') && (v.logKit === 'dps' || (v.armementLevel || 100) >= 30));

    // Détection du Kit indispensable pour la mission
    const reqKit = this.getRequiredMissionKit(mission);
    let kitMismatchAlert = '';
    if (reqKit) {
      const hasCorrectKit = assignedVehs.some(v => (v.type === 'VTU' || v.type === 'VTL' || v.type === 'VAHU') && v.logKit === reqKit.id);
      if (!hasCorrectKit) {
        kitMismatchAlert = `
          <div class="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-950 text-xs shadow-sm space-y-1.5 animate-pulse">
            <div class="flex items-center justify-between">
              <span class="font-black text-amber-900 flex items-center gap-1.5">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i>
                ⚠️ MATÉRIEL OPÉRATIONNEL EXIGÉ : ${reqKit.name}
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-950">Indispensable</span>
            </div>
            <p class="text-[11px] text-amber-900 leading-snug">
              Cette mission requiert un véhicule logistique (VTU) armé avec le <strong>${reqKit.name}</strong> (${reqKit.desc}). Sans ce kit opérationnel, le dispositif ne dispose pas du matériel requis par l'autorité.
            </p>
          </div>
        `;
      } else {
        kitMismatchAlert = `
          <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-2xs">
            <span class="font-black flex items-center gap-1.5">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
              Dotation Matérielle Conforme : ${reqKit.shortName} armé à bord du dispositif ✓
            </span>
          </div>
        `;
      }
    }

    if (!kitMismatchAlert && !hasUnrearmed) return '';

    return `
      <div class="space-y-2">
        <!-- Alerte Matériel Requis pour la mission -->
        ${kitMismatchAlert}

        <!-- État de réarmement des véhicules engagés -->
        ${hasUnrearmed ? `
          <div class="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 text-amber-950 dark:text-amber-100 text-xs shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 dark:text-amber-400"></i>
                ⚠️ VÉHICULE NON RÉARMÉ SUR CE DISPOSITIF
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border dark:border-amber-700">Vigilance</span>
            </div>
            <p class="text-[11px] text-amber-800 dark:text-amber-200/90 leading-snug">
              ${unrearmedVehs.map(v => `<strong>${v.name}</strong> (Armement : ${v.armementLevel || 70}%)`).join(', ')} n'ont pas été réarmés après leur précédente intervention.
            </p>

            <div class="flex items-center gap-2 pt-1 flex-wrap">
              ${armedLogVeh ? `
                <button onclick="window.ProtecCriseLogistique.rearmVehicle(window.game, '${unrearmedVehs[0]?.id}', '${mission.id}')" 
                  class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition shadow flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                  <span>Réarmer sur zone via le ${armedLogVeh.name} LOG</span>
                </button>
              ` : `
                <div class="p-2.5 rounded-xl bg-amber-100/90 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 text-[11px] text-amber-950 dark:text-amber-100 font-semibold flex items-center gap-2 shadow-xs">
                  <i data-lucide="info" class="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0"></i>
                  <span class="leading-relaxed">Réarmement sur zone impossible : aucun véhicule LOG armé (VTU avec Kit DPS) n'est présent sur les lieux. Le véhicule doit se réarmer au local.</span>
                </div>
              `}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Affichage du transit des bénévoles (masqué pour éviter les détails de configuration superflus)
  renderConvergenceTimeHTML(game, mission) {
    return '';
  },

  // Rendu complet de la Main Courante et du pilotage de crise pour openMissionDetails
  renderCrisisDetailsHTML(game, mission) {
    this.injectState(game);
    if (!mission.operationalLog) this.initMissionOperationalLog(mission);
    this.sanitizeOperationalLogs(mission);

    const engaged = game.volunteers.filter(v => (mission.registeredVolunteers || []).includes(v.id));
    const logs = mission.operationalLog || [];

    return `
      <div class="space-y-4">
        <!-- BANNIÈRE DE GOUVERNANCE & PRISE DE COMMANDEMENT DE CRISE -->
        ${(() => {
          const myId = game.player?.id || 'usr_local';
          const isManager = (mission.managerPlayerId === myId);
          const hasOtherManager = (mission.managerPlayerId && !isManager);

          if (isManager) {
            return `
              <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border-2 border-emerald-500 shadow-md flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs">
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <div class="text-xs font-black text-emerald-200 flex items-center gap-1.5">
                      <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-300"></i>
                      <span>Commandement Établi • Vous dirigez cette crise</span>
                    </div>
                    <p class="text-[10.5px] text-emerald-100/80">Vous assurez la direction des opérations, le déploiement et la logistique.</p>
                  </div>
                </div>
                <button 
                  onclick="window.ProtecCriseLogistique.releaseCrisisCommand(window.game, '${mission.id}')"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Céder la direction pour qu'un autre directeur du département puisse la prendre">
                  <i data-lucide="arrow-left-right" class="w-3.5 h-3.5"></i>
                  <span>Laisser la main</span>
                </button>
              </div>
            `;
          } else if (hasOtherManager) {
            return `
              <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-600/70 shadow-md flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-black">
                    <i data-lucide="user-check" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <div class="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                      <i data-lucide="lock" class="w-3.5 h-3.5 text-emerald-400"></i>
                      <span>Commandement Assuré par : ${mission.managerPlayerName || 'Directeur Allié'} (Non disponible)</span>
                    </div>
                    <p class="text-[10.5px] text-slate-300">Ce directeur coordonne les opérations. Vous ne pouvez intervenir qu'en répondant aux demandes de renfort.</p>
                  </div>
                </div>
                <span class="px-3 py-1.5 rounded-xl bg-emerald-900/80 text-emerald-200 border border-emerald-500/50 text-[11px] font-bold flex items-center gap-1.5">
                  <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                  <span>En appui renfort</span>
                </span>
              </div>
            `;
          } else {
            return `
              <div class="p-3.5 rounded-2xl bg-gradient-to-r from-red-950 via-amber-950 to-slate-900 border-2 border-red-500 shadow-md flex items-center justify-between gap-3 flex-wrap animate-pulse">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center">
                    <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <div class="text-xs font-black text-red-200 flex items-center gap-1.5">
                      <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-red-400"></i>
                      <span>Commandement de Crise Vacant</span>
                    </div>
                    <p class="text-[10.5px] text-slate-300">Prenez la direction de l'intervention.</p>
                  </div>
                </div>
                <button 
                  onclick="window.ProtecCriseLogistique.claimCrisisCommand(window.game, '${mission.id}')"
                  class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="shield" class="w-4 h-4"></i>
                  <span>Prendre la main sur la gestion</span>
                </button>
              </div>
            `;
          }
        })()}

        <!-- Bandeau d'état opérationnel SANS compte à rebours fixe -->
        <div class="p-4 rounded-3xl bg-amber-50/90 border border-amber-300 text-amber-950 dark:bg-slate-900 dark:border-slate-800 dark:text-white shadow-md space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase flex items-center gap-2 text-amber-800 dark:text-pc-orange">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              CELLULE DE CRISE ACTIVE (CODIS / PRÉFECTURE)
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-white/10 dark:text-slate-300 dark:border-transparent">
              Rotations : ${mission.rotationsCount || 0}
            </span>
          </div>
          <p class="text-[11px] text-amber-900/80 dark:text-slate-300 leading-snug">
            Durée indéterminée dépendante de l'évolution du sinistre sur le terrain. Surveillez la main courante radio et gérez la fatigue de vos secouristes.
          </p>
          <div class="flex items-center justify-between pt-1 border-t border-amber-200 dark:border-white/10 text-[11px]">
            <span class="text-amber-900/70 dark:text-slate-400">Effectifs engagés en première ligne :</span>
            <span class="font-extrabold text-amber-900 dark:text-pc-orange mono-num">${engaged.length} secouristes</span>
          </div>
        </div>

        <!-- ACTIONS OPÉRATIONNELLES SELON LA GOUVERNANCE -->
        ${(() => {
          const myId = game.player?.id || 'usr_local';
          const isManager = (mission.managerPlayerId === myId);
          const hasOtherManager = (mission.managerPlayerId && !isManager);

          if (hasOtherManager) {
            // Un autre joueur a la main : afficher uniquement la réponse aux demandes de renfort
            const missionRenforts = (game.renforts || []).filter(r => (r.missionId === mission.id || r.crisisId === mission.id) && r.status === 'open');
            if (missionRenforts.length > 0) {
              return `
                <div class="p-3.5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/50 border-2 border-indigo-400 dark:border-indigo-500/50 space-y-2.5 shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-black uppercase text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <i data-lucide="radio" class="w-4 h-4 text-indigo-600 animate-pulse"></i>
                      <span>Demandes de Renfort en Attente (${missionRenforts.length})</span>
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-900 dark:bg-indigo-900/80 dark:text-indigo-200">Appui Sollicité</span>
                  </div>
                  <div class="space-y-2">
                    ${missionRenforts.map(r => `
                      <div class="p-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs">
                        <div class="min-w-0 flex-1">
                          <strong class="text-xs font-black text-slate-900 dark:text-white block truncate">${r.title || 'Appel à renfort'}</strong>
                          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">${r.desc || r.unitRequested || 'Moyens sollicités pour la crise'}</p>
                          <span class="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">Besoin : ${r.unitRequested || 'Équipage VPSP / Secouristes'}</span>
                        </div>
                        <button onclick="window.game.openEngageRenfortModal('${r.id}')" class="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-indigo-600 hover:brightness-110 text-white shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer shrink-0">
                          <i data-lucide="send" class="w-3.5 h-3.5"></i>
                          <span>Détacher Renfort</span>
                        </button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            } else {
              return `
                <div class="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-slate-900 border border-emerald-300 dark:border-slate-700 text-center space-y-1">
                  <div class="flex items-center justify-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    <i data-lucide="shield" class="w-4 h-4 text-emerald-600"></i>
                    <span>Soutien Opérationnel • Aucune demande de renfort en attente</span>
                  </div>
                  <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Le directeur aux commandes (<strong>${mission.managerPlayerName || 'Directeur Allié'}</strong>) n'a pas émis de demande de renfort pour le moment. Vous recevrez une notification dès qu'un appui sera sollicité.
                  </p>
                </div>
              `;
            }
          }

          // Le joueur local a la main (ou la crise est vacante) : afficher les commandes de gestion
          return `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button onclick="window.ProtecCriseLogistique.performTeamRotation(window.game, '${mission.id}')" class="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pc-blue to-indigo-600 hover:brightness-110 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                <span>Relève d'Équipe (Rotation)</span>
              </button>
              ${mission.crisisCanClose ? `
                <button onclick="window.ProtecCriseLogistique.completeCrisisMission(window.game, '${mission.id}')" class="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black shadow-lg animate-pulse transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                  <span>Clôturer le Dispositif (Accord COS)</span>
                </button>
              ` : `
                <button onclick="window.game.evacuateToNearestHospital('${mission.id}', '${mission.assignedCrew?.vehicles[0]?.id}')" class="py-2.5 px-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <i data-lucide="siren" class="w-4 h-4"></i>
                  <span>Évacuer Victime CH (Statut 4)</span>
                </button>
              `}
            </div>
          `;
        })()}

        <!-- Suivi Énergie, Fatigue et Stress des Équipiers en Direct -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="activity" class="w-3.5 h-3.5 text-pc-orange"></i>
              État Physiologique des Équipiers sur le Terrain
            </h4>
            <span class="text-[10px] text-slate-400 font-semibold">Repos obligatoire si épuisé</span>
          </div>

          <div class="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            ${engaged.map(v => {
              const energy = v.energy || 75;
              const stress = v.stress || 15;
              const isTired = energy < 35;
              const isStressed = stress > 65;

              return `
                <div class="p-2.5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs hover:shadow-sm transition">
                  <div class="flex items-center gap-2">
                    ${game.getVolunteerAvatarHTML(v, 'w-7 h-7 text-xs')}
                    <div>
                      <div class="font-bold text-slate-800 dark:text-white leading-tight">${v.name}</div>
                      <div class="text-[9px] text-slate-400 font-semibold">${v.rank || 'Secouriste'} • Exp. ${v.experience || 30}%</div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-3">
                    <!-- Jauge Énergie -->
                    <div class="text-right">
                      <div class="text-[9px] font-bold ${isTired ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-500 dark:text-slate-400'}">
                        Énergie: ${energy}%
                      </div>
                      <div class="w-14 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div class="h-full rounded-full ${isTired ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${energy}%"></div>
                      </div>
                    </div>

                    <!-- Jauge Stress -->
                    <div class="text-right">
                      <div class="text-[9px] font-bold ${isStressed ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-500 dark:text-slate-400'}">
                        Stress: ${stress}%
                      </div>
                      <div class="w-14 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div class="h-full rounded-full ${isStressed ? 'bg-amber-500' : 'bg-pc-blue'}" style="width: ${stress}%"></div>
                      </div>
                    </div>

                    <!-- Bouton Retrait / Repos -->
                    <button onclick="window.ProtecCriseLogistique.withdrawVolunteer(window.game, '${mission.id}', '${v.id}')" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 dark:bg-slate-800 dark:hover:bg-rose-950/80 dark:hover:text-rose-200 dark:text-slate-300 font-black text-[10px] transition cursor-pointer" title="Désengager immédiatement ce secouriste et le renvoyer au repos">
                      🛑 Retirer
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Flotte de Véhicules Engagés sur le Sinistre & Désengagement -->
        ${(() => {
          const assignedVehIds = (mission.assignedVehicleIds || []).concat(mission.assignedCrew?.vehicles?.map(v => (typeof v === 'object' && v !== null ? v.id : v)) || []).concat(mission.assignedVehicles || []);
          const uniqueVehIds = Array.from(new Set(assignedVehIds.filter(Boolean)));
          const assignedVehs = (game.vehicles || []).filter(v => uniqueVehIds.includes(v.id));

          if (assignedVehs.length === 0) return '';

          return `
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="truck" class="w-3.5 h-3.5 text-pc-blue"></i>
                  Vecteurs & Véhicules Engagés (${assignedVehs.length})
                </h4>
                <span class="text-[10px] text-slate-400 font-semibold">Désengagement individuel avec retour base</span>
              </div>

              <div class="space-y-2">
                ${assignedVehs.map(veh => {
                  const crew = this.getVehicleAssignedCrew(mission, veh, game);
                  const isRearmed = veh.isRearmed !== false && (veh.armementLevel === undefined || veh.armementLevel >= 100);
                  const kitName = veh.logKit && this.LOG_KITS[veh.logKit] ? this.LOG_KITS[veh.logKit].shortName : (veh.type === 'VPSP' ? 'Armement Sanitaire' : 'Standard');

                  return `
                    <div class="p-2.5 rounded-2xl glass-card border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:shadow-xs transition">
                      <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-pc-blue/10 border border-pc-blue/20 flex items-center justify-center shrink-0">
                          <i data-lucide="${veh.type === 'VPSP' ? 'ambulance' : 'truck'}" class="w-4 h-4 text-pc-blue"></i>
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="font-extrabold text-slate-900 dark:text-white">${veh.name}</span>
                            <span class="px-2 py-0.5 rounded text-[9.5px] font-black bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">${veh.type}</span>
                            <span class="px-2 py-0.5 rounded text-[9px] font-bold ${isRearmed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'}">
                              ${isRearmed ? '✓ Armé' : '⚠️ Non réarmé'}
                            </span>
                          </div>
                          <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span>Équipage (${crew.length}) :</span>
                            <strong class="text-slate-700 dark:text-slate-200">${crew.map(c => c.name).join(', ') || 'Aucun équipier à bord'}</strong>
                            <span>•</span>
                            <span class="text-sky-700 dark:text-sky-400 font-semibold">${kitName}</span>
                          </div>
                        </div>
                      </div>

                      <div class="shrink-0 flex items-center gap-2">
                        <button 
                          type="button" 
                          onclick="window.game.toggleMissionVehicle('${mission.id}', '${veh.id}')" 
                          class="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-300 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-200 dark:border-rose-800 font-black text-[11px] transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer" 
                          title="Désengager immédiatement ce véhicule et son équipage pour les faire rentrer à la base">
                          <i data-lucide="corner-down-left" class="w-3.5 h-3.5"></i>
                          <span>🛑 Désengager (Retour Base)</span>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        })()}

        <!-- MAIN COURANTE OPÉRATIONNELLE CHRONOLOGIQUE -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="radio" class="w-3.5 h-3.5 text-pc-blue"></i>
              Main Courante des transmissions
            </h4>
            <span class="text-[10px] font-mono text-pc-blue font-bold animate-pulse">● EN DIRECT</span>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto pr-1 bg-slate-50/70 dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            ${logs.length === 0 ? `
              <div class="text-center text-slate-400 text-xs py-4">Attente des premiers messages radio...</div>
            ` : logs.map(l => {
              const borderCol = l.type === 'success' ? 'border-l-4 border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 border-slate-200/60 dark:border-emerald-900/40' : 
                               (l.type === 'alert' ? 'border-l-4 border-l-rose-500 bg-rose-50/60 dark:bg-rose-950/30 border-slate-200/60 dark:border-rose-900/40' : 
                               (l.type === 'milestone' ? 'border-l-4 border-l-pc-blue bg-blue-50/60 dark:bg-blue-950/30 border-slate-200/60 dark:border-blue-900/40' : 'border-l-4 border-l-slate-400 dark:border-l-slate-500 bg-white dark:bg-slate-800/90 border-slate-200/60 dark:border-slate-700/80'));
              return `
                <div class="p-2.5 rounded-xl border ${borderCol} text-xs space-y-1 shadow-sm group hover:border-slate-400 dark:hover:border-slate-600 transition">
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-extrabold text-slate-900 dark:text-white text-[11px] truncate">${l.source || 'PC Opérationnel'}</span>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      <span class="text-[9px] font-mono text-slate-400 dark:text-slate-400">${l.time}</span>
                      <button type="button" 
                              onclick="event.stopPropagation(); window.ProtecCrisisRadio && window.ProtecCrisisRadio.replay(this.dataset.text, this.dataset.source);"
                              data-text="${encodeURIComponent(l.text || '')}"
                              data-source="${encodeURIComponent(l.source || 'PC Opérationnel')}"
                              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 dark:bg-cyan-950/70 dark:hover:bg-cyan-900/90 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 dark:border-cyan-500/40 hover:border-cyan-500 transition text-[10px] font-bold cursor-pointer active:scale-95 shadow-2xs"
                              title="Réécouter cette transmission vocale (Piper TTS)">
                        <i data-lucide="volume-2" class="w-3 h-3 text-cyan-600 dark:text-cyan-400"></i>
                        <span>Réécouter</span>
                      </button>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-600 dark:text-slate-200 leading-snug">${l.text}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // Clôture définitive de la crise une fois autorisée par le COS
  completeCrisisMission(game, missionId) {
    if (!game) game = window.game;
    const mission = (game.missions || []).find(m => m.id === missionId);
    if (!mission) return;

    const myId = game.player?.id || 'usr_local';
    if (mission.managerPlayerId && mission.managerPlayerId !== myId) {
      game.showToast('Commandement Exclusif', `Seul le directeur de crise (${mission.managerPlayerName}) peut clôturer cette intervention.`, 'orange');
      return;
    }

    // Délégation impérative au gestionnaire global pour assurer le retour routier physique des véhicules et équipages
    if (typeof game.completeMission === 'function') {
      game.completeMission(mission);
      if (typeof game.closeDrawer === 'function') game.closeDrawer();
      const modal = document.getElementById('mission-modal');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      return;
    }

    mission.status = 'termine';
    mission.crisisCanClose = false;
    mission.endedAt = Date.now();
    const rewardMoney = mission.rewardMoney || 1200;
    const rewardReputation = mission.rewardReputation || 45;

    if (!game.resources) game.resources = { money: 0 };
    game.resources.money += rewardMoney;
    game.resources.reputationScore = Math.min(100, (game.resources.reputationScore || 0) + rewardReputation);

    // Libérer tous les effectifs engagés
    const engagedVols = (game.volunteers || []).filter(v =>
      (mission.registeredVolunteers || []).includes(v.id) ||
      (mission.assignedCrew?.volunteers || []).some(av => (typeof av === 'object' && av !== null ? av.id : av) === v.id) ||
      v.currentMissionId === mission.id ||
      v.missionId === mission.id
    );
    engagedVols.forEach(v => {
      v.status = 'dispo';
      v.currentMissionId = null;
      v.missionId = null;
      v.experience = Math.min(100, (v.experience || 30) + 10);
      v.stress = Math.min(20, Math.max(5, (v.stress || 20) - 25));
      v.energy = Math.max(v.energy || 50, 75);
    });

    // Libérer tous les véhicules engagés et marquer les VPSP pour réarmement
    const engagedVehicles = (game.vehicles || []).filter(v =>
      v.currentMissionId === mission.id ||
      v.missionId === mission.id ||
      (mission.assignedVehicles || []).includes(v.id) ||
      (mission.assignedCrew?.vehicles || []).some(av => (typeof av === 'object' && av !== null ? av.id : av) === v.id)
    );
    engagedVehicles.forEach(v => {
      v.status = 'a_rearme';
      v.needsRearming = true;
      v.currentMissionId = null;
      v.missionId = null;
      if (v.type === 'VPSP' || (v.name && v.name.includes('VPSP'))) {
        v.isRearmed = false;
      }
    });

    try {
      if (window.ProtecAudio) {
        if (typeof window.ProtecAudio.playSuccessChime === 'function') {
          window.ProtecAudio.playSuccessChime();
        } else if (typeof window.ProtecAudio.playInfoSound === 'function') {
          window.ProtecAudio.playInfoSound();
        }
      }
    } catch (e) {}

    game.showToast('Dispositif Clôturé avec Succès ! 🏆', `Fin de mission validée. +${rewardMoney} € versés à l'antenne, équipes de retour disponibles.`, 'green');
    
    if (typeof game.closeDrawer === 'function') game.closeDrawer();
    const modal = document.getElementById('mission-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    const drawer = document.getElementById('context-drawer');
    if (drawer) {
      drawer.classList.add('hidden');
      drawer.classList.remove('flex');
    }

    game.saveGame();
    game.renderMissions();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
  },

  // =========================================================================
  // 7. GÉNÉRATEUR DES 7 SCÉNARIOS OPÉRATIONNELS RÉALISTES
  // =========================================================================

  createScenarioMission(game, scenarioKey) {
    this.injectState(game);
    const base = game.stations[0] || { lat: 48.8566, lng: 2.3522, name: 'Antenne Principale' };
    const now = Date.now();
    const deptCode = String(game.currentDepartmentCode || game.stations?.[0]?.departmentCode || game.player?.departmentCode || '75');
    let m = null;

    if (scenarioKey === 'recherche_disparu') {
      const isParis = ['75', '92', '93', '94'].includes(deptCode);
      const loc = game.calculateRealisticMissionLocation(base, 'crise', {
        title: isParis ? 'Recherche Préfecture de Police : Disparition en Milieu Boisé (Bois de Boulogne)' : 'Recherche Gendarmerie : Personne Disparue en Forêt',
        targetEnvironment: isParis ? 'bois_paris' : 'foret_province'
      });
      const limits = typeof game.getCrisisConventionLimits === 'function'
        ? game.getCrisisConventionLimits('recherche', deptCode)
        : { maxVolunteers: 6, maxVtu: 1, conventionBadge: 'Convention AASC' };
      const vols = limits.maxVolunteers;
      m = {
        id: `scen_rech_${now}`,
        title: isParis ? 'Recherche Préfecture de Police : Disparition en Milieu Boisé' : 'Recherche Gendarmerie : Personne Disparue en Forêt',
        desc: isParis
          ? 'Réquisition de la Préfecture de Police (DSPAP / DOPC - Art. 74-1 CPP). Dispositif de ratissage au Bois de Boulogne / Vincennes avec Poste de Commandement (PC), Télépilote Drone thermique et équipes cynotechniques.'
          : 'Réquisition officielle par la Gendarmerie Nationale (Art. 74-1 CPP). Dispositif de battue avec Poste de Commandement (PC), Télépilote Drone thermique, maîtres-chiens cyno et VLTT 4x4.',
        type: 'crise',
        crisisType: 'recherche_disparu',
        isCrisis: true,
        scale: `${isParis ? 'BATTUE POLICE' : 'BATTUE GENDARMERIE'} [${limits.conventionBadge}] : Plafond ${vols} secouristes + Drone/Cyno`,
        urgency: 'haute',
        lat: loc.lat,
        lng: loc.lng,
        targetEnvironment: isParis ? 'bois_paris' : 'foret_province',
        requiredVolunteers: vols,
        requiredRanks: ['CD', 'PSE2', 'PSE1'],
        requiredVehicles: ['VL', 'VTU'],
        rewardMoney: Math.round(1000 + (vols * 70)),
        rewardReputation: 60,
        durationSeconds: 300,
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (scenarioKey === 'crash_aerien') {
      const loc = game.calculateRealisticMissionLocation(base, 'crise');
      const limits = typeof game.getCrisisConventionLimits === 'function'
        ? game.getCrisisConventionLimits('samu', deptCode)
        : { maxVolunteers: 8, maxVpsp: 2, conventionBadge: 'Convention Cadre SAMU' };
      const vols = limits.maxVolunteers;
      const vpspCount = Math.max(1, limits.maxVpsp);
      const vehList = ['VTU'];
      for (let i = 0; i < Math.min(2, vpspCount); i++) vehList.unshift('VPSP');
      m = {
        id: `scen_crash_${now}`,
        title: 'Plan Catastrophe : Crash Aérien & CAI CUMP (50 impliqués)',
        desc: 'Alerte majeure déclenchée par le SAMU et la Préfecture. Montage immédiat d’un Centre d’Accueil des Impliqués (CAI) sous astreinte CUMP. Soutien psychologique et secrétariat SINUS.',
        type: 'crise',
        crisisType: 'crash_aerien',
        isCrisis: true,
        isCumpCai: true,
        scale: `ORSEC / NOVI CUMP [${limits.conventionBadge}] : Plafond ${vols} secouristes, ${vehList.join('/')}`,
        urgency: 'critique',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: vols,
        requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
        requiredVehicles: vehList,
        rewardMoney: Math.round(1800 + (vols * 90)),
        rewardReputation: 85,
        durationSeconds: 400,
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (scenarioKey === 'incendie_ehpad') {
      const loc = game.calculateRealisticMissionLocation(base, 'crise');
      const limits = typeof game.getCrisisConventionLimits === 'function'
        ? game.getCrisisConventionLimits('pompiers', deptCode)
        : { maxVolunteers: 6, maxVpsp: 1, conventionBadge: 'Convention SDIS' };
      const vols = limits.maxVolunteers;
      m = {
        id: `scen_ehpad_${now}`,
        title: 'Incendie EHPAD : Évacuation Sanitaire & Mise à l’Abri',
        desc: 'Feu dans un établissement pour personnes âgées. Le CODIS missionne la Protection Civile pour l’évacuation d’urgence de résidents valides et dépendants vers la salle des fêtes dans la limite des contingents conventionnés.',
        type: 'crise',
        crisisType: 'incendie_ehpad',
        isCrisis: true,
        scale: `ÉVACUATION COLLECTIVE [${limits.conventionBadge}] : Plafond ${vols} secouristes + VPSP/VTU`,
        urgency: 'critique',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: vols,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP', 'VTU'],
        rewardMoney: Math.round(1300 + (vols * 80)),
        rewardReputation: 65,
        durationSeconds: 320,
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (scenarioKey === 'manifestation_etudiante') {
      const loc = game.calculateRealisticMissionLocation(base, 'pompiers');
      m = {
        id: `scen_manif_${now}`,
        title: 'Manifestation Étudiante : Garde Caserne SDIS & Astreinte H-12',
        desc: 'Préalerte préfectorale J-1 : mobilisation d’un équipage VPSP en caserne de pompiers pour compenser la forte sollicitation opérationnelle en centre-ville.',
        type: 'pompiers',
        isCrisis: false,
        scale: 'GARDE SDIS RENFORT (3 secouristes + VPSP)',
        urgency: 'haute',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 3,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP'],
        rewardMoney: 520,
        rewardReputation: 35,
        durationSeconds: 220,
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (scenarioKey === 'canicule_sncf') {
      const loc = game.calculateRealisticMissionLocation(base, 'social');
      m = {
        id: `scen_canicule_${now}`,
        title: 'Vigilance Canicule SNCF : Distribution en Gare & Voies',
        desc: 'Convention nationale SNCF activée : températures extrêmes et retards de trains. Équipes Protec déployées sur les quais pour distribuer eau fraîche, brumisateurs et bilans.',
        type: 'sncf',
        isCrisis: false,
        scale: 'SOUTIEN EN GARE SNCF (4 secouristes + VTU)',
        urgency: 'haute',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 4,
        requiredRanks: ['PSE1', 'Secouriste'],
        requiredVehicles: ['VTU'],
        rewardMoney: 680,
        rewardReputation: 40,
        durationSeconds: 200,
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (scenarioKey === 'tempete_rouge') {
      const loc = game.calculateRealisticMissionLocation(base, 'crise');
      const limits = typeof game.getCrisisConventionLimits === 'function'
        ? game.getCrisisConventionLimits('prefecture', deptCode)
        : { maxVolunteers: 8, conventionBadge: 'Convention ORSEC' };
      const vols = limits.maxVolunteers;
      m = {
        id: `scen_tempete_${now}`,
        title: 'Tempête Alerte Rouge : Renfort CHU & Déblaiement',
        desc: 'Vigilance rouge vents violents. Renfort interdépartemental mobilisé : sécurisation des accès du CHU, bâchage de toitures et accueil des naufragés de la route dans les limites de la convention ORSEC.',
        type: 'crise',
        crisisType: 'tempete_rouge',
        isCrisis: true,
        scale: `DÉTACHEMENT INTEMPÉRIES [${limits.conventionBadge}] : Plafond ${vols} secouristes + Lots Pompe/Tronço`,
        urgency: 'critique',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: vols,
        requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VTU', 'VL'],
        rewardMoney: Math.round(1500 + (vols * 80)),
        rewardReputation: 75,
        durationSeconds: 350,
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    } else if (scenarioKey === 'grand_froid') {
      const loc = game.calculateRealisticMissionLocation(base, 'samu');
      m = {
        id: `scen_froid_${now}`,
        title: 'Plan Grand Froid : Garde SDIS SUAP (2 VPSP)',
        desc: 'Verglas généralisé et températures glaciales. Pic d’activité SUAP pour les pompiers : l’antenne fournit 2 ambulances VPSP pour assurer les départs réflexes.',
        type: 'samu',
        isCrisis: false,
        scale: 'DOUBIE GARDE VPSP (6 secouristes + 2 VPSP)',
        urgency: 'haute',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 6,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP', 'VPSP'],
        rewardMoney: 850,
        rewardReputation: 50,
        durationSeconds: 240,
        eventDate: { ...game.clock },
        status: 'declenche',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] }
      };
    }

    if (m) {
      this.initMissionOperationalLog(m);
      game.missions.unshift(m);
      game.renderMissions();
      game.saveGame();
      if (window.ProtecAudio) {
        if (m.isCrisis) window.ProtecAudio.playCrisisAlertSound();
        else window.ProtecAudio.playInfoSound();
      }
      game.showToast('Scénario Déclenché ! 🚨', `Nouvelle mission : « ${m.title} ».`, m.isCrisis ? 'red' : 'blue', { type: m.isCrisis ? 'crise' : 'mission', id: m.id });
      game.openMissionDetails(m.id);
    }
  },

  // =========================================================================
  // NOUVEAU SYSTÈME AVANCÉ DE GESTION DE CRISES ET PLANS D'URGENCE (TEMPS RÉEL)
  // =========================================================================

  /**
   * Déclenche une crise majeure (NOVI, recherche de disparu, grève, violences, inondation CAI)
   */
  triggerCrisis(game, crisisType, isProgrammee = null) {
    if (!game) game = window.game;
    this.injectState(game);

    // Récupération du template dans protec_database.json ou templates intégrés de secours
    let template = null;
    if (window.ProtecDatabase && window.ProtecDatabase.crisisTemplates && window.ProtecDatabase.crisisTemplates[crisisType]) {
      template = JSON.parse(JSON.stringify(window.ProtecDatabase.crisisTemplates[crisisType]));
    } else {
      template = this.getFallbackCrisisTemplate(crisisType);
    }

    if (!template) {
      console.warn(`Template introuvable pour la crise ${crisisType}`);
      return null;
    }

    const deptCode = String(game.currentDepartmentCode || game.stations?.[0]?.departmentCode || game.player?.departmentCode || '75');
    const isParisArea = ['75', '92', '93', '94'].includes(deptCode);

    // Adaptation contextuelle réaliste pour l'agglomération parisienne
    if (isParisArea && (crisisType === 'recherche_disparu' || template.type === 'recherche_disparu')) {
      template.autorite_demandeur = 'Préfecture de Police (DSPAP / DOPC)';
      template.autorite_code = 'police';
      template.titre = 'Recherche Préfecture de Police : Personne Vulnérable (Bois Parisiens)';
      template.description = 'Disparition très inquiétante au Bois de Boulogne / Vincennes. Ratissage pédestre réquisitionné par la Préfecture de Police (Art. 74-1 CPP), équipes cyno et drone thermique.';
      if (template.phases && template.phases[0]) {
        template.phases[0].ordre_radio = 'COMMANDEMENT POLICE : Déploiement du PC Mobile au carrefour des cascades. Mise en place de la battue de recherche.';
      }
    }

    const now = Date.now();
    const crisisId = `crise_${crisisType}_${now}`;
    const anticipationMode = isProgrammee !== null ? (isProgrammee ? 'programmee' : 'immediate') : template.anticipation;

    const newCrisis = {
      id: crisisId,
      type: template.type,
      titre: template.titre,
      anticipation: anticipationMode,
      autorite_demandeur: template.autorite_demandeur,
      autorite_code: template.autorite_code || 'prefecture',
      niveau_alerte: template.niveau_alerte || 'ALERTE MAJEURE',
      description: template.description || '',
      currentPhaseIndex: 0,
      phase_courante: template.phases && template.phases[0] ? template.phases[0].nom : 'Phase 1 : Déploiement Initial',
      phases: template.phases || [],
      recompenses: template.recompenses || {},
      penalites: template.penalites || {},
      journal_crise: [
        {
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: now,
          source: template.autorite_demandeur,
          type: 'ordre',
          text: `ACTIVATION DU DISPOSITIF : ${template.titre}. Ordre d'ouverture immédiate du PC Crise et mise en alerte opérationnelle.`
        }
      ],
      startedAt: now,
      mobilisation: {
        deltaMaxMinutes: 30,
        mode: 'ciblee', // 'ciblee' | 'generale'
        mobilisedVolunteerIds: []
      },
      reserve: {
        onBase: [],
        astreinteDomicile: []
      },
      status: 'active' // 'active' | 'terminee' | 'echec'
    };

    // Adaptation proportionnelle des sous-missions aux plafonds fixés par la convention de l'autorité
    const authKey = template.autorite_code || template.type || crisisType;
    const convLimits = typeof game.getCrisisConventionLimits === 'function'
      ? game.getCrisisConventionLimits(authKey, deptCode)
      : null;

    if (convLimits && Array.isArray(newCrisis.phases)) {
      newCrisis.phases.forEach(phase => {
        if (Array.isArray(phase.sous_missions)) {
          phase.sous_missions.forEach(sub => {
            if (sub.moyens_requis) {
              if (sub.moyens_requis.vols_count && sub.moyens_requis.vols_count > convLimits.maxVolunteers) {
                sub.moyens_requis.vols_count = Math.max(2, convLimits.maxVolunteers);
              }
              if (Array.isArray(sub.moyens_requis.vehicles)) {
                const reqVpsp = sub.moyens_requis.vehicles.filter(v => v === 'VPSP').length;
                if (reqVpsp > convLimits.maxVpsp) {
                  sub.moyens_requis.vehicles = sub.moyens_requis.vehicles.filter(v => v !== 'VPSP');
                  for (let i = 0; i < Math.max(1, convLimits.maxVpsp); i++) {
                    sub.moyens_requis.vehicles.unshift('VPSP');
                  }
                }
              }
            }
          });
        }
      });
    }

    // Initialiser les sous-missions de la première phase
    if (newCrisis.phases.length > 0 && newCrisis.phases[0].sous_missions) {
      newCrisis.phases[0].sous_missions.forEach(sub => {
        sub.statut = 'en_attente';
        sub.progression = 0;
        sub.assignedCrew = {
          volunteers: [],
          vehicles: []
        };
      });

      // Ajout de l'ordre radio de phase dans le journal
      if (newCrisis.phases[0].ordre_radio) {
        newCrisis.journal_crise.push({
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          timestamp: now + 500,
          source: 'Régulation ' + template.autorite_demandeur,
          type: 'ordre',
          text: newCrisis.phases[0].ordre_radio
        });
      }
    }

    // Auto-enregistrement dans game.activeCrises
    if (!game.activeCrises) game.activeCrises = [];
    newCrisis.departmentCode = deptCode;
    newCrisis.title = newCrisis.titre;

    // Garantie des coordonnées GPS
    if (!newCrisis.lat || !newCrisis.lng) {
      const baseStation = game.stations?.[0] || { lat: 48.6921, lng: 6.1844, name: 'Antenne', departmentCode: deptCode };
      if (typeof game.calculateRealisticMissionLocation === 'function') {
        const coords = game.calculateRealisticMissionLocation(baseStation, template.autorite_code || 'prefecture', {
          title: template.titre,
          targetEnvironment: (crisisType === 'recherche_disparu' || template.type === 'recherche_disparu')
            ? (isParisArea ? 'bois_paris' : 'foret_province')
            : null
        });
        newCrisis.lat = coords.lat;
        newCrisis.lng = coords.lng;
        newCrisis.targetEnvironment = coords.targetEnvironment || ((crisisType === 'recherche_disparu' || template.type === 'recherche_disparu') ? (isParisArea ? 'bois_paris' : 'foret_province') : null);
      } else {
        newCrisis.lat = baseStation.lat;
        newCrisis.lng = baseStation.lng;
      }
    }

    // Initialisation du ciblage initial et de l'escalade selon la décision du Président APC
    this.setupCrisisAlertEscalation(game, newCrisis, deptCode);

    game.activeCrises.unshift(newCrisis);

    // Synchronisation et persistance départementale sur Supabase
    if (window.ProtecSupabase) {
      if (typeof window.ProtecSupabase.saveDepartmentCrisis === 'function') {
        window.ProtecSupabase.saveDepartmentCrisis(newCrisis, deptCode);
      }
      if (typeof window.ProtecSupabase.broadcastDepartmentCrisis === 'function') {
        window.ProtecSupabase.broadcastDepartmentCrisis({
          departmentCode: deptCode,
          crisisData: newCrisis,
          senderId: game.player?.id || 'DIRECTEUR'
        });
      }
    }

    const isTargetedToMe = !newCrisis.targetPlayerId || newCrisis.targetPlayerId === game.player?.id;

    if (isTargetedToMe) {
      if (window.ProtecAudio) {
        window.ProtecAudio.playCrisisAlertSound();
      }

      game.showToast(
        '🚨 PLAN D\'URGENCE DÉCLENCHÉ',
        `${newCrisis.titre} réquisitionné par ${newCrisis.autorite_demandeur} !`,
        'red',
        { type: 'crise', id: newCrisis.id }
      );
      this.openPcCriseModal(game, newCrisis.id);
    } else {
      game.showToast(
        '🟡 CRISE DÉPARTEMENTALE EN ATTENTE',
        `« ${newCrisis.titre} ». Alerte transmise en priorité à l'antenne la plus proche (${newCrisis.targetPlayerName || 'Directeur'}).`,
        'amber',
        { type: 'crise', id: newCrisis.id }
      );
    }

    game.saveGame();
    return newCrisis;
  },

  // =========================================================================
  // GOUVERNANCE, ATTRIBUTION & ESCALADE DE CRISE DÉPARTEMENTALE (RÈGLES APC)
  // =========================================================================

  /**
   * Calcule la distance en km entre 2 coordonnées GPS
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371; // Rayon terrestre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Trouve le joueur dont une antenne est la plus proche géographiquement du sinistre
   */
  findClosestDepartmentPlayer(game, deptCode, lat, lng) {
    if (!game) game = window.game;
    let closest = null;
    let minDistance = Infinity;

    // 1. Antennes locales du joueur courant
    (game.stations || []).forEach(st => {
      const stDept = String(st.departmentCode || game.player?.departmentCode || deptCode);
      if (stDept === String(deptCode) && st.lat && st.lng) {
        const dist = this.calculateDistanceKm(lat, lng, st.lat, st.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = {
            playerId: game.player?.id || 'usr_local',
            playerName: game.player?.name || 'Directeur Local',
            stationName: st.name,
            distanceKm: Math.round(dist * 10) / 10,
            isLocal: true
          };
        }
      }
    });

    // 2. Antennes des directeurs alliés
    (game.allianceStations || []).forEach(st => {
      const stDept = String(st.departmentCode || deptCode);
      if (stDept === String(deptCode) && st.lat && st.lng) {
        const dist = this.calculateDistanceKm(lat, lng, st.lat, st.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = {
            playerId: st.playerId || st.ownerId,
            playerName: st.playerName || st.ownerName || 'Directeur Allié',
            stationName: st.name,
            distanceKm: Math.round(dist * 10) / 10,
            isLocal: (st.playerId === game.player?.id)
          };
        }
      }
    });

    // 3. Fallback cache directeurs APC
    if (!closest && window.ProtecAPC?.deptPlayersCache) {
      const players = window.ProtecAPC.deptPlayersCache.filter(p => String(p.departmentCode) === String(deptCode));
      if (players.length > 0) {
        const p = players[0];
        closest = {
          playerId: p.id,
          playerName: p.name,
          stationName: p.stationName || 'Antenne Départementale',
          distanceKm: 5,
          isLocal: (p.id === game.player?.id)
        };
      }
    }

    return closest;
  },

  /**
   * Vérifie si un cadre de permanence d'astreinte départementale est actuellement en service
   */
  getDepartmentAstreinteOfficer(game, deptCode) {
    if (!game) game = window.game;
    const veilleDept = game.veilleOperationnelle?.departemental;
    if (veilleDept && veilleDept.currentOfficer) {
      const off = veilleDept.currentOfficer;
      const now = Date.now();
      if (!off.endsAt || off.endsAt > now) {
        return {
          playerId: off.playerId,
          playerName: off.playerName,
          stationName: off.stationName || 'Astreinte Départementale',
          isLocal: (off.playerId === game.player?.id)
        };
      }
    }
    return null;
  },

  /**
   * Initialise le protocole d'alerte et d'escalade selon la décision du Président APC
   */
  setupCrisisAlertEscalation(game, crisis, deptCode) {
    if (!game) game = window.game;
    const apc = window.ProtecAPC?.cachedAPC;
    const strategy = apc?.crisisAlertStrategy || 'proche'; // 'proche' | 'astreinte' | 'tous'
    const timeoutSec = apc?.crisisAckTimeoutSeconds || 45;

    crisis.strategyApplied = strategy;
    crisis.managerPlayerId = null;
    crisis.managerPlayerName = null;
    crisis.acknowledged = false;

    if (strategy === 'tous') {
      crisis.alertStage = 'broadcast_all';
      crisis.targetPlayerId = null;
      crisis.targetPlayerName = null;
      crisis.ackDeadline = null;
    } else if (strategy === 'astreinte') {
      const officer = this.getDepartmentAstreinteOfficer(game, deptCode);
      if (officer) {
        crisis.alertStage = 'targeted_astreinte';
        crisis.targetPlayerId = officer.playerId;
        crisis.targetPlayerName = officer.playerName;
        crisis.ackDeadline = Date.now() + (timeoutSec * 1000);
      } else {
        // Pas d'astreinte active : relais antenne la plus proche ou broadcast
        const nearest = this.findClosestDepartmentPlayer(game, deptCode, crisis.lat, crisis.lng);
        if (nearest) {
          crisis.alertStage = 'targeted_nearest';
          crisis.targetPlayerId = nearest.playerId;
          crisis.targetPlayerName = nearest.playerName;
          crisis.ackDeadline = Date.now() + (timeoutSec * 1000);
        } else {
          crisis.alertStage = 'broadcast_all';
          crisis.targetPlayerId = null;
          crisis.ackDeadline = null;
        }
      }
    } else {
      // Stratégie 'proche' (par défaut)
      const nearest = this.findClosestDepartmentPlayer(game, deptCode, crisis.lat, crisis.lng);
      if (nearest) {
        crisis.alertStage = 'targeted_nearest';
        crisis.targetPlayerId = nearest.playerId;
        crisis.targetPlayerName = nearest.playerName;
        crisis.ackDeadline = Date.now() + (timeoutSec * 1000);
      } else {
        const officer = this.getDepartmentAstreinteOfficer(game, deptCode);
        if (officer) {
          crisis.alertStage = 'targeted_astreinte';
          crisis.targetPlayerId = officer.playerId;
          crisis.targetPlayerName = officer.playerName;
          crisis.ackDeadline = Date.now() + (timeoutSec * 1000);
        } else {
          crisis.alertStage = 'broadcast_all';
          crisis.targetPlayerId = null;
          crisis.ackDeadline = null;
        }
      }
    }

    return crisis;
  },

  /**
   * Fait progresser l'escalade si le délai d'acquittement est expiré sans réponse
   */
  checkAndEscalateCrisis(game, crisis) {
    if (!crisis || crisis.managerPlayerId || crisis.status === 'terminee' || crisis.status === 'echec') return;
    if (crisis.alertStage === 'broadcast_all') return;
    if (!crisis.ackDeadline || Date.now() < crisis.ackDeadline) return;

    const deptCode = crisis.departmentCode || game.currentDepartmentCode || '54';
    const timeoutSec = 45;

    if (crisis.alertStage === 'targeted_nearest') {
      // L'antenne la plus proche n'a pas répondu -> Passer le relais à l'astreinte départementale
      const officer = this.getDepartmentAstreinteOfficer(game, deptCode);
      if (officer) {
        crisis.alertStage = 'targeted_astreinte';
        crisis.targetPlayerId = officer.playerId;
        crisis.targetPlayerName = officer.playerName;
        crisis.ackDeadline = Date.now() + (timeoutSec * 1000);

        this.logCrisisRadio(crisis, 'Régulation Préfecture', `ABSENCE D'ACQUITTEMENT [Antenne la plus proche]. Escalade du protocole : alerte transmise à l'Astreinte Départementale (${officer.playerName}).`, 'ordre');

        if (officer.playerId === game.player?.id) {
          if (window.ProtecAudio) window.ProtecAudio.playCrisisAlertSound();
          game.showToast(
            '🚨 RELAIS ASTREINTE DÉPARTEMENTALE',
            `L'antenne la plus proche n'a pas acquitté la crise « ${crisis.titre || crisis.title} ». En tant que cadre d'astreinte, vous devez prendre le relais !`,
            'red',
            { type: 'crise', id: crisis.id }
          );
        }
      } else {
        // Pas d'astreinte départementale en service -> Alerte générale à tous les directeurs
        this.escalateToBroadcastAll(game, crisis, "Absence de réponse de l'antenne la plus proche et aucune astreinte départementale active");
      }
    } else if (crisis.alertStage === 'targeted_astreinte') {
      // L'astreinte départementale n'a pas répondu sous 45s -> Alerte générale à tous les directeurs
      this.escalateToBroadcastAll(game, crisis, "L'astreinte départementale n'a pas acquitté le sinistre sous le délai imparti");
    }

    this.broadcastCrisisState(game, crisis);
    this.refreshPcCriseModalIfOpen(game);
    game.renderMissions();
    game.updateStatsUI();
  },

  /**
   * Déclenche l'alerte générale à tous les directeurs du département
   */
  escalateToBroadcastAll(game, crisis, reason) {
    crisis.alertStage = 'broadcast_all';
    crisis.targetPlayerId = null;
    crisis.targetPlayerName = null;
    crisis.ackDeadline = null;

    this.logCrisisRadio(crisis, 'Centre Opérationnel', `ALERTE GÉNÉRALE DÉPARTEMENTALE. ${reason}. Tous les directeurs du département sont mobilisés. Le premier répondant prendra la main.`, 'ordre');

    if (window.ProtecAudio) window.ProtecAudio.playCrisisAlertSound();
    game.showToast(
      '🚨 CRISE NON ACQUITTÉE • APPEL DÉPARTEMENTAL',
      `Mobilisation générale pour « ${crisis.titre || crisis.title} ». Prenez la main sur la gestion de crise !`,
      'red',
      { type: 'crise', id: crisis.id }
    );
  },

  /**
   * Action : Un joueur prend la main sur la gestion de la crise
   */
  claimCrisisCommand(game, crisisId) {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId) || (game.missions || []).find(m => m.id === crisisId);
    if (!crisis) return;

    const myId = game.player?.id || 'usr_local';
    const myName = game.player?.name || 'Directeur';

    // Sécurité contre la double prise de main concurrente
    if (crisis.managerPlayerId && crisis.managerPlayerId !== myId) {
      game.showToast('Prise de Main Impossible', `Le commandement de cette crise est déjà assuré par ${crisis.managerPlayerName}.`, 'orange');
      return;
    }

    crisis.managerPlayerId = myId;
    crisis.managerPlayerName = myName;
    crisis.alertStage = 'managed';
    crisis.acknowledged = true;
    crisis.ackDeadline = null;

    this.logCrisisRadio(crisis, 'Commandement Opérationnel', `PRISE DE COMMANDEMENT : Le Directeur ${myName} prend officiellement la direction des opérations du PC Crise.`, 'success');

    game.showToast(
      'Commandement Établi',
      `Vous assurez désormais la direction des opérations sur « ${crisis.titre || crisis.title} ».`,
      'green',
      { type: 'crise', id: crisis.id }
    );

    this.broadcastCrisisState(game, crisis);
    this.refreshPcCriseModalIfOpen(game);
    game.renderMissions();
    game.updateStatsUI();
    if (game.selectedMissionId === crisis.id) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(crisis.id);
      } else {
        game.openMissionDetails(crisis.id);
      }
    }
  },

  /**
   * Action : Le joueur coordinateur laisse la main pour qu'un autre puisse la prendre
   */
  releaseCrisisCommand(game, crisisId) {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId) || (game.missions || []).find(m => m.id === crisisId);
    if (!crisis) return;

    const myId = game.player?.id || 'usr_local';
    if (crisis.managerPlayerId !== myId) {
      game.showToast('Action Non Autorisée', 'Vous ne dirigez pas actuellement cette crise.', 'orange');
      return;
    }

    const prevName = crisis.managerPlayerName || 'Directeur';
    crisis.managerPlayerId = null;
    crisis.managerPlayerName = null;
    crisis.alertStage = 'broadcast_all'; // La crise redevient disponible pour tout le département
    crisis.ackDeadline = null;

    this.logCrisisRadio(crisis, 'Commandement Opérationnel', `PASSATION DE COMMANDEMENT : Le Directeur ${prevName} laisse la main. Le poste de commandement est vacant et disponible pour tout directeur du département.`, 'ordre');

    game.showToast(
      'Commandement Cédé',
      'Vous avez passé la main sur la gestion de cette crise. Un autre directeur peut désormais la reprendre.',
      'blue'
    );

    this.broadcastCrisisState(game, crisis);
    this.refreshPcCriseModalIfOpen(game);
    game.renderMissions();
    game.updateStatsUI();
    if (game.selectedMissionId === crisis.id) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(crisis.id);
      } else {
        game.openMissionDetails(crisis.id);
      }
    }
  },

  /**
   * Action d'un joueur ciblé pour passer immédiatement le relais à l'astreinte
   */
  forwardCrisisToAstreinte(game, crisisId) {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId) || (game.missions || []).find(m => m.id === crisisId);
    if (!crisis) return;

    const deptCode = crisis.departmentCode || game.currentDepartmentCode || '54';
    const officer = this.getDepartmentAstreinteOfficer(game, deptCode);

    if (officer) {
      crisis.alertStage = 'targeted_astreinte';
      crisis.targetPlayerId = officer.playerId;
      crisis.targetPlayerName = officer.playerName;
      crisis.ackDeadline = Date.now() + 45000;
      this.logCrisisRadio(crisis, 'Régulation', `Relais volontaire transmis vers l'Astreinte Départementale (${officer.playerName}).`, 'ordre');
      game.showToast('Relais Transmis', `La crise a été passée à l'Astreinte Départementale (${officer.playerName}).`, 'blue');
    } else {
      this.escalateToBroadcastAll(game, crisis, "Relais volontaire sans astreinte active");
    }

    this.broadcastCrisisState(game, crisis);
    this.refreshPcCriseModalIfOpen(game);
    game.renderMissions();
    game.updateStatsUI();
  },

  /**
   * Diffusion et sauvegarde synchronisée de l'état de la crise
   */
  broadcastCrisisState(game, crisis) {
    if (!game) game = window.game;
    const deptCode = crisis.departmentCode || game.currentDepartmentCode || '54';

    if (window.ProtecSupabase) {
      if (typeof window.ProtecSupabase.saveDepartmentCrisis === 'function') {
        window.ProtecSupabase.saveDepartmentCrisis(crisis, deptCode);
      }
      if (typeof window.ProtecSupabase.broadcastDepartmentCrisisUpdate === 'function') {
        window.ProtecSupabase.broadcastDepartmentCrisisUpdate({
          id: crisis.id,
          departmentCode: deptCode,
          crisisData: crisis,
          managerPlayerId: crisis.managerPlayerId,
          managerPlayerName: crisis.managerPlayerName,
          alertStage: crisis.alertStage,
          targetPlayerId: crisis.targetPlayerId,
          targetPlayerName: crisis.targetPlayerName,
          ackDeadline: crisis.ackDeadline
        });
      }
    }

    // Diffusion serveur local
    fetch('/api/crises/department/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        departmentCode: deptCode,
        crisisData: crisis,
        senderId: game.player?.id || 'DIRECTEUR'
      })
    }).catch(() => {});
  },

  /**
   * Fallback intégré si la base de données json externe n'est pas encore chargée
   */
  getFallbackCrisisTemplate(type) {
    const templates = {
      novi_attentat: {
        type: 'novi_attentat',
        titre: 'Plan NOVI / Attentat Urbain Multi-Sites',
        anticipation: 'immediate',
        autorite_demandeur: 'Préfecture & SAMU 15',
        autorite_code: 'prefecture',
        niveau_alerte: 'URGENCE ABSOLUE (Plan Rouge)',
        description: 'Attaque terroriste et fusillade. La Protection Civile est réquisitionnée pour assurer les norias d\'évacuation VPSP, le relevage des urgences relatives et le soutien CUMP.',
        phases: [
          {
            phase_id: 1,
            nom: 'Phase 1 : Noria d\'Évacuation Initiale & Relevage Urgence',
            direction: 'montante',
            ordre_radio: 'CODIS / SAMU 15 : Déploiement réflexe de 2 VPSP en zone de triage PMA. Évacuation prioritaire des urgences relatives vers le CHU.',
            sous_missions: [
              {
                id: 'sub_noria_vpsp_1',
                type: 'noria_vpsp',
                titre: 'Noria VPSP #1 - Évacuation PMA vers CHU',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP'] },
                progression: 0,
                duree_estimee_sec: 1800
              },
              {
                id: 'sub_noria_vpsp_2',
                type: 'noria_vpsp',
                titre: 'Noria VPSP #2 - Relevage & Brancardage Sécurisé',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['PSE2', 'PSE1', 'PSE1'], vehicles: ['VPSP'] },
                progression: 0,
                duree_estimee_sec: 2100
              }
            ]
          },
          {
            phase_id: 2,
            nom: 'Phase 2 : Escalade - Armement CAI & Renfort CUMP',
            direction: 'montante',
            ordre_radio: 'PRÉFECTURE (COD) : Afflux massif de témoins choqués. Ordre de monter immédiatement le Centre d\'Accueil des Impliqués (CAI) sous coordination CUMP.',
            sous_missions: [
              {
                id: 'sub_montage_cai',
                type: 'montage_cai',
                titre: 'Déploiement CAI & Sas SINUS (Accueil Impliqués)',
                statut: 'en_attente',
                moyens_requis: { vols_count: 4, ranks: ['CD', 'PSE2', 'PSE1'], vehicles: ['VTU'], specialite_requise: 'aep' },
                progression: 0,
                duree_estimee_sec: 2400
              }
            ]
          },
          {
            phase_id: 3,
            nom: 'Phase 3 : Stabilisation & Désengagement Partiel',
            direction: 'descendante',
            ordre_radio: 'MÉDECIN-CHEF SAMU : Évacuation terminée sur le site principal. Autorisation de libérer les VPSP de noria pour réarmement immédiat.',
            sous_missions: [
              {
                id: 'sub_maintien_cai',
                type: 'veille_cai',
                titre: 'Poursuite Accueil & Ravitaillement CAI',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['PSE1'], vehicles: ['VL'] },
                progression: 0,
                duree_estimee_sec: 1500
              }
            ]
          }
        ],
        recompenses: { reputation_prefecture: 40, reputation_samu: 35, reputation_sdis: 20, indemnite_crise: 3800 },
        penalites: { reputation_prefecture: -35, reputation_samu: -25, amende_administrative: 2500 }
      },
      recherche_disparu: {
        type: 'recherche_disparu',
        titre: 'Recherche de Disparu Vulnérable en Milieu Périlleux',
        anticipation: 'immediate',
        autorite_demandeur: 'Gendarmerie Nationale & Préfecture',
        autorite_code: 'gendarmerie',
        niveau_alerte: 'ALERTE DISPARITION INQUIÉTANTE',
        description: 'Disparition d\'une personne vulnérable en zone boisée. Ratissage pédestre, équipes cynotechniques et drone thermique.',
        phases: [
          {
            phase_id: 1,
            nom: 'Phase 1 : Établissement du PC Mobile & Battue Initiale',
            direction: 'montante',
            ordre_radio: 'COMMANDEMENT GENDARMERIE : Déploiement du PC Mobile au carrefour forestier. Mise en place de la battue.',
            sous_missions: [
              {
                id: 'sub_pc_mobile',
                type: 'poste_commandement',
                titre: 'Armement PC Mobile & Cartographie SIG',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['CD', 'CE'], vehicles: ['PCM', 'VL'] },
                progression: 0,
                duree_estimee_sec: 1800
              },
              {
                id: 'sub_battue_ligne',
                type: 'battue_pedestre',
                titre: 'Ligne de Battue Pédestre Tout-Terrain',
                statut: 'en_attente',
                moyens_requis: { vols_count: 4, ranks: ['PSE2', 'PSE1', 'Secouriste'], vehicles: ['VLTT', 'VTU'] },
                progression: 0,
                duree_estimee_sec: 2100
              }
            ]
          },
          {
            phase_id: 2,
            nom: 'Phase 2 : Montée en Puissance Spécialistes (Drones / Cyno)',
            direction: 'montante',
            ordre_radio: 'GENDARMERIE : Nuit tombante. Demande urgente de survol drone à caméra thermique et de chiens de quête.',
            sous_missions: [
              {
                id: 'sub_drone_thermique',
                type: 'reconnaissance_drone',
                titre: 'Télépilote Drone : Balayage Caméra Infrarouge',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['CE', 'PSE2'], vehicles: ['VTD', 'VL'], specialite_requise: 'drone' },
                progression: 0,
                duree_estimee_sec: 2000
              },
              {
                id: 'sub_equipe_cyno',
                type: 'recherche_cyno',
                titre: 'Maître-Chien de Recherche et Sauvetage',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['PSE2', 'PSE1'], vehicles: ['VCYN', 'VLTT'], specialite_requise: 'cynotechnie' },
                progression: 0,
                duree_estimee_sec: 1900
              }
            ]
          },
          {
            phase_id: 3,
            nom: 'Phase 3 : Localisation & Évacuation Médicalisée',
            direction: 'descendante',
            ordre_radio: 'PC GENDARMERIE : Victime repérée consciente ! Relevage en barquette coquille et jonction VPSP pour évacuation.',
            sous_missions: [
              {
                id: 'sub_brancardage_evac',
                type: 'evacuation_victime',
                titre: 'Conditionnement Coquille & Évacuation CH',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP'] },
                progression: 0,
                duree_estimee_sec: 1600
              }
            ]
          }
        ],
        recompenses: { reputation_prefecture: 35, reputation_samu: 25, reputation_sdis: 15, indemnite_crise: 2400 },
        penalites: { reputation_prefecture: -25, reputation_samu: -15, amende_administrative: 1200 }
      },
      greve_ambulances: {
        type: 'greve_ambulances',
        titre: 'Plan Blanc & Réquisition SAMU : Grève des Ambulances Privées',
        anticipation: 'programmee',
        autorite_demandeur: 'ARS & SAMU 15 (Préfecture)',
        autorite_code: 'samu',
        niveau_alerte: 'PLAN BLANC DÉPARTEMENTAL',
        description: 'Préavis de grève illimitée des ambulanciers privés. Réquisition de 2 VPSP en astreinte domiciliaire et départs réflexes.',
        phases: [
          {
            phase_id: 1,
            nom: 'Phase 1 : Mise en Astreinte Domicile & VPSP #1 Actif',
            direction: 'montante',
            ordre_radio: 'SAMU 15 : Début de la grève. Armement du premier VPSP et mise en pré-alerte domicile du second équipage.',
            sous_missions: [
              {
                id: 'sub_garde_vpsp_samu_1',
                type: 'garde_samu_urgence',
                titre: 'Garde Urgences Réflexe SAMU 15 - VPSP Alpha',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP'] },
                progression: 0,
                duree_estimee_sec: 2400
              }
            ]
          },
          {
            phase_id: 2,
            nom: 'Phase 2 : Saturation 15 - Appel de la Réserve Astreinte',
            direction: 'montante',
            ordre_radio: 'SAMU 15 : Saturation critique des lignes 15. Mobilisation immédiate de l\'équipage d\'astreinte pour VPSP Bravo.',
            sous_missions: [
              {
                id: 'sub_garde_vpsp_samu_2',
                type: 'garde_samu_urgence',
                titre: 'Garde Urgences Réflexe SAMU 15 - VPSP Bravo',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['PSE2', 'PSE2', 'PSE1'], vehicles: ['VPSP'] },
                progression: 0,
                duree_estimee_sec: 2400
              }
            ]
          },
          {
            phase_id: 3,
            nom: 'Phase 3 : Fin de Réquisition & Réarmement Échelonné',
            direction: 'descendante',
            ordre_radio: 'RÉGULATION SAMU : Accord trouvé. Fin de réquisition progressive. Libération des équipages pour réarmement.',
            sous_missions: [
              {
                id: 'sub_rearmement_flotte',
                type: 'rearmement_general',
                titre: 'Désinfection VPSP & Inventaire Pharmaceutique',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['PSE1'], vehicles: ['VPSP'] },
                progression: 0,
                duree_estimee_sec: 1500
              }
            ]
          }
        ],
        recompenses: { reputation_prefecture: 25, reputation_samu: 45, reputation_sdis: 15, indemnite_crise: 3200 },
        penalites: { reputation_prefecture: -25, reputation_samu: -40, amende_administrative: 1800 }
      },
      violences_urbaines: {
        type: 'violences_urbaines',
        titre: 'Dispositif Anticipé : Risque de Violences Urbaines & Nuit Sensible',
        anticipation: 'programmee',
        autorite_demandeur: 'Préfecture & SDIS 18',
        autorite_code: 'prefecture',
        niveau_alerte: 'VIGILANCE SÉCURITÉ PUBLIQUE',
        description: 'Tensions urbaines nocturnes anticipées. Détachement d\'astreinte en caserne SDIS et soutien logistique éclairage.',
        phases: [
          {
            phase_id: 1,
            nom: 'Phase 1 : Pré-positionnement en Caserne SDIS',
            direction: 'montante',
            ordre_radio: 'PRÉFECTURE / SDIS : Regroupement sécurisé des effectifs Protec au Centre de Secours Principal.',
            sous_missions: [
              {
                id: 'sub_garde_sdis_caserne',
                type: 'garde_sdis_renfort',
                titre: 'Équipage VPSP Protec en Caserne SDIS',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['CE', 'PSE2', 'PSE1'], vehicles: ['VPSP'] },
                progression: 0,
                duree_estimee_sec: 2100
              }
            ]
          },
          {
            phase_id: 2,
            nom: 'Phase 2 : Départs Multiples & Éclairage de Zone',
            direction: 'montante',
            ordre_radio: 'CODIS 18 : Départs simultanés pour feux de voirie. Déploiement d\'un VTU logistique avec mât d\'éclairage.',
            sous_missions: [
              {
                id: 'sub_eclairage_soutien',
                type: 'soutien_technique_sdis',
                titre: 'Soutien Éclairage & Sécurisation Voirie',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['PSE2', 'PSE1'], vehicles: ['VTU'] },
                progression: 0,
                duree_estimee_sec: 2200
              }
            ]
          },
          {
            phase_id: 3,
            nom: 'Phase 3 : Calme Rétabli & Relève Finale',
            direction: 'descendante',
            ordre_radio: 'ÉTAT-MAJOR SÉCURITÉ CIVILE : Fin des tensions urbaines. Désengagement autorisé par la Préfecture.',
            sous_missions: [
              {
                id: 'sub_debreifing_securite',
                type: 'debriefing_crise',
                titre: 'Débriefing Sécurité & Rentrée en Base',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['CE'], vehicles: ['VL'] },
                progression: 0,
                duree_estimee_sec: 1400
              }
            ]
          }
        ],
        recompenses: { reputation_prefecture: 35, reputation_samu: 15, reputation_sdis: 35, indemnite_crise: 2900 },
        penalites: { reputation_prefecture: -30, reputation_samu: -10, amende_administrative: 1600 }
      },
      inondation_cai: {
        type: 'inondation_cai',
        titre: 'Plan PCS / Inondation Majeure & Centre d\'Hébergement d\'Urgence',
        anticipation: 'immediate',
        autorite_demandeur: 'Mairie & Préfecture (SIDPC)',
        autorite_code: 'prefecture',
        niveau_alerte: 'VIGILANCE ROUGE CRUES',
        description: 'Crues et inondations majeures. Montage d\'un CHU de 30 lits de camp dans le gymnase municipal, pompage et ravitaillement chaud.',
        phases: [
          {
            phase_id: 1,
            nom: 'Phase 1 : Armement Immédiat du Gymnase (CHU)',
            direction: 'montante',
            ordre_radio: 'PRÉFECTURE / MAIRIE : 30 sinistrés évacués de leurs habitations inondées. Déployez les lits picots et le kit d\'accueil au gymnase.',
            sous_missions: [
              {
                id: 'sub_chu_gymnase',
                type: 'montage_chu',
                titre: 'Armement CHU : 30 Lits de Camp & Kits Hygiène',
                statut: 'en_attente',
                moyens_requis: { vols_count: 4, ranks: ['CE', 'PSE2', 'PSE1', 'Secouriste'], vehicles: ['VTU'] },
                progression: 0,
                duree_estimee_sec: 2100
              }
            ]
          },
          {
            phase_id: 2,
            nom: 'Phase 2 : Pompage, Évacuation & Cuisine de Crise',
            direction: 'montante',
            ordre_radio: 'CELLULE DE CRISE MAIRIE : Pompage des axes prioritaires et distribution de repas chauds aux personnes isolées.',
            sous_missions: [
              {
                id: 'sub_pompage_epuisement',
                type: 'pompage_crise',
                titre: 'Chantier d\'Épuisement & Motopompes',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['PSE2', 'PSE1', 'Secouriste'], vehicles: ['VTU'] },
                progression: 0,
                duree_estimee_sec: 2400
              },
              {
                id: 'sub_ravitaillement_chaud',
                type: 'ravitaillement_crise',
                titre: 'Cuisine de Crise & Distribution Repas Chauds',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['PSE1', 'Secouriste'], vehicles: ['VL'] },
                progression: 0,
                duree_estimee_sec: 1900
              }
            ]
          },
          {
            phase_id: 3,
            nom: 'Phase 3 : Décrue & Fermeture du Centre d\'Accueil',
            direction: 'descendante',
            ordre_radio: 'PRÉFET DE DÉPARTEMENT : Décrue confirmée. Réintégration des habitations. Désarmement ordonné du gymnase.',
            sous_missions: [
              {
                id: 'sub_desarmement_chu',
                type: 'repli_materiel',
                titre: 'Désarmement, Pliage des Lits & Rentrée Base',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['PSE1', 'Secouriste', 'Secouriste'], vehicles: ['VTU'] },
                progression: 0,
                duree_estimee_sec: 1500
              }
            ]
          }
        ],
        recompenses: { reputation_prefecture: 40, reputation_samu: 15, reputation_sdis: 25, indemnite_crise: 3400 },
        penalites: { reputation_prefecture: -35, reputation_samu: -10, amende_administrative: 2000 }
      }
    };
    return templates[type] || templates.novi_attentat;
  },

  /**
   * Boucle d'évolution en temps réel (appelée à chaque tick par app.js)
   */
  updateAllCrisesTick(game) {
    if (!game) return;
    this.sanitizeAndRecoverStuckCrises(game);
    if (!game.activeCrises || game.activeCrises.length === 0) return;

    const now = Date.now();

    game.activeCrises.forEach(crisis => {
      if (crisis.status !== 'active') return;

      // Vérification et escalade automatique si le délai d'acquittement est dépassé
      this.checkAndEscalateCrisis(game, crisis);

      const currentPhase = crisis.phases[crisis.currentPhaseIndex];
      if (!currentPhase) return;

      let allPhaseSubsComplete = true;

      // Parcours des sous-missions de la phase en cours
      (currentPhase.sous_missions || []).forEach(sub => {
        if (sub.statut === 'en_cours') {
          // Incrémenter la progression en fonction du temps
          const speedMultiplier = (game.simSpeed || 1);
          const totalDuration = (sub.duree_estimee_sec || 1800);
          const stepIncrement = (100 / totalDuration) * speedMultiplier;

          sub.progression = Math.min(100, (sub.progression || 0) + stepIncrement);

          // Impact physiologique sur le personnel engagé (fatigue et moral)
          // RÈGLE : Il faut 1 à 3 jours continus sans repos pour atteindre 100% de fatigue (24h à 72h).
          if (sub.assignedCrew && Array.isArray(sub.assignedCrew.volunteers)) {
            sub.assignedCrew.volunteers.forEach(vId => {
              const vol = (game.volunteers || []).find(v => v.id === vId);
              if (vol) {
                // Base : ~48h d'intervention continue pour atteindre 100% (soit ~2% par heure)
                let hoursToFullFatigue = 48;
                if (vol.trait === 'sportif' || vol.profileType === 'actif_sportif') hoursToFullFatigue = 72; // 3 jours
                else if (vol.trait === 'retraite' || vol.trait === 'fragile') hoursToFullFatigue = 28; // ~1 jour
                
                const fatiguePerSec = (100 / (hoursToFullFatigue * 3600)) * speedMultiplier;
                vol.fatigue = Math.min(100, (vol.fatigue || 5) + fatiguePerSec);
                vol.energy = Math.max(0, 100 - vol.fatigue);

                // Moral : baisse très douce uniquement si fatigue très élevée (> 80%) sans relève
                if (vol.fatigue > 80) {
                  vol.moral = Math.max(10, (vol.moral || 85) - (0.0002 * speedMultiplier));
                }
              }
            });
          }

          // Vérifier si la sous-mission est achevée
          if (sub.progression >= 100) {
            sub.statut = 'termine';
            this.logCrisisRadio(crisis, 'Équipe Terrain', `MISSION ACCOMPLIE : « ${sub.titre} » terminée avec succès.`, 'success');
            if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();
            game.showToast('Sous-Mission Réussie !', `${sub.titre} terminée.`, 'green');

            // Libération des vecteurs et bénévoles vers la réserve de base
            this.releaseSubMissionCrew(game, crisis, sub);
          } else {
            allPhaseSubsComplete = false;
          }
        } else if (sub.statut === 'en_attente') {
          allPhaseSubsComplete = false;
        }
      });

      // Si toutes les sous-missions de la phase courante sont finies, passage à la phase suivante
      if (allPhaseSubsComplete) {
        if (crisis.currentPhaseIndex + 1 < crisis.phases.length) {
          this.advanceCrisisPhase(game, crisis, crisis.currentPhaseIndex + 1);
        } else {
          // Toutes les phases sont accomplies : Crise résolue avec succès !
          this.concludeCrisisSuccess(game, crisis);
        }
      }
    });

    // Rafraîchir l'interface du PC Crise si la modale est actuellement ouverte
    this.refreshPcCriseModalIfOpen(game);
  },

  /**
   * Passage à la phase suivante de la crise (Escalade ou Désengagement)
   */
  advanceCrisisPhase(game, crisis, nextPhaseIndex) {
    crisis.currentPhaseIndex = nextPhaseIndex;
    const nextPhase = crisis.phases[nextPhaseIndex];
    if (!nextPhase) return;

    crisis.phase_courante = nextPhase.nom;

    // Ordre de transmission radio
    const radioChime = nextPhase.direction === 'montante' ? '🚨 ORDRE D\'ESCALADE' : '📢 ORDRE DE DÉSENGAGEMENT';
    this.logCrisisRadio(crisis, crisis.autorite_demandeur, `${radioChime} : ${nextPhase.nom}. ${nextPhase.ordre_radio || ''}`, 'ordre');

    // Réinitialiser les statuts des sous-missions de cette nouvelle phase
    (nextPhase.sous_missions || []).forEach(sub => {
      sub.statut = 'en_attente';
      sub.progression = 0;
      sub.assignedCrew = { volunteers: [], vehicles: [] };
    });

    if (window.ProtecAudio) window.ProtecAudio.playAlertChime();
    game.showToast(`Nouvelle Phase Crise (${nextPhase.direction.toUpperCase()})`, nextPhase.nom, nextPhase.direction === 'montante' ? 'red' : 'blue');
    game.saveGame();
  },

  /**
   * Libère le personnel et les véhicules assignés à une sous-mission terminée
   */
  releaseSubMissionCrew(game, crisis, sub) {
    if (!sub.assignedCrew) return;

    const vols = sub.assignedCrew.volunteers || [];
    const vehs = sub.assignedCrew.vehicles || [];

    // Les bénévoles rejoignent la réserve sur base de l'antenne
    vols.forEach(vId => {
      if (!crisis.reserve.onBase.includes(vId)) {
        crisis.reserve.onBase.push(vId);
      }
      // Retirer d'astreinte si présent
      crisis.reserve.astreinteDomicile = crisis.reserve.astreinteDomicile.filter(id => id !== vId);
      
      const v = (game.volunteers || []).find(vol => vol.id === vId);
      if (v) v.isAvailable = true;
    });

    // Les véhicules redeviennent disponibles mais nécessitent potentiellement un réarmement
    vehs.forEach(vehId => {
      const v = (game.vehicles || []).find(veh => veh.id === vehId);
      if (v) {
        v.isAvailable = true;
        // Un véhicule utilisé en crise consomme du carburant et doit être réarmé
        v.fuel = Math.max(20, (v.fuel || 80) - 25);
        if (v.type === 'VPSP') {
          v.isRearmed = false;
          v.disinfectionNeeded = true;
        }
      }
    });

    sub.assignedCrew = { volunteers: [], vehicles: [] };
  },

  /**
   * Clôture avec succès de la crise
   */
  concludeCrisisSuccess(game, crisis) {
    crisis.status = 'terminee';
    this.logCrisisRadio(crisis, crisis.autorite_demandeur, 'MISSION ACCOMPLIE : Fin du plan d\'urgence. Félicitations des autorités pour le professionnalisme des équipes.', 'success');

    const rewards = crisis.recompenses || {};
    const moneyGain = rewards.indemnite_crise || 2500;

    // Prise en compte financière
    if (!game.resources) game.resources = { money: 0 };
    game.resources.money += moneyGain;

    // Prise en compte de la réputation institutionnelle
    if (!game.institutionsRelations) {
      game.institutionsRelations = { prefecture: 50, samu: 50, sdis: 50 };
    }
    if (rewards.reputation_prefecture) game.institutionsRelations.prefecture = Math.min(100, (game.institutionsRelations.prefecture || 50) + rewards.reputation_prefecture);
    if (rewards.reputation_samu) game.institutionsRelations.samu = Math.min(100, (game.institutionsRelations.samu || 50) + rewards.reputation_samu);
    if (rewards.reputation_sdis) game.institutionsRelations.sdis = Math.min(100, (game.institutionsRelations.sdis || 50) + rewards.reputation_sdis);

    // Boost moral pour tous les participants mobilisés
    const mobilised = crisis.mobilisation.mobilisedVolunteerIds || [];
    mobilised.forEach(vId => {
      const vol = (game.volunteers || []).find(v => v.id === vId);
      if (vol) {
        vol.moral = Math.min(100, (vol.moral || 80) + 15);
        vol.isAvailable = true;
      }
    });

    if (window.ProtecAudio) window.ProtecAudio.playSuccess();
    game.showToast(
      '🏆 CRISE MAJEURE SURMONTÉE !',
      `Félicitations ! Indemnité de réquisition versée : +${moneyGain} €. Relations institutionnelles en forte hausse.`,
      'green'
    );

    game.saveGame();
  },

  /**
   * Échec ou abandon d'une crise (sanctions préfectorales)
   */
  failCrisis(game, crisisId, reason = 'Refus ou incapacité opérationnelle') {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId);
    if (!crisis) return;

    crisis.status = 'echec';
    const pen = crisis.penalites || {};
    const fine = pen.amende_administrative || 1500;

    if (!game.resources) game.resources = { money: 0 };
    game.resources.money = Math.max(0, game.resources.money - fine);

    if (game.institutionsRelations) {
      if (pen.reputation_prefecture) game.institutionsRelations.prefecture = Math.max(0, (game.institutionsRelations.prefecture || 50) + pen.reputation_prefecture);
      if (pen.reputation_samu) game.institutionsRelations.samu = Math.max(0, (game.institutionsRelations.samu || 50) + pen.reputation_samu);
    }

    this.logCrisisRadio(crisis, 'Préfecture du Département', `SANCTION ADMINISTRATIVE : Abandon du dispositif pour motif « ${reason} ». Amende préfectorale de ${fine} € et dégradation de l'agrément de sécurité civile.`, 'alert');

    game.showToast(
      '❌ Échec de la Réquisition Préfectorale',
      `Amende de ${fine} € prélevée et perte sévère de crédibilité institutionnelle.`,
      'red'
    );

    game.saveGame();
    this.refreshPcCriseModalIfOpen(game);
  },

  /**
   * Ajoute une entrée horodatée dans la main courante radio de la crise
   */
  logCrisisRadio(crisis, source, text, type = 'info') {
    if (!crisis.journal_crise) crisis.journal_crise = [];
    const entry = {
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp: Date.now(),
      source: source || 'PC Régulation',
      type: type,
      text: text
    };
    crisis.journal_crise.unshift(entry);

    // Diffusion radio vocale synchronisée
    if (window.ProtecCrisisRadio && window.ProtecCrisisRadio.enabled) {
      window.ProtecCrisisRadio.transmitCrisisLog(entry, crisis);
    }
  },

  /**
   * Mobilisation des bénévoles avec filtrage par delta de temps de trajet
   */
  mobilizeVolunteers(game, crisisId, deltaMax = 30, mode = 'ciblee') {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId);
    if (!crisis) return;

    const myId = game.player?.id || 'usr_local';
    if (crisis.managerPlayerId && crisis.managerPlayerId !== myId) {
      game.showToast('Commandement Exclusif', `Seul le directeur de crise (${crisis.managerPlayerName}) peut mobiliser les effectifs.`, 'orange');
      return;
    }

    crisis.mobilisation.deltaMaxMinutes = deltaMax;
    crisis.mobilisation.mode = mode;

    const availableVolunteers = (game.volunteers || []).filter(v => {
      // Temps de trajet jusqu'au local
      const travelTime = v.temps_trajet_base_minutes || v.travelTimeToStationMin || 15;
      const withinDelta = travelTime <= deltaMax;
      const notExhausted = (v.fatigue || 0) < 85;
      return withinDelta && notExhausted;
    });

    let countAdded = 0;
    availableVolunteers.forEach(v => {
      if (!crisis.mobilisation.mobilisedVolunteerIds.includes(v.id)) {
        crisis.mobilisation.mobilisedVolunteerIds.push(v.id);
        
        // Mode ciblé place d'abord en astreinte domicile, mode général place en réserve sur base
        if (mode === 'generale') {
          if (!crisis.reserve.onBase.includes(v.id)) crisis.reserve.onBase.push(v.id);
        } else {
          if (!crisis.reserve.astreinteDomicile.includes(v.id)) crisis.reserve.astreinteDomicile.push(v.id);
        }
        countAdded++;
      }
    });

    // Simulation des réponses radio individuelles d'astreinte
    if (window.ProtecCrisisRadio && window.ProtecCrisisRadio.enabled) {
      window.ProtecCrisisRadio.simulateMobilisationCalls(game, crisis, mode, deltaMax, availableVolunteers, countAdded);
    }

    this.logCrisisRadio(
      crisis,
      'Secrétariat Opérationnel',
      `Appel de mobilisation (${mode === 'generale' ? 'Générale' : 'Ciblée'} - Délai max ${deltaMax} min) : ${countAdded} secouristes répondent présents et sont placés en réserve.`,
      'info'
    );

    if (window.ProtecAudio) window.ProtecAudio.playAlertChime();
    game.showToast(
      'Mobilisation Opérationnelle',
      `${countAdded} secouristes mobilisés dans le créneau de ${deltaMax} min.`,
      'blue'
    );

    game.saveGame();
    this.refreshPcCriseModalIfOpen(game);
  },

  /**
   * Bascule un bénévole entre l'astreinte à domicile et la réserve sur base
   */
  toggleVolunteerReserveStatus(game, crisisId, volId) {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId);
    if (!crisis) return;

    const vol = (game.volunteers || []).find(v => v.id === volId);
    if (!vol) return;

    if (crisis.reserve.astreinteDomicile.includes(volId)) {
      // Passage d'astreinte domicile à réserve sur base (arrive après son temps de trajet)
      crisis.reserve.astreinteDomicile = crisis.reserve.astreinteDomicile.filter(id => id !== volId);
      if (!crisis.reserve.onBase.includes(volId)) crisis.reserve.onBase.push(volId);
      this.logCrisisRadio(crisis, 'Transit Bénévoles', `${vol.name} a rejoint le local d'antenne (Réserve en base opérationnelle).`, 'info');
      game.showToast('Bénévole sur Base', `${vol.name} est maintenant présent au local.`, 'blue');
      if (window.ProtecCrisisRadio && window.ProtecCrisisRadio.enabled) {
        window.ProtecCrisisRadio.speakVolunteerTransit(vol, vol.temps_trajet_base_minutes || 15);
      }
    } else if (crisis.reserve.onBase.includes(volId)) {
      // Passage de la base à l'astreinte à domicile
      crisis.reserve.onBase = crisis.reserve.onBase.filter(id => id !== volId);
      if (!crisis.reserve.astreinteDomicile.includes(volId)) crisis.reserve.astreinteDomicile.push(volId);
      this.logCrisisRadio(crisis, 'Transit Bénévoles', `${vol.name} est mis en astreinte à domicile (délai d'accès : ${vol.temps_trajet_base_minutes || 15} min).`, 'info');
      game.showToast('Astreinte Domicile', `${vol.name} est placé en astreinte à domicile.`, 'slate');
    }

    game.saveGame();
    this.refreshPcCriseModalIfOpen(game);
  },

  /**
   * Engage un vecteur et des bénévoles sur une sous-mission spécifique
   */
  engageSubMission(game, crisisId, subId, volIds, vehIds) {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId);
    if (!crisis) return;

    const currentPhase = crisis.phases[crisis.currentPhaseIndex];
    if (!currentPhase) return;

    const sub = (currentPhase.sous_missions || []).find(s => s.id === subId);
    if (!sub) return;

    const req = sub.moyens_requis || {};

    // 1. Vérification du nombre de secouristes
    if (volIds.length < (req.vols_count || 1)) {
      game.showToast('Effectif Insuffisant', `Cette sous-mission requiert au moins ${req.vols_count} intervenants.`, 'orange');
      return;
    }

    // 2. Vérification des qualifications requises
    if (req.ranks && req.ranks.length > 0) {
      const selectedVols = (game.volunteers || []).filter(v => volIds.includes(v.id));
      const hasLeader = selectedVols.some(v => req.ranks.includes(v.rank) || v.rank === 'Chef de Dispositif' || v.rank === 'Chef de Poste' || v.rank === 'CE');
      if (!hasLeader && req.ranks.some(r => ['CD', 'CE', 'Chef de Dispositif', 'Chef de Poste'].includes(r))) {
        game.showToast('Encadrement Requis', `Un chef d'équipe ou responsable qualifié (${req.ranks.join(', ')}) est obligatoire.`, 'orange');
        return;
      }
    }

    // 3. Vérification des spécialités (drone, cyno, aep)
    if (req.specialite_requise) {
      const hasSpec = window.ProtecSpecialites && typeof window.ProtecSpecialites.hasSpecialite === 'function'
        ? window.ProtecSpecialites.hasSpecialite(game, req.specialite_requise)
        : (game.specialites && game.specialites[req.specialite_requise]);

      if (!hasSpec) {
        game.showToast('Spécialité Manquante', `Cette unité requiert l'agrément et le matériel « ${req.specialite_requise.toUpperCase()} ».`, 'red');
        return;
      }
    }

    // 4. Vérification des véhicules (avec équivalence PCM pour VL Commandement)
    if (req.vehicles && req.vehicles.length > 0) {
      if (vehIds.length < req.vehicles.length) {
        game.showToast('Véhicule Requis', `Veuillez sélectionner le ou les véhicules nécessaires (${req.vehicles.join(', ')}).`, 'orange');
        return;
      }

      const selectedVehs = (game.vehicles || []).filter(v => vehIds.includes(v.id));
      if (req.vehicles.includes('PCM')) {
        const hasPCM = selectedVehs.some(v => v.type === 'PCM' || v.isCommandement || v.hasCommandementKit);
        if (!hasPCM) {
          game.showToast('Poste de Commandement Requis', 'Cette sous-mission requiert un PCM ou une VL Commandement équipée du Poste de Commandement Mobile.', 'orange');
          return;
        }
      }
    }

    // Assignation
    sub.assignedCrew = {
      volunteers: [...volIds],
      vehicles: [...vehIds]
    };
    sub.statut = 'en_cours';

    // Retrait des bénévoles de la réserve
    volIds.forEach(vId => {
      crisis.reserve.onBase = crisis.reserve.onBase.filter(id => id !== vId);
      crisis.reserve.astreinteDomicile = crisis.reserve.astreinteDomicile.filter(id => id !== vId);
      const v = (game.volunteers || []).find(vol => vol.id === vId);
      if (v) v.isAvailable = false;
    });

    // Indisponibilité des véhicules
    vehIds.forEach(vehId => {
      const veh = (game.vehicles || []).find(v => v.id === vehId);
      if (veh) veh.isAvailable = false;
    });

    const vehNames = (game.vehicles || []).filter(v => vehIds.includes(v.id)).map(v => v.name).join(', ') || 'Pédestre';
    this.logCrisisRadio(
      crisis,
      'Engagement Vecteur',
      `ENGAGEMENT : « ${sub.titre} » paré au départ avec ${volIds.length} secouristes [${vehNames}].`,
      'ordre'
    );

    // Briefing vocal de l'ordre d'opération
    if (window.ProtecCrisisRadio && window.ProtecCrisisRadio.enabled) {
      window.ProtecCrisisRadio.speakOperationalOrder(sub, vehNames, volIds.length);
    }

    if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();
    game.showToast('Vecteur Engagé !', `Équipe envoyée sur « ${sub.titre} ».`, 'blue');

    game.saveGame();
    this.refreshPcCriseModalIfOpen(game);
  },

  // =========================================================================
  // INTERFACE UTILISATEUR : POSTE DE COMMANDEMENT DE CRISE (PC CRISE)
  // =========================================================================

  /**
   * Ouvre la modale complète du Poste de Commandement PC Crise
   */
  openPcCriseModal(game, crisisId = null) {
    if (!game) game = window.game;
    this.injectState(game);

    if (!game.activeCrises || game.activeCrises.length === 0) {
      // Proposer de déclencher une crise d'exercice si aucune crise active
      this.renderCrisisSelectorModal(game);
      return;
    }

    let crisis = null;
    if (crisisId) {
      crisis = game.activeCrises.find(c => c.id === crisisId);
    }
    if (!crisis) {
      crisis = game.activeCrises.find(c => c.status === 'active') || game.activeCrises[0];
    }

    const containerId = 'pc-crise-modal-backdrop';
    let modalEl = document.getElementById(containerId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = containerId;
      modalEl.className = 'fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto';
      document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = this.renderPcCriseModalHtml(game, crisis);
    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Rafraîchit l'interface si elle est ouverte à l'écran
   */
  refreshPcCriseModalIfOpen(game) {
    if (typeof document === 'undefined') return;
    const modalEl = document.getElementById('pc-crise-modal-backdrop');
    if (!modalEl) return;
    const crisisId = modalEl.getAttribute('data-active-crisis-id');
    if (!crisisId) return;

    const crisis = (game.activeCrises || []).find(c => c.id === crisisId);
    if (crisis) {
      modalEl.innerHTML = this.renderPcCriseModalHtml(game, crisis);
      if (window.lucide) window.lucide.createIcons();
    }
  },

  /**
   * Fermeture de la modale PC Crise
   */
  closePcCriseModal() {
    const modalEl = document.getElementById('pc-crise-modal-backdrop');
    if (modalEl) modalEl.remove();
  },

  /**
   * Génération du code HTML du Poste de Commandement PC Crise
   */
  renderPcCriseModalHtml(game, crisis) {
    const modalEl = document.getElementById('pc-crise-modal-backdrop');
    if (modalEl) modalEl.setAttribute('data-active-crisis-id', crisis.id);

    const now = Date.now();
    const elapsedMinutes = Math.floor((now - (crisis.startedAt || now)) / 60000);
    const elapsedSeconds = Math.floor(((now - (crisis.startedAt || now)) % 60000) / 1000);
    const timerStr = `+${String(elapsedMinutes).padStart(2, '0')}h ${String(elapsedSeconds).padStart(2, '0')}m`;

    const currentPhase = crisis.phases[crisis.currentPhaseIndex] || {};
    const phasesCount = crisis.phases.length;

    // Calcul des effectifs
    const onBaseCount = (crisis.reserve.onBase || []).length;
    const astreinteCount = (crisis.reserve.astreinteDomicile || []).length;
    let engagedCount = 0;
    (currentPhase.sous_missions || []).forEach(sub => {
      if (sub.assignedCrew && sub.assignedCrew.volunteers) {
        engagedCount += sub.assignedCrew.volunteers.length;
      }
    });

    return `
      <div class="relative w-full max-w-[96vw] 2xl:max-w-[1780px] max-h-[94vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
        
        <!-- ================= BANDEAU SUPÉRIEUR PC CRISE ================= -->
        <div class="p-4 sm:p-5 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-b border-red-900/40 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center font-black animate-pulse shadow-lg">
              <i data-lucide="radio" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500 text-white shadow-sm">
                  ${crisis.niveau_alerte || 'ORSEC'}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  ${crisis.autorite_demandeur}
                </span>
                <span class="text-xs text-slate-400 font-mono">
                  ⏱️ Chrono : <strong class="text-amber-400">${timerStr}</strong>
                </span>
              </div>
              <h2 class="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                ${crisis.titre}
              </h2>
            </div>
          </div>

          <!-- Actions En-tête -->
          <div class="flex items-center gap-2">
            <!-- Bouton Toggle Radio Vocale Instantané avec persistance -->
            <button onclick="window.ProtecCrisisRadio.toggle()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs ${window.ProtecCrisisRadio?.enabled ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 hover:bg-cyan-900/90 shadow-cyan-950/50' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'}" title="Activer ou couper les transmissions radio vocales tactiques">
              <i data-lucide="${window.ProtecCrisisRadio?.enabled ? 'volume-2' : 'volume-x'}" class="w-4 h-4 ${window.ProtecCrisisRadio?.enabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}"></i>
              <span class="hidden sm:inline">Radio Vocale :</span>
              <span class="${window.ProtecCrisisRadio?.enabled ? 'text-cyan-300 font-black' : 'text-slate-400'}">${window.ProtecCrisisRadio?.enabled ? 'ACTIVE 🎙️' : 'OFF 🔇'}</span>
            </button>

            <div class="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span class="text-slate-400 font-medium">Phase : <strong class="text-white">${crisis.currentPhaseIndex + 1}/${phasesCount}</strong></span>
              <span class="text-slate-400 font-medium">Engagés : <strong class="text-emerald-400">${engagedCount}</strong></span>
              <span class="text-slate-400 font-medium">En Base : <strong class="text-sky-400">${onBaseCount}</strong></span>
            </div>
            <button onclick="window.ProtecCriseLogistique.closePcCriseModal()" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700" title="Fermer le PC Crise">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <!-- ================= CORPS PRINCIPAL EN 2 COLONNES ================= -->
        <div class="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 sm:p-5">
          
          <!-- COLONNE GAUCHE (7/12) : ENGAGEMENT DES VECTEURS & SOUS-MISSIONS -->
          <div class="lg:col-span-7 space-y-4">
            
            <!-- BANNIÈRE DE GOUVERNANCE & PRISE DE COMMANDEMENT DE CRISE -->
            ${(() => {
              const myId = game.player?.id || 'usr_local';
              const isManager = (crisis.managerPlayerId === myId);
              const hasOtherManager = (crisis.managerPlayerId && !isManager);

              if (isManager) {
                return `
                  <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border-2 border-emerald-500 shadow-md flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs">
                        <i data-lucide="shield-check" class="w-5 h-5"></i>
                      </div>
                      <div>
                        <div class="text-xs font-black text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                          <i data-lucide="crown" class="w-3.5 h-3.5 text-amber-300"></i>
                          <span>Vous dirigez cette crise (Commandement Officiel)</span>
                        </div>
                        <p class="text-[11px] text-emerald-100/80">Vous arbitrez le déploiement des moyens et l'engagement des phases.</p>
                      </div>
                    </div>
                    <button 
                      onclick="window.ProtecCriseLogistique.releaseCrisisCommand(window.game, '${crisis.id}')"
                      class="px-4 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-500 text-white shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                      title="Céder la direction pour qu'un autre directeur du département puisse la prendre">
                      <i data-lucide="arrow-left-right" class="w-4 h-4"></i>
                      <span>Laisser la main (Céder le commandement)</span>
                    </button>
                  </div>
                `;
              } else if (hasOtherManager) {
                return `
                  <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-600/70 shadow-md flex items-center justify-between gap-3 flex-wrap">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-black">
                        <i data-lucide="user-check" class="w-5 h-5"></i>
                      </div>
                      <div>
                        <div class="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                          <i data-lucide="lock" class="w-3.5 h-3.5 text-emerald-400"></i>
                          <span>Commandement assuré par : <strong>${crisis.managerPlayerName || 'Directeur Allié'}</strong> (Non disponible)</span>
                        </div>
                        <p class="text-[11px] text-slate-300">Ce directeur coordonne le PC Crise. Vous ne pouvez intervenir qu'en répondant aux demandes de renfort.</p>
                      </div>
                    </div>
                    <span class="px-3 py-1.5 rounded-xl bg-emerald-900/80 text-emerald-200 border border-emerald-500/50 text-xs font-bold flex items-center gap-1.5">
                      <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                      <span>En appui renfort</span>
                    </span>
                  </div>
                `;
              } else {
                const secondsLeft = crisis.ackDeadline ? Math.max(0, Math.floor((crisis.ackDeadline - Date.now()) / 1000)) : null;
                const isTargetedToMe = (crisis.targetPlayerId === myId);

                return `
                  <div class="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/90 via-amber-950/70 to-slate-900 border-2 border-red-500 shadow-xl flex items-center justify-between gap-3 flex-wrap animate-pulse">
                    <div class="flex items-center gap-2.5">
                      <div class="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black">
                        <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                      </div>
                      <div>
                        <div class="text-xs font-black text-red-200 uppercase tracking-wider flex items-center gap-1.5">
                          <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-red-400"></i>
                          <span>Poste de Commandement Vacant</span>
                          ${secondsLeft !== null ? `<span class="px-2 py-0.2 rounded bg-red-800 text-white text-[10px] font-mono">Chrono : ${secondsLeft}s</span>` : ''}
                        </div>
                        <p class="text-[11px] text-slate-300">
                          ${isTargetedToMe 
                            ? (crisis.alertStage === 'targeted_nearest' ? 'Vous êtes l’antenne la plus proche : prenez la main !' : 'Vous êtes de permanence d’astreinte : prenez le relais !')
                            : (crisis.alertStage === 'targeted_nearest' ? `En attente de l'antenne la plus proche (${crisis.targetPlayerName || 'Directeur'})...` : (crisis.alertStage === 'targeted_astreinte' ? `En attente de l'Astreinte Départementale (${crisis.targetPlayerName || 'Cadre'})...` : 'Alerte générale à tous les directeurs : le premier répondant prend la main !'))}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      ${(isTargetedToMe && crisis.alertStage === 'targeted_nearest') ? `
                        <button 
                          onclick="window.ProtecCriseLogistique.forwardCrisisToAstreinte(window.game, '${crisis.id}')"
                          class="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition cursor-pointer">
                          Relais Astreinte
                        </button>
                      ` : ''}
                      <button 
                        onclick="window.ProtecCriseLogistique.claimCrisisCommand(window.game, '${crisis.id}')"
                        class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white shadow-lg active:scale-95 transition flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="shield" class="w-4 h-4"></i>
                        <span>Prendre la main sur la gestion de crise</span>
                      </button>
                    </div>
                  </div>
                `;
              }
            })()}

            <!-- ENCART MODE DEBUG ADMIN TÉLÉMÉTRIE CRISE NOVI -->
            ${(window.ProtecAdmin && typeof window.ProtecAdmin.isDebugModeActive === 'function' && window.ProtecAdmin.isDebugModeActive()) ? `
              <div class="p-3.5 rounded-2xl bg-slate-900 border-2 border-red-500/80 text-white shadow-xl space-y-2 text-xs font-mono">
                <div class="flex items-center justify-between border-b border-red-500/40 pb-1.5 font-sans">
                  <span class="text-red-400 font-black uppercase text-[11px] flex items-center gap-1.5">
                    <span class="animate-pulse">🛠️</span>
                    <span>MODE DEBUG ADMIN • TÉLÉMÉTRIE CRISE NOVI</span>
                  </span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-800">
                    ID: ${crisis.id}
                  </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                  <div class="p-2 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phasage & Évolution</div>
                    <div class="flex justify-between">
                      <span class="text-slate-300">Phase active :</span>
                      <span class="font-bold text-white font-mono">${crisis.currentPhaseIndex + 1} / ${crisis.phases.length}</span>
                    </div>
                    <div class="flex justify-between text-[10px]">
                      <span class="text-slate-400">Prochaine phase :</span>
                      <span class="font-bold text-amber-300 truncate max-w-[170px]" title="${crisis.phases[crisis.currentPhaseIndex + 1]?.nom || 'Achèvement Crise'}">${crisis.phases[crisis.currentPhaseIndex + 1]?.nom || 'Achèvement Crise (Victoire)'}</span>
                    </div>
                    ${crisis.phases[crisis.currentPhaseIndex + 1]?.ordre_radio ? `
                      <div class="text-[9px] text-slate-400 italic line-clamp-1">Prochain ordre : « ${crisis.phases[crisis.currentPhaseIndex + 1].ordre_radio} »</div>
                    ` : ''}
                  </div>

                  <div class="p-2 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                    <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Économie & Réputation Masquées</div>
                    <div class="flex justify-between">
                      <span class="text-slate-300">Prime Réussite :</span>
                      <span class="font-bold text-emerald-400 font-mono">+${(crisis.recompenses?.subvention || 5000).toLocaleString()} € / +${crisis.recompenses?.reputation || 15} Rép</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-300">Pénalité Échec :</span>
                      <span class="font-bold text-red-400 font-mono">-${crisis.penalites?.reputation || 25} Rép</span>
                    </div>
                    <div class="flex justify-between text-[10px]">
                      <span class="text-slate-400">Escalade alerte :</span>
                      <span class="font-bold text-sky-300">${crisis.alertStage || 'standard'}</span>
                    </div>
                  </div>
                </div>

                <!-- Progression des sous-missions de la phase en cours -->
                <div class="space-y-1 pt-1 font-sans">
                  <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Temps restant sous-missions de phase :</div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                    ${(currentPhase.sous_missions || []).map(s => {
                      const pct = Math.round(s.progression || 0);
                      const totalSec = s.duree_estimee_sec || 1800;
                      const secLeft = Math.max(0, Math.round(totalSec * (1 - (pct / 100))));
                      const minLeft = Math.ceil(secLeft / 60);
                      return `
                        <div class="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                          <span class="truncate max-w-[150px] text-slate-200" title="${s.titre}">${s.titre}</span>
                          <span class="font-mono font-bold ${s.statut === 'termine' ? 'text-emerald-400' : 'text-amber-400'}">
                            ${s.statut === 'termine' ? '✓ FAIT' : `${minLeft}m (${pct}%)`}
                          </span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Bannière de la Phase Courante -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-850 border border-slate-700/60 shadow-md">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="activity" class="w-3.5 h-3.5"></i>
                  ${currentPhase.direction === 'montante' ? 'Phase Montante (Escalade des Moyens)' : 'Phase Descendante (Désengagement Partiel)'}
                </span>
                <span class="text-xs text-slate-400 font-bold">Étape ${crisis.currentPhaseIndex + 1} sur ${phasesCount}</span>
              </div>
              <h3 class="text-sm sm:text-base font-extrabold text-white">${currentPhase.nom}</h3>
              <p class="text-xs text-slate-300 italic mt-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                « ${currentPhase.ordre_radio || 'En attente de consignes de la préfecture.'} »
              </p>
            </div>

            <!-- SECTION ACTIONS / RENFORTS SELON LA GOUVERNANCE -->
            ${(() => {
              const myId = game.player?.id || 'usr_local';
              const hasOtherManager = Boolean(crisis.managerPlayerId && crisis.managerPlayerId !== myId);
              if (hasOtherManager) {
                const missionRenforts = (game.renforts || []).filter(r => (r.missionId === crisis.id || r.crisisId === crisis.id) && r.status === 'open');
                return `
                  <div class="p-4 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/50 space-y-3">
                    <div class="flex items-center justify-between flex-wrap gap-2">
                      <h4 class="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
                        Appui Inter-Antennes • Demandes de Renfort
                      </h4>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-200 border border-emerald-600/50">
                        ${missionRenforts.length} demande(s) en attente
                      </span>
                    </div>
                    ${missionRenforts.length > 0 ? `
                      <div class="space-y-2">
                        ${missionRenforts.map(r => `
                          <div class="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between gap-2 shadow-xs">
                            <div>
                              <div class="font-black text-white text-xs flex items-center gap-1.5">
                                <i data-lucide="radio" class="w-3.5 h-3.5 text-pc-orange"></i>
                                <span>${r.type === 'equipage' ? 'Renfort Équipage Secouriste' : (r.type === 'materiel' ? 'Renfort Matériel / Lot' : 'Renfort Vecteur')}</span>
                              </div>
                              <p class="text-[11px] text-slate-300 mt-0.5">${r.description || `Besoin : ${r.neededCount || 1} bénévole(s)`}</p>
                            </div>
                            <button onclick="window.game.openEngageRenfortModal('${r.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow transition flex items-center gap-1 shrink-0 cursor-pointer">
                              <i data-lucide="send" class="w-3.5 h-3.5"></i>
                              <span>Détacher Renfort</span>
                            </button>
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-center space-y-1">
                        <div class="text-xs font-bold text-slate-300">Aucune demande de renfort en attente</div>
                        <p class="text-[11px] text-slate-400">
                          Le directeur aux commandes (${crisis.managerPlayerName || 'Directeur Allié'}) n'a pas émis de demande de renfort pour le moment.
                        </p>
                      </div>
                    `}
                  </div>
                `;
              }

              // Le joueur local a la main (ou crise vacante) : afficher les contrôles d'armement et mobilisation
              return `
                <!-- Liste des Sous-Missions de la Phase -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i data-lucide="truck" class="w-4 h-4 text-sky-400"></i>
                      Vecteurs & Dispositifs Requis (${(currentPhase.sous_missions || []).length})
                    </h4>
                    <span class="text-[11px] text-slate-400">Cliquez pour armer et projeter</span>
                  </div>

                  ${(currentPhase.sous_missions || []).map(sub => this.renderSubMissionCard(game, crisis, sub)).join('')}
                </div>

                <!-- Tableau de Bord Mobilisation Rapide -->
                <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <i data-lucide="users" class="w-4 h-4 text-emerald-400"></i>
                      Mobilisation & Filtrage Delta Domicile-Base
                    </h4>
                    <span class="text-[10px] text-slate-400">Délai d'accès maximal</span>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs text-slate-300 font-bold">Filtre Delta :</span>
                    ${[15, 30, 45, 60].map(delta => `
                      <button onclick="window.ProtecCriseLogistique.mobilizeVolunteers(window.game, '${crisis.id}', ${delta}, 'ciblee')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition ${crisis.mobilisation.deltaMaxMinutes === delta ? 'bg-sky-500 text-white shadow' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'}">
                        ≤ ${delta} min
                      </button>
                    `).join('')}
                    
                    <button onclick="window.ProtecCriseLogistique.mobilizeVolunteers(window.game, '${crisis.id}', 60, 'generale')" class="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-lg transition flex items-center gap-1.5">
                      <i data-lucide="bell" class="w-3.5 h-3.5"></i>
                      Mobilisation Générale
                    </button>
                  </div>
                </div>
              `;
            })()}

          </div>

          <!-- COLONNE DROITE (5/12) : MAIN COURANTE RADIO & RÉSERVES BÉNÉVOLES -->
          <div class="lg:col-span-5 space-y-4">
            
            <!-- Journal Radio en Temps Réel -->
            <div class="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 shadow-md space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h4 class="text-xs font-black text-white uppercase tracking-wider">Main Courante Radio PC</h4>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">FRÉQ. 15.2 INTER-SERVICES</span>
              </div>

              <!-- Fil Chronologique -->
              <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                ${(crisis.journal_crise || []).map(log => {
                  let badgeColor = 'bg-slate-700 text-slate-300';
                  let borderLeft = 'border-slate-600';
                  if (log.type === 'ordre') { badgeColor = 'bg-red-950 text-red-300 border-red-800'; borderLeft = 'border-red-500'; }
                  if (log.type === 'success') { badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800'; borderLeft = 'border-emerald-500'; }
                  if (log.type === 'alert') { badgeColor = 'bg-amber-950 text-amber-300 border-amber-800'; borderLeft = 'border-amber-500'; }

                  return `
                    <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 border-l-4 ${borderLeft} space-y-1 text-xs group hover:border-slate-700 transition">
                      <div class="flex items-center justify-between gap-2 text-[10px]">
                        <span class="font-black text-slate-300 truncate">${log.source}</span>
                        <div class="flex items-center gap-2 flex-shrink-0">
                          <span class="text-slate-400 font-mono">${log.time}</span>
                          <button type="button" 
                                  onclick="event.stopPropagation(); window.ProtecCrisisRadio && window.ProtecCrisisRadio.replay(this.dataset.text, this.dataset.source);"
                                  data-text="${encodeURIComponent(log.text || '')}"
                                  data-source="${encodeURIComponent(log.source || 'PC Opérationnel')}"
                                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition text-[10px] font-bold cursor-pointer active:scale-95 shadow-2xs"
                                  title="Réécouter cette transmission vocale (Piper TTS)">
                            <i data-lucide="volume-2" class="w-3 h-3 text-cyan-400"></i>
                            <span>Réécouter</span>
                          </button>
                        </div>
                      </div>
                      <p class="text-slate-200 leading-snug">${log.text}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Effectifs & Réserve Opérationnelle -->
            <div class="p-4 rounded-2xl bg-slate-850 border border-slate-700/80 shadow-md space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <i data-lucide="shield-alert" class="w-4 h-4 text-amber-400"></i>
                  Réserve Base & Astreinte Domicile
                </h4>
                <span class="text-[11px] text-slate-400">Total dispo : <strong>${onBaseCount + astreinteCount}</strong></span>
              </div>

              <!-- Liste des Bénévoles Mobilisés avec Switch 1-Clic -->
              <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
                ${(crisis.mobilisation.mobilisedVolunteerIds || []).map(vId => {
                  const vol = (game.volunteers || []).find(v => v.id === vId);
                  if (!vol) return '';

                  const isOnBase = (crisis.reserve.onBase || []).includes(vId);
                  const travelMin = vol.temps_trajet_base_minutes || vol.travelTimeToStationMin || 15;

                  return `
                    <div class="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 font-bold text-white truncate">
                          <span>${vol.name}</span>
                          <span class="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400">${vol.rank}</span>
                        </div>
                        <div class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Trajet : <strong>${travelMin} min</strong></span>
                          <span>Fatigue : <strong class="${(vol.fatigue || 0) > 70 ? 'text-red-400' : 'text-slate-300'}">${Math.round(vol.fatigue || 0)}%</strong></span>
                        </div>
                      </div>

                      <button onclick="window.ProtecCriseLogistique.toggleVolunteerReserveStatus(window.game, '${crisis.id}', '${vol.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${isOnBase ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}">
                        <span class="w-2 h-2 rounded-full ${isOnBase ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                        ${isOnBase ? 'En Base' : 'Astreinte'}
                      </button>
                    </div>
                  `;
                }).join('')}

                ${(crisis.mobilisation.mobilisedVolunteerIds || []).length === 0 ? `
                  <p class="text-xs text-slate-400 italic text-center py-4">Aucun secouriste mobilisé. Utilisez les boutons de mobilisation rapide à gauche.</p>
                ` : ''}
              </div>
            </div>

            <!-- Boutons de Clôture ou Abandon -->
            <div class="pt-2 flex items-center justify-between gap-2">
              <button onclick="window.ProtecCriseLogistique.failCrisis(window.game, '${crisis.id}', 'Impossibilité opérationnelle déclarée')" class="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-800 transition">
                Abandonner la Réquisition
              </button>

              <button onclick="window.ProtecCriseLogistique.openPcCriseModal(window.game, '${crisis.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow transition flex items-center gap-1.5">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                Actualiser
              </button>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  /**
   * Rendu visuel d'une carte de sous-mission
   */
  renderSubMissionCard(game, crisis, sub) {
    const req = sub.moyens_requis || {};
    const isRunning = sub.statut === 'en_cours';
    const isDone = sub.statut === 'termine';
    const isWaiting = sub.statut === 'en_attente';

    return `
      <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-850 border ${isRunning ? 'border-sky-500/50 shadow-sky-950/40' : (isDone ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800')} space-y-3 transition">
        
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h5 class="text-sm font-black text-white">${sub.titre}</h5>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isRunning ? 'bg-sky-500 text-white animate-pulse' : (isDone ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300')}">
                ${isRunning ? 'En Cours' : (isDone ? 'Accomplie' : 'En Attente')}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">
              Requis : <strong>${req.vols_count || 1} bénévoles</strong> (${(req.ranks || []).join(', ') || 'Tous grades'}) 
              ${req.vehicles ? `• Vecteur : <strong>${req.vehicles.join(', ')}</strong>` : ''}
              ${req.specialite_requise ? `• Spécialité : <strong class="text-amber-400 uppercase">${req.specialite_requise}</strong>` : ''}
            </p>
          </div>

          <!-- Bouton d'action -->
          ${isWaiting ? `
            <button onclick="window.ProtecCriseLogistique.openSubMissionArmingModal(window.game, '${crisis.id}', '${sub.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-1.5">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              Armer
            </button>
          ` : ''}
        </div>

        <!-- Jauge de Progression -->
        ${isRunning ? `
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Progression opérationnelle</span>
              <span class="font-black text-sky-400">${Math.round(sub.progression || 0)}%</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-700">
              <div class="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300" style="width: ${sub.progression || 0}%"></div>
            </div>
          </div>
        ` : ''}

        ${isDone ? `
          <div class="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/60">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            Objectif atteint. Effectifs et vecteurs désengagés et réapprovisionnés.
          </div>
        ` : ''}

      </div>
    `;
  },

  /**
   * Modale d'armement d'une sous-mission (sélection équipage + véhicule)
   */
  openSubMissionArmingModal(game, crisisId, subId) {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId);
    if (!crisis) return;

    const myId = game.player?.id || 'usr_local';
    if (crisis.managerPlayerId && crisis.managerPlayerId !== myId) {
      game.showToast('Commandement Exclusif', `Seul le directeur de crise (${crisis.managerPlayerName}) peut armer les sous-missions.`, 'orange');
      return;
    }

    const currentPhase = crisis.phases[crisis.currentPhaseIndex];
    if (!currentPhase) return;

    const sub = (currentPhase.sous_missions || []).find(s => s.id === subId);
    if (!sub) return;

    const req = sub.moyens_requis || {};

    // Bénévoles disponibles (en base ou en astreinte)
    const availableVols = (game.volunteers || []).filter(v => {
      const isMobilised = (crisis.mobilisation.mobilisedVolunteerIds || []).includes(v.id);
      const isNotEngaged = v.isAvailable !== false;
      return isMobilised && isNotEngaged;
    });

    // Véhicules disponibles
    const availableVehicles = (game.vehicles || []).filter(v => v.isAvailable !== false);

    const overlayId = 'pc-sub-mission-arm-modal';
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.className = 'fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200 overflow-y-auto';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl p-5 space-y-4">
        
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-black text-white flex items-center gap-2">
              <i data-lucide="shield-check" class="w-5 h-5 text-emerald-400"></i>
              Armement : ${sub.titre}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Requis : ${req.vols_count} secouristes (${(req.ranks || []).join(', ')}) • Vecteur : ${(req.vehicles || []).join(', ') || 'VL'}
            </p>
          </div>
          <button onclick="document.getElementById('${overlayId}').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- 1. Sélection des Bénévoles -->
        <div class="space-y-2">
          <label class="text-xs font-black text-slate-300 uppercase tracking-wider block">
            1. Sélectionner les secouristes (minimum ${req.vols_count})
          </label>
          <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            ${availableVols.map(v => {
              const isOnBase = (crisis.reserve.onBase || []).includes(v.id);
              return `
                <label class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-center justify-between gap-3 text-xs cursor-pointer">
                  <div class="flex items-center gap-2.5">
                    <input type="checkbox" name="sub_vol_select" value="${v.id}" class="rounded text-sky-500 focus:ring-0">
                    <span class="font-bold text-white">${v.name}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300">${v.rank}</span>
                  </div>
                  <span class="text-[10px] ${isOnBase ? 'text-emerald-400 font-bold' : 'text-amber-400'}">
                    ${isOnBase ? 'En Base' : `Astreinte (~${v.temps_trajet_base_minutes || 15}m)`}
                  </span>
                </label>
              `;
            }).join('')}
            ${availableVols.length === 0 ? '<p class="text-xs text-amber-400 italic">Aucun bénévole disponible dans la réserve. Mobilisez d\'abord du personnel.</p>' : ''}
          </div>
        </div>

        <!-- 2. Sélection des Véhicules -->
        <div class="space-y-2">
          <label class="text-xs font-black text-slate-300 uppercase tracking-wider block">
            2. Sélectionner le vecteur requis
          </label>
          <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            ${availableVehicles.map(veh => {
              const isVLC = Boolean(veh.isCommandement || veh.hasCommandementKit);
              return `
              <label class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border ${isVLC ? 'border-indigo-500/70 ring-1 ring-indigo-500/30' : 'border-slate-700'} flex items-center justify-between gap-3 text-xs cursor-pointer">
                <div class="flex items-center gap-2.5">
                  <input type="checkbox" name="sub_veh_select" value="${veh.id}" class="rounded text-sky-500 focus:ring-0">
                  <span class="font-bold text-white">${veh.name}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] ${isVLC ? 'bg-indigo-600 text-white font-black' : 'bg-slate-700 text-slate-300'}">
                    ${isVLC ? '📡 VLC (PC Mobile)' : veh.type}
                  </span>
                </div>
                <span class="text-[10px] text-slate-400">Carburant : ${veh.fuel || 100}%</span>
              </label>
              `;
            }).join('')}
            ${availableVehicles.length === 0 ? '<p class="text-xs text-red-400 italic">Aucun véhicule disponible dans le garage.</p>' : ''}
          </div>
        </div>

        <!-- Actions -->
        <div class="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button onclick="document.getElementById('${overlayId}').remove()" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300">
            Annuler
          </button>

          <button onclick="
            const selectedVols = Array.from(document.querySelectorAll('input[name=sub_vol_select]:checked')).map(el => el.value);
            const selectedVehs = Array.from(document.querySelectorAll('input[name=sub_veh_select]:checked')).map(el => el.value);
            window.ProtecCriseLogistique.engageSubMission(window.game, '${crisis.id}', '${sub.id}', selectedVols, selectedVehs);
            document.getElementById('${overlayId}').remove();
          " class="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition">
            Valider le Départ
          </button>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  /**
   * Sélecteur de scénarios si aucune crise n'est active
   */
  renderCrisisSelectorModal(game) {
    const overlayId = 'pc-crise-selector-modal';
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.className = 'fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200 overflow-y-auto';
      document.body.appendChild(overlay);
    }

    const crises = [
      { key: 'novi_attentat', title: 'Plan NOVI / Attentat Urbain Multi-Sites', desc: 'Afflux massif de victimes, norias VPSP, armement CAI et CUMP.', auth: 'Préfecture & SAMU 15' },
      { key: 'recherche_disparu', title: 'Recherche de Disparu en Milieu Périlleux', desc: 'PC Mobile, battue pédestre tout-terrain, chiens cyno et drones thermiques.', auth: 'Gendarmerie Nationale' },
      { key: 'greve_ambulances', title: 'Plan Blanc & Réquisition SAMU (Grève)', desc: 'Garde réflexe en ambulance d\'urgence VPSP suite à la carence privée.', auth: 'ARS & SAMU 15' },
      { key: 'violences_urbaines', title: 'Vigilance Risque Violences Urbaines', desc: 'Pré-alerte en caserne SDIS, soutien logistique et mât d\'éclairage.', auth: 'Préfecture & SDIS 18' },
      { key: 'inondation_cai', title: 'Plan PCS / Inondation Majeure & Gymnase', desc: 'Montage CHU 30 lits de camp, épuisement par pompage et repas chauds.', auth: 'Mairie & SIDPC' }
    ];

    overlay.innerHTML = `
      <div class="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-black text-white flex items-center gap-2">
              <i data-lucide="radio" class="w-5 h-5 text-red-500"></i>
              Poste de Commandement (PC Crise)
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">Aucune crise majeure n'est en cours. Choisissez un scénario ORSEC / Préfecture à déclencher :</p>
          </div>
          <button onclick="document.getElementById('${overlayId}').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          ${crises.map(c => `
            <div class="p-3.5 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-800 flex items-center justify-between gap-3 transition">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-black text-white">${c.title}</h4>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">${c.auth}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${c.desc}</p>
              </div>
              <button onclick="
                document.getElementById('${overlayId}').remove();
                window.ProtecCriseLogistique.triggerCrisis(window.game, '${c.key}');
              " class="px-3.5 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-md transition flex items-center gap-1.5 shrink-0">
                <i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i>
                Déclencher
              </button>
            </div>
          `).join('')}
        </div>

        <div class="pt-3 border-t border-slate-800 flex justify-end">
          <button onclick="document.getElementById('${overlayId}').remove()" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300">
            Fermer
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};


