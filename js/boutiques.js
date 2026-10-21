/**
 * PROTEC LIVE - MODULE BOUTIQUES & GALERIES MARCHANDES DE LA SÉCURITÉ CIVILE
 * 
 * Permet au joueur de faire ses courses d'un magasin à un autre :
 * 1. 🏛️ Coopérative Fédérale FNPC (La boutique associative officielle, tenues, caisses réassort, lots secours, port 100% offert)
 * 2. 📻 HexaCom & OndePro Télécoms (Spécialiste radios Analogiques, LTE 4G/5G, Hybrides tactiques et packs dégressifs)
 * 3. 🛠️ Securicom Crise & Sauvetage (Matériel technique lourd : motopompes, tronçonnage, bâchage, groupes électrogènes, drones)
 * 4. 🚑 Concessionnaire Flotte Secours (Véhicules neufs VPSP, VTU, VL, TRM, PL, Bateaux, Quads, Motos)
 * 5. 🤝 Pôle Social, Ravitaillement & Hébergement (Lits picots, duvets, kits CAI soutien psychologique, ravitaillement)
 * 6. ⚡ DispoSecours Déstockage Éclair (Livraison ultra-rapide par coursier dédié en 35 secondes)
 */

window.ProtecBoutiques = {
  activeShopId: 'centrale_federale',
  activeRayonId: 'all',
  selectedStationId: null,
  cart: {}, // { [itemId]: { qty, shopId, itemData } }
  searchQuery: '',
  selectedKitMannequin: {}, // { [kitId]: 'standard' | 'clicker' | 'qcpr' }

  setKitMannequin(itemId, variantId) {
    if (!this.selectedKitMannequin) this.selectedKitMannequin = {};
    this.selectedKitMannequin[itemId] = variantId;
    this.renderModal(window.game);
  },

  // =========================================================================
  // 1. DÉFINITION DES MAGASINS SPÉCIALISÉS (GALERIES MARCHANDES)
  // =========================================================================
  SHOPS: [
    {
      id: 'centrale_federale',
      name: 'Coopérative Fédérale FNPC',
      shortName: 'Centrale Fédérale',
      slogan: 'La boutique officielle du réseau associatif de Sécurité Civile',
      badge: 'Groupage Réseau • Port Gratuit',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
      icon: 'landmark',
      bannerGradient: 'from-blue-900 via-indigo-950 to-slate-900',
      accentColor: 'text-blue-400',
      deliveryDelaySec: 259200,
      delayLabel: '72h (Tournée Fédérale)',
      shippingCost: 0,
      freeThreshold: 0,
      freeShippingAlways: true,
      priceMultiplier: 1.0,
      specialty: 'Livraison 100% GRATUITE garantie sur toutes les commandes',
      desc: 'Boutique officielle : tenues, kits de réarmement, lots de secours et matériel pédagogique.',
      rayons: [
        { id: 'all', label: 'Tous les rayons', icon: 'layout-grid' },
        { id: 'tenues', label: 'Tenues & Équipements EPI', icon: 'shield' },
        { id: 'pharmacie', label: 'Réarmement & Consommables', icon: 'archive' },
        { id: 'lots_secours', label: 'Lots de Secours (A, B, C)', icon: 'briefcase' },
        { id: 'formations', label: 'Kits Pédagogiques Formations', icon: 'graduation-cap' }
      ]
    },
    {
      id: 'hexacom_telecoms',
      name: 'HexaCom & OndePro Télécoms',
      shortName: 'HexaCom Télécoms',
      slogan: 'Radios professionnelles, réseaux LTE et stations de charge',
      badge: 'Transmissions',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300',
      icon: 'radio',
      bannerGradient: 'from-indigo-950 via-slate-900 to-indigo-900',
      accentColor: 'text-indigo-400',
      deliveryDelaySec: 172800,
      delayLabel: '48h (Messagerie Standard)',
      shippingCost: 18,
      freeThreshold: 500,
      freeShippingAlways: false,
      priceMultiplier: 1.0,
      specialty: 'Terminaux certifiés IP68, réseaux LTE 4G/5G et packs dégressifs jusqu’à -22%',
      desc: 'Équipements radio analogiques, LTE et hybrides pour la communication des équipes.',
      rayons: [
        { id: 'all', label: 'Toutes les transmissions', icon: 'layout-grid' },
        { id: 'telephonie', label: 'Téléphonie de Service (Garde & DPS)', icon: 'smartphone' },
        { id: 'analogique', label: 'Postes Analogiques VHF/UHF', icon: 'radio' },
        { id: 'lte', label: 'Réseaux Numériques LTE (4G/5G)', icon: 'smartphone' },
        { id: 'hybride', label: 'Terminaux Hybrides Bi-Mode', icon: 'shield-alert' },
        { id: 'chargeurs', label: 'Stations de Charge & Valises', icon: 'battery-charging' }
      ]
    },
    {
      id: 'securicom_crise',
      name: 'Securicom Matériel & Crise',
      shortName: 'Securicom Sauvetage',
      slogan: 'Pompage, tronçonnage, éclairage, bâchage et drones',
      badge: 'Matériel de Crise',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
      icon: 'wrench',
      bannerGradient: 'from-amber-950 via-slate-900 to-orange-950',
      accentColor: 'text-amber-400',
      deliveryDelaySec: 86400,
      delayLabel: '24h (Express J+1)',
      shippingCost: 28,
      freeThreshold: 800,
      freeShippingAlways: false,
      priceMultiplier: 0.98,
      specialty: 'Matériel robuste pour catastrophes naturelles, crues et tempêtes',
      desc: 'Équipements techniques lourds pour inondations, tempêtes et catastrophes.',
      rayons: [
        { id: 'all', label: 'Tout le matériel', icon: 'layout-grid' },
        { id: 'pompage', label: 'Épuisement & Pompage', icon: 'waves' },
        { id: 'tronconnage', label: 'Tronçonnage & Bâchage', icon: 'axe' },
        { id: 'eclairage', label: 'Énergie & Éclairage', icon: 'zap' },
        { id: 'drones', label: 'Drones & Reconnaissance', icon: 'crosshair' },
        { id: 'sauvetage', label: 'Sauvetage Décombres & USAR', icon: 'hard-hat' },
        { id: 'pcm', label: 'Poste de Commandement (PCM)', icon: 'radio' }
      ]
    },
    {
      id: 'concessionnaire_flotte',
      name: 'Concessionnaire Flotte Secours',
      shortName: 'Concessionnaire Véhicules',
      slogan: 'Véhicules neufs livrés directement au garage de votre antenne',
      badge: 'Dotation Immédiate',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
      icon: 'truck',
      bannerGradient: 'from-emerald-950 via-slate-900 to-teal-950',
      accentColor: 'text-emerald-400',
      deliveryDelaySec: 0,
      delayLabel: 'Dotation Immédiate au Garage',
      shippingCost: 0,
      freeThreshold: 0,
      freeShippingAlways: true,
      priceMultiplier: 1.0,
      specialty: 'Affectation directe au hangar avec immatriculation officielle et indicatif radio',
      desc: 'Ambulances VPSP, fourgons, minibus et 4x4 neufs prêts pour le départ en intervention.',
      rayons: [
        { id: 'all', label: 'Toute la flotte', icon: 'layout-grid' }
      ]
    },
    {
      id: 'social_humanitaire',
      name: 'Action Sociale & Hébergement',
      shortName: 'Social & Hébergement',
      slogan: 'Lits de camp, ravitaillement et accueil d’urgence des sinistrés',
      badge: 'Action Humanitaire',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
      icon: 'heart-handshake',
      bannerGradient: 'from-purple-950 via-slate-900 to-rose-950',
      accentColor: 'text-purple-400',
      deliveryDelaySec: 172800,
      delayLabel: '48h (Acheminement Standard)',
      shippingCost: 15,
      freeThreshold: 450,
      freeShippingAlways: false,
      priceMultiplier: 0.95,
      specialty: 'Packs hébergement complets et modules d’accueil des impliqués (CAI)',
      desc: 'Matériel humanitaire pour ouvrir des centres d’hébergement et secourir les populations.',
      rayons: [
        { id: 'all', label: 'Tout le rayon social', icon: 'layout-grid' },
        { id: 'hebergement', label: 'Lits Picots & Hébergement', icon: 'bed-double' },
        { id: 'ravitaillement', label: 'Ravitaillement Sinistrés', icon: 'coffee' },
        { id: 'psycho', label: 'Soutien Psycho CAI', icon: 'heart' }
      ]
    },
    {
      id: 'disposecours_eclair',
      name: 'DispoSecours Express',
      shortName: 'DispoSecours Express',
      slogan: 'Livraison prioritaire en 24h par transporteur express',
      badge: 'Express 24h',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300 animate-pulse',
      icon: 'clock',
      bannerGradient: 'from-rose-950 via-slate-900 to-red-950',
      accentColor: 'text-rose-400',
      deliveryDelaySec: 86400,
      delayLabel: '24h (Coursier Express)',
      shippingCost: 45,
      freeThreshold: 999999,
      freeShippingAlways: false,
      priceMultiplier: 1.10,
      specialty: 'Livraison express prioritaire en 24h partout en France',
      desc: 'Livraison express pour réarmer vos véhicules avant un départ immédiat en intervention.',
      rayons: [
        { id: 'all', label: 'Dépannage Express', icon: 'layout-grid' }
      ]
    }
  ],

  // =========================================================================
  // 2. MÉTHODES DE NAVIGATION DANS LE CENTRE COMMERCIAL
  // =========================================================================

  getActiveShop() {
    return this.SHOPS.find(s => s.id === this.activeShopId) || this.SHOPS[0];
  },

  setShop(shopId) {
    this.activeShopId = shopId;
    this.activeRayonId = 'all';
    this.searchQuery = '';
    this.renderModal(window.game);
  },

  openShop(shopId, stationId = null) {
    if (stationId) {
      this.selectedStationId = stationId;
      if (window.game) window.game.selectedStationId = stationId;
    }
    if (shopId) {
      this.activeShopId = shopId;
    }
    this.activeRayonId = 'all';
    this.searchQuery = '';
    if (window.game) {
      window.game.openModule('boutiques');
    } else {
      this.renderModal(window.game);
    }
  },

  nextShop() {
    const curIdx = this.SHOPS.findIndex(s => s.id === this.activeShopId);
    const nextIdx = (curIdx + 1) % this.SHOPS.length;
    this.setShop(this.SHOPS[nextIdx].id);
  },

  prevShop() {
    const curIdx = this.SHOPS.findIndex(s => s.id === this.activeShopId);
    const prevIdx = (curIdx - 1 + this.SHOPS.length) % this.SHOPS.length;
    this.setShop(this.SHOPS[prevIdx].id);
  },

  setRayon(rayonId) {
    this.activeRayonId = rayonId;
    this.renderModal(window.game);
  },

  setSearch(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.renderModal(window.game);
  },

  setStation(stationId) {
    this.selectedStationId = stationId;
    if (window.game) {
      window.game.selectedStationId = stationId;
    }
    this.renderModal(window.game);
  },

  getActiveStation(game) {
    if (!game || !game.stations || game.stations.length === 0) return null;
    if (this.selectedStationId) {
      const found = game.stations.find(s => s.id === this.selectedStationId);
      if (found) return found;
    }
    const def = game.stations.find(s => s.id === game.selectedStationId) || game.stations[0];
    this.selectedStationId = def.id;
    return def;
  },

  // =========================================================================
  // 3. GESTION DU PANIER MULTI-MAGASINS
  // =========================================================================

  addToCart(itemId, qty = 1, customData = null) {
    if (customData?.isVehicle || itemId?.startsWith('veh_new_')) {
      if (window.game) {
        window.game.showToast('Showroom Véhicules', 'Les véhicules sont commandés directement via le showroom pour une dotation immédiate au hangar de l\'antenne.', 'blue');
      }
      return;
    }

    const cur = this.cart[itemId] || { qty: 0 };
    cur.qty += qty;
    cur.shopId = customData?.shopId || this.activeShopId;
    if (customData) {
      cur.customData = customData;
    }
    if (cur.qty <= 0) {
      delete this.cart[itemId];
    } else {
      this.cart[itemId] = cur;
    }

    this.renderModal(window.game);
    if (window.game) {
      const name = customData?.name || itemId;
      window.game.showToast('Ajouté au Panier', `+${qty} dans votre panier de courses.`, 'blue');
    }
  },

  updateCartQty(itemId, newQty) {
    if (newQty <= 0) {
      delete this.cart[itemId];
    } else if (this.cart[itemId]) {
      this.cart[itemId].qty = newQty;
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
      window.game.showToast('Panier vidé', 'Tous vos articles de courses ont été retirés.', 'slate');
    }
  },

  getCartSummary() {
    let subtotal = 0;
    let itemsCount = 0;
    const items = [];

    // Assainissement : ignorer d'éventuels résidus d'articles véhicules
    Object.keys(this.cart).forEach(id => {
      if (id.startsWith('veh_new_') || this.cart[id]?.customData?.isVehicle) {
        delete this.cart[id];
      }
    });

    Object.entries(this.cart).forEach(([itemId, entry]) => {
      const qty = entry.qty;
      let price = 0;
      let name = itemId;
      let unit = 'unité';
      let icon = 'package';
      let image = null;

      if (entry.customData) {
        price = entry.customData.price || 0;
        name = entry.customData.name || itemId;
        unit = entry.customData.unit || 'unité';
        icon = entry.customData.icon || 'package';
        image = entry.customData.image || null;
      } else {
        const catItem = window.ProtecLogistique?.CATALOG?.find(i => i.id === itemId);
        if (catItem) {
          price = catItem.price;
          name = catItem.name;
          unit = catItem.unit || 'unité';
          icon = catItem.lucideIcon || 'package';
          image = catItem.image;
        }
      }

      const lineTotal = price * qty;
      subtotal += lineTotal;
      itemsCount += qty;

      items.push({
        id: itemId,
        name,
        qty,
        price,
        lineTotal,
        unit,
        icon,
        image,
        shopId: entry.shopId,
        customData: entry.customData
      });
    });

    const activeShop = this.getActiveShop();
    const shippingFee = (subtotal > 0 && !activeShop.freeShippingAlways && subtotal < activeShop.freeThreshold)
      ? activeShop.shippingCost
      : 0;

    const grandTotal = subtotal + shippingFee;

    return {
      subtotal,
      shippingFee,
      grandTotal,
      itemsCount,
      items,
      shop: activeShop
    };
  },

  checkout(game) {
    if (!game) game = window.game;
    if (!game) return;

    const summary = this.getCartSummary();
    if (summary.itemsCount === 0) {
      game.showToast('Panier vide', 'Ajoutez des articles dans vos boutiques avant de valider votre commande.', 'orange');
      return;
    }

    if (game.resources.money < summary.grandTotal) {
      game.showToast('Trésorerie insuffisante', `Il vous manque ${(summary.grandTotal - game.resources.money).toLocaleString('fr-FR')} € pour régler vos achats.`, 'red');
      return;
    }

    const station = this.getActiveStation(game);
    if (!station) {
      game.showToast('Aucune antenne', 'Veuillez sélectionner une antenne de destination.', 'orange');
      return;
    }

    if (window.ProtecLogistique) {
      window.ProtecLogistique.ensureStationStock(station, game);
    }

    // Débit immédiat
    game.resources.money -= summary.grandTotal;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -summary.grandTotal,
        `Achats en Boutiques : ${summary.itemsCount} articles (${summary.shop.shortName})`,
        'logistique',
        `SHOP-${Date.now()}`,
        summary.shop.name
      );
    }

    // Création de l'expédition
    if (!Array.isArray(game.deliveries)) game.deliveries = [];
    const durationSec = summary.shop.deliveryDelaySec;

    const itemsMap = {};
    const orderedItemsSummary = [];

    summary.items.forEach(it => {
      itemsMap[it.id] = it.qty;
      orderedItemsSummary.push({
        id: it.id,
        name: it.name,
        qty: it.qty,
        price: it.price,
        total: it.lineTotal,
        image: it.image,
        lucideIcon: it.icon,
        radioTech: it.customData?.radioTech,
        radioCount: it.customData?.radioCount,
        mannequinVariant: it.customData?.mannequinVariant
      });
    });

    const delivery = {
      id: `deliv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderNumber: `GAL-${Date.now().toString(36).toUpperCase()}`,
      createdAt: Date.now(),
      durationSeconds: durationSec,
      etaTimestamp: Date.now() + (durationSec * 1000),
      stationId: station.id,
      stationName: station.name,
      stationCity: station.city,
      items: itemsMap,
      itemsSummary: orderedItemsSummary,
      subtotal: summary.subtotal,
      shippingFee: summary.shippingFee,
      totalCost: summary.grandTotal,
      supplierId: summary.shop.id,
      supplierName: summary.shop.name,
      carrier: `${summary.shop.name} (${summary.shop.delayLabel})`,
      status: 'in_transit'
    };

    game.deliveries.unshift(delivery);

    // Vider le panier
    this.cart = {};

    game.updateStatsUI();
    game.saveGame();

    const minStr = Math.ceil(durationSec / 60);
    game.showToast(
      '🛍️ Courses Validées & Expédiées !',
      `Vos achats chez « ${summary.shop.shortName} » sont en route pour ${station.name}. Arrivée estimée dans ${summary.shop.delayLabel}.`,
      'green'
    );

    // Si le module logistique est ouvert ou disponible, on bascule vers livraisons
    if (window.ProtecLogistique) {
      window.ProtecLogistique.activeTab = 'livraisons';
    }
    this.renderModal(game);
  },

  // =========================================================================
  // 4. RÉCUPÉRATION DES PRODUITS POUR CHAQUE BOUTIQUE
  // =========================================================================

  getProductsForActiveShop() {
    const shop = this.getActiveShop();
    const rayon = this.activeRayonId;
    const query = this.searchQuery;
    let list = [];

    if (shop.id === 'centrale_federale') {
      // 1. Coopérative Fédérale : Tenues, Consommables réassort, Lots A/B/C, Formations
      const cat = window.ProtecLogistique?.CATALOG || [];
      list = cat.filter(it => {
        if (['caisse_rearmement', 'lot_secours_a', 'lot_secours_b', 'lot_secours_c', 'tenue_pc', 'tenue_moto', 'tenue_usar', 'rangers1', 'rangers2', 'rangers3', 'rangers_secours'].includes(it.id)) return true;
        if (it.category === 'kits_formation') return true;
        return false;
      }).map(it => ({ ...it, shopId: shop.id }));

      if (rayon === 'tenues') list = list.filter(it => ['tenue_pc', 'tenue_moto', 'tenue_usar', 'rangers1', 'rangers2', 'rangers3', 'rangers_secours'].includes(it.id));
      else if (rayon === 'pharmacie') list = list.filter(it => it.id === 'caisse_rearmement');
      else if (rayon === 'lots_secours') list = list.filter(it => ['lot_secours_a', 'lot_secours_b', 'lot_secours_c'].includes(it.id));
      else if (rayon === 'formations') list = list.filter(it => it.category === 'kits_formation');

    } else if (shop.id === 'hexacom_telecoms') {
      // 2. HexaCom Télécoms : Radios Analogiques, LTE, Hybrides, Packs dégressifs
      const techList = ['analogique', 'lte', 'hybride'];
      const packs = window.ProtecLogistique?.RADIO_PACKS || [
        { id: 'unit', name: 'Portatif Individuel', count: 1, discountPct: 0, packaging: 'Boîte unitaire', contents: '1 radio + chargeur' },
        { id: 'binome', name: 'Pack Binôme', count: 2, discountPct: 5, packaging: 'Pack duo', contents: '2 radios + 2 oreillettes' },
        { id: 'escouade', name: 'Pack Escouade', count: 4, discountPct: 10, packaging: 'Pack 4', contents: '4 radios + chargeur 4 postes' },
        { id: 'valise', name: 'Valise Tactique Section', count: 10, discountPct: 15, packaging: 'Valise Peli-Case', contents: '10 radios + baie chargeur' },
        { id: 'malle', name: 'Malle Régimentaire', count: 20, discountPct: 22, packaging: 'Malle régiment', contents: '20 radios + 2 baies chargeur' }
      ];

      techList.forEach(tKey => {
        const tObj = window.ProtecLogistique?.RADIO_TECH?.[tKey] || { unitPrice: 100, name: tKey, shortName: tKey };
        packs.forEach(p => {
          const rawPrice = Math.round(tObj.unitPrice * p.count * (1 - p.discountPct / 100));
          const finalPrice = Math.round(rawPrice * shop.priceMultiplier);
          const itemId = `pack_radio_${tKey}_${p.id}`;

          list.push({
            id: itemId,
            shopId: shop.id,
            category: tKey,
            name: `${p.name} • ${tObj.shortName}`,
            price: finalPrice,
            unit: p.packaging,
            badge: `${p.count} Poste${p.count > 1 ? 's' : ''} ${p.discountPct > 0 ? `(-${p.discountPct}%)` : ''}`,
            badgeColor: tObj.badgeColor || 'bg-indigo-100 text-indigo-900 border-indigo-300',
            image: tObj.image || 'images/equipements/thumbs/radio_antares.png',
            lucideIcon: tObj.icon || 'radio',
            desc: `${p.contents}. ${tObj.desc}`,
            usage: `+${p.count} radios ${tObj.shortName} au stock d’antenne.`,
            radioTech: tKey,
            radioCount: p.count
          });
        });
      });

      // Téléphones de service (Garde, DPS et Astreinte)
      const phonePacks = [
        { id: 'unit', name: 'Téléphone de service (Unité)', count: 1, discountPct: 0, packaging: 'Boîte unitaire', desc: 'Smartphone durci pour secouriste en garde ou DPS.' },
        { id: 'binome', name: 'Pack Binôme (2 Téléphones)', count: 2, discountPct: 5, packaging: 'Pack duo', desc: '2 smartphones de service pour équiper un binôme complet en mission.' },
        { id: 'section', name: 'Pack Section DPS (5 Téléphones)', count: 5, discountPct: 10, packaging: 'Mallette 5 unités', desc: '5 smartphones de service pour doter les chefs de poste et équipiers de DPS.' },
        { id: 'flotte', name: 'Flotte Antenne (10 Téléphones)', count: 10, discountPct: 15, packaging: 'Malle 10 unités', desc: '10 smartphones de service pour couvrir toutes les gardes et missions de l\'antenne.' }
      ];
      const basePhonePrice = 190;
      phonePacks.forEach(p => {
        const rawPrice = Math.round(basePhonePrice * p.count * (1 - p.discountPct / 100));
        const finalPrice = Math.round(rawPrice * shop.priceMultiplier);
        list.push({
          id: p.id === 'unit' ? 'telephone_garde' : `pack_phone_${p.id}`,
          shopId: shop.id,
          category: 'telephonie',
          name: p.name,
          price: finalPrice,
          unit: p.packaging,
          badge: `${p.count} Téléphone${p.count > 1 ? 's' : ''} ${p.discountPct > 0 ? `(-${p.discountPct}%)` : ''}`,
          badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
          image: 'images/equipements/telephone_garde.png',
          lucideIcon: 'smartphone',
          desc: p.desc,
          usage: `+${p.count} téléphone(s) de service au stock. Préserve vie privée et forfaits perso (+8 moral).`,
          phoneCount: p.count
        });
      });

      // Chargeur multiple standalone
      const chargeurItem = window.ProtecLogistique?.CATALOG?.find(i => i.id === 'chargeur_radios');
      if (chargeurItem) {
        list.push({ ...chargeurItem, category: 'chargeurs', shopId: shop.id });
      }

      if (rayon && rayon !== 'all') {
        list = list.filter(it => it.category === rayon);
      }

    } else if (shop.id === 'securicom_crise') {
      // 3. Securicom Crise : Pompage, tronçonnage, bâchage, éclairage, drones, PCM, Tenue USAR
      const targetIds = [
        'lot_pompage', 'remorque_motopompe', 'lot_tronconnage', 'lot_bachage',
        'lot_eclairage', 'remorque_groupe_electro', 'drone', 'drone_thermique',
        'lot_poste_commandement_mobile', 'tenue_usar'
      ];
      const cat = window.ProtecLogistique?.CATALOG || [];
      list = cat.filter(it => targetIds.includes(it.id)).map(it => {
        let rayonTag = 'autres';
        if (it.id.includes('pompage')) rayonTag = 'pompage';
        else if (it.id.includes('tronconnage') || it.id.includes('bachage')) rayonTag = 'tronconnage';
        else if (it.id.includes('eclairage') || it.id.includes('electro')) rayonTag = 'eclairage';
        else if (it.id.includes('drone')) rayonTag = 'drones';
        else if (it.id.includes('poste_commandement')) rayonTag = 'pcm';
        else if (it.id.includes('usar')) rayonTag = 'sauvetage';
        return {
          ...it,
          shopId: shop.id,
          rayonTag,
          price: Math.round(it.price * shop.priceMultiplier)
        };
      });

      if (rayon && rayon !== 'all') {
        list = list.filter(it => it.rayonTag === rayon);
      }

    } else if (shop.id === 'concessionnaire_flotte') {
      // 4. Concessionnaire Flotte : Showroom officiel des véhicules opérationnels
      const chassisList = window.ProtecAdvanced?.chassisModels || [];
      const catalog = window.ProtecAdvanced?.vehicleCatalog || [];
      let totalCount = 0;
      chassisList.forEach(c => {
        totalCount += (c.variants || []).length;
      });
      totalCount += catalog.length;
      list = new Array(totalCount > 0 ? totalCount : 22).fill({ shopId: shop.id });

    } else if (shop.id === 'social_humanitaire') {
      // 5. Social & Hébergement : Lits picots, ravitaillement, soutien psycho
      const targetIds = ['lot_hebergement', 'lot_ravitaillement', 'lot_soutien_psy'];
      const cat = window.ProtecLogistique?.CATALOG || [];
      list = cat.filter(it => targetIds.includes(it.id)).map(it => {
        let rayonTag = 'hebergement';
        if (it.id === 'lot_ravitaillement') rayonTag = 'ravitaillement';
        else if (it.id === 'lot_soutien_psy') rayonTag = 'psycho';
        return {
          ...it,
          shopId: shop.id,
          rayonTag,
          price: Math.round(it.price * shop.priceMultiplier)
        };
      });

      if (rayon && rayon !== 'all') {
        list = list.filter(it => it.rayonTag === rayon);
      }

    } else if (shop.id === 'disposecours_eclair') {
      // 6. DispoSecours Éclair : Dépannage express
      const targetIds = ['caisse_rearmement', 'lot_secours_b', 'lot_bachage', 'chargeur_radios'];
      const cat = window.ProtecLogistique?.CATALOG || [];
      list = cat.filter(it => targetIds.includes(it.id)).map(it => ({
        ...it,
        shopId: shop.id,
        price: Math.round(it.price * shop.priceMultiplier),
        badge: '⚡ Express 35s',
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
      }));
    }

    // Filtrage recherche
    if (query) {
      list = list.filter(it => 
        (it.name || '').toLowerCase().includes(query) ||
        (it.desc || '').toLowerCase().includes(query) ||
        (it.badge || '').toLowerCase().includes(query)
      );
    }

    return list;
  },

  // =========================================================================
  // 5. RENDU PRINCIPAL DU CENTRE COMMERCIAL (HTML MODALE)
  // =========================================================================

  renderModal(game) {
    if (!game) game = window.game;
    if (!game) return;

    const body = document.getElementById('modal-body');
    if (!body) return;

    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (title) title.textContent = 'Galeries Marchandes & Boutiques de Sécurité Civile';
    if (subtitle) subtitle.textContent = 'Visitez les différents magasins spécialisés, comparez les prix et faites vos courses';
    if (icon) icon.setAttribute('data-lucide', 'shopping-bag');

    const station = this.getActiveStation(game);
    const shop = this.getActiveShop();
    const products = this.getProductsForActiveShop();
    const cartSummary = this.getCartSummary();

    const isConcessionnaire = (shop.id === 'concessionnaire_flotte');
    const maxGarageSlots = window.ProtecLocaux?.getGarageCapacity?.(game, station?.id)
      || window.ProtecAdvanced?.getGarageCapacity?.(game, station?.id)
      || 2;
    const stationVehicles = (game.vehicles || []).filter(v => v && (v.stationId === station?.id || (Array.isArray(station?.vehicles) && station.vehicles.includes(v.id))));
    const inDeliveryVehicles = (game.deliveries || []).filter(d => d.status === 'in_transit' && d.type === 'vehicle' && d.stationId === station?.id);
    const usedGarageSlots = stationVehicles.length + inDeliveryVehicles.length;
    const isGarageFull = usedGarageSlots >= maxGarageSlots;
    const freeSlots = Math.max(0, maxGarageSlots - usedGarageSlots);

    body.innerHTML = `
      <div class="space-y-4">

        <!-- 1. BARRE SUPÉRIEURE : SÉLECTEUR D'ANTENNE DESTINATAIRE & TRÉSORERIE -->
        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <i data-lucide="building-2" class="w-4 h-4 text-pc-blue flex-shrink-0"></i>
              <span>Antenne Destinataire des Achats :</span>
            </span>
            <select onchange="window.ProtecBoutiques.setStation(this.value)" class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-black text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-pc-blue">
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

          <!-- Raccourci vers le suivi des livraisons en cours -->
          <div class="flex items-center gap-2 self-start md:self-auto">
            <button onclick="window.game.openModule('logistique'); if(window.ProtecLogistique) window.ProtecLogistique.setTab('livraisons');" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <i data-lucide="truck" class="w-3.5 h-3.5 text-pc-blue"></i>
              <span>Suivi des Livraisons</span>
              ${(game.deliveries || []).filter(d => d.status === 'in_transit').length > 0 ? `
                <span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white animate-pulse">
                  ${(game.deliveries || []).filter(d => d.status === 'in_transit').length}
                </span>
              ` : ''}
            </button>
          </div>
        </div>

        <!-- 2. DEVANTURE DES MAGASINS : NAVIGATEUR DU CENTRE COMMERCIAL -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 px-1">
            <span class="flex items-center gap-1.5">
              <span>🛍️</span>
              <span>Aller d’un magasin à un autre pour faire vos courses :</span>
            </span>
            <div class="flex items-center gap-1">
              <button onclick="window.ProtecBoutiques.prevShop()" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1" title="Magasin précédent">
                <span>◀ Précédent</span>
              </button>
              <button onclick="window.ProtecBoutiques.nextShop()" class="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10.5px] font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1" title="Magasin suivant">
                <span>Suivant ▶</span>
              </button>
            </div>
          </div>

          <!-- Grille des enseignes / boutiques disponibles -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            ${this.SHOPS.map(s => {
              const isSelected = (s.id === shop.id);
              return `
                <div onclick="window.ProtecBoutiques.setShop('${s.id}')" class="p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${isSelected ? 'bg-gradient-to-b from-indigo-50 to-white border-pc-blue shadow-md ring-2 ring-pc-blue/30 dark:from-slate-900 dark:to-indigo-950/60 dark:border-indigo-400' : 'bg-white hover:bg-slate-50 border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850 shadow-2xs'}">
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <div class="w-8 h-8 rounded-xl ${isSelected ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'} flex items-center justify-center font-black">
                        <i data-lucide="${s.icon}" class="w-4 h-4"></i>
                      </div>
                      ${isSelected ? '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>' : ''}
                    </div>
                    <h5 class="text-xs font-black text-slate-900 dark:text-white leading-tight line-clamp-1">${s.shortName}</h5>
                    <p class="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">${s.badge}</p>
                  </div>

                  <div class="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                    <i data-lucide="clock" class="w-2.5 h-2.5 text-slate-400"></i>
                    <span>${s.delayLabel}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. BANDEAU DE BIENVENUE DU MAGASIN ACTIF -->
        <div class="p-4 sm:p-5 rounded-3xl bg-gradient-to-r ${shop.bannerGradient} text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white font-black shadow-inner flex-shrink-0">
              <i data-lucide="${shop.icon}" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${shop.badgeClass}">
                  ${shop.badge}
                </span>
                <span class="text-xs text-white/80 font-semibold">• ⏱️ ${shop.delayLabel}</span>
                <span class="text-xs text-white/80 font-semibold">• ${shop.freeShippingAlways ? 'Port 100% OFFERT' : (shop.freeThreshold < 999999 ? `Port offert dès ${shop.freeThreshold} €` : `Frais de port : ${shop.shippingCost} €`)}</span>
              </div>
              <h3 class="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">${shop.name}</h3>
              <p class="text-xs text-white/80 leading-relaxed max-w-2xl mt-0.5">${shop.desc}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            <div class="px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-right">
              <span class="text-[10px] uppercase tracking-wider text-white/70 block">Articles en rayon</span>
              <strong class="font-mono text-sm text-white">${products.length} référence(s)</strong>
            </div>
          </div>
        </div>

        ${isConcessionnaire ? `
          <!-- 4. ESPACE CONCESSIONNAIRE & SHOWROOM OFFICIEL DES VÉHICULES -->
          <div class="space-y-4">
            
            <!-- Bandeau de statut du Hangar & Capacité de l'antenne sélectionnée -->
            <div class="p-4 rounded-3xl ${isGarageFull ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700/50' : 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-700/50'} border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isGarageFull ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'}">
                    ${isGarageFull ? '⚠️ Garage Saturé' : '✓ Garage Opérationnel'}
                  </span>
                  <span class="font-extrabold text-slate-800 dark:text-slate-200">
                    Hangar d'antenne : <strong>${station?.name || 'Antenne Principale'}</strong>
                  </span>
                </div>
                <p class="text-[11px] text-slate-600 dark:text-slate-400">
                  ${isGarageFull 
                    ? `Votre hangar a atteint sa capacité maximale (<strong>${usedGarageSlots} / ${maxGarageSlots} places</strong>). Agrandissez le hangar dans l'aménagement du local pour commander un nouveau véhicule ou sélectionnez une autre antenne ci-dessus.`
                    : `Capacité du Hangar : <strong class="text-emerald-600 dark:text-emerald-400 font-mono">${usedGarageSlots} / ${maxGarageSlots} véhicules</strong> • <strong>${freeSlots} place(s) disponible(s)</strong> pour une dotation immédiate.`
                  }
                </p>
              </div>

              <div class="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                <button onclick="window.game.openModule('locaux')" class="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-black text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                  <i data-lucide="warehouse" class="w-3.5 h-3.5 text-pc-blue"></i>
                  <span>Aménagement Hangar</span>
                </button>
                <button onclick="window.game.openModule('marche_occasion')" class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                  <i data-lucide="tag" class="w-3.5 h-3.5"></i>
                  <span>Occasion 🏷️</span>
                </button>
              </div>
            </div>

            <!-- Showroom Véhicules officiel (Deux modes : Par Modèle & Carrosserie ou Par Rôle, Choix Aménagements, Sérigraphies, Options d'usine) -->
            <div id="concessionnaire-showroom-container" class="space-y-4">
              ${window.ProtecAdvancedModals ? window.ProtecAdvancedModals.renderVehicleShop(game, station?.id) : '<p class="text-xs text-slate-500 p-8 text-center">Chargement du Concessionnaire...</p>'}
            </div>

          </div>
        ` : `
          <!-- 4. BARRE DES RAYONS THÉMATIQUES & RECHERCHE RAPIDE -->
          <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <!-- Rayons -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              ${(shop.rayons || []).map(r => `
                <button onclick="window.ProtecBoutiques.setRayon('${r.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${this.activeRayonId === r.id ? 'bg-pc-blue text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}">
                  <i data-lucide="${r.icon}" class="w-3.5 h-3.5"></i>
                  <span>${r.label}</span>
                </button>
              `).join('')}
            </div>

            <!-- Moteur de recherche -->
            <div class="relative w-full sm:w-60 flex-shrink-0">
              <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"></i>
              <input type="text" value="${this.searchQuery}" oninput="window.ProtecBoutiques.setSearch(this.value)" placeholder="Rechercher dans ce magasin..." class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-pc-blue" />
            </div>
          </div>

          <!-- 5. CORPS PRINCIPAL : GRILLE D'ARTICLES + PANIER FLOTTANT MULTI-BOUTIQUES -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

            <!-- COLONNE GAUCHE (2/3) : RAYON DU MAGASIN -->
            <div class="lg:col-span-2 space-y-3">
              <div class="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>Rayon : <strong>${(shop.rayons.find(r => r.id === this.activeRayonId) || { label: 'Tout' }).label}</strong> (${products.length} articles)</span>
                <span>Tarifs officiels ${shop.shortName}</span>
              </div>

              ${products.length === 0 ? `
                <div class="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <i data-lucide="package-search" class="w-10 h-10 mx-auto text-slate-400 stroke-1 block"></i>
                  <h4 class="text-xs font-black text-slate-700 dark:text-slate-200">Aucun produit ne correspond à cette recherche.</h4>
                  <p class="text-[11px] text-slate-400">Essayez un autre mot-clé ou visitez un autre rayon du magasin.</p>
                </div>
              ` : `
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${products.map(item => {
                    const currentStock = station?.stock?.[item.id] || 0;
                    const inCartQty = this.cart[item.id]?.qty || 0;

                    return `
                      <div class="p-3.5 rounded-2xl bg-white border border-slate-200/90 dark:bg-slate-900 dark:border-slate-800 hover:border-pc-blue/60 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-2.5 group">
                        <div>
                          <!-- Vignette PNG optimisée ou Icône Lucide vectorielle -->
                          <div class="relative w-full h-32 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-2.5 group-hover:border-pc-blue/30 transition">
                            ${(item.image && window.ProtecLogistique?.hasRealImage(item.image)) ? `
                              <img src="${window.ProtecLogistique.getThumb(item.image)}" 
                                   alt="${item.name}" 
                                   loading="lazy"
                                   onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${item.image}'; }"
                                   class="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
                            ` : `
                              <div class="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                                <i data-lucide="${item.lucideIcon || 'package'}" class="w-9 h-9 text-pc-blue stroke-[1.75]"></i>
                                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">${item.unit || ''}</span>
                              </div>
                            `}
                            <span class="px-2 py-0.5 rounded text-[9.5px] font-black border backdrop-blur-md shadow-xs absolute top-2 left-2 ${item.badgeColor || 'bg-slate-100 text-slate-800'}">
                              ${item.badge || shop.shortName}
                            </span>
                            <span class="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/80 border border-slate-700/80 text-slate-100 shadow-xs backdrop-blur-xs">
                              En stock : ${currentStock}
                            </span>
                          </div>

                          <!-- Titre & Description -->
                          <h5 class="text-xs font-black text-slate-900 dark:text-white leading-snug group-hover:text-pc-blue transition">${item.name}</h5>
                          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">${item.desc || ''}</p>
                          
                          ${item.usage ? `
                            <p class="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 p-1.5 rounded-lg mt-2 font-medium flex items-center gap-1.5">
                              <i data-lucide="info" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"></i>
                              <span>${item.usage}</span>
                            </p>
                          ` : ''}

                          <!-- Sélecteur de Variante de Mannequin pour Kits de Formation -->
                          ${item.category === 'kits_formation' ? (() => {
                            const curVar = (this.selectedKitMannequin && this.selectedKitMannequin[item.id]) || 'standard';
                            const mVars = window.ProtecFormations?.MANNEQUIN_VARIANTS || {};

                            return `
                              <div class="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                                <div class="flex items-center justify-between text-[10px] font-black">
                                  <span class="text-slate-600 dark:text-slate-300">Dotation Mannequins :</span>
                                  <span class="text-pc-blue font-mono">${mVars[curVar]?.shortName || 'Standard'}</span>
                                </div>
                                <div class="grid grid-cols-3 gap-1 text-[9px] font-bold">
                                  <button type="button" onclick="window.ProtecBoutiques.setKitMannequin('${item.id}', 'standard')" class="p-1 rounded-lg text-center transition cursor-pointer ${curVar === 'standard' ? 'bg-pc-blue text-white font-black shadow-xs' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'}">Standard</button>
                                  <button type="button" onclick="window.ProtecBoutiques.setKitMannequin('${item.id}', 'clicker')" class="p-1 rounded-lg text-center transition cursor-pointer ${curVar === 'clicker' ? 'bg-blue-600 text-white font-black shadow-xs' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'}">+Clicker (+180€)</button>
                                  <button type="button" onclick="window.ProtecBoutiques.setKitMannequin('${item.id}', 'qcpr')" class="p-1 rounded-lg text-center transition cursor-pointer ${curVar === 'qcpr' ? 'bg-purple-600 text-white font-black shadow-xs' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'}">+QCPR (+650€)</button>
                                </div>
                              </div>
                            `;
                          })() : ''}
                        </div>

                        <!-- Bas de carte : Prix & Panier -->
                        <div class="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <div class="text-xs font-black text-slate-900 dark:text-white font-mono">${(item.price || 0).toLocaleString('fr-FR')} €</div>
                            <span class="text-[9.5px] text-slate-400">par ${item.unit || 'lot'}</span>
                          </div>

                          <div class="flex items-center gap-1.5">
                            ${inCartQty > 0 ? `
                              <div class="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-0.5">
                                <button onclick="window.ProtecBoutiques.updateCartQty('${item.id}', ${inCartQty - 1})" class="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-black text-xs flex items-center justify-center transition">−</button>
                                <span class="w-7 text-center font-mono font-black text-xs text-pc-blue">${inCartQty}</span>
                                <button onclick="window.ProtecBoutiques.updateCartQty('${item.id}', ${inCartQty + 1})" class="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-black text-xs flex items-center justify-center transition">+</button>
                              </div>
                            ` : `
                              ${(() => {
                                const isTrainingKit = item.category === 'kits_formation';
                                const selVarKey = isTrainingKit ? ((this.selectedKitMannequin && this.selectedKitMannequin[item.id]) || 'standard') : null;
                                const mVarDef = selVarKey ? (window.ProtecFormations?.MANNEQUIN_VARIANTS?.[selVarKey] || { cost: 0, shortName: '' }) : null;
                                const extraCost = mVarDef ? mVarDef.cost : 0;
                                const finalItemPrice = (item.price || 0) + extraCost;
                                const displayName = isTrainingKit && extraCost > 0 ? `${item.name} (${mVarDef.shortName})` : item.name;

                                return `
                                  <button onclick="window.ProtecBoutiques.addToCart('${item.id}', 1, { name: '${displayName.replace(/'/g, "\\'")}', price: ${finalItemPrice}, unit: '${item.unit || 'lot'}', icon: '${item.lucideIcon || 'package'}', image: '${item.image || ''}', shopId: '${shop.id}', radioTech: '${item.radioTech || ''}', radioCount: ${item.radioCount || 0}, mannequinVariant: '${selVarKey || ''}' })" class="px-3 py-1.5 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer">
                                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                    <span>Ajouter</span>
                                  </button>
                                `;
                              })()}
                            `}
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- COLONNE DROITE (1/3) : PANIER D'ACHATS DU CENTRE COMMERCIAL -->
            <div class="lg:col-span-1 p-4 rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white shadow-md space-y-4 lg:sticky lg:top-4">
              
              <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div class="flex items-center gap-2">
                  <i data-lucide="shopping-cart" class="w-4 h-4 text-pc-blue"></i>
                  <div>
                    <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Mon Panier de Courses</h4>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400">Expédié par <strong>${shop.shortName}</strong></span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white font-mono">
                  ${cartSummary.itemsCount}
                </span>
              </div>

              <!-- Liste des articles -->
              <div class="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                ${cartSummary.itemsCount === 0 ? `
                  <div class="py-8 text-center space-y-2 text-slate-500 dark:text-slate-400">
                    <i data-lucide="shopping-bag" class="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600 stroke-1 block opacity-70"></i>
                    <p class="text-xs font-bold">Votre panier de courses est vide.</p>
                    <p class="text-[10.5px] text-slate-400 dark:text-slate-500">Ajoutez des articles depuis n'importe quel magasin de la galerie.</p>
                  </div>
                ` : cartSummary.items.map(it => `
                  <div class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs">
                    <div class="min-w-0 flex-1">
                      <div class="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">${it.name}</div>
                      <div class="text-[10px] text-slate-400 font-mono">${it.price.toLocaleString('fr-FR')} € × ${it.qty} = <strong class="text-emerald-600 dark:text-emerald-400">${it.lineTotal.toLocaleString('fr-FR')} €</strong></div>
                    </div>

                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <div class="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-300 dark:border-slate-700">
                        <button onclick="window.ProtecBoutiques.updateCartQty('${it.id}', ${it.qty - 1})" class="w-5 h-5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center justify-center font-black">−</button>
                        <span class="w-5 text-center font-mono font-bold text-[11px] text-slate-800 dark:text-white">${it.qty}</span>
                        <button onclick="window.ProtecBoutiques.updateCartQty('${it.id}', ${it.qty + 1})" class="w-5 h-5 rounded text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center justify-center font-black">+</button>
                      </div>
                      <button onclick="window.ProtecBoutiques.removeFromCart('${it.id}')" class="text-slate-400 hover:text-rose-500 p-1 transition" title="Supprimer">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Récapitulatif financier & Transporteur -->
              <div class="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div class="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Sous-total articles :</span>
                  <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${cartSummary.subtotal.toLocaleString('fr-FR')} €</span>
                </div>

                <div class="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Frais de livraison (${shop.shortName}) :</span>
                  ${cartSummary.shippingFee === 0 ? `
                    <span class="font-black text-emerald-600 flex items-center gap-1">
                      <i data-lucide="gift" class="w-3 h-3"></i> OFFERTS (0 €)
                    </span>
                  ` : `
                    <span class="font-black text-amber-600 font-mono">+${cartSummary.shippingFee} €</span>
                  `}
                </div>

                <div class="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <i data-lucide="clock" class="w-3 h-3 text-pc-blue"></i>
                  <span>Délai transporteur : <strong>${shop.delayLabel}</strong></span>
                </div>

                <div class="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-black">
                  <span>Total à régler :</span>
                  <span class="text-base text-emerald-600 dark:text-emerald-400 font-mono">${cartSummary.grandTotal.toLocaleString('fr-FR')} €</span>
                </div>

                <div class="flex justify-between text-[10.5px] ${game.resources.money < cartSummary.grandTotal ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'}">
                  <span>Trésorerie restante :</span>
                  <span class="font-mono font-bold">${Math.max(0, game.resources.money - cartSummary.grandTotal).toLocaleString('fr-FR')} €</span>
                </div>
              </div>

              <!-- Validation commande -->
              <div class="space-y-2 pt-1">
                ${cartSummary.itemsCount > 0 ? `
                  <button onclick="window.ProtecBoutiques.checkout(window.game)" class="w-full py-3 rounded-2xl ${game.resources.money >= cartSummary.grandTotal ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-lg cursor-pointer' : 'bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'} font-black text-xs transition flex items-center justify-center gap-2 active:scale-95" ${game.resources.money < cartSummary.grandTotal ? 'disabled' : ''}>
                    <i data-lucide="truck" class="w-4 h-4"></i>
                    <span>${game.resources.money >= cartSummary.grandTotal ? `Régler et Expédier (${cartSummary.grandTotal.toLocaleString('fr-FR')} €)` : 'Trésorerie Insuffisante'}</span>
                  </button>

                  <button onclick="window.ProtecBoutiques.clearCart()" class="w-full py-1.5 rounded-xl text-[10.5px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                    Vider le panier de courses
                  </button>
                ` : `
                  <button disabled class="w-full py-3 rounded-2xl bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-bold text-xs cursor-not-allowed text-center">
                    Panier vide
                  </button>
                `}
              </div>

            </div>

          </div>
        `}

        <!-- 6. PIED DE PAGE : FLÂNER VERS LE MAGASIN SUIVANT -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <button onclick="window.ProtecBoutiques.prevShop()" class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
            <span>Visiter le magasin précédent</span>
          </button>
          
          <span class="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            🏪 Vous êtes chez <strong>${shop.name}</strong> (${shop.shortName})
          </span>

          <button onclick="window.ProtecBoutiques.nextShop()" class="px-3 py-1.5 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer">
            <span>Flâner vers le magasin suivant</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
