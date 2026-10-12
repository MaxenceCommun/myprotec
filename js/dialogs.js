/**
 * PROTEC LIVE - SYSTÈME DE POPUPS ET MODALES DE DIALOGUE PERSONNALISÉS
 * Remplace avantageusement les popups natifs de Chrome (alert, confirm, prompt)
 * par des modales au design Glassmorphism Protection Civile.
 */

window.ProtecDialog = {
  currentResolver: null,
  currentType: 'alert', // 'alert' | 'confirm' | 'prompt'

  init() {
    this.ensureDOM();
  },

  ensureDOM() {
    let container = document.getElementById('protec-dialog-overlay');
    if (!container) {
      container = document.createElement('div');
      container.id = 'protec-dialog-overlay';
      container.className = 'fixed inset-0 z-[10000] hidden items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md select-none transition-opacity duration-200';
      container.innerHTML = `
        <div id="protec-dialog-box" class="w-full max-w-md rounded-3xl glass-panel-heavy border border-white/90 p-5 sm:p-6 shadow-2xl relative transition-all duration-200 transform scale-95 opacity-0">
          
          <!-- En-tête -->
          <div class="flex items-start gap-3.5 mb-3.5">
            <div id="protec-dialog-icon-box" class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-black shadow-xs transition-colors">
              <i id="protec-dialog-icon" data-lucide="info" class="w-5 h-5"></i>
            </div>
            <div class="flex-1 min-w-0 pt-0.5">
              <h3 id="protec-dialog-title" class="text-base font-black text-slate-900 leading-snug">Confirmation</h3>
              <p id="protec-dialog-category" class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">Protection Civile</p>
            </div>
            <button id="protec-dialog-close-btn" type="button" class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs font-bold transition cursor-pointer active:scale-90" title="Fermer">✕</button>
          </div>

          <!-- Message principal -->
          <div id="protec-dialog-body" class="text-xs text-slate-700 font-medium leading-relaxed max-h-[55vh] overflow-y-auto pr-1 space-y-2">
          </div>

          <!-- Champ de saisie pour Prompt -->
          <div id="protec-dialog-input-container" class="mt-4 hidden space-y-1.5">
            <label id="protec-dialog-input-label" class="block text-[11px] font-extrabold text-slate-700">Votre saisie :</label>
            <input 
              type="text" 
              id="protec-dialog-input" 
              class="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pc-blue shadow-inner transition"
              autocomplete="off"
            />
          </div>

          <!-- Boutons d'action -->
          <div id="protec-dialog-actions" class="mt-5 pt-3.5 border-t border-slate-200/70 flex items-center justify-end gap-2.5">
            <button id="protec-dialog-cancel-btn" type="button" class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer active:scale-95">
              Annuler
            </button>
            <button id="protec-dialog-confirm-btn" type="button" class="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-pc-blue to-pc-blue-light hover:brightness-110 text-white shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5">
              <span id="protec-dialog-confirm-text">Valider</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(container);

      // Écouteurs des boutons
      const cancelBtn = document.getElementById('protec-dialog-cancel-btn');
      const confirmBtn = document.getElementById('protec-dialog-confirm-btn');
      const closeBtn = document.getElementById('protec-dialog-close-btn');

      if (cancelBtn) cancelBtn.addEventListener('click', () => this.handleCancel());
      if (closeBtn) closeBtn.addEventListener('click', () => this.handleCancel());
      if (confirmBtn) confirmBtn.addEventListener('click', () => this.handleConfirm());

      // Fermeture au clic sur le fond sombre si pas prompt strict
      container.addEventListener('click', (e) => {
        if (e.target === container) {
          this.handleCancel();
        }
      });

      // Gestion clavier
      document.addEventListener('keydown', (e) => {
        if (!container.classList.contains('flex')) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          this.handleCancel();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.handleConfirm();
        }
      });
    }
    return container;
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  formatMessageToHtml(rawMsg) {
    if (!rawMsg) return '';
    const cleanStr = String(rawMsg).trim();
    // Découpage par double saut de ligne
    const paragraphs = cleanStr.split(/\n\s*\n/);
    return paragraphs.map(p => {
      // Découpage par ligne simple
      const lines = p.split('\n').map(l => l.trim()).filter(Boolean);
      return `<p class="leading-relaxed">${lines.map(line => {
        const escaped = this.escapeHtml(line);
        if (escaped.startsWith('•') || escaped.startsWith('-')) {
          return `<span class="block pl-3 text-slate-800 font-semibold">• ${escaped.substring(1).trim()}</span>`;
        }
        return escaped;
      }).join('<br/>')}</p>`;
    }).join('');
  },

  detectTheme(message, opts = {}) {
    const text = (message || '').toLowerCase();
    
    if (opts.isDestructive || text.includes('supprimer') || text.includes('définitivement') || text.includes('banni') || text.includes('irréversible') || text.includes('annuler le dps')) {
      return {
        icon: opts.icon || 'alert-triangle',
        category: opts.category || 'Opération Irréversible',
        iconBg: 'bg-rose-100 text-rose-700',
        confirmBtnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200'
      };
    }

    if (text.includes('partenariat') || text.includes('convention') || text.includes('contrat') || text.includes('cump') || text.includes('notarié')) {
      return {
        icon: opts.icon || 'file-signature',
        category: opts.category || 'Protocole & Convention',
        iconBg: 'bg-pc-blue/15 text-pc-blue',
        confirmBtnClass: 'bg-gradient-to-r from-pc-blue to-pc-blue-light hover:brightness-110 text-white shadow-md'
      };
    }

    if (text.includes('urgent') || text.includes('attention') || text.includes('dérogation') || text.includes('avertissement')) {
      return {
        icon: opts.icon || 'alert-circle',
        category: opts.category || 'Avis Opérationnel',
        iconBg: 'bg-amber-100 text-amber-800',
        confirmBtnClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200'
      };
    }

    if (text.includes('mot de passe') || text.includes('indicatif') || text.includes('trésorerie') || opts.isInput) {
      return {
        icon: opts.icon || 'edit-3',
        category: opts.category || 'Paramètres & Saisie',
        iconBg: 'bg-indigo-100 text-indigo-700',
        confirmBtnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
      };
    }

    return {
      icon: opts.icon || 'info',
      category: opts.category || 'Information',
      iconBg: 'bg-pc-blue/10 text-pc-blue',
      confirmBtnClass: 'bg-gradient-to-r from-pc-blue to-pc-blue-light hover:brightness-110 text-white shadow-md'
    };
  },

  openDialog({ type, title, message, defaultValue = '', options = {} }) {
    this.ensureDOM();
    this.currentType = type;

    const overlay = document.getElementById('protec-dialog-overlay');
    const box = document.getElementById('protec-dialog-box');
    const titleEl = document.getElementById('protec-dialog-title');
    const catEl = document.getElementById('protec-dialog-category');
    const bodyEl = document.getElementById('protec-dialog-body');
    const iconBox = document.getElementById('protec-dialog-icon-box');
    const iconEl = document.getElementById('protec-dialog-icon');
    const inputContainer = document.getElementById('protec-dialog-input-container');
    const inputEl = document.getElementById('protec-dialog-input');
    const inputLabel = document.getElementById('protec-dialog-input-label');
    const cancelBtn = document.getElementById('protec-dialog-cancel-btn');
    const confirmBtn = document.getElementById('protec-dialog-confirm-btn');
    const confirmText = document.getElementById('protec-dialog-confirm-text');

    const theme = this.detectTheme(message, { ...options, isInput: type === 'prompt' });

    // Remplissage titre et catégorie
    titleEl.textContent = title || (type === 'confirm' ? 'Confirmation' : type === 'prompt' ? 'Saisie requise' : 'Information');
    catEl.textContent = theme.category;

    // Remplissage icône
    iconBox.className = `w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-black shadow-xs transition-colors ${theme.iconBg}`;
    iconEl.setAttribute('data-lucide', theme.icon);

    // Contenu formaté
    bodyEl.innerHTML = this.formatMessageToHtml(message);

    // Gestion du type
    if (type === 'alert') {
      cancelBtn.classList.add('hidden');
      confirmText.textContent = options.confirmText || 'Compris';
      inputContainer.classList.add('hidden');
    } else if (type === 'confirm') {
      cancelBtn.classList.remove('hidden');
      cancelBtn.textContent = options.cancelText || 'Annuler';
      confirmText.textContent = options.confirmText || 'Confirmer';
      inputContainer.classList.add('hidden');
    } else if (type === 'prompt') {
      cancelBtn.classList.remove('hidden');
      cancelBtn.textContent = options.cancelText || 'Annuler';
      confirmText.textContent = options.confirmText || 'Valider';
      inputContainer.classList.remove('hidden');
      inputLabel.textContent = options.inputLabel || 'Nouvelle valeur :';
      inputEl.value = defaultValue || '';
      inputEl.placeholder = options.placeholder || '';
      inputEl.type = options.inputType || 'text';
    }

    // Bouton de confirmation (couleur)
    confirmBtn.className = `px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 flex items-center gap-1.5 ${theme.confirmBtnClass}`;

    // Affichage avec animation
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    requestAnimationFrame(() => {
      box.classList.remove('scale-95', 'opacity-0');
      box.classList.add('scale-100', 'opacity-100');
      if (type === 'prompt') {
        inputEl.focus();
        inputEl.select();
      } else {
        confirmBtn.focus();
      }
      if (window.lucide) window.lucide.createIcons();
    });

    return new Promise((resolve) => {
      this.currentResolver = resolve;
    });
  },

  closeDialog() {
    const overlay = document.getElementById('protec-dialog-overlay');
    const box = document.getElementById('protec-dialog-box');
    if (!overlay || !box) return;

    box.classList.remove('scale-100', 'opacity-100');
    box.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
      overlay.classList.remove('flex');
      overlay.classList.add('hidden');
    }, 150);
  },

  handleConfirm() {
    const resolver = this.currentResolver;
    this.currentResolver = null;
    const type = this.currentType;
    let result = true;

    if (type === 'prompt') {
      const inputEl = document.getElementById('protec-dialog-input');
      result = inputEl ? inputEl.value : '';
    }

    this.closeDialog();
    if (resolver) resolver(result);
  },

  handleCancel() {
    const resolver = this.currentResolver;
    this.currentResolver = null;
    const type = this.currentType;
    let result = false;

    if (type === 'prompt') {
      result = null;
    }

    this.closeDialog();
    if (resolver) resolver(result);
  },

  // API publique asynchrone élégante
  alert(message, title = null, options = {}) {
    return this.openDialog({ type: 'alert', title, message, options });
  },

  confirm(message, title = null, options = {}) {
    return this.openDialog({ type: 'confirm', title, message, options });
  },

  prompt(message, defaultValue = '', title = null, options = {}) {
    return this.openDialog({ type: 'prompt', title, message, defaultValue, options });
  }
};

// Initialisation globale
if (typeof window !== 'undefined') {
  window.showAlert = (msg, title, opts) => window.ProtecDialog.alert(msg, title, opts);
  window.showConfirm = (msg, title, opts) => window.ProtecDialog.confirm(msg, title, opts);
  window.showPrompt = (msg, def, title, opts) => window.ProtecDialog.prompt(msg, def, title, opts);

  // Remplacement immédiat de window.alert natif pour intercepter les alertes
  window.alert = function(msg) {
    window.ProtecDialog.alert(msg);
  };
}
