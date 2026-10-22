/**
 * PROTEC LIVE - MODULE DE GESTIONNAIRE DE SCÉNARIOS
 * 
 * Permet de visualiser, créer, modifier, dupliquer, supprimer et déclencher à la demande
 * n'importe quel scénario opérationnel :
 * - Dispositifs Prévisionnels de Secours (DPS)
 * - Situations d'urgence & Réquisitions SAMU 15 / SDIS
 * - Crises majeures & Plans NOVI
 * 
 * Intégré au panneau d'administration et aux outils de simulation.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'protec_custom_scenarios_v1';
  const OVERRIDES_KEY = 'protec_scenario_overrides_v1';

  // 1. CATALOGUE PAR DÉFAUT DES SCÉNARIOS OFFICIELS
  const DEFAULT_SCENARIOS = [
    // =========================================================================
    // A. DISPOSITIFS PRÉVISIONNELS DE SECOURS (DPS)
    // =========================================================================
    {
      id: 'dps_football_regional',
      type: 'dps',
      category: 'sport',
      scale: 'DPS-PE (4 secouristes + VPSP)',
      title: 'Match de Football Régional',
      desc: 'Rencontre sportive de championnat régional. Surveillance des tribunes et des joueurs sur le terrain. Risque de traumatismes des membres et malaises spectateurs.',
      requiredVolunteers: 4,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      requiredLots: ['lot_secours_b'],
      durationHours: 4.5,
      rewardMoney: 480,
      rewardReputation: 35,
      riskLevel: 'moyen',
      urgency: 'normale',
      environment: 'ouvert_urbain',
      peripeties: [
        'Traumatisme de la cheville d\'un joueur sur tacle appuyé (MID et évacuation)',
        'Malaise vagal d\'un spectateur en tribune basse',
        'Contusion musculaire suite à un choc tête contre tête'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'dps_festival_musique',
      type: 'dps',
      category: 'concert',
      scale: 'DPS-GE (10 secouristes + 2 VPSP)',
      title: 'Festival de Musique Électronique & Concert',
      desc: 'Grand festival musical en plein air accueillant plus de 6 000 festivaliers. Montage obligatoire d\'un poste fixe médicalisé (Lot A) et patrouilles pédestres.',
      requiredVolunteers: 10,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP', 'VPSP', 'VL'],
      requiredLots: ['lot_secours_a', 'lot_secours_b', 'lot_secours_c'],
      durationHours: 10.0,
      rewardMoney: 1850,
      rewardReputation: 80,
      riskLevel: 'eleve',
      urgency: 'haute',
      environment: 'ouvert_urbain',
      peripeties: [
        'Multiples états d\'ivresse aiguë et déshydratations sous la chaleur',
        'Traumatisme crânien léger suite à un mouvement de foule devant la scène',
        'Coupure profonde à la main par bris de verre au bar',
        'Crise d\'angoisse et détresse respiratoire claustrophobe'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'dps_trail_nature',
      type: 'dps',
      category: 'sport',
      scale: 'DPS-ME (6 secouristes + VPSP + Quad/4x4)',
      title: 'Trail des Forêts & Course Nature (42 km)',
      desc: 'Épreuve sportive d\'endurance en milieu naturel accidenté. Évacuations difficiles nécessitant brancardage en sous-bois et poste relais.',
      requiredVolunteers: 6,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP', 'VTU'],
      requiredLots: ['lot_secours_b', 'lot_secours_c'],
      durationHours: 8.0,
      rewardMoney: 950,
      rewardReputation: 50,
      riskLevel: 'moyen',
      urgency: 'normale',
      environment: 'nature',
      peripeties: [
        'Épuisement sévère et crampes généralisées au km 32',
        'Chute en descente rocailleuse avec suspicion de fracture clavicule',
        'Coureur égaré retrouvé en hypothermie modérée par le binôme mobile'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'dps_brocante_paps',
      type: 'dps',
      category: 'public',
      scale: 'PAPS (2 secouristes)',
      title: 'Brocante & Foire Communale de Printemps',
      desc: 'Point d\'Alerte et de Premiers Secours itinérant au milieu des étals des brocanteurs. Soins de bobologie, malaises et chutes de personnes âgées.',
      requiredVolunteers: 2,
      requiredRanks: ['PSE2', 'PSE1'],
      requiredVehicles: [],
      requiredLots: ['lot_secours_b'],
      durationHours: 6.0,
      rewardMoney: 260,
      rewardReputation: 20,
      riskLevel: 'faible',
      urgency: 'normale',
      environment: 'ouvert_urbain',
      peripeties: [
        'Plaie superficielle au doigt nécessitant pansement compressif',
        'Hypoglycémie chez une personne âgée déambulante',
        'Perte d\'un enfant rapidement retrouvé et réconforté au poste'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'dps_natation_nautique',
      type: 'dps',
      category: 'nautique',
      scale: 'DPS-PE (4 secouristes + VPSP)',
      title: 'Compétition Régionale de Natation en Bassin Olympique',
      desc: 'Surveillance des épreuves de natation et du public en gradins. Présence obligatoire de matériel d\'oxygénothérapie et défibrillateur.',
      requiredVolunteers: 4,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      requiredLots: ['lot_secours_b'],
      durationHours: 5.0,
      rewardMoney: 520,
      rewardReputation: 40,
      riskLevel: 'faible',
      urgency: 'normale',
      environment: 'ferme',
      peripeties: [
        'Glissade sur carrelage mouillé avec plaie arcade sourcilière',
        'Crise d\'asthme d\'un nageur en fin de course (inhalation O2)',
        'Malaise vagal en bord de bassin'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'dps_sports_combat',
      type: 'dps',
      category: 'sport',
      scale: 'PAPS Renforcé (3 secouristes)',
      title: 'Gala d’Arts Martiaux & Boxe en Salle',
      desc: 'Compétition de sports de combat sur tatami et ring. Prise en charge rapide des traumatismes faciaux, épistaxis et KO.',
      requiredVolunteers: 3,
      requiredRanks: ['PSE2', 'PSE1'],
      requiredVehicles: [],
      requiredLots: ['lot_secours_b'],
      durationHours: 4.5,
      rewardMoney: 390,
      rewardReputation: 30,
      riskLevel: 'moyen',
      urgency: 'normale',
      environment: 'ferme',
      peripeties: [
        'KO d\'un combattant avec perte de connaissance initiale brève (pose collier cervical)',
        'Épistaxis sévère avec hémostase par tamponnement d\'urgence',
        'Luxation de l\'épaule sur projection au sol'
      ],
      isDefault: true,
      enabled: true
    },

    // =========================================================================
    // B. SITUATIONS D'URGENCE & RÉQUISITIONS SAMU 15 / SDIS
    // =========================================================================
    {
      id: 'samu_detresse_respiratoire',
      type: 'samu',
      category: 'medical',
      scale: 'Départ Réflexe SAMU 15 (3 secouristes + VPSP)',
      title: 'Départ Réflexe 15 : Détresse Respiratoire à Domicile',
      desc: 'Appel de la régulation SAMU 15 pour un renfort ambulance immédiat. Patient de 68 ans présentant une dyspnée aiguë sévère avec tirage et SpO2 à 84%.',
      requiredVolunteers: 3,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      requiredLots: ['lot_secours_b'],
      durationHours: 1.5,
      rewardMoney: 340,
      rewardReputation: 45,
      riskLevel: 'eleve',
      urgency: 'critique',
      environment: 'ferme',
      peripeties: [
        'Bilan initial : SpO2 84%, polypnée à 32/min, sueurs froides',
        'Mise sous O2 haut débit 15L/min au masque à haute concentration',
        'Régulation médicale 15 confirmant l\'envoi d\'un SMUR sur place'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'samu_suspicion_avc',
      type: 'samu',
      category: 'medical',
      scale: 'Départ Réflexe SAMU 15 (3 secouristes + VPSP)',
      title: 'Urgence Vitale 15 : Suspicion d’AVC (Alerte Thrombolyse)',
      desc: 'Départ d\'urgence ordonné par le médecin régulateur du SAMU. Patiente de 54 ans avec hémiplégie brutale et aphasie survenue il y a moins de 45 minutes.',
      requiredVolunteers: 3,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      requiredLots: ['lot_secours_b'],
      durationHours: 1.2,
      rewardMoney: 360,
      rewardReputation: 50,
      riskLevel: 'critique',
      urgency: 'critique',
      environment: 'ferme',
      peripeties: [
        'Évaluation score FAST : asymétrie faciale, déficit moteur bras droit, aphasie',
        'Prise de glycémie capillaire (5.4 mmol/L) éliminant une hypoglycémie',
        'Évacuation gyrophares vers l\'Unité Neuro-Vasculaire (UNV) d\'urgence'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'samu_arret_cardiaque',
      type: 'samu',
      category: 'secours',
      scale: 'Départ Réflexe SAMU 15 (3 secouristes + VPSP + DAE)',
      title: 'Arrêt Cardio-Respiratoire (ACR) sur Voie Publique',
      desc: 'Homme de 52 ans effondré sur le trottoir sans réaction. Massage cardiaque guidé au téléphone par la régulation 15 en attendant l\'arrivée de votre VPSP.',
      requiredVolunteers: 3,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      requiredLots: ['lot_secours_b', 'caisse_rearmement'],
      durationHours: 1.8,
      rewardMoney: 420,
      rewardReputation: 60,
      riskLevel: 'critique',
      urgency: 'critique',
      environment: 'ouvert_urbain',
      peripeties: [
        'Constat ACR : absence de pouls carotidien et de respiration efficace',
        'Pose des électrodes DAE : choc électrique conseillé et délivré avec succès',
        'Reprise d\'une activité circulatoire spontanée (ROSC) à l\'arrivée du SMUR'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'samu_avp_moto',
      type: 'samu',
      category: 'secours',
      scale: 'Renfort SUAP SDIS/SAMU (3 secouristes + VPSP)',
      title: 'Accident Voie Publique : Chute Moto contre Glissière',
      desc: 'Collision entre un deux-roues et une voiture en carrefour. Motard éjecté sur la chaussée. Suspicion de polytraumatisme et fracture ouverte.',
      requiredVolunteers: 3,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      requiredLots: ['lot_secours_b', 'lot_secours_c'],
      durationHours: 2.0,
      rewardMoney: 380,
      rewardReputation: 40,
      riskLevel: 'eleve',
      urgency: 'haute',
      environment: 'ouvert_urbain',
      peripeties: [
        'Maintien d\'axe tête-cou-tronc et retrait du casque par deux secouristes',
        'Pose d\'un collier cervical rigide et immobilisation matelas à dépression (MID)',
        'Pose d\'un pansement stérile protecteur sur dermabrasions étendues'
      ],
      isDefault: true,
      enabled: true
    },

    // =========================================================================
    // C. CRISES MAJEURES, PLANS NOVI & CATASTROPHES
    // =========================================================================
    {
      id: 'crise_carambolage_voie_rapide',
      type: 'crise',
      category: 'novi',
      scale: 'PLAN NOVI ROUTIER (8 secouristes + 2 VPSP + PMA)',
      title: 'Carambolage Multiple sur Voie Rapide / Autoroute',
      desc: 'Brouillard intense provoquant une collision en chaîne de 12 véhicules dont 1 autocar. Déclenchement du Plan NOVI par le Préfet : montage PMA et tri des victimes.',
      requiredVolunteers: 8,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP', 'VPSP', 'VTU'],
      requiredLots: ['lot_secours_a', 'lot_secours_b', 'lot_secours_c', 'caisse_rearmement'],
      durationHours: 5.5,
      rewardMoney: 1650,
      rewardReputation: 75,
      riskLevel: 'critique',
      urgency: 'critique',
      environment: 'autoroute',
      peripeties: [
        'Chaîne de triage des victimes : 3 Urgences Absolues (UA), 9 Urgences Relatives (UR)',
        'Mise en place d\'un Poste Médical Avancé (PMA) sous tente gonflable Lot A',
        'Noria d\'évacuations coordonnées par VPSP vers les centres hospitaliers',
        'Soutien psychologique immédiat aux passagers indemnes choqués'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'crise_inondations_crues',
      type: 'crise',
      category: 'inondation',
      scale: 'ORSEC INONDATIONS (8 secouristes + Épuisement & Sauvetage)',
      title: 'Crues Subites & Inondations Majeures de la Commune',
      desc: 'Pluies diluviennes provoquant le débordement des cours d\'eau. Rues inondées avec 80 cm d\'eau, sous-sols et habitations isolées. Déploiement des motopompes.',
      requiredVolunteers: 8,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VTU', 'VTU'],
      requiredLots: ['lot_secours_a', 'caisse_rearmement'],
      durationHours: 7.0,
      rewardMoney: 1450,
      rewardReputation: 70,
      riskLevel: 'critique',
      urgency: 'haute',
      environment: 'eau',
      peripeties: [
        'Évacuation de 14 riverains bloqués à l\'étage de leur maison',
        'Mise en batterie des motopompes et groupes électrogènes de secours',
        'Ouverture d\'un Centre d\'Hébergement d\'Urgence (CHU lits picots)'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'crise_tempete_tronconnage',
      type: 'crise',
      category: 'tempete',
      scale: 'ORSEC TEMPÊTE & DÉGAGEMENT (6 secouristes + Lot Tronçonnage)',
      title: 'Tempête Hivernale : Vents Violents & Voies Coupées',
      desc: 'Rafales de vent à plus de 130 km/h. Chutes massives d\'arbres sur les routes d\'accès aux secours et toitures arrachées nécessitant bâchage d\'urgence.',
      requiredVolunteers: 6,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VTU', 'VL'],
      requiredLots: ['lot_secours_b'],
      durationHours: 6.0,
      rewardMoney: 1100,
      rewardReputation: 60,
      riskLevel: 'eleve',
      urgency: 'haute',
      environment: 'nature',
      peripeties: [
        'Dégagement à la tronçonneuse d\'un tronc bloquant l\'accès d\'une caserne',
        'Bâchage d\'urgence du toit d\'une école primaire avant la tombée de la nuit',
        'Ravitaillement en eau et vivres de riverains coupés du réseau électrique'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'crise_deraillement_novi',
      type: 'crise',
      category: 'novi',
      scale: 'PLAN NOVI MAJEUR (12 secouristes + Noria VPSP + PMA)',
      title: 'Plan NOVI Catastrophe : Déraillement de Train Express',
      desc: 'Sortie de voie d\'une rame ferroviaire en entrée d\'agglomération avec 35 impliqués. Activation du plan rouge / NOVI départemental par la Préfecture.',
      requiredVolunteers: 12,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP', 'VPSP', 'VPSP', 'VTU'],
      requiredLots: ['lot_secours_a', 'lot_secours_b', 'lot_secours_c', 'caisse_rearmement'],
      durationHours: 8.5,
      rewardMoney: 2800,
      rewardReputation: 95,
      riskLevel: 'critique',
      urgency: 'critique',
      environment: 'ouvert_urbain',
      peripeties: [
        'Installation immédiate du PMA sous la tente Lot A avec tri SINUS',
        'Prise en charge de 6 polytraumatisés graves nécessitant intubation SMUR',
        'Armement d\'une cellule d\'accueil des familles et impliqués (CAI)',
        'Rotation continue de la noria de VPSP vers les centres hospitaliers universitaires'
      ],
      isDefault: true,
      enabled: true
    }
  ];

  window.ProtecScenariosManager = {
    DEFAULT_SCENARIOS,
    activeFilter: 'all',
    searchQuery: '',
    editingScenarioId: null,

    // Initialisation
    init() {
      this.ensureStorage();
    },

    ensureStorage() {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(OVERRIDES_KEY)) {
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify({}));
      }
    },

    getCustomScenarios() {
      this.ensureStorage();
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (e) {
        return [];
      }
    },

    getOverrides() {
      this.ensureStorage();
      try {
        return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {};
      } catch (e) {
        return {};
      }
    },

    // Récupérer l'ensemble des scénarios avec fusion des surcharges et personnalisés
    getAllScenarios(filterType = null, query = null) {
      const customList = this.getCustomScenarios();
      const overrides = this.getOverrides();

      // Fusionner les scénarios par défaut avec les éventuelles modifications enregistrées
      const mergedDefaults = DEFAULT_SCENARIOS.map(sc => {
        if (overrides[sc.id]) {
          return { ...sc, ...overrides[sc.id], isDefault: true, hasOverride: true };
        }
        return { ...sc, isDefault: true, hasOverride: false };
      });

      let all = [...mergedDefaults, ...customList];

      const fType = filterType || this.activeFilter;
      if (fType && fType !== 'all') {
        all = all.filter(sc => sc.type === fType);
      }

      const q = (query !== null ? query : this.searchQuery).toLowerCase().trim();
      if (q) {
        all = all.filter(sc => 
          (sc.title || '').toLowerCase().includes(q) ||
          (sc.desc || '').toLowerCase().includes(q) ||
          (sc.scale || '').toLowerCase().includes(q) ||
          (sc.category || '').toLowerCase().includes(q)
        );
      }

      return all;
    },

    getScenarioById(id) {
      const all = this.getAllScenarios('all', '');
      return all.find(s => s.id === id) || null;
    },

    // Enregistrer un scénario (création ou modification)
    saveScenario(data) {
      this.ensureStorage();
      const isNew = !data.id || data.id === 'new';
      const scenarioId = isNew ? `custom_${Date.now()}` : data.id;

      const cleanScenario = {
        id: scenarioId,
        type: data.type || 'dps',
        category: data.category || 'sport',
        scale: data.scale || (data.type === 'dps' ? 'DPS-PE' : (data.type === 'samu' ? 'Urgence SAMU' : 'Plan NOVI')),
        title: (data.title || 'Nouveau Scénario').trim(),
        desc: (data.desc || '').trim(),
        requiredVolunteers: Math.max(1, parseInt(data.requiredVolunteers, 10) || 2),
        requiredRanks: Array.isArray(data.requiredRanks) ? data.requiredRanks : ['PSE1'],
        requiredVehicles: Array.isArray(data.requiredVehicles) ? data.requiredVehicles : [],
        requiredLots: Array.isArray(data.requiredLots) ? data.requiredLots : [],
        durationHours: Math.max(0.5, parseFloat(data.durationHours) || 3.0),
        rewardMoney: Math.max(0, parseInt(data.rewardMoney, 10) || 300),
        rewardReputation: Math.max(0, parseInt(data.rewardReputation, 10) || 30),
        riskLevel: data.riskLevel || 'moyen',
        urgency: data.urgency || 'normale',
        environment: data.environment || 'ouvert_urbain',
        peripeties: Array.isArray(data.peripeties) ? data.peripeties.filter(p => p && p.trim()) : [],
        isCustom: !DEFAULT_SCENARIOS.some(d => d.id === scenarioId),
        enabled: data.enabled !== false,
        updatedAt: Date.now()
      };

      if (cleanScenario.isCustom) {
        // Scénario personnalisé créé par l'utilisateur
        const customList = this.getCustomScenarios();
        const existingIdx = customList.findIndex(s => s.id === scenarioId);
        if (existingIdx >= 0) {
          customList[existingIdx] = cleanScenario;
        } else {
          customList.unshift(cleanScenario);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
      } else {
        // Modification d'un scénario par défaut (stocké dans les overrides)
        const overrides = this.getOverrides();
        overrides[scenarioId] = cleanScenario;
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
      }

      return cleanScenario;
    },

    // Dupliquer un scénario
    duplicateScenario(id) {
      const src = this.getScenarioById(id);
      if (!src) return null;

      const duplicateData = {
        ...src,
        id: `custom_${Date.now()}`,
        title: `${src.title} (Copie)`,
        isCustom: true,
        isDefault: false,
        hasOverride: false
      };

      const customList = this.getCustomScenarios();
      customList.unshift(duplicateData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
      return duplicateData;
    },

    // Supprimer un scénario personnalisé
    deleteScenario(id) {
      const customList = this.getCustomScenarios().filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
    },

    // Rétablir un scénario par défaut à sa valeur d'origine
    resetDefaultScenario(id) {
      const overrides = this.getOverrides();
      if (overrides[id]) {
        delete overrides[id];
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
      }
    },

    // Réinitialiser l'ensemble des scénarios
    resetAllToDefault() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OVERRIDES_KEY);
      this.ensureStorage();
    },

    // =========================================================================
    // DÉCLENCHEMENT IMMÉDIAT EN JEU D'UN SCÉNARIO
    // =========================================================================
    triggerScenarioNow(game, scenarioId, stationId = null) {
      if (!game) game = window.game;
      if (!game) return false;

      const sc = this.getScenarioById(scenarioId);
      if (!sc) {
        if (game.showToast) game.showToast('Erreur Scénario', 'Scénario introuvable.', 'red');
        return false;
      }

      const st = stationId 
        ? (game.stations || []).find(s => s.id === stationId) 
        : (game.stations?.find(s => s.id === game.selectedStationId) || game.stations?.[0]);

      const now = Date.now();
      const locType = sc.type === 'crise' ? 'crise' : (sc.type === 'samu' ? 'urgences' : 'dps');
      const loc = game.calculateRealisticMissionLocation ? game.calculateRealisticMissionLocation(st, locType) : { lat: st?.lat || 48.8566, lng: st?.lng || 2.3522 };

      const durationSec = Math.round(sc.durationHours * 60); // 1h in-game = 60s
      const dept = st?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '54';

      const mission = {
        id: `scen-${sc.type}-${now}`,
        scenarioId: sc.id,
        title: sc.title,
        desc: sc.desc,
        type: sc.type === 'samu' ? 'samu' : (sc.type === 'crise' ? 'crise' : 'dps'),
        isCrisis: sc.type === 'crise',
        scale: sc.scale,
        category: sc.category,
        urgency: sc.urgency,
        riskLevel: sc.riskLevel,
        environment: sc.environment,
        lat: loc.lat,
        lng: loc.lng,
        departmentCode: dept,
        stationId: st?.id || 'default',
        stationName: st?.name || 'Antenne Principale',
        address: game.generateRealisticStreetAddress ? game.generateRealisticStreetAddress(st?.city || 'Secteur Antenne', loc.lat, loc.lng) : `Secteur ${st?.city || 'Opérationnel'}`,
        requiredVolunteers: sc.requiredVolunteers,
        requiredRanks: sc.requiredRanks,
        requiredVehicles: sc.requiredVehicles,
        requiredLots: sc.requiredLots || [],
        rewardMoney: sc.rewardMoney,
        rewardReputation: sc.rewardReputation,
        durationSeconds: durationSec,
        durationHours: sc.durationHours.toString(),
        eventDate: { ...(game.clock || { hours: 14, minutes: 0, day: 1, month: 1 }) },
        status: sc.type === 'samu' || sc.type === 'crise' ? 'declenche' : 'planifie',
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] },
        peripeties: sc.peripeties || [],
        isScenarioTriggered: true
      };

      if (!Array.isArray(game.missions)) game.missions = [];
      game.missions.unshift(mission);

      // Traitements spécifiques selon le type
      if (sc.type === 'samu') {
        if (window.ProtecAudio && typeof window.ProtecAudio.playRadioBeep === 'function') {
          window.ProtecAudio.playRadioBeep();
        }
        if (window.ProtecNotifications && typeof window.ProtecNotifications.notifyCategory === 'function') {
          window.ProtecNotifications.notifyCategory(
            'urgences',
            '🚨 Réquisition SAMU 15 Déclenchée !',
            `${sc.title} : départ réflexe VPSP immédiat demandé par la régulation 15.`,
            `samu-notif-${mission.id}`
          );
        }
      } else if (sc.type === 'crise') {
        if (window.ProtecCriseLogistique && typeof window.ProtecCriseLogistique.initMissionOperationalLog === 'function') {
          window.ProtecCriseLogistique.initMissionOperationalLog(mission);
        }
        if (window.ProtecNotifications && typeof window.ProtecNotifications.notifyCategory === 'function') {
          window.ProtecNotifications.notifyCategory(
            'crise',
            '⚠️ Plan d\'Alerte Majeure / NOVI !',
            `${sc.title} activé sur le département ${dept}.`,
            `crise-notif-${mission.id}`
          );
        }
      } else {
        if (window.ProtecNotifications && typeof window.ProtecNotifications.notifyCategory === 'function') {
          window.ProtecNotifications.notifyCategory(
            'dps',
            '📋 Nouveau DPS Prêt à l\'Engagement',
            `${sc.title} a été injecté dans le planning de votre antenne.`,
            `dps-notif-${mission.id}`
          );
        }
      }

      game.renderMissions?.();
      game.updateStatsUI?.();
      game.saveGame?.();

      if (game.showToast) {
        const typeBadge = sc.type === 'samu' ? '🚑 SAMU 15' : (sc.type === 'crise' ? '🚨 CRISE NOVI' : '📋 DPS');
        game.showToast(
          `${typeBadge} Déclenché avec Succès !`,
          `« ${sc.title} » est disponible en direct sur la carte et dans vos missions.`,
          sc.type === 'crise' ? 'red' : (sc.type === 'samu' ? 'amber' : 'green')
        );
      }

      return true;
    },

    // =========================================================================
    // RENDU DE L'INTERFACE ADMIN (GESTIONNAIRE & ÉDITEUR DE SCÉNARIOS)
    // =========================================================================
    renderAdminView(container, game) {
      if (!container) return;
      if (!game) game = window.game;

      const allScenarios = this.getAllScenarios();
      const countTotal = allScenarios.length;
      const countDPS = allScenarios.filter(s => s.type === 'dps').length;
      const countSAMU = allScenarios.filter(s => s.type === 'samu').length;
      const countCrise = allScenarios.filter(s => s.type === 'crise').length;
      const countCustom = allScenarios.filter(s => s.isCustom).length;

      const isEditing = Boolean(this.editingScenarioId);
      const editingScenario = isEditing 
        ? (this.editingScenarioId === 'new' ? this.getEmptyScenarioTemplate() : this.getScenarioById(this.editingScenarioId))
        : null;

      container.innerHTML = `
        <div class="space-y-4">

          <!-- BANDEAU D'EN-TÊTE DU GESTIONNAIRE -->
          <div class="p-4 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white shadow-md border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">🎭</span>
                <h3 class="text-sm font-black uppercase tracking-wider text-indigo-200">Gestionnaire & Éditeur de Scénarios Opérationnels</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  DPS • SAMU 15 • Crises NOVI
                </span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Créez, personnalisez, clonez et paramétrez vos scénarios d'intervention. Ajustez les effectifs réglementaires, les véhicules, les péripéties et déclenchez-les en jeu en un clic.
              </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <button onclick="window.ProtecScenariosManager.openEditor('new')" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer">
                <span>➕ Créer un Scénario</span>
              </button>
              <button onclick="window.ProtecScenariosManager.promptResetAll()" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-700" title="Rétablir les scénarios par défaut">
                <span>↺ Réinitialiser Tout</span>
              </button>
            </div>
          </div>

          <!-- FORMULAIRE D'ÉDITION / CRÉATION (AFFICHÉ SI MODE ÉDITION ACTIF) -->
          ${isEditing && editingScenario ? `
            <div id="scenario-editor-box" class="p-4 sm:p-5 rounded-3xl bg-white border-2 border-indigo-500 shadow-xl space-y-4 animate-in fade-in duration-200">
              <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                <div class="flex items-center gap-2">
                  <span class="text-lg">${editingScenario.id.startsWith('custom_') || editingScenario.id === 'new' ? '✨' : '✏️'}</span>
                  <h4 class="text-xs font-black text-slate-900 uppercase">
                    ${editingScenario.id === 'new' ? 'Création d’un Nouveau Scénario' : `Édition : « ${editingScenario.title} »`}
                  </h4>
                  <span class="px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${editingScenario.type === 'crise' ? 'bg-red-100 text-red-800' : (editingScenario.type === 'samu' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900')}">
                    ${editingScenario.type.toUpperCase()}
                  </span>
                </div>
                <button onclick="window.ProtecScenariosManager.closeEditor()" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs transition">
                  ✕ Fermer
                </button>
              </div>

              <form onsubmit="window.ProtecScenariosManager.handleSaveForm(event)" class="space-y-3.5">
                <input type="hidden" id="scen-edit-id" value="${editingScenario.id}" />

                <!-- Ligne 1 : Titre & Type -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="sm:col-span-2">
                    <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">Titre du Scénario :</label>
                    <input type="text" id="scen-edit-title" value="${editingScenario.title || ''}" required placeholder="Ex: Match de Rugby d'Élite / Alerte Canicule" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">Type d'Opération :</label>
                    <select id="scen-edit-type" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-black text-slate-800 focus:ring-2 focus:ring-indigo-500">
                      <option value="dps" ${editingScenario.type === 'dps' ? 'selected' : ''}>📋 Dispositif Prévisionnel (DPS)</option>
                      <option value="samu" ${editingScenario.type === 'samu' ? 'selected' : ''}>🚑 Urgence / SAMU 15</option>
                      <option value="crise" ${editingScenario.type === 'crise' ? 'selected' : ''}>🚨 Crise Majeure / NOVI</option>
                    </select>
                  </div>
                </div>

                <!-- Ligne 2 : Description & Échelle -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div class="sm:col-span-2">
                    <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">Description Opérationnelle :</label>
                    <input type="text" id="scen-edit-desc" value="${editingScenario.desc || ''}" placeholder="Contexte, risques identifiés et mission des secouristes..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">Échelle & Format :</label>
                    <input type="text" id="scen-edit-scale" value="${editingScenario.scale || ''}" placeholder="Ex: DPS-PE, PAPS, PLAN NOVI..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <!-- Ligne 3 : Effectifs, Véhicules, Durée, Budget -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">👥 Secouristes Requis :</label>
                    <input type="number" id="scen-edit-volunteers" min="1" max="50" value="${editingScenario.requiredVolunteers || 4}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-black text-slate-800" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">⏱️ Durée (Heures) :</label>
                    <input type="number" step="0.5" id="scen-edit-duration" min="0.5" max="72" value="${editingScenario.durationHours || 4}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-black text-slate-800" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">💶 Rémunération (€) :</label>
                    <input type="number" id="scen-edit-reward" min="0" step="10" value="${editingScenario.rewardMoney || 400}" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-black text-emerald-700" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase text-slate-600 mb-1">⚠️ Niveau de Risque :</label>
                    <select id="scen-edit-risk" class="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800">
                      <option value="faible" ${editingScenario.riskLevel === 'faible' ? 'selected' : ''}>Faible (Vert)</option>
                      <option value="moyen" ${editingScenario.riskLevel === 'moyen' ? 'selected' : ''}>Moyen (Bleu/Orange)</option>
                      <option value="eleve" ${editingScenario.riskLevel === 'eleve' ? 'selected' : ''}>Élevé (Orange)</option>
                      <option value="critique" ${editingScenario.riskLevel === 'critique' ? 'selected' : ''}>Critique (Rouge)</option>
                    </select>
                  </div>
                </div>

                <!-- Ligne 4 : Véhicules & Lots Requis -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1.5">
                    <label class="block text-[10px] font-black uppercase text-slate-600">🚑 Véhicules Obligatoires (Cochez) :</label>
                    <div class="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                      ${['VPSP', 'VTU', 'VL', 'Minibus', 'Quad', 'Vélo'].map(vType => {
                        const checked = (editingScenario.requiredVehicles || []).includes(vType);
                        return `
                          <label class="p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${checked ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-white border-slate-200 text-slate-700'}">
                            <input type="checkbox" name="scen-veh" value="${vType}" ${checked ? 'checked' : ''} class="rounded text-indigo-600" />
                            <span>${vType}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <label class="block text-[10px] font-black uppercase text-slate-600">📦 Matériels & Lots Requis :</label>
                    <div class="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                      ${[
                        { id: 'lot_secours_a', label: 'Lot A (Tente & Soins)' },
                        { id: 'lot_secours_b', label: 'Lot B (Urgence VPSP)' },
                        { id: 'lot_secours_c', label: 'Lot C (Brancardage)' },
                        { id: 'caisse_rearmement', label: 'Kit Réarmement (3x)' }
                      ].map(l => {
                        const checked = (editingScenario.requiredLots || []).includes(l.id);
                        return `
                          <label class="p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${checked ? 'bg-orange-50 border-orange-400 text-orange-950' : 'bg-white border-slate-200 text-slate-700'}">
                            <input type="checkbox" name="scen-lot" value="${l.id}" ${checked ? 'checked' : ''} class="rounded text-orange-600" />
                            <span>${l.label}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>

                <!-- Ligne 5 : Péripéties & Incidents de parcours -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label class="block text-[10px] font-black uppercase text-slate-600">⚡ Péripéties & Incidents possibles en mission :</label>
                    <button type="button" onclick="window.ProtecScenariosManager.addPeripetieInput()" class="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                      <span>+ Ajouter un incident</span>
                    </button>
                  </div>
                  <div id="scen-peripeties-container" class="space-y-1.5">
                    ${(editingScenario.peripeties || []).map((p, idx) => `
                      <div class="flex items-center gap-2">
                        <input type="text" name="scen-peripetie" value="${p.replace(/"/g, '&quot;')}" placeholder="Incident ou événement survenant pendant l'intervention..." class="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800" />
                        <button type="button" onclick="this.parentElement.remove()" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition" title="Supprimer">✕</button>
                      </div>
                    `).join('')}
                    ${(!editingScenario.peripeties || editingScenario.peripeties.length === 0) ? `
                      <div class="flex items-center gap-2">
                        <input type="text" name="scen-peripetie" value="" placeholder="Ex: Malaise d'un spectateur avec évacuation VPSP..." class="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800" />
                        <button type="button" onclick="this.parentElement.remove()" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition">✕</button>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Boutons d'action du formulaire -->
                <div class="flex items-center justify-between pt-2 border-t border-slate-200">
                  <button type="button" onclick="window.ProtecScenariosManager.closeEditor()" class="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition">
                    Annuler
                  </button>
                  <div class="flex items-center gap-2">
                    <button type="submit" class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition cursor-pointer">
                      💾 Enregistrer le Scénario
                    </button>
                    <button type="button" onclick="window.ProtecScenariosManager.handleSaveAndTrigger(event)" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                      <span>▶ Enregistrer & Déclencher</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ` : ''}

          <!-- FILTRES & BARRE DE RECHERCHE -->
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button onclick="window.ProtecScenariosManager.setFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${this.activeFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}">
                Tous (${countTotal})
              </button>
              <button onclick="window.ProtecScenariosManager.setFilter('dps')" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${this.activeFilter === 'dps' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-blue-900 hover:bg-blue-50 border border-slate-200'}">
                📋 DPS (${countDPS})
              </button>
              <button onclick="window.ProtecScenariosManager.setFilter('samu')" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${this.activeFilter === 'samu' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-amber-900 hover:bg-amber-50 border border-slate-200'}">
                🚑 SAMU 15 (${countSAMU})
              </button>
              <button onclick="window.ProtecScenariosManager.setFilter('crise')" class="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${this.activeFilter === 'crise' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-rose-900 hover:bg-rose-50 border border-slate-200'}">
                🚨 Crises & NOVI (${countCrise})
              </button>
              ${countCustom > 0 ? `
                <span class="px-2 py-1 rounded-xl bg-purple-100 text-purple-900 text-[10px] font-black border border-purple-200">
                  ⭐ ${countCustom} personnalisé(s)
                </span>
              ` : ''}
            </div>

            <div class="relative w-full sm:w-64 flex-shrink-0">
              <input type="text" value="${this.searchQuery}" oninput="window.ProtecScenariosManager.setSearch(this.value)" placeholder="Rechercher un scénario..." class="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <!-- GRILLE DES SCÉNARIOS -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${allScenarios.map(sc => {
              const isCrise = sc.type === 'crise';
              const isSamu = sc.type === 'samu';
              const badgeBg = isCrise ? 'bg-red-50 text-red-800 border-red-200' : (isSamu ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200');

              return `
                <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400/80 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-3 group">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded text-[9.5px] font-black uppercase border ${badgeBg}">
                          ${isCrise ? '🚨 CRISE' : (isSamu ? '🚑 SAMU 15' : '📋 DPS')}
                        </span>
                        <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                          ${sc.scale || sc.category}
                        </span>
                        ${sc.isCustom ? `
                          <span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                            Perso ⭐
                          </span>
                        ` : ''}
                      </div>

                      <div class="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                        <button onclick="window.ProtecScenariosManager.openEditor('${sc.id}')" class="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition" title="Modifier le scénario">
                          ✏️
                        </button>
                        <button onclick="window.ProtecScenariosManager.handleDuplicate('${sc.id}')" class="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition" title="Dupliquer">
                          📋
                        </button>
                        ${sc.isCustom ? `
                          <button onclick="window.ProtecScenariosManager.handleDelete('${sc.id}')" class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition" title="Supprimer">
                            🗑️
                          </button>
                        ` : (sc.hasOverride ? `
                          <button onclick="window.ProtecScenariosManager.handleResetOne('${sc.id}')" class="p-1 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition" title="Rétablir valeur d'origine">
                            ↺
                          </button>
                        ` : '')}
                      </div>
                    </div>

                    <h4 class="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      ${sc.title}
                    </h4>
                    <p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      ${sc.desc || ''}
                    </p>

                    <!-- Spécifications : Effectifs, Véhicules, Durée, Budget -->
                    <div class="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-semibold text-slate-600">
                      <div class="flex items-center gap-1">
                        <span>👥</span>
                        <span><strong>${sc.requiredVolunteers}</strong> secouriste(s)</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <span>⏱️</span>
                        <span><strong>${sc.durationHours}h</strong> de mission</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <span>🚑</span>
                        <span class="truncate">${(sc.requiredVehicles && sc.requiredVehicles.length > 0) ? sc.requiredVehicles.join(', ') : 'À pied (PAPS)'}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <span>💶</span>
                        <span class="text-emerald-700 font-bold font-mono">+${(sc.rewardMoney || 0).toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>

                    <!-- Péripéties résumées -->
                    ${(sc.peripeties && sc.peripeties.length > 0) ? `
                      <div class="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-600 space-y-0.5">
                        <span class="font-bold text-slate-700 block">⚡ Incidents prévus (${sc.peripeties.length}) :</span>
                        <p class="italic text-[9.5px] truncate text-slate-500">• ${sc.peripeties[0]}</p>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Bouton Déclenchement -->
                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span class="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">
                      ${sc.riskLevel === 'critique' ? '🔴 Risque Critique' : (sc.riskLevel === 'eleve' ? '🟠 Risque Élevé' : '🟢 Risque Normal')}
                    </span>
                    <button onclick="window.ProtecScenariosManager.triggerScenarioNow(window.game, '${sc.id}')" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black transition flex items-center gap-1 shadow-xs cursor-pointer">
                      <span>▶ Déclencher</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          ${allScenarios.length === 0 ? `
            <div class="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-2">
              <span class="text-3xl block">🔍</span>
              <h4 class="text-xs font-black text-slate-700">Aucun scénario ne correspond à votre recherche.</h4>
              <p class="text-[11px] text-slate-400">Modifiez vos mots-clés ou créez un nouveau scénario personnalisé.</p>
            </div>
          ` : ''}

        </div>
      `;
    },

    getEmptyScenarioTemplate() {
      return {
        id: 'new',
        type: this.activeFilter !== 'all' ? this.activeFilter : 'dps',
        category: 'sport',
        scale: 'DPS-PE',
        title: '',
        desc: '',
        requiredVolunteers: 4,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP'],
        requiredLots: ['lot_secours_b'],
        durationHours: 4.0,
        rewardMoney: 450,
        rewardReputation: 35,
        riskLevel: 'moyen',
        urgency: 'normale',
        environment: 'ouvert_urbain',
        peripeties: ['Malaise d\'un participant avec prise en charge sous oxygène']
      };
    },

    openEditor(scenarioId) {
      this.editingScenarioId = scenarioId;
      this.refreshAdminUI();
      // Scroll vers l'éditeur
      setTimeout(() => {
        const box = document.getElementById('scenario-editor-box');
        if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    },

    closeEditor() {
      this.editingScenarioId = null;
      this.refreshAdminUI();
    },

    setFilter(type) {
      this.activeFilter = type;
      this.refreshAdminUI();
    },

    setSearch(q) {
      this.searchQuery = q || '';
      this.refreshAdminUI();
    },

    addPeripetieInput() {
      const container = document.getElementById('scen-peripeties-container');
      if (!container) return;
      const div = document.createElement('div');
      div.className = 'flex items-center gap-2';
      div.innerHTML = `
        <input type="text" name="scen-peripetie" value="" placeholder="Nouvel incident ou péripétie en cours d'intervention..." class="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800" />
        <button type="button" onclick="this.parentElement.remove()" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition">✕</button>
      `;
      container.appendChild(div);
      const input = div.querySelector('input');
      if (input) input.focus();
    },

    handleSaveForm(e) {
      if (e) e.preventDefault();
      const id = document.getElementById('scen-edit-id')?.value || 'new';
      const title = document.getElementById('scen-edit-title')?.value || 'Sans titre';
      const type = document.getElementById('scen-edit-type')?.value || 'dps';
      const desc = document.getElementById('scen-edit-desc')?.value || '';
      const scale = document.getElementById('scen-edit-scale')?.value || '';
      const volunteers = parseInt(document.getElementById('scen-edit-volunteers')?.value, 10) || 4;
      const duration = parseFloat(document.getElementById('scen-edit-duration')?.value) || 4;
      const reward = parseInt(document.getElementById('scen-edit-reward')?.value, 10) || 400;
      const risk = document.getElementById('scen-edit-risk')?.value || 'moyen';

      const vehNodes = document.querySelectorAll('input[name="scen-veh"]:checked');
      const vehicles = Array.from(vehNodes).map(n => n.value);

      const lotNodes = document.querySelectorAll('input[name="scen-lot"]:checked');
      const lots = Array.from(lotNodes).map(n => n.value);

      const peripetieNodes = document.querySelectorAll('input[name="scen-peripetie"]');
      const peripeties = Array.from(peripetieNodes).map(n => n.value).filter(v => v && v.trim());

      const saved = this.saveScenario({
        id,
        title,
        type,
        desc,
        scale,
        requiredVolunteers: volunteers,
        durationHours: duration,
        rewardMoney: reward,
        riskLevel: risk,
        requiredVehicles: vehicles,
        requiredLots: lots,
        peripeties
      });

      this.closeEditor();
      if (window.game?.showToast) {
        window.game.showToast('Scénario Enregistré ✓', `« ${saved.title} » a été mis à jour avec succès.`, 'green');
      }
      return saved;
    },

    handleSaveAndTrigger(e) {
      const saved = this.handleSaveForm(e);
      if (saved && window.game) {
        this.triggerScenarioNow(window.game, saved.id);
      }
    },

    handleDuplicate(id) {
      const dup = this.duplicateScenario(id);
      this.refreshAdminUI();
      if (dup && window.game?.showToast) {
        window.game.showToast('Scénario Dupliqué', `Copie créée : « ${dup.title} ».`, 'blue');
      }
    },

    handleDelete(id) {
      if (confirm('Voulez-vous vraiment supprimer définitivement ce scénario personnalisé ?')) {
        this.deleteScenario(id);
        this.refreshAdminUI();
        if (window.game?.showToast) {
          window.game.showToast('Scénario Supprimé', 'Le scénario a été retiré de votre liste.', 'slate');
        }
      }
    },

    handleResetOne(id) {
      if (confirm('Rétablir ce scénario à sa configuration officielle d\'origine ?')) {
        this.resetDefaultScenario(id);
        this.refreshAdminUI();
      }
    },

    promptResetAll() {
      if (confirm('Attention : réinitialiser l\'ensemble des scénarios par défaut et supprimer les scénarios personnalisés ?')) {
        this.resetAllToDefault();
        this.editingScenarioId = null;
        this.refreshAdminUI();
        if (window.game?.showToast) {
          window.game.showToast('Scénarios Réinitialisés', 'Le catalogue officiel a été restauré.', 'blue');
        }
      }
    },

    refreshAdminUI() {
      const container = document.getElementById('admin-view-scenarios');
      if (container) {
        this.renderAdminView(container, window.game);
      }
    },

    openManager() {
      if (window.ProtecAdmin) {
        if (!window.ProtecAdmin.isCurrentUserAdmin() && !window.ProtecAdmin.isCurrentUserGestionnaireOnly()) {
          if (window.game?.player) {
            window.game.player.isAdmin = true;
          }
          localStorage.setItem('protec_admin_auth', 'true');
        }
        window.ProtecAdmin.openAdminModal(window.game);
        window.ProtecAdmin.switchTab('scenarios');
      }
    }
  };

  // Initialisation au chargement
  document.addEventListener('DOMContentLoaded', () => {
    window.ProtecScenariosManager.init();
  });
})();
