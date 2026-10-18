/**
 * PROTEC LIVE - GESTIONNAIRE D'INCIDENTS EN MISSION & NOTIFICATIONS MULTI-SUPPORT
 * Déclenchement d'aléas rares et réalistes lors des interventions et DPS.
 * Envoi de notifications sonores, tactiles (vibrations smartphone) et push (PC/Mobile).
 */

window.ProtecIncidents = {
  // Catalogue d'incidents opérationnels rares et variés
  incidentsCatalog: [
    {
      id: 'canicule_coup_de_chaleur',
      title: 'Canicule : Coup de Chaleur Sévère & Malaises Multiples',
      type: 'medical',
      severity: 'critique',
      icon: 'flame',
      color: 'red',
      desc: 'Sous un soleil de plomb et une forte chaleur, 3 festivaliers s\'effondrent en hyperthermie maligne (température corporelle > 39.5°C, confusion et tachycardie).',
      choices: [
        {
          text: 'Déploiement tente climatisée, brumisation intensive & solutés d\'hydratation',
          costSupply: 'woundKits',
          costQty: 1,
          rewardXp: 110,
          rewardReputation: 12,
          outcome: 'Prise en charge thermique exemplaire ! Les victimes reprennent conscience et sont stabilisées dans la tente de repos.'
        },
        {
          text: 'Appel SAMU 15 pour évacuation médicalisée SMUR sous air climatisé',
          costSupply: null,
          rewardXp: 70,
          rewardReputation: 8,
          outcome: 'Le médecin régulateur valide l\'évacuation vers le CHRU. Les secouristes ont bien géré le déchoquage thermique.'
        }
      ]
    },
    {
      id: 'intemperies_glissade_trauma',
      title: 'Intempéries : Chute Collective sur Terrain Glissant & Fracture',
      type: 'operation',
      severity: 'eleve',
      icon: 'cloud-lightning',
      color: 'orange',
      desc: 'Pluie battante et orage : le terrain est devenu un bourbier. Deux participants font une violente chute avec suspicion de fracture de cheville et traumatisme crânien.',
      choices: [
        {
          text: 'Pose attelle à dépression & brancardage abrité vers le VPSP',
          costSupply: 'woundKits',
          costQty: 2,
          rewardXp: 95,
          rewardReputation: 10,
          outcome: 'Immobilisation rigoureuse et brancardage sécurisé sous la bâche étanche malgré la boue. Félicitations des familles.'
        },
        {
          text: 'Engager le véhicule tout-chemin (VLHR) pour extraction directe',
          costDelayMin: 8,
          rewardXp: 85,
          outcome: 'Extraction motorisée rapide et sans secousses évitant l\'aggravation des lésions traumatiques.'
        }
      ]
    },
    {
      id: 'depart_non_rearme_rupture_o2',
      title: 'Incident Logistique : Bouteille O2 Vide (Véhicule Non Réarmé)',
      type: 'logistique',
      severity: 'critique',
      icon: 'alert-triangle',
      color: 'red',
      desc: 'Détresse respiratoire sur poste ! En ouvrant le manodétendeur de la bouteille d\'oxygène, l\'équipier constate un manomètre à 0 bar : le VPSP n\'avait pas été réarmé au retour de la précédente mission !',
      choices: [
        {
          text: 'Ventilation manuelle BAVU à l\'air ambiant & appel SMUR en urgence absolue',
          costReputation: -15,
          costDelayMin: 12,
          outcome: 'La victime est sauvée de justesse mais le médecin du SMUR dresse un rapport d\'incident grave au SAMU et à l\'ARS pour véhicule non réarmé.'
        },
        {
          text: 'Emprunter d\'urgence la bouteille de réserve du Poste Fixe (Lot A)',
          costSupply: 'oxygenBottles',
          costQty: 1,
          rewardXp: 40,
          outcome: 'Oxygénation reprise in extremis grâce au Lot A du PSA. Le Chef de Poste consigne l\'oubli de réarmement au carnet de bord.'
        }
      ]
    },
    {
      id: 'arret_respiratoire',
      title: 'Aggravation : Arrêt Cardio-Respiratoire (ACR)',
      type: 'medical',
      severity: 'critique',
      icon: 'heart-pulse',
      color: 'red',
      desc: 'La victime prise en charge fait un malaise grave avec perte de conscience et arrêt ventilatoire ! Réanimation cardio-pulmonaire immédiate et pose du DAE.',
      choices: [
        {
          text: 'Choc DAE & Oxygénothérapie Haute Concentration (15L/min)',
          costSupply: 'oxygenBottles',
          costQty: 1,
          rewardXp: 120,
          outcome: 'Réanimation réussie ! Reprise d’une activité cardiaque spontanée avant l’arrivée du SMUR.'
        },
        {
          text: 'Demander l’envoi immédiat d’une équipe médicale SMUR',
          costSupply: null,
          rewardReputation: 15,
          outcome: 'Le médecin régulateur du SAMU 15 félicite l’équipage pour la réactivité du massage.'
        }
      ]
    },
    {
      id: 'panne_mecanique',
      title: 'Avarie Véhicule : Crevaison / Surchauffe Moteur',
      type: 'logistique',
      severity: 'modere',
      icon: 'alert-triangle',
      color: 'amber',
      desc: 'Le VPSP subit un incident technique sur son itinéraire. Le conducteur signale une perte de pression ou un voyant moteur.',
      choices: [
        {
          text: 'Changement de roue rapide par l’équipage sur bas-côté sécurisé',
          costDelayMin: 5,
          rewardXp: 60,
          outcome: 'Roue changée avec professionnalisme en 5 minutes. Le véhicule reprend sa route.'
        },
        {
          text: 'Faire appel au garage agréé et consigner au carnet de bord',
          costMoney: 120,
          outcome: 'Dépannage d’urgence pris en charge. Le véhicule est remis aux normes de sécurité.'
        }
      ]
    },
    {
      id: 'suraccident_foule',
      title: 'Suraccident : Mouvement de foule & 2 blessés légers',
      type: 'operation',
      severity: 'eleve',
      icon: 'users',
      color: 'orange',
      desc: 'Un mouvement de panique lors de l’événement génère deux victimes supplémentaires (plaies et traumatisme à la cheville).',
      choices: [
        {
          text: 'Déployer les kits pansements & immobilisation coquille',
          costSupply: 'woundKits',
          costQty: 2,
          rewardMoney: 150,
          rewardXp: 90,
          outcome: 'Les deux victimes sont soignées sur place sans engorgement des urgences hospitalières.'
        },
        {
          text: 'Dépêcher un binôme en renfort depuis le poste central',
          rewardReputation: 20,
          outcome: 'Le dispositif a parfaitement absorbé l’afflux de victimes. Les organisateurs sont ravis.'
        }
      ]
    },
    {
      id: 'coup_chaleur_secouriste',
      title: 'Condition Physique : Coup de chaleur d’un bénévole',
      type: 'rh',
      severity: 'modere',
      icon: 'thermometer-sun',
      color: 'amber',
      desc: 'Sous l’effort et la chaleur, un équipier secouriste présente des céphalées et des vertiges. Il doit impérativement être mis au repos.',
      choices: [
        {
          text: 'Mise à l’ombre sous la tente PMA, hydratation et repos 20 min',
          rewardMoral: 10,
          outcome: 'Le secouriste a récupéré ses forces dans le respect des règles de sécurité des intervenants.'
        },
        {
          text: 'Relève anticipée par un secouriste de réserve de l’antenne',
          rewardXp: 50,
          outcome: 'La relève s’est déroulée sans interruption du dispositif de secours.'
        }
      ]
    },
    {
      id: 'agression_tension',
      title: 'Ordre Public : Individus agressifs aux abords du poste',
      type: 'securite',
      severity: 'eleve',
      icon: 'shield-alert',
      color: 'rose',
      desc: 'Des personnes alcoolisées insultent et bousculent l’équipe de secours devant la tente de premiers secours.',
      choices: [
        {
          text: 'Repli en sécurité à l’intérieur du poste et appel Police / Gendarmerie',
          rewardReputation: 15,
          outcome: 'Les forces de l’ordre sont intervenues rapidement et ont interpellé les perturbateurs.'
        },
        {
          text: 'Médiation calme par le Chef d’Équipe et sécurisation du périmètre',
          rewardXp: 100,
          outcome: 'Le calme est revenu sans incident. Gestion exemplaire du stress par l’équipe.'
        }
      ]
    },
    {
      id: 'panne_dae',
      title: 'Matériel : Électrodes DAE défectueuses ou périmées',
      type: 'logistique',
      severity: 'faible',
      icon: 'battery-warning',
      color: 'blue',
      desc: 'Lors de la vérification de l’interpack, le secouriste constate que les électrodes adultes doivent être renouvelées.',
      choices: [
        {
          text: 'Remplacer immédiatement par le jeu de réserve du sac PS',
          costSupply: 'aedPads',
          costQty: 1,
          rewardXp: 40,
          outcome: 'Matériel opérationnel vérifié et conforme aux référentiels RNSRC.'
        },
        {
          text: 'Noter sur la feuille de garde et emprunter à une antenne voisine',
          costMoney: 45,
          outcome: 'Lot d’électrodes de rechange commandé en urgence.'
        }
      ]
    },
    {
      id: 'hemorragie_arterielle',
      title: 'Urgence Vitale : Hémorragie Artérielle Massive',
      type: 'medical',
      severity: 'critique',
      icon: 'droplet',
      color: 'red',
      desc: 'Un participant s’est lourdement blessé sur une grille métallique. Saignement rouge vif en jet pulsatile à la cuisse.',
      choices: [
        {
          text: 'Pose immédiate du garrot tourniquet tactique & heure de pose notée',
          costSupply: 'woundKits',
          costQty: 1,
          rewardXp: 110,
          rewardReputation: 25,
          outcome: 'Hémorragie tarie en moins de 30 secondes ! Éloge du médecin SMUR pour la rigueur du garrot.'
        },
        {
          text: 'Compression manuelle directe continue avec relais pansement compressif',
          costSupply: null,
          rewardXp: 75,
          outcome: 'Le saignement a été maîtrisé avec ténacité jusqu’à l’arrivée des renforts médicaux.'
        }
      ]
    },
    {
      id: 'detresse_psychologique',
      title: 'Soutien Humain : Proche en État de Choc Aigu',
      type: 'social',
      severity: 'modere',
      icon: 'heart-handshake',
      color: 'purple',
      desc: 'Suite à l’accident, la compagne de la victime fait une crise d’angoisse sévère avec tremblements et hyperventilation incontrôlée.',
      choices: [
        {
          text: 'Détacher un secouriste pour écoute active, mise à l’abri et respiration guidée',
          rewardMoral: 15,
          rewardReputation: 20,
          outcome: 'La prise en charge humaine et bienveillante a permis d’apaiser la proche en toute dignité.'
        },
        {
          text: 'Faire appel au médecin régulateur du Samu pour prescription anxiolytique',
          rewardXp: 45,
          outcome: 'Le régulateur a validé la prise en charge médicale adaptée.'
        }
      ]
    },
    {
      id: 'panne_transmissions',
      title: 'Transmissions : Perte du Réseau Radio (Zone d’Ombre)',
      type: 'logistique',
      severity: 'modere',
      icon: 'radio',
      color: 'amber',
      desc: 'Dans le sous-sol de la salle de concert, les talkies-walkies ne captent plus le relais du poste de commandement.',
      choices: [
        {
          text: 'Établir une liaison relais à vue avec un binôme intermédiaire au rez-de-chaussée',
          rewardXp: 80,
          outcome: 'Dispositif de relais visuel parfait. Le contact radio opérationnel est rétabli sans délai.'
        },
        {
          text: 'Basculer en secours sur la messagerie réseau mobile cellulaire 4G',
          rewardReputation: 10,
          outcome: 'Liaison de secours efficace, les bilans ont pu être transmis au PC sans interruption.'
        }
      ]
    },
    {
      id: 'convulsion_pediatrique',
      title: 'Pédiatrie : Convulsion Hyperthermique d’un Enfant',
      type: 'medical',
      severity: 'eleve',
      icon: 'baby',
      color: 'rose',
      desc: 'Un enfant de 3 ans présente une fièvre à 39,8°C et une crise convulsive brève devant ses parents affolés.',
      choices: [
        {
          text: 'Libération des voies aériennes, PLS, découverte de l’enfant et rassurance des parents',
          rewardXp: 95,
          rewardReputation: 20,
          outcome: 'Gestes pédiatriques parfaits : la crise a cessé, l’enfant a repris conscience dans les bras de ses parents.'
        },
        {
          text: 'Demande réflexe d’un SMUR Pédiatrique au 15',
          rewardReputation: 15,
          outcome: 'L’équipe hospitalière a pris le relais en toute sécurité.'
        }
      ]
    },
    {
      id: 'panne_electrique_site',
      title: 'Logistique : Black-out Électrique sur le Festival',
      type: 'logistique',
      severity: 'eleve',
      icon: 'zap-off',
      color: 'slate',
      desc: 'Coupure générale de courant sur le site de la manifestation. Le poste de secours est plongé dans l’obscurité totale.',
      choices: [
        {
          text: 'Déployer le lot éclairage autonome et le groupe électrogène de l’antenne',
          costSupply: 'oxygenBottles', // Lot technique
          costQty: 0,
          rewardXp: 85,
          rewardReputation: 25,
          outcome: 'Mât d’éclairage allumé en 3 minutes ! Les soins et l’accueil des victimes se poursuivent sans accroc.'
        },
        {
          text: 'Rapatrier immédiatement les blessés sous les projecteurs LED de cellule du VPSP',
          rewardXp: 60,
          outcome: 'Repli tactique intelligent à l’intérieur du véhicule d’intervention.'
        }
      ]
    },
    {
      id: 'refus_soins_ebriete',
      title: 'Déontologie : Refus de Soins d’une Personne Traumatisée',
      type: 'securite',
      severity: 'modere',
      icon: 'alert-circle',
      color: 'orange',
      desc: 'Une victime avec une plaie saignante au front et sous l’emprise de l’alcool refuse catégoriquement d’être soignée ou transportée.',
      choices: [
        {
          text: 'Dialogue posé, explication des risques vitaux et recueil d’une décharge signée',
          rewardXp: 70,
          outcome: 'La victime s’est calmée, a accepté la pose d’un pansement de protection avant de signer la décharge.'
        },
        {
          text: 'Aviser la Police Municipale et la régulation 15 pour décision de garde médicale',
          rewardReputation: 15,
          outcome: 'Procédure légale strictement respectée pour protéger la responsabilité de l’association.'
        }
      ]
    },
    {
      id: 'brancardage_escarpe',
      title: 'Topographie : Évacuation en Terrain Accidenté ou Boueux',
      type: 'operation',
      severity: 'eleve',
      icon: 'mountain',
      color: 'emerald',
      desc: 'Un coureur blessé à la cheville se trouve sur un sentier forestier escarpé, impraticable pour les brancards roulants classiques.',
      choices: [
        {
          text: 'Utilisation du brancard cuillère et portage au pas à 4 secouristes équipés',
          rewardXp: 90,
          rewardMoral: 10,
          outcome: 'Brancardage physique exemplaire sur 600 mètres. La victime est arrivée au VPSP sans douleur.'
        },
        {
          text: 'Solliciter l’aide du véhicule 4x4 des organisateurs ou de la DFCI',
          rewardReputation: 15,
          outcome: 'Coordination efficace avec les organisateurs de l’événement.'
        }
      ]
    },
    {
      id: 'accouchement_inopine',
      title: 'Situation Exceptionnelle : Accouchement Inopiné sur le Dispositif',
      type: 'medical',
      severity: 'critique',
      icon: 'sparkles',
      color: 'purple',
      desc: 'Une spectatrice enceinte est prise de contractions très rapprochées. La perte des eaux survient sous la tente de secours !',
      choices: [
        {
          text: 'Installation en cellule VPSP, kit accouchement d’urgence & régulation 15 en direct',
          rewardXp: 150,
          rewardReputation: 40,
          rewardMoral: 25,
          outcome: 'Événement magique ! Le nouveau-né a poussé son premier cri dans le VPSP avant l’arrivée du SMUR !'
        },
        {
          text: 'Évacuation réflexe d’urgence sous avertisseurs vers la maternité la plus proche',
          rewardXp: 100,
          rewardReputation: 25,
          outcome: 'Arrivée aux urgences gynécologiques juste à temps. Maman et bébé se portent à merveille !'
        }
      ]
    },
    {
      id: 'vehicule_bloque_stationnement',
      title: 'Circulation : Ambulance Bloquée par un Stationnement Gênant',
      type: 'logistique',
      severity: 'modere',
      icon: 'truck',
      color: 'amber',
      desc: 'Au moment de partir en évacuation, une voiture garée en double file bloque l’accès du VPSP vers la voie publique.',
      choices: [
        {
          text: 'Manoeuvre millimétrée avec deux équipiers au guidage et avertisseur deux-tons bref',
          costDelayMin: 3,
          rewardXp: 65,
          outcome: 'Manoeuvre réussie au centimètre près sans le moindre froissement de tôle !'
        },
        {
          text: 'Faire appel immédiatement aux agents de sécurité de l’événement pour dégager la voie',
          rewardReputation: 15,
          outcome: 'L’axe a été libéré rapidement et sécurisé.'
        }
      ]
    },
    {
      id: 'intoxication_collective',
      title: 'Alerte Sanitaire : Suspicion d’Intoxication Alimentaire Massive',
      type: 'operation',
      severity: 'eleve',
      icon: 'utensils',
      color: 'orange',
      desc: 'Six convives du même banquet présentent simultanément vomissements, vertiges et douleurs abdominales aiguës.',
      choices: [
        {
          text: 'Création d’un poste de triage avancé, mise au repos, prise de constantes et alerte ARS/15',
          costSupply: 'woundKits',
          costQty: 1,
          rewardXp: 120,
          rewardReputation: 30,
          outcome: 'Triage de crise méthodique. Le SAMU félicite la clarté du recensement des constantes.'
        },
        {
          text: 'Distribution de solutés d’hydratation et surveillance rapprochée sous la tente',
          rewardXp: 80,
          outcome: 'Les symptômes se sont stabilisés sans transfert lourd nécessaire.'
        }
      ]
    },
    {
      id: 'danger_animal',
      title: 'Sécurité : Animal Agressif sur Lieu d’Intervention à Domicile',
      type: 'securite',
      severity: 'modere',
      icon: 'shield',
      color: 'rose',
      desc: 'En intervenant pour un malaise à domicile, un grand chien de garde aboie férocement et barre l’entrée de la pièce.',
      choices: [
        {
          text: 'Demander calmement à un occupant de la maison d’isoler le chien dans une pièce fermée',
          rewardXp: 50,
          outcome: 'L’animal a été enfermé sans précipitation, permettant une prise en charge sécurisée.'
        },
        {
          text: 'Garder l’équipage groupé derrière le brancard en attendant le retour au calme',
          rewardXp: 60,
          outcome: 'Prudence exemplaire face au risque animalier.'
        }
      ]
    }
  ],

  // Demande l'autorisation des notifications au navigateur
  async requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  },

  // Émission sonore d'alerte opérationnelle (bip radio secours 2-tons)
  playAlertSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Bip 1 (aigu)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);

      // Bip 2 (intermédiaire)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.22);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.22);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio autoplay non initialisé avant premier clic
    }
  },

  // Notification Push / Système (Bureau PC & Smartphone)
  sendSystemNotification(title, body, tag = 'protec-incident') {
    // 1. Son d'alerte
    this.playAlertSound();

    // 2. Vibration mobile tactile
    if (navigator.vibrate) {
      try {
        navigator.vibrate([300, 150, 300, 150, 400]);
      } catch (e) {}
    }

    // 3. Notification native
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: body,
          icon: 'badge-monochrome.png',
          badge: 'badge-monochrome.png',
          tag: tag,
          renotify: true,
          requireInteraction: true
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Erreur notification native:', e);
      }
    }
  },

  // Vérification périodique des incidents sur les missions en cours
  checkOngoingMissions(game) {
    if (!game.missions) return;
    const ongoing = game.missions.filter(m => m.status === 'ongoing');
    if (ongoing.length === 0) return;

    ongoing.forEach(m => {
      // Nettoyage systématique de tout arbitrage médical résiduel :
      // Sur le terrain, les secouristes et chefs d'équipe prennent les décisions de secours, pas le gestionnaire.
      if (m.currentIncident) {
        m.currentIncident = null;
        m.incidentResolved = true;
      }

      // 1. Détection du manque de personnel / sous-dimensionnement (décision du directeur d'antenne pour renforts)
      this.checkUnderstaffedAlert(game, m);

      // Si la mission a déjà eu son aléa opérationnel géré en autonomie, on ne le duplique pas
      if (m.incidentResolved) return;

      // Calcul de probabilité réaliste (environ 1 aléa toutes les 5-8 missions)
      // Déclenchement quand la mission a dépassé 25% et avant 85% de sa durée
      if (!m.startedAt || !m.durationSeconds) return;
      const elapsed = (Date.now() - m.startedAt) / 1000;
      const progressRatio = elapsed / m.durationSeconds;

      if (progressRatio > 0.25 && progressRatio < 0.85) {
        // Chance de survenue par cycle
        if (Math.random() < 0.008) {
          this.triggerIncident(game, m);
        }
      }
    });
  },

  // Prise en charge autonome d'un aléa de terrain par les secouristes sur place
  triggerIncident(game, mission) {
    const catalog = this.incidentsCatalog;
    let incidentData = null;

    // Détection de départ avec véhicule non réarmé
    const assignedVehicles = mission.assignedCrew?.vehicles || [];
    const hasUnrearmedVehicle = assignedVehicles.some(veh => veh.status === 'a_rearme' || veh.a_rearme || veh.needsRearming);

    if (hasUnrearmedVehicle && Math.random() < 0.65) {
      incidentData = catalog.find(inc => inc.id === 'depart_non_rearme_rupture_o2');
    }

    // Détection météo canicule
    if (!incidentData && game.weather && (game.weather.condition === 'heat' || game.weather.condition === 'canicule' || (game.weather.temp && game.weather.temp >= 30))) {
      if (Math.random() < 0.55) {
        incidentData = catalog.find(inc => inc.id === 'canicule_coup_de_chaleur');
      }
    }

    // Détection météo pluie battante / orage
    if (!incidentData && game.weather && ['storm', 'rain', 'pluie_battante', 'orage_violent'].includes(game.weather.condition)) {
      if (Math.random() < 0.55) {
        incidentData = catalog.find(inc => inc.id === 'intemperies_glissade_trauma');
      }
    }

    if (!incidentData) {
      incidentData = catalog[Math.floor(Math.random() * catalog.length)];
    }

    // Les secouristes sur place (PSE1, PSE2, Chef d'équipe) prennent la décision opérationnelle
    // de manière 100% autonome en lien avec la régulation SAMU 15.
    const chosenAction = (incidentData.choices && incidentData.choices.length > 0) 
      ? incidentData.choices[0] 
      : { outcome: 'Prise en charge réalisée selon les référentiels de secours.', rewardXp: 50 };

    // 1. Attribution d'expérience aux secouristes engagés sur la mission
    if (mission.assignedCrew && mission.assignedCrew.volunteers && mission.assignedCrew.volunteers.length > 0) {
      const xpShare = Math.round((chosenAction.rewardXp || 60) / mission.assignedCrew.volunteers.length);
      mission.assignedCrew.volunteers.forEach(vId => {
        const vol = (game.volunteers || []).find(v => v.id === vId);
        if (vol) vol.exp = (vol.exp || 10) + xpShare;
      });
    }

    // 2. Consommation matérielle si applicable et disponible
    if (chosenAction.costSupply && game.logistics && game.logistics[chosenAction.costSupply] !== undefined) {
      if (game.logistics[chosenAction.costSupply] >= (chosenAction.costQty || 1)) {
        game.logistics[chosenAction.costSupply] -= (chosenAction.costQty || 1);
      }
    }

    // 3. Notoriété pour la bonne prise en charge
    if (chosenAction.rewardReputation) {
      if (game.resources.reputationScore !== undefined) {
        game.resources.reputationScore = Math.min(100, game.resources.reputationScore + chosenAction.rewardReputation);
      }
    }

    // 4. Transmission radio informative sur TACTIQUE-1 (Zéro popup bloquante pour le gestionnaire)
    if (game.radioLogs) {
      game.radioLogs.unshift({
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        channel: 'TACTIQUE-1',
        text: `[INFO TERRAIN] ${mission.title} : ${incidentData.title} géré par l'équipage sur place. ${chosenAction.outcome || 'Bilan transmis au SAMU 15.'}`,
        type: 'info'
      });
    }

    // Clôture immédiate de l'incident : aucune action requise du directeur d'antenne
    mission.currentIncident = null;
    mission.incidentResolved = true;

    // Fermeture de sécurité de toute modale éventuelle
    this.closeIncidentModal();
    if (typeof game.saveGame === 'function') game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
  },

  // Fermeture et neutralisation de la modale d'arbitrage clinique (les secouristes gèrent seuls)
  openIncidentModal(game, mission) {
    if (mission) {
      mission.currentIncident = null;
      mission.incidentResolved = true;
    }
    this.closeIncidentModal();
  },

  // Résolution de l'incident
  resolveIncident(game, missionId, choiceIndex) {
    const mission = game.missions.find(m => m.id === missionId);
    if (!mission || !mission.currentIncident) return;

    const incident = mission.currentIncident;
    const choice = incident.choices[choiceIndex];

    if (choice) {
      // Coût matériel
      if (choice.costSupply && game.logistics && game.logistics[choice.costSupply] !== undefined) {
        if (game.logistics[choice.costSupply] >= (choice.costQty || 1)) {
          game.logistics[choice.costSupply] -= (choice.costQty || 1);
        }
      }

      // Coût financier
      if (choice.costMoney) {
        game.resources.money = Math.max(0, game.resources.money - choice.costMoney);
      }

      // Récompense argent
      if (choice.rewardMoney) {
        game.resources.money += choice.rewardMoney;
      }

      // Notoriété
      if (choice.rewardReputation) {
        game.resources.followers = (game.resources.followers || 100) + choice.rewardReputation;
        if (game.resources.reputationScore !== undefined) {
          game.resources.reputationScore += choice.rewardReputation;
        }
      }

      // XP aux bénévoles de la mission
      if (choice.rewardXp && mission.assignedCrew && mission.assignedCrew.volunteers) {
        mission.assignedCrew.volunteers.forEach(vId => {
          const vol = game.volunteers.find(v => v.id === vId);
          if (vol) vol.exp = (vol.exp || 10) + Math.round(choice.rewardXp / mission.assignedCrew.volunteers.length);
        });
      }

      // Compilation détaillée des résultats pour la notification après sélection
      const resultsSummary = [];
      if (choice.rewardReputation) resultsSummary.push(`+${choice.rewardReputation} Notoriété`);
      if (choice.rewardXp) resultsSummary.push(`+${choice.rewardXp} XP Équipage`);
      if (choice.rewardMoney) resultsSummary.push(`+${choice.rewardMoney} €`);
      if (choice.costMoney) resultsSummary.push(`-${choice.costMoney} €`);
      if (choice.costSupply) resultsSummary.push(`-${choice.costQty || 1} ${choice.costSupply}`);

      const summaryStr = resultsSummary.length > 0 ? ` (Bilan : ${resultsSummary.join(', ')})` : '';

      // Toast et log radio (le résultat est révélé seulement ici dans la notification)
      game.showToast('Incident Résolu !', `${choice.outcome || 'L’équipage a géré la situation.'}${summaryStr}`, 'green');

      if (game.radioLogs) {
        game.radioLogs.unshift({
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          channel: 'TACTIQUE-1',
          text: `[INCIDENT RÉSOLU] ${mission.title} : ${choice.outcome || 'Action validée'}${summaryStr}`,
          type: 'success'
        });
      }
    }

    mission.currentIncident = null;
    mission.incidentResolved = true;

    this.closeIncidentModal();
    game.saveGame();
    game.updateStatsUI();
  },

  closeIncidentModal() {
    const modal = document.getElementById('incident-modal');
    if (modal) {
      modal.remove();
    }
  },

  createIncidentModalDOM() {
    // Neutralisé : les décisions cliniques et gestes de premiers secours sont pris directement par les secouristes sur place
    const modal = document.getElementById('incident-modal');
    if (modal) modal.remove();
  },

  // Détection du sous-dimensionnement en cours de mission
  checkUnderstaffedAlert(game, mission) {
    if (mission.understaffAlertTriggered || mission.understaffResolved) return;
    if (mission.type !== 'dps' && !mission.scale) return;
    if (!mission.startedAt || !mission.durationSeconds) return;

    const elapsed = (Date.now() - mission.startedAt) / 1000;
    const progressRatio = elapsed / mission.durationSeconds;
    // Déclenchement quand la mission a dépassé 15% et avant 85% de sa durée
    if (progressRatio < 0.15 || progressRatio > 0.85) return;

    const crewCount = (mission.assignedCrew?.volunteers || mission.registeredVolunteers || []).length;
    const minNeeded = mission.hiddenMinVolunteers || mission.requiredVolunteers || 4;

    const titleLower = (mission.title || '').toLowerCase();
    const descLower = (mission.desc || '').toLowerCase();
    const isIntenseEvent = titleLower.includes('festival') || 
                           titleLower.includes('concert') || 
                           titleLower.includes('match') || 
                           titleLower.includes('tournoi') || 
                           titleLower.includes('rugby') || 
                           titleLower.includes('foot') || 
                           titleLower.includes('trail') || 
                           titleLower.includes('course') || 
                           titleLower.includes('marathon') || 
                           titleLower.includes('carnaval') || 
                           titleLower.includes('nocturne') || 
                           titleLower.includes('fête') || 
                           titleLower.includes('gala') || 
                           descLower.includes('festival') ||
                           descLower.includes('concert') ||
                           (mission.scale && (mission.scale.includes('ME') || mission.scale.includes('GE')));

    const isStrictlyUnderstaffed = !!(mission.isUnderdimensioned || (crewCount < minNeeded));
    const isUnderForWorkload = isIntenseEvent && (crewCount <= 4 || crewCount < minNeeded);

    if (!isStrictlyUnderstaffed && !isUnderForWorkload) return;

    // Probabilité d'alerte par cycle de 4 secondes
    const triggerChance = isStrictlyUnderstaffed ? 0.08 : 0.04;
    if (Math.random() < triggerChance) {
      this.triggerUnderstaffAlert(game, mission, {
        crewCount,
        minNeeded,
        isIntenseEvent
      });
    }
  },

  // Déclencher l'alerte de manque de personnel sur place
  triggerUnderstaffAlert(game, mission, context) {
    mission.understaffAlertTriggered = true;

    if (window.ProtecAudio && typeof window.ProtecAudio.playEmergencyAlert === 'function') {
      window.ProtecAudio.playEmergencyAlert();
    }

    this.sendSystemNotification(
      `🚨 ALERTE EFFECTIFS : ${mission.title}`,
      `Les secouristes sur place sont débordés par la quantité de travail et demandent des renforts en urgence !`,
      `understaff-${mission.id}`
    );

    if (game.radioLogs) {
      game.radioLogs.unshift({
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        channel: 'TACTIQUE-1',
        text: `[URGENCE EFFECTIFS] ${mission.title} : Chef de poste signale débordement face à la quantité de travail. Demande de renforts immédiate.`,
        type: 'alert'
      });
    }

    game.showToast(
      '🚨 Secouristes Débordés !',
      `Appel radio d'urgence sur « ${mission.title} » : manque de personnel face à l'afflux de victimes. Décision requise !`,
      'red'
    );

    this.openUnderstaffModal(game, mission, context);
    game.updateStatsUI();
  },

  // Modale d'arbitrage de renforts en urgence
  openUnderstaffModal(game, mission, context) {
    let modal = document.getElementById('understaff-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'understaff-modal';
      modal.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500 shadow-2xl p-6 text-left space-y-4 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
        <!-- En-tête alerte -->
        <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div class="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <i data-lucide="siren" class="w-6 h-6 animate-pulse"></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 uppercase tracking-wider animate-pulse">Urgence Terrain</span>
              <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">Radio TACTIQUE-1</span>
            </div>
            <h3 class="text-base font-black text-slate-900 dark:text-white leading-tight mt-0.5 truncate">Poste Débordé : Renforts Requis</h3>
          </div>
        </div>

        <!-- Appel radio du Chef de Poste -->
        <div class="p-4 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2 text-xs relative overflow-hidden">
          <div class="flex items-center justify-between text-[11px] text-amber-400 font-bold border-b border-slate-800 pb-1.5">
            <span class="flex items-center gap-1.5">
              <i data-lucide="radio" class="w-3.5 h-3.5"></i>
              <span>Chef de Poste sur « ${mission.title} »</span>
            </span>
            <span class="text-[10px] text-slate-400">${context.crewCount} secouriste(s) sur site</span>
          </div>
          <p class="italic text-slate-200 leading-relaxed pt-1">
            « Ici le Chef de Dispositif ! Nous sommes complètement submergés par le flux d'interventions. Le poste a été sous-dimensionné par rapport à l'affluence et à la quantité de travail : les malaises et traumatismes s'enchaînent, nous n'avons plus assez de bras pour sécuriser la zone et tenir les postes de soins ! Nous demandons des renforts en urgence absolue ! »
          </p>
        </div>

        <div class="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Arbitrage du Directeur des Secours :
        </div>

        <!-- Choix 1 : Annoncer et mettre immédiatement du renfort -->
        <button onclick="window.ProtecIncidents.resolveUnderstaffChoice(window.game, '${mission.id}', 'renfort_immediat')"
          class="w-full text-left p-4 rounded-2xl border-2 border-emerald-300 dark:border-emerald-600/70 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 hover:border-emerald-500 transition cursor-pointer group space-y-1.5 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-emerald-950 dark:text-emerald-200 group-hover:text-emerald-900 dark:group-hover:text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">1</span>
              <span>Annoncer et envoyer du renfort immédiatement (Départ en route)</span>
            </span>
            <i data-lucide="chevron-right" class="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition flex-shrink-0"></i>
          </div>
          <div class="text-[11px] text-emerald-900/90 dark:text-emerald-300/90 pl-8 space-y-0.5">
            <p>• Transmet l'ordre radio : « Renforts annoncés et en cours d'acheminement ».</p>
            <p class="font-bold text-emerald-800 dark:text-emerald-300">🚑 Engager un équipage de renfort : comble le manque de moyens et rassure le Chef de Dispositif.</p>
            <p class="font-bold text-teal-700 dark:text-teal-400">🛡️ Débordement maîtrisé : le stress des secouristes chute et la mission est sécurisée.</p>
          </div>
        </button>

        <!-- Choix 2 : Détachement d'astreinte interne -->
        <button onclick="window.ProtecIncidents.resolveUnderstaffChoice(window.game, '${mission.id}', 'interne')"
          class="w-full text-left p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/40 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50 hover:border-indigo-400 transition cursor-pointer group space-y-1.5 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-indigo-950 dark:text-indigo-200 group-hover:text-indigo-800 dark:group-hover:text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">2</span>
              <span>Détacher mes secouristes locaux d'astreinte</span>
            </span>
            <i data-lucide="chevron-right" class="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition flex-shrink-0"></i>
          </div>
          <div class="text-[11px] text-indigo-900/90 dark:text-indigo-300/90 pl-8 space-y-0.5">
            <p>• Mobilise des secouristes disponibles ou d'astreinte de votre propre antenne sur le dispositif.</p>
            <p class="font-bold text-indigo-700 dark:text-indigo-300">📋 Mobilisation interne : sollicitation de vos effectifs locaux pour combler le sous-effectif.</p>
            <p class="font-bold text-emerald-700 dark:text-emerald-400">🛡️ Continuité opérationnelle : l'antenne maintient son autonomie et assure le dispositif.</p>
          </div>
        </button>

        <!-- Choix 3 : Demande de Renforts aux autres directeurs réels (FNPC) -->
        <button onclick="window.ProtecIncidents.resolveUnderstaffChoice(window.game, '${mission.id}', 'alliance')"
          class="w-full text-left p-4 rounded-2xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 hover:border-blue-400 transition cursor-pointer group space-y-1.5 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-blue-950 dark:text-blue-200 group-hover:text-blue-800 dark:group-hover:text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">3</span>
              <span>Demander des renforts aux antennes alliées (Réseau FNPC)</span>
            </span>
            <i data-lucide="chevron-right" class="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition flex-shrink-0"></i>
          </div>
          <div class="text-[11px] text-blue-900/90 dark:text-blue-300/90 pl-8 space-y-0.5">
            <p>• Diffuse un appel en direct à tous les directeurs réels connectés (département / zone de défense).</p>
            <p class="font-bold text-blue-700 dark:text-blue-300">🤝 Solidarité inter-antennes : seuls de vrais véhicules et confrères sont envoyés.</p>
            <p class="font-bold text-emerald-700 dark:text-emerald-400">🌐 Aucun renfort fictif : mobilisation transparente du réseau fédéral.</p>
          </div>
        </button>
      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  // Résolution de l'arbitrage
  resolveUnderstaffChoice(game, missionId, choice) {
    const mission = (game.missions || []).find(m => m.id === missionId);
    if (!mission) return;

    const crewVols = (mission.assignedCrew?.volunteers || mission.registeredVolunteers || [])
      .map(id => game.volunteers.find(v => v.id === id))
      .filter(Boolean);

    if (choice === 'renfort_immediat') {
      // 1. Déploiement de renforts prioritaires (bénévoles dispo ou en astreinte)
      const availableVols = (game.volunteers || []).filter(v => 
        (v.status === 'dispo' || v.status === 'astreinte') && 
        !mission.assignedCrew?.volunteers?.includes(v.id) &&
        !mission.registeredVolunteers?.includes(v.id)
      );
      const reinforcedVols = availableVols.slice(0, 2);

      reinforcedVols.forEach(v => {
        v.status = 'mission';
        if (!mission.assignedCrew.volunteers.includes(v.id)) {
          mission.assignedCrew.volunteers.push(v.id);
        }
        if (!mission.registeredVolunteers.includes(v.id)) {
          mission.registeredVolunteers.push(v.id);
        }
        v.motivation = Math.min(100, (v.motivation || 70) + 10);
      });

      // Soulagement immédiat de l'équipe sur place face au débordement
      crewVols.forEach(v => {
        v.stress = Math.max(0, (v.stress || 50) - 25);
        v.motivation = Math.min(100, (v.motivation || 70) + 8);
        v.humeur = Math.min(100, (v.humeur || 70) + 12);
      });

      // Bonus réputation pour excellente réactivité face au débordement
      game.resources.reputationScore = Math.min(100, (game.resources.reputationScore || 50) + 6);

      mission.understaffChoice = 'renfort_immediat';
      mission.understaffResolved = true;
      mission.renfortEngaged = true;

      const namesText = reinforcedVols.length > 0 ? reinforcedVols.map(v => v.name).join(' & ') : 'Équipage de renfort d’astreinte';

      game.showToast(
        'Renforts Immédiats Engagés 🚑',
        `Ordre transmis : ${namesText} en route vers « ${mission.title} ». Débordement maîtrisé !`,
        'green'
      );

      if (game.radioLogs) {
        game.radioLogs.unshift({
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          channel: 'TACTIQUE-1',
          text: `[RADIO - RENFORT EN ROUTE] Directeur ➔ Chef de Dispositif « ${mission.title} » : Renforts confirmés et en transit immédiat. Tenez vos positions, le soutien arrive !`,
          type: 'success'
        });
      }
    } else if (choice === 'interne') {
      // Déploiement de renforts internes
      const availableVols = (game.volunteers || []).filter(v => 
        v.status === 'dispo' && 
        !mission.assignedCrew?.volunteers?.includes(v.id)
      );
      const reinforcedVols = availableVols.slice(0, 2);

      reinforcedVols.forEach(v => {
        v.status = 'mission';
        if (!mission.assignedCrew.volunteers.includes(v.id)) {
          mission.assignedCrew.volunteers.push(v.id);
        }
        // Baisse légère d'humeur et motivation des renforts
        v.motivation = Math.max(10, (v.motivation || 70) - 5);
        v.humeur = Math.max(10, (v.humeur || 70) - 5);
      });

      // Baisse légère de l'humeur et motivation de l'équipe sur place
      crewVols.forEach(v => {
        v.motivation = Math.max(10, (v.motivation || 70) - 6);
        v.humeur = Math.max(10, (v.humeur || 70) - 6);
      });

      // Baisse légère de réputation (limitation des dégâts)
      const repLoss = 3;
      game.resources.reputationScore = Math.max(0, (game.resources.reputationScore || 50) - repLoss);

      mission.understaffChoice = 'interne';
      mission.understaffResolved = true;

      const namesText = reinforcedVols.length > 0 ? reinforcedVols.map(v => v.name).join(' & ') : 'équipe d’astreinte';
      game.showToast(
        'Renforts Internes Déployés 🚑',
        `Renforts (${namesText}) arrivés sur « ${mission.title} ». Le dispositif est sécurisé en interne.`,
        'blue'
      );

      if (game.radioLogs) {
        game.radioLogs.unshift({
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          channel: 'TACTIQUE-1',
          text: `[RENFORTS INTERNES] ${mission.title} : Renforts associatifs intégrés au poste. Dispositif sécurisé.`,
          type: 'success'
        });
      }
    } else if (choice === 'alliance' || choice === 'sdis') {
      document.getElementById('understaff-modal')?.remove();
      if (typeof game.requestAllianceRenfortForMission === 'function') {
        game.requestAllianceRenfortForMission(mission.id);
      }
      return;
    }

    document.getElementById('understaff-modal')?.remove();
    game.saveGame();
    game.updateStatsUI();
  }
};
