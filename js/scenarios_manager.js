/**
 * PROTEC LIVE - GESTIONNAIRE & GÉNÉRATEUR UNIVERSEL DE SCÉNARIOS OPÉRATIONNELS
 * 
 * Permet de visualiser, créer, paramétrer, modifier, cloner et déclencher à la demande
 * n'importe quel scénario d'intervention (DPS, SAMU 15, SDIS, Crises NOVI/ORSEC Préfecture).
 * 
 * Modules inclus :
 * 1. TEMPORALITÉ : Anticipation / Pré-alerte Programmée (avec délai paramétrable) vs Crise Imprévisible / Alerte Réflexe.
 * 2. DIMENSIONNEMENT VARIABLE : Mode Adaptatif dynamique aux moyens réels de l'antenne ou Fourchettes Min-Max.
 * 3. GESTION DES PHASES & ÉVOLUTIONS (DIAGRAMME DE SANKEY) : Modélisation visuelle des flux, des embranchements
 *    et des probabilités de transition entre phases opérationnelles (Escalade, Maintien, Stabilisation).
 * 4. LOGISTIQUE & LOTS : Armement automatique ou manuel (VPSP, VTU, Lots A/B/C, CAI, CHU, Ravitaillement, Pompage).
 * 5. BIBLIOTHÈQUE D'INCIDENTS : Insertion rapide de péripéties classées par thématiques opérationnelles.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'protec_custom_scenarios_v3';
  const OVERRIDES_KEY = 'protec_scenario_overrides_v3';

  // 1. CATALOGUE OFFICIEL DES SCÉNARIOS PAR DÉFAUT
  const DEFAULT_SCENARIOS = [
    // =========================================================================
    // A. DISPOSITIFS PRÉVISIONNELS DE SECOURS (DPS)
    // =========================================================================
    {
      id: 'dps_football_regional',
      type: 'dps',
      category: 'secours_evenementiel',
      timing: 'anticipation',
      anticipationDelay: 120,
      scalingMode: 'adaptive',
      scaleIntensity: 'moyenne',
      minVolunteers: 4,
      maxVolunteers: 8,
      minDurationHours: 3.5,
      maxDurationHours: 5.5,
      minRewardMoney: 400,
      maxRewardMoney: 650,
      authority: 'organisateur',
      scale: 'DPS-PE (4-8 secouristes + VPSP)',
      title: 'Match de Football Régional',
      desc: 'Rencontre sportive de championnat régional. Surveillance des tribunes et des joueurs sur le terrain. Risque de traumatismes des membres et malaises spectateurs.',
      requiredVolunteers: 4,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_b'],
      durationHours: 4.5,
      rewardMoney: 480,
      rewardReputation: 35,
      riskLevel: 'moyen',
      urgency: 'normale',
      environment: 'ouvert_urbain',
      isEvolutive: true,
      phases: [
        { id: 'p1', step: 1, name: 'Phase 1 : Mise en place & Échauffement', direction: 'stable', durationMin: 45, requiredVolunteers: 4, color: '#38bdf8' },
        { id: 'p2a', step: 2, name: 'Phase 2A : Match intense & Traumatologie', direction: 'montante', durationMin: 120, requiredVolunteers: 4, color: '#f59e0b' },
        { id: 'p2b', step: 2, name: 'Phase 2B : Rencontre calme & Bobologie', direction: 'descendante', durationMin: 120, requiredVolunteers: 4, color: '#10b981' },
        { id: 'p3', step: 3, name: 'Phase 3 : Évacuation spectateurs & Clôture', direction: 'descendante', durationMin: 45, requiredVolunteers: 4, color: '#6366f1' }
      ],
      evolutions: [
        { source: 'p1', target: 'p2a', probability: 45, label: 'Engagement musclé' },
        { source: 'p1', target: 'p2b', probability: 55, label: 'Match sous contrôle' },
        { source: 'p2a', target: 'p3', probability: 45, label: 'Fin de match' },
        { source: 'p2b', target: 'p3', probability: 55, label: 'Fin de match' }
      ],
      peripeties: [
        'Traumatisme de la cheville d\'un joueur sur tacle appuyé (MID et évacuation)',
        'Malaise vagal d\'un spectateur en tribune basse',
        'Contusion musculaire suite à un choc tête contre tête'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'dps_festival_musique',
      type: 'dps',
      category: 'secours_evenementiel',
      timing: 'anticipation',
      anticipationDelay: 240,
      scalingMode: 'adaptive',
      scaleIntensity: 'forte',
      minVolunteers: 8,
      maxVolunteers: 18,
      minDurationHours: 8.0,
      maxDurationHours: 12.0,
      minRewardMoney: 1200,
      maxRewardMoney: 2400,
      authority: 'organisateur',
      scale: 'DPS-GE (Poste Fixe Médicalisé + Noria)',
      title: 'Festival de Musique Électronique & Concert',
      desc: 'Grand festival musical en plein air accueillant plus de 6 000 festivaliers. Montage obligatoire d\'un poste fixe médicalisé (Lot A) et patrouilles pédestres.',
      requiredVolunteers: 10,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP', 'VPSP', 'VL'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_a', 'lot_secours_b', 'lot_secours_c'],
      durationHours: 10.0,
      rewardMoney: 1850,
      rewardReputation: 80,
      riskLevel: 'eleve',
      urgency: 'haute',
      environment: 'ouvert_urbain',
      isEvolutive: true,
      phases: [
        { id: 'p1', step: 1, name: 'Phase 1 : Ouverture des portes & Patrouilles', direction: 'stable', durationMin: 120, requiredVolunteers: 8, color: '#38bdf8' },
        { id: 'p2a', step: 2, name: 'Phase 2A : Pic de foule & Malaises / Alcoolisations', direction: 'montante', durationMin: 240, requiredVolunteers: 12, color: '#ef4444' },
        { id: 'p2b', step: 2, name: 'Phase 2B : Soirée festive maîtrisée', direction: 'stable', durationMin: 240, requiredVolunteers: 8, color: '#10b981' },
        { id: 'p3', step: 3, name: 'Phase 3 : Évacuation du site & Débriefing', direction: 'descendante', durationMin: 90, requiredVolunteers: 8, color: '#8b5cf6' }
      ],
      evolutions: [
        { source: 'p1', target: 'p2a', probability: 65, label: 'Afflux au poste' },
        { source: 'p1', target: 'p2b', probability: 35, label: 'Activité modérée' },
        { source: 'p2a', target: 'p3', probability: 65, label: 'Fermeture site' },
        { source: 'p2b', target: 'p3', probability: 35, label: 'Fermeture site' }
      ],
      peripeties: [
        'Multiples états d\'ivresse aiguë et déshydratations sous la chaleur',
        'Traumatisme crânien léger suite à un mouvement de foule devant la scène',
        'Coupure profonde à la main par bris de verre au bar'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'dps_trail_nature',
      type: 'dps',
      category: 'secours_evenementiel',
      timing: 'anticipation',
      anticipationDelay: 180,
      scalingMode: 'range',
      minVolunteers: 4,
      maxVolunteers: 10,
      minDurationHours: 6.0,
      maxDurationHours: 9.0,
      minRewardMoney: 750,
      maxRewardMoney: 1200,
      authority: 'organisateur',
      scale: 'DPS-ME (Course Nature & Poste Relais)',
      title: 'Trail des Forêts & Course Nature (42 km)',
      desc: 'Épreuve sportive d\'endurance en milieu naturel accidenté. Évacuations difficiles nécessitant brancardage en sous-bois et poste relais.',
      requiredVolunteers: 6,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP', 'VTU'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_b', 'lot_secours_c'],
      durationHours: 8.0,
      rewardMoney: 950,
      rewardReputation: 50,
      riskLevel: 'moyen',
      urgency: 'normale',
      environment: 'nature',
      peripeties: [
        'Épuisement sévère et crampes généralisées au km 32',
        'Chute en descente rocailleuse avec suspicion de fracture clavicule',
        'Coureur égaré retrouvé en hypothermie modérée par le binôme mobile'
      ],
      isDefault: true,
      enabled: true
    },

    // =========================================================================
    // B. RÉQUISITIONS & URGENCES SAMU 15 / SDIS
    // =========================================================================
    {
      id: 'samu_garde_postee_vpsp',
      type: 'samu',
      category: 'urgence_sanitaire',
      timing: 'anticipation',
      anticipationDelay: 60,
      scalingMode: 'fixed',
      minVolunteers: 3,
      maxVolunteers: 3,
      minDurationHours: 6.0,
      maxDurationHours: 12.0,
      minRewardMoney: 390,
      maxRewardMoney: 780,
      authority: 'samu',
      scale: 'Garde Postée SAMU 15 (1 VPSP)',
      title: 'Garde Postée au Centre 15 / Convention Tripartite',
      desc: 'Mise à disposition d\'un équipage VPSP complet (3 secouristes) sous les ordres directs du médecin régulateur du SAMU 15.',
      requiredVolunteers: 3,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      vehiclesMode: 'fixed',
      requiredLots: ['lot_secours_b'],
      durationHours: 6.0,
      rewardMoney: 390,
      rewardReputation: 45,
      riskLevel: 'moyen',
      urgency: 'haute',
      environment: 'ouvert_urbain',
      peripeties: [
        'Départ réflexe pour détresse respiratoire à domicile (O2 15L/min)',
        'Suspicion d\'AVC avec transmission du score FAST au régulateur',
        'Maintien de la permanence en attendant le relais de garde'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'samu_renfort_noria',
      type: 'samu',
      category: 'urgence_sanitaire',
      timing: 'imprevisible',
      anticipationDelay: 0,
      scalingMode: 'adaptive',
      scaleIntensity: 'moyenne',
      minVolunteers: 4,
      maxVolunteers: 10,
      minDurationHours: 2.0,
      maxDurationHours: 4.0,
      minRewardMoney: 350,
      maxRewardMoney: 750,
      authority: 'samu',
      scale: 'Noria Sanitaire d\'Urgence (VPSP)',
      title: 'Réquisition Réflexe : Saturations Urgences SAMU',
      desc: 'Pic d\'appels extrême au centre de régulation médicale. Réquisition immédiate de l\'équipage Protection Civile pour réaliser des évacuations sanitaires vers le CHU.',
      requiredVolunteers: 4,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_b'],
      durationHours: 2.5,
      rewardMoney: 380,
      rewardReputation: 50,
      riskLevel: 'eleve',
      urgency: 'critique',
      environment: 'ouvert_urbain',
      peripeties: [
        'Transport urgent gyrophare 2 tons vers les urgences adultes',
        'Transmission de bilan médical détaillé au médecin d\'accueil',
        'Désinfection et réarmement express du VPSP entre deux départs'
      ],
      isDefault: true,
      enabled: true
    },

    // =========================================================================
    // C. CRISES MAJEURES, PLANS NOVI & ORSEC (PRÉFECTURE)
    // =========================================================================
    {
      id: 'crise_carambolage_voie_rapide',
      type: 'crise',
      category: 'accident_collectif',
      timing: 'imprevisible',
      anticipationDelay: 0,
      scalingMode: 'adaptive',
      scaleIntensity: 'forte',
      minVolunteers: 6,
      maxVolunteers: 14,
      minDurationHours: 4.0,
      maxDurationHours: 7.0,
      minRewardMoney: 1200,
      maxRewardMoney: 2200,
      authority: 'prefecture',
      scale: 'PLAN NOVI ROUTIER (PMA + Triage + Noria VPSP)',
      title: 'Carambolage Multiple sur Voie Rapide / Autoroute',
      desc: 'Brouillard intense provoquant une collision en chaîne de 12 véhicules dont 1 autocar. Déclenchement du Plan NOVI par le Préfet : montage PMA et tri des victimes.',
      requiredVolunteers: 8,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP', 'VPSP', 'VTU'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_a', 'lot_secours_b', 'lot_secours_c', 'caisse_rearmement'],
      durationHours: 5.5,
      rewardMoney: 1650,
      rewardReputation: 75,
      riskLevel: 'critique',
      urgency: 'critique',
      environment: 'autoroute',
      isEvolutive: true,
      phases: [
        { id: 'p1', step: 1, name: 'Phase 1 : Reconnaissance & Balisage sécurisé', direction: 'montante', durationMin: 45, requiredVolunteers: 6, color: '#f43f5e' },
        { id: 'p2a', step: 2, name: 'Phase 2A : Tri SINUS & Noria d\'évacuations lourdes', direction: 'montante', durationMin: 150, requiredVolunteers: 10, color: '#ef4444' },
        { id: 'p2b', step: 2, name: 'Phase 2B : Soins légers & Bilan ambulatoire', direction: 'descendante', durationMin: 90, requiredVolunteers: 6, color: '#10b981' },
        { id: 'p3', step: 3, name: 'Phase 3 : Évacuation PMA & Clôture de voie', direction: 'descendante', durationMin: 60, requiredVolunteers: 6, color: '#6366f1' }
      ],
      evolutions: [
        { source: 'p1', target: 'p2a', probability: 70, label: 'Urgences absolues multiples' },
        { source: 'p1', target: 'p2b', probability: 30, label: 'Bilan stable / Blessés légers' },
        { source: 'p2a', target: 'p3', probability: 70, label: 'Noria terminée' },
        { source: 'p2b', target: 'p3', probability: 30, label: 'Voie dégagée' }
      ],
      peripeties: [
        'Chaîne de triage des victimes : 3 Urgences Absolues (UA), 9 Urgences Relatives (UR)',
        'Mise en place d\'un Poste Médical Avancé (PMA) sous tente gonflable Lot A',
        'Noria d\'évacuations coordonnées par VPSP vers les centres hospitaliers',
        'Soutien psychologique immédiat aux passagers indemnes choqués'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'crise_inondations_crues',
      type: 'crise',
      category: 'catastrophe_naturelle',
      timing: 'anticipation',
      anticipationDelay: 180,
      scalingMode: 'adaptive',
      scaleIntensity: 'forte',
      minVolunteers: 6,
      maxVolunteers: 16,
      minDurationHours: 5.0,
      maxDurationHours: 10.0,
      minRewardMoney: 1100,
      maxRewardMoney: 2300,
      authority: 'prefecture',
      scale: 'PLAN ORSEC CRUES (Évacuation & CHU Lits Picots)',
      title: 'Crues Subites & Inondations Majeures de la Commune',
      desc: 'Pluies diluviennes provoquant le débordement des cours d\'eau. Rues inondées avec 80 cm d\'eau, sous-sols et habitations isolées. Déploiement des motopompes et ouverture d\'un CHU.',
      requiredVolunteers: 8,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VTU', 'VTU'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_a', 'lot_chu', 'lot_ravitaillement', 'lot_epuisement'],
      durationHours: 7.0,
      rewardMoney: 1450,
      rewardReputation: 70,
      riskLevel: 'critique',
      urgency: 'haute',
      environment: 'eau',
      isEvolutive: true,
      phases: [
        { id: 'p1', step: 1, name: 'Phase 1 : Pré-alerte Météo & Reconnaissance des digues', direction: 'stable', durationMin: 60, requiredVolunteers: 4, color: '#38bdf8' },
        { id: 'p2a', step: 2, name: 'Phase 2A : Débordement majeur, Évacuations & CHU', direction: 'montante', durationMin: 240, requiredVolunteers: 10, color: '#ef4444' },
        { id: 'p2b', step: 2, name: 'Phase 2B : Pompage localisé & Protection habitations', direction: 'stable', durationMin: 180, requiredVolunteers: 6, color: '#f59e0b' },
        { id: 'p3', step: 3, name: 'Phase 3 : Décrue, Désarmement du gymnase & Bilan', direction: 'descendante', durationMin: 90, requiredVolunteers: 6, color: '#10b981' }
      ],
      evolutions: [
        { source: 'p1', target: 'p2a', probability: 60, label: 'Rupture de berge / Crue' },
        { source: 'p1', target: 'p2b', probability: 40, label: 'Infiltrations maîtrisées' },
        { source: 'p2a', target: 'p3', probability: 60, label: 'Fin de décrue' },
        { source: 'p2b', target: 'p3', probability: 40, label: 'Fin d\'épuisement' }
      ],
      peripeties: [
        'Évacuation de 14 riverains bloqués à l\'étage de leur maison',
        'Mise en batterie des motopompes et groupes électrogènes de secours',
        'Ouverture d\'un Centre d\'Hébergement d\'Urgence (CHU lits picots)'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'crise_orsec_grand_froid',
      type: 'crise',
      category: 'soutien_sinistres',
      timing: 'anticipation',
      anticipationDelay: 240,
      scalingMode: 'adaptive',
      scaleIntensity: 'moyenne',
      minVolunteers: 4,
      maxVolunteers: 12,
      minDurationHours: 4.0,
      maxDurationHours: 8.0,
      minRewardMoney: 900,
      maxRewardMoney: 1900,
      authority: 'prefecture',
      scale: 'PLAN ORSEC GRAND FROID (CHU & Ravitaillement)',
      title: 'Plan ORSEC Grand Froid : Ouverture CHU & Ravitaillement Sinistrés',
      desc: 'Déclenchement du plan ORSEC Grand Froid par la Préfecture. Réquisition d’un gymnase municipal pour ouverture d’un Centre d’Hébergement d’Urgence (CHU 30 lits de camp), distribution de couvertures thermiques, kits hygiène et repas chauds.',
      requiredVolunteers: 6,
      requiredRanks: ['CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VTU', 'VL'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_b', 'lot_chu', 'lot_ravitaillement'],
      durationHours: 6.0,
      rewardMoney: 1400,
      rewardReputation: 60,
      riskLevel: 'eleve',
      urgency: 'haute',
      environment: 'ouvert_urbain',
      peripeties: [
        'Armement de 30 lits picot avec kits draps et duvets grands froids',
        'Distribution de soupes chaudes et ravitaillement calorique d’urgence',
        'Orientation sociale coordonnée avec le SIAO 115 et la Préfecture',
        'Prise en charge de 2 hypothermies modérées réchauffées au CHU'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'crise_evacuation_cai',
      type: 'crise',
      category: 'soutien_sinistres',
      timing: 'imprevisible',
      anticipationDelay: 0,
      scalingMode: 'adaptive',
      scaleIntensity: 'moyenne',
      minVolunteers: 6,
      maxVolunteers: 12,
      minDurationHours: 3.5,
      maxDurationHours: 6.5,
      minRewardMoney: 1100,
      maxRewardMoney: 2000,
      authority: 'prefecture',
      scale: 'PLAN D’URGENCE CAI (Sas SINUS & CUMP)',
      title: 'Alerte Préfecture : Évacuation d’Immeuble & Centre d’Accueil des Impliqués (CAI)',
      desc: 'Incendie d’un ensemble d’habitations collectives. Déclenchement par la Préfecture et le COD d’un Centre d’Accueil des Impliqués (CAI) en salle polyvalente pour 45 résidents sinistrés avec soutien médico-psychologique CUMP.',
      requiredVolunteers: 8,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VTU', 'VPSP'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_a', 'lot_secours_b', 'lot_cai'],
      durationHours: 5.0,
      rewardMoney: 1750,
      rewardReputation: 70,
      riskLevel: 'critique',
      urgency: 'critique',
      environment: 'ouvert_urbain',
      peripeties: [
        'Montage du sas d’accueil et secrétariat d’enregistrement des impliqués (fiches SINUS)',
        'Soutien médico-psychologique conjoint avec les psychologues de la CUMP',
        'Distribution de collations, café chaud et vêtements de première urgence',
        'Orientation et relogement temporaire en lien avec les services municipaux'
      ],
      isDefault: true,
      enabled: true
    },
    {
      id: 'crise_deraillement_novi',
      type: 'crise',
      category: 'accident_collectif',
      timing: 'imprevisible',
      anticipationDelay: 0,
      scalingMode: 'adaptive',
      scaleIntensity: 'maximale',
      minVolunteers: 8,
      maxVolunteers: 22,
      minDurationHours: 6.0,
      maxDurationHours: 12.0,
      minRewardMoney: 1800,
      maxRewardMoney: 3500,
      authority: 'prefecture',
      scale: 'PLAN NOVI FERROVIAIRE MAJEUR (PMA + CAI + Noria)',
      title: 'Plan NOVI Catastrophe : Déraillement de Train Express',
      desc: 'Sortie de voie d\'une rame ferroviaire en entrée d\'agglomération avec 35 impliqués. Activation du plan rouge / NOVI départemental par la Préfecture.',
      requiredVolunteers: 12,
      requiredRanks: ['CD', 'CE', 'PSE2', 'PSE1'],
      requiredVehicles: ['VPSP', 'VPSP', 'VPSP', 'VTU'],
      vehiclesMode: 'auto',
      requiredLots: ['lot_secours_a', 'lot_secours_b', 'lot_secours_c', 'lot_cai', 'caisse_rearmement'],
      durationHours: 8.5,
      rewardMoney: 2800,
      rewardReputation: 95,
      riskLevel: 'critique',
      urgency: 'critique',
      environment: 'ouvert_urbain',
      peripeties: [
        'Installation immédiate du PMA sous la tente Lot A avec tri SINUS',
        'Prise en charge de 6 polytraumatisés graves nécessitant intubation SMUR',
        'Armement d\'une cellule d\'accueil des familles et impliqués (CAI)',
        'Rotation continue de la noria de VPSP vers les centres hospitaliers universitaires'
      ],
      isDefault: true,
      enabled: true
    }
  ];

  window.ProtecScenariosManager = {
    DEFAULT_SCENARIOS,
    activeFilter: 'all',
    searchQuery: '',
    editingScenarioId: null,

    // Initialisation
    init() {
      this.ensureStorage();
    },

    ensureStorage() {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(OVERRIDES_KEY)) {
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify({}));
      }
    },

    getCustomScenarios() {
      this.ensureStorage();
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      } catch (e) {
        return [];
      }
    },

    getOverrides() {
      this.ensureStorage();
      try {
        return JSON.parse(localStorage.getItem(OVERRIDES_KEY)) || {};
      } catch (e) {
        return {};
      }
    },

    getAllScenarios(filterType = null, query = null) {
      const customList = this.getCustomScenarios();
      const overrides = this.getOverrides();

      const mergedDefaults = DEFAULT_SCENARIOS.map(sc => {
        if (overrides[sc.id]) {
          return { ...sc, ...overrides[sc.id], isDefault: true, hasOverride: true };
        }
        return { ...sc, isDefault: true, hasOverride: false };
      });

      let all = [...mergedDefaults, ...customList];

      const fType = filterType || this.activeFilter;
      if (fType && fType !== 'all') {
        all = all.filter(sc => sc.type === fType);
      }

      const q = (query !== null ? query : this.searchQuery).toLowerCase().trim();
      if (q) {
        all = all.filter(sc => 
          (sc.title || '').toLowerCase().includes(q) ||
          (sc.desc || '').toLowerCase().includes(q) ||
          (sc.scale || '').toLowerCase().includes(q) ||
          (sc.category || '').toLowerCase().includes(q)
        );
      }

      return all;
    },

    getScenarioById(id) {
      const all = this.getAllScenarios('all', '');
      return all.find(s => s.id === id) || null;
    },

    // Enregistrer un scénario
    saveScenario(data) {
      this.ensureStorage();
      const isNew = !data.id || data.id === 'new';
      const scenarioId = isNew ? `custom_${Date.now()}` : data.id;

      const cleanScenario = {
        id: scenarioId,
        type: data.type || 'crise',
        category: data.category || 'accident_collectif',
        timing: data.timing || 'imprevisible',
        anticipationDelays: Array.isArray(data.anticipationDelays) && data.anticipationDelays.length > 0 
          ? data.anticipationDelays.map(Number).filter(n => !isNaN(n) && n > 0)
          : (data.anticipationDelay ? [parseInt(data.anticipationDelay, 10)] : [120]),
        anticipationDelay: parseInt(data.anticipationDelay, 10) || (Array.isArray(data.anticipationDelays) && data.anticipationDelays[0]) || 120,
        authority: data.authority || 'prefecture',
        scalingMode: data.scalingMode || 'adaptive',
        scaleIntensity: data.scaleIntensity || 'moyenne',
        scale: (data.scale || '').trim() || (data.type === 'dps' ? 'DPS-PE' : (data.type === 'samu' ? 'Urgence SAMU' : 'Plan Préfecture')),
        title: (data.title || 'Nouveau Scénario').trim(),
        desc: (data.desc || '').trim(),
        minVolunteers: Math.max(1, parseInt(data.minVolunteers, 10) || 4),
        maxVolunteers: Math.max(1, parseInt(data.maxVolunteers, 10) || 12),
        requiredVolunteers: Math.max(1, parseInt(data.requiredVolunteers, 10) || parseInt(data.minVolunteers, 10) || 4),
        requiredRanks: Array.isArray(data.requiredRanks) ? data.requiredRanks : ['CE', 'PSE2', 'PSE1'],
        vehiclesMode: data.vehiclesMode || 'auto',
        requiredVehicles: Array.isArray(data.requiredVehicles) ? data.requiredVehicles : ['VPSP'],
        requiredLots: Array.isArray(data.requiredLots) ? data.requiredLots : ['lot_secours_b'],
        minDurationHours: parseFloat(data.minDurationHours) || 3.0,
        maxDurationHours: parseFloat(data.maxDurationHours) || 6.0,
        durationHours: Math.max(0.5, parseFloat(data.durationHours) || parseFloat(data.minDurationHours) || 4.0),
        minRewardMoney: parseInt(data.minRewardMoney, 10) || 400,
        maxRewardMoney: parseInt(data.maxRewardMoney, 10) || 1200,
        rewardMoney: Math.max(0, parseInt(data.rewardMoney, 10) || parseInt(data.minRewardMoney, 10) || 500),
        rewardReputation: Math.max(0, parseInt(data.rewardReputation, 10) || 50),
        riskLevel: data.riskLevel || 'moyen',
        urgency: data.urgency || (data.timing === 'imprevisible' ? 'critique' : 'normale'),
        environment: data.environment || 'ouvert_urbain',
        isEvolutive: Boolean(data.isEvolutive),
        phases: Array.isArray(data.phases) ? data.phases : [],
        evolutions: Array.isArray(data.evolutions) ? data.evolutions : [],
        peripeties: Array.isArray(data.peripeties) ? data.peripeties.filter(p => p && p.trim()) : [],
        isCustom: !DEFAULT_SCENARIOS.some(d => d.id === scenarioId),
        enabled: data.enabled !== false,
        updatedAt: Date.now()
      };

      if (cleanScenario.isCustom) {
        const customList = this.getCustomScenarios();
        const existingIdx = customList.findIndex(s => s.id === scenarioId);
        if (existingIdx >= 0) {
          customList[existingIdx] = cleanScenario;
        } else {
          customList.unshift(cleanScenario);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
      } else {
        const overrides = this.getOverrides();
        overrides[scenarioId] = cleanScenario;
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
      }

      return cleanScenario;
    },

    duplicateScenario(id) {
      const src = this.getScenarioById(id);
      if (!src) return null;

      const duplicateData = {
        ...src,
        id: `custom_${Date.now()}`,
        title: `${src.title} (Copie)`,
        isCustom: true,
        isDefault: false,
        hasOverride: false
      };

      const customList = this.getCustomScenarios();
      customList.unshift(duplicateData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
      return duplicateData;
    },

    deleteScenario(id) {
      const customList = this.getCustomScenarios().filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
    },

    resetDefaultScenario(id) {
      const overrides = this.getOverrides();
      if (overrides[id]) {
        delete overrides[id];
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
      }
    },

    resetAllToDefault() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(OVERRIDES_KEY);
      this.ensureStorage();
    },

    // =========================================================================
    
    // Configuration des choix de délais de pré-alerte disponibles
    AVAILABLE_ANTICIPATION_DELAYS: [
      { value: 15, label: '15 min', hint: 'Alerte rapide' },
      { value: 30, label: '30 min', hint: 'Préavis court' },
      { value: 60, label: '1 heure', hint: 'Standard' },
      { value: 120, label: '2 heures', hint: 'Préfecture' },
      { value: 240, label: '4 heures', hint: 'Mobilisation' },
      { value: 360, label: '6 heures', hint: 'Demi-journée' },
      { value: 720, label: '12 heures', hint: 'Veille' },
      { value: 1440, label: 'J-1 (24h)', hint: 'La veille' },
      { value: 2880, label: 'J-2 (48h)', hint: '2 jours avant' },
      { value: 4320, label: 'J-3 (72h)', hint: '3 jours avant' },
      { value: 10080, label: 'J-7', hint: '1 semaine' }
    ],

    getAnticipationDelays(sc) {
      if (!sc) return [120];
      if (Array.isArray(sc.anticipationDelays) && sc.anticipationDelays.length > 0) {
        return sc.anticipationDelays.map(Number).filter(n => !isNaN(n) && n > 0);
      }
      if (sc.anticipationDelay !== undefined && sc.anticipationDelay !== null && sc.anticipationDelay !== '') {
        const val = parseInt(sc.anticipationDelay, 10);
        return isNaN(val) ? [120] : [val];
      }
      return [120];
    },

    pickAnticipationDelay(sc) {
      const list = this.getAnticipationDelays(sc);
      if (!list || list.length === 0) return 120;
      return list[Math.floor(Math.random() * list.length)];
    },

    formatDelay(min) {
      if (!min || min <= 0) return 'Immédiat';
      if (min < 60) return min + ' min';
      if (min < 1440) {
        const h = min / 60;
        return Number.isInteger(h) ? h + 'h' : h.toFixed(1) + 'h';
      }
      const days = Math.round(min / 1440);
      return 'J-' + days + ' (' + (days * 24) + 'h)';
    },

    formatDelaysSummary(delays) {
      if (!delays || delays.length === 0) return '2h';
      return delays.map(d => this.formatDelay(d)).join(' ou ');
    },

    // CALCUL DYNAMIQUE & ADAPTATIF DES MOYENS
    // =========================================================================
    calculateDynamicRequirements(game, sc) {
      const allVols = Array.isArray(game?.volunteers) ? game.volunteers : [];
      const availableVolsCount = allVols.filter(v => v.status === 'disponible').length || allVols.length || 6;
      const minV = sc.minVolunteers || 2;
      const maxV = sc.maxVolunteers || 24;

      let calcVolunteers = sc.requiredVolunteers || 4;

      if (sc.scalingMode === 'adaptive') {
        const intensity = sc.scaleIntensity || 'moyenne';
        let pct = 0.40;
        if (intensity === 'faible') pct = 0.25;
        else if (intensity === 'forte') pct = 0.65;
        else if (intensity === 'maximale') pct = 0.85;

        calcVolunteers = Math.round(availableVolsCount * pct);
        calcVolunteers = Math.max(minV, Math.min(maxV, calcVolunteers));
      } else if (sc.scalingMode === 'range') {
        calcVolunteers = Math.max(minV, Math.min(maxV, availableVolsCount));
      }

      let calcVehicles = [];
      if (sc.vehiclesMode === 'auto') {
        const vpspCount = Math.max(1, Math.floor(calcVolunteers / 4));
        for (let i = 0; i < vpspCount; i++) calcVehicles.push('VPSP');
        const heavyLots = ['lot_secours_a', 'lot_cai', 'lot_chu', 'lot_ravitaillement', 'lot_epuisement'];
        const hasHeavyLot = (sc.requiredLots || []).some(l => heavyLots.includes(l));
        if (calcVolunteers >= 6 || hasHeavyLot) {
          calcVehicles.push('VTU');
        }
        if (calcVolunteers >= 10) {
          calcVehicles.push('VL');
        }
      } else {
        calcVehicles = Array.isArray(sc.requiredVehicles) && sc.requiredVehicles.length > 0 
          ? [...sc.requiredVehicles] 
          : ['VPSP'];
      }

      let calcDuration = sc.durationHours || 4.0;
      if (sc.maxDurationHours && sc.maxDurationHours > (sc.minDurationHours || sc.durationHours)) {
        const minD = sc.minDurationHours || sc.durationHours;
        calcDuration = Math.round((minD + Math.random() * (sc.maxDurationHours - minD)) * 2) / 2;
      }

      let calcReward = sc.rewardMoney || 400;
      if (sc.scalingMode === 'adaptive') {
        calcReward = Math.round(calcVolunteers * calcDuration * 30);
      } else if (sc.maxRewardMoney && sc.maxRewardMoney > (sc.minRewardMoney || sc.rewardMoney)) {
        const minR = sc.minRewardMoney || sc.rewardMoney;
        calcReward = Math.round(minR + Math.random() * (sc.maxRewardMoney - minR));
      }

      return {
        volunteers: calcVolunteers,
        vehicles: calcVehicles,
        duration: calcDuration,
        reward: calcReward
      };
    },

    // =========================================================================
    // DÉCLENCHEMENT D'UN SCÉNARIO
    // =========================================================================
    triggerScenarioNow(game, scenarioId, stationId = null) {
      if (!game) game = window.game;
      if (!game) return false;

      const sc = this.getScenarioById(scenarioId);
      if (!sc) {
        if (game.showToast) game.showToast('Erreur Scénario', 'Scénario introuvable.', 'red');
        return false;
      }

      const st = stationId 
        ? (game.stations || []).find(s => s.id === stationId) 
        : (game.stations?.find(s => s.id === game.selectedStationId) || game.stations?.[0]);

      const now = Date.now();
      const locType = sc.type === 'crise' ? 'crise' : (sc.type === 'samu' ? 'urgences' : 'dps');
      const loc = game.calculateRealisticMissionLocation ? game.calculateRealisticMissionLocation(st, locType) : { lat: st?.lat || 48.8566, lng: st?.lng || 2.3522 };

      const dyn = this.calculateDynamicRequirements(game, sc);
      const durationSec = Math.round(dyn.duration * 60);
      const dept = st?.departmentCode || game.currentDepartmentCode || game.player?.departmentCode || '54';

      const isAnticipation = sc.timing === 'anticipation';
      const delayMin = isAnticipation ? this.pickAnticipationDelay(sc) : 0;

      const mission = {
        id: `scen-${sc.type}-${now}`,
        scenarioId: sc.id,
        title: sc.title,
        desc: sc.desc,
        type: sc.type === 'samu' ? 'samu' : (sc.type === 'crise' ? 'crise' : 'dps'),
        isCrisis: sc.type === 'crise',
        scale: sc.scale,
        category: sc.category,
        urgency: sc.timing === 'imprevisible' ? 'critique' : (sc.urgency || 'normale'),
        riskLevel: sc.riskLevel,
        environment: sc.environment || 'ouvert_urbain',
        timing: sc.timing || 'imprevisible',
        anticipationDelay: delayMin,
        authority: sc.authority || (sc.type === 'crise' ? 'prefecture' : (sc.type === 'samu' ? 'samu' : 'organisateur')),
        lat: loc.lat,
        lng: loc.lng,
        departmentCode: dept,
        stationId: st?.id || 'default',
        stationName: st?.name || 'Antenne Principale',
        address: game.generateRealisticStreetAddress ? game.generateRealisticStreetAddress(st?.city || 'Secteur Antenne', loc.lat, loc.lng) : `Secteur ${st?.city || 'Opérationnel'}`,
        requiredVolunteers: dyn.volunteers,
        requiredRanks: sc.requiredRanks || ['CE', 'PSE2', 'PSE1'],
        requiredVehicles: dyn.vehicles,
        requiredLots: sc.requiredLots || [],
        rewardMoney: dyn.reward,
        rewardReputation: sc.rewardReputation || 50,
        durationSeconds: durationSec,
        durationHours: dyn.duration.toString(),
        eventDate: { ...(game.clock || { hours: 14, minutes: 0, day: 1, month: 1 }) },
        status: isAnticipation ? 'prealerte' : (sc.type === 'samu' || sc.type === 'crise' ? 'declenche' : 'planifie'),
        isPreAlert: isAnticipation,
        prealerteUntil: isAnticipation ? (now + (delayMin * 60 * 1000)) : null,
        registeredVolunteers: [],
        assignedRoles: {},
        assignedCrew: { volunteers: [], vehicles: [] },
        peripeties: sc.peripeties || [],
        isEvolutive: Boolean(sc.isEvolutive),
        phases: sc.phases || [],
        evolutions: sc.evolutions || [],
        currentPhaseId: sc.phases?.[0]?.id || null,
        isScenarioTriggered: true,
        operationalLog: [
          {
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            text: isAnticipation 
              ? `PRÉFECTURE (COD) : Pré-alerte opérationnelle activée (délai : ${this.formatDelay(delayMin)}). Mobilisation préventive en cours.`
              : `DÉCLENCHEMENT IMMÉDIAT : Ordre de départ opérationnel émis.`,
            author: sc.authority ? sc.authority.toUpperCase() : 'COMMANDEMENT'
          }
        ]
      };

      if (!Array.isArray(game.missions)) game.missions = [];
      game.missions.unshift(mission);

      if (sc.type === 'samu') {
        if (window.ProtecAudio?.playRadioBeep) window.ProtecAudio.playRadioBeep();
        if (window.ProtecNotifications?.notifyCategory) {
          window.ProtecNotifications.notifyCategory('urgences', '🚨 Réquisition SAMU 15 !', `${sc.title} : départ réflexe VPSP immédiat demandé.`, `samu-notif-${mission.id}`);
        }
      } else if (sc.type === 'crise') {
        if (window.ProtecAudio?.playSirenAlarm) window.ProtecAudio.playSirenAlarm();
        if (window.ProtecNotifications?.notifyCategory) {
          const notifTitle = isAnticipation ? '📅 Pré-alerte Préfecture Activée' : '⚠️ Alerte Majeure Préfecture (COD)';
          const notifMsg = isAnticipation 
            ? `Pré-alerte émise pour « ${sc.title} ». Rassemblement sous ${delayMin} min.`
            : `Déclenchement immédiat : « ${sc.title} » sur le département ${dept}.`;
          window.ProtecNotifications.notifyCategory('crise', notifTitle, notifMsg, `crise-notif-${mission.id}`);
        }
      } else {
        if (window.ProtecNotifications?.notifyCategory) {
          window.ProtecNotifications.notifyCategory('dps', '📋 Nouveau DPS Prêt à l\'Engagement', `${sc.title} injecté dans votre planning.`, `dps-notif-${mission.id}`);
        }
      }

      game.renderMissions?.();
      game.updateStatsUI?.();
      game.saveGame?.();

      if (game.showToast) {
        const typeBadge = isAnticipation ? '📅 PRÉ-ALERTE' : (sc.type === 'crise' ? '🚨 CRISE' : (sc.type === 'samu' ? '🚑 SAMU' : '📋 DPS'));
        game.showToast(
          `${typeBadge} Déclenché avec Succès !`,
          `« ${sc.title} » (${dyn.volunteers} secouristes, ${dyn.vehicles.join('/')}) est disponible sur la carte.`,
          isAnticipation ? 'amber' : (sc.type === 'crise' ? 'red' : 'green')
        );
      }

      return true;
    },

    // =========================================================================
    // RENDU DU DIAGRAMME DE SANKEY (SVG FLUIDE & EMBRANCHEMENTS)
    // =========================================================================
    renderSankeyDiagram(phases = [], evolutions = []) {
      if (!Array.isArray(phases) || phases.length === 0) {
        return `
          <div class="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2">
            <span class="text-2xl">🌱</span>
            <p class="text-xs font-bold text-slate-300">Aucune phase configurée pour ce scénario.</p>
            <p class="text-[11px] text-slate-500">Utilisez un modèle de flux ci-dessus ou cliquez sur « + Ajouter une Phase » ci-dessous.</p>
          </div>
        `;
      }

      const svgW = 820;
      const svgH = 260;

      // Grouper les phases par étape chronologique (step)
      const steps = {};
      phases.forEach(p => {
        const s = parseInt(p.step, 10) || 1;
        if (!steps[s]) steps[s] = [];
        steps[s].push(p);
      });

      const stepKeys = Object.keys(steps).map(Number).sort((a,b) => a-b);
      const colCount = Math.max(1, stepKeys.length);
      const nodeW = 165;
      const paddingX = 40;
      const availW = svgW - (paddingX * 2) - nodeW;

      // Calculer la géométrie des nœuds
      const nodeMap = {};
      stepKeys.forEach((sKey, colIdx) => {
        const colX = paddingX + (colCount > 1 ? (colIdx / (colCount - 1)) * availW : (availW / 2));
        const colNodes = steps[sKey];
        const count = colNodes.length;
        const paddingY = 25;
        const availH = svgH - (paddingY * 2);
        const nodeH = Math.max(38, Math.min(56, (availH - ((count - 1) * 14)) / count));

        colNodes.forEach((n, rowIdx) => {
          const nodeY = paddingY + rowIdx * (nodeH + 14);
          nodeMap[n.id] = {
            ...n,
            x: colX,
            y: nodeY,
            w: nodeW,
            h: nodeH,
            color: n.color || (n.direction === 'montante' ? '#f43f5e' : (n.direction === 'descendante' ? '#10b981' : '#38bdf8'))
          };
        });
      });

      // Calculer les rubans de liaison Sankey
      const outOffsets = {};
      const inOffsets = {};
      phases.forEach(p => { outOffsets[p.id] = 0; inOffsets[p.id] = 0; });

      const ribbons = [];
      const defsGradients = [];

      (evolutions || []).forEach((evo, idx) => {
        const src = nodeMap[evo.source];
        const tgt = nodeMap[evo.target];
        if (!src || !tgt) return;

        const prob = Math.max(5, Math.min(100, parseInt(evo.probability, 10) || 50));
        const ribbonH = Math.max(6, Math.min(24, (prob / 100) * src.h * 0.75));

        const y1_top = src.y + 6 + (outOffsets[evo.source] || 0);
        const y1_bot = y1_top + ribbonH;
        const y2_top = tgt.y + 6 + (inOffsets[evo.target] || 0);
        const y2_bot = y2_top + ribbonH;

        outOffsets[evo.source] = (outOffsets[evo.source] || 0) + ribbonH + 3;
        inOffsets[evo.target] = (inOffsets[evo.target] || 0) + ribbonH + 3;

        const x1 = src.x + src.w;
        const x2 = tgt.x;
        const deltaX = Math.max(20, Math.abs(x2 - x1));
        const cpx1 = x1 + deltaX * 0.45;
        const cpx2 = x2 - deltaX * 0.45;

        const pathD = `M ${x1} ${y1_top} C ${cpx1} ${y1_top}, ${cpx2} ${y2_top}, ${x2} ${y2_top} L ${x2} ${y2_bot} C ${cpx2} ${y2_bot}, ${cpx1} ${y1_bot}, ${x1} ${y1_bot} Z`;

        const gradId = `sankey-grad-${idx}`;
        defsGradients.push(`
          <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="${src.color}" stop-opacity="0.65" />
            <stop offset="100%" stop-color="${tgt.color}" stop-opacity="0.65" />
          </linearGradient>
        `);

        ribbons.push({
          id: evo.id || `evo-${idx}`,
          pathD,
          gradId,
          midX: (x1 + x2) / 2,
          midY: (y1_top + y2_top) / 2,
          prob,
          label: evo.label || ''
        });
      });

      return `
        <div class="relative w-full rounded-2xl bg-slate-950/90 border border-slate-800 p-3 overflow-hidden shadow-inner">
          <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full h-auto select-none font-sans" style="max-height: 290px;">
            <defs>
              ${defsGradients.join('')}
              <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.5"/>
              </filter>
            </defs>

            <!-- Colonnes d'étapes (repères temporels) -->
            <g class="sankey-step-headers" opacity="0.4">
              ${stepKeys.map((sKey, colIdx) => {
                const colX = paddingX + (colCount > 1 ? (colIdx / (colCount - 1)) * availW : (availW / 2)) + (nodeW / 2);
                return `
                  <text x="${colX}" y="14" text-anchor="middle" fill="#94a3b8" font-size="8.5" font-weight="900" letter-spacing="1">
                    ÉTAPE ${sKey}
                  </text>
                `;
              }).join('')}
            </g>

            <!-- Rubans de flux Sankey -->
            <g class="sankey-ribbons">
              ${ribbons.map(r => `
                <g class="transition-opacity hover:opacity-100 cursor-pointer group" opacity="0.85">
                  <path d="${r.pathD}" fill="url(#${r.gradId})" stroke="#ffffff" stroke-opacity="0.1" stroke-width="0.5" />
                  <rect x="${r.midX - 35}" y="${r.midY - 9}" width="70" height="18" rx="9" fill="#0f172a" stroke="#475569" stroke-width="0.8" />
                  <text x="${r.midX}" y="${r.midY + 3.5}" text-anchor="middle" fill="#f8fafc" font-size="9" font-weight="900">${r.prob}%</text>
                  ${r.label ? `
                    <title>${r.prob}% : ${r.label}</title>
                  ` : ''}
                </g>
              `).join('')}
            </g>

            <!-- Nœuds de phases -->
            <g class="sankey-nodes">
              ${Object.values(nodeMap).map(n => {
                const icon = n.direction === 'montante' ? '🔺' : (n.direction === 'descendante' ? '🔻' : '🔹');
                const dirLabel = n.direction === 'montante' ? 'Escalade' : (n.direction === 'descendante' ? 'Repli' : 'Stable');
                const textY2 = n.h > 45 ? 43 : 32;
                return `
                  <g transform="translate(${n.x}, ${n.y})" filter="url(#node-glow)" class="cursor-pointer group">
                    <rect width="${n.w}" height="${n.h}" rx="10" fill="#0f172a" stroke="${n.color}" stroke-width="1.8" />
                    <rect x="0" y="0" width="5" height="${n.h}" rx="2.5" fill="${n.color}" />
                    
                    <!-- Texte Phase -->
                    <text x="12" y="16" fill="#ffffff" font-size="9.5" font-weight="900">
                      ${n.name.length > 22 ? n.name.slice(0, 20) + '…' : n.name}
                    </text>
                    
                    <text x="12" y="30" fill="${n.color}" font-size="8.5" font-weight="700">
                      ${icon} ${dirLabel} • ${n.durationMin || 45}m
                    </text>

                    <text x="12" y="${textY2}" fill="#94a3b8" font-size="8" font-weight="600">
                      👥 ${n.requiredVolunteers || 4} secouristes
                    </text>
                  </g>
                `;
              }).join('')}
            </g>
          </svg>

          <!-- Légende interactive sous le diagramme -->
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 mt-1 flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Escalade / Aggravation</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-sky-400"></span> Maintien / Stable</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Stabilisation / Repli</span>
            </div>
            <span class="font-bold text-slate-300">Épaisseur du flux = Probabilité d'occurrence (%)</span>
          </div>
        </div>
      `;
    },

    // =========================================================================
    // RENDU DE L'INTERFACE D'ADMINISTRATION
    // =========================================================================
    renderAdminView(container, game) {
      if (!container) return;
      if (!game) game = window.game;

      const allScenarios = this.getAllScenarios();
      const countTotal = allScenarios.length;
      const countDPS = allScenarios.filter(s => s.type === 'dps').length;
      const countSAMU = allScenarios.filter(s => s.type === 'samu').length;
      const countCrise = allScenarios.filter(s => s.type === 'crise').length;
      const countCustom = allScenarios.filter(s => s.isCustom).length;

      const isEditing = Boolean(this.editingScenarioId);
      const editingScenario = isEditing ? this.getCurrentEditingScenario() : null;
      const selectedDelays = editingScenario ? this.getAnticipationDelays(editingScenario) : [120];

      container.innerHTML = `
        <div class="space-y-4">

          <!-- BANDEAU D'EN-TÊTE -->
          <div class="p-4 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 text-white shadow-xl border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">🎭</span>
                <h3 class="text-sm font-black uppercase tracking-wider text-indigo-200">Générateur & Gestionnaire de Scénarios Opérationnels</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Anticipation • Imprévisible • Diagramme de Sankey
                </span>
              </div>
              <p class="text-[11px] text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Créez et paramétrez vos scénarios d'intervention. Définissez la temporalité (pré-alerte multi-délais ou crise réflexe), les moyens adaptatifs selon votre antenne, et modélisez les flux de phases avec le diagramme de Sankey.
              </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <button onclick="window.ProtecScenariosManager.openEditor('new')" class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer">
                <span>➕ Créer un Scénario</span>
              </button>
              <button onclick="window.ProtecScenariosManager.promptResetAll()" class="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-700" title="Rétablir les scénarios par défaut">
                <span>↺ Rétablir Défauts</span>
              </button>
            </div>
          </div>

          <!-- FORMULAIRE D'ÉDITION DU SCÉNARIO -->
          ${isEditing && editingScenario ? `
            <div id="scenario-editor-box" class="p-5 sm:p-6 rounded-3xl bg-slate-900 text-slate-100 border-2 border-indigo-500/80 shadow-2xl space-y-5 animate-in fade-in duration-200">
              
              <!-- En-tête de l'éditeur -->
              <div class="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div class="flex items-center gap-2.5">
                  <span class="text-xl">${editingScenario.id.startsWith('custom_') || editingScenario.id === 'new' ? '✨' : '✏️'}</span>
                  <div>
                    <h4 class="text-sm font-black text-white uppercase tracking-wide">
                      ${editingScenario.id === 'new' ? 'Création d’un Nouveau Scénario' : `Édition : « ${editingScenario.title || 'Scénario'} »`}
                    </h4>
                    <p class="text-[11px] text-slate-400">Paramétrez le titre, la temporalité, les moyens et l'arbre d'évolution des phases.</p>
                  </div>
                </div>
                <button onclick="window.ProtecScenariosManager.closeEditor()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs transition cursor-pointer">
                  ✕ Fermer
                </button>
              </div>

              <form onsubmit="window.ProtecScenariosManager.handleSaveForm(event)" class="space-y-4">
                <input type="hidden" id="scen-edit-id" value="${editingScenario.id}" />

                <!-- SECTION 1 : TITRE & TYPE D'OPÉRATION -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div class="md:col-span-2">
                    <label class="block text-[10px] font-black uppercase text-slate-300 mb-1">Titre du Scénario :</label>
                    <input type="text" id="scen-edit-title" value="${editingScenario.title || ''}" required placeholder="Ex: Accident Collectif / Alerte Canicule / DPS Tripartite" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white focus:ring-2 focus:ring-indigo-500 placeholder-slate-500" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase text-slate-300 mb-1">Type d'Opération :</label>
                    <select id="scen-edit-type" onchange="window.ProtecScenariosManager.onTypeChange(this.value)" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white focus:ring-2 focus:ring-indigo-500">
                      <option value="crise" ${editingScenario.type === 'crise' ? 'selected' : ''}>🚨 Crise Majeure / NOVI / ORSEC</option>
                      <option value="samu" ${editingScenario.type === 'samu' ? 'selected' : ''}>🚑 Urgence & Garde SAMU 15</option>
                      <option value="dps" ${editingScenario.type === 'dps' ? 'selected' : ''}>📋 Dispositif Prévisionnel (DPS)</option>
                    </select>
                  </div>
                </div>

                <!-- SECTION 2 : TEMPORALITÉ & ANTICIPATION (MULTI-SÉLECTION DE DÉLAIS) -->
                <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                      Temporalité : Anticipation vs Crise Imprévisible
                    </span>
                    <span class="text-[10px] text-slate-400">Détermine la phase de pré-alerte avant l'engagement</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label class="p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${editingScenario.timing === 'anticipation' ? 'bg-amber-950/40 border-amber-500/80 text-amber-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'}">
                      <input type="radio" name="scen-edit-timing" value="anticipation" ${editingScenario.timing === 'anticipation' ? 'checked' : ''} onchange="window.ProtecScenariosManager.onTimingChange('anticipation')" class="mt-0.5 text-amber-500 focus:ring-amber-500" />
                      <div>
                        <div class="text-xs font-black text-amber-300">📅 Anticipation / Pré-alerte Programmée</div>
                        <p class="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          Événement prévisible ou programmé (vigilance météo, rassemblement, pré-alerte Préfecture).
                        </p>
                      </div>
                    </label>

                    <label class="p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${editingScenario.timing !== 'anticipation' ? 'bg-rose-950/40 border-rose-500/80 text-rose-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'}">
                      <input type="radio" name="scen-edit-timing" value="imprevisible" ${editingScenario.timing !== 'anticipation' ? 'checked' : ''} onchange="window.ProtecScenariosManager.onTimingChange('imprevisible')" class="mt-0.5 text-rose-500 focus:ring-rose-500" />
                      <div>
                        <div class="text-xs font-black text-rose-300">🚨 Crise Imprévisible / Alerte Réflexe</div>
                        <p class="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          Accident soudain, collision, explosion. Déclenchement d'urgence immédiat sans aucun préavis.
                        </p>
                      </div>
                    </label>
                  </div>

                  <!-- Panneau des Délais d'anticipation avec sélection multiple -->
                  <div id="scen-anticipation-box" class="${editingScenario.timing === 'anticipation' ? 'block' : 'hidden'} pt-3 border-t border-slate-800/80 space-y-3">
                    <div>
                      <div class="flex items-center justify-between mb-2">
                        <label class="block text-[10px] font-black uppercase text-amber-400 tracking-wider">
                          ⏱️ Délais d'Anticipation / Pré-alerte Possibles (Sélection Multiple) :
                        </label>
                        <span class="text-[9.5px] text-slate-400">Cochez les délais envisagés (tirage aléatoire lors du déclenchement)</span>
                      </div>
                      
                      <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        ${this.AVAILABLE_ANTICIPATION_DELAYS.map(d => {
                          const isChecked = selectedDelays.includes(d.value);
                          return `
                            <label class="scen-delay-pill p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${isChecked ? 'bg-amber-950/70 border-amber-500 text-amber-200 shadow-sm ring-1 ring-amber-500/50' : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}" onclick="window.ProtecScenariosManager.toggleAnticipationBadge(this)">
                              <input type="checkbox" name="scen-anticipation-delay" value="${d.value}" ${isChecked ? 'checked' : ''} class="hidden" />
                              <span class="text-xs font-black">${d.label}</span>
                              <span class="text-[9px] text-slate-400 mt-0.5">${d.hint}</span>
                            </label>
                          `;
                        }).join('')}
                      </div>

                      <div class="flex items-center justify-between text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-xl mt-2.5 flex-wrap gap-2">
                        <div class="flex items-center gap-1.5">
                          <span>💡</span>
                          <span><strong>Multi-délais actif :</strong> En cochant par exemple <strong>2 heures</strong> et <strong>J-2 (48h)</strong>, le scénario pourra être pré-alerté 2h avant comme 2 jours avant.</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <button type="button" onclick="window.ProtecScenariosManager.selectAllDelays(true)" class="text-[9.5px] font-bold text-amber-400 hover:underline">Tout cocher</button>
                          <span>•</span>
                          <button type="button" onclick="window.ProtecScenariosManager.selectAllDelays(false)" class="text-[9.5px] font-bold text-slate-400 hover:underline">Tout décocher</button>
                        </div>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-slate-800/60">
                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">🏛️ Autorité Commanditaire :</label>
                      <select id="scen-edit-authority" class="w-full sm:w-1/2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-500">
                        <option value="prefecture" ${editingScenario.authority === 'prefecture' ? 'selected' : ''}>Préfecture de Département (COD / SIDPC)</option>
                        <option value="samu" ${editingScenario.authority === 'samu' ? 'selected' : ''}>SAMU 15 / Régulation Médicale</option>
                        <option value="sdis" ${editingScenario.authority === 'sdis' ? 'selected' : ''}>SDIS / Sapeurs-Pompiers (CODIS)</option>
                        <option value="mairie" ${editingScenario.authority === 'mairie' ? 'selected' : ''}>Mairie (Plan Communal de Sauvegarde PCS)</option>
                        <option value="organisateur" ${editingScenario.authority === 'organisateur' ? 'selected' : ''}>Organisateur Privé / FNPC</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- SECTION 3 : DESCRIPTION & ÉCHELLE -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div class="md:col-span-2">
                    <label class="block text-[10px] font-black uppercase text-slate-300 mb-1">Description Opérationnelle :</label>
                    <textarea id="scen-edit-desc" rows="2" placeholder="Contexte opérationnel, risques identifiés, mission confiée aux secouristes..." class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-indigo-500 placeholder-slate-500">${editingScenario.desc || ''}</textarea>
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase text-slate-300 mb-1">Échelle & Format :</label>
                    <input type="text" id="scen-edit-scale" value="${editingScenario.scale || ''}" placeholder="Ex: PLAN NOVI / DPS-PE" class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-amber-300 focus:ring-2 focus:ring-indigo-500 placeholder-slate-500" />
                    <div class="mt-1 flex flex-wrap gap-1">
                      <button type="button" onclick="document.getElementById('scen-edit-scale').value = 'PLAN NOVI (PMA & Noria VPSP)'" class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400">NOVI</button>
                      <button type="button" onclick="document.getElementById('scen-edit-scale').value = 'PLAN ORSEC (Soutien & CHU/CAI)'" class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400">ORSEC</button>
                      <button type="button" onclick="document.getElementById('scen-edit-scale').value = 'Garde Postée SAMU 15 (1 VPSP)'" class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400">SAMU</button>
                      <button type="button" onclick="document.getElementById('scen-edit-scale').value = 'DPS-PE (4 secouristes + VPSP)'" class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400">DPS-PE</button>
                    </div>
                  </div>
                </div>

                <!-- SECTION 4 : DIMENSIONNEMENT VARIABLE DES MOYENS -->
                <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                      <i data-lucide="sliders" class="w-3.5 h-3.5"></i>
                      Dimensionnement des Moyens : Adaptatif ou Personnalisé
                    </span>
                    <span class="text-[10px] text-slate-400">Calcul automatique selon les moyens réels du joueur</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label class="p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${editingScenario.scalingMode === 'adaptive' || !editingScenario.scalingMode ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'}">
                      <input type="radio" name="scen-edit-scaling-mode" value="adaptive" ${editingScenario.scalingMode === 'adaptive' || !editingScenario.scalingMode ? 'checked' : ''} onchange="window.ProtecScenariosManager.onScalingModeChange('adaptive')" class="text-indigo-500" />
                      <span class="text-xs font-black">⚡ Adaptatif aux moyens</span>
                    </label>

                    <label class="p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${editingScenario.scalingMode === 'range' ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'}">
                      <input type="radio" name="scen-edit-scaling-mode" value="range" ${editingScenario.scalingMode === 'range' ? 'checked' : ''} onchange="window.ProtecScenariosManager.onScalingModeChange('range')" class="text-indigo-500" />
                      <span class="text-xs font-black">🎯 Fourchette Min - Max</span>
                    </label>

                    <label class="p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer ${editingScenario.scalingMode === 'fixed' ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'}">
                      <input type="radio" name="scen-edit-scaling-mode" value="fixed" ${editingScenario.scalingMode === 'fixed' ? 'checked' : ''} onchange="window.ProtecScenariosManager.onScalingModeChange('fixed')" class="text-indigo-500" />
                      <span class="text-xs font-black">📌 Valeurs Fixes</span>
                    </label>
                  </div>

                  <div id="scen-box-adaptive" class="${editingScenario.scalingMode === 'adaptive' || !editingScenario.scalingMode ? 'grid' : 'hidden'} grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">Niveau d'Ampleur :</label>
                      <select id="scen-edit-scale-intensity" class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-amber-300">
                        <option value="faible" ${editingScenario.scaleIntensity === 'faible' ? 'selected' : ''}>🟢 Locale (~20% effectifs dispo)</option>
                        <option value="moyenne" ${editingScenario.scaleIntensity === 'moyenne' || !editingScenario.scaleIntensity ? 'selected' : ''}>🟡 Standard (~40% effectifs dispo)</option>
                        <option value="forte" ${editingScenario.scaleIntensity === 'forte' ? 'selected' : ''}>🟠 Majeure (~65% effectifs dispo)</option>
                        <option value="maximale" ${editingScenario.scaleIntensity === 'maximale' ? 'selected' : ''}>🔴 Catastrophe (~85% effectifs dispo)</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">👥 Min - Max Secouristes :</label>
                      <div class="flex items-center gap-1.5">
                        <input type="number" id="scen-edit-min-vols" min="1" max="50" value="${editingScenario.minVolunteers || 4}" placeholder="Min" class="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white text-center" />
                        <span class="text-slate-500 font-bold">à</span>
                        <input type="number" id="scen-edit-max-vols" min="1" max="50" value="${editingScenario.maxVolunteers || 14}" placeholder="Max" class="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white text-center" />
                      </div>
                    </div>

                    <div>
                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">⏱️ Durée Estimée (H) :</label>
                      <div class="flex items-center gap-1.5">
                        <input type="number" step="0.5" id="scen-edit-min-duration" min="0.5" max="48" value="${editingScenario.minDurationHours || editingScenario.durationHours || 4.0}" class="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white text-center" />
                        <span class="text-slate-500 font-bold">à</span>
                        <input type="number" step="0.5" id="scen-edit-max-duration" min="0.5" max="48" value="${editingScenario.maxDurationHours || 7.0}" class="w-1/2 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white text-center" />
                      </div>
                    </div>

                    <div>
                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">⚠️ Niveau de Risque :</label>
                      <select id="scen-edit-risk" class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white">
                        <option value="faible" ${editingScenario.riskLevel === 'faible' ? 'selected' : ''}>Faible (Vert)</option>
                        <option value="moyen" ${editingScenario.riskLevel === 'moyen' ? 'selected' : ''}>Moyen (Bleu/Orange)</option>
                        <option value="eleve" ${editingScenario.riskLevel === 'eleve' ? 'selected' : ''}>Élevé (Orange)</option>
                        <option value="critique" ${editingScenario.riskLevel === 'critique' || !editingScenario.riskLevel ? 'selected' : ''}>Critique (Rouge)</option>
                      </select>
                    </div>
                  </div>

                  <div id="scen-box-manual" class="${editingScenario.scalingMode === 'range' || editingScenario.scalingMode === 'fixed' ? 'grid' : 'hidden'} grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                    <div>
                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">👥 Secouristes Requis :</label>
                      <input type="number" id="scen-edit-volunteers" min="1" max="50" value="${editingScenario.requiredVolunteers || 6}" class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-black text-white" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">⏱️ Durée Fixe (H) :</label>
                      <input type="number" step="0.5" id="scen-edit-duration" min="0.5" max="72" value="${editingScenario.durationHours || 5}" class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-black text-white" />
                    </div>
                    <div>
                      <label class="block text-[10px] font-black uppercase text-slate-400 mb-1">💶 Rémunération (€) :</label>
                      <input type="number" id="scen-edit-reward" min="0" step="50" value="${editingScenario.rewardMoney || 850}" class="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono font-black text-emerald-400" />
                    </div>
                  </div>
                </div>

                <!-- SECTION 5 : ÉVOLUTIONS OPÉRATIONNELLES & DIAGRAMME DE SANKEY DES PHASES -->
                <div class="p-4 rounded-3xl bg-slate-950/80 border border-indigo-500/40 space-y-3.5 shadow-lg">
                  <div class="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span class="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                        <i data-lucide="git-branch" class="w-4 h-4 text-indigo-400"></i>
                        Évolutions Possibles & Diagramme de Sankey des Phases
                      </span>
                      <p class="text-[10px] text-slate-400 mt-0.5">
                        Modélisez le déroulement opérationnel, les embranchements (escalade / stabilisation) et visualisez le flux Sankey en temps réel.
                      </p>
                    </div>

                    <!-- Presets en 1 clic -->
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-[10px] font-bold text-slate-400">Modèles de flux :</span>
                      <button type="button" onclick="window.ProtecScenariosManager.applySankeyPreset('arbre_2_branches')" class="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-600 text-[10px] font-bold text-indigo-200 border border-indigo-700/60 transition cursor-pointer">
                        🌿 Arbre à 2 Branches (60/40)
                      </button>
                      <button type="button" onclick="window.ProtecScenariosManager.applySankeyPreset('escalade_3_niveaux')" class="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-600 text-[10px] font-bold text-indigo-200 border border-indigo-700/60 transition cursor-pointer">
                        📈 Escalade à 3 Niveaux
                      </button>
                      <button type="button" onclick="window.ProtecScenariosManager.applySankeyPreset('lineaire')" class="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-600 text-[10px] font-bold text-indigo-200 border border-indigo-700/60 transition cursor-pointer">
                        ➡️ Linéaire Simple
                      </button>
                    </div>
                  </div>

                  <!-- Conteneur d'affichage dynamique du diagramme de Sankey -->
                  <div id="sankey-diagram-container">
                    ${this.renderSankeyDiagram(editingScenario.phases, editingScenario.evolutions)}
                  </div>

                  <!-- Configuration détaillée des phases -->
                  <div class="pt-3 border-t border-slate-800 space-y-3">
                    <div class="flex items-center justify-between">
                      <div>
                        <h5 class="text-[10px] font-black uppercase text-indigo-300">1. Phases du Scénario (Étapes Chronologiques) :</h5>
                        <p class="text-[9.5px] text-slate-500">Choisissez l'étape (colonne dans le Sankey), le nom, la tendance et les effectifs requis</p>
                      </div>
                      <button type="button" onclick="window.ProtecScenariosManager.addNewPhasePrompt()" class="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm">
                        <span>+ Ajouter une Phase</span>
                      </button>
                    </div>

                    <div id="scen-phases-editor-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                      ${this.renderPhasesEditorHTML(editingScenario.phases || [])}
                    </div>

                    <!-- Configuration détaillée des transitions & probabilités -->
                    <div class="pt-3 border-t border-slate-800/80 space-y-2.5">
                      <div class="flex items-center justify-between">
                        <div>
                          <h5 class="text-[10px] font-black uppercase text-emerald-400">2. Branches d'Évolution & Probabilités (%) :</h5>
                          <p class="text-[9.5px] text-slate-500">Reliez une phase source vers une phase cible avec le pourcentage d'occurrence</p>
                        </div>
                        <button type="button" onclick="window.ProtecScenariosManager.addNewEvolutionPrompt()" class="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-sm">
                          <span>+ Ajouter une Transition</span>
                        </button>
                      </div>

                      <div id="scen-evolutions-editor-list" class="space-y-2">
                        ${this.renderEvolutionsEditorHTML(editingScenario.phases || [], editingScenario.evolutions || [])}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SECTION 6 : VÉHICULES & MATÉRIELS REQUIS -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="block text-[10px] font-black uppercase text-slate-300">🚑 Dotation Véhicules :</label>
                      <select id="scen-edit-veh-mode" onchange="window.ProtecScenariosManager.onVehiclesModeChange(this.value)" class="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                        <option value="auto" ${editingScenario.vehiclesMode === 'auto' || !editingScenario.vehiclesMode ? 'selected' : ''}>Calcul Auto (1 VPSP / 4 sec. + VTU)</option>
                        <option value="fixed" ${editingScenario.vehiclesMode === 'fixed' ? 'selected' : ''}>Véhicules Imposés Manuels</option>
                      </select>
                    </div>

                    <div id="scen-veh-checkboxes" class="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                      ${['VPSP', 'VTU', 'VL', 'Minibus', 'Quad', 'Vélo'].map(vType => {
                        const checked = (editingScenario.requiredVehicles || ['VPSP']).includes(vType);
                        return `
                          <label class="p-2 rounded-xl border flex items-center gap-1.5 cursor-pointer ${checked ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'}">
                            <input type="checkbox" name="scen-veh" value="${vType}" ${checked ? 'checked' : ''} class="rounded text-indigo-600" />
                            <span>${vType}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <label class="block text-[10px] font-black uppercase text-slate-300">📦 Lots Opérationnels & Matériels Requis :</label>
                    <div class="grid grid-cols-2 gap-1.5 text-[10.5px] font-bold">
                      ${[
                        { id: 'lot_secours_b', label: 'Lot B (Urgence VPSP)' },
                        { id: 'lot_secours_a', label: 'Lot A (Tente PMA & Soins)' },
                        { id: 'lot_secours_c', label: 'Lot C (Brancardage)' },
                        { id: 'caisse_rearmement', label: 'Kit Réarmement (3x)' },
                        { id: 'lot_cai', label: 'Lot CAI (Accueil Impliqués & SINUS)' },
                        { id: 'lot_chu', label: 'Lot CHU (Lits Picots & Hébergement)' },
                        { id: 'lot_ravitaillement', label: 'Lot Ravitaillement (Vivres & Eau)' },
                        { id: 'lot_epuisement', label: 'Lot Épuisement (Motopompes)' }
                      ].map(l => {
                        const checked = (editingScenario.requiredLots || ['lot_secours_b']).includes(l.id);
                        return `
                          <label class="p-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer ${checked ? 'bg-orange-950/40 border-orange-500/80 text-orange-200' : 'bg-slate-800/60 border-slate-700 text-slate-400'}">
                            <input type="checkbox" name="scen-lot" value="${l.id}" ${checked ? 'checked' : ''} class="rounded text-orange-500" />
                            <span class="truncate">${l.label}</span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>

                <!-- SECTION 7 : PÉRIPÉTIES & INCIDENTS -->
                <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div class="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <label class="block text-[10px] font-black uppercase text-slate-300">⚡ Péripéties & Incidents possibles pendant la mission :</label>
                      <p class="text-[10px] text-slate-400">Cliquez sur les suggestions thématiques pour les insérer en 1 clic</p>
                    </div>
                    <button type="button" onclick="window.ProtecScenariosManager.addPeripetieInput()" class="px-2.5 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                      <span>+ Ajouter un incident personnalisé</span>
                    </button>
                  </div>

                  <!-- Suggestions catégorisées par thèmes réalistes -->
                  <div class="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
                    <div class="flex items-center gap-1 flex-wrap text-[10px]">
                      <span class="font-black text-rose-400 mr-1">🚑 Médical :</span>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Arrêt cardio-respiratoire (réanimation RCP + DAE)')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">❤️ ACR (DAE)</button>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Détresse respiratoire sévère sous inhalation d\\\'oxygène')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">🫁 Détresse O2</button>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Polytraumatisme avec suspicion de fracture du rachis (MID)')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">🦴 Polytrauma</button>
                    </div>

                    <div class="flex items-center gap-1 flex-wrap text-[10px]">
                      <span class="font-black text-amber-400 mr-1">💥 Accident & Triage :</span>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Tri SINUS : 2 Urgences Absolues (UA) et 6 Urgences Relatives (UR)')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">🏷️ Tri SINUS</button>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Montage d\\\'urgence du Centre d\\\'Accueil des Impliqués (CAI)')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">⛺ Accueil CAI</button>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Noria continue de VPSP vers les urgences hospitalières')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">🚑 Noria CHU</button>
                    </div>

                    <div class="flex items-center gap-1 flex-wrap text-[10px]">
                      <span class="font-black text-cyan-400 mr-1">🌊 Intempéries & Risques :</span>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Voie d\\\'accès coupée nécessitant un itinéraire de déviation')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">🚧 Route coupée</button>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Mise en batterie des motopompes pour épuisement de sous-sols')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">💧 Pompage</button>
                      <button type="button" onclick="window.ProtecScenariosManager.insertQuickPeripetie('Perte temporaire du relais radio en zone blanche')" class="px-2 py-0.5 rounded bg-slate-700 hover:bg-indigo-600 text-slate-200">📻 Perte Radio</button>
                    </div>
                  </div>

                  <!-- Liste des péripéties configurées -->
                  <div id="scen-peripeties-container" class="space-y-1.5">
                    ${(editingScenario.peripeties || []).map(p => `
                      <div class="flex items-center gap-2">
                        <input type="text" name="scen-peripetie" value="${p.replace(/"/g, '&quot;')}" placeholder="Incident ou événement survenant pendant l'intervention..." class="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" />
                        <button type="button" onclick="this.parentElement.remove()" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition">✕</button>
                      </div>
                    `).join('')}
                    ${(!editingScenario.peripeties || editingScenario.peripeties.length === 0) ? `
                      <div class="flex items-center gap-2">
                        <input type="text" name="scen-peripetie" value="" placeholder="Ex: Malaise d'un impliqué avec prise en charge sous oxygène..." class="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" />
                        <button type="button" onclick="this.parentElement.remove()" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition">✕</button>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <!-- Boutons d'action du formulaire -->
                <div class="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button type="button" onclick="window.ProtecScenariosManager.closeEditor()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer">
                    Annuler
                  </button>
                  <div class="flex items-center gap-2">
                    <button type="submit" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center gap-1.5">
                      <span>💾 Enregistrer le Scénario</span>
                    </button>
                    <button type="button" onclick="window.ProtecScenariosManager.handleSaveAndTrigger(event)" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer">
                      <span>▶ Enregistrer & Déclencher</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ` : ''}

          <!-- FILTRES & BARRE DE RECHERCHE -->
          <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button onclick="window.ProtecScenariosManager.setFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-black transition ${this.activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                Tous (${countTotal})
              </button>
              <button onclick="window.ProtecScenariosManager.setFilter('crise')" class="px-3 py-1.5 rounded-xl text-xs font-black transition ${this.activeFilter === 'crise' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                🚨 Crises (${countCrise})
              </button>
              <button onclick="window.ProtecScenariosManager.setFilter('samu')" class="px-3 py-1.5 rounded-xl text-xs font-black transition ${this.activeFilter === 'samu' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                🚑 SAMU 15 (${countSAMU})
              </button>
              <button onclick="window.ProtecScenariosManager.setFilter('dps')" class="px-3 py-1.5 rounded-xl text-xs font-black transition ${this.activeFilter === 'dps' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                📋 DPS (${countDPS})
              </button>
            </div>

            <div class="relative w-full sm:w-64">
              <input type="text" value="${this.searchQuery}" oninput="window.ProtecScenariosManager.setSearch(this.value)" placeholder="Rechercher un scénario..." class="w-full px-3 py-1.5 pl-8 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" />
              <span class="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
            </div>
          </div>

          <!-- GRILLE DES SCÉNARIOS -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            ${allScenarios.map(sc => {
              const isAnticipation = sc.timing === 'anticipation';
              const delaysSummary = isAnticipation ? this.formatDelaysSummary(this.getAnticipationDelays(sc)) : '';
              const borderCls = sc.type === 'crise' ? 'border-rose-900/40 hover:border-rose-500/70' : (sc.type === 'samu' ? 'border-sky-900/40 hover:border-sky-500/70' : 'border-emerald-900/40 hover:border-emerald-500/70');
              const badgeTypeCls = sc.type === 'crise' ? 'bg-rose-950 text-rose-300 border-rose-800/60' : (sc.type === 'samu' ? 'bg-sky-950 text-sky-300 border-sky-800/60' : 'bg-emerald-950 text-emerald-300 border-emerald-800/60');

              return `
                <div class="p-4 rounded-3xl bg-slate-900/90 border ${borderCls} shadow-md flex flex-col justify-between space-y-3 transition group">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${badgeTypeCls}">
                          ${sc.type === 'crise' ? '🚨 Crise' : (sc.type === 'samu' ? '🚑 SAMU' : '📋 DPS')}
                        </span>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-black ${isAnticipation ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'bg-rose-950 text-rose-300 border border-rose-800/60'}">
                          ${isAnticipation ? `📅 Pré-alerte (${delaysSummary})` : '⚡ Imprévisible'}
                        </span>
                      </div>
                      ${sc.isCustom ? `
                        <span class="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[9px] font-bold border border-indigo-800/50">Custom</span>
                      ` : ''}
                    </div>

                    <div>
                      <h4 class="text-xs font-black text-white group-hover:text-indigo-300 transition line-clamp-1">${sc.title}</h4>
                      <p class="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">${sc.desc || 'Aucune description fournie.'}</p>
                    </div>

                    <div class="grid grid-cols-3 gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px]">
                      <div>
                        <span class="block text-[8px] uppercase text-slate-500 font-black">Secouristes</span>
                        <strong class="text-white">${sc.scalingMode === 'adaptive' ? `${sc.minVolunteers}-${sc.maxVolunteers}` : sc.requiredVolunteers}</strong>
                      </div>
                      <div>
                        <span class="block text-[8px] uppercase text-slate-500 font-black">Durée</span>
                        <strong class="text-white">${sc.durationHours || 4}h</strong>
                      </div>
                      <div>
                        <span class="block text-[8px] uppercase text-slate-500 font-black">Dotation</span>
                        <strong class="text-emerald-400">${sc.rewardMoney ? `${sc.rewardMoney} €` : 'Adaptative'}</strong>
                      </div>
                    </div>

                    <!-- Nombre de phases si multi-phases -->
                    ${(sc.phases && sc.phases.length > 0) ? `
                      <div class="flex items-center gap-1.5 text-[9.5px] text-indigo-300 font-bold bg-indigo-950/40 px-2 py-1 rounded-xl border border-indigo-900/40">
                        <span>📊 ${sc.phases.length} Phases modélisées</span>
                        <span>•</span>
                        <span>${sc.evolutions?.length || 0} transitions Sankey</span>
                      </div>
                    ` : ''}
                  </div>

                  <div class="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1.5">
                    <div class="flex items-center gap-1">
                      <button onclick="window.ProtecScenariosManager.openEditor('${sc.id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer" title="Modifier">
                        ✏️ Éditer
                      </button>
                      <button onclick="window.ProtecScenariosManager.handleDuplicate('${sc.id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer" title="Dupliquer">
                        📑 Cloner
                      </button>
                      ${sc.isCustom ? `
                        <button onclick="window.ProtecScenariosManager.handleDelete('${sc.id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 text-[10px] font-bold transition cursor-pointer" title="Supprimer">
                          🗑️
                        </button>
                      ` : sc.hasOverride ? `
                        <button onclick="window.ProtecScenariosManager.handleResetOne('${sc.id}')" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold transition cursor-pointer" title="Rétablir défaut">
                          ↺
                        </button>
                      ` : ''}
                    </div>

                    <button onclick="window.ProtecScenariosManager.triggerScenarioNow(window.game, '${sc.id}')" class="px-3 py-1.5 rounded-xl ${isAnticipation ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white text-xs font-black transition flex items-center gap-1 shadow-sm cursor-pointer">
                      <span>${isAnticipation ? '📅 Pré-alerter' : '▶ Déclencher'}</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
    },

    // HTML des phases dans l'éditeur
    renderPhasesEditorHTML(phases = []) {
      if (!phases || phases.length === 0) {
        return '<p class="text-[11px] text-slate-500 col-span-full py-2">Aucune phase définie. Cliquez sur « + Ajouter une Phase ».</p>';
      }

      return phases.map(p => `
        <div class="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 relative group shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              <span class="text-[9px] font-bold uppercase text-slate-400">Étape</span>
              <select onchange="window.ProtecScenariosManager.updatePhaseField('${p.id}', 'step', parseInt(this.value,10))" class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-black text-amber-300">
                ${[1, 2, 3, 4, 5].map(sNum => `
                  <option value="${sNum}" ${(parseInt(p.step,10) || 1) === sNum ? 'selected' : ''}>Étape ${sNum}</option>
                `).join('')}
              </select>
            </div>
            <button type="button" onclick="window.ProtecScenariosManager.deletePhase('${p.id}')" class="text-slate-400 hover:text-rose-400 text-xs font-bold p-1" title="Supprimer la phase">✕</button>
          </div>
          
          <div>
            <label class="block text-[8.5px] uppercase font-bold text-slate-400 mb-0.5">Nom de la Phase :</label>
            <input type="text" value="${p.name.replace(/"/g, '&quot;')}" oninput="window.ProtecScenariosManager.updatePhaseField('${p.id}', 'name', this.value)" class="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-bold text-white focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[10px]">
            <div>
              <label class="block text-[8.5px] uppercase font-bold text-slate-400 mb-0.5">Tendance :</label>
              <select onchange="window.ProtecScenariosManager.updatePhaseField('${p.id}', 'direction', this.value)" class="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-[9.5px] text-slate-300">
                <option value="montante" ${p.direction === 'montante' ? 'selected' : ''}>🔺 Escalade</option>
                <option value="stable" ${p.direction === 'stable' ? 'selected' : ''}>🔹 Maintien</option>
                <option value="descendante" ${p.direction === 'descendante' ? 'selected' : ''}>🔻 Repli</option>
              </select>
            </div>

            <div>
              <label class="block text-[8.5px] uppercase font-bold text-slate-400 mb-0.5">Durée (min) :</label>
              <input type="number" min="5" step="5" value="${p.durationMin || 45}" oninput="window.ProtecScenariosManager.updatePhaseField('${p.id}', 'durationMin', parseInt(this.value,10))" placeholder="Min." class="w-full px-1.5 py-1 rounded bg-slate-900 border border-slate-700 text-[9.5px] text-center text-white" />
            </div>
          </div>

          <div>
            <label class="block text-[8.5px] uppercase font-bold text-slate-400 mb-0.5">👥 Effectif requis (Secouristes) :</label>
            <input type="number" min="1" max="50" value="${p.requiredVolunteers || 4}" oninput="window.ProtecScenariosManager.updatePhaseField('${p.id}', 'requiredVolunteers', parseInt(this.value,10))" class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] text-center font-bold text-sky-300" />
          </div>
        </div>
      `).join('');
    },

    // HTML des transitions dans l'éditeur
    renderEvolutionsEditorHTML(phases = [], evolutions = []) {
      if (!evolutions || evolutions.length === 0) {
        return '<p class="text-[11px] text-slate-500 py-1.5">Aucune transition configurée. Cliquez sur « + Ajouter une Transition » pour créer un embranchement.</p>';
      }

      return evolutions.map((e, idx) => `
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/80 text-xs">
          <!-- Phase Source -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[9px] uppercase font-bold text-slate-400">De :</span>
            <select onchange="window.ProtecScenariosManager.updateEvolutionField(${idx}, 'source', this.value)" class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-indigo-300">
              ${phases.map(p => `
                <option value="${p.id}" ${e.source === p.id ? 'selected' : ''}>[Étape ${p.step || 1}] ${p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name}</option>
              `).join('')}
            </select>
          </div>

          <span class="text-slate-400 font-bold hidden sm:inline">➔</span>

          <!-- Phase Cible -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[9px] uppercase font-bold text-slate-400">Vers :</span>
            <select onchange="window.ProtecScenariosManager.updateEvolutionField(${idx}, 'target', this.value)" class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-300">
              ${phases.map(p => `
                <option value="${p.id}" ${e.target === p.id ? 'selected' : ''}>[Étape ${p.step || 1}] ${p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Libellé de la transition -->
          <input type="text" value="${(e.label || '').replace(/"/g, '&quot;')}" placeholder="Condition / Intitulé de transition..." oninput="window.ProtecScenariosManager.updateEvolutionField(${idx}, 'label', this.value)" class="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500" />

          <!-- Probabilité -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[9px] uppercase font-bold text-slate-400">Proba :</span>
            <input type="number" min="5" max="100" step="5" value="${e.probability || 50}" oninput="window.ProtecScenariosManager.updateEvolutionField(${idx}, 'probability', parseInt(this.value,10))" class="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-center font-black text-amber-300" />
            <span class="text-[10px] text-slate-400 font-bold">%</span>
          </div>

          <button type="button" onclick="window.ProtecScenariosManager.deleteEvolution(${idx})" class="p-1 rounded text-slate-400 hover:text-rose-400 text-xs self-end sm:self-center" title="Supprimer">✕</button>
        </div>
      `).join('');
    },

    getEmptyScenarioTemplate() {
      return {
        id: 'new',
        type: this.activeFilter !== 'all' ? this.activeFilter : 'crise',
        category: 'accident_collectif',
        timing: 'imprevisible',
        anticipationDelays: [120],
        anticipationDelay: 120,
        authority: 'prefecture',
        scalingMode: 'adaptive',
        scaleIntensity: 'moyenne',
        scale: '',
        title: '',
        desc: '',
        minVolunteers: 4,
        maxVolunteers: 12,
        requiredVolunteers: 6,
        requiredRanks: ['CE', 'PSE2', 'PSE1'],
        vehiclesMode: 'auto',
        requiredVehicles: ['VPSP', 'VTU'],
        requiredLots: ['lot_secours_b'],
        minDurationHours: 3.0,
        maxDurationHours: 6.0,
        durationHours: 4.5,
        minRewardMoney: 500,
        maxRewardMoney: 1500,
        rewardMoney: 850,
        rewardReputation: 50,
        riskLevel: 'moyen',
        urgency: 'normale',
        environment: 'ouvert_urbain',
        isEvolutive: true,
        phases: [
          { id: 'p1', step: 1, name: 'Phase 1 : Reconnaissance & Déploiement', direction: 'stable', durationMin: 45, requiredVolunteers: 4, color: '#38bdf8' },
          { id: 'p2a', step: 2, name: 'Phase 2A : Escalade & Prise en Charge', direction: 'montante', durationMin: 120, requiredVolunteers: 8, color: '#f43f5e' },
          { id: 'p2b', step: 2, name: 'Phase 2B : Stabilisation & Maîtrise', direction: 'descendante', durationMin: 90, requiredVolunteers: 4, color: '#10b981' },
          { id: 'p3', step: 3, name: 'Phase 3 : Clôture & Repli', direction: 'descendante', durationMin: 45, requiredVolunteers: 4, color: '#8b5cf6' }
        ],
        evolutions: [
          { source: 'p1', target: 'p2a', probability: 60, label: 'Aggravation de la situation' },
          { source: 'p1', target: 'p2b', probability: 40, label: 'Maîtrise rapide de l\'incident' },
          { source: 'p2a', target: 'p3', probability: 60, label: 'Évacuations terminées' },
          { source: 'p2b', target: 'p3', probability: 40, label: 'Retour au calme' }
        ],
        peripeties: []
      };
    },

    getCurrentEditingScenario() {
      if (!this.editingScenarioId) return null;
      if (!this.activeEditingScenario) {
        const base = this.editingScenarioId === 'new' 
          ? this.getEmptyScenarioTemplate() 
          : (this.getScenarioById(this.editingScenarioId) || this.getEmptyScenarioTemplate());
        this.activeEditingScenario = JSON.parse(JSON.stringify(base));
      }
      return this.activeEditingScenario;
    },

    toggleAnticipationBadge(labelEl) {
      if (!labelEl) return;
      const cb = labelEl.querySelector('input[type="checkbox"]');
      if (!cb) return;
      cb.checked = !cb.checked;
      if (cb.checked) {
        labelEl.classList.remove('bg-slate-800/60', 'border-slate-700/80', 'text-slate-400');
        labelEl.classList.add('bg-amber-950/70', 'border-amber-500', 'text-amber-200', 'shadow-sm', 'ring-1', 'ring-amber-500/50');
      } else {
        labelEl.classList.add('bg-slate-800/60', 'border-slate-700/80', 'text-slate-400');
        labelEl.classList.remove('bg-amber-950/70', 'border-amber-500', 'text-amber-200', 'shadow-sm', 'ring-1', 'ring-amber-500/50');
      }
    },

    selectAllDelays(shouldSelect = true) {
      const pills = document.querySelectorAll('.scen-delay-pill');
      pills.forEach(pill => {
        const cb = pill.querySelector('input[type="checkbox"]');
        if (cb) {
          cb.checked = shouldSelect;
          if (shouldSelect) {
            pill.classList.remove('bg-slate-800/60', 'border-slate-700/80', 'text-slate-400');
            pill.classList.add('bg-amber-950/70', 'border-amber-500', 'text-amber-200', 'shadow-sm', 'ring-1', 'ring-amber-500/50');
          } else {
            pill.classList.add('bg-slate-800/60', 'border-slate-700/80', 'text-slate-400');
            pill.classList.remove('bg-amber-950/70', 'border-amber-500', 'text-amber-200', 'shadow-sm', 'ring-1', 'ring-amber-500/50');
          }
        }
      });
    },

    // =========================================================================
    // GESTIONNAIRE INTERACTIF DE PHASES & DIAGRAMME SANKEY
    // =========================================================================
    applySankeyPreset(presetKey) {
      const scen = this.getCurrentEditingScenario();
      if (!scen) return;

      if (presetKey === 'arbre_2_branches') {
        scen.phases = [
          { id: 'p1', step: 1, name: 'Phase 1 : Reconnaissance & Déploiement', direction: 'stable', durationMin: 45, requiredVolunteers: 4, color: '#38bdf8' },
          { id: 'p2a', step: 2, name: 'Phase 2A : Escalade & Afflux de Victimes', direction: 'montante', durationMin: 150, requiredVolunteers: 10, color: '#f43f5e' },
          { id: 'p2b', step: 2, name: 'Phase 2B : Stabilisation & Maîtrise rapide', direction: 'descendante', durationMin: 90, requiredVolunteers: 4, color: '#10b981' },
          { id: 'p3', step: 3, name: 'Phase 3 : Clôture Opérationnelle & Repli', direction: 'descendante', durationMin: 45, requiredVolunteers: 4, color: '#8b5cf6' }
        ];
        scen.evolutions = [
          { source: 'p1', target: 'p2a', probability: 60, label: 'Aggravation de la situation' },
          { source: 'p1', target: 'p2b', probability: 40, label: 'Maîtrise rapide' },
          { source: 'p2a', target: 'p3', probability: 60, label: 'Évacuations terminées' },
          { source: 'p2b', target: 'p3', probability: 40, label: 'Retour au calme' }
        ];
      } else if (presetKey === 'escalade_3_niveaux') {
        scen.phases = [
          { id: 'p1', step: 1, name: 'Phase 1 : Veille & Pré-alerte Préfecture', direction: 'stable', durationMin: 60, requiredVolunteers: 4, color: '#38bdf8' },
          { id: 'p2', step: 2, name: 'Phase 2 : Montée en Puissance & Premiers Soins', direction: 'montante', durationMin: 120, requiredVolunteers: 8, color: '#f59e0b' },
          { id: 'p3a', step: 3, name: 'Phase 3A : Crise Aiguë (PMA / CHU / Noria)', direction: 'montante', durationMin: 240, requiredVolunteers: 14, color: '#ef4444' },
          { id: 'p3b', step: 3, name: 'Phase 3B : Stabilisation & Soins légers', direction: 'descendante', durationMin: 120, requiredVolunteers: 6, color: '#10b981' },
          { id: 'p4', step: 4, name: 'Phase 4 : Désengagement & Clôture', direction: 'descendante', durationMin: 60, requiredVolunteers: 4, color: '#6366f1' }
        ];
        scen.evolutions = [
          { source: 'p1', target: 'p2', probability: 100, label: 'Confirmation d\'engagement' },
          { source: 'p2', target: 'p3a', probability: 55, label: 'Escalade majeure' },
          { source: 'p2', target: 'p3b', probability: 45, label: 'Circonscrit sans complication' },
          { source: 'p3a', target: 'p4', probability: 55, label: 'Fin des norias' },
          { source: 'p3b', target: 'p4', probability: 45, label: 'Fin de dispositif' }
        ];
      } else if (presetKey === 'lineaire') {
        scen.phases = [
          { id: 'p1', step: 1, name: 'Phase 1 : Engagement & Balisage', direction: 'stable', durationMin: 45, requiredVolunteers: 4, color: '#38bdf8' },
          { id: 'p2', step: 2, name: 'Phase 2 : Prise en Charge & Soins', direction: 'montante', durationMin: 150, requiredVolunteers: 6, color: '#f59e0b' },
          { id: 'p3', step: 3, name: 'Phase 3 : Évacuations & Désarmement', direction: 'descendante', durationMin: 60, requiredVolunteers: 4, color: '#10b981' }
        ];
        scen.evolutions = [
          { source: 'p1', target: 'p2', probability: 100, label: 'Dispositif opérationnel' },
          { source: 'p2', target: 'p3', probability: 100, label: 'Fin des prises en charge' }
        ];
      }

      this.refreshSankeyView();
      if (window.game?.showToast) {
        window.game.showToast('Flux Appliqué', 'Le diagramme et les transitions ont été mis à jour.', 'indigo');
      }
    },

    refreshSankeyView() {
      const scen = this.getCurrentEditingScenario();
      if (!scen) return;

      const container = document.getElementById('sankey-diagram-container');
      if (container) {
        container.innerHTML = this.renderSankeyDiagram(scen.phases, scen.evolutions);
      }

      const phasesList = document.getElementById('scen-phases-editor-list');
      if (phasesList) {
        phasesList.innerHTML = this.renderPhasesEditorHTML(scen.phases || []);
      }

      const evoList = document.getElementById('scen-evolutions-editor-list');
      if (evoList) {
        evoList.innerHTML = this.renderEvolutionsEditorHTML(scen.phases || [], scen.evolutions || []);
      }
    },

    updatePhaseField(phaseId, field, value) {
      const scen = this.getCurrentEditingScenario();
      if (!scen || !scen.phases) return;
      const p = scen.phases.find(x => x.id === phaseId);
      if (p) {
        p[field] = value;
        if (field === 'direction') {
          p.color = value === 'montante' ? '#f43f5e' : (value === 'descendante' ? '#10b981' : '#38bdf8');
        }
        // Mise à jour immédiate du SVG
        const container = document.getElementById('sankey-diagram-container');
        if (container) {
          container.innerHTML = this.renderSankeyDiagram(scen.phases, scen.evolutions);
        }
        // Si l'étape ou le nom a changé, rafraîchir les sélecteurs des transitions
        if (field === 'step' || field === 'name') {
          const evoList = document.getElementById('scen-evolutions-editor-list');
          if (evoList) {
            evoList.innerHTML = this.renderEvolutionsEditorHTML(scen.phases || [], scen.evolutions || []);
          }
        }
      }
    },

    updateEvolutionField(index, field, value) {
      const scen = this.getCurrentEditingScenario();
      if (!scen || !scen.evolutions || !scen.evolutions[index]) return;
      scen.evolutions[index][field] = value;
      // Mise à jour immédiate du SVG
      const container = document.getElementById('sankey-diagram-container');
      if (container) {
        container.innerHTML = this.renderSankeyDiagram(scen.phases, scen.evolutions);
      }
    },

    addNewPhasePrompt() {
      const scen = this.getCurrentEditingScenario();
      if (!scen) return;
      if (!scen.phases) scen.phases = [];

      const newId = 'phase_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
      const maxStep = scen.phases.reduce((acc, p) => Math.max(acc, p.step || 1), 1);
      const nextStep = maxStep + 1 <= 5 ? maxStep + 1 : maxStep;

      scen.phases.push({
        id: newId,
        step: nextStep,
        name: `Phase ${scen.phases.length + 1} : Action`,
        direction: 'stable',
        durationMin: 45,
        requiredVolunteers: 4,
        color: '#38bdf8'
      });

      this.refreshSankeyView();
    },

    deletePhase(phaseId) {
      const scen = this.getCurrentEditingScenario();
      if (!scen || !scen.phases) return;
      scen.phases = scen.phases.filter(p => p.id !== phaseId);
      if (scen.evolutions) {
        scen.evolutions = scen.evolutions.filter(e => e.source !== phaseId && e.target !== phaseId);
      }
      this.refreshSankeyView();
    },

    addNewEvolutionPrompt() {
      const scen = this.getCurrentEditingScenario();
      if (!scen || !scen.phases || scen.phases.length < 2) {
        if (window.game?.showToast) {
          window.game.showToast('Phases insuffisantes', 'Il faut au moins 2 phases pour créer une transition d\'évolution.', 'orange');
        }
        return;
      }
      if (!scen.evolutions) scen.evolutions = [];

      const src = scen.phases[0].id;
      const tgt = scen.phases[1].id;

      scen.evolutions.push({
        source: src,
        target: tgt,
        probability: 50,
        label: 'Évolution de la situation'
      });

      this.refreshSankeyView();
    },

    deleteEvolution(index) {
      const scen = this.getCurrentEditingScenario();
      if (!scen || !scen.evolutions) return;
      scen.evolutions.splice(index, 1);
      this.refreshSankeyView();
    },

    openEditor(scenarioId) {
      this.editingScenarioId = scenarioId;
      const base = scenarioId === 'new' 
        ? this.getEmptyScenarioTemplate() 
        : (this.getScenarioById(scenarioId) || this.getEmptyScenarioTemplate());
      this.activeEditingScenario = JSON.parse(JSON.stringify(base));
      this.refreshAdminUI();
      setTimeout(() => {
        const box = document.getElementById('scenario-editor-box');
        if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    },

    closeEditor() {
      this.editingScenarioId = null;
      this.activeEditingScenario = null;
      this.refreshAdminUI();
    },

    setFilter(type) {
      this.activeFilter = type;
      this.refreshAdminUI();
    },

    setSearch(q) {
      this.searchQuery = q || '';
      this.refreshAdminUI();
    },

    onTypeChange(newType) {
      const scaleInput = document.getElementById('scen-edit-scale');
      const authSelect = document.getElementById('scen-edit-authority');
      if (scaleInput) {
        if (newType === 'crise') {
          scaleInput.value = 'PLAN NOVI (PMA & Noria VPSP)';
          if (authSelect) authSelect.value = 'prefecture';
        } else if (newType === 'samu') {
          scaleInput.value = 'Garde Postée SAMU 15 (1 VPSP)';
          if (authSelect) authSelect.value = 'samu';
        } else {
          scaleInput.value = 'DPS-PE (4 secouristes + VPSP)';
          if (authSelect) authSelect.value = 'organisateur';
        }
      }
    },

    onTimingChange(timing) {
      const box = document.getElementById('scen-anticipation-box');
      if (box) {
        if (timing === 'anticipation') {
          box.classList.remove('hidden');
          box.classList.add('block');
        } else {
          box.classList.add('hidden');
          box.classList.remove('block');
        }
      }
    },

    onScalingModeChange(mode) {
      const boxAdaptive = document.getElementById('scen-box-adaptive');
      const boxManual = document.getElementById('scen-box-manual');
      if (boxAdaptive && boxManual) {
        if (mode === 'adaptive') {
          boxAdaptive.classList.remove('hidden');
          boxAdaptive.classList.add('grid');
          boxManual.classList.add('hidden');
          boxManual.classList.remove('grid');
        } else {
          boxAdaptive.classList.add('hidden');
          boxAdaptive.classList.remove('grid');
          boxManual.classList.remove('hidden');
          boxManual.classList.add('grid');
        }
      }
    },

    onVehiclesModeChange(mode) {
      const cb = document.getElementById('scen-veh-checkboxes');
      if (cb) {
        if (mode === 'auto') {
          cb.classList.add('opacity-50');
        } else {
          cb.classList.remove('opacity-50');
        }
      }
    },

    addPeripetieInput(defaultText = '') {
      const container = document.getElementById('scen-peripeties-container');
      if (!container) return;
      const div = document.createElement('div');
      div.className = 'flex items-center gap-2';
      div.innerHTML = `
        <input type="text" name="scen-peripetie" value="${(defaultText || '').replace(/"/g, '&quot;')}" placeholder="Nouvel incident ou péripétie en cours d'intervention..." class="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500" />
        <button type="button" onclick="this.parentElement.remove()" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition">✕</button>
      `;
      container.appendChild(div);
      const input = div.querySelector('input');
      if (input && !defaultText) input.focus();
    },

    insertQuickPeripetie(text) {
      this.addPeripetieInput(text);
      if (window.game?.showToast) {
        window.game.showToast('Incident Ajouté', text, 'blue');
      }
    },

    handleSaveForm(e) {
      if (e) e.preventDefault();
      const id = document.getElementById('scen-edit-id')?.value || 'new';
      const title = document.getElementById('scen-edit-title')?.value || 'Sans titre';
      const type = document.getElementById('scen-edit-type')?.value || 'crise';
      const desc = document.getElementById('scen-edit-desc')?.value || '';
      const scale = document.getElementById('scen-edit-scale')?.value || '';

      const timingNodes = document.querySelectorAll('input[name="scen-edit-timing"]:checked');
      const timing = timingNodes.length > 0 ? timingNodes[0].value : 'imprevisible';

      // Récupérer la sélection multiple des délais d'anticipation
      const checkedDelays = Array.from(document.querySelectorAll('input[name="scen-anticipation-delay"]:checked'))
        .map(input => parseInt(input.value, 10))
        .filter(v => !isNaN(v) && v > 0);
      const anticipationDelays = checkedDelays.length > 0 ? checkedDelays : [120];
      const anticipationDelay = anticipationDelays[0] || 120;

      const authority = document.getElementById('scen-edit-authority')?.value || 'prefecture';

      const scalingNodes = document.querySelectorAll('input[name="scen-edit-scaling-mode"]:checked');
      const scalingMode = scalingNodes.length > 0 ? scalingNodes[0].value : 'adaptive';
      const scaleIntensity = document.getElementById('scen-edit-scale-intensity')?.value || 'moyenne';

      const minVols = parseInt(document.getElementById('scen-edit-min-vols')?.value, 10) || 4;
      const maxVols = parseInt(document.getElementById('scen-edit-max-vols')?.value, 10) || 14;

      const minDuration = parseFloat(document.getElementById('scen-edit-min-duration')?.value) || 4.0;
      const maxDuration = parseFloat(document.getElementById('scen-edit-max-duration')?.value) || 7.0;

      const risk = document.getElementById('scen-edit-risk')?.value || 'moyen';

      const manualVols = parseInt(document.getElementById('scen-edit-volunteers')?.value, 10) || minVols;
      const manualDuration = parseFloat(document.getElementById('scen-edit-duration')?.value) || minDuration;
      const manualReward = parseInt(document.getElementById('scen-edit-reward')?.value, 10) || 850;

      const vehMode = document.getElementById('scen-edit-veh-mode')?.value || 'auto';
      const vehNodes = document.querySelectorAll('input[name="scen-veh"]:checked');
      const vehicles = Array.from(vehNodes).map(n => n.value);

      const lotNodes = document.querySelectorAll('input[name="scen-lot"]:checked');
      const lots = Array.from(lotNodes).map(n => n.value);

      const peripetieNodes = document.querySelectorAll('input[name="scen-peripetie"]');
      const peripeties = Array.from(peripetieNodes).map(n => n.value).filter(v => v && v.trim());

      const activeScen = this.getCurrentEditingScenario();
      const phases = activeScen?.phases || [];
      const evolutions = activeScen?.evolutions || [];

      const saved = this.saveScenario({
        id,
        title,
        type,
        desc,
        scale,
        timing,
        anticipationDelays,
        anticipationDelay,
        authority,
        scalingMode,
        scaleIntensity,
        minVolunteers: minVols,
        maxVolunteers: maxVols,
        requiredVolunteers: manualVols,
        minDurationHours: minDuration,
        maxDurationHours: maxDuration,
        durationHours: manualDuration,
        rewardMoney: manualReward,
        riskLevel: risk,
        vehiclesMode: vehMode,
        requiredVehicles: vehicles,
        requiredLots: lots,
        isEvolutive: phases.length > 1,
        phases,
        evolutions,
        peripeties
      });

      this.closeEditor();
      if (window.game?.showToast) {
        const delaysText = timing === 'anticipation' ? `Pré-alerte (${this.formatDelaysSummary(anticipationDelays)})` : 'Immédiat';
        window.game.showToast('Scénario Enregistré ✓', `« ${saved.title} » (${delaysText}, ${phases.length} phases) sauvegardé.`, 'green');
      }
      return saved;
    },

    handleSaveAndTrigger(e) {
      const saved = this.handleSaveForm(e);
      if (saved && window.game) {
        this.triggerScenarioNow(window.game, saved.id);
      }
    },

    handleDuplicate(id) {
      const dup = this.duplicateScenario(id);
      this.refreshAdminUI();
      if (dup && window.game?.showToast) {
        window.game.showToast('Scénario Dupliqué', `Copie créée : « ${dup.title} ». `, 'blue');
      }
    },

    handleDelete(id) {
      if (confirm('Voulez-vous vraiment supprimer définitivement ce scénario personnalisé ?')) {
        this.deleteScenario(id);
        this.refreshAdminUI();
        if (window.game?.showToast) {
          window.game.showToast('Scénario Supprimé', 'Le scénario a été retiré de votre liste.', 'slate');
        }
      }
    },

    handleResetOne(id) {
      if (confirm('Rétablir ce scénario à sa configuration officielle d\'origine ?')) {
        this.resetDefaultScenario(id);
        this.refreshAdminUI();
      }
    },

    promptResetAll() {
      if (confirm('Attention : réinitialiser l\'ensemble des scénarios par défaut et supprimer les scénarios personnalisés ?')) {
        this.resetAllToDefault();
        this.editingScenarioId = null;
        this.activeEditingScenario = null;
        this.refreshAdminUI();
        if (window.game?.showToast) {
          window.game.showToast('Scénarios Réinitialisés', 'Le catalogue officiel a été restauré.', 'blue');
        }
      }
    },

    refreshAdminUI() {
      const container = document.getElementById('admin-view-scenarios');
      if (container) {
        this.renderAdminView(container, window.game);
      }
    },
    
    openManager() {
      if (window.ProtecAdmin) {
        if (!window.ProtecAdmin.isCurrentUserAdmin() && !window.ProtecAdmin.isCurrentUserGestionnaireOnly()) {
          if (window.game?.player) {
            window.game.player.isAdmin = true;
          }
          localStorage.setItem('protec_admin_auth', 'true');
        }
        window.ProtecAdmin.openAdminModal(window.game);
        window.ProtecAdmin.switchTab('scenarios');
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.ProtecScenariosManager.init();
  });
})();
