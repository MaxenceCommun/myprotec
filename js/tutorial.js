/**
 * PROTEC LIVE - MODULE DE TUTORIEL & GUIDAGE DE DÉMARRAGE
 * Guide pas-à-pas pour le joueur au lancement :
 * Étape 1 : Acheter la Convention d'AASC (Base légale absolue pour commencer le jeu)
 * Étape 2 : Acquérir un 1er véhicule opérationnel (VPSP 5 places ou VTU 3 places)
 * Étape 3 : Équiper la pharmacie et le stock de secours
 */

window.ProtecTutorial = {
  init(game) {
    if (!game.tutorialState) {
      game.tutorialState = {
        step: 1,
        completed: false,
        dismissed: false
      };
    }
    this.renderBanner(game);
  },

  start(game) {
    if (!game.tutorialState) {
      game.tutorialState = { step: 1, completed: false, dismissed: false };
    }
    game.tutorialState.step = 1;
    game.tutorialState.completed = false;
    game.tutorialState.dismissed = false;
    this.renderBanner(game);
  },

  renderBanner(game) {
    let container = document.getElementById('tutorial-banner-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'tutorial-banner-container';
      container.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 pointer-events-auto transition-all duration-300';
      document.body.appendChild(container);
    }

    if (!game.tutorialState || game.tutorialState.completed || game.tutorialState.dismissed) {
      container.innerHTML = '';
      return;
    }

    // Détection dynamique de l'étape active selon l'état réel de l'antenne
    if (!game.aascConvention || !game.aascConvention.signed) {
      game.tutorialState.step = 1;
    } else if (!game.vehicles || game.vehicles.length === 0) {
      game.tutorialState.step = 2;
    } else if ((game.logistics?.oxygenBottles || 0) === 0 && (game.logistics?.aedPads || 0) === 0 && (game.logistics?.woundKits || 0) === 0) {
      game.tutorialState.step = 3;
    } else {
      game.tutorialState.step = 4;
      game.tutorialState.completed = true;
    }

    const step = game.tutorialState.step;
    if (step === 4) {
      container.innerHTML = `
        <div class="glass-panel-heavy p-4 rounded-3xl shadow-2xl border-2 border-emerald-400 bg-white/95 text-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <span>🎉</span> Tutoriel de Lancement Terminé !
            </span>
            <button onclick="window.ProtecTutorial.dismiss(window.game)" class="text-slate-400 hover:text-slate-600 font-bold text-xs p-1">✕</button>
          </div>
          <p class="text-xs text-slate-600">
            Félicitations ! Votre antenne est officiellement reconnue AASC par la Préfecture, dotée de son premier véhicule et de son matériel d'urgence. Vous pouvez désormais répondre aux postes de secours et réquisitions de crise !
          </p>
          <div class="pt-1 flex justify-end">
            <button onclick="window.ProtecTutorial.dismiss(window.game)" class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer">
              C'est parti ! 🚀
            </button>
          </div>
        </div>
      `;
      return;
    }

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
        desc: 'Votre antenne est désormais agréée AASC ! Commandez une première ambulance VPSP (5 places) ou un utilitaire VTU (3 places).',
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

    container.innerHTML = `
      <div class="glass-panel-heavy p-4 sm:p-5 rounded-3xl shadow-2xl border-2 border-pc-blue/50 bg-white/95 text-slate-800 space-y-3 animate-in fade-in slide-in-from-bottom-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-pc-blue animate-ping"></span>
            <span class="text-[11px] font-black uppercase tracking-wider text-pc-blue">${cur.badge}</span>
          </div>
          <button onclick="window.ProtecTutorial.dismiss(window.game)" class="text-slate-400 hover:text-slate-600 font-bold text-xs p-1" title="Masquer le guide">✕</button>
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
  },

  advance(game) {
    this.renderBanner(game);
  },

  dismiss(game) {
    if (game && game.tutorialState) {
      game.tutorialState.dismissed = true;
    }
    const container = document.getElementById('tutorial-banner-container');
    if (container) container.innerHTML = '';
  }
};
