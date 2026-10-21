/**
 * PROTEC LIVE - SYSTÈME AVANCÉ DE GESTION DES PÔLES D'ANTENNE & DÉLÉGATION DE TÂCHES
 * 
 * Règles doctrinales :
 * - Au démarrage, l'antenne ne possède aucun pôle par défaut. Le joueur a le choix de créer des
 *   pôles à partir de modèles clés en main ou entièrement personnalisés.
 * - Chaque pôle se voit confier des MISSIONS RÉELLES d'automatisation (RH, Logistique, Formations, Com, etc.).
 * - Les missions disposent de réglages précis (sévérité des recrutements, autonomie budgétaire, seuils d'usure...).
 * - Les automatisations ne fonctionnent QUE si au moins un bénévole est en poste dans le pôle.
 * - Les tâches non confiées à un pôle restent gérées à 100% manuellement par le joueur.
 */

window.ProtecPoles = {
  activeTab: 'poles', // 'poles' | 'all_tasks' | 'volunteers'
  expandedTaskId: null, // id de la tâche dont les réglages sont dépliés
  expandedPoleTasksModal: null, // id du pôle en cours d'ajout de tâches
  isCreatingCustom: false,
  isChoosingPreset: false,
  editingPoleId: null,
  _lastTickCheck: 0,

  // =========================================================================
  // 1. RÉPERTOIRE GÉNÉRAL DE TOUTES LES TÂCHES D'ANTENNE (MÊME HORS PÔLE)
  // =========================================================================
  TASKS_CATALOG: [
    // --- RESSOURCES HUMAINES & RECRUTEMENT ---
    {
      id: 'rh_candidatures',
      name: 'Gestion & Filtrage des Candidatures',
      category: 'rh',
      categoryLabel: 'Ressources Humaines',
      icon: 'user-plus',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      desc: 'Analyse et traitement automatique des candidatures spontanées reçues à l\'antenne.',
      defaultSettings: {
        severity: 'standard', // 'souple' | 'standard' | 'stricte'
        autoInterview: true,
        maxVolunteersTarget: 30
      }
    },
    {
      id: 'rh_habillement',
      name: 'Gestion du Paquetage & Habillement',
      category: 'rh',
      categoryLabel: 'Ressources Humaines',
      icon: 'shirt',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      desc: 'Dotation automatique des tenues d\'intervention (tenue F1, parka, polo) aux recrues et renouvellement.',
      defaultSettings: {
        autoEquipNew: true,
        maxMonthlyBudget: 250
      }
    },
    {
      id: 'rh_fidelisation',
      name: 'Suivi du Moral & Bien-Être des Bénévoles',
      category: 'rh',
      categoryLabel: 'Ressources Humaines',
      icon: 'smile',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      desc: 'Détection des signes de démotivation ou de fatigue et organisation d\'entretiens de remotivation.',
      defaultSettings: {
        triggerThreshold: 45, // Si motivation < 45%
        grantRestDays: true
      }
    },

    // --- LOGISTIQUE & FLOTTE ---
    {
      id: 'log_rearmement',
      name: 'Réarmement & Désinfection des Ambulances',
      category: 'logistique',
      categoryLabel: 'Logistique & Flotte',
      icon: 'truck',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      desc: 'Réapprovisionnement automatique des VPSP/VTU rentrant de mission (consommables, draps, pansements, O2).',
      defaultSettings: {
        autoRestockThreshold: 85, // Si consommables < 85%
        autoClean: true
      }
    },
    {
      id: 'log_achats',
      name: 'Approvisionnements & Commandes de Consommables',
      category: 'logistique',
      categoryLabel: 'Logistique & Flotte',
      icon: 'shopping-cart',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      desc: 'Passation automatique de commandes de lots de secours et d\'oxygène dès que la réserve baisse.',
      defaultSettings: {
        minStockThreshold: 4, // Déclencher si < 4 caisses
        maxBudgetPerOrder: 300 // Autonomie financière max par commande
      }
    },
    {
      id: 'log_maintenance',
      name: 'Maintenance & Contrôles Techniques du Parc Roulant',
      category: 'logistique',
      categoryLabel: 'Logistique & Flotte',
      icon: 'wrench',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
      desc: 'Envoi automatique des véhicules au garage avant que les pannes mécaniques ne bloquent les départs.',
      defaultSettings: {
        wearThreshold: 60, // Réparer si état mécanique < 60%
        autoInspection: true
      }
    },

    // --- FORMATION & COMPÉTENCES ---
    {
      id: 'form_recyclages',
      name: 'Gestion des Recyclages Annuels Obligatoires (FC PSE)',
      category: 'formation',
      categoryLabel: 'Formation',
      icon: 'refresh-cw',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Surveillance des dates d\'échéance et inscription automatique des secouristes en formation continue.',
      defaultSettings: {
        anticipationDays: 60, // Inscrire 60 jours avant échéance
        prioritizeUrgent: true
      }
    },
    {
      id: 'form_montee_competence',
      name: 'Montée en Compétences & Inscriptions PSE1 / PSE2',
      category: 'formation',
      categoryLabel: 'Formation',
      icon: 'graduation-cap',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Détection des bénévoles méritants et inscription automatique aux sessions qualifiantes.',
      defaultSettings: {
        targetQualifications: 'all', // 'all' | 'pse1' | 'pse2'
        minExpRequired: 40 // minimum 40 XP
      }
    },
    {
      id: 'form_sessions_publiques',
      name: 'Organisation des Formations Grand Public (PSC / SST)',
      category: 'formation',
      categoryLabel: 'Formation',
      icon: 'book-open',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Planification automatique de sessions payantes pour financer l\'antenne dès qu\'une salle et un formateur sont libres.',
      defaultSettings: {
        autoOpenSession: true,
        ticketPrice: 60 // Tarif par participant
      }
    },

    // --- COMMUNICATION & RAYONNEMENT ---
    {
      id: 'com_site_web',
      name: 'Maintien & Publication sur le Site Internet',
      category: 'communication',
      categoryLabel: 'Communication',
      icon: 'globe',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      desc: 'Rédaction et publication régulière d\'articles d\'actualité pour maintenir la fraîcheur du site web au-dessus de 80%.',
      defaultSettings: {
        targetFreshness: 80, // Maintenir fraîcheur >= 80%
        autoPostMissionDebriefs: true
      }
    },

    // --- OPÉRATIONS & DISPOSITIFS DE SECOURS ---
    {
      id: 'ops_devis',
      name: 'Filtrage & Traitement des Devis DPS en Ligne',
      category: 'operations',
      categoryLabel: 'Opérations',
      icon: 'file-text',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      desc: 'Analyse des demandes d\'organisateurs d\'événements et acceptation automatique selon rentabilité.',
      defaultSettings: {
        minRevenueThreshold: 300, // Refuser devis < 300 €
        checkVolunteerAvailability: true
      }
    }
  ],

  // =========================================================================
  // 2. MODÈLES DE PÔLES CLÉS EN MAIN (PRÉSETS)
  // =========================================================================
  PRESET_TEMPLATES: [
    {
      id: 'preset_logistique',
      name: 'Pôle Logistique & Flotte',
      icon: 'truck',
      color: 'teal',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
      desc: 'Gestion du matériel d\'urgence, entretien de la flotte VPSP/VTU, réassort pharmacie et dotation habillement.',
      includedTaskIds: ['log_rearmement', 'log_achats', 'log_maintenance', 'rh_habillement']
    },
    {
      id: 'preset_rh',
      name: 'Pôle Ressources Humaines & Recrutement',
      icon: 'users',
      color: 'indigo',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      desc: 'Filtrage des candidatures citoyennes, accueil des nouveaux bénévoles et suivi du moral de l\'équipe.',
      includedTaskIds: ['rh_candidatures', 'rh_fidelisation']
    },
    {
      id: 'preset_formation',
      name: 'Pôle Pédagogique & Formation',
      icon: 'graduation-cap',
      color: 'emerald',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      desc: 'Organisation des sessions grand public (PSC, SST), recyclages annuels obligatoires et montées en qualification PSE.',
      includedTaskIds: ['form_recyclages', 'form_montee_competence', 'form_sessions_publiques']
    },
    {
      id: 'preset_communication',
      name: 'Pôle Communication & Notoriété',
      icon: 'megaphone',
      color: 'purple',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
      desc: 'Animation et fraîcheur du site internet de l\'antenne, relations publiques et valorisation des missions.',
      includedTaskIds: ['com_site_web', 'ops_devis']
    }
  ],

  // =========================================================================
  // 3. INITIALISATION & INJECTION D'ÉTAT
  // =========================================================================
  injectState(game) {
    if (!game) return;

    // Règle : Au démarrage, aucun pôle n'est créé automatiquement !
    if (!Array.isArray(game.poles)) {
      game.poles = [];
    }

    // Assurer que chaque pôle possède sa structure de tâches et de réglages
    game.poles.forEach(pole => {
      if (!Array.isArray(pole.assignedTaskIds)) {
        pole.assignedTaskIds = [];
      }
      if (!pole.taskConfigs) {
        pole.taskConfigs = {};
      }
      if (!Array.isArray(pole.assignedVolunteerIds)) {
        pole.assignedVolunteerIds = [];
      }
      if (!Array.isArray(pole.actionLogs)) {
        pole.actionLogs = [];
      }

      // Initialiser les réglages par défaut pour chaque tâche confiée
      pole.assignedTaskIds.forEach(taskId => {
        const taskDef = this.TASKS_CATALOG.find(t => t.id === taskId);
        if (taskDef && !pole.taskConfigs[taskId]) {
          pole.taskConfigs[taskId] = { enabled: true, ...taskDef.defaultSettings };
        }
      });
    });
  },

  // Création d'un pôle à partir d'un modèle prédéfini
  createPoleFromPreset(game, presetId) {
    this.injectState(game);
    const preset = this.PRESET_TEMPLATES.find(p => p.id === presetId);
    if (!preset) return;

    const newPoleId = `pole_${preset.id.replace('preset_', '')}_${Date.now()}`;
    const taskConfigs = {};
    preset.includedTaskIds.forEach(tId => {
      const def = this.TASKS_CATALOG.find(t => t.id === tId);
      if (def) {
        taskConfigs[tId] = { enabled: true, ...def.defaultSettings };
      }
    });

    const newPole = {
      id: newPoleId,
      name: preset.name,
      icon: preset.icon,
      color: preset.color,
      desc: preset.desc,
      responsibleId: null,
      assignedVolunteerIds: [],
      assignedTaskIds: [...preset.includedTaskIds],
      taskConfigs: taskConfigs,
      actionLogs: [
        { time: Date.now(), text: `Création du ${preset.name} depuis le modèle officiel.` }
      ]
    };

    game.poles.push(newPole);
    game.saveGame();
    this.isChoosingPreset = false;
    game.showToast('Pôle Créé avec Succès !', `Le « ${preset.name} » a été constitué avec ${preset.includedTaskIds.length} missions confiées. Assignez-y des bénévoles pour démarrer les automatisations.`, 'green');
    this.renderModal(game);
  },

  // Création d'un pôle entièrement sur-mesure
  createCustomPole(game, name, icon, color, desc, selectedTaskIds) {
    this.injectState(game);
    if (!name || name.trim() === '') {
      game.showToast('Nom Requis', 'Veuillez saisir un nom pour ce pôle.', 'orange');
      return;
    }

    const newPoleId = `pole_custom_${Date.now()}`;
    const taskConfigs = {};
    (selectedTaskIds || []).forEach(tId => {
      const def = this.TASKS_CATALOG.find(t => t.id === tId);
      if (def) {
        taskConfigs[tId] = { enabled: true, ...def.defaultSettings };
      }
    });

    const newPole = {
      id: newPoleId,
      name: name.trim(),
      icon: icon || 'shield',
      color: color || 'blue',
      desc: desc || 'Pôle personnalisé d\'antenne.',
      responsibleId: null,
      assignedVolunteerIds: [],
      assignedTaskIds: [...(selectedTaskIds || [])],
      taskConfigs: taskConfigs,
      actionLogs: [
        { time: Date.now(), text: `Création du pôle personnalisé « ${name.trim()} ».` }
      ]
    };

    game.poles.push(newPole);
    game.saveGame();
    this.isCreatingCustom = false;
    game.showToast('Nouveau Pôle Opérationnel', `« ${newPole.name} » a été créé avec ${newPole.assignedTaskIds.length} mission(s) attribuée(s).`, 'green');
    this.renderModal(game);
  },

  // Suppression d'un pôle
  deletePole(game, poleId) {
    this.injectState(game);
    const pole = game.poles.find(p => p.id === poleId);
    if (!pole) return;

    if (!confirm(`Êtes-vous sûr de vouloir dissoudre le « ${pole.name} » ? Toutes ses tâches reviendront en gestion 100% manuelle.`)) {
      return;
    }

    // Libérer les bénévoles assignés
    (game.volunteers || []).forEach(v => {
      if (v.assignedPoleId === poleId) {
        v.assignedPoleId = null;
        v.poleRoleId = null;
        v.poleRoleTitle = null;
      }
    });

    game.poles = game.poles.filter(p => p.id !== poleId);
    game.saveGame();
    game.showToast('Pôle Dissous', `Le « ${pole.name} » a été supprimé. Ses missions sont repassées en gestion manuelle.`, 'blue');
    this.renderModal(game);
  },

  // Ajouter / retirer une tâche à un pôle
  toggleTaskInPole(game, poleId, taskId) {
    this.injectState(game);
    const pole = game.poles.find(p => p.id === poleId);
    if (!pole) return;

    const idx = pole.assignedTaskIds.indexOf(taskId);
    if (idx === -1) {
      // Confier la tâche
      pole.assignedTaskIds.push(taskId);
      const def = this.TASKS_CATALOG.find(t => t.id === taskId);
      if (def && !pole.taskConfigs[taskId]) {
        pole.taskConfigs[taskId] = { enabled: true, ...def.defaultSettings };
      }
      game.showToast('Mission Confiée', `La mission « ${def?.name || taskId} » a été déléguée au ${pole.name}.`, 'green');
    } else {
      // Retirer la tâche
      pole.assignedTaskIds.splice(idx, 1);
      game.showToast('Mission Retirée', `La mission est revenue en gestion manuelle.`, 'blue');
    }
    game.saveGame();
    this.renderModal(game);
  },

  // Bascule On/Off de l'automatisation d'une tâche au sein d'un pôle
  toggleTaskEnabled(game, poleId, taskId) {
    this.injectState(game);
    const pole = game.poles.find(p => p.id === poleId);
    if (!pole || !pole.taskConfigs[taskId]) return;

    pole.taskConfigs[taskId].enabled = !pole.taskConfigs[taskId].enabled;
    game.saveGame();
    this.renderModal(game);
  },

  // Mise à jour d'un paramètre spécifique d'une tâche
  updateTaskSetting(game, poleId, taskId, key, value) {
    this.injectState(game);
    const pole = game.poles.find(p => p.id === poleId);
    if (!pole || !pole.taskConfigs[taskId]) return;

    pole.taskConfigs[taskId][key] = value;
    game.saveGame();
    this.renderModal(game);
  },

  // Affectation d'un bénévole à un pôle (Responsable ou Équipier)
  assignVolunteerToPole(game, volunteerId, poleId, makeResponsible = false) {
    this.injectState(game);
    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    const pole = game.poles.find(p => p.id === poleId);
    if (!vol || !pole) return;

    // Retirer le bénévole de son ancien pôle s'il y en avait un
    if (vol.assignedPoleId && vol.assignedPoleId !== poleId) {
      const oldPole = game.poles.find(p => p.id === vol.assignedPoleId);
      if (oldPole) {
        oldPole.assignedVolunteerIds = oldPole.assignedVolunteerIds.filter(id => id !== vol.id);
        if (oldPole.responsibleId === vol.id) oldPole.responsibleId = null;
      }
    }

    vol.assignedPoleId = poleId;
    if (!pole.assignedVolunteerIds.includes(vol.id)) {
      pole.assignedVolunteerIds.push(vol.id);
    }

    if (makeResponsible) {
      pole.responsibleId = vol.id;
      vol.poleRoleTitle = `Responsable - ${pole.name}`;
    } else {
      if (pole.responsibleId === vol.id) pole.responsibleId = null;
      vol.poleRoleTitle = `Équipier - ${pole.name}`;
    }

    pole.actionLogs.unshift({
      time: Date.now(),
      text: `${vol.name} a rejoint le pôle en tant que ${vol.poleRoleTitle}.`
    });
    if (pole.actionLogs.length > 20) pole.actionLogs.pop();

    game.saveGame();
    game.showToast('Bénévole Affecté', `${vol.name} est désormais en poste dans le « ${pole.name} ».`, 'green');
    this.renderModal(game);
  },

  // Retirer un bénévole d'un pôle
  removeVolunteerFromPole(game, volunteerId) {
    this.injectState(game);
    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    if (!vol || !vol.assignedPoleId) return;

    const pole = game.poles.find(p => p.id === vol.assignedPoleId);
    if (pole) {
      pole.assignedVolunteerIds = pole.assignedVolunteerIds.filter(id => id !== vol.id);
      if (pole.responsibleId === vol.id) pole.responsibleId = null;
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `${vol.name} a quitté le pôle.`
      });
      if (pole.actionLogs.length > 20) pole.actionLogs.pop();
    }

    vol.assignedPoleId = null;
    vol.poleRoleId = null;
    vol.poleRoleTitle = null;

    game.saveGame();
    game.showToast('Bénévole Libéré', `${vol.name} est de retour en secouriste opérationnel standard.`, 'blue');
    this.renderModal(game);
  },

  // Obtenir les informations de rôle d'un bénévole pour les infobulles du jeu
  getVolunteerRoleInfo(volunteer) {
    if (!volunteer || !volunteer.assignedPoleId) return null;
    const game = window.game;
    if (!game || !Array.isArray(game.poles)) return null;
    const pole = game.poles.find(p => p.id === volunteer.assignedPoleId);
    if (!pole) return null;

    const isLeader = pole.responsibleId === volunteer.id;
    return {
      poleId: pole.id,
      poleName: pole.name,
      poleColor: pole.color || 'blue',
      roleTitle: isLeader ? `Responsable (${pole.name})` : `Équipier (${pole.name})`,
      isLeader: isLeader,
      badgeColor: isLeader ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-100 text-blue-900 border-blue-300'
    };
  },

  // =========================================================================
  // 4. MOTEUR D'EXÉCUTION RÉELLE DES AUTOMATISATIONS D'ANTENNE
  // =========================================================================
  processClockTick(game) {
    if (!game) return;
    const now = Date.now();

    // Fréquence d'exécution : toutes les 25 secondes réelles
    if (now - this._lastTickCheck < 25000) return;
    this._lastTickCheck = now;

    this.injectState(game);
    if (!game.poles || game.poles.length === 0) return;

    game.poles.forEach(pole => {
      // RÈGLE ABSOLUE : Le pôle n'agit QUE s'il a au moins un bénévole en poste !
      const assignedCount = (pole.assignedVolunteerIds || []).length;
      if (assignedCount === 0 && !pole.responsibleId) return; // Pôle inactif sans bénévoles

      // Calcul du coefficient d'efficacité selon l'expérience et la motivation des bénévoles du pôle
      const vols = (game.volunteers || []).filter(v => (pole.assignedVolunteerIds || []).includes(v.id) || pole.responsibleId === v.id);
      const avgMotivation = vols.reduce((acc, v) => acc + (v.motivation || 75), 0) / Math.max(1, vols.length);

      // Exécuter chaque tâche active du pôle
      (pole.assignedTaskIds || []).forEach(taskId => {
        const config = pole.taskConfigs[taskId];
        if (!config || !config.enabled) return;

        // --- 1. GESTION DES CANDIDATURES ---
        if (taskId === 'rh_candidatures') {
          this.executeTaskCandidatures(game, pole, config, vols);
        }
        // --- 2. GESTION DE L'HABILLEMENT ---
        else if (taskId === 'rh_habillement') {
          this.executeTaskHabillement(game, pole, config, vols);
        }
        // --- 3. SUIVI DU MORAL & BIEN-ÊTRE ---
        else if (taskId === 'rh_fidelisation') {
          this.executeTaskFidelisation(game, pole, config, vols);
        }
        // --- 4. RÉARMEMENT DES AMBULANCES ---
        else if (taskId === 'log_rearmement') {
          this.executeTaskRearmement(game, pole, config, vols);
        }
        // --- 5. ACHATS & APPROVISIONNEMENTS ---
        else if (taskId === 'log_achats') {
          this.executeTaskAchats(game, pole, config, vols);
        }
        // --- 6. MAINTENANCE PARC ROULANT ---
        else if (taskId === 'log_maintenance') {
          this.executeTaskMaintenance(game, pole, config, vols);
        }
        // --- 7. RECYCLAGES FC PSE ---
        else if (taskId === 'form_recyclages') {
          this.executeTaskRecyclages(game, pole, config, vols);
        }
        // --- 8. MONTÉE EN COMPÉTENCES PSE ---
        else if (taskId === 'form_montee_competence') {
          this.executeTaskMonteeCompetence(game, pole, config, vols);
        }
        // --- 9. SESSIONS PUBLIQUES PSC1 ---
        else if (taskId === 'form_sessions_publiques') {
          this.executeTaskSessionsPubliques(game, pole, config, vols);
        }
        // --- 10. SITE WEB D'ANTENNE ---
        else if (taskId === 'com_site_web') {
          this.executeTaskSiteWeb(game, pole, config, vols);
        }
        // --- 11. DEVIS DPS ---
        else if (taskId === 'ops_devis') {
          this.executeTaskDevis(game, pole, config, vols);
        }
      });
    });
  },

  // 4.1 Traitement automatique des candidatures
  executeTaskCandidatures(game, pole, config, vols) {
    if (!Array.isArray(game.candidatures) || game.candidatures.length === 0) return;
    const pending = game.candidatures.filter(c => c.status === 'pending');
    if (pending.length === 0) return;

    const cand = pending[0];
    const totalVols = (game.volunteers || []).length;
    const maxTarget = config.maxVolunteersTarget || 30;

    // Si le quota max est dépassé, refus automatique
    if (totalVols >= maxTarget) {
      cand.status = 'rejected';
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Candidature de ${cand.name} refusée automatiquement (Effectif maximum atteint : ${totalVols}/${maxTarget}).`
      });
      game.saveGame();
      return;
    }

    // Filtrage selon la sévérité réglée par le joueur
    let accept = false;
    const sev = config.severity || 'standard';

    if (sev === 'souple') {
      accept = (cand.motivationScore || 50) >= 40;
    } else if (sev === 'standard') {
      accept = (cand.motivationScore || 50) >= 55 && (cand.hasPermis || cand.hasPSC1 || cand.hasPSE1);
    } else if (sev === 'stricte') {
      accept = (cand.motivationScore || 50) >= 70 && (cand.hasPSE1 || cand.hasPSE2 || cand.isFormateur);
    }

    if (accept) {
      // Intégrer automatiquement le candidat
      if (typeof game.hireCandidate === 'function') {
        game.hireCandidate(cand.id);
      } else {
        cand.status = 'accepted';
      }
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Candidature de ${cand.name} validée automatiquement (Filtre: ${sev}).`
      });
      game.showToast('Recrutement Automatique', `Le ${pole.name} a accepté la candidature de ${cand.name} selon vos critères (${sev}).`, 'indigo');
    } else {
      cand.status = 'rejected';
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Candidature de ${cand.name} rejetée (Critères de sélection ${sev} non atteints).`
      });
    }
    game.saveGame();
  },

  // 4.2 Dotation automatique de l'habillement
  executeTaskHabillement(game, pole, config, vols) {
    if (!config.autoEquipNew) return;
    const unequipped = (game.volunteers || []).filter(v => !v.hasUniform);
    if (unequipped.length === 0) return;

    const target = unequipped[0];
    const cost = 45; // Coût paquetage
    if (game.resources && game.resources.money >= cost) {
      game.resources.money -= cost;
      target.hasUniform = true;
      target.motivation = Math.min(100, (target.motivation || 75) + 8);
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Dotation du paquetage complet pour ${target.name} (-45 €).`
      });
      game.saveGame();
    }
  },

  // 4.3 Suivi du moral et remotivation
  executeTaskFidelisation(game, pole, config, vols) {
    const threshold = config.triggerThreshold || 45;
    const demotivated = (game.volunteers || []).filter(v => (v.motivation || 100) < threshold && v.status === 'dispo');
    if (demotivated.length === 0) return;

    const target = demotivated[0];
    target.motivation = Math.min(100, (target.motivation || 30) + 20);
    target.energy = Math.min(100, (target.energy || 50) + 15);
    pole.actionLogs.unshift({
      time: Date.now(),
      text: `Entretien d'écoute avec ${target.name} : moral rehaussé à ${target.motivation}%.`
    });
    game.saveGame();
  },

  // 4.4 Réarmement et désinfection des ambulances via des Missions Logistique
  executeTaskRearmement(game, pole, config, vols) {
    if (!Array.isArray(game.vehicles)) return;
    const threshold = config.autoRestockThreshold || 85;
    const toRestock = game.vehicles.filter(v => {
      const isAtBase = v.status === 'dispo' || v.status === 'base' || v.status === 'a_rearme' || !v.status;
      const armLevel = v.armementLevel !== undefined ? v.armementLevel : (v.consumablesPercent !== undefined ? v.consumablesPercent : 100);
      return isAtBase && (armLevel < threshold || v.needsRearming || v.a_rearme || v.isRearmed === false);
    });

    if (toRestock.length === 0) return;
    const veh = toRestock[0];

    // Création d'une vraie mission logistique d'atelier au planning
    if (typeof game.createRearmamentLogisticsMission === 'function') {
      const mission = game.createRearmamentLogisticsMission(veh.id, true, pole);
      if (mission) {
        pole.actionLogs.unshift({
          time: Date.now(),
          text: `Planification de l'atelier logistique de réarmement pour ${veh.name || veh.type}.`
        });
        game.saveGame();
      }
    } else {
      veh.armementLevel = 100;
      veh.consumablesPercent = 100;
      veh.needsRearming = false;
      veh.isRearmed = true;
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Réarmement complet et désinfection de ${veh.name || veh.type}.`
      });
      game.saveGame();
      game.showToast('🔧 Réarmement Flotte', `Le ${pole.name} a réarmé et désinfecté l'ambulance ${veh.name || veh.type}.`, 'teal');
    }
  },

  // 4.5 Approvisionnements & commandes de consommables
  executeTaskAchats(game, pole, config, vols) {
    const minThreshold = config.minStockThreshold || 4;
    const maxBudget = config.maxBudgetPerOrder || 300;
    const st = (game.stations && game.stations[0]) || null;
    if (!st || !game.resources) return;

    st.stock = st.stock || {};
    const caisses = st.stock.caisse_rearmement || 0;
    if (caisses < minThreshold && game.resources.money >= 120 && maxBudget >= 120) {
      game.resources.money -= 120;
      st.stock.caisse_rearmement = (st.stock.caisse_rearmement || 0) + 5;
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Commande d'urgence de 5 caisses de réarmement (-120 €).`
      });
      game.saveGame();
      game.showToast('📦 Commande Logistique', `Le ${pole.name} a commandé 5 caisses de réassort pour éviter la rupture (-120 €).`, 'teal');
    }
  },

  // 4.6 Maintenance parc roulant au garage
  executeTaskMaintenance(game, pole, config, vols) {
    if (!Array.isArray(game.vehicles) || !game.resources) return;
    const wearLimit = config.wearThreshold || 60;
    const damaged = game.vehicles.filter(v => (v.status === 'dispo' || !v.status) && (v.conditionPercent !== undefined && v.conditionPercent < wearLimit));
    if (damaged.length === 0) return;

    const target = damaged[0];
    const repairCost = Math.min(350, Math.floor((100 - (target.conditionPercent || 50)) * 6));
    if (game.resources.money >= repairCost) {
      game.resources.money -= repairCost;
      target.conditionPercent = 100;
      target.status = 'garage';
      setTimeout(() => { target.status = 'dispo'; }, 20000); // 20s au garage
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Envoi de ${target.name} en révision mécanique complète (-${repairCost} €).`
      });
      game.saveGame();
      game.showToast('🛠️ Entretien Mécanique', `Le ${pole.name} a envoyé ${target.name} au garage (-${repairCost} €).`, 'teal');
    }
  },

  // 4.7 Recyclages annuels obligatoires
  executeTaskRecyclages(game, pole, config, vols) {
    if (!Array.isArray(game.volunteers) || !Array.isArray(game.sessionsFormation)) return;
    const candidates = game.volunteers.filter(v => v.status === 'dispo' && (v.needsRecyclingFC_PSE || v.skills?.includes('pse1') || v.skills?.includes('pse2')));
    if (candidates.length === 0) return;

    // Inscrire sur une session ouverte de FC PSE
    const session = game.sessionsFormation.find(s => s.courseId === 'FC_PSE' && !s.isCompleted && (s.registeredCandidates || []).length < (s.totalSeats || 8));
    if (session) {
      const vol = candidates.find(c => !(session.registeredCandidates || []).includes(c.id));
      if (vol) {
        session.registeredCandidates = session.registeredCandidates || [];
        session.registeredCandidates.push(vol.id);
        vol.needsRecyclingFC_PSE = false;
        pole.actionLogs.unshift({
          time: Date.now(),
          text: `Inscription automatique de ${vol.name} au recyclage annuel FC PSE.`
        });
        game.saveGame();
        game.showToast('🎓 Recyclage Anticipé', `Le ${pole.name} a inscrit ${vol.name} au recyclage annuel FC PSE.`, 'emerald');
      }
    }
  },

  // 4.8 Montée en compétences PSE1/PSE2
  executeTaskMonteeCompetence(game, pole, config, vols) {
    if (!Array.isArray(game.volunteers) || !Array.isArray(game.sessionsFormation)) return;
    const minXp = config.minExpRequired || 40;
    const targetRank = config.targetQualifications || 'all';

    const eligible = game.volunteers.filter(v => {
      if (v.status !== 'dispo') return false;
      const skills = v.skills || [];
      if (targetRank === 'pse1' || targetRank === 'all') {
        if (!skills.includes('pse1') && (v.exp || 0) >= minXp) return true;
      }
      if (targetRank === 'pse2' || targetRank === 'all') {
        if (skills.includes('pse1') && !skills.includes('pse2') && (v.exp || 0) >= (minXp + 30)) return true;
      }
      return false;
    });

    if (eligible.length === 0) return;
    const vol = eligible[0];
    const neededCourse = !(vol.skills || []).includes('pse1') ? 'PSE1' : 'PSE2';

    const session = game.sessionsFormation.find(s => s.courseId === neededCourse && !s.isCompleted && (s.registeredCandidates || []).length < (s.totalSeats || 8));
    if (session && !(session.registeredCandidates || []).includes(vol.id)) {
      session.registeredCandidates = session.registeredCandidates || [];
      session.registeredCandidates.push(vol.id);
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Inscription de ${vol.name} à la session ${neededCourse} pour monter en grade.`
      });
      game.saveGame();
      game.showToast('🎓 Montée en Compétences', `Le ${pole.name} a inscrit ${vol.name} en formation ${neededCourse}.`, 'emerald');
    }
  },

  // 4.9 Sessions publiques PSC1 payantes
  executeTaskSessionsPubliques(game, pole, config, vols) {
    if (!config.autoOpenSession) return;
    if (!Array.isArray(game.sessionsFormation)) game.sessionsFormation = [];

    // Vérifier si une session publique est déjà en cours
    const activePublic = game.sessionsFormation.find(s => s.courseId === 'PSC' && !s.isCompleted);
    if (activePublic) return;

    // Vérifier si un bénévole du pôle est formateur
    const formateur = vols.find(v => (v.skills || []).includes('formateur') || v.isFormateur);
    if (!formateur) return;

    // Créer la session publique
    if (window.ProtecFormations && typeof window.ProtecFormations.createSession === 'function') {
      window.ProtecFormations.createSession(game, 'PSC', {
        locationType: 'antenne',
        internalAntenneSeats: 2,
        openToPublic: true,
        totalSeats: 10,
        roomNumber: 1
      });
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Ouverture d'une session publique PSC1 animée par ${formateur.name}.`
      });
      game.saveGame();
      game.showToast('💰 Session Publique Ouverte', `Le ${pole.name} a ouvert une session PSC1 grand public animée par ${formateur.name}.`, 'emerald');
    }
  },

  // 4.10 Maintien & fraîcheur du site web
  executeTaskSiteWeb(game, pole, config, vols) {
    if (!game.antenneWebsite || !game.antenneWebsite.published) return;
    const target = config.targetFreshness || 80;
    if ((game.antenneWebsite.freshness || 50) < target) {
      game.antenneWebsite.freshness = Math.min(100, (game.antenneWebsite.freshness || 50) + 12);
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Publication d'un nouvel article d'actualité : fraîcheur site rehaussée à ${game.antenneWebsite.freshness}%.`
      });
      game.saveGame();
    }
  },

  // 4.11 Traitement des devis DPS
  executeTaskDevis(game, pole, config, vols) {
    if (!Array.isArray(game.devis)) return;
    const minRev = config.minRevenueThreshold || 300;
    const pending = game.devis.filter(d => d.status === 'pending');
    if (pending.length === 0) return;

    const devis = pending[0];
    if ((devis.price || devis.revenue || 0) >= minRev) {
      if (typeof game.acceptDevis === 'function') {
        game.acceptDevis(devis.id);
      } else {
        devis.status = 'accepted';
      }
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Validation automatique du devis DPS « ${devis.title || 'Dispositif'} » (+ ${devis.price || devis.revenue} €).`
      });
      game.saveGame();
      game.showToast('📋 Devis DPS Validé', `Le ${pole.name} a accepté automatiquement un devis rentable de ${devis.price || devis.revenue} €.`, 'blue');
    } else {
      devis.status = 'rejected';
      pole.actionLogs.unshift({
        time: Date.now(),
        text: `Devis DPS sous-payé rejeté automatiquement (${devis.price || devis.revenue} € < ${minRev} €).`
      });
      game.saveGame();
    }
  },

  // =========================================================================
  // 5. INTERFACE UTILISATEUR MODERNE ET INTERACTIVE
  // =========================================================================
  renderModal(game) {
    this.injectState(game);
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (!body || !title) return;

    title.textContent = 'Organisation des Pôles & Délégation d’Antenne';
    subtitle.textContent = 'Créez vos pôles, confiez des missions réelles et paramétrez le niveau d’autonomie de vos équipes';
    icon.setAttribute('data-lucide', 'network');

    const polesCount = (game.poles || []).length;

    body.innerHTML = `
      <div class="space-y-5">

        <!-- Barre de navigation supérieure par onglets -->
        <div class="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
          <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button onclick="window.ProtecPoles.activeTab = 'poles'; window.ProtecPoles.renderModal(window.game);" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.activeTab === 'poles' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="building-2" class="w-3.5 h-3.5"></i>
              <span>🏢 Mes Pôles (${polesCount})</span>
            </button>
            <button onclick="window.ProtecPoles.activeTab = 'all_tasks'; window.ProtecPoles.renderModal(window.game);" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.activeTab === 'all_tasks' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
              <span>📋 Répertoire Général des Tâches (${this.TASKS_CATALOG.length})</span>
            </button>
            <button onclick="window.ProtecPoles.activeTab = 'volunteers'; window.ProtecPoles.renderModal(window.game);" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.activeTab === 'volunteers' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="users" class="w-3.5 h-3.5"></i>
              <span>👥 Affectations des Bénévoles</span>
            </button>
          </div>

          <!-- Bouton Nouveau Pôle -->
          <div class="flex items-center gap-2">
            <button onclick="window.ProtecPoles.isChoosingPreset = true; window.ProtecPoles.isCreatingCustom = false; window.ProtecPoles.renderModal(window.game);" class="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-indigo-600 text-white shadow-md hover:brightness-110 transition flex items-center gap-1.5">
              <i data-lucide="plus-circle" class="w-4 h-4"></i>
              <span>+ Nouveau Pôle</span>
            </button>
          </div>
        </div>

        <!-- MODALE 1 : CHOISIR UN MODÈLE PRÉDÉFINI -->
        ${this.isChoosingPreset ? this.renderPresetSelectionModal(game) : ''}

        <!-- MODALE 2 : CRÉER UN PÔLE SUR-MESURE -->
        ${this.isCreatingCustom ? this.renderCustomCreationModal(game) : ''}

        <!-- MODALE 3 : AJOUTER DES TÂCHES À UN PÔLE -->
        ${this.expandedPoleTasksModal ? this.renderAddTasksToPoleModal(game, this.expandedPoleTasksModal) : ''}

        <!-- VUE 1 : MES PÔLES -->
        ${this.activeTab === 'poles' ? this.renderPolesTab(game) : ''}

        <!-- VUE 2 : RÉPERTOIRE GÉNÉRAL DES TÂCHES -->
        ${this.activeTab === 'all_tasks' ? this.renderAllTasksTab(game) : ''}

        <!-- VUE 3 : AFFECTATION DES BÉNÉVOLES -->
        ${this.activeTab === 'volunteers' ? this.renderVolunteersTab(game) : ''}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // 5.1 Rendu de l'onglet principal : Cartes des Pôles
  renderPolesTab(game) {
    if (!game.poles || game.poles.length === 0) {
      return `
        <div class="p-8 rounded-3xl bg-gradient-to-b from-slate-50 to-indigo-50/40 border-2 border-dashed border-indigo-200 text-center space-y-4 max-w-2xl mx-auto my-6">
          <div class="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl mx-auto shadow-inner">
            🏢
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-black text-slate-900">Aucun Pôle Créé pour le Moment</h3>
            <p class="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
              Votre antenne fonctionne actuellement en <strong>gestion 100% manuelle</strong>. Toutes les tâches (candidatures, réarmement, formations, site internet) vous incombent.
            </p>
          </div>
          <div class="p-4 rounded-2xl bg-white border border-indigo-100 text-left text-xs space-y-2 text-slate-700">
            <span class="font-extrabold text-indigo-900 block flex items-center gap-1.5">
              <span>💡</span> Pourquoi structurer votre antenne en pôles ?
            </span>
            <ul class="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li><strong>Déléguez les corvées répétitives</strong> à vos bénévoles qualifiés.</li>
              <li><strong>Réglez précisément leur autonomie</strong> (budget max autorisé, sévérité de recrutement, seuils d'usure).</li>
              <li><strong>Créez vos propres équipes</strong> à partir des 4 modèles officiels ou entièrement sur-mesure !</li>
            </ul>
          </div>
          <div class="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button onclick="window.ProtecPoles.isChoosingPreset = true; window.ProtecPoles.renderModal(window.game);" class="px-5 py-2.5 rounded-2xl text-xs font-black bg-pc-blue hover:bg-blue-600 text-white shadow-md transition flex items-center gap-2">
              <i data-lucide="layers" class="w-4 h-4"></i>
              <span>Choisir parmi les 4 Modèles Clés en Main</span>
            </button>
            <button onclick="window.ProtecPoles.isCreatingCustom = true; window.ProtecPoles.renderModal(window.game);" class="px-5 py-2.5 rounded-2xl text-xs font-black bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-500"></i>
              <span>Créer un Pôle Sur-Mesure</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${game.poles.map(pole => this.renderPoleCard(game, pole)).join('')}
        </div>
      </div>
    `;
  },

  // 5.2 Rendu d'une carte de pôle
  renderPoleCard(game, pole) {
    const leader = (game.volunteers || []).find(v => v.id === pole.responsibleId);
    const assignedVols = (game.volunteers || []).filter(v => (pole.assignedVolunteerIds || []).includes(v.id));
    const totalStaff = assignedVols.length + (leader && !assignedVols.some(v => v.id === leader.id) ? 1 : 0);
    const isActive = totalStaff > 0;

    return `
      <div class="p-4 rounded-3xl glass-card space-y-4 border ${isActive ? 'border-slate-200/90 shadow-sm' : 'border-amber-300 bg-amber-50/20'} flex flex-col justify-between hover:shadow-md transition">
        <div class="space-y-3.5">
          <!-- Header Pôle -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-${pole.color || 'blue'}-100 text-${pole.color || 'blue'}-700 flex items-center justify-center font-bold text-lg shadow-inner">
                <i data-lucide="${pole.icon || 'shield'}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-xs font-black text-slate-900">${pole.name}</h4>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'}">
                    ${isActive ? `🟢 Actif (${totalStaff} bénévole${totalStaff > 1 ? 's' : ''})` : '⏸️ En pause (0 bénévole)'}
                  </span>
                  <span class="text-[10px] text-slate-500 font-semibold">${(pole.assignedTaskIds || []).length} mission(s)</span>
                </div>
              </div>
            </div>

            <!-- Bouton Dissoudre -->
            <button onclick="window.ProtecPoles.deletePole(window.game, '${pole.id}')" class="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Dissoudre ce pôle">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <p class="text-[11px] text-slate-600 leading-relaxed">${pole.desc || ''}</p>

          <!-- Statut de pause si 0 bénévole -->
          ${!isActive ? `
            <div class="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Aucune automatisation active. Assignez au moins 1 bénévole pour que ce pôle commence à agir.</span>
              </div>
              <button onclick="window.ProtecPoles.activeTab = 'volunteers'; window.ProtecPoles.renderModal(window.game);" class="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] flex-shrink-0">
                Affecter ➜
              </button>
            </div>
          ` : ''}

          <!-- Responsable & Équipe -->
          <div class="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Équipe du Pôle</span>
              <button onclick="window.ProtecPoles.activeTab = 'volunteers'; window.ProtecPoles.renderModal(window.game);" class="text-[10px] font-bold text-pc-blue hover:underline">
                Gérer les membres (${totalStaff}) ➜
              </button>
            </div>

            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-sm">👑</span>
                <div>
                  <span class="text-[10px] text-slate-400 block font-semibold leading-tight">Responsable</span>
                  <strong class="text-slate-800 text-[11px]">${leader ? leader.name : 'Aucun responsable nommé'}</strong>
                </div>
              </div>
              <span class="text-[10px] text-slate-500 font-bold">${assignedVols.length} équipier(s)</span>
            </div>
          </div>

          <!-- LISTE DES MISSIONS & TÂCHES DÉLÉGUÉES AU PÔLE -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Missions Confiées (${(pole.assignedTaskIds || []).length})</span>
              <button onclick="window.ProtecPoles.expandedPoleTasksModal = '${pole.id}'; window.ProtecPoles.renderModal(window.game);" class="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition flex items-center gap-1">
                <i data-lucide="plus" class="w-3 h-3"></i>
                <span>Ajouter Mission</span>
              </button>
            </div>

            <div class="space-y-2">
              ${(pole.assignedTaskIds || []).map(taskId => {
                const taskDef = this.TASKS_CATALOG.find(t => t.id === taskId);
                if (!taskDef) return '';
                const config = pole.taskConfigs[taskId] || { enabled: true };
                const isExpanded = this.expandedTaskId === `${pole.id}_${taskId}`;

                return `
                  <div class="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="p-1 rounded-lg bg-slate-100 text-slate-700 text-xs flex-shrink-0">
                          <i data-lucide="${taskDef.icon || 'check'}" class="w-3.5 h-3.5"></i>
                        </span>
                        <div class="min-w-0">
                          <h5 class="text-xs font-bold text-slate-900 truncate leading-snug">${taskDef.name}</h5>
                          <span class="text-[9.5px] text-slate-500 block truncate">${taskDef.desc}</span>
                        </div>
                      </div>

                      <div class="flex items-center gap-1.5 flex-shrink-0">
                        <!-- Bascule ON/OFF -->
                        <button onclick="window.ProtecPoles.toggleTaskEnabled(window.game, '${pole.id}', '${taskId}')" class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition ${config.enabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-500'}">
                          ${config.enabled ? 'AUTO ON' : 'PAUSE'}
                        </button>

                        <!-- Bouton Déplier Réglages -->
                        <button onclick="window.ProtecPoles.expandedTaskId = '${isExpanded ? '' : `${pole.id}_${taskId}`}'; window.ProtecPoles.renderModal(window.game);" class="p-1 rounded-lg text-slate-500 hover:text-pc-blue hover:bg-slate-100 transition" title="Configurer les réglages d'automatisation">
                          <i data-lucide="${isExpanded ? 'chevron-up' : 'settings-2'}" class="w-3.5 h-3.5"></i>
                        </button>
                      </div>
                    </div>

                    <!-- PANNEAU DÉPLIABLE DE CONFIGURATION DE LA TÂCHE -->
                    ${isExpanded ? this.renderTaskSettingsForm(pole, taskId, config) : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Journal d'activité récent -->
          ${(pole.actionLogs && pole.actionLogs.length > 0) ? `
            <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span class="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Dernière action automatisée :</span>
              <p class="text-[10px] text-slate-600 italic">
                « ${pole.actionLogs[0].text} »
              </p>
            </div>
          ` : ''}

        </div>
      </div>
    `;
  },

  // 5.3 Formulaire de réglages spécifiques pour chaque tâche
  renderTaskSettingsForm(pole, taskId, config) {
    let inputsHtml = '';

    if (taskId === 'rh_candidatures') {
      inputsHtml = `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">Sévérité des refus :</label>
            <select onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'severity', this.value)" class="w-full p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
              <option value="souple" ${config.severity === 'souple' ? 'selected' : ''}>Souple (Motivation > 40%)</option>
              <option value="standard" ${config.severity === 'standard' ? 'selected' : ''}>Standard (Permis ou PSC1)</option>
              <option value="stricte" ${config.severity === 'stricte' ? 'selected' : ''}>Stricte (PSE2 ou Formateur)</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">Quota effectif max :</label>
            <input type="number" value="${config.maxVolunteersTarget || 30}" min="5" max="100" onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'maxVolunteersTarget', parseInt(this.value, 10))" class="w-full p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none" />
          </div>
        </div>
      `;
    } else if (taskId === 'log_achats') {
      inputsHtml = `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">Seuil critique d'alerte :</label>
            <input type="number" value="${config.minStockThreshold || 4}" min="1" max="15" onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'minStockThreshold', parseInt(this.value, 10))" class="w-full p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none" />
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">Autonomie financière max :</label>
            <select onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'maxBudgetPerOrder', parseInt(this.value, 10))" class="w-full p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
              <option value="150" ${config.maxBudgetPerOrder === 150 ? 'selected' : ''}>Max 150 € par commande</option>
              <option value="300" ${config.maxBudgetPerOrder === 300 ? 'selected' : ''}>Max 300 € par commande</option>
              <option value="600" ${config.maxBudgetPerOrder === 600 ? 'selected' : ''}>Max 600 € par commande</option>
            </select>
          </div>
        </div>
      `;
    } else if (taskId === 'log_maintenance') {
      inputsHtml = `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">Seuil toléré avant révision :</label>
            <select onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'wearThreshold', parseInt(this.value, 10))" class="w-full p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
              <option value="75" ${config.wearThreshold === 75 ? 'selected' : ''}>Préventif (< 75% d'état)</option>
              <option value="60" ${config.wearThreshold === 60 ? 'selected' : ''}>Standard (< 60% d'état)</option>
              <option value="40" ${config.wearThreshold === 40 ? 'selected' : ''}>Tardif (< 40% d'état)</option>
            </select>
          </div>
          <div class="flex items-center gap-2 pt-3">
            <input type="checkbox" id="insp_${pole.id}" ${config.autoInspection ? 'checked' : ''} onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'autoInspection', this.checked)" class="rounded text-pc-blue" />
            <label for="insp_${pole.id}" class="text-[10px] font-bold text-slate-600">Contrôles techniques auto</label>
          </div>
        </div>
      `;
    } else if (taskId === 'form_montee_competence') {
      inputsHtml = `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">Qualification visée :</label>
            <select onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'targetQualifications', this.value)" class="w-full p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
              <option value="all" ${config.targetQualifications === 'all' ? 'selected' : ''}>Toutes (PSE1 et PSE2)</option>
              <option value="pse1" ${config.targetQualifications === 'pse1' ? 'selected' : ''}>PSE1 prioritaire</option>
              <option value="pse2" ${config.targetQualifications === 'pse2' ? 'selected' : ''}>PSE2 uniquement</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">XP minimum requis :</label>
            <input type="number" value="${config.minExpRequired || 40}" min="10" max="100" onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'minExpRequired', parseInt(this.value, 10))" class="w-full p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none" />
          </div>
        </div>
      `;
    } else if (taskId === 'ops_devis') {
      inputsHtml = `
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label class="text-[10px] font-bold text-slate-500 block mb-1">Seuil minimal de rentabilité :</label>
            <select onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'minRevenueThreshold', parseInt(this.value, 10))" class="w-full p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 outline-none">
              <option value="200" ${config.minRevenueThreshold === 200 ? 'selected' : ''}>Dès 200 €</option>
              <option value="350" ${config.minRevenueThreshold === 350 ? 'selected' : ''}>À partir de 350 €</option>
              <option value="500" ${config.minRevenueThreshold === 500 ? 'selected' : ''}>Grands DPS (> 500 €)</option>
            </select>
          </div>
          <div class="flex items-center gap-2 pt-3">
            <input type="checkbox" id="devis_vol_${pole.id}" ${config.checkVolunteerAvailability ? 'checked' : ''} onchange="window.ProtecPoles.updateTaskSetting(window.game, '${pole.id}', '${taskId}', 'checkVolunteerAvailability', this.checked)" class="rounded text-pc-blue" />
            <label for="devis_vol_${pole.id}" class="text-[10px] font-bold text-slate-600">Vérifier effectifs disponibles</label>
          </div>
        </div>
      `;
    } else {
      inputsHtml = `
        <p class="text-[11px] text-slate-500 italic">Cette tâche s'exécute automatiquement selon la présence et l'énergie des bénévoles assignés.</p>
      `;
    }

    return `
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 mt-2 animate-in fade-in">
        <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <span class="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide">⚙️ Réglages d'Automatisation de cette Mission</span>
          <button onclick="window.ProtecPoles.toggleTaskInPole(window.game, '${pole.id}', '${taskId}')" class="text-[10px] font-bold text-red-600 hover:underline">
            Retirer du pôle
          </button>
        </div>
        ${inputsHtml}
      </div>
    `;
  },

  // 5.4 VUE 2 : RÉPERTOIRE GÉNÉRAL DE TOUTES LES TÂCHES (DÉLÉGUÉES OU 100% MANUELLES)
  renderAllTasksTab(game) {
    const tasks = this.TASKS_CATALOG;
    const poles = game.poles || [];

    return `
      <div class="space-y-4">
        <!-- Bandeau informatif -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">📋</span>
            <div>
              <h4 class="font-black text-sm">Répertoire Central des Tâches d'Antenne</h4>
              <p class="text-white/70 text-[11px]">Visualisez quelles tâches sont confiées à des pôles et lesquelles restent sous votre responsabilité 100% manuelle.</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-[10px] font-black bg-white/10 border border-white/20">
            ${tasks.length} missions réelles
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${tasks.map(task => {
            const managingPole = poles.find(p => (p.assignedTaskIds || []).includes(task.id));
            const isDelegated = !!managingPole;

            return `
              <div class="p-3.5 rounded-2xl glass-card space-y-2.5 border ${isDelegated ? 'border-slate-200' : 'border-amber-300 bg-amber-50/20'} flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${task.badgeColor}">
                      ${task.categoryLabel}
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black ${isDelegated ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}">
                      ${isDelegated ? `Délégué : ${managingPole.name}` : '✋ 100% Manuel par Vous'}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 mt-2">
                    <span class="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                      <i data-lucide="${task.icon}" class="w-4 h-4"></i>
                    </span>
                    <div>
                      <h5 class="text-xs font-bold text-slate-900">${task.name}</h5>
                    </div>
                  </div>

                  <p class="text-[11px] text-slate-600 mt-1.5 leading-relaxed">${task.desc}</p>
                </div>

                <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-[10px] text-slate-400 font-semibold">
                    ${isDelegated ? 'Automatisé selon présence des bénévoles' : 'Aucune automatisation active'}
                  </span>

                  ${poles.length > 0 ? `
                    <select onchange="if (this.value) window.ProtecPoles.toggleTaskInPole(window.game, this.value, '${task.id}')" class="p-1 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-extrabold text-slate-700 outline-none cursor-pointer">
                      <option value="">${isDelegated ? 'Changer de Pôle...' : 'Confier à un Pôle...'}</option>
                      ${poles.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                  ` : `
                    <button onclick="window.ProtecPoles.isChoosingPreset = true; window.ProtecPoles.renderModal(window.game);" class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-indigo-600 text-white hover:bg-indigo-700 transition">
                      + Créer un Pôle
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // 5.5 VUE 3 : AFFECTATION DES BÉNÉVOLES
  renderVolunteersTab(game) {
    const vols = game.volunteers || [];
    const poles = game.poles || [];

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-black uppercase text-slate-900 tracking-wider">Effectif de l'Antenne & Postes Occupés</h4>
            <p class="text-[11px] text-slate-500">Assignez vos secouristes aux pôles pour activer les automatisations.</p>
          </div>
          <span class="text-xs font-bold text-slate-500">${vols.length} personnel(s)</span>
        </div>

        ${poles.length === 0 ? `
          <div class="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2 text-xs text-amber-900">
            <strong>Aucun pôle n'existe actuellement.</strong>
            <p class="text-[11px]">Créez d'abord un pôle pour pouvoir y affecter des bénévoles.</p>
            <button onclick="window.ProtecPoles.isChoosingPreset = true; window.ProtecPoles.renderModal(window.game);" class="px-4 py-2 rounded-xl bg-pc-blue text-white font-black">
              Créer un Pôle
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            ${vols.map(v => {
              const assignedPole = poles.find(p => p.id === v.assignedPoleId);
              const isResp = assignedPole && assignedPole.responsibleId === v.id;

              return `
                <div class="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      ${v.avatar || '👤'}
                    </span>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <strong class="text-xs font-black text-slate-900 truncate">${v.name}</strong>
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">${v.rank || 'Secouriste'}</span>
                      </div>
                      <span class="text-[10px] text-slate-400 block truncate">
                        ${assignedPole ? (isResp ? `👑 Responsable (${assignedPole.name})` : `Équipier (${assignedPole.name})`) : 'Secouriste opérationnel pur (hors pôle)'}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <select onchange="
                      const val = this.value;
                      if (!val) {
                        window.ProtecPoles.removeVolunteerFromPole(window.game, '${v.id}');
                      } else {
                        const [pId, resp] = val.split(':');
                        window.ProtecPoles.assignVolunteerToPole(window.game, '${v.id}', pId, resp === 'resp');
                      }
                    " class="p-1 px-2 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-800 outline-none cursor-pointer">
                      <option value="" ${!assignedPole ? 'selected' : ''}>Sans Pôle (Opérations)</option>
                      ${poles.map(p => `
                        <option value="${p.id}:member" ${assignedPole?.id === p.id && !isResp ? 'selected' : ''}>Équipier - ${p.name}</option>
                        <option value="${p.id}:resp" ${assignedPole?.id === p.id && isResp ? 'selected' : ''}>👑 Responsable - ${p.name}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  // 5.6 MODAL : CHOISIR UN MODÈLE DE PÔLE PRÉDÉFINI
  renderPresetSelectionModal(game) {
    return `
      <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-2xl border-2 border-indigo-400 space-y-4 animate-in fade-in">
        <div class="flex items-center justify-between border-b border-slate-700 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">📋</span>
            <h4 class="text-sm font-black text-amber-300">Choisir un Modèle Officiel de Pôle</h4>
          </div>
          <button onclick="window.ProtecPoles.isChoosingPreset = false; window.ProtecPoles.renderModal(window.game);" class="text-xs text-slate-400 hover:text-white transition">✕ Fermer</button>
        </div>

        <p class="text-xs text-slate-300">
          Chaque modèle est pré-configuré avec ses missions opérationnelles réelles. Vous pourrez ajuster ses paramètres à tout moment.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${this.PRESET_TEMPLATES.map(preset => {
            const alreadyExists = (game.poles || []).some(p => p.name === preset.name);

            return `
              <div class="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col justify-between space-y-3">
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${preset.badgeClass}">
                      Modèle Officiel
                    </span>
                    <span class="text-[10px] text-slate-400 font-semibold">${preset.includedTaskIds.length} missions</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="text-lg">🏢</span>
                    <h5 class="text-xs font-black text-white">${preset.name}</h5>
                  </div>

                  <p class="text-[11px] text-slate-300 leading-snug">${preset.desc}</p>

                  <div class="pt-1 space-y-1">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Missions incluses :</span>
                    <div class="flex flex-wrap gap-1">
                      ${preset.includedTaskIds.map(tId => {
                        const tDef = this.TASKS_CATALOG.find(t => t.id === tId);
                        return `<span class="px-1.5 py-0.5 rounded text-[9px] bg-slate-700 text-slate-200 font-medium">${tDef?.name || tId}</span>`;
                      }).join('')}
                    </div>
                  </div>
                </div>

                <button onclick="window.ProtecPoles.createPoleFromPreset(window.game, '${preset.id}')" ${alreadyExists ? 'disabled' : ''} class="w-full py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${alreadyExists ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer'}">
                  <i data-lucide="${alreadyExists ? 'check' : 'plus'}" class="w-3.5 h-3.5"></i>
                  <span>${alreadyExists ? 'Déjà créé dans votre antenne' : 'Constituer ce Pôle'}</span>
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span class="text-slate-400">Vous souhaitez un pôle totalement sur-mesure ?</span>
          <button onclick="window.ProtecPoles.isChoosingPreset = false; window.ProtecPoles.isCreatingCustom = true; window.ProtecPoles.renderModal(window.game);" class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition flex items-center gap-1">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
            <span>Créer un Pôle Sur-Mesure</span>
          </button>
        </div>
      </div>
    `;
  },

  // 5.7 MODAL : CRÉER UN PÔLE SUR-MESURE
  renderCustomCreationModal(game) {
    return `
      <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-2xl border-2 border-amber-400 space-y-4 animate-in fade-in">
        <div class="flex items-center justify-between border-b border-slate-700 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">✨</span>
            <h4 class="text-sm font-black text-amber-300">Créer un Pôle d'Antenne Sur-Mesure</h4>
          </div>
          <button onclick="window.ProtecPoles.isCreatingCustom = false; window.ProtecPoles.renderModal(window.game);" class="text-xs text-slate-400 hover:text-white transition">✕ Annuler</button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="space-y-1 sm:col-span-2">
            <label class="font-bold text-slate-300">Nom du Pôle :</label>
            <input id="custom-pole-name" type="text" placeholder="Ex: Pôle Partenariats & Événements" class="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:border-amber-400 outline-none" />
          </div>

          <div class="space-y-1">
            <label class="font-bold text-slate-300">Icône :</label>
            <select id="custom-pole-icon" class="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none">
              <option value="shield">Bouclier Secours</option>
              <option value="truck">Véhicules & Flotte</option>
              <option value="users">Équipe & Personnel</option>
              <option value="graduation-cap">Pédagogie & Formation</option>
              <option value="heart-handshake">Solidarité & Social</option>
              <option value="megaphone">Communication & Médias</option>
              <option value="radio">Radio & Opérations</option>
              <option value="sparkles">Étoiles / Prestige</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="font-bold text-slate-300">Couleur d'Identification :</label>
            <select id="custom-pole-color" class="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none">
              <option value="blue">Bleu Protection Civile</option>
              <option value="teal">Sarcelle Logistique</option>
              <option value="emerald">Émeraude Formation</option>
              <option value="indigo">Indigo RH & Recrutement</option>
              <option value="purple">Violet Communication</option>
              <option value="amber">Ambre Partenariats</option>
            </select>
          </div>

          <div class="space-y-1 sm:col-span-2">
            <label class="font-bold text-slate-300">Description du Rôle :</label>
            <textarea id="custom-pole-desc" rows="2" placeholder="Décrivez la vocation opérationnelle de ce pôle..." class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-400 outline-none"></textarea>
          </div>
        </div>

        <div class="space-y-2 pt-2 border-t border-slate-800">
          <span class="text-xs font-bold text-slate-300 block">Sélectionnez les missions à confier à ce pôle :</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            ${this.TASKS_CATALOG.map(task => `
              <label class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 flex items-start gap-2 cursor-pointer transition text-xs">
                <input type="checkbox" name="custom-task" value="${task.id}" class="mt-0.5 rounded text-amber-500" />
                <div>
                  <strong class="text-white block text-[11px]">${task.name}</strong>
                  <span class="text-[9.5px] text-slate-400 block">${task.desc}</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button onclick="window.ProtecPoles.isCreatingCustom = false; window.ProtecPoles.renderModal(window.game);" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition">Annuler</button>
          <button onclick="
            const name = document.getElementById('custom-pole-name').value;
            const icon = document.getElementById('custom-pole-icon').value;
            const color = document.getElementById('custom-pole-color').value;
            const desc = document.getElementById('custom-pole-desc').value;
            const checks = Array.from(document.querySelectorAll('input[name=\'custom-task\']:checked')).map(c => c.value);
            window.ProtecPoles.createCustomPole(window.game, name, icon, color, desc, checks);
          " class="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:brightness-110 transition flex items-center gap-1.5">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Créer le Pôle</span>
          </button>
        </div>
      </div>
    `;
  },

  // 5.8 MODAL : AJOUTER DES MISSIONS À UN PÔLE EXISTANT
  renderAddTasksToPoleModal(game, poleId) {
    const pole = (game.poles || []).find(p => p.id === poleId);
    if (!pole) return '';
    const available = this.TASKS_CATALOG.filter(t => !(pole.assignedTaskIds || []).includes(t.id));

    return `
      <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-2xl border-2 border-indigo-400 space-y-4 animate-in fade-in">
        <div class="flex items-center justify-between border-b border-slate-700 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">➕</span>
            <h4 class="text-sm font-black text-amber-300">Ajouter une Mission au « ${pole.name} »</h4>
          </div>
          <button onclick="window.ProtecPoles.expandedPoleTasksModal = null; window.ProtecPoles.renderModal(window.game);" class="text-xs text-slate-400 hover:text-white transition">✕ Fermer</button>
        </div>

        ${available.length === 0 ? `
          <p class="text-xs text-slate-400 italic">Toutes les missions du catalogue sont déjà confiées à ce pôle !</p>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            ${available.map(task => `
              <div class="p-3 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-between gap-3 text-xs">
                <div class="space-y-0.5 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase ${task.badgeColor}">${task.categoryLabel}</span>
                  </div>
                  <strong class="text-white block text-[11px] truncate">${task.name}</strong>
                  <span class="text-[9.5px] text-slate-400 block line-clamp-2">${task.desc}</span>
                </div>
                <button onclick="window.ProtecPoles.toggleTaskInPole(window.game, '${pole.id}', '${task.id}'); window.ProtecPoles.expandedPoleTasksModal = null;" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex-shrink-0">
                  + Confier
                </button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }
};
