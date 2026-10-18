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
    { id: 'all', label: 'Tout le Catalogue', iconLucide: 'layout-grid' },
    { id: 'pharmacie', label: 'Pharmacie & Consommables', iconLucide: 'cross' },
    { id: 'lots_secours', label: 'Lots de Secours A/B/C', iconLucide: 'briefcase' },
    { id: 'technique_crise', label: 'Technique & Crise', iconLucide: 'wrench' },
    { id: 'tenues_epi', label: 'Tenues & Équipements EPI', iconLucide: 'shield' },
    { id: 'social_hebergement', label: 'Ravitaillement & Social', iconLucide: 'heart-handshake' },
    { id: 'transmissions', label: 'Transmissions & Radio', iconLucide: 'radio' },
    { id: 'kits_formation', label: 'Kits Pédagogiques (Formations)', iconLucide: 'graduation-cap' }
  ],

  CATALOG: [
    // --- 1. PHARMACIE & CONSOMMABLES ---
    {
      id: 'stock_materiels_ps',
      category: 'pharmacie',
      name: 'Stock Matériels PS (Consommables Premiers Secours)',
      lucideIcon: 'briefcase-medical',
      image: 'images/equipements/woundKits.png',
      price: 150,
      unit: 'lot (100 unités / 100%)',
      badge: 'Réarmement PS',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'Dotation globale de consommables (pansements, compresses, O2, désinfection, colliers, attelles) pour réarmer les VPSP et VTU.',
      usage: 'Permet de réarmer la flotte de secours (VPSP et VTU DPS). Diminue à chaque réarmement selon le % consommé.'
    },
    {
      id: 'caisse_rearmement',
      category: 'pharmacie',
      name: 'Caisse de Réarmement Opérationnel (Kit de Réassort)',
      lucideIcon: 'archive',
      image: 'images/equipements/woundKits.png',
      price: 60,
      unit: 'caisse (100% réassort)',
      slots: 1,
      badge: 'Réarmement Opérationnel',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'Caisse de consommables complète (pansements, compresses, tubulures O2, perfusions, attelles, colliers). Embarquable dans un véhicule LOG (1 slot) ou utilisable à la base pour réarmer en 1 clic.',
      usage: 'Réarme immédiatement un VPSP ou un Lot entamé à 100% à la base ou directement sur le terrain.'
    },
    {
      id: 'oxygenBottles',
      category: 'pharmacie',
      name: 'Bouteille Oxygène Médical 5L (O2 B5)',
      lucideIcon: 'cylinder',
      image: 'images/equipements/oxygenBottles.png',
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
      lucideIcon: 'zap',
      image: 'images/equipements/aedPads.png',
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
      lucideIcon: 'cross',
      image: 'images/equipements/woundKits.png',
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
      lucideIcon: 'shield',
      image: 'images/equipements/cervicalCollars.png',
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
      lucideIcon: 'droplet',
      image: 'images/equipements/tourniquets.png',
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
      lucideIcon: 'bone',
      image: 'images/equipements/attelles_pack.png',
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
      lucideIcon: 'activity',
      image: 'images/equipements/bavu_ambu.png',
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
      lucideIcon: 'flame',
      image: 'images/equipements/trousse_brulures.png',
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
      lucideIcon: 'briefcase',
      image: 'images/equipements/lot_secours_a.png',
      price: 850,
      unit: 'lot complet',
      slots: 2,
      types: ['PS'],
      consumables: 100,
      isLot: true,
      badge: 'Dotation Majeure',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'Sac d’intervention complet avec oxygénothérapie, BAVU, oxymètre, tensiomètre, colliers et garrot.',
      usage: 'Armement obligatoire de base de tout VPSP et PAPS (+35% rapidité prise en charge). Embarquable dans un véhicule LOG (2 slots).'
    },
    {
      id: 'lot_secours_b',
      category: 'lots_secours',
      name: 'Lot B (Immobilisation, Matelas Coquille, Plan Dur)',
      lucideIcon: 'stretch-horizontal',
      image: 'images/equipements/lot_secours_b.png',
      price: 1250,
      unit: 'lot complet',
      slots: 2,
      types: ['PS'],
      consumables: 100,
      isLot: true,
      badge: 'Traumatologie Lourde',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      desc: 'Matelas immobilisateur à dépression avec pompe, plan dur adulte/enfant et chaise de transport.',
      usage: 'Indispensable pour la traumatologie sportive, chutes et extractions délicates (+25 réputation). Embarquable dans un véhicule LOG (2 slots).'
    },
    {
      id: 'lot_secours_c',
      category: 'lots_secours',
      name: 'Lot C (Poste de Secours Fixe & Barnum 16m²)',
      lucideIcon: 'tent',
      image: 'images/equipements/lot_secours_c.png',
      price: 1750,
      unit: 'lot complet',
      slots: 4,
      types: ['PS'],
      consumables: 100,
      isLot: true,
      badge: 'Grands Dispositifs',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      desc: 'Tente gonflable 16 m², 2 brancards sur tréteaux, rampe LED, table de secrétariat SINUS.',
      usage: 'Permet d’accueillir et soigner jusqu’à 6 victimes simultanément sur DPS-ME et festivals. Embarquable dans un véhicule LOG (4 slots).'
    },
    {
      id: 'sac_pedestre',
      category: 'lots_secours',
      name: 'Sacoche Binôme Secouriste Pédestre',
      lucideIcon: 'backpack',
      image: 'images/equipements/sac_pedestre.png',
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
      lucideIcon: 'chevrons-up-down',
      image: 'images/equipements/chaise_transport.png',
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
      lucideIcon: 'axe',
      image: 'images/equipements/lot_tronconnage.png',
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
      lucideIcon: 'waves',
      image: 'images/equipements/lot_pompage.png',
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
      lucideIcon: 'lightbulb',
      image: 'images/equipements/lot_eclairage.png',
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
      lucideIcon: 'home',
      image: 'images/equipements/lot_bachage.png',
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
      lucideIcon: 'zap',
      image: 'images/equipements/groupe_electro.png',
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
      lucideIcon: 'shirt',
      image: 'images/equipements/tenue_f1.png',
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
      lucideIcon: 'hard-hat',
      image: 'images/equipements/casque_f2.png',
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
      lucideIcon: 'footprints',
      image: 'images/equipements/rangers_secours.png',
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
      lucideIcon: 'hand',
      image: 'images/equipements/gants_intervention.png',
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
      lucideIcon: 'bed-double',
      image: 'images/equipements/lot_hebergement.png',
      price: 2100,
      unit: 'lot complet',
      slots: 3,
      types: ['LOG', 'TP'],
      consumables: 100,
      isLot: true,
      badge: 'Plan PCS Sinistrés',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: '30 lits de camp métalliques Sécurité Civile, 30 duvets thermiques et 30 kits d’hygiène.',
      usage: 'Armement immédiat d’un Centre d’Hébergement d’Urgence (CHU) ou gymnase communal. Embarquable dans un véhicule LOG (3 slots).'
    },
    {
      id: 'lot_ravitaillement',
      category: 'social_hebergement',
      name: 'Lot Ravitaillement / Cuisine de Crise & Percolateur',
      lucideIcon: 'utensils',
      image: 'images/equipements/lot_ravitaillement.png',
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
      lucideIcon: 'heart-handshake',
      image: 'images/equipements/lot_soutien_psy.png',
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
      lucideIcon: 'sparkles',
      image: 'images/equipements/couvertures_pack.png',
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
      lucideIcon: 'bath',
      image: 'images/equipements/kits_hygiene.png',
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
      lucideIcon: 'radio',
      image: 'images/equipements/radio_antares.png',
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
      lucideIcon: 'tablet',
      image: 'images/equipements/tablette_tlo.png',
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
      lucideIcon: 'battery-charging',
      image: 'images/equipements/chargeur_radios.png',
      price: 190,
      unit: 'chargeur 6 slots',
      badge: 'Vie d’Antenne',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      desc: 'Station de recharge rapide simultanée pour 6 talkies-walkies au local d’antenne.',
      usage: 'Garantit que toutes les radios sont chargées à 100% au départ des équipages.'
    },
    {
      id: 'lot_poste_commandement_mobile',
      category: 'transmissions',
      name: 'Poste de Commandement Mobile',
      lucideIcon: 'satellite',
      image: 'images/equipements/lot_poste_commandement_mobile.png',
      price: 2800,
      unit: 'lot complet',
      badge: 'Commandement de Crise (VLC)',
      badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-300',
      desc: 'Valise tactique informatique durcie, cartographie SIG/SINUS, baie radio multi-bandes ANTARES, modem satellite 4G/5G, tableau SITAC et alimentation autonome.',
      usage: 'À installer dans une VL pour la transformer en VL Commandement capable de piloter une crise majeure, un plan NOVI ou mise en gestion d’un Chef de Dispositif/Chef de Poste.'
    },

    // --- 7. KITS PÉDAGOGIQUES OFFICIELS (FORMATIONS) ---
    {
      id: 'kit_pedago_psc',
      category: 'kits_formation',
      name: 'Kit Pédagogique PSC (Prévention et Secours Civiques)',
      lucideIcon: 'graduation-cap',
      image: 'images/equipements/kit_pedago_psc.png',
      price: 1200,
      unit: 'kit complet',
      badge: 'Filière Citoyenne',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      desc: 'Mannequins QCPR adulte/enfant/nourrisson connectés, défibrillateur DAE de formation avec télécommande, tapis de sol et masques d’exercice.',
      usage: 'Matériel obligatoire pour ouvrir et dispenser les formations grand public GQS et PSC.'
    },
    {
      id: 'kit_pedago_sst',
      category: 'kits_formation',
      name: 'Kit Pédagogique SST (Sauveteur Secouriste du Travail)',
      lucideIcon: 'briefcase',
      image: 'images/equipements/kit_pedago_sst.png',
      price: 1100,
      unit: 'kit complet',
      badge: 'Santé Travail INRS',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
      desc: 'Plan d’intervention SST officiel INRS, mannequins, aides visuelles et accessoires de simulation des risques professionnels.',
      usage: 'Indispensable pour organiser les formations SST et recyclages MAC SST auprès des entreprises.'
    },
    {
      id: 'kit_pedago_pse1',
      category: 'kits_formation',
      name: 'Kit Pédagogique PSE1 (Secouriste)',
      lucideIcon: 'backpack',
      image: 'images/equipements/kit_pedago_pse1.png',
      price: 1600,
      unit: 'kit complet',
      badge: 'Filière Opérationnelle',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      desc: 'Sac d’intervention d’exercice, insufflateurs BAVU, colliers cervicaux, aspirateur de mucosités simulé et oxymètre d’entraînement.',
      usage: 'Requis pour former et certifier les bénévoles au rôle de Secouriste (PSE1).'
    },
    {
      id: 'kit_pedago_pse2',
      category: 'kits_formation',
      name: 'Kit Pédagogique PSE2 (Équipier Secouriste)',
      lucideIcon: 'stretch-horizontal',
      image: 'images/equipements/kit_pedago_pse2.png',
      price: 2200,
      unit: 'kit complet',
      badge: 'Traumatologie & VPSP',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      desc: 'Matelas à dépression d’entraînement avec pompe, plan dur, brancard pliant, attelles de traction et matériel de relevage complexe.',
      usage: 'Requis pour former les Équipiers Secouristes (PSE2) et organiser le recyclage FC PSE.'
    },
    {
      id: 'kit_pedago_extincteur',
      category: 'kits_formation',
      name: 'Kit Manipulation Extincteurs (EPI Incendie)',
      lucideIcon: 'flame',
      image: 'images/equipements/kit_pedago_extincteur.png',
      price: 1400,
      unit: 'kit complet',
      badge: 'Sécurité Incendie',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-300',
      desc: 'Générateur de flammes à gaz écologique (bac à feu), extincteurs rechargeables à eau pulvérisée et CO2, couvertures anti-feu.',
      usage: 'Obligatoire pour animer les formations pratiques de Manipulation Extincteurs en entreprise et ERP.'
    },
    {
      id: 'kit_pedago_picf',
      category: 'kits_formation',
      name: 'Kit Pédagogique PIC F (Pédagogie de Formateur)',
      lucideIcon: 'clipboard-list',
      image: 'images/equipements/kit_pedago_picf.png',
      price: 850,
      unit: 'kit complet',
      badge: 'Filière Cadres Formateurs',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-300',
      desc: 'Supports didactiques officiels, paperboard portable de formation, vidéoprojecteur nomade et jeux de cartes de dynamique de groupe.',
      usage: 'Nécessaire pour animer le stage initial PIC F (Pédagogie Initiale et Commune de Formateur).'
    },
    {
      id: 'kit_pedago_ssa',
      category: 'kits_formation',
      name: 'Kit Pédagogique SSA (Sauvetage Aquatique)',
      lucideIcon: 'life-buoy',
      image: 'images/equipements/kit_pedago_ssa.png',
      price: 1300,
      unit: 'kit complet',
      badge: 'Spécialité Aquatique',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-300',
      desc: 'Mannequins d’immersion lestés, bouées tubes de sauvetage, filins de jet, palmes d’entraînement et matériel de flottabilité.',
      usage: 'Matériel requis pour les entraînements et certifications de Surveillance et Sauvetage Aquatique (SSA).'
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
      station.stockMaterielsPS = 150;
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

  getShippingFee(subtotal) {
    if (subtotal <= 0) return 0;
    const baseFee = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('shippingBaseFee', 35) : 35;
    const threshold = window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('shippingFreeThreshold', 350) : 350;
    if (subtotal >= threshold) return 0;
    return baseFee;
  },

  getDeliveryDurationSeconds() {
    return window.ProtecGameplayConfig ? window.ProtecGameplayConfig.get('deliveryDurationSeconds', 120) : 120;
  },

  getActiveDeliveries(game) {
    if (!game || !Array.isArray(game.deliveries)) return [];
    return game.deliveries.filter(d => d && d.status === 'in_transit');
  },

  checkout(game) {
    const { total: subtotal, itemsCount } = this.getCartTotal();
    if (itemsCount === 0) {
      game.showToast('Panier vide', 'Ajoutez du matériel au panier avant de commander.', 'orange');
      return;
    }

    const shippingFee = this.getShippingFee(subtotal);
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
        `Commande Centrale d'Achats (${itemsCount} articles${shippingFee > 0 ? ` + frais d'envoi ${shippingFee} €` : ' - Port offert'})`,
        'logistique',
        `ACHAT-${Date.now()}`,
        'Centrale Logistique Protection Civile'
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
          lucideIcon: catItem.lucideIcon || 'package'
        });
      }
    });

    if (!Array.isArray(game.deliveries)) game.deliveries = [];
    const durationSec = this.getDeliveryDurationSeconds();

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
      carrier: 'Messagerie Logistique Protection Civile (Centrale FNPC)',
      status: 'in_transit'
    };

    game.deliveries.unshift(delivery);

    // Vider le panier
    this.cart = {};

    // Sauvegarde immédiate
    game.updateStatsUI();
    game.saveGame();

    const minStr = Math.ceil(durationSec / 60);
    game.showToast(
      '🚚 Commande Validée & Expédiée !', 
      `Montant réglé : ${totalToPay.toLocaleString('fr-FR')} € ${shippingFee > 0 ? `(dont ${shippingFee} € de livraison)` : '(Livraison offerte)'}. Arrivée estimée dans ${minStr} min à ${station.name}.`, 
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
            station.stock[itemId] = (station.stock[itemId] || 0) + qty;
            if (itemId === 'stock_materiels_ps') {
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

  updateLiveDeliveryTrackers(game) {
    const activeDeliveries = this.getActiveDeliveries(game);
    activeDeliveries.forEach(d => {
      const remainingSec = Math.max(0, Math.ceil((d.etaTimestamp - Date.now()) / 1000));
      const totalSec = d.durationSeconds || 120;
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
            <button onclick="window.ProtecLogistique.setTab('boutique')" class="px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 ${this.activeTab === 'boutique' ? 'bg-pc-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
              <span>Boutique en Ligne</span>
              ${cartCount > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-black">${cartCount}</span>` : ''}
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
                    <!-- Zone image PNG avec fallback icône Lucide vectorielle -->
                    <div class="relative w-full h-32 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-2.5 group-hover:border-pc-blue/30 transition">
                      <img src="${item.image || 'images/equipements/' + item.id + '.png'}" 
                           alt="${item.name}" 
                           class="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                           onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" />
                      <div class="fallback-icon hidden w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
                        <i data-lucide="${item.lucideIcon || 'package'}" class="w-9 h-9 text-pc-blue stroke-[1.75]"></i>
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">${item.unit}</span>
                      </div>
                      <span class="px-2 py-0.5 rounded text-[9.5px] font-black border backdrop-blur-md shadow-xs absolute top-2 left-2 ${item.badgeColor}">
                        ${item.badge}
                      </span>
                      <span class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/95 border border-slate-200 text-slate-700 shadow-xs">
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
                  const totalSec = d.durationSeconds || 120;
                  const elapsed = Math.max(0, totalSec - remainingSec);
                  const progress = Math.min(100, Math.round((elapsed / totalSec) * 100));
                  const m = Math.floor(remainingSec / 60);
                  const s = remainingSec % 60;
                  const timeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
              const item = this.CATALOG.find(i => i.id === id);
              if (!item) return '';

              return `
                <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="relative w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden">
                      <img src="${item.image || 'images/equipements/' + item.id + '.png'}" 
                           alt="${item.name}" 
                           class="w-full h-full object-contain p-1"
                           onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');" />
                      <div class="fallback-icon hidden w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                        <i data-lucide="${item.lucideIcon || 'package'}" class="w-6 h-6 text-pc-blue stroke-[1.75]"></i>
                      </div>
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
    const stock = (game.logistics?.stationsStock && game.logistics.stationsStock[station?.id]) || {};

    // Consommables nécessaires : O2 médical, compresses stériles, gants nitrile, spray désinfectant
    const hasO2 = (stock.oxygenBottles && stock.oxygenBottles >= 1) || (stock.medicalO2 && stock.medicalO2 >= 1);
    const hasCompresses = (stock.woundKits && stock.woundKits >= 1) || (stock.compresses && stock.compresses >= 1);
    const hasGloves = (stock.protectiveGloves && stock.protectiveGloves >= 1) || (stock.gants && stock.gants >= 1);
    const hasDisinfectant = (stock.disinfectantSprays && stock.disinfectantSprays >= 1) || (stock.surfanios && stock.surfanios >= 1);

    const hasWaterPoint = station?.premises?.rooms?.sas_desinfection_pharmacie?.hasWaterPoint || (station?.premises?.rooms?.sas_desinfection_pharmacie?.level >= 2);
    const fullStock = hasO2 && hasCompresses && hasGloves && hasDisinfectant;

    if (!fullStock) {
      // Si consommables manquants au local, forfait kit réarmement pharmacie (divisé par 2 si point d'eau/centrale présente : 22 € au lieu de 45 €)
      const cost = hasWaterPoint ? 22 : 45;
      if (game.resources.money < cost) {
        game.showToast('Stock insuffisant & Fonds manquants', `Le kit de réarmement (O2, compresses, gants, désinfectant) requiert ${cost} € ou les consommables en stock.`, 'orange');
        return;
      }
      game.resources.money -= cost;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, -cost, `Achat Pack Réarmement & Bionettoyage VPSP ${hasWaterPoint ? '(Centrale SAS intégrée)' : ''}`, 'materiel');
      }
    } else {
      // Déduire du stock de la station
      if (stock.oxygenBottles) stock.oxygenBottles = Math.max(0, stock.oxygenBottles - 1);
      else if (stock.medicalO2) stock.medicalO2 = Math.max(0, stock.medicalO2 - 1);

      if (stock.woundKits) stock.woundKits = Math.max(0, stock.woundKits - 1);
      else if (stock.compresses) stock.compresses = Math.max(0, stock.compresses - 1);

      if (stock.protectiveGloves) stock.protectiveGloves = Math.max(0, stock.protectiveGloves - 1);
      else if (stock.gants) stock.gants = Math.max(0, stock.gants - 1);

      if (stock.disinfectantSprays) stock.disinfectantSprays = Math.max(0, stock.disinfectantSprays - 1);
      else if (stock.surfanios) stock.surfanios = Math.max(0, stock.surfanios - 1);

      this.syncToGlobalLogistics(game);
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

    v.status = 'dispo';
    v.a_rearme = false;
    v.needsRearming = false;
    v.disinfectionNeeded = false;
    v.lastDisinfectionDate = Date.now();

    const waterNotice = hasWaterPoint ? ' [Centrale de bionettoyage SAS utilisée : temps & coût divisés par 2]' : '';
    game.showToast(
      'Véhicule Réarmé & Désinfecté ✓',
      `${v.name} : Bouteille O2 changée, compresses et gants réapprovisionnés, bionettoyage validé${vol ? ` par ${vol.name}` : ''}.${waterNotice} Prêt pour départ opérationnel !`,
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
                      <img src="${v.image || (game.getVehicleImage ? game.getVehicleImage(v.type) : `images/vehicles/${v.type}.png`)}" alt="${v.name}" class="max-h-full max-w-full object-contain" onerror="this.outerHTML='<i data-lucide=\\'truck\\' class=\\'w-6 h-6 text-slate-500\\'></i>'" />
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

    if (availableInStock <= 0) {
      // Proposer d'acheter l'item directement si caisse de réarmement
      if (itemId === 'caisse_rearmement') {
        const cost = catItem ? catItem.price : 60;
        if (game.resources.money < cost) {
          game.showToast('Stock épuisé', `Aucune caisse de réarmement au local et trésorerie insuffisante (${cost} € requise).`, 'orange');
          return;
        }
        game.resources.money -= cost;
        station.stock[itemId] = 1;
        game.showToast('Caisse achetée 🛒', `1 Caisse de réarmement achetée pour ${cost} € et ajoutée au stock.`, 'teal');
      } else {
        game.showToast('Stock épuisé', `Aucun exemplaire de « ${catItem?.name || itemId} » disponible au local. Commandez-en à la Centrale d'Achats.`, 'orange');
        return;
      }
    }

    const check = this.canLoadInVehicle(veh, catItem || { slots: 1 });
    if (!check.can) {
      game.showToast('Chargement impossible ⚠️', check.reason, 'orange');
      return;
    }

    // Déduire du stock local
    station.stock[itemId] = Math.max(0, (station.stock[itemId] || 1) - 1);

    // Embarquer l'item dans le véhicule LOG
    const loadedEntry = {
      id: itemId,
      name: catItem?.name || itemId,
      shortName: catItem?.name ? catItem.name.split('(')[0].trim() : itemId,
      slots: catItem?.slots || 1,
      types: catItem?.types || (itemId === 'caisse_rearmement' ? ['LOG'] : ['PS']),
      consumables: 100,
      maxConsumables: 100,
      isLot: !!catItem?.isLot,
      isCaisseRearm: itemId === 'caisse_rearmement'
    };

    veh.loadedItems.push(loadedEntry);
    game.showToast('Matériel chargé 📦', `« ${loadedEntry.name} » (${loadedEntry.slots} slot(s)) embarqué dans ${veh.name}.`, 'green');
    if (window.ProtecAudio) window.ProtecAudio.playClickSound();

    game.saveGame();
    if (typeof game.openMissionDetails === 'function' && mission) {
      game.openMissionDetails(mission.id);
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
    if (typeof game.openMissionDetails === 'function' && mission) {
      game.openMissionDetails(mission.id);
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
    if (typeof game.openMissionDetails === 'function' && mission) {
      game.openMissionDetails(mission.id);
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
    if (typeof game.openMissionDetails === 'function' && mission) {
      game.openMissionDetails(mission.id);
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
      <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
              📦
            </div>
            <div>
              <h4 class="text-xs font-black text-slate-900 uppercase tracking-wide">
                Armement Logistique & Capacité des Véhicules
              </h4>
              <p class="text-[10px] text-slate-500">
                Seuls les véhicules disposant du tag <strong>LOG</strong> peuvent embarquer des lots, caisses de réarmement et vélos.
              </p>
            </div>
          </div>
          <span class="text-[10px] font-bold text-slate-500">
            ${logVehicles.length} véhicule(s) LOG engagé(s)
          </span>
        </div>

        <!-- Alerte transport VTT si concerné -->
        ${bicycles.length > 0 ? (
          bikeTransportCheck.valid ? `
            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
              <span class="text-lg">🚲</span>
              <div>
                <strong>VTT Secours Prêt au Transport :</strong> Le vélo est sécurisé dans un véhicule LOG (encombrement 1 slot). Il sera déployé à l'arrivée sur zone.
              </div>
            </div>
          ` : `
            <div class="p-3 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 text-xs font-black flex items-center gap-2.5 animate-pulse shadow-xs">
              <span class="text-xl">⚠️</span>
              <div>
                <strong>Avertissement Transport VTT :</strong> ${bikeTransportCheck.reason}
              </div>
            </div>
          `
        ) : ''}

        <!-- Détail de chaque véhicule engagé -->
        <div class="space-y-3">
          ${assignedVehs.map(veh => {
            this.normalizeVehicle(veh);
            const isLog = (veh.types || []).includes('LOG');
            const capLog = veh.capacity_log || 0;
            const usedSlots = this.getUsedLogSlots(veh);
            const freeSlots = Math.max(0, capLog - usedSlots);
            const consumables = Math.round(veh.consumables !== undefined ? veh.consumables : 100);

            return `
              <div class="p-3.5 rounded-xl border ${isLog ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-slate-50/60'} space-y-2.5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <span class="text-xl">${isLog ? '🚐' : (veh.type === 'VPSP' ? '🚑' : (veh.isBicycle ? '🚲' : '🚗'))}</span>
                    <div>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <strong class="text-xs text-slate-900">${veh.name}</strong>
                        ${this.getVehicleCapabilitiesBadgesHTML(veh)}
                      </div>
                      <div class="text-[10px] text-slate-500 mt-0.5">
                        ${veh.model || veh.type} • 
                        ${isLog ? `Capacité LOG : <strong class="text-amber-900">${usedSlots} / ${capLog} slots occupés</strong>` : '<span class="text-slate-400 italic">Strictement dotation native (Capacité LOG : 0)</span>'}
                      </div>
                    </div>
                  </div>

                  <!-- Jauge Consommables -->
                  <div class="flex items-center gap-2 sm:justify-end">
                    <span class="text-[10px] font-bold text-slate-600">Jauge Soins :</span>
                    <div class="w-20 bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                      <div class="h-full rounded-full ${consumables > 40 ? 'bg-emerald-500' : (consumables > 15 ? 'bg-amber-500' : 'bg-red-500')}" style="width: ${consumables}%"></div>
                    </div>
                    <span class="font-mono font-black text-xs ${consumables > 40 ? 'text-emerald-700' : (consumables > 15 ? 'text-amber-700' : 'text-red-700')}">${consumables}%</span>
                  </div>
                </div>

                ${isLog ? `
                  <!-- Espace de chargement pour véhicule LOG -->
                  <div class="pt-2 border-t border-amber-200/80 space-y-2">
                    <div class="flex items-center justify-between text-[11px]">
                      <span class="font-black text-amber-950 uppercase text-[10px]">
                        Matériels & Lots Embarqués (${(veh.loadedItems || []).length})
                      </span>
                      <span class="text-[10px] font-bold ${freeSlots > 0 ? 'text-emerald-700' : 'text-amber-800'}">
                        ${freeSlots} slot(s) libre(s)
                      </span>
                    </div>

                    <!-- Items actuellement dans le véhicule -->
                    ${(veh.loadedItems || []).length > 0 ? `
                      <div class="flex flex-wrap gap-1.5">
                        ${veh.loadedItems.map((it, idx) => `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white border border-amber-300 text-slate-800 shadow-2xs">
                            <span>${it.isVehicle ? '🚲' : (it.isCaisseRearm ? '📦' : '🧰')}</span>
                            <span>${it.shortName || it.name} (${it.slots} slot)</span>
                            ${it.consumables !== undefined ? `<span class="text-[9px] font-mono px-1 rounded bg-slate-100">${Math.round(it.consumables)}%</span>` : ''}
                            <button 
                              type="button" 
                              onclick="window.ProtecLogistique.unloadItemFromVehicle('${mission.id}', '${veh.id}', ${idx})" 
                              class="text-rose-500 hover:text-rose-700 font-black ml-0.5 cursor-pointer" 
                              title="Décharger et ranger au local">✕</button>
                          </span>
                        `).join('')}
                      </div>
                    ` : `
                      <div class="text-[10.5px] text-slate-500 italic p-1.5 bg-white/70 rounded-lg">
                        Aucun lot ni caisse chargée. Cliquez ci-dessous pour armer ce véhicule.
                      </div>
                    `}

                    <!-- Boutons de chargement rapide -->
                    <div class="flex items-center gap-1.5 flex-wrap pt-1">
                      <button 
                        type="button" 
                        onclick="window.ProtecLogistique.loadItemToVehicle('${mission.id}', '${veh.id}', 'caisse_rearmement')"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1">
                        <span>+ Caisse Réarmement (1 slot)</span>
                      </button>

                      <button 
                        type="button" 
                        onclick="window.ProtecLogistique.loadItemToVehicle('${mission.id}', '${veh.id}', 'lot_secours_a')"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-pc-blue hover:bg-blue-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1">
                        <span>+ Lot A Secours (2 slots)</span>
                      </button>

                      <button 
                        type="button" 
                        onclick="window.ProtecLogistique.loadItemToVehicle('${mission.id}', '${veh.id}', 'lot_secours_b')"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1">
                        <span>+ Lot B Traumatologie (2 slots)</span>
                      </button>

                      <button 
                        type="button" 
                        onclick="window.ProtecLogistique.loadItemToVehicle('${mission.id}', '${veh.id}', 'lot_hebergement')"
                        class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1">
                        <span>+ Lot Hébergement (3 slots)</span>
                      </button>

                      ${bicycles.filter(b => !b.transportedBy).map(b => `
                        <button 
                          type="button" 
                          onclick="window.ProtecLogistique.loadBicycleToVehicle('${mission.id}', '${veh.id}', '${b.id}')"
                          class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1">
                          <span>+ Embarquer ${b.name} (1 slot)</span>
                        </button>
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

