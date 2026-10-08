/**
 * PROTEC LIVE - SYSTÈMES AVANCÉS :
 * 1. Récompenses quotidiennes & Défis hebdomadaires
 * 2. Aménagement intérieur & Évolution du local de l'antenne (Pièces & Améliorations)
 * 3. Véhicules spécialisés (VPSP, VTU, VLM, VPC, Canot Nautique BLS, Quad/VTT)
 * 4. Arbre de compétences des bénévoles & Bureau d'antenne
 * 5. Manœuvres multijoueurs & Exercices inter-alliances
 */

window.ProtecAdvanced = {
  // --- CATALOGUE DES VÉHICULES ÉTENDU ---
  vehicleCatalog: [
    {
      type: 'VPSP',
      name: 'Véhicule de Premiers Secours à Personnes (VPSP)',
      category: 'Secours d’Urgence',
      desc: 'Cellule sanitaire grand volume (brancard, O2, DAE, matériel pédiatrique & d’urgence) aux normes EN 1789.',
      cost: 28500,
      capacity: 5,
      image: 'images/vehicles/VPSP.png',
      icon: '🚑',
      speedKmH: 85,
      specialty: 'Transport Sanitaire & SAMU 15'
    },
    {
      type: 'VL',
      name: 'Véhicule de Liaison (VL)',
      category: 'Reconnaissance Rapide',
      desc: 'Véhicule léger avec rampe lumineuse, équipement radio et crochet d’attelage pour reconnaissance, commandement et remorquage.',
      cost: 11500,
      capacity: 4,
      hasTowHitch: true,
      image: 'images/vehicles/VL.png',
      icon: '🚗',
      speedKmH: 100,
      specialty: 'Reconnaissance & Commandement'
    },
    {
      type: 'VLHR',
      name: 'Véhicule Léger Hors Route (VLHR 4x4)',
      category: 'Tout-Terrain',
      desc: '4x4 d’intervention tout-terrain pour zones accidentées, massifs forestiers, franchissement et remorquage lourd.',
      cost: 19500,
      capacity: 4,
      hasTowHitch: true,
      image: 'images/vehicles/VLHR.png',
      icon: '🚙',
      speedKmH: 90,
      specialty: 'Accès Tout-Terrain & Crues'
    },
    {
      type: 'VTU',
      name: 'Véhicule Tout Usage (VTU)',
      category: 'Logistique & Événementiel',
      desc: 'Fourgon utilitaire polyvalent pour transport de tentes, lits de camp, barnums et matériel de poste de secours. Équipé d’un crochet d’attelage.',
      cost: 17500,
      capacity: 3,
      hasTowHitch: true,
      image: 'images/vehicles/VTU.png',
      icon: '🚐',
      speedKmH: 75,
      specialty: 'Logistique & Ravitaillement'
    },
    {
      type: 'VTP',
      name: 'Transport de Personnel (VTP)',
      category: 'Transport d’Équipes',
      desc: 'Minibus 9 places pour l’acheminement des équipiers et relèves de secours sur les grands dispositifs ou renforts distants.',
      cost: 21000,
      capacity: 9,
      image: 'images/vehicles/VTP.png',
      icon: '🚌',
      speedKmH: 85,
      specialty: 'Acheminement de Renforts'
    },
    {
      type: 'PCM',
      name: 'Poste de Commandement Mobile (PCM)',
      category: 'Commandement Lourd',
      desc: 'Centre opérationnel mobile avec baie informatique, transmission radio VHF/UHF, satellite et espace de coordination de crise.',
      cost: 45000,
      capacity: 3,
      image: 'images/vehicles/PCM.png',
      icon: '🚍',
      speedKmH: 65,
      specialty: 'Coordination Grands Événements & NOVI'
    },
    {
      type: 'VAHU',
      name: 'VAHU - Véhicule d\'Accueil et d\'Hébergement d\'Urgence',
      category: 'Action Sociale & Accueil',
      desc: 'Aménagé pour l’accueil des impliqués, maraudes sociales hivernales, distribution de repas chauds, kits d’hygiène et écoute sociale.',
      cost: 16000,
      capacity: 3,
      image: 'images/vehicles/VAHU.png',
      icon: '☕',
      speedKmH: 70,
      specialty: 'Maraudes & Accueil d\'Urgence'
    },
    {
      type: 'FLIT',
      name: 'FLIT - Fourgon Lourd d\'Intervention Technique',
      category: 'Technique & Soutien',
      desc: 'Fourgon lourd équipé pour le montage rapide de Poste Médical Avancé (PMA), groupes électrogènes, mâts d’éclairage et pompes d’épuisement.',
      cost: 26000,
      capacity: 3,
      image: 'images/vehicles/FLIT.png',
      icon: '🏗️',
      speedKmH: 70,
      specialty: 'Postes Médicaux Avancés & Crises'
    },
    {
      type: 'VCYN',
      name: 'Véhicule Cynotechnique (VCYN)',
      category: 'USAR / Cyno',
      desc: 'Fourgon cynotechnique USAR adapté avec boxes intégrés pour 2 chiens de recherche et sauvetage en décombres et quête.',
      cost: 22500,
      capacity: 3,
      extraCapacityLabel: '+ 2 places chiens (box USAR)',
      image: 'images/vehicles/VCYN.png',
      icon: '🐕',
      speedKmH: 80,
      specialty: 'Recherche & Sauvetage USAR / Cyno'
    },
    {
      type: 'ERS',
      name: 'ERS - Embarcation de Reconnaissance et de Sauvetage',
      category: 'Sauvetage Aquatique (SSA)',
      desc: 'Embarcation de reconnaissance et de sauvetage motorisée (4 places). Attention : se déplace uniquement sur remorque avec un véhicule doté d’un attelage (VL, VTU). Qualifications : SSA et Permis/Conduite Bateau.',
      cost: 13500,
      capacity: 4,
      requiresTrailer: true,
      reqSkills: ['ssa', 'permis_bateau'],
      image: 'images/vehicles/ERS.png',
      icon: '🚤',
      speedKmH: 45,
      specialty: 'Sauvetage Aquatique (SSA & Conduite Bateau)'
    },
    {
      type: 'MPS',
      name: 'MPS - Moto de Premiers Secours',
      category: 'Vecteur Rapide',
      desc: 'Moto de premiers secours (2 places) pour fendre les embouteillages urbains et assurer un premier bilan médical en temps record.',
      cost: 8500,
      capacity: 2,
      image: 'images/vehicles/Moto.png',
      icon: '🏍️',
      speedKmH: 110,
      specialty: 'Intervention Express Trafic Dense'
    },
    {
      type: 'QUAD',
      name: 'Quad Tout-Terrain d’Intervention',
      category: 'Tout-Terrain Agile',
      desc: 'Quad tout-terrain d’intervention pour parcs, festivals géants et sentiers étroits. Attention : se déplace uniquement sur remorque avec un véhicule doté d’un attelage.',
      cost: 7200,
      capacity: 2,
      requiresTrailer: true,
      image: 'images/vehicles/QUAD.png',
      icon: '🚜',
      speedKmH: 50,
      specialty: 'Évacuation Hors Pistes (Remorque Requise)'
    },
    {
      type: 'VTD',
      name: 'Véhicule Technique Déblaiement (USAR)',
      category: 'Sauvetage Déblaiement (USAR)',
      desc: 'Véhicule d’appui USAR transportant l’outillage lourd de déblaiement, étaiement et matériel de recherche sous décombres lors d’effondrements ou catastrophes.',
      cost: 14000,
      capacity: 3,
      image: 'images/vehicles/VTD.png',
      icon: '⛏️',
      speedKmH: 85,
      specialty: 'Sauvetage Déblaiement & USAR'
    },
    {
      type: 'VELO',
      name: 'Binôme Vélo / VTT Premiers Secours',
      category: 'Dispositif Mobile',
      desc: 'Vélos équipés de sacoches d’urgence et DAE pour patrouilles mobiles sur courses à pied et berges.',
      cost: 2500,
      capacity: 2,
      image: 'images/vehicles/VELO.png',
      icon: '🚲',
      speedKmH: 25,
      specialty: 'Patrouilles & Parcs'
    },
    {
      type: 'VST',
      name: 'Véhicule de Soutien Technique (VST)',
      category: 'Soutien & Énergie',
      desc: 'Logistique électrique de pointe, compresseur et assistance mécanique pour opérations de longue durée.',
      cost: 19000,
      capacity: 2,
      image: 'images/vehicles/VST.png',
      icon: '⚡',
      speedKmH: 70,
      specialty: 'Autonomie Opérationnelle'
    },
    {
      type: 'REM',
      name: 'Remorque Lot PMA & Éclairage',
      category: 'Remorque Spécialisée',
      desc: 'Remorque équipée d’un groupe électrogène haute puissance, tente gonflable et mâts d’éclairage nocturne. Se déplace tractée par un véhicule avec attelage.',
      cost: 4900,
      capacity: 0,
      requiresTrailer: true,
      image: 'images/vehicles/REM.png',
      icon: '📦',
      speedKmH: 70,
      specialty: 'Éclairage & PMA Mobile'
    }
  ],

  // --- CATALOGUE DES AMÉNAGEMENTS DE LOCAUX ---
  roomUpgrades: {
    garage: [
      { level: 1, name: 'Garage Basique', desc: 'Capacité : 2 véhicules sous abri.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Hangar Agrandie & Borne Électrique', desc: 'Capacité : 4 véhicules. Rechargement rapide des batteries.', cost: 1500, bonus: '+2 places de parking' },
      { level: 3, name: 'Atelier Mécanique Intégré', desc: 'Capacité : 8 véhicules. -50% sur tous les frais d’entretien et révisions.', cost: 3200, bonus: '-50% coûts garage' }
    ],
    pharmacie: [
      { level: 1, name: 'Armoire Médicale Standard', desc: 'Stockage basique des consommables.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Compresseur Médical O2', desc: 'Permet de recharger l’Oxygène B5 à moitié prix directement à l’antenne.', cost: 1200, bonus: '-50% coût Oxygène' },
      { level: 3, name: 'Réserve Catastrophe & Lots PMA', desc: 'Capacité de stockage doublée pour le matériel d’urgence.', cost: 2400, bonus: 'Bonus +30% réputation NOVI' }
    ],
    foyer: [
      { level: 1, name: 'Salle de Repos Simple', desc: 'Quelques chaises et une table.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Foyer Convivial & Cafétéria', desc: 'Canapés confortables, cafetière. Récupération d’énergie +50% plus rapide.', cost: 800, bonus: '+50% régénération fatigue' },
      { level: 3, name: 'Dortoir de Garde Équipé', desc: 'Lits individuels pour les gardes SAMU de 12h de nuit.', cost: 1800, bonus: 'Moral permanent +15%' }
    ],
    formation: [
      { level: 1, name: 'Salle de Réunion', desc: 'Réunions d’antenne et briefings.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Espace Pédagogique PSC1', desc: 'Mannequins connectés QCPR et projecteur. Génère des cours grand public payants.', cost: 950, bonus: '+250 € / semaine (cours PSC1)' },
      { level: 3, name: 'Centre Pédagogique Agréé', desc: 'Agrément préfectoral pour formations entreprises SST & PSC1.', cost: 2100, bonus: '+650 € / semaine automatique' }
    ],
    radio: [
      { level: 1, name: 'Poste Radio VHF', desc: 'Talkies-walkies analogiques.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Répéteur Antenne de Toit', desc: 'Couverture radio totale sur tout le département.', cost: 700, bonus: 'Départ véhicules accéléré' }
    ]
  },

  // --- CATALOGUE DES COMPÉTENCES INDIVIDUELLES DES BÉNÉVOLES ---
  skillsList: [
    { id: 'pilotage', name: 'Conduite Urgence & Gyrophares', icon: '🚑', xpRequired: 30, desc: 'Permet de conduire le VPSP et VPC en intervention prioritaire.' },
    { id: 'radio', name: 'Opérateur Radio & PC', icon: '📻', xpRequired: 20, desc: 'Maîtrise parfaite des procédures SAMU 15 et transmissions CODIS.' },
    { id: 'nautique', name: 'Sauvetage Aquatique & Fleuve', icon: '🏊', xpRequired: 40, desc: 'Habilitation pour embarcation BLS sur fleuve et zones inondées.' },
    { id: 'communication', name: 'Communication & Médias (Photo/Vidéo)', icon: '📸', xpRequired: 25, desc: 'Photographe / Vidéaste d’antenne valorisant les interventions (+dons et candidatures).' },
    
    // Filière Spécialités Opérationnelles (Nautique, USAR, Cyno)
    { id: 'ssa', name: 'Surveillance & Sauvetage Aquatique (SSA)', icon: '🏊', xpRequired: 40, desc: 'Habilitation officielle SSA pour le sauvetage en eaux intérieures et zones inondées.' },
    { id: 'permis_bateau', name: 'Permis Bateau & Conduite ERS', icon: '🚤', xpRequired: 35, desc: 'Habilitation de pilotage et conduite de l’embarcation de reconnaissance et sauvetage (ERS).' },
    { id: 'usar', name: 'Sauvetage Déblaiement (USAR)', icon: '⛏️', xpRequired: 45, desc: 'Intervention sur effondrements, sécurisation, étaiement et recherche de victimes.' },
    { id: 'cyno', name: 'Conducteur Cynotechnique USAR', icon: '🐕', xpRequired: 50, reqSkill: 'usar', desc: 'Maître-chien de recherche et sauvetage en décombres et quête de disparus.' },
    
    // Filière Aide & Écoute Psychologique (AEP)
    { id: 'aep1', name: 'Aide & Écoute Psychologique 1 (AEP1)', icon: '🧠', xpRequired: 25, desc: 'Sensibilisation à l’AEP : posture d’écoute active, réconfort immédiat des impliqués et premiers secours émotionnels.' },
    { id: 'aep2', name: 'Aide & Écoute Psychologique 2 (AEP2)', icon: '🫂', xpRequired: 45, reqSkill: 'aep1', desc: 'Prise en charge approfondie : deuil traumatique, defusing post-mission (réduit la fatigue équipage de 50%) et CAI en crise NOVI.' },
    
    // Filière Pédagogique & Formateurs Officiels (formations.protection-civile.org)
    { id: 'formateur_psc', name: 'Formateur PSC (avec PIC F)', icon: '🎓', xpRequired: 35, desc: 'Pédagogie Initiale & Commune de Formateur. Habilité à certifier le grand public aux Gestes Qui Sauvent (GQS) et PSC1.' },
    { id: 'formateur_ps', name: 'Formateur PS (Premiers Secours)', icon: '🚑', xpRequired: 45, reqSkill: 'formateur_psc', desc: 'Habilité à former les équipiers secouristes opérationnels aux diplômes PSE1 et PSE2.' },
    { id: 'formateur_sst', name: 'Formateur SST (Secourisme Travail)', icon: '💼', xpRequired: 40, desc: 'Habilitation INRS pour animer les formations de Sauveteur Secouriste du Travail en entreprises.' },
    { id: 'formateur_aep', name: 'Formateur AEP (Écoute Psycho)', icon: '🗣️', xpRequired: 45, reqSkill: 'aep2', desc: 'Habilité à former les bénévoles et partenaires aux modules d’Aide et Écoute Psychologique (AEP1 & AEP2).' },
    { id: 'cef', name: 'CEF - Concepteur / Encadrant Formation', icon: '📋', xpRequired: 50, desc: 'Ingénierie pédagogique, conception des référentiels et coordination des équipes de formateurs d’antenne.' },
    { id: 'formateur_de_formateur', name: 'Formateur de Formateurs (FdF)', icon: '👑', xpRequired: 65, desc: 'Grade pédagogique suprême de la Protection Civile : forme et certifie tous les formateurs de l’association (PSC, PS, SST, AEP).' }
  ],

  // 1. Initialisation de l'état étendu avec tâches progressives selon le stade de l'antenne
  injectAdvancedState(game) {
    if (!game.rewards) {
      game.rewards = {
        streakDays: 1,
        tier: 1,
        lastDailyClaimDay: null,
        dailyTasks: this.getTasksForTier(1, false),
        weeklyTasks: this.getTasksForTier(1, true)
      };
    } else {
      if (!game.rewards.tier) game.rewards.tier = this.detectAntennaTier(game);
      // Nettoyage et assainissement des sauvegardes avec données résiduelles antérieures
      const hasAntenna = game.stations && game.stations.length > 0;
      if (!hasAntenna) {
        game.rewards.tier = 1;
        game.rewards.dailyTasks = this.getTasksForTier(1, false);
        game.rewards.weeklyTasks = this.getTasksForTier(1, true);
        if (game.grants) game.grants.totalVolunteerHours = 0;
      }
    }

    // Assurer que les stations possèdent des pièces aménageables
    if (game.stations && game.stations.length > 0) {
      game.stations.forEach(st => {
        if (!st.rooms) {
          st.rooms = {
            garage: 1,
            pharmacie: 1,
            foyer: 1,
            formation: 1,
            radio: 1
          };
        }
      });
    }

    // Assurer les compétences sur les bénévoles existants
    if (game.volunteers) {
      game.volunteers.forEach(v => {
        if (!v.skills) v.skills = ['radio'];
        if (v.rank === 'PSE2' || v.rank === 'CE' || v.rank === 'CD') {
          if (!v.skills.includes('pilotage')) v.skills.push('pilotage');
        }
      });
    }

    // Bureau d'antenne
    if (!game.bureau) {
      game.bureau = {
        presidentId: null,
        chefOpId: null,
        tresorierId: null
      };
    }

    // Manœuvres fédérales planifiées
    if (!game.manoeuvres) {
      game.manoeuvres = [
        {
          id: 'man-1',
          title: 'Exercice Fédéral : Simulation Inondation & Crues Majeures',
          type: 'CRUE',
          allianceTag: 'UFSC',
          dateDesc: 'Ce Samedi à 09h00',
          desc: 'Entraînement conjoint inter-antennes de sauvetage en milieu inondé et ouverture de gymnase d’accueil (CAI).',
          participantsCount: 3,
          rewardMoney: 1800,
          rewardXp: 50,
          status: 'open'
        },
        {
          id: 'man-2',
          title: 'Manœuvre Cadres : Poste de Commandement NOVI Stade',
          type: 'NOVI',
          allianceTag: 'UFSC',
          dateDesc: 'Dimanche prochain',
          desc: 'Simulation d’afflux massif de blessés avec déploiement simultané de plusieurs VPC et ambulances VPSP.',
          participantsCount: 2,
          rewardMoney: 2200,
          rewardXp: 75,
          status: 'open'
        }
      ];
    }
  },

  // 2. Gestion des Récompenses Quotidiennes
  claimDailyStreak(game) {
    if (!game.stations || game.stations.length === 0) {
      game.showToast('Antenne Requise', 'Implantez d’abord votre antenne sur la carte pour recevoir votre dotation fédérale !', 'orange');
      return;
    }

    const today = game.clock.day;
    if (game.rewards.lastDailyClaimDay === today) {
      game.showToast('Déjà réclamé', 'Vous avez déjà reçu votre dotation quotidienne pour aujourd’hui ! Revenez demain.', 'blue');
      return;
    }

    const streak = Math.min(7, (game.rewards.streakDays || 1));
    const streakRewards = [
      { money: 300, desc: '+300 € & 2 bouteilles d’Oxygène B5 offertes', o2: 2 },
      { money: 450, desc: '+450 € & 10 points d’Agrément Préfectoral', rep: 10 },
      { money: 600, desc: '+600 € & 2 paires d’électrodes DAE', dae: 2 },
      { money: 750, desc: '+750 € & +60 abonnés sur les réseaux', followers: 60 },
      { money: 900, desc: '+900 € & 4 trousses de soins complètes', kits: 4 },
      { money: 1200, desc: '+1 200 € & dotation équipement offerte', kits: 6 },
      { money: 2500, desc: 'GRAND BONUS JOUR 7 : +2 500 € et reconnaissance fédérale !', rep: 30 }
    ];

    const pick = streakRewards[streak - 1];
    game.resources.money += pick.money;
    if (pick.o2 && game.logistics) game.logistics.oxygenBottles += pick.o2;
    if (pick.dae && game.logistics) game.logistics.aedPads += pick.dae;
    if (pick.kits && game.logistics) game.logistics.woundKits += pick.kits;
    if (pick.followers) game.resources.followers += pick.followers;
    if (pick.rep) game.resources.reputationScore += pick.rep;

    game.rewards.lastDailyClaimDay = today;
    game.rewards.streakDays = streak >= 7 ? 1 : streak + 1;

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Récompense Quotidienne Débloquée !', pick.desc, 'green');
    game.openModule('recompenses');
  },

  // Détection du palier de développement de l'antenne (Tier 1: Lancement, Tier 2: Développement, Tier 3: Envergure)
  detectAntennaTier(game) {
    if (!game.stations || game.stations.length === 0) return 1;
    const vehCount = (game.vehicles || []).length;
    const convCount = (game.sncfConvention?.signed ? 1 : 0) + (game.cumpConvention?.signed ? 1 : 0) + (game.sdisGarde?.active ? 1 : 0);
    const completedMissions = (game.missions || []).filter(m => m.status === 'completed').length;
    const totalVolunteers = (game.volunteers || []).length;

    // Palier 1 (Lancement d'antenne) : pas encore de véhicule, ou aucune convention signée, ou moins de 2 missions
    if (vehCount === 0 || convCount === 0 || completedMissions < 2) {
      return 1;
    }
    // Palier 3 (Grande Envergure / Rayonnement) : >= 8 missions terminées, >= 2 véhicules, >= 8 secouristes
    if (completedMissions >= 8 && vehCount >= 2 && totalVolunteers >= 8) {
      return 3;
    }
    // Palier 2 (Développement / Consolidation)
    return 2;
  },

  getTasksForTier(tier, isWeekly = false) {
    if (isWeekly) {
      if (tier === 1) {
        return [
          { id: 'w-task-starter-recrut', title: 'Publier 1 offre de recrutement (Service Civique ou Salarié)', goal: 1, current: 0, reward: 500, done: false },
          { id: 'w-task-starter-locaux', title: 'Aménager le local de secours sur le Plan 2D CAD', goal: 1, current: 0, reward: 750, done: false }
        ];
      } else if (tier === 2) {
        return [
          { id: 'w-task-mid-hours', title: 'Cumuler 15h de bénévolat d’intérêt public', goal: 15, current: 0, reward: 1500, done: false },
          { id: 'w-task-mid-qualif', title: 'Promouvoir ou qualifier 1 bénévole (PSE2, CE, permis)', goal: 1, current: 0, reward: 900, done: false }
        ];
      } else {
        return [
          { id: 'w-task-high-hours', title: 'Cumuler 40h de missions de sécurité civile', goal: 40, current: 0, reward: 3500, done: false },
          { id: 'w-task-high-fleet', title: 'Maintenir la flotte (≥ 3 véhicules) 100% opérationnelle', goal: 1, current: 0, reward: 2500, done: false }
        ];
      }
    } else {
      if (tier === 1) {
        return [
          { id: 'task-starter-veh', title: 'Acquérir votre 1er véhicule opérationnel (VPSP ou VTU)', goal: 1, current: 0, reward: 600, done: false },
          { id: 'task-starter-mat', title: 'Équiper l’antenne en matériel de secours (Boutique)', goal: 5, current: 0, reward: 400, done: false },
          { id: 'task-starter-conv', title: 'Signer une 1ère convention (SNCF, CUMP ou SDIS)', goal: 1, current: 0, reward: 500, done: false }
        ];
      } else if (tier === 2) {
        return [
          { id: 'task-mid-missions', title: 'Assurer 2 départs en mission (DPS ou Secours)', goal: 2, current: 0, reward: 700, done: false },
          { id: 'task-mid-devis', title: 'Valider 1 devis conforme au barème fédéral', goal: 1, current: 0, reward: 500, done: false },
          { id: 'task-mid-flotte', title: 'Maintenir la flotte révisée & désinfectée', goal: 1, current: 0, reward: 450, done: false }
        ];
      } else {
        return [
          { id: 'task-high-missions', title: 'Assurer 4 missions de secours ou réquisitions préfectorales', goal: 4, current: 0, reward: 1800, done: false },
          { id: 'task-high-garde', title: 'Armer une garde SDIS ou astreinte CUMP SAMU', goal: 1, current: 0, reward: 1400, done: false },
          { id: 'task-high-pref', title: 'Accomplir 1 réquisition préfectorale AASC ou Plan d’Urgence', goal: 1, current: 0, reward: 2000, done: false }
        ];
      }
    }
  },

  syncAdaptiveTasks(game) {
    if (!game.rewards) return;
    const currentTier = this.detectAntennaTier(game);
    if (!game.rewards.tier || game.rewards.tier !== currentTier || !game.rewards.dailyTasks || game.rewards.dailyTasks.length === 0) {
      const canSwitch = !game.rewards.dailyTasks || game.rewards.dailyTasks.every(t => t.done) || (game.rewards.tier && currentTier > game.rewards.tier);
      if (canSwitch) {
        game.rewards.tier = currentTier;
        game.rewards.dailyTasks = this.getTasksForTier(currentTier, false);
        game.rewards.weeklyTasks = this.getTasksForTier(currentTier, true);
      }
    }
  },

  // Calcul dynamique de la progression réelle des objectifs
  updateTasksProgress(game) {
    if (!game.rewards) return;

    const hasAntenna = game.stations && game.stations.length > 0;
    if (!hasAntenna) {
      game.rewards.tier = 1;
      (game.rewards.dailyTasks || []).forEach(t => { t.current = 0; t.done = false; });
      (game.rewards.weeklyTasks || []).forEach(w => { w.current = 0; w.done = false; });
      if (game.grants) game.grants.totalVolunteerHours = 0;
      return;
    }

    this.syncAdaptiveTasks(game);

    // Tâches quotidiennes
    (game.rewards.dailyTasks || []).forEach(t => {
      // 1. Tâches de démarrage (Tier 1)
      if (t.id === 'task-starter-veh') {
        t.current = Math.min(t.goal, (game.vehicles || []).length);
      } else if (t.id === 'task-starter-mat') {
        const st = game.stations[0];
        const stockItems = Object.values(st?.stock || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
        const logiItems = game.logistics ? ((game.logistics.oxygenBottles || 0) + (game.logistics.aedPads || 0) + (game.logistics.woundKits || 0) + (game.logistics.cervicalCollars || 0)) : 0;
        t.current = Math.min(t.goal, Math.max(stockItems, logiItems));
      } else if (t.id === 'task-starter-conv') {
        const convSigned = (game.sncfConvention?.signed || game.cumpConvention?.signed || (game.sdisGarde?.active)) ? 1 : 0;
        t.current = convSigned;
      }
      // 2. Tâches de développement (Tier 2 & génériques)
      else if (t.id === 'task-mid-missions' || t.id === 'task-1') {
        const activeOrDone = (game.missions || []).filter(m => ['ongoing', 'completed'].includes(m.status)).length;
        t.current = Math.min(t.goal, (game.missionsLaunchedCount || 0) + activeOrDone);
      } else if (t.id === 'task-mid-devis' || t.id === 'task-2') {
        const signedCount = (game.devis || []).filter(d => d.status === 'signed').length;
        t.current = Math.min(t.goal, signedCount);
      } else if (t.id === 'task-mid-flotte' || t.id === 'task-3') {
        const allVehs = (game.stations || []).flatMap(s => s.vehicles || []);
        if (!allVehs || allVehs.length === 0) {
          t.current = 0;
        } else {
          const cleanVehs = allVehs.filter(v => !v.isBrokenDown && !v.needsRearming && (v.mechanical || 100) >= 60);
          t.current = (cleanVehs.length === allVehs.length) ? 1 : 0;
        }
      }
      // 3. Tâches de grande envergure (Tier 3)
      else if (t.id === 'task-high-missions') {
        const completedCount = (game.missions || []).filter(m => m.status === 'completed').length;
        t.current = Math.min(t.goal, completedCount);
      } else if (t.id === 'task-high-garde') {
        const sdisOrCump = ((game.sdisGarde && game.sdisGarde.active) || (game.cumpConvention && game.cumpConvention.signed)) ? 1 : 0;
        t.current = sdisOrCump;
      } else if (t.id === 'task-high-pref') {
        const prefMissions = (game.missions || []).filter(m => m.type === 'meteo' && m.status === 'completed').length;
        t.current = Math.min(t.goal, prefMissions);
      }
    });

    // Défis hebdomadaires
    (game.rewards.weeklyTasks || []).forEach(w => {
      // 1. Défis de démarrage (Tier 1)
      if (w.id === 'w-task-starter-recrut') {
        const hasOffer = ((game.jobOffers && game.jobOffers.length > 0) || (game.candidatures && game.candidatures.length > 0)) ? 1 : 0;
        w.current = hasOffer;
      } else if (w.id === 'w-task-starter-locaux') {
        const arch = game.stations?.[0]?.premises?.architecture;
        const hasLayout = (arch && ((arch.furniture && arch.furniture.length > 0) || (arch.rooms && arch.rooms.some(r => r.type !== 'libre')))) ? 1 : 0;
        w.current = hasLayout;
      }
      // 2. Défis de développement & envergure
      else if (w.id === 'w-task-mid-hours' || w.id === 'w-task-high-hours' || w.id === 'w-task-1') {
        const hours = Math.max(0, game.grants?.totalVolunteerHours || 0);
        w.current = Math.min(w.goal, hours);
      } else if (w.id === 'w-task-mid-qualif' || w.id === 'w-task-2') {
        const qualifiedCount = (game.volunteers || []).filter(v => (v.promotionsCount && v.promotionsCount > 0) || (v.acquiredSkills && v.acquiredSkills.length > 0) || (v.trainingHistory && v.trainingHistory.length > 0) || v.rank === 'CE' || v.rank === 'PSE2').length;
        w.current = Math.min(w.goal, qualifiedCount);
      } else if (w.id === 'w-task-high-fleet') {
        const vehs = game.vehicles || [];
        const isFleetReady = vehs.length >= 3 && vehs.every(v => !v.isBrokenDown && !v.needsRearming);
        w.current = isFleetReady ? 1 : 0;
      }
    });
  },

  claimTaskReward(game, taskId, isWeekly = false) {
    if (!game.stations || game.stations.length === 0) {
      game.showToast('Antenne Requise', 'Implantez d’abord votre antenne sur la carte avant de valider des objectifs !', 'orange');
      return;
    }
    this.updateTasksProgress(game);
    const list = isWeekly ? game.rewards.weeklyTasks : game.rewards.dailyTasks;
    const task = list.find(t => t.id === taskId);
    if (!task) return;

    if (task.done) {
      game.showToast('Déjà Récupéré', 'Cette récompense a déjà été obtenue.', 'blue');
      return;
    }

    if (task.current < task.goal) {
      game.showToast('Objectif Non Rempli', `Progression actuelle : ${task.current || 0} / ${task.goal}. Vous devez d’abord accomplir cet objectif !`, 'orange');
      return;
    }

    task.done = true;
    game.resources.money += task.reward;
    const repGained = task.reward >= 1000 ? 50 : (task.reward >= 500 ? 30 : 15);
    game.resources.reputationScore += repGained;

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Objectif Accompli !', `+${task.reward} € et +${repGained} réputation versés à l’antenne !`, 'green');
    game.openModule('recompenses');
  },

  // 3. Achat et Évolution des Pièces du Local
  upgradeRoom(game, stationId, roomKey) {
    const st = game.stations.find(s => s.id === stationId);
    if (!st) return;
    if (!st.rooms) st.rooms = { garage: 1, pharmacie: 1, foyer: 1, formation: 1, radio: 1 };

    const currentLevel = st.rooms[roomKey] || 1;
    const upgrades = this.roomUpgrades[roomKey];
    const nextUpgrade = upgrades.find(u => u.level === currentLevel + 1);

    if (!nextUpgrade) {
      game.showToast('Niveau Maximum', 'Cette pièce a déjà atteint son niveau d’aménagement optimal.', 'blue');
      return;
    }

    if (game.resources.money < nextUpgrade.cost) {
      game.showToast('Trésorerie insuffisante', `L’aménagement requiert ${nextUpgrade.cost} €.`, 'orange');
      return;
    }

    game.resources.money -= nextUpgrade.cost;
    st.rooms[roomKey] = nextUpgrade.level;
    game.resources.reputationScore += 25;

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Local Amélioré !', `« ${nextUpgrade.name} » est opérationnel (${nextUpgrade.bonus}) !`, 'green');
    game.openModule('base');
  },

  // 4. Commande d'un nouveau véhicule spécialisé
  buySpecializedVehicle(game, stationId, vehicleType) {
    const cat = this.vehicleCatalog.find(v => v.type === vehicleType);
    if (!cat) return;

    if (game.resources.money < cat.cost) {
      game.showToast('Fonds insuffisants', `L’acquisition du véhicule requiert ${cat.cost} €.`, 'orange');
      return;
    }

    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;

    // Vérifier la capacité du garage
    const garageLevel = station.rooms?.garage || 1;
    const maxSlots = garageLevel === 1 ? 2 : (garageLevel === 2 ? 4 : 8);
    if (station.vehicles.length >= maxSlots) {
      game.showToast('Garage saturé !', `Votre garage est plein (${station.vehicles.length}/${maxSlots}). Agrandissez le hangar dans l'aménagement du local !`, 'orange');
      return;
    }

    game.resources.money -= cat.cost;
    const vehId = `${cat.type.toLowerCase()}-${Date.now()}`;
    const newVeh = {
      id: vehId,
      name: `${cat.type} 0${station.vehicles.length + 1}`,
      type: cat.type,
      label: cat.name,
      capacity: cat.capacity,
      seatsCount: cat.capacity,
      extraCapacityLabel: cat.extraCapacityLabel || null,
      status: 'dispo',
      fuel: 100,
      mechanical: 100,
      disinfectionNeeded: false,
      stationId: station.id,
      specialty: cat.specialty,
      icon: cat.icon,
      image: cat.image || `images/vehicles/${cat.type}.png`,
      hasTowHitch: cat.hasTowHitch || false,
      requiresTrailer: cat.requiresTrailer || false,
      reqSkills: cat.reqSkills || []
    };

    game.vehicles.push(newVeh);
    station.vehicles.push(vehId);

    game.closeModal();
    game.updateStatsUI();
    game.renderStations();
    game.saveGame();
    game.syncPlayerToServer();
    game.showToast('Véhicule en Dotation !', `${cat.icon} ${newVeh.name} est stationné au garage de l’antenne !`, 'green');
    game.openStationDetails(station.id);
  },

  // 5. Arbre de compétences des bénévoles
  learnSkill(game, volunteerId, skillId) {
    const v = game.volunteers.find(vol => vol.id === volunteerId);
    const skill = this.skillsList.find(s => s.id === skillId);
    if (!v || !skill) return;

    if (!v.skills) v.skills = [];
    if (v.skills.includes(skillId)) return;

    // Vérification du prérequis
    if (skill.reqSkill && !v.skills.includes(skill.reqSkill)) {
      const prereq = this.skillsList.find(s => s.id === skill.reqSkill);
      game.showToast('Prérequis Manquant', `${v.name} doit d’abord valider la compétence « ${prereq?.name || skill.reqSkill} ».`, 'orange');
      return;
    }

    if ((v.exp || 0) < skill.xpRequired) {
      game.showToast('Expérience insuffisante', `${v.name} a besoin de ${skill.xpRequired} XP pour valider cette qualification (XP actuel : ${v.exp || 0}).`, 'orange');
      return;
    }

    v.exp -= skill.xpRequired;
    v.skills.push(skillId);
    if (skillId.startsWith('formateur_') || skillId === 'formateur_de_formateur' || skillId === 'cef') {
      v.isTrainer = true;
    }
    v.moral = Math.min(100, (v.moral || 80) + 15);

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Qualification Validée !', `${v.name} a obtenu la qualification « ${skill.name} » !`, 'green');
    game.openModule('competences');
  },

  // Nomination au Bureau de l'Antenne
  nominateBureauMember(game, role, volunteerId) {
    const v = game.volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    if (role === 'president') game.bureau.presidentId = v.id;
    if (role === 'chefOp') game.bureau.chefOpId = v.id;
    if (role === 'tresorier') game.bureau.tresorierId = v.id;

    game.saveGame();
    game.showToast('Bureau d’Antenne', `${v.name} est nommé(e) au poste de ${role.toUpperCase()} !`, 'green');
    game.openModule('recrutement');
  },

  // 6. Participation à une manœuvre fédérale
  joinManoeuvre(game, manoeuvreId) {
    const man = game.manoeuvres.find(m => m.id === manoeuvreId);
    if (!man) return;

    if (man.status === 'joined') {
      game.showToast('Déjà inscrit', 'Votre antenne est déjà inscrite dans le détachement de cette manœuvre.', 'blue');
      return;
    }

    const availableVols = game.volunteers.filter(v => v.status === 'dispo');
    if (availableVols.length < 2) {
      game.showToast('Effectif insuffisant', 'Il vous faut au moins 2 secouristes disponibles pour participer à la manœuvre.', 'orange');
      return;
    }

    man.status = 'joined';
    man.participantsCount += 1;

    // Gain d'XP immédiat et récompense fédérale
    game.resources.money += man.rewardMoney;
    availableVols.slice(0, 4).forEach(v => {
      v.exp = (v.exp || 0) + man.rewardXp;
      v.moral = 100;
      v.recycledYear = game.clock.year;
    });

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Manœuvre Fédérale Validée !', `Détachement engagé avec succès ! (+${man.rewardMoney} € & +${man.rewardXp} XP par participant).`, 'green');
    game.openModule('alliance');
  }
};
