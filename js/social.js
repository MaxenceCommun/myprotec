/**
 * PROTEC LIVE - PÔLE ACTION SOCIALE & CONVENTIONS D'ÉTAT
 * 1. Collecte de dons et denrées (supermarchés, opérations caddie solidaires).
 * 2. Achat de denrées alimentaires et kits d'hygiène en gros.
 * 3. Conventions d'objectifs avec l'État (DDETS / Ministère de la Solidarité) :
 *    Subvention calculée au prorata des résultats réels obtenus (jusqu'à 100% si objectifs atteints).
 * 4. Maraudes d'urgence sociale et distribution aux personnes en situation de précarité.
 */

window.ProtecSocial = {
  // Initialisation des données sociales de l'antenne
  injectState(game) {
    if (!game.socialData) {
      game.socialData = {
        foodPacks: 15,          // Colis alimentaires
        hygieneKits: 10,        // Trousses d'hygiène
        blankets: 20,           // Couvertures
        totalDistributed: 0,    // Cumul d'aides distribuées
        activeCollecte: null,   // Collecte en cours
        stateConvention: {
          signed: false,
          targetMonth: 1,
          targetMaraudes: 4,
          targetKits: 20,
          currentMaraudes: 0,
          currentKits: 0,
          grantAmount: 3200,    // Montant max si 100%
          claimed: false
        }
      };
    }
  },

  // 1. Lancement d'une opération collecte solidaire (supermarché partenaire)
  startCollecte(game) {
    this.injectState(game);

    // Vérification de la zone de stockage obligatoire dans les locaux
    if (window.ProtecLocaux && !window.ProtecLocaux.hasStorageRoom(game)) {
      game.showToast('Zone de Stockage Requise !', 'Votre antenne ne possède aucune zone de stockage pour entreposer les dons. Aménagez une zone de stockage dans vos locaux !', 'orange');
      return;
    }

    // Vérification de la saturation du stockage
    if (window.ProtecLocaux) {
      const maxCap = window.ProtecLocaux.getStorageCapacity(game);
      const usedCap = window.ProtecLocaux.getCurrentStorageUsed(game);
      if (usedCap >= maxCap) {
        game.showToast('Stockage Plein !', `Votre zone de stockage est saturée (${usedCap}/${maxCap} unités). Agrandissez votre réserve ou distribuez vos denrées en maraude.`, 'orange');
        return;
      }
    }

    if (game.socialData.activeCollecte) {
      game.showToast('Collecte déjà en cours', 'Une opération caddie solidaire est déjà active sur le terrain.', 'orange');
      return;
    }

    const dispoVols = game.volunteers.filter(v => v.status === 'dispo');
    if (dispoVols.length < 2) {
      game.showToast('Effectif insuffisant', 'Il faut au moins 2 bénévoles disponibles pour tenir le stand de collecte.', 'orange');
      return;
    }

    // Mobiliser 2 bénévoles
    const vols = dispoVols.slice(0, 2);
    vols.forEach(v => {
      v.status = 'mission';
      v.energy = Math.max(10, (v.energy || 80) - 15);
    });

    game.socialData.activeCollecte = {
      startTime: Date.now(),
      durationSeconds: 120, // 2 minutes en jeu pour la démonstration dynamique
      volIds: vols.map(v => v.id),
      label: 'Collecte Alimentaire & Hygiène au Supermarché Intermarché / Leclerc'
    };

    game.showToast('Collecte Lancée !', `Stand installé par ${vols.map(v => v.name).join(' et ')}. Collecte de dons des citoyens en cours...`, 'purple');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Terminer la collecte et récupérer les dons
  collectCollecteRewards(game) {
    this.injectState(game);
    const col = game.socialData.activeCollecte;
    if (!col) return;

    // Libérer les bénévoles
    col.volIds.forEach(id => {
      const v = game.volunteers.find(vol => vol.id === id);
      if (v) {
        v.status = 'dispo';
        v.exp += 15;
        v.motivation = Math.min(100, (v.motivation || 75) + 6); // Sentiment d'utilité fort
      }
    });

    const gainedFood = 12 + Math.floor(Math.random() * 8);
    const gainedKits = 6 + Math.floor(Math.random() * 6);
    const gainedBlankets = 4 + Math.floor(Math.random() * 4);

    game.socialData.foodPacks += gainedFood;
    game.socialData.hygieneKits += gainedKits;
    game.socialData.blankets += gainedBlankets;
    game.socialData.activeCollecte = null;

    game.showToast(
      'Collecte Réussie !',
      `Générosité citoyenne : +${gainedFood} colis alimentaires, +${gainedKits} kits d'hygiène, +${gainedBlankets} couvertures !`,
      'green'
    );
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // 2. Achat de denrées alimentaires en gros
  buyFoodWholesale(game, quantity = 10, cost = 45) {
    this.injectState(game);

    if (window.ProtecLocaux) {
      if (!window.ProtecLocaux.hasStorageRoom(game)) {
        game.showToast('Zone de Stockage Requise !', 'Votre antenne n’a pas de zone de stockage pour entreposer les colis alimentaires.', 'orange');
        return;
      }
      const maxCap = window.ProtecLocaux.getStorageCapacity(game);
      const usedCap = window.ProtecLocaux.getCurrentStorageUsed(game);
      if (usedCap + quantity > maxCap) {
        game.showToast('Stockage Saturé !', `Capacité maximale dépassée (${usedCap + quantity}/${maxCap} unités). Agrandissez votre réserve de stockage.`, 'orange');
        return;
      }
    }

    if (game.resources.money < cost) {
      game.showToast('Trésorerie insuffisante', `L’achat de ${quantity} colis requiert ${cost} €.`, 'orange');
      return;
    }

    game.resources.money -= cost;
    game.socialData.foodPacks += quantity;
    game.showToast('Achat Solidaire', `+${quantity} colis alimentaires réceptionnés au local de l'antenne (-${cost} €).`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Achat de kits hygiène en gros
  buyHygieneKits(game, quantity = 10, cost = 35) {
    this.injectState(game);

    if (window.ProtecLocaux) {
      if (!window.ProtecLocaux.hasStorageRoom(game)) {
        game.showToast('Zone de Stockage Requise !', 'Votre antenne n’a pas de zone de stockage pour entreposer les kits.', 'orange');
        return;
      }
      const maxCap = window.ProtecLocaux.getStorageCapacity(game);
      const usedCap = window.ProtecLocaux.getCurrentStorageUsed(game);
      if (usedCap + quantity > maxCap) {
        game.showToast('Stockage Saturé !', `Capacité maximale dépassée (${usedCap + quantity}/${maxCap} unités). Agrandissez votre réserve de stockage.`, 'orange');
        return;
      }
    }

    if (game.resources.money < cost) {
      game.showToast('Trésorerie insuffisante', `L’achat de ${quantity} trousses d'hygiène requiert ${cost} €.`, 'orange');
      return;
    }

    game.resources.money -= cost;
    game.socialData.hygieneKits += quantity;
    game.showToast('Achat Solidaire', `+${quantity} kits d'hygiène réceptionnés (-${cost} €).`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // 3. Signature du contrat d'objectifs avec l'État (DDETS)
  signStateConvention(game) {
    this.injectState(game);
    game.socialData.stateConvention.signed = true;
    game.socialData.stateConvention.claimed = false;
    game.socialData.stateConvention.currentMaraudes = 0;
    game.socialData.stateConvention.currentKits = 0;
    game.showToast('Convention d’État Signée !', 'Contrat pluriannuel DDETS activé : réalisez les maraudes pour toucher jusqu’à 100% de la dotation publique.', 'purple');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Calcul du taux de réussite du contrat d'État
  calculateConventionSuccess(game) {
    this.injectState(game);
    const conv = game.socialData.stateConvention;
    if (!conv.signed) return 0;
    const ratioMaraudes = Math.min(1, conv.currentMaraudes / conv.targetMaraudes);
    const ratioKits = Math.min(1, conv.currentKits / conv.targetKits);
    return Math.round(((ratioMaraudes * 0.5) + (ratioKits * 0.5)) * 100);
  },

  // Réclamation de la subvention publique de l'État indexée sur les résultats
  claimStateGrant(game) {
    this.injectState(game);
    const conv = game.socialData.stateConvention;
    if (!conv.signed || conv.claimed) return;

    const successPct = this.calculateConventionSuccess(game);
    const payout = Math.round(conv.grantAmount * (successPct / 100));

    if (payout <= 0) {
      game.showToast('Objectifs non atteints', 'Vous n’avez effectué aucune action de la convention ce mois-ci. Aucune aide débloquée.', 'orange');
      return;
    }

    game.resources.money += payout;
    conv.claimed = true;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + Math.round(successPct / 4);

    game.showToast(
      'Aide de l’État Perçue !',
      `Taux de satisfaction : ${successPct}%. L’État vous verse ${payout.toLocaleString('fr-FR')} € (${successPct}% de la convention d'objectifs) !`,
      'green'
    );
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Prise en compte de la distribution lors d'une maraude terminée
  onMaraudeCompleted(game, kitsUsed = 4) {
    this.injectState(game);
    const actualUsed = Math.min(game.socialData.foodPacks, kitsUsed);
    game.socialData.foodPacks = Math.max(0, game.socialData.foodPacks - actualUsed);
    game.socialData.hygieneKits = Math.max(0, game.socialData.hygieneKits - Math.min(game.socialData.hygieneKits, 2));
    game.socialData.blankets = Math.max(0, game.socialData.blankets - Math.min(game.socialData.blankets, 1));
    game.socialData.totalDistributed += actualUsed;

    if (game.socialData.stateConvention.signed) {
      game.socialData.stateConvention.currentMaraudes += 1;
      game.socialData.stateConvention.currentKits += actualUsed;
    }
    game.saveGame();
  },

  // Modal UI du Pôle Social
  renderModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Pôle Action Sociale & Solidarité Humaine';
    subtitle.textContent = 'Collecte de dons, achat de denrées, maraudes d’urgence et conventions de l’État';
    icon.setAttribute('data-lucide', 'heart-handshake');

    const data = game.socialData;
    const conv = data.stateConvention;
    const successPct = this.calculateConventionSuccess(game);
    const payout = Math.round(conv.grantAmount * (successPct / 100));

    // Statut collecte en cours
    let collecteHtml = '';
    if (data.activeCollecte) {
      const elapsed = Math.floor((Date.now() - data.activeCollecte.startTime) / 1000);
      const isDone = elapsed >= data.activeCollecte.durationSeconds;
      collecteHtml = `
        <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h5 class="text-xs font-black text-amber-900">${data.activeCollecte.label}</h5>
            </div>
            <p class="text-[11px] text-amber-700">Nos bénévoles sont au contact des citoyens dans le hall du magasin.</p>
          </div>
          ${isDone ? `
            <button onclick="window.ProtecSocial.collectCollecteRewards(window.game)" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow transition animate-bounce">
              Récupérer les Dons 🎁
            </button>
          ` : `
            <span class="px-3 py-1.5 rounded-xl bg-amber-200 text-amber-900 text-xs font-bold">En cours... (${Math.max(0, data.activeCollecte.durationSeconds - elapsed)}s)</span>
          `}
        </div>
      `;
    }

    body.innerHTML = `
      <div class="space-y-5">

        <!-- En-tête stocks solidaires -->
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="p-3.5 rounded-2xl glass-card-purple">
            <div class="text-2xl mb-1">🥫</div>
            <div class="text-[10px] text-purple-700 font-bold uppercase">Colis Alimentaires</div>
            <div class="text-lg font-black text-purple-900 mono-num">${data.foodPacks} packs</div>
          </div>
          <div class="p-3.5 rounded-2xl glass-card-blue">
            <div class="text-2xl mb-1">🧼</div>
            <div class="text-[10px] text-pc-blue font-bold uppercase">Kits d'Hygiène</div>
            <div class="text-lg font-black text-pc-blue mono-num">${data.hygieneKits} trousses</div>
          </div>
          <div class="p-3.5 rounded-2xl glass-card-teal">
            <div class="text-2xl mb-1">🧣</div>
            <div class="text-[10px] text-teal-700 font-bold uppercase">Couvertures Chaudes</div>
            <div class="text-lg font-black text-teal-900 mono-num">${data.blankets} unités</div>
          </div>
        </div>

        <!-- Section 1 : Collectes et Approvisionnements -->
        <div class="p-4 rounded-2xl glass-card space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-black uppercase text-slate-800 tracking-wider">Approvisionnement Solidaire</h4>
              <p class="text-[11px] text-slate-500">Collectez gratuitement auprès du public ou achetez en gros sur la trésorerie</p>
            </div>
          </div>

          ${collecteHtml}

          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2">
            ${!data.activeCollecte ? `
              <button onclick="window.ProtecSocial.startCollecte(window.game)" class="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-purple-900">🛒 Collecte Supermarché</span>
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-200 text-purple-900">Gratuit</span>
                </div>
                <p class="text-[10px] text-purple-700">Mobilise 2 bénévoles. Récolte ~20 denrées alimentaires et kits.</p>
              </button>
            ` : ''}

            <button onclick="window.ProtecSocial.buyFoodWholesale(window.game, 10, 45)" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">🥫 Achat 10 Colis Repas</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800">45 €</span>
              </div>
              <p class="text-[10px] text-slate-500">Conserves, soupes chaudes, barres céréales et bouteilles d'eau.</p>
            </button>

            <button onclick="window.ProtecSocial.buyHygieneKits(window.game, 10, 35)" class="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-slate-900">🧼 Achat 10 Kits Hygiène</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800">35 €</span>
              </div>
              <p class="text-[10px] text-slate-500">Dentifrice, savon, serviettes et produits de première nécessité.</p>
            </button>
          </div>
        </div>

        <!-- Section 2 : CONVENTION D'ÉTAT (DDETS / MINISTÈRE) -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-4 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg">🏛️</div>
              <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-indigo-200">Convention Triennale avec l’État (DDETS)</h4>
                <p class="text-[11px] text-slate-300">L'aide publique est versée au pourcentage exact de vos résultats réalisés !</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold ${conv.signed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-slate-700 text-slate-300'}">
              ${conv.signed ? 'CONVENTION ACTIVE' : 'NON SOUSCRITE'}
            </span>
          </div>

          ${!conv.signed ? `
            <div class="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
              <p>L’État finance les associations agréées de sécurité civile qui réalisent des maraudes et des distributions d'aide d'urgence.</p>
              <p class="text-amber-300 font-bold">Règle d'or : Si vous remplissez 100% de vos engagements, vous touchez 100% de l’aide (3 200 €). Si vous en remplissez 60%, vous touchez 60%.</p>
              <button onclick="window.ProtecSocial.signStateConvention(window.game)" class="w-full py-2.5 rounded-xl bg-pc-orange hover:bg-pc-orange/90 text-white font-black text-xs shadow-lg transition">
                Signer la Convention d'Objectifs DDETS
              </button>
            </div>
          ` : `
            <div class="space-y-3">
              <!-- Barres de progression des objectifs -->
              <div class="space-y-2 text-xs">
                <div class="flex justify-between text-[11px]">
                  <span>Maraudes d'urgence effectuées : <strong>${conv.currentMaraudes} / ${conv.targetMaraudes}</strong></span>
                  <span class="font-black text-indigo-300">${Math.min(100, Math.round((conv.currentMaraudes / conv.targetMaraudes) * 100))}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div class="h-full bg-purple-500 rounded-full" style="width: ${Math.min(100, (conv.currentMaraudes / conv.targetMaraudes) * 100)}%"></div>
                </div>

                <div class="flex justify-between text-[11px] pt-1">
                  <span>Colis & denrées distribuées : <strong>${conv.currentKits} / ${conv.targetKits}</strong></span>
                  <span class="font-black text-indigo-300">${Math.min(100, Math.round((conv.currentKits / conv.targetKits) * 100))}%</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full" style="width: ${Math.min(100, (conv.currentKits / conv.targetKits) * 100)}%"></div>
                </div>
              </div>

              <!-- Bilan et versement -->
              <div class="p-3 rounded-xl bg-white/10 flex items-center justify-between">
                <div>
                  <div class="text-[10px] text-slate-300 uppercase font-bold">Taux de réalisation global :</div>
                  <div class="text-base font-black text-emerald-300">${successPct}% (${payout.toLocaleString('fr-FR')} € / ${conv.grantAmount.toLocaleString('fr-FR')} €)</div>
                </div>
                ${!conv.claimed ? `
                  <button onclick="window.ProtecSocial.claimStateGrant(window.game)" class="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xs shadow transition">
                    Percevoir l'Aide d'État (${payout} €)
                  </button>
                ` : `
                  <span class="px-3 py-1.5 rounded-xl bg-slate-700 text-slate-300 text-xs font-bold">Aide perçue pour ce cycle</span>
                `}
              </div>
            </div>
          `}
        </div>

        <!-- Section 3 : Maraudes Actives / Programmées -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase text-slate-800 tracking-wider">Missions de Maraudes Sociales</h4>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${game.missions.filter(m => m.type === 'social').length === 0 ? '<p class="text-xs text-slate-400 italic col-span-2">Aucune maraude planifiée pour le moment. Une mission de maraude est proposée régulièrement au coucher du soleil.</p>' : ''}
            ${game.missions.filter(m => m.type === 'social').map(m => `
              <div class="p-3.5 rounded-2xl glass-card space-y-2">
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800">MARAUDE NOCTURNE</span>
                  <span class="text-[10px] font-bold text-slate-400">${m.status === 'ongoing' ? 'En cours' : 'Planifiée'}</span>
                </div>
                <h5 class="text-xs font-extrabold text-slate-900">${m.title}</h5>
                <p class="text-[11px] text-slate-600">${m.desc}</p>
                <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span class="text-[10px] text-slate-500">Kits prévus : 4</span>
                  <button onclick="window.game.closeModal(); window.game.openMissionDetails('${m.id}')" class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition">
                    Gérer la Mission
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
