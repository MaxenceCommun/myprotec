/**
 * PROTEC LIVE - GESTION COMPLÈTE DE LA TRÉSORERIE & GRAPHIQUE FINANCIER
 * Suivi comptable précis de l'antenne, grand livre des recettes et dépenses,
 * filtres multicritères avancés (DPS, Formations, Véhicules, Logistique, Gardes...)
 * et graphique vectoriel interactif SVG.
 */

window.ProtecFinances = {
  // Filtres actifs dans la vue
  filters: {
    flow: 'all',          // 'all' | 'recette' | 'depense'
    category: 'all',      // 'all' | code catégorie
    search: '',           // texte recherché
    sortBy: 'date_desc'   // 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  },

  // Référentiel complet des catégories budgétaires
  CATEGORIES: {
    // RECETTES (ENTRÉES)
    dps: {
      id: 'dps',
      label: 'DPS & Postes de Secours',
      shortLabel: 'DPS',
      type: 'recette',
      icon: 'clipboard-list',
      emoji: '📋',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    formation: {
      id: 'formation',
      label: 'Formations Grand Public',
      shortLabel: 'Formations GP',
      type: 'recette',
      icon: 'graduation-cap',
      emoji: '🎓',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    garde: {
      id: 'garde',
      label: 'Gardes SAMU & SDIS',
      shortLabel: 'Gardes 15/18',
      type: 'recette',
      icon: 'heart-pulse',
      emoji: '🚑',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    subvention: {
      id: 'subvention',
      label: 'Subventions & Dotations',
      shortLabel: 'Subventions',
      type: 'recette',
      icon: 'landmark',
      emoji: '🏛️',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    dons: {
      id: 'dons',
      label: 'Dons & Mécénat',
      shortLabel: 'Dons & Mécénat',
      type: 'recette',
      icon: 'heart-handshake',
      emoji: '💙',
      badgeClass: 'bg-pink-100 text-pink-800 border-pink-200'
    },
    renfort: {
      id: 'renfort',
      label: 'Renforts & Alliances',
      shortLabel: 'Renforts',
      type: 'recette',
      icon: 'users',
      emoji: '🤝',
      badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    },
    prestation: {
      id: 'prestation',
      label: 'Prestations & Soutien',
      shortLabel: 'Prestations',
      type: 'recette',
      icon: 'shield',
      emoji: '🛡️',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
    },

    // DÉPENSES (SORTIES)
    vehicule: {
      id: 'vehicule',
      label: 'Achat de Véhicules',
      shortLabel: 'Véhicules',
      type: 'depense',
      icon: 'truck',
      emoji: '🚐',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    logistique: {
      id: 'logistique',
      label: 'Logistique & Matériel',
      shortLabel: 'Logistique',
      type: 'depense',
      icon: 'package',
      emoji: '📦',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    locaux: {
      id: 'locaux',
      label: 'Locaux & Bâtiment',
      shortLabel: 'Locaux',
      type: 'depense',
      icon: 'building-2',
      emoji: '🏢',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-200'
    },
    entretien: {
      id: 'entretien',
      label: 'Carburant & Entretien',
      shortLabel: 'Entretien Flotte',
      type: 'depense',
      icon: 'wrench',
      emoji: '⛽',
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-200'
    },
    formation_interne: {
      id: 'formation_interne',
      label: 'Formations Internes & Secouristes',
      shortLabel: 'Formation INT',
      type: 'depense',
      icon: 'award',
      emoji: '🧑‍🚒',
      badgeClass: 'bg-violet-100 text-violet-800 border-violet-200'
    },
    frais: {
      id: 'frais',
      label: 'Frais Généraux & Assurances',
      shortLabel: 'Frais & Asso',
      type: 'depense',
      icon: 'file-text',
      emoji: '📑',
      badgeClass: 'bg-stone-100 text-stone-800 border-stone-200'
    },
    general: {
      id: 'general',
      label: 'Mouvements Divers',
      shortLabel: 'Divers',
      type: 'both',
      icon: 'coins',
      emoji: '💶',
      badgeClass: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  },

  // Normalisation intelligente des catégories passées ou brutes
  normalizeCategory(item) {
    let cat = (item.category || '').toLowerCase().trim();
    if (cat === 'materiel' || cat === 'equipement') return 'logistique';
    if (cat === 'communication') return 'dons';
    if (cat === 'prestation' || cat === 'general' || !cat || !this.CATEGORIES[cat]) {
      const lbl = (item.label || '').toLowerCase();
      if (lbl.includes('dps') || lbl.includes('dispositif') || lbl.includes('poste') || lbl.includes('course') || lbl.includes('match') || lbl.includes('festival') || lbl.includes('trail') || lbl.includes('concert')) {
        return 'dps';
      }
      if (lbl.includes('samu') || lbl.includes('sdis') || lbl.includes('garde') || lbl.includes('pompiers')) {
        return item.amount >= 0 ? (lbl.includes('dotation') ? 'subvention' : 'garde') : 'frais';
      }
      if (lbl.includes('formation') || lbl.includes('psc1') || lbl.includes('sst') || lbl.includes('gqs')) {
        return item.amount >= 0 ? 'formation' : 'formation_interne';
      }
      if (lbl.includes('véhicule') || lbl.includes('vpsp') || lbl.includes('vtu') || lbl.includes('vl') || lbl.includes('vtp') || lbl.includes('pma')) {
        return item.amount < 0 ? 'vehicule' : 'dps';
      }
      if (lbl.includes('subvention') || lbl.includes('dotation') || lbl.includes('fdva') || lbl.includes('cump') || lbl.includes('conventionnement') || lbl.includes('mairie') || lbl.includes('état')) {
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
      if (lbl.includes('lot') || lbl.includes('matériel') || lbl.includes('dae') || lbl.includes('oxygène') || lbl.includes('trousse') || lbl.includes('pansement')) {
        return 'logistique';
      }
      if (lbl.includes('loyer') || lbl.includes('antenne') || lbl.includes('locaux') || lbl.includes('bail')) {
        return 'locaux';
      }
      if (lbl.includes('carburant') || lbl.includes('révision') || lbl.includes('entretien') || lbl.includes('contrôle')) {
        return 'entretien';
      }
      if (lbl.includes('pse') || lbl.includes('chef') || lbl.includes('recyclage') || lbl.includes('stagiaire')) {
        return 'formation_interne';
      }
      if (lbl.includes('assurance') || lbl.includes('cotisation') || lbl.includes('agrément') || lbl.includes('frais')) {
        return 'frais';
      }
    }
    return this.CATEGORIES[cat] ? cat : (item.amount >= 0 ? 'dps' : 'logistique');
  },

  // Initialisation et enrichissement réaliste si historique vide ou minimal
  injectState(game) {
    if (!game.financesHistory || !Array.isArray(game.financesHistory)) {
      game.financesHistory = [];
    }

    // Normalisation de chaque entrée existante
    game.financesHistory.forEach((h, index) => {
      if (!h.id) h.id = `tx-${h.timestamp || Date.now()}-${index}`;
      h.category = this.normalizeCategory(h);
      h.type = h.amount >= 0 ? 'recette' : 'depense';
    });

    // Si historique trop faible (< 4 opérations), amorcer un historique comptable complet et réaliste
    // dont le solde final coïncide rigoureusement avec le solde actuel du joueur !
    if (game.financesHistory.length <= 1) {
      const finalBalance = game.resources?.money || 15000;
      const now = Date.now();
      const oneHour = 3600 * 1000;
      const oneDay = 24 * oneHour;

      // Séquence type d'opérations d'antenne avec libellés officiels Protection Civile
      const seedOperations = [
        { label: 'Dotation Initiale Préfecture & Commune', category: 'subvention', amount: 10000, daysAgo: 10, tier: 'Préfecture / Mairie', ref: 'SUBV-2026-01' },
        { label: 'Agrément Préfectoral AASC & Frais d’immatriculation', category: 'frais', amount: -350, daysAgo: 9, tier: 'Préfecture', ref: 'ADM-PREF-04' },
        { label: 'Achat Lot Matériel Premiers Secours (Lots A & B, DAE)', category: 'logistique', amount: -2150, daysAgo: 8, tier: 'Centrale d’Achats Sécurité Civile', ref: 'FAC-MED-102' },
        { label: 'Assurances Nationales Bénévoles & Adhésion FNPC', category: 'frais', amount: -650, daysAgo: 7, tier: 'Fédération Nationale', ref: 'COTIS-FNPC-26' },
        { label: 'Conventionnement Initial Régulation SAMU 15', category: 'subvention', amount: 350, daysAgo: 6, tier: 'CHRU / SAMU 15', ref: 'CONV-SAMU-01' },
        { label: 'Session Formation Grand Public PSC1 (10 stagiaires)', category: 'formation', amount: 600, daysAgo: 5, tier: 'Inscriptions Citoyennes', ref: 'FORM-PSC1-01' },
        { label: 'Carburant & Révision Réglementaire Flotte', category: 'entretien', amount: -180, daysAgo: 4, tier: 'Station Partenaire', ref: 'CARB-FLOTTE-11' },
        { label: 'DPS Course Pédestre des Foulées Municipales', category: 'dps', amount: 850, daysAgo: 3, tier: 'Comité des Fêtes', ref: 'DPS-SPORT-05' },
        { label: 'Stage Formation Interne PSE2 (2 Secouristes promus)', category: 'formation_interne', amount: -450, daysAgo: 2, tier: 'Centre National de Formation', ref: 'STG-PSE2-02' },
        { label: 'Renfort Opérationnel Zonal Soutien Crues & Inondations', category: 'renfort', amount: 480, daysAgo: 1.5, tier: 'Zone de Défense', ref: 'RENF-ZONAL-09' },
        { label: 'Campagne de Dons Citoyens & Mécénat Local', category: 'dons', amount: 520, daysAgo: 1, tier: 'Plateforme Dons FNPC', ref: 'DON-MECE-33' },
        { label: 'DPS Soirée Concert & Festival de Printemps', category: 'dps', amount: 1100, daysAgo: 0.5, tier: 'Production Événementielle', ref: 'DPS-FEST-18' }
      ];

      // Calcul de la somme des opérations modèles
      const seedSum = seedOperations.reduce((acc, op) => acc + op.amount, 0);
      const adjustment = finalBalance - seedSum;

      // Première ligne d'ajustement de dotation de départ pour garantir 100% l'exactitude du solde
      const initialDotation = {
        id: `tx-init-${now}`,
        timestamp: now - 12 * oneDay,
        dateStr: 'Lancement de l’Antenne',
        amount: Math.max(5000, 10000 + adjustment),
        label: 'Fonds Propres & Dotation de Démarrage d’Antenne',
        type: 'recette',
        category: 'subvention',
        ref: 'FONDS-INITIAL-PC',
        tier: 'Association Protection Civile',
        balance: Math.max(5000, 10000 + adjustment)
      };

      let runningBalance = initialDotation.amount;
      const history = [initialDotation];

      seedOperations.forEach((op, idx) => {
        runningBalance += op.amount;
        const txTime = now - Math.round(op.daysAgo * oneDay);
        history.push({
          id: `tx-seed-${idx}-${txTime}`,
          timestamp: txTime,
          dateStr: `J-${Math.round(op.daysAgo)} • ${idx % 2 === 0 ? '10h30' : '15h45'}`,
          amount: op.amount,
          label: op.label,
          type: op.amount >= 0 ? 'recette' : 'depense',
          category: op.category,
          ref: op.ref,
          tier: op.tier,
          balance: runningBalance
        });
      });

      // Si petit écart résiduel par rapport au solde actuel, dernière ligne d'ajustement
      if (runningBalance !== finalBalance) {
        const delta = finalBalance - runningBalance;
        runningBalance += delta;
        history.push({
          id: `tx-adj-${now}`,
          timestamp: now - 1000,
          dateStr: 'Aujourd’hui',
          amount: delta,
          label: delta >= 0 ? 'Régularisation Trésorerie d’Ouverture' : 'Ajustement Comptable d’Ouverture',
          type: delta >= 0 ? 'recette' : 'depense',
          category: delta >= 0 ? 'subvention' : 'frais',
          ref: 'REGUL-BANQUE-01',
          tier: 'Banque d’Antenne',
          balance: finalBalance
        });
      }

      game.financesHistory = history;
    }
  },

  // Enregistrer une nouvelle transaction financière
  recordTransaction(game, amount, label, category = 'general', tier = null) {
    if (!game) return;
    this.injectState(game);

    const now = Date.now();
    const currentBalance = game.resources?.money || 0;
    const dateStr = game.clock
      ? `${game.clock.dayName || 'Aujourd’hui'} ${game.clock.hour || '12'}h`
      : 'Aujourd’hui';

    const normalizedCategory = this.normalizeCategory({ category, label, amount });
    const refCode = `PC-${new Date(now).getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx = {
      id: `tx-${now}-${Math.floor(Math.random() * 10000)}`,
      timestamp: now,
      dateStr: dateStr,
      amount: Math.round(amount),
      label: label || 'Opération Financière',
      type: amount >= 0 ? 'recette' : 'depense',
      category: normalizedCategory,
      tier: tier || (amount >= 0 ? 'Organisateur / Donateur' : 'Fournisseur / Prestataire'),
      ref: refCode,
      balance: currentBalance
    };

    game.financesHistory.push(newTx);

    // Historique étendu à 250 entrées
    if (game.financesHistory.length > 250) {
      game.financesHistory.shift();
    }

    // Si la modale est actuellement ouverte, rafraîchir en direct
    if (game.currentModalKey === 'finances') {
      this.refreshFinancesModal(game);
    }
  },

  // Modification des filtres
  setFlowFilter(flow, game) {
    this.filters.flow = flow;
    this.refreshFinancesModal(game || window.game);
  },

  setCategoryFilter(category, game) {
    this.filters.category = category;
    this.refreshFinancesModal(game || window.game);
  },

  setSortFilter(sortBy, game) {
    this.filters.sortBy = sortBy;
    this.refreshFinancesModal(game || window.game);
  },

  setSearchFilter(query, game) {
    this.filters.search = query.toLowerCase().trim();
    this.refreshFinancesModal(game || window.game);
  },

  clearFilters(game) {
    this.filters.flow = 'all';
    this.filters.category = 'all';
    this.filters.search = '';
    this.filters.sortBy = 'date_desc';
    this.refreshFinancesModal(game || window.game);
  },

  // Rendu principal de la modale Finances
  renderFinancesModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Trésorerie & Grand Livre Comptable';
    subtitle.textContent = 'Suivi budgétaire précis, filtrage des entrées/sorties et ventilation par pôle';
    icon.setAttribute('data-lucide', 'euro');

    body.innerHTML = `
      <div id="finances-root" class="space-y-6">
        <!-- Rendu dynamique injecté par refreshFinancesModal -->
      </div>
    `;

    this.refreshFinancesModal(game);
  },

  // Rafraîchissement ultra fluide du contenu sans recharger la modale entière
  refreshFinancesModal(game) {
    const root = document.getElementById('finances-root');
    if (!root) return;

    this.injectState(game);
    const history = game.financesHistory || [];
    const currentMoney = game.resources?.money || 0;

    // Calcul des agrégats globaux
    const globalRecettes = history.filter(h => h.amount > 0).reduce((acc, h) => acc + h.amount, 0);
    const globalDepenses = Math.abs(history.filter(h => h.amount < 0).reduce((acc, h) => acc + h.amount, 0));
    const globalSoldeNet = globalRecettes - globalDepenses;

    // Calcul des balances pour le graphique
    const balances = history.map(h => h.balance);
    const maxBalance = Math.max(...balances, currentMoney, 1000);
    const minBalance = Math.min(...balances, currentMoney, 0);

    // Filtrage des transactions selon les critères
    let filtered = [...history];

    // 1. Filtre par flux (Tous / Entrées / Sorties)
    if (this.filters.flow === 'recette') {
      filtered = filtered.filter(h => h.amount >= 0);
    } else if (this.filters.flow === 'depense') {
      filtered = filtered.filter(h => h.amount < 0);
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
    const filteredNet = filteredRecettes - filteredDepenses;

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
            <span class="text-xs">↗</span>
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
            <span class="text-xs">↘</span>
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

      <!-- 2. COURBE SVG D'ÉVOLUTION DU SOLDE BANCAIRE -->
      <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              📈
            </div>
            <div>
              <h4 class="text-sm font-black text-white leading-tight">Courbe Chronologique du Solde</h4>
              <p class="text-[11px] text-slate-400">Évolution du compte bancaire de l'antenne sur toute la période</p>
            </div>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
              Max : ${maxBalance.toLocaleString('fr-FR')} €
            </span>
          </div>
        </div>

        <div class="w-full overflow-x-auto no-scrollbar">
          ${this.renderSvgChart(history, minBalance, maxBalance)}
        </div>
      </div>

      <!-- 3. VENTILATION PAR PÔLE (SYNTHÈSE PAR CATÉGORIE) -->
      <div class="p-4 rounded-2xl glass-card space-y-3 border border-slate-200">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>📊</span> Répartition des Flux par Pôle
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
              <span>↗</span> Entrées (+${globalRecettes.toLocaleString('fr-FR')} €)
            </button>
            <button
              onclick="window.ProtecFinances.setFlowFilter('depense')"
              class="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${this.filters.flow === 'depense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-rose-700'}">
              <span>↘</span> Sorties (-${globalDepenses.toLocaleString('fr-FR')} €)
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
          <span class="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          ${this.filters.search ? `
            <button onclick="window.ProtecFinances.setSearchFilter('')" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold">✕</button>
          ` : ''}
        </div>

        <!-- Badges / Chips de catégories filtrables -->
        <div class="space-y-1.5">
          <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtrer par catégorie :</div>
          <div class="flex flex-wrap gap-1.5 items-center">
            
            <button
              onclick="window.ProtecFinances.setCategoryFilter('all')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'all' ? 'bg-pc-blue text-white border-pc-blue shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
              🌟 Toutes
            </button>

            <!-- Entrées -->
            <button
              onclick="window.ProtecFinances.setCategoryFilter('dps')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'dps' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300'}">
              📋 DPS & Postes
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('formation')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'formation' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300'}">
              🎓 Formations GP
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('garde')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'garde' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-300'}">
              🚑 Gardes SAMU/SDIS
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('subvention')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'subvention' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:border-indigo-300'}">
              🏛️ Subventions
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('dons')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'dons' ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'bg-pink-50 text-pink-800 border-pink-200 hover:border-pink-300'}">
              💙 Dons & Mécénat
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('renfort')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'renfort' ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm' : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:border-cyan-300'}">
              🤝 Renforts
            </button>

            <!-- Sorties -->
            <button
              onclick="window.ProtecFinances.setCategoryFilter('vehicule')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'vehicule' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-300'}">
              🚐 Véhicules
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('logistique')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'logistique' ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300'}">
              📦 Logistique & Matériel
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('locaux')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'locaux' ? 'bg-amber-800 text-white border-amber-800 shadow-sm' : 'bg-amber-100 text-amber-900 border-amber-200 hover:border-amber-300'}">
              🏢 Locaux & Bâtiment
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('entretien')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'entretien' ? 'bg-slate-700 text-white border-slate-700 shadow-sm' : 'bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'}">
              ⛽ Entretien & Carburant
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('formation_interne')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'formation_interne' ? 'bg-violet-600 text-white border-violet-600 shadow-sm' : 'bg-violet-50 text-violet-800 border-violet-200 hover:border-violet-300'}">
              🧑‍🚒 Formations Internes
            </button>

            <button
              onclick="window.ProtecFinances.setCategoryFilter('frais')"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${this.filters.category === 'frais' ? 'bg-stone-700 text-white border-stone-700 shadow-sm' : 'bg-stone-100 text-stone-800 border-stone-200 hover:border-stone-300'}">
              📑 Frais & Assurances
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
              <span>✕</span> Réinitialiser tous les filtres
            </button>
          ` : ''}
        </div>

      </div>

      <!-- 5. TABLEAU DU GRAND LIVRE COMPTABLE -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span>📑</span> Mouvements Comptables Détaillés
          </h4>
          <button
            onclick="window.ProtecFinances.exportGrandLivre(window.game)"
            class="text-[11px] font-bold text-pc-blue hover:text-pc-blue/80 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1">
            <span>📥</span> Copier le Relevé Comptable
          </button>
        </div>

        ${filtered.length === 0 ? `
          <div class="p-8 text-center rounded-2xl glass-card border border-dashed border-slate-300 space-y-2">
            <span class="text-3xl block">🔍</span>
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
                      ${catObj.emoji || (isPositive ? '↗' : '↘')}
                    </div>

                    <div class="min-w-0 space-y-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <strong class="text-slate-900 font-bold truncate">${item.label}</strong>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${catObj.badgeClass}">
                          ${catObj.label}
                        </span>
                      </div>
                      
                      <div class="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span>📅 ${item.dateStr || 'Date N/A'}</span>
                        ${item.ref ? `<span>🔖 Réf: <span class="font-mono text-slate-600">${item.ref}</span></span>` : ''}
                        ${item.tier ? `<span>🏢 Tiers: ${item.tier}</span>` : ''}
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

  // Rendu des pastilles de synthèse en haut de tableau
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
            <span class="font-bold text-slate-700 truncate">${item.cat.emoji} ${item.name}</span>
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
        game.showToast('Relevé copié ! 📋', 'Le grand livre comptable a été copié dans votre presse-papier.', 'green');
      }).catch(() => {
        game.showToast('Grand Livre', 'Relevé généré avec succès.', 'blue');
      });
    } else {
      game.showToast('Grand Livre', 'Relevé comptable généré.', 'blue');
    }
  },

  // Génération du SVG de courbe fluide et interactive
  renderSvgChart(history, minBalance, maxBalance) {
    if (!history || history.length === 0) {
      return '<div class="p-8 text-center text-xs text-slate-400">Aucune transaction enregistrée.</div>';
    }

    const width = 640;
    const height = 180;
    const padX = 40;
    const padY = 25;

    // Si un seul point, dupliquer pour tracer une ligne plate
    const displayHistory = history.length === 1 ? [
      { ...history[0], dateStr: 'Départ' },
      { ...history[0], dateStr: 'Actuel' }
    ] : history;

    const rangeY = Math.max(1, maxBalance - minBalance);
    const stepX = (width - padX * 2) / (displayHistory.length - 1);

    // Coordonnées des points
    const points = displayHistory.map((item, idx) => {
      const x = padX + (idx * stepX);
      const normY = (item.balance - minBalance) / rangeY;
      const y = (height - padY) - (normY * (height - padY * 2));
      return { x, y, item };
    });

    // Construction du chemin SVG (Smooth path)
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
        <text x="${padX - 8}" y="${padY + 4}" fill="#94a3b8" font-size="9" text-anchor="end" font-weight="bold">${Math.round(maxBalance)} €</text>
        <text x="${padX - 8}" y="${height / 2 + 3}" fill="#64748b" font-size="8" text-anchor="end">${Math.round((maxBalance + minBalance) / 2)} €</text>
        <text x="${padX - 8}" y="${height - padY + 3}" fill="#94a3b8" font-size="9" text-anchor="end" font-weight="bold">${Math.round(minBalance)} €</text>

        <!-- Surface dégradée -->
        <path d="${fillPathD}" fill="url(#financesGradient)" />

        <!-- Ligne continue de solde -->
        <path d="${pathD}" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" />

        <!-- Points de données cliquables/survolables -->
        ${points.map((p, i) => `
          <g class="cursor-pointer group">
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#10b981" stroke="#ffffff" stroke-width="2" class="hover:r-6 transition-all" />
            <!-- Étiquette au survol -->
            <title>${p.item.dateStr || ''} : ${p.item.balance.toLocaleString('fr-FR')} €\n${p.item.label} (${p.item.amount >= 0 ? '+' : ''}${p.item.amount} €)</title>
            <!-- Date en bas -->
            ${i % Math.ceil(points.length / 7) === 0 || i === points.length - 1 ? `
              <text x="${p.x}" y="${height - 6}" fill="#94a3b8" font-size="8" text-anchor="middle" font-weight="600">${p.item.dateStr}</text>
            ` : ''}
          </g>
        `).join('')}
      </svg>
    `;
  }
};
