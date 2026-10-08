/**
 * PROTEC LIVE - MOTEUR D'ÉVOLUTION HORS-LIGNE & NOTIFICATIONS D'ARRIÈRE-PLAN
 * 
 * Permet au jeu de continuer à vivre même lorsque le joueur n'est pas connecté :
 * 1. Détection des déconnexions et calcul du temps d'absence
 * 2. Progression et achèvement des missions commencées
 * 3. Récupération physiologique des effectifs (énergie, repos, décompression du stress)
 * 4. Nouvelles sollicitations reçues pendant l'absence :
 *    - Devis d'organisateurs
 *    - Nouvelles candidatures spontanées (bénévoles, salariés, service civique)
 *    - Demandes de renfort des alliances
 *    - Alertes de secours SAMU 15 & SDIS en attente
 * 5. Avancement des chantiers de locaux et des réarmements logistiques
 * 6. Rapport d'Astreinte & d'Activité présenté à la reconnexion du joueur
 * 7. Planification des notifications système en arrière-plan pour inciter au retour
 */

window.ProtecOfflineEngine = {
  initialized: false,
  lastCheckTime: Date.now(),

  init(game) {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Vérification immédiate du temps écoulé depuis la dernière session
    const lastActive = parseInt(localStorage.getItem('protec_last_active_time') || '0', 10);
    const now = Date.now();

    if (lastActive > 0) {
      const elapsedSec = Math.floor((now - lastActive) / 1000);
      // Seuil minimal d'absence : 60 secondes pour déclencher le rattrapage
      if (elapsedSec >= 60) {
        setTimeout(() => {
          this.processOfflineProgression(game, elapsedSec);
        }, 1200);
      }
    }

    localStorage.setItem('protec_last_active_time', now.toString());
    this.lastCheckTime = now;

    // 2. Écouteurs de fermeture réelle du jeu (quand le joueur quitte et ferme l'application)
    window.addEventListener('beforeunload', () => {
      this.onPlayerDeparture(game);
    });

    window.addEventListener('pagehide', () => {
      this.onPlayerDeparture(game);
    });

    // 3. Battement de coeur périodique toutes les 15 secondes pour actualiser le timestamp
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        localStorage.setItem('protec_last_active_time', Date.now().toString());
        this.lastCheckTime = Date.now();
      }
    }, 15000);
  },

  // Enregistrement lors du départ du joueur
  onPlayerDeparture(game) {
    const departureTime = Date.now();
    localStorage.setItem('protec_last_active_time', departureTime.toString());
    this.lastCheckTime = departureTime;

    // Sauvegarde immédiate de l'état
    if (game && typeof game.saveGame === 'function') {
      game.saveGame();
    }

    // Planification des alertes d'arrière-plan dans le Service Worker
    this.scheduleBackgroundAlerts(game);
  },

  // Détection lors du retour du joueur
  onPlayerReturn(game) {
    const now = Date.now();
    const lastActive = parseInt(localStorage.getItem('protec_last_active_time') || '0', 10);
    localStorage.setItem('protec_last_active_time', now.toString());

    if (lastActive > 0) {
      const elapsedSec = Math.floor((now - lastActive) / 1000);
      if (elapsedSec >= 60) {
        this.processOfflineProgression(game, elapsedSec);
      }
    }
    this.lastCheckTime = now;
  },

  // Planification des alertes d'arrière-plan envoyées au Service Worker (Réaliste, probabiliste et non intrusif)
  scheduleBackgroundAlerts(game) {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    if (!game) return;

    // Règle 1 : Aucun spam. Au maximum 1 seule notification ciblée (parfois aucune) selon la réalité de l'antenne.
    const possibleAlerts = [];
    const rep = game.resources?.reputationScore || 0;

    // A. Alerte SAMU 15 : Uniquement si VPSP opérationnel réarmé + effectif suffisant disponible
    const hasAvailableVpsp = (game.vehicles || []).some(v => (v.type === 'VPSP' || v.name.includes('VPSP')) && v.status !== 'mission' && v.isRearmed !== false);
    const availablePse = (game.volunteers || []).filter(v => v.status !== 'mission' && ['PSE1', 'PSE2', 'CE', 'CD'].includes(v.rank)).length;

    if (hasAvailableVpsp && availablePse >= 3 && Math.random() < 0.45) {
      const delayMin = Math.floor(Math.random() * 45) + 20; // Entre 20 et 65 minutes
      possibleAlerts.push({
        delayMs: delayMin * 60 * 1000,
        title: '🚑 SAMU 15 : Appel Réflexe VPSP Requis',
        body: 'Le centre 15 demande un départ réflexe de votre ambulance pour un malaise sur la voie publique.',
        tag: 'offline-samu',
        data: { url: '/', category: 'samu' }
      });
    }

    // B. Devis DPS : Dépend de la réputation de l'antenne (si peu connue = très rare)
    const devisChance = rep < 15 ? 0.15 : (rep < 40 ? 0.35 : 0.60);
    if (Math.random() < devisChance) {
      const delayMin = Math.floor(Math.random() * 60) + 30; // Entre 30 et 90 minutes
      possibleAlerts.push({
        delayMs: delayMin * 60 * 1000,
        title: '📬 Sollicitation DPS : Nouveau Devis',
        body: 'Un organisateur de votre secteur a transmis un cahier des charges pour son événement associatif.',
        tag: 'offline-dps',
        data: { url: '/', category: 'dps' }
      });
    }

    // C. Candidature RH : Plus rare, dépend de la taille de l'antenne
    if (rep >= 20 && Math.random() < 0.30) {
      const delayMin = Math.floor(Math.random() * 90) + 45; // Entre 45 et 135 minutes
      possibleAlerts.push({
        delayMs: delayMin * 60 * 1000,
        title: '👥 Recrutement : Nouvelle Candidature Reçue',
        body: 'Un bénévole secouriste souhaite rejoindre votre équipe et attend une proposition d’entretien.',
        tag: 'offline-rh',
        data: { url: '/', category: 'rh' }
      });
    }

    // D. Alerte Météo Préfecture : Uniquement si vigilance Orange ou Rouge
    const weatherAlertLevel = (game.weather?.level || '').toLowerCase();
    if (['orange', 'rouge'].includes(weatherAlertLevel) && Math.random() < 0.5) {
      const delayMin = Math.floor(Math.random() * 30) + 15;
      possibleAlerts.push({
        delayMs: delayMin * 60 * 1000,
        title: `⚠️ Vigilance Préfecture (${weatherAlertLevel.toUpperCase()})`,
        body: 'Aggravation des conditions météorologiques : pré-alerte opérationnelle émise pour l’antenne.',
        tag: 'offline-meteo',
        data: { url: '/', category: 'meteo' }
      });
    }

    // E. Alliance : Uniquement si le joueur a une alliance active
    if (game.player?.allianceId && game.player.allianceId !== 'none' && Math.random() < 0.25) {
      const delayMin = Math.floor(Math.random() * 50) + 25;
      possibleAlerts.push({
        delayMs: delayMin * 60 * 1000,
        title: '🤝 Renfort Alliance : Appel Fédéral',
        body: 'Une antenne alliée sollicite un renfort inter-sections pour un dispositif d’envergure.',
        tag: 'offline-alliance',
        data: { url: '/', category: 'alliance' }
      });
    }

    if (possibleAlerts.length === 0) return;

    // On sélectionne UNE SEULE alerte crédible la plus pertinente (jamais de harcèlement)
    possibleAlerts.sort(() => Math.random() - 0.5);
    const selectedAlert = possibleAlerts[0];

    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_OFFLINE_ALERTS',
        alerts: [selectedAlert]
      });
    } catch (e) {
      console.warn('Erreur transmission alerte SW:', e);
    }
  },

  // Traitement et calcul de la simulation d'absence
  processOfflineProgression(game, elapsedSec) {
    if (!game) return;

    const report = {
      elapsedSec: elapsedSec,
      elapsedFormatted: this.formatDuration(elapsedSec),
      moneyEarned: 0,
      reputationEarned: 0,
      missionsFinished: [],
      volunteersRested: 0,
      newCandidaturesCount: 0,
      newDevisCount: 0,
      newRenfortsCount: 0,
      worksCompletedCount: 0,
      rearmedVehiclesCount: 0
    };

    const currentTime = Date.now();

    // 1. ACHÈVEMENT DES MISSIONS EN COURS
    if (game.missions && Array.isArray(game.missions)) {
      game.missions.forEach(m => {
        if (m.status === 'ongoing') {
          const started = m.startedAt || (currentTime - (elapsedSec * 1000));
          const durSec = m.durationSeconds || (m.durationHours ? Math.round(m.durationHours * 3600) : 1800);
          const endsAt = m.endsAt || (started + (durSec * 1000));

          // Si la mission s'est terminée pendant l'absence
          if (currentTime >= endsAt) {
            m.status = 'termine';
            m.progress = durSec;
            const rewardM = m.rewardMoney || 450;
            const rewardR = m.rewardReputation || 25;

            game.resources.money += rewardM;
            game.resources.reputationScore = Math.min(100, (game.resources.reputationScore || 0) + rewardR);

            report.moneyEarned += rewardM;
            report.reputationEarned += rewardR;
            report.missionsFinished.push({
              title: m.title,
              money: rewardM,
              reputation: rewardR
            });

            // Libération des secouristes
            (m.registeredVolunteers || []).forEach(vId => {
              const v = game.volunteers.find(vol => vol.id === vId);
              if (v) {
                v.status = 'disponible';
                v.experience = Math.min(100, (v.experience || 30) + 6);
              }
            });

            // Libération et marquage des véhicules à réarmer
            (m.assignedCrew?.vehicles || []).forEach(vObj => {
              const v = game.vehicles.find(veh => veh.id === vObj.id);
              if (v) {
                v.status = 'disponible';
                if (v.type === 'VPSP' || v.name.includes('VPSP')) {
                  v.isRearmed = false;
                }
              }
            });
          }
        }
      });
    }

    // 2. RÉCUPÉRATION PHYSIOLOGIQUE DES BÉNÉVOLES AU REPOS
    if (game.volunteers && Array.isArray(game.volunteers)) {
      // Gain d'énergie selon l'absence : ~10% par tranche de 20 min d'absence
      const energyGain = Math.min(80, Math.floor(elapsedSec / 1200) * 10 + 5);
      const stressRelief = Math.min(60, Math.floor(elapsedSec / 1200) * 15 + 10);

      game.volunteers.forEach(v => {
        if (v.status !== 'mission') {
          const oldEnergy = v.energy || 80;
          v.energy = Math.min(100, oldEnergy + energyGain);
          v.stress = Math.max(5, (v.stress || 20) - stressRelief);
          if (v.energy > oldEnergy) report.volunteersRested++;
        }
      });
    }

    // 3. TÂCHES LOGISTIQUES DE RÉARMEMENT EN COURS
    if (game.logisticTasks && Array.isArray(game.logisticTasks)) {
      game.logisticTasks = game.logisticTasks.filter(task => {
        const elapsed = Math.floor((currentTime - task.startTime) / 1000);
        if (elapsed >= task.durationSeconds) {
          const veh = game.vehicles.find(v => v.id === task.vehicleId);
          if (veh) veh.isRearmed = true;
          const vol = game.volunteers.find(v => v.id === task.volunteerId);
          if (vol) vol.status = 'disponible';
          report.rearmedVehiclesCount++;
          return false;
        }
        return true;
      });
    }

    // 4. CHANTIERS DE TRAVAUX DANS LES LOCAUX
    const st = game.stations[0];
    if (st && st.premises && st.premises.ongoingWorks && Array.isArray(st.premises.ongoingWorks)) {
      st.premises.ongoingWorks = st.premises.ongoingWorks.filter(work => {
        const endWork = work.startTime + (work.durationMinutes * 60 * 1000);
        if (currentTime >= endWork) {
          st.premises.grid[work.tileIndex] = work.targetType;
          report.worksCompletedCount++;
          return false;
        }
        return true;
      });
    }

    // 5. NOUVELLES OPPORTUNITÉS REÇUES EN ABSENCE (Devis, Candidatures, Renforts)
    // - Devis DPS (si réputation > 10 et au moins 15 min d'absence)
    const maxNewDevis = Math.min(3, Math.floor(elapsedSec / 1500));
    for (let i = 0; i < maxNewDevis; i++) {
      if (typeof game.generateRandomDevis === 'function') {
        game.generateRandomDevis();
        report.newDevisCount++;
      }
    }

    // - Nouvelles candidatures spontanées (Uniquement si campagne de pub active ou haute notoriété, jamais en début de partie)
    const hasPubCampaign = !!(game.resources?.campaigns?.social || game.resources?.campaigns?.posters);
    const hasMinRep = (game.resources?.reputationScore || 0) >= 70;
    const currentCandCount = (game.candidatures || []).length;
    if (game.stations?.length > 0 && (hasPubCampaign || hasMinRep) && currentCandCount < 3) {
      const maxNewCand = Math.min(3 - currentCandCount, Math.floor(elapsedSec / 3600));
      for (let i = 0; i < maxNewCand; i++) {
        this.generateOfflineCandidature(game);
        report.newCandidaturesCount++;
      }
    }

    // - Appel à renfort d'Alliance (si absent plus de 20 min)
    if (elapsedSec >= 1200 && game.renforts && Math.random() < 0.7) {
      const allStations = ['Antenne Paris 15', 'Antenne Lyon Centre', 'Antenne Marseille Littoral', 'Antenne Bordeaux Nord', 'Antenne Lille Flandres'];
      const stName = allStations[Math.floor(Math.random() * allStations.length)];
      game.renforts.unshift({
        id: `renf-offline-${Date.now()}`,
        title: `Alerte Renfort Événementiel`,
        desc: `Demande de 1 ambulance VPSP émise pendant votre absence par ${stName}.`,
        targetStationName: stName,
        unitRequested: '1 VPSP ou équipage',
        indemnite: 220,
        status: 'pending'
      });
      report.newRenfortsCount++;
    }

    // Sauvegarde immédiate des résultats du calcul hors-ligne
    game.saveGame();
    game.updateStatsUI();
    game.renderMissions();

    // 6. Affichage du Rapport d'Astreinte si des événements notables sont survenus
    const hasNotableEvents = (
      report.missionsFinished.length > 0 ||
      report.newCandidaturesCount > 0 ||
      report.newDevisCount > 0 ||
      report.newRenfortsCount > 0 ||
      report.worksCompletedCount > 0 ||
      report.rearmedVehiclesCount > 0 ||
      elapsedSec >= 300 // Plus de 5 minutes d'absence
    );

    if (hasNotableEvents) {
      this.showOfflineReportModal(game, report);
    }
  },

  // Génération d'une candidature spontanée hors-ligne
  generateOfflineCandidature(game) {
    if (!game.candidatures) game.candidatures = [];
    const firstNames = ['Alexandre', 'Camille', 'Thomas', 'Léa', 'Lucas', 'Manon', 'Maxime', 'Chloé', 'Nicolas', 'Sarah'];
    const lastNames = ['Moreau', 'Fournier', 'Girard', 'Bonnet', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel'];
    const ranks = ['Secouriste', 'PSE1', 'PSE2', 'Stagiaire'];
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const rank = ranks[Math.floor(Math.random() * ranks.length)];

    const cand = {
      id: `cand-off-${Date.now()}-${Math.random()}`,
      name: name,
      gender: Math.random() > 0.5 ? 'H' : 'F',
      age: Math.floor(Math.random() * 25) + 18,
      rank: rank,
      skills: rank === 'PSE2' ? ['DSA', 'Radio', 'P.VPSP'] : (rank === 'PSE1' ? ['DSA', 'Radio'] : ['Premiers Secours']),
      motivation: Math.floor(Math.random() * 30) + 70,
      availability: 'Week-ends et soirées',
      status: 'pending',
      date: new Date().toLocaleDateString('fr-FR')
    };

    game.candidatures.unshift(cand);
  },

  // Formatage lisible du temps d'absence
  formatDuration(sec) {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${Math.max(1, mins)} minute${mins > 1 ? 's' : ''}`;
  },

  // Affichage de la modale récapitulative
  showOfflineReportModal(game, report) {
    let modal = document.getElementById('offline-report-modal');
    if (!modal) {
      this.createReportModalDOM();
      modal = document.getElementById('offline-report-modal');
    }

    const content = document.getElementById('offline-report-content');
    if (!content) return;

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();

    content.innerHTML = `
      <div class="space-y-4 text-left">
        <!-- Bandeau d'en-tête -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-pc-blue text-white shadow-xl relative overflow-hidden">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase flex items-center gap-2 text-pc-orange">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              ACTIVITÉ PENDANT VOTRE ABSENCE
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/15 text-white">
              ⏱️ ${report.elapsedFormatted}
            </span>
          </div>
          <h4 class="text-base sm:text-lg font-black mt-2 leading-tight">Votre Antenne est Restée Opérationnelle</h4>
          <p class="text-xs text-white/80 mt-1 leading-snug">
            Pendant votre absence, vos équipes d'astreinte ont continué leurs missions, les organisateurs ont sollicité vos moyens et vos bénévoles ont récupéré de l'énergie.
          </p>
        </div>

        <!-- 4 Tuiles Métriques -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div class="p-3 rounded-2xl glass-card-emerald border border-emerald-200">
            <div class="text-[10px] font-black uppercase text-emerald-700">Trésorerie Reçue</div>
            <div class="text-lg font-black text-emerald-800 mono-num">+${report.moneyEarned.toLocaleString('fr-FR')} €</div>
          </div>

          <div class="p-3 rounded-2xl glass-card-amber border border-amber-200">
            <div class="text-[10px] font-black uppercase text-amber-700">Réputation</div>
            <div class="text-lg font-black text-amber-800 mono-num">+${report.reputationEarned} pts</div>
          </div>

          <div class="p-3 rounded-2xl glass-card-blue border border-blue-200">
            <div class="text-[10px] font-black uppercase text-pc-blue">Missions Clôturées</div>
            <div class="text-lg font-black text-slate-800 mono-num">${report.missionsFinished.length}</div>
          </div>

          <div class="p-3 rounded-2xl glass-card border border-slate-200">
            <div class="text-[10px] font-black uppercase text-slate-500">Bénévoles Reposés</div>
            <div class="text-lg font-black text-indigo-700 mono-num">${report.volunteersRested}</div>
          </div>
        </div>

        <!-- Détail des événements survenus -->
        <div class="space-y-2">
          <h5 class="text-xs font-black uppercase text-slate-700 tracking-wider">Événements Clés Enregistrés :</h5>

          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            ${report.missionsFinished.map(m => `
              <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-emerald-600 font-black">✓</span>
                  <span class="font-bold text-slate-800">${m.title}</span>
                </div>
                <div class="text-[11px] font-black text-emerald-700">+${m.money} €</div>
              </div>
            `).join('')}

            ${report.newCandidaturesCount > 0 ? `
              <div class="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-indigo-600 font-black">👥</span>
                  <span class="font-bold text-slate-800">${report.newCandidaturesCount} nouvelle(s) candidature(s) spontanée(s) reçue(s)</span>
                </div>
                <button onclick="window.ProtecOfflineEngine.closeReportModal(); window.game.openModule('benevoles');" class="text-[10px] font-black text-indigo-700 hover:underline">
                  Examiner ➜
                </button>
              </div>
            ` : ''}

            ${report.newDevisCount > 0 ? `
              <div class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-amber-600 font-black">📬</span>
                  <span class="font-bold text-slate-800">${report.newDevisCount} nouvelle(s) demande(s) de devis DPS reçue(s)</span>
                </div>
                <button onclick="window.ProtecOfflineEngine.closeReportModal(); window.game.openModule('missions');" class="text-[10px] font-black text-amber-700 hover:underline">
                  Chiffrer ➜
                </button>
              </div>
            ` : ''}

            ${report.newRenfortsCount > 0 ? `
              <div class="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-pc-blue font-black">🤝</span>
                  <span class="font-bold text-slate-800">${report.newRenfortsCount} demande(s) de renfort reçue(s) de l’Alliance</span>
                </div>
                <button onclick="window.ProtecOfflineEngine.closeReportModal(); window.game.openModule('missions');" class="text-[10px] font-black text-pc-blue hover:underline">
                  Voir ➜
                </button>
              </div>
            ` : ''}

            ${report.worksCompletedCount > 0 ? `
              <div class="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-teal-600 font-black">🔨</span>
                  <span class="font-bold text-slate-800">${report.worksCompletedCount} aménagement(s) de locaux achevé(s) avec succès</span>
                </div>
                <button onclick="window.ProtecOfflineEngine.closeReportModal(); window.game.openModule('locaux');" class="text-[10px] font-black text-teal-700 hover:underline">
                  Visiter ➜
                </button>
              </div>
            ` : ''}

            ${report.rearmedVehiclesCount > 0 ? `
              <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-slate-600 font-black">🔧</span>
                  <span class="font-bold text-slate-800">${report.rearmedVehiclesCount} ambulance(s) réarmée(s) et désinfectée(s)</span>
                </div>
                <span class="text-[10px] font-black text-emerald-600">Opérationnel</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Bouton de confirmation -->
        <button onclick="window.ProtecOfflineEngine.closeReportModal()" class="w-full py-3 rounded-2xl bg-gradient-to-r from-pc-blue to-pc-orange hover:brightness-110 active:scale-95 text-white font-black text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer">
          <i data-lucide="shield-check" class="w-4 h-4"></i>
          <span>🚀 Reprendre le Commandement de l'Antenne</span>
        </button>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  },

  createReportModalDOM() {
    if (document.getElementById('offline-report-modal')) return;
    const div = document.createElement('div');
    div.id = 'offline-report-modal';
    div.className = 'hidden fixed inset-0 z-[70] items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in';
    div.innerHTML = `
      <div class="w-full max-w-lg rounded-3xl glass-panel-heavy border-2 border-pc-orange/60 p-5 sm:p-6 shadow-2xl relative text-left max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-pc-orange text-white flex items-center justify-center font-black shadow-md">
              📋
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Rapport d'Astreinte Hors-Ligne</h3>
              <p class="text-[11px] text-pc-blue font-bold">Évolution opérationnelle continue de l'antenne</p>
            </div>
          </div>
          <button onclick="window.ProtecOfflineEngine.closeReportModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div id="offline-report-content"></div>
      </div>
    `;
    document.body.appendChild(div);
  },

  closeReportModal() {
    const modal = document.getElementById('offline-report-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }
};
