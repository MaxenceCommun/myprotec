/**
 * PROTEC LIVE - GESTION COMPLÈTE DE LA TRÉSORERIE & GRAPHIQUE FINANCIER
 * Suivi de l'évolution financière de l'antenne, historique des recettes/dépenses
 * et graphique vectoriel interactif SVG.
 */

window.ProtecFinances = {
  // Initialisation de l'historique si non présent
  injectState(game) {
    if (!game.financesHistory || !Array.isArray(game.financesHistory)) {
      game.financesHistory = [];
    }

    // Si aucun historique, peupler avec des données initiales représentatives
    if (game.financesHistory.length === 0) {
      const current = game.resources?.money || 15000;
      const now = Date.now();
      const oneDay = 86400000;

      game.financesHistory = [
        { timestamp: now - 6 * oneDay, dateStr: 'J-6', amount: 8000, label: 'Dotation Initiale Commune', type: 'recette', balance: 8000 },
        { timestamp: now - 5 * oneDay, dateStr: 'J-5', amount: -2200, label: 'Achat Matériel Médical & DSA', type: 'depense', balance: 5800 },
        { timestamp: now - 4 * oneDay, dateStr: 'J-4', amount: 1450, label: 'Indemnité Dispositif Fête Locale', type: 'recette', balance: 7250 },
        { timestamp: now - 3 * oneDay, dateStr: 'J-3', amount: 3200, label: 'Subvention Conseil Départemental', type: 'recette', balance: 10450 },
        { timestamp: now - 2 * oneDay, dateStr: 'J-2', amount: -1500, label: 'Révision & Carburant Flotte', type: 'depense', balance: 8950 },
        { timestamp: now - 1 * oneDay, dateStr: 'J-1', amount: 2400, label: 'Formations PSC1 Grand Public', type: 'recette', balance: 11350 },
        { timestamp: now, dateStr: 'Aujourd’hui', amount: current - 11350, label: 'Régulation Opérationnelle & Dons', type: (current >= 11350 ? 'recette' : 'depense'), balance: current }
      ];
    }
  },

  // Enregistrer une transaction financière
  recordTransaction(game, amount, label, category = 'general') {
    this.injectState(game);
    const now = Date.now();
    const currentBalance = game.resources.money;
    const dateStr = game.clock ? `${game.clock.dayName || 'Aujourd’hui'} ${game.clock.hour || '12'}h` : 'Aujourd’hui';

    game.financesHistory.push({
      timestamp: now,
      dateStr: dateStr,
      amount: amount,
      label: label,
      type: amount >= 0 ? 'recette' : 'depense',
      category: category,
      balance: currentBalance
    });

    // Limiter l'historique à 60 entrées pour optimiser les performances
    if (game.financesHistory.length > 60) {
      game.financesHistory.shift();
    }
  },

  // Rendu de la modale Finances & Graphique de Trésorerie
  renderFinancesModal(game) {
    this.injectState(game);
    const modal = document.getElementById('main-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const icon = document.getElementById('modal-icon');
    const body = document.getElementById('modal-body');

    modal.classList.remove('hidden');
    title.textContent = 'Trésorerie & Bilan Financier de l’Antenne';
    subtitle.textContent = 'Suivi graphique du solde bancaire, flux de recettes et dépenses opérationnelles';
    icon.setAttribute('data-lucide', 'euro');

    const history = game.financesHistory || [];
    const balances = history.map(h => h.balance);
    const maxBalance = Math.max(...balances, game.resources.money, 1000);
    const minBalance = Math.min(...balances, game.resources.money, 0);
    const currentMoney = game.resources.money;

    const totalRecettes = history.filter(h => h.amount > 0).reduce((acc, h) => acc + h.amount, 0);
    const totalDepenses = Math.abs(history.filter(h => h.amount < 0).reduce((acc, h) => acc + h.amount, 0));

    body.innerHTML = `
      <div class="space-y-6">
        
        <!-- Cartes Récapitulatives Haut de page -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div class="p-4 rounded-2xl glass-card-blue space-y-1">
            <span class="text-[10px] font-black uppercase tracking-wider text-pc-blue">Solde Actuel</span>
            <div class="text-lg sm:text-xl font-black text-slate-900 mono-num">
              ${currentMoney.toLocaleString('fr-FR')} €
            </div>
            <span class="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span>●</span> Compte d’Antenne Actif
            </span>
          </div>

          <div class="p-4 rounded-2xl glass-card space-y-1">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Pic Historique (Max)</span>
            <div class="text-lg sm:text-xl font-extrabold text-slate-800 mono-num">
              ${maxBalance.toLocaleString('fr-FR')} €
            </div>
            <span class="text-[10px] text-slate-400 font-semibold">Trésorerie maximale</span>
          </div>

          <div class="p-4 rounded-2xl glass-card-emerald space-y-1">
            <span class="text-[10px] font-black uppercase tracking-wider text-emerald-700">Recettes Cumulées</span>
            <div class="text-lg sm:text-xl font-extrabold text-emerald-700 mono-num">
              +${totalRecettes.toLocaleString('fr-FR')} €
            </div>
            <span class="text-[10px] text-emerald-600 font-semibold">DPS, SAMU & Formations</span>
          </div>

          <div class="p-4 rounded-2xl glass-card space-y-1">
            <span class="text-[10px] font-black uppercase tracking-wider text-rose-500">Dépenses Cumulées</span>
            <div class="text-lg sm:text-xl font-extrabold text-rose-600 mono-num">
              -${totalDepenses.toLocaleString('fr-FR')} €
            </div>
            <span class="text-[10px] text-slate-400 font-semibold">Achats, Matériel & Flotte</span>
          </div>

        </div>

        <!-- GRAPHIQUE VECTORIEL SVG INTERACTIF -->
        <div class="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                📈
              </div>
              <div>
                <h4 class="text-sm font-black text-white leading-tight">Courbe d'Évolution de Trésorerie</h4>
                <p class="text-[11px] text-slate-400">Historique chronologique du solde de l'association</p>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
              <span class="text-slate-300 font-bold">Solde en €</span>
            </div>
          </div>

          <!-- Rendu de la Courbe SVG -->
          <div class="w-full overflow-x-auto no-scrollbar">
            ${this.renderSvgChart(history, minBalance, maxBalance)}
          </div>
        </div>

        <!-- Liens rapides vers les modules de rentrées financières -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onclick="window.game.openModule('devis')" class="p-3 rounded-2xl glass-card text-left hover:border-pc-blue transition flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
              📋
            </div>
            <div>
              <strong class="text-xs text-slate-900 block">Devis & Tarifs DPS</strong>
              <span class="text-[10px] text-slate-500 block">Mise en concurrence</span>
            </div>
          </button>

          <button onclick="window.game.openModule('formation')" class="p-3 rounded-2xl glass-card text-left hover:border-emerald-500 transition flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
              🎓
            </div>
            <div>
              <strong class="text-xs text-slate-900 block">Formations PSC1 / SST</strong>
              <span class="text-[10px] text-slate-500 block">Recettes pédagogiques</span>
            </div>
          </button>

          <button onclick="window.game.openModule('samu')" class="p-3 rounded-2xl glass-card text-left hover:border-pc-orange transition flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-xl bg-orange-50 text-pc-orange flex items-center justify-center text-lg font-bold group-hover:scale-105 transition-transform">
              🚑
            </div>
            <div>
              <strong class="text-xs text-slate-900 block">Garde & Départs SAMU 15</strong>
              <span class="text-[10px] text-slate-500 block">Indemnités d’urgence</span>
            </div>
          </button>
        </div>

        <!-- Dernières Transactions Comptables -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-700">Derniers Mouvements de Compte</h4>
          
          <div class="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            ${[...history].reverse().slice(0, 15).map(item => `
              <div class="p-3 rounded-2xl glass-card flex items-center justify-between text-xs">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl ${item.amount >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center font-bold text-sm">
                    ${item.amount >= 0 ? '↗' : '↘'}
                  </div>
                  <div>
                    <strong class="text-slate-800 block">${item.label}</strong>
                    <span class="text-[10px] text-slate-400">${item.dateStr}</span>
                  </div>
                </div>

                <div class="text-right">
                  <span class="font-black mono-num ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'} block">
                    ${item.amount >= 0 ? '+' : ''}${item.amount.toLocaleString('fr-FR')} €
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">
                    Solde : ${item.balance.toLocaleString('fr-FR')} €
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // Génération du SVG de courbe fluide
  renderSvgChart(history, minBalance, maxBalance) {
    if (!history || history.length < 2) {
      return '<div class="p-8 text-center text-xs text-slate-400">Données insuffisantes pour tracer la courbe.</div>';
    }

    const width = 640;
    const height = 180;
    const padX = 40;
    const padY = 25;

    const rangeY = Math.max(1, maxBalance - minBalance);
    const stepX = (width - padX * 2) / (history.length - 1);

    // Coordonnées des points
    const points = history.map((item, idx) => {
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
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.45" />
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

        <!-- Ligne continue -->
        <path d="${pathD}" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" />

        <!-- Points de données -->
        ${points.map((p, i) => `
          <g class="cursor-pointer group">
            <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#10b981" stroke="#ffffff" stroke-width="2" class="hover:r-6 transition-all" />
            <!-- Étiquette au survol -->
            <title>${p.item.dateStr} : ${p.item.balance.toLocaleString('fr-FR')} € (${p.item.label})</title>
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
