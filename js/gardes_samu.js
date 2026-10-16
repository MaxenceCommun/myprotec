/**
 * PROTEC LIVE - MODULE DE GESTION DES GARDES SAMU & SDIS
 * 
 * Règles fonctionnelles :
 * 1. Paliers de convention selon la taille de l'antenne :
 *    - Grosse antenne (≥ 25 bénévoles ou ≥ 2 VPSP) : gardes régulières tous les soirs (nuit) + week-ends 24h/24 + urgences.
 *    - Moyenne antenne (12 à 24 bénévoles) : gardes régulières uniquement le week-end et jours fériés + urgences.
 *    - Petite antenne (< 12 bénévoles) : uniquement en cas d'urgence / astreinte de crise (pics, NOVI, plan blanc).
 * 
 * 2. Gestion stricte des effectifs :
 *    - Le SAMU demande un vecteur (1 VPSP armé d'un équipage de 3 secouristes dont au moins 1 CE/PSE2).
 *    - RÈGLE D'OR : Même en automatique, le joueur garde la main sur les effectifs.
 *      SI PERSONNE N'EST INSCRIT À LA GARDE -> AUCUN DÉCLENCHEMENT DU VECTEUR (Carence opérationnelle notifiée).
 * 
 * 3. Choix de posture & Économie de fatigue :
 *    - "À la base prêt à partir" : temps de ralliement nul, départ réflexe immédiat (auto), mais fatigue accrue (-15 énergie).
 *    - "Dispo domicile" : les bénévoles restent chez eux au repos, délai de ralliement en cas d'appel, mais fatigue économisée (-3 énergie).
 *    - Le risque est défini par le SAMU/SDIS au moment de la demande (Faible/Modéré -> Domicile préconisé, Élevé/Critique -> Base préconisée).
 * 
 * 4. Présence systématique dans le Planning :
 *    - Toutes les gardes (régulières, urgences, prévisionnelles) sont inscrites et visibles dans le planning.
 * 
 * 5. Demandes d'urgence & Demandes prévisionnelles :
 *    - Déclenchement d'urgence sur pic sanitaire exceptionnel (NOVI, incendie, canicule).
 *    - Demande prévisionnelle quelques heures ou jours à l'avance pour anticiper un pic d'activité.
 */

window.ProtecGardesSamu = {
  // Déterminer le palier de convention de l'antenne
  getAntennaTier(game) {
    const vols = game.volunteers || [];
    const totalVols = vols.length;
    const vpsps = (game.vehicles || []).filter(v => v.type === 'VPSP');
    const vpspCount = vpsps.length;
    const stationsCount = (game.stations || []).length;

    if (totalVols >= 25 || (totalVols >= 18 && vpspCount >= 2) || stationsCount >= 2) {
      return {
        id: 'grosse',
        label: 'Grande Antenne Opérationnelle',
        badge: 'Grosse Antenne (≥ 25 secouristes)',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200',
        conventionDesc: 'Gardes régulières tous les soirs (nuit) • Week-ends complets • Astreinte d’urgence et renforts zonaux',
        cadenceText: 'Tous les soirs & Week-ends',
        allowsDailyEvenings: true,
        allowsWeekends: true,
        allowsEmergencies: true
      };
    } else if (totalVols >= 12) {
      return {
        id: 'moyenne',
        label: 'Antenne Moyenne Standard',
        badge: 'Moyenne Antenne (12 à 24 secouristes)',
        badgeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200',
        conventionDesc: 'Gardes régulières les week-ends et jours fériés • Déclenchements sur pic d’urgence SAMU / SDIS',
        cadenceText: 'Week-ends & Jours fériés uniquement',
        allowsDailyEvenings: false,
        allowsWeekends: true,
        allowsEmergencies: true
      };
    } else {
      return {
        id: 'petite',
        label: 'Petite Antenne Locale / Proximité',
        badge: 'Petite Antenne (< 12 secouristes)',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200',
        conventionDesc: 'Uniquement en cas d’urgence sanitaire exceptionnelle (NOVI, pic d’activité, plan blanc, incendie majeur)',
        cadenceText: 'Urgences & Situations sanitaires exceptionnelles uniquement',
        allowsDailyEvenings: false,
        allowsWeekends: false,
        allowsEmergencies: true
      };
    }
  },

  // Vérifier si une date correspond à un week-end ou un jour férié
  isDateWeekendOrHoliday(year, month, day) {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay(); // 0 = Dimanche, 6 = Samedi
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    // Jours fériés français fixes (mois 0-indexed)
    const holidays = [
      '0-1',   // 1er Janvier
      '4-1',   // 1er Mai
      '4-8',   // 8 Mai
      '6-14',  // 14 Juillet
      '7-15',  // 15 Août
      '10-1',  // 1er Novembre
      '10-11', // 11 Novembre
      '11-25'  // 25 Décembre
    ];
    const isHoliday = holidays.includes(`${month}-${day}`);

    return {
      isWeekend,
      isHoliday,
      isFriday: dayOfWeek === 5,
      isEligibleForGuard: isWeekend || isHoliday || dayOfWeek === 5
    };
  },

  // Synchroniser et générer les gardes au planning pour les prochains jours
  syncPlanningGuards(game) {
    if (!game || !game.samuConvention?.signed) return;
    if (!Array.isArray(game.missions)) game.missions = [];

    const tier = this.getAntennaTier(game);
    const now = new Date(Date.now() + (game.serverTimeOffset || 0));
    const curYear = game.clock?.year || now.getFullYear();
    const curMonth = game.clock?.month !== undefined ? game.clock.month : now.getMonth();
    const curDay = game.clock?.day || now.getDate();

    // Anticiper les 5 prochains jours
    for (let offset = 0; offset <= 4; offset++) {
      const targetDate = new Date(curYear, curMonth, curDay + offset);
      const tYear = targetDate.getFullYear();
      const tMonth = targetDate.getMonth();
      const tDay = targetDate.getDate();

      const dateInfo = this.isDateWeekendOrHoliday(tYear, tMonth, tDay);

      // Déterminer si ce jour doit comporter une garde selon le palier
      let slotsToCreate = [];

      if (tier.allowsDailyEvenings) {
        // Grosse antenne : garde tous les soirs (20h - 02h) + garde journée le week-end (08h - 20h)
        slotsToCreate.push({
          slotId: 'nuit',
          startHour: 20,
          durationHours: 6,
          title: `Garde SAMU 15 (Nuit ${tDay}/${tMonth + 1})`,
          riskLevel: dateInfo.isEligibleForGuard ? 'eleve' : 'modere',
          guardType: 'reguliere'
        });

        if (dateInfo.isWeekend || dateInfo.isHoliday) {
          slotsToCreate.push({
            slotId: 'jour',
            startHour: 8,
            durationHours: 12,
            title: `Garde SAMU 15 (Journée WE ${tDay}/${tMonth + 1})`,
            riskLevel: 'modere',
            guardType: 'reguliere'
          });
        }
      } else if (tier.allowsWeekends) {
        // Moyenne antenne : uniquement le week-end et veilles/jours fériés
        if (dateInfo.isFriday) {
          slotsToCreate.push({
            slotId: 'nuit',
            startHour: 20,
            durationHours: 6,
            title: `Garde SAMU 15 (Vendredi Soir ${tDay}/${tMonth + 1})`,
            riskLevel: 'modere',
            guardType: 'reguliere'
          });
        } else if (dateInfo.isWeekend || dateInfo.isHoliday) {
          slotsToCreate.push({
            slotId: 'jour',
            startHour: 8,
            durationHours: 12,
            title: `Garde SAMU 15 (WE Jour ${tDay}/${tMonth + 1})`,
            riskLevel: 'modere',
            guardType: 'reguliere'
          });
          slotsToCreate.push({
            slotId: 'nuit',
            startHour: 20,
            durationHours: 6,
            title: `Garde SAMU 15 (WE Nuit ${tDay}/${tMonth + 1})`,
            riskLevel: 'eleve',
            guardType: 'reguliere'
          });
        }
      }
      // Petite antenne : aucune garde régulière automatique planifiée.

      // Créer les missions de gardes si elles n'existent pas encore
      slotsToCreate.forEach(slot => {
        const guardId = `garde-samu-${tYear}-${tMonth}-${tDay}-${slot.slotId}`;
        const existing = game.missions.find(m => m.id === guardId);

        if (!existing) {
          const baseCity = game.stations?.[0]?.city || 'Nancy';
          const newGuardMission = {
            id: guardId,
            type: 'garde_samu',
            isGarde: true,
            isPlanned: true,
            status: 'planifie',
            title: slot.title,
            desc: `Convention Partenariale SAMU 15 : Mise à disposition sous astreinte ou garde postée d'une ambulance VPSP armée pour les interventions d'urgence sous régulation 15.`,
            categoryLabel: 'Garde Conventionnée SAMU 15',
            scale: 'Vecteur VPSP (1 CE + 1 PSE2 + 1 PSE1)',
            eventDate: {
              year: tYear,
              month: tMonth,
              day: tDay,
              hour: slot.startHour,
              minute: 0
            },
            startHour: slot.startHour,
            durationHours: slot.durationHours,
            durationSeconds: slot.durationHours * 3600,
            requiredVolunteers: 3,
            requiredVehicles: ['VPSP'],
            requiredRanks: ['CE', 'PSE2', 'PSE1'],
            registeredVolunteers: [], // STRICTEMENT VIDE PAR DÉFAUT : LE JOUEUR GÈRE SES EFFECTIFS
            assignedCrew: { volunteers: [], vehicles: [] },
            volunteerRoles: {}, // volunteerId -> 'chef_de_bord' | 'equipier' | 'conducteur'
            posture: slot.riskLevel === 'eleve' ? 'base' : 'domicile', // 'base' (Prêt à partir) ou 'domicile' (Dispo domicile)
            riskLevel: slot.riskLevel, // 'faible' | 'modere' | 'eleve' | 'critique'
            guardType: slot.guardType, // 'reguliere' | 'previsionnelle' | 'urgence'
            rewardMoney: slot.durationHours * 45 + 100, // Indemnisation horaire de mise à disposition
            rewardReputation: 25,
            address: `Base Opérationnelle - Antenne ${baseCity}`,
            commune: baseCity,
            lat: game.stations?.[0]?.lat || 48.6921,
            lng: game.stations?.[0]?.lng || 6.1844,
            createdAt: Date.now()
          };

          game.missions.push(newGuardMission);
        }
      });
    }
  },

  // Générer une Demande Prévisionnelle SAMU / SDIS en anticipation d'un pic (quelques heures/jours avant)
  generateForecastGuard(game, context = {}) {
    if (!game || !game.samuConvention?.signed) return null;
    const now = new Date(Date.now() + (game.serverTimeOffset || 0));

    const scenarios = [
      {
        title: 'Anticipation SAMU : Surtension Urgences / Match à Risque',
        reason: 'Rencontre sportive sous haute affluence et rassemblements urbains. La régulation 15 sollicite un VPSP supplémentaire en prépositionnement.',
        hoursAhead: 2,
        durHours: 6,
        risk: 'eleve'
      },
      {
        title: 'Anticipation SAMU : Alerte Canicule & Pic Déshydratation',
        reason: 'Épisode de forte chaleur entraînant une surcharge des appels 15 pour malaises et personnes vulnérables.',
        hoursAhead: 4,
        durHours: 8,
        risk: 'modere'
      },
      {
        title: 'Anticipation SAMU : Nuit Festive / Réveillon & Concerts',
        reason: 'Événements festifs de grande ampleur prévus ce soir. Le SAMU 15 anticipe un pic d’ivresses publiques et de rixes.',
        hoursAhead: 3,
        durHours: 7,
        risk: 'eleve'
      }
    ];

    const sc = context.scenario || scenarios[Math.floor(Math.random() * scenarios.length)];
    const targetDate = new Date(now.getTime() + (sc.hoursAhead * 3600 * 1000));
    const guardId = `samu-previ-${Date.now()}`;
    const baseCity = game.stations?.[0]?.city || 'Nancy';

    const previGuard = {
      id: guardId,
      type: 'garde_samu',
      isGarde: true,
      isPlanned: true,
      status: 'planifie',
      title: sc.title,
      desc: sc.reason,
      categoryLabel: 'Demande Prévisionnelle SAMU 15 (Pic Annoncé)',
      scale: 'Vecteur VPSP Renfort',
      eventDate: {
        year: targetDate.getFullYear(),
        month: targetDate.getMonth(),
        day: targetDate.getDate(),
        hour: targetDate.getHours(),
        minute: 0
      },
      startHour: targetDate.getHours(),
      durationHours: sc.durHours,
      durationSeconds: sc.durHours * 3600,
      requiredVolunteers: 3,
      requiredVehicles: ['VPSP'],
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      registeredVolunteers: [],
      assignedCrew: { volunteers: [], vehicles: [] },
      volunteerRoles: {},
      posture: sc.risk === 'eleve' ? 'base' : 'domicile',
      riskLevel: sc.risk,
      guardType: 'previsionnelle',
      rewardMoney: sc.durHours * 55 + 150,
      rewardReputation: 35,
      address: `Base Opérationnelle - Antenne ${baseCity}`,
      commune: baseCity,
      lat: game.stations?.[0]?.lat || 48.6921,
      lng: game.stations?.[0]?.lng || 6.1844,
      createdAt: Date.now()
    };

    game.missions.push(previGuard);
    game.saveGame();

    if (typeof game.showToast === 'function') {
      game.showToast(
        '📑 Demande Prévisionnelle SAMU 15',
        `Le SAMU demande 1 VPSP en renfort dans ${sc.hoursAhead}h (« ${sc.title} »). Inscrite dans votre planning !`,
        'blue'
      );
    }

    return previGuard;
  },

  // Générer un Déclenchement d'Urgence immédiat via l'astreinte (NOVI, incendie, etc.)
  generateEmergencyGuard(game, situation = {}) {
    if (!game || !game.samuConvention?.signed) return null;
    const now = new Date(Date.now() + (game.serverTimeOffset || 0));

    const emergencies = [
      {
        title: 'Alerte Sanitaire : Déclenchement d’Urgence Astreinte NOVI',
        desc: 'Accident ferroviaire / carambolage autoroutier. Le SAMU 15 réquisitionne d’urgence les vecteurs VPSP d’astreinte des AASC pour évacuation vers les CHU.',
        risk: 'critique',
        durHours: 4,
        reward: 580
      },
      {
        title: 'Alerte SDIS / SAMU : Grand Incendie Urbain & Soutien Sanitaire',
        desc: 'Incendie d’immeuble d’habitation avec nombreux impliqués et intoxications aux fumées. Astreinte VPSP déclenchée immédiatement.',
        risk: 'critique',
        durHours: 5,
        reward: 520
      },
      {
        title: 'Pic de Surtension Urgences : Débordement SAMU 15',
        desc: 'Saturation complète des équipages pompiers et privés. La régulation 15 active l’astreinte AASC pour départs réflexes immédiats.',
        risk: 'eleve',
        durHours: 4,
        reward: 450
      }
    ];

    const pick = situation.title ? situation : emergencies[Math.floor(Math.random() * emergencies.length)];
    const guardId = `samu-urgence-${Date.now()}`;
    const baseCity = game.stations?.[0]?.city || 'Nancy';

    const urgGuard = {
      id: guardId,
      type: 'garde_samu',
      isGarde: true,
      isPlanned: false,
      status: 'ongoing', // Démarrée immédiatement en urgence
      startedAt: Date.now(),
      title: pick.title,
      desc: pick.desc,
      categoryLabel: '🚨 Déclenchement d’Urgence Astreinte SAMU / SDIS',
      scale: 'Vecteur VPSP Réquisition Immédiate',
      eventDate: {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes()
      },
      startHour: now.getHours(),
      durationHours: pick.durHours,
      durationSeconds: pick.durHours * 3600,
      requiredVolunteers: 3,
      requiredVehicles: ['VPSP'],
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      registeredVolunteers: [], // Le joueur doit immédiatement désigner qui part !
      assignedCrew: { volunteers: [], vehicles: [] },
      volunteerRoles: {},
      posture: 'base', // En urgence critique, mise à la base exigée
      riskLevel: pick.risk || 'critique',
      guardType: 'urgence',
      rewardMoney: pick.reward || 500,
      rewardReputation: 50,
      address: `Base Opérationnelle - Antenne ${baseCity}`,
      commune: baseCity,
      lat: game.stations?.[0]?.lat || 48.6921,
      lng: game.stations?.[0]?.lng || 6.1844,
      createdAt: Date.now()
    };

    game.missions.unshift(urgGuard);
    game.saveGame();

    if (typeof game.showToast === 'function') {
      game.showToast(
        '🚨 Déclenchement d’Urgence Astreinte !',
        `Le SAMU / SDIS réquisitionne 1 VPSP en urgence (« ${pick.title} »). Inscrivez rapidement vos secouristes pour autoriser le départ !`,
        'red'
      );
    }

    if (window.ProtecNotifications) {
      window.ProtecNotifications.notifyCategory(
        'samu',
        `🚨 DÉCLENCHEMENT D'URGENCE ASTREINTE`,
        `${pick.title}. Le SAMU réquisitionne un vecteur VPSP !`,
        `urg-${urgGuard.id}`
      );
    }

    return urgGuard;
  },

  // Trouver la garde active au moment présent
  getCurrentActiveGuard(game) {
    if (!game || !Array.isArray(game.missions)) return null;
    const now = new Date(Date.now() + (game.serverTimeOffset || 0));
    const curYear = game.clock?.year || now.getFullYear();
    const curMonth = game.clock?.month !== undefined ? game.clock.month : now.getMonth();
    const curDay = game.clock?.day || now.getDate();
    const curHour = game.clock?.hour !== undefined ? game.clock.hour : now.getHours();

    return game.missions.find(m => {
      if (m.type !== 'garde_samu' && m.type !== 'samu') return false;
      if (m.status === 'ongoing') return true;
      if (m.status !== 'planifie') return false;

      const ed = m.eventDate;
      if (!ed) return false;
      if (ed.year === curYear && ed.month === curMonth && ed.day === curDay) {
        const start = ed.hour || 0;
        const dur = m.durationHours || 6;
        const end = (start + dur) % 24;
        if (start <= end) {
          return curHour >= start && curHour < end;
        } else {
          // Garde de nuit à cheval sur minuit (ex: 20h -> 02h ou 06h)
          return curHour >= start || curHour < end;
        }
      }
      return false;
    });
  },

  // Vérifier si un équipage complet est inscrit sur la garde pour autoriser le déclenchement
  canTriggerVector(guardMission, game) {
    if (!guardMission) return { canTrigger: false, reason: 'Aucune garde active' };
    const registeredIds = guardMission.registeredVolunteers || [];
    
    // RÈGLE D'OR : SI PERSONNE D'INSCRIT -> AUCUN DÉCLENCHEMENT
    if (registeredIds.length === 0) {
      return {
        canTrigger: false,
        reason: 'Aucun secouriste n’est inscrit sur la garde ! Le SAMU attend un vecteur armé.'
      };
    }

    if (registeredIds.length < 3) {
      return {
        canTrigger: false,
        reason: `Équipage incomplet (${registeredIds.length}/3 secouristes inscrits). 1 VPSP requiert 3 secouristes.`
      };
    }

    // Vérifier les qualifications : au moins un CE ou PSE2
    const vols = registeredIds.map(id => (game.volunteers || []).find(v => v.id === id)).filter(Boolean);
    const hasLeader = vols.some(v => ['CE', 'CD', 'PSE2'].includes(v.rank));
    if (!hasLeader) {
      return {
        canTrigger: false,
        reason: 'L’équipage inscrit ne dispose d’aucun Chef d’équipe (CE) ni PSE2 qualifié pour diriger l’intervention.'
      };
    }

    return {
      canTrigger: true,
      crew: vols,
      posture: guardMission.posture || 'base'
    };
  },

  // Inscription manuelle d'un secouriste sur une garde
  assignCrewMember(game, missionId, volunteerId, role = 'equipier') {
    const mission = (game.missions || []).find(m => m.id === missionId);
    if (!mission) return;
    if (!Array.isArray(mission.registeredVolunteers)) mission.registeredVolunteers = [];
    if (!mission.volunteerRoles) mission.volunteerRoles = {};

    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    if (!vol) return;

    if (mission.registeredVolunteers.includes(volunteerId)) {
      mission.volunteerRoles[volunteerId] = role;
      game.saveGame();
      if (typeof game.openMissionDetails === 'function') game.openMissionDetails(missionId);
      return;
    }

    if (mission.registeredVolunteers.length >= (mission.requiredVolunteers || 3)) {
      if (typeof game.showToast === 'function') {
        game.showToast('Garde Complète', 'L’équipage de 3 secouristes est déjà au complet pour cette garde.', 'orange');
      }
      return;
    }

    mission.registeredVolunteers.push(volunteerId);
    mission.volunteerRoles[volunteerId] = role;

    // Statut bénévole
    if (mission.status === 'ongoing') {
      vol.status = 'samu_garde';
    }

    if (typeof game.showToast === 'function') {
      game.showToast(
        'Secouriste Inscrit à la Garde 🚑',
        `${vol.name} (${vol.rank}) affecté(e) comme ${role === 'chef_de_bord' ? 'Chef de Bord' : (role === 'conducteur' ? 'Conducteur VPSP' : 'Équipier Secouriste')}.`,
        'green'
      );
    }

    game.saveGame();
    game.updateStatsUI();
    if (typeof game.openMissionDetails === 'function') game.openMissionDetails(missionId);
    if (game.currentModalKey === 'samu') game.openModule('samu');
  },

  // Retrait d'un secouriste d'une garde
  removeCrewMember(game, missionId, volunteerId) {
    const mission = (game.missions || []).find(m => m.id === missionId);
    if (!mission) return;

    mission.registeredVolunteers = (mission.registeredVolunteers || []).filter(id => id !== volunteerId);
    if (mission.volunteerRoles) delete mission.volunteerRoles[volunteerId];

    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    if (vol && vol.status === 'samu_garde') {
      vol.status = 'dispo';
    }

    if (typeof game.showToast === 'function') {
      game.showToast('Désinscription de Garde', `${vol ? vol.name : 'Le secouriste'} a été retiré(e) de la garde.`, 'blue');
    }

    game.saveGame();
    game.updateStatsUI();
    if (typeof game.openMissionDetails === 'function') game.openMissionDetails(missionId);
    if (game.currentModalKey === 'samu') game.openModule('samu');
  },

  // Basculer la posture : À la base (prêt à partir) VS Dispo domicile (astreinte)
  setPosture(game, missionId, posture) {
    const mission = (game.missions || []).find(m => m.id === missionId);
    if (!mission) return;

    mission.posture = posture; // 'base' ou 'domicile'
    const isBase = posture === 'base';

    if (typeof game.showToast === 'function') {
      game.showToast(
        isBase ? '🏢 Posture : À la base prêt à partir' : '🏠 Posture : Dispo domicile (Astreinte)',
        isBase 
          ? 'Équipage présent à la caserne. Départs réflexes automatiques sans délai (fatigue normale -15).'
          : 'Équipage en astreinte chez eux. Fatigue grandement économisée (-3), délai de ralliement lors d’un appel.',
        'blue'
      );
    }

    game.saveGame();
    if (typeof game.openMissionDetails === 'function') game.openMissionDetails(missionId);
    if (game.currentModalKey === 'samu') game.openModule('samu');
  },

  // Rendu du bloc officiel de garde dans le drawer / fiche de mission
  renderGuardDetailHTML(game, mission) {
    if (!mission || (mission.type !== 'garde_samu' && mission.type !== 'samu')) return '';

    const tier = this.getAntennaTier(game);
    const posture = mission.posture || 'base';
    const isBase = posture === 'base';
    const regCount = (mission.registeredVolunteers || []).length;
    const reqCount = mission.requiredVolunteers || 3;
    const isArmed = regCount >= reqCount;

    const registeredVols = (mission.registeredVolunteers || []).map(id => (game.volunteers || []).find(v => v.id === id)).filter(Boolean);
    const availableQualif = (game.volunteers || []).filter(v => 
      ['CE', 'CD', 'PSE2', 'PSE1'].includes(v.rank) && 
      (v.status === 'dispo' || (mission.registeredVolunteers || []).includes(v.id))
    );

    const riskLabels = {
      faible: { text: 'Risque Faible (Veille ordinaire)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', advice: 'Astreinte domicile conseillée (économie fatigue).' },
      modere: { text: 'Risque Modéré (Activité standard)', color: 'text-sky-700 bg-sky-50 border-sky-200', advice: 'Astreinte domicile ou garde base selon vos effectifs.' },
      eleve: { text: 'Risque Élevé (Pic d’appels anticipé)', color: 'text-amber-800 bg-amber-50 border-amber-300', advice: 'Mise à la base recommandée pour départs immédiats.' },
      critique: { text: 'Risque Critique (Situation exceptionnelle / NOVI)', color: 'text-rose-800 bg-rose-50 border-rose-300', advice: 'Présence base impérative : départ sous 0 min.' }
    };
    const risk = riskLabels[mission.riskLevel || 'modere'] || riskLabels.modere;

    return `
      <div class="rounded-2xl border-2 ${isArmed ? 'border-emerald-400 bg-emerald-50/20' : 'border-amber-400 bg-amber-50/20'} p-4 space-y-4">
        
        <!-- En-tête officiel de garde -->
        <div class="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-600 text-white shadow-2xs">
                🚑 Permanence Régulation SAMU 15
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border ${tier.badgeColor}">
                ${tier.badge}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border ${risk.color}">
                ${risk.text}
              </span>
            </div>
            <h4 class="text-sm font-black text-slate-900">${mission.title}</h4>
            <p class="text-[11px] text-slate-600">${mission.desc}</p>
          </div>

          <div class="text-right shrink-0">
            <span class="px-3 py-1.5 rounded-xl text-xs font-black border ${isArmed ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'} block">
              ${isArmed ? '✅ VECTEUR ARMÉ' : '⚠️ NON ARMÉ (0 DÉPART)'}
            </span>
            <span class="text-[10px] font-mono font-bold text-slate-500 mt-1 block">
              ${regCount} / ${reqCount} secouristes
            </span>
          </div>
        </div>

        <!-- RÈGLE MAJEURE D'EFFECTIFS -->
        <div class="p-3 rounded-xl bg-white border ${isArmed ? 'border-emerald-200' : 'border-amber-300 ring-1 ring-amber-300/40'} text-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-extrabold flex items-center gap-1.5 ${isArmed ? 'text-emerald-800' : 'text-amber-900'}">
              <span>${isArmed ? '🛡️ Équipage Validé' : '⚠️ Attention Régulation SAMU'}</span>
            </span>
            <span class="text-[10.5px] font-bold text-slate-500">1 VPSP = 3 secouristes</span>
          </div>
          <p class="text-[11px] ${isArmed ? 'text-emerald-700' : 'text-amber-800'} leading-relaxed font-medium">
            ${isArmed 
              ? 'L’équipage est complet. Le vecteur VPSP peut être engagé à tout moment par le médecin régulateur 15.'
              : '<strong>Aucun départ réflexe ne sera déclenché</strong> tant que vous n’avez pas inscrit un équipage complet (3 secouristes qualifiés dont 1 CE/PSE2).'}
          </p>
        </div>

        <!-- SÉLECTEUR DE POSTURE : À LA BASE VS DISPO DOMICILE -->
        <div class="p-3.5 rounded-xl bg-slate-900 text-white space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="compass" class="w-4 h-4 text-amber-400"></i>
              <span class="text-xs font-black uppercase tracking-wider text-amber-400">Positionnement & Gestion de la Fatigue</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${isBase ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'}">
              ${isBase ? '🏢 À la base (Prêt au départ)' : '🏠 Dispo domicile (Astreinte)'}
            </span>
          </div>

          <p class="text-[11px] text-slate-300 leading-relaxed">
            Conseil SAMU pour ce créneau : <strong class="text-amber-300">${risk.advice}</strong>
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" 
              onclick="window.ProtecGardesSamu.setPosture(window.game, '${mission.id}', 'base')" 
              class="px-3 py-2.5 rounded-xl font-black text-xs transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${isBase ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}">
              <span class="flex items-center gap-1.5">
                <i data-lucide="building" class="w-3.5 h-3.5"></i>
                <span>À la base (Prêt à partir)</span>
              </span>
              <span class="text-[9.5px] opacity-80 font-normal">Départ réflexe 0 min • Fatigue accrue (-15)</span>
            </button>

            <button type="button" 
              onclick="window.ProtecGardesSamu.setPosture(window.game, '${mission.id}', 'domicile')" 
              class="px-3 py-2.5 rounded-xl font-black text-xs transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${!isBase ? 'bg-pc-blue text-white shadow-md ring-2 ring-blue-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}">
              <span class="flex items-center gap-1.5">
                <i data-lucide="home" class="w-3.5 h-3.5"></i>
                <span>Dispo domicile (Astreinte)</span>
              </span>
              <span class="text-[9.5px] opacity-80 font-normal">Économie fatigue (-3) • Délai ralliement ~10m</span>
            </button>
          </div>
        </div>

        <!-- TABLEAU DE GESTION MANUELLE DES EFFECTIFS DE LA GARDE -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Équipage VPSP Inscrit (${regCount}/3) :</span>
            <span class="text-[11px] text-slate-500 font-normal">Sélectionnez les 3 secouristes</span>
          </div>

          <!-- Les 3 postes de l'équipage VPSP -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            ${[
              { roleId: 'chef_de_bord', label: '1. Chef de Bord (CE/PSE2)', req: ['CE', 'CD', 'PSE2'], icon: 'shield' },
              { roleId: 'equipier', label: '2. Équipier Secouriste (PSE2/1)', req: ['PSE2', 'PSE1'], icon: 'user' },
              { roleId: 'conducteur', label: '3. Conducteur VPSP (PSE)', req: ['PSE2', 'PSE1'], icon: 'truck' }
            ].map(slot => {
              const assignedVolId = (mission.registeredVolunteers || []).find(id => mission.volunteerRoles?.[id] === slot.roleId) || 
                                    (slot.roleId === 'chef_de_bord' ? mission.registeredVolunteers?.[0] : (slot.roleId === 'equipier' ? mission.registeredVolunteers?.[1] : mission.registeredVolunteers?.[2]));
              const assignedVol = assignedVolId ? (game.volunteers || []).find(v => v.id === assignedVolId) : null;

              return `
                <div class="p-3 rounded-xl border ${assignedVol ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-slate-50 border-dashed border-slate-300'} space-y-2">
                  <div class="flex items-center justify-between text-[11px] font-black text-slate-800">
                    <span class="flex items-center gap-1">
                      <i data-lucide="${slot.icon}" class="w-3.5 h-3.5 text-pc-blue"></i>
                      <span>${slot.label}</span>
                    </span>
                  </div>

                  ${assignedVol ? `
                    <div class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between gap-1">
                      <div class="min-w-0">
                        <strong class="text-emerald-950 font-bold block truncate">${assignedVol.name}</strong>
                        <span class="text-[10px] text-emerald-700 font-mono">${assignedVol.rank} • Énergie ${assignedVol.energy || 80}%</span>
                      </div>
                      <button type="button" 
                        onclick="window.ProtecGardesSamu.removeCrewMember(window.game, '${mission.id}', '${assignedVol.id}')" 
                        class="text-rose-500 hover:text-rose-700 font-black p-1 cursor-pointer" title="Retirer de la garde">
                        ✕
                      </button>
                    </div>
                  ` : `
                    <div class="text-[10.5px] text-slate-400 italic py-1">
                      Poste vacant
                    </div>
                    <select onchange="if(this.value) window.ProtecGardesSamu.assignCrewMember(window.game, '${mission.id}', this.value, '${slot.roleId}')" class="w-full text-[10.5px] font-bold px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 focus:ring-1 focus:ring-pc-blue cursor-pointer">
                      <option value="">+ Affecter secouriste...</option>
                      ${availableQualif.filter(v => !(mission.registeredVolunteers || []).includes(v.id)).map(v => `
                        <option value="${v.id}">
                          ${v.name} (${v.rank} • ${v.energy || 80}%)
                        </option>
                      `).join('')}
                    </select>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  }
};
