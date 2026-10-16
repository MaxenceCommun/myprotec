/**
 * PROTEC LIVE - MODULE CENTRAL D'ÉQUILIBRAGE GAMEPLAY & PARAMÈTRES ADMIN
 * Permet aux administrateurs de moduler en temps réel toutes les variables,
 * probabilités d'alertes, délais de réponse, ratios économiques et seuils d'humeur.
 */

(function() {
  const STORAGE_KEY = 'protec_gameplay_tuning_v1';

  // DÉFINITION EXHAUSTIVE DU SCHÉMA DES VARIABLES D'ÉQUILIBRAGE
  const CONFIG_SCHEMA = {
    // --- 1. DÉCLENCHEMENTS & ALERTES ALÉATOIRES ---
    criseChanceMultiplier: {
      category: 'alertes',
      label: 'Multiplicateur Crises & Plans NOVI',
      desc: 'Multiplie la probabilité de survenue des catastrophes majeures et plans d\'urgence.',
      type: 'number',
      min: 0,
      max: 10,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    sncfPrealertChance: {
      category: 'alertes',
      label: 'Chance Préalerte SNCF (Gares / Voies)',
      desc: 'Probabilité de déclenchement d\'une préalerte ferroviaire par cycle de veille.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.05,
      unit: '% (0-1)',
      default: 0.40
    },
    aascPrealertChance: {
      category: 'alertes',
      label: 'Chance Préalerte AASC Préfecture',
      desc: 'Probabilité de déclenchement d\'une veille d\'urgence AASC par cycle.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.05,
      unit: '% (0-1)',
      default: 0.35
    },
    samuEmergencyChance: {
      category: 'alertes',
      label: 'Fréquence Urgences SAMU 15 (Garde active)',
      desc: 'Probabilité de déclenchement d\'un départ réflexe SAMU 15 par tranche de garde.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.02,
      unit: '% (0-1)',
      default: 0.28
    },
    sdisEmergencyChanceNormal: {
      category: 'alertes',
      label: 'Fréquence Départs SDIS Caserne (Calme)',
      desc: 'Probabilité de réquisition pompiers en période ordinaire.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.02,
      unit: '% (0-1)',
      default: 0.20
    },
    sdisEmergencyChanceHigh: {
      category: 'alertes',
      label: 'Fréquence Départs SDIS Caserne (Tension / Fête)',
      desc: 'Probabilité de réquisition pompiers lors des tensions urbaines ou festivités.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.05,
      unit: '% (0-1)',
      default: 0.35
    },
    cumpAlertChance: {
      category: 'alertes',
      label: 'Fréquence Ordres de Mission CAI / CUMP',
      desc: 'Probabilité d\'activation du Centre d\'Accueil des Impliqués et de la cellule médico-psychologique.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.05,
      unit: '% (0-1)',
      default: 0.35
    },
    incidentMissionRate: {
      category: 'alertes',
      label: 'Fréquence Incidents Aléatoires en Mission',
      desc: 'Rythme d\'apparition des aléas sur le terrain (malaise spectateur, blessure, détresse...).',
      type: 'number',
      min: 0,
      max: 5.0,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },

    // --- 2. DEMANDES DE DPS & DEVIS PAR TAILLE (PAPS, PE, ME, GE) ---
    dpsRequestBaseChanceMultiplier: {
      category: 'dps',
      label: 'Fréquence Générale des Demandes de DPS',
      desc: 'Multiplicateur appliqué au flux des demandes de devis reçues par l\'antenne.',
      type: 'number',
      min: 0,
      max: 10,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    papsWeight: {
      category: 'dps',
      label: 'Pondération PAPS (Point d\'Alerte & Secours 2-3 sec.)',
      desc: 'Part relative des sollicitations de petite envergure (kermesses, cross, tournois scolaires).',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.2,
      unit: 'ratio',
      default: 1.0
    },
    dpsPeWeight: {
      category: 'dps',
      label: 'Pondération DPS-PE (Petite Envergure 4-6 sec. + VPSP)',
      desc: 'Part relative des dispositifs opérationnels courants (trails, concerts, galas).',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.2,
      unit: 'ratio',
      default: 1.0
    },
    dpsMeWeight: {
      category: 'dps',
      label: 'Pondération DPS-ME (Moyenne Envergure 8-10 sec. + 2 VPSP)',
      desc: 'Part relative des rassemblements majeurs (festivals, marathons, arènes).',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.2,
      unit: 'ratio',
      default: 1.0
    },
    dpsGeWeight: {
      category: 'dps',
      label: 'Pondération DPS-GE (Grande Envergure 12-24 sec. + PMA)',
      desc: 'Part relative des très grands dispositifs fédéraux et inter-antennes.',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.2,
      unit: 'ratio',
      default: 1.0
    },
    dpsLastMinuteChance: {
      category: 'dps',
      label: 'Proportion Devis Dernière Minute (Urgence H-24/H-48)',
      desc: 'Part des demandes organisateurs reçues au dernier moment avec délai serré.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.05,
      unit: '% (0-1)',
      default: 0.25
    },
    maxSimultaneousPendingDevis: {
      category: 'dps',
      label: 'Plafond Devis en Attente Simultanés',
      desc: 'Nombre maximal de demandes d\'organisateurs pouvant stagner au tableau de bord sans réponse.',
      type: 'number',
      min: 1,
      max: 30,
      step: 1,
      unit: 'devis',
      default: 6
    },

    // --- 3. DEMANDES DE FORMATIONS (GQS, PSC, SST, PSE1, PSE2) ---
    formationDemandGQS: {
      category: 'formations',
      label: 'Demandes GQS (Gestes Qui Sauvent)',
      desc: 'Fréquence des demandes de sensibilisation express (collèges, mairies, associations).',
      type: 'number',
      min: 0,
      max: 5,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    formationDemandPSC: {
      category: 'formations',
      label: 'Demandes PSC (Secourisme Citoyen)',
      desc: 'Flux citoyen et sessions de groupe pour le diplôme de base de secourisme.',
      type: 'number',
      min: 0,
      max: 5,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    formationDemandSST: {
      category: 'formations',
      label: 'Demandes SST (Sauveteur Secouriste Travail B2B)',
      desc: 'Sollicitations d\'entreprises pour la formation de leurs salariés (très rémunérateur).',
      type: 'number',
      min: 0,
      max: 5,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    formationDemandPSE1: {
      category: 'formations',
      label: 'Demandes PSE1 (Secouriste d\'Équipe)',
      desc: 'Candidats externes ou associatifs souhaitant acquérir la qualification PSE1.',
      type: 'number',
      min: 0,
      max: 5,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    formationDemandPSE2: {
      category: 'formations',
      label: 'Demandes PSE2 (Équipier Secouriste)',
      desc: 'Inscriptions aux modules d\'équipier secouriste complet et brancardage lourd.',
      type: 'number',
      min: 0,
      max: 5,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    formationCitizenRegistrationSpeed: {
      category: 'formations',
      label: 'Vitesse de Remplissage Citoyen des Sessions',
      desc: 'Rythme auquel le grand public achète des places sur les sessions programmées.',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.2,
      unit: 'x',
      default: 1.0
    },

    // --- 4. RECRUTEMENT & CANDIDATURES ---
    candidatureChanceMultiplier: {
      category: 'recrutement',
      label: 'Flux de Candidatures Spontanées',
      desc: 'Multiplicateur général d\'arrivée de nouveaux postulants bénévoles à l\'antenne.',
      type: 'number',
      min: 0,
      max: 10,
      step: 0.2,
      unit: 'x',
      default: 1.0
    },
    candidatureSocialCampaignBoost: {
      category: 'recrutement',
      label: 'Impact Campagne Réseaux Sociaux (Instagram/TikTok)',
      desc: 'Bonus d\'attractivité généré par semaine de campagne active sur les réseaux.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.02,
      unit: '% proba',
      default: 0.20
    },
    candidaturePostersCampaignBoost: {
      category: 'recrutement',
      label: 'Impact Affichage Municipal & Panneaux Mairie',
      desc: 'Bonus d\'attractivité généré auprès des profils actifs et soignants.',
      type: 'number',
      min: 0,
      max: 1.0,
      step: 0.02,
      unit: '% proba',
      default: 0.12
    },
    candidatureMaxWaitingDays: {
      category: 'recrutement',
      label: 'Patience des Candidats (Jours avant Démotivation)',
      desc: 'Délai d\'attente toléré avant qu\'un candidat bénévole perde patience et baisse sa note.',
      type: 'number',
      min: 1,
      max: 14,
      step: 1,
      unit: 'jours',
      default: 2
    },

    // --- 5. DÉLAIS DE RÉPONSE & MOBILISATION DES BÉNÉVOLES ---
    smsResponseDelayMultiplier: {
      category: 'mobilisation',
      label: 'Multiplicateur de Délai de Réponse SMS',
      desc: '0.5 = réponses 2x plus rapides • 2.0 = réponses 2x plus lentes • 0 = immédiat.',
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    urgentResponseMinSec: {
      category: 'mobilisation',
      label: 'Délai Réponse Min Urgence Réflexe',
      desc: 'Temps minimum avant qu\'un bénévole en alerte ne confirme sa disponibilité.',
      type: 'number',
      min: 1,
      max: 30,
      step: 1,
      unit: 'sec',
      default: 3
    },
    urgentResponseMaxSec: {
      category: 'mobilisation',
      label: 'Délai Réponse Max Urgence Réflexe',
      desc: 'Temps maximum avant confirmation pour les premiers secouristes réactifs.',
      type: 'number',
      min: 3,
      max: 60,
      step: 1,
      unit: 'sec',
      default: 8
    },
    dpsResponseMinSec: {
      category: 'mobilisation',
      label: 'Délai Réponse Min Poste DPS Programmé',
      desc: 'Temps minimum pour une confirmation de poste non urgent.',
      type: 'number',
      min: 2,
      max: 30,
      step: 1,
      unit: 'sec',
      default: 4
    },
    dpsResponseMaxSec: {
      category: 'mobilisation',
      label: 'Délai Réponse Max Poste DPS Programmé',
      desc: 'Temps maximum pour une confirmation de poste non urgent.',
      type: 'number',
      min: 5,
      max: 90,
      step: 1,
      unit: 'sec',
      default: 12
    },
    maraudeResponseDelaySec: {
      category: 'mobilisation',
      label: 'Délai Réponse Mission Sociale / Maraude',
      desc: 'Cadence de réponse des bénévoles engagés sur le pôle social.',
      type: 'number',
      min: 2,
      max: 60,
      step: 1,
      unit: 'sec',
      default: 6
    },
    astreinteMobilisationSpeed: {
      category: 'mobilisation',
      label: 'Vitesse de Ralliement de l\'Astreinte (Préalerte)',
      desc: 'Accélère ou ralentit l\'arrivée des secouristes pré-alertés à la base.',
      type: 'number',
      min: 0.2,
      max: 5.0,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },

    // --- 6. ÉCONOMIE, TARIFS & INDEMNITÉS (GAINS & PERTES) ---
    moneyRewardMultiplier: {
      category: 'economie',
      label: 'Multiplicateur Global des Rémunérations',
      desc: 'Multiplie l\'ensemble des revenus de missions, devis validés et gardes.',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    dpsHourlyRatePerVol: {
      category: 'economie',
      label: 'Tarif Horaire Devis par Secouriste',
      desc: 'Base tarifaire conventionnée facturée à l\'organisateur par secouriste par heure.',
      type: 'number',
      min: 5,
      max: 60,
      step: 1,
      unit: '€ / h',
      default: 15
    },
    samuIndemnityPerHour: {
      category: 'economie',
      label: 'Indemnité Horaire Garde SAMU 15',
      desc: 'Tarif horaire reversé par l\'Agence Régionale de Santé (ARS) pour l\'équipage VPSP.',
      type: 'number',
      min: 10,
      max: 120,
      step: 5,
      unit: '€ / h',
      default: 35
    },
    sdisIndemnityPerHour: {
      category: 'economie',
      label: 'Indemnité Vacation SDIS Pompiers',
      desc: 'Tarif horaire reversé par le Service Départemental d\'Incendie et de Secours.',
      type: 'number',
      min: 10,
      max: 120,
      step: 5,
      unit: '€ / h',
      default: 40
    },
    mealAllowancePerVolunteer: {
      category: 'economie',
      label: 'Forfait Note de Frais Repas Bénévole',
      desc: 'Coût déboursé par l\'antenne à 12h00 et 19h00 si le repas n\'est pas offert par l\'orga.',
      type: 'number',
      min: 0,
      max: 40,
      step: 1,
      unit: '€ / bénévole',
      default: 15
    },
    vehicleMaintenanceCostMultiplier: {
      category: 'economie',
      label: 'Coût Entretien Garage & Contrôle Technique',
      desc: 'Multiplicateur des dépenses périodiques de révision et réparations mécaniques.',
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },

    // --- 7. RÉPUTATION & NOTORIÉTÉ ---
    reputationGainMultiplier: {
      category: 'reputation',
      label: 'Multiplicateur Gains de Réputation',
      desc: 'Augmente ou réduit les points de notoriété acquis après un dispositif réussi.',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.2,
      unit: 'x',
      default: 1.0
    },
    reputationLossMultiplier: {
      category: 'reputation',
      label: 'Multiplicateur Pertes de Réputation',
      desc: 'Sévérité de la baisse de notoriété en cas de refus, carence ou retard de départ.',
      type: 'number',
      min: 0.1,
      max: 10,
      step: 0.2,
      unit: 'x',
      default: 1.0
    },
    prefectureSanctionBasePoints: {
      category: 'reputation',
      label: 'Pénalité Sanction Préfecture (Retard Réquisition)',
      desc: 'Points de réputation immédiatement retirés par arrêté préfectoral en cas de carence.',
      type: 'number',
      min: 1,
      max: 60,
      step: 1,
      unit: 'pts',
      default: 18
    },

    // --- 8. HUMEUR, MORAL & FATIGUE DES BÉNÉVOLES ---
    fatigueAccumulationRate: {
      category: 'humeur',
      label: 'Vitesse de Montée de la Fatigue en Mission',
      desc: 'Multiplicateur de fatigue physique infligée aux équipiers par heure d\'intervention.',
      type: 'number',
      min: 0.1,
      max: 5.0,
      step: 0.1,
      unit: 'x',
      default: 1.0
    },
    moralGainOnSuccess: {
      category: 'humeur',
      label: 'Gain de Moral Mission Réussie',
      desc: 'Points de moral et de motivation attribués à chaque participant après réussite.',
      type: 'number',
      min: 1,
      max: 30,
      step: 1,
      unit: 'pts',
      default: 8
    },
    moralLossOnFailure: {
      category: 'humeur',
      label: 'Perte de Moral en Cas d\'Incident / Surcharge',
      desc: 'Points de moral perdus en cas de conditions dégradées ou de surmenage.',
      type: 'number',
      min: 1,
      max: 50,
      step: 1,
      unit: 'pts',
      default: 15
    },
    cohesionEventMoralBoost: {
      category: 'humeur',
      label: 'Boost Moral Moment de Cohésion',
      desc: 'Moral immédiat restauré à l\'ensemble de l\'antenne lors d\'une fête/repas de cohésion.',
      type: 'number',
      min: 5,
      max: 60,
      step: 5,
      unit: 'pts',
      default: 30
    },
    cohesionEventFatigueReduction: {
      category: 'humeur',
      label: 'Récupération Fatigue Moment de Cohésion',
      desc: 'Pourcentage de fatigue effacée pour chaque secouriste lors de l\'événement.',
      type: 'number',
      min: 5,
      max: 80,
      step: 5,
      unit: '%',
      default: 25
    }
  };

  const CONFIG_CATEGORIES = {
    alertes: { label: 'Alertes & Départs', icon: '🚨' },
    dps: { label: 'DPS & Devis', icon: '📋' },
    formations: { label: 'Formations B2B', icon: '🎓' },
    recrutement: { label: 'Recrutement', icon: '👥' },
    mobilisation: { label: 'Délais & Réponse', icon: '⏱️' },
    economie: { label: 'Économie & Finances', icon: '💶' },
    reputation: { label: 'Réputation & Notoriété', icon: '⭐' },
    humeur: { label: 'Humeur & Moral', icon: '❤️' }
  };

  // OBJET DE GESTION DU GAMEPLAY CONFIG
  window.ProtecGameplayConfig = {
    schema: CONFIG_SCHEMA,
    SCHEMA: CONFIG_SCHEMA,
    categories: CONFIG_CATEGORIES,
    CATEGORIES: CONFIG_CATEGORIES,
    values: {},

    getAll() {
      const result = {};
      Object.keys(CONFIG_SCHEMA).forEach(k => {
        result[k] = this.get(k);
      });
      return result;
    },

    init() {
      this.resetToDefaults(false);
      this.load();
    },

    get(key, fallback = null) {
      if (this.values && this.values[key] !== undefined) {
        return this.values[key];
      }
      if (CONFIG_SCHEMA[key] && CONFIG_SCHEMA[key].default !== undefined) {
        return CONFIG_SCHEMA[key].default;
      }
      return fallback;
    },

    set(key, val) {
      if (CONFIG_SCHEMA[key]) {
        const num = parseFloat(val);
        this.values[key] = isNaN(num) ? val : num;
      }
    },

    resetToDefaults(save = true) {
      this.values = {};
      Object.keys(CONFIG_SCHEMA).forEach(k => {
        this.values[k] = CONFIG_SCHEMA[k].default;
      });
      if (save) {
        this.save();
      }
    },

    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(k => {
              if (CONFIG_SCHEMA[k]) {
                this.values[k] = parsed[k];
              }
            });
          }
        }
      } catch (e) {
        console.warn('[ProtecGameplayConfig] Erreur lecture tuning localStorage:', e);
      }
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values));
      } catch (e) {
        console.warn('[ProtecGameplayConfig] Erreur écriture tuning localStorage:', e);
      }
    },

    exportJSON() {
      return JSON.stringify(this.values, null, 2);
    },

    importJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed === 'object') {
          Object.keys(parsed).forEach(k => {
            if (CONFIG_SCHEMA[k]) {
              this.values[k] = parsed[k];
            }
          });
          this.save();
          return { success: true };
        }
        return { success: false, error: 'Format JSON invalide' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },

    // Applique immédiatement les paramètres en direct sur l'instance active du jeu
    applyLive(game) {
      this.save();
      if (!game) return;

      // 1. Mise à jour des coûts paramétrés
      game.mealAllowancePerVolunteer = this.get('mealAllowancePerVolunteer', 15);

      // 2. Mise à jour de l'interface
      if (typeof game.updateStatsUI === 'function') {
        game.updateStatsUI();
      }

      if (typeof game.showToast === 'function') {
        game.showToast(
          '⚙️ Équilibrage Gameplay Appliqué',
          'Tous les paramètres et probabilités modifiés sont immédiatement actifs en jeu !',
          'green'
        );
      }
    },

    // --- OUTILS DE TEST & DÉCLENCHEMENT FORCÉ IMMÉDIAT ---
    forceSamuEmergency(game) {
      if (!game) return;
      if (typeof game.triggerRandomSamuEmergency === 'function') {
        // Bypass temporaire si la convention ou la garde n'était pas armée
        const prevConv = game.samuConvention?.signed;
        const prevGarde = game.samuGarde?.active;
        if (!game.samuConvention) game.samuConvention = { signed: true };
        game.samuConvention.signed = true;
        if (!game.samuGarde) game.samuGarde = { active: true, vehicleId: game.vehicles?.find(v => v.type === 'VPSP')?.id || 'v1' };
        game.samuGarde.active = true;

        game.triggerRandomSamuEmergency();

        if (typeof game.showToast === 'function') {
          game.showToast('⚡ Test Forcé SAMU 15', 'Une urgence SAMU 15 a été générée immédiatement pour votre test.', 'blue');
        }
      }
    },

    forceSdisEmergency(game) {
      if (!game) return;
      if (typeof game.triggerRandomSdisEmergency === 'function') {
        if (!game.sdisConvention) game.sdisConvention = { signed: true };
        game.sdisConvention.signed = true;
        if (!game.sdisGarde) game.sdisGarde = { active: true, mode: 'caserne' };
        game.sdisGarde.active = true;

        game.triggerRandomSdisEmergency();

        if (typeof game.showToast === 'function') {
          game.showToast('⚡ Test Forcé SDIS Pompiers', 'Un départ réquisition pompiers a été déclenché immédiatement.', 'red');
        }
      }
    },

    forceSncfAlert(game) {
      if (!game) return;
      if (typeof game.triggerSncfPrealert === 'function') {
        if (!game.sncfConvention) game.sncfConvention = { signed: true };
        game.sncfConvention.signed = true;
        game.triggerSncfPrealert();
      } else if (typeof game.triggerAascPrealert === 'function') {
        game.triggerAascPrealert();
      }
      if (typeof game.showToast === 'function') {
        game.showToast('⚡ Test Forcé SNCF', 'Une alerte / préalerte ferroviaire SNCF a été lancée sur la carte.', 'indigo');
      }
    },

    forceAascPrealert(game) {
      if (!game) return;
      if (typeof game.triggerAascPrealert === 'function') {
        game.triggerAascPrealert();
        if (typeof game.showToast === 'function') {
          game.showToast('⚡ Test Forcé AASC', 'Une préalerte institutionnelle AASC (Préfecture / SAMU) a été déclenchée.', 'amber');
        }
      }
    },

    forceCrisis(game) {
      if (!game) return;
      if (window.ProtecAdmin && typeof window.ProtecAdmin.triggerScenarioTest === 'function') {
        window.ProtecAdmin.triggerScenarioTest(game, 'plan_novi');
      } else if (typeof game.triggerCrisisScenario === 'function') {
        game.triggerCrisisScenario('novi');
      } else if (typeof game.triggerAascPrealert === 'function') {
        game.triggerAascPrealert();
      }
      if (typeof game.showToast === 'function') {
        game.showToast('⚡ Test Forcé Crise / NOVI', 'Scénario de crise majeure déclenché.', 'red');
      }
    },

    forceCandidature(game) {
      if (!game) return;
      if (typeof game.generateRandomCandidature === 'function') {
        game.generateRandomCandidature();
        game.showCandidaturesView = true;
        if (typeof game.openModule === 'function' && game.currentModalKey === 'recrutement') {
          game.openModule('recrutement', true);
        }
        if (typeof game.showToast === 'function') {
          game.showToast('⚡ Test Forcé Candidat', 'Un nouveau candidat bénévole a postulé à l\'antenne !', 'green');
        }
      }
    },

    forceDevis(game, requestedScale = 'PAPS') {
      if (!game) return;
      if (typeof game.generateRandomDevisOpportunity === 'function') {
        // Enregistrer temporairement l'échelle demandée
        this._forcedScale = requestedScale;
        game.generateRandomDevisOpportunity();
        this._forcedScale = null;
        if (typeof game.showToast === 'function') {
          game.showToast('⚡ Test Forcé DPS', `Demande de devis (${requestedScale}) générée pour vos tests.`, 'blue');
        }
      }
    },

    forceFormationDemand(game, formType = 'PSC') {
      if (!game) return;
      if (window.ProtecFormations && typeof window.ProtecFormations.generateB2BOpportunities === 'function') {
        window.ProtecFormations.generateB2BOpportunities(game, true);
        if (typeof game.showToast === 'function') {
          game.showToast('⚡ Test Forcé Formation', `Demande de formation (${formType}) générée.`, 'purple');
        }
      }
    }
  };

  // Initialisation immédiate au chargement du script
  window.ProtecGameplayConfig.init();
})();
