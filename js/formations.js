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

  // --- ÉTAT ET CONFIGURATIONS DU SYSTÈME B2B (ENTREPRISES & INSTITUTIONS) ---
  mainTab: 'entreprises', // 'entreprises' ou 'grand_public'
  b2bFilter: 'tous', // 'tous', 'pending', 'evaluating', 'accepted', 'completed'
  activeQuoteModalProposalId: null,

  // Référentiel des formations B2B proposées aux entreprises
  TRAINING_B2B_CONFIG: {
    'SST': {
      title: 'SST - Sauveteur Secouriste du Travail (Initial)',
      badge: 'SST 14h',
      desc: 'Formation certifiante INRS de 14 heures pour les salariés d’entreprises, usines et chantiers.',
      durationHours: 14,
      minAttendees: 6,
      maxAttendees: 10,
      baseBudget: 1400,
      budgetMin: 1100,
      budgetMax: 1800,
      consumableCost: 110,
      kitRequired: 'kit_pedago_sst',
      kitName: 'Kit Pédagogique SST',
      trainerSkillReq: 'formateur_sst',
      trainerSkillLabel: 'Formateur SST',
      repGain: 18,
      isSST: true
    },
    'MAC_SST': {
      title: 'MAC SST - Maintien & Actualisation des Compétences',
      badge: 'MAC SST 7h',
      desc: 'Recyclage obligatoire périodique de 7 heures (tous les 24 mois) pour renouveler la carte SST.',
      durationHours: 7,
      minAttendees: 6,
      maxAttendees: 10,
      baseBudget: 850,
      budgetMin: 650,
      budgetMax: 1150,
      consumableCost: 65,
      kitRequired: 'kit_pedago_sst',
      kitName: 'Kit Pédagogique SST',
      trainerSkillReq: 'formateur_sst',
      trainerSkillLabel: 'Formateur SST',
      repGain: 12,
      isRecycling: true
    },
    'PSC': {
      title: 'PSC - Prévention et Secours Civiques (Collectif)',
      badge: 'PSC 7h',
      desc: 'Formation citoyenne certifiante de 7 heures pour les agents territoriaux, enseignants et personnels associatifs.',
      durationHours: 7,
      minAttendees: 7,
      maxAttendees: 10,
      baseBudget: 650,
      budgetMin: 480,
      budgetMax: 900,
      consumableCost: 50,
      kitRequired: 'kit_pedago_psc',
      kitName: 'Kit Pédagogique PSC',
      trainerSkillReq: 'formateur_psc',
      trainerSkillLabel: 'Formateur PSC / PS',
      repGain: 10
    },
    'GQS': {
      title: 'GQS - Gestes Qui Sauvent (Sensibilisation)',
      badge: 'GQS 2h',
      desc: 'Atelier de sensibilisation courte (2h) : massage cardiaque, défibrillateur DAE et gestes d’urgence face aux hémorragies.',
      durationHours: 2,
      minAttendees: 10,
      maxAttendees: 15,
      baseBudget: 350,
      budgetMin: 220,
      budgetMax: 480,
      consumableCost: 25,
      kitRequired: 'kit_pedago_psc',
      kitName: 'Kit Pédagogique PSC',
      trainerSkillReq: 'formateur_psc',
      trainerSkillLabel: 'Formateur PSC / PS',
      repGain: 6
    }
  },

  // Vivier de clients potentiels et activités économiques
  CLIENT_PRESETS: [
    { name: 'Bouygues Bâtiment Grand Est', type: 'btp', label: 'BTP & Chantier Gros Œuvre', icon: 'hard-hat' },
    { name: 'Eiffage Travaux Publics', type: 'btp', label: 'Génie Civil & BTP', icon: 'hard-hat' },
    { name: 'Vinci Construction Métropole', type: 'btp', label: 'Travaux Publics & Ouvrages', icon: 'hard-hat' },
    { name: 'Amazon Logistics Platform', type: 'industrie', label: 'Plateforme Logistique', icon: 'truck' },
    { name: 'Entrepôts Stef Frais', type: 'industrie', label: 'Chaîne Logistique & Transport', icon: 'truck' },
    { name: 'ArcelorMittal Site Industriel', type: 'industrie', label: 'Usine Sidérurgie & Fonderie', icon: 'factory' },
    { name: 'Safran Aérostructures', type: 'industrie', label: 'Haute Technologie Aéronautique', icon: 'plane' },
    { name: 'Mairie Centrale - Services Techniques', type: 'mairie', label: 'Collectivité / Mairie', icon: 'landmark' },
    { name: 'Communauté Urbaine Métropole', type: 'mairie', label: 'Agents Intercommunaux', icon: 'landmark' },
    { name: 'Médiathèque Municipale & Culture', type: 'mairie', label: 'Service Public Municipal', icon: 'landmark' },
    { name: 'Lycée Polyvalent Régional', type: 'scolaire', label: 'Enseignement Secondaire & Pro', icon: 'graduation-cap' },
    { name: 'Collège Saint-Exupéry', type: 'scolaire', label: 'Personnel Éducatif & Enseignants', icon: 'graduation-cap' },
    { name: 'Groupe Scolaire Pasteur (ATSEM)', type: 'scolaire', label: 'Écoles Primaires & Petite Enfance', icon: 'graduation-cap' },
    { name: 'Galeries Lafayette & Centre Commercial', type: 'commerce', label: 'Commerce & Retail', icon: 'shopping-bag' },
    { name: 'Leroy Merlin - Équipe Sécurité', type: 'commerce', label: 'Grande Distribution Bricolage', icon: 'shopping-bag' },
    { name: 'Siège Régional Banque Populaire', type: 'commerce', label: 'Secteur Tertiaire & Bureaux', icon: 'building' },
    { name: 'Complexe Aquatique Métropolitain', type: 'sport', label: 'Sports & Loisirs Nautiques', icon: 'activity' },
    { name: 'Club Omnisports Régional', type: 'sport', label: 'Association Sportive & Éducateurs', icon: 'trophy' }
  ],

  // Initialisation de l'état
  injectState(game) {
    if (!game.sessionsFormation) {
      game.sessionsFormation = [];
    }
    if (!game.formationB2BProposals) {
      game.formationB2BProposals = [];
    }
    this.generateB2BOpportunities(game);
  },

  setMainTab(tab) {
    this.mainTab = tab;
    if (window.game) this.renderModal(window.game);
  },

  setB2BFilter(f) {
    this.b2bFilter = f;
    if (window.game) this.renderModal(window.game);
  },

  // 1. GÉNÉRATEUR D'OPPORTUNITÉS B2B ENTRANTES
  generateB2BOpportunities(game, forceNew = false) {
    if (!game) return;
    if (!game.formationB2BProposals) game.formationB2BProposals = [];

    const now = Date.now();

    // Nettoyage des opportunités non traitées dont la date butoir est échue
    game.formationB2BProposals = game.formationB2BProposals.filter(p => {
      if (p.status === 'pending_quote' && p.deadline && now > p.deadline) {
        return false;
      }
      return true;
    });

    const activeCount = game.formationB2BProposals.filter(p => ['pending_quote', 'evaluating', 'accepted', 'in_progress'].includes(p.status)).length;
    const targetPool = forceNew ? (activeCount + 1) : Math.max(3, Math.min(5, 3 + Math.floor((game.resources?.reputationScore || 50) / 100)));

    if (activeCount < targetPool || forceNew) {
      const needed = forceNew ? 1 : (targetPool - activeCount);
      const station = game.stations?.[0] || { city: 'Paris', id: 'station-1' };
      const deptCode = game.currentDepartmentCode || game.player?.departmentCode || '75';

      for (let i = 0; i < needed; i++) {
        // Choix du type de formation (Pondération : SST 40%, MAC_SST 25%, PSC 20%, GQS 15%)
        const roll = Math.random();
        let trainingType = 'SST';
        if (roll < 0.40) trainingType = 'SST';
        else if (roll < 0.65) trainingType = 'MAC_SST';
        else if (roll < 0.85) trainingType = 'PSC';
        else trainingType = 'GQS';

        const cfg = this.TRAINING_B2B_CONFIG[trainingType];
        const clientPreset = this.CLIENT_PRESETS[Math.floor(Math.random() * this.CLIENT_PRESETS.length)];
        const attendeesCount = Math.floor(Math.random() * (cfg.maxAttendees - cfg.minAttendees + 1)) + cfg.minAttendees;

        // Modalité : 65% Intra-entreprise (chez le client) vs 35% Inter-entreprise (à l'antenne)
        // Les entreprises paient plus cher (+30%) pour faire venir le formateur dans leurs locaux plutôt que de déplacer leurs salariés
        const mode = Math.random() < 0.65 ? 'intra' : 'inter';
        const intraSurplus = mode === 'intra' ? 1.30 : 1.0;

        // Budget indicatif du client avec majoration sur site client
        const variation = (0.88 + Math.random() * 0.28) * intraSurplus; // Majoration de ~30% si intra
        const targetBudget = Math.round((cfg.baseBudget * variation) / 10) * 10;

        // Délai de réponse accordé à l'antenne (de 24h à 72h réelles / simulées)
        const deadlineHours = 24 + Math.floor(Math.random() * 48);
        const deadline = now + (deadlineHours * 3600 * 1000);

        const proposalId = `b2b-${now}-${Math.random().toString(36).substring(2, 7)}`;

        const newProposal = {
          id: proposalId,
          department_code: deptCode,
          antenne_id: station.id || 'station-1',
          client_name: clientPreset.name,
          client_type: clientPreset.type,
          client_label: clientPreset.label,
          client_icon: clientPreset.icon,
          client_city: station.city || 'Nancy',
          training_type: trainingType,
          attendees_count: attendeesCount,
          mode: mode,
          client_target_budget: targetBudget,
          clientTargetBudget: targetBudget,
          proposed_price: null,
          proposedPrice: null,
          acceptance_rate: 75,
          acceptanceRate: 75,
          status: 'pending_quote', // 'pending_quote', 'evaluating', 'accepted', 'rejected', 'in_progress', 'completed'
          trainer_id: null,
          trainerId: null,
          vehicle_id: null,
          vehicleId: null,
          consumable_cost: cfg.consumableCost,
          consumableCost: cfg.consumableCost,
          deadline: deadline,
          evaluation_ends_at: null,
          evaluationEndsAt: null,
          created_at: new Date(now).toISOString(),
          createdAt: now
        };

        game.formationB2BProposals.unshift(newProposal);
        this.syncB2BWithSupabase(game, newProposal);
      }

      game.saveGame();
    }
  },

  // 2. CALCUL DYNAMIQUE DE LA PROBABILITÉ D'ACCORD (JAUGE LIVE)
  calculateQuoteOdds(game, proposal, proposedPrice) {
    if (!proposal) return { odds: 50, label: 'Inconnu' };

    const target = Number(proposal.client_target_budget || proposal.clientTargetBudget || 1200);
    const price = Number(proposedPrice);

    if (!price || isNaN(price) || price <= 0) {
      return { odds: 0, label: 'Montant requis', baseOdds: 0, repBonus: 0, conventionBonus: 0, marginNet: 0 };
    }

    const ratio = price / target;
    let baseOdds = 75;

    if (ratio <= 0.80) {
      baseOdds = 96;
    } else if (ratio <= 1.00) {
      baseOdds = 96 - ((ratio - 0.80) / 0.20) * 16; // 96% -> 80%
    } else if (ratio <= 1.15) {
      baseOdds = 80 - ((ratio - 1.00) / 0.15) * 26; // 80% -> 54%
    } else if (ratio <= 1.30) {
      baseOdds = 54 - ((ratio - 1.15) / 0.15) * 28; // 54% -> 26%
    } else if (ratio <= 1.55) {
      baseOdds = 26 - ((ratio - 1.30) / 0.25) * 19; // 26% -> 7%
    } else {
      baseOdds = Math.max(1, 7 - (ratio - 1.55) * 12);
    }

    // Bonus de Réputation de l'antenne (+0% à +15%)
    const currentRep = game?.resources?.reputationScore || 50;
    const repBonus = Math.min(15, Math.round(Math.max(0, currentRep - 30) / 7));

    // Bonus des conventions officielles et APC départementale (+5% à +10%)
    let conventionBonus = 0;
    if (window.ProtecAPC && typeof window.ProtecAPC.getEffectiveMultiplier === 'function' && window.ProtecAPC.getEffectiveMultiplier(game) > 1) {
      conventionBonus += 6;
    }
    if (game?.conventions && game.conventions.length > 0) {
      conventionBonus += 4;
    }

    const totalOdds = Math.max(2, Math.min(98, Math.round(baseOdds + repBonus + conventionBonus)));
    const consumable = Number(proposal.consumable_cost || proposal.consumableCost || 80);
    const marginNet = Math.max(0, price - consumable);

    return {
      odds: totalOdds,
      ratio: ratio,
      baseOdds: Math.round(baseOdds),
      repBonus: repBonus,
      conventionBonus: conventionBonus,
      marginNet: marginNet
    };
  },

  // 3. POLITIQUE TARIFAIRE PAR DÉFAUT FIXÉE PAR LE JOUEUR & GESTION DU DEVIS
  getDefaultQuotePrice(game, proposal) {
    if (!proposal) return 1000;
    const target = Number(proposal.client_target_budget || proposal.clientTargetBudget || 1200);
    const markup = (game && game.formationDefaultMarkup !== undefined) ? Number(game.formationDefaultMarkup) : 1.0;
    return Math.max(50, Math.round((target * markup) / 10) * 10);
  },

  setDefaultPricingMarkup(game, markup) {
    if (!game) return;
    game.formationDefaultMarkup = Number(markup) || 1.0;
    game.saveGame();
    if (this.activeQuoteModalProposalId) {
      const proposal = (game.formationB2BProposals || []).find(p => p.id === this.activeQuoteModalProposalId);
      if (proposal) {
        const defPr = this.getDefaultQuotePrice(game, proposal);
        this.updateQuoteModalLive(proposal.id, defPr);
      }
    }
    this.renderModal(game);
  },

  openQuoteModal(proposalId) {
    this.activeQuoteModalProposalId = proposalId;
    if (window.game) {
      const proposal = (window.game.formationB2BProposals || []).find(p => p.id === proposalId);
      if (proposal && !proposal.proposed_price) {
        proposal.proposed_price = this.getDefaultQuotePrice(window.game, proposal);
        proposal.proposedPrice = proposal.proposed_price;
      }
      this.renderModal(window.game);
    }
  },

  closeQuoteModal() {
    this.activeQuoteModalProposalId = null;
    if (window.game) this.renderModal(window.game);
  },

  updateQuoteModalLive(proposalId, newPrice) {
    if (!window.game) return;
    const proposal = (window.game.formationB2BProposals || []).find(p => p.id === proposalId);
    if (!proposal) return;

    const price = Math.max(10, Number(newPrice) || 0);
    const syncInput = document.getElementById('b2b-quote-price-input');
    const syncSlider = document.getElementById('b2b-quote-price-slider');
    if (syncInput && document.activeElement !== syncInput) syncInput.value = price;
    if (syncSlider && document.activeElement !== syncSlider) syncSlider.value = price;

    const oddsData = this.calculateQuoteOdds(window.game, proposal, price);
    const marginDisplay = document.getElementById('b2b-quote-margin-display');

    if (marginDisplay) {
      marginDisplay.textContent = `+${oddsData.marginNet.toLocaleString('fr-FR')} € net`;
    }
  },

  // 4. ÉMISSION & VALIDATION DU DEVIS PAR LE JOUEUR
  submitQuote(game, proposalId, proposedPrice) {
    if (!game) return;
    const proposal = (game.formationB2BProposals || []).find(p => p.id === proposalId);
    if (!proposal) return;

    const price = Math.max(10, Math.round(Number(proposedPrice) || 0));
    if (price <= 0) {
      game.showToast('Montant Invalide', 'Veuillez saisir un tarif supérieur à 0 €.', 'orange');
      return;
    }

    const oddsData = this.calculateQuoteOdds(game, proposal, price);

    proposal.proposed_price = price;
    proposal.proposedPrice = price;
    proposal.acceptance_rate = oddsData.odds;
    proposal.acceptanceRate = oddsData.odds;
    proposal.status = 'evaluating';

    // 40 secondes réelles de délibération de la direction cliente
    proposal.evaluationEndsAt = Date.now() + 40000;
    proposal.evaluation_ends_at = new Date(proposal.evaluationEndsAt).toISOString();

    this.activeQuoteModalProposalId = null;
    this.syncB2BWithSupabase(game, proposal);
    game.saveGame();

    game.showToast(
      'Devis Transmis ! 📨',
      `Votre proposition commerciale de ${price.toLocaleString('fr-FR')} € a été remise à la direction de « ${proposal.client_name} ». Délibération en cours...`,
      'blue'
    );

    this.renderModal(game);
  },

  // 5. RÉSOLUTION DE LA DÉCISION DU CLIENT (ACCORD OU REFUS)
  resolveQuote(game, proposalId, forceInstant = false) {
    if (!game) return;
    const proposal = (game.formationB2BProposals || []).find(p => p.id === proposalId);
    if (!proposal || proposal.status !== 'evaluating') return;

    if (!forceInstant && proposal.evaluationEndsAt && Date.now() < proposal.evaluationEndsAt) {
      game.showToast('Délibération en Cours', `La direction de « ${proposal.client_name} » étudie votre devis. Décision imminente !`, 'blue');
      return;
    }

    const roll = Math.random() * 100;
    const won = roll <= (proposal.acceptance_rate || 75);

    if (won) {
      proposal.status = 'accepted';
      if (window.ProtecAdvanced && typeof window.ProtecAdvanced.recordDevisSigned === 'function') {
        window.ProtecAdvanced.recordDevisSigned(game, proposal);
      }
      game.showToast(
        'Devis Signé ! 🎉',
        `L’entreprise « ${proposal.client_name} » a accepté votre devis de ${proposal.proposed_price.toLocaleString('fr-FR')} € ! Affectez votre formateur et planifiez la session.`,
        'green'
      );
    } else {
      proposal.status = 'rejected';
      const isTooExpensive = proposal.proposed_price > (proposal.client_target_budget * 1.15);
      proposal.rejectionReason = isTooExpensive
        ? 'Tarif jugé excessif par rapport à l’offre d’un organisme concurrent.'
        : 'Projet interne suspendu ou réorientation budgétaire du client.';

      game.showToast(
        'Devis Décliné ❌',
        `« ${proposal.client_name} » n’a pas retenu votre offre (${proposal.rejectionReason}).`,
        'orange'
      );
    }

    this.syncB2BWithSupabase(game, proposal);
    game.saveGame();
    this.renderModal(game);
  },

  // 6. DÉMARRAGE DE LA SESSION B2B SIGNÉE
  startB2BSession(game, proposalId, trainerId, vehicleId) {
    if (!game) return;
    const proposal = (game.formationB2BProposals || []).find(p => p.id === proposalId);
    if (!proposal || proposal.status !== 'accepted') return;

    // A. Contrôle du formateur
    const trainer = (game.volunteers || []).find(v => v.id === trainerId);
    if (!trainer) {
      game.showToast('Formateur Requis', 'Veuillez sélectionner un formateur disponible dans la liste.', 'orange');
      return;
    }
    if (trainer.status !== 'dispo') {
      game.showToast('Formateur Indisponible', `${trainer.name} est actuellement engagé(e) (${trainer.status}). Choisissez un autre formateur ou attendez son retour.`, 'orange');
      return;
    }

    const check = this.isEligibleTrainer(trainer, { id: proposal.training_type });
    if (!check.eligible) {
      game.showToast('Habilitation Insuffisante', `${trainer.name} n'est pas qualifié(e) pour animer ce cursus : ${check.reason}`, 'orange');
      return;
    }

    // B. Contrôle du véhicule si modalité Intra (déplacement chez le client avec les malles)
    let vehicle = null;
    if (proposal.mode === 'intra') {
      if (!vehicleId) {
        game.showToast('Véhicule Requis', 'La session a lieu chez le client (Intra) : affectez un véhicule de transport (VL, VTU, VTP) pour convoyer les malles de formation.', 'orange');
        return;
      }
      vehicle = (game.vehicles || []).find(v => v.id === vehicleId);
      if (!vehicle || vehicle.status !== 'dispo') {
        game.showToast('Véhicule Indisponible', 'Le véhicule sélectionné n’est pas disponible à l’antenne.', 'orange');
        return;
      }
    }

    // C. Contrôle de la salle de formation si modalité Inter (accueil à l'antenne)
    if (proposal.mode === 'inter') {
      if (window.ProtecLocaux && !window.ProtecLocaux.hasFormationRoom(game)) {
        game.showToast(
          'Salle Pédagogique Requise !',
          'La session est en inter-entreprises (dans vos locaux) : vous devez d’abord aménager une salle de formation dans le Bâtiment (Onglet Locaux).',
          'orange'
        );
        return;
      }
    }

    // D. Contrôle du lot pédagogique
    const cfg = this.TRAINING_B2B_CONFIG[proposal.training_type];
    if (cfg.kitRequired && !this.hasTrainingKit(game, cfg.kitRequired)) {
      game.showToast(
        'Lot Pédagogique Requis !',
        `L’antenne doit posséder le lot de formation « ${cfg.kitName} » pour assurer cette session. Commandez-le dans l'onglet Logistique !`,
        'orange'
      );
      return;
    }

    // Réservation opérationnelle des ressources
    trainer.status = 'formation_b2b';
    if (vehicle) vehicle.status = 'formation_b2b';

    proposal.trainer_id = trainer.id;
    proposal.trainerId = trainer.id;
    proposal.vehicle_id = vehicle ? vehicle.id : null;
    proposal.vehicleId = vehicle ? vehicle.id : null;
    proposal.status = 'in_progress';
    proposal.startedAt = Date.now();

    this.syncB2BWithSupabase(game, proposal);
    game.saveGame();

    game.showToast(
      'Session B2B Lancée ! 🚀',
      `La formation ${proposal.training_type} chez « ${proposal.client_name} » a débuté. Formateur : ${trainer.name} ${vehicle ? `(Convoyage : ${vehicle.name})` : ''}.`,
      'blue'
    );

    this.renderModal(game);
  },

  // 7. CLÔTURE, FACTURATION ET CERTIFICATION DE LA SESSION B2B
  completeB2BSession(game, proposalId) {
    if (!game) return;
    const proposal = (game.formationB2BProposals || []).find(p => p.id === proposalId);
    if (!proposal || !['in_progress', 'accepted'].includes(proposal.status)) return;

    // Libération du formateur
    const trainerId = proposal.trainer_id || proposal.trainerId;
    const trainer = (game.volunteers || []).find(v => v.id === trainerId);
    if (trainer) {
      trainer.status = 'dispo';
      trainer.exp = (trainer.exp || 0) + 25;
      trainer.motivation = Math.min(100, (trainer.motivation || 80) + 12);
      trainer.humeur = Math.min(100, (trainer.humeur || 80) + 10);
    }

    // Libération du véhicule
    const vehicleId = proposal.vehicle_id || proposal.vehicleId;
    const vehicle = (game.vehicles || []).find(v => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = 'dispo';
      vehicle.fuel = Math.max(15, (vehicle.fuel || 90) - 10);
      vehicle.mileage = (vehicle.mileage || 110000) + Math.floor(Math.random() * 25 + 15);
    }

    // Décompte financier : Encaissement du devis et déduction des consommables pédagogiques
    const grossPrice = Number(proposal.proposed_price || proposal.proposedPrice || proposal.client_target_budget || 1200);
    const consumableCost = Number(proposal.consumable_cost || proposal.consumableCost || 80);
    const netGain = Math.max(0, grossPrice - consumableCost);

    game.resources.money += netGain;

    // Écritures comptables dans le grand livre
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        grossPrice,
        `Facturation B2B : ${proposal.client_name} (${proposal.training_type} - ${proposal.attendees_count} stagiaires)`,
        'formation'
      );
      window.ProtecFinances.recordTransaction(
        game,
        -consumableCost,
        `Consommables Formation (Peaux, Masques, DAE) : ${proposal.client_name}`,
        'materiel'
      );
    }

    // Gain de réputation territoriale
    const cfg = this.TRAINING_B2B_CONFIG[proposal.training_type] || {};
    const repGain = cfg.repGain || 14;
    game.resources.reputationScore = (game.resources.reputationScore || 50) + repGain;

    // Fidélisation : Si la formation est un SST initial, programmer un rappel MAC SST pour ce client
    if (proposal.training_type === 'SST') {
      this.createMacSstReminder(game, proposal);
    }

    proposal.status = 'completed';
    proposal.completedAt = Date.now();
    proposal.completed_at = new Date().toISOString();

    if (window.ProtecCommunication) {
      window.ProtecCommunication.createPhotoFolder(game, {
        sourceType: 'formation',
        title: `Formation Entreprise : ${proposal.courseTitle || proposal.courseId || proposal.training_type || 'SST'} (${proposal.companyName || proposal.company_name || 'Partenaire'})`,
        isFormation: true,
        photographerNames: 'Pôle Pédagogique & Communication',
        baseReputationGain: 18,
        baseVisibilityGain: 22,
        baseLikes: 55,
        baseShares: 14
      });
    }

    this.syncB2BWithSupabase(game, proposal);
    game.saveGame();

    game.showToast(
      'Session B2B Validée & Certifiée ! 🎓',
      `Facturation honorée : +${grossPrice.toLocaleString('fr-FR')} € (-${consumableCost} € consommables déduits, soit +${netGain.toLocaleString('fr-FR')} € net) !`,
      'green'
    );

    this.renderModal(game);
  },

  // 8. FIDÉLISATION & RAPPEL AUTOMATIQUE DE RECYCLAGE MAC SST
  createMacSstReminder(game, completedProposal) {
    if (!game || !completedProposal) return;
    if (!game.formationB2BProposals) game.formationB2BProposals = [];

    // Déclenchement d'une future opportunité de recyclage MAC SST pour cette entreprise
    const now = Date.now();
    const reminderProposal = {
      id: `b2b-mac-${now}-${Math.random().toString(36).substring(2, 6)}`,
      department_code: completedProposal.department_code || '54',
      antenne_id: completedProposal.antenne_id || 'station-1',
      client_name: completedProposal.client_name,
      client_type: completedProposal.client_type,
      client_label: completedProposal.client_label,
      client_icon: completedProposal.client_icon,
      client_city: completedProposal.client_city,
      training_type: 'MAC_SST',
      attendees_count: completedProposal.attendees_count,
      mode: completedProposal.mode,
      client_target_budget: 850,
      clientTargetBudget: 850,
      proposed_price: null,
      proposedPrice: null,
      acceptance_rate: 90, // Bonus de fidélité pour recyclage de clients déjà formés chez nous
      acceptanceRate: 90,
      status: 'pending_quote',
      trainer_id: null,
      vehicle_id: null,
      consumable_cost: 65,
      consumableCost: 65,
      isFidelisation: true,
      originProposalId: completedProposal.id,
      deadline: now + (72 * 3600 * 1000),
      created_at: new Date(now).toISOString(),
      createdAt: now
    };

    game.formationB2BProposals.push(reminderProposal);
    this.syncB2BWithSupabase(game, reminderProposal);
  },

  // 9. SURVEILLANCE PÉRIODIQUE D'HORLOGE (DÉLIBÉRATIONS, DEMANDES ENTRANTES & REMPLISSAGE GRAND PUBLIC)
  processClockTick(game) {
    if (!game) return;

    const now = Date.now();
    let hasChanges = false;

    // Délibérations des devis entreprises
    if (game.formationB2BProposals) {
      game.formationB2BProposals.forEach(p => {
        if (p.status === 'evaluating' && p.evaluationEndsAt && now >= p.evaluationEndsAt) {
          this.resolveQuote(game, p.id, true);
          hasChanges = true;
        }
      });
    }

    // Génération automatique des demandes entrantes au fil de l'eau
    if (!game._lastB2BAutoCheck) game._lastB2BAutoCheck = 0;
    if (now - game._lastB2BAutoCheck >= 30000) {
      game._lastB2BAutoCheck = now;
      const spawned = this.checkAutoIncomingB2BDemands(game);
      if (spawned) hasChanges = true;
    }

    // Inscriptions citoyennes dynamiques aux formations Grand Public
    if (!game._lastPublicRegistrationCheck) game._lastPublicRegistrationCheck = 0;
    if (now - game._lastPublicRegistrationCheck >= 15000) {
      game._lastPublicRegistrationCheck = now;
      const registered = this.checkPublicRegistrations(game);
      if (registered) hasChanges = true;
    }

    if (hasChanges) {
      const modal = document.getElementById('main-modal');
      if (modal && !modal.classList.contains('hidden') && (this.mainTab === 'entreprises' || this.mainTab === 'grand_public')) {
        this.renderModal(game);
      }
    }
  },

  // Remplissage dynamique des places Grand Public selon la publicité et la réputation
  checkPublicRegistrations(game) {
    if (!game || !game.sessionsFormation || game.sessionsFormation.length === 0) return false;

    let hasRegistered = false;
    const repScore = game.resources?.reputationScore || 0;

    // Détection de la publicité / communication active menée par l'antenne
    // 1. Campagnes de communication payantes actives
    const activeCampaigns = game.communicationCampaigns || game.activeCampaigns || [];
    const hasFormationCampaign = activeCampaigns.some(c => c.subjectId === 'formation' || c.subject === 'formation' || c.id === 'formation');
    const hasAnyActiveCampaign = activeCampaigns.length > 0;

    // 2. Notoriété et visibilité sur les réseaux sociaux
    const socialVis = game.socialMediaState?.visibilityScore || game.socialMedia?.visibilityScore || 0;
    const socialFollowers = game.socialMediaState?.followers || game.resources?.followers || 0;

    // 3. Calcul du multiplicateur d'attractivité publicitaire
    let pubMultiplier = 1.0;
    if (hasFormationCampaign) {
      pubMultiplier += 2.5; // Campagne spécifique "Sensibilisation Gestes qui Sauvent & PSC1"
    } else if (hasAnyActiveCampaign) {
      pubMultiplier += 1.2;
    }
    if (socialVis > 50) pubMultiplier += 0.5;
    if (socialFollowers > 1000) pubMultiplier += 0.3;

    // Parcours des sessions ouvertes ayant des places grand public disponibles
    game.sessionsFormation.forEach(s => {
      if (s.status !== 'open') return;
      if (!s.openToPublic) return;

      const maxPublic = Number(s.publicSeatsMax) || 0;
      const bookedPublic = Number(s.publicSeatsBooked) || 0;
      if (maxPublic <= 0 || bookedPublic >= maxPublic) return;

      // Probabilité d'inscription d'un citoyen à ce cycle :
      // Si réputation < 15 et aucune pub faite : probabilité très faible (< 4%)
      let baseChance = 0.05;
      if (repScore >= 30) baseChance += 0.15;
      if (repScore >= 60) baseChance += 0.15;
      if (repScore >= 120) baseChance += 0.20;

      const speedMult = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('formationCitizenRegistrationSpeed', 1.0) : 1.0;
      const effectiveChance = Math.min(0.95, baseChance * pubMultiplier * speedMult);

      if (Math.random() < effectiveChance) {
        s.publicSeatsBooked = bookedPublic + 1;
        const citizenName = this.generateRandomCitizenName();
        const pricePerSeat = Number(s.publicPrice) || 60;

        if (!s.publicAttendees) s.publicAttendees = [];
        s.publicAttendees.push({
          name: citizenName,
          registeredAt: Date.now(),
          price: pricePerSeat
        });

        // Encaissement immédiat des recettes en trésorerie
        if (pricePerSeat > 0 && game.resources) {
          game.resources.money = (game.resources.money || 0) + pricePerSeat;
          if (window.ProtecFinances && typeof window.ProtecFinances.recordTransaction === 'function') {
            window.ProtecFinances.recordTransaction(
              game,
              pricePerSeat,
              `Inscription Grand Public : ${s.title} (${citizenName})`,
              'formation_grand_public'
            );
          }
        }

        hasRegistered = true;

        if (typeof game.showToast === 'function') {
          if (s.publicSeatsBooked >= maxPublic) {
            game.showToast(
              'Session Grand Public Complète ! 🎉',
              `Toutes les ${maxPublic} places grand public de « ${s.title} » sont réservées ! (+${pricePerSeat} € encaissés pour ${citizenName}).`,
              'green',
              { type: 'module', id: 'formations' }
            );
          } else {
            game.showToast(
              'Nouvelle Inscription Grand Public ! 🎓',
              `${citizenName} s'est inscrit(e) à la session « ${s.title} » (+${pricePerSeat} € en trésorerie). ${s.publicSeatsBooked}/${maxPublic} places réservées.`,
              'blue',
              { type: 'module', id: 'formations' }
            );
          }
        }
      }
    });

    if (hasRegistered) {
      game.saveGame();
      if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
    }

    return hasRegistered;
  },

  // Générateur de patronymes citoyens réalistes pour les inscriptions Grand Public
  generateRandomCitizenName() {
    const firstNames = ['Lucas', 'Emma', 'Thomas', 'Léa', 'Alexandre', 'Chloé', 'Maxime', 'Manon', 'Julien', 'Camille', 'Antoine', 'Sarah', 'Nicolas', 'Inès', 'Hugo', 'Clara', 'Arthur', 'Julie', 'Gabriel', 'Louise', 'Mathis', 'Jade', 'Théo', 'Zoé', 'Louis', 'Lola', 'Raphaël', 'Pauline', 'Clément', 'Lucie', 'Romain', 'Marie'];
    const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand'];
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${fn} ${ln}`;
  },

  // Arrivée automatique des opportunités B2B selon Notoriété, Communication et Locaux
  checkAutoIncomingB2BDemands(game) {
    if (!game) return false;
    if (!game.formationB2BProposals) game.formationB2BProposals = [];
    const now = Date.now();

    // 1. Nettoyage des demandes expirées non traitées
    game.formationB2BProposals = game.formationB2BProposals.filter(p => {
      if (p.status === 'pending_quote' && p.deadline && now > p.deadline) return false;
      return true;
    });

    const activeCount = game.formationB2BProposals.filter(p => ['pending_quote', 'evaluating', 'accepted', 'in_progress'].includes(p.status)).length;

    // Facteurs de notoriété et de communication
    const repScore = game.resources?.reputationScore || 0;
    const commCampaigns = (game.activeCampaigns || []).length;
    const socialFollowers = game.socialMediaState?.followers || game.resources?.followers || 0;
    const hasRoom = window.ProtecLocaux && typeof window.ProtecLocaux.hasFormationRoom === 'function' ? window.ProtecLocaux.hasFormationRoom(game) : true;

    // Jauge cible du vivier de demandes actives (de 2 à 6)
    let maxPool = 2;
    if (repScore >= 60) maxPool = 3;
    if (repScore >= 150) maxPool = 4;
    if (repScore >= 300) maxPool = 5;
    if (repScore >= 500) maxPool = 6;
    if (commCampaigns > 0) maxPool += 1;

    if (activeCount >= maxPool) return false;

    // Probabilité d'apparition par cycle de 30s
    let proba = 0.35 + Math.min(0.40, (repScore / 500) * 0.40);
    if (commCampaigns > 0) proba += 0.20;
    if (socialFollowers > 1500) proba += 0.10;
    if (hasRoom) proba += 0.10;

    if (Math.random() > proba) return false;

    const station = game.stations?.[0] || { city: 'Nancy', id: 'station-1' };
    const deptCode = game.currentDepartmentCode || game.player?.departmentCode || '54';

    // Pondérations de tirage modulées par ProtecGameplayConfig
    const wSST = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('formationDemandSST', 1.0) * 0.40 : 0.40;
    const wMAC = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('formationDemandSST', 1.0) * 0.25 : 0.25;
    const wPSC = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('formationDemandPSC', 1.0) * 0.20 : 0.20;
    const wGQS = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('formationDemandGQS', 1.0) * 0.15 : 0.15;
    const totalW = wSST + wMAC + wPSC + wGQS;

    const roll = Math.random() * (totalW > 0 ? totalW : 1.0);
    let trainingType = 'SST';
    if (roll < wSST) trainingType = 'SST';
    else if (roll < (wSST + wMAC)) trainingType = 'MAC_SST';
    else if (roll < (wSST + wMAC + wPSC)) trainingType = 'PSC';
    else trainingType = 'GQS';

    const cfg = this.TRAINING_B2B_CONFIG[trainingType] || this.TRAINING_B2B_CONFIG['SST'];
    const clientPreset = this.CLIENT_PRESETS[Math.floor(Math.random() * this.CLIENT_PRESETS.length)];
    const attendeesCount = Math.floor(Math.random() * (cfg.maxAttendees - cfg.minAttendees + 1)) + cfg.minAttendees;
    
    // Modalité : 65% Intra-entreprise (chez le client) vs 35% Inter-entreprise (à l'antenne)
    // Les structures paient plus cher (+30%) pour faire venir le formateur dans leurs locaux plutôt que de déplacer leurs salariés
    const mode = Math.random() < 0.65 ? 'intra' : 'inter';
    const intraSurplus = mode === 'intra' ? 1.30 : 1.0;

    const variation = (0.88 + Math.random() * 0.28) * intraSurplus;
    const targetBudget = Math.round((cfg.baseBudget * variation) / 10) * 10;
    const deadlineHours = 24 + Math.floor(Math.random() * 48);
    const deadline = now + (deadlineHours * 3600 * 1000);
    const proposalId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

    const newProposal = {
      id: proposalId,
      department_code: deptCode,
      antenne_id: station.id || 'station-1',
      client_name: clientPreset.name,
      client_type: clientPreset.type,
      client_label: clientPreset.label,
      client_icon: clientPreset.icon,
      client_city: station.city || 'Nancy',
      training_type: trainingType,
      attendees_count: attendeesCount,
      mode: mode,
      client_target_budget: targetBudget,
      clientTargetBudget: targetBudget,
      proposed_price: null,
      proposedPrice: null,
      acceptance_rate: 75,
      acceptanceRate: 75,
      status: 'pending_quote',
      trainer_id: null,
      trainerId: null,
      vehicle_id: null,
      vehicleId: null,
      consumable_cost: cfg.consumableCost,
      consumableCost: cfg.consumableCost,
      deadline: deadline,
      evaluation_ends_at: null,
      evaluationEndsAt: null,
      created_at: new Date(now).toISOString(),
      createdAt: now
    };

    game.formationB2BProposals.unshift(newProposal);
    this.syncB2BWithSupabase(game, newProposal);
    game.saveGame();

    if (typeof game.showToast === 'function') {
      game.showToast(
        'Nouvelle Demande de Formation 🏢',
        `« ${newProposal.client_name} » sollicite un devis : ${newProposal.training_type} (${newProposal.attendees_count} salariés, ${mode === 'intra' ? 'sur site client' : 'à l’antenne'}).`,
        'blue',
        { type: 'module', id: 'formations' }
      );
    }

    return true;
  },

  // 10. SYNCHRONISATION ROBUSTE AVEC SUPABASE POSTGRESQL
  async syncB2BWithSupabase(game, proposal) {
    if (!proposal || !proposal.id || !window.ProtecSupabase || !window.ProtecSupabase.isConnected || !window.ProtecSupabase.client) {
      return;
    }

    // Si l'identifiant n'est pas un UUID standard (ex: anciennes sauvegardes b2b-...),
    // on ne synchronise pas vers Supabase pour éviter l'erreur Postgres 400 invalid input syntax for type uuid.
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(proposal.id).trim());
    if (!isUUID) {
      return;
    }

    try {
      const payload = {
        id: proposal.id,
        department_code: proposal.department_code || '54',
        antenne_id: proposal.antenne_id || 'station-1',
        client_name: proposal.client_name,
        client_type: proposal.client_type,
        location_name: proposal.client_city || proposal.location_name || (game?.stations?.[0]?.city || 'Nancy'),
        formation_type: proposal.training_type || proposal.formation_type || 'SST',
        attendees_count: proposal.attendees_count,
        modality: proposal.mode || proposal.modality || 'intra',
        target_budget: proposal.client_target_budget || proposal.clientTargetBudget || proposal.target_budget,
        quoted_price: proposal.proposed_price || proposal.proposedPrice || proposal.quoted_price || null,
        status: proposal.status,
        trainer_id: proposal.trainer_id || proposal.trainerId || null,
        vehicle_id: proposal.vehicle_id || proposal.vehicleId || null,
        consumable_cost: proposal.consumable_cost || proposal.consumableCost || 0,
        deadline: proposal.deadline ? new Date(proposal.deadline).toISOString() : null,
        evaluation_ends_at: proposal.evaluationEndsAt ? new Date(proposal.evaluationEndsAt).toISOString() : null,
        completed_at: proposal.completedAt ? new Date(proposal.completedAt).toISOString() : null,
        created_at: proposal.created_at ? new Date(proposal.created_at).toISOString() : new Date().toISOString(),
        details: {
          acceptance_rate: proposal.acceptance_rate || proposal.acceptanceRate || 75
        }
      };

      await window.ProtecSupabase.client
        .from('formation_b2b_proposals')
        .upsert(payload);
    } catch (err) {
      // Échec discret en cas de réseau instable ou table non migrée
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

  // Créer et organiser une nouvelle session de formation planifiée à l'antenne ou délocalisée
  createSession(game, courseId, paramsOrDiscount, isInternal, targetAudience, locationType = 'antenne', externalAttendeesCount = 0, roomNumber = null) {
    const course = this.catalog.find(c => c.id === courseId);
    if (!course) return;

    const isObjectConfig = typeof paramsOrDiscount === 'object' && paramsOrDiscount !== null;
    const cfg = isObjectConfig ? paramsOrDiscount : {};

    // 1. Résolution de l'antenne et de la salle de formation
    const station = (game.stations && game.stations[0]) || { name: 'Antenne', city: 'Nancy' };
    const stationName = station.name || `Antenne de ${station.city || 'Nancy'}`;
    const roomsCount = window.ProtecLocaux?.getStationTrainingRoomsCount ? window.ProtecLocaux.getStationTrainingRoomsCount(station) : 1;
    
    let locType = cfg.locationType || locationType || 'antenne';
    let assignedRoom = Number(cfg.roomNumber || roomNumber) || 1;
    let customLocation = (cfg.locationCustom || '').trim();

    if (!roomNumber && !cfg.roomNumber && locType === 'antenne' && roomsCount > 1) {
      const curDay = (game.clock?.day || 1);
      const occupied = (game.sessionsFormation || [])
        .filter(s => s.locationType === 'antenne' && s.eventDate?.day === curDay && s.roomNumber)
        .map(s => Number(s.roomNumber));
      for (let r = 1; r <= roomsCount; r++) {
        if (!occupied.includes(r)) {
          assignedRoom = r;
          break;
        }
      }
    }

    let locationLabel = customLocation;
    if (!locationLabel) {
      locationLabel = locType === 'antenne'
        ? `${stationName} - Salle n°${assignedRoom}`
        : 'Salle Délocalisée / Extérieure';
    }

    // 2. Dates et horaires
    const curClock = game.clock || {};
    const evDate = cfg.eventDate || {
      day: Number(cfg.day) || (curClock.day || 1) + 2,
      month: Number(cfg.month) !== undefined ? Number(cfg.month) : (curClock.month || 0),
      year: Number(cfg.year) || (curClock.year || 2026),
      hour: Number(cfg.hour) || 9,
      minute: Number(cfg.minute) || 0
    };

    // 3. Répartition des places (Total, Interne Antenne, Interne Protection Civile, Grand Public)
    const defaultCapacity = course.capacity || 10;
    const totalSeats = Math.max(2, Math.min(25, Number(cfg.totalSeats || course.capacity)));
    let internalAntenneSeats = Number(cfg.internalAntenneSeats);
    if (isNaN(internalAntenneSeats)) {
      internalAntenneSeats = isObjectConfig ? 0 : (isInternal ? (totalSeats - (Number(externalAttendeesCount) || 0)) : 0);
    }
    internalAntenneSeats = Math.max(0, Math.min(totalSeats, internalAntenneSeats));

    let internalProtecSeats = Math.max(0, Math.min(totalSeats - internalAntenneSeats, Number(cfg.internalProtecSeats) || 0));

    // Ouverture au Grand Public (places restantes attribuées aux citoyens)
    const openToPublic = isObjectConfig ? !!cfg.openToPublic : (!isInternal || (Number(externalAttendeesCount) || 0) > 0);
    const publicSeatsMax = openToPublic ? Math.max(0, totalSeats - internalAntenneSeats - internalProtecSeats) : 0;
    const publicPrice = Number(cfg.publicPrice) !== undefined ? Number(cfg.publicPrice) : course.basePricePublic;

    // 4. Kit pédagogique requis
    if (course.kitRequired && !this.hasTrainingKit(game, course.kitRequired)) {
      game.showToast(
        'Information Matériel',
        `Session planifiée ! Pensez à acquérir le « ${course.kitName || course.kitRequired} » dans la boutique Logistique avant de certifier la formation.`,
        'blue'
      );
    }

    const sessionId = `sess-${Date.now()}`;

    const newSession = {
      id: sessionId,
      courseId: course.id,
      title: course.title,
      category: course.category,
      locationType: locType,
      roomNumber: assignedRoom,
      locationCustom: customLocation,
      locationLabel: locationLabel,
      totalSeats: totalSeats,
      maxCandidates: totalSeats,
      internalAntenneSeats: internalAntenneSeats,
      internalProtecSeats: internalProtecSeats,
      openToPublic: openToPublic,
      publicSeatsMax: publicSeatsMax,
      publicSeatsBooked: 0,
      publicPrice: publicPrice,
      publicAttendees: [],
      registeredCandidates: [],
      registeredProtecReinforcements: [],
      trainerId: cfg.trainerId || null,
      assignedTrainer: null,
      kitRequired: course.kitRequired,
      kitName: course.kitName,
      eventDate: evDate,
      dateDesc: `${evDate.day}/${(evDate.month || 0) + 1}/${evDate.year} à ${evDate.hour}h00 (Durée : ${course.durationHours}h)`,
      status: 'open',
      isInternal: !!(isInternal || !openToPublic || (internalAntenneSeats > 0 && !openToPublic)),
      isExternal: locType === 'externe',
      createdAt: Date.now()
    };

    game.sessionsFormation.unshift(newSession);
    game.saveGame();
    game.showToast('Session de Formation Programmée 🎓', `La session « ${course.title} » est ouverte au calendrier (${totalSeats} places).`, 'green');
    this.renderModal(game);
  },

  // Accueillir un stagiaire Protection Civile d'une antenne voisine (Renfort Fédéral)
  registerProtecReinforcementToSession(game, sessionId, originStationName) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    if (!session) return;

    if (!session.registeredProtecReinforcements) session.registeredProtecReinforcements = [];
    const maxProtec = Number(session.internalProtecSeats) || 0;
    if (session.registeredProtecReinforcements.length >= maxProtec) {
      game.showToast('Jauge Fédérale Atteinte', `Le quota de ${maxProtec} stagiaires Protection Civile accueillis est complet.`, 'orange');
      return;
    }

    const name = this.generateRandomCitizenName();
    const station = originStationName || 'Antenne Voisine';

    session.registeredProtecReinforcements.push({
      name: name,
      station: station,
      registeredAt: Date.now()
    });

    // Bonus de solidarité fédérale
    if (game.resources) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 6;
    }

    game.saveGame();
    game.showToast('Stagiaire Protection Civile Accueilli(e) 🤝', `${name} (${station}) rejoint la session au titre de la solidarité du réseau fédéral.`, 'blue');
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
      game.showToast('Stage Pris en Charge !', `L’antenne a réglé les ${cost} € de formation pour ${vol.name}. Formation validée !`, 'green');
    } else {
      // Bénévole paye lui-même
      vol.motivation = Math.max(15, (vol.motivation || 80) - 25);
      vol.humeur = Math.max(15, (vol.humeur || 80) - 20);
      game.showToast('Stage Financé par le Bénévole', `${vol.name} a financé lui-même son stage (${cost} €).`, 'blue');
    }

    // Attribution immédiate des compétences et rôles
    this.grantCourseQualifications(vol, course);

    // Inscription du stage externe au planning général de l'antenne
    const extSessionId = `ext-stage-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const curClock = game.clock || {};
    const evDate = {
      day: curClock.day || 1,
      month: curClock.month !== undefined ? curClock.month : 0,
      year: curClock.year || 2026,
      hour: 9,
      minute: 0
    };
    const newExtSession = {
      id: extSessionId,
      courseId: course.id,
      title: `Stage Externe : ${course.title} (${vol.name})`,
      category: 'stage_externe',
      locationType: 'externe',
      locationCustom: 'Organisme Agréé Externe / Union Départementale',
      locationLabel: 'Organisme Agréé Externe / Union Départementale',
      totalSeats: 1,
      maxCandidates: 1,
      internalAntenneSeats: 1,
      internalProtecSeats: 0,
      openToPublic: false,
      publicSeatsMax: 0,
      publicSeatsBooked: 0,
      publicPrice: 0,
      publicAttendees: [],
      registeredCandidates: [vol.id],
      registeredProtecReinforcements: [],
      trainerId: null,
      assignedTrainer: { name: 'Organisme Agréé Externe / UD', role: 'Formateur Organisme Tiers' },
      kitRequired: null,
      kitName: null,
      eventDate: evDate,
      dateDesc: `${evDate.day}/${(evDate.month || 0) + 1}/${evDate.year} à 09h00 (Stage Externe)`,
      status: 'open',
      isExternal: true,
      isStageExterne: true,
      volunteerId: vol.id,
      volunteerName: vol.name,
      payMode: payMode,
      cost: cost,
      durationHours: course.durationHours || 7,
      createdAt: Date.now()
    };
    if (!Array.isArray(game.sessionsFormation)) game.sessionsFormation = [];
    game.sessionsFormation.unshift(newExtSession);

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
    if (!trainerId) {
      session.trainerId = null;
      session.assignedTrainer = null;
      game.saveGame();
      this.renderModal(game);
      return;
    }
    const trainer = game.volunteers.find(v => v.id === trainerId);
    if (!trainer) return;
    const course = this.catalog.find(c => c.id === session.courseId);

    const check = this.isEligibleTrainer(trainer, course);
    if (!check.eligible) {
      game.showToast('Non Qualifié pour ce Cursus', `${trainer.name} ne peut pas animer « ${course?.title || session.courseId} » : ${check.reason}`, 'orange');
      return;
    }

    session.trainerId = trainer.id;
    session.assignedTrainer = trainer;
    game.saveGame();
    game.showToast('Formateur Affecté', `${trainer.name} (${check.badge}) animera la session.`, 'green');
    this.renderModal(game);
  },

  // Demander un renfort Formateur auprès d'autres antennes / réseau fédéral
  requestTrainerReinforcement(game, sessionId) {
    if (!game || !game.sessionsFormation) return;
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    if (!session) return;

    const course = this.catalog.find(c => c.id === session.courseId);
    const extId = `ext_trainer_${Date.now()}`;
    const extTrainer = {
      id: extId,
      name: 'Formateur Renfort (Antenne Partenaire)',
      role: 'Formateur Inter-Antennes',
      rank: 'Formateur',
      isTrainer: true,
      skills: ['formateur', 'formateur_psc', 'formateur_sst', 'formateur_ps'],
      isExternal: true
    };

    session.trainerId = extId;
    session.assignedTrainer = extTrainer;

    // Prise en charge d'un défraiement de déplacement si trésorerie disponible
    const defraiementCost = 35;
    if (game.resources && game.resources.money >= defraiementCost) {
      game.resources.money -= defraiementCost;
      game.showToast(
        'Renfort Formateur Accordé 🤝',
        `Un formateur qualifié de l'antenne voisine a été détaché pour animer « ${course?.title || session.title} » ! (Défraiement : 35 €)`,
        'green'
      );
    } else {
      game.showToast(
        'Renfort Formateur Accordé 🤝',
        `Un formateur solidaire de l'antenne voisine animera gracieusement votre session « ${course?.title || session.title} » !`,
        'green'
      );
    }

    game.saveGame();
    this.renderModal(game);
  },

  // Inscrire un bénévole de l'antenne à une formation interne (GRATUIT)
  registerVolunteerToInternal(game, sessionId, volunteerId) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    const vol = game.volunteers.find(v => v.id === volunteerId);
    if (!session || !vol) return;

    if (session.registeredCandidates.includes(volunteerId)) return;
    const maxAntenne = session.internalAntenneSeats !== undefined ? Number(session.internalAntenneSeats) : (Number(session.maxCandidates) || 8);
    if (session.registeredCandidates.length >= maxAntenne) {
      game.showToast('Quota Équipe Atteint', `Le quota de ${maxAntenne} places réservées aux bénévoles de l’antenne est déjà atteint.`, 'orange');
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
    game.showToast('Bénévole Inscrit (Gratuit)', `${vol.name} est inscrit à la formation interne gratuite.`, 'blue');

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

    // Recyclage / Formation Continue annuelle obligatoire (FC PSE & MAC SST)
    const curYear = (window.game?.clock?.year) || 2026;
    if (course.isRecycling || course.id === 'FC_PSE' || course.id === 'MAC_SST') {
      vol.recycledYear = curYear;
      vol.validityYear = curYear + 1; // Au 31/12 de l'année SUIVANT le recyclage
      vol.validityDate = `31/12/${curYear + 1}`;
      vol.qualificationExpired = false;
      vol.qualificationExpiredReason = null;
      vol.lastRecycledAt = Date.now();
    } else if (['PSE1', 'PSE2', 'CE', 'CD', 'SST'].includes(course.id)) {
      vol.formationYear = curYear;
      vol.recycledYear = curYear;
      vol.validityYear = curYear + 1; // Au 31/12 de l'année SUIVANT la formation
      vol.validityDate = `31/12/${curYear + 1}`;
      vol.qualificationExpired = false;
      vol.qualificationExpiredReason = null;
      vol.lastRecycledAt = Date.now();
    }
  },

  // Détermination de la validité réglementaire d'une compétence
  getSkillValidityInfo(skillId, volunteer, game) {
    if (!volunteer) return { hasValidity: false, expiryDateFormatted: 'Permanente', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' };
    const sId = String(skillId || '').toLowerCase().replace(/[- ]/g, '_');
    const curYear = (game?.clock?.year) || (window.game?.clock?.year) || 2026;

    // Compétences soumises à validité réglementaire au 31/12 de l'année suivant la formation / recyclage
    const validableSkills = ['pse1', 'pse2', 'ce', 'cd', 'sst', 'formateur_psc', 'formateur_ps', 'formateur_sst', 'formateur_de_formateur', 'permis_vpsp'];
    const isSubjectToValidity = validableSkills.some(v => sId.includes(v));

    if (!isSubjectToValidity) {
      return {
        hasValidity: false,
        validityLabel: 'Compétence permanente (Acquise à vie)',
        expiryDateFormatted: 'Permanente',
        status: 'permanent',
        statusLabel: 'Permanente',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        needsRecycling: false
      };
    }

    // Année de référence : année du dernier recyclage ou de la formation initiale
    let refYear = volunteer.recycledYear || volunteer.formationYear;
    if (!refYear) {
      refYear = curYear;
      volunteer.recycledYear = curYear;
    }

    // RÈGLE OFFICIELLE : Validité au 31/12 de l'année SUIVANT la formation / le recyclage
    const expiryYear = Number(refYear) + 1;
    const expiryDateFormatted = `31/12/${expiryYear}`;

    // Comparaison avec l'année en cours dans le jeu
    if (curYear > expiryYear) {
      // Expirée (dépassée)
      return {
        hasValidity: true,
        expiryYear: expiryYear,
        expiryDateFormatted: expiryDateFormatted,
        validityLabel: `Expirée le ${expiryDateFormatted}`,
        status: 'expired',
        statusLabel: 'Expirée (FC requise)',
        badgeClass: 'bg-red-100 text-red-800 border-red-300 font-black',
        needsRecycling: true,
        isUrgent: true
      };
    } else if (curYear === expiryYear) {
      // Échéance cette année
      return {
        hasValidity: true,
        expiryYear: expiryYear,
        expiryDateFormatted: expiryDateFormatted,
        validityLabel: `Échéance au ${expiryDateFormatted}`,
        status: 'warning',
        statusLabel: 'Recyclage à prévoir',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black',
        needsRecycling: true,
        isUrgent: false
      };
    } else {
      // Valide pour encore plus d'un an
      return {
        hasValidity: true,
        expiryYear: expiryYear,
        expiryDateFormatted: expiryDateFormatted,
        validityLabel: `Valide jusqu'au ${expiryDateFormatted}`,
        status: 'valid',
        statusLabel: 'À jour (Valide)',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
        needsRecycling: false,
        isUrgent: false
      };
    }
  },

  // Vérifie si un bénévole a besoin d'un recyclage (échéance au 31/12 de l'année en cours ou déjà expirée)
  volunteerNeedsRecycling(volunteer, game) {
    if (!volunteer) return false;
    const skills = volunteer.skills || [];
    const validableSkills = ['pse1', 'pse2', 'ce', 'cd', 'sst', 'formateur_psc', 'formateur_ps', 'formateur_sst', 'formateur_de_formateur'];
    const hasAnyValidable = validableSkills.some(s => skills.includes(s)) || ['PSE1', 'PSE2', 'CE', 'CD'].includes(volunteer.rank);
    if (!hasAnyValidable) return false;

    const curYear = (game?.clock?.year) || (window.game?.clock?.year) || 2026;
    const refYear = volunteer.recycledYear || volunteer.formationYear || curYear;
    const expiryYear = Number(refYear) + 1;
    return curYear >= expiryYear;
  },

  // Contrôle périodique de péremption annuelle des diplômes opérationnels
  checkAnnualRecycling(game) {
    if (!game || !game.volunteers) return;
    const curYear = game.clock?.year || 2026;

    game.volunteers.forEach(v => {
      // Les secouristes détenant PSE1, PSE2, CE, CD ou Formateur doivent maintenir leurs compétences chaque année
      const hasOpSkills = ['PSE1', 'PSE2', 'CE', 'CD'].includes(v.rank) || v.isTrainer || (v.skills && v.skills.some(s => ['pse1', 'pse2', 'ce', 'formateur'].includes(s)));
      if (hasOpSkills) {
        if (!v.recycledYear) {
          v.recycledYear = curYear;
          v.qualificationExpired = false;
        } else {
          const expiryYear = Number(v.recycledYear) + 1;
          if (curYear > expiryYear) {
            v.qualificationExpired = true;
            v.qualificationExpiredReason = `Validité échue au 31/12/${expiryYear} : Recyclage (Formation Continue FC PSE) obligatoire pour réactiver les droits opérationnels.`;
          } else {
            v.qualificationExpired = false;
            v.qualificationExpiredReason = null;
          }
        }
      }
    });
  },

  // Inscription rapide d'un bénévole à une session de recyclage FC PSE
  inscrireBenevoleRecyclage(game, volunteerId) {
    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    if (!vol) return;

    if (!Array.isArray(game.sessionsFormation)) game.sessionsFormation = [];

    // Chercher une session FC PSE ouverte avec place interne
    let session = game.sessionsFormation.find(s => 
      s.courseId === 'FC_PSE' && 
      !s.isCompleted && 
      (s.internalAntenneSeats || 0) > (s.registeredCandidates || []).length
    );

    if (!session) {
      // Créer une nouvelle session FC PSE interne
      this.createSession(game, 'FC_PSE', {
        locationType: 'antenne',
        internalAntenneSeats: 6,
        internalProtecSeats: 2,
        openToPublic: false,
        totalSeats: 8,
        roomNumber: 1
      });
      session = game.sessionsFormation[game.sessionsFormation.length - 1];
    }

    if (session) {
      if (!Array.isArray(session.registeredCandidates)) session.registeredCandidates = [];
      if (!session.registeredCandidates.includes(vol.id)) {
        session.registeredCandidates.push(vol.id);
        vol.registeredSessionId = session.id;
        if (window.ProtecAdvanced && typeof window.ProtecAdvanced.recordVolunteerRecycled === 'function') {
          window.ProtecAdvanced.recordVolunteerRecycled(game, vol);
        }
        game.saveGame();
        if (window.ProtecAudio) window.ProtecAudio.playClickSound();
        game.showToast('Inscription Recyclage Validée', `${vol.name} est inscrit(e) à la session « ${session.title} » pour renouveler ses compétences.`, 'green');
      } else {
        game.showToast('Déjà Inscrit', `${vol.name} est déjà positionné(e) sur cette session de recyclage.`, 'blue');
      }
    }
    this.renderModal(game);
  },

  // Inscrire tous les secouristes ayant besoin d'un recyclage en une seule action
  inscrireTousRetardatairesRecyclage(game) {
    const needVols = (game.volunteers || []).filter(v => this.volunteerNeedsRecycling(v, game));
    if (needVols.length === 0) {
      game.showToast('Effectifs à Jour', 'Tous vos secouristes sont actuellement à jour de leur formation continue.', 'green');
      return;
    }

    let count = 0;
    needVols.forEach(v => {
      // Chercher ou créer une session
      let session = (game.sessionsFormation || []).find(s => 
        s.courseId === 'FC_PSE' && 
        !s.isCompleted && 
        (s.internalAntenneSeats || 0) > (s.registeredCandidates || []).length &&
        !(s.registeredCandidates || []).includes(v.id)
      );

      if (!session) {
        this.createSession(game, 'FC_PSE', {
          locationType: 'antenne',
          internalAntenneSeats: 8,
          internalProtecSeats: 0,
          openToPublic: false,
          totalSeats: 8,
          roomNumber: 1
        });
        session = game.sessionsFormation[game.sessionsFormation.length - 1];
      }

      if (session) {
        if (!Array.isArray(session.registeredCandidates)) session.registeredCandidates = [];
        session.registeredCandidates.push(v.id);
        v.registeredSessionId = session.id;
        if (window.ProtecAdvanced && typeof window.ProtecAdvanced.recordVolunteerRecycled === 'function') {
          window.ProtecAdvanced.recordVolunteerRecycled(game, v);
        }
        count++;
      }
    });

    game.saveGame();
    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.showToast('Inscriptions Groupées', `${count} secouriste(s) ont été positionnés sur les sessions de recyclage FC PSE !`, 'green');
    this.renderModal(game);
  },

  // Rendu de l'onglet complet Suivi des Validités & Recyclages (Formation Continue)
  renderRecyclagesTab(game) {
    const curYear = (game?.clock?.year) || (window.game?.clock?.year) || 2026;
    const vols = game.volunteers || [];

    // Secouristes concernés par une compétence soumise à validité
    const validableSkills = ['pse1', 'pse2', 'ce', 'cd', 'sst', 'formateur_psc', 'formateur_ps', 'formateur_sst', 'formateur_de_formateur'];
    const candidates = vols.filter(v => {
      const skills = v.skills || [];
      return validableSkills.some(s => skills.includes(s)) || ['PSE1', 'PSE2', 'CE', 'CD'].includes(v.rank);
    });

    const statusCounts = { valid: 0, warning: 0, expired: 0 };
    candidates.forEach(v => {
      const refYear = v.recycledYear || v.formationYear || curYear;
      const expiryYear = Number(refYear) + 1;
      if (curYear > expiryYear) statusCounts.expired++;
      else if (curYear === expiryYear) statusCounts.warning++;
      else statusCounts.valid++;
    });

    return `
      <div class="space-y-6">
        <!-- Bandeau Explicatif Réglementation Sécurité Civile -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-pc-blue to-slate-900 text-white shadow-md space-y-2">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">📋</span>
            <div>
              <h4 class="text-sm font-black uppercase tracking-wide">Réglementation Officielle : Validité des Compétences & Recyclages</h4>
              <p class="text-xs text-blue-100 leading-relaxed">
                Les diplômes opérationnels de secourisme (PSE1, PSE2, Chef d’Équipe, Formateurs) sont valables <strong>jusqu'au 31/12 de l'année suivant la formation</strong>.
                Pour renouveler et maintenir ces compétences actives, l’antenne doit organiser des <strong>sessions de recyclage (Formation Continue FC PSE)</strong>. Les diplômes citoyens (PSC1) et permis de conduire sont permanents.
              </p>
            </div>
          </div>
        </div>

        <!-- 3 Compteurs Synthétiques -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black">✓</span>
              <div>
                <div class="text-[10px] text-emerald-800 font-bold uppercase">À Jour de Recyclage</div>
                <div class="text-lg font-black text-emerald-950">${statusCounts.valid} secouristes</div>
              </div>
            </div>
            <span class="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Valides</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">⚠️</span>
              <div>
                <div class="text-[10px] text-amber-800 font-bold uppercase">Échéance 31/12/${curYear}</div>
                <div class="text-lg font-black text-amber-950">${statusCounts.warning} secouristes</div>
              </div>
            </div>
            <span class="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">À recycler</span>
          </div>

          <div class="p-3.5 rounded-2xl bg-red-50 border border-red-200 shadow-2xs flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black">✕</span>
              <div>
                <div class="text-[10px] text-red-800 font-bold uppercase">Validité Expirée</div>
                <div class="text-lg font-black text-red-950">${statusCounts.expired} secouristes</div>
              </div>
            </div>
            <span class="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-full">FC Requise</span>
          </div>
        </div>

        <!-- Actions Rapides -->
        <div class="p-4 rounded-2xl glass-card border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h5 class="text-xs font-black text-slate-900 uppercase tracking-wide">Organisation des Recyclages (FC PSE)</h5>
            <p class="text-[11px] text-slate-500">Planifiez une session de formation continue de 6h ou inscrivez directement vos effectifs en attente.</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="window.ProtecFormations.inscrireTousRetardatairesRecyclage(window.game)" class="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="zap" class="w-3.5 h-3.5"></i>
              <span>⚡ Inscrire tous les retardataires</span>
            </button>
            <button onclick="window.ProtecFormations.setMainTab('grand_public'); setTimeout(() => { const sel=document.getElementById('new-session-course'); if(sel){ sel.value='FC_PSE'; sel.dispatchEvent(new Event('change')); } }, 100);" class="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Planifier Session FC PSE</span>
            </button>
          </div>
        </div>

        <!-- Tableau des Secouristes & État des Validités -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-slate-800 tracking-wider">État Individuel des Diplômes & Échéances au 31/12</span>
            <span class="text-[10px] text-slate-500">${candidates.length} secouriste(s) opérationnel(s)</span>
          </div>

          <div class="space-y-2">
            ${candidates.map(v => {
              const refYear = v.recycledYear || v.formationYear || curYear;
              const expiryYear = Number(refYear) + 1;
              const isExpired = curYear > expiryYear;
              const isWarning = curYear === expiryYear;
              const isRegistered = (game.sessionsFormation || []).some(s => s.courseId === 'FC_PSE' && !s.isCompleted && (s.registeredCandidates || []).includes(v.id));

              return `
                <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-sm transition">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0 shadow-2xs">
                      ${v.avatar || '🙋'}
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-extrabold text-xs text-slate-900">${v.name}</span>
                        <span class="px-2 py-0.2 rounded-md font-mono text-[9px] font-black bg-pc-blue text-white">${v.rank || 'Secouriste'}</span>
                        ${v.poleRoleTitle ? `<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-indigo-100 text-indigo-900">${v.poleRoleTitle}</span>` : ''}
                      </div>
                      <div class="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                        <span>Dernier diplôme / recyclage : <strong>${refYear}</strong></span>
                        <span>•</span>
                        <span>Échéance réglementaire : <strong class="${isExpired ? 'text-red-700' : (isWarning ? 'text-amber-700' : 'text-emerald-700')}">31/12/${expiryYear}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
                    <span class="px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${isExpired ? 'bg-red-100 text-red-800 border-red-300' : (isWarning ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300')}">
                      ${isExpired ? '✕ Expirée' : (isWarning ? '⚠️ Recyclage requis' : '✓ À jour')}
                    </span>

                    ${(isExpired || isWarning) ? (isRegistered ? `
                      <span class="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-extrabold text-xs flex items-center gap-1">
                        <i data-lucide="calendar-check" class="w-3.5 h-3.5 text-indigo-600"></i>
                        <span>FC PSE Planifiée</span>
                      </span>
                    ` : `
                      <button onclick="window.ProtecFormations.inscrireBenevoleRecyclage(window.game, '${v.id}')" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-xs flex items-center gap-1 cursor-pointer">
                        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                        <span>Inscrire en FC PSE</span>
                      </button>
                    `) : `
                      <span class="text-xs text-emerald-700 font-bold px-2">Valide ✓</span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // Clôturer et certifier une session de formation
  completeSession(game, sessionId) {
    const session = game.sessionsFormation.find(s => s.id === sessionId);
    if (!session) return;

    if (!session.trainerId) {
      game.showToast('Formateur Requis', 'Vous devez affecter un formateur qualifié avant de valider la session.', 'orange');
      return;
    }

    // Contrôle du kit pédagogique de la base obligatoire
    if (session.kitRequired && !this.hasTrainingKit(game, session.kitRequired)) {
      game.showToast('Matériel Pédagogique Manquant ⚠️', `Le kit de formation « ${session.kitName || session.kitRequired} » de la base est obligatoire pour dispenser et certifier cette session. Commandez-le dans la boutique Logistique.`, 'orange');
      return;
    }

    const course = this.catalog.find(c => c.id === session.courseId);
    const internalCount = (session.registeredCandidates || []).length;
    const protecCount = (session.registeredProtecReinforcements || []).length;
    const publicCount = session.publicSeatsBooked || (session.publicAttendees ? session.publicAttendees.length : (session.externalAttendeesCount || 0));
    const totalCount = internalCount + protecCount + publicCount;

    if (totalCount === 0 && !session.finalPrice) {
      game.showToast('Session Sans Stagiaire', 'Aucun stagiaire n\'est inscrit à cette session (bénévole antenne, renfort Protection Civile ou grand public).', 'orange');
      return;
    }

    let totalRevenue = 0;
    let netGain = 0;

    // Prise en compte des gammes de matériel pédagogique (Mannequin RCP & DSA Formation)
    const mannequinTier = (game.equipmentTiers && game.equipmentTiers.mannequin_rcp_adulte) || 1;
    const dsaTier = (game.equipmentTiers && game.equipmentTiers.dsa_formation) || 1;

    let tierNotice = '';

    // Si d'anciens externes payants n'avaient pas été encaissés au fil de l'eau
    const unbilledExternals = session.externalAttendeesCount || 0;
    if (unbilledExternals > 0 && (!session.publicAttendees || session.publicAttendees.length === 0)) {
      const revFromExternals = unbilledExternals * (session.publicPriceForExternals || course?.basePricePublic || 60);
      totalRevenue += revFromExternals;
    }

    // Bonus matériel sur recettes
    if (mannequinTier === 3) {
      totalRevenue = Math.round(totalRevenue * 1.25);
      tierNotice += ' [QCPR Connecté : +25% valorisation]';
    } else if (mannequinTier === 1 && totalRevenue > 0) {
      totalRevenue = Math.round(totalRevenue * 0.90);
    }

    if (totalRevenue > 0) {
      game.resources.money = (game.resources.money || 0) + totalRevenue;
      netGain += totalRevenue;
      if (window.ProtecFinances && typeof window.ProtecFinances.recordTransaction === 'function') {
        window.ProtecFinances.recordTransaction(game, totalRevenue, `Clôture Session : ${session.title}`, 'formation_grand_public');
      }
    }

    // Réputation générée par la réussite de la session
    let repGain = 15;
    if (protecCount > 0) {
      repGain += protecCount * 6; // Solidarité fédérale inter-antennes
    }
    if (publicCount > 0) {
      repGain += publicCount * 4; // Notoriété et service rendu à la population
    }
    if (dsaTier === 2) {
      repGain += 8;
      tierNotice += ' [DSA Connecté HF : Optimisé]';
    }
    game.resources.reputationScore = (game.resources.reputationScore || 0) + repGain;

    // Attribution des compétences et qualifications aux bénévoles internes certifiés
    (session.registeredCandidates || []).forEach(vid => {
      const v = game.volunteers.find(vol => vol.id === vid);
      if (v && course) {
        this.grantCourseQualifications(v, course);
        // Bonus de rapidité d'apprentissage QCPR
        if (mannequinTier === 3) {
          v.exp = (v.exp || 0) + 15;
        }
      }
    });

    // Boost moral du formateur si matériel moderne QCPR
    const trainer = game.volunteers.find(v => v.id === session.trainerId);
    if (trainer) {
      if (mannequinTier === 3) {
        trainer.moral = Math.min(100, (trainer.moral || 75) + 15);
        trainer.motivation = trainer.moral;
        trainer.exp = (trainer.exp || 0) + 20;
      } else if (mannequinTier === 2) {
        trainer.moral = Math.min(100, (trainer.moral || 75) + 5);
        trainer.motivation = trainer.moral;
      }
    }

    session.status = 'completed';

    if (window.ProtecCommunication) {
      window.ProtecCommunication.createPhotoFolder(game, {
        sourceType: 'formation',
        title: course?.title || session.courseId || 'Session de Formation Secourisme',
        isFormation: true,
        photographerNames: 'Pôle Pédagogique & Communication',
        baseReputationGain: 15,
        baseVisibilityGain: 20,
        baseLikes: 50,
        baseShares: 12
      });
    }

    // Attribution des écussons de formation et compétences
    if (window.ProtecEcussons) {
      if (['PSE1', 'PSE2', 'CE', 'CD'].includes(session.courseId)) {
        window.ProtecEcussons.attribuerEcusson('spec_pse');
      }
      if (['PICF', 'PAE_FPS', 'FORMATEUR_PSC', 'FORMATEUR_PSE', 'FORMATEUR_DE_FORMATEURS'].includes(session.courseId)) {
        window.ProtecEcussons.attribuerEcusson('spec_formateur');
      }
    }

    // Enregistrement d'un avis public 5 étoiles dans le module Communication
    if (window.ProtecCommunication && typeof window.ProtecCommunication.recordReview === 'function') {
      window.ProtecCommunication.recordReview(game, {
        author: 'Stagiaire Formation',
        role: `Participant « ${course?.title || session.courseId} »`,
        rating: 5,
        date: 'Aujourd’hui',
        text: `Excellente session « ${course?.title || session.courseId} » dispensée à l’antenne. Formateurs passionnés, matériel moderne et ambiance très pédagogique !`,
        source: 'formation'
      });
    }

    game.saveGame();
    game.updateStatsUI();

    // Message de clôture et bilan
    let attendeeParts = [];
    if (internalCount > 0) attendeeParts.push(`${internalCount} bénévole(s) antenne certifié(s)`);
    if (protecCount > 0) attendeeParts.push(`${protecCount} stagiaire(s) Protection Civile accueilli(s)`);
    if (publicCount > 0) attendeeParts.push(`${publicCount} citoyen(s) formé(s)`);
    if (attendeeParts.length === 0) attendeeParts.push(`${totalCount} stagiaire(s) certifié(s)`);

    const summaryText = attendeeParts.join(', ');
    const msg = `Formation validée avec succès : ${summaryText} !${totalRevenue > 0 ? ` (+${totalRevenue} €)` : ''}${tierNotice}`;

    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.recordFormationCompleted === 'function') {
      window.ProtecAdvanced.recordFormationCompleted(game, session);
    }

    game.showToast('Session Validée & Certifiée ! 🎓', msg, 'green');
    this.renderModal(game);
  },

  // 11. RENDU DE L'ONGLET STRUCTURES & ENTREPRISES (FORMATIONS PREMIERS SECOURS)
  renderB2BTab(game) {
    const proposals = game.formationB2BProposals || [];
    const pendingQuotes = proposals.filter(p => p.status === 'pending_quote');
    const evaluatingQuotes = proposals.filter(p => p.status === 'evaluating');
    const acceptedQuotes = proposals.filter(p => p.status === 'accepted');
    const inProgressQuotes = proposals.filter(p => p.status === 'in_progress');
    const completedQuotes = proposals.filter(p => p.status === 'completed');
    const activeSignedCount = acceptedQuotes.length + inProgressQuotes.length;

    // Calcul du CA Formations encaissé total
    const totalRevenueB2B = completedQuotes.reduce((sum, p) => {
      const gross = Number(p.proposed_price || p.proposedPrice || p.client_target_budget || 0);
      const consumable = Number(p.consumable_cost || p.consumableCost || 0);
      return sum + Math.max(0, gross - consumable);
    }, 0);

    const currentFilter = this.b2bFilter || 'tous';
    const filteredProposals = proposals.filter(p => {
      if (currentFilter === 'pending') return p.status === 'pending_quote';
      if (currentFilter === 'evaluating') return p.status === 'evaluating';
      if (currentFilter === 'accepted') return ['accepted', 'in_progress'].includes(p.status);
      if (currentFilter === 'completed') return ['completed', 'rejected'].includes(p.status);
      return true;
    });

    const currentMarkup = (game && game.formationDefaultMarkup !== undefined) ? Number(game.formationDefaultMarkup) : 1.0;
    const now = Date.now();
    const availableTrainers = (game.volunteers || []).filter(v => v.status === 'dispo');
    const availableVehicles = (game.vehicles || []).filter(v => v.status === 'dispo' && !v.requiresTrailer);
    const hasRoom = window.ProtecLocaux && typeof window.ProtecLocaux.hasFormationRoom === 'function' ? window.ProtecLocaux.hasFormationRoom(game) : true;

    return `
      <div class="space-y-6">

        <!-- 1. CARTES STATISTIQUES KPI -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Demandes Reçues</span>
            <div class="flex items-baseline gap-1.5 mt-0.5">
              <strong class="text-xl font-black text-blue-900 mono-num">${pendingQuotes.length}</strong>
              <span class="text-[10px] text-blue-600 font-medium">à chiffrer</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">En Délibération</span>
            <div class="flex items-baseline gap-1.5 mt-0.5">
              <strong class="text-xl font-black text-amber-900 mono-num">${evaluatingQuotes.length}</strong>
              <span class="text-[10px] text-amber-700 font-medium">devis émis</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Signées & En Cours</span>
            <div class="flex items-baseline gap-1.5 mt-0.5">
              <strong class="text-xl font-black text-emerald-900 mono-num">${activeSignedCount}</strong>
              <span class="text-[10px] text-emerald-600 font-medium">sessions</span>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-slate-900 text-white shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">CA Encaissé</span>
            <div class="flex items-baseline gap-1 mt-0.5">
              <strong class="text-lg sm:text-xl font-black text-emerald-400 mono-num">+${totalRevenueB2B.toLocaleString('fr-FR')} €</strong>
              <span class="text-[9px] text-slate-400 font-normal">net</span>
            </div>
          </div>
        </div>

        <!-- 2. ENCADRÉ EXPLICATIF : MODALITÉS & POLITIQUE TARIFAIRE FIXÉE PAR LE JOUEUR -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200/90 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h5 class="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <i data-lucide="info" class="w-4 h-4 text-pc-blue"></i>
                Formations Premiers Secours en Entreprise (SST, PSC, GQS, Extincteurs)
              </h5>
              <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Les entreprises commandent des formations pour leurs salariés. <strong>Certaines entreprises paient un supplément (+30%) pour faire venir le formateur directement dans leurs locaux</strong> (Intra) plutôt que de déplacer leurs salariés dans les salles de formation de notre base (Inter).
              </p>
            </div>
            
            <!-- Réglage du devis par défaut fixé par le joueur -->
            <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs flex-shrink-0">
              <span class="text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap">Tarif Devis par Défaut :</span>
              <select 
                class="text-xs font-black text-pc-blue bg-transparent focus:outline-none cursor-pointer"
                onchange="window.ProtecFormations.setDefaultPricingMarkup(window.game, this.value)"
              >
                <option value="0.9" ${currentMarkup === 0.9 ? 'selected' : ''}>Compétitif (-10% chances max)</option>
                <option value="1.0" ${currentMarkup === 1.0 ? 'selected' : ''}>Standard (100% budget)</option>
                <option value="1.15" ${currentMarkup === 1.15 ? 'selected' : ''}>Recommandé (+15% marge)</option>
                <option value="1.3" ${currentMarkup === 1.3 ? 'selected' : ''}>Prestige (+30% confort)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 3. BARRE D'ACTIONS ET DE FILTRES RAPIDES -->
        <div class="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
          <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button onclick="window.ProtecFormations.setB2BFilter('tous')" class="px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${currentFilter === 'tous' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Toutes (${proposals.length})
            </button>
            <button onclick="window.ProtecFormations.setB2BFilter('pending')" class="px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${currentFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}">
              À Chiffrer (${pendingQuotes.length})
            </button>
            <button onclick="window.ProtecFormations.setB2BFilter('evaluating')" class="px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${currentFilter === 'evaluating' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}">
              En Délibération (${evaluatingQuotes.length})
            </button>
            <button onclick="window.ProtecFormations.setB2BFilter('accepted')" class="px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${currentFilter === 'accepted' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}">
              Signées & En Cours (${activeSignedCount})
            </button>
            <button onclick="window.ProtecFormations.setB2BFilter('completed')" class="px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${currentFilter === 'completed' ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Historique (${completedQuotes.length})
            </button>
          </div>

          <span class="text-[11px] text-slate-500 font-medium hidden sm:inline">
            SST • MAC SST • PSC • GQS en milieu professionnel
          </span>
        </div>

        <!-- 4. LISTE DES OPPORTUNITÉS ET SESSIONS (ENTREPRISES & STRUCTURES) -->
        ${filteredProposals.length === 0 ? `
          <div class="p-8 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-white shadow-xs mx-auto flex items-center justify-center text-2xl text-slate-400">
              🏢
            </div>
            <div>
              <h5 class="text-sm font-black text-slate-800">Aucune opportunité dans cette sélection</h5>
              <p class="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                Les entreprises et mairies locales consultent régulièrement votre antenne pour leurs plans de formation sécurité au travail.
              </p>
            <div class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pc-blue/10 border border-pc-blue/20 text-pc-blue text-xs font-bold mx-auto">
              <i data-lucide="clock" class="w-4 h-4"></i>
              <span>Les demandes arrivent automatiquement selon votre visibilité et votre communication</span>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${filteredProposals.map(p => {
              const cfg = this.TRAINING_B2B_CONFIG[p.training_type] || this.TRAINING_B2B_CONFIG['SST'];
              const isIntra = p.mode === 'intra';
              const hasKit = this.hasTrainingKit(game, cfg.kitRequired);
              const targetBudget = Number(p.client_target_budget || p.clientTargetBudget || 1200);
              const proposedPrice = Number(p.proposed_price || p.proposedPrice || 0);

              // Calcul du temps restant pour la deadline
              const msLeft = (p.deadline || 0) - now;
              const hoursLeft = Math.max(0, Math.floor(msLeft / 3600000));
              const minsLeft = Math.max(0, Math.floor((msLeft % 3600000) / 60000));

              // Données formateur et véhicule
              const assignedTrainer = (game.volunteers || []).find(v => v.id === (p.trainer_id || p.trainerId));
              const assignedVehicle = (game.vehicles || []).find(v => v.id === (p.vehicle_id || p.vehicleId));

              return `
                <div class="p-4 rounded-3xl bg-white border ${p.status === 'accepted' ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-md' : (p.status === 'in_progress' ? 'border-blue-300 ring-2 ring-blue-100 shadow-md' : 'border-slate-200/90 shadow-sm')} space-y-3.5 flex flex-col justify-between transition hover:shadow-md">
                  
                  <!-- En-tête de la carte -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <div class="flex items-center gap-1.5">
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          p.training_type === 'SST' ? 'bg-indigo-100 text-indigo-800' :
                          (p.training_type === 'MAC_SST' ? 'bg-amber-100 text-amber-800' :
                          (p.training_type === 'PSC' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'))
                        }">
                          ${cfg.badge}
                        </span>
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-black ${isIntra ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'} flex items-center gap-1">
                          <i data-lucide="${isIntra ? 'truck' : 'landmark'}" class="w-3 h-3"></i>
                          ${isIntra ? 'Intra (Chez le client)' : 'Inter (À l’antenne)'}
                        </span>
                        ${p.isFidelisation ? `
                          <span class="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 border border-amber-300 text-amber-800">
                            ⭐ Client Fidélisé
                          </span>
                        ` : ''}
                      </div>

                      <!-- Statut de la proposition -->
                      <span class="text-[10px] font-black">
                        ${p.status === 'pending_quote' ? `<span class="text-blue-700">⏳ Réponse due dans ${hoursLeft}h${minsLeft > 0 ? `${minsLeft}m` : ''}</span>` : ''}
                        ${p.status === 'evaluating' ? `<span class="text-amber-700 animate-pulse">⏳ Délibération en cours</span>` : ''}
                        ${p.status === 'accepted' ? `<span class="text-emerald-700">✓ Devis Signé</span>` : ''}
                        ${p.status === 'in_progress' ? `<span class="text-blue-700">🚀 Session en cours</span>` : ''}
                        ${p.status === 'completed' ? `<span class="text-slate-600">✓ Réalisée & Payée</span>` : ''}
                        ${p.status === 'rejected' ? `<span class="text-rose-600">✕ Devis non retenu</span>` : ''}
                      </span>
                    </div>

                    <!-- Titre client & activité -->
                    <div>
                      <h4 class="text-sm font-black text-slate-900 leading-snug flex items-center gap-1.5">
                        <i data-lucide="${p.client_icon || 'building'}" class="w-4 h-4 text-slate-500 flex-shrink-0"></i>
                        <span>${p.client_name}</span>
                      </h4>
                      <div class="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                        <span>${p.client_label || 'Entreprise locale'}</span>
                        <span>•</span>
                        <span>${p.client_city || 'Bassin d’antenne'}</span>
                        <span>•</span>
                        <strong class="text-slate-700">${p.attendees_count} salariés</strong>
                      </div>
                    </div>

                    <!-- Présentation du besoin et prérequis -->
                    <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-[11px]">
                      <div class="flex items-center justify-between">
                        <span class="text-slate-600 font-medium">${cfg.title} (${cfg.durationHours}h)</span>
                        <strong class="text-slate-800 mono-num">Budget client : ~${targetBudget.toLocaleString('fr-FR')} €</strong>
                      </div>

                      <div class="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                        <span class="flex items-center gap-1 ${hasKit ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}">
                          <i data-lucide="${hasKit ? 'check-circle' : 'alert-triangle'}" class="w-3 h-3"></i>
                          ${hasKit ? 'Lot en stock' : 'Lot requis : ' + cfg.kitName}
                        </span>
                        <span class="text-slate-500">
                          Coût consommables : <strong class="text-slate-700">${cfg.consumableCost} €</strong>
                        </span>
                      </div>
                    </div>

                    <!-- AFFICHAGE SELON L'ÉTAT DU DEVIS -->
                    ${p.status === 'evaluating' ? `
                      <div class="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-amber-900 font-bold">Devis proposé : <strong>${proposedPrice.toLocaleString('fr-FR')} €</strong></span>
                          <span class="px-2 py-0.5 rounded-lg bg-amber-200 text-amber-900 font-black mono-num text-[11px]">${p.acceptance_rate || 75}% d’accord</span>
                        </div>
                        <div class="w-full bg-amber-200/80 rounded-full h-1.5 overflow-hidden">
                          <div class="bg-amber-600 h-full rounded-full animate-pulse" style="width: 75%;"></div>
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-amber-800">
                          <span>La direction délibère...</span>
                          <button onclick="window.ProtecFormations.resolveQuote(window.game, '${p.id}', true)" class="font-extrabold text-amber-900 underline hover:text-amber-950 cursor-pointer">
                            ⚡ Consulter la décision
                          </button>
                        </div>
                      </div>
                    ` : ''}

                    ${p.status === 'accepted' ? `
                      <div class="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2.5">
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-emerald-950 font-black">Montant validé : <strong class="text-emerald-700 mono-num">${proposedPrice.toLocaleString('fr-FR')} €</strong></span>
                          <span class="text-[10px] text-emerald-800 font-bold">Marge nette estimée : +${Math.max(0, proposedPrice - cfg.consumableCost).toLocaleString('fr-FR')} €</span>
                        </div>

                        <!-- Choix du Formateur -->
                        <div>
                          <label class="block text-[10px] font-black uppercase text-slate-500 mb-0.5">1. Formateur qualifié requis (${cfg.trainerSkillLabel}) :</label>
                          <select id="b2b-trainer-${p.id}" class="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white">
                            <option value="">Sélectionner un formateur habilité...</option>
                            ${availableTrainers.map(t => {
                              const check = this.isEligibleTrainer(t, { id: p.training_type });
                              return `
                                <option value="${t.id}" class="${check.eligible ? 'text-slate-900 font-bold' : 'text-slate-400 italic'}">
                                  ${check.eligible ? '✓ ' : '⚠️ '} ${t.name} (${t.role || t.rank}) ${check.eligible ? `[${check.badge || 'Qualifié'}]` : '[Non habilité]'}
                                </option>
                              `;
                            }).join('')}
                          </select>
                        </div>

                        <!-- Choix du Véhicule si Intra -->
                        ${isIntra ? `
                          <div>
                            <label class="block text-[10px] font-black uppercase text-slate-500 mb-0.5">2. Véhicule d'antenne (Transport malles & matériel) :</label>
                            <select id="b2b-vehicle-${p.id}" class="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white">
                              <option value="">Sélectionner un véhicule (VL, VTU, VTP)...</option>
                              ${availableVehicles.map(veh => `
                                <option value="${veh.id}">${veh.name} (${veh.model || veh.type}) - Dispo</option>
                              `).join('')}
                            </select>
                          </div>
                        ` : `
                          <div class="text-[10px] ${hasRoom ? 'text-emerald-800 font-bold' : 'text-amber-800 font-bold'} flex items-center gap-1">
                            <i data-lucide="${hasRoom ? 'check-circle' : 'alert-circle'}" class="w-3.5 h-3.5"></i>
                            <span>${hasRoom ? 'Salle de formation opérationnelle à l’antenne ✓' : 'Attention : Aucune salle de formation aménagée aux locaux !'}</span>
                          </div>
                        `}
                      </div>
                    ` : ''}

                    ${p.status === 'in_progress' ? `
                      <div class="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
                        <div class="flex items-center justify-between text-blue-900 font-bold">
                          <span>Session en cours chez le client</span>
                          <span class="animate-pulse text-blue-700 font-black">● Active</span>
                        </div>
                        <div class="text-[11px] text-blue-800 space-y-0.5">
                          <div>Formateur engagé : <strong>${assignedTrainer ? assignedTrainer.name : 'Formateur'}</strong></div>
                          ${assignedVehicle ? `<div>Véhicule mobilisé : <strong>${assignedVehicle.name} (${assignedVehicle.type})</strong></div>` : ''}
                        </div>
                      </div>
                    ` : ''}

                    ${p.status === 'completed' ? `
                      <div class="p-2.5 rounded-2xl bg-slate-100 text-xs space-y-1">
                        <div class="flex items-center justify-between text-slate-700 font-bold">
                          <span>Chiffre d’affaires encaissé :</span>
                          <strong class="text-emerald-700 mono-num">+${proposedPrice.toLocaleString('fr-FR')} €</strong>
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Consommables déduits : -${cfg.consumableCost} €</span>
                          <span>Bénéfice net : <strong class="text-slate-800">+${Math.max(0, proposedPrice - cfg.consumableCost).toLocaleString('fr-FR')} €</strong></span>
                        </div>
                        ${p.training_type === 'SST' ? `
                          <div class="text-[10px] text-indigo-700 font-bold pt-1 border-t border-slate-200">
                            ⭐ Recyclage MAC SST (24 mois) planifié pour ce client !
                          </div>
                        ` : ''}
                      </div>
                    ` : ''}

                    ${p.status === 'rejected' ? `
                      <div class="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                        <span class="font-bold block">Motif du refus client :</span>
                        <p class="text-[11px] text-rose-700">${p.rejectionReason || 'Offre concurrente retenue.'}</p>
                      </div>
                    ` : ''}

                  </div>

                  <!-- Boutons d'Action selon l'état -->
                  <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    ${p.status === 'pending_quote' ? `
                      <span class="text-[10px] text-slate-400 font-bold">Jauge de chance calculée en direct</span>
                      <button onclick="window.ProtecFormations.openQuoteModal('${p.id}')" class="px-4 py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                        Émettre un Devis
                      </button>
                    ` : ''}

                    ${p.status === 'evaluating' ? `
                      <span class="text-[10px] text-amber-700 font-medium">Délibération sous 40s</span>
                      <button onclick="window.ProtecFormations.resolveQuote(window.game, '${p.id}', true)" class="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                        Vérifier l'accord
                      </button>
                    ` : ''}

                    ${p.status === 'accepted' ? `
                      <span class="text-[10px] text-slate-400">Prêt au déploiement</span>
                      <button onclick="
                        const trId = document.getElementById('b2b-trainer-${p.id}').value;
                        const vhId = document.getElementById('b2b-vehicle-${p.id}') ? document.getElementById('b2b-vehicle-${p.id}').value : null;
                        window.ProtecFormations.startB2BSession(window.game, '${p.id}', trId, vhId);
                      " class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="play" class="w-3.5 h-3.5"></i>
                        Démarrer la Session B2B
                      </button>
                    ` : ''}

                    ${p.status === 'in_progress' ? `
                      <span class="text-[10px] text-blue-600 font-bold">Formation sur le terrain</span>
                      <button onclick="window.ProtecFormations.completeB2BSession(window.game, '${p.id}')" class="px-4 py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="award" class="w-3.5 h-3.5"></i>
                        Clôturer & Encaisser
                      </button>
                    ` : ''}

                    ${p.status === 'completed' ? `
                      <span class="text-[10px] text-emerald-700 font-bold">✓ Attestations délivrées</span>
                      <span class="text-xs font-black text-emerald-600">Prestation honorée</span>
                    ` : ''}

                    ${p.status === 'rejected' ? `
                      <span class="text-[10px] text-slate-400">Opportunité archivée</span>
                      <span class="text-xs font-bold text-slate-500">Classé sans suite</span>
                    ` : ''}
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        `}

      </div>
    `;
  },

  // 12. RENDU DE LA MODALE D'ÉLABORATION DU DEVIS DE FORMATION (INTERACTIVE AVEC JAUGE LIVE)
  renderQuoteModalHTML(game, proposal) {
    if (!proposal) return '';

    const cfg = this.TRAINING_B2B_CONFIG[proposal.training_type] || this.TRAINING_B2B_CONFIG['SST'];
    const targetBudget = Number(proposal.client_target_budget || proposal.clientTargetBudget || 1200);
    const initialPrice = Number(proposal.proposed_price || proposal.proposedPrice || this.getDefaultQuotePrice(game, proposal));
    const oddsData = this.calculateQuoteOdds(game, proposal, initialPrice);

    const minSlider = Math.round(targetBudget * 0.5);
    const maxSlider = Math.round(targetBudget * 1.8);

    const hasKit = this.hasTrainingKit(game, cfg.kitRequired);
    const hasTrainer = (game.volunteers || []).some(v => this.isEligibleTrainer(v, { id: proposal.training_type }).eligible);
    const isIntra = proposal.mode === 'intra';
    const hasVeh = isIntra ? (game.vehicles || []).some(v => v.status === 'dispo' && !v.requiresTrailer) : true;
    const hasRoom = !isIntra ? (window.ProtecLocaux && typeof window.ProtecLocaux.hasFormationRoom === 'function' ? window.ProtecLocaux.hasFormationRoom(game) : true) : true;

    return `
      <div id="b2b-quote-modal-backdrop" class="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-fade-in">
        <div class="glass-panel-heavy rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl border border-white/90 space-y-4 animate-scale-in max-h-[92vh] overflow-y-auto">
          
          <!-- En-tête de la modale de devis -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-200">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-pc-blue/10 text-pc-blue flex items-center justify-center text-xl">
                💼
              </div>
              <div>
                <h4 class="text-sm font-black text-slate-900 leading-tight">Élaboration du Devis de Formation</h4>
                <p class="text-[11px] text-slate-500">${proposal.client_name} • ${proposal.client_city || 'Antenne'}</p>
              </div>
            </div>
            <button onclick="window.ProtecFormations.closeQuoteModal()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer font-bold">
              ✕
            </button>
          </div>

          <!-- Synthèse de la demande -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Formation</span>
              <strong class="text-slate-800 text-xs">${cfg.badge}</strong>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Effectif</span>
              <strong class="text-slate-800 text-xs">${proposal.attendees_count} salariés</strong>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Modalité</span>
              <strong class="text-xs ${isIntra ? 'text-purple-700 font-black' : 'text-slate-800'}">${isIntra ? 'Sur site client (Intra)' : 'À l’antenne (Inter)'}</strong>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Budget Cible Client</span>
              <strong class="text-pc-blue text-xs mono-num">~${targetBudget.toLocaleString('fr-FR')} €</strong>
            </div>
          </div>

          ${isIntra ? `
            <div class="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] flex items-center gap-2">
              <i data-lucide="truck" class="w-4 h-4 text-purple-600 flex-shrink-0"></i>
              <span><strong>Formation sur site client</strong> : L'entreprise paie plus cher car notre formateur se déplace dans ses locaux avec le matériel pédagogique (évite à l'entreprise de déplacer ses salariés).</span>
            </div>
          ` : ''}

          <!-- Formulaire de prix dynamique avec slider interactif et saisie libre -->
          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-xs font-black uppercase tracking-wider text-slate-700 block">Montant du Devis Proposé (€) :</label>
                <span class="text-[10px] text-slate-400 font-medium">Modifiable librement par le joueur</span>
              </div>
              <div class="flex items-center gap-1.5">
                <input 
                  type="number" 
                  id="b2b-quote-price-input" 
                  value="${initialPrice}" 
                  min="50" 
                  max="10000" 
                  step="10"
                  oninput="window.ProtecFormations.updateQuoteModalLive('${proposal.id}', this.value)"
                  class="w-28 p-1.5 rounded-xl border border-slate-300 font-black text-right text-base text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pc-blue mono-num"
                />
                <span class="text-sm font-black text-slate-600">€</span>
              </div>
            </div>

            <!-- Slider fluide -->
            <input 
              type="range" 
              id="b2b-quote-price-slider" 
              min="${minSlider}" 
              max="${maxSlider}" 
              step="10" 
              value="${initialPrice}"
              oninput="window.ProtecFormations.updateQuoteModalLive('${proposal.id}', this.value)"
              class="w-full accent-pc-blue cursor-pointer"
            />

            <!-- Raccourcis de tarification rapides -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <button 
                type="button" 
                onclick="window.ProtecFormations.updateQuoteModalLive('${proposal.id}', ${Math.round(targetBudget * 0.9)})" 
                class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
              >
                Compétitif (-10% : ${Math.round(targetBudget * 0.9)} €)
              </button>
              <button 
                type="button" 
                onclick="window.ProtecFormations.updateQuoteModalLive('${proposal.id}', ${targetBudget})" 
                class="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-pc-blue text-[10px] font-bold cursor-pointer"
              >
                Cible Client (${targetBudget} €)
              </button>
              <button 
                type="button" 
                onclick="window.ProtecFormations.updateQuoteModalLive('${proposal.id}', ${Math.round(targetBudget * 1.15)})" 
                class="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold cursor-pointer"
              >
                Recommandé (+15% : ${Math.round(targetBudget * 1.15)} €)
              </button>
              <button 
                type="button" 
                onclick="window.ProtecFormations.updateQuoteModalLive('${proposal.id}', ${Math.round(targetBudget * 1.30)})" 
                class="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-[10px] font-bold cursor-pointer"
              >
                Prestige (+30% : ${Math.round(targetBudget * 1.30)} €)
              </button>
            </div>
          </div>

          <!-- BILAN FINANCIER PRÉVISIONNEL DU DEVIS -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span class="text-xs font-black uppercase text-slate-700 block">Bilan Financier Prévisionnel :</span>
              <span class="text-[11px] text-slate-500">Recette nette après déduction des coûts pédagogiques & matériel</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block font-medium">Bénéfice net estimé</span>
              <strong id="b2b-quote-margin-display" class="text-base font-black font-mono text-emerald-700 leading-tight">+${oddsData.marginNet.toLocaleString('fr-FR')} €</strong>
            </div>
          </div>

          <!-- CHECKLIST DES PRÉREQUIS MATÉRIELS ET QUALIFICATIONS -->
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
            <h5 class="text-[11px] font-black uppercase tracking-wider text-slate-700">Contrôle des Prérequis Opérationnels :</h5>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div class="flex items-center gap-1.5 ${hasKit ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}">
                <i data-lucide="${hasKit ? 'check-circle' : 'alert-triangle'}" class="w-3.5 h-3.5"></i>
                <span>Lot requis : ${cfg.kitName}</span>
              </div>
              <div class="flex items-center gap-1.5 ${hasTrainer ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}">
                <i data-lucide="${hasTrainer ? 'check-circle' : 'alert-triangle'}" class="w-3.5 h-3.5"></i>
                <span>Formateur qualifié (${cfg.trainerSkillLabel})</span>
              </div>
              <div class="flex items-center gap-1.5 ${hasVeh ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}">
                <i data-lucide="${hasVeh ? 'check-circle' : 'alert-triangle'}" class="w-3.5 h-3.5"></i>
                <span>${isIntra ? 'Véhicule de transport VL/VTU' : 'Accueil sur place'}</span>
              </div>
              <div class="flex items-center gap-1.5 ${hasRoom ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}">
                <i data-lucide="${hasRoom ? 'check-circle' : 'alert-triangle'}" class="w-3.5 h-3.5"></i>
                <span>${isIntra ? 'Locaux entreprise cliente' : 'Salle pédagogique antenne'}</span>
              </div>
            </div>
          </div>

          <!-- Boutons de validation -->
          <div class="pt-2 flex items-center justify-end gap-2.5">
            <button onclick="window.ProtecFormations.closeQuoteModal()" class="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer">
              Annuler
            </button>
            <button onclick="
              const pr = document.getElementById('b2b-quote-price-input').value;
              window.ProtecFormations.submitQuote(window.game, '${proposal.id}', pr);
            " class="px-6 py-2.5 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="send" class="w-4 h-4"></i>
              Valider & Transmettre le Devis
            </button>
          </div>

        </div>
      </div>
    `;
  },

  // Rendu de l'interface modale
  renderModal(game) {
    this.injectState(game);
    this.checkAnnualRecycling(game);
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (!body || !title) return;

    title.textContent = 'Pôle Formations & Pédagogie de Sécurité Civile';
    subtitle.textContent = 'Cursus Entreprises, Grand Public, Secourisme Opérationnel, Recyclages FC et Filière Formateurs';
    icon.setAttribute('data-lucide', 'graduation-cap');

    const pendingB2BCount = (game.formationB2BProposals || []).filter(p => p.status === 'pending_quote').length;

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

    const recyclingNeededCount = (game.volunteers || []).filter(v => this.volunteerNeedsRecycling(v, game)).length;

    const navTabsHTML = `
      <!-- Barre de navigation supérieure des pôles de formation -->
      <div class="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex-wrap">
          <button onclick="window.ProtecFormations.setMainTab('entreprises')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.mainTab === 'entreprises' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer'}">
            <i data-lucide="building-2" class="w-3.5 h-3.5"></i>
            <span>Structures & Entreprises</span>
            ${pendingB2BCount > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${this.mainTab === 'entreprises' ? 'bg-white text-pc-blue' : 'bg-pc-blue text-white'}">${pendingB2BCount}</span>` : ''}
          </button>
          <button onclick="window.ProtecFormations.setMainTab('grand_public')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.mainTab === 'grand_public' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer'}">
            <i data-lucide="users" class="w-3.5 h-3.5"></i>
            <span>Grand Public & Internes</span>
            ${activeSessions.length > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${this.mainTab === 'grand_public' ? 'bg-white text-pc-blue' : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}">${activeSessions.length}</span>` : ''}
          </button>
          <button onclick="window.ProtecFormations.setMainTab('recyclages')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.mainTab === 'recyclages' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer'}">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            <span>🔄 Validités & Recyclages (FC)</span>
            ${recyclingNeededCount > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${this.mainTab === 'recyclages' ? 'bg-amber-400 text-slate-950' : 'bg-rose-500 text-white animate-pulse'}">${recyclingNeededCount}</span>` : ''}
          </button>
          <button onclick="window.game.openPlanningFiltered('formations')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 hover:text-emerald-950 dark:hover:text-emerald-200 cursor-pointer border border-transparent hover:border-emerald-300 dark:hover:border-emerald-500/40" title="Consulter le calendrier complet du pôle formations">
            <i data-lucide="calendar" class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"></i>
            <span>📅 Planning des Formations</span>
          </button>
        </div>
        ${this.mainTab === 'entreprises' ? `
          <div class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1.5 shadow-xs">
            <i data-lucide="sparkles" class="w-3.5 h-3.5 text-pc-blue dark:text-sky-400"></i>
            <span>Demandes entrantes auto (Notoriété & Communication)</span>
          </div>
        ` : this.mainTab === 'recyclages' ? `
          <div class="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold text-[11px] flex items-center gap-1.5 shadow-xs">
            <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-amber-600"></i>
            <span>Échéance réglementaire : 31/12 de l'année N+1</span>
          </div>
        ` : ''}
      </div>
    `;

    // Si onglet Recyclages & Validités sélectionné :
    if (this.mainTab === 'recyclages') {
      body.innerHTML = `
        <div class="space-y-6">
          ${navTabsHTML}
          ${this.renderRecyclagesTab(game)}
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Si onglet Entreprises sélectionné :
    if (this.mainTab === 'entreprises') {
      const activeProposal = this.activeQuoteModalProposalId ? (game.formationB2BProposals || []).find(p => p.id === this.activeQuoteModalProposalId) : null;
      body.innerHTML = `
        <div class="space-y-6">
          ${navTabsHTML}
          ${this.renderB2BTab(game)}
          ${activeProposal ? this.renderQuoteModalHTML(game, activeProposal) : ''}
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Sinon, onglet historique Grand Public & Internes
    const primaryStation = (game.stations && game.stations[0]) || { name: 'Antenne', city: 'Nancy' };
    const stationName = primaryStation.name || `Antenne de ${primaryStation.city || 'Nancy'}`;
    const totalTrainingRooms = window.ProtecLocaux?.getStationTrainingRoomsCount ? window.ProtecLocaux.getStationTrainingRoomsCount(primaryStation) : 1;

    // Responsable Formation désigné au sein de l'antenne
    const respFormationVol = (game.volunteers || []).find(v => v.poleRoleId === 'resp_formation') ||
      (game.poles ? game.volunteers.find(v => v.id === game.poles.find(p => p.id === 'formation')?.responsibleId) : null);

    const respFormationBannerHTML = `
      <div class="p-3.5 rounded-2xl border ${respFormationVol ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border-emerald-300' : 'bg-slate-50 border-slate-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl ${respFormationVol ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'} flex items-center justify-center font-black text-lg shadow-sm">
            <i data-lucide="graduation-cap" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-black uppercase text-slate-900 tracking-wide">Responsable Formation d'Antenne</span>
              ${respFormationVol ? `<span class="px-2 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">En poste</span>` : `<span class="px-2 py-0.2 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300">Poste Vacant</span>`}
            </div>
            <div class="text-[11px] text-slate-600">
              ${respFormationVol 
                ? `<strong>${respFormationVol.name}</strong> (${respFormationVol.rank}) • <em>Gère automatiquement les inscriptions et la qualification des bénévoles (PSE1, PSE2, FC PSE).</em>` 
                : `Nommez un Responsable Formation dans l'onglet Pôles pour activer l'automatisation des formations de vos bénévoles.`}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          ${respFormationVol ? `
            <div class="px-3 py-1.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gestion Auto Active</span>
            </div>
          ` : `
            <button onclick="window.game.openModule('poles')" class="px-3 py-1.5 rounded-xl bg-pc-blue text-white text-xs font-black hover:bg-pc-blue-light transition shadow-sm flex items-center gap-1 cursor-pointer">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span>Nommer Responsable</span>
            </button>
          `}
        </div>
      </div>
    `;

    body.innerHTML = `
      <div class="space-y-6">
        ${navTabsHTML}

        <!-- Responsable Formation & Gestion Automatique des Bénévoles -->
        ${respFormationBannerHTML}

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

        <!-- Section 2 : Organiser une Session de Formation (Antenne, Réseau & Grand Public) -->
        <div class="p-5 rounded-3xl glass-card space-y-4 border border-slate-200/90 shadow-xs">
          <!-- En-tête : Titre et Alerte Kit -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/80 pb-3">
            <div>
              <h4 class="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <i data-lucide="plus-circle" class="w-4 h-4 text-emerald-600"></i>
                Organiser une Formation à la Base
              </h4>
              <span class="text-[11px] text-slate-500 dark:text-slate-400">Planification d'une session avec formateurs, matériel et salles de l'antenne</span>
            </div>
            <div id="new-course-kit-info">
              <!-- Rempli dynamiquement avec le kit requis -->
            </div>
          </div>

          <div class="space-y-4 text-xs">
            <!-- 1. Type de Formation & Lieu (2 Colonnes équilibrées 50% / 50%) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Type de Formation :</label>
                <select id="new-course-id" onchange="window.ProtecFormations.updateNewSessionFormPreview(window.game)" class="w-full text-xs p-2.5 rounded-xl border border-slate-200 glass-input font-black text-slate-800 bg-white">
                  <optgroup label="Grand Public & Citoyens">
                    <option value="GQS">GQS (2h - Gestes Qui Sauvent • Sensibilisation)</option>
                    <option value="PSC" selected>PSC (7h - Prévention et Secours Civiques • Diplôme de base)</option>
                    <option value="SST">SST (14h - Sauveteur Secouriste du Travail)</option>
                    <option value="EXTINCTEUR">Manipulation Extincteurs (3h - Équipier Prévention Incendie EPI)</option>
                  </optgroup>
                  <optgroup label="Secourisme Opérationnel">
                    <option value="PSE1">PSE1 (35h - Premiers Secours en Équipe 1 • Secouriste)</option>
                    <option value="PSE2">PSE2 (28h - Premiers Secours en Équipe 2 • Équipier Secouriste)</option>
                    <option value="FC_PSE">Recyclage FC PSE (6h - Formation Continue Annuelle PSE 1 & 2)</option>
                    <option value="MAC_SST">Recyclage MAC SST (7h - Actualisation des compétences)</option>
                    <option value="CE">Chef d’Équipe - CE (21h - Commandement Opérationnel)</option>
                    <option value="CD">Chef de Dispositif - CD (24h - Direction de Poste)</option>
                    <option value="SSA">SSA (28h - Surveillance et Sauvetage Aquatique)</option>
                  </optgroup>
                  <optgroup label="Soutien Psychologique">
                    <option value="AEP1">AEP1 (7h - Aide & Écoute Psychologique Initiale)</option>
                    <option value="AEP2">AEP2 (14h - Prise en charge traumatique & CAI)</option>
                  </optgroup>
                  <optgroup label="Filière Pédagogique (Formateurs)">
                    <option value="PICF">PIC F (21h - Pédagogie Initiale de Formateur)</option>
                    <option value="FORM_PSC">Formateur PSC (14h - Diplôme Formateur PSC)</option>
                    <option value="FORM_PS">Formateur PS (28h - Formateur Premiers Secours)</option>
                    <option value="FORM_SST">Formateur SST (21h - Formateur SST)</option>
                    <option value="FORM_AEP">Formateur AEP (21h - Formateur Écoute Psycho)</option>
                    <option value="CEF">CEF (35h - Concepteur Encadrant de Formation)</option>
                    <option value="FDF">FdF (42h - Formateur de Formateurs Fédéral)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Lieu de la formation :</label>
                <div class="grid grid-cols-1 ${totalTrainingRooms > 1 ? 'sm:grid-cols-2' : ''} gap-2">
                  <select id="new-course-loc" class="w-full text-xs p-2.5 rounded-xl border border-slate-200 glass-input font-bold text-pc-blue bg-white" onchange="
                    const roomWrap = document.getElementById('new-course-room-wrap');
                    const customWrap = document.getElementById('new-course-custom-loc-wrap');
                    if (roomWrap) roomWrap.style.display = (this.value === 'antenne' && ${totalTrainingRooms} > 1) ? 'block' : 'none';
                    if (customWrap) customWrap.style.display = (this.value === 'externe') ? 'block' : 'none';
                  ">
                    <option value="antenne" selected>🏛️ Salle de Formation de la Base</option>
                    <option value="externe">📍 Autre Salle / Lieu Externe</option>
                  </select>

                  ${totalTrainingRooms > 1 ? `
                    <div id="new-course-room-wrap">
                      <select id="new-course-room" class="w-full text-xs p-2.5 rounded-xl border border-slate-200 glass-input font-bold text-indigo-700 bg-white">
                        ${Array.from({ length: totalTrainingRooms }, (_, i) => `<option value="${i + 1}">Salle n°${i + 1}</option>`).join('')}
                      </select>
                    </div>
                  ` : `<input type="hidden" id="new-course-room" value="1" />`}
                </div>

                <div id="new-course-custom-loc-wrap" style="display:none;" class="mt-2">
                  <input type="text" id="new-course-custom-loc" placeholder="Précisez le lieu (ex: Salle Municipale Pasteur, Mairie...)" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-medium bg-white" />
                </div>
              </div>
            </div>

            <!-- 2. Dates & Horaires (Grille 4 colonnes régulières) -->
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Date & Horaires de la Session :</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <span class="text-[9px] font-bold text-slate-400 block mb-0.5">Jour :</span>
                  <input type="number" id="new-course-day" min="1" max="31" value="${Math.min(28, (game.clock?.day || 1) + 2)}" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-center bg-white" />
                </div>
                <div>
                  <span class="text-[9px] font-bold text-slate-400 block mb-0.5">Mois :</span>
                  <select id="new-course-month" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800 bg-white">
                    ${['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'].map((m, idx) => `
                      <option value="${idx}" ${idx === (game.clock?.month || 0) ? 'selected' : ''}>${m}</option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <span class="text-[9px] font-bold text-slate-400 block mb-0.5">Année :</span>
                  <input type="number" id="new-course-year" value="${game.clock?.year || 2026}" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-center bg-white" />
                </div>
                <div>
                  <span class="text-[9px] font-bold text-slate-400 block mb-0.5">Début :</span>
                  <select id="new-course-hour" class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800 bg-white">
                    <option value="8">08:00</option>
                    <option value="9" selected>09:00</option>
                    <option value="10">10:00</option>
                    <option value="13">13:30</option>
                    <option value="14">14:00</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 3. Répartition des Places (Capacité Totale & Quotas Internes en 3 colonnes parfaites) -->
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Capacité & Réservations Internes :</label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <span class="text-[9px] font-bold text-slate-500 block mb-0.5">Places Totales (Capacité) :</span>
                  <input 
                    type="number" 
                    id="new-course-total-seats" 
                    min="4" 
                    max="20" 
                    value="10" 
                    oninput="window.ProtecFormations.updateNewSessionFormPreview(window.game)" 
                    class="w-full text-xs p-2 rounded-xl border border-slate-200 glass-input font-black text-slate-900 bg-white" 
                  />
                </div>

                <div>
                  <span class="text-[9px] font-bold text-indigo-700 block mb-0.5">Places Interne Antenne (Bénévoles) :</span>
                  <input 
                    type="number" 
                    id="new-course-antenne-seats" 
                    min="0" 
                    max="20" 
                    value="4" 
                    oninput="window.ProtecFormations.updateNewSessionFormPreview(window.game)" 
                    class="w-full text-xs p-2 rounded-xl border border-indigo-200 glass-input font-black text-indigo-800 bg-indigo-50/50" 
                  />
                </div>

                <div>
                  <span class="text-[9px] font-bold text-pc-blue block mb-0.5">Places Interne Protection Civile (Réseau) :</span>
                  <input 
                    type="number" 
                    id="new-course-protec-seats" 
                    min="0" 
                    max="20" 
                    value="2" 
                    oninput="window.ProtecFormations.updateNewSessionFormPreview(window.game)" 
                    class="w-full text-xs p-2 rounded-xl border border-blue-200 glass-input font-black text-pc-blue bg-blue-50/50" 
                  />
                </div>
              </div>
            </div>

            <!-- 4. Ouverture Grand Public & Tarification (Encart pleine largeur équilibré) -->
            <div class="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    id="new-course-open-public" 
                    checked 
                    onchange="window.ProtecFormations.updateNewSessionFormPreview(window.game)" 
                    class="w-4 h-4 text-emerald-600 rounded cursor-pointer" 
                  />
                  <span class="text-xs font-black text-slate-800 dark:text-white">Ouvrir les places restantes au Grand Public</span>
                </label>
                <div id="new-course-public-price-wrap" class="flex items-center gap-1.5">
                  <span class="text-[10px] font-bold uppercase text-slate-400">Tarif / place :</span>
                  <input 
                    type="number" 
                    id="new-course-public-price" 
                    value="60" 
                    min="10" 
                    max="600" 
                    step="5" 
                    oninput="this.dataset.customized = 'true'" 
                    class="w-20 p-1.5 rounded-lg border border-slate-300 font-black text-right text-xs mono-num bg-white dark:bg-slate-700 dark:text-white" 
                  />
                  <span class="text-xs font-bold text-slate-600 dark:text-slate-300">€</span>
                </div>
              </div>

              <!-- Jauge de prévisualisation des places -->
              <div class="text-[11px] bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80" id="new-course-seats-preview">
                <!-- Rempli dynamiquement -->
              </div>
            </div>

            <!-- 5. Formateur de l'antenne -->
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400 block mb-1">Formateur de l’Antenne (ou Renfort Fédéral) :</label>
              <select id="new-course-trainer" class="w-full text-xs p-2.5 rounded-xl border border-slate-200 glass-input font-bold text-slate-800 bg-white dark:bg-slate-700 dark:text-white">
                <option value="">Affecter plus tard ou solliciter un renfort...</option>
                ${trainers.map(t => {
                  return `<option value="${t.id}">${t.name} (${t.role || t.rank})</option>`;
                }).join('')}
              </select>
            </div>

            <!-- 6. Bouton de Programmation & Note d'information -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
              <p class="text-[11px] text-slate-500 dark:text-slate-400 italic">
                📢 <strong>Remplissage Grand Public :</strong> Les places ouvertes se remplissent dynamiquement au fil de l'eau grâce à votre visibilité (campagnes de communication réseaux sociaux et affichage mairie).
              </p>
              <button onclick="window.ProtecFormations.createOrganizedSessionFromUI(window.game)" class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                <i data-lucide="calendar-plus" class="w-4 h-4"></i>
                Valider & Ouvrir la Session
              </button>
            </div>
          </div>
        </div>

        <!-- Section 3 : Sessions Ouvertes au Calendrier -->
        <div class="space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 class="text-xs font-black uppercase text-slate-800">Sessions de Formation Ouvertes (${activeSessions.length})</h4>
              <span class="text-[10px] text-slate-400">Suivi des jauges, affectation des formateurs et inscriptions</span>
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
            <div class="p-8 rounded-3xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <div class="w-12 h-12 rounded-2xl bg-white shadow-xs mx-auto flex items-center justify-center text-2xl text-slate-400">🎓</div>
              <h5 class="text-sm font-black text-slate-800">Aucune session de formation en cours</h5>
              <p class="text-xs text-slate-500 max-w-md mx-auto">Programmez une session ci-dessus pour former vos bénévoles internes ou accueillir des citoyens grand public.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${activeSessions.map(sess => {
                const assignedTrainer = (game.volunteers || []).find(v => v.id === sess.trainerId) || sess.assignedTrainer || (sess.trainerId && String(sess.trainerId).startsWith('ext_') ? { name: 'Formateur Renfort (Antenne Partenaire)', role: 'Formateur Inter-Antennes', rank: 'Formateur', isExternal: true } : null);
                const course = this.catalog.find(c => c.id === sess.courseId);

                const internalSeats = Number(sess.internalAntenneSeats) || 0;
                const internalBooked = (sess.registeredCandidates || []).length;

                const protecSeats = Number(sess.internalProtecSeats) || 0;
                const protecBooked = (sess.registeredProtecReinforcements || []).length;

                const publicMax = Number(sess.publicSeatsMax) || 0;
                const publicBooked = Number(sess.publicSeatsBooked) || 0;
                const priceSeat = Number(sess.publicPrice) || 60;
                const publicRevenue = publicBooked * priceSeat;

                const totalFilled = internalBooked + protecBooked + publicBooked;
                const totalCapacity = Number(sess.totalSeats || sess.maxCandidates) || 10;

                const hasKit = course?.kitRequired ? this.hasTrainingKit(game, course.kitRequired) : true;

                return `
                  <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between hover:shadow-md transition">
                    
                    <div class="space-y-3">
                      <!-- En-tête session -->
                      <div class="flex items-center justify-between flex-wrap gap-1">
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          ${course?.title ? course.id : 'Session Formation'}
                        </span>
                        <span class="text-xs font-bold font-mono text-emerald-700">
                          ${publicBooked > 0 ? `+${publicRevenue.toLocaleString('fr-FR')} € encaissés` : 'Trésorerie à venir'}
                        </span>
                      </div>

                      <div>
                        <h5 class="text-xs sm:text-sm font-black text-slate-900 leading-snug">${sess.title}</h5>
                        <div class="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                          <span>📍 ${sess.locationLabel || 'Salle de la Base'}</span>
                          <span>•</span>
                          <span>🗓️ ${sess.dateDesc || 'Au calendrier'}</span>
                        </div>
                      </div>

                      <!-- Kit requis de la base -->
                      ${course?.kitRequired ? `
                        <div class="p-2 rounded-xl text-[10px] font-bold flex items-center justify-between ${hasKit ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}">
                          <span class="flex items-center gap-1">
                            <i data-lucide="${hasKit ? 'check-circle' : 'alert-triangle'}" class="w-3.5 h-3.5"></i>
                            ${hasKit ? 'Lot pédagogique disponible :' : 'Lot requis à la base :'} ${course.kitName || course.kitRequired}
                          </span>
                          <span class="text-[9px] uppercase font-black">${hasKit ? 'En stock' : 'Manquant'}</span>
                        </div>
                      ` : ''}

                      <!-- JAUGE DES 3 CATÉGORIES DE PLACES -->
                      <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
                        <div class="flex items-center justify-between text-[11px]">
                          <span class="font-bold text-slate-700">Remplissage global :</span>
                          <strong class="font-black text-slate-900">${totalFilled} / ${totalCapacity} stagiaires</strong>
                        </div>

                        <!-- 1. Interne Antenne -->
                        <div class="space-y-1">
                          <div class="flex items-center justify-between text-[10px]">
                            <span class="text-indigo-800 font-bold">1. Bénévoles Antenne (Gratuit) :</span>
                            <strong class="text-indigo-900 mono-num">${internalBooked} / ${internalSeats}</strong>
                          </div>
                          <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-indigo-600 h-full rounded-full transition-all" style="width: ${internalSeats > 0 ? (internalBooked / internalSeats) * 100 : 0}%;"></div>
                          </div>
                        </div>

                        <!-- 2. Interne Protection Civile -->
                        <div class="space-y-1">
                          <div class="flex items-center justify-between text-[10px]">
                            <span class="text-pc-blue font-bold">2. Protection Civile (Solidarité Fédérale) :</span>
                            <strong class="text-blue-900 mono-num">${protecBooked} / ${protecSeats}</strong>
                          </div>
                          <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-pc-blue h-full rounded-full transition-all" style="width: ${protecSeats > 0 ? (protecBooked / protecSeats) * 100 : 0}%;"></div>
                          </div>
                        </div>

                        <!-- 3. Grand Public -->
                        <div class="space-y-1">
                          <div class="flex items-center justify-between text-[10px]">
                            <span class="text-emerald-800 font-bold">3. Grand Public (${priceSeat} € / place) :</span>
                            <strong class="text-emerald-900 mono-num">${publicBooked} / ${publicMax}</strong>
                          </div>
                          <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-emerald-600 h-full rounded-full transition-all" style="width: ${publicMax > 0 ? (publicBooked / publicMax) * 100 : 0}%;"></div>
                          </div>
                        </div>
                      </div>

                      <!-- Affectation du Formateur -->
                      <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] font-bold uppercase text-slate-400">Formateur responsable :</span>
                          ${assignedTrainer?.isExternal ? '<span class="px-1.5 py-0.2 rounded text-[8px] font-black bg-indigo-100 text-indigo-800">Renfort Réseau</span>' : ''}
                        </div>
                        <div class="font-black text-slate-800 text-xs">
                          ${assignedTrainer ? `${assignedTrainer.name} (${assignedTrainer.role || assignedTrainer.rank || 'Formateur'})` : '<span class="text-amber-600 font-bold">⚠️ Aucun formateur affecté</span>'}
                        </div>
                        <select onchange="window.ProtecFormations.assignTrainer(window.game, '${sess.id}', this.value)" class="w-full text-xs p-1.5 rounded-lg border border-slate-200 glass-input font-medium bg-white">
                          <option value="">Sélectionner un formateur de l'antenne...</option>
                          ${trainers.map(t => {
                            const isEligible = course ? this.isEligibleTrainer(t, course) : { eligible: true };
                            return `
                              <option value="${t.id}" ${sess.trainerId === t.id ? 'selected' : ''} class="${isEligible.eligible ? 'text-slate-800 font-bold' : 'text-slate-400 italic'}">
                                ${isEligible.eligible ? '[✓ Qualifié] ' : '[⚠️ Non qualifié] '} ${t.name} (${t.role || t.rank})
                              </option>
                            `;
                          }).join('')}
                        </select>
                        <button onclick="window.ProtecFormations.requestTrainerReinforcement(window.game, '${sess.id}')" class="w-full mt-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer">
                          <i data-lucide="handshake" class="w-3.5 h-3.5 text-indigo-600"></i>
                          <span>Demander un renfort Formateur (Inter-Antennes)</span>
                        </button>
                      </div>

                      <!-- Inscriptions Interne & Réseau -->
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <!-- Inscription Interne Antenne -->
                        <div>
                          <label class="text-[9px] font-bold uppercase text-indigo-700 block mb-0.5">Inscrire un bénévole antenne :</label>
                          <select onchange="if(this.value) { window.ProtecFormations.registerVolunteerToInternal(window.game, '${sess.id}', this.value); this.value=''; }" class="w-full text-[11px] p-1.5 rounded-lg border border-indigo-200 bg-white font-medium">
                            <option value="">+ Bénévole équipe...</option>
                            ${(game.volunteers || []).filter(v => !(sess.registeredCandidates || []).includes(v.id)).map(v => `
                              <option value="${v.id}">${v.name} (${v.role || v.rank})</option>
                            `).join('')}
                          </select>
                        </div>

                        <!-- Accueil Renfort Protec Civile -->
                        <div>
                          <label class="text-[9px] font-bold uppercase text-pc-blue block mb-0.5">Accueillir renfort PC :</label>
                          <button onclick="window.ProtecFormations.registerProtecReinforcementToSession(window.game, '${sess.id}')" class="w-full text-[11px] p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 font-bold text-pc-blue transition flex items-center justify-center gap-1 cursor-pointer">
                            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                            <span>+ Stagiaire Protec Civile</span>
                          </button>
                        </div>
                      </div>

                      <!-- Badges des inscrits -->
                      <div class="flex flex-wrap gap-1">
                        ${(sess.registeredCandidates || []).map(vid => {
                          const v = game.volunteers.find(vol => vol.id === vid);
                          return `<span class="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-[10px] font-bold">👤 ${v?.name || 'Bénévole'}</span>`;
                        }).join('')}
                        ${(sess.registeredProtecReinforcements || []).map(r => {
                          return `<span class="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-pc-blue text-[10px] font-bold">🤝 ${r.name} (${r.station})</span>`;
                        }).join('')}
                        ${(sess.publicAttendees || []).map(p => {
                          return `<span class="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">🎟️ ${p.name} (+${p.price}€)</span>`;
                        }).join('')}
                      </div>
                    </div>

                    <!-- Clôture et Certification -->
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span class="text-[10px] text-slate-400">Attestations officielles Sécurité Civile</span>
                      <button onclick="window.ProtecFormations.completeSession(window.game, '${sess.id}')" class="px-4 py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white text-xs font-black shadow transition flex items-center gap-1 cursor-pointer">
                        <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                        Valider & Certifier
                      </button>
                    </div>

                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Section 4 : Formations Individuelles en Stage Externe -->
        <div class="p-4 rounded-3xl glass-card space-y-3 border border-indigo-100 bg-indigo-50/20">
          <div>
            <h4 class="text-xs font-black uppercase text-indigo-950">Inscrire un bénévole en stage externe</h4>
            <p class="text-[11px] text-slate-500">Si l'antenne ne dispose pas du formateur ou du kit requis, le bénévole peut être envoyé en organisme extérieur. L'antenne peut financer à 100% ou laisser le bénévole régler de sa poche.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Bénévole :</label>
              <select id="ext-vol-id" class="w-full p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800 bg-white">
                ${(game.volunteers || []).map(v => `<option value="${v.id}">${v.name} (${v.role || v.rank})</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold uppercase text-slate-400">Stage externe :</label>
              <select id="ext-course-id" class="w-full p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800 bg-white">
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
              <select id="ext-pay-mode" class="w-full p-2 rounded-xl border border-slate-200 glass-input font-bold text-slate-800 bg-white">
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
    this.updateNewSessionFormPreview(game);
  },

  // Mise à jour dynamique de l'aperçu du formulaire de nouvelle session
  updateNewSessionFormPreview(game) {
    if (!game) game = window.game;
    const courseSelect = document.getElementById('new-course-id');
    if (!courseSelect) return;
    const courseId = courseSelect.value;
    const course = this.catalog.find(c => c.id === courseId);

    // 1. Matériel requis
    const kitWrap = document.getElementById('new-course-kit-info');
    if (kitWrap) {
      if (course && course.kitRequired) {
        const hasKit = this.hasTrainingKit(game, course.kitRequired);
        if (hasKit) {
          kitWrap.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600 shrink-0"></i>
              <span>Kit de formation en dotation : <strong>${course.kitName || course.kitRequired}</strong> (Prêt à l'emploi)</span>
            </div>
          `;
        } else {
          kitWrap.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 shrink-0"></i>
              <span>Kit manquant dans la base : <strong>${course.kitName || course.kitRequired}</strong> (À acheter en Logistique avant certification)</span>
            </div>
          `;
        }
      } else {
        kitWrap.innerHTML = `
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
            <i data-lucide="info" class="w-4 h-4 text-slate-400 shrink-0"></i>
            <span>Aucun matériel lourd spécifique requis pour ce cursus.</span>
          </div>
        `;
      }
    }

    // 2. Gestion de l'affichage du tarif Grand Public
    const openPublicBox = document.getElementById('new-course-open-public');
    const priceWrap = document.getElementById('new-course-public-price-wrap');
    const priceInput = document.getElementById('new-course-public-price');
    const isOpenToPublic = openPublicBox ? openPublicBox.checked : true;

    if (priceWrap) {
      priceWrap.style.display = isOpenToPublic ? 'flex' : 'none';
    }

    if (priceInput && (!priceInput.dataset.customized || priceInput.dataset.customized === 'false')) {
      if (course && course.basePricePublic !== undefined) {
        priceInput.value = course.basePricePublic;
      }
    }

    // 3. Calcul de la jauge des places
    const totalInput = document.getElementById('new-course-total-seats');
    const antenneInput = document.getElementById('new-course-antenne-seats');
    const protecInput = document.getElementById('new-course-protec-seats');
    const previewWrap = document.getElementById('new-course-seats-preview');

    const totalSeats = parseInt(totalInput?.value || 10, 10);
    const antenneSeats = parseInt(antenneInput?.value || 0, 10);
    const protecSeats = parseInt(protecInput?.value || 0, 10);
    const unitPrice = parseFloat(priceInput?.value) || (course?.basePricePublic || 60);

    const reservedSum = antenneSeats + protecSeats;
    const remainingSeats = Math.max(0, totalSeats - reservedSum);
    const publicSeats = isOpenToPublic ? remainingSeats : 0;
    const isExceeded = reservedSum > totalSeats;

    if (previewWrap) {
      if (isExceeded) {
        previewWrap.innerHTML = `
          <div class="text-rose-600 font-bold flex items-center gap-1.5">
            <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-500 shrink-0"></i>
            <span>Attention : les places réservées (${reservedSum}) dépassent la capacité totale (${totalSeats}) !</span>
          </div>
        `;
      } else {
        const potentialRevenue = publicSeats * unitPrice;
        previewWrap.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-3">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black">
                👥 Total : ${totalSeats} pl.
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold">
                🏢 Bénévoles Antenne : ${antenneSeats} pl. (Gratuit)
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-pc-blue font-bold">
                🤝 Renforts Protec : ${protecSeats} pl.
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${isOpenToPublic ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-slate-100 text-slate-400 line-through'}">
                🌍 Grand Public : ${publicSeats} pl. ${isOpenToPublic ? `(${unitPrice} € / pl.)` : '(Fermé)'}
              </span>
            </div>
            ${isOpenToPublic && publicSeats > 0 ? `
              <span class="text-emerald-700 font-black text-xs">
                💰 Recette max estimée : +${potentialRevenue} €
              </span>
            ` : ''}
          </div>
        `;
      }
    }

    if (window.lucide) window.lucide.createIcons();
  },

  // Création et programmation d'une session depuis le formulaire UI
  createOrganizedSessionFromUI(game) {
    if (!game) game = window.game;
    const courseSelect = document.getElementById('new-course-id');
    if (!courseSelect) return;
    const courseId = courseSelect.value;
    const course = this.catalog.find(c => c.id === courseId);
    if (!course) {
      game.showToast('Erreur', 'Cursus de formation introuvable.', 'orange');
      return;
    }

    const locType = document.getElementById('new-course-loc')?.value || 'antenne';
    const roomNumber = parseInt(document.getElementById('new-course-room')?.value || 1, 10);
    const customLoc = (document.getElementById('new-course-custom-loc')?.value || '').trim();

    if (locType === 'externe' && !customLoc) {
      game.showToast('Lieu Requis', 'Veuillez préciser le nom de la salle ou l’adresse du lieu extérieur.', 'orange');
      return;
    }

    const day = parseInt(document.getElementById('new-course-day')?.value || 1, 10);
    const month = parseInt(document.getElementById('new-course-month')?.value || 0, 10);
    const year = parseInt(document.getElementById('new-course-year')?.value || 2026, 10);
    const hour = parseInt(document.getElementById('new-course-hour')?.value || 9, 10);

    const totalSeats = parseInt(document.getElementById('new-course-total-seats')?.value || 10, 10);
    const antenneSeats = parseInt(document.getElementById('new-course-antenne-seats')?.value || 0, 10);
    const protecSeats = parseInt(document.getElementById('new-course-protec-seats')?.value || 0, 10);
    const openToPublic = document.getElementById('new-course-open-public')?.checked;
    const publicPrice = parseFloat(document.getElementById('new-course-public-price')?.value) || (course.basePricePublic || 60);
    const trainerId = document.getElementById('new-course-trainer')?.value || null;

    if (totalSeats < 2) {
      game.showToast('Capacité Insuffisante', 'Une session doit comporter au moins 2 places.', 'orange');
      return;
    }

    if (antenneSeats + protecSeats > totalSeats) {
      game.showToast('Répartition Invalide', 'La somme des places internes antenne et Protection Civile ne peut pas dépasser la capacité totale.', 'orange');
      return;
    }

    this.createSession(game, courseId, {
      locationType: locType,
      roomNumber: roomNumber,
      locationCustom: customLoc,
      day: day,
      month: month,
      year: year,
      hour: hour,
      totalSeats: totalSeats,
      internalAntenneSeats: antenneSeats,
      internalProtecSeats: protecSeats,
      openToPublic: openToPublic,
      publicPrice: publicPrice,
      trainerId: trainerId
    });

    // Si un formateur a été sélectionné dans le formulaire
    if (trainerId && game.sessionsFormation && game.sessionsFormation.length > 0) {
      const createdSession = game.sessionsFormation[0];
      const trainer = game.volunteers.find(v => v.id === trainerId);
      if (trainer) {
        const check = this.isEligibleTrainer(trainer, course);
        if (check.eligible) {
          createdSession.trainerId = trainer.id;
          createdSession.assignedTrainer = trainer;
          game.saveGame();
          this.renderModal(game);
        } else {
          game.showToast('Formateur Non Habilité', `${trainer.name} n'est pas qualifié pour ce cursus : ${check.reason}. Vous pourrez en affecter un autre ou solliciter un renfort.`, 'orange');
        }
      }
    }
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
