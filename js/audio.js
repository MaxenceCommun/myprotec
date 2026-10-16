/**
 * PROTEC LIVE - GESTIONNAIRE D'EFFETS SONORES IMMERSIFS
 * 
 * 6 Sons Officiels Intégrés :
 * 1. notif.mp3        : Messages des bénévoles (sondages, réponses, convocations, relances)
 * 2. info.mp3         : Informations diverses (nouveau devis, nouvelle candidature, etc.)
 * 3. expire.mp3       : Notifications d'information qui expirent (délai devis dépassé, etc.)
 * 4. erreur.mp3       : En cas de problème ou d'erreur (fonds insuffisants, effectif manquant, action refusée)
 * 5. attention.mp3    : Avertissements généraux et vigilances administratives
 * 6. alerte_crise.mp3 : En cas de crise (préalerte et alerte) - PAS les mises à jour
 */

window.ProtecAudio = {
  ctx: null,
  muted: false,
  soundPool: {},

  // Chemins d'accès aux 6 sons officiels
  files: {
    notif: 'sons/notif.mp3',
    info: 'sons/info.mp3',
    expire: 'sons/expire.mp3',
    erreur: 'sons/erreur.mp3',
    attention: 'sons/attention.mp3',
    alerte_crise: 'sons/alerte_crise.mp3',
    'notif.mp3': 'sons/notif.mp3',
    'info.mp3': 'sons/info.mp3',
    'expire.mp3': 'sons/expire.mp3',
    'erreur.mp3': 'sons/erreur.mp3',
    'attention.mp3': 'sons/attention.mp3',
    'alerte_crise.mp3': 'sons/alerte_crise.mp3'
  },

  userInteracted: false,

  init() {
    try {
      this.muted = localStorage.getItem('protec_audio_muted') === 'true';
    } catch (e) {
      this.muted = false;
    }

    // Déblocage propre de l'AudioContext au premier geste utilisateur pour éviter les warnings Chrome
    const unlockHandler = () => {
      this.userInteracted = true;
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('click', unlockHandler);
    };
    window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
    window.addEventListener('click', unlockHandler, { once: true, passive: true });

    // Préchargement léger des 6 fichiers audio mp3
    try {
      const baseKeys = ['notif', 'info', 'expire', 'erreur', 'attention', 'alerte_crise'];
      baseKeys.forEach(key => {
        const url = this.files[key];
        const a = new Audio();
        a.preload = 'auto';
        a.src = url;
        this.soundPool[key] = a;
        this.soundPool[`${key}.mp3`] = a;
      });
    } catch (e) {
      console.warn('Préchargement audio non supporté:', e);
    }
  },

  getCtx() {
    if (this.muted) return null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      // Ne reprendre l'AudioContext que si l'utilisateur a interagi sur la page
      if (this.ctx.state === 'suspended' && this.userInteracted) {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      return null;
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('protec_audio_muted', this.muted ? 'true' : 'false');
    } catch (e) {}
    if (window.game) {
      window.game.showToast('Effets Sonores', this.muted ? 'Sons coupés 🔇' : 'Sons activés 🔊', 'blue');
    }
    return this.muted;
  },

  /**
   * Joue un fichier audio mp3 avec gestion du mute, clonage pour lectures multiples et fallback
   */
  playFile(key) {
    if (this.muted || !key) return;
    const cleanKey = String(key).replace(/^sons\//, '').replace(/\.mp3$/, '');
    const url = this.files[key] || this.files[cleanKey] || `sons/${cleanKey}.mp3`;
    if (!url) return;

    try {
      // Utilisation d'un élément audio autonome pour permettre plusieurs lectures simultanées
      const audio = new Audio(url);
      audio.volume = 0.85;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Si le navigateur bloque l'autoplay direct avant un premier clic, ne pas forcer Web Audio pour éviter les warnings
          if (this.userInteracted) {
            this.playSyntheticFallback(cleanKey);
          }
        });
      }
    } catch (e) {
      if (this.userInteracted) {
        this.playSyntheticFallback(cleanKey);
      }
    }
  },

  // Fallback synthétique en cas de blocage d'autoplay ou d'absence de codec
  playSyntheticFallback(key) {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (key === 'attention' || key === 'alerte_crise') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (key === 'erreur') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(160, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (key === 'expire') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.25);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.05);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (err) {}
  },

  // =========================================================================
  // 5 MÉTHODES PRINCIPALES DEMANDÉES PAR L'UTILISATEUR
  // =========================================================================

  /**
   * 1. notif.mp3 : pour les messages des bénévoles (réponses, dispo, convocations, relances)
   */
  playVolunteerMessageSound() {
    this.playFile('notif');
  },
  playNotifSound() {
    this.playFile('notif');
  },

  /**
   * 2. info.mp3 : pour les informations diverses (nouveau devis, nouvelle candidature, conventions, contrats, etc.)
   */
  playInfoSound() {
    this.playFile('info');
  },

  /**
   * 3. expire.mp3 : pour les notifications d'information qui expirent (devis expiré, délai dépassé)
   */
  playExpireSound() {
    this.playFile('expire');
  },

  /**
   * 4. erreur.mp3 : en cas de problème ou d'erreur (fonds insuffisants, effectif manquant, action refusée)
   */
  playErrorSound() {
    this.playFile('erreur');
  },

  /**
   * 5. attention.mp3 : avertissements administratifs ou vigilances
   */
  playAttentionSound() {
    this.playFile('attention');
  },

  /**
   * 6. alerte_crise.mp3 : en cas de crise (préalerte et alerte de crise majeure) - PAS les mises à jour
   */
  playCrisisAlertSound() {
    this.playFile('alerte_crise');
  },
  playCrisisPrealertSound() {
    this.playFile('alerte_crise');
  },

  /**
   * 7. Son d'annulation ou de levée de préalerte (doux, jamais de sirène d'alerte)
   */
  playCancelSound() {
    this.playFile('expire');
  },
  playPrealertCancelledSound() {
    this.playFile('expire');
  },

  // =========================================================================
  // ROUTEUR INTELLIGENT DE TOASTS ET NOTIFICATIONS
  // Détermine automatiquement le bon son selon le type d'événement
  // =========================================================================
  handleToastAudio(title, message, color = 'blue', target = null) {
    if (this.muted) return;

    // RÈGLE TERRITORIALE STRICTE : Le son d'alerte ne doit être reçu QUE si le joueur est directement concerné
    // (possède au moins une antenne dans le département concerné)
    if (window.game) {
      const g = window.game;
      const playerStationDepts = (g.stations || []).map(s => String(s.departmentCode || '')).filter(Boolean);
      const myDepts = playerStationDepts.length > 0
        ? [...new Set(playerStationDepts)]
        : [String(g.stations?.[0]?.departmentCode || g.player?.departmentCode || g.currentDepartmentCode || '54')];

      // Vérifier le département ciblé par la mission ou le payload
      const targetDept = target?.departmentCode || (target?.id && g.missions?.find(m => m.id === target.id)?.departmentCode);
      if (targetDept && !myDepts.includes(String(targetDept))) {
        return; // Alerte étrangère au département du joueur : silence absolu
      }

      // Vérifier si le titre ou message cible expressément un autre département, ex: [Dpt 75]
      const fullText = (title || '') + ' ' + (message || '');
      const dptMatch = fullText.match(/\[Dpt\s*(\d{2,3}|2[ABab])\]/i);
      if (dptMatch && dptMatch[1] && !myDepts.includes(String(dptMatch[1]))) {
        return; // Département extérieur : aucun son
      }
    }

    const t = (title || '').toLowerCase();
    const m = (message || '').toLowerCase();

    // EXCLUSION STRICTE : Ne jamais émettre de son lors du changement de filtre, thème, apparence, paramètres ou préférences
    if (
      t.includes('filtre') || 
      t.includes('apparence') || 
      t.includes('thème') || 
      t.includes('theme') || 
      t.includes('paramètre') || 
      t.includes('parametre') || 
      t.includes('option') || 
      t.includes('préférence') || 
      t.includes('preference') || 
      t.includes('copié') || 
      t.includes('copie') || 
      t.includes('presse-papier') || 
      t.includes('acronyme') || 
      t.includes('journal') || 
      m.includes('thème sélectionné') || 
      m.includes('mode sombre') || 
      m.includes('mode clair') || 
      m.includes('presse-papier')
    ) {
      return;
    }

    // EXCLUSION STRICTE : Ne jamais émettre de son pour les notes de frais, repas ou remboursements
    const isNdf = t.includes('note de frais') || t.includes('notes de frais') || 
                  m.includes('note de frais') || m.includes('notes de frais') || 
                  t.includes('ndf') || m.includes('ndf') || 
                  (t.includes('repas') && !t.includes('crise') && !t.includes('orsec'));
    if (isNdf) {
      return;
    }

    // RÈGLE STRICTE : Préalerte annulée ou levée -> Son d'annulation dédié, JAMAIS de sirène d'alerte de crise
    const isCancellationOrLifted = 
      t.includes('levée') || t.includes('levee') || m.includes('levée') || m.includes('levee') ||
      t.includes('annul') || m.includes('annul') ||
      t.includes('démobilis') || t.includes('demobilis') || m.includes('démobilis') || m.includes('demobilis') ||
      t.includes('veille simple') || m.includes('veille simple') ||
      m.includes('lève le dispositif') || m.includes('leve le dispositif') ||
      m.includes('situation maîtrisée') || m.includes('situation maitrisee');

    if (isCancellationOrLifted) {
      this.playCancelSound();
      return;
    }

    // RÈGLE PERSONNALISÉE : Respect strict des 3 statuts et du son configuré par le joueur
    if (window.ProtecNotifications && typeof window.ProtecNotifications.getAlertMode === 'function') {
      let matchedCategory = null;
      if (t.includes('samu') || m.includes('samu') || target?.type === 'samu') {
        matchedCategory = 'samu';
      } else if (t.includes('sdis') || m.includes('sdis') || t.includes('pompier') || m.includes('pompier') || target?.type === 'pompiers') {
        matchedCategory = 'sdis';
      } else if (t.includes('dps') || m.includes('dps') || t.includes('devis') || m.includes('devis') || target?.type === 'devis' || target?.type === 'dps') {
        matchedCategory = 'dps';
      } else if (t.includes('candidature') || m.includes('candidature') || t.includes('recrutement') || m.includes('recrutement') || target?.type === 'rh') {
        matchedCategory = 'rh';
      } else if (t.includes('météo') || t.includes('meteo') || t.includes('vigilance') || m.includes('météo') || m.includes('meteo') || target?.type === 'meteo') {
        matchedCategory = 'weather';
      }

      if (matchedCategory) {
        const mode = window.ProtecNotifications.getAlertMode(matchedCategory);
        if (mode === 'off') {
          return; // Alerte désactivée par le joueur : silence total
        }
        const customSound = window.ProtecNotifications.getAlertSound(matchedCategory);
        if (customSound) {
          this.playFile(customSound);
          return;
        }
      }
    }

    // RÈGLE STRICTE 1 : Exclure impérativement les simples demandes de renfort !
    const isRenfort = t.includes('renfort') || m.includes('renfort') || t.includes('alliance');

    // RÈGLE STRICTE 2 : Exclure impérativement les simples mises à jour, évolutions, sitreps, relèves, clôtures
    const isUpdate = t.includes('mise à jour') || m.includes('mise à jour') ||
                     t.includes('évolution') || m.includes('évolution') ||
                     t.includes('sitrep') || m.includes('sitrep') ||
                     t.includes('point de situation') || m.includes('point de situation') ||
                     t.includes('bulletin') || m.includes('bulletin') ||
                     t.includes('journal') || m.includes('journal') ||
                     t.includes('relève') || m.includes('relève') ||
                     t.includes('clôture') || m.includes('clôture') ||
                     t.includes('terminée') || m.includes('terminée') ||
                     t.includes('réussie') || m.includes('réussie') ||
                     t.includes('engagé') || m.includes('engagé') ||
                     t.includes('vecteur') || m.includes('vecteur') ||
                     t.includes('astreinte') || m.includes('bénévole sur base');

    // 1. Alertes de crises (départementale, préalerte, plan d'urgence, alerte confirmée, NOVI, ORSEC)
    // Se déclenche sur : préalerte ET alerte - mais JAMAIS sur les simples mises à jour, ni notes de frais, ni annulations/levées
    const isCrisisAlertOrPrealert = !isRenfort && !isUpdate && !isNdf && !isCancellationOrLifted && (
      t.includes('préalerte') || t.includes('prealerte') || m.includes('préalerte') || m.includes('prealerte') ||
      t.includes('alerte de crise') || m.includes('alerte de crise') ||
      t.includes('crise départementale') || m.includes('crise départementale') ||
      t.includes('plan d\'urgence déclenché') || m.includes('plan d\'urgence déclenché') ||
      t.includes('alerte réelle confirmée') || m.includes('alerte réelle confirmée') ||
      t.includes('alerte active') || m.includes('alerte active') ||
      t.includes('scénario déclenché') || m.includes('scénario déclenché') ||
      ((t.includes('crise') || t.includes('novi') || t.includes('orsec') || t.includes('catastrophe') || target?.type === 'crise') &&
       (t.includes('alerte') || t.includes('déclench') || m.includes('déclench') || m.includes('alerte') || target?.isNewCrisis || color === 'red'))
    );

    if (isCrisisAlertOrPrealert) {
      this.playCrisisAlertSound();
      return;
    }

    // 2. Notifications d'expiration (devis expirés, délais dépassés)
    const isExpired = t.includes('expir') || m.includes('expir') || 
                      t.includes('délai dépassé') || m.includes('délai dépassé') ||
                      t.includes('temps écoulé') || m.includes('temps écoulé');
    if (isExpired) {
      this.playExpireSound();
      return;
    }

    // 3. Problème ou erreur
    const isError = color === 'red' ||
      t.includes('erreur') || m.includes('erreur') ||
      t.includes('problème') || m.includes('problème') ||
      t.includes('impossible') || m.includes('impossible') ||
      t.includes('insuffisant') || m.includes('insuffisant') ||
      t.includes('manquant') || m.includes('manquant') ||
      t.includes('restreint') || m.includes('restreint') ||
      t.includes('refus') || m.includes('refus') ||
      t.includes('bloqué') || m.includes('bloqué') ||
      t.includes('requis !') || m.includes('requis !');

    if (isError) {
      this.playErrorSound();
      return;
    }

    // 4. Messages des bénévoles (réponses sondage, dispo, indispo, notes internes)
    const isVolunteerMsg = t.includes('dispo') || m.includes('dispo') ||
      t.includes('sondage') || m.includes('sondage') ||
      t.includes('bénévole') || m.includes('bénévole') ||
      t.includes('secouriste') || m.includes('secouriste') ||
      t.includes('relance') || m.includes('relance') ||
      t.includes('convocation') || m.includes('convocation');

    if (isVolunteerMsg) {
      this.playVolunteerMessageSound();
      return;
    }

    // 5. Informations diverses (nouveau devis, nouvelle candidature, conventions, stages, etc.)
    this.playInfoSound();
  },

  // =========================================================================
  // MÉTHODES DE RÉTROCOMPATIBILITÉ (Mappées sur les nouveaux sons et effets)
  // =========================================================================
  playRadioBeep() {
    this.playFile('notif');
  },

  playTwoToneSiren() {
    this.playFile('attention');
  },

  playAlertChime() {
    this.playFile('attention');
  },

  playAlertSound() {
    this.playFile('attention');
  },

  playSuccessChime() {
    this.playFile('info');
  },

  playContractSignedSound() {
    this.playSuccessChime();
  },

  playClickSound() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  },

  playTelemetryPing() {
    this.playClickSound();
  }
};

window.ProtecAudio.init();
