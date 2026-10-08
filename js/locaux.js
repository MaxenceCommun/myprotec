/**
 * PROTEC LIVE - GESTION COMPLÈTE DES LOCAUX & BÂTIMENTS D'ANTENNE
 * 
 * 1. Choix initial entre 3 dispositions de "Petits Locaux" (400 m² - grille 4x4)
 *    - Standard Polyvalent (Bureau, Formation, Stockage, Foyer, Garage 2 places)
 *    - Base Opérationnelle & Garage (Grand garage 4 places, Stockage étendu, Dortoir, pas de formation au départ)
 *    - Centre Pédagogique (Grande salle de formation, Bureaux étendus, Foyer, Stockage compact)
 * 
 * 2. Achat de Bâtiments Existants (Moyen et Grand complexe)
 * 3. Construction neuve sur-mesure d'Architecte avec éditeur 2D libre
 * 4. Éditeur 2D interactif par zones :
 *    - formation : Accueil des formations grand public PSC1/SST (sinon uniquement chez les entreprises)
 *    - stockage : Capacité de stockage pour matériel & denrées alimentaires/social (indispensable pour les collectes)
 *    - garage : Abris et entretien des véhicules opérationnels
 *    - bureau : Administration, recrutement et planification
 *    - detente : Foyer/cuisine, boost moral & régénération fatigue
 *    - dortoir : Garde de nuit, départs réflexes immédiats SAMU & SDIS
 *    - vestiaires : Confort secouristes et sanitaires
 */

window.ProtecLocaux = {
  activeTab: 'plan', // 'plan' | 'catalogue' | 'construction' | 'stock'
  selectedTool: 'formation', // outil actif dans l'éditeur 2D
  isEditing: false, // mode modification de cloisons actif

  // Définition des types de zones et leurs caractéristiques
  ZONE_TYPES: {
    bureau: {
      id: 'bureau',
      name: 'Bureau & Direction',
      icon: '💼',
      bgClass: 'bg-indigo-600',
      borderClass: 'border-indigo-400',
      textClass: 'text-indigo-100',
      lightBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Gestion administrative, recrutement et planification des dispositifs.',
      costPerTile: 600,
      perTileStats: { adminBonus: 10 }
    },
    formation: {
      id: 'formation',
      name: 'Salle de Formation',
      icon: '🎓',
      bgClass: 'bg-blue-600',
      borderClass: 'border-blue-400',
      textClass: 'text-blue-100',
      lightBg: 'bg-blue-50 text-pc-blue border-blue-200',
      desc: 'Accueille les sessions grand public (PSC1, SST, GQS) à l’antenne.',
      costPerTile: 750,
      perTileStats: { studentCapacity: 6 }
    },
    stockage: {
      id: 'stockage',
      name: 'Stockage & Réserve',
      icon: '📦',
      bgClass: 'bg-amber-600',
      borderClass: 'border-amber-400',
      textClass: 'text-amber-100',
      lightBg: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Stocke matériel d’urgence, lots NOVI et denrées sociales (requis pour les collectes).',
      costPerTile: 500,
      perTileStats: { storageCapacity: 50 } // 50 unités de stock par case (25 m²)
    },
    garage: {
      id: 'garage',
      name: 'Hangar & Garage',
      icon: '🚒',
      bgClass: 'bg-red-600',
      borderClass: 'border-red-400',
      textClass: 'text-red-100',
      lightBg: 'bg-red-50 text-red-700 border-red-200',
      desc: 'Stationnement abrité, maintien en charge et entretien des véhicules.',
      costPerTile: 900,
      perTileStats: { vehicleCapacity: 1 }
    },
    detente: {
      id: 'detente',
      name: 'Foyer & Détente',
      icon: '☕',
      bgClass: 'bg-emerald-600',
      borderClass: 'border-emerald-400',
      textClass: 'text-emerald-100',
      lightBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'Espace de vie convivial, canapés et café. Régénère le moral et l’énergie.',
      costPerTile: 550,
      perTileStats: { energyRegenPercent: 15, moralBonus: 5 }
    },
    dortoir: {
      id: 'dortoir',
      name: 'Dortoir de Garde',
      icon: '🛏️',
      bgClass: 'bg-purple-600',
      borderClass: 'border-purple-400',
      textClass: 'text-purple-100',
      lightBg: 'bg-purple-50 text-purple-700 border-purple-200',
      desc: 'Lits de repos pour équipages de garde 24h SAMU 15 et astreinte NOVI.',
      costPerTile: 700,
      perTileStats: { nightBeds: 2, reflexeSpeed: 10 }
    },
    vestiaires: {
      id: 'vestiaires',
      name: 'Vestiaires & Douches',
      icon: '🚿',
      bgClass: 'bg-cyan-600',
      borderClass: 'border-cyan-400',
      textClass: 'text-cyan-100',
      lightBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      desc: 'Armoires tenues opérationnelles et hygiène des secouristes.',
      costPerTile: 600,
      perTileStats: { hygieneBonus: 10 }
    },
    vide: {
      id: 'vide',
      name: 'Dégagement / Cloison libre',
      icon: '⬜',
      bgClass: 'bg-slate-200',
      borderClass: 'border-slate-300',
      textClass: 'text-slate-500',
      lightBg: 'bg-slate-100 text-slate-500 border-slate-200',
      desc: 'Espace non affecté ou couloir de circulation.',
      costPerTile: 150,
      perTileStats: {}
    }
  },

  // 3 Dispositions prédéfinies de "Petits Locaux" (grille 4x4, 16 cases = 400 m²)
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
      grid: [
        'bureau', 'bureau', 'formation', 'formation',
        'bureau', 'vestiaires', 'formation', 'formation',
        'detente', 'detente', 'formation', 'formation',
        'garage', 'garage', 'stockage', 'stockage'
      ]
    }
  ],

  // Catalogue de Bâtiments existants à l'achat
  CATALOG_BUILDINGS: [
    {
      id: 'building_medium',
      name: 'Entrepôt d’Activités Rénové',
      type: 'Achat Existant',
      price: 120000,
      surfaceM2: 750,
      width: 6,
      height: 5,
      desc: 'Bâtiment spacieux idéal pour doubler la flotte et multiplier les capacités de stockage et de formation.',
      icon: '🏢',
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
      type: 'Achat Existant',
      price: 350000,
      surfaceM2: 1200,
      width: 8,
      height: 6,
      desc: 'Complexe ultramoderne de référence départementale : baie radio intégrée, immense hangar 8 places, 4 salles de cours et dortoirs complets.',
      icon: '🏛️',
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

  // Récupère ou initialise la structure de locaux d'une antenne
  getStationPremises(game, stationId) {
    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return null;

    if (!station.premises) {
      // Pas encore de local choisi -> à choisir au premier accès
      station.premises = null;
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
      customBuilt: false,
      purchasedAt: Date.now()
    };

    game.saveGame();
    game.updateStatsUI();
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
    const stats = this.calculatePremisesStats(prem);
    return stats.hasFormation;
  },

  getFormationCapacity(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return 0;
    return this.calculatePremisesStats(prem).studentCapacity;
  },

  hasStorageRoom(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return false;
    const stats = this.calculatePremisesStats(prem);
    return stats.hasStorage;
  },

  getStorageCapacity(game, stationId) {
    const prem = this.getStationPremises(game, stationId);
    if (!prem) return 0;
    return this.calculatePremisesStats(prem).storageCapacity;
  },

  // Calcule la quantité actuelle d'objets stockés
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
    return used;
  },

  // --- ACTIONS DU JOUEUR ---

  // Choix initial du local
  selectStarterLayout(game, layoutId) {
    const layout = this.STARTER_LAYOUTS.find(l => l.id === layoutId);
    if (!layout) return;

    this.applyLayout(game, game.stations[0]?.id, layout);
    game.showToast('Locaux Inaugurés !', `Votre antenne est désormais installée dans « ${layout.name} » (${layout.surfaceM2} m²).`, 'green');
    this.renderModal(game);
  },

  // Achat d'un bâtiment existant
  buyBuilding(game, buildingId) {
    const b = this.CATALOG_BUILDINGS.find(x => x.id === buildingId);
    if (!b) return;

    if (game.resources.money < b.price) {
      game.showToast('Fonds Insuffisants', `L'acquisition de ce bâtiment nécessite ${b.price.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    if (!confirm(`Confirmez-vous l'achat de « ${b.name} » pour ${b.price.toLocaleString('fr-FR')} € ? Votre antenne déménagera dans ce nouvel édifice.`)) {
      return;
    }

    game.resources.money -= b.price;
    this.applyLayout(game, game.stations[0]?.id, b);
    game.showToast('Déménagement Réussi !', `Nouvelle base d'antenne acquise : ${b.name} (${b.surfaceM2} m²) !`, 'green');
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

    if (!confirm(`Lancer la construction d'un bâtiment sur-mesure (${width}x${height} cases = ${totalTiles * 25} m²) pour ${totalCost.toLocaleString('fr-FR')} € ? Vous pourrez ensuite concevoir les pièces librement avec l'éditeur 2D.`)) {
      return;
    }

    game.resources.money -= totalCost;

    // Créer une grille vide avec des couloirs/murs
    const grid = new Array(totalTiles).fill('vide');
    // Mettre par défaut quelques bureaux et un garage
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
      purchasedAt: Date.now()
    };

    this.isEditing = true;
    game.showToast('Chantier Livré !', `Les fondations sont prêtes ! Utilisez l'éditeur 2D pour aménager vos pièces.`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Clic sur une case dans l'éditeur 2D
  onTileClick(game, tileIndex) {
    const st = game.stations[0];
    if (!st || !st.premises) return;

    if (!this.isEditing) {
      game.showToast('Mode Plan Seul', 'Activez le mode « Réaménager les Cloisons » pour modifier l’agencement 2D.', 'blue');
      return;
    }

    const currentType = st.premises.grid[tileIndex];
    const newType = this.selectedTool;

    if (currentType === newType) return;

    const zoneDef = this.ZONE_TYPES[newType];
    const remodelCost = 350; // Frais d'aménagement de la cloison

    if (game.resources.money < remodelCost) {
      game.showToast('Fonds Insuffisants', `L'aménagement de cette pièce coûte ${remodelCost} €.`, 'orange');
      return;
    }

    game.resources.money -= remodelCost;
    st.premises.grid[tileIndex] = newType;

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Rendu de l'écran principal dans le modal
  renderModal(game) {
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Gestion des Locaux & Bâtiment d’Antenne';
    subtitle.textContent = 'Aménagement par zones, plan 2D interactif, capacité de stockage et salles de formation';
    icon.setAttribute('data-lucide', 'building-2');

    const station = game.stations[0] || { name: 'Antenne Locale', id: 'st-0' };
    const premises = this.getStationPremises(game, station.id);

    // Cas 1 : Premier accès -> Choix des 3 dispositions de départ
    if (!premises) {
      body.innerHTML = this.renderStarterSelection(game, station);
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Cas 2 : Le joueur a déjà un local -> Affichage complet avec onglets
    const stats = this.calculatePremisesStats(premises);
    const storageUsed = this.getCurrentStorageUsed(game);
    const storagePercent = stats.storageCapacity > 0 ? Math.min(100, Math.round((storageUsed / stats.storageCapacity) * 100)) : 100;

    body.innerHTML = `
      <div class="space-y-5">
        
        <!-- En-tête : Informations du Bâtiment & Statistiques Opérationnelles -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-pc-blue via-pc-blue-light to-indigo-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🏛️</span>
              <div>
                <h3 class="text-base font-black leading-tight">${premises.name}</h3>
                <p class="text-xs text-white/80">${station.name} • Surface totale : <strong class="text-amber-300 font-bold">${stats.surfaceM2} m²</strong> (${premises.width}x${premises.height} cases)</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md text-xs font-bold flex items-center gap-1.5">
              <span>Trésorerie :</span>
              <strong class="text-emerald-300 mono-num">${game.resources.money.toLocaleString('fr-FR')} €</strong>
            </span>
            ${premises.customBuilt ? `
              <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/30">
                ✨ Bâtiment Sur-Mesure
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Synthèse des Capacités Clés (Stockage, Formation, Flotte) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <!-- Capacité Stockage -->
          <div class="p-3.5 rounded-2xl ${stats.hasStorage ? 'glass-card border-amber-200/80 bg-amber-50/30' : 'bg-red-50 border border-red-200'} space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">📦 Stockage</span>
              <span class="${stats.hasStorage ? 'text-amber-600' : 'text-red-600'} font-black">${storageUsed} / ${stats.storageCapacity}</span>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div class="h-full ${storagePercent > 90 ? 'bg-red-500' : 'bg-amber-500'} transition-all" style="width: ${storagePercent}%"></div>
            </div>
            <p class="text-[10px] ${stats.hasStorage ? 'text-slate-500' : 'text-red-600 font-bold'}">
              ${stats.hasStorage ? `Collectes & maraudes autorisées` : `⚠️ Pas de stockage (collectes bloquées)`}
            </p>
          </div>

          <!-- Salle de Formation -->
          <div class="p-3.5 rounded-2xl ${stats.hasFormation ? 'glass-card border-blue-200/80 bg-blue-50/30' : 'bg-slate-50 border border-slate-200'} space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">🎓 Formations</span>
              <span class="text-pc-blue font-black">${stats.studentCapacity} places</span>
            </div>
            <p class="text-[10px] ${stats.hasFormation ? 'text-slate-500' : 'text-slate-400'}">
              ${stats.hasFormation ? `${stats.counts.formation || 0} salle(s) • PSC1/SST à l’antenne` : `Aucune salle (formations entreprises uniquement)`}
            </p>
          </div>

          <!-- Places Hangar Garage -->
          <div class="p-3.5 rounded-2xl glass-card space-y-1">
            <div class="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span class="flex items-center gap-1">🚒 Flotte / Abri</span>
              <span class="text-red-600 font-black">${game.vehicles.length} / ${stats.vehicleCapacity} places</span>
            </div>
            <p class="text-[10px] text-slate-500">
              ${stats.counts.garage || 0} travée(s) d’intervention
            </p>
          </div>

          <!-- Foyer / Dortoirs -->
          <div class="p-3.5 rounded-2xl glass-card space-y-1">
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
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
          <button onclick="window.ProtecLocaux.setTab('plan', window.game)" class="px-3.5 py-1.5 rounded-xl transition ${this.activeTab === 'plan' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'} flex items-center gap-1.5">
            <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
            Plan d’Architecte 2D
          </button>
          <button onclick="window.ProtecLocaux.setTab('catalogue', window.game)" class="px-3.5 py-1.5 rounded-xl transition ${this.activeTab === 'catalogue' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'} flex items-center gap-1.5">
            <i data-lucide="building" class="w-3.5 h-3.5"></i>
            Acheter un Bâtiment (${this.CATALOG_BUILDINGS.length})
          </button>
          <button onclick="window.ProtecLocaux.setTab('construction', window.game)" class="px-3.5 py-1.5 rounded-xl transition ${this.activeTab === 'construction' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'} flex items-center gap-1.5">
            <i data-lucide="hammer" class="w-3.5 h-3.5"></i>
            Faire Construire (Sur-Mesure)
          </button>
          <button onclick="window.ProtecLocaux.setTab('stock', window.game)" class="px-3.5 py-1.5 rounded-xl transition ${this.activeTab === 'stock' ? 'bg-pc-blue text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'} flex items-center gap-1.5">
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

  // Change d'onglet
  setTab(tabKey, game) {
    this.activeTab = tabKey;
    this.renderModal(game);
  },

  // Écran de Choix Initial (3 Petits Locaux de Départ)
  renderStarterSelection(game, station) {
    return `
      <div class="space-y-6 max-w-4xl mx-auto py-2">
        <div class="text-center space-y-2">
          <span class="px-3 py-1 rounded-full text-xs font-black bg-pc-blue/10 text-pc-blue uppercase tracking-wider">
            Inauguration de l’Antenne
          </span>
          <h3 class="text-xl font-black text-slate-900">Choisissez la Disposition de vos Premiers Locaux</h3>
          <p class="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
            Pour installer votre nouvelle antenne de Protection Civile, la commune met à votre disposition un local de <strong>400 m²</strong>.
            Sélectionnez l'aménagement initial qui correspond le mieux à votre stratégie opérationnelle (tous les joueurs débutent avec ces mêmes choix) :
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

                  <!-- Aperçu Miniature du Plan 2D -->
                  <div class="p-2.5 rounded-2xl bg-slate-900/90 shadow-inner">
                    <div class="grid grid-cols-4 gap-1 aspect-square w-full">
                      ${layout.grid.map(tileKey => {
                        const z = this.ZONE_TYPES[tileKey] || this.ZONE_TYPES.vide;
                        return `
                          <div class="rounded-md ${z.bgClass} flex items-center justify-center text-[10px] shadow-sm font-bold text-white" title="${z.name}">
                            ${z.icon}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

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

  // 1. Onglet Plan d'Architecte 2D & Éditeur Interactif
  renderPlanTab(game, premises, stats) {
    return `
      <div class="space-y-4">
        
        <!-- Barre de Contrôle de l'Éditeur 2D -->
        <div class="p-3.5 rounded-2xl glass-panel-heavy border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button onclick="window.ProtecLocaux.toggleEditMode(window.game)" class="px-4 py-2 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 ${this.isEditing ? 'bg-amber-500 text-white animate-pulse' : 'bg-pc-blue text-white hover:bg-pc-blue-light'}">
              <i data-lucide="${this.isEditing ? 'check-circle' : 'hammer'}" class="w-4 h-4"></i>
              <span>${this.isEditing ? 'Valider les Cloisons' : 'Réaménager les Cloisons (350 €/case)'}</span>
            </button>
            <span class="text-xs text-slate-500 font-medium hidden sm:inline">
              ${this.isEditing ? 'Sélectionnez un type de pièce ci-dessous puis cliquez sur les cases de la grille pour modifier leur affectation.' : 'Visualisation du plan au sol de l’antenne (1 case = 25 m²).'}
            </span>
          </div>

          <!-- Statut du plan -->
          <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Dimensions : <strong>${premises.width} × ${premises.height}</strong></span>
            <span>•</span>
            <span>Surface : <strong class="text-pc-blue">${stats.surfaceM2} m²</strong></span>
          </div>
        </div>

        <!-- Palette d'outils (active si isEditing) -->
        ${this.isEditing ? `
          <div class="p-3 rounded-2xl bg-slate-900 text-white space-y-2 animate-in fade-in">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <span>🖌️</span> Palette d'Aménagement : Choisissez la pièce à poser
              </span>
              <span class="text-[11px] text-slate-400">Cliquez sur une case pour l'assigner</span>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
              ${Object.values(this.ZONE_TYPES).map(z => {
                const isSelected = this.selectedTool === z.id;
                return `
                  <button onclick="window.ProtecLocaux.selectTool('${z.id}', window.game)" class="p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border-2 ${isSelected ? 'border-amber-400 bg-white/20 scale-105 shadow-md' : 'border-transparent bg-slate-800/80 hover:bg-slate-800 text-slate-200'}">
                    <span class="text-base">${z.icon}</span>
                    <span class="text-[10px] truncate max-w-full leading-tight">${z.name}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Grille 2D Interactive d'Architecte -->
        <div class="p-4 sm:p-6 rounded-3xl bg-slate-950 shadow-2xl border-4 border-slate-900 relative overflow-x-auto flex justify-center items-center">
          
          <!-- Quadrillage du Sol d'Architecte -->
          <div class="inline-grid gap-2 sm:gap-2.5 p-3 rounded-2xl bg-slate-900/90 shadow-inner" style="grid-template-columns: repeat(${premises.width}, minmax(64px, 88px));">
            ${premises.grid.map((tileKey, idx) => {
              const zone = this.ZONE_TYPES[tileKey] || this.ZONE_TYPES.vide;
              return `
                <div onclick="window.ProtecLocaux.onTileClick(window.game, ${idx})" class="group aspect-square rounded-2xl ${zone.bgClass} border-2 ${zone.borderClass} p-1.5 flex flex-col items-center justify-between shadow-md transition-all ${this.isEditing ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-400 hover:brightness-110' : 'cursor-default'}">
                  <div class="w-full flex justify-between items-center text-[9px] font-black text-white/80">
                    <span>#${idx + 1}</span>
                    <span>25m²</span>
                  </div>
                  <span class="text-2xl sm:text-3xl drop-shadow">${zone.icon}</span>
                  <span class="text-[9px] sm:text-[10px] font-extrabold text-white text-center truncate max-w-full drop-shadow">
                    ${zone.name}
                  </span>
                </div>
              `;
            }).join('')}
          </div>

        </div>

        <!-- Légende Opérationnelle des Zones -->
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

  // 2. Onglet Acheter un Bâtiment Existant
  renderCatalogueTab(game) {
    return `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
          <span>Vous manquez de place ? Achetez un bâtiment plus grand pour étendre massivement votre garage et vos réserves.</span>
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
                      ${b.price.toLocaleString('fr-FR')} €
                    </span>
                  </div>

                  <div>
                    <h4 class="text-base font-black text-slate-900">${b.name}</h4>
                    <p class="text-xs text-slate-500">${b.desc}</p>
                  </div>

                  <!-- Aperçu Plan 2D -->
                  <div class="p-2 rounded-2xl bg-slate-900 shadow-inner">
                    <div class="grid gap-1 aspect-video w-full" style="grid-template-columns: repeat(${b.width}, 1fr);">
                      ${b.grid.map(tileKey => {
                        const z = this.ZONE_TYPES[tileKey] || this.ZONE_TYPES.vide;
                        return `
                          <div class="rounded ${z.bgClass} flex items-center justify-center text-[8px] text-white font-bold" title="${z.name}">
                            ${z.icon}
                          </div>
                        `;
                      }).join('')}
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

  // 3. Onglet Construction Sur-Mesure d'Architecte
  renderConstructionTab(game) {
    return `
      <div class="space-y-5 max-w-2xl mx-auto py-2">
        <div class="p-4 rounded-3xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white space-y-2 shadow-lg">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🏗️</span>
            <div>
              <h4 class="text-sm font-black">Chantier Neuf d’Architecte Sécurité Civile</h4>
              <p class="text-xs text-white/80">Acquérez une parcelle nue viabilisée et concevez votre bâtiment de A à Z avec l'éditeur 2D.</p>
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
              <li>Permis de construire préfectoral de Sécurité Civile délivré.</li>
              <li>Raccordements électriques haute puissance pour bornes véhicules VPSP.</li>
              <li>Accès immédiat à l'Éditeur 2D pour dessiner vos cloisons et pièces.</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  },

  // 4. Onglet Réserve & Stock Social
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
  },

  // Active / désactive le mode édition
  toggleEditMode(game) {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      game.showToast('Mode Édition Actif', 'Sélectionnez un type de zone et cliquez sur les cases pour changer l’agencement.', 'purple');
    } else {
      game.showToast('Aménagement Enregistré', 'Le nouveau plan de vos locaux a été validé !', 'green');
    }
    this.renderModal(game);
  },

  // Sélectionne l'outil dans la palette
  selectTool(toolId, game) {
    this.selectedTool = toolId;
    this.renderModal(game);
  }
};
