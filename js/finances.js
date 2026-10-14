/**
 * PROTEC LIVE - GESTION COMPLÈTE DE LA TRÉSORERIE & GRAPHIQUE FINANCIER
 * Suivi comptable précis de l'antenne, grand livre des recettes et dépenses,
 * filtres multicritères avancés (DPS, Formations, Véhicules, Logistique, Gardes...)
 * et graphique vectoriel interactif SVG.
 * Remplacement intégral des emojis par des icônes vectorielles Lucide.
 */

window.ProtecFinances = {
  // Filtres actifs dans la vue
  filters: {
    flow: 'all',          // 'all' | 'recette' | 'depense'
    category: 'all',      // 'all' | code catégorie
    search: '',           // texte recherché
    sortBy: 'date_desc'   // 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  },

  // Référentiel complet des catégories budgétaires avec icônes Lucide officielles
  CATEGORIES: {
    // RECETTES (ENTRÉES)
    dps: {
      id: 'dps',
      label: 'DPS & Postes de Secours',
      shortLabel: 'DPS',
      type: 'recette',
      icon: 'clipboard-list',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    formation: {
      id: 'formation',
      label: 'Formations Grand Public',
      shortLabel: 'Formations GP',
      type: 'recette',
      icon: 'graduation-cap',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    garde: {
      id: 'garde',
      label: 'Gardes SAMU & SDIS',
      shortLabel: 'Gardes 15/18',
      type: 'recette',
      icon: 'heart-pulse',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    subvention: {
      id: 'subvention',
      label: 'Subventions & Dotations',
      shortLabel: 'Subventions',
      type: 'recette',
      icon: 'landmark',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    dons: {
      id: 'dons',
      label: 'Dons & Mécénat',
      shortLabel: 'Dons & Mécénat',
      type: 'recette',
      icon: 'heart-handshake',
      badgeClass: 'bg-pink-100 text-pink-800 border-pink-200'
    },
    renfort: {
      id: 'renfort',
      label: 'Renforts & Alliances',
      shortLabel: 'Renforts',
      type: 'recette',
      icon: 'users',
      badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    },
    prestation: {
      id: 'prestation',
      label: 'Prestations & Soutien',
      shortLabel: 'Prestations',
      type: 'recette',
      icon: 'shield',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
    },

    // DÉPENSES (SORTIES)
    vehicule: {
      id: 'vehicule',
      label: 'Achat de Véhicules',
      shortLabel: 'Véhicules',
      type: 'depense',
      icon: 'truck',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    logistique: {
      id: 'logistique',
      label: 'Logistique & Matériel',
      shortLabel: 'Logistique',
      type: 'depense',
      icon: 'package',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    locaux: {
      id: 'locaux',
      label: 'Locaux & Bâtiment',
      shortLabel: 'Locaux',
      type: 'depense',
      icon: 'building-2',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-200'
    },
    entretien: {
      id: 'entretien',
      label: 'Carburant & Entretien',
      shortLabel: 'Entretien Flotte',
      type: 'depense',
      icon: 'wrench',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-200'
    },
    formation_interne: {
      id: 'formation_interne',
      label: 'Formations Internes & Secouristes',
      shortLabel: 'Formation INT',
      type: 'depense',
      icon: 'award',
      badgeClass: 'bg-violet-100 text-violet-800 border-violet-200'
    },
    salaires: {
      id: 'salaires',
      label: 'Salariés, Indemnités & RH',
      shortLabel: 'Salaires & RH',
      type: 'depense',
      icon: 'briefcase',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    frais: {
      id: 'frais',
      label: 'Frais Généraux & Assurances',
      shortLabel: 'Frais & Asso',
      type: 'depense',
      icon: 'file-text',
      badgeClass: 'bg-stone-100 text-stone-800 border-stone-200'
    },
    general: {
      id: 'general',
      label: 'Mouvements Divers',
      shortLabel: 'Divers',
      type: 'both',
      icon: 'coins',
      badgeClass: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  },

  // Normalisation intelligente des catégories passées ou brutes
  normalizeCategory(item) {
    let cat = (item.category || '').toLowerCase().trim();
    if (cat === 'salaires' || cat === 'personnel' || cat === 'rh') return 'salaires';
    if (cat === 'materiel' || cat === 'equipement') return 'logistique';
    if (cat === 'communication') return 'dons';
    if (cat === 'prestation' || cat === 'general' || !cat || !this.CATEGORIES[cat]) {
      const lbl = (item.label || '').toLowerCase();
      if (lbl.includes('salaire') || lbl.includes('indemnité mensuelle') || lbl.includes('virement mensuel') || lbl.includes('service civique') || lbl.includes('rh')) {
        return 'salaires';
      }
      if (lbl.includes('dps') || lbl.includes('dispositif') || lbl.includes('poste') || lbl.includes('course') || lbl.includes('match') || lbl.includes('festival') || lbl.includes('trail') || lbl.includes('concert')) {
        return 'dps';
      }
      if (lbl.includes('samu') || lbl.includes('sdis') || lbl.includes('garde') || lbl.includes('pompiers')) {
        return item.amount >= 0 ? (lbl.includes('dotation') ? 'subvention' : 'garde') : 'frais';
      }
      if (lbl.includes('formation') || lbl.includes('psc1') || lbl.includes('sst') || lbl.includes('gqs') || lbl.includes('b2b')) {
        return item.amount >= 0 ? 'formation' : 'formation_interne';
      }
      if (lbl.includes('véhicule') || lbl.includes('vpsp') || lbl.includes('vtu') || lbl.includes('vl') || lbl.includes('vtp') || lbl.includes('pma')) {
        return item.amount < 0 ? 'vehicule' : 'dps';
      }
      if (lbl.includes('subvention') || lbl.includes('dotation') || lbl.includes('fdva') || lbl.includes('cump') || lbl.includes('conventionnement') || lbl.includes('mairie') || lbl.includes('état') || lbl.includes('partenariat')) {
        return 'subvention';
      }
      if (lbl.includes('renfort') || lbl.includes('zonal') || lbl.includes('colonne') || lbl.includes('alliance')) {
        return 'renfort';
      }
      if (lbl.includes('don') || lbl.includes('mécénat') || lbl.includes('citoyen')) {
        return 'dons';
      }
      if (lbl.includes('pompage') || lbl.includes('épuisement') || lbl.includes('maraude')) {
        return 'prestation';
      }
      if (lbl.includes('lot') || lbl.includes('matériel') || lbl.includes('dae') || lbl.includes('oxygène') || lbl.includes('trousse') || lbl.includes('pansement') || lbl.includes('consommable')) {
        return 'logistique';
      }
      if (lbl.includes('loyer') || lbl.includes('antenne') || lbl.includes('locaux') || lbl.includes('bail') || lbl.includes('travaux') || lbl.includes('isolation')) {
        return 'locaux';
      }
      if (lbl.includes('carburant') || lbl.includes('révision') || lbl.includes('entretien') || lbl.includes('contrôle') || lbl.includes('garage') || lbl.includes('ct')) {
        return 'entretien';
      }
      if (lbl.includes('pse') || lbl.includes('chef') || lbl.includes('recyclage') || lbl.includes('stagiaire') || lbl.includes('permis') || lbl.includes('promotion')) {
        return 'formation_interne';
      }
      if (lbl.includes('assurance') || lbl.includes('cotisation') || lbl.includes('agrément') || lbl.includes('frais') || lbl.includes('aasc') || lbl.includes('abonnement')) {
        return 'frais';
      }
    }
    return this.CATEGORIES[cat] ? cat : (item.amount >= 0 ? 'dps' : 'logistique');
  },

  // Initialisation et assainissement 100% réel de la trésorerie (AUCUNE OPÉRATION FICTIVE)
  injectState(game) {
    if (!game) return;
    if (!game.financesHistory || !Array.isArray(game.financesHistory)) {
      game.financesHistory = [];
    }

    // 1. Élimination impérative de toute entrée fictive résiduelle des anciennes versions/démos
    const fakeKeywords = [
      'foulées municipales',
      'festival de printemps',
      'course pédestre',
      'station partenaire',
      'centrale d’achats sécurité civile',
      'centrale d\'achats',
      'renfort opérationnel zonal soutien crues',
      'campagne de dons citoyens & mécénat local'
    ];
    game.financesHistory = game.financesHistory.filter(h => {
      if (!h) return false;
      if (h.id && String(h.id).startsWith('tx-seed-')) return false;
      const lbl = (h.label || '').toLowerCase();
      if (fakeKeywords.some(kw => lbl.includes(kw))) return false;
      // Élimination des opérations à 0 € (aucun mouvement bancaire réel)
      const amt = Number(h.amount);
      if (isNaN(amt) || Math.abs(amt) < 0.01) return false;
      return true;
    });

    const currentMoney = Number(game.resources?.money) || 40000;
    const now = Date.now();

    // 2. Vérifier si une dotation initiale d'ouverture existe
    const hasInitialGrant = game.financesHistory.some(h => 
      h.ref === 'FONDS-INITIAL-PC' || h.ref === 'DOT-INIT-01' || 
      (h.label && (h.label.toLowerCase().includes('ouverture d’antenne') || h.label.toLowerCase().includes('dotation initiale')))
    );

    if (!hasInitialGrant) {
      // Reconstitution authentique :
      // Calcul du capital de départ pour que la balance cumulée coïncide rigoureusement avec le solde du joueur
      const knownOperationsSum = game.financesHistory.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
      const startingCapital = currentMoney - knownOperationsSum;

      const initialDotation = {
        id: `tx-init-${now}`,
        timestamp: now - (14 * 24 * 3600 * 1000),
        dateStr: 'Ouverture de l’Antenne',
        amount: Math.max(1000, startingCapital),
        label: 'Dotation Initiale d’Ouverture d’Antenne (Fonds Propres & Commune)',
        type: 'recette',
        category: 'subvention',
        ref: 'DOT-INIT-01',
        tier: 'Mairie & Protection Civile',
        balance: Math.max(1000, startingCapital)
      };

      game.financesHistory.unshift(initialDotation);
    }

    // 3. Normalisation et recalcul rigoureux des soldes cumulés chronologiques (balance)
    game.financesHistory.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Ajustement de la dotation initiale si nécessaire pour que la somme = currentMoney
    const totalOps = game.financesHistory.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
    const gap = currentMoney - totalOps;
    if (Math.abs(gap) > 0 && game.financesHistory.length > 0) {
      game.financesHistory[0].amount += gap;
      if (game.financesHistory[0].amount <= 0) {
        game.financesHistory[0].amount = 40000;
      }
    }

    let runningBalance = 0;
    game.financesHistory.forEach((h, index) => {
      if (!h.id) h.id = `tx-${h.timestamp || now}-${index}`;
      h.category = this.normalizeCategory(h);
      h.type = Number(h.amount) >= 0 ? 'recette' : 'depense';
      runningBalance += Number(h.amount) || 0;
      h.balance = runningBalance;
    });

    // Le dernier élément reflète le solde bancaire exact du joueur
    if (game.financesHistory.length > 0) {
      game.financesHistory[game.financesHistory.length - 1].balance = currentMoney;
    }
  },

  // Enregistrement d'une nouvelle opération financière dans le grand livre (Support universel objet ou arguments)
  recordTransaction(game, amountOrParams, label, category, ref, tier) {
    if (!game) return;
    this.injectState(game);

    let amount = 0;
    let lbl = 'Mouvement Bancaire';
    let cat = 'general';
    let r = null;
    let t = null;

    if (typeof amountOrParams === 'object' && amountOrParams !== null) {
      amount = Number(amountOrParams.amount) || 0;
      lbl = amountOrParams.label || 'Mouvement Bancaire';
      cat = amountOrParams.category || 'general';
      r = amountOrParams.ref || null;
      t = amountOrParams.tier || null;
    } else {
      amount = Number(amountOrParams) || 0;
      lbl = label || 'Mouvement Bancaire';
      cat = category || (amount >= 0 ? 'dps' : 'logistique');
      r = ref || null;
      t = tier || null;
    }

    // Aucun mouvement bancaire si le montant est nul (0 €) : ne rien enregistrer ni afficher
    if (!amount || Math.abs(amount) < 0.01) {
      return;
    }

    const currentMoney = Number(game.resources?.money) || 0;
    const newBalance = currentMoney; // Solde officiel après opération

    const normalizedCat = this.normalizeCategory({
      category: cat,
      label: lbl,
      amount: amount
    });

    const now = Date.now();
    const clockDay = game.clock?.day;
    const clockMonth = game.clock?.month;
    const clockYear = game.clock?.year;

    const dStr = (clockDay && clockMonth !== undefined) 
      ? `Jour ${clockDay} / ${clockMonth + 1} (${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})` 
      : new Date(now).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    const entry = {
      id: `tx-${now}-${Math.floor(Math.random() * 10000)}`,
      timestamp: now,
      gameDay: clockDay,
      gameMonth: clockMonth,
      gameYear: clockYear,
      dateStr: dStr,
      amount: amount,
      label: lbl,
      type: amount >= 0 ? 'recette' : 'depense',
      category: normalizedCat,
      ref: r || `OP-${Math.floor(1000 + Math.random() * 9000)}`,
      tier: t || (amount >= 0 ? 'Organisateur / Donateur' : 'Fournisseur AASC'),
      balance: newBalance
    };

    game.financesHistory.push(entry);

    // Limitation de l'historique à 300 opérations max
    if (game.financesHistory.length > 300) {
      game.financesHistory = game.financesHistory.slice(-300);
    }

    // Si la modale Finances est actuellement ouverte, rafraîchir son affichage
    const modal = document.getElementById('main-modal');
    if (modal && !modal.classList.contains('hidden') && window.game && window.game.currentModalKey === 'finances') {
      this.renderModal(game);
    }
  },

  // Gestion des filtres
  setFlowFilter(flow) {
    this.filters.flow = flow;
    this.renderModal(window.game);
  },

  setCategoryFilter(cat) {
    this.filters.category = cat;
    this.renderModal(window.game);
  },

  setSearchFilter(text) {
    this.filters.search = (text || '').toLowerCase().trim();
    this.renderModal(window.game);
  },

  setSortFilter(sort) {
    this.filters.sortBy = sort;
    this.renderModal(window.game);
  },

  clearFilters() {
    this.filters.flow = 'all';
    this.filters.category = 'all';
    this.filters.search = '';
    this.filters.sortBy = 'date_desc';
    this.renderModal(window.game);
  },

  renderFinancesModal(game) {
    this.renderModal(game);
  },

  openModal(game) {
    this.renderModal(game);
  },

  // Calcul et agrégation des soldes quotidiens (un seul point par jour, arrêté à 00h00)
  getDailyBalances(game) {
    if (!game) return [];
    this.injectState(game);

    const validHistory = (game.financesHistory || []).filter(h => {
      if (!h) return false;
      const amt = Number(h.amount);
      return !isNaN(amt) && Math.abs(amt) >= 0.01;
    });

    const currentMoney = Number(game.resources?.money) || 0;
    const clock = game.clock || {};
    const now = new Date();
    const currentYear = clock.year || now.getFullYear();
    const currentMonth = (clock.month !== undefined) ? clock.month : now.getMonth();
    const currentDay = (clock.day !== undefined) ? clock.day : now.getDate();

    const todayDate = new Date(currentYear, currentMonth, currentDay, 0, 0, 0, 0);
    const todayMs = todayDate.getTime();
    const oneDayMs = 24 * 3600 * 1000;

    if (validHistory.length === 0) {
      const prevDate = new Date(todayMs - oneDayMs);
      return [
        { dateStr: `Jour ${prevDate.getDate()}`, day: prevDate.getDate(), balance: currentMoney, timestamp: prevDate.getTime() },
        { dateStr: `Jour ${todayDate.getDate()}`, day: todayDate.getDate(), balance: currentMoney, timestamp: todayMs }
      ];
    }

    // Helper pour extraire le timestamp de minuit (00h00) correspondant à une transaction
    const getTxMidnightMs = (tx) => {
      if (tx.gameDay !== undefined) {
        const m = tx.gameMonth ?? currentMonth;
        const y = tx.gameYear ?? currentYear;
        return new Date(y, m, tx.gameDay, 0, 0, 0, 0).getTime();
      }
      if (tx.dateStr) {
        const match = tx.dateStr.match(/Jour\s+(\d+)(?:\s*(?:\/|M)\s*(\d+))?/i);
        if (match) {
          const d = parseInt(match[1], 10);
          const m = match[2] ? parseInt(match[2], 10) - 1 : currentMonth;
          return new Date(currentYear, m, d, 0, 0, 0, 0).getTime();
        }
      }
      if (tx.timestamp) {
        const d = new Date(tx.timestamp);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      }
      return todayMs;
    };

    // Trouver la date de début parmi les transactions opérationnelles
    const operationalTxs = validHistory.filter(tx => 
      tx.ref !== 'FONDS-INITIAL-PC' && 
      tx.ref !== 'DOT-INIT-01' && 
      !(tx.dateStr && (tx.dateStr.includes('Lancement') || tx.dateStr.includes('Ouverture')))
    );

    let startMs = todayMs - oneDayMs; // au minimum hier
    if (operationalTxs.length > 0) {
      const opDates = operationalTxs.map(tx => getTxMidnightMs(tx));
      const earliestOp = Math.min(...opDates);
      startMs = Math.min(startMs, earliestOp);
    } else if (validHistory.length > 0) {
      startMs = todayMs - oneDayMs;
    }

    // Limiter la fenêtre à 15 jours max pour un affichage lisible et ergonomique
    const maxLookback = todayMs - (14 * oneDayMs);
    if (startMs < maxLookback) {
      startMs = maxLookback;
    }

    // Pour chaque jour de startMs à todayMs (inclus), calculer le solde arrêté à 00h00
    const dailyPoints = [];
    const initialBalance = validHistory[0] ? validHistory[0].balance : currentMoney;

    for (let curMs = startMs; curMs <= todayMs; curMs += oneDayMs) {
      const curDate = new Date(curMs);

      // Transactions survenues strictement avant ce jour à 00h00
      const opsBeforeThisDay = validHistory.filter(tx => {
        const txMs = tx.timestamp || getTxMidnightMs(tx);
        return txMs < curMs;
      });

      let balanceAt00h00;
      if (opsBeforeThisDay.length > 0) {
        balanceAt00h00 = opsBeforeThisDay[opsBeforeThisDay.length - 1].balance;
      } else {
        const firstOp = validHistory[0];
        balanceAt00h00 = firstOp ? (firstOp.ref === 'FONDS-INITIAL-PC' || firstOp.ref === 'DOT-INIT-01' ? firstOp.balance : firstOp.balance - firstOp.amount) : initialBalance;
      }

      // Si c'est aujourd'hui, le solde correspond au solde en cours du compte
      let pointBalance = balanceAt00h00;
      if (curMs === todayMs) {
        pointBalance = currentMoney;
      }

      dailyPoints.push({
        dateStr: `Jour ${curDate.getDate()}`,
        day: curDate.getDate(),
        month: curDate.getMonth(),
        year: curDate.getFullYear(),
        timestamp: curMs,
        balance: Math.round(pointBalance)
      });
    }

    // Toujours garantir au moins 2 points
    if (dailyPoints.length === 1) {
      const single = dailyPoints[0];
      const prevDate = new Date(single.timestamp - oneDayMs);
      dailyPoints.unshift({
        dateStr: `Jour ${prevDate.getDate()}`,
        day: prevDate.getDate(),
        month: prevDate.getMonth(),
        year: prevDate.getFullYear(),
        timestamp: prevDate.getTime(),
        balance: single.balance
      });
    }

    return dailyPoints;
  },

  // Rendu de la vue principale dans la fenêtre modale
  renderModal(game) {
    game = game || window.game;
    const modal = document.getElementById('main-modal');
    const root = document.getElementById('modal-body') || document.getElementById('finances-modal-root');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    if (!root) return;

    if (modal) modal.classList.remove('hidden');
    if (title) title.textContent = "Direction Financière & Comptabilité Réglementaire";
    if (subtitle) subtitle.textContent = "Trésorerie d'antenne, grand livre des comptes, bilans d'exploitation et subventions";
    if (icon) icon.setAttribute('data-lucide', 'wallet');

    this.injectState(game);
    const history = (game.financesHistory || []).filter(h => h && typeof h.amount === 'number' && Math.abs(h.amount) >= 0.01);
    const currentMoney = Number(game.resources?.money) || 0;

    // Calcul des agrégats globaux
    const globalRecettes = history.filter(h => h.amount > 0).reduce((acc, h) => acc + h.amount, 0);
    const globalDepenses = Math.abs(history.filter(h => h.amount < 0).reduce((acc, h) => acc + h.amount, 0));
    const globalSoldeNet = globalRecettes - globalDepenses;

    // Calcul des soldes quotidiens pour le graphique (un seul point par jour, arrêté à 00h00)
    const dailyBalances = this.getDailyBalances(game);
    const dailyValues = dailyBalances.map(d => d.balance);
    const maxBalance = Math.max(...dailyValues, currentMoney, 1000);
    const minBalance = Math.min(...dailyValues, currentMoney, 0);

    // Filtrage des transactions selon les critères
    let filtered = [...history];

    // 1. Filtre par flux (Tous / Entrées / Sorties) : exclure strictement les montants nuls
    if (this.filters.flow === 'recette') {
      filtered = filtered.filter(h => Number(h.amount) > 0);
    } else if (this.filters.flow === 'depense') {
      filtered = filtered.filter(h => Number(h.amount) < 0);
    } else {
      filtered = filtered.filter(h => Math.abs(Number(h.amount)) >= 0.01);
    }

    // 2. Filtre par catégorie
    if (this.filters.category !== 'all') {
      filtered = filtered.filter(h => h.category === this.filters.category);
    }

    // 3. Recherche textuelle
    if (this.filters.search) {
      const q = this.filters.search;
      filtered = filtered.filter(h => {
        const catObj = this.CATEGORIES[h.category] || {};
        return (
          (h.label && h.label.toLowerCase().includes(q)) ||
          (h.ref && h.ref.toLowerCase().includes(q)) ||
          (h.tier && h.tier.toLowerCase().includes(q)) ||
          (catObj.label && catObj.label.toLowerCase().includes(q))
        );
      });
    }

    // 4. Tri
    if (this.filters.sortBy === 'date_desc') {
      filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } else if (this.filters.sortBy === 'date_asc') {
      filtered.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } else if (this.filters.sortBy === 'amount_desc') {
      filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (this.filters.sortBy === 'amount_asc') {
      filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
    }

    // Totaux sur la sélection filtrée
    const filteredRecettes = filtered.filter(h => h.amount > 0).reduce((acc, h) => acc + h.amount, 0);
    const filteredDepenses = Math.abs(filtered.filter(h => h.amount < 0).reduce((acc, h) => acc + h.amount, 0));

    // Calcul de la ventilation par catégorie pour les mini-jauges
    const categoryTotals = {};
    history.forEach(item => {
      const cat = item.category || 'general';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { count: 0, sum: 0, in: 0, out: 0 };
      }
      categoryTotals[cat].count++;
      categoryTotals[cat].sum += item.amount;
      if (item.amount >= 0) categoryTotals[cat].in += item.amount;
      else categoryTotals[cat].out += Math.abs(item.amount);
    });

    root.innerHTML = `
      <!-- 1. CARTES KPIS HAUT DE PAGE -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        <div class="p-4 rounded-2xl glass-card border border-pc-blue/30 bg-gradient-to-br from-blue-50/70 to-white shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-pc-blue flex items-center justify-between">
            <span>Solde Actuel</span>
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </span>
          <div class="text-xl sm:text-2xl font-black text-slate-900 mono-num">
            ${currentMoney.toLocaleString('fr-FR')} €
          </div>
          <span class="text-[10px] text-slate-500 font-medium block">
            Trésorerie disponible
          </span>
        </div>

        <div class="p-4 rounded-2xl glass-card border border-emerald-300/40 bg-gradient-to-br from-emerald-50/70 to-white shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center justify-between">
            <span>Entrées (Recettes)</span>
            <i data-lucide="arrow-up-right" class="w-4 h-4 text-emerald-600"></i>
          </span>
          <div class="text-xl sm:text-2xl font-black text-emerald-700 mono-num">
            +${globalRecettes.toLocaleString('fr-FR')} €
          </div>
          <span class="text-[10px] text-emerald-600 font-semibold block">
            DPS, Formations, SAMU
          </span>
        </div>

        <div class="p-4 rounded-2xl glass-card border border-rose-300/40 bg-gradient-to-br from-rose-50/70 to-white shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center justify-between">
            <span>Sorties (Dépenses)</span>
            <i data-lucide="arrow-down-right" class="w-4 h-4 text-rose-600"></i>
          </span>
          <div class="text-xl sm:text-2xl font-black text-rose-600 mono-num">
            -${globalDepenses.toLocaleString('fr-FR')} €
          </div>
          <span class="text-[10px] text-rose-500 font-semibold block">
            Véhicules, Matériel, Flotte
          </span>
        </div>

        <div class="p-4 rounded-2xl glass-card border border-slate-200 bg-gradient-to-br from-slate-50/70 to-white shadow-sm space-y-1">
          <span class="text-[10px] font-black uppercase tracking-wider ${globalSoldeNet >= 0 ? 'text-emerald-700' : 'text-amber-700'} flex items-center justify-between">
            <span>Bilan d’Exploitation</span>
            <span class="text-xs font-bold">${globalSoldeNet >= 0 ? 'PROFIT' : 'DÉFICIT'}</span>
          </span>
          <div class="text-xl sm:text-2xl font-black ${globalSoldeNet >= 0 ? 'text-emerald-700' : 'text-amber-700'} mono-num">
            ${globalSoldeNet >= 0 ? '+' : ''}${globalSoldeNet.toLocaleString('fr-FR')} €
          </div>
          <span class="text-[10px] text-slate-500 font-medium block">
            Résultat financier net
          </span>
        </div>

      </div>

      <!-- 1b. SEGMENTATION RÉGLEMENTAIRE DES 3 FLUX FINANCIERS DE L'AASC -->
      ${(() => {
        const fluxDps = history.filter(h => h.category === 'dps').reduce((acc, h) => acc + (h.amount > 0 ? h.amount : 0), 0);
        const fluxGarde = history.filter(h => h.category === 'garde' || h.category === 'prestation').reduce((acc, h) => acc + (h.amount > 0 ? h.amount : 0), 0);
        const fluxSubv = history.filter(h => h.category === 'subvention').reduce((acc, h) => acc + (h.amount > 0 ? h.amount : 0), 0);
        const totalFlux = (fluxDps + fluxGarde + fluxSubv) || 1;
        const pctDps = Math.round((fluxDps / totalFlux) * 100);
        const pctGarde = Math.round((fluxGarde / totalFlux) * 100);
        const pctSubv = Math.round((fluxSubv / totalFlux) * 100);

        return `
          <div class="p-4 rounded-3xl glass-card border border-slate-200/90 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-blue-50 text-pc-blue flex items-center justify-center">
                  <i data-lucide="scale" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-black text-slate-900 uppercase tracking-wider">Segmentation des 3 Flux de Trésorerie AASC</h4>
                  <p class="text-[11px] text-slate-500">Traçabilité budgétaire différenciée selon les directives de sécurité civile.</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-pc-blue/10 text-pc-blue">
                Répartition des Recettes
              </span>
            </div>

            <!-- Jauge segmentée 100% -->
            <div class="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden border border-slate-200/60">
              <div class="bg-amber-500 h-full transition-all" style="width: ${pctDps}%" title="DPS : ${pctDps}%"></div>
              <div class="bg-sky-500 h-full transition-all" style="width: ${pctGarde}%" title="Gardes 15/18 : ${pctGarde}%"></div>
              <div class="bg-indigo-600 h-full transition-all" style="width: ${pctSubv}%" title="Subventions : ${pctSubv}%"></div>
            </div>

            <!-- 3 Blocs de flux -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div class="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-amber-900 text-[11px]">1. DPS Facturés</span>
                  <span class="font-mono font-bold text-amber-800">${pctDps}%</span>
                </div>
                <div class="text-sm font-black text-amber-950 font-mono">+${fluxDps.toLocaleString('fr-FR')} €</div>
                <span class="text-[10px] text-amber-700 block">Devis privés & manifestations</span>
              </div>

              <div class="p-2.5 rounded-2xl bg-sky-50/60 border border-sky-200/70 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-sky-900 text-[11px]">2. Gardes SAMU & SDIS</span>
                  <span class="font-mono font-bold text-sky-800">${pctGarde}%</span>
                </div>
                <div class="text-sm font-black text-sky-950 font-mono">+${fluxGarde.toLocaleString('fr-FR')} €</div>
                <span class="text-[10px] text-sky-700 block">Forfaits astreintes & sorties 15</span>
              </div>

              <div class="p-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold text-indigo-900 text-[11px]">3. Subventions Publiques</span>
                  <span class="font-mono font-bold text-indigo-800">${pctSubv}%</span>
                </div>
                <div class="text-sm font-black text-indigo-950 font-mono">+${fluxSubv.toLocaleString('fr-FR')} €</div>
                <span class="text-[10px] text-indigo-700 block">Dotations Mairie & État FDVA</span>
              </div>
            </div>
          </div>
        `;
      })()}

      <!-- 2. COURBE SVG D'ÉVOLUTION DU SOLDE BANCAIRE -->
      <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              <i data-lucide="trending-up" class="w-4 h-4"></i>
            </div>
            <div>
              <h4 class="text-sm font-black text-white leading-tight">Courbe Chronologique du Solde</h4>
              <p class="text-[11px] text-slate-400">Évolution du solde quotidien de l'antenne sur toute la période</p>
            </div>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
              Max : ${maxBalance.toLocaleString('fr-FR')} €
            </span>
          </div>
        </div>

        <div class="w-full overflow-x-auto no-scrollbar">
          ${this.renderSvgChart(dailyBalances, minBalance, maxBalance)}
        </div>
      </div>

      <!-- 3. VENTILATION PAR PÔLE (SYNTHÈSE PAR CATÉGORIE) -->
      <div class="p-4 rounded-2xl glass-card space-y-3 border border-slate-200">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <i data-lucide="pie-chart" class="w-4 h-4 text-pc-blue"></i> Répartition des Flux par Pôle
          </h4>
          <span class="text-[11px] text-slate-500">Cliquez sur un pôle pour filtrer</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          ${this.renderCategorySummaryPills(categoryTotals, globalRecettes, globalDepenses)}
        </div>
      </div>

      <!-- 4. BARRE DE FILTRES MULTICRITÈRES COMPLÈTE -->
      <div class="p-4 rounded-2xl glass-card space-y-4 border border-pc-blue/20 bg-slate-50/50">
        
        <!-- Onglets principaux de flux (Tous / Entrées / Sorties) -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="inline-flex p-1 rounded-xl bg-slate-200/80 text-xs font-bold">
            <button
              onclick="window.ProtecFinances.setFlowFilter('all')"
              class="px-3 py-1.5 rounded-lg transition-all ${this.filters.flow === 'all' ? 'bg-white text-pc-blue shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              Tous les mouvements (${history.length})
            </button>
            <button
              onclick="window.ProtecFinances.setFlowFilter('recette')"
              class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${this.filters.flow === 'recette' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-emerald-700'}">
              <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i> Entrées (+${globalRecettes.toLocaleString('fr-FR')} €)
            </button>
            <button
              onclick="window.ProtecFinances.setFlowFilter('depense')"
              class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${this.filters.flow === 'depense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-rose-700'}">
              <i data-lucide="arrow-down-right" class="w-3.5 h-3.5"></i> Sorties (-${globalDepenses.toLocaleString('fr-FR')} €)
            </button>
          </div>

          <!-- Sélecteur de Tri -->
          <div class="flex items-center gap-2">
            <label class="text-[11px] font-bold text-slate-500">Trier par :</label>
            <select
              onchange="window.ProtecFinances.setSortFilter(this.value)"
              class="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:border-pc-blue">
              <option value="date_desc" ${this.filters.sortBy === 'date_desc' ? 'selected' : ''}>Plus récent en premier</option>
              <option value="date_asc" ${this.filters.sortBy === 'date_asc' ? 'selected' : ''}>Plus ancien en premier</option>
              <option value="amount_desc" ${this.filters.sortBy === 'amount_desc' ? 'selected' : ''}>Montant le plus élevé</option>
              <option value="amount_asc" ${this.filters.sortBy === 'amount_asc' ? 'selected' : ''}>Montant le plus faible</option>
            </select>
          </div>
        </div>

        <!-- Filtre de recherche textuelle rapide -->
        <div class="relative">
          <input
            type="text"
            id="finances-search-input"
            value="${this.filters.search}"
            oninput="window.ProtecFinances.setSearchFilter(this.value)"
            placeholder="Rechercher par libellé, référence (ex: DPS, VPSP, PSC1, SAMU, matériel...)"
            class="w-full text-xs bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pc-blue focus:ring-1 focus:ring-pc-blue font-medium"
          />
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none"></i>
          ${this.filters.search ? `
            <button onclick="window.ProtecFinances.setSearchFilter('')" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>

        <!-- Badges / Chips de catégories filtrables avec icônes Lucide -->
        <div class="space-y-1.5">
          <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtrer par catégorie :</div>
          <div class="flex flex-wrap gap-1.5 items-center">
            
            <button
              onclick="window.ProtecFinances.setCategoryFilter('all')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'all' ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i> Toutes
            </button>

            <!-- Entrées -->
            <button
              onclick="window.ProtecFinances.setCategoryFilter('dps')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'dps' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300'}">
              <i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i> DPS & Postes
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('formation')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'formation' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'}">
              <i data-lucide="graduation-cap" class="w-3.5 h-3.5"></i> Formations GP
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('garde')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'garde' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-300'}">
              <i data-lucide="heart-pulse" class="w-3.5 h-3.5"></i> Gardes SAMU/SDIS
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('subvention')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'subvention' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:border-indigo-300'}">
              <i data-lucide="landmark" class="w-3.5 h-3.5"></i> Subventions
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('dons')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'dons' ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'bg-pink-50 text-pink-800 border-pink-200 hover:border-pink-300'}">
              <i data-lucide="heart-handshake" class="w-3.5 h-3.5"></i> Dons & Mécénat
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('renfort')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'renfort' ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm' : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:border-cyan-300'}">
              <i data-lucide="users" class="w-3.5 h-3.5"></i> Renforts
            </button>

            <!-- Sorties -->
            <button
              onclick="window.ProtecFinances.setCategoryFilter('vehicule')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'vehicule' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-300'}">
              <i data-lucide="truck" class="w-3.5 h-3.5"></i> Véhicules
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('logistique')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'logistique' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300'}">
              <i data-lucide="package" class="w-3.5 h-3.5"></i> Logistique & Matériel
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('locaux')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'locaux' ? 'bg-amber-800 text-white border-amber-800 shadow-sm' : 'bg-amber-100 text-amber-900 border-amber-200 hover:border-amber-300'}">
              <i data-lucide="building-2" class="w-3.5 h-3.5"></i> Locaux & Bâtiment
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('entretien')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'entretien' ? 'bg-slate-700 text-white border-slate-700 shadow-sm' : 'bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'}">
              <i data-lucide="wrench" class="w-3.5 h-3.5"></i> Entretien & Carburant
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('formation_interne')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'formation_interne' ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-violet-50 text-violet-800 border-violet-200 hover:border-violet-300'}">
              <i data-lucide="award" class="w-3.5 h-3.5"></i> Formations Internes
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('frais')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${this.filters.category === 'frais' ? 'bg-stone-700 text-white border-stone-700 shadow-sm' : 'bg-stone-100 text-stone-800 border-stone-200 hover:border-stone-300'}">
              <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Frais & Assurances
            </button>

          </div>
        </div>

        <!-- Indicateur du filtre actif et réinitialisation -->
        <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
          <div>
            Résultats : <strong class="text-slate-800 font-bold">${filtered.length}</strong> opération(s)
            ${filtered.length > 0 ? `• Entrées : <strong class="text-emerald-700">+${filteredRecettes.toLocaleString('fr-FR')} €</strong> • Sorties : <strong class="text-rose-600">-${filteredDepenses.toLocaleString('fr-FR')} €</strong>` : ''}
          </div>
          ${(this.filters.flow !== 'all' || this.filters.category !== 'all' || this.filters.search) ? `
            <button onclick="window.ProtecFinances.clearFilters()" class="text-pc-blue font-bold hover:underline flex items-center gap-1">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Réinitialiser tous les filtres
            </button>
          ` : ''}
        </div>

      </div>

      <!-- 5. TABLEAU DU GRAND LIVRE COMPTABLE -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <i data-lucide="receipt" class="w-4 h-4 text-pc-blue"></i> Mouvements Comptables Détaillés
          </h4>
          <button
            onclick="window.ProtecFinances.exportGrandLivre(window.game)"
            class="text-[11px] font-bold text-pc-blue hover:text-pc-blue/80 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copier le Relevé Comptable
          </button>
        </div>

        ${filtered.length === 0 ? `
          <div class="p-8 text-center rounded-2xl glass-card border border-dashed border-slate-300 space-y-2">
            <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-1">
              <i data-lucide="search-x" class="w-5 h-5"></i>
            </div>
            <p class="text-xs font-bold text-slate-700">Aucune transaction ne correspond aux filtres appliqués.</p>
            <p class="text-[11px] text-slate-400">Essayez de réinitialiser la recherche ou de sélectionner « Toutes » les catégories.</p>
            <button onclick="window.ProtecFinances.clearFilters()" class="mt-2 text-xs font-bold text-pc-blue underline">
              Afficher tout l'historique
            </button>
          </div>
        ` : `
          <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
            ${filtered.map(item => {
              const catObj = this.CATEGORIES[item.category] || this.CATEGORIES.general;
              const isPositive = item.amount >= 0;

              return `
                <div class="p-3.5 rounded-2xl glass-card border border-slate-100 hover:border-pc-blue/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group">
                  
                  <!-- Gauche : Icône, Libellé, Date & Badges -->
                  <div class="flex items-start sm:items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center font-bold text-base shadow-sm ${isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}">
                      <i data-lucide="${catObj.icon || (isPositive ? 'arrow-up-right' : 'arrow-down-right')}" class="w-5 h-5"></i>
                    </div>

                    <div class="min-w-0 space-y-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <strong class="text-slate-900 font-bold truncate">${item.label}</strong>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${catObj.badgeClass}">
                          ${catObj.label}
                        </span>
                      </div>
                      
                      <div class="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3 text-slate-400"></i> ${item.dateStr || 'Date N/A'}</span>
                        ${item.ref ? `<span class="flex items-center gap-1"><i data-lucide="tag" class="w-3 h-3 text-slate-400"></i> Réf: <span class="font-mono text-slate-600">${item.ref}</span></span>` : ''}
                        ${item.tier ? `<span class="flex items-center gap-1"><i data-lucide="building" class="w-3 h-3 text-slate-400"></i> Tiers: ${item.tier}</span>` : ''}
                      </div>
                    </div>
                  </div>

                  <!-- Droite : Montant & Solde bancaire après opération -->
                  <div class="text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between sm:justify-center items-end">
                    <span class="text-sm font-black mono-num ${isPositive ? 'text-emerald-700' : 'text-rose-600'} block">
                      ${isPositive ? '+' : ''}${item.amount.toLocaleString('fr-FR')} €
                    </span>
                    <span class="text-[10px] text-slate-400 font-mono block">
                      Solde : ${(item.balance || 0).toLocaleString('fr-FR')} €
                    </span>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Rendu des pastilles de synthèse en haut de tableau avec icônes Lucide
  renderCategorySummaryPills(totals, totalIn, totalOut) {
    const list = [
      { key: 'dps', name: 'DPS', cat: this.CATEGORIES.dps },
      { key: 'formation', name: 'Form. GP', cat: this.CATEGORIES.formation },
      { key: 'garde', name: 'Gardes', cat: this.CATEGORIES.garde },
      { key: 'subvention', name: 'Subventions', cat: this.CATEGORIES.subvention },
      { key: 'vehicule', name: 'Véhicules', cat: this.CATEGORIES.vehicule },
      { key: 'logistique', name: 'Logistique', cat: this.CATEGORIES.logistique }
    ];

    return list.map(item => {
      const data = totals[item.key] || { count: 0, sum: 0, in: 0, out: 0 };
      const isSelected = this.filters.category === item.key;
      const isExpense = item.cat.type === 'depense';
      const amount = isExpense ? data.out : data.in;

      return `
        <button
          onclick="window.ProtecFinances.setCategoryFilter('${isSelected ? 'all' : item.key}')"
          class="p-2.5 rounded-xl border text-left transition-all ${isSelected ? 'ring-2 ring-pc-blue bg-white shadow-sm' : 'bg-white/80 hover:bg-white border-slate-200'}">
          <div class="flex items-center justify-between text-[11px] mb-1">
            <span class="font-bold text-slate-700 truncate flex items-center gap-1.5">
              <i data-lucide="${item.cat.icon}" class="w-3.5 h-3.5 text-slate-500"></i> ${item.name}
            </span>
            <span class="text-[9px] text-slate-400 font-mono font-bold">${data.count} ops</span>
          </div>
          <div class="text-xs font-black mono-num ${isExpense ? 'text-rose-600' : 'text-emerald-700'}">
            ${isExpense ? '-' : '+'}${amount.toLocaleString('fr-FR')} €
          </div>
        </button>
      `;
    }).join('');
  },

  // Exportation textuelle du relevé de compte
  exportGrandLivre(game) {
    this.injectState(game);
    const history = game.financesHistory || [];
    let text = `========================================\n`;
    text += `PROTECTION CIVILE - GRAND LIVRE COMPTABLE\n`;
    text += `Date de l'export : ${new Date().toLocaleDateString('fr-FR')}\n`;
    text += `Solde Actuel : ${game.resources?.money?.toLocaleString('fr-FR')} €\n`;
    text += `========================================\n\n`;

    history.forEach(item => {
      const sign = item.amount >= 0 ? '+' : '';
      text += `[${item.dateStr}] ${item.ref || 'REF-N/A'} | ${item.category.toUpperCase()} | ${item.label} : ${sign}${item.amount} € (Solde : ${item.balance} €)\n`;
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        game.showToast('Relevé copié !', 'Le grand livre comptable a été copié dans votre presse-papier.', 'green');
      }).catch(() => {
        game.showToast('Grand Livre', 'Relevé généré avec succès.', 'blue');
      });
    } else {
      game.showToast('Grand Livre', 'Relevé comptable généré.', 'blue');
    }
  },

  // Génération du SVG de courbe fluide et interactive (un point par jour)
  renderSvgChart(dailyPoints, minBalance, maxBalance) {
    if (!dailyPoints || dailyPoints.length === 0) {
      return '<div class="p-8 text-center text-xs text-slate-400">Aucune donnée de solde disponible.</div>';
    }

    const width = 640;
    const height = 180;
    const padX = 40;
    const padY = 25;

    // Si un seul point, dupliquer pour tracer une ligne plate
    const displayPoints = dailyPoints.length === 1 ? [
      { ...dailyPoints[0], dateStr: `Jour ${Math.max(1, (dailyPoints[0].day || 2) - 1)}` },
      { ...dailyPoints[0] }
    ] : dailyPoints;

    const rangeY = Math.max(1, maxBalance - minBalance);
    const stepX = (width - padX * 2) / (displayPoints.length - 1);

    // Coordonnées des points
    const points = displayPoints.map((item, idx) => {
      const x = padX + (idx * stepX);
      const normY = (item.balance - minBalance) / rangeY;
      const y = (height - padY) - (normY * (height - padY * 2));
      return { x, y, item };
    });

    // Construction du chemin SVG (Smooth bezier path)
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpx1 = p0.x + (p1.x - p0.x) / 2;
      const cpy1 = p0.y;
      const cpx2 = p0.x + (p1.x - p0.x) / 2;
      const cpy2 = p1.y;
      pathD += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p1.x} ${p1.y}`;
    }

    // Zone de remplissage dégradée
    const lastP = points[points.length - 1];
    const firstP = points[0];
    const fillPathD = `${pathD} L ${lastP.x} ${height - padY} L ${firstP.x} ${height - padY} Z`;

    return `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-44 overflow-visible">
        <defs>
          <linearGradient id="financesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Lignes horizontales de repère -->
        <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" stroke="#334155" stroke-width="1" stroke-dasharray="4" />
        <line x1="${padX}" y1="${height / 2}" x2="${width - padX}" y2="${height / 2}" stroke="#334155" stroke-width="1" stroke-dasharray="4" />
        <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#334155" stroke-width="1" />

        <!-- Libellés Y -->
        <text x="${padX - 8}" y="${padY + 4}" fill="#94a3b8" font-size="9" text-anchor="end" font-weight="bold">${Math.round(maxBalance).toLocaleString('fr-FR')} €</text>
        <text x="${padX - 8}" y="${height / 2 + 3}" fill="#64748b" font-size="8" text-anchor="end">${Math.round((maxBalance + minBalance) / 2).toLocaleString('fr-FR')} €</text>
        <text x="${padX - 8}" y="${height - padY + 3}" fill="#94a3b8" font-size="9" text-anchor="end" font-weight="bold">${Math.round(minBalance).toLocaleString('fr-FR')} €</text>

        <!-- Surface dégradée -->
        <path d="${fillPathD}" fill="url(#financesGradient)" />

        <!-- Ligne continue de solde -->
        <path d="${pathD}" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" />

        <!-- Points de données cliquables/survolables (un point par jour) -->
        ${points.map((p, i) => `
          <g class="cursor-pointer group">
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#10b981" stroke="#ffffff" stroke-width="2" class="hover:r-6 transition-all" />
            <!-- Étiquette au survol (solde quotidien propre sans mentionner 00h00) -->
            <title>${p.item.dateStr || ''} : ${(p.item.balance || 0).toLocaleString('fr-FR')} €\nSolde quotidien</title>
            <!-- Libellé du jour en bas -->
            ${i % Math.ceil(points.length / 8) === 0 || i === points.length - 1 ? `
              <text x="${p.x}" y="${height - 6}" fill="#94a3b8" font-size="8" text-anchor="middle" font-weight="600">${p.item.dateStr}</text>
            ` : ''}
          </g>
        `).join('')}
      </svg>
    `;
  }
};
