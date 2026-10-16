/**
 * MYPROTEC - Gestionnaire Officiel des Thèmes (Système, Clair, Foncé)
 * Permet de basculer l'interface en mode clair ou foncé selon le choix du joueur
 * ou de synchroniser automatiquement avec le thème du système d'exploitation.
 */

window.ProtecTheme = {
  STORAGE_KEY: 'protec_theme_preference',

  getThemePreference() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored && ['system', 'light', 'dark'].includes(stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Erreur lecture préférence thème:', e);
    }
    return 'system';
  },

  setThemePreference(theme) {
    if (!['system', 'light', 'dark'].includes(theme)) theme = 'system';
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Erreur écriture préférence thème:', e);
    }

    this.applyTheme();

    // Actualiser le sélecteur dans la modale des paramètres si ouverte
    if (window.ProtecNotifications && typeof window.ProtecNotifications.renderSettingsModalBody === 'function') {
      window.ProtecNotifications.renderSettingsModalBody();
    }

    if (window.game && typeof window.game.showToast === 'function') {
      const labels = {
        system: 'Système (Automatique)',
        light: 'Thème Clair',
        dark: 'Thème Foncé'
      };
      window.game.showToast('Apparence', `Thème sélectionné : ${labels[theme]}`, 'blue', null, { skipRecord: true, silent: true });
    }
  },

  isSystemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  isEffectiveDark() {
    const pref = this.getThemePreference();
    if (pref === 'dark') return true;
    if (pref === 'light') return false;
    return this.isSystemDark();
  },

  applyTheme() {
    const isDark = this.isEffectiveDark();
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Informer les composants canvas ou cartes si nécessaire
    window.dispatchEvent(new CustomEvent('protec-theme-changed', { detail: { isDark, preference: this.getThemePreference() } }));
  },

  init() {
    this.applyTheme();

    // Écouteur réactif sur les changements de préférence du système d'exploitation
    if (window.matchMedia) {
      try {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        if (typeof mql.addEventListener === 'function') {
          mql.addEventListener('change', () => {
            if (this.getThemePreference() === 'system') {
              this.applyTheme();
            }
          });
        } else if (typeof mql.addListener === 'function') {
          mql.addListener(() => {
            if (this.getThemePreference() === 'system') {
              this.applyTheme();
            }
          });
        }
      } catch (e) {
        console.warn('Erreur attachement listener matchMedia:', e);
      }
    }
  }
};

// Initialisation immédiate
if (typeof window !== 'undefined') {
  window.ProtecTheme.init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ProtecTheme.applyTheme());
  }
}
