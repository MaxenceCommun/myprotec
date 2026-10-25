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

  // Barème réaliste des travaux : Durée réelle Artisans (heures réelles) vs Heures-Bénévoles
  ROOM_WORK_SPECS: {
    garage_remisage: {
      lvl2: { artisanHours: 6, volunteerHours: 50 },
      lvl3: { artisanHours: 12, volunteerHours: 100 }
    },
    sas_desinfection_pharmacie: {
      lvl2: { artisanHours: 4, volunteerHours: 30 },
      lvl3: { artisanHours: 8, volunteerHours: 60 }
    },
    salle_formation_psc1: {
      lvl2: { artisanHours: 4, volunteerHours: 40 },
      lvl3: { artisanHours: 8, volunteerHours: 80 }
    },
    foyer_vie_associative: {
      lvl2: { artisanHours: 3, volunteerHours: 25 },
      lvl3: { artisanHours: 6, volunteerHours: 50 }
    },
    bureau_pc_radio: {
      lvl2: { artisanHours: 4, volunteerHours: 35 },
      lvl3: { artisanHours: 8, volunteerHours: 70 }
    },
    isolation: {
      lvl3: { artisanHours: 8, volunteerHours: 60 }
    }
  },

  dimensionMode: '2d', // '2d' (Plan d'architecte CAD) | '3d' (Vue isométrique 3D)
  editorTab: 'furniture', // 'furniture' | 'doors' | 'rooms' | 'expand'
  snapToGrid: true, // Aimant / Magnétisme à la grille (0.2m)
  camera3D: { yaw: -0.72, pitch: 0.62, zoom: 32, panX: 0, panY: -10 },
  camera2D: { zoom: 25, panX: 0, panY: 0 },
  isDraggingCanvas: false,
  dragStart: { x: 0, y: 0 },
  dragButton: 0,
  activeTab: 'modulaire', // 'modulaire' | 'plan' | 'securite' | 'catalogue' | 'construction' | 'stock'
  selectedTool: 'formation', // outil actif dans l'éditeur 2D
  isEditing: false, // mode modification de cloisons actif
  viewMode: 'furnished', // 'furnished' (meublé réaliste) | 'blueprint' (bleu technique d'architecte)
  selectedTileDetail: null, // index de la pièce affichée en détail
  selectedFurnitureId: null,
  hoveredFurnitureId: null,
  selectedRoomId: 'room_1',

  // Définition des types de pièces et caractéristiques
  ZONE_TYPES: {
    libre: {
      id: 'libre',
      name: 'Libre (Non affectée)',
      icon: '🚪',
      bgClass: 'bg-slate-900 border-slate-700',
      textClass: 'text-slate-300',
      blueprintClass: 'bg-blue-950/80 border-blue-400 text-blue-200',
      lightBg: 'bg-slate-100 text-slate-700 border-slate-300',
      desc: 'Pièce disponible. Définissez son affectation pour débloquer les fonctionnalités correspondantes.',
      costPerTile: 0,
      workDurationSec: 0,
      perTileStats: {}
    },
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
      desc: 'Accueille les sessions grand public (PSC, SST, GQS) et les recyclages des bénévoles.',
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
      desc: 'Équilibre parfait pour débuter : un bureau d’accueil, une salle de formation PSC, une réserve pour les collectes, un foyer chaleureux et un garage 2 places.',
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
      desc: 'Optimisé pour les cours grand public payants (PSC, SST, GQS) : deux grandes salles de formation, vastes bureaux et accueil, foyer convivial.',
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

  // =========================================================================
  // GESTION DU MARCHÉ IMMOBILIER TERRITORIAL & PLANS D'ARCHITECTE DYNAMIQUES
  // =========================================================================

  // =========================================================================
  // GÉNÉRATEUR DE LOCAUX RÉALISTES (typologies de bâtiments existants)
  // Couloirs, salles de tailles variées, sanitaires, remise à véhicules,
  // murs extérieurs / cloisons calculés automatiquement, portes et fenêtres.
  // =========================================================================

  BUILDING_TYPOLOGIES: {
    local: {
      label: 'Local associatif de quartier', icon: '🏠',
      names: ['Local associatif des Tilleuls', 'Ancien local paroissial', 'Rez-de-chaussée commercial', 'Local de l\'ancienne poste', 'Maison des associations (aile)'],
      desc: 'Rez-de-chaussée compact : couloir d\'entrée desservant une grande salle, un bureau, une kitchenette, un WC et une réserve. Stationnement sur la cour.'
    },
    pavillon: {
      label: 'Pavillon reconverti avec garage', icon: '🏡',
      names: ['Pavillon des années 70', 'Maison de ville reconvertie', 'Ancien logement de fonction', 'Pavillon du gardien', 'Maison de l\'ancien garde-champêtre'],
      desc: 'Ancienne maison réaménagée : garage fermé d\'une place avec porte sectionnelle, couloir central, séjour transformable en grande salle, cuisine, salle d\'eau et pièces plus petites.'
    },
    modulaire: {
      label: 'Bâtiment modulaire', icon: '🏗️',
      names: ['Bâtiment modulaire de chantier', 'Ensemble préfabriqué municipal', 'Modulaires de l\'ancien collège', 'Base vie modulaire', 'Bungalows reliés de la ZA'],
      desc: 'Modules préfabriqués de 2,40 m alignés de part et d\'autre d\'un couloir central traversant (deux accès). Salles de 1, 2 ou 3 modules, sanitaires intégrés.'
    },
    atelier: {
      label: 'Atelier communal avec remise', icon: '🏭',
      names: ['Ancien atelier des services techniques', 'Dépôt de voirie communal', 'Atelier artisanal', 'Ancienne menuiserie', 'Garage municipal désaffecté'],
      desc: 'Remise à véhicules à portes sectionnelles donnant sur la cour, couloir de service et aile de bureaux (bureau, salle de réunion, vestiaire, sanitaires).'
    },
    entrepot: {
      label: 'Entrepôt logistique avec bureaux', icon: '🏬',
      names: ['Entrepôt de la zone d\'activités', 'Plateforme logistique de secteur', 'Ancien négoce de matériaux', 'Hall de stockage rénové', 'Entrepôt avec bureaux d\'accueil'],
      desc: 'Remise à véhicules et grande zone de stockage reliées par une double porte, couloir transversal et rangée de bureaux, vestiaires et sanitaires côté accueil.'
    },
    caserne: {
      label: 'Ancien centre de secours', icon: '🚒',
      names: ['Ancien centre d\'incendie et de secours', 'Caserne désaffectée du SDIS', 'Ancien centre de première intervention', 'Ex-centre de secours principal', 'Caserne des anciens pompiers volontaires'],
      desc: 'Véritable centre de secours : remise multi-travées, couloirs en T, salle radio, bureau, grande salle de formation, vestiaires hommes / femmes, douches, pharmacie et dortoirs.'
    }
  },

  // Générateur pseudo-aléatoire déterministe (xorshift)
  _archRng(seed) {
    let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
    return () => {
      s = (s ^ (s << 13)) >>> 0;
      s = (s ^ (s >> 17)) >>> 0;
      s = (s ^ (s << 5)) >>> 0;
      return (s >>> 0) / 4294967296;
    };
  },

  // Génère un plan complet pour une typologie : { parking, rooms, walls, doors, windows, fixtures, furniture, meta }
  buildRealisticArchitecture(typology, opts = {}) {
    const rnd = this._archRng(opts.seed || 12345);
    const rd = (v) => Math.round(v * 10) / 10;
    const BX = 7.2, BY = 1.5;              // Coin nord-ouest du bâtiment (la cour est à l'ouest)
    const rooms = [];                       // pièces en coordonnées locales
    const links = [];                       // portes intérieures { a, b, at, len, type }
    const exits = [];                       // portes extérieures { room, side, at, len, main }
    const bays = [];                        // travées de remise { room, y0 } (porte sectionnelle à l'ouest)
    const R = (key, name, type, x, y, w, h) => { rooms.push({ key, name, type, x: rd(x), y: rd(y), w: rd(w), h: rd(h) }); return key; };
    const link = (a, b, at = 0.5, len = 0.83, type) => links.push({ a, b, at, len, type });

    // Découpe un intervalle selon des poids, avec tailles minimales
    const split = (a0, a1, items) => {
      const total = a1 - a0;
      let sizes = items.map(it => it.wt || 1);
      const fixed = new Array(items.length).fill(false);
      for (let iter = 0; iter < items.length; iter++) {
        const freeW = sizes.reduce((s, v, i) => s + (fixed[i] ? 0 : (items[i].wt || 1)), 0);
        const used = sizes.reduce((s, v, i) => s + (fixed[i] ? v : 0), 0);
        let changed = false;
        sizes = sizes.map((v, i) => fixed[i] ? v : (total - used) * (items[i].wt || 1) / freeW);
        sizes.forEach((v, i) => { if (!fixed[i] && v < (items[i].min || 0)) { sizes[i] = items[i].min; fixed[i] = true; changed = true; } });
        if (!changed) break;
      }
      const cuts = [a0];
      let acc = a0;
      sizes.forEach((v, i) => { acc += v; cuts.push(i === sizes.length - 1 ? a1 : rd(acc)); });
      return cuts;
    };
    // Rangée de pièces le long de x (même y0..y1)
    const row = (x0, x1, y0, y1, items) => {
      const c = split(x0, x1, items);
      return items.map((it, i) => R(it.key, it.name, it.type || 'libre', c[i], y0, c[i + 1] - c[i], y1 - y0));
    };
    // Colonne de pièces le long de y (même x0..x1)
    const col = (x0, x1, y0, y1, items) => {
      const c = split(y0, y1, items);
      return items.map((it, i) => R(it.key, it.name, it.type || 'libre', x0, c[i], x1 - x0, c[i + 1] - c[i]));
    };
    const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const v = (base, spread) => rd(base + (rnd() - 0.5) * 2 * spread);

    let outdoorSpots = opts.outdoorSpots !== undefined ? opts.outdoorSpots : 2;
    const BAY = 3.6;

    if (typology === 'local') {
      const W = v(11.2, 1.2), D = v(8.2, 0.5);
      const xE = rd(W - v(4.4, 0.5));
      const cy0 = rd(D * 0.48 - 0.65 + (rnd() - 0.5) * 0.6), cy1 = cy0 + 1.3;
      R('cor', 'Couloir d\'entrée', 'couloir', 0, cy0, xE, 1.3);
      R('big', 'Grande salle', 'libre', xE, 0, W - xE, D);
      const north = shuffle([{ key: 'bur', name: 'Bureau', wt: 0.8, min: 2.6 }, { key: 'sal', name: 'Salle de réunion', wt: 1.2, min: 3 }]);
      row(0, xE, 0, cy0, north);
      const south = [{ key: 'wc', name: 'WC', type: 'wc', wt: 0.45, min: 1.5 }, { key: 'kit', name: 'Kitchenette', wt: 1, min: 2.2 }, { key: 'res', name: 'Réserve', wt: 0.9, min: 1.8 }];
      if (rnd() < 0.5) south.reverse();
      row(0, xE, cy1, D, south);
      ['bur', 'sal', 'wc', 'kit', 'res'].forEach(k => link(k, 'cor', 0.25 + rnd() * 0.5));
      link('cor', 'big', 0.5, 0.93);
      link('big', 'kit', 0.5);
      exits.push({ room: 'cor', side: 'W', at: 0.5, len: 0.93, main: true });
      exits.push({ room: 'big', side: 'E', at: 0.7, len: 0.93 });
    } else if (typology === 'pavillon') {
      const W = v(12.8, 0.6), D = v(10.2, 0.6);
      const gW = 7.0, gH = BAY;
      R('gar', 'Garage', 'garage', 0, 0, gW, gH);
      bays.push({ room: 'gar', y0: 0 });
      row(gW, W, 0, gH, [{ key: 'ate', name: 'Atelier / cellier', wt: 1, min: 2 }, { key: 'sde', name: 'Salle d\'eau', type: 'douche', wt: 0.8, min: 2 }, { key: 'wc', name: 'WC', type: 'wc', wt: 0.5, min: 1.3 }]);
      const cy1 = gH + 1.2;
      R('cor', 'Couloir', 'couloir', 0, gH, W, 1.2);
      const south = [{ key: 'sej', name: 'Grande salle (ancien séjour)', wt: 1.9, min: 4.2 }, { key: 'cui', name: 'Cuisine', wt: 1, min: 2.6 }, { key: 'ch1', name: 'Petite salle', wt: 0.9, min: 2.4 }];
      if (rnd() < 0.5) { const t = south[1]; south[1] = south[2]; south[2] = t; }
      row(0, W, cy1, D, south);
      ['gar', 'ate', 'sde', 'sej', 'cui', 'ch1', 'wc'].forEach(k => link(k, 'cor', 0.3 + rnd() * 0.4));
      link('sej', south[1].key, 0.5);
      link('gar', 'ate', 0.5);
      exits.push({ room: 'cor', side: 'W', at: 0.5, len: 0.93, main: true });
      exits.push({ room: 'sej', side: 'S', at: 0.4, len: 1.4 });
    } else if (typology === 'modulaire') {
      const M = 2.4, nm = rnd() < 0.5 ? 6 : 7;
      const W = nm * M, D = 7.2, cy0 = 3.0, cy1 = 4.2;
      R('cor', 'Couloir central', 'couloir', 0, cy0, W, 1.2);
      const northSets = [[3, 1, 1, nm - 5], [2, 1, 2, nm - 5], [1, 3, 1, nm - 5]];
      const southSets = [[1, 1, 2, nm - 4], [2, 1, 1, nm - 4], [1, 2, 1, nm - 4]];
      const nSet = northSets[Math.floor(rnd() * northSets.length)];
      const sSet = southSets[Math.floor(rnd() * southSets.length)];
      const nNames = { 1: ['Bureau', 'Bureau 2', 'Salle radio'], 2: ['Salle de réunion', 'Salle polyvalente'], 3: ['Salle de cours'] };
      let x = 0, idx = 0;
      const used = {};
      nSet.forEach(n => {
        if (n <= 0) return;
        const pool = nNames[Math.min(3, n)];
        used[n] = (used[n] || 0);
        const name = pool[used[n] % pool.length] + (used[n] >= pool.length ? ` ${used[n] + 1}` : '');
        used[n]++;
        R('n' + idx, name, 'libre', x, 0, n * M, cy0); link('n' + idx, 'cor', 0.5); x += n * M; idx++;
      });
      x = 0; idx = 0;
      const sNamesFixed = [{ name: 'Sanitaires', type: 'wc' }, { name: 'Vestiaire', type: 'vestiaire' }, { name: 'Réserve', type: 'libre' }, { name: 'Salle de pause', type: 'libre' }];
      sSet.forEach((n, i) => {
        if (n <= 0) return;
        const def = sNamesFixed[i] || { name: 'Salle', type: 'libre' };
        R('s' + idx, def.name, def.type, x, cy1, n * M, D - cy1); link('s' + idx, 'cor', 0.5); x += n * M; idx++;
      });
      exits.push({ room: 'cor', side: 'W', at: 0.5, len: 0.93, main: true });
      exits.push({ room: 'cor', side: 'E', at: 0.5, len: 0.93 });
    } else if (typology === 'atelier' || typology === 'entrepot' || typology === 'caserne') {
      const nb = opts.bays || (typology === 'atelier' ? 2 : typology === 'entrepot' ? 2 : 3);
      const RW = typology === 'caserne' ? 8.6 : 7.8;
      const Hr = nb * BAY;
      R('rem', typology === 'atelier' ? 'Remise véhicules' : 'Remise', 'garage', 0, 0, RW, Hr);
      for (let b = 0; b < nb; b++) bays.push({ room: 'rem', y0: b * BAY });

      if (typology === 'atelier') {
        const cW = 1.4, xw = RW + cW, W = rd(xw + v(4.8, 0.5));
        const D = Hr;
        R('cor', 'Couloir de service', 'couloir', RW, 0, cW, D);
        const items = nb >= 3
          ? [{ key: 'bur', name: 'Bureau', wt: 1, min: 2.6 }, { key: 'reu', name: 'Salle de réunion', wt: 1.5, min: 3.4 }, { key: 'mag', name: 'Magasin / réserve', wt: 1.1, min: 2.4 }, { key: 'ves', name: 'Vestiaire', type: 'vestiaire', wt: 0.7, min: 1.8 }, { key: 'wc', name: 'WC', type: 'wc', wt: 0.4, min: 1.4 }]
          : [{ key: 'bur', name: 'Bureau', wt: 1, min: 2.4 }, { key: 'reu', name: 'Salle de réunion', wt: 1.5, min: 2.8 }, { key: 'wc', name: 'WC / vestiaire', type: 'vestiaire', wt: 0.6, min: 1.6 }];
        if (rnd() < 0.5) { const t = items[0]; items[0] = items[1]; items[1] = t; }
        col(xw, W, 0, D, items);
        items.forEach(it => link(it.key, 'cor', 0.5));
        link('rem', 'cor', 0.3); link('rem', 'cor', 0.8);
        exits.push({ room: 'cor', side: 'N', at: 0.5, len: 0.93, main: true });
        exits.push({ room: 'cor', side: 'S', at: 0.5, len: 0.93 });
      } else if (typology === 'entrepot') {
        const W = v(18.2, 1.2), cy1 = Hr + 1.4, D = rd(cy1 + v(4.0, 0.4));
        R('sto', 'Zone de stockage', 'stockage', RW, 0, W - RW, Hr);
        R('cor', 'Couloir transversal', 'couloir', 0, Hr, W, 1.4);
        const items = [{ key: 'acc', name: 'Accueil / bureau', wt: 1.2, min: 3 }, { key: 'bur', name: 'Bureau', wt: 0.9, min: 2.4 }, { key: 'pau', name: 'Salle de pause', wt: 1.2, min: 3 }, { key: 'vh', name: 'Vestiaire', type: 'vestiaire', wt: 0.9, min: 2.2 }, { key: 'dou', name: 'Douches', type: 'douche', wt: 0.6, min: 1.8 }, { key: 'wc', name: 'WC', type: 'wc', wt: 0.5, min: 1.5 }];
        if (rnd() < 0.5) { const t = items[1]; items[1] = items[2]; items[2] = t; }
        row(0, W, cy1, D, items);
        items.forEach(it => link(it.key, 'cor', 0.5));
        link('rem', 'sto', 0.5, 1.6, 'double_door');
        link('rem', 'cor', 0.6); link('sto', 'cor', 0.3, 1.6, 'double_door');
        exits.push({ room: 'cor', side: 'W', at: 0.5, len: 0.93, main: true });
        exits.push({ room: 'cor', side: 'E', at: 0.5, len: 0.93 });
      } else {
        // Ancien centre de secours : couloirs en T
        const cW = 1.6, xw = RW + cW, W = rd(xw + (nb >= 4 ? v(8.8, 0.5) : v(7.6, 0.6)));
        const cy1 = Hr + 1.5, D = rd(cy1 + v(4.4, 0.3));
        R('cv', 'Couloir', 'couloir', RW, 0, cW, Hr);
        R('ch', 'Hall et couloir', 'couloir', 0, Hr, W, 1.5);
        const east = nb >= 4
          ? [{ key: 'pc', name: 'Salle radio / opérations', wt: 1, min: 3 }, { key: 'bur', name: 'Bureau chef de centre', wt: 0.8, min: 2.6 }, { key: 'for', name: 'Grande salle de formation', wt: 2.1, min: 5.6 }, { key: 'foy', name: 'Foyer', wt: 1.3, min: 3.4 }]
          : [{ key: 'pc', name: 'Salle radio / opérations', wt: 1, min: 2.8 }, { key: 'bur', name: 'Bureau chef de centre', wt: 0.8, min: 2.4 }, { key: 'for', name: 'Grande salle de formation', wt: 2.1, min: 5.2 }];
        col(xw, W, 0, Hr, east);
        east.forEach(it => link(it.key, 'cv', 0.5, it.key === 'for' ? 1.4 : 0.83, it.key === 'for' ? 'double_door' : undefined));
        const south = [
          { key: 'vh', name: 'Vestiaire hommes', type: 'vestiaire', wt: 1.1, min: 2.4 },
          { key: 'vf', name: 'Vestiaire femmes', type: 'vestiaire', wt: 1, min: 2.2 },
          { key: 'dou', name: 'Douches & WC', type: 'douche', wt: 1, min: 2.4 },
          { key: 'pha', name: 'Pharmacie', wt: 0.8, min: 2.2 },
          { key: 'cui', name: nb >= 4 ? 'Cuisine' : 'Foyer / cuisine', wt: nb >= 4 ? 1 : 1.7, min: 2.8 },
          { key: 'do1', name: nb >= 4 ? 'Dortoir 1' : 'Dortoir', wt: 1.3, min: 3 }
        ];
        if (nb >= 4) south.push({ key: 'do2', name: 'Dortoir 2', wt: 1.2, min: 2.8 });
        row(0, W, cy1, D, south);
        south.forEach(it => link(it.key, 'ch', 0.5));
        link('rem', 'cv', 0.5, 1.4, 'double_door'); link('rem', 'ch', 0.75); link('cv', 'ch', 0.5, 1.4);
        exits.push({ room: 'ch', side: 'W', at: 0.5, len: 1.4, main: true });
        exits.push({ room: 'cv', side: 'N', at: 0.5, len: 0.93 });
        exits.push({ room: 'ch', side: 'E', at: 0.5, len: 0.93 });
      }
    }

    // ---- Passage en coordonnées monde ----
    const byKey = {};
    const worldRooms = rooms.map((r, i) => {
      const o = { id: `room_${i + 1}`, key: r.key, type: r.type, x: rd(BX + r.x), y: rd(BY + r.y), w: r.w, h: r.h };
      o.area = Math.round(o.w * o.h * 10) / 10;
      o.baseName = r.name;
      o.name = r.type === 'libre' ? `${r.name} (libre)\n${o.area} m² · à affecter` : r.name;
      o.color = '#121722';
      byKey[r.key] = o;
      return o;
    });
    const walls = this._computeWallsFromRooms(worldRooms);
    const doors = [];
    let dn = 0;
    // Portes entre deux pièces (sur l'arête commune)
    links.forEach(l => {
      const A = byKey[l.a], B = byKey[l.b];
      if (!A || !B) return;
      const e = this._sharedEdge(A, B);
      if (!e) return;
      const len = Math.min(l.len, e.hi - e.lo - 0.5);
      if (len < 0.7) return;
      const lo = e.lo + 0.25, hi = e.hi - 0.25 - len;
      const pos = rd(lo + (hi - lo) * l.at);
      dn++;
      const d = e.vertical ? { id: `d_${dn}`, x: e.c, y: pos, len, wall: 'W' } : { id: `d_${dn}`, x: pos, y: e.c, len, wall: 'N' };
      if (l.type) d.type = l.type;
      d.label = `Porte ${A.baseName} ↔ ${B.baseName}`;
      doors.push(d);
    });
    // Portes extérieures
    exits.forEach(x => {
      const A = byKey[x.room];
      if (!A) return;
      const vertical = x.side === 'W' || x.side === 'E';
      const span = vertical ? A.h : A.w;
      const len = Math.min(x.len, span - 0.5);
      const pos = rd((vertical ? A.y : A.x) + 0.25 + (span - 0.5 - len) * x.at);
      const c = x.side === 'W' ? A.x : x.side === 'E' ? rd(A.x + A.w) : x.side === 'N' ? A.y : rd(A.y + A.h);
      dn++;
      doors.push(vertical
        ? { id: x.main ? 'd_entree' : `d_${dn}`, x: c, y: pos, len, wall: 'W', isMain: !!x.main, label: x.main ? 'Entrée principale' : 'Issue de secours' }
        : { id: x.main ? 'd_entree' : `d_${dn}`, x: pos, y: c, len, wall: 'N', isMain: !!x.main, label: x.main ? 'Entrée principale' : 'Issue de secours' });
    });
    // Portes sectionnelles des travées de remise + places intérieures
    const spots = [];
    bays.forEach((b, i) => {
      const A = byKey[b.room];
      const y0 = rd(A.y + b.y0);
      doors.push({ id: `d_rideau_${i + 1}`, x: A.x, y: rd(y0 + 0.3), len: 3.0, wall: 'W', type: 'garage_shutter', label: `Porte sectionnelle travée ${i + 1}` });
      spots.push({ id: `spot_${spots.length + 1}`, label: `🅿️ TRAVÉE 0${i + 1}`, indoor: true, x: rd(A.x + 0.4), y: rd(y0 + 0.3), w: rd(Math.min(A.w - 0.8, 7.0)), d: 3.0 });
    });

    // Fenêtres sur les façades (évite portes et rideaux)
    const windows = [];
    let wn = 0;
    const insideAny = (x, y) => worldRooms.some(r => x > r.x + 1e-6 && x < r.x + r.w - 1e-6 && y > r.y + 1e-6 && y < r.y + r.h - 1e-6);
    const clashes = (vertical, c, a, b) => doors.some(d => {
      const dv = d.wall === 'W' || d.wall === 'E';
      if (dv !== vertical) return false;
      if (Math.abs((dv ? d.x : d.y) - c) > 0.05) return false;
      const d0 = dv ? d.y : d.x, d1 = d0 + d.len;
      return a < d1 + 0.35 && b > d0 - 0.35;
    });
    worldRooms.forEach(r => {
      if (r.type === 'couloir' && r.w * r.h < 10) return;
      const sides = [
        { side: 'N', vertical: false, c: r.y, a: r.x, len: r.w, ox: 0, oy: -0.1 },
        { side: 'S', vertical: false, c: rd(r.y + r.h), a: r.x, len: r.w, ox: 0, oy: 0.1 },
        { side: 'W', vertical: true, c: r.x, a: r.y, len: r.h, ox: -0.1, oy: 0 },
        { side: 'E', vertical: true, c: rd(r.x + r.w), a: r.y, len: r.h, ox: 0.1, oy: 0 }
      ];
      sides.forEach(s => {
        const mx = s.vertical ? s.c + s.ox : s.a + s.len / 2, my = s.vertical ? s.a + s.len / 2 : s.c + s.oy;
        if (insideAny(mx, my)) return;
        const small = r.type === 'wc' || r.type === 'douche';
        const garage = r.type === 'garage';
        if (garage && s.side === 'W') return;
        const n = small ? 1 : garage ? Math.min(2, Math.floor(s.len / 4.5)) : s.len >= 8 ? 3 : s.len >= 5 ? 2 : s.len >= 2.2 ? 1 : 0;
        const wl = small ? 0.6 : garage ? 1.6 : Math.min(1.8, Math.max(1.0, rd(s.len * 0.28)));
        for (let i = 0; i < n; i++) {
          const center = s.a + s.len * (i + 0.5) / n;
          const a = rd(center - wl / 2), b = a + wl;
          if (a < s.a + 0.3 || b > s.a + s.len - 0.3) continue;
          if (clashes(s.vertical, s.c, a, b)) continue;
          wn++;
          windows.push(s.vertical ? { id: `w_${wn}`, x: s.c, y: a, len: wl, wall: s.side, label: `Fenêtre ${r.baseName}` } : { id: `w_${wn}`, x: a, y: s.c, len: wl, wall: s.side, label: `Fenêtre ${r.baseName}` });
        }
      });
    });

    // Équipements fixes : extincteurs dans les circulations, TGBT
    const fixtures = [];
    worldRooms.filter(r => r.type === 'couloir' || r.type === 'garage').forEach((r, i) => {
      fixtures.push({ id: `ext_${i + 1}`, x: rd(r.x + 0.1), y: rd(r.y + 0.1), w: 0.25, h: 0.25, label: 'EXT', type: 'extinguisher' });
    });

    // ---- Cour & parking extérieur (à l'ouest, ne bloque pas la sortie des travées) ----
    let bx1 = -Infinity, by1 = -Infinity;
    worldRooms.forEach(r => { bx1 = Math.max(bx1, r.x + r.w); by1 = Math.max(by1, r.y + r.h); });
    const D = by1 - BY;
    const lanes = spots.map(s => [s.y - 0.4, s.y + s.d + 0.4]);
    let y = BY + 0.4, placed = 0, guard = 0;
    while (placed < outdoorSpots && guard++ < 60) {
      const y0 = y, y1 = y + 2.5;
      const blocked = lanes.find(([a, b]) => y0 < b && y1 > a);
      if (blocked) { y = rd(blocked[1] + 0.05); continue; }
      spots.push({ id: `spot_${spots.length + 1}`, label: `🅿️ PLACE EXTÉRIEURE 0${placed + 1}`, x: 1.3, y: rd(y0), w: 4.8, d: 2.5 });
      placed++;
      y = rd(y1 + 0.25);
    }
    const lastSpot = spots.filter(s => !s.indoor).reduce((m, s) => Math.max(m, s.y + s.d), 0);
    const parking = {
      x: 1.0, y: BY, w: rd(BX - 0.8 - 1.0),
      h: rd(Math.max(D, lastSpot + 0.4 - BY)),
      label: 'Cour & stationnement',
      spots
    };

    const usable = worldRooms.reduce((s, r) => s + r.area, 0);
    return {
      parking, rooms: worldRooms, walls, doors, windows, fixtures, furniture: [],
      meta: {
        typology,
        surfaceM2: Math.round(usable),
        footprint: { w: rd(bx1 - BX), h: rd(D) },
        roomsCount: worldRooms.filter(r => r.type !== 'couloir').length,
        freeRooms: worldRooms.filter(r => r.type === 'libre').length,
        bays: bays.length,
        outdoorSpots: placed,
        storageArea: Math.round(worldRooms.filter(r => r.type === 'garage' || r.type === 'stockage' || /réserve|magasin|stockage|cellier/i.test(r.baseName)).reduce((s, r) => s + r.area, 0))
      }
    };
  },

  // Arête commune entre deux pièces adjacentes
  _sharedEdge(A, B) {
    const eq = (a, b) => Math.abs(a - b) < 0.05;
    const ov = (a0, a1, b0, b1) => ({ lo: Math.max(a0, b0), hi: Math.min(a1, b1) });
    if (eq(A.x + A.w, B.x) || eq(B.x + B.w, A.x)) {
      const c = eq(A.x + A.w, B.x) ? B.x : A.x;
      const o = ov(A.y, A.y + A.h, B.y, B.y + B.h);
      if (o.hi - o.lo > 0.9) return { vertical: true, c: Math.round(c * 10) / 10, lo: o.lo, hi: o.hi };
    }
    if (eq(A.y + A.h, B.y) || eq(B.y + B.h, A.y)) {
      const c = eq(A.y + A.h, B.y) ? B.y : A.y;
      const o = ov(A.x, A.x + A.w, B.x, B.x + B.w);
      if (o.hi - o.lo > 0.9) return { vertical: false, c: Math.round(c * 10) / 10, lo: o.lo, hi: o.hi };
    }
    return null;
  },

  // Murs calculés depuis les pièces : façade (0,24 m) si un seul côté est intérieur, cloison (0,12 m) sinon
  _computeWallsFromRooms(rooms) {
    const q = (v) => Math.round(v * 10);
    const Rs = rooms.map(r => ({ x0: q(r.x), y0: q(r.y), x1: q(r.x + r.w), y1: q(r.y + r.h) }));
    const inside = (x, y) => Rs.some(r => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1);
    const H = new Map(), V = new Map();
    const add = (map, k, a, b) => { if (!map.has(k)) map.set(k, []); map.get(k).push([Math.min(a, b), Math.max(a, b)]); };
    Rs.forEach(r => { add(H, r.y0, r.x0, r.x1); add(H, r.y1, r.x0, r.x1); add(V, r.x0, r.y0, r.y1); add(V, r.x1, r.y0, r.y1); });
    const walls = [];
    const scan = (map, horizontal) => {
      map.forEach((segs, c) => {
        const pts = [...new Set(segs.flat())].sort((a, b) => a - b);
        let cur = null;
        const flush = () => {
          if (!cur) return;
          walls.push(horizontal
            ? { x1: cur.a / 10, y1: c / 10, x2: cur.b / 10, y2: c / 10, th: cur.outer ? 0.24 : 0.12, outer: cur.outer }
            : { x1: c / 10, y1: cur.a / 10, x2: c / 10, y2: cur.b / 10, th: cur.outer ? 0.24 : 0.12, outer: cur.outer });
          cur = null;
        };
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], m = (a + b) / 2;
          if (!segs.some(s => s[0] <= a && s[1] >= b)) { flush(); continue; }
          const s1 = horizontal ? inside(m, c - 0.5) : inside(c - 0.5, m);
          const s2 = horizontal ? inside(m, c + 0.5) : inside(c + 0.5, m);
          if (!s1 && !s2) { flush(); continue; }
          const outer = !(s1 && s2);
          if (cur && cur.outer === outer && cur.b === a) cur.b = b;
          else { flush(); cur = { a, b, outer }; }
        }
        flush();
      });
    };
    scan(H, true);
    scan(V, false);
    return walls;
  },

  // Compatibilité : ancienne signature (surface, nb de pièces, places) -> typologie la plus proche
  generateProceduralArchitecture(surfaceM2, roomsCount, parkingSpots) {
    const typ = surfaceM2 < 110 ? 'local' : surfaceM2 < 170 ? 'pavillon' : surfaceM2 < 300 ? 'atelier' : 'caserne';
    return this.buildRealisticArchitecture(typ, { seed: Math.round(surfaceM2 * 97 + roomsCount * 13), outdoorSpots: Math.max(1, Math.min(4, parkingSpots || 2)) });
  },

  // Bâtiment de départ (mis à disposition) : petit local associatif réaliste et déterministe
  getDefaultModel() {
    return this.buildRealisticArchitecture('local', { seed: 20260901, outdoorSpots: 2 });
  },

  // Offres immobilières du jour (à vendre ET à louer), variant chaque jour in-game
  getDailyRealEstateOffers(game, mode) {
    game = game || window.game;
    const year = game?.clock?.year || 2026;
    const month = game?.clock?.month !== undefined ? game.clock.month : 9;
    const day = game?.clock?.day || 5;
    const dayKey = `${year}-${month}-${day}`;

    if (!this._dailyOffersCache || this._dailyOffersCacheKey !== dayKey) {
      const station = game?.stations?.[0] || { city: 'Nancy', name: 'Antenne' };
      const city = station.city || 'Nancy';
      const rnd = this._archRng(((year * 372) + ((month + 1) * 31) + day) * 7919);
      const T = this.BUILDING_TYPOLOGIES;
      // €/m² à l'achat et €/m²/mois à la location selon la typologie
      const PRICING = {
        local:     { buy: 1350, rent: 9.5 },
        pavillon:  { buy: 1750, rent: 8.5 },
        modulaire: { buy: 950,  rent: 7.5 },
        atelier:   { buy: 1150, rent: 6.5 },
        entrepot:  { buy: 980,  rent: 5.8 },
        caserne:   { buy: 1250, rent: 6.2 }
      };
      const make = (typology, kind, idx, extra = {}) => {
        const seed = Math.floor(rnd() * 1e9);
        const outdoor = typology === 'local' || typology === 'modulaire' ? 2 + Math.floor(rnd() * 2) : typology === 'pavillon' ? 1 + Math.floor(rnd() * 2) : 1 + Math.floor(rnd() * 3);
        const arch = this.buildRealisticArchitecture(typology, { seed, outdoorSpots: outdoor, bays: extra.bays });
        const meta = arch.meta;
        const tpl = T[typology];
        const name = `${tpl.names[Math.floor(rnd() * tpl.names.length)]} • ${city}`;
        const pr = PRICING[typology];
        const factor = 0.92 + rnd() * 0.16;
        const offer = {
          id: `building_${kind}_${dayKey}_${idx}`,
          kind,
          name,
          typology,
          typologyLabel: tpl.label,
          tier: typology,
          icon: tpl.icon,
          surfaceM2: meta.surfaceM2,
          roomsCount: meta.roomsCount,
          freeRooms: meta.freeRooms,
          vehicleCapacity: meta.bays + meta.outdoorSpots,
          indoorBays: meta.bays,
          storageCapacity: Math.max(40, Math.round(meta.storageArea * 2.2 + meta.surfaceM2 * 0.25)),
          desc: tpl.desc,
          architecture: arch,
          offerDayKey: dayKey
        };
        if (kind === 'sale') {
          offer.type = 'Pleine Propriété';
          offer.tenure = 'owned';
          offer.price = Math.round(meta.surfaceM2 * pr.buy * factor / 500) * 500;
        } else {
          offer.type = 'Location (bail commercial)';
          offer.tenure = 'rented';
          offer.monthlyRent = Math.round(meta.surfaceM2 * pr.rent * factor / 10) * 10;
          offer.price = offer.monthlyRent; // premier loyer payé à la signature
        }
        return offer;
      };
      const pickDistinct = (pool, n) => { const a = pool.slice(); const out = []; while (out.length < n && a.length) out.push(a.splice(Math.floor(rnd() * a.length), 1)[0]); return out; };
      const rentals = pickDistinct(['local', 'pavillon', 'modulaire', 'atelier', 'entrepot'], 3).map((t, i) => make(t, 'rent', i));
      const sales = [
        ...pickDistinct(['local', 'pavillon', 'modulaire'], 1),
        ...pickDistinct(['atelier', 'entrepot'], 1),
        'caserne'
      ].map((t, i) => make(t, 'sale', i, t === 'caserne' ? { bays: rnd() < 0.5 ? 3 : 4 } : {}));
      this._dailyOffersCache = [...rentals, ...sales];
      this._dailyOffersCacheKey = dayKey;
    }
    const all = this._dailyOffersCache;
    if (mode === 'sale' || mode === 'rent') return all.filter(o => o.kind === mode);
    return all;
  },

  // Aperçu SVG du plan (mis à l'échelle de l'offre, noms des pièces, couloirs, portes, fenêtres)
  renderBuildingPlanPreviewSVG(b) {
    if (!b || !b.architecture) return '';
    const arch = b.architecture;
    const vb = this.getModelViewBox(arch);
    const pad = 0.8;
    const W = 640;
    const scale = (W - 20) / (vb.w + pad * 2);
    const H = Math.round((vb.h + pad * 2) * scale + 10);
    const X = (x) => +(10 + (x - vb.x0 + pad) * scale).toFixed(1);
    const Y = (y) => +(5 + (y - vb.y0 + pad) * scale).toFixed(1);
    const esc = (t) => String(t || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
    const fills = { couloir: '#e7e5e4', wc: '#e0f2fe', douche: '#e0f2fe', vestiaire: '#e0f2fe', garage: '#cbd5e1', stockage: '#fef3c7' };
    const pk = arch.parking;
    let out = '';
    if (pk) {
      out += `<rect x="${X(pk.x)}" y="${Y(pk.y)}" width="${(pk.w * scale).toFixed(1)}" height="${(pk.h * scale).toFixed(1)}" fill="#475569" rx="4"/>`;
      (pk.spots || []).filter(s => !s.indoor).forEach(s => {
        out += `<rect x="${X(s.x)}" y="${Y(s.y)}" width="${(s.w * scale).toFixed(1)}" height="${(s.d * scale).toFixed(1)}" fill="none" stroke="#f8fafc" stroke-width="1.2" stroke-dasharray="3 2"/>`;
        out += `<text x="${X(s.x + s.w / 2)}" y="${Y(s.y + s.d / 2) + 3}" fill="#f8fafc" font-size="8" font-weight="800" text-anchor="middle">P</text>`;
      });
    }
    (arch.rooms || []).forEach(r => {
      out += `<rect x="${X(r.x)}" y="${Y(r.y)}" width="${(r.w * scale).toFixed(1)}" height="${(r.h * scale).toFixed(1)}" fill="${fills[r.type] || '#f8fafc'}"/>`;
    });
    (pk && pk.spots || []).filter(s => s.indoor).forEach(s => {
      out += `<rect x="${X(s.x)}" y="${Y(s.y)}" width="${(s.w * scale).toFixed(1)}" height="${(s.d * scale).toFixed(1)}" fill="none" stroke="#eab308" stroke-width="1.4"/>`;
    });
    (arch.walls || []).forEach(w => {
      out += `<line x1="${X(w.x1)}" y1="${Y(w.y1)}" x2="${X(w.x2)}" y2="${Y(w.y2)}" stroke="#1e293b" stroke-width="${Math.max(1.4, w.th * scale).toFixed(1)}" stroke-linecap="square"/>`;
    });
    (arch.windows || []).forEach(w => {
      const v = w.wall === 'W' || w.wall === 'E';
      out += `<line x1="${X(w.x)}" y1="${Y(w.y)}" x2="${X(v ? w.x : w.x + w.len)}" y2="${Y(v ? w.y + w.len : w.y)}" stroke="#38bdf8" stroke-width="${Math.max(2, 0.14 * scale).toFixed(1)}"/>`;
    });
    (arch.doors || []).forEach(d => {
      const v = d.wall === 'W' || d.wall === 'E';
      const color = d.type === 'garage_shutter' ? '#facc15' : d.isMain ? '#FF6600' : '#f8fafc';
      out += `<line x1="${X(d.x)}" y1="${Y(d.y)}" x2="${X(v ? d.x : d.x + d.len)}" y2="${Y(v ? d.y + d.len : d.y)}" stroke="${color}" stroke-width="${Math.max(2.4, 0.26 * scale).toFixed(1)}"/>`;
    });
    (arch.rooms || []).forEach(r => {
      const rw = r.w * scale, rh = r.h * scale;
      if (rw < 26 || rh < 14) return;
      const label = (r.baseName || r.name || '').split('\n')[0];
      const fs = Math.max(6.5, Math.min(10, rw / Math.max(6, label.length) * 1.6));
      const showArea = rh > 26 && r.type !== 'couloir';
      out += `<text x="${X(r.x + r.w / 2)}" y="${Y(r.y + r.h / 2) + (showArea ? -1 : 3)}" fill="#0f172a" font-size="${fs.toFixed(1)}" font-weight="800" text-anchor="middle">${esc(label.length > 26 ? label.slice(0, 25) + '…' : label)}</text>`;
      if (showArea) out += `<text x="${X(r.x + r.w / 2)}" y="${Y(r.y + r.h / 2) + 9}" fill="#64748b" font-size="7" font-weight="700" text-anchor="middle">${r.area} m²</text>`;
    });
    return `
      <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto block rounded-2xl font-sans select-none border border-slate-200 overflow-hidden" style="max-height:300px;background:#86efac">
        ${out}
      </svg>
      <div class="flex flex-wrap gap-x-3 gap-y-1 text-[9.5px] font-bold text-slate-500 px-1 pt-1">
        <span><span style="color:#FF6600">▬</span> Entrée</span><span><span style="color:#facc15">▬</span> Porte sectionnelle</span><span><span style="color:#38bdf8">▬</span> Fenêtre</span><span><span style="color:#eab308">▢</span> Travée intérieure</span>
      </div>
    `;
  },

  // Fallback rétro-compatible
  CATALOG_BUILDINGS: [],

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
  
  // Initialisation et rétrocompatibilité modulaire des locaux de l'antenne
  
  // Récupère les specs de travaux pour une pièce et un niveau cible
  getRoomWorkSpec(roomId, targetLevel) {
    const spec = this.ROOM_WORK_SPECS[roomId];
    if (!spec) return { artisanHours: 4, volunteerHours: 40 };
    const lvlKey = 'lvl' + targetLevel;
    return spec[lvlKey] || spec.lvl2 || { artisanHours: 4, volunteerHours: 40 };
  },

  // Rendu interactif du bloc d'action d'une pièce (Artisans vs Bénévoles)
  renderRoomActionBlock(station, roomId, room, premises) {
    if (!room) return '';
    if (room.level >= 3) {
      return `<div class="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-black text-center text-xs">Aménagement Maximal Atteint (Niveau ${room.level}) ✓</div>`;
    }

    const targetLevel = (room.level || 1) + 1;
    const spec = this.getRoomWorkSpec(roomId, targetLevel);

    // 1. Chantier Artisans en cours
    if (room.artisanWork && room.artisanWork.targetCompletionTime) {
      const now = Date.now();
      const remainingMs = Math.max(0, room.artisanWork.targetCompletionTime - now);
      const totalMs = (room.artisanWork.targetCompletionTime - (room.artisanWork.startTime || (now - 1000))) || (spec.artisanHours * 3600000);
      const pct = Math.min(100, Math.max(5, Math.round(((totalMs - remainingMs) / totalMs) * 100)));
      
      const totalSec = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;

      return `
        <div class="p-3 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 space-y-2">
          <div class="flex items-center justify-between text-xs font-black">
            <span class="flex items-center gap-1.5 text-indigo-700">
              <i data-lucide="hard-hat" class="w-4 h-4"></i>
              <span>Artisans en cours (Niv. ${targetLevel})</span>
            </span>
            <span class="mono-num text-[11px] font-extrabold text-indigo-800">Livraison dans ~${timeStr}</span>
          </div>
          <div class="w-full bg-indigo-200/70 rounded-full h-2 overflow-hidden shadow-inner">
            <div class="bg-indigo-600 h-full rounded-full transition-all duration-500 animate-pulse" style="width: ${pct}%"></div>
          </div>
          <p class="text-[10px] text-indigo-600 font-semibold leading-tight">
            Intervention en tâche de fond. La pièce reste opérationnelle au Niveau ${room.level} jusqu'à livraison.
          </p>
        </div>
      `;
    }

    // 2. Chantier Bénévoles en cours (Jauge d'heures-bénévoles)
    if (room.volunteerWork) {
      const vw = room.volunteerWork;
      const req = vw.requiredHours || spec.volunteerHours || 50;
      const cur = vw.currentHours || 0;
      const pct = Math.min(100, Math.round((cur / req) * 100));

      const activeMissions = (window.game?.missions || []).filter(m => 
        m.type === 'travaux' && 
        m.roomKey === roomId && 
        m.stationId === station.id && 
        (m.status === 'planifie' || m.status === 'ongoing')
      );

      return `
        <div class="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-2.5">
          <div class="flex items-center justify-between text-xs font-black">
            <span class="flex items-center gap-1.5 text-amber-800">
              <i data-lucide="hammer" class="w-4 h-4 text-amber-600"></i>
              <span>Chantier Bénévoles (Niv. ${vw.targetLevel || targetLevel})</span>
            </span>
            <span class="mono-num text-[11px] font-extrabold text-amber-900">${cur} / ${req} h (${pct}%)</span>
          </div>
          <div class="w-full bg-amber-200/80 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div class="bg-amber-500 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
            <span class="text-[10.5px] font-bold text-amber-800 flex items-center gap-1">
              <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
              <span>${activeMissions.length > 0 ? `${activeMissions.length} session(s) au planning` : 'Aucune session active'}</span>
            </span>
            <button onclick="window.ProtecLocaux.openPlanTravauxSessionModal(window.game, '${station.id}', '${roomId}')" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
              <i data-lucide="calendar-plus" class="w-3.5 h-3.5"></i>
              <span>Planifier une session travaux</span>
            </button>
          </div>
        </div>
      `;
    }

    // 3. Choix initial : Chantier Bénévoles vs Artisans
    const matCost = room.volunteerMatCost || 750;
    const craftCost = room.craftsmanCost || 2200;

    return `
      <div class="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '${station.id}', '${roomId}', 'chantier_benevole')" class="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black shadow-xs transition flex items-center justify-center gap-1" title="Achat matériaux (${matCost} €) puis planification libre de sessions travaux">
          <i data-lucide="hammer" class="w-3.5 h-3.5"></i>
          <span>Chantier (${matCost} €)</span>
        </button>
        <button onclick="window.ProtecLocaux.upgradeRoom(window.game, '${station.id}', '${roomId}', 'artisan')" class="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-extrabold transition flex items-center justify-center gap-1" title="Artisans du bâtiment (${craftCost} € • ${spec.artisanHours}h réelles)">
          <i data-lucide="hard-hat" class="w-3.5 h-3.5 text-slate-500"></i>
          <span>Artisans (${craftCost} €)</span>
        </button>
      </div>
    `;
  },

  // Rendu interactif du bloc isolation
  renderInsulationActionBlock(station, premises) {
    if (premises.isolationLevel >= 3) {
      return '<span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">Isolé BBC ✓</span>';
    }

    if (premises.isolationArtisanWork && premises.isolationArtisanWork.targetCompletionTime) {
      const now = Date.now();
      const remainingMs = Math.max(0, premises.isolationArtisanWork.targetCompletionTime - now);
      const hours = Math.floor(remainingMs / 3600000);
      const mins = Math.floor((remainingMs % 3600000) / 60000);
      const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
      return `<span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse">Artisans BBC (reste ~${timeStr})</span>`;
    }

    if (premises.isolationVolunteerWork) {
      const vw = premises.isolationVolunteerWork;
      const cur = vw.currentHours || 0;
      const req = vw.requiredHours || 60;
      return `
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">${cur}/${req}h BBC</span>
          <button onclick="window.ProtecLocaux.openPlanTravauxSessionModal(window.game, '${station.id}', 'isolation')" class="px-2 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] transition">
            + Session
          </button>
        </div>
      `;
    }

    return `
      <div class="flex gap-1.5">
        <button onclick="window.ProtecLocaux.upgradeInsulation(window.game, '${station.id}', 'chantier_benevole')" class="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-[10px] transition" title="Chantier participatif (1 200 € matériaux)">
          Chantier (1,2k€)
        </button>
        <button onclick="window.ProtecLocaux.upgradeInsulation(window.game, '${station.id}', 'artisan')" class="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] transition" title="Entreprise isolation (3 500 € • 8h réelles)">
          Artisans (3,5k€)
        </button>
      </div>
    `;
  },

  // Boîte de dialogue & ouverture de la modale de planification de session travaux
  async openPlanTravauxSessionModal(game, stationId, roomId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);
    
    let targetName = 'Locaux';
    let currentHours = 0;
    let requiredHours = 50;

    if (roomId === 'isolation') {
      targetName = 'Isolation Thermique BBC';
      currentHours = premises.isolationVolunteerWork?.currentHours || 0;
      requiredHours = premises.isolationVolunteerWork?.requiredHours || 60;
    } else {
      const room = premises.rooms?.[roomId];
      if (!room || !room.volunteerWork) {
        game.showToast('Aucun Projet Chantier', 'Veuillez d\'abord lancer le chantier en achetant les matériaux.', 'blue');
        return;
      }
      targetName = room.name;
      currentHours = room.volunteerWork.currentHours || 0;
      requiredHours = room.volunteerWork.requiredHours || 50;
    }

    const curDay = game.clock?.day || 1;
    const curMonth = game.clock?.month || 0;
    const curYear = game.clock?.year || 2026;
    const curHour = game.clock?.hour || 10;

    // Supprimer ancienne modale si existante
    const existingModal = document.getElementById('plan-travaux-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'plan-travaux-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in select-none';
    
    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-white/80 space-y-5 animate-scale-up">
        
        <!-- Header -->
        <div class="flex items-start justify-between border-b border-slate-200/80 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center text-xl font-black">
              🔨
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900 leading-tight">Planifier une Session Travaux</h3>
              <p class="text-xs text-slate-500 font-semibold">${targetName} • Progression : ${currentHours} / ${requiredHours} h</p>
            </div>
          </div>
          <button onclick="document.getElementById('plan-travaux-modal').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Jauge d'avancement actuelle -->
        <div class="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5">
          <div class="flex justify-between text-xs font-black">
            <span>Avancement global du chantier</span>
            <span>${currentHours} / ${requiredHours} heures-bénévoles requises</span>
          </div>
          <div class="w-full bg-amber-200 rounded-full h-2 overflow-hidden shadow-inner">
            <div class="bg-amber-600 h-full rounded-full transition-all" style="width: ${Math.min(100, Math.round((currentHours / requiredHours) * 100))}%;"></div>
          </div>
        </div>

        <!-- Formulaire de planification -->
        <div class="space-y-4 text-xs font-bold text-slate-700">
          
          <!-- Date -->
          <div>
            <label class="block text-[11px] uppercase tracking-wider text-slate-500 font-black mb-1.5">Jour de la session</label>
            <select id="pt-day-choice" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="today">Aujourd'hui (Jour ${curDay}/${curMonth + 1}/${curYear})</option>
              <option value="tomorrow" selected>Demain (Jour ${curDay + 1}/${curMonth + 1}/${curYear})</option>
              <option value="weekend">Ce Samedi (Travaux associatifs du week-end)</option>
              <option value="next_weekend">Samedi prochain (Grand chantier d'antenne)</option>
            </select>
          </div>

          <!-- Horaires Début & Fin -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-slate-500 font-black mb-1.5">Heure de début</label>
              <select id="pt-start-hour" onchange="window.ProtecLocaux.updateTravauxDurationHelp()" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="8">08h00</option>
                <option value="9" selected>09h00</option>
                <option value="10">10h00</option>
                <option value="13">13h00</option>
                <option value="14">14h00</option>
                <option value="15">15h00</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] uppercase tracking-wider text-slate-500 font-black mb-1.5">Heure de fin</label>
              <select id="pt-end-hour" onchange="window.ProtecLocaux.updateTravauxDurationHelp()" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="11">11h00</option>
                <option value="12">12h00</option>
                <option value="13" selected>13h00</option>
                <option value="17">17h00</option>
                <option value="18">18h00</option>
                <option value="19">19h00</option>
              </select>
            </div>
          </div>

          <!-- Indicateur dynamique de réalisme / conseil durée -->
          <div id="pt-duration-advisor" class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2">
            <i data-lucide="info" class="w-4 h-4 text-emerald-600 mt-0.5 shrink-0"></i>
            <div class="text-[11px] font-semibold leading-relaxed" id="pt-advisor-text">
              Durée prévue : <strong>4 heures</strong>. Format idéal pour mobiliser les bénévoles le week-end (taux d'inscription optimal).
            </div>
          </div>

          <!-- Plafond de bénévoles souhaité -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-[11px] uppercase tracking-wider text-slate-500 font-black">Plafond maximal de bénévoles</label>
              <span class="text-[10px] text-slate-400 font-semibold">Le joueur choisit librement le plafond</span>
            </div>
            <div class="flex items-center gap-3">
              <input id="pt-max-vols" type="number" min="2" max="15" value="5" class="w-24 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-extrabold text-sm text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <span class="text-[11px] text-slate-600 font-semibold leading-tight">
                bénévoles max sur ce créneau (progression apportée = bénévoles présents × durée).
              </span>
            </div>
          </div>

        </div>

        <!-- Boutons d'action -->
        <div class="pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
          <button onclick="document.getElementById('plan-travaux-modal').remove()" class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
            Annuler
          </button>
          <button onclick="window.ProtecLocaux.confirmPlanTravauxSession(window.game, '${station.id}', '${roomId}')" class="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Valider et Publier au Planning</span>
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    this.updateTravauxDurationHelp();
  },

  // Calcul interactif de la durée de session travaux et affichage du conseil
  updateTravauxDurationHelp() {
    const startEl = document.getElementById('pt-start-hour');
    const endEl = document.getElementById('pt-end-hour');
    const advisorEl = document.getElementById('pt-duration-advisor');
    const textEl = document.getElementById('pt-advisor-text');
    if (!startEl || !endEl || !advisorEl || !textEl) return;

    let start = parseInt(startEl.value, 10) || 9;
    let end = parseInt(endEl.value, 10) || 13;
    if (end <= start) end = start + 1;

    const duration = end - start;

    if (duration <= 4) {
      advisorEl.className = 'p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2';
      textEl.innerHTML = `Durée prévue : <strong>${duration} heures</strong>. Format idéal pour mobiliser les bénévoles (taux d'inscription optimal). Chaque bénévole présent apportera ${duration}h à la jauge !`;
    } else if (duration <= 6) {
      advisorEl.className = 'p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2';
      textEl.innerHTML = `Durée prévue : <strong>${duration} heures</strong>. Créneau long : mobilisation modérée des secouristes (prévoyez une collation pour le moral).`;
    } else {
      advisorEl.className = 'p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2';
      textEl.innerHTML = `Durée prévue : <strong>${duration} heures</strong>. ⚠️ <em>Attention : créneau trop long !</em> Les bénévoles ont des contraintes et hésiteront fortement à s'inscrire sur une journée continue non-stop.`;
    }
  },

  // Confirmation et injection de la mission dans le planning
  confirmPlanTravauxSession(game, stationId, roomId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);

    let targetName = 'Locaux';
    let targetLevel = 2;
    let targetWorkObj = null;

    if (roomId === 'isolation') {
      targetName = 'Isolation BBC';
      targetLevel = 3;
      targetWorkObj = premises.isolationVolunteerWork;
    } else {
      const room = premises.rooms?.[roomId];
      if (!room || !room.volunteerWork) return;
      targetName = room.name;
      targetLevel = room.volunteerWork.targetLevel;
      targetWorkObj = room.volunteerWork;
    }

    const dayChoice = document.getElementById('pt-day-choice')?.value || 'tomorrow';
    const startHour = parseInt(document.getElementById('pt-start-hour')?.value, 10) || 9;
    let endHour = parseInt(document.getElementById('pt-end-hour')?.value, 10) || 13;
    if (endHour <= startHour) endHour = startHour + 1;
    const durationHours = endHour - startHour;
    const maxVols = Math.max(2, parseInt(document.getElementById('pt-max-vols')?.value, 10) || 4);

    let targetDay = game.clock?.day || 1;
    let targetMonth = game.clock?.month || 0;
    let targetYear = game.clock?.year || 2026;

    if (dayChoice === 'tomorrow') {
      targetDay += 1;
    } else if (dayChoice === 'weekend') {
      targetDay += 3;
    } else if (dayChoice === 'next_weekend') {
      targetDay += 7;
    }

    const mission = {
      id: 'chantier-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: 'travaux',
      subtype: 'chantier_locaux',
      title: `Chantier Participatif : ${targetName}`,
      desc: `Travaux d'aménagement associatif pour ${targetName} (Niveau ${targetLevel}). Les bénévoles présents apportent de l'avancement et renforcent la cohésion d'antenne.`,
      roomKey: roomId,
      stationId: station.id,
      requiredVolunteers: maxVols,
      registeredVolunteers: [],
      plannedDate: { year: targetYear, month: targetMonth, day: targetDay, hour: startHour, minute: 0 },
      eventDate: { year: targetYear, month: targetMonth, day: targetDay, hour: startHour, minute: 0 },
      startHour: startHour,
      endHour: endHour,
      durationHours: durationHours,
      durationSeconds: durationHours * 3600,
      status: 'planifie',
      address: station.address || `${station.city || 'Nancy'} Centre`,
      location: { lat: station.lat || 48.692, lng: station.lng || 6.184 },
      targetRoomName: targetName,
      targetLevel: targetLevel,
      pole: 'dps',
      poleLabel: 'Chantier Bénévoles',
      badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
      publishedAt: Date.now()
    };

    if (targetWorkObj) {
      targetWorkObj.sessionsPlanned = targetWorkObj.sessionsPlanned || [];
      targetWorkObj.sessionsPlanned.push(mission.id);
    }

    game.missions.push(mission);
    game.saveGame();
    game.updateStatsUI();

    const modal = document.getElementById('plan-travaux-modal');
    if (modal) modal.remove();

    game.showToast(
      'Session Travaux Planifiée 📋',
      `« ${mission.title} » est enregistrée au planning (${durationHours}h, max ${maxVols} bénévoles). Les secouristes vont s'inscrire selon leurs disponibilités !`,
      'green'
    );

    this.renderModal(game);
  },

  // Appelée lorsqu'une mission de travaux se termine
  onTravauxMissionCompleted(game, mission) {
    if (!mission || mission.type !== 'travaux') return;
    const station = game.stations.find(s => s.id === mission.stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);

    const vols = (mission.registeredVolunteers || [])
      .map(id => (game.volunteers || []).find(v => v.id === id))
      .filter(Boolean);

    const durationHours = mission.durationHours || Math.max(1, Math.round((mission.durationSeconds || 10800) / 3600));
    const hoursGained = vols.length * durationHours;

    // Récompenses et fatigue aux bénévoles
    vols.forEach(v => {
      v.moral = Math.min(100, (v.moral || 70) + 25);
      v.motivation = v.moral;
      v.humeur = v.moral;
      v.exp = (v.exp || 0) + 20;
      v.fatigue = Math.min(100, (v.fatigue || 20) + (durationHours * 3));
      v.energy = Math.max(0, 100 - v.fatigue);
      v.status = 'dispo';
    });

    if (mission.roomKey === 'isolation') {
      const vw = premises.isolationVolunteerWork;
      if (vw) {
        vw.currentHours = (vw.currentHours || 0) + hoursGained;
        if (vw.currentHours >= (vw.requiredHours || 60)) {
          premises.isolationLevel = 3;
          delete premises.isolationVolunteerWork;
          game.showToast('🎉 Isolation BBC Achevée !', `Chantier participatif terminé avec succès par vos bénévoles ! Bâtiment isolé standard BBC.`, 'green');
        } else {
          game.showToast('🔨 Session Travaux Clôturée', `+${hoursGained}h apportées par vos ${vols.length} bénévoles (${vw.currentHours}/${vw.requiredHours}h). Planifiez la prochaine session !`, 'blue');
        }
      }
      return;
    }

    const room = premises.rooms?.[mission.roomKey];
    if (room && room.volunteerWork) {
      const vw = room.volunteerWork;
      vw.currentHours = (vw.currentHours || 0) + hoursGained;
      const req = vw.requiredHours || 50;

      if (vw.currentHours >= req) {
        const newLvl = vw.targetLevel || (room.level + 1);
        room.level = newLvl;
        room.state = 100;
        if (mission.roomKey === 'garage_remisage') {
          room.capacity = newLvl === 2 ? 4 : 8;
          station.rooms = station.rooms || {};
          station.rooms.garage = newLvl;
          station.rooms.garage_remisage = room;
          station.garageCapacity = room.capacity;
        } else if (mission.roomKey === 'salle_formation_psc1') {
          room.capacity = newLvl === 2 ? 20 : 30;
        }
        delete room.volunteerWork;
        game.showToast('🎉 Chantier Participatif Réussi !', `Grâce à la mobilisation collective (${vols.length} bénévoles sur la dernière session), ${room.name} est officiellement inauguré au Niveau ${room.level} !`, 'green');
      } else {
        const pct = Math.round((vw.currentHours / req) * 100);
        game.showToast('🔨 Session Travaux Clôturée', `+${hoursGained}h d'avancement apportées par vos ${vols.length} bénévoles (${vw.currentHours}/${req}h, ${pct}%). Planifiez la prochaine session !`, 'blue');
      }
    }
  },

  ensureModularPremises(station, game) {
    if (!station) return null;
    if (!station.premises) {
      station.premises = {};
    }
    const p = station.premises;
    p.name = p.name || ('Base Opérationnelle - ' + (station.name || 'Antenne Locale'));
    p.address = p.address || ((station.city || 'Nancy') + ' Centre');
    p.commune = p.commune || station.city || 'Nancy';

    // 2. Statut d'occupation réaliste : mise_a_disposition_mairie | location_privee | pleine_propriete
    if (!p.occupationType) {
      p.occupationType = p.tenure === 'owned' ? 'pleine_propriete' : 'mise_a_disposition_mairie';
    }
    p.monthlyRent = p.occupationType === 'location_privee' ? (p.monthlyRent || 850) : 0;
    p.buyoutPrice = p.buyoutPrice || 55000;
    p.evictionNotice = p.evictionNotice || false;
    p.chargesImposed = p.chargesImposed || false;

    // 4. Charges de fluides, isolation & conformité ERP
    if (p.fluidesBaseCost === undefined) p.fluidesBaseCost = 180;
    if (p.isolationLevel === undefined) p.isolationLevel = 2; // 1: Passoire, 2: Standard, 3: BBC
    if (p.heatingWorking === undefined) p.heatingWorking = true;
    if (p.maintenanceState === undefined) p.maintenanceState = 90;
    if (p.erpStatus === undefined) p.erpStatus = 'conforme';
    if (p.erpSecurityScore === undefined) p.erpSecurityScore = 90;
    if (p.erpExtincteursChecked === undefined) p.erpExtincteursChecked = true;
    if (p.erpBaesChecked === undefined) p.erpBaesChecked = true;
    if (p.erpRegisterUpToDate === undefined) p.erpRegisterUpToDate = true;

    // 1. Les 5 Pièces / Modules spécialisés
    p.rooms = p.rooms || {};

    // 1.1 Garage & Remisage
    if (!p.rooms.garage_remisage) {
      p.rooms.garage_remisage = {
        id: 'garage_remisage',
        name: 'Garage & Remisage Véhicules',
        icon: '🚑',
        level: 1, // 1: 2 places, 2: 4 places, 3: 8 places
        capacity: 2,
        hasAtelierMecanique: false,
        state: 90,
        craftsmanCost: 2200,
        volunteerMatCost: 750,
        reqVolunteers: 3
      };
    } else {
      const gLvl = p.rooms.garage_remisage.level || 1;
      const expectedCap = gLvl === 1 ? 2 : (gLvl === 2 ? 4 : 8);
      if (!p.rooms.garage_remisage.capacity || p.rooms.garage_remisage.capacity < expectedCap) {
        p.rooms.garage_remisage.capacity = expectedCap;
      }
    }

    // Synchronisation pour rétrocompatibilité et accès direct
    station.rooms = station.rooms || {};
    station.rooms.garage = p.rooms.garage_remisage.level;
    station.rooms.garage_remisage = p.rooms.garage_remisage;
    station.garageCapacity = p.rooms.garage_remisage.capacity;

    // 1.2 Sas Désinfection & Pharmacie
    if (!p.rooms.sas_desinfection_pharmacie) {
      p.rooms.sas_desinfection_pharmacie = {
        id: 'sas_desinfection_pharmacie',
        name: 'Sas Désinfection & Pharmacie',
        icon: '🧪',
        level: 1, // 1: Standard, 2: Point d'eau VPSP rapide (-50% temps), 3: Pharmacie sécurisée grand stock
        hasWaterPoint: false,
        state: 85,
        craftsmanCost: 1600,
        volunteerMatCost: 550,
        reqVolunteers: 3
      };
    }

    // 1.3 Salle de Formation PSC1
    if (!p.rooms.salle_formation_psc1) {
      p.rooms.salle_formation_psc1 = {
        id: 'salle_formation_psc1',
        name: 'Salle Pédagogique PSC1',
        icon: '🎓',
        level: 1, // 0: 0p, 1: 10p, 2: 20p, 3: 30p
        capacity: 10,
        hasVideoprojecteur: false,
        hasQcprMannequins: false,
        state: 90,
        craftsmanCost: 2500,
        volunteerMatCost: 850,
        reqVolunteers: 4
      };
    }

    // 1.4 Foyer Vie Associative
    if (!p.rooms.foyer_vie_associative) {
      p.rooms.foyer_vie_associative = {
        id: 'foyer_vie_associative',
        name: 'Foyer & Vie Associative',
        icon: '☕',
        level: 1, // 1: Basique, 2: Convivial (+moral passif), 3: Espace détente premium (+moral & cohésion)
        state: 95,
        hasCuisineEquipee: false,
        craftsmanCost: 1200,
        volunteerMatCost: 400,
        reqVolunteers: 3
      };
    }

    // 1.5 Bureau Direction & PC Radio
    if (!p.rooms.bureau_pc_radio) {
      p.rooms.bureau_pc_radio = {
        id: 'bureau_pc_radio',
        name: 'Bureau Direction & PC Radio',
        icon: '📡',
        level: 1, // 1: 1 DPS, 2: 3 DPS simultanés, 3: Coordination illimitée / Salle COD
        state: 85,
        craftsmanCost: 1800,
        volunteerMatCost: 600,
        reqVolunteers: 3
      };
    }

    p.ongoingWorks = p.ongoingWorks || [];

    // Verrouillage mensuel immédiat si un incident a déjà eu lieu dans l'historique
    if (!p.lastSecurityIncidentMonth && Array.isArray(p.securityLogs) && p.securityLogs.length > 0) {
      const curYear = (game && game.clock && game.clock.year) || new Date().getFullYear();
      const curMonth = (game && game.clock && game.clock.month !== undefined) ? game.clock.month : new Date().getMonth();
      p.lastSecurityIncidentMonth = `${curYear}-${curMonth}`;
      p.lastSecurityIncidentTimestamp = Date.now();
    }

    return p;
  },

  // Calcul des véhicules abrités vs stationnés dehors
  getVehiclesShelterStatus(game, stationId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return { shelteredVehicles: [], unshelteredVehicles: [], capacity: 0 };
    const premises = this.ensureModularPremises(station, game);
    const capacity = premises.rooms?.garage_remisage?.capacity || 2;
    const stationVehicles = (game.vehicles || []).filter(v => v.stationId === station.id);

    const shelteredVehicles = stationVehicles.slice(0, capacity);
    const unshelteredVehicles = stationVehicles.slice(capacity);

    shelteredVehicles.forEach(v => { v.isSheltered = true; });
    unshelteredVehicles.forEach(v => { v.isSheltered = false; });

    return {
      shelteredVehicles,
      unshelteredVehicles,
      capacity,
      totalCount: stationVehicles.length
    };
  },

  // Amélioration d'une pièce : Artisans vs Chantier Bénévoles
  async upgradeRoom(game, stationId, roomId, mode) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);
    const room = premises.rooms?.[roomId];
    if (!room) return;

    if (room.level >= 3) {
      game.showToast('Niveau Maximum', room.name + ' a déjà atteint son niveau maximal d\'aménagement.', 'blue');
      return;
    }

    const targetLevel = (room.level || 1) + 1;
    const spec = this.getRoomWorkSpec(roomId, targetLevel);

    if (mode === 'artisan') {
      const cost = room.craftsmanCost || 2000;
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', 'L\'intervention des artisans requiert ' + cost + ' €.', 'orange');
        return;
      }

      const confirmed = await window.ProtecDialog.confirm(
        `DEVIS TRAVAUX ARTISANS DU BÂTIMENT :\n\n• Pièce ciblée : ${room.name} (Niveau ${targetLevel})\n• Coût de l'intervention clé en main : ${cost} €\n• Durée des travaux : ${spec.artisanHours} heures réelles (en tâche de fond)\n\nPendant toute la durée du chantier, la pièce reste utilisable à son niveau actuel (Niveau ${room.level}).\n\nConfirmez-vous le lancement des travaux par les artisans ?`,
        'Intervention Artisans du Bâtiment',
        { confirmText: `Engager les Artisans (-${cost} €)`, cancelText: 'Annuler' }
      );
      if (!confirmed) return;

      game.resources.money -= cost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -cost, `Travaux Artisans : ${room.name} (Niv. ${targetLevel})`, 'locaux');
      }

      room.artisanWork = {
        targetLevel: targetLevel,
        cost: cost,
        startTime: Date.now(),
        targetCompletionTime: Date.now() + (spec.artisanHours * 3600000),
        durationHours: spec.artisanHours
      };

      game.showToast(
        'Artisans Déployés 👷',
        `Le chantier pour ${room.name} est lancé ! Livraison prévue dans ${spec.artisanHours} heures réelles.`,
        'blue'
      );
    } else if (mode === 'chantier_benevole') {
      const matCost = room.volunteerMatCost || 700;
      if (game.resources.money < matCost) {
        game.showToast('Fonds Insuffisants', 'L\'achat des matériaux de construction requiert ' + matCost + ' €.', 'orange');
        return;
      }

      const confirmed = await window.ProtecDialog.confirm(
        `CHANTIER PARTICIPATIF DES BÉNÉVOLES :\n\n• Pièce ciblée : ${room.name} (Niveau ${targetLevel})\n• Coût d'achat des matériaux : ${matCost} €\n• Effort requis : ${spec.volunteerHours} heures-bénévoles\n\nVous pourrez ensuite planifier des sessions de travaux au planning selon vos créneaux souhaités. Les bénévoles s'inscriront selon leurs disponibilités.\n\nConfirmez-vous l'achat des matériaux pour démarrer le chantier ?`,
        'Lancement Chantier Bénévoles',
        { confirmText: `Acheter les Matériaux (-${matCost} €)`, cancelText: 'Annuler' }
      );
      if (!confirmed) return;

      game.resources.money -= matCost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -matCost, `Achat matériaux chantier : ${room.name} (Niv. ${targetLevel})`, 'locaux');
      }

      room.volunteerWork = {
        targetLevel: targetLevel,
        materialCostPaid: matCost,
        requiredHours: spec.volunteerHours,
        currentHours: 0,
        sessionsPlanned: []
      };

      game.showToast(
        'Matériaux Livrés 🔨',
        `Les matériaux sont arrivés au local ! Vous pouvez maintenant planifier vos sessions de travaux.`,
        'green'
      );

      this.renderModal(game);
      setTimeout(() => {
        this.openPlanTravauxSessionModal(game, stationId, roomId);
      }, 350);
      return;
    }

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  installRoomExtension(game, stationId, roomId, extensionKey, mode) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);
    const room = premises.rooms?.[roomId];
    if (!room) return;

    let cost = 0;
    let label = '';

    if (roomId === 'garage_remisage' && extensionKey === 'atelier_mecanique') {
      cost = mode === 'artisan' ? 1500 : 500;
      label = 'Atelier Mécanique Interne (Entretien flotte -50%)';
      room.hasAtelierMecanique = true;
    } else if (roomId === 'sas_desinfection_pharmacie' && extensionKey === 'point_d_eau_vpsp') {
      cost = mode === 'artisan' ? 1200 : 400;
      label = 'Centrale de Bionettoyage & Point d\'Eau VPSP (-50% temps réarmement)';
      room.hasWaterPoint = true;
    } else if (roomId === 'salle_formation_psc1' && extensionKey === 'videoprojecteur') {
      cost = 650;
      label = 'Vidéoprojecteur Interactif HD Pédagogique';
      room.hasVideoprojecteur = true;
    } else if (roomId === 'salle_formation_psc1' && extensionKey === 'mannequins_qcpr') {
      cost = 1400;
      label = 'Pack Mannequins Connectés QCPR (Qualité Massage & Notoriété)';
      room.hasQcprMannequins = true;
    } else if (roomId === 'foyer_vie_associative' && extensionKey === 'cuisine_equipee') {
      cost = mode === 'artisan' ? 1600 : 550;
      label = 'Cuisine Aménagée Conviviale & Machine à Café Pro';
      room.hasCuisineEquipee = true;
    }

    if (game.resources.money < cost) {
      game.showToast('Trésorerie Insuffisante', 'L\'installation requiert ' + cost + ' €.', 'orange');
      return;
    }

    game.resources.money -= cost;
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -cost, 'Installation extension : ' + label, 'locaux');
    }

    game.showToast('Extension Opérationnelle ✓', label + ' est désormais installée dans ' + room.name + ' !', 'green');
    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Changement du statut d'occupation (Mairie vs Location privée vs Pleine propriété)
  changeOccupationType(game, stationId, newType) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);
    const city = station.city || 'Nancy';
    const repCity = (game.reputation_villes && game.reputation_villes[city] !== undefined) ? game.reputation_villes[city] : 50;

    if (newType === 'mise_a_disposition_mairie') {
      if (repCity < 40) {
        game.showToast('Refus Municipal 🏛️', 'La Mairie de ' + city + ' exige une réputation d\'au moins 40/100 pour accorder un local gracieux (' + repCity + '/100 actuel).', 'orange');
        return;
      }
      premises.occupationType = 'mise_a_disposition_mairie';
      premises.monthlyRent = 0;
      premises.evictionNotice = false;
      premises.chargesImposed = false;
      game.showToast('Convention Mairie Signée ✓', 'La Mairie de ' + city + ' met gracieusement à disposition votre bâtiment (0 € de loyer mensuel) !', 'green');
    } else if (newType === 'location_privee') {
      premises.occupationType = 'location_privee';
      premises.monthlyRent = 850;
      premises.evictionNotice = false;
      premises.chargesImposed = false;
      game.showToast('Bail Commercial Privé', 'Vous avez signé un bail dans le secteur privé (loyer 850 €/mois). Vous êtes 100% indépendant de la Mairie.', 'blue');
    } else if (newType === 'pleine_propriete') {
      const price = premises.buyoutPrice || 55000;
      if (game.resources.money < price) {
        game.showToast('Fonds Insuffisants', 'L\'acquisition définitive des murs requiert ' + price.toLocaleString('fr-FR') + ' €.', 'orange');
        return;
      }
      game.resources.money -= price;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -price, 'Acquisition définitive des murs - Pleine Propriété', 'locaux');
      }
      premises.occupationType = 'pleine_propriete';
      premises.monthlyRent = 0;
      premises.tenure = 'owned';
      premises.evictionNotice = false;
      premises.chargesImposed = false;
      game.showToast('🎉 Félicitations : Pleine Propriété !', 'L\'antenne est propriétaire définitive de son bâtiment ! Loyer supprimé à vie et patrimoine valorisé.', 'green');
    }

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Audit & Maintenance de sécurité ERP (Établissement Recevant du Public)
  conductErpAuditAndMaintenance(game, stationId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);

    const cost = 220;
    if (game.resources.money < cost) {
      game.showToast('Fonds Insuffisants', 'Le contrôle réglementaire ERP (extincteurs, BAES, registre) requiert ' + cost + ' €.', 'orange');
      return;
    }

    game.resources.money -= cost;
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -cost, 'Maintenance réglementaire ERP (Extincteurs & Blocs BAES)', 'locaux');
    }

    premises.erpStatus = 'conforme';
    premises.erpSecurityScore = 100;
    premises.erpExtincteursChecked = true;
    premises.erpBaesChecked = true;
    premises.erpRegisterUpToDate = true;
    premises.lastErpAuditTimestamp = Date.now();
    premises.lastErpInspectionDate = Date.now();
    // Repousser le prochain contrôle inopiné ERP à dans 1 mois en moyenne (20 à 40 jours aléatoires)
    const nextRandomDays = 20 + Math.random() * 20;
    premises.nextErpInspectionDate = Date.now() + Math.round(nextRandomDays * 86400 * 1000);

    game.showToast('Audit & Registre ERP Validés ✓', 'Extincteurs vérifiés, blocs de secours opérationnels et registre de sécurité visé. Salle de formation 100% conforme !', 'green');
    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Travaux d'isolation thermique (BBC)
  upgradeInsulation(game, stationId, mode) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;
    const premises = this.ensureModularPremises(station, game);

    if (premises.isolationLevel >= 3) {
      game.showToast('Déjà Isolé', 'Le bâtiment bénéficie déjà du standard d\'isolation BBC haute performance.', 'blue');
      return;
    }

    if (mode === 'artisan') {
      const cost = 3500;
      if (game.resources.money < cost) {
        game.showToast('Fonds Insuffisants', 'Les travaux d\'isolation par artisans requièrent ' + cost + ' €.', 'orange');
        return;
      }
      game.resources.money -= cost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -cost, 'Travaux d\'isolation thermique BBC (Artisans)', 'locaux');
      }
      premises.isolationLevel = 3;
      game.showToast('Isolation BBC Terminée ✓', 'Bâtiment isolé standard BBC ! Factures de chauffage réduites de 30% et protection intégrale contre le gel.', 'green');
    } else {
      const matCost = 1200;
      if (game.resources.money < matCost) {
        game.showToast('Fonds Insuffisants', 'L\'achat de laine de verre et double vitrage requiert ' + matCost + ' €.', 'orange');
        return;
      }
      const availableVols = (game.volunteers || []).filter(v => v.status === 'dispo' && (!v.fatigue || v.fatigue < 80));
      if (availableVols.length < 4) {
        game.showToast('Bénévoles Manquants', 'Le chantier d\'isolation requiert au moins 4 bénévoles disponibles.', 'orange');
        return;
      }
      game.resources.money -= matCost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -matCost, 'Matériaux isolation thermique - Chantier Bénévoles', 'locaux');
      }
      availableVols.slice(0, 4).forEach(v => {
        v.fatigue = Math.min(100, (v.fatigue || 20) + 18);
        v.energy = Math.max(0, 100 - v.fatigue);
        v.moral = Math.min(100, (v.moral || 70) + 20);
        v.motivation = v.moral;
        v.humeur = v.moral;
      });
      premises.isolationLevel = 3;
      game.showToast('🎉 Chantier Isolation Réussi !', '4 bénévoles ont isolé les combles et posé les doubles vitrages ! Factures réduites de 30%.', 'green');
    }

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Tableau de bord modulaire principal (les 5 pièces spécialisées, statut d'occupation et garage)
  renderModulaireTab(game, station, premises, stats) {
    const shelter = this.getVehiclesShelterStatus(game, station.id);
    const repCity = (game.reputation_villes && game.reputation_villes[station.city]) !== undefined ? game.reputation_villes[station.city] : 55;
    const isMairie = premises.occupationType === 'mise_a_disposition_mairie';
    const isPrive = premises.occupationType === 'location_privee';
    const isOwner = premises.occupationType === 'pleine_propriete';

    const fluidesEstimate = Math.round(
      (premises.fluidesBaseCost || 180) * 
      (premises.isolationLevel === 1 ? 1.8 : (premises.isolationLevel === 3 ? 0.7 : 1.0))
    );

    const rooms = premises.rooms || {};
    const garage = rooms.garage_remisage;
    const sas = rooms.sas_desinfection_pharmacie;
    const psc1 = rooms.salle_formation_psc1;
    const foyer = rooms.foyer_vie_associative;
    const pcRadio = rooms.bureau_pc_radio;

    return `
      <div class="space-y-4">
        <!-- 1. CARTE D'IDENTITÉ & STATUT D'OCCUPATION DU BÂTIMENT -->
        <div class="p-4 rounded-3xl glass-card border border-indigo-200/80 shadow-xs space-y-3.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl">${isOwner ? '🏛️' : (isMairie ? '🏢' : '🏭')}</span>
                <h4 class="text-sm font-black text-slate-900 leading-tight">${premises.name}</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isOwner ? 'bg-emerald-100 text-emerald-800' : (isMairie ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}">
                  ${isOwner ? 'Pleine Propriété' : (isMairie ? 'Mise à Disposition Mairie' : 'Location Privée')}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">📍 ${premises.address} • Commune : <strong>${station.city}</strong></p>
            </div>

            <!-- Indicateurs Économiques du Bâtiment -->
            <div class="flex items-center gap-3 text-xs">
              <div class="text-right">
                <div class="text-[10px] text-slate-400 font-semibold">Loyer Mensuel</div>
                <strong class="font-mono ${premises.monthlyRent === 0 ? 'text-emerald-700' : 'text-slate-800'}">
                  ${premises.monthlyRent === 0 ? '0 € (Gratuit)' : (premises.monthlyRent + ' € / mois')}
                </strong>
              </div>
              <div class="text-right border-l border-slate-200 pl-3">
                <div class="text-[10px] text-slate-400 font-semibold">Fluides & Énergie</div>
                <strong class="font-mono text-slate-800">~${fluidesEstimate} € / mois</strong>
              </div>
            </div>
          </div>

          <!-- Alertes Politiques & Aléa Mairie si réputation fragile -->
          ${isMairie ? `
            <div class="p-3 rounded-2xl ${repCity < 30 ? 'bg-red-50 border-2 border-red-300 ring-2 ring-red-100 text-red-900' : 'bg-slate-50 border border-slate-200 text-slate-700'} text-xs space-y-1.5">
              <div class="flex items-center justify-between font-bold">
                <span class="flex items-center gap-1.5">
                  <span>🏛️</span> Relations Mairie de ${station.city}
                </span>
                ${repCity < 30 ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">⚠️ TENSIONS MUNICIPALES • PRÉAVIS EXPULSION</span>' : '<span class="text-[10px] text-emerald-700 font-extrabold">✓ Soutien communal maintenu</span>'}
              </div>
              <p class="text-[11px] ${repCity < 30 ? 'text-red-800 font-semibold' : 'text-slate-500'}">
                ${repCity < 30 ? 'Alerte : Le Maire et les élus exigent 650 € d\'indemnité d\'occupation et menacent de reprendre les clés sous 30 jours ! Redressez vos relations sur les DPS ou louez dans le privé.' : 'La municipalité met gracieusement à disposition votre bâtiment tant que la convention est respectée.'}
              </p>
            </div>
          ` : ''}

          <!-- Conformité ERP & Isolation Thermique -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div class="p-3 rounded-2xl bg-white/90 border border-slate-200 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 font-extrabold text-slate-800">
                  <span>🧯</span> Conformité ERP (${premises.erpSecurityScore}%)
                </div>
                <span class="text-[10px] text-slate-500">
                  ${premises.erpStatus === 'conforme' ? 'Extincteurs & Blocs BAES vérifiés ✓' : '🚨 Salle PSC1 suspendue par la sécurité'}
                </span>
              </div>
              <button onclick="window.ProtecLocaux.conductErpAuditAndMaintenance(window.game, '${station.id}')" class="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10.5px] transition">
                Audit (220 €)
              </button>
            </div>

            <div class="p-3 rounded-2xl bg-white/90 border border-slate-200 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 font-extrabold text-slate-800">
                  <span>🌡️</span> Isolation : ${premises.isolationLevel === 3 ? 'BBC Double Vitrage ✓' : (premises.isolationLevel === 2 ? 'Standard' : 'Passoire thermique ⚠️')}
                </div>
                <span class="text-[10px] text-slate-500">
                  ${premises.isolationLevel === 3 ? 'Factures de chauffage -30%' : (premises.isolationLevel === 1 ? 'Surconsommation hiver +80%' : 'Isolation intermédiaire')}
                </span>
              </div>
              ${this.renderInsulationActionBlock(station, premises)}
            </div>
          </div>

          <!-- Actions de Changement de Statut Juridique -->
          <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            ${!isOwner ? `
              <button onclick="window.ProtecLocaux.changeOccupationType(window.game, '${station.id}', 'pleine_propriete')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black hover:brightness-110 shadow transition flex items-center gap-1">
                <span>🏛️</span> Racheter les Murs (${(premises.buyoutPrice || 55000).toLocaleString('fr-FR')} €)
              </button>
            ` : ''}
            ${!isPrive && !isOwner ? `
              <button onclick="window.ProtecLocaux.changeOccupationType(window.game, '${station.id}', 'location_privee')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">
                Bail Privé Indépendant (850 €/mois)
              </button>
            ` : ''}
            ${isPrive ? `
              <button onclick="window.ProtecLocaux.changeOccupationType(window.game, '${station.id}', 'mise_a_disposition_mairie')" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-extrabold transition">
                Demander Convention Mairie Gratuite (≥40 pts réputation)
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 2. VOLET GARAGE & REMISAGE FLOTTE : VÉHICULES ABRITÉS VS DEHORS -->
        <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🚑</span>
              <div>
                <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider">Capacité de Remisage Véhicules</h4>
                <p class="text-[11px] text-slate-500">${shelter.capacity} place(s) couverte(s) protégée(s) • ${shelter.totalCount} véhicule(s) à l\'antenne</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              ${garage.hasAtelierMecanique ? `
                <span class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  🔧 Atelier Mécanique Actif (-50% garage)
                </span>
              ` : `
                <button onclick="window.ProtecLocaux.installRoomExtension(window.game, '${station.id}', 'garage_remisage', 'atelier_mecanique', 'chantier_benevole')" class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition">
                  + Créer Atelier Interne (500 € chantier)
                </button>
              `}
            </div>
          </div>

          <!-- Liste des véhicules abrités vs stationnés dehors -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-black text-emerald-900">
                <span>🛡️ À l\'Abri dans le Garage (${shelter.shelteredVehicles.length}/${shelter.capacity})</span>
                <span class="text-emerald-700">Protégés du gel & météo</span>
              </div>
              ${shelter.shelteredVehicles.length === 0 ? '<span class="text-[10px] text-slate-400 italic">Aucun véhicule</span>' : `
                <div class="flex flex-wrap gap-1.5">
                  ${shelter.shelteredVehicles.map(v => `
                    <span class="px-2 py-0.5 rounded-lg bg-white border border-emerald-200 text-[10.5px] font-extrabold text-emerald-900 shadow-2xs">
                      ${v.name} (${v.type})
                    </span>
                  `).join('')}
                </div>
              `}
            </div>

            <div class="p-3 rounded-2xl ${shelter.unshelteredVehicles.length > 0 ? 'bg-amber-50/70 border border-amber-300' : 'bg-slate-50 border border-slate-200'} space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-black ${shelter.unshelteredVehicles.length > 0 ? 'text-amber-900' : 'text-slate-600'}">
                <span>🌧️ Stationnés Dehors (${shelter.unshelteredVehicles.length})</span>
                <span class="${shelter.unshelteredVehicles.length > 0 ? 'text-amber-700' : 'text-slate-400'}">Usure accrue carrosserie & batterie</span>
              </div>
              ${shelter.unshelteredVehicles.length === 0 ? '<span class="text-[10px] text-emerald-600 font-semibold">Tous vos véhicules dorment à l\'abri ! ✓</span>' : `
                <div class="flex flex-wrap gap-1.5">
                  ${shelter.unshelteredVehicles.map(v => `
                    <span class="px-2 py-0.5 rounded-lg bg-white border border-amber-300 text-[10.5px] font-extrabold text-amber-900 shadow-2xs">
                      ⚠️ ${v.name}
                    </span>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- 3. GRILLE DES 5 PIÈCES / MODULES SPÉCIALISÉS DE L'ANTENNE -->
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-black text-slate-700">
            <span>Zonage Modulaire & Salles Opérationnelles</span>
            <span class="text-[11px] text-slate-500 font-semibold">2 modes d\'aménagement : Artisans (instantané) vs Chantier Bénévoles (matériaux & moral)</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <!-- PIÈCE 1 : GARAGE & REMISAGE -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${garage.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">${garage.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau ${garage.level} • Capacité : ${garage.capacity} véhicules couverts</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-800">
                  Remisage
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Protège les ambulances VPSP et vecteurs contre la pluie, la canicule et le gel. ${garage.hasAtelierMecanique ? '✓ Atelier mécanique intégré réduisant de 50% les frais d\'entretien garage.' : 'Possibilité d\'installer un atelier pour réparations internes.'}
              </p>
              ${this.renderRoomActionBlock(station, "garage_remisage", garage, premises)}
            </div>

            <!-- PIÈCE 2 : SAS DÉSINFECTION & PHARMACIE -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${sas.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">${sas.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau ${sas.level} • Stockage Lots A/B & Oxygène</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-teal-800">
                  Hygiène & O2
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Stockage sécurisé des consommables de secours. ${sas.hasWaterPoint ? '✓ Point d\'eau chaude et centrale de désinfection VPSP : temps de réarmement post-mission divisé par 2 !' : 'Installation recommandée d\'un point d\'eau chaude pour accélérer le réarmement VPSP.'}
              </p>
              <div class="space-y-2 pt-1 border-t border-slate-100">
                ${!sas.hasWaterPoint ? `
                  <button onclick="window.ProtecLocaux.installRoomExtension(window.game, '${station.id}', 'sas_desinfection_pharmacie', 'point_d_eau_vpsp', 'chantier_benevole')" class="w-full py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-[10.5px] font-extrabold border border-teal-200 transition">
                    + Installer Centrale Désinfection VPSP (400 € chantier / 3 bénév.)
                  </button>
                ` : ''}
                ${this.renderRoomActionBlock(station, "sas_desinfection_pharmacie", sas, premises)}
              </div>
            </div>

            <!-- PIÈCE 3 : SALLE DE FORMATION PSC1 -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${psc1.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">${psc1.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau ${psc1.level} • Capacité : ${psc1.capacity} apprenants</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-800">
                  Pôle Formation
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Conditionne les sessions de formation citoyenne PSC1/GQS. ${psc1.hasVideoprojecteur ? '✓ Vidéoprojecteur interactif actif (+20% inscrits).' : ''} ${psc1.hasQcprMannequins ? '✓ Mannequins connectés QCPR actifs (+15 €/personne).' : ''}
              </p>
              <div class="space-y-2 pt-1 border-t border-slate-100">
                <div class="flex flex-wrap gap-2">
                  ${!psc1.hasVideoprojecteur ? `
                    <button onclick="window.ProtecLocaux.installRoomExtension(window.game, '${station.id}', 'salle_formation_psc1', 'videoprojecteur')" class="py-1 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-[10px] font-extrabold border border-purple-200 transition">
                      + Vidéoprojecteur (650 €)
                    </button>
                  ` : ''}
                  ${!psc1.hasQcprMannequins ? `
                    <button onclick="window.ProtecLocaux.installRoomExtension(window.game, '${station.id}', 'salle_formation_psc1', 'mannequins_qcpr')" class="py-1 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-[10px] font-extrabold border border-purple-200 transition">
                      + Mannequins QCPR (1 400 €)
                    </button>
                  ` : ''}
                </div>
                ${this.renderRoomActionBlock(station, "salle_formation_psc1", psc1, premises)}
              </div>
            </div>

            <!-- PIÈCE 4 : FOYER & VIE ASSOCIATIVE -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${foyer.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">${foyer.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau ${foyer.level} • Régénération passive du moral</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800">
                  Cohésion
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Espace détente (canapés, cuisine, café). Régénère passivement le moral des secouristes présents au local (+3 à +8 pts/cycle) et réduit l\'attrition/départ des membres.
              </p>
              ${this.renderRoomActionBlock(station, "foyer_vie_associative", foyer, premises)}
            </div>

            <!-- PIÈCE 5 : BUREAU PC RADIO & COMMANDEMENT -->
            <div class="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 md:col-span-2">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${pcRadio.icon}</span>
                  <div>
                    <h5 class="text-xs font-black text-slate-900 leading-tight">${pcRadio.name}</h5>
                    <span class="text-[10px] font-bold text-slate-500">Niveau ${pcRadio.level} • Régulation & Coordination multi-DPS</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800">
                  Commandement
                </span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                Poste de commandement radio et régulation opérationnelle. Permet la coordination simultanée de plusieurs dispositifs de secours (${pcRadio.level === 1 ? '1 DPS majeur' : (pcRadio.level === 2 ? '3 DPS simultanés sans pénalité' : 'Coordination illimitée / Salle de crise COD')}).
              </p>
              ${this.renderRoomActionBlock(station, "bureau_pc_radio", pcRadio, premises)}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getStationPremises(game, stationId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return null;
    return this.ensureModularPremises(station, game);
  },
// Affecter un layout prédéfini à une antenne
  applyLayout(game, stationId, layout) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;

    station.premises = {
      buildingId: layout.id,
      name: layout.name,
      width: layout.width || 0,
      height: layout.height || 0,
      surfaceM2: layout.surfaceM2 || ((layout.width || 0) * (layout.height || 0) * 25),
      grid: Array.isArray(layout.grid) ? [...layout.grid] : [],
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
    if (!premises) {
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
        trainingQuality: 100,
        counts: {}
      };
    }

    const counts = {};
    for (const key of Object.keys(this.ZONE_TYPES)) {
      counts[key] = 0;
    }

    if (premises.grid && Array.isArray(premises.grid)) {
      premises.grid.forEach(tileKey => {
        if (counts[tileKey] !== undefined) {
          counts[tileKey]++;
        }
      });
    }

    // Statistiques de base issues des tuiles
    let storageCapacity = (counts.stockage || 0) * 50;
    let studentCapacity = (counts.formation || 0) * 6;
    let vehicleCapacity = ((counts.garage || 0) * 1) + ((counts.parking || 0) * 1);
    let energyRegen = (counts.detente || 0) * 15;
    let moralBonus = (counts.detente || 0) * 5;
    let nightBeds = (counts.dortoir || 0) * 2;
    let trainingQuality = 100; // Base 100%

    // Intégration du plan d'architecte réel (architecture CAD / Les Sims)
    const arch = premises.architecture;
    if (arch) {
      // 1. Pièces et vocations
      if (arch.rooms && Array.isArray(arch.rooms)) {
        arch.rooms.forEach(r => {
          if (r.type === 'formation' || r.name?.toLowerCase().includes('formation')) {
            studentCapacity += 8;
          } else if (r.type === 'stockage' || r.type === 'reserve' || r.name?.toLowerCase().includes('réserve')) {
            storageCapacity += 40;
          } else if (r.type === 'detente' || r.name?.toLowerCase().includes('foyer')) {
            energyRegen += 10;
            moralBonus += 5;
          } else if (r.type === 'dortoir' || r.name?.toLowerCase().includes('dortoir') || r.name?.toLowerCase().includes('garde')) {
            nightBeds += 2;
          }
        });
      }

      // 2. Parking opérationnel extérieur (spots)
      if (arch.parkingSpots && Array.isArray(arch.parkingSpots)) {
        vehicleCapacity += arch.parkingSpots.length;
      } else {
        vehicleCapacity = Math.max(vehicleCapacity, 2); // Minimum 2 places par défaut (parking cour)
      }

      // 3. Mobilier réel placé dans les pièces
      if (arch.furniture && Array.isArray(arch.furniture)) {
        arch.furniture.forEach(item => {
          switch (item.type) {
            case 'etagere_lots':
              storageCapacity += 35; // +35 capacité lots A/B
              break;
            case 'armoire_pharmacie':
              storageCapacity += 20; // +20 capacité consommables
              break;
            case 'casiers_vestiaire':
              storageCapacity += 25; // +25 capacité vestiaire / tenues
              moralBonus += 2;
              break;
            case 'rack_palettes_lourd':
              storageCapacity += 80; // +80 capacité rack lourd
              break;
            case 'casiers_tenues_xl':
              storageCapacity += 40; // +40 capacité vestiaires XL
              moralBonus += 3;
              break;
            case 'armoire_forte_securisee':
              storageCapacity += 25; // +25 capacité armoire forte
              trainingQuality += 5;
              break;
            case 'lits_superposes':
              nightBeds += 2; // +2 lits superposés
              energyRegen += 18;
              moralBonus += 4;
              break;
            case 'kitchenette_foyer':
              energyRegen += 15;
              moralBonus += 6;
              break;
            case 'table_repas_equipe':
              moralBonus += 8;
              energyRegen += 5;
              break;
            case 'ecran_tactique_interactif':
              trainingQuality += 20;
              moralBonus += 3;
              break;
            case 'mannequin_pediatrique':
              trainingQuality += 15;
              break;
            case 'dsa_demonstration':
              trainingQuality += 10;
              break;
            case 'table_formation':
              studentCapacity += 4; // +4 élèves par table
              break;
            case 'tableau_blanc':
              trainingQuality += 10; // +10% qualité pédagogique
              break;
            case 'mannequin_rcp':
              trainingQuality += 15; // +15% qualité formation
              break;
            case 'dae_mural':
              trainingQuality += 5;
              break;
            case 'lit_garde':
              nightBeds += 1; // +1 lit d'astreinte
              energyRegen += 10;
              break;
            case 'canape_detente':
              energyRegen += 10; // +10% régénération énergie
              moralBonus += 5;
              break;
            case 'machine_cafe':
              energyRegen += 5;
              moralBonus += 3;
              break;
            case 'bureau':
            case 'chaise':
              moralBonus += 1;
              break;
            case 'babyfoot':
              moralBonus += 8;
              break;
            case 'tv_foyer':
              moralBonus += 6;
              energyRegen += 5;
              break;
            case 'console_jeux':
              moralBonus += 10;
              break;
            case 'ping_pong':
              moralBonus += 5;
              energyRegen += 5;
              break;
            case 'distributeur_snacks':
              moralBonus += 4;
              energyRegen += 5;
              break;
          }
        });
      }
    } else {
      // Valeurs de base par défaut
      if (vehicleCapacity === 0) vehicleCapacity = 2;
      if (studentCapacity === 0) studentCapacity = 10;
      if (storageCapacity === 0) storageCapacity = 100;
    }

    const hasFormation = studentCapacity > 0;
    const hasStorage = storageCapacity > 0;

    return {
      surfaceM2: premises.surfaceM2 || 84.6,
      storageCapacity,
      studentCapacity,
      vehicleCapacity,
      hasFormation,
      hasStorage,
      energyRegen,
      moralBonus,
      nightBeds,
      trainingQuality,
      counts
    };
  },

  // Helpers pour les autres modules
  hasFormationRoom(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return true;
    if (prem.rooms?.salle_formation_psc1?.level > 0 || prem.rooms?.salle_formation?.level > 0) return true;
    if (prem.rooms && Object.values(prem.rooms).some(r => (r.id?.includes('formation') || r.name?.toLowerCase().includes('formation')) && r.level > 0)) return true;
    if (prem.grid) {
      const stats = this.calculatePremisesStats(prem);
      if (stats.hasFormation) return true;
    }
    return true; // Les antennes disposent toujours d'un espace pour accueillir des sessions
  },

  getFormationCapacity(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return 10;
    if (prem.rooms?.salle_formation_psc1?.capacity) return prem.rooms.salle_formation_psc1.capacity;
    if (prem.grid) {
      const stats = this.calculatePremisesStats(prem);
      if (stats.studentCapacity > 0) return stats.studentCapacity;
    }
    return 10;
  },

  getGarageCapacity(game, stationId) {
    if (!game) game = window.game;
    if (!game) return 2;
    const station = (game.stations || []).find(s => s.id === stationId) || (game.stations && game.stations[0]);
    if (!station) return 2;
    const prem = this.getStationPremises(game, station.id);
    const room = prem?.rooms?.garage_remisage || prem?.rooms?.garage;
    let cap = 2;
    if (room) {
      if (room.capacity && Number(room.capacity) > 0) {
        cap = Number(room.capacity);
      } else if (room.level) {
        cap = room.level === 1 ? 2 : (room.level === 2 ? 4 : 8);
      }
    }
    if ((prem?.grid || prem?.architecture) && typeof this.calculatePremisesStats === 'function') {
      const stats = this.calculatePremisesStats(prem);
      if (stats && stats.vehicleCapacity > cap) cap = stats.vehicleCapacity;
    }
    if (station.garageCapacity && Number(station.garageCapacity) > cap) {
      cap = Number(station.garageCapacity);
    }
    return cap;
  },

  getStationTrainingRoomsCount(station) {
    if (!station) return 1;
    if (station.trainingRoomsCount) return Math.max(1, Number(station.trainingRoomsCount));
    const prem = station.premises;
    if (!prem) return 1;

    // Si grille 2D personnalisée
    if (prem.grid && Array.isArray(prem.grid)) {
      const formationCells = prem.grid.filter(c => c && (c.type === 'formation' || c.zone === 'formation' || (c.roomId && c.roomId.includes('formation'))));
      if (formationCells.length >= 8) {
        return Math.min(4, Math.floor(formationCells.length / 4));
      }
    }

    const room = prem.rooms?.salle_formation_psc1 || prem.rooms?.salle_formation;
    const lvl = room?.level || 1;
    if (prem.archetype === 'centre_pedagogique') {
      return Math.max(2, lvl);
    }
    if (lvl >= 2) {
      return Math.min(3, lvl);
    }
    return 1;
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
    // Économie de stockage : le matériel armé à l'avance dans les véhicules LOG ne prend plus de place dans le bâtiment !
    let vehicleStoredVolume = 0;
    (game.vehicles || []).forEach(v => {
      if (v.logKit && window.ProtecCriseLogistique?.LOG_KITS?.[v.logKit]) {
        vehicleStoredVolume += window.ProtecCriseLogistique.LOG_KITS[v.logKit].buildingStorageSize || 10;
      }
    });
    used = Math.max(0, used - vehicleStoredVolume);
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
    // Test rarissime : toutes les 20 minutes réelles au maximum, et uniquement au coeur de la nuit (01h-04h in-game)
    const isDeepNight = game.clock && (game.clock.hour >= 1 && game.clock.hour <= 4);
    const intervalCheck = 20 * 60 * 1000; // 20 minutes réelles

    if (Date.now() - prem.lastSecurityCheck > intervalCheck) {
      prem.lastSecurityCheck = Date.now();
      if (isDeepNight) {
        this.checkSecurityEvents(game, prem, true);
      }
    }
  },

  // =========================================================================
  // GESTION DES RISQUES & ÉVÉNEMENTS DE SÉCURITÉ (Vol, Dégradation, Siphonage)
  // RÈGLE : TRÈS TRÈS RARE (MAXIMUM 1 FOIS PAR MOIS IN-GAME ET ENCORE)
  // =========================================================================
  checkSecurityEvents(game, prem, isNight) {
    if (!isNight) return;

    // 1. VERROUILLAGE MENSUEL STRICT : MAXIMUM 1 INCIDENT PAR MOIS CIVIL IN-GAME
    const curYear = (game.clock && game.clock.year) || new Date().getFullYear();
    const curMonth = (game.clock && game.clock.month !== undefined) ? game.clock.month : new Date().getMonth();
    const currentMonthKey = `${curYear}-${curMonth}`;

    if (prem.lastSecurityIncidentMonth === currentMonthKey) {
      // Déjà eu un incident au cours de ce mois in-game -> aucun nouvel incident autorisé
      return;
    }

    // 2. DÉLAI RÉEL MINIMUM DE SÉCURITÉ : Au moins 3 heures de jeu réelles consécutives
    if (prem.lastSecurityIncidentTimestamp && (Date.now() - prem.lastSecurityIncidentTimestamp < 3 * 3600 * 1000)) {
      return;
    }

    // 3. PROBABILITÉ RARISSIME PAR TEST (0.8% de base, encore plus faible avec des équipements)
    const securityScore = this.getSecurityScore(prem);
    const securityReduction = Math.max(0.12, (100 - securityScore) / 100);
    const triggerChance = 0.008 * securityReduction;

    if (Math.random() > triggerChance) return;

    // ENREGISTREMENT DU VERROU MENSUEL IMMÉDIAT
    prem.lastSecurityIncidentMonth = currentMonthKey;
    prem.lastSecurityIncidentTimestamp = Date.now();

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

    if (!Array.isArray(prem.securityLogs)) {
      prem.securityLogs = [];
    }

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
    if (!Array.isArray(prem.securityLogs)) prem.securityLogs = [];
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
  async buyoutPremisesWalls(game) {
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

    const confirmed = await window.ProtecDialog.confirm(
      `Confirmez-vous le rachat définitif des murs de « ${prem.name} » pour ${price.toLocaleString('fr-FR')} € ?\n\nEn devenant propriétaire en pleine propriété :\n• Fin définitive du loyer mensuel\n• Pleine liberté d'abattre et réaménager vos cloisons\n• Valorisation patrimoniale de l'antenne`,
      'Acte Notarié d\'Acquisition des Murs',
      { confirmText: 'Racheter les Murs', cancelText: 'Annuler' }
    );
    if (!confirmed) {
      return;
    }

    game.resources.money -= price;
    prem.tenure = 'owned';
    prem.monthlyRent = 0;

    if (!Array.isArray(prem.securityLogs)) prem.securityLogs = [];
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
  async onTileClick(game, tileIndex) {
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
    const confirmMsg = `DEVIS D'ARTISAN DU BÂTIMENT (Case #${tileIndex + 1}) :\n\n• Nouvelle pièce : ${zoneDef.name}\n• Coût des travaux : ${cost} €\n• Durée de chantier : ~${durationMin} min (${durationSec} sec)\n\nPendant les travaux, les artisans interviennent sur place. Confirmez-vous le lancement du chantier ?`;

    const confirmed = await window.ProtecDialog.confirm(confirmMsg, 'Lancement de Chantier', { confirmText: 'Lancer les Travaux', cancelText: 'Annuler' });
    if (!confirmed) return;

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
  async promptRushWork(game, work) {
    const rushCost = 350;
    const m = Math.floor(work.remainingSeconds / 60);
    const s = work.remainingSeconds % 60;
    const timeStr = `${m}m ${s}s`;

    const confirmed = await window.ProtecDialog.confirm(
      `Chantier en cours sur « ${work.name} ».\nTemps restant : ${timeStr}.\n\nVoulez-vous engager une équipe d'urgence pour terminer instantanément les travaux pour ${rushCost} € ?`,
      'Heures Supplémentaires Artisans',
      { confirmText: `Accélérer (-${rushCost} €)`, cancelText: 'Attendre la fin' }
    );

    if (confirmed) {
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
    window.ProtecDialog.alert(
      `En tant que locataire du bâtiment (Bail communal), vous n'avez pas l'autorisation d'abattre des murs, de percer ou de réaménager les cloisons.\n\nPour transformer librement vos locaux :\n• Rachetez les murs du bâtiment actuel dans l'onglet Plan d'Architecte (45 000 €)\n• Ou achetez un bâtiment neuf en pleine propriété dans le catalogue.`,
      'Aménagements Interdits en Location',
      { isDestructive: true }
    );
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

  // Installation de l'antenne dans un bâtiment du marché (achat ou location)
  _moveIntoBuilding(game, b, tenure) {
    const station = game.stations[0];
    if (!station) return;
    const oldName = station.premises && station.premises.name;
    this.applyLayout(game, station.id, b);
    const p = station.premises;
    p.architecture = JSON.parse(JSON.stringify(b.architecture));
    p.name = b.name;
    p.typology = b.typology;
    p.surfaceM2 = b.surfaceM2;
    if (tenure === 'owned') {
      p.tenure = 'owned';
      p.occupationType = 'pleine_propriete';
      p.monthlyRent = 0;
      p.purchasedAt = Date.now();
    } else {
      p.tenure = 'rented';
      p.occupationType = 'location_privee';
      p.monthlyRent = b.monthlyRent;
      p.buyoutPrice = Math.round(b.surfaceM2 * 1200 / 500) * 500;
      p.leaseStartedAt = Date.now();
    }
    if (oldName) p.securityLogs.push({ timestamp: Date.now(), type: 'info', title: 'Déménagement', message: `Départ de « ${oldName} ».` });
    this._currentSetupModel = null;
    this.selectedRoomId = null;
    this.selectedFurnitureId = null;
    this._viewBox = null;
  },

  // Achat d'un bâtiment existant (marché immobilier quotidien)
  async buyBuilding(game, buildingId) {
    const b = this.getDailyRealEstateOffers(game).find(x => x.id === buildingId) || (this.CATALOG_BUILDINGS || []).find(x => x.id === buildingId);
    if (!b) return;
    if (game.resources.money < b.price) {
      game.showToast('Fonds insuffisants', `L'acquisition de ce bâtiment nécessite ${b.price.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }
    const confirmed = await window.ProtecDialog.confirm(
      `Acheter en pleine propriété « ${b.name} » pour ${b.price.toLocaleString('fr-FR')} € ?\n\n• ${b.typologyLabel || 'Bâtiment'} de ${b.surfaceM2} m² utiles\n• ${b.roomsCount} pièces dont ${b.freeRooms ?? b.roomsCount} à affecter\n• ${b.vehicleCapacity} véhicules${b.indoorBays ? ` (dont ${b.indoorBays} en remise)` : ''}\n\nL'antenne déménage immédiatement. Le mobilier des anciens locaux n'est pas transféré.`,
      'Achat immobilier',
      { confirmText: 'Acheter', cancelText: 'Annuler' }
    );
    if (!confirmed) return;
    game.resources.money -= b.price;
    if (window.ProtecFinances) window.ProtecFinances.recordTransaction(game, -b.price, `Achat des locaux : ${b.name}`, 'locaux');
    this._moveIntoBuilding(game, b, 'owned');
    game.showToast('Déménagement réussi !', `Nouveaux locaux en pleine propriété : ${b.name} (${b.surfaceM2} m²). Affectez une vocation aux salles libres.`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.activeTab = 'modulaire';
    this.openInBaseView(true);
  },

  // Location d'un bâtiment existant (bail commercial, loyer mensuel)
  async rentBuilding(game, buildingId) {
    const b = this.getDailyRealEstateOffers(game, 'rent').find(x => x.id === buildingId);
    if (!b) return;
    if (game.resources.money < b.monthlyRent) {
      game.showToast('Fonds insuffisants', `Le premier loyer (${b.monthlyRent.toLocaleString('fr-FR')} €) doit être réglé à la signature.`, 'orange');
      return;
    }
    const confirmed = await window.ProtecDialog.confirm(
      `Signer un bail pour « ${b.name} » ?\n\n• Loyer : ${b.monthlyRent.toLocaleString('fr-FR')} € / mois (premier mois réglé maintenant)\n• ${b.typologyLabel} de ${b.surfaceM2} m² utiles\n• ${b.roomsCount} pièces dont ${b.freeRooms} à affecter\n• ${b.vehicleCapacity} véhicules${b.indoorBays ? ` (dont ${b.indoorBays} en remise)` : ''}\n\nL'antenne déménage immédiatement. Le mobilier des anciens locaux n'est pas transféré.`,
      'Location de locaux',
      { confirmText: 'Signer le bail', cancelText: 'Annuler' }
    );
    if (!confirmed) return;
    game.resources.money -= b.monthlyRent;
    if (window.ProtecFinances) window.ProtecFinances.recordTransaction(game, -b.monthlyRent, `Premier loyer : ${b.name}`, 'locaux');
    this._moveIntoBuilding(game, b, 'rented');
    game.showToast('Bail signé !', `L'antenne s'installe dans ${b.name} (${b.surfaceM2} m², ${b.monthlyRent.toLocaleString('fr-FR')} €/mois).`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.activeTab = 'modulaire';
    this.openInBaseView(true);
  },

  // Lancement d'une construction sur-mesure d'Architecte
  async startCustomConstruction(game, width, height) {
    const totalTiles = width * height;
    const baseTerrainCost = 350000;
    const costPerTile = 6500;
    const totalCost = baseTerrainCost + (totalTiles * costPerTile);

    if (game.resources.money < totalCost) {
      game.showToast('Trésorerie Insuffisante', `Ce projet d'architecte (${width}x${height} cases, ${totalTiles * 25} m²) requiert ${totalCost.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    const confirmed = await window.ProtecDialog.confirm(
      `Lancer la construction d'un complexe neuf sur-mesure en PLEINE PROPRIÉTÉ (${width}x${height} cases = ${totalTiles * 25} m²) pour ${totalCost.toLocaleString('fr-FR')} € ?\n\nVous pourrez ensuite concevoir les pièces librement avec l'éditeur 2D.`,
      'Projet de Construction Neuve',
      { confirmText: 'Lancer le Projet', cancelText: 'Annuler' }
    );
    if (!confirmed) {
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
            <!-- Silhouette Top-Down VPSP officiel -->
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

    // Assainissement préalable : régule strictement tout dépassement de stock
    if (window.ProtecSocial && typeof window.ProtecSocial.clampStorageToCapacity === 'function') {
      window.ProtecSocial.clampStorageToCapacity(game);
    }

    // CAS 2 : Le joueur a déjà des locaux
    const stats = this.calculatePremisesStats(premises);
    const rawStorageUsed = this.getCurrentStorageUsed(game);
    const storageUsed = Math.min(stats.storageCapacity, rawStorageUsed);
    const storagePercent = stats.storageCapacity > 0 ? Math.min(100, Math.round((storageUsed / stats.storageCapacity) * 100)) : 100;
    const isStorageSaturated = stats.hasStorage && storageUsed >= stats.storageCapacity;
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
          <div class="p-3 rounded-2xl ${stats.hasStorage ? (isStorageSaturated ? 'bg-red-50/80 border border-red-300 dark:bg-red-950/30 dark:border-red-800' : 'glass-card border-amber-200/80 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/40') : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60'} space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">📦 Stockage</span>
              <span class="${!stats.hasStorage || isStorageSaturated ? 'text-red-600' : 'text-amber-600'} font-black">${storageUsed} / ${stats.storageCapacity}</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div class="h-full ${isStorageSaturated ? 'bg-red-600' : (storagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500')} transition-all" style="width: ${storagePercent}%"></div>
            </div>
            <p class="text-[10px] ${!stats.hasStorage || isStorageSaturated ? 'text-red-600 font-bold' : 'text-slate-500'}">
              ${!stats.hasStorage ? `⚠️ Pas de stockage` : (isStorageSaturated ? `⛔ Réserve saturée - Collectes suspendues` : `Collectes & maraudes autorisées`)}
            </p>
          </div>

          <!-- Salle de Formation -->
          <div class="p-3 rounded-2xl ${stats.hasFormation ? 'glass-card border-blue-200/80 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-900/40' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'} space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">🎓 Formations</span>
              <span class="text-pc-blue font-black">${stats.studentCapacity} places</span>
            </div>
            <p class="text-[10px] ${stats.hasFormation ? 'text-slate-500' : 'text-slate-400'}">
              ${stats.hasFormation ? `${stats.counts.formation || 0} salle(s) • PSC/SST` : `Aucune salle`}
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
              ${stats.nightBeds} lits de repos
            </p>
          </div>

        </div>

        <!-- Barre d'onglets du module -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto no-scrollbar flex-nowrap">
          <button onclick="window.ProtecLocaux.openInBaseView(true)" class="px-3.5 py-2 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 bg-[#ff6600] hover:bg-[#e65c00] text-white shadow-sm" title="L'aménagement (mobilier, vocations) se fait directement dans la vue « Ma base »">
            <span>✏️ Aménager dans Ma base</span>
            ${ongoingWorksCount > 0 ? `<span class="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-900 font-black">${ongoingWorksCount}</span>` : ''}
          </button>
          <button onclick="window.ProtecLocaux.setTab('modulaire', window.game)" class="px-3.5 py-2 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'modulaire' ? 'bg-pc-blue text-white shadow-sm ring-2 ring-blue-400/40' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i>
            <span>Tableau de Bord Modulaire</span>
          </button>
          <button onclick="window.ProtecLocaux.setTab('securite', window.game)" class="px-3.5 py-2 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'securite' ? 'bg-pc-blue text-white shadow-sm ring-2 ring-blue-400/40' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="shield" class="w-3.5 h-3.5"></i>
            <span>Sécurité (${securityScore}%)</span>
          </button>
          <button onclick="window.ProtecLocaux.setTab('catalogue', window.game)" class="px-3.5 py-2 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'catalogue' ? 'bg-pc-blue text-white shadow-sm ring-2 ring-blue-400/40' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="building" class="w-3.5 h-3.5"></i>
            <span>Immobilier (${this.getDailyRealEstateOffers(game).length})</span>
          </button>
          <button onclick="window.ProtecLocaux.setTab('construction', window.game)" class="px-3.5 py-2 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'construction' ? 'bg-pc-blue text-white shadow-sm ring-2 ring-blue-400/40' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="hammer" class="w-3.5 h-3.5"></i>
            <span>Construction Neuve</span>
          </button>
          <button onclick="window.ProtecLocaux.setTab('stock', window.game)" class="px-3.5 py-2 rounded-xl transition flex-shrink-0 flex items-center gap-1.5 ${this.activeTab === 'stock' ? 'bg-pc-blue text-white shadow-sm ring-2 ring-blue-400/40' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="package" class="w-3.5 h-3.5"></i>
            <span>Stock Social</span>
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

  // L'aménagement se fait uniquement dans la vue « Ma base »
  openInBaseView(edit) {
    const game = window.game;
    const st = game && game.stations && game.stations[0];
    if (!st || !window.ProtecBaseLive) return;
    if (game && typeof game.closeModal === 'function') { try { game.closeModal(); } catch (e) { /* ignoré */ } }
    window.ProtecBaseLive.openBaseView(st.id, { edit: !!edit });
  },

  setTab(tabKey, game) {
    if (tabKey === 'plan') { this.openInBaseView(true); return; }
    this.activeTab = tabKey;
    this.renderModal(game);
  },

  // =========================================================================
  // ÉCRAN INITIAL : CHOIX ENTRE LES 3 DISPOSITIONS DE DÉPART
  // =========================================================================

  // Catalogue des meubles et équipements pour l'agencement "Les Sims"
  FURNITURE_CATALOG: [
    { type: 'bureau', name: 'Bureau Direction & PC', cat: 'bureau', w: 1.8, d: 0.9, color: '#334155', cost: 250, icon: '🖥️' },
    { type: 'chaise', name: 'Chaise de Réunion', cat: 'bureau', w: 0.5, d: 0.5, color: '#0284c7', cost: 45, icon: '🪑' },
    { type: 'table_formation', name: 'Table Formation Pédagogique', cat: 'formation', w: 2.2, d: 1.1, color: '#ea580c', cost: 180, icon: '📚' },
    { type: 'tableau_blanc', name: 'Tableau Blanc Mural', cat: 'formation', w: 2.2, d: 0.2, color: '#f8fafc', cost: 120, icon: '📋' },
    { type: 'mannequin_rcp', name: 'Mannequin Secourisme RCP', cat: 'formation', w: 0.6, d: 1.2, color: '#f59e0b', cost: 320, icon: '🫀' },
    { type: 'dae_mural', name: 'Défibrillateur DAE Mural', cat: 'secours', w: 0.35, d: 0.35, color: '#10b981', cost: 450, icon: '⚡' },
    { type: 'armoire_pharmacie', name: 'Armoire Pharmacie d’Urgence', cat: 'secours', w: 1.2, d: 0.4, color: '#dc2626', cost: 190, icon: '🩹', maxWeightKg: 80 },
    { type: 'etagere_lots', name: 'Étagère Métallique Lots A/B', cat: 'stockage', w: 0.6, d: 2.4, color: '#475569', cost: 150, icon: '📦', maxWeightKg: 300 },
    { type: 'casiers_vestiaire', name: 'Casiers Tenues F1 Protec', cat: 'stockage', w: 0.6, d: 2.5, color: '#0f172a', cost: 180, icon: '🦺', maxWeightKg: 150 },
    { type: 'lit_garde', name: 'Lit de Camp / Astreinte', cat: 'detente', w: 1.0, d: 2.0, color: '#a855f7', cost: 220, icon: '🛏️' },
    { type: 'canape_detente', name: 'Canapé Foyer Bénévoles', cat: 'detente', w: 2.0, d: 0.9, color: '#059669', cost: 280, icon: '🛋️' },
    { type: 'machine_cafe', name: 'Machine à Café & Pause', cat: 'detente', w: 0.8, d: 0.6, color: '#d97706', cost: 85, icon: '☕' },
    { type: 'babyfoot', name: 'Baby-foot Bonzini', cat: 'detente', w: 1.5, d: 1.0, color: '#16a34a', cost: 420, icon: '⚽', bonus: '+8% Moral et cohésion d’équipe lors des gardes' },
    { type: 'tv_foyer', name: 'Téléviseur Mural / Écran Foyer', cat: 'detente', w: 1.4, d: 0.15, color: '#0f172a', cost: 350, icon: '📺', bonus: '+6% Détente et anti-stress en veille' },
    { type: 'console_jeux', name: 'Console de Jeux & Coin Gaming', cat: 'detente', w: 1.0, d: 0.5, color: '#6366f1', cost: 480, icon: '🎮', bonus: '+10% Moral et attractivité jeunes recrues' },
    { type: 'ping_pong', name: 'Table de Ping-Pong Pliante', cat: 'detente', w: 2.7, d: 1.5, color: '#0284c7', cost: 290, icon: '🏓', bonus: '+5% Énergie et convivialité d’équipe' },
    { type: 'distributeur_snacks', name: 'Distributeur Boissons & Snacks', cat: 'detente', w: 0.9, d: 0.8, color: '#dc2626', cost: 380, icon: '🥤', bonus: '+5% Énergie et +4 Moral d’antenne' },
    { type: 'armoire_forte_securisee', name: 'Armoire Forte Sécurisée DAE/Sensible', cat: 'secours', w: 1.0, d: 0.5, color: '#334155', cost: 420, icon: '🔐', maxWeightKg: 120, pole: 'pole_secours', bonus: 'Armoire blindée avec serrure de sécurité pour DAE, radios et pharmacie' },
    { type: 'rack_palettes_lourd', name: 'Rack à Palettes Lourd (650kg)', cat: 'stockage', w: 2.6, d: 1.0, color: '#1e293b', cost: 380, icon: '🏗️', maxWeightKg: 650, pole: 'pole_crise', bonus: 'Rack industriel grande charge pour lits picots, groupes électrogènes et tentes' },
    { type: 'casiers_tenues_xl', name: 'Bloc Casiers Vestiaires Tenues XL (250kg)', cat: 'stockage', w: 1.2, d: 0.6, color: '#0f172a', cost: 260, icon: '🦺', maxWeightKg: 250, pole: 'pole_vestiaire', bonus: 'Vestiaire grande capacité pour tenues d’intervention et casques' },
    { type: 'lits_superposes', name: 'Lits Superposés d’Astreinte (2 places)', cat: 'detente', w: 1.0, d: 2.0, color: '#6d28d9', cost: 340, icon: '🛏️', bonus: '+2 couchages d’astreinte & +18% repos de garde' },
    { type: 'kitchenette_foyer', name: 'Kitchenette Foyer Équipée', cat: 'detente', w: 1.8, d: 0.7, color: '#0f766e', cost: 580, icon: '🍳', bonus: '+15% régénération équipe & +6 Moral' },
    { type: 'table_repas_equipe', name: 'Grande Table Repas & Cohésion (8p)', cat: 'detente', w: 2.4, d: 1.1, color: '#b45309', cost: 240, icon: '🍽️', bonus: '+8 Moral & Cohésion d’équipe' },
    { type: 'ecran_tactique_interactif', name: 'Écran Tactile Interactif 75"', cat: 'formation', w: 2.0, d: 0.25, color: '#0284c7', cost: 750, icon: '🖥️', bonus: '+20% qualité formation & débriefing' },
    { type: 'mannequin_pediatrique', name: 'Mannequin Pédiatrique (Nourrisson)', cat: 'formation', w: 0.8, d: 0.6, color: '#ea580c', cost: 290, icon: '👶', bonus: '+15% apprentissage gestes pédiatriques' },
    { type: 'dsa_demonstration', name: 'DAE / DSA de Démonstration Vocale', cat: 'formation', w: 0.45, d: 0.45, color: '#10b981', cost: 220, icon: '⚡', bonus: '+10% pratique PSC & gestes qui sauvent' }
  ],

  furnitureCategoryFilter: 'all',

  setFurnitureCategory(catId) {
    this.furnitureCategoryFilter = catId;
    const panel = document.getElementById('editor-subpanel');
    if (panel) {
      panel.innerHTML = this.renderEditorToolsHTML();
      if (window.lucide) window.lucide.createIcons();
    }
  },

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
            <p class="text-xs text-slate-600">Affectez une vocation aux salles libres, placez vos meubles, portes et cloisons comme dans Les Sims :</p>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Mode 2D Uniquement (Vue 3D désactivée pour le moment) -->
            <div class="flex items-center px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow text-xs font-black text-slate-300">
              <span class="text-blue-400 mr-1.5">📐</span> Plan 2D
            </div>

            <button type="button" onclick="window.ProtecLocaux.resetCamera()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center gap-1">
              <span>🎯</span> Recentrer
            </button>
            <button type="button" onclick="window.ProtecLocaux.toggleMagnet()" class="px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${this.snapToGrid ? 'bg-blue-50 text-pc-blue border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-200'}">
              <span>🧲</span> Aimant Grille
            </button>
          </div>
        </div>

        <!-- ZONE CENTRALE : PLAN 2D HAUTE DÉFINITION TACTILE -->
        <div class="relative w-full h-[360px] sm:h-[480px] rounded-3xl bg-[#0a0e17] border-2 border-slate-800 shadow-xl overflow-hidden select-none">
          <canvas id="architect-canvas" style="touch-action: none;" class="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>

          <!-- Badge En direct -->
          <div class="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow text-xs font-bold text-white pointer-events-none">
            <span class="text-blue-400">📐</span>
            <span>Plan d’Architecte 2D</span>
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
                <span>🏛️</span> Vocation des salles
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
      const activeCat = this.furnitureCategoryFilter || 'all';

      const isItemInCat = (item, cat) => {
        if (cat === 'all') return true;
        if (cat === 'bureau') return item.cat === 'bureau';
        if (cat === 'formation') return item.cat === 'formation';
        if (cat === 'stockage') return (item.cat === 'stockage' || item.cat === 'secours') && !item.type.includes('casier');
        if (cat === 'vestiaire') return item.type.includes('casier') || item.pole === 'pole_vestiaire';
        if (cat === 'detente') return item.cat === 'detente';
        return true;
      };

      const categoryDefinitions = [
        { id: 'all', label: 'Tout', icon: '🗂️' },
        { id: 'bureau', label: 'Direction & PC', icon: '💼' },
        { id: 'formation', label: 'Formation', icon: '🎓' },
        { id: 'stockage', label: 'Stockage & Secours', icon: '📦' },
        { id: 'vestiaire', label: 'Vestiaires', icon: '👕' },
        { id: 'detente', label: 'Foyer & Détente', icon: '☕' }
      ];

      const renderFurnitureCard = (item) => `
        <button type="button" onclick="window.ProtecLocaux.addFurnitureItem('${item.type}')" class="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-pc-blue text-slate-800 transition flex flex-col items-center justify-center gap-1 shadow-2xs group active:scale-95 cursor-pointer">
          <span class="text-xl group-hover:scale-110 transition">${item.icon}</span>
          <span class="text-[10px] font-bold text-center leading-tight truncate w-full" title="${item.name}">${item.name}</span>
          <div class="flex items-center justify-between w-full px-1 text-[9px]">
            <span class="text-slate-500 font-mono">${item.w}m × ${item.d}m</span>
            <span class="font-black text-emerald-700 bg-emerald-100/70 px-1 rounded">${item.cost} €</span>
          </div>
        </button>
      `;

      return `
        <div class="space-y-2.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 pb-1 border-b border-slate-100">
            <span class="text-slate-600">Sélectionnez un mobilier classé par pôle pour <strong>${selectedRoom?.name?.split('\n')[0] || 'la pièce'}</strong> :</span>
            <div class="flex items-center gap-2">
              <button type="button" onclick="window.game.openModule('marche_occasion')" class="px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-pc-orange font-bold text-[11px] border border-orange-200 transition">Bourse Occasion 🏷️</button>
              <button type="button" onclick="window.ProtecMarcheOccasion.openSellModal('equipment')" class="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-300 transition">Vendre Mobilier</button>
              <span class="text-xs font-bold text-slate-700 ml-1">Trésorerie : <strong class="text-emerald-600 font-black">${money.toLocaleString('fr-FR')} €</strong></span>
            </div>
          </div>

          <!-- Barre d'onglets de catégorie dans l'éditeur du jeu -->
          <div class="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            ${categoryDefinitions.map(cat => {
              const count = this.FURNITURE_CATALOG.filter(i => isItemInCat(i, cat.id)).length;
              const isSelected = activeCat === cat.id;
              return `
                <button 
                  type="button" 
                  onclick="window.ProtecLocaux.setFurnitureCategory('${cat.id}')"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${isSelected ? 'bg-pc-blue text-white shadow-xs font-black' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">
                  <span>${cat.icon}</span>
                  <span>${cat.label}</span>
                  <span class="text-[9.5px] opacity-75">(${count})</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Grille des meubles (soit par sections si 'all', soit filtrée) -->
          ${(() => {
            if (activeCat === 'all') {
              const sections = [
                { id: 'bureau', title: '💼 Direction & Commandement' },
                { id: 'formation', title: '🎓 Formation & Pédagogie' },
                { id: 'stockage', title: '📦 Stockage & Matériel de Secours' },
                { id: 'vestiaire', title: '👕 Vestiaires & Paquetages' },
                { id: 'detente', title: '☕ Foyer, Détente & Repos' }
              ];
              return `
                <div class="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  ${sections.map(sec => {
                    const items = this.FURNITURE_CATALOG.filter(i => isItemInCat(i, sec.id));
                    if (items.length === 0) return '';
                    return `
                      <div class="space-y-1.5">
                        <div class="text-[11px] font-black text-slate-700 uppercase tracking-wider pb-0.5 border-b border-slate-100 flex items-center justify-between">
                          <span>${sec.title}</span>
                          <span class="text-[10px] text-slate-400 font-bold">(${items.length})</span>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          ${items.map(renderFurnitureCard).join('')}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `;
            }

            const filteredItems = this.FURNITURE_CATALOG.filter(i => isItemInCat(i, activeCat));
            return `
              <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[360px] overflow-y-auto pr-1">
                ${filteredItems.map(renderFurnitureCard).join('')}
              </div>
            `;
          })()}
        </div>
      `;
    }

    if (this.editorTab === 'doors') {
      return `
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
            <span class="text-slate-600">Ajoutez des ouvertures, accès véhicules et cloisons sur les murs :</span>
            <span class="text-xs font-bold text-slate-700">Trésorerie disponible : <strong class="text-emerald-600 font-black">${money.toLocaleString('fr-FR')} €</strong></span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            <button type="button" onclick="window.ProtecLocaux.addDoorItem('W')" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center justify-between group active:scale-95">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🚪</span>
                <div>
                  <strong class="block text-xs font-black text-slate-900">+ Porte Battante (83/93cm)</strong>
                  <span class="text-[10.5px] text-slate-500">Accès intérieur / extérieur standard</span>
                </div>
              </div>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">120 €</span>
            </button>

            <button type="button" onclick="window.ProtecLocaux.addDoubleDoorItem('W')" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center justify-between group active:scale-95">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🚪🚪</span>
                <div>
                  <strong class="block text-xs font-black text-slate-900">+ Porte Double Battante (1.40m)</strong>
                  <span class="text-[10.5px] text-slate-500">Passage brancard & logistique</span>
                </div>
              </div>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">220 €</span>
            </button>

            <button type="button" onclick="window.ProtecLocaux.addGarageShutterItem('W')" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center justify-between group active:scale-95">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🏭</span>
                <div>
                  <strong class="block text-xs font-black text-slate-900">+ Rideau Métallique (3.20m)</strong>
                  <span class="text-[10.5px] text-slate-500">Accès garage motorisé VPSP / LOG</span>
                </div>
              </div>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">650 €</span>
            </button>

            <button type="button" onclick="window.ProtecLocaux.addGlassPartitionItem('N')" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center justify-between group active:scale-95">
              <div class="flex items-center gap-3">
                <span class="text-2xl">🪟</span>
                <div>
                  <strong class="block text-xs font-black text-slate-900">+ Cloison Vitrée Acoustique (2.00m)</strong>
                  <span class="text-[10.5px] text-slate-500">Séparation vitrée PC & réunion</span>
                </div>
              </div>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">290 €</span>
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

            <button type="button" onclick="window.ProtecLocaux.addBayWindowItem('N')" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center justify-between group active:scale-95">
              <div class="flex items-center gap-3">
                <span class="text-2xl">☀️</span>
                <div>
                  <strong class="block text-xs font-black text-slate-900">+ Baie Vitrée Panoramique (2.40m)</strong>
                  <span class="text-[10.5px] text-slate-500">Luminosité accueil / foyer</span>
                </div>
              </div>
              <span class="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">320 €</span>
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

            <!-- 3. Capacité Logistique & Stockage du Bâtiment (en kg) -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div class="flex items-center justify-between text-xs font-black text-slate-800">
                <span class="flex items-center gap-1">📦 Capacité Stockage</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono ${(m.furniture || []).some(f => ['etagere_lots', 'armoire_pharmacie', 'casiers_vestiaire'].includes(f.type)) ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                  ${(m.furniture || []).filter(f => ['etagere_lots', 'armoire_pharmacie', 'casiers_vestiaire'].includes(f.type)).length} RANGEMENT${(m.furniture || []).filter(f => ['etagere_lots', 'armoire_pharmacie', 'casiers_vestiaire'].includes(f.type)).length > 1 ? 'S' : ''}
                </span>
              </div>
              <div class="text-base font-black text-slate-900">${(m.furniture || []).reduce((sum, f) => sum + (f.maxWeightKg || (f.type === 'etagere_lots' ? 300 : f.type === 'armoire_pharmacie' ? 80 : f.type === 'casiers_vestiaire' ? 150 : 0)), 0)} kg utiles</div>
              <p class="text-[10px] text-slate-500">Charge max admissible pour Lots A/B, kits CHU, tenues F1 et caisses d'intervention.</p>
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
    const typeIcons = {
      libre: '⚪',
      bureau: '💼',
      formation: '🎓',
      stockage: '📦',
      detente: '☕',
      pc_radio: '📡',
      dortoir: '🛏️',
      vestiaire: '🚿',
      vestiaires: '🚿'
    };

    return (m.rooms || []).map((rm, idx) => {
      const isSelected = this.selectedRoomId === rm.id;
      const cleanType = rm.type || 'libre';
      const icon = typeIcons[cleanType] || '🏛️';

      return `
        <div onclick="window.ProtecLocaux.selectRoom('${rm.id}')" class="p-2.5 rounded-xl border transition cursor-pointer ${isSelected ? 'bg-blue-50/90 border-pc-blue ring-2 ring-pc-blue/40 shadow-xs' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}">
          <div class="flex items-center justify-between text-xs font-black mb-1.5">
            <span class="flex items-center gap-1.5 text-slate-900 truncate">
              <span class="w-5 h-5 rounded-full ${isSelected ? 'bg-pc-blue text-white' : 'bg-slate-200 text-slate-700'} flex items-center justify-center text-[10px] font-mono flex-shrink-0">${idx + 1}</span>
              <span class="truncate">${(rm.baseName || rm.name || ('Pièce ' + (idx + 1))).split('\n')[0]} (${(rm.area || rm.w * rm.h || 20).toFixed(1)} m²)</span>
            </span>
            ${isSelected ? '<span class="text-[9.5px] text-pc-blue font-black bg-blue-100/80 px-1.5 py-0.2 rounded flex-shrink-0">Active ★</span>' : ''}
          </div>
          ${['couloir', 'wc', 'douche', 'garage'].includes(cleanType) ? `<div class="w-full px-2 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-500">🔒 ${{ couloir: 'Circulation (non aménageable)', wc: 'Sanitaires (plomberie existante)', douche: 'Salle d’eau / douches (plomberie existante)', garage: 'Remise à véhicules (portes sectionnelles)' }[cleanType]}</div>` : `
          <select onclick="event.stopPropagation()" onchange="window.ProtecLocaux.assignRoomRole('${rm.id}', this.value)" class="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-pc-blue cursor-pointer">
            <option value="libre" ${cleanType === 'libre' ? 'selected' : ''}>⚪ Salle Libre (Non affectée)</option>
            <option value="bureau" ${cleanType === 'bureau' ? 'selected' : ''}>💼 Accueil & Direction</option>
            <option value="formation" ${cleanType === 'formation' ? 'selected' : ''}>🎓 Salle de Formation (PSC / SST)</option>
            <option value="stockage" ${cleanType === 'stockage' ? 'selected' : ''}>📦 Stockage & Logistique (Lots A/B)</option>
            <option value="detente" ${cleanType === 'detente' ? 'selected' : ''}>☕ Foyer & Détente (Bénévoles)</option>
            <option value="pc_radio" ${cleanType === 'pc_radio' ? 'selected' : ''}>📡 PC Radio & Opérations</option>
            <option value="dortoir" ${cleanType === 'dortoir' ? 'selected' : ''}>🛏️ Dortoir d'Astreinte (SAMU/SDIS)</option>
            <option value="vestiaire" ${cleanType === 'vestiaire' || cleanType === 'vestiaires' ? 'selected' : ''}>🚿 Vestiaires & Sanitaires</option>
          </select>`}
        </div>
      `;
    }).join('');
  },

  selectRoom(roomId) {
    this.selectedRoomId = roomId;
    this.renderArchitectScene();

    const model = this.getArchitectModel();
    const rm = (model.rooms || []).find(r => r.id === roomId);

    // 1. Mettre à jour la liste des pièces
    const container = document.getElementById('starter-rooms-list');
    if (container) {
      container.innerHTML = this.renderRoomsListHTML(model);
    }

    // 2. Mettre à jour l'en-tête de la pièce sélectionnée à droite de la barre d'onglets
    const headerLabel = document.getElementById('selected-room-header-name');
    if (headerLabel && rm) {
      headerLabel.textContent = rm.name.split('\n')[0];
    }

    // 3. Mettre à jour la barre contextuelle sous le canvas
    const contextBar = document.getElementById('canvas-context-bar');
    if (contextBar && !this.selectedFurnitureId) {
      if (rm) {
        const areaLabel = rm.area ? ` (${rm.area.toFixed(1)} m²)` : '';
        contextBar.innerHTML = `
          <span class="flex items-center gap-1.5 font-bold text-blue-300">
            <span>🏛️</span>
            <span>Salle active : <strong>${rm.name.split('\n')[0]}</strong>${areaLabel}</span>
          </span>
        `;
      }
    }
  },

  assignRoomRole(roomId, newRole) {
    const model = this.getArchitectModel();
    const room = (model.rooms || []).find(r => r.id === roomId);
    if (!room) return;
    if (['couloir', 'wc', 'douche', 'garage'].includes(room.type)) return;

    room.type = newRole;
    const roomIdx = (model.rooms || []).findIndex(r => r.id === roomId) + 1;
    const titles = {
      libre: `Salle ${roomIdx || 1} (Libre)\n(Non affectée)`,
      bureau: 'Accueil & Direction\n(Poste de Commandement)',
      formation: 'Salle de Formation\n(Pédagogie & PSC/SST)',
      stockage: 'Stockage & Logistique\n(Réserve Matériel & Lots)',
      detente: 'Foyer & Détente\n(Espace Convivial Bénévoles)',
      pc_radio: 'PC Radio & Opérations\n(Poste de Commandement)',
      dortoir: 'Dortoir d\'Astreinte\n(Garde SAMU 15 / SDIS)',
      vestiaire: 'Vestiaires Opérationnels\n(Casiers & Sanitaires)',
      vestiaires: 'Vestiaires Opérationnels\n(Casiers & Sanitaires)'
    };
    const colors = {
      libre: '#131824',
      bureau: '#161d2b',
      formation: '#141a26',
      stockage: '#181b2a',
      detente: '#14241e',
      pc_radio: '#281328',
      dortoir: '#22182c',
      vestiaire: '#131e28',
      vestiaires: '#131e28'
    };

    room.name = titles[newRole] || `Salle ${roomIdx || 1} (Libre)\n(Non affectée)`;
    if (newRole === 'libre' && room.baseName) room.name = `${room.baseName} (libre)\n${room.area || Math.round(room.w * room.h * 10) / 10} m² · à affecter`;
    room.color = colors[newRole] || '#131824';

    this.selectRoom(roomId);
    this.saveCurrentArchitecture(window.game);
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

  addDoubleDoorItem(wall = 'W') {
    const cost = 220;
    const game = window.game;
    if (game && game.resources) {
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour poser une porte double battante. Solde : ${game.resources.money.toLocaleString('fr-FR')} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Porte Double Installée (-220 €)', 'Porte double 1.40m installée pour brancards.', 'blue');
    }

    const model = this.getArchitectModel();
    const newDoor = {
      id: `d_double_${Date.now()}`,
      type: 'double_door',
      x: wall === 'W' ? 6.2 : (wall === 'E' ? 15.6 : 10.8),
      y: 3.5,
      len: 1.40,
      wall: wall,
      label: 'Porte Double Battante (1.40m)',
      isMain: false
    };
    model.doors.push(newDoor);
    this.renderArchitectScene();
    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
  },

  addGarageShutterItem(wall = 'W') {
    const cost = 650;
    const game = window.game;
    if (game && game.resources) {
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour poser un rideau métallique. Solde : ${game.resources.money.toLocaleString('fr-FR')} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Rideau Métallique Installé (-650 €)', 'Accès garage motorisé 3.20m posé pour les véhicules d’intervention.', 'blue');
    }

    const model = this.getArchitectModel();
    const newDoor = {
      id: `d_shutter_${Date.now()}`,
      type: 'garage_shutter',
      x: wall === 'W' ? 6.2 : (wall === 'E' ? 15.6 : 8.0),
      y: wall === 'N' || wall === 'S' ? (wall === 'N' ? 1.5 : 9.5) : 5.0,
      len: 3.20,
      wall: wall,
      label: 'Rideau Métallique Garage (3.20m)',
      isMain: true
    };
    model.doors.push(newDoor);
    this.renderArchitectScene();
    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
  },

  addGlassPartitionItem(wall = 'N') {
    const cost = 290;
    const game = window.game;
    if (game && game.resources) {
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour poser une cloison vitrée acoustique. Solde : ${game.resources.money.toLocaleString('fr-FR')} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Cloison Vitrée Posée (-290 €)', 'Cloison vitrée acoustique 2.00m installée.', 'cyan');
    }

    const model = this.getArchitectModel();
    const newDoor = {
      id: `d_glass_${Date.now()}`,
      type: 'glass_partition',
      x: 8.5,
      y: 5.5,
      len: 2.00,
      wall: wall,
      label: 'Cloison Vitrée Acoustique (2.00m)',
      isMain: false
    };
    model.doors.push(newDoor);
    this.renderArchitectScene();
    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
  },

  addBayWindowItem(wall = 'N') {
    const cost = 320;
    const game = window.game;
    if (game && game.resources) {
      if (game.resources.money < cost) {
        game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour poser une baie vitrée panoramique. Solde : ${game.resources.money.toLocaleString('fr-FR')} €.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      game.updateStatsUI();
      game.saveGame();
      game.showToast('Baie Vitrée Installée (-320 €)', 'Grande baie vitrée 2.40m installée.', 'cyan');
    }

    const model = this.getArchitectModel();
    const newWindow = {
      id: `w_${Date.now()}`,
      x: wall === 'N' ? 9.0 : 15.6,
      y: wall === 'N' ? 1.5 : 4.0,
      len: 2.40,
      wall: wall,
      label: 'Grande Baie Vitrée (2.40m)'
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
      icon: catalogItem.icon,
      pole: catalogItem.pole || 'pole_libre',
      rotation: 0,
      storedInventory: {},
      maxWeightKg: catalogItem.maxWeightKg || 0
    };

    model.furniture.push(newItem);
    this.selectedFurnitureId = newItem.id;
    this.saveCurrentArchitecture(game);
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

  // Détection du support pour adapter le message contextuel d'aide (Tactile vs Souris)
  getContextBarDefaultHTML() {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    if (isTouch) {
      return `
        <div class="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 text-[10px] sm:text-[11px] font-medium text-center">
          <span>👆</span>
          <span><strong>1 doigt :</strong> déplacer • <strong>2 doigts :</strong> zoomer • Touchez un véhicule ou une pièce</span>
        </div>
      `;
    } else {
      return `
        <div class="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-[10px] sm:text-[11px] font-medium text-center">
          <span>🖱️</span>
          <span><strong>Clic gauche + glisser :</strong> déplacer la vue • <strong>Molette :</strong> zoomer • <strong>Survol :</strong> infos véhicule • <strong>Clic :</strong> aménager</span>
        </div>
      `;
    }
  },

  updateContextBar(item) {
    const contextBar = document.getElementById('canvas-context-bar');
    if (!contextBar) return;

    if (item) {
      const itype = item.type;
      const isStorage = ['etagere_lots', 'armoire_pharmacie', 'casiers_vestiaire', 'armoire_forte_securisee', 'rack_palettes_lourd', 'casiers_tenues_xl'].includes(itype);
      const isComfort = ['canape_detente', 'lit_garde', 'lits_superposes', 'kitchenette_foyer', 'table_repas_equipe'].includes(itype);
      const isFun = ['babyfoot', 'tv_foyer', 'console_jeux', 'ping_pong', 'distributeur_snacks'].includes(itype);
      const isFunctional = ['mannequin_rcp', 'mannequin_pediatrique', 'dsa_demonstration', 'ecran_tactique_interactif', 'tableau_blanc', 'table_formation', 'bureau', 'dae_mural'].includes(itype);

      let actionBtnHTML = '';
      if (isStorage) {
        actionBtnHTML = `
          <button type="button" onclick="window.ProtecLocaux.openStorageInventory('${item.id}')" class="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer active:scale-95">
            <span>📦</span> <span>Gérer le Stock</span>
          </button>
        `;
      } else if (isComfort) {
        actionBtnHTML = `
          <button type="button" onclick="window.ProtecLocaux.openComfortModal('${item.id}')" class="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer active:scale-95">
            <span>🛋️</span> <span>Espace Confort</span>
          </button>
        `;
      } else if (isFun) {
        actionBtnHTML = `
          <button type="button" onclick="window.ProtecLocaux.openEntertainmentModal('${item.id}')" class="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer active:scale-95">
            <span>🎮</span> <span>Divertissement</span>
          </button>
        `;
      } else {
        actionBtnHTML = `
          <button type="button" onclick="window.ProtecLocaux.openFunctionalModal('${item.id}')" class="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer active:scale-95">
            <span>📋</span> <span>Fonctionnalité</span>
          </button>
        `;
      }

      contextBar.innerHTML = `
        <div class="flex items-center gap-2 flex-wrap justify-center text-xs">
          <span class="flex items-center gap-1 font-bold text-amber-300">
            <span>${item.icon || '🛋️'}</span>
            <span class="truncate max-w-[130px] sm:max-w-none"><strong>${item.name || item.label || 'Mobilier'}</strong></span>
          </span>
          ${actionBtnHTML}
          <div class="h-3.5 w-[1px] bg-slate-700 hidden sm:block"></div>
          <button type="button" onclick="window.ProtecLocaux.rotateSelectedItem()" class="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer active:scale-95">
            <span>🔄</span> <span>Pivoter (90°)</span>
          </button>
          <button type="button" onclick="window.ProtecLocaux.deleteSelectedItem()" class="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow cursor-pointer active:scale-95">
            <span>🗑️</span> <span>Revendre (50%)</span>
          </button>
          <button type="button" onclick="window.ProtecLocaux.selectedFurnitureId = null; window.ProtecLocaux.updateContextBar(null); window.ProtecLocaux.renderArchitectScene();" class="px-2 py-1 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-[11px] transition cursor-pointer">
            <span>✕</span>
          </button>
        </div>
      `;
    } else {
      contextBar.innerHTML = this.getContextBarDefaultHTML();
    }
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
    this.updateContextBar(item);
    this.saveCurrentArchitecture(window.game);
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
    this.updateContextBar(null);
    this.saveCurrentArchitecture(game);
    this.renderArchitectScene();

    const subpanel = document.getElementById('editor-subpanel');
    if (subpanel) subpanel.innerHTML = this.renderEditorToolsHTML();
  },

  // Rendu selon l'onglet actif
  renderActiveTabContent(game, station, premises, stats) {
    if (this.activeTab === 'plan' || !this.activeTab) this.activeTab = 'modulaire';
    if (this.activeTab === 'modulaire') {
      return this.renderModulaireTab(game, station, premises, stats);
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
    const model = this.getArchitectModel(premises.stationId);
    this.selectedRoomId = this.selectedRoomId || 'room_1';
    const selectedRoom = (model.rooms || []).find(r => r.id === this.selectedRoomId) || (model.rooms && model.rooms[0]);

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
            <button onclick="window.ProtecLocaux.toggleEditMode(window.game)" class="px-4 py-2 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer ${this.isEditing ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400' : 'bg-pc-blue hover:bg-blue-600 text-white'}">
              <i data-lucide="${this.isEditing ? 'check-circle' : 'layout-grid'}" class="w-4 h-4"></i>
              <span>${this.isEditing ? 'Valider l’Aménagement' : 'Mode Aménagement & Mobilier'}</span>
            </button>

            <!-- Indicateur de surface totale et hauteur sous plafond -->
            <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              <span>🏛️ Locaux Bâtiment : <strong class="text-pc-blue">84.6 m²</strong></span>
              <span>•</span>
              <span>🚒 Cour & Hangar : <strong class="text-amber-600">43.2 m²</strong></span>
              <span>•</span>
              <span>👥 Capacité : <strong class="text-emerald-600">24 secouristes</strong></span>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="flex items-center gap-2 text-xs font-bold">
            <button onclick="window.ProtecLocaux.resetCamera()" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer">
              <span>🎯</span> Recentrer la Vue
            </button>
            <button onclick="window.ProtecLocaux.showTechnicalSpecsModal(window.game)" class="px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer">
              <span>📋</span> Agencement des Salles
            </button>
          </div>
        </div>

        <!-- Avertissement pédagogique si Locataire -->
        ${!isOwner ? `
          <div class="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-slate-800 text-xs flex items-start justify-between gap-3">
            <div class="flex items-start gap-2.5">
              <i data-lucide="info" class="w-4 h-4 text-pc-blue flex-shrink-0 mt-0.5"></i>
              <div class="space-y-0.5">
                <strong class="font-black text-slate-900 block">Convention Municipale d'Occupation (Bailleur Public)</strong>
                <p class="text-[11px] text-slate-600 leading-relaxed">
                  Vous pouvez agencer librement l'intérieur de la caserne, installer du mobilier et réaffecter les salles de secours. Seule la démolition de cloisons porteuses nécessite le rachat des murs.
                </p>
              </div>
            </div>
            <button onclick="window.ProtecLocaux.buyoutPremisesWalls(window.game)" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-sm transition flex-shrink-0 cursor-pointer">
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
        <!-- ZONE VISUALISEUR D'ARCHITECTE 2D / 3D TEMPS RÉEL (ADAPTÉ SMARTPHONE & PC)  -->
        <!-- ========================================================================= -->
        <div class="relative w-full h-[360px] sm:h-[480px] md:h-[580px] rounded-3xl bg-[#f5f0e8] border-2 border-amber-200/80 shadow-2xl overflow-hidden select-none">
          
          <!-- CANVAS PRINCIPAL HAUTE DÉFINITION TACTILE -->
          <canvas id="architect-canvas" style="touch-action: none;" class="w-full h-full block cursor-grab active:cursor-grabbing"></canvas>

          <!-- 1. En-tête gauche : Badge Plan d'Architecte 2D -->
          <div class="absolute top-2.5 sm:top-3.5 left-2.5 sm:left-3.5 z-20 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/90 backdrop-blur border border-amber-200 shadow-md text-[11px] sm:text-xs font-bold text-slate-700 pointer-events-none">
            <span>🏠</span>
            <span>🏢 Caserne Opérationnelle</span>
          </div>

          <!-- 2. En-tête droite : Boutons + et { } -->
          <div class="absolute top-2.5 sm:top-3.5 right-2.5 sm:right-3.5 z-20 flex items-center gap-1.5">
            <button onclick="window.ProtecLocaux.showAddElementModal(window.game)" class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white/90 hover:bg-amber-50 text-slate-700 border border-amber-200 flex items-center justify-center font-black text-lg shadow-md transition active:scale-95 cursor-pointer" title="Ajouter un équipement ou mobilier">
              +
            </button>
            <button onclick="window.ProtecLocaux.showTechnicalSpecsModal(window.game)" class="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-white/90 hover:bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer" title="Agencement des pièces et surfaces">
              📋
            </button>
          </div>

          <!-- 3. Barre d'outils latérale droite (Flottante sombre) -->
          <div class="absolute top-1/2 -translate-y-1/2 right-2.5 sm:right-3.5 z-20 flex flex-col items-center gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl">
            <!-- Crayon / Éditer -->
            <button onclick="window.ProtecLocaux.toggleEditMode(window.game)" class="w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${this.isEditing ? 'bg-amber-500 text-white shadow-md animate-pulse' : 'text-slate-400 hover:text-slate-700 hover:bg-amber-50'}" title="${isOwner ? 'Réaménager cloisons' : 'Aménagement interdit en location'}">
              ✏️
            </button>
            <!-- Bascule Scène vivante isométrique / Plan 2D -->
            <button onclick="window.ProtecBaseLive && window.ProtecBaseLive.toggleLiveMode()" class="w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${(window.ProtecBaseLive && window.ProtecBaseLive.liveMode && !this.isEditing) ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-red-50'}" title="Scène vivante (vue isométrique animée) / Plan 2D">
              🎬
            </button>
            <!-- Aimant Snap / Magnétisme -->
            <button onclick="window.ProtecLocaux.toggleMagnet()" class="w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${this.snapToGrid ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300' : 'text-slate-400 hover:text-slate-700 hover:bg-blue-50'}" title="Alignement automatique des meubles">
              🧲
            </button>
            <div class="w-5 h-[1px] bg-slate-700/80 my-0.5"></div>
            <!-- Zoom + -->
            <button onclick="window.ProtecLocaux.zoomCamera(1.2)" class="w-8 h-8 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center font-black text-base transition cursor-pointer" title="Zoom avant">
              +
            </button>
            <!-- Zoom - -->
            <button onclick="window.ProtecLocaux.zoomCamera(0.8)" class="w-8 h-8 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center font-black text-base transition cursor-pointer" title="Zoom arrière">
              −
            </button>
            <!-- Centrer caméra -->
            <button onclick="window.ProtecLocaux.resetCamera()" class="w-8 h-8 rounded-xl text-orange-400 hover:text-orange-500 hover:bg-orange-50 flex items-center justify-center transition cursor-pointer" title="Recentrer la vue">
              🎯
            </button>
          </div>

          <!-- 4. Barre contextuelle inférieure interactive adaptée au support (Mobile / Tactile vs Ordinateur / Souris) -->
          <div id="canvas-context-bar" class="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur border border-slate-200/90 shadow-lg max-w-[94%] transition-all">
            ${this.getContextBarDefaultHTML()}
          </div>

        </div>

        <!-- BARRE D'OUTILS D'AMÉNAGEMENT & MOBILIER "LES SIMS" -->
        <div class="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div class="flex items-center justify-between border-b border-slate-200 pb-2.5 flex-wrap gap-2">
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('furniture')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${this.editorTab === 'furniture' || !this.editorTab ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>🛋️</span> Mobilier & Matériel
              </button>
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('doors')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${this.editorTab === 'doors' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>🚪</span> Portes & Ouvertures
              </button>
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('rooms')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${this.editorTab === 'rooms' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>🏛️</span> Vocation des Salles
              </button>
              ${isOwner ? `
                <button type="button" onclick="window.ProtecLocaux.setEditorTab('expand')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${this.editorTab === 'expand' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                  <span>➕</span> Agrandir (Extension)
                </button>
              ` : ''}
              <button type="button" onclick="window.ProtecLocaux.setEditorTab('metrics')" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${this.editorTab === 'metrics' ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>📊</span> Métriques & Bonus
              </button>
            </div>

            <div class="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-semibold">
              <span>Pièce sélectionnée : <strong id="selected-room-header-name" class="text-slate-800">${selectedRoom?.name?.split('\n')[0] || 'Salle 1'}</strong></span>
            </div>
          </div>

          <!-- Contenu interactif de l'onglet actif -->
          <div id="editor-subpanel">
            ${this.renderEditorToolsHTML(model)}
          </div>
        </div>

        <!-- Récapitulatif des Espaces Aménagés de la Caserne -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div class="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1">
            <div class="flex items-center justify-between font-black text-slate-200">
              <span>🚗 Parking Opérationnel</span>
              <span class="text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-mono">43.2 m²</span>
            </div>
            <p class="text-[10px] text-slate-400 leading-tight">4.8m × 9.0m • 2 places de VPSP 01 / VTU 01 et accès cour.</p>
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
            <p class="text-[10px] text-slate-400 leading-tight">4.8m × 4.2m • Formations secouristes PSC, SST et recyclages PSE.</p>
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
    if (window.ProtecBaseLive && window.ProtecBaseLive.isActive()) { window.ProtecBaseLive.zoom(factor); return; }
    this.camera2D.zoom = Math.max(8, Math.min(100, this.camera2D.zoom * factor));
    this.renderArchitectScene();
  },

  // Emprise du plan (pièces + cour) pour centrer et cadrer la vue 2D
  getModelViewBox(model) {
    model = model || this.getArchitectModel();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    (model && model.rooms || []).forEach(r => {
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h);
      bx0 = Math.min(bx0, r.x); by0 = Math.min(by0, r.y); bx1 = Math.max(bx1, r.x + r.w); by1 = Math.max(by1, r.y + r.h);
    });
    const pk = model && model.parking;
    if (pk) { x0 = Math.min(x0, pk.x); y0 = Math.min(y0, pk.y); x1 = Math.max(x1, pk.x + pk.w); y1 = Math.max(y1, pk.y + pk.h); }
    if (!isFinite(x0)) { x0 = 0.8; y0 = 1.2; x1 = 15.8; y1 = 10.8; }
    if (!isFinite(bx0)) { bx0 = x0; by0 = y0; bx1 = x1; by1 = y1; }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, building: { x0: bx0, y0: by0, x1: bx1, y1: by1 } };
  },

  fitView(width, height) {
    const canvas = document.getElementById('architect-canvas');
    const w = width || (canvas ? canvas.width : 800);
    const h = height || (canvas ? canvas.height : 500);

    // Le complexe complet (parking + bâtiment) va de x: 0.8 à 15.8 (largeur ~15m) et y: 1.2 à 10.8 (hauteur ~9.6m).
    // On calibre le zoom pour afficher l'ensemble avec un dégagement suffisant
    const vb = this.getModelViewBox();
    const scaleX = (w * 0.86) / (vb.w + 1.4);
    const scaleY = ((h - 70) * 0.86) / (vb.h + 1.4);
    const optimalScale = Math.max(8, Math.min(38, Math.min(scaleX, scaleY)));

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
    if (window.ProtecBaseLive && window.ProtecBaseLive.isActive()) { window.ProtecBaseLive.resetCamera(); return; }
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
      const vb = this._viewBox || this.getModelViewBox();
      const ox = cx - vb.cx * scale;
      const oy = cy - vb.cy * scale;
      return {
        wx: (screenX - ox) / scale,
        wy: (screenY - oy) / scale,
        screenX,
        screenY
      };
    };

    canvas.addEventListener('dblclick', (e) => {
      const { wx, wy } = getMouseWorldPos(e.clientX, e.clientY);
      const model = this.getArchitectModel();
      const clickedFurniture = (model.furniture || []).slice().reverse().find(f => {
        return wx >= f.x && wx <= f.x + f.w && wy >= f.y && wy <= f.y + f.d;
      });
      if (clickedFurniture) {
        this.openFurnitureInteractionModal(clickedFurniture.id);
      }
    });

    const onPointerDown = (clientX, clientY, button) => {
      const { wx, wy } = getMouseWorldPos(clientX, clientY);
      const model = this.getArchitectModel();

      if (button === 0) {
        // 0. Détection de clic sur un véhicule garé dans la cour / hangar opérationnel
        if (model.parking && model.parking.spots) {
          const game = window.game;
          const st = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
          const stVehs = (game && game.vehicles && st) ? game.vehicles.filter(v => (st.vehicles || []).includes(v.id) || v.stationId === st.id) : [];

          const clickedSpotIdx = model.parking.spots.findIndex(spot => {
            return wx >= spot.x && wx <= spot.x + spot.w && wy >= spot.y && wy <= spot.y + spot.d;
          });

          if (clickedSpotIdx >= 0 && stVehs[clickedSpotIdx]) {
            const clickedVeh = stVehs[clickedSpotIdx];
            if (window.game && typeof window.game.openVehicleDetailsModal === 'function') {
              window.game.openVehicleDetailsModal(clickedVeh.id);
              return;
            }
          }
        }

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
          this.updateContextBar(clickedFurniture);
          this.renderArchitectScene();
          return;
        }

        // 2. Détection de clic sur une pièce
        const clickedRoom = (model.rooms || []).find(r => {
          return wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h;
        });

        if (clickedRoom) {
          this.selectedFurnitureId = null;
          this.updateContextBar(null);
          this.selectRoom(clickedRoom.id);
          this.renderArchitectScene();
          return;
        }
      }

      // 3. Clic dans le vide -> déplacement de la caméra (Pan)
      this.selectedFurnitureId = null;
      this.updateContextBar(null);
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

      // Détection dynamique du survol d'un véhicule, meuble ou pièce
      const model = this.getArchitectModel();

      // 1. Détection survol véhicule sur une place de parking
      let hoveredVeh = null;
      let hoveredSpot = null;
      if (model.parking && model.parking.spots) {
        const game = window.game;
        const st = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
        const stVehs = (game && game.vehicles && st) ? game.vehicles.filter(v => (st.vehicles || []).includes(v.id) || v.stationId === st.id) : [];

        model.parking.spots.forEach((spot, idx) => {
          if (wx >= spot.x && wx <= spot.x + spot.w && wy >= spot.y && wy <= spot.y + spot.d) {
            if (stVehs[idx]) {
              hoveredVeh = stVehs[idx];
              hoveredSpot = spot;
            }
          }
        });
      }

      if (this.hoveredVehicle !== hoveredVeh) {
        this.hoveredVehicle = hoveredVeh;
        this.hoveredVehicleSpot = hoveredSpot;
        this.renderArchitectScene();
      }

      // 2. Détection survol meuble
      const hoveredFurniture = (model.furniture || []).slice().reverse().find(f => {
        return wx >= f.x && wx <= f.x + f.w && wy >= f.y && wy <= f.y + f.d;
      });

      const newHoveredId = hoveredFurniture ? hoveredFurniture.id : null;
      if (this.hoveredFurnitureId !== newHoveredId) {
        this.hoveredFurnitureId = newHoveredId;
        this.renderArchitectScene();
      }

      // 3. Mise à jour du curseur
      if (hoveredFurniture) {
        canvas.style.cursor = 'move';
      } else if (hoveredVeh) {
        canvas.style.cursor = 'pointer';
      } else {
        const hoveredRoom = (model.rooms || []).find(r => {
          return wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h;
        });
        canvas.style.cursor = hoveredRoom ? 'pointer' : 'grab';
      }
    };

    const onPointerUp = () => {
      if (this.draggingFurniture && window.game) {
        this.saveCurrentArchitecture(window.game);
      }
      this.draggingFurniture = null;
      this.isDraggingCanvas = false;
    };

    // Assurer le blocage des gestes parasites du navigateur
    canvas.style.touchAction = 'none';

    // Souris
    canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY, e.button));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => onPointerUp());
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Double-clic direct sur un meuble pour ouvrir son interface de gestion (Stock, Confort...)
    canvas.addEventListener('dblclick', (e) => {
      const { wx, wy } = getMouseWorldPos(e.clientX, e.clientY);
      const model = this.getArchitectModel();
      const clickedFurniture = (model.furniture || []).slice().reverse().find(f => {
        return wx >= f.x && wx <= f.x + f.w && wy >= f.y && wy <= f.y + f.d;
      });
      if (clickedFurniture) {
        this.openFurnitureInteractionModal(clickedFurniture.id);
      }
    });

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

    // Tactile Mobile / Tablette (Touch-action native bloquée, gestion 1 doigt et 2 doigts pinch-to-zoom)
    let touchStartDist = 0;
    let touchStartCenter = null;
    let isPinchZoom = false;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isPinchZoom = false;
        e.preventDefault();
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY, 0);
      } else if (e.touches.length === 2) {
        isPinchZoom = true;
        e.preventDefault();
        this.draggingFurniture = null;
        this.isDraggingCanvas = false;
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && !isPinchZoom) {
        e.preventDefault();
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const curDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const curCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };

        if (touchStartDist > 0) {
          const factor = curDist / touchStartDist;
          const safeFactor = Math.max(0.88, Math.min(1.12, factor));
          this.zoomCamera(safeFactor);

          if (touchStartCenter) {
            const dx = curCenter.x - touchStartCenter.x;
            const dy = curCenter.y - touchStartCenter.y;
            this.camera2D.panX += dx;
            this.camera2D.panY += dy;
          }
          this.renderArchitectScene();
        }

        touchStartDist = curDist;
        touchStartCenter = curCenter;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        isPinchZoom = false;
        touchStartDist = 0;
        touchStartCenter = null;
        onPointerUp();
      } else if (e.touches.length === 1) {
        isPinchZoom = false;
        touchStartDist = 0;
        touchStartCenter = null;
      }
    }, { passive: false });

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
    if (st) {
      if (!st.premises) {
        st.premises = { tenure: 'rented', level: 1, monthlyRent: 350, securityEquipments: [] };
      }
      if (!st.premises.architecture) {
        st.premises.architecture = JSON.parse(JSON.stringify(this.getDefaultModel()));
      }
      const arch = st.premises.architecture;
      // Les vocations et types de pièces configurés par le joueur sont strictement préservés
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

    // Scène vivante isométrique (hors mode Aménagement) : le moteur ProtecBaseLive prend la main sur le canvas
    if (window.ProtecBaseLive) {
      if (window.ProtecBaseLive.shouldRun(this, canvas)) {
        window.ProtecBaseLive.attach(canvas, this);
        return;
      }
      if (window.ProtecBaseLive.isActive()) window.ProtecBaseLive.detach();
    }
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
  // GESTION FONCTIONNELLE DU MOBILIER (STOCKAGE, FOYER, DIVERTISSEMENT)
  // =========================================================================

  // Pôles logistiques pour affectation des zones de stock / étagères / armoires
  STORAGE_POLES: {
    pole_libre: { id: 'pole_libre', label: 'Général / Libre (Sans restriction)', icon: '⚪', color: '#64748b', desc: 'Accepte tout matériel sans filtrage' },
    pole_formation: { id: 'pole_formation', label: 'Pôle Formation', icon: '🎓', color: '#2563eb', desc: 'Mannequins RCP, DAE formation, tapis, pédagogie' },
    pole_secours: { id: 'pole_secours', label: 'Pôle Secours / DPS', icon: '🩹', color: '#ea580c', desc: 'Lots A/B/C, caisses réarmement VPSP, réassort pharmacie' },
    pole_crise: { id: 'pole_crise', label: 'Pôle Crise & Soutien aux Populations', icon: '🚨', color: '#dc2626', desc: 'Lots pompage, tronçonnage, bâchage, kits CHU hébergement, CAI' },
    pole_vestiaire: { id: 'pole_vestiaire', label: 'Pôle Habillement & Vestiaires', icon: '👕', color: '#7c3aed', desc: 'Tenues F1, rangers, paquetages et équipements individuels' }
  },

  getItemPole(itemId) {
    const id = (itemId || '').toLowerCase();
    if (id.includes('mannequin') || id.includes('formation') || id.includes('dsa') || id.includes('tapis') || id.includes('pedagogique') || id.includes('schiller')) {
      return 'pole_formation';
    }
    if (id.includes('tenue') || id.includes('rangers') || id.includes('casque') || id.includes('gilet') || id.includes('f1')) {
      return 'pole_vestiaire';
    }
    if (id.includes('tronconnage') || id.includes('pompage') || id.includes('bachage') || id.includes('eclairage') || id.includes('hebergement') || id.includes('ravitaillement') || id.includes('psy') || id.includes('drone') || id.includes('poste_commandement')) {
      return 'pole_crise';
    }
    if (id.includes('secours') || id.includes('rearmement') || id.includes('reassort') || id.includes('dae') || id.includes('brancard') || id.includes('pansement') || id.includes('caisse')) {
      return 'pole_secours';
    }
    return 'pole_libre';
  },

  setStoragePole(furnitureId, poleId) {
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item) return;

    item.pole = poleId || 'pole_libre';
    const game = window.game;
    this.saveCurrentArchitecture(game);
    if (game && game.saveGame) game.saveGame();
    this.renderArchitectScene();
    this.openStorageInventory(furnitureId);

    const poleInfo = this.STORAGE_POLES[item.pole] || this.STORAGE_POLES.pole_libre;
    if (game && game.showToast) {
      game.showToast('Pôle Assigné', `« ${item.label || item.name} » est désormais assigné au ${poleInfo.label}.`, 'blue');
    }
  },

  getItemWeightKg(itemId) {
    const WEIGHTS = {
      lot_secours_a: 45,
      lot_secours_b: 15,
      lot_secours_c: 25,
      lot_tronconnage: 30,
      lot_pompage: 40,
      lot_eclairage: 35,
      lot_bachage: 25,
      lot_hebergement: 60,
      lot_ravitaillement: 35,
      lot_soutien_psy: 20,
      lot_poste_commandement_mobile: 15,
      lot_drone_reco: 10,
      lot_drone_thermique: 12,
      caisse_rearmement: 10,
      caisse_reassort: 8,
      tenue_pc: 3,
      tenue_f1: 3,
      tenue_moto: 4,
      tenue_usar: 5,
      rangers1: 2,
      rangers2: 2,
      rangers3: 2,
      mannequin_rcp_adulte: 12,
      dsa_formation: 4,
      telephone_garde: 0.5,
      remorque_groupe_electro: 120,
      remorque_motopompe: 100
    };
    return WEIGHTS[itemId] !== undefined ? WEIGHTS[itemId] : 5;
  },

  getItemDisplayName(itemId) {
    if (window.ProtecEquipements && window.ProtecEquipements.LOTS_CATALOG) {
      const found = window.ProtecEquipements.LOTS_CATALOG.find(x => x.id === itemId);
      if (found) return found.name;
    }
    const NAMES = {
      lot_secours_a: 'Lot A - Poste de secours',
      lot_secours_b: 'Lot B - Secours à personne',
      lot_secours_c: 'Lot C - Brancardage & relevage',
      lot_tronconnage: 'Lot Tronçonnage',
      lot_pompage: 'Lot Pompage',
      lot_eclairage: 'Lot Éclairage d’urgence',
      lot_bachage: 'Lot Bâchage',
      lot_hebergement: 'Kit CHU (30 Lits Picots)',
      lot_ravitaillement: 'Lot Ravitaillement',
      lot_soutien_psy: 'Lot CAI (Soutien psychologique)',
      lot_poste_commandement_mobile: 'Poste de commandement mobile',
      lot_drone_reco: 'Pack Drone de reconnaissance',
      lot_drone_thermique: 'Pack Drone thermique',
      caisse_rearmement: 'Caisse de Réarmement VPSP',
      caisse_reassort: 'Caisse de Réassort PS',
      tenue_pc: 'Tenue d’intervention Protection Civile',
      tenue_f1: 'Tenue de caserne F1 Protec',
      tenue_moto: 'Tenue de pilote moto MPS',
      tenue_usar: 'Tenue technique Sauvetage-Déblaiement',
      rangers1: 'Rangers d’intervention Standard',
      mannequin_rcp_adulte: 'Mannequin Secourisme RCP Adulte',
      dsa_formation: 'Défibrillateur DSA de formation'
    };
    return NAMES[itemId] || itemId;
  },

  getItemIcon(itemId) {
    const ICONS = {
      lot_secours_a: '⛺',
      lot_secours_b: '💼',
      lot_secours_c: '🩹',
      lot_tronconnage: '🪓',
      lot_pompage: '🌊',
      lot_eclairage: '💡',
      lot_bachage: '🏠',
      lot_hebergement: '🛏️',
      lot_ravitaillement: '🍲',
      lot_soutien_psy: '🤝',
      lot_poste_commandement_mobile: '📡',
      lot_drone_reco: '📷',
      lot_drone_thermique: '👁️',
      caisse_rearmement: '📦',
      caisse_reassort: '🩹',
      tenue_pc: '👕',
      tenue_f1: '👖',
      tenue_moto: '🏍️',
      tenue_usar: '🦺',
      mannequin_rcp_adulte: '🫀',
      dsa_formation: '⚡'
    };
    return ICONS[itemId] || '📦';
  },

  getStorageMaxWeight(type) {
    if (type === 'rack_palettes_lourd') return 650;
    if (type === 'etagere_lots') return 300;
    if (type === 'casiers_tenues_xl') return 250;
    if (type === 'casiers_vestiaire') return 150;
    if (type === 'armoire_forte_securisee') return 120;
    if (type === 'armoire_pharmacie') return 80;
    return 100;
  },

  openFurnitureInteractionModal(furnitureId) {
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item) return;

    const itype = item.type;
    if (['etagere_lots', 'armoire_pharmacie', 'casiers_vestiaire', 'armoire_forte_securisee', 'rack_palettes_lourd', 'casiers_tenues_xl'].includes(itype)) {
      this.openStorageInventory(furnitureId);
    } else if (['canape_detente', 'lit_garde', 'lits_superposes', 'kitchenette_foyer', 'table_repas_equipe'].includes(itype)) {
      this.openComfortModal(furnitureId);
    } else if (['babyfoot', 'tv_foyer', 'console_jeux', 'ping_pong', 'distributeur_snacks'].includes(itype)) {
      this.openEntertainmentModal(furnitureId);
    } else {
      this.openFunctionalModal(furnitureId);
    }
  },

  // 1. INVENTAIRE DÉDIÉ ET GESTION DU POIDS EN 2 COLONNES (ÉTAGÈRES & ARMOIRES)
  openStorageInventory(furnitureId) {
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item) return;

    item.storedInventory = item.storedInventory || {};
    item.pole = item.pole || 'pole_libre';
    const maxWeight = item.maxWeightKg || this.getStorageMaxWeight(item.type);

    let currentWeight = 0;
    for (const [id, count] of Object.entries(item.storedInventory)) {
      if (count > 0) currentWeight += count * this.getItemWeightKg(id);
    }

    const percent = Math.min(100, Math.round((currentWeight / maxWeight) * 100));
    const game = window.game;
    const station = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
    const stationStock = (station && station.stock) ? station.stock : {};

    // Liste du matériel actuellement stocké dans ce meuble
    const storedList = Object.entries(item.storedInventory).filter(([_, c]) => c > 0);

    // Liste du matériel disponible dans l'antenne
    const availableItems = Object.entries(stationStock).filter(([_, c]) => c > 0);

    // Filtrage et tri selon le pôle pour guider le joueur
    const currentPole = item.pole || 'pole_libre';
    const poleInfo = this.STORAGE_POLES[currentPole] || this.STORAGE_POLES.pole_libre;

    const oldModal = document.getElementById('furniture-storage-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'furniture-storage-modal';
    modal.className = 'fixed inset-0 z-[200] bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 modal-fade-in';
    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-4xl bg-slate-900 border-2 border-amber-500/60 shadow-2xl text-white p-5 sm:p-6 space-y-4 max-h-[94vh] overflow-y-auto custom-scrollbar">
        
        <!-- En-tête : Nom, Type et Sélecteur de Pôle Interactif -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
          <div class="flex items-center gap-3">
            <span class="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-2xl flex items-center justify-center shadow-inner flex-shrink-0">
              ${item.icon || '📦'}
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="text-base sm:text-lg font-black text-white leading-tight">${item.label || item.name || 'Rayonnage de Stockage'}</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black border" style="background-color: ${poleInfo.color}20; color: ${poleInfo.color}; border-color: ${poleInfo.color}40">
                  ${poleInfo.icon} ${poleInfo.label}
                </span>
              </div>
              <p class="text-xs text-slate-400">Capacité de charge : ${maxWeight} kg • Affectez ce stockage pour le rangement automatique</p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            <!-- Sélecteur de Pôle / Tâche -->
            <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/90 border border-slate-700 text-xs">
              <span class="text-[11px] font-bold text-slate-400 pl-1">🎯 Pôle :</span>
              <select onchange="window.ProtecLocaux.setStoragePole('${item.id}', this.value)" class="text-xs font-black py-1 px-2 rounded-lg bg-slate-800 border border-slate-600 text-amber-300 focus:ring-2 focus:ring-amber-400 cursor-pointer">
                <option value="pole_libre" ${currentPole === 'pole_libre' ? 'selected' : ''}>⚪ Général / Libre (Tout Matériel)</option>
                <option value="pole_formation" ${currentPole === 'pole_formation' ? 'selected' : ''}>🎓 Pôle Formation (Pédagogie, DAE...)</option>
                <option value="pole_secours" ${currentPole === 'pole_secours' ? 'selected' : ''}>🩹 Pôle Secours / DPS (Lots A/B/C...)</option>
                <option value="pole_crise" ${currentPole === 'pole_crise' ? 'selected' : ''}>🚨 Pôle Crise & Soutien Pops (Pompage...)</option>
                <option value="pole_vestiaire" ${currentPole === 'pole_vestiaire' ? 'selected' : ''}>👕 Pôle Habillement & Vestiaires (F1...)</option>
              </select>
            </div>

            <button type="button" onclick="document.getElementById('furniture-storage-modal').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold flex items-center justify-center transition cursor-pointer">✕</button>
          </div>
        </div>

        <!-- Jauge Visuelle de Charge Utile (kg) -->
        <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-slate-300 flex items-center gap-1.5">
              <span>⚖️</span> Charge Utile Actuelle :
            </span>
            <span class="${percent >= 95 ? 'text-rose-400' : (percent >= 75 ? 'text-amber-400' : 'text-emerald-400')} font-mono font-black text-sm">
              ${currentWeight} kg / ${maxWeight} kg (${percent}%)
            </span>
          </div>
          <div class="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700/60">
            <div class="h-full rounded-full transition-all duration-300 ${percent >= 95 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : (percent >= 75 ? 'bg-amber-400' : 'bg-emerald-500')}" style="width: ${percent}%"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Reste disponible : <strong class="text-white font-mono">${Math.max(0, maxWeight - currentWeight)} kg</strong></span>
            <span>Rangement automatique prioritaire actif sur ce meuble</span>
          </div>
        </div>

        <!-- TABLEAU CLAIR EN 2 COLONNES : STOCK ANTENNE (GAUCHE) / CONTENU DU MEUBLE (DROITE) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- COLONNE GAUCHE : RÉSERVE GÉNÉRALE DE L'ANTENNE -->
          <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 flex flex-col">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                <span>🏢</span>
                <span>Réserve de l'Antenne (${availableItems.length})</span>
              </div>
              ${currentPole !== 'pole_libre' ? `
                <button type="button" onclick="window.ProtecLocaux.depositAllMatchingPole('${furnitureId}')" class="px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[10px] font-bold transition cursor-pointer" title="Ranger tout le matériel correspondant au pôle d'un coup">
                  📥 Tout Ranger (${poleInfo.icon})
                </button>
              ` : ''}
            </div>

            <div class="space-y-1.5 flex-1 max-h-[38vh] overflow-y-auto custom-scrollbar pr-1">
              ${availableItems.length === 0 ? `
                <div class="p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-500 italic">
                  Aucun matériel non rangé en stock dans l'antenne. Commandez des lots ou des caisses dans l'onglet Équipements !
                </div>
              ` : availableItems.map(([sId, count]) => {
                const uW = this.getItemWeightKg(sId);
                const dName = this.getItemDisplayName(sId);
                const dIcon = this.getItemIcon(sId);
                const itemP = this.getItemPole(sId);
                const isMatchingPole = currentPole === 'pole_libre' || itemP === currentPole;
                const canFit1 = (currentWeight + uW) <= maxWeight;
                const canFit5 = (currentWeight + uW * Math.min(5, count)) <= maxWeight && count >= 5;
                const maxPossible = Math.min(count, Math.floor((maxWeight - currentWeight) / uW));

                return `
                  <div class="p-2.5 rounded-xl ${isMatchingPole ? 'bg-slate-800/80 border-slate-700 ring-1 ring-emerald-500/30' : 'bg-slate-900/70 border-slate-800/80 opacity-80'} border flex items-center justify-between gap-2 text-xs hover:border-slate-600 transition">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-xl flex-shrink-0">${dIcon}</span>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5">
                          <strong class="text-white font-bold truncate block">${dName}</strong>
                          ${isMatchingPole && currentPole !== 'pole_libre' ? '<span class="text-[9px] font-black text-emerald-400 bg-emerald-950/80 px-1 rounded">Pôle ✓</span>' : ''}
                        </div>
                        <span class="text-[10px] text-slate-400 font-mono">Dispo : <strong>${count}</strong> · ${uW} kg/u</span>
                      </div>
                    </div>

                    <div class="flex items-center gap-1 flex-shrink-0">
                      <button type="button" ${canFit1 ? '' : 'disabled'} onclick="window.ProtecLocaux.depositToStorage('${furnitureId}', '${sId}', 1)" class="px-2 py-1 rounded-lg ${canFit1 ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'} font-black text-[10px] transition" title="Ranger 1 exemplaire">
                        +1
                      </button>
                      ${count >= 5 ? `
                        <button type="button" ${canFit5 ? '' : 'disabled'} onclick="window.ProtecLocaux.depositToStorage('${furnitureId}', '${sId}', 5)" class="px-2 py-1 rounded-lg ${canFit5 ? 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'} font-black text-[10px] transition" title="Ranger 5 exemplaires">
                          +5
                        </button>
                      ` : ''}
                      <button type="button" ${maxPossible > 0 ? '' : 'disabled'} onclick="window.ProtecLocaux.depositToStorage('${furnitureId}', '${sId}', ${maxPossible})" class="px-2 py-1 rounded-lg ${maxPossible > 0 ? 'bg-emerald-800 hover:bg-emerald-700 text-emerald-100 cursor-pointer active:scale-95 border border-emerald-600/50' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'} font-black text-[10px] transition" title="Ranger le maximum possible (${maxPossible})">
                        Tout (${maxPossible})
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- COLONNE DROITE : CONTENU ACTUEL DE CE RANGEMENT -->
          <div class="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 flex flex-col">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-wider">
                <span>📦</span>
                <span>Contenu du Meuble (${storedList.length})</span>
              </div>
              ${storedList.length > 0 ? `
                <button type="button" onclick="window.ProtecLocaux.emptyStorage('${furnitureId}')" class="px-2 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[10px] font-bold transition cursor-pointer" title="Vider tout le meuble vers la réserve de l'antenne">
                  📤 Tout Vider
                </button>
              ` : ''}
            </div>

            <div class="space-y-1.5 flex-1 max-h-[38vh] overflow-y-auto custom-scrollbar pr-1">
              ${storedList.length === 0 ? `
                <div class="p-8 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
                  <span class="text-3xl block">📭</span>
                  <div class="text-xs font-bold text-slate-300">Ce rangement est actuellement vide</div>
                  <p class="text-[11px] text-slate-500">Utilisez la colonne de gauche pour y ranger vos lots, caisses ou tenues.</p>
                </div>
              ` : storedList.map(([sId, count]) => {
                const uW = this.getItemWeightKg(sId);
                const totalW = uW * count;
                const dName = this.getItemDisplayName(sId);
                const dIcon = this.getItemIcon(sId);

                return `
                  <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-2 text-xs hover:border-slate-600 transition">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-xl flex-shrink-0">${dIcon}</span>
                      <div class="min-w-0 flex-1">
                        <strong class="text-white font-bold truncate block">${dName}</strong>
                        <span class="text-[10px] text-amber-400/90 font-mono">Stocké : <strong>${count}</strong> · ${totalW} kg total</span>
                      </div>
                    </div>

                    <div class="flex items-center gap-1 flex-shrink-0">
                      <button type="button" onclick="window.ProtecLocaux.withdrawFromStorage('${furnitureId}', '${sId}', 1)" class="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-black transition cursor-pointer" title="Retirer 1 exemplaire vers la réserve">
                        -1
                      </button>
                      ${count >= 5 ? `
                        <button type="button" onclick="window.ProtecLocaux.withdrawFromStorage('${furnitureId}', '${sId}', 5)" class="px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-black transition cursor-pointer" title="Retirer 5 exemplaires">
                          -5
                        </button>
                      ` : ''}
                      <button type="button" onclick="window.ProtecLocaux.withdrawFromStorage('${furnitureId}', '${sId}', ${count})" class="px-2 py-1 rounded-lg bg-rose-900/50 hover:bg-rose-900 text-rose-200 text-[10px] font-black border border-rose-700/50 transition cursor-pointer" title="Tout retirer vers la réserve">
                        Tout (${count})
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Pied de page avec aide contextuelle -->
        <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
          <span>💡 <strong>Astuce</strong> : Les sessions de formation replacent automatiquement le matériel dans les rangements du Pôle Formation.</span>
          <button type="button" onclick="document.getElementById('furniture-storage-modal').remove()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer">
            Fermer
          </button>
        </div>

      </div>
    `;
    document.body.appendChild(modal);
  },

  depositToStorage(furnitureId, itemId, qty = 1) {
    if (qty <= 0) return;
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item) return;

    const game = window.game;
    const station = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
    if (!station) return;

    station.stock = station.stock || {};
    const avail = station.stock[itemId] || 0;
    const actualQty = Math.min(avail, qty);
    if (actualQty <= 0) {
      if (game.showToast) game.showToast('Stock Insuffisant', 'Quantité insuffisante en réserve.', 'orange');
      return;
    }

    item.storedInventory = item.storedInventory || {};
    const maxWeight = item.maxWeightKg || this.getStorageMaxWeight(item.type);

    let currentWeight = 0;
    for (const [id, count] of Object.entries(item.storedInventory)) {
      if (count > 0) currentWeight += count * this.getItemWeightKg(id);
    }

    const itemW = this.getItemWeightKg(itemId);
    const maxCanFit = Math.floor((maxWeight - currentWeight) / itemW);
    const toDeposit = Math.min(actualQty, maxCanFit);

    if (toDeposit <= 0) {
      if (game.showToast) game.showToast('Charge Maximale Atteinte', `Cette étagère ne peut supporter que ${maxWeight} kg.`, 'orange');
      return;
    }

    station.stock[itemId] -= toDeposit;
    if (station.stock[itemId] <= 0) delete station.stock[itemId];

    item.storedInventory[itemId] = (item.storedInventory[itemId] || 0) + toDeposit;

    this.saveCurrentArchitecture(game);
    if (game.saveGame) game.saveGame();
    this.renderArchitectScene();
    this.openStorageInventory(furnitureId);
    if (game.showToast) game.showToast('Matériel Rangé', `+${toDeposit}x ${this.getItemDisplayName(itemId)} rangé(s) dans le meuble.`, 'green');
  },

  withdrawFromStorage(furnitureId, itemId, qty = 1) {
    if (qty <= 0) return;
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item || !item.storedInventory) return;

    const game = window.game;
    const station = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
    if (!station) return;

    station.stock = station.stock || {};
    const current = item.storedInventory[itemId] || 0;
    const toWithdraw = Math.min(current, qty);
    if (toWithdraw <= 0) return;

    item.storedInventory[itemId] -= toWithdraw;
    if (item.storedInventory[itemId] <= 0) delete item.storedInventory[itemId];

    station.stock[itemId] = (station.stock[itemId] || 0) + toWithdraw;

    this.saveCurrentArchitecture(game);
    if (game.saveGame) game.saveGame();
    this.renderArchitectScene();
    this.openStorageInventory(furnitureId);
    if (game.showToast) game.showToast('Matériel Déchargé', `${toWithdraw}x ${this.getItemDisplayName(itemId)} remis en réserve libre.`, 'blue');
  },

  depositAllMatchingPole(furnitureId) {
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item) return;

    const game = window.game;
    const station = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
    if (!station || !station.stock) return;

    const targetPole = item.pole || 'pole_libre';
    let totalMoved = 0;

    for (const [sId, count] of Object.entries(station.stock)) {
      if (count <= 0) continue;
      const itemP = this.getItemPole(sId);
      if (targetPole === 'pole_libre' || itemP === targetPole) {
        const itemW = this.getItemWeightKg(sId);
        const maxWeight = item.maxWeightKg || this.getStorageMaxWeight(item.type);
        let curW = 0;
        for (const [id, c] of Object.entries(item.storedInventory || {})) {
          if (c > 0) curW += c * this.getItemWeightKg(id);
        }
        const maxCanFit = Math.floor((maxWeight - curW) / itemW);
        const toTake = Math.min(count, maxCanFit);
        if (toTake > 0) {
          station.stock[sId] -= toTake;
          if (station.stock[sId] <= 0) delete station.stock[sId];
          item.storedInventory = item.storedInventory || {};
          item.storedInventory[sId] = (item.storedInventory[sId] || 0) + toTake;
          totalMoved += toTake;
        }
      }
    }

    this.saveCurrentArchitecture(game);
    if (game.saveGame) game.saveGame();
    this.renderArchitectScene();
    this.openStorageInventory(furnitureId);
    if (game.showToast) {
      if (totalMoved > 0) game.showToast('Rangement Effectué', `${totalMoved} article(s) rangé(s) selon le pôle.`, 'green');
      else game.showToast('Rangement Impossible', 'Aucun matériel correspondant ou capacité max atteinte.', 'orange');
    }
  },

  emptyStorage(furnitureId) {
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item || !item.storedInventory) return;

    const game = window.game;
    const station = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
    if (!station) return;

    station.stock = station.stock || {};
    let totalMoved = 0;

    for (const [sId, count] of Object.entries(item.storedInventory)) {
      if (count > 0) {
        station.stock[sId] = (station.stock[sId] || 0) + count;
        totalMoved += count;
      }
    }
    item.storedInventory = {};

    this.saveCurrentArchitecture(game);
    if (game.saveGame) game.saveGame();
    this.renderArchitectScene();
    this.openStorageInventory(furnitureId);
    if (game.showToast) game.showToast('Rangement Vidé', `${totalMoved} article(s) remis en réserve de l'antenne.`, 'blue');
  },

  // Rangement automatique intelligent selon les pôles et priorités
  // 1. Meuble d'origine si spécifié
  // 2. Meuble affecté au même pôle ayant de la place (kg)
  // 3. Meuble sans affectation (libre) ayant de la place
  // 4. Si tous pleins : laisser dans le véhicule (ou à l'endroit)
  autoStoreItem(itemId, qty = 1, options = {}) {
    const game = window.game;
    const station = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
    if (!station) return { stored: false, remaining: qty };

    const model = this.getArchitectModel(station.id);
    const furnitureList = (model.furniture || []).filter(f => ['etagere_lots', 'armoire_pharmacie', 'casiers_vestiaire', 'armoire_forte_securisee', 'rack_palettes_lourd', 'casiers_tenues_xl'].includes(f.type));
    if (furnitureList.length === 0) {
      station.stock = station.stock || {};
      station.stock[itemId] = (station.stock[itemId] || 0) + qty;
      return { stored: false, remaining: qty };
    }

    const itemPole = this.getItemPole(itemId);
    const itemWeight = this.getItemWeightKg(itemId);

    const getFreeWeight = (f) => {
      const maxW = f.maxWeightKg || this.getStorageMaxWeight(f.type);
      let curW = 0;
      for (const [id, count] of Object.entries(f.storedInventory || {})) {
        if (count > 0) curW += count * this.getItemWeightKg(id);
      }
      return Math.max(0, maxW - curW);
    };

    let remaining = qty;
    const targetFurnitures = [];

    // Priorité 1 : Meuble d'origine
    if (options.preferredFurnitureId) {
      const orig = furnitureList.find(f => f.id === options.preferredFurnitureId);
      if (orig) targetFurnitures.push(orig);
    }

    // Priorité 2 : Meubles affectés au même pôle
    furnitureList.forEach(f => {
      if (f.pole === itemPole && !targetFurnitures.includes(f)) {
        targetFurnitures.push(f);
      }
    });

    // Priorité 3 : Meubles libres / sans affectation
    furnitureList.forEach(f => {
      if ((!f.pole || f.pole === 'pole_libre') && !targetFurnitures.includes(f)) {
        targetFurnitures.push(f);
      }
    });

    let storedTotal = 0;
    for (const furn of targetFurnitures) {
      if (remaining <= 0) break;
      const freeW = getFreeWeight(furn);
      const canFit = Math.min(remaining, Math.floor(freeW / itemWeight));
      if (canFit > 0) {
        furn.storedInventory = furn.storedInventory || {};
        furn.storedInventory[itemId] = (furn.storedInventory[itemId] || 0) + canFit;
        remaining -= canFit;
        storedTotal += canFit;
      }
    }

    if (storedTotal > 0) {
      this.saveCurrentArchitecture(game);
      if (game.saveGame) game.saveGame();
      this.renderArchitectScene();
    }

    // S'il n'y a plus de place dans les stockages :
    if (remaining > 0) {
      if (options.vehicle && Array.isArray(options.vehicle.loadedItems)) {
        // Laisser dans le véhicule comme demandé !
        options.vehicle.loadedItems.push({
          id: itemId,
          name: this.getItemDisplayName(itemId),
          qty: remaining
        });
        if (game.showToast) {
          game.showToast('Stockage Plein', `${remaining}x ${this.getItemDisplayName(itemId)} reste(nt) à bord de ${options.vehicle.name} faute de place dans les étagères.`, 'amber');
        }
      } else {
        station.stock = station.stock || {};
        station.stock[itemId] = (station.stock[itemId] || 0) + remaining;
        if (game.showToast) {
          game.showToast('Stockages Caserne Pleins', `Stockages pleins : ${remaining}x ${this.getItemDisplayName(itemId)} déposé(s) au sol en réserve.`, 'amber');
        }
      }
    }

    return { stored: storedTotal > 0, storedQty: storedTotal, remaining: remaining };
  },

    // 2. MODAL CONFORT & ESPACE REPOS (CANAPÉ, FOYER, LIT DE GARDE)
  openComfortModal(furnitureId) {
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item) return;

    const game = window.game;
    const station = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
    const stationVols = (game && game.volunteers) ? game.volunteers.filter(v => (v.status === 'dispo' || v.status === 'sdis_caserne' || v.status === 'astreinte')) : [];

    const oldModal = document.getElementById('furniture-comfort-modal');
    if (oldModal) oldModal.remove();

    const isBed = item.type === 'lit_garde' || item.type === 'lits_superposes';
    const isKitchen = item.type === 'kitchenette_foyer';
    const isTable = item.type === 'table_repas_equipe';
    const modal = document.createElement('div');
    modal.id = 'furniture-comfort-modal';
    modal.className = 'fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 modal-fade-in';
    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-xl bg-slate-900 border-2 border-emerald-500/60 shadow-2xl text-white p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <!-- En-tête -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-xl flex items-center justify-center">
              ${item.icon || '🛋️'}
            </span>
            <div>
              <h3 class="text-base sm:text-lg font-black text-white">${item.label || item.name || 'Foyer & Repos'}</h3>
              <p class="text-xs text-slate-400">${isBed ? 'Dortoir d’astreinte nocturne et gardes 24h' : 'Zone d’attente et de repos des bénévoles en faction'}</p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('furniture-comfort-modal').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold flex items-center justify-center transition cursor-pointer">✕</button>
        </div>

        <!-- Statistiques d'apport passif -->
        <div class="grid grid-cols-2 gap-2.5">
          <div class="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
            <span class="text-2xl">⚡</span>
            <div>
              <span class="text-[10px] font-bold text-slate-400 block uppercase">Régénération Énergie</span>
              <strong class="text-sm font-black text-emerald-400">${isBed ? '+15%' : '+10%'} / veille</strong>
            </div>
          </div>
          <div class="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-2.5">
            <span class="text-2xl">😊</span>
            <div>
              <span class="text-[10px] font-bold text-slate-400 block uppercase">Sérénité & Moral</span>
              <strong class="text-sm font-black text-amber-400">+5 pts d’antenne</strong>
            </div>
          </div>
        </div>

        <!-- Bénévoles présents au local -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-emerald-400 tracking-wider">
              Bénévoles en attente de garde (${stationVols.length}) :
            </span>
            <span class="text-[11px] text-slate-400">Présents au foyer</span>
          </div>

          ${stationVols.length === 0 ? `
            <div class="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400 italic">
              Tous vos secouristes sont actuellement en intervention ou en formation.
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">
              ${stationVols.map(v => `
                <div class="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between gap-2 text-xs">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-lg flex-shrink-0">${v.avatar || '🧑‍🚒'}</span>
                    <div class="min-w-0 flex-1">
                      <strong class="block text-white font-bold truncate">${v.name}</strong>
                      <span class="text-[10px] text-slate-400">${v.role || v.rank || 'Secouriste'}</span>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0 font-mono text-[10px]">
                    <span class="text-emerald-400 font-bold block">⚡ ${v.energy || 100}%</span>
                    <span class="inline-block w-10 bg-slate-700 h-1 rounded-full overflow-hidden" title="Motivation"><span class="block h-full bg-pc-blue rounded-full" style="width: ${Math.min(100, Math.max(10, v.motivation || v.humeur || 85))}%"></span></span>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Action interactive : Tournée de café -->
        <div class="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <div class="text-[11px] text-slate-400">
            Pause conviviale : détend l’équipe et redonne de l'énergie aux bénévoles.
          </div>
          <button type="button" onclick="window.ProtecLocaux.serveCoffeeBreak('${station ? station.id : ''}')" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-white font-black text-xs transition shadow cursor-pointer active:scale-95 flex items-center gap-1.5 flex-shrink-0">
            <span>☕</span> <span>Servir un café</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  serveCoffeeBreak(stationId) {
    const game = window.game;
    if (!game) return;
    const station = (game.stations || []).find(s => s.id === stationId) || game.stations[0];
    if (!station) return;

    const now = Date.now();
    const lastCoffee = station._lastCoffeeTime || 0;
    const cooldownMs = 15 * 60 * 1000; // 15 min
    if (now - lastCoffee < cooldownMs) {
      const remMin = Math.ceil((cooldownMs - (now - lastCoffee)) / 60000);
      game.showToast('Cafetière en chauffe ☕', `Prochaine tournée de café disponible dans ${remMin} min.`, 'blue');
      return;
    }

    station._lastCoffeeTime = now;
    const vols = (game.volunteers || []).filter(v => v.status === 'dispo' || v.status === 'sdis_caserne' || v.status === 'astreinte');
    vols.forEach(v => {
      v.energy = Math.min(100, (v.energy || 90) + 5);
      v.humeur = Math.min(100, (v.humeur || 85) + 4);
    });

    if (game.saveGame) game.saveGame();
    if (game.updateStatsUI) game.updateStatsUI();

    game.showToast('☕ Tournée de Café Servie !', 'Moment de détente chaleureux au foyer : l’équipe en garde décompresse et reprend des forces !', 'green');

    const modal = document.getElementById('furniture-comfort-modal');
    if (modal) {
      this.openComfortModal(this.selectedFurnitureId);
    }
  },

  // 3. MODAL DIVERTISSEMENT & VIE D'ÉQUIPE (BABYFOOT, TV, CONSOLE, PING-PONG, DISTRIBUTEUR)
  openEntertainmentModal(furnitureId) {
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item) return;

    const game = window.game;
    const station = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;

    const TITLES = {
      babyfoot: { title: 'Baby-foot Bonzini Professionnel', icon: '⚽', bonus: 'Convivialité & Détente', action: 'Lancer un tournoi de baby-foot', desc: 'Renforce les liens fraternels et détend les équipages entre deux sorties d’urgence.' },
      tv_foyer: { title: 'Téléviseur Mural / Écran Foyer', icon: '📺', bonus: 'Veille & Confort', action: 'Suivre les alertes et reportages', desc: 'Idéal pour suivre l’évolution météo en direct et décompresser en soirée de garde.' },
      console_jeux: { title: 'Console de Jeux & Coin Gaming', icon: '🎮', bonus: 'Espace Jeunes & Convivialité', action: 'Organiser une session gaming', desc: 'Attire les jeunes recrues et offre un sas de décompression convivial après les missions éprouvantes.' },
      ping_pong: { title: 'Table de Ping-Pong Pliante', icon: '🏓', bonus: 'Détente & Réflexes', action: 'Jouer un match amical', desc: 'Maintient la tonicité musculaire et la vivacité de réaction des secouristes.' },
      distributeur_snacks: { title: 'Distributeur Boissons & En-cas', icon: '🥤', bonus: 'Ravitaillement H24', action: 'Prendre une collation (-2 €)', desc: 'Des rafraîchissements et encas disponibles 24h/24 pour soutenir les équipages de garde.' }
    };

    const info = TITLES[item.type] || { title: item.label, icon: item.icon || '🎮', bonus: '+5% Moral', action: 'Interagir', desc: 'Mobilier de convivialité pour la caserne.' };

    const oldModal = document.getElementById('furniture-fun-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'furniture-fun-modal';
    modal.className = 'fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 modal-fade-in';
    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-lg bg-slate-900 border-2 border-indigo-500/60 shadow-2xl text-white p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-black text-xl flex items-center justify-center">
              ${info.icon}
            </span>
            <div>
              <h3 class="text-base sm:text-lg font-black text-white">${info.title}</h3>
              <p class="text-xs text-indigo-300 font-semibold">${info.bonus}</p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('furniture-fun-modal').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold flex items-center justify-center transition cursor-pointer">✕</button>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          ${info.desc}
        </div>

        <div class="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between text-xs">
          <span class="text-indigo-200 font-bold">Cohésion d’équipe active</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px]">En service ✓</span>
        </div>

        <div class="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <button type="button" onclick="document.getElementById('furniture-fun-modal').remove()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer">
            Fermer
          </button>
          <button type="button" onclick="window.ProtecLocaux.triggerEntertainmentAction('${furnitureId}', '${item.type}')" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white font-black text-xs transition shadow cursor-pointer active:scale-95 flex items-center justify-center gap-1.5">
            <span>${info.icon}</span> <span>${info.action}</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  triggerEntertainmentAction(furnitureId, type) {
    const game = window.game;
    if (!game) return;

    const station = (game.stations || []).find(s => s.id === this.currentStationId) || game.stations[0];
    const vols = (game.volunteers || []).filter(v => v.status === 'dispo' || v.status === 'sdis_caserne' || v.status === 'astreinte');

    if (type === 'babyfoot') {
      vols.forEach(v => { v.humeur = Math.min(100, (v.humeur || 85) + 6); });
      game.showToast('🏆 Tournoi de Baby-foot !', 'Match acharné au foyer ! Rires et complicité au rendez-vous pour toute l’équipe !', 'green');
    } else if (type === 'tv_foyer') {
      vols.forEach(v => { v.humeur = Math.min(100, (v.humeur || 85) + 4); v.energy = Math.min(100, (v.energy || 90) + 3); });
      game.showToast('📺 Moment Détente Télé', 'Les bénévoles ont suivi les actualités et un reportage au chaud. Esprit apaisé !', 'blue');
    } else if (type === 'console_jeux') {
      vols.forEach(v => { v.humeur = Math.min(100, (v.humeur || 85) + 8); });
      game.showToast('🎮 Session Gaming au Foyer !', 'Partie endiablée en multijoueur ! Ambiance conviviale au top pour l’équipe !', 'green');
    } else if (type === 'ping_pong') {
      vols.forEach(v => { v.energy = Math.min(100, (v.energy || 90) + 5); });
      game.showToast('🏓 Match de Ping-Pong', 'Échanges rapides et bonne humeur pour les équipages !', 'blue');
    } else if (type === 'distributeur_snacks') {
      if (game.resources && game.resources.money >= 2) {
        game.resources.money -= 2;
        vols.forEach(v => { v.energy = Math.min(100, (v.energy || 90) + 5); });
        game.showToast('🥤 Collation Fraîche (-2 €)', 'Boisson et en-cas réconfortants pour les bénévoles.', 'green');
      } else {
        game.showToast('Caisse insuffisante', 'Pas assez de petite monnaie en caisse.', 'orange');
      }
    }

    if (game.saveGame) game.saveGame();
    if (game.updateStatsUI) game.updateStatsUI();

    const modal = document.getElementById('furniture-fun-modal');
    if (modal) modal.remove();
  },

  // 4. MODAL FONCTIONNALITÉS POUR AUTRES MEUBLES (BUREAU, MANNEQUIN, DAE, TABLEAU)
  openFunctionalModal(furnitureId) {
    const model = this.getArchitectModel();
    const item = (model.furniture || []).find(f => f.id === furnitureId);
    if (!item) return;

    const game = window.game;
    const oldModal = document.getElementById('furniture-func-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'furniture-func-modal';
    modal.className = 'fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 modal-fade-in';
    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-lg bg-slate-900 border-2 border-sky-500/60 shadow-2xl text-white p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 font-black text-xl flex items-center justify-center">
              ${item.icon || '📋'}
            </span>
            <div>
              <h3 class="text-base sm:text-lg font-black text-white">${item.label || item.name || 'Équipement'}</h3>
              <p class="text-xs text-slate-400">Équipement opérationnel & pédagogique</p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('furniture-func-modal').remove()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold flex items-center justify-center transition cursor-pointer">✕</button>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          Cet équipement améliore directement les capacités de votre caserne :
          ${item.type === 'mannequin_rcp' ? '<br>• <strong>+15% Qualité des formations</strong> PSC1 & SST<br>• Permet l’initiation aux gestes qui sauvent' : ''}
          ${item.type === 'mannequin_pediatrique' ? '<br>• <strong>+15% Apprentissage pédiatrique</strong><br>• Spécialisé massage cardiaque nourrisson & désobstruction pédiatrique' : ''}
          ${item.type === 'dsa_demonstration' ? '<br>• <strong>+10% Pratique des gestes d’urgence</strong><br>• DAE d’entraînement avec invite vocale réaliste et scénarios modulables' : ''}
          ${item.type === 'ecran_tactique_interactif' ? '<br>• <strong>+20% Qualité formation & débriefing</strong><br>• Grand écran numérique 75 pouces pour cas concrets et cartographie' : ''}
          ${item.type === 'dae_mural' ? '<br>• <strong>+5% Sécurité d’urgence</strong> du centre de secours<br>• Conforme aux normes ERP' : ''}
          ${item.type === 'tableau_blanc' ? '<br>• <strong>+10% Clarté pédagogique</strong> pour les cours' : ''}
          ${item.type === 'bureau' ? '<br>• Poste de commandement administratif et planification opérationnelle' : ''}
        </div>

        <div class="pt-2 border-t border-slate-800 flex justify-end">
          <button type="button" onclick="document.getElementById('furniture-func-modal').remove()" class="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer">
            Compris
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // =========================================================================
  // RENDU 2D STYLE MAQUETTE (FOND PARQUET, MURS BLANCS NETS, OMBRES DOUCES)
  // =========================================================================

  // Palette de sols et textures réalistes de jeu de gestion (SimCity / RimWorld / Theme Hospital)
  _getRoomStyle(type) {
    const ROOM_STYLES = {
      libre:       { floor: '#f8fafc', accent: '#cbd5e1', label: '#475569', floorType: 'neutral', name: 'Espace Libre' },
      bureau:      { floor: '#e2e8f0', accent: '#94a3b8', label: '#1e293b', floorType: 'carpet', name: 'Bureau & Direction' },
      formation:   { floor: '#e0f2fe', accent: '#7dd3fc', label: '#0369a1', floorType: 'lino', name: 'Salle de Formation' },
      stockage:    { floor: '#fef3c7', accent: '#fde68a', label: '#92400e', floorType: 'concrete', name: 'Réserve Logistique' },
      reserve:     { floor: '#fef3c7', accent: '#fde68a', label: '#92400e', floorType: 'concrete', name: 'Réserve Lots A/B' },
      garage:      { floor: '#94a3b8', accent: '#64748b', label: '#0f172a', floorType: 'epoxy', name: 'Hangar VPSP' },
      detente:     { floor: '#fed7aa', accent: '#f97316', label: '#9a3412', floorType: 'wood', name: 'Foyer des Bénévoles' },
      foyer:       { floor: '#fed7aa', accent: '#f97316', label: '#9a3412', floorType: 'wood', name: 'Foyer des Bénévoles' },
      dortoir:     { floor: '#e0e7ff', accent: '#a5b4fc', label: '#3730a3', floorType: 'carpet_cozy', name: 'Dortoir de Garde' },
      salle_garde: { floor: '#e0e7ff', accent: '#a5b4fc', label: '#3730a3', floorType: 'carpet_cozy', name: 'Salle de Garde' },
      pc_radio:    { floor: '#ccfbf1', accent: '#5eead4', label: '#115e59', floorType: 'tech', name: 'PC Radio & Régulation' },
      douche:      { floor: '#f8fafc', accent: '#cbd5e1', label: '#0f172a', floorType: 'tiles', name: 'Sanitaires & Douches' },
      wc:          { floor: '#f8fafc', accent: '#cbd5e1', label: '#0f172a', floorType: 'tiles', name: 'Sanitaires' },
      vestiaire:   { floor: '#f8fafc', accent: '#cbd5e1', label: '#0f172a', floorType: 'tiles', name: 'Vestiaires Secouristes' },
      couloir:     { floor: '#e7e5e4', accent: '#d6d3d1', label: '#57534e', floorType: 'lino', name: 'Couloir & circulation' }
    };
    return ROOM_STYLES[type] || ROOM_STYLES.libre;
  },

  // Tracé des textures et revêtements de sol immersifs façon jeu de gestion
  drawRoomFloor(ctx, rx, ry, rw, rh, room, style, isNight, scale) {
    const fType = style.floorType || 'neutral';

    // 1. Dalle de sol de base
    ctx.fillStyle = isNight ? '#1e2433' : style.floor;
    ctx.fillRect(rx, ry, rw, rh);

    if (isNight) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(rx, ry, rw, rh);
    ctx.clip();

    // 2. Textures réalistes selon l'usage de la pièce
    if (fType === 'wood') {
      // --- PARQUET CHÊNE CHALEUREUX (Foyer / Détente) ---
      const plankH = Math.max(7, scale * 0.35);
      const plankW = Math.max(26, scale * 1.3);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.28)';
      ctx.lineWidth = 1;

      for (let y = ry; y < ry + rh; y += plankH) {
        ctx.beginPath();
        ctx.moveTo(rx, y);
        ctx.lineTo(rx + rw, y);
        ctx.stroke();

        const row = Math.floor((y - ry) / plankH);
        const offset = (row % 2) * (plankW / 2);
        for (let x = rx - offset; x < rx + rw; x += plankW) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, Math.min(y + plankH, ry + rh));
          ctx.stroke();
        }
      }

      // Tapis de salon cosy au centre
      const rugW = Math.min(rw * 0.65, 80);
      const rugH = Math.min(rh * 0.55, 60);
      const rugX = rx + rw / 2 - rugW / 2;
      const rugY = ry + rh / 2 - rugH / 2;
      ctx.fillStyle = '#dc2626'; // Rouge convivial
      ctx.fillRect(rugX, rugY, rugW, rugH);
      ctx.strokeStyle = '#fef08a'; // Liseré or
      ctx.lineWidth = 2;
      ctx.strokeRect(rugX + 2, rugY + 2, rugW - 4, rugH - 4);

    } else if (fType === 'tiles') {
      // --- CARRELAGE BLANC BRILLANT / SANITAIRES & VESTIAIRES ---
      const tileSize = Math.max(10, scale * 0.45);
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)';
      ctx.lineWidth = 1;

      for (let x = rx; x < rx + rw; x += tileSize) {
        ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh); ctx.stroke();
      }
      for (let y = ry; y < ry + rh; y += tileSize) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw, y); ctx.stroke();
      }

    } else if (fType === 'epoxy') {
      // --- BÉTON D'ATELIER & HANGAR VPSP ---
      // Traces de passage des roues du véhicule
      ctx.fillStyle = 'rgba(51, 65, 85, 0.15)';
      ctx.fillRect(rx + rw * 0.2, ry, rw * 0.15, rh);
      ctx.fillRect(rx + rw * 0.65, ry, rw * 0.15, rh);

      // Zébrures jaunes et noires de sécurité au seuil d'accès
      const stripH = Math.min(10, rh * 0.15);
      const stripY = ry + rh - stripH;
      for (let x = rx; x < rx + rw; x += 12) {
        ctx.fillStyle = ((Math.floor(x / 12) % 2 === 0) ? '#facc15' : '#1e293b');
        ctx.fillRect(x, stripY, Math.min(12, rx + rw - x), stripH);
      }

    } else if (fType === 'lino') {
      // --- DALLES VINYLE SALLE DE COURS / PSC SST ---
      const tileSize = Math.max(14, scale * 0.6);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.4)';
      ctx.lineWidth = 1;
      for (let x = rx; x < rx + rw; x += tileSize) {
        ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh); ctx.stroke();
      }
      for (let y = ry; y < ry + rh; y += tileSize) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw, y); ctx.stroke();
      }

      // Tableau blanc mural au fond de la salle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx + rw * 0.25, ry + 2, rw * 0.5, 4);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + rw * 0.25, ry + 2, rw * 0.5, 4);

    } else if (fType === 'concrete') {
      // --- BÉTON CIRÉ LOGISTIQUE & PALETTES BOIS ---
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
      ctx.lineWidth = 1;
      const step = Math.max(18, scale * 0.8);
      for (let x = rx; x < rx + rw; x += step) {
        ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh); ctx.stroke();
      }
      for (let y = ry; y < ry + rh; y += step) {
        ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + rw, y); ctx.stroke();
      }

      // Silhouette d'une palette Europe en bois dans un angle
      const palW = Math.min(rw * 0.35, 32);
      const palH = Math.min(rh * 0.35, 24);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(rx + 6, ry + 6, palW, palH);
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 6, ry + 6, palW, palH);
      for (let py = ry + 10; py < ry + 6 + palH; py += 6) {
        ctx.beginPath(); ctx.moveTo(rx + 6, py); ctx.lineTo(rx + 6 + palW, py); ctx.stroke();
      }

    } else if (fType === 'carpet' || fType === 'carpet_cozy' || fType === 'tech') {
      // --- MOQUETTE BUREAU / DORTOIR / PC RADIO ---
      const step = Math.max(8, scale * 0.35);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let x = rx; x < rx + rw; x += step * 2) {
        for (let y = ry; y < ry + rh; y += step * 2) {
          ctx.fillRect(x, y, step, step);
        }
      }
    }

    ctx.restore();
  },

  _vehicleTopDownImagesCache: {},

  // Recherche et chargement asynchrone des images vue du dessus (avec déduction automatique & cache)
  getVehicleTopDownImage(veh) {
    if (!veh) return null;
    const key = veh.id || veh.variant || veh.image || veh.type;
    if (this._vehicleTopDownImagesCache[key] !== undefined) {
      return this._vehicleTopDownImagesCache[key]; // null si introuvable, ou HTMLImageElement chargé
    }

    const candidatePaths = [];
    if (veh.imageTopDown) candidatePaths.push(veh.imageTopDown);
    if (veh.topDownImage) candidatePaths.push(veh.topDownImage);
    if (veh.top_down_image) candidatePaths.push(veh.top_down_image);

    // 1. Déduction directe depuis l'image du véhicule (ex: 'images/vehicles/master3_vpsp.png' -> 'master3_vpsp')
    const rawImage = veh.image || '';
    let baseFileName = '';
    if (rawImage) {
      const parts = rawImage.split('/');
      baseFileName = parts[parts.length - 1].replace(/\.[^/.]+$/, '').toLowerCase();
    }
    const cleanName = baseFileName.replace(/^top_/, '');

    if (cleanName) {
      candidatePaths.push(`images/vehicles/top/top_${cleanName}.png`);
      candidatePaths.push(`images/vehicles/top/${cleanName}.png`);
      candidatePaths.push(`images/vehicles/top_${cleanName}.png`);
      candidatePaths.push(`images/vehicles/topdown/top_${cleanName}.png`);
      candidatePaths.push(`images/vehicles/topdown/${cleanName}.png`);
    }

    // 2. Déduction à partir de la variante ou du modèle (ex: 'master3_vpsp', 'master3_vtu_log', 'master3')
    const variant = (veh.variant || veh.variantId || '').toLowerCase().replace(/^top_/, '');
    if (variant && variant !== cleanName) {
      candidatePaths.push(`images/vehicles/top/top_${variant}.png`);
      candidatePaths.push(`images/vehicles/top/${variant}.png`);
      candidatePaths.push(`images/vehicles/top_${variant}.png`);
      candidatePaths.push(`images/vehicles/topdown/top_${variant}.png`);
      candidatePaths.push(`images/vehicles/topdown/${variant}.png`);
    }

    const model = (veh.model || veh.modelId || '').toLowerCase().replace(/^top_/, '');
    if (model && model !== cleanName && model !== variant) {
      candidatePaths.push(`images/vehicles/top/top_${model}.png`);
      candidatePaths.push(`images/vehicles/top/${model}.png`);
      candidatePaths.push(`images/vehicles/top_${model}.png`);
    }

    // 3. Déduction à partir de l'identifiant du véhicule
    if (veh.id) {
      const cleanId = String(veh.id).toLowerCase().replace(/^top_/, '');
      candidatePaths.push(`images/vehicles/top/top_${cleanId}.png`);
      candidatePaths.push(`images/vehicles/topdown/${cleanId}.png`);
    }

    // 4. Déduction à partir du type de véhicule (VPSP, VTU, VTP...)
    const typeLower = (veh.type || '').toLowerCase().replace(/^top_/, '');
    if (typeLower) {
      candidatePaths.push(`images/vehicles/top/top_${typeLower}.png`);
      candidatePaths.push(`images/vehicles/top/${typeLower}.png`);
      candidatePaths.push(`images/vehicles/top_${typeLower}.png`);
      candidatePaths.push(`images/vehicles/topdown/${typeLower}.png`);
      candidatePaths.push(`images/vehicles/${typeLower}_topdown.png`);
      candidatePaths.push(`images/vehicles/topdown_${typeLower}.png`);
      candidatePaths.push(`images/vehicles/${typeLower}.png`);

      // Fallbacks intelligents officiels Protection Civile (Master 3)
      if (typeLower === 'vpsp') {
        candidatePaths.push(`images/vehicles/top/top_master3_vpsp.png`);
        candidatePaths.push(`images/vehicles/top_master3_vpsp.png`);
      } else if (typeLower === 'vtu') {
        if (veh.capacity_log > 0 || (veh.name && veh.name.toLowerCase().includes('log'))) {
          candidatePaths.push(`images/vehicles/top/top_master3_vtu_log.png`);
          candidatePaths.push(`images/vehicles/top_master3_vtu_log.png`);
        } else {
          candidatePaths.push(`images/vehicles/top/top_master3_vtu_pop.png`);
          candidatePaths.push(`images/vehicles/top_master3_vtu_pop.png`);
        }
      } else if (typeLower === 'vtp') {
        candidatePaths.push(`images/vehicles/top/top_master3.png`);
        candidatePaths.push(`images/vehicles/top_master3.png`);
      }
    }

    // Déduplication ordonnée
    const uniquePaths = [...new Set(candidatePaths.filter(Boolean))];

    this._vehicleTopDownImagesCache[key] = null; // En cours de chargement

    const tryLoad = (idx) => {
      if (idx >= uniquePaths.length) return;
      const path = uniquePaths[idx];
      const img = new Image();
      img.onload = () => {
        this._vehicleTopDownImagesCache[key] = img;
        if (this.renderArchitectScene) this.renderArchitectScene();
      };
      img.onerror = () => {
        tryLoad(idx + 1);
      };
      img.src = path;
    };

    tryLoad(0);
    return null;
  },

  // Dessin d'un véhicule de secours avec orientation adaptée au sens de sa place de parking
  // RÈGLE : Les images sources pointent vers le HAUT.
  // - Si la place est horizontale (plus large que haute, sortie sur la gauche) : rotation de -90° (nez vers la GAUCHE).
  // - Si la place est verticale (plus haute que large) : rotation de 0° (nez vers le HAUT).
  drawTopDownVehicle(ctx, cx, cy, spotW, spotD, veh, isNight, isHovered) {
    ctx.save();
    ctx.translate(cx, cy);

    // Détermination de l'orientation de la place de parking
    const isHorizontal = spotW >= spotD;
    // Rotation : -90° si place horizontale (oriente le nez vers la GAUCHE), 0° si place verticale (nez vers le HAUT)
    const rotationAngle = isHorizontal ? -Math.PI / 2 : 0;
    ctx.rotate(rotationAngle);

    // Dimensions dans le repère local où le véhicule pointe vers le haut :
    const localW = isHorizontal ? Math.min(spotD * 0.76, 44) : Math.min(spotW * 0.76, 44);
    const localH = isHorizontal ? Math.min(spotW * 0.85, 90) : Math.min(spotD * 0.85, 90);

    const img = this.getVehicleTopDownImage(veh);
    if (img && img.complete && img.naturalWidth > 0) {
      // Ombre portée au sol
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-localW / 2 + 3, -localH / 2 + 4, localW, localH, 5);
      else ctx.rect(-localW / 2 + 3, -localH / 2 + 4, localW, localH);
      ctx.fill();

      // Dessin de l'image vue du dessus avec respect parfait du ratio d'aspect
      const drawH = localH;
      const imgScale = drawH / (img.naturalHeight || 500);
      const imgDrawW = (img.naturalWidth || 500) * imgScale;
      const imgDrawH = drawH;
      ctx.drawImage(img, -imgDrawW / 2, -imgDrawH / 2, imgDrawW, imgDrawH);
    } else {
      // Fallback vectoriel propre et réaliste orienté dans le même sens
      this.drawVectorVehicleTopDown(ctx, -localW / 2, -localH / 2, localW, localH, veh, isNight);
    }

    // Halo de surbrillance lumineux si le véhicule est survolé par le curseur
    if (isHovered) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.strokeRect(-localW / 2 - 3, -localH / 2 - 3, localW + 6, localH + 6);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  },

  // Rendu vectoriel de secours vue du dessus (pointant vers le haut local)
  drawVectorVehicleTopDown(ctx, x, y, w, h, veh, isNight) {
    // Ombre portée au sol
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x + 2, y + 3, w, h, 6);
    else ctx.rect(x + 2, y + 3, w, h);
    ctx.fill();

    // Carrosserie blanche de base
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6);
    else ctx.rect(x, y, w, h);
    ctx.fill();

    // Bandes latérales officielles Protection Civile (Orange fluo et Bleu Marine)
    ctx.fillStyle = '#f97316'; // Orange fluorescent
    ctx.fillRect(x, y + 4, 3, h - 8);
    ctx.fillRect(x + w - 3, y + 4, 3, h - 8);

    ctx.fillStyle = '#1e3a8a'; // Bleu marine
    ctx.fillRect(x + 3, y + 6, 2, h - 12);
    ctx.fillRect(x + w - 5, y + 6, 2, h - 12);

    // Pare-brise avant teinté (le haut représente l'avant / le nez)
    ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x + 4, y + 4, w - 8, Math.min(h * 0.22, 14), 3);
    else ctx.rect(x + 4, y + 4, w - 8, Math.min(h * 0.22, 14));
    ctx.fill();

    // Vitres latérales et arrière
    ctx.fillStyle = isNight ? '#1e293b' : '#334155';
    ctx.fillRect(x + 4, y + h * 0.35, 3, h * 0.3);
    ctx.fillRect(x + w - 7, y + h * 0.35, 3, h * 0.3);
    ctx.fillRect(x + 6, y + h - 5, w - 12, 3);

    // Toit : Croix de Vie officielle ou chevrons
    const cx = x + w / 2;
    const cy = y + h * 0.6;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx - 2, cy - 6, 4, 12);
    ctx.fillRect(cx - 6, cy - 2, 12, 4);

    // Rampe de gyrophares bleus sur le pavillon avant
    const lightY = y + 2;
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 8;
    ctx.fillRect(cx - 8, lightY, 5, 3);
    ctx.fillRect(cx + 3, lightY, 5, 3);
    ctx.shadowBlur = 0;

    // Rétroviseurs extérieurs
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x - 2, y + 8, 2, 4);
    ctx.fillRect(x + w, y + 8, 2, 4);

    // Bordure générale du véhicule
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  },

  // Dessin détaillé en vue du dessus d'un secouriste de la Protection Civile
  drawTopDownVolunteer(ctx, x, y, name, role = 'Secouriste') {
    ctx.save();

    // Ombre douce au sol
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(x + 1.5, y + 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Épaules et Veste d'intervention officielle (Bleu Marine & Orange Fluo)
    ctx.fillStyle = '#0f172a'; // Bleu marine
    ctx.beginPath();
    ctx.ellipse(x, y, 10, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Empiècement haute visibilité Orange Fluo sur le haut du buste
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(x, y - 1, 8.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bande rétro-réfléchissante blanche
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 9, 5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Tête / Casquette officielle Protection Civile
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.arc(x, y - 1, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Visière casquette
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 3, y - 6, 6, 2);

    // Badge nominatif au-dessus du secouriste
    ctx.font = 'bold 8.5px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(name).width + 8;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - textW / 2, y - 18, textW, 12, 4);
    else ctx.rect(x - textW / 2, y - 18, textW, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y - 12);

    ctx.restore();
  },

  render2D(ctx, width, height) {
    const model = this.getArchitectModel();
    const cx = width / 2 + this.camera2D.panX;
    const cy = height / 2 + this.camera2D.panY;
    const scale = this.camera2D.zoom;
    const dpr = window.devicePixelRatio || 1;

    // Heure du jeu pour mode nuit / jour
    const curH = window.game ? (window.game.currentHour || new Date().getHours()) : new Date().getHours();
    const isNightMode = curH < 6 || curH >= 22;

    // 1. Fond extérieur : Pelouse verdoyante et cour pavée (style jeu de gestion vivant)
    if (isNightMode) {
      ctx.fillStyle = '#0f172a';
    } else {
      // Pelouse naturelle verte et fraîche
      const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height) * 0.7);
      grad.addColorStop(0, '#22c55e');
      grad.addColorStop(1, '#15803d');
      ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, width, height);

    // Centrage du complexe sur l'emprise réelle (bâtiment + cour)
    const vb = this.getModelViewBox(model);
    this._viewBox = vb;
    const ox = cx - vb.cx * scale;
    const oy = cy - vb.cy * scale;

    // 2. Zone extérieure : Cour enrobée bitumineuse & Parking Opérationnel
    let drawIndoorSpots = null, drawVehTip = null;
    if (model.parking) {
      const pk = model.parking;
      const px = ox + pk.x * scale;
      const py = oy + pk.y * scale;
      const pw = pk.w * scale;
      const ph = pk.h * scale;

      // Ombre portée de la cour
      ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
      ctx.fillRect(px + 4, py + 5, pw, ph);

      // Sol asphalte bitumé réaliste
      ctx.fillStyle = isNightMode ? '#1e293b' : '#334155';
      ctx.fillRect(px, py, pw, ph);

      // Bordure en béton de voirie propre
      ctx.strokeStyle = isNightMode ? '#334155' : '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, pw, ph);

      // Marquage au sol du parking
      ctx.fillStyle = isNightMode ? '#94a3b8' : '#ffffff';
      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('🚒 COUR & HANGAR OPÉRATIONNEL', px + pw / 2, py + 8);

      // Récupération des véhicules affectés à la station
      const game = window.game;
      const st = (game && game.stations) ? (game.stations.find(s => s.id === this.currentStationId) || game.stations[0]) : null;
      const stVehs = (game && game.vehicles && st) ? game.vehicles.filter(v => (st.vehicles || []).includes(v.id) || v.stationId === st.id) : [];

      const drawSpot2D = (spot, idx) => {
        const sx = ox + spot.x * scale;
        const sy = oy + spot.y * scale;
        const sw = spot.w * scale;
        const sd = spot.d * scale;

        const assignedVeh = stVehs[idx];
        const isHovered = (this.hoveredVehicle && assignedVeh && this.hoveredVehicle.id === assignedVeh.id);

        // Lignes de stationnement (blanches dehors, jaunes dans la remise)
        ctx.strokeStyle = isHovered ? '#38bdf8' : (spot.indoor ? '#eab308' : 'rgba(255, 255, 255, 0.6)');
        ctx.lineWidth = isHovered ? 2.5 : 2;
        ctx.setLineDash([]);
        ctx.strokeRect(sx, sy, sw, sd);

        if (assignedVeh) {
          // Dessin du véhicule centré sur sa place, avec orientation adaptée au sens de la place
          const centerX = sx + sw / 2;
          const centerY = sy + sd / 2;
          this.drawTopDownVehicle(ctx, centerX, centerY, sw, sd, assignedVeh, isNightMode, isHovered);
        } else {
          // Emplacement vide
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.fillRect(sx, sy, sw, sd);
          ctx.fillStyle = spot.indoor ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.40)';
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(spot.label || `🅿️ EMPLACEMENT 0${idx + 1}`, sx + sw / 2, sy + sd / 2);
        }
      };
      (pk.spots || []).forEach((spot, idx) => { if (!spot.indoor) drawSpot2D(spot, idx); });
      drawIndoorSpots = () => (pk.spots || []).forEach((spot, idx) => { if (spot.indoor) drawSpot2D(spot, idx); });

      // Infobulle flottante au survol du curseur sur un véhicule garé (dessinée après les pièces)
      drawVehTip = () => {
      if (this.hoveredVehicle && this.hoveredVehicleSpot) {
        const sp = this.hoveredVehicleSpot;
        const hx = ox + (sp.x + sp.w / 2) * scale;
        const hy = oy + sp.y * scale;
        const v = this.hoveredVehicle;

        const titleText = `🚑 ${v.name || v.type}`;
        const subText = `${v.type || 'Véhicule'} • État: ${v.conditionPercent || 100}% • Consommables: ${v.consumablesPercent || 100}%`;

        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        const titleW = ctx.measureText(titleText).width;
        ctx.font = '600 9.5px "Plus Jakarta Sans", sans-serif';
        const subW = ctx.measureText(subText).width;
        const cardW = Math.max(titleW, subW) + 24;
        const cardH = 38;
        const cardX = Math.max(10, Math.min(width - cardW - 10, hx - cardW / 2));
        const cardY = Math.max(10, hy - cardH - 8);

        // Boîte d'infobulle sombre et élégante avec flèche
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 8);
        else ctx.rect(cardX, cardY, cardW, cardH);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Pointe vers la place
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        ctx.moveTo(hx - 6, cardY + cardH);
        ctx.lineTo(hx + 6, cardY + cardH);
        ctx.lineTo(hx, cardY + cardH + 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(titleText, cardX + cardW / 2, cardY + 6);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 9.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(subText, cardX + cardW / 2, cardY + 21);
      }
      };
    }

    // 3. Ombre portée globale du bâtiment (effet de relief de jeu de gestion)
    const bb = vb.building;
    const buildX = ox + (bb.x0 - 0.12) * scale;
    const buildY = oy + (bb.y0 - 0.12) * scale;
    const buildW = (bb.x1 - bb.x0 + 0.24) * scale;
    const buildH = (bb.y1 - bb.y0 + 0.24) * scale;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(buildX + 6, buildY + 8, buildW, buildH, 6);
    else ctx.rect(buildX + 6, buildY + 8, buildW, buildH);
    ctx.fill();

    // 4. Tracé des sols réalistes des pièces de la caserne
    model.rooms.forEach(r => {
      const rx = ox + r.x * scale;
      const ry = oy + r.y * scale;
      const rw = r.w * scale;
      const rh = r.h * scale;
      const isSelected = this.selectedRoomId === r.id;

      const roomStyle = this._getRoomStyle(r.type);

      // Tracé personnalisé du sol (bois, carrelage, lino, époxy atelier)
      this.drawRoomFloor(ctx, rx, ry, rw, rh, r, roomStyle, isNightMode, scale);

      // Surbrillance orange si la pièce est sélectionnée pour aménagement
      if (isSelected) {
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
        ctx.fillRect(rx, ry, rw, rh);
      }

      // Pastille conviviale avec le nom de la pièce
      if (rw > 40 && rh > 30) {
        let roomTitle = r.name.split('\n')[0];
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        if (ctx.measureText(roomTitle).width > rw - 22) {
          let base = roomTitle;
          while (base.length > 3 && ctx.measureText(base + '…').width > rw - 22) base = base.slice(0, -1);
          roomTitle = base.trimEnd() + '…';
        }
        const showDimensions = !!this.isEditing;
        const roomSubtitle = showDimensions ? `${r.area ? r.area.toFixed(1) : '?'} m²` : '';

        const labelColor = isNightMode ? '#e2e8f0' : roomStyle.label;
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const labelW = Math.min(rw - 12, Math.max(ctx.measureText(roomTitle).width + 16, 75));
        const labelH = showDimensions ? 32 : 22;
        const labelX = rx + rw / 2 - labelW / 2;
        const labelY = ry + rh / 2 - labelH / 2;

        ctx.fillStyle = isSelected
          ? 'rgba(249, 115, 22, 0.95)'
          : (isNightMode ? 'rgba(30, 41, 59, 0.90)' : 'rgba(255, 255, 255, 0.88)');
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(labelX, labelY, labelW, labelH, 6);
        else ctx.rect(labelX, labelY, labelW, labelH);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ea6b00' : 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#ffffff' : labelColor;
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        if (showDimensions) {
          ctx.fillText(roomTitle, rx + rw / 2, labelY + 10);
          ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.8)' : '#64748b';
          ctx.font = '600 8.5px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(roomSubtitle, rx + rw / 2, labelY + 23);
        } else {
          ctx.fillText(roomTitle, rx + rw / 2, labelY + 11);
        }
      }
    });

    // 4 bis. Véhicules remisés à l'intérieur (remise / garage), puis infobulle véhicule
    if (drawIndoorSpots) drawIndoorSpots();
    if (drawVehTip) drawVehTip();

    // 5. Murs porteurs épais et solides (style jeu de gestion en relief)
    model.walls.forEach(w => {
      const x1 = ox + w.x1 * scale;
      const y1 = oy + w.y1 * scale;
      const x2 = ox + w.x2 * scale;
      const y2 = oy + w.y2 * scale;
      const thBase = Math.max(7, w.th * scale);

      // Ombre du mur
      ctx.strokeStyle = isNightMode ? '#0f172a' : '#1e293b';
      ctx.lineWidth = thBase + 2;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1 + 1, y1 + 2); ctx.lineTo(x2 + 1, y2 + 2); ctx.stroke();

      // Corps du mur solide
      ctx.strokeStyle = isNightMode ? '#334155' : '#475569';
      ctx.lineWidth = thBase;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

      // Arête claire de relief supérieur
      ctx.strokeStyle = isNightMode ? '#475569' : '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });

    // 6. Portes, rideaux métalliques et cloisons vitrées
    model.doors.forEach(d => {
      const dx = ox + d.x * scale;
      const dy = oy + d.y * scale;
      const dlen = d.len * scale;

      if (d.type === 'garage_shutter') {
        // Rideau métallique de garage VPSP / LOG
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = Math.max(9, 0.22 * scale);
        ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(dx, dy);
        if (d.wall === 'W' || d.wall === 'E') ctx.lineTo(dx, dy + dlen);
        else ctx.lineTo(dx + dlen, dy);
        ctx.stroke();

        // Lames métalliques rainurées
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        const numSlats = Math.max(5, Math.floor(dlen / 5));
        for (let s = 1; s < numSlats; s++) {
          const frac = s / numSlats;
          ctx.beginPath();
          if (d.wall === 'W' || d.wall === 'E') {
            ctx.moveTo(dx - 3, dy + dlen * frac);
            ctx.lineTo(dx + 3, dy + dlen * frac);
          } else {
            ctx.moveTo(dx + dlen * frac, dy - 3);
            ctx.lineTo(dx + dlen * frac, dy + 3);
          }
          ctx.stroke();
        }
        // Repères de sécurité chevron jaune / noir
        ctx.fillStyle = '#eab308';
        ctx.fillRect(dx - 3, dy - 3, 6, 6);
        if (d.wall === 'W' || d.wall === 'E') ctx.fillRect(dx - 3, dy + dlen - 3, 6, 6);
        else ctx.fillRect(dx + dlen - 3, dy - 3, 6, 6);
      } else if (d.type === 'glass_partition') {
        // Cloison vitrée acoustique atelier / PC
        ctx.strokeStyle = isNightMode ? '#0891b2' : '#06b6d4';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(dx, dy);
        if (d.wall === 'W' || d.wall === 'E') ctx.lineTo(dx, dy + dlen);
        else ctx.lineTo(dx + dlen, dy);
        ctx.stroke();

        // Reflet verre cyan
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (d.wall === 'W' || d.wall === 'E') {
          ctx.moveTo(dx - 1, dy + 4); ctx.lineTo(dx - 1, dy + dlen - 4);
        } else {
          ctx.moveTo(dx + 4, dy - 1); ctx.lineTo(dx + dlen - 4, dy - 1);
        }
        ctx.stroke();
      } else if (d.type === 'double_door') {
        // Porte double battante (brancard / logistique)
        ctx.strokeStyle = isNightMode ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = Math.max(7, 0.16 * scale);
        ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(dx, dy);
        let endX = dx, endY = dy;
        if (d.wall === 'W') { endX = dx + dlen; ctx.lineTo(endX, dy); }
        else if (d.wall === 'E') { endX = dx - dlen; ctx.lineTo(endX, dy); }
        else if (d.wall === 'S') { endY = dy - dlen; ctx.lineTo(dx, endY); }
        else { endY = dy + dlen; ctx.lineTo(dx, endY); }
        ctx.stroke();

        const half = dlen / 2;
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        // Battant 1
        ctx.beginPath(); ctx.moveTo(dx, dy);
        if (d.wall === 'W') ctx.lineTo(dx + half * 0.7, dy - half * 0.7);
        else if (d.wall === 'E') ctx.lineTo(dx - half * 0.7, dy - half * 0.7);
        else if (d.wall === 'S') ctx.lineTo(dx - half * 0.7, dy - half * 0.7);
        else ctx.lineTo(dx + half * 0.7, dy + half * 0.7);
        ctx.stroke();

        // Battant 2
        ctx.beginPath(); ctx.moveTo(endX, endY);
        if (d.wall === 'W') ctx.lineTo(endX - half * 0.7, dy - half * 0.7);
        else if (d.wall === 'E') ctx.lineTo(endX + half * 0.7, dy - half * 0.7);
        else if (d.wall === 'S') ctx.lineTo(dx + half * 0.7, endY + half * 0.7);
        else ctx.lineTo(dx - half * 0.7, endY - half * 0.7);
        ctx.stroke();
      } else {
        // Porte battante standard
        ctx.strokeStyle = isNightMode ? '#1e293b' : '#e2e8f0';
        ctx.lineWidth = Math.max(7, 0.16 * scale);
        ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(dx, dy);
        if (d.wall === 'W') ctx.lineTo(dx + dlen, dy);
        else if (d.wall === 'E') ctx.lineTo(dx - dlen, dy);
        else if (d.wall === 'S') ctx.lineTo(dx, dy - dlen);
        else ctx.lineTo(dx, dy + dlen);
        ctx.stroke();

        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(dx, dy);
        if (d.wall === 'W') ctx.lineTo(dx + dlen * 0.7, dy - dlen * 0.7);
        else if (d.wall === 'E') ctx.lineTo(dx - dlen * 0.7, dy - dlen * 0.7);
        else if (d.wall === 'S') ctx.lineTo(dx + dlen * 0.7, dy - dlen * 0.7);
        else ctx.lineTo(dx + dlen * 0.7, dy + dlen * 0.7);
        ctx.stroke();
      }
    });

    // 7. Fenêtres lumineuses avec reflets
    model.windows.forEach(w => {
      const wx = ox + w.x * scale;
      const wy = oy + w.y * scale;
      const wlen = w.len * scale;

      // Encadrement
      ctx.strokeStyle = isNightMode ? '#1e293b' : '#cbd5e1';
      ctx.lineWidth = Math.max(5, 0.1 * scale);
      ctx.beginPath();
      if (w.wall === 'N' || w.wall === 'S') {
        ctx.moveTo(wx, wy); ctx.lineTo(wx + wlen, wy);
      } else {
        ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wlen);
      }
      ctx.stroke();

      // Vitrage bleu ciel brillant
      ctx.strokeStyle = isNightMode ? 'rgba(56, 189, 248, 0.4)' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (w.wall === 'N' || w.wall === 'S') {
        ctx.moveTo(wx, wy); ctx.lineTo(wx + wlen, wy);
      } else {
        ctx.moveTo(wx, wy); ctx.lineTo(wx, wy + wlen);
      }
      ctx.stroke();
    });

    // 8. Équipements de sécurité (extincteurs, TGBT)
    model.fixtures.forEach(f => {
      if (f.type === 'extinguisher') {
        const px = ox + f.x * scale;
        const py = oy + f.y * scale;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(px + 4, py + 4, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // 9. Présence vivante des secouristes en faction dans la caserne
    const availableVolunteers = (window.game && window.game.volunteers) ? window.game.volunteers.filter(v => v.status === 'dispo' || v.status === 'sdis_caserne') : [];
    if (availableVolunteers.length > 0) {
      model.rooms.forEach((rm, rIdx) => {
        if (rm.type === 'foyer' || (rm.name && rm.name.includes('Foyer'))) {
          const v1 = availableVolunteers[0];
          if (v1) this.drawTopDownVolunteer(ctx, ox + (rm.x + rm.w * 0.35) * scale, oy + (rm.y + rm.h * 0.45) * scale, v1.name);
          const v2 = availableVolunteers[1];
          if (v2) this.drawTopDownVolunteer(ctx, ox + (rm.x + rm.w * 0.65) * scale, oy + (rm.y + rm.h * 0.60) * scale, v2.name);
        } else if (rm.type === 'pc_radio' || (rm.name && rm.name.includes('Radio'))) {
          const vOp = availableVolunteers.find(x => ['CE', 'CD', 'Cadre'].includes(x.rank)) || availableVolunteers[0];
          if (vOp) this.drawTopDownVolunteer(ctx, ox + (rm.x + rm.w * 0.50) * scale, oy + (rm.y + rm.h * 0.50) * scale, vOp.name, 'Opérateur');
        }
      });
    }

    // 10. Badge d'ambiance temporelle & statut base en haut à droite
    const isGardeActive = !!(window.game && window.game.gardeActive);
    ctx.save();
    const statusText = isNightMode ? `🌙 Nuit (${curH}h00) • ${isGardeActive ? 'Garde SAMU 15 Active 🚑' : 'Veille Nocturne'}` : `☀️ Journée (${curH}h00) • Caserne Opérationnelle Active`;
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    const bW = ctx.measureText(statusText).width + 22;
    const bH = 26;
    const bX = width - bW - 14;
    const bY = 14;

    ctx.fillStyle = isNightMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(bX, bY, bW, bH, 8);
    else ctx.rect(bX, bY, bW, bH);
    ctx.fill();

    ctx.strokeStyle = isNightMode ? (isGardeActive ? '#38bdf8' : '#475569') : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isNightMode ? (isGardeActive ? '#38bdf8' : '#e2e8f0') : '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(statusText, bX + bW / 2, bY + bH / 2);
    ctx.restore();

    // 11. Tracé du mobilier meublé (style Les Sims)
    (model.furniture || []).forEach(item => {
      const ix = ox + item.x * scale;
      const iy = oy + item.y * scale;
      const iw = item.w * scale;
      const ih = item.d * scale;
      const isSelected = this.selectedFurnitureId === item.id;

      // Ombre portée du meuble
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.fillRect(ix + 3, iy + 3, iw, ih);

      // Corps du meuble
      ctx.fillStyle = item.color || '#8a9bb0';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(ix, iy, iw, ih, 4);
      else ctx.rect(ix, iy, iw, ih);
      ctx.fill();

      // Bordure intérieure
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Badge visuel du Pôle assigné (Formation, Secours, Crise, Vestiaires)
      if (item.pole && item.pole !== 'pole_libre') {
        const poleIcons = {
          pole_formation: '🎓',
          pole_secours: '🩹',
          pole_crise: '🚨',
          pole_vestiaire: '👕'
        };
        const pIcon = poleIcons[item.pole];
        if (pIcon && iw >= 16 && ih >= 16) {
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText(pIcon, ix + iw - 2, iy + 2);
        }
      }

      // Détails graphiques selon le type
      if (item.type === 'mannequin_rcp') {
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(ix + iw / 2, iy + ih * 0.25, Math.min(iw, ih) * 0.22, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'dae_mural') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.4, iy + ih * 0.2, iw * 0.2, ih * 0.6);
        ctx.fillRect(ix + iw * 0.2, iy + ih * 0.4, iw * 0.6, ih * 0.2);
      } else if (item.type === 'armoire_pharmacie') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.45, iy + ih * 0.25, iw * 0.1, ih * 0.5);
        ctx.fillRect(ix + iw * 0.3, iy + ih * 0.45, iw * 0.4, ih * 0.1);
      } else if (item.type === 'etagere_lots') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ix, iy + ih * 0.33); ctx.lineTo(ix + iw, iy + ih * 0.33);
        ctx.moveTo(ix, iy + ih * 0.66); ctx.lineTo(ix + iw, iy + ih * 0.66);
        ctx.stroke();

        // Affichage des caisses et lots rangés sur l'étagère
        const storedEntries = Object.entries(item.storedInventory || {}).filter(([_, c]) => c > 0);
        if (storedEntries.length > 0) {
          const colors = ['#ea580c', '#0284c7', '#16a34a', '#eab308', '#dc2626'];
          let boxIdx = 0;
          const numCols = Math.min(4, Math.max(2, Math.floor(iw / 8)));
          for (const [sId, sCount] of storedEntries) {
            for (let c = 0; c < Math.min(sCount, 3); c++) {
              const bx = ix + 2 + (boxIdx % numCols) * (iw / numCols);
              const by = iy + 2 + Math.floor(boxIdx / numCols) * 5;
              if (by + 4 < iy + ih) {
                ctx.fillStyle = colors[boxIdx % colors.length];
                ctx.fillRect(bx, by, (iw / numCols) - 2, 4);
              }
              boxIdx++;
            }
          }
        }
      } else if (item.type === 'babyfoot') {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(ix + 2, iy + 2, iw - 4, ih - 4);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ix, iy + ih * 0.33); ctx.lineTo(ix + iw, iy + ih * 0.33); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix, iy + ih * 0.66); ctx.lineTo(ix + iw, iy + ih * 0.66); ctx.stroke();
        ctx.fillStyle = '#ef4444'; ctx.fillRect(ix + iw * 0.4, iy + ih * 0.33 - 1.5, 3, 3);
        ctx.fillStyle = '#3b82f6'; ctx.fillRect(ix + iw * 0.4, iy + ih * 0.66 - 1.5, 3, 3);
      } else if (item.type === 'tv_foyer') {
        ctx.fillStyle = '#020617';
        ctx.fillRect(ix, iy, iw, ih);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(ix + 1, iy + 1, iw - 2, ih - 2);
      } else if (item.type === 'console_jeux') {
        ctx.fillStyle = '#312e81';
        ctx.fillRect(ix + 1, iy + 1, iw - 2, ih - 2);
        ctx.fillStyle = '#a5b4fc';
        ctx.fillRect(ix + iw * 0.3, iy + ih * 0.3, iw * 0.4, ih * 0.4);
      } else if (item.type === 'ping_pong') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(ix, iy, iw, ih);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ix, iy + ih / 2); ctx.lineTo(ix + iw, iy + ih / 2); ctx.stroke();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ix + iw / 2, iy); ctx.lineTo(ix + iw / 2, iy + ih); ctx.stroke();
      } else if (item.type === 'distributeur_snacks') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(ix, iy, iw, ih);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(ix + 2, iy + 2, iw - 4, ih * 0.5);
      } else if (item.type === 'lit_garde') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.15, iy + ih * 0.08, iw * 0.7, ih * 0.25);
      } else if (item.type === 'casiers_vestiaire' || item.type === 'casiers_tenues_xl') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const cuts = item.type === 'casiers_tenues_xl' ? 4 : 3;
        for (let c = 1; c < cuts; c++) {
          ctx.moveTo(ix + (iw / cuts) * c, iy);
          ctx.lineTo(ix + (iw / cuts) * c, iy + ih);
        }
        ctx.stroke();
        // Aération vestiaire
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(ix + 2, iy + 2, iw - 4, 2);
      } else if (item.type === 'armoire_forte_securisee') {
        // Armoire forte blindée DAE / sensible
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(ix + 2, iy + 2, iw - 4, ih - 4);
        // Cadran de sécurité / roue de verrouillage
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ix + iw / 2, iy + ih / 2, Math.min(iw, ih) * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        // Point central / serrure
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(ix + iw / 2 - 1.5, iy + ih / 2 - 1.5, 3, 3);
      } else if (item.type === 'rack_palettes_lourd') {
        // Rack à palettes lourd industriel
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2;
        ctx.strokeRect(ix + 1, iy + 1, iw - 2, ih - 2);
        // Traverses acier
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        const numRacks = Math.max(3, Math.floor(iw / 12));
        for (let r = 1; r < numRacks; r++) {
          ctx.beginPath();
          ctx.moveTo(ix + (iw / numRacks) * r, iy);
          ctx.lineTo(ix + (iw / numRacks) * r, iy + ih);
          ctx.stroke();
        }
        // Palettes de matériel
        const storedEntries = Object.entries(item.storedInventory || {}).filter(([_, c]) => c > 0);
        if (storedEntries.length > 0) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(ix + 3, iy + 3, iw - 6, ih - 6);
        }
      } else if (item.type === 'lits_superposes') {
        // Lits superposés (2 couchages)
        ctx.fillStyle = '#ffffff';
        // Oreiller du dessus
        ctx.fillRect(ix + iw * 0.15, iy + ih * 0.06, iw * 0.7, ih * 0.2);
        // Oreiller du bas
        ctx.fillRect(ix + iw * 0.15, iy + ih * 0.74, iw * 0.7, ih * 0.2);
        // Échelle latérale
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ix + 2, iy + ih * 0.3); ctx.lineTo(ix + 2, iy + ih * 0.7);
        ctx.moveTo(ix + 6, iy + ih * 0.3); ctx.lineTo(ix + 6, iy + ih * 0.7);
        ctx.moveTo(ix + 2, iy + ih * 0.4); ctx.lineTo(ix + 6, iy + ih * 0.4);
        ctx.moveTo(ix + 2, iy + ih * 0.5); ctx.lineTo(ix + 6, iy + ih * 0.5);
        ctx.moveTo(ix + 2, iy + ih * 0.6); ctx.lineTo(ix + 6, iy + ih * 0.6);
        ctx.stroke();
      } else if (item.type === 'kitchenette_foyer') {
        // Kitchenette équipée : évier inox et plaques
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(ix + iw * 0.08, iy + ih * 0.15, iw * 0.35, ih * 0.7);
        // Robinet
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.23, iy + 2, 2, 4);
        // Plaques de cuisson
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(ix + iw * 0.55, iy + ih * 0.15, iw * 0.38, ih * 0.7);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ix + iw * 0.65, iy + ih * 0.5, 3.5, 0, Math.PI * 2);
        ctx.arc(ix + iw * 0.82, iy + ih * 0.5, 3.5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (item.type === 'table_repas_equipe') {
        // Grande table repas conviviale 8 places
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        // 8 Assiettes / sets de table
        const plateRadius = 2.5;
        for (let p = 0; p < 4; p++) {
          const px = ix + (iw / 5) * (p + 1);
          ctx.beginPath(); ctx.arc(px, iy + ih * 0.25, plateRadius, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(px, iy + ih * 0.75, plateRadius, 0, Math.PI * 2); ctx.fill();
        }
      } else if (item.type === 'ecran_tactique_interactif') {
        // Écran tactile interactif 75"
        ctx.fillStyle = '#020617';
        ctx.fillRect(ix, iy, iw, ih);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.fillRect(ix + 1, iy + 1, iw - 2, ih - 2);
        // Icône de briefing
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.3, iy + ih * 0.3, iw * 0.4, 1.5);
      } else if (item.type === 'mannequin_pediatrique') {
        // Tapis d'exercice orange
        ctx.fillStyle = 'rgba(234, 88, 12, 0.25)';
        ctx.fillRect(ix + 1, iy + 1, iw - 2, ih - 2);
        // Corps nourrisson
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(ix + iw / 2, iy + ih * 0.3, Math.min(iw, ih) * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(ix + iw * 0.35, iy + ih * 0.45, iw * 0.3, ih * 0.4);
      } else if (item.type === 'dsa_demonstration') {
        // DAE pédagogique
        ctx.fillStyle = '#10b981';
        ctx.fillRect(ix, iy, iw, ih);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix + iw * 0.35, iy + ih * 0.2, iw * 0.3, ih * 0.6);
        ctx.fillRect(ix + iw * 0.2, iy + ih * 0.35, iw * 0.6, ih * 0.3);
      }

      // Si le meuble est sélectionné ou survolé
      const isHovered = this.hoveredFurnitureId === item.id;
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? '#f97316' : '#fb923c';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeRect(ix - 2, iy - 2, iw + 4, ih + 4);

        if (isSelected) {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(ix + iw / 2, iy - 8, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        const infoText = `${item.label} (${item.w.toFixed(1)}m × ${item.d.toFixed(1)}m)`;
        ctx.font = 'bold 9.5px "Plus Jakarta Sans", sans-serif';
        const cardW = ctx.measureText(infoText).width + 16;
        const cardH = 20;
        const cardX = ix + iw / 2 - cardW / 2;
        const cardY = iy - (isSelected ? 30 : 24);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 5);
        else ctx.rect(cardX, cardY, cardW, cardH);
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#f97316' : '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#f97316' : '#374151';
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
    this._viewBox = this.getModelViewBox(model);
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

    // 7. Rendu des Portes et Ouvertures 3D
    model.doors.forEach(d => {
      const px = d.x; const py = d.y;
      if (d.type === 'garage_shutter') {
        this.draw3DBox(ctx, px, py, 0, 0.15, d.len, 2.6, '#475569', cam, cx, cy);
      } else if (d.type === 'glass_partition') {
        this.draw3DBox(ctx, px, py, 0, 0.08, d.len, 2.2, 'rgba(6, 182, 212, 0.45)', cam, cx, cy);
      } else if (d.type === 'double_door') {
        this.draw3DBox(ctx, px, py, 0, 0.06, d.len * 0.45, 2.05, '#b45309', cam, cx, cy);
        this.draw3DBox(ctx, px, py + d.len * 0.55, 0, 0.06, d.len * 0.45, 2.05, '#b45309', cam, cx, cy);
      } else {
        this.draw3DBox(ctx, px, py, 0, 0.06, d.len * 0.9, 2.05, '#b45309', cam, cx, cy);
      }
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
    const vb = this._viewBox || { cx: 8.3, cy: 6.0 };
    const ox = wx - vb.cx;
    const oy = wy - vb.cy;
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
    const money = game?.resources?.money || 0;
    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl p-5 max-w-2xl w-full space-y-4 border border-slate-700 shadow-2xl bg-slate-900 text-white max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-xl">🧰</span>
            <h3 class="font-black text-base">Ajouter un Mobilier ou Équipement de Secours</h3>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold cursor-pointer">✕</button>
        </div>
        <div class="flex items-center justify-between text-xs text-slate-300">
          <span>Sélectionnez un équipement à placer sur votre plan 2D :</span>
          <span>Trésorerie : <strong class="text-emerald-400 font-mono">${money.toLocaleString('fr-FR')} €</strong></span>
        </div>
        <!-- Onglets rapides de catégorie dans le modal -->
        <div class="flex items-center gap-1 overflow-x-auto pb-1 text-xs" id="quick-furn-cat-bar">
          <button type="button" onclick="document.querySelectorAll('.modal-furn-card').forEach(c => c.style.display=''); document.querySelectorAll('#quick-furn-cat-bar button').forEach(b => b.className='px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700'); this.className='px-2.5 py-1 rounded-lg text-[11px] font-black bg-pc-blue text-white shadow-xs';" class="px-2.5 py-1 rounded-lg text-[11px] font-black bg-pc-blue text-white shadow-xs">🗂️ Tout</button>
          <button type="button" onclick="document.querySelectorAll('.modal-furn-card').forEach(c => c.style.display = c.dataset.cat==='bureau'?'':'none'); document.querySelectorAll('#quick-furn-cat-bar button').forEach(b => b.className='px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700'); this.className='px-2.5 py-1 rounded-lg text-[11px] font-black bg-pc-blue text-white shadow-xs';" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700">💼 Direction</button>
          <button type="button" onclick="document.querySelectorAll('.modal-furn-card').forEach(c => c.style.display = c.dataset.cat==='formation'?'':'none'); document.querySelectorAll('#quick-furn-cat-bar button').forEach(b => b.className='px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700'); this.className='px-2.5 py-1 rounded-lg text-[11px] font-black bg-pc-blue text-white shadow-xs';" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700">🎓 Formation</button>
          <button type="button" onclick="document.querySelectorAll('.modal-furn-card').forEach(c => c.style.display = (c.dataset.cat==='stockage'||c.dataset.cat==='secours')?'':'none'); document.querySelectorAll('#quick-furn-cat-bar button').forEach(b => b.className='px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700'); this.className='px-2.5 py-1 rounded-lg text-[11px] font-black bg-pc-blue text-white shadow-xs';" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700">📦 Stockage</button>
          <button type="button" onclick="document.querySelectorAll('.modal-furn-card').forEach(c => c.style.display = c.dataset.cat==='detente'?'':'none'); document.querySelectorAll('#quick-furn-cat-bar button').forEach(b => b.className='px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700'); this.className='px-2.5 py-1 rounded-lg text-[11px] font-black bg-pc-blue text-white shadow-xs';" class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700">☕ Foyer</button>
        </div>
        <div class="overflow-y-auto max-h-[60vh] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pr-1">
          ${this.FURNITURE_CATALOG.map(item => `
            <button onclick="this.closest('.fixed').remove(); window.ProtecLocaux.addFurnitureItem('${item.type}')" data-cat="${item.cat}" class="modal-furn-card p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition flex flex-col justify-between gap-2 group cursor-pointer active:scale-95">
              <div class="flex items-start gap-2.5">
                <span class="text-2xl group-hover:scale-110 transition flex-shrink-0">${item.icon}</span>
                <div>
                  <strong class="block font-black text-white leading-tight">${item.name}</strong>
                  <span class="text-[10px] text-slate-400 font-mono">${item.w}m × ${item.d}m</span>
                </div>
              </div>
              <div class="flex items-center justify-between w-full pt-1 border-t border-slate-700/60">
                <span class="text-[10px] text-slate-400 capitalize">${item.cat}</span>
                <span class="font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded text-[11px]">${item.cost} €</span>
              </div>
            </button>
          `).join('')}
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

  saveCurrentArchitecture(game) {
    if (!game) game = window.game;
    if (!game) return;
    const stId = this.currentStationId;
    const station = (game.stations && game.stations.find(s => s.id === stId)) || (game.stations && game.stations[0]);
    if (!station) return;
    if (!station.premises) {
      station.premises = { tenure: 'rented', level: 1, monthlyRent: 350, securityEquipment: [] };
    }
    const model = this.getArchitectModel(station.id);
    if (model) {
      station.premises.architecture = JSON.parse(JSON.stringify(model));
    }
    if (typeof game.saveGame === 'function') {
      game.saveGame();
    }
  },

  toggleEditMode(game) {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      game.showToast('Mode Aménagement Actif', 'Déplacez, pivotez ou ajoutez du mobilier pour équiper vos locaux.', 'purple');
    } else {
      this.saveCurrentArchitecture(game);
      game.showToast('Plan Validé', 'L’aménagement et le mobilier de vos locaux sont enregistrés.', 'green');
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
    const mode = this.realEstateMode === 'sale' ? 'sale' : 'rent';
    const offers = this.getDailyRealEstateOffers(game, mode);
    const day = game?.clock?.day || 1;
    const monthName = game?.clock?.monthsNames?.[game?.clock?.month || 0] || 'Mois';
    const year = game?.clock?.year || 2026;
    const money = game?.resources?.money || 0;
    const nRent = this.getDailyRealEstateOffers(game, 'rent').length;
    const nSale = this.getDailyRealEstateOffers(game, 'sale').length;
    const tabBtn = (m, label, n) => `<button type="button" onclick="window.ProtecLocaux.setRealEstateMode('${m}')" class="px-4 py-2 rounded-xl text-xs font-black transition ${mode === m ? 'bg-pc-blue text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">${label} (${n})</button>`;

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-pc-blue/10 text-pc-blue flex items-center justify-center text-xl">🏛️</div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm sm:text-base font-black text-slate-900">Marché immobilier local</h4>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">Offres du ${day} ${monthName} ${year}</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Locaux existants avec plan réel : couloirs, salles de tailles variées, sanitaires, remise. Les annonces changent chaque jour.</p>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Trésorerie</span>
            <span class="text-base font-black text-emerald-600 font-mono">${money.toLocaleString('fr-FR')} €</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          ${tabBtn('rent', '🔑 À louer', nRent)}
          ${tabBtn('sale', '🏷️ À vendre', nSale)}
          <span class="text-[11px] text-slate-500 font-semibold ml-1 hidden sm:inline">${mode === 'rent' ? 'Loyer mensuel prélevé automatiquement, premier mois payé à la signature.' : 'Achat en pleine propriété : plus aucun loyer.'}</span>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          ${offers.map(b => {
            const isRent = b.kind === 'rent';
            const canAfford = money >= b.price;
            const priceLabel = isRent ? `${b.monthlyRent.toLocaleString('fr-FR')} € / mois` : `${b.price.toLocaleString('fr-FR')} €`;
            const rooms = (b.architecture.rooms || []);
            const tags = [];
            const nCor = rooms.filter(r => r.type === 'couloir').length;
            if (nCor) tags.push(`🚶 ${nCor} couloir${nCor > 1 ? 's' : ''}`);
            if (b.indoorBays) tags.push(`🚒 ${b.indoorBays} travée${b.indoorBays > 1 ? 's' : ''} couverte${b.indoorBays > 1 ? 's' : ''}`);
            const nSan = rooms.filter(r => ['wc', 'douche', 'vestiaire'].includes(r.type)).length;
            if (nSan) tags.push(`🚿 ${nSan} pièce${nSan > 1 ? 's' : ''} d’eau`);
            const areas = rooms.filter(r => r.type === 'libre').map(r => r.area);
            if (areas.length) tags.push(`📐 salles de ${Math.round(Math.min(...areas))} à ${Math.round(Math.max(...areas))} m²`);
            return `
              <div class="p-5 rounded-3xl glass-card flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                  <div class="flex items-start justify-between flex-wrap gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span class="text-3xl">${b.icon}</span>
                      <div class="min-w-0">
                        <h4 class="text-sm sm:text-base font-black text-slate-900 leading-tight">${b.name}</h4>
                        <span class="text-[10px] text-slate-500 font-semibold block mt-0.5">${b.typologyLabel} • ${b.surfaceM2} m² utiles • ${b.roomsCount} pièces dont ${b.freeRooms} à affecter</span>
                      </div>
                    </div>
                    <span class="px-3 py-1.5 rounded-xl text-xs font-black ${canAfford ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-700 border border-red-200'}">${priceLabel}</span>
                  </div>
                  <p class="text-xs text-slate-600 leading-relaxed">${b.desc}</p>
                  <div class="flex flex-wrap gap-1.5">${tags.map(t => `<span class="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">${t}</span>`).join('')}</div>
                  <div>${this.renderBuildingPlanPreviewSVG(b)}</div>
                  <div class="grid grid-cols-4 gap-2 text-[11px] font-bold text-center bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <div><span class="text-slate-400 block text-[9px] uppercase">Surface</span><strong class="text-slate-900 font-mono">${b.surfaceM2} m²</strong></div>
                    <div><span class="text-slate-400 block text-[9px] uppercase">Pièces</span><strong class="text-indigo-600">${b.roomsCount}</strong></div>
                    <div><span class="text-slate-400 block text-[9px] uppercase">Véhicules</span><strong class="text-amber-600">${b.vehicleCapacity}${b.indoorBays ? ` (${b.indoorBays} abrités)` : ''}</strong></div>
                    <div><span class="text-slate-400 block text-[9px] uppercase">Stockage</span><strong class="text-slate-700">${b.storageCapacity} u.</strong></div>
                  </div>
                </div>
                <button onclick="window.ProtecLocaux.${isRent ? 'rentBuilding' : 'buyBuilding'}(window.game, '${b.id}')" ${!canAfford ? 'disabled' : ''} class="w-full py-3 rounded-2xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 ${canAfford ? 'bg-[#ff6600] hover:bg-[#e65c00] text-white active:scale-95 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
                  <span>${!canAfford ? 'Trésorerie insuffisante' : isRent ? 'Signer le bail & déménager l’antenne' : 'Acheter & déménager l’antenne'}</span>
                  <i data-lucide="${isRent ? 'key-round' : 'shopping-cart'}" class="w-4 h-4"></i>
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  setRealEstateMode(mode) {
    this.realEstateMode = mode === 'sale' ? 'sale' : 'rent';
    if (window.game) this.renderModal(window.game);
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
    if (window.ProtecSocial && typeof window.ProtecSocial.clampStorageToCapacity === 'function') {
      window.ProtecSocial.clampStorageToCapacity(game);
    }
    const rawStorage = this.getCurrentStorageUsed(game);
    const storageUsed = Math.min(stats.storageCapacity, rawStorage);
    const isFull = stats.hasStorage && storageUsed >= stats.storageCapacity;
    const social = game.socialData || {};
    const log = game.logistics || {};

    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl ${!stats.hasStorage ? 'bg-red-50 border border-red-200' : (isFull ? 'bg-red-50/90 border border-red-300' : 'bg-amber-50/80 border border-amber-200')} flex items-center justify-between flex-wrap gap-3">
          <div class="space-y-1">
            <h4 class="text-xs font-black ${!stats.hasStorage || isFull ? 'text-red-900' : 'text-amber-900'} flex items-center gap-2">
              <span>Capacité de la Zone de Stockage de l’Antenne</span>
              ${isFull ? '<span class="px-2 py-0.5 rounded-full bg-red-200 text-red-900 text-[9px] font-black uppercase">Saturée (Limite Atteinte)</span>' : ''}
            </h4>
            <p class="text-[11px] text-slate-600">
              ${stats.hasStorage ? `Votre zone de stockage compte ${stats.counts.stockage || 0} case(s) de 25m², permettant d\'entreposer jusqu\'à <strong>${stats.storageCapacity} unités</strong> (actuellement occupé : <strong>${storageUsed} / ${stats.storageCapacity}</strong>). ${isFull ? '<span class="text-red-700 font-bold">Le stockage a atteint son plafond maximum : vous devez distribuer des denrées en maraude ou agrandir la réserve.</span>' : ''}` : `⚠️ Votre antenne n\'a <strong>aucune zone de stockage</strong>. Vous ne pouvez pas réaliser de collectes alimentaires ni stocker de matériel d\'urgence.`}
            </p>
          </div>
          <button onclick="window.ProtecLocaux.setTab(\'plan\', window.game); window.ProtecLocaux.isEditing = true; window.ProtecLocaux.selectedTool = \'stockage\'; window.ProtecLocaux.renderModal(window.game);" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow transition flex-shrink-0">
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
              ${(() => {
                const activeSt = game.stations?.find(s => s.id === game.currentStationId) || game.stations?.[0];
                const stStock = activeSt?.stock || {};
                const caisses = stStock.caisse_rearmement || 0;
                const reservePS = activeSt?.stockMaterielsPS || game.stockMaterielsPS || 0;
                const lotsSecours = (stStock.lot_secours_a || 0) + (stStock.lot_secours_b || 0) + (stStock.lot_secours_c || 0);
                const lotsCrise = (stStock.lot_tronconnage || 0) + (stStock.lot_pompage || 0) + (stStock.lot_eclairage || 0) + (stStock.lot_bachage || 0);

                return `
                  <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>📦 Caisses Réarmement Opérationnel :</span>
                    <strong class="text-slate-800">${caisses} caisse(s)</strong>
                  </div>
                  <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>🩹 Réserve Consommables PS :</span>
                    <strong class="text-slate-800">${reservePS}%</strong>
                  </div>
                  <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>🎒 Lots Secours (A, B, C) :</span>
                    <strong class="text-slate-800">${lotsSecours} lot(s)</strong>
                  </div>
                  <div class="flex justify-between p-2 rounded-xl bg-slate-50">
                    <span>🛠️ Lots Technique & Crise :</span>
                    <strong class="text-slate-800">${lotsCrise} lot(s)</strong>
                  </div>
                `;
              })()}
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
