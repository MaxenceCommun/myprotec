/**
 * PROTEC LIVE - CONVENTION AASC & CUMP (Cellule d'Urgence Médico-Psychologique)
 * 
 * Cadre opérationnel officiel de conventionnement pour la mise en place d'un
 * Centre d'Accueil des Impliqués (CAI) lors d'un déclenchement CUMP / SAMU 15.
 * 
 * Règles & Délais stricts de la convention :
 * 1. Astreinte opérationnelle 24h/24 et 365j/an (Ordre de Mission SAMU / Médecin CUMP).
 * 2. Délais de projection :
 *    - Accusé de réception & confirmation de l'effectif : < 20 minutes.
 *    - Départ du 1er agrès de la base logistique : < 1 heure (journée) ou < 1h30 (nuit & week-end).
 *    - Ouverture opérationnelle du CAI sur site : 2 heures maximum après l'alerte.
 * 3. Composition minimale du détachement (Module de base - jusqu'à 20 impliqués) :
 *    - 4 à 6 intervenants secouristes qualifiés.
 *    - Encadrement obligatoire : 1 Chef de détachement (liaison CUMP/CODIS) et 1 responsable émargement/traçabilité.
 *    - Au moins 1 intervenant formé Aide & Écoute Psychologique (AEP1 / AEP2).
 *    - Dotation requise : 1 véhicule (VPSP/VTU/VL), Lot d'accueil d'urgence (secrétariat SINUS, couvertures, réconfort chaud), trousse de secours.
 * 4. Relève dans la durée : rotation obligatoire des équipes toutes les 6 à 8 heures.
 */

window.ProtecCump = {
  // Scénarios d'alertes CUMP / CAI
  SCENARIOS: [
    {
      id: 'cump-bus',
      title: 'Accident Collectif d’Autocar & Prise en Charge Impliqués',
      desc: 'Sortie de route d’un autocar scolaire sur l’axe départemental. 28 impliqués indemnes ou blessés légers en état de sidération aiguë. Le SAMU et le médecin référent CUMP activent le CAI dans la salle des fêtes communale.',
      locationName: 'Salle des Fêtes Municipale',
      doctor: 'Dr. Valérie Mercier (Médecin Coordinateur CUMP)',
      involvedCount: 18,
      reward: 650
    },
    {
      id: 'cump-incendie',
      title: 'Incendie Nocturne d’Immeuble & Évacuation Massive',
      desc: 'Feu d’appartement avec propagation fumées toxiques en pleine nuit. 40 résidents évacués en urgence sur le trottoir en pyjama, enfants en pleurs et détresse psychique intense. Déclenchement CUMP immédiat pour ouverture de CAI.',
      locationName: 'Gymnase Pierre de Coubertin',
      doctor: 'Dr. Karim Benali (Praticien Hospitalier SAMU / CUMP)',
      involvedCount: 20,
      reward: 700
    },
    {
      id: 'cump-train',
      title: 'Accident Ferroviaire Majeur : Choc Psychologique Témoins',
      desc: 'Collision en gare périurbaine. Nombreux voyageurs choqués et témoins directs de scènes traumatisantes. La direction médicale CUMP réquisitionne la Protection Civile pour armer le CAI dans le hall annexe.',
      locationName: 'Hall Annexe Gare SNCF',
      doctor: 'Dr. Sophie Laurent (Médecin Psychiatre Référent CUMP)',
      involvedCount: 16,
      reward: 680
    },
    {
      id: 'cump-college',
      title: 'Drame en Milieu Scolaire : Cellule d’Écoute Parents & Élèves',
      desc: 'Événement grave survenu dans l’enceinte du collège. Sidération chez les collégiens et angoisse majeure des parents massés aux abords. Réquisition préfectorale et médicale pour CAI d’urgence et accueil familles.',
      locationName: 'Réfectoire du Collège Jean Moulin',
      doctor: 'Dr. Antoine Blanchard (Médecin Pédopsychiatre CUMP)',
      involvedCount: 19,
      reward: 620
    },
    {
      id: 'cump-effondrement',
      title: 'Effondrement Partiel d’Immeuble & Recherche Familles',
      desc: 'Sinistre urbain avec périmètre de sécurité bouclé par le SDIS et la Police. Proches et sinistrés désemparés en attente de nouvelles. CAI requis pour sas de décompression, identification et prise en charge CUMP.',
      locationName: 'Foyer Municipal des Jeunes',
      doctor: 'Dr. Hélène Roussel (Médecin Chef CUMP)',
      involvedCount: 17,
      reward: 660
    }
  ],

  // Initialisation de l'état
  injectState(game) {
    if (!game.cumpConvention) {
      game.cumpConvention = {
        signed: false,
        signedAt: null,
        totalMissions: 0,
        successfulMissions: 0,
        complianceScore: 100, // Score de respect des délais (sur 100)
        lastOrderAt: null
      };
    }
  },

  // Vérifier l'éligibilité pour signer la convention
  checkEligibility(game) {
    this.injectState(game);
    const reasons = [];

    // 1. Effectif : au moins 4 secouristes
    if (game.volunteers.length < 4) {
      reasons.push(`Effectif insuffisant : 4 secouristes minimum requis (${game.volunteers.length}/4 actuellement).`);
    }

    // 2. Encadrement : au moins 1 Chef de Dispositif / Chef d'Équipe ou Cadre
    const hasLeader = game.volunteers.some(v => ['CE', 'CD', 'Cadre'].includes(v.rank));
    if (!hasLeader) {
      reasons.push('Encadrement manquant : au moins 1 Chef d’Équipe (CE), Chef de Dispositif (CD) ou Cadre opérationnel requis.');
    }

    // 3. Compétence Aide & Écoute Psychologique : au moins 1 bénévole AEP1 ou AEP2
    const hasAep = game.volunteers.some(v => v.skills && (v.skills.includes('aep1') || v.skills.includes('aep2')));
    if (!hasAep) {
      reasons.push('Compétence AEP manquante : au moins 1 secouriste formé à l’Aide et Écoute Psychologique (AEP1 ou AEP2) requis.');
    }

    // 4. Flotte : au moins 1 véhicule d'intervention ou logistique
    if (game.vehicles.length < 1) {
      reasons.push('Flotte insuffisante : au moins 1 véhicule (VPSP, VTU ou VL) requis pour le détachement.');
    }

    // 5. Matériel : Lot d'accueil d'urgence ou soutien psycho
    const hasPsyLot = (game.workplaceEquipment && game.workplaceEquipment.lot_soutien_psy > 0);
    const hasHebLot = (game.workplaceEquipment && game.workplaceEquipment.lot_hebergement > 0);
    if (!hasPsyLot && !hasHebLot) {
      reasons.push('Dotation matérielle requise : l’antenne doit posséder le « Lot Soutien psychologique & Accueil (CAI) » ou le « Lot Hébergement d’urgence » pour équiper le sas d’accueil.');
    }

    return {
      eligible: reasons.length === 0,
      reasons
    };
  },

  // Signature officielle de la Convention AASC - CUMP
  signConvention(game) {
    this.injectState(game);
    const check = this.checkEligibility(game);
    if (!check.eligible) {
      game.showToast('Convention CUMP Non Éligible', check.reasons.join('\n• '), 'orange');
      return;
    }

    if (!confirm('Confirmez-vous la signature de la Convention AASC - CUMP ?\n\nVotre antenne s’engage à une astreinte opérationnelle 24h/24 et 365j/an pour armer un CAI sous 2 heures avec respect strict des délais de projection.')) {
      return;
    }

    game.cumpConvention = {
      signed: true,
      signedAt: Date.now(),
      totalMissions: 0,
      successfulMissions: 0,
      complianceScore: 100,
      lastOrderAt: null
    };

    const dotation = 850; // Dotation annuelle de conventionnement ARS / SAMU
    game.resources.money += dotation;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + 35;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, dotation, 'Dotation Conventionnement ARS / CUMP (Astreinte CAI 24/7)', 'subvention');
    }

    game.saveGame();
    game.updateStatsUI();

    game.showToast(
      'Convention AASC - CUMP Signée !',
      `Partenariat médical d’urgence officialisé (+${dotation} € dotation ARS, +35 Notoriété). Astreinte opérationnelle CAI activée 24h/24 !`,
      'green'
    );

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory('info', 'Convention AASC - CUMP Active', 'Astreinte 24/7/365 pour déploiement de Centres d\'Accueil des Impliqués (CAI).', 'cump-sign');
    }

    game.openModule('devis', true);
  },

  // Résiliation de la Convention
  terminateConvention(game) {
    this.injectState(game);
    if (!confirm('Êtes-vous sûr de vouloir résilier la Convention CUMP ? Votre antenne ne recevra plus d’ordres de mission pour les Centres d’Accueil des Impliqués.')) {
      return;
    }

    game.cumpConvention = {
      signed: false,
      signedAt: null,
      totalMissions: game.cumpConvention.totalMissions || 0,
      successfulMissions: game.cumpConvention.successfulMissions || 0,
      complianceScore: game.cumpConvention.complianceScore || 100,
      lastOrderAt: null
    };

    game.saveGame();
    game.updateStatsUI();
    game.showToast('Convention CUMP Résiliée', 'La convention avec la CUMP a été suspendue.', 'slate');
    game.openModule('devis', true);
  },

  // Déclenchement d'un Ordre de Mission CUMP (Astreinte 24/7)
  triggerCumpAlert(game, forceScenarioId = null) {
    this.injectState(game);
    if (!game.cumpConvention || !game.cumpConvention.signed) return;

    // Éviter d'avoir plusieurs missions CUMP actives en même temps
    const activeCump = game.missions.find(m => m.isCumpCai && ['prealerte', 'declenche', 'ongoing'].includes(m.status));
    if (activeCump) return;

    const base = game.stations[0] || { lat: 48.8566, lng: 2.3522, name: 'Antenne' };
    const locCoords = (typeof game.calculateRealisticMissionLocation === 'function')
      ? game.calculateRealisticMissionLocation(base, 'crise')
      : { lat: base.lat + (Math.random() - 0.5) * 0.04, lng: base.lng + (Math.random() - 0.5) * 0.04 };

    const scenario = forceScenarioId
      ? (this.SCENARIOS.find(s => s.id === forceScenarioId) || this.SCENARIOS[0])
      : this.SCENARIOS[Math.floor(Math.random() * this.SCENARIOS.length)];

    const nowHour = game.clock ? game.clock.hour : new Date().getHours();
    const isNight = (nowHour >= 21 || nowHour < 7);
    const dayName = game.clock?.dayName || '';
    const isWeekend = (dayName === 'Samedi' || dayName === 'Dimanche');
    const isNightOrWeekend = (isNight || isWeekend);

    // Délais stricts de la convention :
    // - Accusé de réception : < 20 min (dans le jeu : 20 minutes virtuelles = 1200 sec, ou timer accéléré)
    // - Départ agrès : 60 min (journée) ou 90 min (nuit/weekend)
    // - Ouverture CAI : 120 min (2h max)
    const odmNum = `ODM-CUMP-${game.player?.departmentCode || '75'}-${Date.now().toString().slice(-4)}`;

    const newMission = {
      id: `m-cump-${Date.now()}`,
      type: 'crise',
      isCumpCai: true,
      categoryLabel: 'Convention AASC - CUMP (Centre d’Accueil des Impliqués)',
      title: `[Astreinte CUMP] ${scenario.title}`,
      desc: `🚨 ORDRE DE MISSION CUMP (${odmNum}) : ${scenario.desc}\n• Médecin Coordinateur : ${scenario.doctor}\n• Lieu désigné : ${scenario.locationName}\n• Délais stricts : Accusé de réception < 20 min, Départ < ${isNightOrWeekend ? '1h30 (nuit/WE)' : '1h00 (jour)'}, Ouverture CAI < 2h00.`,
      lat: locCoords.lat,
      lng: locCoords.lng,
      scale: `Module CAI Base (4-6 secouristes)`,
      eventDate: { ...game.clock },
      durationSeconds: 120 * 60, // 2h à 8h d'opération
      durationHours: 6.0,
      requiredVolunteers: 4,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VTU', 'VPSP', 'VL'],
      rewardMoney: scenario.reward,
      rewardReputation: 45,
      progress: 0,
      status: 'prealerte',
      alertOrigin: 'cump',
      evolutionResolved: false,
      registeredVolunteers: [],
      assignedCrew: { volunteers: [], vehicles: [] },

      // Données spécifiques Convention CUMP :
      cumpData: {
        odmNumber: odmNum,
        scenarioId: scenario.id,
        doctor: scenario.doctor,
        locationName: scenario.locationName,
        involvedCount: scenario.involvedCount,
        alertTimestamp: Date.now(),
        alertGameClock: { ...game.clock },
        isNightOrWeekend,
        maxDepartureMinutes: isNightOrWeekend ? 90 : 60,

        // État des jalons temporels :
        arConfirmed: false,
        arMinutesLeft: 20, // Compte à rebours 20 minutes virtuelles
        arLate: false,

        departureConfirmed: false,
        departureMinutesLeft: isNightOrWeekend ? 90 : 60,
        departureLate: false,

        caiOpened: false,
        caiOpenMinutesLeft: 120, // 2h max pour ouverture
        caiOpenLate: false,

        phase: 'ar_pending', // 'ar_pending' -> 'mobilisation' -> 'transit' -> 'cai_ouvert' -> 'releve_requise' -> 'termine'

        // Rôles obligatoires :
        leaderId: null, // 1 Chef de détachement (liaison CUMP/CODIS)
        traceabilityId: null, // 1 Responsable émargement / traçabilité
        aepVolunteersCount: 0,

        // Relève dans la durée :
        deployedMinutes: 0,
        releveNeeded: false,
        releveDone: false,

        // Fiche de traçabilité des impliqués (SINUS & CUMP) :
        impliquesList: this.generateInvolvedPeople(scenario.involvedCount)
      }
    };

    if (typeof game.enrichMissionLocationWithCity === 'function') {
      game.enrichMissionLocationWithCity(newMission);
    }

    game.missions.push(newMission);
    game.cumpConvention.totalMissions = (game.cumpConvention.totalMissions || 0) + 1;
    game.cumpConvention.lastOrderAt = Date.now();

    game.renderMissions();
    game.updateStatsUI();
    game.saveGame();

    // Alertes sonores et visuelles d'astreinte
    const notifTitle = `🚨 ORDRE DE MISSION CUMP / SAMU 15`;
    const notifBody = `Déclenchement CAI pour « ${scenario.title} ». Accusez réception sous 20 min impérativement !`;

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory('alert', notifTitle, notifBody, newMission.id);
    }
    game.showToast(notifTitle, notifBody, 'red');

    // Ouverture automatique du panneau ou modal de la mission pour que le joueur réagisse
    setTimeout(() => {
      this.renderCaiModal(game, newMission.id);
    }, 400);
  },

  // Générer une cohorte réaliste d'impliqués pour la traçabilité SINUS / CUMP
  generateInvolvedPeople(count) {
    const prenoms = ['Camille', 'Lucas', 'Emma', 'Maxime', 'Léa', 'Thomas', 'Chloé', 'Alexandre', 'Inès', 'Hugo', 'Sarah', 'Julien', 'Manon', 'Romain', 'Jade', 'Clément', 'Pauline', 'Antoine', 'Océane', 'Nicolas'];
    const noms = ['Dubois', 'Martin', 'Bernard', 'Petit', 'Robert', 'Richard', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel'];
    const stressTypes = [
      { type: 'Sidération aiguë', severity: 'Critique', orient: 'Entretien Psychologue CUMP' },
      { type: 'Crise de panique / Angoisse', severity: 'Majeur', orient: 'Sas Réconfort AEP & Boisson chaude' },
      { type: 'Pleurs / Agitation', severity: 'Moyen', orient: 'Écoute active AEP' },
      { type: 'Proche recherchant un parent', severity: 'Majeur', orient: 'Secrétariat Traçabilité SINUS' },
      { type: 'Calme apparent / Prostration', severity: 'Moyen', orient: 'Surveillance & plaid thermique' }
    ];

    const list = [];
    for (let i = 0; i < count; i++) {
      const p = prenoms[i % prenoms.length];
      const n = noms[(i + 3) % noms.length];
      const age = 12 + Math.floor(Math.random() * 65);
      const s = stressTypes[Math.floor(Math.random() * stressTypes.length)];
      list.push({
        id: `imp-${i + 1}`,
        name: `${p} ${n}`,
        age,
        sinusCode: `SINUS-${(100 + i).toString()}`,
        stress: s.type,
        severity: s.severity,
        orientation: s.orient,
        status: 'accueilli' // 'accueilli', 'en_entretien', 'oriente', 'repose'
      });
    }
    return list;
  },

  // Étape 1 : Accusé de réception & confirmation de l'effectif (< 20 min)
  confirmAR(game, missionId) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission || !mission.cumpData) return;

    if (mission.cumpData.arConfirmed) return;

    mission.cumpData.arConfirmed = true;
    mission.cumpData.arConfirmedAt = Date.now();
    mission.cumpData.phase = 'mobilisation';

    let penaltyText = '';
    if (mission.cumpData.arLate) {
      game.cumpConvention.complianceScore = Math.max(40, (game.cumpConvention.complianceScore || 100) - 10);
      penaltyText = ' ⚠️ Retard sur accusé (> 20 min) : impact sur le score de convention.';
    }

    game.showToast(
      'Accusé de Réception Transmis au SAMU 15',
      `Effectif confirmé auprès du Médecin Coordinateur CUMP.${penaltyText} Préparez le départ du détachement sous ${mission.cumpData.maxDepartureMinutes} min.`,
      mission.cumpData.arLate ? 'orange' : 'green'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderCaiModal(game, missionId);
  },

  // Étape 2 : Départ du premier agrès de la base logistique (< 1h jour / < 1h30 nuit-WE)
  dispatchDetachment(game, missionId, volunteerIds, vehicleId, leaderId, traceabilityId) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission || !mission.cumpData) return;

    // Contrôle de l'AR préalable
    if (!mission.cumpData.arConfirmed) {
      game.showToast('Accusé Requis', 'Vous devez d’abord accuser réception de l’Ordre de Mission auprès du SAMU 15.', 'orange');
      return;
    }

    // 1. Contrôle de l'effectif : 4 à 6 secouristes
    if (!volunteerIds || volunteerIds.length < 4 || volunteerIds.length > 6) {
      game.showToast('Effectif Non Conforme', 'Le module de base CAI impose 4 à 6 intervenants secouristes qualifiés.', 'orange');
      return;
    }

    // 2. Contrôle du Chef de Détachement obligatoire
    if (!leaderId || !volunteerIds.includes(leaderId)) {
      game.showToast('Chef de Détachement Requis', 'Vous devez désigner 1 Chef de Détachement (liaison CUMP/CODIS) parmi les membres envoyés.', 'orange');
      return;
    }
    const leader = game.volunteers.find(v => v.id === leaderId);
    if (!leader || !['CE', 'CD', 'Cadre'].includes(leader.rank)) {
      game.showToast('Qualification Chef Insuffisante', 'Le Chef de Détachement doit détenir le grade de Chef d’Équipe (CE), Chef de Dispositif (CD) ou Cadre.', 'orange');
      return;
    }

    // 3. Contrôle du Responsable Émargement / Traçabilité
    if (!traceabilityId || !volunteerIds.includes(traceabilityId)) {
      game.showToast('Responsable Traçabilité Requis', 'Vous devez désigner 1 Responsable émargement/traçabilité SINUS parmi l’équipage.', 'orange');
      return;
    }
    if (leaderId === traceabilityId) {
      game.showToast('Cumul Interdit', 'Le Chef de détachement (en liaison continue CUMP/CODIS) ne peut pas être le même que le responsable traçabilité.', 'orange');
      return;
    }

    // 4. Contrôle d'au moins 1 intervenant AEP (AEP1 ou AEP2)
    const crewVols = volunteerIds.map(id => game.volunteers.find(v => v.id === id)).filter(Boolean);
    const hasAep = crewVols.some(v => v.skills && (v.skills.includes('aep1') || v.skills.includes('aep2')));
    if (!hasAep) {
      game.showToast('Intervenant AEP Manquant', 'Le détachement CAI doit obligatoirement compter au moins 1 secouriste formé AEP1 ou AEP2.', 'orange');
      return;
    }

    // 5. Contrôle du véhicule
    if (!vehicleId) {
      game.showToast('Véhicule Requis', 'Veuillez sélectionner un véhicule d’intervention ou de soutien (VPSP, VTU ou VL).', 'orange');
      return;
    }
    const vehicle = game.vehicles.find(v => v.id === vehicleId);
    if (!vehicle || vehicle.status !== 'dispo') {
      game.showToast('Véhicule Indisponible', 'Le véhicule sélectionné n’est pas disponible à l’antenne.', 'orange');
      return;
    }

    // Validation du départ
    mission.cumpData.leaderId = leaderId;
    mission.cumpData.traceabilityId = traceabilityId;
    mission.cumpData.aepVolunteersCount = crewVols.filter(v => v.skills && (v.skills.includes('aep1') || v.skills.includes('aep2'))).length;
    mission.cumpData.departureConfirmed = true;
    mission.cumpData.departedAt = Date.now();
    mission.cumpData.phase = 'transit';

    // Affectation de l'équipage
    mission.assignedCrew = {
      volunteers: volunteerIds,
      vehicles: [vehicle]
    };
    mission.status = 'ongoing';

    // Mise à jour des statuts secouristes et véhicule
    crewVols.forEach(v => { v.status = 'mission'; });
    vehicle.status = 'transit';

    let penaltyText = '';
    if (mission.cumpData.departureLate) {
      game.cumpConvention.complianceScore = Math.max(30, (game.cumpConvention.complianceScore || 100) - 15);
      penaltyText = ` ⚠️ Retard au départ (> ${mission.cumpData.maxDepartureMinutes} min) !`;
    }

    game.showToast(
      'Détachement CAI en Route !',
      `Le premier agrès (${vehicle.name}) a quitté la base logistique avec 5 secouristes.${penaltyText} Objectif : ouverture CAI sur site sous 2h max.`,
      mission.cumpData.departureLate ? 'orange' : 'blue'
    );

    // Déclenchement du transit routier animé
    const base = game.stations[0] || { lat: 48.8566, lng: 2.3522 };
    if (window.ProtecSystems && typeof window.ProtecSystems.startTransit === 'function') {
      window.ProtecSystems.startTransit(game, vehicle, base, { lat: mission.lat, lng: mission.lng }, mission, 2, () => {
        vehicle.status = 'sur_les_lieux';
        this.openCaiOnSite(game, mission.id);
      });
    } else {
      setTimeout(() => {
        vehicle.status = 'sur_les_lieux';
        this.openCaiOnSite(game, mission.id);
      }, 3000);
    }

    game.saveGame();
    game.updateStatsUI();
    this.renderCaiModal(game, missionId);
  },

  // Étape 3 : Arrivée sur site et ouverture opérationnelle du CAI (< 2h max)
  openCaiOnSite(game, missionId) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission || !mission.cumpData) return;

    mission.cumpData.caiOpened = true;
    mission.cumpData.caiOpenedAt = Date.now();
    mission.cumpData.phase = 'cai_ouvert';

    let penaltyText = '';
    if (mission.cumpData.caiOpenLate) {
      game.cumpConvention.complianceScore = Math.max(20, (game.cumpConvention.complianceScore || 100) - 20);
      penaltyText = ' ⚠️ Ouverture après 2h00 : pénalité de respect des délais conventionnels.';
    }

    game.showToast(
      'Centre d’Accueil des Impliqués Ouvert !',
      `CAI opérationnel à « ${mission.cumpData.locationName} ». Sas d’accueil, secrétariat SINUS et espace réconfort armés.${penaltyText}`,
      mission.cumpData.caiOpenLate ? 'orange' : 'green'
    );

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory('info', 'CAI Opérationnel', `Le CAI est ouvert à ${mission.cumpData.locationName}. Prise en charge des impliqués en cours.`, mission.id);
    }

    game.saveGame();
    game.updateStatsUI();
    this.renderCaiModal(game, missionId);
  },

  // Étape 4 : Relève et tenue dans la durée (rotation obligatoire 6 à 8 heures)
  sendReleve(game, missionId, releveVolunteerIds) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission || !mission.cumpData) return;

    if (!releveVolunteerIds || releveVolunteerIds.length < 4) {
      game.showToast('Équipe de Relève Incomplète', 'L’équipe de relève doit compter au moins 4 secouristes frais.', 'orange');
      return;
    }

    const prevCrewIds = mission.assignedCrew?.volunteers || [];
    
    // Libérer l'ancienne équipe fatiguée
    prevCrewIds.forEach(id => {
      const v = game.volunteers.find(x => x.id === id);
      if (v) {
        v.status = 'repos';
        v.energy = Math.max(20, (v.energy || 50) - 15);
      }
    });

    // Assigner la nouvelle équipe
    releveVolunteerIds.forEach(id => {
      const v = game.volunteers.find(x => x.id === id);
      if (v) v.status = 'mission';
    });

    mission.assignedCrew.volunteers = releveVolunteerIds;
    mission.cumpData.releveDone = true;
    mission.cumpData.releveNeeded = false;
    mission.cumpData.deployedMinutes = 0; // Réinitialisation compteur de quart

    game.showToast(
      'Relève d’Équipage Effectuée !',
      'L’équipe montante a pris le relais au CAI. L’équipe descendante a été mise au repos obligatoire (Protocole 6-8h CUMP respecté).',
      'green'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderCaiModal(game, missionId);
  },

  // Clôture du CAI
  closeCai(game, missionId) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission || !mission.cumpData) return;

    if (!confirm('Confirmez-vous la fermeture opérationnelle du Centre d’Accueil des Impliqués après avis favorable du Médecin Référent CUMP ?')) {
      return;
    }

    // Libération des secouristes et véhicules
    const crew = mission.assignedCrew?.volunteers || [];
    crew.forEach(id => {
      const v = game.volunteers.find(x => x.id === id);
      if (v) {
        v.status = 'dispo';
        v.exp = (v.exp || 0) + 35;
      }
    });

    if (mission.assignedCrew?.vehicles) {
      mission.assignedCrew.vehicles.forEach(veh => {
        const v = game.vehicles.find(x => x.id === veh.id);
        if (v) v.status = 'dispo';
      });
    }

    // Bilan financier et réputationnel
    const baseReward = mission.rewardMoney || 650;
    const compScore = game.cumpConvention.complianceScore || 100;
    const finalBonus = Math.round(baseReward * (compScore / 100));

    game.resources.money += finalBonus;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + 40;
    game.cumpConvention.successfulMissions = (game.cumpConvention.successfulMissions || 0) + 1;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, finalBonus, `Indemnité Convention CUMP : ${mission.title}`, 'prestation');
    }

    mission.status = 'completed';
    mission.cumpData.phase = 'termine';

    // Fermer la modal
    const modal = document.getElementById('main-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast(
      'CAI Clôturé avec Succès !',
      `Fermeture actée avec le Dr. ${mission.cumpData.doctor}. Bilan : +${finalBonus} € (Indemnité CUMP) et +40 pts de notoriété préfectorale !`,
      'green'
    );

    game.saveGame();
    game.updateStatsUI();
    game.renderMissions();
  },

  // Mise à jour de l'horloge des missions CUMP actives (appelé chaque seconde)
  updateCumpMissionsClock(game) {
    if (!game.missions) return;
    const activeCumpMissions = game.missions.filter(m => m.isCumpCai && ['prealerte', 'ongoing'].includes(m.status));
    if (activeCumpMissions.length === 0) return;

    activeCumpMissions.forEach(m => {
      const d = m.cumpData;
      if (!d) return;

      // 1. Décompte pour Accusé de Réception (< 20 min)
      if (!d.arConfirmed) {
        d.arMinutesLeft = Math.max(0, d.arMinutesLeft - 0.05);
        if (d.arMinutesLeft <= 0 && !d.arLate) {
          d.arLate = true;
          game.showToast('Retard Accusé CUMP !', 'Le délai de 20 minutes pour accuser réception de l’Ordre de Mission est dépassé !', 'red');
        }
      }

      // 2. Décompte pour Départ (< 60 ou 90 min)
      if (d.arConfirmed && !d.departureConfirmed) {
        d.departureMinutesLeft = Math.max(0, d.departureMinutesLeft - 0.05);
        if (d.departureMinutesLeft <= 0 && !d.departureLate) {
          d.departureLate = true;
          game.showToast('Retard Départ CUMP !', `Le délai de projection (${d.maxDepartureMinutes} min) pour faire partir le premier agrès est dépassé !`, 'red');
        }
      }

      // 3. Décompte pour Ouverture CAI (< 2h max = 120 min)
      if (!d.caiOpened) {
        d.caiOpenMinutesLeft = Math.max(0, d.caiOpenMinutesLeft - 0.05);
        if (d.caiOpenMinutesLeft <= 0 && !d.caiOpenLate) {
          d.caiOpenLate = true;
          game.showToast('Délai 2h CAI Dépassé !', 'Le délai conventionnel maximal de 2 heures pour l’ouverture du CAI a expiré !', 'red');
        }
      }

      // 4. Tenue dans la durée : rotation obligatoire 6h à 8h (360 min à 480 min)
      if (d.caiOpened && d.phase === 'cai_ouvert') {
        d.deployedMinutes = (d.deployedMinutes || 0) + 0.05;
        if (d.deployedMinutes >= 360 && !d.releveNeeded && !d.releveDone) {
          d.releveNeeded = true;
          game.showToast(
            'Relève CUMP Obligatoire !',
            'L’équipe est engagée depuis plus de 6 heures. Le protocole de convention impose une rotation des équipes sous peine d’épuisement.',
            'orange'
          );
        }
      }
    });
  },

  // Modale de pilotage du Centre d'Accueil des Impliqués (CAI)
  renderCaiModal(game, missionId) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission || !mission.cumpData) return;

    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Centre d’Accueil des Impliqués (CAI) — Protocole CUMP';
    subtitle.textContent = `Astreinte opérationnelle 24/7 • ${mission.cumpData.odmNumber}`;
    icon.setAttribute('data-lucide', 'shield-alert');

    const d = mission.cumpData;
    const availableVols = game.volunteers.filter(v => v.status === 'dispo' || (mission.assignedCrew?.volunteers || []).includes(v.id));
    const availableVehs = game.vehicles.filter(v => v.status === 'dispo' || (mission.assignedCrew?.vehicles || []).some(x => x.id === v.id));

    body.innerHTML = `
      <div class="space-y-6">
        
        <!-- En-tête : Ordre de Mission Officiel -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-red-700 via-rose-800 to-indigo-900 text-white shadow-lg space-y-3">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/20 pb-2.5">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">📋</span>
              <div>
                <span class="text-[10px] font-mono tracking-widest text-red-200 uppercase font-black">ORDRE DE MISSION RÉGULATION SAMU 15</span>
                <h4 class="text-sm font-black">${mission.title}</h4>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-white/20 backdrop-blur-md">
              ${d.odmNumber}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div class="bg-white/10 p-2.5 rounded-2xl">
              <span class="text-[9px] uppercase font-bold text-red-200 block">Médecin Coordinateur CUMP :</span>
              <strong class="text-white">${d.doctor}</strong>
            </div>
            <div class="bg-white/10 p-2.5 rounded-2xl">
              <span class="text-[9px] uppercase font-bold text-red-200 block">Lieu du CAI :</span>
              <strong class="text-white">${d.locationName}</strong>
            </div>
            <div class="bg-white/10 p-2.5 rounded-2xl">
              <span class="text-[9px] uppercase font-bold text-red-200 block">Impliqués attendus :</span>
              <strong class="text-white">${d.involvedCount} personnes (Module base)</strong>
            </div>
          </div>
        </div>

        <!-- Frise Chronologique & Délais Stricts de la Convention -->
        <div class="p-4 rounded-3xl glass-card border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <span>⏱️</span>
              <span>Délais de Projection Conventionnels</span>
            </h5>
            <span class="text-[10px] font-bold text-slate-500">
              Conformité : <strong class="text-emerald-700">${game.cumpConvention.complianceScore || 100}%</strong>
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <!-- Jalon 1 : Accusé de réception -->
            <div class="p-3 rounded-2xl ${d.arConfirmed ? 'bg-emerald-50 border border-emerald-200' : (d.arLate ? 'bg-red-50 border border-red-200 ring-2 ring-red-400' : 'bg-slate-50 border border-slate-200')}">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-[11px] text-slate-800">1. Accusé & Effectif</span>
                <span class="text-[10px] font-bold ${d.arConfirmed ? 'text-emerald-700' : (d.arLate ? 'text-red-700' : 'text-amber-600')}">
                  ${d.arConfirmed ? '✓ Validé' : `${Math.ceil(d.arMinutesLeft)} min`}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 mt-1">Délai contractuel : <strong>&lt; 20 minutes</strong> dès T0.</p>
              ${!d.arConfirmed ? `
                <button onclick="window.ProtecCump.confirmAR(window.game, '${mission.id}')" class="mt-2 w-full py-1.5 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-extrabold text-[11px] shadow transition">
                  Accuser Réception (AR)
                </button>
              ` : ''}
            </div>

            <!-- Jalon 2 : Départ de la base -->
            <div class="p-3 rounded-2xl ${d.departureConfirmed ? 'bg-emerald-50 border border-emerald-200' : (d.departureLate ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200')}">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-[11px] text-slate-800">2. Départ 1er Agrès</span>
                <span class="text-[10px] font-bold ${d.departureConfirmed ? 'text-emerald-700' : (d.departureLate ? 'text-red-700' : 'text-amber-600')}">
                  ${d.departureConfirmed ? '✓ Parti' : `${Math.ceil(d.departureMinutesLeft)} min`}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 mt-1">Délai : <strong>&lt; ${d.maxDepartureMinutes} min</strong> (${d.isNightOrWeekend ? 'Nuit/WE' : 'Journée'}).</p>
            </div>

            <!-- Jalon 3 : Ouverture CAI sur site -->
            <div class="p-3 rounded-2xl ${d.caiOpened ? 'bg-emerald-50 border border-emerald-200' : (d.caiOpenLate ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-200')}">
              <div class="flex items-center justify-between">
                <span class="font-extrabold text-[11px] text-slate-800">3. Ouverture CAI</span>
                <span class="text-[10px] font-bold ${d.caiOpened ? 'text-emerald-700' : (d.caiOpenLate ? 'text-red-700' : 'text-amber-600')}">
                  ${d.caiOpened ? '✓ Opérationnel' : `${Math.ceil(d.caiOpenMinutesLeft)} min`}
                </span>
              </div>
              <p class="text-[10px] text-slate-500 mt-1">Délai contractuel : <strong>&lt; 2h00 max</strong> après l’alerte.</p>
            </div>
          </div>
        </div>

        ${!d.departureConfirmed ? `
          <!-- Configuration du Détachement (Module de base : 4 à 6 secouristes) -->
          <div class="p-4 rounded-3xl glass-card border border-slate-200 space-y-4">
            <div>
              <h5 class="text-xs font-black uppercase text-slate-800">Armement du Détachement CAI</h5>
              <p class="text-[11px] text-slate-500">4 à 6 secouristes requis • 1 Chef de détachement • 1 Responsable traçabilité • Au moins 1 qualifié AEP</p>
            </div>

            <!-- Sélection de l'équipage -->
            <div class="space-y-2">
              <label class="text-[10px] font-extrabold uppercase text-slate-400 block">1. Sélectionner les 4 à 6 secouristes :</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                ${availableVols.map(v => {
                  const isLeader = ['CE', 'CD', 'Cadre'].includes(v.rank);
                  const isAep = v.skills && (v.skills.includes('aep1') || v.skills.includes('aep2'));
                  return `
                    <label class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer text-xs">
                      <input type="checkbox" name="cump-crew" value="${v.id}" class="rounded text-pc-blue">
                      <div class="flex-1">
                        <span class="font-bold text-slate-800">${v.name}</span>
                        <div class="flex items-center gap-1 mt-0.5">
                          <span class="px-1.5 py-0.2 rounded text-[9px] font-bold ${isLeader ? 'bg-amber-100 text-amber-900 font-black' : 'bg-slate-200 text-slate-700'}">${v.rank || 'Secouriste'}</span>
                          ${isAep ? '<span class="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-900">🧠 AEP</span>' : ''}
                        </div>
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Désignation des 2 postes obligatoires -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label class="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">2. Chef de Détachement (Liaison CUMP/CODIS) :</label>
                <select id="cump-leader-select" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-pc-blue">
                  <option value="">Sélectionner un cadre (CE, CD, Cadre)...</option>
                  ${availableVols.filter(v => ['CE', 'CD', 'Cadre'].includes(v.rank)).map(v => `
                    <option value="${v.id}">${v.name} (${v.rank})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">3. Responsable Émargement / Traçabilité :</label>
                <select id="cump-traceability-select" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800">
                  <option value="">Sélectionner le responsable traçabilité...</option>
                  ${availableVols.map(v => `
                    <option value="${v.id}">${v.name} (${v.rank})</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Véhicule -->
            <div class="pt-2 border-t border-slate-100">
              <label class="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">4. Véhicule de Soutien ou d’Intervention :</label>
              <select id="cump-veh-select" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800">
                <option value="">Sélectionner le véhicule (VTU, VPSP, VL)...</option>
                ${availableVehs.map(v => `
                  <option value="${v.id}">${v.name} (${v.type})</option>
                `).join('')}
              </select>
            </div>

            <button onclick="
              const checkedVols = Array.from(document.querySelectorAll('input[name=cump-crew]:checked')).map(cb => cb.value);
              const leaderId = document.getElementById('cump-leader-select').value;
              const traceId = document.getElementById('cump-traceability-select').value;
              const vehId = document.getElementById('cump-veh-select').value;
              window.ProtecCump.dispatchDetachment(window.game, '${mission.id}', checkedVols, vehId, leaderId, traceId);
            " class="w-full py-3 rounded-2xl bg-gradient-to-r from-pc-blue to-indigo-700 hover:brightness-110 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>Faire Partir le Premier Agrès (Statut 2)</span>
            </button>
          </div>
        ` : ''}

        ${d.caiOpened ? `
          <!-- CAI OUVERT : Fiche d'émargement SINUS & Suivi des Impliqués -->
          <div class="p-4 rounded-3xl glass-card border border-emerald-300 bg-emerald-50/20 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h5 class="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>CAI Opérationnel — Traçabilité des Impliqués (${d.impliquesList.length})</span>
                </h5>
                <p class="text-[11px] text-slate-500">Sas d’accueil, secrétariat SINUS et entretiens de déchoquage médico-psychologique</p>
              </div>

              ${d.releveNeeded ? `
                <span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-100 text-amber-800 animate-bounce">
                  ⚠️ Relève d’Équipage Requise (6h de quart)
                </span>
              ` : `
                <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                  Engagement en cours : ${Math.round(d.deployedMinutes || 0)} min
                </span>
              `}
            </div>

            <!-- Liste des impliqués -->
            <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
              ${d.impliquesList.map(imp => `
                <div class="p-2.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs hover:shadow-sm transition">
                  <div class="flex items-center gap-2.5">
                    <span class="px-1.5 py-0.5 rounded font-mono text-[9px] font-extrabold bg-slate-100 text-slate-700">${imp.sinusCode}</span>
                    <div>
                      <strong class="text-slate-900">${imp.name}</strong> <span class="text-slate-400">(${imp.age} ans)</span>
                      <div class="flex items-center gap-1 mt-0.5">
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold ${imp.severity === 'Critique' ? 'bg-red-100 text-red-800 font-extrabold' : 'bg-amber-100 text-amber-800'}">${imp.stress}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] font-extrabold text-indigo-700 block">${imp.orientation}</span>
                    <span class="text-[9px] text-emerald-600 font-bold">Prise en charge AEP ✓</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Boutons Clôture & Relève -->
            <div class="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
              ${d.releveNeeded ? `
                <button onclick="
                  const freshVols = window.game.volunteers.filter(v => v.status === 'dispo').slice(0, 4).map(v => v.id);
                  if (freshVols.length < 4) {
                    window.game.showToast('Effectif Insuffisant', 'Il vous faut 4 bénévoles disponibles pour monter la relève.', 'orange');
                  } else {
                    window.ProtecCump.sendReleve(window.game, '${mission.id}', freshVols);
                  }
                " class="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow transition">
                  Envoyer l’Équipe de Relève (Rotation 6h-8h)
                </button>
              ` : ''}

              <button onclick="window.ProtecCump.closeCai(window.game, '${mission.id}')" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>Clôturer le CAI avec le Médecin CUMP</span>
              </button>
            </div>
          </div>
        ` : ''}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Rendu de la carte de convention pour la modale Devis / Partenariats
  renderConventionCardHTML(game) {
    this.injectState(game);
    const conv = game.cumpConvention || {};
    const isSigned = !!conv.signed;
    const check = this.checkEligibility(game);

    return `
      <!-- Section Convention AASC - CUMP (Centre d'Accueil des Impliqués) -->
      <div class="p-4 rounded-2xl ${isSigned ? 'glass-card-blue border-rose-300' : 'glass-card border-slate-200'} shadow-sm space-y-3 border">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl ${isSigned ? 'bg-gradient-to-br from-red-600 to-rose-700 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center font-black text-lg shadow-sm">
              🫂
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-xs font-black text-slate-900 uppercase">Convention AASC - CUMP (Centre d’Accueil des Impliqués)</h4>
                <span class="px-2 py-0.5 rounded text-[10px] font-extrabold ${isSigned ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
                  ${isSigned ? 'Convention Signée ✓' : 'Non Signée'}
                </span>
                ${isSigned ? `
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                    Compliance : ${conv.complianceScore || 100}%
                  </span>
                ` : ''}
              </div>
              <p class="text-[11px] text-slate-600 mt-0.5">
                Convention d'astreinte 24h/24 et 365j/an avec la Cellule d'Urgence Médico-Psychologique (SAMU). Déploiement garanti d’un CAI sous 2h max pour accueillir et tracer jusqu’à 20 impliqués lors d’accidents collectifs ou drames.
              </p>
              <div class="flex flex-wrap gap-3 mt-1.5 text-[10px] text-slate-500 font-bold">
                <span>Dotation initiale ARS : <strong class="text-emerald-700 font-mono">+850 €</strong></span>
                <span>•</span>
                <span>Délais : <strong class="text-slate-700 font-mono">AR &lt; 20m, Départ &lt; 1h/1h30, CAI &lt; 2h</strong></span>
                <span>•</span>
                <span>Prestation CAI : <strong class="text-emerald-700 font-mono">+620 à +700 €</strong></span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            ${isSigned ? `
              <button onclick="window.ProtecCump.triggerCumpAlert(window.game);" class="px-3 py-1.5 rounded-xl text-xs font-bold text-pc-blue bg-blue-50 hover:bg-blue-100 transition border border-blue-200" title="Déclencher un exercice CAI">
                Tester Exercice
              </button>
              <button onclick="window.ProtecCump.terminateConvention(window.game);" class="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition border border-rose-200">
                Résilier
              </button>
            ` : `
              <button onclick="window.ProtecCump.signConvention(window.game);" class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer">
                <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
                <span>Signer la Convention CUMP (+850 €)</span>
              </button>
            `}
          </div>
        </div>

        ${!isSigned && !check.eligible ? `
          <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
            <span class="font-bold block uppercase text-[9px] text-amber-700 tracking-wider">Critères de conventionnement restants à valider :</span>
            <ul class="list-disc pl-4 space-y-0.5 text-[10px]">
              ${check.reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }
};
