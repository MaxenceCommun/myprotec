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

  // Redirection sur la page habituelle des Récompenses & Défis
  openTutorialModal(game) {
    if (!game) return;
    if (typeof game.openModule === 'function') {
      game.openModule('recompenses');
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
