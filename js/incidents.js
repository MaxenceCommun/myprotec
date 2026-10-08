/**
 * PROTEC LIVE - GESTIONNAIRE D'INCIDENTS EN MISSION & NOTIFICATIONS MULTI-SUPPORT
 * Déclenchement d'aléas rares et réalistes lors des interventions et DPS.
 * Envoi de notifications sonores, tactiles (vibrations smartphone) et push (PC/Mobile).
 */

window.ProtecIncidents = {
  // Catalogue d'incidents opérationnels rares et variés
  incidentsCatalog: [
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
          icon: 'logo_myprotec_icon.png',
          badge: 'logo_myprotec_icon.png',
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
      // Si la mission a déjà un incident non résolu, on ne le duplique pas
      if (m.currentIncident) return;
      if (m.incidentResolved) return;

      // Calcul de probabilité réaliste (environ 1 incident toutes les 4-8 missions)
      // On déclenche quand la mission a dépassé 25% et avant 85% de sa durée
      if (!m.startedAt || !m.durationSeconds) return;
      const elapsed = (Date.now() - m.startedAt) / 1000;
      const progressRatio = elapsed / m.durationSeconds;

      if (progressRatio > 0.25 && progressRatio < 0.85) {
        // Chance de survenue (environ 0.8% par cycle de 5 secondes = ~15% de chance sur la mission entière)
        if (Math.random() < 0.008) {
          this.triggerIncident(game, m);
        }
      }
    });
  },

  // Déclencher un incident
  triggerIncident(game, mission) {
    const catalog = this.incidentsCatalog;
    const incidentData = catalog[Math.floor(Math.random() * catalog.length)];

    mission.currentIncident = {
      ...incidentData,
      triggeredAt: Date.now()
    };

    // Envoyer la notification smartphone / PC
    const notifTitle = `🚨 ALERTE INCIDENT : ${mission.title}`;
    const notifBody = `${incidentData.title} survenue en cours d’intervention. Décision requise !`;
    this.sendSystemNotification(notifTitle, notifBody, `incident-${mission.id}`);

    // Afficher toast en jeu
    game.showToast(
      `Incident en Mission : ${incidentData.title}`,
      `Alerte sur « ${mission.title} ». Cliquez pour arbitrer l’incident.`,
      'orange'
    );

    // Ajouter log radio
    if (game.radioLogs) {
      game.radioLogs.unshift({
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        channel: 'TACTIQUE-1',
        text: `[INCIDENT] ${mission.title} : ${incidentData.title}. Chef d’équipe demande arbitrage.`,
        type: 'alert'
      });
    }

    // Ouvrir la modale d'arbitrage
    this.openIncidentModal(game, mission);
    game.updateStatsUI();
  },

  // Ouvrir la modale interactive d'incident
  openIncidentModal(game, mission) {
    const incident = mission.currentIncident;
    if (!incident) return;

    let modal = document.getElementById('incident-modal');
    if (!modal) {
      this.createIncidentModalDOM();
      modal = document.getElementById('incident-modal');
    }

    const titleEl = document.getElementById('incident-title');
    const missionNameEl = document.getElementById('incident-mission-name');
    const descEl = document.getElementById('incident-desc');
    const choicesContainer = document.getElementById('incident-choices-container');

    if (titleEl) titleEl.textContent = incident.title;
    if (missionNameEl) missionNameEl.textContent = `Mission : ${mission.title} (${mission.type.toUpperCase()})`;
    if (descEl) descEl.textContent = incident.desc;

    if (choicesContainer) {
      choicesContainer.innerHTML = incident.choices.map((c, idx) => `
        <button onclick="window.ProtecIncidents.resolveIncident(window.game, '${mission.id}', ${idx})" 
          class="w-full text-left p-3.5 rounded-2xl glass-card hover:border-pc-orange hover:bg-orange-50/50 transition border border-slate-200/80 group">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-slate-800 group-hover:text-pc-orange transition flex items-center gap-2.5">
              <span class="w-6 h-6 rounded-full bg-pc-orange/15 text-pc-orange flex items-center justify-center text-[11px] font-black flex-shrink-0">${idx + 1}</span>
              <span>${c.text}</span>
            </span>
            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-pc-orange group-hover:translate-x-0.5 transition flex-shrink-0"></i>
          </div>
        </button>
      `).join('');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
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
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  createIncidentModalDOM() {
    if (document.getElementById('incident-modal')) return;
    const div = document.createElement('div');
    div.id = 'incident-modal';
    div.className = 'hidden fixed inset-0 z-[60] items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in';
    div.innerHTML = `
      <div class="w-full max-w-lg rounded-3xl glass-panel-heavy border-2 border-pc-orange p-6 shadow-2xl relative text-left">
        <div class="flex items-center gap-3 pb-3 border-b border-slate-200 mb-4">
          <div class="w-10 h-10 rounded-2xl bg-orange-100 text-pc-orange flex items-center justify-center font-bold">
            <i data-lucide="alert-octagon" class="w-5 h-5 animate-pulse"></i>
          </div>
          <div>
            <h3 id="incident-title" class="text-base font-black text-slate-900 leading-tight">Incident Opérationnel</h3>
            <p id="incident-mission-name" class="text-xs text-pc-orange font-bold">Mission en cours</p>
          </div>
        </div>
        <p id="incident-desc" class="text-xs text-slate-700 font-medium mb-4 leading-relaxed"></p>
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Décision du Directeur des Secours :</div>
        <div id="incident-choices-container" class="space-y-2 mb-4"></div>
      </div>
    `;
    document.body.appendChild(div);
  }
};
