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
      category: 'pharmacie',
      name: 'Kit de réarmement',
      lucideIcon: 'archive',
      image: 'images/equipements/caisse_rearmement.png',
      price: 60,
      unit: 'caisse',
      slots: 1,
      badge: 'Réarmement',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60',
      desc: 'Réapprovisionne les consommables sanitaires des véhicules et lots de secours.',
      usage: 'Recharge le matériel de secours à l\'antenne.'
    },

    // --- 2. LOTS DE SECOURS A / B / C ---
    {
      id: 'lot_secours_a',
      category: 'lots_secours',
      name: 'Lot A - Poste de secours',
      lucideIcon: 'tent',
      image: 'images/equipements/lot_secours_a.png',
      price: 1750,
      unit: 'lot complet',
      slots: 4,
      types: ['PS', 'LOG'],
      consumables: 100,
      isLot: true,
      badge: 'Poste Fixe',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-300',
      desc: 'Tente et équipement pour soigner les victimes sur les postes fixes (DPS).',
      usage: 'Indispensable pour les DPS-ME, DPS-GE et festivals.'
    },
    {
      id: 'lot_secours_b',
      category: 'lots_secours',
      name: 'Lot B - Premiers secours',
      lucideIcon: 'briefcase',
      image: 'images/equipements/lot_secours_b.png',
      price: 850,
      unit: 'lot complet',
      slots: 2,
      types: ['PS'],
      consumables: 100,
      isLot: true,
      badge: 'Secours d\'Urgence',
      badgeColor: 'bg-blue-50 text-pc-blue border-blue-300',
      desc: 'Sac d\'urgence avec oxygène et défibrillateur pour les interventions réflexes.',
      usage: 'Dotation obligatoire de tout VPSP et PAPS.'
    },
    {
      id: 'lot_secours_c',
      category: 'lots_secours',
      name: 'Lot C - Brancardage & Immobilisation',
      lucideIcon: 'stretch-horizontal',
      image: 'images/equipements/lot_secours_c.png',
      price: 1250,
      unit: 'lot complet',
      slots: 2,
      types: ['PS'],
      consumables: 100,
      isLot: true,
      badge: 'Immobilisation',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      desc: 'Matériel de relevage et matelas coquille pour les traumatismes et fractures.',
      usage: 'Nécessaire pour le brancardage et les traumatismes sportifs.'
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
      name: 'Tenue bénévole',
      lucideIcon: 'shirt',
      image: 'images/equipements/tenue_pc.png',
      price: 160,
      unit: 'tenue complète',
      slots: 1,
      badge: 'Dotation Bénévole',
      badgeColor: 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800',
      desc: 'Uniforme réglementaire pour équiper un secouriste sur le terrain.',
      usage: 'Obligatoire pour autoriser un bénévole à partir en mission.'
    },
    {
      id: 'tenue_moto',
      category: 'tenues_epi',
      name: 'Tenue moto',
      lucideIcon: 'bike',
      image: 'images/equipements/tenue_moto.png',
      price: 240,
      unit: 'tenue moto',
      slots: 1,
      badge: 'Pilote Moto',
      badgeColor: 'bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800',
      desc: 'Protection renforcée homologuée pour piloter les motos de secours.',
      usage: 'Équipement de sécurité pour les motocyclistes en intervention.'
    },
    {
      id: 'tenue_usar',
      category: 'tenues_epi',
      name: 'Tenue USAR',
      lucideIcon: 'hard-hat',
      image: 'images/equipements/tenue_usar.png',
      price: 320,
      unit: 'tenue USAR',
      slots: 1,
      badge: 'Sauvetage-Déblaiement',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800',
      desc: 'Combinaison anti-abrasion pour interventions en décombres et sauvetage.',
      usage: 'Protection pour interventions sur effondrements et séismes.'
    },
    {
      id: 'rangers1',
      category: 'tenues_epi',
      name: 'Rangers Standard',
      lucideIcon: 'footprints',
      image: 'images/equipements/rangers1.png',
      price: 65,
      unit: 'paire',
      badge: 'Base',
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
      name: 'Rangers Confort',
      lucideIcon: 'footprints',
      image: 'images/equipements/rangers2.png',
      price: 120,
      unit: 'paire',
      badge: 'Bien',
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
      name: 'Rangers Pro',
      lucideIcon: 'footprints',
      image: 'images/equipements/rangers3.png',
      price: 190,
      unit: 'paire',
      badge: 'Super',
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
      id: 'kit_pedago_psc',
      category: 'kits_formation',
      name: 'Kit Pédagogique PSC',
      lucideIcon: 'graduation-cap',
      image: 'images/equipements/kit_pedago_psc.png',
      price: 1200,
      unit: 'kit complet',
      badge: 'Grand Public',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'Mannequins et défibrillateur de formation pour le grand public.',
      usage: 'Formations grand public GQS et PSC.'
    },
    {
      id: 'kit_pedago_sst',
      category: 'kits_formation',
      name: 'Kit Pédagogique SST',
      lucideIcon: 'briefcase',
      image: 'images/equipements/kit_pedago_sst.png',
      price: 1100,
      unit: 'kit complet',
      badge: 'Santé Travail',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
      desc: 'Matériel officiel pour former les sauveteurs secouristes du travail.',
      usage: 'Formations SST en entreprise.'
    },
    {
      id: 'kit_pedago_pse1',
      category: 'kits_formation',
      name: 'Kit Pédagogique PSE1',
      lucideIcon: 'backpack',
      image: 'images/equipements/kit_pedago_pse1.png',
      price: 1600,
      unit: 'kit complet',
      badge: 'Secouriste',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      desc: 'Matériel pour former les secouristes opérationnels (PSE1).',
      usage: 'Certifications et recyclages PSE1.'
    },
    {
      id: 'kit_pedago_pse2',
      category: 'kits_formation',
      name: 'Kit Pédagogique PSE2',
      lucideIcon: 'stretch-horizontal',
      image: 'images/equipements/kit_pedago_pse2.png',
      price: 2200,
      unit: 'kit complet',
      badge: 'Équipier VPSP',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      desc: 'Matériel d\'immobilisation pour équiper les équipiers en ambulance.',
      usage: 'Formation des Équipiers Secouristes PSE2.'
    },
    {
      id: 'kit_pedago_extincteur',
      category: 'kits_formation',
      name: 'Kit Extincteurs Incendie',
      lucideIcon: 'flame',
      image: 'images/equipements/kit_pedago_extincteur.png',
      price: 1400,
      unit: 'kit complet',
      badge: 'Sécurité Incendie',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-300',
      desc: 'Bac à feu et extincteurs d\'exercice pour les formations incendie.',
      usage: 'Initiations à la manipulation d\'extincteurs.'
    },
    {
      id: 'kit_pedago_picf',
      category: 'kits_formation',
      name: 'Kit Pédagogique PIC F',
      lucideIcon: 'clipboard-list',
      image: 'images/equipements/kit_pedago_picf.png',
      price: 850,
      unit: 'kit complet',
      badge: 'Cadres Formateurs',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
      desc: 'Supports pédagogiques pour former les formateurs de secours.',
      usage: 'Formations de formateurs PIC F.'
    },
    {
      id: 'kit_pedago_ssa',
      category: 'kits_formation',
      name: 'Kit Sauvetage Aquatique (SSA)',
      lucideIcon: 'life-buoy',
      image: 'images/equipements/kit_pedago_ssa.png',
      price: 1300,
      unit: 'kit complet',
      badge: 'Aquatique',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      desc: 'Mannequins et bouées pour les entraînements aquatiques.',
      usage: 'Formations et entraînements aquatiques SSA.'
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
    if (!game || !Array.isArray(game.deliveries)) return;

    let hasDelivered = false;
    const now = Date.now();

    game.deliveries.forEach(d => {
      if (d && d.status === 'in_transit' && now >= d.etaTimestamp) {
        d.status = 'delivered';
        d.deliveredAt = now;
        hasDelivered = true;

        const station = (game.stations || []).find(s => s.id === d.stationId) || game.stations[0];
        if (station) {
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
              station.stockMaterielsPS = (station.stockMaterielsPS || 0) + (100 * qty);
              game.stockMaterielsPS = station.stockMaterielsPS;
            }
          });
        }

        this.syncToGlobalLogistics(game);

        if (typeof game.showToast === 'function') {
          game.showToast(
            '📦 Commande Réceptionnée !',
            `Le colis « ${d.orderNumber} » vient d'être livré à « ${d.stationName} ». Le matériel a été rangé dans le stock de l'antenne.`,
            'green'
          );
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
      return `${d}j ${String(h).padStart(2, '0')}h`;
    } else if (remainingSec >= 3600) {
      const h = Math.floor(remainingSec / 3600);
      const m = Math.floor((remainingSec % 3600) / 60);
      return `${h}h ${String(m).padStart(2, '0')}m`;
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
        const m = Math.floor(remainingSec / 60);
        const s = remainingSec % 60;
        timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

          <!-- Onglets Principaux [ Boutique | Livraisons | Stock | Flotte ] -->
          <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black self-start md:self-auto flex-wrap">
            <button onclick="window.game.openModule('boutiques')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 bg-gradient-to-r from-pc-blue to-indigo-600 text-white shadow-xs hover:brightness-110">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
              <span>Ouvrir les Boutiques (Galeries)</span>
            </button>
            <button onclick="window.ProtecLogistique.setTab('radios')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'radios' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="radio" class="w-4 h-4"></i>
              <span>Radios & Télécoms</span>
            </button>
            <button onclick="window.ProtecLogistique.setTab('livraisons')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'livraisons' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="truck" class="w-4 h-4"></i>
              <span>Suivi Livraisons</span>
              ${this.getActiveDeliveries(game).length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse shadow-xs">${this.getActiveDeliveries(game).length}</span>` : ''}
            </button>
            <button onclick="window.ProtecLogistique.setTab('stock')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'stock' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="package" class="w-4 h-4"></i>
              <span>Stock de l'Antenne</span>
            </button>
            <button onclick="window.ProtecLogistique.setTab('flotte')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'flotte' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              <span>Flotte & Garage</span>
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
        ${this.activeTab === 'boutique' ? this.renderBoutiqueHTML(game, station, cartTotal, cartCount) : ''}
        ${this.activeTab === 'radios' ? this.renderRadiosHTML(game, station) : ''}
        ${this.activeTab === 'livraisons' ? this.renderLivraisonsHTML(game, station) : ''}
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
    const shippingFee = this.getShippingFee(cartTotal);
    const grandTotal = cartTotal + shippingFee;
    const freeThreshold = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('shippingFreeThreshold', 350) : 350;
    const baseFee = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('shippingBaseFee', 35) : 35;
    const neededForFree = Math.max(0, freeThreshold - cartTotal);
    const deliveryDuration = this.getDeliveryDurationSeconds();

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
          <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-inner flex-shrink-0">
            <i data-lucide="truck" class="w-5 h-5 text-white"></i>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-black leading-tight">Centrale d'Approvisionnement Fédérale</h4>
            <p class="text-[11px] text-blue-100">Matériel officiel agréé Sécurité Civile & ARS • Expédition sous ~${Math.round(deliveryDuration / 60)} min vers l'antenne sélectionnée</p>
          </div>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-right">
          <div>
            <span class="text-[10px] text-blue-200 block">Frais d'expédition</span>
            <strong class="text-xs text-emerald-300 font-bold">Gratuits dès ${freeThreshold} € (${baseFee} € sinon)</strong>
          </div>
        </div>
      </div>

      <!-- CATÉGORIES & RECHERCHE -->
      <div class="space-y-2.5">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            ${this.CATEGORIES.map(c => `
              <button onclick="window.ProtecLogistique.setCategory('${c.id}')" class="px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${this.selectedCategory === c.id ? 'bg-pc-blue text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <i data-lucide="${c.iconLucide || 'layout-grid'}" class="w-3.5 h-3.5"></i>
                <span>${c.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Recherche rapide -->
          <div class="relative w-full sm:w-64">
            <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="logistique-search-input" value="${this.searchQuery}" oninput="window.ProtecLogistique.setSearch(this.value)" placeholder="Rechercher du matériel..." class="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pc-blue" />
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
                    <!-- Zone image PNG ou Icône Lucide vectorielle élégante -->
                    <div class="relative w-full h-32 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-2.5 group-hover:border-pc-blue/30 transition">
                      ${this.hasRealImage(item.image) ? `
                        <img src="${this.getThumb(item.image)}" 
                             alt="${item.name}" 
                             loading="lazy"
                             onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${item.image}'; }"
                             class="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
                      ` : `
                        <div class="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
                          <i data-lucide="${item.lucideIcon || 'package'}" class="w-9 h-9 text-pc-blue stroke-[1.75]"></i>
                          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">${item.unit || ''}</span>
                        </div>
                      `}
                      <span class="px-2 py-0.5 rounded text-[9.5px] font-black border backdrop-blur-md shadow-xs absolute top-2 left-2 ${item.badgeColor}">
                        ${item.badge}
                      </span>
                      <span class="badge-reserve-stock absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/80 border border-slate-700/80 text-slate-100 shadow-xs backdrop-blur-xs">
                        En réserve : ${currentStock}
                      </span>
                    </div>

                    <!-- Titre & Description -->
                    <h5 class="text-xs font-black text-slate-900 leading-snug group-hover:text-pc-blue transition">${item.name}</h5>
                    <p class="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">${item.desc}</p>
                    
                    ${item.usage ? `
                      <p class="text-[10px] text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 p-1.5 rounded-lg mt-2 font-medium flex items-center gap-1.5">
                        <i data-lucide="info" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"></i>
                        <span>${item.usage}</span>
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
                          <i data-lucide="plus" class="w-3.5 h-3.5"></i>
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
        <div class="lg:col-span-1 p-4 rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white shadow-md space-y-4 lg:sticky lg:top-4">
          
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <i data-lucide="shopping-cart" class="w-4 h-4 text-pc-blue dark:text-blue-400"></i>
              <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Mon Panier</h4>
                <span class="text-[10px] text-slate-500 dark:text-slate-400">Livraison à ${station?.name || 'l\'antenne'}</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white font-mono">
              ${cartCount}
            </span>
          </div>

          <!-- Liste des articles dans le panier -->
          <div class="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            ${cartCount === 0 ? `
              <div class="py-8 text-center space-y-2 text-slate-500 dark:text-slate-400">
                <i data-lucide="shopping-bag" class="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600 stroke-1 block opacity-70"></i>
                <p class="text-xs">Votre panier est vide.</p>
                <p class="text-[10.5px] text-slate-400 dark:text-slate-500">Ajoutez des lots, médicaments ou tenues depuis le catalogue.</p>
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
                    <button onclick="window.ProtecLogistique.removeFromCart('${id}')" class="text-slate-400 hover:text-rose-400 p-1 transition" title="Supprimer">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Total et Récapitulatif financier -->
          <div class="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div class="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Sous-total articles :</span>
              <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${cartTotal.toLocaleString('fr-FR')} €</span>
            </div>
            
            <!-- Choix Fournisseur & Expéditeur -->
            <div class="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-bold">
                <span class="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <i data-lucide="truck" class="w-3.5 h-3.5 text-pc-blue"></i>
                  <span>Transporteur :</span>
                </span>
                <span class="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold">${this.getSupplier(this.selectedSupplierId).delayLabel}</span>
              </div>
              <select onchange="window.ProtecLogistique.setSupplier(this.value)" class="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-pc-blue">
                ${(this.SUPPLIERS || []).map(s => `
                  <option value="${s.id}" ${s.id === this.selectedSupplierId ? 'selected' : ''}>
                    ${s.shortName} • ${s.freeShippingAlways ? 'Port OFFERT (0 €)' : (cartTotal >= s.freeThreshold ? 'Port OFFERT' : `+${s.shippingCost} €`)} • ⏱️ ${s.delayLabel}
                  </option>
                `).join('')}
              </select>
              <div class="text-[9.5px] text-slate-500 dark:text-slate-400 italic leading-snug">
                ${this.getSupplier(this.selectedSupplierId).specialty}
              </div>
            </div>

            <div class="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span>Frais de livraison :</span>
              ${cartTotal === 0 ? `
                <span class="text-slate-400 font-mono">0 €</span>
              ` : shippingFee === 0 ? `
                <span class="font-black text-emerald-500 flex items-center gap-1">
                  <i data-lucide="gift" class="w-3 h-3"></i> Offerts (0 €)
                </span>
              ` : `
                <span class="font-black text-amber-500 font-mono">+${shippingFee.toLocaleString('fr-FR')} €</span>
              `}
            </div>

            ${cartTotal > 0 && neededForFree > 0 ? `
              <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10.5px] text-amber-600 dark:text-amber-300 leading-snug flex items-start gap-1.5">
                <i data-lucide="info" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"></i>
                <span>Ajoutez encore <strong>${neededForFree.toLocaleString('fr-FR')} €</strong> pour bénéficier de la <strong>livraison offerte</strong> (franco dès ${freeThreshold} €).</span>
              </div>
            ` : ''}

            ${cartTotal > 0 && shippingFee === 0 ? `
              <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[10.5px] text-emerald-600 dark:text-emerald-300 leading-snug flex items-center gap-1.5">
                <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"></i>
                <span>Super ! Vous bénéficiez des <strong>frais de port offerts</strong> pour cette commande.</span>
              </div>
            ` : ''}
            
            <div class="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-black">
              <span>Total Commande :</span>
              <span class="text-base text-emerald-600 dark:text-emerald-400 font-mono">${grandTotal.toLocaleString('fr-FR')} €</span>
            </div>

            <div class="flex justify-between text-[10.5px] ${game.resources.money < grandTotal ? 'text-rose-500 font-bold' : 'text-slate-500 dark:text-slate-400'}">
              <span>Trésorerie restante :</span>
              <span class="font-mono font-bold">${Math.max(0, game.resources.money - grandTotal).toLocaleString('fr-FR')} €</span>
            </div>

            <div class="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
              <i data-lucide="clock" class="w-3 h-3 text-slate-400"></i>
              <span>Délai d'acheminement estimé : ~${Math.round(deliveryDuration / 60)} min</span>
            </div>
          </div>

          <!-- Bouton de paiement / validation -->
          <div class="space-y-2 pt-1">
            ${cartCount > 0 ? `
              <button onclick="window.ProtecLogistique.checkout(window.game)" class="w-full py-3 rounded-2xl ${game.resources.money >= grandTotal ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-lg cursor-pointer' : 'bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'} font-black text-xs transition flex items-center justify-center gap-2 active:scale-95" ${game.resources.money < grandTotal ? 'disabled' : ''}>
                <i data-lucide="truck" class="w-4 h-4"></i>
                <span>${game.resources.money >= grandTotal ? `Commander et Expédier (${grandTotal.toLocaleString('fr-FR')} €)` : 'Trésorerie Insuffisante'}</span>
              </button>

              <button onclick="window.ProtecLogistique.clearCart()" class="w-full py-1.5 rounded-xl text-[10.5px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                Vider le panier
              </button>
            ` : `
              <button disabled class="w-full py-3 rounded-2xl bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 font-bold text-xs cursor-not-allowed text-center">
                Panier vide
              </button>
            `}
          </div>

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

                  <div class="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                    <button onclick="event.stopPropagation(); window.ProtecLogistique.buyRadioPackDirect(window.game, '${techKey}', '${selectedPackId}', '${sup.id}')" class="w-full py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition flex items-center justify-center gap-1 cursor-pointer active:scale-95">
                      <i data-lucide="truck" class="w-3.5 h-3.5"></i>
                      <span>Commander Direct</span>
                    </button>
                    <button onclick="event.stopPropagation(); window.ProtecLogistique.addRadioPackToCart('${techKey}', '${selectedPackId}')" class="w-full py-1.5 rounded-xl text-[10.5px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-indigo-400 transition flex items-center justify-center gap-1 cursor-pointer">
                      <i data-lucide="plus" class="w-3 h-3"></i>
                      <span>Ajouter au Panier</span>
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
            <button onclick="window.ProtecLogistique.setTab('boutique')" class="px-4 py-2 rounded-xl bg-pc-blue hover:bg-pc-blue-light text-white font-black text-xs shadow-xs transition inline-flex items-center gap-2 cursor-pointer">
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
                <button onclick="window.ProtecLogistique.setTab('boutique')" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition inline-flex items-center gap-1.5">
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

                  return `
                    <div class="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs hover:shadow-md transition space-y-3.5">
                      <!-- En-tête commande -->
                      <div class="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-2.5">
                        <div class="flex items-center gap-2.5">
                          <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                            <i data-lucide="truck" class="w-5 h-5"></i>
                          </div>
                          <div>
                            <div class="flex items-center gap-2">
                              <span class="text-xs font-black text-slate-900 font-mono">Colis #${d.orderNumber}</span>
                              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300/80 flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                En route
                              </span>
                            </div>
                            <div class="text-[11px] text-slate-500 mt-0.5">
                              Destination : <strong class="text-slate-800">${d.stationName}</strong> • Commandé à ${orderDate}
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
                        <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col items-center gap-1">
                          <i data-lucide="package-check" class="w-4 h-4 text-emerald-600"></i>
                          <span>1. Préparation FNPC</span>
                          <span class="text-[9px] text-emerald-600 font-mono">Terminée</span>
                        </div>
                        <div class="p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 flex flex-col items-center gap-1">
                          <i data-lucide="truck" class="w-4 h-4 text-amber-600 animate-bounce"></i>
                          <span>2. Convoi Routier</span>
                          <span id="delivery-percent-${d.id}" class="text-[9px] text-amber-700 font-mono font-black">${progress}%</span>
                        </div>
                        <div class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex flex-col items-center gap-1">
                          <i data-lucide="warehouse" class="w-4 h-4 text-slate-400"></i>
                          <span>3. Stockage Réserve</span>
                          <span class="text-[9px] text-slate-400 font-mono">En attente</span>
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

                      <!-- Contenu du colis -->
                      <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs flex-wrap">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-[11px] font-bold text-slate-500">Contenu :</span>
                          <span class="text-[11px] text-slate-700 font-medium">${d.itemsSummary || 'Matériels divers'}</span>
                        </div>
                        <div class="text-right text-[11px] font-mono">
                          <span class="text-slate-400">Total : </span>
                          <strong class="text-slate-900 font-black">${d.totalCost.toLocaleString('fr-FR')} €</strong>
                          <span class="text-[10px] text-slate-400">(${d.shippingFee === 0 ? 'Port offert' : `Frais port : ${d.shippingFee} €`})</span>
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
                      
                      <p class="text-[11px] text-slate-600 line-clamp-1">${d.itemsSummary || 'Articles livrés'}</p>
                      
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
          <button onclick="window.ProtecLogistique.setTab('boutique')" class="text-[11px] font-black text-pc-blue hover:underline flex items-center gap-1 mt-1">
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
            <button onclick="window.ProtecLogistique.setTab('boutique')" class="mt-2 px-4 py-2 rounded-xl bg-pc-blue text-white text-xs font-black shadow transition flex items-center gap-1.5 mx-auto">
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
                    <button onclick="window.ProtecLogistique.addToCart('${item.id}', 1)" class="text-[10px] font-bold text-pc-blue hover:underline flex items-center gap-1">
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

  // Actions de logistique post-mission, réarmement, désinfection et maintenance flotte
  rearmAndDisinfectVehicle(game, vehicleId) {
    const v = (game.vehicles || []).find(veh => veh.id === vehicleId);
    if (!v) return;

    const station = game.stations?.find(s => s.id === v.stationId) || game.stations?.[0];
    this.ensureStationStock(station, game);

    const hasWaterPoint = station?.premises?.rooms?.sas_desinfection_pharmacie?.hasWaterPoint || (station?.premises?.rooms?.sas_desinfection_pharmacie?.level >= 2);

    const hasCaisse = (station.stock?.caisse_rearmement && station.stock.caisse_rearmement >= 1);
    const hasStockPS = (station.stockMaterielsPS && station.stockMaterielsPS >= 20);

    if (hasCaisse) {
      station.stock.caisse_rearmement -= 1;
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

    // Mobilisation d'un secouriste de l'antenne (priorité bénévole retraité ou bénévole disponible)
    const vol = (game.volunteers || []).find(vl => vl.status === 'dispo' && (vl.profilSocial === 'retraite' || vl.dispoType === 'retraité')) ||
                (game.volunteers || []).find(vl => vl.status === 'dispo');
    if (vol) {
      vol.exp = (vol.exp || 0) + 12; // Expérience logistique
      const fatigueGain = hasWaterPoint ? 2 : 5; // Point d'eau divise la pénibilité par 2
      vol.fatigue = Math.min(100, (vol.fatigue || 0) + fatigueGain);
      vol.energy = Math.max(0, 100 - vol.fatigue);
    }

    v.consumables = 100;
    v.armementLevel = 100;
    v.status = 'dispo';
    v.a_rearme = false;
    v.needsRearming = false;
    v.disinfectionNeeded = false;
    v.lastDisinfectionDate = Date.now();

    const waterNotice = hasWaterPoint ? ' [Centrale de bionettoyage SAS utilisée : temps & coût divisés par 2]' : '';
    game.showToast(
      'Véhicule Réarmé & Désinfecté ✓',
      `${v.name} : Jauge de consommables réarmée à 100%, bionettoyage validé${vol ? ` par ${vol.name}` : ''}.${waterNotice} Prêt pour départ opérationnel !`,
      'green'
    );

    game.updateStatsUI();
    game.saveGame();
    this.renderModal(game);
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

  renderFlotteHTML(game, station) {
    const stationVehicles = (game.vehicles || []).filter(v => v.stationId === station?.id);

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Véhicules rattachés à ${station?.name || 'l\'antenne'} (${stationVehicles.length})</span>
          <span class="text-[11px] text-slate-500">Logistique retour, réarmement O2, désinfection et maintenance</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${stationVehicles.length === 0 ? `
            <div class="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl md:col-span-2">
              Aucun véhicule rattaché à cette caserne. Utilisez le module Flotte pour acheter ou affecter un VPSP.
            </div>
          ` : stationVehicles.map(v => {
            const fuel = v.fuel !== undefined ? v.fuel : 90;
            const mech = v.mechanical !== undefined ? v.mechanical : 95;
            const km = v.kilometrage || v.mileage || 115000;
            const isRearmNeeded = v.status === 'a_rearme' || v.a_rearme || v.needsRearming;
            const isBroken = v.status === 'en_panne' || v.isBrokenDown;
            const isCtNeeded = v.needsControleTechnique || (v.controleTechniqueKm && (km - v.controleTechniqueKm > 25000));

            let statusBadge = '';
            if (isBroken) {
              statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white flex items-center gap-1 animate-pulse"><i data-lucide="alert-octagon" class="w-3 h-3"></i> EN PANNE</span>';
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
              <div class="p-4 rounded-2xl bg-white border ${isVLC ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-slate-200'} shadow-xs space-y-3 ${isRearmNeeded ? 'border-red-300 ring-2 ring-red-100' : ''}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-10 ${isVLC ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-100 border-slate-200'} rounded-xl p-1 flex items-center justify-center flex-shrink-0 border shadow-inner">
                      <img src="${this.getThumb(v.image || (game.getVehicleImage ? game.getVehicleImage(v.type) : `images/vehicles/${v.type}.png`))}" 
                           alt="${v.name}" 
                           loading="lazy" 
                           class="max-h-full max-w-full object-contain" 
                           onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${v.image || (game.getVehicleImage ? game.getVehicleImage(v.type) : `images/vehicles/${v.type}.png`)}'; } else { this.outerHTML='<i data-lucide=\\'truck\\' class=\\'w-6 h-6 text-slate-500\\'></i>'; }" />
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <h5 class="text-xs font-black text-slate-900 leading-tight">${v.name}</h5>
                        ${isVLC ? '<span class="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-indigo-600 text-white tracking-wider flex items-center gap-1"><i data-lucide="radio" class="w-2.5 h-2.5"></i> VLC</span>' : ''}
                      </div>
                      <span class="text-[10px] text-slate-500 font-semibold block">
                        ${v.label || v.type} • ${km.toLocaleString('fr-FR')} km
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
                <div class="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  <button onclick="window.ProtecLogistique.rearmAndDisinfectVehicle(window.game, '${v.id}')" class="py-1.5 rounded-xl text-[10px] font-extrabold ${isRearmNeeded ? 'bg-red-600 text-white hover:bg-red-700 shadow-md animate-pulse' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'} transition" title="Consomme O2, compresses, gants et désinfectant ou 45 €">
                    ${isRearmNeeded ? 'Réarmer (O2/Stock)' : 'Réarmer ✓'}
                  </button>
                  <button onclick="window.ProtecSystems.serviceVehicle(window.game, '${v.id}', 'fuel')" class="py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition">
                    Plein (75 €)
                  </button>
                  ${isBroken || mech < 60 ? `
                    <button onclick="window.ProtecLogistique.repairVehicleGarage(window.game, '${v.id}')" class="py-1.5 rounded-xl text-[10px] font-black bg-red-500 hover:bg-red-600 text-white transition shadow-sm" title="Réparation complète au garage">
                      Garage (450 €)
                    </button>
                  ` : `
                    <button onclick="window.ProtecLogistique.passControleTechnique(window.game, '${v.id}')" class="py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Contrôle technique périodique">
                      CT (120 €)
                    </button>
                  `}
                </div>

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

    return veh;
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
    if (!veh || !Array.isArray(veh.loadedItems)) return 0;
    return veh.loadedItems.reduce((sum, item) => sum + (item.slots || 1), 0);
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
  // 5. GESTION DES CHARGEMENTS DE LOTS, CAISSES & VÉLOS AVANT DÉPART
  // =========================================================================

  loadItemToVehicle(missionId, vehicleId, itemId) {
    const game = window.game;
    if (!game) return;
    const mission = (game.missions || []).find(m => m.id === missionId);
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
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
      const cost = catItem ? catItem.price : (itemId === 'caisse_rearmement' ? 60 : 250);
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

    // Déduire du stock local
    station.stock[itemId] = Math.max(0, (station.stock[itemId] || 1) - 1);

    // Embarquer l'item dans le véhicule LOG
    const loadedEntry = {
      id: itemId,
      name: comp?.title || catItem?.name || itemId,
      shortName: comp?.title ? comp.title.split('(')[0].trim() : (catItem?.name ? catItem.name.split('(')[0].trim() : itemId),
      slots: itemSlots,
      types: catItem?.types || (itemId === 'caisse_rearmement' ? ['LOG'] : ['PS']),
      consumables: 100,
      maxConsumables: 100,
      isLot: true,
      isCaisseRearm: itemId === 'caisse_rearmement',
      itemsList: comp?.items || []
    };

    veh.loadedItems.push(loadedEntry);
    game.showToast('Matériel chargé 📦', `« ${loadedEntry.shortName} » (${loadedEntry.slots} slot(s)) embarqué dans ${veh.name}.`, 'green');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    game.saveGame();
    if (mission) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else if (typeof game.openMissionDetails === 'function') {
        game.openMissionDetails(mission.id);
      }
    }
  },

  unloadItemFromVehicle(missionId, vehicleId, itemIndex) {
    const game = window.game;
    if (!game) return;
    const mission = (game.missions || []).find(m => m.id === missionId);
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    if (!veh || !Array.isArray(veh.loadedItems) || !veh.loadedItems[itemIndex]) return;

    const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
    this.ensureStationStock(station, game);

    const item = veh.loadedItems.splice(itemIndex, 1)[0];
    station.stock[item.id] = (station.stock[item.id] || 0) + 1;

    game.showToast('Matériel déchargé 🧹', `« ${item.name} » restitué au stock du local de ${station.name}.`, 'teal');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    game.saveGame();
    if (mission) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else if (typeof game.openMissionDetails === 'function') {
        game.openMissionDetails(mission.id);
      }
    }
  },

  loadBicycleToVehicle(missionId, vehicleId, bikeId) {
    const game = window.game;
    if (!game) return;
    const mission = (game.missions || []).find(m => m.id === missionId);
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    const bike = (game.vehicles || []).find(v => v.id === bikeId);
    if (!veh || !bike) return;

    this.normalizeVehicle(veh);
    this.normalizeVehicle(bike);

    const check = this.canLoadInVehicle(veh, { slots: 1 });
    if (!check.can) {
      game.showToast('Transport Vélo impossible', check.reason, 'orange');
      return;
    }

    bike.transportedBy = veh.id;
    veh.loadedItems.push({
      id: bike.id,
      name: bike.name || 'VTT Secours',
      shortName: 'VTT Secours (Vélo)',
      slots: 1,
      isVehicle: true,
      types: ['PS'],
      consumables: bike.consumables || 100
    });

    game.showToast('VTT Embarqué 🚲', `${bike.name} est chargé dans ${veh.name} (1 slot LOG). Transport routier sécurisé !`, 'green');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    game.saveGame();
    if (mission) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else if (typeof game.openMissionDetails === 'function') {
        game.openMissionDetails(mission.id);
      }
    }
  },

  unloadBicycleFromVehicle(missionId, vehicleId, bikeId) {
    const game = window.game;
    if (!game) return;
    const mission = (game.missions || []).find(m => m.id === missionId);
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    const bike = (game.vehicles || []).find(v => v.id === bikeId);
    if (!veh) return;

    if (Array.isArray(veh.loadedItems)) {
      veh.loadedItems = veh.loadedItems.filter(it => it.id !== bikeId);
    }
    if (bike) bike.transportedBy = null;

    game.showToast('VTT Déchargé', `${bike ? bike.name : 'VTT'} retiré du véhicule porteur.`, 'slate');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    if (typeof game.saveGame === 'function') game.saveGame();
    if (mission) {
      if (typeof game.refreshMissionDetailsIfOpen === 'function') {
        game.refreshMissionDetailsIfOpen(mission.id);
      } else if (typeof game.openMissionDetails === 'function') {
        game.openMissionDetails(mission.id);
      }
    }
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

    // Vérifier que chaque vélo est bien transporté ou qu'il y a assez de slots LOG
    for (const bike of bicycles) {
      const isExplicitlyCarried = logVehicles.some(lv => Array.isArray(lv.loadedItems) && lv.loadedItems.some(it => it.id === bike.id));
      if (!isExplicitlyCarried) {
        // Tenter l'attribution automatique dans un slot libre
        const candidate = logVehicles.find(lv => this.getFreeLogSlots(lv) >= 1);
        if (candidate) {
          candidate.loadedItems.push({
            id: bike.id,
            name: bike.name || 'VTT Secours',
            shortName: 'VTT Secours',
            slots: 1,
            isVehicle: true,
            types: ['PS'],
            consumables: bike.consumables || 100
          });
          bike.transportedBy = candidate.id;
        } else {
          return {
            valid: false,
            reason: `Espace logistique insuffisant : aucun véhicule LOG n'a de slot libre pour transporter le ${bike.name || 'vélo'}. Libérez 1 slot de transport.`
          };
        }
      }
    }

    return { valid: true };
  },

  // =========================================================================
  // 6. RÉARMEMENT À LA BASE (1-CLIC) & SUR MISSION
  // =========================================================================

  rearmAtBaseOneClick(game, stationId) {
    if (!game) game = window.game;
    const station = (game.stations || []).find(s => s.id === stationId) || (game.stations && game.stations[0]) || { id: 'default', stock: {} };
    this.ensureStationStock(station, game);

    // Véhicules rattachés à cette antenne ayant des consommables entamés
    const candidateVehs = (game.vehicles || []).filter(v => {
      if (station.id !== 'default' && v.stationId && v.stationId !== station.id) return false;
      this.normalizeVehicle(v);
      return (v.consumables < 100 || v.armementLevel < 100 || v.needsRearming);
    });

    if (candidateVehs.length === 0) {
      game.showToast('Flotte 100% Opérationnelle ✓', 'Tous vos véhicules et lots à l\'antenne sont déjà à 100% d\'armement !', 'green');
      return;
    }

    const availableCaisses = station.stock.caisse_rearmement || 0;
    const availablePS = station.stockMaterielsPS || 0;

    // Calculer les besoins : 1 caisse peut réarmer 100% de consommables
    let totalMissing = 0;
    candidateVehs.forEach(v => {
      totalMissing += (100 - (v.consumables || 100));
    });
    const caissesNeeded = Math.ceil(totalMissing / 100) || 1;

    if (availableCaisses >= caissesNeeded) {
      // Utiliser les caisses de réarmement du stock
      station.stock.caisse_rearmement -= caissesNeeded;
      candidateVehs.forEach(v => {
        v.consumables = 100;
        v.armementLevel = 100;
        v.isRearmed = true;
        v.needsRearming = false;
        v.warnedLowConsumables = false;
        v.breachedConsumables = false;
      });
      game.showToast('Flotte Réarmée en 1 Clic ✓', `${candidateVehs.length} véhicule(s) réarmé(s) à 100% (-${caissesNeeded} caisse(s) de réarmement au stock).`, 'green');
    } else if (availablePS >= totalMissing) {
      // Utiliser le stock Matériels PS
      station.stockMaterielsPS -= totalMissing;
      game.stockMaterielsPS = station.stockMaterielsPS;
      candidateVehs.forEach(v => {
        v.consumables = 100;
        v.armementLevel = 100;
        v.isRearmed = true;
        v.needsRearming = false;
        v.warnedLowConsumables = false;
        v.breachedConsumables = false;
      });
      game.showToast('Flotte Réarmée au Local ✓', `${candidateVehs.length} véhicule(s) réarmé(s) à 100% (-${Math.round(totalMissing)}% au stock Matériels PS).`, 'green');
    } else {
      // Proposer d'acheter les caisses manquantes
      const buyCost = caissesNeeded * 60;
      if (game.resources.money >= buyCost) {
        if (confirm(`Stock local insuffisant. Acheter ${caissesNeeded} Caisse(s) de réarmement pour ${buyCost} € et réarmer immédiatement la flotte ?`)) {
          game.resources.money -= buyCost;
          candidateVehs.forEach(v => {
            v.consumables = 100;
            v.armementLevel = 100;
            v.isRearmed = true;
            v.needsRearming = false;
            v.warnedLowConsumables = false;
            v.breachedConsumables = false;
          });
          game.showToast('Réarmement Validé ✓', `${candidateVehs.length} véhicule(s) réarmé(s) à 100% (${buyCost} € facturés à la Centrale d'Achats).`, 'green');
        } else {
          return;
        }
      } else {
        game.showToast('Ressources Insuffisantes', `Stock local vide et trésorerie insuffisante (${buyCost} € requis pour ${caissesNeeded} caisse(s)).`, 'orange');
        return;
      }
    }

    if (window.ProtecAudio) window.ProtecAudio.playSuccessChime();
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
    if (typeof game.renderStations === 'function') game.renderStations();
  },

  rearmVehicleSingle(game, vehicleId) {
    if (!game) game = window.game;
    const veh = (game.vehicles || []).find(v => v.id === vehicleId);
    if (!veh) return;
    this.normalizeVehicle(veh);

    if (veh.consumables >= 100) {
      game.showToast('Véhicule Complet', `${veh.name} est déjà à 100% d'armement consommables.`, 'blue');
      return;
    }

    const station = (game.stations || []).find(s => s.id === veh.stationId) || game.stations[0];
    this.ensureStationStock(station, game);

    const missing = 100 - veh.consumables;
    if ((station.stock.caisse_rearmement || 0) >= 1) {
      station.stock.caisse_rearmement -= 1;
      veh.consumables = 100;
      veh.armementLevel = 100;
      veh.isRearmed = true;
      veh.needsRearming = false;
      veh.warnedLowConsumables = false;
      veh.breachedConsumables = false;
      game.showToast('Véhicule Réarmé ✓', `${veh.name} a été réarmé à 100% (-1 caisse de réarmement).`, 'green');
    } else if ((station.stockMaterielsPS || 0) >= missing) {
      station.stockMaterielsPS -= missing;
      game.stockMaterielsPS = station.stockMaterielsPS;
      veh.consumables = 100;
      veh.armementLevel = 100;
      veh.isRearmed = true;
      veh.needsRearming = false;
      veh.warnedLowConsumables = false;
      veh.breachedConsumables = false;
      game.showToast('Véhicule Réarmé ✓', `${veh.name} a été réarmé à 100% (-${missing}% matériels PS).`, 'green');
    } else {
      if (game.resources.money >= 60) {
        if (confirm(`Stock épuisé. Acheter 1 Caisse de réarmement pour 60 € et réarmer ${veh.name} ?`)) {
          game.resources.money -= 60;
          veh.consumables = 100;
          veh.armementLevel = 100;
          veh.isRearmed = true;
          veh.needsRearming = false;
          veh.warnedLowConsumables = false;
          veh.breachedConsumables = false;
          game.showToast('Véhicule Réarmé ✓', `${veh.name} réarmé à 100% (60 € débités).`, 'green');
        } else {
          return;
        }
      } else {
        game.showToast('Stock épuisé', 'Aucune caisse de réarmement disponible et trésorerie insuffisante (60 €).', 'orange');
        return;
      }
    }

    if (window.ProtecAudio) window.ProtecAudio.playClickSound();
    game.saveGame();
    if (typeof game.updateStatsUI === 'function') game.updateStatsUI();
  },

  buyRearmKit(game, stationId) {
    if (!game) game = window.game;
    const st = (game.stations || []).find(s => s.id === stationId) || game.stations?.[0];
    if (!st) return;
    this.ensureStationStock(st, game);

    const cost = 60;
    if ((game.resources?.money || 0) < cost) {
      game.showToast('Trésorerie Insuffisante', `Il vous faut ${cost} € pour acquérir 1 Kit de réarmement.`, 'orange');
      return;
    }

    game.resources.money -= cost;
    st.stock.caisse_rearmement = (st.stock.caisse_rearmement || 0) + 1;
    game.showToast('Kit de Réarmement Acquis ✓', `1 Kit de réarmement a été ajouté au stock de l'antenne (-${cost} €).`, 'green');
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
                <strong>Impact Moral Terrain :</strong> Frustration immédiate des bénévoles engagés (<strong>-15% de moral</strong>). Sans renfort logistique, le mécontentement va s'aggraver et l'autorité organisatrice appliquera des pénalités sévères.
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
                      Fait partir immédiatement un véhicule LOG chargé de caisses de réarmement. À l'arrivée sur zone, le matériel est réarmé, le moral se stabilise (+10%) et la mission continue sereinement.
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
                    L'équipe reste sur place sans matériel : <strong>-25% de moral</strong> supplémentaire et <strong>-35% de satisfaction organisateur</strong> (pénalité de convention).
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
          name: 'Caisse de Réarmement Opérationnel',
          slots: 1,
          isCaisseRearm: true,
          types: ['LOG'],
          consumables: 100
        });
        hasCaisse = true;
      } else if (game.resources.money >= 60) {
        game.resources.money -= 60;
        veh.loadedItems.push({
          id: 'caisse_rearmement',
          name: 'Caisse de Réarmement Opérationnel',
          slots: 1,
          isCaisseRearm: true,
          types: ['LOG'],
          consumables: 100
        });
        hasCaisse = true;
        game.showToast('Caisse achetée 🛒', '1 Caisse de réarmement achetée pour 60 € et chargée à bord.', 'teal');
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
      title: 'Kit de réarmement',
      shortName: 'Kit réarmement',
      standard: 'RNMSC - Réassort Consommables',
      category: 'Soins & Réarmement',
      slots: 1,
      price: 60,
      icon: 'archive',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700',
      desc: 'Consommables d’avance pour réapprovisionner les sacs de secours et véhicules.',
      items: [
        { icon: '🩹', name: 'Compresses stériles 10x10 cm', qty: 10 },
        { icon: '🩹', name: 'Bandes extensibles Velpeau 10 cm', qty: 6 },
        { icon: '🩸', name: 'Garrots tourniquets tactiques CAT Gen 7', qty: 2 },
        { icon: '🩹', name: 'Pansements compressifs d’urgence israéliens', qty: 4 },
        { icon: '🫁', name: 'Masques O2 haute concentration avec tubulure', qty: 3 },
        { icon: '🧴', name: 'Flacon antiseptique chlorhexidine 250 ml', qty: 1 },
        { icon: '🛡️', name: 'Colliers cervicaux pédiatriques & adultes', qty: 2 },
        { icon: '✨', name: 'Couvertures de survie isothermes or/argent', qty: 4 },
        { icon: '🧤', name: 'Paires de gants nitrile stériles usage unique', qty: 10 },
        { icon: '🗑️', name: 'Sacs étanches DASRI déchets de soins', qty: 2 }
      ]
    },
    lot_secours_a: {
      id: 'lot_secours_a',
      title: 'Lot A - Poste de secours',
      shortName: 'Lot A',
      standard: 'RNMSC FNPC - Dotation VPSP / DPS',
      category: 'Premiers Secours & Urgence Vitale',
      slots: 2,
      price: 850,
      icon: 'briefcase-medical',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-700',
      desc: 'Tente et équipement pour soigner jusqu’à 6 victimes sur les postes de secours.',
      items: [
        { icon: '🫁', name: 'Bouteille Oxygène Médical 5L (200 bar) + manodétendeur', qty: 1 },
        { icon: '⚡', name: 'Défibrillateur Automatisé DAE + 2 paires électrodes', qty: 1 },
        { icon: '💨', name: 'Insufflateur manuel BAVU adulte & enfant + 3 masques', qty: 1 },
        { icon: '🩺', name: 'Kit Diagnostic (Tensiomètre, Stéthoscope, Oxymètre SpO2, Glycémie)', qty: 1 },
        { icon: '🩸', name: 'Kit Hémorragie (1 Garrot tourniquet CAT, 2 pansements israéliens)', qty: 1 },
        { icon: '🧪', name: 'Aspirateur de mucosités manuel d’urgence + sondes', qty: 1 },
        { icon: '🛡️', name: 'Pack Colliers Cervicaux multipostures (Adulte + Pédiatrique)', qty: 2 },
        { icon: '🔥', name: 'Trousse Brûlures Water-Jel & pansements hydrogel', qty: 1 },
        { icon: '✨', name: 'Couvertures de survie isothermes', qty: 2 },
        { icon: '✂️', name: 'Lampe pupillaire diagnostic & ciseaux Gesco', qty: 1 }
      ]
    },
    lot_secours_b: {
      id: 'lot_secours_b',
      title: 'Lot B - Premiers secours',
      shortName: 'Lot B',
      standard: 'RNMSC FNPC - Dotation VPSP / DPS-ME',
      category: 'Traumatologie & Évacuation',
      slots: 2,
      price: 1250,
      icon: 'stretch-horizontal',
      badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-700',
      desc: 'Sac d’urgence vitale avec oxygène et défibrillateur pour équiper un VPSP ou PAPS.',
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
    lot_secours_c: {
      id: 'lot_secours_c',
      title: 'Lot C - Immobilisation & Brancardage',
      shortName: 'Lot C',
      standard: 'RNMSC FNPC - Poste Médical Avancé & DPS',
      category: 'Structure & Accueil Soins',
      slots: 3,
      price: 1750,
      icon: 'tent',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-700',
      desc: 'Matériel complet d’immobilisation, de relevage et d’évacuation des blessés.',
      items: [
        { icon: '⛺', name: 'Tente gonflable de secours 16 m² avec armature & gonfleur électrique', qty: 1 },
        { icon: '🛏️', name: 'Brancards pliables de soins sur tréteaux d’examen médical', qty: 2 },
        { icon: '💡', name: 'Rampe d’éclairage de poste LED 220V/12V avec trépied télescopique', qty: 1 },
        { icon: '📋', name: 'Table pliante de secrétariat & régulation SINUS', qty: 1 },
        { icon: '🪑', name: 'Chaises pliantes d’attente victimes et témoins', qty: 4 },
        { icon: '📁', name: 'Mallette Fiches Médicales de l’Avant (FMA) & Main Courante', qty: 1 },
        { icon: '🌡️', name: 'Chauffage soufflant d’appoint électrique de tente', qty: 1 },
        { icon: '🗑️', name: 'Poubelles à pédale étanches DASRI & Déchets ménagers', qty: 2 }
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
  // 9. SECTION UI : ARMEMENT & CHARGEMENT LOGISTIQUE AVANT DÉPART MISSION
  // =========================================================================

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

    // S'il n'y a aucun véhicule logistique ni vélo, ne pas encombrer l'écran
    if (logVehicles.length === 0 && bicycles.length === 0) return '';

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

                ${isLog ? `
                  <!-- 1. MATÉRIELS ET LOTS ACTUELLEMENT EMBARQUÉS À BORD -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <i data-lucide="package-check" class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"></i>
                        <span>Matériels & Lots Embarqués à Bord (${(veh.loadedItems || []).length})</span>
                      </span>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg ${freeSlots > 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200'}">
                        ${freeSlots} slot(s) disponible(s)
                      </span>
                    </div>

                    ${(veh.loadedItems || []).length > 0 ? `
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        ${veh.loadedItems.map((it, idx) => {
                          const comp = this.getLotComposition(it.id);
                          const itemsList = it.itemsList || comp?.items || [];

                          return `
                            <div class="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-amber-300/80 dark:border-amber-600/40 shadow-2xs space-y-2 text-left">
                              <div class="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                                <div class="flex items-center gap-2 min-w-0">
                                  <span class="text-base">${it.isVehicle ? '🚲' : (it.isCaisseRearm ? '📦' : '🧰')}</span>
                                  <div class="min-w-0">
                                    <div class="font-black text-xs text-slate-900 dark:text-white truncate">
                                      ${it.shortName || it.name}
                                    </div>
                                    <div class="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                      Encombrement : <strong class="text-amber-900 dark:text-amber-300">${it.slots} slot(s)</strong> • Prêt à l'emploi (100%)
                                    </div>
                                  </div>
                                </div>
                                <button 
                                  type="button" 
                                  onclick="window.ProtecLogistique.unloadItemFromVehicle('${mission.id}', '${veh.id}', ${idx})" 
                                  class="px-2 py-1 rounded-lg text-[10px] font-black bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1 shrink-0" 
                                  title="Décharger ce lot et le restituer au local de l'antenne">
                                  <span>✕ Décharger</span>
                                </button>
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
                        Aucun lot ni caisse chargée dans le véhicule. Sélectionnez ci-dessous les dotations de la Protection Civile à embarquer.
                      </div>
                    `}
                  </div>

                  <!-- 2. MATÉRIELS ET LOTS DISPONIBLES AU CHARGEMENT (AVEC COMPOSITION ET QUANTITÉS VISIBLES) -->
                  <div class="pt-2 border-t border-amber-200/80 dark:border-amber-600/30 space-y-2.5">
                    <div class="flex items-center justify-between flex-wrap gap-1">
                      <span class="font-black text-slate-900 dark:text-white uppercase text-[10.5px] flex items-center gap-1.5">
                        <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-pc-blue"></i>
                        <span>Matériels & Lots Opérationnels Disponibles au Local d'Antenne :</span>
                      </span>
                      <span class="text-[10px] text-slate-500 dark:text-slate-400">
                        Cliquez pour embarquer selon vos besoins terrain
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
                                  ${lot.slots} slot${lot.slots > 1 ? 's' : ''}
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
                                  <span>${inStock > 0 ? `Embarquer dans ${veh.name} (${lot.slots} slot${lot.slots > 1 ? 's' : ''})` : `Acheter & Embarquer (${lot.price} €)`}</span>
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
                      ${bicycles.filter(b => !b.transportedBy).map(b => `
                        <div class="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 shadow-2xs space-y-2 text-left flex flex-col justify-between">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                              <span class="text-xl">🚲</span>
                              <div>
                                <h5 class="text-xs font-black text-slate-900 dark:text-white">${b.name}</h5>
                                <div class="text-[10px] text-teal-800 dark:text-teal-300 font-bold">VTT d'Intervention Rapide • 1 slot LOG</div>
                              </div>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[9px] font-black bg-teal-600 text-white">1 slot</span>
                          </div>
                          <div class="p-2 rounded-xl bg-white dark:bg-slate-900 text-[10px] text-slate-600 dark:text-slate-300">
                            Equipé d'une sacoche de premiers secours et d'un DAE compact pour progression rapide en milieu piétonnier.
                          </div>
                          ${freeSlots >= 1 ? `
                            <button 
                              type="button" 
                              onclick="window.ProtecLogistique.loadBicycleToVehicle('${mission.id}', '${veh.id}', '${b.id}')"
                              class="w-full py-1.5 px-3 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer flex items-center justify-center gap-1">
                              <span>+ Embarquer ${b.name} (1 slot)</span>
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
                ` : ''}
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

