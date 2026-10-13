/**
 * PROTEC LIVE - SYSTÈMES AVANCÉS :
 * 1. Récompenses quotidiennes & Défis hebdomadaires
 * 2. Aménagement intérieur & Évolution du local de l'antenne (Pièces & Améliorations)
 * 3. Véhicules spécialisés (VPSP, VTU, VLM, VPC, Canot Nautique BLS, Quad/VTT)
 * 4. Arbre de compétences des bénévoles & Bureau d'antenne
 * 5. Manœuvres multijoueurs & Exercices inter-alliances
 */

window.ProtecAdvanced = {
  // --- CATALOGUE DES VÉHICULES ÉTENDU ---
  // --- CATALOGUE DES MODÈLES & CHÂSSIS (PARTIE 1 DU MAGASIN : RECHERCHE PAR MODÈLE & CONFIGURATION) ---
  chassisModels: [
    {
      id: 'master3',
      name: 'Renault Master III',
      brand: 'Renault Trucks',
      desc: 'Le grand fourgon utilitaire de référence de la Protection Civile. Châssis éprouvé, disponible en ambulance profilée, grand volume cube, minibus 9 places ou logistique tôlée.',
      icon: '🚐',
      defaultVariantId: 'master3_vpsp',
      variants: [
        {
          id: 'master3_vpsp',
          type: 'VPSP',
          name: 'Renault Master III - VPSP Cellule Standard Profilée',
          shortName: 'Ambulance VPSP Profilée',
          category: 'Secours d’Urgence',
          missionFilter: ['secours'],
          desc: 'Cellule sanitaire grand volume profilée intégrée d’origine aux normes EN 1789, brancard 3 points, oxygénothérapie et armoire d’urgence SUAP.',
          cost: 28500,
          capacity: 5,
          licenseRequired: 'B',
          licenseLabel: 'Permis B (+ Habilitation P.VPSP)',
          speedKmH: 85,
          hasTowHitch: false,
          image: 'images/vehicles/master3_vpsp.png',
          specialty: 'Urgences Réflexes & SAMU 15'
        },
        {
          id: 'master3_vpsp_cube',
          type: 'VPSP',
          name: 'Renault Master III - VPSP Grande Cellule Cube Sanitaire',
          shortName: 'Ambulance VPSP Grande Cellule Cube',
          category: 'Secours d’Urgence',
          missionFilter: ['secours'],
          desc: 'Cellule sanitaire carrée cubique XXL modulaire sur châssis-cabine. Espace d’intervention maximal idéal pour réanimation avancée et postes médicaux de grande envergure.',
          cost: 32000,
          capacity: 5,
          licenseRequired: 'B',
          licenseLabel: 'Permis B (+ Habilitation P.VPSP)',
          speedKmH: 80,
          hasTowHitch: false,
          image: 'images/vehicles/master3_vpsp_cube.png',
          specialty: 'Soins Intensifs & Cellule Grand Volume'
        },
        {
          id: 'master3_vtp',
          type: 'VTP',
          name: 'Renault Master III - VTP Transport de Personnel (9 places)',
          shortName: 'Minibus VTP 9 places',
          category: 'Transport d’Équipes',
          missionFilter: ['logistique'],
          desc: 'Minibus grand confort 9 places vitré pour acheminement d’équipes complètes de secouristes, relèves d’astreinte et longs déplacements interdépartementaux.',
          cost: 21000,
          capacity: 9,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 85,
          hasTowHitch: true,
          image: 'images/vehicles/master3_vtp.png',
          specialty: 'Acheminement de Renforts'
        },
        {
          id: 'master3_vtu_log',
          type: 'VTU',
          name: 'Renault Master III - VTU Fourgon Logistique',
          shortName: 'VTU Tôlé Logistique',
          category: 'Logistique & Événementiel',
          missionFilter: ['logistique'],
          serigraphieKey: 'logistique',
          serigraphieLabel: 'Logistique',
          desc: 'Fourgon tôlé utilitaire grand volume équipé d’étagères modulaires, sangles d’arrimage et crochet d’attelage pour tentes, PMA, lits de camp et logistique.',
          cost: 17500,
          capacity: 3,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 75,
          hasTowHitch: true,
          image: 'images/vehicles/master3_vtu_log.png',
          specialty: 'Transport Lots PMA & Tentes'
        },
        {
          id: 'master3_vtu_pop',
          type: 'VTU',
          name: 'Renault Master III - VTU Soutien aux Populations',
          shortName: 'VTU Soutien Populations',
          category: 'Soutien & Sauvegarde',
          missionFilter: ['logistique', 'social'],
          serigraphieKey: 'soutien_pop',
          serigraphieLabel: 'Soutien aux Populations',
          desc: 'Fourgon d’assistance et sauvegarde citoyenne avec sérigraphie officielle Soutien aux Populations : kits sinistrés, ravitaillement de crise et accueil d’urgence.',
          cost: 17500,
          capacity: 3,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 75,
          hasTowHitch: true,
          image: 'images/vehicles/master3_vtu_pop.png',
          specialty: 'Assistance Sinistrés & Catastrophes'
        }
      ]
    },
    {
      id: 'trafic3',
      name: 'Renault Trafic III',
      brand: 'Renault',
      desc: 'Fourgon compact moderne et maniable, parfait en milieu urbain dense et pour les liaisons rapides d’antenne.',
      icon: '🚐',
      defaultVariantId: 'trafic3_vtp',
      variants: [
        {
          id: 'trafic3_vtp',
          type: 'VTP',
          name: 'Renault Trafic III - VTP Minibus d’Intervention (9 places)',
          shortName: 'Minibus VTP 9 places',
          category: 'Transport d’Équipes',
          missionFilter: ['logistique'],
          desc: 'Minibus 9 places polyvalent, idéal pour la relève rapide des équipes sur dispositifs prévisionnels de secours urbains.',
          cost: 19500,
          capacity: 9,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 90,
          hasTowHitch: true,
          image: 'images/vehicles/trafic_vtp.png',
          specialty: 'Transport Urbain & Relèves'
        },
        {
          id: 'trafic3_vtu',
          type: 'VTU',
          name: 'Renault Trafic III - VTU Fourgon Moyen Logistique',
          shortName: 'Fourgon VTU Polyvalent',
          category: 'Logistique & Événementiel',
          missionFilter: ['logistique'],
          desc: 'Fourgon moyen agile avec cloison de séparation et crochet d’attelage pour matériel léger et tentes de secours.',
          cost: 16000,
          capacity: 3,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 90,
          hasTowHitch: true,
          image: 'images/vehicles/VTU.png',
          specialty: 'Logistique Rapide'
        }
      ]
    },
    {
      id: 'ducato',
      name: 'Fiat Ducato',
      brand: 'Fiat Professional',
      desc: 'Plateforme utilitaire robuste et spacieuse, réputée pour sa fiabilité et sa grande largeur utile.',
      icon: '🚑',
      defaultVariantId: 'ducato_vpsp',
      variants: [
        {
          id: 'ducato_vpsp',
          type: 'VPSP',
          name: 'Fiat Ducato - VPSP Secours Sanitaire',
          shortName: 'Ambulance VPSP Grand Volume',
          category: 'Secours d’Urgence',
          missionFilter: ['secours'],
          desc: 'Ambulance de premiers secours avec cellule ergonomique grand gabarit pour prise en charge médicale confortable.',
          cost: 27900,
          capacity: 5,
          licenseRequired: 'B',
          licenseLabel: 'Permis B (+ Habilitation P.VPSP)',
          speedKmH: 85,
          hasTowHitch: false,
          image: 'images/vehicles/VPSP.png',
          specialty: 'Secours d’Urgence'
        },
        {
          id: 'ducato_vtu',
          type: 'VTU',
          name: 'Fiat Ducato - VTU Grand Volume Fret',
          shortName: 'Fourgon VTU Fret L3H2',
          category: 'Logistique & Événementiel',
          missionFilter: ['logistique'],
          desc: 'Fourgon grand volume pour acheminement de gros matériel et charges lourdes sur évènements sportifs et culturels.',
          cost: 18000,
          capacity: 3,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 80,
          hasTowHitch: true,
          image: 'images/vehicles/VTU.png',
          specialty: 'Transport Lourd de Fret'
        }
      ]
    },
    {
      id: 'tout_terrain_vl',
      name: 'Dacia Duster & Gamme 4x4 (VL / VLHR)',
      brand: 'Dacia / Toyota',
      desc: 'Véhicules légers et tout-terrain de commandement, reconnaissance rapide et franchissement.',
      icon: '🚙',
      defaultVariantId: 'duster_vl',
      variants: [
        {
          id: 'duster_vl',
          type: 'VL',
          name: 'Dacia Duster II - Véhicule de Liaison (VL)',
          shortName: 'VL Liaison Rapide',
          category: 'Reconnaissance Rapide',
          missionFilter: ['liaison'],
          desc: 'Véhicule léger avec rampe lumineuse, équipement radio et crochet d’attelage pour reconnaissance et commandement.',
          cost: 11500,
          capacity: 4,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 100,
          hasTowHitch: true,
          image: 'images/vehicles/VL.png',
          specialty: 'Reconnaissance & Commandement'
        },
        {
          id: 'hilux_vlhr',
          type: 'VLHR',
          name: 'Toyota Hilux 4x4 - Véhicule Léger Hors Route (VLHR)',
          shortName: 'VLHR Franchissement 4x4',
          category: 'Tout-Terrain',
          missionFilter: ['liaison', 'tout_terrain'],
          desc: 'Pick-up 4x4 tout-terrain pour zones accidentées, massifs forestiers, franchissement et remorquage lourd.',
          cost: 19500,
          capacity: 4,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 90,
          hasTowHitch: true,
          image: 'images/vehicles/VLHR.png',
          specialty: 'Accès Tout-Terrain & Crues'
        }
      ]
    },
    {
      id: 'heavy_fleet',
      name: 'Flotte Poids Lourds (> 3.5t - Permis C Requis)',
      brand: 'Gamme Poids Lourd Officielle',
      desc: 'Poids lourds opérationnels (> 3.5 tonnes) nécessitant un conducteur titulaire du Permis C (Poids Lourd).',
      icon: '🚚',
      defaultVariantId: 'flit_heavy',
      variants: [
        {
          id: 'flit_heavy',
          type: 'FLIT',
          name: 'FLIT - Fourgon Lourd d’Intervention Technique',
          shortName: 'FLIT Fourgon Lourd (Type FPTL/FPTSR > 12t)',
          category: 'Technique & Soutien',
          missionFilter: ['logistique', 'usar'],
          desc: 'Poids Lourd d’intervention technique et secours lourd (châssis type FPTL / FPTSR > 12t) : cellule avec rideaux alu, montage rapide de Poste Médical Avancé (PMA), groupes électrogènes de puissance, mâts d’éclairage télescopiques et pompes d’épuisement. Conducteur Permis C obligatoire.',
          cost: 95000,
          capacity: 3,
          licenseRequired: 'C',
          licenseLabel: 'Permis C (Poids Lourd) Requis 🚚',
          speedKmH: 70,
          hasTowHitch: true,
          image: 'images/vehicles/FLIT.png',
          specialty: 'Postes Médicaux Avancés & Crises'
        },
        {
          id: 'pcm_heavy',
          type: 'PCM',
          name: 'PCM - Poste de Commandement Mobile',
          shortName: 'Poste de Commandement Mobile (> 3.5t)',
          category: 'Commandement Lourd',
          missionFilter: ['liaison'],
          desc: 'Centre opérationnel mobile de crise avec baie de transmissions VHF/UHF, liaisons satellites et salle de crise embarquée. Conducteur Permis C obligatoire.',
          cost: 45000,
          capacity: 3,
          licenseRequired: 'C',
          licenseLabel: 'Permis C (Poids Lourd) Requis 🚚',
          speedKmH: 65,
          hasTowHitch: false,
          image: 'images/vehicles/PCM.png',
          specialty: 'Coordination Grands Événements & NOVI'
        }
      ]
    },
    {
      id: 'specialities_fleet',
      name: 'Vecteurs Mobiles, Nautique & Spécialités',
      brand: 'Équipements Spécifiques',
      desc: 'Moyens nautiques, deux-roues et remorques pour interventions spécialisées.',
      icon: '🚤',
      defaultVariantId: 'ers_boat',
      variants: [
        {
          id: 'ers_boat',
          type: 'ERS',
          name: 'ERS - Embarcation de Reconnaissance et de Sauvetage',
          shortName: 'Bateau ERS + Remorque',
          category: 'Sauvetage Aquatique (SSA)',
          missionFilter: ['nautique'],
          desc: 'Bateau pneumatique rigide (4 places) avec remorque routière fournie. Se tracte avec un véhicule à attelage. Qualifications : SSA & Permis Bateau.',
          cost: 13500,
          capacity: 4,
          requiresTrailer: true,
          hasTrailerIncluded: true,
          licenseRequired: 'B',
          licenseLabel: 'Permis Bateau & SSA',
          reqSkills: ['ssa', 'permis_bateau'],
          image: 'images/vehicles/ERS.png',
          speedKmH: 45,
          specialty: 'Sauvetage Aquatique'
        },
        {
          id: 'mps_moto',
          type: 'MPS',
          name: 'MPS - Moto de Premiers Secours',
          shortName: 'Moto MPS 2 places',
          category: 'Vecteur Rapide',
          missionFilter: ['secours', 'tout_terrain'],
          desc: 'Moto de premiers secours d’urgence pour circulation rapide en trafic dense. Permis Moto requis.',
          cost: 8500,
          capacity: 2,
          licenseRequired: 'Moto',
          licenseLabel: 'Permis Moto Requis 🏍️',
          image: 'images/vehicles/Moto.png',
          speedKmH: 110,
          specialty: 'Intervention Express Trafic Dense'
        },
        {
          id: 'quad_interv',
          type: 'QUAD',
          name: 'Quad Tout-Terrain d’Intervention',
          shortName: 'Quad Tout-Terrain + Remorque',
          category: 'Tout-Terrain Agile',
          missionFilter: ['tout_terrain'],
          desc: 'Quad d’intervention pour sentiers étroits avec remorque de transport fournie.',
          cost: 7200,
          capacity: 2,
          requiresTrailer: true,
          hasTrailerIncluded: true,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          image: 'images/vehicles/QUAD.png',
          speedKmH: 50,
          specialty: 'Évacuation Hors Pistes'
        },
        {
          id: 'velo_patrouille',
          type: 'VELO',
          name: 'Binôme Vélo / VTT Premiers Secours',
          shortName: 'Binôme VTT d’Urgence',
          category: 'Dispositif Mobile',
          missionFilter: ['secours', 'tout_terrain'],
          desc: 'Vélos équipés de sacoches de secours et DAE pour patrouilles douces sur berges et parcs.',
          cost: 2500,
          capacity: 2,
          licenseRequired: 'None',
          licenseLabel: 'Aucun Permis Requis 🚲',
          image: 'images/vehicles/VELO.png',
          speedKmH: 25,
          specialty: 'Patrouilles & Parcs'
        },
        {
          id: 'vahu_social',
          type: 'VAHU',
          name: 'VAHU - Véhicule d’Accueil & Hébergement d’Urgence',
          shortName: 'Fourgon VAHU Social',
          category: 'Action Sociale & Accueil',
          missionFilter: ['social'],
          desc: 'Aménagé pour maraudes, collations chaudes, distribution de couvertures et écoute sociale.',
          cost: 16000,
          capacity: 3,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          image: 'images/vehicles/VAHU.png',
          speedKmH: 70,
          specialty: 'Maraudes & Accueil d’Urgence'
        },
        {
          id: 'vcyn_chien',
          type: 'VCYN',
          name: 'VCYN - Véhicule Cynotechnique USAR',
          shortName: 'Fourgon VCYN Maître-Chien',
          category: 'USAR / Cyno',
          missionFilter: ['usar'],
          desc: 'Fourgon cynotechnique USAR avec 2 boxes canins intégrés pour chiens de sauvetage en décombres.',
          cost: 22500,
          capacity: 3,
          extraCapacityLabel: '+ 2 places chiens (box USAR)',
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          image: 'images/vehicles/VCYN.png',
          speedKmH: 80,
          specialty: 'Recherche & Sauvetage Cyno'
        },
        {
          id: 'rem_eclairage',
          type: 'REM',
          name: 'Remorque Lot PMA & Éclairage',
          shortName: 'Remorque PMA & Mât Éclairage',
          category: 'Remorque Spécialisée',
          missionFilter: ['logistique', 'tout_terrain'],
          desc: 'Remorque équipée d’un groupe électrogène haute puissance, tente gonflable et mâts d’éclairage nocturne.',
          cost: 4900,
          capacity: 0,
          requiresTrailer: true,
          hasTrailerIncluded: true,
          licenseRequired: 'B',
          licenseLabel: 'Permis B (Tractée avec attelage)',
          image: 'images/vehicles/REM.png',
          speedKmH: 70,
          specialty: 'Éclairage & PMA Mobile'
        }
      ]
    }
  ],

  // --- CATALOGUE DES VÉHICULES GÉNÉRAL (POUR COMPATIBILITÉ ET PARTIE 2 PAR TYPE) ---
  vehicleCatalog: [
    {
      type: 'VPSP',
      name: 'Véhicule de Premiers Secours à Personnes (VPSP)',
      category: 'Secours d’Urgence',
      missionFilter: ['secours'],
      desc: 'Cellule sanitaire grand volume (brancard, O2, DAE, matériel pédiatrique & d’urgence) aux normes EN 1789.',
      cost: 28500,
      capacity: 5,
      licenseRequired: 'B',
      licenseLabel: 'Permis B (+ P.VPSP)',
      image: 'images/vehicles/master3_vpsp.png',
      icon: '🚑',
      speedKmH: 85,
      specialty: 'Transport Sanitaire & SAMU 15'
    },
    {
      type: 'VL',
      name: 'Véhicule de Liaison (VL)',
      category: 'Reconnaissance Rapide',
      missionFilter: ['liaison'],
      desc: 'Véhicule léger avec rampe lumineuse, équipement radio et crochet d’attelage pour reconnaissance, commandement et remorquage.',
      cost: 11500,
      capacity: 4,
      hasTowHitch: true,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/VL.png',
      icon: '🚗',
      speedKmH: 100,
      specialty: 'Reconnaissance & Commandement'
    },
    {
      type: 'VLHR',
      name: 'Véhicule Léger Hors Route (VLHR 4x4)',
      category: 'Tout-Terrain',
      missionFilter: ['liaison', 'tout_terrain'],
      desc: '4x4 d’intervention tout-terrain pour zones accidentées, massifs forestiers, franchissement et remorquage lourd.',
      cost: 19500,
      capacity: 4,
      hasTowHitch: true,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/VLHR.png',
      icon: '🚙',
      speedKmH: 90,
      specialty: 'Accès Tout-Terrain & Crues'
    },
    {
      type: 'VTU',
      name: 'VTU - Fourgon Tout Usage (Logistique)',
      category: 'Logistique & Soutien',
      missionFilter: ['logistique'],
      desc: 'Fourgon utilitaire polyvalent pour transport de tentes, lits de camp, barnums et matériel de poste de secours ou de soutien. Équipé d’un crochet d’attelage.',
      cost: 17500,
      capacity: 3,
      hasTowHitch: true,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/master3_vtu_log.png',
      icon: '🚐',
      speedKmH: 75,
      specialty: 'Logistique & Soutien'
    },
    {
      type: 'VTP',
      name: 'Transport de Personnel (VTP)',
      category: 'Transport d’Équipes',
      missionFilter: ['logistique'],
      desc: 'Minibus 9 places pour l’acheminement des équipiers et relèves de secours sur les grands dispositifs ou renforts distants.',
      cost: 21000,
      capacity: 9,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/master3_vtp.png',
      icon: '🚌',
      speedKmH: 85,
      specialty: 'Acheminement de Renforts'
    },
    {
      type: 'PCM',
      name: 'Poste de Commandement Mobile (PCM)',
      category: 'Commandement Lourd',
      missionFilter: ['liaison'],
      desc: 'Centre opérationnel mobile avec baie informatique, transmission radio VHF/UHF, satellite et espace de coordination de crise. Poids Lourd > 3.5t.',
      cost: 45000,
      capacity: 3,
      licenseRequired: 'C',
      licenseLabel: 'Permis C (Poids Lourd) Requis 🚚',
      image: 'images/vehicles/PCM.png',
      icon: '🚍',
      speedKmH: 65,
      specialty: 'Coordination Grands Événements & NOVI'
    },
    {
      type: 'VAHU',
      name: 'VAHU - Véhicule d\'Accueil et d\'Hébergement d\'Urgence',
      category: 'Action Sociale & Accueil',
      missionFilter: ['social'],
      desc: 'Aménagé pour l’accueil des impliqués, maraudes sociales hivernales, distribution de repas chauds, kits d’hygiène et écoute sociale.',
      cost: 16000,
      capacity: 3,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/VAHU.png',
      icon: '☕',
      speedKmH: 70,
      specialty: 'Maraudes & Accueil d\'Urgence'
    },
    {
      type: 'FLIT',
      name: 'FLIT - Fourgon Lourd d\'Intervention Technique',
      category: 'Technique & Soutien Lourd',
      missionFilter: ['logistique', 'usar'],
      desc: 'Poids lourd d’intervention technique (type FPTL/FPTSR > 12t) équipé pour déploiement lourd de PMA, éclairage grande puissance, pompage et tronçonnage. Permis C requis.',
      cost: 95000,
      capacity: 3,
      licenseRequired: 'C',
      licenseLabel: 'Permis C (Poids Lourd) Requis 🚚',
      image: 'images/vehicles/FLIT.png',
      icon: '🏗️',
      speedKmH: 70,
      specialty: 'Postes Médicaux Avancés & Crises'
    },
    {
      type: 'VCYN',
      name: 'Véhicule Cynotechnique (VCYN)',
      category: 'USAR / Cyno',
      missionFilter: ['usar'],
      desc: 'Fourgon cynotechnique USAR adapté avec boxes intégrés pour 2 chiens de recherche et sauvetage en décombres et quête.',
      cost: 22500,
      capacity: 3,
      extraCapacityLabel: '+ 2 places chiens (box USAR)',
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/VCYN.png',
      icon: '🐕',
      speedKmH: 80,
      specialty: 'Recherche & Sauvetage USAR / Cyno'
    },
    {
      type: 'ERS',
      name: 'ERS - Embarcation de Reconnaissance et de Sauvetage',
      category: 'Sauvetage Aquatique (SSA)',
      missionFilter: ['nautique'],
      desc: 'Bateau de reconnaissance et sauvetage (4 places). Remorque routière fournie à l’achat. Qualifications : SSA & Conduite Bateau.',
      cost: 13500,
      capacity: 4,
      requiresTrailer: true,
      hasTrailerIncluded: true,
      licenseRequired: 'B',
      licenseLabel: 'Permis Bateau & SSA',
      reqSkills: ['ssa', 'permis_bateau'],
      image: 'images/vehicles/ERS.png',
      icon: '🚤',
      speedKmH: 45,
      specialty: 'Sauvetage Aquatique (SSA & Conduite Bateau)'
    },
    {
      type: 'MPS',
      name: 'MPS - Moto de Premiers Secours',
      category: 'Vecteur Rapide',
      missionFilter: ['secours', 'tout_terrain'],
      desc: 'Moto de premiers secours (2 places) pour trafic dense et premier bilan médical en temps record.',
      cost: 8500,
      capacity: 2,
      licenseRequired: 'Moto',
      licenseLabel: 'Permis Moto Requis 🏍️',
      image: 'images/vehicles/Moto.png',
      icon: '🏍️',
      speedKmH: 110,
      specialty: 'Intervention Express Trafic Dense'
    },
    {
      type: 'QUAD',
      name: 'Quad Tout-Terrain d’Intervention',
      category: 'Tout-Terrain Agile',
      missionFilter: ['tout_terrain'],
      desc: 'Quad tout-terrain d’intervention (2 places) pour sentiers étroits. Remorque routière fournie à l’achat.',
      cost: 7200,
      capacity: 2,
      requiresTrailer: true,
      hasTrailerIncluded: true,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/QUAD.png',
      icon: '🚜',
      speedKmH: 50,
      specialty: 'Évacuation Hors Pistes (Remorque Requise)'
    },
    {
      type: 'VTD',
      name: 'Véhicule Technique Déblaiement (USAR)',
      category: 'Sauvetage Déblaiement (USAR)',
      missionFilter: ['usar'],
      desc: 'Véhicule d’appui USAR transportant l’outillage lourd de déblaiement, étaiement et recherche sous décombres.',
      cost: 14000,
      capacity: 3,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/VTD.png',
      icon: '⛏️',
      speedKmH: 85,
      specialty: 'Sauvetage Déblaiement & USAR'
    },
    {
      type: 'VELO',
      name: 'Binôme Vélo / VTT Premiers Secours',
      category: 'Dispositif Mobile',
      missionFilter: ['secours', 'tout_terrain'],
      desc: 'Vélos équipés de sacoches d’urgence et DAE pour patrouilles mobiles sur courses à pied et berges.',
      cost: 2500,
      capacity: 2,
      licenseRequired: 'None',
      licenseLabel: 'Sans Permis 🚲',
      image: 'images/vehicles/VELO.png',
      icon: '🚲',
      speedKmH: 25,
      specialty: 'Patrouilles & Parcs'
    },
    {
      type: 'VST',
      name: 'Véhicule de Soutien Technique (VST)',
      category: 'Soutien & Énergie',
      missionFilter: ['logistique'],
      desc: 'Logistique électrique de pointe, compresseur et assistance mécanique pour opérations de longue durée.',
      cost: 19000,
      capacity: 2,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/VST.png',
      icon: '⚡',
      speedKmH: 70,
      specialty: 'Autonomie Opérationnelle'
    },
    {
      type: 'REM',
      name: 'Remorque Lot PMA & Éclairage',
      category: 'Remorque Spécialisée',
      missionFilter: ['logistique', 'tout_terrain'],
      desc: 'Remorque équipée d’un groupe électrogène haute puissance, tente gonflable et mâts d’éclairage nocturne. Se déplace tractée par un véhicule avec attelage.',
      cost: 4900,
      capacity: 0,
      requiresTrailer: true,
      hasTrailerIncluded: true,
      licenseRequired: 'B',
      licenseLabel: 'Permis B (Tractée avec attelage)',
      image: 'images/vehicles/REM.png',
      icon: '📦',
      speedKmH: 70,
      specialty: 'Éclairage & PMA Mobile'
    }
  ],

  // --- CATALOGUE DES AMÉNAGEMENTS DE LOCAUX ---
  roomUpgrades: {
    garage: [
      { level: 1, name: 'Garage Basique', desc: 'Capacité : 2 véhicules sous abri.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Hangar Agrandie & Borne Électrique', desc: 'Capacité : 4 véhicules. Rechargement rapide des batteries.', cost: 1500, bonus: '+2 places de parking' },
      { level: 3, name: 'Atelier Mécanique Intégré', desc: 'Capacité : 8 véhicules. -50% sur tous les frais d’entretien et révisions.', cost: 3200, bonus: '-50% coûts garage' }
    ],
    pharmacie: [
      { level: 1, name: 'Armoire Médicale Standard', desc: 'Stockage basique des consommables.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Compresseur Médical O2', desc: 'Permet de recharger l’Oxygène B5 à moitié prix directement à l’antenne.', cost: 1200, bonus: '-50% coût Oxygène' },
      { level: 3, name: 'Réserve Catastrophe & Lots PMA', desc: 'Capacité de stockage doublée pour le matériel d’urgence.', cost: 2400, bonus: 'Bonus +30% réputation NOVI' }
    ],
    foyer: [
      { level: 1, name: 'Salle de Repos Simple', desc: 'Quelques chaises et une table.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Foyer Convivial & Cafétéria', desc: 'Canapés confortables, cafetière. Récupération d’énergie +50% plus rapide.', cost: 800, bonus: '+50% régénération fatigue' },
      { level: 3, name: 'Dortoir de Garde Équipé', desc: 'Lits individuels pour les gardes SAMU de 12h de nuit.', cost: 1800, bonus: 'Moral permanent +15%' }
    ],
    formation: [
      { level: 1, name: 'Salle de Réunion', desc: 'Réunions d’antenne et briefings.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Espace Pédagogique PSC', desc: 'Mannequins connectés QCPR et projecteur. Permet d’accueillir les sessions PSC à l’antenne.', cost: 950, bonus: '+250 € / semaine (cours PSC)' },
      { level: 3, name: 'Centre Pédagogique Agréé', desc: 'Agrément préfectoral pour formations entreprises SST & PSC.', cost: 2100, bonus: '+650 € / semaine automatique' }
    ],
    radio: [
      { level: 1, name: 'Poste Radio VHF', desc: 'Talkies-walkies analogiques.', cost: 0, bonus: 'Standard' },
      { level: 2, name: 'Répéteur Antenne de Toit', desc: 'Couverture radio totale sur tout le département.', cost: 700, bonus: 'Départ véhicules accéléré' }
    ]
  },

  // --- CATALOGUE DES COMPÉTENCES INDIVIDUELLES DES BÉNÉVOLES ---
  skillsList: [
    // Conduite & Permis opérationnels
    { id: 'permis_vpsp', name: 'Conducteur VPSP (Permis VPSP)', icon: '🚑', xpRequired: 30, desc: 'Habilitation interne obligatoire autorisant la conduite du VPSP lors d’une prise en charge ou transport de victime.' },
    { id: 'permis_b', name: 'Permis B (Véhicules Légers)', icon: '🚗', xpRequired: 15, desc: 'Autorise la conduite des véhicules légers (VL, VTU, VTP, VAHU) et VPSP hors prise en charge de victime.' },
    { id: 'permis_c', name: 'Permis C (Poids Lourd > 3.5t)', icon: '🚚', xpRequired: 35, desc: 'Permis Poids Lourd obligatoire pour la conduite du FLIT, VALOG et gros porteurs d’intervention.' },
    { id: 'radio', name: 'Opérateur Radio & PC', icon: '📻', xpRequired: 20, desc: 'Maîtrise parfaite des procédures SAMU 15 et transmissions CODIS.' },

    // Rôles & Compétences Opérationnelles
    { id: 'ce', name: 'Chef d’Équipe (CE)', icon: '🎖️', xpRequired: 40, desc: 'Compétence de gestion d’équipage permettant d’occuper le rôle opérationnel de Chef d’Équipe en mission.' },
    { id: 'epi_incendie', name: 'Manipulation Extincteurs (EPI Incendie)', icon: '🧯', xpRequired: 20, desc: 'Compétence pratique d’extinction sur feux naissants et sécurité incendie.' },

    // Spécialités Nautique, USAR, Cyno
    { id: 'ssa', name: 'Surveillance & Sauvetage Aquatique (SSA)', icon: '🏊', xpRequired: 40, desc: 'Habilitation officielle SSA pour le sauvetage en eaux intérieures et zones inondées.' },
    { id: 'permis_bateau', name: 'Permis Bateau & Conduite ERS', icon: '🚤', xpRequired: 35, desc: 'Habilitation de pilotage et conduite de l’embarcation de reconnaissance et sauvetage (ERS).' },
    { id: 'usar', name: 'Sauvetage Déblaiement (USAR)', icon: '⛏️', xpRequired: 45, desc: 'Intervention sur effondrements, sécurisation, étaiement et recherche de victimes.' },
    { id: 'cyno', name: 'Conducteur Cynotechnique USAR', icon: '🐕', xpRequired: 50, reqSkill: 'usar', desc: 'Maître-chien de recherche et sauvetage en décombres et quête de disparus.' },

    // Filière Communication & Médias (Photos/Vidéos à 3 Niveaux d'Impact)
    { id: 'communication_1', name: 'Com N1 : Reporter d’Antenne', icon: '📸', xpRequired: 20, desc: 'Photos et vidéos de terrain valorisant les interventions (+10% dons et visibilité).' },
    { id: 'communication_2', name: 'Com N2 : Chargé de Communication', icon: '📱', xpRequired: 35, reqSkill: 'communication_1', desc: 'Gestion des réseaux sociaux et couverture médiatique (+25% candidatures et +20% dons).' },
    { id: 'communication_3', name: 'Com N3 : Responsable Communication', icon: '📢', xpRequired: 50, reqSkill: 'communication_2', desc: 'Campagnes d’appel aux dons et relations presse (+50% dons, +50% candidatures, boost réputation).' },

    // Filière Aide & Écoute Psychologique (AEP)
    { id: 'aep1', name: 'Aide & Écoute Psychologique 1 (AEP1)', icon: '🧠', xpRequired: 25, desc: 'Sensibilisation à l’AEP : posture d’écoute active, réconfort immédiat des impliqués et premiers secours émotionnels.' },
    { id: 'aep2', name: 'Aide & Écoute Psychologique 2 (AEP2)', icon: '🫂', xpRequired: 45, reqSkill: 'aep1', desc: 'Prise en charge approfondie : deuil traumatique, defusing post-mission et CAI en crise NOVI.' },

    // Filière Pédagogique & Formateurs (PIC F préalable distinct de Formateur PSC)
    { id: 'picf', name: 'PIC F (Pédagogie Initiale de Formateur)', icon: '📘', xpRequired: 30, desc: 'Tronc commun pédagogique obligatoire préalable aux brevets de formateur de sécurité civile.' },
    { id: 'formateur_psc', name: 'Formateur PSC (Secourisme Citoyen)', icon: '🎓', xpRequired: 35, reqSkill: 'picf', desc: 'Habilité à animer et certifier le grand public aux Gestes Qui Sauvent (GQS) et au PSC.' },
    { id: 'formateur_ps', name: 'Formateur PS (Premiers Secours)', icon: '🚑', xpRequired: 45, reqSkill: 'formateur_psc', desc: 'Habilité à former les équipiers secouristes opérationnels aux diplômes PSE1 et PSE2.' },
    { id: 'formateur_sst', name: 'Formateur SST (Secourisme Travail)', icon: '💼', xpRequired: 40, reqSkill: 'picf', desc: 'Habilitation INRS pour animer les formations de Sauveteur Secouriste du Travail en entreprises.' },
    { id: 'formateur_aep', name: 'Formateur AEP (Écoute Psycho)', icon: '🗣️', xpRequired: 45, reqSkill: 'aep2', desc: 'Habilité à former les bénévoles et partenaires aux modules d’Aide et Écoute Psychologique (AEP1 & AEP2).' },
    { id: 'cef', name: 'CEF - Concepteur / Encadrant Formation', icon: '📋', xpRequired: 50, desc: 'Ingénierie pédagogique, conception des référentiels et coordination des formateurs d’antenne.' },
    { id: 'formateur_de_formateur', name: 'Formateur de Formateurs (FdF)', icon: '👑', xpRequired: 65, desc: 'Niveau pédagogique suprême de la Protection Civile : forme et certifie tous les formateurs de l’association.' }
  ],

  // Calcul dynamique de l'impact de communication de l'antenne
  getCommunicationBonus(game) {
    if (!game || !game.volunteers) return { level: 0, donBonusPct: 0, candidateBonusPct: 0, repBonus: 0, label: 'Aucune com' };
    let maxLevel = 0;
    game.volunteers.forEach(v => {
      const skills = v.skills || [];
      if (skills.includes('communication_3')) maxLevel = Math.max(maxLevel, 3);
      else if (skills.includes('communication_2')) maxLevel = Math.max(maxLevel, 2);
      else if (skills.includes('communication_1') || skills.includes('communication')) maxLevel = Math.max(maxLevel, 1);
    });

    if (maxLevel === 3) {
      return { level: 3, donBonusPct: 50, candidateBonusPct: 50, repBonus: 20, label: 'Responsable Communication (Impact Maximum +50%)' };
    }
    if (maxLevel === 2) {
      return { level: 2, donBonusPct: 20, candidateBonusPct: 25, repBonus: 10, label: 'Chargé de Communication (+25% Candidatures / +20% Dons)' };
    }
    if (maxLevel === 1) {
      return { level: 1, donBonusPct: 10, candidateBonusPct: 10, repBonus: 5, label: 'Reporter d’Antenne (+10% Visibilité & Dons)' };
    }
    return { level: 0, donBonusPct: 0, candidateBonusPct: 0, repBonus: 0, label: 'Aucun bénévole en communication' };
  },

  // 1. Initialisation de l'état étendu avec tâches progressives selon le stade de l'antenne
  injectAdvancedState(game) {
    if (!game.rewards) {
      game.rewards = {
        streakDays: 1,
        tier: 1,
        lastDailyClaimDay: null,
        dailyTasks: this.getTasksForTier(1, false),
        weeklyTasks: this.getTasksForTier(1, true)
      };
    } else {
      if (!game.rewards.tier) game.rewards.tier = this.detectAntennaTier(game);
      const hasAntenna = game.stations && game.stations.length > 0;
      if (!hasAntenna) {
        game.rewards.tier = 1;
        game.rewards.dailyTasks = this.getTasksForTier(1, false);
        game.rewards.weeklyTasks = this.getTasksForTier(1, true);
        if (game.grants) game.grants.totalVolunteerHours = 0;
      }
    }

    // Assurer que les stations possèdent des pièces aménageables
    if (game.stations && game.stations.length > 0) {
      game.stations.forEach(st => {
        if (!st.rooms) {
          st.rooms = {
            garage: 1,
            pharmacie: 1,
            foyer: 1,
            formation: 1,
            radio: 1
          };
        }
      });
    }

    // Rétrocompatibilité et assainissement des compétences sur les bénévoles existants
    if (game.volunteers) {
      game.volunteers.forEach(v => {
        if (!v.skills) v.skills = ['radio'];
        // Remplacement de l'ancien 'pilotage' par 'permis_vpsp' et 'permis_b'
        if (v.skills.includes('pilotage')) {
          v.skills = v.skills.filter(s => s !== 'pilotage');
          if (!v.skills.includes('permis_vpsp')) v.skills.push('permis_vpsp');
          if (!v.skills.includes('permis_b')) v.skills.push('permis_b');
        }
        // Migration communication vers communication_1
        if (v.skills.includes('communication') && !v.skills.some(s => s.startsWith('communication_'))) {
          v.skills.push('communication_1');
        }
        // Compétence Chef d'équipe si CE
        if ((v.rank === 'CE' || v.role === 'Chef d\'équipe') && !v.skills.includes('ce')) {
          v.skills.push('ce');
        }
        // Habilitation Permis VPSP pour les cadres opérationnels historiques
        if (v.rank === 'PSE2' || v.rank === 'CE' || v.rank === 'CD') {
          if (!v.skills.includes('permis_b')) v.skills.push('permis_b');
        }
      });
    }

    // Bureau d'antenne
    if (!game.bureau) {
      game.bureau = {
        presidentId: null,
        chefOpId: null,
        tresorierId: null
      };
    }

    // Manœuvres fédérales planifiées
    if (!game.manoeuvres) {
      game.manoeuvres = [
        {
          id: 'man-1',
          title: 'Exercice Fédéral : Simulation Inondation & Crues Majeures',
          type: 'CRUE',
          allianceTag: 'UFSC',
          dateDesc: 'Ce Samedi à 09h00',
          desc: 'Entraînement conjoint inter-antennes de sauvetage en milieu inondé et ouverture de gymnase d’accueil (CAI).',
          participantsCount: 3,
          rewardMoney: 1800,
          rewardXp: 50,
          status: 'open'
        },
        {
          id: 'man-2',
          title: 'Manœuvre Cadres : Poste de Commandement NOVI Stade',
          type: 'NOVI',
          allianceTag: 'UFSC',
          dateDesc: 'Dimanche prochain',
          desc: 'Simulation d’afflux massif de blessés avec déploiement simultané de plusieurs VPC et ambulances VPSP.',
          participantsCount: 2,
          rewardMoney: 2200,
          rewardXp: 75,
          status: 'open'
        }
      ];
    }
  },

  // 2. Gestion des Récompenses Quotidiennes
  claimDailyStreak(game) {
    if (!game.stations || game.stations.length === 0) {
      game.showToast('Antenne Requise', 'Implantez d’abord votre antenne sur la carte pour recevoir votre dotation fédérale !', 'orange');
      return;
    }

    const today = game.clock.day;
    if (game.rewards.lastDailyClaimDay === today) {
      game.showToast('Déjà réclamé', 'Vous avez déjà reçu votre dotation quotidienne pour aujourd’hui ! Revenez demain.', 'blue');
      return;
    }

    const streak = Math.min(7, (game.rewards.streakDays || 1));
    const streakRewards = [
      { money: 300, desc: '+300 € & 2 bouteilles d’Oxygène B5 offertes', o2: 2 },
      { money: 450, desc: '+450 € & 10 points d’Agrément Préfectoral', rep: 10 },
      { money: 600, desc: '+600 € & 2 paires d’électrodes DAE', dae: 2 },
      { money: 750, desc: '+750 € & +60 abonnés sur les réseaux', followers: 60 },
      { money: 900, desc: '+900 € & 4 trousses de soins complètes', kits: 4 },
      { money: 1200, desc: '+1 200 € & dotation équipement offerte', kits: 6 },
      { money: 2500, desc: 'GRAND BONUS JOUR 7 : +2 500 € et reconnaissance fédérale !', rep: 30 }
    ];

    const pick = streakRewards[streak - 1];
    game.resources.money += pick.money;
    if (pick.o2 && game.logistics) game.logistics.oxygenBottles += pick.o2;
    if (pick.dae && game.logistics) game.logistics.aedPads += pick.dae;
    if (pick.kits && game.logistics) game.logistics.woundKits += pick.kits;
    if (pick.followers) game.resources.followers += pick.followers;
    if (pick.rep) game.resources.reputationScore += pick.rep;

    game.rewards.lastDailyClaimDay = today;
    game.rewards.streakDays = streak >= 7 ? 1 : streak + 1;

    game.updateStatsUI();
    game.saveGame(true);
    game.showToast('Récompense Quotidienne Débloquée !', pick.desc, 'green');
    game.openModule('recompenses');
  },

  // Détection du palier de développement de l'antenne (Tier 1: Lancement, Tier 2: Développement, Tier 3: Envergure)
  detectAntennaTier(game) {
    if (!game.stations || game.stations.length === 0) return 1;
    const vehCount = (game.vehicles || []).length;
    const convCount = (game.sncfConvention?.signed ? 1 : 0) + (game.cumpConvention?.signed ? 1 : 0) + (game.sdisGarde?.active ? 1 : 0);
    const completedMissions = (game.missions || []).filter(m => m.status === 'completed').length;
    const totalVolunteers = (game.volunteers || []).length;

    // Palier 1 (Lancement d'antenne) : pas de convention AASC, pas de véhicule, ou moins de 2 missions
    if (!game.aascConvention?.signed || vehCount === 0 || completedMissions < 2) {
      return 1;
    }
    // Palier 3 (Grande Envergure / Rayonnement) : >= 8 missions terminées, >= 2 véhicules, >= 8 secouristes
    if (completedMissions >= 8 && vehCount >= 2 && totalVolunteers >= 8) {
      return 3;
    }
    // Palier 2 (Développement / Consolidation)
    return 2;
  },

  getTasksForTier(tier, isWeekly = false) {
    if (isWeekly) {
      if (tier === 1) {
        return [
          { id: 'w-task-starter-recrut', title: 'Publier 1 offre de recrutement (Service Civique ou Salarié)', goal: 1, current: 0, reward: 500, done: false },
          { id: 'w-task-starter-locaux', title: 'Aménager le local de secours sur le Plan 2D', goal: 1, current: 0, reward: 750, done: false }
        ];
      } else if (tier === 2) {
        return [
          { id: 'w-task-mid-hours', title: 'Cumuler 15h de bénévolat d’intérêt public', goal: 15, current: 0, reward: 1500, done: false },
          { id: 'w-task-mid-qualif', title: 'Promouvoir ou qualifier 1 bénévole (PSE2, CE, permis)', goal: 1, current: 0, reward: 900, done: false }
        ];
      } else {
        return [
          { id: 'w-task-high-hours', title: 'Cumuler 40h de missions de sécurité civile', goal: 40, current: 0, reward: 3500, done: false },
          { id: 'w-task-high-fleet', title: 'Maintenir la flotte (≥ 3 véhicules) 100% opérationnelle', goal: 1, current: 0, reward: 2500, done: false }
        ];
      }
    } else {
      if (tier === 1) {
        return [
          { id: 'task-starter-aasc', title: 'Souscrire la Convention Préfectorale d’AASC', goal: 1, current: 0, reward: 800, done: false },
          { id: 'task-starter-veh', title: 'Acquérir votre 1er véhicule opérationnel (VPSP ou VTU)', goal: 1, current: 0, reward: 600, done: false },
          { id: 'task-starter-mat', title: 'Équiper l’antenne en matériel de secours (Boutique)', goal: 5, current: 0, reward: 400, done: false }
        ];
      } else if (tier === 2) {
        return [
          { id: 'task-mid-missions', title: 'Assurer 2 départs en mission (DPS ou Secours)', goal: 2, current: 0, reward: 700, done: false },
          { id: 'task-mid-devis', title: 'Valider 1 devis conforme au barème fédéral', goal: 1, current: 0, reward: 500, done: false },
          { id: 'task-mid-flotte', title: 'Maintenir la flotte révisée & désinfectée', goal: 1, current: 0, reward: 450, done: false }
        ];
      } else {
        return [
          { id: 'task-high-missions', title: 'Assurer 4 missions de secours ou réquisitions préfectorales', goal: 4, current: 0, reward: 1800, done: false },
          { id: 'task-high-garde', title: 'Armer une garde SDIS ou astreinte CUMP SAMU', goal: 1, current: 0, reward: 1400, done: false },
          { id: 'task-high-pref', title: 'Accomplir 1 réquisition préfectorale AASC ou Plan d’Urgence', goal: 1, current: 0, reward: 2000, done: false }
        ];
      }
    }
  },

  syncAdaptiveTasks(game) {
    if (!game.rewards) return;
    const currentTier = this.detectAntennaTier(game);
    const today = game.clock ? game.clock.day : new Date().getDate();
    const curWeek = (window.ProtecMultiplayer && window.ProtecMultiplayer.getWeekKey) ? window.ProtecMultiplayer.getWeekKey(game.clock) : 'W';

    // 1. Initialisation des clés temporelles si absentes
    if (game.rewards.lastDailyTaskResetDay === undefined) {
      game.rewards.lastDailyTaskResetDay = today;
    }
    if (game.rewards.lastWeeklyTaskResetWeek === undefined) {
      game.rewards.lastWeeklyTaskResetWeek = curWeek;
    }

    // 2. Renouvellement lors d'un nouveau jour calendaire in-game
    if (game.rewards.lastDailyTaskResetDay !== today) {
      game.rewards.lastDailyTaskResetDay = today;
      const t = game.rewards.tier || currentTier;
      game.rewards.dailyTasks = this.getTasksForTier(t, false);
    }

    // 3. Renouvellement lors d'une nouvelle semaine
    if (game.rewards.lastWeeklyTaskResetWeek !== curWeek) {
      game.rewards.lastWeeklyTaskResetWeek = curWeek;
      const t = game.rewards.tier || currentTier;
      game.rewards.weeklyTasks = this.getTasksForTier(t, true);
    }

    // 4. Passage de palier (uniquement si toutes les tâches en cours sont terminées ou si la liste est vide)
    if (!game.rewards.dailyTasks || game.rewards.dailyTasks.length === 0) {
      game.rewards.tier = currentTier;
      game.rewards.dailyTasks = this.getTasksForTier(currentTier, false);
      game.rewards.weeklyTasks = this.getTasksForTier(currentTier, true);
    } else if (game.rewards.tier !== currentTier && game.rewards.dailyTasks.every(t => t.done)) {
      game.rewards.tier = currentTier;
      game.rewards.dailyTasks = this.getTasksForTier(currentTier, false);
      game.rewards.weeklyTasks = this.getTasksForTier(currentTier, true);
    }
  },

  // Calcul dynamique de la progression réelle des objectifs
  updateTasksProgress(game) {
    if (!game.rewards) return;

    const hasAntenna = game.stations && game.stations.length > 0;
    if (!hasAntenna) {
      game.rewards.tier = 1;
      (game.rewards.dailyTasks || []).forEach(t => { t.current = 0; t.done = false; });
      (game.rewards.weeklyTasks || []).forEach(w => { w.current = 0; w.done = false; });
      if (game.grants) game.grants.totalVolunteerHours = 0;
      return;
    }

    this.syncAdaptiveTasks(game);

    // Tâches quotidiennes
    (game.rewards.dailyTasks || []).forEach(t => {
      // Si la tâche a déjà été réclamée, on préserve strictement son état
      if (t.done) {
        t.current = t.goal;
        return;
      }

      // 1. Tâches de démarrage (Tier 1)
      if (t.id === 'task-starter-aasc') {
        t.current = (game.aascConvention?.signed) ? 1 : 0;
      } else if (t.id === 'task-starter-veh') {
        t.current = Math.min(t.goal, (game.vehicles || []).length);
      } else if (t.id === 'task-starter-mat') {
        const st = game.stations[0];
        const stockItems = Object.values(st?.stock || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
        const logiItems = game.logistics ? ((game.logistics.oxygenBottles || 0) + (game.logistics.aedPads || 0) + (game.logistics.woundKits || 0) + (game.logistics.cervicalCollars || 0)) : 0;
        t.current = Math.min(t.goal, Math.max(stockItems, logiItems));
      } else if (t.id === 'task-starter-conv') {
        const convSigned = (game.sncfConvention?.signed || game.cumpConvention?.signed || (game.sdisGarde?.active)) ? 1 : 0;
        t.current = convSigned;
      }
      // 2. Tâches de développement (Tier 2 & génériques)
      else if (t.id === 'task-mid-missions' || t.id === 'task-1') {
        const activeOrDone = (game.missions || []).filter(m => ['ongoing', 'completed'].includes(m.status)).length;
        t.current = Math.min(t.goal, (game.missionsLaunchedCount || 0) + activeOrDone);
      } else if (t.id === 'task-mid-devis' || t.id === 'task-2') {
        const signedCount = (game.devis || []).filter(d => d.status === 'signed').length;
        t.current = Math.min(t.goal, signedCount);
      } else if (t.id === 'task-mid-flotte' || t.id === 'task-3') {
        const allVehs = (game.stations || []).flatMap(s => s.vehicles || []);
        if (!allVehs || allVehs.length === 0) {
          t.current = 0;
        } else {
          const cleanVehs = allVehs.filter(v => !v.isBrokenDown && !v.needsRearming && (v.mechanical || 100) >= 60);
          t.current = (cleanVehs.length === allVehs.length) ? 1 : 0;
        }
      }
      // 3. Tâches de grande envergure (Tier 3)
      else if (t.id === 'task-high-missions') {
        const completedCount = (game.missions || []).filter(m => m.status === 'completed').length;
        t.current = Math.min(t.goal, completedCount);
      } else if (t.id === 'task-high-garde') {
        const sdisOrCump = ((game.sdisGarde && game.sdisGarde.active) || (game.cumpConvention && game.cumpConvention.signed)) ? 1 : 0;
        t.current = sdisOrCump;
      } else if (t.id === 'task-high-pref') {
        const prefMissions = (game.missions || []).filter(m => m.type === 'meteo' && m.status === 'completed').length;
        t.current = Math.min(t.goal, prefMissions);
      }
    });

    // Défis hebdomadaires
    (game.rewards.weeklyTasks || []).forEach(w => {
      // Si le défi a déjà été réclamé, on préserve strictement son état
      if (w.done) {
        w.current = w.goal;
        return;
      }

      // 1. Défis de démarrage (Tier 1)
      if (w.id === 'w-task-starter-recrut') {
        const hasOffer = ((game.jobOffers && game.jobOffers.length > 0) || (game.candidatures && game.candidatures.length > 0)) ? 1 : 0;
        w.current = hasOffer;
      } else if (w.id === 'w-task-starter-locaux') {
        const arch = game.stations?.[0]?.premises?.architecture;
        const hasLayout = (arch && ((arch.furniture && arch.furniture.length > 0) || (arch.rooms && arch.rooms.some(r => r.type !== 'libre')))) ? 1 : 0;
        w.current = hasLayout;
      }
      // 2. Défis de développement & envergure
      else if (w.id === 'w-task-mid-hours' || w.id === 'w-task-high-hours' || w.id === 'w-task-1') {
        const hours = Math.max(0, game.grants?.totalVolunteerHours || 0);
        w.current = Math.min(w.goal, hours);
      } else if (w.id === 'w-task-mid-qualif' || w.id === 'w-task-2') {
        const qualifiedCount = (game.volunteers || []).filter(v => (v.promotionsCount && v.promotionsCount > 0) || (v.acquiredSkills && v.acquiredSkills.length > 0) || (v.trainingHistory && v.trainingHistory.length > 0) || v.rank === 'CE' || v.rank === 'PSE2').length;
        w.current = Math.min(w.goal, qualifiedCount);
      } else if (w.id === 'w-task-high-fleet') {
        const vehs = game.vehicles || [];
        const isFleetReady = vehs.length >= 3 && vehs.every(v => !v.isBrokenDown && !v.needsRearming);
        w.current = isFleetReady ? 1 : 0;
      }
    });
  },

  claimTaskReward(game, taskId, isWeekly = false) {
    if (!game.stations || game.stations.length === 0) {
      game.showToast('Antenne Requise', 'Implantez d’abord votre antenne sur la carte avant de valider des objectifs !', 'orange');
      return;
    }
    this.updateTasksProgress(game);
    const list = isWeekly ? game.rewards.weeklyTasks : game.rewards.dailyTasks;
    const task = list.find(t => t.id === taskId);
    if (!task) return;

    if (task.done) {
      game.showToast('Déjà Récupéré', 'Cette récompense a déjà été obtenue.', 'blue');
      return;
    }

    if (task.current < task.goal) {
      game.showToast('Objectif Non Rempli', `Progression actuelle : ${task.current || 0} / ${task.goal}. Vous devez d’abord accomplir cet objectif !`, 'orange');
      return;
    }

    task.done = true;
    task.current = task.goal;
    game.resources.money += task.reward;
    const repGained = task.reward >= 1000 ? 50 : (task.reward >= 500 ? 30 : 15);
    game.resources.reputationScore += repGained;

    game.updateStatsUI();
    game.saveGame(true);
    game.showToast('Objectif Accompli !', `+${task.reward} € et +${repGained} réputation versés à l’antenne !`, 'green');
    game.openModule('recompenses');
  },

  // 3. Achat et Évolution des Pièces du Local
  upgradeRoom(game, stationId, roomKey) {
    const st = game.stations.find(s => s.id === stationId);
    if (!st) return;
    if (!st.rooms) st.rooms = { garage: 1, pharmacie: 1, foyer: 1, formation: 1, radio: 1 };

    const currentLevel = st.rooms[roomKey] || 1;
    const upgrades = this.roomUpgrades[roomKey];
    const nextUpgrade = upgrades.find(u => u.level === currentLevel + 1);

    if (!nextUpgrade) {
      game.showToast('Niveau Maximum', 'Cette pièce a déjà atteint son niveau d’aménagement optimal.', 'blue');
      return;
    }

    if (game.resources.money < nextUpgrade.cost) {
      game.showToast('Trésorerie insuffisante', `L’aménagement requiert ${nextUpgrade.cost} €.`, 'orange');
      return;
    }

    game.resources.money -= nextUpgrade.cost;
    st.rooms[roomKey] = nextUpgrade.level;
    game.resources.reputationScore += 25;

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Local Amélioré !', `« ${nextUpgrade.name} » est opérationnel (${nextUpgrade.bonus}) !`, 'green');
    game.openModule('base');
  },

  // 4. Commande d'un nouveau véhicule spécialisé avec configuration / variante
  buySpecializedVehicle(game, stationId, vehicleType, variantOptions = null) {
    const cat = this.vehicleCatalog.find(v => v.type === vehicleType) || {};
    const finalCost = (variantOptions && variantOptions.cost !== undefined) ? variantOptions.cost : (cat.cost || 20000);

    if (game.resources.money < finalCost) {
      game.showToast('Fonds insuffisants', `L’acquisition du véhicule requiert ${finalCost.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    const station = game.stations.find(s => s.id === stationId) || game.stations[0];
    if (!station) return;

    // Vérifier la capacité du garage
    const garageLevel = station.rooms?.garage || 1;
    const maxSlots = garageLevel === 1 ? 2 : (garageLevel === 2 ? 4 : 8);
    if (station.vehicles.length >= maxSlots) {
      game.showToast('Garage saturé !', `Votre garage est plein (${station.vehicles.length}/${maxSlots}). Agrandissez le hangar dans l'aménagement du local !`, 'orange');
      return;
    }

    game.resources.money -= finalCost;
    const vehId = `${(vehicleType || 'vpsp').toLowerCase()}-${Date.now()}`;
    const callsign = typeof game.generateVehicleCallsign === 'function' ? game.generateVehicleCallsign(vehicleType, station.id, station) : `${vehicleType} 0${station.vehicles.length + 1} ${(station.city || 'ANTENNE').toUpperCase()}`;
    
    const newVeh = {
      id: vehId,
      name: callsign,
      type: vehicleType,
      label: variantOptions?.name || cat.name || vehicleType,
      model: variantOptions?.name || variantOptions?.model || `${cat.name || vehicleType} (Neuf)`,
      variantId: variantOptions?.id || null,
      serigraphie: variantOptions?.serigraphieLabel || variantOptions?.serigraphieKey || null,
      year: 2024,
      mileage: 8500,
      capacity: variantOptions?.capacity || cat.capacity || 4,
      seatsCount: variantOptions?.capacity || cat.capacity || 4,
      extraCapacityLabel: variantOptions?.extraCapacityLabel || cat.extraCapacityLabel || null,
      licenseRequired: variantOptions?.licenseRequired || cat.licenseRequired || (['FLIT', 'VALOG', 'PCM'].includes(vehicleType) ? 'C' : 'B'),
      status: 'dispo',
      fuel: 100,
      mechanical: 100,
      ctStatus: 'valide',
      ctExpiryTimestamp: Date.now() + (365 * 24 * 3600 * 1000),
      insuranceStatus: 'assure',
      insuranceMonthlyCost: vehicleType === 'VPSP' ? 95 : (vehicleType === 'VTU' ? 75 : 55),
      disinfectionNeeded: false,
      stationId: station.id,
      specialty: variantOptions?.specialty || cat.specialty || '',
      icon: cat.icon || '🚐',
      image: variantOptions?.image || cat.image || `images/vehicles/${vehicleType}.png`,
      hasTowHitch: Boolean(variantOptions?.hasTowHitch !== undefined ? variantOptions.hasTowHitch : (cat.hasTowHitch || false)),
      installedOptions: Array.isArray(variantOptions?.installedOptions) ? variantOptions.installedOptions : [],
      requiresTrailer: cat.requiresTrailer || false,
      reqSkills: cat.reqSkills || []
    };

    game.vehicles.push(newVeh);
    station.vehicles.push(vehId);

    // Enregistrement dans le Grand Livre comptable
    if (window.ProtecFinances && typeof window.ProtecFinances.recordTransaction === 'function') {
      window.ProtecFinances.recordTransaction(
        game,
        -finalCost,
        `Acquisition Véhicule : ${newVeh.name} (${newVeh.model})`,
        'vehicule',
        `ACHAT-${vehId}`,
        'Centrale d’Achat Réseau'
      );
    }

    game.closeModal();
    game.updateStatsUI();
    game.renderStations();
    game.saveGame();
    game.syncPlayerToServer();
    game.showToast('Véhicule en Dotation !', `${cat.icon || '🚑'} ${newVeh.name} (${newVeh.model}) est stationné au garage de l’antenne !`, 'green');
    if (typeof game.openStationDetails === 'function') {
      game.openStationDetails(station.id);
    }
  },

  // 5. Arbre de compétences des bénévoles
  learnSkill(game, volunteerId, skillId) {
    const v = game.volunteers.find(vol => vol.id === volunteerId);
    const skill = this.skillsList.find(s => s.id === skillId);
    if (!v || !skill) return;

    if (!v.skills) v.skills = [];
    if (v.skills.includes(skillId)) return;

    // Vérification du prérequis
    if (skill.reqSkill && !v.skills.includes(skill.reqSkill)) {
      const prereq = this.skillsList.find(s => s.id === skill.reqSkill);
      game.showToast('Prérequis Manquant', `${v.name} doit d’abord valider la compétence « ${prereq?.name || skill.reqSkill} ».`, 'orange');
      return;
    }

    if ((v.exp || 0) < skill.xpRequired) {
      game.showToast('Expérience insuffisante', `${v.name} a besoin de ${skill.xpRequired} XP pour valider cette qualification (XP actuel : ${v.exp || 0}).`, 'orange');
      return;
    }

    v.exp -= skill.xpRequired;
    v.skills.push(skillId);
    if (skillId.startsWith('formateur_') || skillId === 'formateur_de_formateur' || skillId === 'cef') {
      v.isTrainer = true;
    }
    v.moral = Math.min(100, (v.moral || 80) + 15);

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Qualification Validée !', `${v.name} a obtenu la qualification « ${skill.name} » !`, 'green');
    game.openModule('competences');
  },

  // Nomination au Bureau de l'Antenne
  nominateBureauMember(game, role, volunteerId) {
    const v = game.volunteers.find(vol => vol.id === volunteerId);
    if (!v) return;

    if (role === 'president') game.bureau.presidentId = v.id;
    if (role === 'chefOp') game.bureau.chefOpId = v.id;
    if (role === 'tresorier') game.bureau.tresorierId = v.id;

    game.saveGame();
    game.showToast('Bureau d’Antenne', `${v.name} est nommé(e) au poste de ${role.toUpperCase()} !`, 'green');
    game.openModule('recrutement');
  },

  // 6. Participation à une manœuvre fédérale
  joinManoeuvre(game, manoeuvreId) {
    const man = game.manoeuvres.find(m => m.id === manoeuvreId);
    if (!man) return;

    if (man.status === 'joined') {
      game.showToast('Déjà inscrit', 'Votre antenne est déjà inscrite dans le détachement de cette manœuvre.', 'blue');
      return;
    }

    const availableVols = game.volunteers.filter(v => v.status === 'dispo');
    if (availableVols.length < 2) {
      game.showToast('Effectif insuffisant', 'Il vous faut au moins 2 secouristes disponibles pour participer à la manœuvre.', 'orange');
      return;
    }

    man.status = 'joined';
    man.participantsCount += 1;

    // Gain d'XP immédiat et récompense fédérale
    game.resources.money += man.rewardMoney;
    availableVols.slice(0, 4).forEach(v => {
      v.exp = (v.exp || 0) + man.rewardXp;
      v.moral = 100;
      v.recycledYear = game.clock.year;
    });

    game.updateStatsUI();
    game.saveGame();
    game.showToast('Manœuvre Fédérale Validée !', `Détachement engagé avec succès ! (+${man.rewardMoney} € & +${man.rewardXp} XP par participant).`, 'green');
    game.openModule('alliance');
  },

  // Chargement dynamique du catalogue personnalisé de véhicules configuré par l'admin
  loadCustomCatalog() {
    try {
      const stored = localStorage.getItem('protec_custom_vehicle_catalog');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.vehicleCatalog = parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur chargement catalogue personnalisé véhicules:', e);
    }
  }
};

// Initialisation immédiate du catalogue personnalisé s'il existe
try {
  if (window.ProtecAdvanced && typeof window.ProtecAdvanced.loadCustomCatalog === 'function') {
    window.ProtecAdvanced.loadCustomCatalog();
  }
} catch (e) {}

