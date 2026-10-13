/**
 * PROTEC LIVE - GESTIONNAIRE D'EFFETS SONORES IMMERSIFS
 * 
 * 5 Sons Officiels Intégrés :
 * 1. notif.mp3    : Messages des bénévoles (sondages, réponses, convocations, relances)
 * 2. info.mp3     : Informations diverses (nouveau devis, nouvelle candidature, etc.)
 * 3. expire.mp3   : Notifications d'information qui expirent (délai devis dépassé, etc.)
 * 4. erreur.mp3   : En cas de problème ou d'erreur (fonds insuffisants, effectif manquant, action refusée)
 * 5. attention.mp3: En cas d'alertes de crises (départementale, zone de défense ou nationale - hors renforts)
 */

window.ProtecAudio = {
  ctx: null,
  muted: false,
  soundPool: {},

  // Chemins d'accès aux 5 sons officiels
  files: {
    notif: 'sons/notif.mp3',
    info: 'sons/info.mp3',
    expire: 'sons/expire.mp3',
    erreur: 'sons/erreur.mp3',
    attention: 'sons/attention.mp3'
  },

  init() {
    try {
      this.muted = localStorage.getItem('protec_audio_muted') === 'true';
    } catch (e) {
      this.muted = false;
    }

    // Préchargement léger des fichiers audio
    try {
      Object.entries(this.files).forEach(([key, url]) => {
        const a = new Audio();
        a.preload = 'auto';
        a.src = url;
        this.soundPool[key] = a;
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
      if (this.ctx.state === 'suspended') {
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
    if (this.muted) return;
    const url = this.files[key];
    if (!url) return;

    try {
      // Utilisation d'un élément audio autonome pour permettre plusieurs lectures simultanées
      const audio = new Audio(url);
      audio.volume = 0.85;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Si le navigateur bloque l'autoplay direct sans interaction préalable, fallback Web Audio synthétique
          this.playSyntheticFallback(key);
        });
      }
    } catch (e) {
      this.playSyntheticFallback(key);
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

      if (key === 'attention') {
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
   * 5. attention.mp3 : en cas d'alertes de crises départementale, zone de défense ou nationale (PAS les demandes de renfort, les crises)
   */
  playCrisisAlertSound() {
    this.playFile('attention');
  },

  // =========================================================================
  // ROUTEUR INTELLIGENT DE TOASTS ET NOTIFICATIONS
  // Détermine automatiquement le bon son selon le type d'événement
  // =========================================================================
  handleToastAudio(title, message, color = 'blue', target = null) {
    if (this.muted) return;
    const t = (title || '').toLowerCase();
    const m = (message || '').toLowerCase();

    // 1. Alertes de crises (départementale, zone de défense, nationale)
    // RÈGLE STRICTE : Exclure impérativement les simples demandes de renfort !
    const isRenfort = t.includes('renfort') || m.includes('renfort') || t.includes('alliance');
    const isCrisis = !isRenfort && (
      t.includes('crise') || m.includes('crise') ||
      t.includes('novi') || m.includes('novi') ||
      t.includes('orsec') || m.includes('orsec') ||
      t.includes('catastrophe') || m.includes('catastrophe') ||
      t.includes('plan d\'urgence') || m.includes('plan d\'urgence') ||
      t.includes('zone de défense') || m.includes('zone de défense') ||
      t.includes('alerte préfectorale') || m.includes('alerte préfectorale') ||
      target?.type === 'crise'
    );

    if (isCrisis) {
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

  playSuccessChime() {
    this.playFile('info');
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
