/**
 * MODULE GÉNÉRATEUR D'ÉCUSSONS PAR IA (GEMINI / IMAGEN 3)
 * Projet : MyProtec - Simulateur Opérationnel de la Protection Civile
 * 
 * Conçu selon les règles héraldiques et réglementaires strictes de la Protection Civile :
 * - Gabarit U-Shape : sommet plat horizontal, côtés verticaux droits, arrondi inférieur demi-cercle parfait (aucune pointe).
 * - Bordure brodée/PVC continue orange de sécurité (#FF6A00).
 * - Fond sélectionnable (Bleu officiel #034181 par défaut, Blanc #FFFFFF, ou couleur personnalisée).
 * - Liseré tricolore français optionnel en tête.
 * - Symbole international de sécurité civile optionnel au bas (triangle bleu sur disque orange).
 */

(function () {
  'use strict';

  const ProtecAIBadgeGenerator = {
    apiKeyStorageKey: 'protec_gemini_api_key',
    currentGeneratedBase64: null,
    currentClippedDataUrl: null,
    targetInputId: null,

    // Initialisation
    init() {
      console.log('🎨 Module Générateur d’Écussons IA MyProtec prêt.');
    },

    // Récupérer la clé API mémorisée
    getApiKey() {
      return localStorage.getItem(this.apiKeyStorageKey) || '';
    },

    // Sauvegarder la clé API
    setApiKey(key) {
      const clean = String(key || '').trim();
      if (clean) {
        localStorage.setItem(this.apiKeyStorageKey, clean);
      } else {
        localStorage.removeItem(this.apiKeyStorageKey);
      }
    },

    // Ouvrir la modale d'administration
    openModal(targetInputId = null, defaultTheme = '') {
      this.targetInputId = targetInputId;
      let modal = document.getElementById('ai-badge-generator-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ai-badge-generator-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in';
        document.body.appendChild(modal);
      }

      const savedKey = this.getApiKey();

      modal.innerHTML = `
        <div class="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 text-slate-100 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          
          <!-- En-tête de la modale -->
          <div class="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xl shadow-lg shadow-orange-500/20 border border-orange-400/30">
                🛡️
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  Atelier IA : Générateur d’Écussons Réglementaires
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">Imagen 3</span>
                </h3>
                <p class="text-xs text-slate-400">Gabarit officiel Protection Civile • Forme U-Shape arrondie • Bordure orange de sécurité</p>
              </div>
            </div>
            <button onclick="window.ProtecAIBadgeGenerator.closeModal()" class="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center font-bold text-sm cursor-pointer" title="Fermer">
              ✕
            </button>
          </div>

          <!-- Corps de la modale : Formulaire + Prévisualisation -->
          <div class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">

            <!-- Clé API Google AI Studio (si non renseignée ou modifiable) -->
            <div class="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2">
                <span class="text-base">🔑</span>
                <div>
                  <span class="font-bold text-slate-200 block">Clé API Google AI Studio (Gemini / Imagen)</span>
                  <span class="text-[11px] text-slate-400">Nécessaire pour interroger le modèle Imagen 3 (gratuite sur Google AI Studio).</span>
                </div>
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <input type="password" id="ai-badge-api-key-input" value="${savedKey}" placeholder="AIzaSy..." 
                  class="flex-1 sm:w-56 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-orange-500 focus:outline-none" />
                <button type="button" onclick="window.ProtecAIBadgeGenerator.saveApiKeyFromInput()" class="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap">
                  Enregistrer
                </button>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" class="px-2 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 underline whitespace-nowrap" title="Obtenir une clé gratuite">
                  Obtenir une clé ↗
                </a>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">

              <!-- Colonne Gauche : Configuration du Gabarit et Prompt (7 cols) -->
              <div class="lg:col-span-7 space-y-4 text-xs">
                
                <!-- 1. Description du visuel central -->
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <label for="ai-badge-prompt-theme" class="font-bold text-slate-200 flex items-center gap-1.5">
                      <span>🎨</span> Description du visuel central
                    </label>
                    <span class="text-[10px] text-slate-400">En français ou anglais</span>
                  </div>
                  <textarea id="ai-badge-prompt-theme" rows="3" 
                    placeholder="Ex: Deux secouristes de la Protection Civile portant un brancard lors d'un festival de musique en plein air..."
                    class="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-slate-100 text-xs focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 focus:outline-none transition leading-relaxed">${defaultTheme}</textarea>
                  
                  <!-- Suggestions rapides -->
                  <div class="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span class="text-[10px] text-slate-400 font-bold">Idées rapides :</span>
                    <button type="button" onclick="window.ProtecAIBadgeGenerator.injectSamplePrompt('festival')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition cursor-pointer">DPS Festival</button>
                    <button type="button" onclick="window.ProtecAIBadgeGenerator.injectSamplePrompt('inondation')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition cursor-pointer">Crues & Inondations</button>
                    <button type="button" onclick="window.ProtecAIBadgeGenerator.injectSamplePrompt('vpsp')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition cursor-pointer">Ambulance VPSP</button>
                    <button type="button" onclick="window.ProtecAIBadgeGenerator.injectSamplePrompt('cyno')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition cursor-pointer">Équipe Cynophile</button>
                    <button type="button" onclick="window.ProtecAIBadgeGenerator.injectSamplePrompt('neige')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition cursor-pointer">Soutien Naufragés Neige</button>
                  </div>
                </div>

                <!-- 2. Texte supérieur optionnel -->
                <div class="space-y-1.5">
                  <label for="ai-badge-text-top" class="font-bold text-slate-200 flex items-center gap-1.5">
                    <span>🔤</span> Texte supérieur (bannière en tête)
                  </label>
                  <input type="text" id="ai-badge-text-top" placeholder="Ex: PROTECTION CIVILE ou SECOURS A PERSONNES" 
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 focus:outline-none" />
                </div>

                <!-- 3. Couleur de fond de l'écusson -->
                <div class="space-y-2">
                  <label class="font-bold text-slate-200 block">
                    Couleur de fond intérieure du patch :
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <button type="button" id="btn-bg-blue" onclick="window.ProtecAIBadgeGenerator.selectBgPreset('#034181', this)" 
                      class="px-3 py-2 rounded-xl bg-slate-800 border-2 border-orange-500 text-white font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <span class="w-3.5 h-3.5 rounded-full bg-[#034181] border border-white/40"></span>
                      <span>Bleu #034181</span>
                    </button>
                    <button type="button" id="btn-bg-white" onclick="window.ProtecAIBadgeGenerator.selectBgPreset('#FFFFFF', this)" 
                      class="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition">
                      <span class="w-3.5 h-3.5 rounded-full bg-white border border-slate-400"></span>
                      <span>Blanc Pur</span>
                    </button>
                    <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
                      <input type="color" id="ai-badge-bg-color-picker" value="#034181" onchange="window.ProtecAIBadgeGenerator.onCustomColorChange(this.value)" class="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0" />
                      <input type="text" id="ai-badge-bg-color-hex" value="#034181" oninput="window.ProtecAIBadgeGenerator.onCustomColorHexInput(this.value)" class="w-full bg-transparent text-[11px] font-mono font-bold text-slate-200 focus:outline-none uppercase" />
                    </div>
                  </div>
                </div>

                <!-- 4. Options d'éléments réglementaires -->
                <div class="space-y-2.5 p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
                  <span class="font-bold text-slate-300 block text-[11px] uppercase tracking-wider">Éléments graphiques obligatoires / optionnels</span>
                  
                  <label class="flex items-center gap-2.5 cursor-pointer select-none">
                    <input type="checkbox" id="ai-badge-opt-tricolor" checked class="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-900 border-slate-600" />
                    <div>
                      <span class="font-bold text-slate-200 block">Liseré tricolore français (Bleu - Blanc - Rouge)</span>
                      <span class="text-[10px] text-slate-400">Fine bande horizontale en tête, immédiatement sous la bordure orange.</span>
                    </div>
                  </label>

                  <label class="flex items-center gap-2.5 cursor-pointer select-none pt-1 border-t border-slate-700/50">
                    <input type="checkbox" id="ai-badge-opt-civilsymbol" class="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-slate-900 border-slate-600" />
                    <div>
                      <span class="font-bold text-slate-200 block">Emblème international de Protection Civile en bas</span>
                      <span class="text-[10px] text-slate-400">Disque orange avec triangle équilatéral bleu marine centré dans l'arc inférieur.</span>
                    </div>
                  </label>
                </div>

                <!-- Bouton d'action Génération -->
                <div class="pt-2">
                  <button type="button" id="ai-badge-generate-btn" onclick="window.ProtecAIBadgeGenerator.generateBadge()" 
                    class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-110 active:scale-[0.99] text-white font-black text-sm shadow-xl shadow-orange-500/25 transition flex items-center justify-center gap-2.5 cursor-pointer">
                    <span class="text-base">✨</span>
                    <span>Générer l’Écusson via Gemini / Imagen</span>
                  </button>
                </div>

              </div>

              <!-- Colonne Droite : Prévisualisation & Export (5 cols) -->
              <div class="lg:col-span-5 flex flex-col items-center justify-between p-4 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-4">
                
                <div class="w-full text-center">
                  <span class="text-xs font-black uppercase tracking-wider text-slate-400">Prévisualisation du Gabarit</span>
                </div>

                <!-- Conteneur d'affichage de l'image -->
                <div class="relative w-64 h-72 sm:w-72 sm:h-80 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800 bg-slate-900/80 shadow-inner">
                  
                  <!-- État initial vide -->
                  <div id="ai-badge-preview-empty" class="text-center p-6 space-y-2">
                    <div class="w-16 h-20 mx-auto rounded-t-lg rounded-b-full border-4 border-dashed border-orange-500/40 bg-orange-500/5 flex items-center justify-center text-2xl">
                      🛡️
                    </div>
                    <p class="text-xs font-bold text-slate-400">Gabarit réglementaire prêt</p>
                    <p class="text-[10px] text-slate-500">Cliquez sur « Générer » pour créer l'insigne brodé.</p>
                  </div>

                  <!-- État de chargement (Spinner) -->
                  <div id="ai-badge-preview-loading" class="hidden absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
                    <div class="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin"></div>
                    <p class="text-xs font-black text-white">Création par l’IA en cours...</p>
                    <p class="text-[10px] text-slate-400" id="ai-badge-loading-subtitle">Compilation du master prompt et tissage de la broderie...</p>
                  </div>

                  <!-- Image résultat (Canvas pour découpe transparente exacte) -->
                  <canvas id="ai-badge-preview-canvas" width="512" height="600" class="hidden max-w-full max-h-full object-contain filter drop-shadow-xl"></canvas>
                  
                  <!-- Fallback Image brute directe si besoin -->
                  <img id="ai-badge-preview-raw-img" src="" alt="Écusson généré" class="hidden max-w-full max-h-full object-contain rounded-2xl" />
                </div>

                <!-- Indicateur de gabarit respecté -->
                <div class="w-full text-center space-y-1">
                  <div class="flex items-center justify-center gap-2 text-[10px] font-black text-emerald-400">
                    <span>✓ Sommet droit</span>
                    <span>•</span>
                    <span>✓ Flancs verticaux</span>
                    <span>•</span>
                    <span>✓ Bas arrondi semi-circulaire</span>
                  </div>
                </div>

                <!-- Boutons d'exportation (actifs uniquement après génération) -->
                <div id="ai-badge-actions-container" class="w-full space-y-2 pt-2 border-t border-slate-800 hidden">
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="window.ProtecAIBadgeGenerator.downloadBadge(true)" 
                      class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                      <span>📥</span> PNG Détouré
                    </button>
                    <button type="button" onclick="window.ProtecAIBadgeGenerator.downloadBadge(false)" 
                      class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                      <span>🖼️</span> PNG Brut
                    </button>
                  </div>

                  <button type="button" onclick="window.ProtecAIBadgeGenerator.applyBadgeToGame()" 
                    class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                    <span>💾</span>
                    <span id="ai-badge-apply-label">Enregistrer comme Écusson Officiel</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

          <!-- Pied de la modale -->
          <div class="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Modèle d'inférence Imagen 3 Google AI Studio
            </span>
            <button type="button" onclick="window.ProtecAIBadgeGenerator.closeModal()" class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer">
              Fermer
            </button>
          </div>

        </div>
      `;

      if (window.lucide) window.lucide.createIcons();
      this.updateApplyButtonLabel();
    },

    // Fermer la modale
    closeModal() {
      const modal = document.getElementById('ai-badge-generator-modal');
      if (modal) modal.remove();
    },

    // Sauvegarde de la clé API saisie par l'admin
    saveApiKeyFromInput() {
      const input = document.getElementById('ai-badge-api-key-input');
      if (!input) return;
      const key = input.value.trim();
      this.setApiKey(key);
      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Clé API Enregistrée', 'Votre clé Google AI Studio est mémorisée localement.', 'green');
      } else {
        alert('Clé API enregistrée avec succès.');
      }
    },

    // Préréglage de couleur de fond
    selectBgPreset(hex, btn) {
      document.querySelectorAll('#btn-bg-blue, #btn-bg-white').forEach(b => {
        b.classList.remove('border-2', 'border-orange-500');
        b.classList.add('border-slate-700');
      });
      if (btn) {
        btn.classList.add('border-2', 'border-orange-500');
        btn.classList.remove('border-slate-700');
      }
      const picker = document.getElementById('ai-badge-bg-color-picker');
      const hexEl = document.getElementById('ai-badge-bg-color-hex');
      if (picker) picker.value = hex;
      if (hexEl) hexEl.value = hex;
    },

    onCustomColorChange(hex) {
      document.querySelectorAll('#btn-bg-blue, #btn-bg-white').forEach(b => {
        b.classList.remove('border-2', 'border-orange-500');
        b.classList.add('border-slate-700');
      });
      const hexEl = document.getElementById('ai-badge-bg-color-hex');
      if (hexEl) hexEl.value = hex.toUpperCase();
    },

    onCustomColorHexInput(hex) {
      if (/^#[0-9A-F]{6}$/i.test(hex)) {
        const picker = document.getElementById('ai-badge-bg-color-picker');
        if (picker) picker.value = hex;
      }
    },

    // Injection d'exemples de prompts prédéfinis
    injectSamplePrompt(type) {
      const textarea = document.getElementById('ai-badge-prompt-theme');
      if (!textarea) return;
      const samples = {
        festival: "Un binôme secouriste de la Protection Civile avec un brancard pliable veillant sur la foule lors d'un concert de musique de nuit.",
        inondation: "Une barque de sauvetage de la Protection Civile naviguant dans une rue inondée avec deux sauveteurs nautiques casqués aidant des résidents.",
        vpsp: "Une ambulance VPSP de la Protection Civile avec gyrophares allumés de nuit et deux équipiers secouristes en gilets de haute visibilité.",
        cyno: "Un maître-chien secouriste de la Protection Civile avec son berger allemand de recherche en décombres, harnais d'intervention.",
        neige: "Bénévoles distribuant des couvertures de survie et boissons chaudes aux automobilistes bloqués sur autoroute sous une tempête de neige."
      };
      textarea.value = samples[type] || textarea.value;
    },

    // Mise à jour du texte du bouton selon d'où la modale a été ouverte
    updateApplyButtonLabel() {
      const lbl = document.getElementById('ai-badge-apply-label');
      if (!lbl) return;
      if (this.targetInputId) {
        lbl.textContent = "Insérer dans la fiche de l'événement";
      } else {
        lbl.textContent = "Enregistrer comme Écusson Officiel";
      }
    },

    // Compilation du MASTER PROMPT en anglais ultra-rigoureux
    compileMasterPrompt() {
      const themeDesc = document.getElementById('ai-badge-prompt-theme')?.value.trim() || 'First aid rescuers on duty with emergency ambulance';
      const bgColor = document.getElementById('ai-badge-bg-color-picker')?.value || '#034181';
      const hasTricolor = document.getElementById('ai-badge-opt-tricolor')?.checked ?? true;
      const hasCivilSymbol = document.getElementById('ai-badge-opt-civilsymbol')?.checked ?? false;
      const textTop = document.getElementById('ai-badge-text-top')?.value.trim();

      // Conversion couleur en nom clair pour le modèle
      let colorDesc = `solid uniform ${bgColor} hex color`;
      if (bgColor.toUpperCase() === '#034181') {
        colorDesc = `solid French Civil Protection navy blue (#034181)`;
      } else if (bgColor.toUpperCase() === '#FFFFFF') {
        colorDesc = `solid clean pure white (#FFFFFF)`;
      }

      // Construction des segments obligatoires
      const geometrySpec = `The badge has a STRICT REGULATORY RESCUE CREST SHAPE: flat straight horizontal top edge, perfectly straight vertical parallel left and right flanks, and a completely rounded semi-circular curved bottom edge (U-shape / round-bottomed crest). ABSOLUTELY NO pointed tip, NO triangle point, NO pointed chevron at the bottom. It must terminate in a smooth rounded curve.`;
      
      const borderSpec = `The entire patch is tightly bounded by a thick continuous bright emergency safety fluorescent orange (#FF6A00) merrowed embroidered stitched border encircling the perimeter.`;
      
      const backgroundSpec = `The interior field of the patch is ${colorDesc}.`;
      
      const tricolorSpec = hasTricolor 
        ? `Directly underneath the top orange border spans a thin horizontal French national tricolor ribbon banner (blue, white, red horizontal stripes).` 
        : ``;

      const textSpec = textTop 
        ? `At the upper part below the border, there is clean bold embroidered capital lettering reading "${textTop}" in sharp gold or white thread.` 
        : ``;

      const civilSymbolSpec = hasCivilSymbol 
        ? `Centered in the lower curved semi-circular rounded bottom arc of the badge, display the international civil defence symbol: an orange circular medallion containing an equilateral navy blue triangle bordered in crisp white.` 
        : ``;

      const subjectSpec = `In the central illustrated area of the badge: ${themeDesc}. The central artwork must be rendered in high-end tactical embroidered uniform patch style, realistic woven thread texture, vivid contrasts, iconic clean emblem composition.`;

      const qualitySpec = `Professional photorealistic embroidered fabric patch, clean studio lighting, crisp stitching details, isolated on a neutral solid dark background, centered front-facing view, 8k resolution, vector badge insignia art.`;

      const masterPrompt = [
        `High quality official rescue crest uniform patch:`,
        geometrySpec,
        borderSpec,
        backgroundSpec,
        tricolorSpec,
        textSpec,
        subjectSpec,
        civilSymbolSpec,
        qualitySpec
      ].filter(Boolean).join(' ');

      return masterPrompt;
    },

    // Appel à l'API Google Imagen 3 / Gemini
    async generateBadge() {
      let apiKey = this.getApiKey();
      const inputKey = document.getElementById('ai-badge-api-key-input')?.value.trim();
      if (inputKey) {
        apiKey = inputKey;
        this.setApiKey(inputKey);
      }

      if (!apiKey) {
        alert("Veuillez renseigner votre clé API Google AI Studio dans le champ prévu en haut de la modale.");
        document.getElementById('ai-badge-api-key-input')?.focus();
        return;
      }

      const prompt = this.compileMasterPrompt();

      // UI Loading state
      const emptyState = document.getElementById('ai-badge-preview-empty');
      const loadingState = document.getElementById('ai-badge-preview-loading');
      const canvasEl = document.getElementById('ai-badge-preview-canvas');
      const rawImgEl = document.getElementById('ai-badge-preview-raw-img');
      const actionsContainer = document.getElementById('ai-badge-actions-container');
      const generateBtn = document.getElementById('ai-badge-generate-btn');

      if (emptyState) emptyState.classList.add('hidden');
      if (canvasEl) canvasEl.classList.add('hidden');
      if (rawImgEl) rawImgEl.classList.add('hidden');
      if (actionsContainer) actionsContainer.classList.add('hidden');
      if (loadingState) loadingState.classList.remove('hidden');
      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      try {
        let base64Image = null;

        // 1. Tentative avec Imagen 3 (modèle imagen-3.0-generate-002)
        try {
          const endpointImagen = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`;
          const res = await fetch(endpointImagen, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: prompt }],
              parameters: {
                sampleCount: 1,
                aspectRatio: "1:1",
                outputMimeType: "image/png"
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
              base64Image = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
            }
          }
        } catch (e1) {
          console.warn('Imagen 3.0 002 non concluant, tentative fallback...', e1);
        }

        // 2. Fallback avec imagen-3.0-generate-001 si 002 indisponible
        if (!base64Image) {
          try {
            const endpointFallback = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${encodeURIComponent(apiKey)}`;
            const res2 = await fetch(endpointFallback, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: {
                  sampleCount: 1,
                  aspectRatio: "1:1",
                  outputMimeType: "image/png"
                }
              })
            });

            if (res2.ok) {
              const data2 = await res2.json();
              if (data2.predictions && data2.predictions[0] && data2.predictions[0].bytesBase64Encoded) {
                base64Image = `data:image/png;base64,${data2.predictions[0].bytesBase64Encoded}`;
              }
            }
          } catch (e2) {
            console.warn('Fallback Imagen 001 non concluant:', e2);
          }
        }

        // 3. Fallback avec Gemini 2.0 Flash Multimodal Image Generation
        if (!base64Image) {
          try {
            const endpointGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${encodeURIComponent(apiKey)}`;
            const res3 = await fetch(endpointGemini, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
                generationConfig: {
                  responseModalities: ["IMAGE", "TEXT"]
                }
              })
            });

            if (res3.ok) {
              const data3 = await res3.json();
              const candidate = data3.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
              if (candidate && candidate.inlineData?.data) {
                const mime = candidate.inlineData.mimeType || 'image/png';
                base64Image = `data:${mime};base64,${candidate.inlineData.data}`;
              }
            }
          } catch (e3) {
            console.warn('Fallback Gemini 2.0 Image non concluant:', e3);
          }
        }

        if (!base64Image) {
          throw new Error("L'API n'a pas renvoyé d'image. Vérifiez votre clé Google AI Studio et votre quota Imagen.");
        }

        this.currentGeneratedBase64 = base64Image;

        // Découpe et rendu sur le canvas selon le gabarit réglementaire U-Shape
        await this.renderClippedBadgeOnCanvas(base64Image);

        // Affichage des actions
        if (loadingState) loadingState.classList.add('hidden');
        if (canvasEl) canvasEl.classList.remove('hidden');
        if (actionsContainer) actionsContainer.classList.remove('hidden');

        if (window.game && typeof window.game.showToast === 'function') {
          window.game.showToast('Écusson Généré !', 'L’insigne réglementaire U-shape a été créé avec succès par l’IA.', 'green');
        }

      } catch (err) {
        console.error('Erreur génération écusson IA:', err);
        if (loadingState) loadingState.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        alert(`Erreur de génération : ${err.message || 'Impossible de contacter l’API Google'}`);
      } finally {
        if (generateBtn) {
          generateBtn.disabled = false;
          generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
    },

    // Rendu Canvas avec Masque U-Shape Parfait (sommet plat, bords verticaux, bas demi-cercle)
    renderClippedBadgeOnCanvas(imageSrc) {
      return new Promise((resolve) => {
        const canvas = document.getElementById('ai-badge-preview-canvas');
        if (!canvas) {
          resolve(null);
          return;
        }

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Tracé du masque géométrique officiel U-Shape
          // Marge de bordure
          const pad = 12;
          const topY = pad;
          const leftX = pad;
          const rightX = w - pad;
          const radius = (rightX - leftX) / 2;
          const straightHeight = h - pad - radius;

          ctx.save();
          ctx.beginPath();
          // Sommet plat horizontal
          ctx.moveTo(leftX, topY);
          ctx.lineTo(rightX, topY);
          // Côté vertical droit
          ctx.lineTo(rightX, topY + straightHeight);
          // Demi-cercle parfait au bas (arc de 0 à PI)
          ctx.arc(leftX + radius, topY + straightHeight, radius, 0, Math.PI, false);
          // Côté vertical gauche
          ctx.lineTo(leftX, topY);
          ctx.closePath();

          // Clip pour garantir les bords transparents parfaits
          ctx.clip();

          // Dessin de l'image générée par Imagen
          ctx.drawImage(img, 0, 0, w, h);
          ctx.restore();

          // Bordure orange de sécurité (#FF6A00) extérieure de finition
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(leftX, topY);
          ctx.lineTo(rightX, topY);
          ctx.lineTo(rightX, topY + straightHeight);
          ctx.arc(leftX + radius, topY + straightHeight, radius, 0, Math.PI, false);
          ctx.lineTo(leftX, topY);
          ctx.closePath();
          ctx.lineWidth = 14;
          ctx.strokeStyle = '#FF6A00';
          ctx.stroke();

          // Finition fine intérieure blanche discrète
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.stroke();
          ctx.restore();

          this.currentClippedDataUrl = canvas.toDataURL('image/png');
          resolve(this.currentClippedDataUrl);
        };
        img.src = imageSrc;
      });
    },

    // Télécharger le PNG généré (détouré ou brut)
    downloadBadge(isClipped = true) {
      const dataUrl = isClipped ? (this.currentClippedDataUrl || this.currentGeneratedBase64) : this.currentGeneratedBase64;
      if (!dataUrl) return;

      const link = document.createElement('a');
      link.download = `ecusson_myprotec_${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    // Appliquer ou enregistrer l'écusson dans le jeu
    applyBadgeToGame() {
      const dataUrl = this.currentClippedDataUrl || this.currentGeneratedBase64;
      if (!dataUrl) return;

      // 1. Si ouvert depuis un champ cible d'édition admin (ex: adm-badge-url)
      if (this.targetInputId) {
        const input = document.getElementById(this.targetInputId);
        if (input) {
          input.value = dataUrl;
          if (typeof window.ProtecAdmin?.previewBadgeInEditModal === 'function') {
            window.ProtecAdmin.previewBadgeInEditModal();
          }
        }
        if (window.game && typeof window.game.showToast === 'function') {
          window.game.showToast('Écusson Appliqué', 'L’image a été injectée dans la configuration de l’événement.', 'green');
        }
        this.closeModal();
        return;
      }

      // 2. Sinon, proposition d'enregistrement dans la collection globale d'écussons du jeu
      const defaultName = document.getElementById('ai-badge-text-top')?.value.trim() || 'Écusson Officiel IA';
      const badgeName = prompt("Nom de cet écusson pour le réseau MyProtec :", defaultName);
      if (!badgeName) return;

      const newBadge = {
        id: `badge-ai-${Date.now()}`,
        code: `badge_ai_${Date.now()}`,
        name: badgeName,
        category: 'special',
        rarity: 'rare',
        rarityTier: 'Rare',
        rarityColor: 'bg-purple-100 text-purple-800 border-purple-300',
        imageUrl: dataUrl,
        desc: document.getElementById('ai-badge-prompt-theme')?.value.trim() || 'Écusson commémoratif officiel généré par IA.',
        createdAt: new Date().toISOString()
      };

      if (window.ProtecEcussons && Array.isArray(window.ProtecEcussons.catalogue)) {
        window.ProtecEcussons.catalogue.unshift(newBadge);
      }

      if (window.game && typeof window.game.showToast === 'function') {
        window.game.showToast('Écusson Enregistré', `« ${badgeName} » a été ajouté à la collection du jeu.`, 'green');
      }

      this.closeModal();
    }
  };

  // Exposition globale
  window.ProtecAIBadgeGenerator = ProtecAIBadgeGenerator;
  ProtecAIBadgeGenerator.init();

})();
