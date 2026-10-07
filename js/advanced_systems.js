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
      name: 'Ambulance VPSP',
      category: 'Secours d’Urgence',
      desc: 'Ambulance de Premiers Secours avec cellule sanitaire complète (brancard, O2, DAE, aspiration) aux normes EN 1789.',
      cost: 28500,
      capacity: 4,
      icon: '🚑',
      speedKmH: 80,
      specialty: 'Transport Sanitaire CHU'
    },
    {
      type: 'VTU',
      name: 'Fourgon Logistique (VTU)',
      category: 'Logistique & Social',
      desc: 'Fourgon utilitaire pour maraudes sociales, tentes PMA, lits de camp et transport de matériel lourd.',
      cost: 18500,
      capacity: 3,
      icon: '🚐',
      speedKmH: 70,
      specialty: 'Action Sociale & Matériel'
    },
    {
      type: 'VLM',
      name: 'Véhicule Liaison / Cadre (VL)',
      category: 'Reconnaissance Rapide',
      desc: 'Véhicule Léger avec rampe lumineuse et équipement radio pour reconnaissance et déplacement des cadres.',
      cost: 12500,
      capacity: 2,
      icon: '🚗',
      speedKmH: 100,
      specialty: 'Reconnaissance & Commandement'
    },
    {
      type: 'VPC',
      name: 'Poste de Commandement (VPC)',
      category: 'Commandement Lourd',
      desc: 'Fourgon poids lourd avec baie transmissions, mâts télescopiques et liaison satellite pour grands DPS et crises NOVI.',
      cost: 42000,
      capacity: 5,
      icon: '🚍',
      speedKmH: 65,
      specialty: 'Coordination Grands Événements'
    },
    {
      type: 'BLS',
      name: 'Canot Fluvial / Embarcation BLS',
      category: 'Sauvetage Aquatique',
      desc: 'Embarcation pneumatique semi-rigide avec moteur hors-bord pour crues et sauvetage nautique.',
      cost: 14000,
      capacity: 3,
      icon: '🚤',
      speedKmH: 45,
      specialty: 'Missions Nautiques & Crues'
    },
    {
      type: 'QUAD',
      name: 'Quad & Remorque Brancard',
      category: 'Intervention Tout-Terrain',
      desc: 'Vecteur tout-terrain agile pour parcs, forêts et festivals très denses.',
      cost: 6500,
      capacity: 2,
      icon: '🏍️',
      speedKmH: 50,
      specialty: 'Accès Milieu Difficile'
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
    { id: 'psy', name: 'Soutien Psychologique (CUMP)', icon: '🧠', xpRequired: 35, desc: 'Prise en charge du choc émotionnel des impliqués lors des crises.' },
    { id: 'formateur', name: 'Formateur PSC / SST', icon: '🎓', xpRequired: 45, desc: 'Anime des sessions de gestes qui sauvent pour le grand public.' }
  ],

  // 1. Initialisation de l'état étendu
  injectAdvancedState(game) {
    if (!game.rewards) {
      game.rewards = {
        streakDays: 1,
        lastDailyClaimDay: null,
        dailyTasks: [
          { id: 'task-1', title: 'Assurer 1 départ en mission', goal: 1, current: 0, reward: 250, done: false },
          { id: 'task-2', title: 'Valider 1 devis conforme au barème', goal: 1, current: 0, reward: 200, done: false },
          { id: 'task-3', title: 'Maintenir la flotte révisée & désinfectée', goal: 1, current: 1, reward: 150, done: false }
        ],
        weeklyTasks: [
          { id: 'w-task-1', title: 'Cumuler 15h de bénévolat d’intérêt public', goal: 15, current: game.grants?.totalVolunteerHours || 5, reward: 1200, done: false },
          { id: 'w-task-2', title: 'Promouvoir ou qualifier 1 bénévole', goal: 1, current: 0, reward: 600, done: false }
        ]
      };
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

  claimTaskReward(game, taskId, isWeekly = false) {
    const list = isWeekly ? game.rewards.weeklyTasks : game.rewards.dailyTasks;
    const task = list.find(t => t.id === taskId);
    if (!task || task.done) return;

    task.done = true;
    game.resources.money += task.reward;
    game.resources.reputationScore += 15;

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Objectif Accompli !', `+${task.reward} € versés à l’association !`, 'green');
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
      status: 'dispo',
      fuel: 100,
      mechanical: 100,
      disinfectionNeeded: false,
      stationId: station.id,
      specialty: cat.specialty,
      icon: cat.icon
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

    if ((v.exp || 0) < skill.xpRequired) {
      game.showToast('Expérience insuffisante', `${v.name} a besoin de ${skill.xpRequired} XP pour valider cette qualification (XP actuel : ${v.exp || 0}).`, 'orange');
      return;
    }

    v.exp -= skill.xpRequired;
    v.skills.push(skillId);
    v.moral = Math.min(100, (v.moral || 80) + 15);

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Qualification Validée !', `${v.name} a obtenu la qualification « ${skill.name} » !`, 'green');
    game.openModule('recrutement');
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
