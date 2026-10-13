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
        if (veh) {
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
    game.activeCrises.unshift(newCrisis);

    if (window.ProtecAudio) {
      window.ProtecAudio.playAlertChime();
    }

    game.showToast(
      '🚨 PLAN D\'URGENCE DÉCLENCHÉ',
      `${newCrisis.titre} réquisitionné par ${newCrisis.autorite_demandeur} !`,
      'red',
      { type: 'crise', id: newCrisis.id }
    );

    game.saveGame();
    this.openPcCriseModal(game, newCrisis.id);
    return newCrisis;
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
                duree_estimee_sec: 180
              },
              {
                id: 'sub_noria_vpsp_2',
                type: 'noria_vpsp',
                titre: 'Noria VPSP #2 - Relevage & Brancardage Sécurisé',
                statut: 'en_attente',
                moyens_requis: { vols_count: 3, ranks: ['PSE2', 'PSE1', 'PSE1'], vehicles: ['VPSP'] },
                progression: 0,
                duree_estimee_sec: 200
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
                duree_estimee_sec: 240
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
                duree_estimee_sec: 150
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
                duree_estimee_sec: 160
              },
              {
                id: 'sub_battue_ligne',
                type: 'battue_pedestre',
                titre: 'Ligne de Battue Pédestre Tout-Terrain',
                statut: 'en_attente',
                moyens_requis: { vols_count: 4, ranks: ['PSE2', 'PSE1', 'Secouriste'], vehicles: ['VLTT', 'VTU'] },
                progression: 0,
                duree_estimee_sec: 210
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
                duree_estimee_sec: 190
              },
              {
                id: 'sub_equipe_cyno',
                type: 'recherche_cyno',
                titre: 'Maître-Chien de Recherche et Sauvetage',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['PSE2', 'PSE1'], vehicles: ['VCYN', 'VLTT'], specialite_requise: 'cynotechnie' },
                progression: 0,
                duree_estimee_sec: 180
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
                duree_estimee_sec: 170
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
                duree_estimee_sec: 220
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
                duree_estimee_sec: 240
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
                duree_estimee_sec: 140
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
                duree_estimee_sec: 200
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
                duree_estimee_sec: 190
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
                duree_estimee_sec: 120
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
                duree_estimee_sec: 200
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
                duree_estimee_sec: 220
              },
              {
                id: 'sub_ravitaillement_chaud',
                type: 'ravitaillement_crise',
                titre: 'Cuisine de Crise & Distribution Repas Chauds',
                statut: 'en_attente',
                moyens_requis: { vols_count: 2, ranks: ['PSE1', 'Secouriste'], vehicles: ['VL'] },
                progression: 0,
                duree_estimee_sec: 180
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
                duree_estimee_sec: 150
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
    if (!game || !game.activeCrises || game.activeCrises.length === 0) return;

    const now = Date.now();

    game.activeCrises.forEach(crisis => {
      if (crisis.status !== 'active') return;

      const currentPhase = crisis.phases[crisis.currentPhaseIndex];
      if (!currentPhase) return;

      let allPhaseSubsComplete = true;

      // Parcours des sous-missions de la phase en cours
      (currentPhase.sous_missions || []).forEach(sub => {
        if (sub.statut === 'en_cours') {
          // Incrémenter la progression en fonction du temps
          const speedMultiplier = (game.simSpeed || 1);
          const totalDuration = (sub.duree_estimee_sec || 180);
          const stepIncrement = (100 / totalDuration) * speedMultiplier;

          sub.progression = Math.min(100, (sub.progression || 0) + stepIncrement);

          // Impact physiologique sur le personnel engagé (fatigue et moral)
          if (sub.assignedCrew && Array.isArray(sub.assignedCrew.volunteers)) {
            sub.assignedCrew.volunteers.forEach(vId => {
              const vol = (game.volunteers || []).find(v => v.id === vId);
              if (vol) {
                // Fatigue augmente (+0.1 par tick)
                vol.fatigue = Math.min(100, (vol.fatigue || 10) + (0.15 * speedMultiplier));
                vol.energy = Math.max(0, 100 - vol.fatigue);

                // Moral : baisse légère si fatigue > 70
                if (vol.fatigue > 70) {
                  vol.moral = Math.max(10, (vol.moral || 80) - (0.05 * speedMultiplier));
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
  },

  /**
   * Mobilisation des bénévoles avec filtrage par delta de temps de trajet
   */
  mobilizeVolunteers(game, crisisId, deltaMax = 30, mode = 'ciblee') {
    if (!game) game = window.game;
    const crisis = (game.activeCrises || []).find(c => c.id === crisisId);
    if (!crisis) return;

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
      <div class="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
        
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
                    <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 border-l-4 ${borderLeft} space-y-1 text-xs">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="font-black text-slate-300">${log.source}</span>
                        <span class="text-slate-400 font-mono">${log.time}</span>
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


