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
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-extrabold text-slate-800 group-hover:text-pc-orange transition flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-pc-orange/15 text-pc-orange flex items-center justify-center text-[10px] font-black">${idx + 1}</span>
              ${c.text}
            </span>
          </div>
          <div class="text-[10px] text-slate-500 font-semibold pl-7 flex flex-wrap gap-2">
            ${c.costSupply ? `<span class="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Consomme : ${c.costQty} ${c.costSupply}</span>` : ''}
            ${c.costMoney ? `<span class="text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Coût : ${c.costMoney} €</span>` : ''}
            ${c.rewardXp ? `<span class="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">+${c.rewardXp} XP Équipage</span>` : ''}
            ${c.rewardReputation ? `<span class="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">+${c.rewardReputation} Notoriété</span>` : ''}
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
      }

      // XP aux bénévoles de la mission
      if (choice.rewardXp && mission.assignedCrew && mission.assignedCrew.volunteers) {
        mission.assignedCrew.volunteers.forEach(vId => {
          const vol = game.volunteers.find(v => v.id === vId);
          if (vol) vol.exp = (vol.exp || 10) + Math.round(choice.rewardXp / mission.assignedCrew.volunteers.length);
        });
      }

      // Toast et log radio
      game.showToast('Incident Maîtrisé !', choice.outcome || 'L’équipage a géré la situation avec sang-froid.', 'green');

      if (game.radioLogs) {
        game.radioLogs.unshift({
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          channel: 'TACTIQUE-1',
          text: `[INCIDENT RÉSOLU] ${mission.title} : ${choice.outcome}`,
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
