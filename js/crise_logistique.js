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

  // Initialisation de l'état
  injectState(game) {
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
          v.homeAddress = `${Math.floor(Math.random() * 85) + 1} rue de la Paix, ${city} (${km} km)`;
          v.travelTimeToStationMin = Math.max(6, Math.round(km * 2.2 + Math.random() * 3));
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

  // Évolution de la main courante pendant le sinistre
  progressCrisisMission(game, mission) {
    if (!mission.operationalLog) this.initMissionOperationalLog(mission);

    const now = Date.now();
    if (!mission.lastLogUpdate) mission.lastLogUpdate = now;

    // Ajout d'une entrée toutes les 45 à 90 secondes réelles
    if (now - mission.lastLogUpdate > 55000) {
      mission.lastLogUpdate = now;
      const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      // Fatigue et stress progressifs pour les secouristes engagés
      const engaged = game.volunteers.filter(v => (mission.registeredVolunteers || []).includes(v.id));
      engaged.forEach(v => {
        v.energy = Math.max(5, (v.energy || 80) - 3);
        // Le stress monte plus vite si le bénévole a une faible résistance
        const stressInc = (100 - (v.stressResistance || 50)) > 40 ? 4 : 2;
        v.stress = Math.min(100, (v.stress || 10) + stressInc);
      });

      // Génération d'un message d'évolution selon le type de crise
      const entry = this.generateNextLogEntry(mission, timeStr, engaged.length);
      if (entry) {
        mission.operationalLog.unshift(entry);
        if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();

        if (entry.type === 'milestone') {
          game.showToast('Main Courante : Évolution', `${mission.title} : ${entry.text}`, 'blue');
        }
      }

      // Possibilité de résolution favorable si assez d'évolutions ont eu lieu (minimum 4-6 entrées)
      if (mission.operationalLog.length >= 6 && Math.random() < 0.25) {
        this.triggerCrisisResolution(game, mission);
      }
    }
  },

  generateNextLogEntry(mission, timeStr, volsCount) {
    const logs = mission.operationalLog || [];
    const step = logs.length;

    // Scénario 1 : Recherche de personne disparue
    if (mission.crisisType === 'recherche_disparu' || mission.title.includes('Recherche')) {
      const msgs = [
        { source: 'Gendarmerie Nationale', text: 'Point de situation : Zone de battue élargie au massif forestier Nord. Télépilote drone requis pour survol thermique.', type: 'info' },
        { source: 'PC Protec (Chef Dispositif)', text: 'Unité Drone déployée : caméra infrarouge en balayage sur les crêtes. Équipes cynotechniques engagées au sol.', type: 'info' },
        { source: 'Équipe Cynotechnique', text: 'Marquage d’odeur positif par le chien de recherche dans la combe ! Les équipes pédestres convergent avec brancard.', type: 'milestone' },
        { source: 'Commandement Gendarmerie', text: 'Personne disparue localisée consciente mais désorientée et en hypothermie légère ! Bilan secouriste en cours.', type: 'success' },
        { source: 'Régulation SAMU 15', text: 'Évacuation de la victime par notre VPSP vers l’hôpital le plus proche. Fin de battue imminente.', type: 'milestone' }
      ];
      return msgs[step % msgs.length] ? { ...msgs[step % msgs.length], time: timeStr, timestamp: Date.now() } : null;
    }

    // Scénario 2 : Crash Aérien & CAI / CUMP
    if (mission.crisisType === 'crash_aerien' || mission.title.includes('Crash')) {
      const msgs = [
        { source: 'Médecin Référent CUMP', text: 'Montage du CAI terminé sous le gymnase réquisitionné. 50 impliqués et familles accueillis par les secouristes Protec.', type: 'milestone' },
        { source: 'Secrétariat SINUS Protec', text: 'Traçabilité rigoureuse : 38 bracelets SINUS posés, prise en charge psychologique active et réconfort chaud.', type: 'info' },
        { source: 'CODIS 15/18', text: 'Rotation d’équipes nécessaire. Recommandation : relève des secouristes en première ligne pour prévenir la fatigue psychologique.', type: 'alert' },
        { source: 'Préfecture', text: 'Point presse préfectoral : félicitations adressées aux associations agréées pour la dignité de l’accueil des familles.', type: 'info' }
      ];
      return msgs[step % msgs.length] ? { ...msgs[step % msgs.length], time: timeStr, timestamp: Date.now() } : null;
    }

    // Scénario 3 : Incendie EHPAD & Évacuation
    if (mission.crisisType === 'incendie_ehpad' || mission.title.includes('EHPAD')) {
      const msgs = [
        { source: 'COS Sapeurs-Pompiers', text: 'Foyer principal circonscrit au 2e étage. Évacuation préventive de 45 résidents âgés confiée à la Protection Civile.', type: 'milestone' },
        { source: 'Équipage VPSP / VTP', text: 'Navettes de transport sanitaire en cours vers la salle municipale de repli. Oxygénothérapie dispensée à 4 résidents incommodés.', type: 'info' },
        { source: 'Direction EHPAD', text: 'Tous les résidents sont sains et saufs et réinstallés sous surveillance secouriste. Fin des évacuations.', type: 'success' }
      ];
      return msgs[step % msgs.length] ? { ...msgs[step % msgs.length], time: timeStr, timestamp: Date.now() } : null;
    }

    // Scénario par défaut (Inondations, tempête, crise NOVI)
    const defaults = [
      { source: 'PC de Crise CODIS', text: `Dispositif Protec actif sur le secteur (${volsCount} intervenants engagés). Actions de soutien et pompage en cours.`, type: 'info' },
      { source: 'Commandement Terrain', text: 'Point de situation intermédiaire : 12 mises en sécurité effectuées. Ravitaillement des sinistrés en cours.', type: 'info' },
      { source: 'Astreinte Opérationnelle', text: 'Pensez à organiser une rotation d’équipes pour préserver les secouristes les plus fatigués.', type: 'alert' }
    ];
    return { ...defaults[step % defaults.length], time: timeStr, timestamp: Date.now() };
  },

  // Résolution finale de la crise par le CODIS
  triggerCrisisResolution(game, mission) {
    if (mission.status !== 'ongoing') return;
    mission.crisisCanClose = true;
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    mission.operationalLog.unshift({
      timestamp: Date.now(),
      time: timeStr,
      source: 'Commandant des Opérations (COS)',
      text: '🏁 Objectifs de mission pleinement atteints ! Situation normalisée sur le terrain. Le COS autorise la levée du dispositif et le retour des moyens à l’antenne.',
      type: 'success'
    });

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.showToast('Ordre de Clôture Reçu !', `Le CODIS annonce la fin de mission pour « ${mission.title} ». Vous pouvez clôturer le dispositif.`, 'green');
    game.saveGame();
    game.renderMissions();
  },

  // Effectuer une rotation / relève d'équipage sur le sinistre
  performTeamRotation(game, missionId) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission) return;

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
    game.openMissionDetails(mission.id);
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
    game.openMissionDetails(mission.id);
  },

  // =========================================================================
  // 3. LOGISTIQUE & GESTION DU RÉARMEMENT DE LA FLOTTE
  // =========================================================================

  // Planifier une mission de réarmement logistique
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
    if (!game.logisticTasks || game.logisticTasks.length === 0) return;

    const now = Date.now();
    game.logisticTasks = game.logisticTasks.filter(task => {
      const elapsed = Math.floor((now - task.startTime) / 1000);
      if (elapsed >= task.durationSeconds) {
        // Tâche terminée !
        const veh = game.vehicles.find(v => v.id === task.vehicleId);
        if (veh) veh.isRearmed = true;

        const vol = game.volunteers.find(v => v.id === task.volunteerId);
        if (vol) {
          vol.status = 'disponible';
          vol.experience = Math.min(100, (vol.experience || 30) + 5);
        }

        game.showToast('Véhicule Réarmé ! ✓', `Ambulance ${task.vehicleName} parfaitement reconditionnée et opérationnelle pour le prochain départ.`, 'green');
        if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
        return false;
      }
      return true;
    });
  },

  // =========================================================================
  // 4. CONVENTION MAIRIE PARTENAIRE : LOCAL CONTRE 3 DPS OFFERTS
  // =========================================================================

  signMunicipalPartnership(game) {
    this.injectState(game);
    if (game.municipalPartnership.signed) {
      game.showToast('Convention Active', 'Le partenariat municipal est déjà signé avec la Mairie.', 'blue');
      return;
    }

    if (!confirm(`🏛️ PARTENARIAT MUNICIPAL & SÉCURITÉ CIVILE :\n\nLa commune propose une convention gagnant-gagnant :\n• Mise à disposition gracieuse des locaux municipaux (Économie de loyer)\n• En contrepartie : L'antenne s'engage à assurer 3 DPS municipaux gratuits par an pour la commune (Fête de la musique, Feu d'artifice, Événement sportif communal).\n\nConfirmez-vous la signature ?`)) {
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
    const assignedVehIds = mission.assignedCrew?.vehicles?.map(v => v.id) || [];
    const assignedVehs = game.vehicles.filter(v => assignedVehIds.includes(v.id));
    const registeredCount = (mission.registeredVolunteers || []).length;

    let totalSeats = 0;
    let hasUnrearmed = false;
    let unrearmedVehNames = [];

    assignedVehs.forEach(v => {
      totalSeats += (v.seatsCount || v.capacity || 4);
      if (v.isRearmed === false) {
        hasUnrearmed = true;
        unrearmedVehNames.push(v.name);
      }
    });

    const missingSeats = Math.max(0, registeredCount - totalSeats);
    const hasEnoughSeats = totalSeats >= registeredCount;

    return `
      <div class="space-y-2">
        <!-- État de réarmement des ambulances -->
        ${hasUnrearmed ? `
          <div class="p-3 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-xs shadow-sm space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-black text-amber-900 flex items-center gap-1.5">
                <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i>
                ⚠️ VÉHICULE NON RÉARMÉ DÉTECTÉ
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900">Vigilance</span>
            </div>
            <p class="text-[11px] text-amber-800 leading-snug">
              <strong>${unrearmedVehNames.join(', ')}</strong> n'a pas été réarmé après son dernier départ. Vous pouvez le faire partir, mais cela risque de causer des pannes ou un manque de matériel, réduisant l'humeur des équipiers et la réputation.
            </p>
            <div class="flex items-center gap-2 pt-1">
              <button onclick="window.ProtecCriseLogistique.scheduleRearmamentMission(window.game, '${assignedVehs.find(v => !v.isRearmed)?.id}')" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] transition shadow flex items-center gap-1">
                <i data-lucide="wrench" class="w-3.5 h-3.5"></i>
                <span>Programmer Réarmement (2 min)</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Jauge des places assises -->
        ${assignedVehs.length > 0 ? `
          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <i data-lucide="truck" class="w-4 h-4 text-slate-500"></i>
              <span class="font-bold text-slate-700">Capacité de transport de l'équipage :</span>
            </div>
            <span class="font-black px-2 py-0.5 rounded text-[10px] ${hasEnoughSeats ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'}">
              ${hasEnoughSeats ? `✓ ${totalSeats} places pour ${registeredCount} secouriste(s)` : `⚠️ Manque ${missingSeats} place(s) (${totalSeats}/${registeredCount})`}
            </span>
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

    const engaged = game.volunteers.filter(v => (mission.registeredVolunteers || []).includes(v.id));
    const logs = mission.operationalLog || [];

    return `
      <div class="space-y-4">
        <!-- Bandeau d'état opérationnel SANS compte à rebours fixe -->
        <div class="p-4 rounded-3xl bg-slate-900 text-white shadow-xl space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase flex items-center gap-2 text-pc-orange">
              <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              CELLULE DE CRISE ACTIVE (CODIS / PRÉFECTURE)
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-300">
              Rotations : ${mission.rotationsCount || 0}
            </span>
          </div>
          <p class="text-[11px] text-slate-300 leading-snug">
            Durée indéterminée dépendante de l'évolution du sinistre sur le terrain. Surveillez la main courante radio et gérez la fatigue de vos secouristes.
          </p>
          <div class="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
            <span class="text-slate-400">Effectifs engagés en première ligne :</span>
            <span class="font-extrabold text-pc-orange mono-num">${engaged.length} secouristes</span>
          </div>
        </div>

        <!-- Boutons de Commandement : Relève d'Équipe & Clôture -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onclick="window.ProtecCriseLogistique.performTeamRotation(window.game, '${mission.id}')" class="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-pc-blue to-indigo-600 hover:brightness-110 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            <span>🔄 Relève d'Équipe (Rotation)</span>
          </button>
          ${mission.crisisCanClose ? `
            <button onclick="window.ProtecCriseLogistique.completeCrisisMission(window.game, '${mission.id}')" class="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black shadow-lg animate-pulse transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="check-circle-2" class="w-4 h-4"></i>
              <span>🏁 Clôturer le Dispositif (Accord COS)</span>
            </button>
          ` : `
            <button onclick="window.game.evacuateToNearestHospital('${mission.id}', '${mission.assignedCrew?.vehicles[0]?.id}')" class="py-2.5 px-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="siren" class="w-4 h-4"></i>
              <span>Évacuer Victime CH (Statut 4)</span>
            </button>
          `}
        </div>

        <!-- Suivi Énergie, Fatigue et Stress des Équipiers en Direct -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
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
                <div class="p-2.5 rounded-2xl glass-card border border-slate-200/80 flex items-center justify-between text-xs hover:shadow-sm transition">
                  <div class="flex items-center gap-2">
                    ${game.getVolunteerAvatarHTML(v, 'w-7 h-7 text-xs')}
                    <div>
                      <div class="font-bold text-slate-800 leading-tight">${v.name}</div>
                      <div class="text-[9px] text-slate-400 font-semibold">${v.rank || 'Secouriste'} • Exp. ${v.experience || 30}%</div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-3">
                    <!-- Jauge Énergie -->
                    <div class="text-right">
                      <div class="text-[9px] font-bold ${isTired ? 'text-rose-600 animate-pulse' : 'text-slate-500'}">
                        Énergie: ${energy}%
                      </div>
                      <div class="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div class="h-full rounded-full ${isTired ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${energy}%"></div>
                      </div>
                    </div>

                    <!-- Jauge Stress -->
                    <div class="text-right">
                      <div class="text-[9px] font-bold ${isStressed ? 'text-amber-600 animate-pulse' : 'text-slate-500'}">
                        Stress: ${stress}%
                      </div>
                      <div class="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
                        <div class="h-full rounded-full ${isStressed ? 'bg-amber-500' : 'bg-pc-blue'}" style="width: ${stress}%"></div>
                      </div>
                    </div>

                    <!-- Bouton Retrait / Repos -->
                    <button onclick="window.ProtecCriseLogistique.withdrawVolunteer(window.game, '${mission.id}', '${v.id}')" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 font-black text-[10px] transition" title="Désengager immédiatement ce secouriste et le renvoyer au repos">
                      🛑 Retirer
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- MAIN COURANTE OPÉRATIONNELLE CHRONOLOGIQUE -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <i data-lucide="radio" class="w-3.5 h-3.5 text-pc-blue"></i>
              Main Courante des Transmissions (Temps Réel)
            </h4>
            <span class="text-[10px] font-mono text-pc-blue font-bold animate-pulse">● EN DIRECT</span>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto pr-1 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/80">
            ${logs.length === 0 ? `
              <div class="text-center text-slate-400 text-xs py-4">Attente des premiers messages radio...</div>
            ` : logs.map(l => {
              const borderCol = l.type === 'success' ? 'border-l-4 border-l-emerald-500 bg-emerald-50/50' : 
                               (l.type === 'alert' ? 'border-l-4 border-l-rose-500 bg-rose-50/50' : 
                               (l.type === 'milestone' ? 'border-l-4 border-l-pc-blue bg-blue-50/50' : 'border-l-4 border-l-slate-400 bg-white'));
              return `
                <div class="p-2.5 rounded-xl border border-slate-200/60 ${borderCol} text-xs space-y-0.5 shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="font-extrabold text-slate-800 text-[11px]">${l.source || 'PC Opérationnel'}</span>
                    <span class="text-[9px] font-mono text-slate-400">${l.time}</span>
                  </div>
                  <p class="text-[11px] text-slate-600 leading-snug">${l.text}</p>
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
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission) return;

    mission.status = 'termine';
    const rewardMoney = mission.rewardMoney || 1200;
    const rewardReputation = mission.rewardReputation || 45;

    game.resources.money += rewardMoney;
    game.resources.reputationScore = Math.min(100, (game.resources.reputationScore || 0) + rewardReputation);

    // Libérer les effectifs
    (mission.registeredVolunteers || []).forEach(vId => {
      const v = game.volunteers.find(vol => vol.id === vId);
      if (v) {
        v.status = 'disponible';
        v.experience = Math.min(100, (v.experience || 30) + 10);
      }
    });

    // Libérer les véhicules et marquer le VPSP comme nécessitant réarmement
    (mission.assignedCrew?.vehicles || []).forEach(vehObj => {
      const v = game.vehicles.find(veh => veh.id === vehObj.id);
      if (v) {
        v.status = 'disponible';
        if (v.type === 'VPSP' || v.name.includes('VPSP')) {
          v.isRearmed = false; // Nécessite désinfection & réarmement
        }
      }
    });

    if (window.ProtecAudio) window.ProtecAudio.playContractSignedSound();
    game.showToast('Dispositif Clôturé avec Succès ! 🏆', `Fin de mission validée. +${rewardMoney} € et +${rewardReputation} pts de réputation !`, 'green');
    game.closeDrawer();
    game.saveGame();
    game.renderMissions();
    game.updateStatsUI();
  },

  // =========================================================================
  // 7. GÉNÉRATEUR DES 7 SCÉNARIOS OPÉRATIONNELS RÉALISTES
  // =========================================================================

  createScenarioMission(game, scenarioKey) {
    this.injectState(game);
    const base = game.stations[0] || { lat: 48.8566, lng: 2.3522, name: 'Antenne Principale' };
    const now = Date.now();
    let m = null;

    if (scenarioKey === 'recherche_disparu') {
      const loc = game.calculateRealisticMissionLocation(base, 'crise');
      m = {
        id: `scen_rech_${now}`,
        title: 'Recherche Gendarmerie : Personne Disparue en Forêt',
        desc: 'Réquisition officielle par la Gendarmerie Nationale. Dispositif de battue avec Poste de Commandement (PC), Télépilote Drone thermique, maîtres-chiens cyno et VLTT 4x4.',
        type: 'crise',
        crisisType: 'recherche_disparu',
        isCrisis: true,
        scale: 'BATTUE & RECHERCHE GENDARMERIE (6 à 10 intervenants)',
        urgency: 'haute',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 6,
        requiredRanks: ['CD', 'PSE2', 'PSE1'],
        requiredVehicles: ['VL', 'VTU'],
        rewardMoney: 1450,
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
      m = {
        id: `scen_crash_${now}`,
        title: 'Plan Catastrophe : Crash Aérien & CAI CUMP (50 impliqués)',
        desc: 'Alerte majeure déclenchée par le SAMU et la Préfecture. Montage immédiat d’un Centre d’Accueil des Impliqués (CAI) sous astreinte CUMP. Soutien psychologique et secrétariat SINUS.',
        type: 'crise',
        crisisType: 'crash_aerien',
        isCrisis: true,
        isCumpCai: true,
        scale: 'ORSEC / NOVI CUMP (8 secouristes qualifiés AEP & Lots A/B/C)',
        urgency: 'critique',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 8,
        requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP', 'VTU'],
        rewardMoney: 2600,
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
      m = {
        id: `scen_ehpad_${now}`,
        title: 'Incendie EHPAD : Évacuation Sanitaire & Mise à l’Abri',
        desc: 'Feu dans un établissement pour personnes âgées. Le CODIS missionne la Protection Civile pour l’évacuation d’urgence de 45 résidents valides et dépendants vers la salle des fêtes.',
        type: 'crise',
        crisisType: 'incendie_ehpad',
        isCrisis: true,
        scale: 'ÉVACUATION COLLECTIVE (2 VPSP + VTP + 6 secouristes)',
        urgency: 'critique',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 6,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VPSP', 'VTU'],
        rewardMoney: 1850,
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
      m = {
        id: `scen_tempete_${now}`,
        title: 'Tempête Alerte Rouge : Renfort CHU & Déblaiement',
        desc: 'Vigilance rouge vents violents. Renfort interdépartemental mobilisé : sécurisation des accès du CHU, bâchage de toitures et accueil des naufragés de la route.',
        type: 'crise',
        crisisType: 'tempete_rouge',
        isCrisis: true,
        scale: 'DÉTACHEMENT INTEMPÉRIES (8 secouristes + Lots Tronçonnage/Pompage)',
        urgency: 'critique',
        lat: loc.lat,
        lng: loc.lng,
        requiredVolunteers: 8,
        requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
        requiredVehicles: ['VTU', 'VL'],
        rewardMoney: 2200,
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
      if (window.ProtecAudio) window.ProtecAudio.playAlertChime();
      game.showToast('Scénario Déclenché ! 🚨', `Nouvelle mission : « ${m.title} ».`, 'red', { type: 'mission', id: m.id });
      game.openMissionDetails(m.id);
    }
  }
};

