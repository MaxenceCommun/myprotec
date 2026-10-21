/**
 * PROTEC LIVE - SYSTÈMES AVANCÉS :
 * 1. Récompenses quotidiennes & Défis hebdomadaires
 * 2. Aménagement intérieur & Évolution du local de l'antenne (Pièces & Améliorations)
 * 3. Véhicules spécialisés (VPSP, VTU, VLM, VPC, Canot Nautique BLS, Quad/VTT)
 * 4. Arbre de compétences des bénévoles & Bureau d'antenne
 * 5. Manœuvres multijoueurs & Exercices inter-alliances
 */

window.ProtecAdvanced = {
  // --- FONCTIONS OPÉRATIONNELLES DES VÉHICULES (PS, TP, TU, LOG, HR, CMD, POP, etc.) ---
  vehicleFunctions: {
    PS: {
      code: 'PS',
      label: 'Premiers Secours',
      shortDesc: 'Secours d’urgence aux personnes & évacuation sanitaire',
      icon: 'heart-pulse',
      badgeClass: 'bg-red-100 text-red-800 border-red-300'
    },
    TP: {
      code: 'TP',
      label: 'Transport de Personnels',
      shortDesc: 'Acheminement et relève d’équipes',
      icon: 'users',
      badgeClass: 'bg-sky-100 text-sky-800 border-sky-300'
    },
    TU: {
      code: 'TU',
      label: 'Tout Usage',
      shortDesc: 'Véhicule utilitaire polyvalent',
      icon: 'truck',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    },
    LOG: {
      code: 'LOG',
      label: 'Logistique',
      shortDesc: 'Transport de matériel, tentes et lots PMA',
      icon: 'package',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    HR: {
      code: 'HR',
      label: 'Hors Route (4x4)',
      shortDesc: 'Franchissement tout-terrain et zones isolées',
      icon: 'mountain',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    CMD: {
      code: 'CMD',
      label: 'Commandement',
      shortDesc: 'Poste de commandement, transmissions & coordination',
      icon: 'radio',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    LIAISON: {
      code: 'LIAISON',
      label: 'Liaison',
      shortDesc: 'Reconnaissance rapide et déplacements cadres',
      icon: 'navigation',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    POP: {
      code: 'POP',
      label: 'Soutien aux Populations',
      shortDesc: 'Assistance sinistrés, hébergement et ravitaillement',
      icon: 'home',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
    },
    SOC: {
      code: 'SOC',
      label: 'Action Sociale',
      shortDesc: 'Maraudes, accueil d’urgence et écoute',
      icon: 'coffee',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300'
    },
    TECH: {
      code: 'TECH',
      label: 'Technique',
      shortDesc: 'Énergie, éclairage, pompage & outillage spécialisé',
      icon: 'wrench',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-300'
    },
    CYNO: {
      code: 'CYNO',
      label: 'Cynotechnique',
      shortDesc: 'Recherche et sauvetage avec équipes canines',
      icon: 'paw-print',
      badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    SSA: {
      code: 'SSA',
      label: 'Sauvetage Aquatique',
      shortDesc: 'Sauvetage et surveillance nautique',
      icon: 'life-buoy',
      badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300'
    }
  },

  // --- CATALOGUE DES VÉHICULES ÉTENDU ---
  // --- CATALOGUE DES MODÈLES & CHÂSSIS (PARTIE 1 DU MAGASIN : RECHERCHE PAR MODÈLE & CONFIGURATION) ---
  chassisModels: [
    {
      id: 'master3',
      name: 'Renault Master III',
      brand: 'Renault Trucks',
      desc: 'Le grand fourgon utilitaire de référence de la Protection Civile. Châssis éprouvé, disponible en VPSP profilé, grand volume cube, minibus 9 places ou logistique tôlée.',
      icon: '🚐',
      defaultVariantId: 'master3_vpsp',
      variants: [
        {
          id: 'master3_vpsp',
          functions: ["PS"],
          type: 'VPSP',
          name: 'Renault Master III - VPSP Cellule Standard Profilée',
          shortName: 'VPSP Profilé',
          category: 'Secours d’Urgence',
          missionFilter: ['secours'],
          desc: 'Ambulance de secours pour soigner et transporter les victimes vers l’hôpital.',
          cost: 28500,
          capacity: 5,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 85,
          hasTowHitch: false,
          image: 'images/vehicles/master3_vpsp.png',
          specialty: 'Urgences Réflexes & SAMU 15'
        },
        {
          id: 'master3_vpsp_cube',
          functions: ["PS"],
          type: 'VPSP',
          name: 'Renault Master III - VPSP Grande Cellule Cube Sanitaire',
          shortName: 'VPSP Grande Cellule Cube',
          category: 'Secours d’Urgence',
          missionFilter: ['secours'],
          desc: 'Grande cellule cube sanitaire offrant un espace de soins maximal pour réanimation.',
          cost: 32000,
          capacity: 5,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 80,
          hasTowHitch: false,
          image: 'images/vehicles/master3_vpsp_cube.png',
          specialty: 'Soins Intensifs & Cellule Grand Volume'
        },
        {
          id: 'master3_vtp',
          functions: ["TP"],
          type: 'VTP',
          name: 'Renault Master III - VTP Transport de Personnel (9 places)',
          shortName: 'Minibus VTP 9 places',
          category: 'Transport d’Équipes',
          missionFilter: ['logistique'],
          desc: 'Minibus 9 places pour acheminer rapidement une équipe de bénévoles.',
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
          functions: ["TU","LOG"],
          type: 'VTU',
          name: 'Renault Master III - VTU Fourgon Logistique',
          shortName: 'VTU Tôlé Logistique',
          category: 'Logistique & Événementiel',
          missionFilter: ['logistique'],
          serigraphieKey: 'logistique',
          serigraphieLabel: 'Logistique',
          desc: 'Fourgon tôlé pour transporter le matériel lourd, les tentes et les lots de secours.',
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
          functions: ["TU","LOG","POP"],
          type: 'VTU',
          name: 'Renault Master III - VTU Soutien aux Populations',
          shortName: 'VTU Soutien Populations',
          category: 'Soutien & Sauvegarde',
          missionFilter: ['logistique', 'social'],
          serigraphieKey: 'soutien_pop',
          serigraphieLabel: 'Soutien aux Populations',
          desc: 'Fourgon équipé pour l’assistance aux sinistrés, l’hébergement et le ravitaillement.',
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
      id: 'master4',
      name: 'Renault Master IV (Nouvelle Génération)',
      brand: 'Renault Trucks',
      desc: 'Nouvelle génération du fourgon phare de la Protection Civile. Aérodynamisme optimisé, habitacle ergonomique de dernière génération et cellule sanitaire aux normes EN 1789.',
      icon: '🚑',
      defaultVariantId: 'master4_vpsp',
      variants: [
        {
          id: 'master4_vpsp',
          functions: ["PS"],
          type: 'VPSP',
          name: 'Renault Master IV - VPSP Nouvelle Génération',
          shortName: 'VPSP Master IV',
          category: 'Secours d’Urgence',
          missionFilter: ['secours'],
          desc: 'Ambulance de nouvelle génération avec brancard assisté et confort optimisé.',
          cost: 34500,
          capacity: 5,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 90,
          hasTowHitch: false,
          image: 'images/vehicles/master4_vpsp.png',
          specialty: 'Urgences Réflexes & SAMU 15'
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
          functions: ["TP"],
          type: 'VTP',
          name: 'Renault Trafic III - VTP Minibus d’Intervention (9 places)',
          shortName: 'Minibus VTP 9 places',
          category: 'Transport d’Équipes',
          missionFilter: ['logistique'],
          desc: 'Minibus compact 9 places idéal pour les relèves d’équipes en milieu urbain.',
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
          functions: ["TU","LOG"],
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
          functions: ["PS"],
          type: 'VPSP',
          name: 'Fiat Ducato - VPSP Secours Sanitaire',
          shortName: 'VPSP Grand Volume',
          category: 'Secours d’Urgence',
          missionFilter: ['secours'],
          desc: 'Véhicule de Premiers Secours à Personnes avec cellule ergonomique grand gabarit pour prise en charge sanitaire confortable.',
          cost: 27900,
          capacity: 5,
          licenseRequired: 'B',
          licenseLabel: 'Permis B',
          speedKmH: 85,
          hasTowHitch: false,
          image: 'images/vehicles/VPSP.png',
          specialty: 'Secours d’Urgence'
        },
        {
          id: 'ducato_vtu',
          functions: ["TU","LOG"],
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
          functions: ["LIAISON","CMD"],
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
          functions: ["HR","LIAISON","CMD"],
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
          functions: ["LOG","POP","TECH"],
          type: 'FLIT',
          name: 'FLIT - Fourgon Lourd d’Intervention Technique & Soutien Pop',
          shortName: 'FLIT Fourgon Lourd Soutien Pop (> 12t)',
          category: 'Technique & Soutien',
          missionFilter: ['logistique', 'usar', 'crise'],
          desc: 'Poids Lourd d’intervention technique et secours lourd : cellule avec rideaux alu, montage rapide de Poste Médical Avancé (PMA), groupes électrogènes de puissance, mâts d’éclairage et pompes. Conducteur Permis C obligatoire.',
          cost: 95000,
          capacity: 3,
          licenseRequired: 'C',
          licenseLabel: 'Permis C (Poids Lourd)',
          speedKmH: 70,
          hasTowHitch: true,
          image: 'images/vehicles/flit_pop.png',
          specialty: 'Postes Médicaux Avancés & Crises'
        },
        {
          id: 'midliners135_flit_pop',
          functions: ["LOG","POP"],
          type: 'FLIT',
          name: 'Renault Midliner S135 - FLIT Soutien aux Populations & Catastrophe',
          shortName: 'Camion Midliner S135 Soutien Pop',
          category: 'Technique & Soutien',
          missionFilter: ['logistique', 'usar', 'crise'],
          desc: 'Camion Poids Lourd d’assistance aux populations sinistrées et soutien logistique lourd en situation de crise ou inondation.',
          cost: 42000,
          capacity: 3,
          licenseRequired: 'C',
          licenseLabel: 'Permis C (Poids Lourd)',
          speedKmH: 75,
          hasTowHitch: true,
          image: 'images/vehicles/midliners135_flit_pop.png',
          specialty: 'Catastrophes & Soutien Sinistrés'
        },
        {
          id: 'pcm_heavy',
          functions: ["CMD","LIAISON"],
          type: 'PCM',
          name: 'Renault Midlum - PCM Poste de Commandement Mobile',
          shortName: 'Poste de Commandement Mobile Midlum',
          category: 'Commandement Lourd',
          missionFilter: ['liaison'],
          desc: 'Centre opérationnel mobile de crise sur châssis Renault Midlum avec baie de transmissions VHF/UHF, liaisons satellites et salle de crise embarquée. Conducteur Permis C obligatoire.',
          cost: 55000,
          capacity: 3,
          licenseRequired: 'C',
          licenseLabel: 'Permis C (Poids Lourd)',
          speedKmH: 70,
          hasTowHitch: false,
          image: 'images/vehicles/midlum_pc.png',
          specialty: 'Coordination Grands Événements & NOVI'
        },
        {
          id: 'pl_pop',
          functions: ["LOG","POP"],
          type: 'VTU',
          name: 'Renault Trucks PL - Poids Lourd Soutien aux Populations',
          shortName: 'Camion PL Soutien Populations',
          category: 'Soutien & Sauvegarde',
          missionFilter: ['logistique', 'social', 'crise'],
          desc: 'Camion Poids Lourd grand volume avec hayon élévateur pour le déploiement massif de lits picot, malles d’hébergement d’urgence et ravitaillement citoyen.',
          cost: 58000,
          capacity: 3,
          licenseRequired: 'C',
          licenseLabel: 'Permis C (Poids Lourd)',
          speedKmH: 75,
          hasTowHitch: true,
          image: 'images/vehicles/pl_pop.png',
          specialty: 'Hébergement d’Urgence & Crises'
        },
        {
          id: 'trm_pop',
          functions: ["HR","LOG","POP"],
          type: 'VLHR',
          name: 'Renault TRM 2000 4x4 - Soutien aux Populations Tout-Terrain',
          shortName: 'Camion TRM 2000 4x4 Tout-Terrain',
          category: 'Tout-Terrain Lourd',
          missionFilter: ['tout_terrain', 'crise', 'logistique'],
          desc: 'Camion Poids Lourd 4x4 tout-terrain de franchissement lourd, indispensable pour les inondations sévères, tempêtes, pistes dégradées et accès en zone sinistrée coupée du monde.',
          cost: 48000,
          capacity: 3,
          licenseRequired: 'C',
          licenseLabel: 'Permis C (Poids Lourd)',
          speedKmH: 70,
          hasTowHitch: true,
          image: 'images/vehicles/trm_pop.png',
          specialty: 'Inondations, Tempêtes & Crues'
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
          functions: ["SSA"],
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
          functions: ["PS","LIAISON"],
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
          functions: ["HR","PS"],
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
          functions: ["PS"],
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
          functions: ["SOC","POP"],
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
          functions: ["CYNO","TECH"],
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
          functions: ["LOG","TECH"],
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
      functions: ["PS"],
      types: ['PS', 'VPSP'],
      capacity_log: 0,
      consumables: 100,
      name: 'VPSP - Ambulance de secours',
      category: 'Secours d’Urgence',
      missionFilter: ['secours'],
      desc: 'Ambulance de secours pour soigner et transporter les victimes vers l’hôpital.',
      cost: 28500,
      capacity: 5,
      licenseRequired: 'B',
      licenseLabel: 'Permis B',
      image: 'images/vehicles/master3_vpsp.png',
      icon: '🚑',
      speedKmH: 85,
      specialty: 'Transport Sanitaire & SAMU 15'
    },
    {
      type: 'VL',
      functions: ["LIAISON","CMD"],
      types: ['TP'],
      capacity_log: 0,
      consumables: 100,
      name: 'VL - Véhicule de liaison',
      category: 'Reconnaissance Rapide',
      missionFilter: ['liaison'],
      desc: 'Véhicule léger pour les liaisons rapides, le commandement et le remorquage.',
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
      functions: ["HR","LIAISON","CMD"],
      types: ['LOG', 'TP'],
      capacity_log: 2,
      consumables: 100,
      name: 'VLHR - Tout-terrain 4x4',
      category: 'Tout-Terrain',
      missionFilter: ['liaison', 'tout_terrain'],
      desc: 'Véhicule 4x4 tout-terrain pour intervenir en zone difficile, forêt et crues.',
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
      functions: ["TU","LOG"],
      types: ['LOG', 'TP'],
      capacity_log: 6,
      consumables: 100,
      name: 'VTU - Fourgon logistique',
      category: 'Logistique & Soutien',
      missionFilter: ['logistique'],
      desc: 'Fourgon utilitaire grande capacité pour transporter le matériel et les lots de crise.',
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
      functions: ["TP"],
      types: ['TP'],
      capacity_log: 0,
      consumables: 100,
      name: 'VTP - Minibus 9 places',
      category: 'Transport d’Équipes',
      missionFilter: ['logistique'],
      desc: 'Minibus pour transporter jusqu’à 9 secouristes sur les dispositifs et missions distantes.',
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
      functions: ["CMD","LIAISON"],
      types: ['TP', 'LOG'],
      capacity_log: 2,
      consumables: 100,
      name: 'Poste de Commandement Mobile (PCM)',
      category: 'Commandement Lourd',
      missionFilter: ['liaison'],
      desc: 'Poste de commandement mobile lourd pour coordonner les grandes crises.',
      cost: 55000,
      capacity: 3,
      licenseRequired: 'C',
      licenseLabel: 'Permis C (Poids Lourd)',
      image: 'images/vehicles/midlum_pc.png',
      icon: '🚍',
      speedKmH: 70,
      specialty: 'Coordination Grands Événements & NOVI'
    },
    {
      type: 'VAHU',
      functions: ["SOC","POP"],
      types: ['LOG', 'TP'],
      capacity_log: 4,
      consumables: 100,
      name: 'VAHU - Accueil & Maraudes',
      category: 'Action Sociale & Accueil',
      missionFilter: ['social'],
      desc: 'Véhicule pour maraudes sociales, accueil des sinistrés et distribution de repas.',
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
      functions: ["LOG","POP","TECH"],
      types: ['LOG', 'TP'],
      capacity_log: 12,
      consumables: 100,
      name: 'FLIT - Fourgon Lourd d’Intervention',
      category: 'Technique & Soutien Lourd',
      missionFilter: ['logistique', 'usar', 'crise'],
      desc: 'Poids lourd d’intervention technique pour déployer les postes médicaux de crise.',
      cost: 95000,
      capacity: 3,
      licenseRequired: 'C',
      licenseLabel: 'Permis C (Poids Lourd)',
      image: 'images/vehicles/flit_pop.png',
      icon: '🏗️',
      speedKmH: 70,
      specialty: 'Postes Médicaux Avancés & Crises'
    },
    {
      type: 'VCYN',
      functions: ["CYNO","TECH"],
      types: ['LOG', 'TP'],
      capacity_log: 2,
      consumables: 100,
      name: 'VCYN - Véhicule Cynotechnique',
      category: 'USAR / Cyno',
      missionFilter: ['usar'],
      desc: 'Fourgon avec boxes pour transporter les chiens de recherche et sauvetage.',
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
      functions: ["SSA"],
      types: ['TP'],
      capacity_log: 0,
      consumables: 100,
      name: 'Bateau de sauvetage (ERS)',
      category: 'Sauvetage Aquatique (SSA)',
      missionFilter: ['nautique'],
      desc: 'Embarcation pour les inondations, crues et sauvetages en milieu aquatique.',
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
      functions: ["PS","LIAISON"],
      types: ['PS'],
      capacity_log: 0,
      consumables: 100,
      name: 'Moto de secours (MPS)',
      category: 'Vecteur Rapide',
      missionFilter: ['secours', 'tout_terrain'],
      desc: 'Deux-roues rapide pour se faufiler dans la circulation et sécuriser les parcours.',
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
      functions: ["HR","PS"],
      types: ['PS'],
      capacity_log: 0,
      consumables: 100,
      name: 'Quad Tout-Terrain',
      category: 'Tout-Terrain Agile',
      missionFilter: ['tout_terrain'],
      desc: 'Quad tout-terrain pour évacuer les blessés en terrain étroit et accidenté.',
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
      functions: ["TECH"],
      types: ['LOG', 'TP'],
      capacity_log: 4,
      consumables: 100,
      name: 'Véhicule Déblaiement USAR',
      category: 'Sauvetage Déblaiement (USAR)',
      missionFilter: ['usar'],
      desc: 'Véhicule d’appui transportant l’outillage lourd de déblaiement et sauvetage.',
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
      functions: ["PS"],
      types: ['PS'],
      capacity_log: 0,
      isBicycle: true,
      transportSlots: 1,
      requiresLogTransport: true,
      consumables: 100,
      name: 'Vélo de premiers secours',
      category: 'Dispositif Mobile',
      missionFilter: ['secours', 'tout_terrain'],
      desc: 'Vélos équipés pour patrouiller rapidement au cœur des foules et rassemblements.',
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
      functions: ["LOG","TECH"],
      types: ['LOG', 'TP'],
      capacity_log: 6,
      consumables: 100,
      name: 'VST - Soutien Technique',
      category: 'Soutien & Énergie',
      missionFilter: ['logistique'],
      desc: 'Véhicule de soutien technique avec groupe électrogène et assistance mécanique.',
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
      functions: ["LOG","TECH"],
      types: ['LOG'],
      capacity_log: 4,
      consumables: 100,
      name: 'Remorque PMA & Éclairage',
      category: 'Remorque Spécialisée',
      missionFilter: ['logistique', 'tout_terrain'],
      desc: 'Remorque tractée transportant le matériel d’éclairage et de poste de secours.',
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

    // Filière Médicale & Équipe de Santé (Professionnels de Santé)
    { id: 'infirmier', name: 'Infirmier DE (Infirmier Diplômé d’État)', icon: '💉', xpRequired: 40, desc: 'Diplôme d’État d’Infirmier : autorise les soins d’urgence protocolisés, analgésie et surveillance avancée au sein de l’équipe médicale.' },
    { id: 'medecin', name: 'Médecin Urgentiste (Docteur en Médecine)', icon: '🩺', xpRequired: 55, desc: 'Docteur en Médecine : régulation terrain, médicalisation d’urgence, réanimation avancée et commandement médical du PMA.' },

    // Filière Technique & Prompt Secours
    { id: 'tronc', name: 'Opérateur Tronçonneuse (Tronc.)', icon: '🪓', xpRequired: 30, desc: 'Habilitation officielle au maniement des tronçonneuses thermiques et matériels de coupe pour le dégagement d’urgence et déblaiement de voies (1 opérateur par équipe suffit).' },
    { id: 'ceps', name: 'Chef d’Équipe Prompt Secours (CEPS)', icon: '🚨', xpRequired: 45, reqSkill: 'ce', desc: 'Commandement opérationnel des interventions réflexes, départs urgents et gardes SDIS / prompt secours.' },

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
    // Tentative de restauration locale immédiate de secours
    this.loadRewardsLocally(game);

    const currentTier = this.detectAntennaTier(game);
    const todayKey = this.getTodayDateKey(game);
    const curDayNum = game.clock ? game.clock.day : new Date().getDate();

    if (!game.rewards) {
      game.rewards = {
        streakDays: 1,
        tier: currentTier,
        lastDailyClaimDay: null,
        lastDailyClaimDate: null,
        lastDailyClaimTimestamp: 0,
        lastDailyTaskResetDate: todayKey,
        lastDailyTaskResetDay: curDayNum,
        dailyTasks: this.getTasksForTier(currentTier, false),
        weeklyTasks: this.getTasksForTier(currentTier, true)
      };
    } else {
      if (!game.rewards.tier) game.rewards.tier = currentTier;
      if (!game.rewards.lastDailyTaskResetDate) game.rewards.lastDailyTaskResetDate = todayKey;
      if (!game.rewards.lastDailyTaskResetDay) game.rewards.lastDailyTaskResetDay = curDayNum;
      if (!Array.isArray(game.rewards.dailyTasks) || game.rewards.dailyTasks.length === 0) {
        game.rewards.dailyTasks = this.getTasksForTier(game.rewards.tier || currentTier, false);
      }
      if (!Array.isArray(game.rewards.weeklyTasks) || game.rewards.weeklyTasks.length === 0) {
        game.rewards.weeklyTasks = this.getTasksForTier(game.rewards.tier || currentTier, true);
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
          desc: 'Simulation d’afflux massif de blessés avec déploiement simultané de plusieurs VPC et VPSP.',
          participantsCount: 2,
          rewardMoney: 2200,
          rewardXp: 75,
          status: 'open'
        }
      ];
    }
  },

  // --- PERSISTANCE LOCALE DE SECOURS (ZÉRO PERTE SUR LES RÉCOMPENSES) ---
  saveRewardsLocally(game) {
    if (!game || !game.rewards) return;
    try {
      const playerId = game.player?.id || window.ProtecAuth?.currentUser?.id || null;
      localStorage.setItem('protec_rewards_save', JSON.stringify({
        userId: playerId,
        rewards: game.rewards,
        savedAt: Date.now()
      }));
    } catch (e) {}
  },

  loadRewardsLocally(game) {
    if (!game) return;
    try {
      const raw = localStorage.getItem('protec_rewards_save');
      if (raw) {
        const parsed = JSON.parse(raw);
        const currentPlayerId = game.player?.id || window.ProtecAuth?.currentUser?.id || null;
        // Si la sauvegarde de récompenses provient d'un autre compte utilisateur, ne pas réimporter
        if (parsed.userId && currentPlayerId && parsed.userId !== currentPlayerId) {
          return;
        }
        if (parsed && parsed.rewards) {
          if (!game.rewards) {
            game.rewards = parsed.rewards;
          } else {
            const localTs = parsed.rewards.lastDailyClaimTimestamp || 0;
            const currentTs = game.rewards.lastDailyClaimTimestamp || 0;
            if (localTs >= currentTs) {
              game.rewards.lastDailyClaimDate = parsed.rewards.lastDailyClaimDate || game.rewards.lastDailyClaimDate;
              game.rewards.lastDailyClaimDay = parsed.rewards.lastDailyClaimDay || game.rewards.lastDailyClaimDay;
              game.rewards.lastDailyClaimTimestamp = localTs;
              game.rewards.streakDays = parsed.rewards.streakDays || game.rewards.streakDays;
            }
            if (parsed.rewards.dailyTasks && Array.isArray(parsed.rewards.dailyTasks)) {
              parsed.rewards.dailyTasks.forEach(pt => {
                const gt = (game.rewards.dailyTasks || []).find(t => t.id === pt.id);
                if (gt && pt.done) {
                  gt.done = true;
                  gt.current = gt.goal;
                }
              });
            }
          }
        }
      }
    } catch (e) {}
  },

  // Helper date du jour au format ISO YYYY-MM-DD
  // Catalogue officiel des récompenses de connexion consécutive (Cycle de 7 jours)
  streakRewardsCatalog: [
    { day: 1, title: 'Jour 1', money: 500, desc: '+500 € de dotation fédérale', shortDesc: '500 €', icon: '🎁' },
    { day: 2, title: 'Jour 2', money: 750, desc: '+750 € de dotation fédérale', shortDesc: '750 €', icon: '⚡' },
    { day: 3, title: 'Jour 3', money: 1000, desc: '+1 000 € de dotation fédérale', shortDesc: '1 000 €', icon: '💰' },
    { day: 4, title: 'Jour 4', money: 1250, desc: '+1 250 € de dotation fédérale', shortDesc: '1 250 €', icon: '⭐' },
    { day: 5, title: 'Jour 5', money: 1500, desc: '+1 500 € de dotation fédérale', shortDesc: '1 500 €', icon: '💎' },
    { day: 6, title: 'Jour 6', money: 2000, desc: '+2 000 € de dotation fédérale', shortDesc: '2 000 €', icon: '🎖️' },
    { day: 7, title: 'Jour 7', money: 5000, desc: '🏆 GRAND BONUS FÉDÉRAL JOUR 7 : +5 000 € pour l’antenne !', shortDesc: '5 000 €', icon: '🏆' }
  ],

  // Helper date du jour au format ISO YYYY-MM-DD
  getTodayDateKey(game) {
    if (game && game.clock && game.clock.year && game.clock.month !== undefined && game.clock.day) {
      const y = game.clock.year;
      const m = String(game.clock.month + 1).padStart(2, '0');
      const d = String(game.clock.day).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // Helper date d'hier au format ISO YYYY-MM-DD
  getYesterdayDateKey(game) {
    const todayStr = this.getTodayDateKey(game);
    const parts = todayStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // Évaluation rigoureuse et en temps réel de la Série de Connexion Quotidienne :
  // RÈGLE IMPÉRATIVE : La série exige une connexion TOUS LES JOURS sans interruption.
  // Si le joueur ne s'est pas connecté hier -> la série est rompue et revient DIRECTEMENT au Jour 1 !
  getStreakInfo(game) {
    if (!game) return { streakDays: 1, targetClaimDay: 1, canClaim: false, alreadyClaimedToday: false, isBroken: false, hasAntenna: false };
    const r = game.rewards = game.rewards || {};
    const todayKey = this.getTodayDateKey(game);
    const yesterdayKey = this.getYesterdayDateKey(game);
    const lastClaimDate = r.lastDailyClaimDate;

    let alreadyClaimedToday = (lastClaimDate === todayKey);
    let isBroken = false;
    let currentStreak = Number(r.streakDays) || 1;
    let targetClaimDay = 1;

    if (!lastClaimDate) {
      // Première connexion / nouveau joueur
      currentStreak = 1;
      targetClaimDay = 1;
      alreadyClaimedToday = false;
    } else if (alreadyClaimedToday) {
      // Déjà réclamé aujourd'hui
      targetClaimDay = currentStreak;
    } else if (lastClaimDate === yesterdayKey) {
      // Connexion hier validée : série continue !
      targetClaimDay = currentStreak >= 7 ? 1 : (currentStreak + 1);
    } else {
      // INTERRUPTION DÉTECTÉE : plus d'un jour sans réclamation !
      // RETOUR STRICT ET IMMÉDIAT AU JOUR 1
      isBroken = true;
      currentStreak = 1;
      targetClaimDay = 1;
      r.streakDays = 1;
      r.streakBroken = true;
    }

    const hasAntenna = Array.isArray(game.stations) && game.stations.length > 0;
    const canClaim = hasAntenna && !alreadyClaimedToday;

    return {
      streakDays: currentStreak,
      targetClaimDay: targetClaimDay,
      canClaim: canClaim,
      alreadyClaimedToday: alreadyClaimedToday,
      isBroken: isBroken,
      lastClaimDate: lastClaimDate,
      todayKey: todayKey,
      yesterdayKey: yesterdayKey,
      hasAntenna: hasAntenna
    };
  },

  // Contrôle si la dotation quotidienne peut être réclamée
  canClaimDailyStreak(game) {
    const info = this.getStreakInfo(game);
    return info.canClaim;
  },

  // 2. Gestion des Récompenses Quotidiennes (Dotation Fédérale)
  claimDailyStreak(game) {
    const info = this.getStreakInfo(game);

    if (!info.hasAntenna) {
      game.showToast('Antenne Requise', 'Implantez d’abord votre antenne sur la carte pour recevoir votre dotation fédérale !', 'orange');
      return;
    }

    if (!info.canClaim) {
      game.showToast('Déjà réclamé', 'Vous avez déjà reçu votre dotation quotidienne pour aujourd’hui ! Revenez demain.', 'blue');
      return;
    }

    const claimDay = info.targetClaimDay;
    const streakRewards = this.streakRewardsCatalog;
    const pick = streakRewards[claimDay - 1] || streakRewards[0];

    // Attribution des dotations : 100% en trésorerie (argent net)
    game.resources.money = (game.resources.money || 0) + (pick.money || 0);
    if (pick.rep) game.resources.reputationScore = (game.resources.reputationScore || 0) + pick.rep;

    const curDayNum = game.clock ? game.clock.day : new Date().getDate();
    game.rewards.lastDailyClaimDay = curDayNum;
    game.rewards.lastDailyClaimDate = info.todayKey;
    game.rewards.lastDailyClaimTimestamp = Date.now();
    game.rewards.streakDays = claimDay;
    game.rewards.streakBroken = false;

    // PERSISTANCE LOCALE IMMÉDIATE (GARANTIE ZÉRO PERTE)
    this.saveRewardsLocally(game);

    game.updateStatsUI();
    game.saveGame(true);

    game.showToast(
      `🎁 Dotation Jour ${claimDay} Encaissée !`,
      `${pick.desc}`,
      'green'
    );

    // Effet sonore de validation
    if (window.ProtecAudio && typeof window.ProtecAudio.playSuccess === 'function') {
      window.ProtecAudio.playSuccess();
    }

    // Rafraîchir la modale si ouverte
    if (game.currentModalKey === 'recompenses' && window.ProtecAdvancedModals) {
      const body = document.getElementById('modal-body');
      if (body) {
        body.innerHTML = window.ProtecAdvancedModals.renderRewards(game);
        if (window.lucide) window.lucide.createIcons();
      }
    }
  },

  // Détection du palier de développement de l'antenne (Tier 1: Lancement, Tier 2: Développement, Tier 3: Envergure)
  detectAntennaTier(game) {
    if (!game.stations || game.stations.length === 0) return 1;
    const vehCount = (game.vehicles || []).length;
    const completedMissions = (game.missions || []).filter(m => m.status === 'completed').length;
    const totalVolunteers = (game.volunteers || []).length;

    // Palier 1 (Lancement d'antenne) : moins de 2 véhicules ou moins de 4 missions
    if (vehCount < 2 || completedMissions < 4) {
      return 1;
    }
    // Palier 3 (Grande Envergure / Rayonnement) : >= 15 missions terminées, >= 4 véhicules, >= 10 secouristes
    if (completedMissions >= 15 && vehCount >= 4 && totalVolunteers >= 10) {
      return 3;
    }
    // Palier 2 (Développement / Consolidation)
    return 2;
  },

  // Initialisation et garantie du suivi d'activité journalière & hebdomadaire
  ensureActivityTracking(game) {
    if (!game.rewards) return;
    const todayKey = this.getTodayDateKey(game);
    const curWeek = (window.ProtecMultiplayer && window.ProtecMultiplayer.getWeekKey) ? window.ProtecMultiplayer.getWeekKey(game.clock) : 'W';

    if (!game.rewards.dailyActivity || game.rewards.dailyActivity.date !== todayKey) {
      game.rewards.dailyActivity = {
        date: todayKey,
        startTimestamp: Date.now(),
        missions: 0,
        samu: 0,
        formations: 0,
        sessionsPlanned: 0,
        devis: 0,
        recycles: 0,
        rearms: 0,
        roleAssignments: 0
      };
    }
    if (!game.rewards.weeklyActivity || game.rewards.weeklyActivity.week !== curWeek) {
      game.rewards.weeklyActivity = {
        week: curWeek,
        startTimestamp: Date.now(),
        missions: 0,
        formations: 0,
        sessionsPlanned: 0,
        devis: 0,
        recycles: 0,
        promotions: 0,
        roleAssignments: 0,
        startVolunteerHours: game.grants?.totalVolunteerHours || 0
      };
    }
  },

  // Enregistrement des événements de jeu pour les objectifs
  recordMissionCompleted(game, mission) {
    if (!game || !game.rewards) return;
    this.ensureActivityTracking(game);
    game.rewards.dailyActivity.missions = (game.rewards.dailyActivity.missions || 0) + 1;
    game.rewards.weeklyActivity.missions = (game.rewards.weeklyActivity.missions || 0) + 1;
    if (mission && mission.type === 'samu') {
      game.rewards.dailyActivity.samu = (game.rewards.dailyActivity.samu || 0) + 1;
    }
    this.updateTasksProgress(game);
    this.saveRewardsLocally(game);
  },

  recordFormationCompleted(game, session) {
    if (!game || !game.rewards) return;
    this.ensureActivityTracking(game);
    game.rewards.dailyActivity.formations = (game.rewards.dailyActivity.formations || 0) + 1;
    game.rewards.weeklyActivity.formations = (game.rewards.weeklyActivity.formations || 0) + 1;
    this.updateTasksProgress(game);
    this.saveRewardsLocally(game);
  },

  recordFormationScheduled(game, session) {
    if (!game || !game.rewards) return;
    this.ensureActivityTracking(game);
    game.rewards.dailyActivity.sessionsPlanned = (game.rewards.dailyActivity.sessionsPlanned || 0) + 1;
    game.rewards.weeklyActivity.sessionsPlanned = (game.rewards.weeklyActivity.sessionsPlanned || 0) + 1;
    this.updateTasksProgress(game);
    this.saveRewardsLocally(game);
  },

  recordDevisSigned(game, devis) {
    if (!game || !game.rewards) return;
    this.ensureActivityTracking(game);
    game.rewards.dailyActivity.devis = (game.rewards.dailyActivity.devis || 0) + 1;
    game.rewards.weeklyActivity.devis = (game.rewards.weeklyActivity.devis || 0) + 1;
    this.updateTasksProgress(game);
    this.saveRewardsLocally(game);
  },

  recordVolunteerRecycled(game, volunteer) {
    if (!game || !game.rewards) return;
    this.ensureActivityTracking(game);
    game.rewards.dailyActivity.recycles = (game.rewards.dailyActivity.recycles || 0) + 1;
    game.rewards.weeklyActivity.recycles = (game.rewards.weeklyActivity.recycles || 0) + 1;
    this.updateTasksProgress(game);
    this.saveRewardsLocally(game);
  },

  recordRoleAssigned(game, volunteer, role) {
    if (!game || !game.rewards) return;
    this.ensureActivityTracking(game);
    game.rewards.dailyActivity.roleAssignments = (game.rewards.dailyActivity.roleAssignments || 0) + 1;
    game.rewards.weeklyActivity.roleAssignments = (game.rewards.weeklyActivity.roleAssignments || 0) + 1;
    this.updateTasksProgress(game);
    this.saveRewardsLocally(game);
  },

  recordVolunteerPromoted(game, volunteer) {
    if (!game || !game.rewards) return;
    this.ensureActivityTracking(game);
    game.rewards.weeklyActivity.promotions = (game.rewards.weeklyActivity.promotions || 0) + 1;
    this.updateTasksProgress(game);
    this.saveRewardsLocally(game);
  },

  recordVehicleRearmed(game, vehicle) {
    if (!game || !game.rewards) return;
    this.ensureActivityTracking(game);
    game.rewards.dailyActivity.rearms = (game.rewards.dailyActivity.rearms || 0) + 1;
    this.updateTasksProgress(game);
    this.saveRewardsLocally(game);
  },

  // Catalogue des Tâches Quotidiennes & Défis Hebdomadaires adaptés au jeu actuel :
  // - Opérations & Secours (DPS, SAMU 15, Maraudes, NOVI)
  // - Pôle Formations & Pédagogie (PSC1, SST, FC PSE, Devis B2B)
  // - Logistique & Flotte (VPSP, VTU, Oxygène B5, DAE, trousses)
  // - Bénévoles & Pôles (Recyclages au 31/12, rôles, montées en compétences)
  getTasksForTier(tier, isWeekly = false) {
    if (isWeekly) {
      if (tier === 1) {
        return [
          { id: 'w-task-hours', title: 'Cumuler 10h de bénévolat d’intérêt public sur le terrain', goal: 10, current: 0, reward: 1200, done: false, icon: 'clock' },
          { id: 'w-task-missions', title: 'Assurer 3 départs en missions de secours (DPS, SAMU ou urgence)', goal: 3, current: 0, reward: 1000, done: false, icon: 'shield-alert' },
          { id: 'w-task-team', title: 'Pôles d’antenne : attribuer un rôle ou promouvoir 1 bénévole (PSE1/PSE2)', goal: 1, current: 0, reward: 800, done: false, icon: 'user-check' }
        ];
      } else if (tier === 2) {
        return [
          { id: 'w-task-hours', title: 'Cumuler 25h d’engagement opérationnel de sécurité civile', goal: 25, current: 0, reward: 2500, done: false, icon: 'clock' },
          { id: 'w-task-missions', title: 'Mener à bien 5 dispositifs prévisionnels de secours ou astreintes', goal: 5, current: 0, reward: 2000, done: false, icon: 'shield-alert' },
          { id: 'w-task-team', title: 'Pédagogie & Maintien : certifier 2 formations ou recyclages (PSC, SST, FC PSE)', goal: 2, current: 0, reward: 1800, done: false, icon: 'graduation-cap' }
        ];
      } else {
        return [
          { id: 'w-task-hours', title: 'Cumuler 50h de missions de sécurité civile sur le département', goal: 50, current: 0, reward: 4500, done: false, icon: 'clock' },
          { id: 'w-task-missions', title: 'Accomplir 8 missions opérationnelles (DPS majeurs, SAMU 15, NOVI/Météo)', goal: 8, current: 0, reward: 3800, done: false, icon: 'siren' },
          { id: 'w-task-team', title: 'Rayonnement territorial : 3 formations certifiées ou devis B2B validés', goal: 3, current: 0, reward: 3200, done: false, icon: 'award' }
        ];
      }
    } else {
      if (tier === 1) {
        return [
          { id: 'task-daily-ops', title: 'Assurer au moins 1 départ en mission de secours ou DPS', goal: 1, current: 0, reward: 500, done: false, icon: 'ambulance' },
          { id: 'task-daily-logi', title: 'Disposer d’au moins 1 véhicule opérationnel réarmé & prêt au départ', goal: 1, current: 0, reward: 400, done: false, icon: 'truck' },
          { id: 'task-daily-pedago', title: 'Pôle Formation : organiser ou planifier 1 session (PSC, SST ou FC Recyclage)', goal: 1, current: 0, reward: 450, done: false, icon: 'graduation-cap' }
        ];
      } else if (tier === 2) {
        return [
          { id: 'task-daily-ops', title: 'Réaliser 2 missions opérationnelles (DPS, SAMU 15 ou Maraude sociale)', goal: 2, current: 0, reward: 800, done: false, icon: 'ambulance' },
          { id: 'task-daily-logi', title: 'Maintenir la réserve logistique de l’antenne (≥ 4 articles en stock)', goal: 4, current: 0, reward: 600, done: false, icon: 'package' },
          { id: 'task-daily-pedago', title: 'Formations : traiter 1 devis B2B entreprise ou inscrire un bénévole en recyclage', goal: 1, current: 0, reward: 750, done: false, icon: 'file-text' }
        ];
      } else {
        return [
          { id: 'task-daily-ops', title: 'Réaliser 3 interventions opérationnelles (DPS, SAMU 15, Urgences ou Crises)', goal: 3, current: 0, reward: 1400, done: false, icon: 'siren' },
          { id: 'task-daily-logi', title: 'Maintenir la flotte (≥ 2 véhicules) désinfectée, révisée et CT à jour', goal: 2, current: 0, reward: 1100, done: false, icon: 'shield-check' },
          { id: 'task-daily-pedago', title: 'Maintien des compétences : 1 recyclage FC PSE ou session de formation certifiée', goal: 1, current: 0, reward: 1200, done: false, icon: 'award' }
        ];
      }
    }
  },

  syncAdaptiveTasks(game) {
    if (!game.rewards) return;
    const currentTier = this.detectAntennaTier(game);
    const todayKey = this.getTodayDateKey(game);
    const curWeek = (window.ProtecMultiplayer && window.ProtecMultiplayer.getWeekKey) ? window.ProtecMultiplayer.getWeekKey(game.clock) : 'W';

    this.ensureActivityTracking(game);

    // 1. Initialisation des clés temporelles calendaires si absentes
    if (!game.rewards.lastDailyTaskResetDate) {
      game.rewards.lastDailyTaskResetDate = todayKey;
      game.rewards.lastDailyTaskResetDay = game.clock ? game.clock.day : new Date().getDate();
    }
    if (game.rewards.lastWeeklyTaskResetWeek === undefined) {
      game.rewards.lastWeeklyTaskResetWeek = curWeek;
    }

    // 2. Renouvellement lors d'un nouveau jour calendaire réel
    if (game.rewards.lastDailyTaskResetDate !== todayKey) {
      game.rewards.lastDailyTaskResetDate = todayKey;
      game.rewards.lastDailyTaskResetDay = game.clock ? game.clock.day : new Date().getDate();
      const t = game.rewards.tier || currentTier;
      game.rewards.dailyTasks = this.getTasksForTier(t, false);
      this.saveRewardsLocally(game);
    }

    // 3. Renouvellement lors d'une nouvelle semaine
    if (game.rewards.lastWeeklyTaskResetWeek !== curWeek) {
      game.rewards.lastWeeklyTaskResetWeek = curWeek;
      const t = game.rewards.tier || currentTier;
      game.rewards.weeklyTasks = this.getTasksForTier(t, true);
      this.saveRewardsLocally(game);
    }

    // Nettoyage immédiat des anciens intitulés de tâches stockés en mémoire
    if (Array.isArray(game.rewards.dailyTasks)) {
      game.rewards.dailyTasks.forEach(t => {
        if (t.id === 'task-daily-logi' && t.title && t.title.includes('Oxygène')) {
          t.title = 'Maintenir la réserve logistique de l’antenne (≥ 4 articles en stock)';
        }
      });
    }

    // 4. Initialisation ou passage de palier
    if (!game.rewards.dailyTasks || game.rewards.dailyTasks.length === 0) {
      game.rewards.tier = currentTier;
      game.rewards.dailyTasks = this.getTasksForTier(currentTier, false);
      game.rewards.weeklyTasks = this.getTasksForTier(currentTier, true);
      this.saveRewardsLocally(game);
    } else if (game.rewards.tier !== currentTier && game.rewards.dailyTasks.every(t => t.done)) {
      game.rewards.tier = currentTier;
      game.rewards.dailyTasks = this.getTasksForTier(currentTier, false);
      game.rewards.weeklyTasks = this.getTasksForTier(currentTier, true);
      this.saveRewardsLocally(game);
    }
  },

  // Calcul dynamique de la progression réelle des objectifs
  updateTasksProgress(game) {
    if (!game) return;
    if (!game.rewards) {
      this.injectAdvancedState(game);
    }
    const currentTier = this.detectAntennaTier(game);
    if (!Array.isArray(game.rewards.dailyTasks) || game.rewards.dailyTasks.length === 0) {
      game.rewards.dailyTasks = this.getTasksForTier(game.rewards.tier || currentTier, false);
    }
    if (!Array.isArray(game.rewards.weeklyTasks) || game.rewards.weeklyTasks.length === 0) {
      game.rewards.weeklyTasks = this.getTasksForTier(game.rewards.tier || currentTier, true);
    }

    const hasAntenna = game.stations && game.stations.length > 0;
    if (!hasAntenna) {
      game.rewards.tier = 1;
      (game.rewards.dailyTasks || []).forEach(t => { t.current = 0; t.done = false; });
      (game.rewards.weeklyTasks || []).forEach(w => { w.current = 0; w.done = false; });
      if (game.grants) game.grants.totalVolunteerHours = 0;
      return;
    }

    this.syncAdaptiveTasks(game);
    this.ensureActivityTracking(game);

    const act = game.rewards.dailyActivity || {};
    const wAct = game.rewards.weeklyActivity || {};

    // Assainissement des faux positifs sur comptes récents n'ayant encore aucune activité
    const totalCompletedMissions = (game.missions || []).filter(m => m.status === 'completed').length;
    const totalSessions = (game.sessionsFormation || []).length;
    const hasAnyRoleAssigned = (game.volunteers || []).some(v => v.poleRoleId && v.poleRoleId !== '');
    if (totalCompletedMissions === 0 && totalSessions === 0 && !hasAnyRoleAssigned) {
      const pedagoTask = (game.rewards.dailyTasks || []).find(t => t.id === 'task-daily-pedago');
      if (pedagoTask && (act.formations || 0) === 0 && (act.devis || 0) === 0 && (act.sessionsPlanned || 0) === 0) {
        pedagoTask.done = false;
        pedagoTask.current = 0;
      }
      const teamWeekly = (game.rewards.weeklyTasks || []).find(w => w.id === 'w-task-team');
      if (teamWeekly && (wAct.roleAssignments || 0) === 0 && (wAct.promotions || 0) === 0) {
        teamWeekly.done = false;
        teamWeekly.current = 0;
      }
    }

    // Progression des Tâches Quotidiennes
    (game.rewards.dailyTasks || []).forEach(t => {
      if (t.done) {
        t.current = t.goal;
        return;
      }

      // 1. Départs en mission de secours / Opérations (Terrain)
      if (t.id === 'task-daily-ops') {
        const activeMissions = (game.missions || []).filter(m => m.status === 'ongoing').length;
        const recordedMissions = act.missions || 0;
        t.current = Math.min(t.goal, Math.max(recordedMissions, activeMissions));
      }
      // 2. Logistique & Flotte
      else if (t.id === 'task-daily-logi') {
        if (t.goal > 2) {
          // Consommables d'urgence en stock
          const o2 = game.logistics?.oxygenBottles || 0;
          const dae = game.logistics?.aedPads || 0;
          const kits = game.logistics?.woundKits || 0;
          t.current = Math.min(t.goal, o2 + dae + kits);
        } else {
          // Véhicules prêts au départ (armement complet, non en panne, CT valide)
          const readyVehs = (game.vehicles || []).filter(v => 
            !v.isBrokenDown && !v.needsRearming && v.isRearmed !== false && (v.armementLevel === undefined || v.armementLevel >= 100) && (v.mechanical || 100) >= 50 && v.ctStatus !== 'expire'
          ).length;
          const hasDoneRearm = (act.rearms || 0) > 0;
          t.current = Math.min(t.goal, Math.max(hasDoneRearm ? 1 : 0, readyVehs));
        }
      }
      // 3. Pédagogie, Formations & Recyclages
      else if (t.id === 'task-daily-pedago') {
        const pedagoCount = (act.formations || 0) + (act.recycles || 0) + (act.devis || 0) + (act.sessionsPlanned || 0);
        // Session planifiée aujourd'hui par le joueur
        const plannedToday = (game.sessionsFormation || []).some(s => s.createdAt && s.createdAt >= (act.startTimestamp || 0));
        // Devis B2B signé aujourd'hui
        const signedB2BToday = (game.formationB2BProposals || []).some(p => p.status === 'accepted' && p.acceptedAt && p.acceptedAt >= (act.startTimestamp || 0));
        t.current = Math.min(t.goal, Math.max(pedagoCount, plannedToday ? 1 : 0, signedB2BToday ? 1 : 0));
      }
      // Rétrocompatibilité avec d'anciens IDs de tâches
      else if (t.id === 'task-starter-aasc') {
        t.current = game.aascConvention?.signed ? 1 : 0;
      } else if (t.id === 'task-starter-veh') {
        t.current = Math.min(t.goal, (game.vehicles || []).length);
      } else if (t.id === 'task-starter-mat') {
        const logiItems = game.logistics ? ((game.logistics.oxygenBottles || 0) + (game.logistics.aedPads || 0) + (game.logistics.woundKits || 0)) : 0;
        t.current = Math.min(t.goal, logiItems);
      } else if (t.id === 'task-mid-missions' || t.id === 'task-high-missions') {
        t.current = Math.min(t.goal, (act.missions || 0));
      }
    });

    // Progression des Défis Hebdomadaires
    (game.rewards.weeklyTasks || []).forEach(w => {
      if (w.done) {
        w.current = w.goal;
        return;
      }

      // 1. Heures de bénévolat d'intérêt public
      if (w.id === 'w-task-hours') {
        const totalHours = Math.max(0, game.grants?.totalVolunteerHours || 0);
        const startHours = wAct.startVolunteerHours || 0;
        const weekHours = Math.max(0, totalHours - startHours);
        // Si weekHours est 0 mais qu'il y a déjà des heures totales
        w.current = Math.min(w.goal, Math.max(weekHours, Math.round(totalHours * 0.4)));
      }
      // 2. Missions opérationnelles accomplies
      else if (w.id === 'w-task-missions') {
        const weekMissions = wAct.missions || 0;
        const totalDone = (game.missions || []).filter(m => m.status === 'completed').length;
        w.current = Math.min(w.goal, Math.max(weekMissions, totalDone));
      }
      // 3. Pôle formation, recyclages et équipe (Défis Hebdomadaires)
      else if (w.id === 'w-task-team') {
        // Actions réelles effectuées durant la semaine : attribution d'un rôle de pôle, promotion/qualification, formation ou recyclage certifié
        const teamActions = (wAct.roleAssignments || 0) + (wAct.promotions || 0) + (wAct.formations || 0) + (wAct.recycles || 0) + (wAct.devis || 0);
        w.current = Math.min(w.goal, teamActions);
      }
      // Rétrocompatibilité anciens défis
      else if (w.id === 'w-task-starter-recrut') {
        const hasRecrut = ((game.jobOffers && game.jobOffers.length > 0) || (game.candidatures && game.candidatures.length > 0)) ? 1 : 0;
        w.current = hasRecrut;
      } else if (w.id === 'w-task-starter-locaux') {
        w.current = 1;
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
    game.resources.money = (game.resources.money || 0) + task.reward;
    const repGained = task.reward >= 1000 ? 50 : (task.reward >= 500 ? 30 : 15);
    game.resources.reputationScore = (game.resources.reputationScore || 0) + repGained;

    // PERSISTANCE LOCALE IMMÉDIATE (GARANTIE ZÉRO PERTE)
    this.saveRewardsLocally(game);

    game.updateStatsUI();
    game.saveGame(true);
    game.showToast('Objectif Accompli !', `+${task.reward.toLocaleString('fr-FR')} € versés à l’antenne !`, 'green');

    // Rafraîchir la modale sans perturber l'affichage
    if (game.currentModalKey === 'recompenses' && window.ProtecAdvancedModals) {
      const body = document.getElementById('modal-body');
      if (body) {
        body.innerHTML = window.ProtecAdvancedModals.renderRewards(game);
        if (window.lucide) window.lucide.createIcons();
      }
    }
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

  // Détermination de la capacité réelle du garage (hangar / locaux)
  getGarageCapacity(game, stationId) {
    if (!game) game = window.game;
    if (!game) return 2;
    const station = (game.stations || []).find(s => s.id === stationId) || (game.stations && game.stations[0]);
    if (!station) return 2;

    if (window.ProtecLocaux && typeof window.ProtecLocaux.getGarageCapacity === 'function') {
      return window.ProtecLocaux.getGarageCapacity(game, station.id);
    }

    const prem = station.premises || station.modularPremises;
    const garage = prem?.rooms?.garage_remisage || prem?.rooms?.garage || station.rooms?.garage_remisage;
    if (garage) {
      if (garage.capacity && Number(garage.capacity) > 0) return Number(garage.capacity);
      if (garage.level) return garage.level === 1 ? 2 : (garage.level === 2 ? 4 : 8);
    }

    const lvl = station.rooms?.garage || station.garageLevel || 1;
    return lvl === 1 ? 2 : (lvl === 2 ? 4 : 8);
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

    // Réconciliation et comptage exact des véhicules de l'antenne
    if (!Array.isArray(station.vehicles)) station.vehicles = [];
    const stationVehicles = (game.vehicles || []).filter(v => v && (v.stationId === station.id || station.vehicles.includes(v.id)));
    stationVehicles.forEach(v => {
      if (!station.vehicles.includes(v.id)) station.vehicles.push(v.id);
    });

    // Vérifier la capacité réelle du garage (y compris livraisons de véhicules en cours)
    const maxSlots = this.getGarageCapacity(game, station.id);
    const inDeliveryVehicles = (game.deliveries || []).filter(d => d.status === 'in_transit' && d.type === 'vehicle' && d.stationId === station.id);
    const totalPlanned = stationVehicles.length + inDeliveryVehicles.length;
    if (totalPlanned >= maxSlots) {
      game.showToast('Garage saturé !', `Votre garage est plein (${totalPlanned}/${maxSlots} places, dont ${inDeliveryVehicles.length} en cours de livraison). Agrandissez le hangar dans l'aménagement du local !`, 'orange');
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
      hasLedBar: vehicleType === 'VPSP' || Boolean(variantOptions?.hasLedBar) || Boolean(cat.hasLedBar) || (Array.isArray(variantOptions?.installedOptions) && variantOptions.installedOptions.some(o => /gyrophare|rampe led|led/i.test(o))),
      hasConverter230v: true,
      installedOptions: Array.isArray(variantOptions?.installedOptions) ? variantOptions.installedOptions : [],
      requiresTrailer: cat.requiresTrailer || false,
      reqSkills: cat.reqSkills || [],
      types: variantOptions?.types ? [...variantOptions.types] : (variantOptions?.functions && variantOptions.functions.includes('LOG') ? ['LOG', 'TP'] : (cat.types ? [...cat.types] : (vehicleType === 'VPSP' ? ['PS', 'VPSP'] : (['VTU', 'FLIT', 'VAHU', 'VST'].includes(vehicleType) ? ['LOG', 'TP'] : ['TP'])))),
      capacity_log: variantOptions?.capacity_log !== undefined ? variantOptions.capacity_log : (cat.capacity_log !== undefined ? cat.capacity_log : (['VTU', 'FLIT', 'VAHU', 'VST'].includes(vehicleType) ? 6 : 0)),
      consumables: 100,
      armementLevel: 100,
      isRearmed: true,
      needsRearming: false,
      loadedItems: []
    };

    if (window.ProtecLogistique && typeof window.ProtecLogistique.normalizeVehicle === 'function') {
      window.ProtecLogistique.normalizeVehicle(newVeh);
    }

    // Délai de livraison basé sur le calendrier du jeu (24h à 72h selon le type)
    if (!Array.isArray(game.deliveries)) game.deliveries = [];
    const isHeavy = ['FLIT', 'VALOG', 'PCM', 'VST'].includes(vehicleType) || variantOptions?.licenseRequired === 'C';
    const isAmbulance = vehicleType === 'VPSP' || variantOptions?.type === 'VPSP';
    const delayDays = isHeavy ? 3 : (isAmbulance ? 2 : 1);
    const durationSec = delayDays * 86400; // 24h, 48h ou 72h selon le type

    const delivery = {
      id: `deliv-veh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      orderNumber: `VEH-${Date.now().toString(36).toUpperCase()}`,
      type: 'vehicle',
      isUsed: false,
      vehicleData: newVeh,
      delayDays: delayDays,
      durationSeconds: durationSec,
      etaTimestamp: Date.now() + (durationSec * 1000),
      stationId: station.id,
      stationName: station.name,
      stationCity: station.city,
      carrier: `Concessionnaire Flotte & Carrossier Agréé (${delayDays}j calendrier)`,
      supplierName: 'Concessionnaire Flotte Sécurité Civile',
      totalCost: finalCost,
      shippingFee: 0,
      itemsSummary: `1x ${newVeh.label} (${newVeh.model})`,
      status: 'in_transit',
      createdAt: Date.now()
    };
    game.deliveries.unshift(delivery);

    // Enregistrement dans le Grand Livre comptable
    if (window.ProtecFinances && typeof window.ProtecFinances.recordTransaction === 'function') {
      window.ProtecFinances.recordTransaction(
        game,
        -finalCost,
        `Commande Véhicule Neuf : ${newVeh.name} (${newVeh.model})`,
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
    game.showToast('Véhicule Commandé ! 🚚', `${cat.icon || '🚑'} ${newVeh.name} (${newVeh.model}) est en commande d’usine (${delayDays}j calendrier). Suivez son convoi dans le Suivi des Livraisons !`, 'green');
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

