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
      id: 'materiel',
      title: 'Focus Véhicule & Matériel d’Urgence',
      icon: 'truck',
      emoji: '🚑',
      color: 'orange',
      badge: 'Moyens & Rigueur',
      desc: 'Présentation de notre VPSP et des équipements de secours (DAE, oxygène, lots de prompt secours).',
      sampleText: 'Zoom sur notre ambulance VPSP réarmée et vérifiée par nos équipes. Matériel de pointe opérationnel 24h/24 au service des citoyens ! 🚑✨ #Urgence #Secours #VPSP',
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

  // Campagnes sponsorisées historiques
  SUBJECTS: [
    {
      id: 'dons',
      title: 'Appel aux Dons & Mécénat',
      badge: 'Trésorerie',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Appel à la générosité des citoyens et des entreprises pour financer nos équipements d\'urgence.',
      effect: 'Génère des rentrées d\'argent régulières par micro-dons citoyens.',
      icon: 'coins'
    },
    {
      id: 'recrutement',
      title: 'Campagne de Recrutement de Bénévoles',
      badge: 'Ressources Humaines',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      desc: 'Valorise l\'engagement associatif et suscite de nouvelles vocations de secouristes.',
      effect: 'Attire de nouvelles candidatures de bénévoles motivés.',
      icon: 'user-plus'
    },
    {
      id: 'formation',
      title: 'Sensibilisation Gestes qui Sauvent & PSC 1',
      badge: 'Formations Payantes',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      desc: 'Encourage le grand public à se former aux premiers secours dans notre salle de formation.',
      effect: 'Augmente le taux de remplissage des sessions de formation citoyenne (+revenus).',
      icon: 'graduation-cap'
    },
    {
      id: 'retex',
      title: 'Retour d\'Expérience (RETEX) & Valorisation Équipe',
      badge: 'Notoriété & Image',
      badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
      desc: 'Reportage photo et retex valorisant l\'action exemplaire de nos secouristes en intervention.',
      effect: 'Forte hausse de réputation (+demandes de devis DPS d\'organisateurs).',
      icon: 'award'
    },
    {
      id: 'portes_ouvertes',
      title: 'Journée Portes Ouvertes & Visite de la Caserne',
      badge: 'Vie Locale & Partenaires',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      desc: 'Invitation des habitants et élus municipaux à découvrir nos ambulances et locaux.',
      effect: 'Améliore la confiance des mairies et des partenaires territoriaux.',
      icon: 'building'
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
      const now = Date.now();
      game.socialMedia = {
        visibilityScore: 80,        // Score de visibilité (0 à 100%)
        lastPostTimestamp: now - 3600000 * 4,
        totalPosts: 2,
        totalLikes: 248,
        totalShares: 42,
        autoPilotSalarieId: null,   // Salarié délégué en Community Manager
        feed: [
          {
            id: 'post-init-1',
            timestamp: now - 3600000 * 18,
            themeId: 'materiel',
            authorName: 'Antenne Protection Civile',
            authorRole: 'Direction d’Antenne',
            text: 'Prise de garde opérationnelle ! Notre ambulance VPSP est armée et prête à intervenir sur toute sollicitation de la Préfecture et du SAMU.',
            likes: 112,
            shares: 19,
            commentsCount: 6,
            topComment: 'Merci d’être toujours présents pour nous veiller ! 🙏'
          },
          {
            id: 'post-init-2',
            timestamp: now - 3600000 * 6,
            themeId: 'dps',
            authorName: 'Antenne Protection Civile',
            authorRole: 'Équipe de terrain',
            text: 'Dispositif Prévisionnel de Secours réussi sur le tournoi omnisports municipal. Félicitations à nos équipiers secouristes pour leur réactivité !',
            likes: 136,
            shares: 23,
            commentsCount: 9,
            topComment: 'Superbe prise en charge de ma cheville foulée, merci les secouristes ! 👍'
          }
        ]
      };
    }
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

    // Récupérer un secouriste ou auteur pour personnaliser
    const authorVol = game.volunteers && game.volunteers.length > 0
      ? game.volunteers[Math.floor(Math.random() * game.volunteers.length)]
      : null;

    const authorName = authorVol ? authorVol.name : 'Équipe d’Antenne';
    const authorRole = authorVol ? (authorVol.role || authorVol.rank || 'Secouriste') : 'Bénévole';

    // Gains immédiats de visibilité et notoriété
    const oldScore = game.socialMedia.visibilityScore || 50;
    const gain = theme.visibilityGain || 20;
    const newScore = Math.min(100, oldScore + gain);
    game.socialMedia.visibilityScore = newScore;
    game.socialMedia.lastPostTimestamp = now;
    game.socialMedia.totalPosts = (game.socialMedia.totalPosts || 0) + 1;

    // Réputation d'antenne
    const repGain = theme.repGain || 10;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + repGain;

    // Simulation de l'impact social (Likes, partages, commentaires)
    const postLikes = Math.floor(45 + Math.random() * 85);
    const postShares = Math.floor(6 + Math.random() * 20);
    game.socialMedia.totalLikes = (game.socialMedia.totalLikes || 0) + postLikes;
    game.socialMedia.totalShares = (game.socialMedia.totalShares || 0) + postShares;

    const citizenComments = [
      'Bravo pour votre engagement sans faille ! 👏',
      'Merci la Protection Civile, on se sent en sécurité avec vous ! 🧡💙',
      'Des bénévoles au top, toujours souriants et très professionnels.',
      'Fier de voir nos jeunes s’investir autant pour la commune !',
      'Merci pour vos précieux conseils de secourisme !'
    ];
    const pickedComment = citizenComments[Math.floor(Math.random() * citizenComments.length)];

    // Enregistrement dans le feed
    const newPost = {
      id: `post-${now}`,
      timestamp: now,
      themeId: theme.id,
      themeTitle: theme.title,
      authorName: authorName,
      authorRole: authorRole,
      text: theme.sampleText,
      likes: postLikes,
      shares: postShares,
      commentsCount: Math.floor(3 + Math.random() * 8),
      topComment: pickedComment,
      isAutoPilot: false
    };

    game.socialMedia.feed.unshift(newPost);
    if (game.socialMedia.feed.length > 20) game.socialMedia.feed.pop();

    // Retombées concrètes aléatoires sur l'activité
    let impactDetail = '';
    const roll = Math.random();
    if (roll < 0.35) {
      // Don citoyen direct
      const donation = 45 + Math.floor(Math.random() * 65);
      game.resources.money += donation;
      if (window.ProtecFinances) {
        window.ProtecFinances.recordTransaction(game, donation, `Micro-dons citoyens en ligne (Publication : ${theme.title})`, 'dons');
      }
      impactDetail = ` +${donation} € de dons citoyens en ligne récoltés !`;
    } else if (roll < 0.60 && typeof game.generateRandomCandidature === 'function') {
      // Nouvelle candidature spontanée de bénévole
      game.generateRandomCandidature();
      impactDetail = ' Un citoyen inspiré a postulé pour devenir bénévole !';
    } else if (roll < 0.80 && typeof game.generateRandomDevisOpportunity === 'function') {
      // Un organisateur d'événement a vu le post et dépose un devis
      game.generateRandomDevisOpportunity();
      impactDetail = ' Un organisateur local vous a sollicité pour un devis de DPS !';
    }

    game.showToast(
      'Publication Publiée ! 📱 (0 €)',
      `Votre post sur « ${theme.title} » est en ligne ! +${gain}% de visibilité et +${repGain} réputation.${impactDetail}`,
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
          
          // Sélection d'un thème adapté
          const pickedTheme = this.SOCIAL_POST_THEMES[Math.floor(Math.random() * this.SOCIAL_POST_THEMES.length)];
          
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
            themeTitle: pickedTheme.title,
            authorName: salarie.name,
            authorRole: 'Community Manager (Salarié)',
            text: pickedTheme.sampleText,
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
  launchCampaign(game, subjectId, channelId) {
    this.injectState(game);
    const sub = this.SUBJECTS.find(s => s.id === subjectId);
    const chan = this.CHANNELS.find(c => c.id === channelId);
    if (!sub || !chan) return;

    if (game.resources.money < chan.cost) {
      game.showToast('Fonds Insuffisants', `Le lancement de cette campagne requiert ${chan.cost} €.`, 'orange');
      return;
    }

    if (game.commData.activeCampaign) {
      if (!confirm('Une campagne sponsorisée est déjà active. Remplacer par la nouvelle campagne ?')) {
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
          game.generateRandomCandidature();
          camp.totalGains.candidatures += 1;
          game.commData.totalRecruitsGenerated += 1;
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
      visLabel = '🔥 Buzz & Rayonnement Maximal (Sollicitations fortes)';
      visColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
      visBarColor = 'bg-emerald-500';
    } else if (visibility >= 50) {
      visLabel = '⚡ Présence Régulière Active (Activité normale)';
      visColor = 'text-blue-700 bg-blue-50 border-blue-200';
      visBarColor = 'bg-blue-500';
    } else if (visibility >= 30) {
      visLabel = '⚠️ En Baisse (Moins de sollicitations des mairies)';
      visColor = 'text-amber-700 bg-amber-50 border-amber-200';
      visBarColor = 'bg-amber-500';
    }

    body.innerHTML = `
      <div class="space-y-6">

        <!-- En-tête : Jauge de Visibilité & Réseaux Sociaux -->
        <div class="p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl border border-white/20">
                📱
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-base font-black">Visibilité & Rayonnement Numérique</h4>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${visColor} border">
                    ${visibility}%
                  </span>
                </div>
                <p class="text-xs text-slate-300">Affecte directement le rythme des devis DPS, des inscriptions PSC1 et des candidatures</p>
              </div>
            </div>

            <!-- Indicateur Community Manager Salarié -->
            <div>
              ${autoPilotSalarie ? `
                <div class="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <div class="text-left text-xs">
                    <span class="text-[10px] uppercase font-black text-emerald-300 block">Community Manager Actif</span>
                    <strong class="text-white text-xs">${autoPilotSalarie.name} (Salarié)</strong>
                  </div>
                </div>
              ` : `
                <div class="p-2.5 rounded-2xl bg-white/10 border border-white/15 flex items-center gap-2 text-xs text-slate-300">
                  <span>✍️</span>
                  <span>Gestion Manuelle Requise</span>
                </div>
              `}
            </div>
          </div>

          <!-- Barre de progression de la visibilité -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span class="font-bold text-[11px]">${visLabel}</span>
              <span class="font-mono font-black text-white">${visibility} / 100</span>
            </div>
            <div class="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div class="h-full rounded-full transition-all duration-500 ${visBarColor}" style="width: ${visibility}%"></div>
            </div>
          </div>

          <!-- Mini KPIs sociaux -->
          <div class="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
            <div class="p-2 rounded-xl bg-white/5 border border-white/5">
              <span class="text-[10px] uppercase text-slate-400 font-bold block">Publications Totales</span>
              <strong class="text-white text-xs mono-num">${soc.totalPosts || 0}</strong>
            </div>
            <div class="p-2 rounded-xl bg-white/5 border border-white/5">
              <span class="text-[10px] uppercase text-slate-400 font-bold block">Mentions « J’aime »</span>
              <strong class="text-pink-400 text-xs mono-num">❤️ ${soc.totalLikes || 0}</strong>
            </div>
            <div class="p-2 rounded-xl bg-white/5 border border-white/5">
              <span class="text-[10px] uppercase text-slate-400 font-bold block">Partages Citoyens</span>
              <strong class="text-cyan-400 text-xs mono-num">🔁 ${soc.totalShares || 0}</strong>
            </div>
          </div>
        </div>

        <!-- Onglets de Navigation (Réseaux Sociaux Gratuits vs Campagnes Payantes) -->
        <div class="flex border-b border-slate-200 gap-2">
          <button
            onclick="window.ProtecCommunication.currentTab = 'social_media'; window.ProtecCommunication.renderModal(window.game);"
            class="pb-3 px-4 text-xs font-black transition border-b-2 flex items-center gap-2 ${this.currentTab === 'social_media' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            <span>📱</span> Publications Gratuites Réseaux Sociaux (0 €)
          </button>
          <button
            onclick="window.ProtecCommunication.currentTab = 'sponsored_campaigns'; window.ProtecCommunication.renderModal(window.game);"
            class="pb-3 px-4 text-xs font-black transition border-b-2 flex items-center gap-2 ${this.currentTab === 'sponsored_campaigns' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'}">
            <span>📢</span> Campagnes Sponsorisées & Presse (Payant)
          </button>
        </div>

        ${this.currentTab === 'social_media' ? this.renderSocialMediaTab(game, salaries, autoPilotSalarie) : this.renderSponsoredCampaignsTab(game)}

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Onglet 1 : Publications Gratuites Réseaux Sociaux
  renderSocialMediaTab(game, salaries, autoPilotSalarie) {
    const soc = game.socialMedia;

    return `
      <!-- BLOC DÉLÉGATION SALARIÉ (COMMUNITY MANAGEMENT AUTOMATIQUE) -->
      <div class="p-4.5 rounded-2xl glass-card border border-purple-200 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span class="text-[10px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
              <span>👔</span> Automatisation Salarié (Community Management)
            </span>
            <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Pour ne pas avoir à publier manuellement tout le temps, vous pouvez <strong>déléguer la gestion des réseaux sociaux à un salarié</strong> permanent. Il publiera régulièrement pour maintenir votre visibilité à 100% dans le respect de son contrat de travail (151h mensuelles).
            </p>
          </div>

          <!-- Sélecteur Salarié -->
          <div class="shrink-0 flex items-center gap-2">
            ${salaries.length === 0 ? `
              <div class="text-right">
                <span class="text-[11px] text-slate-500 font-semibold block">Aucun salarié recruté</span>
                <button onclick="window.game.openModule('recrutement')" class="text-xs font-black text-indigo-600 hover:underline">
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
          ${this.SOCIAL_POST_THEMES.map(theme => `
            <div class="p-3.5 rounded-2xl glass-card border border-slate-200 hover:border-purple-400 transition-all flex flex-col justify-between space-y-3 group bg-white">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-xl">${theme.emoji}</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-black bg-${theme.color}-100 text-${theme.color}-800 uppercase">
                    ${theme.badge}
                  </span>
                </div>
                <h6 class="text-xs font-black text-slate-900 group-hover:text-purple-700 transition leading-snug">
                  ${theme.title}
                </h6>
                <p class="text-[11px] text-slate-500 leading-snug">
                  ${theme.desc}
                </p>
              </div>

              <div class="space-y-2 pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span class="text-emerald-700 font-bold">+${theme.visibilityGain}% visibilité</span>
                  <span class="text-purple-700 font-bold">+${theme.repGain} pts</span>
                </div>
                <button
                  onclick="window.ProtecCommunication.publishManualPost(window.game, '${theme.id}')"
                  class="w-full py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>🚀</span> Publier (0 €)
                </button>
              </div>
            </div>
          `).join('')}
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
          ${(soc.feed || []).map(post => `
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

                <span class="text-xs text-slate-400">📱 Réseaux</span>
              </div>

              <!-- Contenu du Post -->
              <p class="text-xs text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                ${post.text}
              </p>

              <!-- Interactions Sociales (Likes, partages, commentaires) -->
              <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                <div class="flex items-center gap-3">
                  <span class="flex items-center gap-1 font-bold text-pink-600">
                    <span>❤️</span> ${post.likes}
                  </span>
                  <span class="flex items-center gap-1 font-bold text-slate-600">
                    <span>🔁</span> ${post.shares}
                  </span>
                  <span class="flex items-center gap-1 font-bold text-slate-600">
                    <span>💬</span> ${post.commentsCount || 4}
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

  // Onglet 2 : Campagnes Sponsorisées & Grands Médias (Affichage, Presse...)
  renderSponsoredCampaignsTab(game) {
    const camp = game.commData.activeCampaign;
    const currentDay = game.currentDayIndex || 0;

    return `
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
