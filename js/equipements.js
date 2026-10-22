/**
 * PROTEC LIVE - SYSTÈME D'ÉQUIPEMENT ET D'INVENTAIRE ÉCHELONNÉ EN GAMMES
 * 
 * 1. Gammes de Matériel (Entrée de gamme / Standard / Haut de gamme & Connecté) :
 *    - Pôle Formation : Mannequins RCP Adultes (Mousse -> Clicker mécanique -> QCPR Connecté), DSA Formation (Simple -> Connecté instructeur)
 *    - Pôle Secours : Prise de paramètres (Manuel -> Multiparamétrique NIBP -> Moniteur Bluetooth/ECG), Brancardage & Immobilisation (Manuel -> Pompe électrique & ultraléger), Radios (Analogique -> Numérique ANTARES)
 *    - Pôle Logistique & Tenues : Outillage (Manuel -> Électroportatif pro LED), Tenues EUP (Occasion -> Haute visibilité technique)
 * 
 * 2. Répercussions Opérationnelles Concrètes :
 *    - Vitesse d'exécution des bilans, réarmements et montages de poste
 *    - Qualité et précision des bilans SAMU 15 (0% erreur, valorisation réputation)
 *    - Moral, fierté et motivation des secouristes et formateurs
 *    - Attractivité et rentabilité des sessions de formation PSC1/SST
 * 
 * 3. Système de Trade-in (Reprise de l'ancien matériel à 30% de sa valeur d'achat).
 * 4. Lots d'Intervention de Réserve & Équipements de Vie d'Antenne.
 */

window.ProtecEquipements = {
  activeTab: 'secours', // 'secours' | 'formation' | 'logistique' | 'tenues'
  searchQuery: '',

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
    'images/equipements/radio_analog.png',
    'images/equipements/radio_lte.png',
    'images/equipements/radio_analog_lte.png',
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
  // 1. CATALOGUE DES GAMMES D'ÉQUIPEMENT ÉCHELONNÉES EN NIVEAUX (TIERS)
  // =========================================================================
  TIERED_EQUIPMENT_CATALOG: {
    // A. PÔLE FORMATION GRAND PUBLIC & INTERNE
    mannequin_rcp_adulte: {
      id: 'mannequin_rcp_adulte',
      category: 'formation',
      name: 'Mannequin RCP Adulte',
      lucideIcon: 'heart-pulse',
      image: 'images/equipements/mannequin_rcp_adulte.png',
      desc: 'Entraînement au massage cardiaque et aux insufflations.',
      tiers: [
        {
          level: 1,
          badge: 'Niveau 1 : Entrée de Gamme',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'Mannequin RCP basique',
          price: 25,
          maintenanceCostAnnual: 5,
          desc: 'Mannequin standard pour l’apprentissage des gestes de base.',
          bullets: [
            '⚠️ Usure rapide de la peau faciale et voies respiratoires',
            '📉 -10% d’attractivité des formations grand public',
            '❌ Aucun bonus de motivation pour les formateurs'
          ],
          stats: { attractivity: -0.10, learnSpeedBonus: 0, trainerMoralBonus: 0, publicPriceBonus: 0, satisfactionScore: 60 }
        },
        {
          level: 2,
          badge: 'Niveau 2 : Standard Réglementaire',
          badgeColor: 'bg-blue-100 text-pc-blue border-blue-300',
          title: 'Mannequin RCP avec clicker',
          price: 150,
          maintenanceCostAnnual: 15,
          desc: 'Indicateur sonore confirmant la bonne profondeur de compression.',
          bullets: [
            '✓ Standard réglementaire d’apprentissage officiel',
            '✓ Qualité d’apprentissage normale et durable',
            '✓ +5% de vitesse d’acquisition des gestes réflexes'
          ],
          stats: { attractivity: 0, learnSpeedBonus: 0.05, trainerMoralBonus: 5, publicPriceBonus: 0, satisfactionScore: 80 }
        },
        {
          level: 3,
          badge: 'Niveau 3 : Haut de Gamme & Connecté',
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-400',
          title: 'Mannequin connecté QCPR',
          price: 450,
          maintenanceCostAnnual: 40,
          desc: 'Mesure en temps réel du rythme et de la qualité des compressions sur tablette.',
          bullets: [
            '🌟 +25% de satisfaction des apprenants (+20 € tarif PSC1 autorisé)',
            '⚡ +15% de rapidité de formation des nouveaux PSE bénévoles',
            '💪 Fort boost de fierté et de motivation pour les formateurs',
            '🏛️ Attire des demandes spontanées d’entreprises locales (conventions SST)'
          ],
          stats: { attractivity: 0.25, learnSpeedBonus: 0.25, trainerMoralBonus: 15, publicPriceBonus: 20, satisfactionScore: 100, triggerCompanyContracts: true }
        }
      ]
    },

    dsa_formation: {
      id: 'dsa_formation',
      category: 'formation',
      name: 'Défibrillateur de formation (DSA)',
      lucideIcon: 'zap',
      image: 'images/equipements/dsa_formation.png',
      desc: 'Simulateur pour l’apprentissage de la défibrillation.',
      tiers: [
        {
          level: 1,
          badge: 'Niveau 1 : Entrée de Gamme',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'DSA préprogrammé',
          price: 90,
          maintenanceCostAnnual: 10,
          desc: 'Scénario fixe pour l’entraînement aux bases de la défibrillation.',
          bullets: [
            '⚠️ Scénario unique rigide (choc recommandé uniquement)',
            '❌ Aucun contrôle instructeur à distance'
          ],
          stats: { examSuccessBonus: 0, repBonus: 0 }
        },
        {
          level: 2,
          badge: 'Niveau 2 : Connecté & Pédagogique Avancé',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400',
          title: 'DSA avec télécommande',
          price: 320,
          maintenanceCostAnnual: 25,
          desc: 'Permet au formateur de simuler différentes arythmies cardiaques.',
          bullets: [
            '✓ Hausse de la qualité de validation PSE1 / PSC (+20% taux de réussite)',
            '✓ Scénarios d’arythmie variés et réalistes',
            '✓ Réputation pédagogique d’antenne grandement renforcée'
          ],
          stats: { examSuccessBonus: 0.20, repBonus: 10 }
        }
      ]
    },

    // B. PÔLE SECOURS & OPÉRATIONS (DPS / GARDES SAMU)
    prise_parametres: {
      id: 'prise_parametres',
      category: 'secours',
      name: 'Moniteur de constantes',
      lucideIcon: 'activity',
      image: 'images/equipements/prise_parametres.png',
      desc: 'Mesure de la tension, oxygénation et surveillance clinique.',
      tiers: [
        {
          level: 1,
          badge: 'Niveau 1 : Tensiomètre & Saturomètre Compacts',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'Tensiomètre & oxymètre',
          price: 180,
          maintenanceCostAnnual: 15,
          desc: 'Appareils compacts pour la mesure de la tension et de la SpO2.',
          bullets: [
            '⚡ Prise des constantes automatisée (tension artérielle et oxygénation)',
            '✓ Qualité de travail basique sur les postes de secours',
            '✓ Réduit la charge mentale des secouristes lors des bilans simples'
          ],
          stats: { speedBonus: 0.15, errorRisk: 0.05, samuRepBonus: 2, crewMoralBonus: 5, regulationSpeed: 1.15 }
        },
        {
          level: 2,
          badge: 'Niveau 2 : Moniteur Multiparamétrique de Transport',
          badgeColor: 'bg-blue-100 text-pc-blue border-blue-300 ring-1 ring-blue-400',
          title: 'Moniteur multiparamétrique',
          price: 950,
          maintenanceCostAnnual: 55,
          desc: 'Surveillance continue et affichage des constantes vitales.',
          bullets: [
            '⚡ Bilan secouriste 35% plus rapide et surveillance continue de la victime',
            '✓ 0% d’erreur de mesure ou de transcription manuscrite',
            '💪 Confort et qualité de travail accrus pour les équipiers',
            '🏥 Précision saluée lors des bilans passés à la régulation SAMU 15'
          ],
          stats: { speedBonus: 0.35, errorRisk: 0, samuRepBonus: 6, crewMoralBonus: 10, regulationSpeed: 1.4 }
        },
        {
          level: 3,
          badge: 'Niveau 3 : Moniteur Réanimation ECG 12D & Capnographie',
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-400',
          title: 'Moniteur réanimation ECG',
          price: 3600,
          maintenanceCostAnnual: 140,
          desc: 'Tracé ECG et capnographie pour urgences vitales et arrêts cardiaques.',
          bullets: [
            '⚡ Bilan vital instantané et exhaustif (-50% temps de prise en charge)',
            '🫀 Diagnostic immédiat des arrêts cardiaques et détresses respiratoires graves',
            '🏥 Confiance totale et valorisation d’excellence par le SAMU 15',
            '🌟 Qualité de travail exceptionnelle : secouristes sereins et valorisés',
            '🚑 Libération accélérée du VPSP aux Urgences hospitalières (-40% attente)'
          ],
          stats: { speedBonus: 0.50, errorRisk: 0, samuRepBonus: 12, crewMoralBonus: 20, regulationSpeed: 2.0, fastHospitalRelease: true }
        }
      ]
    },

    appareil_photo: {
      id: 'appareil_photo',
      category: 'communication',
      name: 'Matériel photo & vidéo',
      lucideIcon: 'camera',
      image: 'images/equipements/appareil_photo.png',
      desc: 'Couverture photo et communication sur les événements et missions.',
      tiers: [
        {
          level: 1,
          badge: 'Niveau 1 : Smartphone Équipé & Compact',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'Smartphone photo',
          price: 180,
          maintenanceCostAnnual: 15,
          desc: 'Prises de vue simples pour les réseaux sociaux.',
          bullets: [
            '📸 Prises de vue souvenirs de poste en plein jour convenables',
            '⚠️ Bruit numérique sur événements nocturnes ou concerts',
            '🙂 Épanouissement des personnels photographes/vidéastes sur mission',
            '📱 Excellente portée sur les publications d’événements'
          ],
          stats: { photoMoralBonus: 8, photoMotivationBonus: 10, comImpactBonus: 0.10, repBonusPerMission: 1, photoQuality: 'standard' }
        },
        {
          level: 2,
          badge: 'Niveau 2 : Boîtier Hybride Semi-Pro 4K',
          badgeColor: 'bg-blue-100 text-pc-blue border-blue-300 ring-1 ring-blue-400',
          title: 'Appareil hybride 4K',
          price: 1100,
          maintenanceCostAnnual: 45,
          desc: 'Photos et vidéos nettes pour valoriser les actions de l’antenne.',
          bullets: [
            '🌟 Clichés d’action d’excellente qualité pour valoriser les secouristes en intervention',
            '💪 Fierté et grand plaisir de reportage pour les photographes',
            '⚡ Excellente visibilité sur les publications de l’antenne',
            '🏛️ Valorise l’image d’antenne auprès des mairies et organisateurs'
          ],
          stats: { photoMoralBonus: 18, photoMotivationBonus: 22, comImpactBonus: 0.25, repBonusPerMission: 3, photoQuality: 'semipro' }
        },
        {
          level: 3,
          badge: 'Niveau 3 : Boîtier Plein Format Pro & Kit Vidéo / Gimbal',
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-purple-400',
          title: 'Boîtier pro & stabilisateur',
          price: 3400,
          maintenanceCostAnnual: 110,
          desc: 'Matériel professionnel pour reportages et communication de haut niveau.',
          bullets: [
            '🏆 Rendu visuel digne des médias nationaux et de la communication de crise',
            '🔥 Passion comblée et épanouissement des photographes',
            '🚀 Forte visibilité des publications et valorisation de l’équipe',
            '🤝 Retombées concrètes auprès des partenaires et des donateurs'
          ],
          stats: { photoMoralBonus: 30, photoMotivationBonus: 35, comImpactBonus: 0.50, repBonusPerMission: 6, photoQuality: 'pro', recruitBoost: true }
        }
      ]
    },

    brancardage_immobilisation: {
      id: 'brancardage_immobilisation',
      category: 'secours',
      name: 'Matériel d’immobilisation',
      lucideIcon: 'stretch-horizontal',
      image: 'images/equipements/brancardage_immobilisation.png',
      desc: 'Immobilisation et brancardage des victimes traumatisées.',
      tiers: [
        {
          level: 1,
          badge: 'Niveau 1 : Standard Manuel',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'Brancard & matelas coquille manuel',
          price: 350,
          maintenanceCostAnnual: 15,
          desc: 'Conditionnement standard des traumatismes avec pompe manuelle.',
          bullets: [
            '⚠️ Pompage manuel éprouvant et réarmement lent',
            '⚠️ Fatigue physique accrue des équipiers lors des portages'
          ],
          stats: { conditioningSpeedBonus: 0, fatigueReduction: 0 }
        },
        {
          level: 2,
          badge: 'Niveau 2 : Électrique & Ergonomique Pro',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400',
          title: 'Brancard léger & pompe électrique',
          price: 1400,
          maintenanceCostAnnual: 50,
          desc: 'Mise sous vide rapide et brancardage allégé pour les secouristes.',
          bullets: [
            '⚡ Réduit de 40% le temps de conditionnement de la victime',
            '💪 Préserve la santé des secouristes (-30% de fatigue sur brancardage)',
            '✓ Manipulation douce et sécurisée pour les victimes de fractures'
          ],
          stats: { conditioningSpeedBonus: 0.40, fatigueReduction: 0.30 }
        }
      ]
    },

    radio_communication: {
      id: 'radio_communication',
      category: 'secours',
      name: 'Radios & transmissions',
      lucideIcon: 'radio',
      image: 'images/equipements/radio_communication.png',
      desc: 'Communication radio entre les équipes sur le terrain et le commandement.',
      tiers: [
        {
          level: 1,
          badge: 'Niveau 1 : Analogique Basique',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'Talkies-walkies analogiques',
          price: 180,
          maintenanceCostAnnual: 10,
          desc: 'Liaison radio locale à courte portée.',
          bullets: [
            '⚠️ Risque de grésillements et perte de liaison en zone encaissée',
            '⚠️ Aucune liaison cryptée avec les autorités'
          ],
          stats: { coordinationBonus: 0, prefectureRepBonus: 0 }
        },
        {
          level: 2,
          badge: 'Niveau 2 : Numérique Pro ANTARES / DMR',
          badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 ring-1 ring-indigo-400',
          title: 'Radios numériques professionnelles',
          price: 850,
          maintenanceCostAnnual: 40,
          desc: 'Transmissions fiables et claires compatibles avec les réseaux de secours.',
          bullets: [
            '✓ Coordination fluide sans interférence sur les DPS de grande envergure',
            '✓ Appréciation renforcée par la Préfecture et le COD',
            '✓ Moins de fatigue mentale pour les chefs d’équipe'
          ],
          stats: { coordinationBonus: 0.30, prefectureRepBonus: 15 }
        }
      ]
    },

    // C. PÔLE LOGISTIQUE & VIE ASSOCIATIVE
    outillage_logistique: {
      id: 'outillage_logistique',
      category: 'logistique',
      name: 'Outillage de montage',
      lucideIcon: 'wrench',
      image: 'images/equipements/outillage_logistique.png',
      desc: 'Outils pour le montage des tentes de secours et installations.',
      tiers: [
        {
          level: 1,
          badge: 'Niveau 1 : Outillage Manuel d’Appoint',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'Caisse d’outils manuels',
          price: 75,
          maintenanceCostAnnual: 5,
          desc: 'Tournevis, marteaux et pinces pour montages basiques.',
          bullets: [
            '⚠️ Temps de montage de poste long et manuel',
            '⚠️ Effort physique supplémentaire avant la prise de poste'
          ],
          stats: { setupSpeedBonus: 0, nightFatigueReduction: 0 }
        },
        {
          level: 2,
          badge: 'Niveau 2 : Électroportatif Pro & LED Haute Puissance',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400',
          title: 'Pack électroportatif & projecteurs LED',
          price: 650,
          maintenanceCostAnnual: 30,
          desc: 'Montage rapide des structures et éclairage puissant pour la nuit.',
          bullets: [
            '⚡ Divise par deux le temps de montage et démontage de poste',
            '🌙 Baisse de 25% la fatigue lors des dispositifs de nuit',
            '✓ Efficacité logistique reconnue par les organisateurs'
          ],
          stats: { setupSpeedBonus: 0.50, nightFatigueReduction: 0.25 }
        }
      ]
    },

    vetements_eup: {
      id: 'vetements_eup',
      category: 'tenues',
      name: 'Tenues d’intervention (EPI)',
      lucideIcon: 'shirt',
      image: 'images/equipements/vetements_eup.png',
      desc: 'Tenues et équipements de protection individuelle des secouristes.',
      tiers: [
        {
          level: 1,
          badge: 'Niveau 1 : Standards Reconditionnés',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'Tenues reconditionnées',
          price: 60,
          maintenanceCostAnnual: 10,
          desc: 'Tenues d’intervention d’occasion pour équiper les équipes.',
          bullets: [
            '⚠️ Usure rapide et tissus vieillissants',
            '⚪ Confort et présentation basiques'
          ],
          stats: { moralBonus: 0, retentionBonus: 0 }
        },
        {
          level: 2,
          badge: 'Niveau 2 : Haute Visibilité Respirantes & Neuves',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400',
          title: 'Tenues haute visibilité neuves',
          price: 420,
          maintenanceCostAnnual: 30,
          desc: 'Tenues respirantes et confortables conformes aux normes de sécurité.',
          bullets: [
            '🌟 Fort engagement et excellente cohésion d’équipe des bénévoles',
            '✓ Sentiment d’appartenance et valorisation d’image renforcés',
            '✓ Réduit significativement le taux d’attrition et départs de membres'
          ],
          stats: { moralBonus: 15, retentionBonus: 0.25 }
        }
      ]
    }
  },

  // =========================================================================
  // 2. LOTS D'INTERVENTION DE RÉSERVE (Rétrocompatibilité & Crise)
  // =========================================================================
  LOTS_CATALOG: [
    {
      id: 'lot_secours_a',
      name: 'Lot A - Poste de secours',
      lucideIcon: 'tent',
      image: 'images/equipements/lot_secours_a.png',
      price: 1750,
      storageSize: 3,
      badge: 'Poste Fixe',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
      desc: 'Tente gonflable et mobilier pour accueillir et soigner les victimes sur un poste fixe.',
      bonus: 'Nécessaire pour l’ouverture d’un poste de secours fixe (DPS-ME, DPS-GE).'
    },
    {
      id: 'lot_secours_b',
      name: 'Lot B - Secours à personne',
      lucideIcon: 'briefcase',
      image: 'images/equipements/lot_secours_b.png',
      price: 850,
      storageSize: 1,
      badge: 'Secours à Personne',
      badgeColor: 'bg-blue-100 text-pc-blue border-blue-300',
      desc: 'Sac de premiers secours avec oxygénothérapie, matériel de bilan et pansements.',
      bonus: 'Dotation de base pour équiper les VPSP et binômes de premiers secours.'
    },
    {
      id: 'lot_secours_c',
      name: 'Lot C - Brancardage & relevage',
      lucideIcon: 'stretch-horizontal',
      image: 'images/equipements/lot_secours_c.png',
      price: 1250,
      storageSize: 2,
      badge: 'Brancardage & Relevage',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
      desc: 'Matelas à dépression, brancard cuillère et attelles pour les traumatismes.',
      bonus: 'Permet l’immobilisation et le relevage des blessés en toute sécurité.'
    },
    {
      id: 'lot_tronconnage',
      name: 'Lot Tronçonnage',
      lucideIcon: 'axe',
      image: 'images/equipements/lot_tronconnage.png',
      price: 1450,
      storageSize: 2,
      badge: 'Tempêtes & Dégagement',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: 'Tronçonneuses thermiques et équipements de protection pour le dégagement d’arbres.',
      bonus: 'Dégagement des routes et voies d’accès encombrées lors de tempêtes.'
    },
    {
      id: 'lot_pompage',
      name: 'Lot Pompage',
      lucideIcon: 'waves',
      image: 'images/equipements/lot_pompage.png',
      price: 1850,
      storageSize: 3,
      badge: 'Inondations & Crues',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      desc: 'Motopompes thermiques et pompes vide-caves pour évacuer les eaux d’inondation.',
      bonus: 'Pompage des caves, sous-sols et parkings inondés.'
    },
    {
      id: 'lot_eclairage',
      name: 'Lot Éclairage d’urgence',
      lucideIcon: 'lightbulb',
      image: 'images/equipements/lot_eclairage.png',
      price: 1600,
      storageSize: 2,
      badge: 'Nuit & Éclairage',
      badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      desc: 'Groupe électrogène et mâts d’éclairage LED pour sécuriser les zones d’intervention nocturnes.',
      bonus: 'Éclaire les postes médicaux et chantiers d’intervention de nuit.'
    },
    {
      id: 'lot_bachage',
      name: 'Lot Bâchage',
      lucideIcon: 'home',
      image: 'images/equipements/lot_bachage.png',
      price: 980,
      storageSize: 2,
      badge: 'Intempéries & Toitures',
      badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
      desc: 'Grandes bâches étanches et outillage de fixation pour protéger les toitures endommagées.',
      bonus: 'Mise hors d’eau d’urgence des toitures après tempêtes ou grêle.'
    },
    {
      id: 'lot_hebergement',
      name: 'Kit CHU (30 Lits Picots)',
      lucideIcon: 'bed-double',
      image: 'images/equipements/lit_picot.png',
      price: 2100,
      storageSize: 4,
      badge: 'Hébergement d’urgence',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      desc: 'Lits de camp, duvets et kits d’hygiène pour l’accueil des personnes sinistrées.',
      bonus: 'Permet d’équiper un gymnase ou un centre d’hébergement temporaire.'
    },
    {
      id: 'lot_ravitaillement',
      name: 'Lot Ravitaillement',
      lucideIcon: 'utensils',
      image: 'images/equipements/lot_ravitaillement.png',
      price: 1350,
      storageSize: 3,
      badge: 'Ravitaillement & Repas',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
      desc: 'Matériel de cuisine de crise, thermos et repas pour ravitailler intervenants et sinistrés.',
      bonus: 'Restauration chaude sur les opérations de longue durée.'
    },
    {
      id: 'lot_soutien_psy',
      name: 'Lot CAI (Soutien psychologique)',
      lucideIcon: 'heart-handshake',
      image: 'images/equipements/lot_cai.png',
      price: 1200,
      storageSize: 2,
      badge: 'Accueil & Écoute (CAI)',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      desc: 'Mobilier d’écoute, paravents et plaids pour l’accueil médico-psychologique (CAI/CUMP).',
      bonus: 'Nécessaire au déploiement d’une Cellule d’Accueil des Impliqués (CAI).'
    },
    {
      id: 'lot_poste_commandement_mobile',
      name: 'Poste de commandement mobile',
      lucideIcon: 'satellite',
      image: 'images/equipements/lot_poste_commandement_mobile.png',
      price: 2800,
      storageSize: 2,
      badge: 'Commandement & Crise',
      badgeColor: 'bg-indigo-950 text-indigo-200 border-indigo-700',
      desc: 'Mallette informatique, radio multi-bandes et cartographie pour piloter les opérations.',
      bonus: 'Permet à un véhicule léger (VL) d’assurer le commandement opérationnel.'
    },
    {
      id: 'remorque_groupe_electro',
      name: 'Remorque Groupe électrogène 50 kVA',
      lucideIcon: 'zap',
      image: 'images/equipements/remorque_groupe_electro.png',
      price: 4800,
      storageSize: 3,
      requiresTrailer: true,
      requiresTowHitch: true,
      badge: 'Énergie & Black-out',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      desc: 'Groupe électrogène diesel tractable pour réalimenter des bâtiments sensibles ou postes avancés.',
      bonus: 'Fournit de l’électricité de secours lors de coupures prolongées.'
    },
    {
      id: 'remorque_motopompe',
      name: 'Remorque Motopompe gros débit',
      lucideIcon: 'waves',
      image: 'images/equipements/remorque_motopompe.png',
      price: 3800,
      storageSize: 3,
      requiresTrailer: true,
      requiresTowHitch: true,
      badge: 'Inondations & Pompage',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      desc: 'Pompe d’épuisement haute capacité tractable pour les inondations majeures.',
      bonus: 'Évacuation rapide des grands volumes d’eau lors des crues.'
    },
    {
      id: 'lot_drone_reco',
      name: 'Pack Drone de reconnaissance',
      lucideIcon: 'camera',
      image: 'images/equipements/drone.png',
      price: 2600,
      storageSize: 1,
      badge: 'Reconnaissance aérienne',
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
      desc: 'Drone avec caméra 4K pour survoler et évaluer les zones sinistrées.',
      bonus: 'Reconnaissance aérienne rapide des inondations et zones difficiles d’accès.'
    },
    {
      id: 'lot_drone_thermique',
      name: 'Pack Drone thermique',
      lucideIcon: 'eye',
      image: 'images/equipements/drone_thermique.png',
      price: 5200,
      storageSize: 1,
      badge: 'Recherche nocturne',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      desc: 'Drone avec caméra thermique infrarouge pour la recherche de disparus.',
      bonus: 'Recherche nocturne de personnes égarées en zone boisée ou berges.'
    }
  ],

  // =========================================================================
  // 3. ÉQUIPEMENTS DE VIE D'ANTENNE & CONFORT RH
  // =========================================================================
  WORKPLACE_CATALOG: [
    {
      id: 'tablettes',
      name: 'Tablettes embarquées',
      lucideIcon: 'tablet',
      image: 'images/equipements/tablettes.png',
      price: 650,
      badge: 'Informatique embarquée',
      badgeColor: 'bg-blue-100 text-pc-blue border-blue-200',
      desc: 'Tablettes GPS avec guidage et transmission des bilans en direct.',
      bonus: '+15% de rapidité sur les interventions et navigation fluide sur le secteur.'
    },
    {
      id: 'telephone_garde',
      name: 'Téléphone de service',
      lucideIcon: 'smartphone',
      image: 'images/equipements/telephone_garde.png',
      price: 190,
      badge: 'Garde & DPS',
      badgeColor: 'bg-blue-100 text-pc-blue border-blue-200',
      desc: 'Smartphone de service évitant d\'utiliser les téléphones personnels des secouristes.',
      bonus: '+8 Moral & Préservation de la vie privée des équipiers sur chaque mission et garde.'
    },
    {
      id: 'phones',
      name: 'Téléphones d’astreinte',
      lucideIcon: 'phone',
      image: 'images/equipements/phones.png',
      price: 320,
      badge: 'Alerte & Disponibilité',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      desc: 'Téléphones avec alerte prioritaire pour mobiliser rapidement les cadres.',
      bonus: '+25% de taux de réponse favorable lors des mobilisations par SMS d’urgence.'
    },
    {
      id: 'pcs',
      name: 'Ordinateurs d’antenne',
      lucideIcon: 'laptop',
      image: 'images/equipements/pcs.png',
      price: 1100,
      badge: 'Administration',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
      desc: 'Postes informatiques pour la gestion du planning, des devis et du personnel.',
      bonus: '+25% de rapidité sur les démarches administratives, conventions et déclarations préfectorales.'
    },
    {
      id: 'fauteuils',
      name: 'Espace repos',
      lucideIcon: 'armchair',
      image: 'images/equipements/fauteuils.png',
      price: 750,
      badge: 'Espace repos',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Fauteuils inclinables et literie pour le repos des secouristes en garde.',
      bonus: 'Accélère significativement la récupération physique lors des temps de repos au local.'
    },
    {
      id: 'cafe',
      name: 'Espace café & convivialité',
      lucideIcon: 'coffee',
      image: 'images/equipements/cafe.png',
      price: 380,
      badge: 'Convivialité',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      desc: 'Machine à café et collations pour les équipes en retour de mission.',
      bonus: 'Favorise la cohésion d’équipe et le réconfort après les interventions éprouvantes.'
    }
  ],

  get CATALOG() {
    return [...this.LOTS_CATALOG, ...this.WORKPLACE_CATALOG];
  },

  // =========================================================================
  // 4. GESTION DE L'ÉTAT & INITIALISATION
  // =========================================================================
  injectState(game) {
    if (!game.workplaceEquipment) {
      game.workplaceEquipment = {};
    }
    // Rétrocompatibilité lots et équipements
    const allKeys = [
      'radios', 'tablettes', 'telephone_garde', 'phones', 'pcs', 'fauteuils', 'cafe',
      'lot_secours_a', 'lot_secours_b', 'lot_secours_c',
      'lot_tronconnage', 'lot_pompage', 'lot_eclairage', 'lot_bachage',
      'lot_hebergement', 'lot_ravitaillement', 'lot_soutien_psy',
      'lot_poste_commandement_mobile',
      'remorque_groupe_electro', 'remorque_motopompe'
    ];
    allKeys.forEach(k => {
      if (game.workplaceEquipment[k] === undefined) {
        game.workplaceEquipment[k] = 0;
      }
    });

    // Initialisation des niveaux d'équipement par défaut (Tier 1 pour chaque type)
    if (!game.equipmentTiers) {
      game.equipmentTiers = {
        mannequin_rcp_adulte: 1,
        dsa_formation: 1,
        prise_parametres: 1,
        appareil_photo: 1,
        brancardage_immobilisation: 1,
        radio_communication: game.workplaceEquipment.radios > 0 ? 2 : 1,
        outillage_logistique: 1,
        vetements_eup: 1
      };
    } else {
      // Vérifier chaque clé
      const defaultTiers = {
        mannequin_rcp_adulte: 1,
        dsa_formation: 1,
        prise_parametres: 1,
        appareil_photo: 1,
        brancardage_immobilisation: 1,
        radio_communication: 1,
        outillage_logistique: 1,
        vetements_eup: 1
      };
      Object.keys(defaultTiers).forEach(k => {
        if (game.equipmentTiers[k] === undefined) {
          game.equipmentTiers[k] = defaultTiers[k];
        }
      });
    }
  },

  // Récupérer le niveau actuel d'un équipement
  getEquipmentTier(game, itemKey) {
    this.injectState(game);
    return game.equipmentTiers[itemKey] || 1;
  },

  // Calcul du coût total de maintenance annuelle du matériel possédé
  getTotalAnnualMaintenance(game) {
    this.injectState(game);
    let total = 0;
    Object.keys(this.TIERED_EQUIPMENT_CATALOG).forEach(key => {
      const itemDef = this.TIERED_EQUIPMENT_CATALOG[key];
      const currentTierLevel = game.equipmentTiers[key] || 1;
      const tierDef = itemDef.tiers.find(t => t.level === currentTierLevel) || itemDef.tiers[0];
      if (tierDef) {
        total += tierDef.maintenanceCostAnnual || 0;
      }
    });
    return total;
  },

  // Calcul du score de modernité & fierté de l'antenne (0 à 100%)
  getEquipmentModernityScore(game) {
    this.injectState(game);
    let totalPoints = 0;
    let maxPoints = 0;
    Object.keys(this.TIERED_EQUIPMENT_CATALOG).forEach(key => {
      const itemDef = this.TIERED_EQUIPMENT_CATALOG[key];
      const maxTier = itemDef.tiers.length;
      const curTier = game.equipmentTiers[key] || 1;
      totalPoints += curTier;
      maxPoints += maxTier;
    });
    return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 50;
  },

  // =========================================================================
  // 5. ACHAT & MISE À NIVEAU (TRADE-IN AVEC REPRISE DE 30%)
  // =========================================================================
  async upgradeTier(game, itemKey, targetLevel) {
    this.injectState(game);
    const itemDef = this.TIERED_EQUIPMENT_CATALOG[itemKey];
    if (!itemDef) return;

    const currentLevel = game.equipmentTiers[itemKey] || 1;
    if (targetLevel <= currentLevel) {
      game.showToast('Niveau Déjà Possédé', `Votre antenne dispose déjà de ce niveau d'équipement (${itemDef.name}).`, 'blue');
      return;
    }

    const currentTierDef = itemDef.tiers.find(t => t.level === currentLevel);
    const targetTierDef = itemDef.tiers.find(t => t.level === targetLevel);
    if (!targetTierDef) return;

    // Reprise de l'ancien matériel à 30% de sa valeur d'achat
    const tradeInRate = 0.30;
    const tradeInValue = currentTierDef ? Math.round(currentTierDef.price * tradeInRate) : 0;
    const netPrice = Math.max(0, targetTierDef.price - tradeInValue);

    // Contrôle de trésorerie
    if (game.resources.money < netPrice) {
      game.showToast(
        'Trésorerie Insuffisante',
        `L’acquisition de « ${targetTierDef.title} » requiert ${netPrice.toLocaleString('fr-FR')} € ${tradeInValue > 0 ? `(après reprise de votre ancien matériel pour ${tradeInValue} €)` : ''}.`,
        'orange'
      );
      return;
    }

    const confirmMsg = `ACQUISITION & MODERNISATION DE MATÉRIEL :\n\n• Nouvel Équipement : ${targetTierDef.title}\n• Prix Catalogue : ${targetTierDef.price.toLocaleString('fr-FR')} €\n• Reprise Ancien Matériel (30%) : -${tradeInValue.toLocaleString('fr-FR')} €\n• Montant Net à Régler : ${netPrice.toLocaleString('fr-FR')} €\n• Maintenance Annuelle Estimée : ~${targetTierDef.maintenanceCostAnnual} €/an\n\nConfirmez-vous cette commande ?`;

    const confirmed = await window.ProtecDialog.confirm(
      confirmMsg,
      'Modernisation du Matériel',
      { confirmText: `Commander (-${netPrice} €)`, cancelText: 'Annuler' }
    );
    if (!confirmed) return;

    // Débit financier
    game.resources.money -= netPrice;
    game.equipmentTiers[itemKey] = targetLevel;

    // Enregistrement dans les finances
    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -netPrice,
        `Acquisition : ${targetTierDef.title} (Reprise ancien matériel : +${tradeInValue} €)`,
        'equipement'
      );
    }

    // Répercussion sur le moral et motivation des bénévoles
    const moralBoost = targetTierDef.stats.trainerMoralBonus || targetTierDef.stats.crewMoralBonus || targetTierDef.stats.moralBonus || 8;
    if (game.volunteers && game.volunteers.length > 0) {
      game.volunteers.forEach(v => {
        v.moral = Math.min(100, (v.moral || 75) + Math.round(moralBoost * 0.7));
        v.motivation = v.moral;
        v.humeur = v.moral;
      });
    }

    game.saveGame();
    game.updateStatsUI();

    game.showToast(
      '🎉 Matériel Réceptionné & Armé !',
      `« ${targetTierDef.title} » est désormais opérationnel ! Ancien matériel repris pour ${tradeInValue} €. Bénévoles fiers et motivés !`,
      'green'
    );

    this.renderModal(game);
  },

  // =========================================================================
  // 6. CALCUL DU VOLUME DE STOCKAGE & ACHAT DE LOTS (Rétrocompatibilité)
  // =========================================================================
  getLotsStorageUsed(game) {
    this.injectState(game);
    let used = 0;
    this.LOTS_CATALOG.forEach(lot => {
      const count = game.workplaceEquipment[lot.id] || 0;
      used += count * (lot.storageSize || 2);
    });
    return used;
  },

  hasEquipment(game, equipId) {
    this.injectState(game);
    return (game.workplaceEquipment[equipId] || 0) > 0;
  },

  getEquipmentCount(game, equipId) {
    this.injectState(game);
    return game.workplaceEquipment[equipId] || 0;
  },

  async buyEquipment(game, equipId) {
    this.injectState(game);
    const item = this.CATALOG.find(e => e.id === equipId);
    if (!item) return;

    if (game.resources.money < item.price) {
      game.showToast('Trésorerie Insuffisante', `L’achat de « ${item.name} » nécessite ${item.price.toLocaleString('fr-FR')} €.`, 'orange');
      return;
    }

    const isLot = this.LOTS_CATALOG.some(l => l.id === equipId);
    if (isLot && window.ProtecLocaux) {
      if (!window.ProtecLocaux.hasStorageRoom(game)) {
        game.showToast('Zone de Stockage Requise !', 'Votre antenne ne possède aucune zone de stockage pour entreposer ce lot volumineux. Aménagez une zone de stockage dans l’onglet Locaux !', 'orange');
        return;
      }

      const maxCap = window.ProtecLocaux.getStorageCapacity(game);
      const usedCap = window.ProtecLocaux.getCurrentStorageUsed(game);
      const needed = item.storageSize || 2;

      if (usedCap + needed > maxCap) {
        game.showToast(
          'Stockage Insuffisant !',
          `Votre réserve est trop pleine pour entreposer ce lot (+${needed} unités requises, ${usedCap}/${maxCap} occupées). Agrandissez la zone de stockage dans vos Locaux.`,
          'orange'
        );
        return;
      }
    }

    const storageMsg = isLot ? `\n(Encombrement : ${item.storageSize || 2} unités de stockage)` : '';
    const confirmed = await window.ProtecDialog.confirm(
      `Confirmez-vous l'achat de « ${item.name} » pour ${item.price.toLocaleString('fr-FR')} € ?${storageMsg}`,
      'Achat d\'Équipement',
      { confirmText: 'Acheter', cancelText: 'Annuler' }
    );
    if (!confirmed) return;

    game.resources.money -= item.price;
    game.workplaceEquipment[equipId] = (game.workplaceEquipment[equipId] || 0) + 1;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(game, -item.price, `Achat Matériel : ${item.name}`, 'equipement');
    }

    if (equipId === 'cafe') {
      game.volunteers.forEach(v => {
        v.moral = Math.min(100, (v.moral || 70) + 10);
        v.motivation = v.moral;
      });
    }

    game.saveGame();
    game.updateStatsUI();

    const notifTitle = isLot ? '📦 Lot Réceptionné à l’Antenne !' : '🛠️ Équipement Livré !';
    game.showToast(notifTitle, `« ${item.name} » est désormais opérationnel et disponible à l’antenne.`, 'green');
    this.renderModal(game);
  },

  // =========================================================================
  // 7. IMPACTS OPÉRATIONNELS EN MISSION (DPS, SAMU, INTEMPÉRIES)
  // =========================================================================
  checkMissionEquipmentTierBonus(game, mission) {
    this.injectState(game);
    const mText = `${mission.title || ''} ${mission.desc || ''}`.toLowerCase();
    const crew = mission.assignedCrew?.volunteers || [];

    // 1. Prise de Paramètres Vitaux (Bonus passifs de gestion sans alertes pop-up intrusives)
    const paramTier = game.equipmentTiers.prise_parametres || 1;
    if (paramTier === 3) {
      // Moniteur multiparamétrique ECG & Bluetooth
      const bonusRepSamu = 10;
      if (window.ProtecConventions) {
        window.ProtecConventions.adjustInstitutionalReputation(game, 'samu', bonusRepSamu, 'Bilan ECG instantané & constantes temps réel');
      }
      crew.forEach(v => {
        v.moral = Math.min(100, (v.moral || 75) + 6);
        v.motivation = v.moral;
      });
    } else if (paramTier === 2) {
      if (window.ProtecConventions) {
        window.ProtecConventions.adjustInstitutionalReputation(game, 'samu', 5, 'Bilan multiparamétrique automatique précis');
      }
    }
    // Tier 1 : Matériel standard de base, parfaitement fonctionnel, aucune alerte ni pénalité

    // 2. Brancardage & Immobilisation (Bonus passif de confort)
    const brancardTier = game.equipmentTiers.brancardage_immobilisation || 1;
    if (brancardTier === 2) {
      crew.forEach(v => {
        v.fatigue = Math.max(0, (v.fatigue || 20) - 8);
        v.energy = Math.min(100, 100 - v.fatigue);
      });
      if (mText.includes('trauma') || mText.includes('sport') || mText.includes('chute') || mission.type === 'samu') {
        game.resources.reputationScore = (game.resources.reputationScore || 0) + 12;
      }
    }

    // 3. Radios Numériques ANTARES (Bonus passif de coordination)
    const radioTier = game.equipmentTiers.radio_communication || 1;
    if (radioTier === 2 && (mission.scale?.includes('ME') || mission.scale?.includes('GE') || mission.requiredVolunteers >= 5)) {
      if (window.ProtecConventions) {
        window.ProtecConventions.adjustInstitutionalReputation(game, 'prefecture', 15, 'Coordination radio numérique ANTARES');
      }
    }

    // 4. Outillage Électroportatif Pro (Bonus passif de confort logistique)
    const outilTier = game.equipmentTiers.outillage_logistique || 1;
    if (outilTier === 2 && (mission.scale?.includes('ME') || mission.scale?.includes('GE') || mission.type === 'meteo')) {
      crew.forEach(v => {
        v.fatigue = Math.max(0, (v.fatigue || 20) - 5);
        v.energy = Math.min(100, 100 - v.fatigue);
      });
    }
  },

  checkMissionLotBonus(game, mission) {
    this.injectState(game);
    const mText = `${mission.title || ''} ${mission.desc || ''}`.toLowerCase();

    // Vérification des bonus de gammes
    this.checkMissionEquipmentTierBonus(game, mission);

    // 1. Lot Tronçonnage / Dégagement
    if ((mText.includes('arbre') || mText.includes('vent') || mText.includes('tempête') || mText.includes('dégagement') || mText.includes('voie')) && this.hasEquipment(game, 'lot_tronconnage')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 25;
      game.showToast('🪚 Lot Tronçonnage Déployé !', 'Les tronçonneuses et tire-forts ont permis un déblaiement rapide de la voirie. Voie sécurisée !', 'emerald');
    }

    // 2. Lot Épuisement / Pompage
    if ((mText.includes('inondation') || mText.includes('pompage') || mText.includes('crue') || mText.includes('eau') || mText.includes('pluie')) && this.hasEquipment(game, 'lot_pompage')) {
      const bonusPay = 160;
      game.resources.money += bonusPay;
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 20;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, bonusPay, 'Indemnité Pompage Municipal (Lot Épuisement)', 'prestation');
      }
      game.showToast('🚰 Lot Pompage & Épuisement !', `Motopompes thermiques déployées avec succès : caves et voiries asséchées (+${bonusPay} € indemnité mairie conventionnée) !`, 'blue');
    }

    // 3. Lot Bâchage & Consolidation
    if ((mText.includes('toiture') || mText.includes('bâchage') || mText.includes('grêle') || mText.includes('bourrasque')) && this.hasEquipment(game, 'lot_bachage')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 30;
      game.showToast('🛖 Lot Bâchage Déployé !', 'Mise hors d’eau d’urgence des toitures endommagées : habitations préservées des infiltrations avec succès !', 'amber');
    }

    // 4. Lot Éclairage d'urgence
    if ((mText.includes('nuit') || mText.includes('nocturne') || mText.includes('obscurité') || mText.includes('coupure') || mText.includes('pma') || mText.includes('recherche')) && this.hasEquipment(game, 'lot_eclairage')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 20;
      game.showToast('💡 Lot Éclairage Déployé !', 'Mâts LED 360° et ballon éclairant déployés : zone de travail sécurisée en pleine nuit !', 'yellow');
    }

    // 5. Lot Hébergement d'urgence
    if ((mText.includes('gymnase') || mText.includes('hébergement') || mText.includes('sinistrés') || mText.includes('évacuation') || mText.includes('pcs')) && this.hasEquipment(game, 'lot_hebergement')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 35;
      game.showToast('🛏️ Lot Hébergement d’Urgence !', '30 lits de camp et kits d’hygiène installés dans le gymnase d’accueil communal pour les sinistrés.', 'emerald');
    }

    // 6. Lot Ravitaillement / Cuisine de crise
    if ((mText.includes('ravitaillement') || mText.includes('longue durée') || (mission.durationHours && mission.durationHours >= 4)) && this.hasEquipment(game, 'lot_ravitaillement')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 15;
      const crewVols = mission.assignedCrew?.volunteers || [];
      crewVols.forEach(v => {
        v.energy = Math.min(100, (v.energy || 70) + 15);
        v.motivation = Math.min(100, (v.motivation || 70) + 10);
      });
      game.showToast('🍲 Lot Ravitaillement Déployé !', 'Repas et boissons chaudes servis aux secouristes et impliqués : équipages réconfortés !', 'rose');
    }

    // 7. Lot Soutien psychologique & Accueil (CAI, CHU)
    if ((mText.includes('cai') || mText.includes('impliqués') || mText.includes('psychologique') || mText.includes('novi') || mText.includes('famille')) && this.hasEquipment(game, 'lot_soutien_psy')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 40;
      game.showToast('🫂 Lot Soutien Psy & Accueil (CAI) !', 'Sas confidentiel et prise en charge humaine déployés avec succès pour les familles et impliqués !', 'purple');
    }

    // 8. Lot A, B, C
    if (this.hasEquipment(game, 'lot_secours_a')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 15;
    }
    if ((mission.type === 'samu' || mission.type === 'pompiers' || mText.includes('sport') || mText.includes('trail') || mText.includes('course') || mText.includes('trauma')) && this.hasEquipment(game, 'lot_secours_b')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 20;
    }
    if ((mission.scale?.includes('ME') || mission.scale?.includes('GE') || (mission.requiredVolunteers && mission.requiredVolunteers >= 6)) && this.hasEquipment(game, 'lot_secours_c')) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 25;
      game.showToast('⛺ Lot C Poste Fixe Déployé !', 'Tente de poste de secours et brancards de soins armés : flux de victimes parfaitement absorbé !', 'purple');
    }

    // 9. Remorque Groupe Électrogène 50 kVA (Tractée avec Boule d'attelage)
    if (this.hasEquipment(game, 'remorque_groupe_electro')) {
      const isPowerCrisis = mText.includes('coupure') || mText.includes('black-out') || mText.includes('blackout') || 
                            mText.includes('ehpad') || mText.includes('chu') || mText.includes('électricité') || 
                            mText.includes('electricite') || mText.includes('groupe') || mText.includes('énergie') || 
                            mText.includes('tempête') || mText.includes('gymnase');
      if (isPowerCrisis) {
        const hasTractorHitch = (game.vehicles || []).some(v => v.hasTowHitch && v.status !== 'indisponible');
        if (hasTractorHitch) {
          const powerBonus = 350;
          game.resources.money += powerBonus;
          game.resources.reputationScore = (game.resources.reputationScore || 0) + 45;
          if (window.ProtecFinances) {
            window.ProtecFinances.recordTransaction(game, powerBonus, 'Subvention Réalimentation Électrique d’Urgence (Remorque GE 50 kVA)', 'prestation');
          }
          game.showToast(
            '⚡ Remorque Groupe Électrogène 50 kVA Engagée !',
            `Tractée avec boule d'attelage : réseau de secours réalimenté avec succès (+${powerBonus} € subvention préfecture/ARS) !`,
            'amber'
          );
        } else {
          game.showToast(
            '⚠️ Remorque GE 50 kVA Non Tractable !',
            'Aucun véhicule doté d’une boule d’attelage disponible pour remorquer le groupe électrogène lourd.',
            'orange'
          );
        }
      }
    }

    // 10. Remorque Motopompe Grande Capacité (Tractée avec Boule d'attelage)
    if (this.hasEquipment(game, 'remorque_motopompe')) {
      const isFloodCrisis = mText.includes('inondation') || mText.includes('pompage') || mText.includes('crue') || 
                            mText.includes('ruissellement') || mText.includes('submergé') || mText.includes('eau') || 
                            mText.includes('pluie') || mText.includes('sous-sol') || mText.includes('parking');
      if (isFloodCrisis) {
        const hasTractorHitch = (game.vehicles || []).some(v => v.hasTowHitch && v.status !== 'indisponible');
        if (hasTractorHitch) {
          const pumpBonus = 280;
          game.resources.money += pumpBonus;
          game.resources.reputationScore = (game.resources.reputationScore || 0) + 40;
          if (window.ProtecFinances) {
            window.ProtecFinances.recordTransaction(game, pumpBonus, 'Majoration Pompage Lourd Communal (Remorque MPGC 120 m³/h)', 'prestation');
          }
          game.showToast(
            '🌊 Remorque Motopompe Lourd Engagée !',
            `Tractée avec boule d'attelage : épuisement grande capacité 120 m³/h (2 000 L/min) (+${pumpBonus} € subvention mairie) !`,
            'blue'
          );
        } else {
          game.showToast(
            '⚠️ Remorque Motopompe Non Tractable !',
            'Aucun véhicule doté d’une boule d’attelage disponible pour remorquer l’unité MPGC.',
            'orange'
          );
        }
      }
    }
  },

  // Navigation & onglets
  setTab(tabName, game) {
    this.activeTab = tabName;
    this.renderModal(game);
  },

  setSearchQuery(query, game) {
    this.searchQuery = query;
    this.renderModal(game);
    const input = document.getElementById('equipment-search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  },

  renderEquipementsModal(game) {
    this.renderModal(game);
  },

  formatBullet(text) {
    if (!text) return '';
    return text
      .replace(/^⚠️\s*/, '<i data-lucide="alert-triangle" class="w-3.5 h-3.5 inline text-amber-500 mr-1 flex-shrink-0"></i>')
      .replace(/^📉\s*/, '<i data-lucide="trending-down" class="w-3.5 h-3.5 inline text-rose-500 mr-1 flex-shrink-0"></i>')
      .replace(/^❌\s*/, '<i data-lucide="x" class="w-3.5 h-3.5 inline text-rose-500 mr-1 flex-shrink-0"></i>')
      .replace(/^✓\s*/, '<i data-lucide="check" class="w-3.5 h-3.5 inline text-emerald-600 mr-1 flex-shrink-0"></i>')
      .replace(/^🌟\s*/, '<i data-lucide="star" class="w-3.5 h-3.5 inline text-amber-500 mr-1 flex-shrink-0"></i>')
      .replace(/^⚡\s*/, '<i data-lucide="zap" class="w-3.5 h-3.5 inline text-blue-500 mr-1 flex-shrink-0"></i>')
      .replace(/^💪\s*/, '<i data-lucide="award" class="w-3.5 h-3.5 inline text-indigo-500 mr-1 flex-shrink-0"></i>')
      .replace(/^🏛️\s*/, '<i data-lucide="landmark" class="w-3.5 h-3.5 inline text-blue-600 mr-1 flex-shrink-0"></i>')
      .replace(/^🏆\s*/, '<i data-lucide="trophy" class="w-3.5 h-3.5 inline text-amber-500 mr-1 flex-shrink-0"></i>')
      .replace(/^🔥\s*/, '<i data-lucide="flame" class="w-3.5 h-3.5 inline text-orange-500 mr-1 flex-shrink-0"></i>')
      .replace(/^🚀\s*/, '<i data-lucide="trending-up" class="w-3.5 h-3.5 inline text-emerald-500 mr-1 flex-shrink-0"></i>')
      .replace(/^🤝\s*/, '<i data-lucide="handshake" class="w-3.5 h-3.5 inline text-sky-500 mr-1 flex-shrink-0"></i>')
      .replace(/^📱\s*/, '<i data-lucide="smartphone" class="w-3.5 h-3.5 inline text-blue-500 mr-1 flex-shrink-0"></i>')
      .replace(/^🙂\s*/, '<i data-lucide="smile" class="w-3.5 h-3.5 inline text-emerald-500 mr-1 flex-shrink-0"></i>')
      .replace(/^🌙\s*/, '<i data-lucide="moon" class="w-3.5 h-3.5 inline text-indigo-500 mr-1 flex-shrink-0"></i>')
      .replace(/^⚪\s*/, '<i data-lucide="circle" class="w-3.5 h-3.5 inline text-slate-400 mr-1 flex-shrink-0"></i>')
      .replace(/^📸\s*/, '<i data-lucide="camera" class="w-3.5 h-3.5 inline text-pink-500 mr-1 flex-shrink-0"></i>')
      .replace(/^🫀\s*/, '<i data-lucide="heart" class="w-3.5 h-3.5 inline text-rose-500 mr-1 flex-shrink-0"></i>')
      .replace(/^🏥\s*/, '<i data-lucide="cross" class="w-3.5 h-3.5 inline text-blue-600 mr-1 flex-shrink-0"></i>')
      .replace(/^🚑\s*/, '<i data-lucide="truck" class="w-3.5 h-3.5 inline text-blue-600 mr-1 flex-shrink-0"></i>');
  },

  // =========================================================================
  // 8. INTERFACE COMPLÈTE DE LA BOUTIQUE & INVENTAIRE MODULAIRE
  // =========================================================================
  renderModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Parc Matériel, Gammes d’Équipements & Inventaire';
    subtitle.textContent = 'Équipements échelonnés en gammes, vitesse d’intervention, valorisation SAMU et matériel pédagogique';
    icon.setAttribute('data-lucide', 'package-check');

    const activeTab = this.activeTab || 'secours';
    const annualMaintenance = this.getTotalAnnualMaintenance(game);
    const monthlyMaintenance = Math.round(annualMaintenance / 12);
    const modernityScore = this.getEquipmentModernityScore(game);

    // Données de stockage
    let hasStorage = false;
    let maxStorage = 0;
    let usedStorage = 0;
    if (window.ProtecLocaux) {
      hasStorage = window.ProtecLocaux.hasStorageRoom(game);
      maxStorage = window.ProtecLocaux.getStorageCapacity(game);
      usedStorage = window.ProtecLocaux.getCurrentStorageUsed(game);
    }
    const storagePercent = maxStorage > 0 ? Math.min(100, Math.round((usedStorage / maxStorage) * 100)) : 0;
    const sq = (this.searchQuery || '').toLowerCase().trim();

    // Liste des équipements à afficher selon l'onglet actif
    const allTieredItems = Object.values(this.TIERED_EQUIPMENT_CATALOG);
    const filteredTieredItems = allTieredItems.filter(item => {
      if (item.category !== activeTab) return false;
      if (!sq) return true;
      return item.name.toLowerCase().includes(sq) ||
             item.desc.toLowerCase().includes(sq) ||
             item.tiers.some(t => t.title.toLowerCase().includes(sq) || t.desc.toLowerCase().includes(sq));
    });

    body.innerHTML = `
      <div class="space-y-5">
        
        <!-- En-tête : Tableau de bord Équipements & Ratios Clés -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <!-- Trésorerie Disponible -->
          <div class="p-4 rounded-3xl bg-gradient-to-r from-pc-blue to-indigo-900 text-white flex items-center justify-between shadow-md">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                <i data-lucide="wallet" class="w-6 h-6"></i>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-white/70 block">Trésorerie Antenne</span>
                <span class="text-lg font-black mono-num">${game.resources.money.toLocaleString('fr-FR')} €</span>
              </div>
            </div>
            <button onclick="window.game.openFinancesModal()" class="px-2.5 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-[11px] font-bold transition">
              Finances
            </button>
          </div>

          <!-- Modernité & Fierté du Matériel -->
          <div class="p-4 rounded-3xl glass-card border border-slate-200 flex items-center justify-between shadow-xs">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl ${modernityScore >= 75 ? 'bg-purple-100 text-purple-800' : (modernityScore >= 50 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700')} flex items-center justify-center">
                <i data-lucide="${modernityScore >= 75 ? 'star' : 'wrench'}" class="w-6 h-6"></i>
              </div>
              <div class="space-y-0.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] uppercase font-bold text-slate-500">Modernité Flotte</span>
                  <span class="text-xs font-black mono-num ${modernityScore >= 75 ? 'text-purple-600' : 'text-slate-800'}">
                    ${modernityScore}%
                  </span>
                </div>
                <div class="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full ${modernityScore >= 75 ? 'bg-purple-600' : (modernityScore >= 50 ? 'bg-pc-blue' : 'bg-amber-500')}" style="width: ${modernityScore}%"></div>
                </div>
                <p class="text-[9.5px] text-slate-400 font-semibold">
                  ${modernityScore >= 75 ? 'Matériel connecté valorisant' : 'Matériel standard d’antenne'}
                </p>
              </div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg ${modernityScore >= 75 ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}">
              Trade-in 30%
            </span>
          </div>

          <!-- Entretien & Maintenance Annuelle -->
          <div class="p-4 rounded-3xl glass-card border border-slate-200 flex items-center justify-between shadow-xs">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <i data-lucide="wrench" class="w-6 h-6 text-amber-700"></i>
              </div>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-500 block">Maintenance & Entretien</span>
                <span class="text-sm font-black text-slate-800 mono-num">${annualMaintenance} € / an</span>
                <p class="text-[9.5px] text-slate-400 font-semibold">~${monthlyMaintenance} € / mois prélevés</p>
              </div>
            </div>
            <span class="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl flex items-center gap-1">
              <i data-lucide="check" class="w-3 h-3 text-emerald-600"></i>
              <span>Prêt O2/CT</span>
            </span>
          </div>

        </div>

        <!-- Raccourci vers la Bourse de l'Occasion -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
              <i data-lucide="tag" class="w-4 h-4"></i>
            </div>
            <div>
              <strong class="text-slate-800 text-xs block">Bourse de l'Occasion & Revente Inter-Antennes</strong>
              <span class="text-[11px] text-slate-500">Achetez du matériel révisé ou revendez vos surplus pour récupérer des fonds.</span>
            </div>
          </div>
          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button onclick="window.game.openModule('marche_occasion')" class="px-3 py-1.5 rounded-xl bg-pc-orange hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5">
              <i data-lucide="tag" class="w-3.5 h-3.5"></i>
              <span>Bourse de l'Occasion</span>
            </button>
            <button onclick="window.ProtecMarcheOccasion.openSellModal('equipment')" class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs border border-slate-300 shadow-xs transition cursor-pointer">
              Vendre du Matériel
            </button>
          </div>
        </div>

        <!-- Synthèse Visuelle des Affectations (VPSP & Salle Pédagogique) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          
          <!-- Dotation Embarquée VPSP & Postes de Secours -->
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-pc-blue flex-shrink-0">
                  <i data-lucide="truck" class="w-4 h-4"></i>
                </div>
                <div>
                  <h5 class="text-xs font-black text-slate-800 uppercase tracking-wide">Dotation Flotte VPSP & Postes</h5>
                  <p class="text-[10px] text-slate-500">Matériel embarqué dans les ambulances d'antenne</p>
                </div>
              </div>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-pc-blue">
                ${game.vehicles?.filter(v => v.type === 'VPSP').length || 1} VPSP équipés
              </span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-[10.5px]">
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[9.5px] text-slate-400 block font-bold">Constantes</span>
                <strong class="text-slate-800 font-extrabold">Niv. ${game.equipmentTiers.prise_parametres} <span class="text-[10px] text-slate-500 font-normal">(${game.equipmentTiers.prise_parametres === 3 ? 'ECG 12D' : (game.equipmentTiers.prise_parametres === 2 ? 'Auto' : 'Manuel')})</span></strong>
              </div>
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[9.5px] text-slate-400 block font-bold">Immobilisation</span>
                <strong class="text-slate-800 font-extrabold">Niv. ${game.equipmentTiers.brancardage_immobilisation} <span class="text-[10px] text-slate-500 font-normal">(${game.equipmentTiers.brancardage_immobilisation === 2 ? 'Électrique' : 'Manuel'})</span></strong>
              </div>
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[9.5px] text-slate-400 block font-bold">Réseau Radio</span>
                <strong class="text-slate-800 font-extrabold">Niv. ${game.equipmentTiers.radio_communication} <span class="text-[10px] text-slate-500 font-normal">(${game.equipmentTiers.radio_communication === 2 ? 'ANTARES' : 'PMR446'})</span></strong>
              </div>
            </div>
          </div>

          <!-- Dotation Salle Pédagogique PSC1 -->
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700 flex-shrink-0">
                  <i data-lucide="graduation-cap" class="w-4 h-4"></i>
                </div>
                <div>
                  <h5 class="text-xs font-black text-slate-800 uppercase tracking-wide">Dotation Salle Formation PSC1</h5>
                  <p class="text-[10px] text-slate-500">Matériel pédagogique grand public et interne</p>
                </div>
              </div>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                Pôle Formation Actif
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[10.5px]">
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[9.5px] text-slate-400 block font-bold">Mannequins RCP</span>
                <strong class="text-slate-800 font-extrabold">Niv. ${game.equipmentTiers.mannequin_rcp_adulte} <span class="text-[10px] text-slate-500 font-normal">(${game.equipmentTiers.mannequin_rcp_adulte === 3 ? 'QCPR' : (game.equipmentTiers.mannequin_rcp_adulte === 2 ? 'Clicker' : 'Mousse')})</span></strong>
              </div>
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[9.5px] text-slate-400 block font-bold">Simulateur DSA</span>
                <strong class="text-slate-800 font-extrabold">Niv. ${game.equipmentTiers.dsa_formation} <span class="text-[10px] text-slate-500 font-normal">(${game.equipmentTiers.dsa_formation === 2 ? 'HF' : 'Pré-prog'})</span></strong>
              </div>
            </div>
          </div>

          <!-- Dotation Média, Communication & Reportage Photo -->
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 md:col-span-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-700 flex-shrink-0">
                  <i data-lucide="camera" class="w-4 h-4"></i>
                </div>
                <div>
                  <h5 class="text-xs font-black text-slate-800 uppercase tracking-wide">Dotation Média, Communication & Reportages</h5>
                  <p class="text-[10px] text-slate-500">Appareils photo & vidéo pour photographes d'antenne (hors quotas opérationnels RNDPS)</p>
                </div>
              </div>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-pink-50 text-pink-700">
                Couverture Audiovisuelle DPS
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span class="text-[9.5px] text-slate-400 block font-bold">Appareil Photo d'Antenne</span>
                  <strong class="text-slate-800 font-extrabold">Niv. ${game.equipmentTiers.appareil_photo || 1} <span class="text-[10px] text-slate-500 font-normal">(${game.equipmentTiers.appareil_photo === 3 ? 'Plein Format & Gimbal' : (game.equipmentTiers.appareil_photo === 2 ? 'Hybride 4K Pro' : 'Smartphone')})</span></strong>
                </div>
                <span class="text-[10px] font-black ${game.equipmentTiers.appareil_photo === 3 ? 'text-purple-700 bg-purple-50' : (game.equipmentTiers.appareil_photo === 2 ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100')} px-2 py-0.5 rounded">
                  ${game.equipmentTiers.appareil_photo === 3 ? '+50% Impact Com' : (game.equipmentTiers.appareil_photo === 2 ? '+25% Impact Com' : '+10% Impact')}
                </span>
              </div>
              <div class="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span class="text-[9.5px] text-slate-400 block font-bold">Bénévoles Photographes</span>
                  <strong class="text-slate-800 font-extrabold">${game.volunteers?.filter(v => (v.skills || []).some(s => ['communication', 'photographe', 'photo'].includes(s.toLowerCase()))).length || 0} qualifié(s)</strong>
                </div>
                <span class="text-[10px] font-bold text-slate-500">
                  Motivation & Humeur boostées sur mission
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- Barre de Navigation entre les 5 Pôles d'Équipement -->
        <div class="flex p-1 bg-slate-100 rounded-2xl max-w-3xl mx-auto overflow-x-auto text-xs font-bold gap-1">
          <button onclick="window.ProtecEquipements.setTab('secours', window.game)" class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'secours' ? 'bg-white text-pc-blue shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="activity" class="w-4 h-4"></i>
            <span>Secours & Opérations</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-pc-blue">3</span>
          </button>
          <button onclick="window.ProtecEquipements.setTab('formation', window.game)" class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'formation' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="graduation-cap" class="w-4 h-4"></i>
            <span>Formation & Pédagogie</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700">2</span>
          </button>
          <button onclick="window.ProtecEquipements.setTab('communication', window.game)" class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'communication' ? 'bg-white text-pc-blue shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="camera" class="w-4 h-4"></i>
            <span>Média & Photo</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-100 text-pink-700">1</span>
          </button>
          <button onclick="window.ProtecEquipements.setTab('logistique', window.game)" class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'logistique' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="package" class="w-4 h-4"></i>
            <span>Logistique & Crise</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800">${this.LOTS_CATALOG.length}</span>
          </button>
          <button onclick="window.ProtecEquipements.setTab('tenues', window.game)" class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'tenues' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
            <i data-lucide="shirt" class="w-4 h-4"></i>
            <span>Tenues & Confort RH</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">6</span>
          </button>
        </div>

        <!-- Barre de Recherche -->
        <div class="relative max-w-xl mx-auto w-full">
          <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
          <input 
            type="text" 
            id="equipment-search-input"
            value="${this.searchQuery || ''}" 
            oninput="window.ProtecEquipements.setSearchQuery(this.value, window.game)" 
            placeholder="Rechercher (multiparamétrique, QCPR, appareil photo, brancard, radio...)" 
            class="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-slate-300 shadow-xs font-bold text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pc-blue transition"
          />
          ${this.searchQuery ? `
            <button onclick="window.ProtecEquipements.setSearchQuery('', window.game)" class="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
          ` : ''}
        </div>

        <!-- CONTENU DE L'ONGLET ACTIF -->
        <div class="space-y-6">
          
          <!-- SECTION 1 : ÉQUIPEMENTS ÉCHELONNÉS EN GAMMES (TIERS) -->
          ${filteredTieredItems.length > 0 ? `
            <div class="space-y-4">
              <div class="flex items-center justify-between border-b border-slate-200 pb-2">
                <span class="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Comparateur des Gammes de Matériel & Trade-in (Reprise 30%)
                </span>
                <span class="text-[11px] text-slate-500 font-semibold">
                  Chaque montée de gamme améliore la rapidité, la qualité des bilans et le moral des équipiers
                </span>
              </div>

              ${filteredTieredItems.map(item => {
                const currentLevel = game.equipmentTiers[item.id] || 1;
                const currentTierDef = item.tiers.find(t => t.level === currentLevel) || item.tiers[0];

                return `
                  <div class="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div class="flex items-center gap-3">
                        <div class="relative w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                          ${this.hasRealImage(item.image) ? `
                            <img src="${this.getThumb(item.image)}" 
                                 alt="${item.name}" 
                                 loading="lazy"
                                 onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${item.image}'; }"
                                 class="w-full h-full object-contain p-1" />
                          ` : `
                            <div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                              <i data-lucide="${item.lucideIcon || 'package'}" class="w-7 h-7 text-pc-blue stroke-[1.75]"></i>
                            </div>
                          `}
                        </div>
                        <div>
                          <h4 class="text-sm font-black text-slate-900 leading-tight">${item.name}</h4>
                          <p class="text-xs text-slate-500 mt-0.5">${item.desc}</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <span class="text-[10px] font-black text-slate-400 uppercase block">Dotation Actuelle</span>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Niveau ${currentLevel} : ${currentTierDef.title}
                        </span>
                      </div>
                    </div>

                    <!-- Grille Comparatrice des Niveaux de Gamme -->
                    <div class="grid grid-cols-1 md:grid-cols-${item.tiers.length} gap-3">
                      ${item.tiers.map(tier => {
                        const isCurrent = tier.level === currentLevel;
                        const isPast = tier.level < currentLevel;
                        const isNext = tier.level > currentLevel;

                        // Calcul de la reprise Trade-in (30% de l'ancien niveau)
                        const tradeInDiscount = isNext && currentTierDef ? Math.round(currentTierDef.price * 0.30) : 0;
                        const netPrice = Math.max(0, tier.price - tradeInDiscount);
                        const canAfford = game.resources.money >= netPrice;

                        return `
                          <div class="p-4 rounded-2xl border-2 flex flex-col justify-between space-y-3 transition ${isCurrent ? 'border-pc-blue bg-blue-50/20 shadow-xs ring-2 ring-pc-blue/20' : (isPast ? 'border-slate-200 bg-slate-50/60 opacity-75' : 'border-slate-200 hover:border-slate-300 bg-white')}">
                            
                            <div class="space-y-2">
                              <div class="flex items-center justify-between">
                                <span class="px-2 py-0.5 rounded text-[9.5px] font-black uppercase border ${tier.badgeColor}">
                                  ${tier.badge}
                                </span>
                                ${isCurrent ? '<span class="text-[10.5px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">✓ En service</span>' : ''}
                              </div>

                              <div>
                                <h5 class="text-xs font-black text-slate-900 leading-tight">${tier.title}</h5>
                                <div class="flex items-center gap-2 mt-1">
                                  <strong class="text-sm font-mono font-black text-slate-800">${tier.price.toLocaleString('fr-FR')} €</strong>
                                  <span class="text-[10px] text-slate-400 font-semibold">• ~${tier.maintenanceCostAnnual} €/an</span>
                                </div>
                              </div>

                              <p class="text-[11px] text-slate-600 leading-relaxed">${tier.desc}</p>

                              <!-- Avantages Clés & Modificateurs -->
                              <div class="space-y-1 pt-1 border-t border-slate-100 text-[10.5px]">
                                ${tier.bullets.map(b => `
                                  <div class="text-slate-700 font-medium leading-tight flex items-start gap-1">${this.formatBullet(b)}</div>
                                `).join('')}
                              </div>
                            </div>

                            <!-- Action : Acheter ou Mettre à Niveau avec Trade-in -->
                            <div class="pt-2 border-t border-slate-100">
                              ${isCurrent ? `
                                <div class="py-2 text-center text-xs font-black text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200">
                                  ✓ Matériel Actif à l’Antenne
                                </div>
                              ` : (isPast ? `
                                <div class="py-2 text-center text-[11px] font-bold text-slate-400 italic">
                                  Gamme précédente dépassée
                                </div>
                              ` : `
                                <button 
                                  onclick="window.ProtecEquipements.upgradeTier(window.game, '${item.id}', ${tier.level})"
                                  ${!canAfford ? 'disabled' : ''}
                                  class="w-full py-2 px-3 rounded-xl text-xs font-black shadow-xs transition flex flex-col items-center justify-center ${canAfford ? 'bg-pc-blue hover:bg-pc-blue-light text-white active:scale-95 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}"
                                >
                                  <span>Mettre à niveau (${netPrice.toLocaleString('fr-FR')} €)</span>
                                  ${tradeInDiscount > 0 ? `<span class="text-[9.5px] font-semibold text-white/80">Reprise ancien : -${tradeInDiscount} € (30%)</span>` : ''}
                                </button>
                              `)}
                            </div>

                          </div>
                        `;
                      }).join('')}
                    </div>

                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          <!-- SECTION 2 : LOTS DE CRISE (SI ONGLET LOGISTIQUE) -->
          ${activeTab === 'logistique' ? `
            <div class="space-y-4 pt-4 border-t border-slate-200">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-black text-slate-800 uppercase tracking-wide">Lots d’Intervention Spécialisés & Matériel de Crise</h4>
                  <p class="text-[11px] text-slate-500">Stockés en réserve de l'antenne pour intempéries, inondations, tempêtes et plans PCS</p>
                </div>
                <span class="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                  <i data-lucide="package" class="w-3.5 h-3.5 text-amber-700"></i>
                  <span>Réserve : ${usedStorage}/${maxStorage} unités</span>
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                ${this.LOTS_CATALOG.filter(l => !sq || l.name.toLowerCase().includes(sq) || l.desc.toLowerCase().includes(sq)).map(lot => {
                  const count = game.workplaceEquipment[lot.id] || 0;
                  const isOwned = count > 0;
                  const canAfford = game.resources.money >= lot.price;
                  const hasSpace = !hasStorage ? false : (usedStorage + lot.storageSize <= maxStorage);

                  return `
                    <div class="p-4 rounded-3xl glass-card border-2 ${isOwned ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'} flex flex-col justify-between space-y-3">
                      <div class="space-y-2">
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex items-center gap-3">
                            <div class="relative w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                              ${this.hasRealImage(lot.image) ? `
                                <img src="${this.getThumb(lot.image)}" 
                                     alt="${lot.name}" 
                                     loading="lazy"
                                     onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${lot.image}'; }"
                                     class="w-full h-full object-contain p-1" />
                              ` : `
                                <div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                  <i data-lucide="${lot.lucideIcon || 'package'}" class="w-6 h-6 text-pc-blue stroke-[1.75]"></i>
                                </div>
                              `}
                            </div>
                            <div>
                              <h5 class="text-xs font-black text-slate-900 leading-tight">${lot.name}</h5>
                              <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${lot.badgeColor}">
                                  ${lot.badge}
                                </span>
                                <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600 flex items-center gap-0.5">
                                  <i data-lucide="package" class="w-2.5 h-2.5 text-slate-500"></i>
                                  <span>${lot.storageSize} u</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div class="text-right">
                            <span class="text-xs font-black text-slate-900 mono-num block">${lot.price.toLocaleString('fr-FR')} €</span>
                            ${isOwned ? `<span class="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-800">En stock (${count})</span>` : ''}
                          </div>
                        </div>

                        <p class="text-[11px] text-slate-600 leading-relaxed">${lot.desc}</p>
                        
                        <div class="p-2.5 rounded-xl bg-white/90 border border-slate-200 text-[10.5px] text-slate-700">
                          <strong class="text-pc-blue block uppercase text-[8.5px] tracking-wider">Bonus Mission :</strong>
                          <p class="font-semibold text-slate-800">${lot.bonus}</p>
                        </div>
                      </div>

                      <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span class="text-[10px] text-slate-400 font-bold">${isOwned ? `Armé & disponible (x${count})` : 'Livraison réserve'}</span>
                        <button onclick="window.ProtecEquipements.buyEquipment(window.game, '${lot.id}')" ${(!canAfford || !hasSpace) ? 'disabled' : ''} class="px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1 ${(canAfford && hasSpace) ? 'bg-pc-blue hover:bg-pc-blue-light text-white active:scale-95 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
                          <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                          <span>${isOwned ? 'Acheter un autre' : 'Acheter'} (${lot.price} €)</span>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- SECTION 3 : ÉQUIPEMENTS DE VIE D'ANTENNE & CONFORT (SI ONGLET TENUES) -->
          ${activeTab === 'tenues' ? `
            <div class="space-y-4 pt-4 border-t border-slate-200">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-black text-slate-800 uppercase tracking-wide">Mobilier de Confort, Santé au Travail & Informatique</h4>
                  <p class="text-[11px] text-slate-500">Améliore la régénération d'énergie au local, réduit la fatigue mentale et accélère la gestion</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                ${this.WORKPLACE_CATALOG.filter(w => !sq || w.name.toLowerCase().includes(sq) || w.desc.toLowerCase().includes(sq)).map(item => {
                  const count = game.workplaceEquipment[item.id] || 0;
                  const isOwned = count > 0;
                  const canAfford = game.resources.money >= item.price;

                  return `
                    <div class="p-4 rounded-3xl glass-card border-2 ${isOwned ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'} flex flex-col justify-between space-y-3">
                      <div class="space-y-2">
                        <div class="flex items-start justify-between gap-2">
                          <div class="flex items-center gap-3">
                            <div class="relative w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-2xs">
                              ${this.hasRealImage(item.image) ? `
                                <img src="${this.getThumb(item.image)}" 
                                     alt="${item.name}" 
                                     loading="lazy"
                                     onerror="if (!this.dataset.fallback) { this.dataset.fallback='1'; this.src='${item.image}'; }"
                                     class="w-full h-full object-contain p-1" />
                              ` : `
                                <div class="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                  <i data-lucide="${item.lucideIcon || 'armchair'}" class="w-6 h-6 text-pc-blue stroke-[1.75]"></i>
                                </div>
                              `}
                            </div>
                            <div>
                              <h5 class="text-xs font-black text-slate-900 leading-tight">${item.name}</h5>
                              <span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase border ${item.badgeColor}">
                                ${item.badge}
                              </span>
                            </div>
                          </div>
                          <div class="text-right">
                            <span class="text-xs font-black text-slate-900 mono-num block">${item.price.toLocaleString('fr-FR')} €</span>
                            ${isOwned ? `<span class="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-800">Équipé (${count})</span>` : ''}
                          </div>
                        </div>

                        <p class="text-[11px] text-slate-600 leading-relaxed">${item.desc}</p>
                        
                        <div class="p-2.5 rounded-xl bg-white/90 border border-slate-200 text-[10.5px] text-slate-700">
                          <strong class="text-pc-blue block uppercase text-[8.5px] tracking-wider">Bonus RH & Confort :</strong>
                          <p class="font-semibold text-slate-800">${item.bonus}</p>
                        </div>
                      </div>

                      <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span class="text-[10px] text-slate-400 font-bold">${isOwned ? 'Matériel actif au local' : 'Installation immédiate'}</span>
                        <button onclick="window.ProtecEquipements.buyEquipment(window.game, '${item.id}')" ${!canAfford ? 'disabled' : ''} class="px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1 ${canAfford ? 'bg-pc-blue hover:bg-pc-blue-light text-white active:scale-95 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}">
                          <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                          <span>${isOwned ? 'Renouveler' : 'Acheter'} (${item.price} €)</span>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Chargement dynamique du catalogue personnalisé de matériel configuré par l'admin
  loadCustomCatalog() {
    try {
      const stored = localStorage.getItem('protec_custom_equipment_catalog');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.LOTS_CATALOG = parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur chargement catalogue personnalisé matériel:', e);
    }
  }
};

// Initialisation immédiate du catalogue personnalisé s'il existe
try {
  if (window.ProtecEquipements && typeof window.ProtecEquipements.loadCustomCatalog === 'function') {
    window.ProtecEquipements.loadCustomCatalog();
  }
} catch (e) {}

