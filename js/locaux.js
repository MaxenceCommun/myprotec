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
  dimensionMode: '2d', // '2d' (Plan d'architecte CAD) | '3d' (Vue isométrique 3D)
  editorTab: 'furniture', // 'furniture' | 'doors' | 'rooms' | 'expand'
  snapToGrid: true, // Aimant / Magnétisme à la grille (0.2m)
  camera3D: { yaw: -0.72, pitch: 0.62, zoom: 32, panX: 0, panY: -10 },
  camera2D: { zoom: 25, panX: 0, panY: 0 },
  isDraggingCanvas: false,
  dragStart: { x: 0, y: 0 },
  dragButton: 0,
  activeTab: 'plan', // 'plan' | 'securite' | 'catalogue' | 'construction' | 'stock'
  selectedTool: 'formation', // outil actif dans l'éditeur 2D
  isEditing: false, // mode modification de cloisons actif
  viewMode: 'furnished', // 'furnished' (meublé réaliste) | 'blueprint' (bleu technique d'architecte)
  selectedTileDetail: null, // index de la pièce affichée en détail
  selectedFurnitureId: null,
  hoveredFurnitureId: null,
  selectedRoomId: 'room_1',

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
    },
    parking: {
      id: 'parking',
      name: 'Parking Opérationnel Extérieur',
      icon: '🅿️',
      bgClass: 'bg-slate-700 border-slate-600',
      textClass: 'text-slate-200',
      blueprintClass: 'bg-slate-900 border-slate-500 text-slate-300',
      lightBg: 'bg-slate-100 text-slate-700 border-slate-300',
      desc: 'Stationnement extérieur des véhicules de secours (VPSP, VTU, VL) et accès portail.',
      costPerTile: 300,
      workDurationSec: 60,
      perTileStats: { vehicleCapacity: 2 }
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

  confirmCustomStarterSetup(game, stationId) {
    const stId = stationId || game.stations[0]?.id;
    const station = game.stations.find(s => s.id === stId) || game.stations[0];
    if (!station) return;

    const model = this.getArchitectModel(station.id);

    if (!station.premises) {
      station.premises = {
        tenure: 'rented',
        level: 1,
        monthlyRent: 350,
        securityEquipment: []
      };
    }
    // Sauvegarder la structure architecturale personnalisée complète
    station.premises.architecture = JSON.parse(JSON.stringify(model));
    station.premises.tenure = 'rented';

    // Nettoyer l'état temporaire
    this._currentSetupModel = null;

    // Fermer la modale
    const modal = document.getElementById('main-modal');
    if (modal) modal.classList.add('hidden');

    game.showToast('🎉 Caserne Inaugurée !', `Bienvenue dans votre nouvelle antenne de Protection Civile ! Aménagement validé. La mission commence !`, 'green');
    game.saveGame();
    game.updateStatsUI();
  },

  openInitialSetupModal(game, stationId) {
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Plan d\'Architecte 2D • Bâtiment de Base Protection Civile';
    subtitle.textContent = 'Affectez les vocations des pièces et disposez votre mobilier comme dans Les Sims avant d\'ouvrir';
    icon.setAttribute('data-lucide', 'home');

    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    this._currentSetupStationId = station ? station.id : '';
    if (!this._currentSetupModel) {
      this._currentSetupModel = JSON.parse(JSON.stringify(this.getArchitectModel()));
    }
    this.selectedRoomId = this.selectedRoomId || 'room_1';

    body.innerHTML = this.renderStarterSelection(game, station);
    if (window.lucide) window.lucide.createIcons();

    // Rendu immédiat et synchronisé avec l'animation de la modal
    requestAnimationFrame(() => {
      this.initArchitectCanvas();
    });
    setTimeout(() => { this.initArchitectCanvas(); }, 60);
    setTimeout(() => { this.initArchitectCanvas(); }, 200);
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
      case 'parking':
        return `
          <svg viewBox="0 0 100 100" class="w-full h-full pointer-events-none drop-shadow-sm">
            <!-- Bitume gris foncé -->
            <rect x="0" y="0" width="100" height="100" fill="#334155"/>
            <!-- Marquages au sol blancs -->
            <line x1="10" y1="5" x2="10" y2="95" stroke="#f8fafc" stroke-width="2" stroke-dasharray="6,4"/>
            <line x1="90" y1="5" x2="90" y2="95" stroke="#f8fafc" stroke-width="2" stroke-dasharray="6,4"/>
            <!-- Emplacement réservé véhicule de secours -->
            <rect x="22" y="15" width="56" height="70" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="4,2" rx="4"/>
            <text x="50" y="55" font-size="12" fill="#f59e0b" text-anchor="middle" font-weight="900">PC 🚑</text>
          </svg>
        `;

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

  // Catalogue des meubles et équipements pour l'agencement "Les Sims"
  FURNITURE_CATALOG: [
    { type: 'bureau', name: 'Bureau Direction & PC', cat: 'bureau', w: 1.8, d: 0.9, color: '#334155', cost: 250, icon: '🗄️' },
    { type: 'chaise', name: 'Chaise de Réunion', cat: 'bureau', w: 0.5, d: 0.5, color: '#0284c7', cost: 45, icon: '🪑' },
    { type: 'table_formation', name: 'Table Formation Pédagogique', cat: 'formation', w: 2.2, d: 1.1, color: '#ea580c', cost: 180, icon: '🪑' },
    { type: 'tableau_blanc', name: 'Tableau Blanc Mural', cat: 'formation', w: 2.2, d: 0.2, color: '#f8fafc', cost: 120, icon: '📋' },
    { type: 'mannequin_rcp', name: 'Mannequin Secourisme RCP', cat: 'formation', w: 0.6, d: 1.2, color: '#f59e0b', cost: 320, icon: '🩺' },
    { type: 'dae_mural', name: 'Défibrillateur DAE Mural', cat: 'secours', w: 0.35, d: 0.35, color: '#10b981', cost: 450, icon: '⚡' },
    { type: 'armoire_pharmacie', name: 'Armoire Pharmacie d’Urgence', cat: 'secours', w: 1.2, d: 0.4, color: '#dc2626', cost: 190, icon: '🧰' },
    { type: 'etagere_lots', name: 'Étagère Métallique Lots A/B', cat: 'stockage', w: 0.6, d: 2.4, color: '#475569', cost: 150, icon: '📦' },
    { type: 'casiers_vestiaire', name: 'Casiers Tenues F1 Protec', cat: 'stockage', w: 0.6, d: 2.5, color: '#0f172a', cost: 180, icon: '👕' },
    { type: 'lit_garde', name: 'Lit de Camp / Astreinte', cat: 'detente', w: 1.0, d: 2.0, color: '#a855f7', cost: 220, icon: '🛏️' },
    { type: 'canape_detente', name: 'Canapé Foyer Bénévoles', cat: 'detente', w: 2.0, d: 0.9, color: '#059669', cost: 280, icon: '🛋️' },
    { type: 'machine_cafe', name: 'Machine à Café & Pause', cat: 'detente', w: 0.8, d: 0.6, color: '#d97706', cost: 85, icon: '☕' }
  ],

  // =========================================================================
  // ÉCRAN INITIAL & GESTION : VÉRITABLE PLAN D'ARCHITECTE 2D/3D & OUTILS LES SIMS
  // =========================================================================

  renderStarterSelection(game, station) {
    const stId = station ? station.id : (game.stations[0]?.id || '');
    const model = this.getArchitectModel(stId);
    this._currentSetupModel = model;
    this.selectedRoomId = this.selectedRoomId || 'room_1';
    const selectedRoom = (model.rooms || []).find(r => r.id === this.selectedRoomId) || model.rooms[0];
    const selectedItem = (model.furniture || []).find(f => f.id === this.selectedFurnitureId);

    // Déclenchement réactif de l'initialisation et du tracé du Canvas
    requestAnimationFrame(() => {
      this.initArchitectCanvas();
    });
    setTimeout(() => { this.initArchitectCanvas(); }, 60);
    setTimeout(() => { this.initArchitectCanvas(); }, 200);

    return `
      <div class="space-y-3.5 max-w-6xl mx-auto py-1">
        <!-- En-tête officiel de démarrage -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pc-blue/10 text-pc-blue uppercase tracking-wider">
                Procédure d'Ouverture d'Antenne
              </span>
              <span class="text-xs font-bold text-slate-500">• Bâtiment de Base Déjà Bâti</span>
            </div>
            <h3 class="text-base sm:text-lg font-black text-slate-900">Architecture & Agencement des Locaux (Protection Civile)</h3>
            <p class="text-xs text-slate-600">Aménagez librement les 3 pièces, placez vos meubles, portes et cloisons comme dans Les Sims :</p>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Mode 2D Uniquement (Vue 3D désactivée pour le moment) -->
            <div class="flex items-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow text-xs font-black text-slate-300">
              <span class="text-blue-400 mr-1.5">📐</span> Plan 2D CAD
            </div>

            <button type="button" onclick="window.ProtecLocaux.resetCamera()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center gap-1">
              <span>🎯</span> Recentrer
            </button>
            <button type="button" onclick="window.ProtecLocaux.toggleMagnet()" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${this.snapToGrid ? 'bg-blue-50 text-pc-blue border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-200'}">
              <span>🧲</span> Aimant Grille
            </button>
          </div>
        </div>

        <!-- ZONE CENTRALE : PLAN CAD 2D HAUTE DÉFINITION -->
        <div class="relative w-full h-[460px] sm:h-[500px] rounded-3xl bg-[#0a0e17] border-2 border-slate-800 shadow-xl overflow-hidden select-none">
          <canvas id="architect-canvas" class="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>

          <!-- Badge En direct -->
          <div class="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow text-xs font-bold text-white pointer-events-none">
            <span class="text-blue-400">📐</span>
            <span>Plan d’Architecte 2D CAD</span>
            <span class="text-[9.5px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Éditable</span>
          </div>

          <!-- Boutons de zoom et outils rapides droite -->
          <div class="absolute top-3 right-3 z-10 flex flex-col items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow">
            <button type="button" onclick="window.ProtecLocaux.zoomCamera(1.2)" class="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-black text-sm flex items-center justify-center transition" title="Zoom avant">+</button>
            <button type="button" onclick="window.ProtecLocaux.zoomCamera(0.8)" class="w-7 h-7 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-black text-sm flex items-center justify-center transition" title="Zoom arrière">−</button>
            <button type="button" onclick="window.ProtecLocaux.resetCamera()" class="w-7 h-7 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800 font-black text-xs flex items-center justify-center transition" title="Recentrer">🎯</button>
          </div>

          <!-- BANDEAU CONTEXTUEL INFÉRIEUR DYNAMIQUE -->
          <div id="canvas-context-bar" class="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 px-3.5 py-1.5 rounded-xl bg-slate-900/95 backdrop-blur border border-slate-700/80 text-xs text-white shadow-xl flex items-center gap-3">
            ${selectedItem ? `
              <span class="flex items-center gap-1.5 font-bold text-amber-300">
                <span>🛋️</span>
                <span>Objet : <strong>${selectedItem.label}</strong></span>
              </span>
              <div class="h-4 w-[1px] bg-slate-700"></div>
              <button type="button" onclick="window.ProtecLocaux.rotateSelectedItem()" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition">
                <span>🔄</span> Pivoter [R] (Gratuit)
              </button>
              <button type="button" onclick="window.ProtecLocaux.deleteSelectedItem()" class="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 transition">
                <span>🗑️</span> Revendre [Suppr] (50%)
              </button>
            ` : `
              <span class="text-slate-300 text-[11px] font-medium flex items-center gap-1.5">
                <span>💡</span>
                <span>Cliquez sur un meuble pour le déplacer (gratuit) ou pivoter [R] • Cliquez sur une pièce pour l'aménager</span>
              </span>
            `}
          </div>
        </div>

        <!-- BARRE D'OUTILS D'ÉDITION "LES SIMS" AVEC 4 ONGLETS INTERACTIFS -->
        <div class="p-4 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-3">
          <!-- Onglets de la barre d'outils -->
          <div class="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div class="flex items-center gap-1.5 overflow-x-auto">
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('furniture')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${this.editorTab === 'furniture' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>🛋️</span> Mobilier & Matériel
              </button>
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('doors')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${this.editorTab === 'doors' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>🚪</span> Portes & Fenêtres
              </button>
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('rooms')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${this.editorTab === 'rooms' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>🏛️</span> Vocation des 3 Salles
              </button>
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('expand')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${this.editorTab === 'expand' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>➕</span> Agrandir (Extension)
              </button>
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('metrics')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${this.editorTab === 'metrics' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>📊</span> Métriques & Flux
              </button>
            </div>

            <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <span>Salle Active : <strong class="text-slate-800">${selectedRoom?.name?.split('\n')[0] || 'Salle 1'}</strong></span>
            </div>
          </div>

          <!-- Contenu interactif de l'onglet actif -->
          <div id="editor-subpanel">
            ${this.renderEditorToolsHTML(model)}
          </div>
        </div>

        <!-- BOUTON PRINCIPAL : VALIDATION & COMMENCER LA PARTIE -->
        <div class="pt-1">
          <button type="button" onclick="window.ProtecLocaux.confirmCustomStarterSetup(window.game, '${stId}')" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95">
            <i data-lucide="check-circle" class="w-5 h-5"></i>
            <span>Valider l'Aménagement et Commencer la Partie</span>
          </button>
        </div>
      </div>
    `;
  },

  setEditorTab(tabKey) {
    this.editorTab = tabKey;
    const panel = document.getElementById('editor-subpanel');
    if (panel) {
      panel.innerHTML = this.renderEditorToolsHTML();
      if (window.lucide) window.lucide.createIcons();
    }
    // Rafraîchir l'en-tête d'onglets
    const container = document.getElementById('main-modal');
    if (container) {
      const tabs = container.querySelectorAll('[onclick^="window.ProtecLocaux.setEditorTab"]');
      tabs.forEach(btn => {
        const isCurrent = btn.getAttribute('onclick').includes(`'${tabKey}'`);
        btn.className = `px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${isCurrent ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;
      });
    }
  },

  renderEditorToolsHTML(model) {
    const m = model || this.getArchitectModel();
    const selectedRoom = (m.rooms || []).find(r => r.id === this.selectedRoomId) || m.rooms[0];
    const money = window.game?.resources?.money || 0;

    if (this.editorTab === 'furniture') {
      return `
        <div class="space-y-2.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 pb-1 border-b border-slate-100">
            <span class="text-slate-600">Sélectionnez un mobilier à acheter et placer dans <strong>${selectedRoom?.name?.split('\n')[0] || 'la pièce'}</strong> :</span>
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-slate-700">Trésorerie disponible : <strong class="text-emerald-600 font-black">${money.toLocaleString('fr-FR')} €</strong></span>
              <span class="text-pc-blue font-bold text-[11px] hidden sm:inline">• Déplacement & rotation [R] 100% gratuits</span>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            ${this.FURNITURE_CATALOG.map(item => `
              <button type="button" onclick="window.ProtecLocaux.addFurnitureItem('${item.type}')" class="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-pc-blue text-slate-800 transition flex flex-col items-center justify-center gap-1 shadow-2xs group active:scale-95">
                <span class="text-xl group-hover:scale-110 transition">${item.icon}</span>
                <span class="text-[10px] font-bold text-center leading-tight truncate w-full">${item.name}</span>
                <div class="flex items-center justify-between w-full px-1 text-[9px]">
                  <span class="text-slate-500 font-mono">${item.w}m × ${item.d}m</span>
                  <span class="font-black text-emerald-700 bg-emerald-100/70 px-1 rounded">${item.cost} €</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (this.editorTab === 'doors') {
      return `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
            <span class="text-slate-600">Ajoutez des ouvertures sur les murs :</span>
            <span class="text-xs font-bold text-slate-700">Trésorerie disponible : <strong class="text-emerald-600 font-black">${money.toLocaleString('fr-FR')} €</strong></span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button type="button" onclick="window.ProtecLocaux.addDoorItem('W')" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center justify-between group active:scale-95">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🚪</span>
                <div>
                  <strong class="block text-xs font-black text-slate-900">+ Porte d'Entrée (93cm)</strong>
                  <span class="text-[10.5px] text-slate-500">Accès parking / extérieur</span>
                </div>
              </div>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">120 €</span>
            </button>
            <button type="button" onclick="window.ProtecLocaux.addDoorItem('N')" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center justify-between group active:scale-95">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🚪</span>
                <div>
                  <strong class="block text-xs font-black text-slate-900">+ Porte Intérieure (83cm)</strong>
                  <span class="text-[10.5px] text-slate-500">Cloison de communication</span>
                </div>
              </div>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">120 €</span>
            </button>
            <button type="button" onclick="window.ProtecLocaux.addWindowItem('N')" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center justify-between group active:scale-95">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🪟</span>
                <div>
                  <strong class="block text-xs font-black text-slate-900">+ Fenêtre Cyan (1.40m)</strong>
                  <span class="text-[10.5px] text-slate-500">Double vitrage isolant</span>
                </div>
              </div>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">180 €</span>
            </button>
          </div>
        </div>
      `;
    }

    if (this.editorTab === 'rooms') {
      return `
        <div class="space-y-2">
          <div class="text-xs text-slate-600">Affectez la vocation et la fonction de chaque salle de votre caserne (gratuit) :</div>
          <div id="starter-rooms-list" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            ${this.renderRoomsListHTML(m)}
          </div>
        </div>
      `;
    }

    if (this.editorTab === 'expand') {
      return `
        <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="space-y-0.5">
            <strong class="font-black text-amber-900 flex items-center gap-1.5">
              <span>🏗️</span> Extension de Caserne (Nouvelle Pièce de 16.1 m²)
            </strong>
            <p class="text-[11px] text-amber-800">
              Agrandissez le bâtiment de plain-pied avec une 4ème pièce dédiée (Foyer des bénévoles ou Dortoir de garde SAMU).
            </p>
          </div>
          <button type="button" onclick="window.ProtecLocaux.addCustomRoom()" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow transition flex-shrink-0 flex items-center gap-1.5 active:scale-95">
            <span>➕ Bâtir l'Extension (+16 m²)</span>
            <span class="bg-amber-800/60 px-1.5 py-0.5 rounded text-[10px]">2 500 €</span>
          </button>
        </div>
      `;
    }

    if (this.editorTab === 'metrics') {
      const metrics = window.ProtecBuildingSystem
        ? window.ProtecBuildingSystem.analyzeLayout(m)
        : null;

      if (!metrics) {
        return '<p class="text-xs text-slate-500 p-3">Moteur de calcul des métriques non disponible.</p>';
      }

      return `
        <div class="space-y-3">
          <!-- En-tête Score Global & Diagnostic -->
          <div class="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-amber-400 uppercase tracking-wider">Score d'Efficacité Opérationnelle</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${metrics.globalScore >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : (metrics.globalScore >= 60 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40')}">
                  ${metrics.globalScore >= 80 ? 'Excellent' : (metrics.globalScore >= 60 ? 'Fonctionnel' : 'À Optimiser')}
                </span>
              </div>
              <p class="text-xs text-slate-300 font-medium">${metrics.summary}</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <span class="text-2xl font-black text-amber-400">${metrics.globalScore}%</span>
                <span class="block text-[10px] text-slate-400">Rendement tactique</span>
              </div>
              <div class="w-16 bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div class="h-full rounded-full ${metrics.globalScore >= 75 ? 'bg-emerald-400' : 'bg-amber-400'}" style="width: ${metrics.globalScore}%"></div>
              </div>
            </div>
          </div>

          <!-- Grille des 4 Métriques Spécifiées -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <!-- 1. Temps d'accès / Chrono Départ -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div class="flex items-center justify-between text-xs font-black text-slate-800">
                <span class="flex items-center gap-1">⏱️ Chrono Départ</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono ${metrics.dispatchFlow.rating === 'EXCELLENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                  ${metrics.dispatchFlow.rating}
                </span>
              </div>
              <div class="text-base font-black text-slate-900">${metrics.dispatchFlow.totalDispatchTimeSeconds} sec.</div>
              <p class="text-[10px] text-slate-500">Trajet Vestiaires → Stock → Garage : <strong>${metrics.dispatchFlow.totalWalkDistanceMeters}m</strong> (Habillage : ${metrics.dispatchFlow.dressingTimeSeconds}s)</p>
            </div>

            <!-- 2. Capacité d'accueil max (ERP) -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div class="flex items-center justify-between text-xs font-black text-slate-800">
                <span class="flex items-center gap-1">👥 Capacité ERP</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                  ${metrics.capacityMetrics.erpClassification}
                </span>
              </div>
              <div class="text-base font-black text-slate-900">${metrics.capacityMetrics.maxSimultaneousVolunteers} pers. max</div>
              <p class="text-[10px] text-slate-500">${metrics.capacityMetrics.totalUsableSurfaceM2} m² utiles • <strong>${metrics.capacityMetrics.nightDutyBedsCount} lit(s)</strong> garde 24h • <strong>${metrics.capacityMetrics.studentTrainingCapacity}</strong> places cours</p>
            </div>

            <!-- 3. Autonomie en consommables -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div class="flex items-center justify-between text-xs font-black text-slate-800">
                <span class="flex items-center gap-1">🩺 Autonomie Soins</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono ${metrics.supplyMetrics.rating === 'AUTONOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${metrics.supplyMetrics.rating}
                </span>
              </div>
              <div class="text-base font-black text-slate-900">${metrics.supplyMetrics.medicalAutonomyDays} jours</div>
              <p class="text-[10px] text-slate-500">Réserve : <strong>${metrics.supplyMetrics.totalStorageSlots} slots</strong> • Capacité : <strong>${metrics.supplyMetrics.consecutiveDpsAutonomy}</strong> DPS simultanés</p>
            </div>

            <!-- 4. Coûts d'entretien journalier (OPEX) -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div class="flex items-center justify-between text-xs font-black text-slate-800">
                <span class="flex items-center gap-1">💡 OPEX Quotidien</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                  ${metrics.opexMetrics.monthlyProjectionEuro} €/mois
                </span>
              </div>
              <div class="text-base font-black text-slate-900">${metrics.opexMetrics.totalDailyOpexEuro} € / jour</div>
              <p class="text-[10px] text-slate-500">Énergie : ${metrics.opexMetrics.energyCostDaily}€ • Équipements : ${metrics.opexMetrics.equipmentMaintenanceDaily}€ • ERP : ${metrics.opexMetrics.erpSafetyComplianceDaily}€</p>
            </div>
          </div>

          <!-- Recommandations tactiques -->
          ${metrics.recommendations.length > 0 ? `
            <div class="space-y-1.5 pt-1">
              <div class="text-[11px] font-black uppercase text-slate-600 tracking-wider">Conseils d'Optimisation Tactique :</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${metrics.recommendations.map(rec => `
                  <div class="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs flex items-start gap-2 text-slate-800">
                    <span class="text-base flex-shrink-0">${rec.icon}</span>
                    <div class="space-y-0.5">
                      <strong class="font-black text-slate-900 block leading-tight">${rec.title}</strong>
                      <p class="text-[11px] text-slate-600 leading-snug">${rec.text}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    return '';
  },

  renderRoomsListHTML(model) {
    const m = model || this.getArchitectModel();
    return (m.rooms || []).map((rm, idx) => {
      const isSelected = this.selectedRoomId === rm.id;
      return `
        <div onclick="window.ProtecLocaux.selectRoom('${rm.id}')" class="p-2.5 rounded-xl border transition cursor-pointer ${isSelected ? 'bg-blue-50/90 border-pc-blue ring-2 ring-pc-blue/30' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}">
          <div class="flex items-center justify-between text-xs font-black mb-1.5">
            <span class="flex items-center gap-1.5 text-slate-900 truncate">
              <span class="w-5 h-5 rounded-full ${isSelected ? 'bg-pc-blue text-white' : 'bg-slate-200 text-slate-700'} flex items-center justify-center text-[10px] font-mono flex-shrink-0">${idx + 1}</span>
              <span class="truncate">Pièce ${idx + 1} (${rm.area.toFixed(1)} m²)</span>
            </span>
            ${isSelected ? '<span class="text-[9.5px] text-pc-blue font-bold flex-shrink-0">Active ★</span>' : ''}
          </div>
          <select onclick="event.stopPropagation()" onchange="window.ProtecLocaux.assignRoomRole('${rm.id}', this.value)" class="w-full px-2 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-pc-blue">
            <option value="libre" ${rm.type === 'libre' ? 'selected' : ''}>⚪ Salle Libre (Non affectée)</option>
            <option value="bureau" ${rm.type === 'bureau' ? 'selected' : ''}>💼 Accueil & Direction</option>
            <option value="formation" ${rm.type === 'formation' ? 'selected' : ''}>🎓 Formation PSC1 & DPS</option>
            <option value="stockage" ${rm.type === 'stockage' ? 'selected' : ''}>📦 Réserve Lots A/B & Vestiaires</option>
            <option value="detente" ${rm.type === 'detente' ? 'selected' : ''}>☕ Foyer & Détente</option>
            <option value="dortoir" ${rm.type === 'dortoir' ? 'selected' : ''}>🛏️ Dortoir de Garde</option>
            <option value="vestiaires" ${rm.type === 'vestiaires' ? 'selected' : ''}>🚿 Vestiaires & Sanitaires</option>
          </select>
        </div>
      `;
    }).join('');
  },

  selectRoom(roomId) {
    this.selectedRoomId = roomId;
    this.renderArchitectScene();
    const container = document.getElementById('starter-rooms-list');
    if (container) {
      container.innerHTML = this.renderRoomsListHTML();
    }
    const contextBar = document.getElementById('canvas-context-bar');
    if (contextBar && !this.selectedFurnitureId) {
      const model = this.getArchitectModel();
      const rm = (model.rooms || []).find(r => r.id === roomId);
      if (rm) {
        contextBar.innerHTML = `
          <span class="flex items-center gap-1.5 font-bold text-blue-300">
            <span>🏛️</span>
            <span>Salle active : <strong>${rm.name.split('\n')[0]}</strong> (${rm.area.toFixed(1)} m²)</span>
          </span>
        `;
      }
    }
  },

  assignRoomRole(roomId, newRole) {
    const model = this.getArchitectModel();
    const room = (model.rooms || []).find(r => r.id === roomId);
    if (!room) return;

    room.type = newRole;
    const roomIdx = (model.rooms || []).findIndex(r => r.id === roomId) + 1;
    const titles = {
      libre: `Salle ${roomIdx || 1} (Libre)\n(Non affectée)`,
      bureau: 'Accueil & Direction\n(Poste de Commandement)',
      formation: 'Salle de Formation & DPS\n(Pédagogie Citoyenne)',
      stockage: 'Réserve Lots A/B & Vestiaires\n(Pharmacie & Casiers F1)',
      detente: 'Foyer & Détente\n(Espace Convivial Bénévoles)',
      dortoir: 'Dortoir d\'Astreinte\n(Garde SAMU 15 / CUMP)',
      vestiaires: 'Vestiaires Opérationnels\n(Casiers & Sanitaires)'
    };
    const colors = {
      libre: '#131824',
      bureau: '#161d2b',
      formation: '#141a26',
      stockage: '#181b2a',
      detente: '#14241e',
      dortoir: '#22182c',
      vestiaires: '#131e28'
    };

    room.name = titles[newRole] || `Salle ${roomIdx || 1} (Libre)\n(Non affectée)`;
    room.color = colors[newRole] || '#131824';

    this.selectRoom(roomId);
    this.renderArchitectScene();
  },

  addDoorItem(wall = 'W') {
    const cost = 120;
    const game = window.game;
    if (game && game.resources) {
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour poser une porte intérieure. Solde : ${game.resources.money.toLocaleString('fr-FR')} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Porte Installée (-120 €)', 'Nouvelle porte intérieure positionnée sur le plan.', 'blue');
    }

    const model = this.getArchitectModel();
    const newDoor = {
      id: `d_${Date.now()}`,
      x: wall === 'W' ? 6.2 : (wall === 'E' ? 15.6 : 10.8),
      y: 4.5,
      len: 0.83,
      wall: wall,
      label: 'Porte Intérieure (83cm)',
      isMain: false
    };
    model.doors.push(newDoor);
    this.renderArchitectScene();
    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
  },

  addWindowItem(wall = 'N') {
    const cost = 180;
    const game = window.game;
    if (game && game.resources) {
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour poser une ouverture vitrée. Solde : ${game.resources.money.toLocaleString('fr-FR')} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Fenêtre Installée (-180 €)', 'Nouvelle ouverture double vitrage posée.', 'cyan');
    }

    const model = this.getArchitectModel();
    const newWindow = {
      id: `w_${Date.now()}`,
      x: wall === 'N' ? 10.0 : 15.6,
      y: wall === 'N' ? 1.5 : 5.0,
      len: 1.40,
      wall: wall,
      label: 'Fenêtre (1.40m)'
    };
    model.windows.push(newWindow);
    this.renderArchitectScene();
    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
  },

  addCustomRoom() {
    const cost = 2500;
    const game = window.game;
    if (game && game.resources) {
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', `La construction d'une extension de 16 m² requiert ${cost.toLocaleString('fr-FR')} €. Solde : ${game.resources.money.toLocaleString('fr-FR')} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Extension Bâtie (-2 500 €)', 'Extension créée : Nouvelle salle disponible (+16 m²).', 'green');
    }

    const model = this.getArchitectModel();
    const count = (model.rooms || []).length;
    const newRoomId = `room_${count + 1}`;
    
    // Positionner une 4ème pièce (Foyer ou Dortoir)
    const newRoom = {
      id: newRoomId,
      type: 'detente',
      name: 'Foyer & Détente Bénévoles\n(Espace Convivial)',
      x: 6.2,
      y: 10.5,
      w: 4.6,
      h: 3.5,
      area: 16.1,
      color: '#14241e'
    };
    model.rooms.push(newRoom);
    
    // Étendre les murs
    model.walls.push(
      { x1: 6.2, y1: 10.5, x2: 6.2, y2: 14.0, th: 0.24, outer: true },
      { x1: 6.2, y1: 14.0, x2: 10.8, y2: 14.0, th: 0.24, outer: true },
      { x1: 10.8, y1: 14.0, x2: 10.8, y2: 10.5, th: 0.24, outer: true }
    );
    // Porte d'accès
    model.doors.push({
      id: `d_foyer_${Date.now()}`,
      x: 8.0,
      y: 10.5,
      len: 0.83,
      wall: 'N',
      label: 'Porte Foyer (83cm)',
      isMain: false
    });

    this.selectRoom(newRoomId);
    this.fitView();
    this.renderArchitectScene();
    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
  },

  addFurnitureItem(type) {
    const catalogItem = this.FURNITURE_CATALOG.find(c => c.type === type);
    if (!catalogItem) return;

    const game = window.game;
    if (game && game.resources) {
      if (game.resources.money < catalogItem.cost) {
        game.showToast('Trésorerie Insuffisante', `Il vous faut ${catalogItem.cost} € pour acheter « ${catalogItem.name} ». Solde disponible : ${game.resources.money.toLocaleString('fr-FR')} €.`, 'orange');
        return;
      }
      game.resources.money -= catalogItem.cost;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Mobilier Acquis (-' + catalogItem.cost + ' €)', `« ${catalogItem.name} » ajouté à votre caserne.`, 'blue');
    }

    const model = this.getArchitectModel();
    const room = (model.rooms || []).find(r => r.id === this.selectedRoomId) || model.rooms[0];
    if (!room) return;

    const newItem = {
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      roomId: room.id,
      type: type,
      x: room.x + (room.w - catalogItem.w) / 2 + (Math.random() - 0.5) * 0.4,
      y: room.y + (room.h - catalogItem.d) / 2 + (Math.random() - 0.5) * 0.4,
      w: catalogItem.w,
      d: catalogItem.d,
      color: catalogItem.color,
      label: catalogItem.name,
      rotation: 0
    };

    model.furniture.push(newItem);
    this.selectedFurnitureId = newItem.id;
    this.renderArchitectScene();

    // Mettre à jour la barre contextuelle
    const contextBar = document.getElementById('canvas-context-bar');
    if (contextBar) {
      contextBar.innerHTML = `
        <span class="flex items-center gap-1.5 font-bold text-amber-300">
          <span>🛋️</span>
          <span>Objet : <strong>${newItem.label}</strong></span>
        </span>
        <div class="h-4 w-[1px] bg-slate-700"></div>
        <button type="button" onclick="window.ProtecLocaux.rotateSelectedItem()" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition">
          <span>🔄</span> Pivoter [R] (Gratuit)
        </button>
        <button type="button" onclick="window.ProtecLocaux.deleteSelectedItem()" class="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 transition">
          <span>🗑️</span> Revendre [Suppr] (50%)
        </button>
      `;
    }

    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
  },

  rotateSelectedItem() {
    if (!this.selectedFurnitureId) return;
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === this.selectedFurnitureId);
    if (!item) return;
    item.rotation = ((item.rotation || 0) + Math.PI / 2) % (Math.PI * 2);
    const tmp = item.w;
    item.w = item.d;
    item.d = tmp;
    this.renderArchitectScene();
  },

  deleteSelectedItem() {
    if (!this.selectedFurnitureId) return;
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === this.selectedFurnitureId);
    if (!item) return;

    // Remboursement à 50% de la valeur d'achat
    const catItem = this.FURNITURE_CATALOG.find(c => c.type === item.type);
    const refund = catItem ? Math.round(catItem.cost * 0.5) : 0;
    const game = window.game;
    if (game && game.resources && refund > 0) {
      game.resources.money += refund;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Mobilier Revendu (+' + refund + ' €)', `« ${item.label} » revendu à 50% de son prix d'achat.`, 'green');
    }

    model.furniture = (model.furniture || []).filter(f => f.id !== this.selectedFurnitureId);
    this.selectedFurnitureId = null;
    this.renderArchitectScene();

    const contextBar = document.getElementById('canvas-context-bar');
    if (contextBar) {
      contextBar.innerHTML = `
        <span class="text-slate-300 text-[11px] font-medium flex items-center gap-1.5">
          <span>💡</span>
          <span>Cliquez sur un meuble pour le déplacer (gratuit) ou pivoter [R] • Cliquez sur une pièce pour l'aménager</span>
        </span>
      `;
    }

    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
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
  // 1. ONGLET PLAN D'ARCHITECTE 2D & 3D INTERACTIF
  // =========================================================================

  renderPlanTab(game, premises, stats) {
    const isOwner = premises.tenure === 'owned';

    // Déclenchement réactif de l'initialisation du Canvas après le rendu dans le DOM
    requestAnimationFrame(() => {
      this.initArchitectCanvas();
    });
    setTimeout(() => { this.initArchitectCanvas(); }, 60);
    setTimeout(() => { this.initArchitectCanvas(); }, 200);

    return `
      <div class="space-y-4">
        
        <!-- Barre supérieure : Alertes & Statut de Propriété -->
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
                <span>Aménagements Verrouillés (Bail Locatif)</span>
              </button>
            `}

            <!-- Indicateur de surface totale et hauteur sous plafond -->
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              <span>Hauteur sous plafond : <strong>2.80 m</strong></span>
              <span>•</span>
              <span>Surface Bâtiment : <strong class="text-pc-blue">84.6 m²</strong></span>
              <span>•</span>
              <span>Cour & Parking : <strong class="text-amber-600">43.2 m²</strong></span>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="flex items-center gap-2 text-xs font-bold">
            <button onclick="window.ProtecLocaux.resetCamera()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5">
              <span>🎯</span> Recentrer la Vue
            </button>
            <button onclick="window.ProtecLocaux.showTechnicalSpecsModal(window.game)" class="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5">
              <span class="font-mono text-cyan-400">{ }</span> Fiche Technique
            </button>
          </div>
        </div>

        <!-- Avertissement pédagogique si Locataire -->
        ${!isOwner ? `
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 text-xs flex items-start justify-between gap-3">
            <div class="flex items-start gap-2.5">
              <i data-lucide="alert-circle" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
              <div class="space-y-0.5">
                <strong class="font-black text-amber-900 block">Locataire sous Convention Municipale</strong>
                <p class="text-[11px] text-amber-800 leading-relaxed">
                  En location, le bailleur vous interdit de casser les cloisons ou de modifier la structure. Pour aménager librement la caserne, rachetez les murs.
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
                <span>🖌️</span> Palette d'Aménagement : Sélectionnez l'espace à réaffecter
              </span>
              <span class="text-[11px] text-slate-400">Devis et délai de chantier pris en compte en temps réel</span>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              ${Object.values(this.ZONE_TYPES).filter(z => z.id !== 'vide').map(z => {
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

        <!-- ========================================================================= -->
        <!-- ZONE VISUALISEUR D'ARCHITECTE 2D / 3D TEMPS RÉEL (IDENTIQUE AU MODÈLE)    -->
        <!-- ========================================================================= -->
        <div class="relative w-full h-[540px] sm:h-[600px] rounded-3xl bg-[#0b0f19] border-2 border-slate-800 shadow-2xl overflow-hidden select-none">
          
          <!-- CANVAS PRINCIPAL HAUTE DÉFINITION -->
          <canvas id="architect-canvas" class="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>

          <!-- 1. En-tête gauche : Badge Plan 2D & Statut En direct -->
          <div class="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-lg text-xs font-bold text-white pointer-events-none">
            <span class="text-blue-400 text-sm">📐</span>
            <span>Plan 2D CAD</span>
            <span class="flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              En direct (1)
            </span>
          </div>

          <!-- 2. En-tête centre : Badge 2D -->
          <div class="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-xl text-xs font-black text-slate-200 pointer-events-none">
            <span class="text-blue-400 mr-1.5">📐</span> Plan d'Architecte 2D
          </div>

          <!-- 3. En-tête droite : Boutons + et { } -->
          <div class="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
            <button onclick="window.ProtecLocaux.showAddElementModal(window.game)" class="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 flex items-center justify-center font-black text-lg shadow-lg transition active:scale-95" title="Ajouter un équipement ou mobilier">
              +
            </button>
            <button onclick="window.ProtecLocaux.showTechnicalSpecsModal(window.game)" class="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 flex items-center justify-center font-mono font-bold text-sm shadow-lg transition active:scale-95" title="Fiche technique & cotes d'architecte">
              { }
            </button>
          </div>

          <!-- 4. Barre d'outils latérale droite (Flottante sombre) -->
          <div class="absolute top-1/2 -translate-y-1/2 right-3.5 z-20 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-2xl">
            <!-- Crayon / Éditer -->
            <button onclick="window.ProtecLocaux.toggleEditMode(window.game)" class="w-8 h-8 rounded-xl flex items-center justify-center transition ${this.isEditing ? 'bg-amber-500 text-white shadow-md animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'}" title="${isOwner ? 'Réaménager cloisons' : 'Aménagement interdit en location'}">
              ✏️
            </button>
            <!-- Aimant Snap / Magnétisme -->
            <button onclick="window.ProtecLocaux.toggleMagnet()" class="w-8 h-8 rounded-xl flex items-center justify-center transition ${this.snapToGrid ? 'bg-blue-600 text-white shadow-md shadow-blue-500/50 ring-2 ring-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}" title="Magnétisme Grille (Snap)">
              🧲
            </button>
            <div class="w-5 h-[1px] bg-slate-700/80 my-0.5"></div>
            <!-- Zoom + -->
            <button onclick="window.ProtecLocaux.zoomCamera(1.2)" class="w-8 h-8 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center font-black text-base transition" title="Zoom avant">
              +
            </button>
            <!-- Zoom - -->
            <button onclick="window.ProtecLocaux.zoomCamera(0.8)" class="w-8 h-8 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center font-black text-base transition" title="Zoom arrière">
              −
            </button>
            <!-- Centrer caméra -->
            <button onclick="window.ProtecLocaux.resetCamera()" class="w-8 h-8 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-slate-800 flex items-center justify-center transition" title="Recentrer la vue">
              🎯
            </button>
          </div>

          <!-- 5. Barre d'astuces contextuelle inférieure -->
          <div class="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur border border-slate-700/70 shadow-xl text-[11px] font-semibold text-slate-300 pointer-events-none flex items-center gap-2 text-center whitespace-nowrap">
            Clic pour sélectionner • Clic droit / Molette: Vue • [R] Pivoter (Gratuit) • Glisser: Déplacer (Gratuit)
          </div>

        </div>

        <!-- Récapitulatif des Espaces Aménagés de la Caserne -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div class="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1">
            <div class="flex items-center justify-between font-black text-slate-200">
              <span>🚗 Parking Opérationnel</span>
              <span class="text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono">43.2 m²</span>
            </div>
            <p class="text-[10px] text-slate-400 leading-tight">4.8m × 9.0m • 2 places d'ambulance VPSP 01 / VTU 01 et accès cour.</p>
          </div>

          <div class="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1">
            <div class="flex items-center justify-between font-black text-slate-200">
              <span>💼 Accueil & Direction</span>
              <span class="text-pc-blue bg-blue-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono">19.3 m²</span>
            </div>
            <p class="text-[10px] text-slate-400 leading-tight">4.6m × 4.2m • Direction opérationnelle, accueil et régulation DPS.</p>
          </div>

          <div class="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1">
            <div class="flex items-center justify-between font-black text-slate-200">
              <span>🎓 Salle de Formation</span>
              <span class="text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono">20.2 m²</span>
            </div>
            <p class="text-[10px] text-slate-400 leading-tight">4.8m × 4.2m • Formations secouristes PSC1, SST et recyclages PSE.</p>
          </div>

          <div class="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1">
            <div class="flex items-center justify-between font-black text-slate-200">
              <span>📦 Réserve Lots & Vestiaires</span>
              <span class="text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono">45.1 m²</span>
            </div>
            <p class="text-[10px] text-slate-400 leading-tight">9.4m × 4.8m • Lots de secours A/B, pharmacie, casiers tenues F1.</p>
          </div>
        </div>

      </div>
    `;
  },

  // =========================================================================
  // MOTEUR GRAPHIQUE ARCHITECTE 2D TEMPS RÉEL (CANVAS RENDERING ENGINE)
  // =========================================================================

  setDimensionMode(mode) {
    this.dimensionMode = '2d'; // Vue 3D désactivée pour le moment
    this.renderModal(window.game);
  },

  toggleMagnet() {
    this.snapToGrid = !this.snapToGrid;
    if (window.game) {
      window.game.showToast('Magnétisme Grille', this.snapToGrid ? 'Snap actif (précision 0.1m)' : 'Snap désactivé (placement libre)', 'blue');
    }
    this.renderArchitectScene();
  },

  zoomCamera(factor) {
    this.camera2D.zoom = Math.max(20, Math.min(100, this.camera2D.zoom * factor));
    this.renderArchitectScene();
  },

  fitView(width, height) {
    const canvas = document.getElementById('architect-canvas');
    const w = width || (canvas ? canvas.width : 800);
    const h = height || (canvas ? canvas.height : 500);

    // Le complexe complet (parking + bâtiment) va de x: 0.8 à 15.8 (largeur ~15m) et y: 1.2 à 10.8 (hauteur ~9.6m).
    // On calibre le zoom pour afficher l'ensemble avec un dégagement suffisant
    const scaleX = (w * 0.82) / 16.5;
    const scaleY = ((h - 70) * 0.82) / 11.0;
    const optimalScale = Math.max(16, Math.min(38, Math.min(scaleX, scaleY)));

    this.camera2D = {
      zoom: optimalScale,
      panX: 0,
      panY: -32 // Remonté pour ne pas masquer le mur sud / TGBT par la barre contextuelle
    };
    this.camera3D = {
      yaw: -0.72,
      pitch: 0.62,
      zoom: optimalScale * 1.35,
      panX: 0,
      panY: -15
    };
  },

  resetCamera() {
    this.fitView();
    this.renderArchitectScene();
  },

  initArchitectCanvas() {
    const canvas = document.getElementById('architect-canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const w = (rect.width > 50 ? rect.width : (parent ? parent.clientWidth : 800)) || 800;
    const h = (rect.height > 50 ? rect.height : (parent ? parent.clientHeight : 500)) || 500;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    this.setupCanvasEvents(canvas);
    this.fitView(canvas.width, canvas.height);
    this.renderArchitectScene();
  },

  setupCanvasEvents(canvas) {
    if (window.ResizeObserver && !canvas._resizeObserverBound) {
      canvas._resizeObserverBound = true;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 50 && cr.height > 50) {
            const d = window.devicePixelRatio || 1;
            const newW = Math.round(cr.width * d);
            const newH = Math.round(cr.height * d);
            if (canvas.width !== newW || canvas.height !== newH) {
              canvas.width = newW;
              canvas.height = newH;
              this.fitView(canvas.width, canvas.height);
              this.renderArchitectScene();
            }
          }
        }
      });
      ro.observe(canvas.parentElement || canvas);
    }

    if (canvas._eventsBound) return;
    canvas._eventsBound = true;

    const getMouseWorldPos = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const screenX = (clientX - rect.left) * (canvas.width / rect.width);
      const screenY = (clientY - rect.top) * (canvas.height / rect.height);
      const cx = canvas.width / 2 + this.camera2D.panX;
      const cy = canvas.height / 2 + this.camera2D.panY;
      const scale = this.camera2D.zoom;
      const ox = cx - 8.3 * scale;
      const oy = cy - 6.0 * scale;
      return {
        wx: (screenX - ox) / scale,
        wy: (screenY - oy) / scale,
        screenX,
        screenY
      };
    };

    const onPointerDown = (clientX, clientY, button) => {
      const { wx, wy } = getMouseWorldPos(clientX, clientY);
      const model = this.getArchitectModel();

      if (button === 0) {
        // 1. Détection de clic sur un meuble (mode Les Sims)
        const clickedFurniture = (model.furniture || []).slice().reverse().find(f => {
          return wx >= f.x && wx <= f.x + f.w && wy >= f.y && wy <= f.y + f.d;
        });

        if (clickedFurniture) {
          this.selectedFurnitureId = clickedFurniture.id;
          this.draggingFurniture = clickedFurniture;
          this.dragOffset = { x: clickedFurniture.x - wx, y: clickedFurniture.y - wy };
          if (clickedFurniture.roomId) {
            this.selectedRoomId = clickedFurniture.roomId;
            const roomsList = document.getElementById('starter-rooms-list');
            if (roomsList) roomsList.innerHTML = this.renderRoomsListHTML(model);
          }
          this.renderArchitectScene();
          return;
        }

        // 2. Détection de clic sur une pièce
        const clickedRoom = (model.rooms || []).find(r => {
          return wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h;
        });

        if (clickedRoom) {
          this.selectedFurnitureId = null;
          this.selectRoom(clickedRoom.id);
          this.renderArchitectScene();
          return;
        }
      }

      // 3. Clic dans le vide -> déplacement de la caméra (Pan)
      this.selectedFurnitureId = null;
      this.isDraggingCanvas = true;
      this.dragStart = { x: clientX, y: clientY };
      this.dragButton = button;
      this.renderArchitectScene();
    };

    const onPointerMove = (clientX, clientY) => {
      const { wx, wy } = getMouseWorldPos(clientX, clientY);

      // Déplacement interactif d'un meuble (Les Sims)
      if (this.draggingFurniture) {
        let newX = wx + this.dragOffset.x;
        let newY = wy + this.dragOffset.y;

        if (this.snapToGrid) {
          newX = Math.round(newX * 5) / 5; // précision 0.2m
          newY = Math.round(newY * 5) / 5;
        }

        this.draggingFurniture.x = Math.max(1.0, Math.min(15.2 - this.draggingFurniture.w, newX));
        this.draggingFurniture.y = Math.max(1.5, Math.min(10.3 - this.draggingFurniture.d, newY));

        // Détection automatique de la pièce hôte
        const model = this.getArchitectModel();
        const curRoom = (model.rooms || []).find(r => {
          const mx = this.draggingFurniture.x + this.draggingFurniture.w / 2;
          const my = this.draggingFurniture.y + this.draggingFurniture.d / 2;
          return mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h;
        });

        if (curRoom && curRoom.id !== this.draggingFurniture.roomId) {
          this.draggingFurniture.roomId = curRoom.id;
          this.selectedRoomId = curRoom.id;
          const roomsList = document.getElementById('starter-rooms-list');
          if (roomsList) roomsList.innerHTML = this.renderRoomsListHTML(model);
        }

        this.renderArchitectScene();
        return;
      }

      // Déplacement de la caméra 2D
      if (this.isDraggingCanvas) {
        const dx = clientX - this.dragStart.x;
        const dy = clientY - this.dragStart.y;
        this.dragStart = { x: clientX, y: clientY };

        if (this.dimensionMode === '3d') {
          if (this.dragButton === 2) {
            this.camera3D.panX += dx;
            this.camera3D.panY += dy;
          } else {
            this.camera3D.yaw += dx * 0.008;
            this.camera3D.pitch = Math.max(0.2, Math.min(1.4, this.camera3D.pitch + dy * 0.008));
          }
        } else {
          this.camera2D.panX += dx;
          this.camera2D.panY += dy;
        }

        this.renderArchitectScene();
        return;
      }

      // Curseur dynamique selon survol et tracking du meuble sous le curseur
      const model = this.getArchitectModel();
      const hoveredFurniture = (model.furniture || []).slice().reverse().find(f => {
        return wx >= f.x && wx <= f.x + f.w && wy >= f.y && wy <= f.y + f.d;
      });

      const newHoveredId = hoveredFurniture ? hoveredFurniture.id : null;
      if (this.hoveredFurnitureId !== newHoveredId) {
        this.hoveredFurnitureId = newHoveredId;
        this.renderArchitectScene();
      }

      if (hoveredFurniture) {
        canvas.style.cursor = 'move';
      } else {
        const hoveredRoom = (model.rooms || []).find(r => {
          return wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h;
        });
        canvas.style.cursor = hoveredRoom ? 'pointer' : 'grab';
      }
    };

    const onPointerUp = () => {
      this.draggingFurniture = null;
      this.isDraggingCanvas = false;
    };

    // Souris
    canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY, e.button));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => onPointerUp());
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Molette Zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoomCamera(zoomFactor);
    }, { passive: false });

    // Raccourcis clavier (R pour pivoter, Delete pour retirer)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'r' || e.key === 'R') {
        this.rotateSelectedItem();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelectedItem();
      }
    });

    // Tactile Mobile / Tablette
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY, 0);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchend', () => onPointerUp(), { passive: true });

    // Redimensionnement de fenêtre
    window.addEventListener('resize', () => {
      const c = document.getElementById('architect-canvas');
      if (!c) return;
      const r = c.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      const parent = c.parentElement;
      const w = (r.width > 50 ? r.width : (parent ? parent.clientWidth : 800)) || 800;
      const h = (r.height > 50 ? r.height : (parent ? parent.clientHeight : 500)) || 500;
      c.width = Math.round(w * d);
      c.height = Math.round(h * d);
      this.fitView(c.width, c.height);
      this.renderArchitectScene();
    });
  },

  // Modèle Géométrique CAD Officiel de l'Antenne de Base de la Protection Civile
  getArchitectModel(stationId) {
    if (this._currentSetupModel) {
      return this._currentSetupModel;
    }
    const st = (window.game && window.game.stations)
      ? (window.game.stations.find(s => s.id === stationId) || window.game.stations[0])
      : null;
    if (st && st.premises && st.premises.architecture) {
      const arch = st.premises.architecture;
      // Migration douce : si l'antenne a encore les anciens noms par défaut de démonstration, les passer en "Libre"
      if (arch.rooms) {
        arch.rooms.forEach((r, idx) => {
          if (r.name && (r.name.includes('Accueil Public & Direction') || r.name.includes('Salle de Formation & DPS') || r.name.includes('Réserve Lots A/B & Vestiaires'))) {
            r.type = 'libre';
            r.name = `Salle ${idx + 1} (Libre)\n(Non affectée)`;
            r.color = '#121722';
          }
        });
      }
      if (arch.parking && arch.parking.spots) {
        arch.parking.spots.forEach((sp, idx) => {
          if (sp.label && (sp.label.includes('VPSP 01') || sp.label.includes('VTU 01'))) {
            sp.label = `🅿️ EMPLACEMENT LIBRE 0${idx + 1}`;
          }
        });
      }
      return arch;
    }

    return {
      // 1. Parking opérationnel extérieur (places libres par défaut)
      parking: {
        x: 1.0,
        y: 1.5,
        w: 4.8,
        h: 9.0,
        label: 'Parking Opérationnel Extérieur',
        spots: [
          { id: 'spot_1', label: '🅿️ EMPLACEMENT LIBRE 01', x: 1.4, y: 2.2, w: 4.0, d: 2.4 },
          { id: 'spot_2', label: '🅿️ EMPLACEMENT LIBRE 02', x: 1.4, y: 5.6, w: 4.0, d: 2.4 }
        ]
      },
      // 2. Les 3 pièces intérieures libres par défaut (aménagement et affectation par le joueur)
      rooms: [
        {
          id: 'room_1',
          type: 'libre',
          name: 'Salle 1 (Libre)\n(Non affectée)',
          x: 6.2,
          y: 1.5,
          w: 4.6,
          h: 4.2,
          area: 19.3,
          color: '#121722'
        },
        {
          id: 'room_2',
          type: 'libre',
          name: 'Salle 2 (Libre)\n(Non affectée)',
          x: 10.8,
          y: 1.5,
          w: 4.8,
          h: 4.2,
          area: 20.2,
          color: '#121722'
        },
        {
          id: 'room_3',
          type: 'libre',
          name: 'Salle 3 (Libre)\n(Non affectée)',
          x: 6.2,
          y: 5.7,
          w: 9.4,
          h: 4.8,
          area: 45.1,
          color: '#121722'
        }
      ],
      // 3. Murs porteurs extérieurs et cloisons intérieures
      walls: [
        // Murs extérieurs porteurs (épaisseur 0.24m)
        { x1: 6.2, y1: 1.5, x2: 15.6, y2: 1.5, th: 0.24, outer: true },
        { x1: 15.6, y1: 1.5, x2: 15.6, y2: 10.5, th: 0.24, outer: true },
        { x1: 15.6, y1: 10.5, x2: 6.2, y2: 10.5, th: 0.24, outer: true },
        { x1: 6.2, y1: 10.5, x2: 6.2, y2: 1.5, th: 0.24, outer: true },
        // Cloisons intérieures (épaisseur 0.12m)
        { x1: 10.8, y1: 1.5, x2: 10.8, y2: 5.7, th: 0.12, outer: false },
        { x1: 6.2, y1: 5.7, x2: 15.6, y2: 5.7, th: 0.12, outer: false }
      ],
      // 4. Portes réelles avec sens d'ouverture et cotes d'architecte
      doors: [
        { id: 'd_entree', x: 6.2, y: 2.2, len: 0.93, wall: 'W', label: 'Porte d’Entrée (93cm)', isMain: true },
        { id: 'd_form', x: 10.8, y: 3.2, len: 0.83, wall: 'W', label: 'Porte Formation (83cm)', isMain: false },
        { id: 'd_reserve', x: 8.2, y: 5.7, len: 0.83, wall: 'N', label: 'Porte Réserve (83cm)', isMain: false },
        { id: 'd_service', x: 6.2, y: 7.6, len: 0.93, wall: 'W', label: 'Accès Matériel (93cm)', isMain: false }
      ],
      // 5. Fenêtres extérieures cyan avec cotes
      windows: [
        { id: 'w_bureau', x: 7.4, y: 1.5, len: 1.60, wall: 'N', label: 'Fenêtre Accueil (1.60m)' },
        { id: 'w_form_n', x: 12.0, y: 1.5, len: 1.80, wall: 'N', label: 'Baie Formation (1.80m)' },
        { id: 'w_form_e', x: 15.6, y: 2.8, len: 1.40, wall: 'E', label: 'Fenêtre Est (1.40m)' },
        { id: 'w_res_s', x: 8.4, y: 10.5, len: 1.60, wall: 'S', label: 'Fenêtre Haute Sud (1.60m)' },
        { id: 'w_res_e', x: 15.6, y: 7.5, len: 1.60, wall: 'E', label: 'Fenêtre Haute Est (1.60m)' }
      ],
      // 6. Équipements techniques fixes (radiateurs, TGBT, extincteurs)
      fixtures: [
        { id: 'rad_bureau', x: 9.3, y: 1.5, len: 0.90, wall: 'N', label: 'Radiateur', type: 'radiator' },
        { id: 'rad_form', x: 14.0, y: 1.5, len: 1.10, wall: 'N', label: 'Radiateur', type: 'radiator' },
        { id: 'rad_reserve', x: 12.5, y: 10.5, len: 1.20, wall: 'S', label: 'Aérotherme', type: 'radiator' },
        { id: 'tgbt', x: 6.3, y: 9.8, w: 0.50, h: 0.35, label: 'TGBT', type: 'duct' },
        { id: 'extincteur_1', x: 6.3, y: 5.8, w: 0.25, h: 0.25, label: 'EXT', type: 'extinguisher' },
        { id: 'extincteur_2', x: 10.9, y: 5.3, w: 0.25, h: 0.25, label: 'EXT', type: 'extinguisher' }
      ],
      // 7. Mobilier (Initialement vide : au joueur d'aménager son antenne)
      furniture: []
    };
  },

  // Rendu global de la scène selon le mode actif (2D ou 3D)
  renderArchitectScene() {
    const canvas = document.getElementById('architect-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.dimensionMode === '3d') {
      this.render3D(ctx, w, h);
    } else {
      this.render2D(ctx, w, h);
    }
  },

  // =========================================================================
  // RENDU 2D ARCHITECTURAL STYLE CAD (CONFORME À LA MAQUETTE OFFICIELLE)
  // =========================================================================

  render2D(ctx, width, height) {
    const model = this.getArchitectModel();
    const cx = width / 2 + this.camera2D.panX;
    const cy = height / 2 + this.camera2D.panY;
    const scale = this.camera2D.zoom;

    // 1. Fond sombre CAD et grille millimétrée
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);

    // Grille 0.5m et 1.0m
    ctx.lineWidth = 1;
    const gridSize = 1.0 * scale;
    const startX = (cx % gridSize);
    const startY = (cy % gridSize);

    ctx.strokeStyle = '#121927';
    ctx.beginPath();
    for (let x = startX - gridSize; x < width + gridSize; x += gridSize / 2) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = startY - gridSize; y < height + gridSize; y += gridSize / 2) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#1b2438';
    ctx.beginPath();
    for (let x = startX - gridSize; x < width + gridSize; x += gridSize) {
      ctx.moveTo(x, 0); ctx.lineTo(x, height);
    }
    for (let y = startY - gridSize; y < height + gridSize; y += gridSize) {
      ctx.moveTo(0, y); ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Centrage du complexe (centre vers x=8.3m, y=6.0m)
    const ox = cx - 8.3 * scale;
    const oy = cy - 6.0 * scale;

    // 2. Tracé de la zone extérieure : Parking Opérationnel 2 places
    if (model.parking) {
      const pk = model.parking;
      const px = ox + pk.x * scale;
      const py = oy + pk.y * scale;
      const pw = pk.w * scale;
      const ph = pk.h * scale;

      // Sol bitumé d'antenne
      ctx.fillStyle = '#111724';
      ctx.fillRect(px, py, pw, ph);

      // Bordure extérieure de la cour
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.setLineDash([]);

      // Titre de la zone parking
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pk.label.toUpperCase(), px + pw / 2, py + 14);

      // Tracé des emplacements de parking
      const game = window.game;
      const st = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
      const stVehs = (game && game.vehicles && st) ? game.vehicles.filter(v => (st.vehicles || []).includes(v.id)) : [];

      (pk.spots || []).forEach((spot, idx) => {
        const sx = ox + spot.x * scale;
        const sy = oy + spot.y * scale;
        const sw = spot.w * scale;
        const sd = spot.d * scale;

        // Tracé au sol jaune/orange sécurité
        ctx.fillStyle = 'rgba(234, 88, 12, 0.06)';
        ctx.fillRect(sx, sy, sw, sd);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(sx, sy, sw, sd);
        ctx.setLineDash([]);

        // Libellé de l'emplacement au sol
        const assignedVeh = stVehs[idx];
        const displayLabel = assignedVeh ? `🚑 ${assignedVeh.name} (${assignedVeh.type})` : (spot.label || `🅿️ EMPLACEMENT LIBRE 0${idx + 1}`);

        ctx.fillStyle = assignedVeh ? '#38bdf8' : '#fbbf24';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(displayLabel, sx + sw / 2, sy + sd / 2);
      });
    }

    // 3. Tracé des sols des 3 pièces intérieures
    model.rooms.forEach(r => {
      const rx = ox + r.x * scale;
      const ry = oy + r.y * scale;
      const rw = r.w * scale;
      const rh = r.h * scale;
      const isSelected = this.selectedRoomId === r.id;

      ctx.fillStyle = r.color;
      ctx.fillRect(rx, ry, rw, rh);

      // Si la pièce est sélectionnée par le joueur, surbrillance néon
      if (isSelected) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(rx, ry, rw, rh);

        // Lueur néon
        ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
        ctx.fillRect(rx, ry, rw, rh);
      }

      // Cartouche discret d'identification de la pièce (centré au milieu de la pièce)
      const roomTitle = r.name.split('\n')[0];
      const roomSubtitle = `${r.area.toFixed(1)} m² • ${r.w.toFixed(1)}m × ${r.h.toFixed(1)}m`;
      
      const badgeW = Math.min(rw - 16, 200);
      const badgeH = 34;
      const badgeX = rx + rw / 2 - badgeW / 2;
      const badgeY = ry + rh / 2 - badgeH / 2;

      ctx.fillStyle = isSelected ? 'rgba(30, 58, 138, 0.85)' : 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      else ctx.rect(badgeX, badgeY, badgeW, badgeH);
      ctx.fill();

      ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomTitle, rx + rw / 2, badgeY + 11);

      ctx.fillStyle = isSelected ? '#93c5fd' : '#94a3b8';
      ctx.font = '600 9.5px monospace';
      ctx.fillText(roomSubtitle, rx + rw / 2, badgeY + 24);
    });

    // 4. Tracé des murs porteurs et cloisons (double trait ardoise CAD)
    model.walls.forEach(w => {
      const x1 = ox + w.x1 * scale;
      const y1 = oy + w.y1 * scale;
      const x2 = ox + w.x2 * scale;
      const y2 = oy + w.y2 * scale;
      const th = Math.max(4, w.th * scale);

      ctx.strokeStyle = '#273349';
      ctx.lineWidth = th;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Bords clairs CAD
      ctx.strokeStyle = w.outer ? '#475569' : '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    // 5. Tracé des portes avec arc de débattement et battant marron
    model.doors.forEach(d => {
      const dx = ox + d.x * scale;
      const dy = oy + d.y * scale;
      const dlen = d.len * scale;

      // Battant de porte ouvert à 90° (marron bois)
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dx, dy);

      if (d.wall === 'W') {
        ctx.lineTo(dx + dlen, dy);
      } else if (d.wall === 'E') {
        ctx.lineTo(dx - dlen, dy);
      } else if (d.wall === 'S') {
        ctx.lineTo(dx, dy - dlen);
      } else {
        ctx.lineTo(dx, dy + dlen);
      }
      ctx.stroke();

      // Arc de débattement en tirets blancs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      if (d.wall === 'W') {
        ctx.arc(dx, dy, dlen, 0, Math.PI / 2, false);
      } else if (d.wall === 'E') {
        ctx.arc(dx, dy, dlen, Math.PI, Math.PI * 1.5, false);
      } else if (d.wall === 'S') {
        ctx.arc(dx, dy, dlen, Math.PI * 1.5, Math.PI * 2, false);
      } else {
        ctx.arc(dx, dy, dlen, 0, Math.PI / 2, false);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Cote de porte
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      if (d.wall === 'W' || d.wall === 'E') {
        ctx.save();
        ctx.translate(dx + (d.wall === 'W' ? -8 : 8), dy + dlen / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(d.label, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(d.label, dx + dlen / 2, dy - 8);
      }
    });

    // 6. Tracé des fenêtres (cyan double vitrage avec cotes dégagées)
    model.windows.forEach(w => {
      const wx = ox + w.x * scale;
      const wy = oy + w.y * scale;
      const wlen = w.len * scale;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      if (w.wall === 'N' || w.wall === 'S') {
        ctx.moveTo(wx, wy); ctx.lineTo(wx + wlen, wy);
      } else {
        ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wlen);
      }
      ctx.stroke();

      // Cote de fenêtre (bien dégagée à l'extérieur des murs)
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      if (w.wall === 'N' || w.wall === 'S') {
        ctx.fillText(w.label, wx + wlen / 2, wy + (w.wall === 'N' ? -13 : 15));
      } else {
        ctx.save();
        ctx.translate(wx + (w.wall === 'W' ? -12 : 14), wy + wlen / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(w.label, 0, 0);
        ctx.restore();
      }
    });

    // 7. Tracé des équipements techniques fixes (radiateurs, extincteurs, TGBT)
    model.fixtures.forEach(f => {
      if (f.type === 'radiator') {
        const fx = ox + f.x * scale;
        const fy = oy + f.y * scale;
        const flen = f.len * scale;

        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 4;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        if (f.wall === 'N' || f.wall === 'S') {
          ctx.moveTo(fx, fy + (f.wall === 'N' ? 5 : -5));
          ctx.lineTo(fx + flen, fy + (f.wall === 'N' ? 5 : -5));
        } else {
          ctx.moveTo(fx + (f.wall === 'W' ? 5 : -5), fy);
          ctx.lineTo(fx + (f.wall === 'W' ? 5 : -5), fy + flen);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // Symbole technique strié épuré (sans texte parasite orange qui masque les ouvertures)
      } else if (f.type === 'duct' || f.type === 'extinguisher') {
        const px = ox + f.x * scale;
        const py = oy + f.y * scale;
        const pw = f.w * scale;
        const ph = f.h * scale;

        ctx.fillStyle = f.type === 'extinguisher' ? '#dc2626' : '#1e293b';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = f.type === 'extinguisher' ? '#ef4444' : '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px, py, pw, ph);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(f.label, px + pw / 2, py + ph / 2 + 3);
      }
    });

    // 8. Tracé du mobilier en vue de dessus détaillée (style Les Sims)
    (model.furniture || []).forEach(item => {
      const ix = ox + item.x * scale;
      const iy = oy + item.y * scale;
      const iw = item.w * scale;
      const ih = item.d * scale;
      const isSelected = this.selectedFurnitureId === item.id;

      // Ombre portée du meuble
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(ix + 2, iy + 2, iw, ih);

      // Corps du meuble
      ctx.fillStyle = item.color || '#334155';
      ctx.fillRect(ix, iy, iw, ih);

      // Bordure intérieure
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(ix, iy, iw, ih);

      // Détails graphiques selon le type
      if (item.type === 'mannequin_rcp') {
        // Tête et torse
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(ix + iw / 2, iy + ih * 0.25, Math.min(iw, ih) * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'dae_mural') {
        // Croix ou flash
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.4, iy + ih * 0.2, iw * 0.2, ih * 0.6);
        ctx.fillRect(ix + iw * 0.2, iy + ih * 0.4, iw * 0.6, ih * 0.2);
      } else if (item.type === 'armoire_pharmacie') {
        // Croix rouge
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.45, iy + ih * 0.25, iw * 0.1, ih * 0.5);
        ctx.fillRect(ix + iw * 0.3, iy + ih * 0.45, iw * 0.4, ih * 0.1);
      } else if (item.type === 'etagere_lots') {
        // Rayonnages
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ix, iy + ih * 0.33); ctx.lineTo(ix + iw, iy + ih * 0.33);
        ctx.moveTo(ix, iy + ih * 0.66); ctx.lineTo(ix + iw, iy + ih * 0.66);
        ctx.stroke();
      } else if (item.type === 'lit_garde') {
        // Oreiller
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.15, iy + ih * 0.08, iw * 0.7, ih * 0.25);
      }

      // Si le meuble est sélectionné ou survolé : surbrillance + cartouche d'information
      const isHovered = this.hoveredFurnitureId === item.id;
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#67e8f9';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.setLineDash(isSelected ? [4, 4] : []);
        ctx.strokeRect(ix - 3, iy - 3, iw + 6, ih + 6);
        ctx.setLineDash([]);

        if (isSelected) {
          // Poignée de rotation au sommet
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(ix + iw / 2, iy - 10, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Cartouche flottante informative au-dessus de l'objet
        const infoText = `${item.label} (${item.w.toFixed(1)}m × ${item.d.toFixed(1)}m)`;
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        const cardW = ctx.measureText(infoText).width + 16;
        const cardH = 22;
        const cardX = Math.max(8, Math.min(width - cardW - 8, ix + iw / 2 - cardW / 2));
        const cardY = iy - (isSelected ? 32 : 26);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 5);
        else ctx.rect(cardX, cardY, cardW, cardH);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(infoText, cardX + cardW / 2, cardY + cardH / 2);
      }
    });
  },

  // =========================================================================
  // RENDU 3D ISOMÉTRIQUE TEMPS RÉEL VOLUMÉTRIQUE (CONFORME À L'IMAGE 1)
  // =========================================================================

  render3D(ctx, width, height) {
    const model = this.getArchitectModel();
    const cx = width / 2 + this.camera3D.panX;
    const cy = height / 2 + this.camera3D.panY;
    const cam = this.camera3D;

    // 1. Fond sombre élégant de scène 3D
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // 2. Dalle de sol du bâtiment 3D (adaptée aux dimensions réelles)
    const floorCorners = [
      { x: 0.8, y: 1.3 },
      { x: 15.8, y: 1.3 },
      { x: 15.8, y: 10.7 },
      { x: 0.8, y: 10.7 }
    ];

    const projFloor = floorCorners.map(p => this.project3D(p.x, p.y, 0, cam, cx, cy));

    // Ombre globale au sol
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    projFloor.forEach((p, idx) => {
      const sx = p.x + 8; const sy = p.y + 12;
      if (idx === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    });
    ctx.closePath();
    ctx.fill();

    // Dalle de sol sombre
    ctx.fillStyle = '#1e2430';
    ctx.beginPath();
    projFloor.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Dessin des pièces et démarcations au sol
    model.rooms.forEach(r => {
      const p1 = this.project3D(r.x, r.y, 0.01, cam, cx, cy);
      const p2 = this.project3D(r.x + r.w, r.y, 0.01, cam, cx, cy);
      const p3 = this.project3D(r.x + r.w, r.y + r.h, 0.01, cam, cx, cy);
      const p4 = this.project3D(r.x, r.y + r.h, 0.01, cam, cx, cy);

      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#283344';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 4. Dessin des ombres portées sous les meubles
    model.furniture.forEach(item => {
      const sp1 = this.project3D(item.x + 0.15, item.y + 0.15, 0.01, cam, cx, cy);
      const sp2 = this.project3D(item.x + item.w + 0.25, item.y + 0.15, 0.01, cam, cx, cy);
      const sp3 = this.project3D(item.x + item.w + 0.25, item.y + item.d + 0.3, 0.01, cam, cx, cy);
      const sp4 = this.project3D(item.x + 0.15, item.y + item.d + 0.3, 0.01, cam, cx, cy);

      ctx.fillStyle = 'rgba(5, 8, 14, 0.45)';
      ctx.beginPath();
      ctx.moveTo(sp1.x, sp1.y); ctx.lineTo(sp2.x, sp2.y);
      ctx.lineTo(sp3.x, sp3.y); ctx.lineTo(sp4.x, sp4.y);
      ctx.closePath();
      ctx.fill();
    });

    // 5. Rendu des Meubles en 3D Volumétrique
    model.furniture.forEach(item => {
      this.draw3DBox(ctx, item.x, item.y, 0, item.w, item.d, item.h, item.color, cam, cx, cy);
    });

    // 6. Rendu des Murs 3D Extrudés avec embrasures de portes et fenêtres
    const wallH = 2.40; // Hauteur sous plafond 2.4m

    model.walls.forEach(w => {
      const isH = Math.abs(w.y1 - w.y2) < 0.01;
      const len = isH ? Math.abs(w.x2 - w.x1) : Math.abs(w.y2 - w.y1);
      const minX = Math.min(w.x1, w.x2);
      const minY = Math.min(w.y1, w.y2);

      // Si le mur contient une porte ou une fenêtre, on échancre pour créer le passage
      this.draw3DWallSegment(ctx, minX, minY, isH ? minX + len : minX, isH ? minY : minY + len, w.th, wallH, cam, cx, cy);
    });

    // 7. Rendu des Portes 3D Ouvertes (Vantail marron/orange)
    model.doors.forEach(d => {
      // Montant et vantail 3D ouvert en biais
      const px = d.x; const py = d.y;
      this.draw3DBox(ctx, px, py, 0, 0.06, d.len * 0.9, 2.05, '#b45309', cam, cx, cy);
    });

    // 8. Rendu des Fenêtres 3D (Vitres semi-transparentes cyan)
    model.windows.forEach(w => {
      const wx = w.x; const wy = w.y;
      const isN = w.wall === 'N';
      this.draw3DBox(ctx, wx, wy, 0.85, isN ? w.len : 0.08, isN ? 0.08 : w.len, 1.25, 'rgba(56, 189, 248, 0.65)', cam, cx, cy);
    });
  },

  // Projection mathématique 3D vers écran (Perspective cavalière / isométrique)
  project3D(wx, wy, wz, camera, cx, cy) {
    const ox = wx - 8.3;
    const oy = wy - 6.0;
    const oz = wz;

    const cosY = Math.cos(camera.yaw);
    const sinY = Math.sin(camera.yaw);
    const rx = ox * cosY - oy * sinY;
    const ry = ox * sinY + oy * cosY;

    const cosP = Math.cos(camera.pitch);
    const sinP = Math.sin(camera.pitch);
    const py = ry * cosP - oz * sinP;
    const pz = ry * sinP + oz * cosP;

    return {
      x: cx + rx * camera.zoom,
      y: cy + py * camera.zoom,
      depth: pz
    };
  },

  // Dessin d'un volume 3D (Boîte parallélépipédique) avec ombrage de Lambert
  draw3DBox(ctx, x, y, z, w, d, h, baseColor, camera, cx, cy) {
    const p0 = this.project3D(x, y, z, camera, cx, cy);
    const p1 = this.project3D(x + w, y, z, camera, cx, cy);
    const p2 = this.project3D(x + w, y + d, z, camera, cx, cy);
    const p3 = this.project3D(x, y + d, z, camera, cx, cy);

    const pt0 = this.project3D(x, y, z + h, camera, cx, cy);
    const pt1 = this.project3D(x + w, y, z + h, camera, cx, cy);
    const pt2 = this.project3D(x + w, y + d, z + h, camera, cx, cy);
    const pt3 = this.project3D(x, y + d, z + h, camera, cx, cy);

    // Face supérieure (Top) - Plus lumineuse
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.moveTo(pt0.x, pt0.y); ctx.lineTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x, pt2.y); ctx.lineTo(pt3.x, pt3.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Faces latérales avec ombrage automatique
    // Face avant (South)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y); ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(pt2.x, pt2.y); ctx.lineTo(pt3.x, pt3.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = baseColor;
    ctx.fill();

    // Face droite (East)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y); ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = baseColor;
    ctx.fill();
  },

  // Dessin d'un mur 3D extrudé
  draw3DWallSegment(ctx, x1, y1, x2, y2, th, height, camera, cx, cy) {
    const isH = Math.abs(y1 - y2) < 0.01;
    const w = isH ? Math.abs(x2 - x1) : th;
    const d = isH ? th : Math.abs(y2 - y1);
    const minX = Math.min(x1, x2) - (isH ? 0 : th / 2);
    const minY = Math.min(y1, y2) - (isH ? th / 2 : 0);

    const wallColorTop = '#475569';
    const wallColorSide = '#334155';
    const wallColorShade = '#1e293b';

    const p0 = this.project3D(minX, minY, 0, camera, cx, cy);
    const p1 = this.project3D(minX + w, minY, 0, camera, cx, cy);
    const p2 = this.project3D(minX + w, minY + d, 0, camera, cx, cy);
    const p3 = this.project3D(minX, minY + d, 0, camera, cx, cy);

    const pt0 = this.project3D(minX, minY, height, camera, cx, cy);
    const pt1 = this.project3D(minX + w, minY, height, camera, cx, cy);
    const pt2 = this.project3D(minX + w, minY + d, height, camera, cx, cy);
    const pt3 = this.project3D(minX, minY + d, height, camera, cx, cy);

    // Faces latérales visibles
    ctx.fillStyle = wallColorSide;
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y); ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(pt2.x, pt2.y); ctx.lineTo(pt3.x, pt3.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = wallColorShade;
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y); ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y);
    ctx.closePath();
    ctx.fill();

    // Face supérieure du mur
    ctx.fillStyle = wallColorTop;
    ctx.beginPath();
    ctx.moveTo(pt0.x, pt0.y); ctx.lineTo(pt1.x, pt1.y);
    ctx.lineTo(pt2.x, pt2.y); ctx.lineTo(pt3.x, pt3.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  // Modal d'ajout d'équipement / meuble (+)
  showAddElementModal(game) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl p-6 max-w-lg w-full space-y-4 border border-slate-700 shadow-2xl bg-slate-900 text-white">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">🧰</span>
            <h3 class="font-black text-base">Ajouter un Mobilier ou Équipement de Secours</h3>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold">✕</button>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">
          Sélectionnez un agencement à installer dans vos locaux :
        </p>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <button onclick="this.closest('.fixed').remove(); window.game.showToast('Équipement Ajouté', 'Baie Radio & PC Fixe opérationnelle dans le Poste de Commandement.', 'blue')" class="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition space-y-1">
            <strong class="block font-black text-white">📡 Baie Radio Fixe</strong>
            <span class="text-[10px] text-slate-400">Communication Antac & PC</span>
          </button>
          <button onclick="this.closest('.fixed').remove(); window.game.showToast('Équipement Ajouté', 'Armoire DAE & Pharmacie installée.', 'green')" class="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition space-y-1">
            <strong class="block font-black text-white">💚 Armoire DAE Murale</strong>
            <span class="text-[10px] text-slate-400">Accès d'urgence 24/7</span>
          </button>
          <button onclick="this.closest('.fixed').remove(); window.game.showToast('Équipement Ajouté', 'Tableau blanc interactif installé dans la salle PSC1.', 'amber')" class="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition space-y-1">
            <strong class="block font-black text-white">🎓 Écran Vidéoprojection</strong>
            <span class="text-[10px] text-slate-400">Pour formations PSC1/SST</span>
          </button>
          <button onclick="this.closest('.fixed').remove(); window.game.showToast('Équipement Ajouté', 'Rack Bouteilles B5 Oxygène sécurisé.', 'emerald')" class="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition space-y-1">
            <strong class="block font-black text-white">🫁 Rack Bouteilles Oxygène</strong>
            <span class="text-[10px] text-slate-400">Capacité réserve accrue</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // Modal de fiche technique et cotes { }
  showTechnicalSpecsModal(game) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl p-6 max-w-lg w-full space-y-4 border border-slate-700 shadow-2xl bg-slate-900 text-white">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-cyan-400 font-mono font-black text-lg">{ }</span>
            <h3 class="font-black text-base">Fiche Technique d’Architecte & Conformité</h3>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold">✕</button>
        </div>
        <div class="space-y-2 text-xs font-mono text-slate-300">
          <div class="p-2.5 rounded-xl bg-slate-800/80 flex justify-between">
            <span>Surface Utile Brute (SUB) :</span>
            <strong class="text-cyan-300">69.8 m²</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-800/80 flex justify-between">
            <span>Hauteur sous Plafond (HSP) :</span>
            <strong class="text-white">2.70 m</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-800/80 flex justify-between">
            <span>Volume d’Air Traité :</span>
            <strong class="text-white">188.4 m³</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-800/80 flex justify-between">
            <span>Classement ERP Sécurité Civile :</span>
            <strong class="text-emerald-400">5ème Catégorie (Type R / W)</strong>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-800/80 flex justify-between">
            <span>Largeur Dégagements & UP :</span>
            <strong class="text-amber-400">1.40 m (2 Unités de Passage)</strong>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  toggleEditMode(game) {
    const prem = game.stations[0]?.premises;
    if (prem && prem.tenure !== 'owned') {
      this.showRentalRestrictedModal(game);
      return;
    }
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      game.showToast('Mode Aménagement Actif', 'Sélectionnez un type de pièce dans la palette pour réaménager vos cloisons.', 'purple');
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
                🛒 Boutique & Commandes ➜
              </button>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🫁 Bouteilles Oxygène B5 :</span>
                <strong class="text-slate-800">${log.oxygenBottles || log.oxygenB5 || 12} bouteilles</strong>
              </div>
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🩹 Trousses PSE & Pansements :</span>
                <strong class="text-slate-800">${log.woundKits || log.firstAidKits || 20} trousses</strong>
              </div>
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>⚡ Électrodes DAE :</span>
                <strong class="text-slate-800">${log.aedPads || 8} paires</strong>
              </div>
              <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>🩻 Colliers Cervicaux :</span>
                <strong class="text-slate-800">${log.cervicalCollars || 6} unités</strong>
              </div>
            </div>
            
            <button onclick="window.game.openModule('logistique')" class="w-full py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-2">
              <span>🛒</span>
              <span>Accéder à la Centrale d'Achats (Boutique en Ligne)</span>
            </button>
          </div>

        </div>
      </div>
    `;
  }
};
