/**
 * PROTEC LIVE - MODULE COMMUNICATION, RÉSEAUX SOCIAUX & RAYONNEMENT D'ANTENNE
 * 
 * 1. PUBLICATIONS GRATUITES SUR LES RÉSEAUX SOCIAUX (0 €) :
 *    - Actions manuelles régulières pour valoriser l'antenne et stimuler l'activité.
 *    - Jauge de visibilité numérique (0 à 100%) affectant les sollicitations et le recrutement.
 *    - Automatisation possible via délégation à un salarié permanent (Community Manager).
 * 
 * 2. CAMPAGNES SPONSORISÉES & MÉDIAS (Affichage mairie, presse, etc.).
 */

window.ProtecCommunication = {
  currentTab: 'social_media', // 'social_media' | 'sponsored_campaigns'

  // Thématiques de publication gratuite sur les réseaux sociaux (0 €)
  SOCIAL_POST_THEMES: [
    {
      id: 'crise',
      title: 'Mobilisation Crise, Intempéries & Soutien Populations',
      icon: 'alert-triangle',
      emoji: '🚨',
      color: 'red',
      badge: 'Urgence & Institutions',
      desc: 'Mettre en lumière l’action de nos secouristes sur les crises, plans d’hébergement d’urgence et intempéries (reconnaissance SAMU, SDIS, Préfecture et grand public).',
      sampleText: 'Mobilisation sans relâche de nos équipiers sur le plan d’urgence départemental ! Accueil des sinistrés, réconfort et coordination avec les services de secours du 15 et 18. Fiers de notre engagement républicain. 🧡💙 #Crise #ProtectionCivile #Solidarite #Secours',
      visibilityGain: 28,
      repGain: 18,
      rewardType: 'reconnaissance_services'
    },
    {
      id: 'dps',
      title: 'Bilan de Mission & Dispositif du Week-End',
      icon: 'camera',
      emoji: '📸',
      color: 'blue',
      badge: 'Terrain & Opérationnel',
      desc: 'Valoriser les secouristes mobilisés sur le dernier poste de secours (course, concert, événement local).',
      sampleText: 'Fiers de nos bénévoles engagés ce week-end pour assurer la sécurité du public ! Une équipe soudée et prête à intervenir à tout instant. 🧡💙 #ProtectionCivile #Secourisme #Bénévolat',
      visibilityGain: 22,
      repGain: 10,
      rewardType: 'devis_boost'
    },
    {
      id: 'evenement',
      title: 'Grands Événements, Festivals & Manifestations Sportives',
      icon: 'trophy',
      emoji: '🏆',
      color: 'sky',
      badge: 'Organisateurs & Partenaires',
      desc: 'Communication ciblée pour valoriser notre savoir-faire auprès des comités des fêtes, clubs sportifs et festivals locaux.',
      sampleText: 'Vous organisez une compétition sportive, un concert ou un festival ? Nos équipes conçoivent des Dispositifs Prévisionnels de Secours adaptés et certifiés. Demandez votre devis sur notre site officiel ! 🏃‍♂️🎪 #DPS #Evenementiel #Secourisme',
      visibilityGain: 25,
      repGain: 14,
      rewardType: 'devis_boost'
    },
    {
      id: 'materiel',
      title: 'Focus Véhicule & Matériel d’Urgence',
      icon: 'truck',
      emoji: '🚑',
      color: 'orange',
      badge: 'Moyens & Rigueur',
      desc: 'Présentation de notre VPSP et des équipements de secours (DAE, oxygène, lots de prompt secours).',
      sampleText: 'Zoom sur notre VPSP réarmé et vérifié par nos équipes. Matériel de pointe opérationnel 24h/24 au service des citoyens ! 🚑✨ #Urgence #Secours #VPSP',
      visibilityGain: 18,
      repGain: 8,
      rewardType: 'confiance'
    },
    {
      id: 'prevention',
      title: 'Minute Prévention : Gestes qui Sauvent & PSC1',
      icon: 'graduation-cap',
      emoji: '🎓',
      color: 'emerald',
      badge: 'Pédagogie Citoyenne',
      desc: 'Conseil pratique de premier secours pour inciter la population à s’inscrire en formation.',
      sampleText: 'Le saviez-vous ? En cas d’arrêt cardiaque, chaque minute sans massage réduit les chances de survie de 10%. Formez-vous au PSC 1 avec nous ! 🩺❤️ #GestesQuiSauvent #PSC1 #SauverDesVies',
      visibilityGain: 20,
      repGain: 12,
      rewardType: 'formation_boost'
    },
    {
      id: 'recrutement',
      title: 'Appel à Engagement : Rejoignez l’Équipe !',
      icon: 'user-plus',
      emoji: '🤝',
      color: 'purple',
      badge: 'Ressources Humaines',
      desc: 'Témoignage d’engagement pour susciter des vocations et recruter de nouveaux secouristes.',
      sampleText: 'Envie de donner du sens à votre temps libre et d’apprendre à sauver des vies ? Rejoignez notre famille de secouristes bénévoles ! Inscriptions ouvertes. 🤝💪 #Engagement #Recrutement #Benevole',
      visibilityGain: 25,
      repGain: 10,
      rewardType: 'recrutement_boost'
    },
    {
      id: 'donateurs',
      title: 'Remerciements aux Donateurs & Partenaires',
      icon: 'heart',
      emoji: '💙',
      color: 'pink',
      badge: 'Générosité & Soutien',
      desc: 'Mettre en avant l’utilité des dons citoyens pour financer nos trousses de secours et gilets.',
      sampleText: 'Un immense merci à nos donateurs et aux commerçants locaux pour leur générosité. Vos dons nous permettent de renouveler nos trousses d’urgence ! 💙🙏 #Merci #Soutien #Solidarite',
      visibilityGain: 18,
      repGain: 10,
      rewardType: 'dons_boost'
    }
  ],

  // Campagnes sponsorisées historiques avec ciblage thématique par type de mission
  SUBJECTS: [
    {
      id: 'dps',
      title: 'Campagne Ciblée : Dispositifs de Secours (DPS Événements)',
      badge: 'Impact Devis DPS',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      desc: 'Campagne concentrée à 100% sur les organisateurs sportifs, mairies et comités des fêtes du département pour attirer des demandes de DPS.',
      effect: 'Boost massif et ciblé sur les demandes de devis de DPS reçues par l\'antenne.',
      icon: 'shield-check'
    },
    {
      id: 'crise',
      title: 'Rayonnement Crise & Partenariats Institutionnels',
      badge: 'Reconnaissance Services Publics',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
      desc: 'Met en valeur notre engagement de protection des populations auprès de la Préfecture, du SAMU, du SDIS et des mairies.',
      effect: 'Renforce durablement la confiance des institutions et de la régulation des secours.',
      icon: 'alert-triangle'
    },
    {
      id: 'recrutement',
      title: 'Campagne de Recrutement de Nouveaux Bénévoles',
      badge: 'Ressources Humaines',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      desc: 'Valorise l\'engagement associatif et suscite de nouvelles vocations de secouristes.',
      effect: 'Attire de nouvelles candidatures de bénévoles motivés.',
      icon: 'user-plus'
    },
    {
      id: 'formation',
      title: 'Sensibilisation Gestes qui Sauvent, PSC 1 & SST Entreprises',
      badge: 'Formations Payantes',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      desc: 'Encourage le grand public et les entreprises locales à se former dans notre salle de formation.',
      effect: 'Augmente le taux de remplissage des sessions et les demandes d\'entreprises (+revenus).',
      icon: 'graduation-cap'
    },
    {
      id: 'dons',
      title: 'Appel aux Dons Citoyens & Mécénat d\'Entreprise',
      badge: 'Trésorerie & Dons',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Appel à la générosité des citoyens et des entreprises pour financer nos équipements d\'urgence.',
      effect: 'Génère des rentrées d\'argent régulières par micro-dons citoyens.',
      icon: 'coins'
    },
    {
      id: 'retex',
      title: 'Retour d\'Expérience (RETEX) & Valorisation Équipe',
      badge: 'Notoriété & Image',
      badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
      desc: 'Reportage photo et retex valorisant l\'action exemplaire de nos secouristes en intervention.',
      effect: 'Forte hausse de réputation générale auprès du grand public.',
      icon: 'award'
    }
  ],

  CHANNELS: [
    {
      id: 'reseaux',
      name: 'Sponsoring Réseaux Sociaux (Meta Ads, TikTok Ads)',
      cost: 120,
      durationDays: 7,
      multiplier: 1.2,
      icon: 'share-2'
    },
    {
      id: 'affichage',
      name: 'Affichage Municipal & Bulletins de Mairie',
      cost: 80,
      durationDays: 7,
      multiplier: 1.0,
      icon: 'map-pin'
    },
    {
      id: 'presse',
      name: 'Presse Quotidienne Régionale & Médias Locaux',
      cost: 220,
      durationDays: 5,
      multiplier: 1.8,
      icon: 'newspaper'
    }
  ],

  // Initialisation de l'état Réseaux Sociaux & Visibilité
  injectState(game) {
    if (!game.commData) {
      game.commData = {
        activeCampaign: null,
        history: [],
        totalDonationsGenerated: 0,
        totalRecruitsGenerated: 0
      };
    }

    if (!game.socialMedia) {
      game.socialMedia = {
        visibilityScore: 5,        // Score de visibilité naissant d'une nouvelle antenne
        lastPostTimestamp: 0,
        totalPosts: 0,
        totalLikes: 0,
        totalShares: 0,
        autoPilotSalarieId: null,   // Salarié délégué en Community Manager
        feed: []
      };
    }

    if (!Array.isArray(game.photoFolders)) {
      game.photoFolders = [];
    }

    if (!Array.isArray(game.publicReviews)) {
      game.publicReviews = [];
    }

    if (!game.antenneWebsite) {
      game.antenneWebsite = {
        freshness: 100,                  // Site flambant neuf inauguré
        lastUpdatedTimestamp: Date.now(),
        totalVisits: 8,                  // Quelques visites de curieux locaux
        quotesRequestedOnline: 0,
        autoPilotSalarieId: null,       // Salarié délégué à la maintenance du site
        onlineQuoteFormActive: true,
        showTrainingSchedule: true
      };
    }

    // Assainissement dynamique : si l'antenne est toute nouvelle (0 mission terminée),
    // purger les anciens faux posts et faux avis fictifs d'exemple
    const completedMissionsCount = (game.missions || []).filter(m => m.status === 'completed').length;
    if (completedMissionsCount === 0) {
      if (game.socialMedia && Array.isArray(game.socialMedia.feed)) {
        const hasMockPosts = game.socialMedia.feed.some(p => p.id === 'post-init-1' || p.id === 'post-init-2');
        if (hasMockPosts) {
          game.socialMedia.feed = game.socialMedia.feed.filter(p => p.id !== 'post-init-1' && p.id !== 'post-init-2');
          game.socialMedia.totalPosts = game.socialMedia.feed.length;
          game.socialMedia.totalLikes = game.socialMedia.feed.reduce((sum, p) => sum + (p.likes || 0), 0);
          game.socialMedia.totalShares = game.socialMedia.feed.reduce((sum, p) => sum + (p.shares || 0), 0);
          if (game.socialMedia.feed.length === 0) {
            game.socialMedia.visibilityScore = Math.min(10, game.socialMedia.visibilityScore || 5);
          }
        }
      }

      if (Array.isArray(game.publicReviews)) {
        game.publicReviews = game.publicReviews.filter(r => !String(r.id).startsWith('rev-init-'));
      }

      if (game.resources && (!game.resources.followers || game.resources.followers === 140)) {
        game.resources.followers = 20; // 20 abonnés locaux fondateurs
      }

      if (game.antenneWebsite && (game.antenneWebsite.totalVisits >= 1400 || game.antenneWebsite.quotesRequestedOnline >= 10)) {
        game.antenneWebsite.totalVisits = 8;
        game.antenneWebsite.quotesRequestedOnline = 0;
      }
    }
  },

  // Actualiser manuellement le site internet de l'antenne
  updateAntenneWebsite(game) {
    this.injectState(game);
    const web = game.antenneWebsite;
    web.freshness = 100;
    web.lastUpdatedTimestamp = Date.now();
    web.totalVisits = (web.totalVisits || 0) + Math.floor(40 + Math.random() * 25);
    web.quotesRequestedOnline = (web.quotesRequestedOnline || 0) + 1;
    if (game.resources) {
      game.resources.reputationScore = (game.resources.reputationScore || 0) + 12;
    }
    if (typeof game.saveGame === 'function') game.saveGame();
    if (typeof game.showToast === 'function') {
      game.showToast(
        '🌐 Site Internet Actualisé !',
        'Le site officiel de votre antenne est à 100% à jour (actualités, formulaire devis DPS en ligne, formations). Les organisateurs locaux le remarquent immédiatement !',
        'green'
      );
    }
    this.renderModal(game);
  },

  // Déléguer la mise à jour du site internet à un salarié permanent
  delegateWebsiteAutoPilot(game, salarieId) {
    this.injectState(game);
    game.antenneWebsite.autoPilotSalarieId = salarieId ? String(salarieId) : null;
    if (salarieId) {
      game.antenneWebsite.freshness = 100;
      game.antenneWebsite.lastUpdatedTimestamp = Date.now();
    }
    if (typeof game.saveGame === 'function') game.saveGame();
    this.renderModal(game);
  },

  // Réinitialisation dédiée lors du lancement officiel d'une nouvelle antenne
  resetForNewAntenna(game) {
    if (!game) game = window.game;
    if (game.resources) {
      game.resources.followers = 20; // 20 abonnés locaux fondateurs
    }
    game.socialMedia = {
      visibilityScore: 5,
      lastPostTimestamp: 0,
      totalPosts: 0,
      totalLikes: 0,
      totalShares: 0,
      autoPilotSalarieId: null,
      feed: []
    };
    game.publicReviews = [];
    game.photoFolders = [];
    game.antenneWebsite = {
      freshness: 100,
      lastUpdatedTimestamp: Date.now(),
      totalVisits: 8,
      quotesRequestedOnline: 0,
      autoPilotSalarieId: null,
      onlineQuoteFormActive: true,
      showTrainingSchedule: true
    };
  },

  // Système dynamique de Paliers de Communauté (La Commu & Followers)
  getCommunityTier(game) {
    if (!game) game = window.game;
    const followers = Math.max(0, (game.resources && game.resources.followers) || 0);

    if (followers < 100) {
      const progress = Math.min(100, Math.round((followers / 100) * 100));
      return {
        level: 1,
        title: 'Cercle Proche & Bénévoles',
        badge: 'Portée Faible (Lancement)',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        reachMultiplier: 0.20 + (followers / 100) * 0.15, // 0.20 à 0.35 (faible portée)
        followers: followers,
        nextTierAt: 100,
        progressPct: progress,
        desc: 'Page naissante vue uniquement par une poignée de proches et bénévoles. Vos publications ont peu d’impact direct mais font grandir votre communauté.',
        likesMin: 1,
        likesMax: Math.max(2, Math.floor(followers * 0.15)),
        sharesChance: 0.10,
        newFollowersRange: [3, 8],
        opportunityChance: 0.05
      };
    } else if (followers < 500) {
      const progress = Math.min(100, Math.round(((followers - 100) / 400) * 100));
      return {
        level: 2,
        title: 'Rayonnement Communal Émergent',
        badge: 'Portée Locale',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
        reachMultiplier: 0.40 + ((followers - 100) / 400) * 0.30, // 0.40 à 0.70
        followers: followers,
        nextTierAt: 500,
        progressPct: progress,
        desc: 'Les habitants et associations de votre commune suivent votre actualité. Vos publications génèrent des interactions régulières.',
        likesMin: 6,
        likesMax: Math.floor(12 + (followers * 0.06)),
        sharesChance: 0.35,
        newFollowersRange: [8, 18],
        opportunityChance: 0.25
      };
    } else if (followers < 2000) {
      const progress = Math.min(100, Math.round(((followers - 500) / 1500) * 100));
      return {
        level: 3,
        title: 'Communauté Territoriale Affirmée',
        badge: 'Forte Portée',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        reachMultiplier: 0.75 + ((followers - 500) / 1500) * 0.45, // 0.75 à 1.20
        followers: followers,
        nextTierAt: 2000,
        progressPct: progress,
        desc: 'Voix reconnue sur le bassin de vie. Vos publications suscitent l’intérêt d’organisateurs d’événements et de candidats bénévoles.',
        likesMin: 25,
        likesMax: Math.floor(35 + (followers * 0.04)),
        sharesChance: 0.65,
        newFollowersRange: [18, 45],
        opportunityChance: 0.55
      };
    } else if (followers < 6000) {
      const progress = Math.min(100, Math.round(((followers - 2000) / 4000) * 100));
      return {
        level: 4,
        title: 'Grande Notoriété Départementale',
        badge: 'Très Forte Portée',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
        reachMultiplier: 1.25 + ((followers - 2000) / 4000) * 0.55, // 1.25 à 1.80
        followers: followers,
        nextTierAt: 6000,
        progressPct: progress,
        desc: 'Rayonnement majeur à l’échelle départementale. Vos alertes et reportages déclenchent des vagues de dons et d’adhésions.',
        likesMin: 80,
        likesMax: Math.floor(100 + (followers * 0.03)),
        sharesChance: 0.90,
        newFollowersRange: [35, 90],
        opportunityChance: 0.75
      };
    } else {
      return {
        level: 5,
        title: 'Institution & Référence Régionale',
        badge: 'Portée Maximale',
        badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
        reachMultiplier: 2.0,
        followers: followers,
        nextTierAt: null,
        progressPct: 100,
        desc: 'Page incontournable suivie par les élus, les médias régionaux et des milliers de citoyens. Chaque publication a un impact massif.',
        likesMin: 200,
        likesMax: Math.floor(240 + (followers * 0.025)),
        sharesChance: 1.0,
        newFollowersRange: [60, 150],
        opportunityChance: 0.90
      };
    }
  },

  // Statistiques et calcul de la Note Avis sur 5 étoiles (Notoriété réelle méritée)
  getReviewsStats(game) {
    if (!game) game = window.game;
    this.injectState(game);

    const reviews = Array.isArray(game.publicReviews) ? game.publicReviews : [];
    const totalCount = reviews.length;

    if (totalCount === 0) {
      return {
        average: 0,
        formattedAvg: '—',
        totalCount: 0,
        reputationLabel: 'Antenne en Lancement',
        reputationDesc: 'Aucun avis recueilli pour l’instant. Réalisez des DPS et formations pour obtenir vos premières évaluations.',
        counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: []
      };
    }

    const sumStars = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    const avgScore = sumStars / totalCount;
    const roundedAvg = Math.round(avgScore * 10) / 10;

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });

    let reputationLabel = 'Bonne Réputation';
    if (roundedAvg >= 4.8) reputationLabel = 'Excellence Opérationnelle Reconnue ⭐';
    else if (roundedAvg >= 4.5) reputationLabel = 'Très Recommandé par les Organisateurs';
    else if (roundedAvg >= 4.0) reputationLabel = 'Forte Confiance Locale';
    else if (roundedAvg >= 3.0) reputationLabel = 'Notoriété en Développement';
    else reputationLabel = 'Notoriété Fragilisée (Améliorer les DPS)';

    return {
      average: roundedAvg,
      formattedAvg: roundedAvg.toFixed(1),
      totalCount: totalCount,
      reputationLabel: reputationLabel,
      counts: counts,
      reviews: reviews
    };
  },

  // Enregistrement d'un nouvel avis (suite à un DPS clôturé ou une formation)
  recordReview(game, reviewData) {
    if (!game) game = window.game;
    this.injectState(game);
    if (!Array.isArray(game.publicReviews)) game.publicReviews = [];

    const newReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      author: reviewData.author || 'Organisateur Local',
      role: reviewData.role || 'Partenaire Événementiel',
      rating: Math.max(1, Math.min(5, Number(reviewData.rating) || 5)),
      date: reviewData.date || 'Récemment',
      text: reviewData.text || 'Très belle prestation de l’équipe de secours.',
      source: reviewData.source || 'dps',
      likes: Math.floor(2 + Math.random() * 8)
    };

    game.publicReviews.unshift(newReview);
    if (game.publicReviews.length > 50) game.publicReviews.pop();
    if (typeof game.saveGame === 'function') game.saveGame();
  },

  // Vérification de l'éligibilité des thèmes de publication aux missions et moyens réels
  checkThemeEligibility(game, themeId) {
    if (!game) game = window.game;

    // 1. Thème DPS / Dispositifs du week-end
    if (themeId === 'dps') {
      const allMissions = game.missions || [];
      const completedMissions = allMissions.filter(m => m.status === 'completed');

      if (completedMissions.length === 0) {
        return {
          eligible: false,
          reason: 'Aucun événement ou dispositif de secours (DPS) n’a été réalisé récemment. Vous devez d’abord clôturer une mission pour pouvoir communiquer sur vos interventions.',
          badgeNotice: 'Mission requise',
          lastMission: null
        };
      }

      const lastMission = completedMissions[completedMissions.length - 1];
      const missionName = lastMission.title || 'Dispositif de Secours';
      const city = lastMission.commune || lastMission.city || 'notre commune';

      return {
        eligible: true,
        reason: null,
        lastMission: lastMission,
        customTitle: `Bilan : « ${missionName} »`,
        customText: `Retour sur notre mobilisation ce week-end sur « ${missionName} » à ${city} ! Nos bénévoles étaient engagés pour veiller sur le public et les participants. Bravo à toute l'équipe pour ce poste réussi ! 🧡💙 #ProtectionCivile #Secourisme #Bénévolat`
      };
    }

    // 2. Thème Matériel / Véhicules
    if (themeId === 'materiel') {
      const vehicles = game.vehicles || [];
      const vpsp = vehicles.find(v => v.type === 'VPSP');
      const vtu = vehicles.find(v => v.type === 'VTU' || v.type === 'VTP');
      const anyVeh = vpsp || vtu || vehicles[0];

      if (!anyVeh && vehicles.length === 0) {
        return {
          eligible: false,
          reason: 'L’antenne ne possède aucun véhicule opérationnel pour l’instant. Acquérez un véhicule pour communiquer sur vos moyens mobiles.',
          badgeNotice: 'Véhicule requis',
          vehicle: null
        };
      }

      const vehName = anyVeh ? (anyVeh.name || anyVeh.type) : 'VPSP';
      return {
        eligible: true,
        reason: null,
        vehicle: anyVeh,
        customTitle: `Focus Véhicule : ${anyVeh.type || 'VPSP'} « ${vehName} »`,
        customText: `Zoom sur notre ${anyVeh.type || 'VPSP'} « ${vehName} » réarmé et vérifié par nos équipes de garde. Matériel de prompt secours opérationnel 24h/24 au service des citoyens ! 🚑✨ #Urgence #Secours #VPSP #MoyensOperationnels`
      };
    }

    // 3. Thème Prévention / Formations
    if (themeId === 'prevention') {
      const openSessions = (game.sessionsFormation || []).filter(s => s.status === 'open' && s.openToPublic);
      const nextSession = openSessions[0];
      if (nextSession) {
        return {
          eligible: true,
          reason: null,
          customTitle: `Minute Prévention : Prochaine Session « ${nextSession.title} »`,
          customText: `Envie d'apprendre les gestes qui sauvent ? Notre antenne ouvre une session de formation « ${nextSession.title} » (${nextSession.publicPrice || 60} € / place) ! Réservez votre place dès aujourd'hui. 🩺❤️ #PSC1 #GestesQuiSauvent #ProtectionCivile`
        };
      }
      return {
        eligible: true,
        reason: null,
        customTitle: 'Minute Prévention : Gestes qui Sauvent & PSC 1',
        customText: 'Le saviez-vous ? En cas d’arrêt cardiaque, chaque minute sans massage réduit les chances de survie de 10%. Formez-vous aux premiers secours avec nous ! 🩺❤️ #GestesQuiSauvent #PSC1 #SauverDesVies'
      };
    }

    // Les autres thèmes (recrutement, dons) sont toujours éligibles
    return {
      eligible: true,
      reason: null
    };
  },

  // Création d'un dossier photo (sans fichiers réels) issu d'un dispositif ou d'une formation
  createPhotoFolder(game, data) {
    this.injectState(game);
    const folder = {
      id: 'folder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: data.title || 'Reportage d’Antenne',
      sourceType: data.sourceType || (data.isFormation ? 'formation' : 'mission'),
      isFormation: !!data.isFormation,
      photographerNames: data.photographerNames || 'Équipe Communication',
      createdTimestamp: Date.now(),
      createdDayIndex: game.currentDayIndex !== undefined ? game.currentDayIndex : 0,
      published: false,
      publishedTimestamp: null,
      baseReputationGain: data.baseReputationGain || (data.isFormation ? 15 : 20),
      baseVisibilityGain: data.baseVisibilityGain || (data.isFormation ? 20 : 25),
      baseLikes: data.baseLikes || (data.isFormation ? 50 : 65),
      baseShares: data.baseShares || (data.isFormation ? 10 : 15)
    };
    game.photoFolders.unshift(folder);
    if (game.photoFolders.length > 50) game.photoFolders.pop();
    return folder;
  },

  // Calcul interne de l'efficacité du dossier photo lors de la publication
  // - Les photos de formation ne perdent JAMAIS d'efficacité (toujours 100%)
  // - Les photos de mission perdent progressivement d'impact avec le temps
  // - L'impact ne descend jamais à zéro mais plafonne à un minimum de 60% de l'impact initial
  // - Strictement aucune mention ni décompte n'est affiché au joueur
  calculateFolderEffectiveness(game, folder) {
    if (!folder) return 1.0;
    if (folder.isFormation) return 1.0;

    const currentDay = game.currentDayIndex !== undefined ? game.currentDayIndex : 0;
    const createdDay = folder.createdDayIndex !== undefined ? folder.createdDayIndex : currentDay;
    const daysElapsed = Math.max(0, currentDay - createdDay);

    // Décroissance progressive basée sur le temps in-game écoulé (ou temps réel si même jour)
    const hoursElapsed = Math.max(0, (Date.now() - (folder.createdTimestamp || Date.now())) / 3600000);
    const effectiveDays = Math.max(daysElapsed, hoursElapsed / 2);

    const decay = effectiveDays * 0.10;
    return Math.max(0.60, 1.0 - decay);
  },

  // Publication d'un dossier photo sur les réseaux sociaux
  publishPhotoFolder(game, folderId) {
    this.injectState(game);
    const folder = (game.photoFolders || []).find(f => f.id === folderId);
    if (!folder) return;
    if (folder.published) {
      game.showToast('Déjà Publié', 'Ce dossier photo a déjà été partagé sur vos réseaux.', 'slate');
      return;
    }

    const eff = this.calculateFolderEffectiveness(game, folder);

    // Détection de l'appareil photo d'antenne
    const photoTier = (game.equipmentTiers && game.equipmentTiers.appareil_photo) || 1;
    const photoDef = window.ProtecEquipements?.TIERED_EQUIPMENT_CATALOG?.appareil_photo?.tiers?.find(t => t.level === photoTier);
    const photoBonusRatio = photoDef?.stats?.comImpactBonus || 0.15;
    const cameraTitle = photoDef ? photoDef.title : 'Smartphone Dédié';

    const finalMultiplier = eff * (1 + photoBonusRatio);

    const visGain = Math.round(folder.baseVisibilityGain * finalMultiplier);
    const repGain = Math.round(folder.baseReputationGain * finalMultiplier);
    const likes = Math.round(folder.baseLikes * finalMultiplier);
    const shares = Math.round(folder.baseShares * finalMultiplier);

    const oldVis = game.socialMedia.visibilityScore || 50;
    game.socialMedia.visibilityScore = Math.min(100, oldVis + visGain);
    game.socialMedia.lastPostTimestamp = Date.now();
    game.socialMedia.totalPosts = (game.socialMedia.totalPosts || 0) + 1;
    game.socialMedia.totalLikes = (game.socialMedia.totalLikes || 0) + likes;
    game.socialMedia.totalShares = (game.socialMedia.totalShares || 0) + shares;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + repGain;

    const postText = folder.isFormation
      ? `🎓 Album photo de notre session « ${folder.title} » ! Félicitations à tous les stagiaires pour leur investissement citoyen et merci aux formateurs bénévoles. 🧡💙 #ProtectionCivile #Secourisme #Formation`
      : `📸 Retour en images sur le terrain : « ${folder.title} » ! Clichés capturés par ${folder.photographerNames} (${cameraTitle}). Fiers de nos bénévoles mobilisés pour la sécurité de tous ! 🧡💙 #ProtectionCivile #Secourisme #Bénévolat`;

    game.socialMedia.feed.unshift({
      id: 'post-folder-' + folder.id + '-' + Date.now(),
      timestamp: Date.now(),
      themeId: folder.isFormation ? 'prevention' : 'dps',
      themeTitle: folder.isFormation ? 'Album Photo Formation' : 'Reportage Terrain Photo',
      authorName: folder.photographerNames,
      authorRole: folder.isFormation ? 'Pôle Formation' : 'Photographe / Vidéaste d’Antenne',
      text: postText,
      likes: likes,
      shares: shares,
      commentsCount: Math.floor(4 * finalMultiplier) + 1,
      topComment: folder.isFormation
        ? 'Super formation, très formateurs et bienveillants ! 👏'
        : 'Superbe série de clichés, bravo aux secouristes pour leur dévouement ! 📸🧡',
      isAutoPilot: false
    });
    if (game.socialMedia.feed.length > 25) game.socialMedia.feed.pop();

    folder.published = true;
    folder.publishedTimestamp = Date.now();

    game.showToast(
      'Reportage Photo Publié ! 📸',
      `Le reportage « ${folder.title} » est publié ! Les interactions des citoyens arriveront progressivement au cours des 12 prochaines heures.`,
      'purple'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // 1. ACTION MANUELLE GRATUITE (0 €) : PUBLIER SUR LES RÉSEAUX SOCIAUX
  publishManualPost(game, themeId) {
    this.injectState(game);
    const theme = this.SOCIAL_POST_THEMES.find(t => t.id === themeId) || this.SOCIAL_POST_THEMES[0];
    const now = Date.now();

    // Temps de cooldown léger de précaution (ex: 8 secondes réelles entre deux clics pour éviter le flood)
    const timeSinceLast = now - (game.socialMedia.lastPostTimestamp || 0);
    if (timeSinceLast < 6000) {
      game.showToast('Publication en cours...', 'Veuillez patienter quelques instants entre deux publications.', 'slate');
      return;
    }

    // Vérification stricte des conditions réelles de publication (ex: missions réelles nécessaires)
    const check = this.checkThemeEligibility(game, theme.id);
    if (!check.eligible) {
      game.showToast('Publication Impossible ⚠️', check.reason, 'orange');
      return;
    }

    const postTitle = check.customTitle || theme.title;
    const postText = check.customText || theme.sampleText;

    // Récupérer un secouriste ou auteur pour personnaliser
    const authorVol = game.volunteers && game.volunteers.length > 0
      ? game.volunteers[Math.floor(Math.random() * game.volunteers.length)]
      : null;

    const authorName = authorVol ? authorVol.name : 'Équipe d’Antenne';
    const authorRole = authorVol ? (authorVol.role || authorVol.rank || 'Secouriste') : 'Bénévole';

    // Détection du matériel photo d'antenne pour moduler l'impact visuel de la communication
    const photoTier = (game.equipmentTiers && game.equipmentTiers.appareil_photo) || 1;
    const photoDef = window.ProtecEquipements?.TIERED_EQUIPMENT_CATALOG?.appareil_photo?.tiers?.find(t => t.level === photoTier);
    const photoBonusRatio = photoDef?.stats?.comImpactBonus || 0.10;
    const photoTitle = photoDef ? photoDef.title : 'Smartphone Basique';

    // 1. Analyse dynamique de la communauté actuelle (La Commu)
    const commu = this.getCommunityTier(game);
    const reachMult = commu.reachMultiplier;
    const effMultiplier = reachMult * (1 + photoBonusRatio);

    // 2. Gains réels de visibilité proportionnels à l'audience (au lancement la portée est très faible)
    const oldScore = game.socialMedia.visibilityScore || 5;
    const baseGain = theme.visibilityGain || 20;
    const gain = Math.max(2, Math.round(baseGain * effMultiplier));
    const newScore = Math.min(100, oldScore + gain);
    game.socialMedia.visibilityScore = newScore;
    game.socialMedia.lastPostTimestamp = now;
    game.socialMedia.totalPosts = (game.socialMedia.totalPosts || 0) + 1;

    // 3. Réputation d'antenne bonifiée par l'audience
    const baseRep = theme.repGain || 10;
    const repGain = Math.max(1, Math.round(baseRep * effMultiplier));
    game.resources.reputationScore = (game.resources.reputationScore || 0) + repGain;

    // 4. Croissance de la communauté : chaque post fait grandir la commu !
    const [minNewF, maxNewF] = commu.newFollowersRange;
    const newFollowers = Math.max(1, Math.floor((minNewF + Math.random() * (maxNewF - minNewF + 1)) * (1 + photoBonusRatio)));
    game.resources.followers = (game.resources.followers || 0) + newFollowers;

    // 5. Interactions réalistes (Likes et partages calqués sur la commu réelle)
    const postLikes = Math.max(commu.likesMin, Math.floor((commu.likesMin + Math.random() * (commu.likesMax - commu.likesMin + 1)) * (1 + photoBonusRatio)));
    const hasShares = Math.random() < commu.sharesChance;
    const postShares = hasShares ? Math.max(1, Math.floor(postLikes * 0.18)) : 0;
    game.socialMedia.totalLikes = (game.socialMedia.totalLikes || 0) + postLikes;
    game.socialMedia.totalShares = (game.socialMedia.totalShares || 0) + postShares;

    let citizenComments = [];
    if (commu.level === 1) {
      citizenComments = [
        'Bravo pour le lancement de l’antenne ! 🧡💙',
        'Félicitations pour cette création de poste local !',
        'Courage aux premiers bénévoles engagés ! 👏',
        'On suivra vos actions sur la commune !'
      ];
    } else if (commu.level === 2) {
      citizenComments = [
        'Super initiative pour notre commune !',
        'Bravo pour votre engagement sans faille ! 👏',
        'Merci d’être là pour nous veiller !',
        'Très utile d’avoir cette équipe de secours chez nous.'
      ];
    } else {
      citizenComments = [
        'Bravo pour votre engagement sans faille ! 👏',
        'Merci la Protection Civile, on se sent en sécurité avec vous ! 🧡💙',
        'Des bénévoles au top, toujours souriants et très professionnels.',
        'Fier de voir nos jeunes s’investir autant pour la commune !',
        'Merci pour vos précieux conseils de secourisme !'
      ];
    }
    const pickedComment = citizenComments[Math.floor(Math.random() * citizenComments.length)];

    // Enregistrement dans le feed
    const newPost = {
      id: `post-${now}`,
      timestamp: now,
      themeId: theme.id,
      themeTitle: postTitle,
      authorName: authorName,
      authorRole: authorRole,
      text: postText,
      likes: postLikes,
      shares: postShares,
      newFollowers: newFollowers,
      commentsCount: Math.max(1, Math.floor(postLikes * 0.15)),
      topComment: pickedComment,
      isAutoPilot: false
    };

    game.socialMedia.feed.unshift(newPost);
    if (game.socialMedia.feed.length > 20) game.socialMedia.feed.pop();

    // 6. Retombées concrètes sur l'activité (calibrées sur la commu)
    let impactDetail = '';
    const roll = Math.random();
    if (roll < commu.opportunityChance) {
      const subRoll = Math.random();
      if (subRoll < 0.35) {
        const donation = Math.round((25 + Math.floor(Math.random() * 45)) * (commu.level >= 3 ? 2 : 1));
        game.resources.money += donation;
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(game, donation, `Micro-dons citoyens en ligne (Publication : ${theme.title})`, 'dons');
        }
        impactDetail = ` 🪙 +${donation} € de dons citoyens en ligne récoltés !`;
      } else if (subRoll < 0.70 && typeof game.generateRandomCandidature === 'function') {
        const spawned = game.generateRandomCandidature();
        if (spawned) {
          impactDetail = ' 🤝 Un citoyen inspiré a postulé pour devenir bénévole !';
        } else {
          impactDetail = ' 📢 Votre publication a suscité l’intérêt de citoyens locaux pour l’antenne.';
        }
      } else if (typeof game.generateRandomDevisOpportunity === 'function') {
        game.generateRandomDevisOpportunity();
        impactDetail = ' 📋 Un organisateur local a vu le post et dépose un devis de DPS !';
      }
    }

    const reachLabel = commu.level === 1 ? 'Portée naissante (début d’antenne)' : `Portée ${Math.round(reachMult * 100)}% (${commu.followers} abonnés)`;
    game.showToast(
      'Publication Publiée ! 📱 (0 €)',
      `Votre post sur « ${theme.title} » est en ligne (${reachLabel}). Les interactions et nouveaux abonnés arriveront progressivement au cours des 12 prochaines heures !${impactDetail}`,
      'purple'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // 2. ASSIGNATION OU RETRAIT DU SALARIÉ COMMUNITY MANAGER AUTOMATIQUE
  setAutoPilotSalarie(game, salarieId) {
    this.injectState(game);

    if (!salarieId) {
      game.socialMedia.autoPilotSalarieId = null;
      game.showToast(
        'Community Management Manuel',
        'L’automatisation des réseaux sociaux a été désactivée. Vous devrez publier manuellement pour maintenir votre visibilité.',
        'slate'
      );
    } else {
      const salarie = (game.volunteers || []).find(v => v.id === salarieId);
      if (!salarie || salarie.contractType !== 'salarie') {
        game.showToast('Erreur', 'Seul un salarié permanent sous contrat peut être assigné à cette tâche continue.', 'orange');
        return;
      }

      game.socialMedia.autoPilotSalarieId = salarieId;
      game.showToast(
        'Community Manager Assigné ! 👔',
        `${salarie.name} assure désormais automatiquement l’animation de vos réseaux sociaux dans le cadre de son forfait 151h. Votre visibilité restera au maximum !`,
        'green'
      );
    }

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // 3. HORLOGE DE JEU : BAISSE NATURELLE DE VISIBILITÉ ET ACTIONS DU SALARIÉ
  updateSocialMediaClock(game) {
    if (!game) return;
    this.injectState(game);

    const now = Date.now();
    const soc = game.socialMedia;

    // Décroissance lente de la visibilité en l'absence de publications :
    // Chaque minute in-game (si les secondes bouclent), petite dépréciation
    if (game.clock && game.clock.second === 0) {
      const hoursSinceLast = (now - (soc.lastPostTimestamp || now)) / 3600000;
      if (hoursSinceLast > 3 && soc.visibilityScore > 15) {
        soc.visibilityScore = Math.max(10, soc.visibilityScore - 2);
      }
    }

    // GESTION DU COMMUNITY MANAGER SALARIÉ AUTOMATIQUE
    if (soc.autoPilotSalarieId) {
      const salarie = (game.volunteers || []).find(v => v.id === soc.autoPilotSalarieId);
      if (salarie && salarie.contractType === 'salarie') {
        
        // Vérifier le respect du repos légal de 11h consécutives (Code du Travail Art. L3131-1)
        const isResting = salarie.status === 'repos_legal' && salarie.mandatoryRestUntil && now < salarie.mandatoryRestUntil;
        
        // Déclencher la publication automatique si la visibilité baisse sous 80% OU si le dernier post date de plus de 4h in-game
        const hoursSinceLast = (now - (soc.lastPostTimestamp || 0)) / 3600000;
        if (!isResting && (soc.visibilityScore < 80 || hoursSinceLast >= 4)) {
          
          // Sélection d'un thème adapté (strictement éligible aux événements réels)
          const eligibleThemes = this.SOCIAL_POST_THEMES.filter(t => this.checkThemeEligibility(game, t.id).eligible);
          const pickedTheme = eligibleThemes.length > 0
            ? eligibleThemes[Math.floor(Math.random() * eligibleThemes.length)]
            : (this.SOCIAL_POST_THEMES.find(t => t.id === 'recrutement') || this.SOCIAL_POST_THEMES[0]);

          const check = this.checkThemeEligibility(game, pickedTheme.id);
          const postTitle = check.customTitle || pickedTheme.title;
          const postText = check.customText || pickedTheme.sampleText;
          
          soc.visibilityScore = 98; // Maintien optimal de la visibilité
          soc.lastPostTimestamp = now;
          soc.totalPosts = (soc.totalPosts || 0) + 1;

          // Imputation horaire sur le forfait mensuel du salarié (1h de vacation administrative)
          salarie.monthlyHoursWorked = (salarie.monthlyHoursWorked || 0) + 1;
          salarie.todayHoursWorked = (salarie.todayHoursWorked || 0) + 1;

          const postLikes = Math.floor(60 + Math.random() * 95);
          const postShares = Math.floor(10 + Math.random() * 25);
          soc.totalLikes = (soc.totalLikes || 0) + postLikes;
          soc.totalShares = (soc.totalShares || 0) + postShares;

          soc.feed.unshift({
            id: `post-auto-${now}`,
            timestamp: now,
            themeId: pickedTheme.id,
            themeTitle: postTitle,
            authorName: salarie.name,
            authorRole: 'Community Manager (Salarié)',
            text: postText,
            likes: postLikes,
            shares: postShares,
            commentsCount: Math.floor(4 + Math.random() * 10),
            topComment: 'Super communication, continuez comme ça ! 👏',
            isAutoPilot: true
          });
          if (soc.feed.length > 20) soc.feed.pop();

          // Retombées positives automatiques
          game.resources.reputationScore = (game.resources.reputationScore || 0) + 6;

          // Toast discret occasionnel (throttlé)
          if (!this._lastAutoToastTime || (now - this._lastAutoToastTime > 120000)) {
            this._lastAutoToastTime = now;
            game.showToast(
              'Publication Automatique Salarié 👔',
              `${salarie.name} a publié sur les réseaux sociaux. Visibilité maintenue à 100% !`,
              'blue'
            );
          }
        }
      }
    }
  },

  // 4. LANCER UNE CAMPAGNE SPONSORISÉE PAYANTE
  async launchCampaign(game, subjectId, channelId) {
    this.injectState(game);
    const sub = this.SUBJECTS.find(s => s.id === subjectId);
    const chan = this.CHANNELS.find(c => c.id === channelId);
    if (!sub || !chan) return;

    if (game.resources.money < chan.cost) {
      game.showToast('Fonds Insuffisants', `Le lancement de cette campagne requiert ${chan.cost} €.`, 'orange');
      return;
    }

    if (game.commData.activeCampaign) {
      const confirmed = await window.ProtecDialog.confirm(
        'Une campagne sponsorisée est déjà active.\n\nSouhaitez-vous la remplacer par la nouvelle campagne ? Les effets de la précédente prendront fin immédiatement.',
        'Remplacement de Campagne',
        { confirmText: 'Remplacer la Campagne', cancelText: 'Annuler' }
      );
      if (!confirmed) {
        return;
      }
    }

    game.resources.money -= chan.cost;
    const currentDay = game.currentDayIndex || 0;

    game.commData.activeCampaign = {
      subjectId: sub.id,
      subjectTitle: sub.title,
      channelId: chan.id,
      channelName: chan.name,
      startDay: currentDay,
      endDay: currentDay + chan.durationDays,
      multiplier: chan.multiplier,
      totalGains: { money: 0, candidatures: 0, reputation: 0 }
    };

    if (!game.resources.campaigns) game.resources.campaigns = {};
    game.resources.campaigns.social = true;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -chan.cost,
        `Campagne Com : ${sub.title} (${chan.name})`,
        'dons'
      );
    }

    game.showToast(
      'Campagne Sponsorisée Lancée !',
      `Diffusion en cours pour ${chan.durationDays} jours sur le thème : « ${sub.title} ».`,
      'green'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Retombées quotidiennes de la campagne sponsorisée
  processDailyTick(game) {
    this.injectState(game);
    const camp = game.commData.activeCampaign;
    if (!camp) return;

    const currentDay = game.currentDayIndex || 0;
    if (currentDay > camp.endDay) {
      game.commData.history.push({ ...camp });
      game.commData.activeCampaign = null;
      game.showToast(
        'Campagne Sponsorisée Terminée',
        `Bilan de la campagne « ${camp.subjectTitle} » : impact positif consolidé.`,
        'blue'
      );
      game.saveGame();
      return;
    }

    switch (camp.subjectId) {
      case 'dons': {
        const donation = Math.round((70 + Math.floor(Math.random() * 80)) * camp.multiplier);
        game.resources.money += donation;
        camp.totalGains.money += donation;
        game.commData.totalDonationsGenerated += donation;
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(game, donation, 'Dons Citoyens (Campagne Sponsorisée)', 'dons');
        }
        break;
      }
      case 'recrutement': {
        if (Math.random() < 0.65 && typeof game.generateRandomCandidature === 'function') {
          const spawned = game.generateRandomCandidature();
          if (spawned) {
            camp.totalGains.candidatures += 1;
            game.commData.totalRecruitsGenerated += 1;
          }
        }
        break;
      }
      case 'formation': {
        const gainPsc1 = Math.round(90 * camp.multiplier);
        game.resources.money += gainPsc1;
        camp.totalGains.money += gainPsc1;
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(game, gainPsc1, 'Inscriptions PSC1 (Campagne Sensibilisation)', 'formation');
        }
        break;
      }
      case 'retex':
      case 'portes_ouvertes': {
        const repGain = Math.round(3 * camp.multiplier);
        game.resources.reputationScore = (game.resources.reputationScore || 0) + repGain;
        camp.totalGains.reputation += repGain;
        break;
      }
    }

    game.saveGame();
    game.updateStatsUI();
  },

  // 5. RENDU PRINCIPAL DE LA MODALE COMMUNICATION & RÉSEAUX SOCIAUX
  renderModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Communication & Réseaux Sociaux d’Antenne';
    subtitle.textContent = 'Publications gratuites régulières pour développer l’activité ou délégation automatique à un salarié';
    icon.setAttribute('data-lucide', 'megaphone');

    const soc = game.socialMedia;
    const visibility = soc.visibilityScore || 50;
    const salaries = (game.volunteers || []).filter(v => v.contractType === 'salarie');
    const autoPilotSalarie = soc.autoPilotSalarieId ? salaries.find(s => s.id === soc.autoPilotSalarieId) : null;

    // Statut de visibilité
    let visLabel = 'Visibilité Faible (L’activité ralentit)';
    let visColor = 'text-rose-600 bg-rose-50 border-rose-200';
    let visBarColor = 'bg-rose-500';
    if (visibility >= 80) {
      visLabel = '🔥 Rayonnement Maximal (Sollicitations fortes)';
      visColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
      visBarColor = 'bg-emerald-500';
    } else if (visibility >= 50) {
      visLabel = '⚡ Présence Régulière Active (Activité normale)';
      visColor = 'text-blue-700 bg-blue-50 border-blue-200';
      visBarColor = 'bg-blue-500';
    } else if (visibility >= 30) {
      visLabel = '⚠️ En Baisse (Moins de sollicitations)';
      visColor = 'text-amber-700 bg-amber-50 border-amber-200';
      visBarColor = 'bg-amber-500';
    }

    const reviewsStats = this.getReviewsStats(game);

    body.innerHTML = `
      <div class="space-y-6">

        <!-- En-tête : 3 Piliers (Visibilité, Communauté & Portée d'Audience, Avis Notoriété) -->
        <div class="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white shadow-xl space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            <!-- Colonne 1 : Visibilité & Rayonnement Numérique -->
            <div class="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-lg shrink-0">
                      📱
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <h4 class="text-xs font-black">Visibilité</h4>
                        <span class="px-1.5 py-0.2 rounded text-[9.5px] font-black ${visColor} border">
                          ${visibility}%
                        </span>
                      </div>
                      <p class="text-[10px] text-slate-300">Activité opérationnelle</p>
                    </div>
                  </div>

                  ${autoPilotSalarie ? `
                    <span class="px-1.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-black text-emerald-300 flex items-center gap-1 shrink-0">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      CM Salarié
                    </span>
                  ` : `
                    <span class="px-1.5 py-0.5 rounded-lg bg-white/10 text-[9px] font-bold text-slate-300 shrink-0">
                      Manuel
                    </span>
                  `}
                </div>

                <!-- Jauge Visibilité -->
                <div class="space-y-1 mt-3">
                  <div class="flex items-center justify-between text-[10px] text-slate-300">
                    <span class="font-bold truncate max-w-[130px]">${visLabel}</span>
                    <span class="font-mono font-black text-white">${visibility} / 100</span>
                  </div>
                  <div class="w-full bg-white/10 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div class="h-full rounded-full transition-all duration-500 ${visBarColor}" style="width: ${visibility}%"></div>
                  </div>
                </div>
              </div>

              <!-- Mini KPIs sociaux -->
              <div class="grid grid-cols-3 gap-1 pt-2 border-t border-white/10 text-center text-xs">
                <div>
                  <span class="text-[8.5px] uppercase text-slate-400 font-bold block">Posts</span>
                  <strong class="text-white mono-num text-[11px]">${soc.totalPosts || 0}</strong>
                </div>
                <div>
                  <span class="text-[8.5px] uppercase text-slate-400 font-bold block">J'aime</span>
                  <strong class="text-pink-400 mono-num text-[11px]">❤️ ${soc.totalLikes || 0}</strong>
                </div>
                <div>
                  <span class="text-[8.5px] uppercase text-slate-400 font-bold block">Partages</span>
                  <strong class="text-cyan-400 mono-num text-[11px]">🔁 ${soc.totalShares || 0}</strong>
                </div>
              </div>
            </div>

            <!-- Colonne 2 : La Communauté & Portée d'Audience (Moteur dynamique) -->
            ${(() => {
              const commu = this.getCommunityTier(game);
              return `
              <div class="space-y-3 bg-gradient-to-br from-indigo-500/15 via-white/5 to-purple-500/10 p-4 rounded-2xl border border-indigo-400/25 flex flex-col justify-between">
                <div>
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg shrink-0">
                        👥
                      </div>
                      <div>
                        <div class="flex items-center gap-1.5">
                          <h4 class="text-xs font-black">Communauté</h4>
                          <span class="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                            ${commu.followers} abonnés
                          </span>
                        </div>
                        <p class="text-[10px] text-indigo-200 font-medium">${commu.badge}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Jauge vers palier suivant -->
                  <div class="mt-3 p-2 rounded-xl bg-black/25 border border-white/10 space-y-1">
                    <div class="flex items-center justify-between text-[10px]">
                      <span class="text-indigo-200 font-bold">Portée posts : <strong>${Math.round(commu.reachMultiplier * 100)}%</strong></span>
                      <span class="text-slate-300 mono-num">${commu.nextTierAt ? `Prochain : ${commu.nextTierAt}` : 'Max'}</span>
                    </div>
                    <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden border border-white/10">
                      <div class="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" style="width: ${commu.progressPct}%"></div>
                    </div>
                  </div>
                </div>

                <div class="pt-2 border-t border-white/10 text-[10px] text-slate-300 flex items-center justify-between">
                  <span class="truncate">${commu.title}</span>
                  <span class="text-indigo-300 font-bold text-[9.5px]">Niveau ${commu.level}</span>
                </div>
              </div>
              `;
            })()}

            <!-- Colonne 3 : Notoriété & Avis Publics Mérités -->
            <div class="space-y-3 bg-gradient-to-br from-amber-500/15 via-white/5 to-purple-500/10 p-4 rounded-2xl border border-amber-400/25 flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-lg shrink-0">
                      ⭐
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <h4 class="text-xs font-black">Avis & Notoriété</h4>
                        <span class="px-1.5 py-0.2 rounded text-[9.5px] font-black ${reviewsStats.totalCount > 0 ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30' : 'bg-slate-500/20 text-slate-300 border border-slate-400/30'}">
                          ${reviewsStats.totalCount > 0 ? `${reviewsStats.formattedAvg} / 5` : 'En attente'}
                        </span>
                      </div>
                      <p class="text-[10px] text-slate-300">Évaluation des partenaires</p>
                    </div>
                  </div>
                </div>

                <!-- Étoiles dorées et libellé -->
                <div class="mt-3 p-2 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between gap-2">
                  ${reviewsStats.totalCount > 0 ? `
                    <div class="flex items-center gap-0.5 text-amber-400 text-sm leading-none">
                      ${Array.from({ length: 5 }, (_, i) => {
                        const filled = (i + 1) <= Math.round(reviewsStats.average);
                        return `<span>${filled ? '★' : '☆'}</span>`;
                      }).join('')}
                      <span class="text-xs font-black text-white ml-1 mono-num">${reviewsStats.formattedAvg}</span>
                    </div>
                    <div class="text-right">
                      <span class="text-[11px] font-bold text-amber-200 block truncate max-w-[120px]">${reviewsStats.reputationLabel}</span>
                      <span class="text-[9px] text-slate-400">${reviewsStats.totalCount} avis recueilli(s)</span>
                    </div>
                  ` : `
                    <div class="flex items-center gap-0.5 text-slate-500 text-sm leading-none">
                      <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
                      <span class="text-[10px] text-slate-400 ml-1">0 avis</span>
                    </div>
                    <div class="text-right">
                      <span class="text-[11px] font-bold text-amber-300 block">Lancement</span>
                      <span class="text-[9px] text-slate-400">En attente de DPS</span>
                    </div>
                  `}
                </div>
              </div>

              <!-- Accès direct à l'onglet avis -->
              <div class="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
                <span class="text-slate-300 italic truncate">${reviewsStats.totalCount > 0 ? 'Note méritée' : 'Aucun avis'}</span>
                <button
                  onclick="window.ProtecCommunication.currentTab = 'reviews'; window.ProtecCommunication.renderModal(window.game);"
                  class="font-black text-amber-300 hover:text-amber-100 hover:underline flex items-center gap-1 cursor-pointer shrink-0">
                  <span>Avis (${reviewsStats.totalCount})</span> ➜
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Onglets de Navigation (4 onglets clairs) -->
        <div class="flex border-b border-slate-200 dark:border-slate-700 gap-2 overflow-x-auto">
          <button
            onclick="window.ProtecCommunication.currentTab = 'website'; window.ProtecCommunication.renderModal(window.game);"
            class="pb-3 px-4 text-xs font-black transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${this.currentTab === 'website' ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}">
            <span>🌐</span> Site Internet Officiel (Facteur N°1 Devis)
          </button>
          <button
            onclick="window.ProtecCommunication.currentTab = 'social_media'; window.ProtecCommunication.renderModal(window.game);"
            class="pb-3 px-4 text-xs font-black transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${this.currentTab === 'social_media' ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}">
            <span>📱</span> Publications Gratuites Réseaux Sociaux (0 €)
          </button>
          <button
            onclick="window.ProtecCommunication.currentTab = 'reviews'; window.ProtecCommunication.renderModal(window.game);"
            class="pb-3 px-4 text-xs font-black transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${this.currentTab === 'reviews' ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}">
            <span>⭐</span> Avis & Notoriété Publique (${reviewsStats.average}/5)
          </button>
          <button
            onclick="window.ProtecCommunication.currentTab = 'sponsored_campaigns'; window.ProtecCommunication.renderModal(window.game);"
            class="pb-3 px-4 text-xs font-black transition border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${this.currentTab === 'sponsored_campaigns' ? 'border-purple-600 text-purple-700 dark:border-purple-400 dark:text-purple-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}">
            <span>📢</span> Campagnes Sponsorisées & Presse (Payant)
          </button>
        </div>

        ${this.currentTab === 'website'
          ? this.renderWebsiteTab(game, salaries)
          : (this.currentTab === 'social_media'
            ? this.renderSocialMediaTab(game, salaries, autoPilotSalarie)
            : (this.currentTab === 'reviews'
              ? this.renderReviewsTab(game, reviewsStats)
              : this.renderSponsoredCampaignsTab(game)))}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Onglet 0 : Site Internet Officiel de l'Antenne (Facteur N°1 pour les demandes de DPS)
  renderWebsiteTab(game, salaries) {
    this.injectState(game);
    const web = game.antenneWebsite;
    const freshness = Math.max(0, Math.min(100, Math.round(web.freshness ?? 90)));
    const autoPilotSalarie = salaries.find(s => String(s.id) === String(web.autoPilotSalarieId));

    // Libellé et couleur selon la fraîcheur du site
    let freshnessBadge = 'Excellente Fraîcheur (+35% de Devis DPS en continu)';
    let freshnessColor = 'bg-emerald-500';
    let freshnessBorder = 'border-emerald-200 text-emerald-800 bg-emerald-50';
    if (freshness < 40) {
      freshnessBadge = 'Site Négligé / Obsolète (Perte de confiance des organisateurs)';
      freshnessColor = 'bg-red-500';
      freshnessBorder = 'border-red-200 text-red-800 bg-red-50';
    } else if (freshness < 75) {
      freshnessBadge = 'Mise à Jour Recommandée (+15% de Devis DPS)';
      freshnessColor = 'bg-amber-500';
      freshnessBorder = 'border-amber-200 text-amber-800 bg-amber-50';
    }

    return `
      <!-- EN-TÊTE PRINCIPAL : LE SITE INTERNET FACTEUR N°1 DES DPS -->
      <div class="p-5 rounded-2xl glass-card border border-blue-200 bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-white space-y-4">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xl">🌐</span>
              <h3 class="text-base font-black text-slate-900 dark:text-white">Site Internet Officiel de l’Antenne</h3>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border ${freshnessBorder}">
                ${freshness}% Fraîcheur
              </span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Le site internet est le <strong>facteur n°1 qui booste les demandes de devis de DPS</strong> des organisateurs locaux (clubs sportifs, festivals, mairies, entreprises). Il doit être <strong>mis à jour régulièrement</strong> avec vos derniers postes, photos et plannings de formation pour garantir un flux constant de sollicitations.
            </p>
          </div>

          <!-- Bouton d'Actualisation Manuelle -->
          <div class="shrink-0 flex items-center gap-2">
            <button
              onclick="window.ProtecCommunication.updateAntenneWebsite(window.game);"
              class="px-4 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer">
              <span>🚀</span> Mettre à Jour le Site (0 €)
            </button>
          </div>
        </div>

        <!-- JAUGE DE FRAÎCHEUR VISUELLE -->
        <div class="p-4 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 space-y-2">
          <div class="flex items-center justify-between text-xs font-black">
            <span class="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <span>📊</span> Jauge de Fraîcheur des Informations Publiques :
            </span>
            <span class="mono-num ${freshness >= 75 ? 'text-emerald-600' : (freshness >= 40 ? 'text-amber-600' : 'text-red-600')}">
              ${freshness}% • ${freshnessBadge}
            </span>
          </div>
          <div class="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden p-0.5">
            <div class="h-full rounded-full ${freshnessColor} transition-all duration-500" style="width: ${freshness}%;"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Dernière synchronisation : ${web.lastUpdatedTimestamp ? new Date(web.lastUpdatedTimestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Récemment'}</span>
            <span>Impact opérationnel : <strong>+35% sollicitations DPS</strong></span>
          </div>
        </div>
      </div>

      <!-- BLOC DÉLÉGATION SALARIÉ (MAINTENANCE AUTOMATIQUE DU SITE) -->
      <div class="p-4 sm:p-5 rounded-2xl glass-card border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-white space-y-3">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <span class="text-[10px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
              <span>👔</span> Automatisation Salarié (Secrétariat & Webmaster)
            </span>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              Vous pouvez <strong>déléguer la maintenance et la mise à jour hebdomadaire du site internet à un salarié</strong> permanent de l'antenne. Il veillera à actualiser le formulaire de devis et les dates de formation pour maintenir la fraîcheur du site à 100% en continu.
            </p>
          </div>

          <!-- Sélecteur Salarié Webmaster -->
          <div class="shrink-0 flex items-center gap-2 self-start md:self-center">
            ${salaries.length === 0
              ? `
                <div class="text-xs text-slate-400 italic bg-white/70 px-3 py-2 rounded-xl border border-slate-200">
                  Aucun salarié permanent sous contrat
                </div>
              `
              : `
                <select
                  onchange="window.ProtecCommunication.delegateWebsiteAutoPilot(window.game, this.value);"
                  class="text-xs font-bold rounded-xl border border-indigo-200 bg-white text-slate-800 px-3 py-2 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm">
                  <option value="">-- Gestion Manuelle du Site --</option>
                  ${salaries.map(s => `
                    <option value="${s.id}" ${autoPilotSalarie && autoPilotSalarie.id === s.id ? 'selected' : ''}>
                      👔 ${s.name} (${s.monthlyHours || 151}h/mois)
                    </option>
                  `).join('')}
                </select>
              `
            }
          </div>
        </div>

        ${autoPilotSalarie ? `
          <div class="flex items-center gap-2 text-xs font-bold text-indigo-800 bg-indigo-100/70 px-3 py-2 rounded-xl border border-indigo-200">
            <span>✅</span>
            <span><strong>${autoPilotSalarie.name}</strong> assure la mise à jour continue du site officiel. Votre fraîcheur web est maintenue à 100% !</span>
          </div>
        ` : ''}
      </div>

      <!-- FONCTIONNALITÉS EN LIGNE DU SITE OFFICIEL -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="p-4 rounded-2xl glass-card border border-blue-200 bg-white dark:bg-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-lg">📋</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">Actif en Ligne</span>
          </div>
          <h4 class="text-xs font-black text-slate-800 dark:text-white">Formulaire Devis DPS</h4>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Permet aux mairies, clubs et organisateurs du département de déposer une demande de devis en 3 clics.
          </p>
          <div class="pt-2 border-t border-slate-100 text-[11px] text-blue-600 font-bold">
            ${web.quotesRequestedOnline || 12} devis reçus via le site
          </div>
        </div>

        <div class="p-4 rounded-2xl glass-card border border-amber-200 bg-white dark:bg-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-lg">🎓</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">Actif en Ligne</span>
          </div>
          <h4 class="text-xs font-black text-slate-800 dark:text-white">Calendrier Formations PSC & SST</h4>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Présentation des prochaines sessions grand public et entreprises avec inscription directe en ligne.
          </p>
          <div class="pt-2 border-t border-slate-100 text-[11px] text-amber-600 font-bold">
            Réservations citoyennes automatisées
          </div>
        </div>

        <div class="p-4 rounded-2xl glass-card border border-purple-200 bg-white dark:bg-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-lg">👥</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">Actif en Ligne</span>
          </div>
          <h4 class="text-xs font-black text-slate-800 dark:text-white">Espace Recrutement & Adhésion</h4>
          <p class="text-[11px] text-slate-500 leading-relaxed">
            Formulaire de contact pour les citoyens souhaitant devenir secouristes bénévoles dans l’antenne.
          </p>
          <div class="pt-2 border-t border-slate-100 text-[11px] text-purple-600 font-bold">
            ${web.totalVisits || 1420} visiteurs uniques
          </div>
        </div>
      </div>
    `;
  },

  // Onglet 1 : Publications Gratuites Réseaux Sociaux
  renderSocialMediaTab(game, salaries, autoPilotSalarie) {
    const soc = game.socialMedia;

    return `
      <!-- BLOC DÉLÉGATION SALARIÉ (COMMUNITY MANAGEMENT AUTOMATIQUE) -->
      <div class="p-4 sm:p-5 rounded-2xl glass-card border border-purple-200 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white space-y-3">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <span class="text-[10px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
              <span>👔</span> Automatisation Salarié (Community Management)
            </span>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              Pour ne pas avoir à publier manuellement tout le temps, vous pouvez <strong>déléguer la gestion des réseaux sociaux à un salarié</strong> permanent. Il publiera régulièrement pour maintenir votre visibilité à 100% dans le respect de son contrat de travail (151h mensuelles).
            </p>
          </div>

          <!-- Sélecteur Salarié -->
          <div class="shrink-0 flex items-center gap-2 self-start md:self-center">
            ${salaries.length === 0 ? `
              <div class="text-left md:text-right p-2.5 rounded-xl bg-purple-50/80 border border-purple-200">
                <span class="text-[11px] text-slate-500 font-semibold block">Aucun salarié recruté</span>
                <button onclick="window.game.openModule('recrutement')" class="text-xs font-black text-indigo-600 hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer">
                  Recruter un salarié permanent ➜
                </button>
              </div>
            ` : `
              <div class="flex items-center gap-2">
                <select
                  id="select-cm-salarie"
                  onchange="window.ProtecCommunication.setAutoPilotSalarie(window.game, this.value || null)"
                  class="text-xs font-bold bg-white border border-purple-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400">
                  <option value="">-- Gestion Manuelle Uniquement --</option>
                  ${salaries.map(sal => `
                    <option value="${sal.id}" ${autoPilotSalarie && autoPilotSalarie.id === sal.id ? 'selected' : ''}>
                      👔 ${sal.name} (${sal.role || 'Salarié'})
                    </option>
                  `).join('')}
                </select>
              </div>
            `}
          </div>
        </div>

        ${autoPilotSalarie ? `
          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between text-emerald-900">
            <div class="flex items-center gap-2">
              <span class="text-base">✅</span>
              <span><strong>${autoPilotSalarie.name}</strong> est en charge du Community Management. Les publications sont automatiques, votre visibilité reste permanente !</span>
            </div>
            <button onclick="window.ProtecCommunication.setAutoPilotSalarie(window.game, null)" class="text-xs font-bold text-rose-600 hover:underline ml-2 shrink-0">
              Arrêter l'automatisation
            </button>
          </div>
        ` : ''}
      </div>

      <!-- BLOC DOSSIERS PHOTOS D'ÉVÉNEMENTS & REPORTAGES -->
      ${(() => {
        const folders = (game.photoFolders || []).filter(f => !f.published);
        return `
        <div class="p-4 sm:p-5 rounded-2xl glass-card border border-purple-200 bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/30 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-purple-100/70">
            <div>
              <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <span>📁</span> Dossiers Photos de Reportages & Événements
              </h5>
              <p class="text-[11px] text-slate-500 mt-0.5">Dossiers d’images réalisés par vos photographes lors des missions et formations, prêts à être valorisés</p>
            </div>
            <span class="self-start sm:self-center px-2.5 py-1 rounded-full text-[10px] font-black ${folders.length > 0 ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-600'} shrink-0">
              ${folders.length} dossier(s) disponible(s)
            </span>
          </div>

          ${folders.length === 0 ? `
            <div class="p-4 rounded-xl bg-white/90 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
              <span class="text-2xl block mb-1">📸</span>
              <p class="font-bold text-slate-700">Aucun dossier photo en attente</p>
              <p class="text-[11px] text-slate-400">Pour constituer un dossier, affectez un bénévole au rôle <strong>Photographe / Vidéaste</strong> lors d'une mission ou validez des sessions de formation.</p>
            </div>
          ` : `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${folders.map(folder => `
                <div class="p-3.5 rounded-2xl border border-purple-100 hover:border-purple-300 transition bg-white flex flex-col justify-between space-y-3 shadow-2xs">
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xl">${folder.isFormation ? '🎓' : '📸'}</span>
                      <span class="px-2 py-0.5 rounded text-[9px] font-black ${folder.isFormation ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'} uppercase">
                        ${folder.isFormation ? 'Formation' : 'Dispositif de Secours'}
                      </span>
                    </div>
                    <h6 class="text-xs font-black text-slate-900 leading-snug">
                      ${folder.title}
                    </h6>
                    <p class="text-[11px] text-slate-500">
                      Prises de vue : <strong class="text-slate-700">${folder.photographerNames}</strong>
                    </p>
                  </div>

                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span class="text-[10px] font-bold text-slate-400">
                      Dossier prêt
                    </span>
                    <button
                      onclick="window.ProtecCommunication.publishPhotoFolder(window.game, '${folder.id}')"
                      class="py-1.5 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                      <span>🚀</span> Publier le Reportage (0 €)
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
        `;
      })()}

      <!-- BLOC ACTIONS MANUELLES GRATUITES (0 €) -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span>✍️</span> Publier Maintenant sur les Réseaux Sociaux (0 €)
            </h5>
            <p class="text-[11px] text-slate-500">Choisissez un sujet d'actualité pour booster immédiatement la visibilité et susciter de l'activité</p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
            Gratuit • 0 €
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          ${this.SOCIAL_POST_THEMES.map(theme => {
            const check = this.checkThemeEligibility(game, theme.id);
            const isEligible = check.eligible;
            const displayTitle = check.customTitle || theme.title;
            const displayDesc = isEligible ? theme.desc : check.reason;

            return `
            <div class="p-3.5 rounded-2xl glass-card border ${isEligible ? 'border-slate-200 hover:border-purple-400' : 'border-amber-200/90 bg-amber-50/20'} transition-all flex flex-col justify-between space-y-3 group bg-white">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xl">${theme.emoji}</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black ${isEligible ? `bg-${theme.color}-100 text-${theme.color}-800` : 'bg-amber-100 text-amber-900 border border-amber-300'} uppercase">
                    ${isEligible ? theme.badge : (check.badgeNotice || 'Condition requise')}
                  </span>
                </div>
                <h6 class="text-xs font-black ${isEligible ? 'text-slate-900 group-hover:text-purple-700' : 'text-slate-700'} transition leading-snug">
                  ${displayTitle}
                </h6>
                <p class="text-[11px] ${isEligible ? 'text-slate-500' : 'text-amber-800 font-medium'} leading-snug">
                  ${displayDesc}
                </p>

                ${isEligible && check.lastMission ? `
                  <div class="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                    <span>✅</span> <strong>${check.lastMission.title}</strong>
                  </div>
                ` : ''}
              </div>

              <div class="space-y-2 pt-2 border-t border-slate-100">
                ${(() => {
                  const commu = this.getCommunityTier(game);
                  const actualVisGain = Math.max(2, Math.round(theme.visibilityGain * commu.reachMultiplier));
                  const [minF, maxF] = commu.newFollowersRange;
                  return `
                  <div class="flex items-center justify-between text-[10px] font-bold text-slate-600">
                    <span class="${isEligible ? 'text-emerald-700' : 'text-slate-400'} font-bold">+${actualVisGain}% visibilité</span>
                    <span class="${isEligible ? 'text-indigo-700' : 'text-slate-400'} font-bold">👥 +${minF} à +${maxF} abonnés</span>
                  </div>
                  `;
                })()}
                ${isEligible ? `
                  <button
                    onclick="window.ProtecCommunication.publishManualPost(window.game, '${theme.id}')"
                    class="w-full py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>🚀</span> Publier (0 €)
                  </button>
                ` : `
                  <button
                    disabled
                    title="${check.reason}"
                    class="w-full py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-not-allowed">
                    <span>🔒</span> Mission requise pour publier
                  </button>
                `}
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- FIL D'ACTUALITÉ EN DIRECT (FEED RÉSEAUX SOCIAUX D'ANTENNE) -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
            <span>📰</span> Fil d’Actualité des Réseaux Sociaux d’Antenne
          </h5>
          <span class="text-[11px] text-slate-400">${soc.feed?.length || 0} post(s) récent(s)</span>
        </div>

        <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
          ${(!soc.feed || soc.feed.length === 0) ? `
            <div class="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
              <div class="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl border border-purple-200">
                📱
              </div>
              <div class="space-y-1">
                <h6 class="text-sm font-black text-slate-800">Aucune publication pour le moment</h6>
                <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Votre page d'antenne officielle vient d’être créée. Choisissez l'une des thématiques ci-dessus pour publier votre premier post et commencer à bâtir votre communauté !
                </p>
              </div>
            </div>
          ` : (soc.feed || []).map(post => `
            <div class="p-4 rounded-2xl glass-card border border-slate-100 hover:border-purple-200 transition space-y-2.5 bg-white">
              
              <!-- Auteur et Date -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-orange-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                    PC
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <strong class="text-xs text-slate-900">${post.authorName || 'Protection Civile'}</strong>
                      ${post.isAutoPilot ? `
                        <span class="px-1.5 py-0.2 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800">Auto Salarié</span>
                      ` : ''}
                    </div>
                    <span class="text-[10px] text-slate-400 block">${post.authorRole || 'Antenne'} • ${new Date(post.timestamp).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                ${(() => {
                const dur = post.interactionDurationMs || (12 * 3600 * 1000);
                const el = Math.max(0, Date.now() - (post.timestamp || Date.now()));
                if (el < dur) {
                  const hrs = Math.max(1, Math.ceil((dur - el) / 3600000));
                  return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shadow-2xs" title="Les réactions arrivent progressivement sur 12h"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span><span>En direct (~${hrs}h)</span></span>`;
                }
                return '<span class="text-xs text-slate-400">📱 Réseaux</span>';
              })()}
              </div>

              <!-- Contenu du Post -->
              <p class="text-xs text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                ${post.text}
              </p>

              <!-- Interactions Sociales (Likes, partages, commentaires) -->
              <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1 font-bold text-pink-600">
                    <span>❤️</span> ${post.likes || 0}
                  </span>
                  <span class="flex items-center gap-1 font-bold text-slate-600">
                    <span>🔁</span> ${post.shares || 0}
                  </span>
                  ${post.newFollowers ? `
                    <span class="flex items-center gap-1 text-indigo-600 font-bold">
                      <span>👥</span> +${post.newFollowers}
                    </span>
                  ` : ''}
                  <span class="flex items-center gap-1 text-slate-400">
                    <span>💬</span> ${post.commentsCount || 1}
                  </span>
                </div>

                ${post.topComment ? `
                  <div class="text-[10px] text-slate-500 italic truncate max-w-xs">
                    « ${post.topComment} »
                  </div>
                ` : ''}
              </div>

            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Onglet 2 : Avis & Notoriété Locale sur 5 étoiles
  renderReviewsTab(game, reviewsStats) {
    const counts = reviewsStats.counts || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const total = Math.max(1, reviewsStats.totalCount);

    return `
      <div class="space-y-4">
        <!-- Récapitulatif Global de Notoriété -->
        <div class="p-5 rounded-3xl glass-card border border-amber-200 bg-gradient-to-br from-amber-50/70 via-white to-purple-50/40 space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <!-- Note Géante & Étoiles -->
            <div class="flex items-center gap-4">
              <div class="text-center p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 shrink-0 min-w-[100px]">
                <div class="text-3xl font-black text-amber-950 mono-num leading-none">
                  ${reviewsStats.totalCount > 0 ? reviewsStats.formattedAvg : '—'}
                </div>
                <div class="text-[10px] uppercase font-bold text-amber-700 mt-1">sur 5.0</div>
                <div class="flex items-center justify-center gap-0.5 text-amber-500 text-sm mt-1">
                  ${reviewsStats.totalCount > 0 ? Array.from({ length: 5 }, (_, i) => {
                    const filled = (i + 1) <= Math.round(reviewsStats.average);
                    return `<span>${filled ? '★' : '☆'}</span>`;
                  }).join('') : '<span class="text-slate-400">☆☆☆☆☆</span>'}
                </div>
              </div>

              <div>
                <span class="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                  <span>⭐</span> Notoriété de l'Antenne auprès du Public
                </span>
                <h4 class="text-base font-black text-slate-900 mt-0.5">
                  ${reviewsStats.reputationLabel}
                </h4>
                <p class="text-xs text-slate-600 mt-1">
                  ${reviewsStats.totalCount > 0 ? `Basé sur <strong>${reviewsStats.totalCount} avis vérifié(s)</strong> émis par les comités d'organisation, services municipaux et stagiaires.` : 'Votre antenne vient d\'ouvrir ses portes. Aucun avis n\'a encore été recueilli.'}
                </p>
              </div>
            </div>

            <!-- Histogramme des étoiles -->
            <div class="w-full md:w-64 space-y-1 text-xs">
              ${[5, 4, 3, 2, 1].map(star => {
                const count = counts[star] || 0;
                const pct = reviewsStats.totalCount > 0 ? Math.round((count / total) * 100) : 0;
                return `
                  <div class="flex items-center gap-2 text-[11px]">
                    <span class="w-6 font-bold text-slate-600 mono-num">${star} ★</span>
                    <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div class="h-full rounded-full bg-amber-400 transition-all duration-300" style="width: ${pct}%"></div>
                    </div>
                    <span class="w-8 text-right font-bold text-slate-400 text-[10px] mono-num">${pct}%</span>
                  </div>
                `;
              }).join('')}
            </div>

          </div>

          <!-- Note d'information stratégique pour le joueur -->
          <div class="p-3 rounded-2xl bg-white border border-amber-200/80 flex items-start gap-2.5 text-xs text-slate-700 shadow-2xs">
            <span class="text-base shrink-0">💡</span>
            <div>
              <strong class="text-amber-950 font-black">Baromètre officiel de votre notoriété :</strong>
              <p class="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Cette note sur 5 étoiles est le baromètre direct de satisfaction du public et des collectivités.
                Chaque dispositif de secours (DPS) réussi avec l’encadrement requis et chaque session de formation certifiée vous rapportent des avis 5 étoiles élogieux.
                À l’inverse, les dispositifs sous-dimensionnés provoquent des réclamations qui dégradent votre note.
              </p>
            </div>
          </div>
        </div>

        <!-- Liste des Avis des Organisateurs, Mairies et Citoyens -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <span>💬</span> Derniers Avis et Retours d'Expérience (${reviewsStats.reviews.length})
            </h5>
            <span class="text-[11px] text-slate-400">${reviewsStats.totalCount > 0 ? 'Classés par ordre chronologique' : 'En attente de vos premières missions'}</span>
          </div>

          ${reviewsStats.totalCount === 0 ? `
            <div class="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-3 shadow-2xs">
              <div class="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
                ⭐
              </div>
              <div class="space-y-1">
                <h4 class="text-base font-black text-slate-900">Aucun avis public pour le moment</h4>
                <p class="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Votre antenne est en phase de lancement. Vos premières évaluations seront déposées par les <strong>organisateurs d'événements sportifs et culturels</strong> (DPS), les <strong>mairies</strong> et les <strong>stagiaires formés</strong> au fur et à mesure de la clôture de vos dispositifs.
                </p>
              </div>
              <div class="pt-2">
                <button onclick="window.ProtecCommunication.currentTab = 'social_media'; window.ProtecCommunication.renderModal(window.game);" class="px-4 py-2 rounded-xl text-xs font-black bg-pc-blue hover:bg-blue-700 text-white shadow-xs transition cursor-pointer">
                  Aller aux Réseaux Sociaux & Publications ➜
                </button>
              </div>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${reviewsStats.reviews.map(rev => {
                const r = Number(rev.rating) || 5;
                const isPositive = r >= 4;
                const sourceBadge = rev.source === 'formation'
                  ? { label: 'Formation Premiers Secours', bg: 'bg-emerald-100 text-emerald-800' }
                  : (rev.source === 'commune'
                    ? { label: 'Collectivité & Mairie', bg: 'bg-blue-100 text-blue-800' }
                    : { label: 'Dispositif de Secours (DPS)', bg: 'bg-purple-100 text-purple-800' });

                return `
                  <div class="p-4 rounded-2xl glass-card border ${isPositive ? 'border-slate-200 hover:border-amber-300' : 'border-rose-200 bg-rose-50/20'} transition-all bg-white flex flex-col justify-between space-y-3 shadow-2xs">
                    <div class="space-y-2">
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-0.5 text-amber-400 text-sm">
                          ${Array.from({ length: 5 }, (_, i) => `<span>${(i + 1) <= r ? '★' : '☆'}</span>`).join('')}
                          <span class="text-xs font-black ${isPositive ? 'text-slate-800' : 'text-rose-700'} ml-1 mono-num">${r}.0</span>
                        </div>
                        <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${sourceBadge.bg}">
                          ${sourceBadge.label}
                        </span>
                      </div>

                      <div>
                        <h6 class="text-xs font-black text-slate-900 leading-snug">
                          ${rev.author}
                        </h6>
                        <span class="text-[10px] text-slate-400 font-medium block">
                          ${rev.role} • ${rev.date || 'Récemment'}
                        </span>
                      </div>

                      <p class="text-xs text-slate-700 italic leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                        « ${rev.text} »
                      </p>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Avis certifié</span>
                      <span class="flex items-center gap-1 font-bold text-slate-600">
                        <span>👍</span> Utile (${rev.likes || 4})
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  },

  // Onglet 3 : Campagnes Sponsorisées & Grands Médias (Affichage, Presse...)
  renderSponsoredCampaignsTab(game) {
    const camp = game.commData.activeCampaign;
    const currentDay = game.currentDayIndex || 0;

    return `
      <!-- Section Rayonnement & Notoriété Locale Permanente de l'Antenne -->
      <div class="p-4 rounded-3xl glass-card space-y-3 border border-indigo-200/80 bg-gradient-to-r from-indigo-50/50 via-white to-pink-50/50">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-xs font-black uppercase text-slate-800 tracking-wider">Rayonnement & Communication de l'Antenne</h4>
            <p class="text-[11px] text-slate-500">Activez des campagnes de communication pour accroître votre popularité et recevoir des sollicitations d'organisateurs d'événements.</p>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-slate-400 font-bold uppercase block">Popularité</span>
            <span class="text-xs font-black text-pc-blue">${game.resources.reputationScore} pts (${game.resources.followers} abonnés)</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div class="text-xs font-bold text-slate-800">Campagne Réseaux Sociaux</div>
              <div class="text-[10px] text-slate-500">Notoriété locale & associations (+sollicitations DPS)</div>
            </div>
            <button onclick="window.game.toggleCampaign('social'); window.ProtecCommunication.renderModal(window.game);" class="px-3.5 py-1.5 rounded-xl text-xs font-bold ${game.resources.campaigns?.social ? 'bg-emerald-600 text-white' : 'glass-button text-slate-700'} transition cursor-pointer">
              ${game.resources.campaigns?.social ? 'Active ✓' : 'Lancer (150 €)'}
            </button>
          </div>

          <div class="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <div class="text-xs font-bold text-slate-800">Affichage & Mairie</div>
              <div class="text-[10px] text-slate-500">Visibilité municipale (+grands dispositifs)</div>
            </div>
            <button onclick="window.game.toggleCampaign('posters'); window.ProtecCommunication.renderModal(window.game);" class="px-3.5 py-1.5 rounded-xl text-xs font-bold ${game.resources.campaigns?.posters ? 'bg-emerald-600 text-white' : 'glass-button text-slate-700'} transition cursor-pointer">
              ${game.resources.campaigns?.posters ? 'Actif ✓' : 'Lancer (200 €)'}
            </button>
          </div>
        </div>
      </div>

      <!-- Section Campagne en cours si active -->
      ${camp ? `
        <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-pink-50 border-2 border-pink-300 text-slate-800 space-y-3 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-pink-500 animate-ping"></span>
              <h5 class="text-xs font-black uppercase text-pink-900">Campagne en cours : ${camp.subjectTitle}</h5>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pink-200 text-pink-900">
              ${Math.max(0, camp.endDay - currentDay)} jours restants
            </span>
          </div>

          <p class="text-[11px] text-slate-600">Canal de diffusion : <strong>${camp.channelName}</strong></p>

          <div class="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div class="p-2 rounded-xl bg-white/80 border border-pink-100">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Dons Récoltés</span>
              <strong class="text-emerald-600 mono-num">+${camp.totalGains.money} €</strong>
            </div>
            <div class="p-2 rounded-xl bg-white/80 border border-pink-100">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Candidatures</span>
              <strong class="text-indigo-600 mono-num">+${camp.totalGains.candidatures}</strong>
            </div>
            <div class="p-2 rounded-xl bg-white/80 border border-pink-100">
              <span class="text-[9px] uppercase font-bold text-slate-400 block">Notoriété</span>
              <strong class="text-pink-600 mono-num">+${camp.totalGains.reputation} pts</strong>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Sélecteur de création de campagne sponsorisée -->
      <div class="p-5 rounded-3xl glass-card space-y-4">
        <div>
          <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider">1. Choisissez le sujet de votre communication sponsorisée</h5>
          <p class="text-[11px] text-slate-500">De quoi souhaitez-vous parler aux citoyens et aux institutions ?</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          ${this.SUBJECTS.map((sub, idx) => `
            <label class="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-pink-400 transition cursor-pointer flex flex-col justify-between space-y-2 group has-[:checked]:border-pink-600 has-[:checked]:bg-pink-50/40">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase border ${sub.badgeColor}">
                    ${sub.badge}
                  </span>
                  <input type="radio" name="comm-subject" value="${sub.id}" ${idx === 0 ? 'checked' : ''} class="accent-pink-600">
                </div>
                <h6 class="text-xs font-black text-slate-900 group-hover:text-pink-700 transition">${sub.title}</h6>
                <p class="text-[10px] text-slate-500 leading-tight">${sub.desc}</p>
              </div>
              <div class="pt-1 border-t border-slate-100 text-[9px] font-bold text-pink-700">
                ✨ ${sub.effect}
              </div>
            </label>
          `).join('')}
        </div>

        <div class="pt-2">
          <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider">2. Choisissez le canal de diffusion</h5>
          <p class="text-[11px] text-slate-500">Sélectionnez le support adapté à votre budget et à vos objectifs</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${this.CHANNELS.map((chan, idx) => `
            <label class="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-pink-400 transition cursor-pointer flex flex-col justify-between space-y-2 group has-[:checked]:border-pink-600 has-[:checked]:bg-pink-50/40">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">${chan.name}</span>
                <input type="radio" name="comm-channel" value="${chan.id}" ${idx === 0 ? 'checked' : ''} class="accent-pink-600">
              </div>
              <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span class="text-slate-500 text-[10px]">${chan.durationDays} jours</span>
                <strong class="text-pink-700 mono-num">${chan.cost} €</strong>
              </div>
            </label>
          `).join('')}
        </div>

        <div class="pt-3 flex justify-end">
          <button onclick="
            const subRadio = document.querySelector('input[name=comm-subject]:checked');
            const chanRadio = document.querySelector('input[name=comm-channel]:checked');
            if (subRadio && chanRadio) {
              window.ProtecCommunication.launchCampaign(window.game, subRadio.value, chanRadio.value);
            }
          " class="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:brightness-110 text-white font-black text-xs shadow-lg transition cursor-pointer flex items-center gap-2">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>Lancer la Campagne Sponsorisée</span>
          </button>
        </div>
      </div>
    `;
  }
};
