/**
 * PROTEC LIVE - GESTION COMPLÈTE DES LOCAUX, ARCHITECTURE 2D & SÉCURITÉ DU BÂTIMENT
 * 
 * 1. Plan d'Architecte 2D Réaliste :
 *    - Murs porteurs extérieurs et cloisons intérieures dynamiques
 *    - Portes réelles (porte principale vitrée, portes intérieures à débattement, portes sectionnelles de garage)
 *    - Fenêtres extérieures
 *    - Mobilier & agencements d'architecte en vue de dessus ultra-détaillée (SVG vectoriel)
 *      (Bureaux, tableaux de formation, mannequins RCP, étagères industrielles, ambulances VPSP, lits de garde, canapés foyer)
 * 
 * 2. Statut Juridique : Location (Bail communal) vs Propriétaire (Pleine propriété)
 *    - En Location : Réaménagement de cloisons interdit par le bailleur !
 *    - Rachat des murs possible pour devenir propriétaire.
 *    - Travaux d'aménagement : Coût en € et DÉLAI DE CHANTIER RÉEL avec compte à rebours et ouvriers.
 * 
 * 3. Matériel de Sécurité pour Protéger les Locaux :
 *    - Alarme télésurveillée 24/7, Vidéosurveillance HD 4K, Contrôle d'accès RFID, Rideaux métalliques motorisés,
 *      Projecteurs LED à détection, Armoire forte / coffre scellé, Clôture rigide 2m & portail motorisé.
 * 
 * 4. Événements Réalistes de Sécurité :
 *    - Vols de DAE / matériel médical, Vandalisme et tags, Siphonage de carburant sur les VPSP, Intrusions.
 *    - Déjoués et mis en fuite si l'antenne est équipée, sinon dégâts et préjudice financier.
 */

window.ProtecLocaux = {
  activeTab: 'plan', // 'plan' | 'securite' | 'catalogue' | 'construction' | 'stock'
  selectedTool: 'formation', // outil actif dans l'éditeur 2D
  isEditing: false, // mode modification de cloisons actif
  viewMode: 'furnished', // 'furnished' (meublé réaliste) | 'blueprint' (bleu technique d'architecte)
  selectedTileDetail: null, // index de la pièce affichée en détail

  // Définition des types de pièces et caractéristiques
  ZONE_TYPES: {
    bureau: {
      id: 'bureau',
      name: 'Bureau & Direction',
      icon: '💼',
      bgClass: 'bg-indigo-50 border-indigo-300',
      textClass: 'text-indigo-900',
      blueprintClass: 'bg-blue-950/80 border-blue-400 text-blue-200',
      lightBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Accueil du public, secrétariat, planification opérationnelle et direction de l’antenne.',
      costPerTile: 550,
      workDurationSec: 150, // 2 min 30
      perTileStats: { adminBonus: 10 }
    },
    formation: {
      id: 'formation',
      name: 'Salle de Formation',
      icon: '🎓',
      bgClass: 'bg-amber-50/70 border-amber-300',
      textClass: 'text-amber-950',
      blueprintClass: 'bg-blue-950/80 border-blue-400 text-blue-200',
      lightBg: 'bg-blue-50 text-pc-blue border-blue-200',
      desc: 'Accueille les sessions grand public (PSC1, SST, GQS) et les recyclages des bénévoles.',
      costPerTile: 750,
      workDurationSec: 180, // 3 min
      perTileStats: { studentCapacity: 6 }
    },
    stockage: {
      id: 'stockage',
      name: 'Stockage & Réserve',
      icon: '📦',
      bgClass: 'bg-slate-100 border-slate-300',
      textClass: 'text-slate-900',
      blueprintClass: 'bg-blue-950/80 border-blue-400 text-blue-200',
      lightBg: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Stockage sécurisé des lots de secours (Lots A/B/C), bouteilles d’oxygène B5 et dons sociaux.',
      costPerTile: 500,
      workDurationSec: 140, // 2 min 20
      perTileStats: { storageCapacity: 50 }
    },
    garage: {
      id: 'garage',
      name: 'Hangar & Garage VPSP',
      icon: '🚒',
      bgClass: 'bg-slate-200/90 border-slate-400',
      textClass: 'text-slate-950',
      blueprintClass: 'bg-blue-950/80 border-blue-400 text-blue-200',
      lightBg: 'bg-red-50 text-red-700 border-red-200',
      desc: 'Travées abritées avec maintien de charge 230V et accès direct voie publique.',
      costPerTile: 950,
      workDurationSec: 240, // 4 min
      perTileStats: { vehicleCapacity: 1 }
    },
    detente: {
      id: 'detente',
      name: 'Foyer & Détente',
      icon: '☕',
      bgClass: 'bg-emerald-50/70 border-emerald-300',
      textClass: 'text-emerald-950',
      blueprintClass: 'bg-blue-950/80 border-blue-400 text-blue-200',
      lightBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'Espace de vie convivial des secouristes, canapés et kitchenette. Régénère l’énergie.',
      costPerTile: 600,
      workDurationSec: 160,
      perTileStats: { energyRegenPercent: 15, moralBonus: 5 }
    },
    dortoir: {
      id: 'dortoir',
      name: 'Dortoir de Garde',
      icon: '🛏️',
      bgClass: 'bg-purple-50/70 border-purple-300',
      textClass: 'text-purple-950',
      blueprintClass: 'bg-blue-950/80 border-blue-400 text-blue-200',
      lightBg: 'bg-purple-50 text-purple-700 border-purple-200',
      desc: 'Lits insonorisés pour équipages d’astreinte 24h SAMU 15 et déclenchements de nuit.',
      costPerTile: 700,
      workDurationSec: 180,
      perTileStats: { nightBeds: 2, reflexeSpeed: 10 }
    },
    vestiaires: {
      id: 'vestiaires',
      name: 'Vestiaires & Douches',
      icon: '🚿',
      bgClass: 'bg-cyan-50/70 border-cyan-300',
      textClass: 'text-cyan-950',
      blueprintClass: 'bg-blue-950/80 border-blue-400 text-blue-200',
      lightBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      desc: 'Casiers tenues opérationnelles (pantalons et parkas F1/Protec) et sanitaires.',
      costPerTile: 600,
      workDurationSec: 160,
      perTileStats: { hygieneBonus: 10 }
    },
    vide: {
      id: 'vide',
      name: 'Dégagement / Couloir',
      icon: '⬜',
      bgClass: 'bg-slate-50 border-slate-200',
      textClass: 'text-slate-600',
      blueprintClass: 'bg-blue-950/60 border-blue-500/50 text-blue-300',
      lightBg: 'bg-slate-100 text-slate-500 border-slate-200',
      desc: 'Couloir de circulation et issue de secours avec bloc d’éclairage BAES.',
      costPerTile: 200,
      workDurationSec: 60,
      perTileStats: {}
    }
  },

  // 3 Dispositions de "Petits Locaux" (grille 4x4, 16 cases = 400 m²)
  STARTER_LAYOUTS: [
    {
      id: 'starter_standard',
      name: 'Le Polyvalent Républicain',
      badge: 'Recommandé Débutant',
      badgeColor: 'bg-pc-blue text-white',
      desc: 'Équilibre parfait pour débuter : un bureau d’accueil, une salle de formation PSC1, une réserve pour les collectes, un foyer chaleureux et un garage 2 places.',
      icon: '⚖️',
      width: 4,
      height: 4,
      surfaceM2: 400,
      tenure: 'rented',
      grid: [
        'bureau', 'bureau', 'formation', 'formation',
        'vestiaires', 'detente', 'detente', 'stockage',
        'garage', 'garage', 'stockage', 'stockage',
        'garage', 'garage', 'stockage', 'stockage'
      ]
    },
    {
      id: 'starter_operationnel',
      name: 'La Base Opérationnelle & Urgences',
      badge: 'Focus Interventions & SAMU',
      badgeColor: 'bg-red-600 text-white',
      desc: 'Dédiée aux interventions terrain : grand hangar 4 véhicules, vaste zone de stockage pour collectes et lots d’urgence, dortoir de garde. (Pas de formation au départ).',
      icon: '🚨',
      width: 4,
      height: 4,
      surfaceM2: 400,
      tenure: 'rented',
      grid: [
        'bureau', 'dortoir', 'dortoir', 'stockage',
        'vestiaires', 'detente', 'stockage', 'stockage',
        'garage', 'garage', 'garage', 'garage',
        'garage', 'garage', 'garage', 'garage'
      ]
    },
    {
      id: 'starter_formation',
      name: 'L’Institut Pédagogique & Citoyen',
      badge: 'Focus Formations & Revenus',
      badgeColor: 'bg-emerald-600 text-white',
      desc: 'Optimisé pour les cours grand public payants (PSC1, SST, GQS) : deux grandes salles de formation, vastes bureaux et accueil, foyer convivial.',
      icon: '🎓',
      width: 4,
      height: 4,
      surfaceM2: 400,
      tenure: 'rented',
      grid: [
        'bureau', 'bureau', 'formation', 'formation',
        'bureau', 'vestiaires', 'formation', 'formation',
        'detente', 'detente', 'formation', 'formation',
        'garage', 'garage', 'stockage', 'stockage'
      ]
    }
  ],

  // Catalogue de Bâtiments existants à l'achat (Pleine Propriété)
  CATALOG_BUILDINGS: [
    {
      id: 'building_medium',
      name: 'Entrepôt d’Activités Rénové',
      type: 'Pleine Propriété',
      price: 120000,
      surfaceM2: 750,
      width: 6,
      height: 5,
      desc: 'Bâtiment spacieux acquis en pleine propriété, idéal pour doubler la flotte et multiplier les capacités de stockage et de formation.',
      icon: '🏢',
      tenure: 'owned',
      grid: [
        'bureau', 'bureau', 'bureau', 'formation', 'formation', 'formation',
        'vestiaires', 'detente', 'detente', 'formation', 'formation', 'formation',
        'dortoir', 'dortoir', 'stockage', 'stockage', 'stockage', 'stockage',
        'garage', 'garage', 'garage', 'stockage', 'stockage', 'stockage',
        'garage', 'garage', 'garage', 'garage', 'garage', 'garage'
      ]
    },
    {
      id: 'building_large',
      name: 'Grand Complexe Sécurité Civile',
      type: 'Pleine Propriété',
      price: 350000,
      surfaceM2: 1200,
      width: 8,
      height: 6,
      desc: 'Complexe ultramoderne de référence départementale : baie radio intégrée, immense hangar 8 places, 4 salles de cours et dortoirs complets.',
      icon: '🏛️',
      tenure: 'owned',
      grid: [
        'bureau', 'bureau', 'bureau', 'bureau', 'formation', 'formation', 'formation', 'formation',
        'bureau', 'vestiaires', 'vestiaires', 'detente', 'formation', 'formation', 'formation', 'formation',
        'dortoir', 'dortoir', 'detente', 'detente', 'stockage', 'stockage', 'stockage', 'stockage',
        'dortoir', 'dortoir', 'stockage', 'stockage', 'stockage', 'stockage', 'stockage', 'stockage',
        'garage', 'garage', 'garage', 'garage', 'garage', 'garage', 'garage', 'garage',
        'garage', 'garage', 'garage', 'garage', 'garage', 'garage', 'garage', 'garage'
      ]
    }
  ],

  // Catalogue de Matériel de Sécurité pour protéger les locaux
  SECURITY_CATALOG: [
    {
      id: 'alarm_system',
      name: 'Alarme Anti-Intrusion Télésurveillée 24/7',
      price: 2200,
      securityPoints: 30,
      icon: 'bell-ring',
      category: 'Détection & Alerte',
      desc: 'Centrale IP/GSM certifiée NFA2P, détecteurs volumétriques infrarouges, sirène extérieure flash 110 dB et liaison directe avec un centre de télésurveillance agréé.',
      bonus: 'Fait fuir les cambrioleurs dès l’effraction et prévient la gendarmerie / astreinte sans délai.'
    },
    {
      id: 'cctv_system',
      name: 'Vidéosurveillance HD 4K avec Vision Nocturne',
      price: 1800,
      securityPoints: 25,
      icon: 'camera',
      category: 'Surveillance & Preuve',
      desc: '4 caméras dôme extérieures motorisées et 2 intérieures (hangar et réserve de matériel) avec enregistreur NVR 30 jours et consultation live.',
      bonus: 'Dissuade les rôdeurs, enregistre les plaques d’immatriculation et identifie les auteurs.'
    },
    {
      id: 'rfid_access',
      name: 'Contrôle d’Accès Badges RFID & Serrures A2P***',
      price: 1400,
      securityPoints: 20,
      icon: 'key-round',
      category: 'Contrôle d’Accès',
      desc: 'Lecteurs de badges électroniques sécurisés sans contact à l’entrée principale et à la réserve de matériel. Fermeture automatique et traçabilité des passages.',
      bonus: 'Empêche l’ouverture forcée et protège l’accès aux stocks sensibles et dossiers.'
    },
    {
      id: 'roller_shutters',
      name: 'Rideaux Métalliques Motorisés pour Garages',
      price: 2800,
      securityPoints: 25,
      icon: 'shield-check',
      category: 'Blindage Flotte',
      desc: 'Lames pleines blindées en acier galvanisé retardatrices d’effraction pour les baies de véhicules VPSP. Commande électrique et arrêt automatique.',
      bonus: 'Protège la flotte contre le siphonage nocturne de carburant, les intrusions et les dégradations.'
    },
    {
      id: 'floodlights',
      name: 'Projecteurs Extérieurs LED Détecteur Présence',
      price: 650,
      securityPoints: 10,
      icon: 'sun',
      category: 'Dissuasion Nocturne',
      desc: 'Éclairage puissant 5 000 lm à détection hyperfréquence balayant la cour, le parking et les accès dès qu’une personne s’approche.',
      bonus: 'Effet dissuasif immédiat sur les tagueurs et rôdeurs nocturnes.'
    },
    {
      id: 'safe_box',
      name: 'Armoire Forte Blindée & Coffre Médical Scellé',
      price: 1100,
      securityPoints: 15,
      icon: 'lock',
      category: 'Stockage Sensible',
      desc: 'Coffre-fort haute sécurité fixé au sol et au mur porteur dans la réserve pour abriter les DAE de rechange, trousses d’urgence, registres et fond de caisse.',
      bonus: 'Rend le vol de matériel médical de haute valeur quasiment impossible.'
    },
    {
      id: 'perimeter_fence',
      name: 'Clôture Rigide 2m & Portail Motorisé Sécurisé',
      price: 3500,
      securityPoints: 25,
      icon: 'fence',
      category: 'Périmètre & Cour',
      desc: 'Clôture grillagée rigide anti-franchissement avec occultation totale et portail motorisé coulissant télécommandé pour sécuriser la cour d’antenne.',
      bonus: 'Empêche l’accès à la cour des véhicules et sécurise le périmètre.'
    }
  ],

  // Récupère ou initialise la structure de locaux d'une antenne
  getStationPremises(game, stationId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return null;

    if (!station.premises) {
      station.premises = null;
    } else {
      // Rétrocompatibilité : initialiser tenure et sécurité si absents
      if (!station.premises.tenure) {
        station.premises.tenure = (station.premises.buildingId && station.premises.buildingId.startsWith('building_')) ? 'owned' : (station.premises.customBuilt ? 'owned' : 'rented');
      }
      if (!station.premises.securityEquipments) {
        station.premises.securityEquipments = [];
      }
      if (!station.premises.ongoingWorks) {
        station.premises.ongoingWorks = [];
      }
      if (!station.premises.securityLogs) {
        station.premises.securityLogs = [];
      }
      if (!station.premises.buyoutPrice) {
        station.premises.buyoutPrice = 45000;
      }
    }
    return station.premises;
  },

  // Affecter un layout prédéfini à une antenne
  applyLayout(game, stationId, layout) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;

    station.premises = {
      buildingId: layout.id,
      name: layout.name,
      width: layout.width,
      height: layout.height,
      surfaceM2: layout.surfaceM2 || (layout.width * layout.height * 25),
      grid: [...layout.grid],
      customBuilt: !!layout.customBuilt,
      tenure: layout.tenure || 'rented',
      monthlyRent: layout.tenure === 'owned' ? 0 : 280,
      buyoutPrice: layout.surfaceM2 ? Math.round(layout.surfaceM2 * 112.5) : 45000,
      securityEquipments: [],
      ongoingWorks: [],
      securityLogs: [
        {
          timestamp: Date.now(),
          type: 'info',
          title: 'Installation des Locaux',
          message: `L'antenne a pris possession de « ${layout.name} » (${layout.surfaceM2 || 400} m²).`
        }
      ],
      purchasedAt: Date.now()
    };

    game.saveGame();
    game.updateStatsUI();
  },

  // Score de sécurité actuel (0 à 100%)
  getSecurityScore(premises) {
    if (!premises) return 10;
    const eqList = premises.securityEquipments || [];
    let score = 10; // score de base du bâtiment brut
    eqList.forEach(eqId => {
      const item = this.SECURITY_CATALOG.find(x => x.id === eqId);
      if (item) score += item.securityPoints;
    });
    return Math.min(100, score);
  },

  // Calcul des statistiques cumulées des locaux
  calculatePremisesStats(premises) {
    if (!premises || !premises.grid) {
      return {
        surfaceM2: 0,
        storageCapacity: 0,
        studentCapacity: 0,
        vehicleCapacity: 0,
        hasFormation: false,
        hasStorage: false,
        energyRegen: 0,
        moralBonus: 0,
        nightBeds: 0,
        counts: {}
      };
    }

    const counts = {};
    for (const key of Object.keys(this.ZONE_TYPES)) {
      counts[key] = 0;
    }

    premises.grid.forEach(tileKey => {
      if (counts[tileKey] !== undefined) {
        counts[tileKey]++;
      }
    });

    const storageTiles = counts.stockage || 0;
    const formationTiles = counts.formation || 0;
    const garageTiles = counts.garage || 0;
    const detenteTiles = counts.detente || 0;
    const dortoirTiles = counts.dortoir || 0;

    return {
      surfaceM2: premises.surfaceM2 || (premises.width * premises.height * 25),
      storageCapacity: storageTiles * 50, // 50 unités de capacité par case de 25m²
      studentCapacity: formationTiles * 6, // 6 élèves par case
      vehicleCapacity: garageTiles * 1, // 1 place de véhicule par case
      hasFormation: formationTiles > 0,
      hasStorage: storageTiles > 0,
      energyRegen: detenteTiles * 15,
      moralBonus: detenteTiles * 5,
      nightBeds: dortoirTiles * 2,
      counts
    };
  },

  // Helpers pour les autres modules
  hasFormationRoom(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return false;
    return this.calculatePremisesStats(prem).hasFormation;
  },

  getFormationCapacity(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return 0;
    return this.calculatePremisesStats(prem).studentCapacity;
  },

  hasStorageRoom(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return false;
    return this.calculatePremisesStats(prem).hasStorage;
  },

  getStorageCapacity(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return 0;
    return this.calculatePremisesStats(prem).storageCapacity;
  },

  getCurrentStorageUsed(game) {
    let used = 0;
    if (game.socialData) {
      used += (game.socialData.foodPacks || 0);
      used += (game.socialData.hygieneKits || 0);
      used += (game.socialData.blankets || 0);
    }
    if (game.logistics) {
      used += (game.logistics.oxygenB5 || 0);
      used += (game.logistics.firstAidKits || 0);
      used += (game.logistics.tents || 0);
      used += (game.logistics.cots || 0);
    }
    if (window.ProtecEquipements && typeof window.ProtecEquipements.getLotsStorageUsed === 'function') {
      used += window.ProtecEquipements.getLotsStorageUsed(game);
    }
    return used;
  },

  // =========================================================================
  // HORLOGE & PROGRESSION DES CHANTIERS DE TRAVAUX (Appelée chaque seconde)
  // =========================================================================
  updateClock(game) {
    const st = game.stations[0];
    if (!st || !st.premises) return;
    const prem = st.premises;

    // 1. Progression des travaux en cours
    if (prem.ongoingWorks && prem.ongoingWorks.length > 0) {
      const now = Date.now();
      let changed = false;

      prem.ongoingWorks = prem.ongoingWorks.filter(work => {
        const elapsedSec = Math.floor((now - work.startTime) / 1000);
        work.remainingSeconds = Math.max(0, work.totalSeconds - elapsedSec);

        if (work.remainingSeconds <= 0) {
          // Chantier achevé !
          prem.grid[work.tileIndex] = work.targetType;
          changed = true;

          const zoneDef = this.ZONE_TYPES[work.targetType] || {};
          game.showToast('Chantier Livré !', `Les travaux d'aménagement de la pièce « ${zoneDef.name || work.targetType} » sont terminés !`, 'green');

          if (window.ProtecNotifications) {
            window.ProtecNotifications.recordNotification({
              title: '🏗️ Aménagement des Locaux Terminé',
              message: `Les artisans ont achevé la livraison de la nouvelle salle : « ${zoneDef.name} » (Case #${work.tileIndex + 1}).`,
              category: 'logistique',
              level: 'info'
            });
          }
          return false; // Retirer des travaux en cours
        }
        return true;
      });

      if (changed) {
        game.saveGame();
        game.updateStatsUI();
      }

      // Si le modal est ouvert sur l'onglet plan, rafraîchir en douceur les timers
      const modal = document.getElementById('main-modal');
      const title = document.getElementById('modal-title');
      if (modal && !modal.classList.contains('hidden') && title && title.textContent.includes('Locaux') && this.activeTab === 'plan') {
        const worksBadges = document.querySelectorAll('.work-timer-badge');
        worksBadges.forEach(el => {
          const idx = parseInt(el.getAttribute('data-tile-index'), 10);
          const currentWork = prem.ongoingWorks.find(w => w.tileIndex === idx);
          if (currentWork) {
            const m = Math.floor(currentWork.remainingSeconds / 60);
            const s = currentWork.remainingSeconds % 60;
            el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          }
        });
      }
    }

    // 2. Vérification périodique des risques et événements de sécurité (vol, dégradation)
    if (!prem.lastSecurityCheck) prem.lastSecurityCheck = Date.now();
    // Test toutes les 120 secondes réelles (ou plus fréquent la nuit)
    const isNight = game.clock && (game.clock.hour >= 22 || game.clock.hour < 6);
    const intervalCheck = isNight ? 90000 : 150000;

    if (Date.now() - prem.lastSecurityCheck > intervalCheck) {
      prem.lastSecurityCheck = Date.now();
      this.checkSecurityEvents(game, prem, isNight);
    }
  },

  // =========================================================================
  // GESTION DES RISQUES & ÉVÉNEMENTS DE SÉCURITÉ (Vol, Dégradation, Siphonage)
  // =========================================================================
  checkSecurityEvents(game, prem, isNight) {
    // Probabilité d'incident : 30% la nuit, 15% le jour
    const triggerChance = isNight ? 0.32 : 0.16;
    if (Math.random() > triggerChance) return;

    const securityScore = this.getSecurityScore(prem);
    const eq = prem.securityEquipments || [];
    const hasAlarm = eq.includes('alarm_system');
    const hasCCTV = eq.includes('cctv_system');
    const hasRFID = eq.includes('rfid_access');
    const hasShutters = eq.includes('roller_shutters');
    const hasLights = eq.includes('floodlights');
    const hasSafe = eq.includes('safe_box');
    const hasFence = eq.includes('perimeter_fence');

    // Scénarios possibles
    const scenarios = [
      {
        id: 'cambriolage_dsa',
        name: 'Tentative de Vol par Effraction (DAE & Secours)',
        nightOnly: true,
        desc: 'Des individus munis de pieds-de-biche ont tenté de forcer un ouvrant pour dérober des défibrillateurs DAE et des lots de secours.',
        isProtected: hasAlarm || (hasCCTV && hasRFID) || hasSafe || securityScore >= 70,
        successDefenseMsg: '🚨 Déclenchement immédiat de la sirène 110 dB et alerte télésurveillance ! Les cambrioleurs ont détalé à toute allure. La vidéo HD 4K a immortalisé leur véhicule et transmis les images aux forces de l’ordre. Zéro perte !',
        breachMsg: '⚠️ Effraction nocturne réussie ! La réserve a été pillée : 2 Défibrillateurs DAE et du matériel d’urgence ont été dérobés.',
        lossCost: 2600,
        reputationImpact: 6
      },
      {
        id: 'vandalisme_tags',
        name: 'Vandalisme & Tags sur Façade et Bâtiment',
        nightOnly: false,
        desc: 'Un groupe d’individus a ciblé la façade de l’antenne avec des bombes de peinture et bris de vitres.',
        isProtected: hasLights || hasCCTV || hasFence || securityScore >= 55,
        successDefenseMsg: '💡 Les projecteurs LED 5 000 lm se sont allumés instantanément à l’approche des individus ! Éblouis et repérés par les caméras, ils ont pris la fuite sans dégrader les lieux.',
        breachMsg: '⚠️ Façade et portes de l’antenne vandalisées et taguées pendant la nuit. Nettoyage et remise en état d’urgence requis.',
        lossCost: 850,
        reputationImpact: 3
      },
      {
        id: 'siphonage_vpsp',
        name: 'Tentative de Siphonage de Carburant sur les Ambulances',
        nightOnly: true,
        desc: 'Des rôdeurs ont tenté d’accéder aux réservoirs de gasoil de vos VPSP stationnés.',
        isProtected: hasShutters || hasFence || (hasCCTV && hasLights) || securityScore >= 60,
        successDefenseMsg: '🚒 Accès impossible ! Les rideaux métalliques blindés motorisés du hangar ont parfaitement protégé vos véhicules de secours.',
        breachMsg: '⚠️ Les réservoirs de deux de vos véhicules VPSP ont été siphonnés dans la cour ! Réservoirs à sec et frais de carburant à votre charge.',
        lossCost: 240,
        reputationImpact: 2
      },
      {
        id: 'intrusion_dons',
        name: 'Intrusion dans la Réserve de Dons Sociaux & Collectes',
        nightOnly: false,
        desc: 'Tentative d’intrusion par une porte dérobée pour dérober des cartons de couvertures et vivres.',
        isProtected: hasRFID || hasAlarm || securityScore >= 65,
        successDefenseMsg: '🪪 Le système de contrôle d’accès par badge RFID avec gâche électrique blindée a bloqué la tentative. Aucun accès n’a pu être franchi.',
        breachMsg: '⚠️ Une porte secondaire a cédé. Des cartons de denrées et couvertures de survie de la réserve sociale ont été volés ou dégradés.',
        lossCost: 450,
        reputationImpact: 3
      }
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    if (scenario.nightOnly && !isNight) return;

    if (scenario.isProtected) {
      // DÉFENSE RÉUSSIE !
      game.resources.reputationScore = Math.min(100, (game.resources.reputationScore || 50) + 1);
      const logEntry = {
        timestamp: Date.now(),
        type: 'success',
        title: `🛡️ ${scenario.name} Déjouée !`,
        message: scenario.successDefenseMsg
      };
      prem.securityLogs.unshift(logEntry);
      if (prem.securityLogs.length > 20) prem.securityLogs.pop();

      game.showToast('Sécurité : Intrusion Déjouée !', scenario.successDefenseMsg, 'green');

      if (window.ProtecNotifications) {
        window.ProtecNotifications.recordNotification({
          title: `🛡️ Intrusion Déjouée (${scenario.name})`,
          message: scenario.successDefenseMsg,
          category: 'securite',
          level: 'success'
        });
      }
    } else {
      // BRÈCHE DE SÉCURITÉ & PERTE
      const finalCost = Math.min(game.resources.money, scenario.lossCost);
      game.resources.money -= finalCost;
      game.resources.reputationScore = Math.max(10, (game.resources.reputationScore || 50) - scenario.reputationImpact);

      const logEntry = {
        timestamp: Date.now(),
        type: 'danger',
        title: `🚨 ${scenario.name} - Préjudice Constaté`,
        message: `${scenario.breachMsg} Préjudice financier : -${finalCost.toLocaleString('fr-FR')} €. Investissez dans du matériel de sécurité pour protéger vos locaux !`
      };
      prem.securityLogs.unshift(logEntry);
      if (prem.securityLogs.length > 20) prem.securityLogs.pop();

      game.showToast('Incident de Sécurité !', `${scenario.breachMsg} Préjudice : -${finalCost} €`, 'red');

      if (window.ProtecNotifications) {
        window.ProtecNotifications.recordNotification({
          title: `🚨 Effraction / Dégât (${scenario.name})`,
          message: `${scenario.breachMsg} Coût : -${finalCost} €. Installez des alarmes ou caméras dans le module Locaux !`,
          category: 'securite',
          level: 'danger'
        });
      }
    }

    game.saveGame();
    game.updateStatsUI();
  },

  // =========================================================================
  // ACTIONS JOUEUR : ACHAT SÉCURITÉ, CHANTIERS, RACHAT DES MURS
  // =========================================================================

  // Achat d'un équipement de sécurité
  buySecurityEquipment(game, equipId) {
    const st = game.stations[0];
    if (!st || !st.premises) return;
    const prem = st.premises;

    const item = this.SECURITY_CATALOG.find(x => x.id === equipId);
    if (!item) return;

    if (prem.securityEquipments && prem.securityEquipments.includes(equipId)) {
      game.showToast('Déjà Installé', `Le système « ${item.name} » est déjà opérationnel sur ce bâtiment.`, 'blue');
      return;
    }

    if (game.resources.money < item.price) {
      game.showToast('Trésorerie Insuffisante', `L’installation de cet équipement requiert ${item.price.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    game.resources.money -= item.price;
    prem.securityEquipments.push(equipId);

    const newScore = this.getSecurityScore(prem);
    prem.securityLogs.unshift({
      timestamp: Date.now(),
      type: 'info',
      title: 'Installation Sécurité Réussie',
      message: `Mise en service de « ${item.name} » (+${item.securityPoints}%). Indice de protection global : ${newScore}%.`
    });

    game.showToast('Sécurité Renforcée !', `« ${item.name} » est désormais actif. Score de protection : ${newScore}%.`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Rachat des murs du local (Location -> Pleine Propriété)
  buyoutPremisesWalls(game) {
    const st = game.stations[0];
    if (!st || !st.premises) return;
    const prem = st.premises;

    if (prem.tenure === 'owned') {
      game.showToast('Déjà Propriétaire', 'Vous êtes déjà propriétaire de ce bâtiment.', 'blue');
      return;
    }

    const price = prem.buyoutPrice || 45000;
    if (game.resources.money < price) {
      game.showToast('Fonds Insuffisants', `Le rachat des murs auprès de la commune nécessite ${price.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    if (!confirm(`🏛️ ACTE NOTARIÉ D'ACQUISITION DES MURS :\n\nConfirmez-vous le rachat définitif des murs de « ${prem.name} » pour ${price.toLocaleString('fr-FR')} € ?\n\nEn devenant propriétaire en pleine propriété :\n• Fin définitive du loyer mensuel\n• Pleine liberté d'abattre et réaménager vos cloisons\n• Valorisation patrimoniale de l'antenne`)) {
      return;
    }

    game.resources.money -= price;
    prem.tenure = 'owned';
    prem.monthlyRent = 0;

    prem.securityLogs.unshift({
      timestamp: Date.now(),
      type: 'info',
      title: 'Acquisition des Murs Réalisée',
      message: `L'antenne est devenue propriétaire en pleine propriété de ses locaux (${prem.surfaceM2} m²).`
    });

    game.showToast('Félicitations, Vous Êtes Propriétaire !', `L’antenne possède désormais ses propres murs. Vous pouvez librement engager des chantiers d'aménagement !`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Clic sur une case dans le plan 2D
  onTileClick(game, tileIndex) {
    const st = game.stations[0];
    if (!st || !st.premises) return;
    const prem = st.premises;

    // Si on clique sur une case en travaux en cours
    const existingWork = prem.ongoingWorks && prem.ongoingWorks.find(w => w.tileIndex === tileIndex);
    if (existingWork) {
      this.promptRushWork(game, existingWork);
      return;
    }

    // Si on n'est pas en mode édition, on affiche la fiche détaillée de la pièce
    if (!this.isEditing) {
      this.selectedTileDetail = tileIndex;
      this.renderModal(game);
      return;
    }

    // VÉRIFICATION CRITIQUE : INTERDICTION EN LOCATION !
    if (prem.tenure !== 'owned') {
      this.showRentalRestrictedModal(game);
      return;
    }

    // Le joueur est propriétaire : Aménagement de la pièce avec devis et délai de travaux
    const currentType = prem.grid[tileIndex];
    const targetType = this.selectedTool;

    if (currentType === targetType) {
      game.showToast('Affectation Identique', 'Cette case est déjà configurée sous cette typologie de pièce.', 'blue');
      return;
    }

    const zoneDef = this.ZONE_TYPES[targetType];
    const cost = zoneDef.costPerTile || 600;
    const durationSec = zoneDef.workDurationSec || 180;
    const durationMin = Math.round(durationSec / 60);

    if (game.resources.money < cost) {
      game.showToast('Trésorerie Insuffisante', `L’aménagement de cette pièce (${zoneDef.name}) requiert un budget de travaux de ${cost.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    // Boîte de dialogue de lancement du chantier
    const confirmMsg = `🔨 DEVIS D'ARTISAN DU BÂTIMENT (Case #${tileIndex + 1}) :\n\n• Nouvelle pièce : ${zoneDef.name}\n• Coût des travaux : ${cost} €\n• Durée de chantier : ~${durationMin} min (${durationSec} sec)\n\nPendant les travaux, les artisans interviennent sur place. Confirmez-vous le lancement du chantier ?`;

    if (!confirm(confirmMsg)) return;

    // Lancement du chantier
    game.resources.money -= cost;
    prem.ongoingWorks = prem.ongoingWorks || [];
    prem.ongoingWorks.push({
      tileIndex: tileIndex,
      targetType: targetType,
      startTime: Date.now(),
      totalSeconds: durationSec,
      remainingSeconds: durationSec,
      cost: cost,
      name: zoneDef.name
    });

    game.showToast('Chantier Lancé !', `Les artisans interviennent sur la case #${tileIndex + 1}. Livraison sous ${durationMin} min.`, 'purple');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Modal d'accélération d'un chantier en cours
  promptRushWork(game, work) {
    const rushCost = 350;
    const m = Math.floor(work.remainingSeconds / 60);
    const s = work.remainingSeconds % 60;
    const timeStr = `${m}m ${s}s`;

    if (confirm(`⚡ HEURES SUPPLÉMENTAIRES ARTISANS :\n\nChantier en cours sur « ${work.name} ».\nTemps restant : ${timeStr}.\n\nVoulez-vous engager une équipe d'urgence pour terminer instantanément les travaux pour ${rushCost} € ?`)) {
      if (game.resources.money < rushCost) {
        game.showToast('Fonds Insuffisants', `Il vous manque des fonds (${rushCost} €).`, 'orange');
        return;
      }
      game.resources.money -= rushCost;
      const prem = game.stations[0].premises;
      prem.grid[work.tileIndex] = work.targetType;
      prem.ongoingWorks = prem.ongoingWorks.filter(w => w.tileIndex !== work.tileIndex);

      game.showToast('Chantier Terminé en Urgence !', `La nouvelle pièce « ${work.name} » est immédiatement opérationnelle !`, 'green');
      game.saveGame();
      game.updateStatsUI();
      this.renderModal(game);
    }
  },

  // Avertissement formel : Aménagements bloqués en location
  showRentalRestrictedModal(game) {
    alert(`⛔ AMÉNAGEMENTS STRICTEMENT INTERDITS EN LOCATION\n\nEn tant que locataire du bâtiment (Bail communal), vous n'avez pas l'autorisation d'abattre des murs, de percer ou de réaménager les cloisons.\n\nPour transformer librement vos locaux :\n👉 Rachetez les murs du bâtiment actuel dans l'onglet Plan d'Architecte (45 000 €)\n👉 Ou achetez un bâtiment neuf en pleine propriété dans le catalogue.`);
  },

  // Choix initial du local starter
  selectStarterLayout(game, layoutId) {
    const layout = this.STARTER_LAYOUTS.find(l => l.id === layoutId);
    if (!layout) return;

    this.applyLayout(game, game.stations[0]?.id, layout);
    game.showToast('Locaux Inaugurés !', `Votre antenne est désormais installée dans « ${layout.name} » (${layout.surfaceM2} m²).`, 'green');
    this.renderModal(game);
  },

  // Achat d'un bâtiment existant (Catalogue)
  buyBuilding(game, buildingId) {
    const b = this.CATALOG_BUILDINGS.find(x => x.id === buildingId);
    if (!b) return;

    if (game.resources.money < b.price) {
      game.showToast('Fonds Insuffisants', `L'acquisition de ce bâtiment nécessite ${b.price.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    if (!confirm(`Confirmez-vous l'achat en PLEINE PROPRIÉTÉ de « ${b.name} » pour ${b.price.toLocaleString('fr-FR')} € ? Votre antenne déménagera dans ce nouvel édifice sans loyer.`)) {
      return;
    }

    game.resources.money -= b.price;
    this.applyLayout(game, game.stations[0]?.id, b);
    game.showToast('Déménagement Réussi !', `Nouvelle base d'antenne acquise en pleine propriété : ${b.name} (${b.surfaceM2} m²) !`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Lancement d'une construction sur-mesure d'Architecte
  startCustomConstruction(game, width, height) {
    const totalTiles = width * height;
    const baseTerrainCost = 350000;
    const costPerTile = 6500;
    const totalCost = baseTerrainCost + (totalTiles * costPerTile);

    if (game.resources.money < totalCost) {
      game.showToast('Trésorerie Insuffisante', `Ce projet d'architecte (${width}x${height} cases, ${totalTiles * 25} m²) requiert ${totalCost.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    if (!confirm(`Lancer la construction d'un complexe neuf sur-mesure en PLEINE PROPRIÉTÉ (${width}x${height} cases = ${totalTiles * 25} m²) pour ${totalCost.toLocaleString('fr-FR')} € ? Vous pourrez ensuite concevoir les pièces librement avec l'éditeur 2D.`)) {
      return;
    }

    game.resources.money -= totalCost;

    const grid = new Array(totalTiles).fill('vide');
    grid[0] = 'bureau';
    grid[1] = 'stockage';
    grid[2] = 'garage';

    const station = game.stations[0];
    station.premises = {
      buildingId: `custom_${Date.now()}`,
      name: `Centre Sur-Mesure de Sécurité Civile`,
      width: width,
      height: height,
      surfaceM2: totalTiles * 25,
      grid: grid,
      customBuilt: true,
      tenure: 'owned',
      monthlyRent: 0,
      buyoutPrice: 0,
      securityEquipments: [],
      ongoingWorks: [],
      securityLogs: [
        {
          timestamp: Date.now(),
          type: 'info',
          title: 'Fondations Neuves Livrées',
          message: `Construction d'un bâtiment neuf d'architecte de ${totalTiles * 25} m² en pleine propriété.`
        }
      ],
      purchasedAt: Date.now()
    };

    this.isEditing = true;
    game.showToast('Chantier Livré !', `Les fondations sont prêtes ! Utilisez l'éditeur 2D pour aménager vos pièces.`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // =========================================================================
  // MOTEUR DE DESSIN DU MOBILIER & AGENCEMENT D'ARCHITECTE 2D (SVG Top-Down)
  // =========================================================================

  renderFurnitureSVG(type, widthPx = 80, heightPx = 80) {
    switch (type) {
      case 'bureau':
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none drop-shadow-sm">
            <!-- Sol dallage clair -->
            <rect x="0" y="0" width="100" height="100" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.5"/>
            <!-- Grand bureau d'angle bois naturel -->
            <path d="M 14 18 L 74 18 L 74 40 L 48 40 L 48 68 L 14 68 Z" fill="#e2d4be" stroke="#8d6e63" stroke-width="1.8" rx="2"/>
            <!-- Double écran PC & claviers -->
            <rect x="26" y="22" width="20" height="4" fill="#1e293b" rx="1"/>
            <rect x="50" y="24" width="16" height="4" fill="#1e293b" rx="1"/>
            <rect x="30" y="29" width="12" height="6" fill="#64748b" rx="1"/>
            <!-- Fauteuil ergonomique de direction -->
            <circle cx="34" cy="46" r="8" fill="#1e293b"/>
            <path d="M 26 44 Q 34 39 42 44" stroke="#475569" stroke-width="2.5" fill="none"/>
            <!-- 2 Chaises visiteurs face au bureau -->
            <rect x="22" y="74" width="12" height="10" rx="3" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1"/>
            <rect x="42" y="74" width="12" height="10" rx="3" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1"/>
            <!-- Armoire de classement / archives le long du mur droit -->
            <rect x="80" y="35" width="12" height="52" fill="#94a3b8" stroke="#475569" stroke-width="1.5" rx="1"/>
            <line x1="86" y1="35" x2="86" y2="87" stroke="#334155" stroke-width="0.8"/>
            <!-- Plante verte en pot d'angle -->
            <circle cx="86" cy="18" r="7" fill="#15803d"/>
            <circle cx="84" cy="16" r="4" fill="#22c55e"/>
          </svg>
        `;

      case 'formation':
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none drop-shadow-sm">
            <!-- Sol parquet chaleureux -->
            <rect x="0" y="0" width="100" height="100" fill="#fef3c7" opacity="0.6"/>
            <!-- Tableau blanc / écran de projection interactif au mur nord -->
            <rect x="18" y="3" width="64" height="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" rx="1"/>
            <!-- Bureau formateur & PC portable -->
            <rect x="36" y="14" width="28" height="11" fill="#cbd5e1" stroke="#64748b" stroke-width="1.2" rx="2"/>
            <rect x="46" y="16" width="8" height="6" fill="#334155" rx="1"/>
            <circle cx="50" cy="29" r="4.5" fill="#3b82f6"/>
            <!-- Rangée 1 : Tables doubles et chaises de cours -->
            <rect x="12" y="39" width="32" height="11" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" rx="2"/>
            <circle cx="20" cy="54" r="3.5" fill="#64748b"/>
            <circle cx="36" cy="54" r="3.5" fill="#64748b"/>
            <rect x="56" y="39" width="32" height="11" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1" rx="2"/>
            <circle cx="64" cy="54" r="3.5" fill="#64748b"/>
            <circle cx="80" cy="54" r="3.5" fill="#64748b"/>
            <!-- Tapis de pratique secouriste au sol -->
            <rect x="14" y="66" width="72" height="28" fill="#0284c7" opacity="0.15" stroke="#0284c7" stroke-width="1" stroke-dasharray="2,2" rx="2"/>
            <!-- Mannequin Adulte torse RCP -->
            <rect x="24" y="72" width="15" height="16" fill="#fcd34d" stroke="#d97706" stroke-width="1" rx="4"/>
            <circle cx="31.5" cy="70" r="3.5" fill="#fcd34d"/>
            <!-- Mannequin Nourrisson pédiatrique -->
            <rect x="46" y="74" width="10" height="13" fill="#fed7aa" stroke="#ea580c" stroke-width="1" rx="3"/>
            <circle cx="51" cy="72" r="2.5" fill="#fed7aa"/>
            <!-- Boîtier DAE de formation au mur -->
            <rect x="74" y="73" width="10" height="13" fill="#ef4444" stroke="#b91c1c" stroke-width="1" rx="2"/>
            <text x="79" y="82" font-size="7" fill="#ffffff" text-anchor="middle" font-weight="bold">⚡</text>
          </svg>
        `;

      case 'stockage':
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none drop-shadow-sm">
            <!-- Sol béton lissé entrepôt -->
            <rect x="0" y="0" width="100" height="100" fill="#f1f5f9"/>
            <!-- Racks industriels métalliques haute charge à gauche -->
            <rect x="5" y="8" width="20" height="84" fill="#94a3b8" stroke="#475569" stroke-width="1.5" rx="1"/>
            <line x1="5" y1="28" x2="25" y2="28" stroke="#334155" stroke-width="1"/>
            <line x1="5" y1="48" x2="25" y2="48" stroke="#334155" stroke-width="1"/>
            <line x1="5" y1="68" x2="25" y2="68" stroke="#334155" stroke-width="1"/>
            <!-- Bacs colorés de lots de secours (Lots A/B/C) -->
            <rect x="8" y="11" width="14" height="13" fill="#ea580c" rx="1"/>
            <rect x="8" y="31" width="14" height="13" fill="#0284c7" rx="1"/>
            <rect x="8" y="51" width="14" height="13" fill="#16a34a" rx="1"/>
            <rect x="8" y="71" width="14" height="13" fill="#eab308" rx="1"/>
            <!-- Palette centrale avec cartons de vivres et couvertures -->
            <rect x="36" y="28" width="38" height="38" fill="#d4a373" stroke="#8d5b4c" stroke-width="1.2" rx="2"/>
            <rect x="39" y="31" width="15" height="15" fill="#fef08a" stroke="#ca8a04" stroke-width="0.8"/>
            <rect x="56" y="31" width="15" height="15" fill="#fed7aa" stroke="#c2410c" stroke-width="0.8"/>
            <rect x="39" y="48" width="32" height="15" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="0.8"/>
            <!-- Armoire pharmacie sécurisée blanche croix rouge -->
            <rect x="80" y="10" width="14" height="30" fill="#ffffff" stroke="#dc2626" stroke-width="1.2" rx="2"/>
            <text x="87" y="27" font-size="9" fill="#dc2626" text-anchor="middle" font-weight="bold">✚</text>
            <!-- Rack mural de bouteilles d'Oxygène B5 arrimées -->
            <rect x="80" y="55" width="14" height="35" fill="#e2e8f0" stroke="#0284c7" stroke-width="1" rx="2"/>
            <circle cx="87" cy="63" r="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
            <circle cx="87" cy="74" r="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
            <circle cx="87" cy="84" r="4" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
          </svg>
        `;

      case 'garage':
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none drop-shadow-sm">
            <!-- Sol béton atelier -->
            <rect x="0" y="0" width="100" height="100" fill="#e2e8f0"/>
            <!-- Marquage sécurité au sol : zébras jaune/noir -->
            <line x1="4" y1="5" x2="96" y2="5" stroke="#facc15" stroke-width="3" stroke-dasharray="6,4"/>
            <line x1="4" y1="95" x2="96" y2="95" stroke="#facc15" stroke-width="3" stroke-dasharray="6,4"/>
            <!-- Baie de stationnement délimitée blanche -->
            <rect x="14" y="8" width="72" height="84" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="8,4"/>
            <!-- Silhouette Top-Down Ambulance VPSP officielle -->
            <rect x="28" y="16" width="44" height="68" fill="#ffffff" stroke="#b91c1c" stroke-width="1.5" rx="6"/>
            <!-- Pare-brise teinté -->
            <path d="M 32 28 Q 50 24 68 28 L 65 37 L 35 37 Z" fill="#38bdf8" opacity="0.8"/>
            <rect x="34" y="18" width="32" height="8" fill="#f8fafc" rx="2"/>
            <!-- Rampe gyrophare LED bleue sur le toit -->
            <rect x="36" y="38" width="28" height="4" fill="#1d4ed8" rx="1.5"/>
            <circle cx="40" cy="40" r="1.5" fill="#60a5fa"/>
            <circle cx="60" cy="40" r="1.5" fill="#60a5fa"/>
            <!-- Toit cellule sanitaire avec croix Protection Civile -->
            <circle cx="50" cy="56" r="8" fill="#1e3a8a"/>
            <polygon points="50,51 55,59 45,59" fill="#f97316"/>
            <!-- Chevrons arrière sécurité jaune/rouge -->
            <rect x="32" y="80" width="36" height="4" fill="#dc2626"/>
            <line x1="32" y1="82" x2="68" y2="82" stroke="#facc15" stroke-width="2" stroke-dasharray="3,3"/>
            <!-- Servante d'outillage atelier rouge le long du mur -->
            <rect x="4" y="35" width="8" height="30" fill="#dc2626" stroke="#991b1b" stroke-width="1" rx="1"/>
            <!-- Enrouleur électrique mural 230V pour maintien de charge -->
            <circle cx="8" cy="78" r="4" fill="#0284c7"/>
          </svg>
        `;

      case 'detente':
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none drop-shadow-sm">
            <rect x="0" y="0" width="100" height="100" fill="#ecfdf5"/>
            <!-- Canapé d'angle en tissu chaleureux -->
            <path d="M 12 12 L 68 12 L 68 28 L 30 28 L 30 70 L 12 70 Z" fill="#047857" rx="3"/>
            <!-- Table basse avec mugs -->
            <rect x="36" y="34" width="22" height="18" fill="#d1fae5" stroke="#059669" stroke-width="1" rx="3"/>
            <circle cx="43" cy="43" r="2" fill="#ffffff" stroke="#047857" stroke-width="0.8"/>
            <circle cx="51" cy="43" r="2" fill="#ffffff" stroke="#047857" stroke-width="0.8"/>
            <!-- Meuble kitchenette : évier, cafetière expresso -->
            <rect x="75" y="12" width="18" height="50" fill="#cbd5e1" stroke="#64748b" stroke-width="1" rx="2"/>
            <circle cx="84" cy="22" r="3.5" fill="#334155"/>
            <rect x="78" y="34" width="12" height="10" fill="#94a3b8" rx="1"/>
            <!-- Table à manger conviviale ronde et 4 chaises -->
            <circle cx="55" cy="75" r="11" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
            <circle cx="55" cy="60" r="3" fill="#047857"/>
            <circle cx="55" cy="90" r="3" fill="#047857"/>
            <circle cx="40" cy="75" r="3" fill="#047857"/>
            <circle cx="70" cy="75" r="3" fill="#047857"/>
          </svg>
        `;

      case 'dortoir':
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none drop-shadow-sm">
            <rect x="0" y="0" width="100" height="100" fill="#f5f3ff"/>
            <!-- Lit 1 -->
            <rect x="14" y="16" width="32" height="50" fill="#ffffff" stroke="#6d28d9" stroke-width="1.2" rx="3"/>
            <rect x="14" y="32" width="32" height="34" fill="#8b5cf6" rx="2"/>
            <rect x="18" y="20" width="24" height="9" fill="#ede9fe" stroke="#6d28d9" stroke-width="0.8" rx="2"/>
            <rect x="14" y="69" width="12" height="10" fill="#ddd6fe" rx="1"/>
            <circle cx="20" cy="74" r="2" fill="#fbbf24"/>
            <!-- Lit 2 -->
            <rect x="54" y="16" width="32" height="50" fill="#ffffff" stroke="#6d28d9" stroke-width="1.2" rx="3"/>
            <rect x="54" y="32" width="32" height="34" fill="#8b5cf6" rx="2"/>
            <rect x="58" y="20" width="24" height="9" fill="#ede9fe" stroke="#6d28d9" stroke-width="0.8" rx="2"/>
            <rect x="74" y="69" width="12" height="10" fill="#ddd6fe" rx="1"/>
            <circle cx="80" cy="74" r="2" fill="#fbbf24"/>
            <!-- Casiers vestiaires individuels de garde -->
            <rect x="14" y="83" width="72" height="10" fill="#c4b5fd" stroke="#6d28d9" stroke-width="1" rx="1"/>
          </svg>
        `;

      case 'vestiaires':
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none drop-shadow-sm">
            <rect x="0" y="0" width="100" height="100" fill="#ecfeff"/>
            <!-- Casiers vestiaires métalliques tenues F1 -->
            <rect x="10" y="8" width="80" height="16" fill="#0891b2" stroke="#0e7490" stroke-width="1.2" rx="2"/>
            <line x1="26" y1="8" x2="26" y2="24" stroke="#ffffff" stroke-width="0.8"/>
            <line x1="42" y1="8" x2="42" y2="24" stroke="#ffffff" stroke-width="0.8"/>
            <line x1="58" y1="8" x2="58" y2="24" stroke="#ffffff" stroke-width="0.8"/>
            <line x1="74" y1="8" x2="74" y2="24" stroke="#ffffff" stroke-width="0.8"/>
            <!-- Banc central lattes de bois -->
            <rect x="20" y="38" width="60" height="10" fill="#d97706" stroke="#92400e" stroke-width="1" rx="2"/>
            <!-- Cabines de douches -->
            <rect x="10" y="62" width="36" height="30" fill="#cffafe" stroke="#0891b2" stroke-width="1" rx="2"/>
            <circle cx="28" cy="77" r="5" fill="#06b6d4" opacity="0.5"/>
            <!-- Lavabos -->
            <rect x="54" y="66" width="36" height="26" fill="#ffffff" stroke="#64748b" stroke-width="1" rx="2"/>
            <circle cx="63" cy="79" r="4" fill="#38bdf8"/>
            <circle cx="81" cy="79" r="4" fill="#38bdf8"/>
          </svg>
        `;

      default:
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none">
            <rect x="0" y="0" width="100" height="100" fill="#f8fafc"/>
            <line x1="0" y1="0" x2="100" y2="100" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="4,4"/>
            <line x1="100" y1="0" x2="0" y2="100" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="4,4"/>
            <!-- Flèche d'évacuation issue de secours -->
            <polygon points="45,40 55,40 55,30 65,45 55,60 55,50 45,50" fill="#22c55e" opacity="0.6"/>
          </svg>
        `;
    }
  },

  // =========================================================================
  // CALCUL DES MURS, CLOISONS ET PORTES DU PLAN 2D
  // =========================================================================

  getTileWallBorders(idx, width, height, grid) {
    const x = idx % width;
    const y = Math.floor(idx / width);
    const current = grid[idx];

    const north = y > 0 ? grid[(y - 1) * width + x] : null;
    const south = y < height - 1 ? grid[(y + 1) * width + x] : null;
    const west = x > 0 ? grid[y * width + (x - 1)] : null;
    const east = x < width - 1 ? grid[y * width + (x + 1)] : null;

    return {
      x, y,
      isOuterNorth: north === null,
      isOuterSouth: south === null,
      isOuterWest: west === null,
      isOuterEast: east === null,
      wallNorth: north === null || north !== current,
      wallSouth: south === null || south !== current,
      wallWest: west === null || west !== current,
      wallEast: east === null || east !== current,
      hasDoorNorth: north !== null && north !== current && ((idx % 2 === 0) || current === 'vide'),
      hasDoorWest: west !== null && west !== current && ((idx % 3 === 0) || current === 'vide'),
      isMainEntrance: (current === 'bureau' && north === null) || (current === 'bureau' && west === null),
      isGarageGate: current === 'garage' && (south === null || north === null)
    };
  },

  // Rendu miniature 2D d'architecte pour la sélection initiale (Starter)
  renderStarterPreview(layout) {
    const w = layout.width;
    const h = layout.height;
    return `
      <div class="p-2 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-inner overflow-hidden">
        <div class="grid gap-0.5 aspect-square w-full" style="grid-template-columns: repeat(${w}, 1fr);">
          ${layout.grid.map((tileKey, idx) => {
            const borders = this.getTileWallBorders(idx, w, h, layout.grid);
            const z = this.ZONE_TYPES[tileKey] || this.ZONE_TYPES.vide;

            // Styles des cloisons
            const borderStyles = [
              borders.isOuterNorth ? 'border-t-2 border-t-slate-950' : (borders.wallNorth ? 'border-t border-t-slate-500' : ''),
              borders.isOuterSouth ? 'border-b-2 border-b-slate-950' : (borders.wallSouth ? 'border-b border-b-slate-500' : ''),
              borders.isOuterWest ? 'border-l-2 border-l-slate-950' : (borders.wallWest ? 'border-l border-l-slate-500' : ''),
              borders.isOuterEast ? 'border-r-2 border-r-slate-950' : (borders.wallEast ? 'border-r border-r-slate-500' : '')
            ].filter(Boolean).join(' ');

            return `
              <div class="relative aspect-square overflow-hidden bg-slate-800 ${borderStyles}">
                ${this.renderFurnitureSVG(tileKey)}
                <!-- Porte d'entrée principale marquée en vert -->
                ${borders.isMainEntrance ? `
                  <div class="absolute top-0 left-1/4 right-1/4 h-1 bg-emerald-500 rounded-b shadow-sm z-10" title="Entrée Principale"></div>
                ` : ''}
                <!-- Porte de garage sectionnelle -->
                ${borders.isGarageGate ? `
                  <div class="absolute bottom-0 left-1 right-1 h-1.5 bg-red-600 rounded-t border-t border-white/60 z-10" title="Porte Sectionnelle Garage"></div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // =========================================================================
  // RENDU PRINCIPAL DU MODAL
  // =========================================================================

  renderModal(game) {
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Gestion des Locaux & Bâtiment d’Antenne';
    subtitle.textContent = 'Plan d’architecte 2D interactif, gestion locative/propriété, chantiers de travaux et sécurité';
    icon.setAttribute('data-lucide', 'building-2');

    const station = game.stations[0] || { name: 'Antenne Locale', id: 'st-0' };
    const premises = this.getStationPremises(game, station.id);

    // CAS 1 : Premier accès -> Choix des 3 dispositions de départ
    if (!premises) {
      body.innerHTML = this.renderStarterSelection(game, station);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // CAS 2 : Le joueur a déjà des locaux
    const stats = this.calculatePremisesStats(premises);
    const storageUsed = this.getCurrentStorageUsed(game);
    const storagePercent = stats.storageCapacity > 0 ? Math.min(100, Math.round((storageUsed / stats.storageCapacity) * 100)) : 100;
    const securityScore = this.getSecurityScore(premises);
    const ongoingWorksCount = (premises.ongoingWorks || []).length;
    const isOwner = premises.tenure === 'owned';

    body.innerHTML = `
      <div class="space-y-4">
        
        <!-- En-tête : Informations du Bâtiment & Statut Juridique -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-pc-blue via-pc-blue-light to-indigo-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-2xl">${isOwner ? '🏛️' : '🏢'}</span>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-black leading-tight">${premises.name}</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${isOwner ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30' : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'}">
                    ${isOwner ? 'Propriétaire en Pleine Propriété' : 'Locataire (Bail Communal)'}
                  </span>
                </div>
                <p class="text-xs text-white/80">${station.name} • Surface : <strong class="text-amber-300 font-bold">${stats.surfaceM2} m²</strong> (${premises.width}x${premises.height} cases) • Loyer : <strong class="text-white">${isOwner ? '0 € (Murs Acquis)' : `${premises.monthlyRent || 280} € / mois`}</strong></p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <div class="px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md text-xs font-bold flex items-center gap-2">
              <span>🛡️ Sécurité :</span>
              <span class="font-black ${securityScore >= 70 ? 'text-emerald-300' : (securityScore >= 40 ? 'text-amber-300' : 'text-red-300')}">${securityScore}%</span>
            </div>

            ${!isOwner ? `
              <button onclick="window.ProtecLocaux.buyoutPremisesWalls(window.game)" class="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 animate-pulse">
                <span>Racheter les Murs (${(premises.buyoutPrice || 45000).toLocaleString('fr-FR')} €)</span>
                <i data-lucide="key" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Synthèse des Capacités Clés -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <!-- Capacité Stockage -->
          <div class="p-3 rounded-2xl ${stats.hasStorage ? 'glass-card border-amber-200/80 bg-amber-50/30' : 'bg-red-50 border border-red-200'} space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">📦 Stockage</span>
              <span class="${stats.hasStorage ? 'text-amber-600' : 'text-red-600'} font-black">${storageUsed} / ${stats.storageCapacity}</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div class="h-full ${storagePercent > 90 ? 'bg-red-500' : 'bg-amber-500'} transition-all" style="width: ${storagePercent}%"></div>
            </div>
            <p class="text-[10px] ${stats.hasStorage ? 'text-slate-500' : 'text-red-600 font-bold'}">
              ${stats.hasStorage ? `Collectes & maraudes autorisées` : `⚠️ Pas de stockage`}
            </p>
          </div>

          <!-- Salle de Formation -->
          <div class="p-3 rounded-2xl ${stats.hasFormation ? 'glass-card border-blue-200/80 bg-blue-50/30' : 'bg-slate-50 border border-slate-200'} space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">🎓 Formations</span>
              <span class="text-pc-blue font-black">${stats.studentCapacity} places</span>
            </div>
            <p class="text-[10px] ${stats.hasFormation ? 'text-slate-500' : 'text-slate-400'}">
              ${stats.hasFormation ? `${stats.counts.formation || 0} salle(s) • PSC1/SST` : `Aucune salle`}
            </p>
          </div>

          <!-- Places Hangar Garage -->
          <div class="p-3 rounded-2xl glass-card space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">🚒 Hangar Flotte</span>
              <span class="text-red-600 font-black">${game.vehicles.length} / ${stats.vehicleCapacity} places</span>
            </div>
            <p class="text-[10px] text-slate-500">
              ${stats.counts.garage || 0} baie(s) VPSP
            </p>
          </div>

          <!-- Foyer / Dortoirs -->
          <div class="p-3 rounded-2xl glass-card space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">☕ Vie & Garde</span>
              <span class="text-emerald-600 font-black">+${stats.energyRegen}% réc.</span>
            </div>
            <p class="text-[10px] text-slate-500">
              ${stats.nightBeds} lits • Moral +${stats.moralBonus}%
            </p>
          </div>

        </div>

        <!-- Barre d'onglets du module -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
          <button onclick="window.ProtecLocaux.setTab('plan', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'plan' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
            Plan d’Architecte 2D ${ongoingWorksCount > 0 ? `(${ongoingWorksCount} chantier${ongoingWorksCount > 1 ? 's' : ''})` : ''}
          </button>
          <button onclick="window.ProtecLocaux.setTab('securite', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'securite' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="shield" class="w-3.5 h-3.5"></i>
            Sécurité & Protection (${securityScore}%)
          </button>
          <button onclick="window.ProtecLocaux.setTab('catalogue', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'catalogue' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="building" class="w-3.5 h-3.5"></i>
            Acheter un Bâtiment (${this.CATALOG_BUILDINGS.length})
          </button>
          <button onclick="window.ProtecLocaux.setTab('construction', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'construction' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="hammer" class="w-3.5 h-3.5"></i>
            Construction Neuve Sur-Mesure
          </button>
          <button onclick="window.ProtecLocaux.setTab('stock', window.game)" class="px-3.5 py-1.5 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'stock' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="package" class="w-3.5 h-3.5"></i>
            Réserve & Stock Social
          </button>
        </div>

        <!-- Contenu de l'onglet actif -->
        <div id="premises-tab-content">
          ${this.renderActiveTabContent(game, station, premises, stats)}
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  setTab(tabKey, game) {
    this.activeTab = tabKey;
    this.renderModal(game);
  },

  // =========================================================================
  // ÉCRAN INITIAL : CHOIX ENTRE LES 3 DISPOSITIONS DE DÉPART
  // =========================================================================

  renderStarterSelection(game, station) {
    return `
      <div class="space-y-6 max-w-4xl mx-auto py-2">
        <div class="text-center space-y-2">
          <span class="px-3 py-1 rounded-full text-xs font-black bg-pc-blue/10 text-pc-blue uppercase tracking-wider">
            Inauguration de l’Antenne Locale
          </span>
          <h3 class="text-xl font-black text-slate-900">Choisissez la Disposition de vos Premiers Locaux</h3>
          <p class="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            Pour installer votre nouvelle antenne de Protection Civile, la commune met à votre disposition un local de <strong>400 m²</strong> (bail communal).
            Sélectionnez l'aménagement initial sur le plan d'architecte :
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          ${this.STARTER_LAYOUTS.map(layout => {
            const stats = this.calculatePremisesStats(layout);
            return `
              <div class="p-5 rounded-3xl glass-panel-heavy border-2 hover:border-pc-blue transition-all flex flex-col justify-between space-y-4 group shadow-md hover:shadow-xl">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-3xl">${layout.icon}</span>
                    <span class="px-2.5 py-1 rounded-xl text-[10px] font-black ${layout.badgeColor}">
                      ${layout.badge}
                    </span>
                  </div>

                  <div>
                    <h4 class="text-sm font-black text-slate-900 group-hover:text-pc-blue transition">${layout.name}</h4>
                    <p class="text-[11px] text-slate-500 mt-1 leading-normal">${layout.desc}</p>
                  </div>

                  <!-- Aperçu Plan 2D d'Architecte Réaliste -->
                  ${this.renderStarterPreview(layout)}

                  <!-- Résumé des Capacités -->
                  <div class="space-y-1.5 text-[11px] font-bold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div class="flex justify-between">
                      <span class="text-slate-500">📦 Capacité Stock :</span>
                      <strong class="text-amber-600">${stats.storageCapacity} unités</strong>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500">🎓 Salle Formation :</span>
                      <strong class="${stats.hasFormation ? 'text-pc-blue' : 'text-slate-400'}">${stats.hasFormation ? `${stats.studentCapacity} élèves` : 'Non (Plus tard)'}</strong>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500">🚒 Garage Couvert :</span>
                      <strong class="text-red-600">${stats.vehicleCapacity} véhicule(s)</strong>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500">🛏️ Dortoir Garde :</span>
                      <strong class="text-purple-600">${stats.nightBeds > 0 ? `${stats.nightBeds} lits` : 'Non'}</strong>
                    </div>
                  </div>
                </div>

                <button onclick="window.ProtecLocaux.selectStarterLayout(window.game, '${layout.id}')" class="w-full py-2.5 rounded-2xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95">
                  <span>Choisir ce Local Gratuit</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // Rendu selon l'onglet actif
  renderActiveTabContent(game, station, premises, stats) {
    if (this.activeTab === 'plan') {
      return this.renderPlanTab(game, premises, stats);
    }
    if (this.activeTab === 'securite') {
      return this.renderSecuriteTab(game, premises);
    }
    if (this.activeTab === 'catalogue') {
      return this.renderCatalogueTab(game);
    }
    if (this.activeTab === 'construction') {
      return this.renderConstructionTab(game);
    }
    if (this.activeTab === 'stock') {
      return this.renderStockTab(game, stats);
    }
    return '';
  },

  // =========================================================================
  // 1. ONGLET PLAN D'ARCHITECTE 2D & AMÉNAGEMENTS
  // =========================================================================

  renderPlanTab(game, premises, stats) {
    const isOwner = premises.tenure === 'owned';
    const worksList = premises.ongoingWorks || [];

    return `
      <div class="space-y-4">
        
        <!-- Barre de Contrôle du Plan & Avertissement Location -->
        <div class="p-3.5 rounded-2xl glass-panel-heavy border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            ${isOwner ? `
              <button onclick="window.ProtecLocaux.toggleEditMode(window.game)" class="px-4 py-2 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 ${this.isEditing ? 'bg-amber-500 text-white animate-pulse' : 'bg-pc-blue text-white hover:bg-pc-blue-light'}">
                <i data-lucide="${this.isEditing ? 'check-circle' : 'hammer'}" class="w-4 h-4"></i>
                <span>${this.isEditing ? 'Valider le Plan d’Aménagement' : 'Réaménager les Cloisons (Travaux)'}</span>
              </button>
            ` : `
              <button onclick="window.ProtecLocaux.showRentalRestrictedModal(window.game)" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-500 cursor-not-allowed flex items-center gap-2" title="Travaux interdits en location">
                <i data-lucide="lock" class="w-4 h-4 text-slate-400"></i>
                <span>Aménagements Verrouillés (Locataire)</span>
              </button>
            `}

            <!-- Bascule de style : Meublé / Blueprint -->
            <div class="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-[11px] font-bold">
              <button onclick="window.ProtecLocaux.setViewMode('furnished', window.game)" class="px-2.5 py-1 rounded-lg transition ${this.viewMode === 'furnished' ? 'bg-white shadow text-slate-900 font-black' : 'text-slate-500'}">
                Vue Meublée 2D
              </button>
              <button onclick="window.ProtecLocaux.setViewMode('blueprint', window.game)" class="px-2.5 py-1 rounded-lg transition ${this.viewMode === 'blueprint' ? 'bg-blue-900 shadow text-white font-black' : 'text-slate-500'}">
                Bleu d’Architecte
              </button>
            </div>
          </div>

          <!-- Statut et dimensions -->
          <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Grille : <strong>${premises.width} × ${premises.height}</strong></span>
            <span>•</span>
            <span>Surface : <strong class="text-pc-blue">${stats.surfaceM2} m²</strong></span>
          </div>
        </div>

        <!-- Alerte pédagogique si Locataire -->
        ${!isOwner ? `
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 text-xs flex items-start justify-between gap-3">
            <div class="flex items-start gap-2.5">
              <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
              <div class="space-y-0.5">
                <strong class="font-black text-amber-900 block">Bâtiment sous Convention de Location (Bail Communal)</strong>
                <p class="text-[11px] text-amber-800 leading-relaxed">
                  En tant que locataire, le propriétaire communal vous interdit d'abattre des cloisons ou de modifier la structure. Pour réaménager librement votre base, rachetez les murs ci-dessus.
                </p>
              </div>
            </div>
            <button onclick="window.ProtecLocaux.buyoutPremisesWalls(window.game)" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-sm transition flex-shrink-0">
              Racheter les Murs (${(premises.buyoutPrice || 45000).toLocaleString('fr-FR')} €)
            </button>
          </div>
        ` : ''}

        <!-- Palette d'outils d'aménagement (visible si isEditing) -->
        ${this.isEditing && isOwner ? `
          <div class="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2 animate-in fade-in">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <span>🖌️</span> Palette d'Aménagement : Sélectionnez la pièce puis cliquez sur une case
              </span>
              <span class="text-[11px] text-slate-400">Chaque aménagement génère un devis et un chantier en temps réel</span>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
              ${Object.values(this.ZONE_TYPES).map(z => {
                const isSelected = this.selectedTool === z.id;
                return `
                  <button onclick="window.ProtecLocaux.selectTool('${z.id}', window.game)" class="p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border-2 ${isSelected ? 'border-amber-400 bg-white/20 scale-105 shadow-md' : 'border-transparent bg-slate-800/80 hover:bg-slate-800 text-slate-200'}">
                    <span class="text-base">${z.icon}</span>
                    <span class="text-[10px] truncate max-w-full leading-tight">${z.name}</span>
                    <span class="text-[9px] text-amber-300 font-mono">${z.costPerTile} €</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- GRILLE 2D INTERACTIVE DU PLAN D'ARCHITECTE -->
        <div class="p-4 sm:p-6 rounded-3xl ${this.viewMode === 'blueprint' ? 'blueprint-paper' : 'bg-slate-900'} shadow-2xl border-4 border-slate-900 relative overflow-x-auto flex flex-col justify-center items-center">
          
          <!-- En-tête technique du plan -->
          <div class="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3 px-2 border-b border-slate-800 pb-2">
            <span class="flex items-center gap-1.5 text-blue-400 font-bold">
              <i data-lucide="compass" class="w-3.5 h-3.5"></i>
              PLAN DE CASERNE AU SOL • ÉCHELLE 1:100 (1 case = 25 m²)
            </span>
            <span>NORD ⬆️ • ACCÈS VOIE PUBLIQUE AU SUD ⬇️</span>
          </div>

          <!-- Quadrillage du Bâtiment -->
          <div class="inline-grid gap-1.5 p-3 rounded-2xl bg-slate-950/90 shadow-2xl border-4 border-slate-800" style="grid-template-columns: repeat(${premises.width}, minmax(80px, 110px));">
            ${premises.grid.map((tileKey, idx) => {
              const borders = this.getTileWallBorders(idx, premises.width, premises.height, premises.grid);
              const z = this.ZONE_TYPES[tileKey] || this.ZONE_TYPES.vide;
              const work = worksList.find(w => w.tileIndex === idx);
              const isWork = !!work;

              // Murs extérieurs et cloisons intérieures
              const wallClasses = [
                borders.isOuterNorth ? 'border-t-4 border-t-slate-900' : (borders.wallNorth ? 'border-t-2 border-t-slate-500' : ''),
                borders.isOuterSouth ? 'border-b-4 border-b-slate-900' : (borders.wallSouth ? 'border-b-2 border-b-slate-500' : ''),
                borders.isOuterWest ? 'border-l-4 border-l-slate-900' : (borders.wallWest ? 'border-l-2 border-l-slate-500' : ''),
                borders.isOuterEast ? 'border-r-4 border-r-slate-900' : (borders.wallEast ? 'border-r-2 border-r-slate-500' : '')
              ].filter(Boolean).join(' ');

              return `
                <div onclick="window.ProtecLocaux.onTileClick(window.game, ${idx})" class="group aspect-square rounded-xl overflow-hidden relative shadow-md transition-all ${wallClasses} ${this.viewMode === 'blueprint' ? z.blueprintClass : z.bgClass} ${this.isEditing ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-400' : 'cursor-pointer hover:brightness-105'}">
                  
                  <!-- Contenu de la pièce : Meublé 2D SVG ou Chantier -->
                  ${isWork ? `
                    <!-- ÉTAT CHANTIER EN COURS -->
                    <div class="w-full h-full construction-ribbon flex flex-col items-center justify-center p-1 text-white relative">
                      <div class="p-1 rounded-full bg-slate-900/90 text-amber-400 text-base animate-bounce shadow">
                        🔨
                      </div>
                      <span class="text-[9px] font-black uppercase text-amber-300 drop-shadow mt-1">Chantier</span>
                      <span class="work-timer-badge px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono font-bold text-white shadow-sm mt-0.5" data-tile-index="${idx}">
                        ${Math.floor(work.remainingSeconds / 60).toString().padStart(2, '0')}:${(work.remainingSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  ` : `
                    <!-- PLAN MEUBLÉ DE LA PIÈCE -->
                    <div class="w-full h-full relative">
                      ${this.renderFurnitureSVG(tileKey)}
                      
                      <!-- Porte d'entrée principale vitrée -->
                      ${borders.isMainEntrance ? `
                        <div class="absolute top-0 left-1/4 right-1/4 h-2 bg-emerald-500 rounded-b shadow border-b border-white z-10 flex items-center justify-center text-[7px] text-white font-black" title="Porte d'Entrée Principale">
                          ACCÈS
                        </div>
                      ` : ''}

                      <!-- Porte sectionnelle de garage -->
                      ${borders.isGarageGate ? `
                        <div class="absolute bottom-0 left-1 right-1 h-3 bg-red-600 rounded-t border-t-2 border-white/80 z-10 flex items-center justify-center text-[8px] text-white font-black shadow-sm" title="Porte Sectionnelle de Garage Motorisée">
                          BAIE VPSP
                        </div>
                      ` : ''}

                      <!-- Portes intérieures battantes avec arc de débattement SVG -->
                      ${borders.hasDoorNorth ? `
                        <div class="absolute top-0 left-1/3 w-4 h-1 bg-amber-600 rounded-b" title="Porte Intérieure"></div>
                      ` : ''}
                      ${borders.hasDoorWest ? `
                        <div class="absolute top-1/3 left-0 w-1 h-4 bg-amber-600 rounded-r" title="Porte Intérieure"></div>
                      ` : ''}

                      <!-- Fenêtres extérieures sur murs périphériques -->
                      ${borders.isOuterEast && tileKey !== 'garage' ? `
                        <div class="absolute top-1/4 bottom-1/4 right-0 w-1 bg-sky-400 border-l border-white shadow-sm" title="Fenêtre Extérieure"></div>
                      ` : ''}

                      <!-- Nom de la pièce et numéro -->
                      <div class="absolute bottom-0 inset-x-0 bg-slate-900/70 backdrop-blur-xs p-0.5 text-center">
                        <span class="text-[8px] sm:text-[9px] font-black text-white truncate block">
                          ${z.name}
                        </span>
                      </div>
                    </div>
                  `}

                  <!-- Badge numéro de case en haut à droite -->
                  <div class="absolute top-1 right-1 px-1 rounded bg-slate-900/70 text-[8px] font-mono text-white/80">
                    #${idx + 1}
                  </div>

                </div>
              `;
            }).join('')}
          </div>

        </div>

        <!-- Légende Opérationnelle des Pièces -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          ${Object.values(this.ZONE_TYPES).filter(z => z.id !== 'vide').map(z => `
            <div class="p-2.5 rounded-xl ${z.lightBg} border flex items-center gap-2">
              <span class="text-base">${z.icon}</span>
              <div>
                <strong class="block text-[11px] leading-tight">${z.name}</strong>
                <span class="text-[9px] opacity-80">${z.desc}</span>
              </div>
            </div>
          `).join('')}
        </div>

      </div>
    `;
  },

  setViewMode(mode, game) {
    this.viewMode = mode;
    this.renderModal(game);
  },

  toggleEditMode(game) {
    const prem = game.stations[0]?.premises;
    if (prem && prem.tenure !== 'owned') {
      this.showRentalRestrictedModal(game);
      return;
    }
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      game.showToast('Mode Aménagement Actif', 'Sélectionnez un type de pièce dans la palette et cliquez sur une case pour lancer le chantier.', 'purple');
    } else {
      game.showToast('Plan Validé', 'Le plan d’aménagement de vos locaux est enregistré.', 'green');
    }
    this.renderModal(game);
  },

  selectTool(toolId, game) {
    this.selectedTool = toolId;
    this.renderModal(game);
  },

  // =========================================================================
  // 2. ONGLET SÉCURITÉ & MATÉRIEL DE PROTECTION DES LOCAUX
  // =========================================================================

  renderSecuriteTab(game, premises) {
    const score = this.getSecurityScore(premises);
    const eqList = premises.securityEquipments || [];
    const logs = premises.securityLogs || [];

    // Niveau de sécurité
    let levelText = 'Vulnérabilité Critique';
    let levelColor = 'text-red-600 bg-red-100 border-red-300';
    if (score >= 85) {
      levelText = 'Forteresse Opérationnelle (Protection Maximale)';
      levelColor = 'text-emerald-700 bg-emerald-100 border-emerald-300';
    } else if (score >= 60) {
      levelText = 'Protection Élevée (Dissuasion & Alerte)';
      levelColor = 'text-blue-700 bg-blue-100 border-blue-300';
    } else if (score >= 35) {
      levelText = 'Sécurité Modérée (Risques Nocturnes)';
      levelColor = 'text-amber-700 bg-amber-100 border-amber-300';
    }

    return `
      <div class="space-y-5">
        
        <!-- En-tête Score de Sécurité & Jauge -->
        <div class="p-4 rounded-3xl glass-card border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🛡️</span>
              <h4 class="text-sm font-black text-slate-900">Indice de Sécurité & Protection du Bâtiment</h4>
            </div>
            <p class="text-xs text-slate-600 max-w-xl">
              Les locaux abritent des ambulances VPSP, des défibrillateurs DAE de valeur et des dons citoyens. Équipez votre base contre les vols nocturnes, dégradations et siphonages de carburant.
            </p>
          </div>

          <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black ${score >= 70 ? 'text-emerald-600' : (score >= 40 ? 'text-amber-600' : 'text-red-600')}">${score}%</span>
              <span class="px-3 py-1 rounded-xl text-xs font-black border ${levelColor}">
                ${levelText}
              </span>
            </div>
            <div class="w-48 h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div class="h-full ${score >= 70 ? 'bg-emerald-500' : (score >= 40 ? 'bg-amber-500' : 'bg-red-500')} transition-all" style="width: ${score}%"></div>
            </div>
          </div>
        </div>

        <!-- Catalogue des 7 Équipements de Sécurité -->
        <div class="space-y-3">
          <h5 class="text-xs font-black uppercase text-slate-700 tracking-wider">Équipements de Sécurité Disponibles (${this.SECURITY_CATALOG.length})</h5>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            ${this.SECURITY_CATALOG.map(item => {
              const isEquipped = eqList.includes(item.id);
              const canAfford = game.resources.money >= item.price;

              return `
                <div class="p-4 rounded-2xl ${isEquipped ? 'glass-card-emerald border-emerald-300' : 'glass-card border-slate-200'} space-y-3 border flex flex-col justify-between hover:shadow-md transition">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-xl ${isEquipped ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'} flex items-center justify-center flex-shrink-0">
                          <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                        </div>
                        <div>
                          <h6 class="text-xs font-black text-slate-900">${item.name}</h6>
                          <span class="text-[10px] font-bold text-slate-400 uppercase">${item.category} • +${item.securityPoints}% Protection</span>
                        </div>
                      </div>

                      <span class="px-2 py-0.5 rounded text-[10px] font-black ${isEquipped ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
                        ${isEquipped ? 'ACTIF ✓' : `${item.price.toLocaleString('fr-FR')} €`}
                      </span>
                    </div>

                    <p class="text-[11px] text-slate-600 leading-normal">${item.desc}</p>
                    <div class="text-[10px] text-emerald-800 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100 font-semibold">
                      <strong>Impact :</strong> ${item.bonus}
                    </div>
                  </div>

                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[10px] text-slate-500 font-medium">${isEquipped ? 'Système sous tension 24h/24' : 'Délai d’installation : Immédiat'}</span>
                    
                    ${isEquipped ? `
                      <span class="px-3 py-1 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        Opérationnel ✓
                      </span>
                    ` : `
                      <button onclick="window.ProtecLocaux.buySecurityEquipment(window.game, '${item.id}')" ${!canAfford ? 'disabled' : ''} class="px-3.5 py-1.5 rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 ${canAfford ? 'bg-pc-blue hover:bg-pc-blue-light text-white active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
                        <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                        <span>Installer (${item.price.toLocaleString('fr-FR')} €)</span>
                      </button>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Journal des Événements & Incidents de Sécurité -->
        <div class="p-4 rounded-2xl glass-card space-y-3 border border-slate-200">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <i data-lucide="history" class="w-4 h-4 text-pc-blue"></i>
              Journal de Sécurité de l'Antenne (${logs.length})
            </h5>
            <span class="text-[11px] text-slate-400 font-mono">Surveillance automatique active</span>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
            ${logs.length === 0 ? '<p class="text-xs text-slate-400 italic text-center p-3">Aucun événement de sécurité consigné pour le moment.</p>' : ''}
            
            ${logs.map(log => {
              const colorClass = log.type === 'danger' ? 'bg-red-50 text-red-950 border-red-200' : (log.type === 'success' ? 'bg-emerald-50 text-emerald-950 border-emerald-200' : 'bg-slate-50 text-slate-900 border-slate-200');
              const dateStr = new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

              return `
                <div class="p-2.5 rounded-xl border text-xs space-y-0.5 ${colorClass}">
                  <div class="flex items-center justify-between">
                    <strong class="font-extrabold">${log.title}</strong>
                    <span class="text-[10px] opacity-75 font-mono">${dateStr}</span>
                  </div>
                  <p class="text-[11px] opacity-90">${log.message}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // 3. CATALOGUE BÂTIMENTS À L'ACHAT (Pleine Propriété)
  // =========================================================================

  renderCatalogueTab(game) {
    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
          <span>Vous manquez de place ? Achetez un bâtiment plus grand en pleine propriété pour étendre votre garage et vos réserves.</span>
          <span class="font-bold text-pc-blue">Fonds : ${game.resources.money.toLocaleString('fr-FR')} €</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this.CATALOG_BUILDINGS.map(b => {
            const stats = this.calculatePremisesStats(b);
            const canAfford = game.resources.money >= b.price;
            return `
              <div class="p-5 rounded-3xl glass-card border border-slate-200 flex flex-col justify-between space-y-4 hover:shadow-lg transition">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-3xl">${b.icon}</span>
                    <span class="px-2.5 py-1 rounded-xl text-xs font-black ${canAfford ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}">
                      ${b.price.toLocaleString('fr-FR')} € (Pleine Propriété)
                    </span>
                  </div>

                  <div>
                    <h4 class="text-base font-black text-slate-900">${b.name}</h4>
                    <p class="text-xs text-slate-500">${b.desc}</p>
                  </div>

                  <!-- Aperçu Plan 2D d'Architecte -->
                  <div class="p-2 rounded-2xl bg-slate-900 shadow-inner">
                    <div class="grid gap-0.5 aspect-video w-full" style="grid-template-columns: repeat(${b.width}, 1fr);">
                      ${b.grid.map(tileKey => `
                        <div class="rounded aspect-square overflow-hidden bg-slate-800">
                          ${this.renderFurnitureSVG(tileKey)}
                        </div>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Chiffres clés -->
                  <div class="grid grid-cols-3 gap-2 text-[11px] font-bold text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span class="text-slate-400 block text-[9px] uppercase">Surface</span>
                      <strong class="text-slate-800">${b.surfaceM2} m²</strong>
                    </div>
                    <div>
                      <span class="text-slate-400 block text-[9px] uppercase">Stockage</span>
                      <strong class="text-amber-600">${stats.storageCapacity} u.</strong>
                    </div>
                    <div>
                      <span class="text-slate-400 block text-[9px] uppercase">Garage</span>
                      <strong class="text-red-600">${stats.vehicleCapacity} places</strong>
                    </div>
                  </div>
                </div>

                <button onclick="window.ProtecLocaux.buyBuilding(window.game, '${b.id}')" ${!canAfford ? 'disabled' : ''} class="w-full py-2.5 rounded-2xl font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 ${canAfford ? 'bg-pc-blue hover:bg-pc-blue-light text-white active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
                  <span>${canAfford ? 'Acheter et Déménager l’Antenne' : 'Trésorerie Insuffisante'}</span>
                  <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 4. CONSTRUCTION NEUVE D'ARCHITECTE SUR-MESURE
  // =========================================================================

  renderConstructionTab(game) {
    return `
      <div class="space-y-5 max-w-2xl mx-auto py-2">
        <div class="p-4 rounded-3xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white space-y-2 shadow-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🏗️</span>
            <div>
              <h4 class="text-sm font-black">Chantier Neuf d’Architecte Sécurité Civile</h4>
              <p class="text-xs text-white/80">Acquérez une parcelle nue viabilisée en pleine propriété et concevez votre base de A à Z avec l'éditeur 2D.</p>
            </div>
          </div>
        </div>

        <div class="p-5 rounded-3xl glass-card space-y-4 border border-slate-200">
          <h5 class="text-xs font-black uppercase text-slate-700 tracking-wider">Dimensionnez votre terrain de construction :</h5>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onclick="window.ProtecLocaux.startCustomConstruction(window.game, 5, 5)" class="p-4 rounded-2xl border-2 border-slate-200 hover:border-purple-600 transition text-left space-y-1 group">
              <span class="text-xs font-black text-slate-800 group-hover:text-purple-600 block">Moyen (5 × 5 cases)</span>
              <span class="text-[11px] text-slate-500 block">25 cases • 625 m²</span>
              <strong class="text-xs text-emerald-600 block font-mono">512 500 €</strong>
            </button>

            <button onclick="window.ProtecLocaux.startCustomConstruction(window.game, 6, 6)" class="p-4 rounded-2xl border-2 border-slate-200 hover:border-purple-600 transition text-left space-y-1 group">
              <span class="text-xs font-black text-slate-800 group-hover:text-purple-600 block">Grand (6 × 6 cases)</span>
              <span class="text-[11px] text-slate-500 block">36 cases • 900 m²</span>
              <strong class="text-xs text-emerald-600 block font-mono">584 000 €</strong>
            </button>

            <button onclick="window.ProtecLocaux.startCustomConstruction(window.game, 8, 6)" class="p-4 rounded-2xl border-2 border-purple-300 hover:border-purple-600 transition text-left space-y-1 group bg-purple-50/40">
              <span class="text-xs font-black text-purple-900 block">Complexe XXL (8 × 6 cases)</span>
              <span class="text-[11px] text-purple-700 block">48 cases • 1 200 m²</span>
              <strong class="text-xs text-emerald-600 block font-mono">662 000 €</strong>
            </button>
          </div>

          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <strong>Inclus dans le contrat d'architecte :</strong>
            <ul class="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
              <li>Pleine propriété foncière garantie.</li>
              <li>Permis de construire préfectoral de Sécurité Civile délivré.</li>
              <li>Raccordements électriques haute puissance pour bornes véhicules VPSP.</li>
              <li>Accès immédiat à l'Éditeur 2D pour dessiner vos cloisons et pièces.</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 5. RÉSERVE & STOCK SOCIAL
  // =========================================================================

  renderStockTab(game, stats) {
    const storageUsed = this.getCurrentStorageUsed(game);
    const social = game.socialData || {};
    const log = game.logistics || {};

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl ${stats.hasStorage ? 'bg-amber-50/80 border border-amber-200' : 'bg-red-50 border border-red-200'} flex items-center justify-between">
          <div class="space-y-1">
            <h4 class="text-xs font-black ${stats.hasStorage ? 'text-amber-900' : 'text-red-900'}">Capacité de la Zone de Stockage de l’Antenne</h4>
            <p class="text-[11px] text-slate-600">
              ${stats.hasStorage ? `Votre zone de stockage compte ${stats.counts.stockage || 0} case(s) de 25m², permettant d'entreposer jusqu'à <strong>${stats.storageCapacity} unités</strong>.` : `⚠️ Votre antenne n'a <strong>aucune zone de stockage</strong>. Vous ne pouvez pas réaliser de collectes alimentaires ni stocker de matériel d'urgence.`}
            </p>
          </div>
          <button onclick="window.ProtecLocaux.setTab('plan', window.game); window.ProtecLocaux.isEditing = true; window.ProtecLocaux.selectedTool = 'stockage'; window.ProtecLocaux.renderModal(window.game);" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow transition flex-shrink-0">
            + Agrandir la Réserve
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- Pôle Social (Collectes et Denrées) -->
          <div class="p-4 rounded-2xl glass-card space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-black text-purple-700 flex items-center gap-1.5">
                <span>🤝</span> Pôle Social & Collectes Citoyennes
              </span>
              <button onclick="window.game.openModule('social')" class="text-xs font-bold text-pc-blue hover:underline">
                Aller au Pôle Social ➜
              </button>
            </div>
            
            <div class="space-y-2 text-xs">
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🥫 Colis Alimentaires :</span>
                <strong class="text-slate-800">${social.foodPacks || 0} colis</strong>
              </div>
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🧼 Trousses d'Hygiène :</span>
                <strong class="text-slate-800">${social.hygieneKits || 0} trousses</strong>
              </div>
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🧣 Couvertures de Survie :</span>
                <strong class="text-slate-800">${social.blankets || 0} couvertures</strong>
              </div>
            </div>
          </div>

          <!-- Pôle Médical & Logistique Matérielle -->
          <div class="p-4 rounded-2xl glass-card space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <span class="text-xs font-black text-teal-700 flex items-center gap-1.5">
                <span>📦</span> Lots Opérationnels & Secourisme
              </span>
              <button onclick="window.game.openModule('logistique')" class="text-xs font-bold text-pc-blue hover:underline">
                Pôle Logistique ➜
              </button>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🫁 Bouteilles Oxygène B5 :</span>
                <strong class="text-slate-800">${log.oxygenB5 || 12} bouteilles</strong>
              </div>
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🩹 Trousses PSE & Pansements :</span>
                <strong class="text-slate-800">${log.firstAidKits || 20} sacs</strong>
              </div>
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>⛺ Tentes PMA & Barnums :</span>
                <strong class="text-slate-800">${log.tents || 3} tentes</strong>
              </div>
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🛏️ Lits de Camp Réserve :</span>
                <strong class="text-slate-800">${log.cots || 15} lits</strong>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }
};
