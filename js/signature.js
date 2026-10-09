/**
 * PROTEC LIVE - SIMULATEUR DE SIGNATURE ET DE PARAPHE OFFICIEL
 * 
 * Permet de signer manuellement (souris, tactile, stylet) les chartes,
 * affiliations nationales FNPC, conventions SAMU, SDIS, SNCF et CUMP.
 * C'est le geste de signature qui valide et déclenche l'action !
 */

window.ProtecSignature = {
  activePads: new Map(),

  /**
   * Attache un simulateur de signature interactif à un conteneur HTML
   * @param {string|HTMLElement} containerOrId - Conteneur ou ID du conteneur
   * @param {Object} options - Configuration du simulateur
   */
  attachPad(containerOrId, options = {}) {
    const container = typeof containerOrId === 'string' 
      ? document.getElementById(containerOrId) 
      : containerOrId;

    if (!container) return null;

    const config = {
      title: options.title || 'Paraphe & Signature du Directeur :',
      subtitle: options.subtitle || 'Signez ci-dessous avec votre souris ou votre doigt pour valider',
      placeholder: options.placeholder || '✍️ Signez ici...',
      height: options.height || 120,
      color: options.color || '#1e3a8a', // Bleu nuit officiel
      lineWidth: options.lineWidth || 2.5,
      requiredLength: options.requiredLength || 35, // Longueur min de trait
      minPoints: options.minPoints || 6,
      stampText: options.stampText || 'PARAPHÉ & VALIDÉ',
      stampSubtext: options.stampSubtext || 'DIRECTEUR D’ANTENNE',
      onSigned: options.onSigned || (() => {}),
      readOnly: options.readOnly || false,
      initialImage: options.initialImage || null
    };

    const padId = `sig-pad-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    container.innerHTML = `
      <div id="${padId}" class="w-full rounded-2xl bg-white border-2 border-dashed border-slate-300 p-3 sm:p-4 shadow-inner space-y-2 relative select-none">
        <div class="flex items-center justify-between text-xs">
          <span class="font-black text-slate-800 flex items-center gap-1.5">
            <span class="text-base">🖋️</span> ${config.title}
          </span>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-400 font-bold uppercase">
              Fait le ${new Date().toLocaleDateString('fr-FR')}
            </span>
            <button type="button" id="${padId}-clear-btn" class="px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
              Effacer ↺
            </button>
          </div>
        </div>

        <div class="relative w-full overflow-hidden rounded-xl bg-slate-50/70 border border-slate-200" style="height: ${config.height}px;">
          <!-- Filigrane incitatif -->
          <div id="${padId}-placeholder" class="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none font-bold text-sm tracking-wide transition-opacity duration-200">
            ${config.placeholder}
          </div>

          <!-- Ligne pointillée de paraphe officiel -->
          <div class="absolute left-6 right-6 bottom-5 border-b border-dashed border-slate-300 pointer-events-none flex items-center justify-between">
            <span class="text-[9px] text-slate-400 font-serif italic">✖ Paraphe officiel</span>
            <span class="text-[9px] text-slate-300 font-mono">MyProtec Live</span>
          </div>

          <!-- Canvas interactif -->
          <canvas id="${padId}-canvas" class="w-full h-full block cursor-crosshair relative z-10 touch-none"></canvas>

          <!-- Tampon officiel d'homologation (apparaît à la validation) -->
          <div id="${padId}-stamp" class="hidden absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div class="border-4 border-emerald-600 text-emerald-700 bg-white/90 backdrop-blur-xs px-4 py-1.5 rounded-xl font-black uppercase text-xs sm:text-sm tracking-wider shadow-lg transform -rotate-3 scale-95 animate-in zoom-in duration-300 text-center">
              <span class="block leading-tight">✓ ${config.stampText}</span>
              <span class="block text-[8px] sm:text-[9px] text-emerald-600 font-bold tracking-widest mt-0.5">${config.stampSubtext} • ${new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span>${config.subtitle}</span>
          <span id="${padId}-status" class="text-indigo-600 font-bold">En attente de signature</span>
        </div>
      </div>
    `;

    const canvas = document.getElementById(`${padId}-canvas`);
    const placeholder = document.getElementById(`${padId}-placeholder`);
    const clearBtn = document.getElementById(`${padId}-clear-btn`);
    const stampEl = document.getElementById(`${padId}-stamp`);
    const statusEl = document.getElementById(`${padId}-status`);

    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let hasStarted = false;
    let isSigned = false;
    let totalLength = 0;
    let pointsCount = 0;
    let lastX = 0, lastY = 0;

    // Ajustement de résolution retina / high DPI
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.strokeStyle = config.color;
      ctx.lineWidth = config.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // Si une image de signature initiale est fournie (lecture seule ou déjà signée)
    if (config.initialImage) {
      const img = new Image();
      img.onload = () => {
        const rect = canvas.getBoundingClientRect();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        if (placeholder) placeholder.style.opacity = '0';
        if (stampEl) stampEl.classList.remove('hidden');
        if (statusEl) {
          statusEl.textContent = 'Signé & Enregistré ✓';
          statusEl.className = 'text-emerald-700 font-bold';
        }
      };
      img.src = config.initialImage;
      if (clearBtn) clearBtn.style.display = 'none';
      return;
    }

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const startDraw = (e) => {
      if (isSigned) return;
      isDrawing = true;
      hasStarted = true;
      if (placeholder) placeholder.style.opacity = '0';
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      pointsCount++;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
    };

    const draw = (e) => {
      if (!isDrawing || isSigned) return;
      const pos = getPos(e);
      const dx = pos.x - lastX;
      const dy = pos.y - lastY;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        totalLength += dist;
        pointsCount++;
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;

        if (statusEl && totalLength > 15) {
          statusEl.textContent = 'Tracé en cours... Relâchez pour valider';
          statusEl.className = 'text-amber-600 font-bold animate-pulse';
        }
      }
    };

    const endDraw = () => {
      if (!isDrawing || isSigned) return;
      isDrawing = false;

      // Contrôle de complétude de la signature
      if (totalLength >= config.requiredLength && pointsCount >= config.minPoints) {
        isSigned = true;
        
        // Verrouillage visuel
        canvas.classList.remove('cursor-crosshair');
        canvas.classList.add('cursor-default');
        if (clearBtn) clearBtn.style.display = 'none';

        // Tampon officiel
        if (stampEl) stampEl.classList.remove('hidden');
        if (statusEl) {
          statusEl.textContent = 'Paraphe validé avec succès ✓';
          statusEl.className = 'text-emerald-600 font-black';
        }

        // Effet audio de succès officiel
        if (window.ProtecAudio && window.ProtecAudio.playSuccessChime) {
          window.ProtecAudio.playSuccessChime();
        }

        const dataUrl = canvas.toDataURL('image/png');

        // Déclenchement de l'action de signature après court délai immersif
        setTimeout(() => {
          config.onSigned(dataUrl);
        }, 450);
      } else if (hasStarted) {
        // Tracé trop court ou simple clic accidentel
        if (statusEl) {
          statusEl.textContent = 'Signature trop courte. Tracez un paraphe complet';
          statusEl.className = 'text-rose-500 font-bold';
        }
      }
    };

    // Événements pointeur (souris, tactile, stylet)
    canvas.addEventListener('pointerdown', startDraw);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', endDraw);
    canvas.addEventListener('pointercancel', endDraw);
    canvas.addEventListener('pointerleave', endDraw);

    // Réinitialisation du tracé
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isSigned) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        isDrawing = false;
        hasStarted = false;
        totalLength = 0;
        pointsCount = 0;
        if (placeholder) placeholder.style.opacity = '1';
        if (statusEl) {
          statusEl.textContent = 'En attente de signature';
          statusEl.className = 'text-indigo-600 font-bold';
        }
      });
    }

    const padInstance = {
      padId,
      canvas,
      clear: () => clearBtn && clearBtn.click(),
      isSigned: () => isSigned,
      getDataUrl: () => canvas.toDataURL('image/png')
    };

    this.activePads.set(padId, padInstance);
    return padInstance;
  },

  /**
   * Ouvre une modale officielle de paraphe pour signer une convention ou un contrat
   * @param {Object} options - Paramètres du document officiel
   */
  openSignatureModal(options = {}) {
    let modal = document.getElementById('official-signature-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'official-signature-modal';
      modal.className = 'fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto custom-scrollbar animate-in fade-in';
      document.body.appendChild(modal);
    }

    const docType = options.type || 'convention';
    const title = options.title || 'Convention Officielle de Sécurité Civile';
    const subtitle = options.subtitle || 'République Française • Direction Préfectorale & Sécurité Civile';
    const institution = options.institution || 'Ministère de l’Intérieur & ARS';
    const partnerName = options.partnerName || 'Direction Régionale';
    const stationName = options.stationName || window.game?.stations?.[0]?.name || 'Antenne Locale de Protection Civile';
    const clauses = options.clauses || [
      'Engagement à mobiliser les personnels qualifiés et matériels homologués.',
      'Respect strict des doctrines opérationnelles et de déontologie secouriste.',
      'Prise d’effet immédiate dès apposition du paraphe officiel du Directeur.'
    ];
    const dotation = options.dotation || null;
    const cost = options.cost || 0;

    modal.innerHTML = `
      <div class="glass-panel-heavy rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl border-2 border-slate-300 text-slate-800 space-y-5 my-6">
        
        <!-- En-tête officiel solennel du document -->
        <div class="flex items-center justify-between pb-4 border-b-2 border-slate-200">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-pc-blue to-indigo-900 text-white flex items-center justify-center text-xl font-black shadow-md flex-shrink-0">
              📜
            </div>
            <div>
              <span class="text-[10px] font-black uppercase text-pc-blue tracking-wider block">${institution}</span>
              <h3 class="text-base sm:text-lg font-black text-slate-900 leading-tight">${title}</h3>
              <p class="text-[11px] text-slate-500">${subtitle}</p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('official-signature-modal').classList.add('hidden')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer transition">✕</button>
        </div>

        <!-- Corps juridique de la convention -->
        <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-50/40 to-slate-50 border border-slate-200 space-y-3.5 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-slate-200/80">
            <div>
              <span class="text-[10px] font-bold text-slate-400 block uppercase">Partie 1 (Autorité Tutélaire)</span>
              <strong class="text-slate-800">${partnerName}</strong>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 block uppercase">Partie 2 (AASC Contractante)</span>
              <strong class="text-pc-blue">${stationName}</strong>
            </div>
          </div>

          <!-- Clauses -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-black uppercase text-slate-600 block tracking-wider">Clauses & Dispositions Conventionnelles :</span>
            <ul class="space-y-1 text-slate-700 list-disc list-inside">
              ${clauses.map(c => `<li class="leading-relaxed font-medium">${c}</li>`).join('')}
            </ul>
          </div>

          <!-- Impact financier / Dotation -->
          <div class="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
            ${cost > 0 ? `
              <div>
                <span class="text-[10px] text-slate-500 block">Frais d'enregistrement :</span>
                <strong class="font-mono text-red-600 font-black">${cost.toLocaleString('fr-FR')} €</strong>
              </div>
            ` : ''}
            ${dotation ? `
              <div>
                <span class="text-[10px] text-slate-500 block">Dotation de mise en route allouée :</span>
                <strong class="font-mono text-emerald-600 font-black">+${dotation.toLocaleString('fr-FR')} €</strong>
              </div>
            ` : ''}
            <div>
              <span class="text-[10px] text-slate-500 block">Effet légal :</span>
              <strong class="text-slate-800 font-bold">Immédiat après signature</strong>
            </div>
          </div>
        </div>

        <!-- ZONE INTERACTIVE DE PARAPHE & SIGNATURE (LE GESTE QUI DÉCLENCHE L'ACTION) -->
        <div id="modal-signature-pad-container" class="space-y-2">
          <!-- Le pad sera injecté ici -->
        </div>

        <div class="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-200">
          <span>Application de la Loi n°2004-811 de Sécurité Civile</span>
          <button type="button" onclick="document.getElementById('official-signature-modal').classList.add('hidden')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition cursor-pointer">
            Annuler
          </button>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');

    // Attachement du simulateur de signature
    setTimeout(() => {
      this.attachPad('modal-signature-pad-container', {
        title: 'Paraphe & Signature du Directeur d’Antenne :',
        subtitle: '✍️ Tracez votre signature avec la souris ou le doigt : elle valide automatiquement la convention',
        stampText: options.stampText || 'CONVENTIONNÉ ✓',
        stampSubtext: options.stampSubtext || partnerName,
        onSigned: (signatureDataUrl) => {
          setTimeout(() => {
            modal.classList.add('hidden');
            if (options.onSigned) options.onSigned(signatureDataUrl);
          }, 400);
        }
      });
    }, 50);
  }
};
