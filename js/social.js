/**
 * PROTEC LIVE - ACTION SOCIALE, MARAUDES ET SUBVENTIONS PUBLIQUES
 * 
 * Règles doctrinales :
 * - Aucun agrément ministériel n'est exigé pour l'action sociale et les maraudes.
 * - Le financement repose sur des subventions d'objectifs allouées par des partenaires publics :
 *   1. DDETS (État / Préfecture) : Maraudes hivernales grand froid & veille sociale d'urgence.
 *   2. CCAS (Mairie / Ville) : Maraudes urbaines hebdomadaires & colis alimentaires.
 *   3. Conseil Départemental : Précarité extrême, accompagnement & hébergement d'urgence.
 *   4. Métropole / Intercommunalité : Dispositif de proximité sur l'agglomération.
 * - Le joueur choisit les conventions de subvention qu'il accepte d'honorer.
 * - S'il en accepte trop et ne les mène pas à bien : pénalités financières et baisse de réputation
 *   auprès des bailleurs, bloquant temporairement les futures demandes de subvention.
 */

window.ProtecSocial = {
  // Liste des financeurs institutionnels et de leurs offres de subvention
  FUNDER_TEMPLATES: [
    {
      id: 'sub_ddets',
      funder: 'DDETS (État / Préfecture)',
      badge: 'État - Cohésion Sociale',
      badgeColor: 'bg-blue-100 text-pc-blue border-blue-200',
      title: 'Dispositif Veille Sociale & Grand Froid',
      desc: 'Veille mobile auprès des personnes vulnérables dans la rue et signalements 115.',
      targetMaraudes: 4,
      targetKits: 20,
      grantAmount: 3500,
      penaltyAmount: 1200,
      durationDays: 7,
      icon: 'landmark'
    },
    {
      id: 'sub_ccas',
      funder: 'CCAS (Centre Communal d\'Action Sociale)',
      badge: 'Ville / Municipalité',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
      title: 'Maraudes Urbaines de Proximité & Colis Repas',
      desc: 'Distribution de denrées de première nécessité et maintien du lien social de quartier.',
      targetMaraudes: 3,
      targetKits: 15,
      grantAmount: 2400,
      penaltyAmount: 800,
      durationDays: 5,
      icon: 'heart-handshake'
    },
    {
      id: 'sub_cd',
      funder: 'Conseil Départemental (Pôle Solidarités)',
      badge: 'Département',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Lutte contre la Grande Exclusion & Urgences',
      desc: 'Accompagnement sanitaire de base, couverture chaude et orientation vers foyers d\'accueil.',
      targetMaraudes: 5,
      targetKits: 25,
      grantAmount: 4200,
      penaltyAmount: 1600,
      durationDays: 10,
      icon: 'shield-check'
    },
    {
      id: 'sub_metropole',
      funder: 'Métropole / Communauté d\'Agglomération',
      badge: 'Intercommunalité',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      title: 'Plan Métropolitain d\'Aide d\'Urgence',
      desc: 'Soutien aux campements précaires et maraudes conjointes avec les associations partenaires.',
      targetMaraudes: 2,
      targetKits: 10,
      grantAmount: 1800,
      penaltyAmount: 600,
      durationDays: 4,
      icon: 'users'
    }
  ],

  // Plafonnement strict du stockage : la réserve ne peut JAMAIS dépasser sa capacité maximale réelle
  clampStorageToCapacity(game) {
    if (!game || !game.socialData) return;
    const maxStorage = window.ProtecLocaux ? window.ProtecLocaux.getStorageCapacity(game) : 40;
    if (maxStorage <= 0) return;

    // Calculer le stockage utilisé hors denrées sociales
    let otherUsed = 0;
    if (game.logistics) {
      otherUsed += (game.logistics.oxygenB5 || 0) + (game.logistics.firstAidKits || 0) + (game.logistics.tents || 0) + (game.logistics.cots || 0);
    }
    if (window.ProtecEquipements && typeof window.ProtecEquipements.getLotsStorageUsed === 'function') {
      otherUsed += window.ProtecEquipements.getLotsStorageUsed(game);
    }
    let vehicleStoredVolume = 0;
    (game.vehicles || []).forEach(v => {
      if (v.logKit && window.ProtecCriseLogistique?.LOG_KITS?.[v.logKit]) {
        vehicleStoredVolume += window.ProtecCriseLogistique.LOG_KITS[v.logKit].buildingStorageSize || 10;
      }
    });
    otherUsed = Math.max(0, otherUsed - vehicleStoredVolume);

    const maxSocialSpace = Math.max(0, maxStorage - otherUsed);
    const s = game.socialData;
    let currentSocial = (s.foodPacks || 0) + (s.hygieneKits || 0) + (s.blankets || 0);

    if (currentSocial > maxSocialSpace) {
      // Dépassement détecté : réduction proportionnelle stricte pour assainir la sauvegarde
      let excess = currentSocial - maxSocialSpace;
      while (excess > 0 && (s.blankets > 0 || s.foodPacks > 0 || s.hygieneKits > 0)) {
        if (s.blankets > 0 && excess > 0) {
          const cut = Math.min(s.blankets, Math.max(1, Math.floor(excess / 3)));
          s.blankets -= cut;
          excess -= cut;
        }
        if (s.foodPacks > 0 && excess > 0) {
          const cut = Math.min(s.foodPacks, Math.max(1, Math.floor(excess / 2)));
          s.foodPacks -= cut;
          excess -= cut;
        }
        if (s.hygieneKits > 0 && excess > 0) {
          const cut = Math.min(s.hygieneKits, excess);
          s.hygieneKits -= cut;
          excess -= cut;
        }
      }
    }
  },

  injectState(game) {
    if (!game.socialData) {
      const maxCap = window.ProtecLocaux ? window.ProtecLocaux.getStorageCapacity(game) : 40;
      // Budget de départ réaliste respectant impérativement la capacité (max 50% du stockage disponible)
      const budget = Math.min(20, Math.max(10, Math.floor(maxCap * 0.5)));
      const food = Math.floor(budget * 0.4); // ex: 8
      const kits = Math.floor(budget * 0.3); // ex: 6
      const blankets = Math.max(0, budget - food - kits); // ex: 6
      game.socialData = {
        foodPacks: food,
        hygieneKits: kits,
        blankets: blankets,
        totalDistributed: 0,
        activeCollecte: null,
        contracts: [], // Contrats de subvention en cours ou terminés
        funderPenalties: {} // Pénalités / délai de blocage par financeur
      };
    }

    if (!game.socialData.contracts) {
      game.socialData.contracts = [];
    }
    if (!game.socialData.funderPenalties) {
      game.socialData.funderPenalties = {};
    }

    // Assainissement immédiat : régule toute sauvegarde ou valeur historique au-delà du plafond
    this.clampStorageToCapacity(game);

    // Initialisation des offres de subventions disponibles
    this.FUNDER_TEMPLATES.forEach(tpl => {
      let existing = game.socialData.contracts.find(c => c.id === tpl.id);
      if (!existing) {
        game.socialData.contracts.push({
          ...tpl,
          status: 'available', // 'available' | 'active' | 'completed' | 'failed'
          currentMaraudes: 0,
          currentKits: 0,
          acceptedAtDay: null,
          deadlineDay: null,
          claimed: false
        });
      }
    });
  },

  // Accepter un contrat de subvention
  async acceptSubvention(game, contractId) {
    this.injectState(game);
    const contract = game.socialData.contracts.find(c => c.id === contractId);
    if (!contract || contract.status !== 'available') return;

    // Vérifier si le bailleur applique un malus/blocage
    const penaltyUntil = game.socialData.funderPenalties[contract.id] || 0;
    const currentDay = game.currentDayIndex || 0;
    if (penaltyUntil > currentDay) {
      game.showToast(
        'Subvention Bloquée',
        `Le bailleur (${contract.funder}) refuse tout nouveau dossier suite à des engagements non respectés (déblocage dans ${penaltyUntil - currentDay} jours).`,
        'red'
      );
      return;
    }

    // Avertir si le joueur a déjà beaucoup de contrats actifs
    const activeContracts = game.socialData.contracts.filter(c => c.status === 'active');
    if (activeContracts.length >= 2) {
      const confirmed = await window.ProtecDialog.confirm(
        `Attention : Vous avez déjà ${activeContracts.length} conventions d'action sociale actives en parallèle.\n\nSi vous ne réalisez pas les maraudes et distributions dans les délais impartis, des pénalités financières et de réputation vous seront appliquées.`,
        'Engager une Convention Supplémentaire',
        { confirmText: 'Signer la Convention', cancelText: 'Annuler' }
      );
      if (!confirmed) {
        return;
      }
    }

    contract.status = 'active';
    contract.acceptedAtDay = currentDay;
    contract.deadlineDay = currentDay + contract.durationDays;
    contract.currentMaraudes = 0;
    contract.currentKits = 0;
    contract.claimed = false;

    // Les missions d'action sociale / soutien aux populations (CAI, CHU, ravitaillement)
    // sont désormais accomplies lors des crises déclenchées par la Préfecture.

    game.showToast(
      'Subvention Acceptée !',
      `Engagement pris auprès de ${contract.funder} : objectif de soutien aux sinistrés, CAI, CHU et ravitaillement à honorer sous ${contract.durationDays} jours lors des crises préfectorales.`,
      'green'
    );

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Les missions logistiques et sociales autonomes sont désormais supprimées :
  // Le soutien aux sinistrés, CAI, CHU et ravitaillement sont intégrés dans les crises Préfecture
  generateMaraudeMission(game, contract) {
    if (game && typeof game.showToast === 'function') {
      game.showToast(
        'Action Sociale & Crise',
        'La mise en place de CAI, CHU et ravitaillement s’effectue lors des missions de crise déclenchées par la Préfecture (Plans ORSEC / NOVI).',
        'blue'
      );
    }
    return null;
  },

  // Prise en compte de la fin d'une maraude
  onMaraudeCompleted(game, kitsUsed = 4, subventionId = null) {
    this.injectState(game);
    const actualUsed = Math.min(game.socialData.foodPacks, kitsUsed);
    game.socialData.foodPacks = Math.max(0, game.socialData.foodPacks - actualUsed);
    game.socialData.hygieneKits = Math.max(0, game.socialData.hygieneKits - Math.min(game.socialData.hygieneKits, 2));
    game.socialData.blankets = Math.max(0, game.socialData.blankets - Math.min(game.socialData.blankets, 1));
    game.socialData.totalDistributed += actualUsed;

    // Mise à jour des contrats de subvention actifs
    const activeList = game.socialData.contracts.filter(c => c.status === 'active');
    activeList.forEach(c => {
      if (!subventionId || c.id === subventionId) {
        c.currentMaraudes += 1;
        c.currentKits += actualUsed;
        if (c.currentMaraudes >= c.targetMaraudes && c.currentKits >= c.targetKits) {
          c.status = 'completed';
        }
      }
    });

    game.saveGame();
    game.updateStatsUI();
  },

  // Réclamer le versement d'une subvention terminée
  claimSubvention(game, contractId) {
    this.injectState(game);
    const contract = game.socialData.contracts.find(c => c.id === contractId);
    if (!contract || contract.status !== 'completed' || contract.claimed) return;

    contract.claimed = true;
    game.resources.money += contract.grantAmount;
    game.resources.reputationScore = (game.resources.reputationScore || 0) + 25;

    if (window.ProtecFinances) {
      window.ProtecFinances.recordTransaction(
        game,
        contract.grantAmount,
        `Subvention reçue : ${contract.funder} (${contract.title})`,
        'subvention'
      );
    }

    game.showToast(
      'Subvention Versée !',
      `Félicitations ! ${contract.funder} vous a versé la dotation de ${contract.grantAmount.toLocaleString('fr-FR')} €.`,
      'green'
    );

    // Permettre de renouveler l'offre après un cycle
    setTimeout(() => {
      contract.status = 'available';
      contract.currentMaraudes = 0;
      contract.currentKits = 0;
      contract.claimed = false;
    }, 5000);

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Vérification quotidienne des échéances et application des pénalités
  checkDailyDeadlines(game) {
    this.injectState(game);
    const currentDay = game.currentDayIndex || 0;

    game.socialData.contracts.forEach(contract => {
      if (contract.status === 'active' && contract.deadlineDay !== null) {
        if (currentDay > contract.deadlineDay) {
          // Échec du contrat : objectifs non atteints dans les délais
          contract.status = 'failed';
          const penalty = contract.penaltyAmount || 1000;
          game.resources.money = Math.max(0, game.resources.money - penalty);
          game.resources.reputationScore = Math.max(0, (game.resources.reputationScore || 0) - 15);

          // Blocage temporaire de ce bailleur pour 4 jours
          game.socialData.funderPenalties[contract.id] = currentDay + 4;

          if (window.ProtecFinances) {
            window.ProtecFinances.recordTransaction(
              game,
              -penalty,
              `Pénalité non-respect subvention : ${contract.funder}`,
              'penalite'
            );
          }

          game.showToast(
            '⚠️ Pénalité Subvention Appliquée !',
            `Délai dépassé pour ${contract.funder} ! Pénalité de -${penalty} € prélevée et -15 pts de réputation. Le bailleur suspend ses offres pour 4 jours.`,
            'red'
          );

          if (window.ProtecNotifications) {
            window.ProtecNotifications.recordNotification({
              title: `⚠️ Pénalité Subvention : ${contract.funder}`,
              message: `Engagements non honorés sur la convention ${contract.title}. Pénalité de ${penalty} € et suspension de dossier.`,
              category: 'social',
              level: 'warning'
            });
          }

          // Remettre en état 'available' après le temps de blocage
          setTimeout(() => {
            contract.status = 'available';
            contract.currentMaraudes = 0;
            contract.currentKits = 0;
            contract.claimed = false;
          }, 3000);
        }
      }
    });

    game.saveGame();
  },

  // Lancement de collecte solidaire au supermarché
  startCollecte(game) {
    this.injectState(game);

    if (window.ProtecLocaux && !window.ProtecLocaux.hasStorageRoom(game)) {
      game.showToast('Zone de Stockage Requise !', 'Votre antenne ne possède aucune zone de stockage pour entreposer les dons. Aménagez une zone de stockage dans vos locaux !', 'orange');
      return;
    }

    // VÉRIFICATION STRICTE DE LA CAPACITÉ DE STOCKAGE : DÉPASSEMENT INTERDIT
    const maxStorage = window.ProtecLocaux ? window.ProtecLocaux.getStorageCapacity(game) : 40;
    const currentStorage = window.ProtecLocaux ? window.ProtecLocaux.getCurrentStorageUsed(game) : 0;
    const spaceLeft = maxStorage - currentStorage;

    if (spaceLeft <= 0) {
      game.showToast(
        '⛔ Réserve Pleine !',
        `Stockage saturé (${currentStorage} / ${maxStorage} unités). Impossible d'accueillir de nouvelles denrées ! Réalisez des maraudes pour distribuer vos stocks ou agrandissez la réserve dans l'onglet Locaux.`,
        'red'
      );
      return;
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

    const vols = dispoVols.slice(0, 2);
    vols.forEach(v => {
      v.status = 'mission';
      v.energy = Math.max(10, (v.energy || 80) - 15);
    });

    game.socialData.activeCollecte = {
      startTime: Date.now(),
      durationSeconds: 90,
      volIds: vols.map(v => v.id),
      label: 'Collecte Alimentaire & Hygiène au Supermarché Intermarché / Leclerc'
    };

    game.showToast('Collecte Lancée !', `Stand installé par ${vols.map(v => v.name).join(' et ')}. Collecte de dons des citoyens en cours...`, 'purple');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  collectCollecteRewards(game) {
    this.injectState(game);
    const col = game.socialData.activeCollecte;
    if (!col) return;

    col.volIds.forEach(id => {
      const v = game.volunteers.find(vol => vol.id === id);
      if (v) {
        v.status = 'dispo';
        v.exp += 15;
        v.motivation = Math.min(100, (v.motivation || 75) + 6);
      }
    });

    const rawFood = 12 + Math.floor(Math.random() * 8);
    const rawKits = 6 + Math.floor(Math.random() * 6);
    const rawBlankets = 4 + Math.floor(Math.random() * 4);
    const totalRaw = rawFood + rawKits + rawBlankets;

    // Calcul de l'espace physique disponible dans la réserve
    const maxStorage = window.ProtecLocaux ? window.ProtecLocaux.getStorageCapacity(game) : 40;
    const currentStorage = window.ProtecLocaux ? window.ProtecLocaux.getCurrentStorageUsed(game) : 0;
    const spaceLeft = Math.max(0, maxStorage - currentStorage);

    let gainedFood = 0;
    let gainedKits = 0;
    let gainedBlankets = 0;

    if (totalRaw <= spaceLeft) {
      // Tout rentre sans dépasser
      gainedFood = rawFood;
      gainedKits = rawKits;
      gainedBlankets = rawBlankets;
    } else if (spaceLeft > 0) {
      // Plafonnement strict : ne stocker QUE ce qui rentre dans la réserve
      let remaining = spaceLeft;
      gainedFood = Math.min(remaining, Math.round((rawFood / totalRaw) * spaceLeft));
      remaining -= gainedFood;
      gainedKits = Math.min(remaining, Math.round((rawKits / totalRaw) * spaceLeft));
      remaining -= gainedKits;
      gainedBlankets = Math.min(remaining, remaining);
    }

    game.socialData.foodPacks += gainedFood;
    game.socialData.hygieneKits += gainedKits;
    game.socialData.blankets += gainedBlankets;
    game.socialData.activeCollecte = null;

    // Garantie absolue : jamais aucun dépassement
    this.clampStorageToCapacity(game);

    const storedTotal = gainedFood + gainedKits + gainedBlankets;
    const surplus = totalRaw - storedTotal;

    if (surplus > 0) {
      game.showToast(
        '📦 Stockage Plein : Dons Plafonnés !',
        `Réserve saturée (${maxStorage}/${maxStorage}) : +${gainedFood} repas, +${gainedKits} kits, +${gainedBlankets} couvertures stockés. Le surplus (+${surplus} dons) a été remis à la Banque Alimentaire partenaire.`,
        'amber'
      );
    } else {
      game.showToast(
        'Collecte Réussie !',
        `Générosité citoyenne : +${gainedFood} colis alimentaires, +${gainedKits} kits d'hygiène, +${gainedBlankets} couvertures !`,
        'green'
      );
    }

    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  buyFoodWholesale(game, quantity = 10, cost = 45) {
    this.injectState(game);
    const maxStorage = window.ProtecLocaux ? window.ProtecLocaux.getStorageCapacity(game) : 40;
    const currentStorage = window.ProtecLocaux ? window.ProtecLocaux.getCurrentStorageUsed(game) : 0;
    const spaceLeft = Math.max(0, maxStorage - currentStorage);

    if (quantity > spaceLeft) {
      game.showToast(
        '⛔ Stockage Insuffisant !',
        `Impossible d'entreposer ${quantity} colis. Votre réserve ne dispose que de ${spaceLeft} place(s) libre(s) sur ${maxStorage}. Agrandissez votre réserve ou réalisez des maraudes.`,
        'red'
      );
      return;
    }

    if (game.resources.money < cost) {
      game.showToast('Trésorerie insuffisante', `L'achat requiert ${cost} €.`, 'orange');
      return;
    }
    game.resources.money -= cost;
    game.socialData.foodPacks += quantity;
    this.clampStorageToCapacity(game);
    game.showToast('Achat Solidaire', `+${quantity} colis alimentaires réceptionnés (-${cost} €).`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  buyHygieneKits(game, quantity = 10, cost = 35) {
    this.injectState(game);
    const maxStorage = window.ProtecLocaux ? window.ProtecLocaux.getStorageCapacity(game) : 40;
    const currentStorage = window.ProtecLocaux ? window.ProtecLocaux.getCurrentStorageUsed(game) : 0;
    const spaceLeft = Math.max(0, maxStorage - currentStorage);

    if (quantity > spaceLeft) {
      game.showToast(
        '⛔ Stockage Insuffisant !',
        `Impossible d'entreposer ${quantity} trousses. Votre réserve ne dispose que de ${spaceLeft} place(s) libre(s) sur ${maxStorage}. Agrandissez votre réserve ou réalisez des maraudes.`,
        'red'
      );
      return;
    }

    if (game.resources.money < cost) {
      game.showToast('Trésorerie insuffisante', `L'achat requiert ${cost} €.`, 'orange');
      return;
    }
    game.resources.money -= cost;
    game.socialData.hygieneKits += quantity;
    this.clampStorageToCapacity(game);
    game.showToast('Achat Solidaire', `+${quantity} kits d'hygiène réceptionnés (-${cost} €).`, 'green');
    game.saveGame();
    game.updateStatsUI();
    this.renderModal(game);
  },

  // Modal UI du Pôle Social et Subventions
  renderModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Pôle Action Sociale & Subventions Publiques';
    subtitle.textContent = 'Maraudes de solidarité, subventions d\'objectifs (DDETS, CCAS, Département, Métropole) et gestion des stocks';
    icon.setAttribute('data-lucide', 'heart-handshake');

    const data = game.socialData;
    const currentDay = game.currentDayIndex || 0;

    const maxStorage = window.ProtecLocaux ? window.ProtecLocaux.getStorageCapacity(game) : 40;
    const currentStorage = window.ProtecLocaux ? window.ProtecLocaux.getCurrentStorageUsed(game) : 0;
    const spaceLeft = Math.max(0, maxStorage - currentStorage);
    const storagePercent = maxStorage > 0 ? Math.min(100, Math.round((currentStorage / maxStorage) * 100)) : 100;
    const isStorageFull = spaceLeft <= 0;

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
              Récupérer les Dons
            </button>
          ` : `
            <span class="px-3 py-1.5 rounded-xl bg-amber-200 text-amber-900 text-xs font-bold">En cours... (${Math.max(0, data.activeCollecte.durationSeconds - elapsed)}s)</span>
          `}
        </div>
      `;
    }

    body.innerHTML = `
      <div class="space-y-6">

        <!-- Barre de navigation supérieure de l'Action Sociale -->
        <div class="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
          <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button class="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 text-white shadow-md flex items-center gap-2">
              <i data-lucide="heart-handshake" class="w-3.5 h-3.5"></i>
              <span>Gestion & Maraudes Sociales</span>
            </button>
            <button onclick="window.game.openPlanningFiltered('social')" class="px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 text-purple-900 hover:bg-purple-100 cursor-pointer border border-transparent hover:border-purple-300" title="Consulter le calendrier complet des maraudes et de tous les pôles">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-purple-600"></i>
              <span>📅 Planning Maraudes & Social</span>
            </button>
          </div>
          <div class="text-xs font-bold text-slate-500 flex items-center gap-2">
            <span>Maraudes actives : <strong>${(game.missions || []).filter(m => m.type === 'social' && !(game.isMissionTerminated ? game.isMissionTerminated(m) : ['completed', 'termine', 'terminee'].includes(m.status))).length}</strong></span>
          </div>
        </div>

        <!-- Bandeau d'information réglementaire -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md flex items-center justify-between text-xs">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">🤝</div>
            <div>
              <h4 class="font-black text-sm">Principe des Subventions d'Action Sociale</h4>
              <p class="text-white/80 text-[11px]">Pas d'agrément exigé pour les maraudes. Financement par conventions d'objectifs avec les institutions publiques.</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Aide aux plus démunis
          </span>
        </div>

        <!-- Jauge d'occupation du Stockage Réel de l'Antenne -->
        <div class="p-4 rounded-2xl ${isStorageFull ? 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900/50' : 'bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800'} space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-black flex items-center gap-1.5 ${isStorageFull ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-200'}">
              <span>📦</span> Capacité de Réserve de l'Antenne :
              <strong class="${isStorageFull ? 'text-red-600' : 'text-pc-blue'} mono-num">${currentStorage} / ${maxStorage} unités</strong>
            </span>
            <span class="text-[11px] font-bold ${isStorageFull ? 'text-red-600 animate-pulse' : 'text-slate-500'}">
              ${isStorageFull ? '⛔ RÉSERVE SATURÉE (0 place libre)' : `✅ ${spaceLeft} place(s) disponible(s)`}
            </span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div class="${isStorageFull ? 'bg-red-600' : (storagePercent > 80 ? 'bg-amber-500' : 'bg-pc-blue')} h-full rounded-full transition-all" style="width: ${storagePercent}%"></div>
          </div>
          ${isStorageFull ? `
            <div class="flex items-center justify-between text-[11px] text-red-700 dark:text-red-300 font-semibold pt-0.5">
              <span>Impossible d'ajouter du stock : effectuez des maraudes pour distribuer vos vivres ou agrandissez vos locaux.</span>
              <button onclick="window.game.openModule('locaux')" class="text-red-700 hover:underline font-black flex items-center gap-1">
                Agrandir Locaux ➜
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Stocks solidaires -->
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="p-3.5 rounded-2xl glass-card-purple">
            <div class="text-2xl mb-1">🍲</div>
            <div class="text-[10px] text-purple-700 font-bold uppercase">Colis Repas</div>
            <div class="text-lg font-black text-purple-900 mono-num">${data.foodPacks} packs</div>
          </div>
          <div class="p-3.5 rounded-2xl glass-card-blue">
            <div class="text-2xl mb-1">🧼</div>
            <div class="text-[10px] text-pc-blue font-bold uppercase">Kits Hygiène</div>
            <div class="text-lg font-black text-pc-blue mono-num">${data.hygieneKits} trousses</div>
          </div>
          <div class="p-3.5 rounded-2xl glass-card-teal">
            <div class="text-2xl mb-1">🧣</div>
            <div class="text-[10px] text-teal-700 font-bold uppercase">Couvertures</div>
            <div class="text-lg font-black text-teal-900 mono-num">${data.blankets} unités</div>
          </div>
        </div>

        <!-- Section 1 : Collectes et Stocks -->
        <div class="p-4 rounded-2xl glass-card space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-black uppercase text-slate-800 tracking-wider">Approvisionnement & Logistique Solidaire</h4>
              <p class="text-[11px] text-slate-500">Collectez gratuitement auprès du public ou achetez en gros sur la trésorerie</p>
            </div>
          </div>

          ${collecteHtml}

          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            ${!data.activeCollecte ? `
              <button onclick="${isStorageFull ? "window.game.showToast('Stockage Plein !', 'Votre réserve est saturée (" + currentStorage + "/" + maxStorage + "). Distribuez d\\'abord vos colis en maraude ou agrandissez votre réserve.', 'red');" : "window.ProtecSocial.startCollecte(window.game);"}" class="p-3 rounded-xl ${isStorageFull ? 'bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 opacity-60 cursor-not-allowed' : 'bg-purple-50 hover:bg-purple-100 border border-purple-200 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 dark:border-purple-800/50 cursor-pointer'} text-left transition space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black ${isStorageFull ? 'text-slate-500' : 'text-purple-900 dark:text-purple-200'}">🛒 Collecte Supermarché</span>
                  <span class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${isStorageFull ? 'bg-red-100 text-red-800' : 'bg-purple-200 text-purple-950 dark:bg-purple-900/70 dark:text-purple-100 dark:border dark:border-purple-600/50'}">${isStorageFull ? 'Réserve Pleine' : 'Gratuit'}</span>
                </div>
                <p class="text-[10px] ${isStorageFull ? 'text-slate-400' : 'text-purple-700 dark:text-purple-300'}">${isStorageFull ? 'Suspendue car le stockage a atteint sa limite maximale autorisée.' : 'Mobilise 2 bénévoles. Récolte ~20 denrées alimentaires et kits.'}</p>
              </button>
            ` : ''}

            <button onclick="${spaceLeft < 10 ? "window.game.showToast('Stockage Insuffisant !', 'Il ne reste que " + spaceLeft + " place(s) libre(s) dans votre réserve (besoin de 10).', 'red');" : "window.ProtecSocial.buyFoodWholesale(window.game, 10, 45);"}" class="p-3 rounded-xl ${spaceLeft < 10 ? 'bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 opacity-60 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer'} text-left transition space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black ${spaceLeft < 10 ? 'text-slate-500' : 'text-slate-900'}">📦 Achat 10 Colis Repas</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-black ${spaceLeft < 10 ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-800'}">45 €</span>
              </div>
              <p class="text-[10px] text-slate-500">${spaceLeft < 10 ? 'Espace de stockage insuffisant (+10 requis).' : 'Conserves, soupes chaudes, barres céréales et eau minérale.'}</p>
            </button>

            <button onclick="${spaceLeft < 10 ? "window.game.showToast('Stockage Insuffisant !', 'Il ne reste que " + spaceLeft + " place(s) libre(s) dans votre réserve (besoin de 10).', 'red');" : "window.ProtecSocial.buyHygieneKits(window.game, 10, 35);"}" class="p-3 rounded-xl ${spaceLeft < 10 ? 'bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 opacity-60 cursor-not-allowed' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer'} text-left transition space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black ${spaceLeft < 10 ? 'text-slate-500' : 'text-slate-900'}">🧼 Achat 10 Kits Hygiène</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-black ${spaceLeft < 10 ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-800'}">35 €</span>
              </div>
              <p class="text-[10px] text-slate-500">${spaceLeft < 10 ? 'Espace de stockage insuffisant (+10 requis).' : 'Dentifrice, savon, lingettes et produits de première nécessité.'}</p>
            </button>
          </div>
        </div>

        <!-- Section 2 : CONVENTIONS D'OBJECTIFS ET SUBVENTIONS PUBLIQUES -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-xs font-black uppercase text-slate-800 tracking-wider">Demandes de Subventions & Conventions d'Objectifs</h4>
              <p class="text-[11px] text-slate-500">Choisissez les conventions que vous souhaitez mener. Attention : engagements fermes avec pénalités de retard !</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${data.contracts.map(c => {
              const penaltyUntil = data.funderPenalties[c.id] || 0;
              const isBlocked = penaltyUntil > currentDay;
              const daysLeft = c.deadlineDay !== null ? Math.max(0, c.deadlineDay - currentDay) : c.durationDays;
              const progressMaraudesPct = Math.min(100, Math.round((c.currentMaraudes / c.targetMaraudes) * 100));
              const progressKitsPct = Math.min(100, Math.round((c.currentKits / c.targetKits) * 100));

              return `
                <div class="p-4 rounded-2xl glass-card flex flex-col justify-between space-y-3 border ${c.status === 'active' ? 'border-pc-blue/50 ring-1 ring-pc-blue/30' : 'border-slate-200/80'}">
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${c.badgeColor}">
                        ${c.badge}
                      </span>
                      <span class="text-xs font-black mono-num text-emerald-600">
                        +${c.grantAmount.toLocaleString('fr-FR')} €
                      </span>
                    </div>

                    <div>
                      <h5 class="text-xs font-black text-slate-900">${c.title}</h5>
                      <span class="text-[10px] text-slate-500 font-semibold block">${c.funder}</span>
                      <p class="text-[11px] text-slate-600 mt-1">${c.desc}</p>
                    </div>

                    <div class="p-2.5 rounded-xl bg-slate-50 text-[10px] space-y-1 font-semibold text-slate-700">
                      <div class="flex justify-between">
                        <span>🎯 Objectif Maraudes :</span>
                        <strong>${c.status === 'active' || c.status === 'completed' ? `${c.currentMaraudes} / ${c.targetMaraudes}` : `${c.targetMaraudes}`} maraudes</strong>
                      </div>
                      <div class="flex justify-between">
                        <span>📦 Distribution Kits :</span>
                        <strong>${c.status === 'active' || c.status === 'completed' ? `${c.currentKits} / ${c.targetKits}` : `${c.targetKits}`} kits</strong>
                      </div>
                      <div class="flex justify-between text-red-600">
                        <span>⚠️ Pénalité en cas d'échec :</span>
                        <strong>-${c.penaltyAmount} €</strong>
                      </div>
                    </div>

                    ${c.status === 'active' ? `
                      <div class="space-y-1 pt-1">
                        <div class="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>Progression globale :</span>
                          <span class="text-pc-blue font-mono">${Math.round((progressMaraudesPct + progressKitsPct) / 2)}% • Reste ${daysLeft} j</span>
                        </div>
                        <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div class="bg-pc-blue h-full rounded-full transition-all" style="width: ${Math.round((progressMaraudesPct + progressKitsPct) / 2)}%"></div>
                        </div>
                      </div>
                    ` : ''}
                  </div>

                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                    ${isBlocked ? `
                      <span class="text-[11px] text-red-600 font-bold">🚫 Dossier bloqué (${penaltyUntil - currentDay} j restants)</span>
                      <span class="px-2.5 py-1 rounded-xl bg-red-100 text-red-800 text-[10px] font-bold">Sanction</span>
                    ` : c.status === 'available' ? `
                      <span class="text-[10px] text-slate-500">Délai : ${c.durationDays} jours</span>
                      <button onclick="window.ProtecSocial.acceptSubvention(window.game, '${c.id}')" class="px-3.5 py-1.5 rounded-xl bg-pc-blue text-white font-extrabold text-xs hover:bg-pc-blue-light transition shadow-sm">
                        Accepter la Convention
                      </button>
                    ` : c.status === 'active' ? `
                      <span class="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-[11px]">
                        Objectifs à honorer lors des Crises Préfecture (CAI / CHU / Vivres)
                      </span>
                      <span class="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 text-[10px] font-extrabold">En Cours (${daysLeft} j)</span>
                    ` : c.status === 'completed' && !c.claimed ? `
                      <span class="text-[11px] text-emerald-600 font-bold">Objectifs atteints à 100% !</span>
                      <button onclick="window.ProtecSocial.claimSubvention(window.game, '${c.id}')" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition shadow animate-pulse">
                        Réclamer ${c.grantAmount} €
                      </button>
                    ` : `
                      <span class="text-[10px] text-slate-400">Subvention clôturée</span>
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Terminée</span>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
