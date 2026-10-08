/**
 * PROTEC LIVE - MODULE COMMUNICATION, MÉDIAS ET RAYONNEMENT D'ANTENNE
 * 
 * Permet au joueur de piloter la communication de son antenne en choisissant :
 * 1. Le sujet de la communication (Dons, Recrutement, PSC1, RETEX, Portes Ouvertes).
 * 2. Le canal de diffusion (Réseaux Sociaux, Affichage Mairie, Presse Locale).
 * 3. Avec retombées réelles et mesurables (dons en trésorerie, candidatures, inscriptions).
 */

window.ProtecCommunication = {
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
      name: 'Réseaux Sociaux (Instagram, FB, TikTok, LinkedIn)',
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

  injectState(game) {
    if (!game.commData) {
      game.commData = {
        activeCampaign: null,
        history: [],
        totalDonationsGenerated: 0,
        totalRecruitsGenerated: 0
      };
    }
  },

  // Lancer une campagne
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
      if (!confirm('Une campagne de communication est déjà active. Remplacer par la nouvelle campagne ?')) {
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

    // Marquer aussi le flag de campagne visible dans resources
    if (!game.resources.campaigns) game.resources.campaigns = {};
    game.resources.campaigns.social = true;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        -chan.cost,
        `Campagne Com : ${sub.title} (${chan.name})`,
        'communication'
      );
    }

    game.showToast(
      'Campagne de Communication Lancée !',
      `Diffusion en cours pour ${chan.durationDays} jours sur le thème : « ${sub.title} ».`,
      'green'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Retombées quotidiennes de la campagne active (appelé par le cycle jour)
  processDailyTick(game) {
    this.injectState(game);
    const camp = game.commData.activeCampaign;
    if (!camp) return;

    const currentDay = game.currentDayIndex || 0;
    if (currentDay > camp.endDay) {
      // Campagne terminée
      game.commData.history.push({ ...camp });
      game.commData.activeCampaign = null;
      game.showToast(
        'Campagne Communication Terminée',
        `Bilan de la campagne « ${camp.subjectTitle} » : impact positif consolidé.`,
        'blue'
      );
      game.saveGame();
      return;
    }

    // Retombées selon le sujet :
    switch (camp.subjectId) {
      case 'dons': {
        const donation = Math.round((70 + Math.floor(Math.random() * 80)) * camp.multiplier);
        game.resources.money += donation;
        camp.totalGains.money += donation;
        game.commData.totalDonationsGenerated += donation;
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(game, donation, 'Dons Citoyens (Campagne Communication)', 'dons');
        }
        game.showToast('Don Reçu !', `+${donation} € de dons citoyens reçus grâce à la campagne d'appel aux dons !`, 'green');
        break;
      }

      case 'recrutement': {
        // Déclencher une candidature de bénévole
        if (Math.random() < 0.65) {
          if (typeof game.generateDynamicCandidature === 'function') {
            game.generateDynamicCandidature('benevole');
            camp.totalGains.candidatures += 1;
            game.commData.totalRecruitsGenerated += 1;
          }
        }
        break;
      }

      case 'formation': {
        // Rentrées supplémentaires de frais d'inscription PSC1
        const gainPsc1 = Math.round(90 * camp.multiplier);
        game.resources.money += gainPsc1;
        camp.totalGains.money += gainPsc1;
        if (window.ProtecFinances) {
          window.ProtecFinances.recordTransaction(game, gainPsc1, 'Inscriptions PSC1 (Campagne Sensibilisation)', 'formation');
        }
        break;
      }

      case 'retex': {
        const repGain = Math.round(3 * camp.multiplier);
        game.resources.reputationScore = (game.resources.reputationScore || 0) + repGain;
        camp.totalGains.reputation += repGain;
        break;
      }

      case 'evenement': {
        const repGain = Math.round(2 * camp.multiplier);
        game.resources.reputationScore = (game.resources.reputationScore || 0) + repGain;
        camp.totalGains.reputation += repGain;
        break;
      }
    }

    game.saveGame();
    game.updateStatsUI();
  },

  // Modal UI du module Communication
  renderModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Pôle Communication, Médias & Rayonnement';
    subtitle.textContent = 'Choisissez le sujet de vos communications et les canaux de diffusion pour développer l\'antenne';
    icon.setAttribute('data-lucide', 'megaphone');

    const camp = game.commData.activeCampaign;
    const currentDay = game.currentDayIndex || 0;

    body.innerHTML = `
      <div class="space-y-6">

        <!-- Bandeau d'en-tête -->
        <div class="p-4 rounded-3xl bg-gradient-to-r from-pink-600 via-rose-700 to-indigo-900 text-white shadow-xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl">
              📢
            </div>
            <div>
              <h4 class="text-base font-black">Stratégie de Communication d'Antenne</h4>
              <p class="text-xs text-white/80">Pilotez votre image publique, mobilisez les donateurs et recrutez de nouveaux équipiers.</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-black ${camp ? 'bg-emerald-400 text-emerald-950 animate-pulse' : 'bg-white/20 text-white'}">
            ${camp ? 'Campagne Active' : 'Aucune campagne'}
          </span>
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

        <!-- Sélecteur de création de campagne -->
        <div class="p-5 rounded-3xl glass-card space-y-4">
          <div>
            <h5 class="text-xs font-black uppercase text-slate-800 tracking-wider">1. Choisissez le sujet de votre communication</h5>
            <p class="text-[11px] text-slate-500">De quoi souhaitez-vous parler aux citoyens et aux institutions ?</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" id="comm-subjects-container">
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
              <span>Lancer la Campagne Sélectionnée</span>
            </button>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
