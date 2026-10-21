/**
 * PROTEC LIVE - MODULE DE TUTORIEL & GUIDAGE DE DÉMARRAGE
 * Guide pas-à-pas interactif pour le joueur au lancement de son antenne :
 * Étape 1 : Acheter la Convention d'AASC (800 €) — Base légale absolue
 * Étape 2 : Acquérir un 1er véhicule opérationnel (VPSP 5 places ou VTU 3 places)
 * Étape 3 : Équiper la pharmacie et le stock de secours (O2, DAE, trousses de soins)
 */

window.ProtecTutorial = {
  // Vérifie si le tutoriel est actuellement actif (en cours)
  isTutorialActive(game) {
    if (!game) return false;
    // Si aucune station n'est encore posée sur la carte, le tutoriel ne commence qu'après l'implantation
    if (!game.stations || game.stations.length === 0) return false;

    if (!game.tutorialState) {
      game.tutorialState = { step: 1, completed: false, dismissed: false };
    }

    // Si le joueur a passé ou terminé le tutoriel, il n'est plus actif
    if (game.tutorialState.completed || game.tutorialState.dismissed) {
      return false;
    }

    // Évaluation dynamique de la complétion réelle des 3 étapes fondamentales
    const hasAasc = Boolean(game.aascConvention && game.aascConvention.signed);
    const hasVehicle = Boolean(game.vehicles && game.vehicles.length > 0);
    const hasLogistics = Boolean(
      (game.logistics?.oxygenBottles || 0) > 0 ||
      (game.logistics?.aedPads || 0) > 0 ||
      (game.logistics?.woundKits || 0) > 0
    );

    // Si les 3 étapes sont accomplies, le tutoriel passe automatiquement à 100% (terminé)
    if (hasAasc && hasVehicle && hasLogistics) {
      game.tutorialState.completed = true;
      game.tutorialState.step = 4;
      return false;
    }

    // Détermination de l'étape active
    if (!hasAasc) {
      game.tutorialState.step = 1;
    } else if (!hasVehicle) {
      game.tutorialState.step = 2;
    } else {
      game.tutorialState.step = 3;
    }

    return true;
  },

  getCurrentStep(game) {
    if (!game) return 1;
    this.isTutorialActive(game);
    return game.tutorialState ? game.tutorialState.step : 1;
  },

  init(game) {
    if (this.isTutorialActive(game)) {
      this.renderBanner(game);
    }
  },

  start(game) {
    if (game && game.tutorialState) {
      game.tutorialState.dismissed = false;
      game.tutorialState.completed = false;
    }
    this.advance(game);
  },

  // Modale interactive dédiée pour le tutoriel (accessible au clic sur le bouton header)
  openTutorialModal(game) {
    if (!game) return;
    const step = this.getCurrentStep(game);

    const hasAasc = Boolean(game.aascConvention && game.aascConvention.signed);
    const hasVehicle = Boolean(game.vehicles && game.vehicles.length > 0);
    const hasLogistics = Boolean(
      (game.logistics?.oxygenBottles || 0) > 0 ||
      (game.logistics?.aedPads || 0) > 0 ||
      (game.logistics?.woundKits || 0) > 0
    );

    let completedCount = 0;
    if (hasAasc) completedCount++;
    if (hasVehicle) completedCount++;
    if (hasLogistics) completedCount++;
    const progressPct = Math.round((completedCount / 3) * 100);

    const stepsData = [
      {
        num: 1,
        title: "1. Agrément Préfectoral AASC (800 €)",
        desc: "Base juridique absolue : convention cadre d'Agrément de Sécurité Civile délivrée par la Préfecture pour répondre aux postes et secours.",
        done: hasAasc,
        active: step === 1,
        actionText: "✍️ Obtenir la Convention AASC",
        actionFn: "window.game.signAascConvention();"
      },
      {
        num: 2,
        title: "2. Premier Véhicule d'Intervention",
        desc: "Acquérir votre premier moyen mobile d'intervention : un VPSP (5 places sanitaires) ou un utilitaire VTU polyvalent (3 places).",
        done: hasVehicle,
        active: step === 2,
        actionText: "🚑 Commander un Véhicule (Boutique)",
        actionFn: "window.game.closeModal(); window.game.openModule('boutique_vehicules');"
      },
      {
        num: 3,
        title: "3. Pharmacie & Matériel d'Urgence",
        desc: "Constituer le stock minimal d'intervention : commander vos premières bouteilles d'oxygène (O2), électrodes DAE et trousses de soins.",
        done: hasLogistics,
        active: step === 3,
        actionText: "📦 Commander le Matériel (Équipements)",
        actionFn: "window.game.closeModal(); window.game.openModule('equipements');"
      }
    ];

    const modalId = 'modal-tutorial-overview';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.id = modalId;
    backdrop.className = 'fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200';
    backdrop.onclick = (e) => {
      if (e.target === backdrop) backdrop.remove();
    };

    backdrop.innerHTML = `
      <div class="bg-white dark:bg-slate-900 border-2 border-pc-blue/40 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <!-- En-tête de la modale -->
        <div class="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-pc-blue to-pc-blue-light text-white flex items-center justify-center shadow-md">
              <i data-lucide="graduation-cap" class="w-5 h-5 animate-bounce"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pc-blue/10 text-pc-blue dark:bg-sky-950 dark:text-sky-300">
                  Guide de démarrage
                </span>
                <span class="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                  ${completedCount}/3 validé${completedCount > 1 ? 's' : ''} (${progressPct}%)
                </span>
              </div>
              <h3 class="text-base font-black text-slate-900 dark:text-white mt-0.5">Tutoriel de Fondation de l'Antenne</h3>
            </div>
          </div>
          <button onclick="document.getElementById('${modalId}').remove()" class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition cursor-pointer">✕</button>
        </div>

        <!-- Barre de Progression Globale -->
        <div class="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div class="flex items-center justify-between text-xs font-black">
            <span class="text-slate-700 dark:text-slate-200">Avancement du Tutoriel</span>
            <span class="text-pc-blue dark:text-sky-400 font-mono">${progressPct}%</span>
          </div>
          <div class="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-pc-blue via-pc-blue-light to-pc-orange rounded-full transition-all duration-500" style="width: ${progressPct}%"></div>
          </div>
          <p class="text-[10.5px] text-slate-500 dark:text-slate-400">
            Accomplissez ces 3 étapes pour rendre votre antenne pleinement opérationnelle. Les défis et récompenses prendront ensuite le relais !
          </p>
        </div>

        <!-- Liste des 3 Étapes -->
        <div class="space-y-2.5">
          ${stepsData.map(s => {
            let borderClass = 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 opacity-70';
            if (s.done) {
              borderClass = 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/60 dark:bg-emerald-950/20';
            } else if (s.active) {
              borderClass = 'border-2 border-pc-blue dark:border-sky-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-pc-blue/20';
            }

            return `
              <div class="p-3.5 rounded-2xl border ${borderClass} transition-all space-y-2">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2">
                    ${s.done ? `
                      <span class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-xs">✓</span>
                    ` : s.active ? `
                      <span class="w-6 h-6 rounded-full bg-pc-blue text-white flex items-center justify-center text-xs font-black animate-pulse shadow-xs">${s.num}</span>
                    ` : `
                      <span class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold">${s.num}</span>
                    `}
                    <h4 class="text-xs font-black text-slate-900 dark:text-white">${s.title}</h4>
                  </div>
                  <div>
                    ${s.done ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300">Validé ✓</span>
                    ` : s.active ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 animate-pulse">En cours ⭐</span>
                    ` : `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">À venir</span>
                    `}
                  </div>
                </div>
                <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${s.desc}</p>
                ${s.active && !s.done ? `
                  <div class="pt-1.5 flex items-center justify-end">
                    <button onclick="${s.actionFn} document.getElementById('${modalId}').remove();" class="px-4 py-2 rounded-xl bg-gradient-to-r from-pc-blue to-pc-blue-light hover:brightness-110 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer">
                      <span>${s.actionText}</span>
                      <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Pied de page avec option de passer le tutoriel -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <button onclick="window.ProtecTutorial.dismiss(window.game); document.getElementById('${modalId}').remove();" class="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold hover:underline cursor-pointer flex items-center gap-1">
            <span>Passer le tutoriel (ignorer le guide)</span>
          </button>
          <button onclick="document.getElementById('${modalId}').remove()" class="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer">
            Fermer
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  renderBanner(game) {
    let container = document.getElementById('tutorial-banner-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'tutorial-banner-container';
      container.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 pointer-events-auto transition-all duration-300';
      document.body.appendChild(container);
    }

    if (!this.isTutorialActive(game)) {
      container.innerHTML = '';
      return;
    }

    const step = this.getCurrentStep(game);

    const stepsData = {
      1: {
        badge: 'Étape 1/3 • Obligation Fondatrice',
        title: 'Acheter la Convention d’AASC (800 €)',
        desc: 'C’est la base absolue pour démarrer le jeu : sans agrément officiel de Sécurité Civile délivré par la Préfecture, toute mission est légalement interdite.',
        actionText: '✍️ Acheter la Convention d’AASC (800 €)',
        actionFn: 'window.game.signAascConvention()',
        altText: 'Ouvrir Conventions',
        altFn: "window.game.openModule('conventions')"
      },
      2: {
        badge: 'Étape 2/3 • Flotte Opérationnelle',
        title: 'Acquérir un 1er Véhicule de Secours',
        desc: 'Votre antenne est désormais agréée AASC ! Commandez un premier VPSP (5 places) ou un utilitaire VTU (3 places).',
        actionText: '🚑 Acheter un Véhicule',
        actionFn: "window.game.openModule('boutique_vehicules')",
        altText: 'Voir la Flotte',
        altFn: "window.game.openModule('base')"
      },
      3: {
        badge: 'Étape 3/3 • Matériel & Pharmacie',
        title: 'Approvisionner le Stock de Secours',
        desc: 'Achetez vos premières bouteilles d’oxygène (O2), électrodes DAE et trousses de soins pour armer vos équipages.',
        actionText: '📦 Acheter du Matériel',
        actionFn: "window.game.openModule('equipements')",
        altText: 'Logistique',
        altFn: "window.game.openModule('logistique')"
      }
    };

    const cur = stepsData[step];
    if (!cur) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="glass-panel-heavy p-4 sm:p-5 rounded-3xl shadow-2xl border-2 border-pc-blue/50 bg-white/95 text-slate-800 space-y-3 animate-in fade-in slide-in-from-bottom-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-pc-blue animate-ping"></span>
            <span class="text-[11px] font-black uppercase tracking-wider text-pc-blue">${cur.badge}</span>
          </div>
          <button onclick="window.ProtecTutorial.dismiss(window.game)" class="text-slate-400 hover:text-slate-600 font-bold text-xs p-1" title="Passer le tutoriel">✕</button>
        </div>

        <div>
          <h4 class="text-sm font-black text-slate-900">${cur.title}</h4>
          <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">${cur.desc}</p>
        </div>

        <div class="pt-1 flex flex-wrap items-center gap-2">
          <button onclick="${cur.actionFn}" class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-pc-blue to-pc-blue-light hover:brightness-110 active:scale-95 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer">
            ${cur.actionText}
          </button>
          <button onclick="${cur.altFn}" class="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer">
            ${cur.altText}
          </button>
        </div>
      </div>
    `;

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  advance(game) {
    if (!game) return;
    const wasActive = game.tutorialState && !game.tutorialState.completed && !game.tutorialState.dismissed;
    const nowActive = this.isTutorialActive(game);

    if (wasActive && !nowActive) {
      // Tutoriel venant de se terminer à 100%
      if (game.tutorialState?.completed) {
        if (typeof game.showToast === 'function') {
          game.showToast('🎉 Tutoriel Terminé !', 'Félicitations, votre antenne est opérationnelle ! Les défis et récompenses sont maintenant débloqués.', 'green');
        }
      }
    }

    if (typeof game.updateStatsUI === 'function') {
      game.updateStatsUI();
    }
    this.renderBanner(game);
  },

  dismiss(game) {
    if (game) {
      if (!game.tutorialState) game.tutorialState = {};
      game.tutorialState.dismissed = true;
      if (typeof game.showToast === 'function') {
        game.showToast('Tutoriel Passé', 'Le tutoriel a été désactivé. Retrouvez vos défis quotidiens et récompenses en haut.', 'blue');
      }
      if (typeof game.updateStatsUI === 'function') {
        game.updateStatsUI();
      }
      if (typeof game.saveGame === 'function') {
        game.saveGame();
      }
    }
    const container = typeof document !== 'undefined' ? document.getElementById('tutorial-banner-container') : null;
    if (container) container.innerHTML = '';
  }
};
