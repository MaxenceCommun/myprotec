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
  activeTab: 'stock', // 'stock', 'livraisons', 'flotte', 'radios'
  selectedCategory: 'all',
  selectedStationId: null,
  searchQuery: '',
  cart: {}, // { [itemId]: quantity }
  selectedSupplierId: 'fede_log',
  selectedRadioTech: 'analogique',
  selectedRadioPack: 'binome',
  selectedRadioSupplierId: 'ondepro',

  // =========================================================================
  // FOURNISSEURS OFFICIELS FICTIFS (DÉLAIS & FRAIS RÉALISTES)
  // =========================================================================
  SUPPLIERS: [
    {
      id: 'fede_log',
      name: 'Centrale Fédérale FNPC (Groupage Réseau)',
      shortName: 'Centrale Fédérale',
      badge: 'Livraison Gratuite',
      badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
      icon: 'landmark',
      desc: 'Tournée logistique nationale mutualisée entre les antennes. Tarifs conventionnés.',
      deliveryDelaySec: 259200,
      delayLabel: '72h (Tournée Fédérale FNPC)',
      shippingCost: 0,
      freeThreshold: 0,
      priceMultiplier: 1.0,
      freeShippingAlways: true,
      specialty: 'Livraison 100% OFFERTE garantie sur tout le matériel associatif'
    },
    {
      id: 'securicom',
      name: 'Securicom Express France',
      shortName: 'Securicom Express',
      badge: 'Livraison Rapide',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
      icon: 'zap',
      desc: 'Grossiste national leader en matériel de secours et télécommunications d\'urgence.',
      deliveryDelaySec: 86400,
      delayLabel: '24h (Express J+1)',
      shippingCost: 28,
      freeThreshold: 600,
      priceMultiplier: 0.98,
      freeShippingAlways: false,
      specialty: 'Expédition prioritaire quotidienne et remises sur volume (-2%)'
    },
    {
      id: 'hexacom',
      name: 'HexaCom Tactique & Réseaux',
      shortName: 'HexaCom Tactique',
      badge: 'Spécialiste Télécoms',
      badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300',
      icon: 'radio',
      desc: 'Fabricant de réseaux tactiques de sécurité civile, terminaux LTE et ANTARES.',
      deliveryDelaySec: 172800,
      delayLabel: '48h (Messagerie Standard)',
      shippingCost: 19,
      freeThreshold: 900,
      priceMultiplier: 1.05,
      freeShippingAlways: false,
      specialty: 'Terminaux certifiés IP68, cryptage militaire et stations de charge intelligentes'
    },
    {
      id: 'ondepro',
      name: 'OndePro Télécom & Fréquences',
      shortName: 'OndePro Télécom',
      badge: 'Discount & Packs Éco',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
      icon: 'tag',
      desc: 'Distributeur direct d\'usines spécialisé dans les packs analogiques et chargeurs multiples.',
      deliveryDelaySec: 172800,
      delayLabel: '48h (Acheminement Éco)',
      shippingCost: 14,
      freeThreshold: 450,
      priceMultiplier: 0.92,
      freeShippingAlways: false,
      specialty: 'Les prix les plus bas (-8%) sur les packs radios et baies de charge'
    },
    {
      id: 'disposecours',
      name: 'DispoSecours Coursier Éclair',
      shortName: 'DispoSecours Éclair',
      badge: 'Ultra-Urgence',
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
      icon: 'clock',
      desc: 'Transporteur d\'urgence par coursier dédié. Réception express avant mission critique.',
      deliveryDelaySec: 86400,
      delayLabel: '24h (Coursier Express)',
      shippingCost: 45,
      freeThreshold: 999999,
      priceMultiplier: 1.10,
      freeShippingAlways: false,
      specialty: 'Livraison express garantie sous 24h'
    }
  ],

  // =========================================================================
  // TECHNOLOGIES RADIOS & PACKS DÉGRESSIFS
  // =========================================================================
  RADIO_TECH: {
    analogique: {
      id: 'radio_analogique',
      name: 'Radio Analogique VHF/UHF (PMR446)',
      shortName: 'Analogique VHF/UHF',
      unitPrice: 90,
      badge: 'Portée Locale (1-3 km)',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
      icon: 'radio',
      image: 'images/equipements/radio_analog.png',
      desc: 'Liaison directe entre binômes secouristes et chef de poste. Autonomie totale sans abonnement ni réseau.',
      advantages: [
        'Économique et robuste',
        'Zéro dépendance réseau 4G/5G',
        'Batterie longue durée (24h+)',
        'Idéal pour DPS de proximité & petits évènements'
      ]
    },
    lte: {
      id: 'radio_lte',
      name: 'Radio Numérique LTE (4G / 5G Push-To-Talk)',
      shortName: 'Numérique LTE 4G/5G',
      unitPrice: 260,
      badge: 'Portée Illimitée 4G/5G',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-300',
      icon: 'smartphone',
      image: 'images/equipements/radio_lte.png',
      desc: 'Terminaux connectés sur réseau cellulaire national. Audio HD filtré, bouton détresse avec géolocalisation GPS en temps réel.',
      advantages: [
        'Portée nationale illimitée via 4G/5G',
        'Bouton SOS avec géolocalisation GPS directe',
        'Audio HD sans souffle ni parasite',
        '+15% efficacité de coordination sur grands DPS et convois'
      ]
    },
    hybride: {
      id: 'radio_hybride',
      name: 'Radio Hybride Tactique Bi-Mode (Analogique + LTE 4G/5G)',
      shortName: 'Hybride Bi-Mode Tactique',
      unitPrice: 580,
      badge: 'Bascule Auto & Homologuée Sécurité Civile',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 ring-1 ring-indigo-400 dark:bg-indigo-950 dark:text-indigo-300',
      icon: 'shield-alert',
      image: 'images/equipements/radio_analog_lte.png',
      desc: 'Le summum de la résilience : bascule automatique en analogique en sous-sol ou coupure 4G, et en LTE quand le réseau cellulaire est présent. Homologuée ANTARES / CODIS.',
      advantages: [
        'Infaillible : fonctionne partout (sous-sols, zones blanches, saturation)',
        'Cryptage militaire AES-256 Sécurité Civile',
        'Inter-opérabilité SAMU 15 & SDIS 18',
        '+25% réactivité sur plans NOVI et ORSEC'
      ]
    }
  },

  RADIO_PACKS: [
    {
      id: 'unit',
      name: 'Portatif Individuel',
      count: 1,
      discountPct: 0,
      label: '1 Radio (Tarif unitaire)',
      packaging: 'Boîte unitaire',
      contents: '1 portatif + 1 chargeur secteur individuel + 1 clip ceinture'
    },
    {
      id: 'binome',
      name: 'Pack Binôme Opérationnel',
      count: 2,
      discountPct: 5,
      label: '2 Radios (-5%)',
      packaging: 'Pack duo',
      contents: '2 portatifs + 2 chargeurs individuels + 2 oreillettes micro discrètes'
    },
    {
      id: 'escouade',
      name: 'Pack Escouade / Équipe DPS',
      count: 4,
      discountPct: 10,
      label: '4 Radios (-10%)',
      packaging: 'Pack équipe',
      contents: '4 portatifs + 1 station de charge 4 postes + 4 micros déportés poire'
    },
    {
      id: 'valise',
      name: 'Valise Tactique Section',
      count: 10,
      discountPct: 15,
      label: '10 Radios (-15%)',
      packaging: 'Valise Peli-Case',
      contents: '10 portatifs + Valise étanche antichoc avec baie de charge rapide intégrée + 10 oreillettes'
    },
    {
      id: 'malle',
      name: 'Malle Régimentaire Dispositif Majeur',
      count: 20,
      discountPct: 22,
      label: '20 Radios (-22%)',
      packaging: 'Malle grand volume',
      contents: '20 portatifs + 2 stations de charge 10 postes + 20 micros poire étanches IP68 + mallettes renforcées'
    }
  ],

  // Visuels réels disponibles sur le disque (élimine toute erreur 404 dans la console du navigateur)
  EXISTING_IMAGES: new Set([
    'images/equipements/lot_secours_a.png',
    'images/equipements/lot_secours_b.png',
    'images/equipements/lot_secours_c.png',
    'images/equipements/lot_tronconnage.png',
    'images/equipements/lot_pompage.png',
    'images/equipements/lot_eclairage.png',
    'images/equipements/lot_bachage.png',
    'images/equipements/lot_bache.png',
    'images/equipements/lot_poste_commandement_mobile.png',
    'images/equipements/remorque_groupe_electro.png',
    'images/equipements/remorque_motopompe.png',
    'images/equipements/groupe_electrogene.png',
    'images/equipements/drone.png',
    'images/equipements/drone_thermique.png',
    'images/equipements/caisse_rearmement.png',
    'images/equipements/caisse_reassort.png',
    'images/equipements/tenue_pc.png',
    'images/equipements/tenue_moto.png',
    'images/equipements/tenue_usar.png',
    'images/equipements/tenue_f1.png',
    'images/equipements/prise_parametres.png',
    'images/equipements/schiller.png',
    'images/equipements/lit_picot.png',
    'images/equipements/lot_ravitaillement.png',
    'images/equipements/lot_cai.png',
    'images/equipements/rangers1.png',
    'images/equipements/rangers2.png',
    'images/equipements/rangers3.png',
    'images/equipements/telephone_garde.png',
    'images/equipements/phones.png',
    'images/equipements/moniteur_t7.png',
    'images/equipements/kit_pedago_extincteur.png',
  ]),

  hasRealImage(path) {
    return Boolean(path && this.EXISTING_IMAGES.has(path));
  },

  getThumb(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('images/equipements/') && !imagePath.includes('/thumbs/')) {
      if (imagePath.includes('telephone') || imagePath.includes('phones')) return 'images/equipements/thumbs/phone.png';
      if (imagePath.includes('tablette')) return 'images/equipements/thumbs/tablette.png';
      return imagePath.replace('images/equipements/', 'images/equipements/thumbs/');
    }
    if (imagePath.startsWith('images/vehicles/') && !imagePath.includes('/thumbs/')) {
      return imagePath.replace('images/vehicles/', 'images/vehicles/thumbs/');
    }
    return imagePath;
  },

  // =========================================================================
  // 1. CATALOGUE OFFICIEL CENTRAL D'ACHATS PROTECTION CIVILE
  // =========================================================================
  CATEGORIES: [
    { id: 'all', label: 'Tout le Catalogue', iconLucide: 'layout-grid' },
    { id: 'pharmacie', label: 'Consommables & Réarmement', iconLucide: 'archive' },
    { id: 'lots_secours', label: 'Lots de Secours (A, B, C)', iconLucide: 'briefcase' },
    { id: 'technique_crise', label: 'Technique & Crise', iconLucide: 'wrench' },
    { id: 'social_hebergement', label: 'Ravitaillement & Hébergement', iconLucide: 'heart-handshake' },
    { id: 'transmissions', label: 'Transmissions & Radio', iconLucide: 'radio' },
    { id: 'tenues_epi', label: 'Tenues & Équipements EPI', iconLucide: 'shield' },
    { id: 'kits_formation', label: 'Kits Pédagogiques (Formations)', iconLucide: 'graduation-cap' }
  ],

  CATALOG: [
    // --- 1. CONSOMMABLES & RÉARMEMENT ---
    {
      id: 'caisse_rearmement',
      category: 'soins',
      tag: 'soins',
      tagLabel: 'Soins',
      name: 'Kit de réarmement (consommable)',
      lucideIcon: 'archive',
      image: 'images/equipements/caisse_rearmement.png',
      price: 370,
      unit: 'kit (3x VPSP)',
      slots: 1,
      consumables: 300,
      maxConsumables: 300,
      badge: 'Soins • 3x VPSP',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60',
      desc: 'Kit de réarmement consommable complet. Correspond à 3x l\'armement d\'un VPSP (3 réarmements complets de véhicule).',
      usage: 'Réarme 3 véhicules à 100% ou apporte 300 consommables au stock.'
    },

    // --- 2. LOTS DE SECOURS A / B / C ---
    {
      id: 'lot_secours_a',
      category: 'soins',
      tag: 'soins',
      tagLabel: 'Soins',
      name: 'Lot A - Poste de secours',
      lucideIcon: 'tent',
      image: 'images/equipements/lot_secours_a.png',
      price: 2830,
      unit: 'lot complet armé',
      slots: 4,
      types: ['PS', 'LOG'],
      consumables: 200,
      maxConsumables: 200,
      isLot: true,
      badge: 'Soins • Lot A (2x VPSP)',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-300',
      desc: 'Tente et équipement complet pour poste de secours fixe (DPS). Armé en consommables à l\'achat (double de l\'armement d\'un VPSP).',
      usage: 'Dotation de 200 consommables (2x VPSP). Indispensable DPS-ME / DPS-GE.'
    },
    {
      id: 'lot_secours_b',
      category: 'soins',
      tag: 'soins',
      tagLabel: 'Soins',
      name: 'Lot B - Premiers secours',
      lucideIcon: 'briefcase',
      image: 'images/equipements/lot_secours_b.png',
      price: 320,
      unit: 'lot complet armé',
      slots: 2,
      types: ['PS'],
      consumables: 50,
      maxConsumables: 50,
      isLot: true,
      badge: 'Soins • Lot B (0.5x VPSP)',
      badgeColor: 'bg-blue-50 text-pc-blue border-blue-300',
      desc: 'Sac d\'urgence avec oxygène et DAE pour les interventions réflexes. Armé en consommables à l\'achat (la moitié de l\'armement d\'un VPSP).',
      usage: 'Dotation de 50 consommables (0.5x VPSP). Équipement des VPSP et PAPS.'
    },
    {
      id: 'lot_secours_c',
      category: 'soins',
      tag: 'soins',
      tagLabel: 'Soins',
      name: 'Lot C - Brancardage & Immobilisation',
      lucideIcon: 'stretch-horizontal',
      image: 'images/equipements/lot_secours_c.png',
      price: 1950,
      unit: 'lot complet armé',
      slots: 2,
      types: ['PS'],
      consumables: 100,
      maxConsumables: 100,
      isLot: true,
      badge: 'Soins • Lot C',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      desc: 'Matériel complet d\'immobilisation, matelas coquille et brancardage pour les traumatismes et fractures. Armé à l\'achat.',
      usage: 'Nécessaire pour le relevage, le brancardage et les traumatismes.'
    },

    // --- 3. TECHNIQUE & CRISE ---
    {
      id: 'lot_tronconnage',
      category: 'technique_crise',
      name: 'Lot Tronçonnage',
      lucideIcon: 'axe',
      image: 'images/equipements/lot_tronconnage.png',
      price: 1450,
      unit: 'lot complet',
      badge: 'Tempêtes',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
      desc: 'Tronçonneuse et protections pour dégager les arbres et voies bloquées.',
      usage: 'Dégagement d\'urgence (1 opérateur formé Tronc. requis).'
    },
    {
      id: 'remorque_groupe_electro',
      category: 'technique_crise',
      name: 'Remorque Groupe électrogène',
      lucideIcon: 'zap',
      image: 'images/equipements/remorque_groupe_electro.png',
      price: 4800,
      unit: 'remorque',
      slots: 3,
      requiresTrailer: true,
      requiresTowHitch: true,
      badge: 'Énergie de Crise',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: 'Alimente en électricité un gymnase, un PMA ou l\'antenne lors d\'un black-out.',
      usage: 'Énergie de crise tractée par tout véhicule avec attelage.'
    },
    {
      id: 'remorque_motopompe',
      category: 'technique_crise',
      name: 'Remorque Motopompe',
      lucideIcon: 'waves',
      image: 'images/equipements/remorque_motopompe.png',
      price: 3800,
      unit: 'remorque',
      slots: 3,
      requiresTrailer: true,
      requiresTowHitch: true,
      badge: 'Pompage Lourd',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      desc: 'Pompe lourd débit pour assécher crues, parkings et sous-sols inondés.',
      usage: 'Pompage massif tracté par tout véhicule avec attelage.'
    },
    {
      id: 'drone_reco',
      category: 'technique_crise',
      name: 'Drone de reconnaissance',
      lucideIcon: 'camera',
      image: 'images/equipements/drone.png',
      price: 2600,
      unit: 'pack valise',
      slots: 1,
      badge: 'Vue Aérienne',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
      desc: 'Caméra aérienne 4K pour survoler crues et grands rassemblements.',
      usage: 'Reconnaissance aérienne rapide de la zone d\'intervention.'
    },
    {
      id: 'drone_thermique',
      category: 'technique_crise',
      name: 'Drone thermique',
      lucideIcon: 'eye',
      image: 'images/equipements/drone_thermique.png',
      price: 5200,
      unit: 'pack valise',
      slots: 1,
      badge: 'Recherche Nuit',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      desc: 'Caméra infrarouge pour localiser des personnes disparues de nuit.',
      usage: 'Recherche de personnes égarées et battues nocturnes.'
    },
    {
      id: 'lot_pompage',
      category: 'technique_crise',
      name: 'Lot Pompage',
      lucideIcon: 'waves',
      image: 'images/equipements/lot_pompage.png',
      price: 1850,
      unit: 'lot complet',
      badge: 'Inondations',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
      desc: 'Pompes portatives pour vider caves et habitations inondées.',
      usage: 'Assèchement rapide des sous-sols et parkings.'
    },
    {
      id: 'lot_eclairage',
      category: 'technique_crise',
      name: 'Lot Éclairage',
      lucideIcon: 'lightbulb',
      image: 'images/equipements/lot_eclairage.png',
      price: 1600,
      unit: 'lot complet',
      badge: 'Nocturne',
      badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-300',
      desc: 'Projecteurs sur mâts pour éclairer les postes et zones d\'intervention.',
      usage: 'Éclairage autonome pour missions et recherches nocturnes.'
    },
    {
      id: 'lot_bachage',
      category: 'technique_crise',
      name: 'Lot Bâchage',
      lucideIcon: 'home',
      image: 'images/equipements/lot_bachage.png',
      price: 980,
      unit: 'lot complet',
      badge: 'Intempéries',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-300',
      desc: 'Bâches renforcées pour protéger les toitures après une tempête.',
      usage: 'Mise hors d\'eau d\'urgence des toitures endommagées.'
    },

    // --- 4. TENUES & ÉQUIPEMENTS EPI ---
    {
      id: 'tenue_pc',
      category: 'tenues_epi',
      tag: 'habillement',
      tagLabel: 'Habillement',
      name: 'Tenue bénévole',
      lucideIcon: 'shirt',
      image: 'images/equipements/tenue_pc.png',
      price: 160,
      unit: 'tenue complète',
      slots: 1,
      badge: 'Habillement • Dotation',
      badgeColor: 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800',
      desc: 'Uniforme réglementaire pour équiper un secouriste sur le terrain.',
      usage: 'Obligatoire pour autoriser un bénévole à partir en mission.'
    },
    {
      id: 'tenue_moto',
      category: 'tenues_epi',
      tag: 'habillement',
      tagLabel: 'Habillement',
      name: 'Tenue moto',
      lucideIcon: 'bike',
      image: 'images/equipements/tenue_moto.png',
      price: 240,
      unit: 'tenue moto',
      slots: 1,
      badge: 'Habillement • Pilote Moto',
      badgeColor: 'bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800',
      desc: 'Protection renforcée homologuée pour piloter les motos de secours.',
      usage: 'Équipement de sécurité pour les motocyclistes en intervention.'
    },
    {
      id: 'tenue_usar',
      category: 'tenues_epi',
      tag: 'habillement',
      tagLabel: 'Habillement',
      name: 'Tenue USAR',
      lucideIcon: 'hard-hat',
      image: 'images/equipements/tenue_usar.png',
      price: 320,
      unit: 'tenue USAR',
      slots: 1,
      badge: 'Habillement • Sauvetage USAR',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
      desc: 'Combinaison anti-abrasion pour interventions en décombres et sauvetage.',
      usage: 'Protection pour interventions sur effondrements et séismes.'
    },
    {
      id: 'rangers1',
      category: 'tenues_epi',
      tag: 'habillement',
      tagLabel: 'Habillement',
      name: 'Rangers Standard',
      lucideIcon: 'footprints',
      image: 'images/equipements/rangers1.png',
      price: 65,
      unit: 'paire',
      badge: 'Habillement • Base',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      desc: 'Chaussures montantes réglementaires (dotation de base).',
      usage: 'Protection et confort de base (+5 Moral).',
      quality: 'base',
      rangersLevel: 1,
      moralBonus: 5
    },
    {
      id: 'rangers2',
      category: 'tenues_epi',
      tag: 'habillement',
      tagLabel: 'Habillement',
      name: 'Rangers Confort',
      lucideIcon: 'footprints',
      image: 'images/equipements/rangers2.png',
      price: 120,
      unit: 'paire',
      badge: 'Habillement • Confort',
      badgeColor: 'bg-blue-100 text-pc-blue border-blue-300',
      desc: 'Cuir souple et semelle amortissante pour la marche prolongée.',
      usage: 'Bon confort sur les longues missions (+12 Moral).',
      quality: 'bien',
      rangersLevel: 2,
      moralBonus: 12
    },
    {
      id: 'rangers3',
      category: 'tenues_epi',
      tag: 'habillement',
      tagLabel: 'Habillement',
      name: 'Rangers Pro',
      lucideIcon: 'footprints',
      image: 'images/equipements/rangers3.png',
      price: 190,
      unit: 'paire',
      badge: 'Habillement • Pro',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Membrane imperméable respirante et renforts ergonomiques.',
      usage: 'Excellent confort et haute endurance (+20 Moral).',
      quality: 'super',
      rangersLevel: 3,
      moralBonus: 20
    },

    // --- 5. RAVITAILLEMENT & ACTION SOCIALE ---
    {
      id: 'lot_hebergement',
      category: 'social_hebergement',
      name: 'Kit CHU (30 Lits Picots)',
      lucideIcon: 'bed-double',
      image: 'images/equipements/lit_picot.png',
      price: 2100,
      unit: 'lot complet',
      slots: 3,
      types: ['LOG', 'TP'],
      consumables: 100,
      isLot: true,
      badge: 'Accueil Sinistrés',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'Lits de camp et duvets pour équiper un centre d\'hébergement d\'urgence.',
      usage: 'Armement d\'un gymnase communal pour sinistrés.'
    },
    {
      id: 'lot_ravitaillement',
      category: 'social_hebergement',
      name: 'Lot Ravitaillement',
      lucideIcon: 'utensils',
      image: 'images/equipements/lot_ravitaillement.png',
      price: 1350,
      unit: 'lot complet',
      badge: 'Soutien Troupes',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-300',
      desc: 'Cuisine mobile et boissons chaudes pour restaurer bénévoles et sinistrés.',
      usage: 'Maintien de l\'énergie sur les interventions de longue durée.'
    },
    {
      id: 'lot_soutien_psy',
      category: 'social_hebergement',
      name: 'Lot CAI (Soutien psychologique)',
      lucideIcon: 'heart-handshake',
      image: 'images/equipements/lot_cai.png',
      price: 1200,
      unit: 'lot complet',
      badge: 'Cellule d\'Accueil',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      desc: 'Espace d\'accueil et réconfort pour les impliqués et familles.',
      usage: 'Centre d\'Accueil des Impliqués lors de crises.'
    },

    // --- 6. TRANSMISSIONS & RADIO ---
    {
      id: 'telephone_garde',
      category: 'transmissions',
      name: 'Téléphone de service',
      lucideIcon: 'smartphone',
      image: 'images/equipements/telephone_garde.png',
      price: 190,
      unit: 'smartphone durci',
      badge: 'Garde & DPS',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
      desc: 'Smartphone de service évitant d\'utiliser les téléphones personnels des secouristes.',
      usage: 'Préserve la vie privée lors des gardes et DPS (+8 moral).'
    },
    {
      id: 'radio_antares',
      category: 'transmissions',
      name: 'Radio ANTARES',
      lucideIcon: 'radio',
      image: 'images/equipements/radio_antares.png',
      price: 450,
      unit: 'portatif',
      badge: 'Réseau Secours',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      desc: 'Radio sécurisée pour les liaisons inter-équipes et le commandement.',
      usage: 'Liaison avec le CODIS 18 et le SAMU 15.'
    },
    {
      id: 'tablette_tlo',
      category: 'transmissions',
      name: 'Tablette TLO embarquée',
      lucideIcon: 'tablet',
      image: 'images/equipements/tablette_tlo.png',
      price: 550,
      unit: 'tablette',
      badge: 'Numérique',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-300',
      desc: 'Tablette GPS et bilans numériques pour accélérer les départs et interventions.',
      usage: 'Navigation GPS et bilans numériques en direct au SAMU.'
    },
    {
      id: 'chargeur_radios',
      category: 'transmissions',
      name: 'Chargeur 6 radios',
      lucideIcon: 'battery-charging',
      image: 'images/equipements/chargeur_radios.png',
      price: 190,
      unit: 'chargeur 6 slots',
      badge: 'Base Antenne',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      desc: 'Station de charge collective pour talkies-walkies à l\'antenne.',
      usage: 'Maintient les radios chargées à 100% à la base.'
    },
    {
      id: 'lot_poste_commandement_mobile',
      category: 'transmissions',
      name: 'Kit Poste de Commandement',
      lucideIcon: 'satellite',
      image: 'images/equipements/lot_poste_commandement_mobile.png',
      price: 2800,
      unit: 'lot complet',
      badge: 'Commandement VLC',
      badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-300',
      desc: 'Équipement informatique et radio pour transformer un véhicule en PC mobile.',
      usage: 'Coordination des grands dispositifs et crises.'
    },

    // --- 7. KITS PÉDAGOGIQUES (FORMATIONS) ---
    {
      id: 'kit_pedago_gqs',
      category: 'kits_formation',
      tag: 'formation',
      tagLabel: 'Formation',
      name: 'Kit Pédagogique GQS',
      lucideIcon: 'heart-pulse',
      image: 'images/equipements/kit_gqs.png',
      price: 650,
      unit: 'kit complet',
      badge: 'Formation • GQS',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300',
      desc: 'Mannequins de massage cardiaque adulte/enfant, défibrillateur DAE de formation et garrots d\'exercice pour sensibiliser les citoyens.',
      usage: 'Ateliers de sensibilisation courte aux Gestes Qui Sauvent (2h).'
    },
    {
      id: 'kit_pedago_psc',
      category: 'kits_formation',
      tag: 'formation',
      tagLabel: 'Formation',
      name: 'Kit Pédagogique PSC',
      lucideIcon: 'graduation-cap',
      image: 'images/equipements/kit_psc.png',
      price: 1200,
      unit: 'kit complet',
      badge: 'Formation • PSC',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'Mannequins adultes, enfants, nourrissons, DAE de formation et matériel de simulation pour les formations certifiantes grand public PSC.',
      usage: 'Formations initiales et continues aux Premiers Secours Citoyens (PSC 7h).'
    },
    {
      id: 'kit_pedago_pse',
      category: 'kits_formation',
      tag: 'formation',
      tagLabel: 'Formation',
      name: 'Kit Pédagogique PSE (PSE1 & PSE2)',
      lucideIcon: 'shield-alert',
      image: 'images/equipements/kit_pse.png',
      price: 2400,
      unit: 'kit complet',
      badge: 'Formation • PSE',
      badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-300',
      desc: 'Lot pédagogique complet unifié pour former et recycler secouristes (PSE1) et équipiers secouristes (PSE2) : plan dur, colliers cervicaux, oxygénothérapie, brancardage et bilans.',
      usage: 'Formations initiales PSE1, PSE2, Chef d\'Équipe et recyclages annuels FC PSE.'
    },
    {
      id: 'kit_pedago_sst',
      category: 'kits_formation',
      tag: 'formation',
      tagLabel: 'Formation',
      name: 'Kit Pédagogique SST',
      lucideIcon: 'briefcase',
      image: 'images/equipements/kit_pedago_sst.png',
      price: 1100,
      unit: 'kit complet',
      badge: 'Formation • SST',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
      desc: 'Matériel officiel pour former les sauveteurs secouristes du travail en entreprise (INRS).',
      usage: 'Formations initiales SST et recyclages MAC SST.'
    },
    {
      id: 'kit_pedago_extincteur',
      category: 'kits_formation',
      tag: 'formation',
      tagLabel: 'Formation',
      name: 'Kit Extincteurs Incendie',
      lucideIcon: 'flame',
      image: 'images/equipements/kit_pedago_extincteur.png',
      price: 1400,
      unit: 'kit complet',
      badge: 'Formation • Incendie',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-300',
      desc: 'Bac à feu et extincteurs d\'exercice pour les formations incendie.',
      usage: 'Initiations à la manipulation d\'extincteurs.'
    },
    {
      id: 'kit_pedago_picf',
      category: 'kits_formation',
      tag: 'formation',
      tagLabel: 'Formation',
      name: 'Kit Pédagogique PIC F',
      lucideIcon: 'clipboard-list',
      image: 'images/equipements/kit_pedago_picf.png',
      price: 850,
      unit: 'kit complet',
      badge: 'Formation • Formateurs',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
      desc: 'Supports pédagogiques pour former les formateurs de secours.',
      usage: 'Formations de formateurs PIC F.'
    },
    {
      id: 'kit_pedago_ssa',
      category: 'kits_formation',
      tag: 'formation',
      tagLabel: 'Formation',
      name: 'Kit Sauvetage Aquatique (SSA)',
      lucideIcon: 'life-buoy',
      image: 'images/equipements/kit_pedago_ssa.png',
      price: 1300,
      unit: 'kit complet',
      badge: 'Formation • Aquatique',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      desc: 'Mannequins et bouées pour les entraînements aquatiques.',
      usage: 'Formations et entraînements aquatiques SSA.'
    },
    {
      id: 'schiller_t7_formation',
      category: 'kits_formation',
      tag: 'formation',
      tagLabel: 'Formation',
      name: 'Moniteur défibrillateur de Formation (Connecté Instructeur)',
      lucideIcon: 'monitor',
      image: 'images/equipements/moniteur_t7.png',
      price: 2600,
      unit: 'appareil complet',
      badge: 'Formation • Simulation',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Moniteur-défibrillateur de simulation Touch 7 connecté en Bluetooth à la tablette du formateur. Permet de générer des scénarios ECG dynamiques (FV, TV, asystolie), piloter les constantes (SpO2, NIBP) et simuler des bilans réalistes pour les formations PSE.',
      usage: 'Simulation haute fidélité pour les formations PSE1, PSE2 et recyclages opérationnels.'
    }],

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
      station.stock = {};
    }
    if (station.stockMaterielsPS === undefined) {
      station.stockMaterielsPS = 0;
    }
    if (game && game.stockMaterielsPS === undefined) {
      game.stockMaterielsPS = station.stockMaterielsPS;
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

  getSupplier(supplierId = null) {
    const id = supplierId || this.selectedSupplierId || 'fede_log';
    return (this.SUPPLIERS || []).find(s => s.id === id) || (this.SUPPLIERS ? this.SUPPLIERS[0] : { name: 'Centrale Fédérale', deliveryDelaySec: 86400, shippingCost: 0 });
  },

  setSupplier(supplierId) {
    this.selectedSupplierId = supplierId;
    this.renderModal(window.game);
  },

  setRadioTech(techKey) {
    this.selectedRadioTech = techKey;
    this.renderModal(window.game);
  },

  setRadioPack(packId) {
    this.selectedRadioPack = packId;
    this.renderModal(window.game);
  },

  setRadioSupplier(supplierId) {
    this.selectedRadioSupplierId = supplierId;
    this.renderModal(window.game);
  },

  getShippingFee(subtotal, supplierId = null) {
    if (subtotal <= 0) return 0;
    const sup = this.getSupplier(supplierId);
    if (sup.freeShippingAlways) return 0;
    if (subtotal >= sup.freeThreshold) return 0;
    return sup.shippingCost;
  },

  getDeliveryDurationSeconds(supplierId = null) {
    const sup = this.getSupplier(supplierId);
    return sup.deliveryDelaySec || 86400;
  },

  getActiveDeliveries(game) {
    if (!game || !Array.isArray(game.deliveries)) return [];
    return game.deliveries.filter(d => d && d.status === 'in_transit');
  },

  getRadioPackDetails(techKey, packId, supplierId = null) {
    const tech = (this.RADIO_TECH && this.RADIO_TECH[techKey]) || this.RADIO_TECH?.analogique || { unitPrice: 90, name: 'Radio Analogique' };
    const pack = (this.RADIO_PACKS || []).find(p => p.id === packId) || (this.RADIO_PACKS ? this.RADIO_PACKS[0] : { count: 1, discountPct: 0 });
    const sup = this.getSupplier(supplierId || this.selectedRadioSupplierId);

    const baseUnit = tech.unitPrice;
    const rawTotal = Math.round(baseUnit * pack.count * (1 - pack.discountPct / 100));
    const finalPrice = Math.round(rawTotal * (sup.priceMultiplier || 1.0));
    const shippingFee = (sup.freeShippingAlways || finalPrice >= sup.freeThreshold) ? 0 : sup.shippingCost;
    const grandTotal = finalPrice + shippingFee;
    const savingsAmount = Math.max(0, (baseUnit * pack.count) - finalPrice);

    return {
      tech,
      pack,
      sup,
      baseUnit,
      rawTotal,
      finalPrice,
      shippingFee,
      grandTotal,
      savingsAmount,
      deliveryDelaySec: sup.deliveryDelaySec,
      delayLabel: sup.delayLabel
    };
  },

  addRadioPackToCart(techKey, packId) {
    const tech = (this.RADIO_TECH && this.RADIO_TECH[techKey]) || this.RADIO_TECH?.analogique;
    const pack = (this.RADIO_PACKS || []).find(p => p.id === packId) || this.RADIO_PACKS[0];
    const cartItemId = `pack_radio_${techKey}_${pack.id}`;
    
    let catItem = this.CATALOG.find(i => i.id === cartItemId);
    if (!catItem) {
      catItem = {
        id: cartItemId,
        category: 'transmissions',
        name: `${pack.name} - ${tech.name}`,
        lucideIcon: 'radio',
        image: tech.image,
        price: Math.round(tech.unitPrice * pack.count * (1 - pack.discountPct / 100)),
        unit: pack.packaging,
        badge: pack.label,
        badgeColor: tech.badgeColor,
        desc: `${pack.contents}. ${tech.desc}`,
        usage: `Ajoute +${pack.count} radios ${tech.shortName} au stock d'antenne.`,
        radioTech: techKey,
        radioCount: pack.count
      };
      this.CATALOG.push(catItem);
    }

    this.addToCart(cartItemId, 1);
  },

  buyRadioPackDirect(game, techKey, packId, supplierId) {
    const details = this.getRadioPackDetails(techKey, packId, supplierId);
    if (!game) game = window.game;
    if (!game) return;

    if (game.resources.money < details.grandTotal) {
      game.showToast('Trésorerie insuffisante', `Il vous manque ${(details.grandTotal - game.resources.money).toLocaleString('fr-FR')} € pour commander ce pack radio.`, 'red');
      return;
    }

    const station = this.getActiveStation(game);
    if (!station) {
      game.showToast('Aucune antenne', 'Veuillez sélectionner une antenne de destination.', 'orange');
      return;
    }

    this.ensureStationStock(station, game);

    // Débit trésorerie
    game.resources.money -= details.grandTotal;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -details.grandTotal,
        `Achat Radios : ${details.pack.name} (${details.tech.shortName}) - Fournisseur ${details.sup.shortName}`,
        'logistique',
        `RADIO-${Date.now()}`,
        details.sup.name
      );
    }

    if (!Array.isArray(game.deliveries)) game.deliveries = [];
    const durationSec = details.deliveryDelaySec;

    const delivery = {
      id: `deliv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderNumber: `RAD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: Date.now(),
      durationSeconds: durationSec,
      etaTimestamp: Date.now() + (durationSec * 1000),
      stationId: station.id,
      stationName: station.name,
      stationCity: station.city,
      items: { [`pack_radio_${techKey}_${details.pack.id}`]: 1 },
      itemsSummary: [{
        id: `pack_radio_${techKey}_${details.pack.id}`,
        name: `${details.pack.name} • ${details.tech.shortName} (${details.pack.count} postes)`,
        qty: 1,
        price: details.finalPrice,
        total: details.finalPrice,
        image: details.tech.image,
        lucideIcon: 'radio',
        radioTech: techKey,
        radioCount: details.pack.count
      }],
      subtotal: details.finalPrice,
      shippingFee: details.shippingFee,
      totalCost: details.grandTotal,
      supplierId: details.sup.id,
      supplierName: details.sup.name,
      carrier: `${details.sup.name} (${details.sup.badge})`,
      status: 'in_transit'
    };

    game.deliveries.unshift(delivery);
    game.updateStatsUI();
    game.saveGame();

    game.showToast(
      '📻 Commande Radio Expédiée !',
      `Votre ${details.pack.name} (${details.tech.shortName}) a été confié à ${details.sup.shortName}. Livraison estimée dans ${details.delayLabel}.`,
      'blue'
    );

    this.activeTab = 'livraisons';
    this.renderModal(game);
  },

  checkout(game) {
    const { total: subtotal, itemsCount } = this.getCartTotal();
    if (itemsCount === 0) {
      game.showToast('Panier vide', 'Ajoutez du matériel au panier avant de commander.', 'orange');
      return;
    }

    const sup = this.getSupplier(this.selectedSupplierId);
    const shippingFee = this.getShippingFee(subtotal, sup.id);
    const totalToPay = subtotal + shippingFee;

    if (game.resources.money < totalToPay) {
      game.showToast('Trésorerie insuffisante', `Il vous manque ${(totalToPay - game.resources.money).toLocaleString('fr-FR')} € (articles + frais de livraison).`, 'red');
      return;
    }

    const station = this.getActiveStation(game);
    if (!station) {
      game.showToast('Aucune antenne', 'Veuillez sélectionner ou implanter une antenne.', 'orange');
      return;
    }

    this.ensureStationStock(station, game);

    // Débit immédiat de la trésorerie
    game.resources.money -= totalToPay;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -totalToPay,
        `Commande Centrale d'Achats (${itemsCount} articles${shippingFee > 0 ? ` + frais d'envoi ${shippingFee} € (${sup.shortName})` : ' - Port offert'})`,
        'logistique',
        `ACHAT-${Date.now()}`,
        sup.name
      );
    }

    // Préparation des détails des articles commandés
    const orderedItemsSummary = [];
    Object.entries(this.cart).forEach(([id, qty]) => {
      const catItem = this.CATALOG.find(i => i.id === id);
      if (catItem) {
        orderedItemsSummary.push({
          id,
          name: catItem.name,
          qty,
          price: catItem.price,
          total: catItem.price * qty,
          image: catItem.image,
          lucideIcon: catItem.lucideIcon || 'package',
          radioTech: catItem.radioTech,
          radioCount: catItem.radioCount
        });
      }
    });

    if (!Array.isArray(game.deliveries)) game.deliveries = [];
    const durationSec = this.getDeliveryDurationSeconds(sup.id);

    const delivery = {
      id: `deliv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderNumber: `CMD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: Date.now(),
      durationSeconds: durationSec,
      etaTimestamp: Date.now() + (durationSec * 1000),
      stationId: station.id,
      stationName: station.name,
      stationCity: station.city,
      items: { ...this.cart },
      itemsSummary: orderedItemsSummary,
      subtotal,
      shippingFee,
      totalCost: totalToPay,
      supplierId: sup.id,
      supplierName: sup.name,
      carrier: `${sup.name} (${sup.delayLabel})`,
      status: 'in_transit'
    };

    game.deliveries.unshift(delivery);

    // Vider le panier
    this.cart = {};

    // Sauvegarde immédiate
    game.updateStatsUI();
    game.saveGame();

    const minStr = this.formatDeliveryTime(durationSec);
    game.showToast(
      '🚚 Commande Validée & Expédiée !', 
      `Montant réglé : ${totalToPay.toLocaleString('fr-FR')} € ${shippingFee > 0 ? `(dont ${shippingFee} € de livraison)` : '(Livraison offerte)'}. Arrivée estimée sous ${minStr} à ${station.name}.`, 
      'green'
    );

    // Basculer vers le suivi en direct des livraisons
    this.activeTab = 'livraisons';
    this.renderModal(game);
  },

  updateDeliveriesClock(game) {
    if (!game) return;
    if (typeof this.processVehicleArmingTick === 'function') {
      this.processVehicleArmingTick(game, 1);
    }
    if (!Array.isArray(game.deliveries)) return;

    let hasDelivered = false;
    const now = Date.now();

    game.deliveries.forEach(d => {
      if (d && d.status === 'in_transit' && now >= d.etaTimestamp) {
        d.status = 'delivered';
        d.deliveredAt = now;
        hasDelivered = true;

        const station = (game.stations || []).find(s => s.id === d.stationId) || game.stations[0];
        if (d.type === 'vehicle' && d.vehicleData) {
          // Intégration définitive du véhicule réceptionné dans le garage de l'antenne
          const veh = d.vehicleData;
          if (!Array.isArray(game.vehicles)) game.vehicles = [];
          if (!game.vehicles.some(v => v.id === veh.id)) {
            veh.status = 'dispo';
            veh.stationId = station ? station.id : d.stationId;
            game.vehicles.push(veh);
          }
          if (station) {
            if (!Array.isArray(station.vehicles)) station.vehicles = [];
            if (!station.vehicles.includes(veh.id)) {
              station.vehicles.push(veh.id);
            }
          }

          if (typeof game.showToast === 'function') {
            game.showToast(
              '🚑 Véhicule Réceptionné au Garage !',
              `Le convoi est arrivé ! Votre ${veh.name} (${veh.model || veh.label}) vient d'être stationné au garage de « ${station ? station.name : d.stationName} ». Il est prêt pour les interventions !`,
              'green'
            );
          }
          if (window.ProtecNotifications) {
            window.ProtecNotifications.notifyCategory(
              'logistique',
              '🚑 Véhicule Arrivé au Garage !',
              `Le ${veh.name} (${veh.model || veh.label}) est désormais en dotation à « ${station ? station.name : d.stationName} ».`,
              `vehicle-arrived-notif-${veh.id}`
            );
          }
          if (typeof game.renderStations === 'function') {
            game.renderStations();
          }
        } else if (station) {
          this.ensureStationStock(station, game);
          Object.entries(d.items || {}).forEach(([itemId, qty]) => {
            const targetId = (itemId === 'stock_materiels_ps') ? 'caisse_rearmement' : itemId;
            
            // Déballage spécial des packs radios & téléphones
            if (itemId.startsWith('pack_radio_')) {
              const parts = itemId.split('_');
              const techKey = parts[2]; // analogique, lte, hybride
              const packItem = (d.itemsSummary || []).find(it => it.id === itemId);
              const countPerPack = packItem?.radioCount || (itemId.includes('_unit') ? 1 : (itemId.includes('_binome') ? 2 : (itemId.includes('_escouade') ? 4 : (itemId.includes('_valise') ? 10 : 20))));
              const totalRadios = countPerPack * qty;
              const stockKey = `radio_${techKey}`;
              station.stock[stockKey] = (station.stock[stockKey] || 0) + totalRadios;
            } else if (itemId.startsWith('pack_phone_') || itemId.startsWith('pack_telephone_')) {
              const packItem = (d.itemsSummary || []).find(it => it.id === itemId);
              const countPerPack = packItem?.phoneCount || (itemId.includes('_binome') ? 2 : (itemId.includes('_section') ? 5 : (itemId.includes('_flotte') ? 10 : 1)));
              const totalPhones = countPerPack * qty;
              station.stock['telephone_garde'] = (station.stock['telephone_garde'] || 0) + totalPhones;
              if (!game.workplaceEquipment) game.workplaceEquipment = {};
              game.workplaceEquipment['telephone_garde'] = (game.workplaceEquipment['telephone_garde'] || 0) + totalPhones;
              game.workplaceEquipment['phones'] = (game.workplaceEquipment['phones'] || 0) + totalPhones;
            } else {
              station.stock[targetId] = (station.stock[targetId] || 0) + qty;
              if (targetId === 'telephone_garde' || targetId === 'phones') {
                if (!game.workplaceEquipment) game.workplaceEquipment = {};
                game.workplaceEquipment['telephone_garde'] = (game.workplaceEquipment['telephone_garde'] || 0) + qty;
                game.workplaceEquipment['phones'] = (game.workplaceEquipment['phones'] || 0) + qty;
              }
            }

            if (targetId === 'caisse_rearmement') {
              station.stockMaterielsPS = (station.stockMaterielsPS || 0) + (300 * qty);
              station.stock.caisse_rearmement_charges = (station.stock.caisse_rearmement_charges || 0) + (3 * qty);
              game.stockMaterielsPS = station.stockMaterielsPS;
            }

            // Enregistrement de la variante de mannequin des kits de formation réceptionnés
            if (targetId.startsWith('kit_pedago_') || targetId.startsWith('kit_')) {
              const packItem = (d.itemsSummary || []).find(it => it.id === targetId || it.id === itemId);
              if (packItem && packItem.mannequinVariant) {
                if (!game.trainingKitsVariants) game.trainingKitsVariants = {};
                game.trainingKitsVariants[targetId] = packItem.mannequinVariant;
              }
            }
          });

          this.syncToGlobalLogistics(game);

          if (typeof game.showToast === 'function') {
            game.showToast(
              '📦 Commande Réceptionnée !',
              `Le colis « ${d.orderNumber} » vient d'être livré à « ${d.stationName} ». Le matériel a été rangé dans le stock de l'antenne.`,
              'green'
            );
          }
          if (window.ProtecNotifications) {
            window.ProtecNotifications.notifyCategory(
              'logistique',
              '📦 Commande Réceptionnée !',
              `Le colis « ${d.orderNumber} » est arrivé à ${d.stationName}. Matériel rangé dans le stock de l'antenne.`,
              `delivery-arrived-notif-${d.id}`
            );
          }
        }
      }
    });

    if (hasDelivered) {
      game.updateStatsUI();
      game.saveGame();
      if (typeof document !== 'undefined') {
        const modalOpen = document.getElementById('main-modal');
        const title = document.getElementById('modal-title');
        if (modalOpen && !modalOpen.classList.contains('hidden') && title && title.textContent.includes('Centrale d’Achats')) {
          this.renderModal(game);
        }
      }
    } else {
      if (this.activeTab === 'livraisons' && typeof document !== 'undefined') {
        const modalOpen = document.getElementById('main-modal');
        if (modalOpen && !modalOpen.classList.contains('hidden')) {
          this.updateLiveDeliveryTrackers(game);
        }
      }
    }
  },

  formatDeliveryTime(remainingSec) {
    if (remainingSec >= 86400) {
      const d = Math.floor(remainingSec / 86400);
      const h = Math.floor((remainingSec % 86400) / 3600);
      const m = Math.floor((remainingSec % 3600) / 60);
      return `${d}j ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
    } else if (remainingSec >= 3600) {
      const h = Math.floor(remainingSec / 3600);
      const m = Math.floor((remainingSec % 3600) / 60);
      const s = remainingSec % 60;
      return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    } else {
      const m = Math.floor(remainingSec / 60);
      const s = remainingSec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  },

  updateLiveDeliveryTrackers(game) {
    const activeDeliveries = this.getActiveDeliveries(game);
    activeDeliveries.forEach(d => {
      const remainingSec = Math.max(0, Math.ceil((d.etaTimestamp - Date.now()) / 1000));
      const totalSec = d.durationSeconds || 86400;
      const elapsed = Math.max(0, totalSec - remainingSec);
      const progress = Math.min(100, Math.round((elapsed / totalSec) * 100));

      const timerEl = document.getElementById(`delivery-timer-${d.id}`);
      if (timerEl) {
        timerEl.textContent = this.formatDeliveryTime(remainingSec);
      }
      const progressEl = document.getElementById(`delivery-progress-${d.id}`);
      if (progressEl) {
        progressEl.style.width = `${progress}%`;
      }
      const percentEl = document.getElementById(`delivery-percent-${d.id}`);
      if (percentEl) {
        percentEl.textContent = `${progress}%`;
      }
    });
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
    const input = document.getElementById('logistique-search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
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

    if (this.activeTab === 'boutique') {
      this.activeTab = 'stock';
    }

    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');

    if (title) title.textContent = 'Logistique & Stocks Opérationnels';
    if (subtitle) subtitle.textContent = 'Inventaire des stocks d’antennes, suivi des livraisons, dotations radios et réarmement flotte';
    if (icon) icon.setAttribute('data-lucide', 'package-check');

    body.innerHTML = `
      <div class="space-y-4">
        
        <!-- BARRE SUPÉRIEURE : SÉLECTEUR D'ANTENNE & NAVIGATION ONGLETS -->
        <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <!-- Choix de l'antenne concernée -->
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <i data-lucide="building-2" class="w-4 h-4 text-pc-blue flex-shrink-0"></i>
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

          <!-- Onglets Principaux [ Stock | Livraisons | Radios | Flotte ] + Bouton d'accès Boutiques -->
          <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black self-start md:self-auto flex-wrap">
            <button onclick="window.ProtecLogistique.setTab('stock')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'stock' || !this.activeTab ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="package" class="w-4 h-4"></i>
              <span>Stock & Inventaire</span>
            </button>
            <button onclick="window.ProtecLogistique.setTab('livraisons')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'livraisons' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="truck" class="w-4 h-4"></i>
              <span>Suivi Livraisons</span>
              ${this.getActiveDeliveries(game).length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse shadow-xs">${this.getActiveDeliveries(game).length}</span>` : ''}
            </button>
            <button onclick="window.ProtecLogistique.setTab('radios')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'radios' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="radio" class="w-4 h-4"></i>
              <span>Parc Radios & Fréquences</span>
            </button>
            <button onclick="window.ProtecLogistique.setTab('flotte')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'flotte' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              <span>Flotte & Garage</span>
              ${(() => {
                const armingCount = (game.vehicles || []).filter(v => this.isVehicleArming(v)).length;
                return `<span id="logistique-tab-flotte-badge" class="${armingCount > 0 ? 'px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse shadow-xs' : 'hidden'}">${armingCount} ⏳</span>`;
              })()}
            </button>
            <div class="w-px h-5 bg-slate-300 mx-0.5 hidden sm:block"></div>
            <button onclick="window.game.openModule('boutiques')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs hover:brightness-110 cursor-pointer" title="Commander du matériel, tenues ou radios dans les galeries marchandes">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
              <span>Boutiques & Magasins 🛒</span>
            </button>
          </div>
        </div>

        <!-- BANDEAU ÉQUIPE LOGISTIQUE & MISSIONS LOGISTIQUES DES BÉNÉVOLES -->
        ${(() => {
          const logVolunteers = (game.volunteers || []).filter(v =>
            v.poleRoleId === 'benevole_logistique' || v.poleRoleId === 'resp_logistique' ||
            (game.poles ? game.poles.find(p => p.id === 'logistique')?.assignedVolunteerIds.includes(v.id) : false)
          );
          const respLog = (game.volunteers || []).find(v => v.poleRoleId === 'resp_logistique') ||
            (game.poles ? game.volunteers.find(v => v.id === game.poles.find(p => p.id === 'logistique')?.responsibleId) : null);

          return `
            <div class="p-3.5 rounded-2xl border ${logVolunteers.length > 0 ? 'bg-gradient-to-r from-teal-50 via-sky-50 to-slate-50 border-teal-300' : 'bg-slate-50 border-slate-200'} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl ${logVolunteers.length > 0 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'} flex items-center justify-center font-black text-lg shadow-sm">
                  <i data-lucide="wrench" class="w-5 h-5"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-black uppercase text-slate-900 tracking-wide">Équipe Logistique d'Antenne</span>
                    <span class="px-2 py-0.2 rounded-full text-[9px] font-black ${logVolunteers.length > 0 ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}">
                      ${logVolunteers.length} secouriste(s) en charge
                    </span>
                    ${respLog ? `<span class="text-[10px] text-teal-900 font-bold hidden md:inline">• Resp : ${respLog.name}</span>` : ''}
                  </div>
                  <div class="text-[11px] text-slate-600">
                    ${logVolunteers.length > 0 
                      ? `<em>Ce sont les bénévoles qui gèrent les missions de logistique : réarmement automatique des VPSP/VTU rentrant de mission et suivi des consommables.</em>` 
                      : `Nommez des Bénévoles Logistique dans l'onglet Pôles pour leur confier les missions de réarmement automatique.`}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                ${logVolunteers.length > 0 ? `
                  <div class="px-3 py-1.5 rounded-xl bg-teal-100/80 border border-teal-300 text-teal-900 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                    <span class="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                    <span>Gestion Missions Logistiques Active</span>
                  </div>
                ` : `
                  <button onclick="window.game.openModule('poles')" class="px-3 py-1.5 rounded-xl bg-pc-blue text-white text-xs font-black hover:bg-pc-blue-light transition shadow-sm flex items-center gap-1 cursor-pointer">
                    <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                    <span>Affecter Bénévoles</span>
                  </button>
                `}
              </div>
            </div>
          `;
        })()}

        <!-- CONTENU DYNAMIQUE SELON L'ONGLET ACTIF -->
        ${this.activeTab === 'radios' ? this.renderRadiosHTML(game, station) : ''}
        ${this.activeTab === 'livraisons' ? this.renderLivraisonsHTML(game, station) : ''}
        ${this.activeTab === 'stock' || !this.activeTab ? this.renderStockHTML(game, station) : ''}
        ${this.activeTab === 'flotte' ? this.renderFlotteHTML(game, station) : ''}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // 6. ONGLET BOUTIQUE EN LIGNE (SHOPPING & PANIER)
  // =========================================================================

  renderBoutiqueHTML(game, station) {
    return `
      <div class="p-8 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center">
          <i data-lucide="shopping-bag" class="w-8 h-8"></i>
        </div>
        <div class="max-w-md mx-auto space-y-1.5">
          <h3 class="text-base font-black text-slate-900">Achats centralisés dans les Boutiques & Magasins</h3>
          <p class="text-xs text-slate-500">Pour simplifier la gestion, l'ensemble des achats de matériel, consommables, lots et tenues se fait désormais exclusivement via l'onglet dédié <strong>Boutiques & Magasins</strong>.</p>
        </div>
        <div class="pt-2">
          <button onclick="window.game.openModule('boutiques')" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pc-blue to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer">
            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            <span>Accéder aux Boutiques & Magasins</span>
          </button>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 6.bis ONGLET SUIVI DES LIVRAISONS EN DIRECT
  // =========================================================================


  // =========================================================================
  // 6.ter ONGLET DÉDIÉ TRANSMISSIONS & RADIOS (ANALOGIQUE, LTE, HYBRIDE)
  // =========================================================================
  renderRadiosHTML(game, station) {
    const techKey = this.selectedRadioTech || 'analogique';
    const tech = (this.RADIO_TECH && this.RADIO_TECH[techKey]) || this.RADIO_TECH.analogique;
    const selectedPackId = this.selectedRadioPack || 'binome';
    const selectedSupplierId = this.selectedRadioSupplierId || 'ondepro';
    const details = this.getRadioPackDetails(techKey, selectedPackId, selectedSupplierId);

    const stockAnalog = station?.stock?.radio_analogique || 0;
    const stockLte = station?.stock?.radio_lte || 0;
    const stockHybride = station?.stock?.radio_hybride || 0;
    const totalRadios = stockAnalog + stockLte + stockHybride;

    return `
      <div class="space-y-4">
        
        <!-- BANDEAU SUPÉRIEUR TRANSMISSIONS -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400 flex items-center justify-center font-black shadow-inner">
              <i data-lucide="radio" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-black uppercase tracking-wider text-indigo-300">Pôle Télécoms & Fréquences</span>
                <span class="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">Normes Sécurité Civile</span>
              </div>
              <h3 class="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">Équipements Radio, Liaisons Tactiques & Réseaux LTE</h3>
              <p class="text-[11px] text-slate-300">Approvisionnez vos équipes en terminaux radio adaptés à vos missions. Packs à tarifs dégressifs et comparateur fournisseurs multi-délais.</p>
            </div>
          </div>

          <!-- Compteurs de radios en dotation à l'antenne -->
          <div class="flex items-center gap-2 self-start md:self-auto flex-wrap bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <div class="px-2.5 py-1 text-center">
              <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Analogique</span>
              <span class="text-sm font-black font-mono text-white">${stockAnalog}</span>
            </div>
            <div class="w-px h-6 bg-white/10"></div>
            <div class="px-2.5 py-1 text-center">
              <span class="text-[9px] uppercase tracking-wider text-sky-400 font-bold block">LTE 4G/5G</span>
              <span class="text-sm font-black font-mono text-sky-300">${stockLte}</span>
            </div>
            <div class="w-px h-6 bg-white/10"></div>
            <div class="px-2.5 py-1 text-center">
              <span class="text-[9px] uppercase tracking-wider text-indigo-400 font-bold block">Hybride</span>
              <span class="text-sm font-black font-mono text-indigo-300">${stockHybride}</span>
            </div>
            <div class="w-px h-6 bg-white/10"></div>
            <div class="px-2.5 py-1 text-center">
              <span class="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">Total Parc</span>
              <span class="text-sm font-black font-mono text-emerald-400">${totalRadios} postes</span>
            </div>
          </div>
        </div>

        <!-- 1. SÉLECTEUR DES 3 TECHNOLOGIES RADIO -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 px-1">
            <span>1. Choisissez la Technologie Radio :</span>
            <span class="text-[11px] text-slate-400 font-normal">Du talkie économique local à l'hybride ANTARES crypté</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${Object.entries(this.RADIO_TECH || {}).map(([key, item]) => {
              const isSelected = (techKey === key);
              return `
                <div onclick="window.ProtecLogistique.setRadioTech('${key}')" class="p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${isSelected ? 'bg-indigo-50/70 border-indigo-600 shadow-md ring-2 ring-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-400 dark:ring-indigo-900/50' : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-850 shadow-xs'}">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider ${item.badgeColor}">
                        ${item.badge}
                      </span>
                      <span class="text-xs font-black font-mono text-slate-900 dark:text-white">${item.unitPrice} € <span class="text-[10px] text-slate-400 font-normal">/ unité</span></span>
                    </div>

                    <div class="flex items-center gap-2.5 pt-1">
                      <div class="w-10 h-10 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'} flex items-center justify-center font-black flex-shrink-0">
                        <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                      </div>
                      <div>
                        <h4 class="text-xs font-black text-slate-900 dark:text-white leading-tight">${item.shortName}</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">${item.name}</p>
                      </div>
                    </div>

                    <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-snug pt-1">${item.desc}</p>
                  </div>

                  <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[10px]">
                    ${(item.advantages || []).map(adv => `
                      <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span class="text-emerald-500 font-black">✓</span>
                        <span>${adv}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 2. SÉLECTION DES PACKS & QUANTITÉS (TARIFS DÉGRESSIFS) -->
        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 px-1">
            <span>2. Choisissez le Conditionnement / Pack :</span>
            <span class="text-[11px] text-emerald-600 font-bold">Tarifs dégressifs jusqu'à -22% de remise</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            ${(this.RADIO_PACKS || []).map(p => {
              const isSelected = (selectedPackId === p.id);
              const packRaw = Math.round(tech.unitPrice * p.count * (1 - p.discountPct / 100));
              const unitEffective = Math.round(packRaw / p.count);

              return `
                <div onclick="window.ProtecLogistique.setRadioPack('${p.id}')" class="p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-2 ${isSelected ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-800' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white'}">
                  <div>
                    <div class="flex items-center justify-between gap-1 mb-1">
                      <span class="text-[10px] font-black uppercase ${isSelected ? 'text-indigo-200' : 'text-slate-400'}">${p.count} Poste${p.count > 1 ? 's' : ''}</span>
                      ${p.discountPct > 0 ? `
                        <span class="px-1.5 py-0.2 rounded text-[9px] font-black ${isSelected ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}">
                          -${p.discountPct}%
                        </span>
                      ` : ''}
                    </div>
                    <h5 class="text-xs font-black leading-tight">${p.name}</h5>
                    <p class="text-[10px] mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'} line-clamp-2">${p.contents}</p>
                  </div>

                  <div class="pt-2 border-t ${isSelected ? 'border-indigo-500/60' : 'border-slate-100 dark:border-slate-800'}">
                    <div class="font-mono font-black text-sm">${packRaw.toLocaleString('fr-FR')} €</div>
                    <div class="text-[9px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}">soit ${unitEffective} € / radio</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. COMPARATEUR DE FOURNISSEURS FICTIFS & DÉLAIS DE LIVRAISON -->
        <div class="p-4 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-md space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div>
              <div class="flex items-center gap-2">
                <i data-lucide="building-2" class="w-4 h-4 text-indigo-600 dark:text-indigo-400"></i>
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">3. Fournisseurs Agréés & Délais de Livraison</h4>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">Chaque fournisseur applique ses propres tarifs, délais d'expédition et conditions de frais de port.</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-indigo-600 dark:text-indigo-400">Pack sélectionné : <strong>${details.pack.name} (${details.tech.shortName})</strong></span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            ${(this.SUPPLIERS || []).map(sup => {
              const packDetails = this.getRadioPackDetails(techKey, selectedPackId, sup.id);
              const isSelected = (selectedSupplierId === sup.id);

              return `
                <div onclick="window.ProtecLogistique.setRadioSupplier('${sup.id}')" class="p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${isSelected ? 'bg-indigo-50/80 border-indigo-600 shadow-md ring-2 ring-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-400 dark:ring-indigo-900/50' : 'bg-slate-50 hover:bg-white border-slate-200 dark:bg-slate-850 dark:border-slate-800 shadow-xs'}">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="px-2 py-0.5 rounded text-[9px] font-black ${sup.badgeClass}">
                        ${sup.badge}
                      </span>
                      ${isSelected ? '<span class="text-indigo-600 dark:text-indigo-400 font-black text-xs">✓ Sélectionné</span>' : ''}
                    </div>

                    <div>
                      <h5 class="text-xs font-black text-slate-900 dark:text-white leading-tight">${sup.name}</h5>
                      <span class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">${sup.specialty}</span>
                    </div>

                    <div class="space-y-1 text-[10.5px] pt-1">
                      <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">Prix Matériel :</span>
                        <strong class="font-mono text-slate-800 dark:text-slate-200">${packDetails.finalPrice.toLocaleString('fr-FR')} €</strong>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">Livraison :</span>
                        ${packDetails.shippingFee === 0 ? `
                          <strong class="font-bold text-emerald-600">OFFERTE (0 €)</strong>
                        ` : `
                          <strong class="font-mono text-amber-600">+${packDetails.shippingFee} €</strong>
                        `}
                      </div>
                      <div class="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-black text-xs">
                        <span>Total TTC :</span>
                        <span class="text-indigo-700 dark:text-indigo-300 font-mono">${packDetails.grandTotal.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div class="text-[9.5px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-0.5">
                        <i data-lucide="clock" class="w-3 h-3 text-slate-400"></i>
                        <span>Délai : <strong>${sup.delayLabel}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div class="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button onclick="if(window.ProtecBoutiques){ window.ProtecBoutiques.activeShopId='hexacom_telecoms'; window.ProtecBoutiques.activeRayonId='${techKey === 'analogique' ? 'analogique' : (techKey === 'lte' ? 'lte' : 'hybride')}'; } window.game.openModule('boutiques');" class="w-full py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                      <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
                      <span>Commander en Boutique HexaCom</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  },

  renderLivraisonsHTML(game, station) {
    const deliveries = Array.isArray(game.deliveries) ? [...game.deliveries] : [];
    const activeDeliveries = deliveries.filter(d => d.status === 'in_transit')
      .sort((a, b) => a.etaTimestamp - b.etaTimestamp);
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered')
      .sort((a, b) => (b.deliveredAt || b.etaTimestamp) - (a.deliveredAt || a.etaTimestamp))
      .slice(0, 10);

    const now = Date.now();
    const freeThreshold = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('shippingFreeThreshold', 350) : 350;
    const baseFee = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('shippingBaseFee', 35) : 35;

    return `
      <div class="space-y-4">
        <!-- Bandeau d'information logistique & règles de transport -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner flex-shrink-0">
              <i data-lucide="truck" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <h4 class="text-xs sm:text-sm font-black leading-tight">Centre de Dispatching Logistique & Expéditions</h4>
              <p class="text-[11px] text-amber-100">Frais forfaitaires de groupage : ${baseFee} € • Offerts dès ${freeThreshold} € d'achats groupés • Délais d'acheminement en temps réel</p>
            </div>
          </div>
          <div class="hidden sm:flex items-center gap-2 text-right">
            <div class="px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur border border-white/20 text-xs font-mono font-bold">
              ${activeDeliveries.length} en transit
            </div>
          </div>
        </div>

        ${activeDeliveries.length === 0 && completedDeliveries.length === 0 ? `
          <!-- État vide : Aucune commande -->
          <div class="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div class="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <i data-lucide="package-search" class="w-8 h-8 text-slate-400 stroke-1"></i>
            </div>
            <div class="max-w-md mx-auto space-y-1">
              <h4 class="text-sm font-black text-slate-800">Aucune expédition en cours</h4>
              <p class="text-xs text-slate-500">Passez commande dans la centrale d'achats pour approvisionner vos réserves. Suivez ici la progression en direct des camions transporteurs.</p>
            </div>
            <button onclick="window.game.openModule('boutiques')" class="px-4 py-2 rounded-xl bg-gradient-to-r from-pc-blue to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-xs transition inline-flex items-center gap-2 cursor-pointer">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
              <span>Ouvrir la Boutique</span>
            </button>
          </div>
        ` : `
          <!-- Section 1 : Livraisons actives en cours de route -->
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs font-black text-slate-700">
              <span class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span>Expéditions En Transit (${activeDeliveries.length})</span>
              </span>
              <span class="text-[11px] text-slate-400 font-normal">Mise à jour automatique chaque seconde</span>
            </div>

            ${activeDeliveries.length === 0 ? `
              <div class="p-5 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-2">
                <p class="text-xs text-slate-500 font-semibold">Aucun convoi actuellement sur les routes.</p>
                <button onclick="window.game.openModule('boutiques')" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                  <span>Commander du matériel</span>
                </button>
              </div>
            ` : `
              <div class="grid grid-cols-1 gap-3">
                ${activeDeliveries.map(d => {
                  const remainingSec = Math.max(0, Math.ceil((d.etaTimestamp - now) / 1000));
                  const totalSec = d.durationSeconds || 86400;
                  const elapsed = Math.max(0, totalSec - remainingSec);
                  const progress = Math.min(100, Math.round((elapsed / totalSec) * 100));
                  const m = Math.floor(remainingSec / 60);
                  const s = remainingSec % 60;
                  const timeFormatted = this.formatDeliveryTime(remainingSec);
                  const orderDate = new Date(d.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  const isVeh = d.type === 'vehicle';
                  const step1Done = !isVeh || d.isUsed || progress >= 50;
                  const step1Active = isVeh && !d.isUsed && progress < 50;
                  const step2Done = progress >= 98;
                  const step2Active = !step1Active && progress < 98;
                  const step3Active = progress >= 98;

                  return `
                    <div class="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:shadow-md transition space-y-3.5">
                      <!-- En-tête commande -->
                      <div class="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-2.5">
                        <div class="flex items-center gap-2.5">
                          <div class="w-9 h-9 rounded-xl ${d.type === 'vehicle' ? (d.isUsed ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-pc-blue') : 'bg-amber-100 text-amber-700'} flex items-center justify-center font-black">
                            <i data-lucide="${d.type === 'vehicle' ? (d.isUsed ? 'car' : 'truck') : 'truck'}" class="w-5 h-5"></i>
                          </div>
                          <div>
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="text-xs font-black text-slate-900 font-mono">${d.type === 'vehicle' ? (d.isUsed ? 'Convoi Occasion' : 'Acheminement Véhicule') : 'Colis'} #${d.orderNumber}</span>
                              <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${d.type === 'vehicle' ? (d.isUsed ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-blue-100 text-blue-900 border-blue-300') : 'bg-amber-100 text-amber-800 border-amber-300/80'} border flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full ${d.type === 'vehicle' ? 'bg-pc-blue animate-pulse' : 'bg-amber-500 animate-pulse'}"></span>
                                ${d.type === 'vehicle' ? (d.isUsed ? 'En convoyage routier' : 'En transit usine') : 'En route'}
                              </span>
                            </div>
                            <div class="text-[11px] text-slate-500 mt-0.5">
                              Destination : <strong class="text-slate-800">${d.stationName}</strong> • ${d.type === 'vehicle' && d.isUsed ? `Origine : <strong class="text-slate-700">${d.sellerStationName || 'Antenne Vendeuse'}</strong> (${d.distKm || 0} km)` : `Commandé à ${orderDate}`}
                            </div>
                          </div>
                        </div>

                        <!-- Compte à rebours dynamique -->
                        <div class="text-right">
                          <span class="text-[10px] uppercase tracking-wider text-slate-400 font-black block">Livraison estimée</span>
                          <div class="flex items-baseline gap-1 justify-end">
                            <span id="delivery-timer-${d.id}" class="text-xl font-mono font-black text-amber-600">${timeFormatted}</span>
                            <span class="text-xs text-slate-400 font-bold">restant</span>
                          </div>
                        </div>
                      </div>

                      <!-- Stepper visuel 3 étapes -->
                      <div class="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                        <div class="p-2 rounded-xl ${step1Done ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-300 text-amber-800'} flex flex-col items-center gap-1">
                          <i data-lucide="${step1Done ? 'package-check' : 'wrench'}" class="w-4 h-4 ${step1Done ? 'text-emerald-600' : 'text-amber-600 animate-spin'}"></i>
                          <span>${isVeh ? (d.isUsed ? '1. Cession & Clés' : '1. Aménagement Usine') : '1. Préparation FNPC'}</span>
                          <span class="text-[9px] ${step1Done ? 'text-emerald-600' : 'text-amber-700 font-black'} font-mono">${step1Done ? 'Terminée' : `En cours (${Math.min(99, Math.round(progress * 2))}%)`}</span>
                        </div>
                        <div class="p-2 rounded-xl ${step2Done ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : (step2Active ? 'bg-amber-50 border border-amber-300 text-amber-800' : 'bg-slate-50 border border-slate-200 text-slate-400')} flex flex-col items-center gap-1">
                          <i data-lucide="${isVeh ? (d.isUsed ? 'car' : 'truck') : 'truck'}" class="w-4 h-4 ${step2Done ? 'text-emerald-600' : (step2Active ? 'text-amber-600 animate-bounce' : 'text-slate-400')}"></i>
                          <span>${isVeh ? (d.isUsed ? '2. Convoyage Routier' : '2. Convoi Porte-Engins') : '2. Convoi Routier'}</span>
                          <span id="delivery-percent-${d.id}" class="text-[9px] ${step2Done ? 'text-emerald-600 font-mono font-black' : (step2Active ? 'text-amber-700 font-mono font-black' : 'text-slate-400 font-mono')}">${step2Done ? 'Arrivé' : (step2Active ? `${progress}%` : 'En attente')}</span>
                        </div>
                        <div class="p-2 rounded-xl ${step3Active ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 animate-pulse' : 'bg-slate-50 border border-slate-200 text-slate-400'} flex flex-col items-center gap-1">
                          <i data-lucide="warehouse" class="w-4 h-4 ${step3Active ? 'text-emerald-600' : 'text-slate-400'}"></i>
                          <span>${isVeh ? '3. Remisage Hangar' : '3. Stockage Réserve'}</span>
                          <span class="text-[9px] ${step3Active ? 'text-emerald-700 font-mono font-black' : 'text-slate-400 font-mono'}">${step3Active ? 'Réception imminente' : 'En attente'}</span>
                        </div>
                      </div>

                      <!-- Barre de progression -->
                      <div class="space-y-1">
                        <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                          <div id="delivery-progress-${d.id}" class="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-1000" style="width: ${progress}%;"></div>
                        </div>
                        <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>Plateforme Logistique</span>
                          <span>Antenne ${d.stationName}</span>
                        </div>
                      </div>

                      <!-- Contenu du colis ou véhicule -->
                      <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs flex-wrap">
                        <div class="flex items-center gap-2 flex-wrap">
                          ${d.type === 'vehicle' && d.vehicleData?.image ? `
                            <img src="${d.vehicleData.image}" alt="${d.vehicleData.name}" class="w-12 h-8 object-contain rounded-lg bg-slate-100 border p-0.5" />
                          ` : ''}
                          <div>
                            <span class="text-[11px] font-bold text-slate-500">${d.type === 'vehicle' ? 'Véhicule :' : 'Contenu :'}</span>
                            <span class="text-[11px] text-slate-800 font-extrabold ml-1">${d.type === 'vehicle' ? `${d.vehicleData?.name || d.itemsSummary} (${d.vehicleData?.model || ''})` : (d.itemsSummary || 'Matériels divers')}</span>
                            ${d.type === 'vehicle' && d.vehicleData?.installedOptions && d.vehicleData.installedOptions.length > 0 ? `
                              <div class="flex flex-wrap gap-1 mt-1">
                                ${d.vehicleData.installedOptions.map(opt => `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">🛠️ ${opt}</span>`).join('')}
                              </div>
                            ` : ''}
                          </div>
                        </div>
                        <div class="text-right text-[11px] font-mono">
                          <span class="text-slate-400">Valeur : </span>
                          <strong class="text-slate-900 font-black">${d.totalCost.toLocaleString('fr-FR')} €</strong>
                          ${d.type === 'vehicle' ? `
                            <span class="text-[10px] text-emerald-600 font-bold block">${d.isUsed ? `Convoyage routier (${d.distKm} km)` : (d.deliveryDetails?.label ? `Délai usine : ${d.deliveryDetails.label}` : `Délai usine (${d.delayDays || 1}j)`)}</span>
                          ` : `
                            <span class="text-[10px] text-slate-400">(${d.shippingFee === 0 ? 'Port offert' : `Frais port : ${d.shippingFee} €`})</span>
                          `}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- Section 2 : Historique des commandes livrées -->
          ${completedDeliveries.length > 0 ? `
            <div class="space-y-3 pt-3 border-t border-slate-200">
              <div class="flex items-center justify-between text-xs font-black text-slate-700">
                <span class="flex items-center gap-2">
                  <i data-lucide="history" class="w-4 h-4 text-slate-400"></i>
                  <span>Dernières Commandes Réceptionnées (${completedDeliveries.length})</span>
                </span>
                <span class="text-[11px] text-slate-400 font-normal">Disponibles dans le stock</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                ${completedDeliveries.map(d => {
                  const deliveredDate = d.deliveredAt ? new Date(d.deliveredAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  }) : 'Récemment';

                  return `
                    <div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2">
                      <div class="flex items-center justify-between gap-1">
                        <div class="flex items-center gap-1.5">
                          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span class="text-xs font-black text-slate-900 font-mono">#${d.orderNumber}</span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-800">
                          Livré
                        </span>
                      </div>
                      
                      <p class="text-[11px] text-slate-600 line-clamp-1">${d.type === 'vehicle' ? `🚑 ${d.vehicleData?.name || d.itemsSummary} (${d.vehicleData?.model || ''}) - Stationné au garage` : (d.itemsSummary || 'Articles livrés')}</p>
                      
                      <div class="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
                        <span>${d.stationName} • ${deliveredDate}</span>
                        <span class="font-mono font-bold text-slate-800">${d.totalCost.toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        `}
      </div>
    `;
  },

  // =========================================================================
  // 7. ONGLET STOCK DE L'ANTENNE (INVENTAIRE RÉEL)
  // =========================================================================

  getStockItemInfo(id) {
    let item = this.CATALOG.find(i => i.id === id);
    if (item) return item;

    if (id === 'telephone_garde' || id === 'phones') {
      return {
        id: 'telephone_garde',
        name: 'Téléphone de service',
        price: 190,
        badge: 'Garde & DPS',
        image: 'images/equipements/telephone_garde.png',
        lucideIcon: 'smartphone'
      };
    }
    
    if (id === 'radio_analogique') {
      return {
        id: 'radio_analogique',
        name: 'Radios Analogiques VHF/UHF (PMR446)',
        price: 90,
        badge: 'Transmissions Locales (1-3 km)',
        image: 'images/equipements/thumbs/radio_antares.png',
        lucideIcon: 'radio'
      };
    }
    if (id === 'radio_lte') {
      return {
        id: 'radio_lte',
        name: 'Radios Numériques LTE (4G / 5G Push-To-Talk)',
        price: 260,
        badge: 'Réseau Cellulaire National',
        image: 'images/equipements/thumbs/radio_antares.png',
        lucideIcon: 'smartphone'
      };
    }
    if (id === 'radio_hybride') {
      return {
        id: 'radio_hybride',
        name: 'Radios Hybrides Tactiques Bi-Mode (ANTARES + LTE)',
        price: 580,
        badge: 'Sécurité Civile / Inter-opérable',
        image: 'images/equipements/thumbs/radio_antares.png',
        lucideIcon: 'shield-alert'
      };
    }
    return null;
  },

  renderStockHTML(game, station) {
    if (!station) {
      return `<p class="p-6 text-center text-xs text-slate-500">Aucune antenne disponible.</p>`;
    }

    const stock = station.stock || {};
    const stockEntries = Object.entries(stock).filter(([id, qty]) => qty > 0);

    let totalStockValue = 0;
    let totalItemsCount = 0;

    stockEntries.forEach(([id, qty]) => {
      const item = this.getStockItemInfo(id);
      if (item) {
        totalStockValue += item.price * qty;
        totalItemsCount += qty;
      }
    });

    return `
      <!-- BANDEAU INCITATIF VERS LES BOUTIQUES -->
      <div class="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0 text-white">
            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-black leading-tight">Réapprovisionner les réserves de cette antenne</h4>
            <p class="text-[11px] text-blue-200">Pharmacie, lots de secours A/B/C, tenues, matériel technique et consommables sont disponibles en boutique officielle.</p>
          </div>
        </div>
        <button onclick="window.game.openModule('boutiques')" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer">
          <i data-lucide="shopping-bag" class="w-4 h-4"></i>
          <span>Ouvrir les Boutiques & Magasins</span>
        </button>
      </div>

      <!-- CARTE RÉCAPITULATIVE DE L'INVENTAIRE DE L'ANTENNE -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div class="flex items-center justify-between text-xs font-black text-slate-500">
            <span>Articles en Réserve</span>
            <i data-lucide="package" class="w-4 h-4 text-slate-400"></i>
          </div>
          <div class="text-2xl font-black text-slate-900 font-mono">${totalItemsCount}</div>
          <p class="text-[10.5px] text-slate-500">${stockEntries.length} références différentes</p>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div class="flex items-center justify-between text-xs font-black text-slate-500">
            <span>Valeur Marchande du Stock</span>
            <i data-lucide="wallet" class="w-4 h-4 text-emerald-500"></i>
          </div>
          <div class="text-2xl font-black text-pc-blue font-mono">${totalStockValue.toLocaleString('fr-FR')} €</div>
          <p class="text-[10.5px] text-slate-500">Actifs matériels de la caserne</p>
        </div>

        <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div class="flex items-center justify-between text-xs font-black text-slate-500">
            <span>Localisation du Stock</span>
            <i data-lucide="building-2" class="w-4 h-4 text-pc-blue"></i>
          </div>
          <div class="text-sm font-black text-slate-900 truncate">${station.name}</div>
          <button onclick="window.game.openModule('boutiques')" class="text-[11px] font-black text-pc-blue hover:underline flex items-center gap-1 mt-1 cursor-pointer">
            <span>+ Commander du réassort</span>
            <i data-lucide="arrow-right" class="w-3 h-3"></i>
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
            <i data-lucide="package-open" class="w-10 h-10 mx-auto text-slate-300 stroke-1 block"></i>
            <p class="text-xs font-bold text-slate-600">Aucun matériel entreposé dans cette antenne.</p>
            <p class="text-[11px] text-slate-500">Visitez la centrale d’achats pour équiper votre réserve en lots et médicaments.</p>
            <button onclick="window.game.openModule('boutiques')" class="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pc-blue to-indigo-600 hover:brightness-110 text-white text-xs font-black shadow transition flex items-center gap-1.5 mx-auto cursor-pointer">
              <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
              <span>Ouvrir la Boutique en Ligne</span>
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${stockEntries.map(([id, qty]) => {
              const item = this.getStockItemInfo(id);
              if (!item) return '';

              return `
                <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="relative w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden">
                      ${this.hasRealImage(item.image) ? `
                        <img src="${this.getThumb(item.image)}" 
                             alt="${item.name}" 
                             loading="lazy"
                             onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${item.image}'; }"
                             class="w-full h-full object-contain p-1" />
                      ` : `
                        <div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                          <i data-lucide="${item.lucideIcon || 'package'}" class="w-6 h-6 text-pc-blue stroke-[1.75]"></i>
                        </div>
                      `}
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
                    <button onclick="window.game.openModule('boutiques')" class="text-[10px] font-bold text-pc-blue hover:underline flex items-center gap-1 cursor-pointer" title="Acheter dans les Boutiques">
                      <i data-lucide="plus" class="w-3 h-3"></i>
                      <span>Racheter</span>
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

  // Actions de logistique post-mission, réarmement, désinfection et maintenance flotte (temporisé via armingQueue)
  rearmAndDisinfectVehicle(game, vehicleId) {
    if (!game) game = window.game;
    const v = (game.vehicles || []).concat(game.allVehicles || []).find(veh => veh.id === vehicleId);
    if (!v) return;
    this.normalizeVehicle(v);

    if (v.armingQueue.some(op => op.type === 'rearm_sanitaire')) {
      game.showToast('Réarmement déjà en cours ⏳', `${v.name} est déjà dans la file de réarmement sanitaire et bionettoyage.`, 'orange');
      return;
    }

    if (v.consumables >= 100 && !v.a_rearme && !v.needsRearming && !v.disinfectionNeeded) {
      game.showToast('Véhicule 100% Opérationnel ✓', `${v.name} est déjà réarmé et désinfecté à 100%.`, 'green');
      return;
    }

    const station = game.stations?.find(s => s.id === v.stationId) || game.stations?.[0];
    this.ensureStationStock(station, game);

    const hasWaterPoint = Boolean(station?.premises?.rooms?.sas_desinfection_pharmacie?.hasWaterPoint || (station?.premises?.rooms?.sas_desinfection_pharmacie?.level >= 2));

    const hasCaisse = (station.stock?.caisse_rearmement && station.stock.caisse_rearmement >= 1);
    const hasStockPS = (station.stockMaterielsPS && station.stockMaterielsPS >= 20);

    if (hasCaisse) {
      station.stock.caisse_rearmement -= 1;
      if (station.stock.caisse_rearmement_charges !== undefined) {
        station.stock.caisse_rearmement_charges = Math.max(0, station.stock.caisse_rearmement_charges - 1);
      }
    } else if (hasStockPS) {
      station.stockMaterielsPS -= 20;
      game.stockMaterielsPS = station.stockMaterielsPS;
    } else {
      // Si consommables manquants au local, forfait kit réarmement pharmacie (divisé par 2 si point d'eau/centrale présente : 22 € au lieu de 45 €)
      const cost = hasWaterPoint ? 22 : 45;
      if (game.resources.money < cost) {
        game.showToast('Stock insuffisant & Fonds manquants', `Le réarmement requiert 1 Caisse de réarmement en stock ou ${cost} € de réassort express.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -cost, `Achat Pack Réarmement & Bionettoyage VPSP ${hasWaterPoint ? '(Centrale SAS intégrée)' : ''}`, 'materiel');
      }
    }

    this.queueSanitaryRearmForVehicle(v, station, game, hasWaterPoint);

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  queueSanitaryRearmForVehicle(v, station, game, hasWaterPoint = false) {
    if (!v) return;
    if (!game) game = window.game;
    this.normalizeVehicle(v);

    if (v.armingQueue.some(op => op.type === 'rearm_sanitaire')) return;

    // Durée : 3 min (180s) en standard, réduite de moitié à 1 min 30 (90s) si Centrale SAS / point d'eau installé
    const durationSec = hasWaterPoint ? 90 : (this.LOT_ARM_DURATION_SEC || 180);
    const op = {
      opId: `op_rearm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'rearm_sanitaire',
      stationId: station ? station.id : v.stationId,
      itemName: `Réarmement O2 / Soins & Bionettoyage${hasWaterPoint ? ' (SAS Express)' : ''}`,
      slots: 0,
      totalSec: durationSec,
      remainingSec: durationSec,
      queuedAt: Date.now()
    };

    if (!v.lastArmingTickAt) v.lastArmingTickAt = Date.now();
    v.armingQueue.push(op);

    // Auto-affecter un bénévole disponible au garage si aucun n'est encore sur le véhicule
    const autoVol = this.autoAssignPersonnelForArmingIfNeeded(v, null, game);
    const hasStaff = this.hasActivePersonnelForArming(v, game);
    const effSec = this.getVehicleEffectiveArmingRemainingSec(v, game);

    if (hasStaff) {
      game.showToast(
        'Réarmement & Bionettoyage lancé ⏳',
        `${v.name} est pris en charge au garage${autoVol ? ` par ${autoVol.name}` : ''} (~${this.formatArmingClock(effSec)}).`,
        'blue'
      );
    } else {
      game.showToast(
        'Réarmement en attente de bénévole 👷',
        `Consommables réservés pour ${v.name}. Affectez un bénévole disponible au garage pour démarrer le bionettoyage (${this.formatArmingClock(durationSec)}) !`,
        'orange'
      );
    }

    this.ensureArmingInterval(game);
  },

  // Réparation mécanique au garage agréé (ou atelier interne de l'antenne si installé)
  repairVehicleGarage(game, vehicleId) {
    const v = (game.vehicles || []).find(veh => veh.id === vehicleId);
    if (!v) return;

    const station = game.stations?.find(s => s.id === v.stationId) || game.stations?.[0];
    const hasAtelier = station?.premises?.rooms?.garage_remisage?.hasAtelierMecanique;
    // Si l'antenne a aménagé un atelier mécanique, les réparations sont faites en interne (-50% du coût)
    const cost = hasAtelier ? 225 : 450;

    if (game.resources.money < cost) {
      game.showToast('Fonds insuffisants', `La réparation mécanique requiert ${cost} € ${hasAtelier ? '(Atelier interne -50%)' : '(Garage externe)'}.`, 'orange');
      return;
    }

    game.resources.money -= cost;
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game, 
        -cost, 
        hasAtelier ? `Réparation mécanique atelier interne antenne : ${v.name}` : `Réparation mécanique garage partenaire : ${v.name}`, 
        'materiel'
      );
    }

    v.mechanical = 95;
    v.isBrokenDown = false;
    if (v.status === 'en_panne') {
      v.status = v.a_rearme ? 'a_rearme' : 'dispo';
    }

    const atelierNotice = hasAtelier ? ' Réparé dans l\'atelier mécanique interne de l\'antenne (-50% d\'économies).' : ' Facturé au tarif garage partenaire.';
    game.showToast('Véhicule Réparé 🔧', `${v.name} est révisé avec succès (mécanique à 95%).${atelierNotice}`, 'green');
    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  // Passage du contrôle technique réglementaire
  passControleTechnique(game, vehicleId) {
    const v = (game.vehicles || []).find(veh => veh.id === vehicleId);
    if (!v) return;

    const cost = 120;
    if (game.resources.money < cost) {
      game.showToast('Fonds insuffisants', `Le contrôle technique réglementaire requiert ${cost} €.`, 'orange');
      return;
    }

    game.resources.money -= cost;
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -cost, `Contrôle Technique Poids Lourd / VPSP : ${v.name}`, 'materiel');
    }

    v.needsControleTechnique = false;
    v.controleTechniqueKm = v.kilometrage || 115000;
    v.lastControleTechniqueDate = {
      year: game.clock?.year || 2026,
      month: game.clock?.month || 9,
      day: game.clock?.day || 5
    };

    game.showToast('Contrôle Technique Validé ✓', `${v.name} a passé avec succès son contrôle technique officiel (valable 1 an ou 25 000 km).`, 'green');
    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
  },

  toggleGarageVehicleArmament(vehicleId) {
    if (!this.expandedGarageVehIds) this.expandedGarageVehIds = {};
    this.expandedGarageVehIds[vehicleId] = !this.expandedGarageVehIds[vehicleId];
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    this.renderModal(window.game);
  },

  renderFlotteHTML(game, station) {
    const stationVehicles = (game.vehicles || []).filter(v => v.stationId === station?.id);
    if (station) this.ensureStationStock(station, game);
    if (!this.expandedGarageVehIds) this.expandedGarageVehIds = {};

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs font-bold text-slate-600 flex-wrap gap-2">
          <span>Véhicules rattachés à ${station?.name || 'l\'antenne'} (${stationVehicles.length})</span>
          <span class="text-[11px] text-slate-500">Préparation anticipée des lots LOG (3 min/lot), réarmement O2, bionettoyage et maintenance</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${stationVehicles.length === 0 ? `
            <div class="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl md:col-span-2">
              Aucun véhicule rattaché à cette caserne. Utilisez le module Flotte pour acheter ou affecter un VPSP.
            </div>
          ` : stationVehicles.map(v => {
            this.normalizeVehicle(v);
            const fuel = v.fuel !== undefined ? v.fuel : 90;
            const mech = v.mechanical !== undefined ? v.mechanical : 95;
            const km = v.kilometrage || v.mileage || 115000;
            const isRearmNeeded = v.status === 'a_rearme' || v.a_rearme || v.needsRearming;
            const isBroken = v.status === 'en_panne' || v.isBrokenDown;
            const isCtNeeded = v.needsControleTechnique || (v.controleTechniqueKm && (km - v.controleTechniqueKm > 25000));
            const isLog = (v.types || []).includes('LOG');
            const capLog = v.capacity_log || 0;
            const usedSlots = this.getUsedLogSlots(v);
            const freeSlots = Math.max(0, capLog - usedSlots);
            const isExpanded = Boolean(this.expandedGarageVehIds[v.id]);

            let statusBadge = '';
            const isArmingNow = this.isVehicleArming(v);
            if (isBroken) {
              statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white flex items-center gap-1 animate-pulse"><i data-lucide="alert-octagon" class="w-3 h-3"></i> EN PANNE</span>';
            } else if (isArmingNow) {
              const effRemSec = this.getVehicleEffectiveArmingRemainingSec ? this.getVehicleEffectiveArmingRemainingSec(v, game) : this.getVehicleArmingRemainingSec(v);
              statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white flex items-center gap-1 animate-pulse"><i data-lucide="loader" class="w-3 h-3 animate-spin"></i> ARMEMENT / DÉCHARGEMENT (${this.formatArmingClock(effRemSec)})</span>`;
            } else if (isRearmNeeded) {
              statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800 border border-red-300 flex items-center gap-1 animate-pulse"><i data-lucide="alert-triangle" class="w-3 h-3"></i> À RÉARMER</span>';
            } else if (v.status === 'dispo') {
              statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">DISPONIBLE</span>';
            } else {
              statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">ENGAGÉ</span>';
            }

            const isCmdEligible = window.ProtecCommandement && window.ProtecCommandement.isEligible(v);
            const isVLC = Boolean(v.isCommandement || v.hasCommandementKit);
            const cmdLeader = isVLC && window.ProtecCommandement ? window.ProtecCommandement.getLeader(game, v) : null;

            return `
              <div class="p-4 rounded-2xl bg-white border ${isVLC ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'} shadow-xs space-y-3 ${isRearmNeeded ? 'border-red-300 ring-2 ring-red-100' : ''} ${isExpanded || isArmingNow ? 'md:col-span-2' : ''}">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-10 ${isVLC ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-100 border-slate-200'} rounded-xl p-1 flex items-center justify-center flex-shrink-0 border shadow-inner">
                      <img src="${this.getThumb(v.image || (game.getVehicleImage ? game.getVehicleImage(v.type) : `images/vehicles/${v.type}.png`))}" 
                           alt="${v.name}" 
                           loading="lazy" 
                           class="max-h-full max-w-full object-contain" 
                           onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${v.image || (game.getVehicleImage ? game.getVehicleImage(v.type) : `images/vehicles/${v.type}.png`)}'; } else { this.outerHTML='<i data-lucide=\\'truck\\' class=\\'w-6 h-6 text-slate-500\\'></i>'; }" />
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <h5 class="text-xs font-black text-slate-900 leading-tight">${v.name}</h5>
                        ${this.getVehicleCapabilitiesBadgesHTML(v)}
                        ${isVLC ? '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-indigo-600 text-white tracking-wider flex items-center gap-1"><i data-lucide="radio" class="w-2.5 h-2.5"></i> VLC</span>' : ''}
                      </div>
                      <span class="text-[10px] text-slate-500 font-semibold block">
                        ${v.label || v.type} • ${km.toLocaleString('fr-FR')} km
                        ${isLog ? ` • <strong class="text-amber-800">${usedSlots}/${capLog} slots LOG occupés</strong>` : ''}
                        ${cmdLeader ? ` • <strong class="text-indigo-700 flex items-center gap-1 inline-flex"><i data-lucide="user" class="w-3 h-3"></i> ${cmdLeader.name} (${cmdLeader.rank})</strong>` : ''}
                      </span>
                    </div>
                  </div>
                  
                  ${statusBadge}
                </div>

                <!-- Jauges Carburant & Mécanique & Kilométrage -->
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

                ${isCtNeeded ? `
                  <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10.5px] text-amber-800 flex items-center justify-between">
                    <span class="flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-600"></i> Contrôle Technique expiré (> 25 000 km)</span>
                    <button onclick="window.ProtecLogistique.passControleTechnique(window.game, '${v.id}')" class="px-2 py-0.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 transition">
                      Passer CT (120 €)
                    </button>
                  </div>
                ` : ''}

                <!-- Actions directes de garage et logistique post-mission -->
                <div class="grid ${isLog ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2 pt-1 border-t border-slate-100">
                  <button onclick="window.ProtecLogistique.rearmAndDisinfectVehicle(window.game, '${v.id}')" class="py-1.5 rounded-xl text-[10px] font-extrabold ${isRearmNeeded ? 'bg-red-600 text-white hover:bg-red-700 shadow-md animate-pulse' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'} transition cursor-pointer" title="Consomme O2, compresses, gants et désinfectant ou 45 € (3 min ou 1m30 avec SAS)">
                    ${isRearmNeeded ? 'Réarmer (O2/SAS)' : 'Réarmé ✓'}
                  </button>
                  <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'fuel')" class="py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer">
                    Plein (75 €)
                  </button>
                  ${isBroken || mech < 60 ? `
                    <button onclick="window.ProtecLogistique.repairVehicleGarage(window.game, '${v.id}')" class="py-1.5 rounded-xl text-[10px] font-black bg-red-500 hover:bg-red-600 text-white transition shadow-sm cursor-pointer" title="Réparation complète au garage">
                      Garage (450 €)
                    </button>
                  ` : `
                    <button onclick="window.ProtecLogistique.passControleTechnique(window.game, '${v.id}')" class="py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer" title="Contrôle technique périodique">
                      CT (120 €)
                    </button>
                  `}
                  ${isLog ? `
                    <button onclick="window.ProtecLogistique.toggleGarageVehicleArmament('${v.id}')" class="py-1.5 px-2 rounded-xl text-[10px] font-black ${isExpanded ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'} transition cursor-pointer flex items-center justify-center gap-1" title="Préparer, charger ou décharger les lots du véhicule au garage (3 min/lot)">
                      <span>📦 ${isExpanded ? 'Masquer Lots' : `Lots LOG (${usedSlots}/${capLog})`}</span>
                    </button>
                  ` : ''}
                </div>

                ${(isArmingNow || (isLog && isExpanded)) ? this.renderSingleVehicleGarageArmamentPanel(game, v, station, null, isExpanded) : ''}

                ${isCmdEligible ? `
                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-[10px] text-slate-500 font-semibold">Poste de Commandement Mobile</span>
                    <button 
                      type="button" 
                      onclick="window.ProtecCommandement.openCommandModal(window.game, '${v.id}')"
                      class="px-2.5 py-1 rounded-xl text-[10.5px] font-black ${isVLC ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200' : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200'} transition cursor-pointer flex items-center gap-1"
                    >
                      <i data-lucide="radio" class="w-3.5 h-3.5"></i>
                      <span>${isVLC ? 'Gérer VL Commandement' : 'Configurer VLC'}</span>
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // =========================================================================
  // 4. MOTEUR UNIFIÉ DES TYPES & CAPACITÉS MULTIPLES DES VÉHICULES
  // =========================================================================

  CAPACITIES: {
    LOG: { code: 'LOG', label: 'Logistique', icon: '📦', desc: 'Permet d\'embarquer du stockage logistique libre (lots, caisses, vélos).', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
    PS: { code: 'PS', label: 'Premiers Secours', icon: '🩺', desc: 'Permet la prise en charge et les soins sur place (postes fixes, PMA, lots).', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    VPSP: { code: 'VPSP', label: 'Évacuation Sanitaire', icon: '🚑', desc: 'Véhicule de Premiers Secours à Personne, permet l\'évacuation vers un hôpital.', badgeClass: 'bg-red-100 text-red-900 border-red-300' },
    TP: { code: 'TP', label: 'Transport de Personnes', icon: '👥', desc: 'Permet d\'acheminer du personnel ou d\'évacuer des personnes impliquées / non blessées.', badgeClass: 'bg-sky-100 text-sky-900 border-sky-300' }
  },

  normalizeVehicle(veh) {
    if (!veh) return veh;
    const t = (veh.type || '').toUpperCase();
    const name = (veh.name || '').toLowerCase();
    const model = (veh.model || '').toLowerCase();

    // 1. Définition des types multiples (tags de capacité)
    if (!Array.isArray(veh.types) || veh.types.length === 0) {
      if (t === 'VPSP') {
        veh.types = ['PS', 'VPSP'];
      } else if (t === 'VTU' || t === 'VTL') {
        veh.types = ['LOG', 'TP'];
      } else if (t === 'VTP') {
        veh.types = ['TP'];
      } else if (t === 'VL') {
        veh.types = ['TP'];
      } else if (t === 'VLHR') {
        veh.types = (name.includes('pickup') || model.includes('hilux') || name.includes('benne')) ? ['LOG', 'TP'] : ['TP'];
      } else if (t === 'FLIT') {
        veh.types = ['LOG', 'TP'];
      } else if (t === 'VAHU') {
        veh.types = ['LOG', 'TP'];
      } else if (t === 'VELO' || name.includes('vélo') || name.includes('velo') || name.includes('vtt')) {
        veh.types = ['PS'];
      } else if (t === 'QUAD' || t === 'MPS') {
        veh.types = ['PS'];
      } else if (t === 'PCM') {
        veh.types = ['TP', 'LOG'];
      } else if (t === 'VST') {
        veh.types = ['LOG', 'TP'];
      } else if (t === 'VTD' || t === 'VCYN') {
        veh.types = ['LOG', 'TP'];
      } else {
        veh.types = ['TP'];
      }
    }

    // 2. RÈGLE STRICTE : Tout véhicule sans le tag LOG a strictement capacity_log = 0 !
    if (!veh.types.includes('LOG')) {
      veh.capacity_log = 0;
    } else if (veh.capacity_log === undefined || veh.capacity_log === null) {
      if (t === 'FLIT') veh.capacity_log = 12;
      else if (t === 'VTU' || t === 'VTL' || t === 'VST') veh.capacity_log = 6;
      else if (t === 'VAHU' || t === 'VTD') veh.capacity_log = 4;
      else if (t === 'PCM' || t === 'VLHR') veh.capacity_log = 2;
      else veh.capacity_log = 4;
    }

    // 3. Cas particulier des vélos (VTT Secours) :
    // Le vélo est un vecteur PS mais doit obligatoirement être transporté par un véhicule LOG (encombrement 1 slot).
    if (t === 'VELO' || name.includes('vélo') || name.includes('velo') || name.includes('vtt')) {
      veh.isBicycle = true;
      veh.transportSlots = 1;
      veh.requiresLogTransport = true;
      veh.capacity_log = 0;
      if (!veh.types.includes('PS')) veh.types.push('PS');
      veh.types = veh.types.filter(tag => tag !== 'LOG'); // Pas de LOG pour le vélo lui-même
    }

    // 4. Jauge de consommables (0 à 100%) - Prêt à l'emploi à l'achat
    if (veh.consumables === undefined) {
      veh.consumables = (veh.armementLevel !== undefined) ? veh.armementLevel : 100;
    }
    veh.consumables = Math.max(0, Math.min(100, veh.consumables));
    veh.armementLevel = Math.round(veh.consumables);
    veh.isRearmed = (veh.consumables >= 100);
    veh.needsRearming = (veh.consumables < 100);

    // 5. Inventaire embarqué (items dans le véhicule LOG)
    if (!Array.isArray(veh.loadedItems)) {
      veh.loadedItems = [];
    }

    // 6. File d'attente temporisée d'armement / désarmement (3 min = 180s par lot) & personnel affecté au garage
    if (!Array.isArray(veh.armingQueue)) {
      veh.armingQueue = [];
    }
    if (!Array.isArray(veh.assignedArmingVolunteerIds)) {
      veh.assignedArmingVolunteerIds = [];
    }

    return veh;
  },

  // Durée fixe réglementaire : 3 minutes réelles (180 secondes) par lot armé ou désarmé
  LOT_ARM_DURATION_SEC: 180,

  isVehicleArming(veh) {
    if (!veh) return false;
    this.normalizeVehicle(veh);
    return Array.isArray(veh.armingQueue) && veh.armingQueue.length > 0;
  },

  getVehicleArmingRemainingSec(veh) {
    if (!veh || !Array.isArray(veh.armingQueue) || veh.armingQueue.length === 0) return 0;
    return veh.armingQueue.reduce((sum, op) => sum + Math.max(0, Math.ceil(op.remainingSec || 0)), 0);
  },

  getVehicleArmingTotalSec(veh) {
    if (!veh || !Array.isArray(veh.armingQueue) || veh.armingQueue.length === 0) return 0;
    return veh.armingQueue.reduce((sum, op) => sum + (op.totalSec || this.LOT_ARM_DURATION_SEC), 0);
  },

  getArmingOperatorsCount(veh, game) {
    if (!game) game = window.game;
    if (!veh || !game) return 0;
    this.normalizeVehicle(veh);
    const hasLogResp = (typeof game.hasActiveLogisticsResponsible === 'function' && game.hasActiveLogisticsResponsible()) ? 1 : 0;
    const validVolsCount = (veh.assignedArmingVolunteerIds || []).filter(id => (game.volunteers || []).some(v => v.id === id)).length;
    return hasLogResp + validVolsCount;
  },

  getArmingSpeedMultiplier(veh, game) {
    const count = this.getArmingOperatorsCount(veh, game);
    if (count <= 0) return 0;
    if (count === 1) return 1.0; // 3 min / lot (180s)
    if (count === 2) return 1.5; // 2 min / lot (120s effectives)
    return 2.0; // 3+ opérateurs : 1 min 30 / lot (90s effectives)
  },

  getVehicleEffectiveArmingRemainingSec(veh, game) {
    const rawSec = this.getVehicleArmingRemainingSec(veh);
    if (rawSec <= 0) return 0;
    const mult = this.getArmingSpeedMultiplier(veh, game);
    return mult > 1 ? Math.max(1, Math.ceil(rawSec / mult)) : rawSec;
  },

  hasActivePersonnelForArming(veh, game) {
    return this.getArmingOperatorsCount(veh, game) > 0;
  },

  getAvailableGarageVolunteers(game, mission = null, veh = null) {
    if (!game) game = window.game;
    if (!game || !Array.isArray(game.volunteers)) return [];
    const assignedIds = (veh && Array.isArray(veh.assignedArmingVolunteerIds)) ? veh.assignedArmingVolunteerIds : [];
    const missionVolIds = (mission && Array.isArray(mission.registeredVolunteers)) ? mission.registeredVolunteers : [];

    // Trier : d'abord les bénévoles inscrits sur la mission, puis les bénévoles disponibles à l'antenne
    const list = game.volunteers.filter(v => {
      if (!v) return false;
      if (assignedIds.includes(v.id)) return false;
      if (missionVolIds.includes(v.id) && v.status !== 'indispo') return true;
      if ((v.status === 'dispo' || v.status === 'disponible') && (!v.armingVehicleId || v.armingVehicleId === veh?.id)) return true;
      return false;
    });

    return list.sort((a, b) => {
      const aInMission = missionVolIds.includes(a.id) ? 0 : 1;
      const bInMission = missionVolIds.includes(b.id) ? 0 : 1;
      return aInMission - bInMission;
    });
  },

  autoAssignPersonnelForArmingIfNeeded(veh, mission, game) {
    if (!game) game = window.game;
    if (!veh || !game) return null;
    this.normalizeVehicle(veh);

    if (this.hasActivePersonnelForArming(veh, game)) return null;

    const candidates = this.getAvailableGarageVolunteers(game, mission, veh);
    const chosen = candidates[0] || null;
    if (chosen) {
      if (!veh.assignedArmingVolunteerIds.includes(chosen.id)) {
        veh.assignedArmingVolunteerIds.push(chosen.id);
      }
      chosen.armingVehicleId = veh.id;
      veh.lastArmingTickAt = Date.now();
      return chosen;
    }
    return null;
  },

  assignVolunteerToVehicleArming(missionId, vehicleId, volunteerId) {
    const game = window.game;
    if (!game) return;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;
    this.normalizeVehicle(veh);

    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    let vol = null;
    if (volunteerId) {
      vol = (game.volunteers || []).find(v => v.id === volunteerId);
    } else {
      const candidates = this.getAvailableGarageVolunteers(game, mission, veh);
      vol = candidates[0] || null;
    }

    if (!vol) {
      game.showToast('Aucun bénévole disponible ⚠️', 'Aucun bénévole disponible au garage ou inscrit sur la mission pour manipuler les lots.', 'orange');
      return;
    }

    if (!veh.assignedArmingVolunteerIds.includes(vol.id)) {
      veh.assignedArmingVolunteerIds.push(vol.id);
    }
    vol.armingVehicleId = veh.id;
    if (!veh.lastArmingTickAt) veh.lastArmingTickAt = Date.now();

    const mult = this.getArmingSpeedMultiplier(veh, game);
    const opsCount = this.getArmingOperatorsCount(veh, game);
    const speedInfo = mult > 1 ? ` (Équipe de ${opsCount} : vitesse ×${mult} !)` : '';

    game.showToast('Personnel affecté au garage 👷', `${vol.name} prend en charge la manutention sur ${veh.name}${speedInfo}.`, 'green');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    this.ensureArmingInterval(game);

    game.saveGame();
    if (mission && typeof game.refreshMissionDetailsIfOpen === 'function') {
      game.refreshMissionDetailsIfOpen(mission.id);
    }
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  unassignVolunteerFromVehicleArming(missionId, vehicleId, volunteerId) {
    const game = window.game;
    if (!game) return;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;
    this.normalizeVehicle(veh);

    veh.assignedArmingVolunteerIds = (veh.assignedArmingVolunteerIds || []).filter(id => id !== volunteerId);
    const vol = (game.volunteers || []).find(v => v.id === volunteerId);
    if (vol && vol.armingVehicleId === veh.id) {
      vol.armingVehicleId = null;
    }

    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    if (mission && typeof game.refreshMissionDetailsIfOpen === 'function') {
      game.refreshMissionDetailsIfOpen(mission.id);
    }
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  cleanupMissionArmingQueues(mission, game) {
    if (!mission) return;
    if (!game) game = window.game;
    const assignedVehs = this.getMissionVehicles(mission, game);
    assignedVehs.forEach(veh => {
      this.normalizeVehicle(veh);
      if (!Array.isArray(veh.armingQueue) || veh.armingQueue.length === 0) {
        this.releaseVehicleArmingVolunteers(veh, game);
        return;
      }
      const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations?.[0];
      if (station) this.ensureStationStock(station, game);

      const remainingOps = [];
      veh.armingQueue.forEach(op => {
        if (!op.missionId || op.missionId === mission.id) {
          if (op.type === 'load' && station) {
            station.stock[op.itemId] = (station.stock[op.itemId] || 0) + 1;
          } else if (op.type === 'unload') {
            const targetItem = (veh.loadedItems || []).find(it => it.pendingUnloadOpId === op.opId);
            if (targetItem) delete targetItem.pendingUnloadOpId;
          } else if (op.type === 'load_bike') {
            const bike = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === op.bikeId);
            if (bike) bike.pendingTransportedBy = null;
          } else if (op.type === 'unload_bike') {
            const targetBike = (veh.loadedItems || []).find(it => it.pendingUnloadOpId === op.opId);
            if (targetBike) delete targetBike.pendingUnloadOpId;
          } else {
            remainingOps.push(op);
          }
        } else {
          remainingOps.push(op);
        }
      });

      veh.armingQueue = remainingOps;
      if (veh.armingQueue.length === 0) {
        veh.lastArmingTickAt = null;
        this.releaseVehicleArmingVolunteers(veh, game);
      }
    });
  },

  refreshOpenLogisticsModalIfNeeded(game) {
    if (typeof document === 'undefined') return;
    const modalOpen = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    if (modalOpen && !modalOpen.classList.contains('hidden') && title && (title.textContent.includes('Centrale d’Achats') || title.textContent.includes('Logistique'))) {
      this.renderModal(game);
    }
  },

  getVehicleTypes(veh) {
    if (!veh) return [];
    this.normalizeVehicle(veh);
    return Array.isArray(veh.types) ? veh.types : ['TP'];
  },

  getVehicleCapacityLog(veh) {
    if (!veh) return 0;
    this.normalizeVehicle(veh);
    return veh.types.includes('LOG') ? (veh.capacity_log || 0) : 0;
  },

  getUsedLogSlots(veh) {
    if (!veh) return 0;
    this.normalizeVehicle(veh);
    const loadedSlots = (veh.loadedItems || []).reduce((sum, item) => sum + (item.slots || 1), 0);
    const queuedLoadSlots = (veh.armingQueue || [])
      .filter(op => op.type === 'load' || op.type === 'load_bike')
      .reduce((sum, op) => sum + (op.slots || 1), 0);
    return loadedSlots + queuedLoadSlots;
  },

  getFreeLogSlots(veh) {
    const cap = this.getVehicleCapacityLog(veh);
    return Math.max(0, cap - this.getUsedLogSlots(veh));
  },

  canLoadInVehicle(veh, item) {
    this.normalizeVehicle(veh);
    if (!veh.types || !veh.types.includes('LOG')) {
      return { can: false, reason: 'Ce véhicule ne dispose pas du tag LOG (capacité de stockage libre = 0).' };
    }
    const needed = item.slots || 1;
    const free = this.getFreeLogSlots(veh);
    if (free < needed) {
      return { can: false, reason: `Espace logistique insuffisant (${free}/${veh.capacity_log} slots libres, ${needed} requis).` };
    }
    return { can: true };
  },

  // =========================================================================
  // 5. GESTION DES CHARGEMENTS DE LOTS, CAISSES & VÉLOS AVANT DÉPART (3 MIN / LOT)
  // =========================================================================

  loadItemToVehicle(missionId, vehicleId, itemId) {
    const game = window.game;
    if (!game) return;
    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;

    this.normalizeVehicle(veh);
    const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
    this.ensureStationStock(station, game);

    // Vérifier disponibilité en stock
    const availableInStock = station.stock[itemId] || 0;
    const catItem = this.CATALOG.find(i => i.id === itemId);
    const comp = this.getLotComposition(itemId);
    const itemSlots = comp?.slots || catItem?.slots || 1;

    if (availableInStock <= 0) {
      const cost = catItem ? catItem.price : (itemId === 'caisse_rearmement' ? 370 : 250);
      if (game.resources.money < cost) {
        game.showToast('Stock épuisé ⚠️', `Aucun exemplaire de « ${comp?.title || catItem?.name || itemId} » au local et trésorerie insuffisante (${cost} € requise).`, 'orange');
        return;
      }
      game.resources.money -= cost;
      station.stock[itemId] = 1;
      game.showToast('Matériel acheté 🛒', `1 « ${comp?.title || catItem?.name || itemId} » acheté pour ${cost} € et ajouté au stock de l'antenne.`, 'teal');
    }

    const check = this.canLoadInVehicle(veh, { slots: itemSlots });
    if (!check.can) {
      game.showToast('Chargement impossible ⚠️', check.reason, 'orange');
      return;
    }

    // Réserver immédiatement l'unité du stock local
    station.stock[itemId] = Math.max(0, (station.stock[itemId] || 1) - 1);

    const initialConsumables = comp?.consumables !== undefined ? comp.consumables : (catItem?.consumables !== undefined ? catItem.consumables : 100);
    const maxCons = comp?.maxConsumables !== undefined ? comp.maxConsumables : (catItem?.maxConsumables !== undefined ? catItem.maxConsumables : 100);

    const loadedEntry = {
      id: itemId,
      name: comp?.title || catItem?.name || itemId,
      shortName: comp?.title ? comp.title.split('(')[0].trim() : (catItem?.name ? catItem.name.split('(')[0].trim() : itemId),
      slots: itemSlots,
      types: catItem?.types || (itemId === 'caisse_rearmement' ? ['LOG'] : ['PS']),
      consumables: initialConsumables,
      maxConsumables: maxCons,
      isLot: true,
      isCaisseRearm: itemId === 'caisse_rearmement',
      itemsList: comp?.items || []
    };

    const durationSec = this.LOT_ARM_DURATION_SEC || 180;
    const op = {
      opId: `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'load',
      missionId: mission ? mission.id : null,
      stationId: station ? station.id : null,
      itemId: itemId,
      itemName: loadedEntry.shortName,
      slots: itemSlots,
      itemData: loadedEntry,
      totalSec: durationSec,
      remainingSec: durationSec,
      queuedAt: Date.now()
    };

    if (!veh.lastArmingTickAt) veh.lastArmingTickAt = Date.now();
    veh.armingQueue.push(op);

    // Auto-affectation intelligente d'un bénévole disponible si personne n'est encore sur le véhicule
    const autoVol = this.autoAssignPersonnelForArmingIfNeeded(veh, mission, game);
    const hasPersonnel = this.hasActivePersonnelForArming(veh, game);
    const effSecLeft = this.getVehicleEffectiveArmingRemainingSec(veh, game);

    if (hasPersonnel) {
      game.showToast(
        'Armement en cours ⏳',
        `« ${loadedEntry.shortName} » ajouté à la file d'armement de ${veh.name}${autoVol ? ` (${autoVol.name} affecté auto)` : ''} • ~${this.formatArmingClock(effSecLeft)} restant.`,
        'blue'
      );
    } else {
      game.showToast(
        'Lot en file d\'attente 👷 (3 min/lot)',
        `« ${loadedEntry.shortName} » prêt à être chargé dans ${veh.name}. Affectez un bénévole disponible au garage pour démarrer le chrono !`,
        'orange'
      );
    }

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    this.ensureArmingInterval(game);

    game.saveGame();
    if (mission) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else if (typeof game.openMissionDetails === 'function') {
        game.openMissionDetails(mission.id);
      }
    }
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  unloadItemFromVehicle(missionId, vehicleId, itemIndex) {
    const game = window.game;
    if (!game) return;
    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    if (!veh || !Array.isArray(veh.loadedItems) || !veh.loadedItems[itemIndex]) return;

    this.normalizeVehicle(veh);
    const item = veh.loadedItems[itemIndex];
    if (item.isVehicle) {
      return this.unloadBicycleFromVehicle(missionId, vehicleId, item.id);
    }

    // Éviter de mettre deux fois le même lot en file de déchargement
    if (item.pendingUnloadOpId && veh.armingQueue.some(op => op.opId === item.pendingUnloadOpId)) {
      game.showToast('Déchargement déjà en cours ⏳', `« ${item.shortName || item.name} » est déjà dans la file de désarmement.`, 'orange');
      return;
    }

    const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
    this.ensureStationStock(station, game);

    const durationSec = this.LOT_ARM_DURATION_SEC || 180;
    const opId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    item.pendingUnloadOpId = opId;

    const op = {
      opId: opId,
      type: 'unload',
      missionId: mission ? mission.id : null,
      stationId: station ? station.id : null,
      itemId: item.id,
      itemName: item.shortName || item.name,
      slots: item.slots || 1,
      totalSec: durationSec,
      remainingSec: durationSec,
      queuedAt: Date.now()
    };

    if (!veh.lastArmingTickAt) veh.lastArmingTickAt = Date.now();
    veh.armingQueue.push(op);

    const autoVol = this.autoAssignPersonnelForArmingIfNeeded(veh, mission, game);
    const hasPersonnel = this.hasActivePersonnelForArming(veh, game);
    const effSecLeft = this.getVehicleEffectiveArmingRemainingSec(veh, game);

    if (hasPersonnel) {
      game.showToast(
        'Désarmement en cours ⏳',
        `Déchargement de « ${item.shortName || item.name} » lancé sur ${veh.name}${autoVol ? ` (${autoVol.name} affecté auto)` : ''} • ~${this.formatArmingClock(effSecLeft)} restant.`,
        'teal'
      );
    } else {
      game.showToast(
        'Désarmement en attente 👷 (3 min/lot)',
        `« ${item.shortName || item.name} » mis en file de déchargement. Affectez un bénévole disponible au garage pour démarrer le chrono !`,
        'orange'
      );
    }

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    this.ensureArmingInterval(game);

    game.saveGame();
    if (mission) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else if (typeof game.openMissionDetails === 'function') {
        game.openMissionDetails(mission.id);
      }
    }
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  unloadAllItemsFromVehicle(missionId, vehicleId) {
    const game = window.game;
    if (!game) return;
    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    if (!veh || !Array.isArray(veh.loadedItems) || veh.loadedItems.length === 0) return;

    this.normalizeVehicle(veh);
    const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
    this.ensureStationStock(station, game);

    let addedCount = 0;
    const durationSec = this.LOT_ARM_DURATION_SEC || 180;

    veh.loadedItems.forEach(item => {
      if (item.pendingUnloadOpId && veh.armingQueue.some(op => op.opId === item.pendingUnloadOpId)) {
        return;
      }
      const opId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${addedCount}`;
      item.pendingUnloadOpId = opId;

      if (!veh.lastArmingTickAt) veh.lastArmingTickAt = Date.now();
      veh.armingQueue.push({
        opId: opId,
        type: item.isVehicle ? 'unload_bike' : 'unload',
        missionId: mission ? mission.id : null,
        stationId: station ? station.id : null,
        itemId: item.id,
        bikeId: item.isVehicle ? item.id : undefined,
        itemName: item.shortName || item.name,
        slots: item.slots || 1,
        totalSec: durationSec,
        remainingSec: durationSec,
        queuedAt: Date.now()
      });
      addedCount++;
    });

    if (addedCount === 0) {
      game.showToast('Déchargement déjà en cours ⏳', `Tous les lots de ${veh.name} sont déjà dans la file de désarmement.`, 'orange');
      return;
    }

    const autoVol = this.autoAssignPersonnelForArmingIfNeeded(veh, mission, game);
    const effSecLeft = this.getVehicleEffectiveArmingRemainingSec(veh, game);
    game.showToast(
      'Déchargement Complet Lancé 🧹',
      `${addedCount} lot(s) programmé(s) pour retour en réserve depuis ${veh.name}${autoVol ? ` (${autoVol.name})` : ''} • ~${this.formatArmingClock(effSecLeft)} au total.`,
      'teal'
    );

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    this.ensureArmingInterval(game);
    game.saveGame();
    if (mission && typeof game.refreshMissionDetailsIfOpen === 'function') {
      game.refreshMissionDetailsIfOpen(mission.id);
    }
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  GARAGE_ARMING_PRESETS: {
    dps_poste: {
      label: '🚑 Pack Poste DPS (Lots A + B)',
      lots: ['lot_secours_a', 'lot_secours_b'],
      fallbackLots: ['lot_secours_b', 'lot_secours_c']
    },
    intemperies: {
      label: '🌊 Pack Intempéries (Pompage + Tronçonnage)',
      lots: ['lot_pompage', 'lot_tronconnage'],
      fallbackLots: ['lot_tronconnage', 'lot_eclairage']
    },
    soutien_cai: {
      label: '⛺ Pack CAI / Hébergement (Lits + Ravitaillement)',
      lots: ['lot_hebergement', 'lot_ravitaillement'],
      fallbackLots: ['lot_ravitaillement', 'caisse_rearmement']
    }
  },

  applyGarageArmingPreset(missionId, vehicleId, presetKey) {
    const game = window.game;
    if (!game) return;
    const preset = this.GARAGE_ARMING_PRESETS[presetKey];
    if (!preset) return;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;
    this.normalizeVehicle(veh);

    const cap = this.getVehicleCapacityLog(veh);
    const listToTry = (cap < 6 && preset.fallbackLots) ? preset.fallbackLots : preset.lots;
    let loadedAny = false;

    listToTry.forEach(lotId => {
      const comp = this.getLotComposition(lotId);
      const needed = comp?.slots || 1;
      if (this.getFreeLogSlots(veh) >= needed) {
        this.loadItemToVehicle(missionId, vehicleId, lotId);
        loadedAny = true;
      }
    });

    if (!loadedAny) {
      game.showToast('Espace insuffisant ⚠️', `Aucun lot du « ${preset.label} » ne rentre dans l'espace libre restant de ${veh.name}.`, 'orange');
    }
  },

  loadBicycleToVehicle(missionId, vehicleId, bikeId) {
    const game = window.game;
    if (!game) return;
    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    const bike = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === bikeId);
    if (!veh || !bike) return;

    this.normalizeVehicle(veh);
    this.normalizeVehicle(bike);

    if (veh.armingQueue.some(op => op.type === 'load_bike' && op.bikeId === bike.id)) {
      game.showToast('Embarquement VTT déjà en cours ⏳', `${bike.name} est déjà dans la file d'armement.`, 'orange');
      return;
    }

    const check = this.canLoadInVehicle(veh, { slots: 1 });
    if (!check.can) {
      game.showToast('Transport Vélo impossible', check.reason, 'orange');
      return;
    }

    bike.pendingTransportedBy = veh.id;
    const durationSec = this.LOT_ARM_DURATION_SEC || 180;
    const op = {
      opId: `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'load_bike',
      missionId: mission ? mission.id : null,
      bikeId: bike.id,
      itemName: `${bike.name || 'VTT Secours'} (Vélo)`,
      slots: 1,
      itemData: {
        id: bike.id,
        name: bike.name || 'VTT Secours',
        shortName: 'VTT Secours (Vélo)',
        slots: 1,
        isVehicle: true,
        types: ['PS'],
        consumables: bike.consumables || 100
      },
      totalSec: durationSec,
      remainingSec: durationSec,
      queuedAt: Date.now()
    };

    if (!veh.lastArmingTickAt) veh.lastArmingTickAt = Date.now();
    veh.armingQueue.push(op);

    const autoVol = this.autoAssignPersonnelForArmingIfNeeded(veh, mission, game);
    const hasPersonnel = this.hasActivePersonnelForArming(veh, game);
    const effSecLeft = this.getVehicleEffectiveArmingRemainingSec(veh, game);

    if (hasPersonnel) {
      game.showToast('Arrimage VTT en cours 🚲', `${bike.name} est en cours d'embarquement dans ${veh.name}${autoVol ? ` (${autoVol.name})` : ''} (~${this.formatArmingClock(effSecLeft)}).`, 'blue');
    } else {
      game.showToast('Arrimage VTT en attente 👷 (3 min)', `Affectez un bénévole au garage pour embarquer ${bike.name} dans ${veh.name} !`, 'orange');
    }

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    this.ensureArmingInterval(game);

    game.saveGame();
    if (mission) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else if (typeof game.openMissionDetails === 'function') {
        game.openMissionDetails(mission.id);
      }
    }
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  unloadBicycleFromVehicle(missionId, vehicleId, bikeId) {
    const game = window.game;
    if (!game) return;
    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    const bike = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === bikeId);
    if (!veh) return;

    this.normalizeVehicle(veh);
    const bikeEntry = (veh.loadedItems || []).find(it => it.id === bikeId);
    if (!bikeEntry) return;

    if (bikeEntry.pendingUnloadOpId && veh.armingQueue.some(op => op.opId === bikeEntry.pendingUnloadOpId)) {
      game.showToast('Déchargement VTT déjà en cours ⏳', `${bike ? bike.name : 'VTT'} est déjà en file de déchargement.`, 'orange');
      return;
    }

    const durationSec = this.LOT_ARM_DURATION_SEC || 180;
    const opId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    bikeEntry.pendingUnloadOpId = opId;

    if (!veh.lastArmingTickAt) veh.lastArmingTickAt = Date.now();
    veh.armingQueue.push({
      opId: opId,
      type: 'unload_bike',
      missionId: mission ? mission.id : null,
      bikeId: bikeId,
      itemName: `${bike ? bike.name : 'VTT Secours'} (Vélo)`,
      slots: 1,
      totalSec: durationSec,
      remainingSec: durationSec,
      queuedAt: Date.now()
    });

    this.autoAssignPersonnelForArmingIfNeeded(veh, mission, game);
    const effSecLeft = this.getVehicleEffectiveArmingRemainingSec(veh, game);
    game.showToast('Déchargement VTT en cours 🚲', `Désarrimage de ${bike ? bike.name : 'VTT'} programmé (~${this.formatArmingClock(effSecLeft)}).`, 'slate');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    this.ensureArmingInterval(game);

    if (typeof game.saveGame === 'function') game.saveGame();
    if (mission) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else if (typeof game.openMissionDetails === 'function') {
        game.openMissionDetails(mission.id);
      }
    }
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  cancelArmingOperation(missionId, vehicleId, opId) {
    const game = window.game;
    if (!game) return;
    const mission = missionId ? (game.missions || []).find(m => m.id === missionId) : null;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;
    this.normalizeVehicle(veh);

    const opIdx = (veh.armingQueue || []).findIndex(o => o.opId === opId);
    if (opIdx === -1) return;

    const op = veh.armingQueue.splice(opIdx, 1)[0];
    const station = (game.stations || []).find(s => s.id === (op.stationId || veh.stationId)) || game.stations[0];
    this.ensureStationStock(station, game);

    if (op.type === 'load') {
      // Restituer immédiatement au stock local puisque l'embarquement est annulé
      station.stock[op.itemId] = (station.stock[op.itemId] || 0) + 1;
      game.showToast('Embarquement annulé ↩️', `« ${op.itemName} » a été retiré de la file et remis au stock de l'antenne.`, 'slate');
    } else if (op.type === 'unload') {
      const targetItem = (veh.loadedItems || []).find(it => it.pendingUnloadOpId === op.opId);
      if (targetItem) delete targetItem.pendingUnloadOpId;
      game.showToast('Déchargement annulé ↩️', `« ${op.itemName} » reste embarqué à bord de ${veh.name}.`, 'slate');
    } else if (op.type === 'load_bike') {
      const bike = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === op.bikeId);
      if (bike) bike.pendingTransportedBy = null;
      game.showToast('Arrimage VTT annulé ↩️', `L'embarquement de ${op.itemName} a été annulé.`, 'slate');
    } else if (op.type === 'unload_bike') {
      const targetBike = (veh.loadedItems || []).find(it => it.pendingUnloadOpId === op.opId);
      if (targetBike) delete targetBike.pendingUnloadOpId;
      game.showToast('Déchargement VTT annulé ↩️', `${op.itemName} reste à bord de ${veh.name}.`, 'slate');
    } else if (op.type === 'rearm_sanitaire') {
      // Restituer la charge de réarmement sanitaire au stock local
      station.stock.caisse_rearmement_charges = (station.stock.caisse_rearmement_charges || 0) + 1;
      station.stock.caisse_rearmement = Math.ceil(station.stock.caisse_rearmement_charges / 3);
      game.showToast('Réarmement sanitaire annulé ↩️', `Le réarmement de ${veh.name} a été annulé (charge restituée au stock).`, 'slate');
    }

    // Si la file est désormais vide, libérer les bénévoles affectés au garage sur ce véhicule
    if (veh.armingQueue.length === 0) {
      veh.lastArmingTickAt = null;
      this.releaseVehicleArmingVolunteers(veh, game);
    }

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    if (mission && typeof game.refreshMissionDetailsIfOpen === 'function') {
      game.refreshMissionDetailsIfOpen(mission.id);
    }
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  releaseVehicleArmingVolunteers(veh, game) {
    if (!veh) return;
    if (!game) game = window.game;
    const ids = Array.isArray(veh.assignedArmingVolunteerIds) ? [...veh.assignedArmingVolunteerIds] : [];
    ids.forEach(id => {
      const vol = (game?.volunteers || []).find(v => v.id === id);
      if (vol && vol.armingVehicleId === veh.id) {
        vol.armingVehicleId = null;
      }
    });
    veh.assignedArmingVolunteerIds = [];
  },

  ensureArmingInterval(game) {
    if (this._armingIntervalId) return;
    this._lastArmingTickAt = Date.now();
    this._armingIntervalId = setInterval(() => {
      const g = window.game || game;
      if (!g) return;
      const now = Date.now();
      const elapsedSec = Math.max(1, Math.round((now - (this._lastArmingTickAt || now - 1000)) / 1000));
      this._lastArmingTickAt = now;
      this.processVehicleArmingTick(g, elapsedSec);
    }, 1000);
  },

  formatArmingClock(sec) {
    const sTotal = Math.max(0, Math.ceil(sec || 0));
    const m = Math.floor(sTotal / 60);
    const s = sTotal % 60;
    return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  },

  processVehicleArmingTick(game, deltaSec = 1) {
    if (!game) game = window.game;
    if (!game) return;

    const now = Date.now();
    // Anti-doublon si appelé à la fois par updateDeliveriesClock et setInterval dans la même seconde
    if (this._lastProcessedArmingTimestamp && (now - this._lastProcessedArmingTimestamp) < 750) {
      return;
    }
    this._lastProcessedArmingTimestamp = now;

    const allVehs = [];
    const seenIds = new Set();
    (game.vehicles || []).concat(game.allVehicles || []).forEach(v => {
      if (v && v.id && !seenIds.has(v.id)) {
        seenIds.add(v.id);
        allVehs.push(v);
      }
    });

    let anyCompleted = false;
    let anyActive = false;
    const affectedMissionIds = new Set();

    allVehs.forEach(veh => {
      if (!Array.isArray(veh.armingQueue) || veh.armingQueue.length === 0) return;
      anyActive = true;

      const hasPersonnel = this.hasActivePersonnelForArming(veh, game);
      if (!hasPersonnel) {
        // En pause : actualiser l'horodatage pour ne pas décompter le temps passé sans bénévole
        veh.lastArmingTickAt = now;
        this.updateVehicleArmingDOM(veh, game, false);
        return;
      }

      // Rattrapage du temps réel écoulé (persistance rechargement de page / onglet en arrière-plan)
      const realElapsedSec = veh.lastArmingTickAt
        ? Math.max(deltaSec, Math.min(36000, Math.round((now - veh.lastArmingTickAt) / 1000)))
        : deltaSec;
      veh.lastArmingTickAt = now;

      // Multiplicateur de coopération d'équipe (1 op = x1.0, 2 ops = x1.5, 3+ ops = x2.0)
      const speedMult = this.getArmingSpeedMultiplier(veh, game) || 1.0;
      let remainingWork = realElapsedSec * speedMult;

      while (remainingWork > 0 && veh.armingQueue.length > 0) {
        const currentOp = veh.armingQueue[0];
        if (currentOp.missionId) affectedMissionIds.add(currentOp.missionId);

        if (currentOp.remainingSec > remainingWork) {
          currentOp.remainingSec -= remainingWork;
          remainingWork = 0;
        } else {
          remainingWork -= currentOp.remainingSec;
          currentOp.remainingSec = 0;

          // Opération terminée ! Exécuter le transfert effectif et valoriser les bénévoles
          const finishedOp = veh.armingQueue.shift();
          anyCompleted = true;
          this.completeSingleArmingOperation(veh, finishedOp, game);
        }
      }

      // Si toute la file d'attente du véhicule est terminée
      if (veh.armingQueue.length === 0) {
        veh.lastArmingTickAt = null;
        this.releaseVehicleArmingVolunteers(veh, game);
        game.showToast(
          'Opérations Garage Terminées ✅',
          `Toutes les opérations d'armement / réarmement sur ${veh.name} sont terminées. Le véhicule est prêt au départ !`,
          'green'
        );
        if (window.ProtecAudio && typeof window.ProtecAudio.playSuccessChime === 'function') {
          window.ProtecAudio.playSuccessChime();
        }
      } else {
        this.updateVehicleArmingDOM(veh, game, true);
      }
    });

    if (!anyActive && this._armingIntervalId) {
      clearInterval(this._armingIntervalId);
      this._armingIntervalId = null;
    }

    if (anyCompleted) {
      game.saveGame();
      if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
      if (game.selectedMissionId && typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(game.selectedMissionId);
      } else {
        affectedMissionIds.forEach(mId => {
          if (typeof game.refreshMissionDetailsIfOpen === 'function') {
            game.refreshMissionDetailsIfOpen(mId);
          }
        });
      }
      this.refreshOpenLogisticsModalIfNeeded(game);
    } else if (anyActive && game.selectedMissionId && typeof document !== 'undefined') {
      // Mettre à jour le bouton de pied de page du tiroir de mission en temps réel
      const footerBtnSpan = document.getElementById(`mission-footer-arming-timer-${game.selectedMissionId}`);
      if (footerBtnSpan) {
        const m = (game.missions || []).find(mi => mi.id === game.selectedMissionId);
        if (m) {
          const check = this.checkVehiclesArmamentReady(m, game);
          if (!check.valid) {
            footerBtnSpan.textContent = `Armement (${this.formatArmingClock(check.remainingSec)})`;
          }
        }
      }
    }
  },

  completeSingleArmingOperation(veh, op, game) {
    const station = (game.stations || []).find(s => s.id === (op.stationId || veh.stationId)) || game.stations[0];
    this.ensureStationStock(station, game);

    // Valorisation des bénévoles affectés (+5 XP par lot manipulé, +12 XP pour réarmement sanitaire + légère fatigue)
    const assignedVols = (veh.assignedArmingVolunteerIds || [])
      .map(id => (game.volunteers || []).find(v => v.id === id))
      .filter(Boolean);
    const hasFacilityBonus = Boolean(
      station?.premises?.rooms?.sas_desinfection_pharmacie?.hasWaterPoint ||
      (station?.premises?.rooms?.garage_remisage?.level >= 2)
    );
    const xpGain = op.type === 'rearm_sanitaire' ? 12 : 5;
    const fatigueGain = hasFacilityBonus ? 1 : 2;

    assignedVols.forEach(vol => {
      vol.exp = (vol.exp || 0) + xpGain;
      vol.fatigue = Math.min(100, (vol.fatigue || 0) + fatigueGain);
      vol.energy = Math.max(0, 100 - vol.fatigue);
    });

    const xpNotice = assignedVols.length > 0 ? ` (+${xpGain} XP Logistique pour ${assignedVols.map(v => v.name).join(', ')})` : '';

    if (op.type === 'load') {
      if (op.itemData) {
        veh.loadedItems.push(op.itemData);
      }
      game.showToast('Lot embarqué 📦', `« ${op.itemName} » est maintenant chargé et arrimé à bord de ${veh.name}${xpNotice}.`, 'green');
    } else if (op.type === 'unload') {
      const idx = (veh.loadedItems || []).findIndex(it => it.pendingUnloadOpId === op.opId || it.id === op.itemId);
      if (idx !== -1) {
        const removed = veh.loadedItems.splice(idx, 1)[0];
        delete removed.pendingUnloadOpId;
        station.stock[removed.id] = (station.stock[removed.id] || 0) + 1;
      } else {
        station.stock[op.itemId] = (station.stock[op.itemId] || 0) + 1;
      }
      game.showToast('Lot déchargé 🧹', `« ${op.itemName} » a été déchargé de ${veh.name} et rangé au stock de ${station.name}${xpNotice}.`, 'teal');
    } else if (op.type === 'load_bike') {
      const bike = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === op.bikeId);
      if (bike) {
        bike.transportedBy = veh.id;
        bike.pendingTransportedBy = null;
      }
      if (op.itemData && !veh.loadedItems.some(it => it.id === op.bikeId)) {
        veh.loadedItems.push(op.itemData);
      }
      game.showToast('VTT Embarqué 🚲', `${op.itemName} est arrimé à bord de ${veh.name}${xpNotice}.`, 'green');
    } else if (op.type === 'unload_bike') {
      const bike = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === op.bikeId);
      if (bike) {
        bike.transportedBy = null;
        bike.pendingTransportedBy = null;
      }
      veh.loadedItems = (veh.loadedItems || []).filter(it => it.id !== op.bikeId);
      game.showToast('VTT Déchargé 🚲', `${op.itemName} a été descendu de ${veh.name}${xpNotice}.`, 'slate');
    } else if (op.type === 'rearm_sanitaire') {
      veh.consumables = 100;
      veh.armementLevel = 100;
      veh.isRearmed = true;
      veh.needsRearming = false;
      veh.a_rearme = false;
      veh.disinfectionNeeded = false;
      veh.warnedLowConsumables = false;
      veh.breachedConsumables = false;
      veh.lastDisinfectionDate = Date.now();
      if (veh.status === 'a_rearme') {
        veh.status = 'dispo';
      }
      game.showToast('Véhicule Réarmé & Désinfecté ✓', `${veh.name} est réarmé à 100% en consommables et bionettoyé${xpNotice} !`, 'green');
    }
  },

  updateVehicleArmingDOM(veh, game, hasPersonnel) {
    if (typeof document === 'undefined' || !veh) return;
    const rawRemSec = this.getVehicleArmingRemainingSec(veh);
    const effRemSec = this.getVehicleEffectiveArmingRemainingSec(veh, game);
    const totSec = Math.max(1, this.getVehicleArmingTotalSec(veh));
    const pct = Math.min(100, Math.max(0, Math.round(((totSec - rawRemSec) / totSec) * 100)));
    const mult = this.getArmingSpeedMultiplier(veh, game) || 1;
    const currentOp = veh.armingQueue[0];
    const currentOpRawRem = currentOp ? Math.max(0, Math.ceil(currentOp.remainingSec || 0)) : 0;
    const currentOpEffRem = mult > 1 ? Math.ceil(currentOpRawRem / mult) : currentOpRawRem;
    const currentOpTot = currentOp ? (currentOp.totalSec || this.LOT_ARM_DURATION_SEC) : 180;
    const currentPct = Math.min(100, Math.max(0, Math.round(((currentOpTot - currentOpRawRem) / currentOpTot) * 100)));

    const timerEl = document.getElementById(`veh-arming-total-timer-${veh.id}`);
    if (timerEl) {
      timerEl.textContent = mult > 1
        ? `~${this.formatArmingClock(effRemSec)} (×${mult})`
        : `${this.formatArmingClock(rawRemSec)} / ${this.formatArmingClock(totSec)}`;
    }
    const barEl = document.getElementById(`veh-arming-total-bar-${veh.id}`);
    if (barEl) {
      barEl.style.width = `${pct}%`;
    }
    const curTimerEl = document.getElementById(`veh-arming-current-timer-${veh.id}`);
    if (curTimerEl && currentOp) {
      curTimerEl.textContent = this.formatArmingClock(currentOpEffRem);
    }
    const curBarEl = document.getElementById(`veh-arming-current-bar-${veh.id}`);
    if (curBarEl) {
      curBarEl.style.width = `${currentPct}%`;
    }
    const consTimerEl = document.getElementById(`cons-rearm-timer-${veh.id}`);
    if (consTimerEl) {
      consTimerEl.textContent = `⏳ Réarmement (${this.formatArmingClock(effRemSec)})`;
    }
    const flotteBadgeEl = document.getElementById('logistique-tab-flotte-badge');
    if (flotteBadgeEl && game) {
      const seen = new Set();
      let activeCount = 0;
      (game.vehicles || []).concat(game.allVehicles || []).forEach(v => {
        if (v && v.id && !seen.has(v.id)) {
          seen.add(v.id);
          if (this.isVehicleArming(v)) activeCount++;
        }
      });
      flotteBadgeEl.textContent = `⏳ ${activeCount}`;
      if (activeCount > 0) flotteBadgeEl.classList.remove('hidden');
      else flotteBadgeEl.classList.add('hidden');
    }
  },

  // Vérification bloquante avant départ en mission : aucun véhicule de la mission ne doit avoir d'opération en cours dans armingQueue
  checkVehiclesArmamentReady(mission, game) {
    if (!mission) return { valid: true, remainingSec: 0 };
    if (!game) game = window.game;
    const assignedVehs = this.getMissionVehicles(mission, game);

    let totalRemainingSec = 0;
    const armingVehNames = [];
    let missingPersonnel = false;

    assignedVehs.forEach(v => {
      this.normalizeVehicle(v);
      if (Array.isArray(v.armingQueue) && v.armingQueue.length > 0) {
        const rem = this.getVehicleEffectiveArmingRemainingSec(v, game);
        totalRemainingSec = Math.max(totalRemainingSec, rem);
        const hasStaff = this.hasActivePersonnelForArming(v, game);
        if (!hasStaff) missingPersonnel = true;
        armingVehNames.push(`${v.name} (${v.armingQueue.length} op., ${this.formatArmingClock(rem)} restant${!hasStaff ? ' - EN PAUSE sans bénévole' : ''})`);
      }
    });

    if (armingVehNames.length > 0) {
      return {
        valid: false,
        remainingSec: totalRemainingSec,
        missingPersonnel,
        reason: missingPersonnel
          ? `Départ bloqué : ${armingVehNames.join(', ')} est en attente d'un bénévole au garage pour terminer son armement/déchargement (3 min/lot).`
          : `Départ bloqué : ${armingVehNames.join(', ')} est en cours d'armement / déchargement au garage. Attendez la fin des opérations (${this.formatArmingClock(totalRemainingSec)}).`
      };
    }

    return { valid: true, remainingSec: 0 };
  },

  getMissionVehicles(mission, game) {
    if (!mission) return [];
    const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
    let rawList = [];
    if (Array.isArray(mission.assignedVehicleIds)) rawList = mission.assignedVehicleIds;
    else if (Array.isArray(mission.assignedVehicles)) rawList = mission.assignedVehicles;
    else if (mission.assignedCrew && Array.isArray(mission.assignedCrew.vehicles)) rawList = mission.assignedCrew.vehicles;

    return rawList.map(item => {
      if (typeof item === 'object' && item !== null) return item;
      return allVehs.find(v => v.id === item);
    }).filter(Boolean);
  },

  getMissionVolunteers(mission, game) {
    if (!mission) return [];
    const allVols = game.volunteers || [];
    let rawList = [];
    if (Array.isArray(mission.registeredVolunteers)) rawList = mission.registeredVolunteers;
    else if (Array.isArray(mission.assignedVolunteers)) rawList = mission.assignedVolunteers;
    else if (mission.assignedCrew && Array.isArray(mission.assignedCrew.volunteers)) rawList = mission.assignedCrew.volunteers;

    return rawList.map(item => {
      if (typeof item === 'object' && item !== null) return item;
      return allVols.find(v => v.id === item);
    }).filter(Boolean);
  },

  // Vérification stricte du transport des vélos pour tout départ
  checkBicycleTransport(mission, game) {
    if (!mission) return { valid: true };
    const assignedVehs = this.getMissionVehicles(mission, game);

    const bicycles = assignedVehs.filter(v => {
      this.normalizeVehicle(v);
      return v.isBicycle || v.type === 'VELO' || (v.name || '').toLowerCase().includes('vélo') || (v.name || '').toLowerCase().includes('vtt');
    });

    if (bicycles.length === 0) return { valid: true };

    const logVehicles = assignedVehs.filter(v => {
      this.normalizeVehicle(v);
      return (v.types || []).includes('LOG');
    });

    if (logVehicles.length === 0) {
      return {
        valid: false,
        reason: 'Un vélo (VTT Secours) est engagé mais ne peut pas se déplacer par la route : vous devez obligatoirement engager au moins un véhicule disposant du tag LOG pour le transporter.'
      };
    }

    // Vérifier que chaque vélo est bien transporté (ou en file d'embarquement) dans un véhicule LOG
    for (const bike of bicycles) {
      const isExplicitlyCarried = logVehicles.some(lv =>
        (Array.isArray(lv.loadedItems) && lv.loadedItems.some(it => it.id === bike.id)) ||
        (Array.isArray(lv.armingQueue) && lv.armingQueue.some(op => op.type === 'load_bike' && op.bikeId === bike.id))
      );
      if (!isExplicitlyCarried) {
        return {
          valid: false,
          reason: `Le ${bike.name || 'VTT Secours'} doit d'abord être embarqué dans un véhicule LOG (1 slot, 3 min d'armement) avant le départ.`
        };
      }
    }

    return { valid: true };
  },

  // =========================================================================
  // 6. RÉARMEMENT À LA BASE (1-CLIC) & SUR MISSION (TEMPORISÉ AU GARAGE)
  // =========================================================================

  rearmAtBaseOneClick(game, stationId) {
    if (!game) game = window.game;
    const station = (game.stations || []).find(s => s.id === stationId) || (game.stations && game.stations[0]) || { id: 'default', stock: {} };
    this.ensureStationStock(station, game);
    const hasWaterPoint = Boolean(station?.premises?.rooms?.sas_desinfection_pharmacie?.hasWaterPoint || (station?.premises?.rooms?.sas_desinfection_pharmacie?.level >= 2));

    // Véhicules rattachés à cette antenne ayant des consommables entamés (et pas déjà en file de réarmement)
    const candidateVehs = (game.vehicles || []).filter(v => {
      if (station.id !== 'default' && v.stationId && v.stationId !== station.id) return false;
      this.normalizeVehicle(v);
      if (v.armingQueue.some(op => op.type === 'rearm_sanitaire')) return false;
      return (v.consumables < 100 || v.armementLevel < 100 || v.needsRearming || v.a_rearme);
    });

    if (candidateVehs.length === 0) {
      game.showToast('Flotte Opérationnelle ✓', 'Tous vos véhicules sont déjà à 100% d\'armement (ou déjà en cours de réarmement au garage) !', 'green');
      return;
    }

    if (station.stock.caisse_rearmement_charges === undefined && (station.stock.caisse_rearmement || 0) > 0) {
      station.stock.caisse_rearmement_charges = (station.stock.caisse_rearmement || 0) * 3;
    }
    const availableCharges = station.stock.caisse_rearmement_charges || 0;
    const availablePS = station.stockMaterielsPS || 0;

    let totalMissing = 0;
    candidateVehs.forEach(v => {
      totalMissing += (100 - (v.consumables || 100));
    });
    const chargesNeeded = candidateVehs.length;
    const kitsNeeded = Math.ceil(chargesNeeded / 3) || 1;

    if (availableCharges >= chargesNeeded) {
      station.stock.caisse_rearmement_charges -= chargesNeeded;
      station.stock.caisse_rearmement = Math.ceil(station.stock.caisse_rearmement_charges / 3);
      candidateVehs.forEach(v => this.queueSanitaryRearmForVehicle(v, station, game, hasWaterPoint));
    } else if (availablePS >= totalMissing) {
      station.stockMaterielsPS -= totalMissing;
      game.stockMaterielsPS = station.stockMaterielsPS;
      candidateVehs.forEach(v => this.queueSanitaryRearmForVehicle(v, station, game, hasWaterPoint));
    } else {
      const buyCost = kitsNeeded * 370;
      if (game.resources.money >= buyCost) {
        if (confirm(`Stock local insuffisant. Acheter ${kitsNeeded} Kit(s) de réarmement (370 € l'unité, chaque kit réarmant 3 VPSP) pour un total de ${buyCost} € et lancer le réarmement au garage ?`)) {
          game.resources.money -= buyCost;
          const totalNewCharges = kitsNeeded * 3;
          const remainingCharges = availableCharges + totalNewCharges - chargesNeeded;
          station.stock.caisse_rearmement_charges = remainingCharges;
          station.stock.caisse_rearmement = Math.ceil(remainingCharges / 3);
          candidateVehs.forEach(v => this.queueSanitaryRearmForVehicle(v, station, game, hasWaterPoint));
        } else {
          return;
        }
      } else {
        game.showToast('Ressources Insuffisantes', `Stock local vide et trésorerie insuffisante (${buyCost} € requis pour ${kitsNeeded} kit(s) de réarmement).`, 'orange');
        return;
      }
    }

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
    if (typeof game.renderStations === 'function') game.renderStations();
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  rearmVehicleSingle(game, vehicleId) {
    if (!game) game = window.game;
    const veh = (game.vehicles || []).concat(game.allVehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;
    this.normalizeVehicle(veh);

    if (veh.armingQueue.some(op => op.type === 'rearm_sanitaire')) {
      game.showToast('Réarmement déjà en cours ⏳', `${veh.name} est déjà en cours de réarmement sanitaire au garage.`, 'orange');
      return;
    }

    if (veh.consumables >= 100 && !veh.needsRearming && !veh.a_rearme) {
      game.showToast('Véhicule Complet', `${veh.name} est déjà à 100% d'armement consommables.`, 'blue');
      return;
    }

    const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
    this.ensureStationStock(station, game);
    const hasWaterPoint = Boolean(station?.premises?.rooms?.sas_desinfection_pharmacie?.hasWaterPoint || (station?.premises?.rooms?.sas_desinfection_pharmacie?.level >= 2));

    if (station.stock.caisse_rearmement_charges === undefined && (station.stock.caisse_rearmement || 0) > 0) {
      station.stock.caisse_rearmement_charges = (station.stock.caisse_rearmement || 0) * 3;
    }

    const missing = Math.max(10, 100 - (veh.consumables || 100));
    if ((station.stock.caisse_rearmement_charges || 0) >= 1) {
      station.stock.caisse_rearmement_charges -= 1;
      station.stock.caisse_rearmement = Math.ceil(station.stock.caisse_rearmement_charges / 3);
      this.queueSanitaryRearmForVehicle(veh, station, game, hasWaterPoint);
    } else if ((station.stockMaterielsPS || 0) >= missing) {
      station.stockMaterielsPS -= missing;
      game.stockMaterielsPS = station.stockMaterielsPS;
      this.queueSanitaryRearmForVehicle(veh, station, game, hasWaterPoint);
    } else {
      const pendingDeliveries = (game.deliveries || []).filter(d => 
        d.status === 'in_transit' && 
        (d.stationId === station.id || !d.stationId) && 
        ((d.items && d.items.caisse_rearmement > 0) || (d.items && d.items.stock_materiels_ps > 0))
      );

      if (pendingDeliveries.length > 0) {
        const totalOrderedCaisses = pendingDeliveries.reduce((sum, d) => sum + (d.items?.caisse_rearmement || 0), 0);
        const confirmMsg = `Stock local épuisé, mais vous avez ${totalOrderedCaisses} kit(s) de réarmement (soit ${totalOrderedCaisses * 3} réarmements) déjà commandé(s) en transit.\n\nSouhaitez-vous planifier une Mission Logistique pour aller prélever 1 kit sur la commande en cours et réarmer ${veh.name} sans attendre la livraison ?`;
        if (confirm(confirmMsg)) {
          if (typeof game.createRearmamentLogisticsMission === 'function') {
            game.createRearmamentLogisticsMission(veh.id, false, null, true);
          }
          return;
        }
      }

      if (game.resources.money >= 370) {
        if (confirm(`Stock épuisé et aucune commande en transit. Acheter 1 Kit de réarmement (consommables pour 3 réarmements complets de VPSP) pour 370 € et lancer le réarmement de ${veh.name} ?`)) {
          game.resources.money -= 370;
          station.stock.caisse_rearmement_charges = (station.stock.caisse_rearmement_charges || 0) + 2;
          station.stock.caisse_rearmement = Math.ceil(station.stock.caisse_rearmement_charges / 3);
          station.stockMaterielsPS = (station.stockMaterielsPS || 0) + 200;
          game.stockMaterielsPS = station.stockMaterielsPS;
          this.queueSanitaryRearmForVehicle(veh, station, game, hasWaterPoint);
        } else {
          return;
        }
      } else {
        game.showToast('Stock épuisé', 'Aucun kit de réarmement en stock ni en commande, et trésorerie insuffisante (370 €).', 'orange');
        return;
      }
    }

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
    this.refreshOpenLogisticsModalIfNeeded(game);
  },

  buyRearmKit(game, stationId) {
    if (!game) game = window.game;
    const st = (game.stations || []).find(s => s.id === stationId) || game.stations?.[0];
    if (!st) return;
    this.ensureStationStock(st, game);

    const cost = 370;
    if ((game.resources?.money || 0) < cost) {
      game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour acquérir 1 Kit de réarmement (3x armement VPSP).`, 'orange');
      return;
    }

    game.resources.money -= cost;
    st.stock.caisse_rearmement = (st.stock.caisse_rearmement || 0) + 1;
    st.stock.caisse_rearmement_charges = (st.stock.caisse_rearmement_charges || 0) + 3;
    st.stockMaterielsPS = (st.stockMaterielsPS || 0) + 300;
    game.stockMaterielsPS = st.stockMaterielsPS;
    game.showToast('Kit de Réarmement Acquis ✓', `1 Kit de réarmement (3 réarmements complets de VPSP) ajouté au stock (-${cost} €).`, 'green');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
  },

  // =========================================================================
  // 7. MOTEUR DE CONSOMMATION HORAIRE DYNAMIQUE SUR TOUTES LES MISSIONS
  // =========================================================================

  processMissionConsumptionTick(game, mission, deltaSec) {
    if (!mission || mission.status !== 'ongoing') return;
    if (!deltaSec || deltaSec <= 0) return;

    const assignedVehs = this.getMissionVehicles(mission, game);

    // Identifier les vecteurs de soins PS/VPSP
    const psVehicles = assignedVehs.filter(v => {
      this.normalizeVehicle(v);
      return (v.types || []).includes('PS') || (v.types || []).includes('VPSP');
    });

    // Lots de secours embarqués dans les véhicules LOG de la mission
    const activeLots = [];
    assignedVehs.filter(v => (v.types || []).includes('LOG')).forEach(lv => {
      (lv.loadedItems || []).forEach(it => {
        if (it.types && it.types.includes('PS')) {
          activeLots.push({ item: it, parentVehicle: lv });
        }
      });
    });

    if (psVehicles.length === 0 && activeLots.length === 0) return;

    // RÈGLE DE CONSOMMATION :
    // - Petite mission / court dispositif (PAPS <= 2h-3h) : consommation faible (0% à 5% au total sur toute la durée)
    // - Dispositif moyen à grand (DPS-PE à DPS-GE, 12h à 36h+, Urgences, Catastrophes) : consommation importante
    const durHours = (mission.durationHours || ((mission.durationSeconds || 7200) / 3600));
    const scale = (mission.scale || '').toUpperCase();
    const type = (mission.type || '').toLowerCase();
    const isCrisis = mission.isCrisis || ['crise', 'pompiers', 'samu', 'meteo'].includes(type);

    let hourlyRate = 2.0; // 2% par heure -> 4% sur 2 heures pour petite mission
    if (durHours <= 3 && !isCrisis && (scale.includes('PAPS') || (mission.requiredVolunteers || 0) <= 3)) {
      hourlyRate = 1.8; // ~3.6% sur 2 heures (entre 0% et 5%)
    } else if (scale.includes('DPS-PE') || durHours <= 6) {
      hourlyRate = 7.5; // 7.5% / heure -> ~30-45% sur 4-6h
    } else if (scale.includes('DPS-ME') || (durHours > 6 && durHours <= 12)) {
      hourlyRate = 13.0; // 13% / heure
    } else if (scale.includes('DPS-GE') || isCrisis || durHours > 12) {
      hourlyRate = 19.0; // 19% / heure -> rupture en ~5 heures sans réarmement
    }

    const tickLoss = (hourlyRate / 3600) * deltaSec;

    // 1. Dégradation sur les véhicules PS/VPSP
    psVehicles.forEach(v => {
      this.normalizeVehicle(v);
      if (v.consumables > 0) {
        v.consumables = Math.max(0, v.consumables - tickLoss);
        v.armementLevel = Math.round(v.consumables);
        v.isRearmed = (v.consumables >= 100);
        v.needsRearming = (v.consumables < 100);

        // Alerte à 5%
        if (v.consumables <= 5 && !v.warnedLowConsumables) {
          v.warnedLowConsumables = true;
          this.triggerWarning5Percent(game, mission, v);
        }

        // RUPTURE À 0%
        if (v.consumables <= 0 && !v.breachedConsumables) {
          v.breachedConsumables = true;
          this.triggerAstreinteConsumableAlert(game, mission, v);
        }
      } else if (v.consumables <= 0 && !v.breachedConsumables) {
        v.breachedConsumables = true;
        this.triggerAstreinteConsumableAlert(game, mission, v);
      }
    });

    // 2. Dégradation sur les lots embarqués (résistent mieux car plus grande capacité)
    activeLots.forEach(({ item, parentVehicle }) => {
      if (item.consumables === undefined) item.consumables = 100;
      if (item.consumables > 0) {
        item.consumables = Math.max(0, item.consumables - (tickLoss * 0.60));
        if (item.consumables <= 5 && !item.warnedLowConsumables) {
          item.warnedLowConsumables = true;
          this.triggerWarning5Percent(game, mission, item, parentVehicle);
        }
        if (item.consumables <= 0 && !item.breachedConsumables) {
          item.breachedConsumables = true;
          this.triggerAstreinteConsumableAlert(game, mission, item, parentVehicle);
        }
      } else if (item.consumables <= 0 && !item.breachedConsumables) {
        item.breachedConsumables = true;
        this.triggerAstreinteConsumableAlert(game, mission, item, parentVehicle);
      }
    });
  },

  // Alerte préventive à 5%
  triggerWarning5Percent(game, mission, item, parentVeh = null) {
    const name = item.name || item.label || 'Vecteur de secours';
    const parentTxt = parentVeh ? ` (embarqué dans ${parentVeh.name})` : '';
    game.showToast('⚠️ Consommables Critiques (5%)', `Attention : ${name}${parentTxt} sur « ${mission.title} » est sur le point d'épuiser ses consommables (jauge à 5%). Préparez un réarmement !`, 'orange');
    if (window.ProtecAudio && typeof window.ProtecAudio.playRadioBeep === 'function') {
      window.ProtecAudio.playRadioBeep();
    }
  },

  // =========================================================================
  // 8. RUPTURE À 0% : ALERTE DU RESPONSABLE & ARBITRAGE ASTREINTE
  // =========================================================================

  triggerAstreinteConsumableAlert(game, mission, item, parentVeh = null) {
    const itemName = item.name || item.label || 'Vecteur de secours';
    mission.logisticsAstreinteAlert = true;

    // Identifier le responsable du dispositif
    let leaderName = 'Chef de Dispositif';
    let leaderRank = 'CD';
    const vols = this.getMissionVolunteers(mission, game);
    if (vols.length > 0) {
      const leader = vols.find(v => ['Chef de Dispositif', 'Chef de Poste', 'Chef d’Équipe', 'Chef d\'Équipe', 'CE', 'Cadre'].includes(v.rank) || (v.skills || []).some(s => s && s.toLowerCase().includes('ce')));
      if (leader) {
        leaderName = leader.name;
        leaderRank = leader.rank;
      } else if (vols[0]) {
        leaderName = vols[0].name;
        leaderRank = vols[0].rank || 'Secouriste';
      }
    }

    // 1. Première baisse immédiate de moral et motivation chez les bénévoles (-15%)
    vols.forEach(vol => {
      vol.motivation = Math.max(10, (vol.motivation || 75) - 15);
      vol.humeur = Math.max(10, (vol.humeur || 75) - 15);
      vol.morale = Math.max(10, (vol.morale || 75) - 15);
    });

    // 2. Notification d'astreinte
    const notifTitle = '🚨 APPEL ASTREINTE : Rupture de Consommables !';
    const notifMsg = `${leaderRank} ${leaderName} signale une rupture totale de consommables (${itemName}) sur « ${mission.title} ». Demande urgente d'un renfort LOG !`;

    if (window.ProtecNotifications && typeof window.ProtecNotifications.recordNotification === 'function') {
      window.ProtecNotifications.recordNotification({
        title: notifTitle,
        message: notifMsg,
        category: 'crise',
        level: 'danger'
      });
    } else if (typeof game.addNotification === 'function') {
      game.addNotification(notifTitle, notifMsg, 'danger');
    }

    if (window.ProtecAudio && typeof window.ProtecAudio.playRadioBeep === 'function') {
      window.ProtecAudio.playRadioBeep();
    }

    // 3. Ouvrir la modale d'arbitrage de l'astreinte
    this.openAstreinteModal(game, mission, item, leaderName, leaderRank);
  },

  openAstreinteModal(game, mission, item, leaderName, leaderRank) {
    const existing = document.getElementById('astreinte-consumable-modal');
    if (existing) existing.remove();

    const itemName = item.name || item.label || 'Vecteur de secours';

    // Rechercher les véhicules LOG disponibles à la base
    const availableLogVehs = (game.vehicles || []).filter(v => {
      this.normalizeVehicle(v);
      return (v.types || []).includes('LOG') && (v.status === 'dispo' || v.status === 'disponible');
    });

    const modalHTML = `
      <div id="astreinte-consumable-modal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
        <div class="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col max-h-[90vh]">
          <!-- En-tête Alerte d'Urgence Astreinte -->
          <div class="p-4 sm:p-5 bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white flex items-center justify-between gap-3 shadow-md">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shadow-inner animate-pulse">
                🚨
              </div>
              <div>
                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/25 border border-white/30">
                  Appel d'Urgence Astreinte
                </span>
                <h3 class="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5">
                  Rupture Complète de Consommables (0%)
                </h3>
              </div>
            </div>
            <button onclick="document.getElementById('astreinte-consumable-modal').remove()" class="text-white/80 hover:text-white text-lg p-1">✕</button>
          </div>

          <div class="p-5 overflow-y-auto space-y-4 text-xs">
            <!-- Message radio officiel du responsable -->
            <div class="p-4 rounded-2xl bg-red-50/90 border border-red-200 text-slate-800 space-y-2">
              <div class="flex items-center gap-2 font-black text-xs text-red-900">
                <span>📻</span>
                <span>Message Radio — ${leaderRank} ${leaderName} (Responsable sur le Dispositif) :</span>
              </div>
              <blockquote class="italic text-slate-700 leading-relaxed border-l-4 border-red-400 pl-3">
                « Astreinte de garde ? Ici ${leaderName} sur « ${mission.title} ». Nous sommes en <strong>rupture totale de consommables sur ${itemName}</strong> ! Les trousses et sacs de secours sont vides, les secouristes sont complètement démunis face aux victimes ! Nous demandons l'envoi immédiat d'un renfort LOG depuis l'antenne avec des caisses de réarmement ! »
              </blockquote>
            </div>

            <!-- Impact immédiat -->
            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2.5">
              <span class="text-xl">⚠️</span>
              <div>
                <strong>Impact Moral Terrain :</strong> Frustration immédiate des bénévoles engagés sur le terrain. Sans renfort logistique, le mécontentement va s'aggraver et l'autorité organisatrice appliquera des pénalités sévères.
              </div>
            </div>

            <!-- Choix opérationnel de l'astreinte -->
            <div class="space-y-3 pt-2">
              <h4 class="font-black text-slate-900 uppercase text-[11px] tracking-wider">
                Décision de l'Astreinte :
              </h4>

              <!-- Option 1 : Déployer un renfort LOG -->
              <div class="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h5 class="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <span>📦</span>
                      <span>OPTION 1 : Envoyer un Renfort LOG d'Astreinte</span>
                    </h5>
                    <p class="text-[11px] text-emerald-800 mt-0.5">
                      Fait partir immédiatement un véhicule LOG chargé de caisses de réarmement. À l'arrivée sur zone, le matériel est réarmé, l'équipe est rassurée et la mission continue sereinement.
                    </p>
                  </div>
                </div>

                ${availableLogVehs.length > 0 ? `
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase text-emerald-900 block">Sélectionnez le véhicule LOG au garage :</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      ${availableLogVehs.map(lv => `
                        <button 
                          onclick="window.ProtecLogistique.sendAstreinteReinforcement(window.game, '${mission.id}', '${lv.id}'); document.getElementById('astreinte-consumable-modal').remove();"
                          class="p-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100/70 text-left transition cursor-pointer shadow-xs flex items-center gap-2.5 group">
                          <span class="text-2xl">${lv.type === 'FLIT' ? '🏗️' : '🚐'}</span>
                          <div class="min-w-0 flex-1">
                            <div class="font-black text-xs text-slate-900 truncate group-hover:text-emerald-900">${lv.name}</div>
                            <div class="text-[10px] text-slate-500">${lv.capacity_log} slots LOG • Carburant ${lv.fuel || 90}%</div>
                          </div>
                          <span class="px-2 py-1 rounded-lg bg-emerald-600 text-white font-black text-[10px] shrink-0">Déployer ➔</span>
                        </button>
                      `).join('')}
                    </div>
                  </div>
                ` : `
                  <div class="p-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs">
                    ⚠️ Aucun véhicule LOG n'est actuellement disponible au garage (tous engagés). Vous pouvez ordonner un détachement d'urgence ou refuser.
                  </div>
                `}
              </div>

              <!-- Option 2 : Refuser ou Pas de renfort -->
              <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                <div>
                  <h5 class="text-xs font-black text-rose-950 flex items-center gap-1.5">
                    <span>❌</span>
                    <span>OPTION 2 : Refuser le Renfort (Indisponibilité de moyens)</span>
                  </h5>
                  <p class="text-[10.5px] text-rose-800 mt-0.5">
                    L'équipe reste sur place sans matériel : forte démotivation des secouristes et mécontentement de l'organisateur (pénalité de convention).
                  </p>
                </div>
                <button 
                  onclick="window.ProtecLogistique.refuseAstreinteReinforcement(window.game, '${mission.id}'); document.getElementById('astreinte-consumable-modal').remove();"
                  class="px-3.5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer shrink-0">
                  Refuser le Renfort
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    if (window.lucide) window.lucide.createIcons();
  },

  sendAstreinteReinforcement(game, missionId, logVehId) {
    if (!game) game = window.game;
    const mission = (game.missions || []).find(m => m.id === missionId);
    const veh = (game.vehicles || []).find(v => v.id === logVehId);
    if (!mission || !veh) return;

    this.normalizeVehicle(veh);
    const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
    this.ensureStationStock(station, game);

    // Vérifier si au moins 1 caisse de réarmement est embarquée ou en stock
    let hasCaisse = (veh.loadedItems || []).some(it => it.isCaisseRearm || it.id === 'caisse_rearmement');
    if (!hasCaisse) {
      if ((station.stock.caisse_rearmement || 0) >= 1) {
        station.stock.caisse_rearmement -= 1;
        veh.loadedItems.push({
          id: 'caisse_rearmement',
          name: 'Kit de Réarmement (3x VPSP)',
          slots: 1,
          isCaisseRearm: true,
          types: ['LOG'],
          consumables: 300,
          maxConsumables: 300
        });
        hasCaisse = true;
      } else if (game.resources.money >= 370) {
        game.resources.money -= 370;
        veh.loadedItems.push({
          id: 'caisse_rearmement',
          name: 'Kit de Réarmement (3x VPSP)',
          slots: 1,
          isCaisseRearm: true,
          types: ['LOG'],
          consumables: 300,
          maxConsumables: 300
        });
        hasCaisse = true;
        game.showToast('Kit acheté 🛒', '1 Kit de réarmement (3x armement VPSP) acheté pour 370 € et chargé à bord.', 'teal');
      }
    }

    veh.status = 'transit_astreinte';
    veh.fuel = Math.max(10, (veh.fuel || 90) - 5);

    mission.astreinteReinforcement = {
      vehicleId: veh.id,
      vehicleName: veh.name,
      startedAt: Date.now(),
      etaSeconds: 40 // 40 secondes réelles d'acheminement sous gyrophares
    };

    game.showToast('Renfort LOG Déployé 🚨', `Le ${veh.name} est parti d'urgence avec les caisses de réarmement vers « ${mission.title} » !`, 'green');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    game.saveGame();
  },

  refuseAstreinteReinforcement(game, missionId) {
    if (!game) game = window.game;
    const mission = (game.missions || []).find(m => m.id === missionId);
    if (!mission) return;

    mission.consumablesBreachedAndRefused = true;

    // Chute sévère du moral et de l'humeur (-25%)
    const vols = this.getMissionVolunteers(mission, game);
    vols.forEach(vol => {
      vol.motivation = Math.max(5, (vol.motivation || 60) - 25);
      vol.humeur = Math.max(5, (vol.humeur || 60) - 25);
      vol.morale = Math.max(5, (vol.morale || 60) - 25);
    });

    // Dégradation de la note de satisfaction et de relation client (-35%)
    mission.organizerSatisfaction = Math.max(10, (mission.organizerSatisfaction !== undefined ? mission.organizerSatisfaction : 85) - 35);
    game.resources.reputation = Math.max(10, (game.resources.reputation || 50) - 5);

    game.showToast('Renfort Refusé ⚠️', `Faute de matériel, l'équipe poursuit en mode très dégradé. Le moral des bénévoles s'effondre et l'organisateur dépose une réclamation.`, 'orange');
    if (window.ProtecAudio) window.ProtecAudio.playRadioBeep();

    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
  },

  // Suivi en temps réel de l'acheminement du renfort LOG dans l'horloge
  updateAstreinteTransits(game, deltaSec) {
    if (!game || !Array.isArray(game.missions)) return;
    const now = Date.now();

    game.missions.forEach(m => {
      if (m.astreinteReinforcement && m.status === 'ongoing') {
        const ar = m.astreinteReinforcement;
        const elapsed = Math.floor((now - ar.startedAt) / 1000);

        if (elapsed >= (ar.etaSeconds || 40)) {
          // Arrivée sur zone !
          const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
          const renfVeh = allVehs.find(v => v.id === ar.vehicleId);

          // Réarmer tous les véhicules PS/VPSP et lots en souffrance sur la mission
          const assignedVehs = (m.assignedVehicleIds || []).map(id => allVehs.find(v => v.id === id)).filter(Boolean);
          assignedVehs.forEach(v => {
            if ((v.types || []).includes('PS') || (v.types || []).includes('VPSP')) {
              v.consumables = 100;
              v.armementLevel = 100;
              v.isRearmed = true;
              v.needsRearming = false;
              v.warnedLowConsumables = false;
              v.breachedConsumables = false;
            }
          });

          // Réarmer les lots embarqués
          assignedVehs.filter(v => (v.types || []).includes('LOG')).forEach(lv => {
            (lv.loadedItems || []).forEach(it => {
              if (it.types && it.types.includes('PS')) {
                it.consumables = 100;
                it.warnedLowConsumables = false;
                it.breachedConsumables = false;
              }
            });
          });

          // Stabiliser et remonter le moral des bénévoles (+10%)
          if (Array.isArray(m.registeredVolunteers)) {
            m.registeredVolunteers.forEach(id => {
              const vol = (game.volunteers || []).find(v => v.id === id);
              if (vol) {
                vol.motivation = Math.min(100, (vol.motivation || 50) + 10);
                vol.humeur = Math.min(100, (vol.humeur || 50) + 10);
              }
            });
          }

          if (renfVeh) {
            renfVeh.status = 'sur_les_lieux';
          }

          game.showToast('Renfort LOG Arrivé ! 🟢', `Le renfort LOG est arrivé sur « ${m.title} ». Réarmement effectué à 100%, le moral des secouristes remonte !`, 'green');
          if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();

          m.astreinteReinforcement = null;
          game.saveGame();
          if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
        }
      }
    });
  },

  // =========================================================================
  // 9. RÉFÉRENTIEL ULTRA-RÉALISTE DU MATÉRIEL & LOTS DE LA PROTECTION CIVILE
  // =========================================================================

  LOT_COMPOSITIONS: {
    caisse_rearmement: {
      id: 'caisse_rearmement',
      title: 'Kit de réarmement (consommable)',
      shortName: 'Kit réarmement',
      standard: 'RNMSC - Réarmement Consommables (3x VPSP)',
      category: 'Soins',
      tag: 'soins',
      tagLabel: 'Soins',
      slots: 1,
      price: 370,
      consumables: 300,
      maxConsumables: 300,
      icon: 'archive',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700',
      desc: 'Kit de réarmement complet en consommables sanitaires. Correspond à 3x l\'armement complet d\'un VPSP (3 réarmements complets).',
      items: [
        { icon: '🩹', name: 'Compresses stériles 10x10 cm (boîte 100)', qty: 3 },
        { icon: '🩹', name: 'Bandes extensibles Velpeau 10 cm', qty: 18 },
        { icon: '🩸', name: 'Garrots tourniquets tactiques CAT Gen 7', qty: 6 },
        { icon: '🩹', name: 'Pansements compressifs d’urgence israéliens', qty: 12 },
        { icon: '🫁', name: 'Masques O2 haute concentration avec tubulure', qty: 9 },
        { icon: '🧴', name: 'Flacons antiseptique chlorhexidine 250 ml', qty: 3 },
        { icon: '🛡️', name: 'Colliers cervicaux pédiatriques & adultes', qty: 6 },
        { icon: '✨', name: 'Couvertures de survie isothermes or/argent', qty: 12 },
        { icon: '🧤', name: 'Boîtes gants nitrile stériles usage unique', qty: 3 },
        { icon: '🗑️', name: 'Sacs étanches DASRI déchets de soins', qty: 6 }
      ]
    },
    lot_secours_a: {
      id: 'lot_secours_a',
      title: 'Lot A - Poste de secours',
      shortName: 'Lot A',
      standard: 'RNMSC FNPC - Poste de Secours & DPS-ME/GE',
      category: 'Soins',
      tag: 'soins',
      tagLabel: 'Soins',
      slots: 4,
      price: 2830,
      consumables: 200,
      maxConsumables: 200,
      icon: 'tent',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-700',
      desc: 'Tente gonflable de secours 16 m², mobilier de soins, rampe d’éclairage et dotation complète armée en consommables (double de l\'armement d\'un VPSP).',
      items: [
        { icon: '⛺', name: 'Tente gonflable de secours 16 m² avec armature & gonfleur électrique', qty: 1 },
        { icon: '🛏️', name: 'Brancards pliables de soins sur tréteaux d’examen médical', qty: 2 },
        { icon: '💡', name: 'Rampe d’éclairage de poste LED 220V/12V avec trépied télescopique', qty: 1 },
        { icon: '📋', name: 'Table pliante de secrétariat & régulation SINUS', qty: 1 },
        { icon: '🪑', name: 'Chaises pliantes d’attente victimes et témoins', qty: 4 },
        { icon: '📁', name: 'Mallette Fiches Médicales de l’Avant (FMA) & Main Courante', qty: 1 },
        { icon: '🌡️', name: 'Chauffage soufflant d’appoint électrique de tente', qty: 1 },
        { icon: '🗑️', name: 'Poubelles à pédale étanches DASRI & Déchets ménagers', qty: 2 },
        { icon: '📦', name: 'Pack consommables poste fixe (2x armement VPSP - 200 pts)', qty: 1 }
      ]
    },
    lot_secours_b: {
      id: 'lot_secours_b',
      title: 'Lot B - Premiers secours',
      shortName: 'Lot B',
      standard: 'RNMSC FNPC - Dotation VPSP / Urgence Réflexe',
      category: 'Soins',
      tag: 'soins',
      tagLabel: 'Soins',
      slots: 2,
      price: 320,
      consumables: 50,
      maxConsumables: 50,
      icon: 'briefcase-medical',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-700',
      desc: 'Sac d’urgence réflexe avec oxygène, DAE et matériel de bilan. Armé en consommables à l\'achat (la moitié de l\'armement d\'un VPSP).',
      items: [
        { icon: '🫁', name: 'Bouteille Oxygène Médical 2L (200 bar) + manodétendeur compact', qty: 1 },
        { icon: '⚡', name: 'Défibrillateur Automatisé DAE + 2 paires électrodes', qty: 1 },
        { icon: '💨', name: 'Insufflateur manuel BAVU adulte & enfant + 3 masques', qty: 1 },
        { icon: '🩺', name: 'Kit Diagnostic (Tensiomètre, Stéthoscope, Oxymètre SpO2, Glycémie)', qty: 1 },
        { icon: '🩸', name: 'Kit Hémorragie (1 Garrot tourniquet CAT, 2 pansements israéliens)', qty: 1 },
        { icon: '🧪', name: 'Aspirateur de mucosités manuel d’urgence + sondes', qty: 1 },
        { icon: '🛡️', name: 'Pack Colliers Cervicaux multipostures (Adulte + Pédiatrique)', qty: 2 },
        { icon: '✨', name: 'Couvertures de survie isothermes', qty: 2 },
        { icon: '📦', name: 'Dotation consommables premiers secours (0.5x VPSP - 50 pts)', qty: 1 }
      ]
    },
    lot_secours_c: {
      id: 'lot_secours_c',
      title: 'Lot C - Brancardage & Immobilisation',
      shortName: 'Lot C',
      standard: 'RNMSC FNPC - Traumatologie & Relevage',
      category: 'Soins',
      tag: 'soins',
      tagLabel: 'Soins',
      slots: 2,
      price: 1950,
      consumables: 100,
      maxConsumables: 100,
      icon: 'stretch-horizontal',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-700',
      desc: 'Matériel complet d’immobilisation, de relevage et d’évacuation des blessés. Armé en consommables à l\'achat.',
      items: [
        { icon: '🛌', name: 'Matelas Immobilisateur à Dépression (MID Coquille) + pompe', qty: 1 },
        { icon: '📏', name: 'Plan Dur spinal radio-transparent + Sangles araignée', qty: 1 },
        { icon: '🔒', name: 'Immobilisateur de tête (Head-Blocks latéraux multipositions)', qty: 1 },
        { icon: '🦴', name: 'Pack Attelles modelables aluform & dépression (Bras & Jambes)', qty: 4 },
        { icon: '🪑', name: 'Chaise de transport d’escalier pliable avec chenilles alu', qty: 1 },
        { icon: '🥄', name: 'Brancard cuillère / de relevage sécable alu', qty: 1 },
        { icon: '🩹', name: 'Attelle de traction fémorale / sangle pelvienne SAM Sling', qty: 1 },
        { icon: '📐', name: 'Écharpes triangulaires de maintien de membre', qty: 4 }
      ]
    },
    lot_hebergement: {
      id: 'lot_hebergement',
      title: 'Lot Hébergement',
      shortName: 'Lot Hébergement',
      standard: 'Sécurité Civile - Plan Communal de Sauvegarde (PCS)',
      category: 'Action Sociale & Hébergement',
      slots: 3,
      price: 2100,
      icon: 'bed-double',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700',
      desc: 'Lits de camp et duvets pour équiper un centre d’accueil pour sinistrés.',
      items: [
        { icon: '🛏️', name: 'Lits de camp métalliques pliables type PICOT armée', qty: 10 },
        { icon: '🧶', name: 'Couvertures polaires lavables étiquetées Protection Civile', qty: 15 },
        { icon: '🧼', name: 'Trousses d’hygiène de première urgence (brosse, savon, dentifrice, serviette)', qty: 10 },
        { icon: '🚪', name: 'Paravents d’intimité & cloisons amovibles de dignité', qty: 2 },
        { icon: '🍼', name: 'Kits petite enfance d’urgence (couches, lingettes, biberons dosés)', qty: 2 },
        { icon: '📝', name: 'Kit administratif accueil sinistrés (fiches CAREP, badges)', qty: 1 }
      ]
    },
    lot_ravitaillement: {
      id: 'lot_ravitaillement',
      title: 'Lot Ravitaillement',
      shortName: 'Lot Ravitaillement',
      standard: 'Logistique Soutien des Troupes & Bénévoles',
      category: 'Ravitaillement & Énergie Humaine',
      slots: 1,
      price: 1350,
      icon: 'utensils',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-700',
      desc: 'Boissons chaudes et collations pour restaurer les bénévoles et sinistrés.',
      items: [
        { icon: '💧', name: 'Bouteilles d’eau minérale plate 50 cl (bouchon sport)', qty: 24 },
        { icon: '☕', name: 'Percolateur / Thermos inox café & eau chaude 5L', qty: 1 },
        { icon: '🫖', name: 'Boîte de thé, café soluble, chocolat chaud, sucres & gobelets', qty: 1 },
        { icon: '🍫', name: 'Barres de céréales énergétiques & compotes gourdes', qty: 20 },
        { icon: '🍪', name: 'Paquets de biscuits secs & fruits secs revigorants', qty: 10 },
        { icon: '🧻', name: 'Rouleau sacs poubelle 50L & lingettes nettoyantes', qty: 1 }
      ]
    },
    lot_eclairage: {
      id: 'lot_eclairage',
      title: 'Lot Éclairage',
      shortName: 'Lot Éclairage',
      standard: 'Pôle Technique & Crise Nocturne',
      category: 'Énergie & Éclairage Chantier',
      slots: 2,
      price: 1600,
      icon: 'lightbulb',
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-700',
      desc: 'Projecteurs et mâts pour éclairer les postes de secours la nuit.',
      items: [
        { icon: '⚡', name: 'Groupe électrogène insonorisé 3.0 kVA inverter + nourrice 10L', qty: 1 },
        { icon: '💡', name: 'Mât d’éclairage télescopique LED 360° (20 000 lumens, h: 3m)', qty: 1 },
        { icon: '🔦', name: 'Projecteurs d’appoint LED 50W sur accus portatifs', qty: 2 },
        { icon: '🔌', name: 'Enrouleurs électriques de chantier 25m étanches IP44', qty: 2 },
        { icon: '🧰', name: 'Blocs multiprises étanches et adaptateurs industriels', qty: 2 }
      ]
    },
    lot_pompage: {
      id: 'lot_pompage',
      title: 'Lot Épuisement & Pompage Eaux Chargées (Inondations)',
      shortName: 'Lot Épuisement Inondation',
      standard: 'Mission ORSEC Inondations & Crues',
      category: 'Secours Inondation & Pompage',
      slots: 3,
      price: 1850,
      icon: 'waves',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-700',
      desc: 'Matériels gros débit pour évacuer les eaux d’inondation dans les caves, parkings et habitations.',
      items: [
        { icon: '🌊', name: 'Motopompe thermique gros débit (60 m³/h) raccords DSP', qty: 1 },
        { icon: '🚰', name: 'Tuyaux d’aspiration armés 5m avec crépine à clapet', qty: 2 },
        { icon: '🚒', name: 'Tuyaux de refoulement professionnels 70 mm x 20 m', qty: 4 },
        { icon: '⚡', name: 'Pompes électriques vide-caves submersibles 230V', qty: 2 },
        { icon: '🧹', name: 'Raclettes à eau industrielles larges & seaux 15L', qty: 4 }
      ]
    },
    lot_tronconnage: {
      id: 'lot_tronconnage',
      title: 'Lot Tronçonnage & Dégagement Voirie (Tempêtes)',
      shortName: 'Lot Tronçonnage Voirie',
      standard: 'Secours Routiers & Dégagement Crise',
      category: 'Dégagement & Tronçonnage',
      slots: 2,
      price: 1450,
      icon: 'axe',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-700',
      desc: 'Matériels thermiques et équipements de protection individuelle pour dégager les voies obstruées.',
      items: [
        { icon: '🪚', name: 'Tronçonneuses thermiques (guide 45 cm et 50 cm) + chaînes secours', qty: 2 },
        { icon: '🛡️', name: 'Pantalons et manchettes anti-coupure Classe 2 (EPI bûcheron)', qty: 2 },
        { icon: '👷', name: 'Casques forestiers avec visière grillagée & coquilles antibruit', qty: 2 },
        { icon: '⛓️', name: 'Tire-fort de débardage 1.6T + câble acier 20m + élingues', qty: 1 },
        { icon: '⛽', name: 'Bidon combiné carburant 2T (5L) + huile de chaîne (2.5L)', qty: 1 },
        { icon: '🪓', name: 'Hachette, merlin d’abattage & coins d’ébranchage', qty: 1 }
      ]
    },
    sac_pedestre: {
      id: 'sac_pedestre',
      title: 'Sacoche Binôme Secouriste Pédestre (Patrouille Foule)',
      shortName: 'Sacoche Binôme Pédestre',
      standard: 'RNMSC - Équipe Pédestre / PAPS Mobile',
      category: 'Secours Itinérant & Mobilité',
      slots: 1,
      price: 320,
      icon: 'backpack',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-200 dark:border-teal-700',
      desc: 'Sac d’intervention ultra-compact pour binôme circulant à pied au cœur des rassemblements denses.',
      items: [
        { icon: '🎒', name: 'Sacoche d’épaule compacte Cordura haute visibilité', qty: 1 },
        { icon: '⚡', name: 'Défibrillateur semi-automatique DAE compact de poche', qty: 1 },
        { icon: '🩸', name: 'Garrot tourniquet hémostatique CAT + Pansements israéliens', qty: 2 },
        { icon: '🩹', name: 'Pochettes de pansements et compresses stériles', qty: 6 },
        { icon: '🧴', name: 'Spray antiseptique dermo-nettoyant chlorhexidine', qty: 1 },
        { icon: '✨', name: 'Couvertures de survie isothermes', qty: 2 },
        { icon: '🧤', name: 'Paires de gants nitrile à usage unique', qty: 4 }
      ]
    },
    remorque_groupe_electro: {
      id: 'remorque_groupe_electro',
      title: 'Remorque Groupe Électrogène Insonorisé 50 kVA (Attelage Boule 50 mm)',
      shortName: 'Remorque GE 50 kVA',
      standard: 'Soutien Électrique Lourd & Continuité d’Activité ORSEC',
      category: 'Énergie & Black-out',
      slots: 3,
      price: 4800,
      icon: 'zap',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700',
      desc: 'Groupe électrogène diesel insonorisé 50 kVA (40 kW) sur châssis routier freiné tracté par attelage boule 50 mm.',
      items: [
        { icon: '⚡', name: 'Alternateur triphasé 400V / monophasé 230V régulé AVR 50 kVA', qty: 1 },
        { icon: '⛽', name: 'Cuve intégrée GNR 350L (autonomie 24-36h en pleine charge)', qty: 1 },
        { icon: '🔌', name: 'Armoire de distribution étanche IP67 (2x 32A tri, 4x 16A mono)', qty: 1 },
        { icon: '🧯', name: 'Inverseur de source normal/secours automatique/manuel', qty: 1 },
        { icon: '🔗', name: 'Tête d’attelage boule 50 mm freinée + câble de sécurité et béquille', qty: 1 },
        { icon: '🦯', name: 'Piquet de terre en cuivre 1.5m + câble équipotentiel 16 mm²', qty: 2 }
      ]
    },
    remorque_motopompe: {
      id: 'remorque_motopompe',
      title: 'Remorque Moto-Pompe d’Épuisement Grande Capacité (MPGC 120 m³/h - Attelage Boule)',
      shortName: 'Remorque Motopompe MPGC',
      standard: 'ORSEC Inondations & Crues Majeures',
      category: 'Inondations & Pompage Lourd',
      slots: 3,
      price: 3800,
      icon: 'waves',
      badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-200 dark:border-cyan-700',
      desc: 'Unité motopompe thermique gros débit (120 m³/h soit 2 000 L/min) sur châssis remorque routière avec tête d’attelage boule 50 mm.',
      items: [
        { icon: '🌊', name: 'Corps de pompe fonte haute résistance eaux boueuses & chargées', qty: 1 },
        { icon: '⚙️', name: 'Moteur diesel 4 temps 22 ch à démarrage électrique & batterie', qty: 1 },
        { icon: '🚰', name: 'Tuyaux d’aspiration armés 100 mm (DSP 100) avec crépine à clapet', qty: 3 },
        { icon: '🚒', name: 'Couronnes de tuyaux de refoulement DSP 100 de 20 m (120 m total)', qty: 6 },
        { icon: '🔗', name: 'Châssis remorque freinée avec tête d’attelage boule 50 mm', qty: 1 },
        { icon: '🧹', name: 'Clés tricoises DN 100, réducteurs DSP 100/65 et vannes quart de tour', qty: 4 }
      ]
    }
  },

  getLotComposition(itemId) {
    if (!itemId) return null;
    if (this.LOT_COMPOSITIONS && this.LOT_COMPOSITIONS[itemId]) {
      return this.LOT_COMPOSITIONS[itemId];
    }
    const catItem = (this.CATALOG || []).find(i => i.id === itemId);
    if (catItem) {
      return {
        id: catItem.id,
        title: catItem.name,
        shortName: catItem.name.split('(')[0].trim(),
        slots: catItem.slots || 1,
        items: [
          { icon: '📦', name: catItem.name, qty: 1 }
        ]
      };
    }
    return null;
  },

  // =========================================================================
  // 9. SECTION UI : ARMEMENT & CHARGEMENT LOGISTIQUE (GARAGE & MISSION)
  // =========================================================================

  renderSingleVehicleGarageArmamentPanel(game, veh, station, mission = null, showLotsCatalog = false) {
    if (!game || !veh) return '';
    this.normalizeVehicle(veh);
    const isLog = (veh.types || []).includes('LOG');
    const capLog = veh.capacity_log || 0;
    const usedSlots = this.getUsedLogSlots(veh);
    const freeSlots = Math.max(0, capLog - usedSlots);
    const mId = mission ? mission.id : '';

    const queue = Array.isArray(veh.armingQueue) ? veh.armingQueue : [];
    const isArming = queue.length > 0;
    const rawRemSec = this.getVehicleArmingRemainingSec(veh);
    const effRemSec = this.getVehicleEffectiveArmingRemainingSec(veh, game);
    const totSec = Math.max(1, this.getVehicleArmingTotalSec(veh));
    const pct = isArming ? Math.min(100, Math.max(0, Math.round(((totSec - rawRemSec) / totSec) * 100))) : 0;
    const opsCount = this.getArmingOperatorsCount(veh, game);
    const mult = this.getArmingSpeedMultiplier(veh, game) || 1;
    const currentOp = queue[0] || null;
    const currentOpRawRem = currentOp ? Math.max(0, Math.ceil(currentOp.remainingSec || 0)) : 0;
    const currentOpEffRem = mult > 1 ? Math.ceil(currentOpRawRem / mult) : currentOpRawRem;
    const currentOpTot = currentOp ? (currentOp.totalSec || this.LOT_ARM_DURATION_SEC) : 180;
    const currentPct = currentOp ? Math.min(100, Math.max(0, Math.round(((currentOpTot - currentOpRawRem) / currentOpTot) * 100))) : 0;

    const hasLogResp = typeof game.hasActiveLogisticsResponsible === 'function' && game.hasActiveLogisticsResponsible();
    const assignedVols = (veh.assignedArmingVolunteerIds || []).map(id => (game.volunteers || []).find(v => v.id === id)).filter(Boolean);
    const hasPersonnel = hasLogResp || assignedVols.length > 0;
    const candidateVols = this.getAvailableGarageVolunteers(game, mission, veh).slice(0, 4);

    return `
      <div class="pt-2 border-t border-slate-200 space-y-3">
        <!-- Panneau de progression & affectation des bénévoles au garage -->
        <div class="p-3 rounded-2xl border-2 ${isArming ? (hasPersonnel ? 'border-amber-400 bg-amber-50/90' : 'border-rose-400 bg-rose-50/90') : 'border-slate-200 bg-slate-50/80'} space-y-2.5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isArming ? (hasPersonnel ? 'bg-amber-500 text-white animate-pulse' : 'bg-rose-600 text-white animate-pulse') : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}">
                ${isArming
                  ? (hasPersonnel
                    ? `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Manutention en cours (${queue.length} op.)</span>`
                    : `<i data-lucide="pause-circle" class="w-3.5 h-3.5"></i><span>En pause : Attente bénévole</span>`)
                  : `<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Prêt au garage (3 min/lot)</span>`
                }
              </span>
              ${mult > 1 ? `
                <span class="px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-indigo-600 text-white shadow-2xs">
                  ⚡ Coopération (${opsCount} pers.) : Vitesse ×${mult}
                </span>
              ` : ''}
            </div>
            ${isArming ? `
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold text-slate-600">Temps restant :</span>
                <span id="veh-arming-total-timer-${veh.id}" class="px-2 py-0.5 rounded-lg font-mono text-xs font-black ${hasPersonnel ? 'bg-amber-900 text-amber-100' : 'bg-rose-900 text-rose-100'}">
                  ${mult > 1 ? `~${this.formatArmingClock(effRemSec)} (×${mult})` : `${this.formatArmingClock(rawRemSec)} / ${this.formatArmingClock(totSec)}`}
                </span>
              </div>
            ` : ''}
          </div>

          <!-- Personnel affecté -->
          <div class="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="space-y-1">
              <div class="text-[10px] font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                <span>👷 Équipe au garage (+5 XP/lot) :</span>
                ${hasLogResp ? `<span class="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 text-[9px] font-black">✓ Resp. Logistique</span>` : ''}
                ${assignedVols.map(v => `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <span>👷 ${v.name}</span>
                    <button type="button" onclick="window.ProtecLogistique.unassignVolunteerFromVehicleArming('${mId}', '${veh.id}', '${v.id}')" class="text-rose-600 hover:text-rose-800 font-black ml-0.5 cursor-pointer">✕</button>
                  </span>
                `).join('')}
              </div>
              ${!hasPersonnel ? `
                <p class="text-[10px] font-bold text-rose-600">⚠️ Affectez au moins 1 bénévole pour faire avancer le chrono (2 bénévoles = ×1.5, 3 = ×2.0).</p>
              ` : `
                <p class="text-[9.5px] text-slate-500">Astuce : affectez jusqu'à 3 bénévoles pour réduire le temps par lot à 2 min (×1.5) ou 1 min 30 (×2.0).</p>
              `}
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${candidateVols.slice(0, 2).map(cv => `
                <button type="button" onclick="window.ProtecLogistique.assignVolunteerToVehicleArming('${mId}', '${veh.id}', '${cv.id}')" class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-pc-blue hover:bg-pc-blue-light text-white transition cursor-pointer">
                  + Affecter ${cv.name}
                </button>
              `).join('')}
            </div>
          </div>

          ${isArming ? `
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-[10px] font-black text-amber-950">
                <span>En cours : <strong>${currentOp.type === 'rearm_sanitaire' ? 'Réarmement & Bionettoyage' : (currentOp.type.startsWith('unload') ? 'Déchargement' : 'Armement')} — ${currentOp.itemName}</strong></span>
                <span id="veh-arming-current-timer-${veh.id}" class="font-mono">${this.formatArmingClock(currentOpEffRem)}</span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div id="veh-arming-current-bar-${veh.id}" class="h-full ${hasPersonnel ? 'bg-gradient-to-r from-amber-500 to-emerald-500' : 'bg-rose-500'} transition-all duration-500" style="width: ${currentPct}%"></div>
              </div>
              <div class="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div id="veh-arming-total-bar-${veh.id}" class="h-full bg-pc-blue transition-all duration-500" style="width: ${pct}%"></div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                ${queue.map((op, qIdx) => `
                  <div class="px-2.5 py-1 rounded-xl bg-white border ${qIdx === 0 ? 'border-amber-400' : 'border-slate-200'} flex items-center justify-between gap-2 text-[10px]">
                    <span class="truncate font-bold text-slate-800">#${qIdx + 1} ${op.itemName} (${this.formatArmingClock(op.remainingSec)})</span>
                    <button type="button" onclick="window.ProtecLogistique.cancelArmingOperation('${mId}', '${veh.id}', '${op.opId}')" class="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-black cursor-pointer shrink-0">✕ Annuler</button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        ${(isLog && showLotsCatalog) ? `
          <!-- Inventaire embarqué à bord au garage -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[10.5px] font-black text-slate-800 flex-wrap gap-1.5">
              <span>📦 Lots actuellement embarqués dans ${veh.name} (${(veh.loadedItems || []).length})</span>
              <div class="flex items-center gap-1.5">
                ${(veh.loadedItems || []).length > 0 ? `
                  <button type="button" onclick="window.ProtecLogistique.unloadAllItemsFromVehicle('${mId}', '${veh.id}')" class="px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition cursor-pointer">
                    🧹 Tout décharger
                  </button>
                ` : ''}
                <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900">${freeSlots}/${capLog} slot(s) libre(s)</span>
              </div>
            </div>
            ${(veh.loadedItems || []).length > 0 ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${veh.loadedItems.map((it, idx) => {
                  const pendingUnloadOp = it.pendingUnloadOpId ? queue.find(o => o.opId === it.pendingUnloadOpId) : null;
                  return `
                    <div class="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div class="font-black text-slate-900">${it.shortName || it.name}</div>
                        <div class="text-[10px] text-slate-500 font-bold">${it.slots || 1} slot(s)</div>
                      </div>
                      ${pendingUnloadOp ? `
                        <button type="button" onclick="window.ProtecLogistique.cancelArmingOperation('${mId}', '${veh.id}', '${pendingUnloadOp.opId}')" class="px-2 py-1 rounded-lg text-[10px] font-black bg-amber-200 text-amber-950 cursor-pointer">↩️ Garder</button>
                      ` : `
                        <button type="button" onclick="window.ProtecLogistique.unloadItemFromVehicle('${mId}', '${veh.id}', ${idx})" class="px-2 py-1 rounded-lg text-[10px] font-black bg-rose-100 hover:bg-rose-200 text-rose-800 cursor-pointer">✕ Décharger (3 min)</button>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-[11px] text-slate-500 italic">
                Aucun lot embarqué dans ${veh.name}. Pré-armez vos lots ci-dessous pour gagner du temps avant les interventions !
              </div>
            `}

            <!-- Dotations Rapides (Presets 1-clic) -->
            <div class="pt-1 space-y-1">
              <div class="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                <span>⚡ Dotations Rapides en 1 clic :</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${Object.entries(this.GARAGE_ARMING_PRESETS || {}).map(([pKey, pDef]) => `
                  <button type="button" onclick="window.ProtecLogistique.applyGarageArmingPreset('${mId}', '${veh.id}', '${pKey}')" class="px-2.5 py-1 rounded-xl text-[10px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition cursor-pointer">
                    ${pDef.label}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Lots disponibles au stock local pour pré-armement au garage -->
            <div class="pt-1 space-y-1.5">
              <div class="text-[10px] font-black uppercase text-slate-600">Pré-armer un lot depuis la réserve de ${station?.name || 'l\'antenne'} :</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${Object.entries(this.LOT_COMPOSITIONS).map(([lotKey, lot]) => {
                  const inStock = station?.stock?.[lotKey] || 0;
                  const canFit = freeSlots >= lot.slots;
                  return `
                    <div class="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <div class="text-xs font-black text-slate-900 truncate">${lot.shortName} <span class="text-[10px] font-bold text-slate-500">(${lot.slots} slot${lot.slots > 1 ? 's' : ''})</span></div>
                        <div class="text-[10px] font-bold ${inStock > 0 ? 'text-emerald-700' : 'text-amber-700'}">
                          ${inStock > 0 ? `En stock : ${inStock}` : `0 en stock (${lot.price} €)`}
                        </div>
                      </div>
                      ${canFit ? `
                        <button type="button" onclick="window.ProtecLogistique.loadItemToVehicle('${mId}', '${veh.id}', '${lotKey}')" class="px-2.5 py-1.5 rounded-xl text-[10px] font-black ${inStock > 0 ? 'bg-pc-blue hover:bg-pc-blue-light text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'} transition cursor-pointer shrink-0">
                          ${inStock > 0 ? '+ Armer (3 min)' : `Acheter & Armer (${lot.price} €)`}
                        </button>
                      ` : `
                        <span class="text-[10px] font-bold text-slate-400 shrink-0">Slots pleins</span>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  renderLogisticsArmamentSection(game, mission) {
    if (!game || !mission) return '';
    const allVehs = (game.vehicles || []).concat(game.allVehicles || []);
    const assignedVehs = (mission.assignedVehicleIds || []).map(id => allVehs.find(v => v.id === id)).filter(Boolean);

    if (assignedVehs.length === 0) return '';

    const station = (game.stations || []).find(s => s.id === assignedVehs[0]?.stationId) || game.stations[0];
    this.ensureStationStock(station, game);

    const logVehicles = assignedVehs.filter(v => {
      this.normalizeVehicle(v);
      return (v.types || []).includes('LOG');
    });

    const bicycles = assignedVehs.filter(v => {
      this.normalizeVehicle(v);
      return v.isBicycle || v.type === 'VELO' || (v.name || '').toLowerCase().includes('vélo') || (v.name || '').toLowerCase().includes('vtt');
    });

    const armingVehicles = assignedVehs.filter(v => this.isVehicleArming(v));

    // S'il n'y a aucun véhicule logistique, ni vélo, ni véhicule en cours de réarmement, ne pas encombrer l'écran
    if (logVehicles.length === 0 && bicycles.length === 0 && armingVehicles.length === 0) return '';

    // Évaluation du transport des vélos
    const bikeTransportCheck = this.checkBicycleTransport(mission, game);

    return `
      <div class="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
              📦
            </div>
            <div>
              <h4 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span>Armement Logistique & Matériels Embarqués</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-600">Norme RNMSC</span>
              </h4>
              <p class="text-[10px] text-slate-500 dark:text-slate-400">
                Dotations opérationnelles officielles de la Protection Civile. Gestion des volumes et inventaire unitaire.
              </p>
            </div>
          </div>
          <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            ${logVehicles.length} véhicule(s) porteur(s) LOG
          </span>
        </div>

        <!-- Alerte transport VTT si concerné -->
        ${bicycles.length > 0 ? (
          bikeTransportCheck.valid ? `
            <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
              <span class="text-lg">🚲</span>
              <div>
                <strong>VTT Secours Prêt au Transport :</strong> Le vélo est sécurisé dans un véhicule LOG (encombrement 1 slot). Il sera déployé à l'arrivée sur zone.
              </div>
            </div>
          ` : `
            <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-600 text-rose-950 dark:text-rose-200 text-xs font-black flex items-center gap-2.5 animate-pulse shadow-xs">
              <span class="text-xl">⚠️</span>
              <div>
                <strong>Avertissement Transport VTT :</strong> ${bikeTransportCheck.reason}
              </div>
            </div>
          `
        ) : ''}

        <!-- Détail de chaque véhicule engagé -->
        <div class="space-y-4">
          ${assignedVehs.map(veh => {
            this.normalizeVehicle(veh);
            const isLog = (veh.types || []).includes('LOG');
            const capLog = veh.capacity_log || 0;
            const usedSlots = this.getUsedLogSlots(veh);
            const freeSlots = Math.max(0, capLog - usedSlots);
            const consumables = Math.round(veh.consumables !== undefined ? veh.consumables : 100);

            // Construction visuelle des jauges de slots
            const slotVisuals = [];
            for (let s = 1; s <= capLog; s++) {
              const isOccupied = s <= usedSlots;
              slotVisuals.push(`
                <div class="flex-1 h-2 rounded-full ${isOccupied ? 'bg-amber-500 shadow-2xs' : 'bg-slate-200 dark:bg-slate-700'}" title="Slot ${s}/${capLog} : ${isOccupied ? 'Occupé' : 'Libre'}"></div>
              `);
            }

            return `
              <div class="p-4 rounded-2xl border ${isLog ? 'border-amber-300 dark:border-amber-600/70 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900' : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60'} space-y-3.5 shadow-xs">
                
                <!-- En-tête du véhicule & capacité -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-amber-200/80 dark:border-amber-600/30">
                  <div class="flex items-center gap-2.5">
                    <span class="text-2xl">${isLog ? '🚐' : (veh.type === 'VPSP' ? '🚑' : (veh.isBicycle ? '🚲' : '🚗'))}</span>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <strong class="text-sm font-black text-slate-900 dark:text-white">${veh.name}</strong>
                        ${this.getVehicleCapabilitiesBadgesHTML(veh)}
                      </div>
                      <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        ${veh.model || veh.type} • 
                        ${isLog 
                          ? `Capacité LOG : <strong class="text-amber-900 dark:text-amber-300 font-black">${usedSlots} / ${capLog} slots occupés</strong> (${freeSlots} libre${freeSlots > 1 ? 's' : ''})` 
                          : '<span class="text-slate-400 italic">Dotation native secourisme (0 slot logistique)</span>'}
                      </div>
                    </div>
                  </div>

                  <!-- Jauges Soins & Slots -->
                  <div class="flex items-center gap-3 sm:justify-end flex-wrap">
                    ${isLog ? `
                      <div class="flex flex-col gap-1 w-24">
                        <div class="flex items-center justify-between text-[9px] font-black uppercase text-amber-900 dark:text-amber-300">
                          <span>Slots LOG</span>
                          <span>${usedSlots}/${capLog}</span>
                        </div>
                        <div class="flex items-center gap-0.5">
                          ${slotVisuals.join('')}
                        </div>
                      </div>
                    ` : ''}

                    <div class="flex items-center gap-2">
                      <span class="text-[10px] font-extrabold text-slate-600 dark:text-slate-300">Jauge Soins :</span>
                      <div class="w-16 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600">
                        <div class="h-full rounded-full ${consumables > 40 ? 'bg-emerald-500' : (consumables > 15 ? 'bg-amber-500' : 'bg-red-500')}" style="width: ${consumables}%"></div>
                      </div>
                      <span class="font-mono font-black text-xs ${consumables > 40 ? 'text-emerald-700 dark:text-emerald-400' : (consumables > 15 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400')}">${consumables}%</span>
                    </div>
                  </div>
                </div>

                ${isLog ? (() => {
                  const queue = Array.isArray(veh.armingQueue) ? veh.armingQueue : [];
                  const isArming = queue.length > 0;
                  const remSec = this.getVehicleArmingRemainingSec(veh);
                  const effRemSec = this.getVehicleEffectiveArmingRemainingSec(veh, game);
                  const totSec = Math.max(1, this.getVehicleArmingTotalSec(veh));
                  const pct = isArming ? Math.min(100, Math.max(0, Math.round(((totSec - remSec) / totSec) * 100))) : 0;
                  const opsCount = this.getArmingOperatorsCount(veh, game);
                  const mult = this.getArmingSpeedMultiplier(veh, game) || 1;
                  const currentOp = queue[0] || null;
                  const currentOpRem = currentOp ? Math.max(0, Math.ceil((currentOp.remainingSec || 0) / mult)) : 0;
                  const currentOpTot = currentOp ? (currentOp.totalSec || this.LOT_ARM_DURATION_SEC) : 180;
                  const currentPct = currentOp ? Math.min(100, Math.max(0, Math.round(((currentOpTot - (currentOp.remainingSec || 0)) / currentOpTot) * 100))) : 0;

                  const hasLogResp = typeof game.hasActiveLogisticsResponsible === 'function' && game.hasActiveLogisticsResponsible();
                  const assignedVols = (veh.assignedArmingVolunteerIds || []).map(id => (game.volunteers || []).find(v => v.id === id)).filter(Boolean);
                  const hasPersonnel = hasLogResp || assignedVols.length > 0;
                  const candidateVols = this.getAvailableGarageVolunteers(game, mission, veh).slice(0, 5);

                  return `
                  <!-- 0. PANNEAU PERSONNEL DE GARAGE & CHRONO D'ARMEMENT / DÉCHARGEMENT (3 MIN / LOT) -->
                  <div class="p-3.5 rounded-2xl border-2 ${isArming ? (hasPersonnel ? 'border-amber-400 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-500/80' : 'border-rose-400 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-500/80') : 'border-slate-200 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/80'} space-y-3 shadow-2xs">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${isArming ? (hasPersonnel ? 'bg-amber-500 text-white animate-pulse shadow-xs' : 'bg-rose-600 text-white animate-pulse shadow-xs') : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'}">
                          ${isArming
                            ? (hasPersonnel
                              ? `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>En cours d'armement / déchargement (${queue.length} op.)</span>`
                              : `<i data-lucide="pause-circle" class="w-3.5 h-3.5"></i><span>En pause : Attente bénévole au garage</span>`)
                            : `<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Prêt au départ (3 min / lot ajouté ou retiré)</span>`
                          }
                        </span>
                        ${mult > 1 ? `
                          <span class="px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-indigo-600 text-white shadow-2xs">
                            ⚡ Équipe de ${opsCount} : Vitesse ×${mult} (${mult >= 2 ? '1m 30s/lot' : '2m 00s/lot'})
                          </span>
                        ` : `
                          <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            ⏱️ Durée : <strong class="text-slate-900 dark:text-white">3 min/lot</strong> (2 bénévoles = 2 min, 3 = 1m30)
                          </span>
                        `}
                      </div>

                      ${isArming ? `
                        <div class="flex items-center gap-2 self-end sm:self-auto">
                          <span class="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Temps effectif restant :</span>
                          <span id="veh-arming-total-timer-${veh.id}" class="px-2.5 py-1 rounded-lg font-mono text-xs font-black ${hasPersonnel ? 'bg-amber-900 text-amber-100' : 'bg-rose-900 text-rose-100'}">
                            ${mult > 1 ? `~${this.formatArmingClock(effRemSec)} (×${mult})` : `${this.formatArmingClock(remSec)} / ${this.formatArmingClock(totSec)}`}
                          </span>
                        </div>
                      ` : ''}
                    </div>

                    <!-- Affectation obligatoire d'au moins 1 bénévole au garage (ou Responsable Logistique) -->
                    <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div class="space-y-1">
                        <div class="text-[10.5px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>👷 Personnel affecté à la manutention (+5 XP/lot) :</span>
                          ${hasLogResp ? `
                            <span class="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                              ✓ Responsable Logistique en poste (Actif)
                            </span>
                          ` : ''}
                        </div>
                        ${assignedVols.length > 0 ? `
                          <div class="flex flex-wrap gap-1.5 pt-0.5">
                            ${assignedVols.map(v => `
                              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                                <span>👷 ${v.name}</span>
                                <button type="button" onclick="window.ProtecLogistique.unassignVolunteerFromVehicleArming('${mission.id}', '${veh.id}', '${v.id}')" class="text-rose-600 hover:text-rose-800 font-black ml-0.5 cursor-pointer" title="Retirer ce bénévole de la manutention">✕</button>
                              </span>
                            `).join('')}
                          </div>
                        ` : (!hasLogResp ? `
                          <p class="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            ⚠️ Aucun bénévole affecté au garage : affectez au moins 1 bénévole ci-contre pour faire avancer l'armement / désarmement !
                          </p>
                        ` : `
                          <p class="text-[10px] text-slate-500 dark:text-slate-400">
                            Le Responsable Logistique supervise et assure automatiquement le chargement/déchargement des lots.
                          </p>
                        `)}
                      </div>

                      <!-- Boutons d'affectation rapide d'un bénévole dispo -->
                      <div class="flex items-center gap-1.5 flex-wrap">
                        ${candidateVols.length > 0 ? `
                          ${candidateVols.slice(0, 2).map(cv => `
                            <button
                              type="button"
                              onclick="window.ProtecLogistique.assignVolunteerToVehicleArming('${mission.id}', '${veh.id}', '${cv.id}')"
                              class="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-pc-blue hover:bg-pc-blue-light text-white shadow-2xs transition cursor-pointer flex items-center gap-1">
                              <span>+ Affecter ${cv.name}</span>
                            </button>
                          `).join('')}
                        ` : (!hasPersonnel ? `
                          <span class="text-[10px] font-bold text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-950/40">
                            Aucun bénévole disponible au garage
                          </span>
                        ` : '')}
                      </div>
                    </div>

                    ${isArming ? `
                      <!-- Barres de progression et file d'attente détaillée -->
                      <div class="space-y-2 pt-1">
                        <div class="space-y-1">
                          <div class="flex items-center justify-between text-[10px] font-black text-amber-950 dark:text-amber-200">
                            <span>Opération en cours : <strong class="underline">${currentOp.type.startsWith('unload') ? 'Déchargement' : 'Embarquement'} — ${currentOp.itemName}</strong></span>
                            <span id="veh-arming-current-timer-${veh.id}" class="font-mono">${this.formatArmingClock(currentOpRem)}</span>
                          </div>
                          <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600">
                            <div id="veh-arming-current-bar-${veh.id}" class="h-full ${hasPersonnel ? 'bg-gradient-to-r from-amber-500 to-emerald-500' : 'bg-rose-500'} transition-all duration-500" style="width: ${currentPct}%"></div>
                          </div>
                        </div>

                        <div class="space-y-1">
                          <div class="flex items-center justify-between text-[9.5px] font-bold text-slate-600 dark:text-slate-400">
                            <span>Progression totale de la file (${queue.length} opération${queue.length > 1 ? 's' : ''} • ${queue.length * 3} min cumulées)</span>
                            <span>Départ bloqué jusqu'à la fin</span>
                          </div>
                          <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div id="veh-arming-total-bar-${veh.id}" class="h-full bg-pc-blue transition-all duration-500" style="width: ${pct}%"></div>
                          </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          ${queue.map((op, qIdx) => `
                            <div class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border ${qIdx === 0 ? 'border-amber-400 dark:border-amber-500 ring-1 ring-amber-300/50' : 'border-slate-200 dark:border-slate-700'} flex items-center justify-between gap-2 text-[10px]">
                              <div class="flex items-center gap-1.5 min-w-0">
                                <span class="font-mono font-black px-1.5 py-0.2 rounded ${op.type.startsWith('unload') ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'}">
                                  #${qIdx + 1} ${op.type.startsWith('unload') ? 'DÉCHARGEMENT' : 'ARMEMENT'}
                                </span>
                                <strong class="truncate text-slate-900 dark:text-white">${op.itemName}</strong>
                                <span class="text-slate-400 font-mono shrink-0">(${this.formatArmingClock(op.remainingSec)})</span>
                              </div>
                              <button
                                type="button"
                                onclick="window.ProtecLogistique.cancelArmingOperation('${mission.id}', '${veh.id}', '${op.opId}')"
                                class="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-black transition cursor-pointer shrink-0"
                                title="Annuler cette opération">
                                ✕ Annuler
                              </button>
                            </div>
                          `).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  <!-- 1. MATÉRIELS ET LOTS ACTUELLEMENT EMBARQUÉS À BORD -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-[11px] flex-wrap gap-1.5">
                      <span class="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <i data-lucide="package-check" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"></i>
                        <span>Matériels & Lots Embarqués à Bord (${(veh.loadedItems || []).length})</span>
                      </span>
                      <div class="flex items-center gap-1.5">
                        ${(veh.loadedItems || []).length > 0 ? `
                          <button type="button" onclick="window.ProtecLogistique.unloadAllItemsFromVehicle('${mission.id}', '${veh.id}')" class="px-2 py-0.5 rounded-lg text-[9.5px] font-black bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition cursor-pointer">
                            🧹 Tout décharger
                          </button>
                        ` : ''}
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg ${freeSlots > 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200'}">
                          ${freeSlots} slot(s) disponible(s)
                        </span>
                      </div>
                    </div>

                    ${(veh.loadedItems || []).length > 0 ? `
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${veh.loadedItems.map((it, idx) => {
                          const comp = this.getLotComposition(it.id);
                          const itemsList = it.itemsList || comp?.items || [];
                          const pendingUnloadOp = it.pendingUnloadOpId ? queue.find(o => o.opId === it.pendingUnloadOpId) : null;

                          return `
                            <div class="p-3 rounded-xl bg-white dark:bg-slate-800/90 border ${pendingUnloadOp ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30' : 'border-amber-300/80 dark:border-amber-600/40'} shadow-2xs space-y-2 text-left">
                              <div class="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                                <div class="flex items-center gap-2 min-w-0">
                                  <span class="text-base">${it.isVehicle ? '🚲' : (it.isCaisseRearm ? '📦' : '🧰')}</span>
                                  <div class="min-w-0">
                                    <div class="font-black text-xs text-slate-900 dark:text-white truncate">
                                      ${it.shortName || it.name}
                                    </div>
                                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                      Encombrement : <strong class="text-amber-900 dark:text-amber-300">${it.slots} slot(s)</strong> • ${pendingUnloadOp ? `<span class="text-rose-600 font-black">Déchargement en cours (${this.formatArmingClock(pendingUnloadOp.remainingSec)})</span>` : 'Prêt à l\'emploi (100%)'}
                                    </div>
                                  </div>
                                </div>
                                ${pendingUnloadOp ? `
                                  <button 
                                    type="button" 
                                    onclick="window.ProtecLogistique.cancelArmingOperation('${mission.id}', '${veh.id}', '${pendingUnloadOp.opId}')" 
                                    class="px-2 py-1 rounded-lg text-[10px] font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer flex items-center gap-1 shrink-0" 
                                    title="Annuler le déchargement en cours">
                                    <span>↩️ Garder à bord</span>
                                  </button>
                                ` : `
                                  <button 
                                    type="button" 
                                    onclick="window.ProtecLogistique.unloadItemFromVehicle('${mission.id}', '${veh.id}', ${idx})" 
                                    class="px-2 py-1 rounded-lg text-[10px] font-black bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1 shrink-0" 
                                    title="Programmer le déchargement de ce lot (3 min)">
                                    <span>✕ Décharger (3 min)</span>
                                  </button>
                                `}
                              </div>

                              <!-- Visuel détaillé des quantités de chaque élément embarqué -->
                              <div class="space-y-1">
                                <span class="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                                  Inventaire Embarqué à Bord :
                                </span>
                                <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-0.5">
                                  ${itemsList.map(item => `
                                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-50/70 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-slate-700">
                                      <span>${item.icon || '📦'}</span>
                                      <strong class="text-amber-800 dark:text-amber-300">${item.qty}x</strong>
                                      <span class="truncate max-w-[140px]">${item.name}</span>
                                    </span>
                                  `).join('')}
                                </div>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : `
                      <div class="text-xs text-slate-500 dark:text-slate-400 italic p-3 bg-white/70 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        Aucun lot ni caisse actuellement à bord. Sélectionnez ci-dessous les dotations de la Protection Civile à armer (3 min par lot).
                      </div>
                    `}
                  </div>

                  <!-- Dotations Rapides (Presets 1-clic) -->
                  <div class="pt-1 space-y-1.5">
                    <div class="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>⚡ Dotations Rapides en 1 clic :</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      ${Object.entries(this.GARAGE_ARMING_PRESETS || {}).map(([pKey, pDef]) => `
                        <button type="button" onclick="window.ProtecLogistique.applyGarageArmingPreset('${mission.id}', '${veh.id}', '${pKey}')" class="px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 transition cursor-pointer shadow-2xs">
                          ${pDef.label}
                        </button>
                      `).join('')}
                    </div>
                  </div>

                  <!-- 2. MATÉRIELS ET LOTS DISPONIBLES AU CHARGEMENT (AVEC COMPOSITION ET QUANTITÉS VISIBLES) -->
                  <div class="pt-2 border-t border-amber-200/80 dark:border-amber-600/30 space-y-2.5">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <span class="font-black text-slate-900 dark:text-white uppercase text-[10.5px] flex items-center gap-1.5">
                        <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-pc-blue"></i>
                        <span>Matériels & Lots Opérationnels Disponibles au Local d'Antenne :</span>
                      </span>
                      <span class="text-[10px] text-slate-500 dark:text-slate-400">
                        ⏱️ +3 min d'armement par lot ajouté à la file
                      </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      ${Object.entries(this.LOT_COMPOSITIONS).map(([lotKey, lot]) => {
                        const inStock = station.stock[lotKey] || 0;
                        const canFit = freeSlots >= lot.slots;

                        return `
                          <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5 text-left flex flex-col justify-between hover:border-pc-blue/60 transition">
                            
                            <!-- En-tête lot -->
                            <div class="space-y-1">
                              <div class="flex items-start justify-between gap-2">
                                <div class="flex items-center gap-2 min-w-0">
                                  <span class="w-7 h-7 rounded-lg ${lot.badgeClass} flex items-center justify-center text-sm font-black shrink-0">
                                    <i data-lucide="${lot.icon || 'package'}" class="w-3.5 h-3.5"></i>
                                  </span>
                                  <div class="min-w-0">
                                    <h5 class="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">
                                      ${lot.shortName}
                                    </h5>
                                    <div class="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold truncate">
                                      ${lot.standard}
                                    </div>
                                  </div>
                                </div>
                                <span class="px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shrink-0">
                                  ${lot.slots} slot${lot.slots > 1 ? 's' : ''} • 3 min
                                </span>
                              </div>

                              <div class="flex items-center justify-between text-[10px] pt-0.5">
                                <span class="px-2 py-0.5 rounded-md font-black ${inStock > 0 ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'}">
                                  ${inStock > 0 ? `📦 Stock local : ${inStock} disponible(s)` : `⚠️ 0 au local (${lot.price} € à l'achat)`}
                                </span>
                                <span class="text-slate-400 dark:text-slate-500 font-semibold text-[9px]">${lot.category}</span>
                              </div>
                            </div>

                            <!-- VISUEL SUR LA QUANTITÉ DE CHAQUE ÉLÉMENT COMPOSANT LE LOT -->
                            <div class="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                              <span class="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                                Composition & Quantités Unitaires :
                              </span>
                              <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-0.5">
                                ${lot.items.map(it => `
                                  <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                    <span>${it.icon}</span>
                                    <strong class="text-indigo-600 dark:text-indigo-400">${it.qty}x</strong>
                                    <span class="truncate max-w-[130px]">${it.name}</span>
                                  </span>
                                `).join('')}
                              </div>
                            </div>

                            <!-- Bouton d'embarquement -->
                            <div class="pt-1">
                              ${canFit ? `
                                <button 
                                  type="button" 
                                  onclick="window.ProtecLogistique.loadItemToVehicle('${mission.id}', '${veh.id}', '${lotKey}')"
                                  class="w-full py-1.5 px-3 rounded-xl text-xs font-black ${inStock > 0 ? 'bg-pc-blue hover:bg-pc-blue-light text-white shadow-xs' : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'} transition flex items-center justify-center gap-1.5 cursor-pointer">
                                  <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                  <span>${inStock > 0 ? `Armer dans ${veh.name} (${lot.slots} slot${lot.slots > 1 ? 's' : ''} • 3 min)` : `Acheter & Armer (${lot.price} € • 3 min)`}</span>
                                </button>
                              ` : `
                                <button 
                                  type="button" 
                                  disabled 
                                  class="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed flex items-center justify-center gap-1">
                                  <span>Capacité restante insuffisante (${freeSlots}/${capLog} libre${freeSlots > 1 ? 's' : ''})</span>
                                </button>
                              `}
                            </div>
                          </div>
                        `;
                      }).join('')}

                      <!-- Vélos VTT secours si concerné -->
                      ${bicycles.filter(b => !b.transportedBy && !b.pendingTransportedBy).map(b => `
                        <div class="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 shadow-2xs space-y-2 text-left flex flex-col justify-between">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <span class="text-xl">🚲</span>
                              <div>
                                <h5 class="text-xs font-black text-slate-900 dark:text-white">${b.name}</h5>
                                <div class="text-[10px] text-teal-800 dark:text-teal-300 font-bold">VTT d'Intervention Rapide • 1 slot LOG • 3 min</div>
                              </div>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[9px] font-black bg-teal-600 text-white">1 slot • 3 min</span>
                          </div>
                          <div class="p-2 rounded-xl bg-white dark:bg-slate-900 text-[10px] text-slate-600 dark:text-slate-300">
                            Equipé d'une sacoche de premiers secours et d'un DAE compact pour progression rapide en milieu piétonnier.
                          </div>
                          ${freeSlots >= 1 ? `
                            <button 
                              type="button" 
                              onclick="window.ProtecLogistique.loadBicycleToVehicle('${mission.id}', '${veh.id}', '${b.id}')"
                              class="w-full py-1.5 px-3 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-1">
                              <span>+ Embarquer ${b.name} (1 slot • 3 min)</span>
                            </button>
                          ` : `
                            <button disabled class="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed">
                              Capacité restante insuffisante
                            </button>
                          `}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
                })() : (this.isVehicleArming(veh) ? this.renderSingleVehicleGarageArmamentPanel(game, veh, station, mission, false) : '')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  getVehicleCapabilitiesBadgesHTML(veh) {
    if (!veh) return '';
    this.normalizeVehicle(veh);
    const types = Array.isArray(veh.types) ? veh.types : ['TP'];

    const iconMap = {
      LOG: 'package',
      PS: 'stethoscope',
      VPSP: 'ambulance',
      TP: 'users'
    };

    return `
      <div class="inline-flex items-center gap-1 flex-wrap">
        ${types.map(code => {
          const cap = this.CAPACITIES[code] || { code: code, label: code, badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' };
          const extraInfo = (code === 'LOG') ? ` (${veh.capacity_log || 0} slots)` : '';
          const iconName = iconMap[code] || 'tag';
          return `
            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border shadow-2xs ${cap.badgeClass}" title="${cap.label} : ${cap.desc}">
              <i data-lucide="${iconName}" class="w-3 h-3"></i>
              <span class="font-mono">${code}${extraInfo}</span>
            </span>
          `;
        }).join('')}
      </div>
    `;
  }
};

