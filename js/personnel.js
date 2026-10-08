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
    // Mise à jour de chaque secouriste existant avec les nouvelles métriques
    if (game.volunteers && Array.isArray(game.volunteers)) {
      game.volunteers.forEach(v => {
        if (!v.contractType) {
          if (v.name === 'Alexandre Roux' || v.dispoType === 'salarie_permanent') {
            v.contractType = 'salarie';
          } else {
            v.contractType = 'benevole';
          }
        }
        if (!v.profilSocial) v.profilSocial = v.dispoType === 'étudiant' ? 'etudiant' : (v.dispoType === 'salarié' || v.contractType === 'salarie' ? 'salarie_asso' : 'parent');
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

        // Attributs exclusifs aux salariés sous contrat de travail
        if (v.contractType === 'salarie') {
          if (v.contractMonthlyHours === undefined) v.contractMonthlyHours = 151;
          if (v.monthlyHoursWorked === undefined) v.monthlyHoursWorked = 0;
          if (v.monthlyOvertimeHours === undefined) v.monthlyOvertimeHours = 0;
          if (v.todayHoursWorked === undefined) v.todayHoursWorked = 0;
          if (v.mandatoryRestUntil === undefined) v.mandatoryRestUntil = null;
          if (v.currentVacation === undefined) v.currentVacation = null;
          if (!v.vacationHistory) v.vacationHistory = [];
        }
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
  calculateAvailability(volunteer, game, mission = null) {
    if (volunteer.isBurnout) {
      return { available: false, reason: 'Arrêt de travail / Burnout (surmenage)' };
    }

    // --- RÈGLE DU CODE DU TRAVAIL STRICTEMENT RÉSERVÉE AUX SALARIÉS ---
    if (volunteer.contractType === 'salarie') {
      const now = Date.now();
      if (volunteer.mandatoryRestUntil && now < volunteer.mandatoryRestUntil) {
        const secLeft = Math.ceil((volunteer.mandatoryRestUntil - now) / 1000);
        return {
          available: false,
          reason: `Repos obligatoire (Code du Travail Art. L3131-1 : 11h consécutives - encore ${secLeft}s)`
        };
      }
      if (volunteer.currentVacation) {
        return {
          available: false,
          reason: `En vacation interne : « ${volunteer.currentVacation.title} »`
        };
      }
    }

    if (volunteer.energy < 20 && volunteer.trait !== 'devoue') {
      return { available: false, reason: 'Énergie critique (besoin de repos)' };
    }

    const profile = this.socialProfiles[volunteer.profilSocial] || this.socialProfiles.benevole;
    const currentDayName = (mission && mission.eventDate?.dayName) ? mission.eventDate.dayName : game.clock.daysNames[game.clock.day % 7];

    // Vérification du jour favori selon profil social et préférences
    const isPreferredDay = volunteer.dispoJours?.includes(currentDayName) || profile.favDays.includes(currentDayName);
    
    // Probabilité d'acceptation :
    // Même si le bénévole a Samedi/Dimanche, il peut quand même se libérer en semaine (mardi, etc.) avec une probabilité réduite
    let chance = isPreferredDay ? (profile.baseDispoRate + 0.35) : 0.16;
    if (volunteer.motivation > 75) chance += 0.12;
    if (volunteer.energy > 70) chance += 0.08;
    if (volunteer.contractType === 'salarie') chance += 0.40; // Les salariés ont une présence renforcée
    
    // Si petit poste de secours (durée <= 4h ou PAPS/DPS-PE), plus accessible en semaine
    if (mission && (mission.durationHours <= 4 || (mission.scale && (mission.scale.includes('PE') || mission.scale.includes('PAPS'))))) {
      chance += 0.10;
    }

    const available = Math.random() < Math.min(0.96, Math.max(0.08, chance));
    return {
      available,
      reason: available ? 'Disponible' : `${profile.label} : indisponible ce jour-là`
    };
  },

  // Déduction de fatigue et mise à jour psychologique lors d'une mission
  applyMissionExertion(volunteer, mission, hasAep2 = false) {
    const profile = this.socialProfiles[volunteer.profilSocial] || this.socialProfiles.benevole;
    let drain = 20 * (profile.energyDrainRatio || 1);

    // Missions de nuit ou d'urgence SAMU plus éprouvantes
    if (mission.type === 'samu') drain += 10;
    if (mission.type === 'social') drain += 8;
    if (mission.durationHours && mission.durationHours > 6) drain += 12;

    // Trait dynamique récupère mieux
    if (volunteer.trait === 'dynamique') drain *= 0.75;
    if (volunteer.trait === 'sensible' && mission.type === 'samu') drain *= 1.25;

    // Soutien et débriefing psychologique AEP2 (defusing d'équipage : -50% de fatigue morale et physique)
    if (hasAep2) drain *= 0.50;

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

  // Recrutement d'un Service Civique (procédure officielle avec ouverture d'offre et entretien)
  hireServiceCivique(game) {
    this.openJobOfferModal(game, 'service_civique');
  },

  // Embauche d'un Salarié Permanent (procédure officielle avec ouverture d'offre et entretien)
  hireSalarie(game) {
    this.openJobOfferModal(game, 'CDI');
  },

  // =========================================================================
  // GESTION DU CODE DU TRAVAIL & MISSIONS DÉDIÉES AUX SALARIÉS
  // =========================================================================

  laborLawConfig: {
    monthlyHoursQuota: 151, // 35h / semaine (Art. L3121-27 du Code du Travail)
    mandatoryRestHours: 11, // Repos quotidien consécutif obligatoire (Art. L3131-1)
    maxDailyWorkHours: 10,  // Durée maximale quotidienne de travail effectif (Art. L3121-18)
    baseHourlySalary: 14.57, // Taux horaire de base brut (2 200 € / 151h)
    overtimeRate: 18.21,     // Heures supplémentaires majorées à +25% (Art. L3121-36)
    restSimSeconds: 110      // 11 heures consécutives de repos simulées en 110 secondes réelles de jeu
  },

  salarieTasksCatalog: [
    // 1. Formations
    {
      id: 'formation_gqs',
      category: 'formation',
      categoryLabel: 'Pôle Pédagogique',
      title: 'Session GQS (Gestes Qui Sauvent)',
      hours: 2,
      icon: 'heart-pulse',
      color: 'blue',
      desc: 'Animation d’un atelier citoyen de 2h aux gestes d’urgence et défibrillateur (DAE).',
      revenue: 120,
      repGain: 6,
      trainerRank: 'PSE1'
    },
    {
      id: 'formation_psc1',
      category: 'formation',
      categoryLabel: 'Pôle Pédagogique',
      title: 'Session PSC1 Grand Public (7h)',
      hours: 7,
      icon: 'graduation-cap',
      color: 'indigo',
      desc: 'Journée complète de formation certifiante aux premiers secours civiques de base.',
      revenue: 380,
      repGain: 15,
      trainerRank: 'PSE1'
    },
    {
      id: 'formation_sst',
      category: 'formation',
      categoryLabel: 'Pôle Pédagogique',
      title: 'Formation SST en Entreprise (7h)',
      hours: 7,
      icon: 'building-2',
      color: 'teal',
      desc: 'Animation de la journée Sauveteur Secouriste du Travail pour les salariés d’une entreprise locale.',
      revenue: 550,
      repGain: 20,
      trainerRank: 'PSE2'
    },
    {
      id: 'formation_recyclage',
      category: 'formation',
      categoryLabel: 'Pôle Pédagogique',
      title: 'Formation Continue & Recyclage PSE Interne',
      hours: 6,
      icon: 'award',
      color: 'purple',
      desc: 'Recyclage annuel officiel des secouristes bénévoles de l’antenne pour maintenir leurs qualifications.',
      revenue: 0,
      repGain: 12,
      moraleBoost: 10,
      trainerRank: 'CE'
    },

    // 2. Tâches Administratives
    {
      id: 'admin_subvention',
      category: 'administrative',
      categoryLabel: 'Pôle Administratif & Direction',
      title: 'Montage Cerfa Subvention & Mécénat',
      hours: 4,
      icon: 'file-text',
      color: 'emerald',
      desc: 'Rédaction du dossier Cerfa et mémoire d’utilité publique pour la mairie et la préfecture.',
      revenue: 200,
      repGain: 12,
      grantHoursValorisation: 15
    },
    {
      id: 'admin_devis',
      category: 'administrative',
      categoryLabel: 'Pôle Administratif & Direction',
      title: 'Instruction Devis & Suivi Organisateurs',
      hours: 3,
      icon: 'file-check',
      color: 'amber',
      desc: 'Relance des devis DPS, calcul des grilles RNMSC et contractualisation des postes à venir.',
      revenue: 90,
      repGain: 8,
      generateDevis: true
    },
    {
      id: 'admin_registre_rh',
      category: 'administrative',
      categoryLabel: 'Pôle Administratif & Direction',
      title: 'Registre Unique du Personnel & Dossiers RH',
      hours: 3,
      icon: 'users',
      color: 'sky',
      desc: 'Vérification des visites médicales d’aptitude, permis VPSP et conformité Code du Travail.',
      revenue: 0,
      repGain: 10,
      moraleBoost: 6
    },

    // 3. Tâches Logistiques
    {
      id: 'log_desinfection_vpsp',
      category: 'logistique',
      categoryLabel: 'Pôle Logistique & Parc',
      title: 'Bionettoyage & Désinfection Complète VPSP',
      hours: 3,
      icon: 'sparkles',
      color: 'cyan',
      desc: 'Désinfection intégrale de la cellule sanitaire aux normes ARS. Remet l’ambulance à 100% de propreté.',
      revenue: 0,
      repGain: 15,
      restoreVpsp: true
    },
    {
      id: 'log_rearmement_pharma',
      category: 'logistique',
      categoryLabel: 'Pôle Logistique & Parc',
      title: 'Inventaire Pharmacie & Réarmement DAE / O2',
      hours: 2,
      icon: 'package-check',
      color: 'rose',
      desc: 'Contrôle des péremptions, remplacement des électrodes et réarmement des bouteilles d’oxygène.',
      revenue: 0,
      repGain: 8,
      restockSupplies: true
    },
    {
      id: 'log_maintenance_flotte',
      category: 'logistique',
      categoryLabel: 'Pôle Logistique & Parc',
      title: 'Maintenance Préventive du Parc Automobile',
      hours: 4,
      icon: 'wrench',
      color: 'orange',
      desc: 'Contrôle des organes de sécurité, éclairages prioritaires et révision préventive de la flotte.',
      revenue: 0,
      repGain: 10,
      repairVehicles: true
    }
  ],

  // Contrôle légal préalable avant d'assigner une tâche ou une mission à un salarié
  checkLaborLawRest(salarie) {
    if (salarie.contractType !== 'salarie') {
      return { ok: true, isSalarie: false };
    }

    const now = Date.now();
    // 1. Repos quotidien consécutif obligatoire (11 heures - Art. L3131-1)
    if (salarie.mandatoryRestUntil && now < salarie.mandatoryRestUntil) {
      const remainingMs = salarie.mandatoryRestUntil - now;
      const remainingSec = Math.ceil(remainingMs / 1000);
      const remainingHrs = Math.ceil(remainingSec / 10);
      return {
        ok: false,
        reason: 'repos_11h',
        remainingSec,
        message: `Repos quotidien obligatoire de 11h consécutives en cours (Code du Travail Art. L3131-1). Reprise légale autorisée dans ${remainingSec}s (~${remainingHrs}h simulées). Cette obligation légale ne s’applique qu’aux salariés, pas aux bénévoles.`
      };
    }

    // 2. Déjà engagé sur une vacation
    if (salarie.currentVacation) {
      return {
        ok: false,
        reason: 'in_vacation',
        message: `Déjà en cours de vacation : « ${salarie.currentVacation.title} » (${salarie.currentVacation.hours}h).`
      };
    }

    return { ok: true, isSalarie: true };
  },

  // Affectation d'un salarié à une vacation (Formation, Administratif, Logistique)
  assignSalarieTask(game, salarieId, taskId) {
    const salarie = game.volunteers.find(v => v.id === salarieId);
    if (!salarie || salarie.contractType !== 'salarie') {
      game.showToast('Erreur RH', 'Ce personnel n’est pas sous contrat salarié permanent.', 'orange');
      return;
    }

    const task = this.salarieTasksCatalog.find(t => t.id === taskId);
    if (!task) return;

    // Contrôle impératif du Code du Travail
    const check = this.checkLaborLawRest(salarie);
    if (!check.ok) {
      game.showToast('🛑 Code du Travail (Art. L3131-1)', check.message, 'red');
      return;
    }

    // Qualification formateur si requis
    if (task.trainerRank && !salarie.isTrainer) {
      if (!['CE', 'CD', 'Cadre'].includes(salarie.rank)) {
        game.showToast('Compétence Requise', `Cette session requiert un formateur qualifié (${task.trainerRank}).`, 'orange');
        return;
      }
    }

    // Durée réelle de simulation : 1h de travail = 8 secondes réelles
    const simDurationSec = Math.max(12, task.hours * 8);
    const now = Date.now();

    salarie.status = 'vacation';
    salarie.currentVacation = {
      taskId: task.id,
      title: task.title,
      cat: task.category,
      hours: task.hours,
      startedAt: now,
      endsAt: now + (simDurationSec * 1000),
      totalSimSec: simDurationSec
    };

    game.showToast(
      'Vacation Salarié Lancée',
      `👔 ${salarie.name} débute « ${task.title} » (${task.hours}h imputées sur son contrat mensuel de 151h).`,
      'blue'
    );

    game.saveGame();
    game.updateStatsUI();
    this.openSalarieManagementModal(game);
  },

  // Clôture d'une vacation salariée, imputation des heures et enclenchement des 11h de repos obligatoire
  completeSalarieTask(game, salarie, vacation) {
    const task = this.salarieTasksCatalog.find(t => t.id === vacation.taskId) || {
      title: vacation.title,
      hours: vacation.hours,
      revenue: 0,
      repGain: 10
    };

    // 1. Comptabilisation des heures
    salarie.monthlyHoursWorked = (salarie.monthlyHoursWorked || 0) + task.hours;
    salarie.todayHoursWorked = (salarie.todayHoursWorked || 0) + task.hours;

    // 2. Gestion des heures supplémentaires (au-delà de 151h mensuelles)
    let overtimeNotice = '';
    if (salarie.monthlyHoursWorked > this.laborLawConfig.monthlyHoursQuota) {
      salarie.monthlyOvertimeHours = salarie.monthlyHoursWorked - this.laborLawConfig.monthlyHoursQuota;
      const overtimeCost = Math.round(task.hours * this.laborLawConfig.overtimeRate);
      if (game.resources.money >= overtimeCost) {
        game.resources.money -= overtimeCost;
      }
      overtimeNotice = ` ⚠️ Heures Supp' : Dépassement des 151h mensuelles (${salarie.monthlyOvertimeHours}h supp au total). Majoration légale de +25% appliquée (-${overtimeCost} €).`;
    }

    // 3. Application des bénéfices de la vacation
    if (task.revenue) {
      game.resources.money += task.revenue;
    }
    if (task.repGain) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + task.repGain;
    }
    if (task.grantHoursValorisation && game.grants) {
      game.grants.totalVolunteerHours = (game.grants.totalVolunteerHours || 0) + task.grantHoursValorisation;
    }
    if (task.restoreVpsp) {
      const vpsp = game.vehicles.find(v => v.type === 'VPSP');
      if (vpsp) {
        vpsp.cleanliness = 100;
        vpsp.needsRearming = false;
      }
    }
    if (task.restockSupplies) {
      if (game.logistics) {
        game.logistics.woundKits = (game.logistics.woundKits || 10) + 12;
        game.logistics.oxygenBottles = (game.logistics.oxygenBottles || 4) + 4;
      }
    }
    if (task.repairVehicles) {
      game.vehicles.forEach(v => {
        v.mechanical = Math.min(100, (v.mechanical || 80) + 25);
        v.isBrokenDown = false;
      });
    }

    // 4. Déclenchement impératif du repos légal de 11h consécutives (Code du Travail Art. L3131-1)
    salarie.mandatoryRestUntil = Date.now() + (this.laborLawConfig.restSimSeconds * 1000);
    salarie.status = 'repos_legal';
    salarie.currentVacation = null;

    if (!salarie.vacationHistory) salarie.vacationHistory = [];
    salarie.vacationHistory.unshift({
      title: task.title,
      hours: task.hours,
      completedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      revenue: task.revenue || 0
    });
    if (salarie.vacationHistory.length > 8) salarie.vacationHistory.pop();

    game.showToast(
      'Vacation Terminée & Repos Légal (11h)',
      `« ${task.title} » terminée par ${salarie.name} (+${task.revenue || 0} €). En application du Code du Travail (Art. L3131-1), 11h consécutives de repos obligatoire sont enclenchées.${overtimeNotice}`,
      'green'
    );

    game.saveGame();
    game.updateStatsUI();
  },

  // Enregistrement d'un retour de mission terrain pour un salarié
  recordMissionForSalarie(salarie, mission, game) {
    if (!salarie || salarie.contractType !== 'salarie') return;

    const missionHours = mission.durationHours || Math.max(2, Math.round((mission.durationSeconds || 3600) / 3600));

    salarie.monthlyHoursWorked = (salarie.monthlyHoursWorked || 0) + missionHours;
    salarie.todayHoursWorked = (salarie.todayHoursWorked || 0) + missionHours;

    let overtimeMsg = '';
    if (salarie.monthlyHoursWorked > this.laborLawConfig.monthlyHoursQuota) {
      salarie.monthlyOvertimeHours = salarie.monthlyHoursWorked - this.laborLawConfig.monthlyHoursQuota;
      const otCost = Math.round(missionHours * this.laborLawConfig.overtimeRate);
      if (game.resources.money >= otCost) {
        game.resources.money -= otCost;
      }
      overtimeMsg = ` (${salarie.monthlyOvertimeHours}h supp' au mois, majoration légale +25% appliquée)`;
    }

    // Repos légal obligatoire de 11h consécutives (Art. L3131-1)
    salarie.mandatoryRestUntil = Date.now() + (this.laborLawConfig.restSimSeconds * 1000);
    salarie.status = 'repos_legal';

    if (!salarie.vacationHistory) salarie.vacationHistory = [];
    salarie.vacationHistory.unshift({
      title: `Mission Terrain : ${mission.title}`,
      hours: missionHours,
      completedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      revenue: mission.rewardMoney || 0
    });

    game.showToast(
      'Repos Obligatoire Code du Travail (11h)',
      `${salarie.name} (salarié) termine son engagement terrain (${missionHours}h de travail). 11h consécutives de repos obligatoire enclenchées (Art. L3131-1).${overtimeMsg}`,
      'blue'
    );
  },

  // Dérogation d'urgence exceptionnelle (Crise majeure / NOVI)
  forceDerogationRest(game, salarieId) {
    const salarie = game.volunteers.find(v => v.id === salarieId);
    if (!salarie) return;

    if (!confirm(`⚠️ DÉROGATION AU CODE DU TRAVAIL (URGENCE SÉCURITÉ CIVILE) :\n\nFaire reprendre le travail à ${salarie.name} avant la fin de ses 11h de repos obligatoire constitue une dérogation au droit commun du travail (Art. L3131-1).\n\nConséquences :\n- Prime de pénibilité exceptionnelle : -150 €\n- Avertissement Inspection du Travail & Perte de -10 pts de réputation\n- Fatigue accrue du salarié\n\nConfirmez-vous cette décision de crise ?`)) {
      return;
    }

    game.resources.money = Math.max(0, game.resources.money - 150);
    game.resources.reputationScore = Math.max(0, (game.resources.reputationScore || 50) - 10);
    salarie.mandatoryRestUntil = null;
    salarie.status = 'dispo';
    salarie.energy = Math.max(15, (salarie.energy || 70) - 25);

    game.showToast(
      'Dérogation Exceptionnelle Accordée',
      `Dérogation enregistrée pour ${salarie.name}. Prime de pénibilité versée (-150 €), avertissement inspection du travail (-10 réputation).`,
      'orange'
    );

    game.saveGame();
    game.updateStatsUI();
    this.openSalarieManagementModal(game);
  },

  // Surveillance en direct de l'horloge pour les vacations et repos
  updateSalariesClock(game) {
    if (!game.volunteers) return;
    const now = Date.now();

    game.volunteers.forEach(v => {
      if (v.contractType === 'salarie') {
        // A. Vacation en cours
        if (v.currentVacation && now >= v.currentVacation.endsAt) {
          const vac = v.currentVacation;
          this.completeSalarieTask(game, v, vac);
        }

        // B. Fin de repos obligatoire de 11h
        if (v.status === 'repos_legal' && v.mandatoryRestUntil && now >= v.mandatoryRestUntil) {
          v.status = 'dispo';
          v.mandatoryRestUntil = null;
          v.todayHoursWorked = 0;
          game.showToast(
            'Reprise de Service Salarié',
            `✓ ${v.name} a achevé ses 11 heures de repos consécutives (Code du Travail). Il est de nouveau disponible pour vacation.`,
            'green'
          );
          game.saveGame();
          game.updateStatsUI();
        }
      }
    });
  },

  // Ouverture de l'interface complète de gestion des Salariés & Code du Travail
  openSalarieManagementModal(game) {
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    if (!modal || !body) return;

    modal.classList.remove('hidden');
    title.textContent = 'Direction RH : Salariés & Code du Travail';
    subtitle.textContent = 'Forfait 151h mensuelles, heures supplémentaires, vacations et repos obligatoire de 11h';
    icon.setAttribute('data-lucide', 'briefcase');

    body.innerHTML = this.renderSalarieManagementHTML(game);
    if (window.lucide) window.lucide.createIcons();
  },

  renderSalarieManagementHTML(game) {
    const salaries = (game.volunteers || []).filter(v => v.contractType === 'salarie');

    return `
      <div class="space-y-6">
        <!-- Bandeau d'information réglementaire officiel -->
        <div class="p-4 rounded-2xl glass-card border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-blue-50/70 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5">
              <i data-lucide="scale" class="w-4 h-4 text-indigo-600"></i>
              Réglementation Code du Travail vs Bénévolat
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
              ${salaries.length} cadre(s) salarié(s) permanent(s)
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 pt-1">
            <div class="p-2.5 rounded-xl bg-white/80 border border-indigo-100 space-y-1">
              <strong class="text-indigo-900 block text-[11px] uppercase">👔 Salariés Permanents (Droit du Travail) :</strong>
              <p class="text-[11px] leading-relaxed text-slate-600">
                • <strong>Forfait mensuel : 151 heures</strong> (35h/semaine). Tout dépassement bascule en <strong>heures supplémentaires rémunérées à +25%</strong>.<br>
                • <strong>Repos quotidien légal obligatoire : 11 heures consécutives</strong> (Art. L3131-1) après toute vacation ou mission.
              </p>
            </div>
            <div class="p-2.5 rounded-xl bg-white/80 border border-slate-200 space-y-1">
              <strong class="text-slate-800 block text-[11px] uppercase">🤝 Bénévoles Associatifs :</strong>
              <p class="text-[11px] leading-relaxed text-slate-600">
                • <strong>Exclus du Code du Travail</strong>. Aucun contrat ni contingent horaire.<br>
                • Régis uniquement par leur disponibilité volontaire, leur niveau d’énergie (fatigue) et leur motivation.
              </p>
            </div>
          </div>
        </div>

        ${salaries.length === 0 ? `
          <div class="p-8 text-center rounded-2xl glass-card space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto text-xl">👔</div>
            <h4 class="text-sm font-black text-slate-800">Aucun salarié permanent recruté</h4>
            <p class="text-xs text-slate-500 max-w-md mx-auto">
              Votre antenne fonctionne actuellement uniquement avec des bénévoles et volontaires. Rendez-vous dans le Pôle Recrutement pour embaucher un cadre permanent 35h (2 200 €/mois).
            </p>
            <button onclick="window.game.openModule('recrutement')" class="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition">
              Aller au Recrutement ➜
            </button>
          </div>
        ` : `
          <!-- Liste des Salariés -->
          <div class="space-y-4">
            ${salaries.map(sal => {
              const worked = sal.monthlyHoursWorked || 0;
              const quota = sal.contractMonthlyHours || 151;
              const pct = Math.min(100, Math.round((worked / quota) * 100));
              const overtime = sal.monthlyOvertimeHours || (worked > quota ? worked - quota : 0);
              const now = Date.now();
              const isResting = sal.status === 'repos_legal' && sal.mandatoryRestUntil && now < sal.mandatoryRestUntil;
              const restSecLeft = isResting ? Math.ceil((sal.mandatoryRestUntil - now) / 1000) : 0;
              const isVacation = sal.status === 'vacation' && sal.currentVacation;

              return `
                <div class="p-5 rounded-2xl glass-card space-y-4 border border-indigo-100/90 shadow-sm">
                  <!-- Header salarié -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <span class="text-3xl">${sal.avatar || '👔'}</span>
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-black text-slate-900">${sal.name}</h4>
                          <span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-800">CDI 35h • 2 200 €/mois</span>
                          ${sal.isTrainer ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Formateur Agréé</span>' : ''}
                        </div>
                        <span class="text-xs text-slate-500 font-semibold">${sal.role || 'Cadre Opérationnel & Logistique'} (${sal.rank})</span>
                      </div>
                    </div>

                    <!-- Badge Statut Code du Travail -->
                    <div>
                      ${isResting ? `
                        <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-right">
                          <span class="text-[10px] font-black text-amber-800 flex items-center gap-1 justify-end">
                            <i data-lucide="hourglass" class="w-3.5 h-3.5 animate-spin text-amber-600"></i>
                            Repos Légal Obligatoire (11h)
                          </span>
                          <span class="text-xs font-mono font-bold text-amber-900">${restSecLeft}s restantes</span>
                        </div>
                      ` : isVacation ? `
                        <div class="p-2.5 rounded-xl bg-blue-50 border border-blue-300 text-right">
                          <span class="text-[10px] font-black text-pc-blue flex items-center gap-1 justify-end">
                            <i data-lucide="clock" class="w-3.5 h-3.5 animate-pulse"></i>
                            En Vacation Active
                          </span>
                          <span class="text-xs font-bold text-slate-800">${sal.currentVacation.title}</span>
                        </div>
                      ` : `
                        <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-right">
                          <span class="text-[10px] font-black text-emerald-800 flex items-center gap-1 justify-end">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
                            Repos Légal Conforme
                          </span>
                          <span class="text-xs font-bold text-emerald-900">Disponible pour vacation</span>
                        </div>
                      `}
                    </div>
                  </div>

                  <!-- Jauge des Heures Mensuelles & Heures Supplémentaires -->
                  <div class="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <div>
                        <span class="font-extrabold text-slate-800">Heures Travaillées ce Mois-ci :</span>
                        <span class="font-mono font-black ml-1 text-pc-blue">${worked} h / ${quota} h</span>
                      </div>
                      ${overtime > 0 ? `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 animate-pulse">
                          ⚠️ +${overtime}h Heures Supplémentaires (+25%)
                        </span>
                      ` : `
                        <span class="text-[11px] text-slate-500 font-bold">${quota - worked}h restantes au contrat</span>
                      `}
                    </div>
                    <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-300 ${overtime > 0 ? 'bg-gradient-to-r from-pc-blue to-rose-600' : 'bg-pc-blue'}" style="width: ${pct}%"></div>
                    </div>
                  </div>

                  <!-- Affectation à des vacations spécifiques -->
                  <div class="space-y-2">
                    <h5 class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <i data-lucide="layers" class="w-3.5 h-3.5 text-pc-blue"></i>
                      Affecter une Vacation à ${sal.name}
                    </h5>

                    ${isResting ? `
                      <div class="p-3.5 rounded-xl bg-amber-50 text-amber-900 text-xs flex items-center justify-between gap-3 border border-amber-200">
                        <div class="leading-relaxed">
                          ⚠️ <strong>Protection Salariale Active :</strong> En application de l’article L3131-1 du Code du travail, les vacations sont bloquées jusqu’à la fin des 11h consécutives de repos.
                        </div>
                        <button onclick="window.ProtecPersonnel.forceDerogationRest(window.game, '${sal.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white transition flex-shrink-0" title="Déroger exceptionnellement pour urgence Sécurité Civile">
                          Déroger d’Urgence (-150 €)
                        </button>
                      </div>
                    ` : isVacation ? `
                      <div class="p-3.5 rounded-xl bg-blue-50 text-blue-900 text-xs border border-blue-200">
                        Vacation « <strong>${sal.currentVacation.title}</strong> » en cours. Le salarié accomplira ses 11h de repos obligatoire dès la fin de cette tâche.
                      </div>
                    ` : `
                      <!-- Grille des tâches disponibles -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        ${this.salarieTasksCatalog.map(task => `
                          <div class="p-3 rounded-xl glass-card flex flex-col justify-between space-y-2 border border-slate-200 hover:border-pc-blue/50 transition">
                            <div>
                              <div class="flex items-center justify-between">
                                <span class="px-2 py-0.5 rounded text-[9px] font-black bg-${task.color}-100 text-${task.color}-800 uppercase">
                                  ${task.category}
                                </span>
                                <span class="text-xs font-black text-slate-800 font-mono">${task.hours}h</span>
                              </div>
                              <h6 class="text-xs font-bold text-slate-900 mt-1">${task.title}</h6>
                              <p class="text-[10px] text-slate-500 mt-0.5 leading-snug">${task.desc}</p>
                            </div>
                            <div class="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span class="text-[10px] font-extrabold text-emerald-700">${task.revenue ? `+${task.revenue} €` : `+${task.repGain} pts`}</span>
                              <button onclick="window.ProtecPersonnel.assignSalarieTask(window.game, '${sal.id}', '${task.id}')" class="px-2.5 py-1 rounded-lg text-xs font-black bg-pc-blue text-white hover:bg-pc-blue-light transition">
                                Lancer
                              </button>
                            </div>
                          </div>
                        `).join('')}
                      </div>
                    `}
                  </div>

                  <!-- Historique des vacations du mois -->
                  ${(sal.vacationHistory && sal.vacationHistory.length > 0) ? `
                    <div class="space-y-1.5 pt-2 border-t border-slate-100">
                      <span class="text-[10px] font-black uppercase text-slate-500">Dernières vacations du mois :</span>
                      <div class="flex flex-wrap gap-2">
                        ${sal.vacationHistory.map(h => `
                          <span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                            ${h.title} (<strong>${h.hours}h</strong> à ${h.completedAt}) ${h.revenue ? `• +${h.revenue}€` : ''}
                          </span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  // =========================================================================
  // SYSTÈME DE POSTES SALARIÉS (CDD / CDI) & ENTRETIENS DE RECRUTEMENT
  // =========================================================================

  // 1. Modale d'ouverture de poste (Service Civique ou Salarié)
  openJobOfferModal(game, defaultContractType = 'CDI') {
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    if (!modal || !body) return;

    modal.classList.remove('hidden');
    const isSC = defaultContractType === 'service_civique';
    title.textContent = isSC ? 'Ouverture de Mission de Service Civique' : 'Création & Publication d’Offre de Recrutement';
    subtitle.textContent = isSC ? 'Définissez la mission d’intérêt général (18-25 ans, 24-35h/semaine, 115 €/mois antenne)' : 'Définissez le contrat (CDD/CDI/Service Civique), les missions et la rémunération';
    icon.setAttribute('data-lucide', isSC ? 'award' : 'briefcase');

    body.innerHTML = `
      <form onsubmit="event.preventDefault(); window.ProtecPersonnel.submitJobOffer(window.game);" class="space-y-4">
        <!-- Bannière explicative -->
        <div id="job-banner-box" class="p-3.5 rounded-2xl glass-card ${isSC ? 'bg-amber-50/80 border-amber-200 text-amber-950' : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'} border text-xs space-y-1">
          <span class="font-black flex items-center gap-1.5 ${isSC ? 'text-amber-900' : 'text-indigo-900'}">
            <i data-lucide="${isSC ? 'award' : 'megaphone'}" class="w-4 h-4 ${isSC ? 'text-amber-600' : 'text-indigo-600'}"></i>
            <span id="job-banner-title">${isSC ? 'Plateforme Nationale du Service Civique (18-25 ans)' : 'Diffusion Réseau Sécurité Civile, APEC & France Travail'}</span>
          </span>
          <p id="job-banner-desc" class="text-[11px] text-slate-600 leading-relaxed">
            ${isSC 
              ? 'Dès l’ouverture de la mission, des candidatures de jeunes motivés (18-25 ans) tomberont dans les heures suivantes. Vous pourrez leur faire passer un entretien de sélection avant signature du contrat d’engagement (115 €/mois pris en charge par l’antenne).' 
              : 'Dès l\'ouverture du poste, des candidatures ciblées de professionnels de l\'urgence tomberont dans les heures suivantes. Vous pourrez leur faire passer un entretien d\'embauche individuel avant d\'engager votre antenne.'}
          </p>
        </div>

        <!-- Type de contrat & Durée -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-black text-slate-800 uppercase tracking-wide">Type de Recrutement :</label>
            <select id="job-contract-type" onchange="window.ProtecPersonnel.handleContractTypeChange(this.value)" class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold text-slate-900 border border-slate-300">
              <option value="service_civique" ${isSC ? 'selected' : ''}>🎖️ Service Civique (18-25 ans • 115 €/mois antenne)</option>
              <option value="CDI" ${defaultContractType === 'CDI' ? 'selected' : ''}>👔 CDI - Salarié Permanent (151h • 2 200 €/mois)</option>
              <option value="CDD" ${defaultContractType === 'CDD' ? 'selected' : ''}>💼 CDD - Renfort Saisonnier (151h • 2 200 €/mois)</option>
            </select>
          </div>

          <div id="job-duration-container" class="space-y-1.5 ${defaultContractType === 'CDD' ? '' : 'hidden'}">
            <label class="block text-xs font-black text-slate-800 uppercase tracking-wide">Durée du CDD :</label>
            <select id="job-duration-select" class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold text-slate-900 border border-slate-300">
              <option value="3">3 Mois (Renfort d'urgence estival / hivernal)</option>
              <option value="6" selected>6 Mois (Mission de développement)</option>
              <option value="12">12 Mois (Projet territorial pluriannuel)</option>
            </select>
          </div>
        </div>

        <!-- Intitulé de la mission / poste -->
        <div class="space-y-1.5">
          <label class="block text-xs font-black text-slate-800 uppercase tracking-wide">Intitulé de la Mission / Poste :</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="text" id="job-title-input" value="${isSC ? 'Volontaire - Ambassadeur Secours & Prévention' : 'Coordinateur des Opérations & Formateur'}" required class="px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold text-slate-900 border border-slate-300 w-full" />
            <select id="job-preset-titles" onchange="if(this.value) document.getElementById('job-title-input').value = this.value;" class="px-3 py-2.5 rounded-xl glass-input text-xs text-slate-700 border border-slate-300">
              ${isSC ? `
                <option value="">Sélectionner une mission type...</option>
                <option value="Volontaire - Ambassadeur Secours & Prévention">Volontaire - Ambassadeur Secours & Prévention</option>
                <option value="Volontaire - Soutien Logistique & Crise">Volontaire - Soutien Logistique & Crise</option>
                <option value="Volontaire - Sensibilisation Gestes Qui Sauvent">Volontaire - Sensibilisation Gestes Qui Sauvent</option>
                <option value="Volontaire - Action Sociale & Solidarité">Volontaire - Action Sociale & Solidarité</option>
              ` : `
                <option value="">Sélectionner un titre type...</option>
                <option value="Coordinateur des Opérations & Secours">Coordinateur des Opérations & Secours</option>
                <option value="Responsable Pédagogique & Formateur">Responsable Pédagogique & Formateur</option>
                <option value="Gestionnaire de Flotte & Logistique">Gestionnaire de Flotte & Logistique</option>
                <option value="Chargé de Mission Subventions & Direction">Chargé de Mission Subventions & Direction</option>
              `}
            </select>
          </div>
        </div>

        <!-- Rémunération proposée / Indemnité -->
        <div class="space-y-1.5">
          <label class="block text-xs font-black text-slate-800 uppercase tracking-wide">Indemnité ou Salaire Mensuel (€) :</label>
          <div class="relative">
            <input type="number" id="job-salary-input" min="${isSC ? '115' : '1900'}" max="${isSC ? '115' : '3200'}" step="50" value="${isSC ? '115' : '2200'}" ${isSC ? 'readonly' : ''} required class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono font-black text-slate-900 border border-slate-300 ${isSC ? 'bg-slate-100' : ''}" />
            <span id="job-salary-suffix" class="absolute right-3.5 top-2.5 text-xs text-slate-500 font-bold">${isSC ? '€ / mois (charge antenne légale • 504 € État)' : '€ / mois (forfait 151h)'}</span>
          </div>
          <p id="job-salary-hint" class="text-[10px] text-slate-500">${isSC ? 'L’indemnité principale (504,98 €) est versée directement par l’État via l’ASP. L’antenne verse uniquement la prestation légale de subsistance (114,85 €).' : 'Un salaire attractif attire des candidats plus expérimentés avec des notes d’adéquation plus élevées.'}</p>
        </div>

        <!-- Missions confiées au poste -->
        <div class="space-y-2">
          <label class="block text-xs font-black text-slate-800 uppercase tracking-wide">Missions Confiées (Priorités) :</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label class="p-2.5 rounded-xl border border-slate-200 glass-card flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition">
              <input type="checkbox" name="job-mission" value="formation" checked class="w-4 h-4 text-pc-blue rounded" />
              <div>
                <span class="font-bold text-slate-800 block">🎓 Pôle Pédagogique & Citoyen</span>
                <span class="text-[10px] text-slate-500">Initiations GQS, PSC1, soutien aux formateurs</span>
              </div>
            </label>

            <label class="p-2.5 rounded-xl border border-slate-200 glass-card flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition">
              <input type="checkbox" name="job-mission" value="operationnel" checked class="w-4 h-4 text-pc-blue rounded" />
              <div>
                <span class="font-bold text-slate-800 block">🚑 Pôle Opérationnel & Secours</span>
                <span class="text-[10px] text-slate-500">Postes de secours DPS, renforts gardes d'urgence</span>
              </div>
            </label>

            <label class="p-2.5 rounded-xl border border-slate-200 glass-card flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition">
              <input type="checkbox" name="job-mission" value="logistique" class="w-4 h-4 text-pc-blue rounded" />
              <div>
                <span class="font-bold text-slate-800 block">🔧 Pôle Logistique & Pharmacie</span>
                <span class="text-[10px] text-slate-500">Entretien du matériel, réarmement des sacs et véhicules</span>
              </div>
            </label>

            <label class="p-2.5 rounded-xl border border-slate-200 glass-card flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition">
              <input type="checkbox" name="job-mission" value="social" class="w-4 h-4 text-pc-blue rounded" />
              <div>
                <span class="font-bold text-slate-800 block">🥫 Pôle Action Sociale & Solidaire</span>
                <span class="text-[10px] text-slate-500">Maraudes de nuit, centres d'hébergement, écoute</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Frais de publication & validation -->
        <div class="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div class="text-xs text-slate-500">
            Frais de publication : <strong id="job-cost-display" class="text-slate-900 font-mono">${isSC ? '50 €' : '180 €'}</strong> <span id="job-cost-desc" class="text-[10px] text-slate-400">(${isSC ? 'dossier agrément Agence Service Civique' : 'diffusion nationale'})</span>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.game.closeModal()" class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Annuler</button>
            <button type="submit" id="job-submit-btn" class="px-5 py-2.5 rounded-xl text-xs font-black ${isSC ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'} hover:brightness-110 text-white shadow-md transition flex items-center gap-2">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>${isSC ? 'Publier la Mission (50 €)' : 'Publier l’Offre de Poste (180 €)'}</span>
            </button>
          </div>
        </div>
      </form>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  handleContractTypeChange(type) {
    const isSC = type === 'service_civique';
    const isCDD = type === 'CDD';

    const durBox = document.getElementById('job-duration-container');
    if (durBox) durBox.classList.toggle('hidden', !isCDD);

    const bannerBox = document.getElementById('job-banner-box');
    const bannerTitle = document.getElementById('job-banner-title');
    const bannerDesc = document.getElementById('job-banner-desc');
    const titleInput = document.getElementById('job-title-input');
    const presetSelect = document.getElementById('job-preset-titles');
    const salaryInput = document.getElementById('job-salary-input');
    const salarySuffix = document.getElementById('job-salary-suffix');
    const salaryHint = document.getElementById('job-salary-hint');
    const costDisp = document.getElementById('job-cost-display');
    const costDesc = document.getElementById('job-cost-desc');
    const submitBtn = document.getElementById('job-submit-btn');

    if (isSC) {
      if (bannerBox) {
        bannerBox.className = 'p-3.5 rounded-2xl glass-card bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-1';
      }
      if (bannerTitle) bannerTitle.textContent = 'Plateforme Nationale du Service Civique (18-25 ans)';
      if (bannerDesc) bannerDesc.textContent = 'Dès l’ouverture de la mission, des candidatures de jeunes motivés (18-25 ans) tomberont dans les heures suivantes. Vous pourrez leur faire passer un entretien de sélection avant signature du contrat d’engagement (115 €/mois pris en charge par l’antenne).';
      if (titleInput) titleInput.value = 'Volontaire - Ambassadeur Secours & Prévention';
      if (presetSelect) {
        presetSelect.innerHTML = `
          <option value="">Sélectionner une mission type...</option>
          <option value="Volontaire - Ambassadeur Secours & Prévention">Volontaire - Ambassadeur Secours & Prévention</option>
          <option value="Volontaire - Soutien Logistique & Crise">Volontaire - Soutien Logistique & Crise</option>
          <option value="Volontaire - Sensibilisation Gestes Qui Sauvent">Volontaire - Sensibilisation Gestes Qui Sauvent</option>
          <option value="Volontaire - Action Sociale & Solidarité">Volontaire - Action Sociale & Solidarité</option>
        `;
      }
      if (salaryInput) {
        salaryInput.value = 115;
        salaryInput.readOnly = true;
        salaryInput.classList.add('bg-slate-100');
      }
      if (salarySuffix) salarySuffix.textContent = '€ / mois (charge antenne légale • 504 € État)';
      if (salaryHint) salaryHint.textContent = 'L’indemnité principale (504,98 €) est versée directement par l’État via l’ASP. L’antenne verse uniquement la prestation légale de subsistance (114,85 €).';
      if (costDisp) costDisp.textContent = '50 €';
      if (costDesc) costDesc.textContent = '(dossier agrément Agence Service Civique)';
      if (submitBtn) {
        submitBtn.className = 'px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-2';
        submitBtn.querySelector('span').textContent = 'Publier la Mission (50 €)';
      }
    } else {
      if (bannerBox) {
        bannerBox.className = 'p-3.5 rounded-2xl glass-card bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs space-y-1';
      }
      if (bannerTitle) bannerTitle.textContent = 'Diffusion Réseau Sécurité Civile, APEC & France Travail';
      if (bannerDesc) bannerDesc.textContent = 'Dès l\'ouverture du poste, des candidatures ciblées de professionnels de l\'urgence tomberont dans les heures suivantes. Vous pourrez leur faire passer un entretien d\'embauche individuel avant d\'engager votre antenne.';
      if (titleInput) titleInput.value = 'Coordinateur des Opérations & Formateur';
      if (presetSelect) {
        presetSelect.innerHTML = `
          <option value="">Sélectionner un titre type...</option>
          <option value="Coordinateur des Opérations & Secours">Coordinateur des Opérations & Secours</option>
          <option value="Responsable Pédagogique & Formateur">Responsable Pédagogique & Formateur</option>
          <option value="Gestionnaire de Flotte & Logistique">Gestionnaire de Flotte & Logistique</option>
          <option value="Chargé de Mission Subventions & Direction">Chargé de Mission Subventions & Direction</option>
        `;
      }
      if (salaryInput) {
        salaryInput.value = 2200;
        salaryInput.readOnly = false;
        salaryInput.classList.remove('bg-slate-100');
      }
      if (salarySuffix) salarySuffix.textContent = '€ / mois (forfait 151h)';
      if (salaryHint) salaryHint.textContent = 'Un salaire attractif attire des candidats plus expérimentés avec des notes d’adéquation plus élevées.';
      if (costDisp) costDisp.textContent = '180 €';
      if (costDesc) costDesc.textContent = '(diffusion nationale)';
      if (submitBtn) {
        submitBtn.className = 'px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-2';
        submitBtn.querySelector('span').textContent = 'Publier l’Offre de Poste (180 €)';
      }
    }
  },

  // Soumission de l'offre et planification de la réception des candidatures
  submitJobOffer(game) {
    const contractType = document.getElementById('job-contract-type')?.value || 'CDI';
    const isSC = contractType === 'service_civique';
    const cost = isSC ? 50 : 180;

    if (game.resources.money < cost) {
      game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour publier cette ${isSC ? 'mission' : 'offre'}.`, 'orange');
      return;
    }

    const titleInput = document.getElementById('job-title-input');
    const durationSelect = document.getElementById('job-duration-select');
    const salaryInput = document.getElementById('job-salary-input');

    const title = (titleInput?.value || (isSC ? 'Volontaire Service Civique' : 'Cadre Opérationnel')).trim();
    const durationMonths = isSC ? 8 : (contractType === 'CDD' ? (parseInt(durationSelect?.value) || 6) : null);
    const salary = isSC ? 115 : (parseInt(salaryInput?.value) || 2200);

    const checkedMissions = Array.from(document.querySelectorAll('input[name="job-mission"]:checked')).map(cb => cb.value);
    if (checkedMissions.length === 0) checkedMissions.push('operationnel');

    game.resources.money -= cost;

    if (!game.jobOffers) game.jobOffers = [];
    const newOffer = {
      id: `job-${Date.now()}`,
      title,
      contractType,
      durationMonths,
      salary,
      missions: checkedMissions,
      publishedAt: Date.now(),
      status: 'ouvert',
      applicantsCount: 0
    };

    game.jobOffers.unshift(newOffer);
    game.showToast(
      isSC ? 'Mission Publiée !' : 'Offre Publiée !',
      isSC 
        ? `La mission « ${title} » est en ligne sur l’Agence du Service Civique. Les candidatures vont tomber dans les prochaines minutes !`
        : `L’offre « ${title} » (${contractType}) est en ligne. Les candidatures vont tomber dans les heures suivantes !`,
      'green'
    );

    // Programmation de l'arrivée progressive des candidatures dans les heures suivantes (simulation accélérée)
    this.scheduleIncomingApplicants(game, newOffer);

    game.saveGame();
    game.updateStatsUI();
    game.openModule('recrutement');
  },

  // Programmation de candidatures (Service Civique ou Salariées) arrivant au fil du temps
  scheduleIncomingApplicants(game, offer) {
    const isSC = offer.contractType === 'service_civique';

    // Première candidature après 10 à 20 secondes
    const delay1 = (10 + Math.random() * 10) * 1000;
    setTimeout(() => {
      if (!game.jobOffers.some(o => o.id === offer.id && o.status === 'ouvert')) return;
      if (isSC) {
        this.generateServiceCiviqueCandidate(game, offer);
      } else {
        this.generateSalarieCandidate(game, offer);
      }
    }, delay1);

    // Seconde candidature après 35 à 60 secondes
    const delay2 = (35 + Math.random() * 25) * 1000;
    setTimeout(() => {
      if (!game.jobOffers.some(o => o.id === offer.id && o.status === 'ouvert')) return;
      if (isSC) {
        this.generateServiceCiviqueCandidate(game, offer);
      } else {
        this.generateSalarieCandidate(game, offer);
      }
    }, delay2);
  },

  // Génération d'une candidature de Service Civique liée à la mission
  generateServiceCiviqueCandidate(game, offer) {
    const scPool = [
      {
        name: 'Maxime Dupont',
        age: 21,
        rank: 'PSE1',
        avatar: '🙋‍♂️',
        trait: 'dynamique',
        background: 'Étudiant en STAPS, titulaire du PSE1 et passionné par les secours d’urgence et le sport.',
        motivation: 'Je souhaite consacrer 8 mois de ma vie au service des autres et acquérir une solide expérience de terrain au sein de la Protection Civile.',
        strongMissions: ['operationnel', 'formation'],
        baseExp: 35
      },
      {
        name: 'Clara Bertrand',
        age: 19,
        rank: 'PSE1',
        avatar: '👩‍🎓',
        trait: 'sensible',
        background: 'Bénévole engagée, titulaire PSC1/PSE1, très à l’aise avec l’écoute active et la médiation.',
        motivation: 'Le soutien aux populations et les maraudes sociales me tiennent particulièrement à cœur. Je veux être utile chaque semaine auprès des équipes.',
        strongMissions: ['social', 'formation'],
        baseExp: 25
      },
      {
        name: 'Nathan Moreau',
        age: 23,
        rank: 'PSE1',
        avatar: '🧑',
        trait: 'equilibre',
        background: 'En reconversion professionnelle, rigoureux et titulaire permis B. Intéressé par la logistique et l’assistance.',
        motivation: 'Le Service Civique est pour moi l’opportunité idéale d’intégrer un réseau humain soudé, de développer des compétences d’équipe et d’agir concrètement.',
        strongMissions: ['logistique', 'operationnel'],
        baseExp: 30
      },
      {
        name: 'Inès Benali',
        age: 20,
        rank: 'PSE1',
        avatar: '🧕',
        trait: 'devoue',
        background: 'Étudiante en sciences humaines, très investie, excellente communication et sensibilisation.',
        motivation: 'Sensibiliser le grand public aux gestes qui sauvent et prêter main forte lors des dispositifs de secours sont mes deux priorités d’engagement.',
        strongMissions: ['formation', 'social'],
        baseExp: 28
      }
    ];

    const suited = scPool.filter(c => c.strongMissions.some(m => offer.missions.includes(m)));
    const pick = suited.length > 0 ? suited[Math.floor(Math.random() * suited.length)] : scPool[Math.floor(Math.random() * scPool.length)];

    const candId = `cand-sc-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newCand = {
      id: candId,
      name: pick.name,
      age: pick.age,
      type: 'service_civique',
      contractType: 'service_civique',
      jobOfferId: offer.id,
      jobOfferTitle: offer.title,
      durationMonths: 8,
      monthlySalary: 115,
      targetMissions: offer.missions,
      avatar: pick.avatar,
      rank: pick.rank,
      role: offer.title,
      skills: ['pse1', 'permis_b'],
      isTrainer: false,
      background: pick.background,
      motivation: pick.motivation,
      trait: pick.trait,
      exp: pick.baseExp,
      suitabilityScore: Math.round(82 + Math.random() * 15),
      interviewPassed: false,
      interviewReport: null
    };

    offer.applicantsCount = (offer.applicantsCount || 0) + 1;
    game.candidatures.unshift(newCand);

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'rh',
        '🎖️ Candidature Service Civique Reçue !',
        `${newCand.name} (${newCand.age} ans) a postulé à la mission « ${offer.title} ». Planifiez son entretien !`,
        `rh-${newCand.id}`
      );
    }

    game.showToast(
      '🎖️ Candidature Service Civique Reçue !',
      `${newCand.name} (${newCand.age} ans) postule à la mission « ${offer.title} ». Organisez son entretien individuel !`,
      'blue'
    );

    game.saveGame();
    game.updateStatsUI();

    if (game.currentModalKey === 'recrutement') {
      game.openModule('recrutement', true);
    }
  },

  // Génération d'une candidature salariée liée à l'offre
  generateSalarieCandidate(game, offer) {
    const candidatesPool = [
      {
        name: 'Sylvain Legrand',
        age: 34,
        rank: 'CE',
        isTrainer: true,
        avatar: '👔',
        background: '8 ans d’expérience en Sécurité Civile, ancien chef d’équipe opérationnel et formateur PSC/PSE.',
        motivation: 'Votre antenne a une excellente réputation. Je souhaite mettre mon expertise de formateur et de gestionnaire d’équipes au service de vos équipes.',
        strongMissions: ['formation', 'operationnel'],
        baseExp: 160
      },
      {
        name: 'Valérie Fontaine',
        age: 41,
        rank: 'CD',
        isTrainer: true,
        avatar: '👩‍💼',
        background: 'Ancienne cadre logistique hospitalière et officier de sécurité civile. Maîtrise des protocoles ARS et du matériel.',
        motivation: 'Spécialiste de la gestion de crise et de la pharmacie d’urgence, je recherche un poste permanent pour structurer votre parc et vos procédures.',
        strongMissions: ['logistique', 'administrative', 'operationnel'],
        baseExp: 210
      },
      {
        name: 'Romain Gauthier',
        age: 29,
        rank: 'PSE2',
        isTrainer: false,
        avatar: '👨‍💼',
        background: 'Technicien d’intervention d’urgence et ambulancier diplômé d’État, titulaire permis VPSP lourd.',
        motivation: 'Dynamique et rigoureux, je suis très motivé pour assurer la continuité opérationnelle et le suivi minutieux des véhicules et du matériel.',
        strongMissions: ['operationnel', 'logistique'],
        baseExp: 110
      },
      {
        name: 'Nathalie Mercier',
        age: 38,
        rank: 'CE',
        isTrainer: true,
        avatar: '👩‍🏫',
        background: 'Coordinatrice associative expérimentée, spécialiste des dossiers de subventions Cerfa et des relations mairies.',
        motivation: 'Mon profil allie pédagogie de terrain et rigueur administrative. Je peux booster vos subventions municipales et encadrer les postes.',
        strongMissions: ['administrative', 'formation'],
        baseExp: 180
      }
    ];

    // Choisir un candidat qui a des atouts sur les missions demandées
    const suited = candidatesPool.filter(c => c.strongMissions.some(m => offer.missions.includes(m)));
    const pick = suited.length > 0 ? suited[Math.floor(Math.random() * suited.length)] : candidatesPool[Math.floor(Math.random() * candidatesPool.length)];

    const candId = `cand-sal-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newCand = {
      id: candId,
      name: pick.name,
      age: pick.age,
      type: 'salarie',
      jobOfferId: offer.id,
      jobOfferTitle: offer.title,
      contractType: offer.contractType,
      durationMonths: offer.durationMonths,
      monthlySalary: offer.salary,
      targetMissions: offer.missions,
      avatar: pick.avatar,
      rank: pick.rank,
      role: offer.title,
      skills: [pick.rank, ...(pick.isTrainer ? ['Formateur Agréé'] : []), 'Permis VPSP', 'Gestion Crise'],
      isTrainer: pick.isTrainer,
      background: pick.background,
      motivation: pick.motivation,
      exp: pick.baseExp,
      suitabilityScore: Math.round(78 + Math.random() * 18),
      interviewPassed: false,
      interviewReport: null
    };

    offer.applicantsCount = (offer.applicantsCount || 0) + 1;
    game.candidatures.unshift(newCand);

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'rh',
        '📄 Nouvelle Candidature Salariée Reçue !',
        `${newCand.name} (${newCand.rank}) a postulé à l’offre « ${offer.title} ». Planifiez son entretien d'embauche !`,
        `rh-${newCand.id}`
      );
    }

    game.showToast(
      '📄 Candidature Salariée Reçue !',
      `${newCand.name} (${newCand.rank}) a postulé à l’offre « ${offer.title} » (${offer.contractType}). Faites-lui passer un entretien !`,
      'blue'
    );

    game.saveGame();
    game.updateStatsUI();

    // Si le joueur est sur le module recrutement, rafraîchir
    if (game.currentModalKey === 'recrutement') {
      game.openModule('recrutement', true);
    }
  },

  // 2. Modale de passage de l'entretien (Bénévole ou Salarié)
  openInterviewModal(game, candId) {
    const cand = game.candidatures.find(c => c.id === candId);
    if (!cand) return;

    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    if (!modal || !body) return;

    modal.classList.remove('hidden');
    const isSalarie = cand.type === 'salarie';
    const isSC = cand.type === 'service_civique' || cand.contractType === 'service_civique';

    title.textContent = isSC ? 'Entretien de Sélection • Service Civique' : (isSalarie ? 'Entretien d’Embauche Salarié' : 'Entretien d’Intégration Bénévole');
    subtitle.textContent = `Évaluation individuelle de ${cand.name} (${cand.age} ans) • ${isSC ? `Mission : ${cand.jobOfferTitle} (115 €/mois)` : (isSalarie ? `Candidat au poste : ${cand.jobOfferTitle}` : 'Engagement associatif')}`;
    icon.setAttribute('data-lucide', isSC ? 'award' : 'user-check');

    const q1Answer = isSC
      ? `« J'ai ${cand.age} ans et je souhaite consacrer plusieurs mois à l'utilité publique. La Protection Civile incarne des valeurs de solidarité et d'engagement citoyen qui me motivent profondément pour cette mission de Service Civique. »`
      : (isSalarie
        ? `« J’ai plusieurs années de pratique sur le terrain et en gestion de crise. Le poste de ${cand.jobOfferTitle} au sein de votre antenne correspond parfaitement à mon projet professionnel. Je suis prêt à m’investir à 100% dans le cadre du forfait 151h mensuelles pour assurer la continuité opérationnelle et encadrer les équipes. »`
        : `« Je souhaite donner de mon temps libre pour une cause d’utilité publique. Porter la tenue orange et bleue de la Protection Civile et intervenir auprès de personnes en détresse donne un vrai sens à mon engagement citoyen. »`);

    const q2Answer = isSC
      ? `« Je suis dynamique, à l'écoute et très rigoureux. Je m'adapte vite aux consignes de sécurité et je veux apprendre activement les gestes qui sauvent aux côtés des secouristes expérimentés pour être un vrai soutien pour l'antenne. »`
      : (isSalarie
        ? `« Face à l'imprévu, le respect strict des procédures de sécurité et du Code du Travail est primordial. J’attache une importance capitale à l’anticipation logistique, à la chaîne de commandement et au maintien d'un climat de confiance avec les secouristes et les autorités. »`
        : `« Je sais garder mon sang-froid et écouter attentivement. Je fais pleinement confiance à mes chefs d’équipe et je suis désireux d’apprendre les gestes techniques qui sauvent pour agir avec efficacité sans paniquer. »`);

    const q3Answer = isSC
      ? `« Je suis disponible en semaine (24h à 35h/semaine) pour aider au bon fonctionnement du poste : préparer le matériel, participer aux sensibilisations citoyennes et renforcer les équipes de secours dès que nécessaire. »`
      : (isSalarie
        ? `« Mon rôle de cadre salarié consistera à soutenir les bénévoles avec bienveillance, sans jamais les surcharger. En assurant la logistique, les formations certifiantes et la conformité administrative, je libère du temps précieux pour que les bénévoles s’épanouissent en intervention. »`
        : `« Je m'entends très bien en groupe, j’aime l’esprit d’équipe et l’entraide. Je compte m'impliquer régulièrement selon mes disponibilités déclarées et monter en qualification dès que possible. »`);

    body.innerHTML = `
      <div class="space-y-6">
        <!-- Présentation du candidat -->
        <div class="p-4 rounded-2xl glass-card flex items-start gap-4 border ${isSC ? 'border-amber-200' : 'border-indigo-100'}">
          <span class="text-4xl">${cand.avatar || '🙋'}</span>
          <div class="flex-1 space-y-1">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-black text-slate-900">${cand.name} (${cand.age} ans)</h4>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${isSC ? 'bg-amber-100 text-amber-800' : (isSalarie ? 'bg-indigo-100 text-indigo-800' : 'bg-pc-blue/15 text-pc-blue')}">
                ${isSC ? 'SERVICE CIVIQUE • 115 €/MOIS' : (isSalarie ? `SALARIÉ • ${cand.contractType}` : 'BÉNÉVOLE')}
              </span>
            </div>
            <p class="text-xs text-slate-500 font-semibold">
              ${isSC ? `Mission visée : <strong>${cand.jobOfferTitle}</strong> (Indemnité antenne 115 €/mois)` : (isSalarie ? `Poste visé : <strong>${cand.jobOfferTitle}</strong> (${cand.monthlySalary} €/mois)` : `Activité civile : <strong>${cand.job || 'Étudiant'}</strong>`)}
            </p>
            ${cand.background ? `<p class="text-[11px] text-slate-600 italic">Parcours : ${cand.background}</p>` : ''}
          </div>
        </div>

        <!-- Échange d'entretien en 3 questions clés -->
        <div class="space-y-3">
          <h5 class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
            <i data-lucide="message-square" class="w-4 h-4 text-pc-blue"></i>
            Questions du Jury d’Antenne & Réponses du Candidat
          </h5>

          <!-- Question 1 -->
          <div class="p-3.5 rounded-2xl glass-card space-y-2 border border-slate-200">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span class="w-5 h-5 rounded-full bg-pc-blue text-white flex items-center justify-center text-[10px] font-black">1</span>
              <span>${isSalarie ? 'Quelle est votre motivation pour ce poste et comment envisagez-vous votre mission ?' : 'Pourquoi souhaitez-vous vous engager à la Protection Civile ?'}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white/80 text-xs text-slate-700 border border-slate-100 italic leading-relaxed">
              ${q1Answer}
            </div>
          </div>

          <!-- Question 2 -->
          <div class="p-3.5 rounded-2xl glass-card space-y-2 border border-slate-200">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span class="w-5 h-5 rounded-full bg-pc-blue text-white flex items-center justify-center text-[10px] font-black">2</span>
              <span>${isSalarie ? 'Comment gérez-vous le stress opérationnel et les contraintes réglementaires ?' : 'Comment réagissez-vous face à la détresse d’une victime ?'}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white/80 text-xs text-slate-700 border border-slate-100 italic leading-relaxed">
              ${q2Answer}
            </div>
          </div>

          <!-- Question 3 -->
          <div class="p-3.5 rounded-2xl glass-card space-y-2 border border-slate-200">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span class="w-5 h-5 rounded-full bg-pc-blue text-white flex items-center justify-center text-[10px] font-black">3</span>
              <span>${isSalarie ? 'Quelle est votre approche managériale auprès des secouristes bénévoles ?' : 'Comment concevez-vous le travail en équipe et l’entraide ?'}</span>
            </div>
            <div class="p-2.5 rounded-xl bg-white/80 text-xs text-slate-700 border border-slate-100 italic leading-relaxed">
              ${q3Answer}
            </div>
          </div>
        </div>

        <!-- Clôture et génération du compte-rendu -->
        <div class="pt-2 border-t border-slate-200 flex items-center justify-between">
          <button onclick="window.game.openModule('recrutement')" class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
            Suspendre l'entretien
          </button>
          <button onclick="window.ProtecPersonnel.finishInterview(window.game, '${cand.id}')" class="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-2">
            <i data-lucide="file-check" class="w-4 h-4"></i>
            Clôturer l'Entretien & Générer le Compte-Rendu RH ➜
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // 3. Clôture de l'entretien et affichage du Compte-Rendu officiel
  finishInterview(game, candId) {
    const cand = game.candidatures.find(c => c.id === candId);
    if (!cand) return;

    cand.interviewPassed = true;
    const isSalarie = cand.type === 'salarie';

    // Calcul de la note de motivation
    let noteBase = isSalarie ? 15 : 14;
    if (cand.rank === 'CE' || cand.rank === 'CD') noteBase += 3;
    else if (cand.rank === 'PSE2' || cand.rank === 'PSE1') noteBase += 2;
    if (cand.isTrainer) noteBase += 2;
    const note = Math.min(20, Math.max(12, noteBase + Math.floor(Math.random() * 3)));
    cand.motivationGrade = `${note}/20`;

    let appreciation = 'Profil très motivé, prêt à s’investir pleinement avec un grand sens de l’engagement.';
    if (note >= 18) appreciation = 'Candidat exceptionnel ! Excellente maturité, vocation affirmée et adéquation remarquable.';
    else if (note >= 15) appreciation = 'Très bon candidat, sérieux et fiable. Parfaite adhésion aux valeurs de la Protection Civile.';

    cand.appreciation = appreciation;

    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    if (!modal || !body) return;

    title.textContent = 'Compte-Rendu RH d’Entretien de Recrutement';
    subtitle.textContent = `Synthèse d'évaluation de ${cand.name} • Décision finale d'intégration`;
    icon.setAttribute('data-lucide', 'award');

    body.innerHTML = `
      <div class="space-y-6">
        <!-- Bandeau Note de motivation & Appréciation -->
        <div class="p-5 rounded-2xl glass-card bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-300 flex items-center justify-between gap-4">
          <div class="space-y-1">
            <span class="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Évaluation Globale de la Commission :</span>
            <div class="text-sm font-black text-slate-900">${appreciation}</div>
            <p class="text-xs text-slate-600">Entretien validé avec mention favorable.</p>
          </div>
          <div class="text-right flex-shrink-0 bg-white/90 p-3 rounded-2xl border border-emerald-200 shadow-sm">
            <div class="text-[10px] font-black uppercase text-slate-400">Note de Motivation</div>
            <div class="text-2xl font-black text-emerald-700 font-mono">${cand.motivationGrade}</div>
          </div>
        </div>

        <!-- Détail de l'analyse RH -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Bloc Motivations analysées -->
          <div class="p-4 rounded-2xl glass-card space-y-2 border border-slate-200">
            <h5 class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <i data-lucide="heart" class="w-4 h-4 text-rose-500"></i>
              Motivations Réelles Décelées
            </h5>
            <p class="text-xs text-slate-700 leading-relaxed italic">
              « ${cand.motivation} »
            </p>
            <div class="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              ${isSalarie 
                ? 'Volonté forte d’encadrement professionnel, de rigueur et d’animation opérationnelle de la base.' 
                : 'Désir d’utilité citoyenne, générosité, contact humain et apprentissage des gestes qui sauvent.'}
            </div>
          </div>

          <!-- Bloc Disponibilités OU Fiche de Poste Salarié -->
          <div class="p-4 rounded-2xl glass-card space-y-2 border border-slate-200">
            ${isSalarie ? `
              <!-- POUR LES SALARIÉS : PAS DE DISPONIBILITÉS PERSONNELLES CAR C'EST LE POSTE QUI JOUE -->
              <h5 class="text-xs font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                <i data-lucide="briefcase" class="w-4 h-4 text-indigo-600"></i>
                Adéquation au Poste & Contrat de Travail
              </h5>
              <div class="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                <span class="font-bold block">ℹ️ Disponibilités Personnelles : Non applicables</span>
                <p class="text-[11px] text-slate-600 leading-snug">
                  C’est la fiche de poste et le contrat qui déterminent les vacations (forfait légal de 151h mensuelles, 35h/semaine sous le Code du Travail).
                </p>
              </div>
              <div class="space-y-1 pt-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-500">Poste :</span>
                  <strong class="text-slate-800">${cand.jobOfferTitle}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Contrat proposé :</span>
                  <strong class="text-indigo-700">${cand.contractType} ${cand.durationMonths ? `(${cand.durationMonths} mois)` : 'Permanent'}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Salaire convenu :</span>
                  <strong class="text-emerald-700 font-mono">${cand.monthlySalary} € / mois</strong>
                </div>
              </div>
            ` : `
              <!-- POUR LES BÉNÉVOLES : DISPONIBILITÉS DÉTAILLÉES OBLIGATOIRES -->
              <h5 class="text-xs font-black uppercase text-pc-blue tracking-wider flex items-center gap-1.5">
                <i data-lucide="calendar" class="w-4 h-4 text-pc-blue"></i>
                Disponibilités Déclarées du Bénévole
              </h5>
              <div class="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                <span class="font-bold block">Jours de Disponibilité :</span>
                <span class="text-xs font-black text-pc-blue">${(cand.dispoJours || ['Samedi', 'Dimanche']).join(', ')}</span>
              </div>
              <div class="space-y-1 pt-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-500">Profil socioprofessionnel :</span>
                  <strong class="text-slate-800">${cand.dispoType || 'Bénévole standard'}</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Métier / Études :</span>
                  <strong class="text-slate-800">${cand.job || 'Étudiant'}</strong>
                </div>
              </div>
            `}
          </div>
        </div>

        <!-- Compétences & Atouts découverts -->
        <div class="p-3.5 rounded-2xl glass-card space-y-2 border border-slate-200 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-slate-800 uppercase text-[10px]">Qualifications & Compétences Validées :</span>
            <span class="text-[10px] font-bold text-slate-500">${cand.isTrainer ? 'Formateur Agréé' : 'Secouriste'}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${(cand.skills || ['PSE1']).map(s => `
              <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                ✓ ${s}
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Décision finale -->
        <div class="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <button onclick="window.game.rejectCandidature('${cand.id}')" class="px-4 py-2.5 rounded-xl text-xs font-bold glass-button text-rose-700 hover:bg-rose-50 transition">
            Décliner la Candidature
          </button>
          
          <button onclick="window.ProtecPersonnel.hireCandidateFromInterview(window.game, '${cand.id}')" class="px-6 py-2.5 rounded-xl text-xs font-black ${isSalarie ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'} hover:brightness-110 text-white shadow-lg transition flex items-center gap-2">
            <i data-lucide="check" class="w-4 h-4"></i>
            ${isSalarie ? `Signer le Contrat de Travail (${cand.contractType})` : 'Valider l’Intégration & Signer la Charte'}
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // 4. Intégration ou Embauche effective après entretien
  hireCandidateFromInterview(game, candId) {
    const cand = game.candidatures.find(c => c.id === candId);
    if (!cand) return;

    if (cand.type === 'service_civique' || cand.contractType === 'service_civique') {
      // Signature Engagement Service Civique
      const newVol = {
        id: `sc-${Date.now()}`,
        name: cand.name,
        role: cand.jobOfferTitle || 'Volontaire Service Civique',
        rank: cand.rank || 'PSE1',
        contractType: 'service_civique',
        profilSocial: 'service_civique',
        exp: cand.exp || 30,
        energy: 100,
        motivation: 95,
        humeur: 90,
        trait: cand.trait || 'dynamique',
        status: 'dispo',
        stationId: game.stations[0]?.id,
        isTrainer: false,
        avatar: cand.avatar || '🎖️',
        dispoType: 'service_civique',
        dispoJours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        skills: cand.skills || ['pse1', 'permis_b'],
        missionsCount: 0,
        consecutiveMissions: 0,
        isBurnout: false
      };

      game.volunteers.push(newVol);
      game.candidatures = game.candidatures.filter(c => c.id !== candId);

      // Clôturer l'offre de service civique correspondante
      if (cand.jobOfferId && game.jobOffers) {
        const offer = game.jobOffers.find(o => o.id === cand.jobOfferId);
        if (offer) offer.status = 'pourvu';
      }

      game.showToast(
        'Contrat Signé !',
        `Félicitations ! ${newVol.name} a signé son engagement en Service Civique (${newVol.role} • 115 €/mois).`,
        'green'
      );
    } else if (cand.type === 'salarie') {
      // Embauche Salarié
      const newSalarie = {
        id: `sal-${Date.now()}`,
        name: cand.name,
        role: cand.jobOfferTitle || 'Cadre Salarié',
        rank: cand.rank || 'CE',
        contractType: 'salarie',
        contractCategory: cand.contractType || 'CDI',
        durationMonths: cand.durationMonths || null,
        profilSocial: 'salarie_asso',
        exp: cand.exp || 150,
        energy: 100,
        motivation: 95,
        humeur: 90,
        trait: 'leader',
        status: 'dispo',
        stationId: game.stations[0]?.id,
        isTrainer: !!cand.isTrainer,
        avatar: cand.avatar || '👔',
        dispoType: 'salarie_permanent',
        dispoJours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        contractMonthlyHours: 151,
        monthlyHoursWorked: 0,
        monthlyOvertimeHours: 0,
        todayHoursWorked: 0,
        mandatoryRestUntil: null,
        currentVacation: null,
        vacationHistory: []
      };

      game.volunteers.push(newSalarie);
      game.candidatures = game.candidatures.filter(c => c.id !== candId);

      // Clôturer l'offre d'emploi correspondante
      if (cand.jobOfferId && game.jobOffers) {
        const offer = game.jobOffers.find(o => o.id === cand.jobOfferId);
        if (offer) offer.status = 'pourvu';
      }

      game.showToast(
        'Contrat Signé !',
        `Félicitations ! ${newSalarie.name} a signé son contrat ${cand.contractType} (${cand.jobOfferTitle} • 151h mensuelles).`,
        'green'
      );
    } else {
      // Intégration Bénévole
      game.acceptCandidature(candId);
      return;
    }

    game.closeModal();
    game.saveGame();
    game.updateStatsUI();
    game.openModule('recrutement');
  }
};
