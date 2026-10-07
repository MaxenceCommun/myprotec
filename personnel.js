/**
 * PROTEC LIVE - GESTION DU PERSONNEL & RESSOURCES HUMAINES
 * 1. Statuts : Bénévoles, Services Civiques (115 €/mois), Salariés permanents (2 200 €/mois).
 * 2. Profils sociaux & Disponibilités réalistes (parents, étudiants, salariés, chômeurs, retraités).
 * 3. Compteurs psychologiques & physiques : Fatigue / Énergie (0-100), Motivation (0-100), Humeur (0-100).
 * 4. Traits de caractère : Dévoué (se force à l'épuisement), Équilibré, Leader, Sensible, Dynamique.
 * 5. Gestion du surmenage / Burnout et repos obligatoire.
 * 6. Agréments de Sécurité Civile officiels (A, B, C, D) et déblocage progressif des missions.
 */

window.ProtecPersonnel = {
  // Profils socio-professionnels et taux de disponibilité
  socialProfiles: {
    parent: {
      label: 'Parent de famille',
      icon: '👨‍👧',
      baseDispoRate: 0.28,
      desc: 'Disponibilité restreinte (enfants, devoirs). Préfère les samedis après-midi. Très fiable.',
      favDays: ['Samedi', 'Dimanche'],
      energyDrainRatio: 1.15
    },
    etudiant: {
      label: 'Étudiant(e)',
      icon: '🎓',
      baseDispoRate: 0.72,
      desc: 'Forte disponibilité soirs et week-ends. Enthousiaste et dynamique.',
      favDays: ['Mercredi', 'Vendredi', 'Samedi', 'Dimanche'],
      energyDrainRatio: 0.95
    },
    salarie: {
      label: 'Salarié(e) temps plein',
      icon: '💼',
      baseDispoRate: 0.42,
      desc: 'Disponible uniquement en soirée de fin de semaine et le week-end.',
      favDays: ['Vendredi', 'Samedi', 'Dimanche'],
      energyDrainRatio: 1.10
    },
    chomeur: {
      label: 'En recherche d’emploi',
      icon: '🤝',
      baseDispoRate: 0.85,
      desc: 'Très grande disponibilité en semaine et en journée. Cherche à se rendre utile.',
      favDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      energyDrainRatio: 1.00
    },
    retraite: {
      label: 'Retraité(e) actif',
      icon: '👴',
      baseDispoRate: 0.75,
      desc: 'Disponible en journée de semaine. Idéal pour la logistique, la pharmacie et les maraudes.',
      favDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
      energyDrainRatio: 1.20
    },
    service_civique: {
      label: 'Volontaire Service Civique',
      icon: '🎖️',
      baseDispoRate: 0.88,
      desc: 'Contrat jeune (24h-35h/semaine). Indemnisé par l’État (coût antenne 115 €/mois).',
      favDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      energyDrainRatio: 0.90
    },
    salarie_asso: {
      label: 'Salarié permanent de l’antenne',
      icon: '👔',
      baseDispoRate: 0.95,
      desc: 'Cadre permanent 35h/semaine (coût 2 200 €/mois). Assure la continuité opérationnelle.',
      favDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
      energyDrainRatio: 0.85
    }
  },

  // Traits psychologiques
  traits: {
    devoue: {
      name: 'Dévoué (Se force à l’épuisement)',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      desc: 'Accepte d’intervenir même avec une énergie critique (<25). Risque élevé de surmenage et arrêt maladie !'
    },
    equilibre: {
      name: 'Équilibré',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Refuse poliment les missions si son énergie descend sous 40 pour préserver sa santé.'
    },
    leader: {
      name: 'Leader Charismatique',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      desc: 'Apporte +10 de moral et motivation à tous ses équipiers dans le même véhicule.'
    },
    sensible: {
      name: 'Sensible & Empathique',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      desc: 'Excellente écoute sur les maraudes (+20% réputation). Plus affecté par les bilans graves du SAMU.'
    },
    dynamique: {
      name: 'Travailleur Infatigable',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      desc: 'Récupère son énergie 30% plus vite au repos.'
    }
  },

  // Agréments de Sécurité Civile officiels
  agrementsCatalog: [
    {
      code: 'D',
      title: 'Agrément D - Dispositifs Prévisionnels de Secours (DPS)',
      category: 'Secours Événementiel',
      cost: 1500,
      icon: 'shield',
      color: 'blue',
      unlocks: 'PAPS & DPS Petite Envergure (DPS-PE)',
      desc: 'Agrément préfectoral obligatoire autorisant l’association à déployer des postes de secours sur les manifestations sportives et culturelles.'
    },
    {
      code: 'A',
      title: 'Agrément A - Opérations de Secours à Personnes (SAMU 15)',
      category: 'Réseau Urgence Préfectorale',
      cost: 3800,
      icon: 'activity',
      color: 'orange',
      unlocks: 'Départs Réflexes Ambulance VPSP & Réquisition SAMU',
      desc: 'Convention ARS et Préfecture validant la conformité sanitaire des VPSP pour intervenir sur demande du SAMU 15 et des Sapeurs-Pompiers.'
    },
    {
      code: 'B',
      title: 'Agrément B - Action Sociale & Soutien Psychologique',
      category: 'Solidarité & Précarité',
      cost: 1200,
      icon: 'heart-handshake',
      color: 'purple',
      unlocks: 'Maraudes Sociales, Hébergement d’Urgence, Écoute',
      desc: 'Habilitation préfectorale DDETS pour l’aide aux sans-abris, distributions de kits et centres d’accueil d’urgence hivernaux.'
    },
    {
      code: 'C',
      title: 'Agrément C - Soutien aux Populations Sinistrées (NOVI / ORSEC)',
      category: 'Grandes Catastrophes',
      cost: 5000,
      icon: 'siren',
      color: 'red',
      unlocks: 'Alertes Plan NOVI, Inondations Majeures, Sinistrés',
      desc: 'Agrément national de Sécurité Civile délivré par le Ministère de l’Intérieur pour armer des PMA et gérer les crises majeures.'
    }
  ],

  // Initialisation et migration douce des données de personnel
  injectPersonnelState(game) {
    if (!game.resources.agrements) {
      game.resources.agrements = {
        D: true, // Agrément D de base actif au démarrage pour les petits postes
        A: false,
        B: false,
        C: false
      };
    }

    if (!game.resources.associationLevel) {
      game.resources.associationLevel = 1;
    }

    if (!game.resources.associationExp) {
      game.resources.associationExp = 0;
    }

    // Mise à jour de chaque secouriste existant avec les nouvelles métriques
    if (game.volunteers && Array.isArray(game.volunteers)) {
      game.volunteers.forEach(v => {
        if (!v.contractType) v.contractType = 'benevole';
        if (!v.profilSocial) v.profilSocial = v.dispoType === 'étudiant' ? 'etudiant' : (v.dispoType === 'salarié' ? 'salarie' : 'parent');
        if (v.energy === undefined) v.energy = 85;
        if (v.motivation === undefined) v.motivation = 80;
        if (v.humeur === undefined) v.humeur = 80;
        if (!v.trait) {
          const traitsKeys = Object.keys(this.traits);
          v.trait = traitsKeys[Math.floor(Math.random() * traitsKeys.length)];
        }
        if (v.missionsCount === undefined) v.missionsCount = 0;
        if (v.consecutiveMissions === undefined) v.consecutiveMissions = 0;
        if (v.isBurnout === undefined) v.isBurnout = false;
      });
    }
  },

  // Calcul du moral / humeur sous forme de libellé clair
  getHumeurLabel(score) {
    if (score >= 80) return { label: 'Rayonnant', color: 'emerald', icon: '😄' };
    if (score >= 60) return { label: 'Serein', color: 'blue', icon: '🙂' };
    if (score >= 40) return { label: 'Neutre', color: 'slate', icon: '😐' };
    if (score >= 20) return { label: 'Morose', color: 'amber', icon: '😟' };
    return { label: 'Épuisé / Burnout', color: 'red', icon: '😫' };
  },

  // Calcul du statut de disponibilité dynamique
  calculateAvailability(volunteer, game) {
    if (volunteer.isBurnout) {
      return { available: false, reason: 'Arrêt de travail / Burnout (surmenage)' };
    }

    if (volunteer.energy < 20 && volunteer.trait !== 'devoue') {
      return { available: false, reason: 'Énergie critique (besoin de repos)' };
    }

    const profile = this.socialProfiles[volunteer.profilSocial] || this.socialProfiles.benevole;
    const currentDayName = game.clock.daysNames[game.clock.day % 7];

    // Vérification du jour favori selon profil social
    const isPreferredDay = volunteer.dispoJours?.includes(currentDayName) || profile.favDays.includes(currentDayName);
    
    // Probabilité d'acceptation selon le taux du profil
    let chance = profile.baseDispoRate;
    if (isPreferredDay) chance += 0.35;
    if (volunteer.motivation > 75) chance += 0.15;
    if (volunteer.energy > 70) chance += 0.10;

    const available = Math.random() < Math.min(0.98, chance);
    return {
      available,
      reason: available ? 'Disponible' : `${profile.label} : indisponible ce jour`
    };
  },

  // Déduction de fatigue et mise à jour psychologique lors d'une mission
  applyMissionExertion(volunteer, mission) {
    const profile = this.socialProfiles[volunteer.profilSocial] || this.socialProfiles.benevole;
    let drain = 20 * (profile.energyDrainRatio || 1);

    // Missions de nuit ou d'urgence SAMU plus éprouvantes
    if (mission.type === 'samu') drain += 10;
    if (mission.type === 'social') drain += 8;
    if (mission.durationHours && mission.durationHours > 6) drain += 12;

    // Trait dynamique récupère mieux
    if (volunteer.trait === 'dynamique') drain *= 0.75;
    if (volunteer.trait === 'sensible' && mission.type === 'samu') drain *= 1.25;

    volunteer.energy = Math.max(0, Math.round(volunteer.energy - drain));
    volunteer.missionsCount = (volunteer.missionsCount || 0) + 1;
    volunteer.consecutiveMissions = (volunteer.consecutiveMissions || 0) + 1;

    // Si le bénévole enchaîne trop sans pause (surmenage)
    if (volunteer.consecutiveMissions >= 3) {
      volunteer.motivation = Math.max(10, volunteer.motivation - 12);
      volunteer.humeur = Math.max(10, volunteer.humeur - 15);
    } else {
      // Mission valorisante accomplie avec succès
      volunteer.motivation = Math.min(100, volunteer.motivation + 6);
      volunteer.humeur = Math.min(100, volunteer.humeur + 5);
    }

    // Risque de burnout critique si énergie = 0 ou dépassement excessif
    if (volunteer.energy <= 0 || (volunteer.energy < 15 && volunteer.trait === 'devoue' && volunteer.consecutiveMissions >= 4)) {
      volunteer.isBurnout = true;
      volunteer.status = 'repos';
      volunteer.burnoutUntil = Date.now() + (30 * 60 * 1000); // 30 minutes réelles d'arrêt forcé
      return { burnout: true, volunteer };
    }

    return { burnout: false, volunteer };
  },

  // Régénération au repos
  applyRestCycle(game) {
    if (!game.volunteers) return;
    const now = Date.now();

    game.volunteers.forEach(v => {
      // Fin de burnout éventuelle
      if (v.isBurnout && v.burnoutUntil && now >= v.burnoutUntil) {
        v.isBurnout = false;
        v.energy = 50;
        v.humeur = 60;
        v.consecutiveMissions = 0;
        game.showToast('Reprise d’activité', `${v.name} a récupéré et réintègre l’effectif disponible.`, 'green');
      }

      if (v.status === 'dispo') {
        const bonusFoyer = game.stations[0]?.rooms?.foyer === 2 ? 1.5 : (game.stations[0]?.rooms?.foyer === 3 ? 2.0 : 1.0);
        const gain = Math.round(4 * bonusFoyer * (v.trait === 'dynamique' ? 1.3 : 1.0));
        v.energy = Math.min(100, (v.energy || 70) + gain);

        // Si bien reposé, le moral remonte
        if (v.energy >= 80) {
          v.humeur = Math.min(100, (v.humeur || 70) + 2);
        }

        // Si le secouriste n'a pas fait de mission depuis longtemps, légère baisse de motivation
        if (Math.random() < 0.05 && v.consecutiveMissions === 0 && v.motivation > 35) {
          v.motivation = Math.max(30, v.motivation - 1);
        }
      }
    });
  },

  // Prélèvement des charges salariales et services civiques (cycle régulier)
  processSalariesAndStipends(game) {
    if (!game.volunteers) return;
    let totalMonthlyCharges = 0;
    let serviceCiviqueCount = 0;
    let salarieCount = 0;

    game.volunteers.forEach(v => {
      if (v.contractType === 'service_civique') {
        serviceCiviqueCount++;
        totalMonthlyCharges += 115;
      } else if (v.contractType === 'salarie') {
        salarieCount++;
        totalMonthlyCharges += 2200;
      }
    });

    if (totalMonthlyCharges > 0 && game.clock.day === 1 && game.clock.hour === 9 && game.clock.minute === 0) {
      if (game.resources.money >= totalMonthlyCharges) {
        game.resources.money -= totalMonthlyCharges;
        game.showToast(
          'Paiement des Salaires & Indemnités',
          `Virement mensuel : ${totalMonthlyCharges} € (${salarieCount} salarié(s), ${serviceCiviqueCount} service(s) civique(s)).`,
          'blue'
        );
      } else {
        game.showToast(
          'Trésorerie Critique : Salaires Impayés !',
          `Fonds insuffisants pour régler ${totalMonthlyCharges} € d’indemnités salariales ! Baisse de moral.`,
          'red'
        );
        game.volunteers.forEach(v => {
          if (v.contractType !== 'benevole') v.motivation = Math.max(10, v.motivation - 25);
        });
      }
      game.updateStatsUI();
    }
  },

  // Achat d'un agrément officiel
  purchaseAgrement(game, agrementCode) {
    const agr = this.agrementsCatalog.find(a => a.code === agrementCode);
    if (!agr) return;

    if (game.resources.agrements[agrementCode]) {
      game.showToast('Agrément déjà actif', `Votre antenne dispose déjà de l’${agr.title}.`, 'blue');
      return;
    }

    if (game.resources.money < agr.cost) {
      game.showToast('Trésorerie insuffisante', `L’audit préfectoral requiert ${agr.cost} €.`, 'orange');
      return;
    }

    game.resources.money -= agr.cost;
    game.resources.agrements[agrementCode] = true;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + 50;

    game.showToast(
      'Agrément Préfectoral Obtenu !',
      `Félicitations ! L’${agr.title} est validé par la Préfecture. ${agr.unlocks} débloqué !`,
      'green'
    );

    game.saveGame();
    game.updateStatsUI();
    game.openModule('recrutement');
  },

  // Recrutement d'un Service Civique
  hireServiceCivique(game) {
    const costOnboarding = 250; // Frais de dossier & pack tenue officielle
    if (game.resources.money < costOnboarding) {
      game.showToast('Trésorerie insuffisante', `L’ouverture du dossier requiert ${costOnboarding} € pour le pack tenue.`, 'orange');
      return;
    }

    const firstNames = ['Léo', 'Camille', 'Enzo', 'Jade', 'Théo', 'Léa', 'Hugo', 'Chloé'];
    const lastNames = ['Moreau', 'Fournier', 'Guerin', 'Rousseau', 'Blanc', 'Garnier', 'Chevalier'];
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];

    game.resources.money -= costOnboarding;
    const newVol = {
      id: `sc-${Date.now()}`,
      name: `${fn} ${ln}`,
      role: 'Volontaire Service Civique',
      rank: 'PSE1',
      contractType: 'service_civique',
      profilSocial: 'service_civique',
      exp: 25,
      energy: 95,
      motivation: 95,
      humeur: 90,
      trait: 'dynamique',
      status: 'dispo',
      stationId: game.stations[0]?.id,
      isTrainer: false,
      avatar: '🎖️',
      dispoType: 'service_civique',
      dispoJours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      missionsCount: 0,
      consecutiveMissions: 0,
      isBurnout: false
    };

    game.volunteers.push(newVol);
    game.showToast('Service Civique Recruté !', `${newVol.name} a débuté sa mission d’engagement (115 €/mois).`, 'green');
    game.saveGame();
    game.updateStatsUI();
    game.openModule('recrutement');
  },

  // Embauche d'un Salarié Permanent (Cadre 35h)
  hireSalarie(game) {
    const costOnboarding = 1200; // Frais d'ouverture de poste & matériel informatique/radio
    if (game.resources.money < costOnboarding) {
      game.showToast('Trésorerie insuffisante', `L’embauche requiert ${costOnboarding} € pour l'équipement initial du cadre.`, 'orange');
      return;
    }

    const candidates = [
      { name: 'Frédéric Dumont', role: 'Coordinateur des Opérations', rank: 'CE', avatar: '👔', trait: 'leader' },
      { name: 'Stéphanie Martin', role: 'Responsable Pédagogique & Logistique', rank: 'CE', avatar: '👩‍💼', trait: 'equilibre' }
    ];
    const pick = candidates[Math.floor(Math.random() * candidates.length)];

    game.resources.money -= costOnboarding;
    const newSalarie = {
      id: `sal-${Date.now()}`,
      name: pick.name,
      role: pick.role,
      rank: pick.rank,
      contractType: 'salarie',
      profilSocial: 'salarie_asso',
      exp: 150,
      energy: 100,
      motivation: 90,
      humeur: 85,
      trait: pick.trait,
      status: 'dispo',
      stationId: game.stations[0]?.id,
      isTrainer: true,
      avatar: pick.avatar,
      dispoType: 'salarie_permanent',
      dispoJours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
      missionsCount: 0,
      consecutiveMissions: 0,
      isBurnout: false
    };

    game.volunteers.push(newSalarie);
    game.showToast('Salarié Embauché !', `${newSalarie.name} rejoint l’antenne en tant que cadre permanent (2 200 €/mois).`, 'green');
    game.saveGame();
    game.updateStatsUI();
    game.openModule('recrutement');
  }
};
