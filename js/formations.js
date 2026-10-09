/**
 * PROTEC LIVE - SYSTÈME COMPLET DE FORMATIONS SECOURISTES & GRAND PUBLIC
 * 
 * 1. Formations Grand Public & Entreprises : GQS, PSC (Secourisme de base), SST (Sauveteur Secouriste du Travail), Manipulation Extincteurs (EPI).
 * 2. Formations Opérationnelles : PSE1 (Rôle Secouriste), PSE2 (Rôle Équipier Secouriste), CE (Compétence & Rôle Chef d’Équipe), CD (Chef de Dispositif).
 * 3. Recyclages & Formation Continue : Recyclage FC PSE (PSE 1 & 2), Recyclage MAC SST.
 * 4. Pédagogie & Filière Formateurs :
 *    - "PIC F" (Pédagogie Initiale et Commune de Formateur - 21h) : préalable obligatoire distinct.
 *    - Formateur PSC (14h - requiert la PIC F).
 *    - Formateur PS (PSE1/PSE2), Formateur SST, Formateur AEP, CEF, Formateur de Formateurs (FdF).
 * 5. Kits Pédagogiques : 1 kit requis par type de formation (Kit PSC, Kit SST, Kit PSE1, Kit PSE2, Kit Manip Extincteurs, Kit PIC F, Kit SSA).
 * 6. Modes de déroulement des formations :
 *    - EN INTERNE avec nos formateurs : GRATUIT pour les bénévoles de l'antenne (0 €).
 *      Possibilité d'accueillir des candidats extérieurs payants (génération de trésorerie nette pour l'antenne).
 *    - EN EXTERNE (stage délocalisé) :
 *      * Prise en charge 100% par l'antenne (coût payé par l'asso, boost moral/motivation du bénévole).
 *      * Ou financé par le bénévole lui-même (coût 0 € pour l'asso, mais baisse significative du moral/motivation).
 */

window.ProtecFormations = {
  catalog: [
    // --- GRAND PUBLIC & ENTREPRISES ---
    {
      id: 'GQS',
      category: 'grand_public',
      title: 'GQS - Gestes Qui Sauvent (Sensibilisation)',
      desc: 'Sensibilisation de 2 heures aux arrêts cardiaques (massage cardiaque + DAE) et hémorragies.',
      durationHours: 2,
      basePricePublic: 20,
      costOrganization: 10,
      capacity: 10,
      kitRequired: 'kit_pedago_psc',
      kitName: 'Kit Pédagogique PSC',
      unlocks: null
    },
    {
      id: 'PSC',
      category: 'grand_public',
      title: 'PSC - Prévention et Secours Civiques',
      desc: 'Formation certifiante grand public de 7 heures aux gestes d’urgence de base face aux situations de détresse.',
      durationHours: 7,
      basePricePublic: 60,
      costOrganization: 30,
      capacity: 8,
      kitRequired: 'kit_pedago_psc',
      kitName: 'Kit Pédagogique PSC',
      unlocks: null
    },
    {
      id: 'SST',
      category: 'grand_public',
      title: 'SST - Sauveteur Secouriste du Travail (Entreprises)',
      desc: 'Formation certifiante INRS de 14 heures en milieu professionnel. Très demandée par les entreprises locales.',
      durationHours: 14,
      basePricePublic: 180,
      costOrganization: 70,
      capacity: 8,
      kitRequired: 'kit_pedago_sst',
      kitName: 'Kit Pédagogique SST',
      unlocksSkill: 'sst',
      unlocks: null
    },
    {
      id: 'EXTINCTEUR',
      category: 'grand_public',
      title: 'Manipulation Extincteurs - Équipier de 1ère Intervention (EPI)',
      desc: 'Formation pratique de 3 heures sur bac à feu : manipulation des extincteurs (Eau pulvérisée, CO2, Poudre) et sécurité incendie.',
      durationHours: 3,
      basePricePublic: 65,
      costOrganization: 25,
      capacity: 8,
      kitRequired: 'kit_pedago_extincteur',
      kitName: 'Kit Manipulation Extincteurs',
      unlocksSkill: 'epi_incendie',
      unlocks: 'Équipier Prévention Incendie'
    },

    // --- SECOURISME OPÉRATIONNEL ---
    {
      id: 'PSE1',
      category: 'professionnelle',
      title: 'PSE1 - Premiers Secours en Équipe de niveau 1',
      desc: 'Formation initiale de 35 heures (5 jours) pour intervenir en équipe. Confère la compétence PSE1 et le rôle opérationnel de Secouriste.',
      durationHours: 35,
      durationDays: 5,
      basePricePublic: 250,
      costOrganization: 110,
      capacity: 6,
      kitRequired: 'kit_pedago_pse1',
      kitName: 'Kit Pédagogique PSE1',
      unlocksSkill: 'pse1',
      unlocks: 'Secouriste'
    },
    {
      id: 'PSE2',
      category: 'professionnelle',
      title: 'PSE2 - Premiers Secours en Équipe de niveau 2',
      desc: 'Formation d’approfondissement de 28 heures (4 jours) : immobilisations, brancardage complexe, oxygénothérapie et matériel VPSP.',
      durationHours: 28,
      durationDays: 4,
      basePricePublic: 280,
      costOrganization: 130,
      capacity: 6,
      kitRequired: 'kit_pedago_pse2',
      kitName: 'Kit Pédagogique PSE2',
      prereqSkill: 'pse1',
      unlocksSkill: 'pse2',
      unlocks: 'Équipier Secouriste'
    },
    {
      id: 'FC_PSE',
      category: 'professionnelle',
      title: 'Formation Continue FC PSE (Recyclage PSE 1 & 2)',
      desc: 'Recyclage annuel obligatoire de 6 heures pour maintenir la validité opérationnelle et les réflexes d’équipier.',
      durationHours: 6,
      durationDays: 1,
      basePricePublic: 60,
      costOrganization: 20,
      capacity: 8,
      kitRequired: 'kit_pedago_pse1',
      kitName: 'Kit Pédagogique PSE1',
      isRecycling: true,
      unlocks: null
    },
    {
      id: 'MAC_SST',
      category: 'professionnelle',
      title: 'MAC SST - Maintien & Actualisation des Compétences',
      desc: 'Recyclage certifiant de 7 heures pour prolonger la validité de 24 mois du certificat SST.',
      durationHours: 7,
      durationDays: 1,
      basePricePublic: 90,
      costOrganization: 30,
      capacity: 8,
      kitRequired: 'kit_pedago_sst',
      kitName: 'Kit Pédagogique SST',
      isRecycling: true,
      unlocks: null
    },
    {
      id: 'CE',
      category: 'professionnelle',
      title: 'Chef d’Équipe (CE) - Commandement & Régulation',
      desc: 'Formation de 21 heures (3 jours). Donne la compétence Chef d’Équipe et permet d’occuper le rôle opérationnel de Chef d’Équipe en mission.',
      durationHours: 21,
      durationDays: 3,
      basePricePublic: 350,
      costOrganization: 160,
      capacity: 4,
      kitRequired: 'kit_pedago_pse2',
      kitName: 'Kit Pédagogique PSE2',
      prereqSkill: 'pse2',
      unlocksSkill: 'ce',
      unlocks: 'Chef d’équipe'
    },
    {
      id: 'CD',
      category: 'professionnelle',
      title: 'Chef de Dispositif (CD / CP) - Grands Rassemblements',
      desc: 'Formation de 24 heures (3 jours) : commandement de postes de grande envergure, coordination inter-services et cellule de crise.',
      durationHours: 24,
      durationDays: 3,
      basePricePublic: 450,
      costOrganization: 220,
      capacity: 4,
      prereqSkill: 'ce',
      unlocksSkill: 'cd',
      unlocks: 'Chef de Dispositif'
    },
    {
      id: 'SSA',
      category: 'professionnelle',
      title: 'SSA - Surveillance & Sauvetage Aquatique (Eaux Intérieures)',
      desc: 'Formation de 28 heures en sauvetage nautique, techniques d’embarcation et filins de secours.',
      durationHours: 28,
      durationDays: 4,
      basePricePublic: 310,
      costOrganization: 140,
      capacity: 6,
      kitRequired: 'kit_pedago_ssa',
      kitName: 'Kit Pédagogique SSA',
      prereqSkill: 'pse1',
      unlocksSkill: 'ssa',
      unlocks: 'Nageur Sauveteur Aquatique'
    },

    // --- SOUTIEN PSYCHOLOGIQUE & HUMANITAIRE (AEP) ---
    {
      id: 'AEP1',
      category: 'psychologique',
      title: 'AEP1 - Aide & Écoute Psychologique (Sensibilisation)',
      desc: 'Sensibilisation de 7 heures : accueil de la parole, écoute active bienveillante et premiers secours émotionnels immédiats.',
      durationHours: 7,
      basePricePublic: 95,
      costOrganization: 35,
      capacity: 10,
      unlocksSkill: 'aep1',
      unlocks: 'Écoutant Secouriste AEP1'
    },
    {
      id: 'AEP2',
      category: 'psychologique',
      title: 'AEP2 - Aide & Écoute Psychologique (Approfondissement & CAI)',
      desc: 'Formation de 14 heures : prise en charge du trauma psychique, deuil d’urgence, defusing post-mission et CAI en crise NOVI.',
      durationHours: 14,
      basePricePublic: 175,
      costOrganization: 65,
      capacity: 8,
      prereqSkill: 'aep1',
      unlocksSkill: 'aep2',
      unlocks: 'Intervenant Psycho-Social AEP2'
    },

    // --- CURSUS PÉDAGOGIQUE & FORMATEURS (FILIÈRE OFFICIELLE) ---
    {
      id: 'PICF',
      category: 'pedagogique',
      title: 'PIC F - Pédagogie Initiale et Commune de Formateur',
      desc: 'Formation initiale de 21 heures (3 jours). Tronc commun obligatoire préalable à tout brevet de formateur.',
      durationHours: 21,
      durationDays: 3,
      basePricePublic: 220,
      costOrganization: 90,
      capacity: 6,
      kitRequired: 'kit_pedago_picf',
      kitName: 'Kit Pédagogique PIC F',
      unlocksSkill: 'picf',
      unlocks: 'Pédagogue Stagiaire'
    },
    {
      id: 'FORM_PSC',
      category: 'pedagogique',
      title: 'Formateur PSC - Pédagogie Appliquée au Secourisme Citoyen',
      desc: 'Formation de 14 heures (2 jours). Habilite à certifier le public aux GQS et PSC. Prérequis obligatoire : être titulaire de la PIC F.',
      durationHours: 14,
      durationDays: 2,
      basePricePublic: 180,
      costOrganization: 80,
      capacity: 6,
      kitRequired: 'kit_pedago_psc',
      kitName: 'Kit Pédagogique PSC',
      prereqSkill: 'picf',
      unlocksSkill: 'formateur_psc',
      unlocks: 'Formateur PSC'
    },
    {
      id: 'FORM_PS',
      category: 'pedagogique',
      title: 'Formateur PS - Premiers Secours Opérationnels (PSE1 & PSE2)',
      desc: 'Formation de 28 heures pour enseigner les techniques de relevage, brancardage et réanimation en équipe. Prérequis : PSE2 & Formateur PSC.',
      durationHours: 28,
      durationDays: 4,
      basePricePublic: 340,
      costOrganization: 140,
      capacity: 6,
      kitRequired: 'kit_pedago_pse2',
      kitName: 'Kit Pédagogique PSE2',
      prereqSkill: 'formateur_psc',
      unlocksSkill: 'formateur_ps',
      unlocks: 'Formateur Premiers Secours'
    },
    {
      id: 'FORM_SST',
      category: 'pedagogique',
      title: 'Formateur SST - Sauveteur Secouriste du Travail (INRS)',
      desc: 'Habilitation officielle de 21 heures pour animer les cursus SST en entreprise et générer des recettes régulières.',
      durationHours: 21,
      durationDays: 3,
      basePricePublic: 380,
      costOrganization: 160,
      capacity: 6,
      kitRequired: 'kit_pedago_sst',
      kitName: 'Kit Pédagogique SST',
      prereqSkill: 'picf',
      unlocksSkill: 'formateur_sst',
      unlocks: 'Formateur SST Entreprises'
    },
    {
      id: 'FORM_AEP',
      category: 'pedagogique',
      title: 'Formateur AEP - Aide & Écoute Psychologique',
      desc: 'Habilitation fédérale de 21 heures pour former les bénévoles aux modules de soutien psychologique AEP1 & AEP2.',
      durationHours: 21,
      durationDays: 3,
      basePricePublic: 320,
      costOrganization: 130,
      capacity: 6,
      prereqSkill: 'aep2',
      unlocksSkill: 'formateur_aep',
      unlocks: 'Formateur AEP'
    },
    {
      id: 'CEF',
      category: 'pedagogique',
      title: 'CEF - Concepteur / Encadrant de Formation',
      desc: 'Formation de 35 heures : pilotage des stages départementaux, ingénierie et encadrement des équipes de formateurs.',
      durationHours: 35,
      durationDays: 5,
      basePricePublic: 450,
      costOrganization: 200,
      capacity: 4,
      unlocksSkill: 'cef',
      unlocks: 'Concepteur Encadrant'
    },
    {
      id: 'FDF',
      category: 'pedagogique',
      title: 'Formateur de Formateurs (FdF) - Échelon Fédéral',
      desc: 'Niveau suprême d’expertise pédagogique (42h) : certifie et recycle l’ensemble des formateurs de l’association.',
      durationHours: 42,
      durationDays: 6,
      basePricePublic: 550,
      costOrganization: 250,
      capacity: 4,
      unlocksSkill: 'formateur_de_formateur',
      unlocks: 'Formateur de Formateurs'
    }
  ],

  // Initialisation de l'état
  injectState(game) {
    if (!game.sessionsFormation) {
      game.sessionsFormation = [];
    }
  },

  // Vérifier si l'antenne possède le kit pédagogique requis
  hasTrainingKit(game, kitId) {
    if (!kitId) return true;
    const stations = game.stations || [];
    const inStationStock = stations.some(st => st.stock && (Number(st.stock[kitId]) || 0) > 0);
    if (inStationStock) return true;
    if (game.logistics && (Number(game.logistics[kitId]) || 0) > 0) return true;
    return false;
  },

  // Créer une nouvelle session de formation planifiée à l'antenne ou chez un partenaire
  createSession(game, courseId, discountType, isInternal, targetAudience, locationType = 'antenne', externalAttendeesCount = 0) {
    const course = this.catalog.find(c => c.id === courseId);
    if (!course) return;

    // 1. Vérification de la salle de formation si hébergée à l'antenne
    if (locationType === 'antenne') {
      if (window.ProtecLocaux && !window.ProtecLocaux.hasFormationRoom(game)) {
        game.showToast(
          'Salle de Formation Requise !',
          'Votre antenne ne possède aucune salle pédagogique. Aménagez une salle de formation dans vos locaux ou organisez-la délocalisée chez l’entreprise partenaire.',
          'orange'
        );
        return;
      }
    }

    // 2. Vérification du kit pédagogique si dispensé par l'antenne
    if (course.kitRequired && !this.hasTrainingKit(game, course.kitRequired)) {
      game.showToast(
        'Kit Pédagogique Manquant !',
        `Pour dispenser la formation « ${course.title} », l’antenne doit posséder le « ${course.kitName || course.kitRequired} ». Vous pouvez l'acquérir dans la boutique Logistique ou envoyer vos bénévoles en formation externe !`,
        'orange'
      );
      return;
    }

    // 3. Calcul du tarif public appliqué
    let finalPrice = course.basePricePublic;
    let relationshipBonus = 0;
    if (discountType === 'free_mairie') {
      finalPrice = 0;
      relationshipBonus = 35;
    } else if (discountType === 'discount_25') {
      finalPrice = Math.round(course.basePricePublic * 0.75);
      relationshipBonus = 15;
    } else if (discountType === 'discount_50') {
      finalPrice = Math.round(course.basePricePublic * 0.50);
      relationshipBonus = 25;
    }

    // Formation interne : gratuite pour les bénévoles de l'antenne
    let volunteerPayment = false;
    if (isInternal) {
      volunteerPayment = false; // Toujours gratuit en interne si animé par l'antenne
      finalPrice = 0;
    }

    const sessionId = `sess-${Date.now()}`;
    const extCount = Math.max(0, Math.min(course.capacity - 1, Number(externalAttendeesCount) || 0));

    const newSession = {
      id: sessionId,
      courseId: course.id,
      title: course.title,
      category: course.category,
      isInternal: !!isInternal,
      locationType: locationType,
      locationLabel: locationType === 'antenne' ? 'À l’Antenne (Salle Pédagogique)' : 'Délocalisée (Entreprise Partenaire)',
      targetAudience: isInternal ? 'Bénévoles de l’Antenne' : (targetAudience || 'Grand Public'),
      finalPrice: finalPrice,
      publicPriceForExternals: course.basePricePublic,
      costOrganization: course.costOrganization,
      discountType: discountType,
      relationshipBonus: relationshipBonus,
      volunteerPayment: volunteerPayment,
      externalAttendeesCount: isInternal ? extCount : 0, // Personnes extérieures accueillies payantes
      trainerId: null,
      maxCandidates: course.capacity,
      registeredCandidates: [],
      dateDesc: `Prévue au calendrier (Durée : ${course.durationHours}h)`,
      status: 'open',
      createdAt: Date.now()
    };

    game.sessionsFormation.unshift(newSession);
    game.saveGame();
    game.showToast('Session Programmée', `La session « ${course.id} » est ouverte au planning. Affectez un formateur habilité.`, 'green');
    this.renderModal(game);
  },

  // Former un bénévole en EXTERNE (Stage dans un organisme tiers ou Union Départementale)
  registerVolunteerExternal(game, volunteerId, courseId, payMode = 'asso') {
    const vol = game.volunteers.find(v => v.id === volunteerId);
    const course = this.catalog.find(c => c.id === courseId);
    if (!vol || !course) return;

    // Vérification des prérequis de compétences
    if (course.prereqSkill && (!vol.skills || !vol.skills.includes(course.prereqSkill))) {
      const prereqCourse = this.catalog.find(c => c.unlocksSkill === course.prereqSkill || c.id === course.prereqSkill.toUpperCase());
      game.showToast('Prérequis Manquant', `${vol.name} doit d'abord détenir la qualification « ${prereqCourse?.title || course.prereqSkill} ».`, 'orange');
      return;
    }

    const cost = course.basePricePublic;
    if (payMode === 'asso') {
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', `Il vous manque ${(cost - game.resources.money)} € pour prendre en charge ce stage externe.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      vol.motivation = Math.min(100, (vol.motivation || 80) + 20);
      vol.humeur = Math.min(100, (vol.humeur || 80) + 15);
      game.showToast('Stage Pris en Charge !', `L’antenne a réglé les ${cost} € de formation pour ${vol.name}. Moral au zénith !`, 'green');
    } else {
      // Bénévole paye lui-même
      vol.motivation = Math.max(15, (vol.motivation || 80) - 25);
      vol.humeur = Math.max(15, (vol.humeur || 80) - 20);
      game.showToast('Baisse de Moral !', `${vol.name} a dû payer lui-même son stage (${cost} €). Motivation en berne !`, 'orange');
    }

    // Attribution immédiate des compétences et rôles
    this.grantCourseQualifications(vol, course);

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Vérifier si un formateur possède l'habilitation requise pour animer un cursus
  isEligibleTrainer(trainer, course) {
    if (!trainer || !course) return { eligible: false, reason: 'Formateur introuvable' };
    const skills = (trainer.skills || []).map(s => String(s).toLowerCase());

    // 1. Formateur de Formateurs (FdF) : anime TOUT !
    if (skills.includes('formateur_de_formateur')) {
      return { eligible: true, badge: '👑 Formateur de Formateurs (FdF)' };
    }

    // 2. Cadre Pédagogique
    if (trainer.role === 'Cadre' || trainer.rank === 'Cadre') {
      return { eligible: true, badge: '🏛️ Cadre Pédagogique' };
    }

    // 3. Cursus AEP
    if (course.id === 'AEP1' || course.id === 'AEP2') {
      if (skills.includes('formateur_aep')) return { eligible: true, badge: '🗣️ Formateur AEP' };
      return { eligible: false, reason: 'Nécessite la qualification « Formateur AEP » (ou FdF).' };
    }

    // 4. Formateurs de Formateurs et CEF
    if (['PICF', 'FORM_PS', 'FORM_SST', 'FORM_AEP', 'CEF', 'FDF'].includes(course.id)) {
      if (skills.includes('formateur_de_formateur')) return { eligible: true, badge: '👑 Formateur de Formateurs' };
      return { eligible: false, reason: 'Seul un « Formateur de Formateurs (FdF) » est habilité à animer cette formation.' };
    }

    // 5. Premiers Secours Opérationnels (PSE1, PSE2, FC_PSE, CE)
    if (['PSE1', 'PSE2', 'FC_PSE', 'CE'].includes(course.id)) {
      if (skills.includes('formateur_ps')) return { eligible: true, badge: '🚑 Formateur PS' };
      if (skills.includes('formateur') && (skills.includes('ce') || ['CE', 'CD'].includes(trainer.rank))) {
        return { eligible: true, badge: '🎓 Formateur PSE' };
      }
      return { eligible: false, reason: 'Nécessite la qualification « Formateur PS » (ou FdF).' };
    }

    // 6. SST & MAC SST
    if (course.id === 'SST' || course.id === 'MAC_SST') {
      if (skills.includes('formateur_sst')) return { eligible: true, badge: '💼 Formateur SST' };
      if (skills.includes('formateur')) return { eligible: true, badge: '🎓 Formateur' };
      return { eligible: false, reason: 'Nécessite la qualification « Formateur SST » (ou FdF).' };
    }

    // 7. Manipulation Extincteurs (EPI)
    if (course.id === 'EXTINCTEUR') {
      if (skills.includes('formateur_sst') || skills.includes('formateur_ps') || skills.includes('formateur') || skills.includes('epi_incendie')) {
        return { eligible: true, badge: '🧯 Formateur Incendie' };
      }
      return { eligible: false, reason: 'Nécessite un formateur d’antenne qualifié (SST, PS ou EPI).' };
    }

    // 8. Surveillance et Sauvetage Aquatique
    if (course.id === 'SSA') {
      if (skills.includes('formateur_ps') || skills.includes('ssa')) return { eligible: true, badge: '🏊 Formateur SSA' };
      return { eligible: false, reason: 'Nécessite la qualification Sauvetage Aquatique (SSA).' };
    }

    // 9. GQS & PSC Grand Public & Formateur PSC
    if (course.id === 'GQS' || course.id === 'PSC') {
      if (skills.includes('formateur_psc') || skills.includes('formateur_ps') || skills.includes('formateur') || trainer.isTrainer) {
        return { eligible: true, badge: '🎓 Formateur PSC' };
      }
      return { eligible: false, reason: 'Nécessite la qualification « Formateur PSC ».' };
    }

    // 10. Chef de Dispositif
    if (course.id === 'CD') {
      if (skills.includes('cef')) return { eligible: true, badge: '📋 CEF' };
      return { eligible: false, reason: 'Nécessite la qualification « CEF » (Concepteur Encadrant).' };
    }

    const isBasicTrainer = trainer.isTrainer || skills.includes('formateur');
    return isBasicTrainer ? { eligible: true, badge: 'Formateur' } : { eligible: false, reason: 'Bénévole non habilité comme formateur.' };
  },

  // Affecter un formateur à une session
  assignTrainer(game, sessionId, trainerId) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    if (!session) return;
    const trainer = game.volunteers.find(v => v.id === trainerId);
    if (!trainer) return;
    const course = this.catalog.find(c => c.id === session.courseId);

    const check = this.isEligibleTrainer(trainer, course);
    if (!check.eligible) {
      game.showToast('Non Qualifié pour ce Cursus', `${trainer.name} ne peut pas animer « ${course?.title || session.courseId} » : ${check.reason}`, 'orange');
      return;
    }

    session.trainerId = trainer.id;
    game.saveGame();
    game.showToast('Formateur Affecté', `${trainer.name} (${check.badge}) animera la session.`, 'green');
    this.renderModal(game);
  },

  // Inscrire un bénévole de l'antenne à une formation interne (GRATUIT)
  registerVolunteerToInternal(game, sessionId, volunteerId) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!session || !vol) return;

    if (session.registeredCandidates.includes(volunteerId)) return;
    const currentTotal = session.registeredCandidates.length + (session.externalAttendeesCount || 0);
    if (currentTotal >= session.maxCandidates) {
      game.showToast('Session Complète', 'La jauge maximale de stagiaires est atteinte.', 'orange');
      return;
    }

    // Vérification des prérequis de compétences
    const course = this.catalog.find(c => c.id === session.courseId);
    if (course && course.prereqSkill && (!vol.skills || !vol.skills.includes(course.prereqSkill))) {
      game.showToast('Prérequis Manquant', `${vol.name} doit d'abord détenir la compétence « ${course.prereqSkill.toUpperCase()} ».`, 'orange');
      return;
    }

    // Formation interne dispensée gratuitement par l'antenne
    vol.motivation = Math.min(100, (vol.motivation || 80) + 12);
    vol.humeur = Math.min(100, (vol.humeur || 80) + 10);
    game.showToast('Bénévole Inscrit (Gratuit)', `${vol.name} est inscrit à la formation interne gratuite. Moral boosté !`, 'green');

    session.registeredCandidates.push(volunteerId);
    game.saveGame();
    this.renderModal(game);
  },

  // Définir le nombre de candidats extérieurs payants sur une session interne
  setExternalAttendeesCount(game, sessionId, count) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    if (!session) return;
    const course = this.catalog.find(c => c.id === session.courseId);
    const max = course ? course.capacity : 8;
    const internalCount = session.registeredCandidates.length;
    const clamped = Math.max(0, Math.min(max - internalCount, Number(count) || 0));

    session.externalAttendeesCount = clamped;
    game.saveGame();
    this.renderModal(game);
  },

  // Attribuer les qualifications obtenues par une formation
  grantCourseQualifications(vol, course) {
    if (!vol.skills) vol.skills = [];
    vol.exp = (vol.exp || 0) + 40;

    // Rôles opérationnels de Sécurité Civile (Secouriste, Équipier Secouriste, Chef d'équipe...)
    if (course.unlocks) {
      vol.role = course.unlocks;
    }
    if (['PSE1', 'PSE2', 'CE', 'CD'].includes(course.id)) {
      vol.rank = course.id;
    }

    // Compétences techniques
    if (course.unlocksSkill && !vol.skills.includes(course.unlocksSkill)) {
      vol.skills.push(course.unlocksSkill);
    }
    if (course.id === 'CE' && !vol.skills.includes('ce')) {
      vol.skills.push('ce');
    }
    if (course.id === 'EXTINCTEUR' && !vol.skills.includes('epi_incendie')) {
      vol.skills.push('epi_incendie');
    }

    // Filière formateurs
    if (course.unlocksSkill && (course.unlocksSkill.startsWith('formateur_') || course.unlocksSkill === 'formateur_de_formateur' || course.unlocksSkill === 'cef')) {
      vol.isTrainer = true;
    }

    // Recyclage / FC
    if (course.isRecycling) {
      vol.recycledYear = new Date().getFullYear();
    }
  },

  // Clôturer et certifier une session de formation
  completeSession(game, sessionId) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    if (!session) return;

    if (!session.trainerId) {
      game.showToast('Formateur Requis', 'Vous devez affecter un formateur qualifié avant de valider la session.', 'orange');
      return;
    }

    const course = this.catalog.find(c => c.id === session.courseId);
    const internalCount = session.registeredCandidates.length;
    const externalCount = session.externalAttendeesCount || 0;
    const totalCount = session.isInternal ? (internalCount + externalCount) : (internalCount || Math.min(session.maxCandidates, 6));

    let totalRevenue = 0;
    let netGain = 0;

    if (session.isInternal) {
      // Les externes accueillis paient le tarif public de la formation
      const revFromExternals = externalCount * (session.publicPriceForExternals || course?.basePricePublic || 60);
      totalRevenue = revFromExternals;
      game.resources.money += totalRevenue;
      netGain = totalRevenue;

      // Attribution des compétences aux bénévoles internes certifiés
      session.registeredCandidates.forEach(vid => {
        const v = game.volunteers.find(vol => vol.id === vid);
        if (v && course) {
          this.grantCourseQualifications(v, course);
        }
      });
    } else {
      // Formation Grand Public
      totalRevenue = session.finalPrice * totalCount;
      const totalCost = (session.costOrganization || 25) * totalCount;
      netGain = totalRevenue - totalCost;
      game.resources.money += netGain;
      game.resources.reputationScore += (25 + (session.relationshipBonus || 0));
    }

    session.status = 'completed';
    game.saveGame();
    game.updateStatsUI();

    const msg = session.isInternal
      ? `Session interne validée : ${internalCount} bénévole(s) certifié(s) « ${course?.title || session.courseId} » ! ${externalCount > 0 ? `+${totalRevenue} € encaissés via ${externalCount} stagiaire(s) extérieur(s).` : ''}`
      : `Formation grand public validée : +${netGain} € de solde net et +${session.relationshipBonus || 15} relation publique !`;

    game.showToast('Formation Validée ! 🎓', msg, 'green');
    this.renderModal(game);
  },

  // Rendu de l'interface modale
  renderModal(game) {
    this.injectState(game);
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (!body || !title) return;

    title.textContent = 'Pôle Formations & Pédagogie de Sécurité Civile';
    subtitle.textContent = 'Cursus Grand Public, Secourisme Opérationnel, Recyclages FC, Soutien Psycho et Filière Formateurs';
    icon.setAttribute('data-lucide', 'graduation-cap');

    const trainers = (game.volunteers || []).filter(v => v.isTrainer || (v.skills && v.skills.some(s => s.startsWith('formateur') || s === 'cef' || s === 'picf')));

    const activeFilter = this.trainerFilter || 'all';
    const filteredTrainers = trainers.filter(v => {
      const skills = (v.skills || []).map(s => String(s).toLowerCase());
      if (activeFilter === 'psc') return v.isTrainer || skills.includes('formateur_psc') || skills.includes('formateur');
      if (activeFilter === 'ps') return skills.includes('formateur_ps') || (skills.includes('formateur') && (skills.includes('ce') || ['CE', 'CD'].includes(v.rank)));
      if (activeFilter === 'sst') return skills.includes('formateur_sst');
      if (activeFilter === 'fdf') return skills.includes('formateur_de_formateur');
      return true;
    });

    const fsq = (this.sessionSearchQuery || '').toLowerCase().trim();
    const activeSessions = (game.sessionsFormation || []).filter(s => {
      if (s.status === 'completed') return false;
      if (!fsq) return true;
      const trainer = game.volunteers.find(v => v.id === s.trainerId);
      const registeredVols = (s.registeredCandidates || []).map(vid => {
        const v = game.volunteers.find(vol => vol.id === vid);
        return v ? v.name : '';
      }).join(' ');
      const str = `${s.title} ${s.courseId} ${s.targetAudience} ${s.locationLabel || ''} ${trainer ? trainer.name : ''} ${registeredVols}`.toLowerCase();
      return str.includes(fsq);
    });

    body.innerHTML = `
      <div class="space-y-6">

        <!-- Bandeau d'information Doctrine Protec Civile -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-pc-blue text-white shadow-md flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">🎓</span>
            <div>
              <h4 class="font-black text-sm">Doctrine des Qualifications & Rôles de Sécurité Civile</h4>
              <p class="text-blue-100 text-[11px]">Pas de grade militaire : des rôles opérationnels (Secouriste, Équipier Secouriste, Chef d’équipe) conférés par des compétences certifiées.</p>
            </div>
          </div>
          <div class="hidden sm:flex flex-col text-right text-[11px] text-blue-200">
            <span>Sessions internes gratuites</span>
            <strong class="text-emerald-300 font-bold">Accueil extérieurs payants ✓</strong>
          </div>
        </div>

        <!-- Section 1 : Formateurs de l'antenne -->
        <div class="p-4 rounded-2xl glass-card space-y-3 border border-emerald-200">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5">
              <i data-lucide="award" class="w-4 h-4 text-emerald-600"></i> Formateurs & Cadres Pédagogiques (${trainers.length})
            </span>
            <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button onclick="window.ProtecFormations.setTrainerFilter('all')" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${activeFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'} transition cursor-pointer">Tous (${trainers.length})</button>
              <button onclick="window.ProtecFormations.setTrainerFilter('psc')" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${activeFilter === 'psc' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'} transition cursor-pointer">PSC</button>
              <button onclick="window.ProtecFormations.setTrainerFilter('ps')" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${activeFilter === 'ps' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'} transition cursor-pointer">PS (PSE)</button>
              <button onclick="window.ProtecFormations.setTrainerFilter('sst')" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${activeFilter === 'sst' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'} transition cursor-pointer">SST</button>
              <button onclick="window.ProtecFormations.setTrainerFilter('fdf')" class="px-2 py-0.5 rounded-lg text-[10px] font-bold ${activeFilter === 'fdf' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'} transition cursor-pointer">FdF</button>
            </div>
          </div>

          ${filteredTrainers.length === 0 ? `
            <p class="text-xs text-slate-500 italic py-1">Aucun formateur trouvé pour ce filtre. Formez vos bénévoles via le parcours PIC F puis Formateur PSC / PS !</p>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              ${filteredTrainers.map(t => {
                const qualifs = [];
                const s = (t.skills || []).map(x => String(x).toLowerCase());
                if (t.isTrainer || s.includes('formateur_psc') || s.includes('formateur')) qualifs.push('PSC');
                if (s.includes('formateur_ps') || (s.includes('formateur') && (s.includes('ce') || ['CE', 'CD'].includes(t.rank)))) qualifs.push('PS (PSE)');
                if (s.includes('formateur_sst')) qualifs.push('SST');
                if (s.includes('formateur_de_formateur')) qualifs.push('FdF');
                return `
                  <div class="p-2.5 rounded-xl bg-white border border-emerald-200 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      ${game.getVolunteerAvatarHTML ? game.getVolunteerAvatarHTML(t, 'w-7 h-7 text-[10px]') : '<span>👤</span>'}
                      <div>
                        <strong class="text-slate-800 block text-xs leading-tight">${t.name}</strong>
                        <span class="text-[9px] text-slate-400">${t.role || t.rank || 'Secouriste'}</span>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-1 justify-end max-w-[110px]">
                      ${qualifs.map(q => `<span class="px-1.5 py-0.2 rounded text-[8px] font-black bg-emerald-100 text-emerald-800">${q}</span>`).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Section 2 : Programmer une Session (Interne ou Grand Public) -->
        <div class="p-4 rounded-2xl glass-card space-y-3 border border-slate-200">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase text-slate-800">Ouvrir une nouvelle session au calendrier</h4>
            <span class="text-[10px] text-slate-400">Interne (Gratuit bénévoles) ou Grand Public</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Cursus Référentiel :</label>
              <select id="new-course-id" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800">
                <optgroup label="Grand Public & Entreprises">
                  <option value="GQS">GQS (2h - Sensibilisation)</option>
                  <option value="PSC" selected>PSC (7h - Certifiant)</option>
                  <option value="SST">SST (14h - Salariés Entreprises)</option>
                  <option value="EXTINCTEUR">Manipulation Extincteurs (3h - EPI)</option>
                </optgroup>
                <optgroup label="Secourisme Opérationnel">
                  <option value="PSE1">PSE1 (35h - Rôle Secouriste)</option>
                  <option value="PSE2">PSE2 (28h - Rôle Équipier Secouriste)</option>
                  <option value="FC_PSE">Recyclage FC PSE (6h - Maintien PSE 1 & 2)</option>
                  <option value="MAC_SST">Recyclage MAC SST (7h - Actualisation)</option>
                  <option value="CE">Chef d’Équipe (21h - Rôle & Compétence CE)</option>
                  <option value="CD">Chef de Dispositif (24h - Commandement CD)</option>
                  <option value="SSA">SSA (28h - Sauvetage Aquatique)</option>
                </optgroup>
                <optgroup label="Soutien Psychologique (AEP)">
                  <option value="AEP1">AEP1 - Sensibilisation Écoute (7h)</option>
                  <option value="AEP2">AEP2 - Prise en charge & CAI (14h)</option>
                </optgroup>
                <optgroup label="Filière Pédagogique (Formateurs)">
                  <option value="PICF">PIC F - Pédagogie Initiale de Formateur (21h)</option>
                  <option value="FORM_PSC">Formateur PSC (14h - Req: PIC F)</option>
                  <option value="FORM_PS">Formateur PS - Premiers Secours (28h)</option>
                  <option value="FORM_SST">Formateur SST Entreprises (21h)</option>
                  <option value="FORM_AEP">Formateur AEP Psycho (21h)</option>
                  <option value="CEF">CEF - Encadrant Formation (35h)</option>
                  <option value="FDF">Formateur de Formateurs - FdF (42h)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Modalité & Public :</label>
              <select id="new-course-tariff" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800" onchange="
                const isInt = this.value.startsWith('internal');
                document.getElementById('external-attendees-wrap').style.display = isInt ? 'block' : 'none';
              ">
                <option value="internal_free" selected>Interne Antenne (Gratuit bénévoles)</option>
                <option value="standard">Grand Public / Entreprises (Tarif normal)</option>
                <option value="discount_25">Partenaire Associatif (-25%)</option>
                <option value="discount_50">Mairie Partenaire (-50%)</option>
                <option value="free_mairie">Gratuité Mairie (+35 Relation)</option>
              </select>
            </div>

            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Lieu d'accueil :</label>
              <select id="new-course-loc" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-pc-blue">
                <option value="antenne">🏛️ À l’Antenne (Salle requise)</option>
                <option value="entreprise">🏢 Chez le Partenaire / Entreprise</option>
              </select>
            </div>

            <div id="external-attendees-wrap">
              <label class="text-[10px] font-bold uppercase text-slate-400">Extérieurs payants accueillis :</label>
              <select id="new-external-count" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-emerald-700">
                <option value="0">0 externe (100% équipe)</option>
                <option value="2">2 candidats extérieurs payants</option>
                <option value="4">4 candidats extérieurs payants</option>
                <option value="6">6 candidats extérieurs payants</option>
              </select>
            </div>

            <div class="sm:col-span-4 flex justify-end pt-1">
              <button onclick="
                const cId = document.getElementById('new-course-id').value;
                const cLoc = document.getElementById('new-course-loc').value;
                const tTar = document.getElementById('new-course-tariff').value;
                const extCnt = document.getElementById('new-external-count').value;
                const isInt = tTar.startsWith('internal');
                window.ProtecFormations.createSession(window.game, cId, tTar, isInt, isInt ? 'Bénévoles de l’Antenne' : (cLoc === 'entreprise' ? 'Salariés Entreprise' : 'Grand Public'), cLoc, extCnt);
              " class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="plus-circle" class="w-4 h-4"></i>
                Programmer la Session
              </button>
            </div>
          </div>
        </div>

        <!-- Section 3 : Sessions au Calendrier -->
        <div class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 class="text-xs font-black uppercase text-slate-800">Sessions Ouvertes (${activeSessions.length})</h4>
              <span class="text-[10px] text-slate-400">Affectation du formateur et gestion des candidats</span>
            </div>
            <div class="relative w-full sm:w-64">
              <input 
                type="text" 
                id="formation-search-input" 
                value="${this.sessionSearchQuery || ''}" 
                placeholder="🔍 Rechercher une session..." 
                oninput="window.ProtecFormations.setSessionSearch(this.value, window.game)" 
                class="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pc-blue transition"
              />
              ${this.sessionSearchQuery ? `
                <button onclick="window.ProtecFormations.setSessionSearch('', window.game)" class="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
              ` : ''}
            </div>
          </div>

          ${activeSessions.length === 0 ? `
            <div class="p-6 rounded-2xl glass-card text-center text-xs text-slate-500">
              Aucune session de formation n'est actuellement planifiée. Programmez une session ci-dessus.
            </div>
          ` : ''}

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${activeSessions.map(sess => {
              const assignedTrainer = game.volunteers.find(v => v.id === sess.trainerId);
              const isInternal = sess.isInternal;
              const course = this.catalog.find(c => c.id === sess.courseId);
              const extCount = sess.externalAttendeesCount || 0;
              const extRevenue = extCount * (sess.publicPriceForExternals || course?.basePricePublic || 60);

              return `
                <div class="p-4 rounded-2xl glass-card border border-white/80 shadow-sm space-y-3 flex flex-col justify-between">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase ${isInternal ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}">
                        ${isInternal ? 'Session Interne (Gratuit Bénévoles)' : 'Grand Public / Partenaire'}
                      </span>
                      <span class="text-xs font-bold font-mono text-slate-700">
                        ${isInternal ? (extCount > 0 ? `<span class="text-emerald-600 font-black">+${extRevenue} € (via ${extCount} ext.)</span>` : '<span class="text-indigo-600 font-bold">Gratuit antenne</span>') : `${sess.finalPrice} € / pers.`}
                      </span>
                    </div>

                    <h5 class="text-xs font-black text-slate-900">${sess.title}</h5>
                    <p class="text-[11px] text-slate-500">
                      ${sess.targetAudience} • Jauge : <strong>${sess.registeredCandidates.length} bénévoles + ${extCount} ext. / ${sess.maxCandidates}</strong> stagiaires
                    </p>

                    ${course?.kitRequired ? `
                      <div class="text-[10px] ${this.hasTrainingKit(game, course.kitRequired) ? 'text-emerald-700' : 'text-amber-700'} font-bold flex items-center gap-1">
                        <span>${this.hasTrainingKit(game, course.kitRequired) ? '✓ Kit en stock :' : '⚠️ Kit requis :'}</span>
                        <span>${course.kitName || course.kitRequired}</span>
                      </div>
                    ` : ''}

                    <!-- Formateur affecté -->
                    <div class="p-2.5 rounded-xl bg-slate-50 space-y-1">
                      <span class="text-[9px] font-bold uppercase text-slate-400">Formateur responsable :</span>
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-black text-slate-800">${assignedTrainer ? `${assignedTrainer.name} (${assignedTrainer.role || assignedTrainer.rank})` : '<span class="text-amber-600 font-bold">Aucun formateur affecté</span>'}</span>
                      </div>
                      <select onchange="window.ProtecFormations.assignTrainer(window.game, '${sess.id}', this.value)" class="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 glass-input font-medium mt-1">
                        <option value="">Affecter un formateur qualifié...</option>
                        ${trainers.map(t => {
                          const isEligible = course ? this.isEligibleTrainer(t, course) : { eligible: true };
                          return `
                            <option value="${t.id}" ${sess.trainerId === t.id ? 'selected' : ''} class="${isEligible.eligible ? 'text-slate-800 font-bold' : 'text-slate-400 italic'}">
                              ${isEligible.eligible ? '[✓ Qualifié] ' : '[⚠️ Non qualifié] '} ${t.name} (${t.role || t.rank})
                            </option>
                          `;
                        }).join('')}
                      </select>
                    </div>

                    ${isInternal ? `
                      <!-- Inscription des bénévoles internes (Gratuit) -->
                      <div class="pt-2 border-t border-slate-100 space-y-1.5">
                        <span class="text-[9px] font-bold uppercase text-slate-400 block">Inscrire un bénévole de l'antenne (Gratuit 0 €) :</span>
                        <select onchange="if(this.value) window.ProtecFormations.registerVolunteerToInternal(window.game, '${sess.id}', this.value); this.value='';" class="w-full text-xs p-1.5 rounded-lg border border-slate-200 glass-input font-bold text-pc-blue">
                          <option value="">+ Sélectionner un bénévole...</option>
                          ${(game.volunteers || []).filter(v => !sess.registeredCandidates.includes(v.id)).map(v => `
                            <option value="${v.id}">${v.name} (${v.role || v.rank} • Moral : ${v.motivation || 80}%)</option>
                          `).join('')}
                        </select>
                        <div class="flex flex-wrap gap-1 pt-1">
                          ${sess.registeredCandidates.map(vid => {
                            const vol = game.volunteers.find(v => v.id === vid);
                            return `<span class="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">${vol?.name || 'Bénévole'}</span>`;
                          }).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- Validation de la session -->
                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span class="text-[10px] text-slate-400">${sess.relationshipBonus ? `+${sess.relationshipBonus} Relation mairie` : 'Délivrance des attestations'}</span>
                    <button onclick="window.ProtecFormations.completeSession(window.game, '${sess.id}')" class="px-3.5 py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white text-xs font-black shadow transition flex items-center gap-1 cursor-pointer">
                      <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                      Valider & Certifier
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Section 4 : Formations Individuelles en Stage Externe -->
        <div class="p-4 rounded-2xl glass-card space-y-3 border border-indigo-100 bg-indigo-50/20">
          <div>
            <h4 class="text-xs font-black uppercase text-indigo-950">Inscrire un bénévole en stage externe</h4>
            <p class="text-[11px] text-slate-500">Si l'antenne ne dispose pas du formateur ou du kit requis, le bénévole peut être envoyé en organisme extérieur. L'antenne peut financer à 100% ou laisser le bénévole régler de sa poche.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Bénévole :</label>
              <select id="ext-vol-id" class="w-full p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800">
                ${(game.volunteers || []).map(v => `<option value="${v.id}">${v.name} (${v.role || v.rank})</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Stage externe :</label>
              <select id="ext-course-id" class="w-full p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800">
                <option value="PSC">PSC (60 €)</option>
                <option value="SST">SST (180 €)</option>
                <option value="PSE1">PSE1 (250 €)</option>
                <option value="PSE2">PSE2 (280 €)</option>
                <option value="CE">Chef d’Équipe - CE (350 €)</option>
                <option value="SSA">SSA Sauvetage Aquatique (310 €)</option>
                <option value="PICF">PIC F Formateur (220 €)</option>
                <option value="FORM_PSC">Formateur PSC (180 €)</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Prise en charge :</label>
              <select id="ext-pay-mode" class="w-full p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800">
                <option value="asso">100% Antenne (Moral boosté)</option>
                <option value="vol">Bénévole finance lui-même (Moral -25%)</option>
              </select>
            </div>
            <div class="flex items-end">
              <button onclick="
                const vId = document.getElementById('ext-vol-id').value;
                const cId = document.getElementById('ext-course-id').value;
                const pMd = document.getElementById('ext-pay-mode').value;
                window.ProtecFormations.registerVolunteerExternal(window.game, vId, cId, pMd);
              " class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow transition cursor-pointer">
                Inscrire en Stage Externe
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  sessionSearchQuery: '',

  setSessionSearch(query, game) {
    this.sessionSearchQuery = query;
    if (game) {
      this.renderModal(game);
      const input = document.getElementById('formation-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  },

  setTrainerFilter(f) {
    this.trainerFilter = f;
    if (window.game) this.renderModal(window.game);
  }
};
