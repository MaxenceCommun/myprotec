/**
 * PROTEC LIVE - GESTION DES PÔLES OPÉRATIONNELS D'ANTENNE & RÔLES DES BÉNÉVOLES
 * 
 * En plus des compétences des personnels (PSC1, PSE1, PSE2, CE, CD, Formateur, Permis...),
 * les personnels peuvent occuper des RÔLES spécifiques dans chacun des pôles.
 * 
 * POLITIQUES D'ACCÈS AUX RÔLES :
 * - Mode 'free' (Accès libre) : les bénévoles accèdent au poste dès leur demande spontanée.
 * - Mode 'validation' (Sous validation du joueur) : les demandes arrivent en attente et requièrent
 *   la validation explicite du joueur (boutons Accepter / Refuser).
 * - Le joueur peut également nommer directement ou retirer un rôle manuellement à tout moment.
 * 
 * AUTOMATISATIONS D'ANTENNE CONFÉRÉES PAR LES RÔLES :
 * 1. PÔLE FORMATION - Responsable Formation :
 *    Gère les formations des bénévoles de manière automatique (inscriptions aux sessions
 *    ouvertes pour monter en qualification PSE1/PSE2 et recyclages annuels FC PSE).
 * 2. PÔLE LOGISTIQUE - Bénévoles Logistique :
 *    Ce sont ces bénévoles qui gèrent les missions logistiques (réarmement automatique des
 *    ambulances VPSP et VTU rentrant de mission, réassort pharmacie et préparation des kits).
 * 3. PÔLE OPÉRATIONNEL - Responsable & Régulateur :
 *    Optimisation de la réactivité et des départs en alerte / DPS.
 * 4. PÔLE COMMUNICATION - Responsable & Accueil :
 *    Animation de la notoriété et accueil des nouvelles candidatures.
 * 5. PÔLE MÉCÉNAT & SOCIAL - Responsable & Référent Social :
 *    Développement des dons, subventions publiques et maraudes solidaires.
 */

window.ProtecPoles = {
  editingPoleId: null,
  activeSubTab: 'poles', // 'poles', 'demandes', 'roles_liste'
  _lastTickCheck: 0,
  _lastAutoFormationCheck: 0,
  _lastAutoLogisticsCheck: 0,
  _lastWishSpawnCheck: 0,

  // 1. PÔLES MAJEURS PAR DÉFAUT
  defaultPoles: [
    {
      id: 'formation',
      type: 'formation',
      name: 'Pôle Pédagogique & Formations',
      icon: 'graduation-cap',
      color: 'emerald',
      desc: 'Gestion des formations des bénévoles (PSE1, PSE2, recyclages FC PSE) et organisation des sessions grand public (PSC, SST).',
      missionLabel: 'Pédagogie, Recyclages & Montées en Compétence',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.2,
      xpMultiplierSalarie: 1.5,
      bonusDesc: 'Montée en compétence accélérée et automatisation des inscriptions aux formations'
    },
    {
      id: 'logistique',
      type: 'logistique',
      name: 'Pôle Matériel & Parc Roulant',
      icon: 'package-check',
      color: 'teal',
      desc: 'Entretien de la flotte VPSP/VTU/VL, gestion des stocks d’Oxygène, électrodes DAE et désinfections.',
      missionLabel: 'Maintenance, Pharmacie & Réarmement Flotte',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.0,
      xpMultiplierSalarie: 1.3,
      bonusDesc: '-20% d’usure mécanique et prise en charge des missions logistiques par les bénévoles'
    },
    {
      id: 'operationnel',
      type: 'operationnel',
      name: 'Pôle Opérationnel & Secours',
      icon: 'shield-alert',
      color: 'blue',
      desc: 'Gestion des dispositifs de secours (DPS), des gardes SAMU 15 et des renforts pompiers SDIS.',
      missionLabel: 'Interventions & Gestion des Dispositifs',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.0,
      xpMultiplierSalarie: 1.4,
      bonusDesc: '+10% Réussite des bilans et réactivité immédiate des équipages'
    },
    {
      id: 'communication',
      type: 'communication',
      name: 'Pôle Communication & Recrutement',
      icon: 'megaphone',
      color: 'indigo',
      desc: 'Relations publiques, réseaux sociaux, affichage mairie et intégration des nouveaux candidats.',
      missionLabel: 'Promotion, Recrutement & Notoriété',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.0,
      xpMultiplierSalarie: 1.5,
      bonusDesc: '+25% de candidatures qualifiées et hausse de réputation d’antenne'
    },
    {
      id: 'mecenat',
      type: 'mecenat',
      name: 'Pôle Mécénat & Action Solidaire',
      icon: 'heart-handshake',
      color: 'amber',
      desc: 'Recherche de donateurs, conventions d’aides d’État, collecte de denrées et distributions alimentaires.',
      missionLabel: 'Collectes de Dons, Mécénat & Aides d’État',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.1,
      xpMultiplierSalarie: 1.4,
      bonusDesc: '+15% de générosité publique et subventions départementales bonifiées'
    }
  ],

  // 2. CATALOGUE OFFICIEL DES RÔLES PAR PÔLE
  ROLES_CATALOG: [
    // --- Pôle Formation ---
    {
      id: 'resp_formation',
      poleId: 'formation',
      title: 'Responsable Formation',
      shortTitle: 'Resp. Formation',
      icon: 'graduation-cap',
      color: 'emerald',
      desc: 'Gère les formations des bénévoles de manière automatique (inscriptions, anticipation des recyclages annuels et montées en qualification).',
      powerDesc: 'Automatisation complète de l\'inscription des bénévoles aux formations (PSE1, PSE2, FC PSE)',
      prereqLabel: 'Formateur ou PSE2 confirmé',
      isLeader: true,
      maxHolders: 1,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      id: 'formateur',
      poleId: 'formation',
      title: 'Formateur d’Antenne',
      shortTitle: 'Formateur',
      icon: 'book-open',
      color: 'teal',
      desc: 'Dispense les formations internes pour l’équipe et anime les stages grand public (PSC, SST, GQS).',
      powerDesc: 'Réduit les frais d\'organisation des sessions de 40% et booste la qualité pédagogique',
      prereqLabel: 'Qualification Formateur (PIC F / PSC / PS)',
      isLeader: false,
      maxHolders: 3,
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300'
    },

    // --- Pôle Logistique ---
    {
      id: 'resp_logistique',
      poleId: 'logistique',
      title: 'Responsable Logistique & Parc',
      shortTitle: 'Resp. Logistique',
      icon: 'truck',
      color: 'teal',
      desc: 'Coordonne l’entretien de la flotte, la disponibilité des vecteurs d’urgence et les approvisionnements en pharmacie.',
      powerDesc: 'Planification optimisée des contrôles techniques et surveillance des stocks centraux',
      prereqLabel: 'Permis B & Rigueur logistique',
      isLeader: true,
      maxHolders: 1,
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300'
    },
    {
      id: 'benevole_logistique',
      poleId: 'logistique',
      title: 'Bénévole Logistique',
      shortTitle: 'Équipier Logistique',
      icon: 'package-check',
      color: 'sky',
      desc: 'Prend en charge les missions logistiques : réarmement automatique des ambulances VPSP et VTU rentrant de mission, réassort pharmacie et préparation des malles de crise.',
      powerDesc: 'Ce sont les bénévoles qui gèrent les missions de logistique et le réarmement de la flotte',
      prereqLabel: 'Tous bénévoles motivés',
      isLeader: false,
      maxHolders: 5,
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300'
    },

    // --- Pôle Opérationnel ---
    {
      id: 'resp_operationnel',
      poleId: 'operationnel',
      title: 'Responsable Opérationnel',
      shortTitle: 'Resp. Opérations',
      icon: 'shield-alert',
      color: 'blue',
      desc: 'Supervise l’organisation des dispositifs prévisionnels de secours (DPS), des gardes SAMU 15 et des renforts SDIS.',
      powerDesc: '+15% de rapidité de mobilisation sur les alertes et conformité des équipages',
      prereqLabel: 'Chef d’Équipe ou Chef de Dispositif',
      isLeader: true,
      maxHolders: 1,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
      id: 'regulateur_operationnel',
      poleId: 'operationnel',
      title: 'Régulateur Opérationnel',
      shortTitle: 'Régulateur Antenne',
      icon: 'radio',
      color: 'indigo',
      desc: 'Assure la veille radio, le suivi des départs d’équipages et la fluidité des communications opérationnelles.',
      powerDesc: 'Réduit les délais de ralliement des secouristes en astreinte de 25%',
      prereqLabel: 'PSE1 minimum',
      isLeader: false,
      maxHolders: 2,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    },

    // --- Pôle Communication & Recrutement ---
    {
      id: 'resp_communication',
      poleId: 'communication',
      title: 'Responsable Communication & Recrutement',
      shortTitle: 'Resp. Com & Recrutement',
      icon: 'megaphone',
      color: 'indigo',
      desc: 'Anime les réseaux sociaux, conçoit les affichages et dynamise la visibilité publique de l’antenne.',
      powerDesc: '+30% de candidatures spontanées de nouveaux secouristes',
      prereqLabel: 'Aisance relationnelle & digitale',
      isLeader: true,
      maxHolders: 1,
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300'
    },
    {
      id: 'charge_accueil',
      poleId: 'communication',
      title: 'Chargé d’Accueil & Intégration',
      shortTitle: 'Chargé d’Accueil',
      icon: 'user-check',
      color: 'purple',
      desc: 'Accueille les nouveaux candidats, assure le parrainage des premières semaines et renforce l’esprit d’équipe.',
      powerDesc: 'Boost de fidélisation et baisse du risque de démission des nouvelles recrues',
      prereqLabel: 'Sens de l’écoute & bienveillance',
      isLeader: false,
      maxHolders: 2,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
    },

    // --- Pôle Mécénat & Action Sociale ---
    {
      id: 'resp_mecenat',
      poleId: 'mecenat',
      title: 'Responsable Mécénat & Action Solidaire',
      shortTitle: 'Resp. Mécénat & Social',
      icon: 'heart-handshake',
      color: 'amber',
      desc: 'Recherche de donateurs, conventions d’aides d’État, subventions DDETS/CCAS et mécénats d’entreprises.',
      powerDesc: '+20% sur les subventions obtenues et dons financiers du public',
      prereqLabel: 'Sens du contact & rigueur administrative',
      isLeader: true,
      maxHolders: 1,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      id: 'referent_social',
      poleId: 'mecenat',
      title: 'Référent Maraudes & Solidarité',
      shortTitle: 'Référent Maraudes',
      icon: 'utensils',
      color: 'orange',
      desc: 'Organise les tournées de maraude, les distributions de vivres aux sans-abris et l’accueil d’urgence.',
      powerDesc: 'Optimise l’efficacité et la réputation citoyenne sur toutes les missions sociales',
      prereqLabel: 'Expérience du terrain social',
      isLeader: false,
      maxHolders: 3,
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300'
    }
  ],

  // 3. INITIALISATION & INJECTION DE L'ÉTAT DANS LE JEU
  injectState(game) {
    if (!game) return;

    // Mode d'accès aux rôles : 'validation' (par défaut, sous validation du joueur) ou 'free' (accès libre)
    if (!game.rolesAccessMode) {
      game.rolesAccessMode = 'validation';
    }

    // Liste des demandes de rôles formulées par les bénévoles
    if (!Array.isArray(game.roleRequests)) {
      game.roleRequests = [];
    }

    // Gestion automatique activée par défaut si un responsable formation est en poste
    if (game.autoFormationActive === undefined) {
      game.autoFormationActive = true;
    }
    if (game.autoLogisticsActive === undefined) {
      game.autoLogisticsActive = true;
    }

    // Initialisation ou mise à jour des pôles par défaut
    if (!game.poles || !Array.isArray(game.poles) || game.poles.length === 0) {
      game.poles = JSON.parse(JSON.stringify(this.defaultPoles));
      if (game.volunteers && game.volunteers.length > 0) {
        const opPole = game.poles.find(p => p.id === 'operationnel') || game.poles[0];
        game.volunteers.forEach(v => {
          if (!v.assignedPoleId) {
            v.assignedPoleId = opPole.id;
          }
          const targetPole = game.poles.find(p => p.id === v.assignedPoleId) || opPole;
          if (!targetPole.assignedVolunteerIds.includes(v.id)) {
            targetPole.assignedVolunteerIds.push(v.id);
          }
        });
      }
    } else {
      // S'assurer que le pôle Formation et les pôles essentiels existent
      this.defaultPoles.forEach(def => {
        const existing = game.poles.find(p => p.id === def.id || p.type === def.type);
        if (!existing) {
          game.poles.push(JSON.parse(JSON.stringify(def)));
        } else if (!existing.icon) {
          existing.icon = def.icon;
          existing.color = def.color;
        }
      });
    }

    // Synchronisation bidirectionnelle des rôles entre les bénévoles et les pôles
    this.syncAllVolunteerRoles(game);
  },

  // Synchronisation des rôles entre game.volunteers et game.poles
  syncAllVolunteerRoles(game) {
    if (!game || !Array.isArray(game.volunteers)) return;

    game.volunteers.forEach(v => {
      // Si le bénévole a un poleRoleId, vérifier qu'il correspond à un rôle valide
      if (v.poleRoleId) {
        const roleDef = this.ROLES_CATALOG.find(r => r.id === v.poleRoleId);
        if (roleDef) {
          v.poleRoleTitle = roleDef.title;
          v.assignedPoleId = roleDef.poleId;
          const pole = (game.poles || []).find(p => p.id === roleDef.poleId);
          if (pole) {
            if (!pole.assignedVolunteerIds.includes(v.id)) {
              pole.assignedVolunteerIds.push(v.id);
            }
            if (roleDef.isLeader && !pole.responsibleId) {
              pole.responsibleId = v.id;
            }
          }
        }
      }
    });

    // Inversement : si un pôle a un responsibleId, lui attribuer le rôle leader s'il ne l'a pas
    (game.poles || []).forEach(p => {
      if (p.responsibleId) {
        const leaderVol = game.volunteers.find(v => v.id === p.responsibleId);
        if (leaderVol && !leaderVol.poleRoleId) {
          const leaderRole = this.ROLES_CATALOG.find(r => r.poleId === p.id && r.isLeader);
          if (leaderRole) {
            leaderVol.poleRoleId = leaderRole.id;
            leaderVol.poleRoleTitle = leaderRole.title;
            leaderVol.assignedPoleId = p.id;
          }
        }
      }
    });
  },

  // Récupérer les informations de rôle d'un bénévole
  getVolunteerRoleInfo(volunteer) {
    if (!volunteer) return null;
    if (!volunteer.poleRoleId) return null;
    const roleDef = this.ROLES_CATALOG.find(r => r.id === volunteer.poleRoleId);
    if (!roleDef) return null;
    return {
      id: roleDef.id,
      title: roleDef.title,
      shortTitle: roleDef.shortTitle,
      poleId: roleDef.poleId,
      color: roleDef.color,
      badgeColor: roleDef.badgeColor,
      icon: roleDef.icon,
      isLeader: roleDef.isLeader,
      desc: roleDef.desc,
      powerDesc: roleDef.powerDesc
    };
  },

  // 4. GESTION DES POLITIQUES D'ACCÈS : LIBRE OU VALIDATION DU JOUEUR
  setRolesAccessMode(game, mode) {
    this.injectState(game);
    if (mode !== 'free' && mode !== 'validation') return;
    game.rolesAccessMode = mode;
    game.saveGame();
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    const modeLabel = mode === 'free' ? 'Accès Libre (Attribution Directe)' : 'Sous Validation du Joueur';
    game.showToast('Politique d’Accès Modifiée', `Les rôles d'antenne sont désormais configurés en mode : ${modeLabel}.`, 'blue');
    this.renderModal(game);
  },

  // Soumission d'une demande de rôle par un bénévole
  submitVolunteerRoleRequest(game, volunteerId, roleId, customMotivation = null) {
    this.injectState(game);
    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    const role = this.ROLES_CATALOG.find(r => r.id === roleId);
    const pole = (game.poles || []).find(p => p.id === role?.poleId);
    if (!vol || !role || !pole) return;

    // Si le bénévole a déjà ce rôle
    if (vol.poleRoleId === role.id) {
      game.showToast('Poste Déjà Occupé', `${vol.name} occupe déjà le rôle de « ${role.title} ».`, 'blue');
      return;
    }

    // Vérifier la limite de titulaires pour ce rôle
    const currentHolders = (game.volunteers || []).filter(v => v.poleRoleId === role.id && v.id !== vol.id);
    if (currentHolders.length >= (role.maxHolders || 1)) {
      game.showToast('Poste Complet', `Le rôle de « ${role.title} » est actuellement complet (${currentHolders.length}/${role.maxHolders}). Libérez une place pour postuler.`, 'orange');
      return;
    }

    // Motivation formulée par le bénévole selon le pôle ciblé
    const poleMotivations = {
      communication: [
        `« Après mes premières missions sur le terrain, je souhaite mettre mon aisance relationnelle et digitale au service du rayonnement de l'antenne et de l'accueil des nouvelles recrues. »`,
        `« Très motivé(e) pour valoriser nos actions sur les réseaux sociaux et dynamiser les candidatures de nouveaux bénévoles. »`,
        `« Maintenant bien intégré(e) au sein de l'équipe, j'aimerais m'investir pour faire connaître nos dispositifs au grand public et aux partenaires locaux. »`
      ],
      logistique: [
        `« J'ai à cœur de veiller au bon état de notre matériel et de nos véhicules. Je souhaite m'investir pour que nos ambulances et nos lots soient toujours prêts à partir. »`,
        `« Rigoureux(se) et bricoleur(se), je propose mon aide active pour la gestion de la pharmacie, le réarmement de la flotte et la logistique d'antenne. »`,
        `« Une intervention réussie commence par un matériel impeccable : je souhaite prendre en main le suivi du parc roulant et des consommables. »`
      ],
      formation: [
        `« Fort(e) de mon expérience en secours, j'aimerais transmettre les gestes qui sauvent et accompagner la montée en compétences de nos futurs secouristes. »`,
        `« Passionné(e) par la pédagogie, je souhaite m'investir dans l'animation de nos sessions internes (PSE) et grand public (PSC1). »`,
        `« Très motivé(e) pour former la relève et renforcer la qualité pédagogique de notre équipe d'antenne. »`
      ],
      operationnel: [
        `« Prêt(e) à prendre des responsabilités accrues dans la gestion des départs en alerte et le suivi radio des dispositifs de secours. »`,
        `« Très motivé(e) pour assurer la régulation et la coordination fluide de nos équipages sur le terrain. »`
      ]
    };
    const defaultMotivations = [
      `« Je souhaite m’investir activement au sein du ${pole.name} pour faire progresser notre antenne. »`,
      `« Mes compétences et ma disponibilité me permettent de prendre ces responsabilités avec sérieux. »`,
      `« Très motivé(e) pour encadrer nos missions et soutenir l'équipe dans ce domaine clé. »`
    ];
    const pool = poleMotivations[pole.type || pole.id] || defaultMotivations;
    const motivationText = customMotivation || pool[Math.floor(Math.random() * pool.length)];

    // Si le mode est ACCÈS LIBRE : attribution directe sans attendre
    if (game.rolesAccessMode === 'free') {
      this.assignRoleToVolunteer(game, volunteerId, roleId, true);
      return;
    }

    // Sinon, mode SOUS VALIDATION DU JOUEUR : enregistrement de la demande
    // Vérifier si une demande identique est déjà en attente
    const existingReq = (game.roleRequests || []).find(r => r.volunteerId === volunteerId && r.roleId === roleId && r.status === 'pending');
    if (existingReq) {
      game.showToast('Demande en Attente', `Une demande de ${vol.name} pour le poste de « ${role.title} » est déjà en cours d'examen.`, 'blue');
      return;
    }

    const newRequest = {
      id: `role_req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      volunteerId: vol.id,
      volunteerName: vol.name,
      volunteerRank: vol.rank || 'Secouriste',
      volunteerAvatar: vol.avatar || '🙋',
      roleId: role.id,
      roleTitle: role.title,
      poleId: pole.id,
      poleName: pole.name,
      motivation: motivationText,
      requestedAt: Date.now(),
      status: 'pending'
    };

    if (!Array.isArray(game.roleRequests)) game.roleRequests = [];
    game.roleRequests.unshift(newRequest);

    if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();
    game.saveGame();
    game.showToast('⭐ Demande de Rôle Reçue', `${vol.name} souhaite devenir « ${role.title} ». Validez ou déclinez sa candidature dans l'onglet Pôles.`, 'indigo');
    this.renderModal(game);
  },

  // Valider (Accepter) la demande d'un bénévole
  acceptRoleRequest(game, requestId) {
    this.injectState(game);
    const req = (game.roleRequests || []).find(r => r.id === requestId);
    if (!req) return;

    req.status = 'accepted';
    this.assignRoleToVolunteer(game, req.volunteerId, req.roleId, false);

    // Nettoyer les autres demandes en attente de ce même bénévole
    game.roleRequests = game.roleRequests.filter(r => r.id === requestId || !(r.volunteerId === req.volunteerId && r.status === 'pending'));

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.saveGame();
    game.showToast('✓ Candidature Validée !', `${req.volunteerName} est officiellement nommé(e) « ${req.roleTitle} ».`, 'green');
    this.renderModal(game);
  },

  // Refuser (Décliner) la demande d'un bénévole
  rejectRoleRequest(game, requestId) {
    this.injectState(game);
    const req = (game.roleRequests || []).find(r => r.id === requestId);
    if (!req) return;

    req.status = 'rejected';
    game.roleRequests = game.roleRequests.filter(r => r.id !== requestId);

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    game.showToast('Candidature Déclinée', `La demande de ${req.volunteerName} pour le poste de « ${req.roleTitle} » a été refusée.`, 'blue');
    this.renderModal(game);
  },

  // Attribution directe d'un rôle à un bénévole (par le joueur ou en accès libre)
  assignRoleToVolunteer(game, volunteerId, roleId, isDirectAccess = false) {
    this.injectState(game);
    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    const role = this.ROLES_CATALOG.find(r => r.id === roleId);
    if (!vol || !role) return;

    const pole = (game.poles || []).find(p => p.id === role.poleId);
    if (!pole) return;

    // Si le rôle est un rôle Leader (Responsable de pôle)
    if (role.isLeader) {
      // Retirer l'ancien responsable s'il y en avait un
      if (pole.responsibleId && pole.responsibleId !== vol.id) {
        const oldLeader = game.volunteers.find(v => v.id === pole.responsibleId);
        if (oldLeader && oldLeader.poleRoleId === role.id) {
          oldLeader.poleRoleId = null;
          oldLeader.poleRoleTitle = null;
        }
      }
      pole.responsibleId = vol.id;
    }

    // Assigner au bénévole
    vol.poleRoleId = role.id;
    vol.poleRoleTitle = role.title;
    vol.assignedPoleId = pole.id;

    // S'assurer qu'il est membre du pôle
    if (!pole.assignedVolunteerIds.includes(vol.id)) {
      pole.assignedVolunteerIds.push(vol.id);
    }

    // Gain de moral et boost d'énergie pour la prise de fonction
    vol.motivation = Math.min(100, (vol.motivation || 75) + 8);
    vol.energy = Math.min(100, (vol.energy || 80) + 5);

    if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();
    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.recordRoleAssigned === 'function') {
      window.ProtecAdvanced.recordRoleAssigned(game, vol, role);
    }
    game.saveGame();

    if (isDirectAccess) {
      game.showToast('🎓 Prise de Poste (Accès Libre)', `${vol.name} a rejoint le rôle de « ${role.title} » au ${pole.name}.`, 'green');
    } else {
      game.showToast('Rôle Attribué', `${vol.name} a été nommé(e) « ${role.title} ».`, 'green');
    }
    this.renderModal(game);
  },

  // Retirer un rôle à un bénévole
  removeRoleFromVolunteer(game, volunteerId) {
    this.injectState(game);
    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    if (!vol || !vol.poleRoleId) return;

    const oldRoleId = vol.poleRoleId;
    const oldRoleTitle = vol.poleRoleTitle || 'Rôle';
    const roleDef = this.ROLES_CATALOG.find(r => r.id === oldRoleId);

    if (roleDef && roleDef.isLeader) {
      const pole = (game.poles || []).find(p => p.id === roleDef.poleId);
      if (pole && pole.responsibleId === vol.id) {
        pole.responsibleId = null;
      }
    }

    vol.poleRoleId = null;
    vol.poleRoleTitle = null;

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    game.showToast('Rôle Libéré', `${vol.name} ne tient plus le rôle de « ${oldRoleTitle} ». Le poste est désormais vacant.`, 'blue');
    this.renderModal(game);
  },

  // Détermination stable de l'intérêt d'un bénévole pour un pôle (Quotas réels d'antenne)
  // RÈGLE : 3% Communication (avec maturité), 10% Logistique, 8% Formateurs, ~79% Opérationnel / Terrain pur
  getVolunteerPoleInterest(volunteer) {
    if (!volunteer) return 'operationnel';
    if (volunteer.poleInterest) return volunteer.poleInterest;

    // Hash pseudo-aléatoire stable basé sur l'identifiant pour ne pas changer d'avis à chaque tick
    let hash = 0;
    const str = String(volunteer.id || volunteer.name || '');
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const pct = Math.abs(hash) % 100; // 0 à 99

    let interest = 'operationnel';
    if (pct < 3) {
      interest = 'communication'; // 3% des effectifs
    } else if (pct < 13) {
      interest = 'logistique';    // 10% des effectifs (3 à 12)
    } else if (pct < 21) {
      interest = 'formation';     // 8% des effectifs (13 à 20)
    } else {
      interest = 'operationnel';  // ~79% des effectifs : secouristes de terrain, pas de souhait support
    }
    volunteer.poleInterest = interest;
    return interest;
  },

  // Vérifie si un bénévole a la maturité et les compétences pour formuler une demande pour un rôle
  isVolunteerReadyForPoleRequest(volunteer, role, game) {
    if (!volunteer || !role) return false;
    if (volunteer.isBurnout || volunteer.status === 'mission') return false;

    // 1. Pôle COMMUNICATION (3% des effectifs, et pas dès leur arrivée !)
    if (role.poleId === 'communication') {
      // Le bénévole ne doit PAS être un nouvel arrivant : il doit avoir découvert la vie d'antenne
      const missionsDone = volunteer.missionsCount || 0;
      const experience = volunteer.exp || 0;
      // Critère : au moins 5 missions de terrain OU au moins 75 XP
      if (missionsDone < 5 && experience < 75) {
        return false; // Trop récent dans l'antenne pour postuler en com
      }
      return true;
    }

    // 2. Pôle FORMATION (8% des effectifs - Formateurs d'antenne)
    if (role.poleId === 'formation') {
      // Pour être formateur d'antenne ou responsable formation : PSE2 ou formateur agréé ou expérience confirmée
      const isTrainerAlready = volunteer.isTrainer || (volunteer.skills && (volunteer.skills.includes('formateur') || volunteer.skills.includes('Formateur Agréé')));
      const isExperienced = volunteer.rank === 'PSE2' || ['CE', 'CP', 'CD'].includes(volunteer.rank) || (volunteer.missionsCount || 0) >= 4 || (volunteer.exp || 0) >= 60;
      if (!isTrainerAlready && !isExperienced) {
        return false; // Pas assez expérimenté pour former les autres
      }
      return true;
    }

    // 3. Pôle LOGISTIQUE (10% des effectifs)
    if (role.poleId === 'logistique') {
      // Doit avoir fait au moins 1 mission ou posséder le permis B ou être PSE1
      const hasPermis = Boolean(volunteer.permis_b || volunteer.hasDrivingLicense || (volunteer.skills && volunteer.skills.includes('permis_b')));
      const hasMinExp = (volunteer.missionsCount || 0) >= 1 || (volunteer.exp || 0) >= 20 || volunteer.rank !== 'Stagiaire';
      return hasPermis || hasMinExp;
    }

    // 4. Rôles Leader / Responsables
    if (role.isLeader) {
      return (volunteer.missionsCount || 0) >= 3 || volunteer.rank === 'PSE2' || ['CE', 'CP', 'CD'].includes(volunteer.rank);
    }

    return true;
  },

  // Générer des souhaits spontanés de rôles formulés par les bénévoles de l'antenne
  // RÈGLE : Demandes RARES (1 max à la fois, aucune si demande en attente, quotas stricts 3% com, 10% log, 8% formateur)
  triggerVolunteerRoleWishes(game, forcePrompt = false) {
    this.injectState(game);
    if (!game.volunteers || game.volunteers.length === 0) return 0;

    // Règle anti-spam : Si une demande est déjà en attente d'arbitrage par le joueur, ne pas en ajouter
    const pendingRequests = (game.roleRequests || []).filter(r => r.status === 'pending');
    if (pendingRequests.length > 0 && !forcePrompt) {
      return 0;
    }

    const totalVols = game.volunteers.length;

    // 1. Quotas d'effectifs réels par pôle
    const quotaCom = Math.max(1, Math.round(totalVols * 0.03));   // 3% max en com
    const quotaLog = Math.max(1, Math.round(totalVols * 0.10));   // 10% max en logistique
    const quotaForm = Math.max(1, Math.round(totalVols * 0.08));  // 8% max en formation

    // 2. Décompte actuel des bénévoles déjà en poste ou ayant une demande en attente
    const countInCom = game.volunteers.filter(v => {
      const r = this.ROLES_CATALOG.find(rc => rc.id === v.poleRoleId);
      return r && r.poleId === 'communication';
    }).length + pendingRequests.filter(req => req.poleId === 'communication').length;

    const countInLog = game.volunteers.filter(v => {
      const r = this.ROLES_CATALOG.find(rc => rc.id === v.poleRoleId);
      return r && r.poleId === 'logistique';
    }).length + pendingRequests.filter(req => req.poleId === 'logistique').length;

    const countInForm = game.volunteers.filter(v => {
      const r = this.ROLES_CATALOG.find(rc => rc.id === v.poleRoleId);
      return r && r.poleId === 'formation';
    }).length + pendingRequests.filter(req => req.poleId === 'formation').length;

    // 3. Trouver les bénévoles sans rôle et disponibles
    const availableVolunteers = game.volunteers.filter(v => !v.poleRoleId && !v.isBurnout && v.status !== 'mission');
    if (availableVolunteers.length === 0) {
      if (forcePrompt) {
        game.showToast('Effectifs Déjà Investis', 'Tous vos bénévoles qualifiés occupent déjà un rôle au sein de l’antenne.', 'blue');
      }
      return 0;
    }

    // 4. Identifier les rôles vacants dans chaque pôle
    const vacantRoles = this.ROLES_CATALOG.filter(role => {
      const currentHolders = game.volunteers.filter(v => v.poleRoleId === role.id);
      const pendingForRole = pendingRequests.filter(req => req.roleId === role.id).length;
      return (currentHolders.length + pendingForRole) < (role.maxHolders || 1);
    });

    if (vacantRoles.length === 0) {
      if (forcePrompt) {
        game.showToast('Tous les Postes sont Pourvus', 'Aucun rôle n\'est vacant pour le moment.', 'blue');
      }
      return 0;
    }

    // 5. Chercher parmi les bénévoles ceux qui ont un intérêt correspondant ET dont le quota n'est pas saturé
    const eligibleCandidates = [];

    availableVolunteers.forEach(v => {
      const interest = this.getVolunteerPoleInterest(v);

      if (interest === 'communication' && countInCom < quotaCom) {
        const comRoles = vacantRoles.filter(r => r.poleId === 'communication');
        comRoles.forEach(role => {
          if (this.isVolunteerReadyForPoleRequest(v, role, game)) {
            eligibleCandidates.push({ volunteer: v, role: role, interest: 'communication' });
          }
        });
      } else if (interest === 'logistique' && countInLog < quotaLog) {
        const logRoles = vacantRoles.filter(r => r.poleId === 'logistique');
        logRoles.forEach(role => {
          if (this.isVolunteerReadyForPoleRequest(v, role, game)) {
            eligibleCandidates.push({ volunteer: v, role: role, interest: 'logistique' });
          }
        });
      } else if (interest === 'formation' && countInForm < quotaForm) {
        const formRoles = vacantRoles.filter(r => r.poleId === 'formation');
        formRoles.forEach(role => {
          if (this.isVolunteerReadyForPoleRequest(v, role, game)) {
            eligibleCandidates.push({ volunteer: v, role: role, interest: 'formation' });
          }
        });
      }
    });

    if (eligibleCandidates.length === 0) {
      if (forcePrompt) {
        game.showToast('Sondage de l\'Équipe', 'Vos secouristes sont actuellement pleinement concentrés sur les missions de terrain. Aucun n\'a exprimé le souhait de rejoindre les pôles de soutien pour le moment.', 'slate');
      }
      return 0;
    }

    // 6. Tirer au sort EXACTEMENT UN SEUL bénévole pour formuler sa demande (jamais de rafale !)
    const picked = eligibleCandidates[Math.floor(Math.random() * eligibleCandidates.length)];
    this.submitVolunteerRoleRequest(game, picked.volunteer.id, picked.role.id);
    return 1;
  },

  // 5. AUTOMATISATION : FORMATION (Gérée par le Responsable Formation)
  processAutoFormationManager(game) {
    if (!game || !game.autoFormationActive) return;
    if (!Array.isArray(game.volunteers) || game.volunteers.length === 0) return;

    // Vérifier si un Responsable Formation est désigné
    const respFormationVol = game.volunteers.find(v => v.poleRoleId === 'resp_formation') ||
      (game.poles ? game.volunteers.find(v => v.id === game.poles.find(p => p.id === 'formation')?.responsibleId) : null);

    if (!respFormationVol) return; // Automatisation inactive sans Responsable Formation

    // S'assurer que game.sessionsFormation existe
    if (!Array.isArray(game.sessionsFormation)) game.sessionsFormation = [];

    // 1. Détecter les bénévoles ayant besoin d'une formation ou d'un recyclage :
    // - Priorité 1 : Bénévoles soumis à recyclage annuel (échéance au 31/12 ou validité expirée) -> FC_PSE
    // - Priorité 2 : Stagiaires ou PSC1 sans PSE1 -> Besoin PSE1
    // - Priorité 3 : PSE1 confirmés (>= 3 missions ou >= 60 XP) -> Besoin PSE2
    const needsTraining = [];
    game.volunteers.forEach(v => {
      if (v.status === 'mission' || v.isBurnout) return;
      const skills = v.skills || [];

      // Vérification du maintien des compétences (Recyclage annuel au 31/12)
      const needsRecycling = window.ProtecFormations?.volunteerNeedsRecycling
        ? window.ProtecFormations.volunteerNeedsRecycling(v, game)
        : Boolean(v.needsRecyclingFC_PSE);

      // Priorité 1 : Recyclage FC PSE
      if (needsRecycling) {
        needsTraining.unshift({ vol: v, courseId: 'FC_PSE', title: 'FC PSE (Recyclage Annuel)', isRecycling: true });
      }
      // Priorité 2 : Besoin initial PSE1
      else if (!skills.includes('pse1') && !skills.includes('pse2')) {
        needsTraining.push({ vol: v, courseId: 'PSE1', title: 'PSE1 (Premiers Secours en Équipe 1)' });
      }
      // Priorité 3 : Montée PSE2
      else if (skills.includes('pse1') && !skills.includes('pse2') && ((v.missionsCount || 0) >= 3 || (v.exp || 0) >= 60)) {
        needsTraining.push({ vol: v, courseId: 'PSE2', title: 'PSE2 (Équipier-Secouriste)' });
      }
    });

    if (needsTraining.length === 0) return;

    // Prendre le premier besoin à traiter
    const target = needsTraining[0];

    // Chercher si une session de ce cours existe déjà avec des places internes disponibles
    const openSession = game.sessionsFormation.find(s =>
      s.courseId === target.courseId &&
      !s.isCompleted &&
      (s.internalAntenneSeats || 0) > (s.registeredCandidates || []).length &&
      !(s.registeredCandidates || []).includes(target.vol.id)
    );

    if (openSession) {
      // Inscription automatique du bénévole par le Responsable Formation
      if (!Array.isArray(openSession.registeredCandidates)) openSession.registeredCandidates = [];
      openSession.registeredCandidates.push(target.vol.id);
      target.vol.registeredSessionId = openSession.id;

      game.saveGame();
      game.showToast(
        '🎓 Responsable Formation (Auto)',
        `${respFormationVol.name} a inscrit automatiquement ${target.vol.name} à la session « ${openSession.title} ».`,
        'green'
      );
    } else {
      // Aucune session existante : si au moins 2 bénévoles ont ce besoin, le Responsable Formation ouvre une session interne !
      const sameNeedCount = needsTraining.filter(t => t.courseId === target.courseId).length;
      if (sameNeedCount >= 2 && window.ProtecFormations && typeof window.ProtecFormations.createSession === 'function') {
        const station = (game.stations && game.stations[0]) || { name: 'Antenne', city: 'Nancy' };
        window.ProtecFormations.createSession(game, target.courseId, {
          locationType: 'antenne',
          internalAntenneSeats: 4,
          internalProtecSeats: 2,
          openToPublic: true,
          totalSeats: 8,
          roomNumber: 1
        });

        // Trouver la session tout juste créée
        const newlyCreated = game.sessionsFormation[game.sessionsFormation.length - 1];
        if (newlyCreated) {
          // Y inscrire les bénévoles demandeurs
          const candidatesToRegister = needsTraining.filter(t => t.courseId === target.courseId).slice(0, 4);
          candidatesToRegister.forEach(item => {
            if (!newlyCreated.registeredCandidates.includes(item.vol.id)) {
              newlyCreated.registeredCandidates.push(item.vol.id);
              item.vol.registeredSessionId = newlyCreated.id;
            }
          });

          game.saveGame();
          game.showToast(
            '🎓 Responsable Formation (Planification Auto)',
            `${respFormationVol.name} a programmé une nouvelle session interne de « ${target.title} » et y a positionné ${candidatesToRegister.length} secouristes !`,
            'green'
          );
        }
      }
    }
  },

  // 6. AUTOMATISATION : LOGISTIQUE (Gérée par les Bénévoles Logistique)
  processAutoLogisticsVolunteers(game) {
    if (!game || !game.autoLogisticsActive) return;
    if (!Array.isArray(game.vehicles) || game.vehicles.length === 0) return;

    // Trouver les bénévoles ayant le rôle Logistique
    const logVolunteers = (game.volunteers || []).filter(v =>
      (v.poleRoleId === 'benevole_logistique' || v.poleRoleId === 'resp_logistique') &&
      v.status === 'dispo' &&
      !v.isBurnout
    );

    if (logVolunteers.length === 0) return; // Aucune gestion automatique sans bénévole logistique dispo

    // Chercher les véhicules stationnés à la base qui nécessitent un réarmement ou dont les consommables sont bas
    const vehiclesNeedingRestock = game.vehicles.filter(veh => {
      const isAtBase = veh.status === 'dispo' || veh.status === 'base' || !veh.status;
      if (!isAtBase) return false;
      const isConsumableLow = (veh.consumablesPercent !== undefined && veh.consumablesPercent < 85);
      const isOxygenLow = (veh.oxygenPercent !== undefined && veh.oxygenPercent < 80);
      const isRestockFlagged = !!veh.needsRestock;
      return isConsumableLow || isOxygenLow || isRestockFlagged;
    });

    if (vehiclesNeedingRestock.length === 0) return;

    // Le premier bénévole logistique disponible prend en charge la mission de réarmement
    const volunteerLog = logVolunteers[0];
    const targetVeh = vehiclesNeedingRestock[0];

    // Effectuer le réarmement complet du véhicule
    targetVeh.consumablesPercent = 100;
    targetVeh.oxygenPercent = 100;
    targetVeh.needsRestock = false;
    targetVeh.lastRestockAt = Date.now();

    // Récompense d'XP pour le bénévole logistique
    volunteerLog.exp = (volunteerLog.exp || 0) + 10;
    volunteerLog.motivation = Math.min(100, (volunteerLog.motivation || 75) + 3);

    game.saveGame();
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    game.showToast(
      '🔧 Mission Logistique Réussie',
      `${volunteerLog.name} (Équipe Logistique) a pris en charge le réarmement complet du véhicule « ${targetVeh.name || targetVeh.type} ».`,
      'teal'
    );
  },

  // 7. BOUCLE D'HORLOGE GÉNÉRALE DU SYSTÈME DES PÔLES
  processClockTick(game) {
    if (!game) return;
    const now = Date.now();

    // Exécution toutes les 25 secondes réelles pour équilibrer le gameplay
    if (now - this._lastTickCheck < 25000) return;
    this._lastTickCheck = now;

    this.injectState(game);

    // 1. Exécution de la gestion automatique de la Formation par le Responsable Formation
    if (now - this._lastAutoFormationCheck >= 35000) {
      this._lastAutoFormationCheck = now;
      this.processAutoFormationManager(game);
    }

    // 2. Exécution des missions logistiques par les Bénévoles Logistique
    if (now - this._lastAutoLogisticsCheck >= 30000) {
      this._lastAutoLogisticsCheck = now;
      this.processAutoLogisticsVolunteers(game);
    }

    // 3. Génération spontanée périodique de souhaits de rôles (rares et espacés dans le temps)
    // Vérification toutes les 10 minutes réelles (600 000 ms) avec une probabilité réduite (12%)
    if (now - this._lastWishSpawnCheck >= 600000) {
      this._lastWishSpawnCheck = now;
      if (Math.random() < 0.12) {
        this.triggerVolunteerRoleWishes(game, false);
      }
    }
  },

  // 8. ÉDITION DES PÔLES (PERSONNALISATION DU JOUEUR)
  openEditModal(game, poleId) {
    this.editingPoleId = poleId;
    this.renderModal(game);
  },

  closeEditModal(game) {
    this.editingPoleId = null;
    this.renderModal(game);
  },

  savePoleEdits(game, poleId) {
    const pole = game.poles.find(p => p.id === poleId);
    if (!pole) return;

    const nameInput = document.getElementById('edit-pole-name');
    const missionInput = document.getElementById('edit-pole-mission');
    const descInput = document.getElementById('edit-pole-desc');
    const bonusInput = document.getElementById('edit-pole-bonus');
    const colorInput = document.getElementById('edit-pole-color');

    if (nameInput && nameInput.value.trim().length >= 2) pole.name = nameInput.value.trim();
    if (missionInput && missionInput.value.trim()) pole.missionLabel = missionInput.value.trim();
    if (descInput && descInput.value.trim()) pole.desc = descInput.value.trim();
    if (bonusInput && bonusInput.value.trim()) pole.bonusDesc = bonusInput.value.trim();
    if (colorInput) pole.color = colorInput.value;

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    game.showToast('Pôle Modifié', `Les modifications du « ${pole.name} » ont été enregistrées avec succès.`, 'green');
    this.editingPoleId = null;
    this.renderModal(game);
  },

  // Ajouter un nouveau pôle personnalisé
  addNewCustomPole(game) {
    this.injectState(game);
    const id = `pole_custom_${Date.now()}`;
    const newPole = {
      id: id,
      type: 'custom',
      name: 'Nouveau Pôle Opérationnel',
      icon: 'sparkles',
      color: 'purple',
      desc: 'Définissez la mission et les objectifs spécifiques de cette section de l’antenne.',
      missionLabel: 'Missions Personnalisées',
      responsibleId: null,
      assignedVolunteerIds: [],
      xpMultiplierBenevole: 1.1,
      xpMultiplierSalarie: 1.4,
      bonusDesc: '+10% d’efficacité sur les missions associées'
    };
    game.poles.push(newPole);
    game.saveGame();
    game.showToast('Nouveau Pôle Créé', 'Personnalisez son titre, ses missions et affectez ses membres.', 'green');
    this.editingPoleId = id;
    this.renderModal(game);
  },

  // Assigner un personnel à un pôle
  assignVolunteerToPole(game, volunteerId, targetPoleId) {
    this.injectState(game);
    const v = game.volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    game.poles.forEach(p => {
      p.assignedVolunteerIds = p.assignedVolunteerIds.filter(id => id !== volunteerId);
      if (p.responsibleId === volunteerId && p.id !== targetPoleId) {
        p.responsibleId = null;
      }
    });

    const targetPole = game.poles.find(p => p.id === targetPoleId);
    if (targetPole) {
      if (!targetPole.assignedVolunteerIds.includes(volunteerId)) {
        targetPole.assignedVolunteerIds.push(volunteerId);
      }
      v.assignedPoleId = targetPole.id;
      if (window.ProtecAudio) window.ProtecAudio.playClickSound();
      game.showToast('Affectation Pôle', `${v.name} a rejoint le ${targetPole.name}.`, 'blue');
    } else {
      v.assignedPoleId = null;
    }

    game.saveGame();
    this.renderModal(game);
  },

  // 9. RENDU DE L'INTERFACE UTILISATEUR
  renderModal(game) {
    this.injectState(game);
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (!body || !title) return;

    title.textContent = 'Organisation des Pôles & Rôles des Bénévoles';
    subtitle.textContent = 'Postes par pôle, gestion des demandes bénévoles, automatisations formation & logistique';
    icon.setAttribute('data-lucide', 'network');

    const editingPole = this.editingPoleId ? game.poles.find(p => p.id === this.editingPoleId) : null;
    const pendingRequests = (game.roleRequests || []).filter(r => r.status === 'pending');
    const isFreeMode = game.rolesAccessMode === 'free';

    body.innerHTML = `
      <div class="space-y-6">

        <!-- MODAL D'ÉDITION DU PÔLE (Si activé) -->
        ${editingPole ? `
          <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-2xl border-2 border-indigo-400 space-y-4 animate-in fade-in">
            <div class="flex items-center justify-between border-b border-slate-700 pb-3">
              <div class="flex items-center gap-2.5">
                <span class="text-xl">✏️</span>
                <h4 class="text-sm font-black text-amber-300">Modifier le Pôle : ${editingPole.name}</h4>
              </div>
              <button onclick="window.ProtecPoles.closeEditModal(window.game)" class="text-xs text-slate-400 hover:text-white transition">✕ Annuler</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="space-y-1">
                <label class="font-bold text-slate-300">Titre du Pôle :</label>
                <input id="edit-pole-name" type="text" value="${editingPole.name}" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xs focus:border-amber-400 outline-none" />
              </div>

              <div class="space-y-1">
                <label class="font-bold text-slate-300">Missions attribuées (Sous-titre) :</label>
                <input id="edit-pole-mission" type="text" value="${editingPole.missionLabel || ''}" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-400 outline-none" />
              </div>

              <div class="space-y-1 sm:col-span-2">
                <label class="font-bold text-slate-300">Description du Rôle Opérationnel :</label>
                <textarea id="edit-pole-desc" rows="2" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-400 outline-none">${editingPole.desc || ''}</textarea>
              </div>

              <div class="space-y-1 sm:col-span-2">
                <label class="font-bold text-slate-300">Bonus & Impact Opérationnel :</label>
                <input id="edit-pole-bonus" type="text" value="${editingPole.bonusDesc || ''}" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-400 outline-none" />
              </div>

              <div class="space-y-1">
                <label class="font-bold text-slate-300">Thème Couleur :</label>
                <select id="edit-pole-color" class="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none">
                  <option value="blue" ${editingPole.color === 'blue' ? 'selected' : ''}>Bleu Protection Civile</option>
                  <option value="teal" ${editingPole.color === 'teal' ? 'selected' : ''}>Sarcelle Logistique</option>
                  <option value="emerald" ${editingPole.color === 'emerald' ? 'selected' : ''}>Émeraude Formation</option>
                  <option value="indigo" ${editingPole.color === 'indigo' ? 'selected' : ''}>Indigo Communication</option>
                  <option value="amber" ${editingPole.color === 'amber' ? 'selected' : ''}>Ambre Mécénat / Social</option>
                  <option value="purple" ${editingPole.color === 'purple' ? 'selected' : ''}>Violet Spécialités</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button onclick="window.ProtecPoles.closeEditModal(window.game)" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition">Annuler</button>
              <button onclick="window.ProtecPoles.savePoleEdits(window.game, '${editingPole.id}')" class="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:brightness-110 transition flex items-center gap-1.5">
                <i data-lucide="check" class="w-4 h-4"></i>
                Enregistrer les Modifications
              </button>
            </div>
          </div>
        ` : ''}

        <!-- 1. BANDEAU DE GESTION DE LA POLITIQUE D'ACCÈS AUX RÔLES -->
        <div class="p-4 rounded-2xl glass-card space-y-3 border border-indigo-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                </span>
                <div>
                  <h4 class="text-xs font-black text-slate-900 uppercase tracking-wide">Politique d'Accès aux Postes & Rôles</h4>
                  <p class="text-[11px] text-slate-500">Les rôles sont accessibles à la demande des bénévoles selon le mode choisi.</p>
                </div>
              </div>
            </div>

            <!-- Boutons de bascule Accès Libre vs Validation Joueur -->
            <div class="flex items-center gap-2 bg-white/90 p-1 rounded-2xl border border-slate-200 shadow-2xs self-start md:self-auto">
              <button onclick="window.ProtecPoles.setRolesAccessMode(window.game, 'free')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${isFreeMode ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}">
                <i data-lucide="unlock" class="w-3.5 h-3.5"></i>
                <span>Accès Libre (Direct)</span>
              </button>
              <button onclick="window.ProtecPoles.setRolesAccessMode(window.game, 'validation')" class="px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${!isFreeMode ? 'bg-amber-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}">
                <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
                <span>Sous Validation du Joueur</span>
                ${pendingRequests.length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-red-600 text-white font-black animate-pulse">${pendingRequests.length}</span>` : ''}
              </button>
            </div>
          </div>

          <!-- Explication de la politique en cours -->
          <div class="p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 ${isFreeMode ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}">
            <div class="flex items-center gap-2">
              <span class="text-base">${isFreeMode ? '🟢' : '🟡'}</span>
              <span class="text-[11px]">
                ${isFreeMode 
                  ? '<strong>Accès Libre actif :</strong> Les bénévoles motivés prennent directement leur poste dès qu’ils le souhaitent sans attendre votre accord.' 
                  : '<strong>Sous validation du joueur :</strong> Les bénévoles postulent et attendent votre validation explicite avant de prendre leurs fonctions.'}
              </span>
            </div>
            <button onclick="window.ProtecPoles.triggerVolunteerRoleWishes(window.game, true)" class="px-3 py-1 rounded-lg text-[11px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1 flex-shrink-0">
              <i data-lucide="hand" class="w-3 h-3"></i>
              <span>Sonder les bénévoles</span>
            </button>
          </div>
        </div>

        <!-- 2. SECTION DEMANDES DE RÔLES EN ATTENTE (Si le joueur est en mode validation) -->
        ${pendingRequests.length > 0 ? `
          <div class="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <h4 class="text-xs font-black text-amber-950 uppercase tracking-wide">
                  Candidatures Internes en Attente (${pendingRequests.length})
                </h4>
              </div>
              <span class="text-[10px] text-amber-800 font-bold">Action du Joueur Requise</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              ${pendingRequests.map(req => `
                <div class="p-3 rounded-xl bg-white border border-amber-200 shadow-sm space-y-2 flex flex-col justify-between">
                  <div>
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">${req.volunteerAvatar || '🙋'}</span>
                        <div>
                          <div class="font-extrabold text-xs text-slate-900">${req.volunteerName}</div>
                          <div class="text-[10px] text-slate-500">${req.volunteerRank} • Souhaite intégrer : <strong class="text-indigo-900">${req.roleTitle}</strong></div>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        ${req.poleName}
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100 leading-snug">
                      ${req.motivation}
                    </p>
                  </div>

                  <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button onclick="window.ProtecPoles.rejectRoleRequest(window.game, '${req.id}')" class="flex-1 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition border border-slate-200">
                      Décliner
                    </button>
                    <button onclick="window.ProtecPoles.acceptRoleRequest(window.game, '${req.id}')" class="flex-1 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center justify-center gap-1">
                      <i data-lucide="check" class="w-3.5 h-3.5"></i>
                      <span>Valider le Rôle</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 3. ACTIONS RAPIDES & CRÉATION DE PÔLE -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black uppercase text-pc-blue flex items-center gap-1.5">
              <i data-lucide="layers" class="w-4 h-4"></i> Pôles d'Antenne (${game.poles.length})
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-pc-blue/10 text-pc-blue">
              ${game.volunteers.length} effectifs
            </span>
          </div>
          <button onclick="window.ProtecPoles.addNewCustomPole(window.game)" class="px-3.5 py-1.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1 self-start sm:self-auto">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>+ Créer un Pôle</span>
          </button>
        </div>

        <!-- 4. GRILLE DÉTAILLÉE DES PÔLES & LEURS RÔLES -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${game.poles.map(p => {
            const leader = game.volunteers.find(v => v.id === p.responsibleId);
            const members = game.volunteers.filter(v => p.assignedVolunteerIds.includes(v.id));
            const poleRoles = this.ROLES_CATALOG.filter(r => r.poleId === p.id);

            // Automatisation active
            const isFormation = p.id === 'formation' || p.type === 'formation';
            const isLogistique = p.id === 'logistique' || p.type === 'logistique';

            return `
              <div class="p-4 rounded-2xl glass-card space-y-4 border border-white/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div class="space-y-3">
                  <!-- Header Pôle avec Bouton Modifier -->
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="w-9 h-9 rounded-xl bg-${p.color || 'blue'}-100 text-${p.color || 'blue'}-700 flex items-center justify-center font-bold">
                        <i data-lucide="${p.icon || 'shield'}" class="w-4 h-4"></i>
                      </div>
                      <div>
                        <h4 class="text-xs font-black text-slate-900">${p.name}</h4>
                        <span class="text-[10px] text-slate-400 font-semibold">${p.missionLabel || 'Missions'}</span>
                      </div>
                    </div>
                    
                    <button onclick="window.ProtecPoles.openEditModal(window.game, '${p.id}')" class="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition flex items-center gap-1 border border-indigo-200" title="Modifier le titre, les missions et descriptions">
                      <i data-lucide="pencil" class="w-3 h-3"></i>
                      <span>Modifier</span>
                    </button>
                  </div>

                  <p class="text-xs text-slate-600 leading-normal">${p.desc || ''}</p>
                  
                  <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-700 font-semibold flex items-center gap-1.5">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0"></i>
                    <span>${p.bonusDesc || 'Bonus opérationnel actif'}</span>
                  </div>

                  <!-- BADGE D'AUTOMATISATION SPÉCIFIQUE (Formation & Logistique) -->
                  ${isFormation ? `
                    <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-base">⚡</span>
                        <div>
                          <div class="font-black text-emerald-900">Automatisation Formations Active</div>
                          <div class="text-[9.5px] text-emerald-700">Le Responsable Formation inscrit et planifie automatiquement les sessions des bénévoles.</div>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[9px] font-black">AUTO</span>
                    </div>
                  ` : ''}

                  ${isLogistique ? `
                    <div class="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-950 flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-base">🔧</span>
                        <div>
                          <div class="font-black text-teal-900">Missions Logistiques Bénévoles</div>
                          <div class="text-[9.5px] text-teal-700">Ce sont les bénévoles logistique qui réarment automatiquement la flotte et les consommables.</div>
                        </div>
                      </div>
                      <span class="px-2 py-0.5 rounded-full bg-teal-200 text-teal-900 text-[9px] font-black">AUTO</span>
                    </div>
                  ` : ''}

                  <!-- SECTION DES RÔLES & POSTES DU PÔLE -->
                  <div class="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-extrabold text-slate-800 uppercase tracking-wider text-[9px]">Postes & Rôles d'Antenne</span>
                      <span class="text-[10px] text-slate-400 font-semibold">${poleRoles.length} poste(s) définis</span>
                    </div>

                    <div class="space-y-1.5">
                      ${poleRoles.map(role => {
                        const holders = game.volunteers.filter(v => v.poleRoleId === role.id);
                        const isVacant = holders.length === 0;

                        return `
                          <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-1.5">
                                <span class="w-6 h-6 rounded-lg ${role.badgeColor} flex items-center justify-center text-xs font-black">
                                  <i data-lucide="${role.icon}" class="w-3.5 h-3.5"></i>
                                </span>
                                <div>
                                  <div class="text-xs font-black text-slate-900">${role.title}</div>
                                  <div class="text-[9px] text-slate-500 font-medium">${role.prereqLabel}</div>
                                </div>
                              </div>
                              <span class="px-2 py-0.5 rounded text-[9px] font-black ${isVacant ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}">
                                ${isVacant ? 'Vacant' : `${holders.length}/${role.maxHolders || 1}`}
                              </span>
                            </div>

                            <p class="text-[10px] text-slate-600 leading-tight">${role.desc}</p>

                            <!-- Titulaires actuels du poste -->
                            <div class="flex flex-wrap items-center gap-1 pt-1">
                              ${isVacant ? `
                                <span class="text-[10px] text-slate-400 italic">Aucun titulaire pour le moment.</span>
                              ` : holders.map(h => `
                                <div class="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-2xs">
                                  <span>${h.avatar || '🙋'}</span>
                                  <span>${h.name}</span>
                                  <button onclick="window.ProtecPoles.removeRoleFromVolunteer(window.game, '${h.id}')" class="text-slate-400 hover:text-red-600 transition ml-1" title="Libérer le poste">✕</button>
                                </div>
                              `).join('')}
                            </div>

                            <!-- Nommer directement un bénévole à ce poste -->
                            <div class="pt-1">
                              <select onchange="if(this.value) window.ProtecPoles.assignRoleToVolunteer(window.game, this.value, '${role.id}'); this.value='';" class="w-full text-[10.5px] p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium">
                                <option value="">+ Nommer un bénévole à ce poste...</option>
                                ${game.volunteers.filter(v => v.poleRoleId !== role.id).map(v => `
                                  <option value="${v.id}">${v.name} (${v.rank} • ${v.poleRoleTitle ? `Déjà ${v.poleRoleTitle}` : 'Sans rôle'})</option>
                                `).join('')}
                              </select>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <!-- Effectifs affectés au pôle -->
                  <div class="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-extrabold text-slate-700">Membres affectés (${members.length})</span>
                      <span class="text-[10px] text-slate-400">Salariés & Bénévoles</span>
                    </div>
                    <div class="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      ${members.length === 0 ? '<p class="text-[11px] text-slate-400 italic">Aucun secouriste assigné à ce pôle.</p>' : ''}
                      ${members.map(m => `
                        <div class="p-1.5 rounded-xl glass-card flex items-center justify-between text-xs">
                          <div class="flex items-center gap-1.5">
                            <span>${m.avatar || '🙋'}</span>
                            <div>
                              <div class="font-bold text-slate-800 text-[11px]">${m.name}</div>
                              <div class="text-[9px] text-slate-400 font-medium">${m.rank} • ${m.poleRoleTitle ? `<span class="text-indigo-700 font-bold">${m.poleRoleTitle}</span>` : 'Membre'}</div>
                            </div>
                          </div>
                          <span class="px-1.5 py-0.2 rounded text-[8.5px] font-black ${m.dispoType === 'salarié' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                            ${m.id === p.responsibleId ? 'Responsable' : (m.dispoType === 'salarié' ? '+40% XP' : 'Membre')}
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>

                <!-- Assigner un membre au pôle -->
                <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <select onchange="if(this.value) window.ProtecPoles.assignVolunteerToPole(window.game, this.value, '${p.id}'); this.value='';" class="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-pc-blue dark:text-sky-400 font-bold">
                    <option value="">+ Affecter un bénévole / salarié à ce pôle...</option>
                    ${game.volunteers.filter(v => !p.assignedVolunteerIds.includes(v.id)).map(v => `
                      <option value="${v.id}">${v.name} (${v.rank} • ${v.dispoType === 'salarié' ? 'Salarié' : 'Bénévole'})</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
