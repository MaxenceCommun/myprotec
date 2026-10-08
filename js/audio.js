/**
 * PROTEC LIVE - GESTIONNAIRE D'EFFETS SONORES IMMERSIFS (Web Audio API)
 * Sons réalistes sans dépendance de fichiers externes (génération synthétique Web Audio) :
 * - Bip radio / Talkie-walkie Motorola & Antarès (Roger beep)
 * - Tonalité 2-tons d'urgence discrète (Pin-Pon feutré de départ réflexe)
 * - Carillon d'alerte d'engagement CODIS / Préfecture
 * - Accord de succès / Signature de contrat
 * - Bip de télémétrie drone / recherche
 */

window.ProtecAudio = {
  ctx: null,
  muted: false,

  init() {
    try {
      this.muted = localStorage.getItem('protec_audio_muted') === 'true';
    } catch (e) {
      this.muted = false;
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

  // 1. BIP RADIO / TALKIE-WALKIE (Roger Beep classique des réseaux de secours)
  playRadioBeep() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // La 5
      osc.frequency.setValueAtTime(1320, now + 0.04); // Mi 6

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  },

  // 2. PIN-PON DEUX-TONS DISCRET (Départ réflexe urgence / SAMU 15 / SDIS)
  playTwoToneSiren() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Tonalité feutrée
      // Note 1 (Pin) : 435 Hz
      osc.frequency.setValueAtTime(435, now);
      // Note 2 (Pon) : 580 Hz
      osc.frequency.setValueAtTime(580, now + 0.22);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.setValueAtTime(0.05, now + 0.40);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.50);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.52);
    } catch (e) {}
  },

  // 3. CARILLON D'ALERTE OPÉRATIONNELLE (Ordre de mission préfectoral / Sinistre)
  playAlertChime() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + (idx * 0.08);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.04, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.36);
      });
    } catch (e) {}
  },

  // 4. ACCORD DE SUCCÈS (Signature devis, contrat mairie, personne retrouvée)
  playSuccessChime() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + (idx * 0.06);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.035, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.40);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.42);
      });
    } catch (e) {}
  },

  // 5. CLIC DISCRET D'INTERFACE
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

  // 6. BIP TÉLÉMÉTRIE DRONE & RECHERCHE CYNO
  playTelemetryPing() {
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }
};

window.ProtecAudio.init();
