/**
 * PROTEC LIVE - MODULE LOGISTIQUE & CENTRALE D'ACHATS PROTECTION CIVILE
 * 
 * Fonctionne comme une véritable boutique en ligne e-commerce :
 * 1. Catégories officielles de matériel (Pharmacie, Lots A/B/C, Crise, Tenues/EPI, Social, Transmissions)
 * 2. Panier d'achat en temps réel avec calcul des coûts et trésorerie
 * 3. Validation de commande avec débit immédiat et livraison dans le stock de l'antenne sélectionnée
 * 4. Gestion d'inventaire par antenne (station.stock) avec valorisation
 * 5. Synchronisation transparente avec game.logistics
 */

window.ProtecLogistique = {
  activeTab: 'boutique', // 'boutique', 'stock', 'flotte'
  selectedCategory: 'all',
  selectedStationId: null,
  searchQuery: '',
  cart: {}, // { [itemId]: quantity }

  // =========================================================================
  // 1. CATALOGUE OFFICIEL CENTRAL D'ACHATS PROTECTION CIVILE
  // =========================================================================
  CATEGORIES: [
    { id: 'all', label: 'Tout le Catalogue', icon: '🏪' },
    { id: 'pharmacie', label: 'Pharmacie & Consommables', icon: '🚑' },
    { id: 'lots_secours', label: 'Lots de Secours A/B/C', icon: '🎒' },
    { id: 'technique_crise', label: 'Technique & Crise', icon: '🛠️' },
    { id: 'tenues_epi', label: 'Tenues & Équipements EPI', icon: '🦺' },
    { id: 'social_hebergement', label: 'Ravitaillement & Social', icon: '🥫' },
    { id: 'transmissions', label: 'Transmissions & Radio', icon: '📻' }
  ],

  CATALOG: [
    // --- 1. PHARMACIE & CONSOMMABLES ---
    {
      id: 'oxygenBottles',
      category: 'pharmacie',
      name: 'Bouteille Oxygène Médical 5L (O2 B5)',
      icon: '🫁',
      price: 45,
      unit: 'bouteille',
      badge: 'Urgence Vitale',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      desc: 'Bouteille d’oxygène pur B5 (5L / 200 bars) avec manodétendeur débitmètre intégré.',
      usage: 'Consommée lors des détresses respiratoires et arrêts cardiaques en mission.'
    },
    {
      id: 'aedPads',
      category: 'pharmacie',
      name: 'Électrodes Défibrillateur DAE (Adulte/Enfant)',
      icon: '⚡',
      price: 38,
      unit: 'paire',
      badge: 'Défibrillation',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'Paire d’électrodes de défibrillation pré-connectées avec capteur de RCP.',
      usage: 'Utilisées pour tout arrêt cardio-respiratoire (ACR).'
    },
    {
      id: 'woundKits',
      category: 'pharmacie',
      name: 'Trousse Plaies, Pansements & Bandages',
      icon: '🩹',
      price: 20,
      unit: 'trousse',
      badge: 'Soins & Plaies',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      desc: 'Compresses stériles, bandes extensibles, sparadrap microporeux et désinfectant chlorhexidine.',
      usage: 'Essentielle sur les postes de secours pour soigner les traumatismes bénins et coupures.'
    },
    {
      id: 'cervicalCollars',
      category: 'pharmacie',
      name: 'Collier Cervical Multiposture Réglable',
      icon: '🩻',
      price: 22,
      unit: 'collier',
      badge: 'Immobilisation',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Collier cervical rigide monobloc réglable adulte et pédiatrique avec ouverture trachéale.',
      usage: 'Immobilisation du rachis cervical lors d’accidents de la voie publique et chutes.'
    },
    {
      id: 'tourniquets',
      category: 'pharmacie',
      name: 'Garrot Tourniquet Hémostatique Tactique (CAT)',
      icon: '🩸',
      price: 35,
      unit: 'garrot',
      badge: 'Hémorragie Massive',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      desc: 'Garrot tourniquet militaire Combat Application Tourniquet (CAT Gen 7) officiel.',
      usage: 'Arrêt immédiat des hémorragies externes graves sur membres.'
    },
    {
      id: 'attelles_pack',
      category: 'pharmacie',
      name: 'Pack Attelles Modelables Aluform & Dépression',
      icon: '🦴',
      price: 110,
      unit: 'pack',
      badge: 'Traumatologie',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      desc: 'Ensemble complet d’attelles pour membres supérieurs et inférieurs (poignet, coude, jambe).',
      usage: 'Stabilisation des fractures fermées et entorses graves avant évacuation.'
    },
    {
      id: 'bavu_ambu',
      category: 'pharmacie',
      name: 'Insufflateur Manuel BAVU avec Masques O2',
      icon: '💨',
      price: 65,
      unit: 'bavu',
      badge: 'Ventilation',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      desc: 'Ballon auto-remplisseur avec réservoir d’oxygène haute concentration, masques n°3, 4 et 5.',
      usage: 'Ventilation artificielle lors de l’arrêt cardio-respiratoire.'
    },
    {
      id: 'trousse_brulures',
      category: 'pharmacie',
      name: 'Trousse Brûlures Hydrogel Water-Jel',
      icon: '🔥',
      price: 55,
      unit: 'trousse',
      badge: 'Thermique',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      desc: 'Compresses et flacons de gel d’eau apaisant stérile pour brûlures thermiques et chimiques.',
      usage: 'Soulagement immédiat et arrêt de la progression thermique.'
    },

    // --- 2. LOTS DE SECOURS A / B / C ---
    {
      id: 'lot_secours_a',
      category: 'lots_secours',
      name: 'Lot A (Secours à Personne Standard - Sac PS)',
      icon: '🎒',
      price: 850,
      unit: 'lot complet',
      badge: 'Dotation Majeure',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'Sac d’intervention complet avec oxygénothérapie, BAVU, oxymètre, tensiomètre, colliers et garrot.',
      usage: 'Armement obligatoire de base de tout VPSP et PAPS (+35% rapidité prise en charge).'
    },
    {
      id: 'lot_secours_b',
      category: 'lots_secours',
      name: 'Lot B (Immobilisation, Matelas Coquille, Plan Dur)',
      icon: '🩼',
      price: 1250,
      unit: 'lot complet',
      badge: 'Traumatologie Lourde',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      desc: 'Matelas immobilisateur à dépression avec pompe, plan dur adulte/enfant et chaise de transport.',
      usage: 'Indispensable pour la traumatologie sportive, chutes et extractions délicates (+25 réputation).'
    },
    {
      id: 'lot_secours_c',
      category: 'lots_secours',
      name: 'Lot C (Poste de Secours Fixe & Barnum 16m²)',
      icon: '⛺',
      price: 1750,
      unit: 'lot complet',
      badge: 'Grands Dispositifs',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      desc: 'Tente gonflable 16 m², 2 brancards sur tréteaux, rampe LED, table de secrétariat SINUS.',
      usage: 'Permet d’accueillir et soigner jusqu’à 6 victimes simultanément sur DPS-ME et festivals.'
    },
    {
      id: 'sac_pedestre',
      category: 'lots_secours',
      name: 'Sacoche Binôme Secouriste Pédestre',
      icon: '🚶',
      price: 320,
      unit: 'sacoche',
      badge: 'Mobilité Foule',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
      desc: 'Sac d’épaule ultra-léger avec pansements, DAE compact de poche et garrot pour patrouilles.',
      usage: 'Équipe les secouristes en patrouille à pied dans les foules denses.'
    },
    {
      id: 'chaise_transport',
      category: 'lots_secours',
      name: 'Chaise de Transport d’Escalier Pliable Alu',
      icon: '💺',
      price: 450,
      unit: 'chaise',
      badge: 'Évacuation',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      desc: 'Chaise d’évacuation pliable en alliage d’aluminium avec chenilles pour escaliers étroits.',
      usage: 'Extraction des victimes d’appartements sans ascenseur.'
    },

    // --- 3. TECHNIQUE & CRISE ---
    {
      id: 'lot_tronconnage',
      category: 'technique_crise',
      name: 'Lot Tronçonnage / Dégagement Voirie',
      icon: '🪚',
      price: 1450,
      unit: 'lot complet',
      badge: 'Tempêtes & Axes',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
      desc: '2 tronçonneuses thermiques (guides 45 & 50 cm), EPI anti-coupure complets et tire-fort 1.6T.',
      usage: 'Dégagement express d’arbres tombés sur les voies lors d’intempéries.'
    },
    {
      id: 'lot_pompage',
      category: 'technique_crise',
      name: 'Lot Épuisement / Pompage Eaux Chargées',
      icon: '🚰',
      price: 1850,
      unit: 'lot complet',
      badge: 'Inondations & Crues',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
      desc: '2 motopompes thermiques gros débit (60 m³/h), pompes vide-caves et 100m de tuyaux.',
      usage: 'Assèchement rapide des sous-sols et parkings inondés (+40% indemnités mairie).'
    },
    {
      id: 'lot_eclairage',
      category: 'technique_crise',
      name: 'Lot Éclairage de Crise & Mât Télescopique',
      icon: '💡',
      price: 1600,
      unit: 'lot complet',
      badge: 'Nocturne & PMA',
      badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-300',
      desc: 'Groupe électrogène insonorisé 3.5 kVA, 2 mâts LED télescopiques 4m (50 000 lm) et ballon Airstar.',
      usage: 'Illumination des postes médicaux avancés et recherches nocturnes.'
    },
    {
      id: 'lot_bachage',
      category: 'technique_crise',
      name: 'Lot Bâchage Toitures & Consolidation Sinistres',
      icon: '🛖',
      price: 980,
      unit: 'lot complet',
      badge: 'Intempéries',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-300',
      desc: '6 grandes bâches armées 10x12m, liteaux, cloueuses, sangles d’arrimage et harnais antichute.',
      usage: 'Mise hors d’eau d’urgence des toitures arrachées par les vents violents.'
    },
    {
      id: 'groupe_electro',
      category: 'technique_crise',
      name: 'Groupe Électrogène Inverter Insonorisé 3.5 kVA',
      icon: '🔌',
      price: 890,
      unit: 'appareil',
      badge: 'Énergie',
      badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-300',
      desc: 'Générateur électrique portable silencieux à technologie Inverter pour matériel médical sensible.',
      usage: 'Alimentation autonome des tentes et équipements lors de coupures réseau.'
    },

    // --- 4. TENUES & ÉQUIPEMENTS EPI ---
    {
      id: 'tenue_f1',
      category: 'tenues_epi',
      name: 'Pack Tenue F1 Homologuée (Parka, Pantalon, Polo)',
      icon: '🧥',
      price: 160,
      unit: 'pack tenue',
      badge: 'Identité Fédérale',
      badgeColor: 'bg-blue-50 text-blue-900 border-blue-300',
      desc: 'Ensemble textile officiel bleu marine et orange fluo avec bandes rétro-réfléchissantes de classe 3.',
      usage: 'Équipe vos nouveaux bénévoles et augmente le moral et la fierté d’appartenance.'
    },
    {
      id: 'casque_f2',
      category: 'tenues_epi',
      name: 'Casque de Secours F2 avec Visière Intégrée',
      icon: '🪖',
      price: 120,
      unit: 'casque',
      badge: 'Protection Chocs',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
      desc: 'Casque de protection pour sauvetage déblaiement et secours routier avec lunettes-masque.',
      usage: 'Protège les équipiers engagés sur les interventions techniques et accidents.'
    },
    {
      id: 'rangers_secours',
      category: 'tenues_epi',
      name: 'Rangers d’Intervention Secouriste Anti-Perforation',
      icon: '🥾',
      price: 110,
      unit: 'paire',
      badge: 'Sécurité Pieds',
      badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
      desc: 'Chaussures montantes en cuir avec embout composite et semelle anti-perforation.',
      usage: 'Sécurité maximale sur les terrains boueux, décombres et intempéries.'
    },
    {
      id: 'gants_intervention',
      category: 'tenues_epi',
      name: 'Lot de 10 Paires de Gants Anti-Coupure Secours',
      icon: '🧤',
      price: 95,
      unit: 'lot de 10',
      badge: 'Protection Mains',
      badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-300',
      desc: 'Gants ergonomiques haute dextérité certifiés EN 388 contre les risques mécaniques.',
      usage: 'Protection lors du brancardage, relevage et manipulation de matériels.'
    },

    // --- 5. RAVITAILLEMENT & ACTION SOCIALE ---
    {
      id: 'lot_hebergement',
      category: 'social_hebergement',
      name: 'Lot Hébergement d’Urgence (30 Lits Picots + Duvets)',
      icon: '🛏️',
      price: 2100,
      unit: 'lot complet',
      badge: 'Plan PCS Sinistrés',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: '30 lits de camp métalliques Sécurité Civile, 30 duvets thermiques et 30 kits d’hygiène.',
      usage: 'Armement immédiat d’un Centre d’Hébergement d’Urgence (CHU) ou gymnase communal.'
    },
    {
      id: 'lot_ravitaillement',
      category: 'social_hebergement',
      name: 'Lot Ravitaillement / Cuisine de Crise & Percolateur',
      icon: '🍲',
      price: 1350,
      unit: 'lot complet',
      badge: 'Soutien des Troupes',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
      desc: 'Percolateur inox 15L, réchauds grande puissance, 4 marmites isothermes et tables réfectoire.',
      usage: 'Restaure +20% d’énergie et de moral aux intervenants sur les longues missions.'
    },
    {
      id: 'lot_soutien_psy',
      category: 'social_hebergement',
      name: 'Lot Soutien Psychologique CAI & Peluches Enfants',
      icon: '🫂',
      price: 1200,
      unit: 'lot complet',
      badge: 'Cellule d’Accueil',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      desc: 'Paravents acoustiques, plaids douillets, coin jeux/coloriages et peluches de réconfort.',
      usage: 'Accueil des impliqués et familles lors de catastrophes NOVI et accidents collectifs.'
    },
    {
      id: 'couvertures_pack',
      category: 'social_hebergement',
      name: 'Carton de 50 Couvertures de Survie Or/Argent',
      icon: '✨',
      price: 45,
      unit: 'carton 50 ex',
      badge: 'Hypothermie',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
      desc: 'Couvertures isolantes réflectives pour protection contre le froid, la pluie et la chaleur.',
      usage: 'Distribuées systématiquement aux victimes et personnes évacuées.'
    },
    {
      id: 'kits_hygiene',
      category: 'social_hebergement',
      name: 'Lot de 20 Trousses d’Hygiène Sinistrés Complètes',
      icon: '🧴',
      price: 70,
      unit: 'lot de 20',
      badge: 'Dignité Humaine',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      desc: 'Brosse à dents, dentifrice, savon, shampoing, serviette microfibre et rasoir jetable.',
      usage: 'Données aux personnes hébergées d’urgence en gymnase.'
    },

    // --- 6. TRANSMISSIONS & RADIO ---
    {
      id: 'radio_antares',
      category: 'transmissions',
      name: 'Portatif Radio Numérique ANTARES (VHF/UHF)',
      icon: '📻',
      price: 450,
      unit: 'portatif',
      badge: 'Réseau Inter-Services',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      desc: 'Talkie-walkie crypté avec micro déporté pour liaison directe CODIS, SAMU et chefs de dispositif.',
      usage: 'Réduit la fatigue mentale des chefs d’équipe (-15% perte énergie en mission).'
    },
    {
      id: 'tablette_tlo',
      category: 'transmissions',
      name: 'Tablette Tactique d’Engagement TLO Véhicule',
      icon: '📱',
      price: 550,
      unit: 'tablette',
      badge: 'Numérisation',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
      desc: 'Tablette durcie avec GPS opérationnel, cartographie IGN et transmission des bilans au 15.',
      usage: 'Accélère le temps de route de 10% et fiabilise le départ en intervention.'
    },
    {
      id: 'chargeur_radios',
      category: 'transmissions',
      name: 'Baie Chargeur Multiple 6 Postes ANTARES',
      icon: '🔋',
      price: 190,
      unit: 'chargeur 6 slots',
      badge: 'Vie d’Antenne',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      desc: 'Station de recharge rapide simultanée pour 6 talkies-walkies au local d’antenne.',
      usage: 'Garantit que toutes les radios sont chargées à 100% au départ des équipages.'
    }
  ],

  // =========================================================================
  // 2. GESTION DES STOCKS & INITIALISATION
  // =========================================================================

  getActiveStation(game) {
    if (!game || !game.stations || game.stations.length === 0) return null;
    if (this.selectedStationId) {
      const found = game.stations.find(s => s.id === this.selectedStationId);
      if (found) return found;
    }
    const defStation = game.stations.find(s => s.id === game.selectedStationId) || game.stations[0];
    this.selectedStationId = defStation.id;
    return defStation;
  },

  ensureStationStock(station, game) {
    if (!station) return;
    if (!station.stock) {
      station.stock = {
        oxygenBottles: 8,
        aedPads: 6,
        woundKits: 12,
        cervicalCollars: 4,
        tourniquets: 4,
        attelles_pack: 1,
        bavu_ambu: 2,
        trousse_brulures: 2,
        lot_secours_a: 1,
        lot_secours_b: 1,
        tenue_f1: 4,
        radio_antares: 2,
        couvertures_pack: 1
      };
    }
    // Synchroniser avec game.logistics si existant
    if (game && game.logistics) {
      ['oxygenBottles', 'aedPads', 'woundKits', 'cervicalCollars'].forEach(k => {
        if (station.stock[k] === undefined && game.logistics[k] !== undefined) {
          station.stock[k] = game.logistics[k];
        }
      });
    }
  },

  syncToGlobalLogistics(game) {
    if (!game) return;
    if (!game.logistics) game.logistics = {};

    // Somme ou valeur de la station active
    let sumO2 = 0, sumAed = 0, sumWound = 0, sumCollars = 0;
    (game.stations || []).forEach(st => {
      if (st.stock) {
        sumO2 += (st.stock.oxygenBottles || 0);
        sumAed += (st.stock.aedPads || 0);
        sumWound += (st.stock.woundKits || 0);
        sumCollars += (st.stock.cervicalCollars || 0);
      }
    });

    game.logistics.oxygenBottles = Math.max(game.logistics.oxygenBottles || 0, sumO2);
    game.logistics.aedPads = Math.max(game.logistics.aedPads || 0, sumAed);
    game.logistics.woundKits = Math.max(game.logistics.woundKits || 0, sumWound);
    game.logistics.cervicalCollars = Math.max(game.logistics.cervicalCollars || 0, sumCollars);
  },

  // =========================================================================
  // 3. ACTIONS DU PANIER E-COMMERCE
  // =========================================================================

  addToCart(itemId, qty = 1) {
    const item = this.CATALOG.find(i => i.id === itemId);
    if (!item) return;
    this.cart[itemId] = (this.cart[itemId] || 0) + qty;
    if (this.cart[itemId] <= 0) {
      delete this.cart[itemId];
    }
    this.renderModal(window.game);
    if (window.game) {
      window.game.showToast('Ajouté au Panier', `+${qty} ${item.name} dans votre panier d’antenne.`, 'blue');
    }
  },

  updateCartQty(itemId, newQty) {
    if (newQty <= 0) {
      delete this.cart[itemId];
    } else {
      this.cart[itemId] = newQty;
    }
    this.renderModal(window.game);
  },

  removeFromCart(itemId) {
    delete this.cart[itemId];
    this.renderModal(window.game);
  },

  clearCart() {
    this.cart = {};
    this.renderModal(window.game);
    if (window.game) {
      window.game.showToast('Panier vidé', 'Tous les articles ont été retirés.', 'slate');
    }
  },

  getCartTotal() {
    let total = 0;
    let itemsCount = 0;
    Object.entries(this.cart).forEach(([id, qty]) => {
      const item = this.CATALOG.find(i => i.id === id);
      if (item) {
        total += item.price * qty;
        itemsCount += qty;
      }
    });
    return { total, itemsCount };
  },

  checkout(game) {
    const { total, itemsCount } = this.getCartTotal();
    if (itemsCount === 0) {
      game.showToast('Panier vide', 'Ajoutez du matériel au panier avant de commander.', 'orange');
      return;
    }

    if (game.resources.money < total) {
      game.showToast('Trésorerie insuffisante', `Il vous manque ${(total - game.resources.money).toLocaleString('fr-FR')} € pour valider cette commande.`, 'red');
      return;
    }

    const station = this.getActiveStation(game);
    if (!station) {
      game.showToast('Aucune antenne', 'Veuillez sélectionner ou implanter une antenne.', 'orange');
      return;
    }

    this.ensureStationStock(station, game);

    // Débit trésorerie
    game.resources.money -= total;

    // Ajout des articles dans le stock de l'antenne
    const orderedItems = [];
    Object.entries(this.cart).forEach(([id, qty]) => {
      station.stock[id] = (station.stock[id] || 0) + qty;
      const catItem = this.CATALOG.find(i => i.id === id);
      if (catItem) orderedItems.push(`${qty}x ${catItem.name}`);
    });

    // Synchronisation avec les jauges globales
    this.syncToGlobalLogistics(game);

    // Sauvegarde
    game.updateStatsUI();
    game.saveGame();

    // Vider le panier
    this.cart = {};

    // Notification et redirection vers l'onglet stock
    game.showToast('Commande Réceptionnée ! 📦', `Achat de ${total.toLocaleString('fr-FR')} € validé. Matériel entreposé à ${station.name}.`, 'green');
    
    // Basculer vers l'onglet Stock pour voir les nouveaux articles arrivés
    this.activeTab = 'stock';
    this.renderModal(game);
  },

  // =========================================================================
  // 4. NAVIGATION & FILTRES
  // =========================================================================

  setTab(tabKey) {
    this.activeTab = tabKey;
    this.renderModal(window.game);
  },

  setCategory(catId) {
    this.selectedCategory = catId;
    this.renderModal(window.game);
  },

  setStation(stationId) {
    this.selectedStationId = stationId;
    this.renderModal(window.game);
  },

  setSearch(val) {
    this.searchQuery = (val || '').toLowerCase().trim();
    this.renderModal(window.game);
  },

  // =========================================================================
  // 5. RENDU PRINCIPAL DU MODULE (E-COMMERCE SHOP & STOCK)
  // =========================================================================

  renderModal(game) {
    const body = document.getElementById('modal-body');
    if (!body) return;

    const station = this.getActiveStation(game);
    if (station) {
      this.ensureStationStock(station, game);
    }

    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (title) title.textContent = 'Centrale d’Achats & Logistique Opérationnelle';
    if (subtitle) subtitle.textContent = 'Boutique en ligne officielle de matériel, pharmacie et stocks d’antennes';
    if (icon) icon.setAttribute('data-lucide', 'package-check');

    const { total: cartTotal, itemsCount: cartCount } = this.getCartTotal();

    body.innerHTML = `
      <div class="space-y-4">
        
        <!-- BARRE SUPÉRIEURE : SÉLECTEUR D'ANTENNE & NAVIGATION ONGLETS -->
        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <!-- Choix de l'antenne concernée -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <span class="text-base">🏢</span>
              <span>Antenne de Destination :</span>
            </span>
            <select onchange="window.ProtecLogistique.setStation(this.value)" class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-black text-slate-800 focus:ring-2 focus:ring-pc-blue">
              ${(game.stations || []).map(st => `
                <option value="${st.id}" ${st.id === station?.id ? 'selected' : ''}>
                  ${st.name} (${st.departmentCode || '75'})
                </option>
              `).join('')}
            </select>
            <span class="text-[11px] text-slate-500 font-semibold hidden sm:inline">
              • Trésorerie disponible : <strong class="text-emerald-600 font-mono font-black">${game.resources.money.toLocaleString('fr-FR')} €</strong>
            </span>
          </div>

          <!-- Onglets Principaux [ 🛒 Boutique | 📦 Mon Stock | 🚑 Flotte ] -->
          <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black self-start md:self-auto">
            <button onclick="window.ProtecLogistique.setTab('boutique')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'boutique' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <span>🛒</span>
              <span>Boutique en Ligne</span>
              ${cartCount > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-black">${cartCount}</span>` : ''}
            </button>
            <button onclick="window.ProtecLogistique.setTab('stock')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'stock' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <span>📦</span>
              <span>Stock de l'Antenne</span>
            </button>
            <button onclick="window.ProtecLogistique.setTab('flotte')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'flotte' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <span>🚑</span>
              <span>Flotte & Garage</span>
            </button>
          </div>
        </div>

        <!-- CONTENU DYNAMIQUE SELON L'ONGLET ACTIF -->
        ${this.activeTab === 'boutique' ? this.renderBoutiqueHTML(game, station, cartTotal, cartCount) : ''}
        ${this.activeTab === 'stock' ? this.renderStockHTML(game, station) : ''}
        ${this.activeTab === 'flotte' ? this.renderFlotteHTML(game, station) : ''}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // 6. ONGLET BOUTIQUE EN LIGNE (SHOPPING & PANIER)
  // =========================================================================

  renderBoutiqueHTML(game, station, cartTotal, cartCount) {
    const filteredItems = this.CATALOG.filter(item => {
      const matchCat = this.selectedCategory === 'all' || item.category === this.selectedCategory;
      const matchSearch = !this.searchQuery || 
        item.name.toLowerCase().includes(this.searchQuery) || 
        item.desc.toLowerCase().includes(this.searchQuery);
      return matchCat && matchSearch;
    });

    return `
      <!-- BANNIÈRE PROMO CENTRALE D'ACHATS -->
      <div class="p-3.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 text-white flex items-center justify-between gap-3 shadow-md">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner flex-shrink-0">
            🚚
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-black leading-tight">Centrale d'Approvisionnement Fédérale</h4>
            <p class="text-[11px] text-blue-100">Matériel officiel agréé Sécurité Civile & ARS • Livraison immédiate en réserve de l'antenne sélectionnée</p>
          </div>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-right">
          <div>
            <span class="text-[10px] text-blue-200 block">Frais d'expédition</span>
            <strong class="text-xs text-emerald-300 font-bold">Offerts (0 €)</strong>
          </div>
        </div>
      </div>

      <!-- CATÉGORIES & RECHERCHE -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            ${this.CATEGORIES.map(c => `
              <button onclick="window.ProtecLogistique.setCategory('${c.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${this.selectedCategory === c.id ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>${c.icon}</span>
                <span>${c.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Recherche rapide -->
          <div class="relative w-full sm:w-64">
            <input type="text" value="${this.searchQuery}" oninput="window.ProtecLogistique.setSearch(this.value)" placeholder="Rechercher du matériel..." class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pc-blue" />
            <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      <!-- DISPOSITION DOUBLE COLONNE : CATALOGUE PRODUITS + PANIER FLOTTANT -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        <!-- COLONNE GAUCHE (2/3) : GRILLE D'ARTICLES -->
        <div class="lg:col-span-2 space-y-3">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>${filteredItems.length} article(s) disponible(s)</span>
            <span>Tarifs HT subventionnés Sécurité Civile</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${filteredItems.map(item => {
              const currentStock = station?.stock?.[item.id] || 0;
              const inCartQty = this.cart[item.id] || 0;

              return `
                <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-pc-blue/60 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-2.5 group">
                  <div>
                    <!-- En-tête produit : Icône, Badge et Stock actuel -->
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div class="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl group-hover:scale-105 transition flex-shrink-0">
                        ${item.icon}
                      </div>
                      <div class="flex flex-col items-end gap-1">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black border ${item.badgeColor}">
                          ${item.badge}
                        </span>
                        <span class="text-[10px] text-slate-500 font-semibold">
                          En réserve : <strong class="text-slate-800 font-mono">${currentStock}</strong>
                        </span>
                      </div>
                    </div>

                    <!-- Titre & Description -->
                    <h5 class="text-xs font-black text-slate-900 leading-snug group-hover:text-pc-blue transition">${item.name}</h5>
                    <p class="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">${item.desc}</p>
                    
                    ${item.usage ? `
                      <p class="text-[10px] text-emerald-700 bg-emerald-50/70 border border-emerald-200/70 p-1.5 rounded-lg mt-2 font-medium">
                        💡 ${item.usage}
                      </p>
                    ` : ''}
                  </div>

                  <!-- Bas de carte : Prix et Bouton Panier -->
                  <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div class="text-xs font-black text-slate-900 font-mono">${item.price.toLocaleString('fr-FR')} €</div>
                      <span class="text-[9.5px] text-slate-400">par ${item.unit}</span>
                    </div>

                    <div class="flex items-center gap-1.5">
                      ${inCartQty > 0 ? `
                        <div class="flex items-center rounded-xl bg-slate-100 border border-slate-300 p-0.5">
                          <button onclick="window.ProtecLogistique.updateCartQty('${item.id}', ${inCartQty - 1})" class="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center transition">−</button>
                          <span class="w-7 text-center font-mono font-black text-xs text-pc-blue">${inCartQty}</span>
                          <button onclick="window.ProtecLogistique.updateCartQty('${item.id}', ${inCartQty + 1})" class="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center transition">+</button>
                        </div>
                      ` : `
                        <button onclick="window.ProtecLogistique.addToCart('${item.id}', 1)" class="px-3 py-1.5 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95">
                          <span>+</span>
                          <span>Panier</span>
                        </button>
                      `}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- COLONNE DROITE (1/3) : PANIER D'ACHATS FIXE & VALIDATION -->
        <div class="lg:col-span-1 p-4 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4 lg:sticky lg:top-4">
          
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🛒</span>
              <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-200">Mon Panier</h4>
                <span class="text-[10px] text-slate-400">Livraison à ${station?.name || 'l\'antenne'}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white font-mono">
              ${cartCount}
            </span>
          </div>

          <!-- Liste des articles dans le panier -->
          <div class="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            ${cartCount === 0 ? `
              <div class="py-8 text-center space-y-2 text-slate-400">
                <span class="text-3xl block opacity-60">🛍️</span>
                <p class="text-xs">Votre panier est vide.</p>
                <p class="text-[10.5px] text-slate-500">Ajoutez des lots, médicaments ou tenues depuis le catalogue.</p>
              </div>
            ` : Object.entries(this.cart).map(([id, qty]) => {
              const item = this.CATALOG.find(i => i.id === id);
              if (!item) return '';
              const lineTotal = item.price * qty;

              return `
                <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2 text-xs">
                  <div class="min-w-0 flex-1">
                    <div class="font-bold text-slate-200 truncate leading-tight">${item.name}</div>
                    <div class="text-[10px] text-slate-400 font-mono">${item.price} € × ${qty} = <strong class="text-emerald-400">${lineTotal.toLocaleString('fr-FR')} €</strong></div>
                  </div>

                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <div class="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                      <button onclick="window.ProtecLogistique.updateCartQty('${id}', ${qty - 1})" class="w-5 h-5 rounded text-slate-300 hover:text-white flex items-center justify-center font-black">−</button>
                      <span class="w-5 text-center font-mono font-bold text-[11px] text-white">${qty}</span>
                      <button onclick="window.ProtecLogistique.updateCartQty('${id}', ${qty + 1})" class="w-5 h-5 rounded text-slate-300 hover:text-white flex items-center justify-center font-black">+</button>
                    </div>
                    <button onclick="window.ProtecLogistique.removeFromCart('${id}')" class="text-slate-500 hover:text-rose-400 p-1 transition" title="Supprimer">
                      🗑️
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Total et Récapitulatif financier -->
          <div class="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div class="flex justify-between text-slate-400 text-[11px]">
              <span>Sous-total articles :</span>
              <span class="font-mono text-slate-200">${cartTotal.toLocaleString('fr-FR')} €</span>
            </div>
            <div class="flex justify-between text-slate-400 text-[11px]">
              <span>Livraison en caserne :</span>
              <span class="font-bold text-emerald-400">Gratuite (0 €)</span>
            </div>
            
            <div class="flex justify-between items-baseline pt-1 border-t border-slate-800 text-sm font-black">
              <span>Total Commande :</span>
              <span class="text-base text-emerald-400 font-mono">${cartTotal.toLocaleString('fr-FR')} €</span>
            </div>

            <div class="flex justify-between text-[10.5px] ${game.resources.money < cartTotal ? 'text-rose-400' : 'text-slate-400'}">
              <span>Trésorerie restante :</span>
              <span class="font-mono font-bold">${Math.max(0, game.resources.money - cartTotal).toLocaleString('fr-FR')} €</span>
            </div>
          </div>

          <!-- Bouton de paiement / validation -->
          <div class="space-y-2 pt-1">
            ${cartCount > 0 ? `
              <button onclick="window.ProtecLogistique.checkout(window.game)" class="w-full py-3 rounded-2xl ${game.resources.money >= cartTotal ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-lg cursor-pointer' : 'bg-slate-700 text-slate-400 cursor-not-allowed'} font-black text-xs transition flex items-center justify-center gap-2 active:scale-95" ${game.resources.money < cartTotal ? 'disabled' : ''}>
                <span>💳</span>
                <span>${game.resources.money >= cartTotal ? `Valider la Commande (${cartTotal.toLocaleString('fr-FR')} €)` : 'Trésorerie Insuffisante'}</span>
              </button>

              <button onclick="window.ProtecLogistique.clearCart()" class="w-full py-1.5 rounded-xl text-[10.5px] text-slate-400 hover:text-slate-200 transition">
                Vider le panier
              </button>
            ` : `
              <button disabled class="w-full py-3 rounded-2xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed text-center">
                Panier vide
              </button>
            `}
          </div>

        </div>

      </div>
    `;
  },

  // =========================================================================
  // 7. ONGLET STOCK DE L'ANTENNE (INVENTAIRE RÉEL)
  // =========================================================================

  renderStockHTML(game, station) {
    if (!station) {
      return `<p class="p-6 text-center text-xs text-slate-500">Aucune antenne disponible.</p>`;
    }

    const stock = station.stock || {};
    const stockEntries = Object.entries(stock).filter(([id, qty]) => qty > 0);

    let totalStockValue = 0;
    let totalItemsCount = 0;

    stockEntries.forEach(([id, qty]) => {
      const item = this.CATALOG.find(i => i.id === id);
      if (item) {
        totalStockValue += item.price * qty;
        totalItemsCount += qty;
      }
    });

    return `
      <!-- CARTE RÉCAPITULATIVE DE L'INVENTAIRE DE L'ANTENNE -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div class="flex items-center justify-between text-xs font-black text-slate-500">
            <span>Articles en Réserve</span>
            <span class="text-base">📦</span>
          </div>
          <div class="text-2xl font-black text-slate-900 font-mono">${totalItemsCount}</div>
          <p class="text-[10.5px] text-slate-500">${stockEntries.length} références différentes</p>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div class="flex items-center justify-between text-xs font-black text-slate-500">
            <span>Valeur Marchande du Stock</span>
            <span class="text-base">💶</span>
          </div>
          <div class="text-2xl font-black text-pc-blue font-mono">${totalStockValue.toLocaleString('fr-FR')} €</div>
          <p class="text-[10.5px] text-slate-500">Actifs matériels de la caserne</p>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div class="flex items-center justify-between text-xs font-black text-slate-500">
            <span>Localisation du Stock</span>
            <span class="text-base">🏛️</span>
          </div>
          <div class="text-sm font-black text-slate-900 truncate">${station.name}</div>
          <button onclick="window.ProtecLogistique.setTab('boutique')" class="text-[11px] font-black text-pc-blue hover:underline">
            + Commander du réassort →
          </button>
        </div>
      </div>

      <!-- LISTE DES ARTICLES EN STOCK -->
      <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider">Inventaire Détaillé de la Réserve</h4>
          <span class="text-[11px] text-slate-500 font-medium">Mis à jour automatiquement après chaque intervention</span>
        </div>

        ${stockEntries.length === 0 ? `
          <div class="py-12 text-center space-y-2 text-slate-400">
            <span class="text-4xl block opacity-60">📦</span>
            <p class="text-xs font-bold text-slate-600">Aucun matériel entreposé dans cette antenne.</p>
            <p class="text-[11px] text-slate-500">Visitez la centrale d’achats pour équiper votre réserve en lots et médicaments.</p>
            <button onclick="window.ProtecLogistique.setTab('boutique')" class="mt-2 px-4 py-2 rounded-xl bg-pc-blue text-white text-xs font-black shadow transition">
              Ouvrir la Boutique en Ligne
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${stockEntries.map(([id, qty]) => {
              const item = this.CATALOG.find(i => i.id === id);
              if (!item) return '';

              return `
                <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
                      ${item.icon}
                    </div>
                    <div>
                      <h5 class="text-xs font-black text-slate-900 leading-snug">${item.name}</h5>
                      <span class="text-[10px] text-slate-500 font-semibold block">${item.badge}</span>
                      <span class="text-[10px] text-slate-400 font-mono mt-0.5 block">Valeur unitaire : ${item.price} €</span>
                    </div>
                  </div>

                  <div class="flex flex-col items-end gap-1 flex-shrink-0">
                    <span class="px-2.5 py-1 rounded-xl bg-blue-100/80 text-pc-blue border border-blue-200 font-mono font-black text-xs">
                      ${qty} ${item.unit || 'unités'}
                    </span>
                    <button onclick="window.ProtecLogistique.addToCart('${item.id}', 1)" class="text-[10px] font-bold text-pc-blue hover:underline">
                      + Racheter
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  // =========================================================================
  // 8. ONGLET FLOTTE & GARAGE (MAINTENANCE, CARBURANT, DÉSINFECTION)
  // =========================================================================

  renderFlotteHTML(game, station) {
    const stationVehicles = (game.vehicles || []).filter(v => v.stationId === station?.id);

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Véhicules rattachés à ${station?.name || 'l\'antenne'} (${stationVehicles.length})</span>
          <span class="text-[11px] text-slate-500">Désinfection et réarmement après transport sanitaire</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${stationVehicles.length === 0 ? `
            <div class="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl md:col-span-2">
              Aucun véhicule rattaché à cette caserne. Utilisez le module Flotte pour acheter ou affecter un VPSP.
            </div>
          ` : stationVehicles.map(v => {
            const fuel = v.fuel !== undefined ? v.fuel : 90;
            const mech = v.mechanical !== undefined ? v.mechanical : 95;

            return `
              <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-10 bg-slate-100 rounded-xl p-1 flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-inner">
                      <img src="${v.image || (game.getVehicleImage ? game.getVehicleImage(v.type) : `images/vehicles/${v.type}.png`)}" alt="${v.name}" class="max-h-full max-w-full object-contain" onerror="this.outerHTML='<span class=\\'text-xl\\'>🚑</span>'" />
                    </div>
                    <div>
                      <h5 class="text-xs font-black text-slate-900 leading-tight">${v.name}</h5>
                      <span class="text-[10px] text-slate-500 font-semibold">${v.label || v.type}</span>
                    </div>
                  </div>
                  
                  <span class="px-2 py-0.5 rounded text-[10px] font-black border ${v.status === 'dispo' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}">
                    ${v.status === 'dispo' ? 'DISPONIBLE' : 'ENGAGÉ'}
                  </span>
                </div>

                <!-- Jauges Carburant & Mécanique -->
                <div class="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div class="flex justify-between text-[11px] mb-1">
                      <span class="text-slate-500">Carburant</span>
                      <strong class="font-mono text-slate-700">${fuel}%</strong>
                    </div>
                    <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div class="bg-emerald-500 h-full rounded-full" style="width: ${fuel}%"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-[11px] mb-1">
                      <span class="text-slate-500">Mécanique</span>
                      <strong class="font-mono ${mech < 50 ? 'text-red-600' : 'text-slate-700'}">${mech}%</strong>
                    </div>
                    <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div class="${mech < 50 ? 'bg-red-500' : 'bg-pc-blue'} h-full rounded-full" style="width: ${mech}%"></div>
                    </div>
                  </div>
                </div>

                <!-- Actions directes de garage -->
                <div class="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'rearm')" class="py-1.5 rounded-xl text-[10.5px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                    Réarmer (30 €)
                  </button>
                  <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'fuel')" class="py-1.5 rounded-xl text-[10.5px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                    Plein (75 €)
                  </button>
                  <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'disinfection_trimestrielle')" class="py-1.5 rounded-xl text-[10.5px] font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 transition" title="Désinfection approfondie agréée ARS">
                    Désinfecter (60 €)
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};
