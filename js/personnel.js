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
      baseDispoRate: 0.75,
      desc: 'Forte disponibilité soirs (dès 17h) et week-ends. Progression d’apprentissage rapide (+50% exp), mais risque de mobilité/départ après 1 à 2 ans.',
      favDays: ['Mercredi', 'Vendredi', 'Samedi', 'Dimanche'],
      energyDrainRatio: 0.95,
      learningBonus: 1.5,
      mobilityRiskYear: 1
    },
    actif: {
      label: 'Actif (Salarié en entreprise)',
      icon: '💼',
      baseDispoRate: 0.42,
      desc: 'Disponible principalement week-ends et soirs (dès 19h). Fatigue augmentant 50% plus vite en semaine.',
      favDays: ['Vendredi', 'Samedi', 'Dimanche'],
      energyDrainRatio: 1.10,
      weekdayFatigueMultiplier: 1.5
    },
    salarie: {
      label: 'Salarié(e) temps plein',
      icon: '💼',
      baseDispoRate: 0.42,
      desc: 'Disponible principalement week-ends et soirs (dès 19h). Fatigue augmentant 50% plus vite en semaine.',
      favDays: ['Vendredi', 'Samedi', 'Dimanche'],
      energyDrainRatio: 1.10,
      weekdayFatigueMultiplier: 1.5
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
      baseDispoRate: 0.80,
      desc: 'Grande disponibilité en journée de semaine (8h-20h). Idéal pour la logistique, l’administratif et formations PSC1. Fatigue modérée (-20%), indisponible la nuit.',
      favDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
      energyDrainRatio: 0.85,
      dayFatigueMultiplier: 0.80,
      nightRestricted: true
    },
    service_civique: {
      label: 'Volontaire Service Civique',
      icon: '🎖️',
      baseDispoRate: 0.88,
      desc: 'Contrat jeune (24h-35h/semaine). Indemnisé par l’État (coût antenne légal fixe : 114,85 €/mois). Doit obligatoirement valider le PSC 1 durant sa mission.',
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
      unlocks: 'Départs Réflexes VPSP & Réquisition SAMU',
      desc: 'Convention ARS et Préfecture validant la conformité sanitaire des VPSP pour intervenir sur demande du SAMU 15 et des Sapeurs-Pompiers.'
    },
    {
      code: 'B',
      title: 'Agrément B - Sauvetage en Milieu Aquatique & Nautique',
      category: 'Secours Aquatique',
      cost: 2200,
      icon: 'life-buoy',
      color: 'sky',
      unlocks: 'Embarcations, Secours Nautique & Sauvetage Inondations',
      desc: 'Agrément ministériel de Sécurité Civile autorisant le déploiement d’équipages nautiques, embarcations et sauveteurs aquatiques sur plans d’eau et crues.'
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

    // Mise à jour de chaque secouriste existant avec les jauges Fatigue, Moral et Profils
    if (game.volunteers && Array.isArray(game.volunteers)) {
      game.volunteers.forEach(v => {
        if (!v.contractType) {
          if (v.name === 'Alexandre Roux' || v.dispoType === 'salarie_permanent') {
            v.contractType = 'salarie';
          } else {
            v.contractType = 'benevole';
          }
        }
        
        // Typologie sociologique : etudiant, actif, retraite
        if (!v.profilSocial) {
          if (v.dispoType === 'étudiant' || v.dispoType === 'étudiante') {
            v.profilSocial = 'etudiant';
          } else if (v.age && v.age >= 62) {
            v.profilSocial = 'retraite';
          } else if (v.contractType === 'salarie') {
            v.profilSocial = 'salarie_asso';
          } else {
            v.profilSocial = 'actif';
          }
        }
        if (v.profilSocial === 'salarie') v.profilSocial = 'actif';

        // Nouvelles jauges fondamentales : Fatigue (0 à 100) et Moral (0 à 100)
        if (v.fatigue === undefined) {
          v.fatigue = Math.max(0, 100 - (v.energy !== undefined ? v.energy : 85));
        }
        if (v.moral === undefined) {
          v.moral = v.humeur !== undefined ? v.humeur : (v.motivation !== undefined ? v.motivation : 80);
        }

        // Synchronisation des indicateurs miroirs
        v.energy = Math.max(0, 100 - v.fatigue);
        v.motivation = v.moral;
        v.humeur = v.moral;

        if (v.hasUniform === undefined) {
          v.hasUniform = true; // Migration bienveillante : les secouristes déjà en poste possèdent leur tenue
        }

        if (!v.trait) {
          const traitsKeys = Object.keys(this.traits);
          v.trait = traitsKeys[Math.floor(Math.random() * traitsKeys.length)];
        }
        if (v.missionsCount === undefined) v.missionsCount = 0;
        if (v.consecutiveMissions === undefined) v.consecutiveMissions = 0;
        if (v.isBurnout === undefined) v.isBurnout = false;
        if (v.lastMissionHoursElapsed === undefined) v.lastMissionHoursElapsed = game.clock?.totalHoursElapsed || 0;
        if (!v.joinDate) {
          v.joinDate = { year: game.clock?.year || 2026, month: game.clock?.month || 9, day: game.clock?.day || 5 };
        }

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

        // Bassin d'attractivité territoriale, adresse et temps de ralliement
        this.ensureVolunteerResidence(v, game);
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
    // Condition stricte : le secouriste doit avoir reçu sa Tenue officielle Protection Civile pour partir sur le terrain
    if (volunteer.hasUniform === false) {
      return { available: false, reason: 'Sans tenue d’intervention officielle (Dotation requise en stock pour partir sur le terrain)' };
    }

    if (volunteer.isBurnout) {
      return { available: false, reason: 'Arrêt de travail / Burnout (surmenage)' };
    }

    // Conséquence d'usure morale : mise en retrait
    if (volunteer.status === 'retrait' || (volunteer.moral !== undefined && volunteer.moral < 20)) {
      return { available: false, reason: 'En retrait associatif (moral critique < 20% : cohésion d’antenne requise)' };
    }

    // Règle d'usure stricte : fatigue > 80 = indisponibilité automatique pour repos obligatoire
    if (volunteer.fatigue !== undefined && volunteer.fatigue > 80) {
      return { available: false, reason: 'Fatigue critique (> 80%) : Repos obligatoire pour prévenir toute faute opérationnelle' };
    }

    // --- RÈGLE DU CODE DU TRAVAIL STRICTEMENT RÉSERVÉE AUX SALARIÉS ---
    if (volunteer.contractType === 'salarie') {
      const now = Date.now();
      if (volunteer.mandatoryRestUntil && now < volunteer.mandatoryRestUntil) {
        const secLeft = Math.ceil((volunteer.mandatoryRestUntil - now) / 1000);
        return {
          available: false,
          reason: 'Repos obligatoire (Code du Travail Art. L3131-1 : 11h consécutives - encore ' + secLeft + 's)'
        };
      }
      if (volunteer.currentVacation) {
        return {
          available: false,
          reason: 'En vacation interne : « ' + volunteer.currentVacation.title + ' »'
        };
      }
    }

    if (volunteer.energy < 20 && volunteer.trait !== 'devoue') {
      return { available: false, reason: 'Énergie critique (besoin de repos)' };
    }

    // Période de repos obligatoire post-mission (bénévoles & salariés)
    const now = Date.now();
    if (volunteer.restUntil && now < volunteer.restUntil) {
      const secLeft = Math.ceil((volunteer.restUntil - now) / 1000);
      return {
        available: false,
        reason: 'En repos post-mission obligatoire (encore ' + secLeft + 's)'
      };
    }

    const profileKey = volunteer.profilSocial === 'salarie' ? 'actif' : (volunteer.profilSocial || 'actif');
    const profile = this.socialProfiles[profileKey] || this.socialProfiles.actif;
    const currentDayName = (mission && mission.eventDate?.dayName) ? mission.eventDate.dayName : game.clock.daysNames[game.clock.day % 7];
    const missionHour = mission?.startHour !== undefined ? mission.startHour : (mission?.eventDate?.hour !== undefined ? mission.eventDate.hour : (game.clock?.hour || 14));
    const isWeekend = currentDayName === 'Samedi' || currentDayName === 'Dimanche';

    // Plages horaires réalistes selon le profil socio-professionnel
    let hourEligible = true;
    let hourReason = '';

    if (volunteer.profilSocial === 'etudiant') {
      // Disponible soirs (dès 17h) et week-ends entiers
      if (!isWeekend && missionHour < 17 && missionHour >= 8) {
        hourEligible = false;
        hourReason = 'En cours / amphithéâtre en journée de semaine';
      }
    } else if (volunteer.profilSocial === 'actif' || volunteer.profilSocial === 'salarie') {
      // Disponible uniquement en soirée (dès 19h) et le week-end
      if (!isWeekend && missionHour < 19 && missionHour >= 8) {
        hourEligible = false;
        hourReason = 'Au travail (actif en entreprise en journée de semaine)';
      }
    } else if (volunteer.profilSocial === 'retraite') {
      // Disponible en journée de semaine (8h-20h), indisponible la nuit
      if (missionHour >= 22 || missionHour < 7) {
        hourEligible = false;
        hourReason = 'Indisponible en horaire nocturne tardif';
      }
    }

    if (!hourEligible && volunteer.contractType !== 'salarie_asso') {
      return {
        available: false,
        reason: profile.label + ' : ' + hourReason
      };
    }

    // Vérification du jour favori selon profil social et préférences
    const isPreferredDay = volunteer.dispoJours?.includes(currentDayName) || (profile.favDays && profile.favDays.includes(currentDayName));
    
    // Probabilité d'acceptation réaliste
    let chance = isPreferredDay ? (profile.baseDispoRate + 0.35) : 0.16;
    if (volunteer.moral > 75) chance += 0.12;
    if (volunteer.fatigue < 40) chance += 0.08;
    if (volunteer.contractType === 'salarie' || volunteer.contractType === 'salarie_asso') chance += 0.40;
    
    // Si petit poste de secours (durée <= 4h ou PAPS/DPS-PE), plus accessible
    if (mission && (mission.durationHours <= 4 || (mission.scale && (mission.scale.includes('PE') || mission.scale.includes('PAPS'))))) {
      chance += 0.10;
    }

    const available = Math.random() < Math.min(0.96, Math.max(0.08, chance));
    return {
      available,
      reason: available ? 'Disponible' : (profile.label + ' : indisponible sur ce créneau')
    };
  },

  // Déduction de fatigue horaire, intempéries, nuit, repos obligatoire et moral
  applyMissionExertion(volunteer, mission, hasAep2 = false, weather = null) {
    const profileKey = volunteer.profilSocial === 'salarie' ? 'actif' : (volunteer.profilSocial || 'actif');
    const profile = this.socialProfiles[profileKey] || this.socialProfiles.actif;

    const durationHours = mission.durationHours ? parseFloat(mission.durationHours) : Math.max(2, Math.round((mission.duration || 30) / 10));
    let fatiguePerHour = 4.5 * (profile.energyDrainRatio || 1.0);

    // 1. Bonus de fatigue de nuit (entre 21h et 06h) : +50%
    const missionHour = mission.startHour !== undefined ? mission.startHour : (mission.eventDate?.hour !== undefined ? mission.eventDate.hour : 14);
    const isNight = missionHour >= 21 || missionHour < 6;
    if (isNight) {
      fatiguePerHour *= 1.5;
    }

    // 2. Bonus intempéries (canicule, orage violent, pluie battante, grand froid, neige) : +50%
    const cond = weather?.condition || window.game?.weather?.condition || 'ensoleille';
    const isBadWeather = ['canicule', 'pluie_battante', 'orage_violent', 'grand_froid', 'neige', 'heat', 'storm', 'rain', 'snow'].includes(cond);
    if (isBadWeather) {
      fatiguePerHour *= 1.5;
    }

    // 3. Spécificité actif : fatigue augmentant 50% plus vite en semaine
    const dayName = mission.eventDate?.dayName || window.game?.clock?.daysNames?.[(window.game?.clock?.day || 0) % 7] || 'Lundi';
    const isWeekday = !['Samedi', 'Dimanche'].includes(dayName);
    if ((volunteer.profilSocial === 'actif' || volunteer.profilSocial === 'salarie') && isWeekday) {
      fatiguePerHour *= 1.5;
    }

    // 4. Spécificité retraité : fatigue réduite en journée
    if (volunteer.profilSocial === 'retraite') {
      fatiguePerHour *= 0.8;
    }

    // 5. Trait dynamique récupère mieux et fatigue moins
    if (volunteer.trait === 'dynamique') {
      fatiguePerHour *= 0.75;
    }

    // 6. Soutien et débriefing psychologique AEP2 (defusing d'équipage : -50% de fatigue)
    if (hasAep2) {
      fatiguePerHour *= 0.50;
    }

    const fatigueGained = Math.round(durationHours * fatiguePerHour);
    volunteer.fatigue = Math.min(100, (volunteer.fatigue || 0) + fatigueGained);
    volunteer.energy = Math.max(0, 100 - volunteer.fatigue);

    volunteer.missionsCount = (volunteer.missionsCount || 0) + 1;
    volunteer.consecutiveMissions = (volunteer.consecutiveMissions || 0) + 1;
    volunteer.lastMissionHoursElapsed = window.game?.clock?.totalHoursElapsed || 0;

    // Progression accélérée pour le profil étudiant (+50% gain d'expérience)
    const baseExp = volunteer.profilSocial === 'etudiant' ? 25 : 15;
    volunteer.exp = (volunteer.exp || 0) + baseExp;

    // Enclenchement d'une période de repos obligatoire post-mission (30 à 60 secondes de jeu)
    const restDurationMs = Math.max(30000, durationHours * 8000);
    volunteer.restUntil = Date.now() + restDurationMs;

    // Impact sur le moral : surmenage ou mission éprouvante
    if (volunteer.fatigue > 70 || volunteer.consecutiveMissions >= 3) {
      // Décroissance en cas de surmenage
      volunteer.moral = Math.max(0, (volunteer.moral || 75) - 16);
    } else if (mission.type === 'samu' || mission.severity === 'critique') {
      volunteer.moral = Math.max(0, (volunteer.moral || 75) - 8);
    } else {
      // Mission réussie et valorisante
      volunteer.moral = Math.min(100, (volunteer.moral || 75) + 6);
    }

    volunteer.motivation = volunteer.moral;
    volunteer.humeur = volunteer.moral;

    // Conséquence d'usure : repos obligatoire si fatigue > 80
    if (volunteer.fatigue > 80) {
      volunteer.status = 'repos';
      if (window.game?.showToast) {
        window.game.showToast('Repos Obligatoire 🛌', volunteer.name + ' dépasse 80% de fatigue (' + volunteer.fatigue + '%). Mis(e) au repos forcé pour éviter toute faute opérationnelle.', 'orange');
      }
    }

    // Conséquence d'usure : mise en retrait puis démission définitive si moral < 20
    if (volunteer.moral < 20 && volunteer.contractType === 'benevole') {
      if (volunteer.status !== 'retrait') {
        volunteer.status = 'retrait';
        if (window.game?.showToast) {
          window.game.showToast('Bénévole en Retrait 😟', volunteer.name + ' se met en retrait associatif (moral critique : ' + volunteer.moral + '%). Organisez un moment de cohésion pour le remobiliser.', 'orange');
        }
      } else {
        // Confirmation de démission définitive si déjà en retrait
        volunteer.hasResigned = true;
        volunteer.status = 'demissionne';
        return { burnout: true, resigned: true, volunteer };
      }
    }

    // Risque de burnout critique si fatigue = 100
    if (volunteer.fatigue >= 100) {
      volunteer.isBurnout = true;
      volunteer.status = 'repos';
      volunteer.burnoutUntil = Date.now() + (30 * 60 * 1000);
      return { burnout: true, volunteer };
    }

    return { burnout: false, volunteer };
  },

  // Régénération au repos, surveillance de l'inactivité (> 30 jours) et mobilité étudiante
  applyRestCycle(game) {
    if (!game.volunteers) return;
    const now = Date.now();
    const currentHours = game.clock?.totalHoursElapsed || 0;

    game.volunteers.forEach(v => {
      // Fin de burnout éventuelle
      if (v.isBurnout && v.burnoutUntil && now >= v.burnoutUntil) {
        v.isBurnout = false;
        v.fatigue = 40;
        v.energy = 60;
        v.moral = 60;
        v.motivation = 60;
        v.humeur = 60;
        v.status = 'dispo';
        v.consecutiveMissions = 0;
        game.showToast('Reprise d’activité', v.name + ' a récupéré et réintègre l’effectif disponible.', 'green');
      }

      if (v.status === 'dispo' || v.status === 'repos') {
        const station = game.stations[0];
        const foyerRoom = station?.premises?.rooms?.foyer_vie_associative;
        const foyerLevel = foyerRoom?.level || (station?.rooms?.foyer === 3 ? 3 : (station?.rooms?.foyer === 2 ? 2 : 1));
        const bonusFoyer = foyerLevel === 2 ? 1.5 : (foyerLevel === 3 ? 2.0 : 1.0);
        const cuisineBonus = foyerRoom?.hasCuisineEquipee ? 1.25 : 1.0;
        const recoveryGain = Math.round(5 * bonusFoyer * cuisineBonus * (v.trait === 'dynamique' ? 1.3 : 1.0));
        
        // Récupération de fatigue et d'énergie
        v.fatigue = Math.max(0, (v.fatigue || 20) - recoveryGain);
        v.energy = Math.max(0, 100 - v.fatigue);

        // Sortie de repos si fatigue retombée sous 50
        if (v.status === 'repos' && v.fatigue <= 50 && !v.isBurnout) {
          v.status = 'dispo';
        }

        // Si bien reposé, le moral remonte avec boost passif du foyer de vie associative et des équipements
        if (v.fatigue <= 30 && v.status !== 'retrait') {
          let moralPassiveGain = (foyerLevel >= 2 ? 2 : 1) + (foyerRoom?.hasCuisineEquipee ? 1 : 0);

          // Impact des gammes d'équipements et tenues
          const eqTiers = game.equipmentTiers || {};
          const hasModernEup = eqTiers.vetements_eup === 2;
          const hasHighTechEquipment = (eqTiers.prise_parametres === 3) || (eqTiers.mannequin_rcp_adulte === 3);
          const isAllLevel1 = Object.values(eqTiers).every(t => t <= 1);
          const isLargeStation = (game.volunteers && game.volunteers.length >= 10) || (game.vehicles && game.vehicles.length >= 3);

          if (hasModernEup) {
            moralPassiveGain += 1; // Fierté de porter des tenues de haute technicité
          }
          if (hasHighTechEquipment) {
            moralPassiveGain += 1; // Fierté d'utiliser du matériel connecté
          }
          if (isAllLevel1 && isLargeStation) {
            moralPassiveGain = Math.max(0, moralPassiveGain - 2); // Malus passif "manque de moyens"
          }

          v.moral = Math.min(100, (v.moral || 70) + moralPassiveGain);
          v.motivation = v.moral;
          v.humeur = v.moral;
        }

        // 0. ABSENCE DE TENUE OFFICIELLE PROTECTION CIVILE : Frustration & Démotivation
        if (v.hasUniform === false) {
          v.moral = Math.max(15, (v.moral || 65) - 3);
          v.motivation = v.moral;
          v.humeur = v.moral;
          if (Math.random() < 0.04 && window.ProtecAntenneMessages && typeof window.ProtecAntenneMessages.addVolunteerMessage === 'function') {
            window.ProtecAntenneMessages.addVolunteerMessage(
              game,
              v.id,
              `Bonjour Chef, je suis toujours en attente de ma tenue officielle Protection Civile pour pouvoir partir sur le terrain avec l'équipe... Est-ce qu'une commande est prévue en logistique ?`,
              { type: 'uniform_complaint', subject: 'Attente de Tenue Officielle' }
            );
          }
        }

        // 1. INACTIVITÉ PROLONGÉE (> 30 jours sans convocation) : décroissance du moral
        const hoursWithoutMission = currentHours - (v.lastMissionHoursElapsed || 0);
        if (hoursWithoutMission > 720 && v.contractType === 'benevole') { // 30 jours = 720 heures
          // Perte de moral par période d'inactivité
          if (Math.random() < 0.10) {
            v.moral = Math.max(5, (v.moral || 70) - 5);
            v.motivation = v.moral;
            v.humeur = v.moral;

            if (v.moral < 20 && v.status !== 'retrait') {
              v.status = 'retrait';
              game.showToast('Inactivité Prolongée ⚠️', v.name + ' n’a pas été convoqué(e) depuis plus d’un mois (moral < 20%). Il se met en retrait associatif.', 'orange');
            }
          }
        }

        // 2. MOBILITÉ DU PROFIL ÉTUDIANT (risque de départ après 1 à 2 ans)
        if (v.profilSocial === 'etudiant' && v.contractType === 'benevole' && v.joinDate) {
          const yearsElapsed = (game.clock.year - v.joinDate.year) + ((game.clock.month - v.joinDate.month) / 12);
          if (yearsElapsed >= 1.0 && Math.random() < 0.003) {
            v.status = 'demissionne';
            v.hasResigned = true;
            game.showToast('Mobilité Étudiante 🎓', v.name + ' (étudiant) doit quitter l’antenne après ' + yearsElapsed.toFixed(1) + ' an(s) pour poursuivre ses études/stage dans une autre ville.', 'blue');
          }
        }
      }
    });
  },

  // Action de cohésion associative : Moment de convivialité d'antenne
  triggerCohesionEvent(game, eventType = 'convivialite') {
    const cost = 250;
    if (game.resources.money < cost) {
      game.showToast('Fonds Insuffisants', 'L’organisation du moment de cohésion requiert ' + cost + ' €.', 'orange');
      return;
    }

    game.resources.money -= cost;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -cost, 'Moment de convivialité & Cohésion d’équipe', 'autre');
    }

    let countReintegrated = 0;

    game.volunteers.forEach(v => {
      // Réduit la fatigue collective et restaure le moral
      v.fatigue = Math.max(0, (v.fatigue || 20) - 25);
      v.energy = Math.max(0, 100 - v.fatigue);
      v.moral = Math.min(100, (v.moral || 60) + 30);
      v.motivation = v.moral;
      v.humeur = v.moral;

      // Réactivation des secouristes en retrait
      if (v.status === 'retrait') {
        v.status = 'dispo';
        countReintegrated++;
      } else if (v.status === 'repos' && v.fatigue <= 60 && !v.isBurnout) {
        v.status = 'dispo';
      }
    });

    const msgExtra = countReintegrated > 0 ? (' ' + countReintegrated + ' bénévole(s) remobilisé(s) !') : '';
    game.showToast(
      '🎉 Moment de Cohésion Réussi !',
      'Repas convivial au local : fatigue collective réduite (-25%), moral reboosté (+30 pts) !' + msgExtra,
      'green'
    );

    game.updateStatsUI();
    game.saveGame();
    if (game.openModule) game.openModule('recrutement');
  },
  processSalariesAndStipends(game) {
    if (!game.volunteers) return;
    let totalMonthlyCharges = 0;
    let serviceCiviqueCount = 0;
    let salarieCount = 0;

    game.volunteers.forEach(v => {
      if (v.contractType === 'service_civique') {
        serviceCiviqueCount++;
        totalMonthlyCharges += 114.85;

        // Rappel administratif de formation PSC 1 si non validé
        if (v.psc1Status !== 'valide' && !v.skills?.includes('psc1') && !v.skills?.includes('pse1')) {
          if (Math.random() < 0.25 && game.showToast) {
            game.showToast(
              '⚠️ PSC 1 Service Civique Requis',
              `Rappel légal : ${v.name} doit suivre et valider sa formation PSC 1 durant son Service Civique (dans votre antenne ou antenne partenaire).`,
              'orange'
            );
          }
        }
      } else if (v.contractType === 'salarie') {
        salarieCount++;
        const cost = v.totalEmployerCost || (v.monthlyGrossSalary ? Math.round(v.monthlyGrossSalary * 1.42) : (v.monthlySalary ? Math.round(v.monthlySalary * 1.42) : 3124));
        totalMonthlyCharges += cost;
      }
    });

    // Abonnement flotte de téléphones professionnels (8 € / mois par ligne de service active)
    const activePhones = (game.stations || []).reduce((sum, s) => sum + (s.stock?.telephone_garde || 0) + (s.stock?.phones || 0), 0) +
      (game.vehicles || []).filter(veh => veh.onboardPhone || (Array.isArray(veh.loadedItems) && veh.loadedItems.some(it => it.id === 'telephone_garde'))).length;
    if (activePhones > 0) {
      const telecomCost = activePhones * 8;
      totalMonthlyCharges += telecomCost;
    }

    totalMonthlyCharges = Math.round(totalMonthlyCharges * 100) / 100;

    if (totalMonthlyCharges > 0 && game.clock.day === 1 && game.clock.hour === 9 && game.clock.minute === 0) {
      if (game.resources.money >= totalMonthlyCharges) {
        game.resources.money = Math.round((game.resources.money - totalMonthlyCharges) * 100) / 100;
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(
            game,
            -totalMonthlyCharges,
            `Virement Salaires & Indemnités Mensuelles (${salarieCount} salarié(s) [charges inc.], ${serviceCiviqueCount} service(s) civique(s) [114,85 €])`,
            'salaires',
            'SAL-' + (game.clock ? `${game.clock.year || 2026}-${game.clock.month || 1}` : Date.now()),
            'Personnel & URSSAF'
          );
        }
        game.showToast(
          'Paiement des Salaires & Indemnités',
          `Virement mensuel : ${totalMonthlyCharges.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € (${salarieCount} salarié(s) avec charges, ${serviceCiviqueCount} service(s) civique(s) à 114,85 €).`,
          'blue'
        );
      } else {
        game.showToast(
          'Trésorerie Critique : Salaires Impayés !',
          `Fonds insuffisants pour régler ${totalMonthlyCharges.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € d’indemnités salariales et charges ! Baisse de moral.`,
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
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -agr.cost,
        `Audit & Droits d'Agrément Préfectoral : ${agr.title}`,
        'frais',
        'AGR-' + agrementCode,
        'Préfecture'
      );
    }
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
    {
      id: 'comm_community_manager',
      category: 'administrative',
      categoryLabel: 'Pôle Communication & Notoriété',
      title: 'Animation Réseaux Sociaux (Community Manager)',
      hours: 2,
      icon: 'share-2',
      color: 'purple',
      desc: 'Rédaction des publications d’antenne, valorisation des missions et modération des messages citoyens pour maintenir la visibilité au maximum.',
      revenue: 0,
      repGain: 15,
      boostSocialVisibility: 35
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

    // Contrôle ERP pour les sessions de formation accueillant du public
    if (task.category === 'formation') {
      const station = game.stations[0];
      const premises = station?.premises;
      if (premises && premises.erpStatus === 'non_conforme') {
        game.showToast('Salle Suspendue ERP 🧯', 'La commission de sécurité a suspendu la salle de formation PSC1 pour non-conformité. Réalisez un audit de mise aux normes dans le module Locaux !', 'red');
        return;
      }
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
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(
            game,
            -overtimeCost,
            `Heures Supplémentaires Salarié (+25%) : ${salarie.name}`,
            'salaires',
            'HS-' + Date.now(),
            'Personnel Salarié'
          );
        }
      }
      overtimeNotice = ` ⚠️ Heures Supp' : Dépassement des 151h mensuelles (${salarie.monthlyOvertimeHours}h supp au total). Majoration légale de +25% appliquée (-${overtimeCost} €).`;
    }

    // 3. Application des bénéfices de la vacation
    let totalRevenue = task.revenue || 0;
    let totalRep = task.repGain || 0;

    // Bonus d'équipements de la salle de formation PSC1
    if (task.category === 'formation' || task.id === 'formation_psc1') {
      const station = game.stations[0];
      const psc1Room = station?.premises?.rooms?.salle_formation_psc1;
      if (psc1Room) {
        if (psc1Room.hasVideoprojecteur) {
          totalRevenue += Math.round(totalRevenue * 0.20); // +20% d'inscrits grâce au vidéoprojecteur
        }
        if (psc1Room.hasQcprMannequins) {
          totalRevenue += 120; // +120 € (qualité de formation & matériel connecté)
          totalRep += 8; // +8 pts de réputation
        }
      }
    }

    if (totalRevenue > 0) {
      game.resources.money += totalRevenue;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(
          game,
          totalRevenue,
          `Session Formation / Prestation B2B : ${task.title}`,
          'formation_grand_public',
          'FORM-B2B-' + Date.now(),
          'Clients & Entreprises'
        );
      }
    }
    if (totalRep > 0) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + totalRep;
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
    if (task.boostSocialVisibility && game.socialMedia) {
      game.socialMedia.visibilityScore = Math.min(100, (game.socialMedia.visibilityScore || 50) + task.boostSocialVisibility);
      game.socialMedia.lastPostTimestamp = Date.now();
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
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(
            game,
            -otCost,
            `Heures Supp' Mission Salarié (+25%) : ${salarie.name}`,
            'salaires',
            'HS-MIS-' + Date.now(),
            'Personnel Salarié'
          );
        }
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
  async forceDerogationRest(game, salarieId) {
    const salarie = game.volunteers.find(v => v.id === salarieId);
    if (!salarie) return;

    const confirmed = await window.ProtecDialog.confirm(
      `Faire reprendre le travail à ${salarie.name} avant la fin de ses 11h de repos obligatoire constitue une dérogation au droit commun du travail (Art. L3131-1).\n\nConséquences :\n• Prime de pénibilité exceptionnelle : -150 €\n• Avertissement Inspection du Travail & Perte de -10 pts de réputation\n• Fatigue accrue du salarié\n\nConfirmez-vous cette décision de crise ?`,
      'Dérogation au Code du Travail',
      { isDestructive: true, confirmText: 'Forcer la reprise', cancelText: 'Respecter le repos' }
    );
    if (!confirmed) {
      return;
    }

    game.resources.money = Math.max(0, game.resources.money - 150);
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -150,
        `Prime Exceptionnelle Pénibilité Dérogation : ${salarie.name}`,
        'salaires',
        'PENIB-' + Date.now(),
        'Personnel Salarié'
      );
    }
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
    title.textContent = 'Direction RH : Gestion des Salariés';
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
              Statut des Salariés vs Bénévolat
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
                      ${game.getVolunteerAvatarHTML ? game.getVolunteerAvatarHTML(sal, 'w-10 h-10', true) : `<span class="text-3xl">${sal.avatar || '👔'}</span>`}
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

                  <!-- Option Community Management Automatique (Réseaux Sociaux) -->
                  ${(() => {
                    const isAutoPilotCM = game.socialMedia && game.socialMedia.autoPilotSalarieId === sal.id;
                    return `
                      <div class="p-3 rounded-xl ${isAutoPilotCM ? 'bg-purple-50 border border-purple-300' : 'bg-slate-50 border border-slate-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        <div class="flex items-center gap-2.5">
                          <span class="text-xl">📱</span>
                          <div>
                            <strong class="text-slate-900 block text-xs">Animation Réseaux Sociaux & Visibilité (0 €)</strong>
                            <span class="text-[10px] text-slate-500">${isAutoPilotCM ? '👔 Ce salarié publie automatiquement pour maintenir la visibilité d’antenne à 100%.' : 'Déléguez la publication automatique des réseaux sociaux à ce salarié pour vous libérer de cette tâche.'}</span>
                          </div>
                        </div>
                        <div>
                          ${isAutoPilotCM ? `
                            <button onclick="window.ProtecCommunication.setAutoPilotSalarie(window.game, null)" class="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition flex-shrink-0">
                              Actif (Désactiver)
                            </button>
                          ` : `
                            <button onclick="window.ProtecCommunication.setAutoPilotSalarie(window.game, '${sal.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 shadow-sm transition flex-shrink-0">
                              Déléguer les Réseaux
                            </button>
                          `}
                        </div>
                      </div>
                    `;
                  })()}

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
    if (game) game.currentModalKey = 'job_offer_form';

    modal.classList.remove('hidden');
    const isSC = defaultContractType === 'service_civique';
    title.textContent = isSC ? 'Ouverture de Mission de Service Civique' : 'Création & Publication d’Offre de Recrutement';
    subtitle.textContent = isSC ? 'Définissez la mission d’intérêt général (18-25 ans, 24-35h/semaine, 114,85 €/mois antenne • PSC 1 obligatoire)' : 'Définissez le contrat (CDD/CDI/Service Civique), les missions et la rémunération';
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
              ? 'Dès l’ouverture de la mission, des candidatures de jeunes motivés (18-25 ans) tomberont dans les heures suivantes. L’antenne verse la prestation légale obligatoire de 114,85 €/mois (prix fixe non modifiable). Le jeune doit obligatoirement valider le PSC 1 durant sa mission.' 
              : 'Dès l\'ouverture du poste, des candidatures ciblées de professionnels de l\'urgence tomberont. Le niveau de salaire établi détermine le nombre de postulants, leur niveau d\'expérience et leur qualité de travail.'}
          </p>
        </div>

        <!-- Type de contrat & Durée -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-black text-slate-800 uppercase tracking-wide">Type de Recrutement :</label>
            <select id="job-contract-type" onchange="window.ProtecPersonnel.handleContractTypeChange(this.value)" class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold text-slate-900 border border-slate-300">
              <option value="service_civique" ${isSC ? 'selected' : ''}>🎖️ Service Civique (18-25 ans • 114,85 €/mois fixe • PSC 1 requis)</option>
              <option value="CDI" ${defaultContractType === 'CDI' ? 'selected' : ''}>👔 CDI - Salarié Permanent (151h • Salaire libre)</option>
              <option value="CDD" ${defaultContractType === 'CDD' ? 'selected' : ''}>💼 CDD - Renfort Temporaire (151h • Salaire libre)</option>
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

        <!-- Rémunération proposée & Calcul des Charges Patronales -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-black text-slate-800 uppercase tracking-wide">
              ${isSC ? 'Indemnité Légale Antenne (Fixe non modifiable) :' : 'Salaire Brut Mensuel Proposé (€) :'}
            </label>
            <span class="text-[10px] text-slate-400 font-medium">Forfait 151h mensuelles</span>
          </div>
          <div class="relative">
            <input type="number" id="job-salary-input" min="${isSC ? '114.85' : '1802'}" max="${isSC ? '114.85' : '5000'}" step="${isSC ? '0.01' : '50'}" value="${isSC ? '114.85' : '2200'}" ${isSC ? 'readonly' : ''} oninput="window.ProtecPersonnel.updateSalaryCalculations(this.value)" required class="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-mono font-black text-slate-900 border border-slate-300 ${isSC ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}" />
            <span id="job-salary-suffix" class="absolute right-3.5 top-2.5 text-xs text-slate-500 font-bold">${isSC ? '€ / mois fixe (prestation légale • 504,98 € État)' : '€ brut / mois'}</span>
          </div>

          <!-- Bloc dynamique des charges patronales et coût réel employeur -->
          <div id="job-salary-charges-breakdown" class="mt-2"></div>
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
            <button type="button" onclick="window.game.openModule('recrutement', true)" class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Annuler</button>
            <button type="submit" id="job-submit-btn" class="px-5 py-2.5 rounded-xl text-xs font-black ${isSC ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-indigo-600 to-blue-600'} hover:brightness-110 text-white shadow-md transition flex items-center gap-2">
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
              <span>${isSC ? 'Publier la Mission (50 €)' : 'Publier l’Offre de Poste (180 €)'}</span>
            </button>
          </div>
        </div>
      </form>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Calcul immédiat des charges patronales au rendu
    this.updateSalaryCalculations(isSC ? 114.85 : 2200);
  },

  // Calcul dynamique et transparent des charges patronales et du coût réel employeur
  updateSalaryCalculations(brutVal) {
    const isSC = document.getElementById('job-contract-type')?.value === 'service_civique';
    const chargesContainer = document.getElementById('job-salary-charges-breakdown');
    if (!chargesContainer) return;

    if (isSC) {
      chargesContainer.innerHTML = `
        <div class="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-1.5 shadow-xs">
          <div class="flex items-center justify-between font-bold">
            <span class="flex items-center gap-1.5">
              <span>🏛️ Coût mensuel légal antenne :</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-black">PRIX FIXE NON MODIFIABLE</span>
            </span>
            <span class="text-sm font-black mono-num text-amber-900">114,85 € / mois</span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-600">
            <span>Indemnité principale versée directement par l'État (ASP) :</span>
            <span class="font-bold mono-num text-slate-800">504,98 € / mois</span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-700 pt-1 border-t border-amber-200/60 font-semibold">
            <span>Total net perçu chaque mois par le jeune volontaire :</span>
            <span class="font-black mono-num text-emerald-700">619,83 € / mois</span>
          </div>
          <div class="p-2 rounded-lg bg-amber-100/70 border border-amber-300/60 text-[10px] text-amber-900 space-y-0.5">
            <strong class="block text-amber-950">📜 Obligation Légale de Formation Civique & PSC 1 :</strong>
            <span>Le volontaire en Service Civique doit obligatoirement passer et valider son <strong>PSC 1</strong> durant sa mission (dispensé au sein de votre antenne ou dans une antenne partenaire du réseau).</span>
          </div>
        </div>
      `;
      return;
    }

    const brut = Math.max(1500, parseFloat(brutVal) || 2200);
    // Barème charges patronales associatives et sociales (~42%)
    const charges = Math.round(brut * 0.42 * 100) / 100;
    const totalCost = Math.round((brut + charges) * 100) / 100;
    const netEst = Math.round(brut * 0.78 * 100) / 100;

    let baroColor = 'amber';
    let baroLabel = '🟡 Salaire Équilibré (Standard du secteur)';
    let baroDesc = 'Attire environ 2 candidatures qualifiées (PSE2, Chefs d’équipe). Profils fiables, motivation stable.';

    if (brut < 2000) {
      baroColor = 'rose';
      baroLabel = '🔴 Rémunération Basse (Proche SMIC)';
      baroDesc = 'Attractivité faible : 1 seule candidature attendue, profil débutant ou junior (PSE1), motivation modérée (risque de fatigue rapide).';
    } else if (brut >= 2900) {
      baroColor = 'purple';
      baroLabel = '🟣 Rémunération Cadre Supérieur / Direction';
      baroDesc = 'Excellente attractivité : 4 candidatures d’élite (Chefs de Dispositif CD, Formateurs de Formateurs FdF, ambulanciers confirmés). Travail d’excellence (+25% d’efficacité opérationnelle) et fidélité absolue !';
    } else if (brut >= 2450) {
      baroColor = 'emerald';
      baroLabel = '🟢 Salaire Très Attractif (Cadre Confirmé)';
      baroDesc = 'Forte attractivité : 3 candidatures expérimentées (Chefs d’équipe confirmés, Formateurs agréés). Travail de haute qualité (+15% d’efficacité).';
    }

    chargesContainer.innerHTML = `
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 shadow-xs">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div class="p-2 rounded-lg bg-white border border-slate-200/70">
            <span class="text-[9px] font-bold uppercase text-slate-400 block">Salaire Brut</span>
            <strong class="text-xs font-black mono-num text-slate-800">${brut.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-200/70">
            <span class="text-[9px] font-bold uppercase text-slate-400 block">Net Estimé (~78%)</span>
            <strong class="text-xs font-black mono-num text-indigo-700">${netEst.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
          </div>
          <div class="p-2 rounded-lg bg-white border border-slate-200/70">
            <span class="text-[9px] font-bold uppercase text-rose-500 block">Charges Patronales (+42%)</span>
            <strong class="text-xs font-black mono-num text-rose-600">+ ${charges.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
          </div>
          <div class="p-2 rounded-lg bg-indigo-50 border border-indigo-200">
            <span class="text-[9px] font-black uppercase text-indigo-900 block">Coût Réel Antenne</span>
            <strong class="text-sm font-black mono-num text-indigo-950">${totalCost.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
          </div>
        </div>

        <!-- Baromètre attractivité RH et impact sur les candidatures et la qualité de travail -->
        <div class="pt-2 border-t border-slate-200/70 text-[11px] space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-black text-slate-900">${baroLabel}</span>
            <span class="text-[10px] text-indigo-600 font-bold uppercase">Impact RH & Qualité du Travail</span>
          </div>
          <p class="text-[10px] text-slate-600 leading-snug">${baroDesc}</p>
        </div>
      </div>
    `;
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
    const costDisp = document.getElementById('job-cost-display');
    const costDesc = document.getElementById('job-cost-desc');
    const submitBtn = document.getElementById('job-submit-btn');

    if (isSC) {
      if (bannerBox) {
        bannerBox.className = 'p-3.5 rounded-2xl glass-card bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-1';
      }
      if (bannerTitle) bannerTitle.textContent = 'Plateforme Nationale du Service Civique (18-25 ans)';
      if (bannerDesc) bannerDesc.textContent = 'Dès l’ouverture de la mission, des candidatures de jeunes motivés (18-25 ans) tomberont dans les heures suivantes. L’antenne verse la prestation légale obligatoire de 114,85 €/mois (prix fixe non modifiable). Le jeune doit obligatoirement valider le PSC 1 durant sa mission.';
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
        salaryInput.value = 114.85;
        salaryInput.min = 114.85;
        salaryInput.max = 114.85;
        salaryInput.readOnly = true;
        salaryInput.classList.add('bg-slate-100', 'cursor-not-allowed');
        salaryInput.classList.remove('bg-white');
      }
      if (salarySuffix) salarySuffix.textContent = '€ / mois fixe (prestation légale • 504,98 € État)';
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
      if (bannerDesc) bannerDesc.textContent = 'Dès l\'ouverture du poste, des candidatures ciblées de professionnels de l\'urgence tomberont. Le salaire brut établi détermine le nombre de postulants, leur niveau d\'expérience et leur qualité de travail.';
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
        salaryInput.min = 1802;
        salaryInput.max = 5000;
        salaryInput.readOnly = false;
        salaryInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
        salaryInput.classList.add('bg-white');
      }
      if (salarySuffix) salarySuffix.textContent = '€ brut / mois';
      if (costDisp) costDisp.textContent = '180 €';
      if (costDesc) costDesc.textContent = '(diffusion nationale)';
      if (submitBtn) {
        submitBtn.className = 'px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white shadow-md transition flex items-center gap-2';
        submitBtn.querySelector('span').textContent = 'Publier l’Offre de Poste (180 €)';
      }
    }

    this.updateSalaryCalculations(salaryInput ? salaryInput.value : (isSC ? 114.85 : 2200));
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
    
    // Le salaire brut et calcul précis des charges patronales (+42%)
    const grossSalary = isSC ? 114.85 : (parseFloat(salaryInput?.value) || 2200);
    const employerCharges = isSC ? 0 : Math.round(grossSalary * 0.42 * 100) / 100;
    const totalEmployerCost = isSC ? 114.85 : Math.round((grossSalary + employerCharges) * 100) / 100;

    const checkedMissions = Array.from(document.querySelectorAll('input[name="job-mission"]:checked')).map(cb => cb.value);
    if (checkedMissions.length === 0) checkedMissions.push('operationnel');

    game.resources.money -= cost;
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -cost,
        `Publication d'Offre RH : ${title} (${contractType})`,
        'frais',
        'RH-PUB-' + Date.now(),
        isSC ? 'Agence du Service Civique' : 'France Travail / APEC'
      );
    }

    if (!game.jobOffers) game.jobOffers = [];
    const newOffer = {
      id: `job-${Date.now()}`,
      title,
      contractType,
      durationMonths,
      salary: grossSalary,
      grossSalary: grossSalary,
      employerCharges: employerCharges,
      totalEmployerCost: totalEmployerCost,
      missions: checkedMissions,
      publishedAt: Date.now(),
      status: 'ouvert',
      applicantsCount: 0
    };

    game.jobOffers.unshift(newOffer);
    game.showToast(
      isSC ? 'Mission Publiée !' : 'Offre Publiée !',
      isSC 
        ? `La mission « ${title} » est en ligne sur l’Agence du Service Civique. Coût antenne légal : 114,85 €/mois. PSC 1 à programmer.`
        : `L’offre « ${title} » (${contractType}) est en ligne avec un salaire brut de ${grossSalary} € (coût réel antenne : ${totalEmployerCost} €/mois).`,
      'green'
    );

    // Programmation de l'arrivée progressive des candidatures dans les heures suivantes selon l'attractivité du salaire
    this.scheduleIncomingApplicants(game, newOffer);

    game.saveGame();
    game.updateStatsUI();
    game.openModule('recrutement');
  },

  // Programmation de candidatures (Service Civique ou Salariées) arrivant au fil du temps
  scheduleIncomingApplicants(game, offer) {
    const isSC = offer.contractType === 'service_civique';
    const salary = offer.salary || 2200;

    let applicantsTarget = 2;
    if (isSC) {
      applicantsTarget = 2; // Les services civiques reçoivent 2 candidatures de jeunes
    } else {
      // Le salaire brut détermine le nombre de candidatures reçues
      if (salary < 2000) applicantsTarget = 1;
      else if (salary >= 2900) applicantsTarget = 4;
      else if (salary >= 2450) applicantsTarget = 3;
      else applicantsTarget = 2;
    }

    const delays = [
      (6 + Math.random() * 6) * 1000,
      (18 + Math.random() * 12) * 1000,
      (35 + Math.random() * 15) * 1000,
      (55 + Math.random() * 20) * 1000
    ];

    for (let i = 0; i < applicantsTarget; i++) {
      const delay = delays[i] || (15 * (i + 1) * 1000);
      setTimeout(() => {
        if (!game.jobOffers.some(o => o.id === offer.id && o.status === 'ouvert')) return;
        if (isSC) {
          this.generateServiceCiviqueCandidate(game, offer);
        } else {
          this.generateSalarieCandidate(game, offer);
        }
      }, delay);
    }
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
      monthlySalary: 114.85,
      monthlyStipend: 114.85,
      totalEmployerCost: 114.85,
      psc1Status: pick.rank === 'PSE1' ? 'valide' : 'a_programmer',
      psc1Required: true,
      targetMissions: offer.missions,
      avatar: pick.avatar,
      rank: pick.rank,
      role: offer.title,
      skills: pick.rank === 'PSE1' ? ['pse1', 'permis_b'] : ['permis_b'],
      isTrainer: false,
      background: pick.background,
      motivation: pick.motivation,
      trait: pick.trait,
      exp: pick.baseExp,
      suitabilityScore: Math.round(82 + Math.random() * 15),
      interviewPassed: false,
      interviewReport: null
    };

    // Attribution réaliste de l'adresse et ralliement selon le bassin territorial
    const baseSt = (game.stations && game.stations[0]) || null;
    const geo = this.generateVolunteerResidence(game, baseSt, { age: pick.age, skills: newCand.skills });
    Object.assign(newCand, geo);
    this.resolveVolunteerRealAddress(newCand, game);

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

    const salary = offer.salary || 2200;

    // Détermination de la qualité du profil généré selon le niveau de rémunération brute
    let targetRank = pick.rank;
    let targetExp = pick.baseExp;
    let targetIsTrainer = pick.isTrainer;
    let suitabilityBonus = 0;
    let qualitySkillTag = 'Secouriste Expérimenté';

    if (salary < 2000) {
      // Salaire bas : profil junior / débutant
      targetRank = 'PSE1';
      targetExp = Math.round(pick.baseExp * 0.6);
      targetIsTrainer = false;
      suitabilityBonus = -16;
      qualitySkillTag = 'Secouriste Débutant (Faible Rémunération)';
    } else if (salary >= 2900) {
      // Salaire supérieur : profil cadre de direction / expert
      targetRank = 'CD';
      targetExp = Math.round(pick.baseExp * 1.5);
      targetIsTrainer = true;
      suitabilityBonus = +15;
      qualitySkillTag = 'Cadre d’Urgence Supérieur (Élite)';
    } else if (salary >= 2450) {
      // Salaire très attractif : cadre confirmé
      targetRank = (pick.rank === 'PSE2' || pick.rank === 'PSE1') ? 'CE' : pick.rank;
      targetExp = Math.round(pick.baseExp * 1.25);
      targetIsTrainer = true;
      suitabilityBonus = +8;
      qualitySkillTag = 'Chef d’Équipe Confirmé & Formateur';
    }

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
      monthlySalary: salary,
      monthlyGrossSalary: salary,
      employerCharges: Math.round(salary * 0.42 * 100) / 100,
      totalEmployerCost: Math.round(salary * 1.42 * 100) / 100,
      targetMissions: offer.missions,
      avatar: pick.avatar,
      rank: targetRank,
      role: offer.title,
      skills: [targetRank, ...(targetIsTrainer ? ['Formateur Agréé', 'Pédagogie'] : []), 'Permis VPSP', 'Gestion Crise', qualitySkillTag],
      isTrainer: targetIsTrainer,
      background: pick.background,
      motivation: pick.motivation,
      exp: targetExp,
      suitabilityScore: Math.min(99, Math.max(55, Math.round(78 + (Math.random() * 12) + suitabilityBonus))),
      interviewPassed: false,
      interviewReport: null
    };

    // Attribution réaliste de l'adresse et ralliement selon le bassin territorial
    const baseSt = (game.stations && game.stations[0]) || null;
    const geo = this.generateVolunteerResidence(game, baseSt, { age: pick.age, skills: newCand.skills });
    Object.assign(newCand, geo);
    this.resolveVolunteerRealAddress(newCand, game);

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
    subtitle.textContent = `Évaluation individuelle de ${cand.name} (${cand.age} ans) • ${isSC ? `Mission : ${cand.jobOfferTitle} (114,85 €/mois fixe • PSC 1 requis)` : (isSalarie ? `Candidat au poste : ${cand.jobOfferTitle}` : 'Engagement associatif')}`;
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
          ${game.getVolunteerAvatarHTML ? game.getVolunteerAvatarHTML(cand, 'w-12 h-12', false) : `<span class="text-4xl">${cand.avatar || '🙋'}</span>`}
          <div class="flex-1 space-y-1">
            <div class="flex items-center justify-between flex-wrap gap-1">
              <h4 class="text-sm font-black text-slate-900">${cand.name} (${cand.age} ans)</h4>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${isSC ? 'bg-amber-100 text-amber-800' : (isSalarie ? 'bg-indigo-100 text-indigo-800' : 'bg-pc-blue/15 text-pc-blue')}">
                ${isSC ? 'SERVICE CIVIQUE • 114,85 €/MOIS FIXE' : (isSalarie ? `SALARIÉ • ${cand.contractType}` : 'BÉNÉVOLE')}
              </span>
            </div>
            <p class="text-xs text-slate-600 font-semibold">
              ${isSC 
                ? `Mission visée : <strong>${cand.jobOfferTitle}</strong> (Indemnité antenne légale fixe 114,85 €/mois • 504,98 € État • ${cand.psc1Status === 'valide' ? '✅ PSC 1 Validé' : '⚠️ PSC 1 à programmer durant la mission'})` 
                : (isSalarie 
                  ? `Poste : <strong>${cand.jobOfferTitle}</strong> • Salaire brut : <strong>${cand.monthlyGrossSalary || cand.monthlySalary || 2200} €</strong> • Charges patronales (+42%) : <strong>${cand.employerCharges || Math.round((cand.monthlySalary || 2200) * 0.42)} €</strong> • Coût total antenne : <strong class="text-indigo-900">${cand.totalEmployerCost || Math.round((cand.monthlySalary || 2200) * 1.42)} € / mois</strong>` 
                  : `Activité civile : <strong>${cand.job || 'Étudiant'}</strong>`)}
            </p>
            ${cand.adresse ? `
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 flex flex-wrap items-center justify-between gap-1 mt-1">
                <span>🏠 Domicile : <strong>${cand.adresse}</strong></span>
                <span class="text-pc-blue font-bold">⏱️ Ralliement : ${cand.temps_ralliement_minutes || 10} min (${cand.distance_base_km || 3} km en ${cand.mode_transport === 'voiture' ? '🚗 Voiture' : (cand.mode_transport === 'moto' ? '🏍️ Moto' : '🚲 Vélo/Transports')})</span>
              </div>
            ` : ''}
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
    const isServiceCivique = cand.type === 'service_civique' || cand.contractType === 'service_civique' || cand.contractType === 'Service Civique';

    // Calcul de la note de motivation
    let noteBase = isSalarie ? 15 : (isServiceCivique ? 15 : 14);
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

    // Calculs financiers pour l'affichage
    const gross = cand.grossSalary || cand.monthlySalary || (isServiceCivique ? 114.85 : 0);
    const charges = isSalarie ? Math.round(gross * 0.42) : 0;
    const totalCost = isSalarie ? Math.round(gross * 1.42) : (isServiceCivique ? 114.85 : 0);
    const qualityMult = cand.workQualityMultiplier || (isSalarie ? (gross >= 2900 ? 1.25 : gross >= 2450 ? 1.15 : gross >= 2000 ? 1.05 : 0.90) : 1.0);

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
                : isServiceCivique 
                  ? 'Engagement civique et citoyen, volonté d’apprentissage et de dévouement pour la collectivité.' 
                  : 'Désir d’utilité citoyenne, générosité, contact humain et apprentissage des gestes qui sauvent.'}
            </div>
          </div>

          <!-- Bloc Disponibilités OU Fiche de Poste / Engagement -->
          <div class="p-4 rounded-2xl glass-card space-y-2 border border-slate-200">
            ${isSalarie ? `
              <!-- POUR LES SALARIÉS -->
              <h5 class="text-xs font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                <i data-lucide="briefcase" class="w-4 h-4 text-indigo-600"></i>
                Adéquation au Poste & Contrat de Travail
              </h5>
              <div class="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                <div class="flex justify-between items-center">
                  <span class="font-bold">Poste : ${cand.jobOfferTitle || 'Secouriste Référent'}</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-200 text-indigo-900">${cand.contractType}</span>
                </div>
                <p class="text-[11px] text-slate-600">Vacations régies par le contrat (35h/semaine - forfait 151h mensuelles).</p>
              </div>
              <div class="space-y-1.5 pt-1 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-500">Salaire Brut Mensuel :</span>
                  <strong class="text-slate-800 font-mono">${gross.toLocaleString()} €</strong>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Charges Patronales (+42%) :</span>
                  <span class="text-amber-700 font-mono font-bold">+${charges.toLocaleString()} €</span>
                </div>
                <div class="flex justify-between pt-1 border-t border-slate-200">
                  <span class="font-bold text-slate-800">Coût Total Antenne :</span>
                  <strong class="text-rose-700 font-mono font-black text-sm">${totalCost.toLocaleString()} € / mois</strong>
                </div>
                <div class="mt-2 p-2 rounded-lg ${qualityMult >= 1.15 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-50 text-slate-700 border border-slate-200'} text-[11px] flex items-center justify-between">
                  <span>Qualité & Impact du Travail :</span>
                  <span class="font-black">${qualityMult >= 1.25 ? '⭐ Exceptionnelle (+25% efficacité)' : qualityMult >= 1.15 ? '✨ Très Élevée (+15% efficacité)' : qualityMult >= 1.05 ? '👍 Bonne (+5% efficacité)' : '⚠️ Standard (-10% motivation)'}</span>
                </div>
              </div>
            ` : isServiceCivique ? `
              <!-- POUR LES SERVICES CIVIQUES -->
              <h5 class="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                <i data-lucide="handshake" class="w-4 h-4 text-amber-600"></i>
                Mission de Service Civique (Engagement Volontaire)
              </h5>
              <div class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div class="flex justify-between items-center">
                  <span class="font-bold">Indemnité Mensuelle Antenne :</span>
                  <strong class="text-amber-900 font-mono text-sm">114,85 € / mois</strong>
                </div>
                <p class="text-[11px] text-amber-800">
                  ⚠️ Prestation légale de subsistance fixée par l'État (non modifiable). Le complément (504,98 €) est directement versé par l'État via l'ASP.
                </p>
              </div>
              <div class="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                <div class="flex items-center gap-1.5 font-bold text-pc-blue">
                  <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                  Obligation de Formation PSC 1 :
                </div>
                <p class="text-[11px] text-slate-600">
                  Le volontaire devra obligatoirement suivre et valider sa formation <strong>PSC 1</strong> durant sa mission (soit au sein de votre antenne si formateur présent, soit dans une autre antenne partenaire).
                </p>
              </div>
            ` : `
              <!-- POUR LES BÉNÉVOLES : DISPONIBILITÉS DÉTAILLÉES -->
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
          
          <button onclick="window.ProtecPersonnel.hireCandidateFromInterview(window.game, '${cand.id}')" class="px-6 py-2.5 rounded-xl text-xs font-black ${isSalarie ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : isServiceCivique ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-emerald-600 to-teal-600'} hover:brightness-110 text-white shadow-lg transition flex items-center gap-2">
            <i data-lucide="check" class="w-4 h-4"></i>
            ${isSalarie 
              ? `Signer le Contrat de Travail (${cand.contractType})` 
              : isServiceCivique 
                ? 'Signer l’Engagement de Service Civique (114,85 €/mois)' 
                : 'Valider l’Intégration & Signer la Charte'}
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
      const hasInitPSC1 = cand.skills && (cand.skills.includes('psc1') || cand.skills.includes('pse1') || cand.skills.includes('pse2'));
      const newVol = {
        id: `sc-${Date.now()}`,
        name: cand.name,
        role: cand.jobOfferTitle || 'Volontaire Service Civique',
        rank: cand.rank || (hasInitPSC1 ? 'PSE1' : 'Stagiaire'),
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
        skills: cand.skills || (hasInitPSC1 ? ['pse1', 'permis_b'] : ['permis_b']),
        commune: cand.commune,
        code_postal: cand.code_postal,
        adresse: cand.adresse,
        coords_domicile: cand.coords_domicile,
        distance_base_km: cand.distance_base_km,
        temps_ralliement_minutes: cand.temps_ralliement_minutes,
        mode_transport: cand.mode_transport,
        permis_b: cand.permis_b,
        permis_c: cand.permis_c,
        permis_moto: cand.permis_moto,
        monthlySalary: 114.85,
        monthlyStipend: 114.85,
        totalEmployerCost: 114.85,
        psc1Status: hasInitPSC1 ? 'valide' : 'a_programmer',
        psc1Origin: hasInitPSC1 ? 'Diplôme Initiale' : null,
        psc1Required: true,
        missionsCount: 0,
        consecutiveMissions: 0,
        isBurnout: false
      };

      this.normalizeVolunteerUniform(newVol, game.currentDepartmentCode || game.player?.departmentCode);
      this.ensureVolunteerResidence(newVol, game);
      game.volunteers.push(newVol);
      game.candidatures = game.candidatures.filter(c => c.id !== candId);

      // Clôturer l'offre de service civique correspondante
      if (cand.jobOfferId && game.jobOffers) {
        const offer = game.jobOffers.find(o => o.id === cand.jobOfferId);
        if (offer) offer.status = 'pourvu';
      }

      game.showToast(
        'Engagement Service Civique Signé ! 🎖️',
        `Félicitations ! ${newVol.name} a signé son engagement (coût fixe antenne : 114,85 €/mois). ${newVol.psc1Status === 'valide' ? 'PSC 1 déjà validé.' : 'Pensez à programmer sa formation PSC 1 durant sa mission !'}`,
        'green'
      );
    } else if (cand.type === 'salarie') {
      // Embauche Salarié
      const gross = cand.monthlySalary || 2200;
      const charges = Math.round(gross * 0.42 * 100) / 100;
      const totalCost = Math.round((gross + charges) * 100) / 100;

      // Qualité du travail et motivation indexées sur le niveau de rémunération
      let workQuality = 1.0;
      let initialMotivation = 88;
      if (gross >= 2900) {
        workQuality = 1.25; // +25% d'efficacité opérationnelle
        initialMotivation = 100;
      } else if (gross >= 2450) {
        workQuality = 1.15; // +15% d'efficacité
        initialMotivation = 95;
      } else if (gross < 2000) {
        workQuality = 0.85; // Baisse d'efficacité si sous-payé
        initialMotivation = 75;
      }

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
        motivation: initialMotivation,
        humeur: initialMotivation,
        trait: 'leader',
        status: 'dispo',
        stationId: game.stations[0]?.id,
        isTrainer: !!cand.isTrainer,
        avatar: cand.avatar || '👔',
        dispoType: 'salarie_permanent',
        dispoJours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        skills: cand.skills || ['CE', 'PSE2', 'permis_b'],
        commune: cand.commune,
        code_postal: cand.code_postal,
        adresse: cand.adresse,
        coords_domicile: cand.coords_domicile,
        distance_base_km: cand.distance_base_km,
        temps_ralliement_minutes: cand.temps_ralliement_minutes,
        mode_transport: cand.mode_transport,
        permis_b: cand.permis_b,
        permis_c: cand.permis_c,
        permis_moto: cand.permis_moto,
        monthlySalary: gross,
        monthlyGrossSalary: gross,
        employerCharges: charges,
        totalEmployerCost: totalCost,
        workQualityMultiplier: workQuality,
        contractMonthlyHours: 151,
        monthlyHoursWorked: 0,
        monthlyOvertimeHours: 0,
        todayHoursWorked: 0,
        mandatoryRestUntil: null,
        currentVacation: null,
        vacationHistory: []
      };

      this.normalizeVolunteerUniform(newSalarie, game.currentDepartmentCode || game.player?.departmentCode);
      this.ensureVolunteerResidence(newSalarie, game);
      game.volunteers.push(newSalarie);
      game.candidatures = game.candidatures.filter(c => c.id !== candId);

      // Clôturer l'offre d'emploi correspondante
      if (cand.jobOfferId && game.jobOffers) {
        const offer = game.jobOffers.find(o => o.id === cand.jobOfferId);
        if (offer) offer.status = 'pourvu';
      }

      game.showToast(
        'Contrat Salarié Signé ! 💼',
        `Félicitations ! ${newSalarie.name} a signé son contrat ${cand.contractType} (${cand.jobOfferTitle} • Salaire brut : ${gross} € • Coût total antenne avec charges patronales 42% : ${totalCost} €/mois).`,
        'green'
      );
    } else {
      // Intégration Bénévole
      game.acceptCandidature(candId);
      return;
    }

    game.closeModal();
    if (typeof game.closeDrawer === 'function') game.closeDrawer();
    game.saveGame();
    game.updateStatsUI();
  },

  // 4b. Validation de la formation PSC 1 pour un volontaire en Service Civique
  passServiceCiviquePSC1(game, volunteerId, mode = 'interne') {
    if (!game || !game.volunteers) return;
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!vol) return;

    if (vol.psc1Status === 'valide') {
      game.showToast('PSC 1 Déjà Validé', `${vol.name} est déjà titulaire de sa certification PSC 1.`, 'blue');
      return;
    }

    if (mode === 'interne') {
      // Vérifier si un formateur est présent à l'antenne
      const hasTrainer = game.volunteers.some(v => v.id !== vol.id && (v.isTrainer || v.rank === 'Formateur' || (v.skills && v.skills.some(s => s.toLowerCase().includes('formateur')))));
      if (!hasTrainer) {
        game.showToast(
          'Aucun Formateur à l’Antenne',
          'Vous n’avez aucun formateur agréé dans vos effectifs pour assurer la session. Envoyez le volontaire en formation auprès d’une antenne partenaire du réseau (60 €).',
          'orange'
        );
        return;
      }

      vol.psc1Status = 'valide';
      vol.psc1Origin = 'Antenne Locale (Session Interne)';
      vol.skills = Array.from(new Set([...(vol.skills || []), 'psc1']));
      if (!vol.rank || vol.rank === 'Stagiaire') vol.rank = 'PSC1';
      vol.exp = (vol.exp || 20) + 15;
      vol.motivation = Math.min(100, (vol.motivation || 80) + 10);

      game.showToast(
        '🎓 PSC 1 Validé en Interne !',
        `${vol.name} a suivi et validé avec succès sa formation PSC 1 auprès d'un formateur de votre antenne. Obligation légale de Service Civique validée !`,
        'green'
      );
    } else {
      // Formation auprès d'une autre antenne partenaire du réseau (coût 60 €)
      const cost = 60;
      if ((game.resources.money || 0) < cost) {
        game.showToast('Trésorerie Insuffisante', `L'inscription à la session PSC 1 réseau partenaire requiert ${cost} €.`, 'orange');
        return;
      }

      game.resources.money = Math.max(0, (game.resources.money || 0) - cost);
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(
          game,
          -cost,
          `Formation PSC 1 Service Civique (Antenne Partenaire Fédérale) - ${vol.name}`,
          'formations',
          'PSC1-SC-' + Date.now(),
          'Antenne Partenaire Protection Civile'
        );
      }

      vol.psc1Status = 'valide';
      vol.psc1Origin = 'Antenne Partenaire (Réseau Fédéral)';
      vol.skills = Array.from(new Set([...(vol.skills || []), 'psc1']));
      if (!vol.rank || vol.rank === 'Stagiaire') vol.rank = 'PSC1';
      vol.exp = (vol.exp || 20) + 15;
      vol.motivation = Math.min(100, (vol.motivation || 80) + 10);

      game.showToast(
        '🎓 PSC 1 Validé (Antenne Partenaire) !',
        `${vol.name} a validé sa certification PSC 1 auprès d’une antenne partenaire du réseau (${cost} €). Obligation légale de Service Civique validée !`,
        'green'
      );
    }

    game.saveGame();
    game.updateStatsUI();
    if (game.currentModalKey === 'recrutement') {
      game.openModule('recrutement', true);
    }
  },

  // ==============================================================================
  // SYSTÈME DE RECRUTEMENT TERRITORIAL COHÉRENT (BASSIN D'ATTRACTIVITÉ & GÉOGRAPHIE)
  // ==============================================================================

  // Répertoire officiel de noms de voies typiquement françaises pour adresses crédibles en zone habitée
  VOIES_FRANCAISES: [
    'rue de la République', 'avenue de la Gare', 'rue Pasteur', 'boulevard Victor Hugo',
    'rue Jean Jaurès', 'avenue du Général de Gaulle', 'rue de Verdun', 'rue Saint-Jean',
    'rue de la Paix', 'avenue Jean Moulin', 'rue Gambetta', 'rue des Fleurs',
    'place de la Mairie', 'rue Anatole France', 'rue Henri Barbusse', 'avenue de la Liberté',
    'rue du Maréchal Foch', 'rue Voltaire', 'rue Émile Zola', 'rue de Lorraine',
    'rue de Bretagne', 'rue Paul Bert', 'place de la République', 'rue des Écoles',
    'rue Georges Clemenceau', 'rue Saint-Michel', 'avenue de France', 'rue du Commerce',
    'rue des Lilas', 'rue des Tilleuls', 'boulevard Gambetta', 'rue de l’Église'
  ],

  // 1. Récupère toutes les antennes connues dans la partie (du joueur et multijoueur)
  getAllKnownStations(game) {
    const list = [];
    const seen = new Set();

    (game.stations || []).forEach(st => {
      if (st && st.lat && st.lng && !seen.has(st.id)) {
        seen.add(st.id);
        list.push({
          id: st.id,
          name: st.name || 'Mon Antenne',
          departmentCode: String(st.departmentCode || game.currentDepartmentCode || '54').trim().toUpperCase(),
          lat: st.lat,
          lng: st.lng,
          city: st.city || 'Nancy',
          isPlayer: true
        });
      }
    });

    (game.allianceStations || []).forEach(st => {
      if (st && st.lat && st.lng && !seen.has(st.id)) {
        seen.add(st.id);
        list.push({
          id: st.id,
          name: st.station_name || st.name || 'Antenne Alliée',
          departmentCode: String(st.department_code || st.departmentCode || '').trim().toUpperCase(),
          lat: st.lat,
          lng: st.lng,
          city: st.city || '',
          isPlayer: false
        });
      }
    });

    return list;
  },

  getAllActiveAntennasInDepartment(game, deptCode) {
    const cleanDept = String(deptCode || '54').trim().toUpperCase();
    return this.getAllKnownStations(game).filter(s => s.departmentCode === cleanDept);
  },

  // 2. Sélectionne les communes et villages éligibles selon les règles départementales :
  // - Les candidatures peuvent provenir de TOUT le département (villes et villages)
  // - Aucune restriction arbitraire de 15 km : le recrutement couvre l'ensemble du territoire départemental
  getCatchmentCommunes(game, targetStation) {
    const station = targetStation || (game.stations && game.stations[0]) || { lat: 48.6921, lng: 6.1844, departmentCode: '54', city: 'Nancy' };
    const deptCode = String(station.departmentCode || game.currentDepartmentCode || (game.player && game.player.departmentCode) || '54').trim().toUpperCase();

    // Catalogue des communes et villages réels du département
    let communes = [];
    if (window.ProtecDepartements && typeof window.ProtecDepartements.getCommunesForDepartment === 'function') {
      communes = window.ProtecDepartements.getCommunesForDepartment(deptCode);
    }
    if (!communes || communes.length === 0) {
      communes = [{
        nom: station.city || 'Centre-Ville',
        cp: `${deptCode.padStart(2, '0')}000`,
        lat: station.lat || 48.6921,
        lng: station.lng || 6.1844
      }];
    }

    // Toutes les communes et tous les villages du département sont éligibles
    return communes.map(commune => {
      const dist = window.ProtecDepartements
        ? window.ProtecDepartements.calculateDistance(commune.lat, commune.lng, station.lat, station.lng)
        : 10;
      return {
        ...commune,
        _distKm: dist
      };
    });
  },

  // 3. Tirage équilibré parmi les villes et villages du département (sans barrière de 15 km)
  pickWeightedCommune(eligibleCommunes, station) {
    if (!eligibleCommunes || eligibleCommunes.length === 0) return null;
    if (eligibleCommunes.length === 1) return eligibleCommunes[0];

    // Tirage aléatoire équitable pour que les candidatures proviennent de l'ensemble du département
    const idx = Math.floor(Math.random() * eligibleCommunes.length);
    return eligibleCommunes[idx];
  },

  // 4. Interroge l'API officielle de la Base Adresse Nationale (BAN data.gouv.fr) pour obtenir une vraie adresse
  async fetchRealAddressFromBAN(lat, lng, communeNom = '', cp = '') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `https://api-adresse.data.gouv.fr/reverse/?lat=${lat}&lon=${lng}&type=housenumber`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const feat = data.features[0];
        const p = feat.properties;
        const coords = feat.geometry?.coordinates; // [lon, lat]
        if (p && p.label) {
          return {
            adresse: p.label,
            street: p.street || p.name,
            housenumber: p.housenumber || '',
            code_postal: p.postcode || cp,
            commune: p.city || communeNom,
            lat: coords ? coords[1] : lat,
            lng: coords ? coords[0] : lng,
            isOfficialBan: true
          };
        }
      }
    } catch (e) {
      // Ignorer silencieusement si hors-ligne ou timeout
    }
    return null;
  },

  // Résout et assigne une vraie adresse cadastrale officielle en tâche de fond
  resolveVolunteerRealAddress(volunteer, game) {
    if (!volunteer || !volunteer.coords_domicile) return;
    const lat = volunteer.coords_domicile.lat;
    const lng = volunteer.coords_domicile.lng;
    const commune = volunteer.commune;
    const cp = volunteer.code_postal;

    this.fetchRealAddressFromBAN(lat, lng, commune, cp).then(ban => {
      if (ban && ban.adresse) {
        volunteer.adresse = ban.adresse;
        volunteer.code_postal = ban.code_postal;
        volunteer.commune = ban.commune;
        if (ban.lat && ban.lng) {
          volunteer.coords_domicile = { lat: ban.lat, lng: ban.lng };
          const station = (game.stations || []).find(s => s.id === volunteer.stationId) || game.stations?.[0];
          if (station && window.ProtecDepartements) {
            volunteer.distance_base_km = parseFloat(window.ProtecDepartements.calculateDistance(ban.lat, ban.lng, station.lat, station.lng).toFixed(2));
            const speedKmh = volunteer.mode_transport === 'moto' ? 46 : (volunteer.mode_transport === 'voiture' ? 38 : 16);
            const prepMin = volunteer.mode_transport === 'voiture' ? 4 : 3;
            volunteer.temps_ralliement_minutes = Math.max(4, Math.round(prepMin + (volunteer.distance_base_km / speedKmh) * 60));
            volunteer.temps_trajet_base_minutes = volunteer.temps_ralliement_minutes;
          }
        }
        volunteer.isOfficialBanAddress = true;
        if (typeof game.saveGame === 'function') game.saveGame();
      }
    }).catch(() => {});
  },

  // 5. Génère une adresse résidentielle réaliste dans le département (ville ou village)
  generateVolunteerResidence(game, station, volunteerProfile = {}) {
    const baseStation = station || (game.stations && game.stations[0]) || { lat: 48.6921, lng: 6.1844, departmentCode: '54', city: 'Nancy' };
    
    // 1. Piocher parmi les communes et villages du département (sans restriction arbitraire de distance)
    const eligibleCommunes = this.getCatchmentCommunes(game, baseStation);
    const commune = this.pickWeightedCommune(eligibleCommunes, baseStation) || {
      nom: baseStation.city || 'Nancy',
      cp: `${(baseStation.departmentCode || '54').padStart(2, '0')}000`,
      lat: baseStation.lat,
      lng: baseStation.lng
    };

    // 2. Décalage modéré autour du centre de la commune (50 à 280 mètres en zone résidentielle/village)
    const angle = Math.random() * 2 * Math.PI;
    const distanceMeters = 50 + Math.random() * 230;
    const earthRadius = 6371000;
    const deltaLat = (distanceMeters * Math.cos(angle)) / earthRadius * (180 / Math.PI);
    const deltaLng = (distanceMeters * Math.sin(angle)) / (earthRadius * Math.cos(commune.lat * Math.PI / 180)) * (180 / Math.PI);

    const coordsDomicile = {
      lat: parseFloat((commune.lat + deltaLat).toFixed(5)),
      lng: parseFloat((commune.lng + deltaLng).toFixed(5))
    };

    // 3. Composition de l'adresse de base (numéro + voie crédible de la commune)
    const numVoie = Math.floor(Math.random() * 118) + 1;
    const suffixe = Math.random() < 0.08 ? ' bis' : '';
    const voie = this.VOIES_FRANCAISES[Math.floor(Math.random() * this.VOIES_FRANCAISES.length)];
    const adresseComplete = `${numVoie}${suffixe} ${voie}, ${commune.cp} ${commune.nom}`;

    // 4. Permis de conduire (très répandu dans les villes et villages du département)
    const age = volunteerProfile.age || 25;
    const hasExistingPermisB = volunteerProfile.skills?.includes('permis_b') || volunteerProfile.skills?.includes('permis_vpsp') || volunteerProfile.permis_b;
    const hasPermisB = hasExistingPermisB !== undefined ? !!hasExistingPermisB : (age >= 24 ? Math.random() < 0.94 : (age >= 20 ? Math.random() < 0.88 : Math.random() < 0.65));
    const hasPermisMoto = volunteerProfile.skills?.includes('permis_moto') ? true : (Math.random() < 0.16);
    // Permis C (Poids Lourd > 3.5t : FLIT, VALOG, PCM...)
    const hasExistingPermisC = volunteerProfile.skills?.includes('permis_c') || volunteerProfile.permis_c;
    const hasPermisC = hasExistingPermisC !== undefined ? !!hasExistingPermisC : (hasPermisB && age >= 21 && Math.random() < 0.18);

    // 5. Mode de transport
    let modeTransport = 'voiture';
    if (hasPermisB) {
      modeTransport = 'voiture';
    } else if (hasPermisMoto) {
      modeTransport = 'moto';
    } else {
      modeTransport = 'velo_transports';
    }

    // 6. Distance et temps de ralliement calculés selon la géographie départementale
    const distanceKm = window.ProtecDepartements
      ? parseFloat(window.ProtecDepartements.calculateDistance(coordsDomicile.lat, coordsDomicile.lng, baseStation.lat, baseStation.lng).toFixed(2))
      : 5.0;

    // Vitesse moyenne réaliste (prise en compte des axes départementaux / voies rapides si distance > 10 km)
    let speedKmh = 45;
    let prepMinutes = 3;
    if (modeTransport === 'voiture') {
      speedKmh = distanceKm > 25 ? 75 : (distanceKm > 10 ? 60 : 45);
    } else if (modeTransport === 'moto') {
      speedKmh = distanceKm > 25 ? 80 : (distanceKm > 10 ? 65 : 48);
    } else {
      speedKmh = 18;
    }

    const transitMinutes = Math.round((distanceKm / speedKmh) * 60);
    const tempsRalliementMinutes = Math.max(3, prepMinutes + transitMinutes);

    return {
      commune: commune.nom,
      code_postal: commune.cp,
      adresse: adresseComplete,
      coords_domicile: coordsDomicile,
      distance_base_km: distanceKm,
      temps_ralliement_minutes: tempsRalliementMinutes,
      mode_transport: modeTransport,
      permis_b: hasPermisB,
      permis_c: hasPermisC,
      permis_moto: hasPermisMoto
    };
  },

  // 6. Audit et assainissement de tous les bénévoles
  // Garantit que chaque bénévole possède une adresse valide dans une ville ou un village du département
  auditAndSanitizeAllVolunteersResidences(game) {
    if (!game || !game.volunteers || game.volunteers.length === 0) return;
    let modified = false;

    game.volunteers.forEach(v => {
      const station = (game.stations || []).find(s => s.id === v.stationId) || game.stations?.[0];
      if (!station) return;

      let deptCode = null;
      if (station.lat && station.lng && window.ProtecDepartements && typeof window.ProtecDepartements.getDepartmentByCoordinates === 'function') {
        const found = window.ProtecDepartements.getDepartmentByCoordinates(station.lat, station.lng);
        if (found) {
          deptCode = found.code;
          station.departmentCode = found.code;
        }
      }
      if (!deptCode) {
        deptCode = String(station.departmentCode || game.currentDepartmentCode || (game.player && game.player.departmentCode) || '54').trim().toUpperCase();
      }

      this.normalizeVolunteerUniform(v, deptCode);

      let needsReseed = false;

      // Doit avoir une commune, un code postal, des coordonnées et une adresse
      if (!v.adresse || !v.commune || !v.coords_domicile || !v.temps_ralliement_minutes) {
        needsReseed = true;
      }

      // Si le code postal ne correspond pas au département réel de la station
      if (!needsReseed && v.code_postal) {
        const cpPrefix = v.code_postal.slice(0, deptCode.length);
        if (cpPrefix !== deptCode && !['2A', '2B'].includes(deptCode)) {
          needsReseed = true;
        }
      }

      if (needsReseed) {
        const newGeo = this.generateVolunteerResidence(game, station, v);
        v.commune = newGeo.commune;
        v.code_postal = newGeo.code_postal;
        v.adresse = newGeo.adresse;
        v.coords_domicile = newGeo.coords_domicile;
        v.distance_base_km = newGeo.distance_base_km;
        v.temps_ralliement_minutes = newGeo.temps_ralliement_minutes;
        v.temps_trajet_base_minutes = newGeo.temps_ralliement_minutes;
        v.mode_transport = newGeo.mode_transport;
        v.permis_b = v.permis_b !== undefined ? v.permis_b : newGeo.permis_b;
        v.permis_c = v.permis_c !== undefined ? v.permis_c : (newGeo.permis_c !== undefined ? newGeo.permis_c : (v.permis_b && (v.age || 25) >= 21 && Math.random() < 0.18));
        v.permis_moto = v.permis_moto !== undefined ? v.permis_moto : newGeo.permis_moto;
        v.possede_permis = !!v.permis_b || !!v.permis_c || !!v.permis_moto;
        modified = true;
        this.resolveVolunteerRealAddress(v, game);
      } else if (!v.isOfficialBanAddress) {
        this.resolveVolunteerRealAddress(v, game);
      }
    });

    if (modified && typeof game.saveGame === 'function') {
      game.saveGame();
    }
  },

  // 7. Vérification de l'éligibilité d'un bénévole pour une urgence réflexe non anticipée
  isVolunteerEligibleForUrgentMission(volunteer, maxRallyMinutes = 20) {
    if (!volunteer) return { eligible: false, rallyMinutes: 99, reason: 'Inconnu' };

    if (volunteer.status === 'sdis_caserne' || volunteer.status === 'poste' || volunteer.onBase) {
      return { eligible: true, rallyMinutes: 0, isOnBase: true };
    }

    const tRally = volunteer.temps_ralliement_minutes !== undefined ? volunteer.temps_ralliement_minutes : 12;

    if (tRally <= maxRallyMinutes) {
      return { eligible: true, rallyMinutes: tRally, isOnBase: false };
    }

    return {
      eligible: false,
      rallyMinutes: tRally,
      isOnBase: false,
      reason: `Domicile trop éloigné (${tRally} min > ${maxRallyMinutes} min max réflexe)`
    };
  },

  // 8. Initialisation / Migration des données territoriales pour un bénévole
  ensureVolunteerResidence(volunteer, game) {
    if (!volunteer) return;

    const station = (game.stations || []).find(s => s.id === volunteer.stationId) || game.stations?.[0];
    if (!station) return;

    let needsReseed = false;
    if (!volunteer.commune || !volunteer.temps_ralliement_minutes || !volunteer.adresse || !volunteer.coords_domicile) {
      needsReseed = true;
    }

    if (needsReseed) {
      const geo = this.generateVolunteerResidence(game, station, volunteer);
      volunteer.commune = geo.commune;
      volunteer.code_postal = geo.code_postal;
      volunteer.adresse = geo.adresse;
      volunteer.coords_domicile = geo.coords_domicile;
      volunteer.distance_base_km = geo.distance_base_km;
      volunteer.temps_ralliement_minutes = geo.temps_ralliement_minutes;
      volunteer.temps_trajet_base_minutes = geo.temps_ralliement_minutes;
      volunteer.mode_transport = geo.mode_transport;
      volunteer.permis_b = volunteer.permis_b !== undefined ? volunteer.permis_b : geo.permis_b;
      volunteer.permis_c = volunteer.permis_c !== undefined ? volunteer.permis_c : geo.permis_c;
      volunteer.permis_moto = volunteer.permis_moto !== undefined ? volunteer.permis_moto : geo.permis_moto;
      volunteer.possede_permis = !!volunteer.permis_b || !!volunteer.permis_c || !!volunteer.permis_moto;
      this.resolveVolunteerRealAddress(volunteer, game);
    } else if (!volunteer.isOfficialBanAddress) {
      this.resolveVolunteerRealAddress(volunteer, game);
    }

    // Synchroniser avec les compétences si permis
    volunteer.skills = volunteer.skills || [];
    if (volunteer.permis_b && !volunteer.skills.includes('permis_b')) {
      volunteer.skills.push('permis_b');
    }
    if (volunteer.permis_c && !volunteer.skills.includes('permis_c')) {
      volunteer.skills.push('permis_c');
    }
    if (volunteer.permis_moto && !volunteer.skills.includes('permis_moto')) {
      volunteer.skills.push('permis_moto');
    }
  },

  // 6. Générateur d'effectifs constitutifs variés lors de la création d'antenne
  generateStarterVolunteers(count = 5, stationId = null, game = null) {
    const maleFirstNames = [
      'Alexandre', 'Thomas', 'Lucas', 'Julien', 'Maxime', 'Nicolas', 'Antoine', 'Hugo', 'Gabriel', 'Clément',
      'Mathis', 'Romain', 'Quentin', 'Enzo', 'Valentin', 'Florian', 'Louis', 'Léo', 'Arthur', 'Nathan',
      'Baptiste', 'Kévin', 'Damien', 'Sébastien', 'Pierre', 'Guillaume', 'Alexis', 'Théo', 'Adrien', 'Mathieu',
      'Benjamin', 'Vincent', 'Fabien', 'Thibault', 'Mickaël', 'Cédric', 'Arnaud'
    ];

    const femaleFirstNames = [
      'Sarah', 'Élodie', 'Camille', 'Inès', 'Chloé', 'Léa', 'Manon', 'Jade', 'Clara', 'Emma',
      'Charlotte', 'Juliette', 'Pauline', 'Marion', 'Laura', 'Sophie', 'Lucie', 'Mathilde', 'Océane', 'Audrey',
      'Céline', 'Amélie', 'Mélanie', 'Marine', 'Alice', 'Noémie', 'Julie', 'Margaux', 'Anaïs', 'Justine',
      'Émilie', 'Morgane', 'Estelle', 'Romane', 'Laure', 'Sabrina', 'Éléonore'
    ];

    const lastNames = [
      'Roux', 'Girard', 'Martin', 'Leroy', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
      'Durand', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Garcia', 'David', 'Bertrand', 'Morel',
      'Fournier', 'Benali', 'Fontaine', 'Chevalier', 'Robin', 'Masson', 'Sanchez', 'Gérard', 'Mercier', 'Blanc',
      'Guérin', 'Boyer', 'Garnier', 'Legrand', 'Gauthier', 'Perrin', 'Faure', 'Lemoine', 'Caron', 'Renard',
      'Dumont', 'Gros', 'Picard', 'Colin', 'Vidal', 'Aubry', 'Marchand', 'Meunier', 'Lemaire', 'Gaillard'
    ];

    const maleAvatars = ['👨‍💼', '🧑‍🚒', '🙋‍♂️', '👨‍🦱', '🧔', '👱‍♂️', '👨‍🦰', '👨‍⚕️', '🧑'];
    const femaleAvatars = ['👩‍🚒', '👩', '👩‍🦰', '🧕', '👩‍🦱', '👱‍♀️', '👩‍⚕️', '🧑'];

    const pickUnique = (arr, usedSet) => {
      const available = arr.filter(item => !usedSet.has(item));
      const pool = available.length > 0 ? available : arr;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      usedSet.add(chosen);
      return chosen;
    };

    const usedFirstNames = new Set();
    const usedLastNames = new Set();

    // Parité équilibrée (2 à 3 femmes, 2 à 3 hommes)
    const femaleCount = Math.random() < 0.5 ? 2 : 3;
    const genders = [];
    for (let i = 0; i < count; i++) {
      genders.push(i < femaleCount ? 'f' : 'h');
    }
    genders.sort(() => Math.random() - 0.5);

    const dispoSchedules = [
      ['Vendredi', 'Samedi', 'Dimanche'],
      ['Samedi', 'Dimanche'],
      ['Mardi', 'Samedi', 'Dimanche'],
      ['Mercredi', 'Vendredi', 'Samedi'],
      ['Lundi', 'Vendredi', 'Samedi'],
      ['Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
      ['Mercredi', 'Samedi', 'Dimanche'],
      ['Mardi', 'Jeudi', 'Samedi'],
      ['Vendredi', 'Samedi']
    ];

    const traits = ['devoue', 'rigoureux', 'calme', 'dynamique', 'pedagogue', 'enthousiaste', 'ponctuel', 'equilibre'];

    // Profils équilibrés pour une antenne immédiatement opérationnelle
    const slotTemplates = [
      // 1. Cadre d'antenne / Chef d'équipe expérimenté (CE)
      {
        role: 'Chef d’Équipe',
        rank: 'CE',
        baseExp: 30 + Math.floor(Math.random() * 12),
        mandatorySkills: ['ce', 'pse2', 'pse1', 'permis_b'],
        bonusSkillPool: ['permis_vpsp', 'commandement', 'communication_1'],
        socialTypes: ['salarie', 'actif', 'fonctionnaire'],
        preferredTrait: ['rigoureux', 'calme', 'pedagogue', 'devoue']
      },
      // 2. Équipier secouriste confirmé (PSE2) ou Professionnel de Santé bénévole (Médecin / Infirmier)
      (() => {
        if (Math.random() < 0.35) {
          const isDoc = Math.random() < 0.45;
          return {
            role: isDoc ? 'Médecin Urgentiste' : 'Infirmier DE Urgences',
            rank: 'PSE2',
            professionCivil: isDoc ? 'medecin' : 'infirmier',
            isDoctor: isDoc,
            isNurse: !isDoc,
            baseExp: (isDoc ? 35 : 25) + Math.floor(Math.random() * 10),
            mandatorySkills: isDoc ? ['medecin', 'pse2', 'pse1', 'permis_b'] : ['infirmier', 'pse2', 'pse1', 'permis_b'],
            bonusSkillPool: ['pma', 'cai', 'permis_vpsp'],
            socialTypes: ['actif', 'salarie'],
            preferredTrait: ['calme', 'rigoureux', 'devoue']
          };
        }
        return {
          role: 'Équipier Secouriste',
          rank: 'PSE2',
          baseExp: 22 + Math.floor(Math.random() * 10),
          mandatorySkills: ['pse2', 'pse1'],
          bonusSkillPool: ['permis_b', 'permis_vpsp', 'pma'],
          socialTypes: ['etudiant', 'salarie', 'independant'],
          preferredTrait: ['dynamique', 'devoue', 'enthousiaste']
        };
      })(),
      // 3. Second Équipier secouriste (PSE2 ou Chauffeur)
      {
        role: Math.random() < 0.4 ? 'Secouriste Chauffeur' : 'Équipier Secouriste',
        rank: 'PSE2',
        baseExp: 18 + Math.floor(Math.random() * 10),
        mandatorySkills: ['pse2', 'pse1'],
        bonusSkillPool: ['permis_b', 'permis_vpsp', 'logistique', 'qcpr', 'tronc', 'ceps'],
        socialTypes: ['salarie', 'parent', 'actif'],
        preferredTrait: ['calme', 'ponctuel', 'equilibre']
      },
      // 4. Secouriste opérationnel (PSE1)
      {
        role: 'Secouriste',
        rank: 'PSE1',
        baseExp: 12 + Math.floor(Math.random() * 8),
        mandatorySkills: ['pse1'],
        bonusSkillPool: ['permis_b', 'communication_1', 'qcpr'],
        socialTypes: ['etudiant', 'salarie', 'parent'],
        preferredTrait: ['enthousiaste', 'dynamique', 'devoue']
      },
      // 5. Secouriste ou nouvel engagé (PSE1 à 80% ou Stagiaire à 20%)
      {
        role: Math.random() < 0.2 ? 'Bénévole Stagiaire' : 'Secouriste',
        rank: Math.random() < 0.2 ? 'Stagiaire' : 'PSE1',
        baseExp: 6 + Math.floor(Math.random() * 8),
        mandatorySkills: ['pse1'],
        bonusSkillPool: ['permis_b', 'communication_1'],
        socialTypes: ['etudiant', 'salarie'],
        preferredTrait: ['enthousiaste', 'curieux', 'devoue']
      }
    ];

    const volunteers = [];

    for (let i = 0; i < count; i++) {
      const template = slotTemplates[i] || slotTemplates[slotTemplates.length - 1];
      const isFemale = genders[i] === 'f';
      const fn = isFemale ? pickUnique(femaleFirstNames, usedFirstNames) : pickUnique(maleFirstNames, usedFirstNames);
      const ln = pickUnique(lastNames, usedLastNames);
      const avatar = isFemale 
        ? femaleAvatars[Math.floor(Math.random() * femaleAvatars.length)] 
        : maleAvatars[Math.floor(Math.random() * maleAvatars.length)];

      const socialChoice = template.socialTypes[Math.floor(Math.random() * template.socialTypes.length)];
      const dispoType = isFemale && socialChoice === 'etudiant' ? 'étudiante' : socialChoice;
      const dispoJours = dispoSchedules[Math.floor(Math.random() * dispoSchedules.length)];

      const skills = [...template.mandatorySkills];
      if (template.rank === 'Stagiaire') {
        skills.length = 0;
        skills.push('psc1');
      }

      // Ajout de 1 à 2 compétences bonus adaptées
      const bonusCandidate = template.bonusSkillPool[Math.floor(Math.random() * template.bonusSkillPool.length)];
      if (bonusCandidate && !skills.includes(bonusCandidate)) {
        skills.push(bonusCandidate);
      }
      if (Math.random() < 0.6 && !skills.includes('permis_b') && template.rank !== 'Stagiaire') {
        skills.push('permis_b');
      }

      const trait = template.preferredTrait[Math.floor(Math.random() * template.preferredTrait.length)] || traits[Math.floor(Math.random() * traits.length)];
      const motivation = Math.round(78 + Math.random() * 18); // 78% à 96%

      const vol = {
        id: `vol-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
        name: `${fn} ${ln}`,
        role: template.role,
        rank: template.rank,
        gender: isFemale ? 'f' : 'h',
        avatar: avatar,
        exp: template.baseExp,
        energy: 100,
        motivation: motivation,
        humeur: 85,
        trait: trait,
        contractType: 'benevole',
        profilSocial: socialChoice === 'etudiant' ? 'etudiant' : 'salarie',
        status: 'dispo',
        stationId: stationId,
        isTrainer: skills.includes('ce') && Math.random() < 0.25,
        dispoType: dispoType,
        dispoJours: dispoJours,
        skills: skills,
        isDoctor: Boolean(template.isDoctor || skills.includes('medecin')),
        isNurse: Boolean(template.isNurse || skills.includes('infirmier')),
        professionCivil: template.professionCivil || (skills.includes('medecin') ? 'medecin' : (skills.includes('infirmier') ? 'infirmier' : null))
      };

      if (game && this.ensureVolunteerResidence) {
        this.ensureVolunteerResidence(vol, game);
      }

      volunteers.push(vol);
    }

    return volunteers;
  },

  // =========================================================================
  // GESTION DES DOTATIONS DE TENUES (MAX 3) ET DES 3 PAIRES DE RANGERS
  // =========================================================================

  RANGERS_TIERS: {
    rangers1: {
      id: 'rangers1',
      name: 'Rangers Standard',
      quality: 'Base',
      badge: 'Base',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
      price: 65,
      moralBonus: 5,
      icon: '🥾',
      image: 'images/equipements/rangers1.png',
      desc: 'Rangers réglementaires. Protection de base (+5 Moral).'
    },
    rangers2: {
      id: 'rangers2',
      name: 'Rangers Confort',
      quality: 'Bien',
      badge: 'Bien',
      badgeClass: 'bg-blue-100 text-pc-blue border-blue-300 dark:bg-blue-950/60 dark:text-sky-300',
      price: 120,
      moralBonus: 12,
      icon: '🥾',
      image: 'images/equipements/rangers2.png',
      desc: 'Semelle amortissante et cuir souple (+12 Moral).'
    },
    rangers3: {
      id: 'rangers3',
      name: 'Rangers Pro',
      quality: 'Super',
      badge: 'Super',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200',
      price: 190,
      moralBonus: 20,
      icon: '🥾',
      image: 'images/equipements/rangers3.png',
      desc: 'Membrane respirante haut de gamme et confort optimal (+20 Moral).'
    }
  },

  getRangersInfo(rangersType) {
    if (!rangersType) {
      return {
        id: null,
        name: 'Sans rangers',
        quality: 'Aucune',
        badge: 'Sans rangers',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
        price: 0,
        moralBonus: 0,
        icon: '👟',
        image: null,
        desc: 'Chaussures personnelles civiles. Aucun bonus.'
      };
    }
    const key = (rangersType === 'rangers_secours') ? 'rangers1' : rangersType;
    return this.RANGERS_TIERS[key] || this.RANGERS_TIERS.rangers1;
  },

  normalizeVolunteerUniform(vol, deptCode = null) {
    if (!vol) return;
    if (vol.uniformCount === undefined) {
      vol.uniformCount = (vol.hasUniform !== false) ? 1 : 0;
    }
    vol.uniformCount = Math.max(0, Math.min(3, parseInt(vol.uniformCount) || 0));
    vol.hasUniform = vol.uniformCount > 0;
    if (vol.rangersType === undefined) {
      if (deptCode && window.ProtecDepartements?.getUniformPolicy) {
        const policy = window.ProtecDepartements.getUniformPolicy(deptCode);
        vol.rangersType = (vol.hasUniform && policy.initialRangers) ? policy.initialRangers : null;
      } else {
        vol.rangersType = vol.hasUniform ? 'rangers1' : null;
      }
    }
  },

  // Dotation individuelle d'une Tenue officielle Protection Civile (jusqu'à 3 par bénévole)
  equipVolunteer(game, volunteerId) {
    return this.equipVolunteerTenue(game, volunteerId);
  },

  equipVolunteerTenue(game, volunteerId) {
    if (!game || !game.volunteers) return;
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!vol) return;

    this.normalizeVolunteerUniform(vol);

    if (vol.uniformCount >= 3) {
      if (typeof game.showToast === 'function') {
        game.showToast('Dotation Maximale Atteinte', `${vol.name} possède déjà 3 tenues officielles (maximum autorisé).`, 'blue');
      }
      return;
    }

    const station = (game.stations || []).find(s => s.id === vol.stationId) || game.stations?.[0];
    if (!station) return;
    if (!station.stock) station.stock = {};

    const stockTenues = (station.stock.tenue_pc || 0) + (station.stock.tenue_moto || 0) + (station.stock.tenue_usar || 0) + (station.stock.tenue_f1 || 0);

    if (stockTenues > 0) {
      let chosenType = vol.uniformType || 'pc';
      let chosenLabel = 'Pack Tenue Protection Civile';
      let icon = '👕';

      if (vol.skills?.includes('moto') && station.stock.tenue_moto > 0) {
        station.stock.tenue_moto--;
        chosenType = 'moto';
        chosenLabel = 'Tenue Moto de Secours';
        icon = '🏍️';
      } else if (vol.skills?.includes('usar') && station.stock.tenue_usar > 0) {
        station.stock.tenue_usar--;
        chosenType = 'usar';
        chosenLabel = 'Tenue Tactique USAR';
        icon = '🦺';
      } else if (station.stock.tenue_pc && station.stock.tenue_pc > 0) {
        station.stock.tenue_pc--;
        chosenType = 'pc';
      } else if (station.stock.tenue_moto && station.stock.tenue_moto > 0) {
        station.stock.tenue_moto--;
        chosenType = 'moto';
        chosenLabel = 'Tenue Moto de Secours';
        icon = '🏍️';
      } else if (station.stock.tenue_usar && station.stock.tenue_usar > 0) {
        station.stock.tenue_usar--;
        chosenType = 'usar';
        chosenLabel = 'Tenue Tactique USAR';
        icon = '🦺';
      } else if (station.stock.tenue_f1 && station.stock.tenue_f1 > 0) {
        station.stock.tenue_f1--;
        chosenType = 'f1';
      }

      vol.uniformCount = (vol.uniformCount || 0) + 1;
      vol.hasUniform = true;
      vol.uniformType = chosenType;
      vol.uniformEquippedAt = Date.now();

      const bonusMoral = vol.uniformCount === 1 ? 15 : 10;
      vol.moral = Math.min(100, (vol.moral || 50) + bonusMoral);
      vol.motivation = Math.min(100, (vol.motivation || 50) + bonusMoral);
      vol.humeur = vol.moral;

      if (typeof game.showToast === 'function') {
        const title = vol.uniformCount === 1 ? `${icon} 1ère Tenue Dotée !` : (vol.uniformCount === 2 ? `${icon} 2ème Tenue Dotée !` : `${icon} 3ème Tenue Dotée (Max) !`);
        const desc = vol.uniformCount === 1 
          ? `${vol.name} a reçu son équipement officiel (+15 Moral) ! Opérationnel(le) pour le terrain.`
          : `${vol.name} a maintenant ${vol.uniformCount}/3 tenues (+10 Moral). Confort et rotation assurés !`;
        game.showToast(title, desc, 'green');
      }
      game.updateStatsUI();
      game.saveGame();
    } else {
      const cost = 160;
      if (game.resources.money >= cost) {
        if (confirm(`Aucune tenue en réserve à l'antenne. Acheter immédiatement 1 Pack Tenue pour ${cost} € et équiper ${vol.name} (actuellement ${vol.uniformCount}/3) ?`)) {
          game.resources.money -= cost;
          vol.uniformCount = (vol.uniformCount || 0) + 1;
          vol.hasUniform = true;
          vol.uniformEquippedAt = Date.now();

          const bonusMoral = vol.uniformCount === 1 ? 15 : 10;
          vol.moral = Math.min(100, (vol.moral || 50) + bonusMoral);
          vol.motivation = Math.min(100, (vol.motivation || 50) + bonusMoral);
          vol.humeur = vol.moral;

          if (typeof game.showToast === 'function') {
            game.showToast('👕 Tenue Achetée & Dotée !', `${vol.name} a maintenant ${vol.uniformCount}/3 tenue(s) (+${bonusMoral} Moral).`, 'green');
          }
          game.updateStatsUI();
          game.saveGame();
        }
      } else {
        if (typeof game.showToast === 'function') {
          game.showToast('Trésorerie Insuffisante', `Aucune tenue en stock et solde insuffisant (160 € requis).`, 'orange');
        }
      }
    }
  },

  // Dotation ou mise à niveau des Rangers d'un bénévole
  equipVolunteerRangers(game, volunteerId, targetRangersId) {
    if (!game || !game.volunteers) return;
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!vol) return;

    this.normalizeVolunteerUniform(vol);
    const targetInfo = this.getRangersInfo(targetRangersId);
    if (!targetInfo || !targetInfo.id) return;

    if (vol.rangersType === targetInfo.id) {
      if (typeof game.showToast === 'function') {
        game.showToast('Déjà Équipé(e)', `${vol.name} porte déjà ces ${targetInfo.name}.`, 'blue');
      }
      return;
    }

    const station = (game.stations || []).find(s => s.id === vol.stationId) || game.stations?.[0];
    if (!station) return;
    if (!station.stock) station.stock = {};

    const stockQty = station.stock[targetInfo.id] || 0;

    if (stockQty > 0) {
      station.stock[targetInfo.id]--;
      // Récupération de l'ancienne paire au stock si applicable
      if (vol.rangersType && station.stock[vol.rangersType] !== undefined) {
        station.stock[vol.rangersType]++;
      }
      vol.rangersType = targetInfo.id;
      const boost = targetInfo.moralBonus || 10;
      vol.moral = Math.min(100, (vol.moral || 50) + boost);
      vol.motivation = Math.min(100, (vol.motivation || 50) + boost);
      vol.humeur = vol.moral;

      if (typeof game.showToast === 'function') {
        game.showToast(
          `🥾 ${targetInfo.name} Dotées (${targetInfo.quality}) !`,
          `${vol.name} a reçu ses ${targetInfo.name} (+${boost} Moral & Motivation) ! Confort optimal sur le terrain.`,
          'green'
        );
      }
      game.updateStatsUI();
      game.saveGame();
    } else {
      const cost = targetInfo.price || 65;
      if (game.resources.money >= cost) {
        if (confirm(`Aucune paire de ${targetInfo.name} en réserve. Acheter immédiatement pour ${cost} € et doter ${vol.name} ?`)) {
          game.resources.money -= cost;
          if (vol.rangersType && station.stock[vol.rangersType] !== undefined) {
            station.stock[vol.rangersType]++;
          }
          vol.rangersType = targetInfo.id;
          const boost = targetInfo.moralBonus || 10;
          vol.moral = Math.min(100, (vol.moral || 50) + boost);
          vol.motivation = Math.min(100, (vol.motivation || 50) + boost);
          vol.humeur = vol.moral;

          if (typeof game.showToast === 'function') {
            game.showToast(
              `🥾 ${targetInfo.name} Achetées (${targetInfo.quality}) !`,
              `${vol.name} est doté(e) de ses ${targetInfo.name} pour ${cost} € (+${boost} Moral) !`,
              'green'
            );
          }
          game.updateStatsUI();
          game.saveGame();
        }
      } else {
        if (typeof game.showToast === 'function') {
          game.showToast('Fonds Insuffisants', `Aucune paire de ${targetInfo.name} en réserve et solde insuffisant (${cost} €).`, 'orange');
        }
      }
    }
  },

  // Modale de sélection interactive pour doter / upgrader les Rangers d'un bénévole
  openEquipRangersModal(game, volunteerId) {
    if (!game || !game.volunteers) return;
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!vol) return;

    this.normalizeVolunteerUniform(vol);
    const station = (game.stations || []).find(s => s.id === vol.stationId) || game.stations?.[0];
    const currentRangers = this.getRangersInfo(vol.rangersType);

    const modalId = 'equip-rangers-modal';
    let modalEl = document.getElementById(modalId);
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = modalId;
      document.body.appendChild(modalEl);
    }

    const tiers = ['rangers1', 'rangers2', 'rangers3'];

    modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4';
    modalEl.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white/80 space-y-5 animate-in fade-in">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl font-black">
              🥾
            </div>
            <div>
              <h4 class="text-sm font-black text-slate-900">Dotation Rangers de Sécurité</h4>
              <p class="text-xs text-slate-500 font-semibold">${vol.name} • Actuel : <strong>${currentRangers.name}</strong> (${currentRangers.quality})</p>
            </div>
          </div>
          <button onclick="document.getElementById('${modalId}').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs cursor-pointer">
            ✕
          </button>
        </div>

        <div class="space-y-3">
          ${tiers.map(k => {
            const r = this.RANGERS_TIERS[k];
            const stockQty = (station?.stock?.[k]) || 0;
            const isEquipped = vol.rangersType === k;

            return `
              <div class="p-3.5 rounded-2xl border ${isEquipped ? 'border-pc-blue bg-blue-50/70 ring-2 ring-blue-200' : 'border-slate-200 bg-white hover:border-slate-300'} flex items-center justify-between gap-3 transition">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0">
                    <img src="${r.image}" alt="${r.name}" class="max-h-full max-w-full object-contain" onerror="this.outerHTML='🥾'" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h5 class="text-xs font-black text-slate-900">${r.name}</h5>
                      <span class="px-2 py-0.2 rounded text-[9px] font-black border ${r.badgeClass}">${r.quality}</span>
                      <span class="text-[10px] font-extrabold text-emerald-600">+${r.moralBonus} Moral</span>
                    </div>
                    <p class="text-[11px] text-slate-500 mt-0.5">${r.desc}</p>
                    <div class="text-[10px] text-slate-400 mt-0.5">
                      En réserve antenne : <strong class="text-slate-700">${stockQty} paire(s)</strong> • Achat neuf : <strong>${r.price} €</strong>
                    </div>
                  </div>
                </div>

                <div>
                  ${isEquipped ? `
                    <span class="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-300">
                      ✓ Portée
                    </span>
                  ` : `
                    <button type="button" onclick="window.ProtecPersonnel.equipVolunteerRangers(window.game, '${vol.id}', '${k}'); document.getElementById('${modalId}').remove(); window.game.openModule('recrutement');" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs ${stockQty > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-pc-blue hover:bg-pc-blue-light text-white'}">
                      ${stockQty > 0 ? 'Doter (Stock)' : `Acheter (${r.price} €)`}
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
          💡 <em>Plus la qualité des rangers est haute (Base ➔ Bien ➔ Super), plus vos secouristes bénéficient de confort et restent motivés lors des longues interventions.</em>
        </div>
      </div>
    `;
  },

  // Dotation groupée de tous les bénévoles en attente de tenue (priorité à ceux avec 0 tenue)
  equipAllWaitingVolunteers(game, stationId = null) {
    if (!game || !game.volunteers) return;
    const station = stationId ? ((game.stations || []).find(s => s.id === stationId) || game.stations?.[0]) : game.stations?.[0];
    if (!station) return;
    if (!station.stock) station.stock = {};

    let stockTenues = (station.stock.tenue_pc || 0) + (station.stock.tenue_moto || 0) + (station.stock.tenue_usar || 0) + (station.stock.tenue_f1 || 0);
    if (stockTenues <= 0) {
      if (typeof game.showToast === 'function') {
        game.showToast('Stock de Tenues Épuisé', 'Aucune tenue disponible en réserve. Commandez-en dans la boutique logistique.', 'orange');
      }
      return;
    }

    // Priorité 1 : Ceux avec 0 tenue (pour être opérationnels)
    game.volunteers.forEach(v => this.normalizeVolunteerUniform(v));
    const zeroUniformVols = game.volunteers.filter(v => 
      (v.stationId === station.id || !v.stationId) && v.uniformCount === 0
    );

    let count = 0;
    while (stockTenues > 0 && zeroUniformVols.length > 0) {
      const vol = zeroUniformVols.shift();
      this.equipVolunteerTenue(game, vol.id);
      stockTenues = (station.stock.tenue_pc || 0) + (station.stock.tenue_moto || 0) + (station.stock.tenue_usar || 0) + (station.stock.tenue_f1 || 0);
      count++;
    }

    // Priorité 2 : Si du stock reste, compléter ceux qui ont moins de 3 tenues
    if (stockTenues > 0) {
      const partialVols = game.volunteers.filter(v => 
        (v.stationId === station.id || !v.stationId) && v.uniformCount < 3
      );
      while (stockTenues > 0 && partialVols.length > 0) {
        const vol = partialVols.shift();
        this.equipVolunteerTenue(game, vol.id);
        stockTenues = (station.stock.tenue_pc || 0) + (station.stock.tenue_moto || 0) + (station.stock.tenue_usar || 0) + (station.stock.tenue_f1 || 0);
        count++;
      }
    }

    if (count > 0 && typeof game.showToast === 'function') {
      game.showToast('👕 Dotation Terminée !', `${count} tenue(s) officielle(s) distribuée(s) aux secouristes !`, 'green');
    }
    game.updateStatsUI();
    game.saveGame();
  }
};

