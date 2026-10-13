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
        const mode = Math.random() < 0.65 ? 'intra' : 'inter';

        // Budget indicatif du client avec légère variation locale
        const variation = 0.88 + Math.random() * 0.28; // 88% à 116% du budget de base
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

  // 3. GESTION DE LA MODALE D'ÉMISSION DU DEVIS
  openQuoteModal(proposalId) {
    this.activeQuoteModalProposalId = proposalId;
    if (window.game) this.renderModal(window.game);
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
    const oddsBadge = document.getElementById('b2b-quote-odds-badge');
    const oddsBar = document.getElementById('b2b-quote-odds-bar');
    const marginDisplay = document.getElementById('b2b-quote-margin-display');

    if (oddsBadge) {
      let colorClass = 'text-emerald-700 bg-emerald-100 border-emerald-300';
      if (oddsData.odds < 40) colorClass = 'text-rose-700 bg-rose-100 border-rose-300';
      else if (oddsData.odds < 70) colorClass = 'text-amber-800 bg-amber-100 border-amber-300';

      oddsBadge.className = `px-3 py-1 rounded-xl border font-black text-sm mono-num transition ${colorClass}`;
      oddsBadge.textContent = `${oddsData.odds}% de chance de signature`;
    }

    if (oddsBar) {
      oddsBar.style.width = `${oddsData.odds}%`;
      if (oddsData.odds < 40) oddsBar.className = 'h-full bg-rose-500 rounded-full transition-all duration-300';
      else if (oddsData.odds < 70) oddsBar.className = 'h-full bg-amber-500 rounded-full transition-all duration-300';
      else oddsBar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-300';
    }

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

    this.syncB2BWithSupabase(game, proposal);
    game.saveGame();

    game.showToast(
      'Session B2B Validée & Certifiée ! 🎓',
      `Facturation honorée : +${grossPrice.toLocaleString('fr-FR')} € (-${consumableCost} € consommables déduits, soit +${netGain.toLocaleString('fr-FR')} € net) et +${repGain} pts de réputation !`,
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

  // 9. SURVEILLANCE PÉRIODIQUE D'HORLOGE (DÉLIBÉRATIONS & RECYCLAGES)
  processClockTick(game) {
    if (!game || !game.formationB2BProposals) return;

    const now = Date.now();
    let hasChanges = false;

    game.formationB2BProposals.forEach(p => {
      // Délibération terminée -> résolution automatique
      if (p.status === 'evaluating' && p.evaluationEndsAt && now >= p.evaluationEndsAt) {
        this.resolveQuote(game, p.id, true);
        hasChanges = true;
      }
    });

    if (hasChanges && this.mainTab === 'entreprises') {
      const modal = document.getElementById('main-modal');
      if (modal && !modal.classList.contains('hidden')) {
        this.renderModal(game);
      }
    }
  },

  // 10. SYNCHRONISATION ROBUSTE AVEC SUPABASE POSTGRESQL
  async syncB2BWithSupabase(game, proposal) {
    if (!proposal || !window.ProtecSupabase || !window.ProtecSupabase.isConnected || !window.ProtecSupabase.client) {
      return;
    }

    try {
      const payload = {
        id: proposal.id,
        department_code: proposal.department_code || '54',
        antenne_id: proposal.antenne_id || 'station-1',
        client_name: proposal.client_name,
        client_type: proposal.client_type,
        training_type: proposal.training_type,
        attendees_count: proposal.attendees_count,
        mode: proposal.mode,
        client_target_budget: proposal.client_target_budget,
        proposed_price: proposal.proposed_price,
        acceptance_rate: proposal.acceptance_rate,
        status: proposal.status,
        trainer_id: proposal.trainer_id,
        vehicle_id: proposal.vehicle_id,
        consumable_cost: proposal.consumable_cost,
        deadline: proposal.deadline ? new Date(proposal.deadline).toISOString() : null,
        evaluation_ends_at: proposal.evaluationEndsAt ? new Date(proposal.evaluationEndsAt).toISOString() : null,
        completed_at: proposal.completedAt ? new Date(proposal.completedAt).toISOString() : null,
        created_at: proposal.created_at || new Date().toISOString()
      };

      await window.ProtecSupabase.client
        .from('formation_b2b_proposals')
        .upsert(payload);
    } catch (err) {
      // Échec discret en cas de réseau instable ou table non migrée
      console.info('Synchro B2B locale active:', err?.message || err);
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

    // Recyclage / Formation Continue annuelle obligatoire (FC PSE & MAC SST)
    const curYear = (window.game?.clock?.year) || 2026;
    if (course.isRecycling || course.id === 'FC_PSE' || course.id === 'MAC_SST') {
      vol.recycledYear = curYear;
      vol.qualificationExpired = false;
      vol.qualificationExpiredReason = null;
      vol.lastRecycledAt = Date.now();
    } else if (['PSE1', 'PSE2', 'CE', 'CD'].includes(course.id)) {
      vol.recycledYear = curYear;
      vol.qualificationExpired = false;
      vol.qualificationExpiredReason = null;
      vol.lastRecycledAt = Date.now();
    }
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
        } else if (curYear > v.recycledYear) {
          v.qualificationExpired = true;
          v.qualificationExpiredReason = `Recyclage annuel échu : FC PSE ${curYear} obligatoire pour réactiver les droits opérationnels.`;
        } else {
          v.qualificationExpired = false;
          v.qualificationExpiredReason = null;
        }
      }
    });
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

    // Prise en compte des gammes de matériel pédagogique (Mannequin RCP & DSA Formation)
    const mannequinTier = (game.equipmentTiers && game.equipmentTiers.mannequin_rcp_adulte) || 1;
    const dsaTier = (game.equipmentTiers && game.equipmentTiers.dsa_formation) || 1;

    let tierNotice = '';

    if (session.isInternal) {
      // Les externes accueillis paient le tarif public de la formation
      const revFromExternals = externalCount * (session.publicPriceForExternals || course?.basePricePublic || 60);
      totalRevenue = revFromExternals;

      // Bonus matériel sur recettes externes
      if (mannequinTier === 3) {
        totalRevenue = Math.round(totalRevenue * 1.25); // +25% attractivité & tarifs
        tierNotice += ' [QCPR Connecté : +25% recettes]';
      } else if (mannequinTier === 1) {
        totalRevenue = Math.round(totalRevenue * 0.90);
      }

      game.resources.money += totalRevenue;
      netGain = totalRevenue;

      // Attribution des compétences aux bénévoles internes certifiés
      session.registeredCandidates.forEach(vid => {
        const v = game.volunteers.find(vol => vol.id === vid);
        if (v && course) {
          this.grantCourseQualifications(v, course);
          // Bonus de rapidité d'apprentissage QCPR
          if (mannequinTier === 3) {
            v.exp = (v.exp || 0) + 15;
          }
        }
      });
    } else {
      // Formation Grand Public
      let multiplier = 1.0;
      if (mannequinTier === 3) {
        multiplier = 1.25; // +25% satisfaction & valorisation tarifaire
        tierNotice += ' [Mannequins QCPR Bluetooth : +25% satisfaction & tarif valorisé]';
      } else if (mannequinTier === 1) {
        multiplier = 0.90; // -10% attractivité
      }

      totalRevenue = Math.round((session.finalPrice * totalCount) * multiplier);
      const totalCost = (session.costOrganization || 25) * totalCount;
      netGain = totalRevenue - totalCost;
      game.resources.money += netGain;

      let repGain = 25 + (session.relationshipBonus || 0);
      if (dsaTier === 2) {
        repGain += 10;
        tierNotice += ' [DSA Connecté HF : +10 réputation]';
      }
      game.resources.reputationScore += repGain;
    }

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

    // Sollicitation spontanée d'entreprises locales si QCPR Niveau 3
    if (mannequinTier === 3 && Math.random() < 0.35 && game.annualContracts) {
      const existingCorp = game.annualContracts.find(c => c.id === 'contrat_corp_sst');
      if (!existingCorp) {
        game.annualContracts.push({
          id: 'contrat_corp_sst',
          title: 'Convention Annuelle SST & Prévention Entreprise (Groupe Régional)',
          partner: 'Industrie & PME Partenaires',
          category: 'formation',
          signed: true,
          yearlyBonus: 1200,
          frequencyDesc: '1 session SST rémunérée par trimestre',
          desc: 'Attirée par votre dotation pédagogique connectée QCPR haut de gamme, une fédération patronale conventionne votre antenne pour former tous ses salariés SST !'
        });
        game.showToast(
          '🏛️ Nouvelle Convention Entreprise !',
          'Impressionnée par la technologie QCPR connectée, une entreprise locale signe un contrat cadre annuel de formations SST (+1 200 € / an) !',
          'purple'
        );
      }
    }

    session.status = 'completed';

    // Attribution des écussons de formation et compétences
    if (window.ProtecEcussons) {
      if (['PSE1', 'PSE2', 'CE', 'CD'].includes(session.courseId)) {
        window.ProtecEcussons.attribuerEcusson('spec_pse');
      }
      if (['PICF', 'PAE_FPS', 'FORMATEUR_PSC', 'FORMATEUR_PSE', 'FORMATEUR_DE_FORMATEURS'].includes(session.courseId)) {
        window.ProtecEcussons.attribuerEcusson('spec_formateur');
      }
    }

    game.saveGame();
    game.updateStatsUI();

    const msg = session.isInternal
      ? `Session interne validée : ${internalCount} bénévole(s) certifié(s) « ${course?.title || session.courseId} » ! ${externalCount > 0 ? `+${totalRevenue} € encaissés via ${externalCount} stagiaire(s) extérieur(s).` : ''}${tierNotice}`
      : `Formation grand public validée : +${netGain} € de solde net et +${session.relationshipBonus || 15} relation publique !${tierNotice}`;

    game.showToast('Formation Validée ! 🎓', msg, 'green');
    this.renderModal(game);
  },

  // 11. RENDU DE L'ONGLET STRUCTURES & ENTREPRISES B2B
  renderB2BTab(game) {
    const proposals = game.formationB2BProposals || [];
    const pendingQuotes = proposals.filter(p => p.status === 'pending_quote');
    const evaluatingQuotes = proposals.filter(p => p.status === 'evaluating');
    const acceptedQuotes = proposals.filter(p => p.status === 'accepted');
    const inProgressQuotes = proposals.filter(p => p.status === 'in_progress');
    const completedQuotes = proposals.filter(p => p.status === 'completed');
    const activeSignedCount = acceptedQuotes.length + inProgressQuotes.length;

    // Calcul du CA B2B encaissé total
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

    const now = Date.now();
    const availableTrainers = (game.volunteers || []).filter(v => v.status === 'dispo');
    const availableVehicles = (game.vehicles || []).filter(v => v.status === 'dispo' && !v.requiresTrailer);
    const hasRoom = window.ProtecLocaux && typeof window.ProtecLocaux.hasFormationRoom === 'function' ? window.ProtecLocaux.hasFormationRoom(game) : true;

    return `
      <div class="space-y-6">

        <!-- 1. CARTES STATISTIQUES KPI B2B -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Demandes Entrantes</span>
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
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">CA B2B Encaissé</span>
            <div class="flex items-baseline gap-1 mt-0.5">
              <strong class="text-lg sm:text-xl font-black text-emerald-400 mono-num">+${totalRevenueB2B.toLocaleString('fr-FR')} €</strong>
              <span class="text-[9px] text-slate-400 font-normal">net</span>
            </div>
          </div>
        </div>

        <!-- 2. BARRE D'ACTIONS ET DE FILTRES RAPIDES -->
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

        <!-- 3. LISTE DES OPPORTUNITÉS ET SESSIONS B2B -->
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
            </div>
            <button onclick="window.ProtecFormations.generateB2BOpportunities(window.game, true); window.ProtecFormations.renderModal(window.game);" class="px-4 py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-extrabold text-xs shadow-md transition inline-flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              Générer une opportunité entrante
            </button>
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
                      <span class="text-xs font-black text-emerald-600">+${cfg.repGain || 12} Réputation</span>
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

  // 12. RENDU DE LA MODALE D'ÉLABORATION DU DEVIS B2B (MODALE INTERACTIVE AVEC JAUGE LIVE)
  renderQuoteModalHTML(game, proposal) {
    if (!proposal) return '';

    const cfg = this.TRAINING_B2B_CONFIG[proposal.training_type] || this.TRAINING_B2B_CONFIG['SST'];
    const targetBudget = Number(proposal.client_target_budget || proposal.clientTargetBudget || 1200);
    const initialPrice = Number(proposal.proposed_price || proposal.proposedPrice || targetBudget);
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
                <h4 class="text-sm font-black text-slate-900 leading-tight">Élaboration du Devis B2B</h4>
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
              <strong class="text-slate-800 text-xs">${proposal.attendees_count} stagiaires</strong>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Modalité</span>
              <strong class="text-slate-800 text-xs">${isIntra ? 'Intra (Sur site)' : 'Inter (Antenne)'}</strong>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase text-slate-400 block">Budget Indicatif</span>
              <strong class="text-pc-blue text-xs mono-num">~${targetBudget.toLocaleString('fr-FR')} €</strong>
            </div>
          </div>

          <!-- Formulaire de prix dynamique avec slider interactif -->
          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-xs font-black uppercase tracking-wider text-slate-700">Votre Proposition Tarifaire (€) :</label>
              <div class="flex items-center gap-1.5">
                <input 
                  type="number" 
                  id="b2b-quote-price-input" 
                  value="${initialPrice}" 
                  min="50" 
                  max="5000" 
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

            <div class="flex items-center justify-between text-[10px] text-slate-400">
              <span>Attractif (${minSlider} €)</span>
              <span class="font-bold text-slate-600">Cible client : ${targetBudget} €</span>
              <span>Haut de gamme (${maxSlider} €)</span>
            </div>
          </div>

          <!-- JAUGE LIVE DE PROBABILITÉ DE SIGNATURE -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase text-slate-700">Probabilité d’accord client :</span>
              <span id="b2b-quote-odds-badge" class="px-3 py-1 rounded-xl border font-black text-sm mono-num transition ${
                oddsData.odds < 40 ? 'text-rose-700 bg-rose-100 border-rose-300' :
                (oddsData.odds < 70 ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-emerald-700 bg-emerald-100 border-emerald-300')
              }">
                ${oddsData.odds}% de chance de signature
              </span>
            </div>

            <!-- Barre de jauge -->
            <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div id="b2b-quote-odds-bar" class="h-full rounded-full transition-all duration-300 ${
                oddsData.odds < 40 ? 'bg-rose-500' : (oddsData.odds < 70 ? 'bg-amber-500' : 'bg-emerald-500')
              }" style="width: ${oddsData.odds}%;"></div>
            </div>

            <div class="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span>Réputation d'antenne : <strong>+${oddsData.repBonus}%</strong></span>
              <span>Accords APC : <strong>+${oddsData.conventionBonus}%</strong></span>
              <span class="text-slate-600">Bénéfice net estimé : <strong id="b2b-quote-margin-display" class="text-emerald-700 font-extrabold">+${oddsData.marginNet.toLocaleString('fr-FR')} €</strong></span>
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
                <span>${isIntra ? 'Véhicule de liaison VL/VTU' : 'Accueil sur place'}</span>
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
    subtitle.textContent = 'Cursus Entreprises (B2B), Grand Public, Secourisme Opérationnel, Recyclages FC et Filière Formateurs';
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

    const navTabsHTML = `
      <!-- Barre de navigation supérieure des deux canaux de formation -->
      <div class="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
        <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button onclick="window.ProtecFormations.setMainTab('entreprises')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.mainTab === 'entreprises' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 hover:text-slate-900 cursor-pointer'}">
            <i data-lucide="building-2" class="w-3.5 h-3.5"></i>
            <span>Structures & Entreprises (B2B)</span>
            ${pendingB2BCount > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${this.mainTab === 'entreprises' ? 'bg-white text-pc-blue' : 'bg-pc-blue text-white'}">${pendingB2BCount}</span>` : ''}
          </button>
          <button onclick="window.ProtecFormations.setMainTab('grand_public')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${this.mainTab === 'grand_public' ? 'bg-pc-blue text-white shadow-md' : 'text-slate-600 hover:text-slate-900 cursor-pointer'}">
            <i data-lucide="users" class="w-3.5 h-3.5"></i>
            <span>Grand Public & Internes</span>
            ${activeSessions.length > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] font-black ${this.mainTab === 'grand_public' ? 'bg-white text-pc-blue' : 'bg-slate-300 text-slate-800'}">${activeSessions.length}</span>` : ''}
          </button>
        </div>
        ${this.mainTab === 'entreprises' ? `
          <button onclick="window.ProtecFormations.generateB2BOpportunities(window.game, true); window.ProtecFormations.renderModal(window.game);" class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Prospection Commerciale (+ Demande)</span>
          </button>
        ` : ''}
      </div>
    `;

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
    body.innerHTML = `
      <div class="space-y-6">
        ${navTabsHTML}

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
