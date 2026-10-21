/**
 * PROTEC LIVE - MODULE DE TUTORIEL UNIFIÉ
 * Le tutoriel est intégré directement sous le format des défis et objectifs
 * dans le module Récompenses & Défis (ProtecAdvanced.renderStarterGuideHTML).
 */

window.ProtecTutorial = {
  isTutorialActive(game) {
    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.isStarterGuideActive === 'function') {
      return window.ProtecAdvanced.isStarterGuideActive(game);
    }
    return false;
  },

  getCurrentStep(game) {
    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.getStarterGuideSteps === 'function') {
      const steps = window.ProtecAdvanced.getStarterGuideSteps(game);
      const claimed = (game?.starterGuide?.stepsClaimed || []).length;
      return Math.min(steps.length, claimed + 1);
    }
    return 1;
  },

  init(game) {
    const container = typeof document !== 'undefined' ? document.getElementById('tutorial-banner-container') : null;
    if (container) container.innerHTML = '';
  },

  start(game) {
    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.resetStarterGuide === 'function') {
      window.ProtecAdvanced.resetStarterGuide(game);
    }
  },

  // Redirection immédiate vers la page habituelle Récompenses & Défis
  openTutorialModal(game) {
    if (game && typeof game.openModule === 'function') {
      game.openModule('recompenses');
    }
  },

  renderBanner(game) {
    const container = typeof document !== 'undefined' ? document.getElementById('tutorial-banner-container') : null;
    if (container) container.innerHTML = '';
  },

  advance(game) {
    if (game && typeof game.updateStatsUI === 'function') {
      game.updateStatsUI();
    }
  },

  dismiss(game) {
    if (window.ProtecAdvanced && typeof window.ProtecAdvanced.skipStarterGuide === 'function') {
      window.ProtecAdvanced.skipStarterGuide(game);
    }
  }
};
